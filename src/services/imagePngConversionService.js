function isBlobLike(enabled) {
  return !!enabled && typeof enabled.arrayBuffer === 'function';
}
function normalizeImageMimeType(value) {
  const enabled2 = String(value || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!enabled2.startsWith('image/')) return '';
  return enabled2;
}
function inferImageMimeTypeFromUrl(item) {
  const enabled3 = String(item || '').trim();
  if (!enabled3) return '';
  const key = enabled3.match(/^data:([^;,]+)/i),
    imageMimeType = normalizeImageMimeType(key?.[1] || '');
  if (imageMimeType) return imageMimeType;
  const index = enabled3.toLowerCase().split('#')[0].split('?')[0];
  if (index.endsWith('.png')) return 'image/png';
  if (index.endsWith('.jpg') || index.endsWith('.jpeg')) return 'image/jpeg';
  if (index.endsWith('.webp')) return 'image/webp';
  if (index.endsWith('.gif')) return 'image/gif';
  if (index.endsWith('.bmp')) return 'image/bmp';
  if (index.endsWith('.avif')) return 'image/avif';
  if (index.endsWith('.svg')) return 'image/svg+xml';
  return '';
}
function resolveImageMimeType(result, data) {
  return normalizeImageMimeType(result?.type) || inferImageMimeTypeFromUrl(data);
}
function bytesToBase64(list) {
  if (typeof Buffer !== 'undefined') return Buffer.from(list).toString('base64');
  let options = '';
  const target = 0x8000;
  for (let source = 0; source < list.length; source += target) {
    options += String.fromCharCode(...list.subarray(source, source + target));
  }
  return typeof btoa === 'function' ? btoa(options) : '';
}
async function convertImageBlobToDataUrl(next, current = '') {
  if (!isBlobLike(next)) return '';
  const uint8Array = new Uint8Array(await next.arrayBuffer()),
    base64 = bytesToBase64(uint8Array);
  if (!base64) return '';
  const imageMimeType2 = resolveImageMimeType(next, current) || 'image/png';
  return 'data:' + imageMimeType2 + ';base64,' + base64;
}
function hasDomCanvasRuntime() {
  return (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function' &&
    typeof globalThis?.Image === 'function'
  );
}
function loadImage(entry) {
  return new Promise((handler, handler2) => {
    const run = globalThis?.Image;
    if (typeof run !== 'function') {
      handler2(new Error('image-not-supported'));
      return;
    }
    const record = new run();
    ('crossOrigin' in record && (record.crossOrigin = 'anonymous'),
      (record.onload = () => handler(record)),
      (record.onerror = () => handler2(new Error('image-load-failed'))),
      (record.src = entry));
  });
}
function canvasToBlob(enabled4, payload = 'image/png') {
  return new Promise((handler3) => {
    if (!enabled4 || typeof enabled4.toBlob !== 'function') {
      handler3(null);
      return;
    }
    enabled4.toBlob((handle) => handler3(handle), payload);
  });
}
async function renderImageElementToPngBlob(box) {
  if (!hasDomCanvasRuntime()) return null;
  const enabled5 = Number(box?.naturalWidth || box?.width || 0),
    enabled6 = Number(box?.naturalHeight || box?.height || 0);
  if (!enabled5 || !enabled6) return null;
  const box2 = document.createElement('canvas');
  ((box2.width = enabled5), (box2.height = enabled6));
  const ctx = box2.getContext('2d');
  if (!ctx) return null;
  return (ctx.drawImage(box, 0, 0), canvasToBlob(box2, 'image/png'));
}
async function convertImageBlobToPngBlob(state) {
  if (!isBlobLike(state)) return null;
  const run2 = globalThis?.createImageBitmap,
    handler4 = globalThis?.OffscreenCanvas;
  if (typeof run2 === 'function' && typeof handler4 === 'function') {
    let box3 = null;
    try {
      box3 = await run2(state);
      const enabled7 = Number(box3?.width || 0),
        enabled8 = Number(box3?.height || 0);
      if (!enabled7 || !enabled8) return null;
      const el = new handler4(enabled7, enabled8),
        ctx2 = el.getContext('2d');
      if (!ctx2) return null;
      ctx2.drawImage(box3, 0, 0);
      if (typeof el.convertToBlob === 'function') return await el.convertToBlob({ type: 'image/png' });
    } catch {
    } finally {
      box3?.close?.();
    }
  }
  if (!hasDomCanvasRuntime()) return null;
  const config = globalThis?.URL;
  if (typeof config?.createObjectURL !== 'function') return null;
  const scope = config.createObjectURL(state);
  try {
    const image = await loadImage(scope);
    return await renderImageElementToPngBlob(image);
  } catch {
    return null;
  } finally {
    config.revokeObjectURL?.(scope);
  }
}
async function convertImageUrlToPngBlob(input) {
  if (!hasDomCanvasRuntime()) return null;
  try {
    const image2 = await loadImage(input);
    return await renderImageElementToPngBlob(image2);
  } catch {
    return null;
  }
}
export {
  bytesToBase64,
  convertImageBlobToDataUrl,
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  inferImageMimeTypeFromUrl,
  isBlobLike,
  normalizeImageMimeType,
  resolveImageMimeType,
};
