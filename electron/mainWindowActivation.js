function tryInvoke(value, item, ...args) {
  const value2 = value?.[item];
  if (typeof value2 !== 'function') return { ok: false, value: undefined };
  try {
    return { ok: true, value: value2.apply(value, args) };
  } catch {
    return { ok: false, value: undefined };
  }
}
function focusApp(el) {
  if (!el || typeof el.focus !== 'function') return;
  const response = tryInvoke(el, 'focus', { steal: true });
  if (!response.ok) tryInvoke(el, 'focus');
}
export function activateMainWindow({ app: app, window: window, liftToFront: liftToFront = true } = {}) {
  if (!window || tryInvoke(window, 'isDestroyed').value === true) return false;
  tryInvoke(window, 'isMinimized').value === true && tryInvoke(window, 'restore');
  (tryInvoke(window, 'show'), tryInvoke(window, 'moveTop'));
  const tryInvoke2 = tryInvoke(window, 'isAlwaysOnTop').value === true,
    key = liftToFront && !tryInvoke2,
    response2 = key ? tryInvoke(window, 'setAlwaysOnTop', true) : { ok: false };
  return (
    focusApp(app),
    tryInvoke(window, 'focus'),
    tryInvoke(window, 'moveTop'),
    tryInvoke(window, 'flashFrame', false),
    response2.ok && tryInvoke(window, 'setAlwaysOnTop', false),
    true
  );
}
export const __mainWindowActivationForTest = { focusApp: focusApp, tryInvoke: tryInvoke };
