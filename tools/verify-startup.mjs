import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(
  'C:\\Users\\luobote\\AppData\\Local\\OpenAI\\Codex\\runtimes\\cua_node\\b63ee7ee40c23b77\\bin\\node_modules\\playwright',
);

const root = path.resolve('F:\\CanvasPro');
const baseUrl = 'http://127.0.0.1:8877';
const screenshotPath = path.join(process.env.TEMP || root, 'canvaspro-startup-check.png');
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

function resolveStaticFile(pathname) {
  let decoded = '';
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relative = decoded.replace(/^\/+/, '') || 'index.html';
  const candidate = path.resolve(root, relative);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null;
  return candidate;
}

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const pageErrors = [];
const consoleErrors = [];
const failedRequests = [];

page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('requestfailed', (request) => {
  failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText || 'unknown',
  });
});

await page.route('**/*', async (route) => {
  const requestUrl = new URL(route.request().url());
  if (requestUrl.origin !== baseUrl) {
    await route.continue();
    return;
  }
  if (String(route.request().headers().accept || '').includes('text/event-stream')) {
    await route.continue();
    return;
  }

  const filePath = resolveStaticFile(requestUrl.pathname);
  if (filePath) {
    try {
      if ((await stat(filePath)).isFile()) {
        await route.fulfill({
          status: 200,
          headers: {
            'cache-control': 'no-store',
            'content-type':
              mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
          },
          body: await readFile(filePath),
        });
        return;
      }
    } catch {}
  }

  await route.continue();
});

let loadError = null;
try {
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window._isAppLoaded === true, null, { timeout: 60000 });
  await page.waitForFunction(
    () => {
      const loader = document.getElementById('v2-initial-loader');
      if (!loader) return true;
      const style = getComputedStyle(loader);
      return (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number.parseFloat(style.opacity) <= 0.001
      );
    },
    null,
    { timeout: 5000 },
  );
} catch (error) {
  loadError = String(error?.stack || error);
}

const snapshot = await page.evaluate(() => ({
  isAppLoaded: window._isAppLoaded === true,
  currentProjectId: window.currentProjectId || '',
  loaderPresent: Boolean(document.getElementById('v2-initial-loader')),
  readyState: document.readyState,
  title: document.title,
}));

await page.waitForTimeout(3000);
await page.screenshot({ path: screenshotPath, fullPage: true });

const result = {
  url: page.url(),
  screenshotPath,
  loadError,
  ...snapshot,
  pageErrors,
  consoleErrors,
  failedRequests,
};
console.log(JSON.stringify(result, null, 2));

await browser.close();

if (
  loadError ||
  !snapshot.isAppLoaded ||
  snapshot.loaderPresent ||
  !snapshot.currentProjectId ||
  pageErrors.length > 0
) {
  process.exitCode = 1;
}
