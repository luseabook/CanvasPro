import { toNumber } from './mediaClipUtils.js';
export function createTimelineInteractionState(args = {}) {
  return { mode: 'idle', hoverKind: '', hoverClipIndex: -1, drag: null, ...args };
}
export function getTimelineDrag(value) {
  return value._timelineInteractionState?.drag || null;
}
export function nextTimelineDragSessionId(item) {
  return (
    (item._timelineDragSessionSeq = toNumber(item._timelineDragSessionSeq, 0) + 1),
    item._timelineDragSessionSeq
  );
}
export function isTimelineDragSession(key, index) {
  const enabled = key._timelineDrag();
  return !!enabled && enabled.sessionId === index;
}
export function setTimelineDrag(result, mode = null) {
  result._timelineInteractionState = result._createTimelineInteractionState({
    mode: mode?.mode || 'idle',
    drag: mode,
  });
}
export function setTimelineHoverSegment(mode2, data, el, hoverKind = '', options = -1) {
  if (!el) return;
  const hoverClipIndex = Math.trunc(toNumber(options, -1));
  if (
    mode2._timelineInteractionState?.hoverKind === hoverKind &&
    mode2._timelineInteractionState?.hoverClipIndex === hoverClipIndex &&
    el.dataset.trimHover === 'true' &&
    el.classList.contains('is-hovered')
  )
    return;
  const el2 = data || el.closest?.('.media-clip-track') || mode2.el;
  (el2
    ?.querySelectorAll?.('.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered')
    ?.forEach((el3) => {
      if (el3 === el) return;
      (delete el3.dataset.trimHover, el3.classList.remove('is-hovered'));
    }),
    (el.dataset.trimHover = 'true'),
    el.classList.add('is-hovered'),
    (mode2._timelineInteractionState = mode2._createTimelineInteractionState({
      ...mode2._timelineInteractionState,
      mode: mode2._timelineDrag() ? mode2._timelineInteractionState.mode : 'hover',
      hoverKind: hoverKind,
      hoverClipIndex: hoverClipIndex,
    })));
}
export function clearTimelineHoverState(mode3, el4 = mode3.el) {
  const enabled2 =
    mode3._timelineInteractionState?.hoverKind ||
    mode3._timelineInteractionState?.hoverClipIndex !== -1 ||
    el4?.querySelector?.('.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered');
  if (!enabled2) return;
  (el4
    ?.querySelectorAll?.('.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered')
    ?.forEach((el5) => {
      (delete el5.dataset.trimHover, el5.classList.remove('is-hovered'));
    }),
    (mode3._timelineInteractionState = mode3._createTimelineInteractionState({
      ...mode3._timelineInteractionState,
      mode: mode3._timelineDrag() ? mode3._timelineInteractionState.mode : 'idle',
      hoverKind: '',
      hoverClipIndex: -1,
    })));
}
