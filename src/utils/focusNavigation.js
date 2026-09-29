const NAVIGATION_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']),
  ATTRIBUTE = 'data-focus-navigation';
export function createFocusNavigation() {
  const _0x58164c = new Set();
  let _0x9fca14 = 'pointer',
    _0x41d290 = null,
    _0x2be354 = null;
  const _0x237f57 = (_0x58e794) => {
      if (_0x9fca14 === _0x58e794) return;
      ((_0x9fca14 = _0x58e794),
        _0x58164c['forEach']((_0x5f5418) => _0x5f5418['setAttribute']?.(ATTRIBUTE, _0x9fca14)));
    },
    _0x49e459 = (_0x268247) => {
      if (_0x268247['isComposing'] || _0x268247['altKey'] || _0x268247['ctrlKey'] || _0x268247['metaKey'])
        return;
      if (!NAVIGATION_KEYS['has'](_0x268247['key'])) return;
      [..._0x58164c]['some'](
        (_0x131816) => _0x131816 === _0x268247['target'] || _0x131816['contains']?.(_0x268247['target']),
      ) && _0x237f57('keyboard');
    },
    _0x583172 = () => _0x237f57('pointer'),
    _0x27f9b9 = (_0x15bf9e) => {
      const _0x261455 =
        !_0x2be354 || _0x2be354['x'] !== _0x15bf9e['clientX'] || _0x2be354['y'] !== _0x15bf9e['clientY'];
      _0x2be354 = { x: _0x15bf9e['clientX'], y: _0x15bf9e['clientY'] };
      if (_0x261455 || _0x15bf9e['movementX'] || _0x15bf9e['movementY']) _0x237f57('pointer');
    },
    _0x2fa5f0 = (_0x1b841e) => {
      if (!_0x58164c['delete'](_0x1b841e)) return;
      (_0x1b841e['removeEventListener']?.('pointerdown', _0x583172, !![]),
        _0x1b841e['removeEventListener']?.('pointermove', _0x27f9b9, !![]),
        _0x1b841e['removeAttribute']?.(ATTRIBUTE),
        !_0x58164c['size'] &&
          (_0x41d290?.['removeEventListener']?.('keydown', _0x49e459, !![]),
          (_0x41d290 = null),
          (_0x9fca14 = 'pointer'),
          (_0x2be354 = null)));
    };
  return {
    addRoot(_0x4faa25) {
      if (!_0x4faa25 || _0x58164c['has'](_0x4faa25)) return;
      (!_0x58164c['size'] &&
        ((_0x41d290 = _0x4faa25['ownerDocument']?.['defaultView'] || globalThis['window']),
        _0x41d290?.['addEventListener']?.('keydown', _0x49e459, !![])),
        _0x58164c['add'](_0x4faa25),
        _0x4faa25['setAttribute']?.(ATTRIBUTE, _0x9fca14),
        _0x4faa25['addEventListener']('pointerdown', _0x583172, !![]),
        _0x4faa25['addEventListener']('pointermove', _0x27f9b9, !![]));
    },
    removeRoot: _0x2fa5f0,
    destroy() {
      [..._0x58164c]['forEach'](_0x2fa5f0);
    },
  };
}
