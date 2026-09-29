import { translateMinimaxH3EditorAssetMentions } from './minimaxH3Prompt.js';
function hasOwnManifestValue(_0x467600, _0x426969) {
  return Object['prototype']['hasOwnProperty']['call'](_0x467600 || {}, _0x426969);
}
function isPresentManifestValue(_0x232f9c) {
  if (_0x232f9c === undefined || _0x232f9c === null) return ![];
  if (typeof _0x232f9c === 'string') return _0x232f9c['trim']() !== '';
  if (Array['isArray'](_0x232f9c)) return _0x232f9c['length'] > 0x0;
  return !![];
}
function getManifestPayloadPathValue(_0x342309 = {}, _0x2c1c9f = '') {
  const _0x37a152 = String(_0x2c1c9f || '')['trim']();
  if (!_0x37a152) return undefined;
  return _0x37a152['split']('.')['reduce']((_0x1bc724, _0x699787) => {
    if (_0x1bc724 === undefined || _0x1bc724 === null) return undefined;
    return _0x1bc724[_0x699787];
  }, _0x342309);
}
function resolveManifestPayloadValue(
  _0x1bc52b,
  _0x4d1745 = [],
  _0x4285c3 = undefined,
  { allowEmpty: allowEmpty = ![] } = {},
) {
  const _0xca96d3 = Array['isArray'](_0x4d1745) ? _0x4d1745 : [_0x4d1745];
  for (const _0x304d18 of _0xca96d3['filter'](Boolean)) {
    const _0xdbbd1b = getManifestPayloadPathValue(_0x1bc52b, _0x304d18);
    if (allowEmpty && _0xdbbd1b !== undefined && _0xdbbd1b !== null) return _0xdbbd1b;
    if (isPresentManifestValue(_0xdbbd1b)) return _0xdbbd1b;
  }
  return _0x4285c3;
}
function normalizeManifestFieldList(_0x562fa9, _0x46f740 = '') {
  const _0x45dc18 = _0x562fa9?.['fields'] !== undefined ? _0x562fa9['fields'] : _0x562fa9?.['field'],
    _0x514afc = Array['isArray'](_0x45dc18) ? _0x45dc18 : [_0x45dc18 || _0x46f740];
  return _0x514afc['map']((_0x15c0f9) => String(_0x15c0f9 || '')['trim']())['filter'](Boolean);
}
function manifestValuesEqual(_0x554df2, _0x223a75) {
  if (typeof _0x223a75 === 'boolean') {
    const _0x136d6b = String(_0x554df2 ?? '')
      ['trim']()
      ['toLowerCase']();
    return _0x554df2 === _0x223a75 || _0x136d6b === String(_0x223a75);
  }
  if (typeof _0x223a75 === 'number') return Number(_0x554df2) === _0x223a75;
  return String(_0x554df2 ?? '')['trim']() === String(_0x223a75 ?? '')['trim']();
}
function evaluateManifestWhenRule(_0x3d0882, _0x5cdb6d) {
  if (!_0x3d0882 || typeof _0x3d0882 !== 'object') return !![];
  const _0x3dc6d0 = _0x3d0882['field']
      ? getManifestPayloadPathValue(_0x5cdb6d, _0x3d0882['field'])
      : undefined,
    _0x5a04c1 = isPresentManifestValue(_0x3dc6d0);
  if (hasOwnManifestValue(_0x3d0882, 'exists') && Boolean(_0x3d0882['exists']) !== _0x5a04c1) return ![];
  if (_0x3d0882['truthy'] === !![] && !Boolean(_0x3dc6d0)) return ![];
  if (_0x3d0882['falsy'] === !![] && Boolean(_0x3dc6d0)) return ![];
  if (hasOwnManifestValue(_0x3d0882, 'equals') && !manifestValuesEqual(_0x3dc6d0, _0x3d0882['equals']))
    return ![];
  if (hasOwnManifestValue(_0x3d0882, 'notEquals') && manifestValuesEqual(_0x3dc6d0, _0x3d0882['notEquals']))
    return ![];
  if (
    Array['isArray'](_0x3d0882['in']) &&
    !_0x3d0882['in']['some']((_0x257c6c) => manifestValuesEqual(_0x3dc6d0, _0x257c6c))
  )
    return ![];
  if (
    Array['isArray'](_0x3d0882['notIn']) &&
    _0x3d0882['notIn']['some']((_0xcab9b7) => manifestValuesEqual(_0x3dc6d0, _0xcab9b7))
  )
    return ![];
  return !![];
}
function shouldUseManifestNodeMapping(_0xc5cef5, _0x15f262) {
  const _0x3d2149 = _0xc5cef5?.['when'];
  if (_0x3d2149 === undefined || _0x3d2149 === null) return !![];
  if (Array['isArray'](_0x3d2149))
    return _0x3d2149['every']((_0x597b9a) => evaluateManifestWhenRule(_0x597b9a, _0x15f262));
  return evaluateManifestWhenRule(_0x3d2149, _0x15f262);
}
function applyManifestNodeValueMap(_0x3c0dfd, _0x3237ca = {}) {
  const _0x29d887 = _0x3237ca['valueMap'] || _0x3237ca['values'] || {},
    _0x2ec204 = String(_0x3c0dfd ?? '')['trim']();
  if (_0x2ec204 && _0x29d887[_0x2ec204] !== undefined) return _0x29d887[_0x2ec204];
  const _0xac6f91 = _0x2ec204['toLowerCase']();
  if (_0x2ec204 && _0x29d887[_0xac6f91] !== undefined) return _0x29d887[_0xac6f91];
  return _0x3c0dfd;
}
function normalizeManifestTransformSpec(_0x59e1a8) {
  if (!_0x59e1a8) return { name: '' };
  if (typeof _0x59e1a8 === 'string') return { name: _0x59e1a8 };
  if (typeof _0x59e1a8 === 'object' && !Array['isArray'](_0x59e1a8))
    return { ..._0x59e1a8, name: String(_0x59e1a8['name'] || '')['trim']() };
  return { name: '' };
}
function clampManifestNumber(_0x1390f0, _0x50becd) {
  let _0x5d1f7b = _0x1390f0;
  if (Number['isFinite'](Number(_0x50becd['min'])))
    _0x5d1f7b = Math['max'](Number(_0x50becd['min']), _0x5d1f7b);
  if (Number['isFinite'](Number(_0x50becd['max'])))
    _0x5d1f7b = Math['min'](Number(_0x50becd['max']), _0x5d1f7b);
  return _0x5d1f7b;
}
function applyManifestNodeTransform(_0x48e4ee, _0xbad245 = {}, _0x8576b4 = {}) {
  const _0x18252b = normalizeManifestTransformSpec(_0xbad245['transform']),
    _0x44feef = _0x8576b4[_0x18252b['name']];
  if (typeof _0x44feef === 'function') return _0x44feef(_0x48e4ee, _0x18252b, _0xbad245);
  switch (_0x18252b['name']) {
    case '':
      return _0x48e4ee;
    case 'trim':
      return String(_0x48e4ee ?? '')['trim']();
    case 'string':
      return String(_0x48e4ee ?? '');
    case 'minimaxH3AssetMentions':
      return translateMinimaxH3EditorAssetMentions(_0x48e4ee);
    case 'boolean':
    case 'booleanString': {
      const _0x528079 = String(_0x48e4ee ?? '')
        ['trim']()
        ['toLowerCase']();
      return _0x48e4ee === !![] ||
        _0x528079 === 'true' ||
        _0x528079 === '1' ||
        _0x528079 === 'yes' ||
        _0x528079 === 'on'
        ? 'true'
        : 'false';
    }
    case 'integer': {
      const _0x52cf5b = Number(_0x48e4ee),
        _0x2661b1 = Number(_0x18252b['defaultValue'] ?? _0xbad245['defaultValue'] ?? 0x0),
        _0x3dd2cc = Number['isFinite'](_0x52cf5b)
          ? Math['trunc'](_0x52cf5b)
          : Number['isFinite'](_0x2661b1)
            ? Math['trunc'](_0x2661b1)
            : 0x0;
      return clampManifestNumber(_0x3dd2cc, _0x18252b);
    }
    case 'number': {
      const _0x4bd016 = Number(_0x48e4ee),
        _0x24cdea = Number(_0x18252b['defaultValue'] ?? _0xbad245['defaultValue'] ?? 0x0),
        _0x2b08c0 = Number['isFinite'](_0x4bd016)
          ? _0x4bd016
          : Number['isFinite'](_0x24cdea)
            ? _0x24cdea
            : 0x0;
      return clampManifestNumber(_0x2b08c0, _0x18252b);
    }
    default:
      throw new Error('Unsupported RunningHub workflow transform: ' + _0x18252b['name']);
  }
}
async function resolveRunningHubManifestNodeValue({
  item: _0x14e9a2,
  payload: _0x369a1a,
  finalPrompt: _0x374c00,
  sourceResolvers: sourceResolvers = {},
}) {
  const _0x4268e4 = String(_0x14e9a2?.['source'] || 'param')['trim']();
  if (_0x4268e4 === 'constant')
    return hasOwnManifestValue(_0x14e9a2, 'value') ? _0x14e9a2['value'] : _0x14e9a2['defaultValue'];
  if (_0x4268e4 === 'prompt') {
    const _0xe10626 = resolveManifestPayloadValue(_0x369a1a, normalizeManifestFieldList(_0x14e9a2), '');
    return isPresentManifestValue(_0xe10626) ? _0xe10626 : _0x374c00;
  }
  if (_0x4268e4 === 'param') {
    const _0x3331ee = normalizeManifestFieldList(_0x14e9a2),
      _0x358fc3 = resolveManifestPayloadValue(_0x369a1a, _0x3331ee, undefined, {
        allowEmpty: _0x14e9a2?.['allowEmpty'] === !![],
      });
    if (
      isPresentManifestValue(_0x358fc3) ||
      (_0x14e9a2?.['allowEmpty'] === !![] && _0x358fc3 !== undefined && _0x358fc3 !== null)
    )
      return _0x358fc3;
    const _0x53aa8a = _0x3331ee['filter']((_0x1a247f) => !_0x1a247f['startsWith']('generationParams.'))[
      'map'
    ]((_0x5e7106) => 'generationParams.' + _0x5e7106);
    return resolveManifestPayloadValue(_0x369a1a, _0x53aa8a, undefined, {
      allowEmpty: _0x14e9a2?.['allowEmpty'] === !![],
    });
  }
  const _0x4b8f79 = sourceResolvers[_0x4268e4];
  if (typeof _0x4b8f79 === 'function')
    return _0x4b8f79({ item: _0x14e9a2, payload: _0x369a1a, finalPrompt: _0x374c00 });
  throw new Error('Unsupported RunningHub workflow mapping source: ' + _0x4268e4);
}
export function pushRunningHubManifestNode(_0x48a1e6, _0x4fd5ce, _0x15223b, _0x1dbded = {}) {
  if (!_0x4fd5ce?.['nodeId'] || !_0x4fd5ce?.['fieldName']) return;
  _0x48a1e6['push']({
    nodeId: String(_0x4fd5ce['nodeId']),
    fieldName: String(_0x1dbded['fieldName'] || _0x4fd5ce['fieldName']),
    fieldValue:
      _0x4fd5ce['preserveValueType'] === !![]
        ? _0x4fd5ce['transform'] === 'boolean'
          ? String(_0x15223b) === 'true'
          : _0x15223b
        : String(_0x15223b),
    ...(_0x4fd5ce['description'] || _0x1dbded['description']
      ? { description: _0x1dbded['description'] || _0x4fd5ce['description'] }
      : {}),
  });
}
export function getRunningHubMappedValue(_0x1ca4d0, _0x4847fb, _0x992f61 = '') {
  const _0x2841ed = String(_0x1ca4d0 ?? '')['trim'](),
    _0x52e99a = _0x4847fb?.['valueMap'] || {};
  if (_0x2841ed && _0x52e99a[_0x2841ed] !== undefined) return _0x52e99a[_0x2841ed];
  if (_0x2841ed && _0x52e99a[_0x2841ed['toLowerCase']()] !== undefined)
    return _0x52e99a[_0x2841ed['toLowerCase']()];
  return _0x4847fb?.['defaultValue'] ?? _0x992f61;
}
export async function buildRunningHubNodeInfoListFromManifest({
  mapping: _0x2d0f29,
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  sourceResolvers: sourceResolvers = {},
  transforms: transforms = {},
}) {
  const _0x6f48c1 = Array['isArray'](_0x2d0f29?.['nodeInfoList']) ? _0x2d0f29['nodeInfoList'] : [];
  if (_0x6f48c1['length'] === 0x0) return _0x2d0f29?.['allowEmptyNodeInfoList'] === !![] ? [] : null;
  const _0x1b989f = [];
  for (const _0x67915c of _0x6f48c1) {
    if (!_0x67915c?.['nodeId'] || !_0x67915c?.['fieldName']) continue;
    if (!shouldUseManifestNodeMapping(_0x67915c, payload)) continue;
    const _0x295329 = await resolveRunningHubManifestNodeValue({
        item: _0x67915c,
        payload: payload,
        finalPrompt: finalPrompt,
        sourceResolvers: sourceResolvers,
      }),
      _0x102eea = _0x67915c?.['allowEmpty'] === !![],
      _0x40e45c = _0x67915c?.['includeEmpty'] === !![] || _0x102eea,
      _0x4238de = hasOwnManifestValue(_0x67915c, 'defaultValue');
    let _0x5e758e = _0x295329;
    !isPresentManifestValue(_0x5e758e) &&
      _0x4238de &&
      !(_0x102eea && _0x5e758e !== undefined && _0x5e758e !== null) &&
      (_0x5e758e = _0x67915c['defaultValue']);
    if (!isPresentManifestValue(_0x5e758e)) {
      if (_0x40e45c) _0x5e758e = '';
      else {
        if (_0x67915c['required'])
          throw new Error(
            _0x67915c['missingMessage'] ||
              'Missing\x20RunningHub\x20workflow\x20node\x20input:\x20' + _0x67915c['fieldName'],
          );
        else continue;
      }
    }
    ((_0x5e758e = applyManifestNodeValueMap(_0x5e758e, _0x67915c)),
      (_0x5e758e = applyManifestNodeTransform(_0x5e758e, _0x67915c, transforms)));
    if (!isPresentManifestValue(_0x5e758e) && _0x67915c['required'] && !_0x40e45c)
      throw new Error(
        _0x67915c['missingMessage'] || 'Missing RunningHub workflow node input: ' + _0x67915c['fieldName'],
      );
    if (!isPresentManifestValue(_0x5e758e) && !_0x40e45c) continue;
    pushRunningHubManifestNode(_0x1b989f, _0x67915c, _0x5e758e);
  }
  return _0x1b989f;
}
