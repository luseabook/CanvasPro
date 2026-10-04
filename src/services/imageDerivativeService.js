import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
function firstNonEmptyString(...args) {
  for (const value of args) {
    const localPath = normalizeLocalPath(value);
    if (localPath) return localPath;
  }
  return '';
}
function toPositiveInt(item) {
  const count = Number(item);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.max(1, Math.round(count));
}
export function toLocalPathUrl(key) {
  return localPathToUrl(key);
}
export function normalizeImageDerivativeFields(options = {}) {
  const localPath2 = firstNonEmptyString(options?.localPath),
    originalLocalPath = firstNonEmptyString(options?.originalLocalPath, localPath2),
    displayLocalPath = firstNonEmptyString(options?.displayLocalPath),
    thumbLocalPath = firstNonEmptyString(options?.thumbLocalPath),
    originalWidth = toPositiveInt(options?.originalWidth),
    originalHeight = toPositiveInt(options?.originalHeight);
  return {
    localPath: localPath2,
    originalLocalPath: originalLocalPath,
    displayLocalPath: displayLocalPath,
    thumbLocalPath: thumbLocalPath,
    originalWidth: originalWidth,
    originalHeight: originalHeight,
  };
}
export function hasImageDerivativeFields(options2 = {}) {
  return Boolean(
    firstNonEmptyString(options2?.originalLocalPath, options2?.displayLocalPath, options2?.thumbLocalPath) ||
    toPositiveInt(options2?.originalWidth) ||
    toPositiveInt(options2?.originalHeight),
  );
}
export function needsImageDerivatives(options3 = {}) {
  const imageDerivativeFields = normalizeImageDerivativeFields(options3),
    enabled = imageDerivativeFields.originalLocalPath || imageDerivativeFields.localPath;
  if (!enabled || /\.svg$/i.test(enabled)) return false;
  return [imageDerivativeFields.displayLocalPath, imageDerivativeFields.thumbLocalPath].some(
    (enabled2) => !enabled2 || enabled2 === enabled,
  );
}
export function buildImageNodeStorageFields(options4 = {}) {
  const localPath3 = normalizeImageDerivativeFields(options4),
    index = {
      localPath: localPath3.localPath || localPath3.originalLocalPath || '',
      originalLocalPath: localPath3.originalLocalPath || '',
      displayLocalPath: localPath3.displayLocalPath || '',
      thumbLocalPath: localPath3.thumbLocalPath || '',
    };
  return (
    localPath3.originalWidth > 0 && (index.originalWidth = localPath3.originalWidth),
    localPath3.originalHeight > 0 && (index.originalHeight = localPath3.originalHeight),
    index
  );
}
export function pickCanvasImageLocalPath(options5 = {}) {
  const imageDerivativeFields2 = normalizeImageDerivativeFields(options5);
  return firstNonEmptyString(
    imageDerivativeFields2.displayLocalPath,
    imageDerivativeFields2.originalLocalPath,
    imageDerivativeFields2.localPath,
    imageDerivativeFields2.thumbLocalPath,
  );
}
export function pickCanvasThumbLocalPath(options6 = {}) {
  const imageDerivativeFields3 = normalizeImageDerivativeFields(options6);
  return firstNonEmptyString(
    imageDerivativeFields3.thumbLocalPath,
    imageDerivativeFields3.displayLocalPath,
    imageDerivativeFields3.originalLocalPath,
    imageDerivativeFields3.localPath,
  );
}
export function pickPreviewImageLocalPath(options7 = {}) {
  const imageDerivativeFields4 = normalizeImageDerivativeFields(options7);
  return firstNonEmptyString(imageDerivativeFields4.originalLocalPath, imageDerivativeFields4.localPath);
}
export function pickPreviewFallbackLocalPath(options8 = {}) {
  const imageDerivativeFields5 = normalizeImageDerivativeFields(options8);
  return firstNonEmptyString(imageDerivativeFields5.displayLocalPath, imageDerivativeFields5.thumbLocalPath);
}
