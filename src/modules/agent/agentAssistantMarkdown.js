function removeUnpairedStrongMarkersFromLine(_0x1489f6 = '') {
  const _0xe43a4 = [];
  let _0x517f0d = ![];
  for (let _0x4e21c7 = 0x0; _0x4e21c7 < _0x1489f6['length']; _0x4e21c7 += 0x1) {
    if (_0x1489f6[_0x4e21c7] === '`' && _0x1489f6[_0x4e21c7 - 0x1] !== '\x5c') {
      _0x517f0d = !_0x517f0d;
      continue;
    }
    if (
      _0x517f0d ||
      _0x1489f6[_0x4e21c7] !== '*' ||
      _0x1489f6[_0x4e21c7 + 0x1] !== '*' ||
      _0x1489f6[_0x4e21c7 - 0x1] === '*' ||
      _0x1489f6[_0x4e21c7 + 0x2] === '*' ||
      _0x1489f6[_0x4e21c7 - 0x1] === '\x5c'
    )
      continue;
    (_0xe43a4['push'](_0x4e21c7), (_0x4e21c7 += 0x1));
  }
  const _0x1b01c9 = [],
    _0x19a118 = new Set();
  return (
    _0xe43a4['forEach']((_0x6f3df3) => {
      const _0xd8d7ff = _0x1489f6[_0x6f3df3 - 0x1] || '',
        _0x278468 = _0x1489f6[_0x6f3df3 + 0x2] || '',
        _0x5d7e83 = Boolean(_0x278468 && !/\s/u['test'](_0x278468)),
        _0x30f6e7 = Boolean(_0xd8d7ff && !/\s/u['test'](_0xd8d7ff));
      if (_0x30f6e7 && _0x1b01c9['length'] > 0x0) _0x1b01c9['pop']();
      else _0x5d7e83 ? _0x1b01c9['push'](_0x6f3df3) : _0x19a118['add'](_0x6f3df3);
    }),
    _0x1b01c9['forEach']((_0x411498) => _0x19a118['add'](_0x411498)),
    [..._0x19a118]
      ['sort']((_0x569408, _0x4b3a3d) => _0x4b3a3d - _0x569408)
      ['reduce']((_0x204262, _0x25fc5f) => {
        let _0x39e4f2 = _0x204262['slice'](0x0, _0x25fc5f),
          _0x5baa3f = _0x204262['slice'](_0x25fc5f + 0x2);
        if (/[ \t]$/['test'](_0x39e4f2) && /^[ \t]/['test'](_0x5baa3f)) _0x5baa3f = _0x5baa3f['slice'](0x1);
        else {
          if (!_0x39e4f2 && /^[ \t]/['test'](_0x5baa3f)) _0x5baa3f = _0x5baa3f['slice'](0x1);
          else !_0x5baa3f && /[ \t]$/['test'](_0x39e4f2) && (_0x39e4f2 = _0x39e4f2['slice'](0x0, -0x1));
        }
        return '' + _0x39e4f2 + _0x5baa3f;
      }, _0x1489f6)
  );
}
function removeUnpairedStrongMarkers(_0x3f8253 = '') {
  return String(_0x3f8253 || '')
    ['split']('\x0a')
    ['map']((_0x36974d) => removeUnpairedStrongMarkersFromLine(_0x36974d))
    ['join']('\x0a');
}
function restoreMalformedBlockBoundaries(_0x54e8d3 = '') {
  return String(_0x54e8d3 || '')
    ['replace'](/(^|\n)[ \t]*((?:-{3,}|\*{3,}|_{3,}))[ \t]+(?=\S)/g, '$1$2\n\n')
    ['replace'](/([。！？；.!?;])[ \t]+((?:-{3,}|\*{3,}|_{3,}))[ \t]+(?=\S)/g, '$1\x0a\x0a$2\x0a\x0a')
    ['replace'](
      /^(#{1,3}\s+.{1,160}?)[ \t]+(?=(?:\*\*[^*\n]{2,48}\*\*(?:[：:]|[ \t]|$)|(?:核心概念|文案|Slogan)[：:]))/gim,
      '$1\x0a\x0a',
    );
}
export function formatAgentAssistantMarkdown(_0x25ae8e = '') {
  const _0x154886 = String(_0x25ae8e || '')
    ['replace'](/\r\n?/g, '\x0a')
    ['trim']();
  if (!_0x154886 || _0x154886['includes']('```')) return _0x154886;
  const _0x5d6dbc = _0x154886['replace'](/(^|\n)[ \t]*((?:-{3,}|\*{3,}|_{3,}))[ \t]+(?=\S)/g, '$1$2\x0a\x0a')
    ['replace'](/([。！？；])\s+(\*\*[^*\n]{2,48}\*\*[：:])/g, '$1\x0a\x0a$2')
    ['replace'](/([：:])\s*(\*\*[^*\n]{2,48}\*\*[：:])/g, '$1\x0a\x0a$2')
    ['replace'](/([。！？；])\s*(?=[^\n。！？；]{2,32}[：:])/g, '$1\n\n')
    ['replace'](
      /([。！？；])\s+(?=(?:创作目标|素材分组|当前进展|项目概览|后续建议|下一步[^：:\n]{0,24})[：:])/g,
      '$1\n\n',
    )
    ['replace'](/([：:])\s+(?=\d+[.)]\s+)/g, '$1\n')
    ['replace'](/([。！？；])\s+(?=\d+[.)]\s+)/g, '$1\n')
    ['replace'](/([^\n])\s+(\d+[.)]\s+)/g, '$1\n$2');
  return removeUnpairedStrongMarkers(restoreMalformedBlockBoundaries(_0x5d6dbc))['replace'](
    /\n{3,}/g,
    '\x0a\x0a',
  );
}
