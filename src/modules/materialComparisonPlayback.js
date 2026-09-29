import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  isMediaElementPlaybackSource,
} from '../services/desktopMediaBlobSource.js';
import {
  claimExternalVideoPlayback,
  releaseExternalVideoPlayback,
} from '../components/shared/hoverVideoPlaybackLifecycle.js';
import {
  bindWorkspaceVideoVolumeControls,
  createWorkspaceVideoPlaybackControls,
} from './workspaceVideoPlaybackControls.js';
const PLAYBACK_SYNC_DRIFT_SECONDS = 0.12,
  VIDEO_CURRENT_DATA_READY_STATE = 0x2,
  VIDEO_PLAYBACK_READY_STATE = 0x3,
  LOOP_ICON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>',
  PANEL_VOLUME_ICON =
    '<svg class="v2-material-comparison-panel-volume-icon is-unmuted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18 6a8.5 8.5 0 0 1 0 12"></path></svg>',
  PANEL_MUTED_ICON =
    '<svg class="v2-material-comparison-panel-volume-icon is-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="m16 9 5 5"></path><path d="m21 9-5 5"></path></svg>';
function clamp(_0x4caa4d, _0x2fe8e2, _0x4778d3) {
  const _0x3b8eb5 = Number(_0x4caa4d);
  if (!Number['isFinite'](_0x3b8eb5)) return _0x2fe8e2;
  return Math['min'](_0x4778d3, Math['max'](_0x2fe8e2, _0x3b8eb5));
}
function formatPlaybackTime(_0x2c13f9) {
  const _0x4bc9ec = Math['max'](0x0, Number(_0x2c13f9) || 0x0),
    _0x37c45f = Math['floor'](_0x4bc9ec / 0x3c),
    _0x3c7c0d = Math['floor'](_0x4bc9ec % 0x3c);
  return _0x37c45f + ':' + String(_0x3c7c0d)['padStart'](0x2, '0');
}
function setPanelError(_0x156bcb) {
  ((_0x156bcb['playbackReady'] = ![]),
    (_0x156bcb['playbackFailed'] = !![]),
    (_0x156bcb['image']['hidden'] = !![]),
    (_0x156bcb['video']['hidden'] = !![]),
    _0x156bcb['panel']['classList']['remove']('is-loading'),
    _0x156bcb['panel']['classList']['add']('is-error'),
    _0x156bcb['panel']['setAttribute']('aria-busy', 'false'));
}
function setPanelVideoPending(_0x53f7e9, _0xa1fe4b) {
  const _0x262ec5 = String(_0xa1fe4b || '')['trim']();
  ((_0x53f7e9['playbackReady'] = ![]), (_0x53f7e9['playbackFailed'] = ![]));
  if (_0x262ec5) _0x53f7e9['video']['setAttribute']('poster', _0x262ec5);
  else _0x53f7e9['video']['removeAttribute']?.('poster');
  (_0x53f7e9['panel']['classList']['toggle']('is-loading', !_0x262ec5),
    _0x53f7e9['panel']['classList']['remove']('is-error'),
    _0x53f7e9['panel']['setAttribute']('aria-busy', 'true'));
}
function revealPanelVideoFrame(_0x1a22fa) {
  if (Number(_0x1a22fa?.['video']?.['readyState'] || 0x0) < VIDEO_CURRENT_DATA_READY_STATE) return ![];
  return (
    _0x1a22fa['video']['removeAttribute']?.('poster'),
    (_0x1a22fa['video']['poster'] = ''),
    _0x1a22fa['panel']['classList']['remove']('is-loading', 'is-error'),
    !![]
  );
}
function setPanelReady(_0x3de55e) {
  (revealPanelVideoFrame(_0x3de55e),
    (_0x3de55e['playbackReady'] = !![]),
    (_0x3de55e['playbackFailed'] = ![]),
    _0x3de55e['panel']['classList']['remove']('is-loading', 'is-error'),
    _0x3de55e['panel']['setAttribute']('aria-busy', 'false'));
}
function setButtonLabel(_0x4f530f, _0x466afa) {
  if (!_0x4f530f) return;
  (_0x4f530f['setAttribute']('aria-label', _0x466afa), _0x4f530f['setAttribute']('data-tooltip', _0x466afa));
}
function captureAttribute(_0x4c7550, _0x5d4c40) {
  const _0x32f56f = _0x4c7550?.['getAttribute']?.(_0x5d4c40) || '',
    _0x3ecae1 =
      typeof _0x4c7550?.['hasAttribute'] === 'function'
        ? _0x4c7550['hasAttribute'](_0x5d4c40)
        : _0x32f56f !== '';
  return { present: _0x3ecae1, value: _0x32f56f };
}
function restoreAttribute(_0x5984d7, _0x2b72a1, _0x31070f) {
  if (!_0x5984d7 || !_0x31070f) return;
  if (_0x31070f['present']) _0x5984d7['setAttribute']?.(_0x2b72a1, _0x31070f['value']);
  else _0x5984d7['removeAttribute']?.(_0x2b72a1);
}
function createLoopButton(_0x5891aa, _0x42b428) {
  const _0x56779a = _0x5891aa?.['createElement']?.('button');
  if (!_0x56779a) return null;
  return (
    (_0x56779a['type'] = 'button'),
    (_0x56779a['className'] = 'v2-material-comparison-loop-button'),
    (_0x56779a['innerHTML'] = LOOP_ICON),
    _0x56779a['setAttribute']('aria-pressed', 'false'),
    _0x56779a['setAttribute']('data-material-comparison-loop', ''),
    setButtonLabel(_0x56779a, _0x42b428),
    _0x56779a
  );
}
function createPanelMuteButton(_0x1a24a4, _0x469d64, _0x5af0c2, _0x15759f) {
  const _0x25fe7c = _0x1a24a4?.['createElement']?.('button');
  if (!_0x25fe7c) return null;
  return (
    (_0x25fe7c['type'] = 'button'),
    (_0x25fe7c['className'] = 'v2-material-comparison-panel-mute'),
    (_0x25fe7c['innerHTML'] = '' + PANEL_VOLUME_ICON + PANEL_MUTED_ICON),
    (_0x25fe7c['hidden'] = !![]),
    (_0x25fe7c['tabIndex'] = -0x1),
    _0x25fe7c['setAttribute']('tabindex', '-1'),
    _0x25fe7c['setAttribute']('aria-pressed', 'false'),
    _0x25fe7c['setAttribute']('data-material-comparison-panel-mute', _0x5af0c2),
    setButtonLabel(_0x25fe7c, _0x15759f),
    _0x469d64['panel']['appendChild'](_0x25fe7c),
    (_0x469d64['muteButton'] = _0x25fe7c),
    _0x25fe7c
  );
}
export function createMaterialComparisonPlaybackController({
  documentObject: _0x1625f2,
  windowObject: _0x1d616b,
  translate: _0x56e478,
  overlay: _0x54e6b0,
  leftPanel: _0x561a40,
  rightPanel: _0x17444d,
  leftSlot: leftSlot = 'left',
  rightSlot: rightSlot = 'right',
  videoKind: videoKind = 'video',
  getActiveEntry: _0x153d04,
  onMediaAspect: _0x583e7b,
  onGeometryChange: _0x14cf71,
  videoElementResolver: videoElementResolver = () => null,
  attachVideoSource: attachVideoSource = attachMediaElementPlaybackSource,
  playVideo: playVideo = (_0x201d4f) => _0x201d4f?.['play']?.(),
} = {}) {
  const _0x28f75d = [
      [leftSlot, _0x561a40],
      [rightSlot, _0x17444d],
    ],
    _0x4db9b1 = (_0x2ad92e) => _0x56e478('canvasInteraction.materialComparison.' + _0x2ad92e),
    _0x4d5089 = (_0xf6c8b5, _0xd1e2dc) =>
      _0x56e478(
        _0xd1e2dc
          ? 'canvasInteraction.materialComparison.unmutePanelVideo'
          : 'canvasInteraction.materialComparison.mutePanelVideo',
        { side: _0x4db9b1(_0xf6c8b5) },
      ),
    _0x13d93c = createLoopButton(_0x1625f2, _0x56e478('canvasInteraction.materialComparison.enableLoop')),
    _0x4f6543 = Object['freeze']({ kind: 'material-comparison' });
  for (const [_0x5b9b08, _0x19c12e] of _0x28f75d) {
    ((_0x19c12e['fallbackVideo'] = _0x19c12e['video']),
      (_0x19c12e['borrowedVideoLease'] = null),
      (_0x19c12e['unbindVideoEvents'] = null),
      (_0x19c12e['video']['loop'] = ![]),
      createPanelMuteButton(_0x1625f2, _0x19c12e, _0x5b9b08, _0x4d5089(_0x5b9b08, ![])));
  }
  const _0x1ad872 = createWorkspaceVideoPlaybackControls(_0x1625f2, {
      className: 'v2-material-comparison-playback-controls',
      label: _0x56e478('canvasInteraction.materialComparison.playbackLabel'),
      controlsAttributes: { 'data-material-comparison-playback-controls': !![] },
      playAttributes: { 'data-material-comparison-playback': !![] },
      currentTimeAttributes: { 'data-material-comparison-current-time': !![] },
      progressAttributes: { 'data-material-comparison-progress': !![] },
      progressFillAttributes: { 'data-material-comparison-progress-fill': !![] },
      totalTimeAttributes: { 'data-material-comparison-total-time': !![] },
      volumeAttributes: { 'data-material-comparison-volume': !![] },
      volumeToggleAttributes: { 'data-material-comparison-volume-toggle': !![] },
      playLabel: _0x56e478('canvasInteraction.materialComparison.playVideos'),
      progressLabel: _0x56e478('canvasInteraction.materialComparison.playbackProgress'),
      volumeLabel: _0x56e478('canvasInteraction.materialComparison.volume'),
      volumeToggleLabel: _0x56e478('canvasInteraction.materialComparison.toggleMute'),
      slots: { afterPlay: _0x13d93c },
    }),
    _0x5a5cc9 = _0x1ad872?.['root'] || null;
  _0x5a5cc9 && ((_0x5a5cc9['hidden'] = !![]), _0x5a5cc9['setAttribute']('aria-hidden', 'true'));
  let _0x1de3f5 = ![],
    _0x507d7e = 0x0,
    _0x5b10b1 = null,
    _0x3f65d4 = ![],
    _0x38519d = ![],
    _0x5e96be = ![],
    _0x216187 = null;
  const _0x178fdb = () => [_0x561a40['video'], _0x17444d['video']],
    _0x2e732f = (_0x369682) =>
      _0x369682?.['borrowedVideoLease'] ? VIDEO_CURRENT_DATA_READY_STATE : VIDEO_PLAYBACK_READY_STATE,
    _0x4140fd = () =>
      _0x153d04(leftSlot)?.['kind'] === videoKind && _0x153d04(rightSlot)?.['kind'] === videoKind,
    _0xac84fd = () =>
      _0x4140fd() &&
      _0x28f75d['every'](
        ([, _0x302a19]) =>
          _0x302a19['playbackReady'] === !![] &&
          Number(_0x302a19['video']?.['readyState'] || 0x0) >= _0x2e732f(_0x302a19),
      ),
    _0x5ace9f = () => {
      const _0x3136be = _0x178fdb()
        ['map']((_0x3e773d) => Number(_0x3e773d?.['duration'] || 0x0))
        ['filter']((_0x2be861) => Number['isFinite'](_0x2be861) && _0x2be861 > 0x0);
      return _0x3136be['length'] > 0x0 ? Math['min'](..._0x3136be) : 0x0;
    },
    _0x16b872 = (_0x1db78a, _0x29c60f) => {
      const _0x25f518 = _0x1db78a?.['muteButton'];
      if (!_0x25f518) return;
      ((_0x25f518['hidden'] = _0x29c60f !== !![]),
        (_0x25f518['tabIndex'] = _0x29c60f === !![] ? 0x0 : -0x1),
        _0x25f518['setAttribute']('tabindex', _0x29c60f === !![] ? '0' : '-1'));
    },
    _0x5551a2 = () => {
      for (const [_0x55a110, _0xbe0b69] of _0x28f75d) {
        const _0x208fe9 = _0xbe0b69['video']['muted'] === !![],
          _0x416645 = _0xbe0b69['muteButton'];
        (_0x416645?.['classList']['toggle']('is-muted', _0x208fe9),
          _0x416645?.['setAttribute']('aria-pressed', String(_0x208fe9)),
          setButtonLabel(_0x416645, _0x4d5089(_0x55a110, _0x208fe9)));
      }
    },
    _0x22b4ef = () => {
      (_0x5551a2(), _0x216187?.['sync']());
    },
    _0x53eb5b = () => {
      if (!_0x13d93c) return;
      (_0x13d93c['classList']['toggle']('is-active', _0x3f65d4),
        _0x13d93c['setAttribute']('aria-pressed', String(_0x3f65d4)),
        setButtonLabel(
          _0x13d93c,
          _0x56e478(
            _0x3f65d4
              ? 'canvasInteraction.materialComparison.disableLoop'
              : 'canvasInteraction.materialComparison.enableLoop',
          ),
        ));
    },
    _0x2f9112 = () => {
      if (_0x1de3f5 || !_0x1ad872) return;
      const [_0xc4d83f, _0x54c504] = _0x178fdb(),
        _0x5abf23 = _0x5ace9f(),
        _0xe72a1c = clamp(
          Number(_0xc4d83f?.['currentTime'] || _0x54c504?.['currentTime'] || 0x0),
          0x0,
          _0x5abf23 || Number['MAX_SAFE_INTEGER'],
        ),
        _0x4395e = _0x5abf23 > 0x0 ? clamp((_0xe72a1c / _0x5abf23) * 0x64, 0x0, 0x64) : 0x0,
        _0x7bb3f2 =
          _0x4140fd() &&
          _0x178fdb()['some']((_0x3fc330) => _0x3fc330?.['paused'] === ![] && _0x3fc330?.['ended'] !== !![]);
      (_0x1ad872['playButton']['classList']['toggle']('is-playing', _0x7bb3f2),
        _0x1ad872['playButton']['setAttribute']('aria-pressed', String(_0x7bb3f2)),
        _0x1ad872['playButton']['setAttribute'](
          'aria-label',
          _0x56e478(
            _0x7bb3f2
              ? 'canvasInteraction.materialComparison.pauseVideos'
              : 'canvasInteraction.materialComparison.playVideos',
          ),
        ),
        (_0x1ad872['currentTime']['textContent'] = formatPlaybackTime(_0xe72a1c)),
        (_0x1ad872['totalTime']['textContent'] = formatPlaybackTime(_0x5abf23)),
        _0x1ad872['progressFill']['style']['setProperty']('width', _0x4395e + '%'),
        _0x1ad872['progress']['setAttribute']('aria-valuenow', String(Math['round'](_0x4395e))),
        _0x22b4ef(),
        _0x53eb5b());
    },
    _0x9080da = () => {
      if (!_0x1ad872 || !_0x5a5cc9) return;
      const _0x1bf0d0 = _0x4140fd(),
        _0x35572f = _0x1bf0d0 && _0x28f75d['some'](([, _0x11e646]) => _0x11e646['playbackFailed'] === !![]),
        _0x52e040 = _0x5e96be || (_0x1bf0d0 && !_0x35572f && !_0xac84fd());
      (_0x5a5cc9['classList']['toggle']('is-loading', _0x52e040),
        _0x5a5cc9['setAttribute']('aria-busy', String(_0x52e040)),
        _0x1ad872['playButton']['setAttribute']('aria-busy', String(_0x52e040)),
        (_0x1ad872['playButton']['disabled'] = !_0x1bf0d0 || _0x35572f || _0x52e040));
    },
    _0x32c289 = (_0xbde17f) => {
      ((_0x5e96be = _0xbde17f === !![]), _0x9080da());
    },
    _0x591c54 = (_0x579391, _0x2b2a98) => {
      const _0x576585 = _0x153d04(_0x579391),
        _0x2a8743 = String(_0x576585?.['sourceUrl'] || '')['trim']();
      return (
        _0x576585?.['kind'] === videoKind &&
        _0x2b2a98['entryKind'] === videoKind &&
        _0x2b2a98['sourceUrl'] === _0x2a8743 &&
        isMediaElementPlaybackSource(_0x2b2a98['video'], _0x2a8743)
      );
    },
    _0x4db298 = (_0xd21864, _0x24c00b) => {
      if (_0x1de3f5 || !_0x591c54(_0xd21864, _0x24c00b)) return ![];
      const _0xd4a73c = Number(_0x24c00b['video']?.['readyState'] || 0x0);
      return (
        _0xd4a73c >= 0x1 && _0x583e7b(_0xd21864, _0x24c00b, _0x24c00b['video']),
        _0xd4a73c >= VIDEO_CURRENT_DATA_READY_STATE && revealPanelVideoFrame(_0x24c00b),
        _0xd4a73c >= _0x2e732f(_0x24c00b)
          ? setPanelReady(_0x24c00b)
          : ((_0x24c00b['playbackReady'] = ![]), _0x24c00b['panel']['setAttribute']('aria-busy', 'true')),
        _0x9080da(),
        _0x2f9112(),
        _0x24c00b['playbackReady'] === !![]
      );
    },
    _0x47e0a3 = () => {
      ((_0x507d7e += 0x1), (_0x38519d = ![]));
      for (const _0x3645b7 of _0x178fdb()) {
        try {
          _0x3645b7?.['pause']?.();
        } catch {}
      }
      (_0x32c289(![]), _0x2f9112());
    },
    _0xb852e3 = (_0x41b5fb) => {
      const _0x3d0a76 = _0x41b5fb?.['video'];
      if (!_0x3d0a76) return;
      try {
        _0x3d0a76['pause']?.();
      } catch {}
      ((_0x3d0a76['controls'] = _0x41b5fb['controls']),
        (_0x3d0a76['loop'] = _0x41b5fb['loop']),
        (_0x3d0a76['muted'] = _0x41b5fb['muted']),
        (_0x3d0a76['volume'] = _0x41b5fb['volume']),
        (_0x3d0a76['hidden'] = _0x41b5fb['hidden']),
        (_0x3d0a76['playsInline'] = _0x41b5fb['playsInline']));
      !_0x41b5fb['hadComparisonClass'] &&
        _0x3d0a76['classList']?.['remove']?.('v2-material-comparison-video');
      (restoreAttribute(_0x3d0a76, 'style', _0x41b5fb['styleAttribute']),
        restoreAttribute(_0x3d0a76, 'poster', _0x41b5fb['posterAttribute']));
      if (_0x41b5fb['parent']) {
        const _0xf1232b =
          _0x41b5fb['nextSibling']?.['parentNode'] === _0x41b5fb['parent'] ? _0x41b5fb['nextSibling'] : null;
        try {
          _0x41b5fb['parent']['insertBefore'](_0x3d0a76, _0xf1232b);
        } catch {
          try {
            _0x41b5fb['parent']['appendChild'](_0x3d0a76);
          } catch {}
        }
      } else _0x3d0a76['remove']?.();
      releaseExternalVideoPlayback(_0x3d0a76, _0x4f6543);
    },
    _0x58cbe9 = (_0x4b1956, _0x4b34b1) => {
      const _0x5d27f6 = _0x4b34b1['borrowedVideoLease'];
      if (!_0x5d27f6) return ![];
      return (
        _0x4b34b1['unbindVideoEvents']?.(),
        (_0x4b34b1['unbindVideoEvents'] = null),
        (_0x4b34b1['borrowedVideoLease'] = null),
        (_0x4b34b1['video'] = _0x4b34b1['fallbackVideo']),
        _0xb852e3(_0x5d27f6),
        !_0x1de3f5 && (_0x4b34b1['unbindVideoEvents'] = _0x887327(_0x4b1956, _0x4b34b1)),
        !![]
      );
    },
    _0x2dc030 = (_0x1beac2, _0x1176c2, _0x5c8fef) => {
      if (!_0x5c8fef || _0x5c8fef === _0x1176c2['fallbackVideo']) return ![];
      const _0x52227e = {
        video: _0x5c8fef,
        parent: _0x5c8fef['parentNode'] || null,
        nextSibling: _0x5c8fef['nextSibling'] || null,
        controls: _0x5c8fef['controls'],
        loop: _0x5c8fef['loop'],
        muted: _0x5c8fef['muted'],
        volume: _0x5c8fef['volume'],
        hidden: _0x5c8fef['hidden'],
        playsInline: _0x5c8fef['playsInline'],
        hadComparisonClass: _0x5c8fef['classList']?.['contains']?.('v2-material-comparison-video') === !![],
        styleAttribute: captureAttribute(_0x5c8fef, 'style'),
        posterAttribute: captureAttribute(_0x5c8fef, 'poster'),
      };
      if (!claimExternalVideoPlayback(_0x5c8fef, _0x4f6543)) return ![];
      try {
        _0x5c8fef['pause']?.();
      } catch {}
      ((_0x5c8fef['controls'] = ![]),
        (_0x5c8fef['loop'] = ![]),
        (_0x5c8fef['muted'] = ![]),
        (_0x5c8fef['volume'] = 0x1),
        (_0x5c8fef['hidden'] = ![]),
        (_0x5c8fef['playsInline'] = !![]),
        _0x5c8fef['removeAttribute']?.('style'),
        _0x5c8fef['classList']?.['add']?.('v2-material-comparison-video'),
        (_0x1176c2['fallbackVideo']['hidden'] = !![]),
        _0x1176c2['unbindVideoEvents']?.(),
        (_0x1176c2['unbindVideoEvents'] = null));
      try {
        typeof _0x1176c2['panel']['insertBefore'] === 'function'
          ? _0x1176c2['panel']['insertBefore'](_0x5c8fef, _0x1176c2['badge'] || null)
          : _0x1176c2['panel']['appendChild'](_0x5c8fef);
        if (_0x5c8fef['parentNode'] !== _0x1176c2['panel']) throw new Error('move failed');
      } catch {
        return (
          _0xb852e3(_0x52227e),
          (_0x1176c2['video'] = _0x1176c2['fallbackVideo']),
          (_0x1176c2['unbindVideoEvents'] = _0x887327(_0x1beac2, _0x1176c2)),
          ![]
        );
      }
      return (
        (_0x1176c2['video'] = _0x5c8fef),
        (_0x1176c2['borrowedVideoLease'] = _0x52227e),
        (_0x1176c2['unbindVideoEvents'] = _0x887327(_0x1beac2, _0x1176c2)),
        !![]
      );
    },
    _0x60248d = (_0x29d27c, _0x69f2dc, _0x1fd4f9) => {
      if (
        _0x69f2dc['borrowedVideoLease'] &&
        _0x69f2dc['sourceUrl'] === _0x1fd4f9 &&
        isMediaElementPlaybackSource(_0x69f2dc['video'], _0x1fd4f9)
      )
        return _0x69f2dc['video'];
      let _0x17b5c2 = null;
      try {
        _0x17b5c2 = videoElementResolver(_0x29d27c) || null;
      } catch {}
      if (!_0x17b5c2 || _0x17b5c2 === _0x69f2dc['fallbackVideo']) return null;
      if (
        _0x28f75d['some'](
          ([, _0xe37b14]) =>
            _0xe37b14 !== _0x69f2dc && _0xe37b14['borrowedVideoLease'] && _0xe37b14['video'] === _0x17b5c2,
        )
      )
        return null;
      return isMediaElementPlaybackSource(_0x17b5c2, _0x1fd4f9) ? _0x17b5c2 : null;
    },
    _0xb34eb0 = (_0x25e2e1) => {
      const _0x4a0c06 = _0x25e2e1['fallbackVideo'],
        _0x1ea079 = !!String(
          _0x4a0c06?.['currentSrc'] || _0x4a0c06?.['src'] || _0x4a0c06?.['getAttribute']?.('src') || '',
        )['trim']();
      try {
        _0x4a0c06['pause']?.();
      } catch {}
      (clearDesktopMediaPlaybackSourceMetadata(_0x4a0c06), _0x4a0c06['removeAttribute']?.('src'));
      if (_0x1ea079)
        try {
          _0x4a0c06['load']?.();
        } catch {}
      (_0x4a0c06['removeAttribute']?.('poster'),
        (_0x4a0c06['poster'] = ''),
        (_0x4a0c06['loop'] = ![]),
        (_0x4a0c06['muted'] = ![]),
        (_0x4a0c06['hidden'] = !![]));
    },
    _0x4af6e4 = (_0x1b6cda) => {
      const _0x4fdad6 = _0x1b6cda === _0x561a40 ? leftSlot : rightSlot;
      ((_0x1b6cda['attachToken'] += 0x1),
        (_0x1b6cda['sourceUrl'] = ''),
        (_0x1b6cda['playbackReady'] = ![]),
        (_0x1b6cda['playbackFailed'] = ![]));
      try {
        _0x1b6cda['video']['pause']?.();
      } catch {}
      (_0x58cbe9(_0x4fdad6, _0x1b6cda),
        _0xb34eb0(_0x1b6cda),
        _0x1b6cda['panel']['classList']['remove']('is-loading', 'is-error'),
        _0x1b6cda['panel']['setAttribute']('aria-busy', 'false'),
        _0x16b872(_0x1b6cda, ![]),
        _0x22b4ef(),
        _0x9080da());
    },
    _0x32f346 = (_0x476f69, _0x13851c, _0x341d16) => {
      if (_0x1de3f5) return;
      const { image: _0x270be5 } = _0x13851c,
        _0x3aef68 = String(_0x341d16?.['sourceUrl'] || '')['trim']();
      let _0x32e75a = _0x3aef68 ? _0x60248d(_0x341d16, _0x13851c, _0x3aef68) : null;
      const _0x1ea34c = _0x32e75a || _0x13851c['fallbackVideo'],
        _0x20998c =
          _0x13851c['video'] === _0x1ea34c &&
          _0x13851c['sourceUrl'] === _0x3aef68 &&
          isMediaElementPlaybackSource(_0x1ea34c, _0x3aef68);
      !_0x20998c && ((_0x13851c['playbackReady'] = ![]), (_0x13851c['playbackFailed'] = ![]));
      (_0x47e0a3(),
        (_0x270be5['hidden'] = !![]),
        _0x270be5['removeAttribute']?.('src'),
        (_0x13851c['entryKind'] = _0x341d16['kind']));
      if (!_0x3aef68) {
        (_0x4af6e4(_0x13851c),
          (_0x13851c['entryKind'] = _0x341d16['kind']),
          setPanelError(_0x13851c),
          _0x16b872(_0x13851c, ![]),
          _0x9080da());
        return;
      }
      if (!_0x20998c) _0x4af6e4(_0x13851c);
      _0x13851c['entryKind'] = _0x341d16['kind'];
      _0x32e75a &&
        _0x13851c['video'] !== _0x32e75a &&
        !_0x2dc030(_0x476f69, _0x13851c, _0x32e75a) &&
        (_0x32e75a = null);
      const _0x2a4b39 = _0x13851c['video'];
      _0x2a4b39['hidden'] = ![];
      if (_0x32e75a) {
        _0x13851c['sourceUrl'] = _0x3aef68;
        Number(_0x2a4b39['readyState'] || 0x0) < VIDEO_CURRENT_DATA_READY_STATE &&
          setPanelVideoPending(_0x13851c, _0x341d16?.['thumbnailUrl']);
        _0x4db298(_0x476f69, _0x13851c);
        return;
      }
      if (_0x20998c) {
        _0x4db298(_0x476f69, _0x13851c);
        return;
      }
      (setPanelVideoPending(_0x13851c, _0x341d16?.['thumbnailUrl']),
        _0x9080da(),
        (_0x13851c['sourceUrl'] = _0x3aef68));
      const _0x1f7317 = ++_0x13851c['attachToken'];
      void Promise['resolve'](
        attachVideoSource(_0x2a4b39, _0x3aef68, {
          preload: 'auto',
          load: !![],
          shouldAssign: () =>
            !_0x1de3f5 && _0x13851c['attachToken'] === _0x1f7317 && _0x153d04(_0x476f69) === _0x341d16,
        }),
      )
        ['then']((_0x1a29b8) => {
          if (_0x1de3f5 || _0x13851c['attachToken'] !== _0x1f7317 || _0x153d04(_0x476f69) !== _0x341d16)
            return;
          if (!String(_0x1a29b8 || '')['trim']() && !_0x2a4b39['src'] && !_0x2a4b39['currentSrc']) {
            (setPanelError(_0x13851c), _0x16b872(_0x13851c, ![]), _0x9080da());
            return;
          }
          _0x4db298(_0x476f69, _0x13851c);
        })
        ['catch'](() => {
          !_0x1de3f5 &&
            _0x13851c['attachToken'] === _0x1f7317 &&
            _0x153d04(_0x476f69) === _0x341d16 &&
            (setPanelError(_0x13851c), _0x16b872(_0x13851c, ![]), _0x9080da());
        });
    },
    _0x20ba48 = () => {
      if (_0x1de3f5) return;
      const _0x488444 = _0x4140fd();
      _0x54e6b0['dataset']['comparisonKind'] = _0x488444 ? videoKind : 'image';
      for (const [, _0x41af24] of _0x28f75d) {
        _0x16b872(_0x41af24, _0x488444);
      }
      if (!_0x5a5cc9) {
        _0x14cf71?.();
        return;
      }
      if (!_0x488444) _0x47e0a3();
      ((_0x5a5cc9['hidden'] = !_0x488444),
        _0x5a5cc9['setAttribute']('aria-hidden', String(!_0x488444)),
        _0x9080da(),
        _0x2f9112(),
        _0x14cf71?.());
    },
    _0x11777b = (_0x378575) => {
      const _0x1813f2 = _0x5ace9f();
      if (!(_0x1813f2 > 0x0)) return ![];
      const _0x5dace3 = clamp(_0x378575, 0x0, _0x1813f2);
      for (const _0x3a0fe9 of _0x178fdb()) {
        try {
          _0x3a0fe9['currentTime'] = _0x5dace3;
        } catch {}
      }
      return (_0x2f9112(), !![]);
    },
    _0x193cb0 = (_0x27a668) => {
      if (!_0x1ad872 || !_0x4140fd()) return ![];
      const _0x73aaf2 = _0x1ad872['progress']['getBoundingClientRect']?.(),
        _0x14b9fc = Number(_0x73aaf2?.['width'] || 0x0);
      if (!(_0x14b9fc > 0x0)) return ![];
      const _0x37fd8a = clamp(
        (Number(_0x27a668?.['clientX'] || 0x0) - Number(_0x73aaf2?.['left'] || 0x0)) / _0x14b9fc,
        0x0,
        0x1,
      );
      return _0x11777b(_0x5ace9f() * _0x37fd8a);
    };
  function _0x55491d(_0x3fc862) {
    if (_0x5b10b1 === null) return;
    if (_0x3fc862?.['pointerId'] != null && _0x3fc862['pointerId'] !== _0x5b10b1) return;
    (_0x3fc862?.['preventDefault']?.(),
      _0x3fc862?.['stopPropagation']?.(),
      _0x1d616b?.['removeEventListener']?.('pointermove', _0x50c637, !![]),
      _0x1d616b?.['removeEventListener']?.('pointerup', _0x55491d, !![]),
      _0x1d616b?.['removeEventListener']?.('pointercancel', _0x55491d, !![]),
      (_0x5b10b1 = null));
  }
  function _0x50c637(_0x4ca18e) {
    if (_0x5b10b1 === null) return;
    if (_0x4ca18e?.['pointerId'] != null && _0x4ca18e['pointerId'] !== _0x5b10b1) return;
    (_0x4ca18e['preventDefault']?.(), _0x4ca18e['stopPropagation']?.(), _0x193cb0(_0x4ca18e));
  }
  const _0x423898 = (_0xecd659) => {
      if (_0xecd659?.['button'] != null && _0xecd659['button'] !== 0x0) return;
      if (!_0x193cb0(_0xecd659)) return;
      (_0xecd659['preventDefault']?.(),
        _0xecd659['stopPropagation']?.(),
        _0x55491d(),
        (_0x5b10b1 = _0xecd659?.['pointerId'] ?? 0x0),
        _0x1d616b?.['addEventListener']?.('pointermove', _0x50c637, !![]),
        _0x1d616b?.['addEventListener']?.('pointerup', _0x55491d, !![]),
        _0x1d616b?.['addEventListener']?.('pointercancel', _0x55491d, !![]));
    },
    _0x39d230 = (_0xe65d45) => {
      if (_0xe65d45['key'] !== 'ArrowLeft' && _0xe65d45['key'] !== 'ArrowRight') return;
      const _0x3ea36c = Number(_0x561a40['video']['currentTime'] || 0x0);
      if (!_0x11777b(_0x3ea36c + (_0xe65d45['key'] === 'ArrowRight' ? 0x1 : -0x1))) return;
      (_0xe65d45['preventDefault']?.(), _0xe65d45['stopPropagation']?.());
    },
    _0x450480 = async (_0xdab95a, { busy: busy = ![] } = {}) => {
      if (_0x1de3f5 || !_0xac84fd()) return ![];
      const _0x1c8ac3 = _0x178fdb();
      for (const _0x1e1b79 of _0x1c8ac3) {
        try {
          _0x1e1b79['currentTime'] = _0xdab95a;
        } catch {}
      }
      const _0x150e10 = ++_0x507d7e;
      if (busy) _0x32c289(!![]);
      const _0x3cc833 = await Promise['all'](
        _0x1c8ac3['map']((_0x3d4d51) =>
          Promise['resolve']()
            ['then'](() => playVideo(_0x3d4d51))
            ['then'](() => !![])
            ['catch'](() => ![]),
        ),
      );
      if (_0x1de3f5 || _0x150e10 !== _0x507d7e) return ![];
      if (busy) _0x32c289(![]);
      if (!_0x3cc833['every'](Boolean)) return (_0x47e0a3(), ![]);
      return (_0x2f9112(), !![]);
    },
    _0x19a5d5 = async (_0x340029) => {
      (_0x340029?.['preventDefault']?.(), _0x340029?.['stopPropagation']?.());
      if (_0x1de3f5 || !_0x4140fd()) return;
      const _0x447af4 = _0x178fdb();
      if (_0x447af4['some']((_0x306dff) => _0x306dff?.['paused'] === ![] && _0x306dff?.['ended'] !== !![])) {
        _0x47e0a3();
        return;
      }
      if (!_0xac84fd()) {
        _0x9080da();
        return;
      }
      const _0x1b99d6 = _0x5ace9f();
      let _0x535e5c = Math['max'](0x0, Number(_0x561a40['video']['currentTime'] || 0x0));
      if (_0x1b99d6 > 0x0 && _0x535e5c >= _0x1b99d6 - 0.05) _0x535e5c = 0x0;
      await _0x450480(_0x535e5c, { busy: !![] });
    },
    _0xe2d914 = async () => {
      if (_0x1de3f5 || !_0x3f65d4 || _0x38519d || !_0x4140fd()) return;
      _0x38519d = !![];
      try {
        await _0x450480(0x0);
      } finally {
        _0x38519d = ![];
      }
    },
    _0x144b5e = () => {
      if (_0x3f65d4) {
        void _0xe2d914();
        return;
      }
      _0x47e0a3();
    },
    _0x2a4293 = () => {
      if (!_0x4140fd()) return;
      const _0x1f55fe = Number(_0x561a40['video']['currentTime'] || 0x0),
        _0x5eff03 = Number(_0x17444d['video']['currentTime'] || 0x0);
      if (
        Number['isFinite'](_0x1f55fe) &&
        Number['isFinite'](_0x5eff03) &&
        Math['abs'](_0x1f55fe - _0x5eff03) > PLAYBACK_SYNC_DRIFT_SECONDS &&
        _0x17444d['video']['seeking'] !== !![]
      )
        try {
          _0x17444d['video']['currentTime'] = _0x1f55fe;
        } catch {}
      _0x2f9112();
    },
    _0x1f67ce = (_0x33fc60, _0x3f0191) => {
      (_0x33fc60?.['preventDefault']?.(), _0x33fc60?.['stopPropagation']?.());
      if (_0x1de3f5 || _0x3f0191?.['entryKind'] !== videoKind) return;
      ((_0x3f0191['video']['muted'] = _0x3f0191['video']['muted'] !== !![]), _0x22b4ef());
    },
    _0x10f9e9 = (_0x283a4c) => {
      (_0x283a4c?.['preventDefault']?.(), _0x283a4c?.['stopPropagation']?.());
      if (_0x1de3f5) return;
      ((_0x3f65d4 = !_0x3f65d4), _0x53eb5b());
    };
  function _0x887327(_0x3c77c8, _0x262978) {
    const _0x53c326 = _0x262978['video'];
    if (!_0x53c326?.['addEventListener']) return () => {};
    const _0x4ad93c = () => {
        if (!_0x4db298(_0x3c77c8, _0x262978)) return;
        _0x16b872(_0x262978, _0x4140fd());
      },
      _0x23d53c = () => {
        !_0x1de3f5 &&
          _0x591c54(_0x3c77c8, _0x262978) &&
          (setPanelError(_0x262978), _0x16b872(_0x262978, ![]), _0x9080da());
      },
      _0x2919bf = [
        ['loadedmetadata', _0x4ad93c],
        ['loadeddata', _0x4ad93c],
        ['canplay', _0x4ad93c],
        ['error', _0x23d53c],
        ['play', _0x2f9112],
        ['pause', _0x2f9112],
        ['ended', _0x144b5e],
        ['durationchange', _0x2f9112],
        ['volumechange', _0x22b4ef],
        ['timeupdate', _0x3c77c8 === leftSlot ? _0x2a4293 : _0x2f9112],
      ];
    for (const [_0x162766, _0x3c5430] of _0x2919bf) {
      _0x53c326['addEventListener'](_0x162766, _0x3c5430);
    }
    return () => {
      for (const [_0x149dd9, _0xdf6288] of _0x2919bf) {
        _0x53c326['removeEventListener']?.(_0x149dd9, _0xdf6288);
      }
    };
  }
  for (const [_0x3b0a70, _0x1767b0] of _0x28f75d) {
    ((_0x1767b0['unbindVideoEvents'] = _0x887327(_0x3b0a70, _0x1767b0)),
      _0x1767b0['muteButton']?.['addEventListener']('pointerdown', (_0x26dd74) => {
        _0x26dd74?.['stopPropagation']?.();
      }),
      _0x1767b0['muteButton']?.['addEventListener']('click', (_0x3cb91a) => {
        _0x1f67ce(_0x3cb91a, _0x1767b0);
      }));
  }
  _0x1ad872 &&
    ((_0x216187 = bindWorkspaceVideoVolumeControls({
      volumeSlider: _0x1ad872['volume'],
      volumeToggle: _0x1ad872['volumeToggle'],
      getMediaElements: _0x178fdb,
      onChange: _0x5551a2,
    })),
    _0x1ad872['playButton']['addEventListener']('click', _0x19a5d5),
    _0x1ad872['progress']['addEventListener']('pointerdown', _0x423898),
    _0x1ad872['progress']['addEventListener']('keydown', _0x39d230),
    _0x13d93c?.['addEventListener']('click', _0x10f9e9));
  (_0x22b4ef(), _0x53eb5b());
  const _0x106301 = () => {
    if (_0x1de3f5) return;
    ((_0x1de3f5 = !![]),
      (_0x507d7e += 0x1),
      _0x55491d(),
      _0x47e0a3(),
      _0x4af6e4(_0x561a40),
      _0x4af6e4(_0x17444d),
      _0x216187?.['dispose']());
  };
  return Object['freeze']({
    root: _0x5a5cc9,
    controls: _0x1ad872,
    setPanelSource: _0x32f346,
    clearPanelSource: _0x4af6e4,
    syncVisibility: _0x20ba48,
    pause: _0x47e0a3,
    togglePlayback: _0x19a5d5,
    updatePresentation: _0x2f9112,
    dispose: _0x106301,
  });
}
