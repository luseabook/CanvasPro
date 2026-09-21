import {
  buildFixedInputAssetSlotMap,
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
export function buildVideoFixedSlotEntriesForSummary({
  fixedInputConfig: _0x1ae38c,
  inEdges: inEdges = [],
  nodes: nodes = {},
  promptEl: promptEl = null,
  nodeData: nodeData = {},
} = {}) {
  if (!_0x1ae38c) return {};
  const _0x394bfc = {};
  for (const _0x6180bd of Array.isArray(inEdges) ? inEdges : []) {
    const _0x4a5b4c = nodes?.[_0x6180bd?.sourceId];
    if (!_0x4a5b4c) continue;
    const _0x2927b6 = resolveEffectiveInputKind(_0x4a5b4c, _0x6180bd),
      { slot: _0x3d486b } = resolveFixedInputSlotForRef({
        fixedInputConfig: _0x1ae38c,
        refSlot: _0x6180bd?.refSlot,
        kind: _0x2927b6,
        occupiedSlots: _0x394bfc,
        sourceNode: _0x4a5b4c,
      });
    _0x3d486b &&
      !_0x394bfc[_0x3d486b] &&
      (_0x394bfc[_0x3d486b] = { url: 'connected', node: _0x4a5b4c, edge: _0x6180bd });
  }
  const _0x2496d6 = new Set(Object.keys(_0x394bfc)),
    _0x4b13a0 = buildFixedInputAssetSlotMap(promptEl, {
      slotOrderByType: _0x1ae38c.slotOrderByType,
      visibleSlots: _0x1ae38c.visibleSlots,
      exclusiveGroups: _0x1ae38c.exclusiveGroups,
      slotById: _0x1ae38c.slotById,
      occupiedSlots: _0x2496d6,
      nodeData: nodeData,
    });
  return (
    Object.entries(_0x4b13a0).forEach(([_0x554496, _0x4dabcc]) => {
      !_0x394bfc[_0x554496] && _0x4dabcc && (_0x394bfc[_0x554496] = { url: 'connected', ref: _0x4dabcc });
    }),
    _0x394bfc
  );
}
export function getFixedInputSlotKind(_0x26cd6a, _0x50efb3) {
  const _0x3644e6 = String(_0x50efb3 || '').trim(),
    _0x4bc262 = getFixedInputSlotConfigFromManifest(_0x26cd6a || {}),
    _0x47b9a4 = String(_0x4bc262?.slotKindById?.[_0x3644e6] || '').trim();
  if (_0x47b9a4) return _0x47b9a4;
  if (_0x3644e6 === 'audio' || _0x3644e6.startsWith('audio')) return 'audio';
  if (_0x3644e6 === 'sourceVideo' || _0x3644e6 === 'videoMask') return 'video';
  if (_0x3644e6 === 'refImage' || _0x3644e6 === 'firstFrame') return 'image';
  return '';
}
export function getFixedInputSlotsToReplace(_0x41e14b, _0x259523) {
  const _0x2ed76f = String(_0x259523 || '').trim(),
    _0x5e29de = getFixedInputSlotConfigFromManifest(_0x41e14b || {}),
    _0x2f7c97 = getExclusiveSlotsForFixedSlot(_0x5e29de?.exclusiveGroups, _0x2ed76f);
  return new Set(_0x2f7c97.length ? _0x2f7c97 : [_0x2ed76f].filter(Boolean));
}
export function getFixedInputAcceptForKind(_0x482b96) {
  if (_0x482b96 === 'image') return 'image/*';
  if (_0x482b96 === 'video') return 'video/*';
  if (_0x482b96 === 'audio') return 'audio/*';
  return '*/*';
}
