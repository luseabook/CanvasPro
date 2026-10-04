export function startMediaProgressDragSession({
  target: target = globalThis['window'],
  pointerId: pointerId = null,
  onMove: onMove,
  onEnd: onEnd,
  onCancel: onCancel = onEnd,
  capture: capture = !![],
} = {}) {
  let enabled = !![];
  const run = (event) =>
      pointerId == null || event?.['pointerId'] == null || event['pointerId'] === pointerId,
    value = (item) => {
      if (!enabled || !run(item)) return;
      onMove?.(item);
    },
    dispose = () => {
      if (!enabled) return ![];
      return (
        (enabled = ![]),
        target?.['removeEventListener']?.('pointermove', value, capture),
        target?.['removeEventListener']?.('pointerup', key, capture),
        target?.['removeEventListener']?.('pointercancel', cancel, capture),
        target?.['removeEventListener']?.('blur', cancel, capture),
        !![]
      );
    },
    key = (index) => {
      if (!run(index) || !dispose()) return;
      onEnd?.(index);
    },
    cancel = (result) => {
      if (result?.['type'] !== 'blur' && !run(result)) return;
      if (!dispose()) return;
      onCancel?.(result);
    };
  return (
    target?.['addEventListener']?.('pointermove', value, capture),
    target?.['addEventListener']?.('pointerup', key, capture),
    target?.['addEventListener']?.('pointercancel', cancel, capture),
    target?.['addEventListener']?.('blur', cancel, capture),
    {
      cancel: cancel,
      dispose: dispose,
      get active() {
        return enabled;
      },
    }
  );
}
