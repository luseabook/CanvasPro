export function isGroupNodeData(value) {
  return String(value?.type || '').trim() === 'group';
}
export function wouldCreateGroupOutputCycle({
  sourceId: sourceId,
  targetId: targetId,
  nodes: nodes,
  edges: edges,
} = {}) {
  const enabled = String(sourceId || '').trim(),
    enabled2 = String(targetId || '').trim();
  if (!enabled || !enabled2) return false;
  if (enabled === enabled2) return true;
  if (!isGroupNodeData(nodes?.[enabled])) return false;
  if (!isGroupNodeData(nodes?.[enabled2])) return false;
  const list = [enabled2],
    map = new Set();
  while (list.length > 0) {
    const enabled3 = list.shift();
    if (!enabled3 || map.has(enabled3)) continue;
    map.add(enabled3);
    if (enabled3 === enabled) return true;
    for (const enabled4 of Object.values(edges || {})) {
      if (!enabled4 || String(enabled4.sourceId || '') !== enabled3) continue;
      const item = String(enabled4.targetId || '').trim();
      if (!isGroupNodeData(nodes?.[item])) continue;
      if (item === enabled) return true;
      if (!map.has(item)) list.push(item);
    }
  }
  return false;
}
export function getDirectGroupChildNodes(key, index) {
  const enabled5 = String(index || '');
  if (!enabled5) return [];
  return Object.values(key || {}).filter((enabled6) => {
    if (!enabled6 || String(enabled6.id || '') === enabled5) return false;
    if (String(enabled6.parentId || '') !== enabled5) return false;
    return !isGroupNodeData(enabled6);
  });
}
export function buildGroupOutputMembershipSignature(result, data) {
  if (!isGroupNodeData(result)) return '';
  return getDirectGroupChildNodes(data, result.id)
    .map((item2) => {
      const options = typeof item2?._bizRev === 'number' ? item2._bizRev : 0;
      return (item2.id || '') + ':' + options;
    })
    .join('|');
}
function sortGroupChildrenBySavedOutputOrder(list2, list3) {
  if (!Array.isArray(list3) || list3.length === 0) return list2;
  const map2 = new Map();
  list3.forEach((item3, target) => {
    const source = String(item3 || '').trim();
    source && !map2.has(source) && map2.set(source, target);
  });
  if (map2.size === 0) return list2;
  return list2
    .map((node, index2) => ({ node: node, index: index2 }))
    .sort((item4, next) => {
      const current = map2.has(item4.node?.id) ? map2.get(item4.node.id) : Infinity,
        entry = map2.has(next.node?.id) ? map2.get(next.node.id) : Infinity;
      if (current !== entry) return current - entry;
      return item4.index - next.index;
    })
    .map((item5) => item5.node);
}
export function resolveGroupOutputSourceOrder(record, payload) {
  const handle = String(payload || '').trim(),
    state = record?.groupOutputSourceOrderByTarget;
  if (handle && state && typeof state === 'object' && !Array.isArray(state) && Array.isArray(state[handle]))
    return state[handle];
  const config = String(record?.targetId || '').trim();
  if (handle && config && config !== handle) return [];
  return record?.groupOutputSourceOrder;
}
export function collectGroupOutputIncomingEdges({
  edge: edge,
  groupNode: groupNode,
  nodes: nodes2,
  targetId: targetId2,
  policy: policy,
  counts: counts,
  directSourceIds: directSourceIds,
  acceptSource: acceptSource,
  canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
  reserveInputSlot: reserveInputSlot = null,
}) {
  const outputGroupId = String(groupNode?.id || edge?.sourceId || ''),
    list4 = [],
    sortGroupChildrenBySavedOutputOrder2 = sortGroupChildrenBySavedOutputOrder(
      getDirectGroupChildNodes(nodes2, outputGroupId),
      resolveGroupOutputSourceOrder(edge, targetId2),
    );
  for (const sourceId2 of sortGroupChildrenBySavedOutputOrder2) {
    if (!sourceId2?.id || sourceId2.id === targetId2) continue;
    const enabled7 = acceptSource(sourceId2, edge);
    if (!enabled7 || directSourceIds.has(sourceId2.id)) continue;
    if (!canAppendInputKindWithinLimit(policy, enabled7, counts)) continue;
    let refSlot = '';
    if (typeof reserveInputSlot === 'function') {
      const scope = { ...edge, refSlot: '', sourceId: sourceId2.id },
        reserveInputSlot2 = reserveInputSlot(enabled7, scope);
      if (!reserveInputSlot2) continue;
      if (typeof reserveInputSlot2 === 'string') refSlot = reserveInputSlot2;
    }
    (list4.push({
      ...edge,
      id: edge.id + '::group-output::' + sourceId2.id,
      sourceId: sourceId2.id,
      ...(refSlot ? { refSlot: refSlot } : null),
      isGroupOutput: true,
      outputGroupId: outputGroupId,
      groupOutputEdgeId: edge.id,
      effectiveTargetId: targetId2,
    }),
      directSourceIds.add(sourceId2.id),
      (counts[enabled7] = (counts[enabled7] || 0) + 1));
  }
  return list4;
}
