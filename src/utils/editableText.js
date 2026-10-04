export function insertPlainTextAtSelection(
  value,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  if (typeof documentObject?.['execCommand'] !== 'function') return ![];
  const item = String(value ?? '');
  if (item) {
    const key = documentObject['activeElement'],
      index = key ? documentObject['defaultView']?.['getComputedStyle']?.(key)?.['whiteSpace'] : '',
      result = /^(pre|pre-wrap|pre-line|break-spaces)$/['test'](index || ''),
      data = item['replace'](/&/g, '&amp;')
        ['replace'](/</g, '&lt;')
        ['replace'](/>/g, '&gt;')
        ['replace'](/\r\n?|\n/g, result ? '\x0a' : '<br>')
        ['replace'](/(?:<br>|\n)$/, '<br class="Apple-interchange-newline">');
    try {
      if (documentObject['execCommand']('insertHTML', ![], data)) return !![];
    } catch {}
  }
  try {
    return documentObject['execCommand']('insertText', ![], item) === !![];
  } catch {
    return ![];
  }
}
