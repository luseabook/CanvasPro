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
function normalizeModelToken(_0x2e10fa) {
  return String(_0x2e10fa || '')
    .trim()
    .toLowerCase();
}
function normalizeProvider(_0x5838b0) {
  return normalizeProviderId(_0x5838b0);
}
function collectStringValues(_0x241b44, _0x4a112d = []) {
  if (typeof _0x241b44 === 'string') {
    const _0x934b56 = normalizeModelToken(_0x241b44);
    if (_0x934b56) _0x4a112d.push(_0x934b56);
    return _0x4a112d;
  }
  if (Array.isArray(_0x241b44))
    return (_0x241b44.forEach((_0x511597) => collectStringValues(_0x511597, _0x4a112d)), _0x4a112d);
  return (
    _0x241b44 &&
      typeof _0x241b44 === 'object' &&
      Object.values(_0x241b44).forEach((_0x2e6155) => collectStringValues(_0x2e6155, _0x4a112d)),
    _0x4a112d
  );
}
function getExecutionModelTokens(_0x457b1d) {
  return collectStringValues([
    _0x457b1d?.model,
    _0x457b1d?.routeModels,
    _0x457b1d?.modeModels,
    _0x457b1d?.imageSizeModels,
  ]);
}
function getNanoBananaExtension(_0x3e9b8f) {
  const _0x2ddbb3 = _0x3e9b8f?.extensions?.nanoBanana;
  if (!_0x2ddbb3 || typeof _0x2ddbb3 !== 'object') return null;
  const _0x2c0591 = String(_0x2ddbb3.family || '').trim(),
    _0x36e9a7 = normalizeMode(_0x2ddbb3.mode);
  if (!isNanoBananaFamily(_0x2c0591)) return null;
  return { family: _0x2c0591, mode: _0x36e9a7 };
}
function getNanoBananaManifestRecords(_0x1b199c = '') {
  const _0x1e0bbd = normalizeProvider(_0x1b199c);
  return getModelsByKind('image')
    .map((_0x12edcf) => ({
      manifest: _0x12edcf,
      provider: normalizeProvider(_0x12edcf?.provider),
      nanoBanana: getNanoBananaExtension(_0x12edcf),
      imageSizePolicy: _0x12edcf?.extensions?.imageSizePolicy || null,
      executionManifest: resolveModelExecution(_0x12edcf?.modelId)?.executionManifest,
    }))
    .filter((_0x4e6662) => {
      return _0x4e6662.nanoBanana && (!_0x1e0bbd || _0x4e6662.provider === _0x1e0bbd);
    });
}
function resolveNanoBananaModelFromExecutionToken(_0x57a0d7, _0x2b7bb7 = '') {
  const _0x488f96 = normalizeModelToken(_0x57a0d7);
  if (!_0x488f96 || _0x488f96.includes('/')) return null;
  const _0x118d93 = getNanoBananaManifestRecords(_0x2b7bb7),
    _0x52f2ed = _0x118d93.find(
      ({ executionManifest: _0x5c4ba8 }) => normalizeModelToken(_0x5c4ba8?.model) === _0x488f96,
    ),
    _0x2a8273 =
      _0x52f2ed ||
      _0x118d93.find(({ executionManifest: _0x93a7f6 }) =>
        getExecutionModelTokens(_0x93a7f6).includes(_0x488f96),
      );
  if (!_0x2a8273) return null;
  return {
    modelManifest: _0x2a8273.manifest,
    executionManifest: _0x2a8273.executionManifest,
    canonicalModelId: _0x2a8273.manifest.modelId,
    source: 'execution-model-token',
  };
}
function resolveNanoBananaModelContext(_0x3ea9e9, _0x1e429f = '') {
  const _0xadb4cf = normalizeProvider(_0x1e429f),
    _0x50c7b2 =
      resolveModelExecution(_0x3ea9e9, { providerHint: _0xadb4cf }) ||
      resolveNanoBananaModelFromExecutionToken(_0x3ea9e9, _0xadb4cf) ||
      (_0xadb4cf ? null : resolveModelExecution(_0x3ea9e9)),
    _0x9120a8 = _0x50c7b2?.modelManifest || null;
  return {
    modelManifest: _0x9120a8,
    executionManifest: _0x50c7b2?.executionManifest || null,
    provider: normalizeProvider(_0x9120a8?.provider || _0xadb4cf),
    modelId: String(_0x50c7b2?.canonicalModelId || _0x9120a8?.modelId || _0x3ea9e9 || '')
      .trim()
      .toLowerCase(),
    nanoBanana: getNanoBananaExtension(_0x9120a8),
  };
}
function isRunningHubNanoProvider(_0x3cef36) {
  return normalizeProvider(_0x3cef36) === 'runninghub';
}
function normalizeMode(_0x511709) {
  const _0x6ff02 = String(_0x511709 || '')
    .trim()
    .toLowerCase();
  if (!_0x6ff02) return NANO_BANANA_MODES.NORMAL;
  if (_0x6ff02 === NANO_BANANA_MODES.NORMAL || _0x6ff02 === '常规' || _0x6ff02 === 'normal')
    return NANO_BANANA_MODES.NORMAL;
  if (_0x6ff02 === NANO_BANANA_MODES.FAST || _0x6ff02 === '快速' || _0x6ff02 === 'fast')
    return NANO_BANANA_MODES.FAST;
  if (_0x6ff02 === NANO_BANANA_MODES.VT) return NANO_BANANA_MODES.VT;
  if (_0x6ff02 === NANO_BANANA_MODES.CL) return NANO_BANANA_MODES.CL;
  if (_0x6ff02 === NANO_BANANA_MODES.VIP) return NANO_BANANA_MODES.VIP;
  if (
    _0x6ff02 === NANO_BANANA_MODES.OFFICIAL ||
    _0x6ff02 === '官方' ||
    _0x6ff02 === '官方版' ||
    _0x6ff02 === 'official'
  )
    return NANO_BANANA_MODES.OFFICIAL;
  if (_0x6ff02 === '低价' || _0x6ff02 === '低价版' || _0x6ff02 === 'low-price' || _0x6ff02 === 'low price')
    return NANO_BANANA_MODES.NORMAL;
  return NANO_BANANA_MODES.NORMAL;
}
function localizeNanoBananaModeOption(_0x1e4723) {
  if (!_0x1e4723 || typeof _0x1e4723 !== 'object') return _0x1e4723;
  const _0x48ed71 = _0x1e4723.labelKey ? t(_0x1e4723.labelKey) : _0x1e4723.label,
    _0x541522 = _0x1e4723.tooltipKey ? t(_0x1e4723.tooltipKey) : _0x1e4723.tooltip;
  return { ..._0x1e4723, label: _0x48ed71, tooltip: _0x541522 };
}
function parseRatioLabel(_0x2b137f) {
  const _0x466444 = String(_0x2b137f || '')
    .trim()
    .replace(/[：∶]/g, ':')
    .replace(/\s+/g, '');
  if (!_0x466444.includes(':')) return null;
  const [_0x1cbf4c, _0x48a44b] = _0x466444.split(':'),
    _0x7b9e35 = Number.parseFloat(_0x1cbf4c),
    _0x387e05 = Number.parseFloat(_0x48a44b);
  if (!(_0x7b9e35 > 0 && _0x387e05 > 0)) return null;
  return { w: _0x7b9e35, h: _0x387e05, label: _0x7b9e35 + ':' + _0x387e05 };
}
function getRatioValue(_0x53ba83) {
  const _0x2160be = Number(_0x53ba83?.value);
  if (Number.isFinite(_0x2160be) && _0x2160be > 0) return _0x2160be;
  const _0x2104ac = Number(_0x53ba83?.w),
    _0x201e33 = Number(_0x53ba83?.h);
  if (Number.isFinite(_0x2104ac) && _0x2104ac > 0 && Number.isFinite(_0x201e33) && _0x201e33 > 0)
    return _0x2104ac / _0x201e33;
  const _0x1e2f2c = parseRatioLabel(_0x53ba83?.label);
  if (_0x1e2f2c) return _0x1e2f2c.w / _0x1e2f2c.h;
  return 1;
}
export function normalizeNanoBananaImageSize(_0x3361aa) {
  const _0x236604 = String(_0x3361aa || '')
    .trim()
    .toUpperCase();
  if (_0x236604 === '1K' || _0x236604 === '2K' || _0x236604 === '4K') return _0x236604;
  return DEFAULT_IMAGE_SIZE;
}
export function isNanoBananaFamily(_0x384501) {
  return (
    _0x384501 === NANO_BANANA_FAMILIES.NANOBANANA ||
    _0x384501 === NANO_BANANA_FAMILIES.NANOBANANA_PRO ||
    _0x384501 === NANO_BANANA_FAMILIES.NANOBANANA_2 ||
    _0x384501 === NANO_BANANA_FAMILIES.GPT_IMAGE_2
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
export function getDefaultModeForNanoBananaFamily(_0x21ca52, _0x135ffe = '') {
  if (!isNanoBananaFamily(_0x21ca52)) return NANO_BANANA_MODES.NORMAL;
  if (isRunningHubNanoProvider(_0x135ffe)) return NANO_BANANA_MODES.NORMAL;
  return NANO_BANANA_MODES.NORMAL;
}
export function getNanoBananaModeOptions(_0x3d6259, _0x2446e7 = '') {
  if (!isNanoBananaFamily(_0x3d6259)) return [];
  if (isRunningHubNanoProvider(_0x2446e7))
    return RUNNINGHUB_NANO_BANANA_MODE_OPTIONS.map(localizeNanoBananaModeOption);
  const _0x3e0594 = NANO_BANANA_MODE_OPTIONS[_0x3d6259];
  return Array.isArray(_0x3e0594) ? _0x3e0594.map(localizeNanoBananaModeOption) : [];
}
export function getNanoBananaModeLabel(_0x54f6bc, _0x24dc15, _0x574368 = '') {
  const _0x350db8 = getNanoBananaModeOptions(_0x54f6bc, _0x574368),
    _0x5df75e = normalizeMode(_0x24dc15),
    _0x5efabc = _0x350db8.find((_0x40ec48) => _0x40ec48.mode === _0x5df75e);
  return (
    _0x5efabc?.label ||
    (isRunningHubNanoProvider(_0x574368)
      ? t('imageFunctionMenu.modes.lowPrice')
      : t('imageFunctionMenu.modes.normal'))
  );
}
export function resolveNanoBananaModelBySelection({
  family: _0x1ad8cc,
  mode: _0x24171a,
  imageSize: imageSize = DEFAULT_IMAGE_SIZE,
  provider: provider = '',
} = {}) {
  const _0x431e4f = String(_0x1ad8cc || '').trim();
  if (!isNanoBananaFamily(_0x431e4f)) return normalizeModelToken(_0x1ad8cc);
  const _0x501faf = normalizeProvider(provider) || 'grsai',
    _0x2d573b = isRunningHubNanoProvider(_0x501faf)
      ? normalizeMode(_0x24171a) === NANO_BANANA_MODES.OFFICIAL
        ? NANO_BANANA_MODES.OFFICIAL
        : NANO_BANANA_MODES.NORMAL
      : normalizeMode(_0x24171a),
    _0x13b556 = normalizeNanoBananaImageSize(imageSize),
    _0x26ea6b = getNanoBananaManifestRecords(_0x501faf).filter(
      (_0x58f063) => _0x58f063.nanoBanana.family === _0x431e4f && _0x58f063.nanoBanana.mode === _0x2d573b,
    );
  if (_0x26ea6b.length <= 0) return normalizeModelToken(_0x1ad8cc);
  if (_0x501faf === 'grsai') {
    const _0x418d1e = _0x26ea6b.filter((_0x3a24ee) => {
        const _0xf81e68 = _0x3a24ee.imageSizePolicy?.fixedSize
          ? normalizeNanoBananaImageSize(_0x3a24ee.imageSizePolicy.fixedSize)
          : '';
        return _0xf81e68 === _0x13b556;
      }),
      _0x22a510 = _0x26ea6b.filter((_0x139fe6) => !_0x139fe6.imageSizePolicy?.fixedSize);
    if (_0x13b556 === '4K' && _0x418d1e.length > 0) return _0x418d1e[0].manifest.modelId;
    if (_0x22a510.length > 0) return _0x22a510[0].manifest.modelId;
  }
  return _0x26ea6b[0].manifest.modelId;
}
export function resolveNanoBananaSelectionFromModel(
  _0x3ea591,
  _0xa6474 = DEFAULT_IMAGE_SIZE,
  _0x5a27f2 = '',
) {
  const _0x3eb589 = resolveNanoBananaModelContext(_0x3ea591, _0x5a27f2);
  if (!_0x3eb589.nanoBanana) return null;
  const _0x4974b7 = _0x3eb589.nanoBanana.family,
    _0x146481 = _0x3eb589.nanoBanana.mode,
    _0x5e3797 = normalizeProvider(_0x5a27f2),
    _0x21d3bd = _0x3eb589.provider || _0x5e3797 || 'grsai';
  return {
    family: _0x4974b7,
    mode: _0x146481,
    provider: _0x21d3bd,
    model: resolveNanoBananaModelBySelection({
      family: _0x4974b7,
      mode: _0x146481,
      imageSize: _0xa6474,
      provider: _0x21d3bd,
    }),
    rawModel: _0x3eb589.modelId,
  };
}
export function getNanoBananaSelectionFromModel(_0x24c90b, _0x20121f = DEFAULT_IMAGE_SIZE, _0x5d3b6e = '') {
  return resolveNanoBananaSelectionFromModel(_0x24c90b, _0x20121f, _0x5d3b6e);
}
export function getNanoBananaAllowedRatioOptions(_0x2efac2) {
  if (_0x2efac2 === NANO_BANANA_FAMILIES.GPT_IMAGE_2) return GPT_IMAGE_2_RATIO_OPTIONS;
  if (_0x2efac2 === NANO_BANANA_FAMILIES.NANOBANANA_2)
    return [...DEFAULT_RATIO_OPTIONS, ...NANO_BANANA_2_EXTRA_RATIO_OPTIONS];
  return DEFAULT_RATIO_OPTIONS;
}
export function getNanoBananaAllowedRatioLabels(_0x59c5e8) {
  return getNanoBananaAllowedRatioOptions(_0x59c5e8).map((_0x3cb55c) => _0x3cb55c.label);
}
export function pickClosestRatioLabelByOptions(_0x54a667, _0x3ada63 = []) {
  const _0x33d6d0 = Array.isArray(_0x3ada63) && _0x3ada63.length > 0 ? _0x3ada63 : DEFAULT_RATIO_OPTIONS,
    _0x5bf404 = parseRatioLabel(_0x54a667),
    _0x40f9bb = _0x5bf404 ? _0x5bf404.w / _0x5bf404.h : 1;
  let _0x4688a0 = _0x33d6d0[0],
    _0x576a69 = Math.abs(_0x40f9bb - getRatioValue(_0x4688a0));
  for (let _0x54a80e = 1; _0x54a80e < _0x33d6d0.length; _0x54a80e += 1) {
    const _0x58284a = _0x33d6d0[_0x54a80e],
      _0x2bd822 = Math.abs(_0x40f9bb - getRatioValue(_0x58284a));
    _0x2bd822 < _0x576a69 && ((_0x576a69 = _0x2bd822), (_0x4688a0 = _0x58284a));
  }
  return _0x4688a0.label;
}
export function normalizeNanoBananaRatioForFamily(_0x414637, _0x277f6d) {
  const _0x4e976a = getNanoBananaAllowedRatioOptions(_0x277f6d),
    _0x846ed4 = _0x4e976a.map((_0x57ab28) => _0x57ab28.label),
    _0x1364eb = parseRatioLabel(_0x414637);
  if (!_0x1364eb) return _0x414637;
  if (_0x846ed4.includes(_0x1364eb.label)) return _0x1364eb.label;
  return pickClosestRatioLabelByOptions(_0x1364eb.label, _0x4e976a);
}
