const DEFAULT_RECENT_CREATION_GROUP_LIMIT = 8,
  DEFAULT_RECENT_CREATED_NODE_LIMIT = 12;
function normalizeId(value) {
  return String(value || '')['trim']();
}
export function buildAgentReferenceContext({
  canvas: canvas = {},
  operationLedger: operationLedger = [],
  creationGroupLimit: creationGroupLimit = DEFAULT_RECENT_CREATION_GROUP_LIMIT,
  createdNodeLimit: createdNodeLimit = DEFAULT_RECENT_CREATED_NODE_LIMIT,
} = {}) {
  const map = new Set(
      (Array['isArray'](canvas['nodes']) ? canvas['nodes'] : [])
        ['map']((item) => normalizeId(item?.['id'] || item?.['nodeId']))
        ['filter'](Boolean),
    ),
    recentCreatedNodeIds = [],
    recentCreationGroups = [],
    map2 = new Set(),
    list = Array['isArray'](operationLedger) ? operationLedger : [];
  for (let count = list['length'] - 1; count >= 0; count -= 1) {
    if (
      recentCreationGroups['length'] >= creationGroupLimit ||
      recentCreatedNodeIds['length'] >= createdNodeLimit
    )
      break;
    const response = list[count] || {};
    if (response['status'] !== 'success' || response['ok'] === ![]) continue;
    const nodeIds = (Array['isArray'](response['createdNodeIds']) ? response['createdNodeIds'] : [])
      ['map'](normalizeId)
      ['filter']((key) => key && map['has'](key) && !map2['has'](key))
      ['slice'](0, Math['max'](0, createdNodeLimit - recentCreatedNodeIds['length']));
    if (nodeIds['length'] === 0) continue;
    (nodeIds['forEach']((index) => map2['add'](index)),
      recentCreatedNodeIds['push'](...nodeIds),
      recentCreationGroups['push']({
        operationId: normalizeId(response['id'] || response['operationId']),
        runId: normalizeId(response['runId']),
        commandId: normalizeId(response['commandId']),
        nodeIds: nodeIds,
        completedAt: Number(response['completedAt'] || response['startedAt'] || 0),
      }));
  }
  return { recentCreatedNodeIds: recentCreatedNodeIds, recentCreationGroups: recentCreationGroups };
}
