function getDominantWheelDelta(wheelEvent) {
  const deltaX = Number(wheelEvent?.['deltaX']) || 0,
    deltaY = Number(wheelEvent?.['deltaY']) || 0;
  return Math['abs'](deltaX) > Math['abs'](deltaY) ? deltaX : deltaY;
}
function getWheelDeltaMultiplier(deltaMode, viewportWidth) {
  if (Number(deltaMode) === 1) return 16;
  if (Number(deltaMode) === 2) return Math['max'](1, Number(viewportWidth) || 1);
  return 1;
}
const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);
function canConsumeWheelDelta(element, event, computedStyle = {}) {
  const rawDeltaX = Number(event?.['deltaX']) || 0,
    rawDeltaY = Number(event?.['deltaY']) || 0,
    consumesAxis = ({
      delta: delta,
      overflow: overflow,
      scrollPosition: scrollPosition,
      scrollSize: scrollSize,
      clientSize: clientSize,
    }) => {
      if (!delta || !SCROLLABLE_OVERFLOW_VALUES['has'](String(overflow || ''))) return ![];
      const scrollRange = Math['max'](0, (Number(scrollSize) || 0) - (Number(clientSize) || 0));
      if (!(scrollRange > 0)) return ![];
      const currentOffset = Math['max'](0, Math['min'](scrollRange, Number(scrollPosition) || 0));
      return delta > 0 ? currentOffset < scrollRange : currentOffset > 0;
    };
  return (
    consumesAxis({
      delta: rawDeltaX,
      overflow: computedStyle['overflowX'],
      scrollPosition: element?.['scrollLeft'],
      scrollSize: element?.['scrollWidth'],
      clientSize: element?.['clientWidth'],
    }) ||
    consumesAxis({
      delta: rawDeltaY,
      overflow: computedStyle['overflowY'],
      scrollPosition: element?.['scrollTop'],
      scrollSize: element?.['scrollHeight'],
      clientSize: element?.['clientHeight'],
    })
  );
}
function hasNestedWheelConsumer(event, boundary, { getComputedStyle: getComputedStyle = null } = {}) {
  const target = event?.['target'],
    readComputedStyle =
      getComputedStyle ||
      target?.['ownerDocument']?.['defaultView']?.['getComputedStyle']?.['bind'](
        target['ownerDocument']['defaultView'],
      ) ||
      globalThis['getComputedStyle'];
  if (typeof readComputedStyle !== 'function') return ![];
  for (let candidate = target; candidate && candidate !== boundary; candidate = candidate['parentElement']) {
    if (canConsumeWheelDelta(candidate, event, readComputedStyle(candidate))) return !![];
  }
  return ![];
}
export function scrollElementHorizontallyWithWheel(
  wheelEvent,
  scrollElement,
  { stopPropagation: stopPropagation = ![] } = {},
) {
  if (!scrollElement) return ![];
  const viewportWidth = Math['max'](0, Number(scrollElement['clientWidth']) || 0),
    maxScrollLeft = Math['max'](0, (Number(scrollElement['scrollWidth']) || 0) - viewportWidth);
  if (!maxScrollLeft) return ![];
  const dominantDelta = getDominantWheelDelta(wheelEvent);
  if (!dominantDelta) return ![];
  const scrollDelta = dominantDelta * getWheelDeltaMultiplier(wheelEvent?.['deltaMode'], viewportWidth),
    startOffset = Math['max'](0, Math['min'](maxScrollLeft, Number(scrollElement['scrollLeft']) || 0)),
    nextOffset = Math['max'](0, Math['min'](maxScrollLeft, startOffset + scrollDelta));
  if (nextOffset === startOffset) return ![];
  ((scrollElement['scrollLeft'] = nextOffset), wheelEvent?.['preventDefault']?.());
  if (stopPropagation) wheelEvent?.['stopPropagation']?.();
  return !![];
}
export function scrollClosestElementHorizontallyWithWheel(
  wheelEvent,
  selector,
  {
    boundaryRoot: boundaryRoot = null,
    stopPropagation: stopPropagation = ![],
    preserveNestedScrollable: preserveNestedScrollable = ![],
    getComputedStyle: getComputedStyle = null,
  } = {},
) {
  const closestElement = wheelEvent?.['target']?.['closest']?.(selector);
  if (!closestElement || (boundaryRoot && !boundaryRoot['contains']?.(closestElement))) return ![];
  if (
    preserveNestedScrollable &&
    hasNestedWheelConsumer(wheelEvent, closestElement, { getComputedStyle: getComputedStyle })
  )
    return ![];
  return scrollElementHorizontallyWithWheel(wheelEvent, closestElement, { stopPropagation: stopPropagation });
}
