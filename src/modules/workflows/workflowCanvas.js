import { generateId } from '../../core/math.js';
import { t } from '../../i18n/index.js';
export const WORKFLOW_LIMITS = { nameMax: 50, tagMax: 5, tagLengthMax: 12, noteMax: 0x12c };
function deepClone(value) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(value);
    } catch {}
  return JSON.parse(JSON.stringify(value));
}
function cleanText(item, key = Infinity) {
  const list = String(item ?? '').trim();
  if (!Number.isFinite(key)) return list;
  return list.slice(0, key);
}
function workflowCanvasText(index, result = {}) {
  return t('workflows.canvas.' + index, result);
}
export function normalizeWorkflowTags(data) {
  const options = Array.isArray(data) ? data : [],
    map = new Set(),
    list2 = [];
  for (const target of options) {
    const cleanText2 = cleanText(target, WORKFLOW_LIMITS.tagLengthMax);
    if (!cleanText2) continue;
    const source = cleanText2.toLowerCase();
    if (map.has(source)) continue;
    (map.add(source), list2.push(cleanText2));
    if (list2.length >= WORKFLOW_LIMITS.tagMax) break;
  }
  return list2;
}
export function normalizeWorkflowMeta(error = {}, error2 = {}) {
  const name = cleanText(error.name ?? error2.name, WORKFLOW_LIMITS.nameMax),
    note = cleanText(error.note ?? error2.note, WORKFLOW_LIMITS.noteMax);
  return {
    name: name,
    cover: cleanText(error.cover ?? error2.cover),
    tags: normalizeWorkflowTags(error.tags ?? error2.tags),
    note: note,
  };
}
function requireWorkflowName(next) {
  if (!cleanText(next)) throw new Error(workflowCanvasText('workflowNameRequired'));
}
function normalizeCanvasState(current) {
  const viewport = current && typeof current === 'object' ? current : {};
  return {
    nodes: Array.isArray(viewport.nodes) ? deepClone(viewport.nodes) : [],
    edges: Array.isArray(viewport.edges) ? deepClone(viewport.edges) : [],
    viewport:
      viewport.viewport && typeof viewport.viewport === 'object' ? { ...viewport.viewport } : undefined,
  };
}
function isGroupNode(entry) {
  return cleanText(entry?.type).toLowerCase() === 'group';
}
function isRootNode(record) {
  return !cleanText(record?.parentId);
}
function syncSingleRootGroupName(nodes, payload) {
  const name2 = cleanText(payload, WORKFLOW_LIMITS.nameMax);
  if (!name2 || !Array.isArray(nodes?.nodes)) return nodes;
  const list3 = nodes.nodes.filter((item2) => isGroupNode(item2) && isRootNode(item2));
  if (list3.length !== 1) return nodes;
  return {
    ...nodes,
    nodes: nodes.nodes.map((args) => (args === list3[0] ? { ...args, name: name2 } : args)),
  };
}
function edgeSourceId(handle) {
  return String(handle?.sourceId ?? handle?.source ?? '').trim();
}
function edgeTargetId(event) {
  return String(event?.targetId ?? event?.target ?? '').trim();
}
function normalizeNodeRecord(list4) {
  if (!list4 || typeof list4 !== 'object') return {};
  if (Array.isArray(list4))
    return list4.reduce((item3, state) => {
      const cleanText3 = cleanText(state?.id);
      if (cleanText3) item3[cleanText3] = state;
      return item3;
    }, {});
  return list4;
}
export function collectWorkflowGroupNodeIds(config, scope) {
  const cleanText4 = cleanText(scope);
  if (!cleanText4) return new Set();
  const nodeRecord = normalizeNodeRecord(config);
  if (!nodeRecord[cleanText4]) return new Set();
  const map2 = new Set([cleanText4]),
    list5 = [cleanText4];
  while (list5.length > 0) {
    const input = list5.pop();
    for (const output of Object.values(nodeRecord)) {
      const cleanText5 = cleanText(output?.id);
      if (!cleanText5 || map2.has(cleanText5)) continue;
      if (cleanText(output?.parentId) !== input) continue;
      (map2.add(cleanText5), list5.push(cleanText5));
    }
  }
  return map2;
}
export function sliceCanvasStateForWorkflow(value2, value3, value4) {
  const args2 = normalizeCanvasState(value2),
    cleanText6 = cleanText(value4);
  if (!cleanText6) return args2;
  const map3 = collectWorkflowGroupNodeIds(value3, cleanText6);
  if (map3.size === 0) return { ...args2, nodes: [], edges: [] };
  const nodes2 = args2.nodes.filter((item4) => map3.has(cleanText(item4?.id))),
    map4 = new Set(nodes2.map((item5) => cleanText(item5?.id)).filter(Boolean)),
    edges = args2.edges.filter((item6) => {
      const edgeSourceId2 = edgeSourceId(item6),
        edgeTargetId2 = edgeTargetId(item6);
      return map4.has(edgeSourceId2) && map4.has(edgeTargetId2);
    });
  return { ...args2, nodes: nodes2, edges: edges };
}
export function createWorkflowFromCanvas(value5, lastUsedAt = {}) {
  const updatedAt = Date.now(),
    name3 = normalizeWorkflowMeta(lastUsedAt);
  requireWorkflowName(name3.name);
  const nodeCount = syncSingleRootGroupName(normalizeCanvasState(value5), name3.name);
  return {
    id: cleanText(lastUsedAt.id) || generateId('workflow'),
    name: name3.name,
    cover: name3.cover,
    tags: name3.tags,
    note: name3.note,
    createdAt: Number.isFinite(Number(lastUsedAt.createdAt)) ? Number(lastUsedAt.createdAt) : updatedAt,
    updatedAt: updatedAt,
    lastUsedAt:
      lastUsedAt.lastUsedAt == null || !Number.isFinite(Number(lastUsedAt.lastUsedAt))
        ? undefined
        : Number(lastUsedAt.lastUsedAt),
    nodeCount: nodeCount.nodes.length,
    edgeCount: nodeCount.edges.length,
    version: 1,
    workflowData: nodeCount,
  };
}
export function updateWorkflowFromCanvas(value6, value7, value8 = {}) {
  const lastUsedAt2 = value8.existingWorkflow || {},
    id = cleanText(value6 || lastUsedAt2.id || value8.id);
  if (!id) throw new Error(workflowCanvasText('missingUpdateWorkflowId'));
  const name4 = normalizeWorkflowMeta(value8, lastUsedAt2);
  requireWorkflowName(name4.name);
  const nodeCount2 = syncSingleRootGroupName(normalizeCanvasState(value7), name4.name);
  return {
    ...lastUsedAt2,
    id: id,
    name: name4.name,
    cover: name4.cover,
    tags: name4.tags,
    note: name4.note,
    createdAt: Number.isFinite(Number(lastUsedAt2.createdAt)) ? Number(lastUsedAt2.createdAt) : Date.now(),
    updatedAt: Date.now(),
    lastUsedAt: lastUsedAt2.lastUsedAt,
    nodeCount: nodeCount2.nodes.length,
    edgeCount: nodeCount2.edges.length,
    version: Number.isFinite(Number(lastUsedAt2.version)) ? Number(lastUsedAt2.version) : 1,
    workflowData: nodeCount2,
  };
}
export function calcWorkflowBounds(value9) {
  const value10 = Array.isArray(value9) ? value9 : [];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const box of value10) {
    if (!box) continue;
    const value11 = Number(box.x) || 0,
      value12 = Number(box.y) || 0,
      value13 = Number(box.width ?? box.w) || 100,
      value14 = Number(box.height ?? box.h) || 100;
    ((minX = Math.min(minX, value11)),
      (minY = Math.min(minY, value12)),
      (maxX = Math.max(maxX, value11 + value13)),
      (maxY = Math.max(maxY, value12 + value14)));
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY))
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, cx: 0, cy: 0 };
  const width = Math.max(0, maxX - minX),
    height = Math.max(0, maxY - minY);
  return {
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY,
    width: width,
    height: height,
    cx: minX + width / 2,
    cy: minY + height / 2,
  };
}
export function calcWorkflowCenterOffset(value15, box2) {
  const dx = { x: Number(box2?.x) || 0, y: Number(box2?.y) || 0 },
    calcWorkflowBounds2 = calcWorkflowBounds(value15);
  return { dx: dx.x - calcWorkflowBounds2.cx, dy: dx.y - calcWorkflowBounds2.cy };
}
export function remapWorkflowNodeIds(value16, value17) {
  const list6 = Array.isArray(value16) ? value16 : [],
    value18 = Array.isArray(value17) ? value17 : [],
    idMap = {},
    nodes3 = list6
      .filter((item7) => item7 && typeof item7 === 'object' && cleanText(item7.id))
      .map((item8) => {
        const deepClone2 = deepClone(item8),
          cleanText7 = cleanText(deepClone2.id),
          generateId2 = generateId(cleanText(deepClone2.type) || 'node');
        return ((idMap[cleanText7] = generateId2), (deepClone2.id = generateId2), deepClone2);
      });
  for (const value19 of nodes3) {
    const cleanText8 = cleanText(value19.parentId);
    if (!cleanText8) {
      value19.parentId = value19.parentId == null ? null : value19.parentId;
      continue;
    }
    value19.parentId = idMap[cleanText8] || null;
  }
  const edges2 = [];
  for (const enabled of value18) {
    if (!enabled || typeof enabled !== 'object') continue;
    const edgeSourceId3 = edgeSourceId(enabled),
      edgeTargetId3 = edgeTargetId(enabled),
      enabled2 = idMap[edgeSourceId3],
      enabled3 = idMap[edgeTargetId3];
    if (!enabled2 || !enabled3) continue;
    const event2 = deepClone(enabled);
    ((event2.id = generateId('edge')),
      (event2.sourceId = enabled2),
      (event2.targetId = enabled3),
      Object.prototype.hasOwnProperty.call(event2, 'source') && (event2.source = enabled2),
      Object.prototype.hasOwnProperty.call(event2, 'target') && (event2.target = enabled3),
      edges2.push(event2));
  }
  return { nodes: nodes3, edges: edges2, idMap: idMap };
}
export function applyWorkflowToCanvas(error3, value20) {
  const value21 = error3?.workflowData && typeof error3.workflowData === 'object' ? error3.workflowData : {},
    syncSingleRootGroupName2 = syncSingleRootGroupName(value21, error3?.name),
    {
      nodes: nodes4,
      edges: edges3,
      idMap: idMap2,
    } = remapWorkflowNodeIds(syncSingleRootGroupName2.nodes, syncSingleRootGroupName2.edges),
    value22 = value20?.center || value20 || { x: 0, y: 0 },
    { dx: dx2, dy: dy } = calcWorkflowCenterOffset(nodes4, value22),
    nodes5 = nodes4.map((box3) => ({
      ...box3,
      x: (Number(box3.x) || 0) + dx2,
      y: (Number(box3.y) || 0) + dy,
    }));
  return { nodes: nodes5, edges: edges3, idMap: idMap2, dx: dx2, dy: dy };
}
