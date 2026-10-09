import { expect, test } from '@playwright/test';

test('visitor can browse tutors with an empty catalog and see the empty state', async ({ page }) => {
  await page.goto('/tutors');

  await expect(page.getByRole('heading', { name: 'Find a tutor' })).toBeVisible();
  await expect(page.getByText('No matching tutors found')).toBeVisible();
});

test('visitor can browse tuition opportunities with an empty catalog and see the empty state', async ({
  page,
}) => {
  await page.goto('/tuition');

  await expect(page.getByRole('heading', { name: 'Find tuition' })).toBeVisible();
  await expect(page.getByText('No matching tuition found')).toBeVisible();
});

test('selecting a filter updates the URL and preserves state across navigation', async ({ page }) => {
  await page.goto('/tutors');

  await page.getByRole('combobox', { name: /subject/i }).click();
  // Option 0 is the "Any subject" clear-value entry — pick the first real subject instead.
  const firstOption = page.getByRole('option').nth(1);
  const optionName = await firstOption.textContent();
  await firstOption.click();

  await expect(page).toHaveURL(/subjectId=/);

  // Reloading must restore the same filter selection from the URL.
  await page.reload();
  await expect(page.getByRole('combobox', { name: /subject/i })).toHaveText(optionName ?? '');
});

test('a missing tutor profile shows a 404 page with a way back', async ({ page }) => {
  await page.goto('/tutors/00000000-0000-0000-0000-000000000000');

  await expect(page.getByText("This tutor profile isn't available")).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse other tutors' })).toBeVisible();
});

test('a missing tuition listing shows a 404 page with a way back', async ({ page }) => {
  await page.goto('/tuition/00000000-0000-0000-0000-000000000000');

  await expect(page.getByText("This tuition opportunity isn't available")).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse other opportunities' })).toBeVisible();
});

test('how it works page is reachable from the public nav', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'How it works' }).click();

  await expect(page).toHaveURL(/\/how-it-works$/);
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
});
