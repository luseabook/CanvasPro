export function createStoryboardCellElement({
  nodeId: nodeId,
  cell: cell,
  index: index,
  createContentNode: createContentNode,
} = {}) {
  const el = document.createElement('div');
  ((el.className = 'sb-cell'),
    (el.id = 'cell-' + nodeId + '-' + index),
    (el.dataset.index = String(index)),
    Object.assign(el.style, {
      position: 'relative',
      background: 'var(--bg-node)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }));
  const el2 = document.createElement('div');
  ((el2.className = 'cell-content-wrap'),
    Object.assign(el2.style, {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    el2.appendChild(createContentNode?.(cell, index)));
  const el3 = document.createElement('div');
  return (
    (el3.className = 'cell-overlay'),
    Object.assign(el3.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      border: '1.5px solid transparent',
      transition: 'all 0.2s',
    }),
    el.appendChild(el2),
    el.appendChild(el3),
    el
  );
}
export function appendStoryboardCellElements({
  grid: grid,
  nodeId: nodeId2,
  cells: cells,
  createContentNode: createContentNode2,
  applyCellCropStyles: applyCellCropStyles,
} = {}) {
  const list = [];
  return (
    (cells || []).forEach((cell2, index2) => {
      const storyboardCellElement = createStoryboardCellElement({
        nodeId: nodeId2,
        cell: cell2,
        index: index2,
        createContentNode: createContentNode2,
      });
      (grid?.appendChild?.(storyboardCellElement),
        list.push(storyboardCellElement),
        applyCellCropStyles?.(storyboardCellElement, cell2, index2));
    }),
    list
  );
}
export function rebuildStoryboardGridCellElements({
  grid: grid2,
  nodeId: nodeId3,
  cells: cells2,
  createContentNode: createContentNode3,
  applyCellCropStyles: applyCellCropStyles2,
} = {}) {
  if (!grid2) return [];
  return (
    grid2.replaceChildren(),
    appendStoryboardCellElements({
      grid: grid2,
      nodeId: nodeId3,
      cells: cells2,
      createContentNode: createContentNode3,
      applyCellCropStyles: applyCellCropStyles2,
    })
  );
}
