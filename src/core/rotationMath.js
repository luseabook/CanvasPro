export function normalizeRotationDegrees(value) {
  const item = Number(value);
  if (!Number['isFinite'](item)) return 0x0;
  return Math['round'](((((item % 0x168) + 0x21c) % 0x168) - 0xb4) * 0xa) / 0xa;
}
export function getRotatedSize(key, index, result) {
  const data = (normalizeRotationDegrees(result) * Math['PI']) / 0xb4,
    options = Math['abs'](Math['cos'](data)),
    target = Math['abs'](Math['sin'](data));
  return {
    width: Math['ceil'](key * options + index * target - 1e-8),
    height: Math['ceil'](key * target + index * options - 1e-8),
  };
}
export function rotatePointAroundCenter(box, x, source) {
  const next = (normalizeRotationDegrees(source) * Math['PI']) / 0xb4,
    current = Math['cos'](next),
    entry = Math['sin'](next),
    record = box['x'] - x['x'],
    payload = box['y'] - x['y'];
  return {
    x: x['x'] + record * current - payload * entry,
    y: x['y'] + record * entry + payload * current,
  };
}
export function getImageRotationLayout(width, height, handle, state = ![]) {
  const box2 = getRotatedSize(width, height, handle);
  return state
    ? {
        width: width,
        height: height,
        scale: Math['min'](width / box2['width'], height / box2['height']),
      }
    : { ...box2, scale: 0x1 };
}
export function inverseImageRotationPoint(box3, x2, y, config, scope = ![]) {
  const { scale: scale } = getImageRotationLayout(x2, y, config, scope),
    x3 = { x: x2 / 0x2, y: y / 0x2 };
  return rotatePointAroundCenter(
    {
      x: x3['x'] + (box3['x'] - x3['x']) / scale,
      y: x3['y'] + (box3['y'] - x3['y']) / scale,
    },
    x3,
    -config,
  );
}
