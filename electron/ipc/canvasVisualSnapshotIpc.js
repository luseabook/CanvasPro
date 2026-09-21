const MAX_CAPTURE_WIDTH = 0x960,
  MAX_CAPTURE_HEIGHT = 0x640,
  MIN_CAPTURE_SIZE = 16;
function toNumber(_0x6fbc69, _0x55e0c8 = 0) {
  const _0x106a74 = Number(_0x6fbc69);
  return Number.isFinite(_0x106a74) ? _0x106a74 : _0x55e0c8;
}
function normalizeCaptureRect(_0x5dd03c = {}) {
  const _0x53e865 = Math.max(0, Math.round(toNumber(_0x5dd03c.x, 0))),
    _0x170a38 = Math.max(0, Math.round(toNumber(_0x5dd03c.y, 0))),
    _0x209111 = Math.min(
      MAX_CAPTURE_WIDTH,
      Math.max(MIN_CAPTURE_SIZE, Math.round(toNumber(_0x5dd03c.width, 0))),
    ),
    _0xc0f841 = Math.min(
      MAX_CAPTURE_HEIGHT,
      Math.max(MIN_CAPTURE_SIZE, Math.round(toNumber(_0x5dd03c.height, 0))),
    );
  return { x: _0x53e865, y: _0x170a38, width: _0x209111, height: _0xc0f841 };
}
function resizeNativeImageForSnapshot(_0x137204, _0x13e58d, _0x146cd0) {
  const _0x4e233b = _0x137204?.getSize?.() || {},
    _0x1c8242 = Math.max(1, Math.round(Number(_0x4e233b.width) || 1)),
    _0x3a4418 = Math.max(1, Math.round(Number(_0x4e233b.height) || 1)),
    _0x708e31 = Math.min(1, _0x13e58d / _0x1c8242, _0x146cd0 / _0x3a4418);
  if (!(_0x708e31 > 0) || _0x708e31 >= 1) return { image: _0x137204, width: _0x1c8242, height: _0x3a4418 };
  const _0xb029c4 = Math.max(1, Math.round(_0x1c8242 * _0x708e31)),
    _0x52386c = Math.max(1, Math.round(_0x3a4418 * _0x708e31)),
    _0x55542c = _0x137204.resize({ width: _0xb029c4, height: _0x52386c, quality: 'best' });
  return { image: _0x55542c, width: _0xb029c4, height: _0x52386c };
}
async function captureSenderPage(_0x5243f2, _0x482bc4 = {}) {
  if (!_0x5243f2 || typeof _0x5243f2.capturePage !== 'function')
    return { ok: false, reason: 'not-supported' };
  const _0x306cd1 = normalizeCaptureRect(_0x482bc4.rect || {}),
    _0x2e22e4 = Math.min(
      MAX_CAPTURE_WIDTH,
      Math.max(MIN_CAPTURE_SIZE, Math.round(toNumber(_0x482bc4.maxWidth, 0x640))),
    ),
    _0x2a3630 = Math.min(
      MAX_CAPTURE_HEIGHT,
      Math.max(MIN_CAPTURE_SIZE, Math.round(toNumber(_0x482bc4.maxHeight, 0x3e8))),
    ),
    _0x38c025 = await _0x5243f2.capturePage(_0x306cd1);
  if (!_0x38c025 || _0x38c025.isEmpty?.()) return { ok: false, reason: 'empty' };
  const _0x253c91 = resizeNativeImageForSnapshot(_0x38c025, _0x2e22e4, _0x2a3630),
    _0xa10e02 = _0x253c91.image?.toDataURL?.();
  if (!String(_0xa10e02 || '').startsWith('data:image/')) return { ok: false, reason: 'encode-failed' };
  return {
    ok: true,
    src: _0xa10e02,
    width: _0x253c91.width,
    height: _0x253c91.height,
    capturedAt: Date.now(),
  };
}
export function registerCanvasVisualSnapshotIpcHandlers({ ipcMain: _0x2ada68 }) {
  _0x2ada68.handle('canvasVisualSnapshot:capturePage', async (_0x15491d, _0x4b6952 = {}) => {
    try {
      return await captureSenderPage(_0x15491d?.sender, _0x4b6952);
    } catch (_0x342dbe) {
      return { ok: false, reason: 'capture-failed', error: String(_0x342dbe?.message || _0x342dbe) };
    }
  });
}
export const __test = {
  normalizeCaptureRect: normalizeCaptureRect,
  resizeNativeImageForSnapshot: resizeNativeImageForSnapshot,
};
