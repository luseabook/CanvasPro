import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LOCALE, setLocale } from '../i18n/index.js';
import { createFakePreviewContainer, installPreviewDomStubs } from '../../tests/testPreviewDom.js';
const restoreDom = installPreviewDomStubs();
let store,
  previewMode,
  previewUploadResult,
  originalStoreFns = null;
test.before(async () => {
  const _0x6aa16e = await import('../core/stores/appStore.js');
  ((store = _0x6aa16e.default),
    (previewMode = await import('./previewMode.js')),
    (previewUploadResult = await import('./previewUploadResult.js')),
    (originalStoreFns = { getState: store.getState, updateNodeData: store.updateNodeData }));
});
function restoreStore() {
  if (!store || !originalStoreFns) return;
  ((store.getState = originalStoreFns.getState), (store.updateNodeData = originalStoreFns.updateNodeData));
}
function installStoreState(_0x24d426) {
  ((store.getState = () => _0x24d426),
    (store.updateNodeData = (_0x410d68, _0x458d7b) => {
      const _0x3ded11 = _0x24d426.nodes?.[_0x410d68] || {};
      _0x24d426.nodes[_0x410d68] = { ..._0x3ded11, ..._0x458d7b };
    }));
}
(test.afterEach(() => {
  (setLocale(DEFAULT_LOCALE, { persist: false, notify: false }),
    previewMode._resetPreviewRuntimeForTests(),
    restoreStore());
}),
  test.after(() => {
    (previewMode._resetPreviewRuntimeForTests(), restoreStore(), restoreDom());
  }),
  test('previewUploadResult: 错误文案跟随当前语言', () => {
    (setLocale('en-US', { persist: false, notify: false }),
      assert.throws(
        () => previewUploadResult.applyUploadedPreviewImageResult({ nodeId: '' }),
        /Invalid upload result: missing node ID/,
      ),
      assert.throws(
        () =>
          previewUploadResult.applyUploadedPreviewVideoResult({
            nodeId: 'node-preview-video',
            uploadRes: {},
          }),
        /Invalid upload result: missing video local path/,
      ));
  }),
  test('previewUploadResult: 图片上传会覆盖为单结果并清掉假加载', () => {
    const _0x5a364e = 'node-preview-image',
      _0x56491f = {
        nodes: {
          [_0x5a364e]: {
            id: _0x5a364e,
            type: 'ai-image',
            images: [{ imageUrl: '/old.png' }, { imageUrl: '/old-2.png' }],
            mainImageIndex: 1,
            rhTaskStatus: 'pending',
          },
        },
      };
    (installStoreState(_0x56491f),
      previewMode.startPreviewNodeLoading(_0x5a364e, createFakePreviewContainer()),
      previewUploadResult.applyUploadedPreviewImageResult({
        nodeId: _0x5a364e,
        uploadRes: {
          url: '/data/uploads/preview.png',
          localPath: 'data/uploads/preview.png',
          originalWidth: 0x3c0,
          originalHeight: 0x21c,
        },
        fileName: 'preview.png',
      }),
      assert.equal(previewMode.isPreviewNodeLoading(_0x5a364e), false),
      assert.equal(_0x56491f.nodes[_0x5a364e].images.length, 1),
      assert.equal(_0x56491f.nodes[_0x5a364e].mainImageIndex, 0),
      assert.equal(_0x56491f.nodes[_0x5a364e].imageUrl, '/data/uploads/preview.png'),
      assert.equal(_0x56491f.nodes[_0x5a364e].fileName, 'preview.png'),
      assert.equal(_0x56491f.nodes[_0x5a364e].jobStatus, 'success'),
      assert.equal(_0x56491f.nodes[_0x5a364e].rhTaskStatus, 'idle'));
  }),
  test('previewUploadResult: 视频上传会覆盖为单结果并重置元信息抓取状态', () => {
    const _0x4bf6a4 = 'node-preview-video',
      _0x8b036b = {
        nodes: {
          [_0x4bf6a4]: {
            id: _0x4bf6a4,
            type: 'ai-video',
            videos: [{ videoUrl: '/old.mp4' }, { videoUrl: '/old-2.mp4' }],
            mainVideoIndex: 1,
            videoMetaSrc: '/old.mp4',
            asyncTaskStatus: 'pending',
          },
        },
      };
    (installStoreState(_0x8b036b),
      previewMode.startPreviewNodeLoading(_0x4bf6a4, createFakePreviewContainer()),
      previewUploadResult.applyUploadedPreviewVideoResult({
        nodeId: _0x4bf6a4,
        uploadRes: { url: '/data/uploads/preview.mp4', localPath: 'data/uploads/preview.mp4' },
        fileName: 'preview.mp4',
      }),
      assert.equal(previewMode.isPreviewNodeLoading(_0x4bf6a4), false),
      assert.equal(_0x8b036b.nodes[_0x4bf6a4].videos.length, 1),
      assert.equal(_0x8b036b.nodes[_0x4bf6a4].mainVideoIndex, 0),
      assert.equal(_0x8b036b.nodes[_0x4bf6a4].videoUrl, '/data/uploads/preview.mp4'),
      assert.equal(_0x8b036b.nodes[_0x4bf6a4].videoMetaSrc, ''),
      assert.equal(_0x8b036b.nodes[_0x4bf6a4].asyncTaskStatus, 'idle'));
  }),
  test('previewUploadResult: 音频上传会写回当前结果并清掉假加载', () => {
    const _0x128f93 = 'node-preview-audio',
      _0x10edf0 = {
        nodes: {
          [_0x128f93]: { id: _0x128f93, type: 'ai-audio', audioUrl: '/old.mp3', rhTaskStatus: 'pending' },
        },
      };
    (installStoreState(_0x10edf0),
      previewMode.startPreviewNodeLoading(_0x128f93, createFakePreviewContainer()),
      previewUploadResult.applyUploadedPreviewAudioResult({
        nodeId: _0x128f93,
        uploadRes: { url: '/data/uploads/preview.mp3', localPath: 'data/uploads/preview.mp3' },
        fileName: 'preview.mp3',
      }),
      assert.equal(previewMode.isPreviewNodeLoading(_0x128f93), false),
      assert.equal(_0x10edf0.nodes[_0x128f93].audioUrl, '/data/uploads/preview.mp3'),
      assert.equal(_0x10edf0.nodes[_0x128f93].src, '/data/uploads/preview.mp3'),
      assert.equal(_0x10edf0.nodes[_0x128f93].fileName, 'preview.mp3'),
      assert.equal(_0x10edf0.nodes[_0x128f93].rhTaskStatus, 'idle'));
  }));
