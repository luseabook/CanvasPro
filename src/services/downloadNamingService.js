export const DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY = 'v2-download-use-original-filename';
export function getDownloadUseOriginalFilename() {
  try {
    return globalThis['localStorage']?.['getItem'](DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
export function setDownloadUseOriginalFilename(value) {
  try {
    globalThis['localStorage']?.['setItem'](
      DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY,
      value === true ? '1' : '0',
    );
  } catch {}
  return getDownloadUseOriginalFilename();
}
