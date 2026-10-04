import {
  NANO_BANANA_FAMILIES,
  getNanoBananaAllowedRatioOptions,
  isNanoBananaFamily,
  resolveNanoBananaSelectionFromModel,
} from '../src/modules/nanoBananaModeRules.js';
import { resolveModelExecution } from '../src/manifests/index.js';
const DEFAULT_RATIO_LABEL = '1:1',
  DEFAULT_RATIO_OPTIONS = Object.freeze([
    Object.freeze({ label: '1:1', w: 1, h: 1, value: 1 }),
    Object.freeze({ label: '9:16', w: 9, h: 16, value: 9 / 16 }),
    Object.freeze({ label: '16:9', w: 16, h: 9, value: 16 / 9 }),
    Object.freeze({ label: '3:4', w: 3, h: 4, value: 3 / 4 }),
    Object.freeze({ label: '4:3', w: 4, h: 3, value: 4 / 3 }),
    Object.freeze({ label: '3:2', w: 3, h: 2, value: 3 / 2 }),
    Object.freeze({ label: '2:3', w: 2, h: 3, value: 2 / 3 }),
    Object.freeze({ label: '5:4', w: 5, h: 4, value: 5 / 4 }),
    Object.freeze({ label: '4:5', w: 4, h: 5, value: 4 / 5 }),
    Object.freeze({ label: '21:9', w: 21, h: 9, value: 21 / 9 }),
  ]),
  DREAMINA_RATIO_OPTIONS = Object.freeze(
    DEFAULT_RATIO_OPTIONS.filter((item) => item.label !== '5:4' && item.label !== '4:5'),
  ),
  DIMENSION_QUALITY_PIXEL_MAP = Object.freeze({
    '1K': 0x400 * 0x400,
    '2K': 0x800 * 0x800,
    '3K': 0xa00 * 0xa00,
    '4K': 0xb40 * 0xb40,
  }),
  DIMENSION_DEFAULT_QUALITY = '2K',
  DIMENSION_ALIGN = 8,
  DIMENSION_MIN = 0x200,
  DIMENSION_MAX = 0x2000;
function isFinitePositive(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0;
}
function normalizeImageSizeLabel(key) {
  return String(key || '')
    .trim()
    .toUpperCase();
}
function resolveManifestRatioContext(providerHint, index) {
  try {
    return resolveModelExecution(index, { providerHint: providerHint }) || null;
  } catch {
    return null;
  }
}
function getManifestRatioPolicy(result, data) {
  const resolved = resolveManifestRatioContext(result, data),
    policy =
      resolved?.modelManifest?.extensions?.ratioPolicy ||
      resolved?.executionManifest?.extensions?.ratioPolicy ||
      null;
  return policy && typeof policy === 'object'
    ? { policy: policy, resolved: resolved }
    : { policy: null, resolved: resolved };
}
function normalizeCompareValue(options) {
  return String(options ?? '')
    .trim()
    .toLowerCase();
}
function getNodeFieldValue(enabled, target, source = '') {
  if (!enabled || typeof enabled !== 'object') return source;
  return enabled[target] ?? enabled?.generationParams?.[target] ?? source;
}
function getOptionDisableWhen(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object' || Array.isArray(enabled2)) return null;
  const next = enabled2.disableWhen || enabled2.disabledWhen;
  return next && (Array.isArray(next) || (typeof next === 'object' && !Array.isArray(next))) ? next : null;
}
function optionDisableWhenMatches(el, current = {}) {
  if (Array.isArray(el)) return el.some((item2) => optionDisableWhenMatches(item2, current));
  if (!el || typeof el !== 'object') return false;
  if (Array.isArray(el.any)) return el.any.some((item3) => optionDisableWhenMatches(item3, current));
  if (Array.isArray(el.all)) return el.all.every((item4) => optionDisableWhenMatches(item4, current));
  const enabled3 = String(el?.field || el?.param || '').trim();
  if (!enabled3) return false;
  const entry = el.values !== undefined ? el.values : el.value,
    list = Array.isArray(entry) ? entry : [entry],
    list2 = list.map(normalizeCompareValue);
  return list2.includes(normalizeCompareValue(getNodeFieldValue(current, enabled3, '')));
}
function isOptionDisabled(el2, record = {}) {
  return (
    el2 &&
    typeof el2 === 'object' &&
    !Array.isArray(el2) &&
    (el2.disabled === true || optionDisableWhenMatches(getOptionDisableWhen(el2), record))
  );
}
function findUiSchemaField(payload, handle) {
  return (Array.isArray(payload?.uiSchema?.fields) ? payload.uiSchema.fields : []).find((item5) => {
    const state = String(item5?.id || '').trim(),
      config = String(item5?.displayRole || '').trim();
    return state === handle || config === handle;
  });
}
function toRatioOption(scope) {
  const label = parseRatioLabel(scope);
  if (!label) return null;
  return Object.freeze({
    label: label.label,
    w: label.w,
    h: label.h,
    value: label.w / label.h,
  });
}
function labelsToRatioOptions(input) {
  return Object.freeze(
    (Array.isArray(input) ? input : []).map((item6) => toRatioOption(item6)).filter(Boolean),
  );
}
function getPolicyRatiosForImageSize(output, value2) {
  const imageSizeLabel = normalizeImageSizeLabel(value2),
    value3 = output?.ratiosByImageSize;
  if (imageSizeLabel && value3 && typeof value3 === 'object' && value3[imageSizeLabel])
    return labelsToRatioOptions(value3[imageSizeLabel]);
  if (Array.isArray(output?.ratios)) return labelsToRatioOptions(output.ratios);
  return null;
}
function getUiSchemaRatioOptions(value4, value5) {
  const uiSchemaField = findUiSchemaField(value4?.modelManifest, 'aspectRatio'),
    list3 = Array.isArray(uiSchemaField?.options) ? uiSchemaField.options : [];
  if (list3.length === 0) return null;
  const value6 = { imageSize: normalizeImageSizeLabel(value5) },
    list4 = list3
      .filter((item7) => !isOptionDisabled(item7, value6))
      .map((el3) => String(el3?.value ?? el3).trim())
      .filter((item8) => item8 && !isAdaptiveRatioLabel(item8))
      .map((item9) => toRatioOption(item9))
      .filter(Boolean);
  return list4.length > 0 ? Object.freeze(list4) : null;
}
function getManifestAllowedRatios(value7, value8, value9) {
  const { policy: policy2, resolved: resolved2 } = getManifestRatioPolicy(value7, value8);
  if (!resolved2?.modelManifest) return null;
  const list5 = getPolicyRatiosForImageSize(policy2, value9);
  if (list5?.length > 0) return list5;
  return getUiSchemaRatioOptions(resolved2, value9);
}
function getManifestRatioCapability(value10, value11) {
  const { policy: policy3, resolved: resolved3 } = getManifestRatioPolicy(value10, value11),
    value12 = String(policy3?.capability || '').trim();
  if (value12) return value12;
  if (!resolved3?.modelManifest) return '';
  if (resolved3.modelManifest.adapterType === 'workflow') return 'none';
  if (findUiSchemaField(resolved3.modelManifest, 'aspectRatio')) return 'aspectRatio';
  return '';
}
function getRatioFallbackStrategy(value13, value14, value15) {
  const { policy: policy4 } = getManifestRatioPolicy(value13, value14),
    imageSizeLabel2 = normalizeImageSizeLabel(value15);
  if (
    imageSizeLabel2 &&
    policy4?.fallbackStrategyByImageSize &&
    typeof policy4.fallbackStrategyByImageSize === 'object'
  )
    return String(policy4.fallbackStrategyByImageSize[imageSizeLabel2] || '').trim();
  return String(policy4?.fallbackStrategy || '').trim();
}
export function isAdaptiveRatioLabel(value16) {
  const enabled4 = String(value16 || '').trim(),
    value17 = enabled4.toLowerCase();
  return (
    !enabled4 ||
    value17 === 'auto' ||
    value17 === 'default' ||
    value17 === 'adaptive' ||
    enabled4 === '自适应' ||
    enabled4 === '默认'
  );
}
export function normalizeRatioLabelText(value18) {
  return String(value18 || '')
    .trim()
    .replace(/[：∶﹕]/g, ':')
    .replace(/\s+/g, '');
}
export function parseRatioLabel(value19) {
  const list6 = normalizeRatioLabelText(value19);
  if (!list6.includes(':')) return null;
  const [value20, value21] = list6.split(':'),
    w2 = Number.parseFloat(value20),
    h2 = Number.parseFloat(value21);
  if (!(w2 > 0 && h2 > 0)) return null;
  return { w: w2, h: h2, label: w2 + ':' + h2 };
}
function getRatioOptionValue(el4) {
  if (!el4 || typeof el4 !== 'object') return null;
  const count2 = Number(el4.value);
  if (Number.isFinite(count2) && count2 > 0) return count2;
  const count3 = Number(el4.w),
    count4 = Number(el4.h);
  if (Number.isFinite(count3) && count3 > 0 && Number.isFinite(count4) && count4 > 0) return count3 / count4;
  const ratioLabel = parseRatioLabel(el4.label);
  if (ratioLabel) return ratioLabel.w / ratioLabel.h;
  return null;
}
export function pickClosestRatio(value22, value23, list7 = DEFAULT_RATIO_OPTIONS) {
  const list8 = Array.isArray(list7) && list7.length > 0 ? list7 : DEFAULT_RATIO_OPTIONS,
    value24 = typeof value22 === 'string' ? parseRatioLabel(value22) : null;
  let value25 = 1;
  if (value24) value25 = value24.w / value24.h;
  else {
    const value26 = Number(value22),
      value27 = Number(value23);
    isFinitePositive(value26) && isFinitePositive(value27) && (value25 = value26 / value27);
  }
  let value28 = list8[0],
    ratioOptionValue = getRatioOptionValue(value28) || 1,
    value29 = Math.abs(value25 - ratioOptionValue);
  for (let value30 = 1; value30 < list8.length; value30 += 1) {
    const value31 = list8[value30],
      ratioOptionValue2 = getRatioOptionValue(value31);
    if (!(ratioOptionValue2 > 0)) continue;
    const value32 = Math.abs(value25 - ratioOptionValue2);
    value32 < value29 && ((value29 = value32), (value28 = value31), (ratioOptionValue = ratioOptionValue2));
  }
  return value28.label;
}
function pickClosestDirectionalRatio(value33, value34, list9 = DEFAULT_RATIO_OPTIONS) {
  const list10 = Array.isArray(list9) && list9.length > 0 ? list9 : DEFAULT_RATIO_OPTIONS,
    value35 = typeof value33 === 'string' ? parseRatioLabel(value33) : null;
  let count5 = 1;
  if (value35) count5 = value35.w / value35.h;
  else {
    const value36 = Number(value33),
      value37 = Number(value34);
    isFinitePositive(value36) && isFinitePositive(value37) && (count5 = value36 / value37);
  }
  if (Math.abs(count5 - 1) < 0.000001) {
    const value38 = list10.find((item10) => item10.label === '16:9');
    if (value38) return value38.label;
  }
  const list11 = list10.filter((item11) => {
    const ratioOptionValue3 = getRatioOptionValue(item11);
    if (!(ratioOptionValue3 > 0)) return false;
    return count5 > 1 ? ratioOptionValue3 > 1 : ratioOptionValue3 < 1;
  });
  return pickClosestRatio(value33, value34, list11.length > 0 ? list11 : list10);
}
export function pickClosestRatioForProviderModel({
  provider: provider,
  model: model,
  ratioLabel: ratioLabel2,
  width: width,
  height: height,
  imageSize: imageSize,
} = {}) {
  const allowedRatiosForProviderModel = getAllowedRatiosForProviderModel(provider, model, imageSize),
    isFinitePositive2 = isFinitePositive(width) && isFinitePositive(height),
    value39 = isFinitePositive2 ? Number(width) : ratioLabel2 || DEFAULT_RATIO_LABEL,
    value40 = isFinitePositive2 ? Number(height) : undefined;
  if (getRatioFallbackStrategy(provider, model, imageSize) === 'directional')
    return pickClosestDirectionalRatio(value39, value40, allowedRatiosForProviderModel);
  return pickClosestRatio(value39, value40, allowedRatiosForProviderModel);
}
export function resolveAdaptiveSourceSize({
  displayWidth: displayWidth,
  displayHeight: displayHeight,
  inputWidth: inputWidth,
  inputHeight: inputHeight,
} = {}) {
  if (isFinitePositive(displayWidth) && isFinitePositive(displayHeight))
    return { width: Number(displayWidth), height: Number(displayHeight), source: 'display' };
  if (isFinitePositive(inputWidth) && isFinitePositive(inputHeight))
    return { width: Number(inputWidth), height: Number(inputHeight), source: 'input-media' };
  return { width: 1, height: 1, source: 'fallback' };
}
export function getAllowedRatiosForProviderModel(value41, value42, value43 = '') {
  const list12 = getManifestAllowedRatios(value41, value42, value43);
  if (list12?.length > 0) return list12;
  const value44 = String(value41 || '')
      .trim()
      .toLowerCase(),
    value45 = String(value42 || '')
      .trim()
      .toLowerCase(),
    value46 = value44 === 'grsai',
    nanoBananaSelectionFromModel = resolveNanoBananaSelectionFromModel(value45);
  if (
    value46 &&
    nanoBananaSelectionFromModel &&
    isNanoBananaFamily(nanoBananaSelectionFromModel.family) &&
    nanoBananaSelectionFromModel.family !== NANO_BANANA_FAMILIES.GPT_IMAGE_2
  )
    return getNanoBananaAllowedRatioOptions(nanoBananaSelectionFromModel.family);
  if (
    value44 === 'runninghub' &&
    nanoBananaSelectionFromModel &&
    isNanoBananaFamily(nanoBananaSelectionFromModel.family)
  )
    return getNanoBananaAllowedRatioOptions(nanoBananaSelectionFromModel.family);
  if (value44 === 'dreamina') return DREAMINA_RATIO_OPTIONS;
  return DEFAULT_RATIO_OPTIONS;
}
export function getRatioCapability(value47, value48) {
  const manifestRatioCapability = getManifestRatioCapability(value47, value48);
  if (manifestRatioCapability) return manifestRatioCapability;
  const value49 = String(value47 || '')
    .trim()
    .toLowerCase();
  if (value49 === 'runninghubwf') return 'none';
  if (value49 === 'runninghub' || value49 === 'grsai') return 'aspectRatio';
  if (value49 === 'ppio' || value49 === 'apimart') return 'size';
  if (value49 === 'dreamina') return 'aspectRatio';
  return 'aspectRatio';
}
function alignAndClampDimension(value50) {
  const value51 = Math.round(Number(value50 || 0) / DIMENSION_ALIGN) * DIMENSION_ALIGN;
  return Math.max(DIMENSION_MIN, Math.min(DIMENSION_MAX, value51));
}
function calculateDimensionsByQualityAndRatio(value52, value53) {
  const value54 = String(value52 || '')
      .trim()
      .toUpperCase(),
    value55 = DIMENSION_QUALITY_PIXEL_MAP[value54] || DIMENSION_QUALITY_PIXEL_MAP[DIMENSION_DEFAULT_QUALITY],
    ratioLabel3 = parseRatioLabel(value53) || { w: 1, h: 1 },
    value56 = ratioLabel3.w / ratioLabel3.h,
    value57 = Math.sqrt(value55 / value56),
    value58 = value57 * value56;
  return { width: alignAndClampDimension(value58), height: alignAndClampDimension(value57) };
}
export function resolveProviderRatioPayload({
  provider: provider2,
  model: model2,
  ratioLabel: ratioLabel4,
  imageSize: imageSize2,
  suppressAspectRatio: suppressAspectRatio = false,
} = {}) {
  const ratioCapability = getRatioCapability(provider2, model2),
    resolvedRatioLabel = pickClosestRatioForProviderModel({
      provider: provider2,
      model: model2,
      ratioLabel: ratioLabel4 || DEFAULT_RATIO_LABEL,
      imageSize: imageSize2,
    });
  if (ratioCapability === 'none' || suppressAspectRatio === true)
    return {
      ratioCapability: ratioCapability,
      resolvedRatioLabel: resolvedRatioLabel,
      params: {},
      suppressAspectRatio: true,
      notice:
        ratioCapability === 'none'
          ? 'Model does not support ratio params; falling back to model default.'
          : '',
    };
  if (ratioCapability === 'aspectRatio')
    return {
      ratioCapability: ratioCapability,
      resolvedRatioLabel: resolvedRatioLabel,
      params: { aspectRatio: resolvedRatioLabel },
      suppressAspectRatio: false,
      notice: '',
    };
  if (ratioCapability === 'size')
    return {
      ratioCapability: ratioCapability,
      resolvedRatioLabel: resolvedRatioLabel,
      params: { size: resolvedRatioLabel },
      suppressAspectRatio: false,
      notice: '',
    };
  if (ratioCapability === 'dimensions') {
    const params = calculateDimensionsByQualityAndRatio(imageSize2, resolvedRatioLabel);
    return {
      ratioCapability: ratioCapability,
      resolvedRatioLabel: resolvedRatioLabel,
      params: params,
      suppressAspectRatio: false,
      notice: '',
    };
  }
  return {
    ratioCapability: 'none',
    resolvedRatioLabel: resolvedRatioLabel,
    params: {},
    suppressAspectRatio: true,
    notice: 'Unsupported ratio capability; skipping ratio params.',
  };
}
export const IMAGE_RATIO_OPTIONS = DEFAULT_RATIO_OPTIONS;
export const IMAGE_RATIO_DEFAULT_LABEL = DEFAULT_RATIO_LABEL;
