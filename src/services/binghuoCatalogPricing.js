export function withoutBinghuoCatalogPrices(_0x2d0629) {
  const _0x3ea3f7 = (_0x11f957) =>
    String(_0x11f957 || '')['replace'](
      /\s+(?:[¥￥]\s*)?\d+(?:\.\d+)?\s*元\s*[\/／]\s*[^\s\/／]{1,16}\s*$/u,
      '',
    );
  return {
    ..._0x2d0629,
    models: _0x2d0629['models']['map']((_0x3f2502) => {
      const _0x6862e = { ..._0x3f2502['extensions'] };
      for (const _0x4f9ddd of ['imageMenu', 'videoMenu']) {
        if (!_0x6862e[_0x4f9ddd]) continue;
        const { priceText: _0x818376, ..._0x3e0cd1 } = _0x6862e[_0x4f9ddd];
        for (const _0x18ec4b of ['title', 'label'])
          if (_0x18ec4b in _0x3e0cd1) _0x3e0cd1[_0x18ec4b] = _0x3ea3f7(_0x3e0cd1[_0x18ec4b]);
        _0x6862e[_0x4f9ddd] = _0x3e0cd1;
      }
      return {
        ..._0x3f2502,
        displayName: _0x3ea3f7(_0x3f2502['displayName']),
        ...(_0x3f2502['extensions'] ? { extensions: _0x6862e } : {}),
      };
    }),
  };
}
