import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cliTextExecutionManifests,
  cliTextModelManifests,
  CODEX_CLI_TEXT_EXECUTION_ID,
  CODEX_CLI_TEXT_MODEL_ID,
} from './cliTextModelManifests.js';

test('cliTextModelManifests: exports the Codex CLI text model', () => {
  assert.equal(CODEX_CLI_TEXT_MODEL_ID, 'codex-cli/default');
  assert.equal(CODEX_CLI_TEXT_EXECUTION_ID, 'codex-cli.local-runtime.text.default.v1');
  assert.equal(cliTextModelManifests.length, 1);

  const [model] = cliTextModelManifests;
  assert.equal(model.adapterType, 'localRuntime');
  assert.equal(model.provider, 'codex-cli');
  assert.equal(model.outputType, 'text');
  assert.equal(model.inputSlots.maxByKind.image, 5);
  assert.equal(model.uiSchema.fields[0].extensions.runtimeOptions.source, 'cliProviderModelCatalog');
});

test('cliTextModelManifests: binds the execution to the local CLI runtime', () => {
  assert.equal(cliTextExecutionManifests.length, 1);
  const [execution] = cliTextExecutionManifests;

  assert.equal(execution.id, CODEX_CLI_TEXT_EXECUTION_ID);
  assert.equal(execution.runtime, 'cliText');
  assert.equal(execution.extensions.cliProvider, 'codex');
  assert.deepEqual(execution.result.textFields, ['text']);
});
