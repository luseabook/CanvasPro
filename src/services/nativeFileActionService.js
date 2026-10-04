import { normalizeLocalPath } from '../utils/localMediaPath.js';
function getElectronApi() {
  return globalThis.window?.electronAPI || null;
}
export function resolveNodeLocalPathForNativeAction(response) {
  const list = [
    response?.originalLocalPath,
    response?.localPath,
    response?.displayLocalPath,
    response?.posterLocalPath,
    response?.waveformLocalPath,
    response?.src,
    response?.imageUrl,
    response?.videoUrl,
    response?.audioUrl,
    response?.url,
    response?.resultUrl,
  ];
  return list.map((item) => normalizeLocalPath(item)).find(Boolean) || '';
}
export function canShowItemInFolder(enabled) {
  return !!enabled && typeof getElectronApi()?.showItemInFolder === 'function';
}
export function canOpenKnownFolder(enabled2) {
  return !!enabled2 && typeof getElectronApi()?.openKnownFolder === 'function';
}
export async function showItemInFolder(localPath) {
  const electronApi = getElectronApi();
  if (!canShowItemInFolder(localPath)) throw new Error('showItemInFolder unavailable');
  return electronApi.showItemInFolder({ localPath: localPath });
}
export async function openKnownFolder(kind) {
  const electronApi2 = getElectronApi();
  if (!canOpenKnownFolder(kind)) throw new Error('openKnownFolder unavailable');
  return electronApi2.openKnownFolder({ kind: kind });
}
