import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GENERATION_TASK_PROTOCOLS,
  buildGenerationTaskProtocolPatch,
  getGenerationTaskProtocolAdapter,
  inferGenerationTaskProtocol,
  listGenerationTaskProtocolAdapters,
  normalizeGenerationTaskProtocol,
  resolveGenerationTaskProtocolAdapter,
} from './generationTaskProtocolAdapters.js';

test('generationTaskProtocolAdapters: normalizes aliases and lists three adapters', () => {
  assert.equal(normalizeGenerationTaskProtocol('runninghub'), GENERATION_TASK_PROTOCOLS.WORKFLOW);
  assert.equal(normalizeGenerationTaskProtocol('async_model_api'), GENERATION_TASK_PROTOCOLS.ASYNC_MODEL_API);
  assert.equal(normalizeGenerationTaskProtocol('dreamina'), GENERATION_TASK_PROTOCOLS.DREAMINA);
  assert.equal(normalizeGenerationTaskProtocol('unknown'), '');
  assert.equal(listGenerationTaskProtocolAdapters().length, 3);
  assert.equal(getGenerationTaskProtocolAdapter('workflow').taskIdField, 'rhTaskId');
  assert.equal(getGenerationTaskProtocolAdapter('missing'), null);
});

test('generationTaskProtocolAdapters: infers protocols from explicit and node evidence', () => {
  assert.equal(
    inferGenerationTaskProtocol({ taskProtocol: 'runninghub' }),
    GENERATION_TASK_PROTOCOLS.WORKFLOW,
  );
  assert.equal(inferGenerationTaskProtocol({ adapterType: 'workflow' }), GENERATION_TASK_PROTOCOLS.WORKFLOW);
  assert.equal(
    inferGenerationTaskProtocol({ node: { asyncTaskId: 'async-1' } }),
    GENERATION_TASK_PROTOCOLS.ASYNC_MODEL_API,
  );
  assert.equal(
    inferGenerationTaskProtocol({ node: { dreaminaSubmitId: 'dreamina-1' } }),
    GENERATION_TASK_PROTOCOLS.DREAMINA,
  );
  assert.equal(
    inferGenerationTaskProtocol({ adapterType: 'modelApi', async: true }),
    GENERATION_TASK_PROTOCOLS.ASYNC_MODEL_API,
  );
  assert.equal(
    inferGenerationTaskProtocol({ adapterType: 'localRuntime', provider: 'dreamina' }),
    GENERATION_TASK_PROTOCOLS.DREAMINA,
  );
  assert.equal(resolveGenerationTaskProtocolAdapter({ taskProtocol: 'rh' }).id, 'workflow');
});

test('generationTaskProtocolAdapters: builds protocol-specific task patches', () => {
  assert.deepEqual(
    buildGenerationTaskProtocolPatch('workflow', {
      taskId: 'rh-1',
      status: 'running',
      startedAt: 12,
      recovering: true,
      useOpenapiQuery: true,
    }),
    {
      rhTaskId: 'rh-1',
      rhTaskStatus: 'running',
      rhTaskStartedAt: 12,
      rhTaskRecovering: true,
      rhTaskUseOpenapiQuery: true,
    },
  );
  assert.deepEqual(
    buildGenerationTaskProtocolPatch('dreamina', {
      submitId: 'dream-1',
      status: 'done',
      phase: 'ready',
      label: 'ready',
      startedAt: 10,
      lastCheckedAt: 20,
      recovering: false,
      raw: { id: 1 },
    }),
    {
      dreaminaSubmitId: 'dream-1',
      dreaminaTaskStatus: 'done',
      dreaminaTaskPhase: 'ready',
      dreaminaTaskLabel: 'ready',
      dreaminaTaskStartedAt: 10,
      dreaminaTaskLastCheckedAt: 20,
      dreaminaTaskRecovering: false,
      dreaminaTaskLastRaw: { id: 1 },
    },
  );
  assert.deepEqual(
    buildGenerationTaskProtocolPatch('asyncModelApi', {
      provider: 'provider',
      kind: 'video',
      taskId: 'async-1',
      status: 'pending',
      startedAt: 5,
    }),
    {
      asyncTaskProvider: 'provider',
      asyncTaskKind: 'video',
      asyncTaskId: 'async-1',
      asyncTaskStatus: 'pending',
      asyncTaskStartedAt: 5,
      asyncTaskRecovering: false,
    },
  );
  assert.throws(() => buildGenerationTaskProtocolPatch('missing'), {
    message: 'Unknown generation task protocol: missing',
  });
});
