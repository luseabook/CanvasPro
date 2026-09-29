export function insertPlainTextAtSelection(
  _0x293271,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  if (typeof documentObject?.['execCommand'] !== 'function') return ![];
  const _0x4ebc5d = String(_0x293271 ?? '');
  if (_0x4ebc5d) {
    const _0x467c34 = documentObject['activeElement'],
      _0x2d0579 = _0x467c34
        ? documentObject['defaultView']?.['getComputedStyle']?.(_0x467c34)?.['whiteSpace']
        : '',
      _0x436259 = /^(pre|pre-wrap|pre-line|break-spaces)$/['test'](_0x2d0579 || ''),
      _0x41626d = _0x4ebc5d['replace'](/&/g, '&amp;')
        ['replace'](/</g, '&lt;')
        ['replace'](/>/g, '&gt;')
        ['replace'](/\r\n?|\n/g, _0x436259 ? '\x0a' : '<br>')
        ['replace'](/(?:<br>|\n)$/, '<br class="Apple-interchange-newline">');
    try {
      if (documentObject['execCommand']('insertHTML', ![], _0x41626d)) return !![];
    } catch {}
  }
  try {
    return documentObject['execCommand']('insertText', ![], _0x4ebc5d) === !![];
  } catch {
    return ![];
  }
}
