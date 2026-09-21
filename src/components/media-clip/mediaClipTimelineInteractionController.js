import { toNumber } from './mediaClipUtils.js';
export function createTimelineInteractionState(_0x4a96f9 = {}) {
  return { mode: 'idle', hoverKind: '', hoverClipIndex: -1, drag: null, ..._0x4a96f9 };
}
export function getTimelineDrag(_0x5a65d2) {
  return _0x5a65d2._timelineInteractionState?.drag || null;
}
export function nextTimelineDragSessionId(_0x1eafb2) {
  return (
    (_0x1eafb2._timelineDragSessionSeq = toNumber(_0x1eafb2._timelineDragSessionSeq, 0) + 1),
    _0x1eafb2._timelineDragSessionSeq
  );
}
export function isTimelineDragSession(_0x1d8b67, _0x223516) {
  const _0x3839f9 = _0x1d8b67._timelineDrag();
  return !!_0x3839f9 && _0x3839f9.sessionId === _0x223516;
}
export function setTimelineDrag(_0x33f53a, _0x233310 = null) {
  _0x33f53a._timelineInteractionState = _0x33f53a._createTimelineInteractionState({
    mode: _0x233310?.mode || 'idle',
    drag: _0x233310,
  });
}
export function setTimelineHoverSegment(_0x38725e, _0x556421, _0xb72c38, _0x328b0 = '', _0x46b6de = -1) {
  if (!_0xb72c38) return;
  const _0x12cee4 = Math.trunc(toNumber(_0x46b6de, -1));
  if (
    _0x38725e._timelineInteractionState?.hoverKind === _0x328b0 &&
    _0x38725e._timelineInteractionState?.hoverClipIndex === _0x12cee4 &&
    _0xb72c38.dataset.trimHover === 'true' &&
    _0xb72c38.classList.contains('is-hovered')
  )
    return;
  const _0x2130f7 = _0x556421 || _0xb72c38.closest?.('.media-clip-track') || _0x38725e.el;
  (_0x2130f7
    ?.querySelectorAll?.('.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered')
    ?.forEach((_0xfbf353) => {
      if (_0xfbf353 === _0xb72c38) return;
      (delete _0xfbf353.dataset.trimHover, _0xfbf353.classList.remove('is-hovered'));
    }),
    (_0xb72c38.dataset.trimHover = 'true'),
    _0xb72c38.classList.add('is-hovered'),
    (_0x38725e._timelineInteractionState = _0x38725e._createTimelineInteractionState({
      ..._0x38725e._timelineInteractionState,
      mode: _0x38725e._timelineDrag() ? _0x38725e._timelineInteractionState.mode : 'hover',
      hoverKind: _0x328b0,
      hoverClipIndex: _0x12cee4,
    })));
}
export function clearTimelineHoverState(_0x4908cd, _0x24a02d = _0x4908cd.el) {
  const _0xa471df =
    _0x4908cd._timelineInteractionState?.hoverKind ||
    _0x4908cd._timelineInteractionState?.hoverClipIndex !== -1 ||
    _0x24a02d?.querySelector?.('.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered');
  if (!_0xa471df) return;
  (_0x24a02d
    ?.querySelectorAll?.('.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered')
    ?.forEach((_0x300240) => {
      (delete _0x300240.dataset.trimHover, _0x300240.classList.remove('is-hovered'));
    }),
    (_0x4908cd._timelineInteractionState = _0x4908cd._createTimelineInteractionState({
      ..._0x4908cd._timelineInteractionState,
      mode: _0x4908cd._timelineDrag() ? _0x4908cd._timelineInteractionState.mode : 'idle',
      hoverKind: '',
      hoverClipIndex: -1,
    })));
}
