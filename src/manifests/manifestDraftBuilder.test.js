import test from 'node:test';
import assert from 'node:assert/strict';

import { buildManifestDraftBundle, inferManifestDraftAdapterType } from './manifestDraftBuilder.js';

test('manifestDraftBuilder: infers adapter types and rejects invalid input', () => {
  assert.equal(inferManifestDraftAdapterType({ adapterType: 'workflow' }), 'workflow');
  assert.equal(inferManifestDraftAdapterType({ appId: '123' }), 'workflow');
  assert.equal(inferManifestDraftAdapterType({ endpoint: '/v1/video' }), 'modelApi');
  assert.throws(
    () => inferManifestDraftAdapterType({ adapterType: 'unsupported' }),
    /Unsupported manifest draft adapterType/,
  );
  assert.throws(() => inferManifestDraftAdapterType({}), /Unable to infer/);
});

test('manifestDraftBuilder: builds a model API manifest draft with defaults', () => {
  const bundle = buildManifestDraftBundle({
    provider: 'acme',
    kind: 'text',
    adapterType: 'modelApi',
    modelId: 'foo/bar',
    displayName: 'Foo Bar',
    endpoint: '/v1/chat/completions',
    apiModel: 'foo-model',
    uiFields: [{ id: 'temperature', type: 'slider' }],
    capabilities: { supportsStreaming: true },
  });

  assert.equal(bundle.sourceId, 'manifest-draft:foo/bar');
  assert.equal(bundle.models.length, 1);
  assert.equal(bundle.executions.length, 1);

  const [model] = bundle.models;
  assert.equal(model.modelId, 'foo/bar');
  assert.equal(model.provider, 'acme');
  assert.equal(model.kind, 'text');
  assert.equal(model.adapterType, 'modelApi');
  assert.equal(model.executionId, 'acme.modelApi.text.foo-bar.v1');
  assert.equal(model.displayName, 'Foo Bar');
  assert.equal(model.outputType, 'text');
  assert.deepEqual(model.inputSlots, {
    maxByKind: { image: 0, video: 0, audio: 0 },
  });
  assert.deepEqual(model.uiSchema.fields, [{ id: 'temperature', type: 'slider' }]);
  assert.equal(model.async, false);
  assert.equal(model.cancellable, false);
  assert.deepEqual(model.capabilities, { supportsStreaming: true });

  const [execution] = bundle.executions;
  assert.equal(execution.id, model.executionId);
  assert.equal(execution.endpoint, '/v1/chat/completions');
  assert.equal(execution.method, 'POST');
  assert.equal(execution.model, 'foo-model');
  assert.deepEqual(execution.bodyMapping, []);
  assert.deepEqual(execution.responseMapping, {});
  assert.deepEqual(execution.result, { outputType: 'text', paths: [] });
});

test('manifestDraftBuilder: builds a workflow draft and preserves execution extensions', () => {
  const bundle = buildManifestDraftBundle({
    provider: 'runninghubwf',
    kind: 'video',
    modelId: 'workflow-42',
    appId: 42,
    resultPaths: ['results[].videoUrl'],
    executionExtensions: { payloadResolver: 'workflowResolver' },
    inputSlots: { allowedKinds: ['text', 'image'] },
  });
  const [model] = bundle.models;
  const [execution] = bundle.executions;

  assert.equal(model.executionId, 'runninghubwf.workflow.video.workflow-42.v1');
  assert.equal(model.async, true);
  assert.equal(model.cancellable, true);
  assert.deepEqual(model.inputSlots, { allowedKinds: ['text', 'image'] });
  assert.equal(execution.appId, '42');
  assert.equal(execution.submitMode, 'openapi-v2-ai-app');
  assert.equal(execution.queryMode, 'openapi-v2-query');
  assert.deepEqual(execution.extensions, { payloadResolver: 'workflowResolver' });
  assert.deepEqual(execution.result, {
    outputType: 'video',
    taskIdPath: 'taskId',
    paths: ['results[].videoUrl'],
  });
});
