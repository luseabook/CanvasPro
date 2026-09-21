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
const PPIO_MIN_PIXELS = 0xa00 * 0x5a0,
  PPIO_MAX_PIXELS = 0x9ec290,
  PPIO_MIN_RATIO = 1 / 16,
  PPIO_MAX_RATIO = 16,
  PPIO_ALIGN_STEP = 64,
  PPIO_DEFAULT_SIZE = '2048x2048',
  PPIO_DEFAULT_QUALITY = '2K',
  PPIO_DEFAULT_RATIO = '1:1',
  PPIO_QUALITY_PIXEL_MAP = Object.freeze({
    '1K': 0x400 * 0x400,
    '2K': 0x800 * 0x800,
    '3K': 0xa00 * 0xa00,
    '4K': 0xb40 * 0xb40,
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
  PPIO_RATIO_LABEL_SET = new Set(PPIO_RATIO_OPTIONS.map((_0x472caf) => _0x472caf.label)),
  RUNNINGHUB_MODEL_DIMENSION_MIN = 0x200,
  RUNNINGHUB_MODEL_DIMENSION_MAX = 0x2000,
  RUNNINGHUB_MODEL_DIMENSION_ALIGN = 8,
  RUNNINGHUB_MODEL_DEFAULT_QUALITY = '2K',
  RUNNINGHUB_MODEL_DEFAULT_RATIO = '1:1',
  RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP = Object.freeze({
    '1K': 0x400 * 0x400,
    '2K': 0x800 * 0x800,
    '3K': 0xa00 * 0xa00,
    '4K': 0xb40 * 0xb40,
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
function stripPrefix(_0x1ea0c, _0x53db12) {
  const _0x1367db = String(_0x1ea0c || '').trim();
  return _0x1367db.startsWith(_0x53db12) ? _0x1367db.slice(_0x53db12.length) : _0x1367db;
}
function isPresentValue(_0x1caeaa) {
  return _0x1caeaa !== undefined && _0x1caeaa !== null && String(_0x1caeaa).trim() !== '';
}
const VEO3_MODEL_CHOICES = new Set(['fast', 'quality']),
  VEO3_IMAGE_GENERATION_TYPES = new Set(['frame', 'reference']),
  VIDU_Q3_VIDEO_MODELS = new Set(['viduq3-turbo', 'viduq3-pro']),
  VIDU_Q3_REFERENCE_MODELS = new Set(['viduq3', 'viduq3-mix']);
export function normalizeApimartGptImage2Resolution(_0x3412bc) {
  const _0x181379 = String(_0x3412bc || '')
    .trim()
    .toUpperCase();
  if (_0x181379 === '1K' || _0x181379 === '2K' || _0x181379 === '4K') return _0x181379.toLowerCase();
  return '2k';
}
export function normalizeApimartNanoBanana2Resolution(_0xc70228) {
  const _0x682db = String(_0xc70228 || '')
    .trim()
    .toUpperCase();
  if (_0x682db === '1K' || _0x682db === '2K' || _0x682db === '4K') return _0x682db;
  return '2K';
}
function apimartGptImage2Image({ currentBody: _0x45fbc0, payload: _0x13a29c }) {
  return {
    ..._0x45fbc0,
    resolution: normalizeApimartGptImage2Resolution(_0x45fbc0.resolution || _0x13a29c.imageSize),
  };
}
function pickClosestPpioRatio(_0x3dd55f, _0x5577f4) {
  const _0x1cba60 = Number(_0x3dd55f || 1) / Number(_0x5577f4 || 1);
  let _0x4f28d6 = PPIO_RATIO_OPTIONS[0],
    _0x18f4f2 = Number.POSITIVE_INFINITY;
  for (const _0x169893 of PPIO_RATIO_OPTIONS) {
    const _0x382a43 = Math.abs(_0x169893.w / _0x169893.h - _0x1cba60);
    _0x382a43 < _0x18f4f2 && ((_0x18f4f2 = _0x382a43), (_0x4f28d6 = _0x169893));
  }
  return _0x4f28d6.label;
}
function normalizePpioQuality(_0xe1e9fa) {
  const _0x12155e = String(_0xe1e9fa || '')
    .trim()
    .toUpperCase();
  return PPIO_QUALITY_PIXEL_MAP[_0x12155e] ? _0x12155e : PPIO_DEFAULT_QUALITY;
}
function normalizePpioAspectRatioLabel(_0x4169b1) {
  const _0x9887d7 = String(_0x4169b1 || '').trim();
  if (!_0x9887d7) return PPIO_DEFAULT_RATIO;
  const _0x2c3ca3 = normalizeRatioLabelText(_0x9887d7),
    _0x107e42 = _0x2c3ca3.toLowerCase();
  if (_0x107e42 === 'auto' || _0x107e42 === 'adaptive' || _0x2c3ca3 === '自适应' || _0x2c3ca3 === '默认')
    return PPIO_DEFAULT_RATIO;
  if (!_0x2c3ca3.includes(':')) return PPIO_DEFAULT_RATIO;
  const [_0x166df6, _0xe8559b] = _0x2c3ca3.split(':'),
    _0x233046 = Number.parseFloat(_0x166df6),
    _0x480649 = Number.parseFloat(_0xe8559b);
  if (!(_0x233046 > 0 && _0x480649 > 0)) return PPIO_DEFAULT_RATIO;
  const _0x461896 = pickClosestPpioRatio(_0x233046, _0x480649);
  return PPIO_RATIO_LABEL_SET.has(_0x461896) ? _0x461896 : PPIO_DEFAULT_RATIO;
}
function calculatePpioSizeFromTargetPixels(_0xbcf65a, _0x39e9dc) {
  const [_0x2ac9ed, _0x118dd9] = String(_0x39e9dc || PPIO_DEFAULT_RATIO).split(':'),
    _0x364ef8 = Number.parseFloat(_0x2ac9ed) || 1,
    _0x275471 = Number.parseFloat(_0x118dd9) || 1,
    _0x4d77e5 = Math.max(PPIO_MIN_RATIO, Math.min(PPIO_MAX_RATIO, _0x364ef8 / _0x275471)),
    _0x465424 = Math.max(
      PPIO_MIN_PIXELS,
      Math.min(Number(_0xbcf65a) || PPIO_QUALITY_PIXEL_MAP['2K'], PPIO_MAX_PIXELS),
    );
  let _0x3c103d = Math.round(Math.sqrt(_0x465424 / _0x4d77e5)),
    _0x373c92 = Math.round(_0x3c103d * _0x4d77e5);
  return (
    (_0x373c92 = Math.max(PPIO_ALIGN_STEP, Math.round(_0x373c92 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    (_0x3c103d = Math.max(PPIO_ALIGN_STEP, Math.round(_0x3c103d / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    _0x373c92 + 'x' + _0x3c103d
  );
}
function resolvePpioSize(_0x49951f, _0x249fba) {
  const _0x44b57e = normalizePpioQuality(_0x49951f),
    _0x419db9 = normalizePpioAspectRatioLabel(_0x249fba),
    _0x410667 = PPIO_QUALITY_PIXEL_MAP[_0x44b57e] || PPIO_QUALITY_PIXEL_MAP['2K'];
  return calculatePpioSizeFromTargetPixels(_0x410667, _0x419db9) || PPIO_DEFAULT_SIZE;
}
function ppioImageSize({
  currentBody: _0x36be5f,
  payload: _0x299c92,
  modelToken: _0x37675a,
  finalUrls: _0x122517,
  executionManifest: _0x2d74ca,
  modelManifest: _0x50e086,
}) {
  const _0x29db8b = _0x37675a || stripPrefix(_0x299c92.model, 'ppio/'),
    _0x4e8b54 = { ..._0x36be5f },
    _0x497744 = _0x2d74ca?.extensions?.ppioImage || _0x50e086?.extensions?.ppioImage || {};
  return (
    !_0x299c92.suppressImageSize &&
      (_0x4e8b54.size = resolvePpioSize(
        _0x299c92.imageSize,
        _0x299c92.resolvedRatioLabel || _0x299c92.aspectRatio,
      )),
    _0x497744.optimizePromptOptions &&
      (_0x4e8b54.optimize_prompt_options = { ..._0x497744.optimizePromptOptions }),
    _0x497744.batchSizeField &&
      _0x299c92.batchSize &&
      _0x299c92.batchSize > 1 &&
      (_0x4e8b54[_0x497744.batchSizeField] = _0x299c92.batchSize),
    _0x122517.length > 0 && (_0x4e8b54[_0x497744.imageInputField || 'image'] = _0x122517),
    _0x4e8b54
  );
}
function normalizeGrsaiImageModel(_0x9a8187) {
  const _0x65e677 = String(_0x9a8187 || '').trim();
  if (!_0x65e677) return 'nano-banana-pro-vt';
  return _0x65e677.replace(/^grsai\//i, '');
}
const GRSAI_NANO_BANANA_IMAGE_SIZE_SET = new Set(['1K', '2K']);
function getGrsaiNanoBananaSelection(_0x555614) {
  const _0x99adcb = resolveNanoBananaSelectionFromModel(_0x555614, '2K', 'grsai');
  if (!_0x99adcb || _0x99adcb.family === NANO_BANANA_FAMILIES.GPT_IMAGE_2) return null;
  return _0x99adcb;
}
function getGrsaiImageSizePolicy(_0x4c2830) {
  const _0x1ace17 = resolveModelExecution(_0x4c2830, { providerHint: 'grsai' }),
    _0x5c810b = _0x1ace17?.modelManifest?.extensions?.imageSizePolicy;
  return _0x5c810b && typeof _0x5c810b === 'object' ? _0x5c810b : null;
}
function normalizeGrsaiNanoBananaImageSize(_0x3fd064, _0x57ae13 = '') {
  const _0x2d93d2 = String(getGrsaiImageSizePolicy(_0x57ae13)?.fixedSize || '')
    .trim()
    .toUpperCase();
  if (_0x2d93d2) return _0x2d93d2;
  const _0x3a511b = String(_0x3fd064 || '')
    .trim()
    .toUpperCase();
  return GRSAI_NANO_BANANA_IMAGE_SIZE_SET.has(_0x3a511b) ? _0x3a511b : '2K';
}
function getGrsaiGptImage2Policy(_0x2b92d7) {
  const _0x561efc = resolveModelExecution(_0x2b92d7, { providerHint: 'grsai' }),
    _0x32a238 = _0x561efc?.modelManifest?.extensions?.gptImage2;
  return _0x32a238 && typeof _0x32a238 === 'object' && !Array.isArray(_0x32a238) ? _0x32a238 : null;
}
function getGrsaiGptImage2PixelSizesByRatio(_0x349860) {
  const _0x43f4e8 = getGrsaiGptImage2Policy(_0x349860)?.pixelSizesByRatio;
  return _0x43f4e8 && typeof _0x43f4e8 === 'object' && !Array.isArray(_0x43f4e8) ? _0x43f4e8 : {};
}
function normalizeGrsaiNanoBananaAspectRatio(_0x47ae99, _0x3451dc) {
  const _0x6f5dbb = normalizeRatioLabelText(_0x47ae99),
    _0x1223ae = _0x6f5dbb.toLowerCase();
  if (
    !_0x6f5dbb ||
    _0x1223ae === 'auto' ||
    _0x1223ae === 'adaptive' ||
    _0x1223ae === 'default' ||
    _0x6f5dbb === '自适应' ||
    _0x6f5dbb === '默认'
  )
    return 'auto';
  const _0x46d3ed = parseRatioLabel(_0x6f5dbb);
  if (!_0x46d3ed) return 'auto';
  const _0x17a333 = _0x46d3ed.label,
    _0x41df5f = new Set(getNanoBananaAllowedRatioLabels(_0x3451dc));
  return _0x41df5f.has(_0x17a333) ? _0x17a333 : normalizeNanoBananaRatioForFamily(_0x17a333, _0x3451dc);
}
function normalizeGrsaiGptImage2ImageSize(_0x5f471d, _0x5b797d) {
  const _0x3bbffc = getGrsaiGptImage2Policy(_0x5b797d),
    _0xf80650 = new Set(
      (Array.isArray(_0x3bbffc?.allowedSizes) ? _0x3bbffc.allowedSizes : ['1K']).map((_0x329aeb) =>
        String(_0x329aeb || '')
          .trim()
          .toUpperCase(),
      ),
    ),
    _0x3ad8f4 = String(_0x3bbffc?.defaultSize || '1K')
      .trim()
      .toUpperCase(),
    _0x532db8 = String(_0x5f471d || '')
      .trim()
      .toUpperCase();
  if (_0xf80650.has(_0x532db8)) return _0x532db8;
  return _0xf80650.has(_0x3ad8f4) ? _0x3ad8f4 : '1K';
}
function normalizePixelSize(_0x10585e) {
  const _0x9f93c1 = String(_0x10585e || '')
    .trim()
    .match(/^(\d{2,5})\s*[xX]\s*(\d{2,5})$/);
  if (!_0x9f93c1) return '';
  return _0x9f93c1[1] + 'x' + _0x9f93c1[2];
}
function getGrsaiGptImage2RatioOptionsForSize(_0x310db4, _0x3c362d) {
  const _0x27f113 = getGrsaiGptImage2PixelSizesByRatio(_0x3c362d);
  return Object.keys(_0x27f113)
    .filter((_0x3ea307) => _0x27f113[_0x3ea307]?.[_0x310db4])
    .map((_0xa1d385) => {
      const _0xbb6cc1 = parseRatioLabel(_0xa1d385) || { w: 1, h: 1 };
      return Object.freeze({ label: _0xa1d385, value: _0xbb6cc1.w / _0xbb6cc1.h });
    });
}
function getDefaultGrsaiGptImage2PixelSize(_0x14835e, _0x112636) {
  return _0x14835e['1:1']?.[_0x112636] || _0x14835e['1:1']?.['1K'] || '1024x1024';
}
function pickClosestGrsaiGptImage2RatioLabel(_0x4cd4ad, _0x5da978, _0x3d1dba) {
  const _0x25675e = parseRatioLabel(_0x4cd4ad),
    _0x28b856 = _0x25675e ? _0x25675e.w / _0x25675e.h : 1,
    _0x499a61 = getGrsaiGptImage2RatioOptionsForSize(_0x5da978, _0x3d1dba);
  let _0x3c0fcc = _0x499a61[0] || { label: '1:1', value: 1 },
    _0x13bf43 = Number.POSITIVE_INFINITY;
  for (const _0x1b0f91 of _0x499a61) {
    const _0x355ae7 = Math.abs(_0x28b856 - _0x1b0f91.value);
    _0x355ae7 < _0x13bf43 && ((_0x3c0fcc = _0x1b0f91), (_0x13bf43 = _0x355ae7));
  }
  return _0x3c0fcc?.label || '1:1';
}
function normalizeGrsaiGptImage2AspectRatio(_0x3a786a, _0x2d9a79, _0x4be92c) {
  const _0x596c21 = getGrsaiGptImage2PixelSizesByRatio(_0x4be92c),
    _0x261d8e = normalizePixelSize(_0x3a786a);
  if (_0x261d8e) return _0x261d8e;
  const _0x26d2e0 = normalizeRatioLabelText(_0x3a786a),
    _0x45b3ef = _0x26d2e0.toLowerCase();
  if (
    !_0x26d2e0 ||
    _0x45b3ef === 'auto' ||
    _0x45b3ef === 'adaptive' ||
    _0x45b3ef === 'default' ||
    _0x26d2e0 === '自适应' ||
    _0x26d2e0 === '默认'
  )
    return getDefaultGrsaiGptImage2PixelSize(_0x596c21, _0x2d9a79);
  const _0x365dbd = parseRatioLabel(_0x26d2e0),
    _0x16e837 = _0x365dbd?.label || '1:1',
    _0x3d5d0b = _0x596c21[_0x16e837]?.[_0x2d9a79];
  if (_0x3d5d0b) return _0x3d5d0b;
  const _0x5b0d2f = pickClosestGrsaiGptImage2RatioLabel(_0x16e837, _0x2d9a79, _0x4be92c);
  return _0x596c21[_0x5b0d2f]?.[_0x2d9a79] || getDefaultGrsaiGptImage2PixelSize(_0x596c21, _0x2d9a79);
}
function grsaiImage({
  payload: _0x3a0f3d,
  finalPrompt: _0x57f3ea,
  modelToken: _0x47eb8b,
  finalUrls: _0x505628,
}) {
  const _0x5dd540 = normalizeGrsaiImageModel(_0x47eb8b || _0x3a0f3d.model || 'nano-banana-pro-vt'),
    _0x4e0d61 = getGrsaiNanoBananaSelection(_0x5dd540),
    _0x8d9cbe = _0x3a0f3d.resolvedRatioLabel || _0x3a0f3d.aspectRatio,
    _0x3cf2e1 = _0x4e0d61 ? normalizeGrsaiNanoBananaAspectRatio(_0x8d9cbe, _0x4e0d61.family) : _0x8d9cbe,
    _0x4e6db6 = _0x4e0d61
      ? normalizeGrsaiNanoBananaImageSize(_0x3a0f3d.imageSize, _0x5dd540)
      : _0x3a0f3d.imageSize || '2K';
  return {
    model: _0x5dd540,
    prompt: _0x57f3ea,
    images: _0x505628,
    replyType: 'json',
    ...(!_0x3a0f3d.suppressImageSize && !shouldOmitImageSizeParam(_0x5dd540) && { imageSize: _0x4e6db6 }),
    ...(!_0x3a0f3d.suppressAspectRatio && _0x3cf2e1 && { aspectRatio: _0x3cf2e1 }),
  };
}
function grsaiGptImage2Image({
  payload: _0x4b5a2b,
  finalPrompt: _0x13edfd,
  modelToken: _0x19f0db,
  finalUrls: _0x12d4a3,
}) {
  const _0x126d21 = normalizeGrsaiImageModel(_0x19f0db || _0x4b5a2b.model || 'gpt-image-2'),
    _0x126876 = normalizeGrsaiGptImage2ImageSize(_0x4b5a2b.imageSize, _0x126d21),
    _0x14c572 = normalizeGrsaiGptImage2AspectRatio(
      _0x4b5a2b.resolvedRatioLabel || _0x4b5a2b.aspectRatio,
      _0x126876,
      _0x126d21,
    );
  return {
    model: _0x126d21,
    prompt: _0x13edfd,
    images: _0x12d4a3,
    replyType: 'json',
    ...(!_0x4b5a2b.suppressAspectRatio && _0x14c572 && { aspectRatio: _0x14c572 }),
  };
}
function normalizeRunningHubModelId(_0x16bfb6) {
  return stripPrefix(_0x16bfb6, 'runninghub-model/');
}
function getRunningHubImageExecutionPolicy({ executionManifest: _0x1abbb1, modelManifest: _0x23b322 } = {}) {
  const _0x311e47 = _0x1abbb1?.extensions?.runningHubImage || _0x23b322?.extensions?.runningHubImage;
  return _0x311e47 && typeof _0x311e47 === 'object' && !Array.isArray(_0x311e47) ? _0x311e47 : {};
}
function normalizeRunningHubImageRoute(_0x6d83cf = {}) {
  const _0x2185f9 = String(_0x6d83cf?.rhModelRoute ?? _0x6d83cf?.generationParams?.rhModelRoute ?? '')
    .trim()
    .toLowerCase();
  return _0x2185f9 || 'low';
}
function isPlainRunningHubPolicyObject(_0x788317) {
  return _0x788317 && typeof _0x788317 === 'object' && !Array.isArray(_0x788317);
}
function pickRunningHubRouteValue(_0x3e0f90, _0x49c792) {
  if (!isPlainRunningHubPolicyObject(_0x3e0f90)) return undefined;
  if (Object.prototype.hasOwnProperty.call(_0x3e0f90, _0x49c792)) return _0x3e0f90[_0x49c792];
  if (Object.prototype.hasOwnProperty.call(_0x3e0f90, 'default')) return _0x3e0f90.default;
  return undefined;
}
function pickRunningHubPolicyValue(_0x3cb6d2, _0x3f85f5, _0x2a4552) {
  const _0x51866f = pickRunningHubRouteValue(_0x3cb6d2?.[_0x3f85f5 + 'ByRoute'], _0x2a4552);
  return _0x51866f !== undefined ? _0x51866f : _0x3cb6d2?.[_0x3f85f5];
}
function mergeRunningHubRoutePolicyObject(_0x19439b, _0x416684, _0x1861b4) {
  const _0x28060d = isPlainRunningHubPolicyObject(_0x19439b?.[_0x416684]) ? _0x19439b[_0x416684] : {},
    _0x32b48a = pickRunningHubRouteValue(_0x19439b?.[_0x416684 + 'ByRoute'], _0x1861b4);
  if (!isPlainRunningHubPolicyObject(_0x32b48a)) return _0x28060d;
  return { ..._0x28060d, ..._0x32b48a };
}
function resolveRunningHubImageRoutePolicy(_0x3b4894, _0x252e1b = {}) {
  const _0x1f68dd = normalizeRunningHubImageRoute(_0x252e1b);
  return {
    ..._0x3b4894,
    route: _0x1f68dd,
    textEndpoint: pickRunningHubPolicyValue(_0x3b4894, 'textEndpoint', _0x1f68dd),
    inputEndpoint: pickRunningHubPolicyValue(_0x3b4894, 'inputEndpoint', _0x1f68dd),
    omitResolution: pickRunningHubPolicyValue(_0x3b4894, 'omitResolution', _0x1f68dd),
    quality: pickRunningHubPolicyValue(_0x3b4894, 'quality', _0x1f68dd),
    omitAspectRatio: pickRunningHubPolicyValue(_0x3b4894, 'omitAspectRatio', _0x1f68dd),
    aspectRatioValueMap: pickRunningHubPolicyValue(_0x3b4894, 'aspectRatioValueMap', _0x1f68dd),
    omitAspectRatioWhenInput: pickRunningHubPolicyValue(_0x3b4894, 'omitAspectRatioWhenInput', _0x1f68dd),
    inputSlotBodyFields: pickRunningHubPolicyValue(_0x3b4894, 'inputSlotBodyFields', _0x1f68dd),
    constantParams: mergeRunningHubRoutePolicyObject(_0x3b4894, 'constantParams', _0x1f68dd),
    defaultParams: mergeRunningHubRoutePolicyObject(_0x3b4894, 'defaultParams', _0x1f68dd),
    bodyParamTypes: mergeRunningHubRoutePolicyObject(_0x3b4894, 'bodyParamTypes', _0x1f68dd),
    bodyParamInputModes: mergeRunningHubRoutePolicyObject(_0x3b4894, 'bodyParamInputModes', _0x1f68dd),
  };
}
function resolveRunningHubModelEndpoint({
  hasInputImages: _0x330124,
  executionManifest: _0x142d1e,
  modelManifest: _0x31ac53,
  payload: _0x101dc0,
}) {
  const _0x5134a5 = resolveRunningHubImageRoutePolicy(
    getRunningHubImageExecutionPolicy({ executionManifest: _0x142d1e, modelManifest: _0x31ac53 }),
    _0x101dc0,
  );
  if (!_0x330124) return _0x5134a5.textEndpoint || 'text-to-image';
  return _0x5134a5.inputEndpoint || 'image-to-image';
}
function normalizeRunningHubInputUrlsBySlot(_0x297ef7) {
  if (!_0x297ef7 || typeof _0x297ef7 !== 'object' || Array.isArray(_0x297ef7)) return {};
  return Object.fromEntries(
    Object.entries(_0x297ef7)
      .map(([_0x1ba3ca, _0x2f4ef0]) => [String(_0x1ba3ca || '').trim(), String(_0x2f4ef0 || '').trim()])
      .filter(([_0x299d38, _0x5d1604]) => _0x299d38 && _0x5d1604),
  );
}
function normalizeRunningHubBodyParamValue(_0x299b79, _0x31aae0) {
  const _0x5c48d3 = String(_0x31aae0 || 'string')
    .trim()
    .toLowerCase();
  if (_0x5c48d3 === 'boolean') {
    if (_0x299b79 === true || _0x299b79 === false) return _0x299b79;
    const _0x15f8c2 = String(_0x299b79 ?? '')
      .trim()
      .toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(_0x15f8c2)) return true;
    if (['false', '0', 'no', 'off', ''].includes(_0x15f8c2)) return false;
    return Boolean(_0x299b79);
  }
  if (_0x5c48d3 === 'integer') {
    const _0x9cd0a9 = Number.parseInt(String(_0x299b79 ?? '').trim(), 10);
    return Number.isFinite(_0x9cd0a9) ? _0x9cd0a9 : null;
  }
  if (_0x5c48d3 === 'number') {
    const _0x1c84a9 = Number(_0x299b79);
    return Number.isFinite(_0x1c84a9) ? _0x1c84a9 : null;
  }
  return String(_0x299b79 ?? '').trim();
}
function normalizeRunningHubAspectRatioValueMap(_0x2f5a07) {
  return _0x2f5a07 && typeof _0x2f5a07 === 'object' && !Array.isArray(_0x2f5a07) ? _0x2f5a07 : {};
}
function hasRunningHubAspectRatioValueMap(_0x1d57c5) {
  return Object.keys(normalizeRunningHubAspectRatioValueMap(_0x1d57c5?.aspectRatioValueMap)).length > 0;
}
function resolveRunningHubMappedAspectRatio(_0x4e4cbc, _0x4f89a6) {
  const _0x282785 = String(_0x4e4cbc || '').trim();
  if (!_0x282785) return '';
  const _0x43177b = normalizeRunningHubAspectRatioValueMap(_0x4f89a6?.aspectRatioValueMap),
    _0x2184ab = Object.entries(_0x43177b)
      .map(([_0x47baa7, _0x36e7a4]) => [normalizeRatioLabelText(_0x47baa7), String(_0x36e7a4 || '').trim()])
      .filter(([_0x1d8f05, _0x1f7165]) => _0x1d8f05 && _0x1f7165);
  if (_0x2184ab.length === 0) return _0x282785;
  const _0x19d642 = normalizeRatioLabelText(_0x282785),
    _0x58f513 = _0x2184ab.find(([_0x2591a5]) => _0x2591a5 === _0x19d642);
  if (_0x58f513) return _0x58f513[1];
  const _0x23c80e = _0x19d642.toLowerCase(),
    _0xf18a35 = _0x2184ab.find(([, _0x21bc6e]) => _0x21bc6e.toLowerCase() === _0x23c80e);
  if (_0xf18a35) return _0xf18a35[1];
  const _0x2635e4 = parseRatioLabel(_0x19d642);
  if (!_0x2635e4) return _0x282785;
  const _0x27d626 = _0x2635e4.w / _0x2635e4.h;
  let _0xa1d39a = null,
    _0x1cac8f = Number.POSITIVE_INFINITY;
  return (
    _0x2184ab.forEach(([_0x2f9e62, _0x2a5eef]) => {
      const _0x23310a = parseRatioLabel(_0x2f9e62);
      if (!_0x23310a) return;
      const _0x3f6255 = Math.abs(_0x23310a.w / _0x23310a.h - _0x27d626);
      _0x3f6255 < _0x1cac8f && ((_0xa1d39a = _0x2a5eef), (_0x1cac8f = _0x3f6255));
    }),
    _0xa1d39a || _0x282785
  );
}
function assignRunningHubInputSlotFields(_0x1eb639, _0x368b9e, _0xb27134) {
  const _0x55a4f3 =
    _0x368b9e?.inputSlotBodyFields &&
    typeof _0x368b9e.inputSlotBodyFields === 'object' &&
    !Array.isArray(_0x368b9e.inputSlotBodyFields)
      ? _0x368b9e.inputSlotBodyFields
      : null;
  if (!_0x55a4f3) return {};
  const _0x42d4f9 = normalizeRunningHubInputUrlsBySlot(_0xb27134);
  return (
    Object.entries(_0x55a4f3).forEach(([_0x23565c, _0x28fbeb]) => {
      const _0x143624 = String(_0x28fbeb || '').trim(),
        _0x44d186 = _0x42d4f9[String(_0x23565c || '').trim()];
      if (_0x143624 && _0x44d186) _0x1eb639[_0x143624] = _0x44d186;
    }),
    _0x42d4f9
  );
}
function shouldIncludeRunningHubPolicyParam(_0xfdb35f, _0x18447a, _0x47a9d1) {
  const _0xb2a16c =
      _0x18447a?.conditionalParams &&
      typeof _0x18447a.conditionalParams === 'object' &&
      !Array.isArray(_0x18447a.conditionalParams)
        ? _0x18447a.conditionalParams
        : {},
    _0x4a68ba = String(_0xb2a16c[_0xfdb35f] || '').trim();
  if (!_0x4a68ba) return true;
  return !!_0x47a9d1?.[_0x4a68ba];
}
function shouldIncludeRunningHubParamForInputMode(_0x535480, _0x4456b4, _0x1cad59) {
  const _0x4ed317 =
      _0x4456b4?.bodyParamInputModes &&
      typeof _0x4456b4.bodyParamInputModes === 'object' &&
      !Array.isArray(_0x4456b4.bodyParamInputModes)
        ? _0x4456b4.bodyParamInputModes
        : {},
    _0xabdde2 = String(_0x4ed317[_0x535480] || '')
      .trim()
      .toLowerCase();
  if (!_0xabdde2) return true;
  if (_0xabdde2 === 'textonly' || _0xabdde2 === 'text-only') return !_0x1cad59;
  if (_0xabdde2 === 'inputonly' || _0xabdde2 === 'input-only') return _0x1cad59;
  return true;
}
function assignRunningHubPolicyParams(
  _0x3c0a82,
  _0x3f4dd1,
  _0x7250,
  _0x524d82,
  { hasInputImages: hasInputImages = false } = {},
) {
  const _0x13291c =
    _0x7250?.constantParams &&
    typeof _0x7250.constantParams === 'object' &&
    !Array.isArray(_0x7250.constantParams)
      ? _0x7250.constantParams
      : {};
  Object.entries(_0x13291c).forEach(([_0x2b5ce5, _0x528e60]) => {
    if (!shouldIncludeRunningHubPolicyParam(_0x2b5ce5, _0x7250, _0x524d82)) return;
    if (!shouldIncludeRunningHubParamForInputMode(_0x2b5ce5, _0x7250, hasInputImages)) return;
    _0x3c0a82[_0x2b5ce5] = _0x528e60;
  });
  const _0x1dc907 =
    _0x7250?.bodyParamTypes &&
    typeof _0x7250.bodyParamTypes === 'object' &&
    !Array.isArray(_0x7250.bodyParamTypes)
      ? _0x7250.bodyParamTypes
      : {};
  Object.entries(_0x1dc907).forEach(([_0x4ec932, _0x4e73a1]) => {
    if (Object.prototype.hasOwnProperty.call(_0x3c0a82, _0x4ec932)) return;
    if (!Object.prototype.hasOwnProperty.call(_0x3f4dd1 || {}, _0x4ec932)) return;
    if (!shouldIncludeRunningHubPolicyParam(_0x4ec932, _0x7250, _0x524d82)) return;
    if (!shouldIncludeRunningHubParamForInputMode(_0x4ec932, _0x7250, hasInputImages)) return;
    const _0x597c2a = _0x3f4dd1[_0x4ec932];
    if (_0x597c2a === undefined || _0x597c2a === null) return;
    if (typeof _0x597c2a === 'string' && _0x597c2a.trim() === '') return;
    const _0x78bc5c = normalizeRunningHubBodyParamValue(_0x597c2a, _0x4e73a1);
    if (_0x78bc5c === null || _0x78bc5c === '') return;
    _0x3c0a82[_0x4ec932] = _0x78bc5c;
  });
  const _0xcc9eee =
    _0x7250?.defaultParams &&
    typeof _0x7250.defaultParams === 'object' &&
    !Array.isArray(_0x7250.defaultParams)
      ? _0x7250.defaultParams
      : {};
  Object.entries(_0xcc9eee).forEach(([_0x359239, _0x346449]) => {
    if (Object.prototype.hasOwnProperty.call(_0x3c0a82, _0x359239)) return;
    if (!shouldIncludeRunningHubPolicyParam(_0x359239, _0x7250, _0x524d82)) return;
    if (!shouldIncludeRunningHubParamForInputMode(_0x359239, _0x7250, hasInputImages)) return;
    _0x3c0a82[_0x359239] = _0x346449;
  });
}
function normalizeRunningHubModelQuality(_0x61064e) {
  const _0x15b761 = String(_0x61064e || '')
    .trim()
    .toUpperCase();
  return RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[_0x15b761] ? _0x15b761 : RUNNINGHUB_MODEL_DEFAULT_QUALITY;
}
function normalizeRunningHubModelRatio(_0x55c074) {
  const _0x501ba6 = String(_0x55c074 || '').trim();
  if (!_0x501ba6) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const _0x3c039e = normalizeRatioLabelText(_0x501ba6),
    _0x360e17 = _0x3c039e.toLowerCase();
  if (_0x360e17 === 'auto' || _0x360e17 === 'default' || _0x360e17 === 'original' || _0x360e17 === 'adaptive')
    return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  if (!_0x3c039e.includes(':')) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const [_0x288ffd, _0x2dfaad] = _0x3c039e.split(':'),
    _0x56772c = Number.parseFloat(_0x288ffd),
    _0x230ef3 = Number.parseFloat(_0x2dfaad);
  if (!(_0x56772c > 0 && _0x230ef3 > 0)) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const _0x3933f7 = _0x56772c + ':' + _0x230ef3;
  return RUNNINGHUB_MODEL_RATIO_SET.has(_0x3933f7) ? _0x3933f7 : RUNNINGHUB_MODEL_DEFAULT_RATIO;
}
function alignRunningHubDimension(_0x4466ee) {
  const _0x204c1d =
    Math.round(Number(_0x4466ee || 0) / RUNNINGHUB_MODEL_DIMENSION_ALIGN) * RUNNINGHUB_MODEL_DIMENSION_ALIGN;
  return Math.max(RUNNINGHUB_MODEL_DIMENSION_MIN, Math.min(RUNNINGHUB_MODEL_DIMENSION_MAX, _0x204c1d));
}
function resolveRunningHubModelDimensions(_0x3412f5, _0x5bc26c) {
  const _0x15056f = normalizeRunningHubModelQuality(_0x3412f5),
    _0x75a845 = normalizeRunningHubModelRatio(_0x5bc26c),
    [_0x704fee, _0x329e84] = _0x75a845.split(':'),
    _0x312f7b = Number.parseFloat(_0x704fee) || 1,
    _0x278577 = Number.parseFloat(_0x329e84) || 1,
    _0x57ff59 =
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[_0x15056f] ||
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[RUNNINGHUB_MODEL_DEFAULT_QUALITY],
    _0x1bd94a = _0x312f7b / _0x278577,
    _0x3da0b4 = Math.sqrt(_0x57ff59 / _0x1bd94a),
    _0x34067f = _0x3da0b4 * _0x1bd94a;
  return { width: alignRunningHubDimension(_0x34067f), height: alignRunningHubDimension(_0x3da0b4) };
}
function isAdaptiveRatioInput(_0x1cf1ee) {
  const _0x3fcbe7 = String(_0x1cf1ee || '').trim();
  if (!_0x3fcbe7) return true;
  const _0x325bfa = normalizeRatioLabelText(_0x3fcbe7),
    _0x42ab45 = _0x325bfa.toLowerCase();
  if (/^\d+x\d+$/i.test(_0x325bfa)) return false;
  return (
    _0x42ab45 === 'auto' ||
    _0x42ab45 === 'default' ||
    _0x42ab45 === 'adaptive' ||
    _0x42ab45 === 'original' ||
    !_0x325bfa.includes(':')
  );
}
function runninghubImage({
  payload: _0x369c0e,
  finalPrompt: _0x4020ae,
  modelToken: _0x460247,
  finalUrls: _0x45892e,
  finalUrlsBySlot: finalUrlsBySlot = {},
  executionManifest: _0x1cef5d,
  modelManifest: _0xfe4ab0,
}) {
  const _0x515f91 = normalizeRunningHubModelId(_0x460247),
    _0x525388 = resolveRunningHubImageRoutePolicy(
      getRunningHubImageExecutionPolicy({ executionManifest: _0x1cef5d, modelManifest: _0xfe4ab0 }),
      _0x369c0e,
    ),
    _0x518553 = _0xfe4ab0?.modelId || 'runninghub-model/' + _0x515f91,
    _0x383d31 = _0x525388.omitResolution === true || isRunningHubModelWithoutImageSizeParam(_0x369c0e.model),
    _0x1251c4 =
      normalizeImageSizeForProviderModel({
        model: _0x518553,
        provider: 'runninghub',
        imageSize: _0x369c0e.imageSize,
      }) || _0x369c0e.imageSize,
    _0x5122a2 = { '1K': '1k', '2K': '2k', '4K': '4k' },
    _0x126ffd = _0x5122a2[_0x1251c4] || '2k',
    _0x493887 = resolveProviderRatioPayload({
      provider: 'runninghub',
      model: 'runninghub-model/' + _0x515f91,
      ratioLabel: _0x369c0e.resolvedRatioLabel || _0x369c0e.aspectRatio,
      imageSize: _0x1251c4,
      suppressAspectRatio: _0x369c0e.suppressAspectRatio,
    }),
    _0x2df6fa = String(_0x493887?.params?.aspectRatio || '').trim(),
    _0xa5a463 = _0x369c0e.resolvedRatioLabel || _0x369c0e.aspectRatio,
    _0x13726e = resolveRunningHubMappedAspectRatio(
      hasRunningHubAspectRatioValueMap(_0x525388) ? _0xa5a463 || _0x2df6fa : _0x2df6fa,
      _0x525388,
    ),
    _0x2db806 = _0x13726e.toLowerCase(),
    _0x39d5f3 =
      _0x525388.aspectRatioMode === 'dimensions' ||
      _0xfe4ab0?.extensions?.ratioPolicy?.capability === 'dimensions',
    _0x3902e9 = _0x39d5f3
      ? _0x493887?.ratioCapability === 'dimensions'
        ? {
            width: Number(_0x493887?.params?.width) || 0x800,
            height: Number(_0x493887?.params?.height) || 0x800,
          }
        : resolveRunningHubModelDimensions(_0x1251c4, _0x369c0e.aspectRatio)
      : null,
    _0x15f6a7 =
      _0x39d5f3 ||
      _0x525388.omitAspectRatio === true ||
      (_0x525388.omitAspectRatioWhenInput === true && _0x45892e.length > 0) ||
      _0x369c0e.suppressAspectRatio ||
      isAdaptiveRatioInput(_0xa5a463) ||
      !_0x13726e ||
      _0x2db806 === 'auto' ||
      _0x2db806 === 'default' ||
      _0x2db806 === 'adaptive' ||
      _0x2db806 === 'original',
    _0x5c20f3 = {
      prompt: _0x4020ae || '',
      ...(_0x39d5f3
        ? { width: _0x3902e9?.width || 0x800, height: _0x3902e9?.height || 0x800 }
        : !_0x383d31
          ? { resolution: _0x126ffd }
          : {}),
      ...(_0x525388.quality ? { quality: _0x525388.quality } : {}),
      ...(!_0x15f6a7 && { aspectRatio: _0x13726e }),
      ...(_0x369c0e.negativePrompt && { negativePrompt: _0x369c0e.negativePrompt }),
      ...(_0x369c0e.seed && { seed: _0x369c0e.seed }),
    },
    _0x2c629d = assignRunningHubInputSlotFields(_0x5c20f3, _0x525388, finalUrlsBySlot);
  return (
    assignRunningHubPolicyParams(_0x5c20f3, _0x369c0e, _0x525388, _0x2c629d, {
      hasInputImages: _0x45892e.length > 0,
    }),
    _0x45892e.length > 0 && !_0x525388.inputSlotBodyFields && (_0x5c20f3.imageUrls = _0x45892e),
    _0x5c20f3
  );
}
function normalizeSeedanceVideoSize(_0x329e7b) {
  const _0x2374a2 = String(_0x329e7b || '').trim();
  if (!_0x2374a2 || _0x2374a2 === 'auto' || _0x2374a2 === 'default') return '16:9';
  return normalizeRatioLabelText(_0x2374a2);
}
function normalizeSeedanceAspectRatio(_0x16e7c5) {
  return normalizeSeedanceVideoSize(_0x16e7c5 || '16:9');
}
function getApimartSeedanceVideoPolicy(_0x3980af) {
  const _0x1ea5db = _0x3980af?.extensions?.seedanceVideo;
  return _0x1ea5db && typeof _0x1ea5db === 'object' && !Array.isArray(_0x1ea5db) ? _0x1ea5db : {};
}
function normalizePositiveInteger(_0xc50ce2, _0x3c35e6) {
  const _0x265029 = Number.parseInt(String(_0xc50ce2 ?? '').trim(), 10);
  return Number.isFinite(_0x265029) && _0x265029 >= 0 ? _0x265029 : _0x3c35e6;
}
function normalizeInputList(_0x3b5418) {
  return Array.isArray(_0x3b5418)
    ? _0x3b5418.map((_0x4dc2de) => String(_0x4dc2de || '').trim()).filter(Boolean)
    : [];
}
function normalizeApimartVeo3ModelChoice(_0xc1f1f) {
  const _0x544fd7 = String(_0xc1f1f || '')
    .trim()
    .toLowerCase();
  return VEO3_MODEL_CHOICES.has(_0x544fd7) ? _0x544fd7 : 'fast';
}
function getApimartVeo3ModelChoice(_0x1e01dd = {}) {
  return normalizeApimartVeo3ModelChoice(_0x1e01dd?.generationParams?.mode ?? _0x1e01dd?.mode);
}
function normalizeApimartVeo3GenerationType(_0x45cc78, { modelChoice: modelChoice = 'fast' } = {}) {
  const _0x5b0c08 = String(_0x45cc78 || '')
      .trim()
      .toLowerCase(),
    _0x4b4ddb = VEO3_IMAGE_GENERATION_TYPES.has(_0x5b0c08) ? _0x5b0c08 : 'frame';
  if (normalizeApimartVeo3ModelChoice(modelChoice) === 'quality') return 'frame';
  return _0x4b4ddb;
}
function getApimartVeo3GenerationType(_0x3c8317 = {}) {
  const _0x58591f = getApimartVeo3ModelChoice(_0x3c8317);
  return normalizeApimartVeo3GenerationType(
    _0x3c8317?.generationParams?.generation_type ?? _0x3c8317?.generation_type,
    { modelChoice: _0x58591f },
  );
}
function validateApimartVeo3ImageCount(
  _0x3c59dc = {},
  _0x57c4f1 = 0,
  { allowTextOnly: allowTextOnly = false } = {},
) {
  const _0x5d2ee5 = Math.max(0, Math.trunc(Number(_0x57c4f1) || 0));
  if (allowTextOnly && _0x5d2ee5 === 0) return Object.freeze({ ok: true, message: '' });
  const _0x3eb019 = getApimartVeo3GenerationType(_0x3c59dc);
  if (_0x3eb019 === 'reference')
    return Object.freeze({
      ok: _0x5d2ee5 <= 3,
      message: _0x5d2ee5 <= 3 ? '' : 'VEO3 参考图模式最多接入 3 张图片',
    });
  return Object.freeze({
    ok: _0x5d2ee5 <= 2,
    message: _0x5d2ee5 <= 2 ? '' : 'VEO3 首尾帧模式最多接入 2 张图片',
  });
}
function collectVideoInputUrls(_0x3c8c31) {
  return Array.from(
    new Set(
      [
        String(_0x3c8c31.videoUrl || '').trim(),
        ...normalizeInputList(_0x3c8c31.videos),
        ...normalizeInputList(_0x3c8c31.videoUrls),
      ].filter(Boolean),
    ),
  );
}
function collectAudioInputUrls(_0x2b80b2) {
  return Array.from(
    new Set(
      [
        String(_0x2b80b2.audioUrl || '').trim(),
        ...normalizeInputList(_0x2b80b2.audios),
        ...normalizeInputList(_0x2b80b2.audioUrls),
      ].filter(Boolean),
    ),
  );
}
async function resolveInputVideos(_0x8d821e, _0x11bab2, _0xcd735e) {
  const _0x2903c0 = collectVideoInputUrls(_0x8d821e);
  if (_0x2903c0.length === 0) return [];
  if (typeof _0xcd735e.processInputVideos !== 'function')
    throw new Error('APIMART video input upload is not available');
  const _0x2981e9 = await _0xcd735e.processInputVideos(_0x2903c0, _0x11bab2, {
    provider: 'apimart',
    strictUpload: true,
  });
  if (!Array.isArray(_0x2981e9) || _0x2981e9.length === 0) throw new Error('APIMART video upload failed');
  return _0x2981e9.map((_0x3dd990) => String(_0x3dd990 || '').trim()).filter(Boolean);
}
async function resolveInputAudios(_0x452948, _0x5e13f3, _0x4d5a15) {
  const _0xf25446 = collectAudioInputUrls(_0x452948);
  if (_0xf25446.length === 0) return [];
  if (typeof _0x4d5a15.processInputAudios !== 'function')
    throw new Error('APIMART audio input upload is not available');
  const _0x3285aa = await _0x4d5a15.processInputAudios(_0xf25446, _0x5e13f3, {
    provider: 'apimart',
    strictUpload: true,
  });
  if (!Array.isArray(_0x3285aa) || _0x3285aa.length === 0) throw new Error('APIMART audio upload failed');
  return _0x3285aa.map((_0x290d5b) => String(_0x290d5b || '').trim()).filter(Boolean);
}
async function apimartSeedanceVideo({
  payload: _0x4245eb,
  finalPrompt: _0x434068,
  modelToken: _0x1fed30,
  apiKey: _0x1dcb35,
  ctx: _0x5f2f7b,
  executionManifest: _0x372dbf,
}) {
  const _0x9be448 = _0x1fed30 || stripPrefix(_0x4245eb.model, 'apimart/'),
    _0x5069ad = getApimartSeedanceVideoPolicy(_0x372dbf),
    _0x314f73 = supportsApimartPrivateAvatarAssets(_0x9be448, _0x5069ad),
    _0x2f0077 = _0x5069ad.supportsVideoReferences === true,
    _0x16a7cd = _0x5069ad.supportsAudioReferences === true,
    _0x3ef2a6 = applyApimartPrivateAvatarAssetsToUrls(collectVideoInputUrls(_0x4245eb), _0x4245eb, {
      sourceKind: 'video',
      enabled: _0x314f73,
    });
  if (!_0x2f0077 && _0x3ef2a6.length > 0)
    throw new Error('APIMart Seedance model does not support video references');
  const _0xd45e8d =
      _0x3ef2a6.length > 0 && _0x2f0077 ? await resolveInputVideos(_0x4245eb, _0x1dcb35, _0x5f2f7b) : [],
    _0x5e3e6c = applyApimartPrivateAvatarAssetsToUrls(
      [
        String(_0x4245eb.first || _0x4245eb.firstFrameUrl || '').trim(),
        String(_0x4245eb.last || _0x4245eb.lastFrameUrl || '').trim(),
      ].filter(Boolean),
      _0x4245eb,
      { sourceKind: 'image', enabled: _0x314f73 },
    ),
    _0x197c62 = normalizePositiveInteger(_0x5069ad.maxRoleImageCount, 2);
  if (_0x5e3e6c.length > _0x197c62)
    throw new Error(
      _0x5069ad.roleImageLimitError || 'APIMart Seedance model does not support this many role images',
    );
  let _0x3510c3 = [];
  if (_0x5e3e6c.length > 0) {
    const _0x1fe488 = await _0x5f2f7b.processInputImages(_0x5e3e6c, _0x1dcb35, {
      applyInputQualityProfile: true,
      provider: 'apimart',
      strictUpload: true,
    });
    _0x3510c3 = [
      _0x1fe488?.[0] ? { url: String(_0x1fe488[0]).trim(), role: 'first_frame' } : null,
      _0x1fe488?.[1] ? { url: String(_0x1fe488[1]).trim(), role: 'last_frame' } : null,
    ].filter(Boolean);
  }
  const _0x447c3e = Array.isArray(_0x4245eb.images)
      ? _0x4245eb.images
      : Array.isArray(_0x4245eb.inputUrls)
        ? _0x4245eb.inputUrls
        : [],
    _0x13f24a = applyApimartPrivateAvatarAssetsToUrls(_0x447c3e, _0x4245eb, {
      sourceKind: 'image',
      enabled: _0x314f73,
    }),
    _0xc4afe6 =
      _0x13f24a.length > 0 && _0x3510c3.length <= 0
        ? await _0x5f2f7b.processInputImages(_0x13f24a, _0x1dcb35, {
            applyInputQualityProfile: true,
            provider: 'apimart',
            strictUpload: true,
          })
        : [],
    _0x352393 = applyApimartPrivateAvatarAssetsToUrls(collectAudioInputUrls(_0x4245eb), _0x4245eb, {
      sourceKind: 'audio',
      enabled: _0x314f73,
    });
  if (!_0x16a7cd && _0x352393.length > 0)
    throw new Error('APIMart Seedance model does not support audio references');
  const _0x354b85 =
      _0x16a7cd && _0x352393.length > 0 ? await resolveInputAudios(_0x4245eb, _0x1dcb35, _0x5f2f7b) : [],
    _0x52d5b4 = {
      model: _0x9be448,
      prompt: _0x434068,
      duration: _0x4245eb.duration || 5,
      resolution: _0x4245eb.resolution || _0x5069ad.defaultResolution || '720p',
    };
  _0x5069ad.ratioField === 'size'
    ? (_0x52d5b4.size = normalizeSeedanceVideoSize(
        _0x4245eb.resolvedRatioLabel || _0x4245eb.aspectRatio || _0x4245eb.size,
      ))
    : (_0x52d5b4.aspect_ratio = normalizeSeedanceAspectRatio(
        _0x4245eb.resolvedRatioLabel || _0x4245eb.aspectRatio || _0x4245eb.aspect_ratio,
      ));
  if (isPresentValue(_0x4245eb.seed)) _0x52d5b4.seed = _0x4245eb.seed;
  _0x5069ad.supportsGenerateAudioParam === true &&
    (_0x4245eb.audio === true || _0x4245eb.generateAudio === true) &&
    (_0x52d5b4.audio = true);
  _0x5069ad.supportsCameraFixedParam === true &&
    _0x4245eb.camerafixed === true &&
    (_0x52d5b4.camerafixed = true);
  if (_0x3510c3.length > 0) _0x52d5b4.image_with_roles = _0x3510c3;
  else {
    if (_0xc4afe6.length > 0) {
      const _0x5d6131 = normalizePositiveInteger(_0x5069ad.maxImageCount, 1);
      _0x52d5b4.image_urls = _0xc4afe6.slice(0, _0x5d6131);
    }
  }
  return (
    _0x2f0077 &&
      _0x3510c3.length <= 0 &&
      _0xd45e8d.length > 0 &&
      (_0x52d5b4.video_urls = _0xd45e8d.slice(
        0,
        normalizePositiveInteger(_0x5069ad.maxVideoReferenceCount, 3),
      )),
    _0x16a7cd &&
      _0x3510c3.length <= 0 &&
      _0x354b85.length > 0 &&
      (_0x52d5b4.audio_urls = _0x354b85.slice(
        0,
        normalizePositiveInteger(_0x5069ad.maxAudioReferenceCount, 3),
      )),
    _0x52d5b4
  );
}
function apimartOmniFlashVideo({ currentBody: _0x15ed69 }) {
  const _0x42a7ba = { ..._0x15ed69 };
  return (normalizeInputList(_0x42a7ba.video_urls).length > 0 && delete _0x42a7ba.duration, _0x42a7ba);
}
function apimartVeo3Video({ currentBody: _0xe8d9ae, inputImages: inputImages = [], payload: payload = {} }) {
  const _0x241304 = { ..._0xe8d9ae },
    _0x798af2 = normalizeInputList(inputImages),
    _0x3d05c9 = getApimartVeo3ModelChoice(payload),
    _0x2a70ea = getApimartVeo3GenerationType(payload);
  ((_0x241304.duration = 8), delete _0x241304.official_fallback);
  const _0x489858 = String(_0x241304.resolution || '')
    .trim()
    .toLowerCase();
  if (_0x241304.enable_gif === true && (_0x489858 === '1080p' || _0x489858 === '4k'))
    throw new Error('APIMart VEO3 GIF output only supports 720p resolution');
  const _0x50cc79 = validateApimartVeo3ImageCount(
    { generationParams: { mode: _0x3d05c9, generation_type: _0x2a70ea } },
    _0x798af2.length,
    { allowTextOnly: true },
  );
  if (!_0x50cc79.ok) throw new Error(_0x50cc79.message);
  if (_0x798af2.length === 0)
    return (delete _0x241304.generation_type, delete _0x241304.image_urls, _0x241304);
  return (
    (_0x241304.generation_type = _0x2a70ea === 'reference' ? 'reference' : 'frame'),
    (_0x241304.image_urls =
      _0x241304.generation_type === 'reference' ? _0x798af2.slice(0, 3) : _0x798af2.slice(0, 2)),
    _0x241304
  );
}
function apimartHappyHorseVideo({
  currentBody: _0x3fba3e,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x1a233e = { ..._0x3fba3e },
    _0x4b5de3 = String(_0x1a233e.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!_0x4b5de3) throw new Error('HappyHorse 1.0 prompt is required');
  const _0x4f10d7 = normalizeInputList(inputImages),
    _0x3a9b73 = normalizeInputList(inputVideos),
    _0x16ba1b = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    _0x46c726 = (_0x21e514 = [], _0x56e598 = []) => {
      const _0x160e2a = [],
        _0x26aadd = (_0x58f72f) => {
          const _0x766239 = String(_0x58f72f || '').trim();
          if (_0x766239 && !_0x160e2a.includes(_0x766239)) _0x160e2a.push(_0x766239);
        };
      return (
        _0x21e514.forEach((_0x2e5e73) => _0x26aadd(_0x16ba1b[_0x2e5e73])),
        normalizeInputList(_0x56e598).forEach(_0x26aadd),
        _0x160e2a
      );
    };
  let _0x1ad729 = String(
    payload?.generationParams?.happyhorse_mode || payload?.happyhorse_mode || 'auto',
  ).trim();
  const _0x2a1f4f = _0x4f10d7.length > 0 || _0x3a9b73.length > 0 || Object.keys(_0x16ba1b).length > 0;
  (_0x1ad729 === 'image' || _0x1ad729 === 'reference' || _0x1ad729 === 'edit') &&
    !_0x2a1f4f &&
    (_0x1ad729 = 'auto');
  delete _0x1a233e.happyhorse_mode;
  if (_0x1ad729 === 'edit') {
    if (!_0x3a9b73[0]) throw new Error('HappyHorse 1.0 video edit requires video_url input');
    const _0x149a14 = _0x46c726(['editRefImage'], _0x4f10d7);
    _0x1a233e.video_url = _0x3a9b73[0];
    if (_0x149a14.length > 0) _0x1a233e.image_urls = _0x149a14.slice(0, 5);
    const _0x19be32 = String(payload?.generationParams?.audio_setting || payload?.audio_setting || '').trim();
    return (
      (_0x19be32 === 'auto' || _0x19be32 === 'origin') && (_0x1a233e.audio_setting = _0x19be32),
      delete _0x1a233e.first_frame_image,
      delete _0x1a233e.size,
      delete _0x1a233e.duration,
      _0x1a233e
    );
  }
  delete _0x1a233e.audio_setting;
  if (_0x1ad729 === 'image') {
    const _0x4ba7ea = _0x46c726(['firstFrame'], _0x4f10d7);
    if (!_0x4ba7ea[0]) throw new Error('HappyHorse 1.0 image-to-video requires first_frame_image input');
    return (
      (_0x1a233e.first_frame_image = _0x4ba7ea[0]),
      delete _0x1a233e.image_urls,
      delete _0x1a233e.video_url,
      delete _0x1a233e.size,
      _0x1a233e
    );
  }
  if (_0x1ad729 === 'reference') {
    const _0x143164 = _0x46c726(['referenceImage'], _0x4f10d7);
    if (_0x143164.length <= 0) throw new Error('HappyHorse 1.0 reference mode requires image_urls input');
    return (
      (_0x1a233e.image_urls = _0x143164.slice(0, 9)),
      delete _0x1a233e.first_frame_image,
      delete _0x1a233e.video_url,
      _0x1a233e
    );
  }
  if (_0x1ad729 !== 'auto') throw new Error('Unsupported HappyHorse 1.0 mode: ' + _0x1ad729);
  if (_0x4f10d7.length > 0 || _0x3a9b73.length > 0)
    throw new Error('HappyHorse 1.0 media inputs require an explicit mode selection');
  return (
    delete _0x1a233e.first_frame_image,
    delete _0x1a233e.image_urls,
    delete _0x1a233e.video_url,
    _0x1a233e
  );
}
const RUNNINGHUB_HAPPYHORSE_ENDPOINTS = Object.freeze({
  text: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
  reference: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/reference-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/video-edit',
});
function normalizeHappyHorseGenerationMode(_0x3f432e) {
  const _0xcbe7e4 = String(_0x3f432e || '')
    .trim()
    .toLowerCase();
  return _0xcbe7e4 === 'image' || _0xcbe7e4 === 'reference' || _0xcbe7e4 === 'edit' ? _0xcbe7e4 : 'auto';
}
function getRunningHubHappyHorseMode(_0x2a59b7 = {}, _0x2a46fe = {}) {
  return normalizeHappyHorseGenerationMode(
    _0x2a46fe.happyhorse_mode || _0x2a59b7?.generationParams?.happyhorse_mode || _0x2a59b7?.happyhorse_mode,
  );
}
function normalizeRunningHubHappyHorseAudioSettingValue(_0x5eba66) {
  const _0x3d1269 = String(_0x5eba66 || '')
    .trim()
    .toLowerCase();
  return _0x3d1269 === 'origin' ? 'origin' : 'auto';
}
function runninghubHappyHorseVideo({
  currentBody: _0x3a1e96,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x373104 = { ..._0x3a1e96 },
    _0x29fbd6 = String(_0x373104.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!_0x29fbd6) throw new Error('RunningHub HappyHorse 1.0 prompt is required');
  const _0x327b45 = normalizeInputList(inputImages),
    _0x5130ec = normalizeInputList(inputVideos),
    _0x537f90 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    _0x650cea = (_0x21edf0 = [], _0x3dd507 = []) => {
      const _0x26d0b5 = [],
        _0x370f7d = (_0x502d60) => {
          const _0x571438 = String(_0x502d60 || '').trim();
          if (_0x571438 && !_0x26d0b5.includes(_0x571438)) _0x26d0b5.push(_0x571438);
        };
      return (
        _0x21edf0.forEach((_0x56f479) => _0x370f7d(_0x537f90[_0x56f479])),
        normalizeInputList(_0x3dd507).forEach(_0x370f7d),
        _0x26d0b5
      );
    };
  let _0x469459 = getRunningHubHappyHorseMode(payload, _0x373104);
  const _0xedcce = _0x327b45.length > 0 || _0x5130ec.length > 0 || Object.keys(_0x537f90).length > 0;
  _0x469459 !== 'auto' && !_0xedcce && (_0x469459 = 'auto');
  ((_0x373104.prompt = _0x29fbd6),
    delete _0x373104.happyhorse_mode,
    delete _0x373104.imageUrl,
    delete _0x373104.imageUrls,
    delete _0x373104.videoUrl);
  if (_0x469459 === 'edit') {
    if (!_0x5130ec[0]) throw new Error('RunningHub HappyHorse 1.0 video edit requires videoUrl input');
    const _0x427848 = _0x650cea(['editRefImage'], _0x327b45);
    _0x373104.videoUrl = _0x5130ec[0];
    if (_0x427848.length > 0) _0x373104.imageUrls = _0x427848.slice(0, 5);
    return (
      (_0x373104.audioSetting = normalizeRunningHubHappyHorseAudioSettingValue(
        _0x373104.audioSetting ??
          payload?.generationParams?.audioSetting ??
          payload?.generationParams?.audio_setting ??
          payload?.audioSetting ??
          payload?.audio_setting,
      )),
      delete _0x373104.aspectRatio,
      delete _0x373104.duration,
      delete _0x373104.imageUrl,
      _0x373104
    );
  }
  delete _0x373104.audioSetting;
  if (_0x469459 === 'image') {
    const _0x233780 = _0x650cea(['firstFrame'], _0x327b45);
    if (!_0x233780[0]) throw new Error('RunningHub HappyHorse 1.0 image-to-video requires imageUrl input');
    return (
      (_0x373104.imageUrl = _0x233780[0]),
      delete _0x373104.imageUrls,
      delete _0x373104.videoUrl,
      delete _0x373104.aspectRatio,
      _0x373104
    );
  }
  if (_0x469459 === 'reference') {
    const _0x12fe70 = _0x650cea(['referenceImage'], _0x327b45);
    if (_0x12fe70.length <= 0)
      throw new Error('RunningHub HappyHorse 1.0 reference mode requires imageUrls input');
    return (
      (_0x373104.imageUrls = _0x12fe70.slice(0, 9)),
      delete _0x373104.imageUrl,
      delete _0x373104.videoUrl,
      _0x373104
    );
  }
  if (_0x327b45.length > 0 || _0x5130ec.length > 0)
    throw new Error('RunningHub HappyHorse 1.0 media inputs require an explicit mode selection');
  return (delete _0x373104.imageUrl, delete _0x373104.imageUrls, delete _0x373104.videoUrl, _0x373104);
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
function runninghubHappyHorseVideoEndpoint(_0x291f4f = {}) {
  const { payload: payload = {}, currentBody: currentBody = {} } = _0x291f4f;
  let _0x4b62a1 = getRunningHubHappyHorseMode(payload, currentBody);
  return (
    _0x4b62a1 !== 'auto' && !hasRunningHubHappyHorseEndpointMedia(_0x291f4f) && (_0x4b62a1 = 'auto'),
    RUNNINGHUB_HAPPYHORSE_ENDPOINTS[_0x4b62a1] || RUNNINGHUB_HAPPYHORSE_ENDPOINTS.text
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
function normalizeRunningHubSeedance2Model(_0x407242) {
  const _0x151938 = String(_0x407242 || '')
    .trim()
    .toLowerCase();
  return _0x151938 === 'standard' || _0x151938 === 'std' ? 'standard' : 'fast';
}
function normalizeRunningHubSeedance2Mode(_0x145ec2) {
  const _0x5d86ad = String(_0x145ec2 || '')
    .trim()
    .toLowerCase();
  if (_0x5d86ad === 'multimodal2video' || _0x5d86ad === 'reference') return 'multimodal2video';
  if (_0x5d86ad === 'frames2video' || _0x5d86ad === 'frames') return 'frames2video';
  if (_0x5d86ad === 'image2video' || _0x5d86ad === 'image' || _0x5d86ad === 'frame') return 'image2video';
  return 'text2video';
}
function getRunningHubSeedance2Model(_0x24f71e = {}, _0x37eefa = {}) {
  return normalizeRunningHubSeedance2Model(
    _0x37eefa.rh_seedance_2_model ||
      _0x24f71e?.generationParams?.rh_seedance_2_model ||
      _0x24f71e?.rh_seedance_2_model,
  );
}
function getRunningHubSeedance2Mode(_0x23e593 = {}, _0x4af4f9 = {}) {
  return normalizeRunningHubSeedance2Mode(
    _0x4af4f9.rh_seedance_2_mode ||
      _0x23e593?.generationParams?.rh_seedance_2_mode ||
      _0x23e593?.rh_seedance_2_mode,
  );
}
function collectRunningHubSeedance2SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const _0x4c8298 = [],
    _0x470660 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    _0x2771b0 = new Set(normalizeInputList(Object.values(_0x470660)));
  return (
    slotIds.forEach((_0x3f15b5) => appendUniqueUrl(_0x4c8298, _0x470660[_0x3f15b5])),
    normalizeInputList(inputImages).forEach((_0x2989fe) => {
      if (!_0x2771b0.has(_0x2989fe)) appendUniqueUrl(_0x4c8298, _0x2989fe);
    }),
    _0x4c8298
  );
}
function collectRunningHubSeedance2FrameImages(_0x5e7551 = {}) {
  return collectRunningHubSeedance2SlotImages({ ..._0x5e7551, slotIds: ['firstFrame', 'lastFrame'] });
}
function collectRunningHubSeedance2ReferenceImages(_0x2e3c71 = {}) {
  return collectRunningHubSeedance2SlotImages({ ..._0x2e3c71, slotIds: ['referenceImage'] });
}
function resolveRunningHubSeedance2Route({ payload: payload = {}, currentBody: currentBody = {} } = {}) {
  const _0x35a7f7 = getRunningHubSeedance2Model(payload, currentBody),
    _0x173c35 = getRunningHubSeedance2Mode(payload, currentBody);
  if (_0x173c35 === 'multimodal2video') return Object.freeze({ model: _0x35a7f7, route: 'reference' });
  if (_0x173c35 === 'image2video' || _0x173c35 === 'frames2video')
    return Object.freeze({ model: _0x35a7f7, route: 'image' });
  return Object.freeze({ model: _0x35a7f7, route: 'text' });
}
function removeRunningHubSeedance2TransientFields(_0x54a3fc) {
  (delete _0x54a3fc.rh_seedance_2_model,
    delete _0x54a3fc.rh_seedance_2_mode,
    delete _0x54a3fc.firstFrameUrl,
    delete _0x54a3fc.lastFrameUrl,
    delete _0x54a3fc.imageUrls,
    delete _0x54a3fc.videoUrls,
    delete _0x54a3fc.audioUrls);
}
function normalizeRunningHubSeedance2ConversionSlots(_0x333c23) {
  const _0x5e721d = Array.isArray(_0x333c23) ? _0x333c23 : ['all'],
    _0x3de7a2 = _0x5e721d.map((_0x2d7237) => String(_0x2d7237 || '').trim()).filter(Boolean);
  return _0x3de7a2.length > 0 ? _0x3de7a2 : ['all'];
}
function runninghubSeedance2Video({
  currentBody: _0x439da8,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x1e3040 = { ..._0x439da8 },
    _0x2f8406 = String(_0x1e3040.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!_0x2f8406) throw new Error('RunningHub Seedance 2.0 prompt is required');
  const _0x58fa92 = getRunningHubSeedance2Mode(payload, _0x1e3040),
    _0x132e64 = collectRunningHubSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x37492d = collectRunningHubSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x1a26ef = normalizeInputList(inputVideos),
    _0x475a47 = normalizeInputList(inputAudios),
    _0x2b33f0 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video'),
    _0x10da3e = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  ((_0x1e3040.prompt = _0x2f8406), removeRunningHubSeedance2TransientFields(_0x1e3040));
  if (_0x58fa92 === 'multimodal2video') {
    if (_0x37492d.length + _0x1a26ef.length <= 0)
      throw new Error('RunningHub Seedance 2.0 multimodal mode requires image or video input');
    if (_0x37492d.length > 9)
      throw new Error('RunningHub Seedance 2.0 multimodal mode supports at most 9 image inputs');
    if (_0x2b33f0 > 3)
      throw new Error('RunningHub Seedance 2.0 multimodal mode supports at most 3 video inputs');
    if (_0x10da3e > 3)
      throw new Error('RunningHub Seedance 2.0 multimodal mode supports at most 3 audio inputs');
    if (_0x475a47.length > 0 && _0x37492d.length + _0x1a26ef.length <= 0)
      throw new Error('RunningHub Seedance 2.0 audio input requires image or video input');
    if (_0x37492d.length > 0) _0x1e3040.imageUrls = _0x37492d.slice(0, 9);
    if (_0x1a26ef.length > 0) _0x1e3040.videoUrls = _0x1a26ef.slice(0, 3);
    if (_0x475a47.length > 0) _0x1e3040.audioUrls = _0x475a47.slice(0, 3);
    return (
      _0x1e3040.realPersonMode === true
        ? (_0x1e3040.conversionSlots = normalizeRunningHubSeedance2ConversionSlots(_0x1e3040.conversionSlots))
        : delete _0x1e3040.conversionSlots,
      delete _0x1e3040.webSearch,
      _0x1e3040
    );
  }
  if (_0x2b33f0 > 0)
    throw new Error(
      'RunningHub Seedance 2.0 text/image/frame modes do not accept video input; use multimodal mode',
    );
  if (_0x10da3e > 0)
    throw new Error(
      'RunningHub Seedance 2.0 text/image/frame modes do not accept audio input; use multimodal mode',
    );
  if (_0x58fa92 === 'text2video') {
    if (_0x132e64.length > 0)
      throw new Error('RunningHub Seedance 2.0 text-to-video mode does not accept image input');
    return (delete _0x1e3040.realPersonMode, delete _0x1e3040.conversionSlots, _0x1e3040);
  }
  if (_0x58fa92 === 'image2video' && _0x132e64.length !== 1)
    throw new Error('RunningHub Seedance 2.0 image-to-video mode requires exactly 1 image input');
  if (_0x58fa92 === 'frames2video' && _0x132e64.length !== 2)
    throw new Error('RunningHub Seedance 2.0 first-last-frame mode requires exactly 2 image inputs');
  _0x1e3040.firstFrameUrl = _0x132e64[0];
  if (_0x132e64[1]) _0x1e3040.lastFrameUrl = _0x132e64[1];
  return (
    delete _0x1e3040.webSearch,
    _0x1e3040.realPersonMode === true
      ? (_0x1e3040.conversionSlots = normalizeRunningHubSeedance2ConversionSlots(_0x1e3040.conversionSlots))
      : delete _0x1e3040.conversionSlots,
    _0x1e3040
  );
}
function runninghubSeedance2VideoEndpoint({ payload: payload = {} }) {
  const { model: _0x2d35d6, route: _0x4fd0f0 } = resolveRunningHubSeedance2Route({ payload: payload });
  return RUNNINGHUB_SEEDANCE_2_ENDPOINTS[_0x2d35d6]?.[_0x4fd0f0] || RUNNINGHUB_SEEDANCE_2_ENDPOINTS.fast.text;
}
function normalizeVolcengineSeedance2Mode(_0x5b97fa) {
  return normalizeRunningHubSeedance2Mode(_0x5b97fa);
}
function getVolcengineSeedance2Mode(_0x434638 = {}, _0x3de97b = {}) {
  return normalizeVolcengineSeedance2Mode(
    _0x434638?.dreaminaRouteMode ||
      _0x434638?.dreaminaTaskType ||
      _0x434638?.generationParams?.dreaminaRouteMode ||
      _0x3de97b.volcengine_seedance_2_mode ||
      _0x434638?.generationParams?.volcengine_seedance_2_mode ||
      _0x434638?.volcengine_seedance_2_mode,
  );
}
function resolveVolcengineSeedance2TaskType({
  routeMode: routeMode = '',
  frameImageCount: frameImageCount = 0,
  referenceImageCount: referenceImageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const _0x205c66 = normalizeVolcengineSeedance2Mode(routeMode),
    _0x1fdb8f = normalizePositiveInteger(frameImageCount, 0),
    _0x455bda = normalizePositiveInteger(referenceImageCount, 0),
    _0x28457e = normalizePositiveInteger(videoCount, 0),
    _0xb87384 = normalizePositiveInteger(audioCount, 0);
  if (_0x205c66 === 'frames2video') {
    if (_0x1fdb8f >= 2) return 'frames2video';
    if (_0x1fdb8f === 1) return 'image2video';
    return 'text2video';
  }
  if (_0x205c66 === 'image2video') return 'image2video';
  if (_0x205c66 === 'text2video') return 'text2video';
  if (_0x455bda > 0 || _0x28457e > 0 || _0xb87384 > 0) return 'multimodal2video';
  return 'text2video';
}
function normalizeVolcengineSeedance2Resolution(_0x29ad7a, _0x1bd0b7 = {}, _0x320180 = '') {
  const _0x74d400 = String(_0x29ad7a || _0x1bd0b7.defaultResolution || '720p')
      .trim()
      .toLowerCase(),
    _0x4ef509 = /fast/i.test(String(_0x320180 || ''));
  if (_0x74d400 === '1080p' && !_0x4ef509) return '1080p';
  if (_0x74d400 === '480p') return '480p';
  return '720p';
}
function normalizeVolcengineSeedance2Ratio(_0x218a91, _0x5d55cb = {}) {
  const _0x175a34 = String(_0x218a91 || '').trim();
  if (!_0x175a34 || _0x175a34 === 'auto' || _0x175a34 === 'default' || _0x175a34 === '自适应')
    return _0x5d55cb.defaultRatio || 'adaptive';
  const _0x22870c = normalizeRatioLabelText(_0x175a34);
  return ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'].includes(_0x22870c)
    ? _0x22870c
    : _0x5d55cb.defaultRatio || 'adaptive';
}
function normalizeVolcengineSeedance2Duration(_0x3006c2, _0xfeda37 = {}) {
  const _0x4bd422 = Number(_0x3006c2);
  if (_0x4bd422 === -1) return -1;
  const _0x3a72f6 = normalizePositiveInteger(_0xfeda37.minDuration, 4),
    _0x12573b = normalizePositiveInteger(_0xfeda37.maxDuration, 15);
  if (!Number.isFinite(_0x4bd422)) return 5;
  return Math.max(_0x3a72f6, Math.min(_0x12573b, Math.trunc(_0x4bd422)));
}
function normalizeVolcengineSeedance2Seed(_0x5d70f5) {
  if (!isPresentValue(_0x5d70f5)) return null;
  const _0x41a7d6 = Number.parseInt(String(_0x5d70f5).trim(), 10);
  return Number.isFinite(_0x41a7d6) ? _0x41a7d6 : null;
}
function getVolcengineSeedance2Policy(_0x2c8f2f) {
  const _0x57a457 = _0x2c8f2f?.extensions?.seedanceVideo;
  return _0x57a457 && typeof _0x57a457 === 'object' && !Array.isArray(_0x57a457) ? _0x57a457 : {};
}
function getVolcengineSlotMedia(_0x3ed1d0 = {}, _0x15de8d) {
  return String(normalizeRunningHubInputUrlsBySlot(_0x3ed1d0)[_0x15de8d] || '').trim();
}
function collectVolcengineSeedance2FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x351248 = [];
  return (
    appendUniqueUrl(_0x351248, getVolcengineSlotMedia(finalUrlsBySlot, 'firstFrame')),
    appendUniqueUrl(_0x351248, getVolcengineSlotMedia(finalUrlsBySlot, 'lastFrame')),
    normalizeInputList(inputImages).forEach((_0x3d22ea) => appendUniqueUrl(_0x351248, _0x3d22ea)),
    _0x351248
  );
}
function collectVolcengineSeedance2ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x1fa3ad = [];
  appendUniqueUrl(_0x1fa3ad, getVolcengineSlotMedia(finalUrlsBySlot, 'referenceImage'));
  const _0xf5d651 = new Set(
    normalizeInputList(Object.values(normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot))),
  );
  return (
    normalizeInputList(inputImages).forEach((_0x3e1368) => {
      if (!_0xf5d651.has(_0x3e1368)) appendUniqueUrl(_0x1fa3ad, _0x3e1368);
    }),
    _0x1fa3ad
  );
}
function pushVolcengineContentItem(_0x29ead9, _0x109ddd, _0x590630, _0x61e4ac) {
  const _0x3fa05e = String(_0x590630 || '').trim();
  if (!_0x3fa05e) return;
  const _0x5c8aaa = { type: _0x109ddd };
  if (_0x109ddd === 'image_url') _0x5c8aaa.image_url = { url: _0x3fa05e };
  else {
    if (_0x109ddd === 'video_url') _0x5c8aaa.video_url = { url: _0x3fa05e };
    else {
      if (_0x109ddd === 'audio_url') _0x5c8aaa.audio_url = { url: _0x3fa05e };
    }
  }
  if (_0x61e4ac) _0x5c8aaa.role = _0x61e4ac;
  _0x29ead9.push(_0x5c8aaa);
}
function volcengineSeedance2Video({
  currentBody: _0x15f13f,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: _0x29f736,
}) {
  const _0x239b57 = { ..._0x15f13f },
    _0x3806d9 = getVolcengineSeedance2Policy(_0x29f736),
    _0xd6ce52 = String(_0x239b57.prompt || finalPrompt || payload?.prompt || '').trim(),
    _0x1c925a = getVolcengineSeedance2Mode(payload, _0x239b57),
    _0x19950c = collectVolcengineSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x1b5f61 = collectVolcengineSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x39f2cc = normalizeInputList(inputVideos),
    _0x32a437 = normalizeInputList(inputAudios),
    _0x461e64 = resolveVolcengineSeedance2TaskType({
      routeMode: _0x1c925a,
      frameImageCount: _0x19950c.length,
      referenceImageCount: _0x1b5f61.length,
      videoCount: _0x39f2cc.length,
      audioCount: _0x32a437.length,
    }),
    _0x50c2f7 = [];
  if (_0xd6ce52) _0x50c2f7.push({ type: 'text', text: _0xd6ce52 });
  if (_0x461e64 === 'text2video') {
    if (!_0xd6ce52) throw new Error('Volcengine Seedance 2.0 prompt is required');
    if (_0x19950c.length > 0 || _0x39f2cc.length > 0 || _0x32a437.length > 0)
      throw new Error('Volcengine Seedance 2.0 text mode does not accept media input');
  } else {
    if (_0x461e64 === 'image2video') {
      if (_0x39f2cc.length > 0 || _0x32a437.length > 0)
        throw new Error('Volcengine Seedance 2.0 image mode does not accept video or audio input');
      if (_0x19950c.length < 1) throw new Error('Volcengine Seedance 2.0 image mode requires 1 image input');
      pushVolcengineContentItem(_0x50c2f7, 'image_url', _0x19950c[0], 'first_frame');
    } else {
      if (_0x461e64 === 'frames2video') {
        if (_0x39f2cc.length > 0 || _0x32a437.length > 0)
          throw new Error('Volcengine Seedance 2.0 first-last-frame mode only accepts images');
        if (_0x19950c.length < 2)
          throw new Error('Volcengine Seedance 2.0 first-last-frame mode requires 2 image inputs');
        (pushVolcengineContentItem(_0x50c2f7, 'image_url', _0x19950c[0], 'first_frame'),
          pushVolcengineContentItem(_0x50c2f7, 'image_url', _0x19950c[1], 'last_frame'));
      } else {
        const _0x9127ad = normalizePositiveInteger(_0x3806d9.maxImageCount, 9),
          _0x4683f7 = normalizePositiveInteger(_0x3806d9.maxVideoReferenceCount, 3),
          _0x194f7b = normalizePositiveInteger(_0x3806d9.maxAudioReferenceCount, 3);
        if (_0x1b5f61.length + _0x39f2cc.length <= 0)
          throw new Error('Volcengine Seedance 2.0 multimodal mode requires image or video input');
        if (_0x1b5f61.length > _0x9127ad)
          throw new Error('Volcengine Seedance 2.0 multimodal mode supports at most 9 image inputs');
        if (_0x39f2cc.length > _0x4683f7)
          throw new Error('Volcengine Seedance 2.0 multimodal mode supports at most 3 video inputs');
        if (_0x32a437.length > _0x194f7b)
          throw new Error('Volcengine Seedance 2.0 multimodal mode supports at most 3 audio inputs');
        (_0x1b5f61
          .slice(0, _0x9127ad)
          .forEach((_0x10c78a) =>
            pushVolcengineContentItem(_0x50c2f7, 'image_url', _0x10c78a, 'reference_image'),
          ),
          _0x39f2cc
            .slice(0, _0x4683f7)
            .forEach((_0x23e1f2) =>
              pushVolcengineContentItem(_0x50c2f7, 'video_url', _0x23e1f2, 'reference_video'),
            ),
          _0x32a437
            .slice(0, _0x194f7b)
            .forEach((_0x32680e) =>
              pushVolcengineContentItem(_0x50c2f7, 'audio_url', _0x32680e, 'reference_audio'),
            ));
      }
    }
  }
  if (_0x50c2f7.length === 0) throw new Error('Volcengine Seedance 2.0 request content is empty');
  const _0x33aa8e = normalizeVolcengineSeedance2Seed(_0x239b57.seed),
    _0x55134e = {
      model: modelToken || _0x239b57.model || stripPrefix(payload.model, 'volcengine/'),
      content: _0x50c2f7,
      resolution: normalizeVolcengineSeedance2Resolution(_0x239b57.resolution, _0x3806d9, modelToken),
      ratio: normalizeVolcengineSeedance2Ratio(_0x239b57.ratio, _0x3806d9),
      duration: normalizeVolcengineSeedance2Duration(_0x239b57.duration, _0x3806d9),
      generate_audio: _0x239b57.generate_audio !== false,
    };
  if (_0x33aa8e !== null) _0x55134e.seed = _0x33aa8e;
  return _0x55134e;
}
function apimartHailuo02Video({
  currentBody: _0x16e3b7,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x56fe70 = { ..._0x16e3b7 },
    _0x4247fa = normalizeInputList(inputImages),
    _0xc63a60 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    _0xe0b8e8 = Object.keys(_0xc63a60).length > 0;
  if (_0xe0b8e8) {
    (delete _0x56fe70.first_frame_image, delete _0x56fe70.last_frame_image);
    if (_0xc63a60.firstFrame) _0x56fe70.first_frame_image = _0xc63a60.firstFrame;
    if (_0xc63a60.lastFrame) _0x56fe70.last_frame_image = _0xc63a60.lastFrame;
    return _0x56fe70;
  }
  if (_0x4247fa[0]) _0x56fe70.first_frame_image = _0x4247fa[0];
  if (_0x4247fa[1]) _0x56fe70.last_frame_image = _0x4247fa[1];
  return _0x56fe70;
}
function apimartHailuo23Video({
  currentBody: _0x323cb0,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
}) {
  const _0x5d1a9d = { ..._0x323cb0 };
  delete _0x5d1a9d.last_frame_image;
  const _0x25bad1 = normalizeInputList(inputImages),
    _0x3f9979 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    _0x549dc4 = Object.keys(_0x3f9979).length > 0;
  if (_0x549dc4) {
    delete _0x5d1a9d.first_frame_image;
    if (_0x3f9979.firstFrame) _0x5d1a9d.first_frame_image = _0x3f9979.firstFrame;
  } else _0x25bad1[0] && (_0x5d1a9d.first_frame_image = _0x25bad1[0]);
  const _0x496754 = String(modelToken || _0x5d1a9d.model || '')
    .trim()
    .toLowerCase();
  if (_0x496754 === 'minimax-hailuo-2.3-fast' && !String(_0x5d1a9d.first_frame_image || '').trim())
    throw new Error('APIMart Hailuo 2.3 Fast requires first_frame_image input');
  return _0x5d1a9d;
}
function apimartViduQ3Video({
  currentBody: _0x1b81ae,
  inputImages: inputImages = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  modelToken: modelToken = '',
}) {
  const _0x3b3d69 = { ..._0x1b81ae },
    _0x49950c = String(_0x3b3d69.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!_0x49950c) throw new Error('APIMart Vidu Q3 prompt is required');
  _0x3b3d69.prompt = _0x49950c;
  const _0x54093a = String(
      payload?.generationParams?.vidu_q3_generation_mode || payload?.vidu_q3_generation_mode || 'video',
    )
      .trim()
      .toLowerCase(),
    _0xad7224 = String(modelToken || _0x3b3d69.model || 'viduq3-turbo')
      .trim()
      .toLowerCase(),
    _0x6cec06 = normalizeInputList(inputImages),
    _0x3f4cce = normalizeRunningHubInputUrlsBySlot(payload?.inputUrlsBySlot),
    _0x35b2d9 = Math.max(
      _0x6cec06.length,
      normalizeInputList(payload?.inputUrls).length,
      normalizeInputList(payload?.images).length,
      Object.keys(_0x3f4cce).length,
    );
  if (_0x54093a === 'reference') {
    if (!VIDU_Q3_REFERENCE_MODELS.has(_0xad7224))
      throw new Error('APIMart Vidu Q3 reference mode only supports viduq3 or viduq3-mix');
    if (_0x6cec06.length < 1 || _0x35b2d9 > 7)
      throw new Error('APIMart Vidu Q3 reference mode requires 1-7 image inputs');
    return (
      (_0x3b3d69.model = _0xad7224),
      (_0x3b3d69.image_urls = _0x6cec06.slice(0, 7)),
      delete _0x3b3d69.audio,
      _0x3b3d69
    );
  }
  if (!VIDU_Q3_VIDEO_MODELS.has(_0xad7224))
    throw new Error('APIMart Vidu Q3 video generation mode only supports viduq3-turbo or viduq3-pro');
  if (_0x35b2d9 > 2) throw new Error('APIMart Vidu Q3 video generation mode supports at most 2 image inputs');
  return (
    (_0x3b3d69.model = _0xad7224),
    _0x6cec06.length > 0
      ? ((_0x3b3d69.image_urls = _0x6cec06.slice(0, 2)), delete _0x3b3d69.aspect_ratio)
      : delete _0x3b3d69.image_urls,
    _0x3b3d69
  );
}
function normalizeKlingV3OmniMode(_0x435db9) {
  const _0x2583fd = String(_0x435db9 || '')
    .trim()
    .toLowerCase();
  return _0x2583fd === 'reference' || _0x2583fd === 'edit' ? _0x2583fd : 'image';
}
function appendUniqueUrl(_0x2e04c0, _0x420657) {
  const _0x31583a = String(_0x420657 || '').trim();
  if (_0x31583a && !_0x2e04c0.includes(_0x31583a)) _0x2e04c0.push(_0x31583a);
}
function normalizeKlingKeepOriginalSound(_0x366c43) {
  if (_0x366c43 === true || _0x366c43 === false) return _0x366c43;
  const _0x31aa5e = String(_0x366c43 ?? '')
    .trim()
    .toLowerCase();
  return _0x31aa5e === 'true' || _0x31aa5e === '1' || _0x31aa5e === 'yes';
}
function buildKlingV3OmniVideoItem(_0x1c6854, _0x6e6d55, _0x13a61f = false) {
  return {
    video_url: _0x1c6854,
    refer_type: _0x6e6d55,
    keep_original_sound: normalizeKlingKeepOriginalSound(_0x13a61f) ? 'yes' : 'no',
  };
}
function normalizeKlingO1VideoRole(_0x123e80) {
  const _0x515fa6 = String(_0x123e80 || '')
    .trim()
    .toLowerCase();
  if (_0x515fa6 === 'feature' || _0x515fa6 === 'feature_reference') return 'feature';
  return _0x515fa6 === 'base' || _0x515fa6 === 'edit' ? 'base' : '';
}
function replaceKlingO1PromptImageReferences(_0x20408e, _0x18b209) {
  const _0x4e7f74 = Math.max(0, Math.trunc(Number(_0x18b209) || 0));
  if (_0x4e7f74 <= 0) return String(_0x20408e || '');
  return String(_0x20408e || '').replace(/@?图片\s*([1-9]\d*)/g, (_0x4bd60d, _0x5615a4) => {
    const _0x408d57 = Number.parseInt(String(_0x5615a4 || ''), 10);
    if (!Number.isFinite(_0x408d57) || _0x408d57 < 1 || _0x408d57 > _0x4e7f74) return _0x4bd60d;
    return '<<<image_' + _0x408d57 + '>>>';
  });
}
function apimartKlingO1Video({
  currentBody: _0x336a2e,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
}) {
  const _0xa19bb = { ..._0x336a2e },
    _0x362bc9 = normalizeInputList(inputImages).slice(0, 2),
    _0x57beb6 = normalizeInputList(inputVideos).slice(0, 1),
    _0x5dcbaa = normalizeKlingO1VideoRole(
      payload?.klingO1VideoRole ||
        payload?.kling_o1_video_role ||
        payload?.generationParams?.kling_o1_video_role,
    ),
    _0x19e6ae = normalizeKlingKeepOriginalSound(
      _0xa19bb.keep_original_sound ??
        payload?.generationParams?.keep_original_sound ??
        payload?.keep_original_sound,
    );
  (delete _0xa19bb.kling_o1_video_role,
    delete _0xa19bb.klingO1VideoRole,
    delete _0xa19bb.keep_original_sound,
    delete _0xa19bb.video_list);
  if (_0x57beb6.length > 0) {
    const _0x2541b2 = _0x5dcbaa || 'base';
    _0xa19bb.video_list = [buildKlingV3OmniVideoItem(_0x57beb6[0], _0x2541b2, _0x19e6ae)];
    if (_0x2541b2 === 'base') {
      if (_0x362bc9.length > 0) throw new Error('APIMart Kling O1 base video cannot be used with image_urls');
      return (
        delete _0xa19bb.image_urls,
        delete _0xa19bb.duration,
        delete _0xa19bb.aspect_ratio,
        (_0xa19bb.prompt = replaceKlingO1PromptImageReferences(_0xa19bb.prompt, 0)),
        _0xa19bb
      );
    }
    if (_0x362bc9.length > 1)
      throw new Error('APIMart Kling O1 feature video supports at most one image_url');
    return (
      _0x362bc9.length > 0 ? (_0xa19bb.image_urls = _0x362bc9.slice(0, 1)) : delete _0xa19bb.image_urls,
      (_0xa19bb.prompt = replaceKlingO1PromptImageReferences(
        _0xa19bb.prompt,
        _0xa19bb.image_urls?.length || 0,
      )),
      _0xa19bb
    );
  }
  return (
    _0x362bc9.length > 0 ? (_0xa19bb.image_urls = _0x362bc9) : delete _0xa19bb.image_urls,
    (_0xa19bb.prompt = replaceKlingO1PromptImageReferences(
      _0xa19bb.prompt,
      _0xa19bb.image_urls?.length || 0,
    )),
    _0xa19bb
  );
}
const RUNNINGHUB_KLING_O1_ENDPOINTS = Object.freeze({
  text: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video',
  frames: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/start-to-end',
  reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/edit-video',
});
function normalizeRunningHubKlingO1GenerationMode(_0xad548c) {
  const _0x516ced = String(_0xad548c || '')
    .trim()
    .toLowerCase();
  if (_0x516ced === 'reference' || _0x516ced === 'edit') return _0x516ced;
  return 'frame';
}
function normalizeRunningHubKlingO1QualityMode(_0x56bc70) {
  const _0x2ce33b = String(_0x56bc70 || '')
    .trim()
    .toLowerCase();
  return _0x2ce33b === 'pro' ? 'pro' : 'std';
}
function normalizeRunningHubKlingO1AspectRatio(_0x3e5845) {
  const _0x67ca53 = String(_0x3e5845 || '9:16').trim();
  return ['16:9', '9:16', '1:1'].includes(_0x67ca53) ? _0x67ca53 : '9:16';
}
function normalizeRunningHubKlingO1Duration(_0x10efee) {
  const _0x575a59 = Number(_0x10efee);
  return Number.isFinite(_0x575a59) && Math.trunc(_0x575a59) === 10 ? '10' : '5';
}
function getRunningHubKlingO1GenerationMode(_0x549960 = {}, _0x5df2c1 = {}) {
  return normalizeRunningHubKlingO1GenerationMode(
    _0x5df2c1.rh_kling_o1_generation_mode ||
      _0x549960?.generationParams?.rh_kling_o1_generation_mode ||
      _0x549960?.rh_kling_o1_generation_mode,
  );
}
function collectRunningHubKlingO1FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0xa7a02c = [],
    _0xfc300b = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0xa7a02c, _0xfc300b.firstFrame),
    appendUniqueUrl(_0xa7a02c, _0xfc300b.lastFrame),
    normalizeInputList(inputImages).forEach((_0x10297a) => appendUniqueUrl(_0xa7a02c, _0x10297a)),
    _0xa7a02c
  );
}
function collectRunningHubKlingO1ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x474714 = [],
    _0x35947a = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x474714, _0x35947a.referenceImage),
    normalizeInputList(inputImages).forEach((_0x4e8e9f) => appendUniqueUrl(_0x474714, _0x4e8e9f)),
    _0x474714
  );
}
function resolveRunningHubKlingO1Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x2c7c0c = getRunningHubKlingO1GenerationMode(payload, currentBody);
  if (_0x2c7c0c === 'reference') return 'reference';
  if (_0x2c7c0c === 'edit') return 'edit';
  const _0x5ff662 = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  }).length;
  if (_0x5ff662 >= 2) return 'frames';
  if (_0x5ff662 === 1) return 'image';
  const _0x46b355 = normalizeInputList(inputVideos).length;
  return _0x46b355 > 0 ? 'reference' : 'text';
}
function runninghubKlingO1Video({
  currentBody: _0x2b5ca4,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x54fb02 = { ..._0x2b5ca4 },
    _0x5c0978 = getRunningHubKlingO1GenerationMode(payload, _0x54fb02),
    _0x1332d8 = normalizeKlingKeepOriginalSound(
      payload?.generationParams?.keepOriginalSound ??
        payload?.generationParams?.keep_original_sound ??
        payload?.keepOriginalSound ??
        payload?.keep_original_sound ??
        _0x54fb02.keepOriginalSound ??
        _0x54fb02.keep_original_sound,
    ),
    _0x3e0988 = String(_0x54fb02.prompt || payload?.prompt || '').trim();
  if (!_0x3e0988) throw new Error('RunningHub Kling O1 prompt is required');
  ((_0x54fb02.prompt = _0x3e0988),
    (_0x54fb02.mode = normalizeRunningHubKlingO1QualityMode(_0x54fb02.mode)),
    (_0x54fb02.aspectRatio = normalizeRunningHubKlingO1AspectRatio(_0x54fb02.aspectRatio)),
    (_0x54fb02.duration = normalizeRunningHubKlingO1Duration(_0x54fb02.duration)),
    delete _0x54fb02.rh_kling_o1_generation_mode,
    delete _0x54fb02.keep_original_sound,
    delete _0x54fb02.keepOriginalSound,
    delete _0x54fb02.firstImageUrl,
    delete _0x54fb02.lastImageUrl,
    delete _0x54fb02.imageUrls,
    delete _0x54fb02.videoUrl);
  const _0x525095 = normalizeInputList(inputVideos),
    _0x16a205 = Math.max(
      _0x525095.length,
      normalizeInputList(payload?.videos).length,
      normalizeInputList(payload?.videoUrls).length,
      String(payload?.videoUrl || '').trim() ? 1 : 0,
    );
  if (_0x5c0978 === 'edit') {
    const _0x1b4fb5 = [];
    (collectRunningHubKlingO1FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).forEach((_0x5dd681) => appendUniqueUrl(_0x1b4fb5, _0x5dd681)),
      collectRunningHubKlingO1ReferenceImages({
        inputImages: inputImages,
        finalUrlsBySlot: finalUrlsBySlot,
      }).forEach((_0x345880) => appendUniqueUrl(_0x1b4fb5, _0x345880)));
    if (_0x1b4fb5.length > 0) throw new Error('RunningHub Kling O1 edit mode does not accept image input');
    if (_0x16a205 < 1 || !_0x525095[0])
      throw new Error('RunningHub Kling O1 edit mode requires 1 video input');
    if (_0x16a205 > 1) throw new Error('RunningHub Kling O1 edit mode supports at most 1 video input');
    return (
      (_0x54fb02.mode = 'std'),
      (_0x54fb02.videoUrl = _0x525095[0]),
      (_0x54fb02.keepOriginalSound = _0x1332d8),
      delete _0x54fb02.aspectRatio,
      delete _0x54fb02.duration,
      _0x54fb02
    );
  }
  if (_0x5c0978 === 'reference') {
    const _0xf16222 = collectRunningHubKlingO1ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (_0xf16222.length < 1)
      throw new Error('RunningHub Kling O1 reference mode requires at least 1 image input');
    if (_0xf16222.length > 7)
      throw new Error('RunningHub Kling O1 reference mode supports at most 7 image inputs');
    if (_0x16a205 < 1 || !_0x525095[0])
      throw new Error('RunningHub Kling O1 reference mode requires 1 video input');
    if (_0x16a205 > 1) throw new Error('RunningHub Kling O1 reference mode supports at most 1 video input');
    return (
      (_0x54fb02.imageUrls = _0xf16222),
      (_0x54fb02.videoUrl = _0x525095[0]),
      (_0x54fb02.keepOriginalSound = _0x1332d8),
      (_0x54fb02.prompt = replaceKlingO1PromptImageReferences(_0x54fb02.prompt, _0xf16222.length)),
      _0x54fb02
    );
  }
  const _0x47f009 = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x525095.length > 0)
    throw new Error('RunningHub Kling O1 frame mode does not accept video input; use reference mode');
  if (_0x47f009.length > 2) throw new Error('RunningHub Kling O1 frame mode supports at most 2 image inputs');
  if (_0x47f009[0]) _0x54fb02.firstImageUrl = _0x47f009[0];
  if (_0x47f009[1]) _0x54fb02.lastImageUrl = _0x47f009[1];
  return (
    (_0x54fb02.prompt = replaceKlingO1PromptImageReferences(_0x54fb02.prompt, _0x47f009.length)),
    _0x54fb02
  );
}
function runninghubKlingO1VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x47c7d5 = resolveRunningHubKlingO1Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_O1_ENDPOINTS[_0x47c7d5] || RUNNINGHUB_KLING_O1_ENDPOINTS.text;
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
function normalizeRunningHubKlingV3Model(_0x866a9b) {
  const _0x4d4711 = String(_0x866a9b || '')
    .trim()
    .toLowerCase();
  if (_0x4d4711 === '4k') return '4k';
  if (_0x4d4711 === 'pro') return 'pro';
  return 'std';
}
function getRunningHubKlingV3Model(_0x1b891a = {}, _0x51f014 = {}) {
  return normalizeRunningHubKlingV3Model(
    _0x51f014.rh_kling_v3_model || _0x1b891a?.generationParams?.resolution || _0x1b891a?.resolution,
  );
}
function collectRunningHubKlingV3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x444591 = [],
    _0x5dc6ec = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x444591, _0x5dc6ec.firstFrame),
    appendUniqueUrl(_0x444591, _0x5dc6ec.lastFrame),
    normalizeInputList(inputImages).forEach((_0x6b64e1) => appendUniqueUrl(_0x444591, _0x6b64e1)),
    _0x444591
  );
}
function getRunningHubKlingV3RawMediaCount(_0x5193ff = {}, _0x13f96e = [], _0x2acaf8 = '') {
  const _0x37b5e6 = _0x2acaf8 === 'audio' ? 'audioUrl' : _0x2acaf8 + 'Url',
    _0x8efb3d = _0x2acaf8 + 's',
    _0x1721db = _0x2acaf8 + 'Urls';
  return Math.max(
    normalizeInputList(_0x13f96e).length,
    normalizeInputList(_0x5193ff?.[_0x8efb3d]).length,
    normalizeInputList(_0x5193ff?.[_0x1721db]).length,
    String(_0x5193ff?.[_0x37b5e6] || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubKlingV3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x122500 = getRunningHubKlingV3Model(payload, currentBody),
    _0x195614 = collectRunningHubKlingV3FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).length;
  return { model: _0x122500, route: _0x195614 > 0 ? 'image' : 'text' };
}
function runninghubKlingV3Video({
  currentBody: _0x335e1e,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x45447b = { ..._0x335e1e },
    _0x4e65ea = getRunningHubKlingV3Model(payload, _0x45447b),
    _0x46c22f = String(_0x45447b.prompt || payload?.prompt || '').trim();
  if (!_0x46c22f) throw new Error('RunningHub Kling V3.0 prompt is required');
  const _0x2b1281 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video');
  if (_0x2b1281 > 0) throw new Error('RunningHub Kling V3.0 does not accept video input');
  const _0x36e127 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  if (_0x36e127 > 0) throw new Error('RunningHub Kling V3.0 does not accept audio input');
  ((_0x45447b.prompt = _0x46c22f),
    delete _0x45447b.rh_kling_v3_model,
    delete _0x45447b.imageUrl,
    delete _0x45447b.firstImageUrl,
    delete _0x45447b.lastImageUrl,
    delete _0x45447b.imageUrls);
  const _0x1125d4 = collectRunningHubKlingV3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x1125d4.length > 2) throw new Error('RunningHub Kling V3.0 supports at most 2 image inputs');
  if (_0x1125d4.length > 0) {
    delete _0x45447b.aspectRatio;
    if (_0x4e65ea === '4k') {
      if (_0x1125d4.length > 1)
        throw new Error('RunningHub Kling V3.0 4K image-to-video supports only one imageUrl');
      return ((_0x45447b.imageUrl = _0x1125d4[0]), _0x45447b);
    }
    _0x45447b.firstImageUrl = _0x1125d4[0];
    if (_0x1125d4[1]) _0x45447b.lastImageUrl = _0x1125d4[1];
  }
  return _0x45447b;
}
function runninghubKlingV3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { model: _0xe11ad, route: _0x4166de } = resolveRunningHubKlingV3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_V3_ENDPOINTS[_0xe11ad]?.[_0x4166de] || RUNNINGHUB_KLING_V3_ENDPOINTS.std.text;
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
function normalizeRunningHubKlingO3GenerationMode(_0x5bd196) {
  const _0x46834d = String(_0x5bd196 || '')
    .trim()
    .toLowerCase();
  if (_0x46834d === 'reference' || _0x46834d === 'edit') return _0x46834d;
  return 'frame';
}
function normalizeRunningHubKlingO3Model(_0x1ed919) {
  const _0x2fde2f = String(_0x1ed919 || '')
    .trim()
    .toLowerCase();
  if (_0x2fde2f === '4k') return '4k';
  if (_0x2fde2f === 'pro') return 'pro';
  return 'std';
}
function getRunningHubKlingO3GenerationMode(_0x879d5c = {}, _0x55753c = {}) {
  return normalizeRunningHubKlingO3GenerationMode(
    _0x55753c.kling_v3_omni_mode ||
      _0x879d5c?.generationParams?.kling_v3_omni_mode ||
      _0x879d5c?.kling_v3_omni_mode,
  );
}
function getRunningHubKlingO3Model(_0x2f5fc2 = {}, _0x48ee4f = {}) {
  return normalizeRunningHubKlingO3Model(
    _0x48ee4f.rh_kling_o3_model || _0x2f5fc2?.generationParams?.resolution || _0x2f5fc2?.resolution,
  );
}
function collectRunningHubKlingO3SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const _0x5b44af = [],
    _0x12c8ed = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    _0x1f9e5d = new Set(normalizeInputList(Object.values(_0x12c8ed)));
  return (
    slotIds.forEach((_0x22835d) => appendUniqueUrl(_0x5b44af, _0x12c8ed[_0x22835d])),
    normalizeInputList(inputImages).forEach((_0x1ad0db) => {
      if (!_0x1f9e5d.has(_0x1ad0db)) appendUniqueUrl(_0x5b44af, _0x1ad0db);
    }),
    _0x5b44af
  );
}
function collectRunningHubKlingO3FrameImages(_0x478acc = {}) {
  return collectRunningHubKlingO3SlotImages({ ..._0x478acc, slotIds: ['firstFrame', 'lastFrame'] });
}
function collectRunningHubKlingO3ReferenceImages(_0x57952a = {}) {
  return collectRunningHubKlingO3SlotImages({ ..._0x57952a, slotIds: ['referenceImage'] });
}
function collectRunningHubKlingO3EditImages(_0x3ec193 = {}) {
  return collectRunningHubKlingO3SlotImages({ ..._0x3ec193, slotIds: ['editRefImage'] });
}
function resolveRunningHubKlingO3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x5760e7 = getRunningHubKlingO3Model(payload, currentBody),
    _0x17ba32 = getRunningHubKlingO3GenerationMode(payload, currentBody);
  if (_0x17ba32 === 'reference') return { model: _0x5760e7, route: 'reference' };
  if (_0x17ba32 === 'edit') return { model: _0x5760e7, route: 'edit' };
  const _0x5b5f89 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  }).length;
  return { model: _0x5760e7, route: _0x5b5f89 > 0 ? 'image' : 'text' };
}
function runninghubKlingO3Video({
  currentBody: _0x3beab1,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x441e07 = { ..._0x3beab1 },
    _0x370156 = getRunningHubKlingO3Model(payload, _0x441e07),
    _0x24da35 = getRunningHubKlingO3GenerationMode(payload, _0x441e07),
    _0x4a4c70 = String(_0x441e07.prompt || payload?.prompt || '').trim();
  if (!_0x4a4c70) throw new Error('RunningHub Kling O3 prompt is required');
  const _0x351822 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  if (_0x351822 > 0) throw new Error('RunningHub Kling O3 does not accept direct audio input');
  const _0x3ec0e1 = normalizeInputList(inputVideos),
    _0x309637 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video'),
    _0x50f55a = normalizeKlingKeepOriginalSound(
      _0x441e07.keepOriginalSound ??
        _0x441e07.keep_original_sound ??
        payload?.generationParams?.keepOriginalSound ??
        payload?.generationParams?.keep_original_sound ??
        payload?.keepOriginalSound ??
        payload?.keep_original_sound,
    );
  ((_0x441e07.prompt = _0x4a4c70),
    delete _0x441e07.kling_v3_omni_mode,
    delete _0x441e07.rh_kling_o3_model,
    delete _0x441e07.keep_original_sound,
    delete _0x441e07.keepOriginalSound,
    delete _0x441e07.firstImageUrl,
    delete _0x441e07.lastImageUrl,
    delete _0x441e07.imageUrl,
    delete _0x441e07.imageUrls,
    delete _0x441e07.videoUrl);
  if (_0x24da35 === 'edit') {
    if (_0x370156 === '4k') throw new Error('RunningHub Kling O3 4K does not support video edit');
    if (_0x309637 < 1 || !_0x3ec0e1[0])
      throw new Error('RunningHub Kling O3 edit mode requires 1 video input');
    if (_0x309637 > 1) throw new Error('RunningHub Kling O3 edit mode supports at most 1 video input');
    const _0x18f945 = collectRunningHubKlingO3EditImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (_0x18f945.length > 7)
      throw new Error('RunningHub Kling O3 edit mode supports at most 7 image inputs');
    _0x441e07.videoUrl = _0x3ec0e1[0];
    if (_0x18f945.length > 0) _0x441e07.imageUrls = _0x18f945;
    return (
      (_0x441e07.keepOriginalSound = _0x50f55a),
      delete _0x441e07.aspectRatio,
      delete _0x441e07.duration,
      delete _0x441e07.sound,
      delete _0x441e07.multiShot,
      delete _0x441e07.shotType,
      _0x441e07
    );
  }
  if (_0x24da35 === 'reference') {
    const _0x24648c = collectRunningHubKlingO3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (_0x24648c.length < 1)
      throw new Error('RunningHub Kling O3 reference mode requires at least 1 image input');
    if (_0x309637 > 1) throw new Error('RunningHub Kling O3 reference mode supports at most 1 video input');
    if (_0x3ec0e1[0] && _0x24648c.length > 4)
      throw new Error('RunningHub Kling O3 reference mode supports at most 4 image inputs with video input');
    if (_0x24648c.length > 7)
      throw new Error('RunningHub Kling O3 reference mode supports at most 7 image inputs');
    _0x441e07.imageUrls = _0x24648c;
    if (_0x3ec0e1[0]) _0x441e07.videoUrl = _0x3ec0e1[0];
    _0x441e07.keepOriginalSound = _0x50f55a;
    if (_0x370156 !== '4k') delete _0x441e07.shotType;
    return _0x441e07;
  }
  if (_0x309637 > 0)
    throw new Error('RunningHub Kling O3 frame mode does not accept video input; use reference or edit mode');
  const _0x66f817 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x66f817.length > 2) throw new Error('RunningHub Kling O3 frame mode supports at most 2 image inputs');
  if (_0x370156 === '4k' && _0x66f817.length > 1)
    throw new Error('RunningHub Kling O3 4K image-to-video supports only one firstImageUrl');
  if (_0x66f817.length > 0) {
    (delete _0x441e07.aspectRatio, (_0x441e07.firstImageUrl = _0x66f817[0]));
    if (_0x66f817[1]) _0x441e07.lastImageUrl = _0x66f817[1];
  }
  return _0x441e07;
}
function runninghubKlingO3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { model: _0x391be9, route: _0x1f0b36 } = resolveRunningHubKlingO3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_O3_ENDPOINTS[_0x391be9]?.[_0x1f0b36] || RUNNINGHUB_KLING_O3_ENDPOINTS.std.text;
}
const RUNNINGHUB_HAILUO_02_ENDPOINTS = Object.freeze({
  t2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-standard',
  t2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-pro',
  i2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard',
  i2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-pro',
  i2vFast: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/fast',
});
function normalizeRunningHubHailuo02Quality(_0x4adae9) {
  const _0x224f7c = String(_0x4adae9 || '')
    .trim()
    .toLowerCase();
  if (_0x224f7c === 'pro') return 'pro';
  if (_0x224f7c === 'fast') return 'fast';
  return 'standard';
}
function normalizeRunningHubHailuo02Duration(_0x5dbec1) {
  const _0x4f50c7 = Number(_0x5dbec1);
  return Number.isFinite(_0x4f50c7) && Math.trunc(_0x4f50c7) === 10 ? '10' : '6';
}
function getRunningHubHailuo02Quality(_0x1b8e90 = {}, _0xd787e6 = {}) {
  return normalizeRunningHubHailuo02Quality(
    _0xd787e6.rh_hailuo_02_quality ||
      _0x1b8e90?.generationParams?.rh_hailuo_02_quality ||
      _0x1b8e90?.rh_hailuo_02_quality,
  );
}
function collectRunningHubHailuo02FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x44a61d = [],
    _0x1502b9 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x44a61d, _0x1502b9.firstFrame),
    appendUniqueUrl(_0x44a61d, _0x1502b9.lastFrame),
    normalizeInputList(inputImages).forEach((_0x3e72aa) => appendUniqueUrl(_0x44a61d, _0x3e72aa)),
    _0x44a61d
  );
}
function getRunningHubHailuo02RawVideoCount(_0x1babde = {}, _0x3eb47c = []) {
  return Math.max(
    normalizeInputList(_0x3eb47c).length,
    normalizeInputList(_0x1babde?.videos).length,
    normalizeInputList(_0x1babde?.videoUrls).length,
    String(_0x1babde?.videoUrl || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubHailuo02Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x108b58 = getRunningHubHailuo02Quality(payload, currentBody),
    _0x4117a7 = collectRunningHubHailuo02FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).length;
  if (_0x108b58 === 'fast') return 'i2vFast';
  if (_0x108b58 === 'pro') return _0x4117a7 > 0 ? 'i2vPro' : 't2vPro';
  return _0x4117a7 > 0 ? 'i2vStandard' : 't2vStandard';
}
function runninghubHailuo02Video({
  currentBody: _0x2744e1,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x4bef47 = { ..._0x2744e1 },
    _0xf549f0 = String(_0x4bef47.prompt || payload?.prompt || '').trim();
  if (!_0xf549f0) throw new Error('RunningHub Hailuo 02 prompt is required');
  const _0x3605d1 = getRunningHubHailuo02Quality(payload, _0x4bef47),
    _0xe4cb43 = collectRunningHubHailuo02FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x2e6fe8 = getRunningHubHailuo02RawVideoCount(payload, inputVideos);
  if (_0x2e6fe8 > 0) throw new Error('RunningHub Hailuo 02 does not accept video input');
  ((_0x4bef47.prompt = _0xf549f0),
    (_0x4bef47.duration = normalizeRunningHubHailuo02Duration(_0x4bef47.duration)),
    delete _0x4bef47.rh_hailuo_02_quality,
    delete _0x4bef47.firstImageUrl,
    delete _0x4bef47.lastImageUrl,
    delete _0x4bef47.imageUrl,
    delete _0x4bef47.imageUrls,
    delete _0x4bef47.videoUrl);
  if (_0x3605d1 === 'fast') {
    if (_0xe4cb43.length < 1) throw new Error('RunningHub Hailuo 02 Fast requires imageUrl input');
    if (_0xe4cb43.length > 1) throw new Error('RunningHub Hailuo 02 Fast supports only imageUrl input');
    return ((_0x4bef47.imageUrl = _0xe4cb43[0]), _0x4bef47);
  }
  if (_0x3605d1 === 'pro') {
    delete _0x4bef47.duration;
    if (_0xe4cb43.length > 1) throw new Error('RunningHub Hailuo 02 Pro supports only firstImageUrl input');
    if (_0xe4cb43[0]) _0x4bef47.firstImageUrl = _0xe4cb43[0];
    return _0x4bef47;
  }
  if (_0xe4cb43.length > 2) throw new Error('RunningHub Hailuo 02 Standard supports at most 2 image inputs');
  if (_0xe4cb43[0]) _0x4bef47.firstImageUrl = _0xe4cb43[0];
  if (_0xe4cb43[1]) _0x4bef47.lastImageUrl = _0xe4cb43[1];
  return _0x4bef47;
}
function runninghubHailuo02VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x54eace = resolveRunningHubHailuo02Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_HAILUO_02_ENDPOINTS[_0x54eace] || RUNNINGHUB_HAILUO_02_ENDPOINTS.t2vStandard;
}
const RUNNINGHUB_HAILUO_23_ENDPOINTS = Object.freeze({
  t2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-standard',
  t2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro',
  i2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard',
  i2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/image-to-video-pro',
  i2vFast: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video',
  i2vFastPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast-pro/image-to-video',
});
function normalizeRunningHubHailuo23Quality(_0x494b90) {
  const _0x24d699 = String(_0x494b90 || '')
    .trim()
    .toLowerCase();
  if (_0x24d699 === 'pro') return 'pro';
  if (_0x24d699 === 'fast') return 'fast';
  if (_0x24d699 === 'fastpro' || _0x24d699 === 'fast-pro' || _0x24d699 === 'fast_pro') return 'fastPro';
  return 'standard';
}
function normalizeRunningHubHailuo23Duration(_0x95bb47) {
  const _0x51ab55 = Number(_0x95bb47);
  return Number.isFinite(_0x51ab55) && Math.trunc(_0x51ab55) === 10 ? '10' : '6';
}
function getRunningHubHailuo23Quality(_0x2bc68b = {}, _0x4b2912 = {}) {
  return normalizeRunningHubHailuo23Quality(
    _0x4b2912.rh_hailuo_23_quality ||
      _0x2bc68b?.generationParams?.rh_hailuo_23_quality ||
      _0x2bc68b?.rh_hailuo_23_quality,
  );
}
function collectRunningHubHailuo23FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x133535 = [],
    _0x47b2bb = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x133535, _0x47b2bb.firstFrame),
    normalizeInputList(inputImages).forEach((_0x97d3cb) => appendUniqueUrl(_0x133535, _0x97d3cb)),
    _0x133535
  );
}
function getRunningHubHailuo23RawVideoCount(_0x47788f = {}, _0x545858 = []) {
  return Math.max(
    normalizeInputList(_0x545858).length,
    normalizeInputList(_0x47788f?.videos).length,
    normalizeInputList(_0x47788f?.videoUrls).length,
    String(_0x47788f?.videoUrl || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubHailuo23Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x5d1b3f = getRunningHubHailuo23Quality(payload, currentBody),
    _0x1f277b = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).length;
  if (_0x5d1b3f === 'fast') return 'i2vFast';
  if (_0x5d1b3f === 'fastPro') return 'i2vFastPro';
  if (_0x5d1b3f === 'pro') return _0x1f277b > 0 ? 'i2vPro' : 't2vPro';
  return _0x1f277b > 0 ? 'i2vStandard' : 't2vStandard';
}
function runninghubHailuo23Video({
  currentBody: _0x52e7d9,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x57426d = { ..._0x52e7d9 },
    _0x27c159 = String(_0x57426d.prompt || payload?.prompt || '').trim();
  if (!_0x27c159) throw new Error('RunningHub Hailuo 2.3 prompt is required');
  const _0x26a7d0 = getRunningHubHailuo23Quality(payload, _0x57426d),
    _0x216514 = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x5d0d12 = getRunningHubHailuo23RawVideoCount(payload, inputVideos);
  if (_0x5d0d12 > 0) throw new Error('RunningHub Hailuo 2.3 does not accept video input');
  if (_0x216514.length > 1) throw new Error('RunningHub Hailuo 2.3 supports only imageUrl input');
  ((_0x57426d.prompt = _0x27c159),
    (_0x57426d.duration = normalizeRunningHubHailuo23Duration(_0x57426d.duration)),
    delete _0x57426d.rh_hailuo_23_quality,
    delete _0x57426d.firstImageUrl,
    delete _0x57426d.lastImageUrl,
    delete _0x57426d.imageUrl,
    delete _0x57426d.imageUrls,
    delete _0x57426d.videoUrl);
  if (_0x26a7d0 === 'fast' || _0x26a7d0 === 'fastPro') {
    if (!_0x216514[0]) throw new Error('RunningHub Hailuo 2.3 Fast requires imageUrl input');
    return (
      (_0x57426d.imageUrl = _0x216514[0]),
      _0x26a7d0 === 'fastPro' && (_0x57426d.duration = '6'),
      _0x57426d
    );
  }
  _0x26a7d0 === 'pro' && delete _0x57426d.duration;
  if (_0x216514[0]) _0x57426d.imageUrl = _0x216514[0];
  return _0x57426d;
}
function runninghubHailuo23VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x5bb4da = resolveRunningHubHailuo23Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_HAILUO_23_ENDPOINTS[_0x5bb4da] || RUNNINGHUB_HAILUO_23_ENDPOINTS.t2vStandard;
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
function normalizeRunningHubVeo3Channel(_0x4582ab) {
  const _0x4debf7 = String(_0x4582ab || '')
    .trim()
    .toLowerCase();
  if (_0x4debf7 === 'official' || _0x4debf7 === 'stable' || _0x4debf7 === 'officialstable') return 'official';
  return 'lowCost';
}
function normalizeRunningHubVeo3Mode(_0x2e0739, { channel: channel = 'lowCost' } = {}) {
  const _0x3c8e38 = String(_0x2e0739 || '')
    .trim()
    .toLowerCase();
  if (_0x3c8e38 === 'quality' || _0x3c8e38 === 'pro') return 'pro';
  if (_0x3c8e38 === 'lite' && channel === 'official') return 'lite';
  return 'fast';
}
function getRunningHubVeo3Channel(_0x3d13e9 = {}, _0x239dca = {}) {
  return normalizeRunningHubVeo3Channel(
    _0x239dca.rh_veo3_channel || _0x3d13e9?.generationParams?.rh_veo3_channel || _0x3d13e9?.rh_veo3_channel,
  );
}
function getRunningHubVeo3Mode(_0x27479f = {}, _0x2b9af8 = {}) {
  const _0x32c38f = getRunningHubVeo3Channel(_0x27479f, _0x2b9af8);
  return normalizeRunningHubVeo3Mode(_0x2b9af8.mode || _0x27479f?.generationParams?.mode || _0x27479f?.mode, {
    channel: _0x32c38f,
  });
}
function getRunningHubVeo3GenerationType(_0x34fb6a = {}, _0xd6f0b3 = {}) {
  const _0x5f2ec5 = String(
    _0xd6f0b3.generation_type ||
      _0x34fb6a?.generationParams?.generation_type ||
      _0x34fb6a?.generation_type ||
      'frame',
  )
    .trim()
    .toLowerCase();
  if (_0x5f2ec5 === 'reference' || _0x5f2ec5 === 'extend') return _0x5f2ec5;
  return 'frame';
}
function collectRunningHubVeo3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x418cbb = [],
    _0x15062f = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x418cbb, _0x15062f.firstFrame),
    appendUniqueUrl(_0x418cbb, _0x15062f.lastFrame),
    normalizeInputList(inputImages).forEach((_0x63f822) => appendUniqueUrl(_0x418cbb, _0x63f822)),
    _0x418cbb
  );
}
function collectRunningHubVeo3ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x575b96 = [],
    _0x42cb51 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x575b96, _0x42cb51.referenceImage),
    normalizeInputList(inputImages).forEach((_0x42ff74) => appendUniqueUrl(_0x575b96, _0x42ff74)),
    _0x575b96
  );
}
function getRunningHubVeo3RawVideoCount(_0x4f5e17 = {}, _0x43aac8 = []) {
  return Math.max(
    normalizeInputList(_0x43aac8).length,
    normalizeInputList(_0x4f5e17?.videos).length,
    normalizeInputList(_0x4f5e17?.videoUrls).length,
    String(_0x4f5e17?.videoUrl || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubVeo3Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x4b62c5 = getRunningHubVeo3Channel(payload, currentBody),
    _0x8f3c27 = getRunningHubVeo3Mode(payload, currentBody),
    _0x4d474f = getRunningHubVeo3GenerationType(payload, currentBody);
  if (_0x4d474f === 'extend' || normalizeInputList(inputVideos).length > 0)
    return Object.freeze({ channel: _0x4b62c5, mode: _0x8f3c27, route: 'extend' });
  if (_0x4d474f === 'reference')
    return Object.freeze({ channel: _0x4b62c5, mode: _0x8f3c27, route: 'reference' });
  const _0x535e0a = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x535e0a.length >= 2) return Object.freeze({ channel: _0x4b62c5, mode: _0x8f3c27, route: 'frames' });
  if (_0x535e0a.length === 1)
    return Object.freeze({
      channel: _0x4b62c5,
      mode: _0x8f3c27,
      route: _0x4b62c5 === 'lowCost' && _0x8f3c27 === 'pro' ? 'frames' : 'image',
    });
  return Object.freeze({ channel: _0x4b62c5, mode: _0x8f3c27, route: 'text' });
}
function normalizeRunningHubVeo3BodyResolution(_0x312dc9, { channel: _0x3ea226, mode: _0x538148 }) {
  const _0xf7ffaf = String(_0x312dc9 || '720p')
    .trim()
    .toLowerCase();
  if (_0x3ea226 === 'lowCost') return '720p';
  if (_0x538148 === 'lite' && _0xf7ffaf === '4k') return '1080p';
  if (_0xf7ffaf === '4k' || _0xf7ffaf === '1080p') return _0xf7ffaf;
  return '720p';
}
function normalizeRunningHubVeo3BodyDuration(_0x2ffff1, { channel: _0x58f957, mode: _0x2787fc }) {
  if (_0x58f957 === 'lowCost') return '8';
  const _0x576233 = Math.trunc(Number(_0x2ffff1));
  if (_0x2787fc === 'lite') return _0x576233 === 8 ? '8' : '6';
  return [4, 6, 8].includes(_0x576233) ? String(_0x576233) : '8';
}
function removeRunningHubVeo3TransientFields(_0x175972) {
  (delete _0x175972.rh_veo3_channel,
    delete _0x175972.mode,
    delete _0x175972.generation_type,
    delete _0x175972.imageUrl,
    delete _0x175972.imageUrls,
    delete _0x175972.firstFrameUrl,
    delete _0x175972.lastFrameUrl,
    delete _0x175972.firstImageUrl,
    delete _0x175972.lastImageUrl,
    delete _0x175972.videoUrl,
    delete _0x175972.video);
}
function runninghubVeo3Video({
  currentBody: _0x4eb9df,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x58068a = { ..._0x4eb9df },
    _0x594b56 = resolveRunningHubVeo3Route({
      inputImages: inputImages,
      inputVideos: inputVideos,
      payload: payload,
      finalUrlsBySlot: finalUrlsBySlot,
      currentBody: _0x58068a,
    }),
    { channel: _0x5d988f, mode: _0x2b32d2, route: _0x494a9b } = _0x594b56,
    _0x4e43e0 = getRunningHubVeo3GenerationType(payload, _0x58068a),
    _0xd56606 = getRunningHubVeo3RawVideoCount(payload, inputVideos);
  if (_0xd56606 > 0 && _0x494a9b !== 'extend') throw new Error('RunningHub Veo3 does not accept video input');
  const _0xa705f4 = String(_0x58068a.prompt || payload?.prompt || '').trim();
  if (_0x494a9b !== 'extend') {
    if (!_0xa705f4) throw new Error('RunningHub Veo3 prompt is required');
    _0x58068a.prompt = _0xa705f4;
  }
  ((_0x58068a.resolution = normalizeRunningHubVeo3BodyResolution(_0x58068a.resolution, {
    channel: _0x5d988f,
    mode: _0x2b32d2,
  })),
    (_0x58068a.duration = normalizeRunningHubVeo3BodyDuration(_0x58068a.duration, {
      channel: _0x5d988f,
      mode: _0x2b32d2,
    })),
    removeRunningHubVeo3TransientFields(_0x58068a));
  if (_0x494a9b === 'extend') {
    if (_0x5d988f !== 'official' || _0x2b32d2 === 'lite')
      throw new Error('RunningHub Veo3 video extend only supports official Fast or Pro');
    const _0x142bac = normalizeInputList(inputVideos);
    if (_0xd56606 < 1 || !_0x142bac[0])
      throw new Error('RunningHub Veo3 video extend requires 1 video input');
    if (_0xd56606 > 1) throw new Error('RunningHub Veo3 video extend supports at most 1 video input');
    const _0x102731 = [];
    (collectRunningHubVeo3FrameImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot }).forEach(
      (_0x236cf8) => appendUniqueUrl(_0x102731, _0x236cf8),
    ),
      collectRunningHubVeo3ReferenceImages({
        inputImages: inputImages,
        finalUrlsBySlot: finalUrlsBySlot,
      }).forEach((_0x489130) => appendUniqueUrl(_0x102731, _0x489130)));
    if (_0x102731.length > 0) throw new Error('RunningHub Veo3 video extend does not accept image input');
    return (
      (_0x58068a.video = _0x142bac[0]),
      delete _0x58068a.prompt,
      delete _0x58068a.duration,
      delete _0x58068a.aspectRatio,
      delete _0x58068a.generateAudio,
      _0x58068a
    );
  }
  if (_0x4e43e0 === 'reference') {
    if (_0x5d988f !== 'official' || _0x2b32d2 === 'lite')
      throw new Error('RunningHub Veo3 reference mode only supports official Fast or Pro');
    const _0x5f009b = collectRunningHubVeo3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (_0x5f009b.length < 1) throw new Error('RunningHub Veo3 reference mode requires 1-3 image inputs');
    if (_0x5f009b.length > 3)
      throw new Error('RunningHub Veo3 reference mode supports at most 3 image inputs');
    ((_0x58068a.imageUrls = _0x5f009b), delete _0x58068a.duration);
    if (_0x2b32d2 === 'pro') delete _0x58068a.aspectRatio;
    return _0x58068a;
  }
  const _0x3b833d = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x3b833d.length > 2) throw new Error('RunningHub Veo3 frame mode supports at most 2 image inputs');
  if (_0x3b833d.length >= 2 && _0x5d988f === 'official' && _0x2b32d2 !== 'lite')
    throw new Error(
      'RunningHub Veo3 official Fast/Pro start-end endpoint is not published; use official Lite or low-cost channel',
    );
  if (_0x3b833d.length === 1) {
    if (_0x5d988f === 'official') _0x58068a.imageUrl = _0x3b833d[0];
    else
      _0x2b32d2 === 'pro' ? (_0x58068a.firstFrameUrl = _0x3b833d[0]) : (_0x58068a.imageUrls = [_0x3b833d[0]]);
  } else
    _0x3b833d.length === 2 &&
      (_0x5d988f === 'official'
        ? ((_0x58068a.firstImageUrl = _0x3b833d[0]),
          (_0x58068a.lastImageUrl = _0x3b833d[1]),
          delete _0x58068a.duration)
        : ((_0x58068a.firstFrameUrl = _0x3b833d[0]), (_0x58068a.lastFrameUrl = _0x3b833d[1])));
  return ((_0x5d988f === 'lowCost' || _0x2b32d2 === 'lite') && delete _0x58068a.generateAudio, _0x58068a);
}
function runninghubVeo3VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const {
    channel: _0x335be9,
    mode: _0x5570ba,
    route: _0x1a939c,
  } = resolveRunningHubVeo3Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_VEO3_ENDPOINTS[_0x335be9]?.[_0x1a939c]?.[_0x5570ba] ||
    RUNNINGHUB_VEO3_ENDPOINTS.lowCost.text.fast
  );
}
const RUNNINGHUB_WAN27_ENDPOINTS = Object.freeze({
  text: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video',
  video: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-extend',
  reference: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-edit',
});
function normalizeRunningHubWan27Mode(_0x318f94) {
  const _0x3a3b80 = String(_0x318f94 || '')
    .trim()
    .toLowerCase();
  return _0x3a3b80 === 'video' || _0x3a3b80 === 'reference' || _0x3a3b80 === 'edit' ? _0x3a3b80 : 'image';
}
function getRunningHubWan27Mode(_0xd0cc04 = {}, _0xecfe7c = {}) {
  return normalizeRunningHubWan27Mode(
    _0xecfe7c.wan27_mode || _0xd0cc04?.generationParams?.wan27_mode || _0xd0cc04?.wan27_mode,
  );
}
function collectRunningHubWan27Images({
  mode: _0xaabc10,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0xbf2a1a = [],
    _0x431f7e = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  if (_0xaabc10 === 'image')
    (appendUniqueUrl(_0xbf2a1a, _0x431f7e.firstFrame), appendUniqueUrl(_0xbf2a1a, _0x431f7e.lastFrame));
  else {
    if (_0xaabc10 === 'reference') appendUniqueUrl(_0xbf2a1a, _0x431f7e.referenceImage);
    else _0xaabc10 === 'edit' && appendUniqueUrl(_0xbf2a1a, _0x431f7e.editRefImage);
  }
  return (
    normalizeInputList(inputImages).forEach((_0xd4bf21) => appendUniqueUrl(_0xbf2a1a, _0xd4bf21)),
    _0xbf2a1a
  );
}
function removeRunningHubWan27TransientFields(_0x38b116) {
  (delete _0x38b116.wan27_mode,
    delete _0x38b116.firstImageUrl,
    delete _0x38b116.lastImageUrl,
    delete _0x38b116.imageUrl,
    delete _0x38b116.imageUrls,
    delete _0x38b116.videoUrl,
    delete _0x38b116.videoUrls);
  if (!_0x38b116.aspectRatio) delete _0x38b116.aspectRatio;
}
function resolveRunningHubWan27Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x21f844 = getRunningHubWan27Mode(payload, currentBody);
  if (_0x21f844 === 'reference' || _0x21f844 === 'edit') return _0x21f844;
  const _0x21817b = normalizeInputList(inputVideos);
  if (_0x21f844 === 'video' && _0x21817b.length > 0) return 'video';
  const _0x15efe5 = collectRunningHubWan27Images({
    mode: _0x21f844,
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x15efe5.length > 0) return 'image';
  return 'text';
}
function runninghubWan27Video({
  currentBody: _0x56b974,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x2af787 = { ..._0x56b974 },
    _0x5860d1 = String(_0x2af787.prompt || payload?.prompt || '').trim();
  if (!_0x5860d1) throw new Error('RunningHub Wan2.7 prompt is required');
  const _0x45ccf9 = getRunningHubWan27Mode(payload, _0x2af787),
    _0x57be38 = collectRunningHubWan27Images({
      mode: _0x45ccf9,
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x3b81f6 = normalizeInputList(inputVideos),
    _0x5bb823 = String(_0x2af787.audioUrl || '').trim() || normalizeInputList(inputAudios)[0] || '';
  _0x2af787.prompt = _0x5860d1;
  if (_0x5bb823) _0x2af787.audioUrl = _0x5bb823;
  removeRunningHubWan27TransientFields(_0x2af787);
  if (_0x45ccf9 === 'reference') {
    const _0x1efc6d = _0x57be38.length + _0x3b81f6.length;
    if (_0x1efc6d <= 0) throw new Error('RunningHub Wan2.7 reference mode requires image or video input');
    if (_0x1efc6d > 5) throw new Error('RunningHub Wan2.7 reference mode supports at most 5 inputs');
    if (_0x5bb823) throw new Error('RunningHub Wan2.7 reference mode does not accept audio input');
    if (_0x57be38.length > 0) _0x2af787.imageUrls = _0x57be38;
    if (_0x3b81f6.length > 0) _0x2af787.videoUrls = _0x3b81f6;
    return _0x2af787;
  }
  if (_0x45ccf9 === 'edit') {
    if (!_0x3b81f6[0]) throw new Error('RunningHub Wan2.7 video edit requires original video input');
    if (_0x3b81f6.length > 1) throw new Error('RunningHub Wan2.7 video edit accepts only one original video');
    if (_0x57be38.length > 3) throw new Error('RunningHub Wan2.7 video edit supports at most 3 image inputs');
    if (_0x5bb823) throw new Error('RunningHub Wan2.7 video edit does not accept audio input');
    _0x2af787.videoUrl = _0x3b81f6[0];
    if (_0x57be38.length > 0) _0x2af787.imageUrls = _0x57be38.slice(0, 3);
    return _0x2af787;
  }
  if (_0x45ccf9 === 'video') {
    if (_0x57be38.length > 0) throw new Error('RunningHub Wan2.7 video extend does not accept image input');
    if (_0x3b81f6.length > 1) throw new Error('RunningHub Wan2.7 video extend accepts only one video input');
    if (_0x3b81f6[0]) _0x2af787.videoUrl = _0x3b81f6[0];
    return _0x2af787;
  }
  if (_0x3b81f6.length > 0) throw new Error('RunningHub Wan2.7 image mode does not accept video input');
  if (_0x57be38.length > 2) throw new Error('RunningHub Wan2.7 image mode supports at most 2 image inputs');
  _0x57be38[0] && (delete _0x2af787.aspectRatio, (_0x2af787.firstImageUrl = _0x57be38[0]));
  if (_0x57be38[1]) _0x2af787.lastImageUrl = _0x57be38[1];
  return _0x2af787;
}
function runninghubWan27VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x481e13 = resolveRunningHubWan27Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_WAN27_ENDPOINTS[_0x481e13] || RUNNINGHUB_WAN27_ENDPOINTS.text;
}
function apimartKlingV3OmniVideo({
  currentBody: _0x2baf15,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x56341a = { ..._0x2baf15 },
    _0x5be5a7 = normalizeInputList(inputImages),
    _0x5d795d = normalizeInputList(inputVideos),
    _0xad58a0 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    _0x1cf27d = normalizeKlingV3OmniMode(
      payload?.generationParams?.kling_v3_omni_mode || payload?.kling_v3_omni_mode || 'image',
    );
  (delete _0x56341a.kling_v3_omni_mode, delete _0x56341a.image_with_roles, delete _0x56341a.video_list);
  if (_0x1cf27d === 'edit') {
    if (!_0x5d795d[0]) throw new Error('APIMart Kling V3 Omni video edit requires video_list input');
    return (
      (_0x56341a.video_list = [buildKlingV3OmniVideoItem(_0x5d795d[0], 'base')]),
      delete _0x56341a.image_urls,
      delete _0x56341a.image_with_roles,
      delete _0x56341a.audio,
      delete _0x56341a.duration,
      delete _0x56341a.aspect_ratio,
      _0x56341a
    );
  }
  if (_0x1cf27d === 'reference') {
    const _0x5ec288 = [];
    (appendUniqueUrl(_0x5ec288, _0xad58a0.referenceImage),
      _0x5be5a7.forEach((_0x11bc24) => appendUniqueUrl(_0x5ec288, _0x11bc24)));
    const _0x15878e = _0x5ec288.slice(0, 1),
      _0x13d5cb = _0x5d795d[0] || '';
    if (_0x15878e.length <= 0 && !_0x13d5cb)
      throw new Error('APIMart Kling V3 Omni reference mode requires image or video input');
    return (
      _0x15878e.length > 0
        ? (_0x56341a.image_with_roles = _0x15878e.map((_0x3eb7a3) => ({ url: _0x3eb7a3, role: 'reference' })))
        : delete _0x56341a.image_with_roles,
      _0x13d5cb
        ? ((_0x56341a.video_list = [buildKlingV3OmniVideoItem(_0x13d5cb, 'feature')]), delete _0x56341a.audio)
        : delete _0x56341a.video_list,
      delete _0x56341a.image_urls,
      _0x56341a
    );
  }
  if (_0x5d795d.length > 0)
    throw new Error('APIMart Kling V3 Omni image mode does not support video_list input');
  const _0x77c0cb =
      Object.prototype.hasOwnProperty.call(_0xad58a0, 'firstFrame') ||
      Object.prototype.hasOwnProperty.call(_0xad58a0, 'lastFrame'),
    _0x480b4b = _0x77c0cb ? _0xad58a0.firstFrame || '' : _0x5be5a7[0] || '',
    _0x3afbb0 = _0x77c0cb
      ? _0xad58a0.lastFrame || ''
      : _0x5be5a7.find((_0x15f77c) => _0x15f77c && _0x15f77c !== _0x480b4b) || '';
  if (!_0x480b4b && _0x3afbb0) throw new Error('APIMart Kling V3 Omni last_frame requires first_frame input');
  const _0x1dc8cc = [];
  return (
    _0x480b4b && _0x1dc8cc.push({ url: _0x480b4b, role: 'first_frame' }),
    _0x3afbb0 && _0x1dc8cc.push({ url: _0x3afbb0, role: 'last_frame' }),
    _0x1dc8cc.length > 0
      ? ((_0x56341a.image_with_roles = _0x1dc8cc), delete _0x56341a.image_urls)
      : delete _0x56341a.image_urls,
    _0x56341a
  );
}
function apimartWan27Video({ currentBody: _0x128e7d, payload: payload = {} }) {
  const _0x597fdc = { ..._0x128e7d },
    _0x46eb89 = normalizeInputList(_0x597fdc.image_urls),
    _0xa7fbc4 = normalizeInputList(_0x597fdc.video_urls),
    _0x5a2d88 = isPresentValue(_0x597fdc.audio_url) ? String(_0x597fdc.audio_url || '').trim() : '',
    _0x2f7877 = !!_0x5a2d88,
    _0x4f3252 = String(payload?.generationParams?.wan27_mode || payload?.wan27_mode || 'image')
      .trim()
      .toLowerCase();
  (delete _0x597fdc.wan27_mode, delete _0x597fdc.wan27_reference_input, delete _0x597fdc.wan27_edit_input);
  if (_0x4f3252 === 'reference') {
    _0x597fdc.model = 'wan2.7-r2v';
    const _0x8d878a = _0x46eb89.slice(0, 1),
      _0xb9e3fc = _0xa7fbc4.slice(0, Math.max(0, 5 - _0x8d878a.length));
    if (_0x8d878a.length <= 0 && _0xb9e3fc.length <= 0)
      throw new Error('APIMart Wan2.7-R2V requires image_with_roles or video_urls input');
    return (
      _0x8d878a.length > 0
        ? (_0x597fdc.image_with_roles = _0x8d878a.map((_0x2fb7dd, _0x12abb5) => ({
            url: _0x2fb7dd,
            role: 'reference_image',
            ...(_0x12abb5 === 0 && _0x5a2d88 ? { reference_voice: _0x5a2d88 } : {}),
          })))
        : delete _0x597fdc.image_with_roles,
      _0xb9e3fc.length > 0 ? (_0x597fdc.video_urls = _0xb9e3fc) : delete _0x597fdc.video_urls,
      delete _0x597fdc.image_urls,
      delete _0x597fdc.audio_url,
      _0x597fdc
    );
  }
  if (_0x4f3252 === 'edit') {
    _0x597fdc.model = 'wan2.7-videoedit';
    if (!_0xa7fbc4[0]) throw new Error('APIMart Wan2.7-VideoEdit requires video_urls input');
    _0x597fdc.video_urls = _0xa7fbc4.slice(0, 2);
    if (_0x46eb89.length > 0) _0x597fdc.image_urls = _0x46eb89.slice(0, 4);
    else delete _0x597fdc.image_urls;
    return (delete _0x597fdc.audio_url, _0x597fdc);
  }
  _0x597fdc.model = 'wan2.7';
  if (_0x46eb89.length > 0 && _0xa7fbc4.length > 0)
    throw new Error('APIMart Wan2.7 image_urls cannot be used with video_urls');
  if (_0xa7fbc4.length > 0 && _0x2f7877)
    throw new Error('APIMart Wan2.7 video_urls cannot be used with audio_url');
  return ((_0x46eb89.length > 0 || _0xa7fbc4.length > 0) && delete _0x597fdc.size, _0x597fdc);
}
function agnesImage({ currentBody: _0xbedef8, modelToken: _0x6f820e }) {
  const _0x1a0067 = { ..._0xbedef8 },
    _0x19489d = normalizeInputList(_0x1a0067.extra_body?.image),
    _0xbfb1c3 = String(_0x6f820e || _0x1a0067.model || '').trim(),
    _0x2adc13 = _0xbfb1c3 === 'agnes-image-2.0-flash',
    _0x8398b6 =
      _0x1a0067.extra_body && typeof _0x1a0067.extra_body === 'object' && !Array.isArray(_0x1a0067.extra_body)
        ? { ..._0x1a0067.extra_body }
        : {};
  return (
    _0x19489d.length > 0
      ? ((_0x8398b6.image = _0x19489d),
        (_0x8398b6.response_format = 'url'),
        _0x2adc13 && (_0x1a0067.tags = ['img2img']))
      : (delete _0x8398b6.image, _0x2adc13 && delete _0x1a0067.tags),
    Object.keys(_0x8398b6).length > 0 ? (_0x1a0067.extra_body = _0x8398b6) : delete _0x1a0067.extra_body,
    _0x1a0067
  );
}
function normalizeAgnesVideoFrameCount(_0x3f5939) {
  const _0x2848f9 = Number(_0x3f5939);
  if (!Number.isFinite(_0x2848f9)) return _0x3f5939;
  const _0x294f1a = 49,
    _0x192075 = 0x1b9,
    _0x50fabc = Math.min(Math.max(_0x294f1a, Math.trunc(_0x2848f9)), _0x192075),
    _0x16a331 = Math.round((_0x50fabc - 1) / 8) * 8 + 1;
  return Math.min(_0x192075, Math.max(_0x294f1a, _0x16a331));
}
function agnesVideo({ currentBody: _0x1e265c, payload: payload = {} }) {
  const _0xa29249 = { ..._0x1e265c },
    _0x266070 = String(
      payload?.generationParams?.agnes_video_mode ||
        payload?.agnes_video_mode ||
        _0xa29249.agnes_video_mode ||
        'reference',
    )
      .trim()
      .toLowerCase();
  delete _0xa29249.agnes_video_mode;
  _0xa29249.num_frames !== undefined &&
    (_0xa29249.num_frames = normalizeAgnesVideoFrameCount(_0xa29249.num_frames));
  const _0x2e3792 = normalizeInputList(_0xa29249.extra_body?.image),
    _0x171342 = _0x266070 === 'keyframes' ? _0x2e3792.slice(0, 2) : _0x2e3792;
  if (_0x171342.length === 0) return (delete _0xa29249.image, delete _0xa29249.extra_body, _0xa29249);
  if (_0x171342.length === 1)
    return ((_0xa29249.image = _0x171342[0]), delete _0xa29249.extra_body, _0xa29249);
  return (
    (_0xa29249.extra_body = {
      image: _0x171342,
      ...(_0x266070 === 'keyframes' ? { mode: 'keyframes' } : {}),
    }),
    delete _0xa29249.image,
    _0xa29249
  );
}
function runninghubImageEndpoint({
  modelToken: _0x2d5fb3,
  finalUrls: _0x5ad864,
  executionManifest: _0x549c03,
  modelManifest: _0x7f9499,
  payload: _0x3d14de,
}) {
  const _0x5a8a4a = normalizeRunningHubModelId(_0x2d5fb3),
    _0x2fa434 = resolveRunningHubModelEndpoint({
      hasInputImages: _0x5ad864.length > 0,
      executionManifest: _0x549c03,
      modelManifest: _0x7f9499,
      payload: _0x3d14de,
    });
  return 'https://www.runninghub.cn/openapi/v2/' + _0x5a8a4a + '/' + _0x2fa434;
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
export function getModelApiBodyResolver(_0x28686d) {
  return BODY_RESOLVERS[String(_0x28686d || '').trim()] || null;
}
export function getModelApiEndpointResolver(_0x9f9cbc) {
  return ENDPOINT_RESOLVERS[String(_0x9f9cbc || '').trim()] || null;
}
