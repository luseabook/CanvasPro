import test from 'node:test';
import assert from 'node:assert/strict';
import { __videoReferenceInputTest, createVideoNodeReferenceInputModule } from './referenceInputModule.js';
import { createVideoNodeParameterPanelModule } from './parameterPanelModule.js';
import { createReferenceFallbackThumbHtml } from '../../modules/referenceThumbnailFallback.js';
import { getFixedInputSlotConfigFromManifest } from '../../modules/fixedInputAssetRefs.js';
import { hasUsableInputNodeSource } from '../../modules/modelInputPolicy.js';
import {
  _resetAssetMentionRegistryForTests,
  setAssetMentionAssets,
} from '../../modules/assetMentionRegistry.js';
test.afterEach(() => {
  _resetAssetMentionRegistryForTests();
});
function createProto() {
  return createVideoNodeReferenceInputModule({
    store: { getState: () => ({ nodes: {} }), getIncomingEdges: () => [] },
    api: {},
    _syncPillLabels: () => {},
    getImage: async () => null,
    ensureThumbDecoded: () => {},
    revealRefThumbMedia: () => {},
  });
}
(test('video reference input: ai-video 可从 videos 主项读取缩略图', () => {
  const _0x5eae42 = {
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [
        { localPath: 'output/dreamina-video.mp4', thumbUrl: '/output/VideoThumbs/dreamina-video.jpg' },
      ],
    },
    _0x590f44 = __videoReferenceInputTest.getVideoThumbCandidate(_0x5eae42, {
      sourceMediaKey: 'output/dreamina-video.mp4',
    });
  assert.equal(_0x590f44.thumbUrl, '/output/VideoThumbs/dreamina-video.jpg');
}),
  test('video reference input: sourceMediaKey 指向多视频非主项时不误用顶层缩略图', () => {
    const _0x1cfb36 = {
        type: 'ai-video',
        mainVideoIndex: 0,
        thumbUrl: '/output/VideoThumbs/main.jpg',
        videos: [
          { localPath: 'output/main.mp4', thumbUrl: '/output/VideoThumbs/main.jpg' },
          { localPath: 'output/second.mp4', thumbUrl: '/output/VideoThumbs/second.jpg' },
        ],
      },
      _0x23a519 = __videoReferenceInputTest.getVideoThumbCandidate(_0x1cfb36, {
        sourceMediaKey: 'output/second.mp4',
      });
    assert.equal(_0x23a519.thumbUrl, '/output/VideoThumbs/second.jpg');
  }),
  test('video reference input: 缩略图缺失时按选中视频项返回可回填路径', () => {
    const _0x21f2e6 = {
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [
          { localPath: 'output/main.mp4', thumbUrl: '/output/VideoThumbs/main.jpg' },
          { localPath: 'output/second.mp4' },
        ],
      },
      _0xf5cb49 = __videoReferenceInputTest.getVideoThumbCandidate(_0x21f2e6, {
        sourceMediaKey: 'output/second.mp4',
      }),
      _0x57b36f = __videoReferenceInputTest.getVideoSourcePathForThumb(_0x21f2e6, {
        sourceMediaKey: 'output/second.mp4',
      });
    (assert.equal(_0xf5cb49.thumbUrl, ''), assert.equal(_0x57b36f, '/output/second.mp4'));
  }),
  test('video reference input: display local paths can resolve fallback video refs', () => {
    const _0x265164 = { type: 'source-video', displayLocalPath: 'data/assets/display.mp4' };
    (assert.equal(
      __videoReferenceInputTest.getVideoSourcePathForThumb(_0x265164, {}),
      '/data/assets/display.mp4',
    ),
      assert.equal(
        __videoReferenceInputTest.getVideoRefMediaSignature(_0x265164, {}),
        'data/assets/display.mp4',
      ));
  }),
  test('video reference input: 来源状态签名随 videos 缩略图变化', () => {
    const _0x1f8f1b = createProto(),
      _0x5b6e45 = {
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [{ localPath: 'output/dreamina-video.mp4' }],
      },
      _0x5581a9 = {
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [
          { localPath: 'output/dreamina-video.mp4', thumbUrl: '/output/VideoThumbs/dreamina-video.jpg' },
        ],
      };
    assert.notEqual(_0x1f8f1b._getRefSourceStateKey(_0x5b6e45), _0x1f8f1b._getRefSourceStateKey(_0x5581a9));
  }),
  test('video reference input: 来源状态签名随视频元数据变化', () => {
    const _0x58ff4f = createProto(),
      _0x2c0911 = { type: 'source-video', localPath: 'output/CutVideo/cut.mp4' },
      _0x1cac41 = { ..._0x2c0911, videoFrameCount: 59, videoDuration: 2.46, videoFps: 24 };
    assert.notEqual(_0x58ff4f._getRefSourceStateKey(_0x2c0911), _0x58ff4f._getRefSourceStateKey(_0x1cac41));
  }),
  test('video reference input: 来源状态签名忽略任务轮询状态', () => {
    const _0x5bfa18 = createProto(),
      _0x3215a3 = {
        type: 'ai-video',
        _bizRev: 12,
        mainVideoIndex: 0,
        rhTaskStatus: 'running',
        dreaminaTaskLastCheckedAt: 0x18e23f14c00,
        videos: [
          { localPath: 'output/dreamina-video.mp4', thumbUrl: '/output/VideoThumbs/dreamina-video.jpg' },
        ],
      },
      _0x284007 = {
        ..._0x3215a3,
        _bizRev: 19,
        rhTaskStatus: 'pending',
        dreaminaTaskLastCheckedAt: 0x18e23f19a20,
      },
      _0x166432 = {
        ..._0x284007,
        videos: [
          { localPath: 'output/dreamina-video.mp4', thumbUrl: '/output/VideoThumbs/dreamina-video-new.jpg' },
        ],
      };
    (assert.equal(_0x5bfa18._getRefSourceStateKey(_0x3215a3), _0x5bfa18._getRefSourceStateKey(_0x284007)),
      assert.notEqual(
        _0x5bfa18._getRefSourceStateKey(_0x3215a3),
        _0x5bfa18._getRefSourceStateKey(_0x166432),
      ));
  }),
  test('video reference input: text/audio fallback thumbnails use shared blue labels', () => {
    const _0x4ca260 = createReferenceFallbackThumbHtml('text'),
      _0x5977e6 = createReferenceFallbackThumbHtml('audio'),
      _0x1fa65c = __videoReferenceInputTest.createRunningHubAudioFallbackThumbHtml();
    (assert.match(_0x4ca260, /class="[^"]*\bref-thumb-media\b[^"]*\bref-thumb-fallback\b[^"]*"/),
      assert.match(_0x4ca260, />TEXT<\/div>/),
      assert.doesNotMatch(_0x4ca260, /<svg|style=/),
      assert.match(_0x5977e6, /class="[^"]*\bref-thumb-media\b[^"]*\bref-thumb-fallback\b[^"]*"/),
      assert.match(_0x5977e6, />AUDIO<\/div>/),
      assert.doesNotMatch(_0x5977e6, /<svg|style=/),
      assert.match(
        _0x1fa65c,
        /class="[^"]*\bref-thumb-media\b[^"]*\brh-v5-ref-media-fallback\b[^"]*\bref-thumb-fallback\b[^"]*"/,
      ),
      assert.match(_0x1fa65c, />AUDIO<\/div>/),
      assert.doesNotMatch(_0x1fa65c, /<svg|style=/));
  }));
function makeAssetPill({
  assetId: _0x433ae4,
  assetIndex: _0x387ae2,
  type: _0x2e4069,
  label: label = '@asset',
}) {
  return {
    dataset: {
      refOrigin: 'asset',
      assetId: _0x433ae4,
      assetIndex: String(_0x387ae2),
      refType: _0x2e4069,
      label: label,
    },
    classList: {
      contains(_0x51fa62) {
        return _0x51fa62 === 'ref-pill';
      },
    },
    textContent: label,
  };
}
function makePromptEl(_0x777e98 = []) {
  return {
    innerText: _0x777e98.map((_0x519c40) => _0x519c40.textContent || '').join(' '),
    querySelectorAll(_0xd2a65c) {
      return _0xd2a65c === '.ref-pill' ? _0x777e98 : [];
    },
  };
}
(test('video reference input: V5 源视频帧数优先显示真实 videoFrameCount', () => {
  const _0xac2515 = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
    inEdges: [{ id: 'e-source', sourceId: 'source-video', refSlot: 'sourceVideo' }],
    nodes: { 'source-video': { type: 'source-video', videoFrameCount: 96, videoDuration: 10 } },
    targetFps: 24,
  });
  assert.equal(_0xac2515, 96);
}),
  test('video reference input: V5 源视频缺少真实帧数时按时长兜底估算', () => {
    const _0x121a61 = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
      inEdges: [{ id: 'e-source', sourceId: 'source-video', refSlot: 'sourceVideo' }],
      nodes: { 'source-video': { type: 'source-video', videoDuration: 3.5 } },
      targetFps: 24,
    });
    assert.equal(_0x121a61, 84);
  }),
  test('video reference input: V5 无连线时从隐藏资产源视频读取真实帧数', () => {
    setAssetMentionAssets([
      {
        id: 'asset-source-video',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4', videoFrameCount: 72 },
          },
        ],
      },
    ]);
    const _0x113508 = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
      nodeData: { promptAssetInputRefs: [{ assetId: 'asset-source-video', itemIndex: 0, type: 'video' }] },
      targetFps: 24,
    });
    assert.equal(_0x113508, 72);
  }),
  test('video reference input: V5 无连线时从提示词资产源视频读取真实帧数', () => {
    setAssetMentionAssets([
      {
        id: 'asset-prompt-video',
        items: [
          {
            name: 'prompt source clip',
            type: 'source-video',
            nodeData: {
              type: 'source-video',
              localPath: 'data/assets/prompt-source.mp4',
              videoFrameCount: 88,
            },
          },
        ],
      },
    ]);
    const _0x584d76 = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
      promptEl: makePromptEl([
        makeAssetPill({
          assetId: 'asset-prompt-video',
          assetIndex: 0,
          type: 'video',
          label: 'prompt source clip',
        }),
      ]),
      targetFps: 24,
    });
    assert.equal(_0x584d76, 88);
  }),
  test('video reference input: V5 源视频没有有效帧数或时长时返回空', () => {
    const _0x469e52 = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
      inEdges: [{ id: 'e-source', sourceId: 'source-video', refSlot: 'sourceVideo' }],
      nodes: { 'source-video': { type: 'source-video', localPath: 'data/assets/source.mp4' } },
      targetFps: 24,
    });
    assert.equal(_0x469e52, null);
  }));
function makeClassList(_0x4a3d36) {
  return {
    contains(_0x3c8e54) {
      return String(_0x4a3d36.className || '')
        .split(/\s+/)
        .filter(Boolean)
        .includes(String(_0x3c8e54 || ''));
    },
    add(..._0x43827c) {
      const _0x29682e = new Set(
        String(_0x4a3d36.className || '')
          .split(/\s+/)
          .filter(Boolean),
      );
      (_0x43827c.forEach((_0x2a5405) => _0x29682e.add(String(_0x2a5405 || ''))),
        (_0x4a3d36.className = Array.from(_0x29682e).join(' ')));
    },
    remove(..._0x5110aa) {
      const _0x108fe1 = new Set(_0x5110aa.map((_0x533356) => String(_0x533356 || '')));
      _0x4a3d36.className = String(_0x4a3d36.className || '')
        .split(/\s+/)
        .filter((_0x19d282) => _0x19d282 && !_0x108fe1.has(_0x19d282))
        .join(' ');
    },
  };
}
function createFakeElement(_0x1e0242 = 'div') {
  const _0x1945d6 = {
    tagName: String(_0x1e0242 || 'div').toUpperCase(),
    className: '',
    dataset: {},
    attributes: {},
    childNodes: [],
    parentElement: null,
    style: {},
    _innerHTML: '',
    _innerHTMLSetCount: 0,
    classList: null,
    set innerHTML(_0xf6c96e) {
      ((_0x1945d6._innerHTMLSetCount += 1),
        (_0x1945d6._innerHTML = String(_0xf6c96e || '')),
        (_0x1945d6.childNodes = []));
      if (_0x1945d6._innerHTML.includes('rh-v5-ref-container')) {
        const _0x4aa167 = createFakeElement('div');
        ((_0x4aa167.className = 'prompt-attachment-btn'), _0x1945d6.appendChild(_0x4aa167));
        const _0x430934 = createFakeElement('div');
        _0x430934.className = 'ref-thumb-container rh-v5-ref-container';
        const _0x32a669 = Array.from(_0x1945d6._innerHTML.matchAll(/data-slot="([^"]+)"/g)).map(
          (_0x355522) => _0x355522[1],
        );
        (_0x32a669.forEach((_0x2af26e) => {
          const _0x3e7141 = createFakeElement('button');
          ((_0x3e7141.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
            (_0x3e7141.dataset.slot = _0x2af26e),
            _0x430934.appendChild(_0x3e7141));
        }),
          _0x1945d6.appendChild(_0x430934));
      } else {
        if (_0x1945d6._innerHTML.includes('ref-thumb-container')) {
          const _0x824c62 = createFakeElement('div');
          ((_0x824c62.className = 'prompt-attachment-btn'), _0x1945d6.appendChild(_0x824c62));
          const _0x566847 = createFakeElement('div');
          ((_0x566847.className = 'ref-thumb-container'), _0x1945d6.appendChild(_0x566847));
        }
      }
    },
    get innerHTML() {
      return _0x1945d6._innerHTML;
    },
    appendChild(_0xe34c58) {
      if (_0xe34c58.parentElement) {
        const _0xad3b56 = _0xe34c58.parentElement.childNodes.indexOf(_0xe34c58);
        if (_0xad3b56 >= 0) _0xe34c58.parentElement.childNodes.splice(_0xad3b56, 1);
      }
      return ((_0xe34c58.parentElement = _0x1945d6), _0x1945d6.childNodes.push(_0xe34c58), _0xe34c58);
    },
    insertBefore(_0x2f8e27, _0x5ca625) {
      if (!_0x5ca625) return _0x1945d6.appendChild(_0x2f8e27);
      if (_0x2f8e27.parentElement) {
        const _0x48c791 = _0x2f8e27.parentElement.childNodes.indexOf(_0x2f8e27);
        if (_0x48c791 >= 0) _0x2f8e27.parentElement.childNodes.splice(_0x48c791, 1);
      }
      const _0x5a9a5e = _0x1945d6.childNodes.indexOf(_0x5ca625);
      _0x2f8e27.parentElement = _0x1945d6;
      if (_0x5a9a5e < 0) _0x1945d6.childNodes.push(_0x2f8e27);
      else _0x1945d6.childNodes.splice(_0x5a9a5e, 0, _0x2f8e27);
      return _0x2f8e27;
    },
    remove() {
      const _0x224e6c = _0x1945d6.parentElement;
      if (!_0x224e6c) return;
      const _0x1428b1 = _0x224e6c.childNodes.indexOf(_0x1945d6);
      if (_0x1428b1 >= 0) _0x224e6c.childNodes.splice(_0x1428b1, 1);
      _0x1945d6.parentElement = null;
    },
    replaceWith(_0x495a13) {
      const _0xcf1270 = _0x1945d6.parentElement;
      if (!_0xcf1270) return;
      const _0x8bb158 = _0xcf1270.childNodes.indexOf(_0x1945d6);
      if (_0x8bb158 < 0) return;
      ((_0x495a13.parentElement = _0xcf1270), (_0xcf1270.childNodes[_0x8bb158] = _0x495a13));
    },
    setAttribute(_0x77b151, _0xc1af0a) {
      _0x1945d6.attributes[_0x77b151] = String(_0xc1af0a || '');
    },
    addEventListener() {},
    querySelector(_0x1e0b4) {
      return _0x1945d6.querySelectorAll(_0x1e0b4)[0] || null;
    },
    querySelectorAll(_0x564c5e) {
      const _0x30c870 = [],
        _0x8c8272 = (_0x40afa6) => {
          if (_0x564c5e.startsWith('.')) return _0x40afa6.classList?.contains(_0x564c5e.slice(1));
          const _0x544c8a = _0x564c5e.match(/^\[data-slot(?:="([^"]+)")?\]$/);
          if (_0x544c8a) {
            if (!('slot' in _0x40afa6.dataset)) return false;
            return _0x544c8a[1] ? _0x40afa6.dataset.slot === _0x544c8a[1] : true;
          }
          return false;
        },
        _0x560c6a = (_0x34480c) => {
          _0x34480c.childNodes.forEach((_0x46e6b2) => {
            if (_0x8c8272(_0x46e6b2)) _0x30c870.push(_0x46e6b2);
            _0x560c6a(_0x46e6b2);
          });
        };
      return (_0x560c6a(_0x1945d6), _0x30c870);
    },
  };
  return ((_0x1945d6.classList = makeClassList(_0x1945d6)), _0x1945d6);
}
(test('video reference input: HappyHorse mode change refreshes visible fixed slots', async () => {
  const _0x5ed0c6 = globalThis.document;
  globalThis.document = { createElement: createFakeElement };
  try {
    const _0x18460a = 'node-happyhorse',
      _0x2ee908 = {
        nodes: {
          [_0x18460a]: {
            id: _0x18460a,
            type: 'ai-video',
            model: 'apimart/happyhorse-1.0',
            provider: 'apimart',
            generationParams: { happyhorse_mode: 'image' },
          },
        },
      },
      _0x17c8fa = createVideoNodeReferenceInputModule({
        store: { getState: () => _0x2ee908, getIncomingEdges: () => [] },
        api: {},
        _syncPillLabels: () => {},
        getImage: async () => null,
        ensureThumbDecoded: () => {},
        revealRefThumbMedia: () => {},
      }),
      _0x20023b = Object.assign(Object.create(_0x17c8fa), {
        nodeId: _0x18460a,
        _data: _0x2ee908.nodes[_0x18460a],
        refBarEl: createFakeElement('div'),
        promptEl: makePromptEl(),
        _fixedSlotRefThumbObjectUrls: new Map(),
        _videoThumbPending: new Set(),
        _isRunninghubWorkflowModel: () => false,
        _resolveMediaUrl: (_0xdf46d1) => String(_0xdf46d1 || ''),
        _syncBtnIconState: () => {},
      });
    await _0x17c8fa._renderRefBarImpl.call(_0x20023b);
    let _0x4474c5 = _0x20023b.refBarEl.querySelector('.rh-v5-ref-container');
    (assert.ok(_0x4474c5.querySelector('[data-slot="firstFrame"]')),
      assert.equal(_0x4474c5.querySelector('[data-slot="lastFrame"]'), null),
      assert.equal(_0x4474c5.querySelector('[data-slot="referenceImage"]'), null),
      (_0x2ee908.nodes[_0x18460a] = {
        ..._0x2ee908.nodes[_0x18460a],
        generationParams: { happyhorse_mode: 'reference' },
      }),
      await _0x17c8fa._renderRefBarImpl.call(_0x20023b),
      (_0x4474c5 = _0x20023b.refBarEl.querySelector('.rh-v5-ref-container')),
      assert.equal(_0x4474c5.querySelector('[data-slot="firstFrame"]'), null),
      assert.ok(_0x4474c5.querySelector('[data-slot="referenceImage"]')));
  } finally {
    if (typeof _0x5ed0c6 === 'undefined') delete globalThis.document;
    else globalThis.document = _0x5ed0c6;
  }
}),
  test('video reference input: Hailuo 2.3 refreshes stale last-frame refbar slot', async () => {
    const _0x1a30ff = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x19d2b6 = 'node-hailuo-23',
        _0x26a393 = {
          nodes: {
            [_0x19d2b6]: {
              id: _0x19d2b6,
              type: 'ai-video',
              model: 'apimart/minimax-hailuo-2.3',
              provider: 'apimart',
              generationParams: { mode: 'fast' },
            },
          },
        },
        _0x57eeae = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x26a393, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x3cac73 = Object.assign(Object.create(_0x57eeae), {
          nodeId: _0x19d2b6,
          _data: _0x26a393.nodes[_0x19d2b6],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _refBarLayoutKey: 'fixed',
          _resolveMediaUrl: (_0xf586b) => String(_0xf586b || ''),
          _syncBtnIconState: () => {},
        });
      _0x3cac73.refBarEl.innerHTML = [
        '<div class="prompt-attachment-btn"></div>',
        '<div class="ref-thumb-container rh-v5-ref-container">',
        '<button data-slot="firstFrame"></button>',
        '<button data-slot="lastFrame"></button>',
        '</div>',
      ].join('');
      const _0x5c7f20 = _0x3cac73.refBarEl._innerHTMLSetCount;
      await _0x57eeae._renderRefBarImpl.call(_0x3cac73);
      const _0x40f17f = _0x3cac73.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.equal(_0x3cac73.refBarEl._innerHTMLSetCount, _0x5c7f20),
        assert.deepEqual(
          Array.from(_0x40f17f.querySelectorAll('[data-slot]')).map((_0x226ad3) => _0x226ad3.dataset.slot),
          ['firstFrame'],
        ),
        assert.ok(_0x40f17f.querySelector('[data-slot="firstFrame"]')),
        assert.equal(_0x40f17f.querySelector('[data-slot="lastFrame"]'), null));
    } finally {
      if (typeof _0x1a30ff === 'undefined') delete globalThis.document;
      else globalThis.document = _0x1a30ff;
    }
  }),
  test('video reference input: Wan2.7 mode change refreshes fixed slots', async () => {
    const _0x5bd992 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x2a8264 = 'node-wan27',
        _0x3e0c17 = {
          nodes: {
            [_0x2a8264]: {
              id: _0x2a8264,
              type: 'ai-video',
              model: 'apimart/wan2.7',
              provider: 'apimart',
              generationParams: { wan27_mode: 'image' },
            },
          },
        },
        _0x3ef83b = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x3e0c17, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x350b78 = Object.assign(Object.create(_0x3ef83b), {
          nodeId: _0x2a8264,
          _data: _0x3e0c17.nodes[_0x2a8264],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (_0x53973f) => String(_0x53973f || ''),
          _syncBtnIconState: () => {},
        });
      await _0x3ef83b._renderRefBarImpl.call(_0x350b78);
      let _0x1f8553 = _0x350b78.refBarEl.querySelector('.rh-v5-ref-container');
      const _0x3367af = _0x350b78.refBarEl._innerHTMLSetCount;
      (assert.deepEqual(
        Array.from(_0x1f8553.querySelectorAll('[data-slot]')).map((_0x33479f) => _0x33479f.dataset.slot),
        ['firstFrame', 'lastFrame', 'audio'],
      ),
        assert.ok(_0x1f8553.querySelector('[data-slot="firstFrame"]')),
        assert.ok(_0x1f8553.querySelector('[data-slot="lastFrame"]')),
        assert.ok(_0x1f8553.querySelector('[data-slot="audio"]')),
        assert.equal(_0x1f8553.querySelector('[data-slot="sourceVideo"]'), null),
        (_0x3e0c17.nodes[_0x2a8264] = {
          ..._0x3e0c17.nodes[_0x2a8264],
          generationParams: { wan27_mode: 'video' },
        }),
        await _0x3ef83b._renderRefBarImpl.call(_0x350b78),
        (_0x1f8553 = _0x350b78.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(_0x350b78.refBarEl._innerHTMLSetCount, _0x3367af),
        assert.deepEqual(
          Array.from(_0x1f8553.querySelectorAll('[data-slot]')).map((_0x481490) => _0x481490.dataset.slot),
          ['sourceVideo'],
        ),
        assert.equal(_0x1f8553.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(_0x1f8553.querySelector('[data-slot="audio"]'), null),
        assert.ok(_0x1f8553.querySelector('[data-slot="sourceVideo"]')),
        (_0x350b78.refBarEl.innerHTML = [
          '<div class="prompt-attachment-btn"></div>',
          '<div class="ref-thumb-container rh-v5-ref-container">',
          '<button data-slot="lastFrame"></button>',
          '<button data-slot="sourceVideo"></button>',
          '<button data-slot="referenceImage"></button>',
          '<button data-slot="originalVideo"></button>',
          '<button data-slot="referenceVideo"></button>',
          '<button data-slot="audio"></button>',
          '<button data-slot="referenceAudio"></button>',
          '</div>',
        ].join('')));
      const _0x1a52b7 = _0x350b78.refBarEl._innerHTMLSetCount;
      (await _0x3ef83b._renderRefBarImpl.call(_0x350b78),
        (_0x1f8553 = _0x350b78.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(_0x350b78.refBarEl._innerHTMLSetCount, _0x1a52b7),
        assert.deepEqual(
          Array.from(_0x1f8553.querySelectorAll('[data-slot]')).map((_0x2c882b) => _0x2c882b.dataset.slot),
          ['sourceVideo'],
        ),
        assert.equal(_0x1f8553.querySelector('[data-slot="lastFrame"]'), null),
        assert.equal(_0x1f8553.querySelector('[data-slot="referenceImage"]'), null),
        assert.equal(_0x1f8553.querySelector('[data-slot="originalVideo"]'), null),
        assert.equal(_0x1f8553.querySelector('[data-slot="referenceVideo"]'), null),
        assert.equal(_0x1f8553.querySelector('[data-slot="audio"]'), null),
        assert.equal(_0x1f8553.querySelector('[data-slot="referenceAudio"]'), null));
      const _0x724a44 = _0x350b78.refBarEl._innerHTMLSetCount;
      ((_0x3e0c17.nodes[_0x2a8264] = {
        ..._0x3e0c17.nodes[_0x2a8264],
        generationParams: { wan27_mode: 'reference' },
      }),
        (_0x350b78._data = _0x3e0c17.nodes[_0x2a8264]));
      const _0x926038 = getFixedInputSlotConfigFromManifest(_0x3e0c17.nodes[_0x2a8264]);
      (assert.deepEqual(_0x926038?.visibleSlots, ['referenceImage', 'referenceVideo', 'referenceAudio']),
        assert.ok(_0x926038?.fixedSlots?.some((_0x770645) => _0x770645.id === 'firstFrame')),
        assert.ok(_0x926038?.slotById?.firstFrame),
        await _0x3ef83b._renderRefBarImpl.call(_0x350b78),
        (_0x1f8553 = _0x350b78.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(_0x350b78.refBarEl._innerHTMLSetCount, _0x724a44),
        assert.deepEqual(
          Array.from(_0x1f8553.querySelectorAll('[data-slot]')).map((_0x1b9df3) => _0x1b9df3.dataset.slot),
          ['referenceImage', 'referenceVideo', 'referenceAudio'],
        ),
        assert.equal(_0x1f8553.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(_0x1f8553.querySelector('[data-slot="lastFrame"]'), null),
        assert.ok(_0x1f8553.querySelector('[data-slot="referenceAudio"]')),
        assert.equal(_0x1f8553.querySelector('[data-slot="sourceVideo"]'), null),
        assert.ok(_0x1f8553.querySelector('[data-slot="referenceVideo"]')),
        assert.equal(_0x1f8553.querySelector('[data-slot="originalVideo"]'), null),
        assert.ok(_0x1f8553.querySelector('[data-slot="referenceImage"]')));
      const _0x53fad3 = _0x350b78.refBarEl._innerHTMLSetCount;
      ((_0x3e0c17.nodes[_0x2a8264] = {
        ..._0x3e0c17.nodes[_0x2a8264],
        generationParams: { wan27_mode: 'edit' },
      }),
        (_0x350b78._data = _0x3e0c17.nodes[_0x2a8264]),
        await _0x3ef83b._renderRefBarImpl.call(_0x350b78),
        (_0x1f8553 = _0x350b78.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(_0x350b78.refBarEl._innerHTMLSetCount, _0x53fad3),
        assert.deepEqual(
          Array.from(_0x1f8553.querySelectorAll('[data-slot]')).map((_0x3d9f23) => _0x3d9f23.dataset.slot),
          ['originalVideo', 'referenceVideo'],
        ),
        assert.equal(_0x1f8553.querySelector('[data-slot="referenceImage"]'), null),
        assert.ok(_0x1f8553.querySelector('[data-slot="originalVideo"]')),
        assert.ok(_0x1f8553.querySelector('[data-slot="referenceVideo"]')),
        (_0x3e0c17.nodes[_0x2a8264] = {
          ..._0x3e0c17.nodes[_0x2a8264],
          model: 'wan2.7',
          generationParams: { wan27_mode: 'image' },
        }),
        (_0x350b78._data = _0x3e0c17.nodes[_0x2a8264]),
        await _0x3ef83b._renderRefBarImpl.call(_0x350b78),
        (_0x1f8553 = _0x350b78.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.ok(_0x1f8553.querySelector('[data-slot="firstFrame"]')),
        assert.ok(_0x1f8553.querySelector('[data-slot="lastFrame"]')),
        assert.ok(_0x1f8553.querySelector('[data-slot="audio"]')),
        assert.equal(_0x1f8553.querySelector('[data-slot="sourceVideo"]'), null),
        (_0x3e0c17.nodes[_0x2a8264] = {
          ..._0x3e0c17.nodes[_0x2a8264],
          model: 'apimart/wan2.7',
          provider: 'apimartr',
          generationParams: { wan27_mode: 'video' },
        }),
        (_0x350b78._data = _0x3e0c17.nodes[_0x2a8264]),
        await _0x3ef83b._renderRefBarImpl.call(_0x350b78),
        (_0x1f8553 = _0x350b78.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(_0x1f8553.querySelector('[data-slot="firstFrame"]'), null),
        assert.ok(_0x1f8553.querySelector('[data-slot="sourceVideo"]')));
    } finally {
      if (typeof _0x5bd992 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x5bd992;
    }
  }),
  test('video reference input: Kling V3 Omni mode change refreshes fixed slots', async () => {
    const _0x34078d = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x30c2ea = 'node-kling-v3-omni',
        _0x4786c3 = {
          nodes: {
            [_0x30c2ea]: {
              id: _0x30c2ea,
              type: 'ai-video',
              model: 'apimart/kling-v3-omni',
              provider: 'apimart',
              generationParams: { kling_v3_omni_mode: 'image' },
            },
          },
        },
        _0x55e5ee = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x4786c3, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x26b171 = Object.assign(Object.create(_0x55e5ee), {
          nodeId: _0x30c2ea,
          _data: _0x4786c3.nodes[_0x30c2ea],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (_0x47750a) => String(_0x47750a || ''),
          _syncBtnIconState: () => {},
        });
      await _0x55e5ee._renderRefBarImpl.call(_0x26b171);
      let _0x73de69 = _0x26b171.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.deepEqual(
        Array.from(_0x73de69.querySelectorAll('[data-slot]')).map((_0x5dbaca) => _0x5dbaca.dataset.slot),
        ['firstFrame', 'lastFrame'],
      ),
        assert.ok(_0x73de69.querySelector('[data-slot="firstFrame"]')),
        assert.ok(_0x73de69.querySelector('[data-slot="lastFrame"]')));
      const _0x4ac33f = _0x26b171.refBarEl._innerHTMLSetCount;
      ((_0x4786c3.nodes[_0x30c2ea] = {
        ..._0x4786c3.nodes[_0x30c2ea],
        generationParams: { kling_v3_omni_mode: 'reference' },
      }),
        (_0x26b171._data = _0x4786c3.nodes[_0x30c2ea]),
        await _0x55e5ee._renderRefBarImpl.call(_0x26b171),
        (_0x73de69 = _0x26b171.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(_0x26b171.refBarEl._innerHTMLSetCount, _0x4ac33f),
        assert.deepEqual(
          Array.from(_0x73de69.querySelectorAll('[data-slot]')).map((_0x5ef923) => _0x5ef923.dataset.slot),
          ['referenceImage', 'referenceVideo'],
        ),
        assert.equal(_0x73de69.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(_0x73de69.querySelector('[data-slot="lastFrame"]'), null),
        assert.ok(_0x73de69.querySelector('[data-slot="referenceImage"]')),
        assert.ok(_0x73de69.querySelector('[data-slot="referenceVideo"]')));
      const _0x5c1b6d = _0x26b171.refBarEl._innerHTMLSetCount;
      ((_0x4786c3.nodes[_0x30c2ea] = {
        ..._0x4786c3.nodes[_0x30c2ea],
        generationParams: { kling_v3_omni_mode: 'edit' },
      }),
        (_0x26b171._data = _0x4786c3.nodes[_0x30c2ea]),
        await _0x55e5ee._renderRefBarImpl.call(_0x26b171),
        (_0x73de69 = _0x26b171.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(_0x26b171.refBarEl._innerHTMLSetCount, _0x5c1b6d),
        assert.deepEqual(
          Array.from(_0x73de69.querySelectorAll('[data-slot]')).map((_0x278feb) => _0x278feb.dataset.slot),
          ['editVideo'],
        ),
        assert.equal(_0x73de69.querySelector('[data-slot="referenceImage"]'), null),
        assert.equal(_0x73de69.querySelector('[data-slot="referenceVideo"]'), null),
        assert.ok(_0x73de69.querySelector('[data-slot="editVideo"]')));
    } finally {
      if (typeof _0x34078d === 'undefined') delete globalThis.document;
      else globalThis.document = _0x34078d;
    }
  }),
  test('video reference input: Kling O1 renders fixed reference slots', async () => {
    const _0x38599f = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x1a3f54 = 'node-kling-o1',
        _0x847418 = {
          nodes: {
            [_0x1a3f54]: {
              id: _0x1a3f54,
              type: 'ai-video',
              model: 'apimart/kling-video-o1',
              provider: 'apimart',
            },
          },
        },
        _0x116bf3 = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x847418, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x4e05c9 = Object.assign(Object.create(_0x116bf3), {
          nodeId: _0x1a3f54,
          _data: _0x847418.nodes[_0x1a3f54],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (_0x33057f) => String(_0x33057f || ''),
          _syncBtnIconState: () => {},
        });
      await _0x116bf3._renderRefBarImpl.call(_0x4e05c9);
      const _0x535c92 = _0x4e05c9.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.deepEqual(
        Array.from(_0x535c92.querySelectorAll('[data-slot]')).map((_0x37a223) => _0x37a223.dataset.slot),
        ['editVideo', 'featureReferenceVideo', 'referenceImage'],
      ),
        assert.ok(_0x535c92.querySelector('[data-slot="editVideo"]')),
        assert.ok(_0x535c92.querySelector('[data-slot="featureReferenceVideo"]')),
        assert.ok(_0x535c92.querySelector('[data-slot="referenceImage"]')));
    } finally {
      if (typeof _0x38599f === 'undefined') delete globalThis.document;
      else globalThis.document = _0x38599f;
    }
  }),
  test('video reference input: RunningHub Kling O1 reference mode puts video slot first', async () => {
    const _0x9a48f7 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x12cc09 = 'node-runninghub-kling-o1',
        _0x504da4 = {
          nodes: {
            [_0x12cc09]: {
              id: _0x12cc09,
              type: 'ai-video',
              model: 'runninghub-model/kling-video-o1',
              provider: 'runninghub',
              generationParams: { rh_kling_o1_generation_mode: 'reference' },
            },
          },
        },
        _0x4e5c4b = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x504da4, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x588845 = Object.assign(Object.create(_0x4e5c4b), {
          nodeId: _0x12cc09,
          _data: _0x504da4.nodes[_0x12cc09],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (_0x5ed8a0) => String(_0x5ed8a0 || ''),
          _syncBtnIconState: () => {},
        });
      await _0x4e5c4b._renderRefBarImpl.call(_0x588845);
      const _0x3dc338 = _0x588845.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.deepEqual(
        Array.from(_0x3dc338.querySelectorAll('[data-slot]')).map((_0x3163ac) => _0x3163ac.dataset.slot),
        ['referenceVideo', 'referenceImage'],
      ),
        assert.ok(_0x3dc338.querySelector('[data-slot="referenceVideo"]')),
        assert.ok(_0x3dc338.querySelector('[data-slot="referenceImage"]')));
    } finally {
      if (typeof _0x9a48f7 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x9a48f7;
    }
  }),
  test('video reference input: RunningHub Kling O3 reference mode puts video slot first', async () => {
    const _0x130f96 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0xd389f9 = 'node-runninghub-kling-o3',
        _0x113888 = {
          nodes: {
            [_0xd389f9]: {
              id: _0xd389f9,
              type: 'ai-video',
              model: 'runninghub-model/kling-o3',
              provider: 'runninghub',
              generationParams: { kling_v3_omni_mode: 'reference' },
            },
          },
        },
        _0x8db728 = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x113888, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x1839d7 = Object.assign(Object.create(_0x8db728), {
          nodeId: _0xd389f9,
          _data: _0x113888.nodes[_0xd389f9],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (_0x362808) => String(_0x362808 || ''),
          _syncBtnIconState: () => {},
        });
      await _0x8db728._renderRefBarImpl.call(_0x1839d7);
      const _0x524630 = _0x1839d7.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.deepEqual(
        Array.from(_0x524630.querySelectorAll('[data-slot]')).map((_0x35817c) => _0x35817c.dataset.slot),
        ['referenceVideo', 'referenceImage'],
      ),
        assert.ok(_0x524630.querySelector('[data-slot="referenceVideo"]')),
        assert.ok(_0x524630.querySelector('[data-slot="referenceImage"]')));
    } finally {
      if (typeof _0x130f96 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x130f96;
    }
  }),
  test('video reference input: RunningHub Seedance 2.0 switches route slots', () => {
    const _0x313e3d = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/seedance-2.0',
      provider: 'runninghub',
      generationParams: { rh_seedance_2_mode: 'text2video' },
    });
    assert.deepEqual(_0x313e3d?.visibleSlots || [], []);
    const _0x53f206 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/seedance-2.0',
      provider: 'runninghub',
      generationParams: { rh_seedance_2_mode: 'image2video' },
    });
    assert.deepEqual(_0x53f206?.visibleSlots, ['firstFrame']);
    const _0x40999f = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/seedance-2.0',
      provider: 'runninghub',
      generationParams: { rh_seedance_2_mode: 'frames2video' },
    });
    assert.deepEqual(_0x40999f?.visibleSlots, ['firstFrame', 'lastFrame']);
    const _0x943508 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/seedance-2.0',
      provider: 'runninghub',
      generationParams: { rh_seedance_2_mode: 'multimodal2video' },
    });
    (assert.deepEqual(_0x943508?.visibleSlots, ['referenceVideo', 'referenceImage', 'referenceAudio']),
      assert.equal(_0x943508?.slotById?.referenceVideo?.kind, 'video'),
      assert.equal(_0x943508?.slotById?.referenceImage?.kind, 'image'),
      assert.equal(_0x943508?.slotById?.referenceAudio?.kind, 'audio'));
  }),
  test('video reference input: Volcengine Seedance 2.0 reuses Dreamina generic refbar', () => {
    const _0x40d397 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'volcengine/seedance-2.0-fast',
      provider: 'volcengine',
      generationParams: { dreaminaRouteMode: 'multimodal2video' },
    });
    assert.equal(_0x40d397, null);
    const _0x4397d2 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'volcengine/seedance-2.0-fast',
      provider: 'volcengine',
      generationParams: { dreaminaRouteMode: 'frames2video' },
    });
    assert.equal(_0x4397d2, null);
  }),
  test('video reference input: Agnes Video uses fixed slots only in first-last-frame mode', () => {
    const _0x21fecb = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'agnes/agnes-video-v2.0',
      provider: 'agnes',
    });
    assert.equal(_0x21fecb, null);
    const _0x2901fa = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'agnes/agnes-video-v2.0',
      provider: 'agnes',
      generationParams: { agnes_video_mode: 'reference' },
    });
    assert.equal(_0x2901fa, null);
    const _0x1b2ada = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'agnes/agnes-video-v2.0',
      provider: 'agnes',
      generationParams: { agnes_video_mode: 'keyframes' },
    });
    (assert.deepEqual(_0x1b2ada?.visibleSlots, ['firstFrame', 'lastFrame']),
      assert.equal(_0x1b2ada?.slotById?.firstFrame?.required, true),
      assert.equal(_0x1b2ada?.slotById?.lastFrame?.required, false));
  }),
  test('video submit button: Agnes keyframes mode enables with first frame only', () => {
    const _0x56de6a = 'node-agnes-keyframes-first-only-submit',
      _0xa50fac = 'node-agnes-first-frame',
      _0x1fdb5b = 'node-agnes-last-frame',
      _0x23787f = {
        nodes: {
          [_0x56de6a]: {
            id: _0x56de6a,
            type: 'ai-video',
            model: 'agnes/agnes-video-v2.0',
            provider: 'agnes',
            generationParams: { agnes_video_mode: 'keyframes' },
          },
          [_0xa50fac]: {
            id: _0xa50fac,
            type: 'source-image',
            originalLocalPath: 'data/assets/agnes-first.png',
          },
          [_0x1fdb5b]: {
            id: _0x1fdb5b,
            type: 'source-image',
            originalLocalPath: 'data/assets/agnes-last.png',
          },
        },
      },
      _0x2722b2 = (_0x3d47e9) =>
        createVideoNodeParameterPanelModule({
          store: { getState: () => _0x23787f, getIncomingEdges: () => _0x3d47e9 },
          api: {},
          getDisplayModelName: () => '',
          PROVIDERS_META: {},
          getAIGenerationNodeSize: () => ({ width: 0x12c, height: 0x12c }),
          getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
          activateMenuKeyboard: () => {},
          isVideoVipModel: () => false,
        }),
      _0x3b6d60 = (_0x30ed8b) =>
        Object.assign(Object.create(_0x30ed8b), {
          nodeId: _0x56de6a,
          _data: _0x23787f.nodes[_0x56de6a],
          promptEl: makePromptEl([]),
          btnEl: { disabled: true, style: {} },
          _isGenerating: false,
          _isDreaminaVideoNode: () => false,
          _isRunninghubWorkflowModel: () => false,
        }),
      _0x513795 = [
        { id: 'edge-agnes-first-only', sourceId: _0xa50fac, targetId: _0x56de6a, refSlot: 'firstFrame' },
      ],
      _0x49a3a0 = _0x2722b2(_0x513795),
      _0x459bc6 = _0x3b6d60(_0x49a3a0);
    (_0x49a3a0._updateSubmitButtonState.call(_0x459bc6),
      assert.equal(_0x459bc6.btnEl.disabled, false),
      assert.equal(_0x459bc6.btnEl.style.cursor, ''));
    const _0x35291c = [
        { id: 'edge-agnes-last-only', sourceId: _0x1fdb5b, targetId: _0x56de6a, refSlot: 'lastFrame' },
      ],
      _0x3a766d = _0x2722b2(_0x35291c),
      _0x2c7cb6 = _0x3b6d60(_0x3a766d);
    (_0x3a766d._updateSubmitButtonState.call(_0x2c7cb6),
      assert.equal(_0x2c7cb6.btnEl.disabled, true),
      assert.equal(_0x2c7cb6.btnEl.style.cursor, 'var(--unavailable-cursor)'));
  }),
  test('video reference input: APIMart fixed slots ignore stale RunningHub visibility flags', () => {
    const _0x2f3ce9 = [{ rhSpecialMode: 'cameraMove' }, { rhSubtractSubject: true }];
    for (const _0x9339fa of _0x2f3ce9) {
      const _0x109097 = getFixedInputSlotConfigFromManifest({
        type: 'ai-video',
        model: 'apimart/veo3-fast',
        provider: 'apimart',
        generationParams: { mode: 'fast', generation_type: 'frame' },
        ..._0x9339fa,
      });
      assert.deepEqual(_0x109097?.visibleSlots, ['firstFrame', 'lastFrame']);
      const _0x3b1279 = getFixedInputSlotConfigFromManifest({
        type: 'ai-video',
        model: 'apimart/minimax-hailuo',
        provider: 'apimart',
        generationParams: {},
        ..._0x9339fa,
      });
      assert.deepEqual(_0x3b1279?.visibleSlots, ['firstFrame', 'lastFrame']);
      const _0x369604 = getFixedInputSlotConfigFromManifest({
        type: 'ai-video',
        model: 'apimart/minimax-hailuo-2.3',
        provider: 'apimart',
        generationParams: { mode: 'fast' },
        ..._0x9339fa,
      });
      assert.deepEqual(_0x369604?.visibleSlots, ['firstFrame']);
    }
  }),
  test('video reference input: RunningHub Hailuo 02 hides tail frame outside standard mode', () => {
    const _0x4322b7 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/hailuo-02',
      provider: 'runninghub',
      generationParams: { rh_hailuo_02_quality: 'standard' },
    });
    assert.deepEqual(_0x4322b7?.visibleSlots, ['firstFrame', 'lastFrame']);
    const _0x53689b = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/hailuo-02',
      provider: 'runninghub',
      generationParams: { rh_hailuo_02_quality: 'pro' },
    });
    assert.deepEqual(_0x53689b?.visibleSlots, ['firstFrame']);
    const _0x4b0584 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/hailuo-02',
      provider: 'runninghub',
      generationParams: { rh_hailuo_02_quality: 'fast' },
    });
    assert.deepEqual(_0x4b0584?.visibleSlots, ['firstFrame']);
  }),
  test('video reference input: RunningHub Hailuo 2.3 only exposes first-frame slot', () => {
    for (const _0x1a5b48 of ['standard', 'pro', 'fast', 'fastPro']) {
      const _0x5bcbde = getFixedInputSlotConfigFromManifest({
        type: 'ai-video',
        model: 'runninghub-model/hailuo-2.3',
        provider: 'runninghub',
        generationParams: { rh_hailuo_23_quality: _0x1a5b48 },
      });
      assert.deepEqual(_0x5bcbde?.visibleSlots, ['firstFrame']);
    }
  }),
  test('video reference input: VEO3 reference mode does not use fixed slots', () => {
    const _0x53d774 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'apimart/veo3-fast',
      provider: 'apimart',
      generationParams: { mode: 'fast', generation_type: 'frame' },
    });
    assert.deepEqual(_0x53d774?.visibleSlots, ['firstFrame', 'lastFrame']);
    const _0x1024a0 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'apimart/veo3-fast',
      provider: 'apimart',
      generationParams: { mode: 'fast', generation_type: 'reference' },
    });
    assert.equal(_0x1024a0, null);
  }),
  test('video reference input: Vidu Q3 hides fixed slots in reference mode', () => {
    const _0x50a710 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'apimart/viduq3',
      provider: 'apimart',
      generationParams: { vidu_q3_generation_mode: 'video', mode: 'viduq3-turbo' },
    });
    assert.deepEqual(_0x50a710?.visibleSlots, ['firstFrame', 'lastFrame']);
    const _0x5f479d = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'apimart/viduq3',
      provider: 'apimart',
      generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3' },
    });
    assert.equal(_0x5f479d, null);
  }),
  test('video reference input: manifest fixed-slot overflow media shows in refbar', async () => {
    const _0x2c5c0a = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x881358 = 'node-happyhorse-reference',
        _0x5db560 = {
          nodes: {
            [_0x881358]: {
              id: _0x881358,
              type: 'ai-video',
              model: 'apimart/happyhorse-1.0',
              provider: 'apimart',
              generationParams: { happyhorse_mode: 'reference' },
            },
            img1: { id: 'img1', type: 'source-image', localPath: 'data/assets/hh-ref-1.png' },
            img2: { id: 'img2', type: 'source-image', localPath: 'data/assets/hh-ref-2.png' },
          },
        },
        _0x132de8 = [
          { id: 'edge-img1', sourceId: 'img1', targetId: _0x881358, refSlot: 'referenceImage' },
          { id: 'edge-img2', sourceId: 'img2', targetId: _0x881358 },
        ],
        _0xefe2b9 = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x5db560, getIncomingEdges: () => _0x132de8 },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x2b5340 = Object.assign(Object.create(_0xefe2b9), {
          nodeId: _0x881358,
          _data: _0x5db560.nodes[_0x881358],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (_0x50f7c6) => String(_0x50f7c6 || ''),
          _syncBtnIconState: () => {},
        });
      await _0xefe2b9._renderRefBarImpl.call(_0x2b5340);
      const _0x547240 = _0x2b5340.refBarEl.querySelector('.rh-v5-ref-container'),
        _0x4fbb03 = _0x547240.querySelector('[data-slot="referenceImage"]'),
        _0x17ba94 = _0x547240.querySelectorAll('.rh-fixed-extra-ref');
      (assert.equal(_0x4fbb03.dataset.sourceId, 'img1'),
        assert.ok(
          _0x17ba94.some((_0xd8e277) => _0xd8e277.dataset.sourceId === 'img2'),
          'second reference image should render as an extra thumbnail',
        ));
    } finally {
      if (typeof _0x2c5c0a === 'undefined') delete globalThis.document;
      else globalThis.document = _0x2c5c0a;
    }
  }),
  test('video reference input: stale refSlot from previous model fills current modelApi slot', async () => {
    const _0x2a3f95 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x292951 = 'node-veo3-stale-refslot',
        _0x1eba3f = {
          nodes: {
            [_0x292951]: {
              id: _0x292951,
              type: 'ai-video',
              model: 'apimart/veo3-fast',
              provider: 'apimart',
              generationParams: { mode: 'fast', generation_type: 'frame' },
            },
            img1: { id: 'img1', type: 'source-image', localPath: 'data/assets/old-ref.png' },
          },
        },
        _0x16088d = [{ id: 'edge-stale-ref', sourceId: 'img1', targetId: _0x292951, refSlot: 'refImage' }],
        _0x1ca135 = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x1eba3f, getIncomingEdges: () => _0x16088d },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x248ff9 = Object.assign(Object.create(_0x1ca135), {
          nodeId: _0x292951,
          _data: _0x1eba3f.nodes[_0x292951],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (_0x3df57c) => String(_0x3df57c || ''),
          _syncBtnIconState: () => {},
        });
      await _0x1ca135._renderRefBarImpl.call(_0x248ff9);
      const _0x2c8f03 = _0x248ff9.refBarEl.querySelector('.rh-v5-ref-container'),
        _0x2f162e = _0x2c8f03.querySelector('[data-slot="firstFrame"]'),
        _0x399240 = _0x2c8f03.querySelector('[data-slot="lastFrame"]');
      (assert.equal(_0x2f162e.dataset.edgeId, 'edge-stale-ref'),
        assert.equal(_0x2f162e.dataset.sourceId, 'img1'),
        assert.equal(_0x399240.dataset.refOrigin, ''));
    } finally {
      if (typeof _0x2a3f95 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x2a3f95;
    }
  }),
  test('video reference input: V5.4 asset mentions render as virtual fixed-slot thumbnails', async () => {
    const _0x428800 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x2caf40 = 'node-v54-assets',
        _0x2ac4f9 = {
          nodes: {
            [_0x2caf40]: {
              id: _0x2caf40,
              type: 'ai-video',
              model: 'runninghub/2041741496667348994',
              provider: 'runninghubwf',
              rhSubtractSubject: false,
            },
          },
        };
      setAssetMentionAssets([
        {
          id: 'asset-v54',
          items: [
            {
              name: 'source clip',
              type: 'source-video',
              thumbSrc: 'data/assets/source-thumb.jpg',
              nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
            },
            {
              name: 'mask clip',
              type: 'source-video',
              thumbSrc: 'data/assets/mask-thumb.jpg',
              nodeData: { type: 'source-video', localPath: 'data/assets/mask.mp4' },
            },
            {
              name: 'reference image',
              type: 'source-image',
              thumbSrc: 'data/assets/ref-thumb.jpg',
              nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
            },
            {
              name: 'first frame',
              type: 'source-image',
              thumbSrc: 'data/assets/first-thumb.jpg',
              nodeData: { type: 'source-image', originalLocalPath: 'data/assets/first.png' },
            },
          ],
        },
      ]);
      const _0x2a9769 = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x2ac4f9, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x250909 = Object.assign(Object.create(_0x2a9769), {
          nodeId: _0x2caf40,
          _data: _0x2ac4f9.nodes[_0x2caf40],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl([
            makeAssetPill({ assetId: 'asset-v54', assetIndex: 0, type: 'video', label: 'source clip' }),
            makeAssetPill({ assetId: 'asset-v54', assetIndex: 1, type: 'video', label: 'mask clip' }),
            makeAssetPill({ assetId: 'asset-v54', assetIndex: 2, type: 'image', label: 'reference image' }),
            makeAssetPill({ assetId: 'asset-v54', assetIndex: 3, type: 'image', label: 'first frame' }),
          ]),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => true,
          _resolveMediaUrl: (_0x2d19f6) => String(_0x2d19f6 || ''),
          _syncBtnIconState: () => {},
        });
      await _0x2a9769._renderRefBarImpl.call(_0x250909);
      const _0x1c457e = _0x250909.refBarEl.querySelector('.rh-v5-ref-container'),
        _0x1942f4 = _0x1c457e.querySelector('[data-slot="sourceVideo"]'),
        _0x3946f0 = _0x1c457e.querySelector('[data-slot="videoMask"]'),
        _0x50d51a = _0x1c457e.querySelector('[data-slot="refImage"]'),
        _0xdee3af = _0x1c457e.querySelector('[data-slot="firstFrame"]');
      (assert.equal(_0x1942f4.dataset.refOrigin, 'asset'),
        assert.equal(_0x3946f0.dataset.refOrigin, 'asset'),
        assert.equal(_0x50d51a.dataset.refOrigin, 'asset'),
        assert.equal(_0xdee3af.dataset.refOrigin, 'asset'),
        assert.equal(_0x1942f4.dataset.assetId, 'asset-v54'),
        assert.equal(_0x1942f4.dataset.assetIndex, '0'),
        assert.equal(_0x1942f4.dataset.assetOccurrence, '0'),
        assert.equal(_0x1942f4.dataset.refType, 'video'),
        assert.match(_0x1942f4.innerHTML, /source-thumb/),
        assert.match(_0x3946f0.innerHTML, /mask-thumb/),
        assert.match(_0x50d51a.innerHTML, /ref-thumb/),
        assert.match(_0xdee3af.innerHTML, /first-thumb/),
        assert.match(_0x1942f4.innerHTML, /ref-thumb-delete/));
    } finally {
      if (typeof _0x428800 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x428800;
    }
  }),
  test('video reference input: V5.4 hidden asset refs render as virtual fixed-slot thumbnails', async () => {
    const _0x3805bd = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x3a74c7 = 'node-v54-hidden-assets',
        _0x3fdcbc = {
          nodes: {
            [_0x3a74c7]: {
              id: _0x3a74c7,
              type: 'ai-video',
              model: 'runninghub/2041741496667348994',
              provider: 'runninghubwf',
              promptAssetInputRefs: [
                { assetId: 'asset-v54-hidden', itemIndex: 0, type: 'video' },
                { assetId: 'asset-v54-hidden', itemIndex: 1, type: 'image' },
              ],
            },
          },
        };
      setAssetMentionAssets([
        {
          id: 'asset-v54-hidden',
          items: [
            {
              name: 'source clip',
              type: 'source-video',
              thumbSrc: 'data/assets/source-thumb.jpg',
              nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
            },
            {
              name: 'reference image',
              type: 'source-image',
              thumbSrc: 'data/assets/ref-thumb.jpg',
              nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
            },
          ],
        },
      ]);
      const _0x3eb51d = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x3fdcbc, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x2a3bf3 = Object.assign(Object.create(_0x3eb51d), {
          nodeId: _0x3a74c7,
          _data: _0x3fdcbc.nodes[_0x3a74c7],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => true,
          _resolveMediaUrl: (_0x52d7cc) => String(_0x52d7cc || ''),
          _syncBtnIconState: () => {},
        });
      await _0x3eb51d._renderRefBarImpl.call(_0x2a3bf3);
      const _0x17ac5e = _0x2a3bf3.refBarEl.querySelector('.rh-v5-ref-container'),
        _0x546169 = _0x17ac5e.querySelector('[data-slot="sourceVideo"]'),
        _0xebe588 = _0x17ac5e.querySelector('[data-slot="refImage"]');
      (assert.equal(_0x546169.dataset.refOrigin, 'asset'),
        assert.equal(_0x546169.dataset.assetRefSource, 'hidden'),
        assert.equal(_0x546169.dataset.assetId, 'asset-v54-hidden'),
        assert.equal(_0x546169.dataset.refType, 'video'),
        assert.equal(_0xebe588.dataset.refOrigin, 'asset'),
        assert.equal(_0xebe588.dataset.assetRefSource, 'hidden'),
        assert.equal(_0xebe588.dataset.refType, 'image'),
        assert.match(_0x546169.innerHTML, /source-thumb/),
        assert.match(_0xebe588.innerHTML, /ref-thumb/));
    } finally {
      if (typeof _0x3805bd === 'undefined') delete globalThis.document;
      else globalThis.document = _0x3805bd;
    }
  }),
  test('video reference input: asset mentions render as generic thumbnails with delete', async () => {
    const _0x30e869 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x26c06f = 'node-generic-assets',
        _0x182c78 = {
          nodes: {
            [_0x26c06f]: { id: _0x26c06f, type: 'ai-video', model: 'generic/video', provider: 'grsai' },
          },
        };
      setAssetMentionAssets([
        {
          id: 'asset-generic',
          items: [
            {
              name: 'reference image',
              type: 'source-image',
              thumbSrc: 'data/assets/ref-thumb.jpg',
              nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
            },
          ],
        },
      ]);
      const _0x12be60 = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x182c78, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x355087 = Object.assign(Object.create(_0x12be60), {
          nodeId: _0x26c06f,
          _data: _0x182c78.nodes[_0x26c06f],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl([
            makeAssetPill({
              assetId: 'asset-generic',
              assetIndex: 0,
              type: 'image',
              label: 'reference image',
            }),
          ]),
          _refThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (_0x4462fa) => String(_0x4462fa || ''),
          _syncBtnIconState: () => {},
        });
      await _0x12be60._renderRefBarImpl.call(_0x355087);
      const _0x256016 = _0x355087.refBarEl.querySelector('.ref-thumb-container'),
        _0x4223f6 = _0x256016.childNodes.find((_0x2ff92b) => _0x2ff92b.dataset?.refOrigin === 'asset');
      (assert.equal(_0x4223f6.dataset.refOrigin, 'asset'),
        assert.equal(_0x4223f6.dataset.assetId, 'asset-generic'),
        assert.equal(_0x4223f6.dataset.assetIndex, '0'),
        assert.equal(_0x4223f6.dataset.assetOccurrence, '0'),
        assert.equal(_0x4223f6.dataset.refType, 'image'),
        assert.match(_0x4223f6.innerHTML, /ref-thumb-delete/),
        assert.match(_0x4223f6.innerHTML, /ref-thumb/));
    } finally {
      if (typeof _0x30e869 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x30e869;
    }
  }),
  test('video reference input: generic image refs show mask badge only for masked sources', async () => {
    const _0x1dfe8e = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x240e80 = 'node-video-generic-mask-refbar',
        _0x290f16 = {
          nodes: {
            [_0x240e80]: { id: _0x240e80, type: 'ai-video' },
            masked: {
              id: 'masked',
              type: 'source-image',
              localPath: 'data/assets/masked.png',
              maskUrl: 'output/mask/manual-mask.png',
            },
            plain: { id: 'plain', type: 'source-image', localPath: 'data/assets/plain.png' },
          },
        },
        _0x5af154 = [
          { id: 'edge-masked', sourceId: 'masked', targetId: _0x240e80 },
          { id: 'edge-plain', sourceId: 'plain', targetId: _0x240e80 },
        ],
        _0x4924f1 = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x290f16, getIncomingEdges: () => _0x5af154 },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x3ff51f = Object.assign(Object.create(_0x4924f1), {
          nodeId: _0x240e80,
          _data: _0x290f16.nodes[_0x240e80],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _refThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _resolveMediaUrl: (_0x22db90) => String(_0x22db90 || ''),
          _syncBtnIconState: () => {},
        });
      await _0x4924f1._renderRefBarImpl.call(_0x3ff51f);
      const _0x53a9ad = _0x3ff51f.refBarEl
        .querySelector('.ref-thumb-container')
        .querySelectorAll('.ref-thumb-wrap');
      (assert.equal(_0x53a9ad.length, 2),
        assert.match(_0x53a9ad[0].innerHTML, /ref-thumb-mask-badge/),
        assert.match(_0x53a9ad[0].innerHTML, />遮罩<\/span>/),
        assert.doesNotMatch(_0x53a9ad[1].innerHTML, /ref-thumb-mask-badge/));
    } finally {
      if (typeof _0x1dfe8e === 'undefined') delete globalThis.document;
      else globalThis.document = _0x1dfe8e;
    }
  }),
  test('video reference input: fixed-slot asset mentions fill other RH models and trail text', async () => {
    const _0xf058fd = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x1763e9 = 'node-ltx-assets',
        _0x5bf820 = {
          nodes: {
            [_0x1763e9]: {
              id: _0x1763e9,
              type: 'ai-video',
              model: 'runninghub/2039336644536442882',
              provider: 'runninghubwf',
            },
          },
        };
      setAssetMentionAssets([
        {
          id: 'asset-ltx',
          items: [
            {
              name: 'reference image',
              type: 'source-image',
              thumbSrc: 'data/assets/ref-thumb.jpg',
              nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
            },
            {
              name: 'voice',
              type: 'source-audio',
              nodeData: { type: 'source-audio', localPath: 'data/assets/voice.mp3' },
            },
            { name: 'lyrics', type: 'source-text', nodeData: { type: 'source-text', text: 'hello' } },
          ],
        },
      ]);
      const _0x3bbc16 = createVideoNodeReferenceInputModule({
          store: { getState: () => _0x5bf820, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        _0x46e69d = Object.assign(Object.create(_0x3bbc16), {
          nodeId: _0x1763e9,
          _data: _0x5bf820.nodes[_0x1763e9],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl([
            makeAssetPill({ assetId: 'asset-ltx', assetIndex: 0, type: 'image', label: 'reference image' }),
            makeAssetPill({ assetId: 'asset-ltx', assetIndex: 1, type: 'audio', label: 'voice' }),
            makeAssetPill({ assetId: 'asset-ltx', assetIndex: 2, type: 'text', label: 'lyrics' }),
          ]),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => true,
          _resolveMediaUrl: (_0x1ec39b) => String(_0x1ec39b || ''),
          _syncBtnIconState: () => {},
        });
      await _0x3bbc16._renderRefBarImpl.call(_0x46e69d);
      const _0x2c85fc = _0x46e69d.refBarEl.querySelector('.rh-v5-ref-container'),
        _0x1295d4 = _0x2c85fc.querySelector('[data-slot="refImage"]'),
        _0x43981a = _0x2c85fc.querySelector('[data-slot="audio"]'),
        _0x3a818f = _0x2c85fc.querySelector('.rh-fixed-extra-ref');
      (assert.equal(_0x1295d4.dataset.refOrigin, 'asset'),
        assert.equal(_0x1295d4.dataset.refType, 'image'),
        assert.equal(_0x43981a.dataset.refOrigin, 'asset'),
        assert.equal(_0x43981a.dataset.refType, 'audio'),
        assert.equal(_0x3a818f.dataset.refOrigin, 'asset'),
        assert.equal(_0x3a818f.dataset.refType, 'text'),
        assert.ok(_0x2c85fc.childNodes.indexOf(_0x3a818f) > _0x2c85fc.childNodes.indexOf(_0x43981a)),
        assert.match(_0x3a818f.innerHTML, /ref-thumb-delete/));
    } finally {
      if (typeof _0xf058fd === 'undefined') delete globalThis.document;
      else globalThis.document = _0xf058fd;
    }
  }),
  test('video reference input: LTX display area follows manifest refImage ratio', async () => {
    const _0x28a823 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x4f7ba5 = 'node-ltx-ref-ratio',
        { state: _0x363ebb } = await renderFixedRefBarForTest({
          targetId: _0x4f7ba5,
          model: 'runninghub/2039336644536442882',
          nodeData: { width: 0x12c, height: 0x12c, x: 100, y: 200 },
          nodes: {
            'source-ref-image': {
              id: 'source-ref-image',
              type: 'source-image',
              width: 0x258,
              height: 0x3e8,
              localPath: 'data/assets/ref.png',
            },
            'source-audio': { id: 'source-audio', type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
          incomingEdges: [
            { id: 'edge-ref', sourceId: 'source-ref-image', targetId: _0x4f7ba5, refSlot: 'refImage' },
            { id: 'edge-audio', sourceId: 'source-audio', targetId: _0x4f7ba5, refSlot: 'audio' },
          ],
        });
      (assert.equal(_0x363ebb.nodes[_0x4f7ba5].width, 0x12c),
        assert.equal(_0x363ebb.nodes[_0x4f7ba5].height, 0x1f4),
        assert.equal(_0x363ebb.nodes[_0x4f7ba5].x, 100),
        assert.equal(_0x363ebb.nodes[_0x4f7ba5].y, 0),
        assert.equal(_0x363ebb.nodes[_0x4f7ba5].aspectRatio, '自适应'));
    } finally {
      if (typeof _0x28a823 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x28a823;
    }
  }),
  test('video reference input: LipSync display area follows source video ratio', async () => {
    const _0x40ebec = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x57be94 = 'node-lipsync-video-ratio',
        { state: _0x3d07ae } = await renderFixedRefBarForTest({
          targetId: _0x57be94,
          model: 'runninghub/2054101324521844738',
          nodeData: { width: 0x12c, height: 0x12c, x: 100, y: 200 },
          nodes: {
            'source-video': {
              id: 'source-video',
              type: 'source-video',
              width: 0x500,
              height: 0x2d0,
              localPath: 'data/assets/source.mp4',
              thumbUrl: 'data/assets/source-thumb.jpg',
            },
            'source-audio': { id: 'source-audio', type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
          incomingEdges: [
            { id: 'edge-video', sourceId: 'source-video', targetId: _0x57be94, refSlot: 'sourceVideo' },
            { id: 'edge-audio', sourceId: 'source-audio', targetId: _0x57be94, refSlot: 'audio' },
          ],
        });
      (assert.equal(_0x3d07ae.nodes[_0x57be94].width, 0x215),
        assert.equal(_0x3d07ae.nodes[_0x57be94].height, 0x12c),
        assert.equal(_0x3d07ae.nodes[_0x57be94].x, -16),
        assert.equal(_0x3d07ae.nodes[_0x57be94].y, 200),
        assert.equal(_0x3d07ae.nodes[_0x57be94].aspectRatio, '自适应'));
    } finally {
      if (typeof _0x40ebec === 'undefined') delete globalThis.document;
      else globalThis.document = _0x40ebec;
    }
  }),
  test('video reference input: LipSync display area follows ref image ratio', async () => {
    const _0xb5231b = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x131c13 = 'node-lipsync-image-ratio',
        { state: _0x42c29b } = await renderFixedRefBarForTest({
          targetId: _0x131c13,
          model: 'runninghub/2054101324521844738',
          nodeData: { width: 0x12c, height: 0x12c, x: 100, y: 200 },
          nodes: {
            'source-ref-image': {
              id: 'source-ref-image',
              type: 'source-image',
              width: 0x258,
              height: 0x3e8,
              localPath: 'data/assets/ref.png',
            },
            'source-audio': { id: 'source-audio', type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
          incomingEdges: [
            { id: 'edge-ref', sourceId: 'source-ref-image', targetId: _0x131c13, refSlot: 'refImage' },
            { id: 'edge-audio', sourceId: 'source-audio', targetId: _0x131c13, refSlot: 'audio' },
          ],
        });
      (assert.equal(_0x42c29b.nodes[_0x131c13].width, 0x12c),
        assert.equal(_0x42c29b.nodes[_0x131c13].height, 0x1f4),
        assert.equal(_0x42c29b.nodes[_0x131c13].x, 100),
        assert.equal(_0x42c29b.nodes[_0x131c13].y, 0),
        assert.equal(_0x42c29b.nodes[_0x131c13].aspectRatio, '自适应'));
    } finally {
      if (typeof _0xb5231b === 'undefined') delete globalThis.document;
      else globalThis.document = _0xb5231b;
    }
  }));
async function renderFixedRefBarForTest({
  targetId: targetId = 'node-fixed-refbar',
  model: _0x311381,
  nodeData: nodeData = {},
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  assetId: assetId = '',
  assetItems: assetItems = [],
  pills: pills = [],
  api: api = {},
} = {}) {
  assetId && assetItems.length && setAssetMentionAssets([{ id: assetId, items: assetItems }]);
  const _0x5010b4 = {
      nodes: {
        ...nodes,
        [targetId]: {
          id: targetId,
          type: 'ai-video',
          model: _0x311381,
          provider: 'runninghubwf',
          ...nodeData,
        },
      },
    },
    _0x4fff1d = createVideoNodeReferenceInputModule({
      store: {
        getState: () => _0x5010b4,
        getIncomingEdges: () => incomingEdges,
        removeEdge: (_0x377b74) => {
          const _0x41efd1 = incomingEdges.findIndex((_0x406582) => _0x406582.id === _0x377b74);
          if (_0x41efd1 >= 0) incomingEdges.splice(_0x41efd1, 1);
        },
        updateNodeData: (_0x2acda7, _0x352ed8) => {
          _0x5010b4.nodes[_0x2acda7] = { ...(_0x5010b4.nodes[_0x2acda7] || {}), ...(_0x352ed8 || {}) };
        },
        batch: (_0x38de42) => _0x38de42(),
      },
      api: api,
      _syncPillLabels: () => {},
      getImage: async () => null,
      ensureThumbDecoded: () => {},
      revealRefThumbMedia: () => {},
    }),
    _0xb727c4 = Object.assign(Object.create(_0x4fff1d), {
      nodeId: targetId,
      _data: _0x5010b4.nodes[targetId],
      refBarEl: createFakeElement('div'),
      promptEl: makePromptEl(
        pills.map((_0x5dd0de) =>
          makeAssetPill({
            assetId: assetId,
            assetIndex: _0x5dd0de.assetIndex,
            type: _0x5dd0de.type,
            label: _0x5dd0de.label,
          }),
        ),
      ),
      _fixedSlotRefThumbObjectUrls: new Map(),
      _videoThumbPending: new Set(),
      _resolveMediaUrl: (_0x4530e5) => String(_0x4530e5 || ''),
      _syncBtnIconState: () => {},
    });
  return (
    await _0x4fff1d._renderRefBarImpl.call(_0xb727c4),
    { ctx: _0xb727c4, container: _0xb727c4.refBarEl.querySelector('.rh-v5-ref-container'), state: _0x5010b4 }
  );
}
(test('video reference input: Basic, Scail2, and LipSync fixed slots are manifest-rendered from asset pills', async () => {
  const _0x352e8f = globalThis.document;
  globalThis.document = { createElement: createFakeElement };
  try {
    const _0x625587 = [
      {
        label: 'basic',
        model: 'runninghub/1971148165531475969',
        assetId: 'asset-basic-refbar',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            thumbSrc: 'data/assets/source-thumb.jpg',
            nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
          },
          {
            name: 'reference image',
            type: 'source-image',
            thumbSrc: 'data/assets/ref-thumb.jpg',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
          },
        ],
        pills: [
          { assetIndex: 0, type: 'video', label: 'source clip' },
          { assetIndex: 1, type: 'image', label: 'reference image' },
        ],
        slots: [
          ['sourceVideo', 'video'],
          ['refImage', 'image'],
        ],
      },
      {
        label: 'lipsync',
        model: 'runninghub/2054101324521844738',
        assetId: 'asset-lipsync-refbar',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            thumbSrc: 'data/assets/source-thumb.jpg',
            nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
          },
          {
            name: 'voice',
            type: 'source-audio',
            nodeData: { type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
        ],
        pills: [
          { assetIndex: 0, type: 'video', label: 'source clip' },
          { assetIndex: 1, type: 'audio', label: 'voice' },
        ],
        slots: [
          ['sourceVideo', 'video'],
          ['audio', 'audio'],
        ],
      },
      {
        label: 'scail2',
        model: 'runninghub/2064961300823896065',
        assetId: 'asset-scail2-refbar',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            thumbSrc: 'data/assets/source-thumb.jpg',
            nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
          },
          {
            name: 'reference image',
            type: 'source-image',
            thumbSrc: 'data/assets/ref-thumb.jpg',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
          },
        ],
        pills: [
          { assetIndex: 0, type: 'video', label: 'source clip' },
          { assetIndex: 1, type: 'image', label: 'reference image' },
        ],
        slots: [
          ['sourceVideo', 'video'],
          ['refImage', 'image'],
        ],
      },
    ];
    for (const _0x43612a of _0x625587) {
      _resetAssetMentionRegistryForTests();
      const { container: _0x530c91 } = await renderFixedRefBarForTest({
        targetId: 'node-' + _0x43612a.label + '-refbar-assets',
        model: _0x43612a.model,
        assetId: _0x43612a.assetId,
        assetItems: _0x43612a.items,
        pills: _0x43612a.pills,
      });
      assert.ok(_0x530c91, _0x43612a.label);
      for (const [_0x3e30f0, _0x1c62f1] of _0x43612a.slots) {
        const _0x720ad0 = _0x530c91.querySelector('[data-slot="' + _0x3e30f0 + '"]');
        (assert.equal(_0x720ad0.dataset.refOrigin, 'asset', _0x43612a.label + ':' + _0x3e30f0),
          assert.equal(_0x720ad0.dataset.kind, _0x1c62f1, _0x43612a.label + ':' + _0x3e30f0),
          assert.equal(_0x720ad0.dataset.refType, _0x1c62f1, _0x43612a.label + ':' + _0x3e30f0),
          assert.equal(_0x720ad0.dataset.assetId, _0x43612a.assetId, _0x43612a.label + ':' + _0x3e30f0));
      }
    }
  } finally {
    if (typeof _0x352e8f === 'undefined') delete globalThis.document;
    else globalThis.document = _0x352e8f;
  }
}),
  test('video reference input: HD VIP and Matting render fixed slots from manifest', async () => {
    const _0x361713 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      {
        const { container: _0x3c647e } = await renderFixedRefBarForTest({
            targetId: 'node-watermark-v2-refbar',
            model: 'runninghub/2060613773890768898',
          }),
          _0x26b8c5 = Array.from(_0x3c647e.querySelectorAll('[data-slot]')).map(
            (_0x8413c5) => _0x8413c5.dataset.slot,
          );
        (assert.deepEqual(_0x26b8c5, ['sourceVideo']),
          assert.equal(_0x3c647e.querySelector('[data-slot="sourceVideo"]').dataset.kind, 'video'),
          assert.equal(_0x3c647e.querySelector('[data-slot="maskImage"]'), null));
      }
      {
        const { container: _0x1183cc } = await renderFixedRefBarForTest({
            targetId: 'node-watermark-v2-mode2-refbar',
            model: 'runninghub/2060613773890768898',
            nodeData: { generationParams: { rhWatermarkRemoveMode: 'mode2' } },
          }),
          _0x42c3e6 = Array.from(_0x1183cc.querySelectorAll('[data-slot]')).map(
            (_0x2cb3ec) => _0x2cb3ec.dataset.slot,
          );
        (assert.deepEqual(_0x42c3e6, ['sourceVideo', 'maskImage']),
          assert.equal(_0x1183cc.querySelector('[data-slot="maskImage"]').dataset.kind, 'image'));
      }
      {
        const { container: _0x3a8eff } = await renderFixedRefBarForTest({
            targetId: 'node-hd-vip-refbar',
            model: 'runninghub/2047787809091620866',
          }),
          _0x386326 = Array.from(_0x3a8eff.querySelectorAll('[data-slot]')).map(
            (_0x468024) => _0x468024.dataset.slot,
          );
        (assert.deepEqual(_0x386326, ['sourceVideo']),
          assert.equal(_0x3a8eff.querySelector('[data-slot="sourceVideo"]').dataset.kind, 'video'));
      }
      {
        const { container: _0x4c1e6e } = await renderFixedRefBarForTest({
            targetId: 'node-matting-refbar',
            model: 'runninghub/video_matting',
          }),
          _0x5ba352 = Array.from(_0x4c1e6e.querySelectorAll('[data-slot]')).map(
            (_0x4e1776) => _0x4e1776.dataset.slot,
          );
        (assert.deepEqual(_0x5ba352, ['sourceVideo', 'maskImage']),
          assert.equal(_0x4c1e6e.querySelector('[data-slot="sourceVideo"]').dataset.kind, 'video'),
          assert.equal(_0x4c1e6e.querySelector('[data-slot="maskImage"]').dataset.kind, 'image'));
      }
    } finally {
      if (typeof _0x361713 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x361713;
    }
  }),
  test('video reference input: 视频去字幕V2 hides and prunes mask slot outside mode2', async () => {
    const _0x5ddb89 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x4f0a1d = 'node-watermark-v2-mode-switch',
        _0x5136e0 = [
          {
            id: 'edge-watermark-source',
            sourceId: 'sourceVideo',
            targetId: _0x4f0a1d,
            refSlot: 'sourceVideo',
          },
          { id: 'edge-watermark-mask', sourceId: 'maskImage', targetId: _0x4f0a1d, refSlot: 'maskImage' },
        ],
        {
          ctx: _0x2a0d1e,
          state: _0xf345d7,
          container: _0x4bb99e,
        } = await renderFixedRefBarForTest({
          targetId: _0x4f0a1d,
          model: 'runninghub/2060613773890768898',
          nodeData: { generationParams: { rhWatermarkRemoveMode: 'mode2' } },
          nodes: {
            sourceVideo: {
              id: 'sourceVideo',
              type: 'source-video',
              localPath: 'data/source.mp4',
              thumbUrl: 'data/source-thumb.jpg',
            },
            maskImage: {
              id: 'maskImage',
              type: 'source-image',
              localPath: 'output/mask-source.png',
              maskLocalPath: 'output/mask/manual-mask.png',
            },
          },
          incomingEdges: _0x5136e0,
        });
      assert.deepEqual(
        Array.from(_0x4bb99e.querySelectorAll('[data-slot]')).map((_0x9f03ef) => _0x9f03ef.dataset.slot),
        ['sourceVideo', 'maskImage'],
      );
      const _0x464ec7 = _0x2a0d1e.refBarEl._innerHTMLSetCount;
      (assert.equal(_0x5136e0.length, 2),
        (_0xf345d7.nodes[_0x4f0a1d] = {
          ..._0xf345d7.nodes[_0x4f0a1d],
          generationParams: { rhWatermarkRemoveMode: 'mode1' },
        }),
        (_0x2a0d1e._data = _0xf345d7.nodes[_0x4f0a1d]),
        await _0x2a0d1e._renderRefBarImpl());
      const _0x482432 = _0x2a0d1e.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.equal(_0x2a0d1e.refBarEl._innerHTMLSetCount, _0x464ec7),
        assert.deepEqual(
          Array.from(_0x482432.querySelectorAll('[data-slot]')).map((_0x158a42) => _0x158a42.dataset.slot),
          ['sourceVideo'],
        ),
        assert.equal(_0x482432.querySelector('[data-slot="maskImage"]'), null),
        assert.equal(
          _0x5136e0.some((_0x535528) => _0x535528.id === 'edge-watermark-mask'),
          false,
        ));
    } finally {
      if (typeof _0x5ddb89 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x5ddb89;
    }
  }),
  test('video reference input: fixed image slots show mask badge for masked sources', async () => {
    const _0x4ac6bf = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x24e3ed = 'node-watermark-mask-badge',
        { container: _0x2427ac } = await renderFixedRefBarForTest({
          targetId: _0x24e3ed,
          model: 'runninghub/2060613773890768898',
          nodeData: { generationParams: { rhWatermarkRemoveMode: 'mode2' } },
          nodes: {
            sourceVideo: {
              id: 'sourceVideo',
              type: 'source-video',
              localPath: 'data/source.mp4',
              thumbUrl: 'data/source-thumb.jpg',
            },
            maskImage: {
              id: 'maskImage',
              type: 'source-image',
              localPath: 'output/mask-source.png',
              maskLocalPath: 'output/mask/manual-mask.png',
            },
          },
          incomingEdges: [
            { id: 'edge-source', sourceId: 'sourceVideo', targetId: _0x24e3ed, refSlot: 'sourceVideo' },
            { id: 'edge-mask', sourceId: 'maskImage', targetId: _0x24e3ed, refSlot: 'maskImage' },
          ],
        }),
        _0x1be65b = _0x2427ac.querySelector('[data-slot="sourceVideo"]'),
        _0x4db633 = _0x2427ac.querySelector('[data-slot="maskImage"]');
      (assert.doesNotMatch(_0x1be65b.innerHTML, /ref-thumb-mask-badge/),
        assert.match(_0x4db633.innerHTML, /ref-thumb-mask-badge/),
        assert.match(_0x4db633.innerHTML, />遮罩<\/span>/));
    } finally {
      if (typeof _0x4ac6bf === 'undefined') delete globalThis.document;
      else globalThis.document = _0x4ac6bf;
    }
  }),
  test('video reference input: V5.4 cameraMove renders only required slots', async () => {
    const _0x1d3104 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const { container: _0x40b43a } = await renderFixedRefBarForTest({
          targetId: 'node-v54-camera',
          model: 'runninghub/2041741496667348994',
          nodeData: { rhSpecialMode: 'cameraMove' },
        }),
        _0x303860 = Array.from(_0x40b43a.querySelectorAll('[data-slot]')).map(
          (_0x5f0121) => _0x5f0121.dataset.slot,
        );
      (assert.deepEqual(_0x303860, ['sourceVideo', 'refImage']),
        assert.equal(_0x40b43a.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(_0x40b43a.querySelector('[data-slot="videoMask"]'), null));
    } finally {
      if (typeof _0x1d3104 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x1d3104;
    }
  }),
  test('video reference input: V5.4 subtract hides mask video and first frame slots', async () => {
    const _0x15794c = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const { container: _0x559c7b } = await renderFixedRefBarForTest({
          targetId: 'node-v54-subtract',
          model: 'runninghub/2041741496667348994',
          nodeData: { rhSubtractSubject: true },
        }),
        _0x36bd2e = Array.from(_0x559c7b.querySelectorAll('[data-slot]')).map(
          (_0x411f21) => _0x411f21.dataset.slot,
        );
      (assert.deepEqual(_0x36bd2e, ['sourceVideo', 'refImage']),
        assert.equal(_0x559c7b.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(_0x559c7b.querySelector('[data-slot="videoMask"]'), null));
    } finally {
      if (typeof _0x15794c === 'undefined') delete globalThis.document;
      else globalThis.document = _0x15794c;
    }
  }),
  test('video reference input: V5.4 subtract toggle reuses visible fixed slots', async () => {
    const _0xeeb6ea = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x4b49e7 = 'node-v54-subtract-toggle',
        { ctx: _0x3ab56f, state: _0x2594af } = await renderFixedRefBarForTest({
          targetId: _0x4b49e7,
          model: 'runninghub/2041741496667348994',
          nodeData: { rhSubtractSubject: false },
        }),
        _0x1bfd46 = _0x3ab56f.refBarEl,
        _0x1d54f5 = _0x1bfd46.querySelector('.rh-v5-ref-container'),
        _0x29b645 = _0x1d54f5.querySelector('[data-slot="sourceVideo"]'),
        _0x32f766 = _0x1d54f5.querySelector('[data-slot="refImage"]'),
        _0x525ec6 = _0x1bfd46._innerHTMLSetCount;
      (assert.ok(_0x525ec6 >= 1),
        (_0x2594af.nodes[_0x4b49e7].rhSubtractSubject = true),
        (_0x3ab56f._data = _0x2594af.nodes[_0x4b49e7]),
        await _0x3ab56f._renderRefBarImpl(),
        assert.equal(_0x1bfd46._innerHTMLSetCount, _0x525ec6),
        assert.deepEqual(
          Array.from(_0x1d54f5.querySelectorAll('[data-slot]')).map((_0x142ddf) => _0x142ddf.dataset.slot),
          ['sourceVideo', 'refImage'],
        ),
        assert.equal(_0x1d54f5.querySelector('[data-slot="sourceVideo"]'), _0x29b645),
        assert.equal(_0x1d54f5.querySelector('[data-slot="refImage"]'), _0x32f766),
        (_0x2594af.nodes[_0x4b49e7].rhSubtractSubject = false),
        (_0x3ab56f._data = _0x2594af.nodes[_0x4b49e7]),
        await _0x3ab56f._renderRefBarImpl(),
        assert.equal(_0x1bfd46._innerHTMLSetCount, _0x525ec6),
        assert.deepEqual(
          Array.from(_0x1d54f5.querySelectorAll('[data-slot]')).map((_0x209ec0) => _0x209ec0.dataset.slot),
          ['sourceVideo', 'refImage', 'firstFrame', 'videoMask'],
        ),
        assert.equal(_0x1d54f5.querySelector('[data-slot="sourceVideo"]'), _0x29b645),
        assert.equal(_0x1d54f5.querySelector('[data-slot="refImage"]'), _0x32f766));
    } finally {
      if (typeof _0xeeb6ea === 'undefined') delete globalThis.document;
      else globalThis.document = _0xeeb6ea;
    }
  }),
  test('video reference input: 同构固定入参模型切换不清空缩略图 DOM', async () => {
    const _0x33e01e = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x18c0a3 = 'node-fixed-model-switch',
        {
          ctx: _0x5463fe,
          state: _0x10556d,
          container: _0x4a7dfd,
        } = await renderFixedRefBarForTest({
          targetId: _0x18c0a3,
          model: 'runninghub/1971148165531475969',
          nodes: {
            sourceVideo: {
              id: 'sourceVideo',
              type: 'source-video',
              localPath: 'data/source.mp4',
              thumbUrl: 'data/source-thumb.jpg',
            },
            refImage: {
              id: 'refImage',
              type: 'source-image',
              localPath: 'data/ref.png',
              thumbUrl: 'data/ref-thumb.jpg',
            },
          },
          incomingEdges: [
            { id: 'edge-source', sourceId: 'sourceVideo', targetId: _0x18c0a3, refSlot: 'sourceVideo' },
            { id: 'edge-ref', sourceId: 'refImage', targetId: _0x18c0a3, refSlot: 'refImage' },
          ],
        }),
        _0x268560 = _0x5463fe.refBarEl,
        _0x3a1a0f = _0x4a7dfd.querySelector('[data-slot="sourceVideo"]'),
        _0x541711 = _0x4a7dfd.querySelector('[data-slot="refImage"]'),
        _0xb5157e = _0x268560._innerHTMLSetCount;
      ((_0x10556d.nodes[_0x18c0a3] = {
        ..._0x10556d.nodes[_0x18c0a3],
        model: 'runninghub/2041741496667348994',
        rhSubtractSubject: true,
      }),
        (_0x5463fe._data = _0x10556d.nodes[_0x18c0a3]),
        await _0x5463fe._renderRefBarImpl(),
        assert.equal(_0x268560._innerHTMLSetCount, _0xb5157e),
        assert.equal(_0x4a7dfd.querySelector('[data-slot="sourceVideo"]'), _0x3a1a0f),
        assert.equal(_0x4a7dfd.querySelector('[data-slot="refImage"]'), _0x541711),
        (_0x10556d.nodes[_0x18c0a3] = {
          ..._0x10556d.nodes[_0x18c0a3],
          model: 'runninghub/2064961300823896065',
          generationParams: { rhScail2ReplaceSubject: false },
        }),
        (_0x5463fe._data = _0x10556d.nodes[_0x18c0a3]),
        await _0x5463fe._renderRefBarImpl(),
        assert.equal(_0x268560._innerHTMLSetCount, _0xb5157e),
        assert.equal(_0x4a7dfd.querySelector('[data-slot="sourceVideo"]'), _0x3a1a0f),
        assert.equal(_0x4a7dfd.querySelector('[data-slot="refImage"]'), _0x541711));
    } finally {
      if (typeof _0x33e01e === 'undefined') delete globalThis.document;
      else globalThis.document = _0x33e01e;
    }
  }),
  test('video reference input: failed video thumb backfill keeps source video usable', async () => {
    const _0x4b0fe6 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x50245d = 'node-v54-thumb-failure-target',
        _0xf412ae = 'node-v54-keyed-source',
        { state: _0x506047 } = await renderFixedRefBarForTest({
          targetId: _0x50245d,
          model: 'runninghub/2041741496667348994',
          nodes: {
            [_0xf412ae]: {
              id: _0xf412ae,
              type: 'source-video',
              localPath: 'output/keyed.mp4',
              videoUrl: '/output/keyed.mp4',
              thumbUrl: '',
              model: 'runninghub/video_matting',
              provider: 'runninghubwf',
              rhToolbarTaskType: 'video-keying',
              jobStatus: 'success',
              isGenerating: false,
            },
          },
          incomingEdges: [
            {
              id: 'edge-v54-keyed-source',
              sourceId: _0xf412ae,
              targetId: _0x50245d,
              refSlot: 'videoMask',
              sourceMediaKey: 'output/keyed.mp4',
            },
          ],
          api: {
            fetchVideoFirstFrameThumbFromServer() {
              return Promise.reject(new Error('thumb unavailable'));
            },
          },
        });
      (await Promise.resolve(), await Promise.resolve());
      const _0xbaabcf = _0x506047.nodes[_0xf412ae];
      (assert.notEqual(_0xbaabcf.mediaUnavailable, true),
        assert.equal(_0xbaabcf.mediaUnavailableSource, undefined),
        assert.equal(_0xbaabcf.videoThumbUnavailableSource, '/output/keyed.mp4'),
        assert.equal(hasUsableInputNodeSource(_0xbaabcf), true));
    } finally {
      if (typeof _0x4b0fe6 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x4b0fe6;
    }
  }),
  test('video reference input: fixed-slot edges win over asset refs and text stays trailing', async () => {
    const _0x1e84cb = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const _0x4fa1b1 = 'asset-fixed-priority',
        { container: _0xa43206 } = await renderFixedRefBarForTest({
          targetId: 'node-fixed-priority',
          model: 'runninghub/1971148165531475969',
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              localPath: 'data/edge-source.mp4',
              thumbUrl: 'data/edge-source-thumb.jpg',
            },
          },
          incomingEdges: [
            {
              id: 'edge-source',
              sourceId: 'video1',
              targetId: 'node-fixed-priority',
              refSlot: 'sourceVideo',
            },
          ],
          assetId: _0x4fa1b1,
          assetItems: [
            {
              name: 'asset source',
              type: 'source-video',
              thumbSrc: 'data/assets/asset-source-thumb.jpg',
              nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
            },
            {
              name: 'asset ref',
              type: 'source-image',
              thumbSrc: 'data/assets/asset-ref-thumb.jpg',
              nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
            },
            {
              name: 'asset text',
              type: 'source-text',
              nodeData: { type: 'source-text', text: 'trailing prompt' },
            },
          ],
          pills: [
            { assetIndex: 0, type: 'video', label: 'asset source' },
            { assetIndex: 1, type: 'image', label: 'asset ref' },
            { assetIndex: 2, type: 'text', label: 'asset text' },
          ],
        }),
        _0x24f38f = _0xa43206.querySelector('[data-slot="sourceVideo"]'),
        _0x21ce94 = _0xa43206.querySelector('[data-slot="refImage"]'),
        _0x1d421d = _0xa43206.querySelector('.rh-fixed-extra-ref');
      (assert.equal(_0x24f38f.dataset.refOrigin, 'node'),
        assert.equal(_0x24f38f.dataset.edgeId, 'edge-source'),
        assert.equal(_0x21ce94.dataset.refOrigin, 'asset'),
        assert.equal(_0x21ce94.dataset.assetId, _0x4fa1b1),
        assert.equal(_0x21ce94.dataset.refType, 'image'),
        assert.equal(_0x1d421d.dataset.refOrigin, 'asset'),
        assert.equal(_0x1d421d.dataset.refType, 'text'),
        assert.ok(_0xa43206.childNodes.indexOf(_0x1d421d) > _0xa43206.childNodes.indexOf(_0x21ce94)));
    } finally {
      if (typeof _0x1e84cb === 'undefined') delete globalThis.document;
      else globalThis.document = _0x1e84cb;
    }
  }),
  test('video reference input: fixed-slot explicit refSlot wins before same-kind empty slots', async () => {
    const _0x33e53f = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const { container: _0x4c89bb } = await renderFixedRefBarForTest({
        targetId: 'node-v54-edge-slots',
        model: 'runninghub/2041741496667348994',
        nodes: {
          maskVideo: {
            id: 'maskVideo',
            type: 'source-video',
            localPath: 'data/mask.mp4',
            thumbUrl: 'data/mask-thumb.jpg',
          },
          sourceVideo: {
            id: 'sourceVideo',
            type: 'source-video',
            localPath: 'data/source.mp4',
            thumbUrl: 'data/source-thumb.jpg',
          },
        },
        incomingEdges: [
          { id: 'edge-mask', sourceId: 'maskVideo', targetId: 'node-v54-edge-slots', refSlot: 'videoMask' },
          { id: 'edge-source', sourceId: 'sourceVideo', targetId: 'node-v54-edge-slots', refSlot: '' },
        ],
      });
      (assert.equal(_0x4c89bb.querySelector('[data-slot="videoMask"]').dataset.edgeId, 'edge-mask'),
        assert.equal(_0x4c89bb.querySelector('[data-slot="sourceVideo"]').dataset.edgeId, 'edge-source'));
    } finally {
      if (typeof _0x33e53f === 'undefined') delete globalThis.document;
      else globalThis.document = _0x33e53f;
    }
  }),
  test('video submit button: V5.4 asset mentions satisfy required fixed inputs', () => {
    const _0x11759d = 'node-v54-submit-assets',
      _0xe6cc8f = {
        nodes: {
          [_0x11759d]: {
            id: _0x11759d,
            type: 'ai-video',
            model: 'runninghub/2041741496667348994',
            provider: 'runninghubwf',
          },
        },
      };
    setAssetMentionAssets([
      {
        id: 'asset-submit',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
          },
          {
            name: 'reference image',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
          },
        ],
      },
    ]);
    const _0x392a45 = createVideoNodeParameterPanelModule({
        store: { getState: () => _0xe6cc8f, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 0x12c, height: 0x12c }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      _0x200d49 = Object.assign(Object.create(_0x392a45), {
        nodeId: _0x11759d,
        _data: _0xe6cc8f.nodes[_0x11759d],
        promptEl: makePromptEl([
          makeAssetPill({ assetId: 'asset-submit', assetIndex: 0, type: 'video', label: 'source clip' }),
          makeAssetPill({ assetId: 'asset-submit', assetIndex: 1, type: 'image', label: 'reference image' }),
        ]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => true,
      });
    (_0x392a45._updateSubmitButtonState.call(_0x200d49), assert.equal(_0x200d49.btnEl.disabled, false));
  }),
  test('video submit button: other fixed-slot models accept asset mentions', () => {
    const _0x1d2b81 = [
      {
        label: 'basic',
        model: 'runninghub/1971148165531475969',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
          },
          {
            name: 'reference image',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
          },
        ],
        pills: [
          { assetIndex: 0, type: 'video', label: 'source clip' },
          { assetIndex: 1, type: 'image', label: 'reference image' },
        ],
      },
      {
        label: 'ltx',
        model: 'runninghub/2039336644536442882',
        items: [
          {
            name: 'reference image',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
          },
          {
            name: 'voice',
            type: 'source-audio',
            nodeData: { type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
        ],
        pills: [
          { assetIndex: 0, type: 'image', label: 'reference image' },
          { assetIndex: 1, type: 'audio', label: 'voice' },
        ],
      },
      {
        label: 'lipsync',
        model: 'runninghub/2054101324521844738',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
          },
          {
            name: 'voice',
            type: 'source-audio',
            nodeData: { type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
        ],
        pills: [
          { assetIndex: 0, type: 'video', label: 'source clip' },
          { assetIndex: 1, type: 'audio', label: 'voice' },
        ],
      },
    ];
    for (const _0x570f85 of _0x1d2b81) {
      _resetAssetMentionRegistryForTests();
      const _0x42b171 = 'node-' + _0x570f85.label + '-submit-assets',
        _0x48afba = {
          nodes: {
            [_0x42b171]: {
              id: _0x42b171,
              type: 'ai-video',
              model: _0x570f85.model,
              provider: 'runninghubwf',
            },
          },
        };
      setAssetMentionAssets([{ id: 'asset-' + _0x570f85.label, items: _0x570f85.items }]);
      const _0x47351f = createVideoNodeParameterPanelModule({
          store: { getState: () => _0x48afba, getIncomingEdges: () => [] },
          api: {},
          getDisplayModelName: () => '',
          PROVIDERS_META: {},
          getAIGenerationNodeSize: () => ({ width: 0x12c, height: 0x12c }),
          getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
          activateMenuKeyboard: () => {},
          isVideoVipModel: () => false,
        }),
        _0x306722 = Object.assign(Object.create(_0x47351f), {
          nodeId: _0x42b171,
          _data: _0x48afba.nodes[_0x42b171],
          promptEl: makePromptEl(
            _0x570f85.pills.map((_0x1c3068) =>
              makeAssetPill({
                assetId: 'asset-' + _0x570f85.label,
                assetIndex: _0x1c3068.assetIndex,
                type: _0x1c3068.type,
                label: _0x1c3068.label,
              }),
            ),
          ),
          btnEl: { disabled: true, style: {} },
          _isGenerating: false,
          _isDreaminaVideoNode: () => false,
          _isRunninghubWorkflowModel: () => true,
        });
      (_0x47351f._updateSubmitButtonState.call(_0x306722),
        assert.equal(_0x306722.btnEl.disabled, false, _0x570f85.label));
    }
  }),
  test('video submit button: empty editor can generate from non-empty text input', () => {
    const _0x231f7b = 'node-video-text-input-submit',
      _0x5636af = 'node-video-text-input-source',
      _0x405dd0 = {
        nodes: {
          [_0x231f7b]: {
            id: _0x231f7b,
            type: 'ai-video',
            model: 'apimart/seedance-1.0',
            provider: 'apimart',
          },
          [_0x5636af]: { id: _0x5636af, type: 'source-text', content: '用文本入参生成视频' },
        },
      },
      _0x4ec62c = [{ id: 'edge-video-text-input', sourceId: _0x5636af, targetId: _0x231f7b }],
      _0x4861ec = createVideoNodeParameterPanelModule({
        store: { getState: () => _0x405dd0, getIncomingEdges: () => _0x4ec62c },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 0x12c, height: 0x12c }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      _0x50fcdf = Object.assign(Object.create(_0x4861ec), {
        nodeId: _0x231f7b,
        _data: _0x405dd0.nodes[_0x231f7b],
        promptEl: makePromptEl([]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => false,
      });
    (_0x4861ec._updateSubmitButtonState.call(_0x50fcdf),
      assert.equal(_0x50fcdf.btnEl.disabled, false),
      assert.equal(_0x50fcdf.btnEl.style.cursor, ''));
  }),
  test('video submit button: running task state is read from unified selector', () => {
    const _0x4da6a5 = 'node-video-running-button-state',
      _0x29bc52 = {
        nodes: {
          [_0x4da6a5]: {
            id: _0x4da6a5,
            type: 'ai-video',
            model: 'runninghub/1971148165531475969',
            provider: 'runninghubwf',
            rhTaskStatus: 'running',
            rhTaskId: 'rh-video-running',
          },
        },
      },
      _0x6e627c = createVideoNodeParameterPanelModule({
        store: { getState: () => _0x29bc52, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 0x12c, height: 0x12c }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      _0x355ff2 = Object.assign(Object.create(_0x6e627c), {
        nodeId: _0x4da6a5,
        _data: _0x29bc52.nodes[_0x4da6a5],
        promptEl: makePromptEl([]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _rhCancelInFlight: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => true,
      });
    (_0x6e627c._updateSubmitButtonState.call(_0x355ff2),
      assert.equal(_0x355ff2.btnEl.disabled, false),
      assert.equal(_0x355ff2.btnEl.style.cursor, ''));
  }),
  test('video submit button: non-cancellable async running state stays disabled', () => {
    const _0x4ff317 = 'node-video-async-running-button-state',
      _0x46e0b8 = {
        nodes: {
          [_0x4ff317]: {
            id: _0x4ff317,
            type: 'ai-video',
            model: 'apimart/seedance-1.0',
            provider: 'apimart',
            asyncTaskStatus: 'running',
            asyncTaskId: 'async-video-running',
          },
        },
      },
      _0x735735 = createVideoNodeParameterPanelModule({
        store: { getState: () => _0x46e0b8, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 0x12c, height: 0x12c }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      _0x32addd = Object.assign(Object.create(_0x735735), {
        nodeId: _0x4ff317,
        _data: _0x46e0b8.nodes[_0x4ff317],
        promptEl: { innerText: 'prompt', querySelectorAll: () => [] },
        btnEl: { disabled: false, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => false,
      });
    (_0x735735._updateSubmitButtonState.call(_0x32addd),
      assert.equal(_0x32addd.btnEl.disabled, true),
      assert.equal(_0x32addd.btnEl.style.cursor, 'var(--unavailable-cursor)'));
  }),
  test('video submit button: Dreamina-style API running state stays disabled', () => {
    const _0x3c8966 = 'node-video-seedance-api-running-button-state',
      _0x5c75e7 = {
        nodes: {
          [_0x3c8966]: {
            id: _0x3c8966,
            type: 'ai-video',
            model: 'apimart/doubao-seedance-2.0-fast',
            provider: 'apimart',
            asyncTaskStatus: 'running',
            asyncTaskId: 'async-seedance-running',
            isGenerating: true,
            jobStatus: 'running',
          },
        },
      },
      _0x1366b9 = createVideoNodeParameterPanelModule({
        store: { getState: () => _0x5c75e7, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 0x12c, height: 0x12c }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      _0x35700f = {
        disabled: false,
        className: '',
        dataset: {},
        innerHTML: '',
        style: {},
        title: '',
        setAttribute(_0x184539, _0x56075d) {
          this.attributes = { ...(this.attributes || {}), [_0x184539]: String(_0x56075d || '') };
        },
        removeAttribute(_0x4596dd) {
          delete this.attributes?.[_0x4596dd];
        },
      };
    _0x35700f.classList = makeClassList(_0x35700f);
    const _0x1172a3 = Object.assign(Object.create(_0x1366b9), {
      nodeId: _0x3c8966,
      _data: _0x5c75e7.nodes[_0x3c8966],
      promptEl: { innerText: 'prompt', querySelectorAll: () => [] },
      btnEl: _0x35700f,
      _isGenerating: false,
      _rhCancelInFlight: false,
      _isDreaminaVideoNode: () => true,
      _isRunninghubWorkflowModel: () => false,
      _syncDreaminaTaskState: () => ({
        nodeData: _0x5c75e7.nodes[_0x3c8966],
        summary: { imageCount: 1, videoCount: 0, audioCount: 0 },
        resolvedTaskType: 'multimodal2video',
        routeMode: 'multimodal2video',
      }),
    });
    (_0x1366b9._updateSubmitButtonState.call(_0x1172a3),
      assert.equal(_0x1172a3.btnEl.disabled, true),
      assert.equal(_0x1172a3.btnEl.style.cursor, 'var(--unavailable-cursor)'),
      assert.equal(_0x1172a3.btnEl.classList.contains('is-task-cancel'), false));
  }));
