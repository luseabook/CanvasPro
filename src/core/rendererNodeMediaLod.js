import { isNodeType } from '../modules/registry.js';
import {
  CANVAS_IMAGE_LOD_ENTER_THUMB_ZOOM,
  CANVAS_IMAGE_LOD_EXIT_THUMB_ZOOM,
  MEDIA_LOD_MODE_ATTR,
  MEDIA_LOD_MODE_FULL,
  MEDIA_LOD_MODE_THUMB,
} from '../modules/canvasImageLod.js';
export function getNodeMediaLodMode(_0x4c9323, _0x45e8cf, _0x4a779b = '') {
  if (!isNodeType(_0x4c9323, ['source-image', 'ai-image'])) return '';
  const _0x6b93a1 = Number.isFinite(_0x45e8cf?.zoom) ? _0x45e8cf.zoom : 1,
    _0x68675 = _0x4a779b === MEDIA_LOD_MODE_THUMB ? MEDIA_LOD_MODE_THUMB : MEDIA_LOD_MODE_FULL;
  if (_0x68675 === MEDIA_LOD_MODE_THUMB)
    return _0x6b93a1 >= CANVAS_IMAGE_LOD_EXIT_THUMB_ZOOM ? MEDIA_LOD_MODE_FULL : MEDIA_LOD_MODE_THUMB;
  return _0x6b93a1 <= CANVAS_IMAGE_LOD_ENTER_THUMB_ZOOM ? MEDIA_LOD_MODE_THUMB : MEDIA_LOD_MODE_FULL;
}
export function syncNodeMediaLodMode(_0x5b6784, _0x4de579, _0x52c79a) {
  if (!_0x5b6784?.dataset) return '';
  const _0x3c1ff7 = String(_0x5b6784.dataset[MEDIA_LOD_MODE_ATTR] || '').trim(),
    _0x49906b = getNodeMediaLodMode(_0x4de579, _0x52c79a, _0x3c1ff7);
  if (!_0x49906b)
    return (MEDIA_LOD_MODE_ATTR in _0x5b6784.dataset && delete _0x5b6784.dataset[MEDIA_LOD_MODE_ATTR], '');
  return (
    _0x5b6784.dataset[MEDIA_LOD_MODE_ATTR] !== _0x49906b &&
      (_0x5b6784.dataset[MEDIA_LOD_MODE_ATTR] = _0x49906b),
    _0x49906b
  );
}

export function collectFullEligibleVisibleImageNodeIds({nodes:_0x589a20,candidateNodeIds:_0x298d1d,viewport:_0x5464ba,devicePixelRatio:_0x412d48,isVisible:isVisible=()=>!![],getPreviousMode:getPreviousMode=()=>'',interactionBusy:interactionBusy=![]}={}){const _0x1a9e04=_0x589a20&&typeof _0x589a20==="object"?_0x589a20:{},_0x2acc52=_0x298d1d instanceof Set?_0x298d1d:new Set(_0x298d1d||[]),_0x2a777b=new Set();for(const _0x1c5d0c of _0x2acc52){const _0x1f7d95=_0x1a9e04[_0x1c5d0c];if(!isNodeType(_0x1f7d95,["source-image","ai-image"]))continue;if(!isVisible(_0x1f7d95,_0x1c5d0c))continue;getNodeMediaLodMode(_0x1f7d95,_0x5464ba,getPreviousMode(_0x1c5d0c),{'devicePixelRatio':_0x412d48,'interactionBusy':interactionBusy})===MEDIA_LOD_MODE_FULL&&_0x2a777b["add"](_0x1c5d0c);}return _0x2a777b;}

export function applyRendererFullEligibleImageCandidates(_0x224049,_0x588f8f){if(!(_0x588f8f instanceof Set)||_0x588f8f['size']===0x0)return _0x224049;const _0x476d8e=new Set(_0x224049?.["mountCandidateIds"]),_0x50543c=new Set(_0x224049?.["parkCandidateIds"]);for(const _0x23402f of _0x588f8f){_0x476d8e["add"](_0x23402f),_0x50543c["delete"](_0x23402f);}return{..._0x224049,'mountCandidateIds':_0x476d8e,'parkCandidateIds':_0x50543c};}

export function prioritizeFullEligibleVisibleImageNodes(_0x251944,_0x5fa570){if(!Array["isArray"](_0x251944)||_0x251944["length"]<0x2||!(_0x5fa570 instanceof Set)||_0x5fa570["size"]===0x0)return _0x251944;const _0x46b48b=[],_0xfd89f0=[];for(const _0x3db4c8 of _0x251944){_0x3db4c8?.['id']&&_0x5fa570["has"](_0x3db4c8['id'])?_0x46b48b['push'](_0x3db4c8):_0xfd89f0["push"](_0x3db4c8);}return _0x46b48b["length"]?_0x46b48b["concat"](_0xfd89f0):_0x251944;}
