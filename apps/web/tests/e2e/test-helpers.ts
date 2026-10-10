import type { Browser, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { grantRole } from './db-test-utils';

/** Matches auth.spec.ts's local helper of the same name — kept here so the
 * other journey specs share one implementation instead of redefining it. */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@test.amr-tutor.invalid`;
}

export const TEST_PASSWORD = 'StrongPassword123!';

export interface Account {
  email: string;
  password: string;
}

/** Registers a brand-new account through the real /register form. */
export async function registerAs(
  page: Page,
  roleLabel: 'Tutor' | 'Guardian looking for a tutor',
  emailPrefix: string,
): Promise<Account> {
  const email = uniqueEmail(emailPrefix);
  const password = TEST_PASSWORD;

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('checkbox', { name: roleLabel, exact: true }).check();
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  return { email, password };
}

/** Logs in through the real /login form — used after grantRole() so a fresh token picks up the new role. */
export async function loginAs(page: Page, account: Account): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Opens a Radix combobox and clicks an option. Omit `optionName` to take whatever the first real option is. */
export async function selectComboboxOption(
  page: Page,
  comboboxName: string,
  optionName?: string | RegExp,
): Promise<void> {
  await page.getByRole('combobox', { name: comboboxName }).click();
  const option = optionName
    ? page.getByRole('option', { name: optionName, exact: typeof optionName === 'string' })
    : page.getByRole('option').first();
  await option.first().click();
}

/**
 * Tutor onboarding wizard (apps/web/features/tutor-profile), stages 1-7,
 * filling only the fields the Phase 6 profile DTO requires (university,
 * full name, department, degree program, at least one subject and one
 * grade, one area) plus a day of availability, then finishing through the
 * (currently stubbed) verification stage back to the dashboard.
 */
export async function completeMinimalTutorProfile(
  page: Page,
  opts: { fullName: string; subject: string; grade: string; area: string },
): Promise<void> {
  await page.goto('/onboarding/tutor');
  await expect(page.getByRole('heading', { name: 'Set up your tutor profile' })).toBeVisible();

  // Stage 1: academic background.
  await page.getByLabel('Full name').fill(opts.fullName);
  await selectComboboxOption(page, 'University');
  await page.getByLabel('Department').fill('Computer Science');
  await page.getByLabel('Degree program').fill('BSc');
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Stage 2: subjects & classes. Exact match matters here — e.g. the
  // subject "English" is also a substring of curriculum options like
  // "English Version (NCTB)" rendered as checkboxes on the same stage.
  await page.getByRole('checkbox', { name: opts.subject, exact: true }).check();
  await page.getByRole('checkbox', { name: opts.grade, exact: true }).check();
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Stage 3: teaching approach (optional — skip).
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Stage 4: areas & availability.
  await selectComboboxOption(page, 'District');
  await page.getByLabel('Area').fill(opts.area);
  await page.getByRole('checkbox', { name: 'Saturday' }).check();
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Stage 5: expected rate (optional — skip).
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Stage 6: review.
  await page.getByRole('button', { name: 'Continue' }).click();

  // Stage 7: verification stub — finish onboarding.
  await page.getByRole('link', { name: 'Finish and go to your dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Guardian onboarding (apps/web/app/onboarding/guardian) — a single display-name field. */
export async function completeGuardianProfile(page: Page, displayName: string): Promise<void> {
  await page.goto('/onboarding/guardian');
  await expect(page.getByRole('heading', { name: 'Set up your guardian profile' })).toBeVisible();
  await page.getByLabel('Your name').fill(displayName);
  await page.getByRole('button', { name: 'Create profile and continue' }).click();
  await expect(page).toHaveURL(/\/listings\/new$/);
}

/**
 * Listing creation wizard (apps/web/features/listing-owner), stages 1-6.
 * Assumes the guardian profile already exists (createListing redirects
 * there otherwise). Leaves the listing in PENDING_REVIEW and returns its id
 * (read off the URL the wizard rewrites to after stage 1 saves).
 */
export async function createAndSubmitListing(
  page: Page,
  opts: { title: string; subject: string; grade: string; area: string },
): Promise<string> {
  await expect(page.getByRole('heading', { name: 'Publish a tuition listing' })).toBeVisible();

  // Stage 1: basics.
  await page.getByLabel('Short title').fill(opts.title);
  await selectComboboxOption(page, 'Class / grade', opts.grade);
  await selectComboboxOption(page, 'Days per week');
  await selectComboboxOption(page, 'District');
  await page.getByLabel('Area').fill(opts.area);
  await page.getByRole('checkbox', { name: opts.subject, exact: true }).check();
  await page.getByRole('button', { name: 'Save and continue' }).click();

  await page.waitForURL(/\/listings\/[0-9a-fA-F-]+\/edit$/);
  const match = /\/listings\/([0-9a-fA-F-]+)\/edit$/.exec(page.url());
  const listingId = match?.[1];
  if (!listingId) throw new Error(`Could not read listing id from URL: ${page.url()}`);

  // Stage 2: schedule.
  await page.getByRole('checkbox', { name: 'Saturday' }).check();
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Stage 3: budget & preferences (optional — skip).
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Stage 4: description (optional — skip).
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Stage 5: preview.
  await page.getByRole('button', { name: 'Continue' }).click();

  // Stage 6: submit for review.
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(page.getByText("Your listing is waiting for admin review.")).toBeVisible();

  return listingId;
}

/**
 * Bootstraps a one-off ADMIN account (grantRole, then a real login so the
 * fresh token carries the new role) and approves the given PENDING_REVIEW
 * listing through the real /admin/listings UI. Closes its own context.
 */
export async function approveListingAsAdmin(browser: Browser, listingTitle: string): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const admin = await registerAs(page, 'Guardian looking for a tutor', 'admin-bootstrap');
    await grantRole(admin.email, 'ADMIN');
    await loginAs(page, admin);

    await page.goto('/admin/listings');
    const card = page.locator('div.rounded-2xl').filter({ hasText: listingTitle });
    await expect(card).toHaveCount(1);
    await card.getByRole('button', { name: 'Approve' }).click();
    await expect(card).toHaveCount(0);
  } finally {
    await context.close();
  }
}
