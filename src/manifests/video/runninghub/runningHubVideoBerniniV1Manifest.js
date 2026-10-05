import {
  RH_INSTANCE_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from '../../shared/runningHubVideoManifestShared.js';
export const RH_VIDEO_BERNINI_V1_MODEL_ID = 'runninghub/2062515720147259393';
export const RH_VIDEO_BERNINI_V1_EXECUTION_ID = 'runninghub.workflow.video-bernini-v1.v1';
const RH_BERNINI_FUNCTION_BY_INPUT_MODE = Object.freeze({
    image: Object.freeze(['i2v', 'r2v']),
    video: Object.freeze(['v2v', 'mv2v']),
    videoImage: Object.freeze(['vi2v', 'rv2v', 'vrc2v']),
    videoVideo: Object.freeze(['ads2v']),
  }),
  RH_BERNINI_FUNCTION_LABELS = Object.freeze({
    i2v: 'i2v图片生视频',
    r2v: 'r2v参考主体到视频',
    v2v: 'v2v视频到视频',
    mv2v: 'mv2v多维编辑到视频',
    vi2v: 'vi2v视频指令到视频',
    rv2v: 'rv2v参考视频到视频',
    vrc2v: 'vrc2v视频区域控制到视频',
    ads2v: 'ads2v广告插入到视频',
  }),
  RH_BERNINI_FUNCTION_HELP = Object.freeze({
    t2v: 't2v文本到视频：只输入提示词，适合从文字直接生成完整视频。',
    i2v: 'i2v图片生视频：用参考图像作为画面主体或首帧，按提示词生成动态视频。',
    r2v: 'r2v参考主体到视频：用参考图像锁定主体外观，更适合主体一致性要求高的生成。',
    v2v: 'v2v视频到视频：基于源视频改风格、改内容或重绘整体画面。',
    mv2v: 'mv2v多维编辑到视频：基于源视频做更复杂的多维度编辑和画面调整。',
    vi2v: 'vi2v视频指令到视频：源视频加参考图像，按提示词做指令式视频编辑。',
    rv2v: 'rv2v参考视频到视频：源视频加参考图像，适合用参考主体或风格约束视频编辑。',
    vrc2v: 'vrc2v视频区域控制到视频：源视频加参考图像，适合带区域控制诉求的视频编辑。',
    ads2v: 'ads2v广告插入到视频：源视频加参考视频，适合把广告或参考视频内容插入到源视频。',
  });
function buildFunctionHelp(...list) {
  return list.map((item) => RH_BERNINI_FUNCTION_HELP[item]).join('\n');
}
const RH_BERNINI_USAGE_TABLE = Object.freeze([
  '| 任务类型 | 使用方法 | 提示词示例 |',
  '|---|---|---|',
  '| `t2v文本到视频` | 无入参，适用于纯文本生成视频。 | 一只白色北极熊坐在雪地上弹吉他，雪花飘落，镜头稳定，动作自然。 |',
  '| `i2v图片到视频` | 图像，适用于图片动态化、首帧生视频。 | 根据输入图片生成视频，保持主体外观不变，让主体产生自然轻微动作。 |',
  '| `v2v视频到视频` | 源视频，适用于普通视频编辑、局部增删改。 | 在源视频中添加一个雪人，保持原视频其他内容、镜头、光照和动作不变。 |',
  '| `r2v参考主体到视频` | 图像，适用于参考主体、服装、物体或场景生成视频。 | 让参考图中的主体坐在海边长椅上，随着音乐轻轻摇摆，保持主体外观一致。 |',
  '| `vi2v视频指令到视频` | 源视频+图像，适用于内容传播、参考插入、参考替换。 | 将参考图片中的人物自然融合到源视频中，保持原视频的镜头运动、光照、透视和背景不变。 |',
  '| `rv2v参考视频到视频` | 源视频+图像，适用于主体替换、服装替换、物体替换、风格参考。 | 把视频中人物的外套替换成参考图片里的衣服，保持人物动作、脸部、背景和光照不变。 |',
  '| `ads2v广告插入到视频` | 源视频+参考视频，适用于屏幕、广告牌、电视、手机等视频内容插入。 | 把参考视频添加到源视频里的电脑屏幕上，匹配屏幕透视、亮度、反光和运动效果。 |',
  '| `vrc2v视频区域控制到视频` | 源视频+区域控制，适用于主体位置、动作或局部区域控制。 | 将视频主体移动到指定区域，保持主体身份、服装、背景、镜头构图和光照不变。 |',
  '| `mv2v多维编辑到视频` | 源视频，适用于动作、姿势、风格、光照、颜色、纹理编辑。 | 改变人物动作，让人物自然蹲下，保持同一个人物、服装、场景、光照和镜头一致。 |',
]);
export const RH_VIDEO_BERNINI_V1_HELP_TOOLTIP = ['各种功能的用法说明', '', ...RH_BERNINI_USAGE_TABLE].join(
  '\n',
);
const RH_BERNINI_FUNCTION_OPTIONS = Object.freeze([
    Object.freeze({ value: 'i2v', label: RH_BERNINI_FUNCTION_LABELS.i2v }),
    Object.freeze({ value: 'r2v', label: RH_BERNINI_FUNCTION_LABELS.r2v }),
    Object.freeze({ value: 'v2v', label: RH_BERNINI_FUNCTION_LABELS.v2v }),
    Object.freeze({ value: 'mv2v', label: RH_BERNINI_FUNCTION_LABELS.mv2v }),
    Object.freeze({ value: 'vi2v', label: RH_BERNINI_FUNCTION_LABELS.vi2v }),
    Object.freeze({ value: 'rv2v', label: RH_BERNINI_FUNCTION_LABELS.rv2v }),
    Object.freeze({ value: 'vrc2v', label: RH_BERNINI_FUNCTION_LABELS.vrc2v }),
    Object.freeze({ value: 'ads2v', label: RH_BERNINI_FUNCTION_LABELS.ads2v }),
  ]),
  RH_BERNINI_INPUT_MODES = Object.freeze(['none', 'image', 'video', 'videoImage', 'videoVideo']),
  RH_BERNINI_RATIO_OPTIONS = Object.freeze([
    Object.freeze({ value: '自适应', label: '自适应' }),
    Object.freeze({ value: '1:1', label: '1:1' }),
    Object.freeze({ value: '16:9', label: '16:9' }),
    Object.freeze({ value: '9:16', label: '9:16' }),
    Object.freeze({ value: '4:3', label: '4:3' }),
    Object.freeze({ value: '3:4', label: '3:4' }),
    Object.freeze({ value: '3:2', label: '3:2' }),
    Object.freeze({ value: '2:3', label: '2:3' }),
    Object.freeze({ value: '21:9', label: '21:9' }),
    Object.freeze({ value: '9:21', label: '9:21' }),
    Object.freeze({ value: '5:4', label: '5:4' }),
    Object.freeze({ value: '4:5', label: '4:5' }),
    Object.freeze({ value: '2:1', label: '2:1' }),
    Object.freeze({ value: '1:2', label: '1:2' }),
  ]);
export const rhVideoBerniniV1ModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_BERNINI_V1_MODEL_ID,
  executionId: RH_VIDEO_BERNINI_V1_EXECUTION_ID,
  displayName: '新全能视频替换BERNINI V1',
  description: '支持文本、图片、源视频、参考视频组合的全能视频替换工作流',
  vip: true,
  subscriptionAliases: ['video_edit_v54', 'video_edit.pro'],
  help: Object.freeze({
    tooltip: RH_VIDEO_BERNINI_V1_HELP_TOOLTIP,
    variants: Object.freeze([
      Object.freeze({
        when: Object.freeze({ field: 'rhBerniniInputMode', value: 'none' }),
        tooltip: RH_VIDEO_BERNINI_V1_HELP_TOOLTIP,
      }),
      Object.freeze({
        when: Object.freeze({ field: 'rhBerniniInputMode', value: 'image' }),
        tooltip: RH_VIDEO_BERNINI_V1_HELP_TOOLTIP,
      }),
      Object.freeze({
        when: Object.freeze({ field: 'rhBerniniInputMode', value: 'video' }),
        tooltip: RH_VIDEO_BERNINI_V1_HELP_TOOLTIP,
      }),
      Object.freeze({
        when: Object.freeze({ field: 'rhBerniniInputMode', value: 'videoImage' }),
        tooltip: RH_VIDEO_BERNINI_V1_HELP_TOOLTIP,
      }),
      Object.freeze({
        when: Object.freeze({ field: 'rhBerniniInputMode', value: 'videoVideo' }),
        tooltip: RH_VIDEO_BERNINI_V1_HELP_TOOLTIP,
      }),
    ]),
  }),
  extensions: Object.freeze({
    vipAliases: Object.freeze(['video_edit_v54', 'video_edit.pro']),
    videoParameterPanel: Object.freeze({
      fixedSlotSummary: Object.freeze({
        resolver: 'berniniVideoReplaceInputMode',
        field: 'rhBerniniInputMode',
      }),
    }),
  }),
  fixedAssetSlots: ['sourceVideo', 'refImage', 'referenceVideo'],
  inputSlots: {
    allowedKinds: ['text', 'image', 'video'],
    minByKind: { image: 0, video: 0 },
    maxByKind: { text: 1, image: 1, video: 2, audio: 0 },
    fixedSlots: Object.freeze([
      Object.freeze({ id: 'sourceVideo', kind: 'video', label: '源视频', required: false, displayOrder: 0 }),
      Object.freeze({ id: 'refImage', kind: 'image', label: '参考图像', required: false, displayOrder: 1 }),
      Object.freeze({
        id: 'referenceVideo',
        kind: 'video',
        label: '参考视频',
        required: false,
        displayOrder: 2,
      }),
    ]),
  },
  uiFields: [
    Object.freeze({
      id: 'rhBerniniFunction',
      type: 'segmented',
      placement: 'videoParams',
      variant: 'pillMenu',
      label: '功能选择',
      menuTitle: '功能选择',
      menuTooltipField: 'rhBerniniInputMode',
      menuTooltipByValue: Object.freeze({
        image: ['各种功能的用法说明', buildFunctionHelp('i2v', 'r2v')].join('\n'),
        video: ['各种功能的用法说明', buildFunctionHelp('v2v', 'mv2v')].join('\n'),
        videoImage: ['各种功能的用法说明', buildFunctionHelp('vi2v', 'rv2v', 'vrc2v')].join('\n'),
        videoVideo: ['各种功能的用法说明', buildFunctionHelp('ads2v')].join('\n'),
      }),
      defaultValue: 'i2v',
      showWhen: Object.freeze({
        field: 'rhBerniniInputMode',
        values: Object.freeze(['image', 'video', 'videoImage']),
      }),
      options: RH_BERNINI_FUNCTION_OPTIONS.map((el) => {
        const list2 = Object.entries(RH_BERNINI_FUNCTION_BY_INPUT_MODE)
          .filter(([, list3]) => list3.includes(el.value))
          .map(([value]) => value);
        return Object.freeze({
          ...el,
          hideWhen: Object.freeze({
            field: 'rhBerniniInputMode',
            values: Object.freeze(RH_BERNINI_INPUT_MODES.filter((item2) => !list2.includes(item2))),
          }),
        });
      }),
    }),
    Object.freeze({
      id: 'rhVideoResolution',
      type: 'segmented',
      placement: 'videoParams',
      displayRole: 'resolution',
      label: '分辨率',
      defaultValue: 832,
      options: Object.freeze([
        Object.freeze({ value: 832, label: '832' }),
        Object.freeze({ value: 1024, label: '1024' }),
        Object.freeze({ value: 1280, label: '1280' }),
        Object.freeze({ value: 1440, label: '1440' }),
      ]),
    }),
    Object.freeze({
      id: 'rhVideoFps',
      type: 'segmented',
      placement: 'videoParams',
      label: '帧率',
      defaultValue: 24,
      options: Object.freeze([
        Object.freeze({ value: 16, label: '16帧' }),
        Object.freeze({ value: 24, label: '24帧' }),
        Object.freeze({ value: 30, label: '30帧' }),
      ]),
    }),
    Object.freeze({
      id: 'rhVideoFrames',
      type: 'stepper',
      placement: 'videoParams',
      label: '帧数',
      defaultValue: 121,
      min: 0,
      max: 0xf423f,
      step: 1,
    }),
    Object.freeze({
      id: 'rhBerniniAspectRatio',
      type: 'segmented',
      placement: 'videoParams',
      displayRole: 'aspectRatio',
      label: '比例',
      defaultValue: '自适应',
      options: RH_BERNINI_RATIO_OPTIONS,
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoBerniniV1ExecutionManifest = createRunningHubVideoExecutionManifest({
  id: RH_VIDEO_BERNINI_V1_EXECUTION_ID,
  label: '新全能视频替换BERNINI V1',
  workflowId: '2062515720147259393',
  submitMode: 'openapi-v2-ai-app',
  queryMode: 'openapi-v2-query',
  extensions: Object.freeze({ payloadResolver: 'runninghubBerniniVideoReplaceV1' }),
  mapping: {
    sourceVideoNode: Object.freeze({ nodeId: '31', fieldName: 'video', description: '上传源视频' }),
    refImageNode: Object.freeze({ nodeId: '32', fieldName: 'image', description: '参考图' }),
    modeNode: Object.freeze({ nodeId: '34', fieldName: 'value', description: '模式选择' }),
    fpsNode: Object.freeze({ nodeId: '31', fieldName: 'force_rate', value: '24', description: '帧率' }),
    framesNode: Object.freeze({ nodeId: '19', fieldName: 'value', value: '121', description: '帧数' }),
    widthNode: Object.freeze({ nodeId: '17', fieldName: 'value', description: '宽度' }),
    heightNode: Object.freeze({ nodeId: '18', fieldName: 'value', description: '高度' }),
    promptNode: Object.freeze({ nodeId: '53', fieldName: 'value', description: '提示词' }),
    referenceVideoNode: Object.freeze({
      nodeId: '100',
      fieldName: 'video',
      description: '参考视频（仅仅ads2v才需要）',
    }),
  },
});
