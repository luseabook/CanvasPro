import test from 'node:test';
import assert from 'node:assert/strict';

import {
  Storyboard3DAIVoiceController,
  Storyboard3DToolExecutionError,
  createStoryboard3DAIVoiceController,
  createStoryboard3DSafeToolExecutor,
} from './aiVoiceController.js';
import { createStoryboard3DProject } from './projectModel.js';

function createSequenceIdFactory() {
  const counts = new Map();
  return (kind) => {
    const count = (counts.get(kind) || 0) + 1;
    counts.set(kind, count);
    return `${kind}-${count}`;
  };
}

function createFixture() {
  const idFactory = createSequenceIdFactory();
  const project = createStoryboard3DProject({
    id: 'project-a',
    name: 'Project A',
    now: 10,
    idFactory,
  });
  const replacements = [];
  const store = {
    getSnapshot: () => project,
    replaceProject: (next, reason) => replacements.push({ next, reason }),
  };
  return { idFactory, project, replacements, store };
}

test('aiVoiceController: safe executor applies validated tools and preserves non-mutating reads', async () => {
  const { idFactory, project, replacements, store } = createFixture();
  const marked = [];
  const assetLibrary = {
    find: () => null,
    markUsed: (assetId) => marked.push(assetId),
  };
  const executor = createStoryboard3DSafeToolExecutor({
    projectStore: store,
    assetLibrary,
    idFactory,
    now: () => 20,
  });

  const read = await executor([
    { tool: 'getSceneLayout', sceneId: project.scenes[0].id },
  ]);
  assert.equal(read.changed, false);
  assert.equal(read.commands[0].result.sceneId, project.scenes[0].id);
  assert.equal(replacements.length, 0);

  const created = await executor(
    [{ tool: 'createScene', args: { name: 'Second scene' } }],
    { transactionId: 'tx-16' },
  );
  assert.equal(created.changed, true);
  assert.equal(created.transactionId, 'tx-16');
  assert.equal(replacements.length, 1);
  assert.equal(replacements[0].reason, 'ai-transaction:tx-16');
  assert.equal(replacements[0].next.scenes.length, 2);
  assert.equal(replacements[0].next.updatedAt, 20);
  assert.deepEqual(marked, []);

  await assert.rejects(
    executor([
      {
        tool: 'deleteObject',
        sceneId: project.scenes[0].id,
        args: { objectId: 'missing-object' },
      },
    ]),
    (error) => {
      assert.ok(error instanceof Storyboard3DToolExecutionError);
      assert.equal(error.tool, 'deleteObject');
      assert.equal(error.commandId, 'transaction-2:1');
      return true;
    },
  );
});

test('aiVoiceController: plans, executes, and mirrors voice service state', async () => {
  const { idFactory, project, store } = createFixture();
  let handlers;
  let destroyed = 0;
  const service = {
    start: (options) => ({ started: options }),
    stop: () => ({ stopped: true }),
    abort: () => ({ aborted: true }),
    isSupported: () => true,
    destroy: () => {
      destroyed += 1;
    },
  };
  const states = [];
  const transcripts = [];
  const plans = [];
  const executions = [];
  const controller = createStoryboard3DAIVoiceController({
    projectStore: store,
    model: 'model-a',
    provider: 'provider-a',
    idFactory,
    voiceServiceFactory: (options) => {
      handlers = options;
      return service;
    },
    onStateChange: (snapshot, meta) => states.push([snapshot.status, meta.reason]),
    onTranscript: (event) => transcripts.push(event),
    onPlan: (plan) => plans.push(plan),
    onExecution: (execution) => executions.push(execution),
    request: async () => ({
      text: JSON.stringify({
        transactionId: 'voice-plan',
        commands: [
          { tool: 'getSceneLayout', sceneId: project.scenes[0].id },
        ],
      }),
    }),
  });

  assert.ok(controller instanceof Storyboard3DAIVoiceController);
  assert.equal(controller.getSnapshot().status, 'idle');
  assert.equal(controller.getSnapshot().voiceSupported, true);
  assert.deepEqual(controller.startVoice({ language: 'zh-CN' }), {
    started: { language: 'zh-CN' },
  });
  handlers.onStateChange({ state: 'listening' });
  handlers.onTranscript({ transcript: 'inspect layout', interimText: 'inspect' });
  assert.equal(controller.getSnapshot().status, 'listening');
  assert.equal(controller.getSnapshot().instruction, 'inspect layout');
  assert.equal(controller.getSnapshot().interimTranscript, 'inspect');
  assert.equal(transcripts.length, 1);

  const planned = await controller.plan();
  assert.equal(planned.transactionId, 'voice-plan');
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(plans.length, 1);

  const completed = await controller.executePlan({
    ...planned,
    executeTransaction: async () => ({ ok: true }),
  });
  assert.equal(completed.execution.ok, true);
  assert.equal(controller.getSnapshot().status, 'completed');
  assert.equal(executions.length, 1);
  assert.equal(states.some(([status]) => status === 'planning'), true);
  assert.equal(states.some(([status]) => status === 'executing'), true);

  controller.cancel();
  assert.equal(controller.getSnapshot().status, 'idle');
  controller.destroy();
  assert.equal(destroyed, 1);
  assert.equal(controller.getSnapshot().status, 'idle');
});

test('aiVoiceController: rejects missing stores and execution without a plan', async () => {
  assert.throws(
    () => new Storyboard3DAIVoiceController({ voiceServiceFactory: () => ({}) }),
    /project store/u,
  );

  const { idFactory, store } = createFixture();
  const controller = new Storyboard3DAIVoiceController({
    projectStore: store,
    idFactory,
    voiceServiceFactory: () => ({
      isSupported: () => false,
      abort() {},
    }),
  });
  await assert.rejects(controller.executePlan(), /No 3D command plan/u);
  assert.equal(controller.getSnapshot().status, 'error');
});
