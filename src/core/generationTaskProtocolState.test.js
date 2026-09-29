import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAsyncTaskPatch,
  buildDreaminaTaskPatch,
  buildGenerationProtocolPendingPatch,
  buildGenerationProtocolResetPatch,
  buildGenerationProtocolStartPatch,
  buildGenerationProtocolTaskIdPatch,
  buildGenerationProtocolTerminalPatch,
  buildGenerationProtocolTransitionPatch,
  buildIdleGenerationProtocolPatch,
  buildImageGenerationAsyncTaskPatch,
  buildImageGenerationDreaminaTaskPatch,
  buildRunningHubOpenapiTaskPatch,
  buildRunningHubTaskPatch,
} from './generationTaskProtocolState.js';

test('generationTaskProtocolState: protocol-specific patches normalize inputs', () => {
  assert.deepEqual(
    buildRunningHubTaskPatch({
      taskId: ' task-1 ',
      status: '',
      startedAt: '12',
      recovering: 1,
      useOpenapiQuery: true,
    }),
    {
      rhTaskId: 'task-1',
      rhTaskStatus: 'pending',
      rhTaskStartedAt: 12,
      rhTaskRecovering: false,
      rhTaskUseOpenapiQuery: true,
    },
  );
  assert.deepEqual(
    buildAsyncTaskPatch({
      provider: ' openai ',
      kind: '',
      taskId: ' async-1 ',
      status: '',
      startedAt: '5',
      recovering: true,
    }),
    {
      asyncTaskProvider: 'openai',
      asyncTaskKind: 'generation',
      asyncTaskId: 'async-1',
      asyncTaskStatus: 'pending',
      asyncTaskStartedAt: 5,
      asyncTaskRecovering: true,
    },
  );
  const dreamina = buildDreaminaTaskPatch({
    submitId: ' submit-1 ',
    status: '',
    phase: '',
    label: '',
    startedAt: '3',
    lastCheckedAt: '4',
    recovering: true,
    raw: ['invalid'],
  });
  assert.deepEqual(dreamina, {
    dreaminaSubmitId: 'submit-1',
    dreaminaTaskStatus: 'pending',
    dreaminaTaskPhase: 'generating',
    dreaminaTaskLabel: '',
    dreaminaTaskStartedAt: 3,
    dreaminaTaskLastCheckedAt: 4,
    dreaminaTaskRecovering: true,
    dreaminaTaskLastRaw: {},
  });
});

test('generationTaskProtocolState: image and OpenAPI helpers apply their defaults', () => {
  assert.equal(
    buildImageGenerationAsyncTaskPatch({ provider: 'openai', taskId: 'a' }).asyncTaskKind,
    'image',
  );
  assert.equal(
    buildImageGenerationDreaminaTaskPatch({ submitId: 'd' }).dreaminaTaskLabel,
    '生成中',
  );
  assert.equal(buildRunningHubOpenapiTaskPatch({ taskId: 'rh' }).rhTaskUseOpenapiQuery, true);
  assert.equal(buildRunningHubTaskPatch({ taskId: 'rh' }).rhTaskUseOpenapiQuery, false);
});

test('generationTaskProtocolState: idle and reset patches clear all protocol fields', () => {
  const idle = buildIdleGenerationProtocolPatch({ kind: 'image' });
  assert.deepEqual(idle, {
    generationQueueStatus: 'idle',
    generationQueueIndex: -1,
    generationQueueLength: 0,
    rhTaskId: '',
    rhTaskStatus: 'idle',
    rhTaskStartedAt: 0,
    rhTaskRecovering: false,
    rhTaskUseOpenapiQuery: false,
    dreaminaSubmitId: '',
    dreaminaTaskStatus: 'idle',
    dreaminaTaskPhase: 'idle',
    dreaminaTaskLabel: '',
    dreaminaTaskStartedAt: 0,
    dreaminaTaskLastCheckedAt: 0,
    dreaminaTaskRecovering: false,
    dreaminaTaskLastRaw: {},
    asyncTaskProvider: '',
    asyncTaskKind: 'image',
    asyncTaskId: '',
    asyncTaskStatus: 'idle',
    asyncTaskStartedAt: 0,
    asyncTaskRecovering: false,
  });
  assert.deepEqual(buildGenerationProtocolResetPatch({ kind: 'image' }), idle);
});

test('generationTaskProtocolState: start patches infer workflow and async protocols', () => {
  const workflow = buildGenerationProtocolStartPatch(
    {
      protocol: 'workflow',
      trigger: 'click',
      taskType: 'video',
      provider: 'runninghub',
      adapterType: 'workflow',
      modelId: 'model-1',
      executionId: 'exec-1',
      cancellable: true,
      sourceNodeId: 'node-1',
    },
    100,
  );
  assert.equal(workflow.taskTrigger, 'click');
  assert.equal(workflow.taskModelId, 'model-1');
  assert.equal(workflow.generationQueueStatus, 'submitting');
  assert.equal(workflow.rhTaskStatus, 'pending');
  assert.equal(workflow.rhTaskStartedAt, 100);
  assert.equal(workflow.rhSourceNodeId, 'node-1');
  assert.equal(workflow.rhToolbarTaskType, 'video');

  const asyncStart = buildGenerationProtocolStartPatch(
    {
      protocol: 'asyncModelApi',
      provider: 'openai',
      kind: 'video',
      trigger: 'auto',
    },
    200,
  );
  assert.equal(asyncStart.taskProvider, 'openai');
  assert.equal(asyncStart.asyncTaskStatus, 'pending');
  assert.equal(asyncStart.asyncTaskStartedAt, 200);
  assert.equal(asyncStart.rhTaskId, undefined);

  const unknown = buildGenerationProtocolStartPatch({ trigger: 'manual' }, 300);
  assert.equal(unknown.generationQueueStatus, 'submitting');
  assert.equal(unknown.rhTaskId, undefined);
  assert.equal(unknown.asyncTaskId, undefined);
});

test('generationTaskProtocolState: task-id, terminal, pending, and transitions stay protocol-aware', () => {
  const workflowSpec = { protocol: 'workflow', adapterType: 'workflow', provider: 'runninghub' };
  const asyncSpec = { protocol: 'asyncModelApi', adapterType: 'modelApi', provider: 'openai' };

  assert.deepEqual(buildGenerationProtocolTaskIdPatch(workflowSpec, ' task-1 ', 10), {
    rhTaskId: 'task-1',
    rhTaskStatus: 'running',
    rhTaskStartedAt: 10,
    rhTaskRecovering: false,
    rhTaskUseOpenapiQuery: false,
  });
  assert.deepEqual(buildGenerationProtocolTaskIdPatch(workflowSpec, '   ', 10), {});
  assert.deepEqual(buildGenerationProtocolTaskIdPatch(asyncSpec, ' task-2 ', 20), {
    asyncTaskId: 'task-2',
    asyncTaskStatus: 'running',
    asyncTaskStartedAt: 20,
    asyncTaskRecovering: false,
  });

  assert.deepEqual(buildGenerationProtocolTerminalPatch(asyncSpec, ' done '), {
    generationQueueStatus: 'idle',
    generationQueueIndex: -1,
    generationQueueLength: 0,
    asyncTaskStatus: 'done',
    asyncTaskRecovering: false,
  });

  const pending = buildGenerationProtocolPendingPatch(
    workflowSpec,
    { taskId: ' task-3 ', startedAt: 30 },
    ' 处理中 ',
  );
  assert.equal(pending.isGenerating, true);
  assert.equal(pending.jobStatus, 'running');
  assert.equal(pending.statusMessage, '处理中');
  assert.equal(pending.rhTaskId, 'task-3');
  assert.equal(pending.rhTaskStartedAt, 30);
  assert.equal(pending.rhStatusMessage, '处理中');

  assert.deepEqual(
    buildGenerationProtocolTransitionPatch({ type: 'terminal', spec: asyncSpec, status: 'error' }),
    {
      generationQueueStatus: 'idle',
      generationQueueIndex: -1,
      generationQueueLength: 0,
      asyncTaskStatus: 'error',
      asyncTaskRecovering: false,
    },
  );
  assert.deepEqual(buildGenerationProtocolTransitionPatch({ type: 'unknown' }), {});
});
