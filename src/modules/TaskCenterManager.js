import { registerSidebarSubmenu } from './sidebarSubmenuController.js';
import { pickResultLocalPath } from '../utils/localMediaPath.js';
import {
  GENERATION_TASK_CENTER_EVENT,
  listGenerationTaskCenterUpdates,
} from './generationTaskCenterEvents.js';
import { ACTIVE_TASK_STATUSES, TERMINAL_TASK_STATUSES, pruneTaskCenterRecords } from './taskCenterModel.js';
import { createTaskCardView, syncTaskElements } from './taskCenterListView.js';
import { resolveTaskCenterThumbnail } from './taskCenterThumbnail.js';
import { createTaskCenterMediaController } from './taskCenterMediaController.js';
import { executeTaskCenterAction } from './taskCenterActions.js';
import { getProviderTaskConsoleUrl } from '../config/providerTaskConsole.js';
import appStore from '../core/stores/appStore.js';
import { cancelTask } from '../core/generationTaskRuntime.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { desktopBridge } from '../services/desktopBridge.js';
import { showContextMenu } from './interaction/contextMenuPresenter.js';
import { createTaskStatusFeedback } from './taskStatusFeedback.js';
const MAX_TASKS = 120;
function el(value, item = '', key = '') {
  const el2 = document['createElement'](value);
  if (item) el2['className'] = item;
  if (key) el2['textContent'] = key;
  return el2;
}
function taskCenterText(index, result = {}) {
  return t('taskCenter.' + index, result);
}
function normalizeTask(navigation = {}) {
  const taskId2 = String(navigation['taskId'] || '')['trim']();
  if (!taskId2) return null;
  return {
    taskId: taskId2,
    title: String(navigation['title'] || ''),
    provider: String(navigation['provider'] || ''),
    providerProfileId: String(navigation['providerProfileId'] || ''),
    modelId: String(navigation['modelId'] || ''),
    adapterType: String(navigation['adapterType'] || ''),
    projectId: String(navigation['projectId'] || ''),
    canvasId: String(navigation['canvasId'] || ''),
    projectTitle: String(navigation['projectTitle'] || ''),
    navigation: navigation['navigation'] || null,
    nodeId: String(navigation['nodeId'] || '')['trim'](),
    assetId: String(navigation['assetId'] || '')['trim'](),
    kind: String(navigation['kind'] || '')['trim'](),
    source: String(navigation['source'] || '')['trim']() || 'mediaTask',
    status: String(navigation['status'] || '')['trim']() || 'waiting',
    progress:
      navigation['progress'] == null
        ? null
        : Math['max'](0, Math['min'](1, Number(navigation['progress']) || 0)),
    message: String(navigation['message'] || '')['trim'](),
    error: String(navigation['error'] || '')['trim'](),
    remoteTaskId: String(navigation['remoteTaskId'] || '')['trim'](),
    cancellable: navigation['cancellable'] === true,
    result: navigation['result'] && typeof navigation['result'] === 'object' ? navigation['result'] : null,
    thumbnail: navigation['thumbnail'] || null,
    createdAt:
      Number(navigation['createdAt'] || 0) ||
      (ACTIVE_TASK_STATUSES['has'](navigation['status']) ? Date['now']() : 0),
    startedAt: Number(navigation['startedAt'] || 0) || 0,
    finishedAt: Number(navigation['finishedAt'] || 0) || 0,
    updatedAt: Date['now'](),
  };
}
function getTaskLabel(data) {
  const enabled = String(data || '')['trim']();
  if (!enabled) return taskCenterText('taskKinds.mediaTask');
  const options = 'taskCenter.taskKinds.' + enabled,
    t2 = t(options);
  return t2 === options ? taskCenterText('taskKinds.mediaTask') : t2;
}
function getStatusLabel(target) {
  const enabled2 = String(target || '')['trim']();
  if (!enabled2) return taskCenterText('statuses.fallback');
  const source = 'taskCenter.statuses.' + enabled2,
    t3 = t(source);
  return t3 === source ? taskCenterText('statuses.fallback') : t3;
}
function formatDuration(next) {
  const current = Math['max'](0, Math['floor'](Number(next || 0) / 1000)),
    count = Math['floor'](current / 60),
    entry = current % 60;
  if (count <= 0) return entry + 's';
  return count + 'm ' + String(entry)['padStart'](2, '0') + 's';
}
function getTaskDuration(response) {
  const enabled3 = Number(response['startedAt'] || response['createdAt'] || 0) || 0,
    enabled4 =
      Number(response['finishedAt'] || 0) ||
      (ACTIVE_TASK_STATUSES['has'](response['status']) ? Date['now']() : 0);
  if (!enabled3 || !enabled4) return '';
  return formatDuration(enabled4 - enabled3);
}
function getResultLocalPath(record) {
  return pickResultLocalPath(record);
}
function sortTasks(args) {
  const payload = { processing: 0, waiting: 1, failed: 2, complete: 3, cancelled: 4 };
  return [...args]['sort']((response2, response3) => {
    const handle = payload[response2['status']] ?? 9,
      state = payload[response3['status']] ?? 9;
    if (handle !== state) return handle - state;
    return Number(response3['createdAt'] || 0) - Number(response2['createdAt'] || 0);
  });
}
function getElectronMediaTaskApi() {
  return desktopBridge['mediaTask']['isAvailable']() ? desktopBridge['mediaTask'] : null;
}
export class TaskCenterManager {
  constructor({
    generationCancelTask: generationCancelTask = cancelTask,
    generationStore: generationStore = appStore,
    contextMenuPresenter: contextMenuPresenter = showContextMenu,
  } = {}) {
    ((this['generationCancelTask'] = generationCancelTask),
      (this['generationStore'] = generationStore),
      (this['contextMenuPresenter'] = contextMenuPresenter),
      (this['contextMenuSession'] = null),
      (this['panel'] = null),
      (this['listEl'] = null),
      (this['summaryEl'] = null),
      (this['titleEl'] = null),
      (this['clearBtn'] = null),
      (this['badgeEl'] = null),
      (this['tasks'] = new Map()),
      (this['statusFeedback'] = createTaskStatusFeedback()),
      (this['cardViews'] = new Map()),
      (this['sectionViews'] = new Map()),
      (this['pendingActions'] = new Set()),
      (this['renderTimer'] = 0),
      (this['clockTimer'] = 0),
      (this['unsubscribe'] = null),
      (this['unsubscribeGenerationTasks'] = null),
      (this['unsubscribeLocale'] = null),
      this['initPanel'](),
      this['bindLocaleChange'](),
      this['bindMediaTasks'](),
      this['bindGenerationTasks']());
  }
  ['initPanel']() {
    const button = document['getElementById']('btnTasks');
    this['badgeEl'] = document['getElementById']('taskCenterBadge');
    const el3 = document['querySelector']('.sidebar-floating') || document['body'];
    ((this['panel'] = el('div', 'v2-task-center-panel canvas-toolbar-panel-surface')),
      this['panel']['setAttribute']('aria-label', taskCenterText('ariaLabel')));
    const el4 = el('div', 'v2-task-center-header');
    ((this['titleEl'] = el('div', 'v2-task-center-title', taskCenterText('title'))),
      (this['clearBtn'] = el('button', 'v2-task-center-action', taskCenterText('clearDone'))),
      (this['clearBtn']['type'] = 'button'),
      (this['clearBtn']['dataset']['taskAction'] = 'clear-terminal'),
      el4['append'](this['titleEl'], this['clearBtn']),
      (this['summaryEl'] = el('div', 'v2-task-center-summary')),
      (this['listEl'] = el('div', 'v2-task-center-list')),
      (this['mediaController'] = createTaskCenterMediaController(this['listEl'])),
      this['panel']['append'](el4, this['summaryEl'], this['listEl']),
      el3['appendChild'](this['panel']),
      button &&
        registerSidebarSubmenu({
          key: 'tasks',
          button: button,
          panel: this['panel'],
          open: () => this['show'](),
          close: () => this['hide'](),
          isOpen: () => this['panel']['classList']['contains']('show'),
        }),
      this['panel']['addEventListener']('click', (config) => this['handleClick'](config)),
      this['panel']['addEventListener']('contextmenu', (scope) => this['handleContextMenu'](scope)),
      this['panel']['addEventListener']('wheel', (input) => this['handleWheel'](input), {
        passive: false,
      }),
      this['render']());
  }
  ['handleWheel'](event) {
    (event['stopPropagation'](), event['stopImmediatePropagation']?.());
    if (!this['listEl'] || this['listEl']['contains'](event['target'])) return;
    const enabled5 = Number(event['deltaY'] || 0);
    if (!enabled5) return;
    const enabled6 =
      Number(this['listEl']['scrollHeight'] || 0) > Number(this['listEl']['clientHeight'] || 0);
    if (!enabled6) return;
    (event['preventDefault']?.(),
      (this['listEl']['scrollTop'] = Math['max'](
        0,
        Number(this['listEl']['scrollTop'] || 0) + enabled5,
      )));
  }
  ['bindLocaleChange']() {
    this['unsubscribeLocale'] = onLocaleChange(() => {
      this['render']();
    });
  }
  ['bindMediaTasks']() {
    const electronMediaTaskApi = getElectronMediaTaskApi();
    if (!electronMediaTaskApi) {
      this['render']();
      return;
    }
    const map = new Set();
    let enabled7 = true;
    (typeof electronMediaTaskApi['onUpdate'] === 'function' &&
      (this['unsubscribe'] = electronMediaTaskApi['onUpdate']((output) => {
        if (enabled7 && output?.['taskId']) map['add'](output['taskId']);
        this['upsertTask'](output || {});
      })),
      typeof electronMediaTaskApi['list'] === 'function'
        ? electronMediaTaskApi['list']({ limit: MAX_TASKS })
            ['then']((list) => {
              if (!Array['isArray'](list)) return;
              (list['forEach']((value2) => {
                if (!map['has'](value2['taskId'])) this['upsertTask'](value2, { silent: true });
              }),
                this['scheduleRender']());
            })
            ['catch'](() => {})
            ['finally'](() => {
              ((enabled7 = false), map['clear']());
            })
        : (enabled7 = false));
  }
  ['bindGenerationTasks']() {
    if (!globalThis['window']?.['addEventListener']) return;
    const value3 = (source2) => {
      this['upsertTask']({
        ...(source2?.['detail'] || {}),
        source: source2?.['detail']?.['source'] || 'generation',
      });
    };
    (window['addEventListener'](GENERATION_TASK_CENTER_EVENT, value3),
      listGenerationTaskCenterUpdates()['forEach']((value4) =>
        this['upsertTask'](value4, { silent: true }),
      ),
      (this['unsubscribeGenerationTasks'] = () => {
        window['removeEventListener'](GENERATION_TASK_CENTER_EVENT, value3);
      }));
  }
  ['show']() {
    (this['panel']?.['classList']['add']('show'),
      this['mediaController']?.['setVisible'](true),
      document['getElementById']('btnTasks')?.['classList']['add']('active'),
      this['render'](),
      this['startClock']());
  }
  ['hide']() {
    (this['closeContextMenu'](),
      this['mediaController']?.['setVisible'](false),
      this['panel']?.['classList']['remove']('show'),
      document['getElementById']('btnTasks')?.['classList']['remove']('active'),
      this['stopClock']());
    if (this['renderTimer']) window['cancelAnimationFrame']?.(this['renderTimer']);
    this['renderTimer'] = 0;
  }
  ['startClock']() {
    if (this['clockTimer']) return;
    this['clockTimer'] = window['setInterval'](() => {
      if (!this['hasActiveTasks']()) {
        this['stopClock']();
        return;
      }
      this['render']();
    }, 1000);
  }
  ['stopClock']() {
    if (!this['clockTimer']) return;
    (window['clearInterval'](this['clockTimer']), (this['clockTimer'] = 0));
  }
  ['closeContextMenu']() {
    (this['contextMenuSession']?.['close']?.(),
      (this['contextMenuSession'] = null),
      (this['contextMenuTaskId'] = ''));
  }
  ['hasActiveTasks']() {
    return [...this['tasks']['values']()]['some']((response4) =>
      ACTIVE_TASK_STATUSES['has'](response4['status']),
    );
  }
  ['retireDuplicateGenerationTasks'](response5) {
    if (
      response5?.['source'] !== 'generation' ||
      response5['kind'] !== 'dreaminaVideo' ||
      !response5['nodeId'] ||
      !ACTIVE_TASK_STATUSES['has'](response5['status'])
    )
      return;
    for (const [value5, message] of this['tasks']['entries']()) {
      if (value5 === response5['taskId']) continue;
      message?.['source'] === 'generation' &&
        message['kind'] === 'dreaminaVideo' &&
        message['nodeId'] === response5['nodeId'] &&
        message['canvasId'] === response5['canvasId'] &&
        message['projectId'] === response5['projectId'] &&
        ACTIVE_TASK_STATUSES['has'](message['status']) &&
        (this['tasks']['set'](value5, {
          ...message,
          status: 'complete',
          progress: 1,
          message: message['message'] || 'Replaced by latest task',
          finishedAt: message['finishedAt'] || Date['now'](),
          updatedAt: Date['now'](),
        }),
        this['statusFeedback']?.['observe'](this['tasks']['get'](value5), message, { silent: true }));
    }
  }
  ['upsertTask'](createdAt, { silent: silent = false } = {}) {
    const response6 = this['tasks']['get'](createdAt?.['taskId']),
      response7 = normalizeTask({
        ...response6,
        ...createdAt,
        createdAt: createdAt?.['createdAt'] || response6?.['createdAt'],
        finishedAt: createdAt?.['finishedAt'] || response6?.['finishedAt'],
      });
    if (!response7) return;
    if (ACTIVE_TASK_STATUSES['has'](response7['status'])) {
      response7['finishedAt'] = 0;
      if (response6 && TERMINAL_TASK_STATUSES['has'](response6['status']) && !createdAt['createdAt'])
        response7['createdAt'] = Date['now']();
    }
    if (TERMINAL_TASK_STATUSES['has'](response7['status']) && !response7['finishedAt'])
      response7['finishedAt'] = Date['now']();
    this['retireDuplicateGenerationTasks'](response7);
    const response8 = this['tasks']['get'](response7['taskId']);
    if (
      response8 &&
      this['contextMenuTaskId'] === response7['taskId'] &&
      (response8['status'] !== response7['status'] || response8['cancellable'] !== response7['cancellable'])
    )
      this['closeContextMenu']();
    (this['tasks']['set'](response7['taskId'], {
      ...(response8 || {}),
      ...response7,
      updatedAt: Date['now'](),
    }),
      this['statusFeedback']?.['observe'](response7, response6, { silent: silent }),
      this['trimTasks']());
    if (!silent) this['scheduleRender']();
    if (ACTIVE_TASK_STATUSES['has'](response7['status']) && this['panel']?.['classList']['contains']('show'))
      this['startClock']();
  }
  ['trimTasks']() {
    if (this['tasks']['size'] <= MAX_TASKS) return;
    const list2 = pruneTaskCenterRecords([...this['tasks']['values']()], MAX_TASKS);
    this['tasks'] = new Map(list2['map']((value6) => [value6['taskId'], value6]));
  }
  ['scheduleRender']() {
    if (!this['panel']?.['classList']['contains']('show')) {
      this['updateBadge']();
      return;
    }
    if (this['renderTimer']) return;
    this['renderTimer'] = window['requestAnimationFrame'](() => {
      ((this['renderTimer'] = 0), this['render']());
    });
  }
  ['getTaskGroups']() {
    const active = sortTasks([...this['tasks']['values']()]);
    return {
      active: active['filter']((response9) => ACTIVE_TASK_STATUSES['has'](response9['status'])),
      failed: active['filter']((response10) => response10['status'] === 'failed'),
      done: active['filter'](
        (response11) => TERMINAL_TASK_STATUSES['has'](response11['status']) && response11['status'] !== 'failed',
      ),
    };
  }
  ['updateBadge'](value7) {
    const count2 = value7
      ? value7['active']['length']
      : [...this['tasks']['values']()]['filter']((response12) =>
          ACTIVE_TASK_STATUSES['has'](response12['status']),
        )['length'];
    if (!this['badgeEl']) return;
    if (this['badgeEl']['hidden'] !== count2 <= 0) this['badgeEl']['hidden'] = count2 <= 0;
    const value8 = count2 > 99 ? '99+' : String(count2);
    if (this['badgeEl']['textContent'] !== value8) this['badgeEl']['textContent'] = value8;
  }
  ['render']() {
    if (!this['listEl'] || !this['summaryEl']) return;
    if (!this['panel']?.['classList']['contains']('show')) {
      this['updateBadge']();
      return;
    }
    const active2 = this['getTaskGroups']();
    this['updateBadge'](active2);
    const failed = active2['failed']['length'],
      done = active2['done']['length'];
    this['panel']?.['setAttribute']('aria-label', taskCenterText('ariaLabel'));
    if (this['clearBtn']) this['clearBtn']['textContent'] = taskCenterText('clearDone');
    if (this['titleEl']) this['titleEl']['textContent'] = taskCenterText('title');
    this['summaryEl']['textContent'] = taskCenterText('summary', {
      active: active2['active']['length'],
      failed: failed,
      done: done,
    });
    if (this['clearBtn']) this['clearBtn']['hidden'] = done + failed <= 0;
    const list3 = [];
    for (const [value9, list4] of Object['entries'](active2)) {
      if (!list4['length']) {
        const el5 = this['sectionViews']['get'](value9);
        if (el5) syncTaskElements(el5, [el5['children'][0]]);
        continue;
      }
      let el6 = this['sectionViews']['get'](value9);
      (!el6 &&
        ((el6 = el('section', 'v2-task-center-section')),
        el6['appendChild'](el('div', 'v2-task-center-section-title')),
        this['sectionViews']['set'](value9, el6)),
        (el6['children'][0]['textContent'] = taskCenterText('sections.' + value9)),
        syncTaskElements(el6, [
          el6['children'][0],
          ...list4['map']((value10) => this['renderTaskCard'](value10)),
        ]),
        list3['push'](el6));
    }
    !list3['length'] &&
      ((this['emptyEl'] ||= el('div', 'v2-task-center-empty')),
      (this['emptyEl']['textContent'] = taskCenterText('empty')),
      list3['push'](this['emptyEl']));
    syncTaskElements(this['listEl'], list3);
    for (const value11 of this['cardViews']['keys']()) {
      if (!this['tasks']['has'](value11)) this['cardViews']['delete'](value11);
    }
    this['mediaController']?.['sync'](this['cardViews']['values']());
  }
  ['renderTaskCard'](title) {
    let taskCardView = this['cardViews']['get'](title['taskId']);
    !taskCardView &&
      ((taskCardView = createTaskCardView(title['taskId'])),
      this['cardViews']['set'](title['taskId'], taskCardView));
    const duration = getTaskDuration(title),
      actions = [],
      handler = (id, value12, args2 = {}) =>
        actions['push']({
          id: id,
          label: this['pendingActions']['has'](title['taskId'] + ':' + id)
            ? taskCenterText('pendingAction')
            : taskCenterText(value12),
          pending: this['pendingActions']['has'](title['taskId'] + ':' + id),
          ...args2,
        });
    if (ACTIVE_TASK_STATUSES['has'](title['status']) && title['cancellable'])
      handler('cancel', 'actions.cancel', { danger: true });
    if (title['navigation']) handler('locate', 'actions.locate');
    if (getProviderTaskConsoleUrl(title)) handler('api-console', 'actions.apiConsole');
    if (title['remoteTaskId']) handler('copy-task-id', 'actions.copyTaskId');
    const localPath2 = getResultLocalPath(title['result']);
    if (localPath2) handler('reveal', 'actions.reveal', { localPath: localPath2 });
    if (title['error']) handler('copy-error', 'actions.copyError');
    const thumbnail =
      title['status'] === 'complete'
        ? title['thumbnail'] || resolveTaskCenterThumbnail(title['result'], title['kind'])
        : null;
    return (
      taskCardView['update']({
        title: title['title'] || getTaskLabel(title['kind']),
        context: [title['projectTitle'], title['provider'], title['modelId']]
          ['filter'](Boolean)
          ['join'](' · '),
        meta: [
          title['message'] || getStatusLabel(title['status']),
          duration ? taskCenterText('duration', { duration: duration }) : '',
        ]
          ['filter'](Boolean)
          ['join'](' · '),
        status: title['status'],
        statusLabel: getStatusLabel(title['status']),
        active: ACTIVE_TASK_STATUSES['has'](title['status']),
        progress: title['progress'],
        error: title['error'],
        remoteId: title['remoteTaskId'],
        actions: actions,
        thumbnail: thumbnail,
        thumbnailLabel: thumbnail ? taskCenterText('resultPreview', { count: thumbnail['count'] }) : '',
      }),
      taskCardView['card']
    );
  }
  ['handleClick'](event2) {
    const taskId3 = event2['target']['closest']('[data-task-action]');
    if (!taskId3 || taskId3['disabled']) return;
    (event2['preventDefault'](), event2['stopPropagation']());
    const value13 = taskId3['dataset']['taskAction'] || '';
    this['runTaskAction'](value13, {
      taskId: taskId3['dataset']['taskId'] || '',
      localPath: taskId3['dataset']['localPath'] || '',
    });
  }
  ['handleContextMenu'](event3) {
    const ownerElement = event3['target']?.['closest']?.('.v2-task-card');
    if (!ownerElement || !this['panel']?.['contains']?.(ownerElement)) return;
    const taskId4 = String(ownerElement['dataset']['taskId'] || ''),
      response13 = this['tasks']['get'](taskId4);
    if (!response13) return;
    const list5 = [];
    ACTIVE_TASK_STATUSES['has'](response13['status']) &&
      response13['cancellable'] === true &&
      list5['push']({
        label: taskCenterText('actions.cancel'),
        icon: 'cancel',
        danger: true,
        shortcutActionId: 'context-task-cancel',
        action: () => this['runTaskAction']('cancel', { taskId: taskId4 }),
      });
    const localPath3 = getResultLocalPath(response13['result']);
    localPath3 &&
      list5['push']({
        label: taskCenterText('actions.reveal'),
        icon: 'reveal',
        shortcutActionId: 'context-task-reveal',
        disabled: !desktopBridge['shell']['canShowItemInFolder'](),
        action: () => this['runTaskAction']('reveal', { localPath: localPath3 }),
      });
    response13['error'] &&
      list5['push']({
        label: taskCenterText('actions.copyError'),
        icon: 'copy',
        shortcutActionId: 'context-task-copy-error',
        action: () => this['runTaskAction']('copy-error', { taskId: taskId4 }),
      });
    if (!list5['length']) return;
    (event3['preventDefault'](),
      event3['stopPropagation'](),
      this['closeContextMenu'](),
      (this['contextMenuTaskId'] = taskId4),
      (this['contextMenuSession'] = this['contextMenuPresenter'](
        event3['clientX'],
        event3['clientY'],
        list5,
        { ensureItemIcons: true, ownerElement: ownerElement, ownerRoot: this['panel'] },
      )));
  }
  ['runTaskAction'](value14, { taskId: taskId = '', localPath: localPath = '' } = {}) {
    if (value14 === 'clear-terminal') {
      this['closeContextMenu']();
      for (const [value15, response14] of this['tasks']) {
        if (TERMINAL_TASK_STATUSES['has'](response14['status'])) this['tasks']['delete'](value15);
      }
      return (this['render'](), Promise['resolve']());
    }
    const value16 = taskId + ':' + value14;
    if (this['pendingActions']['has'](value16)) return Promise['resolve']();
    return (
      this['pendingActions']['add'](value16),
      this['render'](),
      executeTaskCenterAction(this, value14, this['tasks']['get'](taskId), localPath, taskCenterText)
        ['catch']((error) =>
          window['showToast']?.(error?.['message'] || taskCenterText('actionFailed'), 'error'),
        )
        ['finally'](() => {
          (this['pendingActions']['delete'](value16), this['render']());
        })
    );
  }
}
export function initTaskCenterManager(options2 = {}) {
  if (globalThis['window']?.['__aiCanvasTaskCenterManager'])
    return globalThis['window']['__aiCanvasTaskCenterManager'];
  const taskCenterManager = new TaskCenterManager(options2);
  return ((globalThis['window']['__aiCanvasTaskCenterManager'] = taskCenterManager), taskCenterManager);
}
