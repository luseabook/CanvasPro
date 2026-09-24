const text = (_0x3d7397) => String(_0x3d7397 ?? '')['trim'](),
  mediaCount = (_0xe243aa) =>
    (_0xe243aa['appearances'] || [])['filter']((_0x1bde9b) => _0x1bde9b['imageUrl'])['length'] +
    Number(Boolean(_0xe243aa['imageUrl']));
export function reconcileStoryReplicationAssetIdentity(_0x27028f, _0x469278) {
  const _0x15bf22 = _0x27028f['assets'] || [],
    _0x27b34c = new Set(_0x469278['map']((_0x500ebf) => _0x500ebf['key'])),
    _0x6eaea6 = new Set(),
    _0xa0e7ad = new Map(),
    _0x52fd44 = (_0x27028f['project']['replication']['characterBindings'] ||= {});
  for (const _0x2e559e of _0x469278) {
    const _0x2a8f33 = text(_0x2e559e['character']['name']);
    if (
      !_0x2a8f33 ||
      _0x469278['filter'](
        (_0x4bb22c) =>
          _0x4bb22c['episodeId'] === _0x2e559e['episodeId'] &&
          text(_0x4bb22c['character']['name']) === _0x2a8f33,
      )['length'] !== 0x1
    )
      continue;
    const _0x3291be = _0x15bf22['filter'](
      (_0x19e43b) =>
        _0x19e43b['kind'] === 'character' &&
        !_0x6eaea6['has'](_0x19e43b['id']) &&
        text(_0x19e43b['replicationSource']?.['name']) === _0x2a8f33 &&
        _0x19e43b['sourceChapterIds']?.['includes'](_0x2e559e['episodeId']) &&
        !(_0x19e43b['replicationSource']?.['subjectKeys'] || [])['some'](
          (_0x13a1b7) => _0x27b34c['has'](_0x13a1b7) && _0x13a1b7 !== _0x2e559e['key'],
        ),
    );
    if (!_0x3291be['length']) continue;
    const _0x80b122 = _0x15bf22['find']((_0x1fd791) => _0x1fd791['id'] === _0x52fd44[_0x2e559e['key']]);
    if (_0x80b122 && !_0x3291be['includes'](_0x80b122)) continue;
    const _0x1761b6 = [..._0x3291be]['sort'](
        (_0x3cad2c, _0x46e670) =>
          mediaCount(_0x46e670) - mediaCount(_0x3cad2c) ||
          Number(_0x46e670 === _0x80b122) - Number(_0x3cad2c === _0x80b122),
      )[0x0],
      _0xf6714e = new Map(
        (_0x1761b6['appearances'] || [])['map']((_0x543fcd) => [_0x543fcd['id'], _0x543fcd]),
      ),
      _0x18fde3 = new Set([...(_0x1761b6['replicationSource']['subjectKeys'] || []), _0x2e559e['key']]);
    for (const _0x36ea1a of _0x3291be) {
      if (_0x36ea1a === _0x1761b6) continue;
      for (const _0x5ab934 of _0x36ea1a['appearances'] || [])
        if (!_0xf6714e['has'](_0x5ab934['id'])) _0xf6714e['set'](_0x5ab934['id'], _0x5ab934);
      for (const _0x3d3da5 of _0x36ea1a['replicationSource']['subjectKeys'] || [])
        _0x18fde3['add'](_0x3d3da5);
      for (const _0x33ad65 of ['id', 'planningRef', 'ref']) {
        if (_0x36ea1a[_0x33ad65] && _0x1761b6[_0x33ad65])
          _0xa0e7ad['set'](_0x36ea1a[_0x33ad65], _0x1761b6[_0x33ad65]);
      }
      _0x6eaea6['add'](_0x36ea1a['id']);
    }
    ((_0x1761b6['appearances'] = [..._0xf6714e['values']()]),
      (_0x1761b6['replicationSource'] = { ..._0x1761b6['replicationSource'], subjectKeys: [..._0x18fde3] }),
      (_0x52fd44[_0x2e559e['key']] = _0x1761b6['id']));
  }
  const _0xe1b4b8 = (_0x2db641) => {
    if (typeof _0x2db641 === 'string') {
      if (_0xa0e7ad['has'](_0x2db641)) return _0xa0e7ad['get'](_0x2db641);
      for (const [_0x59bb65, _0x1a67bf] of _0xa0e7ad)
        _0x2db641 = _0x2db641['split']('story-asset:' + encodeURIComponent(_0x59bb65) + ':')['join'](
          'story-asset:' + encodeURIComponent(_0x1a67bf) + ':',
        );
      return _0x2db641;
    }
    if (Array['isArray'](_0x2db641)) return _0x2db641['map'](_0xe1b4b8);
    if (_0x2db641 && typeof _0x2db641 === 'object') {
      for (const _0x202299 of Object['keys'](_0x2db641))
        _0x2db641[_0x202299] = _0xe1b4b8(_0x2db641[_0x202299]);
    }
    return _0x2db641;
  };
  return (
    _0x6eaea6['size'] && (_0xe1b4b8(_0x27028f['episodes']), _0xe1b4b8(_0x52fd44)),
    _0x15bf22['filter']((_0x387b25) => !_0x6eaea6['has'](_0x387b25['id']))
  );
}
