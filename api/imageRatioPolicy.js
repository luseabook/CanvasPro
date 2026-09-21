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
    DEFAULT_RATIO_OPTIONS.filter((_0x5637f6) => _0x5637f6.label !== '5:4' && _0x5637f6.label !== '4:5'),
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
function isFinitePositive(_0x1989c3) {
  const _0x532b50 = Number(_0x1989c3);
  return Number.isFinite(_0x532b50) && _0x532b50 > 0;
}
function normalizeImageSizeLabel(_0x4f1bd4) {
  return String(_0x4f1bd4 || '')
    .trim()
    .toUpperCase();
}
function resolveManifestRatioContext(_0x300562, _0x3f618d) {
  try {
    return resolveModelExecution(_0x3f618d, { providerHint: _0x300562 }) || null;
  } catch {
    return null;
  }
}
function getManifestRatioPolicy(_0x44205c, _0x26b1fb) {
  const _0x434b76 = resolveManifestRatioContext(_0x44205c, _0x26b1fb),
    _0x3c26e3 =
      _0x434b76?.modelManifest?.extensions?.ratioPolicy ||
      _0x434b76?.executionManifest?.extensions?.ratioPolicy ||
      null;
  return _0x3c26e3 && typeof _0x3c26e3 === 'object'
    ? { policy: _0x3c26e3, resolved: _0x434b76 }
    : { policy: null, resolved: _0x434b76 };
}
function normalizeCompareValue(_0x19640b) {
  return String(_0x19640b ?? '')
    .trim()
    .toLowerCase();
}
function getNodeFieldValue(_0x335230, _0x524634, _0x2775d3 = '') {
  if (!_0x335230 || typeof _0x335230 !== 'object') return _0x2775d3;
  return _0x335230[_0x524634] ?? _0x335230?.generationParams?.[_0x524634] ?? _0x2775d3;
}
function getOptionDisableWhen(_0xfc45af) {
  if (!_0xfc45af || typeof _0xfc45af !== 'object' || Array.isArray(_0xfc45af)) return null;
  const _0x24e8d8 = _0xfc45af.disableWhen || _0xfc45af.disabledWhen;
  return _0x24e8d8 &&
    (Array.isArray(_0x24e8d8) || (typeof _0x24e8d8 === 'object' && !Array.isArray(_0x24e8d8)))
    ? _0x24e8d8
    : null;
}
function optionDisableWhenMatches(_0x460824, _0x5ca9a3 = {}) {
  if (Array.isArray(_0x460824))
    return _0x460824.some((_0x4342a6) => optionDisableWhenMatches(_0x4342a6, _0x5ca9a3));
  if (!_0x460824 || typeof _0x460824 !== 'object') return false;
  if (Array.isArray(_0x460824.any))
    return _0x460824.any.some((_0x42d32b) => optionDisableWhenMatches(_0x42d32b, _0x5ca9a3));
  if (Array.isArray(_0x460824.all))
    return _0x460824.all.every((_0x163285) => optionDisableWhenMatches(_0x163285, _0x5ca9a3));
  const _0x47a7c9 = String(_0x460824?.field || _0x460824?.param || '').trim();
  if (!_0x47a7c9) return false;
  const _0x4bc6bd = _0x460824.values !== undefined ? _0x460824.values : _0x460824.value,
    _0x2c85e8 = Array.isArray(_0x4bc6bd) ? _0x4bc6bd : [_0x4bc6bd],
    _0x3aef01 = _0x2c85e8.map(normalizeCompareValue);
  return _0x3aef01.includes(normalizeCompareValue(getNodeFieldValue(_0x5ca9a3, _0x47a7c9, '')));
}
function isOptionDisabled(_0x1da313, _0x1fa1b4 = {}) {
  return (
    _0x1da313 &&
    typeof _0x1da313 === 'object' &&
    !Array.isArray(_0x1da313) &&
    (_0x1da313.disabled === true || optionDisableWhenMatches(getOptionDisableWhen(_0x1da313), _0x1fa1b4))
  );
}
function findUiSchemaField(_0x27cb4e, _0x244d3b) {
  return (Array.isArray(_0x27cb4e?.uiSchema?.fields) ? _0x27cb4e.uiSchema.fields : []).find((_0x4c38e1) => {
    const _0x561335 = String(_0x4c38e1?.id || '').trim(),
      _0x267c70 = String(_0x4c38e1?.displayRole || '').trim();
    return _0x561335 === _0x244d3b || _0x267c70 === _0x244d3b;
  });
}
function toRatioOption(_0x5516bf) {
  const _0x3ecd17 = parseRatioLabel(_0x5516bf);
  if (!_0x3ecd17) return null;
  return Object.freeze({
    label: _0x3ecd17.label,
    w: _0x3ecd17.w,
    h: _0x3ecd17.h,
    value: _0x3ecd17.w / _0x3ecd17.h,
  });
}
function labelsToRatioOptions(_0x42b262) {
  return Object.freeze(
    (Array.isArray(_0x42b262) ? _0x42b262 : []).map((_0x34f8bf) => toRatioOption(_0x34f8bf)).filter(Boolean),
  );
}
function getPolicyRatiosForImageSize(_0x33fe94, _0xa60462) {
  const _0x2e445c = normalizeImageSizeLabel(_0xa60462),
    _0x513779 = _0x33fe94?.ratiosByImageSize;
  if (_0x2e445c && _0x513779 && typeof _0x513779 === 'object' && _0x513779[_0x2e445c])
    return labelsToRatioOptions(_0x513779[_0x2e445c]);
  if (Array.isArray(_0x33fe94?.ratios)) return labelsToRatioOptions(_0x33fe94.ratios);
  return null;
}
function getUiSchemaRatioOptions(_0x3a0159, _0x5e784a) {
  const _0x34fd99 = findUiSchemaField(_0x3a0159?.modelManifest, 'aspectRatio'),
    _0x49b9bd = Array.isArray(_0x34fd99?.options) ? _0x34fd99.options : [];
  if (_0x49b9bd.length === 0) return null;
  const _0x5cb317 = { imageSize: normalizeImageSizeLabel(_0x5e784a) },
    _0xb24d8d = _0x49b9bd
      .filter((_0x13ee04) => !isOptionDisabled(_0x13ee04, _0x5cb317))
      .map((_0x27c91d) => String(_0x27c91d?.value ?? _0x27c91d).trim())
      .filter((_0xc63e71) => _0xc63e71 && !isAdaptiveRatioLabel(_0xc63e71))
      .map((_0x214b35) => toRatioOption(_0x214b35))
      .filter(Boolean);
  return _0xb24d8d.length > 0 ? Object.freeze(_0xb24d8d) : null;
}
function getManifestAllowedRatios(_0x31f782, _0x24897d, _0xf80db1) {
  const { policy: _0x9b10ab, resolved: _0x43e1f9 } = getManifestRatioPolicy(_0x31f782, _0x24897d);
  if (!_0x43e1f9?.modelManifest) return null;
  const _0x58fe29 = getPolicyRatiosForImageSize(_0x9b10ab, _0xf80db1);
  if (_0x58fe29?.length > 0) return _0x58fe29;
  return getUiSchemaRatioOptions(_0x43e1f9, _0xf80db1);
}
function getManifestRatioCapability(_0x5fc8f7, _0x4e2b14) {
  const { policy: _0x144083, resolved: _0x5459f4 } = getManifestRatioPolicy(_0x5fc8f7, _0x4e2b14),
    _0x363ac7 = String(_0x144083?.capability || '').trim();
  if (_0x363ac7) return _0x363ac7;
  if (!_0x5459f4?.modelManifest) return '';
  if (_0x5459f4.modelManifest.adapterType === 'workflow') return 'none';
  if (findUiSchemaField(_0x5459f4.modelManifest, 'aspectRatio')) return 'aspectRatio';
  return '';
}
function getRatioFallbackStrategy(_0xe7d19a, _0x2b0818, _0x297f66) {
  const { policy: _0x14ae3b } = getManifestRatioPolicy(_0xe7d19a, _0x2b0818),
    _0x1bc3cd = normalizeImageSizeLabel(_0x297f66);
  if (
    _0x1bc3cd &&
    _0x14ae3b?.fallbackStrategyByImageSize &&
    typeof _0x14ae3b.fallbackStrategyByImageSize === 'object'
  )
    return String(_0x14ae3b.fallbackStrategyByImageSize[_0x1bc3cd] || '').trim();
  return String(_0x14ae3b?.fallbackStrategy || '').trim();
}
export function isAdaptiveRatioLabel(_0xf05c1e) {
  const _0x2af684 = String(_0xf05c1e || '').trim(),
    _0x26a5ab = _0x2af684.toLowerCase();
  return (
    !_0x2af684 ||
    _0x26a5ab === 'auto' ||
    _0x26a5ab === 'default' ||
    _0x26a5ab === 'adaptive' ||
    _0x2af684 === '自适应' ||
    _0x2af684 === '默认'
  );
}
export function normalizeRatioLabelText(_0x5b1b60) {
  return String(_0x5b1b60 || '')
    .trim()
    .replace(/[：∶﹕]/g, ':')
    .replace(/\s+/g, '');
}
export function parseRatioLabel(_0x249032) {
  const _0x144af1 = normalizeRatioLabelText(_0x249032);
  if (!_0x144af1.includes(':')) return null;
  const [_0x59fc08, _0x295c9d] = _0x144af1.split(':'),
    _0x363531 = Number.parseFloat(_0x59fc08),
    _0xd0c822 = Number.parseFloat(_0x295c9d);
  if (!(_0x363531 > 0 && _0xd0c822 > 0)) return null;
  return { w: _0x363531, h: _0xd0c822, label: _0x363531 + ':' + _0xd0c822 };
}
function getRatioOptionValue(_0x4c799f) {
  if (!_0x4c799f || typeof _0x4c799f !== 'object') return null;
  const _0x4e808d = Number(_0x4c799f.value);
  if (Number.isFinite(_0x4e808d) && _0x4e808d > 0) return _0x4e808d;
  const _0xd114e3 = Number(_0x4c799f.w),
    _0x2a057e = Number(_0x4c799f.h);
  if (Number.isFinite(_0xd114e3) && _0xd114e3 > 0 && Number.isFinite(_0x2a057e) && _0x2a057e > 0)
    return _0xd114e3 / _0x2a057e;
  const _0xcbbb15 = parseRatioLabel(_0x4c799f.label);
  if (_0xcbbb15) return _0xcbbb15.w / _0xcbbb15.h;
  return null;
}
export function pickClosestRatio(_0x5ec8ee, _0x49daa3, _0x73f59d = DEFAULT_RATIO_OPTIONS) {
  const _0x1626b0 = Array.isArray(_0x73f59d) && _0x73f59d.length > 0 ? _0x73f59d : DEFAULT_RATIO_OPTIONS,
    _0x168061 = typeof _0x5ec8ee === 'string' ? parseRatioLabel(_0x5ec8ee) : null;
  let _0x99c7cd = 1;
  if (_0x168061) _0x99c7cd = _0x168061.w / _0x168061.h;
  else {
    const _0x2b2239 = Number(_0x5ec8ee),
      _0x2c8b57 = Number(_0x49daa3);
    isFinitePositive(_0x2b2239) && isFinitePositive(_0x2c8b57) && (_0x99c7cd = _0x2b2239 / _0x2c8b57);
  }
  let _0x23cade = _0x1626b0[0],
    _0x55951e = getRatioOptionValue(_0x23cade) || 1,
    _0x21284d = Math.abs(_0x99c7cd - _0x55951e);
  for (let _0x47766a = 1; _0x47766a < _0x1626b0.length; _0x47766a += 1) {
    const _0x4d5473 = _0x1626b0[_0x47766a],
      _0x15137d = getRatioOptionValue(_0x4d5473);
    if (!(_0x15137d > 0)) continue;
    const _0x46daf1 = Math.abs(_0x99c7cd - _0x15137d);
    _0x46daf1 < _0x21284d && ((_0x21284d = _0x46daf1), (_0x23cade = _0x4d5473), (_0x55951e = _0x15137d));
  }
  return _0x23cade.label;
}
function pickClosestDirectionalRatio(_0x50ac6f, _0x3650c7, _0x560c42 = DEFAULT_RATIO_OPTIONS) {
  const _0x31e19d = Array.isArray(_0x560c42) && _0x560c42.length > 0 ? _0x560c42 : DEFAULT_RATIO_OPTIONS,
    _0x509a44 = typeof _0x50ac6f === 'string' ? parseRatioLabel(_0x50ac6f) : null;
  let _0x38c7ea = 1;
  if (_0x509a44) _0x38c7ea = _0x509a44.w / _0x509a44.h;
  else {
    const _0xffffb0 = Number(_0x50ac6f),
      _0x1afab1 = Number(_0x3650c7);
    isFinitePositive(_0xffffb0) && isFinitePositive(_0x1afab1) && (_0x38c7ea = _0xffffb0 / _0x1afab1);
  }
  if (Math.abs(_0x38c7ea - 1) < 0.000001) {
    const _0x173f5b = _0x31e19d.find((_0x291d44) => _0x291d44.label === '16:9');
    if (_0x173f5b) return _0x173f5b.label;
  }
  const _0x4b1ae4 = _0x31e19d.filter((_0x1185cf) => {
    const _0x3c60cb = getRatioOptionValue(_0x1185cf);
    if (!(_0x3c60cb > 0)) return false;
    return _0x38c7ea > 1 ? _0x3c60cb > 1 : _0x3c60cb < 1;
  });
  return pickClosestRatio(_0x50ac6f, _0x3650c7, _0x4b1ae4.length > 0 ? _0x4b1ae4 : _0x31e19d);
}
export function pickClosestRatioForProviderModel({
  provider: _0x4a114d,
  model: _0x2e9a63,
  ratioLabel: _0x5e7d32,
  width: _0x318050,
  height: _0xd837d,
  imageSize: _0x131adf,
} = {}) {
  const _0x1ca907 = getAllowedRatiosForProviderModel(_0x4a114d, _0x2e9a63, _0x131adf),
    _0x4e7a6f = isFinitePositive(_0x318050) && isFinitePositive(_0xd837d),
    _0x25a3f8 = _0x4e7a6f ? Number(_0x318050) : _0x5e7d32 || DEFAULT_RATIO_LABEL,
    _0x4d9c03 = _0x4e7a6f ? Number(_0xd837d) : undefined;
  if (getRatioFallbackStrategy(_0x4a114d, _0x2e9a63, _0x131adf) === 'directional')
    return pickClosestDirectionalRatio(_0x25a3f8, _0x4d9c03, _0x1ca907);
  return pickClosestRatio(_0x25a3f8, _0x4d9c03, _0x1ca907);
}
export function resolveAdaptiveSourceSize({
  displayWidth: _0x2c1849,
  displayHeight: _0x213701,
  inputWidth: _0x2c9b2e,
  inputHeight: _0x287366,
} = {}) {
  if (isFinitePositive(_0x2c1849) && isFinitePositive(_0x213701))
    return { width: Number(_0x2c1849), height: Number(_0x213701), source: 'display' };
  if (isFinitePositive(_0x2c9b2e) && isFinitePositive(_0x287366))
    return { width: Number(_0x2c9b2e), height: Number(_0x287366), source: 'input-media' };
  return { width: 1, height: 1, source: 'fallback' };
}
export function getAllowedRatiosForProviderModel(_0x15b3c4, _0x526e08, _0x455f40 = '') {
  const _0x3ce4c7 = getManifestAllowedRatios(_0x15b3c4, _0x526e08, _0x455f40);
  if (_0x3ce4c7?.length > 0) return _0x3ce4c7;
  const _0x509875 = String(_0x15b3c4 || '')
      .trim()
      .toLowerCase(),
    _0x393d55 = String(_0x526e08 || '')
      .trim()
      .toLowerCase(),
    _0x3575fd = _0x509875 === 'grsai',
    _0x37813d = resolveNanoBananaSelectionFromModel(_0x393d55);
  if (
    _0x3575fd &&
    _0x37813d &&
    isNanoBananaFamily(_0x37813d.family) &&
    _0x37813d.family !== NANO_BANANA_FAMILIES.GPT_IMAGE_2
  )
    return getNanoBananaAllowedRatioOptions(_0x37813d.family);
  if (_0x509875 === 'runninghub' && _0x37813d && isNanoBananaFamily(_0x37813d.family))
    return getNanoBananaAllowedRatioOptions(_0x37813d.family);
  if (_0x509875 === 'dreamina') return DREAMINA_RATIO_OPTIONS;
  return DEFAULT_RATIO_OPTIONS;
}
export function getRatioCapability(_0x50c1a6, _0x14400e) {
  const _0x472b96 = getManifestRatioCapability(_0x50c1a6, _0x14400e);
  if (_0x472b96) return _0x472b96;
  const _0x5d054a = String(_0x50c1a6 || '')
    .trim()
    .toLowerCase();
  if (_0x5d054a === 'runninghubwf') return 'none';
  if (_0x5d054a === 'runninghub' || _0x5d054a === 'grsai') return 'aspectRatio';
  if (_0x5d054a === 'ppio' || _0x5d054a === 'apimart') return 'size';
  if (_0x5d054a === 'dreamina') return 'aspectRatio';
  return 'aspectRatio';
}
function alignAndClampDimension(_0x16b31b) {
  const _0x1093fc = Math.round(Number(_0x16b31b || 0) / DIMENSION_ALIGN) * DIMENSION_ALIGN;
  return Math.max(DIMENSION_MIN, Math.min(DIMENSION_MAX, _0x1093fc));
}
function calculateDimensionsByQualityAndRatio(_0x1f7fd6, _0x346f08) {
  const _0x1eb5c5 = String(_0x1f7fd6 || '')
      .trim()
      .toUpperCase(),
    _0x39f334 =
      DIMENSION_QUALITY_PIXEL_MAP[_0x1eb5c5] || DIMENSION_QUALITY_PIXEL_MAP[DIMENSION_DEFAULT_QUALITY],
    _0x44ff4f = parseRatioLabel(_0x346f08) || { w: 1, h: 1 },
    _0x26d180 = _0x44ff4f.w / _0x44ff4f.h,
    _0x1747bd = Math.sqrt(_0x39f334 / _0x26d180),
    _0x180362 = _0x1747bd * _0x26d180;
  return { width: alignAndClampDimension(_0x180362), height: alignAndClampDimension(_0x1747bd) };
}
export function resolveProviderRatioPayload({
  provider: _0xd129a6,
  model: _0x118913,
  ratioLabel: _0x3c5874,
  imageSize: _0x5920ce,
  suppressAspectRatio: suppressAspectRatio = false,
} = {}) {
  const _0x296eca = getRatioCapability(_0xd129a6, _0x118913),
    _0x343b56 = pickClosestRatioForProviderModel({
      provider: _0xd129a6,
      model: _0x118913,
      ratioLabel: _0x3c5874 || DEFAULT_RATIO_LABEL,
      imageSize: _0x5920ce,
    });
  if (_0x296eca === 'none' || suppressAspectRatio === true)
    return {
      ratioCapability: _0x296eca,
      resolvedRatioLabel: _0x343b56,
      params: {},
      suppressAspectRatio: true,
      notice:
        _0x296eca === 'none' ? 'Model does not support ratio params; falling back to model default.' : '',
    };
  if (_0x296eca === 'aspectRatio')
    return {
      ratioCapability: _0x296eca,
      resolvedRatioLabel: _0x343b56,
      params: { aspectRatio: _0x343b56 },
      suppressAspectRatio: false,
      notice: '',
    };
  if (_0x296eca === 'size')
    return {
      ratioCapability: _0x296eca,
      resolvedRatioLabel: _0x343b56,
      params: { size: _0x343b56 },
      suppressAspectRatio: false,
      notice: '',
    };
  if (_0x296eca === 'dimensions') {
    const _0x395cfb = calculateDimensionsByQualityAndRatio(_0x5920ce, _0x343b56);
    return {
      ratioCapability: _0x296eca,
      resolvedRatioLabel: _0x343b56,
      params: _0x395cfb,
      suppressAspectRatio: false,
      notice: '',
    };
  }
  return {
    ratioCapability: 'none',
    resolvedRatioLabel: _0x343b56,
    params: {},
    suppressAspectRatio: true,
    notice: 'Unsupported ratio capability; skipping ratio params.',
  };
}
export const IMAGE_RATIO_OPTIONS = DEFAULT_RATIO_OPTIONS;
export const IMAGE_RATIO_DEFAULT_LABEL = DEFAULT_RATIO_LABEL;
