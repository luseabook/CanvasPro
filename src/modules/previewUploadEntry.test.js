import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bindPreviewUploadEntry,
  handlePreviewUploadFile,
  resolvePreviewUploadTarget,
} from './previewUploadEntry.js';
import { _resetPreviewRuntimeForTests, setPreviewMode } from './previewMode.js';
import { IMAGE_TOOLBAR_HTML } from '../components/nodeToolbar/imageToolbarHtml.js';
import { VIDEO_TOOLBAR_HTML } from '../components/nodeToolbar/videoToolbarHtml.js';
import { AUDIO_TOOLBAR_HTML } from '../components/nodeToolbar/audioToolbar.js';
import { DEFAULT_LOCALE, setLocale } from '../i18n/index.js';
import { installDomEnvironment as installPreviewDomStubs } from '../../tools/dom-test-environment.mjs';
const restoreDom = installPreviewDomStubs();
(test.afterEach(() => {
  (setLocale(DEFAULT_LOCALE, { persist: false, notify: false }), _resetPreviewRuntimeForTests());
}),
  test.after(() => {
    (_resetPreviewRuntimeForTests(), restoreDom());
  }));
function createFile({ name: name = 'preview.png', type: type = 'image/png' } = {}) {
  return { name: name, type: type };
}
function createButtonStub() {
  return { dataset: {}, disabled: false, textContent: '上传' };
}
function createEventTargetStub() {
  const map = new Map();
  return {
    accept: '',
    value: '',
    files: [],
    clicked: false,
    addEventListener(value, item) {
      map.set(value, item);
    },
    removeEventListener(key, index) {
      if (map.get(key) === index) map.delete(key);
    },
    click() {
      this.clicked = true;
    },
    async dispatch(result) {
      await map.get(result)?.();
    },
  };
}
function createStoreState({ selectedNodeIds: selectedNodeIds = [], nodes: nodes = {} } = {}) {
  return { getState: () => ({ selectedNodeIds: selectedNodeIds, nodes: nodes }) };
}
(test('previewUploadEntry: 会校验唯一选中的可上传节点', () => {
  (assert.equal(resolvePreviewUploadTarget(createStoreState().getState()).ok, false),
    assert.equal(
      resolvePreviewUploadTarget(createStoreState({ selectedNodeIds: ['a', 'b'] }).getState()).ok,
      false,
    ),
    assert.equal(
      resolvePreviewUploadTarget(
        createStoreState({
          selectedNodeIds: ['text-1'],
          nodes: { 'text-1': { id: 'text-1', type: 'ai-text' } },
        }).getState(),
      ).ok,
      false,
    ));
}),
  test('previewUploadEntry: 图片、视频、音频按选中节点类型分发', async () => {
    const list = [],
      uploadFileImpl = async (error, data) => {
        return (
          list.push(['upload', error.name, data]),
          { url: '/data/uploads/' + error.name, localPath: 'data/uploads/' + error.name }
        );
      },
      applyResults = {
        image: (options) => list.push(['image', options.nodeId, options.fileName]),
        video: (target) => list.push(['video', target.nodeId, target.fileName]),
        audio: (source) => list.push(['audio', source.nodeId, source.fileName]),
      },
      showToast = (next, current) => list.push(['toast', next, current]),
      entry = [
        ['image', 'ai-image', createFile({ name: 'p.png', type: 'image/png' })],
        ['image', 'source-image', createFile({ name: 'source-p.png', type: 'image/png' })],
        ['video', 'ai-video', createFile({ name: 'v.mp4', type: 'video/mp4' })],
        ['video', 'source-video', createFile({ name: 'source-v.mp4', type: 'video/mp4' })],
        ['audio', 'ai-audio', createFile({ name: 'a.mp3', type: 'audio/mpeg' })],
      ];
    for (const [record, type2, file] of entry) {
      list.length = 0;
      const handlePreviewUploadFile2 = await handlePreviewUploadFile({
        file: file,
        storeApi: createStoreState({
          selectedNodeIds: ['node-' + record],
          nodes: { ['node-' + record]: { id: 'node-' + record, type: type2 } },
        }),
        uploadFileImpl: uploadFileImpl,
        applyResults: applyResults,
        showToast: showToast,
        getProjectId: () => 'project-1',
      });
      (assert.equal(handlePreviewUploadFile2, true),
        assert.deepEqual(list, [
          ['upload', file.name, 'project-1'],
          [record, 'node-' + record, file.name],
          [
            'toast',
            '已将上传' +
              (record === 'image' ? '图片' : record === 'video' ? '视频' : '音频') +
              '写入当前节点',
            'success',
          ],
        ]));
    }
  }),
  test('previewUploadEntry: 可见上传文案跟随当前语言', async () => {
    (setLocale('en-US', { persist: false, notify: false }),
      assert.equal(
        resolvePreviewUploadTarget(createStoreState().getState()).message,
        'Select one node to receive the upload',
      ));
    const response = resolvePreviewUploadTarget(
      createStoreState({
        selectedNodeIds: ['node-image'],
        nodes: { 'node-image': { id: 'node-image', type: 'ai-image' } },
      }).getState(),
    );
    (assert.equal(response.ok, true),
      assert.equal(response.label, 'image'),
      assert.equal(response.successMessage, 'Uploaded image applied to the current node'));
    const list2 = [],
      handlePreviewUploadFile3 = await handlePreviewUploadFile({
        file: createFile({ name: 'bad.mp4', type: 'video/mp4' }),
        storeApi: createStoreState({
          selectedNodeIds: ['node-image'],
          nodes: { 'node-image': { id: 'node-image', type: 'ai-image' } },
        }),
        uploadFileImpl: async () => {
          throw new Error('should not upload');
        },
        showToast: (payload, handle) => list2.push([payload, handle]),
      });
    (assert.equal(handlePreviewUploadFile3, false),
      assert.deepEqual(list2, [['Upload image file', 'error']]));
  }),
  test('previewUploadEntry: 文件类型错误与上传失败不会写入结果且按钮会恢复', async () => {
    const list3 = [],
      button = createButtonStub(),
      storeApi = createStoreState({
        selectedNodeIds: ['node-image'],
        nodes: { 'node-image': { id: 'node-image', type: 'ai-image' } },
      }),
      showToast2 = (state, config) => list3.push([state, config]),
      handlePreviewUploadFile4 = await handlePreviewUploadFile({
        file: createFile({ name: 'bad.mp4', type: 'video/mp4' }),
        button: button,
        storeApi: storeApi,
        uploadFileImpl: async () => {
          throw new Error('不应上传');
        },
        applyResults: { image: () => list3.push(['apply']) },
        showToast: showToast2,
      });
    (assert.equal(handlePreviewUploadFile4, false),
      assert.equal(button.disabled, false),
      assert.deepEqual(list3, [['请上传图片文件', 'error']]),
      (list3.length = 0));
    const handlePreviewUploadFile5 = await handlePreviewUploadFile({
      file: createFile({ name: 'p.png', type: 'image/png' }),
      button: button,
      storeApi: storeApi,
      uploadFileImpl: async () => {
        throw new Error('上传失败');
      },
      applyResults: { image: () => list3.push(['apply']) },
      showToast: showToast2,
    });
    (assert.equal(handlePreviewUploadFile5, false),
      assert.equal(button.disabled, false),
      assert.equal(button.textContent, '上传'),
      assert.deepEqual(list3, [['上传失败', 'error']]));
  }),
  test('previewUploadEntry: 绑定按钮会按当前选中节点设置 accept 并打开文件选择', async () => {
    setPreviewMode(true);
    const button2 = createEventTargetStub();
    ((button2.dataset = {}), (button2.textContent = '上传'));
    const input = createEventTargetStub();
    (bindPreviewUploadEntry({
      button: button2,
      input: input,
      storeApi: createStoreState({
        selectedNodeIds: ['node-video'],
        nodes: { 'node-video': { id: 'node-video', type: 'ai-video' } },
      }),
      showToast: () => {},
    }),
      await button2.dispatch('click'),
      assert.equal(input.accept, 'video/*'),
      assert.equal(input.clicked, true));
  }),
  test('previewUploadEntry: 节点工具栏不再包含预览上传按钮', () => {
    for (const scope of [IMAGE_TOOLBAR_HTML, VIDEO_TOOLBAR_HTML, AUDIO_TOOLBAR_HTML]) {
      (assert.doesNotMatch(scope, /act-preview-upload/), assert.doesNotMatch(scope, /preview-upload-btn/));
    }
  }));
