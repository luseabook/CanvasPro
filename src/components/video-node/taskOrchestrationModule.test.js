import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createVideoNodeTaskOrchestrationModule } from './taskOrchestrationModule.js';
import {
  buildRunningHubVideoWorkflowSubmitPatch,
  shouldScopeRunningHubVideoSubmitEdges,
} from './runningHubVideoSubmitPayload.js';
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from '../../modules/previewMode.js';
import {
  createPreviewContainer as createFakePreviewContainer,
  installDomEnvironment as installPreviewDomStubs,
} from '../../../tools/dom-test-environment.mjs';
import {
  _resetAssetMentionRegistryForTests,
  setAssetMentionAssets,
} from '../../modules/assetMentionRegistry.js';
const originalWindow = globalThis.window,
  originalDocument = globalThis.document,
  __dirname = dirname(fileURLToPath(import.meta.url)),
  taskOrchestrationSource = readFileSync(join(__dirname, 'taskOrchestrationModule.js'), 'utf8'),
  restorePreviewDom = installPreviewDomStubs();
if (!globalThis.window) globalThis.window = {};
typeof globalThis.window.showToast !== 'function' && (globalThis.window.showToast = () => {});
typeof globalThis.window._triggerLocalCacheSave !== 'function' &&
  (globalThis.window._triggerLocalCacheSave = () => {});
typeof globalThis.window.__aicInstallId !== 'string' && (globalThis.window.__aicInstallId = '');
async function flushUntil(handler, value = 20) {
  for (let item = 0; item < value; item += 1) {
    if (handler()) return;
    await Promise.resolve();
  }
  assert.equal(handler(), true);
}
(test.after(() => {
  (_resetPreviewRuntimeForTests(),
    typeof originalWindow === 'undefined' ? delete globalThis.window : (globalThis.window = originalWindow),
    typeof originalDocument === 'undefined'
      ? delete globalThis.document
      : (globalThis.document = originalDocument),
    restorePreviewDom());
}),
  test('video task orchestration: RunningHub workflow submit logic stays delegated', () => {
    (assert.match(taskOrchestrationSource, /buildRunningHubVideoWorkflowSubmitPatch/),
      assert.doesNotMatch(
        taskOrchestrationSource,
        /runninghub\/(?:2041741496667348994|1971148165531475969|2039336644536442882|2054101324521844738)/,
      ),
      assert.doesNotMatch(
        taskOrchestrationSource,
        /normalizeRh(?:StandardFps|V54Fps|VideoResolution)|buildRhV54AssetSlotMapFromRefs/,
      ));
  }),
  test('video task orchestration: RunningHub submit edge scoping is manifest driven', () => {
    (assert.equal(shouldScopeRunningHubVideoSubmitEdges({ model: 'runninghub/1971148165531475969' }), true),
      assert.equal(shouldScopeRunningHubVideoSubmitEdges({ model: 'runninghub/2041741496667348994' }), true),
      assert.equal(shouldScopeRunningHubVideoSubmitEdges({ model: 'runninghub/2060613773890768898' }), true),
      assert.equal(shouldScopeRunningHubVideoSubmitEdges({ model: 'runninghub/2064961300823896065' }), true),
      assert.equal(shouldScopeRunningHubVideoSubmitEdges({ model: 'runninghub/2065463417577762818' }), true),
      assert.equal(
        shouldScopeRunningHubVideoSubmitEdges({ model: 'runninghub/2054101324521844738' }),
        false,
      ));
  }),
  test('video task orchestration: Scail V1 uses fixed source video and ref image slots', async () => {
    const id = 'node-video-scail2',
      sourceId = 'node-video-scail2-source',
      sourceId2 = 'node-video-scail2-ref',
      runningHubVideoWorkflowSubmitPatch = await buildRunningHubVideoWorkflowSubmitPatch({
        model: 'runninghub/2064961300823896065',
        nodeData: {
          id: id,
          model: 'runninghub/2064961300823896065',
          provider: 'runninghubwf',
          generationParams: {
            rhVideoResolution: 832,
            rhVideoFps: 24,
            rhVideoFrames: 300,
            rhScail2PersonCount: 2,
            rhScailDetectPrompt: 'person, face',
            rhScail2ReplaceSubject: true,
            rhInstanceType: 'default',
          },
        },
        inEdges: [
          {
            id: 'edge-video-scail2-source',
            sourceId: sourceId,
            targetId: id,
            refSlot: 'sourceVideo',
          },
          { id: 'edge-video-scail2-ref', sourceId: sourceId2, targetId: id, refSlot: 'refImage' },
        ],
        nodes: {
          [sourceId]: { id: sourceId, type: 'source-video', videoUrl: '/data/uploads/scail2-source.mp4' },
          [sourceId2]: { id: sourceId2, type: 'source-image', imageUrl: '/data/uploads/scail2-ref.png' },
        },
        assetInputRefs: [],
        helpers: {
          getVideoUrl: (key) => key?.videoUrl || '',
          getImageUrl: (index) => index?.imageUrl || '',
          getAudioUrl: () => '',
        },
      });
    (assert.equal(
      runningHubVideoWorkflowSubmitPatch.payloadPatch.videoUrl,
      '/data/uploads/scail2-source.mp4',
    ),
      assert.deepEqual(runningHubVideoWorkflowSubmitPatch.payloadPatch.inputUrls, [
        '/data/uploads/scail2-ref.png',
      ]),
      assert.equal(runningHubVideoWorkflowSubmitPatch.payloadPatch.rhVideoResolution, 832),
      assert.equal(runningHubVideoWorkflowSubmitPatch.payloadPatch.rhVideoFps, 24),
      assert.equal(runningHubVideoWorkflowSubmitPatch.payloadPatch.rhVideoFrames, 300),
      assert.equal(runningHubVideoWorkflowSubmitPatch.payloadPatch.generationParams.rhScail2PersonCount, 2),
      assert.equal(
        runningHubVideoWorkflowSubmitPatch.payloadPatch.generationParams.rhScailDetectPrompt,
        'person, face',
      ),
      assert.equal(
        runningHubVideoWorkflowSubmitPatch.payloadPatch.generationParams.rhScail2ReplaceSubject,
        true,
      ));
  }),
  test('video task orchestration: Scail V1 does not treat source video thumbnail as ref image', async () => {
    const targetId = 'node-video-scail2-single-video',
      id2 = 'node-video-scail2-single-source',
      { proto: proto, ctx: ctx } = createTestContext({
        targetId: targetId,
        nodeData: {
          id: targetId,
          provider: 'runninghubwf',
          model: 'runninghub/2064961300823896065',
          generationParams: {
            rhVideoResolution: 832,
            rhVideoFps: 24,
            rhVideoFrames: 300,
            rhScail2PersonCount: 2,
            rhScail2ReplaceSubject: false,
            rhInstanceType: 'default',
          },
        },
        nodes: {
          [id2]: {
            id: id2,
            type: 'source-video',
            localPath: 'data/uploads/scail2-source.mp4',
            imageUrl: 'https://img.example.com/video-preview.png',
            thumbUrl: 'https://img.example.com/video-thumb.png',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-scail2-source-only',
            sourceId: id2,
            targetId: targetId,
            refSlot: 'sourceVideo',
          },
        ],
        prompt: '',
      }),
      result = await proto._buildPayloadImpl.call(ctx);
    (assert.equal(result.videoUrl, '/data/uploads/scail2-source.mp4'),
      assert.deepEqual(result.inputUrls, []));
  }),
  test('video task orchestration: BERNINI fixed slots build mode summary and reference video payload', async () => {
    const id3 = 'node-video-bernini',
      handler2 = (inEdges = [], nodes2 = {}, args = {}) =>
        buildRunningHubVideoWorkflowSubmitPatch({
          model: 'runninghub/2062515720147259393',
          nodeData: {
            id: id3,
            model: 'runninghub/2062515720147259393',
            provider: 'runninghubwf',
            generationParams: {
              rhBerniniFunction: 'i2v',
              rhVideoResolution: 832,
              rhBerniniAspectRatio: '16:9',
            },
            ...args,
          },
          inEdges: inEdges,
          nodes: nodes2,
          assetInputRefs: [],
          helpers: {
            getVideoUrl: (data) => data?.videoUrl || '',
            getImageUrl: (options) => options?.imageUrl || '',
            getAudioUrl: () => '',
          },
        }),
      target = await handler2();
    (assert.equal(target.payloadPatch.rhBerniniInputMode, 'none'),
      assert.equal(target.payloadPatch.rhBerniniFunction, undefined));
    const source = await handler2(
      [{ id: 'edge-image', sourceId: 'image1', targetId: id3, refSlot: 'refImage' }],
      { image1: { id: 'image1', type: 'source-image', imageUrl: '/ref.png' } },
    );
    (assert.equal(source.payloadPatch.rhBerniniInputMode, 'image'),
      assert.equal(source.payloadPatch.rhBerniniFunction, 'i2v'),
      assert.deepEqual(source.payloadPatch.inputUrls, ['/ref.png']));
    const next = await handler2(
      [{ id: 'edge-video', sourceId: 'video1', targetId: id3, refSlot: 'sourceVideo' }],
      { video1: { id: 'video1', type: 'source-video', videoUrl: '/source.mp4' } },
    );
    (assert.equal(next.payloadPatch.rhBerniniInputMode, 'video'),
      assert.equal(next.payloadPatch.rhBerniniFunction, 'v2v'),
      assert.equal(next.payloadPatch.videoUrl, '/source.mp4'),
      assert.deepEqual(next.payloadPatch.inputUrls, []));
    const current = await handler2(
      [
        { id: 'edge-video', sourceId: 'video1', targetId: id3, refSlot: 'sourceVideo' },
        { id: 'edge-image', sourceId: 'image1', targetId: id3, refSlot: 'refImage' },
      ],
      {
        video1: { id: 'video1', type: 'source-video', videoUrl: '/source.mp4' },
        image1: { id: 'image1', type: 'source-image', imageUrl: '/ref.png' },
      },
    );
    (assert.equal(current.payloadPatch.rhBerniniInputMode, 'videoImage'),
      assert.equal(current.payloadPatch.rhBerniniFunction, 'vi2v'),
      assert.deepEqual(current.payloadPatch.inputUrls, ['/ref.png']));
    const entry = await handler2(
      [
        { id: 'edge-video', sourceId: 'video1', targetId: id3, refSlot: 'sourceVideo' },
        { id: 'edge-ref-video', sourceId: 'video2', targetId: id3, refSlot: 'referenceVideo' },
      ],
      {
        video1: { id: 'video1', type: 'source-video', videoUrl: '/source.mp4' },
        video2: { id: 'video2', type: 'source-video', videoUrl: '/reference.mp4' },
      },
    );
    (assert.equal(entry.payloadPatch.rhBerniniInputMode, 'videoVideo'),
      assert.equal(entry.payloadPatch.rhBerniniFunction, 'ads2v'),
      assert.equal(entry.payloadPatch.referenceVideoUrl, '/reference.mp4'));
  }));
function createLipSyncPayloadContext({
  rhVideoFrames: rhVideoFrames = 120,
  videoDuration: videoDuration = 5,
  audioDuration: audioDuration = 5,
  includeVideo: includeVideo = true,
  includeAudio: includeAudio = true,
  includeImage: includeImage = false,
  includeText: includeText = false,
  rhInstanceType: rhInstanceType = 'default',
  rhVideoResolution: rhVideoResolution = 832,
} = {}) {
  const targetId2 = 'node-lipsync',
    nodes3 = {},
    incomingEdges2 = [];
  includeVideo &&
    ((nodes3.video1 = {
      id: 'video1',
      type: 'source-video',
      localPath: 'output/source.mp4',
      videoDuration: videoDuration,
    }),
    incomingEdges2.push({
      id: 'edge-video',
      sourceId: 'video1',
      targetId: targetId2,
      refSlot: 'sourceVideo',
    }));
  includeAudio &&
    ((nodes3.audio1 = {
      id: 'audio1',
      type: 'source-audio',
      localPath: 'output/audio.mp3',
      duration: audioDuration,
    }),
    incomingEdges2.push({ id: 'edge-audio', sourceId: 'audio1', targetId: targetId2, refSlot: 'audio' }));
  includeImage &&
    ((nodes3.image1 = { id: 'image1', type: 'source-image', imageUrl: '/output/ref.png' }),
    incomingEdges2.push({ id: 'edge-image', sourceId: 'image1', targetId: targetId2, refSlot: 'refImage' }));
  includeText &&
    ((nodes3.text1 = { id: 'text1', type: 'source-text', text: 'mouth shape prompt' }),
    incomingEdges2.push({ id: 'edge-text', sourceId: 'text1', targetId: targetId2, refSlot: '' }));
  const testContext = createTestContext({
    targetId: targetId2,
    nodes: nodes3,
    incomingEdges: incomingEdges2,
    nodeData: {
      id: targetId2,
      model: 'runninghub/2054101324521844738',
      provider: 'runninghubwf',
      rhVideoFrames: rhVideoFrames,
      rhVideoResolution: rhVideoResolution,
      rhInstanceType: rhInstanceType,
      generationParams: { rhInstanceType: rhInstanceType },
    },
    prompt: 'ignored prompt',
  });
  return ((testContext.ctx._isRunninghubWorkflowModel = () => true), testContext);
}
(test('video task orchestration: 视频对口型缺少视觉输入或音频时不构建 payload', async () => {
  const record = globalThis.window.showToast,
    list = [];
  globalThis.window.showToast = (payload) => {
    list.push(String(payload || ''));
  };
  try {
    {
      const { proto: proto2, ctx: ctx2 } = createLipSyncPayloadContext({
        includeVideo: true,
        includeAudio: false,
      });
      (assert.equal(await proto2._buildPayloadImpl.call(ctx2), null),
        assert.equal(list.at(-1), '请接入一个音频输入'));
    }
    {
      const { proto: proto3, ctx: ctx3 } = createLipSyncPayloadContext({
        includeVideo: false,
        includeAudio: true,
      });
      (assert.equal(await proto3._buildPayloadImpl.call(ctx3), null),
        assert.equal(list.at(-1), '请接入一个视频或参考图输入'));
    }
  } finally {
    globalThis.window.showToast = record;
  }
}),
  test('video task orchestration: 视频对口型按 24fps 校验音频时长', async () => {
    const handle = globalThis.window.showToast,
      list2 = [];
    globalThis.window.showToast = (state) => {
      list2.push(String(state || ''));
    };
    try {
      {
        const { proto: proto4, ctx: ctx4 } = createLipSyncPayloadContext({
            rhVideoFrames: 120,
            audioDuration: 5,
            rhInstanceType: 'plus',
          }),
          config = await proto4._buildPayloadImpl.call(ctx4);
        (assert.equal(config.rhVideoFrames, 120),
          assert.equal(config.frameCount, 120),
          assert.equal(config.rhVideoFps, 24),
          assert.equal(config.rhInstanceType, 'plus'),
          assert.equal(config.rhLipSyncInputIndex, 1),
          assert.deepEqual(config.inputUrls, []),
          assert.equal(config.videoUrl, '/output/source.mp4'),
          assert.equal(config.audioUrl, '/output/audio.mp3'));
      }
      {
        const { proto: proto5, ctx: ctx5 } = createLipSyncPayloadContext({
          rhVideoFrames: 121,
          audioDuration: 5,
        });
        (assert.equal(await proto5._buildPayloadImpl.call(ctx5), null),
          assert.equal(list2.at(-1), '生成视频时长不能超过音频时长'));
      }
    } finally {
      globalThis.window.showToast = handle;
    }
  }),
  test('video task orchestration: RunningHub workflow instance reads generationParams only', async () => {
    const { proto: proto6, ctx: ctx6 } = createLipSyncPayloadContext({
      rhInstanceType: 'default',
      rhVideoFrames: 120,
      audioDuration: 5,
    });
    ((ctx6._data.rhInstanceType = 'plus'), (ctx6._data.generationParams = { rhInstanceType: 'default' }));
    const scope = await proto6._buildPayloadImpl.call(ctx6);
    assert.equal(scope.rhInstanceType, 'default');
  }),
  test('video task orchestration: generic RunningHub workflow params come from generationParams', async () => {
    const targetId3 = 'node-commercial-digital-human',
      { proto: proto7, ctx: ctx7 } = createTestContext({
        targetId: targetId3,
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: '/output/ref.png' },
          audio1: { id: 'audio1', type: 'source-audio', localPath: 'output/audio.mp3', duration: 20 },
        },
        incomingEdges: [
          { id: 'edge-image', sourceId: 'image1', targetId: targetId3, refSlot: 'refImage' },
          { id: 'edge-audio', sourceId: 'audio1', targetId: targetId3, refSlot: 'audio' },
        ],
        nodeData: {
          id: targetId3,
          model: 'runninghub/2055639633148563458',
          provider: 'runninghubwf',
          generationParams: {
            rhVideoResolution: 1440,
            rhVideoFrames: 321,
            rhDigitalHumanMotionAmplitude: '2',
            rhDigitalHumanSceneMotionAmplitude: '1',
            rhInstanceType: 'plus',
          },
        },
        prompt: 'commercial singing prompt',
      });
    ctx7._isRunninghubWorkflowModel = () => true;
    const input = await proto7._buildPayloadImpl.call(ctx7);
    (assert.equal(input.rhVideoResolution, 1440),
      assert.equal(input.rhVideoFrames, 321),
      assert.equal(input.generationParams?.rhDigitalHumanMotionAmplitude, '2'),
      assert.equal(input.generationParams?.rhDigitalHumanSceneMotionAmplitude, '1'),
      assert.equal(input.rhInstanceType, 'plus'),
      assert.deepEqual(input.inputUrls, ['/output/ref.png']),
      assert.equal(input.audioUrl, '/output/audio.mp3'));
  }),
  test('video task orchestration: commercial digital human accepts cached audioDuration', async () => {
    const targetId4 = 'node-commercial-digital-human-audio-duration',
      { proto: proto8, ctx: ctx8 } = createTestContext({
        targetId: targetId4,
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: '/output/ref.png' },
          audio1: { id: 'audio1', type: 'source-audio', localPath: 'output/audio.mp3', audioDuration: 6 },
        },
        incomingEdges: [
          { id: 'edge-image', sourceId: 'image1', targetId: targetId4, refSlot: 'refImage' },
          { id: 'edge-audio', sourceId: 'audio1', targetId: targetId4, refSlot: 'audio' },
        ],
        nodeData: {
          id: targetId4,
          model: 'runninghub/2055639633148563458',
          provider: 'runninghubwf',
          generationParams: { rhVideoResolution: 1280, rhVideoFrames: 150, rhInstanceType: 'default' },
        },
        prompt: 'commercial singing prompt',
      });
    ctx8._isRunninghubWorkflowModel = () => true;
    const output = await proto8._buildPayloadImpl.call(ctx8);
    (assert.equal(output.rhVideoFrames, 150), assert.equal(output.audioUrl, '/output/audio.mp3'));
  }),
  test('video task orchestration: commercial digital human blocks when frames exceed audio duration at 25fps', async () => {
    const value2 = globalThis.window.showToast,
      list3 = [];
    globalThis.window.showToast = (value3) => {
      list3.push(String(value3 || ''));
    };
    try {
      const targetId5 = 'node-commercial-digital-human-too-long',
        { proto: proto9, ctx: ctx9 } = createTestContext({
          targetId: targetId5,
          nodes: {
            image1: { id: 'image1', type: 'source-image', imageUrl: '/output/ref.png' },
            audio1: { id: 'audio1', type: 'source-audio', localPath: 'output/audio.mp3', duration: 6 },
          },
          incomingEdges: [
            { id: 'edge-image', sourceId: 'image1', targetId: targetId5, refSlot: 'refImage' },
            { id: 'edge-audio', sourceId: 'audio1', targetId: targetId5, refSlot: 'audio' },
          ],
          nodeData: {
            id: targetId5,
            model: 'runninghub/2055639633148563458',
            provider: 'runninghubwf',
            generationParams: { rhVideoResolution: 1280, rhVideoFrames: 151, rhInstanceType: 'default' },
          },
          prompt: 'commercial singing prompt',
        });
      ((ctx9._isRunninghubWorkflowModel = () => true),
        assert.equal(await proto9._buildPayloadImpl.call(ctx9), null),
        assert.equal(list3.at(-1), '生成视频时长不能超过音频时长（按25帧/秒计算）'));
    } finally {
      globalThis.window.showToast = value2;
    }
  }),
  test('video task orchestration: 视频对口型图片入参写入 inputUrls 并切换 index', async () => {
    const { proto: proto10, ctx: ctx10 } = createLipSyncPayloadContext({
        includeVideo: false,
        includeImage: true,
        rhVideoFrames: 120,
        audioDuration: 5,
      }),
      value4 = await proto10._buildPayloadImpl.call(ctx10);
    (assert.equal(value4.videoUrl, undefined),
      assert.equal(value4.audioUrl, '/output/audio.mp3'),
      assert.equal(value4.rhLipSyncInputIndex, 0),
      assert.deepEqual(value4.inputUrls, ['/output/ref.png']));
  }),
  test('video task orchestration: 视频对口型图片入参不接受全长帧数', async () => {
    const value5 = globalThis.window.showToast,
      list4 = [];
    globalThis.window.showToast = (value6) => {
      list4.push(String(value6 || ''));
    };
    try {
      const { proto: proto11, ctx: ctx11 } = createLipSyncPayloadContext({
        includeVideo: false,
        includeImage: true,
        rhVideoFrames: 0,
        audioDuration: 5,
      });
      (assert.equal(await proto11._buildPayloadImpl.call(ctx11), null),
        assert.equal(list4.at(-1), '参考图入参请设置大于 0 的帧数'));
    } finally {
      globalThis.window.showToast = value5;
    }
  }),
  test('video task orchestration: 视频对口型接受文本作为提示词输入', async () => {
    const { proto: proto12, ctx: ctx12 } = createLipSyncPayloadContext({
        includeText: true,
        rhVideoFrames: 120,
        audioDuration: 5,
      }),
      value7 = await proto12._buildPayloadImpl.call(ctx12);
    (assert.equal(value7.prompt, 'mouth shape prompt\nignored prompt'),
      assert.equal(value7.videoUrl, '/output/source.mp4'),
      assert.equal(value7.audioUrl, '/output/audio.mp3'),
      assert.deepEqual(value7.inputUrls, []));
  }),
  test('video task orchestration: 视频对口型帧数 0 按视频全长换算', async () => {
    const value8 = globalThis.window.showToast,
      list5 = [];
    globalThis.window.showToast = (value9) => {
      list5.push(String(value9 || ''));
    };
    try {
      {
        const { proto: proto13, ctx: ctx13 } = createLipSyncPayloadContext({
            rhVideoFrames: 0,
            videoDuration: 4,
            audioDuration: 5,
          }),
          value10 = await proto13._buildPayloadImpl.call(ctx13);
        (assert.equal(value10.rhVideoFrames, 96), assert.equal(value10.frameCount, 96));
      }
      {
        const { proto: proto14, ctx: ctx14 } = createLipSyncPayloadContext({
          rhVideoFrames: 0,
          videoDuration: 6,
          audioDuration: 5,
        });
        (assert.equal(await proto14._buildPayloadImpl.call(ctx14), null),
          assert.equal(list5.at(-1), '生成视频时长不能超过音频时长'));
      }
    } finally {
      globalThis.window.showToast = value8;
    }
  }),
  test('video task orchestration: 视频对口型分辨率不低于 832', async () => {
    const { proto: proto15, ctx: ctx15 } = createLipSyncPayloadContext({
        rhVideoFrames: 120,
        audioDuration: 5,
        rhVideoResolution: 512,
      }),
      value11 = await proto15._buildPayloadImpl.call(ctx15);
    assert.equal(value11.rhVideoResolution, 832);
  }),
  test.afterEach(() => {
    (_resetPreviewRuntimeForTests(), _resetAssetMentionRegistryForTests());
  }));
function createStore(value12, list6 = []) {
  return {
    getStateRaw() {
      return value12;
    },
    getState() {
      return value12;
    },
    getIncomingEdges(value13) {
      return list6.filter((item2) => item2.targetId === value13);
    },
    updateNodeData(value14, args2) {
      const args3 = value12.nodes?.[value14] || {};
      value12.nodes[value14] = { ...args3, ...args2 };
    },
  };
}
function createButtonStub() {
  return {
    disabled: false,
    style: { color: '' },
    title: '',
    innerHTML: '',
    _attrs: new Map(),
    setAttribute(value15, value16) {
      this._attrs.set(String(value15 || ''), String(value16 || ''));
    },
    removeAttribute(value17) {
      this._attrs.delete(String(value17 || ''));
    },
  };
}
function createPromptTextNode(value18 = '') {
  return { nodeType: 3, textContent: String(value18 || '') };
}
function createPromptElementNode({
  tagName: tagName = 'SPAN',
  className: className = '',
  dataset: dataset = {},
  textContent: textContent = '',
  childNodes: childNodes = [],
} = {}) {
  const list7 = String(className || '')
    .split(/\s+/)
    .filter(Boolean);
  return {
    nodeType: 1,
    tagName: tagName,
    className: className,
    classList: {
      contains(value19) {
        return list7.includes(String(value19 || ''));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ''),
    childNodes: Array.isArray(childNodes) ? childNodes : [],
  };
}
function createPromptPillNode(value20, value21) {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: { label: String(value20 || ''), nodeId: String(value21 || '') },
    textContent: String(value20 || ''),
  });
}
function createAssetPromptPillNode(value22, value23, value24, value25) {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: {
      label: String(value22 || ''),
      refOrigin: 'asset',
      assetId: String(value23 || ''),
      assetIndex: String(value24),
      refType: String(value25 || ''),
    },
    textContent: String(value22 || ''),
  });
}
function collectPromptInnerText(value26) {
  return (Array.isArray(value26) ? value26 : [])
    .map((el) => {
      const count = Number(el?.nodeType);
      if (count === 3) return String(el?.textContent || '');
      if (count !== 1) return '';
      if (String(el?.tagName || '').toUpperCase() === 'BR') return '\n';
      const list8 = Array.isArray(el?.childNodes) ? el.childNodes : [];
      if (list8.length > 0) return collectPromptInnerText(list8);
      return String(el?.textContent || '');
    })
    .join('');
}
function createPromptEl(childNodes2 = 'test prompt') {
  if (Array.isArray(childNodes2)) {
    const innerText = collectPromptInnerText(childNodes2);
    return { innerText: innerText, textContent: innerText, childNodes: childNodes2 };
  }
  const innerText2 = String(childNodes2 || '');
  return { innerText: innerText2, textContent: innerText2, childNodes: [createPromptTextNode(innerText2)] };
}
function createTestContext({
  targetId: targetId6,
  nodeData: nodeData,
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  prompt: prompt = 'test prompt',
  promptEl: promptEl = null,
  apiImpl: apiImpl = {},
  startLoadingImpl: startLoadingImpl = () => {},
  stopLoadingImpl: stopLoadingImpl = () => {},
}) {
  const _data = { nodes: { ...nodes, [targetId6]: { ...nodeData } } },
    store = createStore(_data, incomingEdges),
    proto16 = createVideoNodeTaskOrchestrationModule({
      store: store,
      api: apiImpl,
      getImage: async () => null,
      startLoading: startLoadingImpl,
      stopLoading: stopLoadingImpl,
      ensureConfig: async () => {},
      getProviderConfig: () => ({ apiKey: '' }),
      isVideoVipModel: () => false,
      ensureVipSessionRecheck: async () => {},
    }),
    ctx16 = Object.assign(Object.create(proto16), {
      nodeId: targetId6,
      _data: _data.nodes[targetId6],
      promptEl: promptEl || createPromptEl(prompt),
      _normalizeDreaminaNodeData(value27) {
        return value27;
      },
      _resolveMediaUrl(value28) {
        return String(value28 || '');
      },
      _isDreaminaVideoNode(value29) {
        const value30 = String(value29?.provider || '')
            .trim()
            .toLowerCase(),
          value31 = String(value29?.model || '').trim();
        return value30 === 'dreamina' || value31.startsWith('dreamina/');
      },
      _isRunninghubWorkflowModel() {
        return false;
      },
    });
  return { ctx: ctx16, proto: proto16, state: _data, store: store };
}
(test('video task orchestration: Agnes random seed refreshes on submit and stays random in store', async () => {
  const targetId7 = 'node-agnes-submit-random-seed',
    {
      proto: proto17,
      ctx: ctx17,
      state: state2,
    } = createTestContext({
      targetId: targetId7,
      nodeData: {
        id: targetId7,
        provider: 'agnes',
        model: 'agnes/agnes-video-v2.0',
        generationParams: { aspectRatio: '16:9', seed: '8888', seed_mode: 'random' },
        generationParamsByModel: {
          'agnes/agnes-video-v2.0': { aspectRatio: '16:9', seed: '8888', seed_mode: 'random' },
        },
      },
      prompt: 'agnes camera move',
    }),
    value32 = Math.random;
  Math.random = () => 0;
  try {
    const value33 = await proto17._buildPayloadImpl.call(ctx17, null, {
      randomizeSubmitParams: true,
    });
    (assert.equal(value33.generationParams.seed, '0'),
      assert.equal(value33.generationParams.seed_mode, 'fixed'),
      assert.equal(state2.nodes[targetId7].generationParams.seed, '0'),
      assert.equal(state2.nodes[targetId7].generationParams.seed_mode, 'random'),
      assert.deepEqual(state2.nodes[targetId7].generationParamsByModel['agnes/agnes-video-v2.0'], {
        aspectRatio: '16:9',
        seed: '0',
        seed_mode: 'random',
      }));
  } finally {
    Math.random = value32;
  }
}),
  test('video task orchestration: Agnes fixed seed is not refreshed on submit', async () => {
    const targetId8 = 'node-agnes-submit-fixed-seed',
      {
        proto: proto18,
        ctx: ctx18,
        state: state3,
      } = createTestContext({
        targetId: targetId8,
        nodeData: {
          id: targetId8,
          provider: 'agnes',
          model: 'agnes/agnes-video-v2.0',
          generationParams: { aspectRatio: '16:9', seed: '8888', seed_mode: 'fixed' },
        },
        prompt: 'agnes fixed seed move',
      }),
      value34 = Math.random;
    Math.random = () => {
      throw new Error('fixed mode should not randomize seed');
    };
    try {
      const value35 = await proto18._buildPayloadImpl.call(ctx18, null, {
        randomizeSubmitParams: true,
      });
      (assert.equal(value35.generationParams.seed, '8888'),
        assert.equal(value35.generationParams.seed_mode, 'fixed'),
        assert.deepEqual(state3.nodes[targetId8].generationParams, {
          aspectRatio: '16:9',
          seed: '8888',
          seed_mode: 'fixed',
        }));
    } finally {
      Math.random = value34;
    }
  }),
  test('video task orchestration: APIMart modelApi payload keeps existing controls and typed media', async () => {
    const targetId9 = 'node-apimart-modelapi',
      { proto: proto19, ctx: ctx19 } = createTestContext({
        targetId: targetId9,
        nodeData: {
          id: targetId9,
          model: 'apimart/wan2.7',
          provider: 'apimart',
          aspectRatio: '1:1',
          resolution: '1080P',
          duration: 6,
          generationParams: { wan27_mode: 'image' },
        },
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/ref-image.png' },
          audio1: {
            id: 'audio1',
            type: 'source-audio',
            audioUrl: 'https://cdn.apimart.ai/ref-audio.mp3',
            duration: 8,
            fileSize: 5 * 1024 * 1024,
          },
        },
        incomingEdges: [
          { id: 'edge-image', sourceId: 'image1', targetId: targetId9 },
          { id: 'edge-audio', sourceId: 'audio1', targetId: targetId9 },
        ],
        prompt: 'cinematic horse',
      }),
      value36 = await proto19._buildPayloadImpl.call(ctx19);
    (assert.equal(value36.model, 'apimart/wan2.7'),
      assert.equal(value36.provider, 'apimart'),
      assert.equal(value36.aspectRatio, '1:1'),
      assert.equal(value36.resolution, '1080P'),
      assert.equal(value36.duration, 6),
      assert.deepEqual(value36.generationParams, { wan27_mode: 'image' }),
      assert.deepEqual(value36.inputUrls, ['https://cdn.apimart.ai/ref-image.png']),
      assert.deepEqual(value36.images, ['https://cdn.apimart.ai/ref-image.png']),
      assert.deepEqual(value36.videos, []),
      assert.deepEqual(value36.audios, ['https://cdn.apimart.ai/ref-audio.mp3']));
  }),
  test('video task orchestration: modelApi payload reads latest Store parameters before submit', async () => {
    const targetId10 = 'node-volcengine-seedance-latest-params',
      {
        proto: proto20,
        ctx: ctx20,
        store: store2,
      } = createTestContext({
        targetId: targetId10,
        nodeData: {
          id: targetId10,
          model: 'volcengine/seedance-2.0',
          provider: 'volcengine',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
          generationParams: { aspectRatio: '16:9', resolution: '720p', duration: 5 },
        },
        prompt: 'cinematic city flythrough',
      });
    store2.updateNodeData(targetId10, {
      generationParams: { aspectRatio: '9:16', resolution: '1080p', duration: 15 },
    });
    const value37 = await proto20._buildPayloadImpl.call(ctx20);
    (assert.equal(value37.aspectRatio, '9:16'),
      assert.equal(value37.resolution, '1080p'),
      assert.equal(value37.videoSize, '1080p'),
      assert.equal(value37.duration, 15),
      assert.deepEqual(value37.generationParams, {
        aspectRatio: '9:16',
        resolution: '1080p',
        duration: 15,
      }),
      assert.equal(ctx20._data.generationParams.duration, 15));
  }),
  test('video task orchestration: modelApi adaptive ratio uses source media size', async () => {
    const targetId11 = 'node-video-runninghub-wan-adaptive-source',
      id4 = 'node-image-runninghub-wan-portrait',
      { proto: proto21, ctx: ctx21 } = createTestContext({
        targetId: targetId11,
        nodeData: {
          id: targetId11,
          model: 'runninghub-model/wan2.7',
          provider: 'runninghub',
          aspectRatio: '自适应',
          width: 1600,
          height: 900,
          generationParams: { wan27_mode: 'image', aspectRatio: '自适应' },
        },
        nodes: {
          [id4]: {
            id: id4,
            type: 'source-image',
            imageUrl: 'https://www.runninghub.cn/assets/portrait.png',
            originalWidth: 720,
            originalHeight: 1280,
          },
        },
        incomingEdges: [{ id: 'edge-wan-portrait', sourceId: id4, targetId: targetId11 }],
        prompt: 'make it move',
      }),
      value38 = await proto21._buildPayloadImpl.call(ctx21);
    (assert.equal(value38.aspectRatio, '自适应'), assert.equal(value38.resolvedRatioLabel, '9:16'));
  }),
  test('video task orchestration: BERNINI workflow adaptive ratio uses node display size', async () => {
    const targetId12 = 'node-video-bernini-adaptive-display',
      { proto: proto22, ctx: ctx22 } = createTestContext({
        targetId: targetId12,
        nodeData: {
          id: targetId12,
          model: 'runninghub/2062515720147259393',
          provider: 'runninghubwf',
          width: 900,
          height: 1600,
          generationParams: {
            rhVideoResolution: 832,
            rhVideoFps: 24,
            rhVideoFrames: 121,
            rhBerniniAspectRatio: '自适应',
            rhInstanceType: 'default',
          },
        },
        nodes: {
          'source-video-landscape': {
            id: 'source-video-landscape',
            type: 'source-video',
            videoUrl: 'https://www.runninghub.cn/assets/source-landscape.mp4',
            width: 1280,
            height: 720,
          },
        },
        incomingEdges: [
          {
            id: 'edge-source-video-landscape',
            sourceId: 'source-video-landscape',
            targetId: targetId12,
            refSlot: 'sourceVideo',
          },
        ],
        prompt: 'portrait text video',
      });
    ctx22._isRunninghubWorkflowModel = () => true;
    const value39 = await proto22._buildPayloadImpl.call(ctx22);
    (assert.equal(value39.generationParams.rhBerniniAspectRatio, '自适应'),
      assert.equal(value39.resolvedRatioLabel, '9:16'));
  }),
  test('video task orchestration: modelApi adaptive ratio falls back to node display size', async () => {
    const targetId13 = 'node-video-runninghub-veo-adaptive-display',
      { proto: proto23, ctx: ctx23 } = createTestContext({
        targetId: targetId13,
        nodeData: {
          id: targetId13,
          model: 'runninghub-model/veo3',
          provider: 'runninghub',
          aspectRatio: '自适应',
          width: 1600,
          height: 900,
          generationParams: { rh_veo3_channel: 'lowCost', mode: 'fast', aspectRatio: '自适应' },
        },
        prompt: 'wide city lights',
      }),
      value40 = await proto23._buildPayloadImpl.call(ctx23);
    (assert.equal(value40.aspectRatio, '自适应'), assert.equal(value40.resolvedRatioLabel, '16:9'));
  }),
  test('video task orchestration: modelApi adaptive ratio falls back to manifest option', async () => {
    const targetId14 = 'node-video-runninghub-happyhorse-adaptive-default',
      { proto: proto24, ctx: ctx24 } = createTestContext({
        targetId: targetId14,
        nodeData: {
          id: targetId14,
          model: 'runninghub-model/happyhorse-1.0',
          provider: 'runninghub',
          aspectRatio: '自适应',
          generationParams: { happyhorse_mode: 'image', aspectRatio: '自适应' },
        },
        prompt: 'running horse',
      }),
      value41 = await proto24._buildPayloadImpl.call(ctx24);
    (assert.equal(value41.aspectRatio, '自适应'),
      assert.equal(value41.resolvedRatioLabel, '16:9'),
      assert.equal(value41.generationParams.happyhorse_mode, 'auto'));
  }),
  test('video task orchestration: Wan2.7 video mode validates continuation input', async () => {
    const value42 = globalThis.window.showToast,
      list9 = [];
    globalThis.window.showToast = (value43) => list9.push(String(value43 || ''));
    try {
      const targetId15 = 'node-apimart-wan27-video',
        testContext2 = createTestContext({
          targetId: targetId15,
          nodeData: {
            id: targetId15,
            model: 'apimart/wan2.7',
            provider: 'apimart',
            generationParams: { wan27_mode: 'video' },
          },
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/ref-video.mp4',
              videoDuration: 8,
            },
          },
          incomingEdges: [{ id: 'edge-video', sourceId: 'video1', targetId: targetId15 }],
          prompt: 'continue forward',
        }),
        value44 = await testContext2.proto._buildPayloadImpl.call(testContext2.ctx);
      (assert.deepEqual(value44.images, []),
        assert.deepEqual(value44.videos, ['https://cdn.apimart.ai/ref-video.mp4']),
        assert.deepEqual(value44.audios, []),
        assert.deepEqual(value44.inputUrls, []),
        assert.deepEqual(value44.generationParams, { wan27_mode: 'video' }));
      const testContext3 = createTestContext({
          targetId: 'node-apimart-wan27-short-id',
          nodeData: {
            id: 'node-apimart-wan27-short-id',
            model: 'wan2.7',
            provider: 'apimart',
            generationParams: { wan27_mode: 'video' },
          },
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/ref-video.mp4',
              videoDuration: 8,
            },
          },
          incomingEdges: [
            { id: 'edge-short-id-video', sourceId: 'video1', targetId: 'node-apimart-wan27-short-id' },
          ],
          prompt: 'continue forward',
        }),
        value45 = await testContext3.proto._buildPayloadImpl.call(testContext3.ctx);
      (assert.deepEqual(value45.videos, ['https://cdn.apimart.ai/ref-video.mp4']),
        assert.deepEqual(value45.generationParams, { wan27_mode: 'video' }));
      const testContext4 = createTestContext({
          targetId: 'node-apimart-wan27-stale-provider',
          nodeData: {
            id: 'node-apimart-wan27-stale-provider',
            model: 'apimart/wan2.7',
            provider: 'apimartr',
            generationParams: { wan27_mode: 'video' },
          },
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/ref-video.mp4',
              videoDuration: 8,
            },
          },
          incomingEdges: [
            {
              id: 'edge-stale-provider-video',
              sourceId: 'video1',
              targetId: 'node-apimart-wan27-stale-provider',
            },
          ],
          prompt: 'continue forward',
        }),
        value46 = await testContext4.proto._buildPayloadImpl.call(testContext4.ctx);
      (assert.deepEqual(value46.videos, ['https://cdn.apimart.ai/ref-video.mp4']),
        assert.deepEqual(value46.generationParams, { wan27_mode: 'video' }));
      const testContext5 = createTestContext({
          targetId: 'node-runninghub-wan27-video',
          nodeData: {
            id: 'node-runninghub-wan27-video',
            model: 'runninghub-model/wan2.7',
            provider: 'runninghub',
            generationParams: { wan27_mode: 'video' },
          },
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://www.runninghub.cn/assets/wan-source.mp4',
              videoDuration: 8,
            },
          },
          incomingEdges: [
            {
              id: 'edge-runninghub-wan27-video',
              sourceId: 'video1',
              targetId: 'node-runninghub-wan27-video',
              refSlot: 'sourceVideo',
            },
          ],
          prompt: 'continue forward',
        }),
        value47 = await testContext5.proto._buildPayloadImpl.call(testContext5.ctx);
      (assert.deepEqual(value47.videos, ['https://www.runninghub.cn/assets/wan-source.mp4']),
        assert.deepEqual(value47.generationParams, { wan27_mode: 'video' }));
      const testContext6 = createTestContext({
        targetId: 'node-apimart-wan27-video-long',
        nodeData: {
          id: 'node-apimart-wan27-video-long',
          model: 'apimart/wan2.7',
          provider: 'apimart',
          generationParams: { wan27_mode: 'video' },
        },
        nodes: {
          video1: {
            id: 'video1',
            type: 'source-video',
            videoUrl: 'https://cdn.apimart.ai/long-video.mp4',
            videoDuration: 10.5,
          },
        },
        incomingEdges: [
          { id: 'edge-long-video', sourceId: 'video1', targetId: 'node-apimart-wan27-video-long' },
        ],
        prompt: 'continue forward',
      });
      (assert.equal(await testContext6.proto._buildPayloadImpl.call(testContext6.ctx), null),
        assert.match(list9.join('\n'), /不能超过 10 秒/));
    } finally {
      globalThis.window.showToast = value42;
    }
  }),
  test('video task orchestration: Wan2.7 image mode validates audio limits', async () => {
    const value48 = globalThis.window.showToast,
      list10 = [];
    globalThis.window.showToast = (value49) => list10.push(String(value49 || ''));
    try {
      const testContext7 = createTestContext({
        targetId: 'node-apimart-wan27-audio-short',
        nodeData: {
          id: 'node-apimart-wan27-audio-short',
          model: 'apimart/wan2.7',
          provider: 'apimart',
          generationParams: { wan27_mode: 'image' },
        },
        nodes: {
          audio1: {
            id: 'audio1',
            type: 'source-audio',
            audioUrl: 'https://cdn.apimart.ai/short.mp3',
            duration: 1.5,
          },
        },
        incomingEdges: [
          { id: 'edge-short-audio', sourceId: 'audio1', targetId: 'node-apimart-wan27-audio-short' },
        ],
        prompt: 'music driven motion',
      });
      (assert.equal(await testContext7.proto._buildPayloadImpl.call(testContext7.ctx), null),
        assert.match(list10.join('\n'), /音频必须为 2-30 秒/),
        (list10.length = 0));
      const testContext8 = createTestContext({
        targetId: 'node-apimart-wan27-audio-large',
        nodeData: {
          id: 'node-apimart-wan27-audio-large',
          model: 'apimart/wan2.7',
          provider: 'apimart',
          generationParams: { wan27_mode: 'image' },
        },
        nodes: {
          audio1: {
            id: 'audio1',
            type: 'source-audio',
            audioUrl: 'https://cdn.apimart.ai/large.mp3',
            duration: 10,
            fileSize: 16 * 1024 * 1024,
          },
        },
        incomingEdges: [
          { id: 'edge-large-audio', sourceId: 'audio1', targetId: 'node-apimart-wan27-audio-large' },
        ],
        prompt: 'music driven motion',
      });
      (assert.equal(await testContext8.proto._buildPayloadImpl.call(testContext8.ctx), null),
        assert.match(list10.join('\n'), /小于 15MB/));
    } finally {
      globalThis.window.showToast = value48;
    }
  }),
  test('video task orchestration: Wan2.7 reference and edit modes filter media', async () => {
    const value50 = globalThis.window.showToast,
      list11 = [];
    globalThis.window.showToast = (value51) => list11.push(String(value51 || ''));
    try {
      const targetId16 = 'node-apimart-wan27-reference',
        testContext9 = createTestContext({
          targetId: targetId16,
          nodeData: {
            id: targetId16,
            model: 'apimart/wan2.7',
            provider: 'apimart',
            generationParams: { wan27_mode: 'reference' },
          },
          nodes: {
            image1: { id: 'image1', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/ref-image.png' },
            audio1: {
              id: 'audio1',
              type: 'source-audio',
              audioUrl: 'https://cdn.apimart.ai/ref-voice.mp3',
              audioDuration: 8,
              audioSizeBytes: 1024 * 1024,
            },
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/ref-video.mp4',
              videoDuration: 12,
            },
          },
          incomingEdges: [
            {
              id: 'edge-reference-image',
              sourceId: 'image1',
              targetId: targetId16,
              refSlot: 'referenceImage',
            },
            {
              id: 'edge-reference-video',
              sourceId: 'video1',
              targetId: targetId16,
              refSlot: 'referenceVideo',
            },
            {
              id: 'edge-reference-audio',
              sourceId: 'audio1',
              targetId: targetId16,
              refSlot: 'referenceAudio',
            },
          ],
          prompt: 'use the character and camera style',
        }),
        value52 = await testContext9.proto._buildPayloadImpl.call(testContext9.ctx);
      (assert.deepEqual(value52.images, ['https://cdn.apimart.ai/ref-image.png']),
        assert.deepEqual(value52.videos, ['https://cdn.apimart.ai/ref-video.mp4']),
        assert.deepEqual(value52.audios, ['https://cdn.apimart.ai/ref-voice.mp3']),
        assert.deepEqual(value52.inputUrls, ['https://cdn.apimart.ai/ref-image.png']),
        assert.deepEqual(value52.generationParams, { wan27_mode: 'reference' }));
      const targetId17 = 'node-apimart-wan27-edit',
        testContext10 = createTestContext({
          targetId: targetId17,
          nodeData: {
            id: targetId17,
            model: 'apimart/wan2.7',
            provider: 'apimart',
            generationParams: { wan27_mode: 'edit' },
          },
          nodes: {
            original: {
              id: 'original',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/original.mp4',
              videoDuration: 8,
            },
            reference: {
              id: 'reference',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/reference.mp4',
              videoDuration: 6,
            },
          },
          incomingEdges: [
            { id: 'edge-original', sourceId: 'original', targetId: targetId17, refSlot: 'originalVideo' },
            { id: 'edge-reference', sourceId: 'reference', targetId: targetId17, refSlot: 'referenceVideo' },
          ],
          prompt: 'change clothes to red dress',
        }),
        value53 = await testContext10.proto._buildPayloadImpl.call(testContext10.ctx);
      (assert.deepEqual(value53.images, []),
        assert.deepEqual(value53.videos, [
          'https://cdn.apimart.ai/original.mp4',
          'https://cdn.apimart.ai/reference.mp4',
        ]),
        assert.deepEqual(value53.audios, []),
        assert.deepEqual(value53.inputUrls, []),
        assert.deepEqual(value53.generationParams, { wan27_mode: 'edit' }));
      const testContext11 = createTestContext({
        targetId: 'node-apimart-wan27-edit-long',
        nodeData: {
          id: 'node-apimart-wan27-edit-long',
          model: 'apimart/wan2.7',
          provider: 'apimart',
          generationParams: { wan27_mode: 'edit' },
        },
        nodes: {
          original: {
            id: 'original',
            type: 'source-video',
            videoUrl: 'https://cdn.apimart.ai/original-long.mp4',
            videoDuration: 12,
          },
        },
        incomingEdges: [
          { id: 'edge-original-long', sourceId: 'original', targetId: 'node-apimart-wan27-edit-long' },
        ],
        prompt: 'change scene',
      });
      (assert.equal(await testContext11.proto._buildPayloadImpl.call(testContext11.ctx), null),
        assert.match(list11.join('\n'), /2-10 秒/));
    } finally {
      globalThis.window.showToast = value50;
    }
  }),
  test('video task orchestration: Hailuo 02 fixed frame slots produce inputUrlsBySlot', async () => {
    const targetId18 = 'node-apimart-hailuo-02',
      { proto: proto25, ctx: ctx25 } = createTestContext({
        targetId: targetId18,
        nodeData: {
          id: targetId18,
          model: 'apimart/minimax-hailuo',
          provider: 'apimart',
          generationParams: { duration: 10, resolution: '768p' },
        },
        nodes: {
          first: { id: 'first', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/first.png' },
          last: { id: 'last', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/last.png' },
        },
        incomingEdges: [
          { id: 'edge-first', sourceId: 'first', targetId: targetId18, refSlot: 'firstFrame' },
          { id: 'edge-last', sourceId: 'last', targetId: targetId18, refSlot: 'lastFrame' },
        ],
        prompt: 'cinematic transition',
      }),
      value54 = await proto25._buildPayloadImpl.call(ctx25);
    (assert.deepEqual(value54.images, [
      'https://cdn.apimart.ai/first.png',
      'https://cdn.apimart.ai/last.png',
    ]),
      assert.deepEqual(value54.inputUrls, value54.images),
      assert.deepEqual(value54.inputUrlsBySlot, {
        firstFrame: 'https://cdn.apimart.ai/first.png',
        lastFrame: 'https://cdn.apimart.ai/last.png',
      }));
  }),
  test('video task orchestration: RunningHub Hailuo 02 fixed frame slots produce inputUrlsBySlot', async () => {
    const targetId19 = 'node-runninghub-hailuo-02',
      { proto: proto26, ctx: ctx26 } = createTestContext({
        targetId: targetId19,
        nodeData: {
          id: targetId19,
          model: 'runninghub-model/hailuo-02',
          provider: 'runninghub',
          generationParams: { rh_hailuo_02_quality: 'standard', duration: 6 },
        },
        nodes: {
          first: {
            id: 'first',
            type: 'source-image',
            imageUrl: 'https://www.runninghub.cn/assets/hailuo-first.png',
          },
          last: {
            id: 'last',
            type: 'source-image',
            imageUrl: 'https://www.runninghub.cn/assets/hailuo-last.png',
          },
        },
        incomingEdges: [
          { id: 'edge-first', sourceId: 'first', targetId: targetId19, refSlot: 'firstFrame' },
          { id: 'edge-last', sourceId: 'last', targetId: targetId19, refSlot: 'lastFrame' },
        ],
        prompt: 'cinematic transition',
      }),
      value55 = await proto26._buildPayloadImpl.call(ctx26);
    (assert.equal(value55.provider, 'runninghub'),
      assert.deepEqual(value55.inputUrlsBySlot, {
        firstFrame: 'https://www.runninghub.cn/assets/hailuo-first.png',
        lastFrame: 'https://www.runninghub.cn/assets/hailuo-last.png',
      }));
  }),
  test('video task orchestration: RunningHub Hailuo 2.3 fixed first frame slot produces inputUrlsBySlot', async () => {
    const targetId20 = 'node-runninghub-hailuo-23',
      { proto: proto27, ctx: ctx27 } = createTestContext({
        targetId: targetId20,
        nodeData: {
          id: targetId20,
          model: 'runninghub-model/hailuo-2.3',
          provider: 'runninghub',
          generationParams: { rh_hailuo_23_quality: 'fast', duration: 6 },
        },
        nodes: {
          first: {
            id: 'first',
            type: 'source-image',
            imageUrl: 'https://www.runninghub.cn/assets/hailuo-23-first.png',
          },
        },
        incomingEdges: [{ id: 'edge-first', sourceId: 'first', targetId: targetId20, refSlot: 'firstFrame' }],
        prompt: 'animate the first frame',
      }),
      value56 = await proto27._buildPayloadImpl.call(ctx27);
    (assert.equal(value56.provider, 'runninghub'),
      assert.deepEqual(value56.inputUrlsBySlot, {
        firstFrame: 'https://www.runninghub.cn/assets/hailuo-23-first.png',
      }));
  }),
  test('video task orchestration: Hailuo 2.3 fixed first frame slot produces inputUrlsBySlot', async () => {
    const targetId21 = 'node-apimart-hailuo-23',
      { proto: proto28, ctx: ctx28 } = createTestContext({
        targetId: targetId21,
        nodeData: {
          id: targetId21,
          model: 'apimart/minimax-hailuo-2.3',
          provider: 'apimart',
          generationParams: { mode: 'standard', duration: 10, resolution: '768p' },
        },
        nodes: {
          first: {
            id: 'first',
            type: 'source-image',
            imageUrl: 'https://cdn.apimart.ai/hailuo-23-first.png',
          },
        },
        incomingEdges: [{ id: 'edge-first', sourceId: 'first', targetId: targetId21, refSlot: 'firstFrame' }],
        prompt: 'cinematic first frame motion',
      }),
      value57 = await proto28._buildPayloadImpl.call(ctx28);
    (assert.deepEqual(value57.images, ['https://cdn.apimart.ai/hailuo-23-first.png']),
      assert.deepEqual(value57.inputUrls, value57.images),
      assert.deepEqual(value57.inputUrlsBySlot, {
        firstFrame: 'https://cdn.apimart.ai/hailuo-23-first.png',
      }));
  }),
  test('video task orchestration: VEO3 fixed slots reuse manifest input slot routing', async () => {
    const targetId22 = 'node-apimart-veo3',
      { proto: proto29, ctx: ctx29 } = createTestContext({
        targetId: targetId22,
        nodeData: {
          id: targetId22,
          model: 'apimart/veo3-fast',
          provider: 'apimart',
          generationParams: { mode: 'fast', generation_type: 'frame', duration: 8, resolution: '720p' },
        },
        nodes: {
          first: { id: 'first', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/veo-first.png' },
          last: { id: 'last', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/veo-last.png' },
        },
        incomingEdges: [
          { id: 'edge-first', sourceId: 'first', targetId: targetId22, refSlot: 'firstFrame' },
          { id: 'edge-last', sourceId: 'last', targetId: targetId22, refSlot: 'lastFrame' },
        ],
        prompt: 'cinematic transition',
      }),
      value58 = await proto29._buildPayloadImpl.call(ctx29);
    (assert.deepEqual(value58.images, [
      'https://cdn.apimart.ai/veo-first.png',
      'https://cdn.apimart.ai/veo-last.png',
    ]),
      assert.deepEqual(value58.inputUrlsBySlot, {
        firstFrame: 'https://cdn.apimart.ai/veo-first.png',
        lastFrame: 'https://cdn.apimart.ai/veo-last.png',
      }));
  }),
  test('video task orchestration: stale refSlot fills current VEO3 modelApi slot', async () => {
    const targetId23 = 'node-apimart-veo3-stale-refslot',
      { proto: proto30, ctx: ctx30 } = createTestContext({
        targetId: targetId23,
        nodeData: {
          id: targetId23,
          model: 'apimart/veo3-fast',
          provider: 'apimart',
          generationParams: { mode: 'fast', generation_type: 'frame', duration: 8, resolution: '720p' },
        },
        nodes: {
          legacyRef: {
            id: 'legacyRef',
            type: 'source-image',
            imageUrl: 'https://cdn.apimart.ai/legacy-ref.png',
          },
        },
        incomingEdges: [
          { id: 'edge-legacy-refslot', sourceId: 'legacyRef', targetId: targetId23, refSlot: 'refImage' },
        ],
        prompt: 'cinematic transition',
      }),
      value59 = await proto30._buildPayloadImpl.call(ctx30);
    (assert.deepEqual(value59.images, ['https://cdn.apimart.ai/legacy-ref.png']),
      assert.deepEqual(value59.inputUrlsBySlot, { firstFrame: 'https://cdn.apimart.ai/legacy-ref.png' }));
  }),
  test('video task orchestration: Vidu Q3 switches fixed slots by generation mode', async () => {
    const targetId24 = 'node-apimart-vidu-q3-video',
      testContext12 = createTestContext({
        targetId: targetId24,
        nodeData: {
          id: targetId24,
          model: 'apimart/viduq3',
          provider: 'apimart',
          generationParams: {
            vidu_q3_generation_mode: 'video',
            mode: 'viduq3-turbo',
            duration: 5,
            resolution: '720p',
          },
        },
        nodes: {
          first: { id: 'first', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/vidu-first.png' },
          last: { id: 'last', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/vidu-last.png' },
        },
        incomingEdges: [
          { id: 'edge-first', sourceId: 'first', targetId: targetId24, refSlot: 'firstFrame' },
          { id: 'edge-last', sourceId: 'last', targetId: targetId24, refSlot: 'lastFrame' },
        ],
        prompt: 'cinematic Vidu transition',
      }),
      value60 = await testContext12.proto._buildPayloadImpl.call(testContext12.ctx);
    assert.deepEqual(value60.inputUrlsBySlot, {
      firstFrame: 'https://cdn.apimart.ai/vidu-first.png',
      lastFrame: 'https://cdn.apimart.ai/vidu-last.png',
    });
    const targetId25 = 'node-apimart-vidu-q3-reference',
      testContext13 = createTestContext({
        targetId: targetId25,
        nodeData: {
          id: targetId25,
          model: 'apimart/viduq3',
          provider: 'apimart',
          generationParams: {
            vidu_q3_generation_mode: 'reference',
            mode: 'viduq3',
            duration: 5,
            resolution: '720p',
          },
        },
        nodes: {
          refA: { id: 'refA', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/vidu-ref-a.png' },
          refB: { id: 'refB', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/vidu-ref-b.png' },
        },
        incomingEdges: [
          { id: 'edge-ref-a', sourceId: 'refA', targetId: targetId25 },
          { id: 'edge-ref-b', sourceId: 'refB', targetId: targetId25 },
        ],
        prompt: 'reference guided Vidu motion',
      }),
      value61 = await testContext13.proto._buildPayloadImpl.call(testContext13.ctx);
    (assert.deepEqual(value61.images, [
      'https://cdn.apimart.ai/vidu-ref-a.png',
      'https://cdn.apimart.ai/vidu-ref-b.png',
    ]),
      assert.equal(value61.inputUrlsBySlot, undefined));
  }),
  test('video task orchestration: Kling V3 Omni modes filter media and fixed slots', async () => {
    const targetId26 = 'node-apimart-kling-omni-image',
      testContext14 = createTestContext({
        targetId: targetId26,
        nodeData: {
          id: targetId26,
          model: 'apimart/kling-v3-omni',
          provider: 'apimart',
          generationParams: { kling_v3_omni_mode: 'image', duration: 6, resolution: 'pro' },
        },
        nodes: {
          first: { id: 'first', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/omni-first.png' },
          last: { id: 'last', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/omni-last.png' },
        },
        incomingEdges: [
          { id: 'edge-last', sourceId: 'last', targetId: targetId26, refSlot: 'lastFrame' },
          { id: 'edge-first', sourceId: 'first', targetId: targetId26, refSlot: 'firstFrame' },
        ],
        prompt: 'omni image mode',
      }),
      value62 = await testContext14.proto._buildPayloadImpl.call(testContext14.ctx);
    (assert.equal(value62.generationParams.kling_v3_omni_mode, 'image'),
      assert.deepEqual(value62.images, [
        'https://cdn.apimart.ai/omni-first.png',
        'https://cdn.apimart.ai/omni-last.png',
      ]),
      assert.deepEqual(value62.inputUrlsBySlot, {
        firstFrame: 'https://cdn.apimart.ai/omni-first.png',
        lastFrame: 'https://cdn.apimart.ai/omni-last.png',
      }));
    const targetId27 = 'node-apimart-kling-omni-reference',
      testContext15 = createTestContext({
        targetId: targetId27,
        nodeData: {
          id: targetId27,
          model: 'apimart/kling-v3-omni',
          provider: 'apimart',
          generationParams: { kling_v3_omni_mode: 'reference' },
        },
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/omni-ref.png' },
          video1: { id: 'video1', type: 'source-video', videoUrl: 'https://cdn.apimart.ai/omni-feature.mp4' },
        },
        incomingEdges: [
          { id: 'edge-ref-image', sourceId: 'image1', targetId: targetId27, refSlot: 'referenceImage' },
          { id: 'edge-ref-video', sourceId: 'video1', targetId: targetId27, refSlot: 'referenceVideo' },
        ],
        prompt: 'omni reference mode',
      }),
      value63 = await testContext15.proto._buildPayloadImpl.call(testContext15.ctx);
    (assert.deepEqual(value63.images, ['https://cdn.apimart.ai/omni-ref.png']),
      assert.deepEqual(value63.videos, ['https://cdn.apimart.ai/omni-feature.mp4']),
      assert.deepEqual(value63.inputUrlsBySlot, { referenceImage: 'https://cdn.apimart.ai/omni-ref.png' }));
    const targetId28 = 'node-apimart-kling-omni-edit',
      testContext16 = createTestContext({
        targetId: targetId28,
        nodeData: {
          id: targetId28,
          model: 'apimart/kling-v3-omni',
          provider: 'apimart',
          generationParams: { kling_v3_omni_mode: 'edit' },
        },
        nodes: {
          video1: {
            id: 'video1',
            type: 'source-video',
            videoUrl: 'https://cdn.apimart.ai/omni-base.mp4',
            videoDuration: 8,
          },
        },
        incomingEdges: [
          { id: 'edge-edit-video', sourceId: 'video1', targetId: targetId28, refSlot: 'editVideo' },
        ],
        prompt: 'omni edit mode',
      }),
      value64 = await testContext16.proto._buildPayloadImpl.call(testContext16.ctx);
    (assert.deepEqual(value64.images, []),
      assert.deepEqual(value64.videos, ['https://cdn.apimart.ai/omni-base.mp4']),
      assert.equal(value64.inputUrlsBySlot, undefined));
  }),
  test('video task orchestration: Kling O1 converts image mentions and validates video slots', async () => {
    const targetId29 = 'node-apimart-kling-o1-image',
      testContext17 = createTestContext({
        targetId: targetId29,
        nodeData: {
          id: targetId29,
          model: 'apimart/kling-video-o1',
          provider: 'apimart',
          generationParams: { resolution: 'pro', duration: 5 },
        },
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/o1-ref-1.png' },
          image2: { id: 'image2', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/o1-ref-2.png' },
        },
        incomingEdges: [
          { id: 'edge-reference-image', sourceId: 'image1', targetId: targetId29, refSlot: 'referenceImage' },
          { id: 'edge-extra-image', sourceId: 'image2', targetId: targetId29 },
        ],
        prompt: '让@图片1走向@图片2',
      }),
      value65 = await testContext17.proto._buildPayloadImpl.call(testContext17.ctx);
    (assert.equal(value65.prompt, '让<<<image_1>>>走向<<<image_2>>>'),
      assert.deepEqual(value65.images, [
        'https://cdn.apimart.ai/o1-ref-1.png',
        'https://cdn.apimart.ai/o1-ref-2.png',
      ]),
      assert.equal(value65.klingO1VideoRole, undefined));
    const targetId30 = 'node-apimart-kling-o1-feature',
      testContext18 = createTestContext({
        targetId: targetId30,
        nodeData: { id: targetId30, model: 'apimart/kling-video-o1', provider: 'apimart' },
        nodes: {
          image1: {
            id: 'image1',
            type: 'source-image',
            imageUrl: 'https://cdn.apimart.ai/o1-feature-ref.png',
          },
          video1: {
            id: 'video1',
            type: 'source-video',
            videoUrl: 'https://cdn.apimart.ai/o1-feature.mp4',
            videoDuration: 8,
          },
        },
        incomingEdges: [
          { id: 'edge-ref-image', sourceId: 'image1', targetId: targetId30, refSlot: 'referenceImage' },
          {
            id: 'edge-feature-video',
            sourceId: 'video1',
            targetId: targetId30,
            refSlot: 'featureReferenceVideo',
          },
        ],
        prompt: 'use @图片1 with feature video',
      }),
      value66 = await testContext18.proto._buildPayloadImpl.call(testContext18.ctx);
    (assert.equal(value66.prompt, 'use <<<image_1>>> with feature video'),
      assert.deepEqual(value66.images, ['https://cdn.apimart.ai/o1-feature-ref.png']),
      assert.deepEqual(value66.videos, ['https://cdn.apimart.ai/o1-feature.mp4']),
      assert.equal(value66.klingO1VideoRole, 'feature'));
    const value67 = globalThis.window.showToast,
      list12 = [];
    globalThis.window.showToast = (value68) => list12.push(String(value68 || ''));
    try {
      const testContext19 = createTestContext({
          targetId: 'node-apimart-kling-o1-invalid-video',
          nodeData: {
            id: 'node-apimart-kling-o1-invalid-video',
            model: 'apimart/kling-video-o1',
            provider: 'apimart',
          },
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/o1-long.mp4',
              videoDuration: 12,
            },
          },
          incomingEdges: [
            {
              id: 'edge-feature-video',
              sourceId: 'video1',
              targetId: 'node-apimart-kling-o1-invalid-video',
              refSlot: 'featureReferenceVideo',
            },
          ],
          prompt: 'feature video too long',
        }),
        value69 = await testContext19.proto._buildPayloadImpl.call(testContext19.ctx);
      (assert.equal(value69, null),
        assert.equal(
          list12.some((list13) => list13.includes('3-10')),
          true,
        ));
    } finally {
      globalThis.window.showToast = value67;
    }
  }),
  test('video task orchestration: HappyHorse mode filters media and requires prompt', async () => {
    const targetId31 = 'node-apimart-happyhorse-image',
      { proto: proto31, ctx: ctx31 } = createTestContext({
        targetId: targetId31,
        nodeData: {
          id: targetId31,
          model: 'apimart/happyhorse-1.0',
          provider: 'apimart',
          generationParams: { happyhorse_mode: 'image', duration: 5 },
        },
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/ref-1.png' },
          image2: { id: 'image2', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/ref-2.png' },
        },
        incomingEdges: [
          { id: 'edge-image-1', sourceId: 'image1', targetId: targetId31, refSlot: 'lastFrame' },
          { id: 'edge-image-2', sourceId: 'image2', targetId: targetId31, refSlot: 'firstFrame' },
        ],
        prompt: 'running horse',
      }),
      value70 = await proto31._buildPayloadImpl.call(ctx31);
    (assert.equal(value70.model, 'apimart/happyhorse-1.0'),
      assert.equal(value70.generationParams.happyhorse_mode, 'image'),
      assert.deepEqual(value70.images, ['https://cdn.apimart.ai/ref-2.png']),
      assert.deepEqual(value70.videos, []),
      assert.deepEqual(value70.inputUrls, ['https://cdn.apimart.ai/ref-2.png']),
      (ctx31.promptEl = createPromptEl('')));
    const list14 = [],
      value71 = globalThis.window.showToast;
    globalThis.window.showToast = (value72) => list14.push(String(value72 || ''));
    try {
      assert.equal(await proto31._buildPayloadImpl.call(ctx31), null);
    } finally {
      globalThis.window.showToast = value71;
    }
    assert.match(list14.join('\n'), /必须填写提示词/);
  }),
  test('video task orchestration: HappyHorse blocks incompatible video refs and long edits', async () => {
    const value73 = globalThis.window.showToast,
      list15 = [];
    globalThis.window.showToast = (value74) => list15.push(String(value74 || ''));
    try {
      const targetId32 = 'node-apimart-happyhorse-reference',
        testContext20 = createTestContext({
          targetId: targetId32,
          nodeData: {
            id: targetId32,
            model: 'apimart/happyhorse-1.0',
            provider: 'apimart',
            generationParams: { happyhorse_mode: 'reference' },
          },
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/source.mp4',
              videoDuration: 8,
            },
          },
          incomingEdges: [{ id: 'edge-video', sourceId: 'video1', targetId: targetId32 }],
          prompt: 'reference horse',
        });
      (assert.equal(await testContext20.proto._buildPayloadImpl.call(testContext20.ctx), null),
        assert.match(list15.join('\n'), /参考图生视频模式不接受视频入参/));
      const targetId33 = 'node-apimart-happyhorse-edit',
        testContext21 = createTestContext({
          targetId: targetId33,
          nodeData: {
            id: targetId33,
            model: 'apimart/happyhorse-1.0',
            provider: 'apimart',
            generationParams: { happyhorse_mode: 'edit' },
          },
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://cdn.apimart.ai/long-source.mp4',
              videoDuration: 16,
            },
          },
          incomingEdges: [{ id: 'edge-long-video', sourceId: 'video1', targetId: targetId33 }],
          prompt: 'edit horse',
        });
      (assert.equal(await testContext21.proto._buildPayloadImpl.call(testContext21.ctx), null),
        assert.match(list15.join('\n'), /不能超过 15 秒/),
        (list15.length = 0));
      const targetId34 = 'node-runninghub-happyhorse-edit',
        testContext22 = createTestContext({
          targetId: targetId34,
          nodeData: {
            id: targetId34,
            model: 'runninghub-model/happyhorse-1.0',
            provider: 'runninghub',
            generationParams: { happyhorse_mode: 'edit' },
          },
          nodes: {
            video1: {
              id: 'video1',
              type: 'source-video',
              videoUrl: 'https://www.runninghub.cn/assets/long-source.mp4',
              videoDuration: 30,
            },
          },
          incomingEdges: [{ id: 'edge-runninghub-video', sourceId: 'video1', targetId: targetId34 }],
          prompt: 'edit runninghub horse',
        }),
        value75 = await testContext22.proto._buildPayloadImpl.call(testContext22.ctx);
      (assert.equal(value75.model, 'runninghub-model/happyhorse-1.0'),
        assert.equal(value75.generationParams.happyhorse_mode, 'edit'),
        assert.deepEqual(value75.videos, ['https://www.runninghub.cn/assets/long-source.mp4']),
        assert.equal(list15.join('\n'), ''));
    } finally {
      globalThis.window.showToast = value73;
    }
  }),
  test('video task orchestration: /预设模板支持用户输入默认值', async () => {
    const id5 = 'node-video-template-fallback',
      nodeData2 = { id: id5, model: 'grsai-video-basic', provider: 'grsai' },
      { proto: proto32, ctx: ctx32 } = createTestContext({
        targetId: id5,
        nodeData: nodeData2,
        prompt: '',
      }),
      value76 = await proto32._buildPayloadImpl.call(ctx32, '镜头：{用户输入 || 默认视频描述}');
    (assert.ok(value76),
      assert.equal(value76.prompt, '镜头：默认视频描述'),
      (ctx32.promptEl = createPromptEl('夜景推镜')));
    const value77 = await proto32._buildPayloadImpl.call(ctx32, '镜头：{用户输入 || 默认视频描述}');
    (assert.ok(value77), assert.equal(value77.prompt, '镜头：夜景推镜'));
  }),
  test('video task orchestration: running RH store state cancels even when local flag is stale', async () => {
    const targetId35 = 'node-video-running-store-cancels',
      {
        proto: proto33,
        ctx: ctx33,
        state: state4,
      } = createTestContext({
        targetId: targetId35,
        nodeData: {
          id: targetId35,
          model: 'runninghub/2041741496667348994',
          provider: 'runninghubwf',
          rhTaskId: 'rh-running',
          rhTaskStatus: 'running',
          jobStatus: 'running',
          isGenerating: true,
        },
      });
    let value78 = 0,
      value79 = 0;
    ((ctx33._isGenerating = false),
      (ctx33._isRunninghubWorkflowModel = () => true),
      (ctx33._cancelRunningHubWorkflowTask = async () => {
        value78 += 1;
      }),
      (ctx33._onGenerate = async () => {
        value79 += 1;
      }),
      (state4.nodes[targetId35] = {
        ...state4.nodes[targetId35],
        rhTaskId: 'rh-running',
        rhTaskStatus: 'running',
        jobStatus: 'running',
        isGenerating: true,
      }),
      await proto33._handleGenerateOrCancelImpl.call(ctx33),
      assert.equal(value78, 1),
      assert.equal(value79, 0));
  }),
  test('video task orchestration: 预览模式下点击生成只启动假加载不发请求', async () => {
    const value80 = globalThis.window.PREVIEW_MODE;
    globalThis.window.PREVIEW_MODE = true;
    try {
      const targetId36 = 'node-video-preview-loading';
      let value81 = false;
      const { proto: proto34, ctx: ctx34 } = createTestContext({
        targetId: targetId36,
        nodeData: { id: targetId36, model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
      });
      ctx34.previewEl = createFakePreviewContainer();
      const videoNodeTaskOrchestrationModule = createVideoNodeTaskOrchestrationModule({
          store: {
            getState: () => ({
              nodes: {
                [targetId36]: { id: targetId36, model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
              },
            }),
            getIncomingEdges: () => [],
            updateNodeData() {},
          },
          api: {},
          getImage: async () => null,
          startLoading: () => {},
          stopLoading: () => {},
          ensureConfig: async () => {},
          getProviderConfig: () => ({ apiKey: '' }),
          isVideoVipModel: () => false,
          ensureVipSessionRecheck: async () => {
            value81 = true;
          },
        }),
        value82 = Object.assign(Object.create(videoNodeTaskOrchestrationModule), {
          nodeId: targetId36,
          _data: { id: targetId36, model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
          previewEl: createFakePreviewContainer(),
          promptEl: createPromptEl('测试视频'),
          btnEl: createButtonStub(),
          _guardVipSelection() {
            return true;
          },
          _buildPayload: async () => {
            throw new Error('预览模式不应构建真实 payload');
          },
        });
      (await videoNodeTaskOrchestrationModule._onGenerateImpl.call(value82),
        assert.equal(value81, false),
        assert.equal(isPreviewNodeLoading(targetId36), true),
        assert.equal(value82.btnEl.disabled, true),
        assert.match(value82.btnEl.innerHTML, /animation:spin/),
        stopPreviewNodeLoading(targetId36),
        assert.equal(value82.btnEl.disabled, false),
        assert.doesNotMatch(value82.btnEl.innerHTML, /animation:spin/));
    } finally {
      globalThis.window.PREVIEW_MODE = value80;
    }
  }),
  test('video task orchestration: duplicate submit during async preparation only calls generate once', async () => {
    const targetId37 = 'node-video-submit-lock';
    let value83 = 0,
      handler3;
    const value84 = new Promise((value85) => {
        handler3 = value85;
      }),
      { proto: proto35, ctx: ctx35 } = createTestContext({
        targetId: targetId37,
        nodeData: { id: targetId37, model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
        apiImpl: {
          generateVideo: async () => {
            return (
              (value83 += 1),
              { videoUrl: '/output/generated.mp4', localPath: '/output/generated.mp4' }
            );
          },
        },
      });
    ((ctx35.btnEl = createButtonStub()),
      (ctx35.previewEl = {}),
      (ctx35._guardVipSelection = () => true),
      (ctx35._buildPayload = async () => {
        return (
          await value84,
          { provider: 'dreamina', model: 'dreamina/seedance2.0fast', prompt: 'test prompt' }
        );
      }),
      (ctx35._stopDreaminaRecovery = () => {}),
      (ctx35._stopRunningHubRecovery = () => {}),
      (ctx35._stopAsyncRecovery = () => {}),
      (ctx35._persistAsyncResumeCache = () => {}),
      (ctx35._persistDreaminaResumeCache = () => {}),
      (ctx35._persistRunningHubResumeCache = () => {}),
      (ctx35._updateSubmitButtonState = () => {}));
    const value86 = proto35._onGenerateImpl.call(ctx35);
    assert.equal(ctx35._videoSubmitInFlight, true);
    const value87 = proto35._onGenerateImpl.call(ctx35);
    (handler3(),
      await Promise.all([value86, value87]),
      assert.equal(value83, 1),
      assert.equal(ctx35._videoSubmitInFlight, false));
  }),
  test('video task orchestration: Dreamina foreground submit blocks duplicate recovery poller', async () => {
    const targetId38 = 'node-video-submit-blocks-resume';
    let value88 = 0;
    const { proto: proto36, ctx: ctx36 } = createTestContext({
      targetId: targetId38,
      nodeData: {
        id: targetId38,
        model: 'dreamina/seedance2.0fast',
        provider: 'dreamina',
        dreaminaSubmitId: 'local-dreamina-video-active',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        jobStatus: 'running',
        isGenerating: true,
      },
      apiImpl: {
        resumeDreaminaVideoTask: async () => {
          return ((value88 += 1), {});
        },
      },
    });
    ((ctx36._isGenerating = true),
      (ctx36._videoSubmitInFlight = true),
      await proto36._maybeResumeDreaminaTaskImpl.call(ctx36),
      assert.equal(value88, 0),
      assert.equal(ctx36._dreaminaResumePromise, undefined));
  }),
  test('video task orchestration: start patch enters running state over stale terminal fields', async () => {
    const targetId39 = 'node-video-start-running';
    let value89 = 0,
      value90 = 0,
      handler4;
    const value91 = new Promise((value92) => {
        handler4 = value92;
      }),
      {
        proto: proto37,
        ctx: ctx37,
        state: state5,
      } = createTestContext({
        targetId: targetId39,
        nodeData: {
          id: targetId39,
          provider: 'apimart',
          model: 'apimart/video-model',
          isGenerating: false,
          jobStatus: 'success',
          jobError: null,
          generationDuration: 1234,
          asyncTaskStatus: 'success',
          rhTaskStatus: 'success',
          dreaminaTaskStatus: 'success',
          dreaminaTaskPhase: 'done',
        },
        apiImpl: { generateVideo: async () => value91 },
        startLoadingImpl: () => {
          value89 += 1;
        },
        stopLoadingImpl: () => {
          value90 += 1;
        },
      });
    ((ctx37._isGenerating = false),
      (ctx37.btnEl = createButtonStub()),
      (ctx37.previewEl = {}),
      (ctx37._guardVipSelection = () => true),
      (ctx37._buildPayload = async () => ({
        provider: 'apimart',
        model: 'apimart/video-model',
        prompt: 'test prompt',
      })),
      (ctx37._stopDreaminaRecovery = () => {}),
      (ctx37._stopRunningHubRecovery = () => {}),
      (ctx37._stopAsyncRecovery = () => {}),
      (ctx37._persistAsyncResumeCache = () => {}),
      (ctx37._persistDreaminaResumeCache = () => {}),
      (ctx37._persistRunningHubResumeCache = () => {}),
      (ctx37._updateSubmitButtonState = () => {}));
    const value93 = proto37._onGenerateImpl.call(ctx37);
    await flushUntil(() => state5.nodes[targetId39]?.asyncTaskStatus === 'pending');
    const value94 = state5.nodes[targetId39];
    (assert.equal(value89, 1),
      assert.equal(value90, 0),
      assert.equal(value94.isGenerating, true),
      assert.equal(value94.jobStatus, 'running'),
      assert.equal(value94.jobError, null),
      assert.equal(value94.generationDuration, null),
      assert.equal(value94.asyncTaskStatus, 'pending'),
      handler4({ videoUrl: '/output/generated.mp4', localPath: '/output/generated.mp4' }),
      await value93);
  }),
  test('video task orchestration: RH pending store state keeps cancel UI after submit returns without result', async () => {
    const targetId40 = 'node-video-rh-pending-keeps-cancel';
    let value95 = 0,
      handler5;
    const value96 = new Promise((value97) => {
        handler5 = value97;
      }),
      {
        proto: proto38,
        ctx: ctx38,
        state: state6,
      } = createTestContext({
        targetId: targetId40,
        nodeData: {
          id: targetId40,
          provider: 'runninghubwf',
          model: 'runninghub/1971148165531475969',
          isGenerating: false,
        },
        apiImpl: {
          generateVideo: async (value98, value99 = {}) => {
            return (
              value99.onTaskMeta?.({ taskId: 'rh-video-pending', useOpenapiQuery: true }),
              await value96
            );
          },
        },
        stopLoadingImpl: () => {
          value95 += 1;
        },
      });
    ((ctx38.btnEl = createButtonStub()),
      (ctx38.previewEl = {}),
      (ctx38._isRunninghubWorkflowModel = () => true),
      (ctx38._guardVipSelection = () => true),
      (ctx38._buildPayload = async () => ({
        provider: 'runninghubwf',
        model: 'runninghub/1971148165531475969',
        prompt: 'test prompt',
        apiKey: 'rh-key',
      })),
      (ctx38._stopDreaminaRecovery = () => {}),
      (ctx38._stopRunningHubRecovery = () => {}),
      (ctx38._stopAsyncRecovery = () => {}),
      (ctx38._persistAsyncResumeCache = () => {}),
      (ctx38._persistDreaminaResumeCache = () => {}),
      (ctx38._persistRunningHubResumeCache = () => {}));
    const value100 = proto38._onGenerateImpl.call(ctx38);
    await flushUntil(() => state6.nodes[targetId40]?.rhTaskStatus === 'running');
    const value101 = state6.nodes[targetId40];
    (assert.equal(value101.rhTaskStatus, 'running'),
      assert.equal(ctx38._isGenerating, true),
      assert.equal(ctx38._rhTaskId, 'rh-video-pending'),
      assert.equal(ctx38.btnEl.disabled, false),
      assert.match(ctx38.btnEl.innerHTML, /v2-task-cancel-spin/),
      assert.equal(value95, 0),
      handler5({ videoUrl: '/output/generated.mp4', localPath: '/output/generated.mp4' }),
      await value100);
  }),
  test('task orchestration: adaptive multimodal ratio uses node display ratio', async () => {
    const targetId41 = 'node-video-1',
      id6 = 'node-image-1',
      { proto: proto39, ctx: ctx39 } = createTestContext({
        targetId: targetId41,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 1700,
          height: 900,
          resolution: '720p',
          duration: 5,
        },
        nodes: { [id6]: { id: id6, type: 'source-image', localPath: 'data/uploads/ref.png' } },
        incomingEdges: [{ id: 'edge-1', sourceId: id6, targetId: targetId41, refSlot: '' }],
      }),
      value102 = await proto39._buildPayloadImpl.call(ctx39);
    (assert.equal(value102.dreaminaTaskType, 'multimodal2video'), assert.equal(value102.aspectRatio, '16:9'));
  }),
  test('task orchestration: frames fallback to text2video still uses adaptive mapping', async () => {
    const targetId42 = 'node-video-2',
      { proto: proto40, ctx: ctx40 } = createTestContext({
        targetId: targetId42,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '自适应',
          width: 1700,
          height: 900,
          resolution: '720p',
          duration: 5,
        },
        incomingEdges: [],
      }),
      value103 = await proto40._buildPayloadImpl.call(ctx40);
    (assert.equal(value103.dreaminaTaskType, 'text2video'), assert.equal(value103.aspectRatio, '16:9'));
  }),
  test('task orchestration: fixed ratio is preserved with image references', async () => {
    const targetId43 = 'node-video-3',
      id7 = 'node-image-3',
      { proto: proto41, ctx: ctx41 } = createTestContext({
        targetId: targetId43,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '4:3',
          width: 1700,
          height: 900,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id7]: { id: id7, type: 'source-image', localPath: 'data/uploads/ref-fixed.png' },
        },
        incomingEdges: [{ id: 'edge-3', sourceId: id7, targetId: targetId43, refSlot: '' }],
      }),
      value104 = await proto41._buildPayloadImpl.call(ctx41);
    (assert.equal(value104.dreaminaTaskType, 'multimodal2video'), assert.equal(value104.aspectRatio, '4:3'));
  }),
  test('task orchestration: text ref-pill is resolved into payload prompt', async () => {
    const targetId44 = 'node-video-text-pill',
      id8 = 'node-video-text-ref-pill',
      { proto: proto42, ctx: ctx42 } = createTestContext({
        targetId: targetId44,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: { [id8]: { id: id8, type: 'source-text', text: '来自文本节点的描述' } },
        incomingEdges: [{ id: 'edge-video-text-pill', sourceId: id8, targetId: targetId44, refSlot: '' }],
        promptEl: createPromptEl([
          createPromptTextNode('镜头 '),
          createPromptPillNode('@文本1', id8),
          createPromptTextNode(' 推进'),
        ]),
      }),
      value105 = await proto42._buildPayloadImpl.call(ctx42);
    assert.equal(value105.prompt, '镜头 来自文本节点的描述 推进');
  }),
  test('task orchestration: plain-text text mention is resolved into payload prompt', async () => {
    const targetId45 = 'node-video-text-mention',
      id9 = 'node-video-text-ref-mention',
      { proto: proto43, ctx: ctx43 } = createTestContext({
        targetId: targetId45,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: { [id9]: { id: id9, type: 'source-text', outputText: '直接替换的文本内容' } },
        incomingEdges: [{ id: 'edge-video-text-mention', sourceId: id9, targetId: targetId45, refSlot: '' }],
        prompt: '镜头 @文本1 推进',
      }),
      value106 = await proto43._buildPayloadImpl.call(ctx43);
    assert.equal(value106.prompt, '镜头 直接替换的文本内容 推进');
  }),
  test('task orchestration: unreferenced text inputs are prepended to payload prompt', async () => {
    const targetId46 = 'node-video-text-prepend',
      id10 = 'node-video-text-ref-prepend',
      { proto: proto44, ctx: ctx44 } = createTestContext({
        targetId: targetId46,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: { [id10]: { id: id10, type: 'source-text', content: '前置的文本入参' } },
        incomingEdges: [{ id: 'edge-video-text-prepend', sourceId: id10, targetId: targetId46, refSlot: '' }],
        prompt: '主体出场',
      }),
      value107 = await proto44._buildPayloadImpl.call(ctx44);
    assert.equal(value107.prompt, '前置的文本入参\n主体出场');
  }),
  test('task orchestration: ai-text input without output uses prompt as text content', async () => {
    const targetId47 = 'node-video-ai-text-prompt',
      id11 = 'node-video-ai-text-prompt-ref',
      { proto: proto45, ctx: ctx45 } = createTestContext({
        targetId: targetId47,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: { [id11]: { id: id11, type: 'ai-text', prompt: '来自生成文本节点的提示词' } },
        incomingEdges: [
          { id: 'edge-video-ai-text-prompt', sourceId: id11, targetId: targetId47, refSlot: '' },
        ],
        prompt: '主体出场',
      }),
      value108 = await proto45._buildPayloadImpl.call(ctx45);
    assert.equal(value108.prompt, '来自生成文本节点的提示词\n主体出场');
  }),
  test('task orchestration: text inputs do not change existing media inputUrls', async () => {
    const targetId48 = 'node-video-text-media',
      id12 = 'node-video-text-ref-media',
      id13 = 'node-video-image-ref-media',
      { proto: proto46, ctx: ctx46 } = createTestContext({
        targetId: targetId48,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id12]: { id: id12, type: 'source-text', text: '补充画面描述' },
          [id13]: {
            id: id13,
            type: 'source-image',
            originalLocalPath: 'data/uploads/video-ref-image.png',
            imageUrl: 'https://img.example.com/video-ref-image.png',
          },
        },
        incomingEdges: [
          { id: 'edge-video-text-media-text', sourceId: id12, targetId: targetId48, refSlot: '' },
          { id: 'edge-video-text-media-image', sourceId: id13, targetId: targetId48, refSlot: '' },
        ],
        prompt: '主体 @文本1',
      }),
      value109 = await proto46._buildPayloadImpl.call(ctx46);
    (assert.equal(value109.prompt, '主体 补充画面描述'),
      assert.deepEqual(value109.inputUrls, ['/data/uploads/video-ref-image.png']));
  }),
  test('task orchestration: video inputUrls prefer original image path', async () => {
    const targetId49 = 'node-video-original-input',
      id14 = 'node-image-original-input',
      { proto: proto47, ctx: ctx47 } = createTestContext({
        targetId: targetId49,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id14]: {
            id: id14,
            type: 'source-image',
            originalLocalPath: 'data/uploads/video-original.png',
            displayLocalPath: 'data/uploads/video-display.webp',
            thumbLocalPath: 'data/uploads/video-thumb.webp',
            imageUrl: 'https://img.example.com/video-display.png',
            thumbUrl: 'https://img.example.com/video-thumb.png',
          },
        },
        incomingEdges: [
          { id: 'edge-video-original-input', sourceId: id14, targetId: targetId49, refSlot: '' },
        ],
      }),
      value110 = await proto47._buildPayloadImpl.call(ctx47);
    assert.deepEqual(value110.inputUrls, ['/data/uploads/video-original.png']);
  }),
  test('task orchestration: video media inputUrls follow incoming edge order', async () => {
    const targetId50 = 'node-video-ordered-inputs',
      id15 = 'node-video-ordered-image-a',
      id16 = 'node-video-ordered-image-b',
      { proto: proto48, ctx: ctx48 } = createTestContext({
        targetId: targetId50,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id15]: {
            id: id15,
            type: 'source-image',
            originalLocalPath: 'data/uploads/ordered-a.png',
            imageUrl: 'https://img.example.com/a.png',
          },
          [id16]: {
            id: id16,
            type: 'source-image',
            originalLocalPath: 'data/uploads/ordered-b.png',
            imageUrl: 'https://img.example.com/b.png',
          },
        },
        incomingEdges: [
          { id: 'edge-video-ordered-b', sourceId: id16, targetId: targetId50, refSlot: '' },
          { id: 'edge-video-ordered-a', sourceId: id15, targetId: targetId50, refSlot: '' },
        ],
      }),
      value111 = await proto48._buildPayloadImpl.call(ctx48);
    assert.deepEqual(value111.inputUrls, ['/data/uploads/ordered-b.png', '/data/uploads/ordered-a.png']);
  }),
  test('task orchestration: asset image mentions send type placeholders in prompt order', async () => {
    const targetId51 = 'node-video-asset-image-mentions';
    setAssetMentionAssets([
      {
        id: 'asset-characters',
        name: 'characters',
        items: [
          {
            name: 'person1',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/person1.png' },
          },
          {
            name: 'person2',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/person2.png' },
          },
        ],
      },
    ]);
    const { proto: proto49, ctx: ctx49 } = createTestContext({
        targetId: targetId51,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        promptEl: createPromptEl([
          createPromptTextNode('use '),
          createAssetPromptPillNode('person2', 'asset-characters', 1, 'image'),
          createPromptTextNode(' then '),
          createAssetPromptPillNode('person1', 'asset-characters', 0, 'image'),
        ]),
      }),
      value112 = await proto49._buildPayloadImpl.call(ctx49);
    (assert.equal(value112.prompt, 'use @图片1 then @图片2'),
      assert.deepEqual(value112.inputUrls, ['/data/assets/person2.png', '/data/assets/person1.png']));
  }),
  test('task orchestration: asset video and audio mentions satisfy lip-sync fixed inputs', async () => {
    const targetId52 = 'node-video-asset-lipsync';
    setAssetMentionAssets([
      {
        id: 'asset-av',
        items: [
          {
            name: 'clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/clip.mp4', videoDuration: 5 },
          },
          {
            name: 'voice',
            type: 'source-audio',
            nodeData: { type: 'source-audio', localPath: 'data/assets/voice.mp3', duration: 5 },
          },
        ],
      },
    ]);
    const { proto: proto50, ctx: ctx50 } = createTestContext({
      targetId: targetId52,
      nodeData: {
        provider: 'runninghubwf',
        model: 'runninghub/2054101324521844738',
        rhVideoFrames: 120,
        rhVideoResolution: 832,
        generationParams: { rhInstanceType: 'default' },
      },
      promptEl: createPromptEl([
        createAssetPromptPillNode('clip', 'asset-av', 0, 'video'),
        createPromptTextNode(' lip sync '),
        createAssetPromptPillNode('voice', 'asset-av', 1, 'audio'),
      ]),
    });
    ctx50._isRunninghubWorkflowModel = () => true;
    const value113 = await proto50._buildPayloadImpl.call(ctx50);
    (assert.equal(value113.prompt, '@视频1 lip sync @音频1'),
      assert.equal(value113.videoUrl, '/data/assets/clip.mp4'),
      assert.equal(value113.audioUrl, '/data/assets/voice.mp3'),
      assert.deepEqual(value113.inputUrls, []));
  }),
  test('task orchestration: hidden asset video and audio refs satisfy lip-sync fixed inputs', async () => {
    const targetId53 = 'node-video-hidden-asset-lipsync';
    setAssetMentionAssets([
      {
        id: 'asset-av-hidden',
        items: [
          {
            name: 'clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/hidden-clip.mp4', videoDuration: 5 },
          },
          {
            name: 'voice',
            type: 'source-audio',
            nodeData: { type: 'source-audio', localPath: 'data/assets/hidden-voice.mp3', duration: 5 },
          },
        ],
      },
    ]);
    const { proto: proto51, ctx: ctx51 } = createTestContext({
      targetId: targetId53,
      nodeData: {
        provider: 'runninghubwf',
        model: 'runninghub/2054101324521844738',
        rhVideoFrames: 120,
        rhVideoResolution: 832,
        generationParams: { rhInstanceType: 'default' },
        promptAssetInputRefs: [
          { assetId: 'asset-av-hidden', itemIndex: 0, type: 'video' },
          { assetId: 'asset-av-hidden', itemIndex: 1, type: 'audio' },
        ],
      },
      prompt: 'lip sync',
    });
    ctx51._isRunninghubWorkflowModel = () => true;
    const value114 = await proto51._buildPayloadImpl.call(ctx51);
    (assert.equal(value114.prompt, 'lip sync'),
      assert.equal(value114.videoUrl, '/data/assets/hidden-clip.mp4'),
      assert.equal(value114.audioUrl, '/data/assets/hidden-voice.mp3'),
      assert.deepEqual(value114.inputUrls, []));
  }),
  test('task orchestration: dreamina frames use incoming edge order for first and last images', async () => {
    const targetId54 = 'node-video-dreamina-ordered-frames',
      id17 = 'node-video-dreamina-frame-a',
      id18 = 'node-video-dreamina-frame-b',
      { proto: proto52, ctx: ctx52 } = createTestContext({
        targetId: targetId54,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id17]: {
            id: id17,
            type: 'source-image',
            originalLocalPath: 'data/uploads/dreamina-frame-first.png',
            imageUrl: 'https://img.example.com/first.png',
          },
          [id18]: {
            id: id18,
            type: 'source-image',
            originalLocalPath: 'data/uploads/dreamina-frame-last.png',
            imageUrl: 'https://img.example.com/last.png',
          },
        },
        incomingEdges: [
          { id: 'edge-video-dreamina-last-first', sourceId: id18, targetId: targetId54, refSlot: '' },
          { id: 'edge-video-dreamina-first-last', sourceId: id17, targetId: targetId54, refSlot: '' },
        ],
        prompt: 'make it move',
      }),
      value115 = await proto52._buildPayloadImpl.call(ctx52);
    (assert.equal(value115.dreaminaTaskType, 'frames2video'),
      assert.equal(value115.first, '/data/uploads/dreamina-frame-last.png'),
      assert.equal(value115.last, '/data/uploads/dreamina-frame-first.png'),
      assert.deepEqual(value115.inputUrls, [
        '/data/uploads/dreamina-frame-last.png',
        '/data/uploads/dreamina-frame-first.png',
      ]));
  }),
  test('task orchestration: runninghub fixed slots are resolved by refSlot', async () => {
    const targetId55 = 'node-video-rh-fixed-slots',
      id19 = 'node-video-rh-source-video',
      id20 = 'node-video-rh-mask-video',
      id21 = 'node-video-rh-ref-image',
      id22 = 'node-video-rh-first-frame',
      { proto: proto53, ctx: ctx53 } = createTestContext({
        targetId: targetId55,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2041741496667348994',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
          rhVideoFps: 30,
          rhVideoFrames: 88,
          generationParams: { rhInstanceType: 'default' },
        },
        nodes: {
          [id19]: { id: id19, type: 'source-video', localPath: 'data/uploads/source.mp4' },
          [id20]: { id: id20, type: 'source-video', localPath: 'data/uploads/mask.mp4' },
          [id21]: {
            id: id21,
            type: 'source-image',
            originalLocalPath: 'data/uploads/ref.png',
            imageUrl: 'https://img.example.com/ref.png',
          },
          [id22]: {
            id: id22,
            type: 'source-image',
            originalLocalPath: 'data/uploads/first-frame.png',
            imageUrl: 'https://img.example.com/first-frame.png',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-rh-first-frame',
            sourceId: id22,
            targetId: targetId55,
            refSlot: 'firstFrame',
          },
          { id: 'edge-video-rh-mask', sourceId: id20, targetId: targetId55, refSlot: 'videoMask' },
          { id: 'edge-video-rh-ref-image', sourceId: id21, targetId: targetId55, refSlot: 'refImage' },
          { id: 'edge-video-rh-source', sourceId: id19, targetId: targetId55, refSlot: 'sourceVideo' },
        ],
        prompt: 'edit video',
      }),
      value116 = await proto53._buildPayloadImpl.call(ctx53);
    (assert.equal(value116.videoUrl, '/data/uploads/source.mp4'),
      assert.deepEqual(value116.inputUrls, ['/data/uploads/ref.png']),
      assert.equal(value116.firstFrameUrl, '/data/uploads/first-frame.png'),
      assert.equal(value116.maskVideoUrl, '/data/uploads/mask.mp4'),
      assert.equal(value116.rhVideoFps, 30),
      assert.equal(value116.frameRate, 30),
      assert.equal(value116.frameCount, 88));
  }),
  test('task orchestration: 视频去字幕V2 uses one source video and schema params', async () => {
    const targetId56 = 'node-video-rh-watermark-v2',
      id23 = 'node-video-rh-watermark-source',
      id24 = 'node-video-rh-watermark-mask',
      { proto: proto54, ctx: ctx54 } = createTestContext({
        targetId: targetId56,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2060613773890768898',
          generationParams: {
            rhWatermarkRemoveMode: 'mode2',
            rhRemoveWatermark: true,
            rhVideoFps: 30,
            rhVideoFrames: 12,
            rhVideoResolution: 960,
            rhInstanceType: 'default',
          },
        },
        nodes: {
          [id23]: {
            id: id23,
            type: 'source-video',
            localPath: 'data/uploads/source-watermark.mp4',
          },
          [id24]: {
            id: id24,
            type: 'source-image',
            originalLocalPath: 'data/uploads/mask-source.png',
            imageUrl: 'https://img.example.com/mask-source.png',
            mask: 'data/uploads/manual-mask.png',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-rh-watermark-source',
            sourceId: id23,
            targetId: targetId56,
            refSlot: 'sourceVideo',
          },
          {
            id: 'edge-video-rh-watermark-mask',
            sourceId: id24,
            targetId: targetId56,
            refSlot: 'maskImage',
          },
        ],
      }),
      value117 = await proto54._buildPayloadImpl.call(ctx54);
    (assert.equal(value117.videoUrl, '/data/uploads/source-watermark.mp4'),
      assert.equal(value117.maskImageDataUrl, '/data/uploads/manual-mask.png'),
      assert.equal(value117.rhVideoFps, 30),
      assert.equal(value117.rhVideoFrames, 12),
      assert.equal(value117.rhVideoResolution, 960),
      assert.equal(value117.generationParams.rhWatermarkRemoveMode, 'mode2'),
      assert.equal(value117.generationParams.rhRemoveWatermark, true));
  }),
  test('task orchestration: 视频去字幕V2 ignores stale mask edge in mode1', async () => {
    const targetId57 = 'node-video-rh-watermark-v2-mode1',
      id25 = 'node-video-rh-watermark-mode1-source',
      id26 = 'node-video-rh-watermark-mode1-mask',
      { proto: proto55, ctx: ctx55 } = createTestContext({
        targetId: targetId57,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2060613773890768898',
          generationParams: {
            rhWatermarkRemoveMode: 'mode1',
            rhRemoveWatermark: false,
            rhVideoFps: 24,
            rhVideoFrames: 0,
            rhVideoResolution: 960,
            rhInstanceType: 'default',
          },
        },
        nodes: {
          [id25]: {
            id: id25,
            type: 'source-video',
            localPath: 'data/uploads/source-watermark-mode1.mp4',
          },
          [id26]: {
            id: id26,
            type: 'source-image',
            originalLocalPath: 'data/uploads/mask-mode1-source.png',
            imageUrl: 'https://img.example.com/mask-mode1-source.png',
            mask: 'data/uploads/manual-mask-mode1.png',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-rh-watermark-mode1-source',
            sourceId: id25,
            targetId: targetId57,
            refSlot: 'sourceVideo',
          },
          {
            id: 'edge-video-rh-watermark-mode1-mask',
            sourceId: id26,
            targetId: targetId57,
            refSlot: 'maskImage',
          },
        ],
      }),
      value118 = await proto55._buildPayloadImpl.call(ctx55);
    (assert.equal(value118.videoUrl, '/data/uploads/source-watermark-mode1.mp4'),
      assert.equal(value118.maskImageDataUrl, undefined),
      assert.equal(value118.generationParams.rhWatermarkRemoveMode, 'mode1'));
  }),
  test('task orchestration: V5.4 asset mentions fill fixed input slots', async () => {
    const targetId58 = 'node-video-rh-asset-fixed-slots';
    setAssetMentionAssets([
      {
        id: 'asset-v54',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            nodeData: {
              type: 'source-video',
              localPath: 'data/assets/source.mp4',
              thumbUrl: '/data/assets/source-thumb.jpg',
            },
          },
          {
            name: 'mask clip',
            type: 'source-video',
            nodeData: {
              type: 'source-video',
              localPath: 'data/assets/mask.mp4',
              thumbUrl: '/data/assets/mask-thumb.jpg',
            },
          },
          {
            name: 'reference image',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
          },
          {
            name: 'first frame',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/first-frame.png' },
          },
        ],
      },
    ]);
    const { proto: proto56, ctx: ctx56 } = createTestContext({
        targetId: targetId58,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2041741496667348994',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
          rhSubtractSubject: false,
          generationParams: { rhInstanceType: 'default' },
        },
        promptEl: createPromptEl([
          createAssetPromptPillNode('source clip', 'asset-v54', 0, 'video'),
          createPromptTextNode(' edit with '),
          createAssetPromptPillNode('mask clip', 'asset-v54', 1, 'video'),
          createPromptTextNode(' and '),
          createAssetPromptPillNode('reference image', 'asset-v54', 2, 'image'),
          createPromptTextNode(' to '),
          createAssetPromptPillNode('first frame', 'asset-v54', 3, 'image'),
        ]),
      }),
      value119 = await proto56._buildPayloadImpl.call(ctx56);
    (assert.equal(value119.videoUrl, '/data/assets/source.mp4'),
      assert.equal(value119.maskVideoUrl, '/data/assets/mask.mp4'),
      assert.deepEqual(value119.inputUrls, ['/data/assets/ref.png']),
      assert.equal(value119.firstFrameUrl, '/data/assets/first-frame.png'));
  }),
  test('task orchestration: V5.4 subtract hides mask video and first frame asset mentions', async () => {
    const targetId59 = 'node-video-rh-asset-hidden-fixed-slots';
    setAssetMentionAssets([
      {
        id: 'asset-v54-hidden',
        items: [
          {
            name: 'source clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/source.mp4' },
          },
          {
            name: 'mask clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/mask.mp4' },
          },
          {
            name: 'reference image',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
          },
          {
            name: 'first frame',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/first-frame.png' },
          },
        ],
      },
    ]);
    const { proto: proto57, ctx: ctx57 } = createTestContext({
        targetId: targetId59,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2041741496667348994',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
          rhSubtractSubject: true,
          generationParams: { rhInstanceType: 'default' },
        },
        promptEl: createPromptEl([
          createAssetPromptPillNode('source clip', 'asset-v54-hidden', 0, 'video'),
          createAssetPromptPillNode('mask clip', 'asset-v54-hidden', 1, 'video'),
          createAssetPromptPillNode('reference image', 'asset-v54-hidden', 2, 'image'),
          createAssetPromptPillNode('first frame', 'asset-v54-hidden', 3, 'image'),
        ]),
      }),
      value120 = await proto57._buildPayloadImpl.call(ctx57);
    (assert.equal(value120.videoUrl, '/data/assets/source.mp4'),
      assert.equal(value120.maskVideoUrl, undefined),
      assert.deepEqual(value120.inputUrls, ['/data/assets/ref.png']),
      assert.equal(value120.firstFrameUrl, undefined),
      assert.equal(value120.subtractSubject, true));
  }),
  test('task orchestration: V5.4 connected inputs take priority and assets fill empty slots', async () => {
    const targetId60 = 'node-video-rh-asset-empty-slot-fill',
      id27 = 'node-video-rh-connected-source';
    setAssetMentionAssets([
      {
        id: 'asset-v54-fill',
        items: [
          {
            name: 'mask clip',
            type: 'source-video',
            nodeData: { type: 'source-video', localPath: 'data/assets/mask.mp4' },
          },
          {
            name: 'reference image',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/ref.png' },
          },
        ],
      },
    ]);
    const { proto: proto58, ctx: ctx58 } = createTestContext({
        targetId: targetId60,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2041741496667348994',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
          rhSubtractSubject: false,
          generationParams: { rhInstanceType: 'default' },
        },
        nodes: { [id27]: { id: id27, type: 'source-video', localPath: 'data/uploads/source.mp4' } },
        incomingEdges: [
          {
            id: 'edge-video-rh-connected-source',
            sourceId: id27,
            targetId: targetId60,
            refSlot: 'sourceVideo',
          },
        ],
        promptEl: createPromptEl([
          createAssetPromptPillNode('mask clip', 'asset-v54-fill', 0, 'video'),
          createAssetPromptPillNode('reference image', 'asset-v54-fill', 1, 'image'),
        ]),
      }),
      value121 = await proto58._buildPayloadImpl.call(ctx58);
    (assert.equal(value121.videoUrl, '/data/uploads/source.mp4'),
      assert.equal(value121.maskVideoUrl, '/data/assets/mask.mp4'),
      assert.deepEqual(value121.inputUrls, ['/data/assets/ref.png']));
  }),
  test('task orchestration: V5.4 connected video inputs accept display local paths', async () => {
    const targetId61 = 'node-video-rh-display-local-path',
      id28 = 'node-video-rh-display-source',
      id29 = 'node-video-rh-display-mask',
      { proto: proto59, ctx: ctx59 } = createTestContext({
        targetId: targetId61,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2041741496667348994',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
          rhSubtractSubject: false,
          generationParams: { rhInstanceType: 'default' },
        },
        nodes: {
          [id28]: {
            id: id28,
            type: 'source-video',
            displayLocalPath: 'data/uploads/source-display.mp4',
          },
          [id29]: {
            id: id29,
            type: 'source-video',
            displayLocalPath: 'data/uploads/mask-display.mp4',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-rh-display-source',
            sourceId: id28,
            targetId: targetId61,
            refSlot: 'sourceVideo',
          },
          {
            id: 'edge-video-rh-display-mask',
            sourceId: id29,
            targetId: targetId61,
            refSlot: 'videoMask',
          },
        ],
      }),
      value122 = await proto59._buildPayloadImpl.call(ctx59);
    (assert.equal(value122.videoUrl, '/data/uploads/source-display.mp4'),
      assert.equal(value122.maskVideoUrl, '/data/uploads/mask-display.mp4'));
  }),
  test('task orchestration: dreamina video images prefer original image path', async () => {
    const targetId62 = 'node-video-dreamina-original-input',
      id30 = 'node-image-dreamina-original-input',
      { proto: proto60, ctx: ctx60 } = createTestContext({
        targetId: targetId62,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 1600,
          height: 900,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id30]: {
            id: id30,
            type: 'source-image',
            originalLocalPath: 'data/uploads/dreamina-video-original.png',
            displayLocalPath: 'data/uploads/dreamina-video-display.webp',
            thumbLocalPath: 'data/uploads/dreamina-video-thumb.webp',
            imageUrl: 'https://img.example.com/dreamina-video-display.png',
            thumbUrl: 'https://img.example.com/dreamina-video-thumb.png',
          },
        },
        incomingEdges: [
          { id: 'edge-dreamina-video-original-input', sourceId: id30, targetId: targetId62, refSlot: '' },
        ],
      }),
      value123 = await proto60._buildPayloadImpl.call(ctx60);
    (assert.deepEqual(value123.images, ['/data/uploads/dreamina-video-original.png']),
      assert.deepEqual(value123.inputUrls, ['/data/uploads/dreamina-video-original.png']));
  }),
  test('task orchestration: apimart 即梦视频复用首尾帧 payload 且保留 APIMart provider', async () => {
    const targetId63 = 'node-video-apimart-seedance-frames',
      id31 = 'node-image-apimart-first',
      id32 = 'node-image-apimart-last',
      { proto: proto61, ctx: ctx61 } = createTestContext({
        targetId: targetId63,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-2.0-fast',
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id31]: {
            id: id31,
            type: 'source-image',
            originalLocalPath: 'data/uploads/apimart-first.png',
            imageUrl: 'https://img.example.com/apimart-first.png',
          },
          [id32]: {
            id: id32,
            type: 'source-image',
            originalLocalPath: 'data/uploads/apimart-last.png',
            imageUrl: 'https://img.example.com/apimart-last.png',
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-first', sourceId: id31, targetId: targetId63, refSlot: '' },
          { id: 'edge-apimart-last', sourceId: id32, targetId: targetId63, refSlot: '' },
        ],
        prompt: 'make a smooth transition',
      }),
      value124 = await proto61._buildPayloadImpl.call(ctx61);
    (assert.equal(value124.provider, 'apimart'),
      assert.equal(value124.model, 'apimart/doubao-seedance-2.0-fast'),
      assert.equal(value124.dreaminaTaskType, 'frames2video'),
      assert.equal(value124.first, '/data/uploads/apimart-first.png'),
      assert.equal(value124.last, '/data/uploads/apimart-last.png'),
      assert.equal(value124.aspectRatio, '16:9'),
      assert.equal(value124.resolution, '720p'),
      assert.equal('modelVersion' in value124, false),
      assert.deepEqual(value124.images, [
        '/data/uploads/apimart-first.png',
        '/data/uploads/apimart-last.png',
      ]));
  }),
  test('task orchestration: APIMart 人脸检测结果作为 providerAssetRefs 进入 payload', async () => {
    const targetId64 = 'node-video-apimart-private-avatar-payload',
      id33 = 'node-image-apimart-private-first',
      id34 = 'node-image-apimart-private-last',
      { proto: proto62, ctx: ctx62 } = createTestContext({
        targetId: targetId64,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-2.0-fast',
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id33]: {
            id: id33,
            type: 'source-image',
            originalLocalPath: 'data/uploads/private-first.png',
            providerAssetRefs: {
              apimartSeedance2PrivateAvatar: {
                provider: 'apimart',
                capability: 'seedance2PrivateAvatar',
                status: 'passed',
                sourceKind: 'image',
                sourceUrl: '/data/uploads/private-first.png',
                assetUrl: 'asset://private-first',
              },
            },
          },
          [id34]: {
            id: id34,
            type: 'source-image',
            originalLocalPath: 'data/uploads/private-last.png',
            providerAssetRefs: {
              apimartSeedance2PrivateAvatar: {
                provider: 'apimart',
                capability: 'seedance2PrivateAvatar',
                status: 'passed',
                sourceKind: 'image',
                sourceUrl: '/data/uploads/private-last.png',
                assetUrl: 'asset://private-last',
              },
            },
          },
        },
        incomingEdges: [
          { id: 'edge-private-first', sourceId: id33, targetId: targetId64 },
          { id: 'edge-private-last', sourceId: id34, targetId: targetId64 },
        ],
        prompt: 'make a smooth transition',
      }),
      value125 = await proto62._buildPayloadImpl.call(ctx62);
    (assert.deepEqual(value125.images, ['/data/uploads/private-first.png', '/data/uploads/private-last.png']),
      assert.deepEqual(
        value125.providerAssetRefs.map((capability) => ({
          capability: capability.capability,
          sourceUrl: capability.sourceUrl,
          assetUrl: capability.assetUrl,
        })),
        [
          {
            capability: 'seedance2PrivateAvatar',
            sourceUrl: '/data/uploads/private-first.png',
            assetUrl: 'asset://private-first',
          },
          {
            capability: 'seedance2PrivateAvatar',
            sourceUrl: '/data/uploads/private-last.png',
            assetUrl: 'asset://private-last',
          },
        ],
      ));
  }),
  test('task orchestration: apimart Seedance 1.5 自适应竖图会提交明确竖屏比例', async () => {
    const targetId65 = 'node-video-apimart-seedance-15-adaptive',
      id35 = 'node-image-apimart-portrait',
      { proto: proto63, ctx: ctx63 } = createTestContext({
        targetId: targetId65,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-1-5-pro',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 1600,
          height: 900,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id35]: {
            id: id35,
            type: 'source-image',
            originalLocalPath: 'data/uploads/portrait.png',
            originalWidth: 720,
            originalHeight: 1280,
          },
        },
        incomingEdges: [{ id: 'edge-apimart-portrait', sourceId: id35, targetId: targetId65, refSlot: '' }],
        prompt: 'make it move',
      }),
      value126 = await proto63._buildPayloadImpl.call(ctx63);
    (assert.equal(value126.provider, 'apimart'),
      assert.equal(value126.model, 'apimart/doubao-seedance-1-5-pro'),
      assert.equal(value126.aspectRatio, '9:16'),
      assert.deepEqual(value126.images, ['/data/uploads/portrait.png']));
  }),
  test('task orchestration: apimart Seedance 1.0 自适应竖图会提交明确竖屏比例', async () => {
    const targetId66 = 'node-video-apimart-seedance-10-adaptive',
      id36 = 'node-image-apimart-portrait-10',
      { proto: proto64, ctx: ctx64 } = createTestContext({
        targetId: targetId66,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-1-0-pro-quality',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 1600,
          height: 900,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id36]: {
            id: id36,
            type: 'source-image',
            originalLocalPath: 'data/uploads/portrait-10.png',
            originalWidth: 720,
            originalHeight: 1280,
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-portrait-10', sourceId: id36, targetId: targetId66, refSlot: '' },
        ],
        prompt: 'make it move',
      }),
      value127 = await proto64._buildPayloadImpl.call(ctx64);
    (assert.equal(value127.provider, 'apimart'),
      assert.equal(value127.model, 'apimart/doubao-seedance-1-0-pro-quality'),
      assert.equal(value127.aspectRatio, '9:16'),
      assert.deepEqual(value127.images, ['/data/uploads/portrait-10.png']));
  }),
  test('task orchestration: apimart Seedance 2.0 有入参时自适应按入参比例兜底', async () => {
    const targetId67 = 'node-video-apimart-seedance-20-adaptive',
      id37 = 'node-image-apimart-portrait-20',
      { proto: proto65, ctx: ctx65 } = createTestContext({
        targetId: targetId67,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-2.0-fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 1600,
          height: 900,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [id37]: {
            id: id37,
            type: 'source-image',
            originalLocalPath: 'data/uploads/portrait-20.png',
            originalWidth: 720,
            originalHeight: 1280,
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-portrait-20', sourceId: id37, targetId: targetId67, refSlot: '' },
        ],
        prompt: 'make it move',
      }),
      value128 = await proto65._buildPayloadImpl.call(ctx65);
    (assert.equal(value128.provider, 'apimart'),
      assert.equal(value128.model, 'apimart/doubao-seedance-2.0-fast'),
      assert.equal(value128.aspectRatio, '9:16'));
  }),
  test('task orchestration: apimart Seedance 2.0 无入参时按显示比例解析自适应', async () => {
    const targetId68 = 'node-video-apimart-seedance-20-text-adaptive',
      { proto: proto66, ctx: ctx66 } = createTestContext({
        targetId: targetId68,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-2.0-fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 1600,
          height: 900,
          resolution: '720p',
          duration: 5,
        },
        prompt: 'text only video',
      }),
      value129 = await proto66._buildPayloadImpl.call(ctx66);
    (assert.equal(value129.provider, 'apimart'),
      assert.equal(value129.model, 'apimart/doubao-seedance-2.0-fast'),
      assert.equal(value129.dreaminaTaskType, 'text2video'),
      assert.equal(value129.aspectRatio, '16:9'));
  }),
  test('task orchestration: dreamina VIP 缺少 installId 时阻断提交', async () => {
    const value130 = globalThis.window.showToast,
      list16 = [];
    globalThis.window.showToast = (value131) => {
      list16.push(String(value131 || ''));
    };
    const videoNodeTaskOrchestrationModule2 = createVideoNodeTaskOrchestrationModule({
        store: {
          getStateRaw: () => ({ nodes: {} }),
          getState: () => ({ nodes: {} }),
          updateNodeData: () => {},
        },
        api: {},
        getImage: async () => null,
        startLoading: () => {},
        stopLoading: () => {},
        ensureConfig: async () => {},
        getProviderConfig: () => ({ apiKey: '' }),
        isVideoVipModel: (value132, value133) =>
          String(value133 || '').toLowerCase() === 'dreamina' &&
          String(value132 || '').startsWith('dreamina/'),
        ensureVipSessionRecheck: async () => {},
      }),
      value134 = Object.assign(Object.create(videoNodeTaskOrchestrationModule2), {
        _isGenerating: false,
        _data: { model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
        _guardVipSelection: () => true,
        _buildPayload: async () => ({
          model: 'dreamina/seedance2.0fast',
          provider: 'dreamina',
          installId: '',
        }),
      });
    try {
      (await videoNodeTaskOrchestrationModule2._onGenerateImpl.call(value134),
        assert.equal(list16.includes('缺少 installId，无法校验订阅，请刷新后重试'), true));
    } finally {
      globalThis.window.showToast = value130;
    }
  }),
  test('task orchestration: dreamina VIP 有 installId 时会继续执行后续逻辑', async () => {
    const videoNodeTaskOrchestrationModule3 = createVideoNodeTaskOrchestrationModule({
        store: {
          getStateRaw: () => ({ nodes: {} }),
          getState: () => ({ nodes: {} }),
          updateNodeData: () => {},
        },
        api: {},
        getImage: async () => null,
        startLoading: () => {},
        stopLoading: () => {},
        ensureConfig: async () => {},
        getProviderConfig: () => ({ apiKey: '' }),
        isVideoVipModel: (value135, value136) =>
          String(value136 || '').toLowerCase() === 'dreamina' &&
          String(value135 || '').startsWith('dreamina/'),
        ensureVipSessionRecheck: async () => {},
      }),
      value137 = Object.assign(Object.create(videoNodeTaskOrchestrationModule3), {
        _isGenerating: false,
        _data: { model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
        _guardVipSelection: () => true,
        _buildPayload: async () => ({
          model: 'dreamina/seedance2.0fast',
          provider: 'dreamina',
          installId: 'install-ok',
        }),
        _isRunninghubWorkflowModel: () => {
          throw new Error('FLOW_CONTINUED');
        },
      });
    await assert.rejects(videoNodeTaskOrchestrationModule3._onGenerateImpl.call(value137), /FLOW_CONTINUED/);
  }),
  test('task orchestration: dreamina video submit failure is logged without masking original error', async () => {
    const targetId69 = 'node-video-dreamina-submit-fail',
      {
        proto: proto67,
        ctx: ctx67,
        state: state7,
      } = createTestContext({
        targetId: targetId69,
        nodeData: { id: targetId69, provider: 'dreamina', model: 'dreamina/seedance2.0fast' },
        apiImpl: {
          generateVideo: async () => {
            throw new Error('即梦视频任务提交失败：未返回 submitId');
          },
        },
      });
    ((ctx67._isGenerating = false),
      (ctx67.btnEl = createButtonStub()),
      (ctx67.previewEl = {}),
      (ctx67._guardVipSelection = () => true),
      (ctx67._buildPayload = async () => ({
        provider: 'dreamina',
        model: 'dreamina/seedance2.0fast',
        prompt: 'test prompt',
      })),
      (ctx67._stopDreaminaRecovery = () => {}),
      (ctx67._stopRunningHubRecovery = () => {}),
      (ctx67._stopAsyncRecovery = () => {}),
      (ctx67._persistDreaminaResumeCache = () => {}),
      (ctx67._updateSubmitButtonState = () => {}),
      await proto67._onGenerateImpl.call(ctx67));
    const value138 = state7.nodes[targetId69];
    (assert.equal(value138.isGenerating, false),
      assert.equal(value138.jobStatus, 'error'),
      assert.equal(value138.jobError, '即梦视频任务提交失败：未返回 submitId'),
      assert.equal(value138.videos?.[0]?.error, '即梦视频任务提交失败：未返回 submitId'),
      assert.equal(value138.dreaminaTaskStatus, 'failed'),
      assert.equal(value138.dreaminaTaskPhase, 'failed'),
      assert.equal(value138.dreaminaTaskLabel, '即梦视频任务提交失败：未返回 submitId'));
  }),
  test('task orchestration: dreamina video recovery writes terminal state through runtime', async () => {
    const targetId70 = 'node-video-dreamina-recovery-success',
      dreaminaTaskStartedAt = Date.now() - 60000;
    let value139 = 0,
      value140 = 0;
    const {
      proto: proto68,
      ctx: ctx68,
      state: state8,
    } = createTestContext({
      targetId: targetId70,
      nodeData: {
        id: targetId70,
        provider: 'dreamina',
        model: 'dreamina/seedance2.0fast',
        dreaminaSubmitId: 'sid-video-success',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: dreaminaTaskStartedAt,
        dreaminaTaskLastCheckedAt: Date.now() - 30000,
        dreaminaTaskRecovering: false,
        generationStartTime: dreaminaTaskStartedAt,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeDreaminaVideoTask: async (submitId, value141) => {
          return (
            (value139 += 1),
            assert.equal(submitId, 'sid-video-success'),
            assert.equal(value141?.maxWaitMs > 0, true),
            {
              isBatch: false,
              dreaminaSnapshot: {
                submitId: submitId,
                status: 'success',
                phase: 'done',
                label: '已完成',
                outputs: [
                  {
                    localPath: 'output/dreamina/video-success.mp4',
                    localUrl: '/output/dreamina/video-success.mp4',
                  },
                ],
                raw: {},
                lastCheckedAt: Date.now(),
              },
              videos: [
                {
                  videoUrl: '/output/dreamina/video-success.mp4',
                  localPath: 'output/dreamina/video-success.mp4',
                },
              ],
              videoUrl: '/output/dreamina/video-success.mp4',
              localPath: 'output/dreamina/video-success.mp4',
            }
          );
        },
      },
    });
    ((ctx68._isGenerating = false),
      (ctx68.btnEl = createButtonStub()),
      (ctx68.previewEl = {}),
      (ctx68._updateSubmitButtonState = () => {}),
      (ctx68._persistDreaminaResumeCache = () => {}),
      (ctx68._finalizeVideoSuccessSideEffects = () => {
        value140 += 1;
      }),
      await proto68._maybeResumeDreaminaTaskImpl.call(ctx68));
    ctx68._dreaminaResumePromise && (await ctx68._dreaminaResumePromise);
    const value142 = state8.nodes[targetId70];
    (assert.equal(value139, 1),
      assert.equal(value140, 1),
      assert.equal(value142.isGenerating, false),
      assert.equal(value142.jobStatus, 'success'),
      assert.equal(value142.dreaminaTaskStatus, 'success'),
      assert.equal(value142.dreaminaTaskPhase, 'done'),
      assert.equal(value142.dreaminaTaskRecovering, false),
      assert.equal(value142.videoUrl, '/output/dreamina/video-success.mp4'),
      assert.equal(value142.localPath, 'output/dreamina/video-success.mp4'),
      assert.equal(ctx68._isGenerating, false));
  }),
  test('task orchestration: dreamina video recovery returns failed reason and clears loading state', async () => {
    const targetId71 = 'node-video-dreamina-recovery-failed',
      dreaminaTaskStartedAt2 = Date.now() - 60000,
      {
        proto: proto69,
        ctx: ctx69,
        state: state9,
      } = createTestContext({
        targetId: targetId71,
        nodeData: {
          id: targetId71,
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaSubmitId: 'sid-video-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLabel: '生成中',
          dreaminaTaskStartedAt: dreaminaTaskStartedAt2,
          dreaminaTaskLastCheckedAt: Date.now() - 30000,
          dreaminaTaskRecovering: false,
          generationStartTime: dreaminaTaskStartedAt2,
          generationDuration: null,
          isGenerating: true,
        },
        apiImpl: {
          resumeDreaminaVideoTask: async (submitId2) => {
            assert.equal(submitId2, 'sid-video-fail');
            const error = new Error('generation failed: final generation failed');
            error.dreaminaSnapshot = {
              submitId: submitId2,
              status: 'failed',
              phase: 'failed',
              label: 'generation failed: final generation failed',
              failReason: 'generation failed: final generation failed',
              outputs: [],
              raw: {},
              lastCheckedAt: Date.now(),
            };
            throw error;
          },
        },
      });
    ((ctx69._isGenerating = true),
      (ctx69.btnEl = createButtonStub()),
      (ctx69.previewEl = {}),
      (ctx69._updateSubmitButtonState = () => {}),
      (ctx69._persistDreaminaResumeCache = () => {}),
      await proto69._maybeResumeDreaminaTaskImpl.call(ctx69));
    ctx69._dreaminaResumePromise && (await ctx69._dreaminaResumePromise);
    const value143 = state9.nodes[targetId71];
    (assert.equal(value143.isGenerating, false),
      assert.equal(value143.jobStatus, 'error'),
      assert.equal(value143.jobError, 'generation failed: final generation failed'),
      assert.equal(value143.videos?.[0]?.error, 'generation failed: final generation failed'),
      assert.equal(value143.dreaminaTaskStatus, 'failed'),
      assert.equal(value143.dreaminaTaskPhase, 'failed'),
      assert.equal(value143.dreaminaTaskLabel, 'generation failed: final generation failed'),
      assert.equal(value143.dreaminaTaskRecovering, false));
  }),
  test('task orchestration: RunningHub video recovery writes terminal state through runtime', async () => {
    const targetId72 = 'node-video-rh-recovery-success',
      rhTaskStartedAt = Date.now() - 60000;
    let value144 = 0,
      value145 = 0;
    const {
      proto: proto70,
      ctx: ctx70,
      state: state10,
    } = createTestContext({
      targetId: targetId72,
      nodeData: {
        id: targetId72,
        provider: 'runninghubwf',
        model: 'runninghub/1971148165531475969',
        rhTaskId: 'rh-video-resume-success',
        rhTaskStatus: 'running',
        rhTaskStartedAt: rhTaskStartedAt,
        rhTaskUseOpenapiQuery: true,
        generationStartTime: rhTaskStartedAt,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeRunningHubVideoTask: async (value146, value147, value148) => {
          return (
            (value144 += 1),
            assert.equal(value146, 'rh-video-resume-success'),
            assert.equal(value147.provider, 'runninghubwf'),
            assert.equal(value148?.useOpenapiQuery, true),
            { videos: [{ videoUrl: '/output/resumed.mp4', localPath: '/output/resumed.mp4' }] }
          );
        },
      },
    });
    ((ctx70._isGenerating = false),
      (ctx70.btnEl = createButtonStub()),
      (ctx70.previewEl = {}),
      (ctx70._isRunninghubWorkflowModel = () => true),
      (ctx70._buildPayload = async () => ({
        provider: 'runninghubwf',
        model: 'runninghub/1971148165531475969',
        apiKey: 'k_rh',
      })),
      (ctx70._persistRunningHubResumeCache = () => {}),
      (ctx70._updateSubmitButtonState = () => {}),
      (ctx70._finalizeVideoSuccessSideEffects = () => {
        value145 += 1;
      }),
      await proto70._maybeResumeRunningHubTaskImpl.call(ctx70));
    ctx70._rhResumePromise && (await ctx70._rhResumePromise);
    const value149 = state10.nodes[targetId72];
    (assert.equal(value144, 1),
      assert.equal(value145, 1),
      assert.equal(value149.isGenerating, false),
      assert.equal(value149.jobStatus, 'success'),
      assert.equal(value149.rhTaskStatus, 'success'),
      assert.equal(value149.rhTaskRecovering, false),
      assert.equal(value149.videoUrl, '/output/resumed.mp4'),
      assert.equal(value149.localPath, '/output/resumed.mp4'),
      assert.equal(ctx70._isGenerating, false));
  }),
  test('task orchestration: async video recovery writes terminal state through runtime', async () => {
    const targetId73 = 'node-video-async-recovery-success',
      asyncTaskStartedAt = Date.now() - 60000;
    let value150 = 0,
      value151 = 0;
    const {
      proto: proto71,
      ctx: ctx71,
      state: state11,
    } = createTestContext({
      targetId: targetId73,
      nodeData: {
        id: targetId73,
        provider: 'grsai',
        model: 'grsai-video-basic',
        asyncTaskProvider: 'grsai',
        asyncTaskKind: 'video',
        asyncTaskId: 'async-video-resume-success',
        asyncTaskStatus: 'running',
        asyncTaskStartedAt: asyncTaskStartedAt,
        generationStartTime: asyncTaskStartedAt,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeAsyncVideoTask: async (value152, value153, value154) => {
          return (
            (value150 += 1),
            assert.equal(value152, 'async-video-resume-success'),
            assert.equal(value153.provider, 'grsai'),
            assert.ok(value154?.signal),
            { videos: [{ videoUrl: '/output/async-resumed.mp4', localPath: '/output/async-resumed.mp4' }] }
          );
        },
      },
    });
    ((ctx71._isGenerating = false),
      (ctx71.btnEl = createButtonStub()),
      (ctx71.previewEl = {}),
      (ctx71._buildPayload = async () => ({ provider: 'grsai', model: 'grsai-video-basic' })),
      (ctx71._persistAsyncResumeCache = () => {}),
      (ctx71._updateSubmitButtonState = () => {}),
      (ctx71._finalizeVideoSuccessSideEffects = () => {
        value151 += 1;
      }),
      await proto71._maybeResumeAsyncTaskImpl.call(ctx71));
    ctx71._asyncResumePromise && (await ctx71._asyncResumePromise);
    const value155 = state11.nodes[targetId73];
    (assert.equal(value150, 1),
      assert.equal(value151, 1),
      assert.equal(value155.isGenerating, false),
      assert.equal(value155.jobStatus, 'success'),
      assert.equal(value155.asyncTaskStatus, 'success'),
      assert.equal(value155.asyncTaskProvider, 'grsai'),
      assert.equal(value155.asyncTaskKind, 'video'),
      assert.equal(value155.asyncTaskRecovering, false),
      assert.equal(value155.videoUrl, '/output/async-resumed.mp4'),
      assert.equal(value155.localPath, '/output/async-resumed.mp4'),
      assert.equal(ctx71._isGenerating, false));
  }),
  test('task orchestration: async video recovery rebuilds only the resume payload', async () => {
    const targetId74 = 'node-video-async-recovery-minimal-payload',
      asyncTaskStartedAt2 = Date.now() - 60000;
    let value156 = 0;
    const {
      proto: proto72,
      ctx: ctx72,
      state: state12,
    } = createTestContext({
      targetId: targetId74,
      prompt: '',
      nodeData: {
        id: targetId74,
        provider: 'apimart',
        model: 'apimart/luma-ray-v2',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'video',
        asyncTaskId: 'async-video-resume-minimal',
        asyncTaskStatus: 'running',
        asyncTaskStartedAt: asyncTaskStartedAt2,
        generationStartTime: asyncTaskStartedAt2,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeAsyncVideoTask: async (value157, value158, value159) => {
          return (
            (value156 += 1),
            assert.equal(value157, 'async-video-resume-minimal'),
            assert.equal(value158.provider, 'apimart'),
            assert.equal(value158.model, 'apimart/luma-ray-v2'),
            assert.equal(value158.prompt, undefined),
            assert.ok(value159?.signal),
            {
              videos: [
                {
                  videoUrl: '/output/async-minimal-resumed.mp4',
                  localPath: '/output/async-minimal-resumed.mp4',
                },
              ],
            }
          );
        },
      },
    });
    ((ctx72._isGenerating = false),
      (ctx72.btnEl = createButtonStub()),
      (ctx72.previewEl = {}),
      (ctx72._buildPayload = async () => {
        throw new Error('resume should not rebuild submit payload');
      }),
      (ctx72._persistAsyncResumeCache = () => {}),
      (ctx72._updateSubmitButtonState = () => {}),
      (ctx72._finalizeVideoSuccessSideEffects = () => {}),
      await proto72._maybeResumeAsyncTaskImpl.call(ctx72));
    ctx72._asyncResumePromise && (await ctx72._asyncResumePromise);
    const value160 = state12.nodes[targetId74];
    (assert.equal(value156, 1),
      assert.equal(value160.isGenerating, false),
      assert.equal(value160.jobStatus, 'success'),
      assert.equal(value160.asyncTaskStatus, 'success'),
      assert.equal(value160.asyncTaskRecovering, false),
      assert.equal(value160.videoUrl, '/output/async-minimal-resumed.mp4'));
  }),
  test('task orchestration: apimart 即梦后台恢复使用 APIMart 异步轮询错误', async () => {
    const targetId75 = 'node-video-apimart-dreamina-recovery-failed',
      dreaminaTaskStartedAt3 = Date.now() - 60000;
    let value161 = 0;
    const {
      proto: proto73,
      ctx: ctx73,
      state: state13,
    } = createTestContext({
      targetId: targetId75,
      nodeData: {
        id: targetId75,
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        dreaminaSubmitId: 'task-apimart-fail',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: dreaminaTaskStartedAt3,
        dreaminaTaskLastCheckedAt: Date.now() - 30000,
        dreaminaTaskRecovering: false,
        generationStartTime: dreaminaTaskStartedAt3,
        generationDuration: null,
        isGenerating: true,
      },
      apiImpl: {
        resumeAsyncVideoTask: async (value162, value163) => {
          ((value161 += 1),
            assert.equal(value162, 'task-apimart-fail'),
            assert.equal(value163.provider, 'apimart'));
          throw new Error('Seedance upstream failed');
        },
        resumeDreaminaVideoTask: async () => {
          throw new Error('should not resume official dreamina endpoint');
        },
      },
    });
    ((ctx73._isDreaminaVideoNode = (value164) =>
      String(value164?.provider || '').toLowerCase() === 'apimart' ||
      String(value164?.provider || '').toLowerCase() === 'dreamina'),
      (ctx73._isGenerating = true),
      (ctx73.btnEl = createButtonStub()),
      (ctx73.previewEl = {}),
      (ctx73._updateSubmitButtonState = () => {}),
      (ctx73._persistDreaminaResumeCache = () => {}),
      await proto73._maybeResumeDreaminaTaskImpl.call(ctx73));
    ctx73._dreaminaResumePromise && (await ctx73._dreaminaResumePromise);
    const value165 = state13.nodes[targetId75];
    (assert.equal(value161, 1),
      assert.equal(value165.isGenerating, false),
      assert.equal(value165.jobStatus, 'error'),
      assert.equal(value165.jobError, 'Seedance upstream failed'),
      assert.equal(value165.videos?.[0]?.error, 'Seedance upstream failed'),
      assert.equal(value165.dreaminaTaskStatus, 'failed'),
      assert.equal(value165.dreaminaTaskPhase, 'failed'),
      assert.equal(value165.dreaminaTaskLabel, 'Seedance upstream failed'),
      assert.equal(value165.dreaminaTaskRecovering, false));
  }),
  test('task orchestration: dreamina video recovery does not abort itself on reentrant state update', async () => {
    const targetId76 = 'node-video-dreamina-reentrant-recovery',
      dreaminaTaskStartedAt4 = Date.now() - 60000,
      {
        proto: proto74,
        ctx: ctx74,
        state: state14,
        store: store3,
      } = createTestContext({
        targetId: targetId76,
        nodeData: {
          id: targetId76,
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaSubmitId: 'sid-video-reentrant-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLabel: '生成中',
          dreaminaTaskStartedAt: dreaminaTaskStartedAt4,
          dreaminaTaskLastCheckedAt: Date.now() - 30000,
          dreaminaTaskRecovering: false,
          generationStartTime: dreaminaTaskStartedAt4,
          generationDuration: null,
          isGenerating: true,
        },
        apiImpl: {
          resumeDreaminaVideoTask: async (value166) => {
            (assert.equal(value166, 'sid-video-reentrant-fail'), await Promise.resolve());
            throw new Error('generation failed: final generation failed');
          },
        },
      });
    ((ctx74._isGenerating = true),
      (ctx74.btnEl = createButtonStub()),
      (ctx74.previewEl = {}),
      (ctx74._updateSubmitButtonState = () => {}),
      (ctx74._persistDreaminaResumeCache = () => {}));
    const run = store3.updateNodeData.bind(store3);
    let enabled = false;
    ((store3.updateNodeData = (value167, value168) => {
      (run(value167, value168),
        !enabled &&
          value168?.dreaminaTaskRecovering === true &&
          ((enabled = true), void proto74._maybeResumeDreaminaTaskImpl.call(ctx74)));
    }),
      await proto74._maybeResumeDreaminaTaskImpl.call(ctx74),
      await ctx74._dreaminaResumePromise);
    const value169 = state14.nodes[targetId76];
    (assert.equal(enabled, true),
      assert.equal(value169.isGenerating, false),
      assert.equal(value169.jobStatus, 'error'),
      assert.equal(value169.videos?.[0]?.error, 'generation failed: final generation failed'),
      assert.equal(value169.dreaminaTaskStatus, 'failed'),
      assert.equal(value169.dreaminaTaskRecovering, false));
  }),
  test('task orchestration: dreamina active video submit skips duplicate recovery until stale', async () => {
    const targetId77 = 'node-video-dreamina-active-submit',
      dreaminaTaskStartedAt5 = Date.now() - 60000;
    let value170 = 0;
    const {
      proto: proto75,
      ctx: ctx75,
      state: state15,
    } = createTestContext({
      targetId: targetId77,
      nodeData: {
        id: targetId77,
        provider: 'dreamina',
        model: 'dreamina/seedance2.0fast',
        dreaminaSubmitId: 'sid-video-active',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: dreaminaTaskStartedAt5,
        dreaminaTaskLastCheckedAt: Date.now(),
        dreaminaTaskRecovering: false,
        generationStartTime: dreaminaTaskStartedAt5,
        generationDuration: null,
        isGenerating: true,
      },
      apiImpl: {
        resumeDreaminaVideoTask: async (submitId3) => {
          return (
            (value170 += 1),
            assert.equal(submitId3, 'sid-video-active'),
            {
              isBatch: false,
              dreaminaSnapshot: {
                submitId: submitId3,
                status: 'success',
                phase: 'done',
                label: '已完成',
                outputs: [
                  {
                    localPath: 'output/dreamina/video-active.mp4',
                    localUrl: '/output/dreamina/video-active.mp4',
                  },
                ],
                raw: {},
                lastCheckedAt: Date.now(),
              },
              videos: [
                {
                  videoUrl: '/output/dreamina/video-active.mp4',
                  localPath: 'output/dreamina/video-active.mp4',
                },
              ],
              videoUrl: '/output/dreamina/video-active.mp4',
              localPath: 'output/dreamina/video-active.mp4',
            }
          );
        },
      },
    });
    ((ctx75._isGenerating = true),
      (ctx75._dreaminaActiveSubmitId = 'sid-video-active'),
      (ctx75.btnEl = createButtonStub()),
      (ctx75.previewEl = {}),
      (ctx75._updateSubmitButtonState = () => {}),
      (ctx75._persistDreaminaResumeCache = () => {}),
      (ctx75._finalizeVideoSuccessSideEffects = () => {}),
      await proto75._maybeResumeDreaminaTaskImpl.call(ctx75),
      assert.equal(value170, 0),
      assert.equal(ctx75._dreaminaResumePromise, undefined),
      (state15.nodes[targetId77].dreaminaTaskLastCheckedAt = Date.now() - 20000),
      await proto75._maybeResumeDreaminaTaskImpl.call(ctx75),
      ctx75._dreaminaResumePromise && (await ctx75._dreaminaResumePromise),
      assert.equal(value170, 1),
      assert.equal(state15.nodes[targetId77].dreaminaTaskStatus, 'success'));
  }),
  test('task orchestration: dreamina background queueing toast is deduped per submit id', () => {
    const targetId78 = 'node-video-dreamina-toast-dedupe',
      { proto: proto76, ctx: ctx76 } = createTestContext({
        targetId: targetId78,
        nodeData: {
          id: targetId78,
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaSubmitId: 'sid-video-toast',
        },
      }),
      value171 = globalThis.window.showToast,
      list17 = [];
    globalThis.window.showToast = (value172) => {
      list17.push(String(value172 || ''));
    };
    try {
      (proto76._showDreaminaBackgroundQueueingToast.call(ctx76, 'sid-video-toast'),
        proto76._showDreaminaBackgroundQueueingToast.call(ctx76, 'sid-video-toast'),
        proto76._showDreaminaBackgroundQueueingToast.call(ctx76, 'sid-video-toast-next'));
      const { proto: proto77, ctx: ctx77 } = createTestContext({
        targetId: targetId78 + '-remount',
        nodeData: {
          id: targetId78 + '-remount',
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaSubmitId: 'sid-video-toast-next',
        },
      });
      (proto77._showDreaminaBackgroundQueueingToast.call(ctx77, 'sid-video-toast-next'),
        assert.deepEqual(list17, ['即梦排队较久，已转为后台查询', '即梦排队较久，已转为后台查询']));
    } finally {
      globalThis.window.showToast = value171;
    }
  }),
  test('task orchestration: dreamina TIMEOUT 错误会转为后台 pending', async () => {
    const id38 = 'node-video-timeout-1',
      _data2 = {
        nodes: { [id38]: { id: id38, provider: 'dreamina', model: 'dreamina/seedance2.0fast' } },
      },
      store4 = createStore(_data2),
      value173 = globalThis.window.showToast,
      list18 = [];
    let value174 = 0,
      value175 = 0;
    globalThis.window.showToast = (value176) => {
      list18.push(String(value176 || ''));
    };
    try {
      const videoNodeTaskOrchestrationModule4 = createVideoNodeTaskOrchestrationModule({
          store: store4,
          api: {
            generateVideo: async () => {
              const error2 = new Error('请求超时（60秒）');
              error2.code = 'TIMEOUT';
              throw error2;
            },
          },
          getImage: async () => null,
          startLoading: () => {
            value174 += 1;
          },
          stopLoading: () => {
            value175 += 1;
          },
          ensureConfig: async () => {},
          getProviderConfig: () => ({ apiKey: '' }),
          isVideoVipModel: () => false,
          ensureVipSessionRecheck: async () => {},
        }),
        value177 = Object.assign(Object.create(videoNodeTaskOrchestrationModule4), {
          nodeId: id38,
          _data: _data2.nodes[id38],
          _isGenerating: false,
          btnEl: createButtonStub(),
          previewEl: {},
          _updateSubmitButtonState: () => {},
          _guardVipSelection: () => true,
          _buildPayload: async () => ({
            provider: 'dreamina',
            model: 'dreamina/seedance2.0fast',
            prompt: 'test prompt',
          }),
          _isDreaminaVideoNode(value178) {
            return (
              String(value178?.provider || '')
                .trim()
                .toLowerCase() === 'dreamina'
            );
          },
          _isRunninghubWorkflowModel: () => false,
        });
      await videoNodeTaskOrchestrationModule4._onGenerateImpl.call(value177);
      const value179 = _data2.nodes[id38];
      (assert.equal(value179.dreaminaTaskStatus, 'pending'),
        assert.equal(value179.dreaminaTaskPhase, 'generating'),
        assert.equal(value179.dreaminaTaskLabel, '排队中（后台查询）'),
        assert.equal(value179.dreaminaTaskStatus === 'failed', false),
        assert.equal(value179.isGenerating, true),
        assert.equal(value174, 1),
        assert.equal(value175, 0),
        assert.equal(list18.includes('即梦排队较久，已转为后台查询'), true));
    } finally {
      globalThis.window.showToast = value173;
    }
  }));
