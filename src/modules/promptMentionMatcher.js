function candidateKey(_0x411755) {
  return _0x411755['origin'] === 'asset'
    ? 'asset:' + _0x411755['assetId'] + ':' + (_0x411755['assetIndex'] ?? 0x0)
    : 'node:' + _0x411755['nodeId'];
}
const WORD = /[\p{L}\p{N}_-]/u;
export function matchPromptMentions(_0x3c9f51, _0x4fdb65 = []) {
  const _0xd22b4c = { children: new Map() };
  for (const _0x5226d8 of _0x4fdb65) {
    if (_0x5226d8['pillKind'] || _0x5226d8['missingAsset']) continue;
    for (const _0x4f75a0 of [_0x5226d8['label'], _0x5226d8['refLabel'], _0x5226d8['assetName']]) {
      const _0x56bc0c = String(_0x4f75a0 || '')
        ['trim']()
        ['replace'](/^[@＠]+/, '');
      if (!_0x56bc0c) continue;
      let _0x3f7dc5 = _0xd22b4c;
      for (const _0x40e7fb of _0x56bc0c['toLowerCase']()) {
        if (!_0x3f7dc5['children']['has'](_0x40e7fb))
          _0x3f7dc5['children']['set'](_0x40e7fb, { children: new Map() });
        _0x3f7dc5 = _0x3f7dc5['children']['get'](_0x40e7fb);
      }
      ((_0x3f7dc5['candidates'] ||= new Map()),
        _0x3f7dc5['candidates']['set'](candidateKey(_0x5226d8), _0x5226d8));
    }
  }
  const _0x26ff8f = [];
  for (let _0x28c371 = 0x0; _0x28c371 < _0x3c9f51['length']; _0x28c371 += 0x1) {
    if (!/[@＠]/['test'](_0x3c9f51[_0x28c371])) continue;
    if (_0x28c371 && /[a-z0-9_@＠.]/i['test'](_0x3c9f51[_0x28c371 - 0x1])) continue;
    let _0x568682 = _0xd22b4c,
      _0x89bd8a = null;
    for (let _0x3963dc = _0x28c371 + 0x1; _0x3963dc < _0x3c9f51['length'];) {
      const _0x5c52b1 = String['fromCodePoint'](_0x3c9f51['codePointAt'](_0x3963dc));
      _0x568682 = _0x568682['children']['get'](_0x5c52b1['toLowerCase']());
      if (!_0x568682) break;
      _0x3963dc += _0x5c52b1['length'];
      const _0x102f89 = _0x3c9f51[_0x3963dc] || '',
        _0x4288e7 =
          !_0x102f89 ||
          !WORD['test'](_0x102f89) ||
          (/[a-z0-9]/i['test'](_0x5c52b1) && /\p{Script=Han}/u['test'](_0x102f89));
      _0x568682['candidates'] &&
        _0x4288e7 &&
        (_0x89bd8a = {
          start: _0x28c371,
          end: _0x3963dc,
          name: _0x3c9f51['slice'](_0x28c371 + 0x1, _0x3963dc),
          candidates: [..._0x568682['candidates']['values']()],
        });
    }
    if (_0x89bd8a) (_0x26ff8f['push'](_0x89bd8a), (_0x28c371 = _0x89bd8a['end'] - 0x1));
    else {
      const _0x2f7281 = _0x3c9f51['slice'](_0x28c371 + 0x1)['match'](/^[\p{L}\p{N}_-]+/u)?.[0x0];
      _0x2f7281 &&
        (_0x26ff8f['push']({
          start: _0x28c371,
          end: _0x28c371 + 0x1 + _0x2f7281['length'],
          name: _0x2f7281,
          candidates: [],
        }),
        (_0x28c371 += _0x2f7281['length']));
    }
  }
  return _0x26ff8f;
}
