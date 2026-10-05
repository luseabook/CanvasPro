import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LOCALE, setLocale } from '../i18n/index.js';
import {
  createPreviewContainer as createFakePreviewContainer,
  installDomEnvironment as installPreviewDomStubs,
} from '../../tools/dom-test-environment.mjs';
const restoreDom = installPreviewDomStubs();
let store,
  previewMode,
  previewUploadResult,
  originalStoreFns = null;
test.before(async () => {
  const importValue = await import('../core/stores/appStore.js');
  ((store = importValue.default),
    (previewMode = await import('./previewMode.js')),
    (previewUploadResult = await import('./previewUploadResult.js')),
    (originalStoreFns = { getState: store.getState, updateNodeData: store.updateNodeData }));
});
function restoreStore() {
  if (!store || !originalStoreFns) return;
  ((store.getState = originalStoreFns.getState), (store.updateNodeData = originalStoreFns.updateNodeData));
}
function installStoreState(value) {
  ((store.getState = () => value),
    (store.updateNodeData = (item, args) => {
      const args2 = value.nodes?.[item] || {};
      value.nodes[item] = { ...args2, ...args };
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
    const id = 'node-preview-image',
      key = {
        nodes: {
          [id]: {
            id: id,
            type: 'ai-image',
            images: [{ imageUrl: '/old.png' }, { imageUrl: '/old-2.png' }],
            mainImageIndex: 1,
            rhTaskStatus: 'pending',
          },
        },
      };
    (installStoreState(key),
      previewMode.startPreviewNodeLoading(id, createFakePreviewContainer()),
      previewUploadResult.applyUploadedPreviewImageResult({
        nodeId: id,
        uploadRes: {
          url: '/data/uploads/preview.png',
          localPath: 'data/uploads/preview.png',
          originalWidth: 960,
          originalHeight: 540,
        },
        fileName: 'preview.png',
      }),
      assert.equal(previewMode.isPreviewNodeLoading(id), false),
      assert.equal(key.nodes[id].images.length, 1),
      assert.equal(key.nodes[id].mainImageIndex, 0),
      assert.equal(key.nodes[id].imageUrl, '/data/uploads/preview.png'),
      assert.equal(key.nodes[id].fileName, 'preview.png'),
      assert.equal(key.nodes[id].jobStatus, 'success'),
      assert.equal(key.nodes[id].rhTaskStatus, 'idle'));
  }),
  test('previewUploadResult: 视频上传会覆盖为单结果并重置元信息抓取状态', () => {
    const id2 = 'node-preview-video',
      index = {
        nodes: {
          [id2]: {
            id: id2,
            type: 'ai-video',
            videos: [{ videoUrl: '/old.mp4' }, { videoUrl: '/old-2.mp4' }],
            mainVideoIndex: 1,
            videoMetaSrc: '/old.mp4',
            asyncTaskStatus: 'pending',
          },
        },
      };
    (installStoreState(index),
      previewMode.startPreviewNodeLoading(id2, createFakePreviewContainer()),
      previewUploadResult.applyUploadedPreviewVideoResult({
        nodeId: id2,
        uploadRes: { url: '/data/uploads/preview.mp4', localPath: 'data/uploads/preview.mp4' },
        fileName: 'preview.mp4',
      }),
      assert.equal(previewMode.isPreviewNodeLoading(id2), false),
      assert.equal(index.nodes[id2].videos.length, 1),
      assert.equal(index.nodes[id2].mainVideoIndex, 0),
      assert.equal(index.nodes[id2].videoUrl, '/data/uploads/preview.mp4'),
      assert.equal(index.nodes[id2].videoMetaSrc, ''),
      assert.equal(index.nodes[id2].asyncTaskStatus, 'idle'));
  }),
  test('previewUploadResult: 音频上传会写回当前结果并清掉假加载', () => {
    const id3 = 'node-preview-audio',
      result = {
        nodes: {
          [id3]: { id: id3, type: 'ai-audio', audioUrl: '/old.mp3', rhTaskStatus: 'pending' },
        },
      };
    (installStoreState(result),
      previewMode.startPreviewNodeLoading(id3, createFakePreviewContainer()),
      previewUploadResult.applyUploadedPreviewAudioResult({
        nodeId: id3,
        uploadRes: { url: '/data/uploads/preview.mp3', localPath: 'data/uploads/preview.mp3' },
        fileName: 'preview.mp3',
      }),
      assert.equal(previewMode.isPreviewNodeLoading(id3), false),
      assert.equal(result.nodes[id3].audioUrl, '/data/uploads/preview.mp3'),
      assert.equal(result.nodes[id3].src, '/data/uploads/preview.mp3'),
      assert.equal(result.nodes[id3].fileName, 'preview.mp3'),
      assert.equal(result.nodes[id3].rhTaskStatus, 'idle'));
  }));
