import { buildStoryboardCropRect } from '../../core/storyboardCellUtils.js';
export function applyStoryboardDefaultCellImageStyles(el, value, item) {
  const key = String(value || '');
  (el.getAttribute('src') !== key && el.setAttribute('src', key),
    el.classList.remove('storyboard-cell-img--source-crop'),
    (el.style.position = ''),
    (el.style.inset = ''),
    (el.style.left = ''),
    (el.style.top = ''),
    (el.style.display = ''),
    (el.style.width = '100%'),
    (el.style.height = '100%'),
    (el.style.objectFit =
      item?.storyboardExtractedCell === true || item?.storyboardLockedCell === true ? 'fill' : 'cover'));
}
export function getStoryboardCellDisplaySourceSize(index, box = null, box2 = {}) {
  const result = Math.trunc(Number(box?.naturalWidth || box?.width) || 0),
    data = Math.trunc(Number(box?.naturalHeight || box?.height) || 0);
  return {
    width: Math.max(
      1,
      result ||
        Math.trunc(
          Number(index?.sourceWidth) ||
            Number(box2?.storyboardSourceWidth) ||
            Number(box2?.sourceWidth) ||
            Number(box2?.width) ||
            1,
        ),
    ),
    height: Math.max(
      1,
      data ||
        Math.trunc(
          Number(index?.sourceHeight) ||
            Number(box2?.storyboardSourceHeight) ||
            Number(box2?.sourceHeight) ||
            Number(box2?.height) ||
            1,
        ),
    ),
  };
}
export function applyStoryboardSourceCropImageStyles({
  img: img,
  cell: cell,
  index: index2,
  sourceUrl: sourceUrl,
  node: node,
  sourceIndex: sourceIndex,
  isLoadedImageElement: isLoadedImageElement,
  onImageLoad: onImageLoad,
} = {}) {
  if (!img || !sourceUrl) return;
  img.getAttribute('src') !== sourceUrl && img.setAttribute('src', sourceUrl);
  (img.classList.add('storyboard-cell-img--source-crop'),
    (img.style.display = 'block'),
    (img.style.position = 'absolute'),
    (img.style.inset = ''),
    (img.style.objectFit = 'fill'),
    (img.style.pointerEvents = 'none'));
  const width = getStoryboardCellDisplaySourceSize(cell, img, node),
    storyboardCropRect = buildStoryboardCropRect(node, sourceIndex ?? index2, {
      width: width.width,
      height: width.height,
      inset: 0,
    });
  if (!storyboardCropRect || storyboardCropRect.sw <= 0 || storyboardCropRect.sh <= 0) {
    ((img.style.left = '0'), (img.style.top = '0'), (img.style.width = '100%'), (img.style.height = '100%'));
    return;
  }
  ((img.style.left = -(storyboardCropRect.sx / storyboardCropRect.sw) * 100 + '%'),
    (img.style.top = -(storyboardCropRect.sy / storyboardCropRect.sh) * 100 + '%'),
    (img.style.width = (width.width / storyboardCropRect.sw) * 100 + '%'),
    (img.style.height = (width.height / storyboardCropRect.sh) * 100 + '%'),
    !isLoadedImageElement?.(img) && img.addEventListener?.('load', onImageLoad, { once: true }));
}
export function syncStoryboardSourceCacheImage({
  cellEl: cellEl,
  sourceUrl: sourceUrl2,
  onReady: onReady = null,
  isLoadedImageElement: isLoadedImageElement2,
} = {}) {
  const el2 = cellEl?.querySelector?.('.cell-content-wrap') || null;
  if (!el2) return;
  const el3 = el2.querySelector?.('.storyboard-cell-source-cache') || null,
    enabled = String(sourceUrl2 || '').trim();
  if (!enabled) {
    el3?.remove?.();
    return;
  }
  const run = (el4) => {
    if (typeof onReady !== 'function' || !el4) return;
    if (isLoadedImageElement2?.(el4)) return;
    el4.addEventListener?.('load', onReady, { once: true });
  };
  if (el3) {
    el3.getAttribute('src') !== enabled && el3.setAttribute('src', enabled);
    run(el3);
    return;
  }
  const el5 = document.createElement('img');
  ((el5.className = 'storyboard-cell-source-cache storyboard-cell-img--source-crop'),
    el5.setAttribute('src', enabled),
    el5.setAttribute('aria-hidden', 'true'),
    (el5.decoding = 'async'),
    (el5.loading = 'eager'),
    el2.appendChild(el5),
    run(el5));
}
export function applyStoryboardEmptyCutoutStyles(el6) {
  if (!el6) return;
  const el7 = el6.querySelector?.('.storyboard-empty-cutout') || null;
  if (!el7) return;
  ((el7.style.display = 'flex'),
    (el7.style.position = 'absolute'),
    (el7.style.left = '0'),
    (el7.style.top = '0'),
    (el7.style.width = '100%'),
    (el7.style.height = '100%'));
}
export function applyStoryboardEmptyResidualImageStyles({
  img: img2,
  cell: cell2,
  node: node2,
  activeBounds: activeBounds,
} = {}) {
  if (!img2) return;
  const options = String(cell2?.residualImageMode || '');
  if (options !== 'source') {
    ((img2.style.position = 'absolute'),
      (img2.style.inset = '0'),
      (img2.style.left = '0'),
      (img2.style.top = '0'),
      (img2.style.width = '100%'),
      (img2.style.height = '100%'),
      (img2.style.objectFit = 'cover'));
    return;
  }
  const target = Math.max(
      1,
      Number(cell2?.residualImageWidth) || Number(cell2?.sourceWidth) || Number(node2?.sourceWidth) || 1,
    ),
    source = Math.max(
      1,
      Number(cell2?.residualImageHeight) || Number(cell2?.sourceHeight) || Number(node2?.sourceHeight) || 1,
    );
  if (!activeBounds || activeBounds.width <= 0 || activeBounds.height <= 0) {
    ((img2.style.position = 'absolute'),
      (img2.style.inset = '0'),
      (img2.style.width = '100%'),
      (img2.style.height = '100%'),
      (img2.style.objectFit = 'cover'));
    return;
  }
  const next = target / Math.max(1, Number(node2?.width) || 1),
    current = source / Math.max(1, Number(node2?.height) || 1),
    entry = activeBounds.x0 * next,
    record = activeBounds.y0 * current,
    payload = Math.max(1, activeBounds.width * next),
    handle = Math.max(1, activeBounds.height * current);
  ((img2.style.position = 'absolute'),
    (img2.style.inset = ''),
    (img2.style.left = -(entry / payload) * 100 + '%'),
    (img2.style.top = -(record / handle) * 100 + '%'),
    (img2.style.width = (target / payload) * 100 + '%'),
    (img2.style.height = (source / handle) * 100 + '%'),
    (img2.style.objectFit = 'fill'));
}
export function applyStoryboardCellLayoutStyles({
  cellEl: cellEl2,
  isCustomGridEditing: isCustomGridEditing = false,
  frozen: frozen = null,
  bounds: bounds = null,
} = {}) {
  if (!cellEl2) return;
  if (isCustomGridEditing && frozen) {
    ((cellEl2.style.display = frozen.display),
      (cellEl2.style.position = frozen.position),
      (cellEl2.style.left = frozen.left),
      (cellEl2.style.top = frozen.top),
      (cellEl2.style.width = frozen.width),
      (cellEl2.style.height = frozen.height));
    return;
  }
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    cellEl2.style.display = 'none';
    return;
  }
  ((cellEl2.style.display = 'flex'),
    (cellEl2.style.position = 'absolute'),
    (cellEl2.style.left = bounds.x0 + 'px'),
    (cellEl2.style.top = bounds.y0 + 'px'),
    (cellEl2.style.width = bounds.width + 'px'),
    (cellEl2.style.height = bounds.height + 'px'));
}
export function captureStoryboardCellVisualState(list) {
  if (!list) return null;
  return list.map((display) => ({
    display: display.style.display || '',
    position: display.style.position || '',
    left: display.style.left || '',
    top: display.style.top || '',
    width: display.style.width || '',
    height: display.style.height || '',
  }));
}
