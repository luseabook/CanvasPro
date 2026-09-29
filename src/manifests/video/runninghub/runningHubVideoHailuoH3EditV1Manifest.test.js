import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RH_VIDEO_HAILUO_H3_EDIT_V1_DEFAULT_PROMPT,
  RH_VIDEO_HAILUO_H3_EDIT_V1_EXECUTION_ID,
  RH_VIDEO_HAILUO_H3_EDIT_V1_MODEL_ID,
  rhVideoHailuoH3EditV1ExecutionManifest,
  rhVideoHailuoH3EditV1ModelManifest,
} from './runningHubVideoHailuoH3EditV1Manifest.js';

test('runningHubVideoHailuoH3EditV1Manifest: provides a default replacement prompt', () => {
  assert.equal(RH_VIDEO_HAILUO_H3_EDIT_V1_MODEL_ID, 'runninghub/2091090228656680961');
  assert.equal(RH_VIDEO_HAILUO_H3_EDIT_V1_EXECUTION_ID, 'runninghub.workflow.video-hailuo-h3-edit-v1.v1');
  assert.match(RH_VIDEO_HAILUO_H3_EDIT_V1_DEFAULT_PROMPT, /subject_definitions/);

  const manifest = rhVideoHailuoH3EditV1ModelManifest;
  assert.deepEqual(manifest.capabilities.fixedAssetSlots, ['sourceVideo', 'refImage']);
  assert.equal(manifest.help.tooltip.includes('1280'), true);
  assert.equal(manifest.uiSchema.fields[0].options.length, 6);
});

test('runningHubVideoHailuoH3EditV1Manifest: maps frame count, reference image, and prompt', () => {
  const execution = rhVideoHailuoH3EditV1ExecutionManifest;
  assert.equal(execution.mapping.nodeInfoList.length, 9);
  assert.equal(execution.mapping.nodeInfoList[1].fieldName, 'force_rate');
  assert.equal(execution.mapping.nodeInfoList[3].source, 'imageInput');
  assert.equal(execution.mapping.nodeInfoList[8].transform, 'minimaxH3AssetMentions');
  assert.equal(execution.extensions.providerProfileBindings.runninghub.appId, '2091130847360544769');
});
