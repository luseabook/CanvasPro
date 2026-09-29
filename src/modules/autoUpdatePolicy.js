export const AUTO_UPDATE_PRIMARY_ACTIONS = Object['freeze']({
  CLOSE: 'close',
  INSTALL_DESKTOP: 'install-desktop',
  RETRY_DESKTOP: 'retry-desktop',
  DOWNLOAD_DESKTOP: 'download-desktop',
  HOT_APPLY: 'hot-apply',
  UNAVAILABLE: 'unavailable',
});
export function resolveAutoUpdatePrimaryAction(
  _0x37bb14 = {},
  { desktopUpdaterAvailable: desktopUpdaterAvailable = ![] } = {},
) {
  if (_0x37bb14['previewOnly'] || !_0x37bb14['hasUpdate']) return AUTO_UPDATE_PRIMARY_ACTIONS['CLOSE'];
  if (_0x37bb14['installDownloadedUpdate']) return AUTO_UPDATE_PRIMARY_ACTIONS['INSTALL_DESKTOP'];
  if (_0x37bb14['retryDesktopDownload']) return AUTO_UPDATE_PRIMARY_ACTIONS['RETRY_DESKTOP'];
  if (_0x37bb14['startDesktopDownload'] || desktopUpdaterAvailable)
    return AUTO_UPDATE_PRIMARY_ACTIONS['DOWNLOAD_DESKTOP'];
  if (_0x37bb14['canHotApply']) return AUTO_UPDATE_PRIMARY_ACTIONS['HOT_APPLY'];
  return AUTO_UPDATE_PRIMARY_ACTIONS['UNAVAILABLE'];
}
export async function ensureDesktopUpdateAvailable(_0x252941) {
  const _0x4b2ae7 = await _0x252941['getUpdateState']();
  if (
    _0x4b2ae7?.['state'] === 'available' ||
    _0x4b2ae7?.['state'] === 'downloaded' ||
    (_0x4b2ae7?.['state'] === 'error' && _0x4b2ae7?.['latestInfo'])
  )
    return _0x4b2ae7;
  const _0x29172a = await _0x252941['checkForUpdates']();
  if (_0x29172a?.['skipped'] || _0x29172a?.['ok'] === ![]) throw new Error('desktop updater unavailable');
  const _0x4d3092 = await _0x252941['getUpdateState']();
  if (
    _0x4d3092?.['state'] !== 'available' &&
    _0x4d3092?.['state'] !== 'downloaded' &&
    !(_0x4d3092?.['state'] === 'error' && _0x4d3092?.['latestInfo'])
  )
    throw new Error('desktop\x20update\x20not\x20available');
  return _0x4d3092;
}
