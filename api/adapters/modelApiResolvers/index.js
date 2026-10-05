import {
  normalizeRatioLabelText,
  parseRatioLabel,
  resolveProviderRatioPayload,
} from '../../imageRatioPolicy.js';
import {
  applyApimartPrivateAvatarAssetsToUrls,
  supportsApimartPrivateAvatarAssets,
} from '../apimartPrivateAvatarAssetResolver.js';
import {
  isRunningHubModelWithoutImageSizeParam,
  normalizeImageSizeForProviderModel,
  shouldOmitImageSizeParam,
} from '../../../src/modules/imageModelCapabilities.js';
import {
  NANO_BANANA_FAMILIES,
  getNanoBananaAllowedRatioLabels,
  normalizeNanoBananaRatioForFamily,
  resolveNanoBananaSelectionFromModel,
} from '../../../src/modules/nanoBananaModeRules.js';
import { resolveModelExecution } from '../../../src/manifests/index.js';
const PPIO_MIN_PIXELS = 2560 * 1440,
  PPIO_MAX_PIXELS = 0x9ec290,
  PPIO_MIN_RATIO = 1 / 16,
  PPIO_MAX_RATIO = 16,
  PPIO_ALIGN_STEP = 64,
  PPIO_DEFAULT_SIZE = '2048x2048',
  PPIO_DEFAULT_QUALITY = '2K',
  PPIO_DEFAULT_RATIO = '1:1',
  PPIO_QUALITY_PIXEL_MAP = Object.freeze({
    '1K': 1024 * 1024,
    '2K': 2048 * 2048,
    '3K': 2560 * 2560,
    '4K': 2880 * 2880,
  }),
  PPIO_RATIO_OPTIONS = Object.freeze([
    Object.freeze({ label: '1:1', w: 1, h: 1 }),
    Object.freeze({ label: '9:16', w: 9, h: 16 }),
    Object.freeze({ label: '16:9', w: 16, h: 9 }),
    Object.freeze({ label: '3:4', w: 3, h: 4 }),
    Object.freeze({ label: '4:3', w: 4, h: 3 }),
    Object.freeze({ label: '3:2', w: 3, h: 2 }),
    Object.freeze({ label: '2:3', w: 2, h: 3 }),
    Object.freeze({ label: '5:4', w: 5, h: 4 }),
    Object.freeze({ label: '4:5', w: 4, h: 5 }),
    Object.freeze({ label: '21:9', w: 21, h: 9 }),
  ]),
  PPIO_RATIO_LABEL_SET = new Set(PPIO_RATIO_OPTIONS.map((item) => item.label)),
  RUNNINGHUB_MODEL_DIMENSION_MIN = 512,
  RUNNINGHUB_MODEL_DIMENSION_MAX = 8192,
  RUNNINGHUB_MODEL_DIMENSION_ALIGN = 8,
  RUNNINGHUB_MODEL_DEFAULT_QUALITY = '2K',
  RUNNINGHUB_MODEL_DEFAULT_RATIO = '1:1',
  RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP = Object.freeze({
    '1K': 1024 * 1024,
    '2K': 2048 * 2048,
    '3K': 2560 * 2560,
    '4K': 2880 * 2880,
  }),
  RUNNINGHUB_MODEL_RATIO_LIST = Object.freeze([
    '1:1',
    '9:16',
    '16:9',
    '3:4',
    '4:3',
    '3:2',
    '2:3',
    '5:4',
    '4:5',
    '21:9',
  ]),
  RUNNINGHUB_MODEL_RATIO_SET = new Set(RUNNINGHUB_MODEL_RATIO_LIST);
function stripPrefix(key, list) {
  const list2 = String(key || '').trim();
  return list2.startsWith(list) ? list2.slice(list.length) : list2;
}
function isPresentValue(index) {
  return index !== undefined && index !== null && String(index).trim() !== '';
}
const VEO3_MODEL_CHOICES = new Set(['fast', 'quality']),
  VEO3_IMAGE_GENERATION_TYPES = new Set(['frame', 'reference']),
  VIDU_Q3_VIDEO_MODELS = new Set(['viduq3-turbo', 'viduq3-pro']),
  VIDU_Q3_REFERENCE_MODELS = new Set(['viduq3', 'viduq3-mix']);
export function normalizeApimartGptImage2Resolution(result) {
  const data = String(result || '')
    .trim()
    .toUpperCase();
  if (data === '1K' || data === '2K' || data === '4K') return data.toLowerCase();
  return '2k';
}
export function normalizeApimartNanoBanana2Resolution(options) {
  const target = String(options || '')
    .trim()
    .toUpperCase();
  if (target === '1K' || target === '2K' || target === '4K') return target;
  return '2K';
}
function apimartGptImage2Image({ currentBody: currentBody2, payload: payload2 }) {
  return {
    ...currentBody2,
    resolution: normalizeApimartGptImage2Resolution(currentBody2.resolution || payload2.imageSize),
  };
}
function pickClosestPpioRatio(source, next) {
  const current = Number(source || 1) / Number(next || 1);
  let entry = PPIO_RATIO_OPTIONS[0],
    record = Number.POSITIVE_INFINITY;
  for (const handle of PPIO_RATIO_OPTIONS) {
    const state = Math.abs(handle.w / handle.h - current);
    state < record && ((record = state), (entry = handle));
  }
  return entry.label;
}
function normalizePpioQuality(config) {
  const scope = String(config || '')
    .trim()
    .toUpperCase();
  return PPIO_QUALITY_PIXEL_MAP[scope] ? scope : PPIO_DEFAULT_QUALITY;
}
function normalizePpioAspectRatioLabel(input) {
  const enabled = String(input || '').trim();
  if (!enabled) return PPIO_DEFAULT_RATIO;
  const list3 = normalizeRatioLabelText(enabled),
    output = list3.toLowerCase();
  if (output === 'auto' || output === 'adaptive' || list3 === '自适应' || list3 === '默认')
    return PPIO_DEFAULT_RATIO;
  if (!list3.includes(':')) return PPIO_DEFAULT_RATIO;
  const [value2, value3] = list3.split(':'),
    count = Number.parseFloat(value2),
    count2 = Number.parseFloat(value3);
  if (!(count > 0 && count2 > 0)) return PPIO_DEFAULT_RATIO;
  const closestPpioRatio = pickClosestPpioRatio(count, count2);
  return PPIO_RATIO_LABEL_SET.has(closestPpioRatio) ? closestPpioRatio : PPIO_DEFAULT_RATIO;
}
function calculatePpioSizeFromTargetPixels(value4, value5) {
  const [value6, value7] = String(value5 || PPIO_DEFAULT_RATIO).split(':'),
    value8 = Number.parseFloat(value6) || 1,
    value9 = Number.parseFloat(value7) || 1,
    value10 = Math.max(PPIO_MIN_RATIO, Math.min(PPIO_MAX_RATIO, value8 / value9)),
    value11 = Math.max(
      PPIO_MIN_PIXELS,
      Math.min(Number(value4) || PPIO_QUALITY_PIXEL_MAP['2K'], PPIO_MAX_PIXELS),
    );
  let value12 = Math.round(Math.sqrt(value11 / value10)),
    value13 = Math.round(value12 * value10);
  return (
    (value13 = Math.max(PPIO_ALIGN_STEP, Math.round(value13 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    (value12 = Math.max(PPIO_ALIGN_STEP, Math.round(value12 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    value13 + 'x' + value12
  );
}
function resolvePpioSize(value14, value15) {
  const ppioQuality = normalizePpioQuality(value14),
    ppioAspectRatioLabel = normalizePpioAspectRatioLabel(value15),
    value16 = PPIO_QUALITY_PIXEL_MAP[ppioQuality] || PPIO_QUALITY_PIXEL_MAP['2K'];
  return calculatePpioSizeFromTargetPixels(value16, ppioAspectRatioLabel) || PPIO_DEFAULT_SIZE;
}
function ppioImageSize({
  currentBody: currentBody3,
  payload: payload3,
  modelToken: modelToken2,
  finalUrls: finalUrls,
  executionManifest: executionManifest,
  modelManifest: modelManifest,
}) {
  const value17 = modelToken2 || stripPrefix(payload3.model, 'ppio/'),
    value18 = { ...currentBody3 },
    args = executionManifest?.extensions?.ppioImage || modelManifest?.extensions?.ppioImage || {};
  return (
    !payload3.suppressImageSize &&
      (value18.size = resolvePpioSize(
        payload3.imageSize,
        payload3.resolvedRatioLabel || payload3.aspectRatio,
      )),
    args.optimizePromptOptions && (value18.optimize_prompt_options = { ...args.optimizePromptOptions }),
    args.batchSizeField &&
      payload3.batchSize &&
      payload3.batchSize > 1 &&
      (value18[args.batchSizeField] = payload3.batchSize),
    finalUrls.length > 0 && (value18[args.imageInputField || 'image'] = finalUrls),
    value18
  );
}
function normalizeGrsaiImageModel(value19) {
  const enabled2 = String(value19 || '').trim();
  if (!enabled2) return 'nano-banana-pro-vt';
  return enabled2.replace(/^grsai\//i, '');
}
const GRSAI_NANO_BANANA_IMAGE_SIZE_SET = new Set(['1K', '2K']);
function getGrsaiNanoBananaSelection(value20) {
  const nanoBananaSelectionFromModel = resolveNanoBananaSelectionFromModel(value20, '2K', 'grsai');
  if (
    !nanoBananaSelectionFromModel ||
    nanoBananaSelectionFromModel.family === NANO_BANANA_FAMILIES.GPT_IMAGE_2
  )
    return null;
  return nanoBananaSelectionFromModel;
}
function getGrsaiImageSizePolicy(value21) {
  const modelExecution = resolveModelExecution(value21, { providerHint: 'grsai' }),
    value22 = modelExecution?.modelManifest?.extensions?.imageSizePolicy;
  return value22 && typeof value22 === 'object' ? value22 : null;
}
function normalizeGrsaiNanoBananaImageSize(value23, value24 = '') {
  const value25 = String(getGrsaiImageSizePolicy(value24)?.fixedSize || '')
    .trim()
    .toUpperCase();
  if (value25) return value25;
  const value26 = String(value23 || '')
    .trim()
    .toUpperCase();
  return GRSAI_NANO_BANANA_IMAGE_SIZE_SET.has(value26) ? value26 : '2K';
}
function getGrsaiGptImage2Policy(value27) {
  const modelExecution2 = resolveModelExecution(value27, { providerHint: 'grsai' }),
    value28 = modelExecution2?.modelManifest?.extensions?.gptImage2;
  return value28 && typeof value28 === 'object' && !Array.isArray(value28) ? value28 : null;
}
function getGrsaiGptImage2PixelSizesByRatio(value29) {
  const grsaiGptImage2Policy = getGrsaiGptImage2Policy(value29)?.pixelSizesByRatio;
  return grsaiGptImage2Policy &&
    typeof grsaiGptImage2Policy === 'object' &&
    !Array.isArray(grsaiGptImage2Policy)
    ? grsaiGptImage2Policy
    : {};
}
function normalizeGrsaiNanoBananaAspectRatio(value30, value31) {
  const ratioLabelText = normalizeRatioLabelText(value30),
    value32 = ratioLabelText.toLowerCase();
  if (
    !ratioLabelText ||
    value32 === 'auto' ||
    value32 === 'adaptive' ||
    value32 === 'default' ||
    ratioLabelText === '自适应' ||
    ratioLabelText === '默认'
  )
    return 'auto';
  const ratioLabel = parseRatioLabel(ratioLabelText);
  if (!ratioLabel) return 'auto';
  const value33 = ratioLabel.label,
    map = new Set(getNanoBananaAllowedRatioLabels(value31));
  return map.has(value33) ? value33 : normalizeNanoBananaRatioForFamily(value33, value31);
}
function normalizeGrsaiGptImage2ImageSize(value34, value35) {
  const grsaiGptImage2Policy2 = getGrsaiGptImage2Policy(value35),
    map2 = new Set(
      (Array.isArray(grsaiGptImage2Policy2?.allowedSizes) ? grsaiGptImage2Policy2.allowedSizes : ['1K']).map(
        (item2) =>
          String(item2 || '')
            .trim()
            .toUpperCase(),
      ),
    ),
    value36 = String(grsaiGptImage2Policy2?.defaultSize || '1K')
      .trim()
      .toUpperCase(),
    value37 = String(value34 || '')
      .trim()
      .toUpperCase();
  if (map2.has(value37)) return value37;
  return map2.has(value36) ? value36 : '1K';
}
function normalizePixelSize(value38) {
  const enabled3 = String(value38 || '')
    .trim()
    .match(/^(\d{2,5})\s*[xX]\s*(\d{2,5})$/);
  if (!enabled3) return '';
  return enabled3[1] + 'x' + enabled3[2];
}
function getGrsaiGptImage2RatioOptionsForSize(value39, value40) {
  const grsaiGptImage2PixelSizesByRatio = getGrsaiGptImage2PixelSizesByRatio(value40);
  return Object.keys(grsaiGptImage2PixelSizesByRatio)
    .filter((item3) => grsaiGptImage2PixelSizesByRatio[item3]?.[value39])
    .map((label2) => {
      const value41 = parseRatioLabel(label2) || { w: 1, h: 1 };
      return Object.freeze({ label: label2, value: value41.w / value41.h });
    });
}
function getDefaultGrsaiGptImage2PixelSize(value42, value43) {
  return value42['1:1']?.[value43] || value42['1:1']?.['1K'] || '1024x1024';
}
function pickClosestGrsaiGptImage2RatioLabel(value44, value45, value46) {
  const ratioLabel2 = parseRatioLabel(value44),
    value47 = ratioLabel2 ? ratioLabel2.w / ratioLabel2.h : 1,
    grsaiGptImage2RatioOptionsForSize = getGrsaiGptImage2RatioOptionsForSize(value45, value46);
  let value48 = grsaiGptImage2RatioOptionsForSize[0] || { label: '1:1', value: 1 },
    value49 = Number.POSITIVE_INFINITY;
  for (const el of grsaiGptImage2RatioOptionsForSize) {
    const value50 = Math.abs(value47 - el.value);
    value50 < value49 && ((value48 = el), (value49 = value50));
  }
  return value48?.label || '1:1';
}
function normalizeGrsaiGptImage2AspectRatio(value51, value52, value53) {
  const grsaiGptImage2PixelSizesByRatio2 = getGrsaiGptImage2PixelSizesByRatio(value53),
    pixelSize = normalizePixelSize(value51);
  if (pixelSize) return pixelSize;
  const ratioLabelText2 = normalizeRatioLabelText(value51),
    value54 = ratioLabelText2.toLowerCase();
  if (
    !ratioLabelText2 ||
    value54 === 'auto' ||
    value54 === 'adaptive' ||
    value54 === 'default' ||
    ratioLabelText2 === '自适应' ||
    ratioLabelText2 === '默认'
  )
    return getDefaultGrsaiGptImage2PixelSize(grsaiGptImage2PixelSizesByRatio2, value52);
  const ratioLabel3 = parseRatioLabel(ratioLabelText2),
    value55 = ratioLabel3?.label || '1:1',
    value56 = grsaiGptImage2PixelSizesByRatio2[value55]?.[value52];
  if (value56) return value56;
  const closestGrsaiGptImage2RatioLabel = pickClosestGrsaiGptImage2RatioLabel(value55, value52, value53);
  return (
    grsaiGptImage2PixelSizesByRatio2[closestGrsaiGptImage2RatioLabel]?.[value52] ||
    getDefaultGrsaiGptImage2PixelSize(grsaiGptImage2PixelSizesByRatio2, value52)
  );
}
function grsaiImage({
  payload: payload4,
  finalPrompt: finalPrompt2,
  modelToken: modelToken3,
  finalUrls: finalUrls2,
}) {
  const model = normalizeGrsaiImageModel(modelToken3 || payload4.model || 'nano-banana-pro-vt'),
    grsaiNanoBananaSelection = getGrsaiNanoBananaSelection(model),
    value57 = payload4.resolvedRatioLabel || payload4.aspectRatio,
    aspectRatio2 = grsaiNanoBananaSelection
      ? normalizeGrsaiNanoBananaAspectRatio(value57, grsaiNanoBananaSelection.family)
      : value57,
    imageSize2 = grsaiNanoBananaSelection
      ? normalizeGrsaiNanoBananaImageSize(payload4.imageSize, model)
      : payload4.imageSize || '2K';
  return {
    model: model,
    prompt: finalPrompt2,
    images: finalUrls2,
    replyType: 'json',
    ...(!payload4.suppressImageSize && !shouldOmitImageSizeParam(model) && { imageSize: imageSize2 }),
    ...(!payload4.suppressAspectRatio && aspectRatio2 && { aspectRatio: aspectRatio2 }),
  };
}
function grsaiGptImage2Image({
  payload: payload5,
  finalPrompt: finalPrompt3,
  modelToken: modelToken4,
  finalUrls: finalUrls3,
}) {
  const model2 = normalizeGrsaiImageModel(modelToken4 || payload5.model || 'gpt-image-2'),
    grsaiGptImage2ImageSize = normalizeGrsaiGptImage2ImageSize(payload5.imageSize, model2),
    aspectRatio3 = normalizeGrsaiGptImage2AspectRatio(
      payload5.resolvedRatioLabel || payload5.aspectRatio,
      grsaiGptImage2ImageSize,
      model2,
    );
  return {
    model: model2,
    prompt: finalPrompt3,
    images: finalUrls3,
    replyType: 'json',
    ...(!payload5.suppressAspectRatio && aspectRatio3 && { aspectRatio: aspectRatio3 }),
  };
}
function normalizeRunningHubModelId(value58) {
  return stripPrefix(value58, 'runninghub-model/');
}
function getRunningHubImageExecutionPolicy({
  executionManifest: executionManifest2,
  modelManifest: modelManifest2,
} = {}) {
  const value59 =
    executionManifest2?.extensions?.runningHubImage || modelManifest2?.extensions?.runningHubImage;
  return value59 && typeof value59 === 'object' && !Array.isArray(value59) ? value59 : {};
}
function normalizeRunningHubImageRoute(options2 = {}) {
  const value60 = String(options2?.rhModelRoute ?? options2?.generationParams?.rhModelRoute ?? '')
    .trim()
    .toLowerCase();
  return value60 || 'low';
}
function isPlainRunningHubPolicyObject(value61) {
  return value61 && typeof value61 === 'object' && !Array.isArray(value61);
}
function pickRunningHubRouteValue(value62, value63) {
  if (!isPlainRunningHubPolicyObject(value62)) return undefined;
  if (Object.prototype.hasOwnProperty.call(value62, value63)) return value62[value63];
  if (Object.prototype.hasOwnProperty.call(value62, 'default')) return value62.default;
  return undefined;
}
function pickRunningHubPolicyValue(value64, value65, value66) {
  const runningHubRouteValue = pickRunningHubRouteValue(value64?.[value65 + 'ByRoute'], value66);
  return runningHubRouteValue !== undefined ? runningHubRouteValue : value64?.[value65];
}
function mergeRunningHubRoutePolicyObject(value67, value68, value69) {
  const args2 = isPlainRunningHubPolicyObject(value67?.[value68]) ? value67[value68] : {},
    args3 = pickRunningHubRouteValue(value67?.[value68 + 'ByRoute'], value69);
  if (!isPlainRunningHubPolicyObject(args3)) return args2;
  return { ...args2, ...args3 };
}
function resolveRunningHubImageRoutePolicy(args4, value70 = {}) {
  const route = normalizeRunningHubImageRoute(value70);
  return {
    ...args4,
    route: route,
    textEndpoint: pickRunningHubPolicyValue(args4, 'textEndpoint', route),
    inputEndpoint: pickRunningHubPolicyValue(args4, 'inputEndpoint', route),
    omitResolution: pickRunningHubPolicyValue(args4, 'omitResolution', route),
    quality: pickRunningHubPolicyValue(args4, 'quality', route),
    omitAspectRatio: pickRunningHubPolicyValue(args4, 'omitAspectRatio', route),
    aspectRatioValueMap: pickRunningHubPolicyValue(args4, 'aspectRatioValueMap', route),
    omitAspectRatioWhenInput: pickRunningHubPolicyValue(args4, 'omitAspectRatioWhenInput', route),
    inputSlotBodyFields: pickRunningHubPolicyValue(args4, 'inputSlotBodyFields', route),
    constantParams: mergeRunningHubRoutePolicyObject(args4, 'constantParams', route),
    defaultParams: mergeRunningHubRoutePolicyObject(args4, 'defaultParams', route),
    bodyParamTypes: mergeRunningHubRoutePolicyObject(args4, 'bodyParamTypes', route),
    bodyParamInputModes: mergeRunningHubRoutePolicyObject(args4, 'bodyParamInputModes', route),
  };
}
function resolveRunningHubModelEndpoint({
  hasInputImages: hasInputImages2,
  executionManifest: executionManifest3,
  modelManifest: modelManifest3,
  payload: payload6,
}) {
  const runningHubImageRoutePolicy = resolveRunningHubImageRoutePolicy(
    getRunningHubImageExecutionPolicy({
      executionManifest: executionManifest3,
      modelManifest: modelManifest3,
    }),
    payload6,
  );
  if (!hasInputImages2) return runningHubImageRoutePolicy.textEndpoint || 'text-to-image';
  return runningHubImageRoutePolicy.inputEndpoint || 'image-to-image';
}
function normalizeRunningHubInputUrlsBySlot(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object' || Array.isArray(enabled4)) return {};
  return Object.fromEntries(
    Object.entries(enabled4)
      .map(([value71, value72]) => [String(value71 || '').trim(), String(value72 || '').trim()])
      .filter(([value73, value74]) => value73 && value74),
  );
}
function normalizeRunningHubBodyParamValue(value75, value76) {
  const value77 = String(value76 || 'string')
    .trim()
    .toLowerCase();
  if (value77 === 'boolean') {
    if (value75 === true || value75 === false) return value75;
    const value78 = String(value75 ?? '')
      .trim()
      .toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(value78)) return true;
    if (['false', '0', 'no', 'off', ''].includes(value78)) return false;
    return Boolean(value75);
  }
  if (value77 === 'integer') {
    const value79 = Number.parseInt(String(value75 ?? '').trim(), 10);
    return Number.isFinite(value79) ? value79 : null;
  }
  if (value77 === 'number') {
    const value80 = Number(value75);
    return Number.isFinite(value80) ? value80 : null;
  }
  return String(value75 ?? '').trim();
}
function normalizeRunningHubAspectRatioValueMap(value81) {
  return value81 && typeof value81 === 'object' && !Array.isArray(value81) ? value81 : {};
}
function hasRunningHubAspectRatioValueMap(value82) {
  return Object.keys(normalizeRunningHubAspectRatioValueMap(value82?.aspectRatioValueMap)).length > 0;
}
function resolveRunningHubMappedAspectRatio(value83, value84) {
  const enabled5 = String(value83 || '').trim();
  if (!enabled5) return '';
  const runningHubAspectRatioValueMap = normalizeRunningHubAspectRatioValueMap(value84?.aspectRatioValueMap),
    list4 = Object.entries(runningHubAspectRatioValueMap)
      .map(([value85, value86]) => [normalizeRatioLabelText(value85), String(value86 || '').trim()])
      .filter(([value87, value88]) => value87 && value88);
  if (list4.length === 0) return enabled5;
  const ratioLabelText3 = normalizeRatioLabelText(enabled5),
    value89 = list4.find(([value90]) => value90 === ratioLabelText3);
  if (value89) return value89[1];
  const value91 = ratioLabelText3.toLowerCase(),
    value92 = list4.find(([, value93]) => value93.toLowerCase() === value91);
  if (value92) return value92[1];
  const ratioLabel4 = parseRatioLabel(ratioLabelText3);
  if (!ratioLabel4) return enabled5;
  const value94 = ratioLabel4.w / ratioLabel4.h;
  let value95 = null,
    value96 = Number.POSITIVE_INFINITY;
  return (
    list4.forEach(([value97, value98]) => {
      const ratioLabel5 = parseRatioLabel(value97);
      if (!ratioLabel5) return;
      const value99 = Math.abs(ratioLabel5.w / ratioLabel5.h - value94);
      value99 < value96 && ((value95 = value98), (value96 = value99));
    }),
    value95 || enabled5
  );
}
function assignRunningHubInputSlotFields(value100, value101, value102) {
  const enabled6 =
    value101?.inputSlotBodyFields &&
    typeof value101.inputSlotBodyFields === 'object' &&
    !Array.isArray(value101.inputSlotBodyFields)
      ? value101.inputSlotBodyFields
      : null;
  if (!enabled6) return {};
  const runningHubInputUrlsBySlot = normalizeRunningHubInputUrlsBySlot(value102);
  return (
    Object.entries(enabled6).forEach(([value103, value104]) => {
      const value105 = String(value104 || '').trim(),
        value106 = runningHubInputUrlsBySlot[String(value103 || '').trim()];
      if (value105 && value106) value100[value105] = value106;
    }),
    runningHubInputUrlsBySlot
  );
}
function shouldIncludeRunningHubPolicyParam(value107, value108, enabled7) {
  const value109 =
      value108?.conditionalParams &&
      typeof value108.conditionalParams === 'object' &&
      !Array.isArray(value108.conditionalParams)
        ? value108.conditionalParams
        : {},
    enabled8 = String(value109[value107] || '').trim();
  if (!enabled8) return true;
  return !!enabled7?.[enabled8];
}
function shouldIncludeRunningHubParamForInputMode(value110, value111, enabled9) {
  const value112 =
      value111?.bodyParamInputModes &&
      typeof value111.bodyParamInputModes === 'object' &&
      !Array.isArray(value111.bodyParamInputModes)
        ? value111.bodyParamInputModes
        : {},
    enabled10 = String(value112[value110] || '')
      .trim()
      .toLowerCase();
  if (!enabled10) return true;
  if (enabled10 === 'textonly' || enabled10 === 'text-only') return !enabled9;
  if (enabled10 === 'inputonly' || enabled10 === 'input-only') return enabled9;
  return true;
}
function assignRunningHubPolicyParams(
  value113,
  value114,
  value115,
  value116,
  { hasInputImages: hasInputImages = false } = {},
) {
  const value117 =
    value115?.constantParams &&
    typeof value115.constantParams === 'object' &&
    !Array.isArray(value115.constantParams)
      ? value115.constantParams
      : {};
  Object.entries(value117).forEach(([value118, value119]) => {
    if (!shouldIncludeRunningHubPolicyParam(value118, value115, value116)) return;
    if (!shouldIncludeRunningHubParamForInputMode(value118, value115, hasInputImages)) return;
    value113[value118] = value119;
  });
  const value120 =
    value115?.bodyParamTypes &&
    typeof value115.bodyParamTypes === 'object' &&
    !Array.isArray(value115.bodyParamTypes)
      ? value115.bodyParamTypes
      : {};
  Object.entries(value120).forEach(([value121, value122]) => {
    if (Object.prototype.hasOwnProperty.call(value113, value121)) return;
    if (!Object.prototype.hasOwnProperty.call(value114 || {}, value121)) return;
    if (!shouldIncludeRunningHubPolicyParam(value121, value115, value116)) return;
    if (!shouldIncludeRunningHubParamForInputMode(value121, value115, hasInputImages)) return;
    const value123 = value114[value121];
    if (value123 === undefined || value123 === null) return;
    if (typeof value123 === 'string' && value123.trim() === '') return;
    const runningHubBodyParamValue = normalizeRunningHubBodyParamValue(value123, value122);
    if (runningHubBodyParamValue === null || runningHubBodyParamValue === '') return;
    value113[value121] = runningHubBodyParamValue;
  });
  const value124 =
    value115?.defaultParams &&
    typeof value115.defaultParams === 'object' &&
    !Array.isArray(value115.defaultParams)
      ? value115.defaultParams
      : {};
  Object.entries(value124).forEach(([value125, value126]) => {
    if (Object.prototype.hasOwnProperty.call(value113, value125)) return;
    if (!shouldIncludeRunningHubPolicyParam(value125, value115, value116)) return;
    if (!shouldIncludeRunningHubParamForInputMode(value125, value115, hasInputImages)) return;
    value113[value125] = value126;
  });
}
function normalizeRunningHubModelQuality(value127) {
  const value128 = String(value127 || '')
    .trim()
    .toUpperCase();
  return RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[value128] ? value128 : RUNNINGHUB_MODEL_DEFAULT_QUALITY;
}
function normalizeRunningHubModelRatio(value129) {
  const enabled11 = String(value129 || '').trim();
  if (!enabled11) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const list5 = normalizeRatioLabelText(enabled11),
    value130 = list5.toLowerCase();
  if (value130 === 'auto' || value130 === 'default' || value130 === 'original' || value130 === 'adaptive')
    return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  if (!list5.includes(':')) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const [value131, value132] = list5.split(':'),
    count3 = Number.parseFloat(value131),
    count4 = Number.parseFloat(value132);
  if (!(count3 > 0 && count4 > 0)) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const value133 = count3 + ':' + count4;
  return RUNNINGHUB_MODEL_RATIO_SET.has(value133) ? value133 : RUNNINGHUB_MODEL_DEFAULT_RATIO;
}
function alignRunningHubDimension(value134) {
  const value135 =
    Math.round(Number(value134 || 0) / RUNNINGHUB_MODEL_DIMENSION_ALIGN) * RUNNINGHUB_MODEL_DIMENSION_ALIGN;
  return Math.max(RUNNINGHUB_MODEL_DIMENSION_MIN, Math.min(RUNNINGHUB_MODEL_DIMENSION_MAX, value135));
}
function resolveRunningHubModelDimensions(value136, value137) {
  const runningHubModelQuality = normalizeRunningHubModelQuality(value136),
    runningHubModelRatio = normalizeRunningHubModelRatio(value137),
    [value138, value139] = runningHubModelRatio.split(':'),
    value140 = Number.parseFloat(value138) || 1,
    value141 = Number.parseFloat(value139) || 1,
    value142 =
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[runningHubModelQuality] ||
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[RUNNINGHUB_MODEL_DEFAULT_QUALITY],
    value143 = value140 / value141,
    value144 = Math.sqrt(value142 / value143),
    value145 = value144 * value143;
  return { width: alignRunningHubDimension(value145), height: alignRunningHubDimension(value144) };
}
function isAdaptiveRatioInput(value146) {
  const enabled12 = String(value146 || '').trim();
  if (!enabled12) return true;
  const list6 = normalizeRatioLabelText(enabled12),
    value147 = list6.toLowerCase();
  if (/^\d+x\d+$/i.test(list6)) return false;
  return (
    value147 === 'auto' ||
    value147 === 'default' ||
    value147 === 'adaptive' ||
    value147 === 'original' ||
    !list6.includes(':')
  );
}
function runninghubImage({
  payload: payload7,
  finalPrompt: finalPrompt4,
  modelToken: modelToken5,
  finalUrls: finalUrls4,
  finalUrlsBySlot: finalUrlsBySlot = {},
  executionManifest: executionManifest4,
  modelManifest: modelManifest4,
}) {
  const runningHubModelId = normalizeRunningHubModelId(modelToken5),
    quality = resolveRunningHubImageRoutePolicy(
      getRunningHubImageExecutionPolicy({
        executionManifest: executionManifest4,
        modelManifest: modelManifest4,
      }),
      payload7,
    ),
    model3 = modelManifest4?.modelId || 'runninghub-model/' + runningHubModelId,
    enabled13 = quality.omitResolution === true || isRunningHubModelWithoutImageSizeParam(payload7.model),
    imageSize3 =
      normalizeImageSizeForProviderModel({
        model: model3,
        provider: 'runninghub',
        imageSize: payload7.imageSize,
      }) || payload7.imageSize,
    value148 = { '1K': '1k', '2K': '2k', '4K': '4k' },
    resolution = value148[imageSize3] || '2k',
    providerRatioPayload = resolveProviderRatioPayload({
      provider: 'runninghub',
      model: 'runninghub-model/' + runningHubModelId,
      ratioLabel: payload7.resolvedRatioLabel || payload7.aspectRatio,
      imageSize: imageSize3,
      suppressAspectRatio: payload7.suppressAspectRatio,
    }),
    value149 = String(providerRatioPayload?.params?.aspectRatio || '').trim(),
    value150 = payload7.resolvedRatioLabel || payload7.aspectRatio,
    aspectRatio4 = resolveRunningHubMappedAspectRatio(
      hasRunningHubAspectRatioValueMap(quality) ? value150 || value149 : value149,
      quality,
    ),
    value151 = aspectRatio4.toLowerCase(),
    value152 =
      quality.aspectRatioMode === 'dimensions' ||
      modelManifest4?.extensions?.ratioPolicy?.capability === 'dimensions',
    width = value152
      ? providerRatioPayload?.ratioCapability === 'dimensions'
        ? {
            width: Number(providerRatioPayload?.params?.width) || 2048,
            height: Number(providerRatioPayload?.params?.height) || 2048,
          }
        : resolveRunningHubModelDimensions(imageSize3, payload7.aspectRatio)
      : null,
    enabled14 =
      value152 ||
      quality.omitAspectRatio === true ||
      (quality.omitAspectRatioWhenInput === true && finalUrls4.length > 0) ||
      payload7.suppressAspectRatio ||
      isAdaptiveRatioInput(value150) ||
      !aspectRatio4 ||
      value151 === 'auto' ||
      value151 === 'default' ||
      value151 === 'adaptive' ||
      value151 === 'original',
    value153 = {
      prompt: finalPrompt4 || '',
      ...(value152
        ? { width: width?.width || 2048, height: width?.height || 2048 }
        : !enabled13
          ? { resolution: resolution }
          : {}),
      ...(quality.quality ? { quality: quality.quality } : {}),
      ...(!enabled14 && { aspectRatio: aspectRatio4 }),
      ...(payload7.negativePrompt && { negativePrompt: payload7.negativePrompt }),
      ...(payload7.seed && { seed: payload7.seed }),
    },
    assignRunningHubInputSlotFields2 = assignRunningHubInputSlotFields(value153, quality, finalUrlsBySlot);
  return (
    assignRunningHubPolicyParams(value153, payload7, quality, assignRunningHubInputSlotFields2, {
      hasInputImages: finalUrls4.length > 0,
    }),
    finalUrls4.length > 0 && !quality.inputSlotBodyFields && (value153.imageUrls = finalUrls4),
    value153
  );
}
function normalizeSeedanceVideoSize(value154) {
  const enabled15 = String(value154 || '').trim();
  if (!enabled15 || enabled15 === 'auto' || enabled15 === 'default') return '16:9';
  return normalizeRatioLabelText(enabled15);
}
function normalizeSeedanceAspectRatio(value155) {
  return normalizeSeedanceVideoSize(value155 || '16:9');
}
function getApimartSeedanceVideoPolicy(value156) {
  const value157 = value156?.extensions?.seedanceVideo;
  return value157 && typeof value157 === 'object' && !Array.isArray(value157) ? value157 : {};
}
function normalizePositiveInteger(value158, value159) {
  const count5 = Number.parseInt(String(value158 ?? '').trim(), 10);
  return Number.isFinite(count5) && count5 >= 0 ? count5 : value159;
}
function normalizeInputList(list7) {
  return Array.isArray(list7) ? list7.map((item4) => String(item4 || '').trim()).filter(Boolean) : [];
}
function normalizeApimartVeo3ModelChoice(value160) {
  const value161 = String(value160 || '')
    .trim()
    .toLowerCase();
  return VEO3_MODEL_CHOICES.has(value161) ? value161 : 'fast';
}
function getApimartVeo3ModelChoice(options3 = {}) {
  return normalizeApimartVeo3ModelChoice(options3?.generationParams?.mode ?? options3?.mode);
}
function normalizeApimartVeo3GenerationType(value162, { modelChoice: modelChoice = 'fast' } = {}) {
  const value163 = String(value162 || '')
      .trim()
      .toLowerCase(),
    value164 = VEO3_IMAGE_GENERATION_TYPES.has(value163) ? value163 : 'frame';
  if (normalizeApimartVeo3ModelChoice(modelChoice) === 'quality') return 'frame';
  return value164;
}
function getApimartVeo3GenerationType(options4 = {}) {
  const modelChoice2 = getApimartVeo3ModelChoice(options4);
  return normalizeApimartVeo3GenerationType(
    options4?.generationParams?.generation_type ?? options4?.generation_type,
    { modelChoice: modelChoice2 },
  );
}
function validateApimartVeo3ImageCount(
  options5 = {},
  value165 = 0,
  { allowTextOnly: allowTextOnly = false } = {},
) {
  const ok = Math.max(0, Math.trunc(Number(value165) || 0));
  if (allowTextOnly && ok === 0) return Object.freeze({ ok: true, message: '' });
  const apimartVeo3GenerationType = getApimartVeo3GenerationType(options5);
  if (apimartVeo3GenerationType === 'reference')
    return Object.freeze({
      ok: ok <= 3,
      message: ok <= 3 ? '' : 'VEO3 参考图模式最多接入 3 张图片',
    });
  return Object.freeze({
    ok: ok <= 2,
    message: ok <= 2 ? '' : 'VEO3 首尾帧模式最多接入 2 张图片',
  });
}
function collectVideoInputUrls(value166) {
  return Array.from(
    new Set(
      [
        String(value166.videoUrl || '').trim(),
        ...normalizeInputList(value166.videos),
        ...normalizeInputList(value166.videoUrls),
      ].filter(Boolean),
    ),
  );
}
function collectAudioInputUrls(value167) {
  return Array.from(
    new Set(
      [
        String(value167.audioUrl || '').trim(),
        ...normalizeInputList(value167.audios),
        ...normalizeInputList(value167.audioUrls),
      ].filter(Boolean),
    ),
  );
}
async function resolveInputVideos(value168, value169, value170) {
  const list8 = collectVideoInputUrls(value168);
  if (list8.length === 0) return [];
  if (typeof value170.processInputVideos !== 'function')
    throw new Error('APIMART video input upload is not available');
  const list9 = await value170.processInputVideos(list8, value169, {
    provider: 'apimart',
    strictUpload: true,
  });
  if (!Array.isArray(list9) || list9.length === 0) throw new Error('APIMART video upload failed');
  return list9.map((item5) => String(item5 || '').trim()).filter(Boolean);
}
async function resolveInputAudios(value171, value172, value173) {
  const list10 = collectAudioInputUrls(value171);
  if (list10.length === 0) return [];
  if (typeof value173.processInputAudios !== 'function')
    throw new Error('APIMART audio input upload is not available');
  const list11 = await value173.processInputAudios(list10, value172, {
    provider: 'apimart',
    strictUpload: true,
  });
  if (!Array.isArray(list11) || list11.length === 0) throw new Error('APIMART audio upload failed');
  return list11.map((item6) => String(item6 || '').trim()).filter(Boolean);
}
async function apimartSeedanceVideo({
  payload: payload8,
  finalPrompt: finalPrompt5,
  modelToken: modelToken6,
  apiKey: apiKey,
  ctx: ctx,
  executionManifest: executionManifest5,
}) {
  const model4 = modelToken6 || stripPrefix(payload8.model, 'apimart/'),
    apimartSeedanceVideoPolicy = getApimartSeedanceVideoPolicy(executionManifest5),
    enabled16 = supportsApimartPrivateAvatarAssets(model4, apimartSeedanceVideoPolicy),
    enabled17 = apimartSeedanceVideoPolicy.supportsVideoReferences === true,
    enabled18 = apimartSeedanceVideoPolicy.supportsAudioReferences === true,
    list12 = applyApimartPrivateAvatarAssetsToUrls(collectVideoInputUrls(payload8), payload8, {
      sourceKind: 'video',
      enabled: enabled16,
    });
  if (!enabled17 && list12.length > 0)
    throw new Error('APIMart Seedance model does not support video references');
  const list13 = list12.length > 0 && enabled17 ? await resolveInputVideos(payload8, apiKey, ctx) : [],
    list14 = applyApimartPrivateAvatarAssetsToUrls(
      [
        String(payload8.first || payload8.firstFrameUrl || '').trim(),
        String(payload8.last || payload8.lastFrameUrl || '').trim(),
      ].filter(Boolean),
      payload8,
      { sourceKind: 'image', enabled: enabled16 },
    ),
    positiveInteger = normalizePositiveInteger(apimartSeedanceVideoPolicy.maxRoleImageCount, 2);
  if (list14.length > positiveInteger)
    throw new Error(
      apimartSeedanceVideoPolicy.roleImageLimitError ||
        'APIMart Seedance model does not support this many role images',
    );
  let list15 = [];
  if (list14.length > 0) {
    const value174 = await ctx.processInputImages(list14, apiKey, {
      applyInputQualityProfile: true,
      provider: 'apimart',
      strictUpload: true,
    });
    list15 = [
      value174?.[0] ? { url: String(value174[0]).trim(), role: 'first_frame' } : null,
      value174?.[1] ? { url: String(value174[1]).trim(), role: 'last_frame' } : null,
    ].filter(Boolean);
  }
  const value175 = Array.isArray(payload8.images)
      ? payload8.images
      : Array.isArray(payload8.inputUrls)
        ? payload8.inputUrls
        : [],
    list16 = applyApimartPrivateAvatarAssetsToUrls(value175, payload8, {
      sourceKind: 'image',
      enabled: enabled16,
    }),
    list17 =
      list16.length > 0 && list15.length <= 0
        ? await ctx.processInputImages(list16, apiKey, {
            applyInputQualityProfile: true,
            provider: 'apimart',
            strictUpload: true,
          })
        : [],
    list18 = applyApimartPrivateAvatarAssetsToUrls(collectAudioInputUrls(payload8), payload8, {
      sourceKind: 'audio',
      enabled: enabled16,
    });
  if (!enabled18 && list18.length > 0)
    throw new Error('APIMart Seedance model does not support audio references');
  const list19 = enabled18 && list18.length > 0 ? await resolveInputAudios(payload8, apiKey, ctx) : [],
    value176 = {
      model: model4,
      prompt: finalPrompt5,
      duration: payload8.duration || 5,
      resolution: payload8.resolution || apimartSeedanceVideoPolicy.defaultResolution || '720p',
    };
  apimartSeedanceVideoPolicy.ratioField === 'size'
    ? (value176.size = normalizeSeedanceVideoSize(
        payload8.resolvedRatioLabel || payload8.aspectRatio || payload8.size,
      ))
    : (value176.aspect_ratio = normalizeSeedanceAspectRatio(
        payload8.resolvedRatioLabel || payload8.aspectRatio || payload8.aspect_ratio,
      ));
  if (isPresentValue(payload8.seed)) value176.seed = payload8.seed;
  apimartSeedanceVideoPolicy.supportsGenerateAudioParam === true &&
    (payload8.audio === true || payload8.generateAudio === true) &&
    (value176.audio = true);
  apimartSeedanceVideoPolicy.supportsCameraFixedParam === true &&
    payload8.camerafixed === true &&
    (value176.camerafixed = true);
  if (list15.length > 0) value176.image_with_roles = list15;
  else {
    if (list17.length > 0) {
      const positiveInteger2 = normalizePositiveInteger(apimartSeedanceVideoPolicy.maxImageCount, 1);
      value176.image_urls = list17.slice(0, positiveInteger2);
    }
  }
  return (
    enabled17 &&
      list15.length <= 0 &&
      list13.length > 0 &&
      (value176.video_urls = list13.slice(
        0,
        normalizePositiveInteger(apimartSeedanceVideoPolicy.maxVideoReferenceCount, 3),
      )),
    enabled18 &&
      list15.length <= 0 &&
      list19.length > 0 &&
      (value176.audio_urls = list19.slice(
        0,
        normalizePositiveInteger(apimartSeedanceVideoPolicy.maxAudioReferenceCount, 3),
      )),
    value176
  );
}
function apimartOmniFlashVideo({ currentBody: currentBody4 }) {
  const value177 = { ...currentBody4 };
  return (normalizeInputList(value177.video_urls).length > 0 && delete value177.duration, value177);
}
function apimartVeo3Video({
  currentBody: currentBody5,
  inputImages: inputImages = [],
  payload: payload = {},
}) {
  const value178 = { ...currentBody5 },
    list20 = normalizeInputList(inputImages),
    mode = getApimartVeo3ModelChoice(payload),
    generation_type = getApimartVeo3GenerationType(payload);
  ((value178.duration = 8), delete value178.official_fallback);
  const value179 = String(value178.resolution || '')
    .trim()
    .toLowerCase();
  if (value178.enable_gif === true && (value179 === '1080p' || value179 === '4k'))
    throw new Error('APIMart VEO3 GIF output only supports 720p resolution');
  const error = validateApimartVeo3ImageCount(
    { generationParams: { mode: mode, generation_type: generation_type } },
    list20.length,
    { allowTextOnly: true },
  );
  if (!error.ok) throw new Error(error.message);
  if (list20.length === 0) return (delete value178.generation_type, delete value178.image_urls, value178);
  return (
    (value178.generation_type = generation_type === 'reference' ? 'reference' : 'frame'),
    (value178.image_urls =
      value178.generation_type === 'reference' ? list20.slice(0, 3) : list20.slice(0, 2)),
    value178
  );
}
function apimartHappyHorseVideo({
  currentBody: currentBody6,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value180 = { ...currentBody6 },
    enabled19 = String(value180.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!enabled19) throw new Error('HappyHorse 1.0 prompt is required');
  const list21 = normalizeInputList(inputImages),
    list22 = normalizeInputList(inputVideos),
    runningHubInputUrlsBySlot2 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    handler = (list23 = [], value181 = []) => {
      const list24 = [],
        handler2 = (value182) => {
          const value183 = String(value182 || '').trim();
          if (value183 && !list24.includes(value183)) list24.push(value183);
        };
      return (
        list23.forEach((item7) => handler2(runningHubInputUrlsBySlot2[item7])),
        normalizeInputList(value181).forEach(handler2),
        list24
      );
    };
  let value184 = String(
    payload?.generationParams?.happyhorse_mode || payload?.happyhorse_mode || 'auto',
  ).trim();
  const enabled20 =
    list21.length > 0 || list22.length > 0 || Object.keys(runningHubInputUrlsBySlot2).length > 0;
  (value184 === 'image' || value184 === 'reference' || value184 === 'edit') &&
    !enabled20 &&
    (value184 = 'auto');
  delete value180.happyhorse_mode;
  if (value184 === 'edit') {
    if (!list22[0]) throw new Error('HappyHorse 1.0 video edit requires video_url input');
    const list25 = handler(['editRefImage'], list21);
    value180.video_url = list22[0];
    if (list25.length > 0) value180.image_urls = list25.slice(0, 5);
    const value185 = String(payload?.generationParams?.audio_setting || payload?.audio_setting || '').trim();
    return (
      (value185 === 'auto' || value185 === 'origin') && (value180.audio_setting = value185),
      delete value180.first_frame_image,
      delete value180.size,
      delete value180.duration,
      value180
    );
  }
  delete value180.audio_setting;
  if (value184 === 'image') {
    const enabled21 = handler(['firstFrame'], list21);
    if (!enabled21[0]) throw new Error('HappyHorse 1.0 image-to-video requires first_frame_image input');
    return (
      (value180.first_frame_image = enabled21[0]),
      delete value180.image_urls,
      delete value180.video_url,
      delete value180.size,
      value180
    );
  }
  if (value184 === 'reference') {
    const list26 = handler(['referenceImage'], list21);
    if (list26.length <= 0) throw new Error('HappyHorse 1.0 reference mode requires image_urls input');
    return (
      (value180.image_urls = list26.slice(0, 9)),
      delete value180.first_frame_image,
      delete value180.video_url,
      value180
    );
  }
  if (value184 !== 'auto') throw new Error('Unsupported HappyHorse 1.0 mode: ' + value184);
  if (list21.length > 0 || list22.length > 0)
    throw new Error('HappyHorse 1.0 media inputs require an explicit mode selection');
  return (delete value180.first_frame_image, delete value180.image_urls, delete value180.video_url, value180);
}
const RUNNINGHUB_HAPPYHORSE_ENDPOINTS = Object.freeze({
  text: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
  reference: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/reference-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/video-edit',
});
function normalizeHappyHorseGenerationMode(value186) {
  const value187 = String(value186 || '')
    .trim()
    .toLowerCase();
  return value187 === 'image' || value187 === 'reference' || value187 === 'edit' ? value187 : 'auto';
}
function getRunningHubHappyHorseMode(options6 = {}, value188 = {}) {
  return normalizeHappyHorseGenerationMode(
    value188.happyhorse_mode || options6?.generationParams?.happyhorse_mode || options6?.happyhorse_mode,
  );
}
function normalizeRunningHubHappyHorseAudioSettingValue(value189) {
  const value190 = String(value189 || '')
    .trim()
    .toLowerCase();
  return value190 === 'origin' ? 'origin' : 'auto';
}
function runninghubHappyHorseVideo({
  currentBody: currentBody7,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value191 = { ...currentBody7 },
    enabled22 = String(value191.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!enabled22) throw new Error('RunningHub HappyHorse 1.0 prompt is required');
  const list27 = normalizeInputList(inputImages),
    list28 = normalizeInputList(inputVideos),
    runningHubInputUrlsBySlot3 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    handler3 = (list29 = [], value192 = []) => {
      const list30 = [],
        handler4 = (value193) => {
          const value194 = String(value193 || '').trim();
          if (value194 && !list30.includes(value194)) list30.push(value194);
        };
      return (
        list29.forEach((item8) => handler4(runningHubInputUrlsBySlot3[item8])),
        normalizeInputList(value192).forEach(handler4),
        list30
      );
    };
  let runningHubHappyHorseMode = getRunningHubHappyHorseMode(payload, value191);
  const enabled23 =
    list27.length > 0 || list28.length > 0 || Object.keys(runningHubInputUrlsBySlot3).length > 0;
  runningHubHappyHorseMode !== 'auto' && !enabled23 && (runningHubHappyHorseMode = 'auto');
  ((value191.prompt = enabled22),
    delete value191.happyhorse_mode,
    delete value191.imageUrl,
    delete value191.imageUrls,
    delete value191.videoUrl);
  if (runningHubHappyHorseMode === 'edit') {
    if (!list28[0]) throw new Error('RunningHub HappyHorse 1.0 video edit requires videoUrl input');
    const list31 = handler3(['editRefImage'], list27);
    value191.videoUrl = list28[0];
    if (list31.length > 0) value191.imageUrls = list31.slice(0, 5);
    return (
      (value191.audioSetting = normalizeRunningHubHappyHorseAudioSettingValue(
        value191.audioSetting ??
          payload?.generationParams?.audioSetting ??
          payload?.generationParams?.audio_setting ??
          payload?.audioSetting ??
          payload?.audio_setting,
      )),
      delete value191.aspectRatio,
      delete value191.duration,
      delete value191.imageUrl,
      value191
    );
  }
  delete value191.audioSetting;
  if (runningHubHappyHorseMode === 'image') {
    const enabled24 = handler3(['firstFrame'], list27);
    if (!enabled24[0]) throw new Error('RunningHub HappyHorse 1.0 image-to-video requires imageUrl input');
    return (
      (value191.imageUrl = enabled24[0]),
      delete value191.imageUrls,
      delete value191.videoUrl,
      delete value191.aspectRatio,
      value191
    );
  }
  if (runningHubHappyHorseMode === 'reference') {
    const list32 = handler3(['referenceImage'], list27);
    if (list32.length <= 0)
      throw new Error('RunningHub HappyHorse 1.0 reference mode requires imageUrls input');
    return (
      (value191.imageUrls = list32.slice(0, 9)),
      delete value191.imageUrl,
      delete value191.videoUrl,
      value191
    );
  }
  if (list27.length > 0 || list28.length > 0)
    throw new Error('RunningHub HappyHorse 1.0 media inputs require an explicit mode selection');
  return (delete value191.imageUrl, delete value191.imageUrls, delete value191.videoUrl, value191);
}
function hasRunningHubHappyHorseEndpointMedia({
  currentBody: currentBody = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
} = {}) {
  return (
    normalizeInputList(inputImages).length > 0 ||
    normalizeInputList(inputVideos).length > 0 ||
    Object.keys(normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot)).length > 0 ||
    Boolean(String(currentBody?.imageUrl || currentBody?.videoUrl || '').trim()) ||
    normalizeInputList(currentBody?.imageUrls).length > 0
  );
}
function runninghubHappyHorseVideoEndpoint(options7 = {}) {
  const { payload: payload = {}, currentBody: currentBody = {} } = options7;
  let runningHubHappyHorseMode2 = getRunningHubHappyHorseMode(payload, currentBody);
  return (
    runningHubHappyHorseMode2 !== 'auto' &&
      !hasRunningHubHappyHorseEndpointMedia(options7) &&
      (runningHubHappyHorseMode2 = 'auto'),
    RUNNINGHUB_HAPPYHORSE_ENDPOINTS[runningHubHappyHorseMode2] || RUNNINGHUB_HAPPYHORSE_ENDPOINTS.text
  );
}
const RUNNINGHUB_SEEDANCE_2_ENDPOINTS = Object.freeze({
  fast: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video',
  }),
  standard: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/multimodal-video',
  }),
});
function normalizeRunningHubSeedance2Model(value195) {
  const value196 = String(value195 || '')
    .trim()
    .toLowerCase();
  return value196 === 'standard' || value196 === 'std' ? 'standard' : 'fast';
}
function normalizeRunningHubSeedance2Mode(value197) {
  const value198 = String(value197 || '')
    .trim()
    .toLowerCase();
  if (value198 === 'multimodal2video' || value198 === 'reference') return 'multimodal2video';
  if (value198 === 'frames2video' || value198 === 'frames') return 'frames2video';
  if (value198 === 'image2video' || value198 === 'image' || value198 === 'frame') return 'image2video';
  return 'text2video';
}
function getRunningHubSeedance2Model(options8 = {}, value199 = {}) {
  return normalizeRunningHubSeedance2Model(
    value199.rh_seedance_2_model ||
      options8?.generationParams?.rh_seedance_2_model ||
      options8?.rh_seedance_2_model,
  );
}
function getRunningHubSeedance2Mode(options9 = {}, value200 = {}) {
  return normalizeRunningHubSeedance2Mode(
    value200.rh_seedance_2_mode ||
      options9?.generationParams?.rh_seedance_2_mode ||
      options9?.rh_seedance_2_mode,
  );
}
function collectRunningHubSeedance2SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const value201 = [],
    runningHubInputUrlsBySlot4 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    map3 = new Set(normalizeInputList(Object.values(runningHubInputUrlsBySlot4)));
  return (
    slotIds.forEach((item9) => appendUniqueUrl(value201, runningHubInputUrlsBySlot4[item9])),
    normalizeInputList(inputImages).forEach((item10) => {
      if (!map3.has(item10)) appendUniqueUrl(value201, item10);
    }),
    value201
  );
}
function collectRunningHubSeedance2FrameImages(args5 = {}) {
  return collectRunningHubSeedance2SlotImages({ ...args5, slotIds: ['firstFrame', 'lastFrame'] });
}
function collectRunningHubSeedance2ReferenceImages(args6 = {}) {
  return collectRunningHubSeedance2SlotImages({ ...args6, slotIds: ['referenceImage'] });
}
function resolveRunningHubSeedance2Route({ payload: payload = {}, currentBody: currentBody = {} } = {}) {
  const model5 = getRunningHubSeedance2Model(payload, currentBody),
    runningHubSeedance2Mode = getRunningHubSeedance2Mode(payload, currentBody);
  if (runningHubSeedance2Mode === 'multimodal2video')
    return Object.freeze({ model: model5, route: 'reference' });
  if (runningHubSeedance2Mode === 'image2video' || runningHubSeedance2Mode === 'frames2video')
    return Object.freeze({ model: model5, route: 'image' });
  return Object.freeze({ model: model5, route: 'text' });
}
function removeRunningHubSeedance2TransientFields(value202) {
  (delete value202.rh_seedance_2_model,
    delete value202.rh_seedance_2_mode,
    delete value202.firstFrameUrl,
    delete value202.lastFrameUrl,
    delete value202.imageUrls,
    delete value202.videoUrls,
    delete value202.audioUrls);
}
function normalizeRunningHubSeedance2ConversionSlots(value203) {
  const list33 = Array.isArray(value203) ? value203 : ['all'],
    list34 = list33.map((item11) => String(item11 || '').trim()).filter(Boolean);
  return list34.length > 0 ? list34 : ['all'];
}
function runninghubSeedance2Video({
  currentBody: currentBody8,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value204 = { ...currentBody8 },
    enabled25 = String(value204.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!enabled25) throw new Error('RunningHub Seedance 2.0 prompt is required');
  const runningHubSeedance2Mode2 = getRunningHubSeedance2Mode(payload, value204),
    list35 = collectRunningHubSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    list36 = collectRunningHubSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    list37 = normalizeInputList(inputVideos),
    list38 = normalizeInputList(inputAudios),
    runningHubKlingV3RawMediaCount = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video'),
    runningHubKlingV3RawMediaCount2 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  ((value204.prompt = enabled25), removeRunningHubSeedance2TransientFields(value204));
  if (runningHubSeedance2Mode2 === 'multimodal2video') {
    if (list36.length + list37.length <= 0)
      throw new Error('RunningHub Seedance 2.0 multimodal mode requires image or video input');
    if (list36.length > 9)
      throw new Error('RunningHub Seedance 2.0 multimodal mode supports at most 9 image inputs');
    if (runningHubKlingV3RawMediaCount > 3)
      throw new Error('RunningHub Seedance 2.0 multimodal mode supports at most 3 video inputs');
    if (runningHubKlingV3RawMediaCount2 > 3)
      throw new Error('RunningHub Seedance 2.0 multimodal mode supports at most 3 audio inputs');
    if (list38.length > 0 && list36.length + list37.length <= 0)
      throw new Error('RunningHub Seedance 2.0 audio input requires image or video input');
    if (list36.length > 0) value204.imageUrls = list36.slice(0, 9);
    if (list37.length > 0) value204.videoUrls = list37.slice(0, 3);
    if (list38.length > 0) value204.audioUrls = list38.slice(0, 3);
    return (
      value204.realPersonMode === true
        ? (value204.conversionSlots = normalizeRunningHubSeedance2ConversionSlots(value204.conversionSlots))
        : delete value204.conversionSlots,
      delete value204.webSearch,
      value204
    );
  }
  if (runningHubKlingV3RawMediaCount > 0)
    throw new Error(
      'RunningHub Seedance 2.0 text/image/frame modes do not accept video input; use multimodal mode',
    );
  if (runningHubKlingV3RawMediaCount2 > 0)
    throw new Error(
      'RunningHub Seedance 2.0 text/image/frame modes do not accept audio input; use multimodal mode',
    );
  if (runningHubSeedance2Mode2 === 'text2video') {
    if (list35.length > 0)
      throw new Error('RunningHub Seedance 2.0 text-to-video mode does not accept image input');
    return (delete value204.realPersonMode, delete value204.conversionSlots, value204);
  }
  if (runningHubSeedance2Mode2 === 'image2video' && list35.length !== 1)
    throw new Error('RunningHub Seedance 2.0 image-to-video mode requires exactly 1 image input');
  if (runningHubSeedance2Mode2 === 'frames2video' && list35.length !== 2)
    throw new Error('RunningHub Seedance 2.0 first-last-frame mode requires exactly 2 image inputs');
  value204.firstFrameUrl = list35[0];
  if (list35[1]) value204.lastFrameUrl = list35[1];
  return (
    delete value204.webSearch,
    value204.realPersonMode === true
      ? (value204.conversionSlots = normalizeRunningHubSeedance2ConversionSlots(value204.conversionSlots))
      : delete value204.conversionSlots,
    value204
  );
}
function runninghubSeedance2VideoEndpoint({ payload: payload = {} }) {
  const { model: model6, route: route2 } = resolveRunningHubSeedance2Route({ payload: payload });
  return RUNNINGHUB_SEEDANCE_2_ENDPOINTS[model6]?.[route2] || RUNNINGHUB_SEEDANCE_2_ENDPOINTS.fast.text;
}
function normalizeVolcengineSeedance2Mode(value205) {
  return normalizeRunningHubSeedance2Mode(value205);
}
function getVolcengineSeedance2Mode(options10 = {}, value206 = {}) {
  return normalizeVolcengineSeedance2Mode(
    options10?.dreaminaRouteMode ||
      options10?.dreaminaTaskType ||
      options10?.generationParams?.dreaminaRouteMode ||
      value206.volcengine_seedance_2_mode ||
      options10?.generationParams?.volcengine_seedance_2_mode ||
      options10?.volcengine_seedance_2_mode,
  );
}
function resolveVolcengineSeedance2TaskType({
  routeMode: routeMode = '',
  frameImageCount: frameImageCount = 0,
  referenceImageCount: referenceImageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const volcengineSeedance2Mode = normalizeVolcengineSeedance2Mode(routeMode),
    positiveInteger3 = normalizePositiveInteger(frameImageCount, 0),
    positiveInteger4 = normalizePositiveInteger(referenceImageCount, 0),
    positiveInteger5 = normalizePositiveInteger(videoCount, 0),
    positiveInteger6 = normalizePositiveInteger(audioCount, 0);
  if (volcengineSeedance2Mode === 'frames2video') {
    if (positiveInteger3 >= 2) return 'frames2video';
    if (positiveInteger3 === 1) return 'image2video';
    return 'text2video';
  }
  if (volcengineSeedance2Mode === 'image2video') return 'image2video';
  if (volcengineSeedance2Mode === 'text2video') return 'text2video';
  if (positiveInteger4 > 0 || positiveInteger5 > 0 || positiveInteger6 > 0) return 'multimodal2video';
  return 'text2video';
}
function normalizeVolcengineSeedance2Resolution(value207, value208 = {}, value209 = '') {
  const value210 = String(value207 || value208.defaultResolution || '720p')
      .trim()
      .toLowerCase(),
    enabled26 = /fast/i.test(String(value209 || ''));
  if (value210 === '1080p' && !enabled26) return '1080p';
  if (value210 === '480p') return '480p';
  return '720p';
}
function normalizeVolcengineSeedance2Ratio(value211, value212 = {}) {
  const enabled27 = String(value211 || '').trim();
  if (!enabled27 || enabled27 === 'auto' || enabled27 === 'default' || enabled27 === '自适应')
    return value212.defaultRatio || 'adaptive';
  const ratioLabelText4 = normalizeRatioLabelText(enabled27);
  return ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'].includes(ratioLabelText4)
    ? ratioLabelText4
    : value212.defaultRatio || 'adaptive';
}
function normalizeVolcengineSeedance2Duration(value213, value214 = {}) {
  const value215 = Number(value213);
  if (value215 === -1) return -1;
  const positiveInteger7 = normalizePositiveInteger(value214.minDuration, 4),
    positiveInteger8 = normalizePositiveInteger(value214.maxDuration, 15);
  if (!Number.isFinite(value215)) return 5;
  return Math.max(positiveInteger7, Math.min(positiveInteger8, Math.trunc(value215)));
}
function normalizeVolcengineSeedance2Seed(value216) {
  if (!isPresentValue(value216)) return null;
  const value217 = Number.parseInt(String(value216).trim(), 10);
  return Number.isFinite(value217) ? value217 : null;
}
function getVolcengineSeedance2Policy(value218) {
  const value219 = value218?.extensions?.seedanceVideo;
  return value219 && typeof value219 === 'object' && !Array.isArray(value219) ? value219 : {};
}
function getVolcengineSlotMedia(options11 = {}, value220) {
  return String(normalizeRunningHubInputUrlsBySlot(options11)[value220] || '').trim();
}
function collectVolcengineSeedance2FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value221 = [];
  return (
    appendUniqueUrl(value221, getVolcengineSlotMedia(finalUrlsBySlot, 'firstFrame')),
    appendUniqueUrl(value221, getVolcengineSlotMedia(finalUrlsBySlot, 'lastFrame')),
    normalizeInputList(inputImages).forEach((item12) => appendUniqueUrl(value221, item12)),
    value221
  );
}
function collectVolcengineSeedance2ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value222 = [];
  appendUniqueUrl(value222, getVolcengineSlotMedia(finalUrlsBySlot, 'referenceImage'));
  const map4 = new Set(
    normalizeInputList(Object.values(normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot))),
  );
  return (
    normalizeInputList(inputImages).forEach((item13) => {
      if (!map4.has(item13)) appendUniqueUrl(value222, item13);
    }),
    value222
  );
}
function pushVolcengineContentItem(list39, type, value223, value224) {
  const url = String(value223 || '').trim();
  if (!url) return;
  const value225 = { type: type };
  if (type === 'image_url') value225.image_url = { url: url };
  else {
    if (type === 'video_url') value225.video_url = { url: url };
    else {
      if (type === 'audio_url') value225.audio_url = { url: url };
    }
  }
  if (value224) value225.role = value224;
  list39.push(value225);
}
function volcengineSeedance2Video({
  currentBody: currentBody9,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest6,
}) {
  const generate_audio = { ...currentBody9 },
    volcengineSeedance2Policy = getVolcengineSeedance2Policy(executionManifest6),
    text = String(generate_audio.prompt || finalPrompt || payload?.prompt || '').trim(),
    routeMode2 = getVolcengineSeedance2Mode(payload, generate_audio),
    frameImageCount2 = collectVolcengineSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    referenceImageCount2 = collectVolcengineSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    videoCount2 = normalizeInputList(inputVideos),
    audioCount2 = normalizeInputList(inputAudios),
    volcengineSeedance2TaskType = resolveVolcengineSeedance2TaskType({
      routeMode: routeMode2,
      frameImageCount: frameImageCount2.length,
      referenceImageCount: referenceImageCount2.length,
      videoCount: videoCount2.length,
      audioCount: audioCount2.length,
    }),
    content = [];
  if (text) content.push({ type: 'text', text: text });
  if (volcengineSeedance2TaskType === 'text2video') {
    if (!text) throw new Error('Volcengine Seedance 2.0 prompt is required');
    if (frameImageCount2.length > 0 || videoCount2.length > 0 || audioCount2.length > 0)
      throw new Error('Volcengine Seedance 2.0 text mode does not accept media input');
  } else {
    if (volcengineSeedance2TaskType === 'image2video') {
      if (videoCount2.length > 0 || audioCount2.length > 0)
        throw new Error('Volcengine Seedance 2.0 image mode does not accept video or audio input');
      if (frameImageCount2.length < 1)
        throw new Error('Volcengine Seedance 2.0 image mode requires 1 image input');
      pushVolcengineContentItem(content, 'image_url', frameImageCount2[0], 'first_frame');
    } else {
      if (volcengineSeedance2TaskType === 'frames2video') {
        if (videoCount2.length > 0 || audioCount2.length > 0)
          throw new Error('Volcengine Seedance 2.0 first-last-frame mode only accepts images');
        if (frameImageCount2.length < 2)
          throw new Error('Volcengine Seedance 2.0 first-last-frame mode requires 2 image inputs');
        (pushVolcengineContentItem(content, 'image_url', frameImageCount2[0], 'first_frame'),
          pushVolcengineContentItem(content, 'image_url', frameImageCount2[1], 'last_frame'));
      } else {
        const positiveInteger9 = normalizePositiveInteger(volcengineSeedance2Policy.maxImageCount, 9),
          positiveInteger10 = normalizePositiveInteger(volcengineSeedance2Policy.maxVideoReferenceCount, 3),
          positiveInteger11 = normalizePositiveInteger(volcengineSeedance2Policy.maxAudioReferenceCount, 3);
        if (referenceImageCount2.length + videoCount2.length <= 0)
          throw new Error('Volcengine Seedance 2.0 multimodal mode requires image or video input');
        if (referenceImageCount2.length > positiveInteger9)
          throw new Error('Volcengine Seedance 2.0 multimodal mode supports at most 9 image inputs');
        if (videoCount2.length > positiveInteger10)
          throw new Error('Volcengine Seedance 2.0 multimodal mode supports at most 3 video inputs');
        if (audioCount2.length > positiveInteger11)
          throw new Error('Volcengine Seedance 2.0 multimodal mode supports at most 3 audio inputs');
        (referenceImageCount2
          .slice(0, positiveInteger9)
          .forEach((item14) => pushVolcengineContentItem(content, 'image_url', item14, 'reference_image')),
          videoCount2
            .slice(0, positiveInteger10)
            .forEach((item15) => pushVolcengineContentItem(content, 'video_url', item15, 'reference_video')),
          audioCount2
            .slice(0, positiveInteger11)
            .forEach((item16) => pushVolcengineContentItem(content, 'audio_url', item16, 'reference_audio')));
      }
    }
  }
  if (content.length === 0) throw new Error('Volcengine Seedance 2.0 request content is empty');
  const volcengineSeedance2Seed = normalizeVolcengineSeedance2Seed(generate_audio.seed),
    value226 = {
      model: modelToken || generate_audio.model || stripPrefix(payload.model, 'volcengine/'),
      content: content,
      resolution: normalizeVolcengineSeedance2Resolution(
        generate_audio.resolution,
        volcengineSeedance2Policy,
        modelToken,
      ),
      ratio: normalizeVolcengineSeedance2Ratio(generate_audio.ratio, volcengineSeedance2Policy),
      duration: normalizeVolcengineSeedance2Duration(generate_audio.duration, volcengineSeedance2Policy),
      generate_audio: generate_audio.generate_audio !== false,
    };
  if (volcengineSeedance2Seed !== null) value226.seed = volcengineSeedance2Seed;
  return value226;
}
function apimartHailuo02Video({
  currentBody: currentBody10,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value227 = { ...currentBody10 },
    inputList = normalizeInputList(inputImages),
    runningHubInputUrlsBySlot5 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    value228 = Object.keys(runningHubInputUrlsBySlot5).length > 0;
  if (value228) {
    (delete value227.first_frame_image, delete value227.last_frame_image);
    if (runningHubInputUrlsBySlot5.firstFrame)
      value227.first_frame_image = runningHubInputUrlsBySlot5.firstFrame;
    if (runningHubInputUrlsBySlot5.lastFrame)
      value227.last_frame_image = runningHubInputUrlsBySlot5.lastFrame;
    return value227;
  }
  if (inputList[0]) value227.first_frame_image = inputList[0];
  if (inputList[1]) value227.last_frame_image = inputList[1];
  return value227;
}
function apimartHailuo23Video({
  currentBody: currentBody11,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
}) {
  const value229 = { ...currentBody11 };
  delete value229.last_frame_image;
  const inputList2 = normalizeInputList(inputImages),
    runningHubInputUrlsBySlot6 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    value230 = Object.keys(runningHubInputUrlsBySlot6).length > 0;
  if (value230) {
    delete value229.first_frame_image;
    if (runningHubInputUrlsBySlot6.firstFrame)
      value229.first_frame_image = runningHubInputUrlsBySlot6.firstFrame;
  } else inputList2[0] && (value229.first_frame_image = inputList2[0]);
  const value231 = String(modelToken || value229.model || '')
    .trim()
    .toLowerCase();
  if (value231 === 'minimax-hailuo-2.3-fast' && !String(value229.first_frame_image || '').trim())
    throw new Error('APIMart Hailuo 2.3 Fast requires first_frame_image input');
  return value229;
}
function apimartViduQ3Video({
  currentBody: currentBody12,
  inputImages: inputImages = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  modelToken: modelToken = '',
}) {
  const value232 = { ...currentBody12 },
    enabled28 = String(value232.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!enabled28) throw new Error('APIMart Vidu Q3 prompt is required');
  value232.prompt = enabled28;
  const value233 = String(
      payload?.generationParams?.vidu_q3_generation_mode || payload?.vidu_q3_generation_mode || 'video',
    )
      .trim()
      .toLowerCase(),
    value234 = String(modelToken || value232.model || 'viduq3-turbo')
      .trim()
      .toLowerCase(),
    list40 = normalizeInputList(inputImages),
    runningHubInputUrlsBySlot7 = normalizeRunningHubInputUrlsBySlot(payload?.inputUrlsBySlot),
    count6 = Math.max(
      list40.length,
      normalizeInputList(payload?.inputUrls).length,
      normalizeInputList(payload?.images).length,
      Object.keys(runningHubInputUrlsBySlot7).length,
    );
  if (value233 === 'reference') {
    if (!VIDU_Q3_REFERENCE_MODELS.has(value234))
      throw new Error('APIMart Vidu Q3 reference mode only supports viduq3 or viduq3-mix');
    if (list40.length < 1 || count6 > 7)
      throw new Error('APIMart Vidu Q3 reference mode requires 1-7 image inputs');
    return (
      (value232.model = value234),
      (value232.image_urls = list40.slice(0, 7)),
      delete value232.audio,
      value232
    );
  }
  if (!VIDU_Q3_VIDEO_MODELS.has(value234))
    throw new Error('APIMart Vidu Q3 video generation mode only supports viduq3-turbo or viduq3-pro');
  if (count6 > 2) throw new Error('APIMart Vidu Q3 video generation mode supports at most 2 image inputs');
  return (
    (value232.model = value234),
    list40.length > 0
      ? ((value232.image_urls = list40.slice(0, 2)), delete value232.aspect_ratio)
      : delete value232.image_urls,
    value232
  );
}
function normalizeKlingV3OmniMode(value235) {
  const value236 = String(value235 || '')
    .trim()
    .toLowerCase();
  return value236 === 'reference' || value236 === 'edit' ? value236 : 'image';
}
function appendUniqueUrl(list41, value237) {
  const value238 = String(value237 || '').trim();
  if (value238 && !list41.includes(value238)) list41.push(value238);
}
function normalizeKlingKeepOriginalSound(value239) {
  if (value239 === true || value239 === false) return value239;
  const value240 = String(value239 ?? '')
    .trim()
    .toLowerCase();
  return value240 === 'true' || value240 === '1' || value240 === 'yes';
}
function buildKlingV3OmniVideoItem(video_url, refer_type, value241 = false) {
  return {
    video_url: video_url,
    refer_type: refer_type,
    keep_original_sound: normalizeKlingKeepOriginalSound(value241) ? 'yes' : 'no',
  };
}
function normalizeKlingO1VideoRole(value242) {
  const value243 = String(value242 || '')
    .trim()
    .toLowerCase();
  if (value243 === 'feature' || value243 === 'feature_reference') return 'feature';
  return value243 === 'base' || value243 === 'edit' ? 'base' : '';
}
function replaceKlingO1PromptImageReferences(value244, value245) {
  const count7 = Math.max(0, Math.trunc(Number(value245) || 0));
  if (count7 <= 0) return String(value244 || '');
  return String(value244 || '').replace(/@?图片\s*([1-9]\d*)/g, (value246, value247) => {
    const count8 = Number.parseInt(String(value247 || ''), 10);
    if (!Number.isFinite(count8) || count8 < 1 || count8 > count7) return value246;
    return '<<<image_' + count8 + '>>>';
  });
}
function apimartKlingO1Video({
  currentBody: currentBody13,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
}) {
  const value248 = { ...currentBody13 },
    list42 = normalizeInputList(inputImages).slice(0, 2),
    list43 = normalizeInputList(inputVideos).slice(0, 1),
    klingO1VideoRole = normalizeKlingO1VideoRole(
      payload?.klingO1VideoRole ||
        payload?.kling_o1_video_role ||
        payload?.generationParams?.kling_o1_video_role,
    ),
    klingKeepOriginalSound = normalizeKlingKeepOriginalSound(
      value248.keep_original_sound ??
        payload?.generationParams?.keep_original_sound ??
        payload?.keep_original_sound,
    );
  (delete value248.kling_o1_video_role,
    delete value248.klingO1VideoRole,
    delete value248.keep_original_sound,
    delete value248.video_list);
  if (list43.length > 0) {
    const value249 = klingO1VideoRole || 'base';
    value248.video_list = [buildKlingV3OmniVideoItem(list43[0], value249, klingKeepOriginalSound)];
    if (value249 === 'base') {
      if (list42.length > 0) throw new Error('APIMart Kling O1 base video cannot be used with image_urls');
      return (
        delete value248.image_urls,
        delete value248.duration,
        delete value248.aspect_ratio,
        (value248.prompt = replaceKlingO1PromptImageReferences(value248.prompt, 0)),
        value248
      );
    }
    if (list42.length > 1) throw new Error('APIMart Kling O1 feature video supports at most one image_url');
    return (
      list42.length > 0 ? (value248.image_urls = list42.slice(0, 1)) : delete value248.image_urls,
      (value248.prompt = replaceKlingO1PromptImageReferences(
        value248.prompt,
        value248.image_urls?.length || 0,
      )),
      value248
    );
  }
  return (
    list42.length > 0 ? (value248.image_urls = list42) : delete value248.image_urls,
    (value248.prompt = replaceKlingO1PromptImageReferences(
      value248.prompt,
      value248.image_urls?.length || 0,
    )),
    value248
  );
}
const RUNNINGHUB_KLING_O1_ENDPOINTS = Object.freeze({
  text: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video',
  frames: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/start-to-end',
  reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/edit-video',
});
function normalizeRunningHubKlingO1GenerationMode(value250) {
  const value251 = String(value250 || '')
    .trim()
    .toLowerCase();
  if (value251 === 'reference' || value251 === 'edit') return value251;
  return 'frame';
}
function normalizeRunningHubKlingO1QualityMode(value252) {
  const value253 = String(value252 || '')
    .trim()
    .toLowerCase();
  return value253 === 'pro' ? 'pro' : 'std';
}
function normalizeRunningHubKlingO1AspectRatio(value254) {
  const value255 = String(value254 || '9:16').trim();
  return ['16:9', '9:16', '1:1'].includes(value255) ? value255 : '9:16';
}
function normalizeRunningHubKlingO1Duration(value256) {
  const value257 = Number(value256);
  return Number.isFinite(value257) && Math.trunc(value257) === 10 ? '10' : '5';
}
function getRunningHubKlingO1GenerationMode(options12 = {}, value258 = {}) {
  return normalizeRunningHubKlingO1GenerationMode(
    value258.rh_kling_o1_generation_mode ||
      options12?.generationParams?.rh_kling_o1_generation_mode ||
      options12?.rh_kling_o1_generation_mode,
  );
}
function collectRunningHubKlingO1FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value259 = [],
    runningHubInputUrlsBySlot8 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value259, runningHubInputUrlsBySlot8.firstFrame),
    appendUniqueUrl(value259, runningHubInputUrlsBySlot8.lastFrame),
    normalizeInputList(inputImages).forEach((item17) => appendUniqueUrl(value259, item17)),
    value259
  );
}
function collectRunningHubKlingO1ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value260 = [],
    runningHubInputUrlsBySlot9 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value260, runningHubInputUrlsBySlot9.referenceImage),
    normalizeInputList(inputImages).forEach((item18) => appendUniqueUrl(value260, item18)),
    value260
  );
}
function resolveRunningHubKlingO1Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const runningHubKlingO1GenerationMode = getRunningHubKlingO1GenerationMode(payload, currentBody);
  if (runningHubKlingO1GenerationMode === 'reference') return 'reference';
  if (runningHubKlingO1GenerationMode === 'edit') return 'edit';
  const runningHubKlingO1FrameImages = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  }).length;
  if (runningHubKlingO1FrameImages >= 2) return 'frames';
  if (runningHubKlingO1FrameImages === 1) return 'image';
  const inputList3 = normalizeInputList(inputVideos).length;
  return inputList3 > 0 ? 'reference' : 'text';
}
function runninghubKlingO1Video({
  currentBody: currentBody14,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value261 = { ...currentBody14 },
    runningHubKlingO1GenerationMode2 = getRunningHubKlingO1GenerationMode(payload, value261),
    klingKeepOriginalSound2 = normalizeKlingKeepOriginalSound(
      payload?.generationParams?.keepOriginalSound ??
        payload?.generationParams?.keep_original_sound ??
        payload?.keepOriginalSound ??
        payload?.keep_original_sound ??
        value261.keepOriginalSound ??
        value261.keep_original_sound,
    ),
    enabled29 = String(value261.prompt || payload?.prompt || '').trim();
  if (!enabled29) throw new Error('RunningHub Kling O1 prompt is required');
  ((value261.prompt = enabled29),
    (value261.mode = normalizeRunningHubKlingO1QualityMode(value261.mode)),
    (value261.aspectRatio = normalizeRunningHubKlingO1AspectRatio(value261.aspectRatio)),
    (value261.duration = normalizeRunningHubKlingO1Duration(value261.duration)),
    delete value261.rh_kling_o1_generation_mode,
    delete value261.keep_original_sound,
    delete value261.keepOriginalSound,
    delete value261.firstImageUrl,
    delete value261.lastImageUrl,
    delete value261.imageUrls,
    delete value261.videoUrl);
  const list44 = normalizeInputList(inputVideos),
    count9 = Math.max(
      list44.length,
      normalizeInputList(payload?.videos).length,
      normalizeInputList(payload?.videoUrls).length,
      String(payload?.videoUrl || '').trim() ? 1 : 0,
    );
  if (runningHubKlingO1GenerationMode2 === 'edit') {
    const list45 = [];
    (collectRunningHubKlingO1FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).forEach((item19) => appendUniqueUrl(list45, item19)),
      collectRunningHubKlingO1ReferenceImages({
        inputImages: inputImages,
        finalUrlsBySlot: finalUrlsBySlot,
      }).forEach((item20) => appendUniqueUrl(list45, item20)));
    if (list45.length > 0) throw new Error('RunningHub Kling O1 edit mode does not accept image input');
    if (count9 < 1 || !list44[0]) throw new Error('RunningHub Kling O1 edit mode requires 1 video input');
    if (count9 > 1) throw new Error('RunningHub Kling O1 edit mode supports at most 1 video input');
    return (
      (value261.mode = 'std'),
      (value261.videoUrl = list44[0]),
      (value261.keepOriginalSound = klingKeepOriginalSound2),
      delete value261.aspectRatio,
      delete value261.duration,
      value261
    );
  }
  if (runningHubKlingO1GenerationMode2 === 'reference') {
    const list46 = collectRunningHubKlingO1ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (list46.length < 1)
      throw new Error('RunningHub Kling O1 reference mode requires at least 1 image input');
    if (list46.length > 7)
      throw new Error('RunningHub Kling O1 reference mode supports at most 7 image inputs');
    if (count9 < 1 || !list44[0])
      throw new Error('RunningHub Kling O1 reference mode requires 1 video input');
    if (count9 > 1) throw new Error('RunningHub Kling O1 reference mode supports at most 1 video input');
    return (
      (value261.imageUrls = list46),
      (value261.videoUrl = list44[0]),
      (value261.keepOriginalSound = klingKeepOriginalSound2),
      (value261.prompt = replaceKlingO1PromptImageReferences(value261.prompt, list46.length)),
      value261
    );
  }
  const list47 = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list44.length > 0)
    throw new Error('RunningHub Kling O1 frame mode does not accept video input; use reference mode');
  if (list47.length > 2) throw new Error('RunningHub Kling O1 frame mode supports at most 2 image inputs');
  if (list47[0]) value261.firstImageUrl = list47[0];
  if (list47[1]) value261.lastImageUrl = list47[1];
  return ((value261.prompt = replaceKlingO1PromptImageReferences(value261.prompt, list47.length)), value261);
}
function runninghubKlingO1VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const runningHubKlingO1Route = resolveRunningHubKlingO1Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_O1_ENDPOINTS[runningHubKlingO1Route] || RUNNINGHUB_KLING_O1_ENDPOINTS.text;
}
const RUNNINGHUB_KLING_V3_ENDPOINTS = Object.freeze({
  std: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/image-to-video',
  }),
  pro: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/image-to-video',
  }),
  '4k': Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video',
  }),
});
function normalizeRunningHubKlingV3Model(value262) {
  const value263 = String(value262 || '')
    .trim()
    .toLowerCase();
  if (value263 === '4k') return '4k';
  if (value263 === 'pro') return 'pro';
  return 'std';
}
function getRunningHubKlingV3Model(options13 = {}, value264 = {}) {
  return normalizeRunningHubKlingV3Model(
    value264.rh_kling_v3_model || options13?.generationParams?.resolution || options13?.resolution,
  );
}
function collectRunningHubKlingV3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value265 = [],
    runningHubInputUrlsBySlot10 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value265, runningHubInputUrlsBySlot10.firstFrame),
    appendUniqueUrl(value265, runningHubInputUrlsBySlot10.lastFrame),
    normalizeInputList(inputImages).forEach((item21) => appendUniqueUrl(value265, item21)),
    value265
  );
}
function getRunningHubKlingV3RawMediaCount(options14 = {}, value266 = [], value267 = '') {
  const value268 = value267 === 'audio' ? 'audioUrl' : value267 + 'Url',
    value269 = value267 + 's',
    value270 = value267 + 'Urls';
  return Math.max(
    normalizeInputList(value266).length,
    normalizeInputList(options14?.[value269]).length,
    normalizeInputList(options14?.[value270]).length,
    String(options14?.[value268] || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubKlingV3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const model7 = getRunningHubKlingV3Model(payload, currentBody),
    route3 = collectRunningHubKlingV3FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).length;
  return { model: model7, route: route3 > 0 ? 'image' : 'text' };
}
function runninghubKlingV3Video({
  currentBody: currentBody15,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value271 = { ...currentBody15 },
    runningHubKlingV3Model = getRunningHubKlingV3Model(payload, value271),
    enabled30 = String(value271.prompt || payload?.prompt || '').trim();
  if (!enabled30) throw new Error('RunningHub Kling V3.0 prompt is required');
  const runningHubKlingV3RawMediaCount3 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video');
  if (runningHubKlingV3RawMediaCount3 > 0)
    throw new Error('RunningHub Kling V3.0 does not accept video input');
  const runningHubKlingV3RawMediaCount4 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  if (runningHubKlingV3RawMediaCount4 > 0)
    throw new Error('RunningHub Kling V3.0 does not accept audio input');
  ((value271.prompt = enabled30),
    delete value271.rh_kling_v3_model,
    delete value271.imageUrl,
    delete value271.firstImageUrl,
    delete value271.lastImageUrl,
    delete value271.imageUrls);
  const list48 = collectRunningHubKlingV3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list48.length > 2) throw new Error('RunningHub Kling V3.0 supports at most 2 image inputs');
  if (list48.length > 0) {
    delete value271.aspectRatio;
    if (runningHubKlingV3Model === '4k') {
      if (list48.length > 1)
        throw new Error('RunningHub Kling V3.0 4K image-to-video supports only one imageUrl');
      return ((value271.imageUrl = list48[0]), value271);
    }
    value271.firstImageUrl = list48[0];
    if (list48[1]) value271.lastImageUrl = list48[1];
  }
  return value271;
}
function runninghubKlingV3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { model: model8, route: route4 } = resolveRunningHubKlingV3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_V3_ENDPOINTS[model8]?.[route4] || RUNNINGHUB_KLING_V3_ENDPOINTS.std.text;
}
const RUNNINGHUB_KLING_O3_ENDPOINTS = Object.freeze({
  std: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/reference-to-video',
    edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/video-edit',
  }),
  pro: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/reference-to-video',
    edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/video-edit',
  }),
  '4k': Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/reference-to-video',
  }),
});
function normalizeRunningHubKlingO3GenerationMode(value272) {
  const value273 = String(value272 || '')
    .trim()
    .toLowerCase();
  if (value273 === 'reference' || value273 === 'edit') return value273;
  return 'frame';
}
function normalizeRunningHubKlingO3Model(value274) {
  const value275 = String(value274 || '')
    .trim()
    .toLowerCase();
  if (value275 === '4k') return '4k';
  if (value275 === 'pro') return 'pro';
  return 'std';
}
function getRunningHubKlingO3GenerationMode(options15 = {}, value276 = {}) {
  return normalizeRunningHubKlingO3GenerationMode(
    value276.kling_v3_omni_mode ||
      options15?.generationParams?.kling_v3_omni_mode ||
      options15?.kling_v3_omni_mode,
  );
}
function getRunningHubKlingO3Model(options16 = {}, value277 = {}) {
  return normalizeRunningHubKlingO3Model(
    value277.rh_kling_o3_model || options16?.generationParams?.resolution || options16?.resolution,
  );
}
function collectRunningHubKlingO3SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const value278 = [],
    runningHubInputUrlsBySlot11 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    map5 = new Set(normalizeInputList(Object.values(runningHubInputUrlsBySlot11)));
  return (
    slotIds.forEach((item22) => appendUniqueUrl(value278, runningHubInputUrlsBySlot11[item22])),
    normalizeInputList(inputImages).forEach((item23) => {
      if (!map5.has(item23)) appendUniqueUrl(value278, item23);
    }),
    value278
  );
}
function collectRunningHubKlingO3FrameImages(args7 = {}) {
  return collectRunningHubKlingO3SlotImages({ ...args7, slotIds: ['firstFrame', 'lastFrame'] });
}
function collectRunningHubKlingO3ReferenceImages(args8 = {}) {
  return collectRunningHubKlingO3SlotImages({ ...args8, slotIds: ['referenceImage'] });
}
function collectRunningHubKlingO3EditImages(args9 = {}) {
  return collectRunningHubKlingO3SlotImages({ ...args9, slotIds: ['editRefImage'] });
}
function resolveRunningHubKlingO3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const model9 = getRunningHubKlingO3Model(payload, currentBody),
    runningHubKlingO3GenerationMode = getRunningHubKlingO3GenerationMode(payload, currentBody);
  if (runningHubKlingO3GenerationMode === 'reference') return { model: model9, route: 'reference' };
  if (runningHubKlingO3GenerationMode === 'edit') return { model: model9, route: 'edit' };
  const route5 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  }).length;
  return { model: model9, route: route5 > 0 ? 'image' : 'text' };
}
function runninghubKlingO3Video({
  currentBody: currentBody16,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value279 = { ...currentBody16 },
    runningHubKlingO3Model = getRunningHubKlingO3Model(payload, value279),
    runningHubKlingO3GenerationMode2 = getRunningHubKlingO3GenerationMode(payload, value279),
    enabled31 = String(value279.prompt || payload?.prompt || '').trim();
  if (!enabled31) throw new Error('RunningHub Kling O3 prompt is required');
  const runningHubKlingV3RawMediaCount5 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  if (runningHubKlingV3RawMediaCount5 > 0)
    throw new Error('RunningHub Kling O3 does not accept direct audio input');
  const inputList4 = normalizeInputList(inputVideos),
    runningHubKlingV3RawMediaCount6 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video'),
    klingKeepOriginalSound3 = normalizeKlingKeepOriginalSound(
      value279.keepOriginalSound ??
        value279.keep_original_sound ??
        payload?.generationParams?.keepOriginalSound ??
        payload?.generationParams?.keep_original_sound ??
        payload?.keepOriginalSound ??
        payload?.keep_original_sound,
    );
  ((value279.prompt = enabled31),
    delete value279.kling_v3_omni_mode,
    delete value279.rh_kling_o3_model,
    delete value279.keep_original_sound,
    delete value279.keepOriginalSound,
    delete value279.firstImageUrl,
    delete value279.lastImageUrl,
    delete value279.imageUrl,
    delete value279.imageUrls,
    delete value279.videoUrl);
  if (runningHubKlingO3GenerationMode2 === 'edit') {
    if (runningHubKlingO3Model === '4k')
      throw new Error('RunningHub Kling O3 4K does not support video edit');
    if (runningHubKlingV3RawMediaCount6 < 1 || !inputList4[0])
      throw new Error('RunningHub Kling O3 edit mode requires 1 video input');
    if (runningHubKlingV3RawMediaCount6 > 1)
      throw new Error('RunningHub Kling O3 edit mode supports at most 1 video input');
    const list49 = collectRunningHubKlingO3EditImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (list49.length > 7) throw new Error('RunningHub Kling O3 edit mode supports at most 7 image inputs');
    value279.videoUrl = inputList4[0];
    if (list49.length > 0) value279.imageUrls = list49;
    return (
      (value279.keepOriginalSound = klingKeepOriginalSound3),
      delete value279.aspectRatio,
      delete value279.duration,
      delete value279.sound,
      delete value279.multiShot,
      delete value279.shotType,
      value279
    );
  }
  if (runningHubKlingO3GenerationMode2 === 'reference') {
    const list50 = collectRunningHubKlingO3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (list50.length < 1)
      throw new Error('RunningHub Kling O3 reference mode requires at least 1 image input');
    if (runningHubKlingV3RawMediaCount6 > 1)
      throw new Error('RunningHub Kling O3 reference mode supports at most 1 video input');
    if (inputList4[0] && list50.length > 4)
      throw new Error('RunningHub Kling O3 reference mode supports at most 4 image inputs with video input');
    if (list50.length > 7)
      throw new Error('RunningHub Kling O3 reference mode supports at most 7 image inputs');
    value279.imageUrls = list50;
    if (inputList4[0]) value279.videoUrl = inputList4[0];
    value279.keepOriginalSound = klingKeepOriginalSound3;
    if (runningHubKlingO3Model !== '4k') delete value279.shotType;
    return value279;
  }
  if (runningHubKlingV3RawMediaCount6 > 0)
    throw new Error('RunningHub Kling O3 frame mode does not accept video input; use reference or edit mode');
  const list51 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list51.length > 2) throw new Error('RunningHub Kling O3 frame mode supports at most 2 image inputs');
  if (runningHubKlingO3Model === '4k' && list51.length > 1)
    throw new Error('RunningHub Kling O3 4K image-to-video supports only one firstImageUrl');
  if (list51.length > 0) {
    (delete value279.aspectRatio, (value279.firstImageUrl = list51[0]));
    if (list51[1]) value279.lastImageUrl = list51[1];
  }
  return value279;
}
function runninghubKlingO3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { model: model10, route: route6 } = resolveRunningHubKlingO3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_O3_ENDPOINTS[model10]?.[route6] || RUNNINGHUB_KLING_O3_ENDPOINTS.std.text;
}
const RUNNINGHUB_HAILUO_02_ENDPOINTS = Object.freeze({
  t2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-standard',
  t2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-pro',
  i2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard',
  i2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-pro',
  i2vFast: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/fast',
});
function normalizeRunningHubHailuo02Quality(value280) {
  const value281 = String(value280 || '')
    .trim()
    .toLowerCase();
  if (value281 === 'pro') return 'pro';
  if (value281 === 'fast') return 'fast';
  return 'standard';
}
function normalizeRunningHubHailuo02Duration(value282) {
  const value283 = Number(value282);
  return Number.isFinite(value283) && Math.trunc(value283) === 10 ? '10' : '6';
}
function getRunningHubHailuo02Quality(options17 = {}, value284 = {}) {
  return normalizeRunningHubHailuo02Quality(
    value284.rh_hailuo_02_quality ||
      options17?.generationParams?.rh_hailuo_02_quality ||
      options17?.rh_hailuo_02_quality,
  );
}
function collectRunningHubHailuo02FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value285 = [],
    runningHubInputUrlsBySlot12 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value285, runningHubInputUrlsBySlot12.firstFrame),
    appendUniqueUrl(value285, runningHubInputUrlsBySlot12.lastFrame),
    normalizeInputList(inputImages).forEach((item24) => appendUniqueUrl(value285, item24)),
    value285
  );
}
function getRunningHubHailuo02RawVideoCount(options18 = {}, value286 = []) {
  return Math.max(
    normalizeInputList(value286).length,
    normalizeInputList(options18?.videos).length,
    normalizeInputList(options18?.videoUrls).length,
    String(options18?.videoUrl || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubHailuo02Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const runningHubHailuo02Quality = getRunningHubHailuo02Quality(payload, currentBody),
    runningHubHailuo02FrameImages = collectRunningHubHailuo02FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).length;
  if (runningHubHailuo02Quality === 'fast') return 'i2vFast';
  if (runningHubHailuo02Quality === 'pro') return runningHubHailuo02FrameImages > 0 ? 'i2vPro' : 't2vPro';
  return runningHubHailuo02FrameImages > 0 ? 'i2vStandard' : 't2vStandard';
}
function runninghubHailuo02Video({
  currentBody: currentBody17,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value287 = { ...currentBody17 },
    enabled32 = String(value287.prompt || payload?.prompt || '').trim();
  if (!enabled32) throw new Error('RunningHub Hailuo 02 prompt is required');
  const runningHubHailuo02Quality2 = getRunningHubHailuo02Quality(payload, value287),
    list52 = collectRunningHubHailuo02FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    runningHubHailuo02RawVideoCount = getRunningHubHailuo02RawVideoCount(payload, inputVideos);
  if (runningHubHailuo02RawVideoCount > 0)
    throw new Error('RunningHub Hailuo 02 does not accept video input');
  ((value287.prompt = enabled32),
    (value287.duration = normalizeRunningHubHailuo02Duration(value287.duration)),
    delete value287.rh_hailuo_02_quality,
    delete value287.firstImageUrl,
    delete value287.lastImageUrl,
    delete value287.imageUrl,
    delete value287.imageUrls,
    delete value287.videoUrl);
  if (runningHubHailuo02Quality2 === 'fast') {
    if (list52.length < 1) throw new Error('RunningHub Hailuo 02 Fast requires imageUrl input');
    if (list52.length > 1) throw new Error('RunningHub Hailuo 02 Fast supports only imageUrl input');
    return ((value287.imageUrl = list52[0]), value287);
  }
  if (runningHubHailuo02Quality2 === 'pro') {
    delete value287.duration;
    if (list52.length > 1) throw new Error('RunningHub Hailuo 02 Pro supports only firstImageUrl input');
    if (list52[0]) value287.firstImageUrl = list52[0];
    return value287;
  }
  if (list52.length > 2) throw new Error('RunningHub Hailuo 02 Standard supports at most 2 image inputs');
  if (list52[0]) value287.firstImageUrl = list52[0];
  if (list52[1]) value287.lastImageUrl = list52[1];
  return value287;
}
function runninghubHailuo02VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const runningHubHailuo02Route = resolveRunningHubHailuo02Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_HAILUO_02_ENDPOINTS[runningHubHailuo02Route] || RUNNINGHUB_HAILUO_02_ENDPOINTS.t2vStandard
  );
}
const RUNNINGHUB_HAILUO_23_ENDPOINTS = Object.freeze({
  t2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-standard',
  t2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro',
  i2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard',
  i2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/image-to-video-pro',
  i2vFast: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video',
  i2vFastPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast-pro/image-to-video',
});
function normalizeRunningHubHailuo23Quality(value288) {
  const value289 = String(value288 || '')
    .trim()
    .toLowerCase();
  if (value289 === 'pro') return 'pro';
  if (value289 === 'fast') return 'fast';
  if (value289 === 'fastpro' || value289 === 'fast-pro' || value289 === 'fast_pro') return 'fastPro';
  return 'standard';
}
function normalizeRunningHubHailuo23Duration(value290) {
  const value291 = Number(value290);
  return Number.isFinite(value291) && Math.trunc(value291) === 10 ? '10' : '6';
}
function getRunningHubHailuo23Quality(options19 = {}, value292 = {}) {
  return normalizeRunningHubHailuo23Quality(
    value292.rh_hailuo_23_quality ||
      options19?.generationParams?.rh_hailuo_23_quality ||
      options19?.rh_hailuo_23_quality,
  );
}
function collectRunningHubHailuo23FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value293 = [],
    runningHubInputUrlsBySlot13 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value293, runningHubInputUrlsBySlot13.firstFrame),
    normalizeInputList(inputImages).forEach((item25) => appendUniqueUrl(value293, item25)),
    value293
  );
}
function getRunningHubHailuo23RawVideoCount(options20 = {}, value294 = []) {
  return Math.max(
    normalizeInputList(value294).length,
    normalizeInputList(options20?.videos).length,
    normalizeInputList(options20?.videoUrls).length,
    String(options20?.videoUrl || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubHailuo23Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const runningHubHailuo23Quality = getRunningHubHailuo23Quality(payload, currentBody),
    runningHubHailuo23FrameImages = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).length;
  if (runningHubHailuo23Quality === 'fast') return 'i2vFast';
  if (runningHubHailuo23Quality === 'fastPro') return 'i2vFastPro';
  if (runningHubHailuo23Quality === 'pro') return runningHubHailuo23FrameImages > 0 ? 'i2vPro' : 't2vPro';
  return runningHubHailuo23FrameImages > 0 ? 'i2vStandard' : 't2vStandard';
}
function runninghubHailuo23Video({
  currentBody: currentBody18,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value295 = { ...currentBody18 },
    enabled33 = String(value295.prompt || payload?.prompt || '').trim();
  if (!enabled33) throw new Error('RunningHub Hailuo 2.3 prompt is required');
  const runningHubHailuo23Quality2 = getRunningHubHailuo23Quality(payload, value295),
    list53 = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    runningHubHailuo23RawVideoCount = getRunningHubHailuo23RawVideoCount(payload, inputVideos);
  if (runningHubHailuo23RawVideoCount > 0)
    throw new Error('RunningHub Hailuo 2.3 does not accept video input');
  if (list53.length > 1) throw new Error('RunningHub Hailuo 2.3 supports only imageUrl input');
  ((value295.prompt = enabled33),
    (value295.duration = normalizeRunningHubHailuo23Duration(value295.duration)),
    delete value295.rh_hailuo_23_quality,
    delete value295.firstImageUrl,
    delete value295.lastImageUrl,
    delete value295.imageUrl,
    delete value295.imageUrls,
    delete value295.videoUrl);
  if (runningHubHailuo23Quality2 === 'fast' || runningHubHailuo23Quality2 === 'fastPro') {
    if (!list53[0]) throw new Error('RunningHub Hailuo 2.3 Fast requires imageUrl input');
    return (
      (value295.imageUrl = list53[0]),
      runningHubHailuo23Quality2 === 'fastPro' && (value295.duration = '6'),
      value295
    );
  }
  runningHubHailuo23Quality2 === 'pro' && delete value295.duration;
  if (list53[0]) value295.imageUrl = list53[0];
  return value295;
}
function runninghubHailuo23VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const runningHubHailuo23Route = resolveRunningHubHailuo23Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_HAILUO_23_ENDPOINTS[runningHubHailuo23Route] || RUNNINGHUB_HAILUO_23_ENDPOINTS.t2vStandard
  );
}
const RUNNINGHUB_VEO3_ENDPOINTS = Object.freeze({
  lowCost: Object.freeze({
    text: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/text-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/text-to-video',
    }),
    image: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video',
    }),
    frames: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/start-end-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/start-end-to-video',
    }),
  }),
  official: Object.freeze({
    text: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/text-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/text-to-video',
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/text-to-video',
    }),
    image: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/image-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/image-to-video',
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/image-to-video',
    }),
    frames: Object.freeze({
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/start-end-to-video',
    }),
    reference: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/reference-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/reference-to-video',
    }),
    extend: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/video-extend',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/video-extend',
    }),
  }),
});
function normalizeRunningHubVeo3Channel(value296) {
  const value297 = String(value296 || '')
    .trim()
    .toLowerCase();
  if (value297 === 'official' || value297 === 'stable' || value297 === 'officialstable') return 'official';
  return 'lowCost';
}
function normalizeRunningHubVeo3Mode(value298, { channel: channel = 'lowCost' } = {}) {
  const value299 = String(value298 || '')
    .trim()
    .toLowerCase();
  if (value299 === 'quality' || value299 === 'pro') return 'pro';
  if (value299 === 'lite' && channel === 'official') return 'lite';
  return 'fast';
}
function getRunningHubVeo3Channel(options21 = {}, value300 = {}) {
  return normalizeRunningHubVeo3Channel(
    value300.rh_veo3_channel || options21?.generationParams?.rh_veo3_channel || options21?.rh_veo3_channel,
  );
}
function getRunningHubVeo3Mode(options22 = {}, value301 = {}) {
  const channel2 = getRunningHubVeo3Channel(options22, value301);
  return normalizeRunningHubVeo3Mode(value301.mode || options22?.generationParams?.mode || options22?.mode, {
    channel: channel2,
  });
}
function getRunningHubVeo3GenerationType(options23 = {}, value302 = {}) {
  const value303 = String(
    value302.generation_type ||
      options23?.generationParams?.generation_type ||
      options23?.generation_type ||
      'frame',
  )
    .trim()
    .toLowerCase();
  if (value303 === 'reference' || value303 === 'extend') return value303;
  return 'frame';
}
function collectRunningHubVeo3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value304 = [],
    runningHubInputUrlsBySlot14 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value304, runningHubInputUrlsBySlot14.firstFrame),
    appendUniqueUrl(value304, runningHubInputUrlsBySlot14.lastFrame),
    normalizeInputList(inputImages).forEach((item26) => appendUniqueUrl(value304, item26)),
    value304
  );
}
function collectRunningHubVeo3ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value305 = [],
    runningHubInputUrlsBySlot15 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value305, runningHubInputUrlsBySlot15.referenceImage),
    normalizeInputList(inputImages).forEach((item27) => appendUniqueUrl(value305, item27)),
    value305
  );
}
function getRunningHubVeo3RawVideoCount(options24 = {}, value306 = []) {
  return Math.max(
    normalizeInputList(value306).length,
    normalizeInputList(options24?.videos).length,
    normalizeInputList(options24?.videoUrls).length,
    String(options24?.videoUrl || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubVeo3Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const channel3 = getRunningHubVeo3Channel(payload, currentBody),
    mode2 = getRunningHubVeo3Mode(payload, currentBody),
    runningHubVeo3GenerationType = getRunningHubVeo3GenerationType(payload, currentBody);
  if (runningHubVeo3GenerationType === 'extend' || normalizeInputList(inputVideos).length > 0)
    return Object.freeze({ channel: channel3, mode: mode2, route: 'extend' });
  if (runningHubVeo3GenerationType === 'reference')
    return Object.freeze({ channel: channel3, mode: mode2, route: 'reference' });
  const list54 = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list54.length >= 2) return Object.freeze({ channel: channel3, mode: mode2, route: 'frames' });
  if (list54.length === 1)
    return Object.freeze({
      channel: channel3,
      mode: mode2,
      route: channel3 === 'lowCost' && mode2 === 'pro' ? 'frames' : 'image',
    });
  return Object.freeze({ channel: channel3, mode: mode2, route: 'text' });
}
function normalizeRunningHubVeo3BodyResolution(value307, { channel: channel4, mode: mode3 }) {
  const value308 = String(value307 || '720p')
    .trim()
    .toLowerCase();
  if (channel4 === 'lowCost') return '720p';
  if (mode3 === 'lite' && value308 === '4k') return '1080p';
  if (value308 === '4k' || value308 === '1080p') return value308;
  return '720p';
}
function normalizeRunningHubVeo3BodyDuration(value309, { channel: channel5, mode: mode4 }) {
  if (channel5 === 'lowCost') return '8';
  const count10 = Math.trunc(Number(value309));
  if (mode4 === 'lite') return count10 === 8 ? '8' : '6';
  return [4, 6, 8].includes(count10) ? String(count10) : '8';
}
function removeRunningHubVeo3TransientFields(value310) {
  (delete value310.rh_veo3_channel,
    delete value310.mode,
    delete value310.generation_type,
    delete value310.imageUrl,
    delete value310.imageUrls,
    delete value310.firstFrameUrl,
    delete value310.lastFrameUrl,
    delete value310.firstImageUrl,
    delete value310.lastImageUrl,
    delete value310.videoUrl,
    delete value310.video);
}
function runninghubVeo3Video({
  currentBody: currentBody19,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const currentBody20 = { ...currentBody19 },
    runningHubVeo3Route = resolveRunningHubVeo3Route({
      inputImages: inputImages,
      inputVideos: inputVideos,
      payload: payload,
      finalUrlsBySlot: finalUrlsBySlot,
      currentBody: currentBody20,
    }),
    { channel: channel6, mode: mode5, route: route7 } = runningHubVeo3Route,
    runningHubVeo3GenerationType2 = getRunningHubVeo3GenerationType(payload, currentBody20),
    runningHubVeo3RawVideoCount = getRunningHubVeo3RawVideoCount(payload, inputVideos);
  if (runningHubVeo3RawVideoCount > 0 && route7 !== 'extend')
    throw new Error('RunningHub Veo3 does not accept video input');
  const enabled34 = String(currentBody20.prompt || payload?.prompt || '').trim();
  if (route7 !== 'extend') {
    if (!enabled34) throw new Error('RunningHub Veo3 prompt is required');
    currentBody20.prompt = enabled34;
  }
  ((currentBody20.resolution = normalizeRunningHubVeo3BodyResolution(currentBody20.resolution, {
    channel: channel6,
    mode: mode5,
  })),
    (currentBody20.duration = normalizeRunningHubVeo3BodyDuration(currentBody20.duration, {
      channel: channel6,
      mode: mode5,
    })),
    removeRunningHubVeo3TransientFields(currentBody20));
  if (route7 === 'extend') {
    if (channel6 !== 'official' || mode5 === 'lite')
      throw new Error('RunningHub Veo3 video extend only supports official Fast or Pro');
    const inputList5 = normalizeInputList(inputVideos);
    if (runningHubVeo3RawVideoCount < 1 || !inputList5[0])
      throw new Error('RunningHub Veo3 video extend requires 1 video input');
    if (runningHubVeo3RawVideoCount > 1)
      throw new Error('RunningHub Veo3 video extend supports at most 1 video input');
    const list55 = [];
    (collectRunningHubVeo3FrameImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot }).forEach(
      (item28) => appendUniqueUrl(list55, item28),
    ),
      collectRunningHubVeo3ReferenceImages({
        inputImages: inputImages,
        finalUrlsBySlot: finalUrlsBySlot,
      }).forEach((item29) => appendUniqueUrl(list55, item29)));
    if (list55.length > 0) throw new Error('RunningHub Veo3 video extend does not accept image input');
    return (
      (currentBody20.video = inputList5[0]),
      delete currentBody20.prompt,
      delete currentBody20.duration,
      delete currentBody20.aspectRatio,
      delete currentBody20.generateAudio,
      currentBody20
    );
  }
  if (runningHubVeo3GenerationType2 === 'reference') {
    if (channel6 !== 'official' || mode5 === 'lite')
      throw new Error('RunningHub Veo3 reference mode only supports official Fast or Pro');
    const list56 = collectRunningHubVeo3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (list56.length < 1) throw new Error('RunningHub Veo3 reference mode requires 1-3 image inputs');
    if (list56.length > 3) throw new Error('RunningHub Veo3 reference mode supports at most 3 image inputs');
    ((currentBody20.imageUrls = list56), delete currentBody20.duration);
    if (mode5 === 'pro') delete currentBody20.aspectRatio;
    return currentBody20;
  }
  const list57 = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list57.length > 2) throw new Error('RunningHub Veo3 frame mode supports at most 2 image inputs');
  if (list57.length >= 2 && channel6 === 'official' && mode5 !== 'lite')
    throw new Error(
      'RunningHub Veo3 official Fast/Pro start-end endpoint is not published; use official Lite or low-cost channel',
    );
  if (list57.length === 1) {
    if (channel6 === 'official') currentBody20.imageUrl = list57[0];
    else
      mode5 === 'pro' ? (currentBody20.firstFrameUrl = list57[0]) : (currentBody20.imageUrls = [list57[0]]);
  } else
    list57.length === 2 &&
      (channel6 === 'official'
        ? ((currentBody20.firstImageUrl = list57[0]),
          (currentBody20.lastImageUrl = list57[1]),
          delete currentBody20.duration)
        : ((currentBody20.firstFrameUrl = list57[0]), (currentBody20.lastFrameUrl = list57[1])));
  return ((channel6 === 'lowCost' || mode5 === 'lite') && delete currentBody20.generateAudio, currentBody20);
}
function runninghubVeo3VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const {
    channel: channel7,
    mode: mode6,
    route: route8,
  } = resolveRunningHubVeo3Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_VEO3_ENDPOINTS[channel7]?.[route8]?.[mode6] || RUNNINGHUB_VEO3_ENDPOINTS.lowCost.text.fast
  );
}
const RUNNINGHUB_WAN27_ENDPOINTS = Object.freeze({
  text: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video',
  video: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-extend',
  reference: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-edit',
});
function normalizeRunningHubWan27Mode(value311) {
  const value312 = String(value311 || '')
    .trim()
    .toLowerCase();
  return value312 === 'video' || value312 === 'reference' || value312 === 'edit' ? value312 : 'image';
}
function getRunningHubWan27Mode(options25 = {}, value313 = {}) {
  return normalizeRunningHubWan27Mode(
    value313.wan27_mode || options25?.generationParams?.wan27_mode || options25?.wan27_mode,
  );
}
function collectRunningHubWan27Images({
  mode: mode7,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value314 = [],
    runningHubInputUrlsBySlot16 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  if (mode7 === 'image')
    (appendUniqueUrl(value314, runningHubInputUrlsBySlot16.firstFrame),
      appendUniqueUrl(value314, runningHubInputUrlsBySlot16.lastFrame));
  else {
    if (mode7 === 'reference') appendUniqueUrl(value314, runningHubInputUrlsBySlot16.referenceImage);
    else mode7 === 'edit' && appendUniqueUrl(value314, runningHubInputUrlsBySlot16.editRefImage);
  }
  return (normalizeInputList(inputImages).forEach((item30) => appendUniqueUrl(value314, item30)), value314);
}
function removeRunningHubWan27TransientFields(enabled35) {
  (delete enabled35.wan27_mode,
    delete enabled35.firstImageUrl,
    delete enabled35.lastImageUrl,
    delete enabled35.imageUrl,
    delete enabled35.imageUrls,
    delete enabled35.videoUrl,
    delete enabled35.videoUrls);
  if (!enabled35.aspectRatio) delete enabled35.aspectRatio;
}
function resolveRunningHubWan27Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const mode8 = getRunningHubWan27Mode(payload, currentBody);
  if (mode8 === 'reference' || mode8 === 'edit') return mode8;
  const list58 = normalizeInputList(inputVideos);
  if (mode8 === 'video' && list58.length > 0) return 'video';
  const list59 = collectRunningHubWan27Images({
    mode: mode8,
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list59.length > 0) return 'image';
  return 'text';
}
function runninghubWan27Video({
  currentBody: currentBody21,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value315 = { ...currentBody21 },
    enabled36 = String(value315.prompt || payload?.prompt || '').trim();
  if (!enabled36) throw new Error('RunningHub Wan2.7 prompt is required');
  const mode9 = getRunningHubWan27Mode(payload, value315),
    list60 = collectRunningHubWan27Images({
      mode: mode9,
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    list61 = normalizeInputList(inputVideos),
    value316 = String(value315.audioUrl || '').trim() || normalizeInputList(inputAudios)[0] || '';
  value315.prompt = enabled36;
  if (value316) value315.audioUrl = value316;
  removeRunningHubWan27TransientFields(value315);
  if (mode9 === 'reference') {
    const count11 = list60.length + list61.length;
    if (count11 <= 0) throw new Error('RunningHub Wan2.7 reference mode requires image or video input');
    if (count11 > 5) throw new Error('RunningHub Wan2.7 reference mode supports at most 5 inputs');
    if (value316) throw new Error('RunningHub Wan2.7 reference mode does not accept audio input');
    if (list60.length > 0) value315.imageUrls = list60;
    if (list61.length > 0) value315.videoUrls = list61;
    return value315;
  }
  if (mode9 === 'edit') {
    if (!list61[0]) throw new Error('RunningHub Wan2.7 video edit requires original video input');
    if (list61.length > 1) throw new Error('RunningHub Wan2.7 video edit accepts only one original video');
    if (list60.length > 3) throw new Error('RunningHub Wan2.7 video edit supports at most 3 image inputs');
    if (value316) throw new Error('RunningHub Wan2.7 video edit does not accept audio input');
    value315.videoUrl = list61[0];
    if (list60.length > 0) value315.imageUrls = list60.slice(0, 3);
    return value315;
  }
  if (mode9 === 'video') {
    if (list60.length > 0) throw new Error('RunningHub Wan2.7 video extend does not accept image input');
    if (list61.length > 1) throw new Error('RunningHub Wan2.7 video extend accepts only one video input');
    if (list61[0]) value315.videoUrl = list61[0];
    return value315;
  }
  if (list61.length > 0) throw new Error('RunningHub Wan2.7 image mode does not accept video input');
  if (list60.length > 2) throw new Error('RunningHub Wan2.7 image mode supports at most 2 image inputs');
  list60[0] && (delete value315.aspectRatio, (value315.firstImageUrl = list60[0]));
  if (list60[1]) value315.lastImageUrl = list60[1];
  return value315;
}
function runninghubWan27VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const runningHubWan27Route = resolveRunningHubWan27Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_WAN27_ENDPOINTS[runningHubWan27Route] || RUNNINGHUB_WAN27_ENDPOINTS.text;
}
function apimartKlingV3OmniVideo({
  currentBody: currentBody22,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value317 = { ...currentBody22 },
    list62 = normalizeInputList(inputImages),
    list63 = normalizeInputList(inputVideos),
    runningHubInputUrlsBySlot17 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    klingV3OmniMode = normalizeKlingV3OmniMode(
      payload?.generationParams?.kling_v3_omni_mode || payload?.kling_v3_omni_mode || 'image',
    );
  (delete value317.kling_v3_omni_mode, delete value317.image_with_roles, delete value317.video_list);
  if (klingV3OmniMode === 'edit') {
    if (!list63[0]) throw new Error('APIMart Kling V3 Omni video edit requires video_list input');
    return (
      (value317.video_list = [buildKlingV3OmniVideoItem(list63[0], 'base')]),
      delete value317.image_urls,
      delete value317.image_with_roles,
      delete value317.audio,
      delete value317.duration,
      delete value317.aspect_ratio,
      value317
    );
  }
  if (klingV3OmniMode === 'reference') {
    const list64 = [];
    (appendUniqueUrl(list64, runningHubInputUrlsBySlot17.referenceImage),
      list62.forEach((item31) => appendUniqueUrl(list64, item31)));
    const list65 = list64.slice(0, 1),
      enabled37 = list63[0] || '';
    if (list65.length <= 0 && !enabled37)
      throw new Error('APIMart Kling V3 Omni reference mode requires image or video input');
    return (
      list65.length > 0
        ? (value317.image_with_roles = list65.map((url2) => ({ url: url2, role: 'reference' })))
        : delete value317.image_with_roles,
      enabled37
        ? ((value317.video_list = [buildKlingV3OmniVideoItem(enabled37, 'feature')]), delete value317.audio)
        : delete value317.video_list,
      delete value317.image_urls,
      value317
    );
  }
  if (list63.length > 0)
    throw new Error('APIMart Kling V3 Omni image mode does not support video_list input');
  const value318 =
      Object.prototype.hasOwnProperty.call(runningHubInputUrlsBySlot17, 'firstFrame') ||
      Object.prototype.hasOwnProperty.call(runningHubInputUrlsBySlot17, 'lastFrame'),
    url3 = value318 ? runningHubInputUrlsBySlot17.firstFrame || '' : list62[0] || '',
    url4 = value318
      ? runningHubInputUrlsBySlot17.lastFrame || ''
      : list62.find((item32) => item32 && item32 !== url3) || '';
  if (!url3 && url4) throw new Error('APIMart Kling V3 Omni last_frame requires first_frame input');
  const list66 = [];
  return (
    url3 && list66.push({ url: url3, role: 'first_frame' }),
    url4 && list66.push({ url: url4, role: 'last_frame' }),
    list66.length > 0
      ? ((value317.image_with_roles = list66), delete value317.image_urls)
      : delete value317.image_urls,
    value317
  );
}
function apimartWan27Video({ currentBody: currentBody23, payload: payload = {} }) {
  const value319 = { ...currentBody23 },
    list67 = normalizeInputList(value319.image_urls),
    list68 = normalizeInputList(value319.video_urls),
    reference_voice = isPresentValue(value319.audio_url) ? String(value319.audio_url || '').trim() : '',
    value320 = !!reference_voice,
    value321 = String(payload?.generationParams?.wan27_mode || payload?.wan27_mode || 'image')
      .trim()
      .toLowerCase();
  (delete value319.wan27_mode, delete value319.wan27_reference_input, delete value319.wan27_edit_input);
  if (value321 === 'reference') {
    value319.model = 'wan2.7-r2v';
    const list69 = list67.slice(0, 1),
      list70 = list68.slice(0, Math.max(0, 5 - list69.length));
    if (list69.length <= 0 && list70.length <= 0)
      throw new Error('APIMart Wan2.7-R2V requires image_with_roles or video_urls input');
    return (
      list69.length > 0
        ? (value319.image_with_roles = list69.map((url5, count12) => ({
            url: url5,
            role: 'reference_image',
            ...(count12 === 0 && reference_voice ? { reference_voice: reference_voice } : {}),
          })))
        : delete value319.image_with_roles,
      list70.length > 0 ? (value319.video_urls = list70) : delete value319.video_urls,
      delete value319.image_urls,
      delete value319.audio_url,
      value319
    );
  }
  if (value321 === 'edit') {
    value319.model = 'wan2.7-videoedit';
    if (!list68[0]) throw new Error('APIMart Wan2.7-VideoEdit requires video_urls input');
    value319.video_urls = list68.slice(0, 2);
    if (list67.length > 0) value319.image_urls = list67.slice(0, 4);
    else delete value319.image_urls;
    return (delete value319.audio_url, value319);
  }
  value319.model = 'wan2.7';
  if (list67.length > 0 && list68.length > 0)
    throw new Error('APIMart Wan2.7 image_urls cannot be used with video_urls');
  if (list68.length > 0 && value320)
    throw new Error('APIMart Wan2.7 video_urls cannot be used with audio_url');
  return ((list67.length > 0 || list68.length > 0) && delete value319.size, value319);
}
function agnesImage({ currentBody: currentBody24, modelToken: modelToken7 }) {
  const args10 = { ...currentBody24 },
    list71 = normalizeInputList(args10.extra_body?.image),
    value322 = String(modelToken7 || args10.model || '').trim(),
    value323 = value322 === 'agnes-image-2.0-flash',
    value324 =
      args10.extra_body && typeof args10.extra_body === 'object' && !Array.isArray(args10.extra_body)
        ? { ...args10.extra_body }
        : {};
  return (
    list71.length > 0
      ? ((value324.image = list71),
        (value324.response_format = 'url'),
        value323 && (args10.tags = ['img2img']))
      : (delete value324.image, value323 && delete args10.tags),
    Object.keys(value324).length > 0 ? (args10.extra_body = value324) : delete args10.extra_body,
    args10
  );
}
function normalizeAgnesVideoFrameCount(value325) {
  const value326 = Number(value325);
  if (!Number.isFinite(value326)) return value325;
  const value327 = 49,
    value328 = 441,
    value329 = Math.min(Math.max(value327, Math.trunc(value326)), value328),
    value330 = Math.round((value329 - 1) / 8) * 8 + 1;
  return Math.min(value328, Math.max(value327, value330));
}
function agnesVideo({ currentBody: currentBody25, payload: payload = {} }) {
  const value331 = { ...currentBody25 },
    value332 = String(
      payload?.generationParams?.agnes_video_mode ||
        payload?.agnes_video_mode ||
        value331.agnes_video_mode ||
        'reference',
    )
      .trim()
      .toLowerCase();
  delete value331.agnes_video_mode;
  value331.num_frames !== undefined &&
    (value331.num_frames = normalizeAgnesVideoFrameCount(value331.num_frames));
  const list72 = normalizeInputList(value331.extra_body?.image),
    image = value332 === 'keyframes' ? list72.slice(0, 2) : list72;
  if (image.length === 0) return (delete value331.image, delete value331.extra_body, value331);
  if (image.length === 1) return ((value331.image = image[0]), delete value331.extra_body, value331);
  return (
    (value331.extra_body = {
      image: image,
      ...(value332 === 'keyframes' ? { mode: 'keyframes' } : {}),
    }),
    delete value331.image,
    value331
  );
}
function runninghubImageEndpoint({
  modelToken: modelToken8,
  finalUrls: finalUrls5,
  executionManifest: executionManifest7,
  modelManifest: modelManifest5,
  payload: payload9,
}) {
  const runningHubModelId2 = normalizeRunningHubModelId(modelToken8),
    runningHubModelEndpoint = resolveRunningHubModelEndpoint({
      hasInputImages: finalUrls5.length > 0,
      executionManifest: executionManifest7,
      modelManifest: modelManifest5,
      payload: payload9,
    });
  return 'https://www.runninghub.cn/openapi/v2/' + runningHubModelId2 + '/' + runningHubModelEndpoint;
}
function runninghubLlmChatEndpoint() {
  return 'https://llm.runninghub.cn/v1/chat/completions';
}
const BODY_RESOLVERS = Object.freeze({
    agnesImage: agnesImage,
    agnesVideo: agnesVideo,
    apimartGptImage2Image: apimartGptImage2Image,
    ppioImageSize: ppioImageSize,
    grsaiImage: grsaiImage,
    grsaiGptImage2Image: grsaiGptImage2Image,
    runninghubImage: runninghubImage,
    apimartSeedanceVideo: apimartSeedanceVideo,
    apimartOmniFlashVideo: apimartOmniFlashVideo,
    apimartVeo3Video: apimartVeo3Video,
    apimartHappyHorseVideo: apimartHappyHorseVideo,
    runninghubHappyHorseVideo: runninghubHappyHorseVideo,
    runninghubSeedance2Video: runninghubSeedance2Video,
    volcengineSeedance2Video: volcengineSeedance2Video,
    apimartHailuo02Video: apimartHailuo02Video,
    apimartHailuo23Video: apimartHailuo23Video,
    apimartViduQ3Video: apimartViduQ3Video,
    apimartKlingO1Video: apimartKlingO1Video,
    runninghubKlingO1Video: runninghubKlingO1Video,
    runninghubKlingV3Video: runninghubKlingV3Video,
    runninghubKlingO3Video: runninghubKlingO3Video,
    runninghubHailuo02Video: runninghubHailuo02Video,
    runninghubHailuo23Video: runninghubHailuo23Video,
    runninghubVeo3Video: runninghubVeo3Video,
    runninghubWan27Video: runninghubWan27Video,
    apimartKlingV3OmniVideo: apimartKlingV3OmniVideo,
    apimartWan27Video: apimartWan27Video,
  }),
  ENDPOINT_RESOLVERS = Object.freeze({
    runninghubImageEndpoint: runninghubImageEndpoint,
    runninghubKlingO1VideoEndpoint: runninghubKlingO1VideoEndpoint,
    runninghubHappyHorseVideoEndpoint: runninghubHappyHorseVideoEndpoint,
    runninghubSeedance2VideoEndpoint: runninghubSeedance2VideoEndpoint,
    runninghubKlingV3VideoEndpoint: runninghubKlingV3VideoEndpoint,
    runninghubKlingO3VideoEndpoint: runninghubKlingO3VideoEndpoint,
    runninghubHailuo02VideoEndpoint: runninghubHailuo02VideoEndpoint,
    runninghubHailuo23VideoEndpoint: runninghubHailuo23VideoEndpoint,
    runninghubVeo3VideoEndpoint: runninghubVeo3VideoEndpoint,
    runninghubWan27VideoEndpoint: runninghubWan27VideoEndpoint,
    runninghubLlmChatEndpoint: runninghubLlmChatEndpoint,
  });
export function getModelApiBodyResolver(value333) {
  return BODY_RESOLVERS[String(value333 || '').trim()] || null;
}
export function getModelApiEndpointResolver(value334) {
  return ENDPOINT_RESOLVERS[String(value334 || '').trim()] || null;
}
