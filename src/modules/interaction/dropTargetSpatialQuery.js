import { createNodeSpatialIndex, queryNodeSpatialIndexAtWorldPoint } from '../../core/math.js';
import { getStoryboardCellMetrics } from '../../core/storyboardCellUtils.js';
import { resolveCollageItemFrames } from '../collage/collageFactory.js';
export function createDropTargetSpatialQuery() {
  let indexedNodes, indexedRev, spatialIndex;
  return (state, worldX, worldY) => {
    const nodes = state.nodes || {},
      persistRev = state._persistRev;
    return (
      (!spatialIndex ||
        indexedNodes !== nodes ||
        indexedRev !== persistRev ||
        !Number.isFinite(persistRev)) &&
        ((spatialIndex = createNodeSpatialIndex(nodes, {
          resolveRect(node) {
            if (node?.type === 'storyboard')
              return { x: node.x, y: node.y, ...getStoryboardCellMetrics(node) };
            if (node?.type !== 'collage') return null;
            const frames = resolveCollageItemFrames(node)
              .map((item) => item.frame)
              .filter(Boolean);
            if (!frames.length) return null;
            const minX = Math.min(...frames.map((frame) => frame.x)),
              minY = Math.min(...frames.map((frame) => frame.y));
            return {
              x: (Number(node.x) || 0) + minX,
              y: (Number(node.y) || 0) + minY,
              width: Math.max(...frames.map((frame) => frame.x + frame.width)) - minX,
              height: Math.max(...frames.map((frame) => frame.y + frame.height)) - minY,
            };
          },
        })),
        (indexedNodes = nodes),
        (indexedRev = persistRev)),
      queryNodeSpatialIndexAtWorldPoint(spatialIndex, worldX, worldY)
        .map((nodeId) => nodes[nodeId])
        .filter(Boolean)
    );
  };
}
