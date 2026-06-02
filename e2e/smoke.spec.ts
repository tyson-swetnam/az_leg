import { test, expect, type Page } from '@playwright/test';

/**
 * UI smoke test: confirms representative pages mount and that profile links
 * RENDER with non-empty href attributes. It does NOT assert that links resolve
 * (no 404 checks) — that is the job of the Node link crawler (`npm run audit`).
 *
 * Paths are relative (no leading slash) so they resolve against the `/az_leg/`
 * baseURL configured in playwright.config.ts.
 */

/** Every anchor inside a profile card must have a non-empty href. */
async function assertCardLinksHaveHref(page: Page) {
  const cards = page.locator('.legislator-card');
  await expect(cards.first()).toBeVisible();

  const links = page.locator('.legislator-card a[href]');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href');
    expect(href, `link #${i} should have a non-empty href`).toBeTruthy();
  }
}

test('home / map page mounts', async ({ page }) => {
  const response = await page.goto('');
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
});

test('state district detail renders legislator cards with working links', async ({ page }) => {
  await page.goto('district/1');
  await assertCardLinksHaveHref(page);
  // A reachable email contact (mailto) should be present on state profiles.
  await expect(page.locator('.legislator-card a[href^="mailto:"]').first()).toBeVisible();
});

test('local jurisdiction (county) renders official cards with working links', async ({ page }) => {
  await page.goto('local/county/maricopa');
  await assertCardLinksHaveHref(page);
});

test('party network page mounts without crashing', async ({ page }) => {
  await page.goto('party-network');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
});

test('committee network page mounts without crashing', async ({ page }) => {
  await page.goto('committee-network');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
});
