const free = { ready: !![], allowed: () => !![], wait: Promise['resolve'](!![]), finish() {} };
export function beginNodeEditInteraction(value, item) {
  return value?.['getGraphMutationPolicy']?.()?.['beginInteraction']?.([...new Set(item)]) || free;
}
export function deferNodeEditCompletion(enabled, handler, handler2 = () => !![], el = globalThis['window']) {
  if (!enabled || enabled['ready'] || !enabled['wait']) return ![];
  let key = ![];
  const index = ['pointerdown', 'pointercancel', 'keydown', 'blur'],
    handler3 = (result) => {
      if (key) return;
      ((key = !![]), clearTimeout(setTimeout2));
      for (const data of index) el?.['removeEventListener']?.(data, options, !![]);
      handler(result && enabled['allowed']() && handler2());
    },
    options = () => handler3(![]),
    setTimeout2 = setTimeout(options, 10000);
  for (const target of index) el?.['addEventListener']?.(target, options, !![]);
  return (void enabled['wait']['then'](handler3, options), !![]);
}
