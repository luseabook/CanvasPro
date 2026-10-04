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
function getState(value) {
  return value.store?.getStateRaw?.() || value.store?.getState?.() || {};
}
function normalizeNodeIds(options = {}, item = {}, { min: min = 2 } = {}) {
  const state = getState(item),
    enabled = state.nodes || {},
    key = Array.isArray(options.ids) && options.ids.length > 0 ? options.ids : state.selectedNodeIds || [],
    list = [],
    map = new Set();
  for (const index of key) {
    const nodeId = String(index || '').trim();
    if (!nodeId || map.has(nodeId)) continue;
    if (!enabled[nodeId])
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + nodeId, {
        nodeId: nodeId,
      });
    (list.push(nodeId), map.add(nodeId));
  }
  if (list.length < min)
    throw createCanvasCommandError('INSUFFICIENT_NODES', 'At least ' + min + ' canvas node(s) are required.');
  return list;
}
function normalizeGap(result, data) {
  if (result === undefined || result === null || result === '') {
    const count = Number(data.ui?.alignDistributeGap);
    return Number.isFinite(count) && count >= 0 ? count : undefined;
  }
  const count2 = Number(result);
  if (!Number.isFinite(count2) || count2 < 0)
    throw createCanvasCommandError(
      'INVALID_DISTRIBUTE_GAP',
      'layout.distribute gap must be a non-negative number.',
    );
  return count2;
}
function normalizeOptionalGap(target, source = 40) {
  if (target === undefined || target === null || target === '') return source;
  const count3 = Number(target);
  if (!Number.isFinite(count3) || count3 < 0)
    throw createCanvasCommandError('INVALID_LAYOUT_GAP', 'Layout gap must be a non-negative number.');
  return count3;
}
function normalizePositiveInteger(next, current) {
  if (next === undefined || next === null || next === '') return current;
  const count4 = Number(next);
  if (!Number.isFinite(count4) || count4 <= 0)
    throw createCanvasCommandError(
      'INVALID_LAYOUT_COLUMNS',
      'layout.arrangeGrid columns must be a positive number.',
    );
  return Math.trunc(count4);
}
function applyTargetPositions(store, entry) {
  const state2 = getState(store),
    nodeOffsetPlan = buildNodeOffsetPlan(state2.nodes || {}, entry),
    list2 = Object.keys(nodeOffsetPlan);
  if (list2.length === 0) return list2;
  const record = store.store || store.graphStore,
    handler = () => record?.moveNodesByOffsets?.(nodeOffsetPlan);
  return (typeof record?.batch === 'function' ? record.batch(handler) : handler(), store.commit?.(), list2);
}
function getAlignableItems(payload, handle) {
  const state3 = getState(payload),
    list3 = getAlignableSelectionNodes(state3.nodes || {}, handle);
  if (list3.length < 2)
    throw createCanvasCommandError(
      'INSUFFICIENT_ALIGNABLE_NODES',
      'At least two alignable canvas nodes are required.',
    );
  return list3;
}
export function registerLayoutCommands(config) {
  (config.register({
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
    validate(options2 = {}, scope = {}) {
      const mode = String(options2.mode || '').trim();
      if (!ALIGN_MODES.has(mode))
        return {
          ok: false,
          errorCode: 'INVALID_ALIGN_MODE',
          message: 'Unsupported layout.align mode: ' + (mode || '(empty)'),
        };
      try {
        return { args: { ids: normalizeNodeIds(options2, scope), mode: mode } };
      } catch (errorCode) {
        return {
          ok: false,
          errorCode: errorCode.errorCode || 'INVALID_ALIGN_SELECTION',
          message: errorCode.message,
        };
      }
    },
    execute(ids, input) {
      const alignableItems = getAlignableItems(input, ids.ids),
        selectionBounds = computeSelectionBounds(alignableItems),
        alignTargets = computeAlignTargets(alignableItems, ids.mode, selectionBounds);
      return {
        ids: ids.ids,
        movedIds: applyTargetPositions(input, alignTargets),
        mode: ids.mode,
      };
    },
  }),
    config.register({
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
      validate(options3 = {}, output = {}) {
        const axis = String(options3.axis || '').trim();
        if (!DISTRIBUTE_AXES.has(axis))
          return {
            ok: false,
            errorCode: 'INVALID_DISTRIBUTE_AXIS',
            message: 'Unsupported layout.distribute axis: ' + (axis || '(empty)'),
          };
        try {
          const state4 = getState(output);
          return {
            args: {
              ids: normalizeNodeIds(options3, output),
              axis: axis,
              gap: normalizeGap(options3.gap, state4),
            },
          };
        } catch (errorCode2) {
          return {
            ok: false,
            errorCode: errorCode2.errorCode || 'INVALID_DISTRIBUTE_SELECTION',
            message: errorCode2.message,
          };
        }
      },
      execute(ids2, value2) {
        const alignableItems2 = getAlignableItems(value2, ids2.ids),
          distributeTargets = computeDistributeTargets(alignableItems2, ids2.axis, ids2.gap);
        return {
          ids: ids2.ids,
          movedIds: applyTargetPositions(value2, distributeTargets),
          axis: ids2.axis,
          gap: ids2.gap,
        };
      },
    }),
    config.register({
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
      validate(options4 = {}, value3 = {}) {
        try {
          return {
            args: {
              ids: normalizeNodeIds(options4, value3),
              gap: normalizeOptionalGap(options4.gap, 40),
              align: String(options4.align || 'top').trim(),
            },
          };
        } catch (errorCode3) {
          return {
            ok: false,
            errorCode: errorCode3.errorCode || 'INVALID_ARRANGE_ROW',
            message: errorCode3.message,
          };
        }
      },
      execute(gap, value4) {
        const alignableItems3 = getAlignableItems(value4, gap.ids),
          arrangeRowTargets = computeArrangeRowTargets(alignableItems3, { gap: gap.gap, align: gap.align });
        return {
          ids: gap.ids,
          movedIds: applyTargetPositions(value4, arrangeRowTargets),
          gap: gap.gap,
        };
      },
    }),
    config.register({
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
      validate(options5 = {}, value5 = {}) {
        try {
          return {
            args: {
              ids: normalizeNodeIds(options5, value5),
              gap: normalizeOptionalGap(options5.gap, 40),
              align: String(options5.align || 'left').trim(),
            },
          };
        } catch (errorCode4) {
          return {
            ok: false,
            errorCode: errorCode4.errorCode || 'INVALID_ARRANGE_COLUMN',
            message: errorCode4.message,
          };
        }
      },
      execute(gap2, value6) {
        const alignableItems4 = getAlignableItems(value6, gap2.ids),
          arrangeColumnTargets = computeArrangeColumnTargets(alignableItems4, {
            gap: gap2.gap,
            align: gap2.align,
          });
        return {
          ids: gap2.ids,
          movedIds: applyTargetPositions(value6, arrangeColumnTargets),
          gap: gap2.gap,
        };
      },
    }),
    config.register({
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
      validate(options6 = {}, value7 = {}) {
        try {
          return {
            args: {
              ids: normalizeNodeIds(options6, value7),
              columns: normalizePositiveInteger(options6.columns, undefined),
              gapX: normalizeOptionalGap(options6.gapX ?? options6.gap, 40),
              gapY: normalizeOptionalGap(options6.gapY ?? options6.gap, 40),
            },
          };
        } catch (errorCode5) {
          return {
            ok: false,
            errorCode: errorCode5.errorCode || 'INVALID_ARRANGE_GRID',
            message: errorCode5.message,
          };
        }
      },
      execute(columns, value8) {
        const alignableItems5 = getAlignableItems(value8, columns.ids),
          arrangeGridTargets = computeArrangeGridTargets(alignableItems5, {
            columns: columns.columns,
            gapX: columns.gapX,
            gapY: columns.gapY,
          });
        return {
          ids: columns.ids,
          movedIds: applyTargetPositions(value8, arrangeGridTargets),
          columns: columns.columns,
          gapX: columns.gapX,
          gapY: columns.gapY,
        };
      },
    }),
    config.register({
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
      validate(options7 = {}, value9 = {}) {
        const anchorId = String(options7.anchorId || options7.targetId || '').trim(),
          placement = String(options7.placement || 'right').trim();
        if (!MOVE_NEAR_PLACEMENTS.has(placement))
          return {
            ok: false,
            errorCode: 'INVALID_MOVE_NEAR_PLACEMENT',
            message: 'Unsupported layout.moveNearNode placement: ' + (placement || '(empty)'),
          };
        try {
          const ids3 = normalizeNodeIds(options7, value9, { min: 1 }).filter((item2) => item2 !== anchorId);
          if (!anchorId)
            throw createCanvasCommandError(
              'MISSING_ANCHOR_NODE_ID',
              'layout.moveNearNode requires anchorId.',
            );
          if (!getState(value9).nodes?.[anchorId])
            throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + anchorId);
          if (ids3.length === 0)
            throw createCanvasCommandError(
              'INSUFFICIENT_NODES',
              'layout.moveNearNode requires at least one movable node.',
            );
          return {
            args: {
              ids: ids3,
              anchorId: anchorId,
              placement: placement,
              gap: normalizeOptionalGap(options7.gap, 40),
            },
          };
        } catch (errorCode6) {
          return {
            ok: false,
            errorCode: errorCode6.errorCode || 'INVALID_MOVE_NEAR_NODE',
            message: errorCode6.message,
          };
        }
      },
      execute(placement2, value10) {
        const state5 = getState(value10),
          list4 = getAlignableSelectionNodes(state5.nodes || {}, placement2.ids),
          [enabled2] = getAlignableSelectionNodes(state5.nodes || {}, [placement2.anchorId]);
        if (!enabled2 || list4.length === 0)
          throw createCanvasCommandError(
            'INSUFFICIENT_ALIGNABLE_NODES',
            'layout.moveNearNode requires alignable nodes.',
          );
        const moveNearNodeTargets = computeMoveNearNodeTargets(list4, enabled2, {
          placement: placement2.placement,
          gap: placement2.gap,
        });
        return {
          ids: placement2.ids,
          anchorId: placement2.anchorId,
          movedIds: applyTargetPositions(value10, moveNearNodeTargets),
          placement: placement2.placement,
          gap: placement2.gap,
        };
      },
    }));
}
