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
  const value = {
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [
        { localPath: 'output/dreamina-video.mp4', thumbUrl: '/output/VideoThumbs/dreamina-video.jpg' },
      ],
    },
    item = __videoReferenceInputTest.getVideoThumbCandidate(value, {
      sourceMediaKey: 'output/dreamina-video.mp4',
    });
  assert.equal(item.thumbUrl, '/output/VideoThumbs/dreamina-video.jpg');
}),
  test('video reference input: sourceMediaKey 指向多视频非主项时不误用顶层缩略图', () => {
    const key = {
        type: 'ai-video',
        mainVideoIndex: 0,
        thumbUrl: '/output/VideoThumbs/main.jpg',
        videos: [
          { localPath: 'output/main.mp4', thumbUrl: '/output/VideoThumbs/main.jpg' },
          { localPath: 'output/second.mp4', thumbUrl: '/output/VideoThumbs/second.jpg' },
        ],
      },
      index = __videoReferenceInputTest.getVideoThumbCandidate(key, {
        sourceMediaKey: 'output/second.mp4',
      });
    assert.equal(index.thumbUrl, '/output/VideoThumbs/second.jpg');
  }),
  test('video reference input: 缩略图缺失时按选中视频项返回可回填路径', () => {
    const result = {
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [
          { localPath: 'output/main.mp4', thumbUrl: '/output/VideoThumbs/main.jpg' },
          { localPath: 'output/second.mp4' },
        ],
      },
      data = __videoReferenceInputTest.getVideoThumbCandidate(result, {
        sourceMediaKey: 'output/second.mp4',
      }),
      options = __videoReferenceInputTest.getVideoSourcePathForThumb(result, {
        sourceMediaKey: 'output/second.mp4',
      });
    (assert.equal(data.thumbUrl, ''), assert.equal(options, '/output/second.mp4'));
  }),
  test('video reference input: display local paths can resolve fallback video refs', () => {
    const target = { type: 'source-video', displayLocalPath: 'data/assets/display.mp4' };
    (assert.equal(
      __videoReferenceInputTest.getVideoSourcePathForThumb(target, {}),
      '/data/assets/display.mp4',
    ),
      assert.equal(
        __videoReferenceInputTest.getVideoRefMediaSignature(target, {}),
        'data/assets/display.mp4',
      ));
  }),
  test('video reference input: 来源状态签名随 videos 缩略图变化', () => {
    const proto = createProto(),
      source = {
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [{ localPath: 'output/dreamina-video.mp4' }],
      },
      next = {
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [
          { localPath: 'output/dreamina-video.mp4', thumbUrl: '/output/VideoThumbs/dreamina-video.jpg' },
        ],
      };
    assert.notEqual(proto._getRefSourceStateKey(source), proto._getRefSourceStateKey(next));
  }),
  test('video reference input: 来源状态签名随视频元数据变化', () => {
    const proto2 = createProto(),
      args = { type: 'source-video', localPath: 'output/CutVideo/cut.mp4' },
      current = { ...args, videoFrameCount: 59, videoDuration: 2.46, videoFps: 24 };
    assert.notEqual(proto2._getRefSourceStateKey(args), proto2._getRefSourceStateKey(current));
  }),
  test('video reference input: 来源状态签名忽略任务轮询状态', () => {
    const proto3 = createProto(),
      args2 = {
        type: 'ai-video',
        _bizRev: 12,
        mainVideoIndex: 0,
        rhTaskStatus: 'running',
        dreaminaTaskLastCheckedAt: 1710000000000,
        videos: [
          { localPath: 'output/dreamina-video.mp4', thumbUrl: '/output/VideoThumbs/dreamina-video.jpg' },
        ],
      },
      args3 = {
        ...args2,
        _bizRev: 19,
        rhTaskStatus: 'pending',
        dreaminaTaskLastCheckedAt: 1710000020000,
      },
      entry = {
        ...args3,
        videos: [
          { localPath: 'output/dreamina-video.mp4', thumbUrl: '/output/VideoThumbs/dreamina-video-new.jpg' },
        ],
      };
    (assert.equal(proto3._getRefSourceStateKey(args2), proto3._getRefSourceStateKey(args3)),
      assert.notEqual(proto3._getRefSourceStateKey(args2), proto3._getRefSourceStateKey(entry)));
  }),
  test('video reference input: text/audio fallback thumbnails use shared blue labels', () => {
    const referenceFallbackThumbHtml = createReferenceFallbackThumbHtml('text'),
      referenceFallbackThumbHtml2 = createReferenceFallbackThumbHtml('audio'),
      record = __videoReferenceInputTest.createRunningHubAudioFallbackThumbHtml();
    (assert.match(
      referenceFallbackThumbHtml,
      /class="[^"]*\bref-thumb-media\b[^"]*\bref-thumb-fallback\b[^"]*"/,
    ),
      assert.match(referenceFallbackThumbHtml, />TEXT<\/div>/),
      assert.doesNotMatch(referenceFallbackThumbHtml, /<svg|style=/),
      assert.match(
        referenceFallbackThumbHtml2,
        /class="[^"]*\bref-thumb-media\b[^"]*\bref-thumb-fallback\b[^"]*"/,
      ),
      assert.match(referenceFallbackThumbHtml2, />AUDIO<\/div>/),
      assert.doesNotMatch(referenceFallbackThumbHtml2, /<svg|style=/),
      assert.match(
        record,
        /class="[^"]*\bref-thumb-media\b[^"]*\brh-v5-ref-media-fallback\b[^"]*\bref-thumb-fallback\b[^"]*"/,
      ),
      assert.match(record, />AUDIO<\/div>/),
      assert.doesNotMatch(record, /<svg|style=/));
  }));
function makeAssetPill({ assetId: assetId2, assetIndex: assetIndex, type: type, label: label = '@asset' }) {
  return {
    dataset: {
      refOrigin: 'asset',
      assetId: assetId2,
      assetIndex: String(assetIndex),
      refType: type,
      label: label,
    },
    classList: {
      contains(payload) {
        return payload === 'ref-pill';
      },
    },
    textContent: label,
  };
}
function makePromptEl(innerText = []) {
  return {
    innerText: innerText.map((el) => el.textContent || '').join(' '),
    querySelectorAll(handle) {
      return handle === '.ref-pill' ? innerText : [];
    },
  };
}
(test('video reference input: V5 源视频帧数优先显示真实 videoFrameCount', () => {
  const state = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
    inEdges: [{ id: 'e-source', sourceId: 'source-video', refSlot: 'sourceVideo' }],
    nodes: { 'source-video': { type: 'source-video', videoFrameCount: 96, videoDuration: 10 } },
    targetFps: 24,
  });
  assert.equal(state, 96);
}),
  test('video reference input: V5 源视频缺少真实帧数时按时长兜底估算', () => {
    const config = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
      inEdges: [{ id: 'e-source', sourceId: 'source-video', refSlot: 'sourceVideo' }],
      nodes: { 'source-video': { type: 'source-video', videoDuration: 3.5 } },
      targetFps: 24,
    });
    assert.equal(config, 84);
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
    const scope = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
      nodeData: { promptAssetInputRefs: [{ assetId: 'asset-source-video', itemIndex: 0, type: 'video' }] },
      targetFps: 24,
    });
    assert.equal(scope, 72);
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
    const input = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
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
    assert.equal(input, 88);
  }),
  test('video reference input: V5 源视频没有有效帧数或时长时返回空', () => {
    const output = __videoReferenceInputTest.getRhV5SourceVideoFrameCount({
      inEdges: [{ id: 'e-source', sourceId: 'source-video', refSlot: 'sourceVideo' }],
      nodes: { 'source-video': { type: 'source-video', localPath: 'data/assets/source.mp4' } },
      targetFps: 24,
    });
    assert.equal(output, null);
  }));
function makeClassList(value2) {
  return {
    contains(value3) {
      return String(value2.className || '')
        .split(/\s+/)
        .filter(Boolean)
        .includes(String(value3 || ''));
    },
    add(...list) {
      const value4 = new Set(
        String(value2.className || '')
          .split(/\s+/)
          .filter(Boolean),
      );
      (list.forEach((item2) => value4.add(String(item2 || ''))),
        (value2.className = Array.from(value4).join(' ')));
    },
    remove(...list2) {
      const map = new Set(list2.map((item3) => String(item3 || '')));
      value2.className = String(value2.className || '')
        .split(/\s+/)
        .filter((item4) => item4 && !map.has(item4))
        .join(' ');
    },
  };
}
function createFakeElement(value5 = 'div') {
  const el2 = {
    tagName: String(value5 || 'div').toUpperCase(),
    className: '',
    dataset: {},
    attributes: {},
    childNodes: [],
    parentElement: null,
    style: {},
    _innerHTML: '',
    _innerHTMLSetCount: 0,
    classList: null,
    set innerHTML(value6) {
      ((el2._innerHTMLSetCount += 1), (el2._innerHTML = String(value6 || '')), (el2.childNodes = []));
      if (el2._innerHTML.includes('rh-v5-ref-container')) {
        const fakeElement = createFakeElement('div');
        ((fakeElement.className = 'prompt-attachment-btn'), el2.appendChild(fakeElement));
        const el3 = createFakeElement('div');
        el3.className = 'ref-thumb-container rh-v5-ref-container';
        const list3 = Array.from(el2._innerHTML.matchAll(/data-slot="([^"]+)"/g)).map((item5) => item5[1]);
        (list3.forEach((item6) => {
          const el4 = createFakeElement('button');
          ((el4.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
            (el4.dataset.slot = item6),
            el3.appendChild(el4));
        }),
          el2.appendChild(el3));
      } else {
        if (el2._innerHTML.includes('ref-thumb-container')) {
          const fakeElement2 = createFakeElement('div');
          ((fakeElement2.className = 'prompt-attachment-btn'), el2.appendChild(fakeElement2));
          const fakeElement3 = createFakeElement('div');
          ((fakeElement3.className = 'ref-thumb-container'), el2.appendChild(fakeElement3));
        }
      }
    },
    get innerHTML() {
      return el2._innerHTML;
    },
    appendChild(value7) {
      if (value7.parentElement) {
        const count = value7.parentElement.childNodes.indexOf(value7);
        if (count >= 0) value7.parentElement.childNodes.splice(count, 1);
      }
      return ((value7.parentElement = el2), el2.childNodes.push(value7), value7);
    },
    insertBefore(value8, enabled) {
      if (!enabled) return el2.appendChild(value8);
      if (value8.parentElement) {
        const count2 = value8.parentElement.childNodes.indexOf(value8);
        if (count2 >= 0) value8.parentElement.childNodes.splice(count2, 1);
      }
      const count3 = el2.childNodes.indexOf(enabled);
      value8.parentElement = el2;
      if (count3 < 0) el2.childNodes.push(value8);
      else el2.childNodes.splice(count3, 0, value8);
      return value8;
    },
    remove() {
      const enabled2 = el2.parentElement;
      if (!enabled2) return;
      const count4 = enabled2.childNodes.indexOf(el2);
      if (count4 >= 0) enabled2.childNodes.splice(count4, 1);
      el2.parentElement = null;
    },
    replaceWith(value9) {
      const enabled3 = el2.parentElement;
      if (!enabled3) return;
      const count5 = enabled3.childNodes.indexOf(el2);
      if (count5 < 0) return;
      ((value9.parentElement = enabled3), (enabled3.childNodes[count5] = value9));
    },
    setAttribute(value10, value11) {
      el2.attributes[value10] = String(value11 || '');
    },
    addEventListener() {},
    querySelector(value12) {
      return el2.querySelectorAll(value12)[0] || null;
    },
    querySelectorAll(list4) {
      const list5 = [],
        handler = (el5) => {
          if (list4.startsWith('.')) return el5.classList?.contains(list4.slice(1));
          const value13 = list4.match(/^\[data-slot(?:="([^"]+)")?\]$/);
          if (value13) {
            if (!('slot' in el5.dataset)) return false;
            return value13[1] ? el5.dataset.slot === value13[1] : true;
          }
          return false;
        },
        handler2 = (value14) => {
          value14.childNodes.forEach((item7) => {
            if (handler(item7)) list5.push(item7);
            handler2(item7);
          });
        };
      return (handler2(el2), list5);
    },
  };
  return ((el2.classList = makeClassList(el2)), el2);
}
(test('video reference input: HappyHorse mode change refreshes visible fixed slots', async () => {
  const value15 = globalThis.document;
  globalThis.document = { createElement: createFakeElement };
  try {
    const id = 'node-happyhorse',
      _data = {
        nodes: {
          [id]: {
            id: id,
            type: 'ai-video',
            model: 'apimart/happyhorse-1.0',
            provider: 'apimart',
            generationParams: { happyhorse_mode: 'image' },
          },
        },
      },
      videoNodeReferenceInputModule = createVideoNodeReferenceInputModule({
        store: { getState: () => _data, getIncomingEdges: () => [] },
        api: {},
        _syncPillLabels: () => {},
        getImage: async () => null,
        ensureThumbDecoded: () => {},
        revealRefThumbMedia: () => {},
      }),
      value16 = Object.assign(Object.create(videoNodeReferenceInputModule), {
        nodeId: id,
        _data: _data.nodes[id],
        refBarEl: createFakeElement('div'),
        promptEl: makePromptEl(),
        _fixedSlotRefThumbObjectUrls: new Map(),
        _videoThumbPending: new Set(),
        _isRunninghubWorkflowModel: () => false,
        _resolveMediaUrl: (value17) => String(value17 || ''),
        _syncBtnIconState: () => {},
      });
    await videoNodeReferenceInputModule._renderRefBarImpl.call(value16);
    let el6 = value16.refBarEl.querySelector('.rh-v5-ref-container');
    (assert.ok(el6.querySelector('[data-slot="firstFrame"]')),
      assert.equal(el6.querySelector('[data-slot="lastFrame"]'), null),
      assert.equal(el6.querySelector('[data-slot="referenceImage"]'), null),
      (_data.nodes[id] = {
        ..._data.nodes[id],
        generationParams: { happyhorse_mode: 'reference' },
      }),
      await videoNodeReferenceInputModule._renderRefBarImpl.call(value16),
      (el6 = value16.refBarEl.querySelector('.rh-v5-ref-container')),
      assert.equal(el6.querySelector('[data-slot="firstFrame"]'), null),
      assert.ok(el6.querySelector('[data-slot="referenceImage"]')));
  } finally {
    if (typeof value15 === 'undefined') delete globalThis.document;
    else globalThis.document = value15;
  }
}),
  test('video reference input: Hailuo 2.3 refreshes stale last-frame refbar slot', async () => {
    const value18 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id2 = 'node-hailuo-23',
        _data2 = {
          nodes: {
            [id2]: {
              id: id2,
              type: 'ai-video',
              model: 'apimart/minimax-hailuo-2.3',
              provider: 'apimart',
              generationParams: { mode: 'fast' },
            },
          },
        },
        videoNodeReferenceInputModule2 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data2, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value19 = Object.assign(Object.create(videoNodeReferenceInputModule2), {
          nodeId: id2,
          _data: _data2.nodes[id2],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _refBarLayoutKey: 'fixed',
          _resolveMediaUrl: (value20) => String(value20 || ''),
          _syncBtnIconState: () => {},
        });
      value19.refBarEl.innerHTML = [
        '<div class="prompt-attachment-btn"></div>',
        '<div class="ref-thumb-container rh-v5-ref-container">',
        '<button data-slot="firstFrame"></button>',
        '<button data-slot="lastFrame"></button>',
        '</div>',
      ].join('');
      const value21 = value19.refBarEl._innerHTMLSetCount;
      await videoNodeReferenceInputModule2._renderRefBarImpl.call(value19);
      const el7 = value19.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.equal(value19.refBarEl._innerHTMLSetCount, value21),
        assert.deepEqual(
          Array.from(el7.querySelectorAll('[data-slot]')).map((el8) => el8.dataset.slot),
          ['firstFrame'],
        ),
        assert.ok(el7.querySelector('[data-slot="firstFrame"]')),
        assert.equal(el7.querySelector('[data-slot="lastFrame"]'), null));
    } finally {
      if (typeof value18 === 'undefined') delete globalThis.document;
      else globalThis.document = value18;
    }
  }),
  test('video reference input: Wan2.7 mode change refreshes fixed slots', async () => {
    const value22 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id3 = 'node-wan27',
        _data3 = {
          nodes: {
            [id3]: {
              id: id3,
              type: 'ai-video',
              model: 'apimart/wan2.7',
              provider: 'apimart',
              generationParams: { wan27_mode: 'image' },
            },
          },
        },
        videoNodeReferenceInputModule3 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data3, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value23 = Object.assign(Object.create(videoNodeReferenceInputModule3), {
          nodeId: id3,
          _data: _data3.nodes[id3],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (value24) => String(value24 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule3._renderRefBarImpl.call(value23);
      let el9 = value23.refBarEl.querySelector('.rh-v5-ref-container');
      const value25 = value23.refBarEl._innerHTMLSetCount;
      (assert.deepEqual(
        Array.from(el9.querySelectorAll('[data-slot]')).map((el10) => el10.dataset.slot),
        ['firstFrame', 'lastFrame', 'audio'],
      ),
        assert.ok(el9.querySelector('[data-slot="firstFrame"]')),
        assert.ok(el9.querySelector('[data-slot="lastFrame"]')),
        assert.ok(el9.querySelector('[data-slot="audio"]')),
        assert.equal(el9.querySelector('[data-slot="sourceVideo"]'), null),
        (_data3.nodes[id3] = {
          ..._data3.nodes[id3],
          generationParams: { wan27_mode: 'video' },
        }),
        await videoNodeReferenceInputModule3._renderRefBarImpl.call(value23),
        (el9 = value23.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(value23.refBarEl._innerHTMLSetCount, value25),
        assert.deepEqual(
          Array.from(el9.querySelectorAll('[data-slot]')).map((el11) => el11.dataset.slot),
          ['sourceVideo'],
        ),
        assert.equal(el9.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(el9.querySelector('[data-slot="audio"]'), null),
        assert.ok(el9.querySelector('[data-slot="sourceVideo"]')),
        (value23.refBarEl.innerHTML = [
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
      const value26 = value23.refBarEl._innerHTMLSetCount;
      (await videoNodeReferenceInputModule3._renderRefBarImpl.call(value23),
        (el9 = value23.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(value23.refBarEl._innerHTMLSetCount, value26),
        assert.deepEqual(
          Array.from(el9.querySelectorAll('[data-slot]')).map((el12) => el12.dataset.slot),
          ['sourceVideo'],
        ),
        assert.equal(el9.querySelector('[data-slot="lastFrame"]'), null),
        assert.equal(el9.querySelector('[data-slot="referenceImage"]'), null),
        assert.equal(el9.querySelector('[data-slot="originalVideo"]'), null),
        assert.equal(el9.querySelector('[data-slot="referenceVideo"]'), null),
        assert.equal(el9.querySelector('[data-slot="audio"]'), null),
        assert.equal(el9.querySelector('[data-slot="referenceAudio"]'), null));
      const value27 = value23.refBarEl._innerHTMLSetCount;
      ((_data3.nodes[id3] = {
        ..._data3.nodes[id3],
        generationParams: { wan27_mode: 'reference' },
      }),
        (value23._data = _data3.nodes[id3]));
      const fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(_data3.nodes[id3]);
      (assert.deepEqual(fixedInputSlotConfigFromManifest?.visibleSlots, [
        'referenceImage',
        'referenceVideo',
        'referenceAudio',
      ]),
        assert.ok(fixedInputSlotConfigFromManifest?.fixedSlots?.some((item8) => item8.id === 'firstFrame')),
        assert.ok(fixedInputSlotConfigFromManifest?.slotById?.firstFrame),
        await videoNodeReferenceInputModule3._renderRefBarImpl.call(value23),
        (el9 = value23.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(value23.refBarEl._innerHTMLSetCount, value27),
        assert.deepEqual(
          Array.from(el9.querySelectorAll('[data-slot]')).map((el13) => el13.dataset.slot),
          ['referenceImage', 'referenceVideo', 'referenceAudio'],
        ),
        assert.equal(el9.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(el9.querySelector('[data-slot="lastFrame"]'), null),
        assert.ok(el9.querySelector('[data-slot="referenceAudio"]')),
        assert.equal(el9.querySelector('[data-slot="sourceVideo"]'), null),
        assert.ok(el9.querySelector('[data-slot="referenceVideo"]')),
        assert.equal(el9.querySelector('[data-slot="originalVideo"]'), null),
        assert.ok(el9.querySelector('[data-slot="referenceImage"]')));
      const value28 = value23.refBarEl._innerHTMLSetCount;
      ((_data3.nodes[id3] = {
        ..._data3.nodes[id3],
        generationParams: { wan27_mode: 'edit' },
      }),
        (value23._data = _data3.nodes[id3]),
        await videoNodeReferenceInputModule3._renderRefBarImpl.call(value23),
        (el9 = value23.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(value23.refBarEl._innerHTMLSetCount, value28),
        assert.deepEqual(
          Array.from(el9.querySelectorAll('[data-slot]')).map((el14) => el14.dataset.slot),
          ['originalVideo', 'referenceVideo'],
        ),
        assert.equal(el9.querySelector('[data-slot="referenceImage"]'), null),
        assert.ok(el9.querySelector('[data-slot="originalVideo"]')),
        assert.ok(el9.querySelector('[data-slot="referenceVideo"]')),
        (_data3.nodes[id3] = {
          ..._data3.nodes[id3],
          model: 'wan2.7',
          generationParams: { wan27_mode: 'image' },
        }),
        (value23._data = _data3.nodes[id3]),
        await videoNodeReferenceInputModule3._renderRefBarImpl.call(value23),
        (el9 = value23.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.ok(el9.querySelector('[data-slot="firstFrame"]')),
        assert.ok(el9.querySelector('[data-slot="lastFrame"]')),
        assert.ok(el9.querySelector('[data-slot="audio"]')),
        assert.equal(el9.querySelector('[data-slot="sourceVideo"]'), null),
        (_data3.nodes[id3] = {
          ..._data3.nodes[id3],
          model: 'apimart/wan2.7',
          provider: 'apimartr',
          generationParams: { wan27_mode: 'video' },
        }),
        (value23._data = _data3.nodes[id3]),
        await videoNodeReferenceInputModule3._renderRefBarImpl.call(value23),
        (el9 = value23.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(el9.querySelector('[data-slot="firstFrame"]'), null),
        assert.ok(el9.querySelector('[data-slot="sourceVideo"]')));
    } finally {
      if (typeof value22 === 'undefined') delete globalThis.document;
      else globalThis.document = value22;
    }
  }),
  test('video reference input: Kling V3 Omni mode change refreshes fixed slots', async () => {
    const value29 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id4 = 'node-kling-v3-omni',
        _data4 = {
          nodes: {
            [id4]: {
              id: id4,
              type: 'ai-video',
              model: 'apimart/kling-v3-omni',
              provider: 'apimart',
              generationParams: { kling_v3_omni_mode: 'image' },
            },
          },
        },
        videoNodeReferenceInputModule4 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data4, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value30 = Object.assign(Object.create(videoNodeReferenceInputModule4), {
          nodeId: id4,
          _data: _data4.nodes[id4],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (value31) => String(value31 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule4._renderRefBarImpl.call(value30);
      let el15 = value30.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.deepEqual(
        Array.from(el15.querySelectorAll('[data-slot]')).map((el16) => el16.dataset.slot),
        ['firstFrame', 'lastFrame'],
      ),
        assert.ok(el15.querySelector('[data-slot="firstFrame"]')),
        assert.ok(el15.querySelector('[data-slot="lastFrame"]')));
      const value32 = value30.refBarEl._innerHTMLSetCount;
      ((_data4.nodes[id4] = {
        ..._data4.nodes[id4],
        generationParams: { kling_v3_omni_mode: 'reference' },
      }),
        (value30._data = _data4.nodes[id4]),
        await videoNodeReferenceInputModule4._renderRefBarImpl.call(value30),
        (el15 = value30.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(value30.refBarEl._innerHTMLSetCount, value32),
        assert.deepEqual(
          Array.from(el15.querySelectorAll('[data-slot]')).map((el17) => el17.dataset.slot),
          ['referenceImage', 'referenceVideo'],
        ),
        assert.equal(el15.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(el15.querySelector('[data-slot="lastFrame"]'), null),
        assert.ok(el15.querySelector('[data-slot="referenceImage"]')),
        assert.ok(el15.querySelector('[data-slot="referenceVideo"]')));
      const value33 = value30.refBarEl._innerHTMLSetCount;
      ((_data4.nodes[id4] = {
        ..._data4.nodes[id4],
        generationParams: { kling_v3_omni_mode: 'edit' },
      }),
        (value30._data = _data4.nodes[id4]),
        await videoNodeReferenceInputModule4._renderRefBarImpl.call(value30),
        (el15 = value30.refBarEl.querySelector('.rh-v5-ref-container')),
        assert.equal(value30.refBarEl._innerHTMLSetCount, value33),
        assert.deepEqual(
          Array.from(el15.querySelectorAll('[data-slot]')).map((el18) => el18.dataset.slot),
          ['editVideo'],
        ),
        assert.equal(el15.querySelector('[data-slot="referenceImage"]'), null),
        assert.equal(el15.querySelector('[data-slot="referenceVideo"]'), null),
        assert.ok(el15.querySelector('[data-slot="editVideo"]')));
    } finally {
      if (typeof value29 === 'undefined') delete globalThis.document;
      else globalThis.document = value29;
    }
  }),
  test('video reference input: Kling O1 renders fixed reference slots', async () => {
    const value34 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id5 = 'node-kling-o1',
        _data5 = {
          nodes: {
            [id5]: {
              id: id5,
              type: 'ai-video',
              model: 'apimart/kling-video-o1',
              provider: 'apimart',
            },
          },
        },
        videoNodeReferenceInputModule5 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data5, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value35 = Object.assign(Object.create(videoNodeReferenceInputModule5), {
          nodeId: id5,
          _data: _data5.nodes[id5],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (value36) => String(value36 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule5._renderRefBarImpl.call(value35);
      const el19 = value35.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.deepEqual(
        Array.from(el19.querySelectorAll('[data-slot]')).map((el20) => el20.dataset.slot),
        ['editVideo', 'featureReferenceVideo', 'referenceImage'],
      ),
        assert.ok(el19.querySelector('[data-slot="editVideo"]')),
        assert.ok(el19.querySelector('[data-slot="featureReferenceVideo"]')),
        assert.ok(el19.querySelector('[data-slot="referenceImage"]')));
    } finally {
      if (typeof value34 === 'undefined') delete globalThis.document;
      else globalThis.document = value34;
    }
  }),
  test('video reference input: RunningHub Kling O1 reference mode puts video slot first', async () => {
    const value37 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id6 = 'node-runninghub-kling-o1',
        _data6 = {
          nodes: {
            [id6]: {
              id: id6,
              type: 'ai-video',
              model: 'runninghub-model/kling-video-o1',
              provider: 'runninghub',
              generationParams: { rh_kling_o1_generation_mode: 'reference' },
            },
          },
        },
        videoNodeReferenceInputModule6 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data6, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value38 = Object.assign(Object.create(videoNodeReferenceInputModule6), {
          nodeId: id6,
          _data: _data6.nodes[id6],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (value39) => String(value39 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule6._renderRefBarImpl.call(value38);
      const el21 = value38.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.deepEqual(
        Array.from(el21.querySelectorAll('[data-slot]')).map((el22) => el22.dataset.slot),
        ['referenceVideo', 'referenceImage'],
      ),
        assert.ok(el21.querySelector('[data-slot="referenceVideo"]')),
        assert.ok(el21.querySelector('[data-slot="referenceImage"]')));
    } finally {
      if (typeof value37 === 'undefined') delete globalThis.document;
      else globalThis.document = value37;
    }
  }),
  test('video reference input: RunningHub Kling O3 reference mode puts video slot first', async () => {
    const value40 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id7 = 'node-runninghub-kling-o3',
        _data7 = {
          nodes: {
            [id7]: {
              id: id7,
              type: 'ai-video',
              model: 'runninghub-model/kling-o3',
              provider: 'runninghub',
              generationParams: { kling_v3_omni_mode: 'reference' },
            },
          },
        },
        videoNodeReferenceInputModule7 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data7, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value41 = Object.assign(Object.create(videoNodeReferenceInputModule7), {
          nodeId: id7,
          _data: _data7.nodes[id7],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (value42) => String(value42 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule7._renderRefBarImpl.call(value41);
      const el23 = value41.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.deepEqual(
        Array.from(el23.querySelectorAll('[data-slot]')).map((el24) => el24.dataset.slot),
        ['referenceVideo', 'referenceImage'],
      ),
        assert.ok(el23.querySelector('[data-slot="referenceVideo"]')),
        assert.ok(el23.querySelector('[data-slot="referenceImage"]')));
    } finally {
      if (typeof value40 === 'undefined') delete globalThis.document;
      else globalThis.document = value40;
    }
  }),
  test('video reference input: RunningHub Seedance 2.0 switches route slots', () => {
    const fixedInputSlotConfigFromManifest2 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/seedance-2.0',
      provider: 'runninghub',
      generationParams: { rh_seedance_2_mode: 'text2video' },
    });
    assert.deepEqual(fixedInputSlotConfigFromManifest2?.visibleSlots || [], []);
    const fixedInputSlotConfigFromManifest3 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/seedance-2.0',
      provider: 'runninghub',
      generationParams: { rh_seedance_2_mode: 'image2video' },
    });
    assert.deepEqual(fixedInputSlotConfigFromManifest3?.visibleSlots, ['firstFrame']);
    const fixedInputSlotConfigFromManifest4 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/seedance-2.0',
      provider: 'runninghub',
      generationParams: { rh_seedance_2_mode: 'frames2video' },
    });
    assert.deepEqual(fixedInputSlotConfigFromManifest4?.visibleSlots, ['firstFrame', 'lastFrame']);
    const fixedInputSlotConfigFromManifest5 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/seedance-2.0',
      provider: 'runninghub',
      generationParams: { rh_seedance_2_mode: 'multimodal2video' },
    });
    (assert.deepEqual(fixedInputSlotConfigFromManifest5?.visibleSlots, [
      'referenceVideo',
      'referenceImage',
      'referenceAudio',
    ]),
      assert.equal(fixedInputSlotConfigFromManifest5?.slotById?.referenceVideo?.kind, 'video'),
      assert.equal(fixedInputSlotConfigFromManifest5?.slotById?.referenceImage?.kind, 'image'),
      assert.equal(fixedInputSlotConfigFromManifest5?.slotById?.referenceAudio?.kind, 'audio'));
  }),
  test('video reference input: Volcengine Seedance 2.0 reuses Dreamina generic refbar', () => {
    const fixedInputSlotConfigFromManifest6 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'volcengine/seedance-2.0-fast',
      provider: 'volcengine',
      generationParams: { dreaminaRouteMode: 'multimodal2video' },
    });
    assert.equal(fixedInputSlotConfigFromManifest6, null);
    const fixedInputSlotConfigFromManifest7 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'volcengine/seedance-2.0-fast',
      provider: 'volcengine',
      generationParams: { dreaminaRouteMode: 'frames2video' },
    });
    assert.equal(fixedInputSlotConfigFromManifest7, null);
  }),
  test('video reference input: Agnes Video uses fixed slots only in first-last-frame mode', () => {
    const fixedInputSlotConfigFromManifest8 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'agnes/agnes-video-v2.0',
      provider: 'agnes',
    });
    assert.equal(fixedInputSlotConfigFromManifest8, null);
    const fixedInputSlotConfigFromManifest9 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'agnes/agnes-video-v2.0',
      provider: 'agnes',
      generationParams: { agnes_video_mode: 'reference' },
    });
    assert.equal(fixedInputSlotConfigFromManifest9, null);
    const fixedInputSlotConfigFromManifest10 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'agnes/agnes-video-v2.0',
      provider: 'agnes',
      generationParams: { agnes_video_mode: 'keyframes' },
    });
    (assert.deepEqual(fixedInputSlotConfigFromManifest10?.visibleSlots, ['firstFrame', 'lastFrame']),
      assert.equal(fixedInputSlotConfigFromManifest10?.slotById?.firstFrame?.required, true),
      assert.equal(fixedInputSlotConfigFromManifest10?.slotById?.lastFrame?.required, false));
  }),
  test('video submit button: Agnes keyframes mode enables with first frame only', () => {
    const id8 = 'node-agnes-keyframes-first-only-submit',
      id9 = 'node-agnes-first-frame',
      id10 = 'node-agnes-last-frame',
      _data8 = {
        nodes: {
          [id8]: {
            id: id8,
            type: 'ai-video',
            model: 'agnes/agnes-video-v2.0',
            provider: 'agnes',
            generationParams: { agnes_video_mode: 'keyframes' },
          },
          [id9]: {
            id: id9,
            type: 'source-image',
            originalLocalPath: 'data/assets/agnes-first.png',
          },
          [id10]: {
            id: id10,
            type: 'source-image',
            originalLocalPath: 'data/assets/agnes-last.png',
          },
        },
      },
      handler3 = (value43) =>
        createVideoNodeParameterPanelModule({
          store: { getState: () => _data8, getIncomingEdges: () => value43 },
          api: {},
          getDisplayModelName: () => '',
          PROVIDERS_META: {},
          getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
          getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
          activateMenuKeyboard: () => {},
          isVideoVipModel: () => false,
        }),
      handler4 = (value44) =>
        Object.assign(Object.create(value44), {
          nodeId: id8,
          _data: _data8.nodes[id8],
          promptEl: makePromptEl([]),
          btnEl: { disabled: true, style: {} },
          _isGenerating: false,
          _isDreaminaVideoNode: () => false,
          _isRunninghubWorkflowModel: () => false,
        }),
      value45 = [{ id: 'edge-agnes-first-only', sourceId: id9, targetId: id8, refSlot: 'firstFrame' }],
      value46 = handler3(value45),
      value47 = handler4(value46);
    (value46._updateSubmitButtonState.call(value47),
      assert.equal(value47.btnEl.disabled, false),
      assert.equal(value47.btnEl.style.cursor, ''));
    const value48 = [{ id: 'edge-agnes-last-only', sourceId: id10, targetId: id8, refSlot: 'lastFrame' }],
      value49 = handler3(value48),
      value50 = handler4(value49);
    (value49._updateSubmitButtonState.call(value50),
      assert.equal(value50.btnEl.disabled, true),
      assert.equal(value50.btnEl.style.cursor, 'var(--unavailable-cursor)'));
  }),
  test('video reference input: APIMart fixed slots ignore stale RunningHub visibility flags', () => {
    const value51 = [{ rhSpecialMode: 'cameraMove' }, { rhSubtractSubject: true }];
    for (const args4 of value51) {
      const fixedInputSlotConfigFromManifest11 = getFixedInputSlotConfigFromManifest({
        type: 'ai-video',
        model: 'apimart/veo3-fast',
        provider: 'apimart',
        generationParams: { mode: 'fast', generation_type: 'frame' },
        ...args4,
      });
      assert.deepEqual(fixedInputSlotConfigFromManifest11?.visibleSlots, ['firstFrame', 'lastFrame']);
      const fixedInputSlotConfigFromManifest12 = getFixedInputSlotConfigFromManifest({
        type: 'ai-video',
        model: 'apimart/minimax-hailuo',
        provider: 'apimart',
        generationParams: {},
        ...args4,
      });
      assert.deepEqual(fixedInputSlotConfigFromManifest12?.visibleSlots, ['firstFrame', 'lastFrame']);
      const fixedInputSlotConfigFromManifest13 = getFixedInputSlotConfigFromManifest({
        type: 'ai-video',
        model: 'apimart/minimax-hailuo-2.3',
        provider: 'apimart',
        generationParams: { mode: 'fast' },
        ...args4,
      });
      assert.deepEqual(fixedInputSlotConfigFromManifest13?.visibleSlots, ['firstFrame']);
    }
  }),
  test('video reference input: RunningHub Hailuo 02 hides tail frame outside standard mode', () => {
    const fixedInputSlotConfigFromManifest14 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/hailuo-02',
      provider: 'runninghub',
      generationParams: { rh_hailuo_02_quality: 'standard' },
    });
    assert.deepEqual(fixedInputSlotConfigFromManifest14?.visibleSlots, ['firstFrame', 'lastFrame']);
    const fixedInputSlotConfigFromManifest15 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/hailuo-02',
      provider: 'runninghub',
      generationParams: { rh_hailuo_02_quality: 'pro' },
    });
    assert.deepEqual(fixedInputSlotConfigFromManifest15?.visibleSlots, ['firstFrame']);
    const fixedInputSlotConfigFromManifest16 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'runninghub-model/hailuo-02',
      provider: 'runninghub',
      generationParams: { rh_hailuo_02_quality: 'fast' },
    });
    assert.deepEqual(fixedInputSlotConfigFromManifest16?.visibleSlots, ['firstFrame']);
  }),
  test('video reference input: RunningHub Hailuo 2.3 only exposes first-frame slot', () => {
    for (const rh_hailuo_23_quality of ['standard', 'pro', 'fast', 'fastPro']) {
      const fixedInputSlotConfigFromManifest17 = getFixedInputSlotConfigFromManifest({
        type: 'ai-video',
        model: 'runninghub-model/hailuo-2.3',
        provider: 'runninghub',
        generationParams: { rh_hailuo_23_quality: rh_hailuo_23_quality },
      });
      assert.deepEqual(fixedInputSlotConfigFromManifest17?.visibleSlots, ['firstFrame']);
    }
  }),
  test('video reference input: VEO3 reference mode does not use fixed slots', () => {
    const fixedInputSlotConfigFromManifest18 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'apimart/veo3-fast',
      provider: 'apimart',
      generationParams: { mode: 'fast', generation_type: 'frame' },
    });
    assert.deepEqual(fixedInputSlotConfigFromManifest18?.visibleSlots, ['firstFrame', 'lastFrame']);
    const fixedInputSlotConfigFromManifest19 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'apimart/veo3-fast',
      provider: 'apimart',
      generationParams: { mode: 'fast', generation_type: 'reference' },
    });
    assert.equal(fixedInputSlotConfigFromManifest19, null);
  }),
  test('video reference input: Vidu Q3 hides fixed slots in reference mode', () => {
    const fixedInputSlotConfigFromManifest20 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'apimart/viduq3',
      provider: 'apimart',
      generationParams: { vidu_q3_generation_mode: 'video', mode: 'viduq3-turbo' },
    });
    assert.deepEqual(fixedInputSlotConfigFromManifest20?.visibleSlots, ['firstFrame', 'lastFrame']);
    const fixedInputSlotConfigFromManifest21 = getFixedInputSlotConfigFromManifest({
      type: 'ai-video',
      model: 'apimart/viduq3',
      provider: 'apimart',
      generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3' },
    });
    assert.equal(fixedInputSlotConfigFromManifest21, null);
  }),
  test('video reference input: manifest fixed-slot overflow media shows in refbar', async () => {
    const value52 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id11 = 'node-happyhorse-reference',
        _data9 = {
          nodes: {
            [id11]: {
              id: id11,
              type: 'ai-video',
              model: 'apimart/happyhorse-1.0',
              provider: 'apimart',
              generationParams: { happyhorse_mode: 'reference' },
            },
            img1: { id: 'img1', type: 'source-image', localPath: 'data/assets/hh-ref-1.png' },
            img2: { id: 'img2', type: 'source-image', localPath: 'data/assets/hh-ref-2.png' },
          },
        },
        value53 = [
          { id: 'edge-img1', sourceId: 'img1', targetId: id11, refSlot: 'referenceImage' },
          { id: 'edge-img2', sourceId: 'img2', targetId: id11 },
        ],
        videoNodeReferenceInputModule8 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data9, getIncomingEdges: () => value53 },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value54 = Object.assign(Object.create(videoNodeReferenceInputModule8), {
          nodeId: id11,
          _data: _data9.nodes[id11],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (value55) => String(value55 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule8._renderRefBarImpl.call(value54);
      const el25 = value54.refBarEl.querySelector('.rh-v5-ref-container'),
        el26 = el25.querySelector('[data-slot="referenceImage"]'),
        list6 = el25.querySelectorAll('.rh-fixed-extra-ref');
      (assert.equal(el26.dataset.sourceId, 'img1'),
        assert.ok(
          list6.some((el27) => el27.dataset.sourceId === 'img2'),
          'second reference image should render as an extra thumbnail',
        ));
    } finally {
      if (typeof value52 === 'undefined') delete globalThis.document;
      else globalThis.document = value52;
    }
  }),
  test('video reference input: stale refSlot from previous model fills current modelApi slot', async () => {
    const value56 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id12 = 'node-veo3-stale-refslot',
        _data10 = {
          nodes: {
            [id12]: {
              id: id12,
              type: 'ai-video',
              model: 'apimart/veo3-fast',
              provider: 'apimart',
              generationParams: { mode: 'fast', generation_type: 'frame' },
            },
            img1: { id: 'img1', type: 'source-image', localPath: 'data/assets/old-ref.png' },
          },
        },
        value57 = [{ id: 'edge-stale-ref', sourceId: 'img1', targetId: id12, refSlot: 'refImage' }],
        videoNodeReferenceInputModule9 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data10, getIncomingEdges: () => value57 },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value58 = Object.assign(Object.create(videoNodeReferenceInputModule9), {
          nodeId: id12,
          _data: _data10.nodes[id12],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (value59) => String(value59 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule9._renderRefBarImpl.call(value58);
      const el28 = value58.refBarEl.querySelector('.rh-v5-ref-container'),
        el29 = el28.querySelector('[data-slot="firstFrame"]'),
        el30 = el28.querySelector('[data-slot="lastFrame"]');
      (assert.equal(el29.dataset.edgeId, 'edge-stale-ref'),
        assert.equal(el29.dataset.sourceId, 'img1'),
        assert.equal(el30.dataset.refOrigin, ''));
    } finally {
      if (typeof value56 === 'undefined') delete globalThis.document;
      else globalThis.document = value56;
    }
  }),
  test('video reference input: V5.4 asset mentions render as virtual fixed-slot thumbnails', async () => {
    const value60 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id13 = 'node-v54-assets',
        _data11 = {
          nodes: {
            [id13]: {
              id: id13,
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
      const videoNodeReferenceInputModule10 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data11, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value61 = Object.assign(Object.create(videoNodeReferenceInputModule10), {
          nodeId: id13,
          _data: _data11.nodes[id13],
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
          _resolveMediaUrl: (value62) => String(value62 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule10._renderRefBarImpl.call(value61);
      const el31 = value61.refBarEl.querySelector('.rh-v5-ref-container'),
        el32 = el31.querySelector('[data-slot="sourceVideo"]'),
        el33 = el31.querySelector('[data-slot="videoMask"]'),
        el34 = el31.querySelector('[data-slot="refImage"]'),
        el35 = el31.querySelector('[data-slot="firstFrame"]');
      (assert.equal(el32.dataset.refOrigin, 'asset'),
        assert.equal(el33.dataset.refOrigin, 'asset'),
        assert.equal(el34.dataset.refOrigin, 'asset'),
        assert.equal(el35.dataset.refOrigin, 'asset'),
        assert.equal(el32.dataset.assetId, 'asset-v54'),
        assert.equal(el32.dataset.assetIndex, '0'),
        assert.equal(el32.dataset.assetOccurrence, '0'),
        assert.equal(el32.dataset.refType, 'video'),
        assert.match(el32.innerHTML, /source-thumb/),
        assert.match(el33.innerHTML, /mask-thumb/),
        assert.match(el34.innerHTML, /ref-thumb/),
        assert.match(el35.innerHTML, /first-thumb/),
        assert.match(el32.innerHTML, /ref-thumb-delete/));
    } finally {
      if (typeof value60 === 'undefined') delete globalThis.document;
      else globalThis.document = value60;
    }
  }),
  test('video reference input: V5.4 hidden asset refs render as virtual fixed-slot thumbnails', async () => {
    const value63 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id14 = 'node-v54-hidden-assets',
        _data12 = {
          nodes: {
            [id14]: {
              id: id14,
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
      const videoNodeReferenceInputModule11 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data12, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value64 = Object.assign(Object.create(videoNodeReferenceInputModule11), {
          nodeId: id14,
          _data: _data12.nodes[id14],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => true,
          _resolveMediaUrl: (value65) => String(value65 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule11._renderRefBarImpl.call(value64);
      const el36 = value64.refBarEl.querySelector('.rh-v5-ref-container'),
        el37 = el36.querySelector('[data-slot="sourceVideo"]'),
        el38 = el36.querySelector('[data-slot="refImage"]');
      (assert.equal(el37.dataset.refOrigin, 'asset'),
        assert.equal(el37.dataset.assetRefSource, 'hidden'),
        assert.equal(el37.dataset.assetId, 'asset-v54-hidden'),
        assert.equal(el37.dataset.refType, 'video'),
        assert.equal(el38.dataset.refOrigin, 'asset'),
        assert.equal(el38.dataset.assetRefSource, 'hidden'),
        assert.equal(el38.dataset.refType, 'image'),
        assert.match(el37.innerHTML, /source-thumb/),
        assert.match(el38.innerHTML, /ref-thumb/));
    } finally {
      if (typeof value63 === 'undefined') delete globalThis.document;
      else globalThis.document = value63;
    }
  }),
  test('video reference input: asset mentions render as generic thumbnails with delete', async () => {
    const value66 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id15 = 'node-generic-assets',
        _data13 = {
          nodes: {
            [id15]: { id: id15, type: 'ai-video', model: 'generic/video', provider: 'grsai' },
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
      const videoNodeReferenceInputModule12 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data13, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value67 = Object.assign(Object.create(videoNodeReferenceInputModule12), {
          nodeId: id15,
          _data: _data13.nodes[id15],
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
          _resolveMediaUrl: (value68) => String(value68 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule12._renderRefBarImpl.call(value67);
      const value69 = value67.refBarEl.querySelector('.ref-thumb-container'),
        el39 = value69.childNodes.find((el40) => el40.dataset?.refOrigin === 'asset');
      (assert.equal(el39.dataset.refOrigin, 'asset'),
        assert.equal(el39.dataset.assetId, 'asset-generic'),
        assert.equal(el39.dataset.assetIndex, '0'),
        assert.equal(el39.dataset.assetOccurrence, '0'),
        assert.equal(el39.dataset.refType, 'image'),
        assert.match(el39.innerHTML, /ref-thumb-delete/),
        assert.match(el39.innerHTML, /ref-thumb/));
    } finally {
      if (typeof value66 === 'undefined') delete globalThis.document;
      else globalThis.document = value66;
    }
  }),
  test('video reference input: generic image refs show mask badge only for masked sources', async () => {
    const value70 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id16 = 'node-video-generic-mask-refbar',
        _data14 = {
          nodes: {
            [id16]: { id: id16, type: 'ai-video' },
            masked: {
              id: 'masked',
              type: 'source-image',
              localPath: 'data/assets/masked.png',
              maskUrl: 'output/mask/manual-mask.png',
            },
            plain: { id: 'plain', type: 'source-image', localPath: 'data/assets/plain.png' },
          },
        },
        value71 = [
          { id: 'edge-masked', sourceId: 'masked', targetId: id16 },
          { id: 'edge-plain', sourceId: 'plain', targetId: id16 },
        ],
        videoNodeReferenceInputModule13 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data14, getIncomingEdges: () => value71 },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value72 = Object.assign(Object.create(videoNodeReferenceInputModule13), {
          nodeId: id16,
          _data: _data14.nodes[id16],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl(),
          _refThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _resolveMediaUrl: (value73) => String(value73 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule13._renderRefBarImpl.call(value72);
      const list7 = value72.refBarEl
        .querySelector('.ref-thumb-container')
        .querySelectorAll('.ref-thumb-wrap');
      (assert.equal(list7.length, 2),
        assert.match(list7[0].innerHTML, /ref-thumb-mask-badge/),
        assert.match(list7[0].innerHTML, />遮罩<\/span>/),
        assert.doesNotMatch(list7[1].innerHTML, /ref-thumb-mask-badge/));
    } finally {
      if (typeof value70 === 'undefined') delete globalThis.document;
      else globalThis.document = value70;
    }
  }),
  test('video reference input: fixed-slot asset mentions fill other RH models and trail text', async () => {
    const value74 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const id17 = 'node-ltx-assets',
        _data15 = {
          nodes: {
            [id17]: {
              id: id17,
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
      const videoNodeReferenceInputModule14 = createVideoNodeReferenceInputModule({
          store: { getState: () => _data15, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        value75 = Object.assign(Object.create(videoNodeReferenceInputModule14), {
          nodeId: id17,
          _data: _data15.nodes[id17],
          refBarEl: createFakeElement('div'),
          promptEl: makePromptEl([
            makeAssetPill({ assetId: 'asset-ltx', assetIndex: 0, type: 'image', label: 'reference image' }),
            makeAssetPill({ assetId: 'asset-ltx', assetIndex: 1, type: 'audio', label: 'voice' }),
            makeAssetPill({ assetId: 'asset-ltx', assetIndex: 2, type: 'text', label: 'lyrics' }),
          ]),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => true,
          _resolveMediaUrl: (value76) => String(value76 || ''),
          _syncBtnIconState: () => {},
        });
      await videoNodeReferenceInputModule14._renderRefBarImpl.call(value75);
      const el41 = value75.refBarEl.querySelector('.rh-v5-ref-container'),
        el42 = el41.querySelector('[data-slot="refImage"]'),
        el43 = el41.querySelector('[data-slot="audio"]'),
        el44 = el41.querySelector('.rh-fixed-extra-ref');
      (assert.equal(el42.dataset.refOrigin, 'asset'),
        assert.equal(el42.dataset.refType, 'image'),
        assert.equal(el43.dataset.refOrigin, 'asset'),
        assert.equal(el43.dataset.refType, 'audio'),
        assert.equal(el44.dataset.refOrigin, 'asset'),
        assert.equal(el44.dataset.refType, 'text'),
        assert.ok(el41.childNodes.indexOf(el44) > el41.childNodes.indexOf(el43)),
        assert.match(el44.innerHTML, /ref-thumb-delete/));
    } finally {
      if (typeof value74 === 'undefined') delete globalThis.document;
      else globalThis.document = value74;
    }
  }),
  test('video reference input: LTX display area follows manifest refImage ratio', async () => {
    const value77 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const targetId2 = 'node-ltx-ref-ratio',
        { state: state2 } = await renderFixedRefBarForTest({
          targetId: targetId2,
          model: 'runninghub/2039336644536442882',
          nodeData: { width: 300, height: 300, x: 100, y: 200 },
          nodes: {
            'source-ref-image': {
              id: 'source-ref-image',
              type: 'source-image',
              width: 600,
              height: 1000,
              localPath: 'data/assets/ref.png',
            },
            'source-audio': { id: 'source-audio', type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
          incomingEdges: [
            { id: 'edge-ref', sourceId: 'source-ref-image', targetId: targetId2, refSlot: 'refImage' },
            { id: 'edge-audio', sourceId: 'source-audio', targetId: targetId2, refSlot: 'audio' },
          ],
        });
      (assert.equal(state2.nodes[targetId2].width, 300),
        assert.equal(state2.nodes[targetId2].height, 500),
        assert.equal(state2.nodes[targetId2].x, 100),
        assert.equal(state2.nodes[targetId2].y, 0),
        assert.equal(state2.nodes[targetId2].aspectRatio, '自适应'));
    } finally {
      if (typeof value77 === 'undefined') delete globalThis.document;
      else globalThis.document = value77;
    }
  }),
  test('video reference input: LipSync display area follows source video ratio', async () => {
    const value78 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const targetId3 = 'node-lipsync-video-ratio',
        { state: state3 } = await renderFixedRefBarForTest({
          targetId: targetId3,
          model: 'runninghub/2054101324521844738',
          nodeData: { width: 300, height: 300, x: 100, y: 200 },
          nodes: {
            'source-video': {
              id: 'source-video',
              type: 'source-video',
              width: 1280,
              height: 720,
              localPath: 'data/assets/source.mp4',
              thumbUrl: 'data/assets/source-thumb.jpg',
            },
            'source-audio': { id: 'source-audio', type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
          incomingEdges: [
            { id: 'edge-video', sourceId: 'source-video', targetId: targetId3, refSlot: 'sourceVideo' },
            { id: 'edge-audio', sourceId: 'source-audio', targetId: targetId3, refSlot: 'audio' },
          ],
        });
      (assert.equal(state3.nodes[targetId3].width, 533),
        assert.equal(state3.nodes[targetId3].height, 300),
        assert.equal(state3.nodes[targetId3].x, -16),
        assert.equal(state3.nodes[targetId3].y, 200),
        assert.equal(state3.nodes[targetId3].aspectRatio, '自适应'));
    } finally {
      if (typeof value78 === 'undefined') delete globalThis.document;
      else globalThis.document = value78;
    }
  }),
  test('video reference input: LipSync display area follows ref image ratio', async () => {
    const value79 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const targetId4 = 'node-lipsync-image-ratio',
        { state: state4 } = await renderFixedRefBarForTest({
          targetId: targetId4,
          model: 'runninghub/2054101324521844738',
          nodeData: { width: 300, height: 300, x: 100, y: 200 },
          nodes: {
            'source-ref-image': {
              id: 'source-ref-image',
              type: 'source-image',
              width: 600,
              height: 1000,
              localPath: 'data/assets/ref.png',
            },
            'source-audio': { id: 'source-audio', type: 'source-audio', localPath: 'data/assets/voice.mp3' },
          },
          incomingEdges: [
            { id: 'edge-ref', sourceId: 'source-ref-image', targetId: targetId4, refSlot: 'refImage' },
            { id: 'edge-audio', sourceId: 'source-audio', targetId: targetId4, refSlot: 'audio' },
          ],
        });
      (assert.equal(state4.nodes[targetId4].width, 300),
        assert.equal(state4.nodes[targetId4].height, 500),
        assert.equal(state4.nodes[targetId4].x, 100),
        assert.equal(state4.nodes[targetId4].y, 0),
        assert.equal(state4.nodes[targetId4].aspectRatio, '自适应'));
    } finally {
      if (typeof value79 === 'undefined') delete globalThis.document;
      else globalThis.document = value79;
    }
  }));
async function renderFixedRefBarForTest({
  targetId: targetId = 'node-fixed-refbar',
  model: model,
  nodeData: nodeData = {},
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  assetId: assetId = '',
  assetItems: assetItems = [],
  pills: pills = [],
  api: api = {},
} = {}) {
  assetId && assetItems.length && setAssetMentionAssets([{ id: assetId, items: assetItems }]);
  const _data16 = {
      nodes: {
        ...nodes,
        [targetId]: {
          id: targetId,
          type: 'ai-video',
          model: model,
          provider: 'runninghubwf',
          ...nodeData,
        },
      },
    },
    videoNodeReferenceInputModule15 = createVideoNodeReferenceInputModule({
      store: {
        getState: () => _data16,
        getIncomingEdges: () => incomingEdges,
        removeEdge: (value80) => {
          const count6 = incomingEdges.findIndex((item9) => item9.id === value80);
          if (count6 >= 0) incomingEdges.splice(count6, 1);
        },
        updateNodeData: (value81, value82) => {
          _data16.nodes[value81] = { ...(_data16.nodes[value81] || {}), ...(value82 || {}) };
        },
        batch: (handler5) => handler5(),
      },
      api: api,
      _syncPillLabels: () => {},
      getImage: async () => null,
      ensureThumbDecoded: () => {},
      revealRefThumbMedia: () => {},
    }),
    ctx = Object.assign(Object.create(videoNodeReferenceInputModule15), {
      nodeId: targetId,
      _data: _data16.nodes[targetId],
      refBarEl: createFakeElement('div'),
      promptEl: makePromptEl(
        pills.map((assetIndex2) =>
          makeAssetPill({
            assetId: assetId,
            assetIndex: assetIndex2.assetIndex,
            type: assetIndex2.type,
            label: assetIndex2.label,
          }),
        ),
      ),
      _fixedSlotRefThumbObjectUrls: new Map(),
      _videoThumbPending: new Set(),
      _resolveMediaUrl: (value83) => String(value83 || ''),
      _syncBtnIconState: () => {},
    });
  return (
    await videoNodeReferenceInputModule15._renderRefBarImpl.call(ctx),
    { ctx: ctx, container: ctx.refBarEl.querySelector('.rh-v5-ref-container'), state: _data16 }
  );
}
(test('video reference input: Basic, Scail2, and LipSync fixed slots are manifest-rendered from asset pills', async () => {
  const value84 = globalThis.document;
  globalThis.document = { createElement: createFakeElement };
  try {
    const value85 = [
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
    for (const model2 of value85) {
      _resetAssetMentionRegistryForTests();
      const { container: container } = await renderFixedRefBarForTest({
        targetId: 'node-' + model2.label + '-refbar-assets',
        model: model2.model,
        assetId: model2.assetId,
        assetItems: model2.items,
        pills: model2.pills,
      });
      assert.ok(container, model2.label);
      for (const [value86, value87] of model2.slots) {
        const el45 = container.querySelector('[data-slot="' + value86 + '"]');
        (assert.equal(el45.dataset.refOrigin, 'asset', model2.label + ':' + value86),
          assert.equal(el45.dataset.kind, value87, model2.label + ':' + value86),
          assert.equal(el45.dataset.refType, value87, model2.label + ':' + value86),
          assert.equal(el45.dataset.assetId, model2.assetId, model2.label + ':' + value86));
      }
    }
  } finally {
    if (typeof value84 === 'undefined') delete globalThis.document;
    else globalThis.document = value84;
  }
}),
  test('video reference input: HD VIP and Matting render fixed slots from manifest', async () => {
    const value88 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      {
        const { container: container2 } = await renderFixedRefBarForTest({
            targetId: 'node-watermark-v2-refbar',
            model: 'runninghub/2060613773890768898',
          }),
          value89 = Array.from(container2.querySelectorAll('[data-slot]')).map((el46) => el46.dataset.slot);
        (assert.deepEqual(value89, ['sourceVideo']),
          assert.equal(container2.querySelector('[data-slot="sourceVideo"]').dataset.kind, 'video'),
          assert.equal(container2.querySelector('[data-slot="maskImage"]'), null));
      }
      {
        const { container: container3 } = await renderFixedRefBarForTest({
            targetId: 'node-watermark-v2-mode2-refbar',
            model: 'runninghub/2060613773890768898',
            nodeData: { generationParams: { rhWatermarkRemoveMode: 'mode2' } },
          }),
          value90 = Array.from(container3.querySelectorAll('[data-slot]')).map((el47) => el47.dataset.slot);
        (assert.deepEqual(value90, ['sourceVideo', 'maskImage']),
          assert.equal(container3.querySelector('[data-slot="maskImage"]').dataset.kind, 'image'));
      }
      {
        const { container: container4 } = await renderFixedRefBarForTest({
            targetId: 'node-hd-vip-refbar',
            model: 'runninghub/2047787809091620866',
          }),
          value91 = Array.from(container4.querySelectorAll('[data-slot]')).map((el48) => el48.dataset.slot);
        (assert.deepEqual(value91, ['sourceVideo']),
          assert.equal(container4.querySelector('[data-slot="sourceVideo"]').dataset.kind, 'video'));
      }
      {
        const { container: container5 } = await renderFixedRefBarForTest({
            targetId: 'node-matting-refbar',
            model: 'runninghub/video_matting',
          }),
          value92 = Array.from(container5.querySelectorAll('[data-slot]')).map((el49) => el49.dataset.slot);
        (assert.deepEqual(value92, ['sourceVideo', 'maskImage']),
          assert.equal(container5.querySelector('[data-slot="sourceVideo"]').dataset.kind, 'video'),
          assert.equal(container5.querySelector('[data-slot="maskImage"]').dataset.kind, 'image'));
      }
    } finally {
      if (typeof value88 === 'undefined') delete globalThis.document;
      else globalThis.document = value88;
    }
  }),
  test('video reference input: 视频去字幕V2 hides and prunes mask slot outside mode2', async () => {
    const value93 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const targetId5 = 'node-watermark-v2-mode-switch',
        incomingEdges2 = [
          {
            id: 'edge-watermark-source',
            sourceId: 'sourceVideo',
            targetId: targetId5,
            refSlot: 'sourceVideo',
          },
          { id: 'edge-watermark-mask', sourceId: 'maskImage', targetId: targetId5, refSlot: 'maskImage' },
        ],
        {
          ctx: ctx2,
          state: state5,
          container: container6,
        } = await renderFixedRefBarForTest({
          targetId: targetId5,
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
          incomingEdges: incomingEdges2,
        });
      assert.deepEqual(
        Array.from(container6.querySelectorAll('[data-slot]')).map((el50) => el50.dataset.slot),
        ['sourceVideo', 'maskImage'],
      );
      const value94 = ctx2.refBarEl._innerHTMLSetCount;
      (assert.equal(incomingEdges2.length, 2),
        (state5.nodes[targetId5] = {
          ...state5.nodes[targetId5],
          generationParams: { rhWatermarkRemoveMode: 'mode1' },
        }),
        (ctx2._data = state5.nodes[targetId5]),
        await ctx2._renderRefBarImpl());
      const el51 = ctx2.refBarEl.querySelector('.rh-v5-ref-container');
      (assert.equal(ctx2.refBarEl._innerHTMLSetCount, value94),
        assert.deepEqual(
          Array.from(el51.querySelectorAll('[data-slot]')).map((el52) => el52.dataset.slot),
          ['sourceVideo'],
        ),
        assert.equal(el51.querySelector('[data-slot="maskImage"]'), null),
        assert.equal(
          incomingEdges2.some((item10) => item10.id === 'edge-watermark-mask'),
          false,
        ));
    } finally {
      if (typeof value93 === 'undefined') delete globalThis.document;
      else globalThis.document = value93;
    }
  }),
  test('video reference input: fixed image slots show mask badge for masked sources', async () => {
    const value95 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const targetId6 = 'node-watermark-mask-badge',
        { container: container7 } = await renderFixedRefBarForTest({
          targetId: targetId6,
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
            { id: 'edge-source', sourceId: 'sourceVideo', targetId: targetId6, refSlot: 'sourceVideo' },
            { id: 'edge-mask', sourceId: 'maskImage', targetId: targetId6, refSlot: 'maskImage' },
          ],
        }),
        el53 = container7.querySelector('[data-slot="sourceVideo"]'),
        el54 = container7.querySelector('[data-slot="maskImage"]');
      (assert.doesNotMatch(el53.innerHTML, /ref-thumb-mask-badge/),
        assert.match(el54.innerHTML, /ref-thumb-mask-badge/),
        assert.match(el54.innerHTML, />遮罩<\/span>/));
    } finally {
      if (typeof value95 === 'undefined') delete globalThis.document;
      else globalThis.document = value95;
    }
  }),
  test('video reference input: V5.4 cameraMove renders only required slots', async () => {
    const value96 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const { container: container8 } = await renderFixedRefBarForTest({
          targetId: 'node-v54-camera',
          model: 'runninghub/2041741496667348994',
          nodeData: { rhSpecialMode: 'cameraMove' },
        }),
        value97 = Array.from(container8.querySelectorAll('[data-slot]')).map((el55) => el55.dataset.slot);
      (assert.deepEqual(value97, ['sourceVideo', 'refImage']),
        assert.equal(container8.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(container8.querySelector('[data-slot="videoMask"]'), null));
    } finally {
      if (typeof value96 === 'undefined') delete globalThis.document;
      else globalThis.document = value96;
    }
  }),
  test('video reference input: V5.4 subtract hides mask video and first frame slots', async () => {
    const value98 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const { container: container9 } = await renderFixedRefBarForTest({
          targetId: 'node-v54-subtract',
          model: 'runninghub/2041741496667348994',
          nodeData: { rhSubtractSubject: true },
        }),
        value99 = Array.from(container9.querySelectorAll('[data-slot]')).map((el56) => el56.dataset.slot);
      (assert.deepEqual(value99, ['sourceVideo', 'refImage']),
        assert.equal(container9.querySelector('[data-slot="firstFrame"]'), null),
        assert.equal(container9.querySelector('[data-slot="videoMask"]'), null));
    } finally {
      if (typeof value98 === 'undefined') delete globalThis.document;
      else globalThis.document = value98;
    }
  }),
  test('video reference input: V5.4 subtract toggle reuses visible fixed slots', async () => {
    const value100 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const targetId7 = 'node-v54-subtract-toggle',
        { ctx: ctx3, state: state6 } = await renderFixedRefBarForTest({
          targetId: targetId7,
          model: 'runninghub/2041741496667348994',
          nodeData: { rhSubtractSubject: false },
        }),
        el57 = ctx3.refBarEl,
        el58 = el57.querySelector('.rh-v5-ref-container'),
        value101 = el58.querySelector('[data-slot="sourceVideo"]'),
        value102 = el58.querySelector('[data-slot="refImage"]'),
        count7 = el57._innerHTMLSetCount;
      (assert.ok(count7 >= 1),
        (state6.nodes[targetId7].rhSubtractSubject = true),
        (ctx3._data = state6.nodes[targetId7]),
        await ctx3._renderRefBarImpl(),
        assert.equal(el57._innerHTMLSetCount, count7),
        assert.deepEqual(
          Array.from(el58.querySelectorAll('[data-slot]')).map((el59) => el59.dataset.slot),
          ['sourceVideo', 'refImage'],
        ),
        assert.equal(el58.querySelector('[data-slot="sourceVideo"]'), value101),
        assert.equal(el58.querySelector('[data-slot="refImage"]'), value102),
        (state6.nodes[targetId7].rhSubtractSubject = false),
        (ctx3._data = state6.nodes[targetId7]),
        await ctx3._renderRefBarImpl(),
        assert.equal(el57._innerHTMLSetCount, count7),
        assert.deepEqual(
          Array.from(el58.querySelectorAll('[data-slot]')).map((el60) => el60.dataset.slot),
          ['sourceVideo', 'refImage', 'firstFrame', 'videoMask'],
        ),
        assert.equal(el58.querySelector('[data-slot="sourceVideo"]'), value101),
        assert.equal(el58.querySelector('[data-slot="refImage"]'), value102));
    } finally {
      if (typeof value100 === 'undefined') delete globalThis.document;
      else globalThis.document = value100;
    }
  }),
  test('video reference input: 同构固定入参模型切换不清空缩略图 DOM', async () => {
    const value103 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const targetId8 = 'node-fixed-model-switch',
        {
          ctx: ctx4,
          state: state7,
          container: container10,
        } = await renderFixedRefBarForTest({
          targetId: targetId8,
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
            { id: 'edge-source', sourceId: 'sourceVideo', targetId: targetId8, refSlot: 'sourceVideo' },
            { id: 'edge-ref', sourceId: 'refImage', targetId: targetId8, refSlot: 'refImage' },
          ],
        }),
        value104 = ctx4.refBarEl,
        value105 = container10.querySelector('[data-slot="sourceVideo"]'),
        value106 = container10.querySelector('[data-slot="refImage"]'),
        value107 = value104._innerHTMLSetCount;
      ((state7.nodes[targetId8] = {
        ...state7.nodes[targetId8],
        model: 'runninghub/2041741496667348994',
        rhSubtractSubject: true,
      }),
        (ctx4._data = state7.nodes[targetId8]),
        await ctx4._renderRefBarImpl(),
        assert.equal(value104._innerHTMLSetCount, value107),
        assert.equal(container10.querySelector('[data-slot="sourceVideo"]'), value105),
        assert.equal(container10.querySelector('[data-slot="refImage"]'), value106),
        (state7.nodes[targetId8] = {
          ...state7.nodes[targetId8],
          model: 'runninghub/2064961300823896065',
          generationParams: { rhScail2ReplaceSubject: false },
        }),
        (ctx4._data = state7.nodes[targetId8]),
        await ctx4._renderRefBarImpl(),
        assert.equal(value104._innerHTMLSetCount, value107),
        assert.equal(container10.querySelector('[data-slot="sourceVideo"]'), value105),
        assert.equal(container10.querySelector('[data-slot="refImage"]'), value106));
    } finally {
      if (typeof value103 === 'undefined') delete globalThis.document;
      else globalThis.document = value103;
    }
  }),
  test('video reference input: failed video thumb backfill keeps source video usable', async () => {
    const value108 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const targetId9 = 'node-v54-thumb-failure-target',
        id18 = 'node-v54-keyed-source',
        { state: state8 } = await renderFixedRefBarForTest({
          targetId: targetId9,
          model: 'runninghub/2041741496667348994',
          nodes: {
            [id18]: {
              id: id18,
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
              sourceId: id18,
              targetId: targetId9,
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
      const value109 = state8.nodes[id18];
      (assert.notEqual(value109.mediaUnavailable, true),
        assert.equal(value109.mediaUnavailableSource, undefined),
        assert.equal(value109.videoThumbUnavailableSource, '/output/keyed.mp4'),
        assert.equal(hasUsableInputNodeSource(value109), true));
    } finally {
      if (typeof value108 === 'undefined') delete globalThis.document;
      else globalThis.document = value108;
    }
  }),
  test('video reference input: fixed-slot edges win over asset refs and text stays trailing', async () => {
    const value110 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const assetId3 = 'asset-fixed-priority',
        { container: container11 } = await renderFixedRefBarForTest({
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
          assetId: assetId3,
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
        el61 = container11.querySelector('[data-slot="sourceVideo"]'),
        el62 = container11.querySelector('[data-slot="refImage"]'),
        el63 = container11.querySelector('.rh-fixed-extra-ref');
      (assert.equal(el61.dataset.refOrigin, 'node'),
        assert.equal(el61.dataset.edgeId, 'edge-source'),
        assert.equal(el62.dataset.refOrigin, 'asset'),
        assert.equal(el62.dataset.assetId, assetId3),
        assert.equal(el62.dataset.refType, 'image'),
        assert.equal(el63.dataset.refOrigin, 'asset'),
        assert.equal(el63.dataset.refType, 'text'),
        assert.ok(container11.childNodes.indexOf(el63) > container11.childNodes.indexOf(el62)));
    } finally {
      if (typeof value110 === 'undefined') delete globalThis.document;
      else globalThis.document = value110;
    }
  }),
  test('video reference input: fixed-slot explicit refSlot wins before same-kind empty slots', async () => {
    const value111 = globalThis.document;
    globalThis.document = { createElement: createFakeElement };
    try {
      const { container: container12 } = await renderFixedRefBarForTest({
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
      (assert.equal(container12.querySelector('[data-slot="videoMask"]').dataset.edgeId, 'edge-mask'),
        assert.equal(container12.querySelector('[data-slot="sourceVideo"]').dataset.edgeId, 'edge-source'));
    } finally {
      if (typeof value111 === 'undefined') delete globalThis.document;
      else globalThis.document = value111;
    }
  }),
  test('video submit button: V5.4 asset mentions satisfy required fixed inputs', () => {
    const id19 = 'node-v54-submit-assets',
      _data17 = {
        nodes: {
          [id19]: {
            id: id19,
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
    const videoNodeParameterPanelModule = createVideoNodeParameterPanelModule({
        store: { getState: () => _data17, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      value112 = Object.assign(Object.create(videoNodeParameterPanelModule), {
        nodeId: id19,
        _data: _data17.nodes[id19],
        promptEl: makePromptEl([
          makeAssetPill({ assetId: 'asset-submit', assetIndex: 0, type: 'video', label: 'source clip' }),
          makeAssetPill({ assetId: 'asset-submit', assetIndex: 1, type: 'image', label: 'reference image' }),
        ]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => true,
      });
    (videoNodeParameterPanelModule._updateSubmitButtonState.call(value112),
      assert.equal(value112.btnEl.disabled, false));
  }),
  test('video submit button: other fixed-slot models accept asset mentions', () => {
    const value113 = [
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
    for (const model3 of value113) {
      _resetAssetMentionRegistryForTests();
      const id20 = 'node-' + model3.label + '-submit-assets',
        _data18 = {
          nodes: {
            [id20]: {
              id: id20,
              type: 'ai-video',
              model: model3.model,
              provider: 'runninghubwf',
            },
          },
        };
      setAssetMentionAssets([{ id: 'asset-' + model3.label, items: model3.items }]);
      const videoNodeParameterPanelModule2 = createVideoNodeParameterPanelModule({
          store: { getState: () => _data18, getIncomingEdges: () => [] },
          api: {},
          getDisplayModelName: () => '',
          PROVIDERS_META: {},
          getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
          getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
          activateMenuKeyboard: () => {},
          isVideoVipModel: () => false,
        }),
        value114 = Object.assign(Object.create(videoNodeParameterPanelModule2), {
          nodeId: id20,
          _data: _data18.nodes[id20],
          promptEl: makePromptEl(
            model3.pills.map((assetIndex3) =>
              makeAssetPill({
                assetId: 'asset-' + model3.label,
                assetIndex: assetIndex3.assetIndex,
                type: assetIndex3.type,
                label: assetIndex3.label,
              }),
            ),
          ),
          btnEl: { disabled: true, style: {} },
          _isGenerating: false,
          _isDreaminaVideoNode: () => false,
          _isRunninghubWorkflowModel: () => true,
        });
      (videoNodeParameterPanelModule2._updateSubmitButtonState.call(value114),
        assert.equal(value114.btnEl.disabled, false, model3.label));
    }
  }),
  test('video submit button: empty editor can generate from non-empty text input', () => {
    const id21 = 'node-video-text-input-submit',
      id22 = 'node-video-text-input-source',
      _data19 = {
        nodes: {
          [id21]: {
            id: id21,
            type: 'ai-video',
            model: 'apimart/seedance-1.0',
            provider: 'apimart',
          },
          [id22]: { id: id22, type: 'source-text', content: '用文本入参生成视频' },
        },
      },
      value115 = [{ id: 'edge-video-text-input', sourceId: id22, targetId: id21 }],
      videoNodeParameterPanelModule3 = createVideoNodeParameterPanelModule({
        store: { getState: () => _data19, getIncomingEdges: () => value115 },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      value116 = Object.assign(Object.create(videoNodeParameterPanelModule3), {
        nodeId: id21,
        _data: _data19.nodes[id21],
        promptEl: makePromptEl([]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => false,
      });
    (videoNodeParameterPanelModule3._updateSubmitButtonState.call(value116),
      assert.equal(value116.btnEl.disabled, false),
      assert.equal(value116.btnEl.style.cursor, ''));
  }),
  test('video submit button: running task state is read from unified selector', () => {
    const id23 = 'node-video-running-button-state',
      _data20 = {
        nodes: {
          [id23]: {
            id: id23,
            type: 'ai-video',
            model: 'runninghub/1971148165531475969',
            provider: 'runninghubwf',
            rhTaskStatus: 'running',
            rhTaskId: 'rh-video-running',
          },
        },
      },
      videoNodeParameterPanelModule4 = createVideoNodeParameterPanelModule({
        store: { getState: () => _data20, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      value117 = Object.assign(Object.create(videoNodeParameterPanelModule4), {
        nodeId: id23,
        _data: _data20.nodes[id23],
        promptEl: makePromptEl([]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _rhCancelInFlight: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => true,
      });
    (videoNodeParameterPanelModule4._updateSubmitButtonState.call(value117),
      assert.equal(value117.btnEl.disabled, false),
      // 目标版本不再管理按钮 cursor（_updateSubmitButtonState 无 cursor 写入），故保持 undefined。
      assert.equal(value117.btnEl.style.cursor, undefined));
  }),
  test('video submit button: non-cancellable async running state stays disabled', () => {
    const id24 = 'node-video-async-running-button-state',
      _data21 = {
        nodes: {
          [id24]: {
            id: id24,
            type: 'ai-video',
            model: 'apimart/seedance-1.0',
            provider: 'apimart',
            asyncTaskStatus: 'running',
            asyncTaskId: 'async-video-running',
          },
        },
      },
      videoNodeParameterPanelModule5 = createVideoNodeParameterPanelModule({
        store: { getState: () => _data21, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      value118 = Object.assign(Object.create(videoNodeParameterPanelModule5), {
        nodeId: id24,
        _data: _data21.nodes[id24],
        promptEl: { innerText: 'prompt', querySelectorAll: () => [] },
        btnEl: { disabled: false, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => false,
      });
    (videoNodeParameterPanelModule5._updateSubmitButtonState.call(value118),
      assert.equal(value118.btnEl.disabled, true),
      // 同上：目标版本不再写入按钮 cursor。
      assert.equal(value118.btnEl.style.cursor, undefined));
  }),
  test('video submit button: Dreamina-style API running state stays disabled', () => {
    const id25 = 'node-video-seedance-api-running-button-state',
      _data22 = {
        nodes: {
          [id25]: {
            id: id25,
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
      videoNodeParameterPanelModule6 = createVideoNodeParameterPanelModule({
        store: { getState: () => _data22, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => '',
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      btnEl = {
        disabled: false,
        className: '',
        dataset: {},
        innerHTML: '',
        style: {},
        title: '',
        setAttribute(value119, value120) {
          this.attributes = { ...(this.attributes || {}), [value119]: String(value120 || '') };
        },
        removeAttribute(value121) {
          delete this.attributes?.[value121];
        },
      };
    btnEl.classList = makeClassList(btnEl);
    const value122 = Object.assign(Object.create(videoNodeParameterPanelModule6), {
      nodeId: id25,
      _data: _data22.nodes[id25],
      promptEl: { innerText: 'prompt', querySelectorAll: () => [] },
      btnEl: btnEl,
      _isGenerating: false,
      _rhCancelInFlight: false,
      _isDreaminaVideoNode: () => true,
      _isRunninghubWorkflowModel: () => false,
      _syncDreaminaTaskState: () => ({
        nodeData: _data22.nodes[id25],
        summary: { imageCount: 1, videoCount: 0, audioCount: 0 },
        resolvedTaskType: 'multimodal2video',
        routeMode: 'multimodal2video',
      }),
    });
    (videoNodeParameterPanelModule6._updateSubmitButtonState.call(value122),
      assert.equal(value122.btnEl.disabled, true),
      // 同上：目标版本不再写入按钮 cursor。
      assert.equal(value122.btnEl.style.cursor, undefined),
      assert.equal(value122.btnEl.classList.contains('is-task-cancel'), false));
  }));
