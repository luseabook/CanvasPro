import appStore from '../../core/stores/appStore.js';
import { getFixedInputSlotConfigFromManifest } from '../../modules/fixedInputAssetRefs.js';
import { buildVideoFixedSlotEntriesForSummary } from './fixedInputSlotHelpers.js';
import { buildRunningHubVideoFixedSlotSummaryPatch } from './runningHubVideoSubmitPayload.js';
function readStoreState() {
  return typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
}
function buildStorePatch(_0x161787, _0x3bdae3) {
  const _0xaf6e56 = { ..._0x3bdae3 };
  if (!_0x3bdae3['rhBerniniFunction']) return _0xaf6e56;
  const _0x191f09 = {
    ...(_0x161787?.['generationParams'] || {}),
    rhBerniniFunction: _0x3bdae3['rhBerniniFunction'],
  };
  _0xaf6e56['generationParams'] = _0x191f09;
  const _0x420ed5 = String(_0x161787?.['model'] || '')['trim']();
  return (
    _0x420ed5 &&
      (_0xaf6e56['generationParamsByModel'] = {
        ...(_0x161787?.['generationParamsByModel'] || {}),
        [_0x420ed5]: _0x191f09,
      }),
    _0xaf6e56
  );
}
export function syncVideoNodeFixedInputSummary({
  nodeId: _0x57d700,
  nodeData: nodeData = {},
  promptEl: promptEl = null,
  syncStore: syncStore = ![],
} = {}) {
  const _0x124dd7 = getFixedInputSlotConfigFromManifest(nodeData || {});
  let _0x1ea3e8 = appStore['getIncomingEdges'](_0x57d700);
  if (!_0x124dd7) return { nodeData: nodeData, fixedInputConfig: null, inEdges: _0x1ea3e8, changed: ![] };
  _0x1ea3e8 = _0x1ea3e8['filter']((_0x5825c2) => _0x5825c2?.['targetId'] === _0x57d700);
  const _0x7ae081 = String(nodeData?.['model'] || '')['trim'](),
    _0x156aa3 = buildRunningHubVideoFixedSlotSummaryPatch({
      model: _0x7ae081,
      nodeData: nodeData,
      slotEntries: buildVideoFixedSlotEntriesForSummary({
        fixedInputConfig: _0x124dd7,
        inEdges: _0x1ea3e8,
        nodes: readStoreState()['nodes'] || {},
        promptEl: promptEl,
        nodeData: nodeData,
      }),
    }),
    _0x376830 =
      Object['entries'](_0x156aa3)['some'](([_0x80cc98, _0x51e143]) => nodeData?.[_0x80cc98] !== _0x51e143) ||
      (_0x156aa3['rhBerniniFunction'] &&
        nodeData?.['generationParams']?.['rhBerniniFunction'] !== _0x156aa3['rhBerniniFunction']);
  if (!_0x376830)
    return { nodeData: nodeData, fixedInputConfig: _0x124dd7, inEdges: _0x1ea3e8, changed: ![] };
  const _0x53e31a = buildStorePatch(nodeData, _0x156aa3);
  if (syncStore) appStore['updateNodeData'](_0x57d700, _0x53e31a);
  return {
    nodeData: { ...nodeData, ..._0x53e31a },
    fixedInputConfig: _0x124dd7,
    inEdges: _0x1ea3e8,
    changed: !![],
    patch: _0x53e31a,
  };
}
