import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationPreviews } from './collaborationPreviews.js';

const PREVIEW = {
  originalLocalPath: 'C:/cache/orig.png',
  displayLocalPath: 'C:/cache/display.webp',
  thumbLocalPath: 'C:/cache/thumb.webp',
  originalWidth: 1920,
  originalHeight: 1080,
};

test('createCollaborationPreviews：没有生成函数时原样返回同一个图对象', async () => {
  const graph = { nodes: { a: { id: 'a', type: 'image', src: 'x.png' } } };
  assert.equal(await createCollaborationPreviews(null)(graph), graph);
});

test('createCollaborationPreviews：为三类图片节点补齐预览字段，不改原对象', async () => {
  const calls = [];
  const enrich = createCollaborationPreviews(async (source) => {
    calls.push(source);
    return PREVIEW;
  });
  const node = { id: 'n1', type: 'ai-image', localPath: 'C:/out/a.png', title: 't' };
  const graph = { nodes: { n1: node }, edges: { e: 1 } };
  const out = await enrich(graph);
  assert.deepEqual(calls, ['C:/out/a.png']);
  assert.deepEqual(out.nodes.n1, { ...node, ...PREVIEW });
  assert.notEqual(out, graph);
  assert.notEqual(out.nodes, graph.nodes);
  assert.deepEqual(graph.nodes.n1, { id: 'n1', type: 'ai-image', localPath: 'C:/out/a.png', title: 't' });
  // edges 原样浅拷贝
  assert.equal(out.edges, graph.edges);
});

test('createCollaborationPreviews：来源依次取 originalLocalPath、localPath、src', async () => {
  const calls = [];
  const enrich = createCollaborationPreviews(async (source) => {
    calls.push(source);
    return null;
  });
  await enrich({
    nodes: {
      a: { id: 'a', type: 'image', originalLocalPath: 'o.png', localPath: 'l.png', src: 's.png' },
      b: { id: 'b', type: 'source-image', localPath: 'l2.png', src: 's2.png' },
      c: { id: 'c', type: 'image', src: 's3.png' },
    },
  });
  assert.deepEqual(calls, ['o.png', 'l2.png', 's3.png']);
});

test('createCollaborationPreviews：跳过非图片节点、已有预览的节点、无来源和 aic-asset: 来源', async () => {
  const calls = [];
  const enrich = createCollaborationPreviews(async (source) => {
    calls.push(source);
    return PREVIEW;
  });
  const graph = {
    nodes: {
      v: { id: 'v', type: 'video', src: 'v.mp4' },
      done: { id: 'done', type: 'image', src: 'd.png', displayLocalPath: 'x', thumbLocalPath: 'y' },
      half: { id: 'half', type: 'image', src: 'h.png', displayLocalPath: 'x' },
      none: { id: 'none', type: 'image' },
      asset: { id: 'asset', type: 'image', src: 'aic-asset:abc' },
    },
  };
  const out = await enrich(graph);
  // 只缺一个预览字段的节点仍会处理
  assert.deepEqual(calls, ['h.png']);
  assert.equal(out.nodes.v, graph.nodes.v);
  assert.equal(out.nodes.done, graph.nodes.done);
  assert.equal(out.nodes.asset, graph.nodes.asset);
  assert.equal(out.nodes.half.thumbLocalPath, PREVIEW.thumbLocalPath);
});

test('createCollaborationPreviews：同一来源只生成一次，结果跨调用缓存', async () => {
  let count = 0;
  const enrich = createCollaborationPreviews(async () => {
    count++;
    return PREVIEW;
  });
  const graph = {
    nodes: {
      a: { id: 'a', type: 'image', src: 'same.png' },
      b: { id: 'b', type: 'image', src: 'same.png' },
    },
  };
  await enrich(graph);
  await enrich(graph);
  assert.equal(count, 1);
});

test('createCollaborationPreviews：结果缺预览字段、生成抛错时保留原节点；只复制真值字段', async () => {
  const enrich = createCollaborationPreviews(async (source) => {
    if (source === 'bad.png') throw new Error('boom');
    if (source === 'partial.png') return { displayLocalPath: 'd' };
    return { displayLocalPath: 'd', thumbLocalPath: 't', originalWidth: 0, originalLocalPath: '' };
  });
  const graph = {
    nodes: {
      bad: { id: 'bad', type: 'image', src: 'bad.png' },
      partial: { id: 'partial', type: 'image', src: 'partial.png' },
      ok: { id: 'ok', type: 'image', src: 'ok.png', originalWidth: 5 },
    },
  };
  const out = await enrich(graph);
  assert.equal(out.nodes.bad, graph.nodes.bad);
  assert.equal(out.nodes.partial, graph.nodes.partial);
  assert.deepEqual(out.nodes.ok, {
    id: 'ok',
    type: 'image',
    src: 'ok.png',
    originalWidth: 5,
    displayLocalPath: 'd',
    thumbLocalPath: 't',
  });
});

test('createCollaborationPreviews：写回位置按节点 id，而不是图里的键', async () => {
  const enrich = createCollaborationPreviews(async () => PREVIEW);
  const out = await enrich({ nodes: { key1: { id: 'real', type: 'image', src: 'a.png' } } });
  assert.equal(out.nodes.key1.thumbLocalPath, undefined);
  assert.equal(out.nodes.real.thumbLocalPath, PREVIEW.thumbLocalPath);
});
