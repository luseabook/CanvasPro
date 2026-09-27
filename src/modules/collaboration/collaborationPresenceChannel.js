export function createCollaborationPresenceChannel({
  send: _0x3db78d,
  read: _0x2c3d18,
  onUpdate: _0x1c3ec3,
  onError: _0x11f4bb,
  signal: _0x20193b,
  changeDriven: changeDriven = ![],
  now: now = () => performance['now'](),
}) {
  let _0x178da5 = null,
    _0x4f357e = ![],
    _0x26bd5c = null,
    _0x35c03f = null,
    _0x30827a = '',
    _0x18ef42 = -Infinity;
  async function _0x332a52() {
    const _0x3f3835 = now();
    _0x18ef42 = _0x3f3835;
    const _0x2583da = _0x2c3d18(),
      _0x1db611 = JSON['stringify'](_0x2583da);
    let _0x504998 = 0x32;
    try {
      const _0x2647f6 = await _0x3db78d(_0x2583da);
      if (_0x4f357e || _0x20193b?.['aborted']) return;
      if (!Array['isArray'](_0x2647f6?.['presence']) || !_0x2647f6['locks'])
        throw new Error('鼠标同步响应无效');
      const _0x541b6d = Math['max'](0x0, now() - _0x3f3835);
      ((_0x35c03f = _0x35c03f == null ? _0x541b6d : _0x35c03f * 0.7 + _0x541b6d * 0.3),
        _0x1c3ec3({
          presence: _0x2647f6['presence'],
          locks: _0x2647f6['locks'],
          latencyMs: Math['round'](_0x35c03f),
          presenceStatus: 'online',
        }),
        (_0x30827a = _0x1db611),
        (_0x504998 =
          changeDriven && JSON['stringify'](_0x2c3d18()) === _0x30827a
            ? 0xbb8
            : Math['max'](0x0, 0x21 - _0x541b6d)));
    } catch (_0x3b9041) {
      if (!_0x4f357e && !_0x20193b?.['aborted']) _0x11f4bb(_0x3b9041);
      _0x504998 = 0x3e8;
    } finally {
      if (!_0x4f357e && !_0x20193b?.['aborted']) _0x178da5 = setTimeout(_0x27aefa, _0x504998);
    }
  }
  function _0x27aefa() {
    if (_0x4f357e || _0x20193b?.['aborted']) return Promise['resolve']();
    if (_0x26bd5c) return _0x26bd5c;
    return (
      clearTimeout(_0x178da5),
      (_0x26bd5c = _0x332a52()['finally'](() => {
        _0x26bd5c = null;
      })),
      _0x26bd5c
    );
  }
  return {
    start: _0x27aefa,
    changed() {
      if (!changeDriven || _0x4f357e || _0x26bd5c || JSON['stringify'](_0x2c3d18()) === _0x30827a) return;
      (clearTimeout(_0x178da5),
        (_0x178da5 = setTimeout(_0x27aefa, Math['max'](0x0, 0x21 - (now() - _0x18ef42)))));
    },
    async flush() {
      if (_0x26bd5c) await _0x26bd5c;
      await _0x27aefa();
    },
    stop() {
      ((_0x4f357e = !![]), clearTimeout(_0x178da5));
    },
  };
}
