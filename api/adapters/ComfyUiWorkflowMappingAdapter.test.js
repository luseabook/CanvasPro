import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildComfyUiPromptFromManifest,
  getComfyUiPayloadPathValue,
} from './ComfyUiWorkflowMappingAdapter.js';

test('ComfyUiWorkflowMappingAdapter: resolves nested payload paths defensively', () => {
  const payload = { generationParams: { seed: 42 }, nested: [{ value: 'ok' }] };

  assert.equal(getComfyUiPayloadPathValue(payload, 'generationParams.seed'), 42);
  assert.equal(getComfyUiPayloadPathValue(payload, 'nested.0.value'), 'ok');
  assert.equal(getComfyUiPayloadPathValue(payload, ''), undefined);
  assert.equal(getComfyUiPayloadPathValue(payload, 'missing.value'), undefined);
});

test('ComfyUiWorkflowMappingAdapter: builds a workflow from prompt, params, maps, and transforms', async () => {
  const workflow = {
    1: { class_type: 'CLIPTextEncode', inputs: { text: 'old', count: 0, optional: 'keep' } },
    2: { class_type: 'KSampler', inputs: {} },
  };
  const mapping = {
    workflow,
    inputs: [
      { nodeId: '1', inputName: 'text', source: 'prompt', field: 'prompt', transform: 'trim' },
      {
        nodeId: '1',
        inputName: 'count',
        source: 'param',
        field: 'seed',
        transform: { name: 'integer', min: 1, max: 5 },
      },
      { nodeId: '1', inputName: 'mode', source: 'param', field: 'mode', valueMap: { fast: 1 } },
      {
        nodeId: '1',
        inputName: 'optional',
        source: 'param',
        field: 'missing',
        required: false,
      },
      {
        nodeId: '2',
        inputName: 'enabled',
        source: 'constant',
        value: true,
        transform: 'booleanString',
      },
      {
        nodeId: '2',
        inputName: 'custom',
        source: 'customValue',
        field: 'ignored',
        when: { field: 'enabled', equals: 'yes' },
      },
    ],
  };

  const result = await buildComfyUiPromptFromManifest({
    mapping,
    payload: { prompt: '  draw this  ', seed: '3.9', mode: 'fast', enabled: 'yes' },
    finalPrompt: 'fallback prompt',
    sourceResolvers: {
      customValue: ({ payload }) => `resolved:${payload.enabled}`,
    },
  });

  assert.deepEqual(workflow['1'].inputs, { text: 'old', count: 0, optional: 'keep' });
  assert.equal(result['1'].inputs.text, 'draw this');
  assert.equal(result['1'].inputs.count, 3);
  assert.equal(result['1'].inputs.mode, 1);
  assert.equal(result['1'].inputs.optional, 'keep');
  assert.equal(result['2'].inputs.enabled, 'true');
  assert.equal(result['2'].inputs.custom, 'resolved:yes');
});

test('ComfyUiWorkflowMappingAdapter: honors allowEmpty and conditional mappings', async () => {
  const mapping = {
    prompt: { 1: { inputs: { text: 'old', empty: 'keep' } } },
    nodeInputs: [
      {
        nodeId: '1',
        fieldName: 'text',
        source: 'prompt',
        fields: ['prompt'],
        allowEmpty: true,
      },
      {
        nodeId: '1',
        fieldName: 'empty',
        source: 'constant',
        value: '',
        allowEmpty: true,
        when: { field: 'enabled', truthy: true },
      },
      {
        nodeId: '1',
        fieldName: 'skipped',
        source: 'constant',
        value: 'x',
        when: { field: 'enabled', falsy: true },
      },
    ],
  };

  const result = await buildComfyUiPromptFromManifest({
    mapping,
    payload: { prompt: '', enabled: true },
  });

  assert.equal(result['1'].inputs.text, '');
  assert.equal(result['1'].inputs.empty, '');
  assert.equal(result['1'].inputs.skipped, undefined);
});

test('ComfyUiWorkflowMappingAdapter: rejects invalid graphs and unsupported inputs', async () => {
  await assert.rejects(buildComfyUiPromptFromManifest({ mapping: { inputs: [] } }), /missing workflow graph/);
  await assert.rejects(
    buildComfyUiPromptFromManifest({
      mapping: {
        workflow: { 1: { inputs: {} } },
        inputs: [{ nodeId: '1', inputName: 'value', source: 'unknown' }],
      },
    }),
    /Unsupported ComfyUI workflow mapping source/,
  );
  await assert.rejects(
    buildComfyUiPromptFromManifest({
      mapping: {
        workflow: { 1: { inputs: {} } },
        inputs: [{ nodeId: '1', inputName: 'value', source: 'param', field: 'missing', required: true }],
      },
    }),
    /Missing ComfyUI workflow input/,
  );
  await assert.rejects(
    buildComfyUiPromptFromManifest({
      mapping: {
        workflow: { 1: { inputs: {} } },
        inputs: [
          {
            nodeId: '2',
            inputName: 'value',
            source: 'constant',
            value: 1,
            required: true,
          },
        ],
      },
    }),
    /Missing ComfyUI workflow node/,
  );
});
