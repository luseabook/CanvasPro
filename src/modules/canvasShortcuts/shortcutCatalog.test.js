import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SHORTCUT_CATEGORIES,
  SHORTCUT_ICONS,
  SHORTCUT_NODE_TYPES,
  canManageCanvasShortcuts,
  createDefaultShortcutCatalog,
  createShortcutCatalogStore,
  getAvailableShortcutTemplates,
  resolveShortcutCategory,
  validateShortcutCatalog,
  validateShortcutGraph,
} from './shortcutCatalog.js';

function graphNode(over = {}) {
  return { id: 'n1', type: 'ai-text', x: 0, y: 0, width: 100, height: 60, ...over };
}

function item(over = {}) {
  return {
    id: 'item-1',
    name: '文本',
    icon: 'text',
    badge: '',
    cover: '',
    enabled: true,
    action: { kind: 'node', nodeType: 'ai-text' },
    ...over,
  };
}

test('导出的枚举都是冻结数组', () => {
  assert.deepEqual(SHORTCUT_ICONS, ['text', 'image', 'video', 'audio', 'template']);
  assert.deepEqual(SHORTCUT_NODE_TYPES, ['ai-text', 'ai-image', 'ai-video', 'ai-audio']);
  assert.deepEqual(SHORTCUT_CATEGORIES, ['text', 'image', 'video', 'audio']);
  assert.ok(Object.isFrozen(SHORTCUT_ICONS));
  assert.ok(Object.isFrozen(SHORTCUT_NODE_TYPES));
});

test('resolveShortcutCategory 优先用显式合法分类', () => {
  assert.equal(resolveShortcutCategory({ category: 'video', icon: 'audio' }), 'video');
  assert.equal(resolveShortcutCategory({ category: 'bogus', icon: 'audio' }), 'audio');
});

test('resolveShortcutCategory 从节点动作的类型推导', () => {
  assert.equal(resolveShortcutCategory({ action: { kind: 'node', nodeType: 'ai-video' } }), 'video');
});

test('resolveShortcutCategory 从模板图里最后一个已知节点推导', () => {
  const shortcut = {
    action: {
      kind: 'graph',
      graph: {
        nodes: [{ type: 'ai-image' }, { type: 'group' }, { type: 'ai-audio' }, { type: 'group' }],
      },
    },
  };
  assert.equal(resolveShortcutCategory(shortcut), 'audio');
});

test('resolveShortcutCategory 在无依据时回落到 icon 再回落 text', () => {
  assert.equal(resolveShortcutCategory({ icon: 'template' }), 'text');
  assert.equal(resolveShortcutCategory({ icon: 'audio' }), 'audio');
  assert.equal(resolveShortcutCategory({}), 'text');
});

test('getAvailableShortcutTemplates 只保留启用且为模板图的项目', () => {
  const catalog = {
    items: [
      item({ id: 'a', action: { kind: 'graph', graph: { nodes: [graphNode()], edges: [] } } }),
      item({
        id: 'b',
        enabled: false,
        action: { kind: 'graph', graph: { nodes: [graphNode()], edges: [] } },
      }),
      item({ id: 'c' }),
    ],
  };
  assert.deepEqual(
    getAvailableShortcutTemplates(catalog).map((entry) => entry.id),
    ['a'],
  );
});

test('canManageCanvasShortcuts 要求开发构建与开发模式双开关', () => {
  assert.equal(canManageCanvasShortcuts({ AI_CANVAS_IS_DEV_BUILD: true, DEV_MODE: true }), true);
  assert.equal(canManageCanvasShortcuts({ AI_CANVAS_IS_DEV_BUILD: true, DEV_MODE: false }), false);
  assert.equal(canManageCanvasShortcuts({ AI_CANVAS_IS_DEV_BUILD: 1, DEV_MODE: true }), false);
  assert.equal(canManageCanvasShortcuts(undefined), false);
});

test('createDefaultShortcutCatalog 给出四个节点快捷方式', () => {
  const catalog = createDefaultShortcutCatalog();
  assert.equal(catalog.schemaVersion, 1);
  assert.deepEqual(
    catalog.items.map((entry) => entry.id),
    ['default-text', 'default-image', 'default-video', 'default-audio'],
  );
  assert.deepEqual(
    catalog.items.map((entry) => entry.icon),
    ['text', 'image', 'video', 'audio'],
  );
  assert.deepEqual(
    catalog.items.map((entry) => entry.name),
    ['文本生成', '图片生成', '视频生成', '音频生成'],
  );
  assert.deepEqual(catalog.items[2].action, { kind: 'node', nodeType: 'ai-video' });
  assert.equal(catalog.items[0].enabled, true);
  assert.equal(validateShortcutCatalog(catalog), catalog);
});

test('validateShortcutCatalog 校验版本与条数上限', () => {
  assert.throws(() => validateShortcutCatalog(null), { message: '不支持的快捷方式配置版本' });
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 2, items: [] }), {
    message: '不支持的快捷方式配置版本',
  });
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: {} }), {
    message: '快捷方式最多 64 项',
  });
  const tooMany = { schemaVersion: 1, items: new Array(65).fill(item()) };
  assert.throws(() => validateShortcutCatalog(tooMany), { message: '快捷方式最多 64 项' });
});

test('validateShortcutCatalog 校验标识与重复', () => {
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ id: 1 })] }), {
    message: '快捷方式标识无效或重复',
  });
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ id: '  ' })] }), {
    message: '快捷方式标识无效或重复',
  });
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ id: 'x'.repeat(101) })] }), {
    message: '快捷方式标识无效或重复',
  });
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item(), item()] }), {
    message: '快捷方式标识无效或重复',
  });
});

test('validateShortcutCatalog 校验分类、名称、角标与副标题', () => {
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ category: 'x' })] }), {
    message: '请选择文本、图片、视频或音频分类',
  });
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ name: '   ' })] }), {
    message: '请填写名称（最多 50 字）',
  });
  assert.throws(
    () => validateShortcutCatalog({ schemaVersion: 1, items: [item({ name: '名'.repeat(51) })] }),
    {
      message: '请填写名称（最多 50 字）',
    },
  );
  assert.throws(
    () => validateShortcutCatalog({ schemaVersion: 1, items: [item({ badge: 'b'.repeat(25) })] }),
    {
      message: '角标最多 24 字',
    },
  );
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ subtitle: 1 })] }), {
    message: '副标题最多 80 字',
  });
  assert.equal(
    validateShortcutCatalog({
      schemaVersion: 1,
      items: [item({ subtitle: 's'.repeat(80), category: 'audio' })],
    }).items.length,
    1,
  );
});

test('validateShortcutCatalog 校验图标、启用标志与封面', () => {
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ icon: 'nope' })] }), {
    message: '快捷方式外观配置无效',
  });
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ enabled: 'yes' })] }), {
    message: '快捷方式外观配置无效',
  });
  assert.throws(
    () => validateShortcutCatalog({ schemaVersion: 1, items: [item({ cover: 'data:image/gif;base64,AA' })] }),
    {
      message: '封面须为 PNG、JPEG 或 WebP 图片',
    },
  );
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ cover: 5 })] }), {
    message: '封面须为 PNG、JPEG 或 WebP 图片',
  });
  const ok = { schemaVersion: 1, items: [item({ cover: 'data:image/webp;base64,AAAA+/=' })] };
  assert.equal(validateShortcutCatalog(ok), ok);
});

test('validateShortcutCatalog 要求节点动作合法或模板图合法', () => {
  assert.throws(
    () =>
      validateShortcutCatalog({
        schemaVersion: 1,
        items: [item({ action: { kind: 'node', nodeType: 'ai-x' } })],
      }),
    { message: '不支持的快捷节点类型' },
  );
  assert.throws(
    () => validateShortcutCatalog({ schemaVersion: 1, items: [item({ action: { kind: 'other' } })] }),
    {
      message: '请选择快捷方式内容',
    },
  );
  assert.throws(() => validateShortcutCatalog({ schemaVersion: 1, items: [item({ action: undefined })] }), {
    message: '请选择快捷方式内容',
  });
});

test('validateShortcutGraph 校验节点数量与连线数组', () => {
  assert.throws(() => validateShortcutGraph(null), { message: '模板需要 1～256 个节点' });
  assert.throws(() => validateShortcutGraph({ nodes: [], edges: [] }), { message: '模板需要 1～256 个节点' });
  assert.throws(() => validateShortcutGraph({ nodes: new Array(257).fill(graphNode()), edges: [] }), {
    message: '模板需要 1～256 个节点',
  });
  assert.throws(() => validateShortcutGraph({ nodes: [graphNode()], edges: null }), {
    message: '模板连线无效',
  });
  assert.throws(
    () =>
      validateShortcutGraph({
        nodes: [graphNode()],
        edges: new Array(2049).fill({ sourceId: 'n1', targetId: 'n1' }),
      }),
    { message: '模板连线无效' },
  );
});

test('validateShortcutGraph 校验节点标识、重复与尺寸', () => {
  assert.throws(
    () =>
      validateShortcutGraph({
        nodes: [{ id: '', type: 'ai-text', x: 0, y: 0, width: 1, height: 1 }],
        edges: [],
      }),
    {
      message: '模板节点无效或重复',
    },
  );
  assert.throws(
    () =>
      validateShortcutGraph({ nodes: [{ id: 'a', type: '', x: 0, y: 0, width: 1, height: 1 }], edges: [] }),
    {
      message: '模板节点无效或重复',
    },
  );
  assert.throws(() => validateShortcutGraph({ nodes: [graphNode(), graphNode()], edges: [] }), {
    message: '模板节点无效或重复',
  });
  assert.throws(() => validateShortcutGraph({ nodes: [graphNode({ x: NaN })], edges: [] }), {
    message: '模板节点尺寸或位置无效',
  });
  assert.throws(() => validateShortcutGraph({ nodes: [graphNode({ width: 0 })], edges: [] }), {
    message: '模板节点尺寸或位置无效',
  });
});

test('validateShortcutGraph 校验连线与分组引用', () => {
  const nodes = [graphNode(), graphNode({ id: 'n2', type: 'ai-image' })];
  assert.throws(() => validateShortcutGraph({ nodes, edges: [{ sourceId: 'n1', targetId: 'ghost' }] }), {
    message: '模板连线引用了未包含的节点',
  });
  assert.throws(() => validateShortcutGraph({ nodes, edges: [null] }), {
    message: '模板连线引用了未包含的节点',
  });
  assert.throws(() => validateShortcutGraph({ nodes: [graphNode({ parentId: 'ghost' })], edges: [] }), {
    message: '模板分组引用了未包含的节点',
  });
});

test('validateShortcutGraph 检测分组循环', () => {
  const cyclic = [graphNode({ id: 'a', parentId: 'b' }), graphNode({ id: 'b', parentId: 'a' })];
  assert.throws(() => validateShortcutGraph({ nodes: cyclic, edges: [] }), { message: '模板分组存在循环' });
  const selfParent = [graphNode({ id: 'a', parentId: 'a' })];
  assert.throws(() => validateShortcutGraph({ nodes: selfParent, edges: [] }), {
    message: '模板分组存在循环',
  });
});

test('validateShortcutGraph 接受合法的父子链', () => {
  const nodes = [
    graphNode({ id: 'group' }),
    graphNode({ id: 'child', parentId: 'group' }),
    graphNode({ id: 'grand', parentId: 'child' }),
  ];
  assert.deepEqual(validateShortcutGraph({ nodes, edges: [] }), { nodes, edges: [] });
});

test('store 初始状态为未加载的默认目录', () => {
  const store = createShortcutCatalogStore({
    load: async () => null,
    save: async () => null,
    canManage: () => true,
  });
  const state = store.getState();
  assert.equal(state.loaded, false);
  assert.equal(state.revision, '');
  assert.deepEqual(
    state.catalog.items.map((entry) => entry.id),
    ['default-text', 'default-image', 'default-video', 'default-audio'],
  );
});

test('store.load 应用返回值、通知订阅者并只跑一次请求', async () => {
  let calls = 0;
  const store = createShortcutCatalogStore({
    load: async () => {
      calls += 1;
      return { catalog: { schemaVersion: 1, items: [item()] }, revision: 'r1' };
    },
    save: async () => null,
    canManage: () => true,
  });
  const seen = [];
  const unsubscribe = store.subscribe((state) => seen.push(state.revision));
  const [first, second] = await Promise.all([store.load(), store.load()]);
  assert.equal(calls, 1);
  assert.equal(first, second);
  assert.deepEqual(seen, ['r1']);
  assert.equal(store.getState().loaded, true);
  assert.equal(store.getState().revision, 'r1');
  unsubscribe();
});

test('store.load 在返回空目录时用默认目录兜底', async () => {
  const store = createShortcutCatalogStore({
    load: async () => null,
    save: async () => null,
    canManage: () => true,
  });
  const state = await store.load();
  assert.equal(state.catalog.items.length, 4);
  assert.equal(state.loaded, true);
});

test('store.load 校验失败会拒绝，之后可重试', async () => {
  let mode = 'bad';
  const store = createShortcutCatalogStore({
    load: async () => (mode === 'bad' ? { catalog: { schemaVersion: 9, items: [] } } : { catalog: null }),
    save: async () => null,
    canManage: () => true,
  });
  await assert.rejects(() => store.load(), { message: '不支持的快捷方式配置版本' });
  mode = 'ok';
  const state = await store.load();
  assert.equal(state.catalog.items.length, 4);
});

test('store.save 要求开发者模式、已加载且不忙', async () => {
  const store = createShortcutCatalogStore({
    load: async () => null,
    save: async () => null,
    canManage: () => false,
  });
  await assert.rejects(() => store.save(createDefaultShortcutCatalog()), {
    message: '请开启开发者模式，并确认本地 .dev 文件存在',
  });
  const loaded = createShortcutCatalogStore({
    load: async () => null,
    save: async () => ({ catalog: null, revision: 'r9' }),
    canManage: () => true,
  });
  await assert.rejects(() => loaded.save(createDefaultShortcutCatalog()), {
    message: '配置正在读写，请稍后再试',
  });
  await loaded.load();
  assert.equal((await loaded.save(createDefaultShortcutCatalog(), 'r9')).revision, 'r9');
  assert.equal(loaded.getState().revision, 'r9');
});

test('store.save 在加载进行中拒绝并发写入', async () => {
  let release = null;
  const store = createShortcutCatalogStore({
    load: () =>
      new Promise((resolve) => {
        release = () => resolve(null);
      }),
    save: async () => null,
    canManage: () => true,
  });
  const pending = store.load();
  await assert.rejects(() => store.save(createDefaultShortcutCatalog()), {
    message: '配置正在读写，请稍后再试',
  });
  release();
  await pending;
});

test('store.save 校验失败会拒绝且不占用忙标志', async () => {
  let saved = 0;
  const store = createShortcutCatalogStore({
    load: async () => null,
    save: async () => {
      saved += 1;
      return { catalog: null, revision: 'r2' };
    },
    canManage: () => true,
  });
  await store.load();
  await assert.rejects(() => store.save({ schemaVersion: 1, items: [item({ name: '' })] }), {
    message: '请填写名称（最多 50 字）',
  });
  assert.equal(saved, 0);
  assert.equal((await store.save(createDefaultShortcutCatalog(), 'r2')).revision, 'r2');
  assert.equal(saved, 1);
});

test('store.save 的结果被深拷贝进状态', async () => {
  const shared = { schemaVersion: 1, items: [item()] };
  const store = createShortcutCatalogStore({
    load: async () => null,
    save: async () => ({ catalog: shared, revision: 'r3' }),
    canManage: () => true,
  });
  await store.load();
  await store.save(createDefaultShortcutCatalog(), 'r3');
  shared.items.push(item({ id: 'extra' }));
  assert.equal(store.getState().catalog.items.length, 1);
});

test('store.subscribe 退订后不再收到通知', async () => {
  const store = createShortcutCatalogStore({
    load: async () => null,
    save: async () => null,
    canManage: () => true,
  });
  const seen = [];
  const unsubscribe = store.subscribe(() => seen.push(1));
  unsubscribe();
  await store.load();
  assert.deepEqual(seen, []);
});

test('validateShortcutCatalog 拒绝超过 80 字的副标题', () => {
  assert.throws(
    () => validateShortcutCatalog({ schemaVersion: 1, items: [item({ subtitle: 's'.repeat(81) })] }),
    { message: '副标题最多 80 字' },
  );
});
