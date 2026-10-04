import { t } from '../../i18n/index.js';
function text(value) {
  return String(value ?? '').trim();
}
function workflowSelectorText(item, key = {}) {
  return t('workflows.selectors.' + item, key);
}
function timestamp(index) {
  const result = Number(index);
  return Number.isFinite(result) ? result : 0;
}
export function normalizeWorkflowEntity(lastUsedAt) {
  if (!lastUsedAt || typeof lastUsedAt !== 'object') return null;
  const { scope: scope, ...args } = lastUsedAt,
    id = text(lastUsedAt.id);
  if (!id) return null;
  const viewport =
      lastUsedAt.workflowData && typeof lastUsedAt.workflowData === 'object' ? lastUsedAt.workflowData : {},
    nodes = Array.isArray(viewport.nodes) ? viewport.nodes : [],
    edges = Array.isArray(viewport.edges) ? viewport.edges : [];
  return {
    ...args,
    id: id,
    name: text(lastUsedAt.name) || workflowSelectorText('unnamedWorkflow'),
    cover: text(lastUsedAt.cover || lastUsedAt.coverUrl),
    tags: Array.isArray(lastUsedAt.tags) ? lastUsedAt.tags.map(text).filter(Boolean) : [],
    note: text(lastUsedAt.note),
    createdAt: timestamp(lastUsedAt.createdAt || lastUsedAt.updatedAt || Date.now()),
    updatedAt: timestamp(lastUsedAt.updatedAt || lastUsedAt.createdAt || Date.now()),
    lastUsedAt: lastUsedAt.lastUsedAt == null ? undefined : timestamp(lastUsedAt.lastUsedAt),
    nodeCount: Number.isFinite(Number(lastUsedAt.nodeCount)) ? Number(lastUsedAt.nodeCount) : nodes.length,
    edgeCount: Number.isFinite(Number(lastUsedAt.edgeCount)) ? Number(lastUsedAt.edgeCount) : edges.length,
    version: Number.isFinite(Number(lastUsedAt.version)) ? Number(lastUsedAt.version) : 1,
    workflowData: {
      nodes: nodes,
      edges: edges,
      viewport:
        viewport.viewport && typeof viewport.viewport === 'object' ? { ...viewport.viewport } : undefined,
    },
  };
}
export function normalizeWorkflowList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeWorkflowEntity).filter(Boolean);
}
export function sortWorkflows(data) {
  const list2 = normalizeWorkflowList(data);
  return (
    list2.sort((item2, options) => {
      return timestamp(options?.updatedAt) - timestamp(item2?.updatedAt);
    }),
    list2
  );
}
export function filterWorkflows(target, source = '') {
  const text2 = text(source).toLowerCase(),
    list3 = normalizeWorkflowList(target),
    next = text2
      ? list3.filter((error) => {
          const list4 = [error.name, error.note, ...(Array.isArray(error.tags) ? error.tags : [])]
            .map((item3) => String(item3 || '').toLowerCase())
            .join(' ');
          return list4.includes(text2);
        })
      : list3;
  return sortWorkflows(next);
}
export function findWorkflowById(current, entry) {
  const text3 = text(entry);
  if (!text3) return null;
  return normalizeWorkflowList(current).find((item4) => item4.id === text3) || null;
}
