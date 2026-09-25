function findOutlineSection(_0x118403, _0x241f1a) {
  return (
    [..._0x118403['querySelectorAll']('[data-story-outline-section]')]['find'](
      (_0x2ee34c) => _0x2ee34c['dataset']['storyOutlineSection'] === _0x241f1a,
    ) || null
  );
}
export function jumpToStoryOutlineSection(
  _0x484db7,
  _0xaf30bb,
  { windowObject: windowObject = globalThis['window'] } = {},
) {
  const _0x315967 = findOutlineSection(_0x484db7, _0xaf30bb);
  if (!_0x315967) return ![];
  const _0xb39a04 = () => _0x315967['scrollIntoView']?.({ behavior: 'smooth', block: 'start' });
  return (
    typeof windowObject?.['requestAnimationFrame'] === 'function'
      ? windowObject['requestAnimationFrame'](_0xb39a04)
      : _0xb39a04(),
    !![]
  );
}
export function bindStoryOutlineNavigation(
  _0x146995,
  { windowObject: windowObject = globalThis['window'] } = {},
) {
  const _0x3aaa65 = _0x146995?.['querySelector']?.('[data-story-outline-nav]');
  if (!_0x3aaa65) return null;
  const _0x469952 = _0x3aaa65['querySelector']('[data-story-outline-nav-toggle]'),
    _0x4cc70a = _0x146995['ownerDocument'];
  let _0x365f9f = ![],
    _0x7f1b81 = ![],
    _0x419686 = 0x0,
    _0x3d0911 = 0x0;
  const _0x19081d = (_0x475038) => {
      _0x469952?.['setAttribute']('aria-expanded', String(_0x475038));
    },
    _0x52f2e0 = () => {
      if (!_0x3d0911) return;
      (windowObject['clearTimeout'](_0x3d0911), (_0x3d0911 = 0x0));
    },
    _0x189c0d = (_0x43eaff) => {
      ((_0x7f1b81 = Boolean(_0x43eaff)),
        _0x3aaa65['classList']['toggle']('is-hover-open', _0x7f1b81),
        _0x19081d(_0x7f1b81 || _0x365f9f || _0x3aaa65['contains'](_0x4cc70a['activeElement'])));
    },
    _0x1f9aed = (_0x3ea342) => {
      ((_0x365f9f = Boolean(_0x3ea342)),
        _0x3aaa65['classList']['toggle']('is-pinned', _0x365f9f),
        _0x19081d(
          _0x365f9f ||
            _0x7f1b81 ||
            _0x3aaa65['matches'](':hover') ||
            _0x3aaa65['contains'](_0x4cc70a['activeElement']),
        ));
    },
    _0x351211 = (_0x1fe865) => {
      (_0x1fe865['preventDefault'](), _0x1f9aed(!_0x365f9f));
    },
    _0x318ab1 = () => {
      (_0x52f2e0(), _0x189c0d(!![]));
    },
    _0x3a318d = () => {
      _0x52f2e0();
      if (_0x365f9f) return;
      _0x3d0911 = windowObject['setTimeout'](() => {
        ((_0x3d0911 = 0x0), _0x189c0d(![]));
      }, 0xb4);
    },
    _0x2bcb40 = () => _0x19081d(!![]),
    _0x282180 = () => {
      if (_0x419686) windowObject['clearTimeout'](_0x419686);
      _0x419686 = windowObject['setTimeout'](() => {
        ((_0x419686 = 0x0), _0x19081d(_0x365f9f || _0x3aaa65['contains'](_0x4cc70a['activeElement'])));
      }, 0x0);
    },
    _0x4ec5d3 = (_0x57abba) => {
      const _0x4b0da9 = _0x57abba['target']['closest']?.('[data-story-outline-nav-target]');
      if (_0x4b0da9 && _0x3aaa65['contains'](_0x4b0da9)) {
        (_0x57abba['preventDefault'](),
          jumpToStoryOutlineSection(_0x146995, _0x4b0da9['dataset']['storyOutlineNavTarget'], {
            windowObject: windowObject,
          }));
        return;
      }
      !_0x3aaa65['contains'](_0x57abba['target']) && (_0x52f2e0(), _0x189c0d(![]), _0x1f9aed(![]));
    },
    _0xf36423 = (_0x14ff3c) => {
      if (_0x14ff3c['key'] !== 'Escape') return;
      (_0x52f2e0(), _0x189c0d(![]), _0x1f9aed(![]), _0x4cc70a['activeElement']?.['blur']?.());
    };
  return (
    _0x469952?.['addEventListener']('click', _0x351211),
    _0x3aaa65['addEventListener']('pointerenter', _0x318ab1),
    _0x3aaa65['addEventListener']('pointerleave', _0x3a318d),
    _0x3aaa65['addEventListener']('focusin', _0x2bcb40),
    _0x3aaa65['addEventListener']('focusout', _0x282180),
    _0x3aaa65['addEventListener']('keydown', _0xf36423),
    _0x146995['addEventListener']('click', _0x4ec5d3),
    {
      destroy() {
        if (_0x419686) windowObject['clearTimeout'](_0x419686);
        (_0x52f2e0(),
          _0x469952?.['removeEventListener']('click', _0x351211),
          _0x3aaa65['removeEventListener']('pointerenter', _0x318ab1),
          _0x3aaa65['removeEventListener']('pointerleave', _0x3a318d),
          _0x3aaa65['removeEventListener']('focusin', _0x2bcb40),
          _0x3aaa65['removeEventListener']('focusout', _0x282180),
          _0x3aaa65['removeEventListener']('keydown', _0xf36423),
          _0x146995['removeEventListener']('click', _0x4ec5d3));
      },
    }
  );
}
