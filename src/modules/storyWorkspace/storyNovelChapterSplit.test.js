import test from 'node:test';
import assert from 'node:assert/strict';
import { FALLBACK_CHAPTER_CHARACTERS, splitNovelChapters } from './storyNovelChapterSplit.js';

test('novel split: 第 N 章 headings start a chapter each', () => {
  const text = ['第一章 重生', '正文一', '第二章 任务书', '正文二', '第三章 结局', '正文三'].join('\n');
  const chapters = splitNovelChapters(text);
  assert.equal(chapters.length, 3);
  assert.deepEqual(chapters.map((c) => c.title), ['第一章 重生', '第二章 任务书', '第三章 结局']);
  assert.deepEqual(chapters.map((c) => c.content), ['正文一', '正文二', '正文三']);
  assert.equal(chapters[0].splitFrom, 'heading');
});

test('novel split: Chinese numerals and 回/节 work too', () => {
  const text = ['第十二回 风波', '甲', '第 3 节 转折', '乙'].join('\n');
  const chapters = splitNovelChapters(text);
  assert.equal(chapters.length, 2);
  assert.deepEqual(chapters.map((c) => c.title), ['第十二回 风波', '第 3 节 转折']);
});

test('novel split: 序章 and 尾声 are recognised', () => {
  const text = ['序章', '开场', '第一章 开始', '正文', '尾声', '收尾'].join('\n');
  const chapters = splitNovelChapters(text);
  assert.deepEqual(chapters.map((c) => c.title), ['序章', '第一章 开始', '尾声']);
});

test('novel split: Latin Chapter headings are recognised', () => {
  const text = ['Chapter 1 The Awakening', 'alpha', 'Chapter 2 The Fall', 'beta'].join('\n');
  const chapters = splitNovelChapters(text);
  assert.equal(chapters.length, 2);
});

test('novel split: text before the first heading becomes its own chapter', () => {
  const text = ['书名：重生', '作者：某人', '第一章 重生', '正文'].join('\n');
  const chapters = splitNovelChapters(text);
  assert.equal(chapters.length, 2);
  assert.equal(chapters[0].title, '正文开头');
  assert.ok(chapters[0].content.includes('作者'));
});

test('novel split: a heading with no body is skipped', () => {
  const text = ['第一章 空章', '第二章 有内容', '正文'].join('\n');
  const chapters = splitNovelChapters(text);
  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].title, '第二章 有内容');
});

test('novel split: text without headings falls back to paragraph groups', () => {
  const paragraph = '段'.repeat(500);
  const text = Array.from({ length: 20 }, () => paragraph).join('\n\n');
  const chapters = splitNovelChapters(text);
  assert.ok(chapters.length > 1, 'a long heading-less text must still be split');
  assert.ok(chapters.every((c) => c.splitFrom === 'fallback'));
  assert.ok(chapters.every((c) => c.characters <= FALLBACK_CHAPTER_CHARACTERS + 500));
});

test('novel split: short heading-less text stays one chapter', () => {
  const chapters = splitNovelChapters('只有一小段文字。');
  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].splitFrom, 'fallback');
});

test('novel split: empty input yields nothing', () => {
  assert.deepEqual(splitNovelChapters(''), []);
  assert.deepEqual(splitNovelChapters('   \n  '), []);
  assert.deepEqual(splitNovelChapters(null), []);
});

test('novel split: no text is lost across chapters', () => {
  const text = ['第一章 甲', 'AAA', '第二章 乙', 'BBB', '第三章 丙', 'CCC'].join('\n');
  const joined = splitNovelChapters(text).map((c) => c.content).join('\n');
  for (const marker of ['AAA', 'BBB', 'CCC']) assert.ok(joined.includes(marker), marker);
});

test('novel split: characters counts the trimmed body', () => {
  const chapters = splitNovelChapters(['第一章 甲', '  正文  '].join('\n'));
  assert.equal(chapters[0].characters, chapters[0].content.length);
  assert.equal(chapters[0].content, '正文');
});

test('novel split: body text starting with 第N章 is not mistaken for a heading', () => {
  const body = '第1章正文。刑台的绳子刮到脖子，有点痒。王建国忍住没挠。'.repeat(20);
  const text = ['第1章 刑台婚契', body, '第2章 午夜任务书', body].join('\n');
  const chapters = splitNovelChapters(text);
  assert.equal(chapters.length, 2, 'a long body line must not be read as a heading');
  assert.equal(chapters[0].content, body);
});

test('novel split: a heading longer than the limit is treated as body text', () => {
  const long = '第1章 ' + '很长的标题'.repeat(20);
  const text = ['第一章 甲', '正文', long].join('\n');
  const chapters = splitNovelChapters(text);
  assert.equal(chapters.length, 1);
  assert.ok(chapters[0].content.includes('很长的标题'));
});

test('novel split: the heading length limit is configurable', () => {
  const text = ['第一章 甲', '正文'].join('\n');
  // With every heading rejected the splitter falls back to paragraph grouping instead.
  const chapters = splitNovelChapters(text, { headingMaxCharacters: 2 });
  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].splitFrom, 'fallback');
});
