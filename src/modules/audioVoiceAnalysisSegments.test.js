import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAudioVoiceAnalyzeSegments } from './audioVoiceAnalysisSegments.js';

test('returns an empty array when segments is not an array', () => {
  assert.deepEqual(normalizeAudioVoiceAnalyzeSegments(), []);
  assert.deepEqual(normalizeAudioVoiceAnalyzeSegments({ segments: null }), []);
  assert.deepEqual(normalizeAudioVoiceAnalyzeSegments({ segments: 'nope' }), []);
  assert.deepEqual(normalizeAudioVoiceAnalyzeSegments(null), []);
});

test('normalizes each segment through the shared default shape', () => {
  const out = normalizeAudioVoiceAnalyzeSegments({
    segments: [{ id: 's1', startMs: 100, endMs: 900, sourceText: 'hi', sourceAudioUrl: 'blob:x' }],
  });
  assert.equal(out.length, 1);
  assert.deepEqual(out[0], {
    id: 's1',
    startMs: 100,
    endMs: 900,
    sourceText: 'hi',
    targetText: '',
    speakerId: '',
    speaker: '',
    sourceAudioLocalPath: '',
    sourceAudioUrl: 'blob:x',
    sourceAudioReady: true,
    convertedAudioReady: false,
    activeAudio: 'source',
    status: 'detected',
  });
});

test('assigns positional ids and zero-fills numeric fields when missing', () => {
  const out = normalizeAudioVoiceAnalyzeSegments({ segments: [{}, {}] });
  assert.equal(out[0].id, 'audio-voice-segment-1');
  assert.equal(out[1].id, 'audio-voice-segment-2');
  assert.equal(out[0].startMs, 0);
  assert.equal(out[1].endMs, 0);
});

test('coerces string numerics and keeps a provided id verbatim', () => {
  const out = normalizeAudioVoiceAnalyzeSegments({
    segments: [{ id: 'keep-me', startMs: '250', endMs: '0' }],
  });
  assert.equal(out[0].id, 'keep-me');
  assert.equal(out[0].startMs, 250);
  assert.equal(out[0].endMs, 0);
});

test('resolves speakerId from the first non-empty speaker candidate', () => {
  const out = normalizeAudioVoiceAnalyzeSegments({
    segments: [
      { speaker: '  alpha  ' },
      { speakerInfo: { speaker_id: 'spk-9' } },
      { speaker_info: { speakerId: 'spk-7' } },
      { spk: 'raw-spk' },
      { label: 'labelled' },
    ],
  });
  assert.equal(out[0].speakerId, 'alpha');
  assert.equal(out[1].speakerId, 'spk-9');
  assert.equal(out[2].speakerId, 'spk-7');
  assert.equal(out[3].speakerId, 'raw-spk');
  assert.equal(out[4].speakerId, 'labelled');
});

test('speaker falls back to the resolved speakerId when no dedicated label exists', () => {
  const out = normalizeAudioVoiceAnalyzeSegments({
    segments: [{ speakerId: 'spk-1' }, { speakerId: 'spk-2', speaker: 'Named' }],
  });
  assert.equal(out[0].speaker, 'spk-1');
  assert.equal(out[1].speaker, 'Named');
  assert.equal(out[1].speakerId, 'spk-2');
});

test('ignores nullish speaker candidates but keeps the first trimmed non-empty value', () => {
  const out = normalizeAudioVoiceAnalyzeSegments({
    segments: [{ speakerId: null, speaker: '   ', speaker_id: ' spk-real ' }],
  });
  assert.equal(out[0].speakerId, 'spk-real');
  assert.equal(out[0].speaker, 'spk-real');
});

test('honors an injected normalizeSegment and passes the assembled raw fields', () => {
  const seen = [];
  const out = normalizeAudioVoiceAnalyzeSegments(
    { segments: [{ id: 'a', startMs: 5, endMs: 6, sourceAudioLocalPath: '/p' }] },
    {
      normalizeSegment: (raw) => {
        seen.push(raw);
        return { ...raw, tag: 'custom' };
      },
    },
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].tag, 'custom');
  assert.equal(seen[0].id, 'a');
  assert.equal(seen[0].sourceAudioLocalPath, '/p');
  assert.equal(seen[0].activeAudio, 'source');
  assert.equal(seen[0].status, 'detected');
  assert.equal(seen[0].sourceAudioReady, true);
  assert.equal(seen[0].convertedAudioReady, false);
});

test('falls back to the default normalizer when normalizeSegment is not a function', () => {
  const out = normalizeAudioVoiceAnalyzeSegments(
    { segments: [{ id: 'z' }] },
    { normalizeSegment: 'not-a-function' },
  );
  assert.equal(out[0].activeAudio, 'source');
  assert.equal(out[0].status, 'detected');
});

test('preserves order and length for a mixed batch', () => {
  const out = normalizeAudioVoiceAnalyzeSegments({
    segments: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  });
  assert.deepEqual(
    out.map((segment) => segment.id),
    ['a', 'b', 'c'],
  );
});
