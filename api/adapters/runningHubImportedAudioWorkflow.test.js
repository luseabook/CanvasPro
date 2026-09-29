import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRunningHubImportedAudioRequest } from './runningHubImportedAudioWorkflow.js';

test('runningHubImportedAudioWorkflow: maps imported slots and adds install metadata', async () => {
  const payload = {
    installId: 'install-1',
    nodeId: 'node-1',
    hdMode: 'sharp',
    audioRefs: [],
    videoRefs: [{ refSlot: 'videoUrl', url: 'https://www.runninghub.cn/source.mp4' }],
    imageRefs: [],
  };
  const manifests = {
    modelManifest: { modelId: 'runninghub/2047787809091620866' },
    executionManifest: { id: 'runninghub.audio.imported.v1', queryMode: 'openapi-v2-query' },
  };
  const ctx = {
    getProviderConfig: () => ({ apiKey: 'k' }),
    processInputImages: async () => [],
  };

  const result = await buildRunningHubImportedAudioRequest(payload, 'a prompt', manifests, ctx);

  assert.equal(result.url, '/api/v2/proxy/image');
  assert.equal(result.body.apiKey, 'k');
  assert.equal(result.headers['X-AIC-Install-Id'], 'install-1');
  assert.equal(result.meta.provider, 'runninghubwf');
  assert.equal(result.meta.adapterType, 'workflow');
  assert.equal(result.meta.queryMode, 'openapi-v2-query');
  assert.equal(result.meta.audioWorkflowKey, 'runninghub/2047787809091620866');
  assert.equal(result.meta.model, 'runninghub/2047787809091620866');
  assert.equal(result.meta.executionId, 'runninghub.audio.imported.v1');
  assert.equal(result.meta.nodeId, 'node-1');
  assert.equal(result.meta.installId, 'install-1');
  assert.equal(result.meta.prompt, 'a prompt');

  const videoNode = result.body.nodeInfoList.find(
    (item) => item.nodeId === '12' && item.fieldName === 'video',
  );
  assert.equal(videoNode.fieldValue, 'https://www.runninghub.cn/source.mp4');
});
