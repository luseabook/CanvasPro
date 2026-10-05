export function applyManualBoxPreview(el, box) {
  (el?.['style']?.['setProperty']?.('--box-x', box['x'] * 100 + '%'),
    el?.['style']?.['setProperty']?.('--box-y', box['y'] * 100 + '%'),
    el?.['style']?.['setProperty']?.('--box-width', box['width'] * 100 + '%'),
    el?.['style']?.['setProperty']?.('--box-height', box['height'] * 100 + '%'));
}
export function getPersonReplacementBoxDragDistance(event, value) {
  const item = Number(event?.['clientX']),
    key = Number(event?.['clientY']);
  return Number['isFinite'](item) && Number['isFinite'](key)
    ? Math['hypot'](item - value['startClientX'], key - value['startClientY'])
    : 0;
}
export function createPersonReplacementBoxDragPreview({
  getSession: getSession,
  applyPreview: applyPreview,
  threshold: threshold,
  windowObject: windowObject,
}) {
  let index = 0,
    value2 = null,
    value3 = null;
  const run = () => {
    index = 0;
    const result = value2,
      data = value3;
    ((value2 = null), (value3 = null));
    if (result && data === getSession()) applyPreview(result);
  };
  return {
    schedule(clientX) {
      const enabled = getSession();
      if (!enabled) return;
      ((value2 = { clientX: clientX['clientX'], clientY: clientX['clientY'] }), (value3 = enabled));
      getPersonReplacementBoxDragDistance(clientX, enabled) >= threshold && (enabled['hasDragged'] = !![]);
      if (index) return;
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? (index = windowObject['requestAnimationFrame'](run))
        : run();
    },
    cancel() {
      if (index) windowObject?.['cancelAnimationFrame']?.(index);
      ((index = 0), (value2 = null), (value3 = null));
    },
  };
}
