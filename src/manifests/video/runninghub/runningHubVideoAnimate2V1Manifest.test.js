import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RH_VIDEO_ANIMATE2_V1_EXECUTION_ID,
  RH_VIDEO_ANIMATE2_V1_MODEL_ID,
  rhVideoAnimate2V1ExecutionManifest,
  rhVideoAnimate2V1ModelManifest,
} from './runningHubVideoAnimate2V1Manifest.js';

test('runningHubVideoAnimate2V1Manifest: declares required source video and reference image', () => {
  assert.equal(RH_VIDEO_ANIMATE2_V1_MODEL_ID, 'runninghub/2086051371794657282');
  assert.equal(RH_VIDEO_ANIMATE2_V1_EXECUTION_ID, 'runninghub.workflow.video-animate2-v1.v1');

  const manifest = rhVideoAnimate2V1ModelManifest;
  assert.equal(manifest.provider, 'runninghubwf');
  assert.equal(manifest.adapterType, 'workflow');
  assert.deepEqual(manifest.capabilities.fixedAssetSlots, ['sourceVideo', 'refImage']);
  assert.deepEqual(manifest.inputSlots.minByKind, { image: 1, video: 1 });
  assert.equal(manifest.uiSchema.fields.length, 7);
});

test('runningHubVideoAnimate2V1Manifest: maps source video, reference image, and parameters', () => {
  const execution = rhVideoAnimate2V1ExecutionManifest;
  assert.equal(execution.id, RH_VIDEO_ANIMATE2_V1_EXECUTION_ID);
  assert.equal(execution.appId, '2086051371794657282');
  assert.equal(execution.submitMode, 'openapi-v2-ai-app');
  assert.equal(execution.mapping.nodeInfoList.length, 9);
  assert.equal(
    execution.extensions.providerProfileBindings['runninghub-international'].appId,
    '2086056089641525250',
  );
});
