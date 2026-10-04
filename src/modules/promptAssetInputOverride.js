import appStore from '../core/stores/appStore.js';
import {
  buildFixedInputAssetSlotMapFromRefs,
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from './fixedInputAssetRefs.js';
import {
  getAssetInputRefsFromNodeData,
  isRunningHubWorkflowNode,
  removeAssetInputRefFromNodeData,
} from './nodePromptShared.js';
import {
  getTargetInputPolicy,
  normalizeInputKind,
  resolveEffectiveInputKind,
  isRhPersonReplaceWorkflowModel,
} from './modelInputPolicy.js';
import { getModelManifest } from '../manifests/index.js';
const RH_PERSON_REPLACE_ASSET_SLOT_ORDER = Object.freeze({
  image: Object.freeze(['replaceTarget', 'replacedImage']),
});
function getAudioWorkflowKey(options = {}) {
  const value = String(options?.audioWorkflowKey || '').trim();
  if (value) return value;
  const item = String(options?.model || '').trim();
  return item;
}
function getSlotsFromOrder(options2 = {}) {
  return Array.from(
    new Set(
      Object.values(options2)
        .flat()
        .map((item2) => String(item2 || ''))
        .filter(Boolean),
    ),
  );
}
function getFixedAssetSlotConfig(args = {}) {
  const key = String(args?.type || '').trim(),
    index = String(args?.model || '').trim();
  if (key === 'ai-video' || key === 'ai-image') {
    const slotOrderByType2 = getFixedInputSlotConfigFromManifest(args);
    if (slotOrderByType2)
      return {
        slotOrderByType: slotOrderByType2.slotOrderByType,
        visibleSlots: slotOrderByType2.visibleSlots,
        slotKindById: slotOrderByType2.slotKindById,
        exclusiveGroups: slotOrderByType2.exclusiveGroups,
      };
  }
  if (key === 'ai-image' && isRhPersonReplaceWorkflowModel(index))
    return {
      slotOrderByType: RH_PERSON_REPLACE_ASSET_SLOT_ORDER,
      visibleSlots: ['replaceTarget', 'replacedImage'],
    };
  if (key === 'ai-audio') {
    const audioWorkflowKey = getAudioWorkflowKey(args),
      slotOrderByType3 = getFixedInputSlotConfigFromManifest({
        ...args,
        audioWorkflowKey: audioWorkflowKey,
        model: audioWorkflowKey,
      });
    if (slotOrderByType3)
      return {
        slotOrderByType: slotOrderByType3.slotOrderByType,
        visibleSlots: slotOrderByType3.visibleSlots,
        slotKindById: slotOrderByType3.slotKindById,
        exclusiveGroups: slotOrderByType3.exclusiveGroups,
      };
    const list = getModelManifest(audioWorkflowKey)?.inputSlots?.fixedSlots,
      audio =
        Array.isArray(list) && list.length
          ? list.map((item3) => String(item3?.id || '').trim()).filter(Boolean)
          : ['audioRef'];
    return { slotOrderByType: { audio: audio }, visibleSlots: audio };
  }
  return null;
}
function getIncomingEdges(enabled = '', result = null) {
  if (Array.isArray(result)) return result;
  if (!enabled) return [];
  return appStore.getIncomingEdges?.(enabled) || [];
}
function assignOccupiedFixedSlots({
  incomingEdges: incomingEdges = [],
  nodes: nodes = {},
  slotOrderByType: slotOrderByType = {},
  visibleSlots: visibleSlots = null,
  slotKindById: slotKindById = {},
  exclusiveGroups: exclusiveGroups = [],
  slotById: slotById = {},
} = {}) {
  const data = new Set(
      Array.isArray(visibleSlots) && visibleSlots.length
        ? visibleSlots.map(String)
        : getSlotsFromOrder(slotOrderByType),
    ),
    occupiedSlots = {};
  return (
    (Array.isArray(incomingEdges) ? incomingEdges : []).forEach((refSlot2) => {
      const kind = resolveEffectiveInputKind(nodes?.[refSlot2?.sourceId], refSlot2),
        { slot: slot } = resolveFixedInputSlotForRef({
          fixedInputConfig: {
            slotOrderByType: slotOrderByType,
            visibleSlots: Array.from(data),
            slotKindById: slotKindById,
            exclusiveGroups: exclusiveGroups,
            slotById: slotById,
          },
          refSlot: refSlot2?.refSlot,
          kind: kind,
          occupiedSlots: occupiedSlots,
          sourceNode: nodes?.[refSlot2?.sourceId],
        });
      if (slot) occupiedSlots[slot] = refSlot2;
    }),
    new Set(Object.keys(occupiedSlots))
  );
}
function removeGenericOverflowAssetRefs({
  targetId: targetId2,
  targetNode: targetNode2,
  sourceKind: sourceKind2,
  incomingEdges: incomingEdges2,
  nodes: nodes2,
} = {}) {
  const targetInputPolicy = getTargetInputPolicy(targetNode2),
    count = Number(targetInputPolicy?.maxByKind?.[sourceKind2]);
  if (!Number.isFinite(count) || count <= 0) return false;
  const target = (Array.isArray(incomingEdges2) ? incomingEdges2 : []).filter(
    (item4) => resolveEffectiveInputKind(nodes2?.[item4?.sourceId], item4) === sourceKind2,
  ).length;
  let count2 =
      target + getAssetInputRefsFromNodeData(targetNode2, { allowedTypes: [sourceKind2] }).length + 1 - count,
    removeAssetInputRefFromNodeData2 = false;
  while (count2 > 0) {
    const source = appStore.getState?.()?.nodes?.[targetId2] || targetNode2,
      assetInputRefsFromNodeData = getAssetInputRefsFromNodeData(source, { allowedTypes: [sourceKind2] })[0];
    if (!assetInputRefsFromNodeData) break;
    ((removeAssetInputRefFromNodeData2 =
      removeAssetInputRefFromNodeData(targetId2, assetInputRefsFromNodeData) ||
      removeAssetInputRefFromNodeData2),
      (count2 -= 1));
  }
  return removeAssetInputRefFromNodeData2;
}
export function removeCoveredAssetInputRefForConnection({
  targetId: targetId = '',
  targetNode: targetNode = null,
  sourceNode: sourceNode = null,
  sourceKind: sourceKind = '',
  refSlot: refSlot = '',
  incomingEdges: incomingEdges = null,
  nodes: nodes = null,
} = {}) {
  const targetId3 = String(targetId || targetNode?.id || '').trim();
  if (!targetId3) return false;
  const next = appStore.getState?.() || {},
    nodes3 = nodes || next.nodes || {},
    targetNode3 = next.nodes?.[targetId3] || targetNode || {},
    slotOrderByType4 = getFixedAssetSlotConfig(targetNode3);
  if (!isRunningHubWorkflowNode(targetNode3) && !slotOrderByType4) return false;
  const sourceKind3 = resolveEffectiveInputKind(sourceNode) || normalizeInputKind(sourceKind || '');
  if (sourceKind3 !== 'image' && sourceKind3 !== 'video' && sourceKind3 !== 'audio') return false;
  const incomingEdges3 = getIncomingEdges(targetId3, incomingEdges),
    current = String(refSlot || '').trim();
  if (slotOrderByType4 && current) {
    const list2 = slotOrderByType4.slotOrderByType?.[sourceKind3];
    if (Array.isArray(list2) && list2.includes(current)) {
      const occupiedSlots2 = assignOccupiedFixedSlots({
          incomingEdges: incomingEdges3,
          nodes: nodes3,
          slotOrderByType: slotOrderByType4.slotOrderByType,
          visibleSlots: slotOrderByType4.visibleSlots,
          slotKindById: slotOrderByType4.slotKindById,
          exclusiveGroups: slotOrderByType4.exclusiveGroups,
          slotById: slotOrderByType4.slotById,
        }),
        assetInputRefsFromNodeData2 = getAssetInputRefsFromNodeData(targetNode3, {
          allowedTypes: Object.keys(slotOrderByType4.slotOrderByType || {}),
        }),
        fixedInputAssetSlotMapFromRefs = buildFixedInputAssetSlotMapFromRefs(assetInputRefsFromNodeData2, {
          slotOrderByType: slotOrderByType4.slotOrderByType,
          visibleSlots: slotOrderByType4.visibleSlots,
          exclusiveGroups: slotOrderByType4.exclusiveGroups,
          slotById: slotOrderByType4.slotById,
          occupiedSlots: occupiedSlots2,
        }),
        exclusiveSlotsForFixedSlot = getExclusiveSlotsForFixedSlot(slotOrderByType4.exclusiveGroups, current);
      for (const entry of exclusiveSlotsForFixedSlot) {
        const record = fixedInputAssetSlotMapFromRefs[entry],
          payload = slotOrderByType4.slotKindById?.[entry] || record?.type || '';
        if (record && record.type === payload) return removeAssetInputRefFromNodeData(targetId3, record);
      }
    }
  }
  return removeGenericOverflowAssetRefs({
    targetId: targetId3,
    targetNode: targetNode3,
    sourceKind: sourceKind3,
    incomingEdges: incomingEdges3,
    nodes: nodes3,
  });
}
