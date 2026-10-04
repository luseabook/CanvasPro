import { t } from '../../i18n/index.js';
function storyboardImageRuntimeText(value, item = {}) {
  return t('storyboard.imageRuntime.' + value, item);
}
export function loadStoryboardSourceImage(key) {
  if (typeof Image !== 'function') return Promise.reject(new Error('Image API unavailable'));
  return new Promise((handler, handler2) => {
    const image = new Image();
    ((image.crossOrigin = 'anonymous'),
      (image.onload = () => handler(image)),
      (image.onerror = () => handler2(new Error(storyboardImageRuntimeText('sourceImageLoadFailed')))),
      (image.src = key));
  });
}
export function isLoadedImageElement(box) {
  if (!box) return false;
  if ('complete' in box && box.complete !== true) return false;
  const enabled = 'naturalWidth' in box || 'naturalHeight' in box || 'width' in box || 'height' in box;
  if (!enabled) return true;
  const count = Math.trunc(Number(box.naturalWidth || box.width) || 0),
    count2 = Math.trunc(Number(box.naturalHeight || box.height) || 0);
  return count > 0 && count2 > 0;
}
export function getImageElementSource(index) {
  return String(index?.getAttribute?.('src') || index?.currentSrc || index?.src || '').trim();
}
export function isExpectedImageSource(result, data = '') {
  const enabled2 = String(data || '').trim();
  if (!enabled2) return true;
  const imageElementSource = getImageElementSource(result);
  return !imageElementSource || imageElementSource === enabled2;
}
export function getLoadedStoryboardSourceImageForCell({
  cellEls: cellEls,
  backdropEl: backdropEl,
  index: index2,
  sourceUrl: sourceUrl = '',
} = {}) {
  const el = cellEls?.[index2] || null,
    options = [
      ...(el?.querySelectorAll?.('.storyboard-cell-source-cache') || []),
      ...(el?.querySelectorAll?.('.storyboard-cell-img--source-crop') || []),
      backdropEl,
    ].filter(Boolean);
  for (const target of options) {
    if (isLoadedImageElement(target) && isExpectedImageSource(target, sourceUrl)) return target;
  }
  return null;
}
export async function resolveStoryboardCommitSourceImage({
  index: index3,
  sourceUrl: sourceUrl2,
  imageCache: imageCache,
  cellEls: cellEls2,
  backdropEl: backdropEl2,
  loadImage: loadImage = loadStoryboardSourceImage,
} = {}) {
  const sourceUrl3 = String(sourceUrl2 || '').trim();
  if (!sourceUrl3) return null;
  const promise = imageCache.get(sourceUrl3);
  if (promise) {
    if (typeof promise.then === 'function') {
      const source = await promise;
      if (source) imageCache.set(sourceUrl3, source);
      return source || null;
    }
    return promise;
  }
  const loadedStoryboardSourceImageForCell = getLoadedStoryboardSourceImageForCell({
    cellEls: cellEls2,
    backdropEl: backdropEl2,
    index: index3,
    sourceUrl: sourceUrl3,
  });
  if (loadedStoryboardSourceImageForCell)
    return (
      imageCache.set(sourceUrl3, loadedStoryboardSourceImageForCell),
      loadedStoryboardSourceImageForCell
    );
  const image2 = loadImage(sourceUrl3).catch(() => null);
  imageCache.set(sourceUrl3, image2);
  const next = await image2;
  if (next) return (imageCache.set(sourceUrl3, next), next);
  return (imageCache.delete(sourceUrl3), null);
}
