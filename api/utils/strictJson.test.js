import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCompleteJsonArrayItems, extractJsonStringProperty, parseStrictJson } from './strictJson.js';

test('parseStrictJson returns plain objects unchanged (same reference)', () => {
  const input = { a: 1 };
  assert.equal(parseStrictJson(input), input);
});

test('parseStrictJson parses plain JSON text, trimming whitespace and BOM', () => {
  assert.deepEqual(parseStrictJson('{"a":1}'), { a: 1 });
  assert.deepEqual(parseStrictJson('\uFEFF  {"a":1}  '), { a: 1 });
  assert.deepEqual(parseStrictJson('[1,2]'), [1, 2]);
});

test('parseStrictJson drops a trailing semicolon', () => {
  assert.deepEqual(parseStrictJson('{"a":1};'), { a: 1 });
});

test('parseStrictJson extracts JSON from fenced code blocks', () => {
  const text = 'Here you go:\n```json\n{"ok":true}\n```\nthanks';
  assert.deepEqual(parseStrictJson(text), { ok: true });
});

test('parseStrictJson extracts a balanced container embedded in prose', () => {
  assert.deepEqual(parseStrictJson('prefix {"x":[1,2]} suffix'), { x: [1, 2] });
});

test('parseStrictJson balancing ignores brackets and escaped quotes inside strings', () => {
  assert.deepEqual(parseStrictJson('text {"s":"a}b"} end'), { s: 'a}b' });
  assert.deepEqual(parseStrictJson('note: {"s":"a\\"}"} tail'), { s: 'a"}' });
});

test('parseStrictJson throws the fallback message for empty or non-text input', () => {
  assert.throws(() => parseStrictJson(''), { message: 'Agent 未返回结果。' });
  assert.throws(() => parseStrictJson('   '), { message: 'Agent 未返回结果。' });
  assert.throws(() => parseStrictJson(null), { message: 'Agent 未返回结果。' });
  assert.throws(() => parseStrictJson([1]), { message: 'Agent 未返回结果。' });
  assert.throws(() => parseStrictJson('', '自定义空结果'), { message: '自定义空结果' });
});

test('parseStrictJson throws AGENT_INVALID_JSON with cause and bounded preview', () => {
  const long = 'x'.repeat(1000);
  let caught = null;
  try {
    parseStrictJson(long);
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof Error);
  assert.equal(caught.message, 'Agent 未返回有效的 JSON。');
  assert.equal(caught.code, 'AGENT_INVALID_JSON');
  assert.equal(typeof caught.parseCause, 'string');
  assert.ok(caught.parseCause.length > 0);
  assert.equal(caught.responsePreview, 'x'.repeat(800));
});

test('extractCompleteJsonArrayItems returns only complete items of a truncated stream', () => {
  const partial = '{"items":[{"a":1},{"a":2},{"a":';
  assert.deepEqual(extractCompleteJsonArrayItems(partial, 'items'), [{ a: 1 }, { a: 2 }]);
});

test('extractCompleteJsonArrayItems handles complete arrays and nested arrays', () => {
  assert.deepEqual(extractCompleteJsonArrayItems('{"k":[{"a":1}], "z":[{"b":2}]}', 'k'), [{ a: 1 }]);
  assert.deepEqual(extractCompleteJsonArrayItems('{"k":[[1],[2]]}', 'k'), [[1], [2]]);
});

test('extractCompleteJsonArrayItems stops at non-container items and missing keys', () => {
  assert.deepEqual(extractCompleteJsonArrayItems('{"k":[1,2]}', 'k'), []);
  assert.deepEqual(extractCompleteJsonArrayItems('{"k":[{"a":1}]}', 'missing'), []);
  assert.deepEqual(extractCompleteJsonArrayItems('{"k":"no array"}', 'k'), []);
  assert.deepEqual(extractCompleteJsonArrayItems('', 'k'), []);
  assert.deepEqual(extractCompleteJsonArrayItems('{"k":[]}', ''), []);
});

test('extractJsonStringProperty decodes string values including escapes', () => {
  assert.equal(extractJsonStringProperty('{"title":"Hello \\"W\\"","x":1', 'title'), 'Hello "W"');
  assert.equal(extractJsonStringProperty('{"t":"\\u4e2d"}', 't'), '中');
  assert.equal(extractJsonStringProperty('{ "t" :  "spaced" }', 't'), 'spaced');
});

test('extractJsonStringProperty escapes regex metacharacters in the key', () => {
  assert.equal(extractJsonStringProperty('{"axb":"no","a.b":"v"}', 'a.b'), 'v');
  assert.equal(extractJsonStringProperty('{"axb":"no"}', 'a.b'), '');
});

test('extractJsonStringProperty returns empty string for missing or non-string values', () => {
  assert.equal(extractJsonStringProperty('{"n":1}', 'n'), '');
  assert.equal(extractJsonStringProperty('{"a":"b"}', 'c'), '');
  assert.equal(extractJsonStringProperty('', 'a'), '');
  assert.equal(extractJsonStringProperty('{"a":"b"}', ''), '');
});
