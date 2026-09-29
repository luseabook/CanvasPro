import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioVoiceAnalysisSession } from './audioVoiceAnalysisSession.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function createSpyCancel() {
  const calls = [];
  const cancelMediaTask = async (taskId) => {
    calls.push(taskId);
  };
  return { calls, cancelMediaTask };
}

test('starts with no active session', () => {
  const session = createAudioVoiceAnalysisSession();
  assert.equal(session.getActive(), null);
  assert.equal(session.isCurrent(null), false);
  assert.equal(session.isCurrent(undefined), false);
});

test('begin trims identifiers, assigns incrementing ids and empty task sets', () => {
  const session = createAudioVoiceAnalysisSession();
  const first = session.begin({ sourceNodeId: '  node-a ', sourceKey: ' key-1 ' });
  assert.equal(first.id, 1);
  assert.equal(first.sourceNodeId, 'node-a');
  assert.equal(first.sourceKey, 'key-1');
  assert.equal(first.invalidated, false);
  assert.equal(first.tasksCancelled, false);
  assert.equal(first.taskIds.size, 0);
  assert.equal(session.getActive(), first);
  const second = session.begin({ sourceNodeId: 'node-b', sourceKey: 'key-2' });
  assert.equal(second.id, 2);
  assert.equal(session.getActive(), second);
});

test('begin defaults missing identifiers to empty strings', () => {
  const session = createAudioVoiceAnalysisSession();
  const started = session.begin();
  assert.equal(started.sourceNodeId, '');
  assert.equal(started.sourceKey, '');
});

test('begin invalidates the previous session and cancels its tracked tasks once', async () => {
  const { calls, cancelMediaTask } = createSpyCancel();
  const session = createAudioVoiceAnalysisSession({ cancelMediaTask });
  const first = session.begin({ sourceNodeId: 'n' });
  await session.trackTask(first, 'task-1');
  await session.trackTask(first, 'task-2');
  const second = session.begin({ sourceNodeId: 'n' });
  assert.equal(first.invalidated, true);
  assert.equal(first.tasksCancelled, true);
  assert.equal(session.isCurrent(first), false);
  await tick();
  assert.deepEqual([...calls].sort(), ['task-1', 'task-2']);
  assert.equal(session.isCurrent(second), true);
});

test('trackTask rejects empty ids without calling cancelMediaTask', async () => {
  const { calls, cancelMediaTask } = createSpyCancel();
  const session = createAudioVoiceAnalysisSession({ cancelMediaTask });
  const s = session.begin({ sourceNodeId: 'n' });
  assert.equal(await session.trackTask(s, '   '), false);
  assert.equal(await session.trackTask(s), false);
  assert.deepEqual(calls, []);
  assert.equal(s.taskIds.size, 0);
});

test('trackTask adds to the current session and cancels for a stale one', async () => {
  const { calls, cancelMediaTask } = createSpyCancel();
  const session = createAudioVoiceAnalysisSession({ cancelMediaTask });
  const s = session.begin({ sourceNodeId: 'n' });
  assert.equal(await session.trackTask(s, ' live '), true);
  assert.deepEqual([...s.taskIds], ['live']);
  const stale = { ...s, invalidated: true };
  assert.equal(await session.trackTask(stale, 'late'), false);
  assert.deepEqual(calls, ['late']);
});

test('trackTask swallows cancelMediaTask rejections', async () => {
  const session = createAudioVoiceAnalysisSession({
    cancelMediaTask: async () => {
      throw new Error('boom');
    },
  });
  const s = session.begin({ sourceNodeId: 'n' });
  await assert.doesNotReject(() => session.trackTask({ ...s, invalidated: true }, 'x'));
  assert.equal(await session.trackTask({ ...s, invalidated: true }, 'x'), false);
});

test('complete clears the active session only when it is current', async () => {
  const { calls, cancelMediaTask } = createSpyCancel();
  const session = createAudioVoiceAnalysisSession({ cancelMediaTask });
  const s = session.begin({ sourceNodeId: 'n' });
  await session.trackTask(s, 't1');
  assert.equal(session.complete({ ...s, invalidated: true }), false);
  assert.equal(session.complete(s), true);
  assert.equal(session.getActive(), null);
  assert.equal(s.invalidated, true);
  assert.equal(session.complete(s), false);
  await tick();
  assert.deepEqual(calls, []);
});

test('invalidate marks the active session and cancels its tasks', async () => {
  const { calls, cancelMediaTask } = createSpyCancel();
  const session = createAudioVoiceAnalysisSession({ cancelMediaTask });
  const s = session.begin({ sourceNodeId: 'n' });
  await session.trackTask(s, 'k');
  await session.invalidate();
  assert.equal(s.invalidated, true);
  assert.equal(session.getActive(), null);
  assert.deepEqual(calls, ['k']);
});

test('invalidate is a no-op when nothing is active', async () => {
  const session = createAudioVoiceAnalysisSession();
  await assert.doesNotReject(() => session.invalidate());
});

test('isActiveFor matches the trimmed node id of the current session', () => {
  const session = createAudioVoiceAnalysisSession();
  const s = session.begin({ sourceNodeId: 'node-x' });
  assert.equal(session.isActiveFor(' node-x '), true);
  assert.equal(session.isActiveFor('node-y'), false);
  session.complete(s);
  assert.equal(session.isActiveFor('node-x'), false);
});

test('default cancelMediaTask lets begin and invalidate run without options', async () => {
  const session = createAudioVoiceAnalysisSession();
  const s = session.begin({ sourceNodeId: 'n' });
  await session.trackTask(s, 'anything');
  await session.invalidate();
  assert.equal(session.getActive(), null);
});

test('begin rejects a null options bag instead of defaulting', () => {
  const session = createAudioVoiceAnalysisSession();
  assert.throws(() => session.begin(null), TypeError);
});
