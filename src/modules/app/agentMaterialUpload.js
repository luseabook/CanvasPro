export function createAgentMaterialUploader({
  canvasNodeFlows: canvasNodeFlows,
  graphStore: graphStore,
  getBaseName: getBaseName,
} = {}) {
  return async function run(error) {
    if (!error?.type) return null;
    const enabled = await canvasNodeFlows?.createMediaNodeFromBlob?.(error, error.type, {
      placement: 'viewport-center-sequence',
      sequenceKey: 'agent-upload',
      name: getBaseName?.(error.name) || error.name || '',
    });
    if (!enabled) return null;
    const state = graphStore?.getState?.() || graphStore?.getStateRaw?.() || {},
      list = Array.isArray(state.selectedNodeIds) ? state.selectedNodeIds : [],
      value = list[list.length - 1] || '';
    return value ? state.nodes?.[value] || null : null;
  };
}
