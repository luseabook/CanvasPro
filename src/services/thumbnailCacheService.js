import { getThumbnailRecord, saveThumbnailRecord } from '../modules/storage.js';
import { hasStableThumbnailFallback, isInlineImageDataUrl } from '../utils/thumbnailPersistence.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
function normalizePathLike(value) {
  const enabled = String(value || '').trim();
  if (!enabled) return '';
  const url = localPathToUrl(enabled);
  if (url) return url;
  if (enabled.startsWith('/')) return enabled.replace(/^\/+/, '/');
  if (/^[a-z]+:\/\//i.test(enabled))
    try {
      const uRL = new URL(enabled, window.location.href);
      if (uRL.origin === window.location.origin) return '' + uRL.pathname + uRL.search;
      return uRL.href;
    } catch {
      return enabled;
    }
  return '';
}
function pickResourceRef(enabled2) {
  if (!enabled2) return '';
  if (typeof enabled2 === 'string') return normalizePathLike(enabled2);
  return (
    normalizePathLike(enabled2.localPath) ||
    normalizePathLike(enabled2.src) ||
    normalizePathLike(enabled2.imageUrl) ||
    normalizePathLike(enabled2.sourceUrl)
  );
}
export function buildThumbnailCacheKey(item) {
  const resourceRef = pickResourceRef(item);
  if (!resourceRef) return '';
  return 'thumb:' + resourceRef;
}
export async function getThumbnail(key) {
  const thumbnailCacheKey = buildThumbnailCacheKey(key);
  if (!thumbnailCacheKey) return '';
  const thumbnailRecord = await getThumbnailRecord(thumbnailCacheKey),
    index = String(thumbnailRecord?.dataUrl || '').trim();
  return isInlineImageDataUrl(index) ? index : '';
}
export async function setThumbnail(result, data) {
  const thumbnailCacheKey2 = buildThumbnailCacheKey(result),
    dataUrl = String(data || '').trim();
  if (!thumbnailCacheKey2 || !isInlineImageDataUrl(dataUrl)) return false;
  return (
    await saveThumbnailRecord(thumbnailCacheKey2, { dataUrl: dataUrl, updatedAt: Date.now(), version: 1 }),
    true
  );
}
export async function migrateLegacyThumbnail(enabled3) {
  if (!enabled3 || !isInlineImageDataUrl(enabled3.thumbUrl)) return false;
  if (!hasStableThumbnailFallback(enabled3)) return false;
  const thumbnail = await getThumbnail(enabled3);
  if (thumbnail) return true;
  return await setThumbnail(enabled3, enabled3.thumbUrl);
}
async function migrateInlineThumbField(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return false;
  try {
    if (!(await migrateLegacyThumbnail(enabled4))) return false;
    return (delete enabled4.thumbUrl, true);
  } catch (options) {
    return (console.warn('[thumbnailCacheService] 旧缩略图迁移失败，已保留原始 thumbUrl', options), false);
  }
}
async function migrateNodeLikeInPlace(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object') return false;
  let target = false;
  if (await migrateInlineThumbField(enabled5)) target = true;
  if (Array.isArray(enabled5.images))
    for (const source of enabled5.images) {
      if (await migrateInlineThumbField(source)) target = true;
    }
  if (Array.isArray(enabled5.videos))
    for (const next of enabled5.videos) {
      if (await migrateInlineThumbField(next)) target = true;
    }
  if (Array.isArray(enabled5.cells))
    for (const current of enabled5.cells) {
      if (await migrateInlineThumbField(current)) target = true;
    }
  return target;
}
export async function migrateLegacyThumbnailsInMultiData(multiData) {
  if (!multiData || typeof multiData !== 'object') return { changed: false, multiData: multiData };
  const multiData2 =
    typeof structuredClone === 'function'
      ? structuredClone(multiData)
      : JSON.parse(JSON.stringify(multiData));
  let changed = false;
  const entry = Array.isArray(multiData2.canvases) ? multiData2.canvases : [];
  for (const record of entry) {
    const payload = Array.isArray(record?.nodes)
      ? record.nodes
      : record?.nodes && typeof record.nodes === 'object'
        ? Object.values(record.nodes)
        : [];
    for (const handle of payload) {
      if (await migrateNodeLikeInPlace(handle)) changed = true;
    }
  }
  return { changed: changed, multiData: multiData2 };
}
