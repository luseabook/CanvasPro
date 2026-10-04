import { getAutoMediaSizeByShortSide } from './fileService.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
export const OUTPUT_RATIO_SWITCH_THRESHOLD = 0.03;
function _toSafeNumber(value) {
  const item = Number(value);
  return Number.isFinite(item) ? item : 0;
}
function _normalizeDims(key, index) {
  const _toSafeNumber2 = _toSafeNumber(key),
    _toSafeNumber3 = _toSafeNumber(index);
  if (_toSafeNumber2 <= 0 || _toSafeNumber3 <= 0) return null;
  return { width: Math.max(1, Math.round(_toSafeNumber2)), height: Math.max(1, Math.round(_toSafeNumber3)) };
}
export function resolveInputRatioBasis(...args) {
  for (const box of args) {
    if (!box || typeof box !== 'object') continue;
    const args2 = _normalizeDims(box.width, box.height);
    if (args2) return { ...args2, valid: true };
  }
  return { width: 1, height: 1, valid: false };
}
export function calcDisplaySizeByMedia(width, height) {
  const box2 = resolveInputRatioBasis({ width: width, height: height });
  return getAutoMediaSizeByShortSide(box2.width, box2.height);
}
export function shouldSwitchToOutputRatio(
  result,
  data,
  options,
  target,
  source = OUTPUT_RATIO_SWITCH_THRESHOLD,
) {
  const box3 = _normalizeDims(result, data),
    box4 = _normalizeDims(options, target),
    next = Math.max(0, _toSafeNumber(source));
  if (!box3 || !box4) return false;
  const count = box3.width / box3.height,
    current = box4.width / box4.height;
  if (!Number.isFinite(count) || !Number.isFinite(current) || count <= 0) return false;
  const entry = Math.abs(current - count) / count;
  return entry > next;
}
export function normalizePathToLocalUrl(record) {
  const enabled = String(record || '').trim();
  if (!enabled) return '';
  if (
    enabled.startsWith('http://') ||
    enabled.startsWith('https://') ||
    enabled.startsWith('blob:') ||
    enabled.startsWith('data:')
  )
    return enabled;
  return localPathToUrl(enabled);
}
export async function readImageNaturalSize(payload) {
  const enabled2 = String(payload || '').trim();
  if (!enabled2) return null;
  if (typeof Image === 'undefined') return null;
  return new Promise((handler) => {
    const box5 = new Image();
    ((box5.crossOrigin = 'anonymous'),
      (box5.onload = () => {
        const _normalizeDims2 = _normalizeDims(
          box5.naturalWidth || box5.width,
          box5.naturalHeight || box5.height,
        );
        handler(_normalizeDims2);
      }),
      (box5.onerror = () => handler(null)),
      (box5.src = enabled2));
  });
}
export async function resolveOutputMediaSize({
  localPath: localPath = '',
  imageUrl: imageUrl = '',
  sourceUrl: sourceUrl = '',
  thumbUrl: thumbUrl = '',
  src: src = '',
} = {}) {
  const localUrl = normalizePathToLocalUrl(localPath),
    handle = [
      localUrl,
      String(imageUrl || '').trim(),
      String(sourceUrl || '').trim(),
      String(thumbUrl || '').trim(),
      String(src || '').trim(),
    ].filter(Boolean);
  for (const state of handle) {
    const imageNaturalSize = await readImageNaturalSize(state);
    if (imageNaturalSize) return imageNaturalSize;
  }
  return null;
}
