import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCollageItemFrames } from '../collage/collageFactory.js';
import { createDropTargetSpatialQuery } from './dropTargetSpatialQuery.js';

const stateOf = (nodes, persistRev = 1) => ({ nodes, _persistRev: persistRev });

test('dropTargetSpatialQuery: 没有 nodes 时返回空数组', () => {
  const query = createDropTargetSpatialQuery();
  assert.deepEqual(query({}, 0, 0), []);
  assert.deepEqual(query({ _persistRev: 1 }, 0, 0), []);
  assert.deepEqual(query({ nodes: {} }, 0, 0), []);
  assert.throws(() => query(undefined, 0, 0), TypeError, '入参本身是必填的，缺了会抛错而不是静默返回');
});

test('dropTargetSpatialQuery: 分镜节点按 x/y 加格子尺寸建矩形，命中返回节点实例', () => {
  const node = { id: 's1', type: 'storyboard', x: 100, y: 200, width: 400, height: 300, cols: 2, rows: 2 };
  const nodes = { s1: node };
  const query = createDropTargetSpatialQuery();

  assert.deepEqual(query(stateOf(nodes), 150, 250), [node]);
  assert.deepEqual(query(stateOf(nodes), -2000, 250), [], '点在矩形左侧很远');
  assert.deepEqual(query(stateOf(nodes), 150, 5000), [], '点在矩形下方很远');
});

test('dropTargetSpatialQuery: 既不是分镜也不是拼贴的节点不参与命中', () => {
  const nodes = { n1: { id: 'n1', type: 'ai-image', x: 0, y: 0, width: 200, height: 200 } };
  const query = createDropTargetSpatialQuery();
  assert.deepEqual(query(stateOf(nodes), 100, 100), []);
});

test('dropTargetSpatialQuery: 分镜缺省尺寸时矩形退化成原点，只有原点本身才命中', () => {
  const node = { id: 's1', type: 'storyboard', x: 0, y: 0 };
  const query = createDropTargetSpatialQuery();
  assert.deepEqual(query(stateOf({ s1: node }), 0, 0), [node]);
  assert.deepEqual(query(stateOf({ s1: node }), 400, 400), [], '退化矩形不会铺满一整格');
  assert.deepEqual(query(stateOf({ s1: node }), 5000, 5000), []);
});

test('dropTargetSpatialQuery: 拼贴节点按子项包围盒建矩形', () => {
  const node = { id: 'c1', type: 'collage', x: 40, y: 60, width: 100, height: 100, items: [{ id: 'i1' }] };
  const frames = resolveCollageItemFrames(node)
    .map((entry) => entry.frame)
    .filter(Boolean);
  assert.ok(frames.length > 0, '拼贴至少解析出一个子项框');

  const minX = Math.min(...frames.map((frame) => frame.x));
  const minY = Math.min(...frames.map((frame) => frame.y));
  const insideX = node.x + minX + frames[0].width / 2;
  const insideY = node.y + minY + frames[0].height / 2;

  const query = createDropTargetSpatialQuery();
  assert.deepEqual(query(stateOf({ c1: node }), insideX, insideY), [node]);
  assert.deepEqual(query(stateOf({ c1: node }), insideX, insideY - 500), []);
});

test('dropTargetSpatialQuery: 空子项的拼贴不建矩形', () => {
  const node = { id: 'c1', type: 'collage', x: 0, y: 0, width: 100, height: 100, items: [] };
  const query = createDropTargetSpatialQuery();
  assert.deepEqual(query(stateOf({ c1: node }), 0, 0), []);
});

test('dropTargetSpatialQuery: nodes 引用换了以后按新几何重建索引', () => {
  const first = { id: 's1', type: 'storyboard', x: 0, y: 0, width: 100, height: 100 };
  const second = { id: 's2', type: 'storyboard', x: 900, y: 900, width: 100, height: 100 };
  const query = createDropTargetSpatialQuery();

  assert.deepEqual(query(stateOf({ s1: first }), 50, 50), [first]);
  assert.deepEqual(query(stateOf({ s2: second }), 50, 50), [], '换图后旧矩形不再命中');
  assert.deepEqual(query(stateOf({ s2: second }), 950, 950), [second]);
});

test('dropTargetSpatialQuery: _persistRev 不是有限数时每次都重建，结果仍然正确', () => {
  const node = { id: 's1', type: 'storyboard', x: 0, y: 0, width: 100, height: 100 };
  const query = createDropTargetSpatialQuery();
  assert.deepEqual(query({ nodes: { s1: node } }, 50, 50), [node]);
  assert.deepEqual(query({ nodes: { s1: node }, _persistRev: undefined }, 50, 50), [node]);
});

test('dropTargetSpatialQuery: 命中结果里被删掉的节点会被过滤', () => {
  const node = { id: 'ghost', type: 'storyboard', x: 0, y: 0, width: 100, height: 100 };
  const nodes = { ghost: node };
  const query = createDropTargetSpatialQuery();
  assert.deepEqual(query(stateOf(nodes), 50, 50), [node]);
  delete nodes.ghost;
  assert.deepEqual(query(stateOf(nodes, 2), 50, 50), []);
});
