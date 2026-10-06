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
function mediaClipText(value, item = {}) {
  return t('mediaClip.' + value, item);
}
function timelineEditClipIndex(value2 = null) {
  return Math.max(0, Math.trunc(toNumber(value2?.clipIndex, 0)));
}
function timelineEditClips(value3 = null) {
  return Array.isArray(value3?.startClips) ? value3.startClips : [];
}
function timelineEditBaseState(args = {}, key = 'video', index = null) {
  const audioClips = timelineEditClips(index);
  return {
    ...args,
    ...(key === 'audio' ? { audioClips: audioClips } : { clips: audioClips }),
    tracks: { ...(args.tracks || {}), [key]: index?.startTrack },
  };
}
function findCommittedClipIndex(options = {}, result = 'video', data = null, target = -1) {
  const timelineEditClipIndex2 = timelineEditClipIndex(data),
    timelineEditClips2 = timelineEditClips(data),
    text = normalizeText(timelineEditClips2[timelineEditClipIndex2]?.id);
  if (!text) return target;
  const list = result === 'audio' ? options.audioClips : options.clips;
  return list?.findIndex((source) => normalizeText(source?.id) === text) ?? target;
}
function buildFirstVideoLeftTrimPreviewState(args2 = {}, next = {}, startSec = {}) {
  const list2 = timelineEditClips(next),
    timelineEditClipIndex3 = timelineEditClipIndex(next),
    current = list2[timelineEditClipIndex3] || {},
    entry = Math.max(
      0,
      toNumber(startSec.endSec, current.endSec) - toNumber(startSec.startSec, current.startSec),
    ),
    record = Math.max(
      0,
      toNumber(
        current.timelineEndSec,
        toNumber(current.timelineStartSec, 0) +
          Math.max(0, toNumber(current.endSec, 0) - toNumber(current.startSec, 0)),
      ),
    ),
    payload = record - entry,
    handle = payload + entry,
    clips = list2.map((args3, state) =>
      state === timelineEditClipIndex3
        ? {
            ...args3,
            startSec: startSec.startSec,
            endSec: startSec.endSec,
            timelineStartSec: Math.round(payload * 1000) / 1000,
            timelineEndSec: Math.round(handle * 1000) / 1000,
          }
        : { ...args3 },
    );
  return {
    ...args2,
    clips: clips,
    tracks: {
      ...(args2.tracks || {}),
      video: {
        ...(next.startTrack || {}),
        startSec: startSec.startSec,
        endSec: startSec.endSec,
      },
    },
  };
}
export function isMediaClipVideoLeftTrimDrag(value4 = null) {
  const timelineEditClipIndex4 = timelineEditClipIndex(value4);
  return (
    value4?.kind === 'video' &&
    value4?.side === 'left' &&
    !!timelineEditClips(value4)[timelineEditClipIndex4]
  );
}
export function isMediaClipRollingVideoLeftTrimDrag(value5 = null) {
  return isMediaClipVideoLeftTrimDrag(value5) && timelineEditClipIndex(value5) > 0;
}
export function resolveMediaClipTimelineTrimPreview({
  mediaClip: mediaClip = {},
  kind: kind = 'video',
  drag: drag = null,
  deltaSec: deltaSec = 0,
  durationSec: durationSec = 0,
} = {}) {
  const clipIndex = timelineEditClipIndex(drag),
    timelineEditClips3 = timelineEditClips(drag),
    startSec2 = timelineEditClips3[clipIndex];
  if (!startSec2) return null;
  const args4 =
      drag?.side === 'left'
        ? { startSec: startSec2.startSec + deltaSec }
        : { endSec: startSec2.endSec + deltaSec },
    startSec3 = clampMediaClipRange({ ...startSec2, ...args4 }, startSec2.durationSec),
    args5 = { startSec: startSec3.startSec, endSec: startSec3.endSec },
    timelineEditBaseState2 = timelineEditBaseState(mediaClip, kind, drag);
  let previewState,
    pendingRollRange = null;
  if (kind === 'audio') previewState = patchMediaClipAudioClipRange(timelineEditBaseState2, clipIndex, args5);
  else {
    if (isMediaClipRollingVideoLeftTrimDrag(drag))
      ((pendingRollRange = { ...args5 }),
        (previewState = rollMediaClipVisualLeftTrim(timelineEditBaseState2, clipIndex, args5)));
    else
      isMediaClipVideoLeftTrimDrag(drag)
        ? (previewState = buildFirstVideoLeftTrimPreviewState(timelineEditBaseState2, drag, startSec3))
        : (previewState = patchMediaClipClipRange(timelineEditBaseState2, clipIndex, args5));
  }
  const previewClips =
      (kind === 'audio' ? previewState.audioClips : previewState.clips) || timelineEditClips3,
    previewClip = previewClips[clipIndex] || startSec2,
    timelineStartSec = toNumber(previewClip.timelineStartSec, 0),
    timelineEndSec = Math.max(timelineStartSec, toNumber(previewClip.timelineEndSec, timelineStartSec)),
    pendingRange = {
      startSec: toNumber(previewClip.startSec, startSec3.startSec),
      endSec: toNumber(previewClip.endSec, startSec3.endSec),
    };
  return {
    kind: kind,
    clipIndex: clipIndex,
    previewState: previewState,
    previewClips: previewClips,
    previewClip: previewClip,
    pendingRange: pendingRange,
    pendingRollRange: pendingRollRange,
    pendingPlayheadSec: drag?.side === 'left' ? timelineStartSec : timelineEndSec,
    displayDurationSec: getMediaClipTimelineDisplayDuration(durationSec),
    timelineStartSec: timelineStartSec,
    timelineEndSec: timelineEndSec,
    clipDurationSec: Math.max(0, timelineEndSec - timelineStartSec),
    sourcePreviewSec: drag?.side === 'left' ? pendingRange.startSec : pendingRange.endSec,
  };
}
export function resolveMediaClipTimelineMovePreview({
  kind: kind = 'video',
  drag: drag = null,
  deltaSec: deltaSec = 0,
  durationSec: durationSec = 0,
  laneIndex: laneIndex = null,
} = {}) {
  const clipIndex2 = timelineEditClipIndex(drag),
    clip = timelineEditClips(drag)[clipIndex2];
  if (!clip) return null;
  const displayDurationSec = getMediaClipTimelineDisplayDuration(durationSec),
    toNumber2 = toNumber(clip.timelineStartSec, 0),
    config = Math.max(toNumber2, toNumber(clip.timelineEndSec, toNumber2)),
    clipDurationSec = Math.max(0.1, config - toNumber2),
    timelineStartSec2 =
      kind === 'video'
        ? Math.max(
            0,
            Math.min(Math.max(0, displayDurationSec - clipDurationSec), toNumber2 + deltaSec),
          )
        : Math.max(0, toNumber2 + deltaSec),
    pendingDeltaSec = timelineStartSec2 - toNumber2,
    pendingLaneIndex =
      kind === 'audio' ? normalizeMediaClipAudioLaneIndex(laneIndex ?? drag?.startLaneIndex) : 0;
  return {
    kind: kind,
    clipIndex: clipIndex2,
    clip: clip,
    displayDurationSec: displayDurationSec,
    timelineStartSec: timelineStartSec2,
    timelineEndSec: timelineStartSec2 + clipDurationSec,
    clipDurationSec: clipDurationSec,
    pendingDeltaSec: pendingDeltaSec,
    pendingLaneIndex: pendingLaneIndex,
    pendingPlayheadSec: Math.max(
      timelineStartSec2,
      Math.min(
        timelineStartSec2 + clipDurationSec,
        toNumber(drag?.startPlayheadSec, 0) + pendingDeltaSec,
      ),
    ),
  };
}
export function commitMediaClipTimelineEditTransaction({
  mediaClip: mediaClip = {},
  kind: kind = 'video',
  mode: mode = 'trim',
  drag: drag = null,
} = {}) {
  const timelineEditClipIndex5 = timelineEditClipIndex(drag),
    timelineEditClips4 = timelineEditClips(drag);
  if (!timelineEditClips4[timelineEditClipIndex5]) return null;
  const timelineEditBaseState3 = timelineEditBaseState(mediaClip, kind, drag);
  let mediaClip2 = timelineEditBaseState3;
  if (mode === 'trim' && kind === 'video')
    mediaClip2 = isMediaClipRollingVideoLeftTrimDrag(drag)
      ? rollMediaClipVisualLeftTrim(
          timelineEditBaseState3,
          timelineEditClipIndex5,
          drag?.pendingRollRange || drag?.pendingRange,
          { rebaseNegativeTimeline: true, rebaseTimelineStart: true },
        )
      : patchMediaClipClipRange(timelineEditBaseState3, timelineEditClipIndex5, drag?.pendingRange);
  else {
    if (mode === 'trim' && kind === 'audio')
      mediaClip2 = patchMediaClipAudioClipRange(
        timelineEditBaseState3,
        timelineEditClipIndex5,
        drag?.pendingRange,
      );
    else {
      if (mode === 'move' && kind === 'video')
        mediaClip2 = moveMediaClipClipOnTimeline(
          timelineEditBaseState3,
          timelineEditClipIndex5,
          drag?.pendingDeltaSec,
        );
      else {
        if (mode === 'move' && kind === 'audio')
          mediaClip2 = moveMediaClipAudioClipOnTimeline(
            timelineEditBaseState3,
            timelineEditClipIndex5,
            drag?.pendingDeltaSec,
            {
              laneIndex: drag?.pendingLaneIndex,
            },
          );
        else return null;
      }
    }
  }
  const scope = mode === 'move' && kind === 'video' ? -1 : timelineEditClipIndex5;
  return {
    kind: kind,
    mode: mode,
    mediaClip: mediaClip2,
    activeClipIndex: findCommittedClipIndex(mediaClip2, kind, drag, scope),
  };
}
export function previewMediaClipTimelineTrimDrag(
  mediaClip3,
  kind2,
  drag2,
  deltaSec2 = 0,
  durationSec2 = 0,
  input = null,
) {
  const enabled = drag2?.segmentEl;
  if (!enabled) return;
  const startSec4 = resolveMediaClipTimelineTrimPreview({
    mediaClip: mediaClip3._mediaClip,
    kind: kind2,
    drag: drag2,
    deltaSec: deltaSec2,
    durationSec: durationSec2,
  });
  if (!startSec4) return;
  drag2.pendingRange = startSec4.pendingRange;
  kind2 === 'video' && (drag2.pendingRollRange = startSec4.pendingRollRange);
  ((drag2.previewDurationSec = startSec4.displayDurationSec),
    (drag2.pendingPlayheadSec = startSec4.pendingPlayheadSec),
    (drag2.hasMoved = true));
  const output = input || drag2.rowEl;
  if (kind2 === 'video') {
    !mediaClip3._applyVideoTimelinePreview(
      output,
      startSec4.previewClips,
      startSec4.displayDurationSec,
    ) &&
      (mediaClip3._applyTimelineSegmentRect(
        enabled,
        mediaClip3._timelinePreviewRangeRect({
          startSec: startSec4.timelineStartSec,
          endSec: startSec4.timelineEndSec,
          durationSec: startSec4.displayDurationSec,
        }),
      ),
      mediaClip3._updateTimelineSegmentLabel(enabled, startSec4.clipDurationSec));
    const materialEndSec = mediaClip3._videoTimelineMaterialEnd(
      startSec4.previewState.tracks?.video,
      startSec4.previewClips,
    );
    (mediaClip3._syncTimelineAddSlotForRow(output, {
      displayDurationSec: startSec4.displayDurationSec,
      materialEndSec: materialEndSec,
    }),
      mediaClip3._updateTrackPlayheadVisual(output, startSec4.displayDurationSec, {
        playheadSec: drag2.startPlayheadSec,
      }));
    const toNumber3 = toNumber(drag2.startPlayheadSec, mediaClip3._playheadSec);
    (mediaClip3._syncVideoPreviewSourceForTimelineSec(toNumber3, { clips: startSec4.previewClips }),
      mediaClip3._syncPreviewTime(
        'video',
        mediaClip3._videoSourceSecForTimelineSec(toNumber3, startSec4.previewClips),
      ));
    return;
  }
  (!mediaClip3._applyAudioTimelinePreview(
    output,
    startSec4.previewClips,
    startSec4.displayDurationSec,
  ) &&
    (mediaClip3._applyAudioTimelineSegmentRect(
      enabled,
      getMediaClipTimelineRangeRect({
        startSec: startSec4.timelineStartSec,
        endSec: startSec4.timelineEndSec,
        durationSec: startSec4.displayDurationSec,
      }),
    ),
    mediaClip3._updateTimelineSegmentLabel(enabled, startSec4.clipDurationSec),
    mediaClip3._syncAudioSegmentWaveformViewport(enabled, startSec4.previewClip)),
    mediaClip3._updateTrackPlayheadVisual(output, startSec4.displayDurationSec, {
      playheadSec: drag2.startPlayheadSec,
    }),
    mediaClip3._syncPreviewTime('audio', startSec4.sourcePreviewSec));
}
export function previewMediaClipTimelineMoveDrag(value6, kind3, drag3, deltaSec3 = 0, durationSec3 = 0) {
  const el = drag3?.segmentEl;
  if (!el) return;
  const laneIndex2 = kind3 === 'audio' ? value6._audioLaneIndexFromDrag(drag3) : 0,
    startSec5 = resolveMediaClipTimelineMovePreview({
      kind: kind3,
      drag: drag3,
      deltaSec: deltaSec3,
      durationSec: durationSec3,
      laneIndex: laneIndex2,
    });
  if (!startSec5) return;
  if (kind3 === 'video')
    value6._applyTimelineSegmentRect(
      el,
      getMediaClipTimelineRangeRect({
        startSec: startSec5.timelineStartSec,
        endSec: startSec5.timelineEndSec,
        durationSec: startSec5.displayDurationSec,
      }),
    );
  else {
    const value7 = value6._audioLaneCount(drag3.startClips, {
      previewLaneIndex: startSec5.pendingLaneIndex,
    });
    (value6._setAudioSegmentLaneVisual(el, startSec5.pendingLaneIndex),
      el.classList?.toggle?.(
        'is-lane-preview',
        startSec5.pendingLaneIndex !== normalizeMediaClipAudioLaneIndex(drag3.startLaneIndex),
      ),
      value6._setAudioLaneCountStyle(drag3.rowEl, value7),
      value6._setAudioLaneCountStyle(drag3.rowEl?.parentElement, value7),
      value6._setAudioLaneCountStyle(drag3.laneEl, value7),
      value6._setAudioLaneCountStyle(drag3.timelineEl, value7),
      value6._setAudioLaneCountStyle(
        drag3.laneEl?.querySelector?.('.media-clip-audio-lane-controls'),
        value7,
      ),
      value6._applyAudioTimelineSegmentRect(
        el,
        getMediaClipTimelineRangeRect({
          startSec: startSec5.timelineStartSec,
          endSec: startSec5.timelineEndSec,
          durationSec: startSec5.displayDurationSec,
        }),
      ));
  }
  (value6._updateTimelineSegmentLabel(el, startSec5.clipDurationSec),
    (drag3.previewDurationSec = startSec5.displayDurationSec),
    (drag3.pendingDeltaSec = startSec5.pendingDeltaSec),
    kind3 === 'audio' &&
      ((drag3.pendingLaneIndex = startSec5.pendingLaneIndex),
      (drag3.pendingPlayheadSec = startSec5.pendingPlayheadSec)));
}
export function commitMediaClipTimelineEdit(mediaClip4, kind4, mode2, drag4, value8 = {}) {
  const commitMediaClipTimelineEditTransaction2 = commitMediaClipTimelineEditTransaction({
    mediaClip: mediaClip4._mediaClip,
    kind: kind4,
    mode: mode2,
    drag: drag4,
  });
  if (!commitMediaClipTimelineEditTransaction2) return;
  mediaClip4._mediaClip = commitMediaClipTimelineEditTransaction2.mediaClip;
  const count = commitMediaClipTimelineEditTransaction2.activeClipIndex;
  if (count >= 0 && kind4 === 'video')
    (mediaClip4._setActiveClipIndex(count), mediaClip4._selectClipIndex(count));
  else
    count >= 0 &&
      kind4 === 'audio' &&
      (mediaClip4._setActiveAudioClipIndex(count), mediaClip4._selectAudioClipIndex(count));
  if (mode2 === 'trim' && kind4 === 'video') {
    const value9 = mediaClip4._mediaClip.clips?.[count >= 0 ? count : timelineEditClipIndex(drag4)];
    if (value9) {
      const value10 = mediaClip4._videoTimelineDuration(mediaClip4._mediaClip.tracks?.video),
        displayDurationSec2 = getMediaClipTimelineDisplayDuration(
          toNumber(drag4?.durationSec, toNumber(drag4?.previewDurationSec, value10)),
        );
      ((mediaClip4._playheadSec = Math.max(
        0,
        Math.min(displayDurationSec2, toNumber(drag4?.startPlayheadSec, mediaClip4._playheadSec)),
      )),
        mediaClip4._syncTimelineAddSlotForRow(drag4?.rowEl, {
          displayDurationSec: displayDurationSec2,
          materialEndSec: mediaClip4._videoTimelineMaterialEnd(
            mediaClip4._mediaClip.tracks?.video,
          ),
        }),
        mediaClip4._syncVideoPreviewSourceForTimelineSec(mediaClip4._playheadSec),
        mediaClip4._syncPreviewTime(
          'video',
          mediaClip4._videoSourceSecForPlayhead(mediaClip4._playheadSec),
        ));
    }
  } else {
    if (mode2 === 'trim' && kind4 === 'audio') {
      const value11 = mediaClip4._timelineDurationForKind('audio'),
        displayDurationSec3 = getMediaClipTimelineDisplayDuration(
          toNumber(drag4?.durationSec, toNumber(drag4?.previewDurationSec, value11)),
        );
      ((mediaClip4._playheadSec = Math.max(
        0,
        Math.min(displayDurationSec3, toNumber(drag4?.startPlayheadSec, mediaClip4._playheadSec)),
      )),
        mediaClip4._syncTimelineAddSlotForRow(drag4?.rowEl, {
          displayDurationSec: displayDurationSec3,
          materialEndSec: mediaClip4._timelineMaterialEndSec(),
        }),
        mediaClip4._syncAudioPreviewSourceForTimelineSec(mediaClip4._playheadSec),
        mediaClip4._syncPreviewTime(
          'audio',
          mediaClip4._audioSourceSecForPlayhead(mediaClip4._playheadSec),
        ));
    } else {
      if (mode2 === 'move' && kind4 === 'video') {
        const value12 = mediaClip4._videoTimelineDuration(mediaClip4._mediaClip.tracks?.video);
        mediaClip4._playheadSec = Math.max(
          0,
          Math.min(value12, toNumber(drag4?.startPlayheadSec, mediaClip4._playheadSec)),
        );
      } else {
        if (mode2 === 'move' && kind4 === 'audio') {
          const value13 = mediaClip4._timelineDurationForKind('audio');
          ((mediaClip4._playheadSec = Math.max(0, Math.min(value13, mediaClip4._playheadSec))),
            mediaClip4._syncTimelineAddSlotForRow(drag4?.rowEl, {
              displayDurationSec: drag4?.previewDurationSec,
              materialEndSec: mediaClip4._timelineMaterialEndSec(),
            }),
            mediaClip4._syncAudioPreviewSourceForTimelineSec(mediaClip4._playheadSec),
            mediaClip4._syncPreviewTime(
              'audio',
              mediaClip4._audioSourceSecForPlayhead(mediaClip4._playheadSec),
            ));
        }
      }
    }
  }
  ((mediaClip4.nodeData = { ...(mediaClip4.nodeData || {}), mediaClip: mediaClip4._mediaClip }),
    value8.persist !== false &&
      appStore.updateNodeData(mediaClip4.id, { mediaClip: mediaClip4._mediaClip }));
}
export function renderMediaClipTimelineTrimHandle(startMediaClip, kind5, side, value14 = {}) {
  const el2 = document.createElement('button');
  ((el2.type = 'button'),
    (el2.className = 'media-clip-trim media-clip-trim-' + side),
    (el2.dataset.clipIndex = String(
      Math.max(0, Math.trunc(toNumber(value14.clipIndex, 0))),
    )),
    el2.setAttribute('aria-label', mediaClipText(side === 'left' ? 'trim.left' : 'trim.right')));
  const el3 = document.createElement('span');
  return (
    (el3.className = 'media-clip-trim-visual'),
    el3.setAttribute('aria-hidden', 'true'),
    el2.appendChild(el3),
    el2.addEventListener('pointerenter', () => {
      const el4 = el2.closest('.media-clip-segment'),
        value15 = el4?.closest('.media-clip-track') || null;
      (el4?.querySelectorAll?.('.media-clip-trim.is-hovered')?.forEach((el5) => {
        if (el5 !== el2) el5.classList.remove('is-hovered');
      }),
        el2.classList.add('is-hovered'),
        el4 && startMediaClip._setTimelineHoverSegment(value15, el4, kind5, value14.clipIndex));
    }),
    el2.addEventListener('pointerleave', () => {
      if (!startMediaClip._timelineDrag()) el2.classList.remove('is-hovered');
    }),
    el2.addEventListener('pointerdown', (startX) => {
      (stopPointer(startX),
        startMediaClip._cancelTimelineSettle(),
        startMediaClip._stopTimelineDragAutoScroll(),
        (startMediaClip._deferredTimelineDragNodeData = null),
        el2.classList.add('is-hovered'));
      try {
        el2.setPointerCapture?.(startX.pointerId);
      } catch {}
      const value16 = startMediaClip._mediaClip.tracks?.[kind5],
        clipIndex3 = Math.max(0, Math.trunc(toNumber(value14.clipIndex, 0)));
      if (kind5 === 'video')
        (startMediaClip._setActiveClipIndex(clipIndex3), startMediaClip._selectClipIndex(clipIndex3));
      else
        kind5 === 'audio' &&
          (startMediaClip._setActiveAudioClipIndex(clipIndex3),
          startMediaClip._selectAudioClipIndex(clipIndex3));
      const segmentEl = el2.closest('.media-clip-segment'),
        rowEl = segmentEl?.closest('.media-clip-track') || null,
        laneEl = segmentEl?.closest('.media-clip-timeline-lane') || null,
        scrollEl = segmentEl?.closest('.media-clip-timeline-scroll') || null,
        startClips =
          kind5 === 'audio'
            ? startMediaClip._audioTimelineClips(value16).map((args6) => ({ ...args6 }))
            : startMediaClip._videoTimelineClips(value16).map((args7) => ({ ...args7 })),
        durationSec4 = startMediaClip._resolveTimelineDragDuration(
          kind5,
          value16,
          startClips,
          segmentEl,
          clipIndex3,
        );
      segmentEl && startMediaClip._setTimelineHoverSegment(rowEl, segmentEl, kind5, clipIndex3);
      (segmentEl?.classList.add('is-trimming'),
        rowEl?.classList.add('is-trimming'),
        laneEl?.classList.add('is-trimming'),
        scrollEl?.classList.add('is-trimming'));
      const sessionId = startMediaClip._nextTimelineDragSessionId();
      startMediaClip._setTimelineDrag({
        sessionId: sessionId,
        kind: kind5,
        mode: 'trim',
        side: side,
        clipIndex: clipIndex3,
        startX: startX.clientX,
        startTrack: { ...(value16 || {}) },
        startClips: startClips,
        startMediaClip: startMediaClip._mediaClip,
        durationSec: durationSec4,
        startScrollLeft: toNumber(scrollEl?.scrollLeft, 0),
        latestClientX: startX.clientX,
        segmentEl: segmentEl,
        rowEl: rowEl,
        laneEl: laneEl,
        scrollEl: scrollEl,
        pendingRange: null,
        pendingPlayheadSec: startMediaClip._playheadSec,
        startPlayheadSec: startMediaClip._playheadSec,
        hasMoved: false,
      });
      const value17 = (value18) => handleMediaClipTimelineDrag(startMediaClip, value18, sessionId),
        value19 = (value20) => {
          stopPointer(value20);
          if (!startMediaClip._isTimelineDragSession(sessionId)) return;
          const durationSec5 = startMediaClip._timelineDrag();
          startMediaClip._persistTimelineDragScroll(durationSec5);
          if (durationSec5?.kind === 'video' && durationSec5.pendingRange) {
            const isMediaClipVideoLeftTrimDrag2 = isMediaClipVideoLeftTrimDrag(durationSec5);
            commitMediaClipTimelineEdit(startMediaClip, 'video', 'trim', durationSec5, { persist: false });
            const value21 = startMediaClip._videoTimelineDuration(
                startMediaClip._mediaClip.tracks?.video,
              ),
              durationSec6 = getMediaClipTimelineDisplayDuration(
                toNumber(durationSec5.durationSec, toNumber(durationSec5.previewDurationSec, value21)),
              ),
              value22 = durationSec5;
            detachMediaClipTimelineEditDrag(startMediaClip);
            isMediaClipVideoLeftTrimDrag2
              ? startMediaClip._animateTrackVisualsToCurrentState(durationSec5.rowEl, 'video', {
                  durationSec: durationSec6,
                  persist: true,
                  commitHistory: true,
                  syncTimelineWidthAfterSettle: false,
                })
              : (startMediaClip._updateTrackVisuals('video', {
                  durationSec: durationSec5.previewDurationSec,
                  syncTimelineWidth: false,
                }),
                startMediaClip._persistTimelineMediaClip({ commitHistory: true }));
            startMediaClip._applyDeferredTimelineDragUpdate(value22);
            return;
          }
          if (durationSec5?.kind === 'audio' && durationSec5.pendingRange) {
            commitMediaClipTimelineEdit(startMediaClip, 'audio', 'trim', durationSec5, { persist: false });
            const value23 = durationSec5;
            (detachMediaClipTimelineEditDrag(startMediaClip),
              startMediaClip._updateTrackVisuals('audio', {
                durationSec: durationSec5.previewDurationSec,
                syncTimelineWidth: false,
              }),
              startMediaClip._persistTimelineMediaClip({ commitHistory: true }),
              startMediaClip._applyDeferredTimelineDragUpdate(value23));
            return;
          }
          (appStore.updateNodeData(startMediaClip.id, { mediaClip: startMediaClip._mediaClip }),
            (startMediaClip.nodeData = {
              ...(startMediaClip.nodeData || {}),
              mediaClip: startMediaClip._mediaClip,
            }));
          const value24 = durationSec5;
          (detachMediaClipTimelineEditDrag(startMediaClip),
            startMediaClip._render(),
            commit(),
            startMediaClip._applyDeferredTimelineDragUpdate(value24));
        };
      ((startMediaClip._dragMove = value17),
        (startMediaClip._dragUp = value19),
        window.addEventListener('pointermove', value17, true),
        window.addEventListener('pointerup', value19, { once: true, capture: true }));
    }),
    el2
  );
}
export function detachMediaClipTimelineEditDrag(value25) {
  value25._dragMove && window.removeEventListener('pointermove', value25._dragMove, true);
  value25._dragUp && window.removeEventListener('pointerup', value25._dragUp, true);
  value25._stopTimelineDragAutoScroll();
  const value26 = value25._timelineDrag();
  (value26?.segmentEl?.classList.remove('is-dragging'),
    value26?.segmentEl?.classList.remove('is-trimming'),
    value26?.segmentEl?.classList.remove('is-lane-preview'),
    value26?.segmentEl?.querySelectorAll?.('.media-clip-trim.is-hovered')?.forEach((el6) => {
      el6.classList.remove('is-hovered');
    }),
    value26?.rowEl?.classList.remove('is-trimming'),
    value26?.rowEl?.classList.remove('is-preview-dragging'),
    value26?.laneEl?.classList.remove('is-trimming'),
    value26?.laneEl?.classList.remove('is-moving'),
    value26?.timelineEl?.classList.remove('is-moving-material'),
    value26?.scrollEl?.classList.remove('is-trimming'),
    (value25._dragMove = null),
    (value25._dragUp = null),
    value25._setTimelineDrag(null));
}
export function startMediaClipTimelineSegmentDrag(startPlayheadSec, kind6, startX2, value27 = {}) {
  if (value27.compact === true || startX2.button !== 0) return;
  (stopPointer(startX2),
    startPlayheadSec._cancelTimelineSettle(),
    startPlayheadSec._stopTimelineDragAutoScroll(),
    (startPlayheadSec._deferredTimelineDragNodeData = null));
  const args8 = startPlayheadSec._mediaClip.tracks?.[kind6];
  if (!args8) return;
  const rowEl2 = startX2.currentTarget?.closest('.media-clip-track') || null,
    scrollEl2 = rowEl2?.closest?.('.media-clip-timeline-scroll') || null,
    laneEl2 = rowEl2?.closest?.('.media-clip-timeline-lane') || null,
    timelineEl = rowEl2?.closest?.('.media-clip-compact-timeline') || null,
    startClips2 =
      kind6 === 'audio'
        ? startPlayheadSec._audioTimelineClips(args8).map((args9) => ({ ...args9 }))
        : startPlayheadSec._videoTimelineClips(args8).map((args10) => ({ ...args10 })),
    clipIndex4 = Math.max(0, Math.trunc(toNumber(value27.clipIndex, 0))),
    durationSec7 = startPlayheadSec._resolveTimelineDragDuration(
      kind6,
      args8,
      startClips2,
      startX2.currentTarget,
      clipIndex4,
    );
  if (kind6 === 'video')
    (startPlayheadSec._setActiveClipIndex(clipIndex4),
      startPlayheadSec._selectClipIndex(clipIndex4),
      startPlayheadSec._syncTrackActiveClipChrome(
        startX2.currentTarget?.closest('.media-clip-track'),
        kind6,
      ));
  else
    kind6 === 'audio' &&
      (startPlayheadSec._setActiveAudioClipIndex(clipIndex4),
      startPlayheadSec._selectAudioClipIndex(clipIndex4),
      startPlayheadSec._syncTrackActiveClipChrome(
        startX2.currentTarget?.closest('.media-clip-track'),
        kind6,
      ));
  try {
    startX2.currentTarget?.setPointerCapture?.(startX2.pointerId);
  } catch {}
  (startX2.currentTarget?.classList.add('is-dragging'),
    rowEl2?.classList.add('is-preview-dragging'));
  const sessionId2 = startPlayheadSec._nextTimelineDragSessionId();
  startPlayheadSec._setTimelineDrag({
    sessionId: sessionId2,
    kind: kind6,
    mode: 'move',
    clipIndex: clipIndex4,
    startX: startX2.clientX,
    startY: startX2.clientY,
    startLaneIndex:
      kind6 === 'audio' ? startPlayheadSec._audioClipLaneIndex(startClips2[clipIndex4]) : 0,
    startPlayheadSec: startPlayheadSec._playheadSec,
    startTrack: { ...args8 },
    startClips: startClips2,
    startMediaClip: startPlayheadSec._mediaClip,
    durationSec: durationSec7,
    startScrollLeft: toNumber(scrollEl2?.scrollLeft, 0),
    latestClientX: startX2.clientX,
    latestClientY: startX2.clientY,
    segmentEl: startX2.currentTarget,
    rowEl: rowEl2,
    laneEl: laneEl2,
    timelineEl: timelineEl,
    scrollEl: scrollEl2,
    pendingDeltaSec: 0,
    pendingLaneIndex:
      kind6 === 'audio' ? startPlayheadSec._audioClipLaneIndex(startClips2[clipIndex4]) : 0,
    hasMoved: false,
  });
  const value28 = (value29) => handleMediaClipTimelineDrag(startPlayheadSec, value29, sessionId2),
    value30 = (value31) => {
      stopPointer(value31);
      if (!startPlayheadSec._isTimelineDragSession(sessionId2)) return;
      const durationSec8 = startPlayheadSec._timelineDrag();
      startPlayheadSec._persistTimelineDragScroll(durationSec8);
      if (
        durationSec8?.hasMoved &&
        durationSec8.kind === 'video' &&
        durationSec8.startClips?.[durationSec8.clipIndex]
      ) {
        commitMediaClipTimelineEdit(startPlayheadSec, 'video', 'move', durationSec8, { persist: false });
        const value32 = durationSec8;
        (detachMediaClipTimelineEditDrag(startPlayheadSec),
          startPlayheadSec._animateTrackVisualsToCurrentState(durationSec8.rowEl, 'video', {
            durationSec: durationSec8.previewDurationSec,
            persist: true,
            commitHistory: true,
            syncTimelineWidthAfterSettle: false,
          }),
          startPlayheadSec._applyDeferredTimelineDragUpdate(value32));
        return;
      }
      if (
        durationSec8?.hasMoved &&
        durationSec8.kind === 'audio' &&
        durationSec8.startClips?.[durationSec8.clipIndex]
      ) {
        commitMediaClipTimelineEdit(startPlayheadSec, 'audio', 'move', durationSec8, { persist: false });
        const value33 = durationSec8;
        (detachMediaClipTimelineEditDrag(startPlayheadSec),
          startPlayheadSec._animateTrackVisualsToCurrentState(durationSec8.rowEl, 'audio', {
            durationSec: durationSec8.previewDurationSec,
            persist: true,
            commitHistory: true,
            syncTimelineWidthAfterSettle: false,
          }),
          startPlayheadSec._applyDeferredTimelineDragUpdate(value33));
        return;
      } else
        durationSec8?.hasMoved &&
          (appStore.updateNodeData(startPlayheadSec.id, { mediaClip: startPlayheadSec._mediaClip }),
          (startPlayheadSec.nodeData = {
            ...(startPlayheadSec.nodeData || {}),
            mediaClip: startPlayheadSec._mediaClip,
          }),
          commit());
      !durationSec8?.hasMoved &&
        ((startPlayheadSec._suppressTrackClick = true),
        startPlayheadSec._setTimelinePlayheadFromPointer(
          durationSec8?.rowEl,
          durationSec8?.kind,
          value31,
          durationSec8?.durationSec,
          { clipIndex: durationSec8?.clipIndex },
        ));
      const value34 = durationSec8;
      detachMediaClipTimelineEditDrag(startPlayheadSec);
      if (durationSec8?.hasMoved) startPlayheadSec._render();
      startPlayheadSec._applyDeferredTimelineDragUpdate(value34);
    };
  ((startPlayheadSec._dragMove = value28),
    (startPlayheadSec._dragUp = value30),
    window.addEventListener('pointermove', value28, true),
    window.addEventListener('pointerup', value30, { once: true, capture: true }));
}
export function handleMediaClipTimelineDrag(value35, event, value36 = null) {
  const enabled2 = value35._timelineDrag();
  if (!enabled2) return;
  if (value36 != null && enabled2.sessionId !== value36) return;
  (stopPointer(event),
    (enabled2.latestClientX = toNumber(
      event?.clientX,
      enabled2.latestClientX ?? enabled2.startX,
    )),
    (enabled2.latestClientY = toNumber(
      event?.clientY,
      enabled2.latestClientY ?? enabled2.startY,
    )),
    applyMediaClipTimelineDragPreviewFromPointer(value35, enabled2, event),
    value35._scheduleTimelineDragAutoScroll(enabled2));
}
export function applyMediaClipTimelineDragPreviewFromPointer(
  value37,
  startSec6 = value37._timelineDrag(),
  value38 = {},
) {
  if (!startSec6) return;
  const el7 = value37._timelineRowForDrag(startSec6),
    durationSec9 =
      startSec6.durationSec ??
      value37._resolveTimelineDragDuration(
        startSec6.kind,
        startSec6.startTrack,
        startSec6.startClips,
        startSec6.segmentEl,
        startSec6.clipIndex,
      );
  if (startSec6.mode === 'move') {
    (value37._syncTimelineHoverPlayheadFromPointer(el7, value38, durationSec9),
      handleMediaClipTimelineSegmentDrag(value37, value38));
    return;
  }
  startSec6.mode === 'trim' && value37._hideTimelineHoverPlayhead(el7);
  const box = el7?.getBoundingClientRect(),
    trackWidthPx = Math.max(1, toNumber(box?.width, readLayoutWidthPx(el7, 1))),
    mediaClipTimelineDeltaSecFromPx = getMediaClipTimelineDeltaSecFromPx(
      value37._timelineDragDeltaPx(startSec6, value38),
      {
        durationSec: durationSec9,
        trackWidthPx: trackWidthPx,
      },
    );
  if (startSec6.kind === 'video' && startSec6.startClips?.[startSec6.clipIndex]) {
    previewMediaClipTimelineTrimDrag(
      value37,
      'video',
      startSec6,
      mediaClipTimelineDeltaSecFromPx,
      durationSec9,
      el7,
    );
    return;
  } else {
    if (startSec6.kind === 'audio' && startSec6.startClips?.[startSec6.clipIndex]) {
      previewMediaClipTimelineTrimDrag(
        value37,
        'audio',
        startSec6,
        mediaClipTimelineDeltaSecFromPx,
        durationSec9,
        el7,
      );
      return;
    } else {
      const value39 =
        startSec6.side === 'left'
          ? { startSec: startSec6.startTrack.startSec + mediaClipTimelineDeltaSecFromPx }
          : { endSec: startSec6.startTrack.endSec + mediaClipTimelineDeltaSecFromPx };
      value37._mediaClip = patchMediaClipTrackRange(value37._mediaClip, startSec6.kind, value39);
      const value40 = value37._mediaClip.tracks?.[startSec6.kind];
      value40 &&
        (value37._playheadSec = startSec6.side === 'left' ? value40.startSec : value40.endSec);
    }
  }
  (!(startSec6.kind === 'audio' && startSec6.startClips?.[startSec6.clipIndex]) &&
    startSec6.kind !== 'video' &&
    value37._updateTrackVisuals(startSec6.kind),
    value37._syncPreviewTime(
      startSec6.kind,
      value37._previewSourceSecForTimelineSec(startSec6.kind, value37._playheadSec),
    ));
}
export function handleMediaClipTimelineSegmentDrag(args11, event2) {
  const enabled3 = args11._timelineDrag();
  if (!enabled3) return;
  const el8 = args11._timelineRowForDrag(enabled3),
    box2 = el8?.getBoundingClientRect(),
    trackWidthPx2 = Math.max(1, toNumber(box2?.width, readLayoutWidthPx(el8, 1))),
    durationSec10 =
      enabled3.durationSec ??
      args11._resolveTimelineDragDuration(
        enabled3.kind,
        enabled3.startTrack,
        enabled3.startClips,
        enabled3.segmentEl,
        enabled3.clipIndex,
      ),
    value41 = args11._timelineDragDeltaPx(enabled3, event2),
    value42 =
      enabled3.kind === 'audio' && enabled3.mode === 'move'
        ? toNumber(enabled3.latestClientY, toNumber(event2?.clientY, enabled3.startY)) -
          toNumber(enabled3.startY, 0)
        : 0,
    count2 =
      enabled3.kind === 'audio' && enabled3.mode === 'move'
        ? Math.max(Math.abs(value41), Math.abs(value42))
        : Math.abs(value41);
  if (!enabled3.hasMoved && count2 <= 3) return;
  ((enabled3.hasMoved = true),
    enabled3.laneEl?.classList.add('is-moving'),
    enabled3.timelineEl?.classList.add('is-moving-material'),
    (args11._suppressTrackClick = true));
  const mediaClipTimelineDeltaSecFromPx2 = getMediaClipTimelineDeltaSecFromPx(value41, {
    durationSec: durationSec10,
    trackWidthPx: trackWidthPx2,
  });
  if (enabled3.kind === 'video' && enabled3.startClips?.[enabled3.clipIndex])
    previewMediaClipTimelineMoveDrag(
      args11,
      'video',
      enabled3,
      mediaClipTimelineDeltaSecFromPx2,
      durationSec10,
    );
  else {
    if (enabled3.kind === 'audio' && enabled3.startClips?.[enabled3.clipIndex])
      previewMediaClipTimelineMoveDrag(
        args11,
        'audio',
        enabled3,
        mediaClipTimelineDeltaSecFromPx2,
        durationSec10,
      );
    else {
      const value43 = {
        ...args11._mediaClip,
        tracks: {
          ...(args11._mediaClip.tracks || {}),
          [enabled3.kind]: enabled3.startTrack,
        },
      };
      args11._mediaClip = shiftMediaClipTrackRange(
        value43,
        enabled3.kind,
        mediaClipTimelineDeltaSecFromPx2,
      );
      const value44 = args11._mediaClip.tracks?.[enabled3.kind];
      if (value44) {
        const value45 = value44.startSec - enabled3.startTrack.startSec;
        args11._playheadSec = Math.max(
          value44.startSec,
          Math.min(value44.endSec, enabled3.startPlayheadSec + value45),
        );
      }
    }
  }
  (!(enabled3.kind === 'audio' && enabled3.startClips?.[enabled3.clipIndex]) &&
    enabled3.kind !== 'video' &&
    args11._updateTrackVisuals(enabled3.kind),
    args11._syncPreviewTime(
      enabled3.kind,
      args11._previewSourceSecForTimelineSec(enabled3.kind, args11._playheadSec),
    ));
}
