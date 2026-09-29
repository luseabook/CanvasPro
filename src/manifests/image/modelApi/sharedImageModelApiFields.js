export const IMAGE_SIZE_FIELD = Object.freeze({
  id: 'imageSize',
  type: 'segmented',
  placement: 'resolution',
  label: 'Quality',
  defaultValue: '2K',
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({ value: '3K', label: '3K' }),
    Object.freeze({ value: '4K', label: '4K' }),
  ]),
});
export const APIMART_SEEDREAM_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({ value: '3K', label: '3K' }),
  ]),
});
export const APIMART_SEEDREAM_4_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({ value: '4K', label: '4K' }),
  ]),
});
export const APIMART_SEEDREAM_4_5_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({ value: '4K', label: '4K' }),
  ]),
});
export const APIMART_SEEDREAM_5_LITE_IMAGE_SIZE_FIELD = APIMART_SEEDREAM_IMAGE_SIZE_FIELD;
export const GPT_IMAGE_2_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({ value: '4K', label: '4K' }),
  ]),
});
export const APIMART_NANO_BANANA_2_MODE_FIELD = Object.freeze({
  id: 'mode',
  type: 'segmented',
  placement: 'mode',
  label: 'Mode',
  defaultValue: 'standard',
  options: Object.freeze([
    Object.freeze({ value: 'standard', label: '标准版', selectedLabel: '标准版' }),
    Object.freeze({ value: 'official', label: '官方版', selectedLabel: '官方版' }),
  ]),
});
export const APIMART_NANO_BANANA_2_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({ value: '4K', label: '4K' }),
  ]),
});
export const APIMART_NANO_BANANA_PRO_MODE_FIELD = APIMART_NANO_BANANA_2_MODE_FIELD;
export const APIMART_NANO_BANANA_PRO_IMAGE_SIZE_FIELD = APIMART_NANO_BANANA_2_IMAGE_SIZE_FIELD;
export const APIMART_NANO_BANANA_MODE_FIELD = APIMART_NANO_BANANA_2_MODE_FIELD;
export const APIMART_NANO_BANANA_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  defaultValue: '1K',
  options: Object.freeze([Object.freeze({ value: '1K', label: '1K' })]),
});
export const APIMART_GPT_IMAGE_2_MODE_FIELD = APIMART_NANO_BANANA_2_MODE_FIELD;
export const APIMART_GPT_IMAGE_2_IMAGE_SIZE_FIELD = Object.freeze({
  ...GPT_IMAGE_2_IMAGE_SIZE_FIELD,
  defaultValue: '1K',
});
export const APIMART_GPT_IMAGE_2_QUALITY_FIELD = Object.freeze({
  id: 'quality',
  type: 'segmented',
  placement: 'resolution',
  label: '质量',
  defaultValue: 'medium',
  showWhen: Object.freeze({ field: 'mode', value: 'official' }),
  showInfoTip: true,
  description:
    'quality\n图片质量\nlow - 快速省钱，轮廓够用\nmedium - 平衡\nhigh - 最高精度（4K + high 耗时 >120s）',
  options: Object.freeze([
    Object.freeze({ value: 'low', label: '低' }),
    Object.freeze({ value: 'medium', label: '中' }),
    Object.freeze({ value: 'high', label: '高' }),
  ]),
});
export const APIMART_QWEN_IMAGE_MODE_FIELD = Object.freeze({
  id: 'mode',
  type: 'segmented',
  placement: 'mode',
  label: 'Mode',
  defaultValue: 'standard',
  options: Object.freeze([
    Object.freeze({ value: 'standard', label: '标准版', selectedLabel: '标准版' }),
    Object.freeze({ value: 'pro', label: 'Pro版', selectedLabel: 'Pro版' }),
  ]),
});
export const APIMART_QWEN_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  defaultValue: '1K',
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
  ]),
});
export const APIMART_QWEN_IMAGE_RATIO_FIELD = Object.freeze({
  id: 'aspectRatio',
  type: 'segmented',
  placement: 'resolution',
  label: 'Ratio',
  defaultValue: '自适应',
  options: Object.freeze([
    Object.freeze({ value: '自适应', label: 'Auto', selectedLabel: '自适应' }),
    Object.freeze({ value: '1:1', label: '1:1' }),
    Object.freeze({ value: '4:3', label: '4:3' }),
    Object.freeze({ value: '3:4', label: '3:4' }),
    Object.freeze({ value: '16:9', label: '16:9' }),
    Object.freeze({ value: '9:16', label: '9:16' }),
    Object.freeze({ value: '3:2', label: '3:2' }),
    Object.freeze({ value: '2:3', label: '2:3' }),
  ]),
});
export const APIMART_Z_IMAGE_TURBO_IMAGE_SIZE_FIELD = APIMART_QWEN_IMAGE_SIZE_FIELD;
export const APIMART_Z_IMAGE_TURBO_RATIO_FIELD = APIMART_QWEN_IMAGE_RATIO_FIELD;
export const APIMART_Z_IMAGE_TURBO_PROMPT_EXTEND_FIELD = Object.freeze({
  id: 'prompt_extend',
  type: 'toggle',
  placement: 'advanced',
  label: '智能改写提示词',
  description: '开启后，AI 会自动优化提示词，生成效果更好，费用会有所增加。',
  defaultValue: false,
});
export const APIMART_WAN_IMAGE_MODE_FIELD = Object.freeze({
  id: 'mode',
  type: 'segmented',
  placement: 'mode',
  label: 'Mode',
  defaultValue: 'standard',
  options: Object.freeze([
    Object.freeze({ value: 'standard', label: '标准版', selectedLabel: '标准版' }),
    Object.freeze({ value: 'pro', label: '专业版', selectedLabel: '专业版' }),
  ]),
});
const APIMART_WAN_4K_DISABLE = Object.freeze({
  any: Object.freeze([
    Object.freeze({ field: 'mode', values: Object.freeze(['standard']) }),
    Object.freeze({ field: 'hasInputImages', values: Object.freeze([true]) }),
  ]),
});
export const APIMART_WAN_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  defaultValue: '2K',
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({
      value: '4K',
      label: '4K',
      disableWhen: APIMART_WAN_4K_DISABLE,
      tooltip: '4K only supports pro text-to-image',
    }),
  ]),
});
export const APIMART_WAN_IMAGE_RATIO_FIELD = APIMART_QWEN_IMAGE_RATIO_FIELD;
export const APIMART_WAN_THINKING_MODE_FIELD = Object.freeze({
  id: 'thinking_mode',
  type: 'toggle',
  placement: 'advanced',
  label: '思考模式',
  description: '开启后模型增强推理能力，提升画面质量，但耗时增加。',
  defaultValue: true,
});
const APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE = Object.freeze({
    field: 'imageSize',
    values: Object.freeze(['4K']),
  }),
  APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP = '4K only supports 16:9 / 9:16 / 2:1 / 1:2 / 21:9 / 9:21';
export const APIMART_GPT_IMAGE_2_RATIO_FIELD = Object.freeze({
  id: 'aspectRatio',
  type: 'segmented',
  placement: 'resolution',
  label: 'Ratio',
  defaultValue: '自适应',
  options: Object.freeze([
    Object.freeze({ value: '自适应', label: 'Auto' }),
    Object.freeze({
      value: '1:1',
      label: '1:1',
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object.freeze({
      value: '3:2',
      label: '3:2',
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object.freeze({
      value: '2:3',
      label: '2:3',
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object.freeze({
      value: '4:3',
      label: '4:3',
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object.freeze({
      value: '3:4',
      label: '3:4',
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object.freeze({
      value: '5:4',
      label: '5:4',
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object.freeze({
      value: '4:5',
      label: '4:5',
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object.freeze({ value: '16:9', label: '16:9' }),
    Object.freeze({ value: '9:16', label: '9:16' }),
    Object.freeze({ value: '2:1', label: '2:1' }),
    Object.freeze({ value: '1:2', label: '1:2' }),
    Object.freeze({ value: '21:9', label: '21:9' }),
    Object.freeze({ value: '9:21', label: '9:21' }),
  ]),
});
export const APIMART_NANO_BANANA_2_GOOGLE_SEARCH_FIELD = Object.freeze({
  id: 'google_search',
  type: 'toggle',
  placement: 'advanced',
  label: 'Google 文字搜索',
  description: '启用 Google 文字搜索增强，适合需要真实信息的场景。',
  defaultValue: false,
});
export const APIMART_NANO_BANANA_2_GOOGLE_IMAGE_SEARCH_FIELD = Object.freeze({
  id: 'google_image_search',
  type: 'toggle',
  placement: 'advanced',
  label: 'Google 图片搜索',
  description: '启用 Google 图片搜索增强，需要同时开启 Google 文字搜索。',
  defaultValue: false,
});
export const GRSAI_GPT_IMAGE_2_MODE_FIELD = Object.freeze({
  id: 'mode',
  type: 'segmented',
  placement: 'mode',
  label: 'Mode',
  defaultValue: 'normal',
  options: Object.freeze([
    Object.freeze({ value: 'normal', label: '常规', selectedLabel: '常规' }),
    Object.freeze({ value: 'vip', label: 'VIP', selectedLabel: 'VIP' }),
  ]),
});
export const GRSAI_GPT_IMAGE_2_IMAGE_SIZE_FIELD = Object.freeze({
  ...GPT_IMAGE_2_IMAGE_SIZE_FIELD,
  defaultValue: '1K',
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({
      value: '2K',
      label: '2K',
      disableWhen: Object.freeze({ field: 'mode', values: ['normal'] }),
      tooltip: 'VIP',
    }),
    Object.freeze({
      value: '4K',
      label: '4K',
      disableWhen: Object.freeze({ field: 'mode', values: ['normal'] }),
      tooltip: 'VIP',
    }),
  ]),
});
export const GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({ value: '4K', label: '4K', disabled: true, tooltip: '1K/2K only' }),
  ]),
});
export const GRSAI_NANO_BANANA_2_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({
      value: '4K',
      label: '4K',
      disableWhen: Object.freeze({ field: 'mode', values: ['normal'] }),
      tooltip: 'CL 4K',
    }),
  ]),
});
export const GRSAI_NANO_BANANA_PRO_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({
      value: '4K',
      label: '4K',
      disableWhen: Object.freeze({ field: 'mode', values: ['normal', 'vt', 'cl'] }),
      tooltip: 'VIP 4K',
    }),
  ]),
});
export const GRSAI_NANO_BANANA_4K_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  defaultValue: '4K',
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K', disabled: true, tooltip: '4K only' }),
    Object.freeze({ value: '2K', label: '2K', disabled: true, tooltip: '4K only' }),
    Object.freeze({ value: '4K', label: '4K' }),
  ]),
});
export const RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_IMAGE_SIZE_FIELD = Object.freeze({
  ...IMAGE_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '1K', label: '1K' }),
    Object.freeze({ value: '2K', label: '2K' }),
    Object.freeze({ value: '4K', label: '4K' }),
  ]),
});
export const ASPECT_RATIO_FIELD = Object.freeze({
  id: 'aspectRatio',
  type: 'segmented',
  placement: 'resolution',
  label: 'Ratio',
  defaultValue: '自适应',
  options: Object.freeze([
    Object.freeze({ value: '自适应', label: 'Auto' }),
    Object.freeze({ value: '1:1', label: '1:1' }),
    Object.freeze({ value: '9:16', label: '9:16' }),
    Object.freeze({ value: '16:9', label: '16:9' }),
    Object.freeze({ value: '3:4', label: '3:4' }),
    Object.freeze({ value: '4:3', label: '4:3' }),
    Object.freeze({ value: '3:2', label: '3:2' }),
    Object.freeze({ value: '2:3', label: '2:3' }),
    Object.freeze({ value: '5:4', label: '5:4' }),
    Object.freeze({ value: '4:5', label: '4:5' }),
    Object.freeze({ value: '21:9', label: '21:9' }),
  ]),
});
export const APIMART_SEEDREAM_RATIO_FIELD = Object.freeze({
  ...ASPECT_RATIO_FIELD,
  defaultValue: 'auto',
  options: Object.freeze([
    Object.freeze({ value: '1:1', label: '1:1' }),
    Object.freeze({ value: '4:3', label: '4:3' }),
    Object.freeze({ value: '3:4', label: '3:4' }),
    Object.freeze({ value: '16:9', label: '16:9' }),
    Object.freeze({ value: '9:16', label: '9:16' }),
    Object.freeze({ value: '3:2', label: '3:2' }),
    Object.freeze({ value: '2:3', label: '2:3' }),
    Object.freeze({ value: '21:9', label: '21:9' }),
    Object.freeze({ value: '9:21', label: '9:21' }),
    Object.freeze({ value: 'auto', label: 'Auto', selectedLabel: '自适应' }),
  ]),
});
export const APIMART_SEEDREAM_5_LITE_RATIO_FIELD = Object.freeze({
  ...APIMART_SEEDREAM_RATIO_FIELD,
  options: Object.freeze(
    APIMART_SEEDREAM_RATIO_FIELD.options.filter(
      (_0x2d3c85) => String(_0x2d3c85?.value ?? _0x2d3c85) !== '9:21',
    ),
  ),
});
export const NANO_BANANA_2_RATIO_FIELD = Object.freeze({
  ...ASPECT_RATIO_FIELD,
  options: Object.freeze([
    ...ASPECT_RATIO_FIELD.options,
    Object.freeze({ value: '1:4', label: '1:4' }),
    Object.freeze({ value: '4:1', label: '4:1' }),
    Object.freeze({ value: '1:8', label: '1:8' }),
    Object.freeze({ value: '8:1', label: '8:1' }),
  ]),
});
export const GRSAI_NANO_BANANA_RATIO_FIELD = Object.freeze({
  ...ASPECT_RATIO_FIELD,
  defaultValue: 'auto',
  options: Object.freeze([
    Object.freeze({ value: 'auto', label: 'Auto', selectedLabel: '自适应' }),
    Object.freeze({ value: '1:1', label: '1:1' }),
    Object.freeze({ value: '16:9', label: '16:9' }),
    Object.freeze({ value: '9:16', label: '9:16' }),
    Object.freeze({ value: '4:3', label: '4:3' }),
    Object.freeze({ value: '3:4', label: '3:4' }),
    Object.freeze({ value: '3:2', label: '3:2' }),
    Object.freeze({ value: '2:3', label: '2:3' }),
    Object.freeze({ value: '5:4', label: '5:4' }),
    Object.freeze({ value: '4:5', label: '4:5' }),
    Object.freeze({ value: '21:9', label: '21:9' }),
  ]),
});
export const GRSAI_NANO_BANANA_2_RATIO_FIELD = Object.freeze({
  ...GRSAI_NANO_BANANA_RATIO_FIELD,
  options: Object.freeze([
    ...GRSAI_NANO_BANANA_RATIO_FIELD.options,
    Object.freeze({ value: '1:4', label: '1:4' }),
    Object.freeze({ value: '4:1', label: '4:1' }),
    Object.freeze({ value: '1:8', label: '1:8' }),
    Object.freeze({ value: '8:1', label: '8:1' }),
  ]),
});
export const GPT_IMAGE_2_RATIO_FIELD = Object.freeze({
  ...ASPECT_RATIO_FIELD,
  options: Object.freeze([
    Object.freeze({ value: '自适应', label: 'Auto' }),
    Object.freeze({ value: '1:1', label: '1:1' }),
    Object.freeze({ value: '3:2', label: '3:2' }),
    Object.freeze({ value: '2:3', label: '2:3' }),
    Object.freeze({ value: '4:3', label: '4:3' }),
    Object.freeze({ value: '3:4', label: '3:4' }),
    Object.freeze({ value: '5:4', label: '5:4' }),
    Object.freeze({ value: '4:5', label: '4:5' }),
    Object.freeze({ value: '16:9', label: '16:9' }),
    Object.freeze({ value: '9:16', label: '9:16' }),
    Object.freeze({ value: '2:1', label: '2:1' }),
    Object.freeze({ value: '1:2', label: '1:2' }),
    Object.freeze({ value: '21:9', label: '21:9' }),
    Object.freeze({ value: '9:21', label: '9:21' }),
  ]),
});
export const GRSAI_GPT_IMAGE_2_RATIO_FIELD = Object.freeze({
  ...ASPECT_RATIO_FIELD,
  defaultValue: 'auto',
  options: Object.freeze([
    Object.freeze({ value: 'auto', label: 'Auto', selectedLabel: '自适应' }),
    Object.freeze({ value: '1:1', label: '1:1' }),
    Object.freeze({ value: '16:9', label: '16:9' }),
    Object.freeze({ value: '9:16', label: '9:16' }),
    Object.freeze({ value: '4:3', label: '4:3' }),
    Object.freeze({ value: '3:4', label: '3:4' }),
    Object.freeze({ value: '3:2', label: '3:2' }),
    Object.freeze({ value: '2:3', label: '2:3' }),
    Object.freeze({ value: '5:4', label: '5:4' }),
    Object.freeze({ value: '4:5', label: '4:5' }),
    Object.freeze({ value: '21:9', label: '21:9' }),
    Object.freeze({ value: '9:21', label: '9:21' }),
    Object.freeze({ value: '1:3', label: '1:3' }),
    Object.freeze({ value: '3:1', label: '3:1' }),
    Object.freeze({ value: '2:1', label: '2:1' }),
    Object.freeze({ value: '1:2', label: '1:2' }),
  ]),
});
export const MODE_NORMAL_FIELD = Object.freeze({
  id: 'mode',
  type: 'segmented',
  placement: 'mode',
  label: 'Mode',
  defaultValue: 'normal',
  options: Object.freeze([Object.freeze({ value: 'normal', label: '常规' })]),
});
export const MODE_NORMAL_FAST_FIELD = Object.freeze({
  ...MODE_NORMAL_FIELD,
  options: Object.freeze([
    Object.freeze({ value: 'normal', label: '正常' }),
    Object.freeze({ value: 'fast', label: '快速' }),
  ]),
});
export const MODE_NORMAL_CL_FIELD = Object.freeze({
  ...MODE_NORMAL_FIELD,
  options: Object.freeze([
    Object.freeze({ value: 'normal', label: '常规' }),
    Object.freeze({ value: 'cl', label: 'CL' }),
  ]),
});
export const MODE_CL_FIELD = Object.freeze({
  ...MODE_NORMAL_FIELD,
  defaultValue: 'cl',
  options: Object.freeze([Object.freeze({ value: 'cl', label: 'CL' })]),
});
export const MODE_VIP_FIELD = Object.freeze({
  ...MODE_NORMAL_FIELD,
  defaultValue: 'vip',
  options: Object.freeze([Object.freeze({ value: 'vip', label: 'VIP' })]),
});
export const MODE_NORMAL_VT_CL_VIP_FIELD = Object.freeze({
  ...MODE_NORMAL_FIELD,
  options: Object.freeze([
    Object.freeze({ value: 'normal', label: '常规' }),
    Object.freeze({ value: 'vt', label: 'VT' }),
    Object.freeze({ value: 'cl', label: 'CL' }),
    Object.freeze({ value: 'vip', label: 'VIP' }),
  ]),
});
export const RUNNINGHUB_MODEL_ROUTE_FIELD = Object.freeze({
  id: 'rhModelRoute',
  type: 'segmented',
  placement: 'mode',
  label: 'Route',
  defaultValue: 'low',
  options: Object.freeze([
    Object.freeze({ value: 'low', label: '低价版', selectedLabel: '低价版' }),
    Object.freeze({ value: 'official', label: '官方版', selectedLabel: '官方版' }),
  ]),
});
export const BATCH_SIZE_FIELD = Object.freeze({
  id: 'batchSize',
  type: 'segmented',
  placement: 'batch',
  label: 'Batch',
  defaultValue: 1,
  options: Object.freeze([
    Object.freeze({ value: 1, label: '1x', selectedLabel: '1x' }),
    Object.freeze({ value: 2, label: '2x', selectedLabel: '2x' }),
    Object.freeze({ value: 4, label: '4x', selectedLabel: '4x' }),
  ]),
});
export const APIMART_QWEN_IMAGE_BATCH_SIZE_FIELD = Object.freeze({
  ...BATCH_SIZE_FIELD,
  options: Object.freeze([
    Object.freeze({ value: 1, label: '1x', selectedLabel: '1x' }),
    Object.freeze({ value: 2, label: '2x', selectedLabel: '2x' }),
    Object.freeze({ value: 4, label: '4x', selectedLabel: '4x' }),
    Object.freeze({ value: 6, label: '6x', selectedLabel: '6x' }),
  ]),
});
export function withDefaultValue(_0x36a1b9, _0x2e060c) {
  return Object.freeze({ ..._0x36a1b9, defaultValue: _0x2e060c });
}
function freezeFields(_0x2257fc) {
  return Object.freeze(_0x2257fc.map((_0x1635dd) => Object.freeze(_0x1635dd)));
}
const DEFAULT_IMAGE_MODEL_API_INPUT_SLOTS = Object.freeze({
  allowedKinds: Object.freeze(['text', 'image']),
  minByKind: Object.freeze({ image: 0 }),
  maxByKind: Object.freeze({ image: 8, video: 0, audio: 0 }),
});
export const IMAGE_MODEL_API_10_IMAGE_INPUT_SLOTS = Object.freeze({
  allowedKinds: Object.freeze(['text', 'image']),
  minByKind: Object.freeze({ image: 0 }),
  maxByKind: Object.freeze({ image: 10, video: 0, audio: 0 }),
});
export const IMAGE_MODEL_API_14_IMAGE_INPUT_SLOTS = Object.freeze({
  allowedKinds: Object.freeze(['text', 'image']),
  minByKind: Object.freeze({ image: 0 }),
  maxByKind: Object.freeze({ image: 14, video: 0, audio: 0 }),
});
export const IMAGE_MODEL_API_16_IMAGE_INPUT_SLOTS = Object.freeze({
  allowedKinds: Object.freeze(['text', 'image']),
  minByKind: Object.freeze({ image: 0 }),
  maxByKind: Object.freeze({ image: 16, video: 0, audio: 0 }),
});
const DEFAULT_RATIO_POLICY_BY_PROVIDER = Object.freeze({
  agnes: Object.freeze({ capability: 'size' }),
  apimart: Object.freeze({ capability: 'size' }),
  grsai: Object.freeze({ capability: 'aspectRatio' }),
  ppio: Object.freeze({ capability: 'size' }),
  runninghub: Object.freeze({ capability: 'aspectRatio' }),
  volcengine: Object.freeze({ capability: 'dimensions' }),
});
function normalizeProviderId(_0x38b898) {
  return String(_0x38b898 || '')
    .trim()
    .toLowerCase();
}
function freezeRatioPolicyValue(_0x32952d) {
  if (Array.isArray(_0x32952d)) return Object.freeze([..._0x32952d]);
  if (_0x32952d && typeof _0x32952d === 'object')
    return Object.freeze(
      Object.fromEntries(
        Object.entries(_0x32952d).map(([_0x357324, _0x88358c]) => [
          _0x357324,
          freezeRatioPolicyValue(_0x88358c),
        ]),
      ),
    );
  return _0x32952d;
}
function freezeRatioPolicy(_0x3635ee) {
  if (!_0x3635ee || typeof _0x3635ee !== 'object') return null;
  return Object.freeze(
    Object.fromEntries(
      Object.entries(_0x3635ee).map(([_0x3ab36f, _0x306533]) => [
        _0x3ab36f,
        freezeRatioPolicyValue(_0x306533),
      ]),
    ),
  );
}
function mergeRatioPolicyExtension(_0x331ea2, _0x4f2ebd, _0x1bdf83) {
  const _0x2b0709 = _0x331ea2 && typeof _0x331ea2 === 'object' ? { ..._0x331ea2 } : {},
    _0x1c81d1 =
      _0x1bdf83 ||
      _0x2b0709.ratioPolicy ||
      DEFAULT_RATIO_POLICY_BY_PROVIDER[normalizeProviderId(_0x4f2ebd)] ||
      null;
  if (_0x1c81d1) _0x2b0709.ratioPolicy = freezeRatioPolicy(_0x1c81d1);
  return Object.keys(_0x2b0709).length > 0 ? Object.freeze(_0x2b0709) : null;
}
function freezeInputSlots(_0x55dd84 = DEFAULT_IMAGE_MODEL_API_INPUT_SLOTS) {
  const _0x9e5c11 = _0x55dd84 || DEFAULT_IMAGE_MODEL_API_INPUT_SLOTS,
    _0x5c8503 = Array.isArray(_0x9e5c11.fixedSlots)
      ? {
          fixedSlots: Object.freeze(
            _0x9e5c11.fixedSlots.map((_0x23a36b) => Object.freeze({ ...(_0x23a36b || {}) })),
          ),
        }
      : {};
  return Object.freeze({
    allowedKinds: Object.freeze([...(_0x9e5c11.allowedKinds || [])]),
    minByKind: Object.freeze({ ...(_0x9e5c11.minByKind || {}) }),
    maxByKind: Object.freeze({ ...(_0x9e5c11.maxByKind || {}) }),
    ..._0x5c8503,
  });
}
export function createImageModelApiManifest({
  modelId: _0x56df33,
  executionId: _0x2cc1f0,
  provider: _0x249a85,
  displayName: _0x2fe752,
  icon: _0x3b3447,
  description: _0x5f4568,
  fields: _0x45251d,
  extensions: _0x4a6d48,
  ratioPolicy: _0x44b353,
  inputSlots: _0x4e25e0,
  nanoBanana: _0x9df8bb,
  prompt: _0x3572b1,
}) {
  const _0x366f50 = _0x9df8bb
      ? Object.freeze({ ...(_0x4a6d48 || {}), nanoBanana: Object.freeze({ ..._0x9df8bb }) })
      : _0x4a6d48,
    _0x425e72 = mergeRatioPolicyExtension(_0x366f50, _0x249a85, _0x44b353);
  return Object.freeze({
    schemaVersion: '1.0',
    modelId: _0x56df33,
    provider: _0x249a85,
    kind: 'image',
    adapterType: 'modelApi',
    executionId: _0x2cc1f0,
    displayName: _0x2fe752,
    icon: _0x3b3447,
    description: _0x5f4568,
    ...(_0x3572b1 ? { prompt: Object.freeze({ ..._0x3572b1 }) } : {}),
    ...(_0x425e72 ? { extensions: _0x425e72 } : {}),
    inputSlots: freezeInputSlots(_0x4e25e0),
    uiSchema: Object.freeze({ fields: freezeFields(_0x45251d) }),
    async: true,
    cancellable: false,
    outputType: 'image',
  });
}
export function createModelApiExecutionManifest({
  id: _0x320f93,
  provider: _0x2175e4,
  model: _0x457ba5,
  endpoint: _0x3fd839,
  endpointMode: _0x43d432,
  bodyMapping: _0x49331d,
  responseMapping: _0x5cd11e,
  extensions: _0x201ba8,
  taskPolling: _0x39fd23,
  modeModels: _0x2a182a,
  imageSizeModels: _0x349988,
  routeModels: _0x1bdbf6,
}) {
  const _0x4740ad = Object.freeze([
      'data.result.images[].url',
      'result.images[].url',
      'results[].url',
      'results[].imageUrl',
      'url',
    ]),
    _0x4ea357 = _0x39fd23 && typeof _0x39fd23 === 'object' ? Object.freeze({ ..._0x39fd23 }) : null,
    _0x4ee225 =
      _0x201ba8 || _0x4ea357
        ? Object.freeze({ ...(_0x201ba8 || {}), ...(_0x4ea357 ? { taskPolling: _0x4ea357 } : {}) })
        : null;
  return Object.freeze({
    schemaVersion: '1.0',
    id: _0x320f93,
    provider: _0x2175e4,
    kind: 'image',
    adapterType: 'modelApi',
    endpoint: _0x3fd839,
    ...(_0x43d432 ? { endpointMode: _0x43d432 } : {}),
    method: 'POST',
    model: _0x457ba5,
    ...(_0x2a182a ? { modeModels: Object.freeze(_0x2a182a) } : {}),
    ...(_0x349988 ? { imageSizeModels: Object.freeze(_0x349988) } : {}),
    ...(_0x1bdbf6 ? { routeModels: Object.freeze(_0x1bdbf6) } : {}),
    ...(_0x4ee225 ? { extensions: _0x4ee225 } : {}),
    headers: Object.freeze({ 'Content-Type': 'application/json' }),
    bodyMapping: Object.freeze(_0x49331d || []),
    responseMapping: Object.freeze({
      taskIdPath: 'taskId',
      statusPath: 'status',
      errorPath: 'error',
      ...(_0x5cd11e || {}),
      resultPaths: Object.freeze(_0x5cd11e?.resultPaths || _0x4740ad),
    }),
    result: Object.freeze({ taskIdPath: 'taskId', urlFields: Object.freeze(['url', 'imageUrl']) }),
  });
}

export const APIMART_SEEDREAM_5_PRO_IMAGE_SIZE_FIELD=Object["freeze"]({...IMAGE_SIZE_FIELD,'defaultValue':'2K','options':Object["freeze"]([Object["freeze"]({'value':'1K','label':'1K'}),Object["freeze"]({'value':'2K','label':'2K'})])});

const APIMART_GPT_IMAGE_2_QUALITY_DESCRIPTION='quality\x0a图片质量\x0alow\x20-\x20快速省钱，轮廓够用\x0amedium\x20-\x20平衡\x0ahigh\x20-\x20最高精度（4K\x20+\x20high\x20耗时\x20>120s）';

export const GRSAI_NANO_BANANA_1K_IMAGE_SIZE_FIELD=Object["freeze"]({...IMAGE_SIZE_FIELD,'defaultValue':'1K','options':Object["freeze"]([Object['freeze']({'value':'1K','label':'1K'}),Object["freeze"]({'value':'2K','label':'2K','disabled':!![],'tooltip':"1K only"}),Object["freeze"]({'value':'4K','label':'4K','disabled':!![],'tooltip':'1K\x20only'})])});

export const GRSAI_NANO_BANANA_2K_IMAGE_SIZE_FIELD=Object['freeze']({...IMAGE_SIZE_FIELD,'defaultValue':'2K','options':Object["freeze"]([Object["freeze"]({'value':'1K','label':'1K','disabled':!![],'tooltip':'2K\x20only'}),Object['freeze']({'value':'2K','label':'2K'}),Object["freeze"]({'value':'4K','label':'4K','disabled':!![],'tooltip':"2K only"})])});
