import { resolveRendererLowZoomMountLimit } from './rendererVirtualization.js';
import { isNodeType } from '../modules/registry.js';
export const RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG = '__rendererDeferMediaOnMount';
export const RENDERER_DEFER_DETAILS_ON_MOUNT_FLAG = '__rendererDeferDetailsOnMount';
export const RENDERER_EAGER_VIDEO_PREVIEW_ON_MOUNT_FLAG = '__rendererEagerVideoPreviewOnMount';
export const RENDERER_PREBUILD_OFFSCREEN_FLAG = '__rendererPrebuildOffscreen';
export function shouldDeferRendererMediaOnMount(options = {}) {
  return options?.[RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG] === true;
}
export function withRendererDeferredMediaHint(options2 = {}, enabled = false) {
  if (!enabled) return options2;
  return { ...(options2 || {}), [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true };
}
export function shouldDeferRendererDetailsOnMount(options3 = {}) {
  return options3?.[RENDERER_DEFER_DETAILS_ON_MOUNT_FLAG] === true;
}
export function shouldUseRendererEagerVideoPreviewOnMount(options4 = {}) {
  return options4?.[RENDERER_EAGER_VIDEO_PREVIEW_ON_MOUNT_FLAG] === true;
}
export function shouldPrebuildRendererRuntimeOffscreen(options5 = {}) {
  return options5?.[RENDERER_PREBUILD_OFFSCREEN_FLAG] === true;
}
export function withRendererDeferredMountHints(
  options6 = {},
  {
    deferMedia: deferMedia = false,
    deferDetails: deferDetails = false,
    eagerVideoPreview: eagerVideoPreview = false,
    prebuildOffscreen: prebuildOffscreen = false,
  } = {},
) {
  if (!deferMedia && !deferDetails && !eagerVideoPreview && !prebuildOffscreen) return options6;
  return {
    ...(options6 || {}),
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
  getComponent: getComponent,
  isInteractionBusy: isInteractionBusy,
  onHydrateMedia: onHydrateMedia,
  batchSize: batchSize = DEFAULT_MEDIA_HYDRATION_BATCH_SIZE,
} = {}) {
  let list = [],
    map = new Set(),
    setTimeout2 = null,
    value = '';
  let paused = false;
  const item = Math.max(1, Math.trunc(Number(batchSize) || 1));
  function run() {
    if (setTimeout2 === null) return;
    const windowLike = getWindowLike();
    if (value === 'idle' && typeof windowLike.cancelIdleCallback === 'function')
      windowLike.cancelIdleCallback(setTimeout2);
    else value === 'timeout' && clearTimeout(setTimeout2);
    ((setTimeout2 = null), (value = ''));
  }
  function run2(key = DEFAULT_MEDIA_HYDRATION_FALLBACK_MS) {
    if (paused || setTimeout2 !== null || list.length === 0) return;
    const windowLike2 = getWindowLike();
    if (isInteractionBusy?.()) {
      ((value = 'timeout'), (setTimeout2 = setTimeout(flush, DEFAULT_MEDIA_HYDRATION_RETRY_MS)));
      return;
    }
    if (list.length >= item * 4) {
      ((value = 'timeout'), (setTimeout2 = setTimeout(flush, Math.max(0, Number(key) || 0))));
      return;
    }
    if (typeof windowLike2.requestIdleCallback === 'function') {
      ((value = 'idle'),
        (setTimeout2 = windowLike2.requestIdleCallback(flush, {
          timeout: DEFAULT_MEDIA_HYDRATION_IDLE_TIMEOUT_MS,
        })));
      return;
    }
    ((value = 'timeout'), (setTimeout2 = setTimeout(flush, Math.max(0, Number(key) || 0))));
  }
  function run3(index) {
    (map.delete(index), getComponent?.(index)?.hydrateDeferredMedia?.(), onHydrateMedia?.(index));
  }
  function flush(enabled2 = null) {
    ((setTimeout2 = null), (value = ''));
    if (paused || list.length === 0) return;
    if (isInteractionBusy?.()) {
      run2(DEFAULT_MEDIA_HYDRATION_RETRY_MS);
      return;
    }
    const run4 = () => {
      if (!enabled2 || enabled2.didTimeout) return true;
      if (typeof enabled2.timeRemaining !== 'function') return true;
      return enabled2.timeRemaining() > 3;
    };
    let result = 0;
    while (list.length > 0 && result < item && run4()) {
      const data = list.shift();
      if (!map.has(data)) continue;
      (run3(data), (result += 1));
    }
    if (list.length > 0) run2();
  }
  function enqueue(enabled3) {
    if (!enabled3 || map.has(enabled3)) return;
    (map.add(enabled3), list.push(enabled3), run2());
  }
  function forget(enabled4) {
    if (!enabled4) return;
    map.delete(enabled4);
  }
  function clear() {
    (run(), (list = []), (map = new Set()));
  }
  return {
    clear: clear,
    enqueue: enqueue,
    flush: flush,
    forget: forget,
    pause() {
      paused = true;
      run();
    },
    resume() {
      paused = false;
      run2();
    },
    getQueuedCount: () => map.size,
  };
}

const MAX_VISIBLE_AUDIO_WARMUP_COUNT = 4;

export function shouldActivateRendererMediaHoverPlayback({
  viewport: viewport,
  nodeCount: nodeCount = 0,
  isSelected: isSelected = false,
} = {}) {
  if (isSelected === true) return true;
  return resolveRendererLowZoomMountLimit({ viewport: viewport, nodeCount: nodeCount }) <= 0;
}

export function scheduleRendererVisibleAudioSurfaceHydration({
  node: node,
  nodeId: nodeId,
  isVisible: isVisible,
  isSelected: isSelected2,
  viewport: viewport2,
  nodeCount: nodeCount2,
  visibleAudioRank: visibleAudioRank = 1,
  component: component,
  deferredMedia: deferredMedia,
} = {}) {
  if (!nodeId) return false;
  if (!isNodeType(node, ['source-audio', 'ai-audio', 'audio'])) return false;
  component?.['setRendererAudioSurfaceVisible']?.(isVisible === true);
  if (isVisible !== true) return false;
  if (
    isSelected2 !== true &&
    (resolveRendererLowZoomMountLimit({ viewport: viewport2, nodeCount: nodeCount2 }) > 0 ||
      Number(visibleAudioRank) > MAX_VISIBLE_AUDIO_WARMUP_COUNT)
  )
    return false;
  if (component?.['prepareRendererVisibleAudioSurface']?.() !== true) return false;
  if (isSelected2) deferredMedia?.['hydrateNow']?.(nodeId);
  else deferredMedia?.['enqueue']?.(nodeId, { urgent: true });
  return true;
}

export function createRendererVisibleAudioSurfaceHydrationPass({
  viewport: viewport3,
  nodeCount: nodeCount3,
  deferredMedia: deferredMedia2,
} = {}) {
  let target = 0;
  return ({
    node: node2,
    nodeId: nodeId2,
    isVisible: isVisible2,
    isSelected: isSelected3,
    component: component2,
  } = {}) => {
    const source =
      isSelected3 !== true && isVisible2 === true && isNodeType(node2, ['source-audio', 'ai-audio', 'audio'])
        ? (target += 1)
        : 1;
    return scheduleRendererVisibleAudioSurfaceHydration({
      node: node2,
      nodeId: nodeId2,
      isVisible: isVisible2,
      isSelected: isSelected3,
      viewport: viewport3,
      nodeCount: nodeCount3,
      visibleAudioRank: source,
      component: component2,
      deferredMedia: deferredMedia2,
    });
  };
}

const DEFAULT_VIDEO_HYDRATION_BATCH_SIZE = 1;
const VIDEO_MEDIA_NODE_TYPES = new Set(['source-video', 'ai-video', 'video']);

function getDeferredMediaComponentType(next) {
  return String(next?.['_data']?.['type'] || next?.['nodeData']?.['type'] || next?.['data']?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
}

function isDeferredVideoMediaComponent(current) {
  return VIDEO_MEDIA_NODE_TYPES['has'](getDeferredMediaComponentType(current));
}
