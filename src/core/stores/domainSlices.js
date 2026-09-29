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
function pickStateKeys(_0x2d9ef3, _0x24d01a) {
  if (!_0x2d9ef3 || typeof _0x2d9ef3 !== 'object') return {};
  const _0x260614 = {};
  for (const _0x4c9194 of _0x24d01a) {
    Object.prototype.hasOwnProperty.call(_0x2d9ef3, _0x4c9194) &&
      (_0x260614[_0x4c9194] = _0x2d9ef3[_0x4c9194]);
  }
  return _0x260614;
}
function selectGraphState(_0x3e27f8) {
  return pickStateKeys(_0x3e27f8, GRAPH_STATE_KEYS);
}
function selectUiState(_0x301c21) {
  return pickStateKeys(_0x301c21, UI_STATE_KEYS);
}
function selectWorkspaceState(_0xceec13) {
  return pickStateKeys(_0xceec13, WORKSPACE_STATE_KEYS);
}
export {
  GRAPH_STATE_KEYS,
  UI_STATE_KEYS,
  WORKSPACE_STATE_KEYS,
  selectGraphState,
  selectUiState,
  selectWorkspaceState,
};
