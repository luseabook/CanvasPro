function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}
export function isInlineImageDataUrl(item) {
  return String(item || '')
    .trim()
    .startsWith('data:image/');
}
export function isBlobObjectUrl(key) {
  return String(key || '')
    .trim()
    .startsWith('blob:');
}
export function isVolatileMediaUrl(index) {
  return isBlobObjectUrl(index);
}
function hasMeaningfulValue(result) {
  return String(result || '').trim().length > 0;
}
function isStableUrlFallbackValue(data) {
  const enabled = String(data || '').trim();
  if (!enabled) return false;
  if (isInlineImageDataUrl(enabled)) return false;
  if (isBlobObjectUrl(enabled)) return false;
  return true;
}
function sanitizeCanvasVisualSnapshot(box) {
  if (!isPlainObject(box)) return null;
  const src = String(box.src || '').trim();
  if (!isInlineImageDataUrl(src)) return null;
  return {
    schemaVersion: Number(box.schemaVersion) || 1,
    src: src,
    width: Math.max(1, Math.round(Number(box.width) || 1)),
    height: Math.max(1, Math.round(Number(box.height) || 1)),
    viewport: isPlainObject(box.viewport)
      ? {
          x: Number.isFinite(Number(box.viewport.x)) ? Number(box.viewport.x) : 0,
          y: Number.isFinite(Number(box.viewport.y)) ? Number(box.viewport.y) : 0,
          zoom:
            Number.isFinite(Number(box.viewport.zoom)) && Number(box.viewport.zoom) > 0
              ? Number(box.viewport.zoom)
              : 1,
        }
      : { x: 0, y: 0, zoom: 1 },
    capturedAt: Number(box.capturedAt) || 0,
    visibleNodeCount: Math.max(0, Math.round(Number(box.visibleNodeCount) || 0)),
    mediaNodeCount: Math.max(0, Math.round(Number(box.mediaNodeCount) || 0)),
    readyMediaNodeCount: Math.max(0, Math.round(Number(box.readyMediaNodeCount) || 0)),
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
export function hasStableThumbnailFallback(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  return THUMBNAIL_FALLBACK_FIELDS.some((item2) => {
    const options = enabled2[item2];
    if (!hasMeaningfulValue(options)) return false;
    if (
      (item2 === 'thumbUrl' || item2 === 'firstFrameThumbUrl') &&
      (isInlineImageDataUrl(options) || isBlobObjectUrl(options))
    )
      return false;
    if (
      item2 === 'src' ||
      item2 === 'imageUrl' ||
      item2 === 'sourceUrl' ||
      item2 === 'videoUrl' ||
      item2 === 'audioUrl' ||
      item2 === 'firstFrameUrl'
    )
      return isStableUrlFallbackValue(options);
    return true;
  });
}
function sanitizeInlineThumbnailFieldsInPlace(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object') return;
  if (!hasStableThumbnailFallback(enabled3)) return;
  for (const target of INLINE_THUMBNAIL_FIELDS) {
    isInlineImageDataUrl(enabled3[target]) && delete enabled3[target];
  }
}
function sanitizeVolatileMediaUrlFieldsInPlace(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return;
  if (!hasStableThumbnailFallback(enabled4)) return;
  for (const source of VOLATILE_MEDIA_URL_FIELDS) {
    isVolatileMediaUrl(enabled4[source]) && delete enabled4[source];
  }
}
function sanitizeCapturePreviewMediaUrlFieldsInPlace(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object') return;
  if (!isInlineImageDataUrl(enabled5.capturePreviewUrl) && enabled5.captureSavePending !== true) return;
  for (const next of CAPTURE_PREVIEW_MEDIA_URL_FIELDS) {
    isInlineImageDataUrl(enabled5[next]) && delete enabled5[next];
  }
}
function sanitizeRecordForPersistence(list) {
  if (Array.isArray(list)) return list.map((item3) => sanitizeRecordForPersistence(item3));
  if (!isPlainObject(list)) return list;
  const current = { ...list };
  (sanitizeInlineThumbnailFieldsInPlace(current), sanitizeVolatileMediaUrlFieldsInPlace(current));
  Array.isArray(current.nodes) &&
    (current.nodes = current.nodes.map((item4) => sanitizeNodeForPersistence(item4)));
  Array.isArray(current.items) &&
    (current.items = current.items.map((item5) => sanitizeRecordForPersistence(item5)));
  Array.isArray(current.edges) &&
    (current.edges = current.edges.map((args) => (isPlainObject(args) ? { ...args } : args)));
  isPlainObject(current.nodeData) && (current.nodeData = sanitizeNodeForPersistence(current.nodeData));
  for (const [entry, list2] of Object.entries(current)) {
    if (entry === 'nodes' || entry === 'items' || entry === 'edges' || entry === 'nodeData') continue;
    if (Array.isArray(list2)) {
      current[entry] = list2.map((item6) => sanitizeRecordForPersistence(item6));
      continue;
    }
    isPlainObject(list2) && (current[entry] = sanitizeRecordForPersistence(list2));
  }
  return current;
}
export function sanitizeNodeForPersistence(args2) {
  if (!isPlainObject(args2)) return args2;
  const record = { ...args2 };
  (sanitizeInlineThumbnailFieldsInPlace(record),
    sanitizeVolatileMediaUrlFieldsInPlace(record),
    sanitizeCapturePreviewMediaUrlFieldsInPlace(record),
    delete record.dreaminaTaskLastRaw);
  for (const payload of CAPTURE_TRANSIENT_FIELDS) {
    delete record[payload];
  }
  return (
    Array.isArray(record.images) &&
      (record.images = record.images.map((item7) => sanitizeRecordForPersistence(item7))),
    Array.isArray(record.videos) &&
      (record.videos = record.videos.map((item8) => sanitizeRecordForPersistence(item8))),
    Array.isArray(record.cells) &&
      (record.cells = record.cells.map((item9) => sanitizeRecordForPersistence(item9))),
    record
  );
}
export function sanitizeSerializedCanvasData(args3) {
  if (!isPlainObject(args3)) return args3;
  const handle = { ...args3 };
  delete handle._persistRevHint;
  const sanitizeCanvasVisualSnapshot2 = sanitizeCanvasVisualSnapshot(handle.visualSnapshot);
  sanitizeCanvasVisualSnapshot2
    ? (handle.visualSnapshot = sanitizeCanvasVisualSnapshot2)
    : delete handle.visualSnapshot;
  if (Array.isArray(handle.nodes))
    handle.nodes = handle.nodes.map((item10) => sanitizeNodeForPersistence(item10));
  else {
    if (isPlainObject(handle.nodes)) {
      const state = {};
      for (const [config, scope] of Object.entries(handle.nodes)) {
        state[config] = sanitizeNodeForPersistence(scope);
      }
      handle.nodes = state;
    }
  }
  return (
    Array.isArray(handle.assets) &&
      (handle.assets = handle.assets.map((item11) => sanitizeRecordForPersistence(item11))),
    handle
  );
}
export function sanitizeMultiCanvasDataForPersistence(args4) {
  if (!isPlainObject(args4)) return args4;
  const input = { ...args4 };
  if (!Array.isArray(input.canvases)) return input;
  return (
    (input.canvases = input.canvases.map((item12) => {
      if (!isPlainObject(item12)) return item12;
      return sanitizeSerializedCanvasData(item12);
    })),
    input
  );
}
