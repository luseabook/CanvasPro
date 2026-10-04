export function resolveNormalizedMediaCrop(enabled, width, height) {
  if (!enabled) return { x: 0x0, y: 0x0, width: width, height: height };
  const { x: x, y: y, width: width2, height: height2 } = enabled;
  if (
    ![x, y, width2, height2]['every'](Number['isFinite']) ||
    x < 0x0 ||
    y < 0x0 ||
    width2 <= 0x0 ||
    height2 <= 0x0 ||
    x + width2 > 1.000001 ||
    y + height2 > 1.000001
  )
    throw new Error('裁剪范围无效');
  const x2 = Math['min'](width - 0x1, Math['floor'](x * width)),
    y2 = Math['min'](height - 0x1, Math['floor'](y * height));
  return {
    x: x2,
    y: y2,
    width: Math['max'](0x1, Math['min'](width - x2, Math['round'](width2 * width))),
    height: Math['max'](0x1, Math['min'](height - y2, Math['round'](height2 * height))),
  };
}
export function normalizedMediaDragRect(box, box2, box3) {
  const x3 = (value) => Math['min'](0x1, Math['max'](0x0, value)),
    box4 = {
      x: x3((box2['x'] - box['left']) / box['width']),
      y: x3((box2['y'] - box['top']) / box['height']),
    },
    box5 = {
      x: x3((box3['x'] - box['left']) / box['width']),
      y: x3((box3['y'] - box['top']) / box['height']),
    };
  return {
    x: Math['min'](box4['x'], box5['x']),
    y: Math['min'](box4['y'], box5['y']),
    width: Math['abs'](box4['x'] - box5['x']),
    height: Math['abs'](box4['y'] - box5['y']),
  };
}
