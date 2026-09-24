export function summarizeBackendLog(_0x1888e2 = '') {
  const _0x5def7b = String(_0x1888e2)['split'](/\r?\n/),
    _0xf7d369 = [];
  let _0x527139 = 0x0;
  const _0x67062c =
    /(?:\[(?:ERROR|CRITICAL|WARN(?:ING)?)\]|\b(?:ERROR|CRITICAL|WARNING):|^Traceback \(most recent call last\):|^\s*[\w.]+(?:Error|Exception):|spawn error:|exited code=(?!0(?:\s|$))\S+)/i;
  for (let _0x376b33 = 0x0; _0x376b33 < _0x5def7b['length']; _0x376b33 += 0x1) {
    if (!_0x67062c['test'](_0x5def7b[_0x376b33])) continue;
    ((_0x527139 += 0x1),
      _0xf7d369['push']({
        line: _0x376b33 + 0x1,
        excerpt: _0x5def7b['slice'](Math['max'](0x0, _0x376b33 - 0x2), _0x376b33 + 0x4)
          ['join']('\x0a')
          ['slice'](0x0, 0x708),
      }));
    if (_0xf7d369['length'] > 0x1e) _0xf7d369['shift']();
  }
  return {
    detection: 'text-patterns',
    matchedLineCount: _0x527139,
    recentFindings: _0xf7d369,
    notes: [
      'Matches are possible backend problems, not deduplicated failures or root causes.',
      'Line numbers refer to the included server.log; unmarked errors may not match.',
    ],
  };
}
export function mergeDiagnosticEvidence(_0x392e8b, _0x543940) {
  const _0x4023f1 = new Map();
  for (const _0x225b42 of [
    ..._0x392e8b,
    ..._0x543940['flatMap']((_0x4c6721) => [
      ...(Array['isArray'](_0x4c6721['precedingEvents']) ? _0x4c6721['precedingEvents'] : []),
      _0x4c6721['event'],
    ]),
  ]) {
    if (!_0x225b42 || typeof _0x225b42 !== 'object' || !_0x225b42['ts'] || !_0x225b42['type']) continue;
    const _0x242afc =
      _0x225b42['launchSessionId'] && _0x225b42['eventSeq']
        ? _0x225b42['launchSessionId'] + ':' + _0x225b42['eventSeq']
        : JSON['stringify'](_0x225b42);
    if (!_0x4023f1['has'](_0x242afc)) _0x4023f1['set'](_0x242afc, _0x225b42);
  }
  return [..._0x4023f1['values']()]['sort'](
    (_0x1e9622, _0x314c5a) =>
      String(_0x1e9622['ts'])['localeCompare'](String(_0x314c5a['ts'])) ||
      Number(_0x1e9622['eventSeq'] || 0x0) - Number(_0x314c5a['eventSeq'] || 0x0),
  );
}
