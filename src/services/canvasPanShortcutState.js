let canvasPanShortcutHeld = ![];
export function setCanvasPanShortcutHeld(
  value,
  {
    windowObject: windowObject = globalThis['window'],
    documentObject: documentObject = globalThis['document'],
  } = {},
) {
  canvasPanShortcutHeld = value === !![];
  if (windowObject) windowObject['_spaceHeld'] = canvasPanShortcutHeld;
  const el = documentObject?.['getElementById']?.('v2-wrap');
  el && (el['style']['cursor'] = canvasPanShortcutHeld ? 'var(--grab-cursor)' : '');
}
export function releaseCanvasPanShortcut(item) {
  setCanvasPanShortcutHeld(![], item);
}
export function isCanvasPanShortcutHeld() {
  return canvasPanShortcutHeld;
}
