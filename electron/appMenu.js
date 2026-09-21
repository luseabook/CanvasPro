export function installAppMenu({
  app: _0x83e4e,
  Menu: _0x5b26f7,
  shell: _0x490689,
  getMainWindow: _0x38f4fb,
  logDir: _0x5955d6,
  restartBackendAndReload: _0x179f15,
  stopSpawnedServer: _0x20122e,
} = {}) {
  if (_0x83e4e?.isPackaged) {
    _0x5b26f7.setApplicationMenu(null);
    return;
  }
  const _0x476d69 = [
    {
      label: 'Dev',
      submenu: [
        { label: 'Reload Canvas', accelerator: 'F5', click: () => _0x38f4fb()?.webContents.reload() },
        {
          label: 'Hard Reload Canvas',
          accelerator: 'CommandOrControl+Shift+R',
          click: () => _0x38f4fb()?.webContents.reloadIgnoringCache(),
        },
        {
          label: 'Reload Preload + Canvas',
          accelerator: 'CommandOrControl+R',
          click: () => _0x38f4fb()?.webContents.reload(),
        },
        { type: 'separator' },
        {
          label: 'Restart Backend and Reload',
          click: () => {
            void _0x179f15();
          },
        },
        {
          label: 'Relaunch Electron Main',
          click: () => {
            (_0x20122e(), _0x83e4e.relaunch(), _0x83e4e.exit(0));
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => _0x38f4fb()?.webContents.toggleDevTools(),
        },
        {
          label: 'Open Logs Folder',
          click: () => {
            void _0x490689.openPath(_0x5955d6);
          },
        },
      ],
    },
  ];
  _0x5b26f7.setApplicationMenu(_0x5b26f7.buildFromTemplate(_0x476d69));
}
