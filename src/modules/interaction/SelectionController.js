import { addEdgeWithPolicies } from './EdgeController.js';
import {
  beginSelectionBoxPreview,
  cancelSelectionBoxPreview,
  updateSelectionBoxPreview,
} from '../../core/selectionBoxPreview.js';
export function createSelectionController({
  store: store,
  screenToWorld: screenToWorld,
  isNodeType: isNodeType,
  isValidConnection: isValidConnection,
}) {
  function startBoxSelecting(value, item, key) {
    ((value.isBoxSelecting = true),
      (value.boxStartX = item),
      (value.boxStartY = key),
      (value._boxSelectionActivated = false),
      cancelSelectionBoxPreview());
  }
  function updateBoxSelecting(enabled, index, result) {
    const args = {
      x1: Math.min(enabled.boxStartX, index),
      y1: Math.min(enabled.boxStartY, result),
      x2: Math.max(enabled.boxStartX, index),
      y2: Math.max(enabled.boxStartY, result),
    };
    if (!enabled._boxSelectionActivated) {
      const count = Math.hypot(index - enabled.boxStartX, result - enabled.boxStartY);
      count > 3 &&
        ((enabled._boxSelectionActivated = true), beginSelectionBoxPreview({ active: true, ...args }));
    }
    enabled._boxSelectionActivated && updateSelectionBoxPreview({ active: true, ...args });
  }
  function finishBoxSelecting(data, options, target) {
    cancelSelectionBoxPreview();
    const source = store.getState(),
      enabled2 = source.pickConnectMode,
      { viewport: viewport, nodes: nodes } = source,
      { boxStartX: boxStartX, boxStartY: boxStartY } = data;
    if (
      !Number.isFinite(boxStartX) ||
      !Number.isFinite(boxStartY) ||
      !Number.isFinite(options) ||
      !Number.isFinite(target)
    )
      return (
        store.setSelectionBox({ active: false }),
        (data.isBoxSelecting = false),
        { earlyReturn: false, didAct: false }
      );
    const next = Math.min(boxStartX, options),
      current = Math.max(boxStartX, options),
      entry = Math.min(boxStartY, target),
      record = Math.max(boxStartY, target),
      { x: x, y: y } = screenToWorld(next, entry, viewport),
      { x: x2, y: y2 } = screenToWorld(current, record, viewport);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(x2) || !Number.isFinite(y2))
      return (
        store.setSelectionBox({ active: false }),
        (data.isBoxSelecting = false),
        { earlyReturn: false, didAct: false }
      );
    if (!enabled2?.active && source.connOverlay?.srcId)
      return (
        store.setSelectionBox({ active: false }),
        (data.isBoxSelecting = false),
        { earlyReturn: false, didAct: false }
      );
    if (enabled2 && enabled2.active) {
      for (const box of Object.values(nodes)) {
        if (box.id === enabled2.sourceNodeId || isNodeType(box, 'group')) continue;
        const payload = box.x + (box.width || 260) / 2,
          handle = box.y + (box.height || 100) / 2;
        if (payload >= x && payload <= x2 && handle >= y && handle <= y2) {
          const state = enabled2.handleDirection === 'left',
            sourceId = state ? box.id : enabled2.sourceNodeId,
            targetId = state ? enabled2.sourceNodeId : box.id;
          if (nodes[sourceId] && nodes[sourceId].type === 'group') continue;
          if (!isValidConnection(nodes[sourceId], nodes[targetId])) continue;
          addEdgeWithPolicies({ sourceId: sourceId, targetId: targetId });
        }
      }
      return (
        store.setSelectionBox({ active: false }),
        (data.isBoxSelecting = false),
        { earlyReturn: true, didAct: true }
      );
    }
    const list = [];
    for (const box2 of Object.values(nodes)) {
      const config = box2.x + (box2.width || 260),
        scope = box2.y + (box2.height || 100);
      if (isNodeType(box2, 'group')) {
        const input = box2.x >= x && config <= x2 && box2.y >= y && scope <= y2;
        if (input) list.push(box2.id);
      } else {
        const output = !(box2.x > x2 || config < x || box2.y > y2 || scope < y);
        if (output) list.push(box2.id);
      }
    }
    return (
      store.setSelectionMeta({ source: 'box' }),
      store.setSelectedNodes(list),
      store.setSelectionBox({ active: false }),
      (data.isBoxSelecting = false),
      { earlyReturn: false, didAct: true }
    );
  }
  return {
    startBoxSelecting: startBoxSelecting,
    updateBoxSelecting: updateBoxSelecting,
    finishBoxSelecting: finishBoxSelecting,
  };
}
