import appStore from '../../core/stores/appStore.js';
import { isTaskCancelled, isTaskRunning } from '../../core/generationTaskUiState.js';
import { GENERATE_CANCEL_ICON_HTML } from '../../modules/previewGenerateButtonUi.js';
export const TASK_TOOLBAR_EVENT = 'aicanvas:generation-toolbar-task-change';
function getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function normalizeList(list) {
  return Array.isArray(list) ? list.map((item) => String(item || '').trim()).filter(Boolean) : [];
}
function includesAny(value, list2) {
  const list3 = String(value || '');
  return list2.some((item2) => list3.includes(item2));
}
function getTaskTime(key) {
  return Number(key?.rhTaskStartedAt || key?.asyncTaskStartedAt || key?.generationStartTime || 0) || 0;
}
function defaultIsTaskNode(enabled) {
  return !!enabled && typeof enabled === 'object' && isTaskRunning(enabled);
}
export function notifyToolbarTasksChanged(detail = {}, { eventName: eventName = TASK_TOOLBAR_EVENT } = {}) {
  try {
    window.dispatchEvent?.(new CustomEvent(eventName, { detail: detail }));
  } catch {}
}
export function isToolbarTaskCancelled(index, { isTaskNode: isTaskNode = defaultIsTaskNode } = {}) {
  const enabled2 = String(index || '').trim();
  if (!enabled2) return false;
  const stateSnapshot = getStateSnapshot().nodes?.[enabled2];
  return !!stateSnapshot && isTaskNode(stateSnapshot) === false ? false : isTaskCancelled(stateSnapshot);
}
export function findToolbarTaskForNode(
  result,
  {
    models: models = [],
    taskTypes: taskTypes = [],
    outputTextIncludes: outputTextIncludes = [],
    nameIncludes: nameIncludes = [],
    sourceField: sourceField = 'rhSourceNodeId',
    taskTypeField: taskTypeField = 'rhToolbarTaskType',
    isTaskNode: isTaskNode = defaultIsTaskNode,
  } = {},
) {
  const enabled3 = String(result || '').trim();
  if (!enabled3) return null;
  const map = new Set(normalizeList(models).map((item3) => item3.toLowerCase())),
    map2 = new Set(normalizeList(taskTypes)),
    list4 = normalizeList(outputTextIncludes),
    list5 = normalizeList(nameIncludes),
    data = Object.values(getStateSnapshot().nodes || {})
      .filter((error) => {
        if (!error || typeof error !== 'object') return false;
        if (!isTaskNode(error)) return false;
        const enabled4 = String(error.id || '') === enabled3 || String(error[sourceField] || '') === enabled3;
        if (!enabled4) return false;
        if (map.size) {
          const options = String(error.model || '')
            .trim()
            .toLowerCase();
          if (!map.has(options)) return false;
        }
        const target = map2.size > 0 && map2.has(String(error[taskTypeField] || '').trim()),
          source = list4.length > 0 && includesAny(error.outputText, list4),
          next = list5.length > 0 && includesAny(error.name, list5),
          enabled5 = map2.size > 0 || list4.length > 0 || list5.length > 0;
        return !enabled5 || target || source || next;
      })
      .sort((item4, current) => getTaskTime(current) - getTaskTime(item4)),
    node = data[0] || null;
  if (!node) return null;
  return {
    sourceNodeId: String(node[sourceField] || ''),
    outId: String(node.id || ''),
    targetNodeId: String(node.id || ''),
    taskId: String(node.rhTaskId || node.asyncTaskId || ''),
    apiKey: '',
    node: node,
    fromStore: true,
  };
}
export function bindToolbarTaskButton({
  button: button,
  getTask: getTask,
  cancelTask: cancelTask,
  cancelTooltip: cancelTooltip = '取消任务',
  eventTypes: eventTypes = ['click'],
  eventName: eventName = TASK_TOOLBAR_EVENT,
  cancelIconHtml: cancelIconHtml = GENERATE_CANCEL_ICON_HTML,
} = {}) {
  if (!button || typeof getTask !== 'function') return () => {};
  const entry = {
    html: button.innerHTML,
    color: button.style?.color || '',
    tooltip: button.dataset?.tooltip,
    aria: button.getAttribute?.('aria-label') || '',
    title: button.title || '',
  };
  let enabled6 = '';
  const run = () => {
      const record = getTask() || null;
      enabled6 = String(record?.outId || record?.targetNodeId || '');
      const payload = !!enabled6;
      button.classList?.toggle?.('is-task-cancel', payload);
      if (payload) {
        button.innerHTML = cancelIconHtml;
        if (button.dataset) button.dataset.tooltip = cancelTooltip;
        (button.setAttribute?.('aria-label', cancelTooltip), (button.title = cancelTooltip));
        return;
      }
      button.innerHTML = entry.html;
      if (button.style) button.style.color = entry.color || '';
      if (button.dataset) {
        if (entry.tooltip == null) delete button.dataset.tooltip;
        else button.dataset.tooltip = entry.tooltip;
      }
      if (entry.aria) button.setAttribute?.('aria-label', entry.aria);
      else button.removeAttribute?.('aria-label');
      button.title = entry.title || '';
    },
    handle = (event) => {
      const enabled7 = getTask() || null;
      if (!enabled7) return;
      (event.preventDefault?.(),
        event.stopPropagation?.(),
        event.stopImmediatePropagation?.(),
        void Promise.resolve(cancelTask?.(enabled7)).finally(run));
    },
    list6 = normalizeList(eventTypes);
  list6.forEach((item5) => {
    button.addEventListener?.(item5, handle, true);
  });
  const state =
    typeof appStore.subscribeSelector === 'function'
      ? appStore.subscribeSelector((config) => config.nodes, run)
      : null;
  return (
    window.addEventListener?.(eventName, run),
    run(),
    () => {
      (list6.forEach((item6) => {
        button.removeEventListener?.(item6, handle, true);
      }),
        state?.(),
        window.removeEventListener?.(eventName, run),
        enabled6 && ((enabled6 = ''), run()));
    }
  );
}
