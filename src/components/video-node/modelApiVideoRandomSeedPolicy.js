import { resolveRandomSeedModeFromParams } from '../shared/randomSeedPolicy.js';
function getPlainObject(_0x2205f7) {
  return _0x2205f7 && typeof _0x2205f7 === 'object' && !Array['isArray'](_0x2205f7) ? _0x2205f7 : {};
}
export function buildSubmitRandomizedSeedPatch({
  modelManifest: modelManifest = null,
  nodeData: nodeData = {},
  payload: payload = {},
  random: random = Math['random'],
} = {}) {
  const _0x4d9730 = Array['isArray'](modelManifest?.['uiSchema']?.['fields'])
      ? modelManifest['uiSchema']['fields']
      : [],
    _0x351398 = _0x4d9730['filter']((_0x53b40a) => {
      const _0x216468 = String(_0x53b40a?.['id'] || '')['trim']();
      return (
        _0x53b40a?.['randomizeOnSubmit'] === !![] &&
        _0x216468 &&
        String(_0x53b40a?.['variant'] || '') === 'randomSeedRow'
      );
    });
  if (_0x351398['length'] === 0x0) return null;
  let _0x46710c = {
      ...getPlainObject(nodeData?.['generationParams']),
      ...getPlainObject(payload?.['generationParams']),
    },
    _0x549386 = null,
    _0x5f2f36 = ![];
  _0x351398['forEach']((_0x23a61) => {
    const _0x5b2183 = String(_0x23a61?.['id'] || '')['trim'](),
      _0x2b6db7 = String(_0x23a61?.['randomSeedModeField'] || '')['trim'](),
      _0x160d4d = String(_0x23a61?.['randomSeedDefaultMode'] || 'fixed')['trim']() || 'fixed',
      { mode: _0x1b49e9, hasLegacyNumericSeed: _0x3f55a4 } = resolveRandomSeedModeFromParams(_0x46710c, {
        seedField: _0x5b2183,
        modeField: _0x2b6db7,
        defaultMode: _0x160d4d,
      });
    if (_0x1b49e9 !== 'random') {
      _0x3f55a4 &&
        ((_0x46710c = { ..._0x46710c, [_0x2b6db7]: 'fixed' }),
        (_0x549386 = { ...(_0x549386 || _0x46710c), [_0x2b6db7]: 'fixed' }),
        (_0x5f2f36 = !![]));
      return;
    }
    const _0x57ba43 = Number(_0x23a61?.['randomSeedMin'] ?? _0x23a61?.['min']),
      _0x1f3fca = Number(_0x23a61?.['randomSeedMax'] ?? _0x23a61?.['max']),
      _0x47c1c0 = Number['isFinite'](_0x57ba43) ? Math['trunc'](_0x57ba43) : 0x0,
      _0xbf09cc = Number['isFinite'](_0x1f3fca) ? Math['trunc'](_0x1f3fca) : 0x7fffffff,
      _0x22f7e2 = Math['min'](_0x47c1c0, _0xbf09cc),
      _0x11a02f = Math['max'](_0x47c1c0, _0xbf09cc),
      _0x52f556 = String(_0x22f7e2 + Math['floor'](random() * (_0x11a02f - _0x22f7e2 + 0x1)));
    ((_0x46710c = { ..._0x46710c, [_0x5b2183]: _0x52f556, ...(_0x2b6db7 ? { [_0x2b6db7]: 'random' } : {}) }),
      (_0x549386 = {
        ...(_0x549386 || _0x46710c),
        [_0x5b2183]: _0x52f556,
        ...(_0x2b6db7 ? { [_0x2b6db7]: 'fixed' } : {}),
      }),
      (_0x5f2f36 = !![]));
  });
  if (!_0x5f2f36) return null;
  const _0x2db8e5 = String(payload?.['model'] || nodeData?.['model'] || modelManifest?.['modelId'] || '')[
      'trim'
    ](),
    _0x19356f = { generationParams: _0x46710c };
  return (
    _0x2db8e5 &&
      (_0x19356f['generationParamsByModel'] = {
        ...getPlainObject(nodeData?.['generationParamsByModel']),
        [_0x2db8e5]: _0x46710c,
      }),
    { requestParams: _0x549386 || _0x46710c, storePatch: _0x19356f }
  );
}
