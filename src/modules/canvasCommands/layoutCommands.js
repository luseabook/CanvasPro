import {
  buildNodeOffsetPlan,
  computeAlignTargets,
  computeArrangeColumnTargets,
  computeArrangeGridTargets,
  computeArrangeRowTargets,
  computeDistributeTargets,
  computeMoveNearNodeTargets,
  computeSelectionBounds,
  getAlignableSelectionNodes,
} from '../../core/math.js';
import { createCanvasCommandError } from './commandRegistry.js';
const ALIGN_MODES = new Set(['left', 'h-center', 'right', 'top', 'v-center', 'bottom']),
  DISTRIBUTE_AXES = new Set(['horizontal', 'vertical']),
  MOVE_NEAR_PLACEMENTS = new Set(['left', 'right', 'top', 'bottom']);
function getState(_0x239def) {
  return _0x239def.store?.getStateRaw?.() || _0x239def.store?.getState?.() || {};
}
function normalizeNodeIds(_0x4ba26b = {}, _0x18ec3f = {}, { min: min = 2 } = {}) {
  const _0x342363 = getState(_0x18ec3f),
    _0x2191a1 = _0x342363.nodes || {},
    _0x44ea96 =
      Array.isArray(_0x4ba26b.ids) && _0x4ba26b.ids.length > 0
        ? _0x4ba26b.ids
        : _0x342363.selectedNodeIds || [],
    _0x2e4043 = [],
    _0x2cbb4d = new Set();
  for (const _0x5218c6 of _0x44ea96) {
    const _0x48f2a9 = String(_0x5218c6 || '').trim();
    if (!_0x48f2a9 || _0x2cbb4d.has(_0x48f2a9)) continue;
    if (!_0x2191a1[_0x48f2a9])
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + _0x48f2a9, {
        nodeId: _0x48f2a9,
      });
    (_0x2e4043.push(_0x48f2a9), _0x2cbb4d.add(_0x48f2a9));
  }
  if (_0x2e4043.length < min)
    throw createCanvasCommandError('INSUFFICIENT_NODES', 'At least ' + min + ' canvas node(s) are required.');
  return _0x2e4043;
}
function normalizeGap(_0x25712c, _0x4f01cc) {
  if (_0x25712c === undefined || _0x25712c === null || _0x25712c === '') {
    const _0x141074 = Number(_0x4f01cc.ui?.alignDistributeGap);
    return Number.isFinite(_0x141074) && _0x141074 >= 0 ? _0x141074 : undefined;
  }
  const _0x5651fd = Number(_0x25712c);
  if (!Number.isFinite(_0x5651fd) || _0x5651fd < 0)
    throw createCanvasCommandError(
      'INVALID_DISTRIBUTE_GAP',
      'layout.distribute gap must be a non-negative number.',
    );
  return _0x5651fd;
}
function normalizeOptionalGap(_0x5b52fb, _0x330008 = 40) {
  if (_0x5b52fb === undefined || _0x5b52fb === null || _0x5b52fb === '') return _0x330008;
  const _0x49d975 = Number(_0x5b52fb);
  if (!Number.isFinite(_0x49d975) || _0x49d975 < 0)
    throw createCanvasCommandError('INVALID_LAYOUT_GAP', 'Layout gap must be a non-negative number.');
  return _0x49d975;
}
function normalizePositiveInteger(_0x3cbf60, _0x3d3bad) {
  if (_0x3cbf60 === undefined || _0x3cbf60 === null || _0x3cbf60 === '') return _0x3d3bad;
  const _0x507005 = Number(_0x3cbf60);
  if (!Number.isFinite(_0x507005) || _0x507005 <= 0)
    throw createCanvasCommandError(
      'INVALID_LAYOUT_COLUMNS',
      'layout.arrangeGrid columns must be a positive number.',
    );
  return Math.trunc(_0x507005);
}
function applyTargetPositions(_0x5d20d4, _0x44ae6f) {
  const _0x50548a = getState(_0x5d20d4),
    _0x471cad = buildNodeOffsetPlan(_0x50548a.nodes || {}, _0x44ae6f),
    _0x5dfa42 = Object.keys(_0x471cad);
  if (_0x5dfa42.length === 0) return _0x5dfa42;
  const _0x251676 = _0x5d20d4.store || _0x5d20d4.graphStore,
    _0x1babe4 = () => _0x251676?.moveNodesByOffsets?.(_0x471cad);
  return (
    typeof _0x251676?.batch === 'function' ? _0x251676.batch(_0x1babe4) : _0x1babe4(),
    _0x5d20d4.commit?.(),
    _0x5dfa42
  );
}
function getAlignableItems(_0xbe5e63, _0x17c7c1) {
  const _0x3192b2 = getState(_0xbe5e63),
    _0x318605 = getAlignableSelectionNodes(_0x3192b2.nodes || {}, _0x17c7c1);
  if (_0x318605.length < 2)
    throw createCanvasCommandError(
      'INSUFFICIENT_ALIGNABLE_NODES',
      'At least two alignable canvas nodes are required.',
    );
  return _0x318605;
}
export function registerLayoutCommands(_0x3a7276) {
  (_0x3a7276.register({
    id: 'layout.align',
    description: 'Align canvas nodes.',
    riskLevel: 'safe',
    argsSchema: {
      required: ['mode'],
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        mode: { type: 'string', enum: Array.from(ALIGN_MODES) },
      },
      selectionFallback: true,
    },
    capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes'], selectionFallback: true },
    returnSchema: { aliasFields: ['ids', 'movedIds', 'mode'] },
    validate(_0x483e0c = {}, _0x27c6d0 = {}) {
      const _0x2e68b6 = String(_0x483e0c.mode || '').trim();
      if (!ALIGN_MODES.has(_0x2e68b6))
        return {
          ok: false,
          errorCode: 'INVALID_ALIGN_MODE',
          message: 'Unsupported layout.align mode: ' + (_0x2e68b6 || '(empty)'),
        };
      try {
        return { args: { ids: normalizeNodeIds(_0x483e0c, _0x27c6d0), mode: _0x2e68b6 } };
      } catch (_0x535062) {
        return {
          ok: false,
          errorCode: _0x535062.errorCode || 'INVALID_ALIGN_SELECTION',
          message: _0x535062.message,
        };
      }
    },
    execute(_0x180787, _0x77c6a1) {
      const _0x5d0907 = getAlignableItems(_0x77c6a1, _0x180787.ids),
        _0x460332 = computeSelectionBounds(_0x5d0907),
        _0x1d96a7 = computeAlignTargets(_0x5d0907, _0x180787.mode, _0x460332);
      return {
        ids: _0x180787.ids,
        movedIds: applyTargetPositions(_0x77c6a1, _0x1d96a7),
        mode: _0x180787.mode,
      };
    },
  }),
    _0x3a7276.register({
      id: 'layout.distribute',
      description: 'Distribute canvas nodes.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['axis'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          axis: { type: 'string', enum: Array.from(DISTRIBUTE_AXES) },
          gap: { type: 'number' },
        },
        defaults: { gap: 'ui.alignDistributeGap' },
        selectionFallback: true,
      },
      capabilitySchema: {
        reads: ['nodes', 'selection', 'ui.alignDistributeGap'],
        writes: ['nodes'],
        selectionFallback: true,
      },
      returnSchema: { aliasFields: ['ids', 'movedIds', 'axis', 'gap'] },
      validate(_0x36190e = {}, _0x36b8b1 = {}) {
        const _0x12e505 = String(_0x36190e.axis || '').trim();
        if (!DISTRIBUTE_AXES.has(_0x12e505))
          return {
            ok: false,
            errorCode: 'INVALID_DISTRIBUTE_AXIS',
            message: 'Unsupported layout.distribute axis: ' + (_0x12e505 || '(empty)'),
          };
        try {
          const _0x5c3e1f = getState(_0x36b8b1);
          return {
            args: {
              ids: normalizeNodeIds(_0x36190e, _0x36b8b1),
              axis: _0x12e505,
              gap: normalizeGap(_0x36190e.gap, _0x5c3e1f),
            },
          };
        } catch (_0x349300) {
          return {
            ok: false,
            errorCode: _0x349300.errorCode || 'INVALID_DISTRIBUTE_SELECTION',
            message: _0x349300.message,
          };
        }
      },
      execute(_0x200f12, _0x11257f) {
        const _0xb894da = getAlignableItems(_0x11257f, _0x200f12.ids),
          _0x35c610 = computeDistributeTargets(_0xb894da, _0x200f12.axis, _0x200f12.gap);
        return {
          ids: _0x200f12.ids,
          movedIds: applyTargetPositions(_0x11257f, _0x35c610),
          axis: _0x200f12.axis,
          gap: _0x200f12.gap,
        };
      },
    }),
    _0x3a7276.register({
      id: 'layout.arrangeRow',
      description: 'Arrange canvas nodes in a row.',
      riskLevel: 'safe',
      argsSchema: {
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          gap: { type: 'number' },
          align: { type: 'string' },
        },
        defaults: { gap: 40, align: 'top' },
        selectionFallback: true,
      },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes'], selectionFallback: true },
      returnSchema: { aliasFields: ['ids', 'movedIds', 'gap'] },
      validate(_0x2e07c9 = {}, _0x5563c6 = {}) {
        try {
          return {
            args: {
              ids: normalizeNodeIds(_0x2e07c9, _0x5563c6),
              gap: normalizeOptionalGap(_0x2e07c9.gap, 40),
              align: String(_0x2e07c9.align || 'top').trim(),
            },
          };
        } catch (_0x3ebd2c) {
          return {
            ok: false,
            errorCode: _0x3ebd2c.errorCode || 'INVALID_ARRANGE_ROW',
            message: _0x3ebd2c.message,
          };
        }
      },
      execute(_0x4b34f8, _0x11d0a6) {
        const _0x48df74 = getAlignableItems(_0x11d0a6, _0x4b34f8.ids),
          _0x381370 = computeArrangeRowTargets(_0x48df74, { gap: _0x4b34f8.gap, align: _0x4b34f8.align });
        return {
          ids: _0x4b34f8.ids,
          movedIds: applyTargetPositions(_0x11d0a6, _0x381370),
          gap: _0x4b34f8.gap,
        };
      },
    }),
    _0x3a7276.register({
      id: 'layout.arrangeColumn',
      description: 'Arrange canvas nodes in a column.',
      riskLevel: 'safe',
      argsSchema: {
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          gap: { type: 'number' },
          align: { type: 'string' },
        },
        defaults: { gap: 40, align: 'left' },
        selectionFallback: true,
      },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes'], selectionFallback: true },
      returnSchema: { aliasFields: ['ids', 'movedIds', 'gap'] },
      validate(_0x2279e9 = {}, _0x442df6 = {}) {
        try {
          return {
            args: {
              ids: normalizeNodeIds(_0x2279e9, _0x442df6),
              gap: normalizeOptionalGap(_0x2279e9.gap, 40),
              align: String(_0x2279e9.align || 'left').trim(),
            },
          };
        } catch (_0x3d5644) {
          return {
            ok: false,
            errorCode: _0x3d5644.errorCode || 'INVALID_ARRANGE_COLUMN',
            message: _0x3d5644.message,
          };
        }
      },
      execute(_0x33b5cd, _0x440a94) {
        const _0xf739ac = getAlignableItems(_0x440a94, _0x33b5cd.ids),
          _0x4606ed = computeArrangeColumnTargets(_0xf739ac, { gap: _0x33b5cd.gap, align: _0x33b5cd.align });
        return {
          ids: _0x33b5cd.ids,
          movedIds: applyTargetPositions(_0x440a94, _0x4606ed),
          gap: _0x33b5cd.gap,
        };
      },
    }),
    _0x3a7276.register({
      id: 'layout.arrangeGrid',
      description: 'Arrange canvas nodes in a grid.',
      riskLevel: 'safe',
      argsSchema: {
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          columns: { type: 'number' },
          gap: { type: 'number' },
          gapX: { type: 'number' },
          gapY: { type: 'number' },
        },
        defaults: { gapX: 40, gapY: 40 },
        selectionFallback: true,
      },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes'], selectionFallback: true },
      returnSchema: { aliasFields: ['ids', 'movedIds', 'columns', 'gapX', 'gapY'] },
      validate(_0x25fd46 = {}, _0x5f20f9 = {}) {
        try {
          return {
            args: {
              ids: normalizeNodeIds(_0x25fd46, _0x5f20f9),
              columns: normalizePositiveInteger(_0x25fd46.columns, undefined),
              gapX: normalizeOptionalGap(_0x25fd46.gapX ?? _0x25fd46.gap, 40),
              gapY: normalizeOptionalGap(_0x25fd46.gapY ?? _0x25fd46.gap, 40),
            },
          };
        } catch (_0x2e8243) {
          return {
            ok: false,
            errorCode: _0x2e8243.errorCode || 'INVALID_ARRANGE_GRID',
            message: _0x2e8243.message,
          };
        }
      },
      execute(_0x4e0070, _0x5eae64) {
        const _0x821bb0 = getAlignableItems(_0x5eae64, _0x4e0070.ids),
          _0x421bee = computeArrangeGridTargets(_0x821bb0, {
            columns: _0x4e0070.columns,
            gapX: _0x4e0070.gapX,
            gapY: _0x4e0070.gapY,
          });
        return {
          ids: _0x4e0070.ids,
          movedIds: applyTargetPositions(_0x5eae64, _0x421bee),
          columns: _0x4e0070.columns,
          gapX: _0x4e0070.gapX,
          gapY: _0x4e0070.gapY,
        };
      },
    }),
    _0x3a7276.register({
      id: 'layout.moveNearNode',
      description: 'Move canvas nodes near another node.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['anchorId'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          anchorId: { type: 'string' },
          targetId: { type: 'string' },
          placement: { type: 'string', enum: Array.from(MOVE_NEAR_PLACEMENTS) },
          gap: { type: 'number' },
        },
        defaults: { placement: 'right', gap: 40 },
        selectionFallback: true,
      },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes'], selectionFallback: true },
      returnSchema: { aliasFields: ['ids', 'anchorId', 'movedIds', 'placement', 'gap'] },
      validate(_0x465172 = {}, _0x425355 = {}) {
        const _0x5533f3 = String(_0x465172.anchorId || _0x465172.targetId || '').trim(),
          _0x29a559 = String(_0x465172.placement || 'right').trim();
        if (!MOVE_NEAR_PLACEMENTS.has(_0x29a559))
          return {
            ok: false,
            errorCode: 'INVALID_MOVE_NEAR_PLACEMENT',
            message: 'Unsupported layout.moveNearNode placement: ' + (_0x29a559 || '(empty)'),
          };
        try {
          const _0x2c415c = normalizeNodeIds(_0x465172, _0x425355, { min: 1 }).filter(
            (_0x2ea228) => _0x2ea228 !== _0x5533f3,
          );
          if (!_0x5533f3)
            throw createCanvasCommandError(
              'MISSING_ANCHOR_NODE_ID',
              'layout.moveNearNode requires anchorId.',
            );
          if (!getState(_0x425355).nodes?.[_0x5533f3])
            throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + _0x5533f3);
          if (_0x2c415c.length === 0)
            throw createCanvasCommandError(
              'INSUFFICIENT_NODES',
              'layout.moveNearNode requires at least one movable node.',
            );
          return {
            args: {
              ids: _0x2c415c,
              anchorId: _0x5533f3,
              placement: _0x29a559,
              gap: normalizeOptionalGap(_0x465172.gap, 40),
            },
          };
        } catch (_0x52fa9a) {
          return {
            ok: false,
            errorCode: _0x52fa9a.errorCode || 'INVALID_MOVE_NEAR_NODE',
            message: _0x52fa9a.message,
          };
        }
      },
      execute(_0xea7e3b, _0x2ff5e9) {
        const _0x5bb464 = getState(_0x2ff5e9),
          _0x9101e1 = getAlignableSelectionNodes(_0x5bb464.nodes || {}, _0xea7e3b.ids),
          [_0x539178] = getAlignableSelectionNodes(_0x5bb464.nodes || {}, [_0xea7e3b.anchorId]);
        if (!_0x539178 || _0x9101e1.length === 0)
          throw createCanvasCommandError(
            'INSUFFICIENT_ALIGNABLE_NODES',
            'layout.moveNearNode requires alignable nodes.',
          );
        const _0x258421 = computeMoveNearNodeTargets(_0x9101e1, _0x539178, {
          placement: _0xea7e3b.placement,
          gap: _0xea7e3b.gap,
        });
        return {
          ids: _0xea7e3b.ids,
          anchorId: _0xea7e3b.anchorId,
          movedIds: applyTargetPositions(_0x2ff5e9, _0x258421),
          placement: _0xea7e3b.placement,
          gap: _0xea7e3b.gap,
        };
      },
    }));
}
