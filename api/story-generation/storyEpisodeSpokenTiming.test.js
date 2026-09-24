import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_MAX_SPOKEN_UNITS_PER_SECOND,
  countStorySpokenUnits,
  normalizeStoryEpisodeSpokenTiming,
} from './storyEpisodeSpokenTiming.js';

const SIXTEEN = '一二三四五六七八，九十一二三四五六。';

test('the spoken-rate ceiling is four units per second', () => {
  assert.equal(STORY_MAX_SPOKEN_UNITS_PER_SECOND, 4);
});

test('countStorySpokenUnits counts Han characters and Latin/number words', () => {
  assert.equal(countStorySpokenUnits('你好世界'), 4);
  assert.equal(countStorySpokenUnits('你好，世界！'), 4);
  assert.equal(countStorySpokenUnits('Hello world 2024'), 3);
  assert.equal(countStorySpokenUnits("don't stop"), 2);
  assert.equal(countStorySpokenUnits('我有3个apple'), 5);
  assert.equal(countStorySpokenUnits(''), 0);
  assert.equal(countStorySpokenUnits(null), 0);
  assert.equal(countStorySpokenUnits(), 0);
});

test('countStorySpokenUnits ignores speaker prefixes on every line', () => {
  assert.equal(countStorySpokenUnits('小明：你好'), 2);
  assert.equal(countStorySpokenUnits('Tom: hi there'), 2);
  assert.equal(countStorySpokenUnits('甲：你好\n乙：再见'), 4);
  assert.equal(countStorySpokenUnits('甲：你好\r\n乙：再见'), 4);
});

test('non-array input normalizes to an empty list', () => {
  assert.deepEqual(normalizeStoryEpisodeSpokenTiming(null), []);
  assert.deepEqual(normalizeStoryEpisodeSpokenTiming({}), []);
});

test('clips without impossible speech are returned by reference', () => {
  const clips = [
    { ref: 'a', shots: [{ dialogue: '一二三四五六七八', durationSec: 2 }] },
    { ref: 'b', shots: [{ dialogue: SIXTEEN, voiceover: '旁白', durationSec: 1 }] },
    { ref: 'c', shots: [{ dialogue: '太短了', durationSec: 0.5 }] },
    { ref: 'd', shots: [{ dialogue: SIXTEEN, durationSec: 0 }] },
  ];
  const result = normalizeStoryEpisodeSpokenTiming(clips);
  assert.equal(result.length, 4);
  result.forEach((clip, index) => assert.equal(clip, clips[index]));
});

test('an over-fast shot is split at authored pauses and regrouped into timed clips', () => {
  const shot = {
    visual: '雨夜',
    dialogue: SIXTEEN,
    durationSec: 2,
    startSec: 0,
    endSec: 2,
    assetRefs: ['a1'],
  };
  const clip = { ref: 'c1', script: 'old', shots: [shot], durationSec: 2, contentDurationSec: 2 };
  const result = normalizeStoryEpisodeSpokenTiming([clip], {
    maxClipDurationSeconds: 2,
    maxSpokenUnitsPerSecond: 4,
  });
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((item) => item.ref),
    ['c1-timing-1', 'c1-timing-2'],
  );
  assert.deepEqual(
    result.map((item) => item.script),
    ['雨夜；一二三四五六七八，', '雨夜；九十一二三四五六。'],
  );
  for (const item of result) {
    assert.equal(item.durationSec, 2);
    assert.equal(item.contentDurationSec, 2);
    assert.deepEqual(item.assetRefs, ['a1']);
    assert.equal(item.shots.length, 1);
    assert.equal(item.shots[0].durationSec, 2);
    assert.equal(item.shots[0].startSec, 0);
    assert.equal(item.shots[0].endSec, 2);
  }
  assert.deepEqual(
    result.map((item) => item.shots[0].dialogue),
    ['一二三四五六七八，', '九十一二三四五六。'],
  );
  assert.equal(shot.dialogue, SIXTEEN);
});

test('split pieces keep the speaker prefix', () => {
  const result = normalizeStoryEpisodeSpokenTiming(
    [{ ref: 'c1', shots: [{ dialogue: '小明：' + SIXTEEN, durationSec: 2 }] }],
    { maxClipDurationSeconds: 2 },
  );
  assert.deepEqual(
    result.map((item) => item.shots[0].dialogue),
    ['小明：一二三四五六七八，', '小明：九十一二三四五六。'],
  );
});

test('voiceover-only shots are split the same way', () => {
  const result = normalizeStoryEpisodeSpokenTiming(
    [{ ref: 'v', shots: [{ voiceover: SIXTEEN, durationSec: 2 }] }],
    { maxClipDurationSeconds: 2 },
  );
  assert.deepEqual(
    result.map((item) => item.shots[0].voiceover),
    ['一二三四五六七八，', '九十一二三四五六。'],
  );
});

test('a rebuilt clip that fits one group gets a fallback ref and a stretched duration', () => {
  const result = normalizeStoryEpisodeSpokenTiming([{ shots: [{ dialogue: SIXTEEN, durationSec: 2 }] }]);
  assert.equal(result.length, 1);
  const [clip] = result;
  assert.equal(clip.ref, 'clip-1');
  assert.equal(clip.durationSec, 4);
  assert.equal(clip.script, SIXTEEN);
  assert.equal('contentDurationSec' in clip, false);
  assert.equal(clip.shots.length, 1);
  assert.equal(clip.shots[0].durationSec, 4);
  assert.equal('startSec' in clip.shots[0], false);
});
