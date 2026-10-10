import { expect, test } from '@playwright/test';
import { completeMinimalTutorProfile, loginAs, registerAs } from './test-helpers';
import { disconnectDb, grantRole } from './db-test-utils';

// Blueprint §19.3 Journey C — Verification:
// request verification -> submit evidence through the authorized upload
// process -> review the request as an authorized reviewer -> approve or
// reject it -> confirm that public profile data exposes only the permitted
// status.
//
// Reviewing requires a VERIFIER (or ADMIN) account, which — per
// docs/decisions/0001-phase-0-mvp-scope.md — has no self-service signup
// path. This test bootstraps that one role grant directly via grantRole()
// (see db-test-utils.ts) and does everything else, including the decision
// itself, through the real /admin/verifications UI.

// A minimal, genuinely valid 1x1 PNG (not just a renamed text file) — the
// backend checks the file's actual magic bytes against the declared
// content type (VerificationsService.assertEvidenceUploadedAndValid), so a
// fake file would be rejected at "Submit for review".
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

test.afterAll(async () => {
  await disconnectDb();
});

test('a tutor can request verification, submit evidence, get approved, and the public profile shows only the badge', async ({
  browser,
  page,
}) => {
  await registerAs(page, 'Tutor', 'journey-c-tutor');
  await completeMinimalTutorProfile(page, {
    fullName: 'Journey C Tutor',
    subject: 'Chemistry',
    grade: 'Class 8',
    area: 'Uttara',
  });

  const publicProfileHref = await page.getByRole('link', { name: 'View public profile' }).getAttribute('href');
  expect(publicProfileHref).toBeTruthy();

  // Request verification.
  await page.goto('/verification');
  await expect(page.getByRole('heading', { name: 'Verification' })).toBeVisible();
  await page.getByRole('button', { name: 'University affiliation' }).click();
  await expect(page.getByText('Gathering evidence')).toBeVisible();

  // Submit evidence through the authorized upload process: a presigned-URL
  // request to the API, then a direct PUT to private object storage (see
  // features/verifications/api.ts) — exercised here through the real file
  // input and "Upload evidence" button, not called directly.
  await page.locator('#evidence-file').setInputFiles({
    name: 'student-id.png',
    mimeType: 'image/png',
    buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
  });
  await page.getByRole('button', { name: 'Upload evidence' }).click();
  await expect(page.getByText('student-id.png')).toBeVisible();

  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(page.getByText('Under review', { exact: true })).toBeVisible();
  await expect(page.getByText('A reviewer will check your evidence soon.')).toBeVisible();

  // --- Reviewer side (separate browser context): bootstrap a VERIFIER and decide. ---
  const reviewerContext = await browser.newContext();
  const reviewerPage = await reviewerContext.newPage();
  const reviewer = await registerAs(reviewerPage, 'Guardian looking for a tutor', 'journey-c-verifier');
  await grantRole(reviewer.email, 'VERIFIER');
  await loginAs(reviewerPage, reviewer);

  await reviewerPage.goto('/admin/verifications');
  await expect(reviewerPage.getByRole('heading', { name: 'Verification queue' })).toBeVisible();

  const queueCard = reviewerPage.locator('div.rounded-2xl').filter({ hasText: 'Journey C Tutor' });
  await expect(queueCard).toHaveCount(1);
  await expect(queueCard.getByText('student-id.png')).toBeVisible();

  await queueCard.getByRole('button', { name: 'Approve' }).click();
  await expect(queueCard).toHaveCount(0);

  await reviewerContext.close();

  // Tutor sees the decision reflected on their own verification page.
  await page.goto('/verification');
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();

  // --- Public, unauthenticated view: only the permitted status is exposed. ---
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(publicProfileHref!);

  await expect(publicPage.getByRole('heading', { name: 'Journey C Tutor' })).toBeVisible();
  await expect(publicPage.getByText('Verified', { exact: true })).toBeVisible();

  const bodyText = await publicPage.locator('body').innerText();
  expect(bodyText).not.toContain('student-id.png');
  expect(bodyText.toLowerCase()).not.toContain(reviewer.email.toLowerCase());
  expect(bodyText).not.toContain('Evidence');

  // Confirm the underlying API response is equally minimal, not just the
  // rendered page — the public tutor DTO should carry a plain `isVerified`
  // boolean, never evidence or reviewer identity.
  const tutorId = new URL(publicProfileHref!, publicPage.url()).pathname.split('/').pop();
  const apiRes = await publicPage.request.get(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/tutors/${tutorId}`,
  );
  expect(apiRes.ok()).toBeTruthy();
  const body = await apiRes.text();
  expect(body).not.toContain('student-id.png');
  expect(body).not.toContain('evidence');
  expect(body).not.toContain('assignedVerifier');
  expect(body).not.toContain(reviewer.email);

  await publicContext.close();
});
