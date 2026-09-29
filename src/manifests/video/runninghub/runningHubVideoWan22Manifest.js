import {
  RH_INSTANCE_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from '../../shared/runningHubVideoManifestShared.js';
export const RH_VIDEO_WAN22_MODEL_ID = 'runninghub/2073678184750604289';
export const RH_VIDEO_WAN22_EXECUTION_ID = 'runninghub.workflow.video-wan22.v1';
const RH_WAN22_ASPECT_RATIO_OPTIONS = Object['freeze']([
  Object['freeze']({ value: '自适应', label: '自适应' }),
  Object['freeze']({ value: '1:1', label: '1:1' }),
  Object['freeze']({ value: '16:9', label: '16:9' }),
  Object['freeze']({ value: '9:16', label: '9:16' }),
  Object['freeze']({ value: '4:3', label: '4:3' }),
  Object['freeze']({ value: '3:4', label: '3:4' }),
  Object['freeze']({ value: '3:2', label: '3:2' }),
  Object['freeze']({ value: '2:3', label: '2:3' }),
  Object['freeze']({ value: '21:9', label: '21:9' }),
  Object['freeze']({ value: '9:21', label: '9:21' }),
  Object['freeze']({ value: '5:4', label: '5:4' }),
  Object['freeze']({ value: '4:5', label: '4:5' }),
  Object['freeze']({ value: '2:1', label: '2:1' }),
  Object['freeze']({ value: '1:2', label: '1:2' }),
]);
export const RH_VIDEO_WAN22_HELP_TOOLTIP = [
  'Wan2.2\x20视频模型用法',
  '不接图时为文生视频；接入首帧时为图生视频；同时接入首帧和尾帧时为首尾帧视频。',
  '分辨率用于选择清晰度，比例用于选择横屏、竖屏或方形画面。',
]['join']('\x0a');
export const rhVideoWan22ModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_WAN22_MODEL_ID,
  executionId: RH_VIDEO_WAN22_EXECUTION_ID,
  displayName: 'Wan2.2 视频模型',
  description: '支持文生视频、首帧图生视频和首尾帧视频的 RunningHub 工作流',
  help: Object['freeze']({ tooltip: RH_VIDEO_WAN22_HELP_TOOLTIP }),
  fixedAssetSlots: ['firstFrame', 'lastFrame'],
  inputSlots: {
    allowedKinds: ['text', 'image'],
    minByKind: { image: 0x0 },
    maxByKind: { image: 0x2 },
    displayAspectRatioSource: Object['freeze']({
      slots: Object['freeze'](['firstFrame', 'lastFrame']),
      fallbackIndex: 0x0,
    }),
    fixedSlots: Object['freeze']([
      Object['freeze']({ id: 'firstFrame', kind: 'image', label: '首帧', required: ![], displayOrder: 0x0 }),
      Object['freeze']({ id: 'lastFrame', kind: 'image', label: '尾帧', required: ![], displayOrder: 0x1 }),
    ]),
  },
  uiFields: [
    Object['freeze']({
      id: 'rhVideoResolution',
      type: 'segmented',
      placement: 'videoParams',
      displayRole: 'resolution',
      label: '分辨率',
      defaultValue: 0x340,
      options: Object['freeze']([
        Object['freeze']({ value: 0x340, label: '832' }),
        Object['freeze']({ value: 0x400, label: '1024' }),
        Object['freeze']({ value: 0x500, label: '1280' }),
        Object['freeze']({ value: 0x5a0, label: '1440' }),
      ]),
    }),
    Object['freeze']({
      id: 'rhWan22AspectRatio',
      type: 'segmented',
      placement: 'videoParams',
      displayRole: 'aspectRatio',
      label: '比例',
      defaultValue: '自适应',
      options: RH_WAN22_ASPECT_RATIO_OPTIONS,
    }),
    Object['freeze']({
      id: 'rhVideoFrames',
      type: 'stepper',
      placement: 'videoParams',
      label: '帧数',
      defaultValue: 0x51,
      min: 0x1,
      max: 0xf423f,
      step: 0x1,
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoWan22ExecutionManifest = createRunningHubVideoExecutionManifest({
  id: RH_VIDEO_WAN22_EXECUTION_ID,
  label: 'Wan2.2\x20视频模型',
  workflowId: '2073678184750604289',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  extensions: Object['freeze']({ payloadResolver: 'runninghubWan22Video' }),
  mapping: {
    firstFrameNode: Object['freeze']({ nodeId: '158', fieldName: 'image', description: '首帧' }),
    lastFrameNode: Object['freeze']({ nodeId: '224', fieldName: 'image', description: '尾帧' }),
    modeNode: Object['freeze']({
      nodeId: '260',
      fieldName: 'value',
      description: '文生视频0 图生视频1 首尾帧2',
    }),
    widthNode: Object['freeze']({ nodeId: '160', fieldName: 'value', description: '宽度' }),
    heightNode: Object['freeze']({ nodeId: '161', fieldName: 'value', description: '高度' }),
    framesNode: Object['freeze']({
      nodeId: '162',
      fieldName: 'value',
      defaultValue: 0x51,
      description: '帧数',
    }),
    promptNode: Object['freeze']({ nodeId: '159', fieldName: 'value', description: '提示词' }),
  },
});
