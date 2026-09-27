export function createCollaborationPreviews(_0x39c03b) {
  const _0x3ac880 = new Map();
  return async (_0x7874dc) => {
    if (!_0x39c03b) return _0x7874dc;
    _0x7874dc = { ..._0x7874dc, nodes: { ..._0x7874dc['nodes'] } };
    for (const _0x5e9c5a of Object['values'](_0x7874dc['nodes'])) {
      if (
        !['source-image', 'image', 'ai-image']['includes'](_0x5e9c5a['type']) ||
        (_0x5e9c5a['displayLocalPath'] && _0x5e9c5a['thumbLocalPath'])
      )
        continue;
      const _0x2c28ab = _0x5e9c5a['originalLocalPath'] || _0x5e9c5a['localPath'] || _0x5e9c5a['src'];
      if (!_0x2c28ab || _0x2c28ab['startsWith']('aic-asset:')) continue;
      if (!_0x3ac880['has'](_0x2c28ab))
        _0x3ac880['set'](
          _0x2c28ab,
          Promise['resolve'](_0x39c03b(_0x2c28ab))['catch'](() => null),
        );
      const _0x2bd2df = await _0x3ac880['get'](_0x2c28ab);
      if (_0x2bd2df?.['displayLocalPath'] && _0x2bd2df?.['thumbLocalPath']) {
        const _0x25a503 = { ..._0x5e9c5a };
        for (const _0x50f766 of [
          'originalLocalPath',
          'displayLocalPath',
          'thumbLocalPath',
          'originalWidth',
          'originalHeight',
        ])
          if (_0x2bd2df[_0x50f766]) _0x25a503[_0x50f766] = _0x2bd2df[_0x50f766];
        _0x7874dc['nodes'][_0x5e9c5a['id']] = _0x25a503;
      }
    }
    return _0x7874dc;
  };
}
