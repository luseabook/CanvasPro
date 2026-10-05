export const IMAGE_INPUT_UPLOAD_QUALITY_STORAGE_KEY = 'v2-image-input-upload-quality';
export const IMAGE_INPUT_UPLOAD_QUALITY_MODES = Object.freeze({
  STANDARD: 'standard',
  HIGH_FIDELITY: 'high-fidelity',
  ORIGINAL_FIRST: 'original-first',
});
export const DEFAULT_IMAGE_INPUT_UPLOAD_QUALITY_MODE = IMAGE_INPUT_UPLOAD_QUALITY_MODES.HIGH_FIDELITY;
const VALID_IMAGE_INPUT_UPLOAD_QUALITY_MODES = new Set(Object.values(IMAGE_INPUT_UPLOAD_QUALITY_MODES));
export function normalizeImageInputUploadQualityMode(value) {
  const item = String(value || '').trim();
  return VALID_IMAGE_INPUT_UPLOAD_QUALITY_MODES.has(item) ? item : DEFAULT_IMAGE_INPUT_UPLOAD_QUALITY_MODE;
}
export function getImageInputUploadQualityMode() {
  try {
    return normalizeImageInputUploadQualityMode(
      globalThis.localStorage?.getItem(IMAGE_INPUT_UPLOAD_QUALITY_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_IMAGE_INPUT_UPLOAD_QUALITY_MODE;
  }
}
export function setImageInputUploadQualityMode(key) {
  const imageInputUploadQualityMode = normalizeImageInputUploadQualityMode(key);
  try {
    globalThis.localStorage?.setItem(IMAGE_INPUT_UPLOAD_QUALITY_STORAGE_KEY, imageInputUploadQualityMode);
  } catch {}
  return imageInputUploadQualityMode;
}
export function getImageInputUploadQualityOptions(index) {
  const imageInputUploadQualityMode2 = normalizeImageInputUploadQualityMode(index);
  if (imageInputUploadQualityMode2 === IMAGE_INPUT_UPLOAD_QUALITY_MODES.HIGH_FIDELITY)
    return {
      imageInputUploadQualityMode: imageInputUploadQualityMode2,
      compress: true,
      maxDim: 4096,
      quality: 0.95,
      fallbackCompressOnError: false,
    };
  if (imageInputUploadQualityMode2 === IMAGE_INPUT_UPLOAD_QUALITY_MODES.ORIGINAL_FIRST)
    return {
      imageInputUploadQualityMode: imageInputUploadQualityMode2,
      compress: false,
      maxDim: 0,
      quality: 1,
      fallbackCompressOnError: true,
      fallbackMaxDim: 2048,
      fallbackQuality: 0.9,
    };
  return {
    imageInputUploadQualityMode: IMAGE_INPUT_UPLOAD_QUALITY_MODES.STANDARD,
    compress: true,
    maxDim: 2048,
    quality: 0.9,
    fallbackCompressOnError: false,
  };
}
export function resolveImageInputUploadQualityOptions(args = {}) {
  const imageInputUploadQualityMode3 = normalizeImageInputUploadQualityMode(
    args.imageInputUploadQualityMode || getImageInputUploadQualityMode(),
  );
  return {
    ...args,
    ...getImageInputUploadQualityOptions(imageInputUploadQualityMode3),
    applyInputQualityProfile: true,
  };
}
