import test from 'node:test';
import assert from 'node:assert/strict';

import { runningHubLyricsExecutions, runningHubLyricsModels } from './runningHubLyricsManifests.js';

test('runningHubLyricsManifests: exports both lyrics models with profiles', () => {
  assert.equal(runningHubLyricsModels.length, 2);
  assert.deepEqual(
    runningHubLyricsModels.map((model) => model.modelId),
    ['runninghub/suno-lyrics', 'runninghub/mureka-lyrics'],
  );

  const [suno, mureka] = runningHubLyricsModels;
  assert.deepEqual(suno.extensions.providerProfiles, ['runninghub-international']);
  assert.deepEqual(mureka.extensions.providerProfiles, ['runninghub', 'runninghub-international']);
  assert.equal(suno.prompt.maxLength, 500);
  assert.equal(mureka.prompt.maxLength, 1024);
});

test('runningHubLyricsManifests: maps async task execution endpoints', () => {
  assert.equal(runningHubLyricsExecutions.length, 2);
  const [suno, mureka] = runningHubLyricsExecutions;

  assert.equal(suno.endpoint, '/openapi/v2/rhart-audio/suno/lyrics');
  assert.equal(suno.model, 'rhart-audio/suno/lyrics');
  assert.equal(suno.result.taskIdPath, 'taskId');
  assert.deepEqual(suno.result.textFields, ['results[].text']);
  assert.equal(mureka.extensions.audioModelApi.promptMaxLength, 1024);
});
