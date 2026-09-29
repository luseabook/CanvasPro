function normalizeText(_0x2bc991) {
  return String(_0x2bc991 || '')['trim']();
}
function buildOperationKey({
  kind: kind = '',
  sourceNodeId: sourceNodeId = '',
  segmentId: segmentId = '',
} = {}) {
  return [normalizeText(kind), normalizeText(sourceNodeId), normalizeText(segmentId)]['join']('\x1f');
}
function normalizeSegmentIds(_0x4c64f2 = {}) {
  const _0x5cba56 = [
    ...(Array['isArray'](_0x4c64f2['segmentIds']) ? _0x4c64f2['segmentIds'] : []),
    _0x4c64f2['segmentId'],
  ]
    ['map'](normalizeText)
    ['filter'](Boolean);
  return [...new Set(_0x5cba56)];
}
function operationsOverlap(_0x53731c = {}, _0x25e952 = {}) {
  if (_0x53731c['sourceNodeId'] !== _0x25e952['sourceNodeId']) return ![];
  const _0x522036 = _0x53731c['segmentIds'] || [],
    _0x1ad948 = _0x25e952['segmentIds'] || [];
  if (_0x522036['includes']('all') || _0x1ad948['includes']('all')) return !![];
  const _0x416103 = new Set(_0x522036);
  return _0x1ad948['some']((_0xc5b35b) => _0x416103['has'](_0xc5b35b));
}
export function createAudioVoiceSegmentEditSession() {
  const _0x2c59db = new Map();
  let _0x319e0a = 0x0;
  function _0x1453ac(_0x4bbcc0 = {}) {
    const _0x181fff = buildOperationKey(_0x4bbcc0);
    if (_0x2c59db['has'](_0x181fff)) return null;
    const _0x5a40dd = {
      id: ++_0x319e0a,
      key: _0x181fff,
      kind: normalizeText(_0x4bbcc0['kind']),
      sourceNodeId: normalizeText(_0x4bbcc0['sourceNodeId']),
      segmentId: normalizeText(_0x4bbcc0['segmentId']),
      segmentIds: normalizeSegmentIds(_0x4bbcc0),
      payload: _0x4bbcc0['payload'] ?? null,
      invalidated: ![],
    };
    if ([..._0x2c59db['values']()]['some']((_0x5c797d) => operationsOverlap(_0x5c797d, _0x5a40dd)))
      return null;
    const _0x4bf498 = _0x5a40dd;
    return (_0x2c59db['set'](_0x181fff, _0x4bf498), _0x4bf498);
  }
  function _0x495fcb(_0x5d2453, _0x7bec14 = _0x5d2453?.['sourceNodeId']) {
    return (
      !!_0x5d2453 &&
      _0x5d2453['invalidated'] !== !![] &&
      _0x2c59db['get'](_0x5d2453['key']) === _0x5d2453 &&
      _0x5d2453['sourceNodeId'] === normalizeText(_0x7bec14)
    );
  }
  function _0x37f118(_0xcfcfa6) {
    if (!_0x495fcb(_0xcfcfa6)) return ![];
    return (_0x2c59db['delete'](_0xcfcfa6['key']), (_0xcfcfa6['invalidated'] = !![]), !![]);
  }
  function _0x5d00fe() {
    (_0x2c59db['forEach']((_0x536431) => {
      _0x536431['invalidated'] = !![];
    }),
      _0x2c59db['clear']());
  }
  function _0x2c3096(_0x53eb58 = {}) {
    const _0x30b6f8 = normalizeText(_0x53eb58['kind']),
      _0x3f5f47 = normalizeText(_0x53eb58['sourceNodeId']);
    return [..._0x2c59db['values']()]['filter'](
      (_0x550d58) =>
        _0x550d58['invalidated'] !== !![] &&
        (!_0x30b6f8 || _0x550d58['kind'] === _0x30b6f8) &&
        (!_0x3f5f47 || _0x550d58['sourceNodeId'] === _0x3f5f47),
    );
  }
  function _0x2bd9c4(_0x54dc41, _0x40a404) {
    const _0x25e516 = normalizeText(_0x54dc41),
      _0x4d271f = normalizeText(_0x40a404);
    if (!_0x25e516 || !_0x4d271f) return ![];
    return _0x2c3096({ sourceNodeId: _0x25e516 })['some'](
      (_0x39c68a) =>
        _0x39c68a['segmentIds']['includes']('all') || _0x39c68a['segmentIds']['includes'](_0x4d271f),
    );
  }
  return {
    begin: _0x1453ac,
    finish: _0x37f118,
    getActiveCount: () => _0x2c59db['size'],
    invalidateAll: _0x5d00fe,
    isCurrent: _0x495fcb,
    isSegmentReserved: _0x2bd9c4,
    listActive: _0x2c3096,
  };
}
