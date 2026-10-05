import { normalizeText, toNumber } from './mediaClipUtils.js';
export const MEDIA_CLIP_TIMELINE_SCHEMA_VERSION = 1;
export const MEDIA_CLIP_TIMELINE_AUDIO_LANE_COUNT_MAX = 3;
export const MEDIA_CLIP_TIMELINE_VISUAL_TRACK_ID = 'visual:0';
const EPSILON_SEC = 0.001,
  VISUAL_KINDS = new Set(['video', 'image']),
  CLIP_KINDS = new Set(['video', 'image', 'audio']);
function roundSec(value) {
  return Math.round(toNumber(value, 0) * 1000) / 1000;
}
function roundNonNegativeSec(item) {
  return Math.max(0, roundSec(item));
}
function firstFiniteNumber(...args) {
  for (const key of args) {
    const index = Number(key);
    if (Number.isFinite(index)) return index;
  }
  return NaN;
}
function resolveSourceKey(response = {}) {
  return normalizeText(
    response.sourceKey || response.src || response.localPath || response.path || response.url,
  );
}
function resolveClipKind(options = {}, result = 'video') {
  const text = normalizeText(options.kind);
  if (CLIP_KINDS.has(text)) return text;
  return result === 'audio' ? 'audio' : 'video';
}
function resolveSourceDurationSec(options2 = {}) {
  const finiteNumber = firstFiniteNumber(
    options2.sourceDurationSec,
    options2.mediaDurationSec,
    options2.sourceDuration,
    options2.mediaDuration,
  );
  return Number.isFinite(finiteNumber) ? roundNonNegativeSec(finiteNumber) : 0;
}
function resolveLaneIndex(options3 = {}) {
  const data = Number(options3.laneIndex);
  return Number.isFinite(data) ? Math.trunc(data) : 0;
}
function normalizeTimelineClip(muted = {}, target = 0, source = {}) {
  const kind = resolveClipKind(muted, source.kind),
    sourceKey = resolveSourceKey(muted),
    sourceDurationSec = resolveSourceDurationSec(muted),
    mediaStartSec = roundNonNegativeSec(
      firstFiniteNumber(muted.mediaStartSec, muted.mediaStart, muted.startSec, muted.start, 0),
    ),
    finiteNumber2 = firstFiniteNumber(
      muted.clipDurationSec,
      muted.timelineDurationSec,
      muted.durationSec,
      muted.duration,
    ),
    mediaEndSec = roundNonNegativeSec(
      firstFiniteNumber(
        muted.mediaEndSec,
        muted.mediaEnd,
        muted.endSec,
        muted.end,
        Number.isFinite(finiteNumber2) ? mediaStartSec + finiteNumber2 : mediaStartSec,
      ),
    ),
    timelineStartSec = roundSec(
      firstFiniteNumber(muted.timelineStartSec, muted.timelineStart, source.defaultTimelineStartSec, 0),
    ),
    next = Math.max(0, mediaEndSec - mediaStartSec),
    timelineEndSec = roundSec(
      firstFiniteNumber(muted.timelineEndSec, muted.timelineEnd, timelineStartSec + next),
    ),
    laneIndex = kind === 'audio' ? resolveLaneIndex(muted) : 0,
    trackId =
      normalizeText(muted.trackId) ||
      (kind === 'audio' ? 'audio:' + laneIndex : MEDIA_CLIP_TIMELINE_VISUAL_TRACK_ID),
    id = normalizeText(muted.id) || (sourceKey ? kind + ':' + sourceKey + ':' + target : kind + ':' + target);
  return {
    id: id,
    kind: kind,
    trackId: trackId,
    laneIndex: laneIndex,
    sourceId: normalizeText(muted.sourceId),
    sourceKey: sourceKey,
    mediaStartSec: mediaStartSec,
    mediaEndSec: mediaEndSec,
    sourceDurationSec: sourceDurationSec,
    timelineStartSec: timelineStartSec,
    timelineEndSec: timelineEndSec,
    durationSec: roundNonNegativeSec(timelineEndSec - timelineStartSec),
    muted: muted.muted === true,
    disabled: muted.disabled === true,
    volume: Math.max(0, Math.min(1, toNumber(muted.volume, 1))),
  };
}
function normalizeVisualTimelineClips(list = []) {
  let defaultTimelineStartSec = 0;
  return list
    .filter((item2) => item2 && typeof item2 === 'object')
    .map((item3, current) => {
      const timelineClip = normalizeTimelineClip(item3, current, {
        kind: resolveClipKind(item3, 'video'),
        defaultTimelineStartSec: defaultTimelineStartSec,
      });
      return (
        !Number.isFinite(Number(item3.timelineStartSec)) && !Number.isFinite(Number(item3.timelineStart))
          ? (defaultTimelineStartSec = timelineClip.timelineEndSec)
          : (defaultTimelineStartSec = Math.max(defaultTimelineStartSec, timelineClip.timelineEndSec)),
        timelineClip
      );
    });
}
function normalizeAudioTimelineClips(list2 = []) {
  return list2
    .filter((item4) => item4 && typeof item4 === 'object')
    .map((item5, entry) =>
      normalizeTimelineClip(item5, entry, { kind: 'audio', defaultTimelineStartSec: 0 }),
    );
}
function buildTracks(list3 = []) {
  const list4 = [];
  list3.some((item6) => VISUAL_KINDS.has(item6.kind)) &&
    list4.push({
      id: MEDIA_CLIP_TIMELINE_VISUAL_TRACK_ID,
      kind: 'visual',
      laneIndex: 0,
      overlapPolicy: 'sequence',
    });
  const list5 = Array.from(
    new Set(list3.filter((item7) => item7.kind === 'audio').map((item8) => item8.laneIndex)),
  ).sort((item9, record) => item9 - record);
  return (
    list5.forEach((laneIndex2) => {
      list4.push({ id: 'audio:' + laneIndex2, kind: 'audio', laneIndex: laneIndex2, overlapPolicy: 'mix' });
    }),
    list4
  );
}
export function buildMediaClipTimelineManifest({
  mediaClip: mediaClip = null,
  videoClips: videoClips = null,
  audioClips: audioClips = null,
  videoTrack: videoTrack = null,
  audioTrack: audioTrack = null,
} = {}) {
  const payload = mediaClip && typeof mediaClip === 'object' ? mediaClip : {},
    handle = Array.isArray(videoClips)
      ? videoClips
      : Array.isArray(payload.clips)
        ? payload.clips
        : videoTrack
          ? [{ ...videoTrack, kind: 'video' }]
          : [],
    state = Array.isArray(audioClips)
      ? audioClips
      : Array.isArray(payload.audioClips)
        ? payload.audioClips
        : audioTrack
          ? [{ ...audioTrack, kind: 'audio' }]
          : [],
    clips = [...normalizeVisualTimelineClips(handle), ...normalizeAudioTimelineClips(state)],
    tracks = buildTracks(clips),
    durationSec = roundNonNegativeSec(
      clips.reduce((item10, config) => Math.max(item10, toNumber(config.timelineEndSec, 0)), 0),
    );
  return {
    schemaVersion: MEDIA_CLIP_TIMELINE_SCHEMA_VERSION,
    durationSec: durationSec,
    tracks: tracks,
    clips: clips,
  };
}
function makeIssue(severity, code, message, args2 = {}) {
  return { severity: severity, code: code, message: message, ...args2 };
}
export function validateMediaClipTimelineManifest(options4 = {}, scope = {}) {
  const ok = [],
    warnings = [],
    list6 = Array.isArray(options4.tracks) ? options4.tracks : [],
    list7 = Array.isArray(options4.clips) ? options4.clips : [],
    map = new Map(list6.map((item11) => [normalizeText(item11.id), item11])),
    input = Math.max(
      1,
      Math.trunc(toNumber(scope.maxAudioLaneCount, MEDIA_CLIP_TIMELINE_AUDIO_LANE_COUNT_MAX)),
    );
  options4.schemaVersion !== MEDIA_CLIP_TIMELINE_SCHEMA_VERSION &&
    ok.push(makeIssue('error', 'schema_version_mismatch', 'Timeline schema version is not supported.'));
  !list6.length &&
    list7.length &&
    ok.push(makeIssue('error', 'missing_tracks', 'Timeline clips require tracks.'));
  list7.forEach((item12, clipIndex) => {
    const output = { clipId: normalizeText(item12.id), clipIndex: clipIndex },
      text2 = normalizeText(item12.kind);
    !CLIP_KINDS.has(text2) &&
      ok.push(makeIssue('error', 'invalid_clip_kind', 'Timeline clip kind is invalid.', output));
    !normalizeText(item12.sourceKey) &&
      ok.push(makeIssue('error', 'missing_source', 'Timeline clip is missing sourceKey.', output));
    const enabled = map.get(normalizeText(item12.trackId));
    if (!enabled)
      ok.push(makeIssue('error', 'missing_track', 'Timeline clip references a missing track.', output));
    else {
      if (text2 === 'audio' && enabled.kind !== 'audio')
        ok.push(makeIssue('error', 'track_kind_mismatch', 'Audio clip is not on an audio track.', output));
      else
        VISUAL_KINDS.has(text2) &&
          enabled.kind !== 'visual' &&
          ok.push(makeIssue('error', 'track_kind_mismatch', 'Visual clip is not on a visual track.', output));
    }
    const value2 = Number(item12.mediaStartSec),
      value3 = Number(item12.mediaEndSec),
      value4 = Number(item12.timelineStartSec),
      value5 = Number(item12.timelineEndSec);
    (!Number.isFinite(value2) || !Number.isFinite(value3) || value3 <= value2) &&
      ok.push(makeIssue('error', 'invalid_media_range', 'Timeline clip media range is invalid.', output));
    (!Number.isFinite(value4) || !Number.isFinite(value5) || value5 <= value4) &&
      ok.push(makeIssue('error', 'invalid_timeline_range', 'Timeline clip range is invalid.', output));
    value4 < -EPSILON_SEC &&
      warnings.push(
        makeIssue('warning', 'negative_timeline_start', 'Timeline clip starts before zero.', output),
      );
    const count = Number(item12.sourceDurationSec);
    Number.isFinite(count) &&
      count > 0 &&
      value3 > count + EPSILON_SEC &&
      ok.push(
        makeIssue(
          'error',
          'media_range_outside_source',
          'Timeline clip media range exceeds source duration.',
          output,
        ),
      );
    if (text2 === 'audio') {
      const count2 = Number(item12.laneIndex);
      (!Number.isInteger(count2) || count2 < 0 || count2 >= input) &&
        ok.push(
          makeIssue(
            'error',
            'audio_lane_out_of_range',
            'Audio clip laneIndex exceeds the lane contract.',
            output,
          ),
        );
    }
  });
  const list8 = list7
    .filter((item13) => VISUAL_KINDS.has(normalizeText(item13.kind)))
    .slice()
    .sort((item14, value6) => toNumber(item14.timelineStartSec, 0) - toNumber(value6.timelineStartSec, 0));
  for (let value7 = 1; value7 < list8.length; value7 += 1) {
    const value8 = list8[value7 - 1],
      value9 = list8[value7];
    if (toNumber(value9.timelineStartSec, 0) < toNumber(value8.timelineEndSec, 0) - EPSILON_SEC) {
      const issue = makeIssue(
        scope.failOnVisualOverlap === true ? 'error' : 'warning',
        'visual_track_overlap',
        'Visual timeline clips overlap on a sequence track.',
        { clipId: normalizeText(value9.id), previousClipId: normalizeText(value8.id) },
      );
      if (scope.failOnVisualOverlap === true) ok.push(issue);
      else warnings.push(issue);
    }
  }
  return { ok: ok.length === 0, errors: ok, warnings: warnings };
}
export function getMediaClipTimelineExportClips(options5 = {}, value10 = {}) {
  const text3 = normalizeText(value10.kind),
    value11 = value10.includeMuted === true,
    value12 = value10.includeDisabled === true,
    list9 = Array.isArray(options5.clips) ? options5.clips : [];
  return list9
    .filter((item15) => {
      if (text3 === 'visual') return VISUAL_KINDS.has(normalizeText(item15.kind));
      if (text3) return normalizeText(item15.kind) === text3;
      return true;
    })
    .filter((el) => value12 || el.disabled !== true)
    .filter((item16) => value11 || item16.muted !== true)
    .map((id2) => ({
      id: id2.id,
      sourceId: id2.sourceId,
      sourceKey: id2.sourceKey,
      src: id2.sourceKey,
      kind: id2.kind,
      startSec: id2.mediaStartSec,
      endSec: id2.mediaEndSec,
      durationSec: roundNonNegativeSec(id2.mediaEndSec - id2.mediaStartSec),
      timelineStartSec: id2.timelineStartSec,
      timelineEndSec: id2.timelineEndSec,
      laneIndex: id2.laneIndex,
      muted: id2.muted === true,
      disabled: id2.disabled === true,
      volume: id2.volume,
    }));
}
