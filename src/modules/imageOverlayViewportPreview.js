import { getViewportPanPreview, VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from '../core/viewportPanPreview.js';
function normalizePreviewViewport(_0x2f7ccd) {
  if (!_0x2f7ccd || typeof _0x2f7ccd !== 'object') return null;
  const _0x1107d9 = Number(_0x2f7ccd['x']),
    _0x1ee348 = Number(_0x2f7ccd['y']),
    _0x1fda80 = Number(_0x2f7ccd['zoom']);
  if (!Number['isFinite'](_0x1107d9) || !Number['isFinite'](_0x1ee348) || !Number['isFinite'](_0x1fda80))
    return null;
  if (_0x1fda80 <= 0x0) return null;
  return { x: _0x1107d9, y: _0x1ee348, zoom: _0x1fda80 };
}
export function mergeImageOverlayPreviewViewport(_0x4affe2, _0x20614c) {
  if (!_0x4affe2 || typeof _0x4affe2 !== 'object') return null;
  const _0xcc1596 = normalizePreviewViewport(_0x20614c);
  if (!_0xcc1596) return null;
  return { ..._0x4affe2, viewport: { ...(_0x4affe2['viewport'] || {}), ..._0xcc1596 } };
}
export function bindImageOverlayViewportPreview({
  windowObject: windowObject = typeof window !== 'undefined' ? window : null,
  getView: _0x2adf98,
  updateView: _0x4ab640,
  getCurrentPreview: getCurrentPreview = getViewportPanPreview,
} = {}) {
  if (
    !windowObject?.['addEventListener'] ||
    typeof _0x2adf98 !== 'function' ||
    typeof _0x4ab640 !== 'function'
  )
    return () => {};
  const _0x4139b2 = (_0x1e4fe9) => {
      const _0x3ee77d = mergeImageOverlayPreviewViewport(_0x2adf98(), _0x1e4fe9);
      if (_0x3ee77d) _0x4ab640(_0x3ee77d);
    },
    _0x17ee59 = (_0x1287d2) => {
      _0x4139b2(_0x1287d2?.['detail']?.['viewport']);
    };
  return (
    windowObject['addEventListener'](VIEWPORT_PAN_PREVIEW_FRAME_EVENT, _0x17ee59),
    _0x4139b2(getCurrentPreview?.()),
    () => {
      windowObject['removeEventListener']?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, _0x17ee59);
    }
  );
}
