import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVirtualizationCandidateSets,
  collectVirtualKeepAliveNodeIds,
  isNodeInsideViewportPadding,
  resolveRendererVirtualizationPadding,
} from './rendererVirtualization.js';
(test('rendererVirtualization: viewport padding 命中进入阈值', () => {
  const isNodeInsideViewportPadding2 = isNodeInsideViewportPadding(
      { id: 'n1', x: 0x384, y: 0, width: 200, height: 120 },
      { x: 0, y: 0, zoom: 1 },
      0x3e8,
      0x320,
      120,
    ),
    isNodeInsideViewportPadding3 = isNodeInsideViewportPadding(
      { id: 'n2', x: 0x514, y: 0, width: 200, height: 120 },
      { x: 0, y: 0, zoom: 1 },
      0x3e8,
      0x320,
      80,
    );
  (assert.equal(isNodeInsideViewportPadding2, true), assert.equal(isNodeInsideViewportPadding3, false));
}),
  test('rendererVirtualization: keepAlive 会覆盖选中 拖拽 descendants 与 pin', () => {
    const virtualKeepAliveNodeIds = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ['a'],
      dragContext: { isDragging: true, targetNodeId: 'dragRoot' },
      connOverlay: { srcId: 'src', hoverId: 'hover' },
      pickConnectMode: { sourceNodeId: 'pick-source', hoverNodeId: 'pick-hover' },
      parentToChildren: { a: new Set(['a-child']), dragRoot: new Set(['drag-child']) },
      pinnedNodeIds: new Set(['pinned']),
    });
    assert.deepEqual(
      new Set(virtualKeepAliveNodeIds),
      new Set([
        'a',
        'a-child',
        'dragRoot',
        'drag-child',
        'src',
        'hover',
        'pick-source',
        'pick-hover',
        'pinned',
      ]),
    );
  }),
  test('rendererVirtualization: 双阈值滞回会分离 mount 与 park 候选', () => {
    const virtualizationCandidateSets = buildVirtualizationCandidateSets({
      nodes: {
        near: { id: 'near', x: 0x4b0, y: 0, width: 200, height: 120 },
        far: { id: 'far', x: 0x7d0, y: 0, width: 200, height: 120 },
        pinned: { id: 'pinned', x: 0xfa0, y: 0, width: 200, height: 120 },
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      containerWidth: 0x3e8,
      containerHeight: 0x320,
      pinnedNodeIds: new Set(['pinned']),
      mountPadding: 0x258,
      parkPadding: 0x384,
    });
    (assert.equal(virtualizationCandidateSets.mountCandidateIds.has('near'), true),
      assert.equal(virtualizationCandidateSets.parkCandidateIds.has('near'), false),
      assert.equal(virtualizationCandidateSets.mountCandidateIds.has('far'), false),
      assert.equal(virtualizationCandidateSets.parkCandidateIds.has('far'), true),
      assert.equal(virtualizationCandidateSets.mountCandidateIds.has('pinned'), true),
      assert.equal(virtualizationCandidateSets.parkCandidateIds.has('pinned'), false));
  }),
  test('rendererVirtualization: 深层 descendants 仍会被全部纳入 keepAlive', () => {
    const virtualKeepAliveNodeIds2 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ['root'],
      parentToChildren: {
        root: new Set(['child-1']),
        'child-1': ['child-2'],
        'child-2': (function* () {
          yield 'child-3';
        })(),
      },
    });
    assert.deepEqual(new Set(virtualKeepAliveNodeIds2), new Set(['root', 'child-1', 'child-2', 'child-3']));
  }),
  test('rendererVirtualization: 重复 child 不会重复入队', () => {
    const virtualKeepAliveNodeIds3 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ['root'],
      parentToChildren: { root: ['dup', 'dup', 'dup-child'], dup: ['dup-child'], 'dup-child': [] },
    });
    assert.deepEqual(new Set(virtualKeepAliveNodeIds3), new Set(['root', 'dup', 'dup-child']));
  }),
  test('rendererVirtualization: dense low zoom uses tighter parking buffers', () => {
    (assert.deepEqual(
      resolveRendererVirtualizationPadding({ viewport: { x: 0, y: 0, zoom: 0.28 }, nodeCount: 156 }),
      { mountPadding: 0x140, parkPadding: 0x208 },
    ),
      assert.deepEqual(
        resolveRendererVirtualizationPadding({ viewport: { x: 0, y: 0, zoom: 0.4 }, nodeCount: 100 }),
        { mountPadding: 0x1a4, parkPadding: 0x28a },
      ),
      assert.deepEqual(
        resolveRendererVirtualizationPadding({ viewport: { x: 0, y: 0, zoom: 0.4 }, nodeCount: 20 }),
        { mountPadding: 0x258, parkPadding: 0x384 },
      ));
  }));
