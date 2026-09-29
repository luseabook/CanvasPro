import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
} from '../../services/canvasMediaLocalService.js';
function resolveAiImagePrimaryItem(_0x297f40) {
  if (!_0x297f40 || String(_0x297f40.type || '') !== 'ai-image') return null;
  const _0x1945e7 = Array.isArray(_0x297f40.images) ? _0x297f40.images : [];
  if (_0x1945e7.length === 0) return null;
  const _0x247a24 = Number(_0x297f40.mainImageIndex),
    _0x12a431 = Number.isFinite(_0x247a24) ? Math.max(0, Math.trunc(_0x247a24)) : 0;
  return _0x1945e7[Math.min(_0x12a431, _0x1945e7.length - 1)] || null;
}
function firstNonEmptyUrl(..._0x3ed34c) {
  for (const _0x260620 of _0x3ed34c) {
    const _0x1c779d = String(_0x260620 || '').trim();
    if (_0x1c779d) return _0x1c779d;
  }
  return '';
}
export function collectRefThumbIds(_0x277390) {
  const _0x3e1c16 = [],
    _0x50543b = (_0x2cc86c) => {
      const _0x555c22 = String(_0x2cc86c || '').trim();
      if (!_0x555c22 || _0x3e1c16.includes(_0x555c22)) return;
      _0x3e1c16.push(_0x555c22);
    },
    _0x415b1b = resolveAiImagePrimaryItem(_0x277390);
  return (_0x50543b(_0x277390?.thumbId), _0x50543b(_0x415b1b?.thumbId), _0x3e1c16);
}
export function resolveRefImageRenderSources(_0x16737a, _0x373e85 = {}) {
  const _0x3591dc = resolveAiImagePrimaryItem(_0x16737a),
    _0x19866e = String(_0x373e85?.thumbBlobUrl || '').trim(),
    _0x1884af = firstNonEmptyUrl(
      resolveCanvasImageThumbUrl(_0x16737a),
      resolveCanvasImageThumbUrl(_0x3591dc),
      _0x19866e,
    ),
    _0x5e9f8d = firstNonEmptyUrl(
      resolveCanvasImageDisplayUrl(_0x16737a),
      resolveCanvasImageSourceUrl(_0x16737a),
      resolveCanvasImageDisplayUrl(_0x3591dc),
      resolveCanvasImageSourceUrl(_0x3591dc),
      _0x1884af,
    );
  return { thumbSrc: _0x1884af, previewSrc: _0x5e9f8d };
}
export function resolveRefImageCandidateUrls(_0x48888b) {
  const { thumbSrc: _0x353847, previewSrc: _0x4801c2 } = resolveRefImageRenderSources(_0x48888b),
    _0x1a1de7 = [_0x353847, _0x4801c2].filter(Boolean);
  return Array.from(new Set(_0x1a1de7));
}

function normalizeIdentityPart(_0x2f418f){return String(_0x2f418f??'')["trim"]();}

function appendImageIdentityFields(_0x508c71,_0x52026c,_0x15a677={}){['assetId',"sourceId","thumbId","imageUrl","sourceUrl","thumbUrl","url","resultUrl","localPath","originalLocalPath",'displayLocalPath','thumbLocalPath',"fileName","derivativeStatus"]["forEach"](_0x5ed6f6=>{const _0xcfae96=normalizeIdentityPart(_0x15a677?.[_0x5ed6f6]);if(_0xcfae96)_0x508c71["push"](_0x52026c+'.'+_0x5ed6f6+'='+_0xcfae96);});}

function hashRefImageVersionKey(_0xdc5414=''){const _0x53e45f=normalizeIdentityPart(_0xdc5414);let _0x173ac1=0x1505;for(let _0x57966e=0x0;_0x57966e<_0x53e45f["length"];_0x57966e+=0x1){_0x173ac1=(_0x173ac1<<0x5)+_0x173ac1^_0x53e45f['charCodeAt'](_0x57966e),_0x173ac1>>>=0x0;}return _0x173ac1['toString'](0x24);}

export function resolveRefImageMediaIdentityKey(_0x4e43e6,_0x198866={}){const _0x2b10bb=resolveAiImagePrimaryItem(_0x4e43e6),_0x37a1ba=["node="+normalizeIdentityPart(_0x4e43e6?.['id']),"type="+normalizeIdentityPart(_0x4e43e6?.["type"]),"_bizRev="+normalizeIdentityPart(_0x4e43e6?.['_bizRev']),"main="+normalizeIdentityPart(_0x4e43e6?.["mainImageIndex"]),'edgeSourceMediaKey='+normalizeIdentityPart(_0x198866?.["sourceMediaKey"])];return appendImageIdentityFields(_0x37a1ba,'node',_0x4e43e6),appendImageIdentityFields(_0x37a1ba,'primary',_0x2b10bb),_0x37a1ba['join']('|');}

export function versionRefImageUrl(_0x94b67e='',_0x4cffc3=''){const _0x5af576=String(_0x94b67e||'')["trim"](),_0x203a13=normalizeIdentityPart(_0x4cffc3);if(!_0x5af576||!_0x203a13)return _0x5af576;if(/^(?:blob:|data:)/i["test"](_0x5af576))return _0x5af576;if(!_0x5af576['startsWith']('/'))return _0x5af576;const [_0x1bbdfb,_0x52dcc5='']=_0x5af576["split"]('#',0x2),_0xcd8cc6=_0x1bbdfb["includes"]('?')?'&':'?',_0x5ccd7c=hashRefImageVersionKey(_0x203a13);return''+_0x1bbdfb+_0xcd8cc6+"aicv="+_0x5ccd7c+(_0x52dcc5?'#'+_0x52dcc5:'');}

export function resolveVersionedRefImageRenderSources(_0x1a4c47,_0x5652bf={},_0x41ca0b={}){const _0x51f3ba=resolveRefImageMediaIdentityKey(_0x1a4c47,_0x5652bf),{thumbSrc:_0x418865,previewSrc:_0x39b970}=resolveRefImageRenderSources(_0x1a4c47,_0x41ca0b),_0x8a1ac1=versionRefImageUrl(_0x418865,_0x51f3ba);return{'thumbSrc':_0x8a1ac1,'previewSrc':versionRefImageUrl(_0x39b970||_0x8a1ac1,_0x51f3ba),'mediaIdentityKey':_0x51f3ba};}
