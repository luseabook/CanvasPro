import { _electron, test, expect } from '@playwright/test';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { ROOT, createTestEnvironment } from '../tools/test-runtime.mjs';
import { terminateProcessTree } from '../electron/backendProcessTermination.js';

async function reserveTestPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function alive(url) {
  try { return (await fetch(url, { signal: AbortSignal.timeout(1000) })).ok; } catch { return false; }
}
async function openStory(page) {
  await page.locator('.workspace-mode-current').click();
  await page.locator('[data-story-workspace-mode="story"]').click();
  await expect(page.locator('html')).not.toHaveClass(/workspace-mode-reveal-transitioning/);
  const notice = page.locator('#story-beta-notice-overlay');
  if (await notice.isVisible()) await notice.getByRole('button', { name: '我知道了' }).click();
  await expect(page.locator('#storyWorkspaceRoot')).toBeVisible();
}
async function desktop(testInfo, run) {
  const port = await reserveTestPort(), baseURL = `http://127.0.0.1:${port}`;
  const fixture = createTestEnvironment(port);
  let app, page, child;
  try {
    app = await _electron.launch({ args: [ROOT, `--user-data-dir=${fixture.env.AIC_USER_DATA_ROOT}`], cwd: ROOT, env: fixture.env, timeout: 60000 });
    child = app.process();
    await app.context().route('**/*', route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort('blockedbyclient'));
    await expect.poll(() => app.windows().some(window => window.url().startsWith(baseURL + '/')), { timeout: 60000 }).toBe(true);
    page = app.windows().find(window => window.url().startsWith(baseURL + '/'));
    await page.waitForFunction(() => window._isAppLoaded === true, null, { timeout: 45000 });
    await expect(page.locator('#v2-initial-loader')).toBeHidden();
    const profile = await app.evaluate(({ app }) => app.getPath('userData'));
    expect(path.resolve(profile).toLowerCase()).toBe(path.resolve(fixture.env.AIC_USER_DATA_ROOT).toLowerCase());
    // Exercise the real Electron token injection for protected same-origin media as well as APIs.
    const mediaWidth = await page.evaluate(() => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image.naturalWidth);
      image.onerror = () => reject(new Error('Protected local media did not load'));
      image.src = '/output/acceptance-pixel.png';
    }));
    expect(mediaWidth).toBe(1);
    await run({ app, page, fixture, baseURL, child });
  } finally {
    if (app && child && child.exitCode == null && child.signalCode == null) {
      // Only test cleanup may bypass a deliberately injected failure. Never a production close path.
      await page?.evaluate(() => { window.__aiCanvasPrepareForClose = async () => ({ success: true }); }).catch(() => {});
      try { await app.close(); }
      catch { terminateProcessTree(child.pid, { force: true }); }
    }
    const log = path.join(fixture.env.AIC_USER_DATA_ROOT, 'logs', 'server.log');
    if (fs.existsSync(log) && testInfo.status !== testInfo.expectedStatus) await testInfo.attach('isolated-backend-log', { body: fs.readFileSync(log), contentType: 'text/plain' });
    fixture.dispose();
  }
}
async function closeMain(app, baseURL) {
  await app.evaluate(({ BrowserWindow }, origin) => {
    const window = BrowserWindow.getAllWindows().find(window => window.webContents.getURL().startsWith(origin + '/'));
    if (!window) throw new Error('Main window missing');
    window.close();
  }, baseURL);
}

test('ordinary close waits for the Story POST, then exits despite a hidden window', async ({}, testInfo) => {
  await desktop(testInfo, async ({ app, page, fixture, baseURL, child }) => {
    await openStory(page);
    await page.locator('[data-story-home-tab="generate"]').click();
    const text = '隔离退出回归：这是一份临时故事草稿，不是用户作品。';
    let saves = 0;
    await page.route('**/api/v2/user/story-workspace.json', async route => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 700));
        saves++;
      }
      await route.continue();
    });
    await page.locator('[data-story-idea-input]').fill(text);
    await expect.poll(() => page.evaluate(() => document.getElementById('storyWorkspaceRoot')._storyWorkspaceApi.hasUnsavedChanges())).toBe(true);
    await app.evaluate(async ({ BrowserWindow }) => {
      // Do not touch the real clipboard/screen: this controlled hidden window exercises the same quit condition.
      const hidden = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
      await hidden.loadURL('about:blank');
    });
    expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBeGreaterThan(1);
    await closeMain(app, baseURL);
    if (process.platform === 'darwin') {
      // macOS ordinary close intentionally keeps the application/backend alive.
      await expect.poll(() => app.windows().some(window => window.url().startsWith(baseURL + '/'))).toBe(false);
      await app.evaluate(({ app }) => app.quit());
    }
    await expect.poll(() => child.exitCode != null || child.signalCode != null).toBe(true);
    expect(saves).toBeGreaterThan(0);
    const saved = JSON.parse(fs.readFileSync(path.join(fixture.env.AIC_USER_DIR, 'story-workspace.json'), 'utf8'));
    expect(saved.ui.idea).toBe(text);
    await expect.poll(() => alive(baseURL)).toBe(false);
  });
});

test('failed save cancels close and leaves the backend running', async ({}, testInfo) => {
  await desktop(testInfo, async ({ app, page, baseURL, child }) => {
    await app.evaluate(({ dialog }) => {
      globalThis.__auditSaveDialog = 0;
      dialog.showMessageBox = async () => { globalThis.__auditSaveDialog++; return { response: 0 }; };
    });
    await page.evaluate(() => {
      window.__auditOriginalPrepare = window.__aiCanvasPrepareForClose;
      window.__aiCanvasPrepareForClose = async () => ({ success: false, reason: 'synthetic-save-failure' });
    });
    await closeMain(app, baseURL);
    await expect.poll(() => app.evaluate(() => globalThis.__auditSaveDialog)).toBe(1);
    expect(child.exitCode).toBe(null);
    expect(page.isClosed()).toBe(false);
    expect(await alive(baseURL)).toBe(true);
    await page.evaluate(() => { window.__aiCanvasPrepareForClose = window.__auditOriginalPrepare; });
  });
});

test('updater IPC background/manual/duplicate feedback stays quiet or singular', async ({}, testInfo) => {
  await desktop(testInfo, async ({ app, page, baseURL }) => {
    await page.evaluate(() => { window.__auditToasts = []; window.showToast = (message, type) => window.__auditToasts.push({ message, type }); });
    const send = event => app.evaluate(({ BrowserWindow }, { origin, event }) => {
      BrowserWindow.getAllWindows().find(window => window.webContents.getURL().startsWith(origin + '/')).webContents.send('appUpdater:event', event);
    }, { origin: baseURL, event });
    await send({ type: 'error', manual: false, eventId: 70001, message: '后台检查失败' });
    // A renderer evaluation is an IPC barrier, not an arbitrary multi-second sleep.
    expect(await page.evaluate(() => window.__auditToasts.filter(item => item.type === 'warning').length)).toBe(0);
    await send({ type: 'error', manual: true, eventId: 70002, message: '暂时无法检查更新，请稍后重试。' });
    await send({ type: 'error', manual: true, eventId: 70002, message: '暂时无法检查更新，请稍后重试。' });
    await expect.poll(() => page.evaluate(() => window.__auditToasts.filter(item => item.type === 'warning').length)).toBe(1);
    await app.evaluate(({ ipcMain }, origin) => {
      ipcMain.removeHandler('appUpdater:checkForUpdates');
      ipcMain.handle('appUpdater:checkForUpdates', async event => {
        event.sender.send('appUpdater:event', { type: 'error', manual: true, eventId: 70003, message: '暂时无法检查更新，请稍后重试。' });
        throw new Error('SYNTHETIC_HTTP_RESPONSE_' + 'x'.repeat(5000));
      });
    }, baseURL);
    await page.evaluate(async () => { const { showManualUpdateCheck } = await import('/src/modules/AutoUpdate.js'); await showManualUpdateCheck(); });
    const warnings = await page.evaluate(() => window.__auditToasts.filter(item => item.type === 'warning'));
    expect(warnings).toHaveLength(2);
    expect(warnings.every(item => item.message.length < 100 && !item.message.includes('SYNTHETIC_HTTP_RESPONSE'))).toBe(true);
  });
});


test('explicit discard is honored even with a renderer beforeunload veto', async ({}, testInfo) => {
  await desktop(testInfo, async ({ app, page, baseURL, child }) => {
    await openStory(page); // Real user activation before installing the veto.
    let output = '';
    child.stdout.on('data', chunk => { output += chunk.toString(); });
    await app.evaluate(({ dialog }) => {
      dialog.showMessageBox = async () => { console.log('AUDIT_EXPLICIT_DISCARD_APPROVED'); return { response: 1 }; };
    });
    await page.evaluate(() => {
      window.__aiCanvasPrepareForClose = async () => ({ success: false, reason: 'synthetic-save-failure' });
      window.addEventListener('beforeunload', event => { event.preventDefault(); event.returnValue = ''; });
    });
    await closeMain(app, baseURL);
    if (process.platform === 'darwin') {
      await expect.poll(() => app.windows().some(window => window.url().startsWith(baseURL + '/'))).toBe(false);
      await app.evaluate(({ app }) => app.quit());
    }
    await expect.poll(() => child.exitCode != null || child.signalCode != null).toBe(true);
    await expect.poll(() => output.includes('AUDIT_EXPLICIT_DISCARD_APPROVED')).toBe(true);
    await expect.poll(() => alive(baseURL)).toBe(false);
  });
});
