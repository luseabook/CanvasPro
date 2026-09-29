import { resolveCanvasImageSourceUrl } from '../services/canvasMediaLocalService.js';
import { firstNonEmpty } from '../utils/validators.js';
const caches = new WeakMap();
export function getComparisonOriginalKey(_0x45a87d) {
  const _0x36e452 = Array['isArray'](_0x45a87d?.['images'])
      ? _0x45a87d['images'][_0x45a87d['mainImageIndex'] || 0x0]
      : null,
    _0x664126 = firstNonEmpty(_0x36e452?.['sourceId'], _0x45a87d?.['sourceId']),
    _0x2067f8 = resolveCanvasImageSourceUrl(_0x36e452) || resolveCanvasImageSourceUrl(_0x45a87d);
  return _0x664126 || _0x2067f8 ? JSON['stringify']([_0x664126, _0x2067f8]) : '';
}
export function createComparisonImageCache({
  maxBytes: maxBytes = 0x100 * 0x400 * 0x400,
  maxEntries: maxEntries = 0x4,
  ttlMs: ttlMs = 0x1d4c0,
  now: now = Date['now'],
  schedule: schedule = setTimeout,
  cancel: cancel = clearTimeout,
  revoke: revoke = (_0x13c50f) => URL['revokeObjectURL'](_0x13c50f),
} = {}) {
  const _0x238094 = new Map();
  let _0x510853 = 0x0,
    _0x43af66 = null,
    _0x3da0b7 = 0x0;
  function _0x7a4a5b(_0x94afc, _0x324471 = '') {
    const _0x194af1 = _0x238094['get'](_0x94afc);
    if (!_0x194af1) return;
    (_0x238094['delete'](_0x94afc),
      (_0x510853 -= _0x194af1['bytes']),
      _0x194af1['image']['removeAttribute']?.('src'));
    if (_0x194af1['revokeUrlOnClose'] && _0x194af1['url'] !== _0x324471) revoke(_0x194af1['url']);
  }
  function _0x5e71f5() {
    for (const [_0x479626, _0x3f1eb2] of _0x238094) {
      if (_0x3f1eb2['expiresAt'] <= now()) _0x7a4a5b(_0x479626);
    }
  }
  function _0x5ab955() {
    if (_0x43af66 !== null) cancel(_0x43af66);
    _0x43af66 = null;
    if (!_0x238094['size']) return;
    const _0x54d354 = Math['min'](
      ...[..._0x238094['values']()]['map']((_0x16ce3b) => _0x16ce3b['expiresAt']),
    );
    ((_0x43af66 = schedule(
      () => {
        (_0x5e71f5(), _0x5ab955());
      },
      Math['max'](0x1, _0x54d354 - now()),
    )),
      _0x43af66?.['unref']?.());
  }
  function _0x516d2f() {
    _0x3da0b7++;
    for (const _0x5e80a9 of _0x238094['keys']()) _0x7a4a5b(_0x5e80a9);
    _0x5ab955();
  }
  return {
    get generation() {
      return _0x3da0b7;
    },
    clear: _0x516d2f,
    take(_0x211381) {
      _0x5e71f5();
      const _0xea0bf0 = _0x238094['get'](_0x211381);
      return (
        _0xea0bf0 && (_0x238094['delete'](_0x211381), (_0x510853 -= _0xea0bf0['bytes'])),
        _0x5ab955(),
        _0xea0bf0 || null
      );
    },
    put(_0x4b8e8a, _0x50e9e9, _0x3abc16 = _0x3da0b7) {
      const { image: _0x4f525d, url: _0x38235e } = _0x50e9e9,
        _0x24e5d7 = Number(_0x4f525d?.['naturalWidth']) * Number(_0x4f525d?.['naturalHeight']) * 0x4;
      if (
        _0x3abc16 !== _0x3da0b7 ||
        !_0x4b8e8a ||
        !_0x38235e ||
        !_0x4f525d?.['complete'] ||
        !Number['isFinite'](_0x24e5d7) ||
        _0x24e5d7 <= 0x0 ||
        _0x24e5d7 > maxBytes ||
        maxEntries < 0x1
      )
        return ![];
      _0x5e71f5();
      if (_0x238094['get'](_0x4b8e8a)?.['image'] === _0x4f525d) return !![];
      const _0x17975a = _0x238094['get'](_0x4b8e8a),
        _0x1f09a0 =
          _0x50e9e9['revokeUrlOnClose'] ||
          (_0x17975a?.['url'] === _0x38235e && _0x17975a['revokeUrlOnClose']);
      _0x7a4a5b(_0x4b8e8a, _0x38235e);
      while (_0x238094['size'] && (_0x510853 + _0x24e5d7 > maxBytes || _0x238094['size'] >= maxEntries)) {
        _0x7a4a5b(_0x238094['keys']()['next']()['value']);
      }
      return (
        _0x4f525d['remove']?.(),
        _0x238094['set'](_0x4b8e8a, {
          ..._0x50e9e9,
          revokeUrlOnClose: _0x1f09a0,
          bytes: _0x24e5d7,
          expiresAt: now() + ttlMs,
        }),
        (_0x510853 += _0x24e5d7),
        _0x5ab955(),
        !![]
      );
    },
  };
}
export function getComparisonImageCache(_0x30575b) {
  let _0x47a54b = caches['get'](_0x30575b);
  return (
    !_0x47a54b &&
      ((_0x47a54b = createComparisonImageCache()),
      caches['set'](_0x30575b, _0x47a54b),
      _0x30575b['defaultView']?.['addEventListener']('aicanvas:active-canvas-changed', _0x47a54b['clear']),
      _0x30575b['defaultView']?.['addEventListener']('pagehide', _0x47a54b['clear'])),
    _0x47a54b
  );
}
