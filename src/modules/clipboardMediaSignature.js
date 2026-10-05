export async function buildClipboardMediaSignature(enabled, value = enabled?.['type']) {
  if (!enabled || !globalThis['crypto']?.['subtle']) return '';
  try {
    const item = await globalThis['crypto']['subtle']['digest']('SHA-256', await enabled['arrayBuffer']()),
      key = Array['from'](new Uint8Array(item), (index) => index['toString'](16)['padStart'](2, '0'))[
        'join'
      ]('');
    return 'media:' + String(value)['toLowerCase']() + '|sha256:' + key;
  } catch {
    return '';
  }
}
export function clipboardImageBlobFromBase64(result, type = 'image/png') {
  const list = atob(String(result || '')),
    uint8Array = new Uint8Array(list['length']);
  for (let data = 0; data < list['length']; data += 1) uint8Array[data] = list['charCodeAt'](data);
  return new Blob([uint8Array], { type: type });
}
