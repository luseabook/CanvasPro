import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPreviewContainer as createFakePreviewContainer, installDomEnvironment as installPreviewDomStubs } from '../../tools/dom-test-environment.mjs';
const restoreDom = installPreviewDomStubs(),
  previewModeModule = await import('./previewMode.js'),
  {
    _resetPreviewRuntimeForTests,
    isPreviewModeEnabled,
    isPreviewNodeLoading,
    clearAllPreviewNodeLoadings,
    setPreviewMode,
    stopPreviewNodeLoading,
    startPreviewNodeLoading,
    syncPreviewNodeLoading,
  } = previewModeModule;
(test.afterEach(() => {
  _resetPreviewRuntimeForTests();
}),
  test.after(() => {
    (_resetPreviewRuntimeForTests(), restoreDom());
  }),
  test('previewMode: 切换预览模式会同步 window 与 body class', () => {
    (assert.equal(isPreviewModeEnabled(), false),
      setPreviewMode(true),
      assert.equal(globalThis.window.PREVIEW_MODE, true),
      assert.equal(isPreviewModeEnabled(), true),
      assert.equal(globalThis.document.body.classList.contains('preview-mode'), true),
      setPreviewMode(false),
      assert.equal(globalThis.window.PREVIEW_MODE, false),
      assert.equal(globalThis.document.body.classList.contains('preview-mode'), false));
  }),
  test('previewMode: 关闭预览模式会清空会话级假加载', async () => {
    const _0x542c6a = createFakePreviewContainer();
    (startPreviewNodeLoading('node-preview-1', _0x542c6a),
      assert.equal(isPreviewNodeLoading('node-preview-1'), true),
      await new Promise((_0x23eb3e) => setTimeout(_0x23eb3e, 70)),
      assert.equal(_0x542c6a.classList.contains('img-preview-loading'), true),
      setPreviewMode(false),
      assert.equal(isPreviewNodeLoading('node-preview-1'), false),
      assert.equal(_0x542c6a.classList.contains('img-preview-loading'), false));
  }),
  test('previewMode: 假加载会触发 start/stop 生命周期回调', () => {
    const _0x16bd1e = createFakePreviewContainer(),
      _0x298a79 = [];
    (startPreviewNodeLoading('node-preview-callback', _0x16bd1e, {
      onStart: () => _0x298a79.push('start'),
      onStop: () => _0x298a79.push('stop'),
    }),
      assert.deepEqual(_0x298a79, ['start']),
      stopPreviewNodeLoading('node-preview-callback'),
      assert.deepEqual(_0x298a79, ['start', 'stop']));
  }),
  test('previewMode: clear 与退出预览模式都会触发 stop 回调', () => {
    const _0x4e6b86 = [];
    (startPreviewNodeLoading('node-preview-clear', createFakePreviewContainer(), {
      onStart: () => _0x4e6b86.push('clear-start'),
      onStop: () => _0x4e6b86.push('clear-stop'),
    }),
      clearAllPreviewNodeLoadings(),
      assert.deepEqual(_0x4e6b86, ['clear-start', 'clear-stop']),
      setPreviewMode(true),
      startPreviewNodeLoading('node-preview-mode-off', createFakePreviewContainer(), {
        onStart: () => _0x4e6b86.push('mode-start'),
        onStop: () => _0x4e6b86.push('mode-stop'),
      }),
      setPreviewMode(false),
      assert.deepEqual(_0x4e6b86, ['clear-start', 'clear-stop', 'mode-start', 'mode-stop']));
  }),
  test('previewMode: sync 到新实例会停旧回调并启用新回调', () => {
    const _0x4f4a85 = [];
    (startPreviewNodeLoading('node-preview-sync', createFakePreviewContainer(), {
      onStart: () => _0x4f4a85.push('old-start'),
      onStop: () => _0x4f4a85.push('old-stop'),
    }),
      syncPreviewNodeLoading('node-preview-sync', createFakePreviewContainer(), {
        onStart: () => _0x4f4a85.push('new-start'),
        onStop: () => _0x4f4a85.push('new-stop'),
      }),
      assert.deepEqual(_0x4f4a85, ['old-start', 'old-stop', 'new-start']),
      stopPreviewNodeLoading('node-preview-sync'),
      assert.deepEqual(_0x4f4a85, ['old-start', 'old-stop', 'new-start', 'new-stop']));
  }),
  test('previewMode: 工具栏中的预览专属按钮默认隐藏，仅在预览模式显示', async () => {
    const _0x59299a = await readFile(new URL('../../styles/v2.css', import.meta.url), 'utf8');
    (assert.match(_0x59299a, /\.node-floating-toolbar\s+\.preview-mode-only\s*\{\s*display:\s*none\s*;/),
      assert.match(
        _0x59299a,
        /body\.preview-mode\s+\.node-floating-toolbar\s+\.preview-mode-only\s*\{\s*display:\s*inline-flex\s*;/,
      ));
  }));
