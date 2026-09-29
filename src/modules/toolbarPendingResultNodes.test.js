import test from 'node:test';
import assert from 'node:assert/strict';
import appStore from '../core/stores/appStore.js';
import {
  addToolbarPendingResultNodes,
  persistToolbarResultNodes,
  selectToolbarResultNodes,
  updateToolbarResultNode,
  updateToolbarResultNodes,
} from './toolbarPendingResultNodes.js';

const stateNodes = () => appStore.getStateRaw().nodes || {};
let nextId = 0;
const newNode = (extra = {}) => {
  nextId += 1;
  const id = 'tp-' + nextId;
  return { id, type: 'ai-image', x: nextId * 10, y: 0, width: 200, height: 100, ...extra };
};

test('toolbarPendingResultNodes: 选择节点会把 id 规整、去空，并落到 store', () => {
  const node = newNode();
  addToolbarPendingResultNodes({ nodes: [node], persist: false });

  assert.deepEqual(selectToolbarResultNodes(['  ' + node.id + '  ']), [node.id]);
  assert.deepEqual(selectToolbarResultNodes([]), [], '空数组直接返回空，不碰 store');
  assert.deepEqual(selectToolbarResultNodes([null, '   ']), []);
});

test('toolbarPendingResultNodes: 选择时单个非数组入参也会被接受', () => {
  const node = newNode();
  addToolbarPendingResultNodes({ nodes: [node], persist: false });
  assert.deepEqual(selectToolbarResultNodes(node.id), [node.id]);
});

test('toolbarPendingResultNodes: 落节点时过滤掉不合法的项并返回成功落地的 id', () => {
  const good = newNode();
  const ids = addToolbarPendingResultNodes({
    nodes: [good, null, 'nope', { id: '   ' }, { noId: true }],
    persist: false,
  });

  assert.deepEqual(ids, [good.id]);
  assert.equal(Boolean(stateNodes()[good.id]), true, '节点确实进了 store');
});

test('toolbarPendingResultNodes: 全部不合法时不落节点、返回空数组', () => {
  const before = Object.keys(stateNodes()).length;
  assert.deepEqual(addToolbarPendingResultNodes({ nodes: [null, {}], persist: false }), []);
  assert.deepEqual(addToolbarPendingResultNodes({ persist: false }), []);
  assert.equal(Object.keys(stateNodes()).length, before, 'store 没被改动');
});

test('toolbarPendingResultNodes: 多个节点会被选中，持久化开关控制是否写本地缓存', () => {
  const originalWindow = globalThis.window;
  const saves = [];
  globalThis.window = { _triggerLocalCacheSave: () => saves.push(true) };
  try {
    const a = newNode();
    const b = newNode();
    const ids = addToolbarPendingResultNodes({ nodes: [a, b], persist: true });
    assert.deepEqual(ids, [a.id, b.id]);
    assert.equal(saves.length, 1, 'persist 为真时触发一次本地缓存保存');

    const c = newNode();
    addToolbarPendingResultNodes({ nodes: [c], persist: false });
    assert.equal(saves.length, 1, 'persist 为假时不触发');
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('toolbarPendingResultNodes: 没有 window 或保存钩子缺失时持久化是空操作', () => {
  const originalWindow = globalThis.window;
  try {
    delete globalThis.window;
    assert.equal(persistToolbarResultNodes(), undefined);
    globalThis.window = {};
    assert.equal(persistToolbarResultNodes(), undefined);
    globalThis.window = {
      _triggerLocalCacheSave: () => {
        throw new Error('boom');
      },
    };
    assert.equal(persistToolbarResultNodes(), undefined, '钩子抛错被吞掉');
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('toolbarPendingResultNodes: 更新单个节点要求节点存在且补丁是对象', () => {
  const node = newNode();
  addToolbarPendingResultNodes({ nodes: [node], persist: false });

  assert.equal(updateToolbarResultNode(node.id, { note: 'ok' }), true);
  assert.equal(stateNodes()[node.id].note, 'ok');

  assert.equal(updateToolbarResultNode('  ' + node.id + '  ', { note: 'trimmed' }), true);
  assert.equal(updateToolbarResultNode('missing-node', { note: 'x' }), false);
  assert.equal(updateToolbarResultNode(node.id, null), false);
  assert.equal(updateToolbarResultNode(node.id, 'nope'), false);
  assert.equal(updateToolbarResultNode('', { note: 'x' }), false);
});

test('toolbarPendingResultNodes: 批量更新会跳过缺字段的项，全部缺字段则不做任何事', () => {
  const node = newNode();
  addToolbarPendingResultNodes({ nodes: [node], persist: false });

  updateToolbarResultNodes([
    { nodeId: node.id, patch: { bulk: 1 } },
    { id: 'missing-node', patch: { bulk: 2 } },
    { nodeId: '   ', patch: { bulk: 3 } },
    { nodeId: node.id },
    null,
  ]);
  assert.equal(stateNodes()[node.id].bulk, 1);

  const before = JSON.stringify(stateNodes()[node.id]);
  assert.equal(updateToolbarResultNodes(), undefined);
  assert.equal(updateToolbarResultNodes([null, {}]), undefined);
  assert.equal(JSON.stringify(stateNodes()[node.id]), before);
});

test('toolbarPendingResultNodes: 批量更新支持用 id 字段代替 nodeId', () => {
  const node = newNode();
  addToolbarPendingResultNodes({ nodes: [node], persist: false });

  updateToolbarResultNodes([{ id: node.id, patch: { viaId: 'yes' } }]);
  assert.equal(stateNodes()[node.id].viaId, 'yes');
});
