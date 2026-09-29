import test from 'node:test';
import assert from 'node:assert/strict';

import {
  diagnosticReference,
  getDiagnosticOperationsSnapshot,
  runDiagnosticOperation,
} from './operationDiagnostics.js';

test('operationDiagnostics: builds stable compact references', () => {
  const first = diagnosticReference('canvas:node:42');

  assert.equal(first, diagnosticReference('canvas:node:42'));
  assert.notEqual(first, diagnosticReference('canvas:node:43'));
  assert.match(first, /^[0-9a-z]+$/);
});

test('operationDiagnostics: exposes active operations while a task is running', async () => {
  let duringRun = null;
  const result = await runDiagnosticOperation('unit-test', { nodeId: 'n-1' }, async () => 42);

  assert.equal(result, 42);

  const observed = await runDiagnosticOperation('unit-test', { nodeId: 'n-2' }, async () => {
    duringRun = getDiagnosticOperationsSnapshot();
    return 'ok';
  });

  assert.equal(observed, 'ok');
  assert.equal(duringRun.activeCount, 1);
  assert.equal(duringRun.sampledCount, 1);
  assert.equal(duringRun.active[0].type, 'unit-test');
  assert.equal(duringRun.active[0].nodeId, 'n-2');
  assert.deepEqual(getDiagnosticOperationsSnapshot().active, []);
});

test('operationDiagnostics: removes active operations after failures', async () => {
  await assert.rejects(
    runDiagnosticOperation('unit-test', { nodeId: 'broken' }, async () => {
      throw new Error('boom');
    }),
    /boom/,
  );

  assert.equal(getDiagnosticOperationsSnapshot().activeCount, 0);
});
