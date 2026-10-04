import { screenToWorld } from '../../core/math.js';
import { NODE_MANAGER_DRAG_MIME, hasNodeManagerDragType } from './nodeManagerDragContract.js';
const BLOCKED_DROP_TARGET_SELECTOR =
  '.node-manager-panel, .sidebar-floating, .header, .canvas-controls, [data-ui-stop="1"]';
function getStoreState(store) {
  return store?.['getStateRaw']?.() || store?.['getState']?.() || {};
}
function isPointInsideRect(value, item, box) {
  return (
    !!box && value >= box['left'] && value <= box['right'] && item >= box['top'] && item <= box['bottom']
  );
}
function isBlockedDropTarget(el) {
  return !!el?.['closest']?.(BLOCKED_DROP_TARGET_SELECTOR);
}
export function resolveNodeManagerDuplicateOffset({
  source: source,
  clientX: clientX,
  clientY: clientY,
  viewport: viewport,
} = {}) {
  const dx = screenToWorld(clientX, clientY, viewport || {}),
    key = (Number(source?.['x']) || 0x0) + (Number(source?.['width']) || 0x0) / 0x2,
    index = (Number(source?.['y']) || 0x0) + (Number(source?.['height']) || 0x0) / 0x2;
  return { dx: dx['x'] - key, dy: dx['y'] - index };
}
export function createNodeManagerDragController({
  graphStore: graphStore,
  wrap: wrap,
  canvasStage: canvasStage,
  executeCanvasCommand: executeCanvasCommand,
  onDuplicateFailed: onDuplicateFailed,
  onDuplicated: onDuplicated,
} = {}) {
  let enabled = '';
  const result = (event) => {
      if (!enabled && !hasNodeManagerDragType(event['dataTransfer'])) return;
      if (isBlockedDropTarget(event['target'])) return;
      const data = canvasStage?.['getBoundingClientRect']?.();
      if (!isPointInsideRect(event['clientX'], event['clientY'], data)) return;
      event['preventDefault']();
      if (event['dataTransfer']) event['dataTransfer']['dropEffect'] = 'copy';
    },
    options = (clientX2) => {
      const enabled2 = String(
        clientX2['dataTransfer']?.['getData']?.(NODE_MANAGER_DRAG_MIME) || enabled || '',
      )['trim']();
      if (!enabled2 || isBlockedDropTarget(clientX2['target'])) return;
      const target = canvasStage?.['getBoundingClientRect']?.();
      if (!isPointInsideRect(clientX2['clientX'], clientX2['clientY'], target)) return;
      const viewport2 = getStoreState(graphStore),
        source2 = viewport2['nodes']?.[enabled2];
      if (!source2) return;
      (clientX2['preventDefault'](), clientX2['stopPropagation']());
      const dx2 = resolveNodeManagerDuplicateOffset({
          source: source2,
          clientX: clientX2['clientX'],
          clientY: clientX2['clientY'],
          viewport: viewport2['viewport'],
        }),
        response = executeCanvasCommand?.('node.duplicate', {
          ids: [enabled2],
          dx: dx2['dx'],
          dy: dx2['dy'],
          edgePolicy: 'all-touching',
        });
      enabled = '';
      if (response?.['ok'] === ![]) {
        onDuplicateFailed?.(response);
        return;
      }
      const next = response?.['result']?.['ids']?.[0x0];
      if (next) onDuplicated?.(next);
    };
  return (
    wrap?.['addEventListener']?.('dragover', result),
    wrap?.['addEventListener']?.('drop', options),
    {
      bindNodeRow({ trigger: trigger, row: row, nodeId: nodeId } = {}) {
        if (!trigger) return;
        ((trigger['draggable'] = !![]),
          trigger['addEventListener']('dragstart', (current) => {
            ((enabled = nodeId),
              row?.['classList']?.['add']('is-dragging'),
              current['dataTransfer']?.['setData'](NODE_MANAGER_DRAG_MIME, nodeId));
            if (current['dataTransfer']) current['dataTransfer']['effectAllowed'] = 'copy';
          }),
          trigger['addEventListener']('dragend', () => {
            ((enabled = ''), row?.['classList']?.['remove']('is-dragging'));
          }));
      },
      destroy() {
        ((enabled = ''),
          wrap?.['removeEventListener']?.('dragover', result),
          wrap?.['removeEventListener']?.('drop', options));
      },
    }
  );
}
