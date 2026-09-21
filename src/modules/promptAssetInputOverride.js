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
function getAudioWorkflowKey(_0x33ee8e = {}) {
  const _0x135658 = String(_0x33ee8e?.audioWorkflowKey || '').trim();
  if (_0x135658) return _0x135658;
  const _0x1875c9 = String(_0x33ee8e?.model || '').trim();
  return _0x1875c9;
}
function getSlotsFromOrder(_0x168a7f = {}) {
  return Array.from(
    new Set(
      Object.values(_0x168a7f)
        .flat()
        .map((_0x48f65f) => String(_0x48f65f || ''))
        .filter(Boolean),
    ),
  );
}
function getFixedAssetSlotConfig(_0x8faf86 = {}) {
  const _0x3663c2 = String(_0x8faf86?.type || '').trim(),
    _0x21923e = String(_0x8faf86?.model || '').trim();
  if (_0x3663c2 === 'ai-video' || _0x3663c2 === 'ai-image') {
    const _0xf1aa9d = getFixedInputSlotConfigFromManifest(_0x8faf86);
    if (_0xf1aa9d)
      return {
        slotOrderByType: _0xf1aa9d.slotOrderByType,
        visibleSlots: _0xf1aa9d.visibleSlots,
        slotKindById: _0xf1aa9d.slotKindById,
        exclusiveGroups: _0xf1aa9d.exclusiveGroups,
      };
  }
  if (_0x3663c2 === 'ai-image' && isRhPersonReplaceWorkflowModel(_0x21923e))
    return {
      slotOrderByType: RH_PERSON_REPLACE_ASSET_SLOT_ORDER,
      visibleSlots: ['replaceTarget', 'replacedImage'],
    };
  if (_0x3663c2 === 'ai-audio') {
    const _0x26111f = getAudioWorkflowKey(_0x8faf86),
      _0x55671b = getFixedInputSlotConfigFromManifest({
        ..._0x8faf86,
        audioWorkflowKey: _0x26111f,
        model: _0x26111f,
      });
    if (_0x55671b)
      return {
        slotOrderByType: _0x55671b.slotOrderByType,
        visibleSlots: _0x55671b.visibleSlots,
        slotKindById: _0x55671b.slotKindById,
        exclusiveGroups: _0x55671b.exclusiveGroups,
      };
    const _0xa01182 = getModelManifest(_0x26111f)?.inputSlots?.fixedSlots,
      _0x27f6fa =
        Array.isArray(_0xa01182) && _0xa01182.length
          ? _0xa01182.map((_0x1ef0fd) => String(_0x1ef0fd?.id || '').trim()).filter(Boolean)
          : ['audioRef'];
    return { slotOrderByType: { audio: _0x27f6fa }, visibleSlots: _0x27f6fa };
  }
  return null;
}
function getIncomingEdges(_0xd6f481 = '', _0x1b3a31 = null) {
  if (Array.isArray(_0x1b3a31)) return _0x1b3a31;
  if (!_0xd6f481) return [];
  return appStore.getIncomingEdges?.(_0xd6f481) || [];
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
  const _0x546b32 = new Set(
      Array.isArray(visibleSlots) && visibleSlots.length
        ? visibleSlots.map(String)
        : getSlotsFromOrder(slotOrderByType),
    ),
    _0x2c8188 = {};
  return (
    (Array.isArray(incomingEdges) ? incomingEdges : []).forEach((_0x2224ef) => {
      const _0x30baa4 = resolveEffectiveInputKind(nodes?.[_0x2224ef?.sourceId], _0x2224ef),
        { slot: _0x54545c } = resolveFixedInputSlotForRef({
          fixedInputConfig: {
            slotOrderByType: slotOrderByType,
            visibleSlots: Array.from(_0x546b32),
            slotKindById: slotKindById,
            exclusiveGroups: exclusiveGroups,
            slotById: slotById,
          },
          refSlot: _0x2224ef?.refSlot,
          kind: _0x30baa4,
          occupiedSlots: _0x2c8188,
          sourceNode: nodes?.[_0x2224ef?.sourceId],
        });
      if (_0x54545c) _0x2c8188[_0x54545c] = _0x2224ef;
    }),
    new Set(Object.keys(_0x2c8188))
  );
}
function removeGenericOverflowAssetRefs({
  targetId: _0x1c5e5f,
  targetNode: _0x205c48,
  sourceKind: _0x438390,
  incomingEdges: _0x537f65,
  nodes: _0x396bc1,
} = {}) {
  const _0x4b5872 = getTargetInputPolicy(_0x205c48),
    _0x3c038c = Number(_0x4b5872?.maxByKind?.[_0x438390]);
  if (!Number.isFinite(_0x3c038c) || _0x3c038c <= 0) return false;
  const _0x57f884 = (Array.isArray(_0x537f65) ? _0x537f65 : []).filter(
    (_0x2d9708) => resolveEffectiveInputKind(_0x396bc1?.[_0x2d9708?.sourceId], _0x2d9708) === _0x438390,
  ).length;
  let _0x162668 =
      _0x57f884 +
      getAssetInputRefsFromNodeData(_0x205c48, { allowedTypes: [_0x438390] }).length +
      1 -
      _0x3c038c,
    _0x129c88 = false;
  while (_0x162668 > 0) {
    const _0x17e442 = appStore.getState?.()?.nodes?.[_0x1c5e5f] || _0x205c48,
      _0x3fa018 = getAssetInputRefsFromNodeData(_0x17e442, { allowedTypes: [_0x438390] })[0];
    if (!_0x3fa018) break;
    ((_0x129c88 = removeAssetInputRefFromNodeData(_0x1c5e5f, _0x3fa018) || _0x129c88), (_0x162668 -= 1));
  }
  return _0x129c88;
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
  const _0xc738c3 = String(targetId || targetNode?.id || '').trim();
  if (!_0xc738c3) return false;
  const _0x5bee63 = appStore.getState?.() || {},
    _0x3b0a29 = nodes || _0x5bee63.nodes || {},
    _0x16b16c = _0x5bee63.nodes?.[_0xc738c3] || targetNode || {},
    _0x51cb6c = getFixedAssetSlotConfig(_0x16b16c);
  if (!isRunningHubWorkflowNode(_0x16b16c) && !_0x51cb6c) return false;
  const _0xe4fea9 = resolveEffectiveInputKind(sourceNode) || normalizeInputKind(sourceKind || '');
  if (_0xe4fea9 !== 'image' && _0xe4fea9 !== 'video' && _0xe4fea9 !== 'audio') return false;
  const _0x4629d7 = getIncomingEdges(_0xc738c3, incomingEdges),
    _0x25d43f = String(refSlot || '').trim();
  if (_0x51cb6c && _0x25d43f) {
    const _0x119aa1 = _0x51cb6c.slotOrderByType?.[_0xe4fea9];
    if (Array.isArray(_0x119aa1) && _0x119aa1.includes(_0x25d43f)) {
      const _0x52ecfe = assignOccupiedFixedSlots({
          incomingEdges: _0x4629d7,
          nodes: _0x3b0a29,
          slotOrderByType: _0x51cb6c.slotOrderByType,
          visibleSlots: _0x51cb6c.visibleSlots,
          slotKindById: _0x51cb6c.slotKindById,
          exclusiveGroups: _0x51cb6c.exclusiveGroups,
          slotById: _0x51cb6c.slotById,
        }),
        _0x20abb4 = getAssetInputRefsFromNodeData(_0x16b16c, {
          allowedTypes: Object.keys(_0x51cb6c.slotOrderByType || {}),
        }),
        _0x5beed2 = buildFixedInputAssetSlotMapFromRefs(_0x20abb4, {
          slotOrderByType: _0x51cb6c.slotOrderByType,
          visibleSlots: _0x51cb6c.visibleSlots,
          exclusiveGroups: _0x51cb6c.exclusiveGroups,
          slotById: _0x51cb6c.slotById,
          occupiedSlots: _0x52ecfe,
        }),
        _0x208bb6 = getExclusiveSlotsForFixedSlot(_0x51cb6c.exclusiveGroups, _0x25d43f);
      for (const _0x5c0511 of _0x208bb6) {
        const _0x274a92 = _0x5beed2[_0x5c0511],
          _0x496ecb = _0x51cb6c.slotKindById?.[_0x5c0511] || _0x274a92?.type || '';
        if (_0x274a92 && _0x274a92.type === _0x496ecb)
          return removeAssetInputRefFromNodeData(_0xc738c3, _0x274a92);
      }
    }
  }
  return removeGenericOverflowAssetRefs({
    targetId: _0xc738c3,
    targetNode: _0x16b16c,
    sourceKind: _0xe4fea9,
    incomingEdges: _0x4629d7,
    nodes: _0x3b0a29,
  });
}
