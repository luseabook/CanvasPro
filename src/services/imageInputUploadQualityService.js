export const IMAGE_INPUT_UPLOAD_QUALITY_STORAGE_KEY = 'v2-image-input-upload-quality';
export const IMAGE_INPUT_UPLOAD_QUALITY_MODES = Object.freeze({
  STANDARD: 'standard',
  HIGH_FIDELITY: 'high-fidelity',
  ORIGINAL_FIRST: 'original-first',
});
export const DEFAULT_IMAGE_INPUT_UPLOAD_QUALITY_MODE = IMAGE_INPUT_UPLOAD_QUALITY_MODES.HIGH_FIDELITY;
const VALID_IMAGE_INPUT_UPLOAD_QUALITY_MODES = new Set(Object.values(IMAGE_INPUT_UPLOAD_QUALITY_MODES));
export function normalizeImageInputUploadQualityMode(_0x27d1fa) {
  const _0x4be7a1 = String(_0x27d1fa || '').trim();
  return VALID_IMAGE_INPUT_UPLOAD_QUALITY_MODES.has(_0x4be7a1)
    ? _0x4be7a1
    : DEFAULT_IMAGE_INPUT_UPLOAD_QUALITY_MODE;
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
export function setImageInputUploadQualityMode(_0x579962) {
  const _0x532794 = normalizeImageInputUploadQualityMode(_0x579962);
  try {
    globalThis.localStorage?.setItem(IMAGE_INPUT_UPLOAD_QUALITY_STORAGE_KEY, _0x532794);
  } catch {}
  return _0x532794;
}
export function getImageInputUploadQualityOptions(_0x457a49) {
  const _0x3208a4 = normalizeImageInputUploadQualityMode(_0x457a49);
  if (_0x3208a4 === IMAGE_INPUT_UPLOAD_QUALITY_MODES.HIGH_FIDELITY)
    return {
      imageInputUploadQualityMode: _0x3208a4,
      compress: true,
      maxDim: 0x1000,
      quality: 0.95,
      fallbackCompressOnError: false,
    };
  if (_0x3208a4 === IMAGE_INPUT_UPLOAD_QUALITY_MODES.ORIGINAL_FIRST)
    return {
      imageInputUploadQualityMode: _0x3208a4,
      compress: false,
      maxDim: 0,
      quality: 1,
      fallbackCompressOnError: true,
      fallbackMaxDim: 0x800,
      fallbackQuality: 0.9,
    };
  return {
    imageInputUploadQualityMode: IMAGE_INPUT_UPLOAD_QUALITY_MODES.STANDARD,
    compress: true,
    maxDim: 0x800,
    quality: 0.9,
    fallbackCompressOnError: false,
  };
}
export function resolveImageInputUploadQualityOptions(_0x21bd41 = {}) {
  const _0x2e0718 = normalizeImageInputUploadQualityMode(
    _0x21bd41.imageInputUploadQualityMode || getImageInputUploadQualityMode(),
  );
  return { ..._0x21bd41, ...getImageInputUploadQualityOptions(_0x2e0718), applyInputQualityProfile: true };
}
