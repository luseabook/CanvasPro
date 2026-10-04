export const NODE_MANAGER_PLACEMENTS = Object['freeze'](['left', 'right', 'bottom']);
export const DEFAULT_NODE_MANAGER_PLACEMENT = 'left';
export const NODE_MANAGER_PLACEMENT_EVENT = 'node-manager-placement-changed';
const NODE_MANAGER_PLACEMENT_SET = new Set(NODE_MANAGER_PLACEMENTS);
export function normalizeNodeManagerPlacement(value) {
  return NODE_MANAGER_PLACEMENT_SET['has'](value) ? value : DEFAULT_NODE_MANAGER_PLACEMENT;
}
