import {
  buildFixedInputAssetSlotMap,
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
export function buildVideoFixedSlotEntriesForSummary({
  fixedInputConfig: fixedInputConfig,
  inEdges: inEdges = [],
  nodes: nodes = {},
  promptEl: promptEl = null,
  nodeData: nodeData = {},
} = {}) {
  if (!fixedInputConfig) return {};
  const occupiedSlots = {};
  for (const refSlot of Array.isArray(inEdges) ? inEdges : []) {
    const sourceNode = nodes?.[refSlot?.sourceId];
    if (!sourceNode) continue;
    const kind = resolveEffectiveInputKind(sourceNode, refSlot),
      { slot: slot } = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: refSlot?.refSlot,
        kind: kind,
        occupiedSlots: occupiedSlots,
        sourceNode: sourceNode,
      });
    slot &&
      !occupiedSlots[slot] &&
      (occupiedSlots[slot] = { url: 'connected', node: sourceNode, edge: refSlot });
  }
  const occupiedSlots2 = new Set(Object.keys(occupiedSlots)),
    fixedInputAssetSlotMap = buildFixedInputAssetSlotMap(promptEl, {
      slotOrderByType: fixedInputConfig.slotOrderByType,
      visibleSlots: fixedInputConfig.visibleSlots,
      exclusiveGroups: fixedInputConfig.exclusiveGroups,
      slotById: fixedInputConfig.slotById,
      occupiedSlots: occupiedSlots2,
      nodeData: nodeData,
    });
  return (
    Object.entries(fixedInputAssetSlotMap).forEach(([value, ref]) => {
      !occupiedSlots[value] && ref && (occupiedSlots[value] = { url: 'connected', ref: ref });
    }),
    occupiedSlots
  );
}
export function getFixedInputSlotKind(item, key) {
  const index = String(key || '').trim(),
    fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(item || {}),
    result = String(fixedInputSlotConfigFromManifest?.slotKindById?.[index] || '').trim();
  if (result) return result;
  if (index === 'audio' || index.startsWith('audio')) return 'audio';
  if (index === 'sourceVideo' || index === 'videoMask') return 'video';
  if (index === 'refImage' || index === 'firstFrame') return 'image';
  return '';
}
export function getFixedInputSlotsToReplace(data, options) {
  const target = String(options || '').trim(),
    fixedInputSlotConfigFromManifest2 = getFixedInputSlotConfigFromManifest(data || {}),
    list = getExclusiveSlotsForFixedSlot(fixedInputSlotConfigFromManifest2?.exclusiveGroups, target);
  return new Set(list.length ? list : [target].filter(Boolean));
}
export function getFixedInputAcceptForKind(source) {
  if (source === 'image') return 'image/*';
  if (source === 'video') return 'video/*';
  if (source === 'audio') return 'audio/*';
  return '*/*';
}
