import { normalizeLocalPath } from '../utils/localMediaPath.js';
function getElectronApi() {
  return globalThis.window?.electronAPI || null;
}
export function resolveNodeLocalPathForNativeAction(_0x2db011) {
  const _0x424c7b = [
    _0x2db011?.originalLocalPath,
    _0x2db011?.localPath,
    _0x2db011?.displayLocalPath,
    _0x2db011?.posterLocalPath,
    _0x2db011?.waveformLocalPath,
    _0x2db011?.src,
    _0x2db011?.imageUrl,
    _0x2db011?.videoUrl,
    _0x2db011?.audioUrl,
    _0x2db011?.url,
    _0x2db011?.resultUrl,
  ];
  return _0x424c7b.map((_0x565a82) => normalizeLocalPath(_0x565a82)).find(Boolean) || '';
}
export function canShowItemInFolder(_0x470731) {
  return !!_0x470731 && typeof getElectronApi()?.showItemInFolder === 'function';
}
export function canOpenKnownFolder(_0x5a0c58) {
  return !!_0x5a0c58 && typeof getElectronApi()?.openKnownFolder === 'function';
}
export async function showItemInFolder(_0xb5c702) {
  const _0x549ddc = getElectronApi();
  if (!canShowItemInFolder(_0xb5c702)) throw new Error('showItemInFolder unavailable');
  return _0x549ddc.showItemInFolder({ localPath: _0xb5c702 });
}
export async function openKnownFolder(_0x1b3dc1) {
  const _0x25f1ab = getElectronApi();
  if (!canOpenKnownFolder(_0x1b3dc1)) throw new Error('openKnownFolder unavailable');
  return _0x25f1ab.openKnownFolder({ kind: _0x1b3dc1 });
}
