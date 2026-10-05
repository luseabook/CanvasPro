import { createNodeDetailHydrationController } from './rendererNodeDetailHydration.js';
import { createRendererDeferredMediaController } from './rendererDeferredMedia.js';
import { createRendererVideoMediaResidencyController } from './rendererVideoMediaResidency.js';
import { createRendererVideoHydrationBackpressure } from './rendererVideoHydrationBackpressure.js';
import { resolveCanvasVideoPosterUrl } from '../services/canvasMediaLocalService.js';
const VIDEO_TYPES = new Set(['source-video', 'ai-video', 'video']);
export function createRendererMediaPresentationCoordinator({
  getNode: getNode,
  getComponent: getComponent,
  getWrapper: getWrapper,
  getParkedWrapper: getParkedWrapper,
  getWrappers: getWrappers,
  getParkedWrappers: getParkedWrappers,
  isMounted: isMounted,
  isInteractionBusy: isInteractionBusy,
  isPinned: isPinned,
  isSelected: isSelected,
  preview: preview,
  previewRelease: previewRelease,
  videoSlots: videoSlots,
  videoBackpressure: videoBackpressure = createRendererVideoHydrationBackpressure(),
  batchSize: batchSize = 2,
  presentedMediaLeaseMs: presentedMediaLeaseMs = 600,
  maxRetainedPresentedMedia: maxRetainedPresentedMedia = 3,
  suspendDelayMs: suspendDelayMs,
  onHydrateDiagnostic: onHydrateDiagnostic,
  onParkSuspendDiagnostic: onParkSuspendDiagnostic,
} = {}) {
  const isVideoNodeDetails = (value) => VIDEO_TYPES['has'](getNode?.(value)?.['type']),
    handler = (item) => getComponent?.(item)?.['getRendererMediaState']?.() || {};
  let media;
  const canHydrateMedia = createRendererVideoMediaResidencyController({
    getComponent: getComponent,
    getWrapper: getWrapper,
    isMounted: isMounted,
    presentedMediaLeaseMs: presentedMediaLeaseMs,
    maxRetainedPresentedMedia: maxRetainedPresentedMedia,
    suspendDelayMs: suspendDelayMs,
    isMediaDeferred: (key) => handler(key)['deferred'] === !![],
    isPlaybackActive: (index, result, el) => {
      if (isPinned?.(index)) return !![];
      return [...(el?.['querySelectorAll']?.('video, audio') || [])]['some'](
        (data) => data['paused'] === ![] && data['ended'] !== !![],
      );
    },
    shouldRetainPresentedMedia: (options, target) => {
      try {
        return target?.['hasPresentedRendererMedia']?.() === !![];
      } catch {
        return ![];
      }
    },
    isRetentionProtected: (source) =>
      isSelected?.(source) === !![] || handler(source)['interactionActive'] === !![],
    onSuspend: (next, current) => {
      preview['retainNode'](next);
      const enabled = preview['isNodePreviewReady'](next),
        enabled2 = current?.['prepareRendererMediaFallbackForSuspend']?.() === !![];
      if (!enabled && !enabled2) return ![];
      return (
        media['forget'](next),
        previewRelease['forget'](next),
        current?.['suspendRendererMedia']?.(),
        videoSlots['suspendPresentedSurface'](next),
        !![]
      );
    },
    onParkSuspend: (nodeId, entry) => {
      const record = onParkSuspendDiagnostic ? performance['now']() : 0;
      try {
        entry?.['suspendRendererMedia']?.();
      } catch {}
      onParkSuspendDiagnostic?.({ nodeId: nodeId, durationMs: performance['now']() - record });
    },
    onResume: (payload, handle) => {
      if (handle?.['prepareRendererVisibleVideoPreview']?.() !== !![]) return;
      (preview['retainNode'](payload), media['enqueue'](payload, { urgent: !![] }));
    },
  });
  media = createRendererDeferredMediaController({
    getComponent: getComponent,
    isInteractionBusy: isInteractionBusy,
    batchSize: batchSize,
    getNodeType: (state) => getNode?.(state)?.['type'],
    onHydrateMedia: previewRelease['schedule'],
    onHydrateDiagnostic: onHydrateDiagnostic,
    canHydrateMedia: canHydrateMedia['isHydrationAllowed'],
    canHydrateVideo: () => videoBackpressure['tryAcquire'](),
  });
  const details = createNodeDetailHydrationController({
    getWrapper: getWrapper,
    getParkedWrapper: getParkedWrapper,
    getWrappers: getWrappers,
    getParkedWrappers: getParkedWrappers,
    isMounted: isMounted,
    isInteractionBusy: isInteractionBusy,
    isVideoNodeDetails: isVideoNodeDetails,
    canHydrateVideoDetails: () => videoBackpressure['tryAcquire'](),
    onHydrateNodeDetails: (config) => {
      (getComponent?.(config)?.['hydrateDeferredDetails']?.(),
        preview['retainNode'](config),
        (!isVideoNodeDetails(config) || !resolveCanvasVideoPosterUrl(getNode?.(config))) &&
          media['enqueue'](config));
    },
  });
  function forgetHydration(scope) {
    (details['forgetNodeDetailHydration'](scope), media['forget'](scope), previewRelease['forget'](scope));
  }
  function forget(input) {
    (canHydrateMedia['forget'](input), forgetHydration(input));
  }
  function pause() {
    (media['pause'](), details['pause']());
  }
  function resume() {
    (details['resumeNodeDetailHydration'](), media['resume']());
  }
  function clear() {
    (details['clearNodeDetailHydrationState'](),
      media['clear'](),
      canHydrateMedia['clear'](),
      videoBackpressure['reset'](),
      previewRelease['clear']());
  }
  return Object['freeze']({
    media: media,
    details: details,
    residency: canHydrateMedia,
    videoBackpressure: videoBackpressure,
    forgetHydration: forgetHydration,
    forget: forget,
    pause: pause,
    resume: resume,
    clear: clear,
  });
}
