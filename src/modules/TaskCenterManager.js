import { MediaTaskHistoryPanel } from './MediaTaskHistoryPanel.js';
import { createMediaTaskRecoveryPanel } from './mediaTaskRecoveryCanvas.js';
import { createMediaTaskListRefresh } from './mediaTaskRecoveryModel.js';
import { registerSidebarSubmenu } from './sidebarSubmenuController.js';
import { pickResultLocalPath } from '../utils/localMediaPath.js';
import { GENERATION_TASK_CENTER_EVENT } from './generationTaskCenterEvents.js';
import { cancelDreaminaVideoQueueTask } from '../../api/dreaminaGenApi.js';
import { onLocaleChange, t } from '../i18n/index.js';
const TERMINAL_STATUSES = new Set(['complete', 'failed', 'cancelled']),
  ACTIVE_STATUSES = new Set(['waiting', 'processing']),
  MAX_TASKS = 120;
function el(value, item = '', key = '') {
  const el2 = document.createElement(value);
  if (item) el2.className = item;
  if (key) el2.textContent = key;
  return el2;
}
function taskCenterText(index, result = {}) {
  return t('taskCenter.' + index, result);
}
function normalizeTask(cancellable = {}) {
  const taskId = String(cancellable.taskId || '').trim();
  if (!taskId) return null;
  return {
    taskId: taskId,
    nodeId: String(cancellable.nodeId || '').trim(),
    assetId: String(cancellable.assetId || '').trim(),
    kind: String(cancellable.kind || '').trim(),
    source: String(cancellable.source || '').trim() || 'mediaTask',
    status: String(cancellable.status || '').trim() || 'waiting',
    progress: Math.max(0, Math.min(1, Number(cancellable.progress || 0) || 0)),
    message: String(cancellable.message || '').trim(),
    error: String(cancellable.error || '').trim(),
    cancellable: cancellable.cancellable === true,
    result: cancellable.result && typeof cancellable.result === 'object' ? cancellable.result : null,
    createdAt: Number(cancellable.createdAt || 0) || Date.now(),
    startedAt: Number(cancellable.startedAt || 0) || 0,
    finishedAt: Number(cancellable.finishedAt || 0) || 0,
    updatedAt: Date.now(),
  };
}
function getTaskLabel(data) {
  if (data === 'storySequenceExport') return '镜头顺序渲染（本地）';
  const enabled = String(data || '').trim();
  if (!enabled) return taskCenterText('taskKinds.mediaTask');
  const options = 'taskCenter.taskKinds.' + enabled,
    t2 = t(options);
  return t2 === options ? taskCenterText('taskKinds.mediaTask') : t2;
}
function getStatusLabel(target) {
  const enabled2 = String(target || '').trim();
  if (!enabled2) return taskCenterText('statuses.fallback');
  const source = 'taskCenter.statuses.' + enabled2,
    t3 = t(source);
  return t3 === source ? taskCenterText('statuses.fallback') : t3;
}
function formatPercent(next) {
  return Math.round(Math.max(0, Math.min(1, Number(next) || 0)) * 100) + '%';
}
function formatDuration(current) {
  const entry = Math.max(0, Math.floor(Number(current || 0) / 0x3e8)),
    count = Math.floor(entry / 60),
    record = entry % 60;
  if (count <= 0) return record + 's';
  return count + 'm ' + String(record).padStart(2, '0') + 's';
}
function getTaskDuration(response) {
  const enabled3 = Number(response.startedAt || response.createdAt || 0) || 0,
    enabled4 = Number(response.finishedAt || 0) || (ACTIVE_STATUSES.has(response.status) ? Date.now() : 0);
  if (!enabled3 || !enabled4) return '';
  return formatDuration(enabled4 - enabled3);
}
function getResultLocalPath(payload) {
  return pickResultLocalPath(payload);
}
function sortTasks(args) {
  const handle = { processing: 0, waiting: 1, failed: 2, complete: 3, cancelled: 4 };
  return [...args].sort((response2, response3) => {
    const state = handle[response2.status] ?? 9,
      config = handle[response3.status] ?? 9;
    if (state !== config) return state - config;
    return (
      Number(response3.updatedAt || response3.createdAt || 0) -
      Number(response2.updatedAt || response2.createdAt || 0)
    );
  });
}
function getElectronMediaTaskApi() {
  const enabled5 = globalThis.window?.electronAPI?.mediaTask;
  if (!enabled5 || typeof enabled5 !== 'object') return null;
  return enabled5;
}
export class TaskCenterManager {
  constructor() {
    ((this.panel = null),
      (this.listEl = null),
      (this.summaryEl = null),
      (this.titleEl = null),
      (this.clearBtn = null),
      (this.badgeEl = null),
      (this.tasks = new Map()),
      (this.renderTimer = 0),
      (this.clockTimer = 0),
      (this.unsubscribe = null),
      (this.unsubscribeGenerationTasks = null),
      (this.unsubscribeLocale = null),
      this.initPanel(),
      this.initRecoveryPanel(),
      this.bindLocaleChange(),
      this.bindMediaTasks(),
      this.bindGenerationTasks());
  }
  ['initPanel']() {
    const button = document.getElementById('btnTasks');
    this.badgeEl = document.getElementById('taskCenterBadge');
    const el3 = document.querySelector('.sidebar-floating') || document.body;
    ((this.panel = el('div', 'v2-task-center-panel')),
      this.panel.setAttribute('aria-label', taskCenterText('ariaLabel')));
    const el4 = el('div', 'v2-task-center-header');
    ((this.titleEl = el('div', 'v2-task-center-title', taskCenterText('title'))),
      (this.clearBtn = el('button', 'v2-task-center-action', taskCenterText('clearDone'))),
      (this.clearBtn.type = 'button'),
      (this.clearBtn.dataset.taskAction = 'clear-terminal'),
      el4.append(this.titleEl, this.clearBtn),
      (this.summaryEl = el('div', 'v2-task-center-summary')),
      (this.listEl = el('div', 'v2-task-center-list')),
      this.panel.append(el4, this.summaryEl, this.listEl),
      el3.appendChild(this.panel),
      button &&
        registerSidebarSubmenu({
          key: 'tasks',
          button: button,
          panel: this.panel,
          open: () => this.show(),
          close: () => this.hide(),
          isOpen: () => this.panel.classList.contains('show'),
        }),
      this.panel.addEventListener('click', (scope) => this.handleClick(scope)),
      this.render());
  }
  initRecoveryPanel() {
    this.mediaTaskReader = createMediaTaskListRefresh({
      api: getElectronMediaTaskApi(),
      onTask: (task) => this.upsertTask(task, { silent: true }),
      onComplete: () => this.scheduleRender(),
    });
    this.recoveryPanel = createMediaTaskRecoveryPanel({
      api: getElectronMediaTaskApi(),
      refresh: () => this.mediaTaskReader.refresh(),
    });
    this.panel.insertBefore(this.recoveryPanel.el, this.listEl);
    this.historyPanel = new MediaTaskHistoryPanel({
      api: getElectronMediaTaskApi()?.history,
      createRecoveryPanel: createMediaTaskRecoveryPanel,
    });
    this.panel.insertBefore(this.historyPanel.el, this.listEl);
  }
  ['bindLocaleChange']() {
    this.unsubscribeLocale = onLocaleChange(() => {
      this.render();
    });
  }
  ['bindMediaTasks']() {
    const electronMediaTaskApi = getElectronMediaTaskApi();
    if (!electronMediaTaskApi) {
      this.render();
      return;
    }
    const initialLookupSequence = this.recoveryPanel.sequence;
    (typeof electronMediaTaskApi.onUpdate === 'function' &&
      (this.unsubscribe = electronMediaTaskApi.onUpdate((input) => {
        this.mediaTaskReader.noteEvent(input || {});
        this.upsertTask(input || {});
      })),
      typeof electronMediaTaskApi.list === 'function' &&
        this.mediaTaskReader.refresh().catch(() => {
          if (this.recoveryPanel.sequence === initialLookupSequence) {
            this.recoveryPanel.message.textContent =
              '初次宿主列表读取失败，状态待核对；可手动刷新。不自动重发任务。';
          }
        }));
  }
  ['bindGenerationTasks']() {
    if (!globalThis.window?.addEventListener) return;
    const output = (value2) => {
      this.upsertTask({ ...(value2?.detail || {}), source: 'generation' });
    };
    (window.addEventListener(GENERATION_TASK_CENTER_EVENT, output),
      (this.unsubscribeGenerationTasks = () => {
        window.removeEventListener(GENERATION_TASK_CENTER_EVENT, output);
      }));
  }
  ['show']() {
    (this.panel?.classList.add('show'),
      document.getElementById('btnTasks')?.classList.add('active'),
      this.render(),
      this.startClock());
  }
  ['hide']() {
    this.recoveryPanel?.suspend();
    this.historyPanel?.suspend();
    this.mediaTaskReader?.invalidate();
    (this.panel?.classList.remove('show'),
      document.getElementById('btnTasks')?.classList.remove('active'),
      this.stopClock());
  }
  ['startClock']() {
    if (this.clockTimer) return;
    this.clockTimer = window.setInterval(() => {
      if (!this.hasActiveTasks()) {
        this.stopClock();
        return;
      }
      this.render();
    }, 0x3e8);
  }
  ['stopClock']() {
    if (!this.clockTimer) return;
    (window.clearInterval(this.clockTimer), (this.clockTimer = 0));
  }
  ['hasActiveTasks']() {
    return [...this.tasks.values()].some((response4) => ACTIVE_STATUSES.has(response4.status));
  }
  ['retireDuplicateGenerationTasks'](response5) {
    if (
      response5?.source !== 'generation' ||
      response5.kind !== 'dreaminaVideo' ||
      !response5.nodeId ||
      !ACTIVE_STATUSES.has(response5.status)
    )
      return;
    for (const [value3, message] of this.tasks.entries()) {
      if (value3 === response5.taskId) continue;
      message?.source === 'generation' &&
        message.kind === 'dreaminaVideo' &&
        message.nodeId === response5.nodeId &&
        ACTIVE_STATUSES.has(message.status) &&
        this.tasks.set(value3, {
          ...message,
          status: 'complete',
          progress: 1,
          message: message.message || 'Replaced by latest task',
          finishedAt: message.finishedAt || Date.now(),
          updatedAt: Date.now(),
        });
    }
  }
  ['upsertTask'](value4, { silent: silent = false } = {}) {
    const response6 = normalizeTask(value4);
    if (!response6) return;
    this.retireDuplicateGenerationTasks(response6);
    const value5 = this.tasks.get(response6.taskId);
    (this.tasks.set(response6.taskId, { ...(value5 || {}), ...response6, updatedAt: Date.now() }),
      this.trimTasks());
    if (!silent) this.scheduleRender();
    if (ACTIVE_STATUSES.has(response6.status)) this.startClock();
  }
  ['trimTasks']() {
    if (this.tasks.size <= MAX_TASKS) return;
    const list = sortTasks([...this.tasks.values()]).slice(0, MAX_TASKS);
    this.tasks = new Map(list.map((item2) => [item2.taskId, item2]));
  }
  ['scheduleRender']() {
    if (this.renderTimer) return;
    this.renderTimer = window.requestAnimationFrame(() => {
      ((this.renderTimer = 0), this.render());
    });
  }
  ['getTaskGroups']() {
    const active = sortTasks([...this.tasks.values()]);
    return {
      active: active.filter((response7) => ACTIVE_STATUSES.has(response7.status)),
      failed: active.filter((response8) => response8.status === 'failed'),
      done: active.filter((response9) => response9.status === 'complete' || response9.status === 'cancelled'),
    };
  }
  ['updateBadge'](value6) {
    const count2 = value6.active.length;
    if (!this.badgeEl) return;
    ((this.badgeEl.hidden = count2 <= 0), (this.badgeEl.textContent = count2 > 99 ? '99+' : String(count2)));
  }
  ['render']() {
    if (!this.listEl || !this.summaryEl) return;
    const electronMediaTaskApi2 = getElectronMediaTaskApi(),
      active2 = this.getTaskGroups();
    this.updateBadge(active2);
    const failed = active2.failed.length,
      done = active2.done.length,
      count3 = active2.active.length + failed + done;
    this.panel?.setAttribute('aria-label', taskCenterText('ariaLabel'));
    if (this.clearBtn) this.clearBtn.textContent = taskCenterText('clearDone');
    if (this.titleEl) this.titleEl.textContent = taskCenterText('title');
    this.summaryEl.textContent =
      electronMediaTaskApi2 || count3 > 0
        ? taskCenterText('summary', { active: active2.active.length, failed: failed, done: done })
        : taskCenterText('unavailableSummary');
    if (this.clearBtn) this.clearBtn.hidden = done + failed <= 0;
    this.listEl.replaceChildren();
    if (!electronMediaTaskApi2 && count3 <= 0) {
      this.listEl.appendChild(el('div', 'v2-task-center-empty', taskCenterText('unavailable')));
      return;
    }
    if (count3 === 0) {
      this.listEl.appendChild(el('div', 'v2-task-center-empty', taskCenterText('empty')));
      return;
    }
    (active2.active.length &&
      this.listEl.appendChild(this.renderSection(taskCenterText('sections.active'), active2.active)),
      active2.failed.length &&
        this.listEl.appendChild(this.renderSection(taskCenterText('sections.failed'), active2.failed)),
      active2.done.length &&
        this.listEl.appendChild(
          this.renderSection(taskCenterText('sections.done'), active2.done.slice(0, 40)),
        ));
  }
  ['renderSection'](value7, list2) {
    const el5 = el('section', 'v2-task-center-section');
    return (
      el5.appendChild(el('div', 'v2-task-center-section-title', value7)),
      list2.forEach((item3) => el5.appendChild(this.renderTaskCard(item3))),
      el5
    );
  }
  ['renderTaskCard'](error) {
    const el6 = el('article', 'v2-task-card');
    el6.dataset.taskId = error.taskId;
    const el7 = el('div', 'v2-task-card-header'),
      el8 = el('div', 'v2-task-card-main');
    el8.appendChild(el('div', 'v2-task-card-title', getTaskLabel(error.kind)));
    const duration = getTaskDuration(error),
      value8 = [
        error.message || getStatusLabel(error.status),
        duration ? taskCenterText('duration', { duration: duration }) : '',
      ]
        .filter(Boolean)
        .join(' · ');
    el8.appendChild(el('div', 'v2-task-card-meta', value8));
    const el9 = el('span', 'v2-task-status v2-task-status--' + error.status, getStatusLabel(error.status));
    (el7.append(el8, el9), el6.appendChild(el7));
    if ((error.status === 'waiting' || error.status === 'processing') && error.cancellable === true) {
      const el10 = el('div', 'v2-task-progress'),
        el11 = el('div', 'v2-task-progress-fill');
      ((el11.style.width = formatPercent(error.status === 'waiting' ? 0 : error.progress)),
        el10.appendChild(el11),
        el6.appendChild(el10));
    }
    error.error && el6.appendChild(el('div', 'v2-task-card-error', error.error));
    const value9 = this.renderTaskActions(error);
    if (value9.childElementCount > 0) el6.appendChild(value9);
    return el6;
  }
  ['renderTaskActions'](response10) {
    const el12 = el('div', 'v2-task-card-actions');
    if (
      (response10.status === 'waiting' || response10.status === 'processing') &&
      response10.cancellable === true
    ) {
      const el13 = el(
        'button',
        'v2-task-card-action v2-task-card-action--danger',
        taskCenterText('actions.cancel'),
      );
      ((el13.type = 'button'),
        (el13.dataset.taskAction = 'cancel'),
        (el13.dataset.taskId = response10.taskId),
        el12.appendChild(el13));
    }
    if (response10.source === 'mediaTask') {
      const lookup = el('button', 'v2-task-card-action', '查找 / 取回');
      lookup.type = 'button';
      lookup.dataset.taskAction = 'lookup-local';
      lookup.dataset.taskId = response10.taskId;
      el12.appendChild(lookup);
    }
    const resultLocalPath = getResultLocalPath(response10.result);
    if (resultLocalPath) {
      const el14 = el('button', 'v2-task-card-action', taskCenterText('actions.reveal'));
      ((el14.type = 'button'),
        (el14.dataset.taskAction = 'reveal'),
        (el14.dataset.localPath = resultLocalPath),
        el12.appendChild(el14));
    }
    if (response10.error) {
      const el15 = el('button', 'v2-task-card-action', taskCenterText('actions.copyError'));
      ((el15.type = 'button'),
        (el15.dataset.taskAction = 'copy-error'),
        (el15.dataset.taskId = response10.taskId),
        el12.appendChild(el15));
    }
    return el12;
  }
  ['handleClick'](event) {
    const el16 = event.target.closest('[data-task-action]');
    if (!el16) return;
    (event.preventDefault(), event.stopPropagation());
    const value10 = el16.dataset.taskAction || '';
    if (value10 === 'lookup-local') {
      void this.recoveryPanel.lookup(el16.dataset.taskId || '');
      return;
    }
    if (value10 === 'clear-terminal') {
      this.mediaTaskReader?.invalidate();
      for (const [value11, response11] of this.tasks.entries()) {
        if (TERMINAL_STATUSES.has(response11.status)) this.tasks.delete(value11);
      }
      this.render();
      return;
    }
    if (value10 === 'cancel') {
      const taskId2 = el16.dataset.taskId || '',
        args2 = this.tasks.get(taskId2);
      if (args2?.source === 'generation' && args2.kind === 'dreaminaVideo') {
        void cancelDreaminaVideoQueueTask(taskId2)
          .then(() => {
            this.upsertTask({
              ...args2,
              status: 'cancelled',
              progress: 0,
              message: taskCenterText('cancelledMessage'),
              error: '',
              finishedAt: Date.now(),
            });
          })
          .catch((error2) => {
            window.showToast?.(error2?.message || taskCenterText('cancelFailed'), 'error');
          });
        return;
      }
      void getElectronMediaTaskApi()
        ?.cancel?.({ taskId: taskId2 })
        .catch((error3) => {
          window.showToast?.(error3?.message || taskCenterText('cancelFailed'), 'error');
        });
      return;
    }
    if (value10 === 'reveal') {
      const localPath = el16.dataset.localPath || '';
      void globalThis.window?.electronAPI?.showItemInFolder?.({ localPath: localPath })?.catch((error4) => {
        window.showToast?.(error4?.message || taskCenterText('revealFailed'), 'error');
      });
      return;
    }
    if (value10 === 'copy-error') {
      const value12 = this.tasks.get(el16.dataset.taskId || ''),
        text = value12?.error || '';
      if (!text) return;
      const value13 = globalThis.window?.electronAPI?.clipboard,
        enabled6 =
          typeof value13?.writeText === 'function'
            ? value13.writeText({ text: text })
            : globalThis.navigator?.clipboard?.writeText?.(text);
      if (!enabled6) {
        window.showToast?.(taskCenterText('copyFailed'), 'error');
        return;
      }
      void Promise.resolve(enabled6)
        .then(() => window.showToast?.(taskCenterText('copySuccess'), 'success'))
        .catch(() => window.showToast?.(taskCenterText('copyFailed'), 'error'));
    }
  }
}
export function initTaskCenterManager() {
  if (globalThis.window?.__aiCanvasTaskCenterManager) return globalThis.window.__aiCanvasTaskCenterManager;
  const taskCenterManager = new TaskCenterManager();
  return ((globalThis.window.__aiCanvasTaskCenterManager = taskCenterManager), taskCenterManager);
}
