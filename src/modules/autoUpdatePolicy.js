export const AUTO_UPDATE_PRIMARY_ACTIONS = Object['freeze']({
  CLOSE: 'close',
  INSTALL_DESKTOP: 'install-desktop',
  RETRY_DESKTOP: 'retry-desktop',
  DOWNLOAD_DESKTOP: 'download-desktop',
  HOT_APPLY: 'hot-apply',
  UNAVAILABLE: 'unavailable',
});
export function resolveAutoUpdatePrimaryAction(
  enabled = {},
  { desktopUpdaterAvailable: desktopUpdaterAvailable = ![] } = {},
) {
  if (enabled['previewOnly'] || !enabled['hasUpdate']) return AUTO_UPDATE_PRIMARY_ACTIONS['CLOSE'];
  if (enabled['installDownloadedUpdate']) return AUTO_UPDATE_PRIMARY_ACTIONS['INSTALL_DESKTOP'];
  if (enabled['retryDesktopDownload']) return AUTO_UPDATE_PRIMARY_ACTIONS['RETRY_DESKTOP'];
  if (enabled['startDesktopDownload'] || desktopUpdaterAvailable)
    return AUTO_UPDATE_PRIMARY_ACTIONS['DOWNLOAD_DESKTOP'];
  if (enabled['canHotApply']) return AUTO_UPDATE_PRIMARY_ACTIONS['HOT_APPLY'];
  return AUTO_UPDATE_PRIMARY_ACTIONS['UNAVAILABLE'];
}
export async function ensureDesktopUpdateAvailable(value) {
  const item = await value['getUpdateState']();
  if (
    item?.['state'] === 'available' ||
    item?.['state'] === 'downloaded' ||
    (item?.['state'] === 'error' && item?.['latestInfo'])
  )
    return item;
  const response = await value['checkForUpdates']();
  if (response?.['skipped'] || response?.['ok'] === ![]) throw new Error('desktop updater unavailable');
  const key = await value['getUpdateState']();
  if (
    key?.['state'] !== 'available' &&
    key?.['state'] !== 'downloaded' &&
    !(key?.['state'] === 'error' && key?.['latestInfo'])
  )
    throw new Error('desktop update not available');
  return key;
}
