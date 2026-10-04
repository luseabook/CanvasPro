import { getShortcuts } from '../shortcuts.js';
export function formatShortcutLabel(value) {
  const enabled = String(value || '').trim();
  if (!enabled) return '';
  return enabled.replace(/;/g, '；');
}
export function getShortcutLabelByAction(item, key = '') {
  try {
    const index = getShortcuts?.() || {},
      list = index?.[item]?.keys;
    if (Array.isArray(list) && list.length > 0) return formatShortcutLabel(list.join('+'));
  } catch {}
  return formatShortcutLabel(key);
}
