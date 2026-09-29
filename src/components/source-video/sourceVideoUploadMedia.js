import { getAutoMediaSizeByShortSide } from '../../services/fileService.js';
function normalizeUploadMediaDimensions(_0x116f0b, _0x482c65) {
  const _0x32dbf1 = Math['round'](Number(_0x116f0b) || 0x0),
    _0x4f1777 = Math['round'](Number(_0x482c65) || 0x0);
  if (_0x32dbf1 <= 0x0 || _0x4f1777 <= 0x0) return null;
  return { width: _0x32dbf1, height: _0x4f1777 };
}
export function buildSourceVideoUploadSizePatch(..._0x836e82) {
  for (const _0xfb5c45 of _0x836e82) {
    const _0x4f84c7 = normalizeUploadMediaDimensions(_0xfb5c45?.['width'], _0xfb5c45?.['height']);
    if (!_0x4f84c7) continue;
    const _0x469c6e = getAutoMediaSizeByShortSide(_0x4f84c7['width'], _0x4f84c7['height']);
    return {
      width: _0x469c6e['width'],
      height: _0x469c6e['height'],
      videoWidth: _0x4f84c7['width'],
      videoHeight: _0x4f84c7['height'],
      needsAutoResize: ![],
    };
  }
  return { needsAutoResize: !![] };
}
export function readVideoFileNaturalSize(_0x1abe5d) {
  const _0x172080 = globalThis['document'];
  if (!_0x1abe5d || typeof _0x172080?.['createElement'] !== 'function') return Promise['resolve'](null);
  const _0x256f86 = globalThis['window']?.['URL'] || globalThis['URL'];
  if (typeof _0x256f86?.['createObjectURL'] !== 'function') return Promise['resolve'](null);
  let _0xe11020 = '';
  try {
    _0xe11020 = _0x256f86['createObjectURL'](_0x1abe5d);
  } catch {
    return Promise['resolve'](null);
  }
  return new Promise((_0x4536db) => {
    const _0xd784f = _0x172080['createElement']('video');
    let _0x26cbbb = ![],
      _0x262431 = null;
    const _0x1bce3a = (_0x4627db) => {
        if (_0x26cbbb) return;
        _0x26cbbb = !![];
        if (_0x262431) clearTimeout(_0x262431);
        (_0x4ce709(), _0x4536db(_0x4627db));
      },
      _0x4ce709 = () => {
        _0xd784f['removeAttribute']?.('src');
        try {
          _0xd784f['load']?.();
        } catch {}
        try {
          _0x256f86['revokeObjectURL'](_0xe11020);
        } catch {}
      };
    ((_0xd784f['preload'] = 'metadata'),
      (_0xd784f['muted'] = !![]),
      (_0xd784f['onloadedmetadata'] = () => {
        const _0x5139fc = normalizeUploadMediaDimensions(_0xd784f['videoWidth'], _0xd784f['videoHeight']),
          _0x59c137 = Number(_0xd784f['duration'] || 0x0),
          _0x107691 = Number['isFinite'](_0x59c137) && _0x59c137 > 0x0 ? { duration: _0x59c137 } : {};
        _0x1bce3a(_0x5139fc ? { ..._0x5139fc, ..._0x107691 } : _0x107691['duration'] ? _0x107691 : null);
      }),
      (_0xd784f['onerror'] = () => _0x1bce3a(null)),
      (_0x262431 = setTimeout(() => _0x1bce3a(null), 0xbb8)),
      (_0xd784f['src'] = _0xe11020));
  });
}
export function createVideoCapturePreviewUrl(_0x5ccfba) {
  if (!_0x5ccfba || !String(_0x5ccfba['type'] || '')['startsWith']('video/')) return '';
  const _0x3725c8 = globalThis['window']?.['URL'] || globalThis['URL'];
  if (typeof _0x3725c8?.['createObjectURL'] !== 'function') return '';
  try {
    return _0x3725c8['createObjectURL'](_0x5ccfba);
  } catch {
    return '';
  }
}
export function waitForNextPaint() {
  const _0x4fdb0d = globalThis['window']?.['requestAnimationFrame'] || globalThis['requestAnimationFrame'];
  if (typeof _0x4fdb0d === 'function')
    return new Promise((_0x3744a6) => {
      let _0xc91458 = ![],
        _0x773bab = null;
      const _0x110a8b = () => {
        if (_0xc91458) return;
        _0xc91458 = !![];
        if (_0x773bab) clearTimeout(_0x773bab);
        _0x3744a6();
      };
      ((_0x773bab = setTimeout(_0x110a8b, 0x32)), _0x4fdb0d(_0x110a8b));
    });
  return new Promise((_0x48ad95) => setTimeout(_0x48ad95, 0x0));
}
