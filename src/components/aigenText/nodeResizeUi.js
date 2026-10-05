import { startNodeResizePreview } from '../../modules/interaction/nodeResizePreview.js';
const MIN_NODE_WIDTH = 220,
  MIN_NODE_HEIGHT = 260,
  DEFAULT_NODE_WIDTH = 300,
  DEFAULT_NODE_HEIGHT = 300;
function normalizeMinDimension(value, item) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : item;
}
function resolveResizeMinSize({
  ctx: ctx,
  startNode: startNode,
  minWidth: minWidth2,
  minHeight: minHeight2,
  resolveMinSize: resolveMinSize,
}) {
  const box = typeof resolveMinSize === 'function' ? resolveMinSize(startNode, ctx) : null;
  return {
    width: normalizeMinDimension(box?.width, minWidth2),
    height: normalizeMinDimension(box?.height, minHeight2),
  };
}
export function createNodeResizeHandle(
  nodeId,
  {
    store: store,
    getStateSnapshot: getStateSnapshot,
    commit: commit,
    minWidth: minWidth = MIN_NODE_WIDTH,
    minHeight: minHeight = MIN_NODE_HEIGHT,
    resolveMinSize: resolveMinSize2,
  },
) {
  const el = document.createElement('div');
  return (
    (el.className = 'group-resizer'),
    el.classList.add('v2-resize-move'),
    (el.style.pointerEvents = 'auto'),
    el.addEventListener('pointerdown', (event) => {
      startNodeResizePreview({
        event: event,
        nodeId: nodeId.nodeId,
        getNode: () => getStateSnapshot().nodes?.[nodeId.nodeId] || nodeId._data,
        getViewport: () => getStateSnapshot().viewport,
        resolveSize: ({
          startNode: startNode2,
          startWidth: startWidth,
          startHeight: startHeight,
          dx: dx,
          dy: dy,
        }) => {
          const box2 = resolveResizeMinSize({
            ctx: nodeId,
            startNode: startNode2,
            minWidth: minWidth,
            minHeight: minHeight,
            resolveMinSize: resolveMinSize2,
          });
          return {
            width: Math.max(box2.width, startWidth + dx),
            height: Math.max(box2.height, startHeight + dy),
          };
        },
        applyPatch: (key) => store.updateNodeData(nodeId.nodeId, key),
        commit: commit,
      });
    }),
    el
  );
}
