let canvasPanShortcutHeld = ![];
export function setCanvasPanShortcutHeld(
  _0x145f88,
  {
    windowObject: windowObject = globalThis['window'],
    documentObject: documentObject = globalThis['document'],
  } = {},
) {
  canvasPanShortcutHeld = _0x145f88 === !![];
  if (windowObject) windowObject['_spaceHeld'] = canvasPanShortcutHeld;
  const _0x171dca = documentObject?.['getElementById']?.('v2-wrap');
  _0x171dca && (_0x171dca['style']['cursor'] = canvasPanShortcutHeld ? 'var(--grab-cursor)' : '');
}
export function releaseCanvasPanShortcut(_0x2f402d) {
  setCanvasPanShortcutHeld(![], _0x2f402d);
}
export function isCanvasPanShortcutHeld() {
  return canvasPanShortcutHeld;
}
