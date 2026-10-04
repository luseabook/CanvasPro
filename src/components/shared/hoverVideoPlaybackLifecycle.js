const externalVideoPlaybackOwners = new WeakMap();
export function claimExternalVideoPlayback(enabled, enabled2) {
  if (!enabled || !enabled2) return ![];
  return (externalVideoPlaybackOwners['set'](enabled, enabled2), !![]);
}
export function releaseExternalVideoPlayback(enabled3, value) {
  if (!enabled3) return ![];
  const enabled4 = externalVideoPlaybackOwners['get'](enabled3);
  if (!enabled4 || (value && enabled4 !== value)) return ![];
  return (externalVideoPlaybackOwners['delete'](enabled3), !![]);
}
export function isExternallyOwnedVideoPlayback(enabled5) {
  return !!enabled5 && externalVideoPlaybackOwners['has'](enabled5);
}
export function shouldTakeOverActiveHoverPlayback(item, key) {
  return (
    item?.['_isHovered'] === !![] &&
    item?.['_isManualControl'] !== !![] &&
    item?.['_hoverManualPause'] !== !![] &&
    key?.['paused'] === ![]
  );
}
export function setHoverPlaybackChromeVisible(
  { controlsEl: controlsEl = null, muteEl: muteEl = null, centerEl: centerEl = null } = {},
  index = ![],
) {
  const result = index ? 'flex' : 'none';
  if (controlsEl?.['style']) controlsEl['style']['display'] = result;
  if (muteEl?.['style']) muteEl['style']['display'] = result;
  if (centerEl?.['style']) centerEl['style']['display'] = result;
}
export function shouldKeepManualPlaybackPresentationActive(data, options) {
  return (
    options?.['paused'] === ![] &&
    (data?.['_isManualControl'] === !![] ||
      data?.['_isManualLoopPlayback'] === !![] ||
      isExternallyOwnedVideoPlayback(options))
  );
}
export function createHoverVideoPlaybackLifecycle({
  releaseMedia: releaseMedia,
  releaseDelayMs: releaseDelayMs = 0x0,
  schedule: schedule = (target, source) => globalThis['setTimeout'](target, source),
  cancel: cancel = (next) => globalThis['clearTimeout'](next),
} = {}) {
  let current = ![],
    schedule2 = null,
    entry = 0x0;
  const run = () => {
    entry += 0x1;
    if (schedule2 === null) return ![];
    return (cancel(schedule2), (schedule2 = null), !![]);
  };
  return {
    activate() {
      if (current) return ![];
      return (run(), !![]);
    },
    deactivate({ release: release = !![] } = {}) {
      if (current) return ![];
      run();
      if (release !== !![] || typeof releaseMedia !== 'function') return ![];
      const record = ++entry;
      return (
        (schedule2 = schedule(
          () => {
            if (current || record !== entry) return;
            ((schedule2 = null), releaseMedia());
          },
          Math['max'](0x0, Number(releaseDelayMs) || 0x0),
        )),
        !![]
      );
    },
    dispose() {
      if (current) return;
      (run(), (current = !![]));
    },
    hasPendingRelease() {
      return schedule2 !== null;
    },
  };
}
