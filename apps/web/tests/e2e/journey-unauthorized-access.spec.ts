import { expect, test } from '@playwright/test';
import {
  approveListingAsAdmin,
  completeGuardianProfile,
  completeMinimalTutorProfile,
  createAndSubmitListing,
  registerAs,
  uniqueEmail,
} from './test-helpers';
import { disconnectDb } from './db-test-utils';

// Blueprint §19.3 Journey D — Unauthorized access:
// sign in as one user -> attempt to access another user's private resource
// -> confirm access is denied -> confirm no sensitive data appears in the
// response.
//
// One signed-in outsider tries two different private resources belonging
// to other accounts — a guardian's listing-management pages, and later a
// conversation they're not a participant in — each time checked both at
// the UI level and, with the outsider's own bearer token, directly against
// the API response. A single listing is reused across both probes (while
// it's still PENDING_REVIEW for the first probe, then again once published
// and shortlisted for the second) to avoid standing up more throwaway
// accounts than the journey needs — registration and login both sit behind
// a strict IP rate limit (ThrottlerModule.forRoot in apps/api/src/app.module.ts),
// so this suite is deliberately economical with how many accounts each
// test creates.
test.afterAll(async () => {
  await disconnectDb();
});

test('an outsider cannot view another guardian\'s listing, and later cannot open a conversation they are not part of — the API agrees both times', async ({
  browser,
}) => {
  const listingTitle = `Confidential tuition — ${uniqueEmail('listing').split('@')[0]}`;
  const secretMessage = 'Our address is 42 Secret Road — please keep this between us.';

  const guardianContext = await browser.newContext();
  const guardianPage = await guardianContext.newPage();
  await registerAs(guardianPage, 'Guardian looking for a tutor', 'journey-d-guardian');
  await completeGuardianProfile(guardianPage, 'Journey D Guardian');
  const listingId = await createAndSubmitListing(guardianPage, {
    title: listingTitle,
    subject: 'English',
    grade: 'Class 6',
    area: 'Bashundhara',
  });

  // --- Outsider, signed in once, used for both probes below. ---
  const outsiderContext = await browser.newContext();
  const outsiderPage = await outsiderContext.newPage();
  await registerAs(outsiderPage, 'Guardian looking for a tutor', 'journey-d-outsider');

  let outsiderToken: string | undefined;
  outsiderPage.on('request', (req) => {
    const auth = req.headers()['authorization'];
    if (auth && !outsiderToken) outsiderToken = auth;
  });

  // --- Probe 1: the listing is still PENDING_REVIEW, owned by someone else. ---
  const [editApiResponse] = await Promise.all([
    outsiderPage.waitForResponse((res) => res.url().includes(`/users/me/listings/${listingId}`)),
    outsiderPage.goto(`/listings/${listingId}/edit`),
  ]);
  expect(editApiResponse.status()).toBe(404);
  const editApiBody = await editApiResponse.text();
  expect(editApiBody).not.toContain(listingTitle);
  expect(editApiBody).not.toContain('Bashundhara');

  await expect(outsiderPage.getByText("This listing isn't available")).toBeVisible();
  const editPageText = await outsiderPage.locator('body').innerText();
  expect(editPageText).not.toContain(listingTitle);

  await outsiderPage.goto(`/listings/${listingId}/applicants`);
  await expect(outsiderPage.getByText('Listing not found')).toBeVisible();
  const applicantsPageText = await outsiderPage.locator('body').innerText();
  expect(applicantsPageText).not.toContain(listingTitle);

  // --- Publish the listing, have a tutor apply, and shortlist into a conversation. ---
  await approveListingAsAdmin(browser, listingTitle);

  const tutorContext = await browser.newContext();
  const tutorPage = await tutorContext.newPage();
  await registerAs(tutorPage, 'Tutor', 'journey-d-tutor');
  await completeMinimalTutorProfile(tutorPage, {
    fullName: 'Journey D Tutor',
    subject: 'English',
    grade: 'Class 6',
    area: 'Badda',
  });
  await tutorPage.goto(`/tuition/${listingId}`);
  await tutorPage.getByRole('button', { name: 'Apply for this tuition' }).click();
  await tutorPage.getByRole('button', { name: 'Send application' }).click();
  await expect(tutorPage.getByText('Your application', { exact: true })).toBeVisible();
  await tutorContext.close();

  await guardianPage.goto(`/listings/${listingId}/applicants`);
  const applicantCard = guardianPage.locator('div.rounded-2xl').filter({ hasText: 'Journey D Tutor' });
  await applicantCard.getByRole('button', { name: 'Shortlist' }).click();
  await applicantCard.getByRole('button', { name: 'Message' }).click();
  await expect(guardianPage).toHaveURL(/\/messages\/([0-9a-fA-F-]+)$/);
  const conversationId = /\/messages\/([0-9a-fA-F-]+)$/.exec(guardianPage.url())![1];

  await guardianPage.getByPlaceholder('Write a message…').fill(secretMessage);
  await guardianPage.getByRole('button', { name: 'Send' }).click();
  await expect(guardianPage.getByText(secretMessage)).toBeVisible();
  await guardianContext.close();

  // --- Probe 2: the same outsider tries the resulting conversation. ---
  await outsiderPage.goto(`/messages/${conversationId}`);
  await expect(
    outsiderPage.getByText("This conversation doesn't exist, or you don't have access to it."),
  ).toBeVisible();
  const conversationPageText = await outsiderPage.locator('body').innerText();
  expect(conversationPageText).not.toContain(secretMessage);
  expect(conversationPageText).not.toContain('Journey D Guardian');

  // The conversation page itself never issues a messages request for a
  // conversation the outsider isn't part of, so query the API directly
  // with the outsider's own bearer token to confirm it would be refused
  // even on a direct call, not merely that the UI never tries.
  expect(outsiderToken).toBeTruthy();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const apiResponse = await outsiderPage.request.get(`${apiBase}/conversations/${conversationId}/messages`, {
    headers: { Authorization: outsiderToken! },
  });
  expect(apiResponse.status()).toBe(404);
  const apiBody = await apiResponse.text();
  expect(apiBody).not.toContain(secretMessage);
  expect(apiBody).not.toContain('Secret Road');

  await outsiderContext.close();
});
