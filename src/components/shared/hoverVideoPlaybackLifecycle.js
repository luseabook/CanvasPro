const externalVideoPlaybackOwners = new WeakMap();
export function claimExternalVideoPlayback(enabled, enabled2) {
  if (!enabled || !enabled2) return false;
  return (externalVideoPlaybackOwners.set(enabled, enabled2), true);
}
export function releaseExternalVideoPlayback(enabled3, value) {
  if (!enabled3) return false;
  const enabled4 = externalVideoPlaybackOwners.get(enabled3);
  if (!enabled4 || (value && enabled4 !== value)) return false;
  return (externalVideoPlaybackOwners.delete(enabled3), true);
}
export function isExternallyOwnedVideoPlayback(enabled5) {
  return !!enabled5 && externalVideoPlaybackOwners.has(enabled5);
}
export function shouldTakeOverActiveHoverPlayback(item, key) {
  return (
    item?._isHovered === true &&
    item?._isManualControl !== true &&
    item?._hoverManualPause !== true &&
    key?.paused === false
  );
}
export function setHoverPlaybackChromeVisible(
  { controlsEl: controlsEl = null, muteEl: muteEl = null, centerEl: centerEl = null } = {},
  index = false,
) {
  const result = index ? 'flex' : 'none';
  if (controlsEl?.style) controlsEl.style.display = result;
  if (muteEl?.style) muteEl.style.display = result;
  if (centerEl?.style) centerEl.style.display = result;
}
export function shouldKeepManualPlaybackPresentationActive(data, options) {
  return (
    options?.paused === false &&
    (data?._isManualControl === true ||
      data?._isManualLoopPlayback === true ||
      isExternallyOwnedVideoPlayback(options))
  );
}
export function createHoverVideoPlaybackLifecycle({
  releaseMedia: releaseMedia,
  releaseDelayMs: releaseDelayMs = 0,
  schedule: schedule = (target, source) => globalThis.setTimeout(target, source),
  cancel: cancel = (next) => globalThis.clearTimeout(next),
} = {}) {
  let current = false,
    schedule2 = null,
    entry = 0;
  const run = () => {
    entry += 1;
    if (schedule2 === null) return false;
    return (cancel(schedule2), (schedule2 = null), true);
  };
  return {
    activate() {
      if (current) return false;
      return (run(), true);
    },
    deactivate({ release: release = true } = {}) {
      if (current) return false;
      run();
      if (release !== true || typeof releaseMedia !== 'function') return false;
      const record = ++entry;
      return (
        (schedule2 = schedule(
          () => {
            if (current || record !== entry) return;
            ((schedule2 = null), releaseMedia());
          },
          Math.max(0, Number(releaseDelayMs) || 0),
        )),
        true
      );
    },
    dispose() {
      if (current) return;
      (run(), (current = true));
    },
    hasPendingRelease() {
      return schedule2 !== null;
    },
  };
}
