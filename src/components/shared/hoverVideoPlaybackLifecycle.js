const externalVideoPlaybackOwners = new WeakMap();
export function claimExternalVideoPlayback(_0x59f667, _0x21a449) {
  if (!_0x59f667 || !_0x21a449) return ![];
  return (externalVideoPlaybackOwners['set'](_0x59f667, _0x21a449), !![]);
}
export function releaseExternalVideoPlayback(_0x5dbe63, _0x239f72) {
  if (!_0x5dbe63) return ![];
  const _0x507e23 = externalVideoPlaybackOwners['get'](_0x5dbe63);
  if (!_0x507e23 || (_0x239f72 && _0x507e23 !== _0x239f72)) return ![];
  return (externalVideoPlaybackOwners['delete'](_0x5dbe63), !![]);
}
export function isExternallyOwnedVideoPlayback(_0xa4ab94) {
  return !!_0xa4ab94 && externalVideoPlaybackOwners['has'](_0xa4ab94);
}
export function shouldTakeOverActiveHoverPlayback(_0x3b08b, _0x17c9a4) {
  return (
    _0x3b08b?.['_isHovered'] === !![] &&
    _0x3b08b?.['_isManualControl'] !== !![] &&
    _0x3b08b?.['_hoverManualPause'] !== !![] &&
    _0x17c9a4?.['paused'] === ![]
  );
}
export function setHoverPlaybackChromeVisible(
  { controlsEl: controlsEl = null, muteEl: muteEl = null, centerEl: centerEl = null } = {},
  _0x2391a8 = ![],
) {
  const _0x414597 = _0x2391a8 ? 'flex' : 'none';
  if (controlsEl?.['style']) controlsEl['style']['display'] = _0x414597;
  if (muteEl?.['style']) muteEl['style']['display'] = _0x414597;
  if (centerEl?.['style']) centerEl['style']['display'] = _0x414597;
}
export function shouldKeepManualPlaybackPresentationActive(_0x215e7d, _0x34a6bc) {
  return (
    _0x34a6bc?.['paused'] === ![] &&
    (_0x215e7d?.['_isManualControl'] === !![] ||
      _0x215e7d?.['_isManualLoopPlayback'] === !![] ||
      isExternallyOwnedVideoPlayback(_0x34a6bc))
  );
}
export function createHoverVideoPlaybackLifecycle({
  releaseMedia: _0xd56ca8,
  releaseDelayMs: releaseDelayMs = 0x0,
  schedule: schedule = (_0x12c366, _0x1a5d3a) => globalThis['setTimeout'](_0x12c366, _0x1a5d3a),
  cancel: cancel = (_0x218173) => globalThis['clearTimeout'](_0x218173),
} = {}) {
  let _0x59b3af = ![],
    _0x5c7e36 = null,
    _0x3504f5 = 0x0;
  const _0x4c5eda = () => {
    _0x3504f5 += 0x1;
    if (_0x5c7e36 === null) return ![];
    return (cancel(_0x5c7e36), (_0x5c7e36 = null), !![]);
  };
  return {
    activate() {
      if (_0x59b3af) return ![];
      return (_0x4c5eda(), !![]);
    },
    deactivate({ release: release = !![] } = {}) {
      if (_0x59b3af) return ![];
      _0x4c5eda();
      if (release !== !![] || typeof _0xd56ca8 !== 'function') return ![];
      const _0xa954f7 = ++_0x3504f5;
      return (
        (_0x5c7e36 = schedule(
          () => {
            if (_0x59b3af || _0xa954f7 !== _0x3504f5) return;
            ((_0x5c7e36 = null), _0xd56ca8());
          },
          Math['max'](0x0, Number(releaseDelayMs) || 0x0),
        )),
        !![]
      );
    },
    dispose() {
      if (_0x59b3af) return;
      (_0x4c5eda(), (_0x59b3af = !![]));
    },
    hasPendingRelease() {
      return _0x5c7e36 !== null;
    },
  };
}
