import { RH_AI_APP_PERSISTENT_ADVANCED_CLASS } from '../shared/rhAiAppNodeBehavior.js';
import { bindModelUiSchemaControls, syncModelUiSchemaControls } from '../aigenImage/uiSchemaRenderer.js';
import {
  applyAudioWorkflowFooterSchemaControls,
  updateAudioModelTriggerIcon,
} from './audioFooterSchemaSlots.js';
function getWorkflowKey(_0x1203d1 = {}) {
  return String(_0x1203d1?.['key'] || _0x1203d1?.['modelId'] || '')['trim']();
}
export function collectAudioWorkflowSchemaSlotElements(_0x1b6cde) {
  return {
    modelTrigger: _0x1b6cde?.['querySelector']?.('.img-model-btn-trigger') || null,
    modeSlot: _0x1b6cde?.['querySelector']?.('.ui-schema-mode-slot') || null,
    instanceSlot: _0x1b6cde?.['querySelector']?.('.ui-schema-instance-slot') || null,
    batchSlot: _0x1b6cde?.['querySelector']?.('.ui-schema-batch-slot') || null,
    advancedPanel: _0x1b6cde?.['querySelector']?.('.rh-adv-panel') || null,
    advancedWrap: _0x1b6cde?.['querySelector']?.('.rh-adv-wrap') || null,
    advancedButton: _0x1b6cde?.['querySelector']?.('.rh-adv-btn') || null,
  };
}
export function closeAudioWorkflowAdvancedPanel(_0x3e97d9 = {}) {
  if (_0x3e97d9?.['advancedPanel']?.['classList']?.['contains']?.(RH_AI_APP_PERSISTENT_ADVANCED_CLASS)) {
    (_0x3e97d9['advancedPanel']['classList']['add']('show'),
      _0x3e97d9?.['advancedButton']?.['classList']?.['remove']?.('active'),
      _0x3e97d9?.['advancedButton']?.['setAttribute']?.('aria-expanded', 'true'));
    return;
  }
  (_0x3e97d9?.['advancedPanel']?.['classList']?.['remove']?.('show'),
    _0x3e97d9?.['advancedButton']?.['classList']?.['remove']?.('active'),
    _0x3e97d9?.['advancedButton']?.['setAttribute']?.('aria-expanded', 'false'));
}
export function bindAudioWorkflowSchemaSlotControls({
  footer: _0x4badbd,
  nodeId: _0x98881c,
  nodeData: _0xb89e44,
  store: _0x1b6459,
} = {}) {
  return bindModelUiSchemaControls(_0x4badbd, { nodeId: _0x98881c, nodeData: _0xb89e44, store: _0x1b6459 });
}
export function syncAudioWorkflowSchemaSlots({
  root: _0x2dc12a,
  workflow: _0x348848,
  nodeData: nodeData = {},
  elements: elements = {},
  lastRenderedWorkflowKey: lastRenderedWorkflowKey = '',
} = {}) {
  const _0x262a51 = getWorkflowKey(_0x348848),
    _0x75853b = !!_0x262a51 && lastRenderedWorkflowKey !== _0x262a51;
  return (
    _0x75853b &&
      (applyAudioWorkflowFooterSchemaControls({
        workflow: _0x348848,
        nodeData: nodeData,
        modeSlot: elements?.['modeSlot'],
        advancedPanel: elements?.['advancedPanel'],
        advancedWrap: elements?.['advancedWrap'],
        advancedButton: elements?.['advancedButton'],
        instanceSlot: elements?.['instanceSlot'],
        batchSlot: elements?.['batchSlot'],
      }),
      updateAudioModelTriggerIcon(elements?.['modelTrigger'], _0x348848)),
    syncModelUiSchemaControls(_0x2dc12a, nodeData),
    { rebuilt: _0x75853b, lastRenderedWorkflowKey: _0x75853b ? _0x262a51 : lastRenderedWorkflowKey }
  );
}
