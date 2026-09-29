import test from 'node:test';
import assert from 'node:assert/strict';

import { GENERATION_MANUAL_DISPLAY_SIZE_FIELD } from './generationDisplayPolicy.js';
import {
  RH_AI_APP_RESULT_RATIO_KEY,
  buildRhAiAppResultDisplayPatch,
  isComfyUiWorkflowManifest,
  isCustomAiAppManifest,
  isRunningHubAiAppManifest,
  isRunningHubCustomAiAppManifest,
  resolveCustomAiAppNodeManifest,
  shouldAllowEmptyCustomAiAppInputs,
} from './rhAiAppNodeBehavior.js';

test('rhAiAppNodeBehavior: manifest predicates recognize RH and ComfyUI wrappers', () => {
  const rh = { extensions: { rhAiApp: { id: 'rh' } } };
  const comfy = { extensions: { comfyUiWorkflow: { id: 'comfy' } } };
  assert.equal(isRunningHubCustomAiAppManifest(rh), true);
  assert.equal(isComfyUiWorkflowManifest(comfy), true);
  assert.equal(isCustomAiAppManifest(rh), true);
  assert.equal(isRunningHubAiAppManifest(comfy), true);
  assert.equal(shouldAllowEmptyCustomAiAppInputs(rh), true);
  assert.equal(isCustomAiAppManifest({}), false);
});

test('rhAiAppNodeBehavior: bundle lookup resolves a provider-compatible custom manifest', () => {
  const manifest = {
    modelId: 'vendor/model',
    provider: 'runninghub',
    extensions: { rhAiApp: { id: 'x' } },
  };
  assert.equal(
    resolveCustomAiAppNodeManifest(
      { rhAiAppManifestBundle: { models: [manifest] } },
      { provider: 'runninghub' },
    ),
    manifest,
  );
  assert.equal(
    resolveCustomAiAppNodeManifest({ rhAiAppManifestBundle: { models: [manifest] } }, { provider: 'other' }),
    null,
  );
});

test('rhAiAppNodeBehavior: result patches scale by short side and preserve center anchor', () => {
  const patch = buildRhAiAppResultDisplayPatch({
    nodeData: { width: 100, height: 100, x: 10, y: 20 },
    mediaWidth: 1920,
    mediaHeight: 1080,
    mediaKey: 'image-1',
  });
  assert.deepEqual(patch, {
    width: 512,
    height: 288,
    x: -196,
    y: -168,
    [RH_AI_APP_RESULT_RATIO_KEY]: 'image-1|1920|1080',
    [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: false,
  });
  assert.deepEqual(
    buildRhAiAppResultDisplayPatch({
      nodeData: { ...patch, width: 100, height: 100, x: 10, y: 20 },
      mediaWidth: 1920,
      mediaHeight: 1080,
      mediaKey: 'image-1',
    }),
    {},
  );
  assert.deepEqual(buildRhAiAppResultDisplayPatch({ mediaWidth: 0, mediaHeight: 0 }), {});
});
