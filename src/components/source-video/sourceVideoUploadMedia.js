import { getAutoMediaSizeByShortSide } from '../../services/fileService.js';
function normalizeUploadMediaDimensions(value, item) {
  const width = Math['round'](Number(value) || 0),
    height = Math['round'](Number(item) || 0);
  if (width <= 0 || height <= 0) return null;
  return { width: width, height: height };
}
export function buildSourceVideoUploadSizePatch(...args) {
  for (const box of args) {
    const videoWidth = normalizeUploadMediaDimensions(box?.['width'], box?.['height']);
    if (!videoWidth) continue;
    const width2 = getAutoMediaSizeByShortSide(videoWidth['width'], videoWidth['height']);
    return {
      width: width2['width'],
      height: width2['height'],
      videoWidth: videoWidth['width'],
      videoHeight: videoWidth['height'],
      needsAutoResize: ![],
    };
  }
  return { needsAutoResize: !![] };
}
export function readVideoFileNaturalSize(enabled) {
  const el = globalThis['document'];
  if (!enabled || typeof el?.['createElement'] !== 'function') return Promise['resolve'](null);
  const key = globalThis['window']?.['URL'] || globalThis['URL'];
  if (typeof key?.['createObjectURL'] !== 'function') return Promise['resolve'](null);
  let index = '';
  try {
    index = key['createObjectURL'](enabled);
  } catch {
    return Promise['resolve'](null);
  }
  return new Promise((handler) => {
    const result = el['createElement']('video');
    let data = ![],
      setTimeout2 = null;
    const run = (options) => {
        if (data) return;
        data = !![];
        if (setTimeout2) clearTimeout(setTimeout2);
        (handler2(), handler(options));
      },
      handler2 = () => {
        result['removeAttribute']?.('src');
        try {
          result['load']?.();
        } catch {}
        try {
          key['revokeObjectURL'](index);
        } catch {}
      };
    ((result['preload'] = 'metadata'),
      (result['muted'] = !![]),
      (result['onloadedmetadata'] = () => {
        const args2 = normalizeUploadMediaDimensions(result['videoWidth'], result['videoHeight']),
          duration = Number(result['duration'] || 0),
          args3 = Number['isFinite'](duration) && duration > 0 ? { duration: duration } : {};
        run(args2 ? { ...args2, ...args3 } : args3['duration'] ? args3 : null);
      }),
      (result['onerror'] = () => run(null)),
      (setTimeout2 = setTimeout(() => run(null), 3000)),
      (result['src'] = index));
  });
}
export function createVideoCapturePreviewUrl(enabled2) {
  if (!enabled2 || !String(enabled2['type'] || '')['startsWith']('video/')) return '';
  const target = globalThis['window']?.['URL'] || globalThis['URL'];
  if (typeof target?.['createObjectURL'] !== 'function') return '';
  try {
    return target['createObjectURL'](enabled2);
  } catch {
    return '';
  }
}
export function waitForNextPaint() {
  const run2 = globalThis['window']?.['requestAnimationFrame'] || globalThis['requestAnimationFrame'];
  if (typeof run2 === 'function')
    return new Promise((handler3) => {
      let source = ![],
        setTimeout3 = null;
      const next = () => {
        if (source) return;
        source = !![];
        if (setTimeout3) clearTimeout(setTimeout3);
        handler3();
      };
      ((setTimeout3 = setTimeout(next, 50)), run2(next));
    });
  return new Promise((current) => setTimeout(current, 0));
}
