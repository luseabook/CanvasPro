import test from 'node:test';
import assert from 'node:assert/strict';

const { AGENT_PROJECT_MEMORY_STORAGE_KEY, createAgentProjectMemoryStore } =
  await import('./agentProjectMemoryStore.js');

const KEY = AGENT_PROJECT_MEMORY_STORAGE_KEY;

function makeWindow(initial = {}) {
  const data = { ...initial };
  return {
    data,
    localStorage: {
      getItem: (key) => (key in data ? data[key] : null),
      setItem: (key, value) => {
        data[key] = String(value);
      },
    },
  };
}

function readState(win) {
  return JSON.parse(win.data[KEY]);
}

function make(over = {}) {
  const win = 'windowObject' in over ? over.windowObject : makeWindow();
  let clock = 1000;
  const store = createAgentProjectMemoryStore({
    windowObject: win,
    getProjectId: () => 'proj_a',
    now: () => clock,
    ...over,
    windowObject: win,
  });
  return { win, store, setClock: (value) => (clock = value) };
}

test('项目记忆存储：导出键常量与四方法接口，键序即契约', () => {
  assert.equal(KEY, 'aicanvas:agent-project-memory:v1');
  const { store } = make();
  assert.deepEqual(Object.keys(store), ['getMemory', 'remember', 'forget', 'clearMemory']);
});

test('项目记忆存储：空态返回完整四类目骨架，但 updatedAt 为 0（读路径不取注入时钟）', () => {
  const { store } = make();
  assert.deepEqual(store.getMemory(), {
    schemaVersion: 1,
    projectId: 'proj_a',
    brandVoice: [],
    preferredModels: [],
    namingRules: [],
    preferences: [],
    updatedAt: 0,
  });
});

test('项目记忆存储：remember 归一非法类目落 preferences、空值丢弃、大小写去重', () => {
  const { store, win } = make();
  const result = store.remember([
    { category: 'unknown', value: '语气年轻' },
    { category: 'brandVoice', value: '正式' },
    { category: 'brandVoice', value: '正式' },
    { category: 'brandVoice', value: '  正式  ' },
    { category: 'brandVoice' },
    { value: '' },
    null,
    'plain-string',
  ]);
  assert.deepEqual(result.added, [
    { category: 'preferences', value: '语气年轻' },
    { category: 'brandVoice', value: '正式' },
  ]);
  assert.deepEqual(result.memory.preferences, ['语气年轻']);
  assert.deepEqual(result.memory.brandVoice, ['正式']);
  assert.equal(result.memory.updatedAt, 1000);
  assert.equal(readState(win).projects.proj_a.preferences[0], '语气年轻');
});

test('项目记忆存储：remember 只在实际新增时落盘并推进时钟', () => {
  const { store, win, setClock } = make();
  const before = win.data[KEY];
  assert.equal(store.remember([]).added.length, 0);
  assert.equal(win.data[KEY], before, '无新增不写盘');
  setClock(4242);
  store.remember([{ category: 'namingRules', value: 'EP_%n%' }]);
  assert.equal(readState(win).projects.proj_a.updatedAt, 4242);
});

test('项目记忆存储：单类目超 12 条时淘汰最旧、保留最近 12 条', () => {
  const { store } = make();
  const items = Array.from({ length: 15 }, (_, i) => ({ category: 'preferences', value: 'p' + i }));
  const memory = store.remember(items).memory;
  assert.deepEqual(
    memory.preferences,
    Array.from({ length: 12 }, (_, i) => 'p' + (i + 3)),
  );
});

test('项目记忆存储：跨实例经同一 localStorage 回读，且返回克隆不被外部改写污染', () => {
  const { store, win } = make();
  store.remember([{ category: 'brandVoice', value: '简洁' }]);
  const second = createAgentProjectMemoryStore({
    windowObject: win,
    getProjectId: () => 'proj_a',
    now: () => 9,
  });
  assert.deepEqual(second.getMemory().brandVoice, ['简洁']);
  const memory = second.getMemory();
  memory.brandVoice.push('注入');
  memory.schemaVersion = 99;
  assert.deepEqual(second.getMemory().brandVoice, ['简洁']);
  assert.equal(readState(win).schemaVersion, 1);
});

test('项目记忆存储：回读时按 updatedAt 倒序裁到 50 个项目', () => {
  const projects = {};
  for (let i = 0; i < 55; i += 1) {
    projects['p' + i] = { projectId: 'p' + i, preferences: ['x'], updatedAt: i + 1 };
  }
  const win = makeWindow({ [KEY]: JSON.stringify({ schemaVersion: 1, projects }) });
  const { store } = make({ windowObject: win });
  store.remember([{ category: 'preferences', value: 'y' }]);
  const state = readState(win);
  const kept = Object.keys(state.projects);
  assert.equal(kept.length, 50);
  assert.ok(kept.includes('p54'));
  assert.ok(!kept.includes('p0'), '最旧项目被裁掉');
});

test('项目记忆存储：项目 id 归一为空串/超长/抛错时回落默认 id', () => {
  const blank = make({ getProjectId: () => '   ' });
  assert.equal(blank.store.getMemory().projectId, 'default_v2_project');
  const long = make({ getProjectId: () => 'q'.repeat(200) });
  assert.equal(long.store.getMemory().projectId.length, 160);
  const boom = make({
    getProjectId: () => {
      throw new Error('无当前项目');
    },
  });
  assert.equal(boom.store.getMemory().projectId, 'default_v2_project');
  assert.equal(
    boom.store.remember([{ category: 'namingRules', value: 'a' }]).memory.projectId,
    'default_v2_project',
  );
});

test('项目记忆存储：缺 window、读盘抛错、写盘抛错三态均降级不抛', () => {
  const noWindow = createAgentProjectMemoryStore({ getProjectId: () => 'p', now: () => 5 });
  assert.deepEqual(noWindow.getMemory().preferences, []);
  assert.deepEqual(
    noWindow.remember([{ category: 'preferences', value: 'a' }]).added,
    [{ category: 'preferences', value: 'a' }],
    '无存储仍可写入内存快照',
  );

  const badRead = makeWindow();
  badRead.localStorage.getItem = () => {
    throw new Error('SecurityError');
  };
  assert.deepEqual(make({ windowObject: badRead }).store.getMemory().preferences, []);

  const badWrite = makeWindow();
  badWrite.localStorage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  const written = make({ windowObject: badWrite }).store.remember([{ category: 'preferences', value: 'a' }]);
  assert.equal(written.memory.preferences[0], 'a');
  assert.equal(badWrite.data[KEY], undefined);
});

test('项目记忆存储：坏 JSON 与非对象载荷在读取时归一为空态', () => {
  const win = makeWindow({ [KEY]: '{not json' });
  assert.deepEqual(make({ windowObject: win }).store.getMemory().preferences, []);
  const weird = makeWindow({ [KEY]: JSON.stringify({ projects: { proj_a: ['boom'] } }) });
  assert.deepEqual(make({ windowObject: weird }).store.getMemory().preferences, []);
});

test('项目记忆存储：forget 带查询时双向包含匹配、无查询时清空、零命中不动盘', () => {
  const { store, win } = make();
  store.remember([
    { category: 'brandVoice', value: '品牌语气年轻' },
    { category: 'brandVoice', value: '正式' },
    { category: 'preferences', value: '输出 4K' },
  ]);
  const before = win.data[KEY];
  assert.deepEqual(store.forget({ query: '不存在' }), {
    memory: store.getMemory(),
    removed: 0,
  });
  assert.equal(win.data[KEY], before, '零命中不写盘');
  const hit = store.forget({ query: '语气' });
  assert.equal(hit.removed, 1);
  assert.deepEqual(hit.memory.brandVoice, ['正式']);
  const broader = store.forget({ query: '品牌语气年轻正式' });
  assert.equal(broader.removed, 1, '查询串包含条目亦可命中');
  const all = store.forget({});
  assert.equal(all.removed, 1);
  assert.deepEqual(all.memory, {
    schemaVersion: 1,
    projectId: 'proj_a',
    brandVoice: [],
    preferredModels: [],
    namingRules: [],
    preferences: [],
    updatedAt: 1000,
  });
});

test('项目记忆存储：forget 指定类目时只扫该类目，未知类目等同全扫', () => {
  const seeded = make();
  seeded.store.remember([
    { category: 'brandVoice', value: 'A' },
    { category: 'preferences', value: 'A' },
  ]);
  const onlyCategory = seeded.store.forget({ category: 'brandVoice', query: 'A' });
  assert.equal(onlyCategory.removed, 1);
  assert.deepEqual(onlyCategory.memory.preferences, ['A']);

  const other = make();
  other.store.remember([
    { category: 'brandVoice', value: 'B' },
    { category: 'preferences', value: 'B' },
  ]);
  const unknown = other.store.forget({ category: 'nope', query: 'B' });
  assert.equal(unknown.removed, 2);
});

test('项目记忆存储：clearMemory 只删当前项目并返回被删条目数', () => {
  const win = makeWindow({
    [KEY]: JSON.stringify({
      schemaVersion: 1,
      projects: {
        proj_a: { projectId: 'proj_a', brandVoice: ['x'], preferences: ['y', 'z'], updatedAt: 3 },
        proj_b: { projectId: 'proj_b', brandVoice: ['keep'], updatedAt: 4 },
      },
    }),
  });
  const { store } = make({ windowObject: win });
  const cleared = store.clearMemory();
  assert.equal(cleared.removed, 3);
  assert.deepEqual(cleared.memory.brandVoice, []);
  assert.deepEqual(Object.keys(readState(win).projects), ['proj_b']);
  assert.deepEqual(readState(win).projects.proj_b.brandVoice, ['keep']);
});
