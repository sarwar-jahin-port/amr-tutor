import { expect, test } from '@playwright/test';

test('homepage renders and reports API status', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'AMR Tutor' })).toBeVisible();
  await expect(page.getByText(/^API status:/)).toBeVisible();
});
