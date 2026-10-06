const free = { ready: true, allowed: () => true, wait: Promise.resolve(true), finish() {} };
export function beginNodeEditInteraction(value, item) {
  return value?.getGraphMutationPolicy?.()?.beginInteraction?.([...new Set(item)]) || free;
}
export function deferNodeEditCompletion(enabled, handler, handler2 = () => true, el = globalThis.window) {
  if (!enabled || enabled.ready || !enabled.wait) return false;
  let key = false;
  const index = ['pointerdown', 'pointercancel', 'keydown', 'blur'],
    handler3 = (result) => {
      if (key) return;
      ((key = true), clearTimeout(setTimeout2));
      for (const data of index) el?.removeEventListener?.(data, options, true);
      handler(result && enabled.allowed() && handler2());
    },
    options = () => handler3(false),
    setTimeout2 = setTimeout(options, 10000);
  for (const target of index) el?.addEventListener?.(target, options, true);
  return (void enabled.wait.then(handler3, options), true);
}
