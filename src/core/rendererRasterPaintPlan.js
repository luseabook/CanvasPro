const ITEM_FIELDS = ['id', 'kind', 'label', 'invalid', 'x', 'y', 'width', 'height'];
function sameRecord(_0x2fd9f9, _0x3d6967) {
  if (!_0x2fd9f9 || !_0x3d6967) return _0x2fd9f9 === _0x3d6967;
  const _0x152e97 = Object['keys'](_0x2fd9f9);
  return (
    _0x152e97['length'] === Object['keys'](_0x3d6967)['length'] &&
    _0x152e97['every']((_0x1ff8fc) => _0x2fd9f9[_0x1ff8fc] === _0x3d6967[_0x1ff8fc])
  );
}
export function canReuseRasterPaint(_0x2811d4, _0x41caff) {
  if (!_0x2811d4 || !_0x41caff || _0x2811d4['paintScaleKey'] !== _0x41caff['paintScaleKey']) return ![];
  if (
    !sameRecord(_0x2811d4['worldBounds'], _0x41caff['worldBounds']) ||
    !sameRecord(_0x2811d4['palette'], _0x41caff['palette'])
  )
    return ![];
  if (_0x2811d4['admittedSources']['size'] !== _0x41caff['admittedSources']['size']) return ![];
  for (const _0x276ae8 of _0x2811d4['admittedSources']) {
    if (!_0x41caff['admittedSources']['has'](_0x276ae8)) return ![];
  }
  if (_0x2811d4['items']['length'] !== _0x41caff['items']['length']) return ![];
  return _0x2811d4['items']['every']((_0x390fe5, _0x27178e) => {
    const _0x1c8ab6 = _0x41caff['items'][_0x27178e];
    return (
      ITEM_FIELDS['every']((_0x3078f5) => _0x390fe5[_0x3078f5] === _0x1c8ab6[_0x3078f5]) &&
      _0x390fe5['sources']['length'] === _0x1c8ab6['sources']['length'] &&
      _0x390fe5['sources']['every']((_0x23747b, _0x43f075) => _0x23747b === _0x1c8ab6['sources'][_0x43f075])
    );
  });
}
