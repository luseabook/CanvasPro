import { isAdaptiveRatioLabel, pickClosestRatioForProviderModel } from '../../api/imageRatioPolicy.js';
function toPositiveDimension(value) {
  const count = Number(value);
  return Number['isFinite'](count) && count > 0x0 ? count : 0x0;
}
function pickPositiveDimension(...args) {
  for (const item of args) {
    const toPositiveDimension2 = toPositiveDimension(item);
    if (toPositiveDimension2 > 0x0) return toPositiveDimension2;
  }
  return 0x0;
}
export function resolveImageFreeAngleSourceSize(options = {}, key = null) {
  const width = pickPositiveDimension(
      options?.['originalWidth'],
      options?.['imageWidth'],
      options?.['imgWidth'],
      options?.['naturalWidth'],
      key?.['naturalWidth'],
    ),
    height = pickPositiveDimension(
      options?.['originalHeight'],
      options?.['imageHeight'],
      options?.['imgHeight'],
      options?.['naturalHeight'],
      key?.['naturalHeight'],
    );
  return width > 0x0 && height > 0x0 ? { width: width, height: height } : null;
}
export function resolveImageFreeAngleAspectRatio({
  aspectRatio: aspectRatio = '',
  provider: provider = '',
  model: model = '',
  imageSize: imageSize = '',
  sourceSize: sourceSize = null,
} = {}) {
  const index = String(aspectRatio || '')['trim']();
  if (!isAdaptiveRatioLabel(index)) return index;
  return pickClosestRatioForProviderModel({
    provider: provider,
    model: model,
    imageSize: imageSize,
    width: sourceSize?.['width'] || 0x0,
    height: sourceSize?.['height'] || 0x0,
  });
}
