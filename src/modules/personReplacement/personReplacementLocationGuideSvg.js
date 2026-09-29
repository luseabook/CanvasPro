import { PERSON_REPLACEMENT_MARKER_COLORS } from './personReplacementPromptMode.js';
const escapeXml = (_0x470390) =>
  String(_0x470390)
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;');
export function buildPersonReplacementLocationGuideSvg({ frame: frame = {}, people: people = [] } = {}) {
  const _0x371546 = 0x4b0,
    _0x1506a5 = Math['max'](
      0x1,
      Math['round']((_0x371546 * (Number(frame['height']) || 0x9)) / (Number(frame['width']) || 0x10)),
    ),
    _0xdc5122 = [0.25, 0.5, 0.75]
      ['map'](
        (_0x24fb69) =>
          '<path d="M' +
          _0x371546 * _0x24fb69 +
          ' 0V' +
          _0x1506a5 +
          '\x20M0\x20' +
          _0x1506a5 * _0x24fb69 +
          'H' +
          _0x371546 +
          '"/>',
      )
      ['join'](''),
    _0x554b6e = people['map'](({ label: _0x3dbbf9, bbox: _0x16a085, markerIndex: _0x397a08 }, _0x4ff880) => {
      const _0x3a18b1 = Math['round'](_0x16a085['x'] * _0x371546),
        _0x161d34 = Math['round'](_0x16a085['y'] * _0x1506a5),
        _0x4faa55 =
          'var(' +
          PERSON_REPLACEMENT_MARKER_COLORS[
            (_0x397a08 ?? _0x4ff880) % PERSON_REPLACEMENT_MARKER_COLORS['length']
          ] +
          ')';
      return (
        '<g data-person-label="' +
        escapeXml(_0x3dbbf9) +
        '"><rect x="' +
        _0x3a18b1 +
        '" y="' +
        _0x161d34 +
        '" width="' +
        Math['round'](_0x16a085['width'] * _0x371546) +
        '" height="' +
        Math['round'](_0x16a085['height'] * _0x1506a5) +
        '\x22\x20rx=\x2210\x22\x20fill=\x22' +
        _0x4faa55 +
        '\x22\x20fill-opacity=\x220.12\x22\x20stroke=\x22' +
        _0x4faa55 +
        '" stroke-width="8"/><rect x="' +
        _0x3a18b1 +
        '" y="' +
        _0x161d34 +
        '\x22\x20width=\x2272\x22\x20height=\x2272\x22\x20rx=\x228\x22\x20fill=\x22' +
        _0x4faa55 +
        '"/><text x="' +
        (_0x3a18b1 + 0x24) +
        '" y="' +
        (_0x161d34 + 0x37) +
        '" text-anchor="middle" fill="var(--canvas-black)" font-family="Arial, sans-serif" font-size="56" font-weight="800">' +
        escapeXml(_0x3dbbf9) +
        '</text></g>'
      );
    })['join'](''),
    _0x38e674 =
      '<svg\x20xmlns=\x22http://www.w3.org/2000/svg\x22\x20width=\x22' +
      _0x371546 +
      '\x22\x20height=\x22' +
      _0x1506a5 +
      '" viewBox="0 0 ' +
      _0x371546 +
      '\x20' +
      _0x1506a5 +
      '"><rect width="100%" height="100%" fill="var(--canvas-black)"/><g stroke="var(--canvas-white)" stroke-opacity="0.18" stroke-width="2">' +
      _0xdc5122 +
      '</g>' +
      _0x554b6e +
      '</svg>';
  return {
    dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(_0x38e674),
    width: _0x371546,
    height: _0x1506a5,
    personCount: people['length'],
  };
}
export function resolvePersonReplacementLocationGuidePreview(_0xcccfa0) {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return _0xcccfa0;
  const _0x4b8179 = getComputedStyle(document['documentElement']),
    _0x563eb0 = decodeURIComponent(_0xcccfa0['slice'](_0xcccfa0['indexOf'](',') + 0x1))['replace'](
      /var\((--[a-z0-9-]+)\)/g,
      (_0x2019b4, _0x458181) => {
        const _0x458258 = _0x4b8179['getPropertyValue'](_0x458181)['trim']();
        if (!_0x458258) throw new Error('人物定位图颜色未初始化：' + _0x458181);
        return escapeXml(_0x458258);
      },
    );
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(_0x563eb0);
}
