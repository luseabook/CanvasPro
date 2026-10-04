import {
  OUTPUT_RATIO_SWITCH_THRESHOLD,
  calcDisplaySizeByMedia,
  readImageNaturalSize,
  resolveInputRatioBasis,
  resolveOutputMediaSize,
  shouldSwitchToOutputRatio,
} from '../services/mediaRatioService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
export const RATIO_SWITCH_THRESHOLD = OUTPUT_RATIO_SWITCH_THRESHOLD;
export function normalizeLocalPathText(value) {
  return normalizeLocalPath(value);
}
export function resolveGridCropImageRef(item) {
  const localPath = normalizeLocalPathText(
      item?.localPath || (item?.images && item.images[item.mainImageIndex || 0]?.localPath),
    ),
    imgUrl = localPath ? localPathToUrl(localPath) : item?.src || item?.sourceUrl || '';
  return { localPath: localPath, imgUrl: imgUrl };
}
export function toPositiveInt(key, index = 0) {
  const count = Number(key);
  if (!Number.isFinite(count) || count <= 0) return index;
  return Math.max(1, Math.round(count));
}
export function normalizeGridTileResult(fileName = {}, result = {}) {
  const localPath2 = pickResultLocalPath(fileName),
    originalLocalPath = normalizeLocalPathText(fileName.originalLocalPath || localPath2),
    displayLocalPath = normalizeLocalPathText(fileName.displayLocalPath),
    thumbLocalPath = normalizeLocalPathText(fileName.thumbLocalPath),
    url = localPathToUrl(localPath2) || String(fileName.url || '').trim(),
    w = toPositiveInt(fileName.w || fileName.width || fileName.originalWidth, result.w),
    h = toPositiveInt(fileName.h || fileName.height || fileName.originalHeight, result.h);
  return {
    ...fileName,
    url: url,
    localPath: localPath2,
    originalLocalPath: originalLocalPath,
    displayLocalPath: displayLocalPath,
    thumbLocalPath: thumbLocalPath,
    fileName: fileName.filename || fileName.fileName || result.fileName || '',
    w: w,
    h: h,
    width: w,
    height: h,
    originalWidth: toPositiveInt(fileName.originalWidth, w),
    originalHeight: toPositiveInt(fileName.originalHeight, h),
    row: toPositiveInt(fileName.row, result.row || 0),
    col: toPositiveInt(fileName.col, result.col || 0),
    isEmpty: false,
  };
}
export function resolveNodeKnownMediaBasis(width = {}) {
  const data = Number(width?.mainImageIndex) || 0,
    width2 = Array.isArray(width?.images) ? width.images[data] : null;
  return resolveInputRatioBasis(
    { width: width?.imageWidth, height: width?.imageHeight },
    { width: width?.imgWidth, height: width?.imgHeight },
    { width: width?.naturalWidth, height: width?.naturalHeight },
    { width: width?.originalWidth, height: width?.originalHeight },
    { width: width2?.imageWidth, height: width2?.imageHeight },
    { width: width2?.width, height: width2?.height },
  );
}
export async function resolveApiInputRatioBasis(width3, options) {
  const nodeKnownMediaBasis = resolveNodeKnownMediaBasis(width3);
  if (nodeKnownMediaBasis.valid) return nodeKnownMediaBasis;
  const imageNaturalSize = await readImageNaturalSize(options);
  return resolveInputRatioBasis(imageNaturalSize || {}, { width: width3?.width, height: width3?.height });
}
export async function resolveFinalResultDisplaySize(box, target = {}) {
  const box2 = await resolveOutputMediaSize(target);
  if (
    box2 &&
    shouldSwitchToOutputRatio(box.width, box.height, box2.width, box2.height, RATIO_SWITCH_THRESHOLD)
  )
    return calcDisplaySizeByMedia(box2.width, box2.height);
  return calcDisplaySizeByMedia(box.width, box.height);
}
export const RH_PENDING_CODES = new Set([0x324, 0x32d]);
export const parseRhTaskId = (source) =>
  String(
    source?.task_id ||
      source?.taskId ||
      source?.data?.task_id ||
      source?.data?.taskId ||
      source?.data?.id ||
      source?.id ||
      '',
  ).trim();
export function parseRhCode(next) {
  const current = Number(next?.code);
  return Number.isFinite(current) ? current : null;
}
export function extractFirstImageUrl(entry) {
  const map = new Set(),
    list = [],
    handler = (list2) => {
      if (!list2) return;
      if (typeof list2 === 'string') {
        const enabled = list2.trim();
        if (!enabled) return;
        if (enabled.startsWith('http://') || enabled.startsWith('https://')) {
          !map.has(enabled) && (map.add(enabled), list.push(enabled));
          return;
        }
        if (
          (enabled.startsWith('{') && enabled.endsWith('}')) ||
          (enabled.startsWith('[') && enabled.endsWith(']'))
        )
          try {
            handler(JSON.parse(enabled));
          } catch {}
        return;
      }
      if (Array.isArray(list2)) {
        list2.forEach(handler);
        return;
      }
      if (typeof list2 !== 'object') return;
      (['url', 'imageUrl', 'image', 'fileUrl', 'output', 'download_url', 'sourceUrl', 'thumbUrl'].forEach(
        (item2) => handler(list2[item2]),
      ),
        Object.values(list2).forEach(handler));
    };
  return (handler(entry), list[0] || '');
}
