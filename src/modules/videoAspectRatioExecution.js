import { isAdaptiveRatioLabel, pickClosestRatioForProviderModel } from '../../api/imageRatioPolicy.js';
function getPlainObject(_0x4e4ebe) {
  return _0x4e4ebe && typeof _0x4e4ebe === 'object' && !Array['isArray'](_0x4e4ebe) ? _0x4e4ebe : {};
}
function isPositiveSize(_0x1cb711, _0x107ba8) {
  return Number(_0x1cb711) > 0x0 && Number(_0x107ba8) > 0x0;
}
export function findVideoAspectRatioField(_0x55c3dc) {
  const _0x5094cc = Array['isArray'](_0x55c3dc?.['uiSchema']?.['fields'])
    ? _0x55c3dc['uiSchema']['fields']
    : [];
  return (
    _0x5094cc['find']((_0x327ce6) => String(_0x327ce6?.['displayRole'] || '')['trim']() === 'aspectRatio') ||
    _0x5094cc['find']((_0x14fe8d) => String(_0x14fe8d?.['id'] || '')['trim']() === 'aspectRatio') ||
    null
  );
}
export function getConcreteVideoAspectRatioOptions(_0x632421) {
  const _0x5a161e = findVideoAspectRatioField(_0x632421),
    _0x38c53c = Array['isArray'](_0x5a161e?.['options']) ? _0x5a161e['options'] : [];
  return _0x38c53c['map']((_0x23c883) => String(_0x23c883?.['value'] ?? _0x23c883 ?? '')['trim']())['filter'](
    (_0x11ccd0) => _0x11ccd0 && _0x11ccd0['includes'](':') && !isAdaptiveRatioLabel(_0x11ccd0),
  );
}
export function resolveVideoAspectRatioInput({
  nodeData: nodeData = {},
  payload: payload = {},
  modelManifest: modelManifest = null,
} = {}) {
  const _0x2b22d0 = getPlainObject(nodeData?.['generationParams']),
    _0x28f8a4 = getPlainObject(payload?.['generationParams']),
    _0x21afa8 = String(findVideoAspectRatioField(modelManifest)?.['id'] || '')['trim'](),
    _0xa16b44 = [];
  _0x21afa8 &&
    _0x21afa8 !== 'aspectRatio' &&
    _0xa16b44['push']([_0x2b22d0, _0x21afa8], [_0x28f8a4, _0x21afa8], [payload, _0x21afa8]);
  _0xa16b44['push'](
    [_0x2b22d0, 'aspectRatio'],
    [nodeData, 'aspectRatio'],
    [_0x28f8a4, 'aspectRatio'],
    [payload, 'aspectRatio'],
  );
  for (const [_0x5dc4b9, _0x5d64f0] of _0xa16b44) {
    if (_0x5d64f0 && Object['prototype']['hasOwnProperty']['call'](_0x5dc4b9 || {}, _0x5d64f0))
      return _0x5dc4b9[_0x5d64f0];
  }
  return findVideoAspectRatioField(modelManifest)?.['defaultValue'] ?? '';
}
export function resolveVideoAdaptiveAspectRatio({
  provider: provider = '',
  model: model = '',
  modelManifest: modelManifest = null,
  displayWidth: displayWidth = 0x0,
  displayHeight: displayHeight = 0x0,
  sourceWidth: sourceWidth = 0x0,
  sourceHeight: sourceHeight = 0x0,
  imageSize: imageSize = '',
} = {}) {
  const _0x22dce8 = getConcreteVideoAspectRatioOptions(modelManifest);
  if (_0x22dce8['length'] <= 0x0) return '';
  if (isPositiveSize(displayWidth, displayHeight))
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: Number(displayWidth),
      height: Number(displayHeight),
      imageSize: imageSize,
    });
  if (isPositiveSize(sourceWidth, sourceHeight))
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: Number(sourceWidth),
      height: Number(sourceHeight),
      imageSize: imageSize,
    });
  return _0x22dce8['includes']('1:1') ? '1:1' : _0x22dce8[0x0];
}
export function applyVideoAdaptiveAspectRatio(_0x1bf2f4, _0x32ecb4 = {}) {
  const _0x3f3edd = _0x32ecb4?.['modelManifest'] || null,
    _0x423f2a = findVideoAspectRatioField(_0x3f3edd);
  if (!_0x423f2a) return _0x1bf2f4;
  const _0x2c6e78 = resolveVideoAspectRatioInput({
    nodeData: _0x32ecb4?.['nodeData'],
    payload: _0x1bf2f4,
    modelManifest: _0x3f3edd,
  });
  if (!isAdaptiveRatioLabel(_0x2c6e78)) return _0x1bf2f4;
  const _0xd59f05 = _0x3f3edd?.['extensions']?.['ratioPolicy'] || _0x3f3edd?.['ratioPolicy'] || {};
  if (_0xd59f05?.['preserveAdaptiveAtSubmit'] === !![]) {
    const _0x53452f = String(_0x423f2a?.['id'] || 'aspectRatio')['trim']();
    return (
      delete _0x1bf2f4['resolvedRatioLabel'],
      (_0x1bf2f4['aspectRatio'] = _0x2c6e78),
      (_0x1bf2f4['generationParams'] = {
        ...getPlainObject(_0x1bf2f4['generationParams']),
        aspectRatio: _0x2c6e78,
        ...(_0x53452f ? { [_0x53452f]: _0x2c6e78 } : {}),
      }),
      _0x53452f && _0x53452f !== 'aspectRatio' && (_0x1bf2f4[_0x53452f] = _0x2c6e78),
      _0x1bf2f4
    );
  }
  const _0x219222 = resolveVideoAdaptiveAspectRatio(_0x32ecb4);
  if (!_0x219222 || isAdaptiveRatioLabel(_0x219222)) return _0x1bf2f4;
  const _0x33ffa3 = String(_0x423f2a?.['id'] || 'aspectRatio')['trim']();
  return (
    (_0x1bf2f4['resolvedRatioLabel'] = _0x219222),
    (_0x1bf2f4['aspectRatio'] = _0x219222),
    (_0x1bf2f4['generationParams'] = {
      ...getPlainObject(_0x1bf2f4['generationParams']),
      aspectRatio: _0x219222,
      ...(_0x33ffa3 ? { [_0x33ffa3]: _0x219222 } : {}),
    }),
    _0x33ffa3 && _0x33ffa3 !== 'aspectRatio' && (_0x1bf2f4[_0x33ffa3] = _0x219222),
    _0x1bf2f4
  );
}
