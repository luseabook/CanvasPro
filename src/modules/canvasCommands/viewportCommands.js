import { normalizeNodeIds } from './graphCommands.js';
function getState(value) {
  return value.store?.getStateRaw?.() || value.store?.getState?.() || {};
}
function toFinitePositiveNumber(item, key) {
  const count = Number(item);
  return Number.isFinite(count) && count > 0 ? count : key;
}
function requireFocusNodes(index, message) {
  if (typeof index.focusNodes === 'function') return null;
  return {
    ok: false,
    errorCode: 'VIEWPORT_FOCUS_UNAVAILABLE',
    message: message + ' requires a viewport focus service.',
  };
}
export function registerViewportCommands(result) {
  (result.register({
    id: 'viewport.focusNodes',
    description: 'Focus canvas viewport on nodes.',
    riskLevel: 'safe',
    argsSchema: {
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        nodeId: { type: 'string' },
        padding: { type: 'number' },
        durationMs: { type: 'number' },
        options: { type: 'object' },
      },
      defaults: { padding: 80, durationMs: 0x320 },
      selectionFallback: true,
    },
    capabilitySchema: { reads: ['nodes', 'selection'], writes: ['viewport'], selectionFallback: true },
    returnSchema: { aliasFields: ['ids', 'focused'] },
    validate(options = {}, data = {}) {
      const requireFocusNodes2 = requireFocusNodes(data, 'viewport.focusNodes');
      if (requireFocusNodes2) return requireFocusNodes2;
      try {
        return {
          args: {
            ids: normalizeNodeIds(options, data, { min: 1, allowSelection: true }),
            padding: toFinitePositiveNumber(options.padding, 80),
            durationMs: toFinitePositiveNumber(options.durationMs, 0x320),
            options: options.options || null,
          },
        };
      } catch (errorCode) {
        return {
          ok: false,
          errorCode: errorCode.errorCode || 'INVALID_FOCUS_NODES',
          message: errorCode.message,
          details: errorCode.details,
        };
      }
    },
    execute(ids, target) {
      const source = target.focusNodes(ids.ids, ids.padding, ids.durationMs, ids.options);
      if (source === false) return { ids: ids.ids, focused: false };
      return { ids: ids.ids, focused: true };
    },
  }),
    result.register({
      id: 'viewport.fitAll',
      description: 'Fit all canvas nodes in the viewport.',
      riskLevel: 'safe',
      argsSchema: {
        properties: {
          padding: { type: 'number' },
          durationMs: { type: 'number' },
          options: { type: 'object' },
        },
        defaults: { padding: 80, durationMs: 0x320 },
      },
      capabilitySchema: { reads: ['nodes'], writes: ['viewport'] },
      returnSchema: { aliasFields: ['ids', 'focused'] },
      validate(options2 = {}, next = {}) {
        const requireFocusNodes3 = requireFocusNodes(next, 'viewport.fitAll');
        if (requireFocusNodes3) return requireFocusNodes3;
        const ids2 = Object.keys(getState(next).nodes || {});
        if (ids2.length === 0)
          return {
            ok: false,
            errorCode: 'EMPTY_CANVAS',
            message: 'viewport.fitAll requires at least one canvas node.',
          };
        return {
          args: {
            ids: ids2,
            padding: toFinitePositiveNumber(options2.padding, 80),
            durationMs: toFinitePositiveNumber(options2.durationMs, 0x320),
            options: options2.options || null,
          },
        };
      },
      execute(ids3, current) {
        const focused = current.focusNodes(ids3.ids, ids3.padding, ids3.durationMs, ids3.options);
        return { ids: ids3.ids, focused: focused !== false };
      },
    }));
}
