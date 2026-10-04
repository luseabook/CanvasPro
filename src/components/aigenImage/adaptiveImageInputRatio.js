import { getGenerationRatioMediaSize } from '../../modules/generationRatioSource.js';
import {
  getTargetInputPolicy,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from '../../modules/modelInputPolicy.js';
function isAdaptiveRatioValue(value) {
  const enabled = String(value || '').trim(),
    item = enabled.toLowerCase();
  return !enabled || enabled === '自适应' || item === 'auto' || item === 'adaptive';
}
function getNodeAspectRatioValue(options = {}) {
  const key = options?.generationParams;
  return key &&
    typeof key === 'object' &&
    !Array.isArray(key) &&
    Object.prototype.hasOwnProperty.call(key, 'aspectRatio')
    ? key.aspectRatio
    : options?.aspectRatio;
}
function buildAdaptiveImageInputSignature(list = [], index = {}, result = {}) {
  return list
    .map((item2) => {
      const list2 = String(item2?.refSlot || '').toLowerCase();
      if (list2.includes('mask')) return '';
      const data = index?.[item2?.sourceId] || null,
        effectiveInputKind = resolveEffectiveInputKind(data, item2);
      if (effectiveInputKind !== 'image' || !isInputKindAllowed(result, effectiveInputKind)) return '';
      const box = getGenerationRatioMediaSize(data, item2, { includeNodeFrame: true });
      return [
        item2?.id,
        item2?.sourceId,
        item2?.refSlot,
        data?._bizRev,
        data?.thumbId,
        box?.width,
        box?.height,
        data?.localPath,
        data?.imageUrl,
        data?.sourceUrl,
      ]
        .map((item3) => item3 || '')
        .join(':');
    })
    .filter(Boolean)
    .join('|');
}
export function syncAdaptiveImageInputRatio(
  enabled2,
  { store: store, nodeId: nodeId, inEdges: inEdges, nodes: nodes, targetNodeData: targetNodeData } = {},
) {
  if (!enabled2 || !store || !nodeId) return;
  const targetInputPolicy = getTargetInputPolicy(targetNodeData || {}),
    adaptiveImageInputSignature = buildAdaptiveImageInputSignature(
      inEdges || [],
      nodes || {},
      targetInputPolicy,
    ),
    enabled3 =
      (enabled2._lastAdaptiveInputSig !== undefined
        ? enabled2._lastAdaptiveInputSig !== adaptiveImageInputSignature
        : Boolean(adaptiveImageInputSignature)) &&
      isAdaptiveRatioValue(getNodeAspectRatioValue(targetNodeData) || '自适应');
  enabled2._lastAdaptiveInputSig = adaptiveImageInputSignature;
  if (!enabled3 || typeof enabled2.runAdaptiveRatio !== 'function') return;
  setTimeout(() => {
    if (store.getState().nodes[nodeId]) enabled2.runAdaptiveRatio();
  }, 50);
}
