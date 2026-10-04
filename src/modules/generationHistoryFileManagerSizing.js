import { getAutoMediaSizeByShortSide, getNodeDefaultSize } from '../services/fileService.js';
function pickPositiveNumber(...args) {
  for (const value of args) {
    const count = Number(value || 0);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 0;
}
function getSourceMediaNodeNaturalSize(box, item) {
  if (!box || typeof box !== 'object') return { width: 0, height: 0 };
  if (item === 'source-video')
    return {
      width: pickPositiveNumber(box.videoWidth, box.originalWidth, box.imageWidth, box.width, box.w),
      height: pickPositiveNumber(box.videoHeight, box.originalHeight, box.imageHeight, box.height, box.h),
    };
  if (item === 'source-image')
    return {
      width: pickPositiveNumber(box.originalWidth, box.imageWidth, box.videoWidth, box.width, box.w),
      height: pickPositiveNumber(box.originalHeight, box.imageHeight, box.videoHeight, box.height, box.h),
    };
  return { width: 0, height: 0 };
}
export function normalizeFileManagerSourceNodeForCanvas(args2 = {}) {
  const key = String(args2?.type || '').trim();
  if (key !== 'source-image' && key !== 'source-video') return { ...args2 };
  const box2 = getSourceMediaNodeNaturalSize(args2, key),
    width =
      box2.width > 0 && box2.height > 0
        ? getAutoMediaSizeByShortSide(box2.width, box2.height)
        : getNodeDefaultSize(key);
  return { ...args2, width: width.width, height: width.height, needsAutoResize: false };
}
