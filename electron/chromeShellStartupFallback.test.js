import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHROME_DOWNLOAD_URL,
  promptForMissingChromeShellBrowser,
  promptForChromeShellStartupFailure,
} from './chromeShellStartupFallback.js';

function createDialogDouble({ response = { response: 0 }, throwOnShow = false } = {}) {
  const calls = [];
  const api = {
    async showMessageBox(options) {
      calls.push(options);
      if (throwOnShow) throw new Error('dialog failed');
      return response;
    },
  };
  return { api: api, calls: calls };
}

function createShellDouble({ throwOnOpen = false } = {}) {
  const calls = [];
  const api = {
    async openExternal(url) {
      calls.push(url);
      if (throwOnOpen) throw new Error('openExternal failed');
    },
  };
  return { api: api, calls: calls };
}

function readyTimeoutError({ causeCode = '', profileRecovery = false } = {}) {
  const error = new Error('renderer timeout');
  error['code'] = 'CHROME_SHELL_RENDERER_READY_TIMEOUT';
  if (profileRecovery) {
    error['profileRecoveryError'] = Object.assign(new Error('recovery failed'), {
      cause: { code: causeCode },
    });
  }
  return error;
}

test('the Chrome download URL points at the official Chrome page', () => {
  assert.equal(CHROME_DOWNLOAD_URL, 'https://www.google.com/chrome/');
});

test('a missing dialog API returns quit without prompting', async () => {
  const shell = createShellDouble();
  assert.equal(await promptForMissingChromeShellBrowser({ shellApi: shell.api }), 'quit');
  assert.equal(await promptForMissingChromeShellBrowser({ dialogApi: {}, shellApi: shell.api }), 'quit');
  assert.equal(shell.calls.length, 0);
});

test('the missing-browser prompt offers download, compat mode and quit in that order', async () => {
  const dialog = createDialogDouble({ response: { response: 1 } });
  const shell = createShellDouble();
  await promptForMissingChromeShellBrowser({ dialogApi: dialog.api, shellApi: shell.api });
  assert.equal(dialog.calls.length, 1);
  const payload = dialog.calls[0];
  assert.equal(payload.type, 'warning');
  assert.equal(payload.title, 'AI CanvasPro 启动提示');
  assert.equal(payload.message, '未检测到 Chrome 浏览器内核');
  assert.deepEqual(payload.buttons, ['重新下载 Chrome', '进入兼容模式', '退出']);
  assert.equal(payload.defaultId, 0);
  assert.equal(payload.cancelId, 2);
  assert.equal(payload.noLink, true);
  assert.ok(payload.detail.includes('缺少 Chrome 浏览器内核，部分功能将无法正常使用。'));
  assert.ok(
    payload.detail.includes('请重新下载安装最新版 Google Chrome 浏览器，然后重新启动 AI CanvasPro。'),
  );
  assert.ok(payload.detail.includes('兼容模式下部分功能不可用，包括部分视频截帧和关键帧功能。'));
});

test('choosing the download button opens the Chrome URL and reports download', async () => {
  const dialog = createDialogDouble({ response: { response: 0 } });
  const shell = createShellDouble();
  assert.equal(
    await promptForMissingChromeShellBrowser({ dialogApi: dialog.api, shellApi: shell.api }),
    'download',
  );
  assert.deepEqual(shell.calls, [CHROME_DOWNLOAD_URL]);
});

test('choosing compat mode reports electron and never opens a browser URL', async () => {
  const dialog = createDialogDouble({ response: { response: 1 } });
  const shell = createShellDouble();
  assert.equal(
    await promptForMissingChromeShellBrowser({ dialogApi: dialog.api, shellApi: shell.api }),
    'electron',
  );
  assert.equal(shell.calls.length, 0);
});

test('any other missing-browser response falls through to quit', async () => {
  const dialog = createDialogDouble({ response: { response: 2 } });
  const shell = createShellDouble();
  assert.equal(
    await promptForMissingChromeShellBrowser({ dialogApi: dialog.api, shellApi: shell.api }),
    'quit',
  );
  assert.equal(shell.calls.length, 0);
});

test('a missing-browser response without a numeric field falls through to quit', async () => {
  const dialog = createDialogDouble({ response: {} });
  assert.equal(await promptForMissingChromeShellBrowser({ dialogApi: dialog.api }), 'quit');
});

test('a throwing dialog in the missing-browser prompt is swallowed as quit', async () => {
  const dialog = createDialogDouble({ throwOnShow: true });
  const shell = createShellDouble();
  assert.equal(
    await promptForMissingChromeShellBrowser({ dialogApi: dialog.api, shellApi: shell.api }),
    'quit',
  );
});

test('a failing openExternal still reports download', async () => {
  const dialog = createDialogDouble({ response: { response: 0 } });
  const shell = createShellDouble({ throwOnOpen: true });
  assert.equal(
    await promptForMissingChromeShellBrowser({ dialogApi: dialog.api, shellApi: shell.api }),
    'download',
  );
  assert.deepEqual(shell.calls, [CHROME_DOWNLOAD_URL]);
});

test('a caller supplied app name is used in the missing-browser prompt', async () => {
  const dialog = createDialogDouble({ response: { response: 2 } });
  await promptForMissingChromeShellBrowser({ dialogApi: dialog.api, appName: 'SHUO Canvas' });
  assert.equal(dialog.calls[0].title, 'SHUO Canvas 启动提示');
  assert.ok(dialog.calls[0].detail.includes('然后重新启动 SHUO Canvas。'));
});

test('a cancelled startup quits without showing a dialog', async () => {
  const dialog = createDialogDouble();
  const error = Object.assign(new Error('cancelled'), { code: 'CHROME_SHELL_STARTUP_CANCELLED' });
  assert.equal(await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: error }), 'quit');
  assert.equal(dialog.calls.length, 0);
});

test('the startup-failure prompt quits when the dialog API is unusable', async () => {
  assert.equal(await promptForChromeShellStartupFailure({ error: new Error('boom') }), 'quit');
  assert.equal(await promptForChromeShellStartupFailure({ dialogApi: {}, error: new Error('boom') }), 'quit');
});

test('a locked profile reported through EPERM is named in the timeout detail', async () => {
  const dialog = createDialogDouble({ response: { response: 0 } });
  const error = readyTimeoutError({ causeCode: 'EPERM', profileRecovery: true });
  assert.equal(await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: error }), 'electron');
  const payload = dialog.calls[0];
  assert.equal(payload.title, 'AI CanvasPro 启动超时');
  assert.equal(payload.message, '画布页面未能就绪');
  assert.deepEqual(payload.buttons, ['进入兼容模式', '退出']);
  assert.equal(payload.defaultId, 0);
  assert.equal(payload.cancelId, 1);
  assert.equal(payload.noLink, true);
  assert.ok(payload.detail.includes('自动恢复未完成：浏览器配置目录仍被占用，或访问被系统拒绝（EPERM）。'));
  assert.ok(payload.detail.includes('若仍然失败，请进入兼容模式并导出诊断包，不要删除配置目录。'));
});

test('EACCES and EBUSY are treated as locked-profile causes too', async () => {
  for (const causeCode of ['EACCES', 'EBUSY']) {
    const dialog = createDialogDouble({ response: { response: 1 } });
    const error = readyTimeoutError({ causeCode: causeCode, profileRecovery: true });
    assert.equal(await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: error }), 'quit');
    assert.ok(dialog.calls[0].detail.includes('（' + causeCode + '）。'));
  }
});

test('a non-retryable recovery failure gets the diagnostics wording', async () => {
  const dialog = createDialogDouble({ response: { response: 1 } });
  const error = readyTimeoutError({ causeCode: 'ENOENT', profileRecovery: true });
  await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: error });
  assert.ok(
    dialog.calls[0].detail.includes('自动恢复浏览器配置未完成，原配置目录已保留，请导出诊断包排查。'),
  );
});

test('a timeout without profile recovery blames the renderer readiness report', async () => {
  const dialog = createDialogDouble({ response: { response: 1 } });
  await promptForChromeShellStartupFailure({
    dialogApi: dialog.api,
    error: readyTimeoutError(),
  });
  assert.ok(dialog.calls[0].detail.includes('浏览器已启动，但画布页面未在规定时间内回报就绪。'));
});

test('a storage-migration startup failure is described as an incomplete data upgrade', async () => {
  const dialog = createDialogDouble({ response: { response: 0 } });
  const error = Object.assign(new Error('migration failed'), { details: { stage: 'storage-migration' } });
  assert.equal(await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: error }), 'electron');
  const payload = dialog.calls[0];
  assert.equal(payload.title, 'AI CanvasPro 启动失败');
  assert.equal(payload.message, '画布未能完成加载');
  assert.ok(payload.detail.includes('升级数据恢复未完成，已停止进入画布，原迁移数据仍保留。'));
  assert.ok(payload.detail.includes('migration failed'));
});

test('a project-hydration failure is described as an incomplete project restore', async () => {
  const dialog = createDialogDouble({ response: { response: 1 } });
  const error = Object.assign(new Error('hydration failed'), { details: { stage: 'project-hydration' } });
  assert.equal(await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: error }), 'quit');
  assert.ok(dialog.calls[0].detail.includes('项目恢复未完成，已停止进入画布。'));
});

test('an early browser exit is described as a process exit before ready', async () => {
  const dialog = createDialogDouble({ response: { response: 1 } });
  const error = Object.assign(new Error('exited'), { code: 'CHROME_SHELL_EXITED_BEFORE_READY' });
  await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: error });
  assert.ok(dialog.calls[0].detail.includes('画布加载完成前，浏览器进程异常退出。'));
});

test('an unknown startup failure falls back to the generic stage wording', async () => {
  const dialog = createDialogDouble({ response: { response: 1 } });
  await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: new Error('mystery') });
  const payload = dialog.calls[0];
  assert.ok(payload.detail.includes('画布启动过程中遇到错误。'));
  assert.ok(payload.detail.includes('mystery'));
  assert.ok(
    payload.detail.includes('请进入兼容模式并导出诊断包，以便检查页面加载、数据恢复或浏览器进程的错误。'),
  );
});

test('a non-Error failure value is stringified, and an absent one becomes the unknown-error label', async () => {
  const stringDialog = createDialogDouble({ response: { response: 1 } });
  await promptForChromeShellStartupFailure({ dialogApi: stringDialog.api, error: 'plain failure' });
  assert.ok(stringDialog.calls[0].detail.includes('plain failure'));
  const missingDialog = createDialogDouble({ response: { response: 1 } });
  await promptForChromeShellStartupFailure({ dialogApi: missingDialog.api });
  assert.ok(missingDialog.calls[0].detail.includes('未知错误'));
});

test('a throwing dialog in the startup-failure prompt is swallowed as quit', async () => {
  const dialog = createDialogDouble({ throwOnShow: true });
  assert.equal(
    await promptForChromeShellStartupFailure({ dialogApi: dialog.api, error: new Error('boom') }),
    'quit',
  );
});

test('a throwing dialog on the timeout branch is swallowed as quit', async () => {
  const dialog = createDialogDouble({ throwOnShow: true });
  assert.equal(
    await promptForChromeShellStartupFailure({
      dialogApi: dialog.api,
      error: readyTimeoutError({ causeCode: 'EBUSY', profileRecovery: true }),
    }),
    'quit',
  );
});
