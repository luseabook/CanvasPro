import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRunningHubNodeInfoListFromManifest,
  getRunningHubMappedValue,
  pushRunningHubManifestNode,
} from './RunningHubWorkflowMappingAdapter.js';

test('RunningHubWorkflowMappingAdapter: pushes typed and described node values', () => {
  const output = [];
  pushRunningHubManifestNode(
    output,
    { nodeId: 7, fieldName: 'enabled', transform: 'boolean', preserveValueType: true },
    'true',
  );
  pushRunningHubManifestNode(output, { nodeId: 8, fieldName: 'count' }, 2, {
    fieldName: 'steps',
    description: 'sampling steps',
  });

  assert.deepEqual(output, [
    { nodeId: '7', fieldName: 'enabled', fieldValue: true },
    { nodeId: '8', fieldName: 'steps', fieldValue: '2', description: 'sampling steps' },
  ]);
});

test('RunningHubWorkflowMappingAdapter: maps values with case-insensitive fallbacks', () => {
  assert.equal(getRunningHubMappedValue(' FAST ', { valueMap: { fast: 1 } }), 1);
  assert.equal(getRunningHubMappedValue('missing', { defaultValue: 9 }), 9);
  assert.equal(getRunningHubMappedValue('missing', {}), '');
});

test('RunningHubWorkflowMappingAdapter: resolves params, conditions, custom sources, and transforms', async () => {
  const result = await buildRunningHubNodeInfoListFromManifest({
    mapping: {
      nodeInfoList: [
        { nodeId: 1, fieldName: 'prompt', source: 'prompt' },
        {
          nodeId: 1,
          fieldName: 'count',
          source: 'param',
          fields: ['seed'],
          transform: { name: 'integer', min: 1, max: 5 },
        },
        {
          nodeId: 2,
          fieldName: 'enabled',
          source: 'constant',
          value: true,
          transform: 'boolean',
        },
        { nodeId: 3, fieldName: 'custom', source: 'customValue' },
        {
          nodeId: 4,
          fieldName: 'optional',
          source: 'param',
          field: 'missing',
          includeEmpty: true,
        },
        {
          nodeId: 5,
          fieldName: 'included',
          source: 'constant',
          value: 'x',
          when: { field: 'enabled', truthy: true },
        },
        {
          nodeId: 6,
          fieldName: 'skipped',
          source: 'constant',
          value: 'x',
          when: { field: 'enabled', falsy: true },
        },
      ],
    },
    payload: { seed: '3.9', enabled: true },
    finalPrompt: 'fallback prompt',
    sourceResolvers: {
      customValue: ({ payload }) => `custom:${payload.enabled}`,
    },
    transforms: {
      upper: (value) => String(value).toUpperCase(),
    },
  });

  assert.deepEqual(result, [
    { nodeId: '1', fieldName: 'prompt', fieldValue: 'fallback prompt' },
    { nodeId: '1', fieldName: 'count', fieldValue: '3' },
    { nodeId: '2', fieldName: 'enabled', fieldValue: 'true' },
    { nodeId: '3', fieldName: 'custom', fieldValue: 'custom:true' },
    { nodeId: '4', fieldName: 'optional', fieldValue: '' },
    { nodeId: '5', fieldName: 'included', fieldValue: 'x' },
  ]);
});

test('RunningHubWorkflowMappingAdapter: rejects required missing values and unknown sources', async () => {
  await assert.rejects(
    buildRunningHubNodeInfoListFromManifest({
      mapping: {
        nodeInfoList: [{ nodeId: 1, fieldName: 'seed', source: 'param', field: 'missing', required: true }],
      },
      payload: {},
    }),
    /Missing RunningHub workflow node input/,
  );
  await assert.rejects(
    buildRunningHubNodeInfoListFromManifest({
      mapping: { nodeInfoList: [{ nodeId: 1, fieldName: 'x', source: 'unknown' }] },
    }),
    /Unsupported RunningHub workflow mapping source/,
  );
});
