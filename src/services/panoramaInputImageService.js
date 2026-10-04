import { fetchRemoteBlob } from '../../api/projectsV2Api.js';
import {
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  inferImageMimeTypeFromUrl,
  isBlobLike,
  resolveImageMimeType,
} from './imagePngConversionService.js';
import { saveOutputBlob } from './projectService.js';
import { localPathToUrl, normalizeLocalPath as normalizeLocalPath_2 } from '../utils/localMediaPath.js';
import { t } from '../i18n/index.js';
function panoramaSceneText(value, item = {}) {
  return t('panoramaSceneNode.' + value, item);
}
function normalizeMediaUrl(key) {
  const enabled = String(key || '').trim();
  if (!enabled) return '';
  if (/^(https?:|blob:|data:)/i.test(enabled)) return enabled;
  return localPathToUrl(enabled);
}
function normalizeLocalPath(index) {
  return normalizeLocalPath_2(index);
}
function inferFileNameFromPath(result) {
  const enabled2 = String(result || '').trim();
  if (!enabled2) return '';
  const data = enabled2.split('#')[0].split('?')[0],
    list = data.split(/[\\/]/).filter(Boolean);
  return list[list.length - 1] || '';
}
function stripKnownImageExtension(options) {
  return String(options || '').replace(/\.(png|jpg|jpeg|webp|gif|bmp|avif|svg)$/i, '');
}
function ensurePngFileName(target) {
  const stripKnownImageExtension2 = stripKnownImageExtension(String(target || '').trim()) || 'panorama_input';
  return stripKnownImageExtension2 + '.png';
}
function isPngMimeType(source) {
  return (
    String(source || '')
      .trim()
      .toLowerCase() === 'image/png'
  );
}
function isPngLikePath(next) {
  const current = String(next || '')
    .trim()
    .split('#')[0]
    .split('?')[0]
    .toLowerCase();
  return current.endsWith('.png');
}
function resolvePersistentPngSource(entry, record) {
  const localPath = normalizeLocalPath(entry);
  if (localPath && isPngLikePath(localPath))
    return { localPath: localPath, imageUrl: normalizeMediaUrl(localPath) };
  const mediaUrl = normalizeMediaUrl(record),
    localPath2 = normalizeLocalPath(mediaUrl);
  if (localPath2 && isPngLikePath(localPath2))
    return { localPath: localPath2, imageUrl: normalizeMediaUrl(localPath2) };
  return null;
}
function resolvePreferredSourceUrl(payload, handle) {
  const mediaUrl2 = normalizeMediaUrl(payload);
  if (mediaUrl2) return mediaUrl2;
  return normalizeMediaUrl(handle);
}
function normalizeSavedPngResult(response, state, sourceSignature) {
  const localPath3 = normalizeLocalPath(
      response?.originalLocalPath || response?.localPath || response?.path || '',
    ),
    imageUrl = normalizeMediaUrl(response?.originalUrl || response?.url || localPath3);
  if (!localPath3 || !imageUrl) throw new Error(panoramaSceneText('errors.pngSaveInvalidPath'));
  const fileName =
    String(response?.filename || '').trim() || inferFileNameFromPath(localPath3) || ensurePngFileName(state);
  return {
    localPath: localPath3,
    imageUrl: imageUrl,
    fileName: fileName,
    sourceSignature: sourceSignature || null,
  };
}
export async function ensurePersistedPanoramaInputPng({
  localPath: localPath4,
  imageUrl: imageUrl2,
  fileName: fileName2,
  sourceSignature: sourceSignature2,
} = {}) {
  const localPath5 = normalizeLocalPath(localPath4),
    mediaUrl3 = normalizeMediaUrl(imageUrl2),
    config =
      String(fileName2 || '').trim() ||
      inferFileNameFromPath(localPath5) ||
      inferFileNameFromPath(mediaUrl3) ||
      'panorama_input.png',
    localPath6 = resolvePersistentPngSource(localPath5, mediaUrl3);
  if (localPath6)
    return {
      localPath: localPath6.localPath,
      imageUrl: localPath6.imageUrl,
      fileName: inferFileNameFromPath(localPath6.localPath) || ensurePngFileName(config),
      sourceSignature: sourceSignature2 || null,
    };
  const preferredSourceUrl = resolvePreferredSourceUrl(localPath5, mediaUrl3);
  if (!preferredSourceUrl) throw new Error(panoramaSceneText('errors.panoramaImageInputMissing'));
  let fetchRemoteBlob2 = null;
  try {
    fetchRemoteBlob2 = await fetchRemoteBlob(preferredSourceUrl, { timeout: 0x7530 });
  } catch (error) {
    throw new Error(
      panoramaSceneText('errors.readPanoramaInputFailed', {
        error: String(error?.message || error || panoramaSceneText('errors.unknown')),
      }),
    );
  }
  if (!isBlobLike(fetchRemoteBlob2)) throw new Error(panoramaSceneText('errors.panoramaInputEmpty'));
  const imageMimeType =
    resolveImageMimeType(fetchRemoteBlob2, preferredSourceUrl) ||
    inferImageMimeTypeFromUrl(preferredSourceUrl);
  let pngBlob = fetchRemoteBlob2;
  !isPngMimeType(imageMimeType) && (pngBlob = await convertImageBlobToPngBlob(fetchRemoteBlob2));
  !isBlobLike(pngBlob) && (pngBlob = await convertImageUrlToPngBlob(preferredSourceUrl));
  if (!isBlobLike(pngBlob)) throw new Error(panoramaSceneText('errors.panoramaPngConvertFailed'));
  const saveOutputBlob2 = await saveOutputBlob(pngBlob, {
    ext: 'png',
    subDir: 'panorama_input_png',
    kind: 'panorama-input-png',
  });
  return normalizeSavedPngResult(saveOutputBlob2, config, sourceSignature2);
}
