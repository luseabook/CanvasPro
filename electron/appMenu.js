export function installAppMenu({
  app, Menu, shell, getMainWindow, logDir,
  reloadCanvas = () => {}, restartBackendAndReload = () => {}, relaunchElectron = () => {},
} = {}) {
  if (app?.isPackaged) { Menu.setApplicationMenu(null); return; }
  Menu.setApplicationMenu(Menu.buildFromTemplate([{
    label: 'Dev',
    submenu: [
      { label: 'Reload Canvas', accelerator: 'F5', click: () => reloadCanvas(false) },
      { label: 'Hard Reload Canvas', accelerator: 'CommandOrControl+Shift+R', click: () => reloadCanvas(true) },
      { label: 'Reload Preload + Canvas', accelerator: 'CommandOrControl+R', click: () => reloadCanvas(false) },
      { type: 'separator' },
      { label: 'Restart Backend and Reload', click: () => restartBackendAndReload() },
      { label: 'Relaunch Electron Main', click: () => relaunchElectron() },
      { type: 'separator' },
      { label: 'Toggle DevTools', accelerator: 'F12', click: () => getMainWindow()?.webContents.toggleDevTools() },
      { label: 'Open Logs Folder', click: () => { void shell.openPath(logDir); } },
    ],
  }]));
}
