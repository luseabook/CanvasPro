import test from 'node:test';
import assert from 'node:assert/strict';

import { bindSegmentRetakeInput, getSegmentRetakeVideoEdges } from './segmentRetakeInputBinding.js';

function createStore({ nodes = {}, edges = [], incoming = [] } = {}) {
  const calls = { added: [], removed: [], updated: [] };
  return {
    calls,
    getState: () => ({ nodes }),
    getIncomingEdges: () => incoming,
    batch: (fn) => fn(),
    addNode: (n) => calls.added.push(n),
    addEdge: (e) => calls.added.push(e),
    removeEdge: (id) => calls.removed.push(id),
    updateNodeData: (id, patch) => calls.updated.push([id, patch]),
  };
}

const NODES = {
  target: { id: 'target', type: 'ai-video', x: 0, y: 0, width: 560, height: 320 },
  src: { id: 'src', type: 'source-video', name: '原片', x: -700, y: 0, width: 560, height: 320, localPath: 'data/uploads/a.mp4' },
  text: { id: 'text', type: 'ai-text', x: 0, y: 500 },
};

test('segmentRetakeInputBinding: 只认视频入边或 referenceVideo 槽位', () => {
  const store = createStore({
    nodes: NODES,
    incoming: [
      { id: 'e1', sourceId: 'src', refSlot: 'default' },
      { id: 'e2', sourceId: 'text', refSlot: 'default' },
      { id: 'e3', sourceId: 'text', refSlot: 'referenceVideo' },
    ],
  });
  assert.deepEqual(
    getSegmentRetakeVideoEdges(store, 'target').map((e) => e.id),
    ['e1', 'e3'],
  );
});

test('segmentRetakeInputBinding: 全长模式复用来源节点并清理多余视频边', () => {
  const store = createStore({
    nodes: NODES,
    incoming: [
      { id: 'keep', sourceId: 'src', sourceMediaKey: 'key-1' },
      { id: 'drop', sourceId: 'text', refSlot: 'referenceVideo' },
    ],
  });
  const nodePatch = { segmentRetake: { sourceNodeId: 'src', sourceMediaKey: 'key-1', materializedClip: null } };
  const changed = bindSegmentRetakeInput({ store, nodeId: 'target', nodePatch, fullLength: true });

  assert.equal(changed, true);
  assert.deepEqual(store.calls.removed, ['drop'], '只留匹配的那条视频边');
  assert.deepEqual(store.calls.added, []);
  assert.deepEqual(store.calls.updated, [['target', nodePatch]]);
});

test('segmentRetakeInputBinding: 物化片段会新建 source-video 节点并接上引用边', () => {
  const store = createStore({
    // 注意：节点必须带完整几何信息——core/math.js 的 findAvailablePosition 遇到缺坐标的节点会死循环（已知缺陷）
    nodes: {
      ...NODES,
      staleClip: { id: 'staleClip', type: 'source-video', localPath: 'data/uploads/old.mp4', x: 900, y: 0, width: 504, height: 288 },
    },
    incoming: [],
  });
  const nodePatch = {
    segmentRetake: {
      sourceNodeId: 'src',
      sourceMediaKey: 'data/uploads/clip.mp4',
      materializedClip: { nodeId: 'staleClip', localPath: 'data/uploads/clip.mp4', durationSec: 3.5 },
    },
  };
  const changed = bindSegmentRetakeInput({ store, nodeId: 'target', nodePatch, fullLength: false });

  assert.equal(changed, true);
  const clip = store.calls.added.find((n) => n.type === 'source-video');
  assert.ok(clip, '创建了 source-video 节点');
  assert.equal(clip.localPath, 'data/uploads/clip.mp4');
  assert.equal(clip.originalLocalPath, 'data/uploads/clip.mp4');
  assert.equal(clip.src, '/data/uploads/clip.mp4');
  assert.equal(clip.videoUrl, '/data/uploads/clip.mp4');
  assert.equal(clip.videoDuration, 3.5);
  assert.equal(clip.fixedSize, true);
  assert.equal(clip.needsAutoResize, false);
  assert.equal(clip.name, '剪辑自 原片');
  assert.equal(clip.id.startsWith('source-video-retake'), true);

  const edge = store.calls.added.find((n) => n.refSlot === 'referenceVideo');
  assert.ok(edge, '接上了 referenceVideo 边');
  assert.equal(edge.sourceId, clip.id);
  assert.equal(edge.targetId, 'target');
  assert.equal(edge.sourceMediaKey, 'data/uploads/clip.mp4');
  assert.equal(nodePatch.segmentRetake.materializedClip.nodeId, clip.id, '写回物化节点 id');
  assert.deepEqual(store.calls.updated, [['target', nodePatch]]);
});

test('segmentRetakeInputBinding: 已有匹配边时不重复接线', () => {
  const store = createStore({
    nodes: NODES,
    incoming: [{ id: 'keep', sourceId: 'src', sourceMediaKey: 'key-1' }],
  });
  const nodePatch = { segmentRetake: { sourceNodeId: 'src', sourceMediaKey: 'key-1', materializedClip: null } };
  const changed = bindSegmentRetakeInput({ store, nodeId: 'target', nodePatch, fullLength: true });

  assert.equal(changed, false, '既没有新增也没有删除');
  assert.deepEqual(store.calls.added, []);
  assert.deepEqual(store.calls.removed, []);
  assert.deepEqual(store.calls.updated, [['target', nodePatch]], '节点数据仍然写回');
});
