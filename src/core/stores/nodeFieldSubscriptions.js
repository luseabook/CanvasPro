export function createNodeFieldSubscriptions(_0x499e40) {
  const _0x3a58b0 = new Map();
  function _0x2a8748(_0x529d17) {
    const _0x3aac55 = _0x499e40()[_0x529d17];
    for (const [_0x4c8da6, _0x17b5e0] of _0x3a58b0) {
      const _0x277be1 = _0x3aac55?.[_0x4c8da6];
      if (_0x17b5e0['values']['get'](_0x529d17) === _0x277be1) continue;
      if (_0x277be1 === undefined) _0x17b5e0['values']['delete'](_0x529d17);
      else _0x17b5e0['values']['set'](_0x529d17, _0x277be1);
      _0x17b5e0['dirty'] = !![];
    }
  }
  function _0x1aab93() {
    for (const [_0xefabca, _0x202018] of _0x3a58b0) {
      ((_0x202018['values'] = new Map(
        Object['values'](_0x499e40())
          ['filter']((_0x30f9fa) => _0x30f9fa?.[_0xefabca] !== undefined)
          ['map']((_0x418db8) => [_0x418db8['id'], _0x418db8[_0xefabca]]),
      )),
        (_0x202018['dirty'] = !![]));
    }
  }
  return {
    touch: _0x2a8748,
    reload: _0x1aab93,
    flush() {
      for (const _0x1ace24 of _0x3a58b0['values']()) {
        if (!_0x1ace24['dirty']) continue;
        _0x1ace24['dirty'] = ![];
        const _0x5b77b3 = [..._0x1ace24['values']['values']()];
        for (const _0x3cbd80 of [..._0x1ace24['listeners']]) _0x3cbd80(_0x5b77b3);
      }
    },
    subscribe(_0x426705, _0x472052) {
      if (typeof _0x426705 !== 'string' || !_0x426705 || typeof _0x472052 !== 'function')
        throw new TypeError('Expected\x20a\x20node\x20field\x20and\x20listener');
      let _0x5a4fa6 = _0x3a58b0['get'](_0x426705);
      return (
        !_0x5a4fa6 &&
          ((_0x5a4fa6 = {
            values: new Map(
              Object['values'](_0x499e40())
                ['filter']((_0x433ded) => _0x433ded?.[_0x426705] !== undefined)
                ['map']((_0x484f10) => [_0x484f10['id'], _0x484f10[_0x426705]]),
            ),
            listeners: new Set(),
            dirty: ![],
          }),
          _0x3a58b0['set'](_0x426705, _0x5a4fa6)),
        _0x5a4fa6['listeners']['add'](_0x472052),
        _0x472052([..._0x5a4fa6['values']['values']()]),
        () => {
          _0x5a4fa6['listeners']['delete'](_0x472052);
          if (!_0x5a4fa6['listeners']['size']) _0x3a58b0['delete'](_0x426705);
        }
      );
    },
  };
}
