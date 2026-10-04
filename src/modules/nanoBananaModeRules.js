import { getModelsByKind, normalizeProviderId, resolveModelExecution } from '../manifests/index.js';
import { t } from '../i18n/index.js';
const DEFAULT_IMAGE_SIZE = '2K';
export const NANO_BANANA_FAMILIES = Object.freeze({
  NANOBANANA: 'nanobanana',
  NANOBANANA_PRO: 'nanobanana-pro',
  NANOBANANA_2: 'nanobanana-2',
  GPT_IMAGE_2: 'gpt-image-2',
});
export const NANO_BANANA_MODES = Object.freeze({
  NORMAL: 'normal',
  FAST: 'fast',
  VT: 'vt',
  CL: 'cl',
  VIP: 'vip',
  OFFICIAL: 'official',
});
const NANO_BANANA_MODE_OPTIONS = Object.freeze({
    [NANO_BANANA_FAMILIES.NANOBANANA]: Object.freeze([
      Object.freeze({
        mode: NANO_BANANA_MODES.NORMAL,
        label: '常规',
        labelKey: 'imageFunctionMenu.modes.normal',
        tooltip: '',
      }),
      Object.freeze({
        mode: NANO_BANANA_MODES.FAST,
        label: '快速',
        labelKey: 'imageFunctionMenu.modes.fast',
        tooltip: '',
      }),
    ]),
    [NANO_BANANA_FAMILIES.NANOBANANA_PRO]: Object.freeze([
      Object.freeze({
        mode: NANO_BANANA_MODES.NORMAL,
        label: '常规',
        labelKey: 'imageFunctionMenu.modes.normal',
        tooltip: '低价线路',
        tooltipKey: 'imageFunctionMenu.modes.lowPriceRoute',
      }),
      Object.freeze({ mode: NANO_BANANA_MODES.VT, label: 'VT', tooltip: '' }),
      Object.freeze({ mode: NANO_BANANA_MODES.CL, label: 'CL', tooltip: '' }),
      Object.freeze({ mode: NANO_BANANA_MODES.VIP, label: 'VIP', tooltip: '' }),
    ]),
    [NANO_BANANA_FAMILIES.NANOBANANA_2]: Object.freeze([
      Object.freeze({
        mode: NANO_BANANA_MODES.NORMAL,
        label: '常规',
        labelKey: 'imageFunctionMenu.modes.normal',
        tooltip: '低价线路',
        tooltipKey: 'imageFunctionMenu.modes.lowPriceRoute',
      }),
      Object.freeze({
        mode: NANO_BANANA_MODES.CL,
        label: 'CL',
        tooltip: '低价线路2',
        tooltipKey: 'imageFunctionMenu.modes.lowPriceRoute2',
      }),
    ]),
  }),
  RUNNINGHUB_NANO_BANANA_MODE_OPTIONS = Object.freeze([
    Object.freeze({
      mode: NANO_BANANA_MODES.NORMAL,
      label: '低价版',
      labelKey: 'imageFunctionMenu.modes.lowPrice',
      tooltip: '高性价比线路',
      tooltipKey: 'imageFunctionMenu.modes.highValueRoute',
    }),
    Object.freeze({
      mode: NANO_BANANA_MODES.OFFICIAL,
      label: '官方版',
      labelKey: 'imageFunctionMenu.modes.official',
      tooltip: '官方直连线路',
      tooltipKey: 'imageFunctionMenu.modes.officialDirectRoute',
    }),
  ]),
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
  NANO_BANANA_2_EXTRA_RATIO_OPTIONS = Object.freeze([
    Object.freeze({ label: '1:4', w: 1, h: 4, value: 1 / 4 }),
    Object.freeze({ label: '4:1', w: 4, h: 1, value: 4 }),
    Object.freeze({ label: '1:8', w: 1, h: 8, value: 1 / 8 }),
    Object.freeze({ label: '8:1', w: 8, h: 1, value: 8 }),
  ]),
  GPT_IMAGE_2_RATIO_OPTIONS = Object.freeze([
    Object.freeze({ label: '1:1', w: 1, h: 1, value: 1 }),
    Object.freeze({ label: '3:2', w: 3, h: 2, value: 3 / 2 }),
    Object.freeze({ label: '2:3', w: 2, h: 3, value: 2 / 3 }),
    Object.freeze({ label: '4:3', w: 4, h: 3, value: 4 / 3 }),
    Object.freeze({ label: '3:4', w: 3, h: 4, value: 3 / 4 }),
    Object.freeze({ label: '5:4', w: 5, h: 4, value: 5 / 4 }),
    Object.freeze({ label: '4:5', w: 4, h: 5, value: 4 / 5 }),
    Object.freeze({ label: '16:9', w: 16, h: 9, value: 16 / 9 }),
    Object.freeze({ label: '9:16', w: 9, h: 16, value: 9 / 16 }),
    Object.freeze({ label: '2:1', w: 2, h: 1, value: 2 }),
    Object.freeze({ label: '1:2', w: 1, h: 2, value: 1 / 2 }),
    Object.freeze({ label: '21:9', w: 21, h: 9, value: 21 / 9 }),
    Object.freeze({ label: '9:21', w: 9, h: 21, value: 9 / 21 }),
  ]);
function normalizeModelToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function normalizeProvider(item) {
  return normalizeProviderId(item);
}
function collectStringValues(list, list2 = []) {
  if (typeof list === 'string') {
    const modelToken = normalizeModelToken(list);
    if (modelToken) list2.push(modelToken);
    return list2;
  }
  if (Array.isArray(list)) return (list.forEach((item2) => collectStringValues(item2, list2)), list2);
  return (
    list &&
      typeof list === 'object' &&
      Object.values(list).forEach((item3) => collectStringValues(item3, list2)),
    list2
  );
}
function getExecutionModelTokens(key) {
  return collectStringValues([key?.model, key?.routeModels, key?.modeModels, key?.imageSizeModels]);
}
function getNanoBananaExtension(index) {
  const enabled = index?.extensions?.nanoBanana;
  if (!enabled || typeof enabled !== 'object') return null;
  const family = String(enabled.family || '').trim(),
    mode = normalizeMode(enabled.mode);
  if (!isNanoBananaFamily(family)) return null;
  return { family: family, mode: mode };
}
function getNanoBananaManifestRecords(result = '') {
  const provider2 = normalizeProvider(result);
  return getModelsByKind('image')
    .map((manifest) => ({
      manifest: manifest,
      provider: normalizeProvider(manifest?.provider),
      nanoBanana: getNanoBananaExtension(manifest),
      imageSizePolicy: manifest?.extensions?.imageSizePolicy || null,
      executionManifest: resolveModelExecution(manifest?.modelId)?.executionManifest,
    }))
    .filter((item4) => {
      return item4.nanoBanana && (!provider2 || item4.provider === provider2);
    });
}
function resolveNanoBananaModelFromExecutionToken(data, options = '') {
  const list3 = normalizeModelToken(data);
  if (!list3 || list3.includes('/')) return null;
  const list4 = getNanoBananaManifestRecords(options),
    target = list4.find(
      ({ executionManifest: executionManifest }) => normalizeModelToken(executionManifest?.model) === list3,
    ),
    modelManifest =
      target ||
      list4.find(({ executionManifest: executionManifest2 }) =>
        getExecutionModelTokens(executionManifest2).includes(list3),
      );
  if (!modelManifest) return null;
  return {
    modelManifest: modelManifest.manifest,
    executionManifest: modelManifest.executionManifest,
    canonicalModelId: modelManifest.manifest.modelId,
    source: 'execution-model-token',
  };
}
function resolveNanoBananaModelContext(source, next = '') {
  const providerHint = normalizeProvider(next),
    executionManifest3 =
      resolveModelExecution(source, { providerHint: providerHint }) ||
      resolveNanoBananaModelFromExecutionToken(source, providerHint) ||
      (providerHint ? null : resolveModelExecution(source)),
    modelManifest2 = executionManifest3?.modelManifest || null;
  return {
    modelManifest: modelManifest2,
    executionManifest: executionManifest3?.executionManifest || null,
    provider: normalizeProvider(modelManifest2?.provider || providerHint),
    modelId: String(executionManifest3?.canonicalModelId || modelManifest2?.modelId || source || '')
      .trim()
      .toLowerCase(),
    nanoBanana: getNanoBananaExtension(modelManifest2),
  };
}
function isRunningHubNanoProvider(current) {
  return normalizeProvider(current) === 'runninghub';
}
function normalizeMode(entry) {
  const enabled2 = String(entry || '')
    .trim()
    .toLowerCase();
  if (!enabled2) return NANO_BANANA_MODES.NORMAL;
  if (enabled2 === NANO_BANANA_MODES.NORMAL || enabled2 === '常规' || enabled2 === 'normal')
    return NANO_BANANA_MODES.NORMAL;
  if (enabled2 === NANO_BANANA_MODES.FAST || enabled2 === '快速' || enabled2 === 'fast')
    return NANO_BANANA_MODES.FAST;
  if (enabled2 === NANO_BANANA_MODES.VT) return NANO_BANANA_MODES.VT;
  if (enabled2 === NANO_BANANA_MODES.CL) return NANO_BANANA_MODES.CL;
  if (enabled2 === NANO_BANANA_MODES.VIP) return NANO_BANANA_MODES.VIP;
  if (
    enabled2 === NANO_BANANA_MODES.OFFICIAL ||
    enabled2 === '官方' ||
    enabled2 === '官方版' ||
    enabled2 === 'official'
  )
    return NANO_BANANA_MODES.OFFICIAL;
  if (enabled2 === '低价' || enabled2 === '低价版' || enabled2 === 'low-price' || enabled2 === 'low price')
    return NANO_BANANA_MODES.NORMAL;
  return NANO_BANANA_MODES.NORMAL;
}
function localizeNanoBananaModeOption(args) {
  if (!args || typeof args !== 'object') return args;
  const label = args.labelKey ? t(args.labelKey) : args.label,
    tooltip = args.tooltipKey ? t(args.tooltipKey) : args.tooltip;
  return { ...args, label: label, tooltip: tooltip };
}
function parseRatioLabel(record) {
  const list5 = String(record || '')
    .trim()
    .replace(/[：∶]/g, ':')
    .replace(/\s+/g, '');
  if (!list5.includes(':')) return null;
  const [payload, handle] = list5.split(':'),
    w = Number.parseFloat(payload),
    h = Number.parseFloat(handle);
  if (!(w > 0 && h > 0)) return null;
  return { w: w, h: h, label: w + ':' + h };
}
function getRatioValue(el) {
  const count = Number(el?.value);
  if (Number.isFinite(count) && count > 0) return count;
  const count2 = Number(el?.w),
    count3 = Number(el?.h);
  if (Number.isFinite(count2) && count2 > 0 && Number.isFinite(count3) && count3 > 0) return count2 / count3;
  const ratioLabel = parseRatioLabel(el?.label);
  if (ratioLabel) return ratioLabel.w / ratioLabel.h;
  return 1;
}
export function normalizeNanoBananaImageSize(state) {
  const config = String(state || '')
    .trim()
    .toUpperCase();
  if (config === '1K' || config === '2K' || config === '4K') return config;
  return DEFAULT_IMAGE_SIZE;
}
export function isNanoBananaFamily(scope) {
  return (
    scope === NANO_BANANA_FAMILIES.NANOBANANA ||
    scope === NANO_BANANA_FAMILIES.NANOBANANA_PRO ||
    scope === NANO_BANANA_FAMILIES.NANOBANANA_2 ||
    scope === NANO_BANANA_FAMILIES.GPT_IMAGE_2
  );
}
export function getNanoBananaFamilyOptions() {
  return [
    {
      family: NANO_BANANA_FAMILIES.NANOBANANA,
      label: 'Nanobanana',
      description: t('imageFunctionMenu.families.base'),
      disabled: false,
    },
    {
      family: NANO_BANANA_FAMILIES.NANOBANANA_PRO,
      label: 'NanobananaPRO',
      description: t('imageFunctionMenu.families.pro'),
      disabled: false,
    },
    {
      family: NANO_BANANA_FAMILIES.NANOBANANA_2,
      label: 'Nanobanana2',
      description: t('imageFunctionMenu.families.secondGen'),
      disabled: false,
    },
  ];
}
export function getDefaultModeForNanoBananaFamily(input, output = '') {
  if (!isNanoBananaFamily(input)) return NANO_BANANA_MODES.NORMAL;
  if (isRunningHubNanoProvider(output)) return NANO_BANANA_MODES.NORMAL;
  return NANO_BANANA_MODES.NORMAL;
}
export function getNanoBananaModeOptions(value2, value3 = '') {
  if (!isNanoBananaFamily(value2)) return [];
  if (isRunningHubNanoProvider(value3))
    return RUNNINGHUB_NANO_BANANA_MODE_OPTIONS.map(localizeNanoBananaModeOption);
  const list6 = NANO_BANANA_MODE_OPTIONS[value2];
  return Array.isArray(list6) ? list6.map(localizeNanoBananaModeOption) : [];
}
export function getNanoBananaModeLabel(value4, value5, value6 = '') {
  const list7 = getNanoBananaModeOptions(value4, value6),
    mode2 = normalizeMode(value5),
    value7 = list7.find((item5) => item5.mode === mode2);
  return (
    value7?.label ||
    (isRunningHubNanoProvider(value6)
      ? t('imageFunctionMenu.modes.lowPrice')
      : t('imageFunctionMenu.modes.normal'))
  );
}
export function resolveNanoBananaModelBySelection({
  family: family2,
  mode: mode3,
  imageSize: imageSize = DEFAULT_IMAGE_SIZE,
  provider: provider = '',
} = {}) {
  const value8 = String(family2 || '').trim();
  if (!isNanoBananaFamily(value8)) return normalizeModelToken(family2);
  const provider3 = normalizeProvider(provider) || 'grsai',
    isRunningHubNanoProvider2 = isRunningHubNanoProvider(provider3)
      ? normalizeMode(mode3) === NANO_BANANA_MODES.OFFICIAL
        ? NANO_BANANA_MODES.OFFICIAL
        : NANO_BANANA_MODES.NORMAL
      : normalizeMode(mode3),
    nanoBananaImageSize = normalizeNanoBananaImageSize(imageSize),
    list8 = getNanoBananaManifestRecords(provider3).filter(
      (item6) => item6.nanoBanana.family === value8 && item6.nanoBanana.mode === isRunningHubNanoProvider2,
    );
  if (list8.length <= 0) return normalizeModelToken(family2);
  if (provider3 === 'grsai') {
    const list9 = list8.filter((item7) => {
        const value9 = item7.imageSizePolicy?.fixedSize
          ? normalizeNanoBananaImageSize(item7.imageSizePolicy.fixedSize)
          : '';
        return value9 === nanoBananaImageSize;
      }),
      list10 = list8.filter((enabled3) => !enabled3.imageSizePolicy?.fixedSize);
    if (nanoBananaImageSize === '4K' && list9.length > 0) return list9[0].manifest.modelId;
    if (list10.length > 0) return list10[0].manifest.modelId;
  }
  return list8[0].manifest.modelId;
}
export function resolveNanoBananaSelectionFromModel(value10, imageSize2 = DEFAULT_IMAGE_SIZE, value11 = '') {
  const rawModel = resolveNanoBananaModelContext(value10, value11);
  if (!rawModel.nanoBanana) return null;
  const family3 = rawModel.nanoBanana.family,
    mode4 = rawModel.nanoBanana.mode,
    provider4 = normalizeProvider(value11),
    provider5 = rawModel.provider || provider4 || 'grsai';
  return {
    family: family3,
    mode: mode4,
    provider: provider5,
    model: resolveNanoBananaModelBySelection({
      family: family3,
      mode: mode4,
      imageSize: imageSize2,
      provider: provider5,
    }),
    rawModel: rawModel.modelId,
  };
}
export function getNanoBananaSelectionFromModel(value12, value13 = DEFAULT_IMAGE_SIZE, value14 = '') {
  return resolveNanoBananaSelectionFromModel(value12, value13, value14);
}
export function getNanoBananaAllowedRatioOptions(value15) {
  if (value15 === NANO_BANANA_FAMILIES.GPT_IMAGE_2) return GPT_IMAGE_2_RATIO_OPTIONS;
  if (value15 === NANO_BANANA_FAMILIES.NANOBANANA_2)
    return [...DEFAULT_RATIO_OPTIONS, ...NANO_BANANA_2_EXTRA_RATIO_OPTIONS];
  return DEFAULT_RATIO_OPTIONS;
}
export function getNanoBananaAllowedRatioLabels(value16) {
  return getNanoBananaAllowedRatioOptions(value16).map((item8) => item8.label);
}
export function pickClosestRatioLabelByOptions(value17, list11 = []) {
  const list12 = Array.isArray(list11) && list11.length > 0 ? list11 : DEFAULT_RATIO_OPTIONS,
    ratioLabel2 = parseRatioLabel(value17),
    value18 = ratioLabel2 ? ratioLabel2.w / ratioLabel2.h : 1;
  let value19 = list12[0],
    value20 = Math.abs(value18 - getRatioValue(value19));
  for (let value21 = 1; value21 < list12.length; value21 += 1) {
    const value22 = list12[value21],
      value23 = Math.abs(value18 - getRatioValue(value22));
    value23 < value20 && ((value20 = value23), (value19 = value22));
  }
  return value19.label;
}
export function normalizeNanoBananaRatioForFamily(value24, value25) {
  const list13 = getNanoBananaAllowedRatioOptions(value25),
    list14 = list13.map((item9) => item9.label),
    ratioLabel3 = parseRatioLabel(value24);
  if (!ratioLabel3) return value24;
  if (list14.includes(ratioLabel3.label)) return ratioLabel3.label;
  return pickClosestRatioLabelByOptions(ratioLabel3.label, list13);
}
