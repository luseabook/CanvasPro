import {
  bindAIGenImageModelSelector,
  renderAIGenImageModelSelectorMarkup,
} from '../../aigenImage/modelSelector.js';
import { openCanvasGenerationEditor } from '../../shared/canvasGenerationEditor.js';
import { SEED_VR2_IMAGE_HD_MODEL_ID } from '../../../manifests/image/runninghub/seedVr2ImageHdManifest.js';
import { getImageHdModelIds } from '../../../modules/imageHdModelMenu.js';
export function openImageHdEditor(_0x1099a5) {
  const _0x5b1e19 = getImageHdModelIds();
  return (
    window['v2FocusOnNode']?.(_0x1099a5['sourceNodeId']),
    openCanvasGenerationEditor({
      ..._0x1099a5,
      modelId: SEED_VR2_IMAGE_HD_MODEL_ID,
      allowedModelIds: _0x5b1e19,
      settingsKey: 'imageHdSettings',
      overlayDataKey: 'imageHdEditor',
      renderSelector: renderAIGenImageModelSelectorMarkup,
      bindSelector: bindAIGenImageModelSelector,
      selectorOptions: { allowedWorkflowModelIds: _0x5b1e19, showSchemaControls: !![] },
    })
  );
}
