export function beginWorkspaceResizeSession({
  event: event,
  splitter: splitter,
  layout: layout,
  orientation: orientation = 'horizontal',
  windowObject: windowObject = globalThis['window'],
  body: body = globalThis['document']?.['body'],
  resizingClass: resizingClass = '',
  onRatio: onRatio,
  onFinish: onFinish = null,
  signal: signal = null,
} = {}) {
  if (!event || !splitter || !layout || typeof onRatio !== 'function' || signal?.['aborted']) return false;
  if (event['isPrimary'] === false || (Number['isFinite'](event['button']) && event['button'] !== 0))
    return false;
  const box = layout['getBoundingClientRect']?.(),
    value = orientation === 'vertical',
    count = value ? Number(box?.['height']) : Number(box?.['width']);
  if (!(count > 0)) return false;
  (event['preventDefault']?.(), event['stopPropagation']?.());
  const pointerId = event['pointerId'];
  try {
    splitter['setPointerCapture']?.(pointerId);
  } catch {}
  splitter['classList']?.['add']?.('is-active');
  if (resizingClass) body?.['classList']?.['add']?.(resizingClass);
  const run = (event2) =>
      !Number['isFinite'](Number(pointerId)) ||
      !Number['isFinite'](Number(event2?.['pointerId'])) ||
      Number(event2['pointerId']) === Number(pointerId),
    item = (event3) => {
      if (!run(event3)) return;
      const key = value ? event3?.['clientY'] : event3?.['clientX'],
        index = value ? box['top'] : box['left'];
      onRatio(((Number(key) - Number(index || 0)) / count) * 100, event3);
    },
    handler = (result) => {
      if (!run(result)) return;
      signal?.['removeEventListener']('abort', data);
      if (resizingClass) body?.['classList']?.['remove']?.(resizingClass);
      splitter['classList']?.['remove']?.('is-active');
      try {
        splitter['hasPointerCapture']?.(pointerId) && splitter['releasePointerCapture'](pointerId);
      } catch {}
      (windowObject?.['removeEventListener']?.('pointermove', item),
        windowObject?.['removeEventListener']?.('pointerup', handler),
        windowObject?.['removeEventListener']?.('pointercancel', handler),
        onFinish?.(result));
    },
    data = () => handler({ pointerId: pointerId });
  return (
    signal?.['addEventListener']('abort', data, { once: true }),
    windowObject?.['addEventListener']?.('pointermove', item),
    windowObject?.['addEventListener']?.('pointerup', handler),
    windowObject?.['addEventListener']?.('pointercancel', handler),
    true
  );
}
export function beginWorkspaceHorizontalResizeSession(args = {}) {
  return beginWorkspaceResizeSession({ ...args, orientation: 'horizontal' });
}
export function beginWorkspaceVerticalResizeSession(args2 = {}) {
  return beginWorkspaceResizeSession({ ...args2, orientation: 'vertical' });
}
