import { showTaskStatusNotification } from '../services/completionNotificationService.js';
import { ACTIVE_TASK_STATUSES } from './taskCenterModel.js';
const WAIT_NOTICE_MS = 10 * 60 * 1000,
  clean = (text, limit) =>
    String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, limit);
export function createTaskStatusFeedback({
  notify: notify = showTaskStatusNotification,
  setTimer: setTimer = setTimeout,
  clearTimer: clearTimer = clearTimeout,
  waitMs: waitMs = WAIT_NOTICE_MS,
  mergeMs: mergeMs = 600,
  now: now = Date.now,
} = {}) {
  const createdAt = now(),
    waitingTasks = new Map(),
    pendingFailures = new Map();
  let destroyed = false;
  function emitNotification(payload) {
    if (destroyed) return;
    try {
      Promise.resolve(notify(payload)).catch(console.warn);
    } catch (error) {
      console.warn(error);
    }
  }
  function pickNavigation(task) {
    return task.navigation ? { ...task.navigation } : null;
  }
  function queueFailureNotice(task) {
    const groupKey = JSON.stringify([task.source, task.projectId, task.canvasId]);
    let group = pendingFailures.get(groupKey);
    (!group &&
      ((group = {
        tasks: [],
        timer: setTimer(() => {
          pendingFailures.delete(groupKey);
          const failed = group.tasks.filter((entry) => entry.status === 'failed');
          if (!failed.length) return;
          const first = failed[0],
            title = clean(first.title, 60) || '生成任务',
            detail = clean(first.error, 120) || '请点击查看任务详情',
            completedCount = group.tasks.filter((entry) => entry.status === 'complete').length;
          emitNotification({
            type: 'error',
            navigation: pickNavigation(first),
            body:
              group.tasks.length === 1
                ? title + '失败：' + detail
                : '多项任务已结束：成功 ' +
                  completedCount +
                  ' 个，失败 ' +
                  failed.length +
                  ' 个。' +
                  title +
                  '：' +
                  detail,
          });
        }, mergeMs),
      }),
      group.timer?.unref?.(),
      pendingFailures.set(groupKey, group)),
      group.tasks.push({ ...task, navigation: pickNavigation(task) }));
  }
  return {
    observe(task, previous, { silent: silent = false } = {}) {
      if (destroyed) return;
      const waitingEntry = waitingTasks.get(task.taskId);
      if (ACTIVE_TASK_STATUSES.has(task.status)) {
        if (waitingEntry) {
          waitingEntry.task = { ...task, navigation: pickNavigation(task) };
          return;
        }
        const entry = { task: { ...task, navigation: pickNavigation(task) }, timer: null };
        ((entry.timer = setTimer(() => {
          ((entry.timer = null),
            emitNotification({
              type: 'warn',
              navigation: pickNavigation(entry.task),
              body:
                (clean(entry.task.title, 60) || '生成任务') +
                '等待较久，尚未确认完成。点击查看进度，请勿重复提交。',
            }));
        }, waitMs)),
          entry.timer?.unref?.(),
          waitingTasks.set(task.taskId, entry));
        return;
      }
      waitingEntry && (clearTimer(waitingEntry.timer), waitingTasks.delete(task.taskId));
      const isFreshFailure =
        !previous &&
        task.status === 'failed' &&
        Number(task.startedAt || task.createdAt) >= createdAt;
      if (silent || (!isFreshFailure && !ACTIVE_TASK_STATUSES.has(previous?.status))) return;
      if (['failed', 'complete'].includes(task.status)) queueFailureNotice(task);
    },
    destroy() {
      destroyed = true;
      for (const entry of waitingTasks.values()) clearTimer(entry.timer);
      for (const entry of pendingFailures.values()) clearTimer(entry.timer);
      (waitingTasks.clear(), pendingFailures.clear());
    },
  };
}
