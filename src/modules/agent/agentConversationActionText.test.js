import test from 'node:test';
import assert from 'node:assert/strict';
import { agentConversationActionText } from './agentConversationActionText.js';

const KEYS = ['retry', 'edit', 'cancel', 'save', 'previous', 'next', 'version', 'limit'];

test('会话动作文案：8 个 key 在中英文下都有独立词条', () => {
  for (const key of KEYS) {
    const zh = agentConversationActionText(key, 'zh-CN');
    const en = agentConversationActionText(key, 'en-US');
    assert.notEqual(zh, key, key);
    assert.notEqual(en, key, key);
    assert.notEqual(zh, en, key);
  }
});

test('会话动作文案：核心词条内容锚定', () => {
  assert.equal(agentConversationActionText('retry', 'zh-CN'), '重新回答');
  assert.equal(agentConversationActionText('save', 'zh-CN'), '保存并重新回答');
  assert.equal(agentConversationActionText('version', 'zh-CN'), '回答版本');
  assert.equal(agentConversationActionText('limit', 'zh-CN'), '回答版本已达上限，请发送新消息继续');
  assert.equal(agentConversationActionText('retry', 'en-US'), 'Regenerate');
  assert.equal(agentConversationActionText('save', 'en-US'), 'Save and regenerate');
  assert.equal(
    agentConversationActionText('limit', 'en-US'),
    'Answer version limit reached. Send a new message to continue.',
  );
});

test('会话动作文案：locale 判定只看前缀 en，且大小写敏感（EN 落中文，端口现状）', () => {
  for (const en of ['en-US', 'en', 'en-GB', 'english']) {
    assert.equal(agentConversationActionText('retry', en), 'Regenerate', en);
  }
  for (const zh of ['EN', 'En-US', 'zh-CN', 'de-DE', 'fr', '']) {
    assert.equal(agentConversationActionText('retry', zh), '重新回答', JSON.stringify(zh));
  }
});

test('会话动作文案：null / undefined / 非字符串 locale 一律回落中文', () => {
  for (const bad of [null, undefined, 0, NaN, {}, [], true]) {
    assert.equal(agentConversationActionText('retry', bad), '重新回答', String(bad));
  }
});

test('会话动作文案：未收录 key 原样返回该 key', () => {
  for (const key of ['nokey', '', 'retry_', 'RETRY', 'prompt']) {
    assert.equal(agentConversationActionText(key, 'zh-CN'), key);
    assert.equal(agentConversationActionText(key, 'en-US'), key);
  }
});

test('会话动作文案：省略 locale 时走当前界面语言，纯 node 下为中文默认值', () => {
  assert.equal(agentConversationActionText('retry'), '重新回答');
});

test('会话动作文案：文案表未导出，模块只有单一函数导出', async () => {
  const mod = await import('./agentConversationActionText.js');
  assert.deepEqual(Object.keys(mod), ['agentConversationActionText']);
});
