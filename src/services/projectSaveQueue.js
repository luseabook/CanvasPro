export function createProjectSaveQueue(_0x25e6c8) {
  const _0x86e7b9 = new Map();
  async function _0x47b2ec(_0xb52cfe, _0x432999, _0x5559db) {
    while (_0x5559db) {
      try {
        _0x5559db['resolve'](await _0x25e6c8(_0x5559db['snapshot']));
      } catch (_0x108761) {
        _0x5559db['reject'](_0x108761);
      }
      ((_0x5559db = _0x432999['pending']), (_0x432999['pending'] = null));
    }
    _0x86e7b9['delete'](_0xb52cfe);
  }
  return (_0x579077, _0x212fc8) =>
    new Promise((_0x13fd0d, _0x1c0e13) => {
      const _0x355b41 = { snapshot: _0x212fc8, resolve: _0x13fd0d, reject: _0x1c0e13 },
        _0x1e4f02 = _0x86e7b9['get'](_0x579077);
      if (_0x1e4f02) {
        (_0x1e4f02['pending']?.['resolve']({ success: ![], canceled: !![], superseded: !![] }),
          (_0x1e4f02['pending'] = _0x355b41));
        return;
      }
      const _0x2a3b88 = { pending: null };
      (_0x86e7b9['set'](_0x579077, _0x2a3b88), void _0x47b2ec(_0x579077, _0x2a3b88, _0x355b41));
    });
}
