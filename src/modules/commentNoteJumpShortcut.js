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
function _normalizeKeyPart(_0x200c80) {
  const _0x1e6db6 = String(_0x200c80 ?? '').trim();
  if (!_0x1e6db6) return '';
  if (_0x1e6db6 === ' ') return 'Space';
  const _0x5526ab = _0x1e6db6.toUpperCase();
  if (MODIFIER_ALIAS_MAP[_0x5526ab]) return MODIFIER_ALIAS_MAP[_0x5526ab];
  if (NAMED_KEY_MAP[_0x5526ab]) return NAMED_KEY_MAP[_0x5526ab];
  if (_0x1e6db6.length === 1) return _0x1e6db6.toUpperCase();
  return _0x1e6db6[0].toUpperCase() + _0x1e6db6.slice(1).toLowerCase();
}
export function normalizeJumpShortcutKeys(_0x41d0e4) {
  const _0x1767f0 = Array.isArray(_0x41d0e4) ? _0x41d0e4 : [],
    _0x460d3f = new Set(),
    _0x57e594 = [];
  _0x1767f0.forEach((_0x3bd3a0) => {
    const _0x5a0a41 = _normalizeKeyPart(_0x3bd3a0);
    if (!_0x5a0a41) return;
    if (MODIFIER_ORDER.includes(_0x5a0a41)) {
      _0x460d3f.add(_0x5a0a41);
      return;
    }
    !_0x57e594.includes(_0x5a0a41) && _0x57e594.push(_0x5a0a41);
  });
  const _0x174eb2 = _0x57e594[0];
  if (!_0x174eb2) return [];
  const _0x503698 = MODIFIER_ORDER.filter((_0x10ed78) => _0x460d3f.has(_0x10ed78));
  return [..._0x503698, _0x174eb2];
}
export function buildJumpShortcutBinding(_0x2029e1) {
  const _0x4088b8 = normalizeJumpShortcutKeys(_0x2029e1);
  if (!_0x4088b8.length) return '';
  return _0x4088b8.join('+').toUpperCase();
}
export function formatJumpShortcutLabel(_0x32d1b0, _0x1e4036 = '未设置') {
  const _0x163b1f = normalizeJumpShortcutKeys(_0x32d1b0);
  if (!_0x163b1f.length) return _0x1e4036;
  return _0x163b1f.join('+');
}
export function normalizeJumpShortcutZoomPercent(_0x10a95d, _0x26fe18 = DEFAULT_JUMP_ZOOM_PERCENT) {
  if (_0x10a95d === null || _0x10a95d === undefined || _0x10a95d === '')
    return normalizeJumpShortcutZoomPercent(_0x26fe18, DEFAULT_JUMP_ZOOM_PERCENT);
  const _0x1d8ec7 = Number(_0x10a95d);
  if (!Number.isFinite(_0x1d8ec7))
    return normalizeJumpShortcutZoomPercent(_0x26fe18, DEFAULT_JUMP_ZOOM_PERCENT);
  return Math.max(0, Math.min(100, Math.round(_0x1d8ec7)));
}
export function normalizeCommentNoteJumpShortcut(_0x33d6ee) {
  const _0xbb1028 = _0x33d6ee && typeof _0x33d6ee === 'object' ? _0x33d6ee : {};
  return {
    keys: normalizeJumpShortcutKeys(_0xbb1028.keys),
    zoomPercent: normalizeJumpShortcutZoomPercent(_0xbb1028.zoomPercent),
  };
}
export function parseJumpShortcutFromKeydown(_0x768208) {
  const _0x1416eb = [];
  if (_0x768208?.ctrlKey || _0x768208?.metaKey) _0x1416eb.push('Ctrl');
  if (_0x768208?.shiftKey) _0x1416eb.push('Shift');
  if (_0x768208?.altKey) _0x1416eb.push('Alt');
  const _0x4b851a = _0x768208?.key === ' ' ? 'Space' : _0x768208?.key;
  return (_0x1416eb.push(_0x4b851a), normalizeJumpShortcutKeys(_0x1416eb));
}
export function jumpZoomPercentToViewportZoom(_0x51e677) {
  const _0x572bc4 = normalizeJumpShortcutZoomPercent(_0x51e677);
  return Math.max(0.2, Math.min(0.2 + (_0x572bc4 / 100) * 1.8, 2));
}
export function viewportZoomToJumpZoomPercent(_0x64728d) {
  const _0x242c0e = Number(_0x64728d);
  if (!Number.isFinite(_0x242c0e)) return DEFAULT_JUMP_ZOOM_PERCENT;
  const _0x51a3ec = Math.max(0.2, Math.min(_0x242c0e, 2)),
    _0x2f75a0 = ((_0x51a3ec - 0.2) / 1.8) * 100;
  return normalizeJumpShortcutZoomPercent(_0x2f75a0);
}
export function resolveJumpZoom(_0xcd2a60) {
  return jumpZoomPercentToViewportZoom(_0xcd2a60);
}
