import { logVideoPlaybackEvent } from '../video-node/mediaPlaybackRecovery.js';
import { shouldKeepManualPlaybackPresentationActive } from '../shared/hoverVideoPlaybackLifecycle.js';
import { shouldActivateRendererMediaHoverPlayback } from '../../core/rendererDeferredMedia.js';
import { clearSourceVideoPlaybackFeedback } from './sourceVideoPlaybackFeedback.js';
export function shouldActivateSourceVideoHoverPlayback(store, value) {
  const viewport =
    typeof store?.getStateRaw === 'function' ? store.getStateRaw() : store?.getState?.();
  return shouldActivateRendererMediaHoverPlayback({
    viewport: viewport?.viewport,
    nodeCount: Number.isFinite(viewport?._nodeCount)
      ? viewport._nodeCount
      : Object.keys(viewport?.nodes || {}).length,
    isSelected: viewport?.selectedNodeIds?.includes?.(value) === true,
  });
}
export function syncSourceVideoPlaybackChromeVisibility(item, { forceHidden: forceHidden = false } = {}) {
  const key =
    forceHidden !== true &&
    !!String(item?._currentSrc || '').trim() &&
    !!(
      item?._isHovered ||
      item?._isManualControl ||
      item?._isManualLoopPlayback ||
      item?._isSeeking
    );
  item?._controls?.style &&
    ((item._controls.style.opacity = key ? '1' : '0'),
    (item._controls.style.pointerEvents = key ? 'auto' : 'none'));
  item?._muteBtn?.style &&
    ((item._muteBtn.style.display = key ? 'flex' : 'none'),
    (item._muteBtn.style.pointerEvents = key ? 'auto' : 'none'));
  const enabled = key && !!(item?._isManualControl || item?._isManualLoopPlayback);
  return (
    item?._centerIndicator?.style &&
      (item._centerIndicator.style.display = enabled ? 'flex' : 'none'),
    !enabled || item?._video?.paused === false
      ? item?._hideCenterIndicator?.()
      : item?._showPausedCenterIndicator?.(),
    key
  );
}
export function deactivateSourceVideoHoverPlayback(label) {
  if (!label) return false;
  label._isHovered = false;
  const enabled2 = label._video,
    shouldKeepManualPlaybackPresentationActive2 = shouldKeepManualPlaybackPresentationActive(label, enabled2);
  if (!shouldKeepManualPlaybackPresentationActive2) clearSourceVideoPlaybackFeedback(label);
  if (!shouldKeepManualPlaybackPresentationActive2) label._autoPlayToken++;
  if (enabled2) {
    if (!shouldKeepManualPlaybackPresentationActive2) enabled2.loop = false;
    logVideoPlaybackEvent(enabled2, 'hover-leave', { label: label._getPlaybackLabel('hover') });
    if (!shouldKeepManualPlaybackPresentationActive2) enabled2.pause();
  }
  return (
    (label._hoverManualPause = false),
    !shouldKeepManualPlaybackPresentationActive2 &&
      !label._isManualLoopPlayback &&
      (label._isManualControl = false),
    label._syncPlaybackChromeVisibility({ forceHidden: !shouldKeepManualPlaybackPresentationActive2 }),
    label._syncRendererPlaybackPin(),
    label._hoverPlaybackLifecycle?.deactivate?.({ release: false }),
    !!enabled2
  );
}
export function releaseIdleSourceVideoHoverPlaybackMedia(enabled3) {
  const enabled4 = enabled3?._video;
  if (
    !enabled4 ||
    enabled3._isHovered === true ||
    enabled3._isManualControl === true ||
    enabled3._isManualLoopPlayback === true ||
    enabled3._isSeeking === true ||
    enabled4.paused === false
  )
    return false;
  const index = String(enabled3._currentSrc || '').trim(),
    result = Number(enabled4.currentTime || 0);
  return (
    enabled3._replacePendingPlaybackResume(index, result),
    (enabled3._playbackSourceToken = Number(enabled3._playbackSourceToken || 0) + 1),
    (enabled3._playbackSourcePromise = null),
    (enabled3._playbackSourcePromiseSource = ''),
    (enabled4.preload = 'none'),
    enabled3._clearVideoElementSource(),
    enabled3._syncPosterFrameVisibility({ force: !!enabled3._lastPosterSrc }),
    enabled3._syncPlaybackChromeVisibility({ forceHidden: true }),
    true
  );
}
