import assert from 'node:assert/strict';
import test from 'node:test';

import { getAgentStreamingProse } from './agentStreamingProse.js';

const FENCE = '```agent-choice';

test('流式正文：无选项围栏时整段返回', () => {
  assert.equal(getAgentStreamingProse('abc\ndef'), 'abc\ndef');
  assert.equal(getAgentStreamingProse(''), '');
  assert.equal(getAgentStreamingProse(null), '');
});

test('流式正文：完整围栏出现后截断并去掉尾部空白', () => {
  assert.equal(getAgentStreamingProse(`abc\n\n${FENCE}\n1. 甲`), 'abc');
  assert.equal(getAgentStreamingProse(`${FENCE}\n1. 甲`), '');
});

test('流式正文：围栏必须位于行首且后随空白或行尾', () => {
  assert.equal(getAgentStreamingProse(`abc\nsee ${FENCE}x`), `abc\nsee ${FENCE}x`);
  assert.equal(getAgentStreamingProse(`abc ${FENCE}x`), `abc ${FENCE}x`);
});

test('流式正文：以换行结尾时末行为空前缀，整段按 trimEnd 收口', () => {
  assert.equal(getAgentStreamingProse('abc\n'), 'abc');
  assert.equal(getAgentStreamingProse(`abc ${FENCE}\n`), `abc ${FENCE}`);
});

test('流式正文：末行是尚未收完的围栏前缀时一并隐藏', () => {
  assert.equal(getAgentStreamingProse(`abc\n\`\`\`age`), 'abc');
  assert.equal(getAgentStreamingProse('```age'), '');
  assert.equal(getAgentStreamingProse(`abc\n${FENCE}`), 'abc');
});

test('流式正文：只隐藏最后一个未收完行，前文围栏外内容保留', () => {
  const text = `第一段\n${FENCE}\n1. 甲\n2. 乙`;
  assert.equal(getAgentStreamingProse(text), '第一段');
});

test('流式正文：末行前缀超出围栏长度时不再隐藏', () => {
  const text = `abc\n${FENCE}XYZ`;
  assert.equal(getAgentStreamingProse(text), text);
});
