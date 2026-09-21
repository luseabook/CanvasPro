export function createStoryboardCellElement({
  nodeId: _0x2607ba,
  cell: _0x7e7909,
  index: _0x51a024,
  createContentNode: _0x3390a9,
} = {}) {
  const _0x50bf3b = document.createElement('div');
  ((_0x50bf3b.className = 'sb-cell'),
    (_0x50bf3b.id = 'cell-' + _0x2607ba + '-' + _0x51a024),
    (_0x50bf3b.dataset.index = String(_0x51a024)),
    Object.assign(_0x50bf3b.style, {
      position: 'relative',
      background: 'var(--bg-node)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }));
  const _0x1d605b = document.createElement('div');
  ((_0x1d605b.className = 'cell-content-wrap'),
    Object.assign(_0x1d605b.style, {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    _0x1d605b.appendChild(_0x3390a9?.(_0x7e7909, _0x51a024)));
  const _0x5016a6 = document.createElement('div');
  return (
    (_0x5016a6.className = 'cell-overlay'),
    Object.assign(_0x5016a6.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      border: '1.5px solid transparent',
      transition: 'all 0.2s',
    }),
    _0x50bf3b.appendChild(_0x1d605b),
    _0x50bf3b.appendChild(_0x5016a6),
    _0x50bf3b
  );
}
export function appendStoryboardCellElements({
  grid: _0x2bba53,
  nodeId: _0x984d26,
  cells: _0x50a8f1,
  createContentNode: _0x1e5d3f,
  applyCellCropStyles: _0x347166,
} = {}) {
  const _0x862061 = [];
  return (
    (_0x50a8f1 || []).forEach((_0x258937, _0x968895) => {
      const _0x5b614c = createStoryboardCellElement({
        nodeId: _0x984d26,
        cell: _0x258937,
        index: _0x968895,
        createContentNode: _0x1e5d3f,
      });
      (_0x2bba53?.appendChild?.(_0x5b614c),
        _0x862061.push(_0x5b614c),
        _0x347166?.(_0x5b614c, _0x258937, _0x968895));
    }),
    _0x862061
  );
}
export function rebuildStoryboardGridCellElements({
  grid: _0x5c8392,
  nodeId: _0x4321a6,
  cells: _0x59306f,
  createContentNode: _0x5ae05a,
  applyCellCropStyles: _0x2144b9,
} = {}) {
  if (!_0x5c8392) return [];
  return (
    _0x5c8392.replaceChildren(),
    appendStoryboardCellElements({
      grid: _0x5c8392,
      nodeId: _0x4321a6,
      cells: _0x59306f,
      createContentNode: _0x5ae05a,
      applyCellCropStyles: _0x2144b9,
    })
  );
}
