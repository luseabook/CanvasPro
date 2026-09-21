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
import { installPreviewDomStubs } from '../../tests/testPreviewDom.js';
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
  const _0x2b411d = new Map();
  return {
    accept: '',
    value: '',
    files: [],
    clicked: false,
    addEventListener(_0x5705f5, _0xe3cc45) {
      _0x2b411d.set(_0x5705f5, _0xe3cc45);
    },
    removeEventListener(_0x4817ab, _0x5c3b25) {
      if (_0x2b411d.get(_0x4817ab) === _0x5c3b25) _0x2b411d.delete(_0x4817ab);
    },
    click() {
      this.clicked = true;
    },
    async dispatch(_0x5eb7ac) {
      await _0x2b411d.get(_0x5eb7ac)?.();
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
    const _0xefac11 = [],
      _0x228e54 = async (_0x15b06f, _0x262520) => {
        return (
          _0xefac11.push(['upload', _0x15b06f.name, _0x262520]),
          { url: '/data/uploads/' + _0x15b06f.name, localPath: 'data/uploads/' + _0x15b06f.name }
        );
      },
      _0x4c5ddf = {
        image: (_0xcc3bab) => _0xefac11.push(['image', _0xcc3bab.nodeId, _0xcc3bab.fileName]),
        video: (_0x36caca) => _0xefac11.push(['video', _0x36caca.nodeId, _0x36caca.fileName]),
        audio: (_0x248a43) => _0xefac11.push(['audio', _0x248a43.nodeId, _0x248a43.fileName]),
      },
      _0x18f49b = (_0x391016, _0x2b9116) => _0xefac11.push(['toast', _0x391016, _0x2b9116]),
      _0x2795cd = [
        ['image', 'ai-image', createFile({ name: 'p.png', type: 'image/png' })],
        ['image', 'source-image', createFile({ name: 'source-p.png', type: 'image/png' })],
        ['video', 'ai-video', createFile({ name: 'v.mp4', type: 'video/mp4' })],
        ['video', 'source-video', createFile({ name: 'source-v.mp4', type: 'video/mp4' })],
        ['audio', 'ai-audio', createFile({ name: 'a.mp3', type: 'audio/mpeg' })],
      ];
    for (const [_0x2b0a8c, _0x2df99e, _0x3c0fbe] of _0x2795cd) {
      _0xefac11.length = 0;
      const _0x2b5c26 = await handlePreviewUploadFile({
        file: _0x3c0fbe,
        storeApi: createStoreState({
          selectedNodeIds: ['node-' + _0x2b0a8c],
          nodes: { ['node-' + _0x2b0a8c]: { id: 'node-' + _0x2b0a8c, type: _0x2df99e } },
        }),
        uploadFileImpl: _0x228e54,
        applyResults: _0x4c5ddf,
        showToast: _0x18f49b,
        getProjectId: () => 'project-1',
      });
      (assert.equal(_0x2b5c26, true),
        assert.deepEqual(_0xefac11, [
          ['upload', _0x3c0fbe.name, 'project-1'],
          [_0x2b0a8c, 'node-' + _0x2b0a8c, _0x3c0fbe.name],
          [
            'toast',
            '已将上传' +
              (_0x2b0a8c === 'image' ? '图片' : _0x2b0a8c === 'video' ? '视频' : '音频') +
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
    const _0x360fd4 = resolvePreviewUploadTarget(
      createStoreState({
        selectedNodeIds: ['node-image'],
        nodes: { 'node-image': { id: 'node-image', type: 'ai-image' } },
      }).getState(),
    );
    (assert.equal(_0x360fd4.ok, true),
      assert.equal(_0x360fd4.label, 'image'),
      assert.equal(_0x360fd4.successMessage, 'Uploaded image applied to the current node'));
    const _0x252aff = [],
      _0x54f17a = await handlePreviewUploadFile({
        file: createFile({ name: 'bad.mp4', type: 'video/mp4' }),
        storeApi: createStoreState({
          selectedNodeIds: ['node-image'],
          nodes: { 'node-image': { id: 'node-image', type: 'ai-image' } },
        }),
        uploadFileImpl: async () => {
          throw new Error('should not upload');
        },
        showToast: (_0x9957b3, _0x14a861) => _0x252aff.push([_0x9957b3, _0x14a861]),
      });
    (assert.equal(_0x54f17a, false), assert.deepEqual(_0x252aff, [['Upload image file', 'error']]));
  }),
  test('previewUploadEntry: 文件类型错误与上传失败不会写入结果且按钮会恢复', async () => {
    const _0x9a450b = [],
      _0x6c324b = createButtonStub(),
      _0x1be89e = createStoreState({
        selectedNodeIds: ['node-image'],
        nodes: { 'node-image': { id: 'node-image', type: 'ai-image' } },
      }),
      _0x3ecee3 = (_0x1cd06f, _0x55d955) => _0x9a450b.push([_0x1cd06f, _0x55d955]),
      _0x41f5cd = await handlePreviewUploadFile({
        file: createFile({ name: 'bad.mp4', type: 'video/mp4' }),
        button: _0x6c324b,
        storeApi: _0x1be89e,
        uploadFileImpl: async () => {
          throw new Error('不应上传');
        },
        applyResults: { image: () => _0x9a450b.push(['apply']) },
        showToast: _0x3ecee3,
      });
    (assert.equal(_0x41f5cd, false),
      assert.equal(_0x6c324b.disabled, false),
      assert.deepEqual(_0x9a450b, [['请上传图片文件', 'error']]),
      (_0x9a450b.length = 0));
    const _0x1cc3f7 = await handlePreviewUploadFile({
      file: createFile({ name: 'p.png', type: 'image/png' }),
      button: _0x6c324b,
      storeApi: _0x1be89e,
      uploadFileImpl: async () => {
        throw new Error('上传失败');
      },
      applyResults: { image: () => _0x9a450b.push(['apply']) },
      showToast: _0x3ecee3,
    });
    (assert.equal(_0x1cc3f7, false),
      assert.equal(_0x6c324b.disabled, false),
      assert.equal(_0x6c324b.textContent, '上传'),
      assert.deepEqual(_0x9a450b, [['上传失败', 'error']]));
  }),
  test('previewUploadEntry: 绑定按钮会按当前选中节点设置 accept 并打开文件选择', async () => {
    setPreviewMode(true);
    const _0x173f85 = createEventTargetStub();
    ((_0x173f85.dataset = {}), (_0x173f85.textContent = '上传'));
    const _0x49ec81 = createEventTargetStub();
    (bindPreviewUploadEntry({
      button: _0x173f85,
      input: _0x49ec81,
      storeApi: createStoreState({
        selectedNodeIds: ['node-video'],
        nodes: { 'node-video': { id: 'node-video', type: 'ai-video' } },
      }),
      showToast: () => {},
    }),
      await _0x173f85.dispatch('click'),
      assert.equal(_0x49ec81.accept, 'video/*'),
      assert.equal(_0x49ec81.clicked, true));
  }),
  test('previewUploadEntry: 节点工具栏不再包含预览上传按钮', () => {
    for (const _0xe953d7 of [IMAGE_TOOLBAR_HTML, VIDEO_TOOLBAR_HTML, AUDIO_TOOLBAR_HTML]) {
      (assert.doesNotMatch(_0xe953d7, /act-preview-upload/),
        assert.doesNotMatch(_0xe953d7, /preview-upload-btn/));
    }
  }));
