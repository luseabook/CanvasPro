import * as threeRuntime from './threeRuntime.js';
import { fetchRemoteBlob } from '../../../api/projectsV2Api.js';
const PANORAMA_TEXTURE_FETCH_TIMEOUT_MS = 15000;
function createAbortError() {
  if (typeof DOMException === 'function')
    return new DOMException('Panorama texture load aborted', 'AbortError');
  const error = new Error('Panorama texture load aborted');
  return ((error['name'] = 'AbortError'), error);
}
function isUsableBlob(value) {
  return Boolean(value && typeof value['arrayBuffer'] === 'function');
}
function createTextureFromImageBitmap(box) {
  const count = Number(box?.['width']) || 0,
    count2 = Number(box?.['height']) || 0;
  if (count <= 0 || count2 <= 0) return (box?.['close']?.(), null);
  const el = new threeRuntime['Texture'](box);
  el['flipY'] = false;
  let item = false;
  const key = () => {
    if (item) return;
    ((item = true), el['removeEventListener']?.('dispose', key), box?.['close']?.());
  };
  return (el['addEventListener']?.('dispose', key), el);
}
function loadTextureWithTextureLoader(index, enabled, el2) {
  if (!enabled || typeof enabled['load'] !== 'function')
    return Promise['reject'](new Error('Panorama texture loader is unavailable'));
  if (el2?.['aborted']) return Promise['reject'](createAbortError());
  return new Promise((handler, handler2) => {
    let result = false;
    const run = () => el2?.['removeEventListener']?.('abort', data),
      options = (target) => {
        if (result) {
          target?.['dispose']?.();
          return;
        }
        ((result = true), run(), handler(target));
      },
      handler3 = (source) => {
        if (result) return;
        ((result = true),
          run(),
          handler2(source instanceof Error ? source : new Error('Panorama texture load failed')));
      },
      data = () => handler3(createAbortError());
    el2?.['addEventListener']?.('abort', data, { once: true });
    try {
      enabled['load'](index, options, undefined, handler3);
    } catch (next) {
      handler3(next);
    }
  });
}
export async function loadPanoramaTextureSource(
  current,
  {
    signal: signal,
    fetchBlobImpl: fetchBlobImpl = fetchRemoteBlob,
    createImageBitmapImpl: createImageBitmapImpl = globalThis['createImageBitmap'],
    textureLoader: textureLoader,
    timeout: timeout = PANORAMA_TEXTURE_FETCH_TIMEOUT_MS,
  } = {},
) {
  const enabled2 = String(current || '')['trim']();
  if (!enabled2) throw new Error('Panorama texture URL is empty');
  if (signal?.['aborted']) throw createAbortError();
  let entry = null;
  if (typeof fetchBlobImpl === 'function' && typeof createImageBitmapImpl === 'function') {
    let imageBitmapImpl = null;
    try {
      const fetchBlobImpl2 = await fetchBlobImpl(enabled2, { signal: signal, timeout: timeout });
      if (signal?.['aborted']) throw createAbortError();
      if (!isUsableBlob(fetchBlobImpl2)) throw new Error('Panorama texture response is empty');
      imageBitmapImpl = await createImageBitmapImpl(fetchBlobImpl2, { imageOrientation: 'flipY' });
      if (signal?.['aborted']) throw createAbortError();
      const textureFromImageBitmap = createTextureFromImageBitmap(imageBitmapImpl);
      if (!textureFromImageBitmap) throw new Error('Panorama texture bitmap is invalid');
      return ((imageBitmapImpl = null), textureFromImageBitmap);
    } catch (record) {
      imageBitmapImpl?.['close']?.();
      if (signal?.['aborted']) throw createAbortError();
      entry = record;
    }
  }
  try {
    return await loadTextureWithTextureLoader(enabled2, textureLoader, signal);
  } catch (payload) {
    throw entry || payload;
  }
}
export function configureInsideSpherePanoramaTexture(enabled3, handle, { isPreview: isPreview = false } = {}) {
  if (!enabled3) return;
  ((enabled3['colorSpace'] = threeRuntime['SRGBColorSpace']),
    (enabled3['minFilter'] = isPreview
      ? threeRuntime['LinearFilter']
      : threeRuntime['LinearMipmapLinearFilter']),
    (enabled3['magFilter'] = threeRuntime['LinearFilter']),
    (enabled3['generateMipmaps'] = !isPreview),
    (enabled3['anisotropy'] = isPreview
      ? 1
      : Math['min'](8, handle?.['capabilities']?.['getMaxAnisotropy']?.() || 1)),
    enabled3['repeat']['set'](-1, 1),
    enabled3['offset']['set'](1, 0),
    (enabled3['needsUpdate'] = true));
}
