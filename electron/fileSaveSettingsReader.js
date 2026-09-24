import { readFileSync } from 'node:fs';
function readJsonFileSyncSafe(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {};
  }
}
export function readUserSettingsFromFilesSync(candidatePaths = []) {
  for (const candidatePath of candidatePaths) {
    const settings = readJsonFileSyncSafe(candidatePath);
    if (!settings || typeof settings !== 'object') continue;
    const fileSavePaths = settings.fileSavePaths,
      fileSavePathsMeta = settings.fileSavePathsMeta;
    if (
      (fileSavePaths && typeof fileSavePaths === 'object') ||
      (fileSavePathsMeta && typeof fileSavePathsMeta === 'object')
    )
      return settings;
  }
  return {};
}
