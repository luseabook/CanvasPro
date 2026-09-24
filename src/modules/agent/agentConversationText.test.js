import assert from 'node:assert/strict';
import test from 'node:test';

import { AGENT_MESSAGE_CONTENT_LIMIT, compactAgentConversationText } from './agentConversationText.js';

const MARKER = '\n[… middle omitted …]\n';

test('会话文本：内容上限常量取自 0x7d00', () => {
  assert.equal(AGENT_MESSAGE_CONTENT_LIMIT, 32000);
});

test('会话文本：未超上限的文本原样返回', () => {
  assert.equal(compactAgentConversationText('abc', 10), 'abc');
  assert.equal(compactAgentConversationText('abcde', 5), 'abcde');
});

test('会话文本：假值入参归一为空串', () => {
  for (const value of [null, undefined, '', 0]) assert.equal(compactAgentConversationText(value, 20), '');
});

test('会话文本：超长文本按 40% 头部 + 省略标记 + 尾部裁剪', () => {
  const text = `${'a'.repeat(50)}${'b'.repeat(50)}`;
  const budget = 42 - MARKER.length;
  const head = Math.floor(budget * 0.4);
  const tail = budget - head;
  const result = compactAgentConversationText(text, 42);
  assert.equal(head, 8);
  assert.equal(tail, 12);
  assert.equal(result, `${'a'.repeat(head)}${MARKER}${'b'.repeat(tail)}`);
  assert.equal(result.length, 42);
});

test('会话文本：结果长度永不超过上限', () => {
  const text = 'x'.repeat(500);
  for (const limit of [23, 30, 64, 128, 333]) {
    const result = compactAgentConversationText(text, limit);
    assert.ok(result.length <= limit, `limit=${limit} length=${result.length}`);
  }
});

test('会话文本：上限小于标记长度时退化为标记前缀', () => {
  assert.equal(compactAgentConversationText('abcdefghij', 5), MARKER.slice(0, 5));
  assert.equal(compactAgentConversationText('abcdefghij', 5).length, 5);
});

test('会话文本：尾部预算为 0 时不再拼接尾部', () => {
  const text = 'abcdefghij'.repeat(10);
  const result = compactAgentConversationText(text, MARKER.length);
  assert.equal(result, MARKER);
  assert.ok(!result.includes('a'.repeat(3)));
});
