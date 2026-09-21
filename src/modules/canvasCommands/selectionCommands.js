import { normalizeNodeIds } from './graphCommands.js';
function getState(_0x205c88) {
  return _0x205c88.store?.getStateRaw?.() || _0x205c88.store?.getState?.() || {};
}
export function registerSelectionCommands(_0x23fde8) {
  (_0x23fde8.register({
    id: 'node.select',
    description: 'Select canvas nodes.',
    riskLevel: 'safe',
    argsSchema: {
      required: ['ids'],
      properties: { ids: { type: 'array', items: { type: 'string' } }, nodeId: { type: 'string' } },
    },
    capabilitySchema: { reads: ['nodes'], writes: ['selection'] },
    returnSchema: { aliasFields: ['ids'] },
    validate(_0x58aa07 = {}, _0x7f70fb = {}) {
      try {
        return { args: { ids: normalizeNodeIds(_0x58aa07, _0x7f70fb, { min: 1, allowSelection: false }) } };
      } catch (_0x5abb1c) {
        return {
          ok: false,
          errorCode: _0x5abb1c.errorCode || 'INVALID_NODE_SELECTION',
          message: _0x5abb1c.message,
          details: _0x5abb1c.details,
        };
      }
    },
    execute(_0x95fabf, _0x22685b) {
      return (_0x22685b.store?.setSelectedNodes?.(_0x95fabf.ids), { ids: _0x95fabf.ids });
    },
  }),
    _0x23fde8.register({
      id: 'graph.getSelection',
      description: 'Get selected canvas nodes.',
      riskLevel: 'safe',
      argsSchema: {},
      capabilitySchema: { reads: ['selection', 'nodes'], writes: [] },
      returnSchema: { aliasFields: ['selectedNodeIds', 'nodes'] },
      execute(_0x20be02, _0x4d913d) {
        const _0x1b685d = getState(_0x4d913d),
          _0x5ee422 = Array.isArray(_0x1b685d.selectedNodeIds) ? [..._0x1b685d.selectedNodeIds] : [];
        return {
          selectedNodeIds: _0x5ee422,
          nodes: _0x5ee422
            .map((_0x29a419) => _0x1b685d.nodes?.[_0x29a419])
            .filter(Boolean)
            .map((_0x3715c4) => ({
              id: String(_0x3715c4.id || ''),
              type: String(_0x3715c4.type || ''),
              name: String(_0x3715c4.name || ''),
            })),
        };
      },
    }));
}
