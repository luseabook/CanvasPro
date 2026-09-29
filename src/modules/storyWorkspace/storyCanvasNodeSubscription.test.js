import test from 'node:test';
import assert from 'node:assert/strict';

import { getStoryCanvasMediaNodeSnapshot, subscribeStoryCanvasMediaNodeChanges } from './storyCanvasNodeSubscription.js';

function mediaNode(id, { type = 'ai-image', rev = 1 } = {}) {
  return { id, type, _bizRev: rev };
}

function createStore(state) {
  const store = {
    state,
    getStateRaw: () => state,
    subscribeSelector: (selector, listener) => {
      store.selector = selector;
      store.listener = listener;
      return () => delete store.listener;
    },
  };
  return store;
}

test('storyCanvasNodeSubscription: 快照只含画布媒体节点', () => {
  const store = createStore({
    nodes: {
      m1: mediaNode('m1'),
      m2: mediaNode('m2', { type: 'ai-video' }),
      t1: { id: 't1', type: 'ai-text' },
      t2: { id: 't2', type: 'source-video' },
    },
  });
  const snapshot = getStoryCanvasMediaNodeSnapshot({ graphStore: store, getActiveCanvasId: () => 'c-1' });
  assert.equal(snapshot.canvasId, 'c-1');
  // 画面媒体节点 = 图片类 + 视频类；source-video 属于视频类，也算媒体节点
  assert.deepEqual(snapshot.nodes.map((n) => n.id).sort(), ['m1', 'm2', 't2']);
});

test('storyCanvasNodeSubscription: 依赖不全时抛错', () => {
  assert.throws(
    () => subscribeStoryCanvasMediaNodeChanges({ graphStore: {}, getActiveCanvasId: () => 'c', listener: () => {} }),
    { message: 'story canvas media node subscription dependencies are incomplete' },
  );
  const store = createStore({ nodes: {} });
  assert.throws(
    () => subscribeStoryCanvasMediaNodeChanges({ graphStore: store, getActiveCanvasId: () => 'c' }),
    { message: 'story canvas media node subscription dependencies are incomplete' },
  );
});

test('storyCanvasNodeSubscription: 首次回调上报全部媒体节点，之后只报变化', () => {
  const store = createStore({ nodes: { m1: mediaNode('m1'), m2: mediaNode('m2') }, _persistRev: 1 });
  const events = [];
  subscribeStoryCanvasMediaNodeChanges({ graphStore: store, getActiveCanvasId: () => 'c-1', listener: (e) => events.push(e) });

  store.listener();
  assert.deepEqual(events.map((e) => e.nodes.map((n) => n.id)), [['m1', 'm2']], '首次全量');

  store.state._persistRev = 2;
  store.listener();
  assert.equal(events.length, 1, '无变化不重复上报');

  store.state._persistRev = 3;
  store.state.nodes.m1._bizRev = 2;
  store.listener();
  assert.deepEqual(events[1].nodes.map((n) => n.id), ['m1'], '只上报修订变化的节点');

  store.state._persistRev = 4;
  delete store.state.nodes.m2;
  store.listener();
  assert.equal(events.length, 3);
  assert.deepEqual(events[2].nodes.map((n) => n.id), ['m2'], '消失的节点以占位上报');
});

test('storyCanvasNodeSubscription: 画布切走时重置，切回按全量上报', () => {
  let canvasId = 'c-1';
  const store = createStore({ nodes: { m1: mediaNode('m1') }, _persistRev: 1 });
  const events = [];
  subscribeStoryCanvasMediaNodeChanges({ graphStore: store, getActiveCanvasId: () => canvasId, listener: (e) => events.push(e) });

  store.listener();
  assert.equal(events.length, 1);

  canvasId = '';
  store.state._persistRev = 2;
  store.listener();
  assert.equal(events.length, 1, '没有活动画布时静默');

  canvasId = 'c-2';
  store.state._persistRev = 3;
  store.listener();
  assert.equal(events.length, 2, '换画布后重新全量');
  assert.deepEqual(events[1].nodes.map((n) => n.id), ['m1']);
});

test('storyCanvasNodeSubscription: 监听器抛错被吞掉并告警', () => {
  const store = createStore({ nodes: { m1: mediaNode('m1') }, _persistRev: 1 });
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args[0]);
  try {
    subscribeStoryCanvasMediaNodeChanges({
      graphStore: store,
      getActiveCanvasId: () => 'c-1',
      listener: () => {
        throw new Error('boom');
      },
    });
    store.listener();
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0], '[storyCanvasNodeSubscription] 媒体节点同步失败');
  } finally {
    console.warn = originalWarn;
  }
});
