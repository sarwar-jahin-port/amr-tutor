import { expect, test } from '@playwright/test';

test('homepage renders the hero, nav, and API status', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'The only tuition platform in Bangladesh that never takes a cut.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find a tutor' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find tuition' }).first()).toBeVisible();
  await expect(page.getByText(/^API status:/)).toBeVisible();
});
