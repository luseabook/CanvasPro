function normalizeText(_0x113c06) {
  return String(_0x113c06 || '')['trim']();
}
export function createAudioVoiceAnalysisSession({ cancelMediaTask: cancelMediaTask = async () => {} } = {}) {
  let _0x406c0e = 0x0,
    _0xb57729 = null;
  async function _0x47120a(_0x5658bc) {
    if (!_0x5658bc || _0x5658bc['tasksCancelled'] === !![]) return;
    _0x5658bc['tasksCancelled'] = !![];
    const _0x457470 = [..._0x5658bc['taskIds']];
    await Promise['allSettled'](_0x457470['map']((_0x45e414) => cancelMediaTask(_0x45e414)));
  }
  function _0x32386a(_0x49df13) {
    return !!_0x49df13 && _0x49df13['invalidated'] !== !![] && _0xb57729 === _0x49df13;
  }
  function _0x173cbf({ sourceNodeId: sourceNodeId = '', sourceKey: sourceKey = '' } = {}) {
    _0xb57729 && ((_0xb57729['invalidated'] = !![]), void _0x47120a(_0xb57729));
    const _0x1c6eb5 = {
      id: ++_0x406c0e,
      sourceNodeId: normalizeText(sourceNodeId),
      sourceKey: normalizeText(sourceKey),
      taskIds: new Set(),
      tasksCancelled: ![],
      invalidated: ![],
    };
    return ((_0xb57729 = _0x1c6eb5), _0x1c6eb5);
  }
  async function _0x3ee435(_0x21faa7, _0x5c96d1) {
    const _0x33e1f1 = normalizeText(_0x5c96d1);
    if (!_0x33e1f1) return ![];
    if (!_0x32386a(_0x21faa7)) return (await cancelMediaTask(_0x33e1f1)['catch'](() => {}), ![]);
    return (_0x21faa7['taskIds']['add'](_0x33e1f1), !![]);
  }
  async function _0x501379() {
    const _0x5ea0b9 = _0xb57729;
    if (!_0x5ea0b9) return;
    ((_0x5ea0b9['invalidated'] = !![]), (_0xb57729 = null), await _0x47120a(_0x5ea0b9));
  }
  function _0x2bf3cf(_0x45cea6) {
    if (!_0x32386a(_0x45cea6)) return ![];
    return ((_0xb57729 = null), (_0x45cea6['invalidated'] = !![]), !![]);
  }
  return {
    begin: _0x173cbf,
    complete: _0x2bf3cf,
    getActive: () => _0xb57729,
    invalidate: _0x501379,
    isActiveFor: (_0x1cba05) =>
      _0x32386a(_0xb57729) && _0xb57729['sourceNodeId'] === normalizeText(_0x1cba05),
    isCurrent: _0x32386a,
    trackTask: _0x3ee435,
  };
}
