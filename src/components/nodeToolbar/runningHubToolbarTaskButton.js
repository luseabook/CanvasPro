import { cancelRunningHubTask } from '../../../api/runninghubTaskApi.js';
import { ensureConfig, getProviderConfig } from '../../../api/configApi.js';
import appStore from '../../core/stores/appStore.js';
import { isTaskCancelled, isTaskRunning } from '../../core/generationTaskUiState.js';
import { cancelTask as cancelTask_2 } from '../../core/generationTaskRuntime.js';
import { GENERATE_CANCEL_ICON_HTML } from '../../modules/previewGenerateButtonUi.js';
import { normalizeProviderId, resolveModelExecution } from '../../manifests/index.js';
import {
  bindToolbarTaskButton,
  findToolbarTaskForNode,
  notifyToolbarTasksChanged,
} from '../shared/taskToolbarPresenter.js';
import { t } from '../../i18n/index.js';
export const RUNNING_HUB_TOOLBAR_TASK_EVENT = 'aicanvas:runninghub-toolbar-task-change';
export const RUNNING_HUB_CANCEL_ICON_HTML = GENERATE_CANCEL_ICON_HTML;
function toolbarText(_0x46f3ae, _0x201550 = {}) {
  return t('nodeToolbar.common.' + _0x46f3ae, _0x201550);
}
function getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function normalizeList(_0x24c2cc) {
  return Array.isArray(_0x24c2cc)
    ? _0x24c2cc.map((_0x3fc7d8) => String(_0x3fc7d8 || '').trim()).filter(Boolean)
    : [];
}
function includesAny(_0x2f6c0c, _0x61f97c) {
  const _0x453d12 = String(_0x2f6c0c || '');
  return _0x61f97c.some((_0x2ca191) => _0x453d12.includes(_0x2ca191));
}
function getTaskTime(_0x15c543) {
  return Number(_0x15c543?.rhTaskStartedAt || _0x15c543?.generationStartTime || 0) || 0;
}
function isRunningHubTaskProvider(_0x4f52c3) {
  const _0x46bbcd = normalizeProviderId(_0x4f52c3?.provider);
  if (_0x46bbcd === 'runninghubwf' || _0x46bbcd === 'runninghub') return true;
  const _0x20b226 = String(_0x4f52c3?.model || '').trim();
  if (!_0x20b226) return false;
  const _0x197781 = resolveModelExecution(_0x20b226, { providerHint: _0x46bbcd }),
    _0x5934cb = normalizeProviderId(_0x197781?.modelManifest?.provider),
    _0x286181 = normalizeProviderId(_0x197781?.executionManifest?.provider);
  return (
    _0x5934cb === 'runninghubwf' ||
    _0x5934cb === 'runninghub' ||
    _0x286181 === 'runninghubwf' ||
    _0x286181 === 'runninghub'
  );
}
function hasRunningHubTaskMarker(_0x2d3ecb) {
  return (
    isRunningHubTaskProvider(_0x2d3ecb) ||
    !!String(_0x2d3ecb?.rhTaskId || '').trim() ||
    !!String(_0x2d3ecb?.rhTaskStatus || '').trim() ||
    !!String(_0x2d3ecb?.rhSourceNodeId || '').trim() ||
    !!String(_0x2d3ecb?.rhToolbarTaskType || '').trim()
  );
}
export function notifyRunningHubToolbarTasksChanged(_0x387222 = {}) {
  notifyToolbarTasksChanged(_0x387222, { eventName: RUNNING_HUB_TOOLBAR_TASK_EVENT });
}
export function isRunningHubToolbarTaskNode(_0xd0d5a3) {
  if (!_0xd0d5a3 || typeof _0xd0d5a3 !== 'object') return false;
  return hasRunningHubTaskMarker(_0xd0d5a3) && isTaskRunning(_0xd0d5a3);
}
export function isRunningHubToolbarTaskCancelled(_0x3a5222) {
  const _0x28891a = String(_0x3a5222 || '').trim();
  if (!_0x28891a) return false;
  const _0x415795 = getStateSnapshot().nodes?.[_0x28891a];
  return hasRunningHubTaskMarker(_0x415795) && isTaskCancelled(_0x415795);
}
export function findRunningHubToolbarTaskForNode(
  _0x13a823,
  {
    models: models = [],
    taskTypes: taskTypes = [],
    outputTextIncludes: outputTextIncludes = [],
    nameIncludes: nameIncludes = [],
    sourceField: sourceField = 'rhSourceNodeId',
  } = {},
) {
  const _0x223c4a = findToolbarTaskForNode(_0x13a823, {
    models: models,
    taskTypes: taskTypes,
    outputTextIncludes: outputTextIncludes,
    nameIncludes: nameIncludes,
    sourceField: sourceField,
    taskTypeField: 'rhToolbarTaskType',
    isTaskNode: isRunningHubToolbarTaskNode,
  });
  return _0x223c4a ? { ..._0x223c4a, cancellable: true, resumable: true } : null;
}
export function bindRunningHubToolbarTaskButton({
  button: _0x3c3ad1,
  getTask: _0x3756c4,
  cancelTask: _0x53846b,
  cancelTooltip: cancelTooltip = toolbarText('cancelTask'),
  eventTypes: eventTypes = ['click'],
} = {}) {
  return bindToolbarTaskButton({
    button: _0x3c3ad1,
    getTask: _0x3756c4,
    cancelTask: _0x53846b,
    cancelTooltip: cancelTooltip,
    eventTypes: eventTypes,
    eventName: RUNNING_HUB_TOOLBAR_TASK_EVENT,
    cancelIconHtml: RUNNING_HUB_CANCEL_ICON_HTML,
  });
}
async function resolveRunningHubWorkflowApiKey() {
  try {
    return (await ensureConfig(), String(getProviderConfig('runninghubwf')?.apiKey || '').trim());
  } catch {
    return '';
  }
}
export async function cancelRunningHubRemoteTaskQuietly({
  apiKey: _0x56603d,
  taskId: _0x3321a0,
  label: _0x2f7dc3,
} = {}) {
  const _0x216e0f = String(_0x56603d || '').trim() || (await resolveRunningHubWorkflowApiKey()),
    _0xa39d89 = String(_0x3321a0 || '').trim();
  if (!_0x216e0f || !_0xa39d89) return false;
  try {
    return (await cancelRunningHubTask({ apiKey: _0x216e0f, taskId: _0xa39d89 }), true);
  } catch (_0x5847ca) {
    return (
      console.warn('[' + (_0x2f7dc3 || 'RunningHubToolbarTask') + '] cancel request failed:', _0x5847ca),
      false
    );
  }
}
export async function cancelRunningHubResultTask(
  _0x3cbe28,
  {
    name: _0x49b34f,
    outputText: _0x3b6fa4,
    notifyMessage: notifyMessage = toolbarText('taskCancelled'),
    notify: notify = true,
  } = {},
) {
  const _0x35023f = String(_0x3cbe28?.outId || _0x3cbe28?.node?.id || '').trim();
  if (!_0x35023f) return false;
  const _0x5e4bea = getStateSnapshot().nodes?.[_0x35023f];
  if (!_0x5e4bea) return false;
  const _0xba1134 = String(_0x3cbe28?.taskId || _0x5e4bea.rhTaskId || '').trim();
  (await cancelTask_2(_0x35023f, {
    store: appStore,
    cancellable: true,
    taskId: _0xba1134,
    spec: { provider: 'runninghubwf', adapterType: 'workflow' },
    cancel: async ({ taskId: _0x48ac5b }) => {
      await cancelRunningHubRemoteTaskQuietly({
        apiKey: _0x3cbe28?.apiKey,
        taskId: _0x48ac5b,
        label: 'RunningHubToolbarTaskButton',
      });
    },
  }),
    appStore.updateNodeData(_0x35023f, {
      name: _0x49b34f || _0x5e4bea.name,
      outputText: _0x3b6fa4 || _0x5e4bea.outputText,
    }),
    notifyRunningHubToolbarTasksChanged({
      outId: _0x35023f,
      sourceNodeId: String(_0x5e4bea.rhSourceNodeId || _0x3cbe28?.sourceNodeId || ''),
    }),
    window._triggerLocalCacheSave?.());
  if (notify) window.showToast?.(notifyMessage, 'info');
  return true;
}
