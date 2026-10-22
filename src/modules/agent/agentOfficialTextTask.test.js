import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAgentOfficialTextTask } from './agentOfficialTextTask.js';
const VALID_TASK_ID = 'task_0123456789abcdefghij';
test('agent official text task: taskId 形态不符直接拒绝', () => {
  (assert.equal(normalizeAgentOfficialTextTask(null), null),
    assert.equal(normalizeAgentOfficialTextTask({ taskId: 'short' }), null),
    assert.equal(normalizeAgentOfficialTextTask({ taskId: 'has space in id 0123456789' }), null),
    assert.equal(normalizeAgentOfficialTextTask({ taskId: 'x'.repeat(81) }), null));
});
test('agent official text task: 合法任务被裁剪并保留待恢复请求', () => {
  const normalized = normalizeAgentOfficialTextTask({
    taskId: VALID_TASK_ID,
    model: 'gpt-5',
    provider: 'official',
    pendingRequest: {
      accountId: 'acc-1',
      gatewayEnvironment: '',
      request: { url: '/api/v2/chat', isProxy: true, body: { apiKey: 'sk-secret', model: 'gpt-5' } },
    },
    message: 'y'.repeat(40000),
    revisionItemId: 'item-1',
    skillIds: ['a', 'b', 3],
  });
  (assert.equal(normalized.taskId, VALID_TASK_ID),
    assert.equal(normalized.model, 'gpt-5'),
    assert.equal(normalized.provider, 'official'),
    // 消息体按 32000 截断。
    assert.equal(normalized.message.length, 32000),
    assert.deepEqual(normalized.skillIds, ['a', 'b', '3']),
    // 待恢复请求必须已净化凭据。
    assert.equal(JSON.stringify(normalized.pendingRequest).includes('sk-secret'), false));
});
test('agent official text task: 非法待恢复请求降级为 null 而非整条丢弃', () => {
  const normalized = normalizeAgentOfficialTextTask({
    taskId: VALID_TASK_ID,
    pendingRequest: { accountId: '', request: { url: '/api/v2/chat', isProxy: true, body: {} } },
  });
  (assert.ok(normalized), assert.equal(normalized.pendingRequest, null));
});
