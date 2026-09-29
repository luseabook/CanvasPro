import test from 'node:test';
import assert from 'node:assert/strict';

import {
  OPENAI_CLI_IMAGE_EXECUTION_ID,
  OPENAI_CLI_IMAGE_MODEL_ID,
  openAiCliImageExecutionManifests,
  openAiCliImageModelManifests,
} from './openAiCliImageManifest.js';

test('openAiCliImageManifest: exports the local runtime model contract', () => {
  assert.equal(OPENAI_CLI_IMAGE_MODEL_ID, 'openai-cli/image-generation');
  assert.equal(OPENAI_CLI_IMAGE_EXECUTION_ID, 'openai-cli.local-runtime.image-generation.v1');
  assert.equal(openAiCliImageModelManifests.length, 1);
  assert.equal(openAiCliImageExecutionManifests.length, 1);

  const [model] = openAiCliImageModelManifests;
  assert.equal(model.adapterType, 'localRuntime');
  assert.equal(model.provider, 'openai-cli');
  assert.equal(model.outputType, 'image');
  assert.equal(model.inputSlots.maxByKind.image, 5);
  assert.equal(model.uiSchema.fields.length, 3);
  assert.equal(model.extensions.imageFunctionMenu.enabled, true);
});

test('openAiCliImageManifest: configures the execution prompt fields and URL result', () => {
  const [execution] = openAiCliImageExecutionManifests;

  assert.equal(execution.runtime, 'openAiCliImage');
  assert.deepEqual(execution.result.urlFields, ['imageUrl', 'url']);
  assert.equal(execution.extensions.cliProvider, 'codex');
  assert.deepEqual(
    execution.extensions.promptFields.map((entry) => entry.field),
    ['imageSize', 'aspectRatio'],
  );
});
