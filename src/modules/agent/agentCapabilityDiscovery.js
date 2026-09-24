import { listModelManifests } from '../../manifests/index.js';
const DEFAULT_RESULT_LIMIT = 0x6,
  MAX_RESULT_LIMIT = 0xc;
export function normalizeAgentSearchText(_0x5eb2eb) {
  return String(_0x5eb2eb || '')
    ['normalize']('NFKC')
    ['trim']()
    ['toLowerCase']();
}
export function normalizeAgentSearchKey(_0x719db4) {
  return normalizeAgentSearchText(_0x719db4)['replace'](/[\s\-_.:/|,，。()（）\[\]【】]+/g, '');
}
function normalizeStringArray(_0x5759e8) {
  return Array['isArray'](_0x5759e8)
    ? [...new Set(_0x5759e8['map']((_0xe28e46) => String(_0xe28e46 || '')['trim']())['filter'](Boolean))]
    : [];
}
function normalizeLimit(_0x1414f0) {
  const _0x1511fc = Number(_0x1414f0);
  if (!Number['isFinite'](_0x1511fc)) return DEFAULT_RESULT_LIMIT;
  return Math['max'](0x1, Math['min'](MAX_RESULT_LIMIT, Math['trunc'](_0x1511fc)));
}
function collectSearchTokens(_0xc2d351) {
  return normalizeAgentSearchText(_0xc2d351)
    ['split'](/[\s,，。:：/|]+/)
    ['map']((_0x36da7e) => _0x36da7e['trim']())
    ['filter']((_0x229f36) => _0x229f36['length'] >= 0x2);
}
function scoreHaystack(_0x1d9dde, _0x31e2de, _0x4374ed = []) {
  const _0x47e1d7 = normalizeAgentSearchText(_0x1d9dde);
  if (!_0x47e1d7) return 0x1;
  const _0x562acf = normalizeAgentSearchKey(_0x47e1d7);
  let _0x50273b = 0x0;
  for (const _0x298449 of _0x4374ed['map'](normalizeAgentSearchText)['filter'](Boolean)) {
    if (_0x298449 === _0x47e1d7) _0x50273b += 0x3e8;
    else {
      if (_0x47e1d7['includes'](_0x298449) || _0x298449['includes'](_0x47e1d7)) _0x50273b += 0xdc;
    }
    const _0x3ceb6e = normalizeAgentSearchKey(_0x298449);
    if (_0x562acf && _0x3ceb6e === _0x562acf) _0x50273b += 0x384;
    else
      _0x562acf['length'] >= 0x3 &&
        _0x3ceb6e &&
        (_0x562acf['includes'](_0x3ceb6e) || _0x3ceb6e['includes'](_0x562acf)) &&
        (_0x50273b += 0xc8);
  }
  const _0x1b7e17 = normalizeAgentSearchText(_0x31e2de);
  if (_0x1b7e17['includes'](_0x47e1d7)) _0x50273b += 0xb4;
  const _0x4ce576 = normalizeAgentSearchKey(_0x1b7e17);
  if (_0x562acf['length'] >= 0x3 && _0x4ce576['includes'](_0x562acf)) _0x50273b += 0xa0;
  for (const _0x488d84 of collectSearchTokens(_0x47e1d7)) {
    if (_0x1b7e17['includes'](_0x488d84)) _0x50273b += 0x1e;
  }
  return _0x50273b;
}
function summarizeCommand(_0x52dcf3 = {}) {
  return {
    commandId: String(_0x52dcf3['id'] || ''),
    description: String(_0x52dcf3['description'] || ''),
    riskLevel: String(_0x52dcf3['riskLevel'] || 'safe'),
    reads: normalizeStringArray(_0x52dcf3['capabilitySchema']?.['reads']),
    writes: normalizeStringArray(_0x52dcf3['capabilitySchema']?.['writes']),
    argNames: Object['keys'](_0x52dcf3['argsSchema']?.['properties'] || {}),
  };
}
export function searchAgentCommands({
  commandRegistry: _0x65e51d,
  query: query = '',
  limit: _0x4dd8ca,
} = {}) {
  const _0x26d27f = typeof _0x65e51d?.['list'] === 'function' ? _0x65e51d['list']() : [],
    _0x4a01de = _0x26d27f['map']((_0x2999d2, _0x5e8ff6) => {
      const _0x107d0c = summarizeCommand(_0x2999d2),
        _0x17e138 = [
          _0x107d0c['commandId'],
          _0x107d0c['description'],
          ..._0x107d0c['reads'],
          ..._0x107d0c['writes'],
          ..._0x107d0c['argNames'],
        ]['join']('\x20');
      return {
        summary: _0x107d0c,
        index: _0x5e8ff6,
        score: scoreHaystack(query, _0x17e138, [_0x107d0c['commandId']]),
      };
    })
      ['filter']((_0x27c3e0) => _0x27c3e0['score'] > 0x0)
      ['sort'](
        (_0x538106, _0x44c61d) =>
          _0x44c61d['score'] - _0x538106['score'] || _0x538106['index'] - _0x44c61d['index'],
      ),
    _0x5e1f33 = _0x4a01de['slice'](0x0, normalizeLimit(_0x4dd8ca));
  return {
    query: String(query || '')['trim'](),
    commandIds: _0x5e1f33['map']((_0x5e03f7) => _0x5e03f7['summary']['commandId']),
    commands: _0x5e1f33['map']((_0x50f169) => _0x50f169['summary']),
    totalMatched: _0x4a01de['length'],
  };
}
export function describeAgentCommand({ commandRegistry: _0x5edbe6, commandId: commandId = '' } = {}) {
  const _0x1e0489 = String(commandId || '')['trim'](),
    _0x53272e = _0x5edbe6?.['get']?.(_0x1e0489) || null;
  if (!_0x53272e)
    return {
      found: ![],
      commandId: _0x1e0489,
      errorCode: 'AGENT_COMMAND_NOT_FOUND',
      message: 'Canvas\x20command\x20is\x20not\x20registered:\x20' + _0x1e0489,
    };
  return {
    found: !![],
    commandId: _0x53272e['id'],
    description: String(_0x53272e['description'] || ''),
    riskLevel: String(_0x53272e['riskLevel'] || 'safe'),
    argsSchema: _0x53272e['argsSchema'],
    capabilitySchema: _0x53272e['capabilitySchema'],
    returnSchema: _0x53272e['returnSchema'],
    returnAliasFields: normalizeStringArray(_0x53272e['returnSchema']?.['aliasFields']),
  };
}
function summarizeInputSlots(_0x391f6b = {}) {
  if (!_0x391f6b || typeof _0x391f6b !== 'object' || Array['isArray'](_0x391f6b)) return {};
  const _0x136580 = (Array['isArray'](_0x391f6b['fixedSlots']) ? _0x391f6b['fixedSlots'] : [])
    ['map']((_0x3587e3 = {}) => ({
      id: String(_0x3587e3['id'] || _0x3587e3['slotId'] || ''),
      kind: String(_0x3587e3['kind'] || _0x3587e3['type'] || ''),
      required: _0x3587e3['required'] === !![],
      ...(_0x3587e3['showWhen'] ? { showWhen: _0x3587e3['showWhen'] } : {}),
    }))
    ['filter']((_0x16ff35) => _0x16ff35['id']);
  return {
    ...(_0x136580['length'] > 0x0 ? { fixedSlots: _0x136580 } : {}),
    ...(Array['isArray'](_0x391f6b['allowedKinds'])
      ? { allowedKinds: normalizeStringArray(_0x391f6b['allowedKinds']) }
      : {}),
    ...(_0x391f6b['minByKind'] && typeof _0x391f6b['minByKind'] === 'object'
      ? { minByKind: { ..._0x391f6b['minByKind'] } }
      : {}),
    ...(_0x391f6b['maxByKind'] && typeof _0x391f6b['maxByKind'] === 'object'
      ? { maxByKind: { ..._0x391f6b['maxByKind'] } }
      : {}),
    ...(_0x391f6b['minItems'] != null ? { minItems: _0x391f6b['minItems'] } : {}),
    ...(_0x391f6b['maxItems'] != null ? { maxItems: _0x391f6b['maxItems'] } : {}),
    ...(_0x391f6b['accepts'] ? { accepts: _0x391f6b['accepts'] } : {}),
  };
}
function modelAcceptsInputKind(_0x28c3cb = {}, _0x300fc2 = '') {
  const _0x10adf9 = normalizeAgentSearchText(_0x300fc2);
  if (!_0x10adf9) return !![];
  const _0x1a508f = new Set(normalizeStringArray(_0x28c3cb['allowedKinds'])['map'](normalizeAgentSearchText));
  if (_0x1a508f['has'](_0x10adf9)) return !![];
  if (Number(_0x28c3cb['maxByKind']?.[_0x10adf9]) > 0x0) return !![];
  if (Number(_0x28c3cb['minByKind']?.[_0x10adf9]) > 0x0) return !![];
  return (_0x28c3cb['fixedSlots'] || [])['some'](
    (_0x55f3c5) => normalizeAgentSearchText(_0x55f3c5['kind']) === _0x10adf9,
  );
}
function summarizeModelField(_0x43f130 = {}) {
  const _0x5c9622 = {
    id: String(_0x43f130['id'] || _0x43f130['key'] || ''),
    type: String(_0x43f130['type'] || ''),
    required: _0x43f130['required'] === !![],
  };
  for (const _0x1f5473 of ['label', 'default', 'min', 'max', 'step', 'placeholder', 'showWhen']) {
    if (_0x43f130[_0x1f5473] !== undefined) _0x5c9622[_0x1f5473] = _0x43f130[_0x1f5473];
  }
  return (
    Array['isArray'](_0x43f130['options']) &&
      (_0x5c9622['options'] = _0x43f130['options']['slice'](0x0, 0x3c)['map']((_0x47692a) => {
        if (!_0x47692a || typeof _0x47692a !== 'object') return _0x47692a;
        return {
          value: _0x47692a['value'],
          ...(_0x47692a['label'] !== undefined ? { label: _0x47692a['label'] } : {}),
        };
      })),
    _0x5c9622
  );
}
function summarizeModel(_0x3353ed = {}) {
  const _0xcf22b1 = (
    Array['isArray'](_0x3353ed['uiSchema']?.['fields']) ? _0x3353ed['uiSchema']['fields'] : []
  )
    ['map'](summarizeModelField)
    ['filter']((_0x285fe0) => _0x285fe0['id']);
  return {
    modelId: String(_0x3353ed['modelId'] || ''),
    provider: String(_0x3353ed['provider'] || ''),
    kind: String(_0x3353ed['kind'] || ''),
    displayName: String(_0x3353ed['displayName'] || _0x3353ed['modelId'] || ''),
    description: String(_0x3353ed['description'] || ''),
    adapterType: String(_0x3353ed['adapterType'] || ''),
    inputSlots: summarizeInputSlots(_0x3353ed['inputSlots']),
    fieldCount: _0xcf22b1['length'],
    uiSchema: { fields: _0xcf22b1 },
  };
}
export function searchAgentModels({
  query: query = '',
  kind: kind = '',
  provider: provider = '',
  inputKinds: inputKinds = [],
  limit: _0x143ae3,
} = {}) {
  const _0x5f219a = normalizeAgentSearchText(kind),
    _0x33ef36 = normalizeAgentSearchText(provider),
    _0x167147 = new Set(normalizeStringArray(inputKinds)['map'](normalizeAgentSearchText)),
    _0xd07847 = listModelManifests()
      ['map']((_0x3e3c48, _0x91f432) => {
        const _0xd8d578 = summarizeModel(_0x3e3c48),
          _0x5f5d3f = [..._0x167147]['every']((_0xac4ff6) =>
            modelAcceptsInputKind(_0xd8d578['inputSlots'], _0xac4ff6),
          ),
          _0x4bf16c =
            (!_0x5f219a || normalizeAgentSearchText(_0xd8d578['kind']) === _0x5f219a) &&
            (!_0x33ef36 || normalizeAgentSearchText(_0xd8d578['provider']) === _0x33ef36) &&
            (_0x167147['size'] === 0x0 || _0x5f5d3f),
          _0xc19fc1 = [
            _0xd8d578['modelId'],
            _0xd8d578['provider'],
            _0xd8d578['kind'],
            _0xd8d578['displayName'],
            _0xd8d578['description'],
            ..._0xd8d578['uiSchema']['fields']['map']((_0x50c92e) => _0x50c92e['id']),
          ]['join']('\x20');
        return {
          summary: _0xd8d578,
          index: _0x91f432,
          score: _0x4bf16c
            ? scoreHaystack(query, _0xc19fc1, [_0xd8d578['modelId'], _0xd8d578['displayName']])
            : 0x0,
        };
      })
      ['filter']((_0xe80054) => _0xe80054['score'] > 0x0)
      ['sort'](
        (_0x144de7, _0x19841e) =>
          _0x19841e['score'] - _0x144de7['score'] || _0x144de7['index'] - _0x19841e['index'],
      ),
    _0x3820fa = _0xd07847['slice'](0x0, normalizeLimit(_0x143ae3));
  return {
    query: String(query || '')['trim'](),
    modelIds: _0x3820fa['map']((_0x4cddf1) => _0x4cddf1['summary']['modelId']),
    models: _0x3820fa['map']((_0x25ce30) => _0x25ce30['summary']),
    totalMatched: _0xd07847['length'],
  };
}
