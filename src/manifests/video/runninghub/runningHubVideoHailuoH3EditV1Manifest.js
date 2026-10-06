import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_FPS_30_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from '../../shared/runningHubVideoManifestShared.js';
export const RH_VIDEO_HAILUO_H3_EDIT_V1_MODEL_ID = 'runninghub/2091090228656680961';
export const RH_VIDEO_HAILUO_H3_EDIT_V1_EXECUTION_ID = 'runninghub.workflow.video-hailuo-h3-edit-v1.v1';
export const RH_VIDEO_HAILUO_H3_EDIT_V1_DEFAULT_PROMPT =
  'subject_definitions:\n\n<Subject 1> 是替换后出现在成片中的主角。其完整视觉身份仅来自 <Picture 1>，包括面部身份、五官结构、脸型、肤色与皮肤细节、发型、体型比例、服装和配饰。<Subject 1> 的动作表演、姿态、表情变化、视线方向、身体运动、移动轨迹及动作节奏来自 <Video 1> 中的原主角。\n\n<Video 1> 是本次人物替换所使用的源视频。它提供原有场景、背景、构图、景别、镜头运动、剪辑、时序、光影、物体位置、人物互动及原主角的完整动作轨迹，但不提供最终主角的视觉身份。\n\nsummary:\n\n[video editing + reference generation] 目标视频是 <Video 1> 的人物替换编辑版本。从原主角首次出现的画面开始，直到其最后一次出现，必须将原主角完整替换为 <Subject 1>。整段视频必须持续执行替换。保留原视频的动作表演、场景和其他非人物内容，彻底移除原主角的视觉身份。\n\nretention_analysis:\n\n<Subject 1>（出现在整段目标视频中）：fully_preserved - 在所有镜头、角度和画面中，完整保留 <Picture 1> 提供的面部身份、五官结构、发型、体型比例、服装、配饰和整体可识别特征，人物身份全程稳定一致。\n\n<Video 1>（整段源视频结构）：partially_preserved - 保留原视频的场景、背景、构图、景别、镜头运动、剪辑时间、光影、道具、互动、姿势、表情运动、肢体动作和移动轨迹。唯一需要改变的视觉内容，是将原主角完整替换成 <Subject 1>；不得保留原主角的身份特征。\n\ndetailed_description:\n\n目标视频是对 <Video 1> 进行精确的人物身份替换，不是重新演绎，也不是重新生成一个相似场景。\n\n[Shot 1] 从 <Video 1> 的第一帧开始，只要原主角出现在画面中，就必须将其完整替换为 <Subject 1>。<Subject 1> 必须占据原主角完全相同的位置、尺寸、景深层级、身体朝向和画面空间，并逐帧复现原主角的表演。\n\n严格保留 <Video 1> 中原主角的头部转动、表情变化、眼神方向、口型运动、手势、肢体动作、行走路线、人物互动和动作节奏，但人物的面部身份、发型、体型、服装和配饰必须始终来自 <Picture 1>。\n\n当人物出现侧脸、背身、低头、转身、快速移动、表情变化、局部遮挡、运动模糊、远景或接近镜头的情况时，仍必须保持 <Subject 1> 的身份清晰、可识别且前后一致。根据 <Picture 1> 自然补全未展示的角度，任何时候都不得恢复成 <Video 1> 中的原主角。\n\n严格保留 <Video 1> 原有的镜头切换、运镜、构图、透视、景深、环境、光影变化、阴影、运动模糊、背景元素、道具和人物互动。让 <Subject 1> 自然适配原视频中的透视、遮挡、光照、阴影和运动模糊。\n\n任何一帧都不得出现原主角的面部、发型或身份特征。不得在两个身份之间切换，不得产生人物融合、换脸闪烁、双脸、重影、额外人物、五官漂移、肢体畸变或服装突变。整段视频中，原主角所在的位置只能出现 <Subject 1>。\n\noverall_soundscape:\n\n保持源视频中动作声音和环境声音的原有时序与同步关系，不要生成会改变画面动作节奏的新声音。\n\nnon_diegetic_music:\n\n不添加额外的画外背景音乐。';
const RH_HAILUO_H3_EDIT_RESOLUTION_FIELD = Object.freeze({
  ...RH_VIDEO_RESOLUTION_FIELD,
  defaultValue: 1024,
  options: Object.freeze([832, 1024, 1280, 1376, 1664, 1920]),
  showHighResolutionOptions: true,
  description: '选择 1280 及以上分辨率时，建议使用 48G 显存；高分辨率生成速度较慢，请耐心等待。',
});
export const RH_VIDEO_HAILUO_H3_EDIT_V1_HELP_TOOLTIP = [
  '海螺H3 视频编辑V1用法',
  '必须接入 [[red:源视频]] + [[red:人物参考图]] 后才能生成',
  '提示词留空时使用默认人物替换提示词；输入内容后会覆盖默认提示词',
  '1280 及以上分辨率建议使用 48G 显存，生成速度较慢',
].join('\n');
export const rhVideoHailuoH3EditV1ModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_HAILUO_H3_EDIT_V1_MODEL_ID,
  executionId: RH_VIDEO_HAILUO_H3_EDIT_V1_EXECUTION_ID,
  displayName: '海螺H3 视频编辑V1',
  description: '源视频 + 人物参考图的海螺 H3 视频编辑工作流',
  vip: false,
  prompt: Object.freeze({
    emptyPolicy: 'allow',
    placeholder: '输入视频编辑要求；留空使用默认人物替换提示词',
  }),
  help: Object.freeze({ tooltip: RH_VIDEO_HAILUO_H3_EDIT_V1_HELP_TOOLTIP }),
  extensions: Object.freeze({
    providerProfiles: Object.freeze(['runninghub', 'runninghub-international']),
    videoParameterPanel: Object.freeze({
      sourceFrameCountFps: 'v54',
      submitScopeTargetEdges: true,
      frameStateDefaults: Object.freeze({ frameRate: 24, frameCount: 0 }),
      adaptiveRatio: Object.freeze({
        scopeTargetEdges: true,
        preferSlot: 'sourceVideo',
        preferVideoKind: true,
      }),
    }),
  }),
  fixedAssetSlots: ['sourceVideo', 'refImage'],
  inputSlots: {
    allowedKinds: ['text', 'image', 'video'],
    minByKind: { image: 1, video: 1 },
    maxByKind: { image: 1, video: 1, audio: 0 },
    fixedSlots: Object.freeze([
      Object.freeze({ id: 'sourceVideo', kind: 'video', label: '源视频', required: true }),
      Object.freeze({ id: 'refImage', kind: 'image', label: '人物参考图', required: true }),
    ]),
  },
  uiFields: [
    RH_HAILUO_H3_EDIT_RESOLUTION_FIELD,
    RH_VIDEO_FPS_30_FIELD,
    Object.freeze({
      id: 'rhVideoFrames',
      type: 'stepper',
      placement: 'videoParams',
      label: '帧数',
      defaultValue: 0,
      min: 0,
      max: 0xf423f,
      step: 1,
    }),
    Object.freeze({
      id: 'rhHailuoH3EditAcceleration',
      type: 'select',
      placement: 'videoAdvanced',
      variant: 'advancedRow',
      label: '加速模式',
      defaultValue: '0',
      options: Object.freeze([
        Object.freeze({ value: '0', label: '无' }),
        Object.freeze({ value: '1', label: 'turbo' }),
        Object.freeze({ value: '2', label: '4步lora' }),
      ]),
    }),
    Object.freeze({
      id: 'rhHailuoH3EditIgnoreVideoAudioReference',
      type: 'segmented',
      placement: 'videoAdvanced',
      variant: 'advancedRow',
      label: '忽略视频音频参考',
      defaultValue: false,
      options: Object.freeze([
        Object.freeze({ value: true, label: '是' }),
        Object.freeze({ value: false, label: '否' }),
      ]),
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoHailuoH3EditV1ExecutionManifest = createRunningHubVideoExecutionManifest({
  id: RH_VIDEO_HAILUO_H3_EDIT_V1_EXECUTION_ID,
  label: '海螺H3 视频编辑V1',
  workflowId: '2091090228656680961',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  extensions: Object.freeze({
    providerProfileBindings: Object.freeze({
      runninghub: Object.freeze({ appId: '2091130847360544769' }),
    }),
  }),
  mapping: {
    nodeInfoList: Object.freeze([
      Object.freeze({
        nodeId: '68',
        fieldName: 'video',
        source: 'videoInput',
        required: true,
        missingMessage: '请接入源视频',
        description: '源视频',
      }),
      Object.freeze({
        nodeId: '68',
        fieldName: 'force_rate',
        source: 'param',
        fields: Object.freeze(['generationParams.rhVideoFps', 'rhVideoFps', 'frameRate']),
        defaultValue: 24,
        transform: 'normalizeRhVideoFps',
        description: '帧率',
      }),
      Object.freeze({
        nodeId: '68',
        fieldName: 'frame_load_cap',
        source: 'param',
        fields: Object.freeze(['generationParams.rhVideoFrames', 'rhVideoFrames', 'frameCount']),
        defaultValue: 0,
        transform: Object.freeze({ name: 'integer', min: 0 }),
        description: '帧数',
      }),
      Object.freeze({
        nodeId: '60',
        fieldName: 'image',
        source: 'imageInput',
        field: 'inputUrls',
        required: true,
        missingMessage: '请接入人物参考图',
        description: '人物参考图',
      }),
      Object.freeze({ nodeId: '273', fieldName: 'value', source: 'constant', value: 10 }),
      Object.freeze({
        nodeId: '267',
        fieldName: 'value',
        source: 'param',
        fields: Object.freeze([
          'generationParams.rhHailuoH3EditIgnoreVideoAudioReference',
          'rhHailuoH3EditIgnoreVideoAudioReference',
        ]),
        defaultValue: false,
        valueMap: Object.freeze({ false: '0', true: '1' }),
        description: '忽略视频音频参考',
      }),
      Object.freeze({
        nodeId: '46',
        fieldName: 'value',
        source: 'param',
        fields: Object.freeze(['generationParams.rhVideoResolution', 'rhVideoResolution']),
        defaultValue: 1024,
        transform: Object.freeze({ name: 'integer', min: 832, max: 1920 }),
        description: '分辨率',
      }),
      Object.freeze({
        nodeId: '195',
        fieldName: 'value',
        source: 'param',
        fields: Object.freeze([
          'generationParams.rhHailuoH3EditAcceleration',
          'rhHailuoH3EditAcceleration',
        ]),
        defaultValue: '0',
        transform: Object.freeze({ name: 'integer', min: 0, max: 2 }),
        description: '加速模式',
      }),
      Object.freeze({
        nodeId: '59',
        fieldName: 'value',
        source: 'prompt',
        defaultValue: RH_VIDEO_HAILUO_H3_EDIT_V1_DEFAULT_PROMPT,
        transform: 'minimaxH3AssetMentions',
        description: '提示词',
      }),
    ]),
  },
});
