const LOW_ZOOM_BODY_CLASS = 'is-zoom-low';
export const CANVAS_LOW_ZOOM_LOD_THRESHOLD = 0.45;
export const CANVAS_IMAGE_LOD_ENTER_THUMB_ZOOM = 0.4;
export const CANVAS_IMAGE_LOD_EXIT_THUMB_ZOOM = 0.55;
export const MEDIA_LOD_MODE_ATTR = 'mediaLodMode';
export const MEDIA_LOD_MODE_THUMB = 'thumb';
export const MEDIA_LOD_MODE_FULL = 'full';
export const MEDIA_LOD_HOVER_PROMOTED_CLASS = 'media-lod-hover-promoted';
const PROMOTED_NODE_CLASSES = [
  'selected',
  'v2-selected',
  'selection-related',
  'conn-src',
  'conn-hoverTarget',
  MEDIA_LOD_HOVER_PROMOTED_CLASS,
];
function getStateSnapshot(store2) {
  if (!store2) return {};
  if (typeof store2.getStateRaw === 'function') return store2.getStateRaw() || {};
  if (typeof store2.getState === 'function') return store2.getState() || {};
  return {};
}
function getNodeElement({
  nodeId: nodeId = '',
  rootEl: rootEl = null,
  documentRef: documentRef = globalThis.document,
} = {}) {
  const value = rootEl?.closest?.('.v2-node');
  if (value) return value;
  const item = String(nodeId || '').trim();
  return item ? documentRef?.getElementById?.(item) || null : null;
}
export function isCanvasLowZoomActive(dom = globalThis.document) {
  return !!dom?.body?.classList?.contains(LOW_ZOOM_BODY_CLASS);
}
export function setNodeMediaLodHoverPromoted(rootEl2 = null, enabled = false) {
  const el = getNodeElement({ rootEl: rootEl2 });
  if (!el?.classList) return false;
  if (typeof el.classList.toggle === 'function')
    return (el.classList.toggle(MEDIA_LOD_HOVER_PROMOTED_CLASS, !!enabled), true);
  if (enabled) el.classList.add?.(MEDIA_LOD_HOVER_PROMOTED_CLASS);
  else el.classList.remove?.(MEDIA_LOD_HOVER_PROMOTED_CLASS);
  return true;
}
function isNodeMediaLodThumbActive({
  nodeId: nodeId = '',
  rootEl: rootEl = null,
  documentRef: documentRef = globalThis.document,
} = {}) {
  const el2 = getNodeElement({ nodeId: nodeId, rootEl: rootEl, documentRef: documentRef }),
    key = String(el2?.dataset?.[MEDIA_LOD_MODE_ATTR] || '').trim();
  if (key) return key === MEDIA_LOD_MODE_THUMB;
  return isCanvasLowZoomActive(documentRef);
}
export function isNodePromotedForFullImage({
  nodeId: nodeId = '',
  rootEl: rootEl = null,
  store: store = null,
  documentRef: documentRef = globalThis.document,
} = {}) {
  const nodeId2 = String(nodeId || '').trim(),
    stateSnapshot = getStateSnapshot(store),
    list = Array.isArray(stateSnapshot?.selectedNodeIds) ? stateSnapshot.selectedNodeIds : [];
  if (nodeId2 && list.some((item2) => String(item2 || '') === nodeId2)) return true;
  const el3 = getNodeElement({ nodeId: nodeId2, rootEl: rootEl, documentRef: documentRef });
  if (!el3) return false;
  return PROMOTED_NODE_CLASSES.some((item3) => el3.classList?.contains(item3));
}
export function shouldUseLowZoomImageThumbnail({
  nodeId: nodeId = '',
  rootEl: rootEl = null,
  store: store = null,
  documentRef: documentRef = globalThis.document,
} = {}) {
  if (!isNodeMediaLodThumbActive({ nodeId: nodeId, rootEl: rootEl, documentRef: documentRef })) return false;
  return !isNodePromotedForFullImage({
    nodeId: nodeId,
    rootEl: rootEl,
    store: store,
    documentRef: documentRef,
  });
}
export function pickImageLodUrl({
  mainUrl: mainUrl = '',
  thumbUrl: thumbUrl = '',
  lowZoomThumbnail: lowZoomThumbnail = false,
} = {}) {
  const url = String(mainUrl || '').trim(),
    url2 = String(thumbUrl || '').trim();
  if (lowZoomThumbnail && url2) return { url: url2, lod: url2 && url2 !== url ? 'thumb' : 'full' };
  return { url: url || url2, lod: 'full' };
}

export const CANVAS_IMAGE_THUMB_MAX_EDGE_PX = 320;

export const CANVAS_IMAGE_LOD_DOWNGRADE_RATIO = 0.82;

function hashImageDisplayVersionKey(index = '') {
  const result = String(index || '');
  let data = 0x811c9dc5;
  for (let options = 0; options < result['length']; options += 1) {
    ((data ^= result['charCodeAt'](options)), (data = Math['imul'](data, 0x1000193)));
  }
  return (data >>> 0)['toString'](36);
}

export function versionCanvasImageDisplayUrl(target = '', source = '') {
  const list2 = String(target || '')['trim'](),
    enabled2 = String(source || '')['trim']();
  if (!list2 || !enabled2) return list2;
  if (/^(?:https?:\/\/|\/\/|data:image\/|blob:|aic-local-preview:)/i['test'](list2)) return list2;
  const count = list2['indexOf']('#'),
    next = count >= 0 ? list2['slice'](0, count) : list2,
    current = count >= 0 ? list2['slice'](count) : '',
    entry = next['includes']('?') ? '&' : '?';
  return '' + next + entry + 'aicv=' + hashImageDisplayVersionKey(enabled2) + current;
}

export function buildCanvasImageResultIdentityKey(options2 = {}, record = {}, payload = 0) {
  return [
    payload,
    options2?.['assetId'],
    options2?.['sourceId'],
    options2?.['thumbId'],
    options2?.['localPath'],
    options2?.['originalLocalPath'],
    options2?.['displayLocalPath'],
    options2?.['thumbLocalPath'],
    options2?.['sourceUrl'],
    options2?.['imageUrl'],
    options2?.['thumbUrl'],
    options2?.['url'],
    options2?.['resultUrl'],
    options2?.['remoteFallbackUrl'],
    options2?.['metadata']?.['taskId'],
    options2?.['metadata']?.['requestId'],
    record?.['generationStartTime'],
    record?.['generationDuration'],
    record?.['rhTaskId'],
    record?.['asyncTaskId'],
    record?.['dreaminaSubmitId'],
  ]
    ['map']((handle) => String(handle ?? '')['trim']())
    ['join']('|');
}

function toPositiveNumber(state) {
  const count2 = Number(state);
  return Number['isFinite'](count2) && count2 > 0 ? count2 : 0;
}

function getPrimaryImageMetadata(options3 = {}) {
  const config = Array['isArray'](options3?.['images']) ? options3['images'] : [],
    scope = Number(options3?.['mainImageIndex']),
    input = Number['isFinite'](scope)
      ? Math['max'](0, Math['min'](config['length'] - 1, Math['trunc'](scope)))
      : 0;
  return config[input] || config[0] || {};
}

function pickPositiveNumber(...args) {
  for (const output of args) {
    const toPositiveNumber2 = toPositiveNumber(output);
    if (toPositiveNumber2 > 0) return toPositiveNumber2;
  }
  return 0;
}

export function getCanvasImageIntrinsicPixelSize(options4 = {}) {
  const primaryImageMetadata = getPrimaryImageMetadata(options4);
  return {
    width: pickPositiveNumber(
      primaryImageMetadata['originalWidth'],
      primaryImageMetadata['naturalWidth'],
      primaryImageMetadata['imageWidth'],
      options4['originalWidth'],
      options4['naturalWidth'],
      options4['imageWidth'],
    ),
    height: pickPositiveNumber(
      primaryImageMetadata['originalHeight'],
      primaryImageMetadata['naturalHeight'],
      primaryImageMetadata['imageHeight'],
      options4['originalHeight'],
      options4['naturalHeight'],
      options4['imageHeight'],
    ),
  };
}

export function getCanvasImageThumbPixelSize(options5 = {}) {
  const primaryImageMetadata2 = getPrimaryImageMetadata(options5),
    positiveNumber = pickPositiveNumber(
      primaryImageMetadata2['thumbWidth'],
      primaryImageMetadata2['thumbnailWidth'],
      options5['thumbWidth'],
      options5['thumbnailWidth'],
    ),
    positiveNumber2 = pickPositiveNumber(
      primaryImageMetadata2['thumbHeight'],
      primaryImageMetadata2['thumbnailHeight'],
      options5['thumbHeight'],
      options5['thumbnailHeight'],
    );
  if (positiveNumber > 0 && positiveNumber2 > 0)
    return { width: positiveNumber, height: positiveNumber2 };
  const box = getCanvasImageIntrinsicPixelSize(options5),
    count3 = box['width'] || toPositiveNumber(options5?.['width']),
    count4 = box['height'] || toPositiveNumber(options5?.['height']);
  if (!(count3 > 0) || !(count4 > 0)) return { width: 0, height: 0 };
  const value2 = Math['min'](1, CANVAS_IMAGE_THUMB_MAX_EDGE_PX / Math['max'](count3, count4));
  return { width: count3 * value2, height: count4 * value2 };
}

export function getCanvasImageRequiredPixelSize(
  options6 = {},
  value3 = {},
  { devicePixelRatio: devicePixelRatio } = {},
) {
  const toPositiveNumber3 = toPositiveNumber(value3?.['zoom']) || 1,
    toPositiveNumber4 =
      toPositiveNumber(devicePixelRatio) ||
      toPositiveNumber(value3?.['devicePixelRatio']) ||
      toPositiveNumber(value3?.['dpr']) ||
      toPositiveNumber(globalThis['devicePixelRatio']) ||
      1;
  return {
    width: toPositiveNumber(options6?.['width']) * toPositiveNumber3 * toPositiveNumber4,
    height: toPositiveNumber(options6?.['height']) * toPositiveNumber3 * toPositiveNumber4,
    zoom: toPositiveNumber3,
    devicePixelRatio: toPositiveNumber4,
  };
}

export function resolveCanvasImageLodMode({
  node: node = {},
  viewport: viewport = {},
  previousMode: previousMode = '',
  devicePixelRatio: devicePixelRatio2,
  interactionBusy: interactionBusy = false,
} = {}) {
  const value4 =
    previousMode === MEDIA_LOD_MODE_THUMB
      ? MEDIA_LOD_MODE_THUMB
      : previousMode === MEDIA_LOD_MODE_FULL
        ? MEDIA_LOD_MODE_FULL
        : '';
  if (interactionBusy && value4 === MEDIA_LOD_MODE_FULL) return MEDIA_LOD_MODE_FULL;
  const box2 = getCanvasImageRequiredPixelSize(node, viewport, { devicePixelRatio: devicePixelRatio2 }),
    box3 = getCanvasImageThumbPixelSize(node);
  if (!(box2['width'] > 0) || !(box2['height'] > 0) || !(box3['width'] > 0) || !(box3['height'] > 0))
    return MEDIA_LOD_MODE_FULL;
  const value5 = value4 === MEDIA_LOD_MODE_FULL ? CANVAS_IMAGE_LOD_DOWNGRADE_RATIO : 1,
    value6 = box2['width'] <= box3['width'] * value5 && box2['height'] <= box3['height'] * value5;
  return value6 ? MEDIA_LOD_MODE_THUMB : MEDIA_LOD_MODE_FULL;
}
