import appStore from '../../core/stores/appStore.js';
import { commit } from '../../modules/history.js';
import { t } from '../../i18n/index.js';
import {
  clampMediaClipRange,
  moveMediaClipAudioClipOnTimeline,
  moveMediaClipClipOnTimeline,
  normalizeMediaClipAudioLaneIndex,
  patchMediaClipAudioClipRange,
  patchMediaClipClipRange,
  patchMediaClipTrackRange,
  rollMediaClipVisualLeftTrim,
  shiftMediaClipTrackRange,
} from './mediaClipState.js';
import {
  getMediaClipTimelineDeltaSecFromPx,
  getMediaClipTimelineDisplayDuration,
  getMediaClipTimelineRangeRect,
} from './mediaClipTimelineModel.js';
import { normalizeText, readLayoutWidthPx, stopPointer, toNumber } from './mediaClipUtils.js';
function mediaClipText(_0x576662, _0x2b08d7 = {}) {
  return t('mediaClip.' + _0x576662, _0x2b08d7);
}
function timelineEditClipIndex(_0x2b7251 = null) {
  return Math['max'](0x0, Math['trunc'](toNumber(_0x2b7251?.['clipIndex'], 0x0)));
}
function timelineEditClips(_0x2b6e71 = null) {
  return Array['isArray'](_0x2b6e71?.['startClips']) ? _0x2b6e71['startClips'] : [];
}
function timelineEditBaseState(_0x3bc7ea = {}, _0x180863 = 'video', _0x34ab9b = null) {
  const _0x3779c0 = timelineEditClips(_0x34ab9b);
  return {
    ..._0x3bc7ea,
    ...(_0x180863 === 'audio' ? { audioClips: _0x3779c0 } : { clips: _0x3779c0 }),
    tracks: { ...(_0x3bc7ea['tracks'] || {}), [_0x180863]: _0x34ab9b?.['startTrack'] },
  };
}
function findCommittedClipIndex(_0x406ec7 = {}, _0x29a80f = 'video', _0x3ecf3e = null, _0x324457 = -0x1) {
  const _0x57ea47 = timelineEditClipIndex(_0x3ecf3e),
    _0x5c8f44 = timelineEditClips(_0x3ecf3e),
    _0x3ac975 = normalizeText(_0x5c8f44[_0x57ea47]?.['id']);
  if (!_0x3ac975) return _0x324457;
  const _0x3d1e26 = _0x29a80f === 'audio' ? _0x406ec7['audioClips'] : _0x406ec7['clips'];
  return _0x3d1e26?.['findIndex']((_0x13ab31) => normalizeText(_0x13ab31?.['id']) === _0x3ac975) ?? _0x324457;
}
function buildFirstVideoLeftTrimPreviewState(_0x219454 = {}, _0xe9f59 = {}, _0x42d2bb = {}) {
  const _0x2731c3 = timelineEditClips(_0xe9f59),
    _0x4e67fe = timelineEditClipIndex(_0xe9f59),
    _0x581273 = _0x2731c3[_0x4e67fe] || {},
    _0x3a19db = Math['max'](
      0x0,
      toNumber(_0x42d2bb['endSec'], _0x581273['endSec']) -
        toNumber(_0x42d2bb['startSec'], _0x581273['startSec']),
    ),
    _0xc4e677 = Math['max'](
      0x0,
      toNumber(
        _0x581273['timelineEndSec'],
        toNumber(_0x581273['timelineStartSec'], 0x0) +
          Math['max'](0x0, toNumber(_0x581273['endSec'], 0x0) - toNumber(_0x581273['startSec'], 0x0)),
      ),
    ),
    _0x41a2a8 = _0xc4e677 - _0x3a19db,
    _0x146517 = _0x41a2a8 + _0x3a19db,
    _0x455796 = _0x2731c3['map']((_0x5f5a94, _0x9569ae) =>
      _0x9569ae === _0x4e67fe
        ? {
            ..._0x5f5a94,
            startSec: _0x42d2bb['startSec'],
            endSec: _0x42d2bb['endSec'],
            timelineStartSec: Math['round'](_0x41a2a8 * 0x3e8) / 0x3e8,
            timelineEndSec: Math['round'](_0x146517 * 0x3e8) / 0x3e8,
          }
        : { ..._0x5f5a94 },
    );
  return {
    ..._0x219454,
    clips: _0x455796,
    tracks: {
      ...(_0x219454['tracks'] || {}),
      video: {
        ...(_0xe9f59['startTrack'] || {}),
        startSec: _0x42d2bb['startSec'],
        endSec: _0x42d2bb['endSec'],
      },
    },
  };
}
export function isMediaClipVideoLeftTrimDrag(_0x290303 = null) {
  const _0x2e900b = timelineEditClipIndex(_0x290303);
  return (
    _0x290303?.['kind'] === 'video' &&
    _0x290303?.['side'] === 'left' &&
    !!timelineEditClips(_0x290303)[_0x2e900b]
  );
}
export function isMediaClipRollingVideoLeftTrimDrag(_0x97de0e = null) {
  return isMediaClipVideoLeftTrimDrag(_0x97de0e) && timelineEditClipIndex(_0x97de0e) > 0x0;
}
export function resolveMediaClipTimelineTrimPreview({
  mediaClip: mediaClip = {},
  kind: kind = 'video',
  drag: drag = null,
  deltaSec: deltaSec = 0x0,
  durationSec: durationSec = 0x0,
} = {}) {
  const _0x225c26 = timelineEditClipIndex(drag),
    _0xebe410 = timelineEditClips(drag),
    _0x34334c = _0xebe410[_0x225c26];
  if (!_0x34334c) return null;
  const _0x4158a1 =
      drag?.['side'] === 'left'
        ? { startSec: _0x34334c['startSec'] + deltaSec }
        : { endSec: _0x34334c['endSec'] + deltaSec },
    _0x3982ce = clampMediaClipRange({ ..._0x34334c, ..._0x4158a1 }, _0x34334c['durationSec']),
    _0x12f972 = { startSec: _0x3982ce['startSec'], endSec: _0x3982ce['endSec'] },
    _0x473eb4 = timelineEditBaseState(mediaClip, kind, drag);
  let _0x483579,
    _0x406f0f = null;
  if (kind === 'audio') _0x483579 = patchMediaClipAudioClipRange(_0x473eb4, _0x225c26, _0x12f972);
  else {
    if (isMediaClipRollingVideoLeftTrimDrag(drag))
      ((_0x406f0f = { ..._0x12f972 }),
        (_0x483579 = rollMediaClipVisualLeftTrim(_0x473eb4, _0x225c26, _0x12f972)));
    else
      isMediaClipVideoLeftTrimDrag(drag)
        ? (_0x483579 = buildFirstVideoLeftTrimPreviewState(_0x473eb4, drag, _0x3982ce))
        : (_0x483579 = patchMediaClipClipRange(_0x473eb4, _0x225c26, _0x12f972));
  }
  const _0x19c8c9 = (kind === 'audio' ? _0x483579['audioClips'] : _0x483579['clips']) || _0xebe410,
    _0x371092 = _0x19c8c9[_0x225c26] || _0x34334c,
    _0xd25ce5 = toNumber(_0x371092['timelineStartSec'], 0x0),
    _0x133d6a = Math['max'](_0xd25ce5, toNumber(_0x371092['timelineEndSec'], _0xd25ce5)),
    _0x1046d9 = {
      startSec: toNumber(_0x371092['startSec'], _0x3982ce['startSec']),
      endSec: toNumber(_0x371092['endSec'], _0x3982ce['endSec']),
    };
  return {
    kind: kind,
    clipIndex: _0x225c26,
    previewState: _0x483579,
    previewClips: _0x19c8c9,
    previewClip: _0x371092,
    pendingRange: _0x1046d9,
    pendingRollRange: _0x406f0f,
    pendingPlayheadSec: drag?.['side'] === 'left' ? _0xd25ce5 : _0x133d6a,
    displayDurationSec: getMediaClipTimelineDisplayDuration(durationSec),
    timelineStartSec: _0xd25ce5,
    timelineEndSec: _0x133d6a,
    clipDurationSec: Math['max'](0x0, _0x133d6a - _0xd25ce5),
    sourcePreviewSec: drag?.['side'] === 'left' ? _0x1046d9['startSec'] : _0x1046d9['endSec'],
  };
}
export function resolveMediaClipTimelineMovePreview({
  kind: kind = 'video',
  drag: drag = null,
  deltaSec: deltaSec = 0x0,
  durationSec: durationSec = 0x0,
  laneIndex: laneIndex = null,
} = {}) {
  const _0x1837ed = timelineEditClipIndex(drag),
    _0x24ad29 = timelineEditClips(drag)[_0x1837ed];
  if (!_0x24ad29) return null;
  const _0x56ba32 = getMediaClipTimelineDisplayDuration(durationSec),
    _0x2c7451 = toNumber(_0x24ad29['timelineStartSec'], 0x0),
    _0x1416de = Math['max'](_0x2c7451, toNumber(_0x24ad29['timelineEndSec'], _0x2c7451)),
    _0x3ae5f3 = Math['max'](0.1, _0x1416de - _0x2c7451),
    _0x4ed5b4 =
      kind === 'video'
        ? Math['max'](0x0, Math['min'](Math['max'](0x0, _0x56ba32 - _0x3ae5f3), _0x2c7451 + deltaSec))
        : Math['max'](0x0, _0x2c7451 + deltaSec),
    _0x458c88 = _0x4ed5b4 - _0x2c7451,
    _0x3e6923 =
      kind === 'audio' ? normalizeMediaClipAudioLaneIndex(laneIndex ?? drag?.['startLaneIndex']) : 0x0;
  return {
    kind: kind,
    clipIndex: _0x1837ed,
    clip: _0x24ad29,
    displayDurationSec: _0x56ba32,
    timelineStartSec: _0x4ed5b4,
    timelineEndSec: _0x4ed5b4 + _0x3ae5f3,
    clipDurationSec: _0x3ae5f3,
    pendingDeltaSec: _0x458c88,
    pendingLaneIndex: _0x3e6923,
    pendingPlayheadSec: Math['max'](
      _0x4ed5b4,
      Math['min'](_0x4ed5b4 + _0x3ae5f3, toNumber(drag?.['startPlayheadSec'], 0x0) + _0x458c88),
    ),
  };
}
export function commitMediaClipTimelineEditTransaction({
  mediaClip: mediaClip = {},
  kind: kind = 'video',
  mode: mode = 'trim',
  drag: drag = null,
} = {}) {
  const _0x1a6197 = timelineEditClipIndex(drag),
    _0x5939a9 = timelineEditClips(drag);
  if (!_0x5939a9[_0x1a6197]) return null;
  const _0x40a663 = timelineEditBaseState(mediaClip, kind, drag);
  let _0x4f6ba7 = _0x40a663;
  if (mode === 'trim' && kind === 'video')
    _0x4f6ba7 = isMediaClipRollingVideoLeftTrimDrag(drag)
      ? rollMediaClipVisualLeftTrim(
          _0x40a663,
          _0x1a6197,
          drag?.['pendingRollRange'] || drag?.['pendingRange'],
          { rebaseNegativeTimeline: !![], rebaseTimelineStart: !![] },
        )
      : patchMediaClipClipRange(_0x40a663, _0x1a6197, drag?.['pendingRange']);
  else {
    if (mode === 'trim' && kind === 'audio')
      _0x4f6ba7 = patchMediaClipAudioClipRange(_0x40a663, _0x1a6197, drag?.['pendingRange']);
    else {
      if (mode === 'move' && kind === 'video')
        _0x4f6ba7 = moveMediaClipClipOnTimeline(_0x40a663, _0x1a6197, drag?.['pendingDeltaSec']);
      else {
        if (mode === 'move' && kind === 'audio')
          _0x4f6ba7 = moveMediaClipAudioClipOnTimeline(_0x40a663, _0x1a6197, drag?.['pendingDeltaSec'], {
            laneIndex: drag?.['pendingLaneIndex'],
          });
        else return null;
      }
    }
  }
  const _0x3ff85c = mode === 'move' && kind === 'video' ? -0x1 : _0x1a6197;
  return {
    kind: kind,
    mode: mode,
    mediaClip: _0x4f6ba7,
    activeClipIndex: findCommittedClipIndex(_0x4f6ba7, kind, drag, _0x3ff85c),
  };
}
export function previewMediaClipTimelineTrimDrag(
  _0x9a808a,
  _0x3b2bfe,
  _0x5120de,
  _0x42259e = 0x0,
  _0x2e032e = 0x0,
  _0x18af7e = null,
) {
  const _0x3c29c9 = _0x5120de?.['segmentEl'];
  if (!_0x3c29c9) return;
  const _0x31eafd = resolveMediaClipTimelineTrimPreview({
    mediaClip: _0x9a808a['_mediaClip'],
    kind: _0x3b2bfe,
    drag: _0x5120de,
    deltaSec: _0x42259e,
    durationSec: _0x2e032e,
  });
  if (!_0x31eafd) return;
  _0x5120de['pendingRange'] = _0x31eafd['pendingRange'];
  _0x3b2bfe === 'video' && (_0x5120de['pendingRollRange'] = _0x31eafd['pendingRollRange']);
  ((_0x5120de['previewDurationSec'] = _0x31eafd['displayDurationSec']),
    (_0x5120de['pendingPlayheadSec'] = _0x31eafd['pendingPlayheadSec']),
    (_0x5120de['hasMoved'] = !![]));
  const _0x11d7de = _0x18af7e || _0x5120de['rowEl'];
  if (_0x3b2bfe === 'video') {
    !_0x9a808a['_applyVideoTimelinePreview'](
      _0x11d7de,
      _0x31eafd['previewClips'],
      _0x31eafd['displayDurationSec'],
    ) &&
      (_0x9a808a['_applyTimelineSegmentRect'](
        _0x3c29c9,
        _0x9a808a['_timelinePreviewRangeRect']({
          startSec: _0x31eafd['timelineStartSec'],
          endSec: _0x31eafd['timelineEndSec'],
          durationSec: _0x31eafd['displayDurationSec'],
        }),
      ),
      _0x9a808a['_updateTimelineSegmentLabel'](_0x3c29c9, _0x31eafd['clipDurationSec']));
    const _0x12a7ba = _0x9a808a['_videoTimelineMaterialEnd'](
      _0x31eafd['previewState']['tracks']?.['video'],
      _0x31eafd['previewClips'],
    );
    (_0x9a808a['_syncTimelineAddSlotForRow'](_0x11d7de, {
      displayDurationSec: _0x31eafd['displayDurationSec'],
      materialEndSec: _0x12a7ba,
    }),
      _0x9a808a['_updateTrackPlayheadVisual'](_0x11d7de, _0x31eafd['displayDurationSec'], {
        playheadSec: _0x5120de['startPlayheadSec'],
      }));
    const _0x3a9a36 = toNumber(_0x5120de['startPlayheadSec'], _0x9a808a['_playheadSec']);
    (_0x9a808a['_syncVideoPreviewSourceForTimelineSec'](_0x3a9a36, { clips: _0x31eafd['previewClips'] }),
      _0x9a808a['_syncPreviewTime'](
        'video',
        _0x9a808a['_videoSourceSecForTimelineSec'](_0x3a9a36, _0x31eafd['previewClips']),
      ));
    return;
  }
  (!_0x9a808a['_applyAudioTimelinePreview'](
    _0x11d7de,
    _0x31eafd['previewClips'],
    _0x31eafd['displayDurationSec'],
  ) &&
    (_0x9a808a['_applyAudioTimelineSegmentRect'](
      _0x3c29c9,
      getMediaClipTimelineRangeRect({
        startSec: _0x31eafd['timelineStartSec'],
        endSec: _0x31eafd['timelineEndSec'],
        durationSec: _0x31eafd['displayDurationSec'],
      }),
    ),
    _0x9a808a['_updateTimelineSegmentLabel'](_0x3c29c9, _0x31eafd['clipDurationSec']),
    _0x9a808a['_syncAudioSegmentWaveformViewport'](_0x3c29c9, _0x31eafd['previewClip'])),
    _0x9a808a['_updateTrackPlayheadVisual'](_0x11d7de, _0x31eafd['displayDurationSec'], {
      playheadSec: _0x5120de['startPlayheadSec'],
    }),
    _0x9a808a['_syncPreviewTime']('audio', _0x31eafd['sourcePreviewSec']));
}
export function previewMediaClipTimelineMoveDrag(
  _0x15c939,
  _0x3b0727,
  _0x2b55da,
  _0x2360f6 = 0x0,
  _0x134d5a = 0x0,
) {
  const _0xb6c2e8 = _0x2b55da?.['segmentEl'];
  if (!_0xb6c2e8) return;
  const _0x42b538 = _0x3b0727 === 'audio' ? _0x15c939['_audioLaneIndexFromDrag'](_0x2b55da) : 0x0,
    _0x5a0718 = resolveMediaClipTimelineMovePreview({
      kind: _0x3b0727,
      drag: _0x2b55da,
      deltaSec: _0x2360f6,
      durationSec: _0x134d5a,
      laneIndex: _0x42b538,
    });
  if (!_0x5a0718) return;
  if (_0x3b0727 === 'video')
    _0x15c939['_applyTimelineSegmentRect'](
      _0xb6c2e8,
      getMediaClipTimelineRangeRect({
        startSec: _0x5a0718['timelineStartSec'],
        endSec: _0x5a0718['timelineEndSec'],
        durationSec: _0x5a0718['displayDurationSec'],
      }),
    );
  else {
    const _0xfe241f = _0x15c939['_audioLaneCount'](_0x2b55da['startClips'], {
      previewLaneIndex: _0x5a0718['pendingLaneIndex'],
    });
    (_0x15c939['_setAudioSegmentLaneVisual'](_0xb6c2e8, _0x5a0718['pendingLaneIndex']),
      _0xb6c2e8['classList']?.['toggle']?.(
        'is-lane-preview',
        _0x5a0718['pendingLaneIndex'] !== normalizeMediaClipAudioLaneIndex(_0x2b55da['startLaneIndex']),
      ),
      _0x15c939['_setAudioLaneCountStyle'](_0x2b55da['rowEl'], _0xfe241f),
      _0x15c939['_setAudioLaneCountStyle'](_0x2b55da['rowEl']?.['parentElement'], _0xfe241f),
      _0x15c939['_setAudioLaneCountStyle'](_0x2b55da['laneEl'], _0xfe241f),
      _0x15c939['_setAudioLaneCountStyle'](_0x2b55da['timelineEl'], _0xfe241f),
      _0x15c939['_setAudioLaneCountStyle'](
        _0x2b55da['laneEl']?.['querySelector']?.('.media-clip-audio-lane-controls'),
        _0xfe241f,
      ),
      _0x15c939['_applyAudioTimelineSegmentRect'](
        _0xb6c2e8,
        getMediaClipTimelineRangeRect({
          startSec: _0x5a0718['timelineStartSec'],
          endSec: _0x5a0718['timelineEndSec'],
          durationSec: _0x5a0718['displayDurationSec'],
        }),
      ));
  }
  (_0x15c939['_updateTimelineSegmentLabel'](_0xb6c2e8, _0x5a0718['clipDurationSec']),
    (_0x2b55da['previewDurationSec'] = _0x5a0718['displayDurationSec']),
    (_0x2b55da['pendingDeltaSec'] = _0x5a0718['pendingDeltaSec']),
    _0x3b0727 === 'audio' &&
      ((_0x2b55da['pendingLaneIndex'] = _0x5a0718['pendingLaneIndex']),
      (_0x2b55da['pendingPlayheadSec'] = _0x5a0718['pendingPlayheadSec'])));
}
export function commitMediaClipTimelineEdit(_0x35e258, _0x210d8f, _0x3223e1, _0x1acdf8, _0x1ed6f9 = {}) {
  const _0x1decf3 = commitMediaClipTimelineEditTransaction({
    mediaClip: _0x35e258['_mediaClip'],
    kind: _0x210d8f,
    mode: _0x3223e1,
    drag: _0x1acdf8,
  });
  if (!_0x1decf3) return;
  _0x35e258['_mediaClip'] = _0x1decf3['mediaClip'];
  const _0x5e323b = _0x1decf3['activeClipIndex'];
  if (_0x5e323b >= 0x0 && _0x210d8f === 'video')
    (_0x35e258['_setActiveClipIndex'](_0x5e323b), _0x35e258['_selectClipIndex'](_0x5e323b));
  else
    _0x5e323b >= 0x0 &&
      _0x210d8f === 'audio' &&
      (_0x35e258['_setActiveAudioClipIndex'](_0x5e323b), _0x35e258['_selectAudioClipIndex'](_0x5e323b));
  if (_0x3223e1 === 'trim' && _0x210d8f === 'video') {
    const _0xe482eb =
      _0x35e258['_mediaClip']['clips']?.[_0x5e323b >= 0x0 ? _0x5e323b : timelineEditClipIndex(_0x1acdf8)];
    if (_0xe482eb) {
      const _0x584b05 = _0x35e258['_videoTimelineDuration'](_0x35e258['_mediaClip']['tracks']?.['video']),
        _0xc08856 = getMediaClipTimelineDisplayDuration(
          toNumber(_0x1acdf8?.['durationSec'], toNumber(_0x1acdf8?.['previewDurationSec'], _0x584b05)),
        );
      ((_0x35e258['_playheadSec'] = Math['max'](
        0x0,
        Math['min'](_0xc08856, toNumber(_0x1acdf8?.['startPlayheadSec'], _0x35e258['_playheadSec'])),
      )),
        _0x35e258['_syncTimelineAddSlotForRow'](_0x1acdf8?.['rowEl'], {
          displayDurationSec: _0xc08856,
          materialEndSec: _0x35e258['_videoTimelineMaterialEnd'](
            _0x35e258['_mediaClip']['tracks']?.['video'],
          ),
        }),
        _0x35e258['_syncVideoPreviewSourceForTimelineSec'](_0x35e258['_playheadSec']),
        _0x35e258['_syncPreviewTime'](
          'video',
          _0x35e258['_videoSourceSecForPlayhead'](_0x35e258['_playheadSec']),
        ));
    }
  } else {
    if (_0x3223e1 === 'trim' && _0x210d8f === 'audio') {
      const _0x41a55c = _0x35e258['_timelineDurationForKind']('audio'),
        _0x25c337 = getMediaClipTimelineDisplayDuration(
          toNumber(_0x1acdf8?.['durationSec'], toNumber(_0x1acdf8?.['previewDurationSec'], _0x41a55c)),
        );
      ((_0x35e258['_playheadSec'] = Math['max'](
        0x0,
        Math['min'](_0x25c337, toNumber(_0x1acdf8?.['startPlayheadSec'], _0x35e258['_playheadSec'])),
      )),
        _0x35e258['_syncTimelineAddSlotForRow'](_0x1acdf8?.['rowEl'], {
          displayDurationSec: _0x25c337,
          materialEndSec: _0x35e258['_timelineMaterialEndSec'](),
        }),
        _0x35e258['_syncAudioPreviewSourceForTimelineSec'](_0x35e258['_playheadSec']),
        _0x35e258['_syncPreviewTime'](
          'audio',
          _0x35e258['_audioSourceSecForPlayhead'](_0x35e258['_playheadSec']),
        ));
    } else {
      if (_0x3223e1 === 'move' && _0x210d8f === 'video') {
        const _0x440840 = _0x35e258['_videoTimelineDuration'](_0x35e258['_mediaClip']['tracks']?.['video']);
        _0x35e258['_playheadSec'] = Math['max'](
          0x0,
          Math['min'](_0x440840, toNumber(_0x1acdf8?.['startPlayheadSec'], _0x35e258['_playheadSec'])),
        );
      } else {
        if (_0x3223e1 === 'move' && _0x210d8f === 'audio') {
          const _0x1c246f = _0x35e258['_timelineDurationForKind']('audio');
          ((_0x35e258['_playheadSec'] = Math['max'](0x0, Math['min'](_0x1c246f, _0x35e258['_playheadSec']))),
            _0x35e258['_syncTimelineAddSlotForRow'](_0x1acdf8?.['rowEl'], {
              displayDurationSec: _0x1acdf8?.['previewDurationSec'],
              materialEndSec: _0x35e258['_timelineMaterialEndSec'](),
            }),
            _0x35e258['_syncAudioPreviewSourceForTimelineSec'](_0x35e258['_playheadSec']),
            _0x35e258['_syncPreviewTime'](
              'audio',
              _0x35e258['_audioSourceSecForPlayhead'](_0x35e258['_playheadSec']),
            ));
        }
      }
    }
  }
  ((_0x35e258['nodeData'] = { ...(_0x35e258['nodeData'] || {}), mediaClip: _0x35e258['_mediaClip'] }),
    _0x1ed6f9['persist'] !== ![] &&
      appStore['updateNodeData'](_0x35e258['id'], { mediaClip: _0x35e258['_mediaClip'] }));
}
export function renderMediaClipTimelineTrimHandle(_0x1728f0, _0x3af8e2, _0x54d0e3, _0x4d3c5c = {}) {
  const _0x2e5b67 = document['createElement']('button');
  ((_0x2e5b67['type'] = 'button'),
    (_0x2e5b67['className'] = 'media-clip-trim media-clip-trim-' + _0x54d0e3),
    (_0x2e5b67['dataset']['clipIndex'] = String(
      Math['max'](0x0, Math['trunc'](toNumber(_0x4d3c5c['clipIndex'], 0x0))),
    )),
    _0x2e5b67['setAttribute'](
      'aria-label',
      mediaClipText(_0x54d0e3 === 'left' ? 'trim.left' : 'trim.right'),
    ));
  const _0x358519 = document['createElement']('span');
  return (
    (_0x358519['className'] = 'media-clip-trim-visual'),
    _0x358519['setAttribute']('aria-hidden', 'true'),
    _0x2e5b67['appendChild'](_0x358519),
    _0x2e5b67['addEventListener']('pointerenter', () => {
      const _0x344a16 = _0x2e5b67['closest']('.media-clip-segment'),
        _0x1c9560 = _0x344a16?.['closest']('.media-clip-track') || null;
      (_0x344a16?.['querySelectorAll']?.('.media-clip-trim.is-hovered')?.['forEach']((_0x8379ce) => {
        if (_0x8379ce !== _0x2e5b67) _0x8379ce['classList']['remove']('is-hovered');
      }),
        _0x2e5b67['classList']['add']('is-hovered'),
        _0x344a16 &&
          _0x1728f0['_setTimelineHoverSegment'](_0x1c9560, _0x344a16, _0x3af8e2, _0x4d3c5c['clipIndex']));
    }),
    _0x2e5b67['addEventListener']('pointerleave', () => {
      if (!_0x1728f0['_timelineDrag']()) _0x2e5b67['classList']['remove']('is-hovered');
    }),
    _0x2e5b67['addEventListener']('pointerdown', (_0x24a6fd) => {
      (stopPointer(_0x24a6fd),
        _0x1728f0['_cancelTimelineSettle'](),
        _0x1728f0['_stopTimelineDragAutoScroll'](),
        (_0x1728f0['_deferredTimelineDragNodeData'] = null),
        _0x2e5b67['classList']['add']('is-hovered'));
      try {
        _0x2e5b67['setPointerCapture']?.(_0x24a6fd['pointerId']);
      } catch {}
      const _0x4003b2 = _0x1728f0['_mediaClip']['tracks']?.[_0x3af8e2],
        _0x1dc458 = Math['max'](0x0, Math['trunc'](toNumber(_0x4d3c5c['clipIndex'], 0x0)));
      if (_0x3af8e2 === 'video')
        (_0x1728f0['_setActiveClipIndex'](_0x1dc458), _0x1728f0['_selectClipIndex'](_0x1dc458));
      else
        _0x3af8e2 === 'audio' &&
          (_0x1728f0['_setActiveAudioClipIndex'](_0x1dc458), _0x1728f0['_selectAudioClipIndex'](_0x1dc458));
      const _0xa8ab01 = _0x2e5b67['closest']('.media-clip-segment'),
        _0xd30a5c = _0xa8ab01?.['closest']('.media-clip-track') || null,
        _0x4eac52 = _0xa8ab01?.['closest']('.media-clip-timeline-lane') || null,
        _0x5e2173 = _0xa8ab01?.['closest']('.media-clip-timeline-scroll') || null,
        _0x1884a8 =
          _0x3af8e2 === 'audio'
            ? _0x1728f0['_audioTimelineClips'](_0x4003b2)['map']((_0x123a83) => ({ ..._0x123a83 }))
            : _0x1728f0['_videoTimelineClips'](_0x4003b2)['map']((_0x308110) => ({ ..._0x308110 })),
        _0x43ce2c = _0x1728f0['_resolveTimelineDragDuration'](
          _0x3af8e2,
          _0x4003b2,
          _0x1884a8,
          _0xa8ab01,
          _0x1dc458,
        );
      _0xa8ab01 && _0x1728f0['_setTimelineHoverSegment'](_0xd30a5c, _0xa8ab01, _0x3af8e2, _0x1dc458);
      (_0xa8ab01?.['classList']['add']('is-trimming'),
        _0xd30a5c?.['classList']['add']('is-trimming'),
        _0x4eac52?.['classList']['add']('is-trimming'),
        _0x5e2173?.['classList']['add']('is-trimming'));
      const _0x4a332a = _0x1728f0['_nextTimelineDragSessionId']();
      _0x1728f0['_setTimelineDrag']({
        sessionId: _0x4a332a,
        kind: _0x3af8e2,
        mode: 'trim',
        side: _0x54d0e3,
        clipIndex: _0x1dc458,
        startX: _0x24a6fd['clientX'],
        startTrack: { ...(_0x4003b2 || {}) },
        startClips: _0x1884a8,
        startMediaClip: _0x1728f0['_mediaClip'],
        durationSec: _0x43ce2c,
        startScrollLeft: toNumber(_0x5e2173?.['scrollLeft'], 0x0),
        latestClientX: _0x24a6fd['clientX'],
        segmentEl: _0xa8ab01,
        rowEl: _0xd30a5c,
        laneEl: _0x4eac52,
        scrollEl: _0x5e2173,
        pendingRange: null,
        pendingPlayheadSec: _0x1728f0['_playheadSec'],
        startPlayheadSec: _0x1728f0['_playheadSec'],
        hasMoved: ![],
      });
      const _0x28b5b9 = (_0x7bca81) => handleMediaClipTimelineDrag(_0x1728f0, _0x7bca81, _0x4a332a),
        _0x3b3c02 = (_0x5e0551) => {
          stopPointer(_0x5e0551);
          if (!_0x1728f0['_isTimelineDragSession'](_0x4a332a)) return;
          const _0x57be33 = _0x1728f0['_timelineDrag']();
          _0x1728f0['_persistTimelineDragScroll'](_0x57be33);
          if (_0x57be33?.['kind'] === 'video' && _0x57be33['pendingRange']) {
            const _0xb4a519 = isMediaClipVideoLeftTrimDrag(_0x57be33);
            commitMediaClipTimelineEdit(_0x1728f0, 'video', 'trim', _0x57be33, { persist: ![] });
            const _0x121047 = _0x1728f0['_videoTimelineDuration'](
                _0x1728f0['_mediaClip']['tracks']?.['video'],
              ),
              _0x4a9aa4 = getMediaClipTimelineDisplayDuration(
                toNumber(_0x57be33['durationSec'], toNumber(_0x57be33['previewDurationSec'], _0x121047)),
              ),
              _0x9fbe87 = _0x57be33;
            detachMediaClipTimelineEditDrag(_0x1728f0);
            _0xb4a519
              ? _0x1728f0['_animateTrackVisualsToCurrentState'](_0x57be33['rowEl'], 'video', {
                  durationSec: _0x4a9aa4,
                  persist: !![],
                  commitHistory: !![],
                  syncTimelineWidthAfterSettle: ![],
                })
              : (_0x1728f0['_updateTrackVisuals']('video', {
                  durationSec: _0x57be33['previewDurationSec'],
                  syncTimelineWidth: ![],
                }),
                _0x1728f0['_persistTimelineMediaClip']({ commitHistory: !![] }));
            _0x1728f0['_applyDeferredTimelineDragUpdate'](_0x9fbe87);
            return;
          }
          if (_0x57be33?.['kind'] === 'audio' && _0x57be33['pendingRange']) {
            commitMediaClipTimelineEdit(_0x1728f0, 'audio', 'trim', _0x57be33, { persist: ![] });
            const _0x335828 = _0x57be33;
            (detachMediaClipTimelineEditDrag(_0x1728f0),
              _0x1728f0['_updateTrackVisuals']('audio', {
                durationSec: _0x57be33['previewDurationSec'],
                syncTimelineWidth: ![],
              }),
              _0x1728f0['_persistTimelineMediaClip']({ commitHistory: !![] }),
              _0x1728f0['_applyDeferredTimelineDragUpdate'](_0x335828));
            return;
          }
          (appStore['updateNodeData'](_0x1728f0['id'], { mediaClip: _0x1728f0['_mediaClip'] }),
            (_0x1728f0['nodeData'] = {
              ...(_0x1728f0['nodeData'] || {}),
              mediaClip: _0x1728f0['_mediaClip'],
            }));
          const _0x3d606b = _0x57be33;
          (detachMediaClipTimelineEditDrag(_0x1728f0),
            _0x1728f0['_render'](),
            commit(),
            _0x1728f0['_applyDeferredTimelineDragUpdate'](_0x3d606b));
        };
      ((_0x1728f0['_dragMove'] = _0x28b5b9),
        (_0x1728f0['_dragUp'] = _0x3b3c02),
        window['addEventListener']('pointermove', _0x28b5b9, !![]),
        window['addEventListener']('pointerup', _0x3b3c02, { once: !![], capture: !![] }));
    }),
    _0x2e5b67
  );
}
export function detachMediaClipTimelineEditDrag(_0x58e3e2) {
  _0x58e3e2['_dragMove'] && window['removeEventListener']('pointermove', _0x58e3e2['_dragMove'], !![]);
  _0x58e3e2['_dragUp'] && window['removeEventListener']('pointerup', _0x58e3e2['_dragUp'], !![]);
  _0x58e3e2['_stopTimelineDragAutoScroll']();
  const _0x1f1fc1 = _0x58e3e2['_timelineDrag']();
  (_0x1f1fc1?.['segmentEl']?.['classList']['remove']('is-dragging'),
    _0x1f1fc1?.['segmentEl']?.['classList']['remove']('is-trimming'),
    _0x1f1fc1?.['segmentEl']?.['classList']['remove']('is-lane-preview'),
    _0x1f1fc1?.['segmentEl']
      ?.['querySelectorAll']?.('.media-clip-trim.is-hovered')
      ?.['forEach']((_0x148058) => {
        _0x148058['classList']['remove']('is-hovered');
      }),
    _0x1f1fc1?.['rowEl']?.['classList']['remove']('is-trimming'),
    _0x1f1fc1?.['rowEl']?.['classList']['remove']('is-preview-dragging'),
    _0x1f1fc1?.['laneEl']?.['classList']['remove']('is-trimming'),
    _0x1f1fc1?.['laneEl']?.['classList']['remove']('is-moving'),
    _0x1f1fc1?.['timelineEl']?.['classList']['remove']('is-moving-material'),
    _0x1f1fc1?.['scrollEl']?.['classList']['remove']('is-trimming'),
    (_0x58e3e2['_dragMove'] = null),
    (_0x58e3e2['_dragUp'] = null),
    _0x58e3e2['_setTimelineDrag'](null));
}
export function startMediaClipTimelineSegmentDrag(_0x3b8f29, _0x4e8e7c, _0x46bb6d, _0x52b7b2 = {}) {
  if (_0x52b7b2['compact'] === !![] || _0x46bb6d['button'] !== 0x0) return;
  (stopPointer(_0x46bb6d),
    _0x3b8f29['_cancelTimelineSettle'](),
    _0x3b8f29['_stopTimelineDragAutoScroll'](),
    (_0x3b8f29['_deferredTimelineDragNodeData'] = null));
  const _0xb32d26 = _0x3b8f29['_mediaClip']['tracks']?.[_0x4e8e7c];
  if (!_0xb32d26) return;
  const _0x45f7da = _0x46bb6d['currentTarget']?.['closest']('.media-clip-track') || null,
    _0x4e8604 = _0x45f7da?.['closest']?.('.media-clip-timeline-scroll') || null,
    _0x44c99b = _0x45f7da?.['closest']?.('.media-clip-timeline-lane') || null,
    _0x4ffe3f = _0x45f7da?.['closest']?.('.media-clip-compact-timeline') || null,
    _0x1cfc8b =
      _0x4e8e7c === 'audio'
        ? _0x3b8f29['_audioTimelineClips'](_0xb32d26)['map']((_0x471cd5) => ({ ..._0x471cd5 }))
        : _0x3b8f29['_videoTimelineClips'](_0xb32d26)['map']((_0x1cbaa4) => ({ ..._0x1cbaa4 })),
    _0x3173b3 = Math['max'](0x0, Math['trunc'](toNumber(_0x52b7b2['clipIndex'], 0x0))),
    _0x565566 = _0x3b8f29['_resolveTimelineDragDuration'](
      _0x4e8e7c,
      _0xb32d26,
      _0x1cfc8b,
      _0x46bb6d['currentTarget'],
      _0x3173b3,
    );
  if (_0x4e8e7c === 'video')
    (_0x3b8f29['_setActiveClipIndex'](_0x3173b3),
      _0x3b8f29['_selectClipIndex'](_0x3173b3),
      _0x3b8f29['_syncTrackActiveClipChrome'](
        _0x46bb6d['currentTarget']?.['closest']('.media-clip-track'),
        _0x4e8e7c,
      ));
  else
    _0x4e8e7c === 'audio' &&
      (_0x3b8f29['_setActiveAudioClipIndex'](_0x3173b3),
      _0x3b8f29['_selectAudioClipIndex'](_0x3173b3),
      _0x3b8f29['_syncTrackActiveClipChrome'](
        _0x46bb6d['currentTarget']?.['closest']('.media-clip-track'),
        _0x4e8e7c,
      ));
  try {
    _0x46bb6d['currentTarget']?.['setPointerCapture']?.(_0x46bb6d['pointerId']);
  } catch {}
  (_0x46bb6d['currentTarget']?.['classList']['add']('is-dragging'),
    _0x45f7da?.['classList']['add']('is-preview-dragging'));
  const _0x1a2172 = _0x3b8f29['_nextTimelineDragSessionId']();
  _0x3b8f29['_setTimelineDrag']({
    sessionId: _0x1a2172,
    kind: _0x4e8e7c,
    mode: 'move',
    clipIndex: _0x3173b3,
    startX: _0x46bb6d['clientX'],
    startY: _0x46bb6d['clientY'],
    startLaneIndex: _0x4e8e7c === 'audio' ? _0x3b8f29['_audioClipLaneIndex'](_0x1cfc8b[_0x3173b3]) : 0x0,
    startPlayheadSec: _0x3b8f29['_playheadSec'],
    startTrack: { ..._0xb32d26 },
    startClips: _0x1cfc8b,
    startMediaClip: _0x3b8f29['_mediaClip'],
    durationSec: _0x565566,
    startScrollLeft: toNumber(_0x4e8604?.['scrollLeft'], 0x0),
    latestClientX: _0x46bb6d['clientX'],
    latestClientY: _0x46bb6d['clientY'],
    segmentEl: _0x46bb6d['currentTarget'],
    rowEl: _0x45f7da,
    laneEl: _0x44c99b,
    timelineEl: _0x4ffe3f,
    scrollEl: _0x4e8604,
    pendingDeltaSec: 0x0,
    pendingLaneIndex: _0x4e8e7c === 'audio' ? _0x3b8f29['_audioClipLaneIndex'](_0x1cfc8b[_0x3173b3]) : 0x0,
    hasMoved: ![],
  });
  const _0x26d669 = (_0x19487e) => handleMediaClipTimelineDrag(_0x3b8f29, _0x19487e, _0x1a2172),
    _0x653e1b = (_0x5a1098) => {
      stopPointer(_0x5a1098);
      if (!_0x3b8f29['_isTimelineDragSession'](_0x1a2172)) return;
      const _0x4d7c44 = _0x3b8f29['_timelineDrag']();
      _0x3b8f29['_persistTimelineDragScroll'](_0x4d7c44);
      if (
        _0x4d7c44?.['hasMoved'] &&
        _0x4d7c44['kind'] === 'video' &&
        _0x4d7c44['startClips']?.[_0x4d7c44['clipIndex']]
      ) {
        commitMediaClipTimelineEdit(_0x3b8f29, 'video', 'move', _0x4d7c44, { persist: ![] });
        const _0x1afb3a = _0x4d7c44;
        (detachMediaClipTimelineEditDrag(_0x3b8f29),
          _0x3b8f29['_animateTrackVisualsToCurrentState'](_0x4d7c44['rowEl'], 'video', {
            durationSec: _0x4d7c44['previewDurationSec'],
            persist: !![],
            commitHistory: !![],
            syncTimelineWidthAfterSettle: ![],
          }),
          _0x3b8f29['_applyDeferredTimelineDragUpdate'](_0x1afb3a));
        return;
      }
      if (
        _0x4d7c44?.['hasMoved'] &&
        _0x4d7c44['kind'] === 'audio' &&
        _0x4d7c44['startClips']?.[_0x4d7c44['clipIndex']]
      ) {
        commitMediaClipTimelineEdit(_0x3b8f29, 'audio', 'move', _0x4d7c44, { persist: ![] });
        const _0x14be67 = _0x4d7c44;
        (detachMediaClipTimelineEditDrag(_0x3b8f29),
          _0x3b8f29['_animateTrackVisualsToCurrentState'](_0x4d7c44['rowEl'], 'audio', {
            durationSec: _0x4d7c44['previewDurationSec'],
            persist: !![],
            commitHistory: !![],
            syncTimelineWidthAfterSettle: ![],
          }),
          _0x3b8f29['_applyDeferredTimelineDragUpdate'](_0x14be67));
        return;
      } else
        _0x4d7c44?.['hasMoved'] &&
          (appStore['updateNodeData'](_0x3b8f29['id'], { mediaClip: _0x3b8f29['_mediaClip'] }),
          (_0x3b8f29['nodeData'] = { ...(_0x3b8f29['nodeData'] || {}), mediaClip: _0x3b8f29['_mediaClip'] }),
          commit());
      !_0x4d7c44?.['hasMoved'] &&
        ((_0x3b8f29['_suppressTrackClick'] = !![]),
        _0x3b8f29['_setTimelinePlayheadFromPointer'](
          _0x4d7c44?.['rowEl'],
          _0x4d7c44?.['kind'],
          _0x5a1098,
          _0x4d7c44?.['durationSec'],
          { clipIndex: _0x4d7c44?.['clipIndex'] },
        ));
      const _0x24d4f8 = _0x4d7c44;
      detachMediaClipTimelineEditDrag(_0x3b8f29);
      if (_0x4d7c44?.['hasMoved']) _0x3b8f29['_render']();
      _0x3b8f29['_applyDeferredTimelineDragUpdate'](_0x24d4f8);
    };
  ((_0x3b8f29['_dragMove'] = _0x26d669),
    (_0x3b8f29['_dragUp'] = _0x653e1b),
    window['addEventListener']('pointermove', _0x26d669, !![]),
    window['addEventListener']('pointerup', _0x653e1b, { once: !![], capture: !![] }));
}
export function handleMediaClipTimelineDrag(_0x2d62df, _0x4bc1bb, _0x49222d = null) {
  const _0x57ad17 = _0x2d62df['_timelineDrag']();
  if (!_0x57ad17) return;
  if (_0x49222d != null && _0x57ad17['sessionId'] !== _0x49222d) return;
  (stopPointer(_0x4bc1bb),
    (_0x57ad17['latestClientX'] = toNumber(
      _0x4bc1bb?.['clientX'],
      _0x57ad17['latestClientX'] ?? _0x57ad17['startX'],
    )),
    (_0x57ad17['latestClientY'] = toNumber(
      _0x4bc1bb?.['clientY'],
      _0x57ad17['latestClientY'] ?? _0x57ad17['startY'],
    )),
    applyMediaClipTimelineDragPreviewFromPointer(_0x2d62df, _0x57ad17, _0x4bc1bb),
    _0x2d62df['_scheduleTimelineDragAutoScroll'](_0x57ad17));
}
export function applyMediaClipTimelineDragPreviewFromPointer(
  _0x3ac491,
  _0xbde93c = _0x3ac491['_timelineDrag'](),
  _0x324428 = {},
) {
  if (!_0xbde93c) return;
  const _0x40c6fb = _0x3ac491['_timelineRowForDrag'](_0xbde93c),
    _0x44e684 =
      _0xbde93c['durationSec'] ??
      _0x3ac491['_resolveTimelineDragDuration'](
        _0xbde93c['kind'],
        _0xbde93c['startTrack'],
        _0xbde93c['startClips'],
        _0xbde93c['segmentEl'],
        _0xbde93c['clipIndex'],
      );
  if (_0xbde93c['mode'] === 'move') {
    (_0x3ac491['_syncTimelineHoverPlayheadFromPointer'](_0x40c6fb, _0x324428, _0x44e684),
      handleMediaClipTimelineSegmentDrag(_0x3ac491, _0x324428));
    return;
  }
  _0xbde93c['mode'] === 'trim' && _0x3ac491['_hideTimelineHoverPlayhead'](_0x40c6fb);
  const _0x30ef75 = _0x40c6fb?.['getBoundingClientRect'](),
    _0x207f15 = Math['max'](0x1, toNumber(_0x30ef75?.['width'], readLayoutWidthPx(_0x40c6fb, 0x1))),
    _0x1421a0 = getMediaClipTimelineDeltaSecFromPx(_0x3ac491['_timelineDragDeltaPx'](_0xbde93c, _0x324428), {
      durationSec: _0x44e684,
      trackWidthPx: _0x207f15,
    });
  if (_0xbde93c['kind'] === 'video' && _0xbde93c['startClips']?.[_0xbde93c['clipIndex']]) {
    previewMediaClipTimelineTrimDrag(_0x3ac491, 'video', _0xbde93c, _0x1421a0, _0x44e684, _0x40c6fb);
    return;
  } else {
    if (_0xbde93c['kind'] === 'audio' && _0xbde93c['startClips']?.[_0xbde93c['clipIndex']]) {
      previewMediaClipTimelineTrimDrag(_0x3ac491, 'audio', _0xbde93c, _0x1421a0, _0x44e684, _0x40c6fb);
      return;
    } else {
      const _0x32a272 =
        _0xbde93c['side'] === 'left'
          ? { startSec: _0xbde93c['startTrack']['startSec'] + _0x1421a0 }
          : { endSec: _0xbde93c['startTrack']['endSec'] + _0x1421a0 };
      _0x3ac491['_mediaClip'] = patchMediaClipTrackRange(
        _0x3ac491['_mediaClip'],
        _0xbde93c['kind'],
        _0x32a272,
      );
      const _0x151c52 = _0x3ac491['_mediaClip']['tracks']?.[_0xbde93c['kind']];
      _0x151c52 &&
        (_0x3ac491['_playheadSec'] =
          _0xbde93c['side'] === 'left' ? _0x151c52['startSec'] : _0x151c52['endSec']);
    }
  }
  (!(_0xbde93c['kind'] === 'audio' && _0xbde93c['startClips']?.[_0xbde93c['clipIndex']]) &&
    _0xbde93c['kind'] !== 'video' &&
    _0x3ac491['_updateTrackVisuals'](_0xbde93c['kind']),
    _0x3ac491['_syncPreviewTime'](
      _0xbde93c['kind'],
      _0x3ac491['_previewSourceSecForTimelineSec'](_0xbde93c['kind'], _0x3ac491['_playheadSec']),
    ));
}
export function handleMediaClipTimelineSegmentDrag(_0x561f2e, _0x418ec0) {
  const _0xe2f3bb = _0x561f2e['_timelineDrag']();
  if (!_0xe2f3bb) return;
  const _0x2f65a5 = _0x561f2e['_timelineRowForDrag'](_0xe2f3bb),
    _0x2f0ab6 = _0x2f65a5?.['getBoundingClientRect'](),
    _0x4e3544 = Math['max'](0x1, toNumber(_0x2f0ab6?.['width'], readLayoutWidthPx(_0x2f65a5, 0x1))),
    _0x4741c5 =
      _0xe2f3bb['durationSec'] ??
      _0x561f2e['_resolveTimelineDragDuration'](
        _0xe2f3bb['kind'],
        _0xe2f3bb['startTrack'],
        _0xe2f3bb['startClips'],
        _0xe2f3bb['segmentEl'],
        _0xe2f3bb['clipIndex'],
      ),
    _0x201d82 = _0x561f2e['_timelineDragDeltaPx'](_0xe2f3bb, _0x418ec0),
    _0x27a000 =
      _0xe2f3bb['kind'] === 'audio' && _0xe2f3bb['mode'] === 'move'
        ? toNumber(_0xe2f3bb['latestClientY'], toNumber(_0x418ec0?.['clientY'], _0xe2f3bb['startY'])) -
          toNumber(_0xe2f3bb['startY'], 0x0)
        : 0x0,
    _0x2c2c9f =
      _0xe2f3bb['kind'] === 'audio' && _0xe2f3bb['mode'] === 'move'
        ? Math['max'](Math['abs'](_0x201d82), Math['abs'](_0x27a000))
        : Math['abs'](_0x201d82);
  if (!_0xe2f3bb['hasMoved'] && _0x2c2c9f <= 0x3) return;
  ((_0xe2f3bb['hasMoved'] = !![]),
    _0xe2f3bb['laneEl']?.['classList']['add']('is-moving'),
    _0xe2f3bb['timelineEl']?.['classList']['add']('is-moving-material'),
    (_0x561f2e['_suppressTrackClick'] = !![]));
  const _0x2a9a6c = getMediaClipTimelineDeltaSecFromPx(_0x201d82, {
    durationSec: _0x4741c5,
    trackWidthPx: _0x4e3544,
  });
  if (_0xe2f3bb['kind'] === 'video' && _0xe2f3bb['startClips']?.[_0xe2f3bb['clipIndex']])
    previewMediaClipTimelineMoveDrag(_0x561f2e, 'video', _0xe2f3bb, _0x2a9a6c, _0x4741c5);
  else {
    if (_0xe2f3bb['kind'] === 'audio' && _0xe2f3bb['startClips']?.[_0xe2f3bb['clipIndex']])
      previewMediaClipTimelineMoveDrag(_0x561f2e, 'audio', _0xe2f3bb, _0x2a9a6c, _0x4741c5);
    else {
      const _0x906d1b = {
        ..._0x561f2e['_mediaClip'],
        tracks: {
          ...(_0x561f2e['_mediaClip']['tracks'] || {}),
          [_0xe2f3bb['kind']]: _0xe2f3bb['startTrack'],
        },
      };
      _0x561f2e['_mediaClip'] = shiftMediaClipTrackRange(_0x906d1b, _0xe2f3bb['kind'], _0x2a9a6c);
      const _0x2bc76d = _0x561f2e['_mediaClip']['tracks']?.[_0xe2f3bb['kind']];
      if (_0x2bc76d) {
        const _0x130d4f = _0x2bc76d['startSec'] - _0xe2f3bb['startTrack']['startSec'];
        _0x561f2e['_playheadSec'] = Math['max'](
          _0x2bc76d['startSec'],
          Math['min'](_0x2bc76d['endSec'], _0xe2f3bb['startPlayheadSec'] + _0x130d4f),
        );
      }
    }
  }
  (!(_0xe2f3bb['kind'] === 'audio' && _0xe2f3bb['startClips']?.[_0xe2f3bb['clipIndex']]) &&
    _0xe2f3bb['kind'] !== 'video' &&
    _0x561f2e['_updateTrackVisuals'](_0xe2f3bb['kind']),
    _0x561f2e['_syncPreviewTime'](
      _0xe2f3bb['kind'],
      _0x561f2e['_previewSourceSecForTimelineSec'](_0xe2f3bb['kind'], _0x561f2e['_playheadSec']),
    ));
}
