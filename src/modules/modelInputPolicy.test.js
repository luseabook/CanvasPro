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
function createTwoSlotWorkflowExecution(args = {}) {
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
    ...args,
  };
}
function createTwoSlotWorkflowModel(args2 = {}) {
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
    ...args2,
  };
}
(test('model input policy: person replace manifests keep dedicated fixed slot behavior', () => {
  (assert.equal(isRhPersonReplaceWorkflowModel(PERSON_REPLACE_V21_MODEL_ID), true),
    assert.equal(isRhPersonReplaceWorkflowModel(PERSON_REPLACE_V3_MODEL_ID), true));
}),
  test('model input policy: generic two image fixed-slot workflows are not person replace', () => {
    const twoSlotWorkflowExecution = createTwoSlotWorkflowExecution(),
      twoSlotWorkflowModel = createTwoSlotWorkflowModel();
    (registerManifestBundle({
      sourceId: 'model-input-policy-test-two-slot-image',
      executions: [twoSlotWorkflowExecution],
      models: [twoSlotWorkflowModel],
    }),
      assert.equal(isRhPersonReplaceWorkflowModel(twoSlotWorkflowModel.modelId), false));
  }),
  test('model input policy: person replace capability requires matching image input slots', () => {
    const executionId = createTwoSlotWorkflowExecution({
        id: 'plugin.test.bad-person-replace.workflow.v1',
        workflowId: 'plugin-bad-person-replace-workflow',
      }),
      twoSlotWorkflowModel2 = createTwoSlotWorkflowModel({
        modelId: 'plugin/test-bad-person-replace-slots',
        executionId: executionId.id,
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
      executions: [executionId],
      models: [twoSlotWorkflowModel2],
    }),
      assert.equal(isRhPersonReplaceWorkflowModel(twoSlotWorkflowModel2.modelId), false));
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
    const targetInputPolicy = getTargetInputPolicy({
      id: 'apimart-text',
      type: 'ai-text',
      model: 'apimart/gemini-3.1-pro-preview',
      provider: 'apimart',
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy, 'audio'), false),
      assert.equal(targetInputPolicy.maxByKind.video, 0),
      assert.equal(targetInputPolicy.maxByKind.audio, 0));
  }),
  test('model input policy: storyboard nodes accept text image and video inputs', () => {
    for (const id of ['storyboard', 'storyboard-script']) {
      const targetInputPolicy2 = getTargetInputPolicy({ id: id + '-input-target', type: id });
      (assert.equal(isInputKindAllowed(targetInputPolicy2, 'text'), true),
        assert.equal(isInputKindAllowed(targetInputPolicy2, 'image'), true),
        assert.equal(isInputKindAllowed(targetInputPolicy2, 'video'), true),
        assert.equal(isInputKindAllowed(targetInputPolicy2, 'audio'), false),
        assert.equal(targetInputPolicy2.maxByKind.audio, 0));
    }
  }),
  test('model input policy: HappyHorse media inputs follow the selected mode', () => {
    const args3 = {
        id: 'happyhorse',
        type: 'ai-video',
        model: 'apimart/happyhorse-1.0',
        provider: 'apimart',
      },
      targetInputPolicy3 = getTargetInputPolicy(args3);
    (assert.equal(isInputKindAllowed(targetInputPolicy3, 'image'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy3, 'video'), false));
    const targetInputPolicy4 = getTargetInputPolicy({
      ...args3,
      generationParams: { happyhorse_mode: 'image' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy4, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy4, 'video'), false),
      assert.equal(targetInputPolicy4.maxByKind.image, 1));
    const targetInputPolicy5 = getTargetInputPolicy({
      ...args3,
      generationParams: { happyhorse_mode: 'reference' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy5, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy5, 'video'), false),
      assert.equal(targetInputPolicy5.maxByKind.image, 9));
    const targetInputPolicy6 = getTargetInputPolicy({
      ...args3,
      generationParams: { happyhorse_mode: 'edit' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy6, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy6, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy6, 'audio'), false),
      assert.equal(targetInputPolicy6.maxByKind.image, 5),
      assert.equal(targetInputPolicy6.maxByKind.video, 1));
    const targetInputPolicy7 = getTargetInputPolicy({
      ...args3,
      model: 'runninghub-model/happyhorse-1.0',
      provider: 'runninghub',
      generationParams: { happyhorse_mode: 'reference' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy7, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy7, 'video'), false),
      assert.equal(targetInputPolicy7.maxByKind.image, 9));
  }),
  test('model input policy: RunningHub Seedance 2.0 media inputs follow mode', () => {
    const args4 = {
        id: 'seedance-2',
        type: 'ai-video',
        model: 'runninghub-model/seedance-2.0',
        provider: 'runninghub',
      },
      targetInputPolicy8 = getTargetInputPolicy(args4);
    (assert.equal(isInputKindAllowed(targetInputPolicy8, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy8, 'image'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy8, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy8, 'audio'), false),
      assert.equal(targetInputPolicy8.maxByKind.image, 0),
      assert.equal(targetInputPolicy8.maxByKind.video, 0),
      assert.equal(targetInputPolicy8.maxByKind.audio, 0));
    const targetInputPolicy9 = getTargetInputPolicy({
      ...args4,
      generationParams: { rh_seedance_2_mode: 'image2video' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy9, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy9, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy9, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy9, 'audio'), false),
      assert.equal(targetInputPolicy9.maxByKind.image, 1),
      assert.equal(targetInputPolicy9.maxByKind.video, 0),
      assert.equal(targetInputPolicy9.maxByKind.audio, 0));
    const targetInputPolicy10 = getTargetInputPolicy({
      ...args4,
      generationParams: { rh_seedance_2_mode: 'frames2video' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy10, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy10, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy10, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy10, 'audio'), false),
      assert.equal(targetInputPolicy10.maxByKind.image, 2),
      assert.equal(targetInputPolicy10.maxByKind.video, 0),
      assert.equal(targetInputPolicy10.maxByKind.audio, 0));
    const targetInputPolicy11 = getTargetInputPolicy({
      ...args4,
      generationParams: { rh_seedance_2_mode: 'multimodal2video' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy11, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy11, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy11, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy11, 'audio'), true),
      assert.equal(targetInputPolicy11.maxByKind.image, 9),
      assert.equal(targetInputPolicy11.maxByKind.video, 3),
      assert.equal(targetInputPolicy11.maxByKind.audio, 3));
  }),
  test('model input policy: Volcengine Seedance 2.0 media inputs follow mode', () => {
    const args5 = {
        id: 'volcengine-seedance-2',
        type: 'ai-video',
        model: 'volcengine/seedance-2.0-fast',
        provider: 'volcengine',
      },
      targetInputPolicy12 = getTargetInputPolicy(args5);
    (assert.equal(isInputKindAllowed(targetInputPolicy12, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy12, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy12, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy12, 'audio'), true),
      assert.equal(targetInputPolicy12.maxByKind.image, 9),
      assert.equal(targetInputPolicy12.maxByKind.video, 3),
      assert.equal(targetInputPolicy12.maxByKind.audio, 3));
    const targetInputPolicy13 = getTargetInputPolicy({
      ...args5,
      generationParams: { dreaminaRouteMode: 'frames2video' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy13, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy13, 'video'), false),
      assert.equal(targetInputPolicy13.maxByKind.image, 2));
    const targetInputPolicy14 = getTargetInputPolicy({
      ...args5,
      generationParams: { dreaminaRouteMode: 'multimodal2video' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy14, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy14, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy14, 'audio'), true),
      assert.equal(targetInputPolicy14.maxByKind.image, 9),
      assert.equal(targetInputPolicy14.maxByKind.video, 3),
      assert.equal(targetInputPolicy14.maxByKind.audio, 3),
      assert.equal(isInputKindAllowed(targetInputPolicy12, 'text'), true));
  }),
  test('model input policy: VEO3 reference mode keeps generic 3 image inputs', () => {
    const targetInputPolicy15 = getTargetInputPolicy({
      id: 'veo3-reference',
      type: 'ai-video',
      model: 'apimart/veo3-fast',
      provider: 'apimart',
      generationParams: { mode: 'fast', generation_type: 'reference' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy15, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy15, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy15, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy15, 'audio'), false),
      assert.equal(targetInputPolicy15.maxByKind.image, 3));
  }),
  test('model input policy: Vidu Q3 media inputs follow generation mode', () => {
    const args6 = { id: 'vidu-q3', type: 'ai-video', model: 'apimart/viduq3', provider: 'apimart' },
      targetInputPolicy16 = getTargetInputPolicy(args6);
    (assert.equal(isInputKindAllowed(targetInputPolicy16, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy16, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy16, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy16, 'audio'), false),
      assert.equal(targetInputPolicy16.maxByKind.image, 2));
    const targetInputPolicy17 = getTargetInputPolicy({
      ...args6,
      generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy17, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy17, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy17, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy17, 'audio'), false),
      assert.equal(targetInputPolicy17.maxByKind.image, 7));
  }),
  test('model input policy: Grok Imagine uses manifest image-only limit', () => {
    const targetInputPolicy18 = getTargetInputPolicy({
      id: 'grok-imagine',
      type: 'ai-video',
      model: 'apimart/grok-imagine-1.0',
      provider: 'apimart',
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy18, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy18, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy18, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy18, 'audio'), false),
      assert.equal(targetInputPolicy18.maxByKind.image, 7));
  }),
  test('model input policy: Gemini Omni Flash uses manifest image and video limits', () => {
    const targetInputPolicy19 = getTargetInputPolicy({
      id: 'omni-flash',
      type: 'ai-video',
      model: 'apimart/omni-flash-ext',
      provider: 'apimart',
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy19, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy19, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy19, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy19, 'audio'), false),
      assert.equal(targetInputPolicy19.maxByKind.image, 3),
      assert.equal(targetInputPolicy19.maxByKind.video, 1));
  }),
  test('model input policy: Wan2.7 media inputs follow image/video mode', () => {
    const args7 = { id: 'wan27', type: 'ai-video', model: 'apimart/wan2.7', provider: 'apimart' },
      targetInputPolicy20 = getTargetInputPolicy(args7);
    (assert.equal(isInputKindAllowed(targetInputPolicy20, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy20, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy20, 'audio'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy20, 'video'), false),
      assert.equal(targetInputPolicy20.maxByKind.image, 2),
      assert.equal(targetInputPolicy20.maxByKind.audio, 1));
    const targetInputPolicy21 = getTargetInputPolicy({ ...args7, generationParams: { wan27_mode: 'video' } });
    (assert.equal(isInputKindAllowed(targetInputPolicy21, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy21, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy21, 'image'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy21, 'audio'), false),
      assert.equal(targetInputPolicy21.maxByKind.video, 1));
    const targetInputPolicy22 = getTargetInputPolicy({
      ...args7,
      model: 'wan2.7',
      generationParams: { wan27_mode: 'video' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy22, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy22, 'image'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy22, 'audio'), false));
    const targetInputPolicy23 = getTargetInputPolicy({
      ...args7,
      generationParams: { wan27_mode: 'reference' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy23, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy23, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy23, 'audio'), true),
      assert.equal(targetInputPolicy23.maxByKind.image, 1),
      assert.equal(targetInputPolicy23.maxByKind.video, 1),
      assert.equal(targetInputPolicy23.maxByKind.audio, 1));
    const targetInputPolicy24 = getTargetInputPolicy({ ...args7, generationParams: { wan27_mode: 'edit' } });
    (assert.equal(isInputKindAllowed(targetInputPolicy24, 'image'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy24, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy24, 'audio'), false),
      assert.equal(targetInputPolicy24.maxByKind.image, 0),
      assert.equal(targetInputPolicy24.maxByKind.video, 2));
    const targetInputPolicy25 = getTargetInputPolicy({
      ...args7,
      provider: 'apimartr',
      generationParams: { wan27_mode: 'video' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy25, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy25, 'image'), false));
  }),
  test('model input policy: Kling V3 Omni media inputs follow selected mode', () => {
    const args8 = {
        id: 'kling-omni',
        type: 'ai-video',
        model: 'apimart/kling-v3-omni',
        provider: 'apimart',
      },
      targetInputPolicy26 = getTargetInputPolicy(args8);
    (assert.equal(isInputKindAllowed(targetInputPolicy26, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy26, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy26, 'video'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy26, 'audio'), false),
      assert.equal(targetInputPolicy26.maxByKind.image, 2));
    const targetInputPolicy27 = getTargetInputPolicy({
      ...args8,
      generationParams: { kling_v3_omni_mode: 'reference' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy27, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy27, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy27, 'audio'), false),
      assert.equal(targetInputPolicy27.maxByKind.image, 1),
      assert.equal(targetInputPolicy27.maxByKind.video, 1));
    const targetInputPolicy28 = getTargetInputPolicy({
      ...args8,
      generationParams: { kling_v3_omni_mode: 'edit' },
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy28, 'image'), false),
      assert.equal(isInputKindAllowed(targetInputPolicy28, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy28, 'audio'), false),
      assert.equal(targetInputPolicy28.maxByKind.video, 1));
  }),
  test('model input policy: Kling O1 uses manifest image and video limits', () => {
    const targetInputPolicy29 = getTargetInputPolicy({
      id: 'kling-o1',
      type: 'ai-video',
      model: 'apimart/kling-video-o1',
      provider: 'apimart',
    });
    (assert.equal(isInputKindAllowed(targetInputPolicy29, 'text'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy29, 'image'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy29, 'video'), true),
      assert.equal(isInputKindAllowed(targetInputPolicy29, 'audio'), false),
      assert.equal(targetInputPolicy29.maxByKind.image, 2),
      assert.equal(targetInputPolicy29.maxByKind.video, 1));
  }));
