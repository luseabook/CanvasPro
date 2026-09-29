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

export const CANVAS_IMAGE_THUMB_MAX_EDGE_PX=0x140;

export const CANVAS_IMAGE_LOD_DOWNGRADE_RATIO=0.82;

function hashImageDisplayVersionKey(_0x19a7e8=''){const _0x1384eb=String(_0x19a7e8||'');let _0x5e418e=0x811c9dc5;for(let _0x2b7c7d=0x0;_0x2b7c7d<_0x1384eb["length"];_0x2b7c7d+=0x1){_0x5e418e^=_0x1384eb["charCodeAt"](_0x2b7c7d),_0x5e418e=Math['imul'](_0x5e418e,0x1000193);}return(_0x5e418e>>>0x0)["toString"](0x24);}

export function versionCanvasImageDisplayUrl(_0x5190ab='',_0x2d2cf1=''){const _0x313597=String(_0x5190ab||'')["trim"](),_0x5cfaad=String(_0x2d2cf1||'')['trim']();if(!_0x313597||!_0x5cfaad)return _0x313597;if(/^(?:https?:\/\/|\/\/|data:image\/|blob:|aic-local-preview:)/i["test"](_0x313597))return _0x313597;const _0x13c79f=_0x313597['indexOf']('#'),_0x180480=_0x13c79f>=0x0?_0x313597["slice"](0x0,_0x13c79f):_0x313597,_0x2fa467=_0x13c79f>=0x0?_0x313597["slice"](_0x13c79f):'',_0x58e7f6=_0x180480["includes"]('?')?'&':'?';return''+_0x180480+_0x58e7f6+"aicv="+hashImageDisplayVersionKey(_0x5cfaad)+_0x2fa467;}

export function buildCanvasImageResultIdentityKey(_0x284023={},_0x49d41d={},_0x4eb7cb=0x0){return[_0x4eb7cb,_0x284023?.['assetId'],_0x284023?.["sourceId"],_0x284023?.["thumbId"],_0x284023?.["localPath"],_0x284023?.["originalLocalPath"],_0x284023?.["displayLocalPath"],_0x284023?.["thumbLocalPath"],_0x284023?.["sourceUrl"],_0x284023?.["imageUrl"],_0x284023?.['thumbUrl'],_0x284023?.["url"],_0x284023?.["resultUrl"],_0x284023?.["remoteFallbackUrl"],_0x284023?.["metadata"]?.['taskId'],_0x284023?.["metadata"]?.["requestId"],_0x49d41d?.['generationStartTime'],_0x49d41d?.['generationDuration'],_0x49d41d?.["rhTaskId"],_0x49d41d?.['asyncTaskId'],_0x49d41d?.['dreaminaSubmitId']]["map"](_0x1a52e0=>String(_0x1a52e0??'')["trim"]())['join']('|');}

function toPositiveNumber(_0x148dd1){const _0x4575d1=Number(_0x148dd1);return Number["isFinite"](_0x4575d1)&&_0x4575d1>0x0?_0x4575d1:0x0;}

function getPrimaryImageMetadata(_0x1c808d={}){const _0x31c39c=Array["isArray"](_0x1c808d?.['images'])?_0x1c808d["images"]:[],_0x5013a5=Number(_0x1c808d?.["mainImageIndex"]),_0x204a75=Number["isFinite"](_0x5013a5)?Math["max"](0x0,Math['min'](_0x31c39c["length"]-0x1,Math['trunc'](_0x5013a5))):0x0;return _0x31c39c[_0x204a75]||_0x31c39c[0x0]||{};}

function pickPositiveNumber(..._0x46dd57){for(const _0x4afdb4 of _0x46dd57){const _0x582e03=toPositiveNumber(_0x4afdb4);if(_0x582e03>0x0)return _0x582e03;}return 0x0;}

export function getCanvasImageIntrinsicPixelSize(_0x8b670c={}){const _0x1a2aba=getPrimaryImageMetadata(_0x8b670c);return{'width':pickPositiveNumber(_0x1a2aba["originalWidth"],_0x1a2aba["naturalWidth"],_0x1a2aba["imageWidth"],_0x8b670c["originalWidth"],_0x8b670c['naturalWidth'],_0x8b670c["imageWidth"]),'height':pickPositiveNumber(_0x1a2aba["originalHeight"],_0x1a2aba["naturalHeight"],_0x1a2aba['imageHeight'],_0x8b670c["originalHeight"],_0x8b670c["naturalHeight"],_0x8b670c["imageHeight"])};}

export function getCanvasImageThumbPixelSize(_0x4320e7={}){const _0x502c18=getPrimaryImageMetadata(_0x4320e7),_0x53a00c=pickPositiveNumber(_0x502c18["thumbWidth"],_0x502c18["thumbnailWidth"],_0x4320e7["thumbWidth"],_0x4320e7["thumbnailWidth"]),_0x282d48=pickPositiveNumber(_0x502c18["thumbHeight"],_0x502c18["thumbnailHeight"],_0x4320e7["thumbHeight"],_0x4320e7["thumbnailHeight"]);if(_0x53a00c>0x0&&_0x282d48>0x0)return{'width':_0x53a00c,'height':_0x282d48};const _0x3470ad=getCanvasImageIntrinsicPixelSize(_0x4320e7),_0x2186b5=_0x3470ad['width']||toPositiveNumber(_0x4320e7?.["width"]),_0x4b781e=_0x3470ad["height"]||toPositiveNumber(_0x4320e7?.["height"]);if(!(_0x2186b5>0x0)||!(_0x4b781e>0x0))return{'width':0x0,'height':0x0};const _0x79db27=Math["min"](0x1,CANVAS_IMAGE_THUMB_MAX_EDGE_PX/Math['max'](_0x2186b5,_0x4b781e));return{'width':_0x2186b5*_0x79db27,'height':_0x4b781e*_0x79db27};}

export function getCanvasImageRequiredPixelSize(_0x2a0790={},_0x146982={},{devicePixelRatio:_0x5f5379}={}){const _0x4edea6=toPositiveNumber(_0x146982?.["zoom"])||0x1,_0x5c29e7=toPositiveNumber(_0x5f5379)||toPositiveNumber(_0x146982?.["devicePixelRatio"])||toPositiveNumber(_0x146982?.["dpr"])||toPositiveNumber(globalThis["devicePixelRatio"])||0x1;return{'width':toPositiveNumber(_0x2a0790?.["width"])*_0x4edea6*_0x5c29e7,'height':toPositiveNumber(_0x2a0790?.["height"])*_0x4edea6*_0x5c29e7,'zoom':_0x4edea6,'devicePixelRatio':_0x5c29e7};}

export function resolveCanvasImageLodMode({node:node={},viewport:viewport={},previousMode:previousMode='',devicePixelRatio:_0x4ef2e3,interactionBusy:interactionBusy=![]}={}){const _0xb10ab2=previousMode===MEDIA_LOD_MODE_THUMB?MEDIA_LOD_MODE_THUMB:previousMode===MEDIA_LOD_MODE_FULL?MEDIA_LOD_MODE_FULL:'';if(interactionBusy&&_0xb10ab2===MEDIA_LOD_MODE_FULL)return MEDIA_LOD_MODE_FULL;const _0xa65484=getCanvasImageRequiredPixelSize(node,viewport,{'devicePixelRatio':_0x4ef2e3}),_0x1d3faf=getCanvasImageThumbPixelSize(node);if(!(_0xa65484['width']>0x0)||!(_0xa65484["height"]>0x0)||!(_0x1d3faf['width']>0x0)||!(_0x1d3faf["height"]>0x0))return MEDIA_LOD_MODE_FULL;const _0x1a1a82=_0xb10ab2===MEDIA_LOD_MODE_FULL?CANVAS_IMAGE_LOD_DOWNGRADE_RATIO:0x1,_0x463fc5=_0xa65484["width"]<=_0x1d3faf["width"]*_0x1a1a82&&_0xa65484["height"]<=_0x1d3faf["height"]*_0x1a1a82;return _0x463fc5?MEDIA_LOD_MODE_THUMB:MEDIA_LOD_MODE_FULL;}
