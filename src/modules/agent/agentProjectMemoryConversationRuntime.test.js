import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentProjectMemoryConversationRuntime } from './agentProjectMemoryConversationRuntime.js';

function makeMemory(overrides = {}) {
  return { brandVoice: [], preferredModels: [], namingRules: [], preferences: [], ...overrides };
}

function makeStore(memory = makeMemory(), overrides = {}) {
  const calls = [];
  return {
    calls,
    memory,
    getMemory() {
      calls.push(['getMemory']);
      return this.memory;
    },
    remember(records) {
      calls.push(['remember', records]);
      return { added: [], memory: this.memory };
    },
    forget(intent) {
      calls.push(['forget', intent]);
      return { removed: 0, memory: this.memory };
    },
    clearMemory() {
      calls.push(['clearMemory']);
      return { memory: makeMemory() };
    },
    ...overrides,
  };
}

function makeSession() {
  const history = [];
  const runs = [];
  const traces = [];
  return {
    history,
    runs,
    traces,
    pushHistory(message) {
      history.push(message);
    },
    setCurrentRun(run) {
      runs.push(run);
    },
    recordTrace(trace) {
      traces.push(trace);
    },
  };
}

function makeRuntime({ memory, storeOverrides = {}, sessionOverrides = {}, locale = 'zh-CN' } = {}) {
  const store = makeStore(memory, storeOverrides);
  const session = makeSession();
  Object.assign(session, sessionOverrides);
  const runtime = createAgentProjectMemoryConversationRuntime({
    projectMemoryStore: store,
    sessionStore: session,
    localeProvider: () => locale,
  });
  return { runtime, store, session };
}

test('长期记忆运行时：未注入记忆仓库时任何消息都判 null', () => {
  const runtime = createAgentProjectMemoryConversationRuntime({
    sessionStore: makeSession(),
    localeProvider: () => 'zh-CN',
  });
  assert.equal(runtime.handle({ message: '查看项目的记忆', runId: 'r1' }), null);
});

test('长期记忆运行时：非记忆意图不接管', () => {
  const { runtime, session } = makeRuntime();
  assert.equal(runtime.handle({ message: '帮我建一个图片节点', runId: 'r1' }), null);
  assert.deepEqual(session.traces, []);
  assert.deepEqual(session.history, []);
});

test('长期记忆运行时：空记忆走 empty 文案并落历史与当前运行', () => {
  const { runtime, session } = makeRuntime();
  const res = runtime.handle({ message: '查看项目的记忆', runId: 'r7' });
  assert.equal(res.ok, true);
  assert.equal(res.status, 'success');
  assert.equal(res.responseChannel, 'project.memory');
  assert.match(res.reply, /^当前项目还没有长期记忆/);
  assert.deepEqual(session.history, [
    { role: 'assistant', status: 'success', content: res.reply, turnId: 'r7' },
  ]);
  assert.deepEqual(session.runs, [{ id: 'r7', status: 'success', stopped: false }]);
  assert.deepEqual(session.traces, [
    { type: 'agent_turn_routed', channel: 'project.memory', reason: 'project-memory-inspect' },
  ]);
});

test('长期记忆运行时：有记忆时按固定类别顺序成行，空类别不出行', () => {
  const { runtime } = makeRuntime({
    memory: makeMemory({
      brandVoice: ['年轻直接', '少用感叹号'],
      namingRules: ['节点名用中文编号'],
    }),
  });
  const res = runtime.handle({ message: '查看项目的记忆', runId: 'r1' });
  assert.equal(
    res.reply,
    '当前项目长期记忆：\n- 品牌语气：年轻直接；少用感叹号\n- 命名规则：节点名用中文编号',
  );
});

test('长期记忆运行时：remember 有新增走 remembered，无新增走 unchanged', () => {
  const withAdd = makeRuntime({
    storeOverrides: {
      remember() {
        return { added: [{ category: 'brandVoice', value: '专业' }], memory: makeMemory() };
      },
    },
  });
  assert.equal(
    withAdd.runtime.handle({ message: '记住：品牌语气要专业；节点名用中文编号', runId: 'r2' }).reply,
    '已记入当前项目长期记忆：品牌语气：专业。',
  );
  const noAdd = makeRuntime();
  assert.equal(
    noAdd.runtime.handle({ message: '记住：品牌语气要专业；节点名用中文编号', runId: 'r2' }).reply,
    '这些内容已经存在于当前项目长期记忆中。',
  );
});

test('长期记忆运行时：forget 把整个意图对象交给仓库，按 removed 切换文案', () => {
  const { runtime, store } = makeRuntime();
  const res = runtime.handle({ message: '忘记 模型：gpt-4o', runId: 'r3' });
  assert.equal(res.reply, '没有找到匹配的项目长期记忆。');
  assert.deepEqual(store.calls, [
    ['forget', { operation: 'forget', category: 'preferredModels', query: 'gpt-4o' }],
  ]);
  const hit = makeRuntime({ storeOverrides: { forget: () => ({ removed: 2, memory: makeMemory() }) } });
  assert.equal(
    hit.runtime.handle({ message: '忘记 模型：gpt-4o', runId: 'r3' }).reply,
    '已从当前项目长期记忆中移除 2 条内容。',
  );
});

test('长期记忆运行时：clear 走 clearMemory 与 cleared 文案', () => {
  const { runtime, store } = makeRuntime();
  const res = runtime.handle({ message: '清空项目记忆', runId: 'r4' });
  assert.equal(res.reply, '已清空当前项目长期记忆。');
  assert.deepEqual(store.calls, [['clearMemory']]);
  assert.deepEqual(res.projectMemory, makeMemory());
});

test('长期记忆运行时：en-US 走英文文案，但行内分隔符仍是全角（端口现状）', () => {
  const { runtime } = makeRuntime({
    locale: 'en-US',
    memory: makeMemory({ brandVoice: ['concise'], preferences: ['plain copy'] }),
  });
  const res = runtime.handle({ message: '查看项目的记忆', runId: 'r5' });
  assert.equal(
    res.reply,
    'Long-term memory for this project:\n- Brand voice：concise\n- Other preferences：plain copy',
  );
});

test('长期记忆运行时：返回值带当前记忆快照，供上层直接回填', () => {
  const memory = makeMemory({ preferredModels: ['gpt-4o'] });
  const { runtime } = makeRuntime({ memory });
  const res = runtime.handle({ message: '查看项目的记忆', runId: 'r6' });
  assert.equal(res.projectMemory, memory);
});
