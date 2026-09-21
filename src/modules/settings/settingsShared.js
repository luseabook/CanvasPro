import { getShortcuts } from '../shortcuts.js';
export function formatShortcutLabel(_0x261038) {
  const _0x988e89 = String(_0x261038 || '').trim();
  if (!_0x988e89) return '';
  return _0x988e89.replace(/;/g, '；');
}
export function getShortcutLabelByAction(_0x17516e, _0x3f5a35 = '') {
  try {
    const _0x11d47e = getShortcuts?.() || {},
      _0xedf65c = _0x11d47e?.[_0x17516e]?.keys;
    if (Array.isArray(_0xedf65c) && _0xedf65c.length > 0) return formatShortcutLabel(_0xedf65c.join('+'));
  } catch {}
  return formatShortcutLabel(_0x3f5a35);
}
