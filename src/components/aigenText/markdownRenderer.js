import { sanitizeRichTextHtml } from '../../utils/dom.js';
const HEADING_MAX_LEVEL = 3;
function escapeHtml(_0x2ddc7e) {
  return String(_0x2ddc7e ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function renderInlineMarkdown(_0x524e48) {
  const _0x38db7e = [],
    _0x1dee60 = (_0x3b8b52) => {
      const _0x4b1eee = '' + _0x38db7e.length + '';
      return (_0x38db7e.push([_0x4b1eee, _0x3b8b52]), _0x4b1eee);
    };
  let _0x18dbf7 = escapeHtml(_0x524e48).replace(/`([^`\n]+)`/g, (_0x4f1366, _0x43e6f8) =>
    _0x1dee60('<code>' + _0x43e6f8 + '</code>'),
  );
  return (
    (_0x18dbf7 = _0x18dbf7
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^\p{L}\p{N}_])__([^_\n]+)__(?![\p{L}\p{N}_])/gu, '$1<strong>$2</strong>')
      .replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^\p{L}\p{N}_])_([^_\n]+)_(?![\p{L}\p{N}_])/gu, '$1<em>$2</em>')),
    _0x38db7e.forEach(([_0x5e5fa1, _0x4c416b]) => {
      _0x18dbf7 = _0x18dbf7.replaceAll(_0x5e5fa1, _0x4c416b);
    }),
    _0x18dbf7
  );
}
function isFenceStart(_0x58a0fb) {
  return /^```/.test(String(_0x58a0fb || '').trim());
}
function isHeading(_0x573b00) {
  return /^(#{1,6})\s+(.+)$/.test(String(_0x573b00 || '').trim());
}
function isHorizontalRule(_0x50c339) {
  return /^(?:-{3,}|\*{3,}|_{3,})$/.test(String(_0x50c339 || '').trim());
}
function getListMatch(_0x4fc3f6) {
  const _0x15d769 = String(_0x4fc3f6 || ''),
    _0x1ff35c = _0x15d769.match(/^\s*[-*+]\s+(.+)$/);
  if (_0x1ff35c) return { type: 'ul', text: _0x1ff35c[1] };
  const _0x4dcdaf = _0x15d769.match(/^\s*\d+[.)]\s+(.+)$/);
  if (_0x4dcdaf) return { type: 'ol', text: _0x4dcdaf[1] };
  return null;
}
function splitTableRow(_0xd86b4b) {
  let _0x1ff889 = String(_0xd86b4b || '').trim();
  if (!_0x1ff889.includes('|')) return null;
  if (_0x1ff889.startsWith('|')) _0x1ff889 = _0x1ff889.slice(1);
  if (_0x1ff889.endsWith('|')) _0x1ff889 = _0x1ff889.slice(0, -1);
  const _0x3d2cb7 = [];
  let _0x11b7f4 = '',
    _0x4ef9fe = false;
  for (let _0x135c16 = 0; _0x135c16 < _0x1ff889.length; _0x135c16 += 1) {
    const _0x5ed876 = _0x1ff889[_0x135c16];
    if (_0x5ed876 === '\\' && _0x1ff889[_0x135c16 + 1] === '|') {
      ((_0x11b7f4 += '|'), (_0x135c16 += 1));
      continue;
    }
    if (_0x5ed876 === '`') {
      ((_0x4ef9fe = !_0x4ef9fe), (_0x11b7f4 += _0x5ed876));
      continue;
    }
    if (_0x5ed876 === '|' && !_0x4ef9fe) {
      (_0x3d2cb7.push(_0x11b7f4.trim()), (_0x11b7f4 = ''));
      continue;
    }
    _0x11b7f4 += _0x5ed876;
  }
  return (_0x3d2cb7.push(_0x11b7f4.trim()), _0x3d2cb7);
}
function isTableDividerRow(_0x43e204, _0x585001 = 0) {
  const _0x39e850 = splitTableRow(_0x43e204);
  if (!_0x39e850 || _0x39e850.length < 2) return false;
  if (_0x585001 > 0 && _0x39e850.length < _0x585001) return false;
  return _0x39e850.every((_0x2509cc) => /^:?-{3,}:?$/.test(_0x2509cc.trim()));
}
function isTableStart(_0x40ae63, _0x164b61) {
  const _0x3229ea = splitTableRow(_0x40ae63[_0x164b61]);
  if (!_0x3229ea || _0x3229ea.length < 2) return false;
  return isTableDividerRow(_0x40ae63[_0x164b61 + 1], _0x3229ea.length);
}
function normalizeTableCells(_0x4e24b6, _0x130b21) {
  const _0x5f1120 = Array.isArray(_0x4e24b6) ? _0x4e24b6.slice(0, _0x130b21) : [];
  while (_0x5f1120.length < _0x130b21) _0x5f1120.push('');
  return _0x5f1120;
}
function isBlockStart(_0x5e5de7) {
  const _0x3eb491 = String(_0x5e5de7 || '').trim();
  return (
    !_0x3eb491 ||
    isFenceStart(_0x3eb491) ||
    isHeading(_0x3eb491) ||
    isHorizontalRule(_0x3eb491) ||
    /^>\s?/.test(_0x3eb491) ||
    !!getListMatch(_0x5e5de7)
  );
}
function renderParagraph(_0x3ff6fd) {
  return '<p>' + _0x3ff6fd.map(renderInlineMarkdown).join('<br>') + '</p>';
}
function renderList(_0x304852, _0x48ace2) {
  const _0x566d1a = _0x48ace2.map((_0x216e48) => '<li>' + renderInlineMarkdown(_0x216e48) + '</li>').join('');
  return '<' + _0x304852 + '>' + _0x566d1a + '</' + _0x304852 + '>';
}
function renderBlockquote(_0x2e9a9e) {
  const _0x1c5e68 = _0x2e9a9e.map(renderInlineMarkdown).join('<br>');
  return '<blockquote><p>' + _0x1c5e68 + '</p></blockquote>';
}
function renderTable(_0x202099, _0x56666c) {
  const _0x4bae75 = _0x202099.map((_0x999816) => '<th>' + renderInlineMarkdown(_0x999816) + '</th>').join(''),
    _0x31802d = _0x56666c
      .map(
        (_0x14a932) =>
          '<tr>' +
          _0x14a932.map((_0x522d47) => '<td>' + renderInlineMarkdown(_0x522d47) + '</td>').join('') +
          '</tr>',
      )
      .join('');
  return '<table><thead><tr>' + _0x4bae75 + '</tr></thead><tbody>' + _0x31802d + '</tbody></table>';
}
export function renderMarkdownToHtml(_0x35ae99) {
  const _0xbc8239 = String(_0x35ae99 ?? '');
  if (!_0xbc8239.trim()) return '';
  const _0xb2a0d2 = _0xbc8239.replace(/\r\n?/g, '\n'),
    _0xa6243 = _0xb2a0d2.split('\n'),
    _0x1eec3f = [];
  let _0x421f41 = 0;
  while (_0x421f41 < _0xa6243.length) {
    const _0x1aefe1 = _0xa6243[_0x421f41],
      _0x5afd04 = _0x1aefe1.trim();
    if (!_0x5afd04) {
      _0x421f41 += 1;
      continue;
    }
    if (isFenceStart(_0x5afd04)) {
      const _0x6e0026 = [];
      _0x421f41 += 1;
      while (_0x421f41 < _0xa6243.length && !isFenceStart(_0xa6243[_0x421f41].trim())) {
        (_0x6e0026.push(_0xa6243[_0x421f41]), (_0x421f41 += 1));
      }
      if (_0x421f41 < _0xa6243.length) _0x421f41 += 1;
      _0x1eec3f.push('<pre><code>' + escapeHtml(_0x6e0026.join('\n')) + '</code></pre>');
      continue;
    }
    const _0x577ce9 = _0x5afd04.match(/^(#{1,6})\s+(.+)$/);
    if (_0x577ce9) {
      const _0x4ca507 = Math.min(_0x577ce9[1].length, HEADING_MAX_LEVEL);
      (_0x1eec3f.push(
        '<h' + _0x4ca507 + '>' + renderInlineMarkdown(_0x577ce9[2].trim()) + '</h' + _0x4ca507 + '>',
      ),
        (_0x421f41 += 1));
      continue;
    }
    if (isHorizontalRule(_0x5afd04)) {
      (_0x1eec3f.push('<hr>'), (_0x421f41 += 1));
      continue;
    }
    if (isTableStart(_0xa6243, _0x421f41)) {
      const _0x29369b = splitTableRow(_0x1aefe1),
        _0x5bbe96 = _0x29369b.length,
        _0x21650b = [];
      _0x421f41 += 2;
      while (_0x421f41 < _0xa6243.length) {
        const _0x3c9b43 = splitTableRow(_0xa6243[_0x421f41]);
        if (!_0x3c9b43 || _0x3c9b43.length < 2) break;
        (_0x21650b.push(normalizeTableCells(_0x3c9b43, _0x5bbe96)), (_0x421f41 += 1));
      }
      _0x1eec3f.push(renderTable(normalizeTableCells(_0x29369b, _0x5bbe96), _0x21650b));
      continue;
    }
    if (/^>\s?/.test(_0x5afd04)) {
      const _0x3b8291 = [];
      while (_0x421f41 < _0xa6243.length && /^>\s?/.test(_0xa6243[_0x421f41].trim())) {
        (_0x3b8291.push(_0xa6243[_0x421f41].trim().replace(/^>\s?/, '')), (_0x421f41 += 1));
      }
      _0x1eec3f.push(renderBlockquote(_0x3b8291));
      continue;
    }
    const _0x47b136 = getListMatch(_0x1aefe1);
    if (_0x47b136) {
      const _0x5c2072 = _0x47b136.type,
        _0x1a5d3f = [];
      while (_0x421f41 < _0xa6243.length) {
        const _0x238fa8 = getListMatch(_0xa6243[_0x421f41]);
        if (!_0x238fa8 || _0x238fa8.type !== _0x5c2072) break;
        (_0x1a5d3f.push(_0x238fa8.text.trim()), (_0x421f41 += 1));
      }
      _0x1eec3f.push(renderList(_0x5c2072, _0x1a5d3f));
      continue;
    }
    const _0x13866f = [];
    while (
      _0x421f41 < _0xa6243.length &&
      !isBlockStart(_0xa6243[_0x421f41]) &&
      !isTableStart(_0xa6243, _0x421f41)
    ) {
      (_0x13866f.push(_0xa6243[_0x421f41].trimEnd()), (_0x421f41 += 1));
    }
    _0x13866f.length > 0 && _0x1eec3f.push(renderParagraph(_0x13866f));
  }
  return sanitizeRichTextHtml(_0x1eec3f.join(''));
}
