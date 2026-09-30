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
import { createPreviewContainer as createFakePreviewContainer, installDomEnvironment as installPreviewDomStubs } from '../../../tools/dom-test-environment.mjs';
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
async function flushUntil(_0x16ed4a, _0x779a89 = 20) {
  for (let _0x50b8bd = 0; _0x50b8bd < _0x779a89; _0x50b8bd += 1) {
    if (_0x16ed4a()) return;
    await Promise.resolve();
  }
  assert.equal(_0x16ed4a(), true);
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
    const _0x15f491 = 'node-video-scail2',
      _0x5bafc4 = 'node-video-scail2-source',
      _0x65c6e9 = 'node-video-scail2-ref',
      _0x5d7b05 = await buildRunningHubVideoWorkflowSubmitPatch({
        model: 'runninghub/2064961300823896065',
        nodeData: {
          id: _0x15f491,
          model: 'runninghub/2064961300823896065',
          provider: 'runninghubwf',
          generationParams: {
            rhVideoResolution: 0x340,
            rhVideoFps: 24,
            rhVideoFrames: 0x12c,
            rhScail2PersonCount: 2,
            rhScailDetectPrompt: 'person, face',
            rhScail2ReplaceSubject: true,
            rhInstanceType: 'default',
          },
        },
        inEdges: [
          {
            id: 'edge-video-scail2-source',
            sourceId: _0x5bafc4,
            targetId: _0x15f491,
            refSlot: 'sourceVideo',
          },
          { id: 'edge-video-scail2-ref', sourceId: _0x65c6e9, targetId: _0x15f491, refSlot: 'refImage' },
        ],
        nodes: {
          [_0x5bafc4]: { id: _0x5bafc4, type: 'source-video', videoUrl: '/data/uploads/scail2-source.mp4' },
          [_0x65c6e9]: { id: _0x65c6e9, type: 'source-image', imageUrl: '/data/uploads/scail2-ref.png' },
        },
        assetInputRefs: [],
        helpers: {
          getVideoUrl: (_0x5bded5) => _0x5bded5?.videoUrl || '',
          getImageUrl: (_0x330e7e) => _0x330e7e?.imageUrl || '',
          getAudioUrl: () => '',
        },
      });
    (assert.equal(_0x5d7b05.payloadPatch.videoUrl, '/data/uploads/scail2-source.mp4'),
      assert.deepEqual(_0x5d7b05.payloadPatch.inputUrls, ['/data/uploads/scail2-ref.png']),
      assert.equal(_0x5d7b05.payloadPatch.rhVideoResolution, 0x340),
      assert.equal(_0x5d7b05.payloadPatch.rhVideoFps, 24),
      assert.equal(_0x5d7b05.payloadPatch.rhVideoFrames, 0x12c),
      assert.equal(_0x5d7b05.payloadPatch.generationParams.rhScail2PersonCount, 2),
      assert.equal(_0x5d7b05.payloadPatch.generationParams.rhScailDetectPrompt, 'person, face'),
      assert.equal(_0x5d7b05.payloadPatch.generationParams.rhScail2ReplaceSubject, true));
  }),
  test('video task orchestration: Scail V1 does not treat source video thumbnail as ref image', async () => {
    const _0x1b8822 = 'node-video-scail2-single-video',
      _0x5f3e1e = 'node-video-scail2-single-source',
      { proto: _0x6ea663, ctx: _0x15a5f0 } = createTestContext({
        targetId: _0x1b8822,
        nodeData: {
          id: _0x1b8822,
          provider: 'runninghubwf',
          model: 'runninghub/2064961300823896065',
          generationParams: {
            rhVideoResolution: 0x340,
            rhVideoFps: 24,
            rhVideoFrames: 0x12c,
            rhScail2PersonCount: 2,
            rhScail2ReplaceSubject: false,
            rhInstanceType: 'default',
          },
        },
        nodes: {
          [_0x5f3e1e]: {
            id: _0x5f3e1e,
            type: 'source-video',
            localPath: 'data/uploads/scail2-source.mp4',
            imageUrl: 'https://img.example.com/video-preview.png',
            thumbUrl: 'https://img.example.com/video-thumb.png',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-scail2-source-only',
            sourceId: _0x5f3e1e,
            targetId: _0x1b8822,
            refSlot: 'sourceVideo',
          },
        ],
        prompt: '',
      }),
      _0x4c6dd5 = await _0x6ea663._buildPayloadImpl.call(_0x15a5f0);
    (assert.equal(_0x4c6dd5.videoUrl, '/data/uploads/scail2-source.mp4'),
      assert.deepEqual(_0x4c6dd5.inputUrls, []));
  }),
  test('video task orchestration: BERNINI fixed slots build mode summary and reference video payload', async () => {
    const _0x206fb0 = 'node-video-bernini',
      _0x786344 = (_0x5c228f = [], _0x5999e1 = {}, _0x2e2087 = {}) =>
        buildRunningHubVideoWorkflowSubmitPatch({
          model: 'runninghub/2062515720147259393',
          nodeData: {
            id: _0x206fb0,
            model: 'runninghub/2062515720147259393',
            provider: 'runninghubwf',
            generationParams: {
              rhBerniniFunction: 'i2v',
              rhVideoResolution: 0x340,
              rhBerniniAspectRatio: '16:9',
            },
            ..._0x2e2087,
          },
          inEdges: _0x5c228f,
          nodes: _0x5999e1,
          assetInputRefs: [],
          helpers: {
            getVideoUrl: (_0x48539c) => _0x48539c?.videoUrl || '',
            getImageUrl: (_0x329883) => _0x329883?.imageUrl || '',
            getAudioUrl: () => '',
          },
        }),
      _0x55d133 = await _0x786344();
    (assert.equal(_0x55d133.payloadPatch.rhBerniniInputMode, 'none'),
      assert.equal(_0x55d133.payloadPatch.rhBerniniFunction, undefined));
    const _0x4f993c = await _0x786344(
      [{ id: 'edge-image', sourceId: 'image1', targetId: _0x206fb0, refSlot: 'refImage' }],
      { image1: { id: 'image1', type: 'source-image', imageUrl: '/ref.png' } },
    );
    (assert.equal(_0x4f993c.payloadPatch.rhBerniniInputMode, 'image'),
      assert.equal(_0x4f993c.payloadPatch.rhBerniniFunction, 'i2v'),
      assert.deepEqual(_0x4f993c.payloadPatch.inputUrls, ['/ref.png']));
    const _0x86c6c4 = await _0x786344(
      [{ id: 'edge-video', sourceId: 'video1', targetId: _0x206fb0, refSlot: 'sourceVideo' }],
      { video1: { id: 'video1', type: 'source-video', videoUrl: '/source.mp4' } },
    );
    (assert.equal(_0x86c6c4.payloadPatch.rhBerniniInputMode, 'video'),
      assert.equal(_0x86c6c4.payloadPatch.rhBerniniFunction, 'v2v'),
      assert.equal(_0x86c6c4.payloadPatch.videoUrl, '/source.mp4'),
      assert.deepEqual(_0x86c6c4.payloadPatch.inputUrls, []));
    const _0x2ba298 = await _0x786344(
      [
        { id: 'edge-video', sourceId: 'video1', targetId: _0x206fb0, refSlot: 'sourceVideo' },
        { id: 'edge-image', sourceId: 'image1', targetId: _0x206fb0, refSlot: 'refImage' },
      ],
      {
        video1: { id: 'video1', type: 'source-video', videoUrl: '/source.mp4' },
        image1: { id: 'image1', type: 'source-image', imageUrl: '/ref.png' },
      },
    );
    (assert.equal(_0x2ba298.payloadPatch.rhBerniniInputMode, 'videoImage'),
      assert.equal(_0x2ba298.payloadPatch.rhBerniniFunction, 'vi2v'),
      assert.deepEqual(_0x2ba298.payloadPatch.inputUrls, ['/ref.png']));
    const _0x16e88d = await _0x786344(
      [
        { id: 'edge-video', sourceId: 'video1', targetId: _0x206fb0, refSlot: 'sourceVideo' },
        { id: 'edge-ref-video', sourceId: 'video2', targetId: _0x206fb0, refSlot: 'referenceVideo' },
      ],
      {
        video1: { id: 'video1', type: 'source-video', videoUrl: '/source.mp4' },
        video2: { id: 'video2', type: 'source-video', videoUrl: '/reference.mp4' },
      },
    );
    (assert.equal(_0x16e88d.payloadPatch.rhBerniniInputMode, 'videoVideo'),
      assert.equal(_0x16e88d.payloadPatch.rhBerniniFunction, 'ads2v'),
      assert.equal(_0x16e88d.payloadPatch.referenceVideoUrl, '/reference.mp4'));
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
  rhVideoResolution: rhVideoResolution = 0x340,
} = {}) {
  const _0x4a51d9 = 'node-lipsync',
    _0x3c3494 = {},
    _0x52f971 = [];
  includeVideo &&
    ((_0x3c3494.video1 = {
      id: 'video1',
      type: 'source-video',
      localPath: 'output/source.mp4',
      videoDuration: videoDuration,
    }),
    _0x52f971.push({ id: 'edge-video', sourceId: 'video1', targetId: _0x4a51d9, refSlot: 'sourceVideo' }));
  includeAudio &&
    ((_0x3c3494.audio1 = {
      id: 'audio1',
      type: 'source-audio',
      localPath: 'output/audio.mp3',
      duration: audioDuration,
    }),
    _0x52f971.push({ id: 'edge-audio', sourceId: 'audio1', targetId: _0x4a51d9, refSlot: 'audio' }));
  includeImage &&
    ((_0x3c3494.image1 = { id: 'image1', type: 'source-image', imageUrl: '/output/ref.png' }),
    _0x52f971.push({ id: 'edge-image', sourceId: 'image1', targetId: _0x4a51d9, refSlot: 'refImage' }));
  includeText &&
    ((_0x3c3494.text1 = { id: 'text1', type: 'source-text', text: 'mouth shape prompt' }),
    _0x52f971.push({ id: 'edge-text', sourceId: 'text1', targetId: _0x4a51d9, refSlot: '' }));
  const _0x4ffc03 = createTestContext({
    targetId: _0x4a51d9,
    nodes: _0x3c3494,
    incomingEdges: _0x52f971,
    nodeData: {
      id: _0x4a51d9,
      model: 'runninghub/2054101324521844738',
      provider: 'runninghubwf',
      rhVideoFrames: rhVideoFrames,
      rhVideoResolution: rhVideoResolution,
      rhInstanceType: rhInstanceType,
      generationParams: { rhInstanceType: rhInstanceType },
    },
    prompt: 'ignored prompt',
  });
  return ((_0x4ffc03.ctx._isRunninghubWorkflowModel = () => true), _0x4ffc03);
}
(test('video task orchestration: 视频对口型缺少视觉输入或音频时不构建 payload', async () => {
  const _0x15aab3 = globalThis.window.showToast,
    _0x18c2a6 = [];
  globalThis.window.showToast = (_0x4bb87e) => {
    _0x18c2a6.push(String(_0x4bb87e || ''));
  };
  try {
    {
      const { proto: _0x4e53e2, ctx: _0x59da69 } = createLipSyncPayloadContext({
        includeVideo: true,
        includeAudio: false,
      });
      (assert.equal(await _0x4e53e2._buildPayloadImpl.call(_0x59da69), null),
        assert.equal(_0x18c2a6.at(-1), '请接入一个音频输入'));
    }
    {
      const { proto: _0x2b82a5, ctx: _0x42efa5 } = createLipSyncPayloadContext({
        includeVideo: false,
        includeAudio: true,
      });
      (assert.equal(await _0x2b82a5._buildPayloadImpl.call(_0x42efa5), null),
        assert.equal(_0x18c2a6.at(-1), '请接入一个视频或参考图输入'));
    }
  } finally {
    globalThis.window.showToast = _0x15aab3;
  }
}),
  test('video task orchestration: 视频对口型按 24fps 校验音频时长', async () => {
    const _0x30012d = globalThis.window.showToast,
      _0x33c5f6 = [];
    globalThis.window.showToast = (_0x3be3c9) => {
      _0x33c5f6.push(String(_0x3be3c9 || ''));
    };
    try {
      {
        const { proto: _0x506eda, ctx: _0x3fc910 } = createLipSyncPayloadContext({
            rhVideoFrames: 120,
            audioDuration: 5,
            rhInstanceType: 'plus',
          }),
          _0x19b207 = await _0x506eda._buildPayloadImpl.call(_0x3fc910);
        (assert.equal(_0x19b207.rhVideoFrames, 120),
          assert.equal(_0x19b207.frameCount, 120),
          assert.equal(_0x19b207.rhVideoFps, 24),
          assert.equal(_0x19b207.rhInstanceType, 'plus'),
          assert.equal(_0x19b207.rhLipSyncInputIndex, 1),
          assert.deepEqual(_0x19b207.inputUrls, []),
          assert.equal(_0x19b207.videoUrl, '/output/source.mp4'),
          assert.equal(_0x19b207.audioUrl, '/output/audio.mp3'));
      }
      {
        const { proto: _0xb15317, ctx: _0x4226a4 } = createLipSyncPayloadContext({
          rhVideoFrames: 121,
          audioDuration: 5,
        });
        (assert.equal(await _0xb15317._buildPayloadImpl.call(_0x4226a4), null),
          assert.equal(_0x33c5f6.at(-1), '生成视频时长不能超过音频时长'));
      }
    } finally {
      globalThis.window.showToast = _0x30012d;
    }
  }),
  test('video task orchestration: RunningHub workflow instance reads generationParams only', async () => {
    const { proto: _0x3eb459, ctx: _0x414803 } = createLipSyncPayloadContext({
      rhInstanceType: 'default',
      rhVideoFrames: 120,
      audioDuration: 5,
    });
    ((_0x414803._data.rhInstanceType = 'plus'),
      (_0x414803._data.generationParams = { rhInstanceType: 'default' }));
    const _0x3bbc5e = await _0x3eb459._buildPayloadImpl.call(_0x414803);
    assert.equal(_0x3bbc5e.rhInstanceType, 'default');
  }),
  test('video task orchestration: generic RunningHub workflow params come from generationParams', async () => {
    const _0x303490 = 'node-commercial-digital-human',
      { proto: _0x34d87a, ctx: _0x300af7 } = createTestContext({
        targetId: _0x303490,
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: '/output/ref.png' },
          audio1: { id: 'audio1', type: 'source-audio', localPath: 'output/audio.mp3', duration: 20 },
        },
        incomingEdges: [
          { id: 'edge-image', sourceId: 'image1', targetId: _0x303490, refSlot: 'refImage' },
          { id: 'edge-audio', sourceId: 'audio1', targetId: _0x303490, refSlot: 'audio' },
        ],
        nodeData: {
          id: _0x303490,
          model: 'runninghub/2055639633148563458',
          provider: 'runninghubwf',
          generationParams: {
            rhVideoResolution: 0x5a0,
            rhVideoFrames: 0x141,
            rhDigitalHumanMotionAmplitude: '2',
            rhDigitalHumanSceneMotionAmplitude: '1',
            rhInstanceType: 'plus',
          },
        },
        prompt: 'commercial singing prompt',
      });
    _0x300af7._isRunninghubWorkflowModel = () => true;
    const _0x29ef3d = await _0x34d87a._buildPayloadImpl.call(_0x300af7);
    (assert.equal(_0x29ef3d.rhVideoResolution, 0x5a0),
      assert.equal(_0x29ef3d.rhVideoFrames, 0x141),
      assert.equal(_0x29ef3d.generationParams?.rhDigitalHumanMotionAmplitude, '2'),
      assert.equal(_0x29ef3d.generationParams?.rhDigitalHumanSceneMotionAmplitude, '1'),
      assert.equal(_0x29ef3d.rhInstanceType, 'plus'),
      assert.deepEqual(_0x29ef3d.inputUrls, ['/output/ref.png']),
      assert.equal(_0x29ef3d.audioUrl, '/output/audio.mp3'));
  }),
  test('video task orchestration: commercial digital human accepts cached audioDuration', async () => {
    const _0x22b9d9 = 'node-commercial-digital-human-audio-duration',
      { proto: _0xafa49b, ctx: _0x25dd30 } = createTestContext({
        targetId: _0x22b9d9,
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: '/output/ref.png' },
          audio1: { id: 'audio1', type: 'source-audio', localPath: 'output/audio.mp3', audioDuration: 6 },
        },
        incomingEdges: [
          { id: 'edge-image', sourceId: 'image1', targetId: _0x22b9d9, refSlot: 'refImage' },
          { id: 'edge-audio', sourceId: 'audio1', targetId: _0x22b9d9, refSlot: 'audio' },
        ],
        nodeData: {
          id: _0x22b9d9,
          model: 'runninghub/2055639633148563458',
          provider: 'runninghubwf',
          generationParams: { rhVideoResolution: 0x500, rhVideoFrames: 150, rhInstanceType: 'default' },
        },
        prompt: 'commercial singing prompt',
      });
    _0x25dd30._isRunninghubWorkflowModel = () => true;
    const _0x4ff79c = await _0xafa49b._buildPayloadImpl.call(_0x25dd30);
    (assert.equal(_0x4ff79c.rhVideoFrames, 150), assert.equal(_0x4ff79c.audioUrl, '/output/audio.mp3'));
  }),
  test('video task orchestration: commercial digital human blocks when frames exceed audio duration at 25fps', async () => {
    const _0xa3ce03 = globalThis.window.showToast,
      _0x28d801 = [];
    globalThis.window.showToast = (_0x45734a) => {
      _0x28d801.push(String(_0x45734a || ''));
    };
    try {
      const _0x3ba43b = 'node-commercial-digital-human-too-long',
        { proto: _0x414296, ctx: _0x5418e1 } = createTestContext({
          targetId: _0x3ba43b,
          nodes: {
            image1: { id: 'image1', type: 'source-image', imageUrl: '/output/ref.png' },
            audio1: { id: 'audio1', type: 'source-audio', localPath: 'output/audio.mp3', duration: 6 },
          },
          incomingEdges: [
            { id: 'edge-image', sourceId: 'image1', targetId: _0x3ba43b, refSlot: 'refImage' },
            { id: 'edge-audio', sourceId: 'audio1', targetId: _0x3ba43b, refSlot: 'audio' },
          ],
          nodeData: {
            id: _0x3ba43b,
            model: 'runninghub/2055639633148563458',
            provider: 'runninghubwf',
            generationParams: { rhVideoResolution: 0x500, rhVideoFrames: 151, rhInstanceType: 'default' },
          },
          prompt: 'commercial singing prompt',
        });
      ((_0x5418e1._isRunninghubWorkflowModel = () => true),
        assert.equal(await _0x414296._buildPayloadImpl.call(_0x5418e1), null),
        assert.equal(_0x28d801.at(-1), '生成视频时长不能超过音频时长（按25帧/秒计算）'));
    } finally {
      globalThis.window.showToast = _0xa3ce03;
    }
  }),
  test('video task orchestration: 视频对口型图片入参写入 inputUrls 并切换 index', async () => {
    const { proto: _0x3d3db5, ctx: _0x21b64e } = createLipSyncPayloadContext({
        includeVideo: false,
        includeImage: true,
        rhVideoFrames: 120,
        audioDuration: 5,
      }),
      _0xee3004 = await _0x3d3db5._buildPayloadImpl.call(_0x21b64e);
    (assert.equal(_0xee3004.videoUrl, undefined),
      assert.equal(_0xee3004.audioUrl, '/output/audio.mp3'),
      assert.equal(_0xee3004.rhLipSyncInputIndex, 0),
      assert.deepEqual(_0xee3004.inputUrls, ['/output/ref.png']));
  }),
  test('video task orchestration: 视频对口型图片入参不接受全长帧数', async () => {
    const _0x2c72b3 = globalThis.window.showToast,
      _0x122ec5 = [];
    globalThis.window.showToast = (_0xb345b2) => {
      _0x122ec5.push(String(_0xb345b2 || ''));
    };
    try {
      const { proto: _0x29caba, ctx: _0x329d66 } = createLipSyncPayloadContext({
        includeVideo: false,
        includeImage: true,
        rhVideoFrames: 0,
        audioDuration: 5,
      });
      (assert.equal(await _0x29caba._buildPayloadImpl.call(_0x329d66), null),
        assert.equal(_0x122ec5.at(-1), '参考图入参请设置大于 0 的帧数'));
    } finally {
      globalThis.window.showToast = _0x2c72b3;
    }
  }),
  test('video task orchestration: 视频对口型接受文本作为提示词输入', async () => {
    const { proto: _0x510f15, ctx: _0x69fd1 } = createLipSyncPayloadContext({
        includeText: true,
        rhVideoFrames: 120,
        audioDuration: 5,
      }),
      _0x36674c = await _0x510f15._buildPayloadImpl.call(_0x69fd1);
    (assert.equal(_0x36674c.prompt, 'mouth shape prompt\nignored prompt'),
      assert.equal(_0x36674c.videoUrl, '/output/source.mp4'),
      assert.equal(_0x36674c.audioUrl, '/output/audio.mp3'),
      assert.deepEqual(_0x36674c.inputUrls, []));
  }),
  test('video task orchestration: 视频对口型帧数 0 按视频全长换算', async () => {
    const _0x13d544 = globalThis.window.showToast,
      _0x20dcec = [];
    globalThis.window.showToast = (_0x465db2) => {
      _0x20dcec.push(String(_0x465db2 || ''));
    };
    try {
      {
        const { proto: _0x1687c4, ctx: _0xabb6ae } = createLipSyncPayloadContext({
            rhVideoFrames: 0,
            videoDuration: 4,
            audioDuration: 5,
          }),
          _0x5bf22f = await _0x1687c4._buildPayloadImpl.call(_0xabb6ae);
        (assert.equal(_0x5bf22f.rhVideoFrames, 96), assert.equal(_0x5bf22f.frameCount, 96));
      }
      {
        const { proto: _0xe30ee0, ctx: _0x2521c6 } = createLipSyncPayloadContext({
          rhVideoFrames: 0,
          videoDuration: 6,
          audioDuration: 5,
        });
        (assert.equal(await _0xe30ee0._buildPayloadImpl.call(_0x2521c6), null),
          assert.equal(_0x20dcec.at(-1), '生成视频时长不能超过音频时长'));
      }
    } finally {
      globalThis.window.showToast = _0x13d544;
    }
  }),
  test('video task orchestration: 视频对口型分辨率不低于 832', async () => {
    const { proto: _0xd2fba7, ctx: _0x5d08ce } = createLipSyncPayloadContext({
        rhVideoFrames: 120,
        audioDuration: 5,
        rhVideoResolution: 0x200,
      }),
      _0x4c5c85 = await _0xd2fba7._buildPayloadImpl.call(_0x5d08ce);
    assert.equal(_0x4c5c85.rhVideoResolution, 0x340);
  }),
  test.afterEach(() => {
    (_resetPreviewRuntimeForTests(), _resetAssetMentionRegistryForTests());
  }));
function createStore(_0x5ba33d, _0x4b093f = []) {
  return {
    getStateRaw() { return _0x5ba33d; },
    getState() {
      return _0x5ba33d;
    },
    getIncomingEdges(_0x48095b) {
      return _0x4b093f.filter((_0x1e04a9) => _0x1e04a9.targetId === _0x48095b);
    },
    updateNodeData(_0x108953, _0x687433) {
      const _0x85b879 = _0x5ba33d.nodes?.[_0x108953] || {};
      _0x5ba33d.nodes[_0x108953] = { ..._0x85b879, ..._0x687433 };
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
    setAttribute(_0x519919, _0x3175cf) {
      this._attrs.set(String(_0x519919 || ''), String(_0x3175cf || ''));
    },
    removeAttribute(_0x1f2128) {
      this._attrs.delete(String(_0x1f2128 || ''));
    },
  };
}
function createPromptTextNode(_0x596888 = '') {
  return { nodeType: 3, textContent: String(_0x596888 || '') };
}
function createPromptElementNode({
  tagName: tagName = 'SPAN',
  className: className = '',
  dataset: dataset = {},
  textContent: textContent = '',
  childNodes: childNodes = [],
} = {}) {
  const _0x2219d2 = String(className || '')
    .split(/\s+/)
    .filter(Boolean);
  return {
    nodeType: 1,
    tagName: tagName,
    className: className,
    classList: {
      contains(_0x1d57c5) {
        return _0x2219d2.includes(String(_0x1d57c5 || ''));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ''),
    childNodes: Array.isArray(childNodes) ? childNodes : [],
  };
}
function createPromptPillNode(_0x274df8, _0x5cbcfe) {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: { label: String(_0x274df8 || ''), nodeId: String(_0x5cbcfe || '') },
    textContent: String(_0x274df8 || ''),
  });
}
function createAssetPromptPillNode(_0x2d051b, _0x318c82, _0x3fea56, _0xb3b342) {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: {
      label: String(_0x2d051b || ''),
      refOrigin: 'asset',
      assetId: String(_0x318c82 || ''),
      assetIndex: String(_0x3fea56),
      refType: String(_0xb3b342 || ''),
    },
    textContent: String(_0x2d051b || ''),
  });
}
function collectPromptInnerText(_0x304d57) {
  return (Array.isArray(_0x304d57) ? _0x304d57 : [])
    .map((_0x146526) => {
      const _0x1fd6d3 = Number(_0x146526?.nodeType);
      if (_0x1fd6d3 === 3) return String(_0x146526?.textContent || '');
      if (_0x1fd6d3 !== 1) return '';
      if (String(_0x146526?.tagName || '').toUpperCase() === 'BR') return '\n';
      const _0x2a256c = Array.isArray(_0x146526?.childNodes) ? _0x146526.childNodes : [];
      if (_0x2a256c.length > 0) return collectPromptInnerText(_0x2a256c);
      return String(_0x146526?.textContent || '');
    })
    .join('');
}
function createPromptEl(_0x562afd = 'test prompt') {
  if (Array.isArray(_0x562afd)) {
    const _0x129fd8 = collectPromptInnerText(_0x562afd);
    return { innerText: _0x129fd8, textContent: _0x129fd8, childNodes: _0x562afd };
  }
  const _0x22a13d = String(_0x562afd || '');
  return { innerText: _0x22a13d, textContent: _0x22a13d, childNodes: [createPromptTextNode(_0x22a13d)] };
}
function createTestContext({
  targetId: _0x3e8788,
  nodeData: _0x398dc0,
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  prompt: prompt = 'test prompt',
  promptEl: promptEl = null,
  apiImpl: apiImpl = {},
  startLoadingImpl: startLoadingImpl = () => {},
  stopLoadingImpl: stopLoadingImpl = () => {},
}) {
  const _0x120492 = { nodes: { ...nodes, [_0x3e8788]: { ..._0x398dc0 } } },
    _0x277466 = createStore(_0x120492, incomingEdges),
    _0x5086bd = createVideoNodeTaskOrchestrationModule({
      store: _0x277466,
      api: apiImpl,
      getImage: async () => null,
      startLoading: startLoadingImpl,
      stopLoading: stopLoadingImpl,
      ensureConfig: async () => {},
      getProviderConfig: () => ({ apiKey: '' }),
      isVideoVipModel: () => false,
      ensureVipSessionRecheck: async () => {},
    }),
    _0x3a6388 = Object.assign(Object.create(_0x5086bd), {
      nodeId: _0x3e8788,
      _data: _0x120492.nodes[_0x3e8788],
      promptEl: promptEl || createPromptEl(prompt),
      _normalizeDreaminaNodeData(_0x4a33a6) {
        return _0x4a33a6;
      },
      _resolveMediaUrl(_0x272551) {
        return String(_0x272551 || '');
      },
      _isDreaminaVideoNode(_0x2eae6f) {
        const _0x2527d5 = String(_0x2eae6f?.provider || '')
            .trim()
            .toLowerCase(),
          _0x39f1c9 = String(_0x2eae6f?.model || '').trim();
        return _0x2527d5 === 'dreamina' || _0x39f1c9.startsWith('dreamina/');
      },
      _isRunninghubWorkflowModel() {
        return false;
      },
    });
  return { ctx: _0x3a6388, proto: _0x5086bd, state: _0x120492, store: _0x277466 };
}
(test('video task orchestration: Agnes random seed refreshes on submit and stays random in store', async () => {
  const _0x313bf2 = 'node-agnes-submit-random-seed',
    {
      proto: _0x307e31,
      ctx: _0x1697e9,
      state: _0x1782ee,
    } = createTestContext({
      targetId: _0x313bf2,
      nodeData: {
        id: _0x313bf2,
        provider: 'agnes',
        model: 'agnes/agnes-video-v2.0',
        generationParams: { aspectRatio: '16:9', seed: '8888', seed_mode: 'random' },
        generationParamsByModel: {
          'agnes/agnes-video-v2.0': { aspectRatio: '16:9', seed: '8888', seed_mode: 'random' },
        },
      },
      prompt: 'agnes camera move',
    }),
    _0x24d6e4 = Math.random;
  Math.random = () => 0;
  try {
    const _0x130278 = await _0x307e31._buildPayloadImpl.call(_0x1697e9, null, {
      randomizeSubmitParams: true,
    });
    (assert.equal(_0x130278.generationParams.seed, '0'),
      assert.equal(_0x130278.generationParams.seed_mode, 'fixed'),
      assert.equal(_0x1782ee.nodes[_0x313bf2].generationParams.seed, '0'),
      assert.equal(_0x1782ee.nodes[_0x313bf2].generationParams.seed_mode, 'random'),
      assert.deepEqual(_0x1782ee.nodes[_0x313bf2].generationParamsByModel['agnes/agnes-video-v2.0'], {
        aspectRatio: '16:9',
        seed: '0',
        seed_mode: 'random',
      }));
  } finally {
    Math.random = _0x24d6e4;
  }
}),
  test('video task orchestration: Agnes fixed seed is not refreshed on submit', async () => {
    const _0x54aca5 = 'node-agnes-submit-fixed-seed',
      {
        proto: _0x4fdf51,
        ctx: _0x809aaa,
        state: _0x48f91f,
      } = createTestContext({
        targetId: _0x54aca5,
        nodeData: {
          id: _0x54aca5,
          provider: 'agnes',
          model: 'agnes/agnes-video-v2.0',
          generationParams: { aspectRatio: '16:9', seed: '8888', seed_mode: 'fixed' },
        },
        prompt: 'agnes fixed seed move',
      }),
      _0x33cdca = Math.random;
    Math.random = () => {
      throw new Error('fixed mode should not randomize seed');
    };
    try {
      const _0x32e8ac = await _0x4fdf51._buildPayloadImpl.call(_0x809aaa, null, {
        randomizeSubmitParams: true,
      });
      (assert.equal(_0x32e8ac.generationParams.seed, '8888'),
        assert.equal(_0x32e8ac.generationParams.seed_mode, 'fixed'),
        assert.deepEqual(_0x48f91f.nodes[_0x54aca5].generationParams, {
          aspectRatio: '16:9',
          seed: '8888',
          seed_mode: 'fixed',
        }));
    } finally {
      Math.random = _0x33cdca;
    }
  }),
  test('video task orchestration: APIMart modelApi payload keeps existing controls and typed media', async () => {
    const _0x5844e5 = 'node-apimart-modelapi',
      { proto: _0x43acc3, ctx: _0x42d7e9 } = createTestContext({
        targetId: _0x5844e5,
        nodeData: {
          id: _0x5844e5,
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
            fileSize: 5 * 0x400 * 0x400,
          },
        },
        incomingEdges: [
          { id: 'edge-image', sourceId: 'image1', targetId: _0x5844e5 },
          { id: 'edge-audio', sourceId: 'audio1', targetId: _0x5844e5 },
        ],
        prompt: 'cinematic horse',
      }),
      _0x5cd3e5 = await _0x43acc3._buildPayloadImpl.call(_0x42d7e9);
    (assert.equal(_0x5cd3e5.model, 'apimart/wan2.7'),
      assert.equal(_0x5cd3e5.provider, 'apimart'),
      assert.equal(_0x5cd3e5.aspectRatio, '1:1'),
      assert.equal(_0x5cd3e5.resolution, '1080P'),
      assert.equal(_0x5cd3e5.duration, 6),
      assert.deepEqual(_0x5cd3e5.generationParams, { wan27_mode: 'image' }),
      assert.deepEqual(_0x5cd3e5.inputUrls, ['https://cdn.apimart.ai/ref-image.png']),
      assert.deepEqual(_0x5cd3e5.images, ['https://cdn.apimart.ai/ref-image.png']),
      assert.deepEqual(_0x5cd3e5.videos, []),
      assert.deepEqual(_0x5cd3e5.audios, ['https://cdn.apimart.ai/ref-audio.mp3']));
  }),
  test('video task orchestration: modelApi payload reads latest Store parameters before submit', async () => {
    const _0x2beb19 = 'node-volcengine-seedance-latest-params',
      {
        proto: _0x247eac,
        ctx: _0x393d28,
        store: _0x24f48a,
      } = createTestContext({
        targetId: _0x2beb19,
        nodeData: {
          id: _0x2beb19,
          model: 'volcengine/seedance-2.0',
          provider: 'volcengine',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
          generationParams: { aspectRatio: '16:9', resolution: '720p', duration: 5 },
        },
        prompt: 'cinematic city flythrough',
      });
    _0x24f48a.updateNodeData(_0x2beb19, {
      generationParams: { aspectRatio: '9:16', resolution: '1080p', duration: 15 },
    });
    const _0x911e12 = await _0x247eac._buildPayloadImpl.call(_0x393d28);
    (assert.equal(_0x911e12.aspectRatio, '9:16'),
      assert.equal(_0x911e12.resolution, '1080p'),
      assert.equal(_0x911e12.videoSize, '1080p'),
      assert.equal(_0x911e12.duration, 15),
      assert.deepEqual(_0x911e12.generationParams, {
        aspectRatio: '9:16',
        resolution: '1080p',
        duration: 15,
      }),
      assert.equal(_0x393d28._data.generationParams.duration, 15));
  }),
  test('video task orchestration: modelApi adaptive ratio uses source media size', async () => {
    const _0x436c08 = 'node-video-runninghub-wan-adaptive-source',
      _0x4df36a = 'node-image-runninghub-wan-portrait',
      { proto: _0x6abfaa, ctx: _0x3d249d } = createTestContext({
        targetId: _0x436c08,
        nodeData: {
          id: _0x436c08,
          model: 'runninghub-model/wan2.7',
          provider: 'runninghub',
          aspectRatio: '自适应',
          width: 0x640,
          height: 0x384,
          generationParams: { wan27_mode: 'image', aspectRatio: '自适应' },
        },
        nodes: {
          [_0x4df36a]: {
            id: _0x4df36a,
            type: 'source-image',
            imageUrl: 'https://www.runninghub.cn/assets/portrait.png',
            originalWidth: 0x2d0,
            originalHeight: 0x500,
          },
        },
        incomingEdges: [{ id: 'edge-wan-portrait', sourceId: _0x4df36a, targetId: _0x436c08 }],
        prompt: 'make it move',
      }),
      _0x1b2699 = await _0x6abfaa._buildPayloadImpl.call(_0x3d249d);
    (assert.equal(_0x1b2699.aspectRatio, '自适应'), assert.equal(_0x1b2699.resolvedRatioLabel, '9:16'));
  }),
  test('video task orchestration: BERNINI workflow adaptive ratio uses node display size', async () => {
    const _0x19961e = 'node-video-bernini-adaptive-display',
      { proto: _0x4120f3, ctx: _0x10e7c6 } = createTestContext({
        targetId: _0x19961e,
        nodeData: {
          id: _0x19961e,
          model: 'runninghub/2062515720147259393',
          provider: 'runninghubwf',
          width: 0x384,
          height: 0x640,
          generationParams: {
            rhVideoResolution: 0x340,
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
            width: 0x500,
            height: 0x2d0,
          },
        },
        incomingEdges: [
          {
            id: 'edge-source-video-landscape',
            sourceId: 'source-video-landscape',
            targetId: _0x19961e,
            refSlot: 'sourceVideo',
          },
        ],
        prompt: 'portrait text video',
      });
    _0x10e7c6._isRunninghubWorkflowModel = () => true;
    const _0x363112 = await _0x4120f3._buildPayloadImpl.call(_0x10e7c6);
    (assert.equal(_0x363112.generationParams.rhBerniniAspectRatio, '自适应'),
      assert.equal(_0x363112.resolvedRatioLabel, '9:16'));
  }),
  test('video task orchestration: modelApi adaptive ratio falls back to node display size', async () => {
    const _0x23e32a = 'node-video-runninghub-veo-adaptive-display',
      { proto: _0x2de595, ctx: _0x3e6fed } = createTestContext({
        targetId: _0x23e32a,
        nodeData: {
          id: _0x23e32a,
          model: 'runninghub-model/veo3',
          provider: 'runninghub',
          aspectRatio: '自适应',
          width: 0x640,
          height: 0x384,
          generationParams: { rh_veo3_channel: 'lowCost', mode: 'fast', aspectRatio: '自适应' },
        },
        prompt: 'wide city lights',
      }),
      _0x2e5b5e = await _0x2de595._buildPayloadImpl.call(_0x3e6fed);
    (assert.equal(_0x2e5b5e.aspectRatio, '自适应'), assert.equal(_0x2e5b5e.resolvedRatioLabel, '16:9'));
  }),
  test('video task orchestration: modelApi adaptive ratio falls back to manifest option', async () => {
    const _0x15c451 = 'node-video-runninghub-happyhorse-adaptive-default',
      { proto: _0x231d5d, ctx: _0x3b5e3e } = createTestContext({
        targetId: _0x15c451,
        nodeData: {
          id: _0x15c451,
          model: 'runninghub-model/happyhorse-1.0',
          provider: 'runninghub',
          aspectRatio: '自适应',
          generationParams: { happyhorse_mode: 'image', aspectRatio: '自适应' },
        },
        prompt: 'running horse',
      }),
      _0x355cf5 = await _0x231d5d._buildPayloadImpl.call(_0x3b5e3e);
    (assert.equal(_0x355cf5.aspectRatio, '自适应'),
      assert.equal(_0x355cf5.resolvedRatioLabel, '16:9'),
      assert.equal(_0x355cf5.generationParams.happyhorse_mode, 'auto'));
  }),
  test('video task orchestration: Wan2.7 video mode validates continuation input', async () => {
    const _0x2a4645 = globalThis.window.showToast,
      _0x408eeb = [];
    globalThis.window.showToast = (_0xb269dd) => _0x408eeb.push(String(_0xb269dd || ''));
    try {
      const _0x38b1fd = 'node-apimart-wan27-video',
        _0x28b717 = createTestContext({
          targetId: _0x38b1fd,
          nodeData: {
            id: _0x38b1fd,
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
          incomingEdges: [{ id: 'edge-video', sourceId: 'video1', targetId: _0x38b1fd }],
          prompt: 'continue forward',
        }),
        _0x2bb1b4 = await _0x28b717.proto._buildPayloadImpl.call(_0x28b717.ctx);
      (assert.deepEqual(_0x2bb1b4.images, []),
        assert.deepEqual(_0x2bb1b4.videos, ['https://cdn.apimart.ai/ref-video.mp4']),
        assert.deepEqual(_0x2bb1b4.audios, []),
        assert.deepEqual(_0x2bb1b4.inputUrls, []),
        assert.deepEqual(_0x2bb1b4.generationParams, { wan27_mode: 'video' }));
      const _0x4ed4b7 = createTestContext({
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
        _0x2736ec = await _0x4ed4b7.proto._buildPayloadImpl.call(_0x4ed4b7.ctx);
      (assert.deepEqual(_0x2736ec.videos, ['https://cdn.apimart.ai/ref-video.mp4']),
        assert.deepEqual(_0x2736ec.generationParams, { wan27_mode: 'video' }));
      const _0x785878 = createTestContext({
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
        _0x12d5d3 = await _0x785878.proto._buildPayloadImpl.call(_0x785878.ctx);
      (assert.deepEqual(_0x12d5d3.videos, ['https://cdn.apimart.ai/ref-video.mp4']),
        assert.deepEqual(_0x12d5d3.generationParams, { wan27_mode: 'video' }));
      const _0x2ac8c2 = createTestContext({
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
        _0x38e942 = await _0x2ac8c2.proto._buildPayloadImpl.call(_0x2ac8c2.ctx);
      (assert.deepEqual(_0x38e942.videos, ['https://www.runninghub.cn/assets/wan-source.mp4']),
        assert.deepEqual(_0x38e942.generationParams, { wan27_mode: 'video' }));
      const _0x3f7dc8 = createTestContext({
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
      (assert.equal(await _0x3f7dc8.proto._buildPayloadImpl.call(_0x3f7dc8.ctx), null),
        assert.match(_0x408eeb.join('\n'), /不能超过 10 秒/));
    } finally {
      globalThis.window.showToast = _0x2a4645;
    }
  }),
  test('video task orchestration: Wan2.7 image mode validates audio limits', async () => {
    const _0x527f80 = globalThis.window.showToast,
      _0x3c9770 = [];
    globalThis.window.showToast = (_0x539800) => _0x3c9770.push(String(_0x539800 || ''));
    try {
      const _0x2638e8 = createTestContext({
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
      (assert.equal(await _0x2638e8.proto._buildPayloadImpl.call(_0x2638e8.ctx), null),
        assert.match(_0x3c9770.join('\n'), /音频必须为 2-30 秒/),
        (_0x3c9770.length = 0));
      const _0x23aa6a = createTestContext({
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
            fileSize: 16 * 0x400 * 0x400,
          },
        },
        incomingEdges: [
          { id: 'edge-large-audio', sourceId: 'audio1', targetId: 'node-apimart-wan27-audio-large' },
        ],
        prompt: 'music driven motion',
      });
      (assert.equal(await _0x23aa6a.proto._buildPayloadImpl.call(_0x23aa6a.ctx), null),
        assert.match(_0x3c9770.join('\n'), /小于 15MB/));
    } finally {
      globalThis.window.showToast = _0x527f80;
    }
  }),
  test('video task orchestration: Wan2.7 reference and edit modes filter media', async () => {
    const _0x19259c = globalThis.window.showToast,
      _0x1f7777 = [];
    globalThis.window.showToast = (_0x4c8386) => _0x1f7777.push(String(_0x4c8386 || ''));
    try {
      const _0x42a295 = 'node-apimart-wan27-reference',
        _0x494933 = createTestContext({
          targetId: _0x42a295,
          nodeData: {
            id: _0x42a295,
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
              audioSizeBytes: 0x400 * 0x400,
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
              targetId: _0x42a295,
              refSlot: 'referenceImage',
            },
            {
              id: 'edge-reference-video',
              sourceId: 'video1',
              targetId: _0x42a295,
              refSlot: 'referenceVideo',
            },
            {
              id: 'edge-reference-audio',
              sourceId: 'audio1',
              targetId: _0x42a295,
              refSlot: 'referenceAudio',
            },
          ],
          prompt: 'use the character and camera style',
        }),
        _0x2bf2b3 = await _0x494933.proto._buildPayloadImpl.call(_0x494933.ctx);
      (assert.deepEqual(_0x2bf2b3.images, ['https://cdn.apimart.ai/ref-image.png']),
        assert.deepEqual(_0x2bf2b3.videos, ['https://cdn.apimart.ai/ref-video.mp4']),
        assert.deepEqual(_0x2bf2b3.audios, ['https://cdn.apimart.ai/ref-voice.mp3']),
        assert.deepEqual(_0x2bf2b3.inputUrls, ['https://cdn.apimart.ai/ref-image.png']),
        assert.deepEqual(_0x2bf2b3.generationParams, { wan27_mode: 'reference' }));
      const _0x2a2f10 = 'node-apimart-wan27-edit',
        _0x3a9d3f = createTestContext({
          targetId: _0x2a2f10,
          nodeData: {
            id: _0x2a2f10,
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
            { id: 'edge-original', sourceId: 'original', targetId: _0x2a2f10, refSlot: 'originalVideo' },
            { id: 'edge-reference', sourceId: 'reference', targetId: _0x2a2f10, refSlot: 'referenceVideo' },
          ],
          prompt: 'change clothes to red dress',
        }),
        _0x85282e = await _0x3a9d3f.proto._buildPayloadImpl.call(_0x3a9d3f.ctx);
      (assert.deepEqual(_0x85282e.images, []),
        assert.deepEqual(_0x85282e.videos, [
          'https://cdn.apimart.ai/original.mp4',
          'https://cdn.apimart.ai/reference.mp4',
        ]),
        assert.deepEqual(_0x85282e.audios, []),
        assert.deepEqual(_0x85282e.inputUrls, []),
        assert.deepEqual(_0x85282e.generationParams, { wan27_mode: 'edit' }));
      const _0x5c0c0e = createTestContext({
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
      (assert.equal(await _0x5c0c0e.proto._buildPayloadImpl.call(_0x5c0c0e.ctx), null),
        assert.match(_0x1f7777.join('\n'), /2-10 秒/));
    } finally {
      globalThis.window.showToast = _0x19259c;
    }
  }),
  test('video task orchestration: Hailuo 02 fixed frame slots produce inputUrlsBySlot', async () => {
    const _0x2429bd = 'node-apimart-hailuo-02',
      { proto: _0x41c15c, ctx: _0x9f2d0d } = createTestContext({
        targetId: _0x2429bd,
        nodeData: {
          id: _0x2429bd,
          model: 'apimart/minimax-hailuo',
          provider: 'apimart',
          generationParams: { duration: 10, resolution: '768p' },
        },
        nodes: {
          first: { id: 'first', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/first.png' },
          last: { id: 'last', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/last.png' },
        },
        incomingEdges: [
          { id: 'edge-first', sourceId: 'first', targetId: _0x2429bd, refSlot: 'firstFrame' },
          { id: 'edge-last', sourceId: 'last', targetId: _0x2429bd, refSlot: 'lastFrame' },
        ],
        prompt: 'cinematic transition',
      }),
      _0x4aa2f3 = await _0x41c15c._buildPayloadImpl.call(_0x9f2d0d);
    (assert.deepEqual(_0x4aa2f3.images, [
      'https://cdn.apimart.ai/first.png',
      'https://cdn.apimart.ai/last.png',
    ]),
      assert.deepEqual(_0x4aa2f3.inputUrls, _0x4aa2f3.images),
      assert.deepEqual(_0x4aa2f3.inputUrlsBySlot, {
        firstFrame: 'https://cdn.apimart.ai/first.png',
        lastFrame: 'https://cdn.apimart.ai/last.png',
      }));
  }),
  test('video task orchestration: RunningHub Hailuo 02 fixed frame slots produce inputUrlsBySlot', async () => {
    const _0x4d02c7 = 'node-runninghub-hailuo-02',
      { proto: _0x2a40c0, ctx: _0x159e57 } = createTestContext({
        targetId: _0x4d02c7,
        nodeData: {
          id: _0x4d02c7,
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
          { id: 'edge-first', sourceId: 'first', targetId: _0x4d02c7, refSlot: 'firstFrame' },
          { id: 'edge-last', sourceId: 'last', targetId: _0x4d02c7, refSlot: 'lastFrame' },
        ],
        prompt: 'cinematic transition',
      }),
      _0x47d6c2 = await _0x2a40c0._buildPayloadImpl.call(_0x159e57);
    (assert.equal(_0x47d6c2.provider, 'runninghub'),
      assert.deepEqual(_0x47d6c2.inputUrlsBySlot, {
        firstFrame: 'https://www.runninghub.cn/assets/hailuo-first.png',
        lastFrame: 'https://www.runninghub.cn/assets/hailuo-last.png',
      }));
  }),
  test('video task orchestration: RunningHub Hailuo 2.3 fixed first frame slot produces inputUrlsBySlot', async () => {
    const _0x3e25c2 = 'node-runninghub-hailuo-23',
      { proto: _0x2103fc, ctx: _0xa4cd1d } = createTestContext({
        targetId: _0x3e25c2,
        nodeData: {
          id: _0x3e25c2,
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
        incomingEdges: [{ id: 'edge-first', sourceId: 'first', targetId: _0x3e25c2, refSlot: 'firstFrame' }],
        prompt: 'animate the first frame',
      }),
      _0x36b249 = await _0x2103fc._buildPayloadImpl.call(_0xa4cd1d);
    (assert.equal(_0x36b249.provider, 'runninghub'),
      assert.deepEqual(_0x36b249.inputUrlsBySlot, {
        firstFrame: 'https://www.runninghub.cn/assets/hailuo-23-first.png',
      }));
  }),
  test('video task orchestration: Hailuo 2.3 fixed first frame slot produces inputUrlsBySlot', async () => {
    const _0x17cfbc = 'node-apimart-hailuo-23',
      { proto: _0x44c29c, ctx: _0x4dc1e0 } = createTestContext({
        targetId: _0x17cfbc,
        nodeData: {
          id: _0x17cfbc,
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
        incomingEdges: [{ id: 'edge-first', sourceId: 'first', targetId: _0x17cfbc, refSlot: 'firstFrame' }],
        prompt: 'cinematic first frame motion',
      }),
      _0x31df12 = await _0x44c29c._buildPayloadImpl.call(_0x4dc1e0);
    (assert.deepEqual(_0x31df12.images, ['https://cdn.apimart.ai/hailuo-23-first.png']),
      assert.deepEqual(_0x31df12.inputUrls, _0x31df12.images),
      assert.deepEqual(_0x31df12.inputUrlsBySlot, {
        firstFrame: 'https://cdn.apimart.ai/hailuo-23-first.png',
      }));
  }),
  test('video task orchestration: VEO3 fixed slots reuse manifest input slot routing', async () => {
    const _0x2467b2 = 'node-apimart-veo3',
      { proto: _0x442071, ctx: _0x3180ac } = createTestContext({
        targetId: _0x2467b2,
        nodeData: {
          id: _0x2467b2,
          model: 'apimart/veo3-fast',
          provider: 'apimart',
          generationParams: { mode: 'fast', generation_type: 'frame', duration: 8, resolution: '720p' },
        },
        nodes: {
          first: { id: 'first', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/veo-first.png' },
          last: { id: 'last', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/veo-last.png' },
        },
        incomingEdges: [
          { id: 'edge-first', sourceId: 'first', targetId: _0x2467b2, refSlot: 'firstFrame' },
          { id: 'edge-last', sourceId: 'last', targetId: _0x2467b2, refSlot: 'lastFrame' },
        ],
        prompt: 'cinematic transition',
      }),
      _0x53d8f7 = await _0x442071._buildPayloadImpl.call(_0x3180ac);
    (assert.deepEqual(_0x53d8f7.images, [
      'https://cdn.apimart.ai/veo-first.png',
      'https://cdn.apimart.ai/veo-last.png',
    ]),
      assert.deepEqual(_0x53d8f7.inputUrlsBySlot, {
        firstFrame: 'https://cdn.apimart.ai/veo-first.png',
        lastFrame: 'https://cdn.apimart.ai/veo-last.png',
      }));
  }),
  test('video task orchestration: stale refSlot fills current VEO3 modelApi slot', async () => {
    const _0x40805e = 'node-apimart-veo3-stale-refslot',
      { proto: _0x58afb9, ctx: _0x21b28d } = createTestContext({
        targetId: _0x40805e,
        nodeData: {
          id: _0x40805e,
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
          { id: 'edge-legacy-refslot', sourceId: 'legacyRef', targetId: _0x40805e, refSlot: 'refImage' },
        ],
        prompt: 'cinematic transition',
      }),
      _0x4b43de = await _0x58afb9._buildPayloadImpl.call(_0x21b28d);
    (assert.deepEqual(_0x4b43de.images, ['https://cdn.apimart.ai/legacy-ref.png']),
      assert.deepEqual(_0x4b43de.inputUrlsBySlot, { firstFrame: 'https://cdn.apimart.ai/legacy-ref.png' }));
  }),
  test('video task orchestration: Vidu Q3 switches fixed slots by generation mode', async () => {
    const _0x211549 = 'node-apimart-vidu-q3-video',
      _0x2b433f = createTestContext({
        targetId: _0x211549,
        nodeData: {
          id: _0x211549,
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
          { id: 'edge-first', sourceId: 'first', targetId: _0x211549, refSlot: 'firstFrame' },
          { id: 'edge-last', sourceId: 'last', targetId: _0x211549, refSlot: 'lastFrame' },
        ],
        prompt: 'cinematic Vidu transition',
      }),
      _0x4a7487 = await _0x2b433f.proto._buildPayloadImpl.call(_0x2b433f.ctx);
    assert.deepEqual(_0x4a7487.inputUrlsBySlot, {
      firstFrame: 'https://cdn.apimart.ai/vidu-first.png',
      lastFrame: 'https://cdn.apimart.ai/vidu-last.png',
    });
    const _0x295f31 = 'node-apimart-vidu-q3-reference',
      _0x2c15c8 = createTestContext({
        targetId: _0x295f31,
        nodeData: {
          id: _0x295f31,
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
          { id: 'edge-ref-a', sourceId: 'refA', targetId: _0x295f31 },
          { id: 'edge-ref-b', sourceId: 'refB', targetId: _0x295f31 },
        ],
        prompt: 'reference guided Vidu motion',
      }),
      _0x2f2531 = await _0x2c15c8.proto._buildPayloadImpl.call(_0x2c15c8.ctx);
    (assert.deepEqual(_0x2f2531.images, [
      'https://cdn.apimart.ai/vidu-ref-a.png',
      'https://cdn.apimart.ai/vidu-ref-b.png',
    ]),
      assert.equal(_0x2f2531.inputUrlsBySlot, undefined));
  }),
  test('video task orchestration: Kling V3 Omni modes filter media and fixed slots', async () => {
    const _0x3fa2e8 = 'node-apimart-kling-omni-image',
      _0x39d5b9 = createTestContext({
        targetId: _0x3fa2e8,
        nodeData: {
          id: _0x3fa2e8,
          model: 'apimart/kling-v3-omni',
          provider: 'apimart',
          generationParams: { kling_v3_omni_mode: 'image', duration: 6, resolution: 'pro' },
        },
        nodes: {
          first: { id: 'first', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/omni-first.png' },
          last: { id: 'last', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/omni-last.png' },
        },
        incomingEdges: [
          { id: 'edge-last', sourceId: 'last', targetId: _0x3fa2e8, refSlot: 'lastFrame' },
          { id: 'edge-first', sourceId: 'first', targetId: _0x3fa2e8, refSlot: 'firstFrame' },
        ],
        prompt: 'omni image mode',
      }),
      _0xdd13d2 = await _0x39d5b9.proto._buildPayloadImpl.call(_0x39d5b9.ctx);
    (assert.equal(_0xdd13d2.generationParams.kling_v3_omni_mode, 'image'),
      assert.deepEqual(_0xdd13d2.images, [
        'https://cdn.apimart.ai/omni-first.png',
        'https://cdn.apimart.ai/omni-last.png',
      ]),
      assert.deepEqual(_0xdd13d2.inputUrlsBySlot, {
        firstFrame: 'https://cdn.apimart.ai/omni-first.png',
        lastFrame: 'https://cdn.apimart.ai/omni-last.png',
      }));
    const _0x420865 = 'node-apimart-kling-omni-reference',
      _0x5a0a77 = createTestContext({
        targetId: _0x420865,
        nodeData: {
          id: _0x420865,
          model: 'apimart/kling-v3-omni',
          provider: 'apimart',
          generationParams: { kling_v3_omni_mode: 'reference' },
        },
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/omni-ref.png' },
          video1: { id: 'video1', type: 'source-video', videoUrl: 'https://cdn.apimart.ai/omni-feature.mp4' },
        },
        incomingEdges: [
          { id: 'edge-ref-image', sourceId: 'image1', targetId: _0x420865, refSlot: 'referenceImage' },
          { id: 'edge-ref-video', sourceId: 'video1', targetId: _0x420865, refSlot: 'referenceVideo' },
        ],
        prompt: 'omni reference mode',
      }),
      _0x45fd2c = await _0x5a0a77.proto._buildPayloadImpl.call(_0x5a0a77.ctx);
    (assert.deepEqual(_0x45fd2c.images, ['https://cdn.apimart.ai/omni-ref.png']),
      assert.deepEqual(_0x45fd2c.videos, ['https://cdn.apimart.ai/omni-feature.mp4']),
      assert.deepEqual(_0x45fd2c.inputUrlsBySlot, { referenceImage: 'https://cdn.apimart.ai/omni-ref.png' }));
    const _0x39bd2f = 'node-apimart-kling-omni-edit',
      _0x1ad250 = createTestContext({
        targetId: _0x39bd2f,
        nodeData: {
          id: _0x39bd2f,
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
          { id: 'edge-edit-video', sourceId: 'video1', targetId: _0x39bd2f, refSlot: 'editVideo' },
        ],
        prompt: 'omni edit mode',
      }),
      _0x553464 = await _0x1ad250.proto._buildPayloadImpl.call(_0x1ad250.ctx);
    (assert.deepEqual(_0x553464.images, []),
      assert.deepEqual(_0x553464.videos, ['https://cdn.apimart.ai/omni-base.mp4']),
      assert.equal(_0x553464.inputUrlsBySlot, undefined));
  }),
  test('video task orchestration: Kling O1 converts image mentions and validates video slots', async () => {
    const _0x255a5e = 'node-apimart-kling-o1-image',
      _0x2a604d = createTestContext({
        targetId: _0x255a5e,
        nodeData: {
          id: _0x255a5e,
          model: 'apimart/kling-video-o1',
          provider: 'apimart',
          generationParams: { resolution: 'pro', duration: 5 },
        },
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/o1-ref-1.png' },
          image2: { id: 'image2', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/o1-ref-2.png' },
        },
        incomingEdges: [
          { id: 'edge-reference-image', sourceId: 'image1', targetId: _0x255a5e, refSlot: 'referenceImage' },
          { id: 'edge-extra-image', sourceId: 'image2', targetId: _0x255a5e },
        ],
        prompt: '让@图片1走向@图片2',
      }),
      _0x2a2fc4 = await _0x2a604d.proto._buildPayloadImpl.call(_0x2a604d.ctx);
    (assert.equal(_0x2a2fc4.prompt, '让<<<image_1>>>走向<<<image_2>>>'),
      assert.deepEqual(_0x2a2fc4.images, [
        'https://cdn.apimart.ai/o1-ref-1.png',
        'https://cdn.apimart.ai/o1-ref-2.png',
      ]),
      assert.equal(_0x2a2fc4.klingO1VideoRole, undefined));
    const _0xd1bf9b = 'node-apimart-kling-o1-feature',
      _0xff5180 = createTestContext({
        targetId: _0xd1bf9b,
        nodeData: { id: _0xd1bf9b, model: 'apimart/kling-video-o1', provider: 'apimart' },
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
          { id: 'edge-ref-image', sourceId: 'image1', targetId: _0xd1bf9b, refSlot: 'referenceImage' },
          {
            id: 'edge-feature-video',
            sourceId: 'video1',
            targetId: _0xd1bf9b,
            refSlot: 'featureReferenceVideo',
          },
        ],
        prompt: 'use @图片1 with feature video',
      }),
      _0x66265a = await _0xff5180.proto._buildPayloadImpl.call(_0xff5180.ctx);
    (assert.equal(_0x66265a.prompt, 'use <<<image_1>>> with feature video'),
      assert.deepEqual(_0x66265a.images, ['https://cdn.apimart.ai/o1-feature-ref.png']),
      assert.deepEqual(_0x66265a.videos, ['https://cdn.apimart.ai/o1-feature.mp4']),
      assert.equal(_0x66265a.klingO1VideoRole, 'feature'));
    const _0x535f49 = globalThis.window.showToast,
      _0x45a591 = [];
    globalThis.window.showToast = (_0x55ba67) => _0x45a591.push(String(_0x55ba67 || ''));
    try {
      const _0x87e868 = createTestContext({
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
        _0x1e80cc = await _0x87e868.proto._buildPayloadImpl.call(_0x87e868.ctx);
      (assert.equal(_0x1e80cc, null),
        assert.equal(
          _0x45a591.some((_0x507393) => _0x507393.includes('3-10')),
          true,
        ));
    } finally {
      globalThis.window.showToast = _0x535f49;
    }
  }),
  test('video task orchestration: HappyHorse mode filters media and requires prompt', async () => {
    const _0xda230b = 'node-apimart-happyhorse-image',
      { proto: _0x82a8f0, ctx: _0x5a9879 } = createTestContext({
        targetId: _0xda230b,
        nodeData: {
          id: _0xda230b,
          model: 'apimart/happyhorse-1.0',
          provider: 'apimart',
          generationParams: { happyhorse_mode: 'image', duration: 5 },
        },
        nodes: {
          image1: { id: 'image1', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/ref-1.png' },
          image2: { id: 'image2', type: 'source-image', imageUrl: 'https://cdn.apimart.ai/ref-2.png' },
        },
        incomingEdges: [
          { id: 'edge-image-1', sourceId: 'image1', targetId: _0xda230b, refSlot: 'lastFrame' },
          { id: 'edge-image-2', sourceId: 'image2', targetId: _0xda230b, refSlot: 'firstFrame' },
        ],
        prompt: 'running horse',
      }),
      _0x584068 = await _0x82a8f0._buildPayloadImpl.call(_0x5a9879);
    (assert.equal(_0x584068.model, 'apimart/happyhorse-1.0'),
      assert.equal(_0x584068.generationParams.happyhorse_mode, 'image'),
      assert.deepEqual(_0x584068.images, ['https://cdn.apimart.ai/ref-2.png']),
      assert.deepEqual(_0x584068.videos, []),
      assert.deepEqual(_0x584068.inputUrls, ['https://cdn.apimart.ai/ref-2.png']),
      (_0x5a9879.promptEl = createPromptEl('')));
    const _0x50fb83 = [],
      _0x5eb93b = globalThis.window.showToast;
    globalThis.window.showToast = (_0x746511) => _0x50fb83.push(String(_0x746511 || ''));
    try {
      assert.equal(await _0x82a8f0._buildPayloadImpl.call(_0x5a9879), null);
    } finally {
      globalThis.window.showToast = _0x5eb93b;
    }
    assert.match(_0x50fb83.join('\n'), /必须填写提示词/);
  }),
  test('video task orchestration: HappyHorse blocks incompatible video refs and long edits', async () => {
    const _0x49cc00 = globalThis.window.showToast,
      _0x56b2c3 = [];
    globalThis.window.showToast = (_0x43c105) => _0x56b2c3.push(String(_0x43c105 || ''));
    try {
      const _0x433074 = 'node-apimart-happyhorse-reference',
        _0x27d645 = createTestContext({
          targetId: _0x433074,
          nodeData: {
            id: _0x433074,
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
          incomingEdges: [{ id: 'edge-video', sourceId: 'video1', targetId: _0x433074 }],
          prompt: 'reference horse',
        });
      (assert.equal(await _0x27d645.proto._buildPayloadImpl.call(_0x27d645.ctx), null),
        assert.match(_0x56b2c3.join('\n'), /参考图生视频模式不接受视频入参/));
      const _0x409aed = 'node-apimart-happyhorse-edit',
        _0xa91383 = createTestContext({
          targetId: _0x409aed,
          nodeData: {
            id: _0x409aed,
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
          incomingEdges: [{ id: 'edge-long-video', sourceId: 'video1', targetId: _0x409aed }],
          prompt: 'edit horse',
        });
      (assert.equal(await _0xa91383.proto._buildPayloadImpl.call(_0xa91383.ctx), null),
        assert.match(_0x56b2c3.join('\n'), /不能超过 15 秒/),
        (_0x56b2c3.length = 0));
      const _0x2d5035 = 'node-runninghub-happyhorse-edit',
        _0x26fbb4 = createTestContext({
          targetId: _0x2d5035,
          nodeData: {
            id: _0x2d5035,
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
          incomingEdges: [{ id: 'edge-runninghub-video', sourceId: 'video1', targetId: _0x2d5035 }],
          prompt: 'edit runninghub horse',
        }),
        _0x2dfa94 = await _0x26fbb4.proto._buildPayloadImpl.call(_0x26fbb4.ctx);
      (assert.equal(_0x2dfa94.model, 'runninghub-model/happyhorse-1.0'),
        assert.equal(_0x2dfa94.generationParams.happyhorse_mode, 'edit'),
        assert.deepEqual(_0x2dfa94.videos, ['https://www.runninghub.cn/assets/long-source.mp4']),
        assert.equal(_0x56b2c3.join('\n'), ''));
    } finally {
      globalThis.window.showToast = _0x49cc00;
    }
  }),
  test('video task orchestration: /预设模板支持用户输入默认值', async () => {
    const _0x5c1e6f = 'node-video-template-fallback',
      _0x3caa8d = { id: _0x5c1e6f, model: 'grsai-video-basic', provider: 'grsai' },
      { proto: _0x4c5b25, ctx: _0x12764a } = createTestContext({
        targetId: _0x5c1e6f,
        nodeData: _0x3caa8d,
        prompt: '',
      }),
      _0x3fcd23 = await _0x4c5b25._buildPayloadImpl.call(_0x12764a, '镜头：{用户输入 || 默认视频描述}');
    (assert.ok(_0x3fcd23),
      assert.equal(_0x3fcd23.prompt, '镜头：默认视频描述'),
      (_0x12764a.promptEl = createPromptEl('夜景推镜')));
    const _0x1ac937 = await _0x4c5b25._buildPayloadImpl.call(_0x12764a, '镜头：{用户输入 || 默认视频描述}');
    (assert.ok(_0x1ac937), assert.equal(_0x1ac937.prompt, '镜头：夜景推镜'));
  }),
  test('video task orchestration: running RH store state cancels even when local flag is stale', async () => {
    const _0xebb576 = 'node-video-running-store-cancels',
      {
        proto: _0x584ea6,
        ctx: _0x2359b2,
        state: _0x311f2b,
      } = createTestContext({
        targetId: _0xebb576,
        nodeData: {
          id: _0xebb576,
          model: 'runninghub/2041741496667348994',
          provider: 'runninghubwf',
          rhTaskId: 'rh-running',
          rhTaskStatus: 'running',
          jobStatus: 'running',
          isGenerating: true,
        },
      });
    let _0x3b4aa9 = 0,
      _0x35f7a8 = 0;
    ((_0x2359b2._isGenerating = false),
      (_0x2359b2._isRunninghubWorkflowModel = () => true),
      (_0x2359b2._cancelRunningHubWorkflowTask = async () => {
        _0x3b4aa9 += 1;
      }),
      (_0x2359b2._onGenerate = async () => {
        _0x35f7a8 += 1;
      }),
      (_0x311f2b.nodes[_0xebb576] = {
        ..._0x311f2b.nodes[_0xebb576],
        rhTaskId: 'rh-running',
        rhTaskStatus: 'running',
        jobStatus: 'running',
        isGenerating: true,
      }),
      await _0x584ea6._handleGenerateOrCancelImpl.call(_0x2359b2),
      assert.equal(_0x3b4aa9, 1),
      assert.equal(_0x35f7a8, 0));
  }),
  test('video task orchestration: 预览模式下点击生成只启动假加载不发请求', async () => {
    const _0x24e7d7 = globalThis.window.PREVIEW_MODE;
    globalThis.window.PREVIEW_MODE = true;
    try {
      const _0x359513 = 'node-video-preview-loading';
      let _0x298768 = false;
      const { proto: _0x5cc223, ctx: _0x2d5a54 } = createTestContext({
        targetId: _0x359513,
        nodeData: { id: _0x359513, model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
      });
      _0x2d5a54.previewEl = createFakePreviewContainer();
      const _0x2a050e = createVideoNodeTaskOrchestrationModule({
          store: {
            getState: () => ({
              nodes: {
                [_0x359513]: { id: _0x359513, model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
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
            _0x298768 = true;
          },
        }),
        _0x23eb84 = Object.assign(Object.create(_0x2a050e), {
          nodeId: _0x359513,
          _data: { id: _0x359513, model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
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
      (await _0x2a050e._onGenerateImpl.call(_0x23eb84),
        assert.equal(_0x298768, false),
        assert.equal(isPreviewNodeLoading(_0x359513), true),
        assert.equal(_0x23eb84.btnEl.disabled, true),
        assert.match(_0x23eb84.btnEl.innerHTML, /animation:spin/),
        stopPreviewNodeLoading(_0x359513),
        assert.equal(_0x23eb84.btnEl.disabled, false),
        assert.doesNotMatch(_0x23eb84.btnEl.innerHTML, /animation:spin/));
    } finally {
      globalThis.window.PREVIEW_MODE = _0x24e7d7;
    }
  }),
  test('video task orchestration: duplicate submit during async preparation only calls generate once', async () => {
    const _0x18fd8c = 'node-video-submit-lock';
    let _0x3bf705 = 0,
      _0x36a7eb;
    const _0x4d43b7 = new Promise((_0x239a77) => {
        _0x36a7eb = _0x239a77;
      }),
      { proto: _0x278514, ctx: _0x3c231c } = createTestContext({
        targetId: _0x18fd8c,
        nodeData: { id: _0x18fd8c, model: 'dreamina/seedance2.0fast', provider: 'dreamina' },
        apiImpl: {
          generateVideo: async () => {
            return (
              (_0x3bf705 += 1),
              { videoUrl: '/output/generated.mp4', localPath: '/output/generated.mp4' }
            );
          },
        },
      });
    ((_0x3c231c.btnEl = createButtonStub()),
      (_0x3c231c.previewEl = {}),
      (_0x3c231c._guardVipSelection = () => true),
      (_0x3c231c._buildPayload = async () => {
        return (
          await _0x4d43b7,
          { provider: 'dreamina', model: 'dreamina/seedance2.0fast', prompt: 'test prompt' }
        );
      }),
      (_0x3c231c._stopDreaminaRecovery = () => {}),
      (_0x3c231c._stopRunningHubRecovery = () => {}),
      (_0x3c231c._stopAsyncRecovery = () => {}),
      (_0x3c231c._persistAsyncResumeCache = () => {}),
      (_0x3c231c._persistDreaminaResumeCache = () => {}),
      (_0x3c231c._persistRunningHubResumeCache = () => {}),
      (_0x3c231c._updateSubmitButtonState = () => {}));
    const _0x2ed1db = _0x278514._onGenerateImpl.call(_0x3c231c);
    assert.equal(_0x3c231c._videoSubmitInFlight, true);
    const _0x3bef1c = _0x278514._onGenerateImpl.call(_0x3c231c);
    (_0x36a7eb(),
      await Promise.all([_0x2ed1db, _0x3bef1c]),
      assert.equal(_0x3bf705, 1),
      assert.equal(_0x3c231c._videoSubmitInFlight, false));
  }),
  test('video task orchestration: Dreamina foreground submit blocks duplicate recovery poller', async () => {
    const _0x518902 = 'node-video-submit-blocks-resume';
    let _0x599954 = 0;
    const { proto: _0x1e7260, ctx: _0x2c44d6 } = createTestContext({
      targetId: _0x518902,
      nodeData: {
        id: _0x518902,
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
          return ((_0x599954 += 1), {});
        },
      },
    });
    ((_0x2c44d6._isGenerating = true),
      (_0x2c44d6._videoSubmitInFlight = true),
      await _0x1e7260._maybeResumeDreaminaTaskImpl.call(_0x2c44d6),
      assert.equal(_0x599954, 0),
      assert.equal(_0x2c44d6._dreaminaResumePromise, undefined));
  }),
  test('video task orchestration: start patch enters running state over stale terminal fields', async () => {
    const _0x5a84d9 = 'node-video-start-running';
    let _0x23b88e = 0,
      _0x325485 = 0,
      _0x157405;
    const _0x1ad68b = new Promise((_0x408b88) => {
        _0x157405 = _0x408b88;
      }),
      {
        proto: _0xac91f6,
        ctx: _0x5f1084,
        state: _0x23377d,
      } = createTestContext({
        targetId: _0x5a84d9,
        nodeData: {
          id: _0x5a84d9,
          provider: 'apimart',
          model: 'apimart/video-model',
          isGenerating: false,
          jobStatus: 'success',
          jobError: null,
          generationDuration: 0x4d2,
          asyncTaskStatus: 'success',
          rhTaskStatus: 'success',
          dreaminaTaskStatus: 'success',
          dreaminaTaskPhase: 'done',
        },
        apiImpl: { generateVideo: async () => _0x1ad68b },
        startLoadingImpl: () => {
          _0x23b88e += 1;
        },
        stopLoadingImpl: () => {
          _0x325485 += 1;
        },
      });
    ((_0x5f1084._isGenerating = false),
      (_0x5f1084.btnEl = createButtonStub()),
      (_0x5f1084.previewEl = {}),
      (_0x5f1084._guardVipSelection = () => true),
      (_0x5f1084._buildPayload = async () => ({
        provider: 'apimart',
        model: 'apimart/video-model',
        prompt: 'test prompt',
      })),
      (_0x5f1084._stopDreaminaRecovery = () => {}),
      (_0x5f1084._stopRunningHubRecovery = () => {}),
      (_0x5f1084._stopAsyncRecovery = () => {}),
      (_0x5f1084._persistAsyncResumeCache = () => {}),
      (_0x5f1084._persistDreaminaResumeCache = () => {}),
      (_0x5f1084._persistRunningHubResumeCache = () => {}),
      (_0x5f1084._updateSubmitButtonState = () => {}));
    const _0x546d11 = _0xac91f6._onGenerateImpl.call(_0x5f1084);
    await flushUntil(() => _0x23377d.nodes[_0x5a84d9]?.asyncTaskStatus === 'pending');
    const _0x3f5019 = _0x23377d.nodes[_0x5a84d9];
    (assert.equal(_0x23b88e, 1),
      assert.equal(_0x325485, 0),
      assert.equal(_0x3f5019.isGenerating, true),
      assert.equal(_0x3f5019.jobStatus, 'running'),
      assert.equal(_0x3f5019.jobError, null),
      assert.equal(_0x3f5019.generationDuration, null),
      assert.equal(_0x3f5019.asyncTaskStatus, 'pending'),
      _0x157405({ videoUrl: '/output/generated.mp4', localPath: '/output/generated.mp4' }),
      await _0x546d11);
  }),
  test('video task orchestration: RH pending store state keeps cancel UI after submit returns without result', async () => {
    const _0x18089e = 'node-video-rh-pending-keeps-cancel';
    let _0x21a4f2 = 0,
      _0x4ab06c;
    const _0x4a3937 = new Promise((_0x36490b) => {
        _0x4ab06c = _0x36490b;
      }),
      {
        proto: _0x1c04fd,
        ctx: _0x170357,
        state: _0xf9016b,
      } = createTestContext({
        targetId: _0x18089e,
        nodeData: {
          id: _0x18089e,
          provider: 'runninghubwf',
          model: 'runninghub/1971148165531475969',
          isGenerating: false,
        },
        apiImpl: {
          generateVideo: async (_0x5b25bc, _0x58ae39 = {}) => {
            return (
              _0x58ae39.onTaskMeta?.({ taskId: 'rh-video-pending', useOpenapiQuery: true }),
              await _0x4a3937
            );
          },
        },
        stopLoadingImpl: () => {
          _0x21a4f2 += 1;
        },
      });
    ((_0x170357.btnEl = createButtonStub()),
      (_0x170357.previewEl = {}),
      (_0x170357._isRunninghubWorkflowModel = () => true),
      (_0x170357._guardVipSelection = () => true),
      (_0x170357._buildPayload = async () => ({
        provider: 'runninghubwf',
        model: 'runninghub/1971148165531475969',
        prompt: 'test prompt',
        apiKey: 'rh-key',
      })),
      (_0x170357._stopDreaminaRecovery = () => {}),
      (_0x170357._stopRunningHubRecovery = () => {}),
      (_0x170357._stopAsyncRecovery = () => {}),
      (_0x170357._persistAsyncResumeCache = () => {}),
      (_0x170357._persistDreaminaResumeCache = () => {}),
      (_0x170357._persistRunningHubResumeCache = () => {}));
    const _0x4ee57b = _0x1c04fd._onGenerateImpl.call(_0x170357);
    await flushUntil(() => _0xf9016b.nodes[_0x18089e]?.rhTaskStatus === 'running');
    const _0x372fe3 = _0xf9016b.nodes[_0x18089e];
    (assert.equal(_0x372fe3.rhTaskStatus, 'running'),
      assert.equal(_0x170357._isGenerating, true),
      assert.equal(_0x170357._rhTaskId, 'rh-video-pending'),
      assert.equal(_0x170357.btnEl.disabled, false),
      assert.match(_0x170357.btnEl.innerHTML, /v2-task-cancel-spin/),
      assert.equal(_0x21a4f2, 0),
      _0x4ab06c({ videoUrl: '/output/generated.mp4', localPath: '/output/generated.mp4' }),
      await _0x4ee57b);
  }),
  test('task orchestration: adaptive multimodal ratio uses node display ratio', async () => {
    const _0x115e9a = 'node-video-1',
      _0x220644 = 'node-image-1',
      { proto: _0x8af02b, ctx: _0x31663b } = createTestContext({
        targetId: _0x115e9a,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 0x6a4,
          height: 0x384,
          resolution: '720p',
          duration: 5,
        },
        nodes: { [_0x220644]: { id: _0x220644, type: 'source-image', localPath: 'data/uploads/ref.png' } },
        incomingEdges: [{ id: 'edge-1', sourceId: _0x220644, targetId: _0x115e9a, refSlot: '' }],
      }),
      _0x4b7181 = await _0x8af02b._buildPayloadImpl.call(_0x31663b);
    (assert.equal(_0x4b7181.dreaminaTaskType, 'multimodal2video'),
      assert.equal(_0x4b7181.aspectRatio, '16:9'));
  }),
  test('task orchestration: frames fallback to text2video still uses adaptive mapping', async () => {
    const _0x176916 = 'node-video-2',
      { proto: _0x3694a5, ctx: _0x330fa1 } = createTestContext({
        targetId: _0x176916,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '自适应',
          width: 0x6a4,
          height: 0x384,
          resolution: '720p',
          duration: 5,
        },
        incomingEdges: [],
      }),
      _0x477965 = await _0x3694a5._buildPayloadImpl.call(_0x330fa1);
    (assert.equal(_0x477965.dreaminaTaskType, 'text2video'), assert.equal(_0x477965.aspectRatio, '16:9'));
  }),
  test('task orchestration: fixed ratio is preserved with image references', async () => {
    const _0x18fea3 = 'node-video-3',
      _0x50e2db = 'node-image-3',
      { proto: _0x7eea31, ctx: _0xca162 } = createTestContext({
        targetId: _0x18fea3,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '4:3',
          width: 0x6a4,
          height: 0x384,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x50e2db]: { id: _0x50e2db, type: 'source-image', localPath: 'data/uploads/ref-fixed.png' },
        },
        incomingEdges: [{ id: 'edge-3', sourceId: _0x50e2db, targetId: _0x18fea3, refSlot: '' }],
      }),
      _0x1144be = await _0x7eea31._buildPayloadImpl.call(_0xca162);
    (assert.equal(_0x1144be.dreaminaTaskType, 'multimodal2video'),
      assert.equal(_0x1144be.aspectRatio, '4:3'));
  }),
  test('task orchestration: text ref-pill is resolved into payload prompt', async () => {
    const _0x80d0e9 = 'node-video-text-pill',
      _0x4d859b = 'node-video-text-ref-pill',
      { proto: _0x55caf9, ctx: _0x49c4be } = createTestContext({
        targetId: _0x80d0e9,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: { [_0x4d859b]: { id: _0x4d859b, type: 'source-text', text: '来自文本节点的描述' } },
        incomingEdges: [
          { id: 'edge-video-text-pill', sourceId: _0x4d859b, targetId: _0x80d0e9, refSlot: '' },
        ],
        promptEl: createPromptEl([
          createPromptTextNode('镜头 '),
          createPromptPillNode('@文本1', _0x4d859b),
          createPromptTextNode(' 推进'),
        ]),
      }),
      _0x4145d8 = await _0x55caf9._buildPayloadImpl.call(_0x49c4be);
    assert.equal(_0x4145d8.prompt, '镜头 来自文本节点的描述 推进');
  }),
  test('task orchestration: plain-text text mention is resolved into payload prompt', async () => {
    const _0x8a265c = 'node-video-text-mention',
      _0x563157 = 'node-video-text-ref-mention',
      { proto: _0xd3ef2f, ctx: _0x3f6afd } = createTestContext({
        targetId: _0x8a265c,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: { [_0x563157]: { id: _0x563157, type: 'source-text', outputText: '直接替换的文本内容' } },
        incomingEdges: [
          { id: 'edge-video-text-mention', sourceId: _0x563157, targetId: _0x8a265c, refSlot: '' },
        ],
        prompt: '镜头 @文本1 推进',
      }),
      _0x135fd5 = await _0xd3ef2f._buildPayloadImpl.call(_0x3f6afd);
    assert.equal(_0x135fd5.prompt, '镜头 直接替换的文本内容 推进');
  }),
  test('task orchestration: unreferenced text inputs are prepended to payload prompt', async () => {
    const _0x5c6986 = 'node-video-text-prepend',
      _0x57b6d6 = 'node-video-text-ref-prepend',
      { proto: _0x3cf3f7, ctx: _0x466be0 } = createTestContext({
        targetId: _0x5c6986,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: { [_0x57b6d6]: { id: _0x57b6d6, type: 'source-text', content: '前置的文本入参' } },
        incomingEdges: [
          { id: 'edge-video-text-prepend', sourceId: _0x57b6d6, targetId: _0x5c6986, refSlot: '' },
        ],
        prompt: '主体出场',
      }),
      _0x2d766f = await _0x3cf3f7._buildPayloadImpl.call(_0x466be0);
    assert.equal(_0x2d766f.prompt, '前置的文本入参\n主体出场');
  }),
  test('task orchestration: ai-text input without output uses prompt as text content', async () => {
    const _0x58f143 = 'node-video-ai-text-prompt',
      _0x51d3e1 = 'node-video-ai-text-prompt-ref',
      { proto: _0x1b2785, ctx: _0x531b09 } = createTestContext({
        targetId: _0x58f143,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: { [_0x51d3e1]: { id: _0x51d3e1, type: 'ai-text', prompt: '来自生成文本节点的提示词' } },
        incomingEdges: [
          { id: 'edge-video-ai-text-prompt', sourceId: _0x51d3e1, targetId: _0x58f143, refSlot: '' },
        ],
        prompt: '主体出场',
      }),
      _0x5e9aa2 = await _0x1b2785._buildPayloadImpl.call(_0x531b09);
    assert.equal(_0x5e9aa2.prompt, '来自生成文本节点的提示词\n主体出场');
  }),
  test('task orchestration: text inputs do not change existing media inputUrls', async () => {
    const _0x5789e8 = 'node-video-text-media',
      _0x384cd0 = 'node-video-text-ref-media',
      _0xd4c633 = 'node-video-image-ref-media',
      { proto: _0xa8e7be, ctx: _0x3f86e3 } = createTestContext({
        targetId: _0x5789e8,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x384cd0]: { id: _0x384cd0, type: 'source-text', text: '补充画面描述' },
          [_0xd4c633]: {
            id: _0xd4c633,
            type: 'source-image',
            originalLocalPath: 'data/uploads/video-ref-image.png',
            imageUrl: 'https://img.example.com/video-ref-image.png',
          },
        },
        incomingEdges: [
          { id: 'edge-video-text-media-text', sourceId: _0x384cd0, targetId: _0x5789e8, refSlot: '' },
          { id: 'edge-video-text-media-image', sourceId: _0xd4c633, targetId: _0x5789e8, refSlot: '' },
        ],
        prompt: '主体 @文本1',
      }),
      _0x5473b0 = await _0xa8e7be._buildPayloadImpl.call(_0x3f86e3);
    (assert.equal(_0x5473b0.prompt, '主体 补充画面描述'),
      assert.deepEqual(_0x5473b0.inputUrls, ['/data/uploads/video-ref-image.png']));
  }),
  test('task orchestration: video inputUrls prefer original image path', async () => {
    const _0x56bbe8 = 'node-video-original-input',
      _0x471c9c = 'node-image-original-input',
      { proto: _0x11026d, ctx: _0x4ac000 } = createTestContext({
        targetId: _0x56bbe8,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x471c9c]: {
            id: _0x471c9c,
            type: 'source-image',
            originalLocalPath: 'data/uploads/video-original.png',
            displayLocalPath: 'data/uploads/video-display.webp',
            thumbLocalPath: 'data/uploads/video-thumb.webp',
            imageUrl: 'https://img.example.com/video-display.png',
            thumbUrl: 'https://img.example.com/video-thumb.png',
          },
        },
        incomingEdges: [
          { id: 'edge-video-original-input', sourceId: _0x471c9c, targetId: _0x56bbe8, refSlot: '' },
        ],
      }),
      _0x510b25 = await _0x11026d._buildPayloadImpl.call(_0x4ac000);
    assert.deepEqual(_0x510b25.inputUrls, ['/data/uploads/video-original.png']);
  }),
  test('task orchestration: video media inputUrls follow incoming edge order', async () => {
    const _0x4d533c = 'node-video-ordered-inputs',
      _0x32f7da = 'node-video-ordered-image-a',
      _0x14945f = 'node-video-ordered-image-b',
      { proto: _0x7a0118, ctx: _0x4367ff } = createTestContext({
        targetId: _0x4d533c,
        nodeData: {
          provider: 'grsai',
          model: 'nano-video-1',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x32f7da]: {
            id: _0x32f7da,
            type: 'source-image',
            originalLocalPath: 'data/uploads/ordered-a.png',
            imageUrl: 'https://img.example.com/a.png',
          },
          [_0x14945f]: {
            id: _0x14945f,
            type: 'source-image',
            originalLocalPath: 'data/uploads/ordered-b.png',
            imageUrl: 'https://img.example.com/b.png',
          },
        },
        incomingEdges: [
          { id: 'edge-video-ordered-b', sourceId: _0x14945f, targetId: _0x4d533c, refSlot: '' },
          { id: 'edge-video-ordered-a', sourceId: _0x32f7da, targetId: _0x4d533c, refSlot: '' },
        ],
      }),
      _0x571057 = await _0x7a0118._buildPayloadImpl.call(_0x4367ff);
    assert.deepEqual(_0x571057.inputUrls, ['/data/uploads/ordered-b.png', '/data/uploads/ordered-a.png']);
  }),
  test('task orchestration: asset image mentions send type placeholders in prompt order', async () => {
    const _0x2761fd = 'node-video-asset-image-mentions';
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
    const { proto: _0x4fcac2, ctx: _0x4ec1ee } = createTestContext({
        targetId: _0x2761fd,
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
      _0x57c262 = await _0x4fcac2._buildPayloadImpl.call(_0x4ec1ee);
    (assert.equal(_0x57c262.prompt, 'use @图片1 then @图片2'),
      assert.deepEqual(_0x57c262.inputUrls, ['/data/assets/person2.png', '/data/assets/person1.png']));
  }),
  test('task orchestration: asset video and audio mentions satisfy lip-sync fixed inputs', async () => {
    const _0x31db19 = 'node-video-asset-lipsync';
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
    const { proto: _0x2a6929, ctx: _0x471f94 } = createTestContext({
      targetId: _0x31db19,
      nodeData: {
        provider: 'runninghubwf',
        model: 'runninghub/2054101324521844738',
        rhVideoFrames: 120,
        rhVideoResolution: 0x340,
        generationParams: { rhInstanceType: 'default' },
      },
      promptEl: createPromptEl([
        createAssetPromptPillNode('clip', 'asset-av', 0, 'video'),
        createPromptTextNode(' lip sync '),
        createAssetPromptPillNode('voice', 'asset-av', 1, 'audio'),
      ]),
    });
    _0x471f94._isRunninghubWorkflowModel = () => true;
    const _0x14d322 = await _0x2a6929._buildPayloadImpl.call(_0x471f94);
    (assert.equal(_0x14d322.prompt, '@视频1 lip sync @音频1'),
      assert.equal(_0x14d322.videoUrl, '/data/assets/clip.mp4'),
      assert.equal(_0x14d322.audioUrl, '/data/assets/voice.mp3'),
      assert.deepEqual(_0x14d322.inputUrls, []));
  }),
  test('task orchestration: hidden asset video and audio refs satisfy lip-sync fixed inputs', async () => {
    const _0x52e914 = 'node-video-hidden-asset-lipsync';
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
    const { proto: _0x132ecf, ctx: _0x16d0b3 } = createTestContext({
      targetId: _0x52e914,
      nodeData: {
        provider: 'runninghubwf',
        model: 'runninghub/2054101324521844738',
        rhVideoFrames: 120,
        rhVideoResolution: 0x340,
        generationParams: { rhInstanceType: 'default' },
        promptAssetInputRefs: [
          { assetId: 'asset-av-hidden', itemIndex: 0, type: 'video' },
          { assetId: 'asset-av-hidden', itemIndex: 1, type: 'audio' },
        ],
      },
      prompt: 'lip sync',
    });
    _0x16d0b3._isRunninghubWorkflowModel = () => true;
    const _0x383df8 = await _0x132ecf._buildPayloadImpl.call(_0x16d0b3);
    (assert.equal(_0x383df8.prompt, 'lip sync'),
      assert.equal(_0x383df8.videoUrl, '/data/assets/hidden-clip.mp4'),
      assert.equal(_0x383df8.audioUrl, '/data/assets/hidden-voice.mp3'),
      assert.deepEqual(_0x383df8.inputUrls, []));
  }),
  test('task orchestration: dreamina frames use incoming edge order for first and last images', async () => {
    const _0x4aa92e = 'node-video-dreamina-ordered-frames',
      _0xb9a810 = 'node-video-dreamina-frame-a',
      _0x67312b = 'node-video-dreamina-frame-b',
      { proto: _0x1ce4a2, ctx: _0x37653c } = createTestContext({
        targetId: _0x4aa92e,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0xb9a810]: {
            id: _0xb9a810,
            type: 'source-image',
            originalLocalPath: 'data/uploads/dreamina-frame-first.png',
            imageUrl: 'https://img.example.com/first.png',
          },
          [_0x67312b]: {
            id: _0x67312b,
            type: 'source-image',
            originalLocalPath: 'data/uploads/dreamina-frame-last.png',
            imageUrl: 'https://img.example.com/last.png',
          },
        },
        incomingEdges: [
          { id: 'edge-video-dreamina-last-first', sourceId: _0x67312b, targetId: _0x4aa92e, refSlot: '' },
          { id: 'edge-video-dreamina-first-last', sourceId: _0xb9a810, targetId: _0x4aa92e, refSlot: '' },
        ],
        prompt: 'make it move',
      }),
      _0x5f0493 = await _0x1ce4a2._buildPayloadImpl.call(_0x37653c);
    (assert.equal(_0x5f0493.dreaminaTaskType, 'frames2video'),
      assert.equal(_0x5f0493.first, '/data/uploads/dreamina-frame-last.png'),
      assert.equal(_0x5f0493.last, '/data/uploads/dreamina-frame-first.png'),
      assert.deepEqual(_0x5f0493.inputUrls, [
        '/data/uploads/dreamina-frame-last.png',
        '/data/uploads/dreamina-frame-first.png',
      ]));
  }),
  test('task orchestration: runninghub fixed slots are resolved by refSlot', async () => {
    const _0x36f7d7 = 'node-video-rh-fixed-slots',
      _0x17e4ef = 'node-video-rh-source-video',
      _0x17b05d = 'node-video-rh-mask-video',
      _0x2be344 = 'node-video-rh-ref-image',
      _0x4421d7 = 'node-video-rh-first-frame',
      { proto: _0x574c4c, ctx: _0x28f6dd } = createTestContext({
        targetId: _0x36f7d7,
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
          [_0x17e4ef]: { id: _0x17e4ef, type: 'source-video', localPath: 'data/uploads/source.mp4' },
          [_0x17b05d]: { id: _0x17b05d, type: 'source-video', localPath: 'data/uploads/mask.mp4' },
          [_0x2be344]: {
            id: _0x2be344,
            type: 'source-image',
            originalLocalPath: 'data/uploads/ref.png',
            imageUrl: 'https://img.example.com/ref.png',
          },
          [_0x4421d7]: {
            id: _0x4421d7,
            type: 'source-image',
            originalLocalPath: 'data/uploads/first-frame.png',
            imageUrl: 'https://img.example.com/first-frame.png',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-rh-first-frame',
            sourceId: _0x4421d7,
            targetId: _0x36f7d7,
            refSlot: 'firstFrame',
          },
          { id: 'edge-video-rh-mask', sourceId: _0x17b05d, targetId: _0x36f7d7, refSlot: 'videoMask' },
          { id: 'edge-video-rh-ref-image', sourceId: _0x2be344, targetId: _0x36f7d7, refSlot: 'refImage' },
          { id: 'edge-video-rh-source', sourceId: _0x17e4ef, targetId: _0x36f7d7, refSlot: 'sourceVideo' },
        ],
        prompt: 'edit video',
      }),
      _0x17c796 = await _0x574c4c._buildPayloadImpl.call(_0x28f6dd);
    (assert.equal(_0x17c796.videoUrl, '/data/uploads/source.mp4'),
      assert.deepEqual(_0x17c796.inputUrls, ['/data/uploads/ref.png']),
      assert.equal(_0x17c796.firstFrameUrl, '/data/uploads/first-frame.png'),
      assert.equal(_0x17c796.maskVideoUrl, '/data/uploads/mask.mp4'),
      assert.equal(_0x17c796.rhVideoFps, 30),
      assert.equal(_0x17c796.frameRate, 30),
      assert.equal(_0x17c796.frameCount, 88));
  }),
  test('task orchestration: 视频去字幕V2 uses one source video and schema params', async () => {
    const _0x1f72bf = 'node-video-rh-watermark-v2',
      _0x5e5c50 = 'node-video-rh-watermark-source',
      _0x2716d6 = 'node-video-rh-watermark-mask',
      { proto: _0x5049fd, ctx: _0x381b1c } = createTestContext({
        targetId: _0x1f72bf,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2060613773890768898',
          generationParams: {
            rhWatermarkRemoveMode: 'mode2',
            rhRemoveWatermark: true,
            rhVideoFps: 30,
            rhVideoFrames: 12,
            rhVideoResolution: 0x3c0,
            rhInstanceType: 'default',
          },
        },
        nodes: {
          [_0x5e5c50]: {
            id: _0x5e5c50,
            type: 'source-video',
            localPath: 'data/uploads/source-watermark.mp4',
          },
          [_0x2716d6]: {
            id: _0x2716d6,
            type: 'source-image',
            originalLocalPath: 'data/uploads/mask-source.png',
            imageUrl: 'https://img.example.com/mask-source.png',
            mask: 'data/uploads/manual-mask.png',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-rh-watermark-source',
            sourceId: _0x5e5c50,
            targetId: _0x1f72bf,
            refSlot: 'sourceVideo',
          },
          {
            id: 'edge-video-rh-watermark-mask',
            sourceId: _0x2716d6,
            targetId: _0x1f72bf,
            refSlot: 'maskImage',
          },
        ],
      }),
      _0x5eb013 = await _0x5049fd._buildPayloadImpl.call(_0x381b1c);
    (assert.equal(_0x5eb013.videoUrl, '/data/uploads/source-watermark.mp4'),
      assert.equal(_0x5eb013.maskImageDataUrl, '/data/uploads/manual-mask.png'),
      assert.equal(_0x5eb013.rhVideoFps, 30),
      assert.equal(_0x5eb013.rhVideoFrames, 12),
      assert.equal(_0x5eb013.rhVideoResolution, 0x3c0),
      assert.equal(_0x5eb013.generationParams.rhWatermarkRemoveMode, 'mode2'),
      assert.equal(_0x5eb013.generationParams.rhRemoveWatermark, true));
  }),
  test('task orchestration: 视频去字幕V2 ignores stale mask edge in mode1', async () => {
    const _0x308327 = 'node-video-rh-watermark-v2-mode1',
      _0x493d94 = 'node-video-rh-watermark-mode1-source',
      _0x4b87b5 = 'node-video-rh-watermark-mode1-mask',
      { proto: _0x2d5294, ctx: _0x6345b1 } = createTestContext({
        targetId: _0x308327,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2060613773890768898',
          generationParams: {
            rhWatermarkRemoveMode: 'mode1',
            rhRemoveWatermark: false,
            rhVideoFps: 24,
            rhVideoFrames: 0,
            rhVideoResolution: 0x3c0,
            rhInstanceType: 'default',
          },
        },
        nodes: {
          [_0x493d94]: {
            id: _0x493d94,
            type: 'source-video',
            localPath: 'data/uploads/source-watermark-mode1.mp4',
          },
          [_0x4b87b5]: {
            id: _0x4b87b5,
            type: 'source-image',
            originalLocalPath: 'data/uploads/mask-mode1-source.png',
            imageUrl: 'https://img.example.com/mask-mode1-source.png',
            mask: 'data/uploads/manual-mask-mode1.png',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-rh-watermark-mode1-source',
            sourceId: _0x493d94,
            targetId: _0x308327,
            refSlot: 'sourceVideo',
          },
          {
            id: 'edge-video-rh-watermark-mode1-mask',
            sourceId: _0x4b87b5,
            targetId: _0x308327,
            refSlot: 'maskImage',
          },
        ],
      }),
      _0x18fa9b = await _0x2d5294._buildPayloadImpl.call(_0x6345b1);
    (assert.equal(_0x18fa9b.videoUrl, '/data/uploads/source-watermark-mode1.mp4'),
      assert.equal(_0x18fa9b.maskImageDataUrl, undefined),
      assert.equal(_0x18fa9b.generationParams.rhWatermarkRemoveMode, 'mode1'));
  }),
  test('task orchestration: V5.4 asset mentions fill fixed input slots', async () => {
    const _0x3b4040 = 'node-video-rh-asset-fixed-slots';
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
    const { proto: _0x1f815b, ctx: _0x31f8f5 } = createTestContext({
        targetId: _0x3b4040,
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
      _0x5c7659 = await _0x1f815b._buildPayloadImpl.call(_0x31f8f5);
    (assert.equal(_0x5c7659.videoUrl, '/data/assets/source.mp4'),
      assert.equal(_0x5c7659.maskVideoUrl, '/data/assets/mask.mp4'),
      assert.deepEqual(_0x5c7659.inputUrls, ['/data/assets/ref.png']),
      assert.equal(_0x5c7659.firstFrameUrl, '/data/assets/first-frame.png'));
  }),
  test('task orchestration: V5.4 subtract hides mask video and first frame asset mentions', async () => {
    const _0xf99663 = 'node-video-rh-asset-hidden-fixed-slots';
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
    const { proto: _0x5754d6, ctx: _0x213a5d } = createTestContext({
        targetId: _0xf99663,
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
      _0x5994c6 = await _0x5754d6._buildPayloadImpl.call(_0x213a5d);
    (assert.equal(_0x5994c6.videoUrl, '/data/assets/source.mp4'),
      assert.equal(_0x5994c6.maskVideoUrl, undefined),
      assert.deepEqual(_0x5994c6.inputUrls, ['/data/assets/ref.png']),
      assert.equal(_0x5994c6.firstFrameUrl, undefined),
      assert.equal(_0x5994c6.subtractSubject, true));
  }),
  test('task orchestration: V5.4 connected inputs take priority and assets fill empty slots', async () => {
    const _0x2f42ce = 'node-video-rh-asset-empty-slot-fill',
      _0x40a893 = 'node-video-rh-connected-source';
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
    const { proto: _0x2b1f0d, ctx: _0x56e2d0 } = createTestContext({
        targetId: _0x2f42ce,
        nodeData: {
          provider: 'runninghubwf',
          model: 'runninghub/2041741496667348994',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
          rhSubtractSubject: false,
          generationParams: { rhInstanceType: 'default' },
        },
        nodes: { [_0x40a893]: { id: _0x40a893, type: 'source-video', localPath: 'data/uploads/source.mp4' } },
        incomingEdges: [
          {
            id: 'edge-video-rh-connected-source',
            sourceId: _0x40a893,
            targetId: _0x2f42ce,
            refSlot: 'sourceVideo',
          },
        ],
        promptEl: createPromptEl([
          createAssetPromptPillNode('mask clip', 'asset-v54-fill', 0, 'video'),
          createAssetPromptPillNode('reference image', 'asset-v54-fill', 1, 'image'),
        ]),
      }),
      _0x5e7df2 = await _0x2b1f0d._buildPayloadImpl.call(_0x56e2d0);
    (assert.equal(_0x5e7df2.videoUrl, '/data/uploads/source.mp4'),
      assert.equal(_0x5e7df2.maskVideoUrl, '/data/assets/mask.mp4'),
      assert.deepEqual(_0x5e7df2.inputUrls, ['/data/assets/ref.png']));
  }),
  test('task orchestration: V5.4 connected video inputs accept display local paths', async () => {
    const _0x3895a2 = 'node-video-rh-display-local-path',
      _0x20c959 = 'node-video-rh-display-source',
      _0xeb517a = 'node-video-rh-display-mask',
      { proto: _0x5164bd, ctx: _0x366149 } = createTestContext({
        targetId: _0x3895a2,
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
          [_0x20c959]: {
            id: _0x20c959,
            type: 'source-video',
            displayLocalPath: 'data/uploads/source-display.mp4',
          },
          [_0xeb517a]: {
            id: _0xeb517a,
            type: 'source-video',
            displayLocalPath: 'data/uploads/mask-display.mp4',
          },
        },
        incomingEdges: [
          {
            id: 'edge-video-rh-display-source',
            sourceId: _0x20c959,
            targetId: _0x3895a2,
            refSlot: 'sourceVideo',
          },
          {
            id: 'edge-video-rh-display-mask',
            sourceId: _0xeb517a,
            targetId: _0x3895a2,
            refSlot: 'videoMask',
          },
        ],
      }),
      _0x2d56df = await _0x5164bd._buildPayloadImpl.call(_0x366149);
    (assert.equal(_0x2d56df.videoUrl, '/data/uploads/source-display.mp4'),
      assert.equal(_0x2d56df.maskVideoUrl, '/data/uploads/mask-display.mp4'));
  }),
  test('task orchestration: dreamina video images prefer original image path', async () => {
    const _0x20d669 = 'node-video-dreamina-original-input',
      _0x2a503c = 'node-image-dreamina-original-input',
      { proto: _0x1bc37b, ctx: _0x4b5361 } = createTestContext({
        targetId: _0x20d669,
        nodeData: {
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 0x640,
          height: 0x384,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x2a503c]: {
            id: _0x2a503c,
            type: 'source-image',
            originalLocalPath: 'data/uploads/dreamina-video-original.png',
            displayLocalPath: 'data/uploads/dreamina-video-display.webp',
            thumbLocalPath: 'data/uploads/dreamina-video-thumb.webp',
            imageUrl: 'https://img.example.com/dreamina-video-display.png',
            thumbUrl: 'https://img.example.com/dreamina-video-thumb.png',
          },
        },
        incomingEdges: [
          { id: 'edge-dreamina-video-original-input', sourceId: _0x2a503c, targetId: _0x20d669, refSlot: '' },
        ],
      }),
      _0x3241b8 = await _0x1bc37b._buildPayloadImpl.call(_0x4b5361);
    (assert.deepEqual(_0x3241b8.images, ['/data/uploads/dreamina-video-original.png']),
      assert.deepEqual(_0x3241b8.inputUrls, ['/data/uploads/dreamina-video-original.png']));
  }),
  test('task orchestration: apimart 即梦视频复用首尾帧 payload 且保留 APIMart provider', async () => {
    const _0x12aeb6 = 'node-video-apimart-seedance-frames',
      _0x11101a = 'node-image-apimart-first',
      _0x5d3238 = 'node-image-apimart-last',
      { proto: _0x4ac2fa, ctx: _0x418382 } = createTestContext({
        targetId: _0x12aeb6,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-2.0-fast',
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x11101a]: {
            id: _0x11101a,
            type: 'source-image',
            originalLocalPath: 'data/uploads/apimart-first.png',
            imageUrl: 'https://img.example.com/apimart-first.png',
          },
          [_0x5d3238]: {
            id: _0x5d3238,
            type: 'source-image',
            originalLocalPath: 'data/uploads/apimart-last.png',
            imageUrl: 'https://img.example.com/apimart-last.png',
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-first', sourceId: _0x11101a, targetId: _0x12aeb6, refSlot: '' },
          { id: 'edge-apimart-last', sourceId: _0x5d3238, targetId: _0x12aeb6, refSlot: '' },
        ],
        prompt: 'make a smooth transition',
      }),
      _0x43c1b4 = await _0x4ac2fa._buildPayloadImpl.call(_0x418382);
    (assert.equal(_0x43c1b4.provider, 'apimart'),
      assert.equal(_0x43c1b4.model, 'apimart/doubao-seedance-2.0-fast'),
      assert.equal(_0x43c1b4.dreaminaTaskType, 'frames2video'),
      assert.equal(_0x43c1b4.first, '/data/uploads/apimart-first.png'),
      assert.equal(_0x43c1b4.last, '/data/uploads/apimart-last.png'),
      assert.equal(_0x43c1b4.aspectRatio, '16:9'),
      assert.equal(_0x43c1b4.resolution, '720p'),
      assert.equal('modelVersion' in _0x43c1b4, false),
      assert.deepEqual(_0x43c1b4.images, [
        '/data/uploads/apimart-first.png',
        '/data/uploads/apimart-last.png',
      ]));
  }),
  test('task orchestration: APIMart 人脸检测结果作为 providerAssetRefs 进入 payload', async () => {
    const _0x20024 = 'node-video-apimart-private-avatar-payload',
      _0x5a1e63 = 'node-image-apimart-private-first',
      _0x4bbf00 = 'node-image-apimart-private-last',
      { proto: _0x27f62c, ctx: _0x108259 } = createTestContext({
        targetId: _0x20024,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-2.0-fast',
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x5a1e63]: {
            id: _0x5a1e63,
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
          [_0x4bbf00]: {
            id: _0x4bbf00,
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
          { id: 'edge-private-first', sourceId: _0x5a1e63, targetId: _0x20024 },
          { id: 'edge-private-last', sourceId: _0x4bbf00, targetId: _0x20024 },
        ],
        prompt: 'make a smooth transition',
      }),
      _0x461453 = await _0x27f62c._buildPayloadImpl.call(_0x108259);
    (assert.deepEqual(_0x461453.images, [
      '/data/uploads/private-first.png',
      '/data/uploads/private-last.png',
    ]),
      assert.deepEqual(
        _0x461453.providerAssetRefs.map((_0x52e1ab) => ({
          capability: _0x52e1ab.capability,
          sourceUrl: _0x52e1ab.sourceUrl,
          assetUrl: _0x52e1ab.assetUrl,
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
    const _0x169d26 = 'node-video-apimart-seedance-15-adaptive',
      _0x15c785 = 'node-image-apimart-portrait',
      { proto: _0x2e1214, ctx: _0x422e69 } = createTestContext({
        targetId: _0x169d26,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-1-5-pro',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 0x640,
          height: 0x384,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x15c785]: {
            id: _0x15c785,
            type: 'source-image',
            originalLocalPath: 'data/uploads/portrait.png',
            originalWidth: 0x2d0,
            originalHeight: 0x500,
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-portrait', sourceId: _0x15c785, targetId: _0x169d26, refSlot: '' },
        ],
        prompt: 'make it move',
      }),
      _0x4d94d9 = await _0x2e1214._buildPayloadImpl.call(_0x422e69);
    (assert.equal(_0x4d94d9.provider, 'apimart'),
      assert.equal(_0x4d94d9.model, 'apimart/doubao-seedance-1-5-pro'),
      assert.equal(_0x4d94d9.aspectRatio, '9:16'),
      assert.deepEqual(_0x4d94d9.images, ['/data/uploads/portrait.png']));
  }),
  test('task orchestration: apimart Seedance 1.0 自适应竖图会提交明确竖屏比例', async () => {
    const _0x2e886a = 'node-video-apimart-seedance-10-adaptive',
      _0x25de27 = 'node-image-apimart-portrait-10',
      { proto: _0x352463, ctx: _0x1a44d0 } = createTestContext({
        targetId: _0x2e886a,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-1-0-pro-quality',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 0x640,
          height: 0x384,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x25de27]: {
            id: _0x25de27,
            type: 'source-image',
            originalLocalPath: 'data/uploads/portrait-10.png',
            originalWidth: 0x2d0,
            originalHeight: 0x500,
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-portrait-10', sourceId: _0x25de27, targetId: _0x2e886a, refSlot: '' },
        ],
        prompt: 'make it move',
      }),
      _0x5396f3 = await _0x352463._buildPayloadImpl.call(_0x1a44d0);
    (assert.equal(_0x5396f3.provider, 'apimart'),
      assert.equal(_0x5396f3.model, 'apimart/doubao-seedance-1-0-pro-quality'),
      assert.equal(_0x5396f3.aspectRatio, '9:16'),
      assert.deepEqual(_0x5396f3.images, ['/data/uploads/portrait-10.png']));
  }),
  test('task orchestration: apimart Seedance 2.0 有入参时自适应按入参比例兜底', async () => {
    const _0x43a915 = 'node-video-apimart-seedance-20-adaptive',
      _0x24869c = 'node-image-apimart-portrait-20',
      { proto: _0x586453, ctx: _0x18d9a9 } = createTestContext({
        targetId: _0x43a915,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-2.0-fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 0x640,
          height: 0x384,
          resolution: '720p',
          duration: 5,
        },
        nodes: {
          [_0x24869c]: {
            id: _0x24869c,
            type: 'source-image',
            originalLocalPath: 'data/uploads/portrait-20.png',
            originalWidth: 0x2d0,
            originalHeight: 0x500,
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-portrait-20', sourceId: _0x24869c, targetId: _0x43a915, refSlot: '' },
        ],
        prompt: 'make it move',
      }),
      _0x1f41c1 = await _0x586453._buildPayloadImpl.call(_0x18d9a9);
    (assert.equal(_0x1f41c1.provider, 'apimart'),
      assert.equal(_0x1f41c1.model, 'apimart/doubao-seedance-2.0-fast'),
      assert.equal(_0x1f41c1.aspectRatio, '9:16'));
  }),
  test('task orchestration: apimart Seedance 2.0 无入参时按显示比例解析自适应', async () => {
    const _0x1d5909 = 'node-video-apimart-seedance-20-text-adaptive',
      { proto: _0x140709, ctx: _0x2c5fd6 } = createTestContext({
        targetId: _0x1d5909,
        nodeData: {
          provider: 'apimart',
          model: 'apimart/doubao-seedance-2.0-fast',
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '自适应',
          width: 0x640,
          height: 0x384,
          resolution: '720p',
          duration: 5,
        },
        prompt: 'text only video',
      }),
      _0x11491d = await _0x140709._buildPayloadImpl.call(_0x2c5fd6);
    (assert.equal(_0x11491d.provider, 'apimart'),
      assert.equal(_0x11491d.model, 'apimart/doubao-seedance-2.0-fast'),
      assert.equal(_0x11491d.dreaminaTaskType, 'text2video'),
      assert.equal(_0x11491d.aspectRatio, '16:9'));
  }),
  test('task orchestration: dreamina VIP 缺少 installId 时阻断提交', async () => {
    const _0xf35614 = globalThis.window.showToast,
      _0x3b0140 = [];
    globalThis.window.showToast = (_0x53dc23) => {
      _0x3b0140.push(String(_0x53dc23 || ''));
    };
    const _0x18c08e = createVideoNodeTaskOrchestrationModule({
        store: { getStateRaw: () => ({ nodes: {} }), getState: () => ({ nodes: {} }), updateNodeData: () => {} },
        api: {},
        getImage: async () => null,
        startLoading: () => {},
        stopLoading: () => {},
        ensureConfig: async () => {},
        getProviderConfig: () => ({ apiKey: '' }),
        isVideoVipModel: (_0x5ca713, _0x4e5d9b) =>
          String(_0x4e5d9b || '').toLowerCase() === 'dreamina' &&
          String(_0x5ca713 || '').startsWith('dreamina/'),
        ensureVipSessionRecheck: async () => {},
      }),
      _0x3daa4c = Object.assign(Object.create(_0x18c08e), {
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
      (await _0x18c08e._onGenerateImpl.call(_0x3daa4c),
        assert.equal(_0x3b0140.includes('缺少 installId，无法校验订阅，请刷新后重试'), true));
    } finally {
      globalThis.window.showToast = _0xf35614;
    }
  }),
  test('task orchestration: dreamina VIP 有 installId 时会继续执行后续逻辑', async () => {
    const _0x47558b = createVideoNodeTaskOrchestrationModule({
        store: { getStateRaw: () => ({ nodes: {} }), getState: () => ({ nodes: {} }), updateNodeData: () => {} },
        api: {},
        getImage: async () => null,
        startLoading: () => {},
        stopLoading: () => {},
        ensureConfig: async () => {},
        getProviderConfig: () => ({ apiKey: '' }),
        isVideoVipModel: (_0x147bed, _0x79850a) =>
          String(_0x79850a || '').toLowerCase() === 'dreamina' &&
          String(_0x147bed || '').startsWith('dreamina/'),
        ensureVipSessionRecheck: async () => {},
      }),
      _0x54cd92 = Object.assign(Object.create(_0x47558b), {
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
    await assert.rejects(_0x47558b._onGenerateImpl.call(_0x54cd92), /FLOW_CONTINUED/);
  }),
  test('task orchestration: dreamina video submit failure is logged without masking original error', async () => {
    const _0x1b9ccd = 'node-video-dreamina-submit-fail',
      {
        proto: _0x372041,
        ctx: _0x14f293,
        state: _0x574615,
      } = createTestContext({
        targetId: _0x1b9ccd,
        nodeData: { id: _0x1b9ccd, provider: 'dreamina', model: 'dreamina/seedance2.0fast' },
        apiImpl: {
          generateVideo: async () => {
            throw new Error('即梦视频任务提交失败：未返回 submitId');
          },
        },
      });
    ((_0x14f293._isGenerating = false),
      (_0x14f293.btnEl = createButtonStub()),
      (_0x14f293.previewEl = {}),
      (_0x14f293._guardVipSelection = () => true),
      (_0x14f293._buildPayload = async () => ({
        provider: 'dreamina',
        model: 'dreamina/seedance2.0fast',
        prompt: 'test prompt',
      })),
      (_0x14f293._stopDreaminaRecovery = () => {}),
      (_0x14f293._stopRunningHubRecovery = () => {}),
      (_0x14f293._stopAsyncRecovery = () => {}),
      (_0x14f293._persistDreaminaResumeCache = () => {}),
      (_0x14f293._updateSubmitButtonState = () => {}),
      await _0x372041._onGenerateImpl.call(_0x14f293));
    const _0x5edf1b = _0x574615.nodes[_0x1b9ccd];
    (assert.equal(_0x5edf1b.isGenerating, false),
      assert.equal(_0x5edf1b.jobStatus, 'error'),
      assert.equal(_0x5edf1b.jobError, '即梦视频任务提交失败：未返回 submitId'),
      assert.equal(_0x5edf1b.videos?.[0]?.error, '即梦视频任务提交失败：未返回 submitId'),
      assert.equal(_0x5edf1b.dreaminaTaskStatus, 'failed'),
      assert.equal(_0x5edf1b.dreaminaTaskPhase, 'failed'),
      assert.equal(_0x5edf1b.dreaminaTaskLabel, '即梦视频任务提交失败：未返回 submitId'));
  }),
  test('task orchestration: dreamina video recovery writes terminal state through runtime', async () => {
    const _0x896172 = 'node-video-dreamina-recovery-success',
      _0x24c7ee = Date.now() - 0xea60;
    let _0x408b34 = 0,
      _0x1e8d98 = 0;
    const {
      proto: _0x264239,
      ctx: _0x49dd8c,
      state: _0x498f99,
    } = createTestContext({
      targetId: _0x896172,
      nodeData: {
        id: _0x896172,
        provider: 'dreamina',
        model: 'dreamina/seedance2.0fast',
        dreaminaSubmitId: 'sid-video-success',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: _0x24c7ee,
        dreaminaTaskLastCheckedAt: Date.now() - 0x7530,
        dreaminaTaskRecovering: false,
        generationStartTime: _0x24c7ee,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeDreaminaVideoTask: async (_0x740d04, _0x10ce9a) => {
          return (
            (_0x408b34 += 1),
            assert.equal(_0x740d04, 'sid-video-success'),
            assert.equal(_0x10ce9a?.maxWaitMs > 0, true),
            {
              isBatch: false,
              dreaminaSnapshot: {
                submitId: _0x740d04,
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
    ((_0x49dd8c._isGenerating = false),
      (_0x49dd8c.btnEl = createButtonStub()),
      (_0x49dd8c.previewEl = {}),
      (_0x49dd8c._updateSubmitButtonState = () => {}),
      (_0x49dd8c._persistDreaminaResumeCache = () => {}),
      (_0x49dd8c._finalizeVideoSuccessSideEffects = () => {
        _0x1e8d98 += 1;
      }),
      await _0x264239._maybeResumeDreaminaTaskImpl.call(_0x49dd8c));
    _0x49dd8c._dreaminaResumePromise && (await _0x49dd8c._dreaminaResumePromise);
    const _0x162e25 = _0x498f99.nodes[_0x896172];
    (assert.equal(_0x408b34, 1),
      assert.equal(_0x1e8d98, 1),
      assert.equal(_0x162e25.isGenerating, false),
      assert.equal(_0x162e25.jobStatus, 'success'),
      assert.equal(_0x162e25.dreaminaTaskStatus, 'success'),
      assert.equal(_0x162e25.dreaminaTaskPhase, 'done'),
      assert.equal(_0x162e25.dreaminaTaskRecovering, false),
      assert.equal(_0x162e25.videoUrl, '/output/dreamina/video-success.mp4'),
      assert.equal(_0x162e25.localPath, 'output/dreamina/video-success.mp4'),
      assert.equal(_0x49dd8c._isGenerating, false));
  }),
  test('task orchestration: dreamina video recovery returns failed reason and clears loading state', async () => {
    const _0xdc22e5 = 'node-video-dreamina-recovery-failed',
      _0x3fa483 = Date.now() - 0xea60,
      {
        proto: _0x113126,
        ctx: _0x5c26ba,
        state: _0x1dd234,
      } = createTestContext({
        targetId: _0xdc22e5,
        nodeData: {
          id: _0xdc22e5,
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaSubmitId: 'sid-video-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLabel: '生成中',
          dreaminaTaskStartedAt: _0x3fa483,
          dreaminaTaskLastCheckedAt: Date.now() - 0x7530,
          dreaminaTaskRecovering: false,
          generationStartTime: _0x3fa483,
          generationDuration: null,
          isGenerating: true,
        },
        apiImpl: {
          resumeDreaminaVideoTask: async (_0x180210) => {
            assert.equal(_0x180210, 'sid-video-fail');
            const _0x318b0e = new Error('generation failed: final generation failed');
            _0x318b0e.dreaminaSnapshot = {
              submitId: _0x180210,
              status: 'failed',
              phase: 'failed',
              label: 'generation failed: final generation failed',
              failReason: 'generation failed: final generation failed',
              outputs: [],
              raw: {},
              lastCheckedAt: Date.now(),
            };
            throw _0x318b0e;
          },
        },
      });
    ((_0x5c26ba._isGenerating = true),
      (_0x5c26ba.btnEl = createButtonStub()),
      (_0x5c26ba.previewEl = {}),
      (_0x5c26ba._updateSubmitButtonState = () => {}),
      (_0x5c26ba._persistDreaminaResumeCache = () => {}),
      await _0x113126._maybeResumeDreaminaTaskImpl.call(_0x5c26ba));
    _0x5c26ba._dreaminaResumePromise && (await _0x5c26ba._dreaminaResumePromise);
    const _0x3f710d = _0x1dd234.nodes[_0xdc22e5];
    (assert.equal(_0x3f710d.isGenerating, false),
      assert.equal(_0x3f710d.jobStatus, 'error'),
      assert.equal(_0x3f710d.jobError, 'generation failed: final generation failed'),
      assert.equal(_0x3f710d.videos?.[0]?.error, 'generation failed: final generation failed'),
      assert.equal(_0x3f710d.dreaminaTaskStatus, 'failed'),
      assert.equal(_0x3f710d.dreaminaTaskPhase, 'failed'),
      assert.equal(_0x3f710d.dreaminaTaskLabel, 'generation failed: final generation failed'),
      assert.equal(_0x3f710d.dreaminaTaskRecovering, false));
  }),
  test('task orchestration: RunningHub video recovery writes terminal state through runtime', async () => {
    const _0x3ae1d2 = 'node-video-rh-recovery-success',
      _0x32b326 = Date.now() - 0xea60;
    let _0x4d470c = 0,
      _0x3012b8 = 0;
    const {
      proto: _0x5625fa,
      ctx: _0xa2ab78,
      state: _0x16065f,
    } = createTestContext({
      targetId: _0x3ae1d2,
      nodeData: {
        id: _0x3ae1d2,
        provider: 'runninghubwf',
        model: 'runninghub/1971148165531475969',
        rhTaskId: 'rh-video-resume-success',
        rhTaskStatus: 'running',
        rhTaskStartedAt: _0x32b326,
        rhTaskUseOpenapiQuery: true,
        generationStartTime: _0x32b326,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeRunningHubVideoTask: async (_0x4c8f08, _0x18fbf5, _0x1c63d5) => {
          return (
            (_0x4d470c += 1),
            assert.equal(_0x4c8f08, 'rh-video-resume-success'),
            assert.equal(_0x18fbf5.provider, 'runninghubwf'),
            assert.equal(_0x1c63d5?.useOpenapiQuery, true),
            { videos: [{ videoUrl: '/output/resumed.mp4', localPath: '/output/resumed.mp4' }] }
          );
        },
      },
    });
    ((_0xa2ab78._isGenerating = false),
      (_0xa2ab78.btnEl = createButtonStub()),
      (_0xa2ab78.previewEl = {}),
      (_0xa2ab78._isRunninghubWorkflowModel = () => true),
      (_0xa2ab78._buildPayload = async () => ({
        provider: 'runninghubwf',
        model: 'runninghub/1971148165531475969',
        apiKey: 'k_rh',
      })),
      (_0xa2ab78._persistRunningHubResumeCache = () => {}),
      (_0xa2ab78._updateSubmitButtonState = () => {}),
      (_0xa2ab78._finalizeVideoSuccessSideEffects = () => {
        _0x3012b8 += 1;
      }),
      await _0x5625fa._maybeResumeRunningHubTaskImpl.call(_0xa2ab78));
    _0xa2ab78._rhResumePromise && (await _0xa2ab78._rhResumePromise);
    const _0x1774ab = _0x16065f.nodes[_0x3ae1d2];
    (assert.equal(_0x4d470c, 1),
      assert.equal(_0x3012b8, 1),
      assert.equal(_0x1774ab.isGenerating, false),
      assert.equal(_0x1774ab.jobStatus, 'success'),
      assert.equal(_0x1774ab.rhTaskStatus, 'success'),
      assert.equal(_0x1774ab.rhTaskRecovering, false),
      assert.equal(_0x1774ab.videoUrl, '/output/resumed.mp4'),
      assert.equal(_0x1774ab.localPath, '/output/resumed.mp4'),
      assert.equal(_0xa2ab78._isGenerating, false));
  }),
  test('task orchestration: async video recovery writes terminal state through runtime', async () => {
    const _0x10190d = 'node-video-async-recovery-success',
      _0x189bd8 = Date.now() - 0xea60;
    let _0x38326f = 0,
      _0x26affd = 0;
    const {
      proto: _0x14b807,
      ctx: _0x354148,
      state: _0x35f8f4,
    } = createTestContext({
      targetId: _0x10190d,
      nodeData: {
        id: _0x10190d,
        provider: 'grsai',
        model: 'grsai-video-basic',
        asyncTaskProvider: 'grsai',
        asyncTaskKind: 'video',
        asyncTaskId: 'async-video-resume-success',
        asyncTaskStatus: 'running',
        asyncTaskStartedAt: _0x189bd8,
        generationStartTime: _0x189bd8,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeAsyncVideoTask: async (_0x47d230, _0xcab87b, _0x2c4039) => {
          return (
            (_0x38326f += 1),
            assert.equal(_0x47d230, 'async-video-resume-success'),
            assert.equal(_0xcab87b.provider, 'grsai'),
            assert.ok(_0x2c4039?.signal),
            { videos: [{ videoUrl: '/output/async-resumed.mp4', localPath: '/output/async-resumed.mp4' }] }
          );
        },
      },
    });
    ((_0x354148._isGenerating = false),
      (_0x354148.btnEl = createButtonStub()),
      (_0x354148.previewEl = {}),
      (_0x354148._buildPayload = async () => ({ provider: 'grsai', model: 'grsai-video-basic' })),
      (_0x354148._persistAsyncResumeCache = () => {}),
      (_0x354148._updateSubmitButtonState = () => {}),
      (_0x354148._finalizeVideoSuccessSideEffects = () => {
        _0x26affd += 1;
      }),
      await _0x14b807._maybeResumeAsyncTaskImpl.call(_0x354148));
    _0x354148._asyncResumePromise && (await _0x354148._asyncResumePromise);
    const _0x5bace7 = _0x35f8f4.nodes[_0x10190d];
    (assert.equal(_0x38326f, 1),
      assert.equal(_0x26affd, 1),
      assert.equal(_0x5bace7.isGenerating, false),
      assert.equal(_0x5bace7.jobStatus, 'success'),
      assert.equal(_0x5bace7.asyncTaskStatus, 'success'),
      assert.equal(_0x5bace7.asyncTaskProvider, 'grsai'),
      assert.equal(_0x5bace7.asyncTaskKind, 'video'),
      assert.equal(_0x5bace7.asyncTaskRecovering, false),
      assert.equal(_0x5bace7.videoUrl, '/output/async-resumed.mp4'),
      assert.equal(_0x5bace7.localPath, '/output/async-resumed.mp4'),
      assert.equal(_0x354148._isGenerating, false));
  }),
  test('task orchestration: async video recovery rebuilds only the resume payload', async () => {
    const _0x4538fd = 'node-video-async-recovery-minimal-payload',
      _0x2619f2 = Date.now() - 0xea60;
    let _0x26b088 = 0;
    const {
      proto: _0x4e7e9b,
      ctx: _0x2fc16f,
      state: _0x575272,
    } = createTestContext({
      targetId: _0x4538fd,
      prompt: '',
      nodeData: {
        id: _0x4538fd,
        provider: 'apimart',
        model: 'apimart/luma-ray-v2',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'video',
        asyncTaskId: 'async-video-resume-minimal',
        asyncTaskStatus: 'running',
        asyncTaskStartedAt: _0x2619f2,
        generationStartTime: _0x2619f2,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeAsyncVideoTask: async (_0x57c2f3, _0x5edf1a, _0x5eb69d) => {
          return (
            (_0x26b088 += 1),
            assert.equal(_0x57c2f3, 'async-video-resume-minimal'),
            assert.equal(_0x5edf1a.provider, 'apimart'),
            assert.equal(_0x5edf1a.model, 'apimart/luma-ray-v2'),
            assert.equal(_0x5edf1a.prompt, undefined),
            assert.ok(_0x5eb69d?.signal),
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
    ((_0x2fc16f._isGenerating = false),
      (_0x2fc16f.btnEl = createButtonStub()),
      (_0x2fc16f.previewEl = {}),
      (_0x2fc16f._buildPayload = async () => {
        throw new Error('resume should not rebuild submit payload');
      }),
      (_0x2fc16f._persistAsyncResumeCache = () => {}),
      (_0x2fc16f._updateSubmitButtonState = () => {}),
      (_0x2fc16f._finalizeVideoSuccessSideEffects = () => {}),
      await _0x4e7e9b._maybeResumeAsyncTaskImpl.call(_0x2fc16f));
    _0x2fc16f._asyncResumePromise && (await _0x2fc16f._asyncResumePromise);
    const _0x2c8a5c = _0x575272.nodes[_0x4538fd];
    (assert.equal(_0x26b088, 1),
      assert.equal(_0x2c8a5c.isGenerating, false),
      assert.equal(_0x2c8a5c.jobStatus, 'success'),
      assert.equal(_0x2c8a5c.asyncTaskStatus, 'success'),
      assert.equal(_0x2c8a5c.asyncTaskRecovering, false),
      assert.equal(_0x2c8a5c.videoUrl, '/output/async-minimal-resumed.mp4'));
  }),
  test('task orchestration: apimart 即梦后台恢复使用 APIMart 异步轮询错误', async () => {
    const _0x5c6029 = 'node-video-apimart-dreamina-recovery-failed',
      _0x234543 = Date.now() - 0xea60;
    let _0x13447e = 0;
    const {
      proto: _0x4df9bd,
      ctx: _0x261b07,
      state: _0x55993e,
    } = createTestContext({
      targetId: _0x5c6029,
      nodeData: {
        id: _0x5c6029,
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        dreaminaSubmitId: 'task-apimart-fail',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: _0x234543,
        dreaminaTaskLastCheckedAt: Date.now() - 0x7530,
        dreaminaTaskRecovering: false,
        generationStartTime: _0x234543,
        generationDuration: null,
        isGenerating: true,
      },
      apiImpl: {
        resumeAsyncVideoTask: async (_0x3846a9, _0x505ad0) => {
          ((_0x13447e += 1),
            assert.equal(_0x3846a9, 'task-apimart-fail'),
            assert.equal(_0x505ad0.provider, 'apimart'));
          throw new Error('Seedance upstream failed');
        },
        resumeDreaminaVideoTask: async () => {
          throw new Error('should not resume official dreamina endpoint');
        },
      },
    });
    ((_0x261b07._isDreaminaVideoNode = (_0x3964ae) =>
      String(_0x3964ae?.provider || '').toLowerCase() === 'apimart' ||
      String(_0x3964ae?.provider || '').toLowerCase() === 'dreamina'),
      (_0x261b07._isGenerating = true),
      (_0x261b07.btnEl = createButtonStub()),
      (_0x261b07.previewEl = {}),
      (_0x261b07._updateSubmitButtonState = () => {}),
      (_0x261b07._persistDreaminaResumeCache = () => {}),
      await _0x4df9bd._maybeResumeDreaminaTaskImpl.call(_0x261b07));
    _0x261b07._dreaminaResumePromise && (await _0x261b07._dreaminaResumePromise);
    const _0x26e4cd = _0x55993e.nodes[_0x5c6029];
    (assert.equal(_0x13447e, 1),
      assert.equal(_0x26e4cd.isGenerating, false),
      assert.equal(_0x26e4cd.jobStatus, 'error'),
      assert.equal(_0x26e4cd.jobError, 'Seedance upstream failed'),
      assert.equal(_0x26e4cd.videos?.[0]?.error, 'Seedance upstream failed'),
      assert.equal(_0x26e4cd.dreaminaTaskStatus, 'failed'),
      assert.equal(_0x26e4cd.dreaminaTaskPhase, 'failed'),
      assert.equal(_0x26e4cd.dreaminaTaskLabel, 'Seedance upstream failed'),
      assert.equal(_0x26e4cd.dreaminaTaskRecovering, false));
  }),
  test('task orchestration: dreamina video recovery does not abort itself on reentrant state update', async () => {
    const _0x29233e = 'node-video-dreamina-reentrant-recovery',
      _0x525472 = Date.now() - 0xea60,
      {
        proto: _0x4885cd,
        ctx: _0x5610e9,
        state: _0x10057d,
        store: _0x3fb35a,
      } = createTestContext({
        targetId: _0x29233e,
        nodeData: {
          id: _0x29233e,
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaSubmitId: 'sid-video-reentrant-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLabel: '生成中',
          dreaminaTaskStartedAt: _0x525472,
          dreaminaTaskLastCheckedAt: Date.now() - 0x7530,
          dreaminaTaskRecovering: false,
          generationStartTime: _0x525472,
          generationDuration: null,
          isGenerating: true,
        },
        apiImpl: {
          resumeDreaminaVideoTask: async (_0x4de2db) => {
            (assert.equal(_0x4de2db, 'sid-video-reentrant-fail'), await Promise.resolve());
            throw new Error('generation failed: final generation failed');
          },
        },
      });
    ((_0x5610e9._isGenerating = true),
      (_0x5610e9.btnEl = createButtonStub()),
      (_0x5610e9.previewEl = {}),
      (_0x5610e9._updateSubmitButtonState = () => {}),
      (_0x5610e9._persistDreaminaResumeCache = () => {}));
    const _0x6f0eea = _0x3fb35a.updateNodeData.bind(_0x3fb35a);
    let _0x44756b = false;
    ((_0x3fb35a.updateNodeData = (_0x46eb63, _0x33c0da) => {
      (_0x6f0eea(_0x46eb63, _0x33c0da),
        !_0x44756b &&
          _0x33c0da?.dreaminaTaskRecovering === true &&
          ((_0x44756b = true), void _0x4885cd._maybeResumeDreaminaTaskImpl.call(_0x5610e9)));
    }),
      await _0x4885cd._maybeResumeDreaminaTaskImpl.call(_0x5610e9),
      await _0x5610e9._dreaminaResumePromise);
    const _0x20c6eb = _0x10057d.nodes[_0x29233e];
    (assert.equal(_0x44756b, true),
      assert.equal(_0x20c6eb.isGenerating, false),
      assert.equal(_0x20c6eb.jobStatus, 'error'),
      assert.equal(_0x20c6eb.videos?.[0]?.error, 'generation failed: final generation failed'),
      assert.equal(_0x20c6eb.dreaminaTaskStatus, 'failed'),
      assert.equal(_0x20c6eb.dreaminaTaskRecovering, false));
  }),
  test('task orchestration: dreamina active video submit skips duplicate recovery until stale', async () => {
    const _0x589344 = 'node-video-dreamina-active-submit',
      _0x41b874 = Date.now() - 0xea60;
    let _0x1b43ec = 0;
    const {
      proto: _0x3c34f5,
      ctx: _0x1b737f,
      state: _0x42dfd7,
    } = createTestContext({
      targetId: _0x589344,
      nodeData: {
        id: _0x589344,
        provider: 'dreamina',
        model: 'dreamina/seedance2.0fast',
        dreaminaSubmitId: 'sid-video-active',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: _0x41b874,
        dreaminaTaskLastCheckedAt: Date.now(),
        dreaminaTaskRecovering: false,
        generationStartTime: _0x41b874,
        generationDuration: null,
        isGenerating: true,
      },
      apiImpl: {
        resumeDreaminaVideoTask: async (_0x5c9ef6) => {
          return (
            (_0x1b43ec += 1),
            assert.equal(_0x5c9ef6, 'sid-video-active'),
            {
              isBatch: false,
              dreaminaSnapshot: {
                submitId: _0x5c9ef6,
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
    ((_0x1b737f._isGenerating = true),
      (_0x1b737f._dreaminaActiveSubmitId = 'sid-video-active'),
      (_0x1b737f.btnEl = createButtonStub()),
      (_0x1b737f.previewEl = {}),
      (_0x1b737f._updateSubmitButtonState = () => {}),
      (_0x1b737f._persistDreaminaResumeCache = () => {}),
      (_0x1b737f._finalizeVideoSuccessSideEffects = () => {}),
      await _0x3c34f5._maybeResumeDreaminaTaskImpl.call(_0x1b737f),
      assert.equal(_0x1b43ec, 0),
      assert.equal(_0x1b737f._dreaminaResumePromise, undefined),
      (_0x42dfd7.nodes[_0x589344].dreaminaTaskLastCheckedAt = Date.now() - 0x4e20),
      await _0x3c34f5._maybeResumeDreaminaTaskImpl.call(_0x1b737f),
      _0x1b737f._dreaminaResumePromise && (await _0x1b737f._dreaminaResumePromise),
      assert.equal(_0x1b43ec, 1),
      assert.equal(_0x42dfd7.nodes[_0x589344].dreaminaTaskStatus, 'success'));
  }),
  test('task orchestration: dreamina background queueing toast is deduped per submit id', () => {
    const _0x16f7b0 = 'node-video-dreamina-toast-dedupe',
      { proto: _0x28001f, ctx: _0x4502c0 } = createTestContext({
        targetId: _0x16f7b0,
        nodeData: {
          id: _0x16f7b0,
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaSubmitId: 'sid-video-toast',
        },
      }),
      _0x2f624f = globalThis.window.showToast,
      _0x4773b7 = [];
    globalThis.window.showToast = (_0x3d6ff7) => {
      _0x4773b7.push(String(_0x3d6ff7 || ''));
    };
    try {
      (_0x28001f._showDreaminaBackgroundQueueingToast.call(_0x4502c0, 'sid-video-toast'),
        _0x28001f._showDreaminaBackgroundQueueingToast.call(_0x4502c0, 'sid-video-toast'),
        _0x28001f._showDreaminaBackgroundQueueingToast.call(_0x4502c0, 'sid-video-toast-next'));
      const { proto: _0x4e21c8, ctx: _0x153f69 } = createTestContext({
        targetId: _0x16f7b0 + '-remount',
        nodeData: {
          id: _0x16f7b0 + '-remount',
          provider: 'dreamina',
          model: 'dreamina/seedance2.0fast',
          dreaminaSubmitId: 'sid-video-toast-next',
        },
      });
      (_0x4e21c8._showDreaminaBackgroundQueueingToast.call(_0x153f69, 'sid-video-toast-next'),
        assert.deepEqual(_0x4773b7, ['即梦排队较久，已转为后台查询', '即梦排队较久，已转为后台查询']));
    } finally {
      globalThis.window.showToast = _0x2f624f;
    }
  }),
  test('task orchestration: dreamina TIMEOUT 错误会转为后台 pending', async () => {
    const _0x397b65 = 'node-video-timeout-1',
      _0x1398e7 = {
        nodes: { [_0x397b65]: { id: _0x397b65, provider: 'dreamina', model: 'dreamina/seedance2.0fast' } },
      },
      _0xc24f65 = createStore(_0x1398e7),
      _0x67e468 = globalThis.window.showToast,
      _0x996c6f = [];
    let _0x32e36e = 0,
      _0x3d478a = 0;
    globalThis.window.showToast = (_0x27494e) => {
      _0x996c6f.push(String(_0x27494e || ''));
    };
    try {
      const _0x266a5c = createVideoNodeTaskOrchestrationModule({
          store: _0xc24f65,
          api: {
            generateVideo: async () => {
              const _0xf67b14 = new Error('请求超时（60秒）');
              _0xf67b14.code = 'TIMEOUT';
              throw _0xf67b14;
            },
          },
          getImage: async () => null,
          startLoading: () => {
            _0x32e36e += 1;
          },
          stopLoading: () => {
            _0x3d478a += 1;
          },
          ensureConfig: async () => {},
          getProviderConfig: () => ({ apiKey: '' }),
          isVideoVipModel: () => false,
          ensureVipSessionRecheck: async () => {},
        }),
        _0x184b40 = Object.assign(Object.create(_0x266a5c), {
          nodeId: _0x397b65,
          _data: _0x1398e7.nodes[_0x397b65],
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
          _isDreaminaVideoNode(_0x4784bd) {
            return (
              String(_0x4784bd?.provider || '')
                .trim()
                .toLowerCase() === 'dreamina'
            );
          },
          _isRunninghubWorkflowModel: () => false,
        });
      await _0x266a5c._onGenerateImpl.call(_0x184b40);
      const _0x5c4d79 = _0x1398e7.nodes[_0x397b65];
      (assert.equal(_0x5c4d79.dreaminaTaskStatus, 'pending'),
        assert.equal(_0x5c4d79.dreaminaTaskPhase, 'generating'),
        assert.equal(_0x5c4d79.dreaminaTaskLabel, '排队中（后台查询）'),
        assert.equal(_0x5c4d79.dreaminaTaskStatus === 'failed', false),
        assert.equal(_0x5c4d79.isGenerating, true),
        assert.equal(_0x32e36e, 1),
        assert.equal(_0x3d478a, 0),
        assert.equal(_0x996c6f.includes('即梦排队较久，已转为后台查询'), true));
    } finally {
      globalThis.window.showToast = _0x67e468;
    }
  }));
