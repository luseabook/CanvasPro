export function hostPromptFloatingSurfaces(
  _0x1c45dc,
  _0xbbf6d3,
  { externalDialogSelector: _0x4f83a9, onExternalDialog: _0x12e448 } = {},
) {
  const _0x38eda1 = _0x1c45dc['ownerDocument'],
    _0x1d0e7f = new Map();
  function _0x22fd10(_0x2ebcdf) {
    if (!_0x2ebcdf['matches']?.(_0xbbf6d3) || _0x2ebcdf['parentNode'] === _0x1c45dc) return;
    if (!_0x1d0e7f['has'](_0x2ebcdf)) {
      const _0x51d141 = _0x38eda1['createComment']('prompt-floating-surface');
      (_0x2ebcdf['before'](_0x51d141), _0x1d0e7f['set'](_0x2ebcdf, _0x51d141));
    }
    _0x1c45dc['appendChild'](_0x2ebcdf);
  }
  [..._0x38eda1['body']['children']]['forEach'](_0x22fd10);
  const _0x5ecf24 = new _0x38eda1['defaultView']['MutationObserver']((_0x54a7ae) => {
    for (const _0x474b7d of _0x54a7ae) {
      if (_0x474b7d['target'] === _0x1c45dc) {
        for (const _0x4ebbbd of _0x474b7d['removedNodes']) {
          if (_0x4ebbbd['parentNode'] === _0x1c45dc || _0x4ebbbd['parentNode'] === _0x38eda1['body'])
            continue;
          (_0x1d0e7f['get'](_0x4ebbbd)?.['remove'](), _0x1d0e7f['delete'](_0x4ebbbd));
        }
        continue;
      }
      for (const _0x409f21 of _0x474b7d['addedNodes']) {
        if (_0x4f83a9 && _0x409f21['matches']?.(_0x4f83a9)) {
          _0x12e448?.();
          return;
        }
        _0x22fd10(_0x409f21);
      }
    }
  });
  return (
    _0x5ecf24['observe'](_0x38eda1['body'], { childList: !![] }),
    _0x5ecf24['observe'](_0x1c45dc, { childList: !![] }),
    () => {
      _0x5ecf24['disconnect']();
      for (const [_0xde76, _0x2c6791] of _0x1d0e7f) {
        if (_0xde76['parentNode'] === _0x1c45dc && _0x2c6791['parentNode']) _0x2c6791['before'](_0xde76);
        _0x2c6791['remove']();
      }
      _0x1d0e7f['clear']();
    }
  );
}
