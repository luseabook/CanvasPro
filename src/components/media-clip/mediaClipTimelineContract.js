import { normalizeText, toNumber } from './mediaClipUtils.js';
export const MEDIA_CLIP_TIMELINE_SCHEMA_VERSION = 1;
export const MEDIA_CLIP_TIMELINE_AUDIO_LANE_COUNT_MAX = 3;
export const MEDIA_CLIP_TIMELINE_VISUAL_TRACK_ID = 'visual:0';
const EPSILON_SEC = 0.001,
  VISUAL_KINDS = new Set(['video', 'image']),
  CLIP_KINDS = new Set(['video', 'image', 'audio']);
function roundSec(_0x380c68) {
  return Math.round(toNumber(_0x380c68, 0) * 0x3e8) / 0x3e8;
}
function roundNonNegativeSec(_0x5bb6db) {
  return Math.max(0, roundSec(_0x5bb6db));
}
function firstFiniteNumber(..._0x48b60d) {
  for (const _0x3e702d of _0x48b60d) {
    const _0x18ea85 = Number(_0x3e702d);
    if (Number.isFinite(_0x18ea85)) return _0x18ea85;
  }
  return NaN;
}
function resolveSourceKey(_0x135383 = {}) {
  return normalizeText(
    _0x135383.sourceKey || _0x135383.src || _0x135383.localPath || _0x135383.path || _0x135383.url,
  );
}
function resolveClipKind(_0x4684c0 = {}, _0x3aba72 = 'video') {
  const _0x1108d6 = normalizeText(_0x4684c0.kind);
  if (CLIP_KINDS.has(_0x1108d6)) return _0x1108d6;
  return _0x3aba72 === 'audio' ? 'audio' : 'video';
}
function resolveSourceDurationSec(_0x404f26 = {}) {
  const _0x53399f = firstFiniteNumber(
    _0x404f26.sourceDurationSec,
    _0x404f26.mediaDurationSec,
    _0x404f26.sourceDuration,
    _0x404f26.mediaDuration,
  );
  return Number.isFinite(_0x53399f) ? roundNonNegativeSec(_0x53399f) : 0;
}
function resolveLaneIndex(_0x1f46ed = {}) {
  const _0x1c8603 = Number(_0x1f46ed.laneIndex);
  return Number.isFinite(_0x1c8603) ? Math.trunc(_0x1c8603) : 0;
}
function normalizeTimelineClip(_0x488ae3 = {}, _0x2f7959 = 0, _0x2b2491 = {}) {
  const _0x2d6aa1 = resolveClipKind(_0x488ae3, _0x2b2491.kind),
    _0x14a85c = resolveSourceKey(_0x488ae3),
    _0x42b74 = resolveSourceDurationSec(_0x488ae3),
    _0x16df54 = roundNonNegativeSec(
      firstFiniteNumber(
        _0x488ae3.mediaStartSec,
        _0x488ae3.mediaStart,
        _0x488ae3.startSec,
        _0x488ae3.start,
        0,
      ),
    ),
    _0x13b9f3 = firstFiniteNumber(
      _0x488ae3.clipDurationSec,
      _0x488ae3.timelineDurationSec,
      _0x488ae3.durationSec,
      _0x488ae3.duration,
    ),
    _0x1c3bee = roundNonNegativeSec(
      firstFiniteNumber(
        _0x488ae3.mediaEndSec,
        _0x488ae3.mediaEnd,
        _0x488ae3.endSec,
        _0x488ae3.end,
        Number.isFinite(_0x13b9f3) ? _0x16df54 + _0x13b9f3 : _0x16df54,
      ),
    ),
    _0xe75f7e = roundSec(
      firstFiniteNumber(
        _0x488ae3.timelineStartSec,
        _0x488ae3.timelineStart,
        _0x2b2491.defaultTimelineStartSec,
        0,
      ),
    ),
    _0x2730bf = Math.max(0, _0x1c3bee - _0x16df54),
    _0x2a1cd5 = roundSec(
      firstFiniteNumber(_0x488ae3.timelineEndSec, _0x488ae3.timelineEnd, _0xe75f7e + _0x2730bf),
    ),
    _0x840c49 = _0x2d6aa1 === 'audio' ? resolveLaneIndex(_0x488ae3) : 0,
    _0x4428c4 =
      normalizeText(_0x488ae3.trackId) ||
      (_0x2d6aa1 === 'audio' ? 'audio:' + _0x840c49 : MEDIA_CLIP_TIMELINE_VISUAL_TRACK_ID),
    _0x4b4293 =
      normalizeText(_0x488ae3.id) ||
      (_0x14a85c ? _0x2d6aa1 + ':' + _0x14a85c + ':' + _0x2f7959 : _0x2d6aa1 + ':' + _0x2f7959);
  return {
    id: _0x4b4293,
    kind: _0x2d6aa1,
    trackId: _0x4428c4,
    laneIndex: _0x840c49,
    sourceId: normalizeText(_0x488ae3.sourceId),
    sourceKey: _0x14a85c,
    mediaStartSec: _0x16df54,
    mediaEndSec: _0x1c3bee,
    sourceDurationSec: _0x42b74,
    timelineStartSec: _0xe75f7e,
    timelineEndSec: _0x2a1cd5,
    durationSec: roundNonNegativeSec(_0x2a1cd5 - _0xe75f7e),
    muted: _0x488ae3.muted === true,
    disabled: _0x488ae3.disabled === true,
    volume: Math.max(0, Math.min(1, toNumber(_0x488ae3.volume, 1))),
  };
}
function normalizeVisualTimelineClips(_0x4aad2c = []) {
  let _0x4e70cb = 0;
  return _0x4aad2c
    .filter((_0x34a309) => _0x34a309 && typeof _0x34a309 === 'object')
    .map((_0x5db97c, _0x18d922) => {
      const _0x26bb1b = normalizeTimelineClip(_0x5db97c, _0x18d922, {
        kind: resolveClipKind(_0x5db97c, 'video'),
        defaultTimelineStartSec: _0x4e70cb,
      });
      return (
        !Number.isFinite(Number(_0x5db97c.timelineStartSec)) &&
        !Number.isFinite(Number(_0x5db97c.timelineStart))
          ? (_0x4e70cb = _0x26bb1b.timelineEndSec)
          : (_0x4e70cb = Math.max(_0x4e70cb, _0x26bb1b.timelineEndSec)),
        _0x26bb1b
      );
    });
}
function normalizeAudioTimelineClips(_0xbf1294 = []) {
  return _0xbf1294
    .filter((_0x33c62c) => _0x33c62c && typeof _0x33c62c === 'object')
    .map((_0x169702, _0x423bd4) =>
      normalizeTimelineClip(_0x169702, _0x423bd4, { kind: 'audio', defaultTimelineStartSec: 0 }),
    );
}
function buildTracks(_0x3bd5db = []) {
  const _0x5a8350 = [];
  _0x3bd5db.some((_0x52066d) => VISUAL_KINDS.has(_0x52066d.kind)) &&
    _0x5a8350.push({
      id: MEDIA_CLIP_TIMELINE_VISUAL_TRACK_ID,
      kind: 'visual',
      laneIndex: 0,
      overlapPolicy: 'sequence',
    });
  const _0x4e0e39 = Array.from(
    new Set(
      _0x3bd5db.filter((_0x54894d) => _0x54894d.kind === 'audio').map((_0x302256) => _0x302256.laneIndex),
    ),
  ).sort((_0x4884b1, _0x1b8fe5) => _0x4884b1 - _0x1b8fe5);
  return (
    _0x4e0e39.forEach((_0x607978) => {
      _0x5a8350.push({ id: 'audio:' + _0x607978, kind: 'audio', laneIndex: _0x607978, overlapPolicy: 'mix' });
    }),
    _0x5a8350
  );
}
export function buildMediaClipTimelineManifest({
  mediaClip: mediaClip = null,
  videoClips: videoClips = null,
  audioClips: audioClips = null,
  videoTrack: videoTrack = null,
  audioTrack: audioTrack = null,
} = {}) {
  const _0x3d5345 = mediaClip && typeof mediaClip === 'object' ? mediaClip : {},
    _0x3f55aa = Array.isArray(videoClips)
      ? videoClips
      : Array.isArray(_0x3d5345.clips)
        ? _0x3d5345.clips
        : videoTrack
          ? [{ ...videoTrack, kind: 'video' }]
          : [],
    _0x41d167 = Array.isArray(audioClips)
      ? audioClips
      : Array.isArray(_0x3d5345.audioClips)
        ? _0x3d5345.audioClips
        : audioTrack
          ? [{ ...audioTrack, kind: 'audio' }]
          : [],
    _0x435904 = [...normalizeVisualTimelineClips(_0x3f55aa), ...normalizeAudioTimelineClips(_0x41d167)],
    _0x5842a1 = buildTracks(_0x435904),
    _0x55e9e1 = roundNonNegativeSec(
      _0x435904.reduce(
        (_0xe6e142, _0x91ff72) => Math.max(_0xe6e142, toNumber(_0x91ff72.timelineEndSec, 0)),
        0,
      ),
    );
  return {
    schemaVersion: MEDIA_CLIP_TIMELINE_SCHEMA_VERSION,
    durationSec: _0x55e9e1,
    tracks: _0x5842a1,
    clips: _0x435904,
  };
}
function makeIssue(_0x25bde8, _0x6eab64, _0x500d72, _0x201020 = {}) {
  return { severity: _0x25bde8, code: _0x6eab64, message: _0x500d72, ..._0x201020 };
}
export function validateMediaClipTimelineManifest(_0x278bfa = {}, _0x495d37 = {}) {
  const _0x5058a9 = [],
    _0x32d809 = [],
    _0x13ef3c = Array.isArray(_0x278bfa.tracks) ? _0x278bfa.tracks : [],
    _0x3e5ede = Array.isArray(_0x278bfa.clips) ? _0x278bfa.clips : [],
    _0x7c6507 = new Map(_0x13ef3c.map((_0x58673e) => [normalizeText(_0x58673e.id), _0x58673e])),
    _0x57dc6f = Math.max(
      1,
      Math.trunc(toNumber(_0x495d37.maxAudioLaneCount, MEDIA_CLIP_TIMELINE_AUDIO_LANE_COUNT_MAX)),
    );
  _0x278bfa.schemaVersion !== MEDIA_CLIP_TIMELINE_SCHEMA_VERSION &&
    _0x5058a9.push(
      makeIssue('error', 'schema_version_mismatch', 'Timeline schema version is not supported.'),
    );
  !_0x13ef3c.length &&
    _0x3e5ede.length &&
    _0x5058a9.push(makeIssue('error', 'missing_tracks', 'Timeline clips require tracks.'));
  _0x3e5ede.forEach((_0x52e401, _0x57ea78) => {
    const _0xb45eee = { clipId: normalizeText(_0x52e401.id), clipIndex: _0x57ea78 },
      _0x5073ec = normalizeText(_0x52e401.kind);
    !CLIP_KINDS.has(_0x5073ec) &&
      _0x5058a9.push(makeIssue('error', 'invalid_clip_kind', 'Timeline clip kind is invalid.', _0xb45eee));
    !normalizeText(_0x52e401.sourceKey) &&
      _0x5058a9.push(makeIssue('error', 'missing_source', 'Timeline clip is missing sourceKey.', _0xb45eee));
    const _0xae4a8 = _0x7c6507.get(normalizeText(_0x52e401.trackId));
    if (!_0xae4a8)
      _0x5058a9.push(
        makeIssue('error', 'missing_track', 'Timeline clip references a missing track.', _0xb45eee),
      );
    else {
      if (_0x5073ec === 'audio' && _0xae4a8.kind !== 'audio')
        _0x5058a9.push(
          makeIssue('error', 'track_kind_mismatch', 'Audio clip is not on an audio track.', _0xb45eee),
        );
      else
        VISUAL_KINDS.has(_0x5073ec) &&
          _0xae4a8.kind !== 'visual' &&
          _0x5058a9.push(
            makeIssue('error', 'track_kind_mismatch', 'Visual clip is not on a visual track.', _0xb45eee),
          );
    }
    const _0x1afc86 = Number(_0x52e401.mediaStartSec),
      _0x5d08df = Number(_0x52e401.mediaEndSec),
      _0x47fd5c = Number(_0x52e401.timelineStartSec),
      _0x2df3fd = Number(_0x52e401.timelineEndSec);
    (!Number.isFinite(_0x1afc86) || !Number.isFinite(_0x5d08df) || _0x5d08df <= _0x1afc86) &&
      _0x5058a9.push(
        makeIssue('error', 'invalid_media_range', 'Timeline clip media range is invalid.', _0xb45eee),
      );
    (!Number.isFinite(_0x47fd5c) || !Number.isFinite(_0x2df3fd) || _0x2df3fd <= _0x47fd5c) &&
      _0x5058a9.push(
        makeIssue('error', 'invalid_timeline_range', 'Timeline clip range is invalid.', _0xb45eee),
      );
    _0x47fd5c < -EPSILON_SEC &&
      _0x32d809.push(
        makeIssue('warning', 'negative_timeline_start', 'Timeline clip starts before zero.', _0xb45eee),
      );
    const _0x1788fb = Number(_0x52e401.sourceDurationSec);
    Number.isFinite(_0x1788fb) &&
      _0x1788fb > 0 &&
      _0x5d08df > _0x1788fb + EPSILON_SEC &&
      _0x5058a9.push(
        makeIssue(
          'error',
          'media_range_outside_source',
          'Timeline clip media range exceeds source duration.',
          _0xb45eee,
        ),
      );
    if (_0x5073ec === 'audio') {
      const _0x249c5e = Number(_0x52e401.laneIndex);
      (!Number.isInteger(_0x249c5e) || _0x249c5e < 0 || _0x249c5e >= _0x57dc6f) &&
        _0x5058a9.push(
          makeIssue(
            'error',
            'audio_lane_out_of_range',
            'Audio clip laneIndex exceeds the lane contract.',
            _0xb45eee,
          ),
        );
    }
  });
  const _0xd21f04 = _0x3e5ede
    .filter((_0x5e07fd) => VISUAL_KINDS.has(normalizeText(_0x5e07fd.kind)))
    .slice()
    .sort(
      (_0x227ba8, _0x3d70a8) =>
        toNumber(_0x227ba8.timelineStartSec, 0) - toNumber(_0x3d70a8.timelineStartSec, 0),
    );
  for (let _0x1b1acb = 1; _0x1b1acb < _0xd21f04.length; _0x1b1acb += 1) {
    const _0x32ede0 = _0xd21f04[_0x1b1acb - 1],
      _0x2927fa = _0xd21f04[_0x1b1acb];
    if (toNumber(_0x2927fa.timelineStartSec, 0) < toNumber(_0x32ede0.timelineEndSec, 0) - EPSILON_SEC) {
      const _0x4cbf30 = makeIssue(
        _0x495d37.failOnVisualOverlap === true ? 'error' : 'warning',
        'visual_track_overlap',
        'Visual timeline clips overlap on a sequence track.',
        { clipId: normalizeText(_0x2927fa.id), previousClipId: normalizeText(_0x32ede0.id) },
      );
      if (_0x495d37.failOnVisualOverlap === true) _0x5058a9.push(_0x4cbf30);
      else _0x32d809.push(_0x4cbf30);
    }
  }
  return { ok: _0x5058a9.length === 0, errors: _0x5058a9, warnings: _0x32d809 };
}
export function getMediaClipTimelineExportClips(_0xd46372 = {}, _0x9d5675 = {}) {
  const _0x4374f5 = normalizeText(_0x9d5675.kind),
    _0x4d03e9 = _0x9d5675.includeMuted === true,
    _0x331818 = _0x9d5675.includeDisabled === true,
    _0x3e7739 = Array.isArray(_0xd46372.clips) ? _0xd46372.clips : [];
  return _0x3e7739
    .filter((_0x2bf397) => {
      if (_0x4374f5 === 'visual') return VISUAL_KINDS.has(normalizeText(_0x2bf397.kind));
      if (_0x4374f5) return normalizeText(_0x2bf397.kind) === _0x4374f5;
      return true;
    })
    .filter((_0x1cf52e) => _0x331818 || _0x1cf52e.disabled !== true)
    .filter((_0x2b4d22) => _0x4d03e9 || _0x2b4d22.muted !== true)
    .map((_0x48e704) => ({
      id: _0x48e704.id,
      sourceId: _0x48e704.sourceId,
      sourceKey: _0x48e704.sourceKey,
      src: _0x48e704.sourceKey,
      kind: _0x48e704.kind,
      startSec: _0x48e704.mediaStartSec,
      endSec: _0x48e704.mediaEndSec,
      durationSec: roundNonNegativeSec(_0x48e704.mediaEndSec - _0x48e704.mediaStartSec),
      timelineStartSec: _0x48e704.timelineStartSec,
      timelineEndSec: _0x48e704.timelineEndSec,
      laneIndex: _0x48e704.laneIndex,
      muted: _0x48e704.muted === true,
      disabled: _0x48e704.disabled === true,
      volume: _0x48e704.volume,
    }));
}
