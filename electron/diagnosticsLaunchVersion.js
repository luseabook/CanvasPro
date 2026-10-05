import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';
function version(list) {
  return typeof list === 'string' &&
    /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/['test'](list) &&
    list['length'] <= 100
    ? list
    : '';
}
export function recordDiagnosticsLaunchVersion({ logDir: logDir, app: app } = {}) {
  const version2 = { currentVersion: '', previousVersion: '', versionChanged: null, markerSaved: ![] },
    value = path['join'](logDir, 'launch-version.json'),
    item = value + '.' + process['pid'] + '.tmp';
  try {
    version2['currentVersion'] = version(app?.['getVersion']?.());
    if (!version2['currentVersion']) return version2;
    try {
      version2['previousVersion'] = version(JSON['parse'](readFileSync(value, 'utf8'))['version']);
    } catch {}
    if (version2['previousVersion'])
      version2['versionChanged'] = version2['previousVersion'] !== version2['currentVersion'];
    (writeFileSync(item, JSON['stringify']({ version: version2['currentVersion'] }), 'utf8'),
      renameSync(item, value),
      (version2['markerSaved'] = !![]));
  } catch {
    try {
      unlinkSync(item);
    } catch {}
  }
  return version2;
}
