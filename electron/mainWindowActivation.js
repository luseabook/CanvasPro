function tryInvoke(_0x4018a1, _0x36f877, ..._0x3fcb25) {
  const _0x2fcc17 = _0x4018a1?.[_0x36f877];
  if (typeof _0x2fcc17 !== 'function') return { ok: false, value: undefined };
  try {
    return { ok: true, value: _0x2fcc17.apply(_0x4018a1, _0x3fcb25) };
  } catch {
    return { ok: false, value: undefined };
  }
}
function focusApp(_0x2ec960) {
  if (!_0x2ec960 || typeof _0x2ec960.focus !== 'function') return;
  const _0xae3dea = tryInvoke(_0x2ec960, 'focus', { steal: true });
  if (!_0xae3dea.ok) tryInvoke(_0x2ec960, 'focus');
}
export function activateMainWindow({
  app: _0x5e56b9,
  window: _0x15c3ff,
  liftToFront: liftToFront = true,
} = {}) {
  if (!_0x15c3ff || tryInvoke(_0x15c3ff, 'isDestroyed').value === true) return false;
  tryInvoke(_0x15c3ff, 'isMinimized').value === true && tryInvoke(_0x15c3ff, 'restore');
  (tryInvoke(_0x15c3ff, 'show'), tryInvoke(_0x15c3ff, 'moveTop'));
  const _0x41d0e2 = tryInvoke(_0x15c3ff, 'isAlwaysOnTop').value === true,
    _0x301888 = liftToFront && !_0x41d0e2,
    _0x58ef98 = _0x301888 ? tryInvoke(_0x15c3ff, 'setAlwaysOnTop', true) : { ok: false };
  return (
    focusApp(_0x5e56b9),
    tryInvoke(_0x15c3ff, 'focus'),
    tryInvoke(_0x15c3ff, 'moveTop'),
    tryInvoke(_0x15c3ff, 'flashFrame', false),
    _0x58ef98.ok && tryInvoke(_0x15c3ff, 'setAlwaysOnTop', false),
    true
  );
}
export const __mainWindowActivationForTest = { focusApp: focusApp, tryInvoke: tryInvoke };
