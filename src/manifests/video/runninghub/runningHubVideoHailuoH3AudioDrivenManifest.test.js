import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_EXECUTION_ID,
  RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_MODEL_ID,
  rhVideoHailuoH3AudioDrivenExecutionManifest,
  rhVideoHailuoH3AudioDrivenModelManifest,
} from './runningHubVideoHailuoH3AudioDrivenManifest.js';

test('runningHubVideoHailuoH3AudioDrivenManifest: requires one audio reference', () => {
  assert.equal(RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_MODEL_ID, 'runninghub/2092941359513694209');
  assert.equal(
    RH_VIDEO_HAILUO_H3_AUDIO_DRIVEN_EXECUTION_ID,
    'runninghub.workflow.video-hailuo-h3-audio-driven.v1',
  );

  const manifest = rhVideoHailuoH3AudioDrivenModelManifest;
  assert.deepEqual(manifest.capabilities.fixedAssetSlots, ['audio']);
  assert.equal(manifest.inputSlots.minByKind.audio, 1);
  assert.equal(manifest.inputSlots.fixedSlots[0].required, true);
  assert.equal(manifest.inputSlots.maxByKind.image, 4);
  assert.equal(manifest.uiSchema.fields[0].options.length, 5);
});

test('runningHubVideoHailuoH3AudioDrivenManifest: exposes dimensions and input loaders', () => {
  const execution = rhVideoHailuoH3AudioDrivenExecutionManifest;
  assert.equal(execution.submitMode, 'runninghub-task-create');
  assert.equal(execution.extensions.payloadResolver, 'runninghubHailuoH3AudioDriven');
  assert.equal(execution.mapping.imageLoaderNodes.length, 4);
  assert.equal(execution.mapping.videoLoaderNodes.length, 1);
  assert.equal(execution.mapping.audioLoaderNodes.length, 1);
  assert.deepEqual(execution.mapping.referenceLimits, { image: 4, video: 1, audio: 1 });
});
