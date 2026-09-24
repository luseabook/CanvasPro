import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NODE_MANAGER_FILTERS,
  normalizeNodeManagerFilter,
  getNodeManagerCategory,
  resolveNodeManagerCategory,
  resolveNodeManagerName,
  buildNodeManagerModel,
  buildNodeManagerListModel,
} from './nodeManagerModel.js';

function indexById(items) {
  const out = new Map();
  for (const item of items) out.set(item.id, item);
  return out;
}

test('nodeManagerModel: 过滤器常量冻结且为全量分类', () => {
  (assert.deepEqual([...NODE_MANAGER_FILTERS], ['all', 'text', 'image', 'video', 'audio']),
    assert.equal(Object.isFrozen(NODE_MANAGER_FILTERS), true));
});

test('nodeManagerModel: normalizeNodeManagerFilter 归一化并回退 all', () => {
  (assert.equal(normalizeNodeManagerFilter('IMAGE'), 'image'),
    assert.equal(normalizeNodeManagerFilter(' image '), 'image'),
    assert.equal(normalizeNodeManagerFilter('audio'), 'audio'),
    assert.equal(normalizeNodeManagerFilter('bogus'), 'all'),
    assert.equal(normalizeNodeManagerFilter(''), 'all'),
    assert.equal(normalizeNodeManagerFilter(undefined), 'all'),
    assert.equal(normalizeNodeManagerFilter(0), 'all'));
});

test('nodeManagerModel: getNodeManagerCategory 按节点类型映射分类', () => {
  (assert.equal(getNodeManagerCategory({ type: 'group' }), 'group'),
    assert.equal(getNodeManagerCategory({ type: 'source-image' }), 'image'),
    assert.equal(getNodeManagerCategory({ type: 'image' }), 'image'),
    assert.equal(getNodeManagerCategory({ type: 'ai-image' }), 'image'),
    assert.equal(getNodeManagerCategory({ type: 'source-text' }), 'text'),
    assert.equal(getNodeManagerCategory({ type: 'ai-text' }), 'text'),
    assert.equal(getNodeManagerCategory({ type: 'source-video' }), 'video'),
    assert.equal(getNodeManagerCategory({ type: 'ai-video' }), 'video'),
    assert.equal(getNodeManagerCategory({ type: 'test-video' }), 'video'),
    assert.equal(getNodeManagerCategory({ type: 'source-audio' }), 'audio'),
    assert.equal(getNodeManagerCategory({ type: 'ai-audio' }), 'audio'));
});

test('nodeManagerModel: 无媒体归属或未知类型落入 other', () => {
  (assert.equal(getNodeManagerCategory({ type: 'comment-note' }), 'other'),
    assert.equal(getNodeManagerCategory({ type: 'web-preview' }), 'other'),
    assert.equal(getNodeManagerCategory({ type: 'unknown-type' }), 'other'),
    assert.equal(getNodeManagerCategory({ type: '' }), 'other'),
    assert.equal(getNodeManagerCategory({}), 'other'),
    assert.equal(getNodeManagerCategory(), 'other'));
});

test('nodeManagerModel: resolveNodeManagerCategory 与 getNodeManagerCategory 同实现', () => {
  assert.equal(resolveNodeManagerCategory, getNodeManagerCategory);
});

test('nodeManagerModel: resolveNodeManagerName 取首个可用显示名', () => {
  (assert.equal(resolveNodeManagerName({ name: '名称', title: '标题', label: '标签' }, 'fb'), '名称'),
    assert.equal(resolveNodeManagerName({ title: '标题', label: '标签' }, 'fb'), '标题'),
    assert.equal(resolveNodeManagerName({ label: '标签' }, 'fb'), '标签'),
    assert.equal(resolveNodeManagerName({}, 'fb'), 'fb'),
    assert.equal(resolveNodeManagerName(), ''));
});

test('nodeManagerModel: 空白显示名被跳过并回退', () => {
  (assert.equal(resolveNodeManagerName({ name: '   ', title: '标题' }, 'fb'), '标题'),
    assert.equal(resolveNodeManagerName({ name: '  ' }, 'fb'), 'fb'),
    assert.equal(resolveNodeManagerName({ name: 42 }, 'fb'), '42'));
});

test('nodeManagerModel: 空输入返回空模型', () => {
  const model = buildNodeManagerModel();
  (assert.deepEqual(model.roots, []),
    assert.deepEqual(model.items, []),
    assert.equal(model.totalNodeCount, 0),
    assert.equal(model.visibleNodeCount, 0),
    assert.equal(model.matchingContentCount, 0),
    assert.equal(model.totalGroupCount, 0),
    assert.equal(model.visibleGroupCount, 0),
    assert.equal(model.filter, 'all'),
    assert.equal(model.query, ''));
});

test('nodeManagerModel: 数组入参按稳定顺序展开并保留 sourceIndex', () => {
  const model = buildNodeManagerModel({
      nodes: [
        { id: 'n2', type: 'source-image' },
        { id: 'n1', type: 'source-text' },
      ],
    }),
    byId = indexById(model.items);
  (assert.deepEqual(
    model.items.map((item) => item.id),
    ['n2', 'n1'],
  ),
    assert.equal(byId.get('n2').sourceIndex, 0),
    assert.equal(byId.get('n1').sourceIndex, 1),
    assert.equal(byId.get('n2').depth, 0),
    assert.equal(byId.get('n1').category, 'text'));
});

test('nodeManagerModel: 对象入参按键序展开且 id 取 node.id 优先', () => {
  const model = buildNodeManagerModel({
      nodes: {
        keyA: { id: 'realA', type: 'source-text' },
        keyB: { type: 'source-image' },
      },
    }),
    byId = indexById(model.items);
  (assert.deepEqual(
    model.items.map((item) => item.id),
    ['realA', 'keyB'],
  ),
    assert.equal(byId.get('realA').name, 'realA'),
    assert.equal(byId.get('keyB').name, 'keyB'));
});

test('nodeManagerModel: 重复 id 只保留首个出现', () => {
  const model = buildNodeManagerModel({
    nodes: [
      { id: 'dup', type: 'source-text', name: 'first' },
      { id: 'dup', type: 'source-image', name: 'second' },
    ],
  });
  (assert.equal(model.items.length, 1),
    assert.equal(model.items[0].name, 'first'),
    assert.equal(model.items[0].category, 'text'));
});

test('nodeManagerModel: 分组父子关系按 parentId 组装', () => {
  const model = buildNodeManagerModel({
      nodes: [
        { id: 'g1', type: 'group', name: '组' },
        { id: 'n1', type: 'source-image', parentId: 'g1' },
        { id: 'n2', type: 'source-text', parentId: 'g1' },
      ],
    }),
    byId = indexById(model.items);
  (assert.deepEqual(
    model.roots.map((item) => item.id),
    ['g1'],
  ),
    assert.equal(byId.get('g1').childCount, 2),
    assert.equal(byId.get('g1').descendantContentCount, 2),
    assert.equal(byId.get('n1').depth, 1),
    assert.equal(byId.get('n2').depth, 1),
    assert.equal(model.totalNodeCount, 2),
    assert.equal(model.visibleNodeCount, 2),
    assert.equal(model.totalContentCount, 2),
    assert.equal(model.matchingContentCount, 2),
    assert.equal(model.totalGroupCount, 1),
    assert.equal(model.visibleGroupCount, 1));
});

test('nodeManagerModel: parentId 指向非分组、指向自身或不存在时降级为根', () => {
  const model = buildNodeManagerModel({
    nodes: [
      { id: 'leaf', type: 'source-image', parentId: 'other-leaf' },
      { id: 'other-leaf', type: 'source-text' },
      { id: 'self', type: 'group', parentId: 'self' },
      { id: 'orphan', type: 'group', parentId: 'missing' },
    ],
  });
  assert.deepEqual(model.roots.map((item) => item.id).sort(), ['leaf', 'orphan', 'other-leaf', 'self']);
});

test('nodeManagerModel: 互相引用的分组环被打断，较早的节点成为根', () => {
  const model = buildNodeManagerModel({
      nodes: [
        { id: 'a', type: 'group', parentId: 'b' },
        { id: 'b', type: 'group', parentId: 'a' },
      ],
    }),
    byId = indexById(model.items);
  (assert.deepEqual(
    model.roots.map((item) => item.id),
    ['a'],
  ),
    assert.equal(byId.get('b').parentId, 'a'),
    assert.equal(byId.get('b').depth, 1),
    assert.equal(byId.get('a').descendantContentCount, 0));
});

test('nodeManagerModel: 三节点分组环同样只断一处且保持父子可达', () => {
  const model = buildNodeManagerModel({
      nodes: [
        { id: 'a', type: 'group', parentId: 'b' },
        { id: 'b', type: 'group', parentId: 'c' },
        { id: 'c', type: 'group', parentId: 'a' },
      ],
    }),
    byId = indexById(model.items);
  (assert.equal(model.roots.length, 1),
    assert.equal(model.roots[0].id, 'a'),
    assert.equal(byId.get('a').parentId, ''),
    assert.equal(byId.get('c').depth, 1),
    assert.equal(byId.get('b').depth, 2),
    assert.equal(byId.get('b').parentId, 'c'),
    assert.equal(model.items.length, 3));
});

test('nodeManagerModel: 分类过滤裁剪叶子并丢弃空分组', () => {
  const nodes = [
      { id: 'g1', type: 'group' },
      { id: 'img', type: 'source-image', parentId: 'g1' },
      { id: 'vid', type: 'source-video' },
    ],
    imageModel = buildNodeManagerModel({ nodes, filter: 'image' }),
    audioModel = buildNodeManagerModel({ nodes, filter: 'audio' });
  (assert.deepEqual(
    imageModel.items.map((item) => item.id),
    ['g1', 'img'],
  ),
    assert.equal(imageModel.matchingContentCount, 1),
    assert.equal(imageModel.visibleNodeCount, 1),
    assert.equal(imageModel.totalNodeCount, 2),
    assert.equal(imageModel.visibleGroupCount, 1),
    assert.equal(imageModel.filter, 'image'),
    assert.deepEqual(audioModel.items, []),
    assert.equal(audioModel.totalGroupCount, 1),
    assert.equal(audioModel.visibleGroupCount, 0),
    assert.equal(audioModel.matchingContentCount, 0));
});

test('nodeManagerModel: 查询按名称大小写不敏感匹配叶子', () => {
  const model = buildNodeManagerModel({
      nodes: [
        { id: 'g1', type: 'group', name: 'Material' },
        { id: 'n1', type: 'source-image', name: 'Alpha', parentId: 'g1' },
        { id: 'n2', type: 'source-image', name: 'Beta', parentId: 'g1' },
      ],
      query: 'beta',
    }),
    byId = indexById(model.items);
  (assert.deepEqual(
    model.items.map((item) => item.id),
    ['g1', 'n2'],
  ),
    assert.equal(byId.get('g1').matchingDescendantContentCount, 1),
    assert.equal(model.query, 'beta'),
    assert.equal(model.matchingContentCount, 1),
    assert.equal(model.visibleNodeCount, 1));
});

test('nodeManagerModel: 分组名称命中时继承给全部子孙', () => {
  const model = buildNodeManagerModel({
    nodes: [
      { id: 'g1', type: 'group', name: 'Foo Group' },
      { id: 'n1', type: 'source-image', name: 'bar', parentId: 'g1' },
      { id: 'n2', type: 'source-text', name: 'baz', parentId: 'g1' },
    ],
    query: 'foo',
  });
  assert.deepEqual(
    model.items.map((item) => item.id),
    ['g1', 'n1', 'n2'],
  );
});

test('nodeManagerModel: 查询词首尾空白被归一化', () => {
  const model = buildNodeManagerModel({
    nodes: [{ id: 'n1', type: 'source-text', name: 'Hello World' }],
    query: '  hello ',
  });
  (assert.deepEqual(
    model.items.map((item) => item.id),
    ['n1'],
  ),
    assert.equal(model.query, 'hello'));
});

test('nodeManagerModel: 折叠分组隐藏其后代但仍计入匹配数', () => {
  const model = buildNodeManagerModel({
      nodes: [
        { id: 'g1', type: 'group', name: 'g' },
        { id: 'n1', type: 'source-image', parentId: 'g1' },
      ],
      collapsedGroupIds: ['g1'],
    }),
    byId = indexById(model.items);
  (assert.deepEqual(
    model.items.map((item) => item.id),
    ['g1'],
  ),
    assert.equal(byId.get('g1').collapsed, true),
    assert.equal(model.visibleNodeCount, 0),
    assert.equal(model.visibleGroupCount, 1),
    assert.equal(model.matchingContentCount, 1),
    assert.equal(model.visibleContentCount, 0));
});

test('nodeManagerModel: collapsedGroupIds 接受单个字符串', () => {
  const model = buildNodeManagerModel({
    nodes: [
      { id: 'g1', type: 'group' },
      { id: 'n1', type: 'source-image', parentId: 'g1' },
    ],
    collapsedGroupIds: 'g1',
  });
  assert.deepEqual(
    model.items.map((item) => item.id),
    ['g1'],
  );
});

test('nodeManagerModel: 未折叠的嵌套分组按深度展开', () => {
  const model = buildNodeManagerModel({
    nodes: [
      { id: 'g1', type: 'group' },
      { id: 'g2', type: 'group', parentId: 'g1' },
      { id: 'n1', type: 'source-image', parentId: 'g2' },
    ],
  });
  (assert.deepEqual(
    model.items.map((item) => item.id),
    ['g1', 'g2', 'n1'],
  ),
    assert.equal(model.items[2].depth, 2),
    assert.equal(model.totalGroupCount, 2),
    assert.equal(model.visibleGroupCount, 2),
    assert.equal(model.totalNodeCount, 1));
});

test('nodeManagerModel: rows 与 items 同引用，groupIds 汇总全部分组', () => {
  const model = buildNodeManagerModel({
    nodes: [
      { id: 'g1', type: 'group' },
      { id: 'g2', type: 'group' },
      { id: 'n1', type: 'source-image', parentId: 'g1' },
    ],
  });
  (assert.equal(model.rows, model.items),
    assert.deepEqual([...model.groupIds].sort(), ['g1', 'g2']),
    assert.equal(model.visibleContentCount, model.visibleNodeCount));
});

test('nodeManagerModel: buildNodeManagerListModel 与 buildNodeManagerModel 同实现', () => {
  assert.equal(buildNodeManagerListModel, buildNodeManagerModel);
});
