export function createProviderStatusTooltipController() {
  let _0x4be229 = null,
    _0x11c4f8 = null;
  function _0x4c70f6() {
    if (_0x4be229) return _0x4be229;
    const _0x177211 = globalThis['document'];
    if (!_0x177211?.['body']) return null;
    return (
      (_0x4be229 = _0x177211['createElement']('div')),
      (_0x4be229['className'] = 'settings-provider-test-tooltip'),
      _0x4be229['setAttribute']('role', 'tooltip'),
      (_0x4be229['hidden'] = !![]),
      _0x177211['body']['appendChild'](_0x4be229),
      _0x4be229
    );
  }
  function _0x54bc07(_0x1305d) {
    return String(_0x1305d?.['getAttribute']('data-provider-test-tooltip') || '')['trim']();
  }
  function _0x25157e(_0xd4c7c4) {
    if (!_0x4be229 || !_0xd4c7c4) return;
    const _0x2c127b = globalThis['window'];
    if (!_0x2c127b) return;
    const _0x5945cd = _0x4be229,
      _0x2e5594 = _0xd4c7c4['getBoundingClientRect'](),
      _0x522ba7 = _0x5945cd['getBoundingClientRect'](),
      _0x1a0a62 = 0x18,
      _0x2d70aa = _0xd4c7c4['closest']('.settings-modal')?.['getBoundingClientRect']()['top'] ?? 0x0,
      _0x520a55 = Math['max'](_0x1a0a62, _0x2d70aa + 0xa),
      _0x1194fb = Math['max'](_0x1a0a62, _0x2c127b['innerWidth'] - _0x522ba7['width'] - _0x1a0a62),
      _0x412693 = Math['min'](
        _0x1194fb,
        Math['max'](_0x1a0a62, _0x2e5594['left'] + _0x2e5594['width'] / 0x2 - _0x522ba7['width'] / 0x2),
      ),
      _0x2b1cbc = Math['max'](_0x520a55, _0x2e5594['top'] - _0x522ba7['height'] - 0xc),
      _0x3e4e4a = Math['min'](
        _0x522ba7['width'] - 0xe,
        Math['max'](0xe, _0x2e5594['left'] + _0x2e5594['width'] / 0x2 - _0x412693),
      );
    ((_0x5945cd['style']['left'] = _0x412693 + 'px'),
      (_0x5945cd['style']['top'] = _0x2b1cbc + 'px'),
      _0x5945cd['style']['setProperty']('--settings-provider-test-tooltip-arrow-left', _0x3e4e4a + 'px'));
  }
  function _0x452a7d(_0x1143f0) {
    const _0x479530 = _0x54bc07(_0x1143f0);
    if (!_0x479530) return;
    const _0x146f22 = _0x4c70f6();
    if (!_0x146f22) return;
    ((_0x11c4f8 = _0x1143f0),
      (_0x146f22['textContent'] = _0x479530),
      (_0x146f22['hidden'] = ![]),
      _0x25157e(_0x1143f0),
      _0x146f22['classList']['add']('is-visible'));
  }
  function _0x47012c(_0x3a49fe = null) {
    if (_0x3a49fe && _0x11c4f8 !== _0x3a49fe) return;
    _0x11c4f8 = null;
    if (!_0x4be229) return;
    (_0x4be229['classList']['remove']('is-visible'), (_0x4be229['hidden'] = !![]));
  }
  function _0x12bc5c(_0x4eb80b) {
    if (!_0x4eb80b || _0x4eb80b['dataset']['providerTestTooltipBound'] === '1') return;
    ((_0x4eb80b['dataset']['providerTestTooltipBound'] = '1'),
      _0x4eb80b['addEventListener']('pointerenter', () => _0x452a7d(_0x4eb80b)),
      _0x4eb80b['addEventListener']('pointerleave', () => _0x47012c(_0x4eb80b)),
      _0x4eb80b['addEventListener']('focus', () => _0x452a7d(_0x4eb80b)),
      _0x4eb80b['addEventListener']('blur', () => _0x47012c(_0x4eb80b)));
  }
  return { bind: _0x12bc5c, hide: _0x47012c };
}
