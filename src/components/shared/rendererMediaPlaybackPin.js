export function bindRendererMediaPlaybackPin(
  _0x568889,
  _0x327ee9,
  { getRenderer: getRenderer = () => globalThis['window']?.['v2Renderer'] } = {},
) {
  if (!_0x568889?.['addEventListener'] || !_0x327ee9) return () => {};
  let _0x2e963d = ![];
  const _0x269b0c = 'media-playback',
    _0x419027 = () => {
      const _0x108d68 = _0x568889['paused'] === ![] && _0x568889['ended'] !== !![];
      if (_0x2e963d === _0x108d68) return;
      _0x2e963d = _0x108d68;
      if (_0x2e963d) getRenderer()?.['pinNode']?.(_0x327ee9, _0x269b0c);
      else getRenderer()?.['unpinNode']?.(_0x327ee9, _0x269b0c);
    },
    _0xe65f89 = ['play', 'pause', 'ended', 'emptied'];
  for (const _0x33615b of _0xe65f89) _0x568889['addEventListener'](_0x33615b, _0x419027);
  return (
    _0x419027(),
    () => {
      for (const _0x4cd092 of _0xe65f89) _0x568889['removeEventListener'](_0x4cd092, _0x419027);
      if (_0x2e963d) getRenderer()?.['unpinNode']?.(_0x327ee9, _0x269b0c);
      _0x2e963d = ![];
    }
  );
}
