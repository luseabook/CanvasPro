function normalizeOverrideSize(box) {
  const width = Number(box?.['width']),
    height = Number(box?.['height']),
    x = Number(box?.['x']),
    y = Number(box?.['y']),
    value = {};
  if (Number['isFinite'](width) && Number['isFinite'](height))
    Object['assign'](value, { width: width, height: height });
  if (Number['isFinite'](x) && Number['isFinite'](y)) Object['assign'](value, { x: x, y: y });
  return Object['keys'](value)['length'] ? value : null;
}
export function createNodeGeometryOverlay(item, enabled) {
  const key = item && typeof item === 'object' ? item : {};
  if (!enabled || typeof enabled !== 'object') return key;
  let enabled2 = null;
  for (const [index, result] of Object['entries'](enabled)) {
    const args = key[index],
      args2 = normalizeOverrideSize(result);
    if (!args || !args2) continue;
    if (!enabled2) enabled2 = Object['create'](key);
    Object['defineProperty'](enabled2, index, {
      configurable: true,
      enumerable: true,
      value: { ...args, ...args2 },
      writable: true,
    });
  }
  return enabled2 || key;
}
