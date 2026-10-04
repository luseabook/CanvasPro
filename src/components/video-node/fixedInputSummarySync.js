import appStore from '../../core/stores/appStore.js';
import { getFixedInputSlotConfigFromManifest } from '../../modules/fixedInputAssetRefs.js';
import { buildVideoFixedSlotEntriesForSummary } from './fixedInputSlotHelpers.js';
import { buildRunningHubVideoFixedSlotSummaryPatch } from './runningHubVideoSubmitPayload.js';
function readStoreState() {
  return typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
}
function buildStorePatch(nodeData, patch) {
  const next = { ...patch };
  if (!patch['rhBerniniFunction']) return next;
  const generationParams = {
    ...(nodeData?.['generationParams'] || {}),
    rhBerniniFunction: patch['rhBerniniFunction'],
  };
  next['generationParams'] = generationParams;
  const model = String(nodeData?.['model'] || '')['trim']();
  return (
    model &&
      (next['generationParamsByModel'] = {
        ...(nodeData?.['generationParamsByModel'] || {}),
        [model]: generationParams,
      }),
    next
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
  inEdges = inEdges['filter']((edge) => edge?.['targetId'] === nodeId);
  const model = String(nodeData?.['model'] || '')['trim'](),
    summaryPatch = buildRunningHubVideoFixedSlotSummaryPatch({
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
    changed =
      Object['entries'](summaryPatch)['some'](([key, value]) => nodeData?.[key] !== value) ||
      (summaryPatch['rhBerniniFunction'] &&
        nodeData?.['generationParams']?.['rhBerniniFunction'] !== summaryPatch['rhBerniniFunction']);
  if (!changed)
    return { nodeData: nodeData, fixedInputConfig: fixedInputConfig, inEdges: inEdges, changed: ![] };
  const storePatch = buildStorePatch(nodeData, summaryPatch);
  if (syncStore) appStore['updateNodeData'](nodeId, storePatch);
  return {
    nodeData: { ...nodeData, ...storePatch },
    fixedInputConfig: fixedInputConfig,
    inEdges: inEdges,
    changed: !![],
    patch: storePatch,
  };
}
