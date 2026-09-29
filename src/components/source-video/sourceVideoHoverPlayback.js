import { logVideoPlaybackEvent } from '../video-node/mediaPlaybackRecovery.js';
import { shouldKeepManualPlaybackPresentationActive } from '../shared/hoverVideoPlaybackLifecycle.js';
import { shouldActivateRendererMediaHoverPlayback } from '../../core/rendererDeferredMedia.js';
import { clearSourceVideoPlaybackFeedback } from './sourceVideoPlaybackFeedback.js';
export function shouldActivateSourceVideoHoverPlayback(_0x11721c, _0x50c5cb) {
  const _0x5bc736 =
    typeof _0x11721c?.['getStateRaw'] === 'function'
      ? _0x11721c['getStateRaw']()
      : _0x11721c?.['getState']?.();
  return shouldActivateRendererMediaHoverPlayback({
    viewport: _0x5bc736?.['viewport'],
    nodeCount: Number['isFinite'](_0x5bc736?.['_nodeCount'])
      ? _0x5bc736['_nodeCount']
      : Object['keys'](_0x5bc736?.['nodes'] || {})['length'],
    isSelected: _0x5bc736?.['selectedNodeIds']?.['includes']?.(_0x50c5cb) === !![],
  });
}
export function syncSourceVideoPlaybackChromeVisibility(_0xff15, { forceHidden: forceHidden = ![] } = {}) {
  const _0x400961 =
    forceHidden !== !![] &&
    !!String(_0xff15?.['_currentSrc'] || '')['trim']() &&
    !!(
      _0xff15?.['_isHovered'] ||
      _0xff15?.['_isManualControl'] ||
      _0xff15?.['_isManualLoopPlayback'] ||
      _0xff15?.['_isSeeking']
    );
  _0xff15?.['_controls']?.['style'] &&
    ((_0xff15['_controls']['style']['opacity'] = _0x400961 ? '1' : '0'),
    (_0xff15['_controls']['style']['pointerEvents'] = _0x400961 ? 'auto' : 'none'));
  _0xff15?.['_muteBtn']?.['style'] &&
    ((_0xff15['_muteBtn']['style']['display'] = _0x400961 ? 'flex' : 'none'),
    (_0xff15['_muteBtn']['style']['pointerEvents'] = _0x400961 ? 'auto' : 'none'));
  const _0x4d3165 = _0x400961 && !!(_0xff15?.['_isManualControl'] || _0xff15?.['_isManualLoopPlayback']);
  return (
    _0xff15?.['_centerIndicator']?.['style'] &&
      (_0xff15['_centerIndicator']['style']['display'] = _0x4d3165 ? 'flex' : 'none'),
    !_0x4d3165 || _0xff15?.['_video']?.['paused'] === ![]
      ? _0xff15?.['_hideCenterIndicator']?.()
      : _0xff15?.['_showPausedCenterIndicator']?.(),
    _0x400961
  );
}
export function deactivateSourceVideoHoverPlayback(_0x4ff404) {
  if (!_0x4ff404) return ![];
  _0x4ff404['_isHovered'] = ![];
  const _0xc16a0e = _0x4ff404['_video'],
    _0x54b001 = shouldKeepManualPlaybackPresentationActive(_0x4ff404, _0xc16a0e);
  if (!_0x54b001) clearSourceVideoPlaybackFeedback(_0x4ff404);
  if (!_0x54b001) _0x4ff404['_autoPlayToken']++;
  if (_0xc16a0e) {
    if (!_0x54b001) _0xc16a0e['loop'] = ![];
    logVideoPlaybackEvent(_0xc16a0e, 'hover-leave', { label: _0x4ff404['_getPlaybackLabel']('hover') });
    if (!_0x54b001) _0xc16a0e['pause']();
  }
  return (
    (_0x4ff404['_hoverManualPause'] = ![]),
    !_0x54b001 && !_0x4ff404['_isManualLoopPlayback'] && (_0x4ff404['_isManualControl'] = ![]),
    _0x4ff404['_syncPlaybackChromeVisibility']({ forceHidden: !_0x54b001 }),
    _0x4ff404['_syncRendererPlaybackPin'](),
    _0x4ff404['_hoverPlaybackLifecycle']?.['deactivate']?.({ release: ![] }),
    !!_0xc16a0e
  );
}
export function releaseIdleSourceVideoHoverPlaybackMedia(_0x1cae64) {
  const _0x4096c5 = _0x1cae64?.['_video'];
  if (
    !_0x4096c5 ||
    _0x1cae64['_isHovered'] === !![] ||
    _0x1cae64['_isManualControl'] === !![] ||
    _0x1cae64['_isManualLoopPlayback'] === !![] ||
    _0x1cae64['_isSeeking'] === !![] ||
    _0x4096c5['paused'] === ![]
  )
    return ![];
  const _0x4de1a1 = String(_0x1cae64['_currentSrc'] || '')['trim'](),
    _0xe84617 = Number(_0x4096c5['currentTime'] || 0x0);
  return (
    _0x1cae64['_replacePendingPlaybackResume'](_0x4de1a1, _0xe84617),
    (_0x1cae64['_playbackSourceToken'] = Number(_0x1cae64['_playbackSourceToken'] || 0x0) + 0x1),
    (_0x1cae64['_playbackSourcePromise'] = null),
    (_0x1cae64['_playbackSourcePromiseSource'] = ''),
    (_0x4096c5['preload'] = 'none'),
    _0x1cae64['_clearVideoElementSource'](),
    _0x1cae64['_syncPosterFrameVisibility']({ force: !!_0x1cae64['_lastPosterSrc'] }),
    _0x1cae64['_syncPlaybackChromeVisibility']({ forceHidden: !![] }),
    !![]
  );
}
