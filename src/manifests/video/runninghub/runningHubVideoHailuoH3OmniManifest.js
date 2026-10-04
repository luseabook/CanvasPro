import {
  RH_INSTANCE_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from '../../shared/runningHubVideoManifestShared.js';
export const RH_VIDEO_HAILUO_H3_OMNI_MODEL_ID = 'runninghub/2084286867645755393';
export const RH_VIDEO_HAILUO_H3_OMNI_EXECUTION_ID = 'runninghub.workflow.video-hailuo-h3-omni.v1';
const RH_HAILUO_H3_MODE_FIELD_ID = 'rh_hailuo_h3_mode',
  RH_HAILUO_H3_QUALITY_FIELD_ID = 'rhHailuoH3Quality',
  RH_HAILUO_H3_ACCELERATION_FIELD_ID = 'rhHailuoH3Acceleration',
  RH_HAILUO_H3_REFERENCE_MODEL_FIELD_ID = 'rhHailuoH3ReferenceModel',
  RH_HAILUO_H3_ASPECT_RATIO_OPTIONS = Object['freeze']([
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
  RH_HAILUO_H3_QUALITY_OPTIONS = Object['freeze']([
    Object['freeze']({ value: 'draft', label: '草稿' }),
    Object['freeze']({ value: 'economy', label: '经济' }),
    Object['freeze']({ value: 'standard', label: '标准' }),
    Object['freeze']({ value: 'high', label: '高清' }),
    Object['freeze']({ value: 'ultra', label: '超清' }),
  ]),
  RH_HAILUO_H3_DURATION_OPTIONS = Object['freeze'](
    Array['from']({ length: 0xd }, (value, item) => {
      const value2 = item + 0x3;
      return Object['freeze']({ value: value2, label: value2 + 's', displayLabel: value2 + 'S' });
    }),
  );
function createModeSlot({
  id: id,
  kind: kind,
  label: label,
  mode: mode,
  description: description,
  displayOrder: displayOrder,
}) {
  return Object['freeze']({
    id: id,
    kind: kind,
    label: label,
    description: description,
    displayOrder: displayOrder,
    required: ![],
    showWhen: Object['freeze']({ field: RH_HAILUO_H3_MODE_FIELD_ID, value: mode }),
  });
}
const RH_HAILUO_H3_FIXED_INPUT_SLOTS = Object['freeze']([
    createModeSlot({
      id: 'firstFrame',
      kind: 'image',
      label: '首帧',
      mode: 'frames',
      description: '可选；不接图片时自动使用文生视频',
      displayOrder: 0xa,
    }),
    createModeSlot({
      id: 'lastFrame',
      kind: 'image',
      label: '尾帧',
      mode: 'frames',
      description: '可选；可单独接入尾帧，也可与首帧配合',
      displayOrder: 0x14,
    }),
  ]),
  RH_HAILUO_H3_INPUT_POLICY_VARIANTS = Object['freeze']([
    Object['freeze']({
      when: Object['freeze']({ field: RH_HAILUO_H3_MODE_FIELD_ID, value: 'frames' }),
      allowedKinds: Object['freeze'](['text', 'image']),
      maxByKind: Object['freeze']({ image: 0x2, video: 0x0, audio: 0x0 }),
    }),
  ]);
export const RH_VIDEO_HAILUO_H3_OMNI_HELP_TOOLTIP = [
  '海螺H3 全能版用法',
  '首尾帧：不接图片时为文生视频；可单独接首帧或尾帧，也可同时接入。',
  '全能参考：至少接入一种素材，最多支持 9 张图片、3 个视频和 3 个音频；支持仅音频搭配提示词。',
  '清晰度决定长边尺寸，比例决定横竖构图，最终宽高会对齐到 32 的倍数。',
]['join']('\x0a');
export const rhVideoHailuoH3OmniModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_HAILUO_H3_OMNI_MODEL_ID,
  executionId: RH_VIDEO_HAILUO_H3_OMNI_EXECUTION_ID,
  displayName: '海螺H3 全能版',
  description: '支持文生、首尾帧及图片/视频/音频全能参考的海螺 H3 工作流',
  help: Object['freeze']({ tooltip: RH_VIDEO_HAILUO_H3_OMNI_HELP_TOOLTIP }),
  prompt: Object['freeze']({ placeholder: '描述主体动作、镜头运动、画面风格及参考素材之间的关系。' }),
  extensions: Object['freeze']({ storyWorkspace: Object['freeze']({ promptMode: 'minimax-h3' }) }),
  fixedAssetSlots: ['firstFrame', 'lastFrame'],
  inputSlots: {
    allowedKinds: ['text', 'image', 'video', 'audio'],
    minByKind: {},
    maxByKind: { image: 0x9, video: 0x3, audio: 0x3 },
    displayAspectRatioSource: Object['freeze']({
      kind: 'image',
      slots: Object['freeze'](['firstFrame', 'lastFrame']),
      fallbackIndex: 0x0,
    }),
    fixedSlots: RH_HAILUO_H3_FIXED_INPUT_SLOTS,
    cycleFixedInputWhenFull: !![],
    policyVariants: RH_HAILUO_H3_INPUT_POLICY_VARIANTS,
  },
  uiFields: [
    Object['freeze']({
      id: RH_HAILUO_H3_MODE_FIELD_ID,
      type: 'segmented',
      placement: 'mode',
      variant: 'sectionMenu',
      label: '模式选择',
      defaultValue: 'frames',
      options: Object['freeze']([
        Object['freeze']({ value: 'frames', label: '首尾帧' }),
        Object['freeze']({ value: 'reference', label: '全能参考' }),
      ]),
    }),
    Object['freeze']({
      id: RH_HAILUO_H3_QUALITY_FIELD_ID,
      displayRole: 'resolution',
      type: 'segmented',
      placement: 'resolution',
      label: '清晰度',
      description:
        '清晰度档位主要控制生成尺寸：草稿长边约 608 像素，经济约 960，标准约 1376，高清约 1664，超清约 1920。实际宽高会按所选比例计算，并对齐到 32 的倍数。',
      showInfoTip: !![],
      defaultValue: 'economy',
      qualityRatioLabelOrder: 'fieldFirst',
      options: RH_HAILUO_H3_QUALITY_OPTIONS,
    }),
    Object['freeze']({
      id: 'aspectRatio',
      displayRole: 'aspectRatio',
      type: 'segmented',
      placement: 'resolution',
      label: '比例',
      defaultValue: '自适应',
      options: RH_HAILUO_H3_ASPECT_RATIO_OPTIONS,
    }),
    Object['freeze']({
      id: 'duration',
      type: 'slider',
      placement: 'resolution',
      variant: 'durationPill',
      label: '视频时长',
      defaultValue: 0x5,
      min: 0x3,
      max: 0xf,
      step: 0x1,
      options: RH_HAILUO_H3_DURATION_OPTIONS,
    }),
    Object['freeze']({
      id: RH_HAILUO_H3_ACCELERATION_FIELD_ID,
      type: 'select',
      placement: 'videoAdvanced',
      variant: 'advancedRow',
      label: '加速方案',
      defaultValue: 'turbo',
      options: Object['freeze']([
        Object['freeze']({ value: 'none', label: '无' }),
        Object['freeze']({ value: 'turbo', label: 'turbo' }),
        Object['freeze']({ value: 'fourStepLora', label: '4步LORA' }),
      ]),
    }),
    Object['freeze']({
      id: RH_HAILUO_H3_REFERENCE_MODEL_FIELD_ID,
      type: 'select',
      placement: 'videoAdvanced',
      variant: 'advancedRow',
      label: '多参考模型',
      defaultValue: 'ref2',
      showWhen: Object['freeze']({ field: RH_HAILUO_H3_MODE_FIELD_ID, value: 'reference' }),
      options: Object['freeze']([
        Object['freeze']({ value: 'ref2', label: 'ref2' }),
        Object['freeze']({ value: 'fl2', label: 'fl2' }),
      ]),
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoHailuoH3OmniExecutionManifest = createRunningHubVideoExecutionManifest({
  id: RH_VIDEO_HAILUO_H3_OMNI_EXECUTION_ID,
  label: '海螺H3\x20全能版',
  workflowId: '2084286867645755393',
  submitMode: 'runninghub-task-create',
  queryMode: 'runninghubwf-query',
  extensions: Object['freeze']({
    providerProfileBindings: Object['freeze']({
      'runninghub-international': Object['freeze']({ workflowId: '2084270101859258369' }),
    }),
    payloadResolver: 'runninghubHailuoH3Omni',
    collectMediaInputs: !![],
    taskCreate: Object['freeze']({ retainSeconds: 0x3c }),
  }),
  mapping: {
    promptNode: Object['freeze']({ nodeId: '59', fieldName: 'value' }),
    modeNode: Object['freeze']({
      nodeId: '189',
      fieldName: 'value',
      textValue: '0',
      frameValue: '1',
      referenceValue: '2',
      referenceModelField: RH_HAILUO_H3_REFERENCE_MODEL_FIELD_ID,
      referenceModelDefaultValue: 'ref2',
      referenceValueMap: Object['freeze']({ ref2: '2', fl2: '3' }),
    }),
    secondsNode: Object['freeze']({
      nodeId: '14',
      fieldName: 'value',
      defaultValue: 0x5,
      min: 0x3,
      max: 0xf,
    }),
    widthNode: Object['freeze']({ nodeId: '46', fieldName: 'value' }),
    heightNode: Object['freeze']({ nodeId: '78', fieldName: 'value' }),
    accelerationNode: Object['freeze']({
      nodeId: '195',
      fieldName: 'value',
      field: RH_HAILUO_H3_ACCELERATION_FIELD_ID,
      defaultValue: '1',
      valueMap: Object['freeze']({ none: '0', turbo: '1', fourStepLora: '2' }),
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
      ['60', '72', '128', '129', '164', '165', '178', '179', '180']['map']((nodeId) =>
        Object['freeze']({ nodeId: nodeId, fieldName: 'image' }),
      ),
    ),
    videoLoaderNodes: Object['freeze'](
      ['68', '158', '161']['map']((nodeId2) => Object['freeze']({ nodeId: nodeId2, fieldName: 'video' })),
    ),
    audioLoaderNodes: Object['freeze'](
      ['133', '139', '155']['map']((nodeId3) => Object['freeze']({ nodeId: nodeId3, fieldName: 'audio' })),
    ),
    firstLastFrameNode: Object['freeze']({
      nodeId: '120',
      firstFieldName: 'first_frame',
      lastFieldName: 'last_frame',
    }),
    referenceNode: Object['freeze']({
      nodeId: '121',
      imageFieldPrefix: 'ref_images.ref_image_',
      videoFieldPrefix: 'ref_videos.ref_video_',
      videoAudioFieldPrefix: 'ref_video_audios.ref_video_audio_',
      audioFieldPrefix: 'ref_audios.ref_audio_',
    }),
  },
});
