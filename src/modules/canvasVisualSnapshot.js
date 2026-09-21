const SNAPSHOT_SCHEMA_VERSION = 1,
  SNAPSHOT_MAX_WIDTH = 0x640,
  SNAPSHOT_MAX_HEIGHT = 0x3e8,
  SNAPSHOT_MIN_NODE_COUNT = 8,
  SNAPSHOT_JPEG_QUALITY = 0.68,
  SNAPSHOT_MIN_HOLD_MS = 0x384,
  SNAPSHOT_MAX_HOLD_MS = 0xaf0,
  SNAPSHOT_READY_POLL_MS = 0x1c2,
  SNAPSHOT_NODE_READY_RATIO = 0.95,
  SNAPSHOT_MEDIA_READY_RATIO = 0.94,
  SNAPSHOT_MEDIA_READY_TARGET = 36;
let overlayEl = null,
  overlayHideTimer = null,
  overlayPollTimer = null;
function getDocument() {
  return typeof document !== 'undefined' ? document : null;
}
function getWindow() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function normalizeNodes(_0x5b352d) {
  if (Array.isArray(_0x5b352d)) return _0x5b352d;
  if (_0x5b352d && typeof _0x5b352d === 'object') return Object.values(_0x5b352d);
  return [];
}
function normalizeEdges(_0x589888) {
  if (Array.isArray(_0x589888)) return _0x589888;
  if (_0x589888 && typeof _0x589888 === 'object') return Object.values(_0x589888);
  return [];
}
function normalizeViewport(_0x3ead64) {
  return {
    x: Number.isFinite(Number(_0x3ead64?.x)) ? Number(_0x3ead64.x) : 0,
    y: Number.isFinite(Number(_0x3ead64?.y)) ? Number(_0x3ead64.y) : 0,
    zoom: Number.isFinite(Number(_0x3ead64?.zoom)) && Number(_0x3ead64.zoom) > 0 ? Number(_0x3ead64.zoom) : 1,
  };
}
function getElementSize(_0x5f582f, _0x3753f0 = 0x640, _0x1fd4b2 = 0x384) {
  return {
    width: Math.max(1, Math.round(Number(_0x5f582f?.clientWidth) || _0x3753f0)),
    height: Math.max(1, Math.round(Number(_0x5f582f?.clientHeight) || _0x1fd4b2)),
  };
}
function getElementViewportRect(_0x23afee) {
  const _0x2b89bf = _0x23afee?.getBoundingClientRect?.();
  if (!_0x2b89bf) return null;
  const _0x13f21e = Math.max(1, Math.round(Number(_0x2b89bf.width) || 1)),
    _0x40bcec = Math.max(1, Math.round(Number(_0x2b89bf.height) || 1));
  return {
    x: Math.max(0, Math.round(Number(_0x2b89bf.left) || 0)),
    y: Math.max(0, Math.round(Number(_0x2b89bf.top) || 0)),
    width: _0x13f21e,
    height: _0x40bcec,
  };
}
function isNodeVisible(_0x38f772, _0x51e249, _0x1ad08d, _0x24652a) {
  if (!_0x38f772?.id) return false;
  const _0x32db13 = _0x51e249.zoom || 1,
    _0x14e44f = (Number(_0x38f772.x) || 0) * _0x32db13 + _0x51e249.x,
    _0x24fb85 = (Number(_0x38f772.y) || 0) * _0x32db13 + _0x51e249.y,
    _0x1075e5 = Math.max(1, Number(_0x38f772.width) || 160) * _0x32db13,
    _0x525ef4 = Math.max(1, Number(_0x38f772.height) || 120) * _0x32db13;
  return (
    _0x14e44f + _0x1075e5 > 0 && _0x24fb85 + _0x525ef4 > 0 && _0x14e44f < _0x1ad08d && _0x24fb85 < _0x24652a
  );
}
function toScreenRect(_0x3b71b2, _0x56772d, _0x249ce0) {
  const _0x19e45f = _0x56772d.zoom || 1;
  return {
    x: ((Number(_0x3b71b2.x) || 0) * _0x19e45f + _0x56772d.x) * _0x249ce0,
    y: ((Number(_0x3b71b2.y) || 0) * _0x19e45f + _0x56772d.y) * _0x249ce0,
    width: Math.max(1, Number(_0x3b71b2.width) || 160) * _0x19e45f * _0x249ce0,
    height: Math.max(1, Number(_0x3b71b2.height) || 120) * _0x19e45f * _0x249ce0,
  };
}
function getCssColor(_0x65d884, _0x39647f) {
  const _0x4ab995 = getDocument(),
    _0x4c43d2 = getWindow(),
    _0x1bfbe4 = _0x4ab995?.documentElement || _0x4ab995?.body;
  try {
    const _0x32ad2d = _0x4c43d2.getComputedStyle?.(_0x1bfbe4)?.getPropertyValue?.(_0x65d884);
    return String(_0x32ad2d || '').trim() || _0x39647f;
  } catch {
    return _0x39647f;
  }
}
function roundRect(_0x1d01ab, _0x34715c, _0x2b6a7d, _0x4c4e8a, _0x3bd4fd, _0x58f351) {
  const _0x4bbab7 = Math.max(0, Math.min(_0x58f351, _0x4c4e8a / 2, _0x3bd4fd / 2));
  if (typeof _0x1d01ab.roundRect === 'function') {
    (_0x1d01ab.beginPath(), _0x1d01ab.roundRect(_0x34715c, _0x2b6a7d, _0x4c4e8a, _0x3bd4fd, _0x4bbab7));
    return;
  }
  (_0x1d01ab.beginPath(),
    _0x1d01ab.moveTo(_0x34715c + _0x4bbab7, _0x2b6a7d),
    _0x1d01ab.lineTo(_0x34715c + _0x4c4e8a - _0x4bbab7, _0x2b6a7d),
    _0x1d01ab.quadraticCurveTo(
      _0x34715c + _0x4c4e8a,
      _0x2b6a7d,
      _0x34715c + _0x4c4e8a,
      _0x2b6a7d + _0x4bbab7,
    ),
    _0x1d01ab.lineTo(_0x34715c + _0x4c4e8a, _0x2b6a7d + _0x3bd4fd - _0x4bbab7),
    _0x1d01ab.quadraticCurveTo(
      _0x34715c + _0x4c4e8a,
      _0x2b6a7d + _0x3bd4fd,
      _0x34715c + _0x4c4e8a - _0x4bbab7,
      _0x2b6a7d + _0x3bd4fd,
    ),
    _0x1d01ab.lineTo(_0x34715c + _0x4bbab7, _0x2b6a7d + _0x3bd4fd),
    _0x1d01ab.quadraticCurveTo(
      _0x34715c,
      _0x2b6a7d + _0x3bd4fd,
      _0x34715c,
      _0x2b6a7d + _0x3bd4fd - _0x4bbab7,
    ),
    _0x1d01ab.lineTo(_0x34715c, _0x2b6a7d + _0x4bbab7),
    _0x1d01ab.quadraticCurveTo(_0x34715c, _0x2b6a7d, _0x34715c + _0x4bbab7, _0x2b6a7d));
}
function findLoadedMediaElement(_0x1bf644) {
  const _0x383240 = getDocument();
  if (!_0x383240 || !_0x1bf644) return null;
  const _0x2cf2fe = _0x383240.querySelectorAll?.('#v2-canvas .v2-fast-preview-node') || [];
  for (const _0x48527f of _0x2cf2fe) {
    if (String(_0x48527f?.dataset?.nodeId || '') !== String(_0x1bf644)) continue;
    const _0x1cfd8d = _0x48527f.querySelector?.('img');
    if (isMediaElementReady(_0x1cfd8d)) return _0x1cfd8d;
  }
  const _0xa2014c = _0x383240.getElementById?.(_0x1bf644),
    _0x2cfb4d = ['.node-img', '.source-video-poster-frame', '.v2-fast-preview-media', 'img', 'video'];
  for (const _0xafa28 of _0x2cfb4d) {
    const _0x3648c8 = _0xa2014c?.querySelector?.(_0xafa28);
    if (!_0x3648c8) continue;
    if (_0x3648c8.tagName === 'VIDEO') {
      if (_0x3648c8.readyState >= 2 && Number(_0x3648c8.videoWidth) > 0) return _0x3648c8;
      continue;
    }
    if (_0x3648c8.complete !== false && Number(_0x3648c8.naturalWidth || _0x3648c8.width || 0) > 0)
      return _0x3648c8;
  }
  return null;
}
function nodeHasMediaLikeContent(_0xb1ddd2) {
  if (!_0xb1ddd2 || typeof _0xb1ddd2 !== 'object') return false;
  const _0x2c434f = String(_0xb1ddd2.type || '').toLowerCase();
  if (_0x2c434f.includes('image') || _0x2c434f.includes('video')) return true;
  const _0x3ff00a = [
    'src',
    'imageUrl',
    'videoUrl',
    'localPath',
    'displayLocalPath',
    'thumbLocalPath',
    'thumbUrl',
    'posterUrl',
    'posterLocalPath',
    'capturePreviewUrl',
  ];
  if (_0x3ff00a.some((_0x3bd6cd) => String(_0xb1ddd2[_0x3bd6cd] || '').trim())) return true;
  return (
    (Array.isArray(_0xb1ddd2.images) && _0xb1ddd2.images.length > 0) ||
    (Array.isArray(_0xb1ddd2.videos) && _0xb1ddd2.videos.length > 0)
  );
}
function countReadyVisibleMediaNodes(_0x340f48) {
  let _0x15ecc4 = 0;
  for (const _0x4fdfda of _0x340f48 || []) {
    if (findLoadedMediaElement(_0x4fdfda?.id)) _0x15ecc4 += 1;
  }
  return _0x15ecc4;
}
function countExpectedVisibleMediaNodes(_0x548063) {
  let _0x3838b4 = 0;
  for (const _0x59a4c4 of _0x548063 || []) {
    if (nodeHasMediaLikeContent(_0x59a4c4)) _0x3838b4 += 1;
  }
  return _0x3838b4;
}
function drawEdges(_0x1ad9c9, _0x3aba7f, _0x29393d, _0x2a9c89, _0x592e5a, _0x388814) {
  (_0x1ad9c9.save(),
    (_0x1ad9c9.strokeStyle = _0x388814),
    (_0x1ad9c9.lineWidth = Math.max(1, 1.2 * _0x592e5a)),
    (_0x1ad9c9.globalAlpha = 0.45));
  for (const _0x2573eb of _0x3aba7f) {
    const _0x33a0f9 = _0x29393d.get(_0x2573eb?.sourceId),
      _0x1bf985 = _0x29393d.get(_0x2573eb?.targetId);
    if (!_0x33a0f9 || !_0x1bf985) continue;
    const _0x219791 = toScreenRect(_0x33a0f9, _0x2a9c89, _0x592e5a),
      _0x8d43b5 = toScreenRect(_0x1bf985, _0x2a9c89, _0x592e5a),
      _0x3d8044 = _0x219791.x + _0x219791.width,
      _0x2d609a = _0x219791.y + _0x219791.height / 2,
      _0x34ac10 = _0x8d43b5.x,
      _0x1f80dc = _0x8d43b5.y + _0x8d43b5.height / 2,
      _0x1564bb = Math.max(80 * _0x592e5a, Math.abs(_0x34ac10 - _0x3d8044) * 0.42);
    (_0x1ad9c9.beginPath(),
      _0x1ad9c9.moveTo(_0x3d8044, _0x2d609a),
      _0x1ad9c9.bezierCurveTo(
        _0x3d8044 + _0x1564bb,
        _0x2d609a,
        _0x34ac10 - _0x1564bb,
        _0x1f80dc,
        _0x34ac10,
        _0x1f80dc,
      ),
      _0x1ad9c9.stroke());
  }
  _0x1ad9c9.restore();
}
function drawNode(_0x24d32e, _0x51bb39, _0x4a0a33, _0x4edfff, _0x124bf7) {
  const _0x22d707 = toScreenRect(_0x51bb39, _0x4a0a33, _0x4edfff);
  if (_0x22d707.width <= 0 || _0x22d707.height <= 0) return { drewMedia: false };
  const _0x4db838 = Math.max(4, Math.min(12 * _0x4edfff, _0x22d707.width / 4, _0x22d707.height / 4));
  (_0x24d32e.save(),
    roundRect(_0x24d32e, _0x22d707.x, _0x22d707.y, _0x22d707.width, _0x22d707.height, _0x4db838),
    (_0x24d32e.fillStyle = _0x124bf7.nodeFill),
    _0x24d32e.fill(),
    (_0x24d32e.strokeStyle = _0x124bf7.nodeStroke),
    (_0x24d32e.lineWidth = Math.max(1, _0x4edfff)),
    _0x24d32e.stroke());
  let _0x1c72a4 = false;
  const _0x2d7238 = findLoadedMediaElement(_0x51bb39.id);
  if (_0x2d7238)
    try {
      (_0x24d32e.save(),
        roundRect(_0x24d32e, _0x22d707.x, _0x22d707.y, _0x22d707.width, _0x22d707.height, _0x4db838),
        _0x24d32e.clip(),
        _0x24d32e.drawImage(_0x2d7238, _0x22d707.x, _0x22d707.y, _0x22d707.width, _0x22d707.height),
        _0x24d32e.restore(),
        (_0x1c72a4 = true));
    } catch {}
  const _0x4e3c0a = String(_0x51bb39.name || _0x51bb39.type || '').trim();
  return (
    _0x4e3c0a &&
      _0x22d707.width > 48 &&
      _0x22d707.height > 32 &&
      ((_0x24d32e.fillStyle = _0x124bf7.text),
      (_0x24d32e.globalAlpha = 0.82),
      (_0x24d32e.font =
        Math.max(8, Math.min(12, _0x22d707.width / 14)) * _0x4edfff + 'px system-ui, sans-serif'),
      _0x24d32e.fillText(_0x4e3c0a.slice(0, 24), _0x22d707.x + 6 * _0x4edfff, _0x22d707.y + 14 * _0x4edfff)),
    _0x24d32e.restore(),
    { drewMedia: _0x1c72a4 }
  );
}
export function normalizeCanvasVisualSnapshot(_0x56426f) {
  if (!_0x56426f || typeof _0x56426f !== 'object') return null;
  const _0x5240b5 = String(_0x56426f.src || '').trim();
  if (!_0x5240b5.startsWith('data:image/')) return null;
  return {
    schemaVersion: Number(_0x56426f.schemaVersion) || SNAPSHOT_SCHEMA_VERSION,
    src: _0x5240b5,
    width: Math.max(1, Math.round(Number(_0x56426f.width) || 1)),
    height: Math.max(1, Math.round(Number(_0x56426f.height) || 1)),
    viewport: normalizeViewport(_0x56426f.viewport),
    capturedAt: Number(_0x56426f.capturedAt) || Date.now(),
    visibleNodeCount: Math.max(0, Math.round(Number(_0x56426f.visibleNodeCount) || 0)),
    mediaNodeCount: Math.max(0, Math.round(Number(_0x56426f.mediaNodeCount) || 0)),
    readyMediaNodeCount: Math.max(0, Math.round(Number(_0x56426f.readyMediaNodeCount) || 0)),
  };
}
export function captureCanvasVisualSnapshot({
  canvasEl: _0x2b3da8,
  containerEl: containerEl = null,
  nodes: _0x594553,
  edges: _0x4aa52f,
  viewport: _0x481fab,
  force: force = false,
} = {}) {
  const _0x440a97 = getDocument();
  if (!_0x440a97 || typeof _0x440a97.createElement !== 'function' || !_0x2b3da8) return null;
  const _0x6d4d18 = normalizeNodes(_0x594553);
  if (!force && _0x6d4d18.length < SNAPSHOT_MIN_NODE_COUNT) return null;
  const _0xfb971d = getElementSize(containerEl || _0x2b3da8),
    _0x160479 = normalizeViewport(_0x481fab),
    _0x293c93 = _0x6d4d18.filter((_0x59b363) =>
      isNodeVisible(_0x59b363, _0x160479, _0xfb971d.width, _0xfb971d.height),
    );
  if (!force && _0x293c93.length < SNAPSHOT_MIN_NODE_COUNT) return null;
  const _0x39f631 = Math.min(1, SNAPSHOT_MAX_WIDTH / _0xfb971d.width, SNAPSHOT_MAX_HEIGHT / _0xfb971d.height),
    _0x18345d = Math.max(1, Math.round(_0xfb971d.width * _0x39f631)),
    _0x18bc85 = Math.max(1, Math.round(_0xfb971d.height * _0x39f631)),
    _0x328dd1 = _0x440a97.createElement('canvas');
  ((_0x328dd1.width = _0x18345d), (_0x328dd1.height = _0x18bc85));
  const _0x16eb90 = _0x328dd1.getContext?.('2d', { alpha: false });
  if (!_0x16eb90) return null;
  const _0x54f873 = {
    bg: getCssColor('--bg', 'Canvas'),
    edge: getCssColor('--stroke-default', 'GrayText'),
    nodeFill: getCssColor('--bg-panel-card', 'ButtonFace'),
    nodeStroke: getCssColor('--stroke-default', 'GrayText'),
    text: getCssColor('--text-primary', 'CanvasText'),
  };
  ((_0x16eb90.fillStyle = _0x54f873.bg), _0x16eb90.fillRect(0, 0, _0x18345d, _0x18bc85));
  const _0x3d8576 = new Map(_0x6d4d18.map((_0x460ec8) => [_0x460ec8?.id, _0x460ec8]));
  drawEdges(_0x16eb90, normalizeEdges(_0x4aa52f), _0x3d8576, _0x160479, _0x39f631, _0x54f873.edge);
  let _0x91a0b = 0;
  for (const _0x1e7fdf of _0x293c93) {
    const _0x43a84a = drawNode(_0x16eb90, _0x1e7fdf, _0x160479, _0x39f631, _0x54f873);
    if (_0x43a84a.drewMedia) _0x91a0b += 1;
  }
  try {
    const _0x2ac662 = _0x328dd1.toDataURL('image/jpeg', SNAPSHOT_JPEG_QUALITY);
    if (!_0x2ac662.startsWith('data:image/')) return null;
    return {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      src: _0x2ac662,
      width: _0x18345d,
      height: _0x18bc85,
      viewport: _0x160479,
      capturedAt: Date.now(),
      visibleNodeCount: _0x293c93.length,
      mediaNodeCount: _0x91a0b,
      readyMediaNodeCount: _0x91a0b,
    };
  } catch {
    return null;
  }
}
export async function captureCanvasVisualSnapshotFromElectron({
  canvasEl: _0x4182e1,
  containerEl: containerEl = null,
  nodes: _0x497727,
  viewport: _0x5b4c68,
  force: force = false,
} = {}) {
  const _0x5823f9 = getDocument(),
    _0x58878d = getWindow()?.electronAPI?.canvasVisualSnapshot,
    _0x4b9482 = containerEl || _0x4182e1;
  if (!_0x5823f9 || !_0x4b9482 || typeof _0x58878d?.capturePage !== 'function') return null;
  if (overlayEl?.isConnected && !overlayEl.classList?.contains?.('is-hiding')) return null;
  const _0x49a5de = normalizeNodes(_0x497727);
  if (!force && _0x49a5de.length < SNAPSHOT_MIN_NODE_COUNT) return null;
  const _0x379779 = getElementSize(_0x4b9482),
    _0x5afe15 = normalizeViewport(_0x5b4c68),
    _0x5a5897 = _0x49a5de.filter((_0x2e4879) =>
      isNodeVisible(_0x2e4879, _0x5afe15, _0x379779.width, _0x379779.height),
    );
  if (!force && _0x5a5897.length < SNAPSHOT_MIN_NODE_COUNT) return null;
  const _0x113df9 = getElementViewportRect(_0x4b9482);
  if (!_0x113df9) return null;
  let _0x2a7668 = null;
  try {
    _0x2a7668 = await _0x58878d.capturePage({
      rect: _0x113df9,
      maxWidth: SNAPSHOT_MAX_WIDTH,
      maxHeight: SNAPSHOT_MAX_HEIGHT,
    });
  } catch {
    _0x2a7668 = null;
  }
  const _0x196eb2 = String(_0x2a7668?.src || '').trim();
  if (_0x2a7668?.ok !== true || !_0x196eb2.startsWith('data:image/')) return null;
  const _0x3d88d1 = countReadyVisibleMediaNodes(_0x5a5897),
    _0xe7c4bb = countExpectedVisibleMediaNodes(_0x5a5897);
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    src: _0x196eb2,
    width: Math.max(1, Math.round(Number(_0x2a7668.width) || _0x113df9.width)),
    height: Math.max(1, Math.round(Number(_0x2a7668.height) || _0x113df9.height)),
    viewport: _0x5afe15,
    capturedAt: Number(_0x2a7668.capturedAt) || Date.now(),
    visibleNodeCount: _0x5a5897.length,
    mediaNodeCount: _0xe7c4bb,
    readyMediaNodeCount: _0x3d88d1,
  };
}
function clearOverlayTimers() {
  if (overlayHideTimer !== null) clearTimeout(overlayHideTimer);
  if (overlayPollTimer !== null) clearTimeout(overlayPollTimer);
  ((overlayHideTimer = null), (overlayPollTimer = null));
}
export function hideCanvasVisualSnapshotOverlay() {
  clearOverlayTimers();
  const _0x216956 = overlayEl;
  overlayEl = null;
  if (!_0x216956) return;
  (_0x216956.classList?.add?.('is-hiding'), setTimeout(() => _0x216956.remove?.(), 180));
}
function isMediaElementReady(_0x5a4582) {
  if (!_0x5a4582) return false;
  if (_0x5a4582.tagName === 'VIDEO')
    return _0x5a4582.readyState >= 2 && Number(_0x5a4582.videoWidth || _0x5a4582.width || 0) > 0;
  return _0x5a4582.complete !== false && Number(_0x5a4582.naturalWidth || _0x5a4582.width || 0) > 0;
}
function countReadyMedia() {
  const _0x190f61 = getDocument(),
    _0x3bcd41 = _0x190f61?.querySelectorAll?.('#v2-canvas .v2-node') || [],
    _0x22596b = _0x190f61?.querySelectorAll?.('#v2-canvas .v2-fast-preview-node') || [],
    _0x384617 =
      _0x190f61?.querySelectorAll?.(
        '#v2-canvas .v2-node img, #v2-canvas .v2-node video, #v2-canvas .v2-fast-preview-node img',
      ) || [];
  let _0x30a396 = 0;
  for (const _0x303926 of _0x384617) {
    if (isMediaElementReady(_0x303926)) _0x30a396 += 1;
  }
  const _0x4ca242 = new Set();
  for (const _0x599df9 of _0x3bcd41) {
    const _0x7c559b = String(_0x599df9?.id || _0x599df9?.dataset?.nodeId || '').trim();
    if (_0x7c559b) _0x4ca242.add(_0x7c559b);
  }
  for (const _0x247b10 of _0x22596b) {
    const _0x573be8 = String(_0x247b10?.dataset?.nodeId || '').trim();
    if (_0x573be8) _0x4ca242.add(_0x573be8);
  }
  return {
    mountedNodeCount: _0x3bcd41.length || 0,
    previewNodeCount: _0x22596b.length || 0,
    visualNodeCount: _0x4ca242.size || _0x3bcd41.length || 0,
    readyMedia: _0x30a396,
  };
}
function pollOverlayReadiness(_0x44bed1, _0x5cf081) {
  if (!overlayEl) return;
  const _0x2e07f5 = Date.now() - _0x5cf081,
    _0x52bcd5 = Math.max(0, Number(_0x44bed1.visibleNodeCount) || 0),
    _0x5cf3bd = Math.max(0, Number(_0x44bed1.mediaNodeCount) || 0),
    { visualNodeCount: _0x2414ab, readyMedia: _0x2c41ae } = countReadyMedia(),
    _0x4f6f0e = _0x52bcd5 <= 0 || _0x2414ab >= Math.max(1, _0x52bcd5 * SNAPSHOT_NODE_READY_RATIO),
    _0x3ed25b =
      _0x5cf3bd <= 0 ||
      _0x2c41ae >= Math.max(1, Math.min(SNAPSHOT_MEDIA_READY_TARGET, _0x5cf3bd * SNAPSHOT_MEDIA_READY_RATIO));
  if (_0x2e07f5 >= SNAPSHOT_MAX_HOLD_MS) {
    hideCanvasVisualSnapshotOverlay();
    return;
  }
  if (_0x2e07f5 >= SNAPSHOT_MIN_HOLD_MS && _0x4f6f0e && _0x3ed25b) {
    hideCanvasVisualSnapshotOverlay();
    return;
  }
  overlayPollTimer = setTimeout(() => pollOverlayReadiness(_0x44bed1, _0x5cf081), SNAPSHOT_READY_POLL_MS);
}
export function showCanvasVisualSnapshotOverlay(_0x7d18b) {
  hideCanvasVisualSnapshotOverlay();
  const _0x4bcae5 = normalizeCanvasVisualSnapshot(_0x7d18b),
    _0x5ce9da = getDocument();
  if (!_0x5ce9da || !_0x4bcae5) return false;
  const _0x1e2c59 =
    _0x5ce9da.getElementById?.('v2-wrap') || _0x5ce9da.getElementById?.('v2-container') || _0x5ce9da.body;
  if (!_0x1e2c59 || typeof _0x5ce9da.createElement !== 'function') return false;
  const _0x457390 = _0x5ce9da.createElement('div');
  ((_0x457390.className = 'canvas-visual-snapshot-overlay'),
    _0x457390.setAttribute?.('aria-hidden', 'true'),
    (_0x457390.dataset.visibleNodeCount = String(_0x4bcae5.visibleNodeCount || 0)),
    (_0x457390.dataset.mediaNodeCount = String(_0x4bcae5.mediaNodeCount || 0)));
  const _0x30979f = _0x5ce9da.createElement('img');
  ((_0x30979f.className = 'canvas-visual-snapshot-image'),
    (_0x30979f.alt = ''),
    (_0x30979f.decoding = 'async'),
    (_0x30979f.draggable = false),
    (_0x30979f.src = _0x4bcae5.src),
    _0x457390.appendChild?.(_0x30979f),
    _0x1e2c59.appendChild?.(_0x457390),
    (overlayEl = _0x457390));
  const _0x37035a = getWindow(),
    _0x3f3232 = () => overlayEl === _0x457390 && _0x457390.classList?.add?.('is-visible');
  return (
    typeof _0x37035a.requestAnimationFrame === 'function'
      ? _0x37035a.requestAnimationFrame(_0x3f3232)
      : _0x3f3232(),
    pollOverlayReadiness(_0x4bcae5, Date.now()),
    true
  );
}
