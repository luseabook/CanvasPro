const text = (_0x2ca8e1) => String(_0x2ca8e1 ?? '')['trim'](),
  escapeRegExp = (_0x5c18ce) => _0x5c18ce['replace'](/[.*+?^${}()|[\]\\]/gu, '\\$&'),
  escapeHtml = (_0x16b7e8) =>
    _0x16b7e8['replace'](/&/gu, '&amp;')
      ['replace'](/</gu, '&lt;')
      ['replace'](/>/gu, '&gt;')
      ['replace'](/"/gu, '&quot;');
export function protectStoryPromptPills(_0x410b06 = '') {
  const _0x480851 = [],
    _0xdaa1a8 = String(_0x410b06),
    _0x4ee5f9 = /<span\b[^>]*\bclass\s*=\s*["'][^"']*\bref-pill\b[^"']*["'][^>]*>/giu;
  let _0x5f517a = '',
    _0x4a2815 = 0x0,
    _0x3917da;
  while ((_0x3917da = _0x4ee5f9['exec'](_0xdaa1a8))) {
    const _0x4280ea = /<\/?span\b[^>]*>/giu;
    _0x4280ea['lastIndex'] = _0x4ee5f9['lastIndex'];
    let _0x319f73 = 0x1,
      _0x1e8e96 = _0x4ee5f9['lastIndex'],
      _0xd575d1;
    while (_0x319f73 && (_0xd575d1 = _0x4280ea['exec'](_0xdaa1a8))) {
      ((_0x319f73 += /^<\//u['test'](_0xd575d1[0x0]) ? -0x1 : 0x1), (_0x1e8e96 = _0x4280ea['lastIndex']));
    }
    if (_0x319f73) break;
    const _0x3cfb0d = 'story-pill-' + _0x480851['length'] + '';
    (_0x480851['push']({ token: _0x3cfb0d, html: _0xdaa1a8['slice'](_0x3917da['index'], _0x1e8e96) }),
      (_0x5f517a += _0xdaa1a8['slice'](_0x4a2815, _0x3917da['index']) + _0x3cfb0d),
      (_0x4a2815 = _0x1e8e96),
      (_0x4ee5f9['lastIndex'] = _0x1e8e96));
  }
  return {
    source: _0x5f517a + _0xdaa1a8['slice'](_0x4a2815),
    pills: _0x480851,
    restore: (_0x25094c) =>
      _0x480851['reduce'](
        (_0x3c1e04, _0x34bcb9) => _0x3c1e04['split'](_0x34bcb9['token'])['join'](_0x34bcb9['html']),
        _0x25094c,
      ),
  };
}
export function syncStoryClipPromptReferences(_0x4c2041, _0x32ca60 = []) {
  if (String(_0x4c2041)['includes']('【参考素材】') && String(_0x4c2041)['includes']('【分镜与声音】'))
    return _0x4c2041;
  const _0x28863b = protectStoryPromptPills(_0x4c2041 || '');
  let _0x21097d = _0x28863b['source'];
  const _0x4967b1 = _0x28863b['pills']['length'] > 0x0;
  _0x32ca60['some']((_0xb70533) => _0xb70533['replicationSource']) &&
    (_0x21097d = _0x21097d['split']('\x0a')
      ['filter']((_0x298f20) => text(_0x298f20) !== '保留原视频的视觉风格、场景和道具')
      ['join']('\x0a'));
  for (const _0x44d4ea of _0x32ca60) {
    for (const _0x488247 of _0x44d4ea['appearances'] || []) {
      const _0x4cd783 =
          '@' +
          text(_0x44d4ea['name']) +
          (text(_0x488247['name']) ? '\x20·\x20' + text(_0x488247['name']) : ''),
        _0xf4eee2 = new RegExp(
          '<span\\b(?=[^>]*\\bdata-label="' +
            escapeRegExp(escapeHtml(_0x4cd783['slice'](0x1))) +
            '")[^>]*>[\\s\\S]*?<\\/span>',
          'gu',
        ),
        _0x7c4dc7 = _0x28863b['pills']
          ['filter']((_0x56cd7f) => {
            return (
              (_0xf4eee2['lastIndex'] = 0x0),
              _0x56cd7f['html']['includes'](
                'data-asset-id=\x22story-asset:' +
                  encodeURIComponent(_0x44d4ea['id']) +
                  ':' +
                  encodeURIComponent(_0x488247['id']) +
                  '\x22',
              ) || _0xf4eee2['test'](_0x56cd7f['html'])
            );
          })
          ['map']((_0x2dabb2) => _0x2dabb2['token']),
        _0x9cca7e = [_0x4cd783, ..._0x7c4dc7];
      if (
        _0x44d4ea['kind'] === 'character' &&
        _0x488247['sourceOrigin'] === 'library' &&
        _0x488247['imageUrl']
      ) {
        for (const _0x396115 of new Set(_0x9cca7e)) {
          const _0x23981e = _0x396115 !== _0x4cd783,
            _0x3abe3c = _0x23981e ? '&lt;' : '<',
            _0x35ae1b = _0x23981e ? '&gt;' : '>',
            _0x4c1963 = _0x23981e ? escapeHtml(text(_0x44d4ea['name'])) : text(_0x44d4ea['name']),
            _0x2901b3 = new RegExp(
              '(^|\x5cn|<div>|<p>|<br\x5cs*/?>)将' +
                _0x3abe3c +
                escapeRegExp(_0x396115) +
                _0x35ae1b +
                '[^\x5cn]*?定义为' +
                _0x3abe3c +
                escapeRegExp(_0x4c1963) +
                _0x35ae1b +
                '。(?=$|\\n|</div>|</p>|<br\\s*/?>)',
              'gu',
            );
          _0x21097d = _0x21097d['replace'](
            _0x2901b3,
            (_0x432a84, _0x33f6ac) =>
              _0x33f6ac +
              '将' +
              _0x3abe3c +
              _0x396115 +
              _0x35ae1b +
              '定义为' +
              _0x3abe3c +
              _0x4c1963 +
              _0x35ae1b +
              '。人物外观、发型和服装以该参考图为准。',
          );
        }
        if (_0x9cca7e['some']((_0x1f2198) => _0x21097d['includes'](_0x1f2198)))
          _0x21097d = _0x21097d['split']('\x0a')
            ['filter']((_0x4e8c40) => !_0x4e8c40['startsWith']('声音设定（' + _0x44d4ea['name'] + '）：'))
            ['join']('\x0a');
      }
      if (
        _0x44d4ea['replicationSource'] &&
        ['scene', 'prop']['includes'](_0x44d4ea['kind']) &&
        !text(_0x488247['imageUrl'])
      ) {
        const _0x4171a5 = text(_0x488247['description'] || _0x44d4ea['description']),
          _0x372b8e = '' + text(_0x44d4ea['name']) + (_0x4171a5 ? '（' + _0x4171a5 + '）' : '');
        _0x21097d = _0x21097d['replace'](
          new RegExp(escapeRegExp(_0x4cd783) + '(?=$|[。；;，,：:\x5cs<>])', 'gu'),
          () => _0x372b8e,
        );
        if (_0x4967b1) {
          for (const _0x279cc7 of _0x7c4dc7)
            _0x21097d = _0x21097d['split'](_0x279cc7)['join'](escapeHtml(_0x372b8e));
        }
      }
    }
  }
  return _0x28863b['restore'](_0x21097d['trim']());
}
