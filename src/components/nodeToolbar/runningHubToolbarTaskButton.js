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
function toolbarText(value, item = {}) {
  return t('nodeToolbar.common.' + value, item);
}
function getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function normalizeList(list) {
  return Array.isArray(list) ? list.map((item2) => String(item2 || '').trim()).filter(Boolean) : [];
}
function includesAny(key, list2) {
  const list3 = String(key || '');
  return list2.some((item3) => list3.includes(item3));
}
function getTaskTime(index) {
  return Number(index?.rhTaskStartedAt || index?.generationStartTime || 0) || 0;
}
function isRunningHubTaskProvider(result) {
  const providerHint = normalizeProviderId(result?.provider);
  if (providerHint === 'runninghubwf' || providerHint === 'runninghub') return true;
  const enabled = String(result?.model || '').trim();
  if (!enabled) return false;
  const modelExecution = resolveModelExecution(enabled, { providerHint: providerHint }),
    providerId = normalizeProviderId(modelExecution?.modelManifest?.provider),
    providerId2 = normalizeProviderId(modelExecution?.executionManifest?.provider);
  return (
    providerId === 'runninghubwf' ||
    providerId === 'runninghub' ||
    providerId2 === 'runninghubwf' ||
    providerId2 === 'runninghub'
  );
}
function hasRunningHubTaskMarker(data) {
  return (
    isRunningHubTaskProvider(data) ||
    !!String(data?.rhTaskId || '').trim() ||
    !!String(data?.rhTaskStatus || '').trim() ||
    !!String(data?.rhSourceNodeId || '').trim() ||
    !!String(data?.rhToolbarTaskType || '').trim()
  );
}
export function notifyRunningHubToolbarTasksChanged(options = {}) {
  notifyToolbarTasksChanged(options, { eventName: RUNNING_HUB_TOOLBAR_TASK_EVENT });
}
export function isRunningHubToolbarTaskNode(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  return hasRunningHubTaskMarker(enabled2) && isTaskRunning(enabled2);
}
export function isRunningHubToolbarTaskCancelled(target) {
  const enabled3 = String(target || '').trim();
  if (!enabled3) return false;
  const stateSnapshot = getStateSnapshot().nodes?.[enabled3];
  return hasRunningHubTaskMarker(stateSnapshot) && isTaskCancelled(stateSnapshot);
}
export function findRunningHubToolbarTaskForNode(
  source,
  {
    models: models = [],
    taskTypes: taskTypes = [],
    outputTextIncludes: outputTextIncludes = [],
    nameIncludes: nameIncludes = [],
    sourceField: sourceField = 'rhSourceNodeId',
  } = {},
) {
  const args = findToolbarTaskForNode(source, {
    models: models,
    taskTypes: taskTypes,
    outputTextIncludes: outputTextIncludes,
    nameIncludes: nameIncludes,
    sourceField: sourceField,
    taskTypeField: 'rhToolbarTaskType',
    isTaskNode: isRunningHubToolbarTaskNode,
  });
  return args ? { ...args, cancellable: true, resumable: true } : null;
}
export function bindRunningHubToolbarTaskButton({
  button: button,
  getTask: getTask,
  cancelTask: cancelTask2,
  cancelTooltip: cancelTooltip = toolbarText('cancelTask'),
  eventTypes: eventTypes = ['click'],
} = {}) {
  return bindToolbarTaskButton({
    button: button,
    getTask: getTask,
    cancelTask: cancelTask2,
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
  apiKey: apiKey,
  taskId: taskId,
  label: label,
} = {}) {
  const apiKey2 = String(apiKey || '').trim() || (await resolveRunningHubWorkflowApiKey()),
    taskId2 = String(taskId || '').trim();
  if (!apiKey2 || !taskId2) return false;
  try {
    return (await cancelRunningHubTask({ apiKey: apiKey2, taskId: taskId2 }), true);
  } catch (next) {
    return (console.warn('[' + (label || 'RunningHubToolbarTask') + '] cancel request failed:', next), false);
  }
}
export async function cancelRunningHubResultTask(
  apiKey3,
  {
    name: name,
    outputText: outputText,
    notifyMessage: notifyMessage = toolbarText('taskCancelled'),
    notify: notify = true,
  } = {},
) {
  const outId = String(apiKey3?.outId || apiKey3?.node?.id || '').trim();
  if (!outId) return false;
  const error = getStateSnapshot().nodes?.[outId];
  if (!error) return false;
  const taskId3 = String(apiKey3?.taskId || error.rhTaskId || '').trim();
  (await cancelTask_2(outId, {
    store: appStore,
    cancellable: true,
    taskId: taskId3,
    spec: { provider: 'runninghubwf', adapterType: 'workflow' },
    cancel: async ({ taskId: taskId4 }) => {
      await cancelRunningHubRemoteTaskQuietly({
        apiKey: apiKey3?.apiKey,
        taskId: taskId4,
        label: 'RunningHubToolbarTaskButton',
      });
    },
  }),
    appStore.updateNodeData(outId, {
      name: name || error.name,
      outputText: outputText || error.outputText,
    }),
    notifyRunningHubToolbarTasksChanged({
      outId: outId,
      sourceNodeId: String(error.rhSourceNodeId || apiKey3?.sourceNodeId || ''),
    }),
    window._triggerLocalCacheSave?.());
  if (notify) window.showToast?.(notifyMessage, 'info');
  return true;
}
