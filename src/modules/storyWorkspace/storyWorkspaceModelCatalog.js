import { getModelManifest } from '../../manifests/modelRegistry.js';
import { isVideoAnalysisModel } from '../../manifests/textVideoUnderstanding.js';
import {
  findProjectedModelOption,
  getModelCatalogProviderLabel,
  isPublicModelCatalogEntry,
  projectPublicModelCatalog,
} from '../modelCatalogProjection.js';
const DEFAULT_MODEL_IDS = Object.freeze({
  text: 'volcengine/doubao-seed-2-1-pro-260915',
  image: 'apimart/seedream-5.0-pro',
  video: 'apimart/doubao-seedance-2.0',
});
export const STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS = Object.freeze([
  'runninghub/2084286867645755393',
]);
const STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_ID_SET = new Set(
  STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS,
);
function isStoryWorkspaceManifestEligible(value, enabled) {
  if (!enabled || enabled.kind !== value) return false;
  if (value === 'video' && enabled.provider === 'runninghubwf' && enabled.adapterType === 'workflow')
    return STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_ID_SET.has(enabled.modelId);
  return true;
}
export function isStoryWorkspaceModelVisible(item, key) {
  const index = typeof key === 'string' ? getModelManifest(key) : key;
  return isPublicModelCatalogEntry(item, index) && isStoryWorkspaceManifestEligible(item, index);
}
export function getStoryWorkspaceModelOptions(result) {
  return projectPublicModelCatalog(result, {
    isEligible: (data) => isStoryWorkspaceManifestEligible(result, data),
  });
}
export function isStoryVideoInputTextModel(options) {
  return isVideoAnalysisModel(options);
}
export function getStoryVideoInputTextModelOptions() {
  return getStoryWorkspaceModelOptions('text').filter((target) =>
    isStoryVideoInputTextModel(target.modelId),
  );
}
export function resolveStoryVideoInputTextModelId(source = '') {
  const next = String(source || '').trim();
  if (next && isStoryVideoInputTextModel(next)) return next;
  return getStoryVideoInputTextModelOptions()[0]?.modelId || '';
}
export function resolveStoryWorkspaceModelId(current, entry = '') {
  const record = String(entry || '').trim();
  if (record && isStoryWorkspaceModelVisible(current, record)) return record;
  const payload = DEFAULT_MODEL_IDS[current];
  if (payload && isStoryWorkspaceModelVisible(current, payload)) return payload;
  return getStoryWorkspaceModelOptions(current)[0]?.modelId || '';
}
export function getStoryWorkspaceModelChoice(handle, state = '') {
  const storyWorkspaceModelId = resolveStoryWorkspaceModelId(handle, state);
  return findProjectedModelOption(getStoryWorkspaceModelOptions(handle), storyWorkspaceModelId);
}
export function getStoryWorkspaceProviderLabel(config) {
  return getModelCatalogProviderLabel(config);
}
