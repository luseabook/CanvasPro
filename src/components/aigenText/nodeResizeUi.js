import { startNodeResizePreview } from '../../modules/interaction/nodeResizePreview.js';
const MIN_NODE_WIDTH = 220,
  MIN_NODE_HEIGHT = 0x104,
  DEFAULT_NODE_WIDTH = 0x12c,
  DEFAULT_NODE_HEIGHT = 0x12c;
function normalizeMinDimension(_0x4abc7c, _0x15d134) {
  const _0x178a23 = Number(_0x4abc7c);
  return Number.isFinite(_0x178a23) && _0x178a23 > 0 ? _0x178a23 : _0x15d134;
}
function resolveResizeMinSize({
  ctx: _0x4746dc,
  startNode: _0x110681,
  minWidth: _0x4a941b,
  minHeight: _0x5047ba,
  resolveMinSize: _0x5b0ca5,
}) {
  const _0x363ca5 = typeof _0x5b0ca5 === 'function' ? _0x5b0ca5(_0x110681, _0x4746dc) : null;
  return {
    width: normalizeMinDimension(_0x363ca5?.width, _0x4a941b),
    height: normalizeMinDimension(_0x363ca5?.height, _0x5047ba),
  };
}
export function createNodeResizeHandle(
  _0x4eaca1,
  {
    store: _0x2b4e0a,
    getStateSnapshot: _0x2cf091,
    commit: _0x8b2c59,
    minWidth: minWidth = MIN_NODE_WIDTH,
    minHeight: minHeight = MIN_NODE_HEIGHT,
    resolveMinSize: _0x3013fb,
  },
) {
  const _0x8cf2e3 = document.createElement('div');
  return (
    (_0x8cf2e3.className = 'group-resizer'),
    _0x8cf2e3.classList.add('v2-resize-move'),
    (_0x8cf2e3.style.pointerEvents = 'auto'),
    _0x8cf2e3.addEventListener('pointerdown', (_0x2121b8) => {
      startNodeResizePreview({
        event: _0x2121b8,
        nodeId: _0x4eaca1.nodeId,
        getNode: () => _0x2cf091().nodes?.[_0x4eaca1.nodeId] || _0x4eaca1._data,
        getViewport: () => _0x2cf091().viewport,
        resolveSize: ({
          startNode: _0x1eaf09,
          startWidth: _0x187278,
          startHeight: _0x24eb56,
          dx: _0x4a1386,
          dy: _0x5ad059,
        }) => {
          const _0x4683d0 = resolveResizeMinSize({
            ctx: _0x4eaca1,
            startNode: _0x1eaf09,
            minWidth: minWidth,
            minHeight: minHeight,
            resolveMinSize: _0x3013fb,
          });
          return {
            width: Math.max(_0x4683d0.width, _0x187278 + _0x4a1386),
            height: Math.max(_0x4683d0.height, _0x24eb56 + _0x5ad059),
          };
        },
        applyPatch: (_0x56d2a3) => _0x2b4e0a.updateNodeData(_0x4eaca1.nodeId, _0x56d2a3),
        commit: _0x8b2c59,
      });
    }),
    _0x8cf2e3
  );
}
