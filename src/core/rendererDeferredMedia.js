import { resolveRendererLowZoomMountLimit } from './rendererVirtualization.js';
import { isNodeType } from '../modules/registry.js';
export const RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG = '__rendererDeferMediaOnMount';
export const RENDERER_DEFER_DETAILS_ON_MOUNT_FLAG = '__rendererDeferDetailsOnMount';
export const RENDERER_EAGER_VIDEO_PREVIEW_ON_MOUNT_FLAG = '__rendererEagerVideoPreviewOnMount';
export const RENDERER_PREBUILD_OFFSCREEN_FLAG = '__rendererPrebuildOffscreen';
export function shouldDeferRendererMediaOnMount(_0x59bda8 = {}) {
  return _0x59bda8?.[RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG] === true;
}
export function withRendererDeferredMediaHint(_0x560257 = {}, _0x5d968b = false) {
  if (!_0x5d968b) return _0x560257;
  return { ...(_0x560257 || {}), [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true };
}
export function shouldDeferRendererDetailsOnMount(_0x44c2b1 = {}) {
  return _0x44c2b1?.[RENDERER_DEFER_DETAILS_ON_MOUNT_FLAG] === true;
}
export function shouldUseRendererEagerVideoPreviewOnMount(_0x323a80 = {}) {
  return _0x323a80?.[RENDERER_EAGER_VIDEO_PREVIEW_ON_MOUNT_FLAG] === true;
}
export function shouldPrebuildRendererRuntimeOffscreen(_0x947d1b = {}) {
  return _0x947d1b?.[RENDERER_PREBUILD_OFFSCREEN_FLAG] === true;
}
export function withRendererDeferredMountHints(
  _0x4d6f46 = {},
  {
    deferMedia: deferMedia = false,
    deferDetails: deferDetails = false,
    eagerVideoPreview: eagerVideoPreview = false,
    prebuildOffscreen: prebuildOffscreen = false,
  } = {},
) {
  if (!deferMedia && !deferDetails && !eagerVideoPreview && !prebuildOffscreen) return _0x4d6f46;
  return {
    ...(_0x4d6f46 || {}),
    ...(deferMedia ? { [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true } : {}),
    ...(deferDetails ? { [RENDERER_DEFER_DETAILS_ON_MOUNT_FLAG]: true } : {}),
    ...(eagerVideoPreview ? { [RENDERER_EAGER_VIDEO_PREVIEW_ON_MOUNT_FLAG]: true } : {}),
    ...(prebuildOffscreen ? { [RENDERER_PREBUILD_OFFSCREEN_FLAG]: true } : {}),
  };
}
const DEFAULT_MEDIA_HYDRATION_BATCH_SIZE = 6,
  DEFAULT_MEDIA_HYDRATION_RETRY_MS = 120,
  DEFAULT_MEDIA_HYDRATION_FALLBACK_MS = 24,
  DEFAULT_MEDIA_HYDRATION_IDLE_TIMEOUT_MS = 180;
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
export function createRendererDeferredMediaController({
  getComponent: _0x84fadf,
  isInteractionBusy: _0x1da791,
  onHydrateMedia: _0x553660,
  batchSize: batchSize = DEFAULT_MEDIA_HYDRATION_BATCH_SIZE,
} = {}) {
  let _0x13e325 = [],
    _0x33b600 = new Set(),
    _0x1f37aa = null,
    _0x5be506 = '',
    _0x335a1b = false;
  const _0x157fff = Math.max(1, Math.trunc(Number(batchSize) || 1));
  function _0x2317bc() {
    if (_0x1f37aa === null) return;
    const _0x35d6bf = getWindowLike();
    if (_0x5be506 === 'idle' && typeof _0x35d6bf.cancelIdleCallback === 'function')
      _0x35d6bf.cancelIdleCallback(_0x1f37aa);
    else _0x5be506 === 'timeout' && clearTimeout(_0x1f37aa);
    ((_0x1f37aa = null), (_0x5be506 = ''));
  }
  function _0x2b0a9a(_0x1d8ccc = DEFAULT_MEDIA_HYDRATION_FALLBACK_MS) {
    if (_0x335a1b || _0x1f37aa !== null || _0x13e325.length === 0) return;
    const _0x423ed2 = getWindowLike();
    if (_0x1da791?.()) {
      ((_0x5be506 = 'timeout'), (_0x1f37aa = setTimeout(_0xff8e07, DEFAULT_MEDIA_HYDRATION_RETRY_MS)));
      return;
    }
    if (_0x13e325.length >= _0x157fff * 4) {
      ((_0x5be506 = 'timeout'), (_0x1f37aa = setTimeout(_0xff8e07, Math.max(0, Number(_0x1d8ccc) || 0))));
      return;
    }
    if (typeof _0x423ed2.requestIdleCallback === 'function') {
      ((_0x5be506 = 'idle'),
        (_0x1f37aa = _0x423ed2.requestIdleCallback(_0xff8e07, {
          timeout: DEFAULT_MEDIA_HYDRATION_IDLE_TIMEOUT_MS,
        })));
      return;
    }
    ((_0x5be506 = 'timeout'), (_0x1f37aa = setTimeout(_0xff8e07, Math.max(0, Number(_0x1d8ccc) || 0))));
  }
  function _0x568dcf(_0x2211da) {
    (_0x33b600.delete(_0x2211da), _0x84fadf?.(_0x2211da)?.hydrateDeferredMedia?.(), _0x553660?.(_0x2211da));
  }
  function _0xff8e07(_0xfb2d2b = null) {
    ((_0x1f37aa = null), (_0x5be506 = ''));
    if (_0x335a1b || _0x13e325.length === 0) return;
    if (_0x1da791?.()) {
      _0x2b0a9a(DEFAULT_MEDIA_HYDRATION_RETRY_MS);
      return;
    }
    const _0x50565a = () => {
      if (!_0xfb2d2b || _0xfb2d2b.didTimeout) return true;
      if (typeof _0xfb2d2b.timeRemaining !== 'function') return true;
      return _0xfb2d2b.timeRemaining() > 3;
    };
    let _0xbe927 = 0;
    while (_0x13e325.length > 0 && _0xbe927 < _0x157fff && _0x50565a()) {
      const _0xc5b088 = _0x13e325.shift();
      if (!_0x33b600.has(_0xc5b088)) continue;
      (_0x568dcf(_0xc5b088), (_0xbe927 += 1));
    }
    if (_0x13e325.length > 0) _0x2b0a9a();
  }
  function _0x50fa38(_0x33ea83) {
    if (!_0x33ea83 || _0x33b600.has(_0x33ea83)) return;
    (_0x33b600.add(_0x33ea83), _0x13e325.push(_0x33ea83), _0x2b0a9a());
  }
  function _0x305dbd(_0x4cdc3f) {
    if (!_0x4cdc3f) return;
    _0x33b600.delete(_0x4cdc3f);
  }
  function _0x22f4de() {
    (_0x2317bc(), (_0x13e325 = []), (_0x33b600 = new Set()));
  }
  function _0x6a42c1() {
    ((_0x335a1b = true), _0x2317bc());
  }
  function _0x1b7d90() {
    ((_0x335a1b = false), _0x2b0a9a());
  }
  return {
    clear: _0x22f4de,
    enqueue: _0x50fa38,
    flush: _0xff8e07,
    forget: _0x305dbd,
    pause: _0x6a42c1,
    resume: _0x1b7d90,
    getQueuedCount: () => _0x33b600.size,
  };
}

const MAX_VISIBLE_AUDIO_WARMUP_COUNT=0x4;

export function shouldActivateRendererMediaHoverPlayback({viewport:_0x26178e,nodeCount:nodeCount=0x0,isSelected:isSelected=![]}={}){if(isSelected===!![])return!![];return resolveRendererLowZoomMountLimit({'viewport':_0x26178e,'nodeCount':nodeCount})<=0x0;}

export function scheduleRendererVisibleAudioSurfaceHydration({node:_0x317480,nodeId:_0x47bd07,isVisible:_0x4dff28,isSelected:_0x1728e8,viewport:_0x4bd8fb,nodeCount:_0x49bfa,visibleAudioRank:visibleAudioRank=0x1,component:_0x415c0a,deferredMedia:_0x138f42}={}){if(!_0x47bd07)return![];if(!isNodeType(_0x317480,["source-audio","ai-audio",'audio']))return![];_0x415c0a?.['setRendererAudioSurfaceVisible']?.(_0x4dff28===!![]);if(_0x4dff28!==!![])return![];if(_0x1728e8!==!![]&&(resolveRendererLowZoomMountLimit({'viewport':_0x4bd8fb,'nodeCount':_0x49bfa})>0x0||Number(visibleAudioRank)>MAX_VISIBLE_AUDIO_WARMUP_COUNT))return![];if(_0x415c0a?.["prepareRendererVisibleAudioSurface"]?.()!==!![])return![];if(_0x1728e8)_0x138f42?.["hydrateNow"]?.(_0x47bd07);else _0x138f42?.['enqueue']?.(_0x47bd07,{'urgent':!![]});return!![];}

export function createRendererVisibleAudioSurfaceHydrationPass({viewport:_0x59b5be,nodeCount:_0x191476,deferredMedia:_0x2b28bb}={}){let _0x3f18f5=0x0;return({node:_0x547ebb,nodeId:_0x41aa33,isVisible:_0x51797c,isSelected:_0x577997,component:_0x3baf01}={})=>{const _0x571b7b=_0x577997!==!![]&&_0x51797c===!![]&&isNodeType(_0x547ebb,["source-audio","ai-audio","audio"])?_0x3f18f5+=0x1:0x1;return scheduleRendererVisibleAudioSurfaceHydration({'node':_0x547ebb,'nodeId':_0x41aa33,'isVisible':_0x51797c,'isSelected':_0x577997,'viewport':_0x59b5be,'nodeCount':_0x191476,'visibleAudioRank':_0x571b7b,'component':_0x3baf01,'deferredMedia':_0x2b28bb});};}

const DEFAULT_VIDEO_HYDRATION_BATCH_SIZE = 0x1;
const VIDEO_MEDIA_NODE_TYPES = new Set(["source-video",'ai-video',"video"]);

function getDeferredMediaComponentType(_0xd4883){return String(_0xd4883?.["_data"]?.["type"]||_0xd4883?.["nodeData"]?.["type"]||_0xd4883?.["data"]?.["type"]||'')["trim"]()['toLowerCase']();}

function isDeferredVideoMediaComponent(_0x4b5ea1){return VIDEO_MEDIA_NODE_TYPES["has"](getDeferredMediaComponentType(_0x4b5ea1));}
