import test from 'node:test';
import assert from 'node:assert/strict';
import { repairStoryEpisodeScriptMissingBodyTerminators as repair } from './storyEpisodeScriptResponseRecovery.js';

test('non-string or empty input yields an empty, unrepaired result', () => {
  for (const value of [undefined, null, 0, {}, '']) {
    assert.deepEqual(repair(value), { text: '', repairedCount: 0 });
  }
});

test('well-formed JSON is returned unchanged', () => {
  const text = '{"scenes":[{"ref":"a","body":"x"},{"ref":"b","body":"y"}],"continuityFacts":[]}';
  assert.deepEqual(repair(text), { text, repairedCount: 0 });
});

test('closes a body missing its quote before the next scene object', () => {
  for (const key of ['ref', 'sceneRef', 'scene_ref', 'id']) {
    const text = '[{"body":"甲：你好}, {"' + key + '":"s2","body":"ok"}]';
    assert.deepEqual(repair(text), {
      text: '[{"body":"甲：你好"}, {"' + key + '":"s2","body":"ok"}]',
      repairedCount: 1,
    });
  }
});

test('closes a body missing its quote before trailing state fields', () => {
  for (const key of [
    'continuityFacts',
    'facts',
    'continuity_facts',
    'endingState',
    'finalState',
    'continuityState',
    'ending_state',
  ]) {
    const text = '{"scenes":[{"body":"结尾}] , "' + key + '":[]}';
    assert.deepEqual(repair(text), {
      text: '{"scenes":[{"body":"结尾"}] , "' + key + '":[]}',
      repairedCount: 1,
    });
  }
});

test('counts every repaired body and preserves escaped quotes', () => {
  const text = '{"scenes":[{"ref":"a","body":"他说\\"走\\"}, {"ref":"b","body":"完}],"endingState":{}}';
  const result = repair(text);
  assert.equal(result.repairedCount, 2);
  assert.equal(
    result.text,
    '{"scenes":[{"ref":"a","body":"他说\\"走\\""}, {"ref":"b","body":"完"}],"endingState":{}}',
  );
  assert.deepEqual(
    JSON.parse(result.text).scenes.map((scene) => scene.body),
    ['他说"走"', '完'],
  );
});

test('does not touch a brace that is not followed by a known continuation', () => {
  const text = '{"body":"x}, {"other":1}';
  assert.deepEqual(repair(text), { text, repairedCount: 0 });
});
