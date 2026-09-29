import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RH_VIDEO_WAN22_EXECUTION_ID,
  RH_VIDEO_WAN22_MODEL_ID,
  rhVideoWan22ExecutionManifest,
  rhVideoWan22ModelManifest,
} from './runningHubVideoWan22Manifest.js';

test('runningHubVideoWan22Manifest: exposes optional first and last frame slots', () => {
  assert.equal(RH_VIDEO_WAN22_MODEL_ID, 'runninghub/2073678184750604289');
  assert.equal(RH_VIDEO_WAN22_EXECUTION_ID, 'runninghub.workflow.video-wan22.v1');

  const manifest = rhVideoWan22ModelManifest;
  assert.deepEqual(manifest.capabilities.fixedAssetSlots, ['firstFrame', 'lastFrame']);
  assert.equal(manifest.inputSlots.maxByKind.image, 2);
  assert.equal(manifest.inputSlots.fixedSlots[0].required, false);
  assert.equal(manifest.uiSchema.fields[0].options.length, 4);
  assert.equal(manifest.uiSchema.fields[2].defaultValue, 81);
});

test('runningHubVideoWan22Manifest: maps prompt, mode, dimensions, and frame count', () => {
  const execution = rhVideoWan22ExecutionManifest;
  assert.equal(execution.extensions.payloadResolver, 'runninghubWan22Video');
  assert.equal(execution.mapping.firstFrameNode.nodeId, '158');
  assert.equal(execution.mapping.lastFrameNode.nodeId, '224');
  assert.equal(execution.mapping.modeNode.nodeId, '260');
  assert.equal(execution.mapping.framesNode.defaultValue, 81);
  assert.equal(execution.mapping.promptNode.nodeId, '159');
});
