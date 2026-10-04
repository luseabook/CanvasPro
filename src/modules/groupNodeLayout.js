export const GROUP_NODE_CONTENT_INSETS = Object['freeze']({
  top: 0x50,
  right: 0x20,
  bottom: 0x20,
  left: 0x20,
});
function toFiniteNumber(value, item = 0x0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
export function createGroupNodeLayout({
  x: x = 0x0,
  y: y = 0x0,
  contentWidth: contentWidth = 0x0,
  contentHeight: contentHeight = 0x0,
  minWidth: minWidth = 0x0,
  minHeight: minHeight = 0x0,
} = {}) {
  const x2 = toFiniteNumber(x),
    y2 = toFiniteNumber(y),
    index = Math['max'](0x0, toFiniteNumber(contentWidth)),
    result = Math['max'](0x0, toFiniteNumber(contentHeight)),
    width = Math['max'](
      Math['max'](0x0, toFiniteNumber(minWidth)),
      GROUP_NODE_CONTENT_INSETS['left'] + index + GROUP_NODE_CONTENT_INSETS['right'],
    ),
    height = Math['max'](
      Math['max'](0x0, toFiniteNumber(minHeight)),
      GROUP_NODE_CONTENT_INSETS['top'] + result + GROUP_NODE_CONTENT_INSETS['bottom'],
    );
  return {
    x: x2,
    y: y2,
    width: width,
    height: height,
    contentX: x2 + GROUP_NODE_CONTENT_INSETS['left'],
    contentY: y2 + GROUP_NODE_CONTENT_INSETS['top'],
  };
}
export function calculateGroupNodeBounds(
  list,
  {
    defaultNodeWidth: defaultNodeWidth = 0x104,
    defaultNodeHeight: defaultNodeHeight = 0x64,
    minWidth: minWidth = 0x0,
    minHeight: minHeight = 0x0,
  } = {},
) {
  const list2 = Array['isArray'](list) ? list['filter'](Boolean) : [];
  if (!list2['length']) throw new Error('calculateGroupNodeBounds\x20requires\x20at\x20least\x20one\x20node');
  const data = Math['max'](0x0, toFiniteNumber(defaultNodeWidth, 0x104)),
    options = Math['max'](0x0, toFiniteNumber(defaultNodeHeight, 0x64)),
    x3 = Math['min'](...list2['map']((box) => toFiniteNumber(box['x']))),
    y3 = Math['min'](...list2['map']((box2) => toFiniteNumber(box2['y']))),
    contentWidth2 = Math['max'](
      ...list2['map']((box3) => toFiniteNumber(box3['x']) + (toFiniteNumber(box3['width']) || data)),
    ),
    contentHeight2 = Math['max'](
      ...list2['map']((box4) => toFiniteNumber(box4['y']) + (toFiniteNumber(box4['height']) || options)),
    ),
    x4 = createGroupNodeLayout({
      x: x3 - GROUP_NODE_CONTENT_INSETS['left'],
      y: y3 - GROUP_NODE_CONTENT_INSETS['top'],
      contentWidth: contentWidth2 - x3,
      contentHeight: contentHeight2 - y3,
      minWidth: minWidth,
      minHeight: minHeight,
    });
  return { x: x4['x'], y: x4['y'], width: x4['width'], height: x4['height'] };
}
