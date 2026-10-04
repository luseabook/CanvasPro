import { fetchRemoteBlob } from '../../api/projectsV2Api.js';
import {
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  isBlobLike,
  normalizeImageMimeType,
  resolveImageMimeType,
} from '../services/imagePngConversionService.js';
import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
const IMAGE_NODE_TYPES = new Set(['source-image', 'ai-image', 'storyboard']);
function pickMainItem(list, value) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const item = Number(value),
    key = Number.isFinite(item) ? Math.max(0, Math.trunc(item)) : 0;
  return list[key] || list[0] || null;
}
function normalizeMediaUrl(index) {
  const enabled = String(index || '').trim();
  if (!enabled) return '';
  if (/^(https?:|blob:|data:)/i.test(enabled)) return enabled;
  const url = localPathToUrl(enabled);
  if (url) return url;
  const result = enabled.replace(/\\/g, '/');
  if (/^(?:file:|javascript:)/i.test(result) || /^[a-zA-Z]:\//.test(result) || result.startsWith('//'))
    return '';
  const data = result.split(/[?#]/, 1)[0].replace(/^\/+/, ''),
    list2 = data.split('/').filter(Boolean);
  if (!list2.length || list2.some((item2) => item2 === '.' || item2 === '..')) return '';
  return '/' + list2.join('/');
}
function normalizeLocalMediaPath(options) {
  return normalizeLocalPath(options);
}
function pickMediaUrl(...args) {
  for (const target of args) {
    const mediaUrl = normalizeMediaUrl(target);
    if (mediaUrl) return mediaUrl;
  }
  return '';
}
function pickLocalMediaPath(...args2) {
  for (const source of args2) {
    const localMediaPath = normalizeLocalMediaPath(source);
    if (localMediaPath) return localMediaPath;
  }
  return '';
}
function resolveNodeMedia(next) {
  const current = String(next?.type || '').trim();
  if (!IMAGE_NODE_TYPES.has(current)) return { kind: '', url: '', localPath: '' };
  if (current === 'storyboard') {
    const response = Array.isArray(next?.cells) ? next.cells[0] : null;
    return {
      kind: 'image',
      url: pickMediaUrl(response?.url, next?.sourceUrl, next?.imageUrl, next?.src, next?.localPath),
      localPath: pickLocalMediaPath(
        response?.localPath,
        response?.url,
        next?.localPath,
        next?.sourceUrl,
        next?.imageUrl,
        next?.src,
      ),
    };
  }
  if (current === 'source-image')
    return {
      kind: 'image',
      url: pickMediaUrl(next?.localPath, next?.sourceUrl, next?.imageUrl, next?.src, next?.thumbUrl),
      localPath: pickLocalMediaPath(
        next?.displayLocalPath,
        next?.localPath,
        next?.originalLocalPath,
        next?.sourceUrl,
        next?.imageUrl,
        next?.src,
        next?.thumbUrl,
      ),
    };
  const response2 = pickMainItem(next?.images, next?.mainImageIndex);
  return {
    kind: 'image',
    url: pickMediaUrl(
      response2?.localPath,
      response2?.sourceUrl,
      response2?.imageUrl,
      response2?.url,
      response2?.thumbUrl,
      next?.localPath,
      next?.sourceUrl,
      next?.imageUrl,
      next?.src,
      next?.thumbUrl,
    ),
    localPath: pickLocalMediaPath(
      response2?.displayLocalPath,
      response2?.localPath,
      response2?.originalLocalPath,
      response2?.sourceUrl,
      response2?.imageUrl,
      response2?.url,
      response2?.thumbUrl,
      next?.displayLocalPath,
      next?.localPath,
      next?.originalLocalPath,
      next?.sourceUrl,
      next?.imageUrl,
      next?.src,
      next?.thumbUrl,
    ),
  };
}
function getElectronClipboardApi() {
  const entry = globalThis?.window?.electronAPI?.clipboard;
  return entry && typeof entry.writeImage === 'function' ? entry : null;
}
async function copyNodeMediaToElectronClipboard({ url: url2, localPath: localPath } = {}) {
  const electronClipboardApi = getElectronClipboardApi();
  if (!electronClipboardApi) return null;
  const localPath2 = localPath || normalizeLocalMediaPath(url2);
  if (!localPath2) return { ok: false, reason: 'no-local-path' };
  try {
    const mimeType = await electronClipboardApi.writeImage({
      localPath: localPath2,
      text: String(url2 || localPath2 || ''),
    });
    if (mimeType?.ok)
      return {
        ok: true,
        kind: 'image',
        mimeType: mimeType.mimeType || 'image/png',
        sourceUrl: url2,
        localPath: localPath2,
        copyPath: 'electron',
      };
    return { ok: false, reason: mimeType?.reason || 'copy-failed', error: mimeType?.error };
  } catch (error) {
    return { ok: false, reason: 'copy-failed', error: error };
  }
}
async function writeImageBlobToClipboard({
  clipboard: clipboard,
  write: write,
  ClipboardItemCtor: ClipboardItemCtor,
  blob: blob,
  mimeType: mimeType2,
} = {}) {
  const imageMimeType = normalizeImageMimeType(mimeType2) || 'image/png',
    record = new ClipboardItemCtor({ [imageMimeType]: blob });
  return (await write.call(clipboard, [record]), imageMimeType);
}
export async function copyNodeMediaToSystemClipboard(payload) {
  const { kind: kind, url: url3, localPath: localPath3 } = resolveNodeMedia(payload);
  if (kind !== 'image' || !url3) return { ok: false, reason: 'no-media' };
  const response3 = await copyNodeMediaToElectronClipboard({ url: url3, localPath: localPath3 });
  if (response3?.ok) return response3;
  const clipboard2 = globalThis?.navigator?.clipboard,
    write2 = clipboard2?.write,
    ClipboardItemCtor2 = globalThis?.ClipboardItem;
  if (typeof write2 !== 'function' || typeof ClipboardItemCtor2 !== 'function')
    return { ok: false, reason: 'not-supported' };
  let blob2 = null,
    error2 = null;
  try {
    ((blob2 = await fetchRemoteBlob(url3, { timeout: 0x3a98 })), !isBlobLike(blob2) && (blob2 = null));
  } catch (handle) {
    error2 = handle;
  }
  if (blob2) {
    const mimeType3 = resolveImageMimeType(blob2, url3) || 'image/png';
    try {
      const mimeType4 = await writeImageBlobToClipboard({
        clipboard: clipboard2,
        write: write2,
        ClipboardItemCtor: ClipboardItemCtor2,
        blob: blob2,
        mimeType: mimeType3,
      });
      return { ok: true, kind: 'image', mimeType: mimeType4, sourceUrl: url3, copyPath: 'direct' };
    } catch (state) {
      error2 = state;
    }
  }
  try {
    let blob3 = null;
    blob2 && (blob3 = await convertImageBlobToPngBlob(blob2));
    !isBlobLike(blob3) && (blob3 = await convertImageUrlToPngBlob(url3));
    if (!isBlobLike(blob3)) return { ok: false, reason: 'copy-failed', error: error2 };
    const mimeType5 = await writeImageBlobToClipboard({
      clipboard: clipboard2,
      write: write2,
      ClipboardItemCtor: ClipboardItemCtor2,
      blob: blob3,
      mimeType: 'image/png',
    });
    return { ok: true, kind: 'image', mimeType: mimeType5, sourceUrl: url3, copyPath: 'png-fallback' };
  } catch (error3) {
    return { ok: false, reason: 'copy-failed', error: error3 || error2 };
  }
}
