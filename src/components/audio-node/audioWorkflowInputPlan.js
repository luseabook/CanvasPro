import { getAudioWorkflowSlots, normalizeAudioWorkflowRefSlots } from './audioWorkflowRefSlots.js';
function getSlotOrder(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((value) => String(value?.slot || '').trim())
    .filter(Boolean);
}
function createSlotItem(payloadRef = {}, origin = 'node') {
  const item = {
    ...payloadRef,
    origin: origin,
    virtual: origin === 'asset',
    refType: 'audio',
    payloadRef: payloadRef,
  };
  if (origin === 'asset') {
    const key = String(payloadRef.assetId || ''),
      index = String(payloadRef.assetIndex ?? '');
    item.sourceId = 'asset:' + key + ':' + index;
  }
  return item;
}
function createAssetAudioPayloadRef(url = {}, refSlot = '') {
  return {
    edgeId: '',
    sourceId: '',
    sourceType: 'asset-audio',
    refSlot: refSlot,
    url: url.url,
    assetId: url.assetId,
    assetIndex: url.itemIndex,
  };
}
function isUsableAudioAssetRef(response = {}) {
  return String(response?.type || '') === 'audio' && !!response?.url;
}
export function buildAudioWorkflowInputPlan({
  workflowKey: workflowKey = '',
  audioRefs: audioRefs = [],
  assetInputRefs: assetInputRefs = [],
} = {}) {
  const slotDefs = getAudioWorkflowSlots(workflowKey),
    slotOrder = getSlotOrder(slotDefs),
    slotItems = Object.fromEntries(slotOrder.map((result) => [result, null])),
    map = new Set(),
    audioRefs2 = [],
    unassignedAudioRefs = [],
    nodeAudioRefs = normalizeAudioWorkflowRefSlots(audioRefs, workflowKey);
  return (
    nodeAudioRefs.forEach((data) => {
      const options = String(data?.refSlot || '').trim();
      audioRefs2.push(data);
      if (!slotOrder.includes(options) || map.has(options)) {
        unassignedAudioRefs.push(data);
        return;
      }
      (map.add(options), (slotItems[options] = createSlotItem(data, 'node')));
    }),
    (Array.isArray(assetInputRefs) ? assetInputRefs : []).forEach((assetOccurrence) => {
      if (!isUsableAudioAssetRef(assetOccurrence)) return;
      const enabled = slotOrder.find((target) => !map.has(target)) || '';
      if (!enabled) return;
      map.add(enabled);
      const args = createAssetAudioPayloadRef(assetOccurrence, enabled);
      (audioRefs2.push(args),
        (slotItems[enabled] = createSlotItem(
          {
            ...args,
            assetOccurrence: assetOccurrence.assetMentionOccurrence,
            assetRefSource: assetOccurrence.assetRefSource || 'prompt',
            assetInputRef: assetOccurrence,
          },
          'asset',
        )));
    }),
    {
      workflowKey: String(workflowKey || '').trim(),
      slotDefs: slotDefs,
      slotOrder: slotOrder,
      slotItems: slotItems,
      audioRefs: audioRefs2,
      nodeAudioRefs: nodeAudioRefs,
      unassignedAudioRefs: unassignedAudioRefs,
    }
  );
}
