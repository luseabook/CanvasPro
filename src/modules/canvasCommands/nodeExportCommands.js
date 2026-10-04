import { collectSelectedNodeExportItems } from '../nodeBatchExport.js';
import { createCanvasCommandError } from './commandRegistry.js';
import { normalizeNodeIds } from './graphCommands.js';
function getState(context) {
  return context['store']?.['getStateRaw']?.() || context['store']?.['getState']?.() || {};
}
function trimText(value) {
  return String(value || '')['trim']();
}
function firstNonEmpty(...candidates) {
  for (const candidate of candidates) {
    const normalized = trimText(candidate);
    if (normalized) return normalized;
  }
  return '';
}
function getNodeExportApi(context = {}) {
  const api = context['nodeExport'] || context['windowObject']?.['electronAPI']?.['nodeExport'] || null;
  return typeof api?.['exportSelected'] === 'function' ? api : null;
}
function normalizeDestinationArgs(args = {}) {
  return {
    directory: firstNonEmpty(
      args['directory'],
      args['downloadDir'],
      args['targetDir'],
      args['destinationDirectory'],
    ),
    outputPath: firstNonEmpty(args['outputPath'], args['filePath'], args['path']),
    filename: firstNonEmpty(args['filename'], args['fileName']),
  };
}
function normalizeExportItems(args = {}, context = {}) {
  const ids = normalizeNodeIds(args, context, { min: 0x1, allowSelection: !![] }),
    { items: items, skipped: skipped } = collectSelectedNodeExportItems({
      nodes: getState(context)['nodes'] || {},
      selectedNodeIds: ids,
    });
  if (items['length'] <= 0x0)
    throw createCanvasCommandError(
      'NO_EXPORTABLE_ITEMS',
      'Selected canvas nodes do not contain exportable text or media.',
      { ids: ids, skipped: skipped },
    );
  return { ids: ids, items: items, skipped: skipped };
}
function mergeSkipped(...lists) {
  return lists['flatMap']((list) => (Array['isArray'](list) ? list : []));
}
export function registerNodeExportCommands(registry) {
  registry['register']({
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
    validate(args = {}, context = {}) {
      try {
        if (!getNodeExportApi(context))
          return {
            ok: ![],
            errorCode: 'NODE_EXPORT_UNAVAILABLE',
            message: 'Node\x20export\x20is\x20unavailable\x20in\x20this\x20environment.',
          };
        const selection = normalizeExportItems(args, context);
        return { args: { ...normalizeDestinationArgs(args), ...selection } };
      } catch (error) {
        return {
          ok: ![],
          errorCode: error['errorCode'] || 'INVALID_NODE_EXPORT_SELECTION',
          message: error['message'],
          details: error['details'],
        };
      }
    },
    async execute(args, context) {
      const api = getNodeExportApi(context);
      if (!api)
        throw createCanvasCommandError(
          'NODE_EXPORT_UNAVAILABLE',
          'Node\x20export\x20is\x20unavailable\x20in\x20this\x20environment.',
        );
      const result = await api['exportSelected']({
        items: args['items'] || [],
        directory: args['directory'] || '',
        outputPath: args['outputPath'] || '',
        filename: args['filename'] || '',
      });
      if (result?.['canceled'])
        throw createCanvasCommandError('NODE_EXPORT_CANCELED', 'Node export was canceled.');
      if (result?.['success'] !== !![])
        throw createCanvasCommandError(
          result?.['code'] || 'NODE_EXPORT_FAILED',
          result?.['message'] || result?.['error'] || 'Node export failed.',
          result,
        );
      return {
        ...result,
        ids: args['ids'] || [],
        skipped: mergeSkipped(args['skipped'], result['skipped']),
      };
    },
  });
}
