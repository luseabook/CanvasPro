export function createWorkspacePresentationLifecycle({
  getRoot: _0x2112f2,
  getContentKey: getContentKey = null,
  initiallyActive: initiallyActive = ![],
} = {}) {
  let _0x7079b5 = initiallyActive,
    _0xf479b5 = ![],
    _0x52d628 = null,
    _0x101324 = null,
    _0x460a5f = !![];
  const _0x2d1a8e = new Set(),
    _0x4bf510 = (_0x5b9e81) => {
      if (!['VIDEO', 'AUDIO']['includes'](_0x5b9e81?.['tagName'])) return;
      try {
        _0x5b9e81['pause']();
      } catch {}
    },
    _0x4381a9 = (_0x4336cb) => {
      if (!_0x7079b5) _0x4bf510(_0x4336cb['target']);
    },
    _0x3a47e9 = () => {
      const _0x23a05e = _0x2112f2?.() || null;
      return (
        _0x23a05e !== _0x52d628 &&
          (_0x52d628?.['removeEventListener']?.('play', _0x4381a9, !![]),
          (_0x52d628 = _0x23a05e),
          _0x23a05e?.['addEventListener']?.('play', _0x4381a9, !![])),
        _0x23a05e
      );
    },
    _0x2d13cc = () => {
      try {
        return getContentKey?.() ?? null;
      } catch {
        return null;
      }
    };
  return {
    isActive: () => _0x7079b5 && !_0xf479b5,
    invalidate: () => {
      _0x460a5f = !![];
    },
    activate() {
      if (_0xf479b5) return ![];
      const _0x36adb0 = _0x2d13cc(),
        _0x37b2cc = _0x460a5f || _0x36adb0 === null || _0x36adb0 !== _0x101324;
      ((_0x7079b5 = !![]), (_0x460a5f = ![]));
      const _0x3e9f44 = _0x3a47e9();
      _0x3e9f44 && ((_0x3e9f44['hidden'] = ![]), _0x3e9f44['setAttribute']?.('aria-hidden', 'false'));
      for (const _0x338533 of _0x2d1a8e) {
        if (_0x338533['effect']?.['target']?.['isConnected'] && _0x338533['playState'] === 'paused')
          try {
            _0x338533['play']();
          } catch {}
      }
      return (_0x2d1a8e['clear'](), _0x37b2cc);
    },
    deactivate() {
      if (_0xf479b5) return;
      if (_0x7079b5) _0x101324 = _0x2d13cc();
      _0x7079b5 = ![];
      const _0x3d073d = _0x3a47e9();
      _0x3d073d?.['querySelectorAll']?.('video, audio')['forEach'](_0x4bf510);
      for (const _0x55a58d of _0x3d073d?.['getAnimations']?.({ subtree: !![] }) || []) {
        if (_0x55a58d['playState'] !== 'running') continue;
        try {
          (_0x55a58d['pause'](), _0x2d1a8e['add'](_0x55a58d));
        } catch {}
      }
      _0x3d073d && ((_0x3d073d['hidden'] = !![]), _0x3d073d['setAttribute']?.('aria-hidden', 'true'));
    },
    dispose() {
      (this['deactivate'](),
        (_0xf479b5 = !![]),
        _0x52d628?.['removeEventListener']?.('play', _0x4381a9, !![]),
        (_0x52d628 = null),
        (_0x101324 = null),
        _0x2d1a8e['clear']());
    },
  };
}
