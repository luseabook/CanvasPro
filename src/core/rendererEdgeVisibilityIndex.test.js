import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EDGE_RENDER_ALL_LOW_ZOOM_THRESHOLD,
  EDGE_RENDER_ALL_MAX_EDGE_COUNT,
  MANY_EDGES_THRESHOLD,
  buildFullEdgeRenderSignature,
  clearCachedEdgeVisibilityIndex,
  createEdgeVisibilityIndex,
  getCachedEdgeGeometrySignature,
  getCachedEdgeVisibilityIndex,
  queryEdgeVisibilityIndex,
  shouldRenderAllEdgesAtLowZoom,
} from './rendererEdgeVisibilityIndex.js';

const nodesFor = (count) => {
  const nodes = {};
  for (let i = 0; i <= count; i += 1) nodes[`n${i}`] = { x: i * 400, y: 0, width: 200, height: 100 };
  return nodes;
};

const edgesFor = (count) => {
  const edges = [];
  for (let i = 0; i < count; i += 1) edges.push({ id: `e${i}`, sourceId: `n${i}`, targetId: `n${i + 1}` });
  return edges;
};

test('rendererEdgeVisibilityIndex: 常量与低缩放全量渲染判定', () => {
  assert.equal(MANY_EDGES_THRESHOLD, 96);
  assert.equal(EDGE_RENDER_ALL_LOW_ZOOM_THRESHOLD, 0.22);
  assert.equal(EDGE_RENDER_ALL_MAX_EDGE_COUNT, 300);
  assert.equal(shouldRenderAllEdgesAtLowZoom({ edgeCount: 100, viewport: { zoom: 0.22 } }), true);
  assert.equal(shouldRenderAllEdgesAtLowZoom({ edgeCount: 100, viewport: { zoom: 0.3 } }), false);
  assert.equal(shouldRenderAllEdgesAtLowZoom({ edgeCount: 0, viewport: { zoom: 0.1 } }), false);
  assert.equal(shouldRenderAllEdgesAtLowZoom({ edgeCount: 301, viewport: { zoom: 0.1 } }), false);
  assert.equal(shouldRenderAllEdgesAtLowZoom({ edgeCount: 100, viewport: {} }), false);
  assert.equal(
    shouldRenderAllEdgesAtLowZoom({ edgeCount: 100, viewport: { zoom: 0.5 }, lowZoomThreshold: 0.6 }),
    true,
  );
  assert.equal(
    shouldRenderAllEdgesAtLowZoom({ edgeCount: 400, viewport: { zoom: 0.1 }, maxEdgeCount: 500 }),
    true,
  );
  assert.equal(shouldRenderAllEdgesAtLowZoom(), false);
});

test('rendererEdgeVisibilityIndex: 索引由端点包围盒装格，世界坐标可从边序读出', () => {
  const index = createEdgeVisibilityIndex([{ id: 'e0', sourceId: 'n0', targetId: 'n1' }], nodesFor(1));
  assert.equal(index.edgeCount, 1);
  assert.equal(index.cellSize, 1024);
  assert.equal(index.cells.size, 1);
  assert.deepEqual([...index.spanningEdgeIds], []);
  assert.deepEqual(index.edgeBounds.get('e0'), { minX: 200, maxX: 400, minY: 50, maxY: 50 });
  assert.equal(index.edgeOrder.get('e0'), 0);
  assert.equal(index.edgesById.get('e0').id, 'e0');
});

test('rendererEdgeVisibilityIndex: 缺 id / 缺端点节点的边被跳过', () => {
  const nodes = nodesFor(2);
  const index = createEdgeVisibilityIndex(
    [
      { sourceId: 'n0', targetId: 'n1' },
      { id: '   ', sourceId: 'n0', targetId: 'n1' },
      { id: 'ghost', sourceId: 'n0', targetId: 'n404' },
      { id: 'ok', sourceId: 'n0', targetId: 'n1' },
    ],
    nodes,
  );
  assert.equal(index.edgeCount, 1);
  assert.deepEqual([...index.edgeBounds.keys()], ['ok']);
  assert.equal(createEdgeVisibilityIndex(null, nodes).edgeCount, 0);
});

test('rendererEdgeVisibilityIndex: queryEdgeVisibilityIndex 按边序升序返回相交边', () => {
  const index = createEdgeVisibilityIndex(edgesFor(3), nodesFor(3));
  assert.deepEqual(queryEdgeVisibilityIndex(index, { minX: -50, minY: -50, maxX: 450, maxY: 60 }), ['e0']);
  assert.deepEqual(queryEdgeVisibilityIndex(index, { minX: -50, minY: -50, maxX: 1000, maxY: 60 }), [
    'e0',
    'e1',
  ]);
  assert.deepEqual(queryEdgeVisibilityIndex(index, { minX: 5000, minY: 5000, maxX: 6000, maxY: 6000 }), []);
  assert.deepEqual(queryEdgeVisibilityIndex(null, { minX: 0, minY: 0, maxX: 1, maxY: 1 }), []);
  assert.deepEqual(queryEdgeVisibilityIndex({ cells: [] }, { minX: 0, minY: 0, maxX: 1, maxY: 1 }), []);
});

test('rendererEdgeVisibilityIndex: 缓存索引按阈值与签名/节点同一性复用', () => {
  const edges = edgesFor(100);
  const nodes = nodesFor(100);
  assert.equal(getCachedEdgeVisibilityIndex(edgesFor(2), nodesFor(2)), null);
  const first = getCachedEdgeVisibilityIndex(edges, nodes);
  assert.equal(first.edgeCount, 100);
  assert.equal(getCachedEdgeVisibilityIndex(edges, nodes), first);
  assert.notEqual(getCachedEdgeVisibilityIndex(edges, nodes, { edgesRev: 1 }), first);
  const reved = getCachedEdgeVisibilityIndex(edges, nodes, { edgesRev: 1 });
  assert.notEqual(getCachedEdgeVisibilityIndex(edges, nodesFor(100), { edgesRev: 1 }), reved);
  clearCachedEdgeVisibilityIndex();
  assert.notEqual(getCachedEdgeVisibilityIndex(edges, nodes), first);
});

test('rendererEdgeVisibilityIndex: 几何签名对内容稳定、对节点位移敏感', () => {
  const edges = edgesFor(5);
  const nodes = nodesFor(5);
  const signature = getCachedEdgeGeometrySignature(edges, nodes);
  assert.ok(signature.startsWith('geom:5:0:0:'));
  assert.equal(getCachedEdgeGeometrySignature(edges, nodes), signature);
  assert.equal(getCachedEdgeGeometrySignature(edges, nodesFor(5)), signature);
  const moved = nodesFor(5);
  moved.n3 = { ...moved.n3, x: 9999 };
  assert.notEqual(getCachedEdgeGeometrySignature(edges, moved), signature);
  assert.equal(getCachedEdgeGeometrySignature([], {}), 'geom:0:0:0:1x2zm73');
});

test('rendererEdgeVisibilityIndex: 稀疏边集签名逐边展开，含缺失端点分支', () => {
  const signature = buildFullEdgeRenderSignature({
    edgeEntries: edgesFor(5),
    nodes: nodesFor(5),
    viewport: { x: 0, y: 0, zoom: 1 },
    containerW: 1600,
    containerH: 900,
  });
  assert.ok(signature.startsWith('edge-full|vp:0.0:0.0:1.0|box:1600.0:900.0|drag:0.0:0.0|path:curve|'));
  assert.ok(signature.includes('dragIds:|highlight:|'));
  assert.ok(signature.includes('|e:e0:n0:n1:200.0:50.0:400.0:50.0'));
  const moved = nodesFor(5);
  moved.n0 = { ...moved.n0, x: 100 };
  assert.notEqual(
    buildFullEdgeRenderSignature({
      edgeEntries: edgesFor(5),
      nodes: moved,
      viewport: { x: 0, y: 0, zoom: 1 },
      containerW: 1600,
      containerH: 900,
    }),
    signature,
  );
  const missing = buildFullEdgeRenderSignature({
    edgeEntries: [{ id: 'e0', sourceId: 'n0', targetId: 'n404' }],
    nodes: nodesFor(5),
    viewport: { x: 0, y: 0, zoom: 1 },
    containerW: 1600,
    containerH: 900,
  });
  assert.ok(missing.includes('|e:e0:n0:n404:missing'));
  assert.ok(
    buildFullEdgeRenderSignature({
      edgeEntries: edgesFor(2),
      nodes: nodesFor(2),
      viewport: { x: 0, y: 0, zoom: 1 },
      containerW: 100,
      containerH: 100,
      edgePathStyle: '',
    }).includes('path:curve'),
  );
});

test('rendererEdgeVisibilityIndex: 稠密且无拖拽时退化为紧凑签名', () => {
  const edges = edgesFor(100);
  const nodes = nodesFor(100);
  const compact = buildFullEdgeRenderSignature({
    edgeEntries: edges,
    nodes,
    viewport: { x: 0, y: 0, zoom: 1 },
    containerW: 1600,
    containerH: 900,
  });
  assert.ok(compact.includes('|compact:100:0:geom:100:0:0:'));
  assert.equal(compact.includes('|e:e0:'), false);
  assert.ok(
    buildFullEdgeRenderSignature({
      edgeEntries: edges,
      nodes,
      viewport: { x: 0, y: 0, zoom: 1 },
      containerW: 1600,
      containerH: 900,
      edgesRev: 7,
    }).includes('|compact:100:7:'),
  );
  const drag = buildFullEdgeRenderSignature({
    edgeEntries: edges,
    nodes,
    viewport: { x: 0, y: 0, zoom: 1 },
    containerW: 1600,
    containerH: 900,
    dragOffsetCtx: { movedNodeIds: new Set(['n0']), dx: 10, dy: 0 },
    relatedEdgeIds: new Set(['e5', 'e1']),
  });
  assert.ok(drag.includes('|drag:10.0:0.0|path:curve|dragIds:n0|highlight:e1,e5|'));
  assert.ok(drag.includes('|e:e0:n0:n1:210.0:50.0:400.0:50.0'));
  assert.equal(drag.includes('compact:'), false);
  const highlightOnly = buildFullEdgeRenderSignature({
    edgeEntries: edgesFor(2),
    nodes: nodesFor(2),
    viewport: { x: 0, y: 0, zoom: 1 },
    containerW: 100,
    containerH: 100,
    relatedEdgeIds: ['not-a-set'],
  });
  assert.ok(highlightOnly.includes('|dragIds:|highlight:|'));
});
