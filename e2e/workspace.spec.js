import { test, expect } from '@playwright/test';

async function boot(page, baseURL) {
  // Do not talk to cloud endpoints even if a frontend dependency tries to warm up.
  await page.route('**/*', route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort('blockedbyclient'));
  const startupErrors = [];
  page.on('pageerror', error => startupErrors.push(error.message));
  await page.goto('/');
  try {
    await page.waitForFunction(() => window._isAppLoaded === true, null, { timeout: 30000 });
  } catch (error) {
    throw new Error(`Startup did not complete: ${startupErrors.join('; ') || error.message}`);
  }
  await expect(page.locator('#v2-initial-loader')).toBeHidden();
}
async function mode(page, value) {
  await page.locator('.workspace-mode-current').click();
  await page.locator(`[data-story-workspace-mode="${value}"]`).click();
  await expect(page.locator('html')).not.toHaveClass(/workspace-mode-reveal-transitioning/);
  const notice = page.locator('#story-beta-notice-overlay');
  if (await notice.isVisible()) await notice.getByRole('button', { name: '我知道了' }).click();
}

test('Story layout, hidden inputs, menu states and canvas chrome are wired', async ({ page, baseURL }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await boot(page, baseURL);
  await mode(page, 'story');
  const root = page.locator('#storyWorkspaceRoot');
  await expect(root).toBeVisible();
  await expect(root.locator('.story-home-composer')).toBeVisible();
  await expect(root.locator('input[type=file]:visible')).toHaveCount(0);
  await expect(root.locator('.story-home-param-popover:visible')).toHaveCount(0);
  console.log('LAYOUT_STATE', await page.evaluate(() => ({
    body: document.body.className,
    rootHidden: document.getElementById('storyWorkspaceRoot').hidden,
    sidebar: getComputedStyle(document.querySelector('.sidebar-floating')).visibility,
    sidebarInline: document.querySelector('.sidebar-floating').getAttribute('style'),
    sheets: [...document.styleSheets].filter(s => s.href?.includes('story-workspace')).map(s => ({ href: s.href, rules: s.cssRules.length })),
  })));
  await expect(page.locator('.sidebar-floating')).toBeHidden();
  await expect(page.locator('.canvas-controls-floating')).toBeHidden();
  await expect(root).toHaveCSS('position', 'fixed');
  await expect(root.locator('.story-home-composer')).toHaveCSS('border-radius', '18px');
  const picker = root.locator('[data-story-home-param-trigger="style"]');
  await picker.click();
  await expect(picker).toHaveAttribute('aria-expanded', 'true');
  await expect(root.locator('.story-style-popover')).toBeVisible();
  await expect.poll(() => root.locator('.story-style-card img').first().evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const bounds = await root.locator('.story-style-popover').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(1440);
  await root.locator('.story-style-card:not(.story-style-card--custom)').nth(1).click();
  await expect(root.locator('.story-style-popover')).toBeHidden();
  const sort = root.locator('[data-story-action="toggle-project-sort-menu"]');
  await sort.click();
  await expect(root.locator('.story-project-sort-menu')).toBeVisible();
  await sort.click();
  await expect(root.locator('.story-project-sort-menu')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('story-desktop.png') });
  for (const width of [1024, 760, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await root.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await expect(root.locator('.story-home-composer')).toBeVisible();
    await expect(root.locator('input[type=file]:visible')).toHaveCount(0);
  }
  await page.screenshot({ path: testInfo.outputPath('story-narrow.png') });
  await page.setViewportSize({ width: 1440, height: 960 });
  await mode(page, 'canvas');
  await expect(root).toBeHidden();
  await expect(page.locator('.sidebar-floating')).toBeVisible();
  expect(errors).toEqual([]);
});

test('toast text remains bounded and wraps at narrow widths', async ({ page, baseURL }) => {
  await boot(page, baseURL);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.evaluate(async () => {
    const { showToast } = await import('/src/services/toastService.js');
    showToast('失败详情'.repeat(200), 'error', 60000);
  });
  const toast = page.locator('.v2-toast').last();
  await expect(toast).toBeVisible();
  const bounds = await toast.boundingBox();
  expect(bounds.width).toBeLessThanOrEqual(390 - 30);
  expect((await toast.textContent()).length).toBeLessThanOrEqual(330);
  expect(await toast.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});
