export const GROUP_NODE_CONTENT_INSETS = Object['freeze']({
  top: 0x50,
  right: 0x20,
  bottom: 0x20,
  left: 0x20,
});
function toFiniteNumber(_0x483251, _0x3b4ad6 = 0x0) {
  const _0x29fdb9 = Number(_0x483251);
  return Number['isFinite'](_0x29fdb9) ? _0x29fdb9 : _0x3b4ad6;
}
export function createGroupNodeLayout({
  x: x = 0x0,
  y: y = 0x0,
  contentWidth: contentWidth = 0x0,
  contentHeight: contentHeight = 0x0,
  minWidth: minWidth = 0x0,
  minHeight: minHeight = 0x0,
} = {}) {
  const _0x2dc5d4 = toFiniteNumber(x),
    _0xbb0f2c = toFiniteNumber(y),
    _0x2a57a9 = Math['max'](0x0, toFiniteNumber(contentWidth)),
    _0x45783c = Math['max'](0x0, toFiniteNumber(contentHeight)),
    _0x18d60e = Math['max'](
      Math['max'](0x0, toFiniteNumber(minWidth)),
      GROUP_NODE_CONTENT_INSETS['left'] + _0x2a57a9 + GROUP_NODE_CONTENT_INSETS['right'],
    ),
    _0x1ffe4e = Math['max'](
      Math['max'](0x0, toFiniteNumber(minHeight)),
      GROUP_NODE_CONTENT_INSETS['top'] + _0x45783c + GROUP_NODE_CONTENT_INSETS['bottom'],
    );
  return {
    x: _0x2dc5d4,
    y: _0xbb0f2c,
    width: _0x18d60e,
    height: _0x1ffe4e,
    contentX: _0x2dc5d4 + GROUP_NODE_CONTENT_INSETS['left'],
    contentY: _0xbb0f2c + GROUP_NODE_CONTENT_INSETS['top'],
  };
}
export function calculateGroupNodeBounds(
  _0x4bb598,
  {
    defaultNodeWidth: defaultNodeWidth = 0x104,
    defaultNodeHeight: defaultNodeHeight = 0x64,
    minWidth: minWidth = 0x0,
    minHeight: minHeight = 0x0,
  } = {},
) {
  const _0xf7d20e = Array['isArray'](_0x4bb598) ? _0x4bb598['filter'](Boolean) : [];
  if (!_0xf7d20e['length'])
    throw new Error('calculateGroupNodeBounds\x20requires\x20at\x20least\x20one\x20node');
  const _0x1c29b4 = Math['max'](0x0, toFiniteNumber(defaultNodeWidth, 0x104)),
    _0x2559a4 = Math['max'](0x0, toFiniteNumber(defaultNodeHeight, 0x64)),
    _0x4b1557 = Math['min'](..._0xf7d20e['map']((_0x4f1494) => toFiniteNumber(_0x4f1494['x']))),
    _0x571d72 = Math['min'](..._0xf7d20e['map']((_0x361c71) => toFiniteNumber(_0x361c71['y']))),
    _0x3e1dce = Math['max'](
      ..._0xf7d20e['map'](
        (_0x56cb13) => toFiniteNumber(_0x56cb13['x']) + (toFiniteNumber(_0x56cb13['width']) || _0x1c29b4),
      ),
    ),
    _0x338dab = Math['max'](
      ..._0xf7d20e['map'](
        (_0x4dd6ce) => toFiniteNumber(_0x4dd6ce['y']) + (toFiniteNumber(_0x4dd6ce['height']) || _0x2559a4),
      ),
    ),
    _0x3e300c = createGroupNodeLayout({
      x: _0x4b1557 - GROUP_NODE_CONTENT_INSETS['left'],
      y: _0x571d72 - GROUP_NODE_CONTENT_INSETS['top'],
      contentWidth: _0x3e1dce - _0x4b1557,
      contentHeight: _0x338dab - _0x571d72,
      minWidth: minWidth,
      minHeight: minHeight,
    });
  return { x: _0x3e300c['x'], y: _0x3e300c['y'], width: _0x3e300c['width'], height: _0x3e300c['height'] };
}
