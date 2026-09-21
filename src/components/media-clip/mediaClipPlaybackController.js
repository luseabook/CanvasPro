import { mapMediaClipVideoSecToAudioSec } from './mediaClipState.js';
import { t } from '../../i18n/index.js';
const MEDIA_CLIP_PLAYBACK_EDGE_EPSILON_SEC = 0.04,
  MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC = 0.12,
  MEDIA_CLIP_REPLACEMENT_AUDIO_SYNC_STEP_SEC = 0.08,
  MEDIA_CLIP_REPLACEMENT_AUDIO_DRIFT_SEEK_SEC = 0.35,
  MEDIA_CLIP_REPLACEMENT_AUDIO_PLAYING_HARD_SEEK_SEC = 0.95;
function mediaClipText(_0x127736, _0x33c383 = {}) {
  return t('mediaClip.' + _0x127736, _0x33c383);
}
function toNumber(_0x156121, _0x2c7a1a = 0) {
  const _0x3336db = Number(_0x156121);
  return Number.isFinite(_0x3336db) ? _0x3336db : _0x2c7a1a;
}
function clampNumber(_0x388118, _0xb5952b, _0x31dbb8) {
  const _0x4a06e6 = toNumber(_0xb5952b, 0),
    _0x118346 = Math.max(_0x4a06e6, toNumber(_0x31dbb8, _0x4a06e6));
  return Math.max(_0x4a06e6, Math.min(_0x118346, toNumber(_0x388118, _0x4a06e6)));
}
function clipSourceStartSec(_0x11e23a = {}) {
  return toNumber(_0x11e23a.startSec, 0);
}
function clipSourceEndSec(_0x34e208 = {}) {
  const _0x49e2a0 = clipSourceStartSec(_0x34e208);
  return Math.max(_0x49e2a0, toNumber(_0x34e208.endSec, _0x49e2a0));
}
function clipTimelineStartSec(_0x383230 = {}) {
  return toNumber(_0x383230.timelineStartSec, 0);
}
function clipTimelineEndSec(_0x26caef = {}) {
  const _0x323fd4 = clipTimelineStartSec(_0x26caef);
  return Math.max(_0x323fd4, toNumber(_0x26caef.timelineEndSec, _0x323fd4));
}
function clipTimelineSecFromMedia(_0x4aaa10 = {}, _0xd06772 = null, _0x402b9d = 0) {
  const _0x105acc = clipTimelineStartSec(_0x4aaa10),
    _0x17888a = clipTimelineEndSec(_0x4aaa10),
    _0x356b85 = clipSourceStartSec(_0x4aaa10),
    _0x277370 = toNumber(_0xd06772?.currentTime, Number.NaN);
  if (!Number.isFinite(_0x277370)) return clampNumber(_0x402b9d, _0x105acc, _0x17888a);
  return clampNumber(_0x105acc + (_0x277370 - _0x356b85), _0x105acc, _0x17888a);
}
function clipSourceSecFromTimeline(_0x2d4698 = {}, _0x451562 = 0) {
  const _0x575acf = clipSourceStartSec(_0x2d4698),
    _0x6c099a = clipSourceEndSec(_0x2d4698),
    _0x48e15e = clipTimelineStartSec(_0x2d4698);
  return clampNumber(_0x575acf + (toNumber(_0x451562, _0x48e15e) - _0x48e15e), _0x575acf, _0x6c099a);
}
function mediaSourceSec(_0x245c7c = null, _0x286152 = 0) {
  return toNumber(_0x245c7c?.currentTime, _0x286152);
}
function lastAppliedSeekSec(_0x271ce3, _0x3758d4 = '') {
  return toNumber(
    _0x271ce3?._previewSeekState?.[_0x3758d4]?.lastAppliedSec ??
      _0x271ce3?._getPreviewSeekState?.(_0x3758d4)?.lastAppliedSec,
    Number.NaN,
  );
}
function hasAppliedSeekNear(
  _0x5db31a,
  _0x344e33,
  _0x29e3a4,
  _0x45e171 = MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC,
) {
  const _0x20edc3 = lastAppliedSeekSec(_0x5db31a, _0x344e33);
  return Number.isFinite(_0x20edc3) && Math.abs(_0x20edc3 - toNumber(_0x29e3a4, _0x20edc3)) <= _0x45e171;
}
function isMediaBeforeClipStart(_0x8d8cbd = null, _0x32176a = {}) {
  const _0x192c70 = toNumber(_0x8d8cbd?.currentTime, Number.NaN);
  return (
    Number.isFinite(_0x192c70) &&
    _0x192c70 < clipSourceStartSec(_0x32176a) - MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC
  );
}
function shouldSeekMediaToSource(_0x461beb, _0x44a3c1, _0x46a999, _0x8dd5d4) {
  if (_0x46a999?.seeking === true) return false;
  return !hasAppliedSeekNear(_0x461beb, _0x44a3c1, _0x8dd5d4);
}
function clockTimelineSecForClip(_0x3685d6, _0x40c3da = {}) {
  return clampNumber(
    _0x3685d6?._playbackClockTimelineSec?.(_0x3685d6._playheadSec),
    clipTimelineStartSec(_0x40c3da),
    clipTimelineEndSec(_0x40c3da),
  );
}
function playbackTimelineSecForClip(_0x17dabe, _0x3c3c01 = {}, _0x78518b = null, _0x509dcc = 0) {
  const _0xc1ead9 = clockTimelineSecForClip(_0x17dabe, _0x3c3c01),
    _0x3f8601 = clipTimelineSecFromMedia(_0x3c3c01, _0x78518b, _0x509dcc);
  return clampNumber(
    Math.max(_0xc1ead9, _0x3f8601),
    clipTimelineStartSec(_0x3c3c01),
    clipTimelineEndSec(_0x3c3c01),
  );
}
function isClipPlaybackFinished(_0x5ecf0c = null, _0x245894 = {}, _0x47b24b = 0) {
  if (toNumber(_0x47b24b, 0) >= clipTimelineEndSec(_0x245894) - MEDIA_CLIP_PLAYBACK_EDGE_EPSILON_SEC)
    return true;
  if (_0x5ecf0c?.ended === true) return true;
  const _0x5b9373 = toNumber(_0x5ecf0c?.currentTime, Number.NaN);
  if (Number.isFinite(_0x5b9373))
    return _0x5b9373 >= clipSourceEndSec(_0x245894) - MEDIA_CLIP_PLAYBACK_EDGE_EPSILON_SEC;
  return false;
}
function ensureMediaPlaying(_0x4128bc = null) {
  if (!_0x4128bc || _0x4128bc.paused === false) return;
  try {
    _0x4128bc.play?.()?.catch?.(() => {});
  } catch {}
}
function pauseMedia(_0x346db2 = null) {
  if (!_0x346db2 || _0x346db2.paused === true) return;
  try {
    _0x346db2.pause?.();
  } catch {}
}
function hasPendingVideoSourceSeek(_0x9934c2) {
  return !!_0x9934c2?._videoPreview?.__mediaClipPendingSourceSeek;
}
function setMediaPlaybackRate(_0x40d643 = null, _0x210a6b = 1) {
  if (!_0x40d643 || !Number.isFinite(Number(_0x210a6b))) return;
  try {
    _0x40d643.playbackRate = _0x210a6b;
  } catch {}
}
function resetMediaPlaybackRate(_0x5f313d = null) {
  setMediaPlaybackRate(_0x5f313d, 1);
}
function syncReplacementAudioOnTimeline(_0x3dfaa0, _0x151816, _0x3eaa1f = {}) {
  const _0x3a342f = Math.max(0, toNumber(_0x151816, 0)),
    _0x398a6d = _0x3eaa1f.immediate === true,
    _0x24f730 = toNumber(_0x3dfaa0._lastReplacementAudioSyncTimelineSec, Number.NaN);
  if (
    !_0x398a6d &&
    Number.isFinite(_0x24f730) &&
    Math.abs(_0x3a342f - _0x24f730) < MEDIA_CLIP_REPLACEMENT_AUDIO_SYNC_STEP_SEC
  )
    return;
  ((_0x3dfaa0._lastReplacementAudioSyncTimelineSec = _0x3a342f),
    _0x3dfaa0._syncReplacementAudioFromVideo(_0x3a342f, _0x3eaa1f));
}
function formatPreviewTime(_0x36012b) {
  const _0x3d7101 = Math.max(0, toNumber(_0x36012b, 0)),
    _0x459063 = Math.floor(_0x3d7101 / 60),
    _0x3447c5 = Math.floor(_0x3d7101 % 60);
  return String(_0x459063).padStart(2, '0') + ':' + String(_0x3447c5).padStart(2, '0');
}
function mediaClipNowMs() {
  const _0x384086 = globalThis.performance?.now?.();
  return Number.isFinite(_0x384086) ? _0x384086 : Date.now();
}
function stopPointer(_0x271369) {
  if (!_0x271369) return;
  (_0x271369.preventDefault?.(), _0x271369.stopPropagation?.());
}
function getPendingMediaClipSourcePromise(_0x5502a5) {
  const _0x5946b4 = _0x5502a5?.__mediaClipSourcePromise;
  return _0x5946b4 && typeof _0x5946b4.then === 'function' ? _0x5946b4 : null;
}
function waitForMediaClipReady(_0x235376, _0x16a256 = 1, _0x4347db = 0x384) {
  if (!_0x235376 || toNumber(_0x235376.readyState, 0) >= _0x16a256) return Promise.resolve(true);
  const _0x3ffc17 =
    _0x16a256 >= 2
      ? ['loadeddata', 'canplay', 'canplaythrough', 'seeked', 'timeupdate', 'error']
      : ['loadedmetadata', 'loadeddata', 'canplay', 'error'];
  return new Promise((_0x41fa1c) => {
    let _0x103dd5 = false;
    const _0xebcee5 = () => {
        if (_0x103dd5) return;
        ((_0x103dd5 = true),
          clearTimeout(_0x494c8b),
          _0x3ffc17.forEach((_0x3927fa) => {
            _0x235376.removeEventListener?.(_0x3927fa, _0x2df2e5);
          }));
      },
      _0x2df2e5 = (_0x579d4d) => {
        _0xebcee5();
        if (_0x579d4d?.type === 'error') {
          _0x41fa1c(false);
          return;
        }
        _0x41fa1c(true);
      },
      _0x494c8b = setTimeout(
        () => {
          (_0xebcee5(), _0x41fa1c(toNumber(_0x235376.readyState, 0) >= _0x16a256));
        },
        Math.max(100, toNumber(_0x4347db, 0x384)),
      );
    _0x3ffc17.forEach((_0x13df82) => {
      _0x235376.addEventListener?.(_0x13df82, _0x2df2e5);
    });
  });
}
function waitForMediaClipPlaybackStart(_0x2b1b1a, _0x27233b = 0x384) {
  if (!_0x2b1b1a) return Promise.resolve(false);
  const _0x34cf71 = () => _0x2b1b1a.paused === false && _0x2b1b1a.ended !== true;
  if (_0x34cf71()) return Promise.resolve(true);
  const _0x440873 = ['playing', 'timeupdate', 'canplay', 'loadeddata', 'error'];
  return new Promise((_0x5418a5) => {
    let _0x35414a = false;
    const _0x2d9c01 = () => {
        if (_0x35414a) return;
        ((_0x35414a = true),
          clearTimeout(_0xc6e865),
          _0x440873.forEach((_0x34e8e5) => {
            _0x2b1b1a.removeEventListener?.(_0x34e8e5, _0x396806);
          }));
      },
      _0xaa149c = (_0x5be870) => {
        (_0x2d9c01(), _0x5418a5(_0x5be870));
      },
      _0x396806 = (_0x4f762c) => {
        if (_0x4f762c?.type === 'error') {
          _0xaa149c(false);
          return;
        }
        (_0x34cf71() || _0x4f762c?.type === 'timeupdate' || _0x4f762c?.type === 'playing') && _0xaa149c(true);
      },
      _0xc6e865 = setTimeout(() => _0xaa149c(_0x34cf71()), Math.max(100, toNumber(_0x27233b, 0x384)));
    _0x440873.forEach((_0x1ea746) => {
      _0x2b1b1a.addEventListener?.(_0x1ea746, _0x396806);
    });
  });
}
export function pausePreviewPlayback(_0x2f0cd1, _0x39950d = {}) {
  ((_0x2f0cd1._playing = false),
    (_0x2f0cd1._playbackStartedAtMs = Number.NaN),
    (_0x2f0cd1._playbackStartSec = 0),
    (_0x2f0cd1._imagePlaybackStartedAt = 0),
    (_0x2f0cd1._imagePlaybackStartSec = 0),
    (_0x2f0cd1._lastReplacementAudioSyncTimelineSec = Number.NaN),
    _0x2f0cd1._cancelPlaybackLoop());
  try {
    _0x2f0cd1._videoPreview?.pause?.();
  } catch {}
  try {
    _0x2f0cd1._audioPreview?.pause?.();
  } catch {}
  (resetMediaPlaybackRate(_0x2f0cd1._videoPreview),
    resetMediaPlaybackRate(_0x2f0cd1._audioPreview),
    _0x2f0cd1.el?.classList?.remove('is-playing'));
  if (_0x39950d.updateControls !== false) _0x2f0cd1._updatePreviewControls();
}
export function resetPlaybackClock(_0x53fb5f, _0x2e1e74 = _0x53fb5f._playheadSec) {
  ((_0x53fb5f._playbackStartSec = Math.max(0, toNumber(_0x2e1e74, 0))),
    (_0x53fb5f._playbackStartedAtMs = mediaClipNowMs()));
}
export function playbackClockTimelineSec(_0x38d479, _0xc534e6 = _0x38d479._playheadSec) {
  if (!Number.isFinite(_0x38d479._playbackStartedAtMs))
    return (_0x38d479._resetPlaybackClock(_0xc534e6), Math.max(0, toNumber(_0xc534e6, 0)));
  const _0x2d41db = Math.max(0, (mediaClipNowMs() - _0x38d479._playbackStartedAtMs) / 0x3e8);
  return Math.max(0, _0x38d479._playbackStartSec + _0x2d41db);
}
export async function preparePreviewMediaForPlayback(_0x43e3b3, _0x27a2f4, _0x51ac2b = null) {
  const _0x1dbac1 = _0x43e3b3._getPreviewMedia(_0x27a2f4);
  if (!_0x1dbac1) return false;
  const _0xb0cfa3 = getPendingMediaClipSourcePromise(_0x1dbac1);
  if (_0xb0cfa3)
    try {
      await _0xb0cfa3;
    } catch {}
  _0x51ac2b !== null &&
    _0x51ac2b !== undefined &&
    _0x43e3b3._syncPreviewTime(_0x27a2f4, _0x51ac2b, { immediate: true });
  const _0x134f7c = _0x27a2f4 === 'video' ? 2 : 1,
    _0x1b1bb7 = await waitForMediaClipReady(_0x1dbac1, _0x134f7c, _0x27a2f4 === 'video' ? 0x578 : 0x384);
  if (!_0x1b1bb7) return false;
  return (
    _0x51ac2b !== null &&
      _0x51ac2b !== undefined &&
      _0x43e3b3._syncPreviewTime(_0x27a2f4, _0x51ac2b, { immediate: true }),
    true
  );
}
export function togglePreviewPlayback(_0x4189ea, _0x3cc785) {
  stopPointer(_0x3cc785);
  if (_0x4189ea._playing) {
    _0x4189ea._pausePreviewPlayback();
    return;
  }
  if (_0x4189ea._playPreviewPending) return _0x4189ea._playPreviewPending;
  const _0x21066a = _0x4189ea._playPreview().finally(() => {
    _0x4189ea._playPreviewPending === _0x21066a && (_0x4189ea._playPreviewPending = null);
  });
  return ((_0x4189ea._playPreviewPending = _0x21066a), _0x21066a);
}
export async function playPreview(_0x3e9304) {
  const _0xb20567 = _0x3e9304._mediaClip?.tracks?.video ? 'video' : _0x3e9304._getPlaybackKind(),
    _0xea4885 = _0x3e9304._getPlaybackTrack(_0xb20567);
  let _0x115b71 = _0x3e9304._getPlaybackMedia(_0xb20567);
  if (!_0xb20567 || !_0xea4885) return;
  (_0x3e9304._clearTimelinePlaybackVisualLocks?.(), _0x3e9304._hideTimelineHoverPlayhead?.());
  if (_0xb20567 === 'video') _0x3e9304._clearPreviewVideoFallback?.();
  (_0x3e9304._cancelPreviewSeek?.('video'), _0x3e9304._cancelPreviewSeek?.('audio'));
  let _0x41770c = _0xea4885.startSec,
    _0x1037cf = _0x41770c;
  if (_0xb20567 === 'video') {
    const _0x449d35 = _0x3e9304._getVideoClipAtTimelineSec(_0x3e9304._playheadSec);
    if (!_0x449d35) return;
    const _0x243118 = _0x3e9304._videoClipSource(
        _0x449d35,
        _0x3e9304._clipIndexAtTimelineSec(_0x3e9304._playheadSec),
      ),
      _0x20d00b = _0x3e9304._visualClipKind(_0x449d35, _0x243118),
      _0x5bb4fb = toNumber(_0x449d35.timelineStartSec, 0),
      _0x8cf16f = toNumber(_0x449d35.timelineEndSec, _0x5bb4fb),
      _0x22e693 = toNumber(_0x3e9304._playheadSec, _0x5bb4fb);
    ((_0x41770c = _0x22e693 >= _0x5bb4fb && _0x22e693 < _0x8cf16f ? _0x22e693 : _0x5bb4fb),
      (_0x1037cf = _0x3e9304._videoSourceSecForPlayhead(_0x41770c)),
      _0x3e9304._syncVideoPreviewSourceForTimelineSec(_0x41770c));
    if (_0x20d00b === 'image') {
      ((_0x3e9304._playheadSec = _0x41770c),
        (_0x3e9304._imagePlaybackStartSec = _0x41770c),
        (_0x3e9304._imagePlaybackStartedAt = globalThis.performance?.now?.() || Date.now()),
        syncReplacementAudioOnTimeline(_0x3e9304, _0x41770c, { immediate: true }),
        await _0x3e9304._playReplacementAudioFromVideo(_0x41770c),
        (_0x3e9304._playing = true),
        _0x3e9304.el?.classList?.add('is-playing'),
        _0x3e9304._updatePlaybackVisuals(_0xb20567),
        _0x3e9304._updatePreviewControls(),
        _0x3e9304._startPlaybackLoop(_0xb20567));
      return;
    }
    _0x115b71 = _0x3e9304._getPlaybackMedia(_0xb20567);
    if (!_0x115b71) return;
  } else {
    if (!_0x115b71) return;
    const _0x5971f8 = _0x3e9304._audioTimelineClips(_0xea4885),
      _0x25d6b3 = _0x3e9304._audioClipIndexAtTimelineSec(_0x3e9304._playheadSec, _0x5971f8),
      _0x29468d = _0x5971f8[_0x25d6b3] || _0x5971f8[0] || null;
    if (_0x29468d) {
      const _0x59c5d7 = toNumber(_0x29468d.timelineStartSec, 0),
        _0x2c4af2 = Math.max(_0x59c5d7, toNumber(_0x29468d.timelineEndSec, _0x59c5d7)),
        _0x7431f2 = toNumber(_0x3e9304._playheadSec, _0x59c5d7);
      ((_0x41770c = _0x7431f2 >= _0x59c5d7 && _0x7431f2 < _0x2c4af2 ? _0x7431f2 : _0x59c5d7),
        _0x3e9304._setActiveAudioClipIndex(_0x25d6b3),
        _0x3e9304._syncAudioPreviewSourceForTimelineSec(_0x41770c),
        (_0x1037cf = _0x3e9304._audioSourceSecForPlayhead(_0x41770c)));
    } else {
      const _0x525904 = toNumber(_0x115b71.currentTime, _0x3e9304._playheadSec);
      ((_0x41770c =
        _0x3e9304._isSecInsideTrack(_0xea4885, _0x525904) && _0x525904 < _0xea4885.endSec
          ? _0x525904
          : _0xea4885.startSec),
        (_0x1037cf = _0x41770c));
    }
  }
  ((_0x3e9304._playheadSec = _0x41770c),
    _0x3e9304._syncPreviewTime(_0xb20567, _0x1037cf, { immediate: true }));
  try {
    if (_0xb20567 === 'video') {
      const _0x8f6286 = await _0x3e9304._preparePreviewMediaForPlayback(_0xb20567, _0x1037cf);
      if (!_0x8f6286) throw new Error('Media clip preview video is not ready');
      syncReplacementAudioOnTimeline(_0x3e9304, _0x41770c, { immediate: true });
    }
    await _0x115b71.play?.();
    if (_0xb20567 === 'video') {
      const _0x54279a = await waitForMediaClipPlaybackStart(_0x115b71, 0x384);
      if (!_0x54279a) throw new Error('Media clip preview video did not start');
      await _0x3e9304._playReplacementAudioFromVideo(_0x41770c);
    }
    ((_0x3e9304._playing = true),
      _0x3e9304.el?.classList?.add('is-playing'),
      _0x3e9304._updatePlaybackVisuals(_0xb20567),
      _0x3e9304._updatePreviewControls(),
      _0x3e9304._startPlaybackLoop(_0xb20567));
  } catch (_0x887ad) {
    (_0x3e9304._pausePreviewPlayback(),
      globalThis.window?.showToast?.(mediaClipText('playback.previewUnavailable')));
  }
}
export async function playReplacementAudioFromVideo(_0x5c5248, _0x1a83d6) {
  const _0x26a1e2 = _0x5c5248._mediaClip.tracks?.video,
    _0xe74070 = _0x5c5248._mediaClip.tracks?.audio,
    _0x4eeb97 = _0x5c5248._audioPreview;
  if (!_0x26a1e2 || !_0xe74070 || !_0x4eeb97) return;
  const _0x4b7294 = _0x5c5248._getAudioClipContextAtTimelineSec(_0x1a83d6, {
    audibleOnly: true,
    nearest: false,
  });
  !_0x5c5248._previewAudioSrc && _0x4b7294.url && _0x5c5248._syncAudioPreviewSourceForTimelineSec(_0x1a83d6);
  const _0x15e8cc = Array.isArray(_0x5c5248._mediaClip.audioClips) && _0x5c5248._mediaClip.audioClips.length,
    _0x466647 = _0x4b7294.clip
      ? _0x4b7294.sourceSec
      : _0x15e8cc
        ? null
        : mapMediaClipVideoSecToAudioSec(_0x1a83d6, _0x26a1e2, _0xe74070);
  if (_0x466647 == null) {
    resetMediaPlaybackRate(_0x4eeb97);
    try {
      _0x4eeb97.pause?.();
    } catch {}
    return;
  }
  if (_0x4b7294.clip) _0x5c5248._syncAudioPreviewSourceForTimelineSec(_0x1a83d6);
  (resetMediaPlaybackRate(_0x4eeb97),
    (_0x5c5248._pendingPreviewSeek.audio = _0x466647),
    _0x5c5248._applyPreviewSeek('audio', { immediate: true }),
    (_0x5c5248._lastReplacementAudioSyncTimelineSec = Math.max(0, toNumber(_0x1a83d6, 0))));
  try {
    await _0x4eeb97.play?.();
  } catch {}
}
export function syncReplacementAudioFromVideo(_0x2faf4b, _0x419a58, _0x444994 = {}) {
  const _0x415c40 = _0x2faf4b._mediaClip.tracks?.video,
    _0x41250f = _0x2faf4b._mediaClip.tracks?.audio,
    _0x54f45c = _0x2faf4b._audioPreview;
  if (!_0x415c40 || !_0x41250f || !_0x54f45c) return;
  const _0xc7864b = _0x2faf4b._getAudioClipContextAtTimelineSec(_0x419a58, {
    audibleOnly: true,
    nearest: false,
  });
  let _0x18ea66 = false;
  !_0x2faf4b._previewAudioSrc &&
    _0xc7864b.url &&
    (_0x18ea66 = _0x2faf4b._syncAudioPreviewSourceForTimelineSec(_0x419a58));
  const _0x3c4af5 = Array.isArray(_0x2faf4b._mediaClip.audioClips) && _0x2faf4b._mediaClip.audioClips.length,
    _0x1b2d8d = _0xc7864b.clip
      ? _0xc7864b.sourceSec
      : _0x3c4af5
        ? null
        : mapMediaClipVideoSecToAudioSec(_0x419a58, _0x415c40, _0x41250f);
  if (_0x1b2d8d == null) {
    resetMediaPlaybackRate(_0x54f45c);
    try {
      _0x54f45c.pause?.();
    } catch {}
    return;
  }
  _0xc7864b.clip && (_0x18ea66 = _0x2faf4b._syncAudioPreviewSourceForTimelineSec(_0x419a58) || _0x18ea66);
  const _0x116ad9 = Math.abs(toNumber(_0x54f45c.currentTime, _0x1b2d8d) - _0x1b2d8d),
    _0x14d027 = _0x54f45c.seeking === true,
    _0x385cec = _0x2faf4b._playing
      ? MEDIA_CLIP_REPLACEMENT_AUDIO_PLAYING_HARD_SEEK_SEC
      : MEDIA_CLIP_REPLACEMENT_AUDIO_DRIFT_SEEK_SEC,
    _0x246a9d =
      _0x444994.immediate === true ||
      _0x18ea66 ||
      (!_0x14d027 && (!_0x2faf4b._playing || _0x116ad9 > _0x385cec));
  _0x246a9d
    ? (resetMediaPlaybackRate(_0x54f45c),
      (_0x2faf4b._pendingPreviewSeek.audio = _0x1b2d8d),
      _0x444994.immediate === true
        ? _0x2faf4b._applyPreviewSeek('audio', { immediate: true })
        : _0x2faf4b._schedulePreviewSeek('audio'))
    : resetMediaPlaybackRate(_0x54f45c);
  if (_0x2faf4b._playing && _0x54f45c.paused)
    try {
      _0x54f45c.play?.()?.catch?.(() => {});
    } catch {}
}
export function startPlaybackLoop(_0x4f6790, _0x4ed171) {
  (_0x4f6790._cancelPlaybackLoop(), _0x4f6790._resetPlaybackClock(_0x4f6790._playheadSec));
  const _0x21adea =
      typeof requestAnimationFrame === 'function'
        ? (_0xd357a1) => requestAnimationFrame(_0xd357a1)
        : (_0x480e0e) => setTimeout(_0x480e0e, 16),
    _0x168c29 = () => {
      if (!_0x4f6790._playing) return;
      const _0x306f85 = _0x4f6790._getPreviewMedia(_0x4ed171),
        _0x45de8c = _0x4f6790._getPlaybackTrack(_0x4ed171);
      if (!_0x306f85 || !_0x45de8c) {
        _0x4f6790._pausePreviewPlayback();
        return;
      }
      if (_0x4ed171 === 'video') {
        const _0x39e341 = _0x4f6790._videoTimelineClips(_0x45de8c),
          _0x429217 = _0x4f6790._clipIndexAtTimelineSec(_0x4f6790._playheadSec, _0x39e341),
          _0x5d8328 =
            _0x39e341[_0x429217] || _0x4f6790._getVideoClipAtTimelineSec(_0x4f6790._playheadSec, _0x39e341);
        if (!_0x5d8328) {
          _0x4f6790._pausePreviewPlayback();
          return;
        }
        const _0x24b13c = toNumber(_0x5d8328.startSec, 0),
          _0x38c6f5 = Math.max(_0x24b13c, toNumber(_0x5d8328.endSec, _0x24b13c)),
          _0x5962e4 = toNumber(_0x5d8328.timelineStartSec, 0),
          _0x2edcb5 = Math.max(_0x5962e4, toNumber(_0x5d8328.timelineEndSec, _0x5962e4)),
          _0x1b8ec8 = _0x4f6790._videoClipSource(_0x5d8328, _0x429217);
        if (_0x4f6790._visualClipKind(_0x5d8328, _0x1b8ec8) === 'image') {
          const _0x4e52ce = globalThis.performance?.now?.() || Date.now();
          !_0x4f6790._imagePlaybackStartedAt &&
            ((_0x4f6790._imagePlaybackStartedAt = _0x4e52ce),
            (_0x4f6790._imagePlaybackStartSec = Math.max(
              _0x5962e4,
              Math.min(_0x2edcb5, _0x4f6790._playheadSec),
            )),
            _0x4f6790._syncVideoPreviewSourceForTimelineSec(_0x4f6790._imagePlaybackStartSec));
          const _0x55c880 = Math.max(0, (_0x4e52ce - _0x4f6790._imagePlaybackStartedAt) / 0x3e8),
            _0x3d0d49 = _0x4f6790._imagePlaybackStartSec + _0x55c880;
          if (_0x3d0d49 >= _0x2edcb5) {
            const _0x3da547 = _0x39e341[_0x429217 + 1] || null;
            if (_0x3da547) {
              ((_0x4f6790._playheadSec = toNumber(_0x3da547.timelineStartSec, _0x2edcb5)),
                _0x4f6790._resetPlaybackClock(_0x4f6790._playheadSec),
                (_0x4f6790._imagePlaybackStartedAt = 0),
                (_0x4f6790._imagePlaybackStartSec = _0x4f6790._playheadSec));
              const _0xe90402 = _0x4f6790._syncVideoPreviewSourceForTimelineSec(_0x4f6790._playheadSec);
              !_0xe90402 &&
                _0x4f6790._syncPreviewTime(
                  'video',
                  _0x4f6790._videoSourceSecForPlayhead(_0x4f6790._playheadSec),
                  { immediate: true },
                );
              const _0x56b294 = _0x4f6790._videoClipSource(_0x3da547, _0x429217 + 1);
              if (_0x4f6790._visualClipKind(_0x3da547, _0x56b294) !== 'image') {
                const _0x29b1da = _0x4f6790._getPreviewMedia('video');
                _0xe90402
                  ? (pauseMedia(_0x29b1da), pauseMedia(_0x4f6790._audioPreview))
                  : (syncReplacementAudioOnTimeline(_0x4f6790, _0x4f6790._playheadSec, { immediate: true }),
                    ensureMediaPlaying(_0x29b1da),
                    void _0x4f6790._playReplacementAudioFromVideo(_0x4f6790._playheadSec));
              }
              (_0x4f6790._updatePlaybackVisuals(_0x4ed171),
                _0x4f6790._updatePreviewControls(),
                (_0x4f6790._playbackRaf = _0x21adea(_0x168c29)));
              return;
            }
            ((_0x4f6790._playheadSec = _0x2edcb5),
              _0x4f6790._updatePlaybackVisuals(_0x4ed171),
              _0x4f6790._updatePreviewControls(),
              _0x4f6790._pausePreviewPlayback());
            return;
          }
          ((_0x4f6790._playheadSec = Math.max(_0x5962e4, Math.min(_0x2edcb5, _0x3d0d49))),
            syncReplacementAudioOnTimeline(_0x4f6790, _0x4f6790._playheadSec),
            _0x4f6790._updatePlaybackVisuals(_0x4ed171),
            _0x4f6790._updatePreviewControls(),
            (_0x4f6790._playbackRaf = _0x21adea(_0x168c29)));
          return;
        }
        _0x4f6790._imagePlaybackStartedAt = 0;
        if (hasPendingVideoSourceSeek(_0x4f6790)) {
          (pauseMedia(_0x306f85),
            pauseMedia(_0x4f6790._audioPreview),
            (_0x4f6790._playheadSec = _0x5962e4),
            _0x4f6790._resetPlaybackClock(_0x4f6790._playheadSec),
            _0x4f6790._updatePlaybackVisuals(_0x4ed171),
            _0x4f6790._updatePreviewControls(),
            (_0x4f6790._playbackRaf = _0x21adea(_0x168c29)));
          return;
        }
        ensureMediaPlaying(_0x306f85);
        const _0x3752ea = playbackTimelineSecForClip(_0x4f6790, _0x5d8328, _0x306f85, _0x4f6790._playheadSec);
        if (isClipPlaybackFinished(_0x306f85, _0x5d8328, _0x3752ea)) {
          const _0x21fd48 = _0x39e341[_0x429217 + 1] || null;
          if (_0x21fd48) {
            ((_0x4f6790._playheadSec = toNumber(_0x21fd48.timelineStartSec, _0x2edcb5)),
              _0x4f6790._resetPlaybackClock(_0x4f6790._playheadSec));
            const _0x323994 = _0x4f6790._syncVideoPreviewSourceForTimelineSec(_0x4f6790._playheadSec);
            _0x323994
              ? (pauseMedia(_0x4f6790._getPreviewMedia('video')), pauseMedia(_0x4f6790._audioPreview))
              : (_0x4f6790._syncPreviewTime(
                  _0x4ed171,
                  _0x4f6790._videoSourceSecForPlayhead(_0x4f6790._playheadSec),
                  { immediate: true },
                ),
                syncReplacementAudioOnTimeline(_0x4f6790, _0x4f6790._playheadSec, { immediate: true }),
                ensureMediaPlaying(_0x4f6790._getPreviewMedia('video')),
                void _0x4f6790._playReplacementAudioFromVideo(_0x4f6790._playheadSec));
            (_0x4f6790._updatePlaybackVisuals(_0x4ed171),
              _0x4f6790._updatePreviewControls(),
              (_0x4f6790._playbackRaf = _0x21adea(_0x168c29)));
            return;
          }
          ((_0x4f6790._playheadSec = _0x2edcb5),
            _0x4f6790._syncPreviewTime(_0x4ed171, _0x38c6f5, { immediate: true }),
            _0x4f6790._updatePlaybackVisuals(_0x4ed171),
            _0x4f6790._pausePreviewPlayback());
          return;
        }
        _0x4f6790._playheadSec = Math.max(_0x5962e4, Math.min(_0x2edcb5, _0x3752ea));
        const _0x22ca50 = clipSourceSecFromTimeline(_0x5d8328, _0x4f6790._playheadSec),
          _0x20a6ff = mediaSourceSec(_0x306f85, _0x22ca50);
        if (isMediaBeforeClipStart(_0x306f85, _0x5d8328))
          shouldSeekMediaToSource(_0x4f6790, _0x4ed171, _0x306f85, _0x24b13c)
            ? _0x4f6790._syncPreviewTime(_0x4ed171, _0x24b13c, { immediate: true })
            : (_0x4f6790._playheadSec = clockTimelineSecForClip(_0x4f6790, _0x5d8328));
        else
          _0x20a6ff > _0x38c6f5 + MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC &&
            (_0x4f6790._playheadSec = _0x2edcb5);
        (syncReplacementAudioOnTimeline(_0x4f6790, _0x4f6790._playheadSec),
          _0x4f6790._updatePlaybackVisuals(_0x4ed171),
          _0x4f6790._updatePreviewControls(),
          (_0x4f6790._playbackRaf = _0x21adea(_0x168c29)));
        return;
      }
      if (_0x4ed171 === 'audio') {
        const _0x3c5096 = _0x4f6790._audioTimelineClips(_0x45de8c),
          _0x4b348d = _0x4f6790._audioClipIndexAtTimelineSec(_0x4f6790._playheadSec, _0x3c5096),
          _0x3b9aeb = _0x3c5096[_0x4b348d] || _0x3c5096[0] || null;
        if (!_0x3b9aeb) {
          _0x4f6790._pausePreviewPlayback();
          return;
        }
        const _0x5a7582 = toNumber(_0x3b9aeb.startSec, 0),
          _0x14ae19 = Math.max(_0x5a7582, toNumber(_0x3b9aeb.endSec, _0x5a7582)),
          _0x197ecb = toNumber(_0x3b9aeb.timelineStartSec, 0),
          _0x2a5bee = Math.max(_0x197ecb, toNumber(_0x3b9aeb.timelineEndSec, _0x197ecb));
        ensureMediaPlaying(_0x306f85);
        const _0x5b9372 = playbackTimelineSecForClip(_0x4f6790, _0x3b9aeb, _0x306f85, _0x4f6790._playheadSec);
        if (isClipPlaybackFinished(_0x306f85, _0x3b9aeb, _0x5b9372)) {
          const _0x112df4 = _0x3c5096[_0x4b348d + 1] || null;
          if (_0x112df4) {
            ((_0x4f6790._playheadSec = toNumber(_0x112df4.timelineStartSec, _0x2a5bee)),
              _0x4f6790._resetPlaybackClock(_0x4f6790._playheadSec),
              _0x4f6790._setActiveAudioClipIndex(_0x4b348d + 1),
              _0x4f6790._syncAudioPreviewSourceForTimelineSec(_0x4f6790._playheadSec),
              _0x4f6790._syncPreviewTime('audio', toNumber(_0x112df4.startSec, 0), { immediate: true }),
              ensureMediaPlaying(_0x4f6790._getPreviewMedia('audio')),
              _0x4f6790._updatePlaybackVisuals(_0x4ed171),
              _0x4f6790._updatePreviewControls(),
              (_0x4f6790._playbackRaf = _0x21adea(_0x168c29)));
            return;
          }
          ((_0x4f6790._playheadSec = _0x2a5bee),
            _0x4f6790._syncPreviewTime(_0x4ed171, _0x14ae19, { immediate: true }),
            _0x4f6790._updatePlaybackVisuals(_0x4ed171),
            _0x4f6790._pausePreviewPlayback());
          return;
        }
        _0x4f6790._playheadSec = Math.max(_0x197ecb, Math.min(_0x2a5bee, _0x5b9372));
        const _0x2d2823 = clipSourceSecFromTimeline(_0x3b9aeb, _0x4f6790._playheadSec),
          _0x542279 = mediaSourceSec(_0x306f85, _0x2d2823);
        if (isMediaBeforeClipStart(_0x306f85, _0x3b9aeb))
          shouldSeekMediaToSource(_0x4f6790, _0x4ed171, _0x306f85, _0x5a7582)
            ? _0x4f6790._syncPreviewTime(_0x4ed171, _0x5a7582, { immediate: true })
            : (_0x4f6790._playheadSec = clockTimelineSecForClip(_0x4f6790, _0x3b9aeb));
        else
          _0x542279 > _0x14ae19 + MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC &&
            (_0x4f6790._playheadSec = _0x2a5bee);
      } else {
        const _0xd1fe85 = _0x4f6790._playbackClockTimelineSec(_0x4f6790._playheadSec);
        if (_0xd1fe85 >= _0x45de8c.endSec) {
          ((_0x4f6790._playheadSec = _0x45de8c.endSec),
            _0x4f6790._syncPreviewTime(_0x4ed171, _0x45de8c.endSec, { immediate: true }),
            _0x4f6790._updatePlaybackVisuals(_0x4ed171),
            _0x4f6790._pausePreviewPlayback());
          return;
        }
        _0x4f6790._playheadSec = Math.max(_0x45de8c.startSec, Math.min(_0x45de8c.endSec, _0xd1fe85));
        if (_0x4ed171 === 'video') _0x4f6790._syncReplacementAudioFromVideo(_0x4f6790._playheadSec);
      }
      (_0x4f6790._updatePlaybackVisuals(_0x4ed171),
        _0x4f6790._updatePreviewControls(),
        (_0x4f6790._playbackRaf = _0x21adea(_0x168c29)));
    };
  _0x4f6790._playbackRaf = _0x21adea(_0x168c29);
}
export function setPreviewPlayIcon(_0x57c1ef, _0x3f6c16 = _0x57c1ef._previewPlayButton) {
  if (!_0x3f6c16) return;
  const _0x3cc8f0 = _0x57c1ef._playing ? 'playing' : 'paused',
    _0x53cafe = _0x3f6c16.dataset?.mediaClipPlayState || _0x3f6c16.__mediaClipPlayState || '';
  if (_0x53cafe !== _0x3cc8f0) {
    _0x3f6c16.innerHTML = _0x57c1ef._playing
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7z"/><path d="M13 5h4v14h-4z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    const _0x3f6336 = mediaClipText(_0x57c1ef._playing ? 'playback.pause' : 'playback.play');
    (_0x3f6c16.setAttribute('aria-label', _0x3f6336), (_0x3f6c16.title = _0x3f6336));
    if (_0x3f6c16.dataset) _0x3f6c16.dataset.mediaClipPlayState = _0x3cc8f0;
    _0x3f6c16.__mediaClipPlayState = _0x3cc8f0;
  }
  _0x3f6c16.classList.toggle('is-playing', _0x57c1ef._playing);
}
export function updatePreviewControls(_0x13ea1b) {
  _0x13ea1b._setPreviewPlayIcon();
  const _0x4cf866 = _0x13ea1b._getPlaybackKind(),
    _0x5b04cd = _0x13ea1b._getPlaybackTrack(_0x4cf866);
  if (_0x13ea1b._previewTimeLabel && _0x5b04cd) {
    const _0x241708 = _0x13ea1b._timelineDisplayEnd(_0x4cf866),
      _0x3879a1 = Math.max(0, Math.min(toNumber(_0x13ea1b._playheadSec, 0), _0x241708)),
      _0x207f8d = formatPreviewTime(_0x3879a1) + ' / ' + formatPreviewTime(_0x241708);
    _0x13ea1b._previewTimeLabel.textContent !== _0x207f8d &&
      (_0x13ea1b._previewTimeLabel.textContent = _0x207f8d);
  }
}
