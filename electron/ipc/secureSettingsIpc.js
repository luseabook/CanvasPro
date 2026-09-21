export function registerSecureSettingsIpcHandlers({
  ipcMain: _0x2f8fef,
  getSecureSettingsStore: _0x542eb3,
  normalizeSecureSettingsKeys: _0x7198d4,
}) {
  (_0x2f8fef.handle('secureSettings:get', (_0x5b74d9, _0x2fe360 = {}) => {
    const _0x629566 = _0x542eb3(),
      _0x5234e4 = _0x629566.isAvailable(),
      _0x2f518d = _0x7198d4(_0x2fe360);
    return { ok: true, available: _0x5234e4, values: _0x5234e4 ? _0x629566.getMany(_0x2f518d) : {} };
  }),
    _0x2f8fef.handle('secureSettings:set', (_0x5c9d75, _0x20bfbc = {}) => {
      const _0x56eddc = _0x542eb3(),
        _0x5bba7b = _0x56eddc.isAvailable();
      if (!_0x5bba7b) return { ok: false, available: _0x5bba7b, error: '安全存储不可用' };
      try {
        return (_0x56eddc.set(_0x20bfbc?.key, _0x20bfbc?.value), { ok: true, available: _0x5bba7b });
      } catch (_0x2a60d8) {
        return { ok: false, available: _0x5bba7b, error: String(_0x2a60d8?.message || _0x2a60d8) };
      }
    }),
    _0x2f8fef.handle('secureSettings:delete', (_0x4d3829, _0x4a9160 = {}) => {
      const _0x483515 = _0x542eb3(),
        _0x5d2599 = _0x483515.isAvailable();
      if (!_0x5d2599) return { ok: false, available: _0x5d2599, error: '安全存储不可用' };
      try {
        return (_0x483515.delete(_0x4a9160?.key), { ok: true, available: _0x5d2599 });
      } catch (_0x511951) {
        return { ok: false, available: _0x5d2599, error: String(_0x511951?.message || _0x511951) };
      }
    }));
}
