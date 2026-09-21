export function clearInlineStoryboardThumbUrls(_0x290b3b = []) {
  if (!Array.isArray(_0x290b3b)) return null;
  let _0x1f0b03 = false;
  const _0x12964b = _0x290b3b.map((_0x369674) => {
    if (_0x369674 && typeof _0x369674.thumbUrl === 'string' && _0x369674.thumbUrl.startsWith('data:image/'))
      return ((_0x1f0b03 = true), { ..._0x369674, thumbUrl: '' });
    return _0x369674;
  });
  return _0x1f0b03 ? _0x12964b : null;
}
