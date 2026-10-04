import { generateId } from '../../core/math.js';
import {
  buildStoryboardCropRect,
  detachStoryboardCellSourceContext,
  isStoryboardCellEmpty,
  resolveStoryboardCellPreviewSrc,
  resolveStoryboardCellSourceIndex,
} from '../../core/storyboardCellUtils.js';
import {
  getStoryboardCellCommitSourceUrl,
  getStoryboardCellSourceImageUrl,
  isStoryboardCellSourceCropRequired,
} from './storyboardAssetRefs.js';
function drawStoryboardCropToDataUrl(value, item) {
  const box = document.createElement('canvas');
  if (!box || typeof box.getContext !== 'function') return '';
  ((box.width = item.sw), (box.height = item.sh));
  const ctx = box.getContext('2d', { alpha: false });
  if (!ctx || typeof ctx.drawImage !== 'function') return '';
  ((ctx.imageSmoothingEnabled = true),
    (ctx.imageSmoothingQuality = 'high'),
    ctx.drawImage(value, item.sx, item.sy, item.sw, item.sh, 0, 0, item.sw, item.sh));
  const key = box.toDataURL('image/jpeg', 0.9);
  return String(key || '').startsWith('data:image/') ? key : '';
}
export function buildStoryboardMaterializedCellCrop({
  cell: cell,
  index: index,
  img: img,
  sourceNode: sourceNode,
} = {}) {
  if (!img || typeof document === 'undefined') return null;
  const width = Math.max(1, Math.trunc(Number(img.naturalWidth) || 0)),
    height = Math.max(1, Math.trunc(Number(img.naturalHeight) || 0));
  if (width <= 0 || height <= 0) return null;
  const storyboardCellSourceIndex = resolveStoryboardCellSourceIndex(cell, index, sourceNode),
    originalWidth = buildStoryboardCropRect(sourceNode, storyboardCellSourceIndex, {
      width: width,
      height: height,
      inset: 0,
    });
  if (!originalWidth || originalWidth.sw <= 0 || originalWidth.sh <= 0) return null;
  try {
    const capturePreviewUrl = drawStoryboardCropToDataUrl(img, originalWidth);
    if (!capturePreviewUrl) return null;
    return {
      capturePreviewUrl: capturePreviewUrl,
      fileName: cell?.fileName || 'storyboard_piece_' + generateId('storyboard-cell') + '.jpg',
      originalWidth: originalWidth.sw,
      originalHeight: originalWidth.sh,
      imageWidth: originalWidth.sw,
      imageHeight: originalWidth.sh,
      w: originalWidth.sw,
      h: originalWidth.sh,
    };
  } catch {
    return null;
  }
}
export function materializeStoryboardSourceBackedCellsForEditing({
  node: node,
  cells: cells,
  getLoadedSourceImageForCell: getLoadedSourceImageForCell,
} = {}) {
  const list = Array.isArray(cells) ? cells : [];
  let result = false;
  const sourceNode2 = node,
    data = list.map((cell2, index2) => {
      const storyboardCellSourceImageUrl = getStoryboardCellSourceImageUrl(cell2);
      if (!storyboardCellSourceImageUrl || isStoryboardCellEmpty(cell2)) return cell2;
      const img2 = getLoadedSourceImageForCell(index2, storyboardCellSourceImageUrl),
        localPath = buildStoryboardMaterializedCellCrop({
          cell: cell2,
          index: index2,
          img: img2,
          sourceNode: sourceNode2,
        }),
        enabled = !!(localPath?.capturePreviewUrl || resolveStoryboardCellPreviewSrc(cell2));
      if (!enabled) return cell2;
      return (
        (result = true),
        detachStoryboardCellSourceContext(
          {
            ...(cell2 && typeof cell2 === 'object' ? cell2 : {}),
            ...(localPath || {}),
            localPath: localPath?.capturePreviewUrl ? null : cell2.localPath || null,
            originalLocalPath: localPath?.capturePreviewUrl ? null : cell2.originalLocalPath || null,
            displayLocalPath: localPath?.capturePreviewUrl ? '' : cell2.displayLocalPath || '',
            thumbLocalPath: localPath?.capturePreviewUrl ? '' : cell2.thumbLocalPath || '',
            thumbUrl: localPath?.capturePreviewUrl ? '' : cell2.thumbUrl || '',
            thumbId: null,
            storyboardSourceIndex: resolveStoryboardCellSourceIndex(cell2, index2, sourceNode2),
            storyboardLockedCell: true,
            isEmpty: false,
          },
          { locked: true, extracted: cell2.storyboardExtractedCell === true },
        )
      );
    });
  return result ? data : null;
}
export async function cropStoryboardCellFromSource({
  cell: cell3,
  index: index3,
  sourceNode: sourceNode3,
  imageCache: imageCache,
  resolveSourceImage: resolveSourceImage,
} = {}) {
  const storyboardCellCommitSourceUrl = getStoryboardCellCommitSourceUrl(cell3, sourceNode3);
  if (!storyboardCellCommitSourceUrl) {
    if (isStoryboardCellSourceCropRequired(cell3)) return { cell: cell3, ok: false, skipped: false };
    return { cell: cell3, ok: true, skipped: true };
  }
  const width2 = await resolveSourceImage(index3, storyboardCellCommitSourceUrl, imageCache);
  if (!width2) return { cell: cell3, ok: false, skipped: false };
  const storyboardSourceIndex = resolveStoryboardCellSourceIndex(cell3, index3, sourceNode3),
    originalWidth2 = buildStoryboardCropRect(sourceNode3, storyboardSourceIndex, {
      width: width2.naturalWidth,
      height: width2.naturalHeight,
      inset: 0,
    });
  if (!originalWidth2 || originalWidth2.sw <= 0 || originalWidth2.sh <= 0)
    return { cell: cell3, ok: false, skipped: false };
  let capturePreviewUrl2 = '';
  try {
    capturePreviewUrl2 = drawStoryboardCropToDataUrl(width2, originalWidth2);
  } catch {
    capturePreviewUrl2 = '';
  }
  if (!capturePreviewUrl2) return { cell: cell3, ok: false, skipped: false };
  const cell4 = detachStoryboardCellSourceContext(
    {
      ...(cell3 && typeof cell3 === 'object' ? cell3 : {}),
      url: '',
      localPath: null,
      originalLocalPath: null,
      displayLocalPath: '',
      thumbLocalPath: '',
      thumbUrl: '',
      thumbId: null,
      capturePreviewUrl: capturePreviewUrl2,
      fileName: 'storyboard_cell_' + generateId('storyboard-cell') + '.jpg',
      originalWidth: originalWidth2.sw,
      originalHeight: originalWidth2.sh,
      imageWidth: originalWidth2.sw,
      imageHeight: originalWidth2.sh,
      w: originalWidth2.sw,
      h: originalWidth2.sh,
      storyboardPiece: true,
      storyboardSourceIndex: storyboardSourceIndex,
      storyboardLockedCell: true,
      storyboardExtractedCell: false,
      isEmpty: false,
    },
    { locked: true, extracted: false },
  );
  return { cell: cell4, ok: true, skipped: false };
}
export async function materializeStoryboardCellsForConfirmedGrid({
  node: node2,
  gridLayout: gridLayout,
  gridGap: gridGap,
  cellsOverride: cellsOverride = null,
  cropCell: cropCell,
} = {}) {
  const cells2 = Array.isArray(cellsOverride)
    ? cellsOverride
    : Array.isArray(node2?.cells)
      ? node2.cells
      : [];
  if (!Array.isArray(cells2) || cells2.length <= 0) return { cells: cells2, partialFailure: false };
  const options = { ...node2, gridLayout: gridLayout, gridGap: gridGap },
    target = new Map(),
    failedIndices = [],
    source = [...cells2];
  for (let next = 0; next < cells2.length; next += 1) {
    const current = cells2[next];
    if (isStoryboardCellEmpty(current)) continue;
    const response = await cropCell(current, next, options, target);
    if (!response.ok && !response.skipped) {
      failedIndices.push(next);
      continue;
    }
    source[next] = response.cell;
  }
  const ok = failedIndices.length === 0;
  return { ok: ok, cells: ok ? source : cells2, failedIndices: failedIndices };
}
