import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEEDANCE2_INPUT_MAX_BY_KIND,
  SEEDANCE25_INPUT_MAX_BY_KIND,
  SEEDANCE2_MAX_TOTAL_DURATION_SECONDS_BY_KIND,
  SEEDANCE25_MAX_TOTAL_DURATION_SECONDS_BY_KIND,
  validateModelMediaInputLimits,
} from './modelMediaInputLimits.js';

test('freezes the seedance input max tables in kind order', () => {
  assert.equal(Object.isFrozen(SEEDANCE2_INPUT_MAX_BY_KIND), true);
  assert.deepEqual(Object.keys(SEEDANCE2_INPUT_MAX_BY_KIND), ['image', 'video', 'audio']);
  assert.deepEqual({ ...SEEDANCE2_INPUT_MAX_BY_KIND }, { image: 9, video: 3, audio: 3 });
  assert.equal(Object.isFrozen(SEEDANCE25_INPUT_MAX_BY_KIND), true);
  assert.deepEqual(Object.keys(SEEDANCE25_INPUT_MAX_BY_KIND), ['image', 'video', 'audio']);
  assert.deepEqual({ ...SEEDANCE25_INPUT_MAX_BY_KIND }, { image: 30, video: 10, audio: 10 });
});

test('freezes the seedance total duration tables', () => {
  assert.equal(Object.isFrozen(SEEDANCE2_MAX_TOTAL_DURATION_SECONDS_BY_KIND), true);
  assert.deepEqual({ ...SEEDANCE2_MAX_TOTAL_DURATION_SECONDS_BY_KIND }, { video: 15.09, audio: 15 });
  assert.equal(Object.isFrozen(SEEDANCE25_MAX_TOTAL_DURATION_SECONDS_BY_KIND), true);
  assert.deepEqual({ ...SEEDANCE25_MAX_TOTAL_DURATION_SECONDS_BY_KIND }, { video: 30, audio: 30 });
});

test('passes with empty media and reports zeroed frozen stats', () => {
  const result = validateModelMediaInputLimits();
  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.statsByKind), true);
  assert.deepEqual(result.statsByKind, {
    image: { count: 0, totalDurationSeconds: 0, entries: [] },
    video: { count: 0, totalDurationSeconds: 0, entries: [] },
    audio: { count: 0, totalDurationSeconds: 0, entries: [] },
  });
  for (const kind of ['image', 'video', 'audio']) {
    assert.equal(Object.isFrozen(result.statsByKind[kind]), true);
    assert.equal(Object.isFrozen(result.statsByKind[kind].entries), true);
  }
});

test('deduplicates urls and merges the largest duration and size per url', () => {
  const result = validateModelMediaInputLimits({
    images: [' a.png ', 'b.jpg', 'a.png', '', null, '   '],
    imageEntries: [
      { url: 'a.png', duration: 0, sizeBytes: 0 },
      { url: ' a.png ', durationSeconds: 2.5, fileSize: 1000 },
      { url: 'c.png', duration: 3, sizeBytes: 2000 },
      { url: '', duration: 5 },
      null,
    ],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.statsByKind.image, {
    count: 3,
    totalDurationSeconds: 5.5,
    entries: [
      { url: 'a.png', duration: 2.5, sizeBytes: 1000 },
      { url: 'b.jpg', duration: 0, sizeBytes: 0 },
      { url: 'c.png', duration: 3, sizeBytes: 2000 },
    ],
  });
  for (const entry of result.statsByKind.image.entries) assert.equal(Object.isFrozen(entry), true);
});

test('counts entry-only urls and deduplicates them in insertion order', () => {
  const result = validateModelMediaInputLimits({
    audios: ['https://x/a.mp3'],
    audioEntries: [
      { url: 'https://x/a.mp3', duration: 2 },
      { url: ' https://x/a.mp3 ', duration: 5 },
      { url: 'https://x/b.mp3', duration: 1 },
    ],
  });
  assert.deepEqual(result.statsByKind.audio, {
    count: 2,
    totalDurationSeconds: 6,
    entries: [
      { url: 'https://x/a.mp3', duration: 5, sizeBytes: 0 },
      { url: 'https://x/b.mp3', duration: 1, sizeBytes: 0 },
    ],
  });
});

test('takes the first finite positive duration and size alternative', () => {
  const result = validateModelMediaInputLimits({
    videos: ['a.mp4', 'b.mp4', 'c.mp4', 'd.mp4'],
    videoEntries: [
      { url: 'a.mp4', duration: -5, durationSeconds: 'abc', videoDuration: '7' },
      { url: 'b.mp4', duration: 0, durationSeconds: '4', videoDuration: 9 },
      { url: 'c.mp4', sizeBytes: 'abc', fileSize: 0, byteSize: 2048 },
      { url: 'd.mp4', duration: null, durationSeconds: true },
    ],
  });
  assert.deepEqual(
    result.statsByKind.video.entries.map((entry) => [entry.url, entry.duration, entry.sizeBytes]),
    [
      ['a.mp4', 7, 0],
      ['b.mp4', 4, 0],
      ['c.mp4', 0, 2048],
      ['d.mp4', 1, 0],
    ],
  );
  assert.equal(result.statsByKind.video.totalDurationSeconds, 12);
});

test('fails with max<Kind>s when a count exceeds the per-kind limit', () => {
  const result = validateModelMediaInputLimits({
    images: ['a', 'b', 'c'],
    inputSlots: { maxByKind: { image: 2 } },
  });
  assert.deepEqual(result, { ok: false, code: 'maxImages', kind: 'image', max: 2, actual: 3 });
  assert.equal(Object.isFrozen(result), true);
});

test('passes when the count equals the limit and reads string limits', () => {
  const equal = validateModelMediaInputLimits({
    videos: ['a', 'b'],
    inputSlots: { maxByKind: { video: 2 } },
  });
  assert.equal(equal.ok, true);
  const stringy = validateModelMediaInputLimits({
    images: ['a', 'b'],
    inputSlots: { maxByKind: { image: '1' } },
  });
  assert.deepEqual(stringy, { ok: false, code: 'maxImages', kind: 'image', max: 1, actual: 2 });
});

test('names the count codes after each kind and checks them in order', () => {
  const videos = validateModelMediaInputLimits({
    videos: ['a', 'b'],
    inputSlots: { maxByKind: { video: 1 } },
  });
  assert.deepEqual(videos, { ok: false, code: 'maxVideos', kind: 'video', max: 1, actual: 2 });
  const audios = validateModelMediaInputLimits({
    audios: ['a', 'b'],
    inputSlots: { maxByKind: { audio: 1 } },
  });
  assert.deepEqual(audios, { ok: false, code: 'maxAudios', kind: 'audio', max: 1, actual: 2 });
  const mixed = validateModelMediaInputLimits({
    images: ['a', 'b'],
    videos: ['a', 'b'],
    audios: ['a', 'b'],
    inputSlots: { maxByKind: { image: 1, video: 1, audio: 1 } },
  });
  assert.equal(mixed.code, 'maxImages');
});

test('ignores non-positive and non-numeric per-kind limits', () => {
  for (const image of [0, -3, '0', '', 'abc', null, NaN, undefined, {}]) {
    const result = validateModelMediaInputLimits({
      images: ['a', 'b'],
      inputSlots: { maxByKind: { image } },
    });
    assert.equal(result.ok, true);
  }
  const truthy = validateModelMediaInputLimits({
    images: ['a', 'b'],
    inputSlots: { maxByKind: { image: true } },
  });
  assert.deepEqual(truthy, { ok: false, code: 'maxImages', kind: 'image', max: 1, actual: 2 });
  assert.equal(validateModelMediaInputLimits({ images: ['a', 'b'] }).ok, true);
  assert.equal(validateModelMediaInputLimits({ images: ['a', 'b'], inputSlots: {} }).ok, true);
});

test('fails min<Kind>Seconds when a known duration is below the minimum', () => {
  const result = validateModelMediaInputLimits({
    videos: ['https://x/v.mp4'],
    videoEntries: [{ url: 'https://x/v.mp4', duration: 2 }],
    inputSlots: { mediaConstraintsByKind: { video: { minDurationSeconds: 3 } } },
  });
  assert.deepEqual(result, {
    ok: false,
    code: 'minVideoSeconds',
    kind: 'video',
    min: 3,
    actual: 2,
    url: 'https://x/v.mp4',
  });
  assert.equal(Object.isFrozen(result), true);
});

test('names the minimum code after the media kind', () => {
  const result = validateModelMediaInputLimits({
    audios: ['https://x/a.mp3'],
    audioEntries: [{ url: 'https://x/a.mp3', duration: 1 }],
    inputSlots: { mediaConstraintsByKind: { audio: { minDurationSeconds: 5 } } },
  });
  assert.equal(result.code, 'minAudioSeconds');
  assert.equal(result.kind, 'audio');
});

test('ignores the minimum for zero or unknown durations', () => {
  const result = validateModelMediaInputLimits({
    videos: ['https://x/v.mp4', 'https://x/w.mp4'],
    videoEntries: [{ url: 'https://x/v.mp4', duration: 0 }, { url: 'https://x/w.mp4' }],
    inputSlots: { mediaConstraintsByKind: { video: { minDurationSeconds: 3 } } },
  });
  assert.equal(result.ok, true);
});

test('fails max<Kind>Seconds when a duration exceeds the maximum', () => {
  const result = validateModelMediaInputLimits({
    images: ['https://x/i.png'],
    imageEntries: [{ url: 'https://x/i.png', duration: 6 }],
    inputSlots: { mediaConstraintsByKind: { image: { maxDurationSeconds: 5 } } },
  });
  assert.deepEqual(result, {
    ok: false,
    code: 'maxImageSeconds',
    kind: 'image',
    max: 5,
    actual: 6,
    url: 'https://x/i.png',
  });
});

test('allows a duration exactly at the maximum and ignores non-positive bounds', () => {
  const exact = validateModelMediaInputLimits({
    images: ['https://x/i.png'],
    imageEntries: [{ url: 'https://x/i.png', duration: 5 }],
    inputSlots: { mediaConstraintsByKind: { image: { maxDurationSeconds: 5 } } },
  });
  assert.equal(exact.ok, true);
  const disabled = validateModelMediaInputLimits({
    videos: ['https://x/v.mp4'],
    videoEntries: [{ url: 'https://x/v.mp4', duration: 99 }],
    inputSlots: { mediaConstraintsByKind: { video: { minDurationSeconds: 0, maxDurationSeconds: -1 } } },
  });
  assert.equal(disabled.ok, true);
});

test('stops at the first violating entry', () => {
  const result = validateModelMediaInputLimits({
    videos: ['https://x/ok.mp4', 'https://x/big.mp4'],
    videoEntries: [
      { url: 'https://x/ok.mp4', duration: 4 },
      { url: 'https://x/big.mp4', duration: 9 },
    ],
    inputSlots: { mediaConstraintsByKind: { video: { maxDurationSeconds: 5 } } },
  });
  assert.deepEqual(result, {
    ok: false,
    code: 'maxVideoSeconds',
    kind: 'video',
    max: 5,
    actual: 9,
    url: 'https://x/big.mp4',
  });
});

test('fails invalid<Kind>Extension when the extension is not allowed', () => {
  const result = validateModelMediaInputLimits({
    images: ['https://x/a.webp'],
    inputSlots: { mediaConstraintsByKind: { image: { allowedExtensions: ['.PNG', 'jpg', ''] } } },
  });
  assert.deepEqual(result, {
    ok: false,
    code: 'invalidImageExtension',
    kind: 'image',
    actual: 'webp',
    allowed: 'png, jpg',
    url: 'https://x/a.webp',
  });
});

test('accepts an allowed extension regardless of case', () => {
  const result = validateModelMediaInputLimits({
    images: ['https://x/a.PNG'],
    inputSlots: { mediaConstraintsByKind: { image: { allowedExtensions: ['png'] } } },
  });
  assert.equal(result.ok, true);
});

test('reads the extension from a query parameter when the path has none', () => {
  const allowed = validateModelMediaInputLimits({
    videos: ['https://x/download?file=clip.MP4'],
    inputSlots: { mediaConstraintsByKind: { video: { allowedExtensions: ['mp4'] } } },
  });
  assert.equal(allowed.ok, true);
  const rejected = validateModelMediaInputLimits({
    videos: ['https://x/download?file=clip.MP4'],
    inputSlots: { mediaConstraintsByKind: { video: { allowedExtensions: ['webm'] } } },
  });
  assert.deepEqual(rejected, {
    ok: false,
    code: 'invalidVideoExtension',
    kind: 'video',
    actual: 'mp4',
    allowed: 'webm',
    url: 'https://x/download?file=clip.MP4',
  });
});

test('prefers the path extension over a query parameter', () => {
  const result = validateModelMediaInputLimits({
    videos: ['https://x/clip.webm?file=other.mp4'],
    inputSlots: { mediaConstraintsByKind: { video: { allowedExtensions: ['webm'] } } },
  });
  assert.equal(result.ok, true);
});

test('decodes percent-encoded query extensions', () => {
  const result = validateModelMediaInputLimits({
    videos: ['https://x/download?url=https%3A%2F%2Fq.example%2Fb.WEBP'],
    inputSlots: { mediaConstraintsByKind: { video: { allowedExtensions: ['webp'] } } },
  });
  assert.equal(result.ok, true);
});

test('skips the extension check for data urls and extensionless urls', () => {
  const dataUrl = validateModelMediaInputLimits({
    images: ['data:image/png;base64,AAAA'],
    inputSlots: { mediaConstraintsByKind: { image: { allowedExtensions: ['jpg'] } } },
  });
  assert.equal(dataUrl.ok, true);
  const dataUrlWithDottedPayload = validateModelMediaInputLimits({
    images: ['data:image/png;base64,AAAA.png'],
    inputSlots: { mediaConstraintsByKind: { image: { allowedExtensions: ['jpg'] } } },
  });
  assert.equal(dataUrlWithDottedPayload.ok, true);
  const extensionless = validateModelMediaInputLimits({
    images: ['https://x/blob'],
    inputSlots: { mediaConstraintsByKind: { image: { allowedExtensions: ['jpg'] } } },
  });
  assert.equal(extensionless.ok, true);
});

test('treats an empty or malformed allow list as no restriction', () => {
  for (const allowedExtensions of [[], '', 'png']) {
    const result = validateModelMediaInputLimits({
      images: ['https://x/a.webp'],
      inputSlots: { mediaConstraintsByKind: { image: { allowedExtensions } } },
    });
    assert.equal(result.ok, true);
  }
});

test('ignores non-object per-kind constraints', () => {
  const result = validateModelMediaInputLimits({
    images: ['https://x/a.webp'],
    inputSlots: { mediaConstraintsByKind: { image: 'nope', video: null } },
  });
  assert.equal(result.ok, true);
});

test('fails max<Kind>Megabytes when the size exceeds the byte limit', () => {
  const result = validateModelMediaInputLimits({
    audios: ['https://x/a.mp3'],
    audioEntries: [{ url: 'https://x/a.mp3', sizeBytes: 2097152 }],
    inputSlots: { mediaConstraintsByKind: { audio: { maxBytes: 1048576 } } },
  });
  assert.deepEqual(result, {
    ok: false,
    code: 'maxAudioMegabytes',
    kind: 'audio',
    max: 1,
    actual: 2,
    url: 'https://x/a.mp3',
  });
});

test('accepts a size exactly at the byte limit and reads size alternatives', () => {
  const exact = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4'],
    videoEntries: [{ url: 'https://x/a.mp4', fileSize: '1048576' }],
    inputSlots: { mediaConstraintsByKind: { video: { maxBytes: 1048576 } } },
  });
  assert.equal(exact.ok, true);
  const disabled = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4'],
    videoEntries: [{ url: 'https://x/a.mp4', sizeBytes: 10485760 }],
    inputSlots: { mediaConstraintsByKind: { video: { maxBytes: 0 } } },
  });
  assert.equal(disabled.ok, true);
});

test('fails maxTotal<Kind>Seconds when the summed duration exceeds the limit', () => {
  const result = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4', 'https://x/b.mp4'],
    videoEntries: [
      { url: 'https://x/a.mp4', duration: 3 },
      { url: 'https://x/b.mp4', duration: 4 },
    ],
    inputSlots: { maxTotalDurationSecondsByKind: { video: 5 } },
  });
  assert.deepEqual(result, { ok: false, code: 'maxTotalVideoSeconds', kind: 'video', max: 5, actual: 7 });
});

test('checks the audio total and never checks images', () => {
  const audio = validateModelMediaInputLimits({
    audios: ['https://x/a.mp3'],
    audioEntries: [{ url: 'https://x/a.mp3', duration: 16 }],
    inputSlots: { maxTotalDurationSecondsByKind: { audio: 15 } },
  });
  assert.deepEqual(audio, { ok: false, code: 'maxTotalAudioSeconds', kind: 'audio', max: 15, actual: 16 });
  const image = validateModelMediaInputLimits({
    images: ['https://x/a.png'],
    imageEntries: [{ url: 'https://x/a.png', duration: 999 }],
    inputSlots: { maxTotalDurationSecondsByKind: { image: 1 } },
  });
  assert.equal(image.ok, true);
});

test('allows a total exactly at the limit and ignores non-positive totals', () => {
  const exact = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4'],
    videoEntries: [{ url: 'https://x/a.mp4', duration: 15 }],
    inputSlots: { maxTotalDurationSecondsByKind: { video: 15 } },
  });
  assert.equal(exact.ok, true);
  const disabled = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4'],
    videoEntries: [{ url: 'https://x/a.mp4', duration: 15 }],
    inputSlots: { maxTotalDurationSecondsByKind: { video: -1 } },
  });
  assert.equal(disabled.ok, true);
});

test('reports a per-entry duration violation before the total', () => {
  const result = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4', 'https://x/b.mp4'],
    videoEntries: [
      { url: 'https://x/a.mp4', duration: 12 },
      { url: 'https://x/b.mp4', duration: 9 },
    ],
    inputSlots: {
      mediaConstraintsByKind: { video: { maxDurationSeconds: 10 } },
      maxTotalDurationSecondsByKind: { video: 5 },
    },
  });
  assert.deepEqual(result, {
    ok: false,
    code: 'maxVideoSeconds',
    kind: 'video',
    max: 10,
    actual: 12,
    url: 'https://x/a.mp4',
  });
});

test('fails maxVideoInputAndOutputSeconds when input plus output exceeds the limit', () => {
  const result = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4'],
    videoEntries: [{ url: 'https://x/a.mp4', duration: 6 }],
    outputDurationSeconds: 5,
    inputSlots: { maxVideoInputAndOutputDurationSeconds: 10 },
  });
  assert.deepEqual(result, {
    ok: false,
    code: 'maxVideoInputAndOutputSeconds',
    kind: 'video',
    max: 10,
    actual: 11,
  });
  assert.equal(Object.isFrozen(result), true);
});

test('skips the combined check when the output duration is not positive', () => {
  for (const outputDurationSeconds of [0, -5, 'abc', null, undefined, {}]) {
    const result = validateModelMediaInputLimits({
      videos: ['https://x/a.mp4'],
      videoEntries: [{ url: 'https://x/a.mp4', duration: 6 }],
      outputDurationSeconds,
      inputSlots: { maxVideoInputAndOutputDurationSeconds: 1 },
    });
    assert.equal(result.ok, true);
  }
});

test('allows a combined duration exactly at the limit and reads string forms', () => {
  const exact = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4'],
    videoEntries: [{ url: 'https://x/a.mp4', duration: 6 }],
    outputDurationSeconds: 4,
    inputSlots: { maxVideoInputAndOutputDurationSeconds: 10 },
  });
  assert.equal(exact.ok, true);
  const strings = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4'],
    videoEntries: [{ url: 'https://x/a.mp4', duration: '6' }],
    outputDurationSeconds: '5',
    inputSlots: { maxVideoInputAndOutputDurationSeconds: '10' },
  });
  assert.deepEqual(strings, {
    ok: false,
    code: 'maxVideoInputAndOutputSeconds',
    kind: 'video',
    max: 10,
    actual: 11,
  });
});

test('ignores a non-positive combined limit and counts only video input', () => {
  const disabled = validateModelMediaInputLimits({
    videos: ['https://x/a.mp4'],
    videoEntries: [{ url: 'https://x/a.mp4', duration: 6 }],
    outputDurationSeconds: 5,
    inputSlots: { maxVideoInputAndOutputDurationSeconds: 0 },
  });
  assert.equal(disabled.ok, true);
  const audioOnly = validateModelMediaInputLimits({
    audios: ['https://x/a.mp3'],
    audioEntries: [{ url: 'https://x/a.mp3', duration: 100 }],
    outputDurationSeconds: 5,
    inputSlots: { maxVideoInputAndOutputDurationSeconds: 10 },
  });
  assert.equal(audioOnly.ok, true);
});

test('tolerates malformed media and slot containers', () => {
  const result = validateModelMediaInputLimits({
    inputSlots: 'nope',
    images: 'nope',
    videos: null,
    audios: 42,
    imageEntries: 'nope',
    videoEntries: null,
    audioEntries: {},
    outputDurationSeconds: {},
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.statsByKind.image, { count: 0, totalDurationSeconds: 0, entries: [] });
  assert.deepEqual(result.statsByKind.video, { count: 0, totalDurationSeconds: 0, entries: [] });
  assert.deepEqual(result.statsByKind.audio, { count: 0, totalDurationSeconds: 0, entries: [] });
});

test('does not mutate the media inputs and accepts frozen ones', () => {
  const videos = ['https://x/a.mp4'];
  const videoEntries = [{ url: 'https://x/a.mp4', duration: 3, sizeBytes: 10 }];
  const inputSlots = { maxByKind: { video: 5 }, mediaConstraintsByKind: { video: { maxBytes: 100 } } };
  const videoSnapshot = JSON.stringify(videos);
  const entriesSnapshot = JSON.stringify(videoEntries);
  const slotsSnapshot = JSON.stringify(inputSlots);
  validateModelMediaInputLimits({ videos, videoEntries, inputSlots });
  assert.equal(JSON.stringify(videos), videoSnapshot);
  assert.equal(JSON.stringify(videoEntries), entriesSnapshot);
  assert.equal(JSON.stringify(inputSlots), slotsSnapshot);
  const frozen = validateModelMediaInputLimits({
    videos: Object.freeze(['https://x/a.mp4']),
    videoEntries: Object.freeze([Object.freeze({ url: 'https://x/a.mp4', duration: 3 })]),
  });
  assert.equal(frozen.ok, true);
});
