import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorySummaryRunRecorder, normalizeStorySummaryRun } from './storySummaryRun.js';

const REQUEST = {
  mode: 'generate',
  scriptMode: 'plot',
  idea: '点子',
  model: 'm1',
  provider: 'p1',
  providerProfileId: 'pp',
  planning: { b: 1, a: 2 },
};
function recorder(options = {}) {
  const changes = [];
  const instance = createStorySummaryRunRecorder({
    project: { id: 'proj' },
    request: REQUEST,
    onChange: (run) => changes.push(run),
    ...options,
  });
  return { instance, changes };
}

test('normalizing accepts wrapped and bare version-1 runs only', () => {
  assert.equal(normalizeStorySummaryRun(null), null);
  assert.equal(normalizeStorySummaryRun({ kind: 'story-summary-run', version: 2 }), null);
  assert.equal(normalizeStorySummaryRun({ kind: 'other', version: 1 }), null);
  const invocations = Array.from({ length: 10 }, (_, index) => ({
    id: 'i' + index,
    stepId: 's',
    attempt: 0,
    rawResponse: 'x'.repeat(130000),
  }));
  const run = normalizeStorySummaryRun({
    kind: 'story-summary-run',
    run: {
      kind: 'story-summary-run',
      version: '1',
      id: ' r ',
      invocations: [{ id: '', stepId: 's' }, ...invocations],
    },
  });
  assert.equal(run.id, 'r');
  assert.equal(run.status, 'running');
  assert.deepEqual(run.input, {});
  assert.equal(run.candidateArtifact, null);
  assert.deepEqual(
    run.invocations.map((invocation) => invocation.id),
    ['i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9'],
  );
  assert.equal(run.invocations[0].attempt, 1);
  assert.equal(run.invocations[0].rawResponse.length, 120000);
  assert.ok(run.createdAt > 0 && run.updatedAt > 0);
});

test('a new recorder creates a running run keyed by project and input', async () => {
  const { instance, changes } = recorder();
  assert.equal(Object.isFrozen(instance), true);
  const { run } = instance.payload();
  assert.match(run.id, /^story-summary:proj:\d+:\d+$/);
  assert.equal(run.status, 'running');
  assert.match(run.inputFingerprint, /^fnv1a-[0-9a-f]{8}$/);
  assert.equal(run.input.projectId, 'proj');
  assert.equal(run.input.promptVersion, 'story-summary/v3');
  assert.equal(run.input.schemaVersion, 'story-summary/v2');
  assert.deepEqual(instance.execution, { modelId: 'm1', provider: 'p1', providerProfileId: 'pp' });
  assert.equal(instance.candidateArtifact, null);
  assert.equal(instance.requiresPaidRetry, false);
  await instance.start();
  assert.equal(changes.length, 1);
  assert.equal(changes[0].id, run.id);
  const rewrite = createStorySummaryRunRecorder({ request: { mode: 'rewrite' } });
  assert.match(rewrite.payload().run.id, /^story-summary:project:/);
  assert.equal(rewrite.payload().run.input.promptVersion, 'story-summary-rewrite/v1');
});

test('invocations are journaled and completed ones need paid retry authorization', async () => {
  const { instance } = recorder();
  await instance.onInvocation({
    state: 'prepared',
    stepId: 'summary',
    attempt: 1,
    requestPayload: { model: 'm1', prompt: 'p' },
  });
  let [invocation] = instance.payload().run.invocations;
  assert.equal(invocation.state, 'prepared');
  assert.match(invocation.requestFingerprint, /^fnv1a-[0-9a-f]{8}$/);
  assert.ok(invocation.id.startsWith(instance.payload().run.id + ':summary:1:'));
  assert.equal(instance.requiresPaidRetry, true);
  await instance.onInvocation({
    state: 'completed',
    stepId: ' summary ',
    attempt: '1',
    rawResponse: '{"ok":1}',
  });
  [invocation] = instance.payload().run.invocations;
  assert.equal(invocation.state, 'completed');
  assert.equal(invocation.rawResponse, '{"ok":1}');
  assert.ok(invocation.completedAt > 0);
  await instance.onInvocation({ state: 'completed', stepId: 'other', attempt: 1 });
  assert.equal(instance.payload().run.invocations.length, 1);
  await instance.authorizePaidRetry();
  assert.ok(instance.payload().run.invocations[0].retryAuthorizedAt > 0);
  assert.equal(instance.requiresPaidRetry, false);
  await instance.onInvocation({ state: 'prepared', stepId: 'summary', attempt: 2 });
  await instance.onInvocation({ state: 'not-submitted', stepId: 'summary', attempt: 2, error: 'offline' });
  assert.equal(instance.requiresPaidRetry, false);
  assert.equal(instance.payload().run.invocations[1].error, 'offline');
});

test('the journal keeps the last eight invocations', async () => {
  const { instance } = recorder();
  for (let attempt = 1; attempt <= 10; attempt += 1)
    await instance.onInvocation({ state: 'prepared', stepId: 's', attempt });
  assert.deepEqual(
    instance.payload().run.invocations.map((invocation) => invocation.attempt),
    [3, 4, 5, 6, 7, 8, 9, 10],
  );
});

test('status transitions keep a ready candidate until it is committed', async () => {
  const { instance } = recorder();
  await instance.onInvocation({ state: 'prepared', stepId: 's', attempt: 1 });
  const artifact = { title: 'T' };
  await instance.ready(artifact);
  artifact.title = 'changed';
  assert.deepEqual(instance.candidateArtifact, { title: 'T' });
  assert.equal(instance.requiresPaidRetry, false);
  await instance.start();
  assert.equal(instance.payload().run.status, 'ready_to_commit');
  await instance.failed(new Error('bad'));
  assert.equal(instance.payload().run.status, 'failed_retryable');
  assert.equal(instance.payload().run.error, 'bad');
  assert.equal(instance.candidateArtifact, null);
  await instance.start();
  assert.deepEqual([instance.payload().run.status, instance.payload().run.error], ['running', '']);
  await instance.succeeded();
  assert.deepEqual(
    [instance.payload().run.status, instance.payload().run.candidateArtifact],
    ['succeeded', null],
  );
});

test('resuming reuses a compatible run and its saved execution', async () => {
  const { instance } = recorder();
  await instance.failed('x');
  const payload = instance.payload();
  const resumed = createStorySummaryRunRecorder({
    project: { id: 'proj' },
    request: { ...REQUEST, model: 'other-model', planning: { a: 2, b: 1 } },
    resumePayload: payload,
  });
  assert.equal(resumed.payload().run.id, payload.run.id);
  assert.equal(resumed.execution.modelId, 'm1');
  const changedIdea = createStorySummaryRunRecorder({
    project: { id: 'proj' },
    request: { ...REQUEST, idea: '新点子' },
    resumePayload: payload,
  });
  assert.notEqual(changedIdea.payload().run.id, payload.run.id);
  await instance.succeeded();
  const finished = createStorySummaryRunRecorder({
    project: { id: 'proj' },
    request: REQUEST,
    resumePayload: instance.payload(),
  });
  assert.notEqual(finished.payload().run.id, payload.run.id);
});
