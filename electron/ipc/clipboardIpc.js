import { clipboard } from 'electron';
function readClipboardCustomFileReferences({
  fileReferencesFormat: _0x29b6ec,
  normalizeClipboardFileReferences: _0x2b20fd,
}) {
  try {
    const _0xb2dfd6 = clipboard.readBuffer(_0x29b6ec);
    if (!_0xb2dfd6 || _0xb2dfd6.length === 0) return [];
    const _0x3766a3 = JSON.parse(_0xb2dfd6.toString('utf8'));
    return _0x2b20fd(_0x3766a3?.files || []);
  } catch {
    return [];
  }
}
export function registerClipboardIpcHandlers({
  ipcMain: _0x52b28d,
  fileReferencesFormat: _0x28b7c3,
  createClipboardNativeImage: _0x5f4dd6,
  normalizeClipboardFileReferences: _0x313968,
  parseClipboardFileReferencesFromText: _0x21df62,
}) {
  (_0x52b28d.handle('clipboard:writeImage', (_0x29ad5f, _0xe481cf = {}) => {
    try {
      const _0x8d502 = _0x5f4dd6(_0xe481cf || {});
      if (!_0x8d502 || _0x8d502.isEmpty()) return { ok: false, reason: 'no-image' };
      const _0xfd8e72 = String(
        _0xe481cf?.text || _0xe481cf?.absolutePath || _0xe481cf?.localPath || '',
      ).trim();
      if (_0xfd8e72) clipboard.write({ image: _0x8d502, text: _0xfd8e72 });
      else clipboard.writeImage(_0x8d502);
      return { ok: true, mimeType: 'image/png' };
    } catch (_0x50fbc7) {
      return { ok: false, reason: 'write-failed', error: String(_0x50fbc7?.message || _0x50fbc7) };
    }
  }),
    _0x52b28d.handle('clipboard:readImage', () => {
      try {
        const _0x2e1f01 = clipboard.readImage();
        if (!_0x2e1f01 || _0x2e1f01.isEmpty()) return { ok: false, reason: 'no-image' };
        return { ok: true, mimeType: 'image/png', dataBase64: _0x2e1f01.toPNG().toString('base64') };
      } catch (_0x1060c2) {
        return { ok: false, reason: 'read-failed', error: String(_0x1060c2?.message || _0x1060c2) };
      }
    }),
    _0x52b28d.handle('clipboard:writeFileReferences', (_0x53bdba, _0xa02fd2 = {}) => {
      try {
        const _0x276474 = _0x313968(_0xa02fd2?.paths || _0xa02fd2?.files || []);
        if (_0x276474.length === 0) return { ok: false, reason: 'no-files', files: [] };
        const _0x4b2fe6 = _0x276474.map((_0x2b4c7b) => _0x2b4c7b.path);
        try {
          clipboard.writeBuffer(
            _0x28b7c3,
            Buffer.from(JSON.stringify({ version: 1, files: _0x4b2fe6 }), 'utf8'),
          );
        } catch {}
        return (clipboard.writeText(_0x4b2fe6.join('\n')), { ok: true, files: _0x276474 });
      } catch (_0x35a7c2) {
        return {
          ok: false,
          reason: 'write-failed',
          error: String(_0x35a7c2?.message || _0x35a7c2),
          files: [],
        };
      }
    }),
    _0x52b28d.handle('clipboard:readFileReferences', () => {
      try {
        let _0x4078c9 = readClipboardCustomFileReferences({
          fileReferencesFormat: _0x28b7c3,
          normalizeClipboardFileReferences: _0x313968,
        });
        return (
          _0x4078c9.length === 0 && (_0x4078c9 = _0x21df62(clipboard.readText())),
          { ok: _0x4078c9.length > 0, files: _0x4078c9 }
        );
      } catch (_0x162c9f) {
        return {
          ok: false,
          reason: 'read-failed',
          error: String(_0x162c9f?.message || _0x162c9f),
          files: [],
        };
      }
    }),
    _0x52b28d.handle('clipboard:writeText', (_0x1e6278, _0xb02206 = {}) => {
      try {
        return (clipboard.writeText(String(_0xb02206?.text || '')), { ok: true });
      } catch (_0x5d2313) {
        return { ok: false, reason: 'write-failed', error: String(_0x5d2313?.message || _0x5d2313) };
      }
    }),
    _0x52b28d.handle('clipboard:readText', () => {
      try {
        return { ok: true, text: clipboard.readText() };
      } catch (_0x404694) {
        return { ok: false, reason: 'read-failed', error: String(_0x404694?.message || _0x404694), text: '' };
      }
    }));
}
