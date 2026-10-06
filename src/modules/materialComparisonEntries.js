import { isCollageImageNode, resolveCollageNodeImage } from './collage/collageFactory.js';
import { resolveCanvasNodePlayableVideoEntry } from './videoSyncPlayback.js';
import { resolveCanvasVideoPosterUrl } from '../services/canvasMediaLocalService.js';
import { t } from '../i18n/index.js';
export const MATERIAL_COMPARISON_KIND_IMAGE = 'image';
export const MATERIAL_COMPARISON_KIND_VIDEO = 'video';
function getEntryLabel(error, value, index, handler) {
  return String(
    value?.label ||
      error?.name ||
      error?.fileName ||
      handler('canvasInteraction.materialComparison.untitled', { index: index + 1 }),
  ).trim();
}
function getEntryAspectRatio(item, box) {
  const count = Number(
      box?.originalWidth ||
        box?.videoWidth ||
        box?.imageWidth ||
        box?.sourceWidth ||
        box?.width ||
        item?.originalWidth ||
        item?.videoWidth ||
        item?.imageWidth ||
        item?.sourceWidth ||
        0,
    ),
    count2 = Number(
      box?.originalHeight ||
        box?.videoHeight ||
        box?.imageHeight ||
        box?.sourceHeight ||
        box?.height ||
        item?.originalHeight ||
        item?.videoHeight ||
        item?.imageHeight ||
        item?.sourceHeight ||
        0,
    );
  if (count <= 0 || count2 <= 0) return 0;
  return count / count2;
}
function resolveImageEntry(node, key, result) {
  if (!isCollageImageNode(node)) return null;
  const response = resolveCollageNodeImage(node),
    thumbnailUrl = String(response?.url || '').trim();
  if (!thumbnailUrl) return null;
  return {
    id: String(node?.id || 'comparison-image-' + key),
    node: node,
    kind: MATERIAL_COMPARISON_KIND_IMAGE,
    label: getEntryLabel(node, response, key, result),
    thumbnailUrl: thumbnailUrl,
    sourceUrl: '',
    aspectRatio: getEntryAspectRatio(node, response),
    originalPromise: null,
    originalUrl: '',
    revokeUrlOnClose: false,
  };
}
function resolveVideoEntry(node2, data, options) {
  const canvasNodePlayableVideoEntry = resolveCanvasNodePlayableVideoEntry(node2);
  if (!canvasNodePlayableVideoEntry?.source) return null;
  const target = canvasNodePlayableVideoEntry.record || node2;
  return {
    id: String(node2?.id || 'comparison-video-' + data),
    node: node2,
    kind: MATERIAL_COMPARISON_KIND_VIDEO,
    label: getEntryLabel(node2, target, data, options),
    thumbnailUrl: String(resolveCanvasVideoPosterUrl(target) || resolveCanvasVideoPosterUrl(node2) || '').trim(),
    sourceUrl: String(canvasNodePlayableVideoEntry.source || '').trim(),
    videoIndex: Number(canvasNodePlayableVideoEntry.videoIndex) || 0,
    aspectRatio: getEntryAspectRatio(node2, target),
    originalPromise: null,
    originalUrl: '',
    revokeUrlOnClose: false,
  };
}
export function resolveMaterialComparisonEntries(list = [], source = {}) {
  const next = typeof source.translate === 'function' ? source.translate : t;
  return (Array.isArray(list) ? list : [])
    .map(
      (current, entry) => resolveImageEntry(current, entry, next) || resolveVideoEntry(current, entry, next),
    )
    .filter(Boolean);
}
export function getMaterialComparisonKindCounts(list2 = []) {
  const map = new Map();
  for (const record of Array.isArray(list2) ? list2 : []) {
    const enabled = String(record?.kind || '').trim();
    if (!enabled) continue;
    map.set(enabled, (map.get(enabled) || 0) + 1);
  }
  return map;
}
export function findInitialMaterialComparisonPair(list3 = []) {
  const list4 = Array.isArray(list3) ? list3 : [],
    map2 = getMaterialComparisonKindCounts(list4),
    leftIndex = list4.findIndex((payload) => (map2.get(payload?.kind) || 0) >= 2);
  if (leftIndex < 0) return null;
  const rightIndex = list4.findIndex(
    (handle, state) => state !== leftIndex && handle?.kind === list4[leftIndex]?.kind,
  );
  if (rightIndex < 0) return null;
  return { leftIndex: leftIndex, rightIndex: rightIndex };
}
export function hasMaterialComparisonPair(list5 = []) {
  return !!findInitialMaterialComparisonPair(resolveMaterialComparisonEntries(list5));
}
