export function normalizeStoryboardUpdateData(value) {
  const args = value && typeof value === 'object' ? value : {};
  if (Array.isArray(args.cells)) return args;
  return { ...args, cells: [] };
}
export function syncStoryboardToolbarLabels(el, item = {}, key = {}) {
  const el2 = el?.querySelector?.('.act-aspect span'),
    el3 = el?.querySelector?.('.act-grid span');
  (el2 && item.aspectRatio !== key.aspectRatio && (el2.textContent = '比例 ' + (item.aspectRatio || '1:1')),
    el3 &&
      (item.cols !== key.cols || item.rows !== key.rows) &&
      (el3.textContent = '网格 ' + (item.cols || 2) + '×' + (item.rows || 2)));
}
export function syncStoryboardEditingHint(el4, index) {
  const el5 = el4?.querySelector?.('.v2-storyboard-hint');
  if (!el5) return;
  el5.textContent = index ? '拖拽单元格进行互换，或拖出生成新图' : '双击进入分镜编辑';
}
function getStoryboardCellUpdateKind(
  enabled,
  result,
  {
    isCellEmpty: isCellEmpty,
    getCellDisplayImageUrl: getCellDisplayImageUrl,
    getCellSourceImageUrl: getCellSourceImageUrl,
    getCellLiveSourceImageUrl: getCellLiveSourceImageUrl,
  } = {},
) {
  if (!enabled) return 'content';
  const data = getCellDisplayImageUrl?.(enabled),
    options = getCellDisplayImageUrl?.(result),
    target = isCellEmpty?.(enabled),
    source = isCellEmpty?.(result);
  if (target !== source || options !== data) return 'content';
  const next = getCellSourceImageUrl?.(enabled),
    current = getCellSourceImageUrl?.(result),
    entry = getCellLiveSourceImageUrl?.(enabled),
    record = getCellLiveSourceImageUrl?.(result);
  if (
    next !== current ||
    entry !== record ||
    enabled?.storyboardSourceIndex !== result?.storyboardSourceIndex ||
    enabled?.storyboardSourceCrop !== result?.storyboardSourceCrop ||
    enabled?.storyboardPiece !== result?.storyboardPiece ||
    enabled?.storyboardLockedCell !== result?.storyboardLockedCell ||
    enabled?.sourceWidth !== result?.sourceWidth ||
    enabled?.sourceHeight !== result?.sourceHeight
  )
    return 'crop';
  return 'none';
}
export function updateStoryboardCellsForDataChange({
  cellEls: cellEls,
  newCells: newCells,
  oldCells: oldCells,
  buildReusableImageMap: buildReusableImageMap,
  updateCellDOM: updateCellDOM,
  applyCellCropStyles: applyCellCropStyles,
  renderCells: renderCells,
  accessors: accessors,
} = {}) {
  if (!cellEls || cellEls.length !== newCells.length) {
    renderCells?.();
    return;
  }
  const payload = buildReusableImageMap?.() || null;
  newCells.forEach((item2, handle) => {
    const storyboardCellUpdateKind = getStoryboardCellUpdateKind(oldCells[handle], item2, accessors);
    if (storyboardCellUpdateKind === 'content') updateCellDOM?.(cellEls[handle], item2, payload);
    else storyboardCellUpdateKind === 'crop' && applyCellCropStyles?.(cellEls[handle], item2, handle);
  });
}
