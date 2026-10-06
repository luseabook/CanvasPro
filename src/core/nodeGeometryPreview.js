const geometry = new Map(),
  layers = new Map(),
  listeners = new Set();
export function setNodeGeometryPreview(list, value = null) {
  const map = value === null ? geometry : layers.get(value) || new Map();
  if (value !== null) layers.set(value, map);
  for (const [item, key] of list) {
    const index = Object.fromEntries(
      Object.entries(key).filter(
        ([result, data]) => ['x', 'y', 'width', 'height'].includes(result) && Number.isFinite(data),
      ),
    );
    map.set(item, index);
  }
  if (list.length) {
    for (const run of listeners) run(value);
  }
}
export function clearNodeGeometryPreview(options, target = null) {
  const map2 = target === null ? geometry : layers.get(target);
  let source = false;
  for (const next of options) source = map2?.delete(next) || source;
  if (target !== null && !map2?.size) layers.delete(target);
  if (source) {
    for (const run2 of listeners) run2(target);
  }
}
export function readNodeGeometryPreview(current, args) {
  const args2 =
    geometry.get(current) ||
    [...layers.values()].find((map3) => map3.has(current))?.get(current);
  return args && args2 ? { ...args, ...args2 } : args;
}
export function readNodeGeometryPreviewEntries(value2 = null) {
  return [...(value2 === null ? geometry : layers.get(value2) || [])];
}
export function subscribeNodeGeometryPreview(entry) {
  return (listeners.add(entry), () => listeners.delete(entry));
}
