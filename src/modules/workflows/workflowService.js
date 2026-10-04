import {
  deleteWorkflowFromServer,
  fetchWorkflowsFromServer,
  saveWorkflowThumbToServer,
  saveWorkflowToServer,
} from '../../../api/projectsV2Api.js';
import {
  createWorkflowFromCanvas,
  normalizeWorkflowMeta,
  updateWorkflowFromCanvas,
} from './workflowCanvas.js';
import { isDataImageCover, isSvgDataImageCover } from './workflowCovers.js';
import { normalizeWorkflowEntity, normalizeWorkflowList } from './workflowSelectors.js';
import { localPathToUrl, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
function workflowServiceText(value, item = {}) {
  return t('workflows.service.' + value, item);
}
async function persistCoverIfNeeded(workflowId) {
  if (!workflowId || !isDataImageCover(workflowId.cover) || isSvgDataImageCover(workflowId.cover))
    return workflowId;
  const response = await saveWorkflowThumbToServer({ workflowId: workflowId.id, dataUrl: workflowId.cover }),
    cover = String(response?.url || '').trim() || localPathToUrl(pickResultLocalPath(response));
  return cover ? { ...workflowId, cover: cover } : workflowId;
}
export async function loadWorkflowsFromServer() {
  const fetchWorkflowsFromServer2 = await fetchWorkflowsFromServer();
  return normalizeWorkflowList(fetchWorkflowsFromServer2);
}
export async function saveNewWorkflowFromCanvas(key, index) {
  const workflowFromCanvas = createWorkflowFromCanvas(key, index),
    persistCoverIfNeeded2 = await persistCoverIfNeeded(workflowFromCanvas);
  return (await saveWorkflowToServer(persistCoverIfNeeded2), normalizeWorkflowEntity(persistCoverIfNeeded2));
}
export async function saveUpdatedWorkflowFromCanvas(result, data, options) {
  const updateWorkflowFromCanvas2 = updateWorkflowFromCanvas(result, data, options),
    persistCoverIfNeeded3 = await persistCoverIfNeeded(updateWorkflowFromCanvas2);
  return (await saveWorkflowToServer(persistCoverIfNeeded3), normalizeWorkflowEntity(persistCoverIfNeeded3));
}
export async function saveWorkflowMeta(target, source) {
  const error = normalizeWorkflowMeta(source, target);
  if (!error.name) throw new Error(workflowServiceText('nameRequired'));
  const workflowEntity = normalizeWorkflowEntity({ ...(target || {}), ...error, updatedAt: Date.now() });
  if (!workflowEntity?.id) throw new Error(workflowServiceText('workflowMissing'));
  const persistCoverIfNeeded4 = await persistCoverIfNeeded(workflowEntity);
  return (await saveWorkflowToServer(persistCoverIfNeeded4), normalizeWorkflowEntity(persistCoverIfNeeded4));
}
export async function saveWorkflowUsage(next, lastUsedAt = Date.now()) {
  const workflowEntity2 = normalizeWorkflowEntity({ ...(next || {}), lastUsedAt: lastUsedAt });
  if (!workflowEntity2) return null;
  return (await saveWorkflowToServer(workflowEntity2), workflowEntity2);
}
export async function renameWorkflow(current, entry) {
  const name = String(entry || '').trim();
  if (!name) throw new Error(workflowServiceText('nameRequired'));
  const workflowEntity3 = normalizeWorkflowEntity({ ...(current || {}), name: name, updatedAt: Date.now() });
  if (!workflowEntity3?.id) throw new Error(workflowServiceText('workflowMissing'));
  return (await saveWorkflowToServer(workflowEntity3), workflowEntity3);
}
export async function deleteWorkflow(record) {
  const enabled = String(record || '').trim();
  if (!enabled) throw new Error(workflowServiceText('workflowMissing'));
  const deleteWorkflowFromServer2 = await deleteWorkflowFromServer(enabled);
  if (!deleteWorkflowFromServer2) throw new Error(workflowServiceText('deleteFailed'));
  return true;
}
