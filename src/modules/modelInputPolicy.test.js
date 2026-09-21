import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACE_V21_MODEL_ID,
  PERSON_REPLACE_V3_MODEL_ID,
  registerManifestBundle,
} from '../manifests/index.js';
import {
  getTargetInputPolicy,
  hasUsableInputNodeSource,
  isInputKindAllowed,
  isRhPersonReplaceWorkflowModel,
} from './modelInputPolicy.js';
function createTwoSlotWorkflowExecution(_0x419e76 = {}) {
  return {
    schemaVersion: '1.0',
    id: 'plugin.test.two-slot-image.workflow.v1',
    provider: 'runninghubwf',
    kind: 'image',
    adapterType: 'workflow',
    workflowId: 'plugin-two-slot-image-workflow',
    submitMode: 'openapi-v2-ai-app',
    queryMode: 'openapi-v2-query',
    mapping: { imageNodes: ['1', '2'] },
    result: { imagePaths: ['results[].url'] },
    ..._0x419e76,
  };
}
function createTwoSlotWorkflowModel(_0x3e89ec = {}) {
  return {
    schemaVersion: '1.0',
    modelId: 'plugin/test-two-slot-image-workflow',
    provider: 'runninghubwf',
    kind: 'image',
    adapterType: 'workflow',
    executionId: 'plugin.test.two-slot-image.workflow.v1',
    displayName: 'Test Two Slot Image Workflow',
    uiSchema: { fields: [] },
    inputSlots: {
      allowedKinds: ['text', 'image'],
      minByKind: { image: 2 },
      maxByKind: { image: 2, video: 0, audio: 0 },
      fixedSlots: [
        { id: 'sourceImage', kind: 'image', label: 'Source image', required: true },
        { id: 'styleImage', kind: 'image', label: 'Style image', required: true },
      ],
    },
    outputType: 'image',
    ..._0x3e89ec,
  };
}
(test('model input policy: person replace manifests keep dedicated fixed slot behavior', () => {
  (assert.equal(isRhPersonReplaceWorkflowModel(PERSON_REPLACE_V21_MODEL_ID), true),
    assert.equal(isRhPersonReplaceWorkflowModel(PERSON_REPLACE_V3_MODEL_ID), true));
}),
  test('model input policy: generic two image fixed-slot workflows are not person replace', () => {
    const _0x4f6d44 = createTwoSlotWorkflowExecution(),
      _0x5b2135 = createTwoSlotWorkflowModel();
    (registerManifestBundle({
      sourceId: 'model-input-policy-test-two-slot-image',
      executions: [_0x4f6d44],
      models: [_0x5b2135],
    }),
      assert.equal(isRhPersonReplaceWorkflowModel(_0x5b2135.modelId), false));
  }),
  test('model input policy: person replace capability requires matching image input slots', () => {
    const _0x32f819 = createTwoSlotWorkflowExecution({
        id: 'plugin.test.bad-person-replace.workflow.v1',
        workflowId: 'plugin-bad-person-replace-workflow',
      }),
      _0x1e8144 = createTwoSlotWorkflowModel({
        modelId: 'plugin/test-bad-person-replace-slots',
        executionId: _0x32f819.id,
        capabilities: { fixedImageSlots: ['replaceTarget', 'replacedImage'] },
        inputSlots: {
          allowedKinds: ['text', 'image'],
          minByKind: { image: 1 },
          maxByKind: { image: 2, video: 0, audio: 0 },
          fixedSlots: [
            { id: 'replaceTarget', kind: 'image', required: true },
            { id: 'replacedImage', kind: 'video', required: false },
          ],
        },
      });
    (registerManifestBundle({
      sourceId: 'model-input-policy-test-bad-person-replace-slots',
      executions: [_0x32f819],
      models: [_0x1e8144],
    }),
      assert.equal(isRhPersonReplaceWorkflowModel(_0x1e8144.modelId), false));
  }),
  test('model input policy: video sources with display local paths are usable inputs', () => {
    (assert.equal(
      hasUsableInputNodeSource({
        id: 'display-video',
        type: 'source-video',
        displayLocalPath: 'data/assets/display.mp4',
      }),
      true,
    ),
      assert.equal(
        hasUsableInputNodeSource({
          id: 'display-video-missing',
          type: 'source-video',
          displayLocalPath: 'data/assets/display.mp4',
          mediaUnavailable: true,
          mediaUnavailableSource: 'data/assets/display.mp4',
        }),
        false,
      ));
  }),
  test('model input policy: source video result collections fall back to top-level media', () => {
    assert.equal(
      hasUsableInputNodeSource({
        id: 'keyed-video',
        type: 'source-video',
        localPath: 'output/keyed.mp4',
        videoUrl: '/output/keyed.mp4',
        videos: [{ thumbUrl: '' }],
        model: 'runninghub/video_matting',
        rhToolbarTaskType: 'video-keying',
        jobStatus: 'success',
        isGenerating: false,
      }),
      true,
    );
  }),
  test('model input policy: APIMart text models use GPT image-only media inputs', () => {
    const _0x2fe8b6 = getTargetInputPolicy({
      id: 'apimart-text',
      type: 'ai-text',
      model: 'apimart/gemini-3.1-pro-preview',
      provider: 'apimart',
    });
    (assert.equal(isInputKindAllowed(_0x2fe8b6, 'text'), true),
      assert.equal(isInputKindAllowed(_0x2fe8b6, 'image'), true),
      assert.equal(isInputKindAllowed(_0x2fe8b6, 'video'), false),
      assert.equal(isInputKindAllowed(_0x2fe8b6, 'audio'), false),
      assert.equal(_0x2fe8b6.maxByKind.video, 0),
      assert.equal(_0x2fe8b6.maxByKind.audio, 0));
  }),
  test('model input policy: storyboard nodes accept text image and video inputs', () => {
    for (const _0x51da2a of ['storyboard', 'storyboard-script']) {
      const _0x34a414 = getTargetInputPolicy({ id: _0x51da2a + '-input-target', type: _0x51da2a });
      (assert.equal(isInputKindAllowed(_0x34a414, 'text'), true),
        assert.equal(isInputKindAllowed(_0x34a414, 'image'), true),
        assert.equal(isInputKindAllowed(_0x34a414, 'video'), true),
        assert.equal(isInputKindAllowed(_0x34a414, 'audio'), false),
        assert.equal(_0x34a414.maxByKind.audio, 0));
    }
  }),
  test('model input policy: HappyHorse media inputs follow the selected mode', () => {
    const _0x482ffa = {
        id: 'happyhorse',
        type: 'ai-video',
        model: 'apimart/happyhorse-1.0',
        provider: 'apimart',
      },
      _0x4915e1 = getTargetInputPolicy(_0x482ffa);
    (assert.equal(isInputKindAllowed(_0x4915e1, 'image'), false),
      assert.equal(isInputKindAllowed(_0x4915e1, 'video'), false));
    const _0x31d7d7 = getTargetInputPolicy({ ..._0x482ffa, generationParams: { happyhorse_mode: 'image' } });
    (assert.equal(isInputKindAllowed(_0x31d7d7, 'image'), true),
      assert.equal(isInputKindAllowed(_0x31d7d7, 'video'), false),
      assert.equal(_0x31d7d7.maxByKind.image, 1));
    const _0x408fcc = getTargetInputPolicy({
      ..._0x482ffa,
      generationParams: { happyhorse_mode: 'reference' },
    });
    (assert.equal(isInputKindAllowed(_0x408fcc, 'image'), true),
      assert.equal(isInputKindAllowed(_0x408fcc, 'video'), false),
      assert.equal(_0x408fcc.maxByKind.image, 9));
    const _0x43b5da = getTargetInputPolicy({ ..._0x482ffa, generationParams: { happyhorse_mode: 'edit' } });
    (assert.equal(isInputKindAllowed(_0x43b5da, 'image'), true),
      assert.equal(isInputKindAllowed(_0x43b5da, 'video'), true),
      assert.equal(isInputKindAllowed(_0x43b5da, 'audio'), false),
      assert.equal(_0x43b5da.maxByKind.image, 5),
      assert.equal(_0x43b5da.maxByKind.video, 1));
    const _0xadb094 = getTargetInputPolicy({
      ..._0x482ffa,
      model: 'runninghub-model/happyhorse-1.0',
      provider: 'runninghub',
      generationParams: { happyhorse_mode: 'reference' },
    });
    (assert.equal(isInputKindAllowed(_0xadb094, 'image'), true),
      assert.equal(isInputKindAllowed(_0xadb094, 'video'), false),
      assert.equal(_0xadb094.maxByKind.image, 9));
  }),
  test('model input policy: RunningHub Seedance 2.0 media inputs follow mode', () => {
    const _0x2d730a = {
        id: 'seedance-2',
        type: 'ai-video',
        model: 'runninghub-model/seedance-2.0',
        provider: 'runninghub',
      },
      _0x3bf1e7 = getTargetInputPolicy(_0x2d730a);
    (assert.equal(isInputKindAllowed(_0x3bf1e7, 'text'), true),
      assert.equal(isInputKindAllowed(_0x3bf1e7, 'image'), false),
      assert.equal(isInputKindAllowed(_0x3bf1e7, 'video'), false),
      assert.equal(isInputKindAllowed(_0x3bf1e7, 'audio'), false),
      assert.equal(_0x3bf1e7.maxByKind.image, 0),
      assert.equal(_0x3bf1e7.maxByKind.video, 0),
      assert.equal(_0x3bf1e7.maxByKind.audio, 0));
    const _0x47f6c9 = getTargetInputPolicy({
      ..._0x2d730a,
      generationParams: { rh_seedance_2_mode: 'image2video' },
    });
    (assert.equal(isInputKindAllowed(_0x47f6c9, 'text'), true),
      assert.equal(isInputKindAllowed(_0x47f6c9, 'image'), true),
      assert.equal(isInputKindAllowed(_0x47f6c9, 'video'), false),
      assert.equal(isInputKindAllowed(_0x47f6c9, 'audio'), false),
      assert.equal(_0x47f6c9.maxByKind.image, 1),
      assert.equal(_0x47f6c9.maxByKind.video, 0),
      assert.equal(_0x47f6c9.maxByKind.audio, 0));
    const _0x113388 = getTargetInputPolicy({
      ..._0x2d730a,
      generationParams: { rh_seedance_2_mode: 'frames2video' },
    });
    (assert.equal(isInputKindAllowed(_0x113388, 'text'), true),
      assert.equal(isInputKindAllowed(_0x113388, 'image'), true),
      assert.equal(isInputKindAllowed(_0x113388, 'video'), false),
      assert.equal(isInputKindAllowed(_0x113388, 'audio'), false),
      assert.equal(_0x113388.maxByKind.image, 2),
      assert.equal(_0x113388.maxByKind.video, 0),
      assert.equal(_0x113388.maxByKind.audio, 0));
    const _0xf2be0b = getTargetInputPolicy({
      ..._0x2d730a,
      generationParams: { rh_seedance_2_mode: 'multimodal2video' },
    });
    (assert.equal(isInputKindAllowed(_0xf2be0b, 'text'), true),
      assert.equal(isInputKindAllowed(_0xf2be0b, 'image'), true),
      assert.equal(isInputKindAllowed(_0xf2be0b, 'video'), true),
      assert.equal(isInputKindAllowed(_0xf2be0b, 'audio'), true),
      assert.equal(_0xf2be0b.maxByKind.image, 9),
      assert.equal(_0xf2be0b.maxByKind.video, 3),
      assert.equal(_0xf2be0b.maxByKind.audio, 3));
  }),
  test('model input policy: Volcengine Seedance 2.0 media inputs follow mode', () => {
    const _0x1c47ef = {
        id: 'volcengine-seedance-2',
        type: 'ai-video',
        model: 'volcengine/seedance-2.0-fast',
        provider: 'volcengine',
      },
      _0x8ef30b = getTargetInputPolicy(_0x1c47ef);
    (assert.equal(isInputKindAllowed(_0x8ef30b, 'text'), true),
      assert.equal(isInputKindAllowed(_0x8ef30b, 'image'), true),
      assert.equal(isInputKindAllowed(_0x8ef30b, 'video'), true),
      assert.equal(isInputKindAllowed(_0x8ef30b, 'audio'), true),
      assert.equal(_0x8ef30b.maxByKind.image, 9),
      assert.equal(_0x8ef30b.maxByKind.video, 3),
      assert.equal(_0x8ef30b.maxByKind.audio, 3));
    const _0x4f30d7 = getTargetInputPolicy({
      ..._0x1c47ef,
      generationParams: { dreaminaRouteMode: 'frames2video' },
    });
    (assert.equal(isInputKindAllowed(_0x4f30d7, 'image'), true),
      assert.equal(isInputKindAllowed(_0x4f30d7, 'video'), false),
      assert.equal(_0x4f30d7.maxByKind.image, 2));
    const _0x2218e2 = getTargetInputPolicy({
      ..._0x1c47ef,
      generationParams: { dreaminaRouteMode: 'multimodal2video' },
    });
    (assert.equal(isInputKindAllowed(_0x2218e2, 'image'), true),
      assert.equal(isInputKindAllowed(_0x2218e2, 'video'), true),
      assert.equal(isInputKindAllowed(_0x2218e2, 'audio'), true),
      assert.equal(_0x2218e2.maxByKind.image, 9),
      assert.equal(_0x2218e2.maxByKind.video, 3),
      assert.equal(_0x2218e2.maxByKind.audio, 3),
      assert.equal(isInputKindAllowed(_0x8ef30b, 'text'), true));
  }),
  test('model input policy: VEO3 reference mode keeps generic 3 image inputs', () => {
    const _0x20cbff = getTargetInputPolicy({
      id: 'veo3-reference',
      type: 'ai-video',
      model: 'apimart/veo3-fast',
      provider: 'apimart',
      generationParams: { mode: 'fast', generation_type: 'reference' },
    });
    (assert.equal(isInputKindAllowed(_0x20cbff, 'text'), true),
      assert.equal(isInputKindAllowed(_0x20cbff, 'image'), true),
      assert.equal(isInputKindAllowed(_0x20cbff, 'video'), false),
      assert.equal(isInputKindAllowed(_0x20cbff, 'audio'), false),
      assert.equal(_0x20cbff.maxByKind.image, 3));
  }),
  test('model input policy: Vidu Q3 media inputs follow generation mode', () => {
    const _0x147d5e = { id: 'vidu-q3', type: 'ai-video', model: 'apimart/viduq3', provider: 'apimart' },
      _0x5844b2 = getTargetInputPolicy(_0x147d5e);
    (assert.equal(isInputKindAllowed(_0x5844b2, 'text'), true),
      assert.equal(isInputKindAllowed(_0x5844b2, 'image'), true),
      assert.equal(isInputKindAllowed(_0x5844b2, 'video'), false),
      assert.equal(isInputKindAllowed(_0x5844b2, 'audio'), false),
      assert.equal(_0x5844b2.maxByKind.image, 2));
    const _0x2d4754 = getTargetInputPolicy({
      ..._0x147d5e,
      generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3' },
    });
    (assert.equal(isInputKindAllowed(_0x2d4754, 'text'), true),
      assert.equal(isInputKindAllowed(_0x2d4754, 'image'), true),
      assert.equal(isInputKindAllowed(_0x2d4754, 'video'), false),
      assert.equal(isInputKindAllowed(_0x2d4754, 'audio'), false),
      assert.equal(_0x2d4754.maxByKind.image, 7));
  }),
  test('model input policy: Grok Imagine uses manifest image-only limit', () => {
    const _0x235790 = getTargetInputPolicy({
      id: 'grok-imagine',
      type: 'ai-video',
      model: 'apimart/grok-imagine-1.0',
      provider: 'apimart',
    });
    (assert.equal(isInputKindAllowed(_0x235790, 'text'), true),
      assert.equal(isInputKindAllowed(_0x235790, 'image'), true),
      assert.equal(isInputKindAllowed(_0x235790, 'video'), false),
      assert.equal(isInputKindAllowed(_0x235790, 'audio'), false),
      assert.equal(_0x235790.maxByKind.image, 7));
  }),
  test('model input policy: Gemini Omni Flash uses manifest image and video limits', () => {
    const _0x14aea6 = getTargetInputPolicy({
      id: 'omni-flash',
      type: 'ai-video',
      model: 'apimart/omni-flash-ext',
      provider: 'apimart',
    });
    (assert.equal(isInputKindAllowed(_0x14aea6, 'text'), true),
      assert.equal(isInputKindAllowed(_0x14aea6, 'image'), true),
      assert.equal(isInputKindAllowed(_0x14aea6, 'video'), true),
      assert.equal(isInputKindAllowed(_0x14aea6, 'audio'), false),
      assert.equal(_0x14aea6.maxByKind.image, 3),
      assert.equal(_0x14aea6.maxByKind.video, 1));
  }),
  test('model input policy: Wan2.7 media inputs follow image/video mode', () => {
    const _0x4fe100 = { id: 'wan27', type: 'ai-video', model: 'apimart/wan2.7', provider: 'apimart' },
      _0xba1254 = getTargetInputPolicy(_0x4fe100);
    (assert.equal(isInputKindAllowed(_0xba1254, 'text'), true),
      assert.equal(isInputKindAllowed(_0xba1254, 'image'), true),
      assert.equal(isInputKindAllowed(_0xba1254, 'audio'), true),
      assert.equal(isInputKindAllowed(_0xba1254, 'video'), false),
      assert.equal(_0xba1254.maxByKind.image, 2),
      assert.equal(_0xba1254.maxByKind.audio, 1));
    const _0x3045ac = getTargetInputPolicy({ ..._0x4fe100, generationParams: { wan27_mode: 'video' } });
    (assert.equal(isInputKindAllowed(_0x3045ac, 'text'), true),
      assert.equal(isInputKindAllowed(_0x3045ac, 'video'), true),
      assert.equal(isInputKindAllowed(_0x3045ac, 'image'), false),
      assert.equal(isInputKindAllowed(_0x3045ac, 'audio'), false),
      assert.equal(_0x3045ac.maxByKind.video, 1));
    const _0x174150 = getTargetInputPolicy({
      ..._0x4fe100,
      model: 'wan2.7',
      generationParams: { wan27_mode: 'video' },
    });
    (assert.equal(isInputKindAllowed(_0x174150, 'video'), true),
      assert.equal(isInputKindAllowed(_0x174150, 'image'), false),
      assert.equal(isInputKindAllowed(_0x174150, 'audio'), false));
    const _0x2049de = getTargetInputPolicy({ ..._0x4fe100, generationParams: { wan27_mode: 'reference' } });
    (assert.equal(isInputKindAllowed(_0x2049de, 'image'), true),
      assert.equal(isInputKindAllowed(_0x2049de, 'video'), true),
      assert.equal(isInputKindAllowed(_0x2049de, 'audio'), true),
      assert.equal(_0x2049de.maxByKind.image, 1),
      assert.equal(_0x2049de.maxByKind.video, 1),
      assert.equal(_0x2049de.maxByKind.audio, 1));
    const _0x460229 = getTargetInputPolicy({ ..._0x4fe100, generationParams: { wan27_mode: 'edit' } });
    (assert.equal(isInputKindAllowed(_0x460229, 'image'), false),
      assert.equal(isInputKindAllowed(_0x460229, 'video'), true),
      assert.equal(isInputKindAllowed(_0x460229, 'audio'), false),
      assert.equal(_0x460229.maxByKind.image, 0),
      assert.equal(_0x460229.maxByKind.video, 2));
    const _0x103919 = getTargetInputPolicy({
      ..._0x4fe100,
      provider: 'apimartr',
      generationParams: { wan27_mode: 'video' },
    });
    (assert.equal(isInputKindAllowed(_0x103919, 'video'), true),
      assert.equal(isInputKindAllowed(_0x103919, 'image'), false));
  }),
  test('model input policy: Kling V3 Omni media inputs follow selected mode', () => {
    const _0x42cf46 = {
        id: 'kling-omni',
        type: 'ai-video',
        model: 'apimart/kling-v3-omni',
        provider: 'apimart',
      },
      _0x43c714 = getTargetInputPolicy(_0x42cf46);
    (assert.equal(isInputKindAllowed(_0x43c714, 'text'), true),
      assert.equal(isInputKindAllowed(_0x43c714, 'image'), true),
      assert.equal(isInputKindAllowed(_0x43c714, 'video'), false),
      assert.equal(isInputKindAllowed(_0x43c714, 'audio'), false),
      assert.equal(_0x43c714.maxByKind.image, 2));
    const _0x12f47d = getTargetInputPolicy({
      ..._0x42cf46,
      generationParams: { kling_v3_omni_mode: 'reference' },
    });
    (assert.equal(isInputKindAllowed(_0x12f47d, 'image'), true),
      assert.equal(isInputKindAllowed(_0x12f47d, 'video'), true),
      assert.equal(isInputKindAllowed(_0x12f47d, 'audio'), false),
      assert.equal(_0x12f47d.maxByKind.image, 1),
      assert.equal(_0x12f47d.maxByKind.video, 1));
    const _0x9ac64 = getTargetInputPolicy({ ..._0x42cf46, generationParams: { kling_v3_omni_mode: 'edit' } });
    (assert.equal(isInputKindAllowed(_0x9ac64, 'image'), false),
      assert.equal(isInputKindAllowed(_0x9ac64, 'video'), true),
      assert.equal(isInputKindAllowed(_0x9ac64, 'audio'), false),
      assert.equal(_0x9ac64.maxByKind.video, 1));
  }),
  test('model input policy: Kling O1 uses manifest image and video limits', () => {
    const _0x1f1824 = getTargetInputPolicy({
      id: 'kling-o1',
      type: 'ai-video',
      model: 'apimart/kling-video-o1',
      provider: 'apimart',
    });
    (assert.equal(isInputKindAllowed(_0x1f1824, 'text'), true),
      assert.equal(isInputKindAllowed(_0x1f1824, 'image'), true),
      assert.equal(isInputKindAllowed(_0x1f1824, 'video'), true),
      assert.equal(isInputKindAllowed(_0x1f1824, 'audio'), false),
      assert.equal(_0x1f1824.maxByKind.image, 2),
      assert.equal(_0x1f1824.maxByKind.video, 1));
  }));
