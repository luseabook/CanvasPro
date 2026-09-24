function isUsableWindow(candidateWindow) {
  return !!candidateWindow && candidateWindow['isDestroyed']?.() !== !![];
}
function focusApp(app) {
  try {
    app?.['focus']?.({ steal: !![] });
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
  shouldUseOwnerWindow = () => ![],
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
          x: Math['round'](workArea['x'] + Math['max'](0x0, workArea['width'] - 0x2)),
          y: Math['round'](workArea['y'] + Math['max'](0x0, workArea['height'] - 0x2)),
          width: 0x1,
          height: 0x1,
        };
    } catch {}
    return { x: -0x7d00, y: -0x7d00, width: 0x1, height: 0x1 };
  }
  function createOwnerWindow() {
    ((ownerWindow = new BrowserWindowClass({
      ...getOffscreenBounds(),
      show: ![],
      frame: ![],
      transparent: !![],
      opacity: 0x0,
      skipTaskbar: !![],
      alwaysOnTop: !![],
      focusable: !![],
      resizable: ![],
      movable: ![],
      minimizable: ![],
      maximizable: ![],
      webPreferences: { contextIsolation: !![], nodeIntegration: ![], sandbox: !![] },
    })),
      ownerWindow['on']('closed', () => {
        ownerWindow = null;
      }));
    try {
      ownerWindow['setOpacity'](0x0);
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
    if (!isUsableWindow(candidateWindow)) return ![];
    try {
      candidateWindow['setBounds'](getOffscreenBounds());
    } catch {}
    try {
      candidateWindow['setOpacity'](0x0);
    } catch {}
    try {
      candidateWindow['setAlwaysOnTop'](!![], 'screen-saver');
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
    return !![];
  }
  function presentOwnerWindow(candidateWindow) {
    if (!isUsableWindow(candidateWindow)) return ![];
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
    return !![];
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
