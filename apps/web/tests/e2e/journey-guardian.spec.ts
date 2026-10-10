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

// Blueprint §19.3 Journey B — Guardian:
// register -> complete guardian profile -> create a listing -> publish it
// -> review an application -> update the application status -> communicate
// with the tutor.
//
// "Publish it" requires admin approval (ListingStatus DRAFT ->
// PENDING_REVIEW -> PUBLISHED), and there is no self-service way to become
// an admin (docs/decisions/0001-phase-0-mvp-scope.md), so this test
// bootstraps a one-off ADMIN account via grantRole (see db-test-utils.ts)
// and then drives the actual approval through the real /admin/listings UI.
// Everything else — including the tutor side needed to produce an incoming
// application — goes through the browser.
test.afterAll(async () => {
  await disconnectDb();
});

test('a guardian can publish a listing, review an application, update its status, and message the tutor', async ({
  browser,
  page,
}) => {
  const listingTitle = `Physics tutor wanted — ${uniqueEmail('listing').split('@')[0]}`;

  // --- Guardian: register, profile, listing. ---
  await registerAs(page, 'Guardian looking for a tutor', 'journey-b-guardian');
  await completeGuardianProfile(page, 'Journey B Guardian');

  const listingId = await createAndSubmitListing(page, {
    title: listingTitle,
    subject: 'Physics',
    grade: 'Class 10',
    area: 'Banani',
  });

  // Publish it: bootstrap an admin and approve through the real admin UI.
  await approveListingAsAdmin(browser, listingTitle);

  // Confirm the guardian can see it went live.
  await page.goto('/dashboard');
  const listingRow = page.locator('div.rounded-xl').filter({ hasText: listingTitle }).filter({ hasText: 'Published' });
  await expect(listingRow).toBeVisible();

  // The public listing page now accepts applications.
  await page.goto(`/tuition/${listingId}`);
  await expect(page.getByRole('heading', { name: listingTitle })).toBeVisible();

  // --- Tutor side (separate browser context): apply to the listing. ---
  const tutorContext = await browser.newContext();
  const tutorPage = await tutorContext.newPage();
  await registerAs(tutorPage, 'Tutor', 'journey-b-tutor');
  await completeMinimalTutorProfile(tutorPage, {
    fullName: 'Journey B Tutor',
    subject: 'Physics',
    grade: 'Class 10',
    area: 'Mirpur',
  });

  await tutorPage.goto(`/tuition/${listingId}`);
  await tutorPage.getByRole('button', { name: 'Apply for this tuition' }).click();
  await tutorPage.getByLabel('Introduce yourself (optional)').fill('I specialize in O-Level physics.');
  await tutorPage.getByRole('button', { name: 'Send application' }).click();
  await expect(tutorPage.getByText('Your application', { exact: true })).toBeVisible();

  // --- Guardian: review the incoming application and update its status. ---
  await page.goto(`/listings/${listingId}/applicants`);
  await expect(page.getByRole('heading', { name: `Applicants for "${listingTitle}"` })).toBeVisible();

  const applicantCard = page.locator('div.rounded-2xl').filter({ hasText: 'Journey B Tutor' });
  await expect(applicantCard).toHaveCount(1);
  await expect(applicantCard.getByText('Submitted', { exact: true })).toBeVisible();
  await expect(applicantCard.getByText('I specialize in O-Level physics.')).toBeVisible();

  await applicantCard.getByRole('button', { name: 'Shortlist' }).click();
  await expect(applicantCard.getByText('Shortlisted', { exact: true })).toBeVisible();

  // --- Guardian: communicate with the tutor now that messaging has unlocked. ---
  await applicantCard.getByRole('button', { name: 'Message' }).click();
  await expect(page).toHaveURL(/\/messages\/[0-9a-fA-F-]+$/);
  await expect(page.getByRole('heading', { name: 'Journey B Tutor' })).toBeVisible();

  await page.getByPlaceholder('Write a message…').fill('Thanks for applying — are you free on Saturdays?');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Thanks for applying — are you free on Saturdays?')).toBeVisible();

  // The tutor sees the same message from their side.
  await tutorPage.goto('/applications');
  const tutorApplicationRow = tutorPage
    .locator('div.rounded-xl')
    .filter({ hasText: listingTitle })
    .filter({ hasText: 'Shortlisted' });
  await tutorApplicationRow.getByRole('button', { name: 'Message' }).click();
  await expect(tutorPage).toHaveURL(/\/messages\/[0-9a-fA-F-]+$/);
  await expect(tutorPage.getByText('Thanks for applying — are you free on Saturdays?')).toBeVisible();

  await tutorContext.close();
});
