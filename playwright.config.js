import fs from 'node:fs';
import { chromium, defineConfig, devices } from '@playwright/test';
const PORT = 0x104d,
  BASE_URL = 'http://127.0.0.1:' + PORT,
  SYSTEM_CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ],
  PLAYWRIGHT_CHROMIUM_READY = fs.existsSync(chromium.executablePath()),
  SYSTEM_CHROME_READY = SYSTEM_CHROME_PATHS.some((_0x5192ff) => fs.existsSync(_0x5192ff)),
  USE_SYSTEM_CHROME =
    process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1' || (!PLAYWRIGHT_CHROMIUM_READY && SYSTEM_CHROME_READY);
export default defineConfig({
  testDir: './e2e',
  timeout: 0xea60,
  expect: { timeout: 0x2710 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 0x5a0, height: 0x384 },
  },
  projects: [
    {
      name: 'chromium-smoke',
      use: { ...devices['Desktop Chrome'], ...(USE_SYSTEM_CHROME ? { channel: 'chrome' } : {}) },
    },
  ],
  webServer: {
    command: 'node tools/e2e-static-server.mjs --port ' + PORT,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 0x1d4c0,
  },
});
