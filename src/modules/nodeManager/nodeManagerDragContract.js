export const NODE_MANAGER_DRAG_MIME = 'application/x-aicanvas-node-id';
export function hasNodeManagerDragType(value) {
  return Array['from'](value?.['types'] || [])['includes'](NODE_MANAGER_DRAG_MIME);
}
