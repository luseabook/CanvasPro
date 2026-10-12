// Offline tests for the pure prompt/parse helpers in storyGenerationApi.js. Added as
// the safety net required before the file is split.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_GENERATION_SCHEMA_VERSION,
  parseStoryGenerationResult,
  splitStorySourceText,
} from './storyGenerationApi.js';

function validStory(overrides = {}) {
  return JSON.stringify({
    title: '  标题  ',
    storyType: '悬疑',
    storySummary: '梗概',
    storyBackground: '背景',
    storySetting: '设定',
    logline: '一句话',
    chapters: [{ title: '第一章', content: '正文一' }],
    ...overrides,
  });
}

test('splitStorySourceText handles empty, short and long inputs', () => {
  assert.deepEqual(splitStorySourceText(''), []);
  assert.deepEqual(splitStorySourceText('   '), []);
  assert.deepEqual(splitStorySourceText('hello'), ['hello']);

  const long = 'a'.repeat(2500);
  const chunks = splitStorySourceText(long, 2000);
  assert.equal(chunks.length, 2);
  assert.deepEqual(
    chunks.map((chunk) => chunk.length),
    [2000, 500]
  );
});

test('splitStorySourceText prefers newline boundaries and never exceeds the size', () => {
  const text = 'x'.repeat(1500) + '\n' + 'y'.repeat(1500);
  const chunks = splitStorySourceText(text, 2000);
  for (const chunk of chunks) assert.ok(chunk.length <= 2000);
  assert.equal(chunks[0], 'x'.repeat(1500));
});

test('splitStorySourceText enforces a 2000-character floor on the chunk size', () => {
  const chunks = splitStorySourceText('a'.repeat(3000), 10);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length, 2000);
});

test('parseStoryGenerationResult normalizes a valid payload', () => {
  const result = parseStoryGenerationResult(validStory());
  assert.equal(result.schemaVersion, STORY_GENERATION_SCHEMA_VERSION);
  assert.equal(result.title, '标题');
  assert.equal(result.chapters.length, 1);
  assert.deepEqual(result.chapters[0], { title: '第一章', content: '正文一' });
});

test('parseStoryGenerationResult accepts a plain string or {text}', () => {
  assert.equal(parseStoryGenerationResult(validStory()).storyType, '悬疑');
  assert.equal(parseStoryGenerationResult({ text: validStory() }).logline, '一句话');
});

test('parseStoryGenerationResult rejects payloads missing required fields', () => {
  assert.throws(() => parseStoryGenerationResult(validStory({ title: '' })), /缺少故事标题/);
  assert.throws(() => parseStoryGenerationResult(validStory({ logline: '' })), /缺少一句话故事/);
  assert.throws(() => parseStoryGenerationResult('not json'), /未返回有效的 JSON/);
});

test('parseStoryGenerationResult enforces chapter count and size bounds', () => {
  assert.throws(
    () => parseStoryGenerationResult(validStory(), { minChapters: 2 }),
    /有效章节不足/
  );
  assert.throws(
    () =>
      parseStoryGenerationResult(validStory({ chapters: [{ title: 'a', content: 'x'.repeat(50) }] }), {
        maxChapterCharacters: 10,
      }),
    /超过/
  );
  assert.throws(
    () =>
      parseStoryGenerationResult(validStory({ chapters: [{ title: 'a', content: 'x' }] }), {
        minChapterCharacters: 5,
      }),
    /正文不足/
  );
});
