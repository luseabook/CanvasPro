function nodeKey(_0x778b6c) {
  if (_0x778b6c['nodeType'] === 0x3 && !_0x778b6c['nodeValue']['trim']()) {
    let _0x3761c2 = _0x778b6c['nextSibling'];
    while (_0x3761c2?.['nodeType'] === 0x3 && !_0x3761c2['nodeValue']['trim']())
      _0x3761c2 = _0x3761c2['nextSibling'];
    return 'space:' + (_0x3761c2 ? nodeKey(_0x3761c2) : 'end');
  }
  if (_0x778b6c['nodeType'] !== 0x1) return String(_0x778b6c['nodeType']);
  if (_0x778b6c['matches']('.story-asset-card-shell')) {
    const _0xcb98eb = _0x778b6c['querySelector'](':scope\x20>\x20[data-story-asset-id]');
    if (_0xcb98eb) return _0x778b6c['tagName'] + ':shell:' + _0xcb98eb['dataset']['storyAssetId'];
  }
  const _0x3dc8be = _0x778b6c['dataset'] || {},
    _0x3c59f7 =
      _0x3dc8be['personReplacementShotCard'] === 'true'
        ? _0x3dc8be['shotId']
        : _0x3dc8be['personReplacementImportSource'] ||
          _0x3dc8be['storyAssetId'] ||
          _0x3dc8be['personReplacementVideoReferenceKey'] ||
          _0x3dc8be['slot'],
    _0x48e331 = _0x3dc8be['personReplacementAction'] || _0x3dc8be['storyAction'],
    _0x372792 = _0x3c59f7
      ? 'item:' + _0x3c59f7
      : _0x48e331
        ? 'action:' +
          _0x48e331 +
          ':' +
          (_0x3dc8be['characterId'] || _0x3dc8be['sourceId'] || _0x3dc8be['shotId'] || '')
        : _0x778b6c['id'] ||
          String(_0x778b6c['getAttribute']('class') || '')
            ['split'](/\s+/)
            ['find']((_0x5f03e0) => _0x5f03e0 && !_0x5f03e0['startsWith']('is-')) ||
          '';
  return _0x778b6c['tagName'] + ':' + _0x372792;
}
export function reconcilePersonReplacementStableDom(
  _0x30dbc6,
  _0x3145d7,
  { preserveSelector: preserveSelector = '', syncAttributes: _0x23c1f0, syncImage: _0x526a5e } = {},
) {
  const _0x46b448 = (_0x26ecdc, _0x116320) => {
    if (
      preserveSelector &&
      _0x26ecdc['matches']?.(preserveSelector) &&
      _0x116320['matches']?.(preserveSelector)
    )
      return;
    if (_0x26ecdc['nodeType'] !== 0x1) {
      if (_0x26ecdc['nodeValue'] !== _0x116320['nodeValue']) _0x26ecdc['nodeValue'] = _0x116320['nodeValue'];
      return;
    }
    if (_0x26ecdc['tagName'] === 'IMG') {
      _0x526a5e(_0x26ecdc, _0x116320);
      return;
    }
    _0x23c1f0(_0x26ecdc, _0x116320);
    const _0x5d06a9 = new Set(_0x26ecdc['childNodes']),
      _0x3bdd91 = [..._0x116320['childNodes']]['map']((_0x2d9d3b) => {
        const _0x5e3028 = nodeKey(_0x2d9d3b),
          _0xdb045 = [..._0x5d06a9]['find']((_0x380c77) => nodeKey(_0x380c77) === _0x5e3028);
        if (_0xdb045) _0x5d06a9['delete'](_0xdb045);
        return { child: _0x2d9d3b, match: _0xdb045 };
      });
    for (const _0x4f90dd of _0x5d06a9) _0x4f90dd['remove']();
    let _0xc3adfb = _0x26ecdc['firstChild'];
    for (const { child: _0x33a004, match: _0xe3c3de } of _0x3bdd91) {
      if (_0xe3c3de) {
        _0x46b448(_0xe3c3de, _0x33a004);
        if (_0xe3c3de !== _0xc3adfb) _0x26ecdc['insertBefore'](_0xe3c3de, _0xc3adfb);
        _0xc3adfb = _0xe3c3de['nextSibling'];
      } else _0x26ecdc['insertBefore'](_0x33a004, _0xc3adfb);
    }
  };
  return (_0x46b448(_0x30dbc6, _0x3145d7), !![]);
}
