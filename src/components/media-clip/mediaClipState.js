import {
  buildMediaClipTimelineManifest,
  getMediaClipTimelineExportClips,
  MEDIA_CLIP_TIMELINE_AUDIO_LANE_COUNT_MAX,
  validateMediaClipTimelineManifest,
} from './mediaClipTimelineContract.js';
export { MEDIA_CLIP_COMPACT_SIZE } from '../../services/mediaSizingPolicy.js';
export const MEDIA_CLIP_NODE_TYPE = 'media-clip';
export const MEDIA_CLIP_SCHEMA_VERSION = 1;
export const MEDIA_CLIP_TIMELINE_ZOOM_MIN = 0.08;
export const MEDIA_CLIP_TIMELINE_ZOOM_MAX = 6;
export const MEDIA_CLIP_IMAGE_DEFAULT_DURATION_SEC = 5;
export const MEDIA_CLIP_AUDIO_LANE_COUNT_MAX = MEDIA_CLIP_TIMELINE_AUDIO_LANE_COUNT_MAX;
const VIDEO_NODE_TYPES = new Set(['source-video', 'ai-video', 'video']),
  IMAGE_NODE_TYPES = new Set(['source-image', 'ai-image', 'image']),
  AUDIO_NODE_TYPES = new Set(['source-audio', 'ai-audio', 'audio']),
  MIN_RANGE_SEC = 0.1,
  MEDIA_CLIP_EXPORT_SIGNATURE_VERSION = 'mediaClipExport:v2';
function normalizeText(item) {
  return String(item || '').trim();
}
function toNumber(key, index = 0) {
  const result = Number(key);
  return Number.isFinite(result) ? result : index;
}
function roundSec(data) {
  return Math.round(Math.max(0, toNumber(data, 0)) * 1000) / 1000;
}
function roundSignedSec(options) {
  return Math.round(toNumber(options, 0) * 1000) / 1000;
}
function clampNumber(target, source, next, current) {
  const toNumber2 = toNumber(target, current);
  return Math.max(source, Math.min(next, toNumber2));
}
export function normalizeMediaClipAudioLaneIndex(entry) {
  const record = Math.trunc(toNumber(entry, 0));
  return Math.max(0, Math.min(MEDIA_CLIP_AUDIO_LANE_COUNT_MAX - 1, record));
}
function roundTimelineZoom(payload) {
  return Math.round(payload * 1000) / 1000;
}
export function normalizeMediaClipTimelineView(options2 = {}) {
  const box = options2 && typeof options2 === 'object' ? options2 : {};
  return {
    zoom: roundTimelineZoom(
      clampNumber(box.zoom, MEDIA_CLIP_TIMELINE_ZOOM_MIN, MEDIA_CLIP_TIMELINE_ZOOM_MAX, 1),
    ),
    scrollLeft: Math.max(0, Math.round(toNumber(box.scrollLeft, 0))),
  };
}
function firstNonEmpty(...args) {
  for (const handle of args) {
    const text = normalizeText(handle);
    if (text) return text;
  }
  return '';
}
function normalizeSourceList(list) {
  if (Array.isArray(list)) return list.filter((item2) => item2 && typeof item2 === 'object');
  return list && typeof list === 'object' ? [list] : [];
}
function getSourceDataCandidates(enabled = {}) {
  if (!enabled || typeof enabled !== 'object') return [];
  const list2 = [],
    handler = (enabled2) => {
      if (!enabled2 || typeof enabled2 !== 'object') return;
      if (list2.includes(enabled2)) return;
      list2.push(enabled2);
    };
  return (handler(enabled), handler(enabled.nodeData), handler(enabled.data), handler(enabled._data), list2);
}
function resolveDirectSourceKey(enabled3 = {}) {
  if (!enabled3 || typeof enabled3 !== 'object') return '';
  for (const response of getSourceDataCandidates(enabled3)) {
    const nonEmpty = firstNonEmpty(
      response.localPath,
      response.originalLocalPath,
      response.displayLocalPath,
      response.videoLocalPath,
      response.audioLocalPath,
      response.imageUrl,
      response.thumbUrl,
      response.videoUrl,
      response.audioUrl,
      response.src,
      response.url,
      response.resultUrl,
      response.sourceUrl,
    );
    if (nonEmpty) return nonEmpty;
  }
  return '';
}
function isUnavailableVideoRecord(options3 = {}) {
  const directSourceKey = resolveDirectSourceKey(options3);
  if (!directSourceKey) return false;
  return getSourceDataCandidates(options3).some(
    (item3) =>
      item3?.mediaUnavailable === true && normalizeText(item3?.mediaUnavailableSource) === directSourceKey,
  );
}
function resolveVideoRecord(options4 = {}) {
  for (const state of getSourceDataCandidates(options4)) {
    const list3 = Array.isArray(state.videos) ? state.videos : [],
      config = Number(state.mainVideoIndex),
      scope = Number.isFinite(config) ? Math.max(0, Math.trunc(config)) : 0,
      input = list3[scope] || null;
    if (resolveDirectSourceKey(input) && !isUnavailableVideoRecord(input)) return input;
    const output = list3.find((item4) => resolveDirectSourceKey(item4) && !isUnavailableVideoRecord(item4));
    if (output) return output;
  }
  return null;
}
export function isMediaClipNodeType(value2) {
  return normalizeText(value2) === MEDIA_CLIP_NODE_TYPE;
}
export function getMediaClipInputKind(options5 = {}) {
  for (const value3 of getSourceDataCandidates(options5)) {
    const text2 = normalizeText(value3?.type);
    if (VIDEO_NODE_TYPES.has(text2)) return 'video';
    if (IMAGE_NODE_TYPES.has(text2)) return 'image';
    if (AUDIO_NODE_TYPES.has(text2)) return 'audio';
  }
  return '';
}
export function isSupportedMediaClipInput(options6 = {}) {
  const mediaClipInputKind = getMediaClipInputKind(options6);
  if (!mediaClipInputKind) return false;
  return !!resolveMediaClipSourceKey(options6);
}
export function resolveMediaClipSourceKey(enabled4 = {}) {
  if (!enabled4 || typeof enabled4 !== 'object') return '';
  const videoRecord = resolveVideoRecord(enabled4);
  if (videoRecord && videoRecord !== enabled4) {
    const directSourceKey2 = resolveDirectSourceKey(videoRecord);
    if (directSourceKey2) return directSourceKey2;
  }
  if (isUnavailableVideoRecord(enabled4)) return '';
  return resolveDirectSourceKey(enabled4);
}
export function resolveMediaClipDurationSec(enabled5 = {}, value4 = '') {
  if (!enabled5 || typeof enabled5 !== 'object') return 0;
  const value5 = value4 === 'video' ? resolveVideoRecord(enabled5) : null;
  if (value5 && value5 !== enabled5) {
    const mediaClipDurationSec = resolveMediaClipDurationSec(value5, value4);
    if (mediaClipDurationSec > 0) return mediaClipDurationSec;
  }
  let nonEmpty2 = '';
  for (const value6 of getSourceDataCandidates(enabled5)) {
    nonEmpty2 = firstNonEmpty(
      value6.durationSec,
      value6.videoDuration,
      value6.audioDuration,
      value6.duration,
      value6.mediaDuration,
    );
    if (nonEmpty2) break;
  }
  const count = Math.max(0, toNumber(nonEmpty2, 0));
  if (count > 0) return count;
  return value4 === 'image' ? MEDIA_CLIP_IMAGE_DEFAULT_DURATION_SEC : 0;
}
export function resolveMediaClipDimensions(options7 = {}) {
  const videoRecord2 = resolveVideoRecord(options7);
  let box2 = getSourceDataCandidates(videoRecord2 || options7 || {})[0] || {};
  for (const box3 of getSourceDataCandidates(videoRecord2 || options7 || {})) {
    const nonEmpty3 = firstNonEmpty(box3.videoWidth, box3.width, box3.naturalWidth),
      nonEmpty4 = firstNonEmpty(box3.videoHeight, box3.height, box3.naturalHeight);
    if (nonEmpty3 || nonEmpty4) {
      box2 = box3;
      break;
    }
  }
  const width = Math.round(toNumber(box2.videoWidth ?? box2.width ?? box2.naturalWidth, 0)),
    height = Math.round(toNumber(box2.videoHeight ?? box2.height ?? box2.naturalHeight, 0));
  return { width: width > 0 ? width : 1280, height: height > 0 ? height : 720 };
}
export function clampMediaClipRange(options8 = {}, value7 = 0) {
  const count2 = Math.max(0, toNumber(value7, 0)),
    value8 = count2 > 0 ? count2 : Math.max(MIN_RANGE_SEC, toNumber(options8.endSec, MIN_RANGE_SEC));
  let roundSec2 = roundSec(options8.startSec),
    roundSec3 = roundSec(options8.endSec ?? value8);
  return (
    count2 > 0
      ? ((roundSec2 = Math.min(roundSec2, Math.max(0, count2 - MIN_RANGE_SEC))),
        (roundSec3 = Math.min(Math.max(roundSec3, roundSec2 + MIN_RANGE_SEC), count2)))
      : (roundSec3 = Math.max(roundSec3, roundSec2 + MIN_RANGE_SEC)),
    !(roundSec3 > roundSec2) &&
      (roundSec3 = count2 > 0 ? Math.min(count2, roundSec2 + MIN_RANGE_SEC) : roundSec2 + MIN_RANGE_SEC),
    {
      startSec: roundSec(roundSec2),
      endSec: roundSec(roundSec3),
      durationSec: roundSec(count2 || roundSec3),
    }
  );
}
function readStoryImageHoldDuration(track, sourceKey, kind) {
  const value = track?.storyImageDurationSec;
  return kind === 'image' &&
    normalizeText(track?.sourceKey) === sourceKey &&
    Number.isFinite(value) &&
    value >= 0.1 &&
    value <= 3600
    ? value
    : 0;
}
function normalizeTrack(options9 = {}, enabled6 = null, value9 = '') {
  if (!enabled6) return null;
  const value10 = options9 && typeof options9 === 'object' ? options9 : {},
    sourceKey2 = resolveMediaClipSourceKey(enabled6);
  if (!sourceKey2) return null;
  const endSec =
      readStoryImageHoldDuration(value10, sourceKey2, value9) ||
      resolveMediaClipDurationSec(enabled6, value9),
    text3 = normalizeText(value10.sourceKey) !== sourceKey2,
    value11 = text3 ? { startSec: 0, endSec: endSec || value10.endSec || MIN_RANGE_SEC } : value10,
    startSec = clampMediaClipRange(value11, endSec);
  return {
    sourceKey: sourceKey2,
    startSec: startSec.startSec,
    endSec: startSec.endSec,
    durationSec: startSec.durationSec,
  };
}
function getMediaClipSourceId(options10 = {}) {
  return firstNonEmpty(options10?.id, options10?.nodeId, options10?.sourceId);
}
function getMediaClipClipId(options11 = {}, value12 = 0, value13 = '') {
  return firstNonEmpty(
    options11?.clipId,
    options11?.__mediaClipClipId,
    options11?.__mediaClipEdgeId,
    options11?.edgeId,
    value13 ? 'media:' + value13 + ':' + value12 : '',
    getMediaClipSourceId(options11) ? 'node:' + getMediaClipSourceId(options11) + ':' + value12 : '',
    'clip:' + value12,
  );
}
function recomputeVideoClipTimeline(list4 = []) {
  let value14 = 0;
  return list4
    .map((args2, value15) => {
      if (!args2 || typeof args2 !== 'object') return null;
      const sourceKey3 = normalizeText(args2.sourceKey);
      if (!sourceKey3) return null;
      const startSec2 = clampMediaClipRange(args2, args2.durationSec),
        roundSec4 = roundSec(Math.max(MIN_RANGE_SEC, startSec2.endSec - startSec2.startSec)),
        timelineStartSec = roundSec(value14),
        timelineEndSec = roundSec(timelineStartSec + roundSec4),
        value16 = {
          ...args2,
          id: normalizeText(args2.id) || 'clip:' + value15,
          sourceKey: sourceKey3,
          startSec: startSec2.startSec,
          endSec: startSec2.endSec,
          durationSec: startSec2.durationSec,
          timelineStartSec: timelineStartSec,
          timelineEndSec: timelineEndSec,
        };
      return ((value14 = timelineEndSec), value16);
    })
    .filter(Boolean);
}
function normalizeAudioClipTimeline(list5 = []) {
  return list5
    .map((muted, value17) => {
      if (!muted || typeof muted !== 'object') return null;
      const sourceKey4 = normalizeText(muted.sourceKey);
      if (!sourceKey4) return null;
      const startSec3 = clampMediaClipRange(muted, muted.durationSec),
        roundSec5 = roundSec(Math.max(MIN_RANGE_SEC, startSec3.endSec - startSec3.startSec)),
        value18 = Number.isFinite(Number(muted.timelineStartSec)),
        timelineStartSec2 = roundSec(value18 ? muted.timelineStartSec : 0);
      return {
        ...muted,
        id: normalizeText(muted.id) || 'audio:' + value17,
        kind: 'audio',
        sourceKey: sourceKey4,
        startSec: startSec3.startSec,
        endSec: startSec3.endSec,
        durationSec: startSec3.durationSec,
        timelineStartSec: timelineStartSec2,
        timelineEndSec: roundSec(timelineStartSec2 + roundSec5),
        laneIndex: normalizeMediaClipAudioLaneIndex(muted.laneIndex),
        muted: muted.muted === true,
        disabled: muted.disabled === true,
      };
    })
    .filter(Boolean);
}
function normalizeVideoClips(options12 = {}, value19 = []) {
  const list6 = normalizeSourceList(value19),
    list7 = Array.isArray(options12.clips) ? options12.clips : [],
    map = new Set(),
    handler2 = (value20, value21, value22) => {
      const text4 = normalizeText(value20),
        text5 = normalizeText(value21),
        text6 = normalizeText(value22),
        list8 = list7
          .map((clip, index2) => ({ clip: clip, index: index2 }))
          .filter(
            ({ clip: clip2, index: index3 }) =>
              !map.has(index3) &&
              text4 &&
              (normalizeText(clip2?.id) === text4 || normalizeText(clip2?.id).startsWith(text4 + ':split:')),
          );
      if (list8.length)
        return (list8.forEach(({ index: index4 }) => map.add(index4)), list8.map(({ clip: clip3 }) => clip3));
      const list9 = list7
        .map((clip4, index5) => ({ clip: clip4, index: index5 }))
        .filter(
          ({ clip: clip5, index: index6 }) =>
            !map.has(index6) && text5 && normalizeText(clip5?.sourceId) === text5,
        );
      if (list9.length)
        return (list9.forEach(({ index: index7 }) => map.add(index7)), list9.map(({ clip: clip6 }) => clip6));
      const list10 = list7
        .map((clip7, index8) => ({ clip: clip7, index: index8 }))
        .filter(
          ({ clip: clip8, index: index9 }) =>
            !map.has(index9) && text6 && normalizeText(clip8?.sourceKey) === text6,
        );
      if (list10.length)
        return (
          list10.forEach(({ index: index10 }) => map.add(index10)),
          list10.map(({ clip: clip9 }) => clip9)
        );
      return [];
    },
    list11 = [];
  return (
    list6.forEach((item5, value23) => {
      const sourceKey5 = resolveMediaClipSourceKey(item5);
      if (!sourceKey5) return;
      const kind2 = getMediaClipInputKind(item5) === 'image' ? 'image' : 'video',
        sourceId = getMediaClipSourceId(item5),
        mediaClipClipId = getMediaClipClipId(item5, value23, sourceKey5),
        list12 = handler2(mediaClipClipId, sourceId, sourceKey5),
        value24 = list6.length === 1 ? options12.tracks?.video : null,
        list13 = list12.length ? list12 : [value24];
      list13.forEach((storyImageDurationSec, count3) => {
        const mediaClipInputKind2 = getMediaClipInputKind(storyImageDurationSec) === 'image' ? 'image' : '',
          startSec4 = normalizeTrack(storyImageDurationSec, item5, mediaClipInputKind2 || kind2);
        if (!startSec4) return;
        list11.push({
          id:
            normalizeText(storyImageDurationSec?.id) ||
            (count3 === 0 ? mediaClipClipId : mediaClipClipId + ':clip:' + count3),
          kind: kind2,
          sourceId: sourceId,
          sourceKey: sourceKey5,
          startSec: startSec4.startSec,
          endSec: startSec4.endSec,
          durationSec: startSec4.durationSec,
          ...(readStoryImageHoldDuration(storyImageDurationSec, sourceKey5, kind2)
            ? { storyImageDurationSec: storyImageDurationSec.storyImageDurationSec }
            : {}),
          timelineStartSec: storyImageDurationSec?.timelineStartSec,
          timelineEndSec: storyImageDurationSec?.timelineEndSec,
        });
      });
    }),
    recomputeVideoClipTimeline(list11)
  );
}
function normalizeAudioClips(sourceKey6 = {}, value25 = []) {
  const list14 = normalizeSourceList(value25),
    list15 = Array.isArray(sourceKey6.audioClips) ? sourceKey6.audioClips : [],
    value26 =
      !list15.length && sourceKey6.tracks?.audio
        ? [
            {
              id: 'audio:0',
              kind: 'audio',
              sourceKey: sourceKey6.tracks.audio.sourceKey,
              startSec: sourceKey6.tracks.audio.startSec,
              endSec: sourceKey6.tracks.audio.endSec,
              durationSec: sourceKey6.tracks.audio.durationSec,
              timelineStartSec: sourceKey6.tracks.audio.startSec,
              timelineEndSec: sourceKey6.tracks.audio.endSec,
            },
          ]
        : [],
    list16 = list15.length ? list15 : value26,
    map2 = new Set(),
    handler3 = (value27, value28, value29) => {
      const text7 = normalizeText(value27),
        text8 = normalizeText(value28),
        text9 = normalizeText(value29),
        list17 = list16
          .map((clip10, index11) => ({ clip: clip10, index: index11 }))
          .filter(
            ({ clip: clip11, index: index12 }) =>
              !map2.has(index12) && text7 && normalizeText(clip11?.id) === text7,
          );
      if (list17.length)
        return (
          list17.forEach(({ index: index13 }) => map2.add(index13)),
          list17.map(({ clip: clip12 }) => clip12)
        );
      const list18 = list16
        .map((clip13, index14) => ({ clip: clip13, index: index14 }))
        .filter(
          ({ clip: clip14, index: index15 }) =>
            !map2.has(index15) && text8 && normalizeText(clip14?.sourceId) === text8,
        );
      if (list18.length)
        return (
          list18.forEach(({ index: index16 }) => map2.add(index16)),
          list18.map(({ clip: clip15 }) => clip15)
        );
      const list19 = list16
        .map((clip16, index17) => ({ clip: clip16, index: index17 }))
        .filter(
          ({ clip: clip17, index: index18 }) =>
            !map2.has(index18) && text9 && normalizeText(clip17?.sourceKey) === text9,
        );
      if (list19.length)
        return (
          list19.forEach(({ index: index19 }) => map2.add(index19)),
          list19.map(({ clip: clip18 }) => clip18)
        );
      return [];
    },
    list20 = [];
  let value30 = list16.reduce((item6, value31) => Math.max(item6, toNumber(value31?.timelineEndSec, 0)), 0);
  return (
    list14.forEach((item7, value32) => {
      const sourceKey7 = resolveMediaClipSourceKey(item7);
      if (!sourceKey7) return;
      const sourceId2 = getMediaClipSourceId(item7),
        mediaClipClipId2 = getMediaClipClipId(item7, value32, sourceKey7),
        list21 = handler3(mediaClipClipId2, sourceId2, sourceKey7),
        value33 = list14.length === 1 ? sourceKey6.tracks?.audio : null,
        list22 = list21.length ? list21 : [value33];
      list22.forEach((laneIndex, count4) => {
        const startSec5 = normalizeTrack(laneIndex, item7, 'audio');
        if (!startSec5) return;
        const roundSec6 = roundSec(Math.max(MIN_RANGE_SEC, startSec5.endSec - startSec5.startSec)),
          value34 = Number.isFinite(Number(laneIndex?.timelineStartSec)),
          timelineStartSec3 = roundSec(value34 ? laneIndex.timelineStartSec : value30),
          timelineEndSec2 = roundSec(timelineStartSec3 + roundSec6);
        (list20.push({
          id:
            normalizeText(laneIndex?.id) ||
            (count4 === 0 ? mediaClipClipId2 : mediaClipClipId2 + ':clip:' + count4),
          kind: 'audio',
          sourceId: sourceId2,
          sourceKey: sourceKey7,
          startSec: startSec5.startSec,
          endSec: startSec5.endSec,
          durationSec: startSec5.durationSec,
          timelineStartSec: timelineStartSec3,
          timelineEndSec: timelineEndSec2,
          laneIndex: laneIndex?.laneIndex,
          muted: laneIndex?.muted === true,
          disabled: laneIndex?.disabled === true,
          ...(laneIndex?.volume !== undefined ? { volume: laneIndex.volume } : {}),
        }),
          (value30 = Math.max(value30, timelineEndSec2)));
      });
    }),
    normalizeAudioClipTimeline(list20)
  );
}
function buildVideoTrackFromClips(sourceKey8 = []) {
  if (!sourceKey8.length) return null;
  const endSec2 = roundSec(
    sourceKey8.reduce((item8, value35) => Math.max(item8, toNumber(value35.timelineEndSec, 0)), 0),
  );
  if (sourceKey8.length === 1) {
    const sourceKey9 = sourceKey8[0];
    return {
      sourceKey: sourceKey9.sourceKey,
      startSec: sourceKey9.startSec,
      endSec: sourceKey9.endSec,
      durationSec: Math.max(toNumber(sourceKey9.durationSec, 0), endSec2),
    };
  }
  return {
    sourceKey: sourceKey8.map((item9) => item9.sourceKey).join('|'),
    startSec: 0,
    endSec: endSec2,
    durationSec: endSec2,
  };
}
function buildAudioTrackFromClips(sourceKey10 = []) {
  if (!sourceKey10.length) return null;
  const endSec3 = roundSec(
    sourceKey10.reduce((item10, value36) => Math.max(item10, toNumber(value36.timelineEndSec, 0)), 0),
  );
  if (sourceKey10.length === 1) {
    const sourceKey11 = sourceKey10[0];
    return {
      sourceKey: sourceKey11.sourceKey,
      startSec: sourceKey11.startSec,
      endSec: sourceKey11.endSec,
      durationSec: Math.max(toNumber(sourceKey11.durationSec, 0), endSec3),
    };
  }
  return {
    sourceKey: sourceKey10.map((item11) => item11.sourceKey).join('|'),
    startSec: 0,
    endSec: endSec3,
    durationSec: endSec3,
  };
}
function buildMediaClipFromVideoClips(args3 = {}, value37 = []) {
  const clips = recomputeVideoClipTimeline(value37);
  return {
    ...args3,
    activeTrack: 'video',
    clips: clips,
    tracks: { ...(args3.tracks || {}), video: buildVideoTrackFromClips(clips) },
  };
}
function buildMediaClipFromPositionedVideoClips(args4 = {}, list23 = []) {
  const clips2 = list23
    .map((args5, value38) => {
      if (!args5 || typeof args5 !== 'object') return null;
      const sourceKey12 = normalizeText(args5.sourceKey);
      if (!sourceKey12) return null;
      const startSec6 = clampMediaClipRange(args5, args5.durationSec),
        roundSec7 = roundSec(Math.max(MIN_RANGE_SEC, startSec6.endSec - startSec6.startSec)),
        timelineStartSec4 = roundSignedSec(args5.timelineStartSec);
      return {
        ...args5,
        id: normalizeText(args5.id) || 'clip:' + value38,
        sourceKey: sourceKey12,
        startSec: startSec6.startSec,
        endSec: startSec6.endSec,
        durationSec: startSec6.durationSec,
        timelineStartSec: timelineStartSec4,
        timelineEndSec: roundSignedSec(timelineStartSec4 + roundSec7),
      };
    })
    .filter(Boolean);
  return {
    ...args4,
    activeTrack: 'video',
    clips: clips2,
    tracks: { ...(args4.tracks || {}), video: buildVideoTrackFromClips(clips2) },
  };
}
function buildMediaClipFromAudioClips(args6 = {}, value39 = []) {
  const audioClips2 = normalizeAudioClipTimeline(value39);
  return {
    ...args6,
    activeTrack: 'audio',
    audioClips: audioClips2,
    tracks: { ...(args6.tracks || {}), audio: buildAudioTrackFromClips(audioClips2) },
  };
}
export function patchMediaClipClipRange(options13 = {}, value40 = 0, args7 = {}) {
  const list24 = Array.isArray(options13.clips) ? options13.clips : [],
    value41 = Math.max(0, Math.trunc(toNumber(value40, 0))),
    durationSec = list24[value41];
  if (!durationSec) return options13;
  const startSec7 = clampMediaClipRange({ ...durationSec, ...args7 }, durationSec.durationSec),
    value42 = list24.map((args8, value43) =>
      value43 === value41
        ? {
            ...args8,
            startSec: startSec7.startSec,
            endSec: startSec7.endSec,
            durationSec: durationSec.durationSec,
          }
        : args8,
    );
  return buildMediaClipFromVideoClips(options13, value42);
}
export function rollMediaClipVisualLeftTrim(options14 = {}, value44 = 0, args9 = {}, value45 = {}) {
  const list25 = Array.isArray(options14.clips) ? options14.clips : [],
    count5 = Math.max(0, Math.trunc(toNumber(value44, 0))),
    durationSec2 = list25[count5],
    enabled7 = list25[count5 - 1];
  if (!durationSec2) return options14;
  if (!enabled7 || count5 <= 0) return patchMediaClipClipRange(options14, count5, args9);
  const clampMediaClipRange2 = clampMediaClipRange({ ...durationSec2, ...args9 }, durationSec2.durationSec),
    roundSec8 = roundSec(durationSec2.startSec),
    endSec4 = roundSec(durationSec2.endSec),
    roundSignedSec2 = roundSignedSec(
      enabled7.timelineEndSec ??
        roundSignedSec(enabled7.timelineStartSec) +
          Math.max(0, roundSec(enabled7.endSec) - roundSec(enabled7.startSec)),
    ),
    roundSignedSec3 = roundSignedSec(clampMediaClipRange2.startSec - roundSec8),
    value46 = -roundSec8,
    value47 = endSec4 - MIN_RANGE_SEC - roundSec8,
    roundSignedSec4 = roundSignedSec(Math.max(value46, Math.min(value47, roundSignedSec3))),
    startSec8 = roundSec(roundSec8 + roundSignedSec4),
    timelineStartSec5 = roundSignedSec(roundSignedSec2 + roundSignedSec4),
    handler4 = (options15 = {}) => {
      const clampMediaClipRange3 = clampMediaClipRange(options15, options15.durationSec);
      return roundSec(Math.max(MIN_RANGE_SEC, clampMediaClipRange3.endSec - clampMediaClipRange3.startSec));
    };
  let value48 = 0,
    list26 = list25.map((args10, value49) => {
      if (value49 < count5) {
        const value50 = {
          ...args10,
          timelineStartSec: roundSignedSec(toNumber(args10.timelineStartSec, 0) + roundSignedSec4),
          timelineEndSec: roundSignedSec(toNumber(args10.timelineEndSec, 0) + roundSignedSec4),
        };
        return ((value48 = value50.timelineEndSec), value50);
      }
      if (value49 === count5) {
        const value51 = {
          ...args10,
          startSec: startSec8,
          endSec: endSec4,
          durationSec: durationSec2.durationSec,
          timelineStartSec: timelineStartSec5,
          timelineEndSec: roundSignedSec(timelineStartSec5 + Math.max(MIN_RANGE_SEC, endSec4 - startSec8)),
        };
        return ((value48 = value51.timelineEndSec), value51);
      }
      const value52 = handler4(args10),
        timelineStartSec6 = roundSignedSec(value48),
        value53 = {
          ...args10,
          timelineStartSec: timelineStartSec6,
          timelineEndSec: roundSignedSec(timelineStartSec6 + value52),
        };
      return ((value48 = value53.timelineEndSec), value53);
    });
  if (value45.rebaseNegativeTimeline === true || value45.rebaseTimelineStart === true) {
    const roundSignedSec5 = roundSignedSec(
      list26.reduce(
        (item12, value54) => Math.min(item12, roundSignedSec(value54?.timelineStartSec)),
        Number.POSITIVE_INFINITY,
      ),
    );
    if (
      Number.isFinite(roundSignedSec5) &&
      (roundSignedSec5 < 0 || (value45.rebaseTimelineStart === true && Math.abs(roundSignedSec5) > 0.001))
    ) {
      const value55 = -roundSignedSec5;
      list26 = list26.map((args11) => ({
        ...args11,
        timelineStartSec: roundSignedSec(toNumber(args11.timelineStartSec, 0) + value55),
        timelineEndSec: roundSignedSec(toNumber(args11.timelineEndSec, 0) + value55),
      }));
    }
  }
  return buildMediaClipFromPositionedVideoClips(options14, list26);
}
export function patchMediaClipAudioClipRange(options16 = {}, value56 = 0, args12 = {}) {
  const list27 = Array.isArray(options16.audioClips) ? options16.audioClips : [],
    value57 = Math.max(0, Math.trunc(toNumber(value56, 0))),
    durationSec3 = list27[value57];
  if (!durationSec3) return options16;
  const startSec9 = clampMediaClipRange({ ...durationSec3, ...args12 }, durationSec3.durationSec),
    roundSec9 = roundSec(Math.max(MIN_RANGE_SEC, startSec9.endSec - startSec9.startSec)),
    value58 = Object.prototype.hasOwnProperty.call(args12, 'startSec')
      ? startSec9.startSec - roundSec(durationSec3.startSec)
      : 0,
    timelineStartSec7 = roundSec(Math.max(0, toNumber(durationSec3.timelineStartSec, 0) + value58)),
    value59 = list27.map((args13, value60) =>
      value60 === value57
        ? {
            ...args13,
            startSec: startSec9.startSec,
            endSec: startSec9.endSec,
            durationSec: durationSec3.durationSec,
            timelineStartSec: timelineStartSec7,
            timelineEndSec: roundSec(timelineStartSec7 + roundSec9),
          }
        : args13,
    );
  return buildMediaClipFromAudioClips(options16, value59);
}
export function shiftMediaClipClipRange(options17 = {}, value61 = 0, value62 = 0) {
  const value63 = Array.isArray(options17.clips) ? options17.clips : [],
    value64 = Math.max(0, Math.trunc(toNumber(value61, 0))),
    enabled8 = value63[value64];
  if (!enabled8) return options17;
  const count6 = Math.max(0, toNumber(enabled8.durationSec, 0)),
    roundSec10 = roundSec(enabled8.startSec),
    roundSec11 = roundSec(enabled8.endSec),
    value65 = Math.max(MIN_RANGE_SEC, roundSec11 - roundSec10),
    toNumber3 = toNumber(value62, 0),
    value66 = count6 > 0 ? Math.max(0, count6 - value65) : roundSec10 + toNumber3,
    startSec10 = roundSec(Math.max(0, Math.min(value66, roundSec10 + toNumber3))),
    endSec5 = roundSec(count6 > 0 ? Math.min(count6, startSec10 + value65) : startSec10 + value65);
  return patchMediaClipClipRange(options17, value64, { startSec: startSec10, endSec: endSec5 });
}
export function patchMediaClipAudioClipState(options18 = {}, value67 = 0, el = {}) {
  const list28 = Array.isArray(options18.audioClips) ? options18.audioClips : [],
    value68 = Math.max(0, Math.trunc(toNumber(value67, 0))),
    enabled9 = list28[value68];
  if (!enabled9) return options18;
  const value69 = list28.map((args14, value70) => {
    if (value70 !== value68) return args14;
    const el2 = { ...args14 };
    return (
      Object.prototype.hasOwnProperty.call(el, 'laneIndex') &&
        (el2.laneIndex = normalizeMediaClipAudioLaneIndex(el.laneIndex)),
      Object.prototype.hasOwnProperty.call(el, 'muted') && (el2.muted = el.muted === true),
      Object.prototype.hasOwnProperty.call(el, 'disabled') && (el2.disabled = el.disabled === true),
      el2
    );
  });
  return buildMediaClipFromAudioClips(options18, value69);
}
export function patchMediaClipAudioLaneMuted(options19 = {}, value71 = 0, muted2 = false) {
  const list29 = Array.isArray(options19.audioClips) ? options19.audioClips : [],
    mediaClipAudioLaneIndex = normalizeMediaClipAudioLaneIndex(value71);
  if (
    !list29.some((item13) => normalizeMediaClipAudioLaneIndex(item13?.laneIndex) === mediaClipAudioLaneIndex)
  )
    return options19;
  const value72 = list29.map((args15) =>
    normalizeMediaClipAudioLaneIndex(args15?.laneIndex) === mediaClipAudioLaneIndex
      ? { ...args15, muted: muted2 === true }
      : args15,
  );
  return buildMediaClipFromAudioClips(options19, value72);
}
export function moveMediaClipAudioClipOnTimeline(options20 = {}, value73 = 0, value74 = 0, value75 = {}) {
  const list30 = Array.isArray(options20.audioClips) ? options20.audioClips : [],
    value76 = Math.max(0, Math.trunc(toNumber(value73, 0))),
    enabled10 = list30[value76];
  if (!enabled10) return options20;
  const roundSec12 = roundSec(enabled10.timelineStartSec),
    roundSec13 = roundSec(enabled10.timelineEndSec),
    roundSec14 = roundSec(Math.max(MIN_RANGE_SEC, roundSec13 - roundSec12)),
    timelineStartSec8 = roundSec(Math.max(0, roundSec12 + toNumber(value74, 0))),
    value77 = list30.map((args16, value78) =>
      value78 === value76
        ? {
            ...args16,
            timelineStartSec: timelineStartSec8,
            timelineEndSec: roundSec(timelineStartSec8 + roundSec14),
            ...(Object.prototype.hasOwnProperty.call(value75, 'laneIndex')
              ? { laneIndex: normalizeMediaClipAudioLaneIndex(value75.laneIndex) }
              : {}),
          }
        : args16,
    );
  return buildMediaClipFromAudioClips(options20, value77);
}
export function moveMediaClipClipOnTimeline(options21 = {}, value79 = 0, value80 = 0) {
  const list31 = Array.isArray(options21.clips) ? options21.clips : [],
    value81 = Math.max(0, Math.trunc(toNumber(value79, 0))),
    enabled11 = list31[value81];
  if (!enabled11) return options21;
  const roundSec15 = roundSec(enabled11.timelineStartSec),
    roundSec16 = roundSec(enabled11.timelineEndSec),
    roundSec17 = roundSec(Math.max(MIN_RANGE_SEC, roundSec16 - roundSec15)),
    roundSec18 = roundSec(roundSec15 + toNumber(value80, 0) + roundSec17 / 2),
    list32 = list31.filter((item14, value82) => value82 !== value81),
    count7 = list32.findIndex((item15) => {
      const roundSec19 = roundSec(item15.timelineStartSec),
        roundSec20 = roundSec(item15.timelineEndSec || roundSec19),
        roundSec21 = roundSec(roundSec19 + Math.max(MIN_RANGE_SEC, roundSec20 - roundSec19) / 2);
      return roundSec18 < roundSec21;
    }),
    list33 = [...list32];
  return (
    list33.splice(count7 >= 0 ? count7 : list33.length, 0, enabled11),
    buildMediaClipFromVideoClips(options21, list33)
  );
}
export function removeMediaClipAudioClip(options22 = {}, value83 = 0) {
  const list34 = Array.isArray(options22.audioClips) ? options22.audioClips : [],
    value84 = Math.max(0, Math.trunc(toNumber(value83, 0)));
  if (!list34[value84]) return options22;
  const value85 = list34.filter((item16, value86) => value86 !== value84);
  return buildMediaClipFromAudioClips(options22, value85);
}
export function removeMediaClipClip(options23 = {}, value87 = 0) {
  const list35 = Array.isArray(options23.clips) ? options23.clips : [],
    value88 = Math.max(0, Math.trunc(toNumber(value87, 0)));
  if (!list35[value88]) return options23;
  const value89 = list35.filter((item17, value90) => value90 !== value88);
  return buildMediaClipFromVideoClips(options23, value89);
}
export function splitMediaClipAtTimelineSec(options24 = {}, value91 = 0, value92 = '') {
  const list36 = Array.isArray(options24.clips) ? options24.clips : [];
  if (!list36.length) return options24;
  const timelineEndSec3 = roundSec(value91),
    count8 = list36.findIndex((item18) => {
      const roundSec22 = roundSec(item18.timelineStartSec),
        roundSec23 = roundSec(item18.timelineEndSec);
      return timelineEndSec3 > roundSec22 + MIN_RANGE_SEC && timelineEndSec3 < roundSec23 - MIN_RANGE_SEC;
    });
  if (count8 < 0) return options24;
  const args17 = list36[count8],
    timelineStartSec9 = roundSec(args17.timelineStartSec),
    roundSec24 = roundSec(args17.startSec),
    roundSec25 = roundSec(args17.endSec),
    endSec6 = roundSec(roundSec24 + (timelineEndSec3 - timelineStartSec9));
  if (endSec6 <= roundSec24 + MIN_RANGE_SEC || endSec6 >= roundSec25 - MIN_RANGE_SEC) return options24;
  const text10 = normalizeText(value92),
    id = (normalizeText(args17.id) || 'clip:' + count8) + ':split:' + endSec6 + (text10 ? ':' + text10 : ''),
    value93 = [
      ...list36.slice(0, count8),
      { ...args17, endSec: endSec6, timelineStartSec: timelineStartSec9, timelineEndSec: timelineEndSec3 },
      {
        ...args17,
        id: id,
        startSec: endSec6,
        timelineStartSec: timelineEndSec3,
        timelineEndSec: roundSec(args17.timelineEndSec || timelineStartSec9 + (roundSec25 - roundSec24)),
      },
      ...list36.slice(count8 + 1),
    ];
  return buildMediaClipFromVideoClips(options24, value93);
}
export function splitMediaClipAudioAtTimelineSec(options25 = {}, value94 = 0, value95 = '') {
  const list37 = Array.isArray(options25.audioClips) ? options25.audioClips : [];
  if (!list37.length) return options25;
  const timelineEndSec4 = roundSec(value94),
    count9 = list37.findIndex((item19) => {
      const roundSec26 = roundSec(item19.timelineStartSec),
        roundSec27 = roundSec(item19.timelineEndSec);
      return timelineEndSec4 > roundSec26 + MIN_RANGE_SEC && timelineEndSec4 < roundSec27 - MIN_RANGE_SEC;
    });
  if (count9 < 0) return options25;
  const args18 = list37[count9],
    timelineStartSec10 = roundSec(args18.timelineStartSec),
    roundSec28 = roundSec(args18.startSec),
    roundSec29 = roundSec(args18.endSec),
    endSec7 = roundSec(roundSec28 + (timelineEndSec4 - timelineStartSec10));
  if (endSec7 <= roundSec28 + MIN_RANGE_SEC || endSec7 >= roundSec29 - MIN_RANGE_SEC) return options25;
  const text11 = normalizeText(value95),
    id2 =
      (normalizeText(args18.id) || 'audio:' + count9) + ':split:' + endSec7 + (text11 ? ':' + text11 : ''),
    value96 = [
      ...list37.slice(0, count9),
      { ...args18, endSec: endSec7, timelineStartSec: timelineStartSec10, timelineEndSec: timelineEndSec4 },
      {
        ...args18,
        id: id2,
        startSec: endSec7,
        timelineStartSec: timelineEndSec4,
        timelineEndSec: roundSec(args18.timelineEndSec || timelineStartSec10 + (roundSec29 - roundSec28)),
      },
      ...list37.slice(count9 + 1),
    ];
  return buildMediaClipFromAudioClips(options25, value96);
}
export function normalizeMediaClipState(options26 = {}, value97 = {}) {
  const expanded = options26.mediaClip && typeof options26.mediaClip === 'object' ? options26.mediaClip : {},
    sourceList = normalizeSourceList(value97.videos || value97.video),
    sourceList2 = normalizeSourceList(value97.audios || value97.audio),
    clips3 = normalizeVideoClips(expanded, sourceList),
    video = buildVideoTrackFromClips(clips3),
    audioClips3 = normalizeAudioClips(expanded, sourceList2),
    audio = buildAudioTrackFromClips(audioClips3);
  let activeTrack = expanded.activeTrack === 'audio' ? 'audio' : 'video';
  if (activeTrack === 'video' && !video && audio) activeTrack = 'audio';
  if (activeTrack === 'audio' && !audio && video) activeTrack = 'video';
  if (!video && !audio) activeTrack = 'video';
  return {
    schemaVersion: MEDIA_CLIP_SCHEMA_VERSION,
    expanded: expanded.expanded === true,
    activeTrack: activeTrack,
    cropMode: expanded.cropMode === true,
    timelineView: normalizeMediaClipTimelineView(expanded.timelineView),
    clips: clips3,
    audioClips: audioClips3,
    tracks: { video: video, audio: audio },
    lastOutput:
      expanded.lastOutput && typeof expanded.lastOutput === 'object' ? { ...expanded.lastOutput } : null,
  };
}
export function buildMediaClipIncomingSignature(options27 = {}, value98 = '') {
  const text12 = normalizeText(value98);
  if (!text12) return '';
  const value99 = options27.nodes || {};
  return Object.values(options27.edges || {})
    .filter((item20) => normalizeText(item20?.targetId) === text12)
    .map((item21) => {
      const text13 = normalizeText(item21?.sourceId),
        value100 = value99[text13] || {},
        mediaClipInputKind3 = getMediaClipInputKind(value100),
        mediaClipSourceKey = resolveMediaClipSourceKey(value100),
        value101 = mediaClipInputKind3 ? resolveMediaClipDurationSec(value100, mediaClipInputKind3) : 0,
        value102 = Number.isFinite(value100?._bizRev) ? value100._bizRev : 0;
      return [
        normalizeText(item21?.id),
        text13,
        mediaClipInputKind3,
        mediaClipSourceKey,
        roundSec(value101),
        value102,
      ].join(':');
    })
    .join('|');
}
export function patchMediaClipTrackRange(args19 = {}, activeTrack2 = 'video', args20 = {}) {
  const args21 = args19?.tracks?.[activeTrack2];
  if (!args21) return args19;
  const args22 = clampMediaClipRange({ ...args21, ...args20 }, args21.durationSec);
  return {
    ...args19,
    activeTrack: activeTrack2,
    tracks: { ...(args19.tracks || {}), [activeTrack2]: { ...args21, ...args22 } },
  };
}
export function shiftMediaClipTrackRange(options28 = {}, value103 = 'video', value104 = 0) {
  const enabled12 = options28?.tracks?.[value103];
  if (!enabled12) return options28;
  const count10 = Math.max(0, toNumber(enabled12.durationSec, 0)),
    roundSec30 = roundSec(enabled12.startSec),
    roundSec31 = roundSec(enabled12.endSec),
    value105 = Math.max(MIN_RANGE_SEC, roundSec31 - roundSec30),
    toNumber4 = toNumber(value104, 0),
    value106 = count10 > 0 ? Math.max(0, count10 - value105) : roundSec30 + toNumber4,
    startSec11 = roundSec(Math.max(0, Math.min(value106, roundSec30 + toNumber4))),
    endSec8 = roundSec(count10 > 0 ? Math.min(count10, startSec11 + value105) : startSec11 + value105);
  return patchMediaClipTrackRange(options28, value103, { startSec: startSec11, endSec: endSec8 });
}
export function mapMediaClipVideoSecToAudioSec(value107 = 0, enabled13 = null, enabled14 = null) {
  if (!enabled13 || !enabled14) return null;
  const roundSec32 = roundSec(enabled13.startSec),
    roundSec33 = roundSec(enabled14.startSec),
    roundSec34 = roundSec(enabled14.endSec),
    count11 = Math.round((toNumber(value107, 0) - roundSec32) * 1000) / 1000;
  if (count11 < 0 || !(roundSec34 > roundSec33)) return null;
  const roundSec35 = roundSec(roundSec33 + count11);
  if (roundSec35 > roundSec34) return null;
  return Math.max(roundSec33, Math.min(roundSec34, roundSec35));
}
function normalizeMediaClipExportVideoClips(list38 = []) {
  if (!Array.isArray(list38)) return [];
  return list38
    .map((enabled15) => {
      if (!enabled15 || typeof enabled15 !== 'object') return null;
      const sourceKey13 = normalizeText(
        enabled15.sourceKey || enabled15.src || enabled15.localPath || enabled15.path,
      );
      if (!sourceKey13) return null;
      const startSec12 = roundSec(enabled15.startSec ?? enabled15.start ?? 0),
        count12 = Math.max(0, toNumber(enabled15.durationSec ?? enabled15.duration, 0)),
        endSec9 = roundSec(
          enabled15.endSec ?? enabled15.end ?? (count12 > 0 ? startSec12 + count12 : startSec12),
        );
      if (!(endSec9 > startSec12)) return null;
      return {
        sourceKey: sourceKey13,
        src: sourceKey13,
        kind: normalizeText(enabled15.kind) === 'image' ? 'image' : 'video',
        startSec: startSec12,
        endSec: endSec9,
        durationSec: roundSec(endSec9 - startSec12),
      };
    })
    .filter(Boolean);
}
function normalizeMediaClipExportAudioClips(list39 = []) {
  if (!Array.isArray(list39)) return [];
  return list39
    .map((el3) => {
      if (!el3 || typeof el3 !== 'object') return null;
      if (el3.muted === true || el3.disabled === true) return null;
      const sourceKey14 = normalizeText(el3.sourceKey || el3.src || el3.localPath || el3.path);
      if (!sourceKey14) return null;
      const startSec13 = roundSec(el3.startSec ?? el3.start ?? 0),
        count13 = Math.max(0, toNumber(el3.durationSec ?? el3.duration, 0)),
        endSec10 = roundSec(el3.endSec ?? el3.end ?? (count13 > 0 ? startSec13 + count13 : startSec13));
      if (!(endSec10 > startSec13)) return null;
      const timelineStartSec11 = roundSec(el3.timelineStartSec ?? el3.timelineStart ?? 0),
        timelineEndSec5 = roundSec(
          el3.timelineEndSec ??
            el3.timelineEnd ??
            timelineStartSec11 + Math.max(MIN_RANGE_SEC, endSec10 - startSec13),
        );
      return {
        sourceKey: sourceKey14,
        src: sourceKey14,
        startSec: startSec13,
        endSec: endSec10,
        durationSec: roundSec(endSec10 - startSec13),
        timelineStartSec: timelineStartSec11,
        timelineEndSec: timelineEndSec5,
        laneIndex: normalizeMediaClipAudioLaneIndex(el3.laneIndex),
        ...(el3.volume !== undefined && el3.volume !== 1
          ? { volume: Math.max(0, Math.min(1, toNumber(el3.volume, 1))) }
          : {}),
      };
    })
    .filter(Boolean);
}
function sumMediaClipExportClipDuration(list40 = []) {
  return roundSec(
    list40.reduce(
      (item22, value108) => item22 + Math.max(0, roundSec(value108.endSec) - roundSec(value108.startSec)),
      0,
    ),
  );
}
export function buildMediaClipExportSignature({
  videoSourceKey: videoSourceKey = '',
  audioSourceKey: audioSourceKey = '',
  videoTrack: videoTrack = null,
  audioTrack: audioTrack = null,
  videoClips: videoClips = null,
  audioClips: audioClips = null,
} = {}) {
  const list41 = [MEDIA_CLIP_EXPORT_SIGNATURE_VERSION],
    list42 = normalizeMediaClipExportVideoClips(videoClips),
    list43 = normalizeMediaClipExportAudioClips(audioClips);
  if (list42.length)
    list42.forEach((item23) => {
      list41.push('v:' + item23.sourceKey + ':' + roundSec(item23.startSec) + ':' + roundSec(item23.endSec));
    });
  else
    videoTrack &&
      videoSourceKey &&
      list41.push(
        'v:' + videoSourceKey + ':' + roundSec(videoTrack.startSec) + ':' + roundSec(videoTrack.endSec),
      );
  if (list43.length)
    list43.forEach((item24) => {
      list41.push(
        'a:' +
          item24.sourceKey +
          ':' +
          roundSec(item24.startSec) +
          ':' +
          roundSec(item24.endSec) +
          ':' +
          roundSec(item24.timelineStartSec) +
          ':' +
          roundSec(item24.timelineEndSec) +
          (item24.volume !== undefined ? ':volume=' + item24.volume : ''),
      );
    });
  else
    audioTrack &&
      audioSourceKey &&
      list41.push(
        'a:' + audioSourceKey + ':' + roundSec(audioTrack.startSec) + ':' + roundSec(audioTrack.endSec),
      );
  return list41.join('|');
}
export function buildMediaClipExportPayload({
  videoSource: videoSource = null,
  audioSource: audioSource = null,
  videoTrack: videoTrack = null,
  audioTrack: audioTrack = null,
  videoClips: videoClips = null,
  audioClips: audioClips = null,
} = {}) {
  const videoClips2 = Array.isArray(videoClips) && videoClips.length > 0,
    audioClips4 = Array.isArray(audioClips),
    audioTrack2 = audioClips4 ? null : audioTrack,
    sourceKey15 =
      normalizeText(videoTrack?.sourceKey) || (videoTrack ? resolveMediaClipSourceKey(videoSource) : ''),
    sourceKey16 =
      normalizeText(audioTrack2?.sourceKey) || (audioTrack2 ? resolveMediaClipSourceKey(audioSource) : ''),
    timeline = buildMediaClipTimelineManifest({
      videoClips: videoClips2 ? videoClips : null,
      audioClips: audioClips4 ? audioClips : null,
      videoTrack:
        !videoClips2 && videoTrack && sourceKey15 ? { ...videoTrack, sourceKey: sourceKey15 } : null,
      audioTrack:
        !audioClips4 && audioTrack2 && sourceKey16 ? { ...audioTrack2, sourceKey: sourceKey16 } : null,
    }),
    timelineValidation = validateMediaClipTimelineManifest(timeline);
  if (!timelineValidation.ok) return null;
  const args23 = { timeline: timeline, timelineValidation: timelineValidation },
    list44 = videoClips2
      ? getMediaClipTimelineExportClips(timeline, { kind: 'visual' })
      : normalizeMediaClipExportVideoClips(videoClips),
    list45 = audioClips4
      ? getMediaClipTimelineExportClips(timeline, { kind: 'audio' })
      : normalizeMediaClipExportAudioClips(audioClips),
    audioClips5 = list45.map((src) => ({
      src: src.sourceKey,
      sourceKey: src.sourceKey,
      start: roundSec(src.startSec),
      end: roundSec(src.endSec),
      timelineStart: roundSec(src.timelineStartSec),
      timelineEnd: roundSec(src.timelineEndSec),
      laneIndex: normalizeMediaClipAudioLaneIndex(src.laneIndex),
      ...(src.volume !== undefined && src.volume !== 1 ? { volume: src.volume } : {}),
    })),
    videoClips3 = list44.length > 1 || list44.some((item25) => item25.kind === 'image'),
    value109 = list44.find((item26) => item26.kind === 'video') || list44[0] || null,
    videoTrack2 = list44.length === 1 ? list44[0] : null,
    videoSourceKey2 = value109?.sourceKey || sourceKey15,
    audioSourceKey2 = sourceKey16,
    signature = buildMediaClipExportSignature({
      videoSourceKey: videoSourceKey2,
      audioSourceKey: audioSourceKey2,
      videoTrack: videoTrack2 || videoTrack,
      audioTrack: audioTrack2,
      videoClips: videoClips3 ? list44 : null,
      audioClips: audioClips4 ? list45 : null,
    });
  if (videoClips3 && videoSourceKey2) {
    const duration = sumMediaClipExportClipDuration(list44),
      clips4 = list44.map((src2) => ({
        src: src2.sourceKey,
        sourceKey: src2.sourceKey,
        kind: src2.kind,
        start: roundSec(src2.startSec),
        end: roundSec(src2.endSec),
      }));
    return {
      outputType: 'video',
      signature: signature,
      ...args23,
      electronPayload: {
        kind: 'mediaClipExport',
        src: videoSourceKey2,
        args: {
          clips: clips4,
          duration: duration,
          ...(audioClips5.length ? { audioClips: audioClips5 } : {}),
          ...(audioTrack2 && audioSourceKey2
            ? {
                audioSrc: audioSourceKey2,
                audioStart: roundSec(audioTrack2.startSec),
                audioEnd: roundSec(audioTrack2.endSec),
              }
            : {}),
        },
      },
      backendBody: {
        src: videoSourceKey2,
        clips: clips4,
        duration: duration,
        ...(audioClips5.length ? { audioClips: audioClips5 } : {}),
        ...(audioTrack2 && audioSourceKey2
          ? {
              audioSrc: audioSourceKey2,
              audioStart: roundSec(audioTrack2.startSec),
              audioEnd: roundSec(audioTrack2.endSec),
            }
          : {}),
      },
    };
  }
  const value110 = videoTrack2 || videoTrack,
    src3 = videoTrack2?.sourceKey || videoSourceKey2;
  if (value110 && src3)
    return {
      outputType: 'video',
      signature: signature,
      ...args23,
      electronPayload: {
        kind: 'mediaClipExport',
        src: src3,
        args: {
          videoStart: roundSec(value110.startSec),
          videoEnd: roundSec(value110.endSec),
          ...(audioClips5.length ? { audioClips: audioClips5 } : {}),
          ...(audioTrack2 && audioSourceKey2
            ? {
                audioSrc: audioSourceKey2,
                audioStart: roundSec(audioTrack2.startSec),
                audioEnd: roundSec(audioTrack2.endSec),
              }
            : {}),
        },
      },
      backendBody: {
        src: src3,
        start: roundSec(value110.startSec),
        end: roundSec(value110.endSec),
        ...(audioClips5.length ? { audioClips: audioClips5 } : {}),
        ...(audioTrack2 && audioSourceKey2
          ? {
              audioSrc: audioSourceKey2,
              audioStart: roundSec(audioTrack2.startSec),
              audioEnd: roundSec(audioTrack2.endSec),
            }
          : {}),
      },
    };
  if (audioTrack2 && audioSourceKey2)
    return {
      outputType: 'audio',
      signature: signature,
      ...args23,
      electronPayload: {
        kind: 'audioCut',
        src: audioSourceKey2,
        args: { start: roundSec(audioTrack2.startSec), end: roundSec(audioTrack2.endSec) },
      },
      backendBody: {
        src: audioSourceKey2,
        start: roundSec(audioTrack2.startSec),
        end: roundSec(audioTrack2.endSec),
      },
    };
  return null;
}
