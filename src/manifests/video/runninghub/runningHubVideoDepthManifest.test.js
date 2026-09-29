import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RH_VIDEO_DEPTH_EXECUTION_ID,
  RH_VIDEO_DEPTH_MODEL_ID,
  rhVideoDepthExecutionManifest,
  rhVideoDepthModelManifest,
} from './runningHubVideoDepthManifest.js';

test('runningHubVideoDepthManifest: exposes a toolbar video transformation model', () => {
  assert.equal(RH_VIDEO_DEPTH_MODEL_ID, 'runninghub/2095266738832240641');
  assert.equal(RH_VIDEO_DEPTH_EXECUTION_ID, 'runninghub.workflow.video-depth.v1');

  const manifest = rhVideoDepthModelManifest;
  assert.deepEqual(manifest.uiPlacement, ['toolbar']);
  assert.deepEqual(manifest.capabilities.fixedAssetSlots, ['sourceVideo']);
  assert.equal(manifest.extensions.videoToolbarAction.action, 'depth-video');
  assert.equal(manifest.inputSlots.maxByKind.video, 1);
  assert.equal(manifest.uiSchema.fields[2].options.length, 3);
});

test('runningHubVideoDepthManifest: maps source video input and output resolution', () => {
  const execution = rhVideoDepthExecutionManifest;
  assert.equal(execution.id, RH_VIDEO_DEPTH_EXECUTION_ID);
  assert.equal(execution.mapping.nodeInfoList.length, 3);
  assert.equal(execution.mapping.nodeInfoList[0].source, 'videoInput');
  assert.equal(execution.mapping.nodeInfoList[2].defaultValue, 1024);
  assert.equal(
    execution.extensions.providerProfileBindings['runninghub-international'].appId,
    '2095267024489771009',
  );
});
