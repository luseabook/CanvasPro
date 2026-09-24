import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiagnosticOperation } from './diagnosticOperationRecorder.js';

function collect() {
  const events = [];
  return { events, logEvent: (event) => events.push(event) };
}

test('records started and succeeded around a resolved task', async () => {
  const { events, logEvent } = collect();
  const operation = createDiagnosticOperation({ type: 'project.save', context: { projectId: 'p1' }, logEvent });
  const result = await operation.run(async () => ({ success: true, path: 'a.icproj' }));
  assert.deepEqual(result, { success: true, path: 'a.icproj' });
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'project.save.started');
  assert.equal(events[1].type, 'project.save.succeeded');
  assert.equal(events[1].level, 'info');
  assert.equal(events[1].source, 'renderer');
  assert.equal(events[1].message, 'project.save succeeded');
  assert.equal(events[1].context.projectId, 'p1');
  assert.equal(events[1].context.operationId, operation.metadata.operationId);
  assert.equal(typeof events[1].context.elapsedMs, 'number');
  assert.equal(events[1].context.failure, undefined);
});

test('records canceled when the task reports cancellation', async () => {
  const { events, logEvent } = collect();
  const operation = createDiagnosticOperation({ type: 'project.open', logEvent });
  await operation.run(async () => ({ canceled: true }));
  assert.equal(events[1].type, 'project.open.canceled');
  assert.equal(events[1].level, 'info');
});

test('records a failure when the task resolves with an unsuccessful result', async () => {
  const { events, logEvent } = collect();
  const operation = createDiagnosticOperation({ type: 'project.save', logEvent });
  await operation.run(async () => ({ success: false, error: 'disk full' }));
  assert.equal(events[1].type, 'project.save.failed');
  assert.equal(events[1].level, 'error');
  assert.equal(events[1].context.failure.message, 'disk full');
  assert.equal(events[1].context.failure.name, 'Error');
  assert.equal(events[1].context.failure.code, '');
});

test('records a failure and rethrows when the task throws', async () => {
  const { events, logEvent } = collect();
  const operation = createDiagnosticOperation({ type: 'asset.import', source: 'main', logEvent });
  const error = new Error('boom');
  error.code = 'IMPORT_FAILED';
  await assert.rejects(
    () => operation.run(async () => {
      throw error;
    }),
    (thrown) => thrown === error,
  );
  assert.equal(events[1].type, 'asset.import.failed');
  assert.equal(events[1].source, 'main');
  assert.equal(events[1].error, error);
  assert.equal(events[1].context.failure.name, 'Error');
  assert.equal(events[1].context.failure.message, 'boom');
  assert.equal(events[1].context.failure.code, 'IMPORT_FAILED');
});

test('a throwing logEvent never breaks the task and operation ids are unique', async () => {
  const first = createDiagnosticOperation({ type: 'a', logEvent: () => { throw new Error('logger down'); } });
  const second = createDiagnosticOperation({ type: 'a', logEvent: () => { throw new Error('logger down'); } });
  assert.equal(await first.run(async () => 'ok'), 'ok');
  assert.notEqual(first.metadata.operationId, second.metadata.operationId);
});
