import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';
function version(_0x19a9be) {
  return typeof _0x19a9be === 'string' &&
    /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/['test'](_0x19a9be) &&
    _0x19a9be['length'] <= 0x64
    ? _0x19a9be
    : '';
}
export function recordDiagnosticsLaunchVersion({ logDir: _0x329b60, app: _0x267ba9 } = {}) {
  const _0x3a1e5b = { currentVersion: '', previousVersion: '', versionChanged: null, markerSaved: ![] },
    _0x50ac2a = path['join'](_0x329b60, 'launch-version.json'),
    _0x24edd5 = _0x50ac2a + '.' + process['pid'] + '.tmp';
  try {
    _0x3a1e5b['currentVersion'] = version(_0x267ba9?.['getVersion']?.());
    if (!_0x3a1e5b['currentVersion']) return _0x3a1e5b;
    try {
      _0x3a1e5b['previousVersion'] = version(JSON['parse'](readFileSync(_0x50ac2a, 'utf8'))['version']);
    } catch {}
    if (_0x3a1e5b['previousVersion'])
      _0x3a1e5b['versionChanged'] = _0x3a1e5b['previousVersion'] !== _0x3a1e5b['currentVersion'];
    (writeFileSync(_0x24edd5, JSON['stringify']({ version: _0x3a1e5b['currentVersion'] }), 'utf8'),
      renameSync(_0x24edd5, _0x50ac2a),
      (_0x3a1e5b['markerSaved'] = !![]));
  } catch {
    try {
      unlinkSync(_0x24edd5);
    } catch {}
  }
  return _0x3a1e5b;
}
