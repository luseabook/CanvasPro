import { sanitizeRichTextHtml } from '../../utils/dom.js';
const HEADING_MAX_LEVEL = 3;
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function renderInlineMarkdown(item) {
  const list = [],
    handler = (key) => {
      const index = '' + list.length + '';
      return (list.push([index, key]), index);
    };
  let escapeHtml2 = escapeHtml(item).replace(/`([^`\n]+)`/g, (result, data) =>
    handler('<code>' + data + '</code>'),
  );
  return (
    (escapeHtml2 = escapeHtml2
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^\p{L}\p{N}_])__([^_\n]+)__(?![\p{L}\p{N}_])/gu, '$1<strong>$2</strong>')
      .replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^\p{L}\p{N}_])_([^_\n]+)_(?![\p{L}\p{N}_])/gu, '$1<em>$2</em>')),
    list.forEach(([options, target]) => {
      escapeHtml2 = escapeHtml2.replaceAll(options, target);
    }),
    escapeHtml2
  );
}
function isFenceStart(source) {
  return /^```/.test(String(source || '').trim());
}
function isHeading(next) {
  return /^(#{1,6})\s+(.+)$/.test(String(next || '').trim());
}
function isHorizontalRule(current) {
  return /^(?:-{3,}|\*{3,}|_{3,})$/.test(String(current || '').trim());
}
function getListMatch(entry) {
  const record = String(entry || ''),
    text = record.match(/^\s*[-*+]\s+(.+)$/);
  if (text) return { type: 'ul', text: text[1] };
  const text2 = record.match(/^\s*\d+[.)]\s+(.+)$/);
  if (text2) return { type: 'ol', text: text2[1] };
  return null;
}
function splitTableRow(payload) {
  let list2 = String(payload || '').trim();
  if (!list2.includes('|')) return null;
  if (list2.startsWith('|')) list2 = list2.slice(1);
  if (list2.endsWith('|')) list2 = list2.slice(0, -1);
  const list3 = [];
  let handle = '',
    enabled = false;
  for (let state = 0; state < list2.length; state += 1) {
    const config = list2[state];
    if (config === '\\' && list2[state + 1] === '|') {
      ((handle += '|'), (state += 1));
      continue;
    }
    if (config === '`') {
      ((enabled = !enabled), (handle += config));
      continue;
    }
    if (config === '|' && !enabled) {
      (list3.push(handle.trim()), (handle = ''));
      continue;
    }
    handle += config;
  }
  return (list3.push(handle.trim()), list3);
}
function isTableDividerRow(scope, count = 0) {
  const list4 = splitTableRow(scope);
  if (!list4 || list4.length < 2) return false;
  if (count > 0 && list4.length < count) return false;
  return list4.every((item2) => /^:?-{3,}:?$/.test(item2.trim()));
}
function isTableStart(input, output) {
  const list5 = splitTableRow(input[output]);
  if (!list5 || list5.length < 2) return false;
  return isTableDividerRow(input[output + 1], list5.length);
}
function normalizeTableCells(list6, value2) {
  const list7 = Array.isArray(list6) ? list6.slice(0, value2) : [];
  while (list7.length < value2) list7.push('');
  return list7;
}
function isBlockStart(value3) {
  const enabled2 = String(value3 || '').trim();
  return (
    !enabled2 ||
    isFenceStart(enabled2) ||
    isHeading(enabled2) ||
    isHorizontalRule(enabled2) ||
    /^>\s?/.test(enabled2) ||
    !!getListMatch(value3)
  );
}
function renderParagraph(list8) {
  return '<p>' + list8.map(renderInlineMarkdown).join('<br>') + '</p>';
}
function renderList(value4, list9) {
  const value5 = list9.map((item3) => '<li>' + renderInlineMarkdown(item3) + '</li>').join('');
  return '<' + value4 + '>' + value5 + '</' + value4 + '>';
}
function renderBlockquote(list10) {
  const value6 = list10.map(renderInlineMarkdown).join('<br>');
  return '<blockquote><p>' + value6 + '</p></blockquote>';
}
function renderTable(list11, list12) {
  const value7 = list11.map((item4) => '<th>' + renderInlineMarkdown(item4) + '</th>').join(''),
    value8 = list12
      .map(
        (list13) =>
          '<tr>' + list13.map((item5) => '<td>' + renderInlineMarkdown(item5) + '</td>').join('') + '</tr>',
      )
      .join('');
  return '<table><thead><tr>' + value7 + '</tr></thead><tbody>' + value8 + '</tbody></table>';
}
export function renderMarkdownToHtml(value9) {
  const enabled3 = String(value9 ?? '');
  if (!enabled3.trim()) return '';
  const value10 = enabled3.replace(/\r\n?/g, '\n'),
    list14 = value10.split('\n'),
    list15 = [];
  let value11 = 0;
  while (value11 < list14.length) {
    const value12 = list14[value11],
      enabled4 = value12.trim();
    if (!enabled4) {
      value11 += 1;
      continue;
    }
    if (isFenceStart(enabled4)) {
      const list16 = [];
      value11 += 1;
      while (value11 < list14.length && !isFenceStart(list14[value11].trim())) {
        (list16.push(list14[value11]), (value11 += 1));
      }
      if (value11 < list14.length) value11 += 1;
      list15.push('<pre><code>' + escapeHtml(list16.join('\n')) + '</code></pre>');
      continue;
    }
    const value13 = enabled4.match(/^(#{1,6})\s+(.+)$/);
    if (value13) {
      const value14 = Math.min(value13[1].length, HEADING_MAX_LEVEL);
      (list15.push('<h' + value14 + '>' + renderInlineMarkdown(value13[2].trim()) + '</h' + value14 + '>'),
        (value11 += 1));
      continue;
    }
    if (isHorizontalRule(enabled4)) {
      (list15.push('<hr>'), (value11 += 1));
      continue;
    }
    if (isTableStart(list14, value11)) {
      const list17 = splitTableRow(value12),
        value15 = list17.length,
        list18 = [];
      value11 += 2;
      while (value11 < list14.length) {
        const list19 = splitTableRow(list14[value11]);
        if (!list19 || list19.length < 2) break;
        (list18.push(normalizeTableCells(list19, value15)), (value11 += 1));
      }
      list15.push(renderTable(normalizeTableCells(list17, value15), list18));
      continue;
    }
    if (/^>\s?/.test(enabled4)) {
      const list20 = [];
      while (value11 < list14.length && /^>\s?/.test(list14[value11].trim())) {
        (list20.push(list14[value11].trim().replace(/^>\s?/, '')), (value11 += 1));
      }
      list15.push(renderBlockquote(list20));
      continue;
    }
    const listMatch = getListMatch(value12);
    if (listMatch) {
      const value16 = listMatch.type,
        list21 = [];
      while (value11 < list14.length) {
        const response = getListMatch(list14[value11]);
        if (!response || response.type !== value16) break;
        (list21.push(response.text.trim()), (value11 += 1));
      }
      list15.push(renderList(value16, list21));
      continue;
    }
    const list22 = [];
    while (value11 < list14.length && !isBlockStart(list14[value11]) && !isTableStart(list14, value11)) {
      (list22.push(list14[value11].trimEnd()), (value11 += 1));
    }
    list22.length > 0 && list15.push(renderParagraph(list22));
  }
  return sanitizeRichTextHtml(list15.join(''));
}
