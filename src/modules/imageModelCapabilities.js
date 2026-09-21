import {
  QWEN_IMAGE_EDIT_MODEL_ID,
  getModelsByKind,
  isWorkflowModel,
  normalizeProviderId as normalizeProviderId_2,
  resolveModelExecution,
} from '../manifests/index.js';
import { NANO_BANANA_FAMILIES, resolveNanoBananaSelectionFromModel } from './nanoBananaModeRules.js';
const RH_QWEN_IMAGE_EDIT_MODEL = QWEN_IMAGE_EDIT_MODEL_ID;
function normalizeModelId(_0xd466d4) {
  return String(_0xd466d4 || '')
    .trim()
    .toLowerCase();
}
function normalizeProviderId(_0x1baf1e) {
  return normalizeProviderId_2(_0x1baf1e);
}
function inferProviderHintFromModelId(_0x314762) {
  const _0x285071 = normalizeModelId(_0x314762);
  if (!_0x285071.includes('/')) return '';
  return normalizeProviderId(_0x285071.split('/')[0]);
}
function normalizeImageSizeValue(_0x500684) {
  return String(_0x500684 || '')
    .trim()
    .toUpperCase();
}
function collectStringValues(_0x25ecb4, _0x31e58e = []) {
  if (typeof _0x25ecb4 === 'string') {
    const _0x5eeaae = normalizeModelId(_0x25ecb4);
    if (_0x5eeaae) _0x31e58e.push(_0x5eeaae);
    return _0x31e58e;
  }
  if (Array.isArray(_0x25ecb4))
    return (_0x25ecb4.forEach((_0xdc66e1) => collectStringValues(_0xdc66e1, _0x31e58e)), _0x31e58e);
  return (
    _0x25ecb4 &&
      typeof _0x25ecb4 === 'object' &&
      Object.values(_0x25ecb4).forEach((_0x46b17a) => collectStringValues(_0x46b17a, _0x31e58e)),
    _0x31e58e
  );
}
function getExecutionModelTokens(_0x203711) {
  return collectStringValues([
    _0x203711?.model,
    _0x203711?.routeModels,
    _0x203711?.modeModels,
    _0x203711?.imageSizeModels,
  ]);
}
function resolveImageModelFromExecutionToken(_0x5b0807, _0x39b3d0 = '') {
  const _0x45887e = normalizeModelId(_0x5b0807);
  if (!_0x45887e || _0x45887e.includes('/')) return null;
  const _0x37e86f = normalizeProviderId(_0x39b3d0),
    _0x1f9f62 = getModelsByKind('image').filter((_0x2b396e) => {
      return !_0x37e86f || normalizeProviderId(_0x2b396e?.provider) === _0x37e86f;
    }),
    _0x2f59e4 = _0x1f9f62
      .map((_0x2eaf7c) => ({
        modelManifest: _0x2eaf7c,
        executionManifest: resolveModelExecution(_0x2eaf7c?.modelId)?.executionManifest,
      }))
      .filter((_0x22fe6f) => _0x22fe6f.executionManifest),
    _0x1df69d = _0x2f59e4.find(
      ({ executionManifest: _0x4f6ffc }) => normalizeModelId(_0x4f6ffc?.model) === _0x45887e,
    ),
    _0xccd7b0 =
      _0x1df69d ||
      _0x2f59e4.find(({ executionManifest: _0x313794 }) =>
        getExecutionModelTokens(_0x313794).includes(_0x45887e),
      );
  if (!_0xccd7b0) return null;
  return {
    modelManifest: _0xccd7b0.modelManifest,
    executionManifest: _0xccd7b0.executionManifest,
    canonicalModelId: _0xccd7b0.modelManifest.modelId,
    source: 'execution-model-token',
  };
}
function resolveImageModelContext(_0xf7c190, _0x2726a3 = '') {
  const _0x64efc5 = normalizeProviderId(_0x2726a3) || inferProviderHintFromModelId(_0xf7c190),
    _0x189e4c =
      resolveModelExecution(_0xf7c190, { providerHint: _0x64efc5 }) ||
      resolveImageModelFromExecutionToken(_0xf7c190, _0x64efc5) ||
      (_0x64efc5 ? null : resolveModelExecution(_0xf7c190)),
    _0x4ad266 = _0x189e4c?.modelManifest || null,
    _0x494f04 = _0x189e4c?.executionManifest || null;
  return {
    modelManifest: _0x4ad266,
    executionManifest: _0x494f04,
    provider: normalizeProviderId(_0x4ad266?.provider || _0x64efc5),
    modelId: normalizeModelId(_0x189e4c?.canonicalModelId || _0x4ad266?.modelId || _0xf7c190),
  };
}
function getImageSizePolicy(_0x1c33aa, _0xc40bb3 = '') {
  const _0x2df494 = resolveImageModelContext(_0x1c33aa, _0xc40bb3),
    _0x3298fd = _0x2df494.modelManifest?.extensions?.imageSizePolicy;
  return _0x3298fd && typeof _0x3298fd === 'object'
    ? { context: _0x2df494, policy: _0x3298fd }
    : { context: _0x2df494, policy: null };
}
function normalizePolicySizes(_0x551eea) {
  return Array.isArray(_0x551eea) ? _0x551eea.map(normalizeImageSizeValue).filter(Boolean) : [];
}
function getGrsaiNanoBananaSelection(_0x5735ad, _0x1fea4f = '', _0x3523e9 = '2K') {
  const _0x283b05 = resolveNanoBananaSelectionFromModel(_0x5735ad, _0x3523e9, _0x1fea4f);
  if (!_0x283b05 || _0x283b05.provider !== 'grsai') return null;
  if (_0x283b05.family === NANO_BANANA_FAMILIES.GPT_IMAGE_2) return null;
  return _0x283b05;
}
export function isRunningHubModelWithoutImageSizeParam(_0x78f8ed) {
  const { context: _0x139b7d, policy: _0x4999f8 } = getImageSizePolicy(_0x78f8ed);
  return _0x139b7d.provider === 'runninghub' && _0x4999f8?.omitRequestParam === true;
}
export function isRunningHubGptImage2OfficialModel(_0x457001, _0x4e07bb = '') {
  const { context: _0x490e77, policy: _0x4506d5 } = getImageSizePolicy(_0x457001, _0x4e07bb);
  return _0x490e77.provider === 'runninghub' && _0x4506d5?.officialVariant === true;
}
export function isRhQwenImageEditModel(_0x2b0eda) {
  return normalizeModelId(_0x2b0eda) === normalizeModelId(RH_QWEN_IMAGE_EDIT_MODEL);
}
export function normalizeImageSizeForProviderModel({
  model: _0x3cdc56,
  provider: provider = '',
  imageSize: imageSize = '',
} = {}) {
  const _0x3625a5 = normalizeImageSizeValue(imageSize),
    { policy: _0xd3306a } = getImageSizePolicy(_0x3cdc56, provider),
    _0xbefae4 = getGrsaiNanoBananaSelection(_0x3cdc56, provider, _0x3625a5 || '2K');
  if (_0xbefae4) {
    const _0x316769 = normalizeImageSizeValue(_0xd3306a?.fixedSize);
    if (_0x316769) return _0x316769;
    if (_0x3625a5 === '4K' && _0xd3306a?.allow4KSelection === true) return '4K';
    return _0x3625a5 === '1K' ? '1K' : '2K';
  }
  if (isRunningHubGptImage2OfficialModel(_0x3cdc56, provider)) {
    const _0x36cc17 = normalizePolicySizes(_0xd3306a?.allowedSizes);
    if (_0x36cc17.includes(_0x3625a5)) return _0x3625a5;
    return normalizeImageSizeValue(_0xd3306a?.defaultSize) || '2K';
  }
  return '';
}
export function isImageSizeOptionDisabledForProviderModel({
  model: _0x457362,
  provider: provider = '',
  imageSize: imageSize = '',
} = {}) {
  const _0x2d9b91 = normalizeImageSizeValue(imageSize),
    { policy: _0x1fda08 } = getImageSizePolicy(_0x457362, provider),
    _0x27c9fb = getGrsaiNanoBananaSelection(_0x457362, provider, _0x2d9b91 || '2K');
  if (_0x27c9fb) {
    const _0x25b0a6 = normalizeImageSizeValue(_0x1fda08?.fixedSize);
    if (_0x25b0a6) return _0x2d9b91 !== _0x25b0a6;
    return _0x2d9b91 === '4K' && _0x1fda08?.allow4KSelection !== true;
  }
  if (isRhQwenImageEditModel(_0x457362) && _0x2d9b91 === '4K') return true;
  const _0x55510c = normalizePolicySizes(_0x1fda08?.disabledSizes);
  return _0x55510c.includes(_0x2d9b91);
}
export function isGrsaiModelWithoutImageSizeParam(_0xbabf07) {
  const { context: _0x33e4a5, policy: _0x160622 } = getImageSizePolicy(_0xbabf07);
  return _0x33e4a5.provider === 'grsai' && _0x160622?.omitRequestParam === true;
}
export function shouldOmitImageSizeParam(_0x242ac1) {
  return getImageSizePolicy(_0x242ac1).policy?.omitRequestParam === true;
}
export function shouldDisableImageSizeControl(_0x32ce1e, _0x47a977 = '') {
  const _0x3a0975 = normalizeProviderId(_0x47a977);
  if (_0x3a0975 === 'grsai' && isGrsaiModelWithoutImageSizeParam(_0x32ce1e)) return false;
  return shouldOmitImageSizeParam(_0x32ce1e);
}
export function shouldHideImageSizeInMainRatioLabel(_0x21709c, _0x4b3eb3 = '') {
  if (isRhQwenImageEditModel(_0x21709c)) return false;
  const _0x2e715a = normalizeProviderId(_0x4b3eb3),
    { context: _0xae651f, policy: _0x464253 } = getImageSizePolicy(_0x21709c, _0x4b3eb3),
    _0x426067 =
      _0x2e715a === 'runninghubwf' ||
      _0xae651f.executionManifest?.adapterType === 'workflow' ||
      isWorkflowModel(_0x21709c, _0x2e715a),
    _0x415341 =
      _0x2e715a === 'grsai' && _0xae651f.provider === 'grsai' && _0x464253?.omitRequestParam === true;
  if (_0x426067) return true;
  if (_0x415341) return false;
  return _0x464253?.hideInMainRatioLabel === true || _0x464253?.omitRequestParam === true;
}
export function buildMainImageRatioLabel({
  model: _0x3a19fd,
  provider: provider = '',
  aspectRatio: aspectRatio = '自适应',
  imageSize: imageSize = '',
} = {}) {
  const _0x34206b = String(aspectRatio || '自适应').trim() || '自适应',
    { context: _0x9dfae5, policy: _0x3d3227 } = getImageSizePolicy(_0x3a19fd, provider),
    _0xc68fd1 =
      _0x9dfae5.provider === 'grsai' && _0x3d3227?.omitRequestParam === true
        ? normalizeImageSizeValue(_0x3d3227?.defaultLabelSize) || '1K'
        : '2K',
    _0x5123bc = normalizeImageSizeForProviderModel({
      model: _0x3a19fd,
      provider: provider,
      imageSize: imageSize,
    }),
    _0xdd91e2 =
      _0x5123bc ||
      String(imageSize || _0xc68fd1)
        .trim()
        .toUpperCase() ||
      _0xc68fd1;
  if (shouldHideImageSizeInMainRatioLabel(_0x3a19fd, provider)) return _0x34206b;
  return _0x34206b + ' · ' + _0xdd91e2;
}
