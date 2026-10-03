import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAPTER_DONE,
  CHAPTER_PENDING,
  CHARS_PER_EPISODE_MAX,
  CHARS_PER_EPISODE_MIN,
  DEFAULT_BATCH_CHARACTER_BUDGET,
  applyAdaptationResult,
  defaultChapterSelection,
  describeEpisodeCountFit,
  normalizeChapterRecords,
  suggestEpisodeCount,
  summarizeChapterProgress,
} from './storyChapterSelection.js';

const book = (count, charsPerChapter = 8000) =>
  normalizeChapterRecords(
    Array.from({ length: count }, (_, i) => ({
      title: '第 ' + (i + 1) + ' 章',
      content: '字'.repeat(charsPerChapter),
    })),
  );

test('chapters: records get a stable id, a size and a pending status', () => {
  const list = normalizeChapterRecords([{ title: '第 1 章', content: '正文正文' }]);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'chapter-1');
  assert.equal(list[0].characters, 4);
  assert.equal(list[0].adaptation, CHAPTER_PENDING);
});

test('chapters: an existing done status survives normalisation', () => {
  const list = normalizeChapterRecords([{ id: 'ch-1', title: '一', content: 'x', adaptation: CHAPTER_DONE }]);
  assert.equal(list[0].adaptation, CHAPTER_DONE);
});

test('chapters: duplicate ids are made unique', () => {
  const list = normalizeChapterRecords([
    { id: 'same', title: 'a', content: 'x' },
    { id: 'same', title: 'b', content: 'y' },
  ]);
  assert.notEqual(list[0].id, list[1].id);
});

test('chapters: empty content is dropped', () => {
  const list = normalizeChapterRecords([{ title: '空', content: '   ' }]);
  assert.equal(list.length, 0);
});

test('chapters: progress summarises done and pending work', () => {
  const list = applyAdaptationResult(book(10), ['chapter-1', 'chapter-2']);
  const progress = summarizeChapterProgress(list);
  assert.equal(progress.total, 10);
  assert.equal(progress.doneCount, 2);
  assert.equal(progress.pendingCount, 8);
  assert.equal(progress.doneCharacters, 16000);
  assert.equal(progress.nextPendingId, 'chapter-3');
  assert.equal(progress.complete, false);
});

test('chapters: a fully adapted book reports complete', () => {
  const ids = book(3).map((c) => c.id);
  const progress = summarizeChapterProgress(applyAdaptationResult(book(3), ids));
  assert.equal(progress.complete, true);
  assert.equal(progress.nextPendingId, '');
});

test('chapters: the default selection starts at the first pending chapter', () => {
  const list = applyAdaptationResult(book(100), ['chapter-1', 'chapter-2', 'chapter-3']);
  const selection = defaultChapterSelection(list);
  assert.equal(selection.chapterIds[0], 'chapter-4');
});

test('chapters: the default selection stops at the batch budget', () => {
  const list = book(100, 8000);
  const selection = defaultChapterSelection(list, { budgetCharacters: 40000 });
  assert.equal(selection.chapterIds.length, 5);
  assert.ok(selection.characters <= 40000);
});

test('chapters: an oversized first chapter is still selected', () => {
  const list = book(3, 500000);
  const selection = defaultChapterSelection(list, { budgetCharacters: 1000 });
  assert.equal(selection.chapterIds.length, 1, 'the selection must never be empty');
});

test('chapters: a fully adapted book selects nothing', () => {
  const list = book(4);
  const selection = defaultChapterSelection(applyAdaptationResult(list, list.map((c) => c.id)));
  assert.deepEqual(selection.chapterIds, []);
  assert.equal(selection.characters, 0);
});

test('chapters: episode counts scale with the selected text', () => {
  assert.deepEqual(suggestEpisodeCount(0), { min: 1, recommended: 1, max: 1 });
  const small = suggestEpisodeCount(30000);
  assert.equal(small.min, 3);
  assert.equal(small.max, 6);
  assert.ok(small.recommended >= small.min && small.recommended <= small.max);
  const large = suggestEpisodeCount(300000);
  assert.equal(large.min, 30);
  assert.equal(large.max, 60);
});

test('chapters: too few episodes for the text is flagged as compressed', () => {
  const fit = describeEpisodeCountFit({ characters: 300000, episodeCount: 3 });
  assert.equal(fit.level, 'compressed');
  assert.equal(fit.charsPerEpisode, 100000);
  assert.ok(fit.message.includes('细节会大量丢失'));
});

test('chapters: too many episodes for the text is flagged as sparse', () => {
  const fit = describeEpisodeCountFit({ characters: 20000, episodeCount: 20 });
  assert.equal(fit.level, 'sparse');
  assert.equal(fit.charsPerEpisode, 1000);
});

test('chapters: a sensible episode count passes', () => {
  const fit = describeEpisodeCountFit({ characters: 75000, episodeCount: 10 });
  assert.equal(fit.level, 'ok');
  assert.equal(fit.message, '');
  assert.ok(fit.charsPerEpisode >= CHARS_PER_EPISODE_MIN);
  assert.ok(fit.charsPerEpisode <= CHARS_PER_EPISODE_MAX);
});

test('chapters: zero or missing input never produces a warning', () => {
  assert.equal(describeEpisodeCountFit({}).level, 'ok');
  assert.equal(describeEpisodeCountFit({ characters: 1000, episodeCount: 0 }).level, 'ok');
});

test('chapters: applying a batch does not mutate the input list', () => {
  const list = book(3);
  const next = applyAdaptationResult(list, ['chapter-1'], { batchId: 'b1', at: 123 });
  assert.equal(list[0].adaptation, CHAPTER_PENDING, 'original must stay untouched');
  assert.equal(next[0].adaptation, CHAPTER_DONE);
  assert.equal(next[0].batchId, 'b1');
  assert.equal(next[0].adaptedAt, 123);
  assert.equal(next[1].adaptation, CHAPTER_PENDING);
});

test('chapters: a batch only touches the chapters it was given', () => {
  const list = applyAdaptationResult(book(5), ['chapter-2']);
  assert.equal(summarizeChapterProgress(list).doneCount, 1);
  assert.equal(list[1].adaptation, CHAPTER_DONE);
});

test('chapters: the default batch budget matches the upload limit', () => {
  assert.equal(DEFAULT_BATCH_CHARACTER_BUDGET, 100000);
});
