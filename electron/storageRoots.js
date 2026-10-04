import path from 'node:path';
const WINDOWS_STATE_DIRNAME = 'AI-CanvasPro',
  PACKAGED_FILES_DIRNAME = 'files';
function trimText(value) {
  return String(value || '').trim();
}
function normalizePathKey(item, key = process.platform) {
  const index = path.resolve(String(item || ''));
  return key === 'win32' || key === 'darwin' ? index.toLowerCase() : index;
}
function pushUniquePath(list, result, data = process.platform) {
  const trimText2 = trimText(result);
  if (!trimText2) return;
  const pathKey = normalizePathKey(trimText2, data);
  if (list.some((item2) => normalizePathKey(item2, data) === pathKey)) return;
  list.push(trimText2);
}
export function resolvePackagedFilesRoot({
  localAppData: localAppData,
  userDataRoot: userDataRoot,
  platform: platform = process.platform,
} = {}) {
  const trimText3 = trimText(userDataRoot),
    trimText4 = trimText(localAppData);
  if (platform === 'win32' && trimText4)
    return path.join(trimText4, WINDOWS_STATE_DIRNAME, PACKAGED_FILES_DIRNAME);
  return path.join(trimText3 || trimText4, PACKAGED_FILES_DIRNAME);
}
export function createStorageRoots({
  appIsPackaged: appIsPackaged,
  appRoot: appRoot,
  processExecPath: processExecPath,
  userDataRoot: userDataRoot2,
  localAppData: localAppData2,
  storageRootOverride = '',
  platform: platform = process.platform,
} = {}) {
  const options = path.resolve(appRoot || '.'),
    installRoot = appIsPackaged ? path.dirname(path.resolve(processExecPath || options)) : options,
    installDataRoot = appIsPackaged ? path.join(installRoot, 'Data') : options,
    storageRoot = appIsPackaged
      ? resolvePackagedFilesRoot({
          localAppData: localAppData2,
          userDataRoot: userDataRoot2,
          platform: platform,
        })
      : path.join(options, 'user-data'),
    legacyFilesRoots = [];
  if (trimText(storageRootOverride)) {
    return {
      installRoot: installRoot,
      installDataRoot: installDataRoot,
      storageRoot: path.resolve(storageRootOverride),
      legacyFilesRoots: [],
    };
  }
  return (
    appIsPackaged
      ? (pushUniquePath(legacyFilesRoots, installDataRoot, platform),
        pushUniquePath(
          legacyFilesRoots,
          path.join(trimText(userDataRoot2), PACKAGED_FILES_DIRNAME),
          platform,
        ))
      : pushUniquePath(legacyFilesRoots, options, platform),
    {
      installRoot: installRoot,
      installDataRoot: installDataRoot,
      storageRoot: storageRoot,
      legacyFilesRoots: legacyFilesRoots.filter(
        (item3) => normalizePathKey(item3, platform) !== normalizePathKey(storageRoot, platform),
      ),
    }
  );
}
export function buildLegacyFileSavePathEnv(list2 = []) {
  const target = {};
  return (
    list2.forEach((item4, count) => {
      const trimText5 = trimText(item4);
      if (!trimText5) return;
      const source = count === 0 ? '' : '_' + (count + 1);
      ((target['AIC_LEGACY_CANVAS_DIR' + source] = path.join(trimText5, 'Canvas Project')),
        (target['AIC_LEGACY_DATA_DIR' + source] = path.join(trimText5, 'data')),
        (target['AIC_LEGACY_OUTPUT_DIR' + source] = path.join(trimText5, 'output')),
        (target['AIC_LEGACY_UPLOADS_DIR' + source] = path.join(trimText5, 'data', 'uploads')));
    }),
    target
  );
}
