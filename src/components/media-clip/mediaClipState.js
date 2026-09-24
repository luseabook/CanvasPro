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
function normalizeText(_0x12a8de) {
  return String(_0x12a8de || '').trim();
}
function toNumber(_0x55082d, _0x113737 = 0) {
  const _0x258db7 = Number(_0x55082d);
  return Number.isFinite(_0x258db7) ? _0x258db7 : _0x113737;
}
function roundSec(_0x2d776e) {
  return Math.round(Math.max(0, toNumber(_0x2d776e, 0)) * 0x3e8) / 0x3e8;
}
function roundSignedSec(_0x2bf049) {
  return Math.round(toNumber(_0x2bf049, 0) * 0x3e8) / 0x3e8;
}
function clampNumber(_0xfcde34, _0x55b9ad, _0x5421f0, _0x41bd44) {
  const _0x18522b = toNumber(_0xfcde34, _0x41bd44);
  return Math.max(_0x55b9ad, Math.min(_0x5421f0, _0x18522b));
}
export function normalizeMediaClipAudioLaneIndex(_0x1c52c0) {
  const _0x1d0676 = Math.trunc(toNumber(_0x1c52c0, 0));
  return Math.max(0, Math.min(MEDIA_CLIP_AUDIO_LANE_COUNT_MAX - 1, _0x1d0676));
}
function roundTimelineZoom(_0x3554ba) {
  return Math.round(_0x3554ba * 0x3e8) / 0x3e8;
}
export function normalizeMediaClipTimelineView(_0x19344b = {}) {
  const _0x42f57e = _0x19344b && typeof _0x19344b === 'object' ? _0x19344b : {};
  return {
    zoom: roundTimelineZoom(
      clampNumber(_0x42f57e.zoom, MEDIA_CLIP_TIMELINE_ZOOM_MIN, MEDIA_CLIP_TIMELINE_ZOOM_MAX, 1),
    ),
    scrollLeft: Math.max(0, Math.round(toNumber(_0x42f57e.scrollLeft, 0))),
  };
}
function firstNonEmpty(..._0x2e30ee) {
  for (const _0x2ce718 of _0x2e30ee) {
    const _0x3cbf96 = normalizeText(_0x2ce718);
    if (_0x3cbf96) return _0x3cbf96;
  }
  return '';
}
function normalizeSourceList(_0x510d05) {
  if (Array.isArray(_0x510d05))
    return _0x510d05.filter((_0x4bf1fc) => _0x4bf1fc && typeof _0x4bf1fc === 'object');
  return _0x510d05 && typeof _0x510d05 === 'object' ? [_0x510d05] : [];
}
function getSourceDataCandidates(_0x5127d0 = {}) {
  if (!_0x5127d0 || typeof _0x5127d0 !== 'object') return [];
  const _0x24a185 = [],
    _0x3c4bfb = (_0x46e996) => {
      if (!_0x46e996 || typeof _0x46e996 !== 'object') return;
      if (_0x24a185.includes(_0x46e996)) return;
      _0x24a185.push(_0x46e996);
    };
  return (
    _0x3c4bfb(_0x5127d0),
    _0x3c4bfb(_0x5127d0.nodeData),
    _0x3c4bfb(_0x5127d0.data),
    _0x3c4bfb(_0x5127d0._data),
    _0x24a185
  );
}
function resolveDirectSourceKey(_0x44c658 = {}) {
  if (!_0x44c658 || typeof _0x44c658 !== 'object') return '';
  for (const _0x31fddc of getSourceDataCandidates(_0x44c658)) {
    const _0x3994f6 = firstNonEmpty(
      _0x31fddc.localPath,
      _0x31fddc.originalLocalPath,
      _0x31fddc.displayLocalPath,
      _0x31fddc.videoLocalPath,
      _0x31fddc.audioLocalPath,
      _0x31fddc.imageUrl,
      _0x31fddc.thumbUrl,
      _0x31fddc.videoUrl,
      _0x31fddc.audioUrl,
      _0x31fddc.src,
      _0x31fddc.url,
      _0x31fddc.resultUrl,
      _0x31fddc.sourceUrl,
    );
    if (_0x3994f6) return _0x3994f6;
  }
  return '';
}
function isUnavailableVideoRecord(_0x3c7e20 = {}) {
  const _0x514dcd = resolveDirectSourceKey(_0x3c7e20);
  if (!_0x514dcd) return false;
  return getSourceDataCandidates(_0x3c7e20).some(
    (_0x13380e) =>
      _0x13380e?.mediaUnavailable === true && normalizeText(_0x13380e?.mediaUnavailableSource) === _0x514dcd,
  );
}
function resolveVideoRecord(_0x2be869 = {}) {
  for (const _0x1ad20b of getSourceDataCandidates(_0x2be869)) {
    const _0x2955de = Array.isArray(_0x1ad20b.videos) ? _0x1ad20b.videos : [],
      _0x610503 = Number(_0x1ad20b.mainVideoIndex),
      _0x1ba5b7 = Number.isFinite(_0x610503) ? Math.max(0, Math.trunc(_0x610503)) : 0,
      _0x2f60b8 = _0x2955de[_0x1ba5b7] || null;
    if (resolveDirectSourceKey(_0x2f60b8) && !isUnavailableVideoRecord(_0x2f60b8)) return _0x2f60b8;
    const _0x2cd952 = _0x2955de.find(
      (_0xfb2ba3) => resolveDirectSourceKey(_0xfb2ba3) && !isUnavailableVideoRecord(_0xfb2ba3),
    );
    if (_0x2cd952) return _0x2cd952;
  }
  return null;
}
export function isMediaClipNodeType(_0x30b095) {
  return normalizeText(_0x30b095) === MEDIA_CLIP_NODE_TYPE;
}
export function getMediaClipInputKind(_0x357350 = {}) {
  for (const _0x39b3d2 of getSourceDataCandidates(_0x357350)) {
    const _0x517f92 = normalizeText(_0x39b3d2?.type);
    if (VIDEO_NODE_TYPES.has(_0x517f92)) return 'video';
    if (IMAGE_NODE_TYPES.has(_0x517f92)) return 'image';
    if (AUDIO_NODE_TYPES.has(_0x517f92)) return 'audio';
  }
  return '';
}
export function isSupportedMediaClipInput(_0x434026 = {}) {
  const _0x2d599b = getMediaClipInputKind(_0x434026);
  if (!_0x2d599b) return false;
  return !!resolveMediaClipSourceKey(_0x434026);
}
export function resolveMediaClipSourceKey(_0x1f78a9 = {}) {
  if (!_0x1f78a9 || typeof _0x1f78a9 !== 'object') return '';
  const _0x2d9933 = resolveVideoRecord(_0x1f78a9);
  if (_0x2d9933 && _0x2d9933 !== _0x1f78a9) {
    const _0x4ba225 = resolveDirectSourceKey(_0x2d9933);
    if (_0x4ba225) return _0x4ba225;
  }
  if (isUnavailableVideoRecord(_0x1f78a9)) return '';
  return resolveDirectSourceKey(_0x1f78a9);
}
export function resolveMediaClipDurationSec(_0x1aa9a7 = {}, _0x46fd04 = '') {
  if (!_0x1aa9a7 || typeof _0x1aa9a7 !== 'object') return 0;
  const _0x59d799 = _0x46fd04 === 'video' ? resolveVideoRecord(_0x1aa9a7) : null;
  if (_0x59d799 && _0x59d799 !== _0x1aa9a7) {
    const _0x58f7cb = resolveMediaClipDurationSec(_0x59d799, _0x46fd04);
    if (_0x58f7cb > 0) return _0x58f7cb;
  }
  let _0x334d35 = '';
  for (const _0x3c2c9f of getSourceDataCandidates(_0x1aa9a7)) {
    _0x334d35 = firstNonEmpty(
      _0x3c2c9f.durationSec,
      _0x3c2c9f.videoDuration,
      _0x3c2c9f.audioDuration,
      _0x3c2c9f.duration,
      _0x3c2c9f.mediaDuration,
    );
    if (_0x334d35) break;
  }
  const _0x591ffc = Math.max(0, toNumber(_0x334d35, 0));
  if (_0x591ffc > 0) return _0x591ffc;
  return _0x46fd04 === 'image' ? MEDIA_CLIP_IMAGE_DEFAULT_DURATION_SEC : 0;
}
export function resolveMediaClipDimensions(_0x5c4d89 = {}) {
  const _0x127a51 = resolveVideoRecord(_0x5c4d89);
  let _0x3cf2a0 = getSourceDataCandidates(_0x127a51 || _0x5c4d89 || {})[0] || {};
  for (const _0x304b96 of getSourceDataCandidates(_0x127a51 || _0x5c4d89 || {})) {
    const _0x1ccd1c = firstNonEmpty(_0x304b96.videoWidth, _0x304b96.width, _0x304b96.naturalWidth),
      _0x7a93f5 = firstNonEmpty(_0x304b96.videoHeight, _0x304b96.height, _0x304b96.naturalHeight);
    if (_0x1ccd1c || _0x7a93f5) {
      _0x3cf2a0 = _0x304b96;
      break;
    }
  }
  const _0x4a920a = Math.round(
      toNumber(_0x3cf2a0.videoWidth ?? _0x3cf2a0.width ?? _0x3cf2a0.naturalWidth, 0),
    ),
    _0xdc5cb2 = Math.round(toNumber(_0x3cf2a0.videoHeight ?? _0x3cf2a0.height ?? _0x3cf2a0.naturalHeight, 0));
  return { width: _0x4a920a > 0 ? _0x4a920a : 0x500, height: _0xdc5cb2 > 0 ? _0xdc5cb2 : 0x2d0 };
}
export function clampMediaClipRange(_0x2f8aa1 = {}, _0x3b3438 = 0) {
  const _0x4eec04 = Math.max(0, toNumber(_0x3b3438, 0)),
    _0x4b4ce8 =
      _0x4eec04 > 0 ? _0x4eec04 : Math.max(MIN_RANGE_SEC, toNumber(_0x2f8aa1.endSec, MIN_RANGE_SEC));
  let _0x3d942e = roundSec(_0x2f8aa1.startSec),
    _0x20382d = roundSec(_0x2f8aa1.endSec ?? _0x4b4ce8);
  return (
    _0x4eec04 > 0
      ? ((_0x3d942e = Math.min(_0x3d942e, Math.max(0, _0x4eec04 - MIN_RANGE_SEC))),
        (_0x20382d = Math.min(Math.max(_0x20382d, _0x3d942e + MIN_RANGE_SEC), _0x4eec04)))
      : (_0x20382d = Math.max(_0x20382d, _0x3d942e + MIN_RANGE_SEC)),
    !(_0x20382d > _0x3d942e) &&
      (_0x20382d =
        _0x4eec04 > 0 ? Math.min(_0x4eec04, _0x3d942e + MIN_RANGE_SEC) : _0x3d942e + MIN_RANGE_SEC),
    {
      startSec: roundSec(_0x3d942e),
      endSec: roundSec(_0x20382d),
      durationSec: roundSec(_0x4eec04 || _0x20382d),
    }
  );
}
function readStoryImageHoldDuration(track, sourceKey, kind) {
  const value = track?.storyImageDurationSec;
  return kind === 'image' && normalizeText(track?.sourceKey) === sourceKey &&
    Number.isFinite(value) && value >= 0.1 && value <= 3600 ? value : 0;
}
function normalizeTrack(_0x18efdb = {}, _0x52f77c = null, _0x357823 = '') {
  if (!_0x52f77c) return null;
  const _0x1c21e6 = _0x18efdb && typeof _0x18efdb === 'object' ? _0x18efdb : {},
    _0x3505b0 = resolveMediaClipSourceKey(_0x52f77c);
  if (!_0x3505b0) return null;
  const _0x1abaf4 = readStoryImageHoldDuration(_0x1c21e6, _0x3505b0, _0x357823) || resolveMediaClipDurationSec(_0x52f77c, _0x357823),
    _0x55dd42 = normalizeText(_0x1c21e6.sourceKey) !== _0x3505b0,
    _0x14935e = _0x55dd42
      ? { startSec: 0, endSec: _0x1abaf4 || _0x1c21e6.endSec || MIN_RANGE_SEC }
      : _0x1c21e6,
    _0x4db40e = clampMediaClipRange(_0x14935e, _0x1abaf4);
  return {
    sourceKey: _0x3505b0,
    startSec: _0x4db40e.startSec,
    endSec: _0x4db40e.endSec,
    durationSec: _0x4db40e.durationSec,
  };
}
function getMediaClipSourceId(_0x58d7d1 = {}) {
  return firstNonEmpty(_0x58d7d1?.id, _0x58d7d1?.nodeId, _0x58d7d1?.sourceId);
}
function getMediaClipClipId(_0x10ea3e = {}, _0xfb60d = 0, _0x8efcd0 = '') {
  return firstNonEmpty(
    _0x10ea3e?.clipId,
    _0x10ea3e?.__mediaClipClipId,
    _0x10ea3e?.__mediaClipEdgeId,
    _0x10ea3e?.edgeId,
    _0x8efcd0 ? 'media:' + _0x8efcd0 + ':' + _0xfb60d : '',
    getMediaClipSourceId(_0x10ea3e) ? 'node:' + getMediaClipSourceId(_0x10ea3e) + ':' + _0xfb60d : '',
    'clip:' + _0xfb60d,
  );
}
function recomputeVideoClipTimeline(_0x2d71aa = []) {
  let _0x123018 = 0;
  return _0x2d71aa
    .map((_0x3568cc, _0x41a7c0) => {
      if (!_0x3568cc || typeof _0x3568cc !== 'object') return null;
      const _0x4d8397 = normalizeText(_0x3568cc.sourceKey);
      if (!_0x4d8397) return null;
      const _0x42189f = clampMediaClipRange(_0x3568cc, _0x3568cc.durationSec),
        _0x1e59eb = roundSec(Math.max(MIN_RANGE_SEC, _0x42189f.endSec - _0x42189f.startSec)),
        _0x7dfbba = roundSec(_0x123018),
        _0x252865 = roundSec(_0x7dfbba + _0x1e59eb),
        _0x8c259 = {
          ..._0x3568cc,
          id: normalizeText(_0x3568cc.id) || 'clip:' + _0x41a7c0,
          sourceKey: _0x4d8397,
          startSec: _0x42189f.startSec,
          endSec: _0x42189f.endSec,
          durationSec: _0x42189f.durationSec,
          timelineStartSec: _0x7dfbba,
          timelineEndSec: _0x252865,
        };
      return ((_0x123018 = _0x252865), _0x8c259);
    })
    .filter(Boolean);
}
function normalizeAudioClipTimeline(_0x12e625 = []) {
  return _0x12e625
    .map((_0x1ab49d, _0x1392da) => {
      if (!_0x1ab49d || typeof _0x1ab49d !== 'object') return null;
      const _0x17ec9b = normalizeText(_0x1ab49d.sourceKey);
      if (!_0x17ec9b) return null;
      const _0x2fee29 = clampMediaClipRange(_0x1ab49d, _0x1ab49d.durationSec),
        _0x4db736 = roundSec(Math.max(MIN_RANGE_SEC, _0x2fee29.endSec - _0x2fee29.startSec)),
        _0x3f2e28 = Number.isFinite(Number(_0x1ab49d.timelineStartSec)),
        _0x5bd53a = roundSec(_0x3f2e28 ? _0x1ab49d.timelineStartSec : 0);
      return {
        ..._0x1ab49d,
        id: normalizeText(_0x1ab49d.id) || 'audio:' + _0x1392da,
        kind: 'audio',
        sourceKey: _0x17ec9b,
        startSec: _0x2fee29.startSec,
        endSec: _0x2fee29.endSec,
        durationSec: _0x2fee29.durationSec,
        timelineStartSec: _0x5bd53a,
        timelineEndSec: roundSec(_0x5bd53a + _0x4db736),
        laneIndex: normalizeMediaClipAudioLaneIndex(_0x1ab49d.laneIndex),
        muted: _0x1ab49d.muted === true,
        disabled: _0x1ab49d.disabled === true,
      };
    })
    .filter(Boolean);
}
function normalizeVideoClips(_0x5d42db = {}, _0xbbf7b9 = []) {
  const _0x764d5d = normalizeSourceList(_0xbbf7b9),
    _0x1d0e4c = Array.isArray(_0x5d42db.clips) ? _0x5d42db.clips : [],
    _0x3915cd = new Set(),
    _0x3b4651 = (_0x5ba621, _0x59e62e, _0x5c6cfc) => {
      const _0x1c808f = normalizeText(_0x5ba621),
        _0x6b5026 = normalizeText(_0x59e62e),
        _0x534506 = normalizeText(_0x5c6cfc),
        _0x2624f2 = _0x1d0e4c
          .map((_0x7e05, _0x1b6d81) => ({ clip: _0x7e05, index: _0x1b6d81 }))
          .filter(
            ({ clip: _0x2cde59, index: _0x3f3a60 }) =>
              !_0x3915cd.has(_0x3f3a60) &&
              _0x1c808f &&
              (normalizeText(_0x2cde59?.id) === _0x1c808f ||
                normalizeText(_0x2cde59?.id).startsWith(_0x1c808f + ':split:')),
          );
      if (_0x2624f2.length)
        return (
          _0x2624f2.forEach(({ index: _0x42ed84 }) => _0x3915cd.add(_0x42ed84)),
          _0x2624f2.map(({ clip: _0x58915c }) => _0x58915c)
        );
      const _0xd19479 = _0x1d0e4c
        .map((_0x5ec02d, _0x3f25f5) => ({ clip: _0x5ec02d, index: _0x3f25f5 }))
        .filter(
          ({ clip: _0x719777, index: _0x2383cd }) =>
            !_0x3915cd.has(_0x2383cd) && _0x6b5026 && normalizeText(_0x719777?.sourceId) === _0x6b5026,
        );
      if (_0xd19479.length)
        return (
          _0xd19479.forEach(({ index: _0x521b52 }) => _0x3915cd.add(_0x521b52)),
          _0xd19479.map(({ clip: _0x52f936 }) => _0x52f936)
        );
      const _0x30890c = _0x1d0e4c
        .map((_0x5741e2, _0x43e891) => ({ clip: _0x5741e2, index: _0x43e891 }))
        .filter(
          ({ clip: _0x2603e0, index: _0x18ad6b }) =>
            !_0x3915cd.has(_0x18ad6b) && _0x534506 && normalizeText(_0x2603e0?.sourceKey) === _0x534506,
        );
      if (_0x30890c.length)
        return (
          _0x30890c.forEach(({ index: _0x43ee74 }) => _0x3915cd.add(_0x43ee74)),
          _0x30890c.map(({ clip: _0x582ee5 }) => _0x582ee5)
        );
      return [];
    },
    _0x2150cb = [];
  return (
    _0x764d5d.forEach((_0x269b9a, _0x269190) => {
      const _0x325434 = resolveMediaClipSourceKey(_0x269b9a);
      if (!_0x325434) return;
      const _0x5b1645 = getMediaClipInputKind(_0x269b9a) === 'image' ? 'image' : 'video',
        _0x52fd80 = getMediaClipSourceId(_0x269b9a),
        _0x59afdf = getMediaClipClipId(_0x269b9a, _0x269190, _0x325434),
        _0xbff22f = _0x3b4651(_0x59afdf, _0x52fd80, _0x325434),
        _0x12593c = _0x764d5d.length === 1 ? _0x5d42db.tracks?.video : null,
        _0x1aca93 = _0xbff22f.length ? _0xbff22f : [_0x12593c];
      _0x1aca93.forEach((_0x2051e1, _0x4ca530) => {
        const _0x305669 = getMediaClipInputKind(_0x2051e1) === 'image' ? 'image' : '',
          _0x532520 = normalizeTrack(_0x2051e1, _0x269b9a, _0x305669 || _0x5b1645);
        if (!_0x532520) return;
        _0x2150cb.push({
          id:
            normalizeText(_0x2051e1?.id) || (_0x4ca530 === 0 ? _0x59afdf : _0x59afdf + ':clip:' + _0x4ca530),
          kind: _0x5b1645,
          sourceId: _0x52fd80,
          sourceKey: _0x325434,
          startSec: _0x532520.startSec,
          endSec: _0x532520.endSec,
          durationSec: _0x532520.durationSec,
          ...(readStoryImageHoldDuration(_0x2051e1, _0x325434, _0x5b1645) ? { storyImageDurationSec: _0x2051e1.storyImageDurationSec } : {}),
          timelineStartSec: _0x2051e1?.timelineStartSec,
          timelineEndSec: _0x2051e1?.timelineEndSec,
        });
      });
    }),
    recomputeVideoClipTimeline(_0x2150cb)
  );
}
function normalizeAudioClips(_0x49306a = {}, _0x3be2b1 = []) {
  const _0xa24ed6 = normalizeSourceList(_0x3be2b1),
    _0x310c29 = Array.isArray(_0x49306a.audioClips) ? _0x49306a.audioClips : [],
    _0x3e1184 =
      !_0x310c29.length && _0x49306a.tracks?.audio
        ? [
            {
              id: 'audio:0',
              kind: 'audio',
              sourceKey: _0x49306a.tracks.audio.sourceKey,
              startSec: _0x49306a.tracks.audio.startSec,
              endSec: _0x49306a.tracks.audio.endSec,
              durationSec: _0x49306a.tracks.audio.durationSec,
              timelineStartSec: _0x49306a.tracks.audio.startSec,
              timelineEndSec: _0x49306a.tracks.audio.endSec,
            },
          ]
        : [],
    _0x316e89 = _0x310c29.length ? _0x310c29 : _0x3e1184,
    _0x31c8ca = new Set(),
    _0x17fbb1 = (_0x549256, _0x293567, _0x307682) => {
      const _0x5beae7 = normalizeText(_0x549256),
        _0xfbf31a = normalizeText(_0x293567),
        _0x3ba97d = normalizeText(_0x307682),
        _0x2839f8 = _0x316e89
          .map((_0x9d33c, _0x53c232) => ({ clip: _0x9d33c, index: _0x53c232 }))
          .filter(
            ({ clip: _0x3bb492, index: _0x23f5ee }) =>
              !_0x31c8ca.has(_0x23f5ee) && _0x5beae7 && normalizeText(_0x3bb492?.id) === _0x5beae7,
          );
      if (_0x2839f8.length)
        return (
          _0x2839f8.forEach(({ index: _0x29e497 }) => _0x31c8ca.add(_0x29e497)),
          _0x2839f8.map(({ clip: _0x16dab6 }) => _0x16dab6)
        );
      const _0x9b8e79 = _0x316e89
        .map((_0x2380d9, _0x36fbe8) => ({ clip: _0x2380d9, index: _0x36fbe8 }))
        .filter(
          ({ clip: _0x56e1cb, index: _0x354fdc }) =>
            !_0x31c8ca.has(_0x354fdc) && _0xfbf31a && normalizeText(_0x56e1cb?.sourceId) === _0xfbf31a,
        );
      if (_0x9b8e79.length)
        return (
          _0x9b8e79.forEach(({ index: _0x564037 }) => _0x31c8ca.add(_0x564037)),
          _0x9b8e79.map(({ clip: _0x2f4d66 }) => _0x2f4d66)
        );
      const _0x5a4577 = _0x316e89
        .map((_0x5ae6fe, _0x130a08) => ({ clip: _0x5ae6fe, index: _0x130a08 }))
        .filter(
          ({ clip: _0xfbd5c6, index: _0x5e46a2 }) =>
            !_0x31c8ca.has(_0x5e46a2) && _0x3ba97d && normalizeText(_0xfbd5c6?.sourceKey) === _0x3ba97d,
        );
      if (_0x5a4577.length)
        return (
          _0x5a4577.forEach(({ index: _0x209d9b }) => _0x31c8ca.add(_0x209d9b)),
          _0x5a4577.map(({ clip: _0x14374a }) => _0x14374a)
        );
      return [];
    },
    _0x103d49 = [];
  let _0x3cdaa5 = _0x316e89.reduce(
    (_0x50e975, _0x7153c7) => Math.max(_0x50e975, toNumber(_0x7153c7?.timelineEndSec, 0)),
    0,
  );
  return (
    _0xa24ed6.forEach((_0x327c95, _0x23308a) => {
      const _0x3893dd = resolveMediaClipSourceKey(_0x327c95);
      if (!_0x3893dd) return;
      const _0x30ffdd = getMediaClipSourceId(_0x327c95),
        _0x4b54d1 = getMediaClipClipId(_0x327c95, _0x23308a, _0x3893dd),
        _0x5f0dc3 = _0x17fbb1(_0x4b54d1, _0x30ffdd, _0x3893dd),
        _0x5cc018 = _0xa24ed6.length === 1 ? _0x49306a.tracks?.audio : null,
        _0x543e74 = _0x5f0dc3.length ? _0x5f0dc3 : [_0x5cc018];
      _0x543e74.forEach((_0x2c962c, _0x22769e) => {
        const _0x52e0ca = normalizeTrack(_0x2c962c, _0x327c95, 'audio');
        if (!_0x52e0ca) return;
        const _0x30851a = roundSec(Math.max(MIN_RANGE_SEC, _0x52e0ca.endSec - _0x52e0ca.startSec)),
          _0x463876 = Number.isFinite(Number(_0x2c962c?.timelineStartSec)),
          _0x199a44 = roundSec(_0x463876 ? _0x2c962c.timelineStartSec : _0x3cdaa5),
          _0x4f7575 = roundSec(_0x199a44 + _0x30851a);
        (_0x103d49.push({
          id:
            normalizeText(_0x2c962c?.id) || (_0x22769e === 0 ? _0x4b54d1 : _0x4b54d1 + ':clip:' + _0x22769e),
          kind: 'audio',
          sourceId: _0x30ffdd,
          sourceKey: _0x3893dd,
          startSec: _0x52e0ca.startSec,
          endSec: _0x52e0ca.endSec,
          durationSec: _0x52e0ca.durationSec,
          timelineStartSec: _0x199a44,
          timelineEndSec: _0x4f7575,
          laneIndex: _0x2c962c?.laneIndex,
          muted: _0x2c962c?.muted === true,
          disabled: _0x2c962c?.disabled === true,
          ...(_0x2c962c?.volume !== undefined ? { volume: _0x2c962c.volume } : {}),
        }),
          (_0x3cdaa5 = Math.max(_0x3cdaa5, _0x4f7575)));
      });
    }),
    normalizeAudioClipTimeline(_0x103d49)
  );
}
function buildVideoTrackFromClips(_0x5852c2 = []) {
  if (!_0x5852c2.length) return null;
  const _0x383596 = roundSec(
    _0x5852c2.reduce((_0x2d3f07, _0x3ca783) => Math.max(_0x2d3f07, toNumber(_0x3ca783.timelineEndSec, 0)), 0),
  );
  if (_0x5852c2.length === 1) {
    const _0x4f92ff = _0x5852c2[0];
    return {
      sourceKey: _0x4f92ff.sourceKey,
      startSec: _0x4f92ff.startSec,
      endSec: _0x4f92ff.endSec,
      durationSec: Math.max(toNumber(_0x4f92ff.durationSec, 0), _0x383596),
    };
  }
  return {
    sourceKey: _0x5852c2.map((_0x35473f) => _0x35473f.sourceKey).join('|'),
    startSec: 0,
    endSec: _0x383596,
    durationSec: _0x383596,
  };
}
function buildAudioTrackFromClips(_0x5ab0bf = []) {
  if (!_0x5ab0bf.length) return null;
  const _0x551f7f = roundSec(
    _0x5ab0bf.reduce((_0x30bbe8, _0x17b1a4) => Math.max(_0x30bbe8, toNumber(_0x17b1a4.timelineEndSec, 0)), 0),
  );
  if (_0x5ab0bf.length === 1) {
    const _0x44aa6d = _0x5ab0bf[0];
    return {
      sourceKey: _0x44aa6d.sourceKey,
      startSec: _0x44aa6d.startSec,
      endSec: _0x44aa6d.endSec,
      durationSec: Math.max(toNumber(_0x44aa6d.durationSec, 0), _0x551f7f),
    };
  }
  return {
    sourceKey: _0x5ab0bf.map((_0x3c4151) => _0x3c4151.sourceKey).join('|'),
    startSec: 0,
    endSec: _0x551f7f,
    durationSec: _0x551f7f,
  };
}
function buildMediaClipFromVideoClips(_0x114e17 = {}, _0x5c6cce = []) {
  const _0x3e6185 = recomputeVideoClipTimeline(_0x5c6cce);
  return {
    ..._0x114e17,
    activeTrack: 'video',
    clips: _0x3e6185,
    tracks: { ...(_0x114e17.tracks || {}), video: buildVideoTrackFromClips(_0x3e6185) },
  };
}
function buildMediaClipFromPositionedVideoClips(_0x2fb60f = {}, _0x5be3d2 = []) {
  const _0x24dbca = _0x5be3d2
    .map((_0x16129f, _0xc90d2b) => {
      if (!_0x16129f || typeof _0x16129f !== 'object') return null;
      const _0x34eec9 = normalizeText(_0x16129f.sourceKey);
      if (!_0x34eec9) return null;
      const _0xf3df7 = clampMediaClipRange(_0x16129f, _0x16129f.durationSec),
        _0x1b49f0 = roundSec(Math.max(MIN_RANGE_SEC, _0xf3df7.endSec - _0xf3df7.startSec)),
        _0x1c3474 = roundSignedSec(_0x16129f.timelineStartSec);
      return {
        ..._0x16129f,
        id: normalizeText(_0x16129f.id) || 'clip:' + _0xc90d2b,
        sourceKey: _0x34eec9,
        startSec: _0xf3df7.startSec,
        endSec: _0xf3df7.endSec,
        durationSec: _0xf3df7.durationSec,
        timelineStartSec: _0x1c3474,
        timelineEndSec: roundSignedSec(_0x1c3474 + _0x1b49f0),
      };
    })
    .filter(Boolean);
  return {
    ..._0x2fb60f,
    activeTrack: 'video',
    clips: _0x24dbca,
    tracks: { ...(_0x2fb60f.tracks || {}), video: buildVideoTrackFromClips(_0x24dbca) },
  };
}
function buildMediaClipFromAudioClips(_0x178045 = {}, _0xaaf364 = []) {
  const _0x39e5bd = normalizeAudioClipTimeline(_0xaaf364);
  return {
    ..._0x178045,
    activeTrack: 'audio',
    audioClips: _0x39e5bd,
    tracks: { ...(_0x178045.tracks || {}), audio: buildAudioTrackFromClips(_0x39e5bd) },
  };
}
export function patchMediaClipClipRange(_0x51a7b5 = {}, _0x548ec6 = 0, _0x24df11 = {}) {
  const _0x14f40e = Array.isArray(_0x51a7b5.clips) ? _0x51a7b5.clips : [],
    _0xec2124 = Math.max(0, Math.trunc(toNumber(_0x548ec6, 0))),
    _0x211093 = _0x14f40e[_0xec2124];
  if (!_0x211093) return _0x51a7b5;
  const _0x1e9474 = clampMediaClipRange({ ..._0x211093, ..._0x24df11 }, _0x211093.durationSec),
    _0x36e658 = _0x14f40e.map((_0x5d2831, _0x438beb) =>
      _0x438beb === _0xec2124
        ? {
            ..._0x5d2831,
            startSec: _0x1e9474.startSec,
            endSec: _0x1e9474.endSec,
            durationSec: _0x211093.durationSec,
          }
        : _0x5d2831,
    );
  return buildMediaClipFromVideoClips(_0x51a7b5, _0x36e658);
}
export function rollMediaClipVisualLeftTrim(_0x16377a = {}, _0x19b870 = 0, _0x38c6ce = {}, _0x48dd0c = {}) {
  const _0x485e18 = Array.isArray(_0x16377a.clips) ? _0x16377a.clips : [],
    _0x3bdd33 = Math.max(0, Math.trunc(toNumber(_0x19b870, 0))),
    _0x15fe61 = _0x485e18[_0x3bdd33],
    _0x53d60e = _0x485e18[_0x3bdd33 - 1];
  if (!_0x15fe61) return _0x16377a;
  if (!_0x53d60e || _0x3bdd33 <= 0) return patchMediaClipClipRange(_0x16377a, _0x3bdd33, _0x38c6ce);
  const _0x274e96 = clampMediaClipRange({ ..._0x15fe61, ..._0x38c6ce }, _0x15fe61.durationSec),
    _0x24b1b6 = roundSec(_0x15fe61.startSec),
    _0x56620b = roundSec(_0x15fe61.endSec),
    _0x572669 = roundSignedSec(
      _0x53d60e.timelineEndSec ??
        roundSignedSec(_0x53d60e.timelineStartSec) +
          Math.max(0, roundSec(_0x53d60e.endSec) - roundSec(_0x53d60e.startSec)),
    ),
    _0x50de0e = roundSignedSec(_0x274e96.startSec - _0x24b1b6),
    _0x2bf30a = -_0x24b1b6,
    _0x5a3876 = _0x56620b - MIN_RANGE_SEC - _0x24b1b6,
    _0x39eb7b = roundSignedSec(Math.max(_0x2bf30a, Math.min(_0x5a3876, _0x50de0e))),
    _0x4881a9 = roundSec(_0x24b1b6 + _0x39eb7b),
    _0x534b08 = roundSignedSec(_0x572669 + _0x39eb7b),
    _0x4f28f5 = (_0x5bc6be = {}) => {
      const _0x20842d = clampMediaClipRange(_0x5bc6be, _0x5bc6be.durationSec);
      return roundSec(Math.max(MIN_RANGE_SEC, _0x20842d.endSec - _0x20842d.startSec));
    };
  let _0x36fae4 = 0,
    _0x2cd5be = _0x485e18.map((_0x1e77d9, _0x17831d) => {
      if (_0x17831d < _0x3bdd33) {
        const _0x25d55d = {
          ..._0x1e77d9,
          timelineStartSec: roundSignedSec(toNumber(_0x1e77d9.timelineStartSec, 0) + _0x39eb7b),
          timelineEndSec: roundSignedSec(toNumber(_0x1e77d9.timelineEndSec, 0) + _0x39eb7b),
        };
        return ((_0x36fae4 = _0x25d55d.timelineEndSec), _0x25d55d);
      }
      if (_0x17831d === _0x3bdd33) {
        const _0x1e4803 = {
          ..._0x1e77d9,
          startSec: _0x4881a9,
          endSec: _0x56620b,
          durationSec: _0x15fe61.durationSec,
          timelineStartSec: _0x534b08,
          timelineEndSec: roundSignedSec(_0x534b08 + Math.max(MIN_RANGE_SEC, _0x56620b - _0x4881a9)),
        };
        return ((_0x36fae4 = _0x1e4803.timelineEndSec), _0x1e4803);
      }
      const _0x3a601b = _0x4f28f5(_0x1e77d9),
        _0x3247b0 = roundSignedSec(_0x36fae4),
        _0x962a7b = {
          ..._0x1e77d9,
          timelineStartSec: _0x3247b0,
          timelineEndSec: roundSignedSec(_0x3247b0 + _0x3a601b),
        };
      return ((_0x36fae4 = _0x962a7b.timelineEndSec), _0x962a7b);
    });
  if (_0x48dd0c.rebaseNegativeTimeline === true || _0x48dd0c.rebaseTimelineStart === true) {
    const _0x43bf8b = roundSignedSec(
      _0x2cd5be.reduce(
        (_0x369d54, _0x48acbd) => Math.min(_0x369d54, roundSignedSec(_0x48acbd?.timelineStartSec)),
        Number.POSITIVE_INFINITY,
      ),
    );
    if (
      Number.isFinite(_0x43bf8b) &&
      (_0x43bf8b < 0 || (_0x48dd0c.rebaseTimelineStart === true && Math.abs(_0x43bf8b) > 0.001))
    ) {
      const _0x22ed69 = -_0x43bf8b;
      _0x2cd5be = _0x2cd5be.map((_0x3eb045) => ({
        ..._0x3eb045,
        timelineStartSec: roundSignedSec(toNumber(_0x3eb045.timelineStartSec, 0) + _0x22ed69),
        timelineEndSec: roundSignedSec(toNumber(_0x3eb045.timelineEndSec, 0) + _0x22ed69),
      }));
    }
  }
  return buildMediaClipFromPositionedVideoClips(_0x16377a, _0x2cd5be);
}
export function patchMediaClipAudioClipRange(_0x44210c = {}, _0x428fa3 = 0, _0x1cd041 = {}) {
  const _0x430ed5 = Array.isArray(_0x44210c.audioClips) ? _0x44210c.audioClips : [],
    _0xe8cccd = Math.max(0, Math.trunc(toNumber(_0x428fa3, 0))),
    _0x4a4cdd = _0x430ed5[_0xe8cccd];
  if (!_0x4a4cdd) return _0x44210c;
  const _0x3a6e12 = clampMediaClipRange({ ..._0x4a4cdd, ..._0x1cd041 }, _0x4a4cdd.durationSec),
    _0x60be69 = roundSec(Math.max(MIN_RANGE_SEC, _0x3a6e12.endSec - _0x3a6e12.startSec)),
    _0x245d55 = Object.prototype.hasOwnProperty.call(_0x1cd041, 'startSec')
      ? _0x3a6e12.startSec - roundSec(_0x4a4cdd.startSec)
      : 0,
    _0x2ce1e7 = roundSec(Math.max(0, toNumber(_0x4a4cdd.timelineStartSec, 0) + _0x245d55)),
    _0x21fc41 = _0x430ed5.map((_0x5c86b1, _0x384d01) =>
      _0x384d01 === _0xe8cccd
        ? {
            ..._0x5c86b1,
            startSec: _0x3a6e12.startSec,
            endSec: _0x3a6e12.endSec,
            durationSec: _0x4a4cdd.durationSec,
            timelineStartSec: _0x2ce1e7,
            timelineEndSec: roundSec(_0x2ce1e7 + _0x60be69),
          }
        : _0x5c86b1,
    );
  return buildMediaClipFromAudioClips(_0x44210c, _0x21fc41);
}
export function shiftMediaClipClipRange(_0x2207c1 = {}, _0x1d6dc0 = 0, _0xda297f = 0) {
  const _0x2aa2dd = Array.isArray(_0x2207c1.clips) ? _0x2207c1.clips : [],
    _0x4001af = Math.max(0, Math.trunc(toNumber(_0x1d6dc0, 0))),
    _0x525520 = _0x2aa2dd[_0x4001af];
  if (!_0x525520) return _0x2207c1;
  const _0x1e0d18 = Math.max(0, toNumber(_0x525520.durationSec, 0)),
    _0x474efb = roundSec(_0x525520.startSec),
    _0x5a3579 = roundSec(_0x525520.endSec),
    _0x45c9c9 = Math.max(MIN_RANGE_SEC, _0x5a3579 - _0x474efb),
    _0x268b6a = toNumber(_0xda297f, 0),
    _0x4379a5 = _0x1e0d18 > 0 ? Math.max(0, _0x1e0d18 - _0x45c9c9) : _0x474efb + _0x268b6a,
    _0x59696b = roundSec(Math.max(0, Math.min(_0x4379a5, _0x474efb + _0x268b6a))),
    _0x17569e = roundSec(_0x1e0d18 > 0 ? Math.min(_0x1e0d18, _0x59696b + _0x45c9c9) : _0x59696b + _0x45c9c9);
  return patchMediaClipClipRange(_0x2207c1, _0x4001af, { startSec: _0x59696b, endSec: _0x17569e });
}
export function patchMediaClipAudioClipState(_0x50e07d = {}, _0x10b1c = 0, _0x100039 = {}) {
  const _0x31d469 = Array.isArray(_0x50e07d.audioClips) ? _0x50e07d.audioClips : [],
    _0x3a5318 = Math.max(0, Math.trunc(toNumber(_0x10b1c, 0))),
    _0x789a94 = _0x31d469[_0x3a5318];
  if (!_0x789a94) return _0x50e07d;
  const _0x1dfdd1 = _0x31d469.map((_0x1f41d0, _0x245d9b) => {
    if (_0x245d9b !== _0x3a5318) return _0x1f41d0;
    const _0x5d2e7e = { ..._0x1f41d0 };
    return (
      Object.prototype.hasOwnProperty.call(_0x100039, 'laneIndex') &&
        (_0x5d2e7e.laneIndex = normalizeMediaClipAudioLaneIndex(_0x100039.laneIndex)),
      Object.prototype.hasOwnProperty.call(_0x100039, 'muted') &&
        (_0x5d2e7e.muted = _0x100039.muted === true),
      Object.prototype.hasOwnProperty.call(_0x100039, 'disabled') &&
        (_0x5d2e7e.disabled = _0x100039.disabled === true),
      _0x5d2e7e
    );
  });
  return buildMediaClipFromAudioClips(_0x50e07d, _0x1dfdd1);
}
export function patchMediaClipAudioLaneMuted(_0x5cc928 = {}, _0x4748d2 = 0, _0x44f210 = false) {
  const _0x907320 = Array.isArray(_0x5cc928.audioClips) ? _0x5cc928.audioClips : [],
    _0x31e721 = normalizeMediaClipAudioLaneIndex(_0x4748d2);
  if (!_0x907320.some((_0x479caf) => normalizeMediaClipAudioLaneIndex(_0x479caf?.laneIndex) === _0x31e721))
    return _0x5cc928;
  const _0x1b3e43 = _0x907320.map((_0x271ad9) =>
    normalizeMediaClipAudioLaneIndex(_0x271ad9?.laneIndex) === _0x31e721
      ? { ..._0x271ad9, muted: _0x44f210 === true }
      : _0x271ad9,
  );
  return buildMediaClipFromAudioClips(_0x5cc928, _0x1b3e43);
}
export function moveMediaClipAudioClipOnTimeline(
  _0x909b21 = {},
  _0x261569 = 0,
  _0x238cd2 = 0,
  _0x5198a1 = {},
) {
  const _0x31f9cf = Array.isArray(_0x909b21.audioClips) ? _0x909b21.audioClips : [],
    _0x70d843 = Math.max(0, Math.trunc(toNumber(_0x261569, 0))),
    _0x2672e8 = _0x31f9cf[_0x70d843];
  if (!_0x2672e8) return _0x909b21;
  const _0x56825a = roundSec(_0x2672e8.timelineStartSec),
    _0x2c4620 = roundSec(_0x2672e8.timelineEndSec),
    _0x32730a = roundSec(Math.max(MIN_RANGE_SEC, _0x2c4620 - _0x56825a)),
    _0xc70f0f = roundSec(Math.max(0, _0x56825a + toNumber(_0x238cd2, 0))),
    _0x405542 = _0x31f9cf.map((_0x4044b5, _0x1df884) =>
      _0x1df884 === _0x70d843
        ? {
            ..._0x4044b5,
            timelineStartSec: _0xc70f0f,
            timelineEndSec: roundSec(_0xc70f0f + _0x32730a),
            ...(Object.prototype.hasOwnProperty.call(_0x5198a1, 'laneIndex')
              ? { laneIndex: normalizeMediaClipAudioLaneIndex(_0x5198a1.laneIndex) }
              : {}),
          }
        : _0x4044b5,
    );
  return buildMediaClipFromAudioClips(_0x909b21, _0x405542);
}
export function moveMediaClipClipOnTimeline(_0x252ec4 = {}, _0x3a87c3 = 0, _0x2d6b11 = 0) {
  const _0x5266b6 = Array.isArray(_0x252ec4.clips) ? _0x252ec4.clips : [],
    _0x1a3ed8 = Math.max(0, Math.trunc(toNumber(_0x3a87c3, 0))),
    _0x2a798a = _0x5266b6[_0x1a3ed8];
  if (!_0x2a798a) return _0x252ec4;
  const _0x1c54a9 = roundSec(_0x2a798a.timelineStartSec),
    _0x33b2ef = roundSec(_0x2a798a.timelineEndSec),
    _0x48420e = roundSec(Math.max(MIN_RANGE_SEC, _0x33b2ef - _0x1c54a9)),
    _0x34da86 = roundSec(_0x1c54a9 + toNumber(_0x2d6b11, 0) + _0x48420e / 2),
    _0x3c250b = _0x5266b6.filter((_0x3173ef, _0x3a17aa) => _0x3a17aa !== _0x1a3ed8),
    _0x2064fc = _0x3c250b.findIndex((_0x45889d) => {
      const _0x2b3afc = roundSec(_0x45889d.timelineStartSec),
        _0x5a9798 = roundSec(_0x45889d.timelineEndSec || _0x2b3afc),
        _0x408406 = roundSec(_0x2b3afc + Math.max(MIN_RANGE_SEC, _0x5a9798 - _0x2b3afc) / 2);
      return _0x34da86 < _0x408406;
    }),
    _0x1a5036 = [..._0x3c250b];
  return (
    _0x1a5036.splice(_0x2064fc >= 0 ? _0x2064fc : _0x1a5036.length, 0, _0x2a798a),
    buildMediaClipFromVideoClips(_0x252ec4, _0x1a5036)
  );
}
export function removeMediaClipAudioClip(_0x470a67 = {}, _0x38985f = 0) {
  const _0x3e8e19 = Array.isArray(_0x470a67.audioClips) ? _0x470a67.audioClips : [],
    _0x3dbe5b = Math.max(0, Math.trunc(toNumber(_0x38985f, 0)));
  if (!_0x3e8e19[_0x3dbe5b]) return _0x470a67;
  const _0x597f02 = _0x3e8e19.filter((_0x295c1b, _0x4ccb94) => _0x4ccb94 !== _0x3dbe5b);
  return buildMediaClipFromAudioClips(_0x470a67, _0x597f02);
}
export function removeMediaClipClip(_0x32903d = {}, _0x520f4a = 0) {
  const _0x425d6e = Array.isArray(_0x32903d.clips) ? _0x32903d.clips : [],
    _0x1e25fa = Math.max(0, Math.trunc(toNumber(_0x520f4a, 0)));
  if (!_0x425d6e[_0x1e25fa]) return _0x32903d;
  const _0x260264 = _0x425d6e.filter((_0x468ba3, _0xe0b345) => _0xe0b345 !== _0x1e25fa);
  return buildMediaClipFromVideoClips(_0x32903d, _0x260264);
}
export function splitMediaClipAtTimelineSec(_0x185346 = {}, _0x558f85 = 0, _0x37e319 = '') {
  const _0x2aa370 = Array.isArray(_0x185346.clips) ? _0x185346.clips : [];
  if (!_0x2aa370.length) return _0x185346;
  const _0x108cc6 = roundSec(_0x558f85),
    _0x9cb88a = _0x2aa370.findIndex((_0x1f877c) => {
      const _0x2c0779 = roundSec(_0x1f877c.timelineStartSec),
        _0x188bf1 = roundSec(_0x1f877c.timelineEndSec);
      return _0x108cc6 > _0x2c0779 + MIN_RANGE_SEC && _0x108cc6 < _0x188bf1 - MIN_RANGE_SEC;
    });
  if (_0x9cb88a < 0) return _0x185346;
  const _0x86eeb5 = _0x2aa370[_0x9cb88a],
    _0x3d40c2 = roundSec(_0x86eeb5.timelineStartSec),
    _0x463e32 = roundSec(_0x86eeb5.startSec),
    _0x4aa2dd = roundSec(_0x86eeb5.endSec),
    _0x187a41 = roundSec(_0x463e32 + (_0x108cc6 - _0x3d40c2));
  if (_0x187a41 <= _0x463e32 + MIN_RANGE_SEC || _0x187a41 >= _0x4aa2dd - MIN_RANGE_SEC) return _0x185346;
  const _0x19f42a = normalizeText(_0x37e319),
    _0x51710d =
      (normalizeText(_0x86eeb5.id) || 'clip:' + _0x9cb88a) +
      ':split:' +
      _0x187a41 +
      (_0x19f42a ? ':' + _0x19f42a : ''),
    _0x3568f4 = [
      ..._0x2aa370.slice(0, _0x9cb88a),
      { ..._0x86eeb5, endSec: _0x187a41, timelineStartSec: _0x3d40c2, timelineEndSec: _0x108cc6 },
      {
        ..._0x86eeb5,
        id: _0x51710d,
        startSec: _0x187a41,
        timelineStartSec: _0x108cc6,
        timelineEndSec: roundSec(_0x86eeb5.timelineEndSec || _0x3d40c2 + (_0x4aa2dd - _0x463e32)),
      },
      ..._0x2aa370.slice(_0x9cb88a + 1),
    ];
  return buildMediaClipFromVideoClips(_0x185346, _0x3568f4);
}
export function splitMediaClipAudioAtTimelineSec(_0x80c281 = {}, _0x31e151 = 0, _0x153b52 = '') {
  const _0x352e61 = Array.isArray(_0x80c281.audioClips) ? _0x80c281.audioClips : [];
  if (!_0x352e61.length) return _0x80c281;
  const _0x5a0512 = roundSec(_0x31e151),
    _0x295a77 = _0x352e61.findIndex((_0x1fab13) => {
      const _0x55148a = roundSec(_0x1fab13.timelineStartSec),
        _0x460d43 = roundSec(_0x1fab13.timelineEndSec);
      return _0x5a0512 > _0x55148a + MIN_RANGE_SEC && _0x5a0512 < _0x460d43 - MIN_RANGE_SEC;
    });
  if (_0x295a77 < 0) return _0x80c281;
  const _0x814cc6 = _0x352e61[_0x295a77],
    _0x540d43 = roundSec(_0x814cc6.timelineStartSec),
    _0x54995 = roundSec(_0x814cc6.startSec),
    _0x5b90a1 = roundSec(_0x814cc6.endSec),
    _0x33096e = roundSec(_0x54995 + (_0x5a0512 - _0x540d43));
  if (_0x33096e <= _0x54995 + MIN_RANGE_SEC || _0x33096e >= _0x5b90a1 - MIN_RANGE_SEC) return _0x80c281;
  const _0x41675b = normalizeText(_0x153b52),
    _0x806de0 =
      (normalizeText(_0x814cc6.id) || 'audio:' + _0x295a77) +
      ':split:' +
      _0x33096e +
      (_0x41675b ? ':' + _0x41675b : ''),
    _0x115664 = [
      ..._0x352e61.slice(0, _0x295a77),
      { ..._0x814cc6, endSec: _0x33096e, timelineStartSec: _0x540d43, timelineEndSec: _0x5a0512 },
      {
        ..._0x814cc6,
        id: _0x806de0,
        startSec: _0x33096e,
        timelineStartSec: _0x5a0512,
        timelineEndSec: roundSec(_0x814cc6.timelineEndSec || _0x540d43 + (_0x5b90a1 - _0x54995)),
      },
      ..._0x352e61.slice(_0x295a77 + 1),
    ];
  return buildMediaClipFromAudioClips(_0x80c281, _0x115664);
}
export function normalizeMediaClipState(_0x412f56 = {}, _0xc2cea6 = {}) {
  const _0x2fd97d = _0x412f56.mediaClip && typeof _0x412f56.mediaClip === 'object' ? _0x412f56.mediaClip : {},
    _0x12f4e2 = normalizeSourceList(_0xc2cea6.videos || _0xc2cea6.video),
    _0x45842d = normalizeSourceList(_0xc2cea6.audios || _0xc2cea6.audio),
    _0x4040ff = normalizeVideoClips(_0x2fd97d, _0x12f4e2),
    _0x3e5ff3 = buildVideoTrackFromClips(_0x4040ff),
    _0x38d90f = normalizeAudioClips(_0x2fd97d, _0x45842d),
    _0x27973b = buildAudioTrackFromClips(_0x38d90f);
  let _0x1f3b79 = _0x2fd97d.activeTrack === 'audio' ? 'audio' : 'video';
  if (_0x1f3b79 === 'video' && !_0x3e5ff3 && _0x27973b) _0x1f3b79 = 'audio';
  if (_0x1f3b79 === 'audio' && !_0x27973b && _0x3e5ff3) _0x1f3b79 = 'video';
  if (!_0x3e5ff3 && !_0x27973b) _0x1f3b79 = 'video';
  return {
    schemaVersion: MEDIA_CLIP_SCHEMA_VERSION,
    expanded: _0x2fd97d.expanded === true,
    activeTrack: _0x1f3b79,
    cropMode: _0x2fd97d.cropMode === true,
    timelineView: normalizeMediaClipTimelineView(_0x2fd97d.timelineView),
    clips: _0x4040ff,
    audioClips: _0x38d90f,
    tracks: { video: _0x3e5ff3, audio: _0x27973b },
    lastOutput:
      _0x2fd97d.lastOutput && typeof _0x2fd97d.lastOutput === 'object' ? { ..._0x2fd97d.lastOutput } : null,
  };
}
export function buildMediaClipIncomingSignature(_0x32ba73 = {}, _0x52994e = '') {
  const _0x9b1930 = normalizeText(_0x52994e);
  if (!_0x9b1930) return '';
  const _0x4e7f7b = _0x32ba73.nodes || {};
  return Object.values(_0x32ba73.edges || {})
    .filter((_0x2ec4ee) => normalizeText(_0x2ec4ee?.targetId) === _0x9b1930)
    .map((_0x10b72c) => {
      const _0xf57c99 = normalizeText(_0x10b72c?.sourceId),
        _0x57ab09 = _0x4e7f7b[_0xf57c99] || {},
        _0x237bb0 = getMediaClipInputKind(_0x57ab09),
        _0x59bad7 = resolveMediaClipSourceKey(_0x57ab09),
        _0x50f411 = _0x237bb0 ? resolveMediaClipDurationSec(_0x57ab09, _0x237bb0) : 0,
        _0x38cbaa = Number.isFinite(_0x57ab09?._bizRev) ? _0x57ab09._bizRev : 0;
      return [
        normalizeText(_0x10b72c?.id),
        _0xf57c99,
        _0x237bb0,
        _0x59bad7,
        roundSec(_0x50f411),
        _0x38cbaa,
      ].join(':');
    })
    .join('|');
}
export function patchMediaClipTrackRange(_0x4aaa3e = {}, _0x4e605d = 'video', _0x380c6e = {}) {
  const _0x241d0b = _0x4aaa3e?.tracks?.[_0x4e605d];
  if (!_0x241d0b) return _0x4aaa3e;
  const _0x4d857e = clampMediaClipRange({ ..._0x241d0b, ..._0x380c6e }, _0x241d0b.durationSec);
  return {
    ..._0x4aaa3e,
    activeTrack: _0x4e605d,
    tracks: { ...(_0x4aaa3e.tracks || {}), [_0x4e605d]: { ..._0x241d0b, ..._0x4d857e } },
  };
}
export function shiftMediaClipTrackRange(_0x3d0ef0 = {}, _0x5deda7 = 'video', _0x522177 = 0) {
  const _0x5a8226 = _0x3d0ef0?.tracks?.[_0x5deda7];
  if (!_0x5a8226) return _0x3d0ef0;
  const _0x450645 = Math.max(0, toNumber(_0x5a8226.durationSec, 0)),
    _0xa0ae1c = roundSec(_0x5a8226.startSec),
    _0x273bc2 = roundSec(_0x5a8226.endSec),
    _0x30700f = Math.max(MIN_RANGE_SEC, _0x273bc2 - _0xa0ae1c),
    _0x55aa99 = toNumber(_0x522177, 0),
    _0x509d4d = _0x450645 > 0 ? Math.max(0, _0x450645 - _0x30700f) : _0xa0ae1c + _0x55aa99,
    _0x2d62b5 = roundSec(Math.max(0, Math.min(_0x509d4d, _0xa0ae1c + _0x55aa99))),
    _0x3c29ff = roundSec(_0x450645 > 0 ? Math.min(_0x450645, _0x2d62b5 + _0x30700f) : _0x2d62b5 + _0x30700f);
  return patchMediaClipTrackRange(_0x3d0ef0, _0x5deda7, { startSec: _0x2d62b5, endSec: _0x3c29ff });
}
export function mapMediaClipVideoSecToAudioSec(_0x2dccc7 = 0, _0x497877 = null, _0x4ec28b = null) {
  if (!_0x497877 || !_0x4ec28b) return null;
  const _0x4d2c26 = roundSec(_0x497877.startSec),
    _0x7a3885 = roundSec(_0x4ec28b.startSec),
    _0x507d72 = roundSec(_0x4ec28b.endSec),
    _0x4d0ccf = Math.round((toNumber(_0x2dccc7, 0) - _0x4d2c26) * 0x3e8) / 0x3e8;
  if (_0x4d0ccf < 0 || !(_0x507d72 > _0x7a3885)) return null;
  const _0x4485ef = roundSec(_0x7a3885 + _0x4d0ccf);
  if (_0x4485ef > _0x507d72) return null;
  return Math.max(_0x7a3885, Math.min(_0x507d72, _0x4485ef));
}
function normalizeMediaClipExportVideoClips(_0xbf8852 = []) {
  if (!Array.isArray(_0xbf8852)) return [];
  return _0xbf8852
    .map((_0x584c33) => {
      if (!_0x584c33 || typeof _0x584c33 !== 'object') return null;
      const _0x30d0a9 = normalizeText(
        _0x584c33.sourceKey || _0x584c33.src || _0x584c33.localPath || _0x584c33.path,
      );
      if (!_0x30d0a9) return null;
      const _0x109d6e = roundSec(_0x584c33.startSec ?? _0x584c33.start ?? 0),
        _0x424b22 = Math.max(0, toNumber(_0x584c33.durationSec ?? _0x584c33.duration, 0)),
        _0x282325 = roundSec(
          _0x584c33.endSec ?? _0x584c33.end ?? (_0x424b22 > 0 ? _0x109d6e + _0x424b22 : _0x109d6e),
        );
      if (!(_0x282325 > _0x109d6e)) return null;
      return {
        sourceKey: _0x30d0a9,
        src: _0x30d0a9,
        kind: normalizeText(_0x584c33.kind) === 'image' ? 'image' : 'video',
        startSec: _0x109d6e,
        endSec: _0x282325,
        durationSec: roundSec(_0x282325 - _0x109d6e),
      };
    })
    .filter(Boolean);
}
function normalizeMediaClipExportAudioClips(_0x4e2ae1 = []) {
  if (!Array.isArray(_0x4e2ae1)) return [];
  return _0x4e2ae1
    .map((_0xc0223e) => {
      if (!_0xc0223e || typeof _0xc0223e !== 'object') return null;
      if (_0xc0223e.muted === true || _0xc0223e.disabled === true) return null;
      const _0x4a58bf = normalizeText(
        _0xc0223e.sourceKey || _0xc0223e.src || _0xc0223e.localPath || _0xc0223e.path,
      );
      if (!_0x4a58bf) return null;
      const _0x47b65b = roundSec(_0xc0223e.startSec ?? _0xc0223e.start ?? 0),
        _0x41854b = Math.max(0, toNumber(_0xc0223e.durationSec ?? _0xc0223e.duration, 0)),
        _0x217f2c = roundSec(
          _0xc0223e.endSec ?? _0xc0223e.end ?? (_0x41854b > 0 ? _0x47b65b + _0x41854b : _0x47b65b),
        );
      if (!(_0x217f2c > _0x47b65b)) return null;
      const _0x51ee39 = roundSec(_0xc0223e.timelineStartSec ?? _0xc0223e.timelineStart ?? 0),
        _0x505614 = roundSec(
          _0xc0223e.timelineEndSec ??
            _0xc0223e.timelineEnd ??
            _0x51ee39 + Math.max(MIN_RANGE_SEC, _0x217f2c - _0x47b65b),
        );
      return {
        sourceKey: _0x4a58bf,
        src: _0x4a58bf,
        startSec: _0x47b65b,
        endSec: _0x217f2c,
        durationSec: roundSec(_0x217f2c - _0x47b65b),
        timelineStartSec: _0x51ee39,
        timelineEndSec: _0x505614,
        laneIndex: normalizeMediaClipAudioLaneIndex(_0xc0223e.laneIndex),
        ...(_0xc0223e.volume !== undefined && _0xc0223e.volume !== 1 ? { volume: Math.max(0, Math.min(1, toNumber(_0xc0223e.volume, 1))) } : {}),
      };
    })
    .filter(Boolean);
}
function sumMediaClipExportClipDuration(_0x3bc529 = []) {
  return roundSec(
    _0x3bc529.reduce(
      (_0x3b19fa, _0x50cc17) =>
        _0x3b19fa + Math.max(0, roundSec(_0x50cc17.endSec) - roundSec(_0x50cc17.startSec)),
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
  const _0x255a27 = [MEDIA_CLIP_EXPORT_SIGNATURE_VERSION],
    _0x38072c = normalizeMediaClipExportVideoClips(videoClips),
    _0x4afce8 = normalizeMediaClipExportAudioClips(audioClips);
  if (_0x38072c.length)
    _0x38072c.forEach((_0x310597) => {
      _0x255a27.push(
        'v:' + _0x310597.sourceKey + ':' + roundSec(_0x310597.startSec) + ':' + roundSec(_0x310597.endSec),
      );
    });
  else
    videoTrack &&
      videoSourceKey &&
      _0x255a27.push(
        'v:' + videoSourceKey + ':' + roundSec(videoTrack.startSec) + ':' + roundSec(videoTrack.endSec),
      );
  if (_0x4afce8.length)
    _0x4afce8.forEach((_0x6e0c7e) => {
      _0x255a27.push(
        'a:' +
          _0x6e0c7e.sourceKey +
          ':' +
          roundSec(_0x6e0c7e.startSec) +
          ':' +
          roundSec(_0x6e0c7e.endSec) +
          ':' +
          roundSec(_0x6e0c7e.timelineStartSec) +
          ':' +
          roundSec(_0x6e0c7e.timelineEndSec) + (_0x6e0c7e.volume !== undefined ? ':volume=' + _0x6e0c7e.volume : ''),
      );
    });
  else
    audioTrack &&
      audioSourceKey &&
      _0x255a27.push(
        'a:' + audioSourceKey + ':' + roundSec(audioTrack.startSec) + ':' + roundSec(audioTrack.endSec),
      );
  return _0x255a27.join('|');
}
export function buildMediaClipExportPayload({
  videoSource: videoSource = null,
  audioSource: audioSource = null,
  videoTrack: videoTrack = null,
  audioTrack: audioTrack = null,
  videoClips: videoClips = null,
  audioClips: audioClips = null,
} = {}) {
  const _0x2c992a = Array.isArray(videoClips) && videoClips.length > 0,
    _0x249fc9 = Array.isArray(audioClips),
    _0x3d00db = _0x249fc9 ? null : audioTrack,
    _0x13d2e8 =
      normalizeText(videoTrack?.sourceKey) || (videoTrack ? resolveMediaClipSourceKey(videoSource) : ''),
    _0x511d3d =
      normalizeText(_0x3d00db?.sourceKey) || (_0x3d00db ? resolveMediaClipSourceKey(audioSource) : ''),
    _0x1ac01d = buildMediaClipTimelineManifest({
      videoClips: _0x2c992a ? videoClips : null,
      audioClips: _0x249fc9 ? audioClips : null,
      videoTrack: !_0x2c992a && videoTrack && _0x13d2e8 ? { ...videoTrack, sourceKey: _0x13d2e8 } : null,
      audioTrack: !_0x249fc9 && _0x3d00db && _0x511d3d ? { ..._0x3d00db, sourceKey: _0x511d3d } : null,
    }),
    _0x33e52e = validateMediaClipTimelineManifest(_0x1ac01d);
  if (!_0x33e52e.ok) return null;
  const _0x5e24c1 = { timeline: _0x1ac01d, timelineValidation: _0x33e52e },
    _0x22c255 = _0x2c992a
      ? getMediaClipTimelineExportClips(_0x1ac01d, { kind: 'visual' })
      : normalizeMediaClipExportVideoClips(videoClips),
    _0x4745f6 = _0x249fc9
      ? getMediaClipTimelineExportClips(_0x1ac01d, { kind: 'audio' })
      : normalizeMediaClipExportAudioClips(audioClips),
    _0x374011 = _0x4745f6.map((_0x4113d2) => ({
      src: _0x4113d2.sourceKey,
      sourceKey: _0x4113d2.sourceKey,
      start: roundSec(_0x4113d2.startSec),
      end: roundSec(_0x4113d2.endSec),
      timelineStart: roundSec(_0x4113d2.timelineStartSec),
      timelineEnd: roundSec(_0x4113d2.timelineEndSec),
      laneIndex: normalizeMediaClipAudioLaneIndex(_0x4113d2.laneIndex),
      ...(_0x4113d2.volume !== undefined && _0x4113d2.volume !== 1 ? { volume: _0x4113d2.volume } : {}),
    })),
    _0x2a0f78 = _0x22c255.length > 1 || _0x22c255.some((_0x48c9d7) => _0x48c9d7.kind === 'image'),
    _0x3c6f86 = _0x22c255.find((_0x3417e) => _0x3417e.kind === 'video') || _0x22c255[0] || null,
    _0xd568f8 = _0x22c255.length === 1 ? _0x22c255[0] : null,
    _0x5c6a5a = _0x3c6f86?.sourceKey || _0x13d2e8,
    _0xf22af4 = _0x511d3d,
    _0x582831 = buildMediaClipExportSignature({
      videoSourceKey: _0x5c6a5a,
      audioSourceKey: _0xf22af4,
      videoTrack: _0xd568f8 || videoTrack,
      audioTrack: _0x3d00db,
      videoClips: _0x2a0f78 ? _0x22c255 : null,
      audioClips: _0x249fc9 ? _0x4745f6 : null,
    });
  if (_0x2a0f78 && _0x5c6a5a) {
    const _0x37e27b = sumMediaClipExportClipDuration(_0x22c255),
      _0x414750 = _0x22c255.map((_0x3dddef) => ({
        src: _0x3dddef.sourceKey,
        sourceKey: _0x3dddef.sourceKey,
        kind: _0x3dddef.kind,
        start: roundSec(_0x3dddef.startSec),
        end: roundSec(_0x3dddef.endSec),
      }));
    return {
      outputType: 'video',
      signature: _0x582831,
      ..._0x5e24c1,
      electronPayload: {
        kind: 'mediaClipExport',
        src: _0x5c6a5a,
        args: {
          clips: _0x414750,
          duration: _0x37e27b,
          ...(_0x374011.length ? { audioClips: _0x374011 } : {}),
          ...(_0x3d00db && _0xf22af4
            ? {
                audioSrc: _0xf22af4,
                audioStart: roundSec(_0x3d00db.startSec),
                audioEnd: roundSec(_0x3d00db.endSec),
              }
            : {}),
        },
      },
      backendBody: {
        src: _0x5c6a5a,
        clips: _0x414750,
        duration: _0x37e27b,
        ...(_0x374011.length ? { audioClips: _0x374011 } : {}),
        ...(_0x3d00db && _0xf22af4
          ? {
              audioSrc: _0xf22af4,
              audioStart: roundSec(_0x3d00db.startSec),
              audioEnd: roundSec(_0x3d00db.endSec),
            }
          : {}),
      },
    };
  }
  const _0x28c01b = _0xd568f8 || videoTrack,
    _0xf51c9c = _0xd568f8?.sourceKey || _0x5c6a5a;
  if (_0x28c01b && _0xf51c9c)
    return {
      outputType: 'video',
      signature: _0x582831,
      ..._0x5e24c1,
      electronPayload: {
        kind: 'mediaClipExport',
        src: _0xf51c9c,
        args: {
          videoStart: roundSec(_0x28c01b.startSec),
          videoEnd: roundSec(_0x28c01b.endSec),
          ...(_0x374011.length ? { audioClips: _0x374011 } : {}),
          ...(_0x3d00db && _0xf22af4
            ? {
                audioSrc: _0xf22af4,
                audioStart: roundSec(_0x3d00db.startSec),
                audioEnd: roundSec(_0x3d00db.endSec),
              }
            : {}),
        },
      },
      backendBody: {
        src: _0xf51c9c,
        start: roundSec(_0x28c01b.startSec),
        end: roundSec(_0x28c01b.endSec),
        ...(_0x374011.length ? { audioClips: _0x374011 } : {}),
        ...(_0x3d00db && _0xf22af4
          ? {
              audioSrc: _0xf22af4,
              audioStart: roundSec(_0x3d00db.startSec),
              audioEnd: roundSec(_0x3d00db.endSec),
            }
          : {}),
      },
    };
  if (_0x3d00db && _0xf22af4)
    return {
      outputType: 'audio',
      signature: _0x582831,
      ..._0x5e24c1,
      electronPayload: {
        kind: 'audioCut',
        src: _0xf22af4,
        args: { start: roundSec(_0x3d00db.startSec), end: roundSec(_0x3d00db.endSec) },
      },
      backendBody: { src: _0xf22af4, start: roundSec(_0x3d00db.startSec), end: roundSec(_0x3d00db.endSec) },
    };
  return null;
}
