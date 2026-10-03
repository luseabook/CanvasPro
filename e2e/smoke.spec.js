import { expect, test } from '@playwright/test';

// Boot smoke test: the app must reach a loaded state with no uncaught renderer
// errors. API calls are expected to fail under the static-only test server, so
// only page-level errors are asserted here.
test('the canvas shell boots without renderer errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window._isAppLoaded === true, null, { timeout: 60000 });

  await expect(page.locator('#v2-wrap')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test('the workspace mode switcher is mounted and keyboard reachable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window._isAppLoaded === true, null, { timeout: 60000 });

  const trigger = page.locator('.workspace-mode-current');
  await expect(trigger).toHaveCount(1);
  await trigger.focus();
  await expect(trigger).toBeFocused();
});
