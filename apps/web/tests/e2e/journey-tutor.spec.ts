import { expect, test } from '@playwright/test';
import {
  approveListingAsAdmin,
  completeMinimalTutorProfile,
  createAndSubmitListing,
  completeGuardianProfile,
  registerAs,
  uniqueEmail,
} from './test-helpers';
import { disconnectDb } from './db-test-utils';

// Blueprint §19.3 Journey A — Tutor:
// register -> complete tutor profile -> search tuition -> open a listing
// -> apply -> view application status -> open an authorized conversation.
//
// Messaging only unlocks once the listing owner has shortlisted the
// application (decision record §4.2 / §4.4), so this test also drives a
// second, guardian-side browser context through the real UI to publish a
// listing and then shortlist the tutor's application — there is no DB
// shortcut for that; see test-helpers.ts and db-test-utils.ts for the one
// deliberate exception (bootstrapping the ADMIN account needed to approve
// the listing, since the product has no self-service path to that role).
test.afterAll(async () => {
  await disconnectDb();
});

test('a tutor can register, build a profile, apply to a listing, and message the guardian once shortlisted', async ({
  browser,
  page,
}) => {
  const listingTitle = `Math tutor needed — ${uniqueEmail('listing').split('@')[0]}`;

  // --- Guardian side (separate browser context): publish a listing. ---
  const guardianContext = await browser.newContext();
  const guardianPage = await guardianContext.newPage();
  await registerAs(guardianPage, 'Guardian looking for a tutor', 'journey-a-guardian');
  await completeGuardianProfile(guardianPage, 'Journey A Guardian');
  const listingId = await createAndSubmitListing(guardianPage, {
    title: listingTitle,
    subject: 'Mathematics',
    grade: 'Class 9',
    area: 'Dhanmondi',
  });

  await approveListingAsAdmin(browser, listingTitle);

  // --- Tutor side (the journey under test). ---
  await registerAs(page, 'Tutor', 'journey-a-tutor');
  await completeMinimalTutorProfile(page, {
    fullName: 'Journey A Tutor',
    subject: 'Mathematics',
    grade: 'Class 9',
    area: 'Gulshan',
  });

  // Search tuition opportunities.
  await page.goto('/tuition');
  await expect(page.getByRole('heading', { name: 'Find tuition' })).toBeVisible();
  await page.getByRole('combobox', { name: /subject/i }).click();
  await page.getByRole('option', { name: 'Mathematics' }).click();
  await expect(page).toHaveURL(/subjectId=/);

  // Open the listing.
  await page.getByRole('link', { name: listingTitle }).click();
  await expect(page).toHaveURL(new RegExp(`/tuition/${listingId}$`));
  await expect(page.getByRole('heading', { name: listingTitle })).toBeVisible();

  // Apply.
  await page.getByRole('button', { name: 'Apply for this tuition' }).click();
  await page.getByLabel('Introduce yourself (optional)').fill('I would love to help with algebra.');
  await page.getByRole('button', { name: 'Send application' }).click();
  await expect(page.getByText('Your application', { exact: true })).toBeVisible();
  await expect(page.getByText('Submitted', { exact: true })).toBeVisible();

  // View the application status from the tutor's own application list.
  await page.goto('/applications');
  await expect(page.getByRole('heading', { name: 'My applications' })).toBeVisible();
  const applicationRow = page.locator('div.rounded-xl').filter({ hasText: listingTitle }).filter({ hasText: 'Submitted' });
  await expect(applicationRow).toBeVisible();

  // --- Guardian side again: shortlist the application to unlock messaging. ---
  await guardianPage.goto(`/listings/${listingId}/applicants`);
  await expect(guardianPage.getByRole('heading', { name: `Applicants for "${listingTitle}"` })).toBeVisible();
  const applicantCard = guardianPage.locator('div.rounded-2xl').filter({ hasText: 'Journey A Tutor' });
  await expect(applicantCard).toHaveCount(1);
  await applicantCard.getByRole('button', { name: 'Shortlist' }).click();
  await expect(applicantCard.getByText('Shortlisted', { exact: true })).toBeVisible();

  // --- Tutor side: open the now-authorized conversation. ---
  await page.goto('/applications');
  const shortlistedRow = page.locator('div.rounded-xl').filter({ hasText: listingTitle }).filter({ hasText: 'Shortlisted' });
  await expect(shortlistedRow).toBeVisible();
  await shortlistedRow.getByRole('button', { name: 'Message' }).click();
  await expect(page).toHaveURL(/\/messages\/[0-9a-fA-F-]+$/);
  await expect(page.getByRole('heading', { name: 'Journey A Guardian' })).toBeVisible();

  await page.getByPlaceholder('Write a message…').fill('Hello! Looking forward to helping.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Hello! Looking forward to helping.')).toBeVisible();

  await guardianContext.close();
});
