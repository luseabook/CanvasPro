export function insertPlainTextAtSelection(
  value,
  { documentObject: documentObject = globalThis.document } = {},
) {
  if (typeof documentObject?.execCommand !== 'function') return false;
  const item = String(value ?? '');
  if (item) {
    const key = documentObject.activeElement,
      index = key ? documentObject.defaultView?.getComputedStyle?.(key)?.whiteSpace : '',
      result = /^(pre|pre-wrap|pre-line|break-spaces)$/.test(index || ''),
      data = item.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r\n?|\n/g, result ? '\n' : '<br>')
        .replace(/(?:<br>|\n)$/, '<br class="Apple-interchange-newline">');
    try {
      if (documentObject.execCommand('insertHTML', false, data)) return true;
    } catch {}
  }
  try {
    return documentObject.execCommand('insertText', false, item) === true;
  } catch {
    return false;
  }
}
