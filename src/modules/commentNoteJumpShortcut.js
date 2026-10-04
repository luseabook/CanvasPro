const MODIFIER_ORDER = Object.freeze(['Ctrl', 'Shift', 'Alt']),
  MODIFIER_ALIAS_MAP = Object.freeze({
    CTRL: 'Ctrl',
    CONTROL: 'Ctrl',
    CMD: 'Ctrl',
    COMMAND: 'Ctrl',
    META: 'Ctrl',
    SHIFT: 'Shift',
    ALT: 'Alt',
    OPTION: 'Alt',
  }),
  NAMED_KEY_MAP = Object.freeze({
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
    ESC: 'Escape',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    SPACE: 'Space',
    ENTER: 'Enter',
  }),
  DEFAULT_JUMP_ZOOM_PERCENT = 50;
export function getDefaultJumpZoomPercent() {
  return DEFAULT_JUMP_ZOOM_PERCENT;
}
function _normalizeKeyPart(value) {
  const list = String(value ?? '').trim();
  if (!list) return '';
  if (list === ' ') return 'Space';
  const item = list.toUpperCase();
  if (MODIFIER_ALIAS_MAP[item]) return MODIFIER_ALIAS_MAP[item];
  if (NAMED_KEY_MAP[item]) return NAMED_KEY_MAP[item];
  if (list.length === 1) return list.toUpperCase();
  return list[0].toUpperCase() + list.slice(1).toLowerCase();
}
export function normalizeJumpShortcutKeys(key) {
  const list2 = Array.isArray(key) ? key : [],
    map = new Set(),
    list3 = [];
  list2.forEach((item2) => {
    const _normalizeKeyPart2 = _normalizeKeyPart(item2);
    if (!_normalizeKeyPart2) return;
    if (MODIFIER_ORDER.includes(_normalizeKeyPart2)) {
      map.add(_normalizeKeyPart2);
      return;
    }
    !list3.includes(_normalizeKeyPart2) && list3.push(_normalizeKeyPart2);
  });
  const enabled = list3[0];
  if (!enabled) return [];
  const args = MODIFIER_ORDER.filter((item3) => map.has(item3));
  return [...args, enabled];
}
export function buildJumpShortcutBinding(index) {
  const list4 = normalizeJumpShortcutKeys(index);
  if (!list4.length) return '';
  return list4.join('+').toUpperCase();
}
export function formatJumpShortcutLabel(result, data = '未设置') {
  const list5 = normalizeJumpShortcutKeys(result);
  if (!list5.length) return data;
  return list5.join('+');
}
export function normalizeJumpShortcutZoomPercent(options, target = DEFAULT_JUMP_ZOOM_PERCENT) {
  if (options === null || options === undefined || options === '')
    return normalizeJumpShortcutZoomPercent(target, DEFAULT_JUMP_ZOOM_PERCENT);
  const source = Number(options);
  if (!Number.isFinite(source)) return normalizeJumpShortcutZoomPercent(target, DEFAULT_JUMP_ZOOM_PERCENT);
  return Math.max(0, Math.min(100, Math.round(source)));
}
export function normalizeCommentNoteJumpShortcut(next) {
  const map2 = next && typeof next === 'object' ? next : {};
  return {
    keys: normalizeJumpShortcutKeys(map2.keys),
    zoomPercent: normalizeJumpShortcutZoomPercent(map2.zoomPercent),
  };
}
export function parseJumpShortcutFromKeydown(event) {
  const list6 = [];
  if (event?.ctrlKey || event?.metaKey) list6.push('Ctrl');
  if (event?.shiftKey) list6.push('Shift');
  if (event?.altKey) list6.push('Alt');
  const current = event?.key === ' ' ? 'Space' : event?.key;
  return (list6.push(current), normalizeJumpShortcutKeys(list6));
}
export function jumpZoomPercentToViewportZoom(entry) {
  const jumpShortcutZoomPercent = normalizeJumpShortcutZoomPercent(entry);
  return Math.max(0.2, Math.min(0.2 + (jumpShortcutZoomPercent / 100) * 1.8, 2));
}
export function viewportZoomToJumpZoomPercent(record) {
  const payload = Number(record);
  if (!Number.isFinite(payload)) return DEFAULT_JUMP_ZOOM_PERCENT;
  const handle = Math.max(0.2, Math.min(payload, 2)),
    state = ((handle - 0.2) / 1.8) * 100;
  return normalizeJumpShortcutZoomPercent(state);
}
export function resolveJumpZoom(config) {
  return jumpZoomPercentToViewportZoom(config);
}
