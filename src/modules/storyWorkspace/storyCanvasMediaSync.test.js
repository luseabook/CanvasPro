import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_CLIP_MEDIA_TYPE_IMAGE,
  STORY_CLIP_MEDIA_TYPE_VIDEO,
} from './storyClipFrames.js';
import {
  buildStoryCanvasMediaFrame,
  buildStoryClipFrameCanvasNodeData,
  createStoryClipFrameCanvasAdapter,
  deleteStoryCanvasMediaNodes,
  isStoryCanvasMediaNode,
  reconcileStoryCanvasMediaNodes,
  resolveStoryCanvasNodeMedia,
  syncStoryClipFrameToCanvas,
} from './storyCanvasMediaSync.js';

const imageNode = (extra = {}) => ({ id: 'n1', type: 'ai-image', imageUrl: 'http://x/a.png', ...extra });
const videoNode = (extra = {}) => ({ id: 'v1', type: 'ai-video', videoUrl: 'http://x/v.mp4', videoDuration: 5, ...extra });

const projectData = (extra = {}) => ({
  episodes: [{ id: 'e1', title: '第一集', clips: [{ id: 'c1', title: '片段一' }] }],
  ...extra,
});

function createCanvasAdapterHarness(overrides = {}) {
  const graph = { nodes: {}, edges: [] };
  const calls = { createNodeAtCursor: [], updateNodeData: [], deleteNodes: [], commit: 0, switchTo: [] };
  const canvasTabManager = {
    activeCanvasId: 'c1',
    canvases: [{ id: 'c1' }, { id: 'c2' }],
    getActiveCanvasId: () => canvasTabManager.activeCanvasId,
    switchTo: async (id) => {
      calls.switchTo.push(id);
      canvasTabManager.activeCanvasId = id;
      return true;
    },
    getMultiDataSnapshot: () => ({ canvases: canvasTabManager.canvases }),
    ...overrides.canvas,
  };

  let seq = 0;
  const dependencies = {
    canvasTabManager,
    createNodeAtCursor(type, width, height, name, options) {
      calls.createNodeAtCursor.push([type, width, height, name, options]);
      seq += 1;
      const node = { id: 'new-' + seq, type, width, height, name };
      graph.nodes[node.id] = node;
      return node;
    },
    getGraphState: () => graph,
    updateNodeData(id, patch) {
      calls.updateNodeData.push([id, patch]);
      graph.nodes[id] = { ...graph.nodes[id], ...patch };
    },
    deleteNodes(ids, options) {
      calls.deleteNodes.push([ids, options]);
      for (const id of ids) delete graph.nodes[id];
    },
    commit: () => {
      calls.commit += 1;
    },
    ...overrides.dependencies,
  };

  const put = (id, extra = {}) => {
    graph.nodes[id] = { id, type: 'source-image', ...extra };
    return graph.nodes[id];
  };

  return {
    calls,
    graph,
    canvasTabManager,
    put,
    dependencies,
    adapter: createStoryClipFrameCanvasAdapter(dependencies),
  };
}

test('storyCanvasMediaSync: 只有图像与视频两类节点算画布媒体节点', () => {
  for (const type of ['source-image', 'ai-image', 'image', 'source-video', 'ai-video', 'video']) {
    assert.equal(isStoryCanvasMediaNode({ type }), true, type + ' 应该算');
  }
  for (const type of ['ai-text', 'storyboard', 'collage', '', undefined]) {
    assert.equal(isStoryCanvasMediaNode({ type }), false, String(type) + ' 不该算');
  }
  assert.equal(isStoryCanvasMediaNode(), false);
});

test('storyCanvasMediaSync: 图像节点的媒体信息按候选字段取第一个非空值', () => {
  const media = resolveStoryCanvasNodeMedia(imageNode({ localPath: 'data/uploads/a.png', fileName: ' a.png ' }));
  assert.equal(media.mediaType, STORY_CLIP_MEDIA_TYPE_IMAGE);
  assert.equal(media.imageUrl, 'http://x/a.png');
  assert.equal(media.sourceUrl, 'http://x/a.png', '没有 sourceUrl 时回落到主地址');
  assert.equal(media.localPath, 'data/uploads/a.png');
  assert.equal(media.fileName, 'a.png');
});

test('storyCanvasMediaSync: 图像节点可以只靠缩略图或本地路径成立', () => {
  const byThumb = resolveStoryCanvasNodeMedia({ type: 'ai-image', thumbUrl: 'http://x/t.png' });
  assert.equal(byThumb.imageUrl, 'http://x/t.png', '缩略图在主地址候选链里，拿它顶上');
  assert.equal(byThumb.sourceUrl, 'http://x/t.png');
  assert.equal(resolveStoryCanvasNodeMedia({ type: 'ai-image', localPath: 'data/uploads/a.png' }).localPath, 'data/uploads/a.png');
  assert.equal(resolveStoryCanvasNodeMedia({ type: 'ai-image' }), null, '什么都取不到就是 null');
});

test('storyCanvasMediaSync: 图像节点的多图按 index 字段选主图，越界夹回边界', () => {
  const node = {
    type: 'ai-image',
    mainImageIndex: 1,
    images: [{ imageUrl: 'http://x/1.png' }, { imageUrl: 'http://x/2.png' }],
  };
  assert.equal(resolveStoryCanvasNodeMedia(node).imageUrl, 'http://x/2.png');

  const clamped = { type: 'ai-image', mainImageIndex: 99, images: [{ imageUrl: 'http://x/1.png' }] };
  assert.equal(resolveStoryCanvasNodeMedia(clamped).imageUrl, 'http://x/1.png');

  const byActive = { type: 'ai-image', activeImageIndex: -5, images: [{ imageUrl: 'http://x/1.png' }] };
  assert.equal(resolveStoryCanvasNodeMedia(byActive).imageUrl, 'http://x/1.png');
});

test('storyCanvasMediaSync: 视频节点带时长与帧率，取不到地址时为 null', () => {
  const media = resolveStoryCanvasNodeMedia(videoNode({ videoFps: 24, thumbUrl: 'http://x/t.png' }));
  assert.equal(media.mediaType, STORY_CLIP_MEDIA_TYPE_VIDEO);
  assert.equal(media.videoUrl, 'http://x/v.mp4');
  assert.equal(media.videoDuration, 5);
  assert.equal(media.videoFps, 24);
  assert.equal(media.thumbUrl, 'http://x/t.png');

  assert.equal(resolveStoryCanvasNodeMedia({ type: 'ai-video' }), null);
  assert.equal(resolveStoryCanvasNodeMedia({ type: 'ai-text', text: 'x' }), null);
});

test('storyCanvasMediaSync: 组帧要求是媒体节点、不能是剧情片段视频、且画布与节点 id 齐全', () => {
  assert.equal(buildStoryCanvasMediaFrame({ node: { type: 'ai-text' }, canvasId: 'c1' }), null);
  assert.equal(
    buildStoryCanvasMediaFrame({
      node: videoNode({ storyWorkspaceBinding: { kind: 'clip-video' } }),
      canvasId: 'c1',
    }),
    null,
    '剧情片段视频由另一条链路处理',
  );
  assert.equal(buildStoryCanvasMediaFrame({ node: imageNode(), canvasId: '  ' }), null);
  assert.equal(buildStoryCanvasMediaFrame({ node: { type: 'ai-image', imageUrl: 'http://x/a.png' }, canvasId: 'c1' }), null);
  assert.equal(buildStoryCanvasMediaFrame({ node: imageNode(), canvasId: 'c1' }).canvasNodeId, 'n1');
});

test('storyCanvasMediaSync: 图像组帧的默认 id、来源键与时间字段固定', () => {
  const frame = buildStoryCanvasMediaFrame({ canvasId: 'c1', node: imageNode({ name: ' 主图 ' }), now: () => 1000 });

  assert.equal(frame.mediaType, STORY_CLIP_MEDIA_TYPE_IMAGE);
  assert.equal(frame.id.startsWith('story-canvas-media-'), true);
  assert.equal(frame.sourceKey, 'canvas-node:c1:n1');
  assert.equal(frame.canvasId, 'c1');
  assert.equal(frame.canvasNodeId, 'n1');
  assert.equal(frame.name, '主图');
  assert.equal(frame.currentTimeSec, 0);
  assert.equal(frame.endTimeSec, 0);
  assert.equal(frame.createdAt, 1000);
});

test('storyCanvasMediaSync: 视频组帧把时长写成结束时间', () => {
  const frame = buildStoryCanvasMediaFrame({ canvasId: 'c1', node: videoNode({ videoDuration: 7.5 }), now: () => 1 });
  assert.equal(frame.mediaType, STORY_CLIP_MEDIA_TYPE_VIDEO);
  assert.equal(frame.endTimeSec, 7.5);
});

test('storyCanvasMediaSync: 已有帧的 id 与创建时间会被复用，名字按已有帧兜底', () => {
  const existingFrame = { id: 'f-existing', name: '旧名字', createdAt: 42 };
  const frame = buildStoryCanvasMediaFrame({ canvasId: 'c1', node: imageNode(), existingFrame, now: () => 9999 });
  assert.equal(frame.id, 'f-existing');
  assert.equal(frame.createdAt, 42);
  assert.equal(frame.name, '旧名字');
});

test('storyCanvasMediaSync: 绑定里的集与片段决定归属，取不到就用第一条兜底', () => {
  const bound = buildStoryCanvasMediaFrame({
    canvasId: 'c1',
    node: imageNode({ storyWorkspaceBinding: { clipFrameEpisodeId: 'e1', clipFrameClipId: 'c1' } }),
    projectData: projectData(),
  });
  assert.equal(bound.episodeId, 'e1');
  assert.equal(bound.episodeTitle, '第一集');
  assert.equal(bound.clipId, 'c1');
  assert.equal(bound.clipTitle, '片段一');
  assert.equal(bound.name, '片段一', '节点没名字时用片段标题');

  const fallback = buildStoryCanvasMediaFrame({ canvasId: 'c1', node: imageNode(), projectData: projectData() });
  assert.equal(fallback.episodeId, 'e1');
  assert.equal(fallback.clipId, 'c1');
});

test('storyCanvasMediaSync: 绑定里的 clipFrameId 直接作为帧 id', () => {
  const frame = buildStoryCanvasMediaFrame({
    canvasId: 'c1',
    node: imageNode({ storyWorkspaceBinding: { clipFrameId: 'f-bound' } }),
  });
  assert.equal(frame.id, 'f-bound');
});

test('storyCanvasMediaSync: 对账在缺项目、缺节点数组或画布不匹配时返回 false', () => {
  assert.equal(reconcileStoryCanvasMediaNodes({}, {}), false);
  assert.equal(reconcileStoryCanvasMediaNodes({ project: { id: 'p1', canvasBinding: { canvasId: 'c1' } } }, { canvasId: 'c1', nodes: 'nope' }), false);
  assert.equal(
    reconcileStoryCanvasMediaNodes({ project: { id: 'p1', canvasBinding: { canvasId: 'c2' } } }, { canvasId: 'c1', nodes: [] }),
    false,
  );
});

test('storyCanvasMediaSync: 对账把画布节点写成片段帧，并在无变化时返回 false', () => {
  const entry = { project: { id: 'p1', canvasBinding: { canvasId: 'c1' } }, clipFrames: [] };
  const first = reconcileStoryCanvasMediaNodes(entry, { canvasId: 'c1', nodes: [imageNode()], now: () => 5 });
  assert.equal(first, true);
  assert.equal(entry.clipFrames.length, 1);
  assert.equal(entry.clipFrames[0].canvasNodeId, 'n1');

  const again = reconcileStoryCanvasMediaNodes(entry, { canvasId: 'c1', nodes: [imageNode()], now: () => 5 });
  assert.equal(again, false, '内容一致时不做任何改动');
});

test('storyCanvasMediaSync: 对账会摘掉绑定到别的项目、以及已经不该算媒体的节点帧', () => {
  const entry = { project: { id: 'p1', canvasBinding: { canvasId: 'c1' } }, clipFrames: [] };
  reconcileStoryCanvasMediaNodes(entry, { canvasId: 'c1', nodes: [imageNode()], now: () => 5 });
  assert.equal(entry.clipFrames.length, 1);

  const foreign = reconcileStoryCanvasMediaNodes(entry, {
    canvasId: 'c1',
    nodes: [imageNode({ storyWorkspaceBinding: { projectId: 'other' } })],
  });
  assert.equal(foreign, true);
  assert.equal(entry.clipFrames.length, 0, '别的项目的绑定会被摘掉');

  reconcileStoryCanvasMediaNodes(entry, { canvasId: 'c1', nodes: [imageNode()], now: () => 5 });
  const notMedia = reconcileStoryCanvasMediaNodes(entry, {
    canvasId: 'c1',
    nodes: [{ id: 'n1', type: 'ai-text' }],
  });
  assert.equal(notMedia, true);
  assert.equal(entry.clipFrames.length, 0, '不再是媒体节点就摘掉');
});

test('storyCanvasMediaSync: 片段帧转画布节点数据区分图像与视频，并带上绑定信息', () => {
  const image = buildStoryClipFrameCanvasNodeData({
    project: { id: 'p1' },
    frame: { id: 'f1', name: '帧一', episodeId: 'e1', clipId: 'c1', imageUrl: 'http://x/a.png' },
  });
  assert.equal(image.type, 'source-image');
  assert.equal(image.imageUrl, 'http://x/a.png');
  assert.equal(image.needsAutoResize, true);
  assert.deepEqual(image.storyWorkspaceBinding, {
    projectId: 'p1',
    episodeId: 'e1',
    clipId: 'c1',
    kind: 'clip-frame-media',
    canvasScope: 'project',
    clipFrameId: 'f1',
    clipFrameEpisodeId: 'e1',
    clipFrameClipId: 'c1',
  });

  const video = buildStoryClipFrameCanvasNodeData({
    project: { id: 'p1' },
    frame: { id: 'f2', mediaType: 'video', videoUrl: 'http://x/v.mp4', thumbUrl: 'http://x/t.png', videoDuration: 3, videoFps: 30 },
  });
  assert.equal(video.type, 'source-video');
  assert.equal(video.videoUrl, 'http://x/v.mp4');
  assert.equal(video.thumbUrl, 'http://x/t.png');
  assert.equal(video.posterUrl, 'http://x/t.png', '没有海报时用缩略图兜底');
  assert.equal(video.videoDuration, 3);
  assert.equal(video.videoFps, 30);
  assert.equal(Object.hasOwn(video, 'needsAutoResize'), false);
});

test('storyCanvasMediaSync: 帧画布适配器缺依赖时抛错', () => {
  assert.throws(() => createStoryClipFrameCanvasAdapter(), /story clip frame canvas adapter dependencies are incomplete/);
  assert.throws(
    () => createStoryClipFrameCanvasAdapter({ canvasTabManager: { getActiveCanvasId: () => 'c' } }),
    /dependencies are incomplete/,
  );
});

test('storyCanvasMediaSync: 帧画布适配器的画布存在性与切换语义', async () => {
  const harness = createCanvasAdapterHarness();
  assert.equal(harness.adapter.canvasExists(''), false);
  assert.equal(harness.adapter.canvasExists('c1'), true);
  assert.equal(harness.adapter.canvasExists('c9'), false);

  assert.equal(await harness.adapter.switchCanvas('c1'), true);
  assert.deepEqual(harness.calls.switchTo, [], '已经是当前画布就不切');
  assert.equal(await harness.adapter.switchCanvas('c2'), true);
  assert.equal(await harness.adapter.switchCanvas(''), false);

  const noSwitch = createCanvasAdapterHarness({ canvas: { switchTo: undefined } });
  assert.equal(await noSwitch.adapter.switchCanvas('c2'), false);
});

test('storyCanvasMediaSync: 帧画布适配器建节点用默认尺寸、写回数据并提交', async () => {
  const harness = createCanvasAdapterHarness();
  const node = await harness.adapter.createMediaNode({ type: 'source-image', name: '帧', imageUrl: 'http://x/a.png' }, { sequenceKey: 'seq' });

  assert.deepEqual(harness.calls.createNodeAtCursor[0].slice(0, 4), ['source-image', 0x200, 0x120, '帧']);
  assert.deepEqual(harness.calls.createNodeAtCursor[0][4], { placement: 'viewport-center-sequence', sequenceKey: 'seq' });
  assert.equal(Object.hasOwn(harness.calls.updateNodeData[0][1], 'type'), false);
  assert.equal(harness.calls.commit, 1);
  assert.equal(node.id, 'new-1');
  assert.equal(harness.adapter.nodeExists(node.id), true);

  const broken = createCanvasAdapterHarness({ dependencies: { createNodeAtCursor: () => ({}) } });
  await assert.rejects(() => broken.adapter.createMediaNode({ type: 'source-image' }), /创建片段帧画布节点失败/);
});

test('storyCanvasMediaSync: 帧画布适配器更新与删除的边界', async () => {
  const harness = createCanvasAdapterHarness();
  harness.put('n1');
  assert.equal(await harness.adapter.updateMediaNode('', {}), null);
  const updated = await harness.adapter.updateMediaNode(' n1 ', { type: 'source-image', imageUrl: 'http://x/b.png' });
  assert.equal(updated.id, 'n1');
  assert.equal(harness.calls.commit, 1);

  assert.equal(harness.adapter.deleteNodes([]), false, '没有可删的节点就返回 false');
  assert.equal(harness.adapter.deleteNodes(['missing']), false);
  assert.equal(harness.adapter.deleteNodes(['n1']), true);
  assert.deepEqual(harness.calls.deleteNodes[0], [['n1'], undefined]);

  const noDelete = createCanvasAdapterHarness({ dependencies: { deleteNodes: undefined } });
  assert.equal(noDelete.adapter.deleteNodes(['x']), false);
});

test('storyCanvasMediaSync: 删画布媒体节点要求完整适配器与有效参数', async () => {
  await assert.rejects(() => deleteStoryCanvasMediaNodes({ adapter: {} }), /requires a complete canvas adapter/);
  await assert.rejects(() => deleteStoryCanvasMediaNodes(), /requires a complete canvas adapter/);

  const calls = { canvasExists: [], switchCanvas: [], deleteNodes: [] };
  const adapter = {
    canvasExists: async (id) => {
      calls.canvasExists.push(id);
      return id === 'c1';
    },
    switchCanvas: async (id) => {
      calls.switchCanvas.push(id);
      return true;
    },
    deleteNodes: (ids, options) => {
      calls.deleteNodes.push([ids, options]);
      return true;
    },
  };

  assert.equal(await deleteStoryCanvasMediaNodes({ canvasId: '', nodeIds: ['n1'], adapter }), false);
  assert.equal(await deleteStoryCanvasMediaNodes({ canvasId: 'c1', nodeIds: [], adapter }), false);
  assert.equal(await deleteStoryCanvasMediaNodes({ canvasId: 'c9', nodeIds: ['n1'], adapter }), false);
  assert.deepEqual(calls.deleteNodes, [], '画布不存在时不会去删');

  assert.equal(await deleteStoryCanvasMediaNodes({ canvasId: 'c1', nodeIds: [' n1 ', ''], adapter }), true);
  assert.deepEqual(calls.deleteNodes[0], [['n1'], { canvasId: 'c1' }]);

  const refusing = { ...adapter, switchCanvas: async () => false };
  await assert.rejects(() => deleteStoryCanvasMediaNodes({ canvasId: 'c1', nodeIds: ['n1'], adapter: refusing }), /无法切换到关联画布：c1/);
});

test('storyCanvasMediaSync: 同步片段帧到画布在缺适配器或画布不可用时给出确定结果', async () => {
  await assert.rejects(() => syncStoryClipFrameToCanvas({ adapter: {} }), /requires a complete canvas adapter/);

  const missingAdapter = {
    canvasExists: async () => false,
    switchCanvas: async () => true,
    nodeExists: async () => false,
    createMediaNode: async () => ({ id: 'n' }),
    updateMediaNode: async () => ({ id: 'n' }),
  };
  assert.deepEqual(await syncStoryClipFrameToCanvas({ project: {}, frame: { id: 'f1' }, adapter: missingAdapter }), {
    synced: false,
    reason: 'canvas-unavailable',
  });
  assert.deepEqual(
    await syncStoryClipFrameToCanvas({
      project: { canvasBinding: { canvasId: 'c9' } },
      frame: { id: 'f1' },
      adapter: missingAdapter,
    }),
    { synced: false, reason: 'canvas-unavailable' },
  );
});

test('storyCanvasMediaSync: 同步片段帧到画布时新建节点并回填归属', async () => {
  const created = [];
  const adapter = {
    canvasExists: async () => true,
    switchCanvas: async () => true,
    nodeExists: async () => false,
    createMediaNode: async (nodeData, options) => {
      created.push([nodeData, options]);
      return { id: 'node-1' };
    },
    updateMediaNode: async () => {
      throw new Error('不该走到更新');
    },
  };

  const result = await syncStoryClipFrameToCanvas({
    project: { id: 'p1', canvasBinding: { canvasId: 'c1' } },
    frame: { id: 'f1', imageUrl: 'http://x/a.png' },
    adapter,
  });

  assert.equal(result.synced, true);
  assert.equal(result.created, true);
  assert.equal(result.canvasId, 'c1');
  assert.equal(result.nodeId, 'node-1');
  assert.equal(created[0][0].type, 'source-image');
  assert.equal(created[0][1].sequenceKey, 'story-project:p1:clip-frames');
  assert.equal(result.frame.canvasId, 'c1');
  assert.equal(result.frame.canvasNodeId, 'node-1');
});

test('storyCanvasMediaSync: 帧已经属于同一画布时走更新，切换失败与拿不到节点 id 都会抛错', async () => {
  const updated = [];
  const adapter = {
    canvasExists: async () => true,
    switchCanvas: async () => true,
    nodeExists: async () => true,
    createMediaNode: async () => {
      throw new Error('不该走到新建');
    },
    updateMediaNode: async (nodeId, nodeData, options) => {
      updated.push([nodeId, nodeData, options]);
      return { id: nodeId };
    },
  };

  const result = await syncStoryClipFrameToCanvas({
    project: { id: 'p1', canvasBinding: { canvasId: 'c1' } },
    frame: { id: 'f1', imageUrl: 'http://x/a.png', canvasId: 'c1', canvasNodeId: 'node-9' },
    adapter,
  });
  assert.equal(result.created, false);
  assert.equal(result.nodeId, 'node-9');
  assert.equal(updated[0][0], 'node-9');
  assert.deepEqual(updated[0][2], { canvasId: 'c1' });

  const refusing = { ...adapter, switchCanvas: async () => false };
  await assert.rejects(
    () => syncStoryClipFrameToCanvas({ project: { canvasBinding: { canvasId: 'c1' } }, frame: { id: 'f1' }, adapter: refusing }),
    /无法切换到已绑定的项目画布：c1/,
  );

  const broken = { ...adapter, nodeExists: async () => false, createMediaNode: async () => ({}) };
  await assert.rejects(
    () => syncStoryClipFrameToCanvas({ project: { canvasBinding: { canvasId: 'c1' } }, frame: { id: 'f1' }, adapter: broken }),
    /同步片段帧到项目画布失败/,
  );
});
