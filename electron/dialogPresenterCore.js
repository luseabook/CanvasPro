function isUsableWindow(candidateWindow) {
  return !!candidateWindow && candidateWindow['isDestroyed']?.() !== true;
}
function focusApp(app) {
  try {
    app?.['focus']?.({ steal: true });
  } catch {
    try {
      app?.['focus']?.();
    } catch {}
  }
}
export function createForegroundDialogPresenterCore({
  app,
  dialog,
  getMainWindow = () => null,
  shouldUseOwnerWindow = () => false,
  BrowserWindowClass,
  screenApi,
} = {}) {
  let ownerWindow = null;
  function getOffscreenBounds() {
    try {
      const display = screenApi['getDisplayNearestPoint'](screenApi['getCursorScreenPoint']()),
        workArea = display?.['workArea'] || display?.['bounds'];
      if (workArea)
        return {
          x: Math['round'](workArea['x'] + Math['max'](0, workArea['width'] - 2)),
          y: Math['round'](workArea['y'] + Math['max'](0, workArea['height'] - 2)),
          width: 1,
          height: 1,
        };
    } catch {}
    return { x: -32000, y: -32000, width: 1, height: 1 };
  }
  function createOwnerWindow() {
    ((ownerWindow = new BrowserWindowClass({
      ...getOffscreenBounds(),
      show: false,
      frame: false,
      transparent: true,
      opacity: 0,
      skipTaskbar: true,
      alwaysOnTop: true,
      focusable: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    })),
      ownerWindow['on']('closed', () => {
        ownerWindow = null;
      }));
    try {
      ownerWindow['setOpacity'](0);
    } catch {}
    return ownerWindow;
  }
  function resolveDialogParentWindow() {
    const mainWindow = getMainWindow();
    if (isUsableWindow(mainWindow)) return mainWindow;
    if (!shouldUseOwnerWindow()) return null;
    if (isUsableWindow(ownerWindow)) return ownerWindow;
    return createOwnerWindow();
  }
  function presentOffscreenOwner(candidateWindow) {
    if (!isUsableWindow(candidateWindow)) return false;
    try {
      candidateWindow['setBounds'](getOffscreenBounds());
    } catch {}
    try {
      candidateWindow['setOpacity'](0);
    } catch {}
    try {
      candidateWindow['setAlwaysOnTop'](true, 'screen-saver');
    } catch {}
    try {
      candidateWindow['show']();
    } catch {}
    focusApp(app);
    try {
      candidateWindow['focus']();
    } catch {}
    try {
      candidateWindow['moveTop']();
    } catch {}
    return true;
  }
  function presentOwnerWindow(candidateWindow) {
    if (!isUsableWindow(candidateWindow)) return false;
    try {
      if (candidateWindow['isMinimized']?.()) candidateWindow['restore']?.();
    } catch {}
    try {
      candidateWindow['show']();
    } catch {}
    focusApp(app);
    try {
      candidateWindow['focus']();
    } catch {}
    try {
      candidateWindow['moveTop']();
    } catch {}
    return true;
  }
  async function runDialogMethod(methodName, options) {
    const parentWindow = resolveDialogParentWindow(),
      usesOffscreenOwner = parentWindow && parentWindow === ownerWindow;
    if (usesOffscreenOwner) presentOffscreenOwner(parentWindow);
    else parentWindow && presentOwnerWindow(parentWindow);
    try {
      return parentWindow
        ? await dialog[methodName](parentWindow, options)
        : await dialog[methodName](options);
    } finally {
      if (usesOffscreenOwner && isUsableWindow(ownerWindow))
        try {
          ownerWindow['hide']();
        } catch {}
    }
  }
  function destroyOwnerWindow() {
    if (isUsableWindow(ownerWindow)) ownerWindow['destroy']();
    ownerWindow = null;
  }
  return {
    destroyOwnerWindow: destroyOwnerWindow,
    getDialogParentWindow: resolveDialogParentWindow,
    showOpenDialog: (options) => runDialogMethod('showOpenDialog', options),
    showSaveDialog: (options) => runDialogMethod('showSaveDialog', options),
  };
}
