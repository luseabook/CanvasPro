import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DIGEST_TOKENS_PER_CHUNK,
  DEFAULT_MAX_SOURCE_CHUNKS,
  normalizeStorySourceChapters,
  planStorySourceChunks,
} from './storySourceChunking.js';

// Use an explicit window so the tests do not depend on the model tables.
const SMALL_WINDOW = 8192; // 8192 tokens

function budgetChars(contextTokens = SMALL_WINDOW, extra = {}) {
  return planStorySourceChunks({
    chapters: [{ title: 'c', content: 'x' }],
    contextTokens: contextTokens,
    ...extra,
  }).budget.usableCharacters;
}

const chapter = (n, length = 1000) => ({
  title: '第 ' + n + ' 章',
  content: ('章节' + n + '内容。').repeat(Math.ceil(length / 8)).slice(0, length),
});

test('chunks: an empty source produces no chunks', () => {
  const plan = planStorySourceChunks({ chapters: [], contextTokens: SMALL_WINDOW });
  assert.equal(plan.chunks.length, 0);
  assert.equal(plan.reason, 'empty-source');
  assert.equal(plan.totalCharacters, 0);
});

test('chunks: chapters with no text are dropped', () => {
  const plan = planStorySourceChunks({
    chapters: [{ title: '空章', content: '   ' }, { title: '有内容', content: '正文' }],
    contextTokens: SMALL_WINDOW,
  });
  assert.equal(plan.chunks.length, 1);
  assert.deepEqual(plan.chunks[0].labels, ['有内容']);
});

test('chunks: small chapters are merged into one chunk', () => {
  const plan = planStorySourceChunks({
    chapters: [chapter(1, 300), chapter(2, 300), chapter(3, 300)],
    contextTokens: SMALL_WINDOW,
  });
  assert.equal(plan.chunks.length, 1);
  assert.deepEqual(plan.chunks[0].labels, ['第 1 章', '第 2 章', '第 3 章']);
});

test('chunks: a chunk never exceeds its usable budget', () => {
  const limit = budgetChars();
  const plan = planStorySourceChunks({
    chapters: Array.from({ length: 12 }, (_, i) => chapter(i + 1, 900)),
    contextTokens: SMALL_WINDOW,
  });
  assert.ok(plan.chunks.length > 1, 'this input must split');
  for (const chunk of plan.chunks)
    assert.ok(chunk.characters <= limit, 'chunk ' + chunk.index + ' is ' + chunk.characters + ' > ' + limit);
});

test('chunks: an oversized chapter is split at paragraph boundaries', () => {
  const limit = budgetChars();
  const paragraph = '段'.repeat(1500);
  const plan = planStorySourceChunks({
    chapters: [{ title: '超长章', content: Array.from({ length: 10 }, () => paragraph).join('\n\n') }],
    contextTokens: SMALL_WINDOW,
  });
  assert.ok(plan.chunks.length > 1, 'this chapter must split, got ' + plan.chunks.length);
  assert.ok(plan.chunks.every((c) => c.splitNote), 'every part of a split chapter is marked');
  assert.ok(plan.chunks.every((c) => c.characters <= limit));
  // the chapter's text survives the split
  const joined = plan.chunks.map((c) => c.text).join('\n\n');
  assert.ok(joined.includes(paragraph), 'split must not lose paragraph text');
});

test('chunks: a paragraph larger than the budget is hard split', () => {
  const limit = budgetChars();
  const plan = planStorySourceChunks({
    chapters: [{ title: '单段超长', content: '字'.repeat(limit * 3 + 100) }],
    contextTokens: SMALL_WINDOW,
  });
  assert.ok(plan.chunks.length >= 3);
  assert.ok(plan.chunks.every((c) => c.characters <= limit));
});

// 40 short chapters: several fit per chunk, so merging and carried growth are exercised.
const shortNovel = () => Array.from({ length: 40 }, (_, i) => chapter(i + 1, 500));

test('chunks: the carried context stops growing at its cap', () => {
  const plan = planStorySourceChunks({
    chapters: shortNovel(),
    contextTokens: SMALL_WINDOW,
    digestTokensPerChunk: 5000,
    carriedTokenCap: 2000,
  });
  const carried = plan.chunks.map((c) => c.carriedTokens);
  assert.equal(carried[0], 0);
  assert.equal(Math.max(...carried), 2000, 'carried must saturate at the cap: ' + carried.join(','));
  assert.equal(plan.reason, 'ok');
  assert.equal(plan.coveredCharacters, plan.totalCharacters);
});

test('chunks: the default cap keeps chunk sizes stable on a small window', () => {
  const plan = planStorySourceChunks({ chapters: shortNovel(), contextTokens: SMALL_WINDOW });
  assert.equal(plan.reason, 'ok', 'a small window must still cover the whole source');
  assert.equal(plan.coveredCharacters, plan.totalCharacters);
  const sizes = plan.chunks.map((c) => c.characters);
  // Without the cap the tail chunks collapsed to a few hundred characters.
  assert.ok(Math.min(...sizes) > Math.max(...sizes) * 0.5, 'chunk sizes must stay comparable: ' + sizes.join(','));
});

test('chunks: an absurdly large digest estimate is clamped, not fatal', () => {
  const plan = planStorySourceChunks({
    chapters: shortNovel(),
    contextTokens: SMALL_WINDOW,
    digestTokensPerChunk: 100000,
  });
  // The cap is what stops the carried context from eating the whole window.
  assert.equal(plan.reason, 'ok');
  assert.equal(plan.coveredCharacters, plan.totalCharacters);
  assert.ok(Math.max(...plan.chunks.map((c) => c.carriedTokens)) <= Math.floor(SMALL_WINDOW * 0.15));
});

test('chunks: carried digests shrink later chunks', () => {
  const plan = planStorySourceChunks({
    chapters: shortNovel(),
    contextTokens: SMALL_WINDOW,
    digestTokensPerChunk: 1000,
    carriedTokenCap: 100000,
  });
  assert.ok(plan.chunks.length >= 3, 'expected several chunks, got ' + plan.chunks.length);
  const first = plan.chunks[0].characters;
  const last = plan.chunks[plan.chunks.length - 1].characters;
  assert.ok(last <= first, 'later chunks must not be larger: first=' + first + ' last=' + last);
  assert.equal(plan.chunks[0].carriedTokens, 0);
  assert.equal(plan.chunks[1].carriedTokens, 1000);
  assert.equal(plan.chunks[2].carriedTokens, 2000);
});

test('chunks: a window smaller than its own overhead stops the plan', () => {
  const plan = planStorySourceChunks({
    chapters: shortNovel(),
    contextTokens: SMALL_WINDOW,
    templateTokens: SMALL_WINDOW * 2, // the prompt alone does not fit
  });
  assert.equal(plan.reason, 'budget-exhausted');
  assert.equal(plan.overflow, true);
  assert.equal(plan.chunks.length, 0);
});

test('chunks: overflow past the invocation ceiling is reported', () => {
  const plan = planStorySourceChunks({
    chapters: Array.from({ length: 40 }, (_, i) => chapter(i + 1, 2000)),
    contextTokens: SMALL_WINDOW,
    maxChunks: 2,
  });
  assert.ok(plan.chunks.length > 2);
  assert.equal(plan.overflow, true);
  assert.equal(plan.reason, 'beyond-max-chunks');
});

test('chunks: exceeding only the ceiling reports beyond-max-chunks', () => {
  const plan = planStorySourceChunks({
    chapters: shortNovel(),
    contextTokens: SMALL_WINDOW,
    digestTokensPerChunk: 0,
    maxChunks: 2,
  });
  assert.ok(plan.chunks.length > 2);
  assert.equal(plan.overflow, true);
  assert.equal(plan.reason, 'beyond-max-chunks');
  assert.equal(plan.coveredCharacters, plan.totalCharacters);
});

test('chunks: a plan within the ceiling is not flagged', () => {
  const plan = planStorySourceChunks({
    chapters: [chapter(1, 100), chapter(2, 100)],
    contextTokens: 0x40000,
  });
  assert.equal(plan.overflow, false);
  assert.equal(plan.reason, 'ok');
  assert.ok(plan.chunks.length <= DEFAULT_MAX_SOURCE_CHUNKS);
});

test('chunks: no source text is dropped', () => {
  const paragraphs = Array.from({ length: 30 }, (_, i) => '第' + i + '段内容' + '甲'.repeat(200));
  const plan = planStorySourceChunks({
    chapters: paragraphs.map((text, i) => ({ title: '第 ' + (i + 1) + ' 章', content: text })),
    contextTokens: SMALL_WINDOW,
  });
  const joined = plan.chunks.map((c) => c.text).join('\n\n');
  for (const text of paragraphs) assert.ok(joined.includes(text), 'missing paragraph: ' + text.slice(0, 12));
});

test('chunks: default digest estimate is a positive integer', () => {
  assert.ok(Number.isInteger(DEFAULT_DIGEST_TOKENS_PER_CHUNK));
  assert.ok(DEFAULT_DIGEST_TOKENS_PER_CHUNK > 0);
  assert.ok(DEFAULT_MAX_SOURCE_CHUNKS > 0);
});

test('chunks: chapter normalisation fills in a missing title', () => {
  const list = normalizeStorySourceChapters([{ content: '正文' }]);
  assert.equal(list.length, 1);
  assert.equal(list[0].title, '第 1 章');
  assert.equal(list[0].text, '正文');
});
