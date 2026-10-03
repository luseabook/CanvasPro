import fs from 'node:fs';
import { chromium, defineConfig } from '@playwright/test';
import { E2E_TOKEN, registerTestServerCleanup } from './tools/test-runtime.mjs';
const port = Number(process.env.AIC_E2E_PORT || 18779);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid AIC_E2E_PORT');
registerTestServerCleanup(port);
let channel = process.env.PLAYWRIGHT_CHANNEL || undefined;
if (!channel && !fs.existsSync(chromium.executablePath()) && process.platform === 'win32') {
  if (fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')) channel = 'msedge';
  else if (fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) channel = 'chrome';
}
export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/browser',
  testIgnore: '**/desktop-lifecycle.spec.js',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/browser', open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel,
    extraHTTPHeaders: { 'X-AIC-Local-Token': E2E_TOKEN },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 960 },
  },
  webServer: {
    command: `node tools/e2e-static-server.mjs --port ${port}`,
    url: `http://127.0.0.1:${port}/`,
    // Never attach acceptance tests to an existing service or the user's files.
    reuseExistingServer: false,
    timeout: 90000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
  },
});
