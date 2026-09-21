import { getThumbnailRecord, saveThumbnailRecord } from '../modules/storage.js';
import { hasStableThumbnailFallback, isInlineImageDataUrl } from '../utils/thumbnailPersistence.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
function normalizePathLike(_0x13c6fb) {
  const _0x234f2e = String(_0x13c6fb || '').trim();
  if (!_0x234f2e) return '';
  const _0x18a70c = localPathToUrl(_0x234f2e);
  if (_0x18a70c) return _0x18a70c;
  if (_0x234f2e.startsWith('/')) return _0x234f2e.replace(/^\/+/, '/');
  if (/^[a-z]+:\/\//i.test(_0x234f2e))
    try {
      const _0x20cd2c = new URL(_0x234f2e, window.location.href);
      if (_0x20cd2c.origin === window.location.origin) return '' + _0x20cd2c.pathname + _0x20cd2c.search;
      return _0x20cd2c.href;
    } catch {
      return _0x234f2e;
    }
  return '';
}
function pickResourceRef(_0x8d8335) {
  if (!_0x8d8335) return '';
  if (typeof _0x8d8335 === 'string') return normalizePathLike(_0x8d8335);
  return (
    normalizePathLike(_0x8d8335.localPath) ||
    normalizePathLike(_0x8d8335.src) ||
    normalizePathLike(_0x8d8335.imageUrl) ||
    normalizePathLike(_0x8d8335.sourceUrl)
  );
}
export function buildThumbnailCacheKey(_0x312414) {
  const _0x373135 = pickResourceRef(_0x312414);
  if (!_0x373135) return '';
  return 'thumb:' + _0x373135;
}
export async function getThumbnail(_0x1eed29) {
  const _0x15faaf = buildThumbnailCacheKey(_0x1eed29);
  if (!_0x15faaf) return '';
  const _0x23ab37 = await getThumbnailRecord(_0x15faaf),
    _0x143e48 = String(_0x23ab37?.dataUrl || '').trim();
  return isInlineImageDataUrl(_0x143e48) ? _0x143e48 : '';
}
export async function setThumbnail(_0x259ee5, _0x468d7c) {
  const _0x13a2f6 = buildThumbnailCacheKey(_0x259ee5),
    _0x272169 = String(_0x468d7c || '').trim();
  if (!_0x13a2f6 || !isInlineImageDataUrl(_0x272169)) return false;
  return (
    await saveThumbnailRecord(_0x13a2f6, { dataUrl: _0x272169, updatedAt: Date.now(), version: 1 }),
    true
  );
}
export async function migrateLegacyThumbnail(_0xee7b73) {
  if (!_0xee7b73 || !isInlineImageDataUrl(_0xee7b73.thumbUrl)) return false;
  if (!hasStableThumbnailFallback(_0xee7b73)) return false;
  const _0x4e5107 = await getThumbnail(_0xee7b73);
  if (_0x4e5107) return true;
  return await setThumbnail(_0xee7b73, _0xee7b73.thumbUrl);
}
async function migrateInlineThumbField(_0x353288) {
  if (!_0x353288 || typeof _0x353288 !== 'object') return false;
  try {
    if (!(await migrateLegacyThumbnail(_0x353288))) return false;
    return (delete _0x353288.thumbUrl, true);
  } catch (_0x1df22d) {
    return (console.warn('[thumbnailCacheService] 旧缩略图迁移失败，已保留原始 thumbUrl', _0x1df22d), false);
  }
}
async function migrateNodeLikeInPlace(_0x1e33d5) {
  if (!_0x1e33d5 || typeof _0x1e33d5 !== 'object') return false;
  let _0x652017 = false;
  if (await migrateInlineThumbField(_0x1e33d5)) _0x652017 = true;
  if (Array.isArray(_0x1e33d5.images))
    for (const _0x17d855 of _0x1e33d5.images) {
      if (await migrateInlineThumbField(_0x17d855)) _0x652017 = true;
    }
  if (Array.isArray(_0x1e33d5.videos))
    for (const _0xc7076 of _0x1e33d5.videos) {
      if (await migrateInlineThumbField(_0xc7076)) _0x652017 = true;
    }
  if (Array.isArray(_0x1e33d5.cells))
    for (const _0x45ee43 of _0x1e33d5.cells) {
      if (await migrateInlineThumbField(_0x45ee43)) _0x652017 = true;
    }
  return _0x652017;
}
export async function migrateLegacyThumbnailsInMultiData(_0x2b1fe4) {
  if (!_0x2b1fe4 || typeof _0x2b1fe4 !== 'object') return { changed: false, multiData: _0x2b1fe4 };
  const _0xe43283 =
    typeof structuredClone === 'function'
      ? structuredClone(_0x2b1fe4)
      : JSON.parse(JSON.stringify(_0x2b1fe4));
  let _0x39a7ca = false;
  const _0x1695f1 = Array.isArray(_0xe43283.canvases) ? _0xe43283.canvases : [];
  for (const _0x16c361 of _0x1695f1) {
    const _0x5aacf2 = Array.isArray(_0x16c361?.nodes)
      ? _0x16c361.nodes
      : _0x16c361?.nodes && typeof _0x16c361.nodes === 'object'
        ? Object.values(_0x16c361.nodes)
        : [];
    for (const _0x39a932 of _0x5aacf2) {
      if (await migrateNodeLikeInPlace(_0x39a932)) _0x39a7ca = true;
    }
  }
  return { changed: _0x39a7ca, multiData: _0xe43283 };
}
