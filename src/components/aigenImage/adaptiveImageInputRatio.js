import { getGenerationRatioMediaSize } from '../../modules/generationRatioSource.js';
import {
  getTargetInputPolicy,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from '../../modules/modelInputPolicy.js';
function isAdaptiveRatioValue(_0x353f73) {
  const _0x31f6d0 = String(_0x353f73 || '').trim(),
    _0x4aea23 = _0x31f6d0.toLowerCase();
  return !_0x31f6d0 || _0x31f6d0 === '自适应' || _0x4aea23 === 'auto' || _0x4aea23 === 'adaptive';
}
function getNodeAspectRatioValue(_0x13be90 = {}) {
  const _0x516339 = _0x13be90?.generationParams;
  return _0x516339 &&
    typeof _0x516339 === 'object' &&
    !Array.isArray(_0x516339) &&
    Object.prototype.hasOwnProperty.call(_0x516339, 'aspectRatio')
    ? _0x516339.aspectRatio
    : _0x13be90?.aspectRatio;
}
function buildAdaptiveImageInputSignature(_0x2c73a7 = [], _0x380b80 = {}, _0x3482f8 = {}) {
  return _0x2c73a7
    .map((_0x2d04fd) => {
      const _0x29536d = String(_0x2d04fd?.refSlot || '').toLowerCase();
      if (_0x29536d.includes('mask')) return '';
      const _0x269d41 = _0x380b80?.[_0x2d04fd?.sourceId] || null,
        _0x16c9d5 = resolveEffectiveInputKind(_0x269d41, _0x2d04fd);
      if (_0x16c9d5 !== 'image' || !isInputKindAllowed(_0x3482f8, _0x16c9d5)) return '';
      const _0x5434cb = getGenerationRatioMediaSize(_0x269d41, _0x2d04fd, { includeNodeFrame: true });
      return [
        _0x2d04fd?.id,
        _0x2d04fd?.sourceId,
        _0x2d04fd?.refSlot,
        _0x269d41?._bizRev,
        _0x269d41?.thumbId,
        _0x5434cb?.width,
        _0x5434cb?.height,
        _0x269d41?.localPath,
        _0x269d41?.imageUrl,
        _0x269d41?.sourceUrl,
      ]
        .map((_0x8e7ec0) => _0x8e7ec0 || '')
        .join(':');
    })
    .filter(Boolean)
    .join('|');
}
export function syncAdaptiveImageInputRatio(
  _0x2c452c,
  {
    store: _0x35ed3f,
    nodeId: _0x42e77f,
    inEdges: _0x19ec03,
    nodes: _0x850b79,
    targetNodeData: _0x36ba00,
  } = {},
) {
  if (!_0x2c452c || !_0x35ed3f || !_0x42e77f) return;
  const _0x17d756 = getTargetInputPolicy(_0x36ba00 || {}),
    _0x46cc13 = buildAdaptiveImageInputSignature(_0x19ec03 || [], _0x850b79 || {}, _0x17d756),
    _0x1ab812 =
      (_0x2c452c._lastAdaptiveInputSig !== undefined
        ? _0x2c452c._lastAdaptiveInputSig !== _0x46cc13
        : Boolean(_0x46cc13)) && isAdaptiveRatioValue(getNodeAspectRatioValue(_0x36ba00) || '自适应');
  _0x2c452c._lastAdaptiveInputSig = _0x46cc13;
  if (!_0x1ab812 || typeof _0x2c452c.runAdaptiveRatio !== 'function') return;
  setTimeout(() => {
    if (_0x35ed3f.getState().nodes[_0x42e77f]) _0x2c452c.runAdaptiveRatio();
  }, 50);
}
