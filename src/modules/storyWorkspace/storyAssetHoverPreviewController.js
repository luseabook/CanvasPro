function normalizeText(_0x3c01bd) {
  return String(_0x3c01bd ?? '')['trim']();
}
export function createStoryAssetHoverPreviewController({
  previewElement: _0x251ff4,
  getState: _0x2cc04f,
  getSelectedAppearance: _0x52f2b3,
  buildContent: _0x3a6585,
  isStoryAssetHoverLandscape: _0x188fd8,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    typeof _0x2cc04f !== 'function' ||
    typeof _0x52f2b3 !== 'function' ||
    typeof _0x3a6585 !== 'function' ||
    typeof _0x188fd8 !== 'function'
  )
    throw new Error('story asset hover preview requires presentation adapters');
  let _0x508a3c = 0x0,
    _0x2f8146 = 0x0,
    _0x5a33c2 = 0x0,
    _0x3213c9 = null,
    _0x41e3ff = '',
    _0x4ab60b = ![];
  const _0x382f51 = () => {
      _0x508a3c = 0x0;
      if (!_0x251ff4?.['classList']['contains']('is-visible')) return;
      const _0x2fb296 = _0x251ff4['getBoundingClientRect'](),
        _0x1585ce = windowObject['innerWidth'] || documentObject['documentElement']?.['clientWidth'] || 0x400,
        _0x3247b3 =
          windowObject['innerHeight'] || documentObject['documentElement']?.['clientHeight'] || 0x300,
        _0x567d99 = 0xe,
        _0x44cd20 = 0xa,
        _0x542d7d = Math['max'](_0x44cd20, _0x1585ce - _0x2fb296['width'] - _0x44cd20),
        _0x57dfa9 = Math['max'](_0x44cd20, _0x3247b3 - _0x2fb296['height'] - _0x44cd20),
        _0x4bac5c = _0x3213c9?.['getBoundingClientRect']?.();
      let _0x3380f5 = Math['min'](Math['max'](_0x44cd20, _0x2f8146 + _0x567d99), _0x542d7d),
        _0x1efc1e = Math['min'](Math['max'](_0x44cd20, _0x5a33c2 + _0x567d99), _0x57dfa9);
      if (_0x4bac5c) {
        const _0x19911c = _0x4bac5c['right'] + _0x567d99,
          _0x9cf3f2 = _0x4bac5c['left'] - _0x2fb296['width'] - _0x567d99;
        if (_0x19911c <= _0x542d7d) _0x3380f5 = _0x19911c;
        else {
          if (_0x9cf3f2 >= _0x44cd20) _0x3380f5 = _0x9cf3f2;
          else {
            const _0x4aab0b = _0x4bac5c['bottom'] + _0x567d99,
              _0x167070 = _0x4bac5c['top'] - _0x2fb296['height'] - _0x567d99;
            _0x3380f5 = Math['min'](Math['max'](_0x44cd20, _0x2f8146 - _0x2fb296['width'] / 0x2), _0x542d7d);
            if (_0x4aab0b <= _0x57dfa9) _0x1efc1e = _0x4aab0b;
            else {
              if (_0x167070 >= _0x44cd20) _0x1efc1e = _0x167070;
            }
          }
        }
        (_0x3380f5 === _0x19911c || _0x3380f5 === _0x9cf3f2) &&
          (_0x1efc1e = Math['min'](Math['max'](_0x44cd20, _0x5a33c2 - 0x12), _0x57dfa9));
      }
      ((_0x251ff4['style']['left'] = Math['round'](_0x3380f5) + 'px'),
        (_0x251ff4['style']['top'] = Math['round'](_0x1efc1e) + 'px'));
    },
    _0x319375 = (_0x541046) => {
      ((_0x2f8146 = Number(_0x541046?.['clientX'] || 0x0)),
        (_0x5a33c2 = Number(_0x541046?.['clientY'] || 0x0)));
      if (_0x508a3c) return;
      if (typeof windowObject['requestAnimationFrame'] === 'function') {
        _0x508a3c = windowObject['requestAnimationFrame'](_0x382f51);
        return;
      }
      _0x382f51();
    },
    _0xe365ee = (_0x50ea00) => {
      if (!_0x50ea00) return;
      const _0x7570b1 = _0x188fd8(_0x50ea00['naturalWidth'], _0x50ea00['naturalHeight']);
      (_0x50ea00['closest']('.story-asset-hover-preview-item')?.['classList']['toggle'](
        'is-landscape',
        _0x7570b1,
      ),
        _0x50ea00['closest']('.story-asset-hover-preview-cell')?.['classList']['toggle'](
          'is-landscape',
          _0x7570b1,
        ));
      if (_0x251ff4?.['classList']['contains']('is-visible')) _0x382f51();
    },
    _0x2c22d4 = () => {
      _0x251ff4?.['querySelectorAll']('[data-story-asset-hover-image]')['forEach']((_0x5e8139) => {
        if (_0x5e8139['complete'] && Number(_0x5e8139['naturalWidth']) > 0x0) {
          _0xe365ee(_0x5e8139);
          return;
        }
        _0x5e8139['addEventListener']('load', () => _0xe365ee(_0x5e8139), { once: !![] });
      });
    },
    _0x40d934 = (_0x474e92, _0x2a6073 = '') => {
      if (!_0x251ff4 || !_0x474e92 || _0x474e92['mediaKind'] === 'audio') return ![];
      const _0x5c3c8d = _0x2cc04f(),
        _0x5a7062 = _0x52f2b3(_0x5c3c8d, _0x474e92),
        _0x5abb5f = _0x3a6585(_0x474e92, {
          appearanceId: _0x2a6073,
          selectedAssetId: _0x5c3c8d['selectedAssetId'],
          selectedAppearanceId: _0x5a7062?.['id'],
        });
      if (!_0x5abb5f)
        return (
          (_0x251ff4['innerHTML'] = ''),
          (_0x251ff4['dataset']['assetId'] = ''),
          (_0x251ff4['dataset']['signature'] = ''),
          ![]
        );
      const _0x59158d = [
        normalizeText(_0x2a6073) + ':' + (_0x5a7062?.['id'] || ''),
        (_0x474e92['baseAppearanceId'] || '') + ':' + _0x5abb5f['hasVoice'],
        _0x5abb5f['appearances']
          ['map']((_0x2048be) => (_0x2048be?.['id'] || '') + ':' + normalizeText(_0x2048be?.['imageUrl']))
          ['join']('|'),
      ]['join'](':');
      if (
        _0x251ff4['dataset']['assetId'] === String(_0x474e92['id']) &&
        _0x251ff4['dataset']['signature'] === _0x59158d
      )
        return !![];
      return (
        (_0x251ff4['dataset']['assetId'] = String(_0x474e92['id'])),
        (_0x251ff4['dataset']['signature'] = _0x59158d),
        _0x251ff4['style']['setProperty']('--story-asset-hover-columns', String(_0x5abb5f['columns'])),
        (_0x251ff4['innerHTML'] = _0x5abb5f['html']),
        _0x2c22d4(),
        !![]
      );
    },
    _0x5baf74 = () => {
      ((_0x41e3ff = ''),
        (_0x3213c9 = null),
        _0x251ff4?.['classList']['remove']('is-visible'),
        _0x251ff4?.['setAttribute']('aria-hidden', 'true'));
    };
  return Object['freeze']({
    show(_0x4d1061, _0x29b309, _0x357d1f, _0x1762e0 = '') {
      if (_0x4ab60b || !_0x251ff4 || _0x29b309?.['pointerType'] === 'touch') return ![];
      if (!_0x357d1f) return (_0x5baf74(), ![]);
      ((_0x3213c9 = _0x4d1061?.['closest']?.('.at-mention-menu') || null),
        (_0x41e3ff = String(_0x357d1f['id'])));
      if (!_0x40d934(_0x357d1f, _0x1762e0)) return (_0x5baf74(), ![]);
      return (
        _0x251ff4['classList']['add']('is-visible'),
        _0x251ff4['setAttribute']('aria-hidden', 'false'),
        _0x319375(_0x29b309),
        !![]
      );
    },
    hide: _0x5baf74,
    getHoveredAssetId: () => _0x41e3ff,
    destroy() {
      if (_0x4ab60b) return;
      (_0x5baf74(),
        _0x508a3c &&
          typeof windowObject['cancelAnimationFrame'] === 'function' &&
          windowObject['cancelAnimationFrame'](_0x508a3c),
        (_0x508a3c = 0x0),
        (_0x4ab60b = !![]));
    },
  });
}
