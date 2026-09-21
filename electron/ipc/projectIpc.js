export function registerProjectIpcHandlers({
  ipcMain: _0x480888,
  openDesktopProject: _0x538252,
  saveDesktopProject: _0x511050,
  exportDesktopProjectPackage: _0x274f5a,
  importDesktopProjectPackage: _0x517d41,
  handleRendererUnsavedState: _0x2832b7,
  listRecentProjects: _0x43e6e6,
  removeRecentProject: _0x1b8d96,
  consumeExternalOpenRequests: _0xaccd9f,
  writeDesktopRecoverySnapshot: _0x132fcc,
  getDesktopRecoverySnapshotInfo: _0x1a406f,
  readDesktopRecoverySnapshot: _0x339450,
  clearDesktopRecoverySnapshot: _0x43364d,
}) {
  (_0x480888.handle('project:open', (_0x33730f, _0x175e0d) => {
    return _0x538252(_0x175e0d || {});
  }),
    _0x480888.handle('project:save', (_0x40b5f2, _0xcebdb3) => {
      return _0x511050(_0xcebdb3 || {});
    }),
    _0x480888.handle('project:exportPackage', async (_0x4d0970, _0x155be9) => {
      return await _0x274f5a(_0x155be9 || {}, { sender: _0x4d0970?.sender || null });
    }),
    _0x480888.handle('project:importPackage', async (_0x43dd1f, _0x21e71c) => {
      return await _0x517d41(_0x21e71c || {}, { sender: _0x43dd1f?.sender || null });
    }),
    _0x480888.on('project:setUnsavedState', (_0x264c2e, _0x1277a3 = {}) => {
      _0x2832b7(_0x1277a3);
    }),
    _0x480888.handle('project:listRecent', () => {
      return _0x43e6e6();
    }),
    _0x480888.handle('project:removeRecent', (_0x17c3ba, _0x561997) => {
      return _0x1b8d96(_0x561997?.recentId || '');
    }),
    _0x480888.handle('project:consumeExternalOpenRequests', () => {
      return _0xaccd9f();
    }),
    _0x480888.handle('project:writeRecoverySnapshot', (_0x4a846f, _0xce5c48 = {}) => {
      try {
        return _0x132fcc(_0xce5c48 || {});
      } catch (_0x83d580) {
        return { success: false, error: String(_0x83d580?.message || _0x83d580) };
      }
    }),
    _0x480888.handle('project:getRecoverySnapshotInfo', (_0x22ba6f, _0x3d526c = {}) => {
      try {
        return _0x1a406f(_0x3d526c || {});
      } catch (_0x548ce2) {
        return {
          exists: false,
          isNewerThanProject: false,
          savedAt: 0,
          currentLastModified: 0,
          error: String(_0x548ce2?.message || _0x548ce2),
        };
      }
    }),
    _0x480888.handle('project:readRecoverySnapshot', () => {
      try {
        return _0x339450();
      } catch (_0xb6ebca) {
        return { success: false, exists: false, error: String(_0xb6ebca?.message || _0xb6ebca) };
      }
    }),
    _0x480888.handle('project:clearRecoverySnapshot', () => {
      try {
        return _0x43364d();
      } catch (_0x5906b3) {
        return { success: false, error: String(_0x5906b3?.message || _0x5906b3) };
      }
    }));
}
