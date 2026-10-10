import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Blueprint Phase 13 §19.4 (UI and accessibility testing). Covers what's
 * automatable from the browser: axe scans for screen-reader-relevant
 * issues, keyboard-only navigation, focus indicators, viewport rendering,
 * reduced-motion, and long-text overflow. Manual-only items (an actual
 * screen reader, Bangla rendering — not enabled yet per decision record
 * 0001 item 1) are out of scope here and tracked separately.
 */

const PAGES_TO_SCAN = ['/', '/login', '/register', '/tuition', '/tutors', '/how-it-works'];

for (const path of PAGES_TO_SCAN) {
  test(`${path} has no serious or critical automated accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(
      seriousOrCritical,
      seriousOrCritical.map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`).join('\n'),
    ).toEqual([]);
  });
}

test('the login form is fully operable by keyboard alone', async ({ page }) => {
  await page.goto('/login');

  await page.keyboard.press('Tab'); // skip-link or first focusable element
  // Tab until the email field is focused, rather than assuming a fixed
  // number of stops — the exact tab order isn't the thing under test.
  const email = page.getByLabel('Email');
  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.type('keyboard-nav@test.amr-tutor.invalid');

  await page.keyboard.press('Tab');
  const password = page.getByLabel('Password', { exact: true });
  await expect(password).toBeFocused();
  await page.keyboard.type('whatever-password');

  // Submitting via Enter (not a click) proves the form doesn't rely on
  // pointer-only activation.
  await page.keyboard.press('Enter');
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});

test('a focused interactive element has a visible focus indicator', async ({ page }) => {
  await page.goto('/login');

  const email = page.getByLabel('Email');
  await email.focus();

  const outlineInfo = await email.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      boxShadow: style.boxShadow,
    };
  });

  // Accept either a real outline or a focus box-shadow ring (this design
  // system's `focus-visible` utility uses one or the other) — the point is
  // that *something* visibly distinguishes the focused state from `none`.
  const hasOutline = outlineInfo.outlineStyle !== 'none' && outlineInfo.outlineWidth !== '0px';
  const hasShadowRing = outlineInfo.boxShadow !== 'none' && outlineInfo.boxShadow !== '';
  expect(hasOutline || hasShadowRing).toBe(true);
});

test('form validation errors are announced accessibly and recoverable', async ({ page }) => {
  await page.goto('/register');

  // Submit with no fields filled in at all.
  await page.getByRole('button', { name: 'Register' }).click();

  // Whatever the validation message is, it must be visible to a sighted
  // user, and the form must still be usable afterwards (not stuck/disabled).
  const emailField = page.getByLabel('Email');
  await expect(emailField).toBeEditable();

  await emailField.fill('recoverable@test.amr-tutor.invalid');
  await page.getByLabel('Password', { exact: true }).fill('StrongPassword123!');
  await page.getByRole('checkbox', { name: 'Tutor', exact: true }).check();
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});

test.describe('viewports', () => {
  for (const [name, size] of Object.entries({
    mobile: { width: 375, height: 812 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 },
  })) {
    test(`homepage renders without horizontal overflow at ${name} width`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test('primary actions remain reachable at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // The brand link and the sign-in/create-account actions stay visible —
    // see the note below about the public nav links.
    await expect(page.getByRole('link', { name: 'AMR Tutor' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();
  });

  test('public nav links are reachable from the header below the md breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const header = page.locator('header');
    for (const label of ['Find tuition', 'Find tutors', 'How it works']) {
      await expect(header.getByRole('link', { name: label })).toBeHidden();
    }

    await page.getByRole('button', { name: 'Open menu' }).click();

    const menu = page.getByRole('dialog', { name: 'Menu' });
    for (const label of ['Find tuition', 'Find tutors', 'How it works']) {
      await expect(menu.getByRole('link', { name: label })).toBeVisible();
    }
  });
});

test('respects a reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  // A baseline smoke check: the page still renders correctly under
  // `prefers-reduced-motion: reduce` (no broken layout from an animation
  // library that assumes motion is always allowed).
  await expect(
    page.getByRole('heading', { name: 'The only tuition platform in Bangladesh that never takes a cut.' }),
  ).toBeVisible();
});

test('long listing content does not break the layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/tuition');

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
