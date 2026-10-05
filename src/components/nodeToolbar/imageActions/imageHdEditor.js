import {
  bindAIGenImageModelSelector,
  renderAIGenImageModelSelectorMarkup,
} from '../../aigenImage/modelSelector.js';
import { openCanvasGenerationEditor } from '../../shared/canvasGenerationEditor.js';
import { SEED_VR2_IMAGE_HD_MODEL_ID } from '../../../manifests/image/runninghub/seedVr2ImageHdManifest.js';
import { getImageHdModelIds } from '../../../modules/imageHdModelMenu.js';
export function openImageHdEditor(args) {
  const allowedModelIds = getImageHdModelIds();
  return (
    window['v2FocusOnNode']?.(args['sourceNodeId']),
    openCanvasGenerationEditor({
      ...args,
      modelId: SEED_VR2_IMAGE_HD_MODEL_ID,
      allowedModelIds: allowedModelIds,
      settingsKey: 'imageHdSettings',
      overlayDataKey: 'imageHdEditor',
      renderSelector: renderAIGenImageModelSelectorMarkup,
      bindSelector: bindAIGenImageModelSelector,
      selectorOptions: { allowedWorkflowModelIds: allowedModelIds, showSchemaControls: true },
    })
  );
}
