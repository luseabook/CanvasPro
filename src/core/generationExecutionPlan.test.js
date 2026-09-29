import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGenerationExecutionId,
  createGenerationCancelPlan,
  createGenerationCancelPlanFromNode,
  createGenerationExecutionPlan,
  createGenerationResumePlan,
  createGenerationSubmitPlanFromNode,
  normalizeGenerationAdapterType,
  resolveGenerationTaskIdentity,
} from './generationExecutionPlan.js';

test('generationExecutionPlan: adapter aliases normalize to protocol names', () => {
  assert.equal(normalizeGenerationAdapterType('workflow'), 'workflow');
  assert.equal(normalizeGenerationAdapterType('model-api'), 'modelApi');
  assert.equal(normalizeGenerationAdapterType('local_runtime'), 'localRuntime');
  assert.equal(normalizeGenerationAdapterType('unknown'), 'modelApi');
  assert.equal(normalizeGenerationAdapterType('unknown', 'workflow'), 'workflow');
});

test('generationExecutionPlan: execution ids compact whitespace and use fallbacks', () => {
  assert.equal(
    buildGenerationExecutionId({
      kind: 'image generation',
      provider: 'Running Hub',
      adapterType: 'model-api',
      modelId: 'x/y',
    }),
    'image-generation.Running-Hub.x/y',
  );
  assert.equal(buildGenerationExecutionId(), 'generation.modelApi.default');
});

test('generationExecutionPlan: task identity resolves node provider and model fields', () => {
  assert.deepEqual(
    resolveGenerationTaskIdentity({
      kind: 'video',
      node: { taskAdapterType: 'model-api', taskProvider: 'runninghub', taskModelId: 'abc' },
    }),
    {
      protocol: '',
      provider: 'runninghub',
      adapterType: 'modelApi',
      modelId: 'abc',
      executionId: 'video.runninghub.abc',
      taskId: '',
      startedAt: 0,
      async: false,
    },
  );
});

test('generationExecutionPlan: workflow and async capabilities produce lifecycle plans', () => {
  const workflow = createGenerationExecutionPlan({
    kind: 'video',
    provider: 'runninghub',
    adapterType: 'workflow',
    modelId: 'm',
  });
  assert.equal(workflow.protocol, 'workflow');
  assert.equal(workflow.cancellable, true);
  assert.equal(workflow.resumable, true);
  assert.equal(workflow.async, false);

  const asyncPlan = createGenerationExecutionPlan({
    kind: 'video',
    provider: 'runninghub',
    adapterType: 'modelApi',
    modelId: 'm',
    async: true,
  });
  assert.equal(asyncPlan.protocol, 'asyncModelApi');
  assert.deepEqual(asyncPlan.capabilities, { async: true, cancellable: false, resumable: true });
});

test('generationExecutionPlan: resume, cancel, and node plans expose the right lifecycle', () => {
  assert.equal(createGenerationResumePlan({ kind: 'video', provider: 'x', modelId: 'm' }).resumable, true);
  assert.equal(createGenerationCancelPlan({ kind: 'video', provider: 'x', modelId: 'm' }).cancellable, true);
  const submit = createGenerationSubmitPlanFromNode({
    node: { taskProvider: 'runninghub', taskAdapterType: 'workflow', taskModelId: 'm' },
  });
  assert.equal(submit.lifecycle, 'submit');
  assert.equal(submit.adapterType, 'workflow');
  assert.equal(
    createGenerationCancelPlanFromNode({
      node: { taskProvider: 'runninghub', taskAdapterType: 'workflow', taskModelId: 'm' },
    }).lifecycle,
    'cancel',
  );
});
