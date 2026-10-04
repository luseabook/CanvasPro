import {
  RH_INSTANCE_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from '../../shared/runningHubVideoManifestShared.js';
export const RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_MODEL_ID = 'runninghub/2092941359513694209';
export const RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_EXECUTION_ID =
  'runninghub.workflow.video-hailuo-h3-audio-driven.v1';
const RH_HAILUO_H3_AUDIO_DRIVEN_ACCELERATION_FIELD_ID = 'rhHailuoH3AudioDrivenAcceleration',
  RH_HAILUO_H3_AUDIO_DRIVEN_QUALITY_FIELD_ID = 'rhHailuoH3Quality',
  RH_HAILUO_H3_AUDIO_DRIVEN_ASPECT_RATIO_OPTIONS = Object['freeze']([
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
  ]),
  RH_HAILUO_H3_AUDIO_DRIVEN_QUALITY_OPTIONS = Object['freeze']([
    Object['freeze']({ value: 'draft', label: '草稿' }),
    Object['freeze']({ value: 'economy', label: '经济' }),
    Object['freeze']({ value: 'standard', label: '标准' }),
    Object['freeze']({ value: 'high', label: '高清' }),
    Object['freeze']({ value: 'ultra', label: '超清' }),
  ]),
  RH_HAILUO_H3_AUDIO_DRIVEN_DESCRIPTION =
    '玩法\x201：音频+提示词生成视频；玩法\x202：音频+图像生成对口型视频；玩法\x203：音频+视频生成指定人物说话视频；玩法\x204：音频+图像+视频，生成音频驱动图像对口型并根据视频人物姿势。',
  RH_HAILUO_H3_AUDIO_DRIVEN_HELP_TOOLTIP = [
    '海螺H3音频驱动用法',
    '[[red:玩法 1]]：音频 + 提示词，生成视频。',
    '[[red:玩法\x202]]：音频\x20+\x20图像，生成图像对口型视频。',
    '[[red:玩法 3]]：音频 + 视频，生成指定人物说话视频。',
    '[[red:玩法 4]]：音频 + 图像 + 视频，驱动图像对口型并跟随视频人物姿势。',
    '生成时长：根据音频时长决定。',
  ]['join']('\x0a'),
  RH_HAILUO_H3_AUDIO_DRIVEN_FIXED_INPUT_SLOTS = Object['freeze']([
    Object['freeze']({
      id: 'audio',
      kind: 'audio',
      label: '音频参考',
      description: '必填，只允许\x201\x20个音频参考',
      displayOrder: 0xa,
      required: !![],
    }),
  ]);
export const rhVideoHailuoH3AudioDrivenModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_MODEL_ID,
  executionId: RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_EXECUTION_ID,
  displayName: '海螺H3音频驱动',
  description: RH_HAILUO_H3_AUDIO_DRIVEN_DESCRIPTION,
  vip: !![],
  help: Object['freeze']({ tooltip: RH_HAILUO_H3_AUDIO_DRIVEN_HELP_TOOLTIP }),
  prompt: Object['freeze']({ emptyPolicy: 'allow', placeholder: '可选：描述人物、动作、镜头或画面要求。' }),
  extensions: Object['freeze']({
    providerProfiles: Object['freeze'](['runninghub', 'runninghub-international']),
  }),
  fixedAssetSlots: ['audio'],
  inputSlots: {
    allowedKinds: ['text', 'image', 'video', 'audio'],
    minByKind: { audio: 0x1 },
    maxByKind: { image: 0x4, video: 0x1, audio: 0x1 },
    displayAspectRatioSource: Object['freeze']({ kind: 'video', fallbackIndex: 0x0 }),
    fixedSlots: RH_HAILUO_H3_AUDIO_DRIVEN_FIXED_INPUT_SLOTS,
  },
  uiFields: [
    Object['freeze']({
      id: RH_HAILUO_H3_AUDIO_DRIVEN_QUALITY_FIELD_ID,
      displayRole: 'resolution',
      type: 'segmented',
      placement: 'resolution',
      label: '清晰度',
      description:
        '清晰度档位主要控制生成尺寸：草稿长边约 608 像素，经济约 960，标准约 1376，高清约 1664，超清约 1920。实际宽高会按所选比例计算，并对齐到 32 的倍数。',
      showInfoTip: !![],
      defaultValue: 'economy',
      qualityRatioLabelOrder: 'fieldFirst',
      options: RH_HAILUO_H3_AUDIO_DRIVEN_QUALITY_OPTIONS,
    }),
    Object['freeze']({
      id: 'aspectRatio',
      displayRole: 'aspectRatio',
      type: 'segmented',
      placement: 'resolution',
      label: '比例',
      defaultValue: '自适应',
      options: RH_HAILUO_H3_AUDIO_DRIVEN_ASPECT_RATIO_OPTIONS,
    }),
    Object['freeze']({
      id: RH_HAILUO_H3_AUDIO_DRIVEN_ACCELERATION_FIELD_ID,
      type: 'select',
      placement: 'videoAdvanced',
      variant: 'advancedRow',
      label: '加速方案',
      defaultValue: 'none',
      options: Object['freeze']([
        Object['freeze']({ value: 'none', label: '无' }),
        Object['freeze']({ value: 'turbo', label: 'turbo' }),
      ]),
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoHailuoH3AudioDrivenExecutionManifest = createRunningHubVideoExecutionManifest({
  id: RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_EXECUTION_ID,
  label: '海螺H3音频驱动',
  workflowId: '2092941359513694209',
  submitMode: 'runninghub-task-create',
  queryMode: 'runninghubwf-query',
  extensions: Object['freeze']({
    providerProfileBindings: Object['freeze']({
      'runninghub-international': Object['freeze']({ workflowId: '2093687111078051842' }),
    }),
    payloadResolver: 'runninghubHailuoH3AudioDriven',
    collectMediaInputs: !![],
    taskCreate: Object['freeze']({ retainSeconds: 0x3c }),
  }),
  mapping: {
    promptNode: Object['freeze']({ nodeId: '59', fieldName: 'value' }),
    widthNode: Object['freeze']({ nodeId: '355', fieldName: 'value' }),
    heightNode: Object['freeze']({ nodeId: '356', fieldName: 'value' }),
    accelerationNode: Object['freeze']({
      nodeId: '195',
      fieldName: 'value',
      field: RH_HAILUO_H3_AUDIO_DRIVEN_ACCELERATION_FIELD_ID,
      defaultValue: '0',
      valueMap: Object['freeze']({ none: '0', turbo: '1' }),
    }),
    qualityLongEdges: Object['freeze']({
      draft: 0x260,
      economy: 0x3c0,
      standard: 0x560,
      high: 0x680,
      ultra: 0x780,
    }),
    defaultQuality: 'economy',
    defaultAspectRatio: '自适应',
    dimensionMultiple: 0x20,
    imageLoaderNodes: Object['freeze'](
      ['60', '72', '128', '129']['map']((nodeId) => Object['freeze']({ nodeId: nodeId, fieldName: 'image' })),
    ),
    videoLoaderNodes: Object['freeze']([Object['freeze']({ nodeId: '68', fieldName: 'video' })]),
    audioLoaderNodes: Object['freeze']([Object['freeze']({ nodeId: '336', fieldName: 'audio' })]),
    referenceLimits: Object['freeze']({ image: 0x4, video: 0x1, audio: 0x1 }),
    referenceNode: Object['freeze']({
      nodeId: '121',
      imageFieldPrefix: 'ref_images.ref_image_',
      videoFieldPrefix: 'ref_videos.ref_video_',
      audioFieldPrefix: 'ref_audios.ref_audio_',
    }),
  },
});
