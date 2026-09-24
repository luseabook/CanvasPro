import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deriveRequestedCreatedNodeType,
  verifyAgentLoopCompletionEvidence,
} from './agentCompletionEvidence.js';

test('完成证据：无创建意图的表述返回空类型', () => {
  for (const message of ['', '你好', '写一个故事', null])
    assert.equal(deriveRequestedCreatedNodeType(message), '');
});

test('完成证据：否定式创建指令被排除', () => {
  assert.equal(deriveRequestedCreatedNodeType('不要创建图片节点'), '');
  assert.equal(deriveRequestedCreatedNodeType('别新建视频'), '');
  assert.equal(deriveRequestedCreatedNodeType("don't create an image"), '');
});

test('完成证据：按文案关键词推断四类目标节点', () => {
  assert.equal(deriveRequestedCreatedNodeType('帮我创建一个视频'), 'ai-video');
  assert.equal(deriveRequestedCreatedNodeType('新建一张产品图'), 'ai-image');
  assert.equal(deriveRequestedCreatedNodeType('添加一段配音'), 'ai-audio');
  assert.equal(deriveRequestedCreatedNodeType('创建这个文本节点'), 'ai-text');
  assert.equal(deriveRequestedCreatedNodeType('make a poster'), 'ai-image');
});

test('完成证据：显式 targetKind 优先于文案关键词', () => {
  assert.equal(deriveRequestedCreatedNodeType('制作图片', { targetKind: 'audio' }), 'ai-audio');
  assert.equal(deriveRequestedCreatedNodeType('制作图片', { targetKind: 'image' }), 'ai-image');
  assert.equal(deriveRequestedCreatedNodeType('随便说点什么', { targetKind: 'ai-video' }), '');
  assert.equal(deriveRequestedCreatedNodeType('随便说点什么', { targetKind: 'bogus' }), '');
});

test('完成证据：生成/绘制/渲染动词默认不计入创建', () => {
  assert.equal(deriveRequestedCreatedNodeType('生成一个视频'), '');
  assert.equal(deriveRequestedCreatedNodeType('生成一个视频', {}, { includeGenerateVerb: true }), 'ai-video');
  assert.equal(deriveRequestedCreatedNodeType('渲染一张海报', {}, { includeGenerateVerb: true }), 'ai-image');
});

test('完成证据：targetKind 简写与全写等价', () => {
  for (const [kind, expected] of [
    ['video', 'ai-video'],
    ['AI-IMAGE', 'ai-image'],
    [' audio ', 'ai-audio'],
    ['Text', 'ai-text'],
  ])
    assert.equal(deriveRequestedCreatedNodeType('请创建它', { targetKind: kind }), expected);
});

test('完成证据：请求到节点时直接判定 ok', () => {
  const result = verifyAgentLoopCompletionEvidence({
    userMessage: '创建图片节点',
    runtimeProvenance: { createdNodeIds: ['n1'] },
    canvasState: { nodes: { n1: { type: 'ai-image' } } },
  });
  assert.deepEqual(result, { ok: true, requestedNodeType: 'ai-image', matchingNodeIds: ['n1'] });
});

test('完成证据：类型不符时给出缺失错误码', () => {
  assert.deepEqual(
    verifyAgentLoopCompletionEvidence({
      userMessage: '创建图片节点',
      runtimeProvenance: { createdNodeIds: ['n1'] },
      canvasState: { nodes: { n1: { type: 'ai-video' } } },
    }),
    {
      ok: false,
      errorCode: 'AGENT_COMPLETION_EVIDENCE_MISSING',
      requestedNodeType: 'ai-image',
      createdNodeIds: ['n1'],
    },
  );
});

test('完成证据：无创建诉求时无条件通过', () => {
  assert.deepEqual(verifyAgentLoopCompletionEvidence({ userMessage: '你好' }), { ok: true });
  assert.deepEqual(verifyAgentLoopCompletionEvidence({}), { ok: true });
});

test('完成证据：节点类型比较前去除首尾空白', () => {
  const result = verifyAgentLoopCompletionEvidence({
    userMessage: '创建图片节点',
    runtimeProvenance: { createdNodeIds: ['n1'] },
    canvasState: { nodes: { n1: { type: '  ai-image  ' } } },
  });
  assert.deepEqual(result.matchingNodeIds, ['n1']);
});

test('完成证据：createdNodeIds 非数组与 canvasState 非对象均按空处理', () => {
  const missing = verifyAgentLoopCompletionEvidence({
    userMessage: '创建图片节点',
    runtimeProvenance: { createdNodeIds: 'n1' },
    canvasState: { nodes: null },
  });
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.createdNodeIds, []);
  assert.deepEqual(verifyAgentLoopCompletionEvidence({ userMessage: '创建图片节点' }).createdNodeIds, []);
});

test('完成证据：仅统计类型命中的新建节点', () => {
  const result = verifyAgentLoopCompletionEvidence({
    userMessage: '创建图片节点',
    runtimeProvenance: { createdNodeIds: ['a', 'b', 'c'] },
    canvasState: {
      nodes: { a: { type: 'ai-image' }, b: { type: 'ai-video' }, c: { type: 'ai-image' } },
    },
  });
  assert.deepEqual(result.matchingNodeIds, ['a', 'c']);
});
