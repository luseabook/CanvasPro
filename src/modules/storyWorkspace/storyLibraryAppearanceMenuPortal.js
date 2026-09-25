function normalizeText(_0x179228) {
  return String(_0x179228 || '')['trim']();
}
export function createStoryLibraryAssignmentMenuPortal({
  storyRoot: _0xd3ae50,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  let _0x4669b3 = null,
    _0x6e61de = null,
    _0x1e8a0e = null,
    _0x2c6844 = null,
    _0x2233cb = null,
    _0x1b4496 = null,
    _0x1d8bfc = 0x0;
  function _0x2ea58b() {
    const _0x51674a = _0xd3ae50?.['ownerDocument']?.['documentElement'];
    return {
      width: Number(windowObject?.['innerWidth']) || _0x51674a?.['clientWidth'] || 0x0,
      height: Number(windowObject?.['innerHeight']) || _0x51674a?.['clientHeight'] || 0x0,
    };
  }
  function _0x2e90ef() {
    const _0x3de826 = _0x2c6844,
      _0x2702bb = _0x2233cb;
    ((_0x2c6844 = null), (_0x2233cb = null), (_0x1b4496 = null));
    if (!_0x3de826) return;
    (_0x3de826['classList']['remove']('is-portaled'),
      _0x3de826['style']['removeProperty']('top'),
      _0x3de826['style']['removeProperty']('left'));
    if (_0x2702bb?.['isConnected']) _0x2702bb['appendChild'](_0x3de826);
    else _0x3de826['remove']();
  }
  function _0x105fd1() {
    const _0xa3ee80 = _0x4669b3,
      _0x2a92e1 = _0x6e61de;
    ((_0x4669b3 = null), (_0x6e61de = null), (_0x1e8a0e = null));
    if (!_0xa3ee80) return;
    (_0xa3ee80['classList']['remove']('is-portaled'),
      _0xa3ee80['style']['removeProperty']('top'),
      _0xa3ee80['style']['removeProperty']('left'));
    if (_0x2a92e1?.['isConnected']) _0x2a92e1['appendChild'](_0xa3ee80);
    else _0xa3ee80['remove']();
  }
  function _0x3f5d23() {
    if (!_0x4669b3?.['isConnected'] || !_0x6e61de?.['isConnected'] || !_0x1e8a0e?.['isConnected']) return;
    const _0x41b7cb = _0x6e61de['getBoundingClientRect'](),
      _0x4a9b41 = _0x4669b3['getBoundingClientRect'](),
      _0x208301 = _0x2ea58b(),
      _0x4b6a19 = _0x41b7cb['bottom'] + 0xa,
      _0x52ef8a = _0x41b7cb['top'] - _0x4a9b41['height'] - 0xa,
      _0x104946 = _0x4b6a19 + _0x4a9b41['height'] <= _0x208301['height'] - 0x10 ? _0x4b6a19 : _0x52ef8a,
      _0x18d23d = _0x41b7cb['right'] - _0x4a9b41['width'],
      _0x2cfb45 = _0x208301['width'] - 0x10 - _0x4a9b41['width'],
      _0x210d0c = _0x208301['height'] - 0x10 - _0x4a9b41['height'];
    ((_0x4669b3['style']['left'] = Math['max'](0x10, Math['min'](_0x2cfb45, _0x18d23d)) + 'px'),
      (_0x4669b3['style']['top'] = Math['max'](0x10, Math['min'](_0x210d0c, _0x104946)) + 'px'));
  }
  function _0x1c6ca6() {
    if (!_0x2c6844?.['isConnected'] || !_0x2233cb?.['isConnected'] || !_0x1b4496?.['isConnected']) return;
    const _0x3a3f32 = _0x2233cb['getBoundingClientRect'](),
      _0x1f1c34 = _0x1b4496['getBoundingClientRect'](),
      _0x28f636 = _0x2c6844['getBoundingClientRect'](),
      _0x2f6039 = _0x2ea58b(),
      _0x29b36f = _0x3a3f32['right'] + 0xa,
      _0x126924 = _0x3a3f32['left'] - _0x28f636['width'] - 0xa,
      _0xac2ae4 = _0x29b36f + _0x28f636['width'] <= _0x2f6039['width'] - 0x10 ? _0x29b36f : _0x126924,
      _0x8edc6d = _0x2f6039['width'] - 0x10 - _0x28f636['width'],
      _0x17e6d2 = _0x2f6039['height'] - 0x10 - _0x28f636['height'];
    ((_0x2c6844['style']['left'] = Math['max'](0x10, Math['min'](_0x8edc6d, _0xac2ae4)) + 'px'),
      (_0x2c6844['style']['top'] = Math['max'](0x10, Math['min'](_0x17e6d2, _0x1f1c34['top'])) + 'px'));
  }
  function _0x15faee() {
    (_0x3f5d23(), _0x1c6ca6());
  }
  function _0x46996f() {
    _0x15faee();
    if (!windowObject?.['requestAnimationFrame']) return;
    if (_0x1d8bfc) windowObject['cancelAnimationFrame']?.(_0x1d8bfc);
    _0x1d8bfc = windowObject['requestAnimationFrame'](() => {
      ((_0x1d8bfc = 0x0), _0x15faee());
    });
  }
  function _0x4a4129(_0x2eb564 = _0xd3ae50) {
    (_0x2c6844 && (_0x2eb564 === _0xd3ae50 || _0x2eb564?.['contains']?.(_0x2233cb)) && _0x2e90ef(),
      _0x2eb564?.['querySelectorAll']?.('[data-story-library-appearance-target]')?.['forEach'](
        (_0x2030ba) => {
          (_0x2030ba['classList']['remove']('is-active'),
            _0x2030ba['setAttribute']('aria-expanded', 'false'));
        },
      ),
      _0x2eb564?.['querySelectorAll']?.('[data-story-library-appearance-menu]')?.['forEach']((_0x4cfd5c) => {
        (_0x4cfd5c['classList']['remove']('is-open'),
          _0x4cfd5c['setAttribute']('aria-hidden', 'true'),
          _0x4cfd5c['style']['removeProperty']('top'),
          _0x4cfd5c['style']['removeProperty']('left'));
      }));
  }
  function _0x75afab(_0x3d0d34) {
    const _0xbe84dc = _0x3d0d34?.['closest']?.('[data-story-library-target-menu]'),
      _0xdd92b2 = normalizeText(_0x3d0d34?.['dataset']?.['storyLibraryAppearanceTarget']),
      _0x53a709 = [...(_0xd3ae50?.['querySelectorAll']?.('[data-story-library-appearance-menu]') || [])][
        'find'
      ]((_0x1ab89e) => normalizeText(_0x1ab89e['dataset']['storyLibraryAppearanceMenu']) === _0xdd92b2);
    if (!_0xbe84dc || !_0xdd92b2 || !_0x53a709) return ![];
    return (
      _0x4a4129(_0xbe84dc),
      _0x3d0d34['classList']['add']('is-active'),
      _0x3d0d34['setAttribute']('aria-expanded', 'true'),
      (_0x2c6844 = _0x53a709),
      (_0x2233cb = _0xbe84dc),
      (_0x1b4496 = _0x3d0d34),
      _0xd3ae50['appendChild'](_0x53a709),
      _0x53a709['classList']['add']('is-portaled', 'is-open'),
      _0x53a709['setAttribute']('aria-hidden', 'false'),
      _0x1c6ca6(),
      !![]
    );
  }
  function _0x5b4210(_0xb01ea4 = _0xd3ae50) {
    (_0x4a4129(_0xd3ae50),
      _0x4669b3 && (_0xb01ea4 === _0xd3ae50 || _0xb01ea4?.['contains']?.(_0x6e61de)) && _0x105fd1(),
      _0xb01ea4?.['querySelectorAll']?.('[data-story-library-target-kind]')?.['forEach']((_0x2419c4) => {
        (_0x2419c4['classList']['remove']('is-active'), _0x2419c4['setAttribute']('aria-expanded', 'false'));
      }),
      _0xb01ea4?.['querySelectorAll']?.('[data-story-library-target-menu]')?.['forEach']((_0x5aeaf3) => {
        (_0x5aeaf3['classList']['remove']('is-open'),
          _0x5aeaf3['setAttribute']('aria-hidden', 'true'),
          _0x5aeaf3['style']['removeProperty']('top'),
          _0x5aeaf3['style']['removeProperty']('left'));
      }),
      _0xb01ea4?.['matches']?.('.story-library-add-menu-wrap') &&
        _0xb01ea4['classList']['remove']('has-target-menu-open'),
      _0xb01ea4?.['querySelectorAll']?.('.story-library-add-menu-wrap.has-target-menu-open')?.['forEach'](
        (_0x291d77) => _0x291d77['classList']['remove']('has-target-menu-open'),
      ));
  }
  function _0x3671be(_0x6f67e4) {
    const _0x4bc4a8 = _0x6f67e4?.['closest']?.('.story-library-add-menu-wrap'),
      _0xb03957 = normalizeText(_0x6f67e4?.['dataset']?.['storyLibraryTargetKind']),
      _0x5f0f6f = [...(_0xd3ae50?.['querySelectorAll']?.('[data-story-library-target-menu]') || [])]['find'](
        (_0x55e13d) => normalizeText(_0x55e13d['dataset']['storyLibraryTargetMenu']) === _0xb03957,
      );
    if (!_0x4bc4a8 || !_0xb03957 || !_0x5f0f6f) return ![];
    const _0x5e8f51 = !_0x5f0f6f['classList']['contains']('is-open');
    _0x5b4210(_0x4bc4a8);
    if (!_0x5e8f51) return ![];
    return (
      _0x4bc4a8['classList']['add']('has-target-menu-open'),
      _0x6f67e4['classList']['add']('is-active'),
      _0x6f67e4['setAttribute']('aria-expanded', 'true'),
      (_0x4669b3 = _0x5f0f6f),
      (_0x6e61de = _0x4bc4a8),
      (_0x1e8a0e = _0x6f67e4),
      _0xd3ae50['appendChild'](_0x5f0f6f),
      _0x5f0f6f['classList']['add']('is-portaled', 'is-open'),
      _0x5f0f6f['setAttribute']('aria-hidden', 'false'),
      _0x3f5d23(),
      !![]
    );
  }
  return (
    windowObject?.['addEventListener']?.('resize', _0x46996f),
    _0xd3ae50?.['addEventListener']?.('scroll', _0x15faee, !![]),
    Object['freeze']({
      closeAppearance: _0x4a4129,
      openAppearance: _0x75afab,
      closeTarget: _0x5b4210,
      toggleTarget: _0x3671be,
      reposition: _0x15faee,
      destroy() {
        (_0x5b4210(), windowObject?.['removeEventListener']?.('resize', _0x46996f));
        if (_0x1d8bfc) windowObject?.['cancelAnimationFrame']?.(_0x1d8bfc);
        _0xd3ae50?.['removeEventListener']?.('scroll', _0x15faee, !![]);
      },
    })
  );
}
