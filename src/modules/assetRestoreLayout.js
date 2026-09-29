import { getAutoMediaSizeByShortSide } from '../services/fileService.js';
const FLAT_MEDIA_TYPES = new Set(['source-image', 'image', 'ai-image', 'source-video', 'video', 'ai-video']);
function toNumber(_0x5723e7, _0x444ce3 = 0) {
  const _0x48e77d = Number(_0x5723e7);
  return Number.isFinite(_0x48e77d) ? _0x48e77d : _0x444ce3;
}
function getNodeWidth(_0x3d8afd) {
  return Math.max(1, toNumber(_0x3d8afd?.width ?? _0x3d8afd?.w, 240));
}
function getNodeHeight(_0x5ef39d) {
  return Math.max(1, toNumber(_0x5ef39d?.height ?? _0x5ef39d?.h, 240));
}
function isFlatMediaNode(_0x322097) {
  return FLAT_MEDIA_TYPES.has(String(_0x322097?.type || ''));
}
export function shouldTopAlignRestoredAsset(_0x430975, _0x23a8cb) {
  const _0x98796b = Array.isArray(_0x430975) ? _0x430975.filter(Boolean) : [];
  if (_0x98796b.length <= 1) return false;
  if (!_0x98796b.every(isFlatMediaNode)) return false;
  return !Array.isArray(_0x23a8cb) || _0x23a8cb.length === 0;
}
export function createTopAlignedAssetNodes(_0x1091e0, _0x131bd8 = 24) {
  const _0x50d23c = Array.isArray(_0x1091e0) ? _0x1091e0.filter(Boolean) : [],
    _0x257b3f = _0x50d23c
      .map((_0xb2f362, _0x43a023) => ({ node: _0xb2f362, index: _0x43a023 }))
      .sort((_0x3aa116, _0x405a62) => {
        const _0x3fc123 = toNumber(_0x3aa116.node?.x, 0),
          _0x1e4b28 = toNumber(_0x405a62.node?.x, 0);
        if (_0x3fc123 !== _0x1e4b28) return _0x3fc123 - _0x1e4b28;
        const _0x5d61d4 = toNumber(_0x3aa116.node?.y, 0),
          _0x50d728 = toNumber(_0x405a62.node?.y, 0);
        if (_0x5d61d4 !== _0x50d728) return _0x5d61d4 - _0x50d728;
        return _0x3aa116.index - _0x405a62.index;
      });
  let _0x2f09e2 = 0;
  return _0x257b3f.map(({ node: _0x5c8b53 }) => {
    const _0x5d1971 = getNodeWidth(_0x5c8b53),
      _0x29521e = getNodeHeight(_0x5c8b53),
      _0x2bca0d = { ..._0x5c8b53, x: _0x2f09e2, y: 0, width: _0x5d1971, height: _0x29521e };
    return ((_0x2f09e2 += _0x5d1971 + _0x131bd8), _0x2bca0d);
  });
}

const IMAGE_MEDIA_TYPES = new Set(["source-image","image","ai-image"]);

function getFirstPositiveDimension(..._0x3172f1){for(const _0x1d242f of _0x3172f1){const _0x4a59c8=Number(_0x1d242f);if(Number['isFinite'](_0x4a59c8)&&_0x4a59c8>0x0)return _0x4a59c8;}return 0x0;}

export function prepareAssetNodeForRestore(_0x3bb172,_0x309dcd){if(!_0x309dcd||typeof _0x309dcd!=='object')return _0x309dcd;if(!String(_0x3bb172?.['packageKey']||'')["trim"]())return _0x309dcd;if(!IMAGE_MEDIA_TYPES["has"](String(_0x309dcd["type"]||'')))return _0x309dcd;const _0x3ce1e3=getFirstPositiveDimension(_0x309dcd['originalWidth'],_0x309dcd['imageWidth'],_0x309dcd["naturalWidth"],_0x309dcd['metadata']?.["width"],_0x309dcd['width'],_0x309dcd['w']),_0x1c1889=getFirstPositiveDimension(_0x309dcd['originalHeight'],_0x309dcd["imageHeight"],_0x309dcd['naturalHeight'],_0x309dcd["metadata"]?.['height'],_0x309dcd["height"],_0x309dcd['h']);if(!(_0x3ce1e3>0x0&&_0x1c1889>0x0))return _0x309dcd;const _0x3858ce=getAutoMediaSizeByShortSide(_0x3ce1e3,_0x1c1889);if(getNodeWidth(_0x309dcd)===_0x3858ce["width"]&&getNodeHeight(_0x309dcd)===_0x3858ce["height"])return _0x309dcd;return{..._0x309dcd,'width':_0x3858ce['width'],'height':_0x3858ce["height"]};}

export function prepareAssetNodesForRestore(_0x42429e,_0x302919=0x18){const _0x15a5aa=Array['isArray'](_0x42429e?.["nodes"])?_0x42429e["nodes"]:[],_0x8b608e=_0x15a5aa["map"](_0x260e22=>prepareAssetNodeForRestore(_0x42429e,_0x260e22));return shouldTopAlignRestoredAsset(_0x8b608e,_0x42429e?.['edges'])?createTopAlignedAssetNodes(_0x8b608e,_0x302919):_0x8b608e;}
