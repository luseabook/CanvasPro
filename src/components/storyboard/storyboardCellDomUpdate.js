import { cloneReusableStoryboardCellImage } from './storyboardCellContent.js';
export function updateStoryboardCellDOM({
  cellEl: cellEl,
  cell: cell,
  reusableImageMap: reusableImageMap = null,
  getCellDisplayImageUrl: getCellDisplayImageUrl,
  getCellResidualImageUrl: getCellResidualImageUrl,
  createContentNode: createContentNode,
  applyCropStyles: applyCropStyles,
} = {}) {
  if (!cell) return;
  const el = cellEl?.querySelector?.('.cell-content-wrap') || null;
  if (!el) return;
  const enabled = getCellDisplayImageUrl?.(cell) || '',
    enabled2 = !enabled,
    el2 = el.firstElementChild;
  if (enabled2) {
    const enabled3 = !!getCellResidualImageUrl?.(cell),
      enabled4 = el2?.classList?.contains('storyboard-empty-residual') === true,
      value = el2?.classList?.contains('empty-placeholder') === true && !enabled4;
    if ((enabled3 && enabled4) || (!enabled3 && value)) {
      applyCropStyles?.();
      return;
    }
  } else {
    if (el2 && el2.tagName === 'IMG' && el2.getAttribute('src') === enabled) {
      applyCropStyles?.();
      return;
    }
  }
  if (!enabled2 && el2 && el2.tagName === 'IMG') {
    const cloneReusableStoryboardCellImage2 = cloneReusableStoryboardCellImage(enabled, reusableImageMap);
    if (cloneReusableStoryboardCellImage2) {
      (delete el.__storyboardPendingSrc,
        el.replaceChildren(cloneReusableStoryboardCellImage2),
        applyCropStyles?.());
      return;
    }
  }
  const el3 = createContentNode?.(cell);
  if (!enabled2 && el2 && el2.tagName === 'IMG' && el3?.tagName === 'IMG') {
    const item = enabled;
    ((el.__storyboardPendingSrc = item),
      el.querySelectorAll('.storyboard-cell-img.is-cell-preloading').forEach((el4) => el4.remove()));
    const run = () => {
      if (el.__storyboardPendingSrc !== item) return;
      (el3.classList.remove('is-cell-preloading', 'is-cell-ready'),
        el.replaceChildren(el3),
        applyCropStyles?.(),
        delete el.__storyboardPendingSrc);
    };
    if (el3.complete && el3.naturalWidth > 0) {
      run();
      return;
    }
    let key = false;
    const run2 = () => {
      if (key) return;
      if (el.__storyboardPendingSrc !== item) return;
      ((key = true), el3.classList.add('is-cell-ready'), setTimeout(run, 60));
    };
    (el3.classList.add('is-cell-preloading'),
      el3.addEventListener('load', run2, { once: true }),
      el.appendChild(el3));
    el3.complete && el3.naturalWidth > 0 && run2();
    return;
  }
  (delete el.__storyboardPendingSrc, el.replaceChildren());
  if (el3) el.appendChild(el3);
  applyCropStyles?.();
}
