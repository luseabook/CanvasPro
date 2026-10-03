import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: '**/desktop-lifecycle.spec.js',
  timeout: 90000, expect: { timeout: 15000 }, workers: 1, fullyParallel: false, retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/desktop', open: 'never' }]],
  outputDir: 'test-results/desktop',
});
