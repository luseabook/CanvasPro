function hasOwnManifestValue(_0x374b8e, _0x4299af) {
  return Object['prototype']['hasOwnProperty']['call'](_0x374b8e || {}, _0x4299af);
}
function isPresentManifestValue(_0x4d5c42) {
  if (_0x4d5c42 === undefined || _0x4d5c42 === null) return ![];
  if (typeof _0x4d5c42 === 'string') return _0x4d5c42['trim']() !== '';
  if (Array['isArray'](_0x4d5c42)) return _0x4d5c42['length'] > 0x0;
  return !![];
}
export function getComfyUiPayloadPathValue(_0x36a5bc = {}, _0x401a98 = '') {
  const _0x3ff83d = String(_0x401a98 || '')['trim']();
  if (!_0x3ff83d) return undefined;
  return _0x3ff83d['split']('.')['reduce']((_0x179d80, _0x3c4d7e) => {
    if (_0x179d80 === undefined || _0x179d80 === null) return undefined;
    return _0x179d80[_0x3c4d7e];
  }, _0x36a5bc);
}
function resolveManifestPayloadValue(
  _0x174148,
  _0x2c664a = [],
  _0x3ef627 = undefined,
  { allowEmpty: allowEmpty = ![] } = {},
) {
  const _0x3b596f = Array['isArray'](_0x2c664a) ? _0x2c664a : [_0x2c664a];
  for (const _0x18d041 of _0x3b596f['filter'](Boolean)) {
    const _0x269d9d = getComfyUiPayloadPathValue(_0x174148, _0x18d041);
    if (allowEmpty && _0x269d9d !== undefined && _0x269d9d !== null) return _0x269d9d;
    if (isPresentManifestValue(_0x269d9d)) return _0x269d9d;
  }
  return _0x3ef627;
}
function normalizeManifestFieldList(_0x527d24, _0x2fe1a5 = '') {
  const _0xab6d91 = _0x527d24?.['fields'] !== undefined ? _0x527d24['fields'] : _0x527d24?.['field'],
    _0xc0e7d = Array['isArray'](_0xab6d91) ? _0xab6d91 : [_0xab6d91 || _0x2fe1a5];
  return _0xc0e7d['map']((_0x524eca) => String(_0x524eca || '')['trim']())['filter'](Boolean);
}
function manifestValuesEqual(_0x3b91e0, _0x1e4201) {
  if (typeof _0x1e4201 === 'boolean') {
    const _0x5f0286 = String(_0x3b91e0 ?? '')
      ['trim']()
      ['toLowerCase']();
    return _0x3b91e0 === _0x1e4201 || _0x5f0286 === String(_0x1e4201);
  }
  if (typeof _0x1e4201 === 'number') return Number(_0x3b91e0) === _0x1e4201;
  return String(_0x3b91e0 ?? '')['trim']() === String(_0x1e4201 ?? '')['trim']();
}
function evaluateManifestWhenRule(_0x21bd19, _0x22a53d) {
  if (!_0x21bd19 || typeof _0x21bd19 !== 'object') return !![];
  const _0x5bdf63 = _0x21bd19['field']
      ? getComfyUiPayloadPathValue(_0x22a53d, _0x21bd19['field'])
      : undefined,
    _0x4786e3 = isPresentManifestValue(_0x5bdf63);
  if (hasOwnManifestValue(_0x21bd19, 'exists') && Boolean(_0x21bd19['exists']) !== _0x4786e3) return ![];
  if (_0x21bd19['truthy'] === !![] && !Boolean(_0x5bdf63)) return ![];
  if (_0x21bd19['falsy'] === !![] && Boolean(_0x5bdf63)) return ![];
  if (hasOwnManifestValue(_0x21bd19, 'equals') && !manifestValuesEqual(_0x5bdf63, _0x21bd19['equals']))
    return ![];
  if (hasOwnManifestValue(_0x21bd19, 'notEquals') && manifestValuesEqual(_0x5bdf63, _0x21bd19['notEquals']))
    return ![];
  if (
    Array['isArray'](_0x21bd19['in']) &&
    !_0x21bd19['in']['some']((_0x689dd1) => manifestValuesEqual(_0x5bdf63, _0x689dd1))
  )
    return ![];
  if (
    Array['isArray'](_0x21bd19['notIn']) &&
    _0x21bd19['notIn']['some']((_0x474bb1) => manifestValuesEqual(_0x5bdf63, _0x474bb1))
  )
    return ![];
  return !![];
}
function shouldUseManifestInputMapping(_0x4e004c, _0x394ff3) {
  const _0x522497 = _0x4e004c?.['when'];
  if (_0x522497 === undefined || _0x522497 === null) return !![];
  if (Array['isArray'](_0x522497))
    return _0x522497['every']((_0x3a6860) => evaluateManifestWhenRule(_0x3a6860, _0x394ff3));
  return evaluateManifestWhenRule(_0x522497, _0x394ff3);
}
function applyManifestInputValueMap(_0x22b8b9, _0x3fe024 = {}) {
  const _0x4e0b7b = _0x3fe024['valueMap'] || _0x3fe024['values'] || {},
    _0x346409 = String(_0x22b8b9 ?? '')['trim']();
  if (_0x346409 && _0x4e0b7b[_0x346409] !== undefined) return _0x4e0b7b[_0x346409];
  const _0x34cf18 = _0x346409['toLowerCase']();
  if (_0x346409 && _0x4e0b7b[_0x34cf18] !== undefined) return _0x4e0b7b[_0x34cf18];
  return _0x22b8b9;
}
function normalizeManifestTransformSpec(_0x19e468) {
  if (!_0x19e468) return { name: '' };
  if (typeof _0x19e468 === 'string') return { name: _0x19e468 };
  if (typeof _0x19e468 === 'object' && !Array['isArray'](_0x19e468))
    return { ..._0x19e468, name: String(_0x19e468['name'] || '')['trim']() };
  return { name: '' };
}
function clampManifestNumber(_0x5d1a16, _0x180fa2) {
  let _0x4da624 = _0x5d1a16;
  if (Number['isFinite'](Number(_0x180fa2['min'])))
    _0x4da624 = Math['max'](Number(_0x180fa2['min']), _0x4da624);
  if (Number['isFinite'](Number(_0x180fa2['max'])))
    _0x4da624 = Math['min'](Number(_0x180fa2['max']), _0x4da624);
  return _0x4da624;
}
function applyManifestInputTransform(_0x112b6e, _0x22a992 = {}, _0x452fe3 = {}) {
  const _0x5f49a7 = normalizeManifestTransformSpec(_0x22a992['transform']),
    _0x1790fa = _0x452fe3[_0x5f49a7['name']];
  if (typeof _0x1790fa === 'function') return _0x1790fa(_0x112b6e, _0x5f49a7, _0x22a992);
  switch (_0x5f49a7['name']) {
    case '':
      return _0x112b6e;
    case 'trim':
      return String(_0x112b6e ?? '')['trim']();
    case 'string':
      return String(_0x112b6e ?? '');
    case 'boolean':
      return (
        _0x112b6e === !![] ||
        ['true', '1', 'yes', 'on']['includes'](
          String(_0x112b6e ?? '')
            ['trim']()
            ['toLowerCase'](),
        )
      );
    case 'booleanString':
      return _0x112b6e === !![] ||
        ['true', '1', 'yes', 'on']['includes'](
          String(_0x112b6e ?? '')
            ['trim']()
            ['toLowerCase'](),
        )
        ? 'true'
        : 'false';
    case 'integer': {
      const _0x30bdcc = Number(_0x112b6e),
        _0x58fe23 = Number(_0x5f49a7['defaultValue'] ?? _0x22a992['defaultValue'] ?? 0x0),
        _0x2ab40c = Number['isFinite'](_0x30bdcc)
          ? Math['trunc'](_0x30bdcc)
          : Number['isFinite'](_0x58fe23)
            ? Math['trunc'](_0x58fe23)
            : 0x0;
      return clampManifestNumber(_0x2ab40c, _0x5f49a7);
    }
    case 'number': {
      const _0x188de0 = Number(_0x112b6e),
        _0x16ca62 = Number(_0x5f49a7['defaultValue'] ?? _0x22a992['defaultValue'] ?? 0x0),
        _0x2e4011 = Number['isFinite'](_0x188de0)
          ? _0x188de0
          : Number['isFinite'](_0x16ca62)
            ? _0x16ca62
            : 0x0;
      return clampManifestNumber(_0x2e4011, _0x5f49a7);
    }
    default:
      throw new Error('Unsupported ComfyUI workflow transform: ' + _0x5f49a7['name']);
  }
}
async function resolveComfyUiManifestInputValue({
  item: _0xae8a3b,
  payload: _0x1a4ca7,
  finalPrompt: _0x4c1b97,
  sourceResolvers: sourceResolvers = {},
}) {
  const _0x5e52bc = String(_0xae8a3b?.['source'] || 'param')['trim']();
  if (_0x5e52bc === 'constant')
    return hasOwnManifestValue(_0xae8a3b, 'value') ? _0xae8a3b['value'] : _0xae8a3b['defaultValue'];
  if (_0x5e52bc === 'prompt') {
    const _0x42dbd6 = resolveManifestPayloadValue(_0x1a4ca7, normalizeManifestFieldList(_0xae8a3b), '', {
      allowEmpty: _0xae8a3b?.['allowEmpty'] === !![],
    });
    return isPresentManifestValue(_0x42dbd6) || _0xae8a3b?.['allowEmpty'] === !![] ? _0x42dbd6 : _0x4c1b97;
  }
  if (_0x5e52bc === 'param') {
    const _0x57d2f6 = normalizeManifestFieldList(_0xae8a3b),
      _0x3a705c = resolveManifestPayloadValue(_0x1a4ca7, _0x57d2f6, undefined, {
        allowEmpty: _0xae8a3b?.['allowEmpty'] === !![],
      });
    if (isPresentManifestValue(_0x3a705c) || _0xae8a3b?.['allowEmpty'] === !![]) return _0x3a705c;
    const _0x4bdbe4 = _0x57d2f6['filter']((_0x46eacf) => !_0x46eacf['startsWith']('generationParams.'))[
      'map'
    ]((_0xec0764) => 'generationParams.' + _0xec0764);
    return resolveManifestPayloadValue(_0x1a4ca7, _0x4bdbe4, undefined, {
      allowEmpty: _0xae8a3b?.['allowEmpty'] === !![],
    });
  }
  const _0x3c5bf5 = sourceResolvers[_0x5e52bc];
  if (typeof _0x3c5bf5 === 'function')
    return _0x3c5bf5({ item: _0xae8a3b, payload: _0x1a4ca7, finalPrompt: _0x4c1b97 });
  throw new Error('Unsupported ComfyUI workflow mapping source: ' + _0x5e52bc);
}
function cloneWorkflowGraph(_0x5cf894) {
  if (!_0x5cf894 || typeof _0x5cf894 !== 'object' || Array['isArray'](_0x5cf894))
    throw new Error('ComfyUI workflow mapping missing workflow graph');
  return JSON['parse'](JSON['stringify'](_0x5cf894));
}
function setComfyUiNodeInput(_0x19396c, _0x31feb5, _0x490263) {
  const _0x554b91 = String(_0x31feb5?.['nodeId'] || '')['trim'](),
    _0xeabfc1 = String(_0x31feb5?.['inputName'] || _0x31feb5?.['fieldName'] || '')['trim']();
  if (!_0x554b91 || !_0xeabfc1) return ![];
  const _0x1c1228 = _0x19396c[_0x554b91];
  if (!_0x1c1228 || typeof _0x1c1228 !== 'object' || Array['isArray'](_0x1c1228)) {
    if (_0x31feb5?.['required'])
      throw new Error(_0x31feb5['missingMessage'] || 'Missing ComfyUI workflow node: ' + _0x554b91);
    return ![];
  }
  return (
    (!_0x1c1228['inputs'] ||
      typeof _0x1c1228['inputs'] !== 'object' ||
      Array['isArray'](_0x1c1228['inputs'])) &&
      (_0x1c1228['inputs'] = {}),
    (_0x1c1228['inputs'][_0xeabfc1] = _0x490263),
    !![]
  );
}
export async function buildComfyUiPromptFromManifest({
  mapping: _0x2ae5c1,
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  sourceResolvers: sourceResolvers = {},
  transforms: transforms = {},
} = {}) {
  const _0x5758da = cloneWorkflowGraph(_0x2ae5c1?.['workflow'] || _0x2ae5c1?.['prompt']),
    _0x41d1c4 = Array['isArray'](_0x2ae5c1?.['inputs'])
      ? _0x2ae5c1['inputs']
      : Array['isArray'](_0x2ae5c1?.['nodeInputs'])
        ? _0x2ae5c1['nodeInputs']
        : [];
  for (const _0x42be0b of _0x41d1c4) {
    if (!_0x42be0b?.['nodeId'] || !(_0x42be0b?.['inputName'] || _0x42be0b?.['fieldName'])) continue;
    if (!shouldUseManifestInputMapping(_0x42be0b, payload)) continue;
    const _0x3d08e3 = await resolveComfyUiManifestInputValue({
        item: _0x42be0b,
        payload: payload,
        finalPrompt: finalPrompt,
        sourceResolvers: sourceResolvers,
      }),
      _0x28da34 = _0x42be0b?.['allowEmpty'] === !![],
      _0x3aafbd = _0x42be0b?.['includeEmpty'] === !![] || _0x28da34,
      _0x4c55f4 = hasOwnManifestValue(_0x42be0b, 'defaultValue');
    let _0x3b97a7 = _0x3d08e3;
    !isPresentManifestValue(_0x3b97a7) &&
      _0x4c55f4 &&
      !(_0x28da34 && _0x3b97a7 !== undefined && _0x3b97a7 !== null) &&
      (_0x3b97a7 = _0x42be0b['defaultValue']);
    if (!isPresentManifestValue(_0x3b97a7)) {
      if (_0x3aafbd) _0x3b97a7 = '';
      else {
        if (_0x42be0b['required'])
          throw new Error(
            _0x42be0b['missingMessage'] ||
              'Missing ComfyUI workflow input: ' +
                _0x42be0b['nodeId'] +
                '.' +
                (_0x42be0b['inputName'] || _0x42be0b['fieldName']),
          );
        else continue;
      }
    }
    ((_0x3b97a7 = applyManifestInputValueMap(_0x3b97a7, _0x42be0b)),
      (_0x3b97a7 = applyManifestInputTransform(_0x3b97a7, _0x42be0b, transforms)));
    if (!isPresentManifestValue(_0x3b97a7) && _0x42be0b['required'] && !_0x3aafbd)
      throw new Error(
        _0x42be0b['missingMessage'] ||
          'Missing ComfyUI workflow input: ' +
            _0x42be0b['nodeId'] +
            '.' +
            (_0x42be0b['inputName'] || _0x42be0b['fieldName']),
      );
    if (!isPresentManifestValue(_0x3b97a7) && !_0x3aafbd) continue;
    setComfyUiNodeInput(_0x5758da, _0x42be0b, _0x3b97a7);
  }
  return _0x5758da;
}
