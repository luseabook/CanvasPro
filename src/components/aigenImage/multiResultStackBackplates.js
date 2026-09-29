export const MAX_MULTI_RESULT_BACKPLATES = 3;
export const MULTI_RESULT_STACK_PREVIEW_CLASS = 'is-multi-result-stack';
export const MULTI_RESULT_STACK_EXPANDED_CLASS = 'is-multi-result-stack-expanded';
export const MULTI_RESULT_STACK_WRAP_CLASS = 'multi-stack-wrap';
export const MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS = 'is-expanded';
export const MULTI_RESULT_BACKPLATES_CLASS = 'multi-stack-backplates';
export const MULTI_RESULT_BACKPLATE_CLASS = 'multi-stack-backplate';
function toFiniteCount(_0x5c5223) {
  const _0x3fffe7 = Number(_0x5c5223);
  if (!Number.isFinite(_0x3fffe7) || _0x3fffe7 <= 0) return 0;
  return Math.floor(_0x3fffe7);
}
export function getMultiResultBackplateCount(_0x5ec34e) {
  const _0x25bf56 = toFiniteCount(_0x5ec34e);
  return Math.min(Math.max(_0x25bf56 - 1, 0), MAX_MULTI_RESULT_BACKPLATES);
}
function normalizeBackplateItem(_0x20c8d3, _0x25ac05) {
  const _0x2f8a91 = Number.isFinite(Number(_0x20c8d3?.imageIndex))
    ? Math.floor(Number(_0x20c8d3.imageIndex))
    : _0x25ac05;
  return { imageIndex: _0x2f8a91 };
}
export function buildMultiResultBackplateItems({
  imageCount: imageCount = 0,
  mainIndex: mainIndex = 0,
} = {}) {
  const _0x18566 = toFiniteCount(imageCount);
  if (_0x18566 <= 1) return [];
  const _0x15369c =
      Number.isFinite(Number(mainIndex)) && mainIndex >= 0 && mainIndex < _0x18566
        ? Math.floor(Number(mainIndex))
        : 0,
    _0x49050f = [];
  for (let _0x267709 = 0; _0x267709 < _0x18566; _0x267709 += 1) {
    if (_0x267709 === _0x15369c) continue;
    _0x49050f.push({ imageIndex: _0x267709 });
    if (_0x49050f.length >= MAX_MULTI_RESULT_BACKPLATES) break;
  }
  return _0x49050f;
}
export function getMultiResultBackplateKey(_0xb656bf = []) {
  return (Array.isArray(_0xb656bf) ? _0xb656bf : [])
    .map((_0x5615eb, _0x23d533) => {
      const _0x52dda4 = normalizeBackplateItem(_0x5615eb, _0x23d533);
      return '' + _0x52dda4.imageIndex;
    })
    .join(',');
}
export function shouldRefreshMultiResultStackDom({
  imageCount: imageCount = 0,
  previewEl: previewEl = null,
  containerEl: containerEl = null,
  stackWrap: stackWrap = null,
  backdropWrap: backdropWrap = null,
} = {}) {
  const _0x357ceb = getMultiResultBackplateCount(imageCount);
  if (_0x357ceb <= 0) return false;
  if (!containerEl || !stackWrap || stackWrap.parentNode !== containerEl) return true;
  if (!backdropWrap || backdropWrap.parentNode !== stackWrap) return true;
  if ((Number(backdropWrap.children?.length) || 0) !== _0x357ceb) return true;
  return !previewEl?.classList?.contains(MULTI_RESULT_STACK_PREVIEW_CLASS);
}
export function createMultiResultBackplates(_0x30bcf9, _0x32feab, _0x31d199 = {}) {
  if (!_0x30bcf9?.createElement) return null;
  const _0x5f27de = Array.isArray(_0x31d199.items) ? _0x31d199.items : null,
    _0x556cf6 = _0x5f27de
      ? _0x5f27de
          .slice(0, MAX_MULTI_RESULT_BACKPLATES)
          .map((_0x4db803, _0x4d4778) => normalizeBackplateItem(_0x4db803, _0x4d4778))
      : Array.from({ length: getMultiResultBackplateCount(_0x32feab) }, (_0x27b9ea, _0x45ccad) =>
          normalizeBackplateItem({}, _0x45ccad + 1),
        );
  if (_0x556cf6.length <= 0) return null;
  const _0xd98f1f = _0x30bcf9.createElement('div');
  ((_0xd98f1f.className = MULTI_RESULT_BACKPLATES_CLASS), _0xd98f1f.setAttribute('aria-hidden', 'true'));
  for (let _0x1839db = 0; _0x1839db < _0x556cf6.length; _0x1839db += 1) {
    const _0x34e3c8 = _0x556cf6[_0x1839db],
      _0x1b6561 = _0x30bcf9.createElement('div');
    ((_0x1b6561.className = MULTI_RESULT_BACKPLATE_CLASS),
      (_0x1b6561.dataset.stackIndex = String(_0x1839db + 1)),
      (_0x1b6561.dataset.imageIndex = String(_0x34e3c8.imageIndex)),
      _0xd98f1f.appendChild(_0x1b6561));
  }
  return _0xd98f1f;
}
export function syncMultiResultStackClasses({
  previewEl: previewEl = null,
  stackWrap: stackWrap = null,
  isActive: isActive = false,
  isExpanded: isExpanded = false,
} = {}) {
  const _0x4b26d7 = !!isActive,
    _0x5168e9 = _0x4b26d7 && !!isExpanded;
  (previewEl?.classList?.toggle(MULTI_RESULT_STACK_PREVIEW_CLASS, _0x4b26d7),
    previewEl?.classList?.toggle(MULTI_RESULT_STACK_EXPANDED_CLASS, _0x5168e9),
    stackWrap?.classList?.toggle(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS, _0x5168e9));
}
export function clearMultiResultStackClasses({
  previewEl: previewEl = null,
  stackWrap: stackWrap = null,
} = {}) {
  (previewEl?.classList?.remove(MULTI_RESULT_STACK_PREVIEW_CLASS, MULTI_RESULT_STACK_EXPANDED_CLASS),
    stackWrap?.classList?.remove(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS));
}

export const MAX_MULTI_RESULT_VISIBLE_ITEMS=0x10;

const EXPANDED_GRID_NODE_ROW=0x2,EXPANDED_GRID_4X4_NODE_ROW=0x3,FOUR_IMAGE_GRID_SLOT_ORDER=Object["freeze"]([Object["freeze"]({'r':0x1,'c':0x1}),Object["freeze"]({'r':0x0,'c':0x0}),Object['freeze']({'r':0x0,'c':0x1})]),EXPANDED_GRID_SLOT_ORDER=Object['freeze']([Object["freeze"]({'r':0x2,'c':0x1}),Object["freeze"]({'r':0x2,'c':0x2}),Object['freeze']({'r':0x1,'c':0x0}),Object["freeze"]({'r':0x1,'c':0x1}),Object["freeze"]({'r':0x1,'c':0x2}),Object["freeze"]({'r':0x0,'c':0x0}),Object["freeze"]({'r':0x0,'c':0x1}),Object["freeze"]({'r':0x0,'c':0x2}),Object["freeze"]({'r':0x2,'c':0x3}),Object["freeze"]({'r':0x1,'c':0x3}),Object["freeze"]({'r':0x0,'c':0x3})]),EXPANDED_GRID_4X4_SLOT_ORDER=Object["freeze"]([Object["freeze"]({'r':0x3,'c':0x1}),Object["freeze"]({'r':0x3,'c':0x2}),Object["freeze"]({'r':0x3,'c':0x3}),Object['freeze']({'r':0x2,'c':0x0}),Object["freeze"]({'r':0x2,'c':0x1}),Object["freeze"]({'r':0x2,'c':0x2}),Object["freeze"]({'r':0x2,'c':0x3}),Object['freeze']({'r':0x1,'c':0x0}),Object["freeze"]({'r':0x1,'c':0x1}),Object['freeze']({'r':0x1,'c':0x2}),Object["freeze"]({'r':0x1,'c':0x3}),Object["freeze"]({'r':0x0,'c':0x0}),Object['freeze']({'r':0x0,'c':0x1}),Object["freeze"]({'r':0x0,'c':0x2}),Object["freeze"]({'r':0x0,'c':0x3})]);

function normalizeMainIndex(_0x50d3de,_0x5d8829){return Number["isFinite"](Number(_0x50d3de))&&_0x50d3de>=0x0&&_0x50d3de<_0x5d8829?Math["floor"](Number(_0x50d3de)):0x0;}

function getExpandedGridLayout(_0x41074a){if(_0x41074a===0x4)return{'nodeRow':0x1,'slotOrder':FOUR_IMAGE_GRID_SLOT_ORDER};if(_0x41074a>MAX_MULTI_RESULT_VISIBLE_ITEMS-0x4)return{'nodeRow':EXPANDED_GRID_4X4_NODE_ROW,'slotOrder':EXPANDED_GRID_4X4_SLOT_ORDER};return{'nodeRow':EXPANDED_GRID_NODE_ROW,'slotOrder':EXPANDED_GRID_SLOT_ORDER};}

export function buildMultiResultExpandedSlotMap({imageCount:imageCount=0x0,mainIndex:mainIndex=0x0,previewWidth:previewWidth=0x0,previewHeight:previewHeight=0x0,gap:gap=0x0}={}){const _0x183b6d=toFiniteCount(imageCount),_0x121e4a=normalizeMainIndex(mainIndex,_0x183b6d),_0x1c9e01=new Map();if(_0x183b6d<=0x1)return _0x1c9e01;const _0x1de004=Math["max"](0x1,Number(previewWidth)||0x1),_0x1a212e=Math["max"](0x1,Number(previewHeight)||0x1),_0x538c11=Math["max"](0x0,Number(gap)||0x0),{nodeRow:_0x13c571,slotOrder:_0x346b62}=getExpandedGridLayout(_0x183b6d);let _0x2286fb=0x0;for(let _0x551a14=0x0;_0x551a14<_0x183b6d;_0x551a14+=0x1){if(_0x551a14===_0x121e4a)continue;const _0x3e82d3=_0x346b62[_0x2286fb];if(!_0x3e82d3)break;_0x1c9e01["set"](_0x551a14,{'order':_0x2286fb,'top':(_0x3e82d3['r']-_0x13c571)*(_0x1a212e+_0x538c11),'left':_0x3e82d3['c']*(_0x1de004+_0x538c11)}),_0x2286fb+=0x1;}return _0x1c9e01;}

export function buildMultiResultCollapsedFrame(_0x46870e=0x1){const _0x3a57e7=Math['min'](MAX_MULTI_RESULT_BACKPLATES,Math["max"](0x1,Math["floor"](Number(_0x46870e)||0x1))),_0x5f16cd=_0x3a57e7-0x1;return{'x':Math["min"](0xa+_0x5f16cd*0x7,0x42),'y':Math["min"](_0x5f16cd*0x3,0x18),'rotate':Math['min'](0x4+_0x5f16cd*2.2,0x12),'scale':Math["max"](0.99-_0x5f16cd*0.016,0.86),'opacity':Math["max"](0.58-_0x5f16cd*0.055,0.18)};}

export function shouldEnableMultiResultLayerDragOut({isImagesExpanded:isImagesExpanded=![],imageCount:imageCount=0x0,imageIndex:imageIndex=-0x1,mainImageIndex:mainImageIndex=0x0}={}){const _0x507ec0=toFiniteCount(imageCount);if(!isImagesExpanded||_0x507ec0<=0x1)return![];const _0x3d0562=normalizeMainIndex(mainImageIndex,_0x507ec0),_0x4bbf48=Number["isFinite"](Number(imageIndex))?Math["floor"](Number(imageIndex)):-0x1;return _0x4bbf48>=0x0&&_0x4bbf48<_0x507ec0&&_0x4bbf48!==_0x3d0562;}

export function resolveMultiResultMainSwap({imageCount:imageCount=0x0,previousMainIndex:previousMainIndex=0x0,nextMainIndex:nextMainIndex=0x0}={}){const _0x282af8=toFiniteCount(imageCount);if(_0x282af8<=0x1)return null;const _0x9f89da=normalizeMainIndex(previousMainIndex,_0x282af8),_0x119af9=normalizeMainIndex(nextMainIndex,_0x282af8);if(_0x9f89da===_0x119af9)return null;return{'consumedImageIndex':_0x119af9,'replacementImageIndex':_0x9f89da};}

export function getMultiResultBackplateIdentityKey(_0x79dab4=[]){return(Array['isArray'](_0x79dab4)?_0x79dab4:[])["map"]((_0x12b86c,_0x31c421)=>normalizeBackplateItem(_0x12b86c,_0x31c421)['imageIndex'])['filter'](_0x2ca023=>Number['isFinite'](_0x2ca023))['sort']((_0x3c2a38,_0x96a88b)=>_0x3c2a38-_0x96a88b)["map"](_0x1c5161=>''+_0x1c5161)["join"](',');}

export function getMultiResultBackplateDomIdentityKey(_0x425c40=null){const _0x2fd579=Array["from"](_0x425c40?.["children"]||[]);return getMultiResultBackplateIdentityKey(_0x2fd579['map'](_0x4ac0e2=>({'imageIndex':Number(_0x4ac0e2?.["dataset"]?.["imageIndex"])})));}
