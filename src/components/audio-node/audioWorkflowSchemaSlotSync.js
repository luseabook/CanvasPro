import { RH_AI_APP_PERSISTENT_ADVANCED_CLASS } from '../shared/rhAiAppNodeBehavior.js';
import { bindModelUiSchemaControls, syncModelUiSchemaControls } from '../aigenImage/uiSchemaRenderer.js';
import {
  applyAudioWorkflowFooterSchemaControls,
  updateAudioModelTriggerIcon,
} from './audioFooterSchemaSlots.js';
function getWorkflowKey(event = {}) {
  return String(event?.key || event?.modelId || '').trim();
}
export function collectAudioWorkflowSchemaSlotElements(modelTrigger) {
  return {
    modelTrigger: modelTrigger?.querySelector?.('.img-model-btn-trigger') || null,
    modeSlot: modelTrigger?.querySelector?.('.ui-schema-mode-slot') || null,
    instanceSlot: modelTrigger?.querySelector?.('.ui-schema-instance-slot') || null,
    batchSlot: modelTrigger?.querySelector?.('.ui-schema-batch-slot') || null,
    advancedPanel: modelTrigger?.querySelector?.('.rh-adv-panel') || null,
    advancedWrap: modelTrigger?.querySelector?.('.rh-adv-wrap') || null,
    advancedButton: modelTrigger?.querySelector?.('.rh-adv-btn') || null,
  };
}
export function closeAudioWorkflowAdvancedPanel(options = {}) {
  if (options?.advancedPanel?.classList?.contains?.(RH_AI_APP_PERSISTENT_ADVANCED_CLASS)) {
    (options.advancedPanel.classList.add('show'),
      options?.advancedButton?.classList?.remove?.('active'),
      options?.advancedButton?.setAttribute?.('aria-expanded', 'true'));
    return;
  }
  (options?.advancedPanel?.classList?.remove?.('show'),
    options?.advancedButton?.classList?.remove?.('active'),
    options?.advancedButton?.setAttribute?.('aria-expanded', 'false'));
}
export function bindAudioWorkflowSchemaSlotControls({
  footer: footer,
  nodeId: nodeId,
  nodeData: nodeData2,
  store: store,
} = {}) {
  return bindModelUiSchemaControls(footer, { nodeId: nodeId, nodeData: nodeData2, store: store });
}
export function syncAudioWorkflowSchemaSlots({
  root: root,
  workflow: workflow,
  nodeData: nodeData = {},
  elements: elements = {},
  lastRenderedWorkflowKey: lastRenderedWorkflowKey = '',
} = {}) {
  const workflowKey = getWorkflowKey(workflow),
    rebuilt = !!workflowKey && lastRenderedWorkflowKey !== workflowKey;
  return (
    rebuilt &&
      (applyAudioWorkflowFooterSchemaControls({
        workflow: workflow,
        nodeData: nodeData,
        modeSlot: elements?.modeSlot,
        advancedPanel: elements?.advancedPanel,
        advancedWrap: elements?.advancedWrap,
        advancedButton: elements?.advancedButton,
        instanceSlot: elements?.instanceSlot,
        batchSlot: elements?.batchSlot,
      }),
      updateAudioModelTriggerIcon(elements?.modelTrigger, workflow)),
    syncModelUiSchemaControls(root, nodeData),
    { rebuilt: rebuilt, lastRenderedWorkflowKey: rebuilt ? workflowKey : lastRenderedWorkflowKey }
  );
}
