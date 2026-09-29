export function createApiConfigAutoSaveController({
  beforePersist: _0x28fd7a,
  collectConfig: _0xd7ed01,
  saveConfig: _0x1a8758,
  onSaved: _0x1e3349,
  onError: _0x57eb7d,
  onStateChange: _0x1eee1a,
  timerHost: timerHost = globalThis['window'] || globalThis,
  delay: delay = 0x258,
} = {}) {
  let _0x65957b = null,
    _0x85b2f7 = 0x0,
    _0x50f203 = Promise['resolve'](),
    _0x28f6cc = 0x0;
  function _0x15a351() {
    if (_0x65957b === null) return;
    (timerHost['clearTimeout'](_0x65957b), (_0x65957b = null));
  }
  function _0x5d81af(_0x5aea20 = {}) {
    _0x15a351();
    const _0x508c25 = ++_0x85b2f7;
    ((_0x28f6cc += 0x1), _0x1eee1a?.('saving'));
    const _0x2496cb = _0x50f203['then'](async () => {
      try {
        await _0x28fd7a?.();
        const _0x37d8eb = _0xd7ed01();
        return (
          await _0x1a8758(_0x37d8eb),
          _0x508c25 === _0x85b2f7 && (_0x1e3349?.(_0x37d8eb, _0x5aea20), _0x1eee1a?.('saved')),
          _0x37d8eb
        );
      } catch (_0x3fcb10) {
        return (_0x508c25 === _0x85b2f7 && (_0x57eb7d?.(_0x3fcb10, _0x5aea20), _0x1eee1a?.('error')), null);
      } finally {
        _0x28f6cc -= 0x1;
        if (_0x28f6cc === 0x0 && _0x65957b !== null) _0x1eee1a?.('scheduled');
      }
    });
    return (
      (_0x50f203 = _0x2496cb['then'](
        () => null,
        () => null,
      )),
      _0x2496cb
    );
  }
  function _0x2311c6() {
    (_0x15a351(),
      (_0x85b2f7 += 0x1),
      _0x1eee1a?.(_0x28f6cc ? 'saving' : 'scheduled'),
      (_0x65957b = timerHost['setTimeout'](() => {
        ((_0x65957b = null), _0x5d81af()['catch'](() => {}));
      }, delay)));
  }
  function _0x2f226c() {
    return _0x65957b === null ? _0x50f203 : _0x5d81af();
  }
  return { persist: _0x5d81af, schedule: _0x2311c6, flush: _0x2f226c };
}
