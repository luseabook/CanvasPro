import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REPLICATION_VOICEOVER_KINDS,
  formatReplicationVoiceover,
  normalizeReplicationVoiceover,
} from './videoReplicationSpeech.js';

test('videoReplicationSpeech: normalizes known voiceover entries', () => {
  const result = normalizeReplicationVoiceover(
    [{ kind: 'narration', speakerId: 's1', text: ' hello ' }],
    new Set(['s1']),
  );
  assert.deepEqual(result, [{ kind: 'narration', speakerId: 's1', text: 'hello', uncertain: false }]);
});

test('videoReplicationSpeech: uncertain and unattributed inner monologue entries stay flagged', () => {
  const result = normalizeReplicationVoiceover(
    [
      { kind: 'uncertain', text: 'a' },
      { kind: 'inner_monologue', text: 'b' },
    ],
    new Set(),
  );
  assert.equal(result[0].uncertain, true);
  assert.equal(result[1].uncertain, true);
});

test('videoReplicationSpeech: invalid payload, kind, and speaker are rejected', () => {
  assert.throws(() => normalizeReplicationVoiceover(null, new Set()), Error);
  assert.throws(() => normalizeReplicationVoiceover([{ kind: 'invalid' }], new Set()), Error);
  assert.throws(
    () => normalizeReplicationVoiceover([{ kind: 'narration', speakerId: 'missing' }], new Set()),
    Error,
  );
});

test('videoReplicationSpeech: formatting includes speaker metadata and uncertainty marker', () => {
  const formatted = formatReplicationVoiceover(
    { kind: 'narration', speakerId: 's1', text: 'hello', uncertain: true },
    [{ id: 's1', name: 'Narrator' }],
  );
  assert.match(formatted, /Narrator/);
  assert.match(formatted, /hello/);
  assert.match(formatted, /\u5f85\u6838\u5bf9/);
  assert.equal(Object.keys(REPLICATION_VOICEOVER_KINDS).length, 3);
});
