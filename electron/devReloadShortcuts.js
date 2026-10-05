function normalizeInputKey(input) {
  const key = String(input?.['key'] || '')['toLowerCase']();
  if (key) return key;
  return String(input?.['code'] || '')
    ['replace'](/^Key/i, '')
    ['toLowerCase']();
}
export function isPackagedBrowserShortcut(input) {
  const normalized = normalizeInputKey(input);
  if (normalized === 'f5' || normalized === 'f12') return true;
  const withModifier = input?.['control'] === true || input?.['meta'] === true;
  if (withModifier && normalized === 'r') return true;
  const devToolsChord =
    (input?.['control'] === true && input?.['shift'] === true) ||
    (input?.['meta'] === true && input?.['alt'] === true);
  return devToolsChord && ['c', 'i', 'j']['includes'](normalized);
}
export function installDevReloadShortcuts({ app: app, window: window }) {
  if (!window) return;
  window['webContents']['on']('before-input-event', (event, input) => {
    if (input?.['type'] !== 'keyDown') return;
    if (app?.['isPackaged']) {
      const normalized = normalizeInputKey(input),
        shouldBlock = normalized === 'f5' || ((input['control'] || input['meta']) && normalized === 'r');
      if (shouldBlock) event['preventDefault']();
      return;
    }
    const normalized = normalizeInputKey(input),
      shouldReload = normalized === 'f5' || ((input['control'] || input['meta']) && normalized === 'r');
    if (!shouldReload) return;
    event['preventDefault']();
    if (input['shift']) {
      window['webContents']['reloadIgnoringCache']();
      return;
    }
    window['webContents']['reload']();
  });
}
