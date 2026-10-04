import { mapMediaClipVideoSecToAudioSec } from './mediaClipState.js';
import { t } from '../../i18n/index.js';
const MEDIA_CLIP_PLAYBACK_EDGE_EPSILON_SEC = 0.04,
  MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC = 0.12,
  MEDIA_CLIP_REPLACEMENT_AUDIO_SYNC_STEP_SEC = 0.08,
  MEDIA_CLIP_REPLACEMENT_AUDIO_DRIFT_SEEK_SEC = 0.35,
  MEDIA_CLIP_REPLACEMENT_AUDIO_PLAYING_HARD_SEEK_SEC = 0.95;
function mediaClipText(value, item = {}) {
  return t('mediaClip.' + value, item);
}
function toNumber(key, index = 0) {
  const result = Number(key);
  return Number.isFinite(result) ? result : index;
}
function clampNumber(data, options, target) {
  const toNumber2 = toNumber(options, 0),
    source = Math.max(toNumber2, toNumber(target, toNumber2));
  return Math.max(toNumber2, Math.min(source, toNumber(data, toNumber2)));
}
function clipSourceStartSec(options2 = {}) {
  return toNumber(options2.startSec, 0);
}
function clipSourceEndSec(options3 = {}) {
  const clipSourceStartSec2 = clipSourceStartSec(options3);
  return Math.max(clipSourceStartSec2, toNumber(options3.endSec, clipSourceStartSec2));
}
function clipTimelineStartSec(options4 = {}) {
  return toNumber(options4.timelineStartSec, 0);
}
function clipTimelineEndSec(options5 = {}) {
  const clipTimelineStartSec2 = clipTimelineStartSec(options5);
  return Math.max(clipTimelineStartSec2, toNumber(options5.timelineEndSec, clipTimelineStartSec2));
}
function clipTimelineSecFromMedia(options6 = {}, next = null, current = 0) {
  const clipTimelineStartSec3 = clipTimelineStartSec(options6),
    clipTimelineEndSec2 = clipTimelineEndSec(options6),
    clipSourceStartSec3 = clipSourceStartSec(options6),
    toNumber3 = toNumber(next?.currentTime, Number.NaN);
  if (!Number.isFinite(toNumber3)) return clampNumber(current, clipTimelineStartSec3, clipTimelineEndSec2);
  return clampNumber(
    clipTimelineStartSec3 + (toNumber3 - clipSourceStartSec3),
    clipTimelineStartSec3,
    clipTimelineEndSec2,
  );
}
function clipSourceSecFromTimeline(options7 = {}, entry = 0) {
  const clipSourceStartSec4 = clipSourceStartSec(options7),
    clipSourceEndSec2 = clipSourceEndSec(options7),
    clipTimelineStartSec4 = clipTimelineStartSec(options7);
  return clampNumber(
    clipSourceStartSec4 + (toNumber(entry, clipTimelineStartSec4) - clipTimelineStartSec4),
    clipSourceStartSec4,
    clipSourceEndSec2,
  );
}
function mediaSourceSec(value2 = null, record = 0) {
  return toNumber(value2?.currentTime, record);
}
function lastAppliedSeekSec(payload, handle = '') {
  return toNumber(
    payload?._previewSeekState?.[handle]?.lastAppliedSec ??
      payload?._getPreviewSeekState?.(handle)?.lastAppliedSec,
    Number.NaN,
  );
}
function hasAppliedSeekNear(state, config, scope, input = MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC) {
  const appliedSeekSec = lastAppliedSeekSec(state, config);
  return (
    Number.isFinite(appliedSeekSec) && Math.abs(appliedSeekSec - toNumber(scope, appliedSeekSec)) <= input
  );
}
function isMediaBeforeClipStart(value3 = null, output = {}) {
  const toNumber4 = toNumber(value3?.currentTime, Number.NaN);
  return (
    Number.isFinite(toNumber4) &&
    toNumber4 < clipSourceStartSec(output) - MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC
  );
}
function shouldSeekMediaToSource(value4, value5, value6, value7) {
  if (value6?.seeking === true) return false;
  return !hasAppliedSeekNear(value4, value5, value7);
}
function clockTimelineSecForClip(value8, value9 = {}) {
  return clampNumber(
    value8?._playbackClockTimelineSec?.(value8._playheadSec),
    clipTimelineStartSec(value9),
    clipTimelineEndSec(value9),
  );
}
function playbackTimelineSecForClip(value10, value11 = {}, value12 = null, value13 = 0) {
  const clockTimelineSecForClip2 = clockTimelineSecForClip(value10, value11),
    clipTimelineSecFromMedia2 = clipTimelineSecFromMedia(value11, value12, value13);
  return clampNumber(
    Math.max(clockTimelineSecForClip2, clipTimelineSecFromMedia2),
    clipTimelineStartSec(value11),
    clipTimelineEndSec(value11),
  );
}
function isClipPlaybackFinished(value14 = null, value15 = {}, value16 = 0) {
  if (toNumber(value16, 0) >= clipTimelineEndSec(value15) - MEDIA_CLIP_PLAYBACK_EDGE_EPSILON_SEC) return true;
  if (value14?.ended === true) return true;
  const toNumber5 = toNumber(value14?.currentTime, Number.NaN);
  if (Number.isFinite(toNumber5))
    return toNumber5 >= clipSourceEndSec(value15) - MEDIA_CLIP_PLAYBACK_EDGE_EPSILON_SEC;
  return false;
}
function ensureMediaPlaying(enabled = null) {
  if (!enabled || enabled.paused === false) return;
  try {
    enabled.play?.()?.catch?.(() => {});
  } catch {}
}
function pauseMedia(enabled2 = null) {
  if (!enabled2 || enabled2.paused === true) return;
  try {
    enabled2.pause?.();
  } catch {}
}
function hasPendingVideoSourceSeek(enabled3) {
  return !!enabled3?._videoPreview?.__mediaClipPendingSourceSeek;
}
function setMediaPlaybackRate(enabled4 = null, value17 = 1) {
  if (!enabled4 || !Number.isFinite(Number(value17))) return;
  try {
    enabled4.playbackRate = value17;
  } catch {}
}
function resetMediaPlaybackRate(value18 = null) {
  setMediaPlaybackRate(value18, 1);
}
function syncReplacementAudioOnTimeline(value19, value20, value21 = {}) {
  const value22 = Math.max(0, toNumber(value20, 0)),
    enabled5 = value21.immediate === true,
    toNumber6 = toNumber(value19._lastReplacementAudioSyncTimelineSec, Number.NaN);
  if (
    !enabled5 &&
    Number.isFinite(toNumber6) &&
    Math.abs(value22 - toNumber6) < MEDIA_CLIP_REPLACEMENT_AUDIO_SYNC_STEP_SEC
  )
    return;
  ((value19._lastReplacementAudioSyncTimelineSec = value22),
    value19._syncReplacementAudioFromVideo(value22, value21));
}
function formatPreviewTime(value23) {
  const value24 = Math.max(0, toNumber(value23, 0)),
    value25 = Math.floor(value24 / 60),
    value26 = Math.floor(value24 % 60);
  return String(value25).padStart(2, '0') + ':' + String(value26).padStart(2, '0');
}
function mediaClipNowMs() {
  const value27 = globalThis.performance?.now?.();
  return Number.isFinite(value27) ? value27 : Date.now();
}
function stopPointer(event) {
  if (!event) return;
  (event.preventDefault?.(), event.stopPropagation?.());
}
function getPendingMediaClipSourcePromise(value28) {
  const promise = value28?.__mediaClipSourcePromise;
  return promise && typeof promise.then === 'function' ? promise : null;
}
function waitForMediaClipReady(el, count = 1, value29 = 0x384) {
  if (!el || toNumber(el.readyState, 0) >= count) return Promise.resolve(true);
  const list =
    count >= 2
      ? ['loadeddata', 'canplay', 'canplaythrough', 'seeked', 'timeupdate', 'error']
      : ['loadedmetadata', 'loadeddata', 'canplay', 'error'];
  return new Promise((handler) => {
    let value30 = false;
    const run = () => {
        if (value30) return;
        ((value30 = true),
          clearTimeout(setTimeout2),
          list.forEach((item2) => {
            el.removeEventListener?.(item2, value31);
          }));
      },
      value31 = (value32) => {
        run();
        if (value32?.type === 'error') {
          handler(false);
          return;
        }
        handler(true);
      },
      setTimeout2 = setTimeout(
        () => {
          (run(), handler(toNumber(el.readyState, 0) >= count));
        },
        Math.max(100, toNumber(value29, 0x384)),
      );
    list.forEach((item3) => {
      el.addEventListener?.(item3, value31);
    });
  });
}
function waitForMediaClipPlaybackStart(el2, value33 = 0x384) {
  if (!el2) return Promise.resolve(false);
  const run2 = () => el2.paused === false && el2.ended !== true;
  if (run2()) return Promise.resolve(true);
  const list2 = ['playing', 'timeupdate', 'canplay', 'loadeddata', 'error'];
  return new Promise((handler2) => {
    let value34 = false;
    const run3 = () => {
        if (value34) return;
        ((value34 = true),
          clearTimeout(setTimeout3),
          list2.forEach((item4) => {
            el2.removeEventListener?.(item4, value35);
          }));
      },
      handler3 = (value36) => {
        (run3(), handler2(value36));
      },
      value35 = (value37) => {
        if (value37?.type === 'error') {
          handler3(false);
          return;
        }
        (run2() || value37?.type === 'timeupdate' || value37?.type === 'playing') && handler3(true);
      },
      setTimeout3 = setTimeout(() => handler3(run2()), Math.max(100, toNumber(value33, 0x384)));
    list2.forEach((item5) => {
      el2.addEventListener?.(item5, value35);
    });
  });
}
export function pausePreviewPlayback(value38, value39 = {}) {
  ((value38._playing = false),
    (value38._playbackStartedAtMs = Number.NaN),
    (value38._playbackStartSec = 0),
    (value38._imagePlaybackStartedAt = 0),
    (value38._imagePlaybackStartSec = 0),
    (value38._lastReplacementAudioSyncTimelineSec = Number.NaN),
    value38._cancelPlaybackLoop());
  try {
    value38._videoPreview?.pause?.();
  } catch {}
  try {
    value38._audioPreview?.pause?.();
  } catch {}
  (resetMediaPlaybackRate(value38._videoPreview),
    resetMediaPlaybackRate(value38._audioPreview),
    value38.el?.classList?.remove('is-playing'));
  if (value39.updateControls !== false) value38._updatePreviewControls();
}
export function resetPlaybackClock(value40, value41 = value40._playheadSec) {
  ((value40._playbackStartSec = Math.max(0, toNumber(value41, 0))),
    (value40._playbackStartedAtMs = mediaClipNowMs()));
}
export function playbackClockTimelineSec(value42, value43 = value42._playheadSec) {
  if (!Number.isFinite(value42._playbackStartedAtMs))
    return (value42._resetPlaybackClock(value43), Math.max(0, toNumber(value43, 0)));
  const value44 = Math.max(0, (mediaClipNowMs() - value42._playbackStartedAtMs) / 0x3e8);
  return Math.max(0, value42._playbackStartSec + value44);
}
export async function preparePreviewMediaForPlayback(value45, value46, value47 = null) {
  const enabled6 = value45._getPreviewMedia(value46);
  if (!enabled6) return false;
  const pendingMediaClipSourcePromise = getPendingMediaClipSourcePromise(enabled6);
  if (pendingMediaClipSourcePromise)
    try {
      await pendingMediaClipSourcePromise;
    } catch {}
  value47 !== null &&
    value47 !== undefined &&
    value45._syncPreviewTime(value46, value47, { immediate: true });
  const value48 = value46 === 'video' ? 2 : 1,
    waitForMediaClipReady2 = await waitForMediaClipReady(
      enabled6,
      value48,
      value46 === 'video' ? 0x578 : 0x384,
    );
  if (!waitForMediaClipReady2) return false;
  return (
    value47 !== null &&
      value47 !== undefined &&
      value45._syncPreviewTime(value46, value47, { immediate: true }),
    true
  );
}
export function togglePreviewPlayback(value49, value50) {
  stopPointer(value50);
  if (value49._playing) {
    value49._pausePreviewPlayback();
    return;
  }
  if (value49._playPreviewPending) return value49._playPreviewPending;
  const value51 = value49._playPreview().finally(() => {
    value49._playPreviewPending === value51 && (value49._playPreviewPending = null);
  });
  return ((value49._playPreviewPending = value51), value51);
}
export async function playPreview(value52) {
  const enabled7 = value52._mediaClip?.tracks?.video ? 'video' : value52._getPlaybackKind(),
    enabled8 = value52._getPlaybackTrack(enabled7);
  let enabled9 = value52._getPlaybackMedia(enabled7);
  if (!enabled7 || !enabled8) return;
  (value52._clearTimelinePlaybackVisualLocks?.(), value52._hideTimelineHoverPlayhead?.());
  if (enabled7 === 'video') value52._clearPreviewVideoFallback?.();
  (value52._cancelPreviewSeek?.('video'), value52._cancelPreviewSeek?.('audio'));
  let value53 = enabled8.startSec,
    value54 = value53;
  if (enabled7 === 'video') {
    const enabled10 = value52._getVideoClipAtTimelineSec(value52._playheadSec);
    if (!enabled10) return;
    const value55 = value52._videoClipSource(
        enabled10,
        value52._clipIndexAtTimelineSec(value52._playheadSec),
      ),
      value56 = value52._visualClipKind(enabled10, value55),
      toNumber7 = toNumber(enabled10.timelineStartSec, 0),
      toNumber8 = toNumber(enabled10.timelineEndSec, toNumber7),
      toNumber9 = toNumber(value52._playheadSec, toNumber7);
    ((value53 = toNumber9 >= toNumber7 && toNumber9 < toNumber8 ? toNumber9 : toNumber7),
      (value54 = value52._videoSourceSecForPlayhead(value53)),
      value52._syncVideoPreviewSourceForTimelineSec(value53));
    if (value56 === 'image') {
      ((value52._playheadSec = value53),
        (value52._imagePlaybackStartSec = value53),
        (value52._imagePlaybackStartedAt = globalThis.performance?.now?.() || Date.now()),
        syncReplacementAudioOnTimeline(value52, value53, { immediate: true }),
        await value52._playReplacementAudioFromVideo(value53),
        (value52._playing = true),
        value52.el?.classList?.add('is-playing'),
        value52._updatePlaybackVisuals(enabled7),
        value52._updatePreviewControls(),
        value52._startPlaybackLoop(enabled7));
      return;
    }
    enabled9 = value52._getPlaybackMedia(enabled7);
    if (!enabled9) return;
  } else {
    if (!enabled9) return;
    const value57 = value52._audioTimelineClips(enabled8),
      value58 = value52._audioClipIndexAtTimelineSec(value52._playheadSec, value57),
      value59 = value57[value58] || value57[0] || null;
    if (value59) {
      const toNumber10 = toNumber(value59.timelineStartSec, 0),
        value60 = Math.max(toNumber10, toNumber(value59.timelineEndSec, toNumber10)),
        toNumber11 = toNumber(value52._playheadSec, toNumber10);
      ((value53 = toNumber11 >= toNumber10 && toNumber11 < value60 ? toNumber11 : toNumber10),
        value52._setActiveAudioClipIndex(value58),
        value52._syncAudioPreviewSourceForTimelineSec(value53),
        (value54 = value52._audioSourceSecForPlayhead(value53)));
    } else {
      const toNumber12 = toNumber(enabled9.currentTime, value52._playheadSec);
      ((value53 =
        value52._isSecInsideTrack(enabled8, toNumber12) && toNumber12 < enabled8.endSec
          ? toNumber12
          : enabled8.startSec),
        (value54 = value53));
    }
  }
  ((value52._playheadSec = value53), value52._syncPreviewTime(enabled7, value54, { immediate: true }));
  try {
    if (enabled7 === 'video') {
      const enabled11 = await value52._preparePreviewMediaForPlayback(enabled7, value54);
      if (!enabled11) throw new Error('Media clip preview video is not ready');
      syncReplacementAudioOnTimeline(value52, value53, { immediate: true });
    }
    await enabled9.play?.();
    if (enabled7 === 'video') {
      const waitForMediaClipPlaybackStart2 = await waitForMediaClipPlaybackStart(enabled9, 0x384);
      if (!waitForMediaClipPlaybackStart2) throw new Error('Media clip preview video did not start');
      await value52._playReplacementAudioFromVideo(value53);
    }
    ((value52._playing = true),
      value52.el?.classList?.add('is-playing'),
      value52._updatePlaybackVisuals(enabled7),
      value52._updatePreviewControls(),
      value52._startPlaybackLoop(enabled7));
  } catch (value61) {
    (value52._pausePreviewPlayback(),
      globalThis.window?.showToast?.(mediaClipText('playback.previewUnavailable')));
  }
}
export async function playReplacementAudioFromVideo(enabled12, value62) {
  const enabled13 = enabled12._mediaClip.tracks?.video,
    enabled14 = enabled12._mediaClip.tracks?.audio,
    enabled15 = enabled12._audioPreview;
  if (!enabled13 || !enabled14 || !enabled15) return;
  const response = enabled12._getAudioClipContextAtTimelineSec(value62, {
    audibleOnly: true,
    nearest: false,
  });
  !enabled12._previewAudioSrc && response.url && enabled12._syncAudioPreviewSourceForTimelineSec(value62);
  const value63 = Array.isArray(enabled12._mediaClip.audioClips) && enabled12._mediaClip.audioClips.length,
    value64 = response.clip
      ? response.sourceSec
      : value63
        ? null
        : mapMediaClipVideoSecToAudioSec(value62, enabled13, enabled14);
  if (value64 == null) {
    resetMediaPlaybackRate(enabled15);
    try {
      enabled15.pause?.();
    } catch {}
    return;
  }
  if (response.clip) enabled12._syncAudioPreviewSourceForTimelineSec(value62);
  (resetMediaPlaybackRate(enabled15),
    (enabled12._pendingPreviewSeek.audio = value64),
    enabled12._applyPreviewSeek('audio', { immediate: true }),
    (enabled12._lastReplacementAudioSyncTimelineSec = Math.max(0, toNumber(value62, 0))));
  try {
    await enabled15.play?.();
  } catch {}
}
export function syncReplacementAudioFromVideo(enabled16, value65, value66 = {}) {
  const enabled17 = enabled16._mediaClip.tracks?.video,
    enabled18 = enabled16._mediaClip.tracks?.audio,
    enabled19 = enabled16._audioPreview;
  if (!enabled17 || !enabled18 || !enabled19) return;
  const response2 = enabled16._getAudioClipContextAtTimelineSec(value65, {
    audibleOnly: true,
    nearest: false,
  });
  let value67 = false;
  !enabled16._previewAudioSrc &&
    response2.url &&
    (value67 = enabled16._syncAudioPreviewSourceForTimelineSec(value65));
  const value68 = Array.isArray(enabled16._mediaClip.audioClips) && enabled16._mediaClip.audioClips.length,
    value69 = response2.clip
      ? response2.sourceSec
      : value68
        ? null
        : mapMediaClipVideoSecToAudioSec(value65, enabled17, enabled18);
  if (value69 == null) {
    resetMediaPlaybackRate(enabled19);
    try {
      enabled19.pause?.();
    } catch {}
    return;
  }
  response2.clip && (value67 = enabled16._syncAudioPreviewSourceForTimelineSec(value65) || value67);
  const value70 = Math.abs(toNumber(enabled19.currentTime, value69) - value69),
    enabled20 = enabled19.seeking === true,
    value71 = enabled16._playing
      ? MEDIA_CLIP_REPLACEMENT_AUDIO_PLAYING_HARD_SEEK_SEC
      : MEDIA_CLIP_REPLACEMENT_AUDIO_DRIFT_SEEK_SEC,
    value72 =
      value66.immediate === true || value67 || (!enabled20 && (!enabled16._playing || value70 > value71));
  value72
    ? (resetMediaPlaybackRate(enabled19),
      (enabled16._pendingPreviewSeek.audio = value69),
      value66.immediate === true
        ? enabled16._applyPreviewSeek('audio', { immediate: true })
        : enabled16._schedulePreviewSeek('audio'))
    : resetMediaPlaybackRate(enabled19);
  if (enabled16._playing && enabled19.paused)
    try {
      enabled19.play?.()?.catch?.(() => {});
    } catch {}
}
export function startPlaybackLoop(enabled21, value73) {
  (enabled21._cancelPlaybackLoop(), enabled21._resetPlaybackClock(enabled21._playheadSec));
  const run4 =
      typeof requestAnimationFrame === 'function'
        ? (value74) => requestAnimationFrame(value74)
        : (value75) => setTimeout(value75, 16),
    value76 = () => {
      if (!enabled21._playing) return;
      const enabled22 = enabled21._getPreviewMedia(value73),
        enabled23 = enabled21._getPlaybackTrack(value73);
      if (!enabled22 || !enabled23) {
        enabled21._pausePreviewPlayback();
        return;
      }
      if (value73 === 'video') {
        const value77 = enabled21._videoTimelineClips(enabled23),
          value78 = enabled21._clipIndexAtTimelineSec(enabled21._playheadSec, value77),
          enabled24 =
            value77[value78] || enabled21._getVideoClipAtTimelineSec(enabled21._playheadSec, value77);
        if (!enabled24) {
          enabled21._pausePreviewPlayback();
          return;
        }
        const toNumber13 = toNumber(enabled24.startSec, 0),
          value79 = Math.max(toNumber13, toNumber(enabled24.endSec, toNumber13)),
          toNumber14 = toNumber(enabled24.timelineStartSec, 0),
          value80 = Math.max(toNumber14, toNumber(enabled24.timelineEndSec, toNumber14)),
          value81 = enabled21._videoClipSource(enabled24, value78);
        if (enabled21._visualClipKind(enabled24, value81) === 'image') {
          const value82 = globalThis.performance?.now?.() || Date.now();
          !enabled21._imagePlaybackStartedAt &&
            ((enabled21._imagePlaybackStartedAt = value82),
            (enabled21._imagePlaybackStartSec = Math.max(
              toNumber14,
              Math.min(value80, enabled21._playheadSec),
            )),
            enabled21._syncVideoPreviewSourceForTimelineSec(enabled21._imagePlaybackStartSec));
          const value83 = Math.max(0, (value82 - enabled21._imagePlaybackStartedAt) / 0x3e8),
            value84 = enabled21._imagePlaybackStartSec + value83;
          if (value84 >= value80) {
            const value85 = value77[value78 + 1] || null;
            if (value85) {
              ((enabled21._playheadSec = toNumber(value85.timelineStartSec, value80)),
                enabled21._resetPlaybackClock(enabled21._playheadSec),
                (enabled21._imagePlaybackStartedAt = 0),
                (enabled21._imagePlaybackStartSec = enabled21._playheadSec));
              const enabled25 = enabled21._syncVideoPreviewSourceForTimelineSec(enabled21._playheadSec);
              !enabled25 &&
                enabled21._syncPreviewTime(
                  'video',
                  enabled21._videoSourceSecForPlayhead(enabled21._playheadSec),
                  { immediate: true },
                );
              const value86 = enabled21._videoClipSource(value85, value78 + 1);
              if (enabled21._visualClipKind(value85, value86) !== 'image') {
                const value87 = enabled21._getPreviewMedia('video');
                enabled25
                  ? (pauseMedia(value87), pauseMedia(enabled21._audioPreview))
                  : (syncReplacementAudioOnTimeline(enabled21, enabled21._playheadSec, { immediate: true }),
                    ensureMediaPlaying(value87),
                    void enabled21._playReplacementAudioFromVideo(enabled21._playheadSec));
              }
              (enabled21._updatePlaybackVisuals(value73),
                enabled21._updatePreviewControls(),
                (enabled21._playbackRaf = run4(value76)));
              return;
            }
            ((enabled21._playheadSec = value80),
              enabled21._updatePlaybackVisuals(value73),
              enabled21._updatePreviewControls(),
              enabled21._pausePreviewPlayback());
            return;
          }
          ((enabled21._playheadSec = Math.max(toNumber14, Math.min(value80, value84))),
            syncReplacementAudioOnTimeline(enabled21, enabled21._playheadSec),
            enabled21._updatePlaybackVisuals(value73),
            enabled21._updatePreviewControls(),
            (enabled21._playbackRaf = run4(value76)));
          return;
        }
        enabled21._imagePlaybackStartedAt = 0;
        if (hasPendingVideoSourceSeek(enabled21)) {
          (pauseMedia(enabled22),
            pauseMedia(enabled21._audioPreview),
            (enabled21._playheadSec = toNumber14),
            enabled21._resetPlaybackClock(enabled21._playheadSec),
            enabled21._updatePlaybackVisuals(value73),
            enabled21._updatePreviewControls(),
            (enabled21._playbackRaf = run4(value76)));
          return;
        }
        ensureMediaPlaying(enabled22);
        const playbackTimelineSecForClip2 = playbackTimelineSecForClip(
          enabled21,
          enabled24,
          enabled22,
          enabled21._playheadSec,
        );
        if (isClipPlaybackFinished(enabled22, enabled24, playbackTimelineSecForClip2)) {
          const value88 = value77[value78 + 1] || null;
          if (value88) {
            ((enabled21._playheadSec = toNumber(value88.timelineStartSec, value80)),
              enabled21._resetPlaybackClock(enabled21._playheadSec));
            const value89 = enabled21._syncVideoPreviewSourceForTimelineSec(enabled21._playheadSec);
            value89
              ? (pauseMedia(enabled21._getPreviewMedia('video')), pauseMedia(enabled21._audioPreview))
              : (enabled21._syncPreviewTime(
                  value73,
                  enabled21._videoSourceSecForPlayhead(enabled21._playheadSec),
                  { immediate: true },
                ),
                syncReplacementAudioOnTimeline(enabled21, enabled21._playheadSec, { immediate: true }),
                ensureMediaPlaying(enabled21._getPreviewMedia('video')),
                void enabled21._playReplacementAudioFromVideo(enabled21._playheadSec));
            (enabled21._updatePlaybackVisuals(value73),
              enabled21._updatePreviewControls(),
              (enabled21._playbackRaf = run4(value76)));
            return;
          }
          ((enabled21._playheadSec = value80),
            enabled21._syncPreviewTime(value73, value79, { immediate: true }),
            enabled21._updatePlaybackVisuals(value73),
            enabled21._pausePreviewPlayback());
          return;
        }
        enabled21._playheadSec = Math.max(toNumber14, Math.min(value80, playbackTimelineSecForClip2));
        const clipSourceSecFromTimeline2 = clipSourceSecFromTimeline(enabled24, enabled21._playheadSec),
          mediaSourceSec2 = mediaSourceSec(enabled22, clipSourceSecFromTimeline2);
        if (isMediaBeforeClipStart(enabled22, enabled24))
          shouldSeekMediaToSource(enabled21, value73, enabled22, toNumber13)
            ? enabled21._syncPreviewTime(value73, toNumber13, { immediate: true })
            : (enabled21._playheadSec = clockTimelineSecForClip(enabled21, enabled24));
        else
          mediaSourceSec2 > value79 + MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC &&
            (enabled21._playheadSec = value80);
        (syncReplacementAudioOnTimeline(enabled21, enabled21._playheadSec),
          enabled21._updatePlaybackVisuals(value73),
          enabled21._updatePreviewControls(),
          (enabled21._playbackRaf = run4(value76)));
        return;
      }
      if (value73 === 'audio') {
        const value90 = enabled21._audioTimelineClips(enabled23),
          value91 = enabled21._audioClipIndexAtTimelineSec(enabled21._playheadSec, value90),
          enabled26 = value90[value91] || value90[0] || null;
        if (!enabled26) {
          enabled21._pausePreviewPlayback();
          return;
        }
        const toNumber15 = toNumber(enabled26.startSec, 0),
          value92 = Math.max(toNumber15, toNumber(enabled26.endSec, toNumber15)),
          toNumber16 = toNumber(enabled26.timelineStartSec, 0),
          value93 = Math.max(toNumber16, toNumber(enabled26.timelineEndSec, toNumber16));
        ensureMediaPlaying(enabled22);
        const playbackTimelineSecForClip3 = playbackTimelineSecForClip(
          enabled21,
          enabled26,
          enabled22,
          enabled21._playheadSec,
        );
        if (isClipPlaybackFinished(enabled22, enabled26, playbackTimelineSecForClip3)) {
          const value94 = value90[value91 + 1] || null;
          if (value94) {
            ((enabled21._playheadSec = toNumber(value94.timelineStartSec, value93)),
              enabled21._resetPlaybackClock(enabled21._playheadSec),
              enabled21._setActiveAudioClipIndex(value91 + 1),
              enabled21._syncAudioPreviewSourceForTimelineSec(enabled21._playheadSec),
              enabled21._syncPreviewTime('audio', toNumber(value94.startSec, 0), { immediate: true }),
              ensureMediaPlaying(enabled21._getPreviewMedia('audio')),
              enabled21._updatePlaybackVisuals(value73),
              enabled21._updatePreviewControls(),
              (enabled21._playbackRaf = run4(value76)));
            return;
          }
          ((enabled21._playheadSec = value93),
            enabled21._syncPreviewTime(value73, value92, { immediate: true }),
            enabled21._updatePlaybackVisuals(value73),
            enabled21._pausePreviewPlayback());
          return;
        }
        enabled21._playheadSec = Math.max(toNumber16, Math.min(value93, playbackTimelineSecForClip3));
        const clipSourceSecFromTimeline3 = clipSourceSecFromTimeline(enabled26, enabled21._playheadSec),
          mediaSourceSec3 = mediaSourceSec(enabled22, clipSourceSecFromTimeline3);
        if (isMediaBeforeClipStart(enabled22, enabled26))
          shouldSeekMediaToSource(enabled21, value73, enabled22, toNumber15)
            ? enabled21._syncPreviewTime(value73, toNumber15, { immediate: true })
            : (enabled21._playheadSec = clockTimelineSecForClip(enabled21, enabled26));
        else
          mediaSourceSec3 > value92 + MEDIA_CLIP_PLAYBACK_OUT_OF_RANGE_SEEK_SEC &&
            (enabled21._playheadSec = value93);
      } else {
        const value95 = enabled21._playbackClockTimelineSec(enabled21._playheadSec);
        if (value95 >= enabled23.endSec) {
          ((enabled21._playheadSec = enabled23.endSec),
            enabled21._syncPreviewTime(value73, enabled23.endSec, { immediate: true }),
            enabled21._updatePlaybackVisuals(value73),
            enabled21._pausePreviewPlayback());
          return;
        }
        enabled21._playheadSec = Math.max(enabled23.startSec, Math.min(enabled23.endSec, value95));
        if (value73 === 'video') enabled21._syncReplacementAudioFromVideo(enabled21._playheadSec);
      }
      (enabled21._updatePlaybackVisuals(value73),
        enabled21._updatePreviewControls(),
        (enabled21._playbackRaf = run4(value76)));
    };
  enabled21._playbackRaf = run4(value76);
}
export function setPreviewPlayIcon(value96, el3 = value96._previewPlayButton) {
  if (!el3) return;
  const value97 = value96._playing ? 'playing' : 'paused',
    value98 = el3.dataset?.mediaClipPlayState || el3.__mediaClipPlayState || '';
  if (value98 !== value97) {
    el3.innerHTML = value96._playing
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7z"/><path d="M13 5h4v14h-4z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    const mediaClipText2 = mediaClipText(value96._playing ? 'playback.pause' : 'playback.play');
    (el3.setAttribute('aria-label', mediaClipText2), (el3.title = mediaClipText2));
    if (el3.dataset) el3.dataset.mediaClipPlayState = value97;
    el3.__mediaClipPlayState = value97;
  }
  el3.classList.toggle('is-playing', value96._playing);
}
export function updatePreviewControls(value99) {
  value99._setPreviewPlayIcon();
  const value100 = value99._getPlaybackKind(),
    value101 = value99._getPlaybackTrack(value100);
  if (value99._previewTimeLabel && value101) {
    const value102 = value99._timelineDisplayEnd(value100),
      value103 = Math.max(0, Math.min(toNumber(value99._playheadSec, 0), value102)),
      formatPreviewTime2 = formatPreviewTime(value103) + ' / ' + formatPreviewTime(value102);
    value99._previewTimeLabel.textContent !== formatPreviewTime2 &&
      (value99._previewTimeLabel.textContent = formatPreviewTime2);
  }
}
