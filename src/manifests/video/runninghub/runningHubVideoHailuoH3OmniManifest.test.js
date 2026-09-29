import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RH_VIDEO_HAILUO_H3_OMNI_EXECUTION_ID,
  RH_VIDEO_HAILUO_H3_OMNI_MODEL_ID,
  rhVideoHailuoH3OmniExecutionManifest,
  rhVideoHailuoH3OmniModelManifest,
} from './runningHubVideoHailuoH3OmniManifest.js';

test('runningHubVideoHailuoH3OmniManifest: supports frames and all-media reference modes', () => {
  assert.equal(RH_VIDEO_HAILUO_H3_OMNI_MODEL_ID, 'runninghub/2084286867645755393');
  assert.equal(RH_VIDEO_HAILUO_H3_OMNI_EXECUTION_ID, 'runninghub.workflow.video-hailuo-h3-omni.v1');

  const manifest = rhVideoHailuoH3OmniModelManifest;
  assert.deepEqual(manifest.capabilities.fixedAssetSlots, ['firstFrame', 'lastFrame']);
  assert.equal(manifest.inputSlots.maxByKind.image, 9);
  assert.deepEqual(manifest.inputSlots.fixedSlots[0].showWhen, {
    field: 'rh_hailuo_h3_mode',
    value: 'frames',
  });
  assert.equal(manifest.uiSchema.fields[0].options.length, 2);
  assert.equal(manifest.uiSchema.fields[3].options.length, 13);
  assert.equal(manifest.uiSchema.fields[4].options.length, 3);
});

test('runningHubVideoHailuoH3OmniManifest: maps media loader limits and reference fields', () => {
  const execution = rhVideoHailuoH3OmniExecutionManifest;
  assert.equal(execution.extensions.payloadResolver, 'runninghubHailuoH3Omni');
  assert.equal(execution.mapping.imageLoaderNodes.length, 9);
  assert.equal(execution.mapping.videoLoaderNodes.length, 3);
  assert.equal(execution.mapping.audioLoaderNodes.length, 3);
  assert.equal(execution.mapping.firstLastFrameNode.firstFieldName, 'first_frame');
  assert.equal(execution.mapping.referenceNode.videoAudioFieldPrefix, 'ref_video_audios.ref_video_audio_');
});
