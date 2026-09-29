import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_EXECUTION_ID,
  RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_MODEL_ID,
  rhVideoHailuoH3DualSamplingX2ExecutionManifest,
  rhVideoHailuoH3DualSamplingX2ModelManifest,
} from './runningHubVideoHailuoH3DualSamplingX2Manifest.js';

test('runningHubVideoHailuoH3DualSamplingX2Manifest: exposes the dedicated model and execution ids', () => {
  assert.equal(RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_MODEL_ID, 'runninghub/2090422129480265729');
  assert.equal(
    RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_EXECUTION_ID,
    'runninghub.workflow.video-hailuo-h3-dual-sampling-x2.v1',
  );
});

test('runningHubVideoHailuoH3DualSamplingX2Manifest: clones Omni capabilities and overrides execution routing', () => {
  const model = rhVideoHailuoH3DualSamplingX2ModelManifest;
  const execution = rhVideoHailuoH3DualSamplingX2ExecutionManifest;

  assert.equal(model.modelId, RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_MODEL_ID);
  assert.equal(model.executionId, RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_EXECUTION_ID);
  assert.equal(model.displayName, '海螺H3双采（分辨率X2）');
  assert.equal(model.capabilities.fixedAssetSlots.length, 2);
  assert.equal(model.inputSlots.maxByKind.image, 9);

  assert.equal(execution.id, RH_VIDEO_HAILUO_H3_DUAL_SAMPLING_X2_EXECUTION_ID);
  assert.equal(execution.label, '海螺H3双采（分辨率X2）');
  assert.equal(execution.workflowId, '2090422129480265729');
  assert.equal(execution.appId, '2090422129480265729');
  assert.equal(execution.extensions.payloadResolver, 'runninghubHailuoH3Omni');
  assert.equal(execution.extensions.collectMediaInputs, true);
  assert.deepEqual(execution.extensions.providerProfileBindings, {
    'runninghub-international': { workflowId: '2090405010136297474' },
  });
  assert.equal(execution.mapping.firstLastFrameNode.firstFieldName, 'first_frame');
});
