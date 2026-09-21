import path from 'node:path';
const WINDOWS_STATE_DIRNAME = 'AI-CanvasPro',
  PACKAGED_FILES_DIRNAME = 'files';
function trimText(_0x31e252) {
  return String(_0x31e252 || '').trim();
}
function normalizePathKey(_0x218af0, _0x1c6ea5 = process.platform) {
  const _0x25ae89 = path.resolve(String(_0x218af0 || ''));
  return _0x1c6ea5 === 'win32' || _0x1c6ea5 === 'darwin' ? _0x25ae89.toLowerCase() : _0x25ae89;
}
function pushUniquePath(_0x1cd0c2, _0x571206, _0x4cd06d = process.platform) {
  const _0x312c14 = trimText(_0x571206);
  if (!_0x312c14) return;
  const _0x2617d8 = normalizePathKey(_0x312c14, _0x4cd06d);
  if (_0x1cd0c2.some((_0x15e5cb) => normalizePathKey(_0x15e5cb, _0x4cd06d) === _0x2617d8)) return;
  _0x1cd0c2.push(_0x312c14);
}
export function resolvePackagedFilesRoot({
  localAppData: _0x1e13b6,
  userDataRoot: _0x248897,
  platform: platform = process.platform,
} = {}) {
  const _0x11b87e = trimText(_0x248897),
    _0x46f130 = trimText(_0x1e13b6);
  if (platform === 'win32' && _0x46f130)
    return path.join(_0x46f130, WINDOWS_STATE_DIRNAME, PACKAGED_FILES_DIRNAME);
  return path.join(_0x11b87e || _0x46f130, PACKAGED_FILES_DIRNAME);
}
export function createStorageRoots({
  appIsPackaged: _0x476d07,
  appRoot: _0x8b0a27,
  processExecPath: _0x1f669e,
  userDataRoot: _0x14cbb5,
  localAppData: _0x210e09,
  platform: platform = process.platform,
} = {}) {
  const _0x5964a1 = path.resolve(_0x8b0a27 || '.'),
    _0x2cafec = _0x476d07 ? path.dirname(path.resolve(_0x1f669e || _0x5964a1)) : _0x5964a1,
    _0x4a59f4 = _0x476d07 ? path.join(_0x2cafec, 'Data') : _0x5964a1,
    _0x49ae9c = _0x476d07
      ? resolvePackagedFilesRoot({ localAppData: _0x210e09, userDataRoot: _0x14cbb5, platform: platform })
      : path.join(_0x5964a1, 'user-data'),
    _0x1f84e4 = [];
  return (
    _0x476d07
      ? (pushUniquePath(_0x1f84e4, _0x4a59f4, platform),
        pushUniquePath(_0x1f84e4, path.join(trimText(_0x14cbb5), PACKAGED_FILES_DIRNAME), platform))
      : pushUniquePath(_0x1f84e4, _0x5964a1, platform),
    {
      installRoot: _0x2cafec,
      installDataRoot: _0x4a59f4,
      storageRoot: _0x49ae9c,
      legacyFilesRoots: _0x1f84e4.filter(
        (_0x1ea907) => normalizePathKey(_0x1ea907, platform) !== normalizePathKey(_0x49ae9c, platform),
      ),
    }
  );
}
export function buildLegacyFileSavePathEnv(_0x362eb8 = []) {
  const _0x4c8b37 = {};
  return (
    _0x362eb8.forEach((_0x28bfb7, _0x5374e6) => {
      const _0xa7b167 = trimText(_0x28bfb7);
      if (!_0xa7b167) return;
      const _0x109690 = _0x5374e6 === 0 ? '' : '_' + (_0x5374e6 + 1);
      ((_0x4c8b37['AIC_LEGACY_CANVAS_DIR' + _0x109690] = path.join(_0xa7b167, 'Canvas Project')),
        (_0x4c8b37['AIC_LEGACY_DATA_DIR' + _0x109690] = path.join(_0xa7b167, 'data')),
        (_0x4c8b37['AIC_LEGACY_OUTPUT_DIR' + _0x109690] = path.join(_0xa7b167, 'output')),
        (_0x4c8b37['AIC_LEGACY_UPLOADS_DIR' + _0x109690] = path.join(_0xa7b167, 'data', 'uploads')));
    }),
    _0x4c8b37
  );
}
