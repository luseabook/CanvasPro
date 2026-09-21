function isPlainObject(_0x1abad1) {
  return _0x1abad1 && typeof _0x1abad1 === 'object' && !Array.isArray(_0x1abad1);
}
export function isInlineImageDataUrl(_0x4e2558) {
  return String(_0x4e2558 || '')
    .trim()
    .startsWith('data:image/');
}
export function isBlobObjectUrl(_0x231bff) {
  return String(_0x231bff || '')
    .trim()
    .startsWith('blob:');
}
export function isVolatileMediaUrl(_0x5c193b) {
  return isBlobObjectUrl(_0x5c193b);
}
function hasMeaningfulValue(_0x433309) {
  return String(_0x433309 || '').trim().length > 0;
}
function isStableUrlFallbackValue(_0x4c894e) {
  const _0x375856 = String(_0x4c894e || '').trim();
  if (!_0x375856) return false;
  if (isInlineImageDataUrl(_0x375856)) return false;
  if (isBlobObjectUrl(_0x375856)) return false;
  return true;
}
function sanitizeCanvasVisualSnapshot(_0x5796a5) {
  if (!isPlainObject(_0x5796a5)) return null;
  const _0x4da2a3 = String(_0x5796a5.src || '').trim();
  if (!isInlineImageDataUrl(_0x4da2a3)) return null;
  return {
    schemaVersion: Number(_0x5796a5.schemaVersion) || 1,
    src: _0x4da2a3,
    width: Math.max(1, Math.round(Number(_0x5796a5.width) || 1)),
    height: Math.max(1, Math.round(Number(_0x5796a5.height) || 1)),
    viewport: isPlainObject(_0x5796a5.viewport)
      ? {
          x: Number.isFinite(Number(_0x5796a5.viewport.x)) ? Number(_0x5796a5.viewport.x) : 0,
          y: Number.isFinite(Number(_0x5796a5.viewport.y)) ? Number(_0x5796a5.viewport.y) : 0,
          zoom:
            Number.isFinite(Number(_0x5796a5.viewport.zoom)) && Number(_0x5796a5.viewport.zoom) > 0
              ? Number(_0x5796a5.viewport.zoom)
              : 1,
        }
      : { x: 0, y: 0, zoom: 1 },
    capturedAt: Number(_0x5796a5.capturedAt) || 0,
    visibleNodeCount: Math.max(0, Math.round(Number(_0x5796a5.visibleNodeCount) || 0)),
    mediaNodeCount: Math.max(0, Math.round(Number(_0x5796a5.mediaNodeCount) || 0)),
    readyMediaNodeCount: Math.max(0, Math.round(Number(_0x5796a5.readyMediaNodeCount) || 0)),
  };
}
const INLINE_THUMBNAIL_FIELDS = Object.freeze(['thumbUrl', 'thumbSrc', 'firstFrameThumbUrl']),
  THUMBNAIL_FALLBACK_FIELDS = Object.freeze([
    'localPath',
    'src',
    'imageUrl',
    'sourceUrl',
    'videoUrl',
    'audioUrl',
    'firstFrameUrl',
    'thumbUrl',
    'firstFrameThumbUrl',
    'thumbId',
    'sourceId',
  ]),
  VOLATILE_MEDIA_URL_FIELDS = Object.freeze([
    'thumbUrl',
    'thumbSrc',
    'firstFrameThumbUrl',
    'imageUrl',
    'videoUrl',
    'audioUrl',
    'src',
  ]),
  CAPTURE_PREVIEW_MEDIA_URL_FIELDS = Object.freeze(['src', 'imageUrl', 'url']),
  CAPTURE_TRANSIENT_FIELDS = Object.freeze(['capturePreviewUrl', 'captureSavePending', 'captureSaveError']);
export function hasStableThumbnailFallback(_0x5e27cd) {
  if (!_0x5e27cd || typeof _0x5e27cd !== 'object') return false;
  return THUMBNAIL_FALLBACK_FIELDS.some((_0x157206) => {
    const _0x5e644b = _0x5e27cd[_0x157206];
    if (!hasMeaningfulValue(_0x5e644b)) return false;
    if (
      (_0x157206 === 'thumbUrl' || _0x157206 === 'firstFrameThumbUrl') &&
      (isInlineImageDataUrl(_0x5e644b) || isBlobObjectUrl(_0x5e644b))
    )
      return false;
    if (
      _0x157206 === 'src' ||
      _0x157206 === 'imageUrl' ||
      _0x157206 === 'sourceUrl' ||
      _0x157206 === 'videoUrl' ||
      _0x157206 === 'audioUrl' ||
      _0x157206 === 'firstFrameUrl'
    )
      return isStableUrlFallbackValue(_0x5e644b);
    return true;
  });
}
function sanitizeInlineThumbnailFieldsInPlace(_0x222096) {
  if (!_0x222096 || typeof _0x222096 !== 'object') return;
  if (!hasStableThumbnailFallback(_0x222096)) return;
  for (const _0x47354b of INLINE_THUMBNAIL_FIELDS) {
    isInlineImageDataUrl(_0x222096[_0x47354b]) && delete _0x222096[_0x47354b];
  }
}
function sanitizeVolatileMediaUrlFieldsInPlace(_0xecb565) {
  if (!_0xecb565 || typeof _0xecb565 !== 'object') return;
  if (!hasStableThumbnailFallback(_0xecb565)) return;
  for (const _0x3080b0 of VOLATILE_MEDIA_URL_FIELDS) {
    isVolatileMediaUrl(_0xecb565[_0x3080b0]) && delete _0xecb565[_0x3080b0];
  }
}
function sanitizeCapturePreviewMediaUrlFieldsInPlace(_0x29de72) {
  if (!_0x29de72 || typeof _0x29de72 !== 'object') return;
  if (!isInlineImageDataUrl(_0x29de72.capturePreviewUrl) && _0x29de72.captureSavePending !== true) return;
  for (const _0x173ea9 of CAPTURE_PREVIEW_MEDIA_URL_FIELDS) {
    isInlineImageDataUrl(_0x29de72[_0x173ea9]) && delete _0x29de72[_0x173ea9];
  }
}
function sanitizeRecordForPersistence(_0x4bc3f5) {
  if (Array.isArray(_0x4bc3f5)) return _0x4bc3f5.map((_0x3da7bf) => sanitizeRecordForPersistence(_0x3da7bf));
  if (!isPlainObject(_0x4bc3f5)) return _0x4bc3f5;
  const _0x1a610a = { ..._0x4bc3f5 };
  (sanitizeInlineThumbnailFieldsInPlace(_0x1a610a), sanitizeVolatileMediaUrlFieldsInPlace(_0x1a610a));
  Array.isArray(_0x1a610a.nodes) &&
    (_0x1a610a.nodes = _0x1a610a.nodes.map((_0x6ae162) => sanitizeNodeForPersistence(_0x6ae162)));
  Array.isArray(_0x1a610a.items) &&
    (_0x1a610a.items = _0x1a610a.items.map((_0x12faf6) => sanitizeRecordForPersistence(_0x12faf6)));
  Array.isArray(_0x1a610a.edges) &&
    (_0x1a610a.edges = _0x1a610a.edges.map((_0x547031) =>
      isPlainObject(_0x547031) ? { ..._0x547031 } : _0x547031,
    ));
  isPlainObject(_0x1a610a.nodeData) && (_0x1a610a.nodeData = sanitizeNodeForPersistence(_0x1a610a.nodeData));
  for (const [_0x1bb0a0, _0x5c1e4d] of Object.entries(_0x1a610a)) {
    if (_0x1bb0a0 === 'nodes' || _0x1bb0a0 === 'items' || _0x1bb0a0 === 'edges' || _0x1bb0a0 === 'nodeData')
      continue;
    if (Array.isArray(_0x5c1e4d)) {
      _0x1a610a[_0x1bb0a0] = _0x5c1e4d.map((_0x2d7abb) => sanitizeRecordForPersistence(_0x2d7abb));
      continue;
    }
    isPlainObject(_0x5c1e4d) && (_0x1a610a[_0x1bb0a0] = sanitizeRecordForPersistence(_0x5c1e4d));
  }
  return _0x1a610a;
}
export function sanitizeNodeForPersistence(_0x13f443) {
  if (!isPlainObject(_0x13f443)) return _0x13f443;
  const _0x359248 = { ..._0x13f443 };
  (sanitizeInlineThumbnailFieldsInPlace(_0x359248),
    sanitizeVolatileMediaUrlFieldsInPlace(_0x359248),
    sanitizeCapturePreviewMediaUrlFieldsInPlace(_0x359248),
    delete _0x359248.dreaminaTaskLastRaw);
  for (const _0x33b132 of CAPTURE_TRANSIENT_FIELDS) {
    delete _0x359248[_0x33b132];
  }
  return (
    Array.isArray(_0x359248.images) &&
      (_0x359248.images = _0x359248.images.map((_0xd2d3ef) => sanitizeRecordForPersistence(_0xd2d3ef))),
    Array.isArray(_0x359248.videos) &&
      (_0x359248.videos = _0x359248.videos.map((_0x1c6710) => sanitizeRecordForPersistence(_0x1c6710))),
    Array.isArray(_0x359248.cells) &&
      (_0x359248.cells = _0x359248.cells.map((_0x4513c7) => sanitizeRecordForPersistence(_0x4513c7))),
    _0x359248
  );
}
export function sanitizeSerializedCanvasData(_0x2240c0) {
  if (!isPlainObject(_0x2240c0)) return _0x2240c0;
  const _0x4bd885 = { ..._0x2240c0 };
  delete _0x4bd885._persistRevHint;
  const _0x424d0c = sanitizeCanvasVisualSnapshot(_0x4bd885.visualSnapshot);
  _0x424d0c ? (_0x4bd885.visualSnapshot = _0x424d0c) : delete _0x4bd885.visualSnapshot;
  if (Array.isArray(_0x4bd885.nodes))
    _0x4bd885.nodes = _0x4bd885.nodes.map((_0x2ca9bf) => sanitizeNodeForPersistence(_0x2ca9bf));
  else {
    if (isPlainObject(_0x4bd885.nodes)) {
      const _0x1711f3 = {};
      for (const [_0x16aa7c, _0x1fcd43] of Object.entries(_0x4bd885.nodes)) {
        _0x1711f3[_0x16aa7c] = sanitizeNodeForPersistence(_0x1fcd43);
      }
      _0x4bd885.nodes = _0x1711f3;
    }
  }
  return (
    Array.isArray(_0x4bd885.assets) &&
      (_0x4bd885.assets = _0x4bd885.assets.map((_0x50554b) => sanitizeRecordForPersistence(_0x50554b))),
    _0x4bd885
  );
}
export function sanitizeMultiCanvasDataForPersistence(_0x45d8c4) {
  if (!isPlainObject(_0x45d8c4)) return _0x45d8c4;
  const _0x300240 = { ..._0x45d8c4 };
  if (!Array.isArray(_0x300240.canvases)) return _0x300240;
  return (
    (_0x300240.canvases = _0x300240.canvases.map((_0x3572df) => {
      if (!isPlainObject(_0x3572df)) return _0x3572df;
      return sanitizeSerializedCanvasData(_0x3572df);
    })),
    _0x300240
  );
}
