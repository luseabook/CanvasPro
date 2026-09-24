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
function el(_0x4fc474, _0x108f9f = '', _0x2de09d = '') {
  const _0x47b74e = document.createElement(_0x4fc474);
  if (_0x108f9f) _0x47b74e.className = _0x108f9f;
  if (_0x2de09d) _0x47b74e.textContent = _0x2de09d;
  return _0x47b74e;
}
function taskCenterText(_0x3c985d, _0x131977 = {}) {
  return t('taskCenter.' + _0x3c985d, _0x131977);
}
function normalizeTask(_0x48bd03 = {}) {
  const _0x401447 = String(_0x48bd03.taskId || '').trim();
  if (!_0x401447) return null;
  return {
    taskId: _0x401447,
    nodeId: String(_0x48bd03.nodeId || '').trim(),
    assetId: String(_0x48bd03.assetId || '').trim(),
    kind: String(_0x48bd03.kind || '').trim(),
    source: String(_0x48bd03.source || '').trim() || 'mediaTask',
    status: String(_0x48bd03.status || '').trim() || 'waiting',
    progress: Math.max(0, Math.min(1, Number(_0x48bd03.progress || 0) || 0)),
    message: String(_0x48bd03.message || '').trim(),
    error: String(_0x48bd03.error || '').trim(),
    cancellable: _0x48bd03.cancellable === true,
    result: _0x48bd03.result && typeof _0x48bd03.result === 'object' ? _0x48bd03.result : null,
    createdAt: Number(_0x48bd03.createdAt || 0) || Date.now(),
    startedAt: Number(_0x48bd03.startedAt || 0) || 0,
    finishedAt: Number(_0x48bd03.finishedAt || 0) || 0,
    updatedAt: Date.now(),
  };
}
function getTaskLabel(_0x256aed) {
  if (_0x256aed === 'storySequenceExport') return '镜头顺序渲染（本地）';
  const _0x2bb7a2 = String(_0x256aed || '').trim();
  if (!_0x2bb7a2) return taskCenterText('taskKinds.mediaTask');
  const _0x55b220 = 'taskCenter.taskKinds.' + _0x2bb7a2,
    _0x1286ec = t(_0x55b220);
  return _0x1286ec === _0x55b220 ? taskCenterText('taskKinds.mediaTask') : _0x1286ec;
}
function getStatusLabel(_0x442315) {
  const _0x6dbbbb = String(_0x442315 || '').trim();
  if (!_0x6dbbbb) return taskCenterText('statuses.fallback');
  const _0x5aea6d = 'taskCenter.statuses.' + _0x6dbbbb,
    _0x1f75ca = t(_0x5aea6d);
  return _0x1f75ca === _0x5aea6d ? taskCenterText('statuses.fallback') : _0x1f75ca;
}
function formatPercent(_0x1cfc75) {
  return Math.round(Math.max(0, Math.min(1, Number(_0x1cfc75) || 0)) * 100) + '%';
}
function formatDuration(_0x205e42) {
  const _0x1efedd = Math.max(0, Math.floor(Number(_0x205e42 || 0) / 0x3e8)),
    _0x2c7c51 = Math.floor(_0x1efedd / 60),
    _0x17d45d = _0x1efedd % 60;
  if (_0x2c7c51 <= 0) return _0x17d45d + 's';
  return _0x2c7c51 + 'm ' + String(_0x17d45d).padStart(2, '0') + 's';
}
function getTaskDuration(_0x1a7fc7) {
  const _0x3b2616 = Number(_0x1a7fc7.startedAt || _0x1a7fc7.createdAt || 0) || 0,
    _0x3aeb16 = Number(_0x1a7fc7.finishedAt || 0) || (ACTIVE_STATUSES.has(_0x1a7fc7.status) ? Date.now() : 0);
  if (!_0x3b2616 || !_0x3aeb16) return '';
  return formatDuration(_0x3aeb16 - _0x3b2616);
}
function getResultLocalPath(_0x4ec52f) {
  return pickResultLocalPath(_0x4ec52f);
}
function sortTasks(_0x260403) {
  const _0x5cf729 = { processing: 0, waiting: 1, failed: 2, complete: 3, cancelled: 4 };
  return [..._0x260403].sort((_0x2c1d09, _0x2198f5) => {
    const _0x21bdfa = _0x5cf729[_0x2c1d09.status] ?? 9,
      _0x36735e = _0x5cf729[_0x2198f5.status] ?? 9;
    if (_0x21bdfa !== _0x36735e) return _0x21bdfa - _0x36735e;
    return (
      Number(_0x2198f5.updatedAt || _0x2198f5.createdAt || 0) -
      Number(_0x2c1d09.updatedAt || _0x2c1d09.createdAt || 0)
    );
  });
}
function getElectronMediaTaskApi() {
  const _0x490395 = globalThis.window?.electronAPI?.mediaTask;
  if (!_0x490395 || typeof _0x490395 !== 'object') return null;
  return _0x490395;
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
    const _0x99e8b8 = document.getElementById('btnTasks');
    this.badgeEl = document.getElementById('taskCenterBadge');
    const _0x385477 = document.querySelector('.sidebar-floating') || document.body;
    ((this.panel = el('div', 'v2-task-center-panel')),
      this.panel.setAttribute('aria-label', taskCenterText('ariaLabel')));
    const _0x1f1d9d = el('div', 'v2-task-center-header');
    ((this.titleEl = el('div', 'v2-task-center-title', taskCenterText('title'))),
      (this.clearBtn = el('button', 'v2-task-center-action', taskCenterText('clearDone'))),
      (this.clearBtn.type = 'button'),
      (this.clearBtn.dataset.taskAction = 'clear-terminal'),
      _0x1f1d9d.append(this.titleEl, this.clearBtn),
      (this.summaryEl = el('div', 'v2-task-center-summary')),
      (this.listEl = el('div', 'v2-task-center-list')),
      this.panel.append(_0x1f1d9d, this.summaryEl, this.listEl),
      _0x385477.appendChild(this.panel),
      _0x99e8b8 &&
        registerSidebarSubmenu({
          key: 'tasks',
          button: _0x99e8b8,
          panel: this.panel,
          open: () => this.show(),
          close: () => this.hide(),
          isOpen: () => this.panel.classList.contains('show'),
        }),
      this.panel.addEventListener('click', (_0x1fb1ed) => this.handleClick(_0x1fb1ed)),
      this.render());
  }
  initRecoveryPanel() {
    this.mediaTaskReader = createMediaTaskListRefresh({
      api: getElectronMediaTaskApi(),
      onTask: task => this.upsertTask(task, { silent: true }),
      onComplete: () => this.scheduleRender(),
    });
    this.recoveryPanel = createMediaTaskRecoveryPanel({
      api: getElectronMediaTaskApi(), refresh: () => this.mediaTaskReader.refresh(),
    });
    this.panel.insertBefore(this.recoveryPanel.el, this.listEl);
    this.historyPanel = new MediaTaskHistoryPanel({ api: getElectronMediaTaskApi()?.history, createRecoveryPanel: createMediaTaskRecoveryPanel });
    this.panel.insertBefore(this.historyPanel.el, this.listEl);
  }
  ['bindLocaleChange']() {
    this.unsubscribeLocale = onLocaleChange(() => {
      this.render();
    });
  }
  ['bindMediaTasks']() {
    const _0x33984f = getElectronMediaTaskApi();
    if (!_0x33984f) {
      this.render();
      return;
    }
    const initialLookupSequence = this.recoveryPanel.sequence;
    (typeof _0x33984f.onUpdate === 'function' &&
      (this.unsubscribe = _0x33984f.onUpdate((_0x113203) => {
        this.mediaTaskReader.noteEvent(_0x113203 || {});
        this.upsertTask(_0x113203 || {});
      })),
      typeof _0x33984f.list === 'function' &&
        this.mediaTaskReader.refresh().catch(() => {
          if (this.recoveryPanel.sequence === initialLookupSequence) {
            this.recoveryPanel.message.textContent = '初次宿主列表读取失败，状态待核对；可手动刷新。不自动重发任务。';
          }
        }));
  }
  ['bindGenerationTasks']() {
    if (!globalThis.window?.addEventListener) return;
    const _0x51d4f3 = (_0x194230) => {
      this.upsertTask({ ...(_0x194230?.detail || {}), source: 'generation' });
    };
    (window.addEventListener(GENERATION_TASK_CENTER_EVENT, _0x51d4f3),
      (this.unsubscribeGenerationTasks = () => {
        window.removeEventListener(GENERATION_TASK_CENTER_EVENT, _0x51d4f3);
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
    return [...this.tasks.values()].some((_0x1c5d2c) => ACTIVE_STATUSES.has(_0x1c5d2c.status));
  }
  ['retireDuplicateGenerationTasks'](_0x128361) {
    if (
      _0x128361?.source !== 'generation' ||
      _0x128361.kind !== 'dreaminaVideo' ||
      !_0x128361.nodeId ||
      !ACTIVE_STATUSES.has(_0x128361.status)
    )
      return;
    for (const [_0x2b553e, _0x2d3076] of this.tasks.entries()) {
      if (_0x2b553e === _0x128361.taskId) continue;
      _0x2d3076?.source === 'generation' &&
        _0x2d3076.kind === 'dreaminaVideo' &&
        _0x2d3076.nodeId === _0x128361.nodeId &&
        ACTIVE_STATUSES.has(_0x2d3076.status) &&
        this.tasks.set(_0x2b553e, {
          ..._0x2d3076,
          status: 'complete',
          progress: 1,
          message: _0x2d3076.message || 'Replaced by latest task',
          finishedAt: _0x2d3076.finishedAt || Date.now(),
          updatedAt: Date.now(),
        });
    }
  }
  ['upsertTask'](_0xf01090, { silent: silent = false } = {}) {
    const _0x48cc70 = normalizeTask(_0xf01090);
    if (!_0x48cc70) return;
    this.retireDuplicateGenerationTasks(_0x48cc70);
    const _0x4f2ad7 = this.tasks.get(_0x48cc70.taskId);
    (this.tasks.set(_0x48cc70.taskId, { ...(_0x4f2ad7 || {}), ..._0x48cc70, updatedAt: Date.now() }),
      this.trimTasks());
    if (!silent) this.scheduleRender();
    if (ACTIVE_STATUSES.has(_0x48cc70.status)) this.startClock();
  }
  ['trimTasks']() {
    if (this.tasks.size <= MAX_TASKS) return;
    const _0x1d3bcb = sortTasks([...this.tasks.values()]).slice(0, MAX_TASKS);
    this.tasks = new Map(_0x1d3bcb.map((_0x3f2e6a) => [_0x3f2e6a.taskId, _0x3f2e6a]));
  }
  ['scheduleRender']() {
    if (this.renderTimer) return;
    this.renderTimer = window.requestAnimationFrame(() => {
      ((this.renderTimer = 0), this.render());
    });
  }
  ['getTaskGroups']() {
    const _0x18fee1 = sortTasks([...this.tasks.values()]);
    return {
      active: _0x18fee1.filter((_0x4ad4bc) => ACTIVE_STATUSES.has(_0x4ad4bc.status)),
      failed: _0x18fee1.filter((_0x16a849) => _0x16a849.status === 'failed'),
      done: _0x18fee1.filter(
        (_0x13a0ef) => _0x13a0ef.status === 'complete' || _0x13a0ef.status === 'cancelled',
      ),
    };
  }
  ['updateBadge'](_0x487923) {
    const _0x2975d1 = _0x487923.active.length;
    if (!this.badgeEl) return;
    ((this.badgeEl.hidden = _0x2975d1 <= 0),
      (this.badgeEl.textContent = _0x2975d1 > 99 ? '99+' : String(_0x2975d1)));
  }
  ['render']() {
    if (!this.listEl || !this.summaryEl) return;
    const _0x48d3af = getElectronMediaTaskApi(),
      _0x461313 = this.getTaskGroups();
    this.updateBadge(_0x461313);
    const _0x4db42c = _0x461313.failed.length,
      _0x104c2c = _0x461313.done.length,
      _0x1aa98d = _0x461313.active.length + _0x4db42c + _0x104c2c;
    this.panel?.setAttribute('aria-label', taskCenterText('ariaLabel'));
    if (this.clearBtn) this.clearBtn.textContent = taskCenterText('clearDone');
    if (this.titleEl) this.titleEl.textContent = taskCenterText('title');
    this.summaryEl.textContent =
      _0x48d3af || _0x1aa98d > 0
        ? taskCenterText('summary', { active: _0x461313.active.length, failed: _0x4db42c, done: _0x104c2c })
        : taskCenterText('unavailableSummary');
    if (this.clearBtn) this.clearBtn.hidden = _0x104c2c + _0x4db42c <= 0;
    this.listEl.replaceChildren();
    if (!_0x48d3af && _0x1aa98d <= 0) {
      this.listEl.appendChild(el('div', 'v2-task-center-empty', taskCenterText('unavailable')));
      return;
    }
    if (_0x1aa98d === 0) {
      this.listEl.appendChild(el('div', 'v2-task-center-empty', taskCenterText('empty')));
      return;
    }
    (_0x461313.active.length &&
      this.listEl.appendChild(this.renderSection(taskCenterText('sections.active'), _0x461313.active)),
      _0x461313.failed.length &&
        this.listEl.appendChild(this.renderSection(taskCenterText('sections.failed'), _0x461313.failed)),
      _0x461313.done.length &&
        this.listEl.appendChild(
          this.renderSection(taskCenterText('sections.done'), _0x461313.done.slice(0, 40)),
        ));
  }
  ['renderSection'](_0x472c31, _0x225503) {
    const _0x3fe67e = el('section', 'v2-task-center-section');
    return (
      _0x3fe67e.appendChild(el('div', 'v2-task-center-section-title', _0x472c31)),
      _0x225503.forEach((_0x5eeb7f) => _0x3fe67e.appendChild(this.renderTaskCard(_0x5eeb7f))),
      _0x3fe67e
    );
  }
  ['renderTaskCard'](_0x15b94d) {
    const _0x5292c3 = el('article', 'v2-task-card');
    _0x5292c3.dataset.taskId = _0x15b94d.taskId;
    const _0x54e9d5 = el('div', 'v2-task-card-header'),
      _0x1652c1 = el('div', 'v2-task-card-main');
    _0x1652c1.appendChild(el('div', 'v2-task-card-title', getTaskLabel(_0x15b94d.kind)));
    const _0x585184 = getTaskDuration(_0x15b94d),
      _0x43cd57 = [
        _0x15b94d.message || getStatusLabel(_0x15b94d.status),
        _0x585184 ? taskCenterText('duration', { duration: _0x585184 }) : '',
      ]
        .filter(Boolean)
        .join(' · ');
    _0x1652c1.appendChild(el('div', 'v2-task-card-meta', _0x43cd57));
    const _0x3af886 = el(
      'span',
      'v2-task-status v2-task-status--' + _0x15b94d.status,
      getStatusLabel(_0x15b94d.status),
    );
    (_0x54e9d5.append(_0x1652c1, _0x3af886), _0x5292c3.appendChild(_0x54e9d5));
    if (
      (_0x15b94d.status === 'waiting' || _0x15b94d.status === 'processing') &&
      _0x15b94d.cancellable === true
    ) {
      const _0xd93bc0 = el('div', 'v2-task-progress'),
        _0x21afd0 = el('div', 'v2-task-progress-fill');
      ((_0x21afd0.style.width = formatPercent(_0x15b94d.status === 'waiting' ? 0 : _0x15b94d.progress)),
        _0xd93bc0.appendChild(_0x21afd0),
        _0x5292c3.appendChild(_0xd93bc0));
    }
    _0x15b94d.error && _0x5292c3.appendChild(el('div', 'v2-task-card-error', _0x15b94d.error));
    const _0x1fbe40 = this.renderTaskActions(_0x15b94d);
    if (_0x1fbe40.childElementCount > 0) _0x5292c3.appendChild(_0x1fbe40);
    return _0x5292c3;
  }
  ['renderTaskActions'](_0x32b8cf) {
    const _0x22e902 = el('div', 'v2-task-card-actions');
    if (
      (_0x32b8cf.status === 'waiting' || _0x32b8cf.status === 'processing') &&
      _0x32b8cf.cancellable === true
    ) {
      const _0x25b7f2 = el(
        'button',
        'v2-task-card-action v2-task-card-action--danger',
        taskCenterText('actions.cancel'),
      );
      ((_0x25b7f2.type = 'button'),
        (_0x25b7f2.dataset.taskAction = 'cancel'),
        (_0x25b7f2.dataset.taskId = _0x32b8cf.taskId),
        _0x22e902.appendChild(_0x25b7f2));
    }
    if (_0x32b8cf.source === 'mediaTask') {
      const lookup = el('button', 'v2-task-card-action', '查找 / 取回');
      lookup.type = 'button'; lookup.dataset.taskAction = 'lookup-local';
      lookup.dataset.taskId = _0x32b8cf.taskId; _0x22e902.appendChild(lookup);
    }
    const _0x574de5 = getResultLocalPath(_0x32b8cf.result);
    if (_0x574de5) {
      const _0x18f768 = el('button', 'v2-task-card-action', taskCenterText('actions.reveal'));
      ((_0x18f768.type = 'button'),
        (_0x18f768.dataset.taskAction = 'reveal'),
        (_0x18f768.dataset.localPath = _0x574de5),
        _0x22e902.appendChild(_0x18f768));
    }
    if (_0x32b8cf.error) {
      const _0x465529 = el('button', 'v2-task-card-action', taskCenterText('actions.copyError'));
      ((_0x465529.type = 'button'),
        (_0x465529.dataset.taskAction = 'copy-error'),
        (_0x465529.dataset.taskId = _0x32b8cf.taskId),
        _0x22e902.appendChild(_0x465529));
    }
    return _0x22e902;
  }
  ['handleClick'](_0x2e6e28) {
    const _0x8322b0 = _0x2e6e28.target.closest('[data-task-action]');
    if (!_0x8322b0) return;
    (_0x2e6e28.preventDefault(), _0x2e6e28.stopPropagation());
    const _0x2211d7 = _0x8322b0.dataset.taskAction || '';
    if (_0x2211d7 === 'lookup-local') {
      void this.recoveryPanel.lookup(_0x8322b0.dataset.taskId || '');
      return;
    }
    if (_0x2211d7 === 'clear-terminal') {
      this.mediaTaskReader?.invalidate();
      for (const [_0x49f2d1, _0x238485] of this.tasks.entries()) {
        if (TERMINAL_STATUSES.has(_0x238485.status)) this.tasks.delete(_0x49f2d1);
      }
      this.render();
      return;
    }
    if (_0x2211d7 === 'cancel') {
      const _0x1fd541 = _0x8322b0.dataset.taskId || '',
        _0x29b332 = this.tasks.get(_0x1fd541);
      if (_0x29b332?.source === 'generation' && _0x29b332.kind === 'dreaminaVideo') {
        void cancelDreaminaVideoQueueTask(_0x1fd541)
          .then(() => {
            this.upsertTask({
              ..._0x29b332,
              status: 'cancelled',
              progress: 0,
              message: taskCenterText('cancelledMessage'),
              error: '',
              finishedAt: Date.now(),
            });
          })
          .catch((_0x3ea485) => {
            window.showToast?.(_0x3ea485?.message || taskCenterText('cancelFailed'), 'error');
          });
        return;
      }
      void getElectronMediaTaskApi()
        ?.cancel?.({ taskId: _0x1fd541 })
        .catch((_0xc8136d) => {
          window.showToast?.(_0xc8136d?.message || taskCenterText('cancelFailed'), 'error');
        });
      return;
    }
    if (_0x2211d7 === 'reveal') {
      const _0x25f10a = _0x8322b0.dataset.localPath || '';
      void globalThis.window?.electronAPI
        ?.showItemInFolder?.({ localPath: _0x25f10a })
        ?.catch((_0x2ce34f) => {
          window.showToast?.(_0x2ce34f?.message || taskCenterText('revealFailed'), 'error');
        });
      return;
    }
    if (_0x2211d7 === 'copy-error') {
      const _0x55402e = this.tasks.get(_0x8322b0.dataset.taskId || ''),
        _0x1cbac2 = _0x55402e?.error || '';
      if (!_0x1cbac2) return;
      const _0xfc0fd1 = globalThis.window?.electronAPI?.clipboard,
        _0x2eea6c =
          typeof _0xfc0fd1?.writeText === 'function'
            ? _0xfc0fd1.writeText({ text: _0x1cbac2 })
            : globalThis.navigator?.clipboard?.writeText?.(_0x1cbac2);
      if (!_0x2eea6c) {
        window.showToast?.(taskCenterText('copyFailed'), 'error');
        return;
      }
      void Promise.resolve(_0x2eea6c)
        .then(() => window.showToast?.(taskCenterText('copySuccess'), 'success'))
        .catch(() => window.showToast?.(taskCenterText('copyFailed'), 'error'));
    }
  }
}
export function initTaskCenterManager() {
  if (globalThis.window?.__aiCanvasTaskCenterManager) return globalThis.window.__aiCanvasTaskCenterManager;
  const _0x264392 = new TaskCenterManager();
  return ((globalThis.window.__aiCanvasTaskCenterManager = _0x264392), _0x264392);
}
