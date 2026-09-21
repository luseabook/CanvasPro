function isBlobLike(_0x3eadfe) {
  return !!_0x3eadfe && typeof _0x3eadfe.arrayBuffer === 'function';
}
function normalizeImageMimeType(_0x654132) {
  const _0x567e26 = String(_0x654132 || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!_0x567e26.startsWith('image/')) return '';
  return _0x567e26;
}
function inferImageMimeTypeFromUrl(_0x4bd419) {
  const _0x4a29aa = String(_0x4bd419 || '').trim();
  if (!_0x4a29aa) return '';
  const _0x384525 = _0x4a29aa.match(/^data:([^;,]+)/i),
    _0x2bdf9c = normalizeImageMimeType(_0x384525?.[1] || '');
  if (_0x2bdf9c) return _0x2bdf9c;
  const _0xae5ee0 = _0x4a29aa.toLowerCase().split('#')[0].split('?')[0];
  if (_0xae5ee0.endsWith('.png')) return 'image/png';
  if (_0xae5ee0.endsWith('.jpg') || _0xae5ee0.endsWith('.jpeg')) return 'image/jpeg';
  if (_0xae5ee0.endsWith('.webp')) return 'image/webp';
  if (_0xae5ee0.endsWith('.gif')) return 'image/gif';
  if (_0xae5ee0.endsWith('.bmp')) return 'image/bmp';
  if (_0xae5ee0.endsWith('.avif')) return 'image/avif';
  if (_0xae5ee0.endsWith('.svg')) return 'image/svg+xml';
  return '';
}
function resolveImageMimeType(_0x4228f0, _0x52257a) {
  return normalizeImageMimeType(_0x4228f0?.type) || inferImageMimeTypeFromUrl(_0x52257a);
}
function hasDomCanvasRuntime() {
  return (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function' &&
    typeof globalThis?.Image === 'function'
  );
}
function loadImage(_0x705667) {
  return new Promise((_0x3fe9ae, _0x956900) => {
    const _0x34db35 = globalThis?.Image;
    if (typeof _0x34db35 !== 'function') {
      _0x956900(new Error('image-not-supported'));
      return;
    }
    const _0x24a8ee = new _0x34db35();
    ('crossOrigin' in _0x24a8ee && (_0x24a8ee.crossOrigin = 'anonymous'),
      (_0x24a8ee.onload = () => _0x3fe9ae(_0x24a8ee)),
      (_0x24a8ee.onerror = () => _0x956900(new Error('image-load-failed'))),
      (_0x24a8ee.src = _0x705667));
  });
}
function canvasToBlob(_0x2e00f1, _0x29319b = 'image/png') {
  return new Promise((_0x15b9e3) => {
    if (!_0x2e00f1 || typeof _0x2e00f1.toBlob !== 'function') {
      _0x15b9e3(null);
      return;
    }
    _0x2e00f1.toBlob((_0x29f379) => _0x15b9e3(_0x29f379), _0x29319b);
  });
}
async function renderImageElementToPngBlob(_0x1d115a) {
  if (!hasDomCanvasRuntime()) return null;
  const _0x396166 = Number(_0x1d115a?.naturalWidth || _0x1d115a?.width || 0),
    _0x1ce5fb = Number(_0x1d115a?.naturalHeight || _0x1d115a?.height || 0);
  if (!_0x396166 || !_0x1ce5fb) return null;
  const _0x4a7539 = document.createElement('canvas');
  ((_0x4a7539.width = _0x396166), (_0x4a7539.height = _0x1ce5fb));
  const _0x142483 = _0x4a7539.getContext('2d');
  if (!_0x142483) return null;
  return (_0x142483.drawImage(_0x1d115a, 0, 0), canvasToBlob(_0x4a7539, 'image/png'));
}
async function convertImageBlobToPngBlob(_0x5e6ee1) {
  if (!isBlobLike(_0x5e6ee1)) return null;
  const _0x389839 = globalThis?.createImageBitmap,
    _0x556351 = globalThis?.OffscreenCanvas;
  if (typeof _0x389839 === 'function' && typeof _0x556351 === 'function') {
    let _0x1b042b = null;
    try {
      _0x1b042b = await _0x389839(_0x5e6ee1);
      const _0x251027 = Number(_0x1b042b?.width || 0),
        _0x58d922 = Number(_0x1b042b?.height || 0);
      if (!_0x251027 || !_0x58d922) return null;
      const _0x57caf9 = new _0x556351(_0x251027, _0x58d922),
        _0x596608 = _0x57caf9.getContext('2d');
      if (!_0x596608) return null;
      _0x596608.drawImage(_0x1b042b, 0, 0);
      if (typeof _0x57caf9.convertToBlob === 'function')
        return await _0x57caf9.convertToBlob({ type: 'image/png' });
    } catch {
    } finally {
      _0x1b042b?.close?.();
    }
  }
  if (!hasDomCanvasRuntime()) return null;
  const _0x5da7b9 = globalThis?.URL;
  if (typeof _0x5da7b9?.createObjectURL !== 'function') return null;
  const _0x17f5f4 = _0x5da7b9.createObjectURL(_0x5e6ee1);
  try {
    const _0x1b0485 = await loadImage(_0x17f5f4);
    return await renderImageElementToPngBlob(_0x1b0485);
  } catch {
    return null;
  } finally {
    _0x5da7b9.revokeObjectURL?.(_0x17f5f4);
  }
}
async function convertImageUrlToPngBlob(_0x46c01e) {
  if (!hasDomCanvasRuntime()) return null;
  try {
    const _0x5a014a = await loadImage(_0x46c01e);
    return await renderImageElementToPngBlob(_0x5a014a);
  } catch {
    return null;
  }
}
export {
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  inferImageMimeTypeFromUrl,
  isBlobLike,
  normalizeImageMimeType,
  resolveImageMimeType,
};
