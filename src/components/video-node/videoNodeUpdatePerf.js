function isPerfProbeEnabled() {
  return typeof window !== 'undefined' && window['__perfProbeEnabled'] === !![];
}
function nowMs() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
export function createVideoNodeUpdatePerf() {
  if (!isPerfProbeEnabled()) return null;
  const _0x492670 = nowMs();
  let _0x13eb48 = _0x492670;
  const _0x32cba1 = [],
    _0x4be404 = {};
  return {
    detail(_0x5aa2e6, _0x3ceb2b) {
      _0x4be404[String(_0x5aa2e6 || '')] = String(_0x3ceb2b ?? '')['slice'](0x0, 0x1f4);
    },
    mark(_0x413847) {
      const _0x36b2e1 = nowMs(),
        _0x13cf78 = _0x36b2e1 - _0x13eb48;
      ((_0x13eb48 = _0x36b2e1),
        Number['isFinite'](_0x13cf78) &&
          _0x13cf78 >= 0x0 &&
          _0x32cba1['push']({ name: String(_0x413847 || ''), durationMs: _0x13cf78 }));
    },
    finish() {
      const _0x107a92 = nowMs() - _0x492670;
      return {
        totalMs: Number['isFinite'](_0x107a92) ? _0x107a92 : 0x0,
        details: _0x4be404,
        sections: _0x32cba1['filter']((_0x15dc40) => _0x15dc40['durationMs'] >= 0.05)
          ['sort']((_0x4da545, _0x41000d) => _0x41000d['durationMs'] - _0x4da545['durationMs'])
          ['slice'](0x0, 0xc),
      };
    },
  };
}
