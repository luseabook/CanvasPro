import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAgentConversationCanvasTransfer } from './agentConversationCanvasTransfer.js';

const HISTORY = [
  { role: 'user', status: 'chat', content: '帮我写文案' },
  { role: 'assistant', status: 'chat', content: '第1版：甲案', itemId: 'i1', turnId: 't1' },
  { role: 'assistant', status: 'thinking', content: '第2版：思考中', itemId: 'bad', turnId: 'bad' },
  { role: 'assistant', status: 'chat', content: '第2版：乙案\n第三版：丙案', itemId: 'i2', turnId: 't2' },
];

test('画布搬运：无搬运意图时返回 null', () => {
  assert.equal(resolveAgentConversationCanvasTransfer({ message: '你好', history: HISTORY }), null);
  assert.equal(resolveAgentConversationCanvasTransfer({ message: '', history: HISTORY }), null);
  assert.equal(resolveAgentConversationCanvasTransfer({}), null);
});

test('画布搬运：写入选中节点提示词走 selected_prompt 目标', () => {
  const result = resolveAgentConversationCanvasTransfer({
    message: '把这段文案写入选中的节点的提示词',
    history: HISTORY,
  });
  assert.equal(result.matched, true);
  assert.equal(result.target, 'selected_prompt');
  assert.equal(result.mode, 'replace');
  assert.equal(result.content, '第2版：乙案\n第三版：丙案');
  assert.equal(result.requestedVersion, 0);
  assert.deepEqual([result.sourceItemId, result.sourceTurnId], ['i2', 't2']);
});

test('画布搬运：追加语义切到 append 模式', () => {
  const result = resolveAgentConversationCanvasTransfer({
    message: '把这个补充到当前节点的提示词',
    history: HISTORY,
  });
  assert.equal(result.target, 'selected_prompt');
  assert.equal(result.mode, 'append');
});

test('画布搬运：文本节点语义返回 ai-text 节点类型', () => {
  const result = resolveAgentConversationCanvasTransfer({
    message: '把这段保存到画布文本节点',
    history: HISTORY,
  });
  assert.equal(result.matched, true);
  assert.equal(result.nodeType, 'ai-text');
  assert.equal(result.target, undefined);
  assert.equal(result.content, '第2版：乙案\n第三版：丙案');
});

test('画布搬运：第N版数字同时支持阿拉伯与中文', () => {
  const cn = resolveAgentConversationCanvasTransfer({
    message: '把第三版填入该节点的提示词',
    history: HISTORY,
  });
  assert.equal(cn.requestedVersion, 3);
  assert.equal(cn.content, '第三版：丙案');
  const arabic = resolveAgentConversationCanvasTransfer({
    message: '把第1版写入选中节点的提示词',
    history: HISTORY,
  });
  assert.equal(arabic.requestedVersion, 1);
  assert.equal(arabic.content, '第1版：甲案');
  assert.deepEqual([arabic.sourceItemId, arabic.sourceTurnId], ['i1', 't1']);
});

test('画布搬运：指名版本缺失时回退到最后一条候选', () => {
  const result = resolveAgentConversationCanvasTransfer({
    message: '把第九版填入该节点的提示词',
    history: HISTORY,
  });
  assert.equal(result.requestedVersion, 9);
  assert.equal(result.content, '第2版：乙案\n第三版：丙案');
  assert.equal(result.sourceItemId, 'i2');
});

test('画布搬运：只采纳 assistant + chat + 非空文本的历史项', () => {
  const result = resolveAgentConversationCanvasTransfer({
    message: '写入文本节点',
    history: [
      { role: 'assistant', status: 'chat', content: '' },
      { role: 'assistant', status: 'tool', content: '第1版：噪声' },
      { role: 'user', status: 'chat', content: '第1版：噪声' },
      { role: 'assistant', status: 'chat', content: '第1版：可用' },
    ],
  });
  assert.equal(result.content, '第1版：可用');
});

test('画布搬运：正文可取 reply / message / question 兜底字段', () => {
  for (const key of ['reply', 'message', 'question']) {
    const result = resolveAgentConversationCanvasTransfer({
      message: '写入文本节点',
      history: [{ role: 'assistant', status: 'chat', [key]: '第1版：兜底' }],
    });
    assert.equal(result.content, '第1版：兜底', key);
  }
});

test('画布搬运：英文表述同样可命中两类意图', () => {
  const promptTransfer = resolveAgentConversationCanvasTransfer({
    message: "put this copy into the selected node's prompt",
    history: HISTORY,
  });
  assert.equal(promptTransfer.target, 'selected_prompt');
  const textNode = resolveAgentConversationCanvasTransfer({
    message: 'please write this text into a text node',
    history: HISTORY,
  });
  assert.equal(textNode.nodeType, 'ai-text');
});

test('画布搬运：命中意图但历史为空时按端口原样抛出 TypeError（记账，不改实现）', () => {
  assert.throws(
    () => resolveAgentConversationCanvasTransfer({ message: '写入文本节点', history: [] }),
    TypeError,
  );
  assert.throws(() => resolveAgentConversationCanvasTransfer({ message: '写入文本节点' }), TypeError);
});

test('画布搬运：版本块收集支持「修改后」前缀与无序续行', () => {
  const result = resolveAgentConversationCanvasTransfer({
    message: '把第二版填入选中节点的提示词',
    history: [
      {
        role: 'assistant',
        status: 'chat',
        content: '第1版：旧\n修改后第2版：新开头\n第二行补充',
        itemId: 'ix',
      },
    ],
  });
  assert.equal(result.requestedVersion, 2);
  assert.equal(result.content, '修改后第2版：新开头\n第二行补充');
  assert.equal(result.sourceItemId, 'ix');
});
