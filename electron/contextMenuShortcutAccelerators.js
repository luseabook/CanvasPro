const MODIFIER_ALIASES = new Set(['ctrl', 'control', 'meta', 'cmd', 'command', 'cmdorctrl', 'commandorcontrol']);
const MODIFIER_ORDER = ['CommandOrControl', 'Shift', 'Alt'];

const SHORTCUT_KEY_ALIASES = new Map([
  ['enter', 'Enter'],
  ['return', 'Enter'],
  ['tab', 'Tab'],
  ['escape', 'Escape'],
  ['esc', 'Escape'],
  ['backspace', 'Backspace'],
  ['delete', 'Delete'],
  ['del', 'Delete'],
  ['insert', 'Insert'],
  ['home', 'Home'],
  ['end', 'End'],
  ['pageup', 'PageUp'],
  ['pagedown', 'PageDown'],
  ['up', 'Up'],
  ['arrowup', 'Up'],
  ['down', 'Down'],
  ['arrowdown', 'Down'],
  ['left', 'Left'],
  ['arrowleft', 'Left'],
  ['right', 'Right'],
  ['arrowright', 'Right'],
  ['+', 'Plus'],
  ['=', 'Plus'],
  ['-', 'Minus'],
  [',', 'Comma'],
  ['.', 'Period'],
  ['/', 'Slash'],
  ['\\', 'Backslash'],
  [';', 'Semicolon'],
  ["'", 'Quote'],
  ['[', 'BracketLeft'],
  [']', 'BracketRight'],
  ['`', '`'],
  ['~', '`'],
]);

function normalizeShortcutToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (MODIFIER_ALIASES.has(lower)) return 'CommandOrControl';
  if (lower === 'shift') return 'Shift';
  if (lower === 'alt' || lower === 'option') return 'Alt';
  if (lower === 'space') return 'Space';
  if (/^f(?:[1-9]|1[0-9]|2[0-4])$/i.test(raw)) return raw.toUpperCase();
  if (/^[a-z0-9]$/i.test(raw)) return raw.toUpperCase();
  return SHORTCUT_KEY_ALIASES.get(lower) || '';
}

export function normalizeContextMenuAccelerator(value) {
  const keys = Array.isArray(value) ? value : [];
  if (keys.length === 0 || keys.length > 4) return '';
  const normalized = keys.map(normalizeShortcutToken);
  if (normalized.some((token) => !token)) return '';
  const ordered = MODIFIER_ORDER.filter((modifier) => normalized.includes(modifier));
  const primaryKeys = normalized.filter((token) => !MODIFIER_ORDER.includes(token));
  if (primaryKeys.length !== 1) return '';
  return [...ordered, primaryKeys[0]].join('+');
}
