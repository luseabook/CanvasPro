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
function workflowServiceText(_0x3ef179, _0x145e4b = {}) {
  return t('workflows.service.' + _0x3ef179, _0x145e4b);
}
async function persistCoverIfNeeded(_0x1fcb27) {
  if (!_0x1fcb27 || !isDataImageCover(_0x1fcb27.cover) || isSvgDataImageCover(_0x1fcb27.cover))
    return _0x1fcb27;
  const _0x31036b = await saveWorkflowThumbToServer({ workflowId: _0x1fcb27.id, dataUrl: _0x1fcb27.cover }),
    _0x29bbb3 = String(_0x31036b?.url || '').trim() || localPathToUrl(pickResultLocalPath(_0x31036b));
  return _0x29bbb3 ? { ..._0x1fcb27, cover: _0x29bbb3 } : _0x1fcb27;
}
export async function loadWorkflowsFromServer() {
  const _0x52bdcb = await fetchWorkflowsFromServer();
  return normalizeWorkflowList(_0x52bdcb);
}
export async function saveNewWorkflowFromCanvas(_0x4a5831, _0x50e4cb) {
  const _0x3c076c = createWorkflowFromCanvas(_0x4a5831, _0x50e4cb),
    _0x5bd410 = await persistCoverIfNeeded(_0x3c076c);
  return (await saveWorkflowToServer(_0x5bd410), normalizeWorkflowEntity(_0x5bd410));
}
export async function saveUpdatedWorkflowFromCanvas(_0x5dd8b4, _0x308e81, _0x33cde6) {
  const _0x4ca3ae = updateWorkflowFromCanvas(_0x5dd8b4, _0x308e81, _0x33cde6),
    _0x51db6b = await persistCoverIfNeeded(_0x4ca3ae);
  return (await saveWorkflowToServer(_0x51db6b), normalizeWorkflowEntity(_0x51db6b));
}
export async function saveWorkflowMeta(_0x2dd054, _0x3bc241) {
  const _0x1f2d5d = normalizeWorkflowMeta(_0x3bc241, _0x2dd054);
  if (!_0x1f2d5d.name) throw new Error(workflowServiceText('nameRequired'));
  const _0x2df204 = normalizeWorkflowEntity({ ...(_0x2dd054 || {}), ..._0x1f2d5d, updatedAt: Date.now() });
  if (!_0x2df204?.id) throw new Error(workflowServiceText('workflowMissing'));
  const _0x17f785 = await persistCoverIfNeeded(_0x2df204);
  return (await saveWorkflowToServer(_0x17f785), normalizeWorkflowEntity(_0x17f785));
}
export async function saveWorkflowUsage(_0x255b93, _0x793f36 = Date.now()) {
  const _0x49333b = normalizeWorkflowEntity({ ...(_0x255b93 || {}), lastUsedAt: _0x793f36 });
  if (!_0x49333b) return null;
  return (await saveWorkflowToServer(_0x49333b), _0x49333b);
}
export async function renameWorkflow(_0x18c79a, _0x1bded1) {
  const _0x1d11a5 = String(_0x1bded1 || '').trim();
  if (!_0x1d11a5) throw new Error(workflowServiceText('nameRequired'));
  const _0x273d2f = normalizeWorkflowEntity({ ...(_0x18c79a || {}), name: _0x1d11a5, updatedAt: Date.now() });
  if (!_0x273d2f?.id) throw new Error(workflowServiceText('workflowMissing'));
  return (await saveWorkflowToServer(_0x273d2f), _0x273d2f);
}
export async function deleteWorkflow(_0x48c38b) {
  const _0x527b2a = String(_0x48c38b || '').trim();
  if (!_0x527b2a) throw new Error(workflowServiceText('workflowMissing'));
  const _0x1309a9 = await deleteWorkflowFromServer(_0x527b2a);
  if (!_0x1309a9) throw new Error(workflowServiceText('deleteFailed'));
  return true;
}
