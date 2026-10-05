import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_FPS_30_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from '../../shared/runningHubVideoManifestShared.js';
export const RH_VIDEO_WATERMARK_REMOVAL_V2_MODEL_ID = 'runninghub/2060613773890768898';
export const RH_VIDEO_WATERMARK_REMOVAL_V2_EXECUTION_ID = 'runninghub.workflow.video-watermark-removal-v2.v1';
const RH_VIDEO_WATERMARK_REMOVAL_V2_MODE_DESCRIPTION = [
  '模式1 - 首帧不能有字幕，部分情况下会掉质，大转场有时候会自己乱补充内容，但去除动态水印效果比二要好非常多',
  '模式2 - 适合只去除影视片段比较固定区域的字幕，原视频质量保留较好，不适合带水印去',
  '遮罩参考只有在模式2时才能使用',
].join('\n');
export const RH_VIDEO_WATERMARK_REMOVAL_V2_HELP_TOOLTIP = [
  '视频去字幕V2用法',
  '接入 [[red:源视频]]，固定只允许一个视频入参',
  '模式1适合动态水印，但首帧不能有字幕，部分情况下会掉质',
  '模式2适合影视片段固定区域字幕，原视频质量保留较好',
].join('\n');
const RH_VIDEO_WATERMARK_REMOVAL_V2_RESOLUTION_FIELD = Object.freeze({
    ...RH_VIDEO_RESOLUTION_FIELD,
    defaultValue: 960,
    showHighResolutionOptions: true,
    options: Object.freeze([832, 960, 1024, 1280, 1440, 1600, 1920]),
  }),
  RH_VIDEO_WATERMARK_REMOVAL_V2_FRAMES_FIELD = Object.freeze({
    id: 'rhVideoFrames',
    type: 'stepper',
    placement: 'videoParams',
    label: '帧数',
    defaultValue: 0,
    min: 0,
    max: 0xf423f,
  });
export const rhVideoWatermarkRemovalV2ModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_WATERMARK_REMOVAL_V2_MODEL_ID,
  executionId: RH_VIDEO_WATERMARK_REMOVAL_V2_EXECUTION_ID,
  displayName: '视频去字幕V2',
  description: '固定一个源视频入参的视频去字幕工作流',
  prompt: Object.freeze({ visible: false }),
  help: Object.freeze({ tooltip: RH_VIDEO_WATERMARK_REMOVAL_V2_HELP_TOOLTIP }),
  extensions: Object.freeze({
    videoParameterPanel: Object.freeze({
      sourceFrameCountFps: 'v54',
      frameStateDefaults: Object.freeze({ frameRate: 24, frameCount: 0 }),
      submitScopeTargetEdges: true,
      adaptiveRatio: Object.freeze({
        scopeTargetEdges: true,
        preferSlot: 'sourceVideo',
        preferVideoKind: true,
      }),
    }),
  }),
  fixedAssetSlots: ['sourceVideo', 'maskImage'],
  inputSlots: {
    allowedKinds: ['video', 'image'],
    minByKind: { video: 1 },
    maxByKind: { text: 0, image: 1, video: 1, audio: 0 },
    fixedSlots: Object.freeze([
      Object.freeze({ id: 'sourceVideo', kind: 'video', label: '源视频', required: true }),
      Object.freeze({
        id: 'maskImage',
        kind: 'image',
        label: '遮罩参考',
        required: false,
        requiresMask: true,
        showWhen: Object.freeze({ field: 'rhWatermarkRemoveMode', value: 'mode2' }),
      }),
    ]),
  },
  uiFields: [
    RH_VIDEO_WATERMARK_REMOVAL_V2_RESOLUTION_FIELD,
    RH_VIDEO_FPS_30_FIELD,
    RH_VIDEO_WATERMARK_REMOVAL_V2_FRAMES_FIELD,
    Object.freeze({
      id: 'rhWatermarkRemoveMode',
      type: 'segmented',
      placement: 'videoAdvanced',
      variant: 'advancedRow',
      label: '模式选择',
      defaultValue: 'mode1',
      description: RH_VIDEO_WATERMARK_REMOVAL_V2_MODE_DESCRIPTION,
      options: Object.freeze([
        Object.freeze({ value: 'mode1', label: '模式1' }),
        Object.freeze({ value: 'mode2', label: '模式2' }),
      ]),
    }),
    Object.freeze({
      id: 'rhRemoveWatermark',
      type: 'segmented',
      placement: 'videoAdvanced',
      variant: 'advancedRow',
      label: '是否去水印',
      defaultValue: false,
      options: Object.freeze([
        Object.freeze({ value: true, label: '是' }),
        Object.freeze({ value: false, label: '否' }),
      ]),
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoWatermarkRemovalV2ExecutionManifest = createRunningHubVideoExecutionManifest({
  id: RH_VIDEO_WATERMARK_REMOVAL_V2_EXECUTION_ID,
  label: '视频去字幕V2',
  workflowId: '2060613773890768898',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  mapping: {
    nodeInfoList: Object.freeze([
      Object.freeze({
        nodeId: '1',
        fieldName: 'video',
        source: 'videoInput',
        required: true,
        description: '视频',
        missingMessage: '请接入一个视频输入',
        uploadFailedMessage: '源视频上传失败',
      }),
      Object.freeze({
        nodeId: '134',
        fieldName: 'value',
        source: 'param',
        fields: Object.freeze(['generationParams.rhWatermarkRemoveMode', 'rhWatermarkRemoveMode']),
        defaultValue: 'mode1',
        valueMap: Object.freeze({ mode1: '0', 模式1: '0', mode2: '1', 模式2: '1' }),
        description: '模式',
      }),
      Object.freeze({
        nodeId: '1',
        fieldName: 'frame_load_cap',
        source: 'param',
        fields: Object.freeze(['rhVideoFrames', 'frameCount']),
        defaultValue: 0,
        transform: Object.freeze({ name: 'integer', min: 0 }),
        description: '帧数',
      }),
      Object.freeze({
        nodeId: '85',
        fieldName: 'value',
        source: 'param',
        fields: Object.freeze(['rhVideoFps', 'frameRate']),
        defaultValue: 24,
        transform: 'normalizeRhVideoFps',
        description: '帧率',
      }),
      Object.freeze({
        nodeId: '31',
        fieldName: 'value',
        source: 'param',
        field: 'rhVideoResolution',
        defaultValue: 960,
        transform: Object.freeze({ name: 'normalizeRhVideoResolution', fallback: 960 }),
        description: '分辨率',
      }),
      Object.freeze({
        nodeId: '144',
        fieldName: 'value',
        source: 'param',
        fields: Object.freeze(['generationParams.rhRemoveWatermark', 'rhRemoveWatermark']),
        defaultValue: false,
        transform: 'booleanString',
        description: '是否去水印',
      }),
      Object.freeze({
        nodeId: '326',
        fieldName: 'index',
        source: 'constant',
        value: '1',
        when: Object.freeze({ field: 'maskImageDataUrl', exists: true }),
      }),
      Object.freeze({
        nodeId: '329',
        fieldName: 'image',
        source: 'imageInput',
        field: 'maskImageDataUrl',
        compress: false,
        description: '手动遮罩（默认不用动）',
      }),
    ]),
  },
});
