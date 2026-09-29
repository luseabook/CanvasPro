import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildStoryBackgroundTaskId,
  finishStoryBackgroundTask,
  getStoryBackgroundTaskSummary,
  getStoryBackgroundTasks,
  interruptStoryBackgroundTasks,
  isStoryBackgroundTaskActive,
  normalizeStoryBackgroundTask,
  setStoryBackgroundTasks,
  startStoryBackgroundTask,
  updateStoryBackgroundTask,
  updateStoryBackgroundTaskBatch,
} from './storyBackgroundTasks.js';

function createTask(overrides = {}) {
  return {
    type: 'video',
    scope: { canvasId: 'canvas-1' },
    label: '视频生成',
    status: 'running',
    startedAt: 100,
    updatedAt: 100,
    ...overrides,
  };
}

test('storyBackgroundTasks: builds stable ids from normalized, sorted scope values', () => {
  assert.equal(buildStoryBackgroundTaskId(' video ', { b: ' 2 ', a: '1', empty: '   ' }), 'video:a:1:b:2');
  assert.equal(buildStoryBackgroundTaskId('video'), 'video');
  assert.equal(buildStoryBackgroundTaskId('', {}), 'task');
});

test('storyBackgroundTasks: normalizes defaults, scope, batch counters, and terminal timestamps', () => {
  const task = normalizeStoryBackgroundTask({
    status: 'succeeded',
    scope: { canvasId: ' canvas-1 ', empty: '' },
    batch: { id: ' batch-1 ', type: ' video ', total: 4, completed: 9 },
    startedAt: 200,
    updatedAt: 100,
    resumePayload: { nested: true },
  });

  assert.deepEqual(task.scope, { canvasId: 'canvas-1' });
  assert.equal(task.id, 'task:canvasId:canvas-1');
  assert.equal(task.label, '生成任务');
  assert.equal(task.startedAt, 200);
  assert.equal(task.updatedAt, 200);
  assert.equal(task.finishedAt, 200);
  assert.deepEqual(task.batch, {
    id: 'batch-1',
    type: 'video',
    total: 4,
    completed: 4,
    label: '',
  });
  assert.deepEqual(task.resumePayload, { nested: true });
  assert.equal(isStoryBackgroundTaskActive(task), false);
});

test('storyBackgroundTasks: persistence prunes terminal tasks to the last sixty but keeps active tasks', () => {
  const state = { project: { backgroundTasks: [] } };
  const tasks = Array.from({ length: 65 }, (_value, index) =>
    createTask({
      id: 'task-' + index,
      status: 'succeeded',
      updatedAt: index,
      startedAt: index,
    }),
  );
  tasks.push(createTask({ id: 'active-task', status: 'running', updatedAt: 1 }));

  const saved = setStoryBackgroundTasks(state, tasks);
  assert.equal(saved.length, 61);
  assert.equal(
    saved.some((task) => task.id === 'active-task'),
    true,
  );
  assert.equal(saved.filter((task) => task.status === 'succeeded').length, 60);
  assert.equal(state.project.backgroundTasks.length, 61);
});

test('storyBackgroundTasks: start replaces an existing task with the same id and prepends it', () => {
  const state = { project: { backgroundTasks: [] } };
  const first = startStoryBackgroundTask(state, {
    id: 'video-task',
    type: 'video',
    label: '第一次',
    startedAt: 100,
  });
  const second = startStoryBackgroundTask(state, {
    id: 'video-task',
    type: 'video',
    label: '第二次',
    startedAt: 200,
  });

  assert.equal(first.status, 'running');
  assert.equal(first.finishedAt, 0);
  assert.equal(first.error, '');
  assert.equal(second.label, '第二次');
  assert.equal(getStoryBackgroundTasks(state).length, 1);
  assert.equal(getStoryBackgroundTasks(state)[0].id, 'video-task');
});

test('storyBackgroundTasks: update restarts terminal tasks and refreshes active batch progress', () => {
  const state = { project: { backgroundTasks: [] } };
  startStoryBackgroundTask(state, {
    id: 'batch-task',
    type: 'image',
    status: 'running',
    batch: { id: 'batch-1', type: 'image', total: 3, completed: 1 },
    startedAt: 100,
  });

  assert.equal(updateStoryBackgroundTaskBatch(state, 'batch-1', { completed: 2 }), 1);
  assert.equal(getStoryBackgroundTasks(state)[0].batch.completed, 2);
  finishStoryBackgroundTask(state, 'batch-task', { status: 'failed', error: '失败' });
  const restarted = updateStoryBackgroundTask(state, 'batch-task', { status: 'running' });

  assert.equal(restarted.status, 'running');
  assert.equal(restarted.batch, null);
  assert.equal(restarted.error, '');
  assert.equal(restarted.finishedAt, 0);
  assert.equal(updateStoryBackgroundTask(state, 'missing', { status: 'failed' }), null);
});

test('storyBackgroundTasks: interruption preserves resumable remote tasks by default', () => {
  const state = { project: { backgroundTasks: [] } };
  startStoryBackgroundTask(state, {
    id: 'resumable',
    status: 'running',
    resumable: true,
    remoteTaskId: 'remote-1',
    startedAt: 100,
  });
  startStoryBackgroundTask(state, {
    id: 'local',
    status: 'running',
    startedAt: 100,
  });

  assert.equal(interruptStoryBackgroundTasks(state), 1);
  assert.equal(getStoryBackgroundTasks(state).find((task) => task.id === 'resumable').status, 'running');
  assert.equal(getStoryBackgroundTasks(state).find((task) => task.id === 'local').status, 'interrupted');
  assert.equal(interruptStoryBackgroundTasks(state, { includeResumable: true }), 1);
  assert.equal(getStoryBackgroundTasks(state).find((task) => task.id === 'resumable').status, 'interrupted');
});

test('storyBackgroundTasks: summary counts unique batches in active and failed groups', () => {
  const state = { project: { backgroundTasks: [] } };
  startStoryBackgroundTask(state, {
    id: 'active-a',
    status: 'running',
    batch: { id: 'batch-1', type: 'image', total: 2, completed: 0 },
    startedAt: 100,
  });
  startStoryBackgroundTask(state, {
    id: 'active-b',
    status: 'running',
    batch: { id: 'batch-1', type: 'image', total: 2, completed: 1 },
    startedAt: 100,
  });
  startStoryBackgroundTask(state, {
    id: 'failed-a',
    status: 'failed',
    batch: { id: 'batch-2', type: 'video', total: 1, completed: 0 },
    startedAt: 100,
  });

  const summary = getStoryBackgroundTaskSummary(state);
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.failedCount, 1);
  assert.equal(summary.label, '后台生成中 · 1 个任务');
  assert.equal(summary.activeTasks.length, 2);
  assert.equal(summary.failedTasks.length, 1);
});
