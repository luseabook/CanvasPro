import { collectSelectedNodeExportItems } from '../nodeBatchExport.js';
import { createCanvasCommandError } from './commandRegistry.js';
import { normalizeNodeIds } from './graphCommands.js';
function getState(_0x493ca0) {
  return _0x493ca0['store']?.['getStateRaw']?.() || _0x493ca0['store']?.['getState']?.() || {};
}
function trimText(_0x1d6b1f) {
  return String(_0x1d6b1f || '')['trim']();
}
function firstNonEmpty(..._0x28fd42) {
  for (const _0x3703f6 of _0x28fd42) {
    const _0x345c7d = trimText(_0x3703f6);
    if (_0x345c7d) return _0x345c7d;
  }
  return '';
}
function getNodeExportApi(_0x1608ca = {}) {
  const _0x403000 =
    _0x1608ca['nodeExport'] || _0x1608ca['windowObject']?.['electronAPI']?.['nodeExport'] || null;
  return typeof _0x403000?.['exportSelected'] === 'function' ? _0x403000 : null;
}
function normalizeDestinationArgs(_0x4d52e1 = {}) {
  return {
    directory: firstNonEmpty(
      _0x4d52e1['directory'],
      _0x4d52e1['downloadDir'],
      _0x4d52e1['targetDir'],
      _0x4d52e1['destinationDirectory'],
    ),
    outputPath: firstNonEmpty(_0x4d52e1['outputPath'], _0x4d52e1['filePath'], _0x4d52e1['path']),
    filename: firstNonEmpty(_0x4d52e1['filename'], _0x4d52e1['fileName']),
  };
}
function normalizeExportItems(_0x4c866e = {}, _0x70b649 = {}) {
  const _0x496af0 = normalizeNodeIds(_0x4c866e, _0x70b649, { min: 0x1, allowSelection: !![] }),
    { items: _0x3239f7, skipped: _0x5b98f1 } = collectSelectedNodeExportItems({
      nodes: getState(_0x70b649)['nodes'] || {},
      selectedNodeIds: _0x496af0,
    });
  if (_0x3239f7['length'] <= 0x0)
    throw createCanvasCommandError(
      'NO_EXPORTABLE_ITEMS',
      'Selected canvas nodes do not contain exportable text or media.',
      { ids: _0x496af0, skipped: _0x5b98f1 },
    );
  return { ids: _0x496af0, items: _0x3239f7, skipped: _0x5b98f1 };
}
function mergeSkipped(..._0x541b46) {
  return _0x541b46['flatMap']((_0x23c7ed) => (Array['isArray'](_0x23c7ed) ? _0x23c7ed : []));
}
export function registerNodeExportCommands(_0x3183d5) {
  _0x3183d5['register']({
    id: 'node.exportSelected',
    description: 'Export selected canvas node outputs to a ZIP package.',
    riskLevel: 'confirm',
    argsSchema: {
      properties: {
        nodeId: { type: 'string' },
        ids: { type: 'array', items: { type: 'string' } },
        directory: { type: 'string' },
        outputPath: { type: 'string' },
        filename: { type: 'string' },
      },
      selectionFallback: !![],
    },
    capabilitySchema: {
      reads: ['nodes', 'selection'],
      writes: ['filesystem'],
      selectionFallback: !![],
      requiresSystemAccess: !![],
    },
    returnSchema: { aliasFields: ['path', 'filename', 'exportedCount', 'counts'] },
    validate(_0x1634f1 = {}, _0x41f132 = {}) {
      try {
        if (!getNodeExportApi(_0x41f132))
          return {
            ok: ![],
            errorCode: 'NODE_EXPORT_UNAVAILABLE',
            message: 'Node\x20export\x20is\x20unavailable\x20in\x20this\x20environment.',
          };
        const _0x5f55cd = normalizeExportItems(_0x1634f1, _0x41f132);
        return { args: { ...normalizeDestinationArgs(_0x1634f1), ..._0x5f55cd } };
      } catch (_0x18be04) {
        return {
          ok: ![],
          errorCode: _0x18be04['errorCode'] || 'INVALID_NODE_EXPORT_SELECTION',
          message: _0x18be04['message'],
          details: _0x18be04['details'],
        };
      }
    },
    async execute(_0x51e9ac, _0x27ce6e) {
      const _0x3a32eb = getNodeExportApi(_0x27ce6e);
      if (!_0x3a32eb)
        throw createCanvasCommandError(
          'NODE_EXPORT_UNAVAILABLE',
          'Node\x20export\x20is\x20unavailable\x20in\x20this\x20environment.',
        );
      const _0x2fde54 = await _0x3a32eb['exportSelected']({
        items: _0x51e9ac['items'] || [],
        directory: _0x51e9ac['directory'] || '',
        outputPath: _0x51e9ac['outputPath'] || '',
        filename: _0x51e9ac['filename'] || '',
      });
      if (_0x2fde54?.['canceled'])
        throw createCanvasCommandError('NODE_EXPORT_CANCELED', 'Node export was canceled.');
      if (_0x2fde54?.['success'] !== !![])
        throw createCanvasCommandError(
          _0x2fde54?.['code'] || 'NODE_EXPORT_FAILED',
          _0x2fde54?.['message'] || _0x2fde54?.['error'] || 'Node export failed.',
          _0x2fde54,
        );
      return {
        ..._0x2fde54,
        ids: _0x51e9ac['ids'] || [],
        skipped: mergeSkipped(_0x51e9ac['skipped'], _0x2fde54['skipped']),
      };
    },
  });
}
