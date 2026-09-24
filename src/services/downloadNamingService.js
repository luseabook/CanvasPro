export const DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY = 'v2-download-use-original-filename';
export function getDownloadUseOriginalFilename() {
  try {
    return globalThis['localStorage']?.['getItem'](DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY) === '1';
  } catch {
    return ![];
  }
}
export function setDownloadUseOriginalFilename(_0x1e3dc6) {
  try {
    globalThis['localStorage']?.['setItem'](
      DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY,
      _0x1e3dc6 === !![] ? '1' : '0',
    );
  } catch {}
  return getDownloadUseOriginalFilename();
}
