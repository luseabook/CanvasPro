import {
  findProjectedModelOption,
  isPublicModelCatalogEntry,
  projectPublicModelCatalog,
} from '../modelCatalogProjection.js';
export const STORYBOARD_3D_DEFAULT_TEXT_MODEL_ID = 'volcengine/doubao-seed-2-1-pro-260915';
function normalizeText(value) {
  return String(value || '').trim();
}
export function isStoryboard3DTextModelVisible(item) {
  return isPublicModelCatalogEntry('text', item);
}
export function getStoryboard3DTextModelOptions() {
  return projectPublicModelCatalog('text');
}
export function getStoryboard3DTextModelIds() {
  return getStoryboard3DTextModelOptions().map((key) => key.modelId);
}
export function resolveStoryboard3DTextModelSelection(index = '') {
  const storyboard3DTextModelOptions = getStoryboard3DTextModelOptions(),
    projectedModelOption =
      findProjectedModelOption(storyboard3DTextModelOptions, normalizeText(index)) ||
      findProjectedModelOption(storyboard3DTextModelOptions, STORYBOARD_3D_DEFAULT_TEXT_MODEL_ID) ||
      storyboard3DTextModelOptions[0] ||
      null;
  return {
    modelId: projectedModelOption?.modelId || '',
    provider: projectedModelOption?.provider || '',
  };
}
