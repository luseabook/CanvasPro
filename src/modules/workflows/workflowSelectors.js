import { t } from '../../i18n/index.js';
function text(_0x387378) {
  return String(_0x387378 ?? '').trim();
}
function workflowSelectorText(_0x4ded88, _0x2d86b3 = {}) {
  return t('workflows.selectors.' + _0x4ded88, _0x2d86b3);
}
function timestamp(_0x4a2b72) {
  const _0x4a8002 = Number(_0x4a2b72);
  return Number.isFinite(_0x4a8002) ? _0x4a8002 : 0;
}
export function normalizeWorkflowEntity(_0x50e108) {
  if (!_0x50e108 || typeof _0x50e108 !== 'object') return null;
  const { scope: _0x590914, ..._0x1d4fe3 } = _0x50e108,
    _0x559e8f = text(_0x50e108.id);
  if (!_0x559e8f) return null;
  const _0x5d42c2 =
      _0x50e108.workflowData && typeof _0x50e108.workflowData === 'object' ? _0x50e108.workflowData : {},
    _0x5f3651 = Array.isArray(_0x5d42c2.nodes) ? _0x5d42c2.nodes : [],
    _0x172b79 = Array.isArray(_0x5d42c2.edges) ? _0x5d42c2.edges : [];
  return {
    ..._0x1d4fe3,
    id: _0x559e8f,
    name: text(_0x50e108.name) || workflowSelectorText('unnamedWorkflow'),
    cover: text(_0x50e108.cover || _0x50e108.coverUrl),
    tags: Array.isArray(_0x50e108.tags) ? _0x50e108.tags.map(text).filter(Boolean) : [],
    note: text(_0x50e108.note),
    createdAt: timestamp(_0x50e108.createdAt || _0x50e108.updatedAt || Date.now()),
    updatedAt: timestamp(_0x50e108.updatedAt || _0x50e108.createdAt || Date.now()),
    lastUsedAt: _0x50e108.lastUsedAt == null ? undefined : timestamp(_0x50e108.lastUsedAt),
    nodeCount: Number.isFinite(Number(_0x50e108.nodeCount)) ? Number(_0x50e108.nodeCount) : _0x5f3651.length,
    edgeCount: Number.isFinite(Number(_0x50e108.edgeCount)) ? Number(_0x50e108.edgeCount) : _0x172b79.length,
    version: Number.isFinite(Number(_0x50e108.version)) ? Number(_0x50e108.version) : 1,
    workflowData: {
      nodes: _0x5f3651,
      edges: _0x172b79,
      viewport:
        _0x5d42c2.viewport && typeof _0x5d42c2.viewport === 'object' ? { ..._0x5d42c2.viewport } : undefined,
    },
  };
}
export function normalizeWorkflowList(_0x2ae768) {
  if (!Array.isArray(_0x2ae768)) return [];
  return _0x2ae768.map(normalizeWorkflowEntity).filter(Boolean);
}
export function sortWorkflows(_0x23d98b) {
  const _0x4a85ef = normalizeWorkflowList(_0x23d98b);
  return (
    _0x4a85ef.sort((_0x353e09, _0x3c4539) => {
      return timestamp(_0x3c4539?.updatedAt) - timestamp(_0x353e09?.updatedAt);
    }),
    _0x4a85ef
  );
}
export function filterWorkflows(_0x535bfc, _0x3de9cd = '') {
  const _0x182b95 = text(_0x3de9cd).toLowerCase(),
    _0x24d357 = normalizeWorkflowList(_0x535bfc),
    _0x243fe2 = _0x182b95
      ? _0x24d357.filter((_0xcef96b) => {
          const _0x56db29 = [
            _0xcef96b.name,
            _0xcef96b.note,
            ...(Array.isArray(_0xcef96b.tags) ? _0xcef96b.tags : []),
          ]
            .map((_0x5579d9) => String(_0x5579d9 || '').toLowerCase())
            .join(' ');
          return _0x56db29.includes(_0x182b95);
        })
      : _0x24d357;
  return sortWorkflows(_0x243fe2);
}
export function findWorkflowById(_0x105eb5, _0x488282) {
  const _0x224f8d = text(_0x488282);
  if (!_0x224f8d) return null;
  return normalizeWorkflowList(_0x105eb5).find((_0x459e01) => _0x459e01.id === _0x224f8d) || null;
}
