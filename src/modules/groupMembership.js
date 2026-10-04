function cleanText(value) {
  return String(value ?? '').trim();
}
function normalizeNodeList(item) {
  return Array.isArray(item) ? item : item && typeof item === 'object' ? Object.values(item) : [];
}
function isGroupNode(key) {
  return cleanText(key?.type).toLowerCase() === 'group';
}
function nodeSize(box) {
  const isGroupNode2 = isGroupNode(box);
  return {
    width: Number(box?.width ?? box?.w) || (isGroupNode2 ? 0x190 : 0x104),
    height: Number(box?.height ?? box?.h) || (isGroupNode2 ? 0x12c : 100),
  };
}
function isNodeContainedInGroup(box2, box3) {
  if (!box2 || !box3) return false;
  const box4 = nodeSize(box2),
    box5 = nodeSize(box3),
    index = Number(box2.x) || 0,
    result = Number(box2.y) || 0,
    data = Number(box3.x) || 0,
    options = Number(box3.y) || 0;
  return (
    index >= data &&
    result >= options &&
    index + box4.width <= data + box5.width &&
    result + box4.height <= options + box5.height
  );
}
function findContainingGroup(target, source) {
  for (const next of source) {
    if (isNodeContainedInGroup(target, next)) return cleanText(next.id);
  }
  return null;
}
export function collectGroupContainmentReparentOps(current, list) {
  const list2 = normalizeNodeList(current).filter(Boolean),
    map = new Map(list2.map((item2) => [cleanText(item2?.id), item2]).filter(([entry]) => entry)),
    record = Array.isArray(list) ? list.map(cleanText).filter(Boolean) : [],
    payload = list2.filter(isGroupNode),
    list3 = [];
  for (const nodeId of record) {
    const enabled = map.get(nodeId);
    if (!enabled) continue;
    if (!isGroupNode(enabled)) {
      const parentId = findContainingGroup(enabled, payload);
      (enabled.parentId || null) !== (parentId || null) && list3.push({ nodeId: nodeId, parentId: parentId });
      continue;
    }
    for (const handle of list2) {
      if (isGroupNode(handle)) continue;
      const nodeId2 = cleanText(handle?.id);
      if (!nodeId2) continue;
      const isNodeContainedInGroup2 = isNodeContainedInGroup(handle, enabled);
      if (isNodeContainedInGroup2 && handle.parentId !== nodeId)
        list3.push({ nodeId: nodeId2, parentId: nodeId });
      else
        !isNodeContainedInGroup2 &&
          handle.parentId === nodeId &&
          list3.push({ nodeId: nodeId2, parentId: null });
    }
  }
  return list3;
}
