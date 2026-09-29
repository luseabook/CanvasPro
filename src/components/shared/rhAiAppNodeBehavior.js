import { GENERATION_MANUAL_DISPLAY_SIZE_FIELD } from './generationDisplayPolicy.js';
import { getModelManifest, resolveModelExecution } from '../../manifests/index.js';
export const RH_AI_APP_PERSISTENT_ADVANCED_CLASS = 'is-rh-ai-app-persistent';
export const RH_AI_APP_RESULT_RATIO_KEY = 'rhAiAppResultRatioKey';
export function isRunningHubCustomAiAppManifest(_0x533db1) {
  return Boolean(_0x533db1?.['extensions']?.['rhAiApp']);
}
export function isComfyUiWorkflowManifest(_0x59376c) {
  return Boolean(_0x59376c?.['extensions']?.['comfyUiWorkflow']);
}
export function isCustomAiAppManifest(_0x2762bb) {
  return Boolean(isRunningHubCustomAiAppManifest(_0x2762bb) || isComfyUiWorkflowManifest(_0x2762bb));
}
export function isRunningHubAiAppManifest(_0x1d9f43) {
  return isCustomAiAppManifest(_0x1d9f43);
}
export function shouldAllowEmptyCustomAiAppInputs(_0x5bb457) {
  return isCustomAiAppManifest(_0x5bb457);
}
function findBundleModelManifest(_0x123eac, _0x26bf5e = '', _0x2f17c0 = '') {
  const _0x57d418 = Array['isArray'](_0x123eac?.['models']) ? _0x123eac['models'] : [];
  if (!_0x57d418['length']) return null;
  const _0x127f0b = String(_0x26bf5e || '')['trim'](),
    _0x232f02 = String(_0x2f17c0 || '')
      ['trim']()
      ['toLowerCase']();
  return (
    _0x57d418['find']((_0x49fb01) => String(_0x49fb01?.['modelId'] || '')['trim']() === _0x127f0b) ||
    _0x57d418['find']((_0x4c69cd) => {
      return (
        (!_0x232f02 ||
          String(_0x4c69cd?.['provider'] || '')
            ['trim']()
            ['toLowerCase']() === _0x232f02) &&
        isCustomAiAppManifest(_0x4c69cd)
      );
    }) ||
    null
  );
}
export function resolveCustomAiAppNodeManifest(_0x23d1b9 = {}, _0x2f3908 = {}) {
  const _0x13c3ad = String(
      _0x2f3908['model'] || _0x23d1b9?.['model'] || _0x23d1b9?.['audioWorkflowKey'] || '',
    )['trim'](),
    _0x2d9526 = _0x2f3908['provider'] ?? _0x23d1b9?.['provider'],
    _0x419551 =
      (_0x13c3ad ? resolveModelExecution(_0x13c3ad, { providerHint: _0x2d9526 }) : null) ||
      (_0x13c3ad ? resolveModelExecution(_0x13c3ad) : null),
    _0x374b2a = _0x419551?.['modelManifest'] || (_0x13c3ad ? getModelManifest(_0x13c3ad) : null) || null;
  if (isCustomAiAppManifest(_0x374b2a)) return _0x374b2a;
  const _0x4aa52d =
      _0x2f3908['bundle'] ||
      _0x23d1b9?.['rhAiAppManifestBundle'] ||
      _0x23d1b9?.['customAiAppManifestBundle'] ||
      null,
    _0x4cb33f = findBundleModelManifest(_0x4aa52d, _0x13c3ad, _0x2d9526);
  return isCustomAiAppManifest(_0x4cb33f) ? _0x4cb33f : null;
}
function normalizePositiveNumber(_0x369516) {
  const _0x4d5be0 = Number(_0x369516);
  return Number['isFinite'](_0x4d5be0) && _0x4d5be0 > 0x0 ? _0x4d5be0 : 0x0;
}
function scaleByShortSide(_0x2df992, _0x14c497, _0x5bedb7) {
  const _0x9bca0d = normalizePositiveNumber(_0x2df992) || 0x1,
    _0x1367e4 = normalizePositiveNumber(_0x14c497) || 0x1,
    _0x4469b2 = Math['max'](0x1, Math['round'](Number(_0x5bedb7) || 0x120)),
    _0xb3663e = _0x4469b2 / Math['min'](_0x9bca0d, _0x1367e4);
  return {
    width: Math['max'](0x1, Math['round'](_0x9bca0d * _0xb3663e)),
    height: Math['max'](0x1, Math['round'](_0x1367e4 * _0xb3663e)),
  };
}
export function buildRhAiAppResultDisplayPatch({
  nodeData: nodeData = {},
  mediaWidth: mediaWidth = 0x0,
  mediaHeight: mediaHeight = 0x0,
  mediaKey: mediaKey = '',
  shortSide: shortSide = 0x120,
} = {}) {
  const _0x2e97a7 = normalizePositiveNumber(mediaWidth),
    _0xee2a0 = normalizePositiveNumber(mediaHeight);
  if (!(_0x2e97a7 > 0x0 && _0xee2a0 > 0x0)) return {};
  const _0xbb3c58 = [String(mediaKey || '')['trim'](), Math['round'](_0x2e97a7), Math['round'](_0xee2a0)]
    ['filter'](Boolean)
    ['join']('|');
  if (_0xbb3c58 && String(nodeData?.[RH_AI_APP_RESULT_RATIO_KEY] || '') === _0xbb3c58) return {};
  const _0x368aeb = scaleByShortSide(_0x2e97a7, _0xee2a0, shortSide),
    _0x190062 = Math['max'](0x1, Math['round'](Number(nodeData?.['width']) || shortSide)),
    _0x17e94e = Math['max'](0x1, Math['round'](Number(nodeData?.['height']) || shortSide)),
    _0x59fe45 = Number['isFinite'](Number(nodeData?.['x'])) ? Number(nodeData['x']) : 0x0,
    _0x3f8132 = Number['isFinite'](Number(nodeData?.['y'])) ? Number(nodeData['y']) : 0x0;
  return {
    width: _0x368aeb['width'],
    height: _0x368aeb['height'],
    x: Math['round'](_0x59fe45 - (_0x368aeb['width'] - _0x190062) / 0x2),
    y: Math['round'](_0x3f8132 - (_0x368aeb['height'] - _0x17e94e)),
    [RH_AI_APP_RESULT_RATIO_KEY]: _0xbb3c58,
    [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: ![],
  };
}
