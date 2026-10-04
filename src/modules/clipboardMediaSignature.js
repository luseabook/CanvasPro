export async function buildClipboardMediaSignature(enabled, value = enabled?.['type']) {
  if (!enabled || !globalThis['crypto']?.['subtle']) return '';
  try {
    const item = await globalThis['crypto']['subtle']['digest']('SHA-256', await enabled['arrayBuffer']()),
      key = Array['from'](new Uint8Array(item), (index) => index['toString'](0x10)['padStart'](0x2, '0'))[
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
  for (let data = 0x0; data < list['length']; data += 0x1) uint8Array[data] = list['charCodeAt'](data);
  return new Blob([uint8Array], { type: type });
}
