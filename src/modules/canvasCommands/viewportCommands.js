import { normalizeNodeIds } from './graphCommands.js';
function getState(_0x4fe395) {
  return _0x4fe395.store?.getStateRaw?.() || _0x4fe395.store?.getState?.() || {};
}
function toFinitePositiveNumber(_0xccfbd, _0x10751c) {
  const _0x1addfb = Number(_0xccfbd);
  return Number.isFinite(_0x1addfb) && _0x1addfb > 0 ? _0x1addfb : _0x10751c;
}
function requireFocusNodes(_0x2ceac1, _0x527859) {
  if (typeof _0x2ceac1.focusNodes === 'function') return null;
  return {
    ok: false,
    errorCode: 'VIEWPORT_FOCUS_UNAVAILABLE',
    message: _0x527859 + ' requires a viewport focus service.',
  };
}
export function registerViewportCommands(_0xfc0017) {
  (_0xfc0017.register({
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
    validate(_0x5d11e1 = {}, _0x57d87e = {}) {
      const _0x52c6ec = requireFocusNodes(_0x57d87e, 'viewport.focusNodes');
      if (_0x52c6ec) return _0x52c6ec;
      try {
        return {
          args: {
            ids: normalizeNodeIds(_0x5d11e1, _0x57d87e, { min: 1, allowSelection: true }),
            padding: toFinitePositiveNumber(_0x5d11e1.padding, 80),
            durationMs: toFinitePositiveNumber(_0x5d11e1.durationMs, 0x320),
            options: _0x5d11e1.options || null,
          },
        };
      } catch (_0x228617) {
        return {
          ok: false,
          errorCode: _0x228617.errorCode || 'INVALID_FOCUS_NODES',
          message: _0x228617.message,
          details: _0x228617.details,
        };
      }
    },
    execute(_0x3259a0, _0x22fbba) {
      const _0x4a8cae = _0x22fbba.focusNodes(
        _0x3259a0.ids,
        _0x3259a0.padding,
        _0x3259a0.durationMs,
        _0x3259a0.options,
      );
      if (_0x4a8cae === false) return { ids: _0x3259a0.ids, focused: false };
      return { ids: _0x3259a0.ids, focused: true };
    },
  }),
    _0xfc0017.register({
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
      validate(_0x262801 = {}, _0x2996e2 = {}) {
        const _0x1ff2ab = requireFocusNodes(_0x2996e2, 'viewport.fitAll');
        if (_0x1ff2ab) return _0x1ff2ab;
        const _0x5255cb = Object.keys(getState(_0x2996e2).nodes || {});
        if (_0x5255cb.length === 0)
          return {
            ok: false,
            errorCode: 'EMPTY_CANVAS',
            message: 'viewport.fitAll requires at least one canvas node.',
          };
        return {
          args: {
            ids: _0x5255cb,
            padding: toFinitePositiveNumber(_0x262801.padding, 80),
            durationMs: toFinitePositiveNumber(_0x262801.durationMs, 0x320),
            options: _0x262801.options || null,
          },
        };
      },
      execute(_0x3ccb3f, _0x33c5f8) {
        const _0x4f8c9d = _0x33c5f8.focusNodes(
          _0x3ccb3f.ids,
          _0x3ccb3f.padding,
          _0x3ccb3f.durationMs,
          _0x3ccb3f.options,
        );
        return { ids: _0x3ccb3f.ids, focused: _0x4f8c9d !== false };
      },
    }));
}
