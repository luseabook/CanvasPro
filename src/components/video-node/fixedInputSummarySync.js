import appStore from '../../core/stores/appStore.js';
import { getFixedInputSlotConfigFromManifest } from '../../modules/fixedInputAssetRefs.js';
import { buildVideoFixedSlotEntriesForSummary } from './fixedInputSlotHelpers.js';
import { buildRunningHubVideoFixedSlotSummaryPatch } from './runningHubVideoSubmitPayload.js';
function readStoreState() {
  return typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
}
function buildStorePatch(value, rhBerniniFunction) {
  const item = { ...rhBerniniFunction };
  if (!rhBerniniFunction['rhBerniniFunction']) return item;
  const key = {
    ...(value?.['generationParams'] || {}),
    rhBerniniFunction: rhBerniniFunction['rhBerniniFunction'],
  };
  item['generationParams'] = key;
  const index = String(value?.['model'] || '')['trim']();
  return (
    index &&
      (item['generationParamsByModel'] = {
        ...(value?.['generationParamsByModel'] || {}),
        [index]: key,
      }),
    item
  );
}
export function syncVideoNodeFixedInputSummary({
  nodeId: nodeId,
  nodeData: nodeData = {},
  promptEl: promptEl = null,
  syncStore: syncStore = ![],
} = {}) {
  const fixedInputConfig = getFixedInputSlotConfigFromManifest(nodeData || {});
  let inEdges = appStore['getIncomingEdges'](nodeId);
  if (!fixedInputConfig)
    return { nodeData: nodeData, fixedInputConfig: null, inEdges: inEdges, changed: ![] };
  inEdges = inEdges['filter']((result) => result?.['targetId'] === nodeId);
  const model = String(nodeData?.['model'] || '')['trim'](),
    runningHubVideoFixedSlotSummaryPatch = buildRunningHubVideoFixedSlotSummaryPatch({
      model: model,
      nodeData: nodeData,
      slotEntries: buildVideoFixedSlotEntriesForSummary({
        fixedInputConfig: fixedInputConfig,
        inEdges: inEdges,
        nodes: readStoreState()['nodes'] || {},
        promptEl: promptEl,
        nodeData: nodeData,
      }),
    }),
    enabled =
      Object['entries'](runningHubVideoFixedSlotSummaryPatch)['some'](
        ([data, options]) => nodeData?.[data] !== options,
      ) ||
      (runningHubVideoFixedSlotSummaryPatch['rhBerniniFunction'] &&
        nodeData?.['generationParams']?.['rhBerniniFunction'] !==
          runningHubVideoFixedSlotSummaryPatch['rhBerniniFunction']);
  if (!enabled)
    return { nodeData: nodeData, fixedInputConfig: fixedInputConfig, inEdges: inEdges, changed: ![] };
  const patch = buildStorePatch(nodeData, runningHubVideoFixedSlotSummaryPatch);
  if (syncStore) appStore['updateNodeData'](nodeId, patch);
  return {
    nodeData: { ...nodeData, ...patch },
    fixedInputConfig: fixedInputConfig,
    inEdges: inEdges,
    changed: !![],
    patch: patch,
  };
}
