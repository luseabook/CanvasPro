import * as threeRuntime from './threeRuntime.js';
import { fetchRemoteBlob } from '../../../api/projectsV2Api.js';
const PANORAMA_TEXTURE_FETCH_TIMEOUT_MS = 0x3a98;
function createAbortError() {
  if (typeof DOMException === 'function')
    return new DOMException('Panorama\x20texture\x20load\x20aborted', 'AbortError');
  const _0x212fcf = new Error('Panorama\x20texture\x20load\x20aborted');
  return ((_0x212fcf['name'] = 'AbortError'), _0x212fcf);
}
function isUsableBlob(_0x2d7a93) {
  return Boolean(_0x2d7a93 && typeof _0x2d7a93['arrayBuffer'] === 'function');
}
function createTextureFromImageBitmap(_0xe28143) {
  const _0x3570fc = Number(_0xe28143?.['width']) || 0x0,
    _0x245f4d = Number(_0xe28143?.['height']) || 0x0;
  if (_0x3570fc <= 0x0 || _0x245f4d <= 0x0) return (_0xe28143?.['close']?.(), null);
  const _0x2cd03b = new threeRuntime['Texture'](_0xe28143);
  _0x2cd03b['flipY'] = ![];
  let _0x1766b5 = ![];
  const _0x2761f9 = () => {
    if (_0x1766b5) return;
    ((_0x1766b5 = !![]), _0x2cd03b['removeEventListener']?.('dispose', _0x2761f9), _0xe28143?.['close']?.());
  };
  return (_0x2cd03b['addEventListener']?.('dispose', _0x2761f9), _0x2cd03b);
}
function loadTextureWithTextureLoader(_0x2a2329, _0x204afa, _0x21d481) {
  if (!_0x204afa || typeof _0x204afa['load'] !== 'function')
    return Promise['reject'](new Error('Panorama texture loader is unavailable'));
  if (_0x21d481?.['aborted']) return Promise['reject'](createAbortError());
  return new Promise((_0x1b469f, _0x27e189) => {
    let _0x14df6b = ![];
    const _0x40eb7e = () => _0x21d481?.['removeEventListener']?.('abort', _0x3ee5),
      _0x21e7e6 = (_0xed9b59) => {
        if (_0x14df6b) {
          _0xed9b59?.['dispose']?.();
          return;
        }
        ((_0x14df6b = !![]), _0x40eb7e(), _0x1b469f(_0xed9b59));
      },
      _0x7cd571 = (_0x536a70) => {
        if (_0x14df6b) return;
        ((_0x14df6b = !![]),
          _0x40eb7e(),
          _0x27e189(_0x536a70 instanceof Error ? _0x536a70 : new Error('Panorama texture load failed')));
      },
      _0x3ee5 = () => _0x7cd571(createAbortError());
    _0x21d481?.['addEventListener']?.('abort', _0x3ee5, { once: !![] });
    try {
      _0x204afa['load'](_0x2a2329, _0x21e7e6, undefined, _0x7cd571);
    } catch (_0x163631) {
      _0x7cd571(_0x163631);
    }
  });
}
export async function loadPanoramaTextureSource(
  _0x4da187,
  {
    signal: _0x5892ee,
    fetchBlobImpl: fetchBlobImpl = fetchRemoteBlob,
    createImageBitmapImpl: createImageBitmapImpl = globalThis['createImageBitmap'],
    textureLoader: _0x4a610a,
    timeout: timeout = PANORAMA_TEXTURE_FETCH_TIMEOUT_MS,
  } = {},
) {
  const _0x5a6fa4 = String(_0x4da187 || '')['trim']();
  if (!_0x5a6fa4) throw new Error('Panorama texture URL is empty');
  if (_0x5892ee?.['aborted']) throw createAbortError();
  let _0x2383ef = null;
  if (typeof fetchBlobImpl === 'function' && typeof createImageBitmapImpl === 'function') {
    let _0x263d5e = null;
    try {
      const _0x4bb64a = await fetchBlobImpl(_0x5a6fa4, { signal: _0x5892ee, timeout: timeout });
      if (_0x5892ee?.['aborted']) throw createAbortError();
      if (!isUsableBlob(_0x4bb64a)) throw new Error('Panorama texture response is empty');
      _0x263d5e = await createImageBitmapImpl(_0x4bb64a, { imageOrientation: 'flipY' });
      if (_0x5892ee?.['aborted']) throw createAbortError();
      const _0x5098bc = createTextureFromImageBitmap(_0x263d5e);
      if (!_0x5098bc) throw new Error('Panorama texture bitmap is invalid');
      return ((_0x263d5e = null), _0x5098bc);
    } catch (_0x3a3eb2) {
      _0x263d5e?.['close']?.();
      if (_0x5892ee?.['aborted']) throw createAbortError();
      _0x2383ef = _0x3a3eb2;
    }
  }
  try {
    return await loadTextureWithTextureLoader(_0x5a6fa4, _0x4a610a, _0x5892ee);
  } catch (_0x36d213) {
    throw _0x2383ef || _0x36d213;
  }
}
export function configureInsideSpherePanoramaTexture(
  _0x1cd7a0,
  _0x2d6d21,
  { isPreview: isPreview = ![] } = {},
) {
  if (!_0x1cd7a0) return;
  ((_0x1cd7a0['colorSpace'] = threeRuntime['SRGBColorSpace']),
    (_0x1cd7a0['minFilter'] = isPreview
      ? threeRuntime['LinearFilter']
      : threeRuntime['LinearMipmapLinearFilter']),
    (_0x1cd7a0['magFilter'] = threeRuntime['LinearFilter']),
    (_0x1cd7a0['generateMipmaps'] = !isPreview),
    (_0x1cd7a0['anisotropy'] = isPreview
      ? 0x1
      : Math['min'](0x8, _0x2d6d21?.['capabilities']?.['getMaxAnisotropy']?.() || 0x1)),
    _0x1cd7a0['repeat']['set'](-0x1, 0x1),
    _0x1cd7a0['offset']['set'](0x1, 0x0),
    (_0x1cd7a0['needsUpdate'] = !![]));
}
