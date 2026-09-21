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
function getStateSnapshot(_0x29cd6c) {
  if (!_0x29cd6c) return {};
  if (typeof _0x29cd6c.getStateRaw === 'function') return _0x29cd6c.getStateRaw() || {};
  if (typeof _0x29cd6c.getState === 'function') return _0x29cd6c.getState() || {};
  return {};
}
function getNodeElement({
  nodeId: nodeId = '',
  rootEl: rootEl = null,
  documentRef: documentRef = globalThis.document,
} = {}) {
  const _0x4cbee5 = rootEl?.closest?.('.v2-node');
  if (_0x4cbee5) return _0x4cbee5;
  const _0x1f6289 = String(nodeId || '').trim();
  return _0x1f6289 ? documentRef?.getElementById?.(_0x1f6289) || null : null;
}
export function isCanvasLowZoomActive(_0x448bed = globalThis.document) {
  return !!_0x448bed?.body?.classList?.contains(LOW_ZOOM_BODY_CLASS);
}
export function setNodeMediaLodHoverPromoted(_0x250c79 = null, _0xe0093b = false) {
  const _0x5d3afc = getNodeElement({ rootEl: _0x250c79 });
  if (!_0x5d3afc?.classList) return false;
  if (typeof _0x5d3afc.classList.toggle === 'function')
    return (_0x5d3afc.classList.toggle(MEDIA_LOD_HOVER_PROMOTED_CLASS, !!_0xe0093b), true);
  if (_0xe0093b) _0x5d3afc.classList.add?.(MEDIA_LOD_HOVER_PROMOTED_CLASS);
  else _0x5d3afc.classList.remove?.(MEDIA_LOD_HOVER_PROMOTED_CLASS);
  return true;
}
function isNodeMediaLodThumbActive({
  nodeId: nodeId = '',
  rootEl: rootEl = null,
  documentRef: documentRef = globalThis.document,
} = {}) {
  const _0x460272 = getNodeElement({ nodeId: nodeId, rootEl: rootEl, documentRef: documentRef }),
    _0x35abec = String(_0x460272?.dataset?.[MEDIA_LOD_MODE_ATTR] || '').trim();
  if (_0x35abec) return _0x35abec === MEDIA_LOD_MODE_THUMB;
  return isCanvasLowZoomActive(documentRef);
}
export function isNodePromotedForFullImage({
  nodeId: nodeId = '',
  rootEl: rootEl = null,
  store: store = null,
  documentRef: documentRef = globalThis.document,
} = {}) {
  const _0x5c1c81 = String(nodeId || '').trim(),
    _0x2f636e = getStateSnapshot(store),
    _0x379030 = Array.isArray(_0x2f636e?.selectedNodeIds) ? _0x2f636e.selectedNodeIds : [];
  if (_0x5c1c81 && _0x379030.some((_0x14360a) => String(_0x14360a || '') === _0x5c1c81)) return true;
  const _0x3c9fff = getNodeElement({ nodeId: _0x5c1c81, rootEl: rootEl, documentRef: documentRef });
  if (!_0x3c9fff) return false;
  return PROMOTED_NODE_CLASSES.some((_0x2564b9) => _0x3c9fff.classList?.contains(_0x2564b9));
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
  const _0x289030 = String(mainUrl || '').trim(),
    _0x1fce97 = String(thumbUrl || '').trim();
  if (lowZoomThumbnail && _0x1fce97)
    return { url: _0x1fce97, lod: _0x1fce97 && _0x1fce97 !== _0x289030 ? 'thumb' : 'full' };
  return { url: _0x289030 || _0x1fce97, lod: 'full' };
}
