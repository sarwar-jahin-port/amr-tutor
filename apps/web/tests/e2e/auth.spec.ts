import { expect, test } from '@playwright/test';

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 100000)}@test.amr-tutor.invalid`;
}

test('a visitor can register, land on the dashboard, survive a reload, and log out', async ({
  page,
}) => {
  const email = uniqueEmail();
  const password = 'StrongPassword123!';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('checkbox', { name: 'Tutor', exact: true }).check();
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText('TUTOR', { exact: true })).toBeVisible();

  // Session restoration: the access token lives only in memory, so a reload
  // must silently restore it from the refresh cookie rather than bouncing
  // the user to /login.
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  // An unauthenticated visitor hitting a protected route is bounced to login.
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('login rejects the wrong password with a visible error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail());
  await page.getByLabel('Password', { exact: true }).fill('whatever-password');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});
