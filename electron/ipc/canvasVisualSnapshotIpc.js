const MAX_CAPTURE_WIDTH = 0x960,
  MAX_CAPTURE_HEIGHT = 0x640,
  MIN_CAPTURE_SIZE = 16;
function toNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function normalizeCaptureRect(box = {}) {
  const x = Math.max(0, Math.round(toNumber(box.x, 0))),
    y = Math.max(0, Math.round(toNumber(box.y, 0))),
    width = Math.min(MAX_CAPTURE_WIDTH, Math.max(MIN_CAPTURE_SIZE, Math.round(toNumber(box.width, 0)))),
    height = Math.min(MAX_CAPTURE_HEIGHT, Math.max(MIN_CAPTURE_SIZE, Math.round(toNumber(box.height, 0))));
  return { x: x, y: y, width: width, height: height };
}
function resizeNativeImageForSnapshot(image, index, result) {
  const box2 = image?.getSize?.() || {},
    width2 = Math.max(1, Math.round(Number(box2.width) || 1)),
    height2 = Math.max(1, Math.round(Number(box2.height) || 1)),
    count = Math.min(1, index / width2, result / height2);
  if (!(count > 0) || count >= 1) return { image: image, width: width2, height: height2 };
  const width3 = Math.max(1, Math.round(width2 * count)),
    height3 = Math.max(1, Math.round(height2 * count)),
    image2 = image.resize({ width: width3, height: height3, quality: 'best' });
  return { image: image2, width: width3, height: height3 };
}
async function captureSenderPage(enabled, data = {}) {
  if (!enabled || typeof enabled.capturePage !== 'function') return { ok: false, reason: 'not-supported' };
  const captureRect = normalizeCaptureRect(data.rect || {}),
    options = Math.min(
      MAX_CAPTURE_WIDTH,
      Math.max(MIN_CAPTURE_SIZE, Math.round(toNumber(data.maxWidth, 0x640))),
    ),
    target = Math.min(
      MAX_CAPTURE_HEIGHT,
      Math.max(MIN_CAPTURE_SIZE, Math.round(toNumber(data.maxHeight, 0x3e8))),
    ),
    enabled2 = await enabled.capturePage(captureRect);
  if (!enabled2 || enabled2.isEmpty?.()) return { ok: false, reason: 'empty' };
  const width4 = resizeNativeImageForSnapshot(enabled2, options, target),
    src = width4.image?.toDataURL?.();
  if (!String(src || '').startsWith('data:image/')) return { ok: false, reason: 'encode-failed' };
  return {
    ok: true,
    src: src,
    width: width4.width,
    height: width4.height,
    capturedAt: Date.now(),
  };
}
export function registerCanvasVisualSnapshotIpcHandlers({ ipcMain: ipcMain }) {
  ipcMain.handle('canvasVisualSnapshot:capturePage', async (source, next = {}) => {
    try {
      return await captureSenderPage(source?.sender, next);
    } catch (error) {
      return { ok: false, reason: 'capture-failed', error: String(error?.message || error) };
    }
  });
}
export const __test = {
  normalizeCaptureRect: normalizeCaptureRect,
  resizeNativeImageForSnapshot: resizeNativeImageForSnapshot,
};
