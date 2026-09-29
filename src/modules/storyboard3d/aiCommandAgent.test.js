import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYBOARD_3D_AI_COMMAND_TOOLS,
  buildStoryboard3DAICommandPrompt,
  executeStoryboard3DAICommandPlan,
  generateStoryboard3DAICommandPlan,
  validateStoryboard3DAICommandPlan,
} from './aiCommandAgent.js';
import { createStoryboard3DProject } from './projectModel.js';

function createProject() {
  return createStoryboard3DProject({
    id: 'project-a',
    name: 'Project A',
    idFactory: () => 'id',
    now: 10,
  });
}

test('aiCommandAgent: validates and normalizes command plans', () => {
  const plan = validateStoryboard3DAICommandPlan(
    {
      transactionId: 't-1',
      summary: 'Build a scene',
      commands: [
        { tool: 'createScene', args: { name: 'New scene' } },
        {
          tool: 'addProp',
          sceneId: 'scene-a',
          args: { assetId: 'tree', position: [1, 2, 3] },
        },
        { tool: 'checkComposition', sceneId: 'scene-a' },
      ],
    },
    { sceneIds: ['scene-a'] },
  );

  assert.ok(STORYBOARD_3D_AI_COMMAND_TOOLS.includes('createScene'));
  assert.equal(plan.transactionId, 't-1');
  assert.equal(plan.readOnly, false);
  assert.deepEqual(
    plan.commands.map((command) => command.commandId),
    ['t-1:1', 't-1:2', 't-1:3'],
  );
  assert.equal(plan.commands[0].source, 'ai');
  assert.deepEqual(plan.commands[1].args.position, [1, 2, 3]);
  assert.equal(plan.commands[1].args.assetId, 'tree');

  assert.throws(
    () =>
      validateStoryboard3DAICommandPlan({
        transactionId: 't',
        commands: [{ tool: 'unknown', sceneId: 'scene-a' }],
      }),
    /not allowed/u,
  );
  assert.throws(
    () =>
      validateStoryboard3DAICommandPlan(
        {
          transactionId: 't',
          commands: [{ tool: 'addProp', sceneId: 'missing', args: { assetId: 'tree' } }],
        },
        { sceneIds: ['scene-a'] },
      ),
    /does not exist/u,
  );
  assert.throws(
    () =>
      validateStoryboard3DAICommandPlan({
        transactionId: 't',
        commands: [{ tool: 'addProp', sceneId: 'scene-a', args: {} }],
      }),
    /assetId/u,
  );
});

test('aiCommandAgent: builds bounded model prompts with project context', () => {
  const project = createProject();
  const assets = [
    {
      id: 'tree',
      name: 'Tree',
      category: 'prop',
      tags: ['plant'],
      source: { kind: 'builtin', familyId: 'trees' },
    },
    {
      id: 'custom',
      name: 'Custom',
      source: { kind: 'custom' },
    },
  ];
  const prompt = JSON.parse(
    buildStoryboard3DAICommandPrompt({
      instruction: 'Add a tree',
      project,
      assets,
    }),
  );

  assert.equal(prompt.task, 'plan_storyboard_3d_commands');
  assert.equal(prompt.instruction, 'Add a tree');
  assert.equal(prompt.context.projectId, 'project-a');
  assert.equal(prompt.context.scenes[0].sceneId, project.scenes[0].id);
  assert.deepEqual(prompt.availableAssets.rows[0].slice(0, 3), ['tree', 'Tree', 'prop']);
  assert.ok(prompt.allowedTools.includes('createScene'));
  assert.throws(
    () => buildStoryboard3DAICommandPrompt({ instruction: ' ', project }),
    Error,
  );
});

test('aiCommandAgent: requests, repairs, and executes command plans', async () => {
  const project = createProject();
  const validPlan = JSON.stringify({
    transactionId: 't-1',
    summary: 'Read layout',
    commands: [{ tool: 'getSceneLayout', sceneId: project.scenes[0].id }],
  });
  const requests = [];
  const progress = [];
  const plan = await generateStoryboard3DAICommandPlan({
    instruction: 'Inspect scene',
    project,
    model: 'model-1',
    provider: 'provider-1',
    request: async (request) => {
      requests.push(request);
      return { text: validPlan };
    },
    onProgress: (event) => progress.push(event.stage),
  });

  assert.equal(plan.readOnly, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].temperature, 0.15);
  assert.deepEqual(progress, ['planning']);

  const repairRequests = [];
  const repaired = await generateStoryboard3DAICommandPlan({
    instruction: 'Inspect scene',
    project,
    model: 'model-1',
    provider: 'provider-1',
    request: async (request) => {
      repairRequests.push(request);
      return repairRequests.length === 1
        ? { text: JSON.stringify({ transactionId: 't-2', commands: [{ tool: 'bad' }] }) }
        : { text: validPlan };
    },
  });
  assert.equal(repaired.transactionId, 't-1');
  assert.equal(repairRequests.length, 2);

  const executed = await executeStoryboard3DAICommandPlan(plan, {
    executeTransaction: async (commands, metadata) => ({ commands, metadata }),
  });
  assert.equal(executed.execution.metadata.source, 'ai');
  assert.equal(executed.execution.commands[0].tool, 'getSceneLayout');
  await assert.rejects(
    executeStoryboard3DAICommandPlan(plan, {}),
    /executeTransaction/u,
  );
});
