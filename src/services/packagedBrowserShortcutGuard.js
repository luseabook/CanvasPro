function normalizeKeyboardKey(event) {
  const value = String(event?.key || '').toLowerCase();
  if (value) return value;
  return String(event?.code || '')
    .replace(/^Key/i, '')
    .toLowerCase();
}
const INITIAL_APP_SHORTCUT_BINDINGS = Object.freeze(['CTRL+SHIFT+C']);
function eventBinding(item) {
  const list = [];
  if (item?.ctrlKey === true || item?.metaKey === true) list.push('CTRL');
  if (item?.shiftKey === true) list.push('SHIFT');
  if (item?.altKey === true) list.push('ALT');
  const keyboardKey = normalizeKeyboardKey(item);
  return (
    keyboardKey &&
      !['control', 'ctrl', 'meta', 'shift', 'alt'].includes(keyboardKey) &&
      list.push(keyboardKey.toUpperCase()),
    list.join('+')
  );
}
function isConfiguredAppShortcut(key, index) {
  const eventBinding2 = eventBinding(index),
    list2 = Array.isArray(key?.__aicConfiguredShortcutBindings)
      ? key.__aicConfiguredShortcutBindings
      : INITIAL_APP_SHORTCUT_BINDINGS;
  return !!eventBinding2 && list2.includes(eventBinding2);
}
function isInspectElementShortcut(result) {
  const keyboardKey2 = normalizeKeyboardKey(result);
  return (
    keyboardKey2 === 'c' &&
    ((result?.ctrlKey === true && result?.shiftKey === true) ||
      (result?.metaKey === true && result?.shiftKey === true))
  );
}
export function isPackagedChromeShellLocation(data = globalThis.location) {
  try {
    const map = new URLSearchParams(String(data?.search || ''));
    return map.get('aicRuntime') === 'chrome-shell' && map.get('aicPackaged') === '1';
  } catch {
    return false;
  }
}
export function isBlockedPackagedBrowserShortcut(options) {
  const keyboardKey3 = normalizeKeyboardKey(options);
  if (keyboardKey3 === 'f5' || keyboardKey3 === 'f12') return true;
  const target = options?.ctrlKey === true || options?.metaKey === true;
  if (target && keyboardKey3 === 'r') return true;
  const source =
      (options?.ctrlKey === true && options?.shiftKey === true) ||
      (options?.metaKey === true && options?.altKey === true),
    next = options?.metaKey === true && options?.shiftKey === true;
  return (source && ['c', 'i', 'j'].includes(keyboardKey3)) || (next && keyboardKey3 === 'c');
}
export function installPackagedBrowserShortcutGuard({
  windowObject: windowObject = globalThis.window,
  locationObject: locationObject = windowObject?.location,
} = {}) {
  if (!windowObject?.addEventListener) return () => {};
  const current = (event2) => {
    if (windowObject.__aicShortcutRecording === true) return;
    const isBlockedPackagedBrowserShortcut2 = isBlockedPackagedBrowserShortcut(event2);
    if (isBlockedPackagedBrowserShortcut2 && isConfiguredAppShortcut(windowObject, event2)) {
      event2.preventDefault?.();
      return;
    }
    if (isInspectElementShortcut(event2)) {
      event2.preventDefault?.();
      return;
    }
    if (!isPackagedChromeShellLocation(locationObject)) return;
    if (!isBlockedPackagedBrowserShortcut2) return;
    (event2.preventDefault?.(), event2.stopImmediatePropagation?.());
  };
  return (
    windowObject.addEventListener('keydown', current, true),
    () => {
      windowObject.removeEventListener?.('keydown', current, true);
    }
  );
}
