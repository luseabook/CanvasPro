const GRAPH_STATE_KEYS = Object.freeze([
    'viewport',
    'nodes',
    '_nodeCount',
    '_persistRev',
    '_edgesRev',
    '_parentToChildren',
    'edges',
    'selectionBox',
    'selectionMeta',
    'selectedNodeIds',
    'connOverlay',
  ]),
  UI_STATE_KEYS = Object.freeze([
    'isServerConnected',
    'picker',
    'contextMenu',
    'pickConnectMode',
    'annotate',
    'matting',
    'videoKeying',
    'videoClip',
    'theme',
    'ui',
  ]),
  WORKSPACE_STATE_KEYS = Object.freeze([
    'subscription',
    'modelCatalog',
    'assets',
    'storyboard3dProjects',
    'workflows',
    'workflowUi',
  ]);
function pickStateKeys(enabled, value) {
  if (!enabled || typeof enabled !== 'object') return {};
  const item = {};
  for (const key of value) {
    Object.prototype.hasOwnProperty.call(enabled, key) && (item[key] = enabled[key]);
  }
  return item;
}
function selectGraphState(index) {
  return pickStateKeys(index, GRAPH_STATE_KEYS);
}
function selectUiState(result) {
  return pickStateKeys(result, UI_STATE_KEYS);
}
function selectWorkspaceState(data) {
  return pickStateKeys(data, WORKSPACE_STATE_KEYS);
}
export {
  GRAPH_STATE_KEYS,
  UI_STATE_KEYS,
  WORKSPACE_STATE_KEYS,
  selectGraphState,
  selectUiState,
  selectWorkspaceState,
};
