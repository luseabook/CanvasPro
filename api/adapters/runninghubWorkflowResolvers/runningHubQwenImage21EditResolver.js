const DEFAULT_IMAGE_SIZE = '1K',
  DEFAULT_ASPECT_RATIO = '1:1',
  DEFAULT_LONG_SIDE_BY_IMAGE_SIZE = Object['freeze']({ '1K': 0x400, '1.5K': 0x600, '2K': 0x780 });
function getPlainObject(_0x1bc0f5) {
  return _0x1bc0f5 && typeof _0x1bc0f5 === 'object' && !Array['isArray'](_0x1bc0f5) ? _0x1bc0f5 : {};
}
function getPayloadParam(_0x5c2c2a, _0x35ceb4, _0x883498) {
  const _0x1d735b = getPlainObject(_0x5c2c2a?.['generationParams']);
  if (Object['prototype']['hasOwnProperty']['call'](_0x1d735b, _0x35ceb4)) return _0x1d735b[_0x35ceb4];
  if (Object['prototype']['hasOwnProperty']['call'](_0x5c2c2a || {}, _0x35ceb4)) return _0x5c2c2a[_0x35ceb4];
  return _0x883498;
}
function normalizeBoolean(_0x1b2a5e, _0x862e2e = ![]) {
  if (_0x1b2a5e === undefined || _0x1b2a5e === null || _0x1b2a5e === '') return _0x862e2e;
  const _0x2b74a3 = String(_0x1b2a5e)['trim']()['toLowerCase']();
  return _0x1b2a5e === !![] || ['true', '1', 'yes', 'on']['includes'](_0x2b74a3);
}
function isAdaptiveRatio(_0x4d49e4) {
  const _0x121ca7 = String(_0x4d49e4 || '')
    ['trim']()
    ['toLowerCase']();
  return ['', 'auto', 'adaptive', 'default', '自适应']['includes'](_0x121ca7);
}
function resolveAspectRatio(_0x7cf476, _0x5480b8) {
  const _0x4305f8 = String(
    _0x7cf476?.['resolvedRatioLabel'] || _0x7cf476?.['generationParams']?.['resolvedRatioLabel'] || '',
  )['trim']();
  if (_0x4305f8 && !isAdaptiveRatio(_0x4305f8)) return _0x4305f8;
  const _0x5d25bf = getPayloadParam(
    _0x7cf476,
    'aspectRatio',
    _0x5480b8['defaultAspectRatio'] || DEFAULT_ASPECT_RATIO,
  );
  return isAdaptiveRatio(_0x5d25bf)
    ? _0x5480b8['defaultAspectRatio'] || DEFAULT_ASPECT_RATIO
    : String(_0x5d25bf)['trim']();
}
function parseAspectRatio(_0x29d0c5, _0x1983c2) {
  const _0x2707da = String(_0x29d0c5 || _0x1983c2)['trim'](),
    [_0x4f9b2a, _0x2a6edd] = _0x2707da['split'](':'),
    _0x218455 = Number(_0x4f9b2a),
    _0xd53a8e = Number(_0x2a6edd);
  if (_0x218455 > 0x0 && _0xd53a8e > 0x0) return { widthRatio: _0x218455, heightRatio: _0xd53a8e };
  if (_0x2707da !== _0x1983c2) return parseAspectRatio(_0x1983c2, DEFAULT_ASPECT_RATIO);
  return { widthRatio: 0x1, heightRatio: 0x1 };
}
function roundDimension(_0x4ed8eb, _0x1e2e0a, _0x59efef) {
  return Math['max'](_0x59efef, Math['round'](Number(_0x4ed8eb || 0x0) / _0x1e2e0a) * _0x1e2e0a);
}
export function resolveRunningHubQwenImage21Dimensions(_0x28362f = {}, _0x5e2d0f = {}) {
  const _0x5d9d39 = getPlainObject(_0x5e2d0f['dimensionsNode']),
    _0x187fd1 = getPlainObject(_0x5d9d39['longSideByImageSize']),
    _0x28ef49 = String(
      getPayloadParam(_0x28362f, 'imageSize', _0x5d9d39['defaultImageSize'] || DEFAULT_IMAGE_SIZE),
    )['trim'](),
    _0x25f9f4 =
      Number(_0x187fd1[_0x28ef49]) ||
      Number(DEFAULT_LONG_SIDE_BY_IMAGE_SIZE[_0x28ef49]) ||
      Number(_0x187fd1[_0x5d9d39['defaultImageSize'] || DEFAULT_IMAGE_SIZE]) ||
      DEFAULT_LONG_SIDE_BY_IMAGE_SIZE[DEFAULT_IMAGE_SIZE],
    _0x12e162 = _0x5d9d39['defaultAspectRatio'] || DEFAULT_ASPECT_RATIO,
    { widthRatio: _0x4482a1, heightRatio: _0x3e6297 } = parseAspectRatio(
      resolveAspectRatio(_0x28362f, _0x5d9d39),
      _0x12e162,
    ),
    _0x1cfaf9 = Math['max'](0x1, Number(_0x5d9d39['align']) || 0x20),
    _0x2f337d = Math['max'](_0x1cfaf9, Number(_0x5d9d39['minDimension']) || 0x200),
    _0x3d1f26 = _0x4482a1 >= _0x3e6297,
    _0x3c2b99 = _0x3d1f26 ? _0x25f9f4 : (_0x25f9f4 * _0x4482a1) / _0x3e6297,
    _0x1a3df4 = _0x3d1f26 ? (_0x25f9f4 * _0x3e6297) / _0x4482a1 : _0x25f9f4;
  return {
    width: roundDimension(_0x3c2b99, _0x1cfaf9, _0x2f337d),
    height: roundDimension(_0x1a3df4, _0x1cfaf9, _0x2f337d),
  };
}
export async function resolveRunningHubQwenImage21EditPayload({
  executionManifest: _0x5c8fe8,
  payload: _0x72a6e8,
  finalPrompt: _0x2dd8b4,
  finalUrls: _0xaead5f,
  apiKey: _0x4d5fb7,
  helpers: _0x1db4aa,
}) {
  const _0x454987 = getPlainObject(_0x5c8fe8['mapping']),
    _0x384e6e = (Array['isArray'](_0xaead5f) ? _0xaead5f : [])
      ['map']((_0x22b9eb) => String(_0x22b9eb || '')['trim']())
      ['filter'](Boolean),
    _0x4faf3d = Math['max'](0x0, Number(_0x454987['maxInputImages']) || 0x0);
  if (_0x384e6e['length'] > _0x4faf3d)
    throw new Error('Qwen Image 2.1 最多支持 ' + _0x4faf3d + '\x20张参考图');
  const _0x232b46 = Array['isArray'](_0x454987['imageLoaderNodes']) ? _0x454987['imageLoaderNodes'] : [],
    _0x256240 = Array['isArray'](_0x454987['conditioningImageNodes'])
      ? _0x454987['conditioningImageNodes']
      : [];
  if (_0x232b46['length'] < _0x4faf3d || _0x256240['length'] < _0x4faf3d)
    throw new Error('Qwen Image 2.1 工作流图片节点映射不完整');
  const _0x20fe09 = [];
  _0x384e6e['forEach']((_0x1f342f, _0x4aed90) => {
    _0x1db4aa['pushManifestNode'](_0x20fe09, _0x232b46[_0x4aed90], _0x1f342f);
  });
  for (let _0x20ec9b = _0x384e6e['length']; _0x20ec9b < _0x4faf3d; _0x20ec9b += 0x1) {
    _0x1db4aa['pushManifestNode'](_0x20fe09, _0x256240[_0x20ec9b], null);
  }
  const _0x4b0799 = String(_0x2dd8b4 || '')['replace'](/@(?:图片|图像)(\d+)/gu, '<image$1>');
  _0x1db4aa['pushManifestNode'](_0x20fe09, _0x454987['promptNode'], _0x4b0799);
  const _0x35891a = resolveRunningHubQwenImage21Dimensions(_0x72a6e8, _0x454987);
  (_0x1db4aa['pushManifestNode'](_0x20fe09, _0x454987['dimensionsNode']?.['widthNode'], _0x35891a['width']),
    _0x1db4aa['pushManifestNode'](
      _0x20fe09,
      _0x454987['dimensionsNode']?.['heightNode'],
      _0x35891a['height'],
    ),
    _0x1db4aa['pushManifestNode'](
      _0x20fe09,
      _0x454987['promptEnhanceNode'],
      normalizeBoolean(
        getPayloadParam(
          _0x72a6e8,
          _0x454987['promptEnhanceNode']?.['field'],
          _0x454987['promptEnhanceNode']?.['defaultValue'] ?? ![],
        ),
        ![],
      ),
    ));
  const _0x4fe88c = _0x384e6e['length'] > 0x0;
  return (
    _0x1db4aa['pushManifestNode'](_0x20fe09, _0x454987['hasImageNode'], _0x4fe88c),
    _0x1db4aa['pushManifestNode'](_0x20fe09, _0x454987['latentSwitchNode'], !_0x4fe88c),
    _0x1db4aa['buildTaskCreateVideoWorkflowRequest']({
      executionManifest: _0x5c8fe8,
      payload: _0x72a6e8,
      apiKey: _0x4d5fb7,
      nodeInfoList: _0x20fe09,
    })
  );
}
