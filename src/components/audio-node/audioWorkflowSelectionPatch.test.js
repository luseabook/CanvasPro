import test from 'node:test';
import assert from 'node:assert/strict';

import { registerManifestBundle } from '../../manifests/index.js';
import {
  buildAudioWorkflowDefaultSyncPatch,
  buildAudioWorkflowGenerationParamsPatch,
  buildAudioWorkflowSelectionPatch,
  doesAudioWorkflowSchemaHaveField,
  getAudioWorkflowUiSchemaField,
} from './audioWorkflowSelectionPatch.js';

const MODEL_ID = 'test/audio-workflow-selection';
const EXECUTION_ID = 'test.audio-workflow-selection.v1';

function registerAudioWorkflow() {
  registerManifestBundle({
    sourceId: 'test.audio-workflow-selection',
    executions: [
      {
        schemaVersion: '1.0',
        id: EXECUTION_ID,
        provider: 'testwf',
        kind: 'audio',
        adapterType: 'workflow',
        workflowId: 'test-audio-workflow',
        submitMode: 'openapi-v2-ai-app',
        queryMode: 'openapi-v2-query',
        mapping: {},
        result: { audioPaths: ['results[].url'] },
      },
    ],
    models: [
      {
        schemaVersion: '1.0',
        modelId: MODEL_ID,
        provider: 'testwf',
        kind: 'audio',
        adapterType: 'workflow',
        executionId: EXECUTION_ID,
        displayName: 'Test audio workflow',
        uiSchema: {
          fields: [
            { id: 'speakerId', type: 'text', defaultValue: 'preset-speaker' },
            {
              id: 'voiceMode',
              type: 'segmented',
              defaultValue: 'default',
              options: [
                { value: 'default', label: 'Default' },
                { value: 'custom', label: 'Custom' },
              ],
            },
            {
              id: 'temperature',
              type: 'slider',
              defaultValue: 0.5,
              min: 0,
              max: 1,
              step: 0.1,
            },
          ],
        },
        inputSlots: {
          allowedKinds: ['text'],
          minByKind: { text: 1 },
          maxByKind: { image: 0, video: 0, audio: 0 },
        },
        outputType: 'audio',
        extensions: {
          providerProfiles: ['site-a', 'site-b'],
        },
      },
    ],
  });
}

registerAudioWorkflow();

test('audioWorkflowSelectionPatch: resolves schema fields and generation parameters', () => {
  assert.equal(getAudioWorkflowUiSchemaField(MODEL_ID, 'speakerId').type, 'text');
  assert.equal(doesAudioWorkflowSchemaHaveField(MODEL_ID, 'voiceMode'), true);
  assert.equal(doesAudioWorkflowSchemaHaveField(MODEL_ID, 'missing'), false);

  const patch = buildAudioWorkflowGenerationParamsPatch({
    nodeData: {
      model: 'other-model',
      generationParams: { speakerId: ' custom ', temperature: 0.2 },
      generationParamsByModel: {
        'other-model': { temperature: 1 },
      },
    },
    workflowKey: MODEL_ID,
    extraParams: { temperature: 0.9 },
  });

  assert.deepEqual(patch.generationParams, {
    speakerId: 'custom',
    voiceMode: 'custom',
    temperature: 0.9,
  });
  assert.deepEqual(patch.generationParamsByModel, {
    'other-model': { speakerId: ' custom ', temperature: 0.2 },
    [MODEL_ID]: {
      speakerId: 'custom',
      voiceMode: 'custom',
      temperature: 0.9,
    },
  });
});

test('audioWorkflowSelectionPatch: selects a workflow and emits a minimal default sync', () => {
  const selection = buildAudioWorkflowSelectionPatch({
    nodeData: {
      model: 'other-model',
      generationParams: { speakerId: ' custom ', temperature: 0.2 },
      generationParamsByModel: {
        'other-model': { temperature: 1 },
      },
    },
    workflow: {
      key: MODEL_ID,
      label: 'Test workflow',
      provider: 'testwf',
    },
    extraParams: { temperature: 0.9 },
  });

  assert.equal(selection.provider, 'testwf');
  assert.equal(selection.audioWorkflowKey, MODEL_ID);
  assert.equal(selection.audioWorkflowLabel, 'Test workflow');
  assert.equal(selection.model, MODEL_ID);
  assert.equal(selection.providerProfileId, 'site-a');
  assert.equal(selection.rhProviderProfileId, '');
  assert.deepEqual(selection.providerProfileIdByModel, {
    [MODEL_ID]: 'site-a',
  });
  assert.deepEqual(selection.generationParams, {
    speakerId: 'custom',
    voiceMode: 'custom',
    temperature: 0.9,
  });
  assert.deepEqual(
    buildAudioWorkflowSelectionPatch({
      nodeData: {},
      workflow: {},
    }),
    {},
  );

  const defaultParameters = {
    speakerId: 'preset-speaker',
    voiceMode: 'default',
    temperature: 0.5,
  };
  const syncedNode = {
    provider: 'testwf',
    audioWorkflowKey: MODEL_ID,
    audioWorkflowLabel: 'Test workflow',
    model: MODEL_ID,
    providerProfileId: 'site-a',
    providerProfileIdByModel: { [MODEL_ID]: 'site-a' },
    generationParams: defaultParameters,
    generationParamsByModel: { [MODEL_ID]: defaultParameters },
  };
  assert.deepEqual(
    buildAudioWorkflowDefaultSyncPatch({
      nodeData: syncedNode,
      workflow: {
        key: MODEL_ID,
        label: 'Test workflow',
        provider: 'testwf',
      },
    }),
    {},
  );
});
