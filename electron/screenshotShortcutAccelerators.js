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
  ['ins', 'Insert'],
  ['home', 'Home'],
  ['end', 'End'],
  ['pageup', 'PageUp'],
  ['pagedown', 'PageDown'],
  ['up', 'Up'],
  ['down', 'Down'],
  ['left', 'Left'],
  ['right', 'Right'],
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
]);

export function normalizeShortcutToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (
    lower === 'ctrl' ||
    lower === 'control' ||
    lower === 'cmdorctrl' ||
    lower === 'commandorcontrol' ||
    lower === 'commandorctrl'
  )
    return 'CommandOrControl';
  if (lower === 'shift') return 'Shift';
  if (lower === 'alt' || lower === 'option') return 'Alt';
  if (lower === 'space') return 'Space';
  if (lower === 'backquote' || raw === '`' || raw === '~') return '`';
  if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(raw)) return raw.toUpperCase();
  if (/^[a-z]$/i.test(raw)) return raw.toUpperCase();
  if (/^[0-9]$/.test(raw)) return raw;
  return SHORTCUT_KEY_ALIASES.get(lower) || '';
}

export function normalizeScreenshotAcceleratorKeys(value) {
  const tokens = (Array.isArray(value) ? value : []).map(normalizeShortcutToken).filter(Boolean),
    ordered = [];
  if (tokens.includes('CommandOrControl')) ordered.push('CommandOrControl');
  if (tokens.includes('Shift')) ordered.push('Shift');
  if (tokens.includes('Alt')) ordered.push('Alt');
  const primaryKeys = tokens.filter(
    (token) => token !== 'CommandOrControl' && token !== 'Shift' && token !== 'Alt',
  );
  if (primaryKeys.length !== 1) return null;
  return [...ordered, primaryKeys[0]];
}

export function parseScreenshotShortcutPayload(payload = {}) {
  const tokens = Array.isArray(payload?.keys)
      ? payload.keys
      : typeof payload?.accelerator === 'string'
        ? payload.accelerator.split('+')
        : [],
    keys = normalizeScreenshotAcceleratorKeys(tokens);
  if (!keys) return { ok: false, reason: 'invalid-shortcut' };
  return { ok: true, accelerator: keys.join('+'), keys };
}
