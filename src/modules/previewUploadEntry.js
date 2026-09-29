import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import { uploadFile } from './project.js';
import { isPreviewModeEnabled } from './previewMode.js';
import {
  applyUploadedPreviewAudioResult,
  applyUploadedPreviewImageResult,
  applyUploadedPreviewVideoResult,
} from './previewUploadResult.js';
const PREVIEW_UPLOAD_TYPES = {
  image: {
    accept: 'image/*',
    mimePrefix: 'image/',
    labelKey: 'previewUpload.types.image',
    successMessageKey: 'previewUpload.success.image',
    applyResult: applyUploadedPreviewImageResult,
    nodeTypes: new Set(['source-image', 'image', 'ai-image']),
  },
  video: {
    accept: 'video/*',
    mimePrefix: 'video/',
    labelKey: 'previewUpload.types.video',
    successMessageKey: 'previewUpload.success.video',
    applyResult: applyUploadedPreviewVideoResult,
    nodeTypes: new Set(['source-video', 'video', 'ai-video']),
  },
  audio: {
    accept: 'audio/*',
    mimePrefix: 'audio/',
    labelKey: 'previewUpload.types.audio',
    successMessageKey: 'previewUpload.success.audio',
    applyResult: applyUploadedPreviewAudioResult,
    nodeTypes: new Set(['ai-audio']),
  },
};
function previewUploadText(_0x9878e6, _0xd3920c = {}) {
  return t('previewUpload.' + _0x9878e6, _0xd3920c);
}
function getPreviewUploadTypeLabel(_0x469858) {
  return t(_0x469858.labelKey);
}
function getPreviewUploadSuccessMessage(_0x323497) {
  return t(_0x323497.successMessageKey);
}
function getState(_0x514a3d) {
  return _0x514a3d?.getState?.() || {};
}
function getToast(_0x330a84) {
  return typeof _0x330a84 === 'function' ? _0x330a84 : globalThis.window?.showToast;
}
function setButtonBusy(_0x2e013f, _0x3d845a) {
  if (!_0x2e013f) return;
  if (_0x3d845a) {
    !_0x2e013f.dataset.previewUploadLabel &&
      (_0x2e013f.dataset.previewUploadLabel = _0x2e013f.textContent || previewUploadText('upload'));
    ((_0x2e013f.disabled = true), (_0x2e013f.textContent = previewUploadText('uploading')));
    return;
  }
  ((_0x2e013f.disabled = false),
    (_0x2e013f.textContent = _0x2e013f.dataset.previewUploadLabel || previewUploadText('upload')));
}
export function resolvePreviewUploadTarget(_0xd67159 = {}) {
  const _0x3c2747 = Array.isArray(_0xd67159.selectedNodeIds) ? _0xd67159.selectedNodeIds.filter(Boolean) : [];
  if (_0x3c2747.length !== 1) return { ok: false, message: previewUploadText('selectSingleNode') };
  const _0x42dc44 = _0x3c2747[0],
    _0x36ccd3 = _0xd67159.nodes?.[_0x42dc44];
  if (!_0x36ccd3) return { ok: false, message: previewUploadText('selectedNodeMissing') };
  const _0x208c11 = String(_0x36ccd3.type || '').trim();
  for (const [_0x3849b5, _0x1816e1] of Object.entries(PREVIEW_UPLOAD_TYPES)) {
    if (!_0x1816e1.nodeTypes.has(_0x208c11)) continue;
    return {
      ok: true,
      kind: _0x3849b5,
      nodeId: _0x42dc44,
      node: _0x36ccd3,
      accept: _0x1816e1.accept,
      mimePrefix: _0x1816e1.mimePrefix,
      label: getPreviewUploadTypeLabel(_0x1816e1),
      successMessage: getPreviewUploadSuccessMessage(_0x1816e1),
      applyResult: _0x1816e1.applyResult,
    };
  }
  return { ok: false, message: previewUploadText('unsupportedNode') };
}
export async function handlePreviewUploadFile({
  file: _0x1d4bf1,
  button: button = null,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: getProjectId = () => globalThis.window?.currentProjectId || 'default_v2_project',
  applyResults: applyResults = {},
} = {}) {
  const _0x42b715 = getToast(showToast),
    _0x5d3910 = resolvePreviewUploadTarget(getState(storeApi));
  if (!_0x5d3910.ok) return (_0x42b715?.(_0x5d3910.message, 'warn'), false);
  if (!_0x1d4bf1) return false;
  if (!String(_0x1d4bf1.type || '').startsWith(_0x5d3910.mimePrefix))
    return (_0x42b715?.(previewUploadText('invalidFileType', { label: _0x5d3910.label }), 'error'), false);
  setButtonBusy(button, true);
  try {
    const _0x2d0a09 = await uploadFileImpl(_0x1d4bf1, getProjectId()),
      _0x56e87d = applyResults[_0x5d3910.kind] || _0x5d3910.applyResult;
    return (
      _0x56e87d({ nodeId: _0x5d3910.nodeId, uploadRes: _0x2d0a09, fileName: _0x1d4bf1.name }),
      _0x42b715?.(_0x5d3910.successMessage, 'success'),
      true
    );
  } catch (_0x5ba80f) {
    return (_0x42b715?.(_0x5ba80f?.message || previewUploadText('uploadFailed'), 'error'), false);
  } finally {
    setButtonBusy(button, false);
  }
}
export function bindPreviewUploadEntry({
  button: _0x5dba32,
  input: _0x4c3ae4,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: _0x14aef5,
  applyResults: _0xdb71b,
} = {}) {
  if (!_0x5dba32 || !_0x4c3ae4) return null;
  const _0x193157 = getToast(showToast),
    _0x443307 = () => {
      if (!isPreviewModeEnabled()) return;
      const _0x3a0705 = resolvePreviewUploadTarget(getState(storeApi));
      if (!_0x3a0705.ok) {
        _0x193157?.(_0x3a0705.message, 'warn');
        return;
      }
      ((_0x4c3ae4.accept = _0x3a0705.accept), (_0x4c3ae4.value = ''), _0x4c3ae4.click?.());
    },
    _0x506ddb = async () => {
      const _0x535bc8 = _0x4c3ae4.files?.[0];
      if (!_0x535bc8) return;
      try {
        await handlePreviewUploadFile({
          file: _0x535bc8,
          button: _0x5dba32,
          storeApi: storeApi,
          uploadFileImpl: uploadFileImpl,
          showToast: showToast,
          getProjectId: _0x14aef5,
          applyResults: _0xdb71b,
        });
      } finally {
        _0x4c3ae4.value = '';
      }
    };
  return (
    _0x5dba32.addEventListener('click', _0x443307),
    _0x4c3ae4.addEventListener('change', _0x506ddb),
    () => {
      (_0x5dba32.removeEventListener?.('click', _0x443307),
        _0x4c3ae4.removeEventListener?.('change', _0x506ddb));
    }
  );
}

const OPTIMISTIC_IMAGE_PREVIEW_SELECTOR = ".preview-upload-optimistic-media";
const DEFAULT_OPTIMISTIC_PREVIEW_FINALIZE_DELAY_MS = 0x15e;
const DEFAULT_OPTIMISTIC_PREVIEW_COMMIT_TIMEOUT_MS = 0x7530;

function shouldReadPreviewUploadNaturalSize(_0x4cf582={}){return _0x4cf582["kind"]==='image';}

function setToolbarUploadButtonBusy(_0x428e01,_0x931827){if(!_0x428e01)return;_0x428e01["disabled"]=_0x931827===!![],_0x428e01["classList"]?.['toggle']?.("is-uploading",_0x931827===!![]),_0x428e01["classList"]?.['toggle']?.("is-task-running",_0x931827===!![]),_0x931827===!![]?_0x428e01["setAttribute"]?.("aria-busy","true"):_0x428e01["removeAttribute"]?.('aria-busy');}

function createToolbarUploadInput(_0xd9b49f){const _0x5c3948=_0xd9b49f?.["ownerDocument"]||globalThis["document"]||null;if(!_0x5c3948?.["createElement"])return null;const _0x31b20b=_0x5c3948["createElement"]("input");_0x31b20b["type"]='file',_0x31b20b['hidden']=!![],_0x31b20b['className']='node-toolbar-upload-input';const _0x323419=_0xd9b49f?.['closest']?.(".node-floating-toolbar")||_0xd9b49f?.["parentNode"]||_0x5c3948["body"]||null;return _0x323419?.["appendChild"]?.(_0x31b20b),_0x31b20b;}

function getUrlApi(){return globalThis['URL']||globalThis["webkitURL"]||null;}

function safelyCreateObjectUrl(_0x9f2e23){const _0x58ad11=getUrlApi();if(!_0x9f2e23||typeof _0x58ad11?.["createObjectURL"]!=="function")return'';try{return String(_0x58ad11['createObjectURL'](_0x9f2e23)||'')['trim']();}catch{return'';}}

function safelyRevokeObjectUrl(_0x5d3aec){if(!_0x5d3aec||!String(_0x5d3aec)['startsWith']("blob:"))return;const _0x75b201=getUrlApi();try{_0x75b201?.["revokeObjectURL"]?.(_0x5d3aec);}catch{}}

function getMountedPreviewElement(_0x24e3a3){const _0x1966e7=String(_0x24e3a3||'')["trim"]();if(!_0x1966e7)return null;const _0x213fd8=globalThis["window"]?.["v2Renderer"];try{_0x213fd8?.['hydrateDeferredNodeForImmediateMedia']?.(_0x1966e7);}catch{}try{const _0x285d53=_0x213fd8?.["queryMountedNodeElement"]?.(_0x1966e7,'.img-node-preview');if(_0x285d53)return _0x285d53;}catch{}const _0x231ee9=globalThis['document'],_0x4d1928=typeof _0x213fd8?.['getMountedWrapper']==='function'?_0x213fd8["getMountedWrapper"](_0x1966e7):null;if(_0x4d1928?.["querySelector"])return _0x4d1928['querySelector'](".img-node-preview");const _0x2b8c5a=typeof _0x231ee9?.["getElementById"]==="function"?_0x231ee9["getElementById"](_0x1966e7):null;return _0x2b8c5a?.["querySelector"]?.(".img-node-preview")||null;}

function clearExistingOptimisticImagePreview(_0x2f495e){if(!_0x2f495e)return;if(typeof _0x2f495e["_previewUploadOptimisticCleanup"]==="function"){_0x2f495e["_previewUploadOptimisticCleanup"]({'delayMs':0x0,'force':!![]});return;}_0x2f495e["querySelectorAll"]?.(OPTIMISTIC_IMAGE_PREVIEW_SELECTOR)?.["forEach"](_0x48dad4=>_0x48dad4["remove"]?.());}

function hasClassName(_0x292d6f,_0xb1dc6c){return _0x292d6f?.['classList']?.["contains"]?.(_0xb1dc6c)||String(_0x292d6f?.["className"]||'')["split"](/\s+/)['includes'](_0xb1dc6c);}

function getPreviewImageElements(_0x344317){const _0x5f40a4=Array["from"](_0x344317?.["querySelectorAll"]?.("img")||[]);return _0x5f40a4['filter'](_0x3473c6=>!hasClassName(_0x3473c6,"preview-upload-optimistic-media"));}

function getImageElementSrc(_0x2b4f78){return String(_0x2b4f78?.["currentSrc"]||_0x2b4f78?.["src"]||_0x2b4f78?.["getAttribute"]?.("src")||'')["trim"]();}

function getImageElementAttributeSrc(_0x39a500){return String(_0x39a500?.['src']||_0x39a500?.['getAttribute']?.('src')||'')["trim"]();}

function normalizeUrlPathForCompare(_0x427fab=''){const _0x2d97cb=String(_0x427fab||'')['trim']();if(!_0x2d97cb)return'';try{return new URL(_0x2d97cb,"http://aic.local")["pathname"]["replace"](/\/+/g,'/');}catch{return _0x2d97cb['split']('?')[0x0]["split"]('#')[0x0]['replace'](/\\/g,'/');}}

function imageSrcMatchesExpected(_0x373c64='',_0x2baa3f=[]){const _0x4b415e=normalizeUrlPathForCompare(_0x373c64);if(!_0x4b415e)return![];const _0x5b4eec=_0x2baa3f["map"](_0x4f2e51=>normalizeUrlPathForCompare(_0x4f2e51))["filter"](Boolean);if(_0x5b4eec["length"]===0x0)return!![];return _0x5b4eec['some'](_0x53628e=>_0x4b415e===_0x53628e||_0x4b415e["endsWith"](_0x53628e));}

function toUploadedPreviewLocalUrl(_0x50941f=''){const _0x4630bb=String(_0x50941f||'')["trim"]()['replace'](/\\/g,'/');if(!_0x4630bb)return'';if(/^(?:https?:|blob:|data:|aic-local-preview:)/i["test"](_0x4630bb))return _0x4630bb;return _0x4630bb['startsWith']('/')?_0x4630bb:'/'+_0x4630bb;}

function resolveUploadedPreviewImageExpectedUrls(_0x1d2efa={}){return Array["from"](new Set([_0x1d2efa?.["displayUrl"],_0x1d2efa?.["originalUrl"],_0x1d2efa?.["url"],toUploadedPreviewLocalUrl(_0x1d2efa?.["displayLocalPath"]),toUploadedPreviewLocalUrl(_0x1d2efa?.['originalLocalPath']),toUploadedPreviewLocalUrl(_0x1d2efa?.["localPath"])]["map"](_0x118dd1=>String(_0x118dd1||'')["trim"]())["filter"](Boolean)));}

function getMountedPreviewImageSrc(_0x2e860d){const _0x862de8=getPreviewImageElements(_0x2e860d);for(const _0x243031 of _0x862de8){const _0x48e982=getImageElementSrc(_0x243031);if(_0x48e982)return _0x48e982;}return'';}

function waitForUploadedPreviewImageCommit({nodeId:_0x4114f5,previousSrc:previousSrc='',expectedUrls:expectedUrls=[],timeoutMs:timeoutMs=DEFAULT_OPTIMISTIC_PREVIEW_COMMIT_TIMEOUT_MS,onPoll:onPoll=null}={}){const _0x3c22f6=String(_0x4114f5||'')["trim"]();if(!_0x3c22f6)return Promise["resolve"](![]);return new Promise(_0x5dfc93=>{let _0x995784=![],_0x2b3717=null,_0x4c82ca=null;const _0x58ab69=new Set(),_0x341c07=[],_0x23076b=_0x2a2b2d=>{if(_0x995784)return;_0x995784=!![];if(_0x2b3717!==null)clearTimeout(_0x2b3717);if(_0x4c82ca!==null)clearTimeout(_0x4c82ca);for(const _0x5d2841 of _0x341c07['splice'](0x0))_0x5d2841();_0x5dfc93(_0x2a2b2d);},_0x2938fa=_0x90e080=>{if(!_0x90e080?.["addEventListener"]||_0x58ab69['has'](_0x90e080))return;_0x58ab69["add"](_0x90e080);const _0x4d14fc=String(_0x90e080["currentSrc"]||'')["trim"]()||getImageElementAttributeSrc(_0x90e080)||getImageElementSrc(_0x90e080);if(_0x90e080["complete"]&&_0x4d14fc!==previousSrc&&imageSrcMatchesExpected(_0x4d14fc,expectedUrls)){_0x23076b(!![]);return;}const _0x3bdb64=()=>{const _0x186bf2=String(_0x90e080["currentSrc"]||'')["trim"]()||getImageElementSrc(_0x90e080);_0x186bf2!==previousSrc&&imageSrcMatchesExpected(_0x186bf2,expectedUrls)&&_0x23076b(!![]);},_0x531899=()=>{const _0x5f0397=getImageElementAttributeSrc(_0x90e080)||getImageElementSrc(_0x90e080);_0x5f0397!==previousSrc&&imageSrcMatchesExpected(_0x5f0397,expectedUrls)&&_0x23076b(!![]);};_0x90e080['addEventListener']("load",_0x3bdb64,{'once':!![]}),_0x90e080['addEventListener']("error",_0x531899,{'once':!![]}),_0x341c07['push'](()=>{_0x90e080["removeEventListener"]?.("load",_0x3bdb64),_0x90e080["removeEventListener"]?.("error",_0x531899);});},_0x31f620=()=>{if(typeof onPoll==="function")onPoll();const _0x4e6412=getMountedPreviewElement(_0x3c22f6),_0x2309fd=getPreviewImageElements(_0x4e6412);for(const _0x1b0ee5 of _0x2309fd){const _0x406062=getImageElementAttributeSrc(_0x1b0ee5)||getImageElementSrc(_0x1b0ee5);if(!_0x406062||_0x406062===previousSrc)continue;if(!imageSrcMatchesExpected(_0x406062,expectedUrls))continue;return _0x2938fa(_0x1b0ee5),![];}return![];},_0x342007=()=>{if(_0x995784||_0x31f620())return;_0x2b3717=setTimeout(_0x342007,0x50);};_0x4c82ca=setTimeout(()=>_0x23076b(![]),Math["max"](0x0,Number(timeoutMs)||0x0)),_0x342007();});}

function applyOptimisticImageUploadPreview({nodeId:_0x1b436d,file:_0x5d99f3}={}){if(!String(_0x5d99f3?.["type"]||'')["startsWith"]("image/"))return null;const _0x1c498d=getMountedPreviewElement(_0x1b436d),_0x2041c3=_0x1c498d?.["ownerDocument"]||globalThis["document"];if(!_0x1c498d?.["appendChild"]||!_0x2041c3?.['createElement'])return null;const _0x33c9c6=safelyCreateObjectUrl(_0x5d99f3);if(!_0x33c9c6)return null;clearExistingOptimisticImagePreview(_0x1c498d);const _0xd7bb27=getMountedPreviewImageSrc(_0x1c498d),_0x3bb9b0=_0x2041c3['createElement']("img");_0x3bb9b0['className']='preview-upload-optimistic-media',_0x3bb9b0["draggable"]=![],_0x3bb9b0["alt"]='',_0x3bb9b0['dataset']['previewUploadOptimistic']='true',_0x3bb9b0["src"]=_0x33c9c6;let _0x15b898=![],_0xd56d93=null,_0x2e8b3a=null;const _0x325c9d=(_0x390d4c=getMountedPreviewElement(_0x1b436d))=>{if(_0x15b898||!_0x390d4c?.["appendChild"])return![];return _0x2e8b3a&&_0x2e8b3a!==_0x390d4c&&_0x2e8b3a["_previewUploadOptimisticCleanup"]===_0x8bfa5f&&delete _0x2e8b3a["_previewUploadOptimisticCleanup"],_0x3bb9b0["parentNode"]!==_0x390d4c&&_0x390d4c['appendChild'](_0x3bb9b0),_0x390d4c["_previewUploadOptimisticCleanup"]=_0x8bfa5f,_0x2e8b3a=_0x390d4c,!![];},_0x3f2619=()=>{if(_0x15b898)return;_0x15b898=!![],_0xd56d93=null,_0x3bb9b0["remove"]?.(),safelyRevokeObjectUrl(_0x33c9c6),_0x2e8b3a?.["_previewUploadOptimisticCleanup"]===_0x8bfa5f&&delete _0x2e8b3a["_previewUploadOptimisticCleanup"];};function _0x8bfa5f({delayMs:delayMs=0x0,force:force=![]}={}){if(_0x15b898)return;_0xd56d93!==null&&(clearTimeout(_0xd56d93),_0xd56d93=null);const _0x41d203=()=>{_0x3f2619();},_0x16ec5f=Math["max"](0x0,Number(delayMs)||0x0);!force&&_0x16ec5f>0x0&&typeof setTimeout==="function"?_0xd56d93=setTimeout(_0x41d203,_0x16ec5f):_0x41d203();}return _0x325c9d(_0x1c498d),{'cleanup':_0x8bfa5f,'ensureMounted':_0x325c9d,'objectUrl':_0x33c9c6,'previousMediaSrc':_0xd7bb27};}

function flushUploadedPreviewNode(_0x5e4f3e){const _0x167f66=String(_0x5e4f3e||'')["trim"]();if(!_0x167f66)return![];try{return globalThis["window"]?.["v2Renderer"]?.['flushNode']?.(_0x167f66)===!![];}catch{return![];}}

export function bindPreviewUploadToolbarAction({button:_0x4c15cf,input:input=null,storeApi:storeApi=appStore,uploadFileImpl:uploadFileImpl=uploadFile,showToast:showToast=null,getProjectId:_0x228652,applyResults:_0x29836f}={}){if(!_0x4c15cf)return()=>{};const _0x3240b9=input||createToolbarUploadInput(_0x4c15cf);if(!_0x3240b9)return()=>{};const _0x48233a=getToast(showToast),_0x28c6a2=_0x30dc62=>{_0x30dc62?.["preventDefault"]?.(),_0x30dc62?.["stopPropagation"]?.();const _0x5f2abe=resolvePreviewUploadTarget(getState(storeApi));if(!_0x5f2abe['ok']){_0x48233a?.(_0x5f2abe["message"],"warn");return;}_0x3240b9["accept"]=_0x5f2abe["accept"],_0x3240b9["value"]='',_0x3240b9['click']?.();},_0x2184d5=async()=>{const _0x58682f=_0x3240b9["files"]?.[0x0];if(!_0x58682f)return;setToolbarUploadButtonBusy(_0x4c15cf,!![]);try{await handlePreviewUploadFile({'file':_0x58682f,'button':null,'storeApi':storeApi,'uploadFileImpl':uploadFileImpl,'showToast':showToast,'getProjectId':_0x228652,'applyResults':_0x29836f});}finally{setToolbarUploadButtonBusy(_0x4c15cf,![]),_0x3240b9["value"]='';}};return _0x4c15cf['addEventListener']("click",_0x28c6a2),_0x3240b9["addEventListener"]('change',_0x2184d5),()=>{_0x4c15cf['removeEventListener']?.("click",_0x28c6a2),_0x3240b9["removeEventListener"]?.('change',_0x2184d5);};}
