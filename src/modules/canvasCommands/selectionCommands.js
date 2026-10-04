import { normalizeNodeIds } from './graphCommands.js';
function getState(value) {
  return value.store?.getStateRaw?.() || value.store?.getState?.() || {};
}
export function registerSelectionCommands(item) {
  (item.register({
    id: 'node.select',
    description: 'Select canvas nodes.',
    riskLevel: 'safe',
    argsSchema: {
      required: ['ids'],
      properties: { ids: { type: 'array', items: { type: 'string' } }, nodeId: { type: 'string' } },
    },
    capabilitySchema: { reads: ['nodes'], writes: ['selection'] },
    returnSchema: { aliasFields: ['ids'] },
    validate(options = {}, key = {}) {
      try {
        return { args: { ids: normalizeNodeIds(options, key, { min: 1, allowSelection: false }) } };
      } catch (errorCode) {
        return {
          ok: false,
          errorCode: errorCode.errorCode || 'INVALID_NODE_SELECTION',
          message: errorCode.message,
          details: errorCode.details,
        };
      }
    },
    execute(ids, index) {
      return (index.store?.setSelectedNodes?.(ids.ids), { ids: ids.ids });
    },
  }),
    item.register({
      id: 'graph.getSelection',
      description: 'Get selected canvas nodes.',
      riskLevel: 'safe',
      argsSchema: {},
      capabilitySchema: { reads: ['selection', 'nodes'], writes: [] },
      returnSchema: { aliasFields: ['selectedNodeIds', 'nodes'] },
      execute(result, data) {
        const args = getState(data),
          selectedNodeIds = Array.isArray(args.selectedNodeIds) ? [...args.selectedNodeIds] : [];
        return {
          selectedNodeIds: selectedNodeIds,
          nodes: selectedNodeIds
            .map((item2) => args.nodes?.[item2])
            .filter(Boolean)
            .map((error) => ({
              id: String(error.id || ''),
              type: String(error.type || ''),
              name: String(error.name || ''),
            })),
        };
      },
    }));
}
