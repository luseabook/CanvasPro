import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVirtualizationCandidateSets,
  collectVirtualKeepAliveNodeIds,
  isNodeInsideViewportPadding,
  resolveRendererVirtualizationPadding,
} from './rendererVirtualization.js';
(test('rendererVirtualization: viewport padding 命中进入阈值', () => {
  const _0x249b33 = isNodeInsideViewportPadding(
      { id: 'n1', x: 0x384, y: 0, width: 200, height: 120 },
      { x: 0, y: 0, zoom: 1 },
      0x3e8,
      0x320,
      120,
    ),
    _0x1497ab = isNodeInsideViewportPadding(
      { id: 'n2', x: 0x514, y: 0, width: 200, height: 120 },
      { x: 0, y: 0, zoom: 1 },
      0x3e8,
      0x320,
      80,
    );
  (assert.equal(_0x249b33, true), assert.equal(_0x1497ab, false));
}),
  test('rendererVirtualization: keepAlive 会覆盖选中 拖拽 descendants 与 pin', () => {
    const _0x2979e6 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ['a'],
      dragContext: { isDragging: true, targetNodeId: 'dragRoot' },
      connOverlay: { srcId: 'src', hoverId: 'hover' },
      pickConnectMode: { sourceNodeId: 'pick-source', hoverNodeId: 'pick-hover' },
      parentToChildren: { a: new Set(['a-child']), dragRoot: new Set(['drag-child']) },
      pinnedNodeIds: new Set(['pinned']),
    });
    assert.deepEqual(
      new Set(_0x2979e6),
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
    const _0x19ac39 = buildVirtualizationCandidateSets({
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
    (assert.equal(_0x19ac39.mountCandidateIds.has('near'), true),
      assert.equal(_0x19ac39.parkCandidateIds.has('near'), false),
      assert.equal(_0x19ac39.mountCandidateIds.has('far'), false),
      assert.equal(_0x19ac39.parkCandidateIds.has('far'), true),
      assert.equal(_0x19ac39.mountCandidateIds.has('pinned'), true),
      assert.equal(_0x19ac39.parkCandidateIds.has('pinned'), false));
  }),
  test('rendererVirtualization: 深层 descendants 仍会被全部纳入 keepAlive', () => {
    const _0x5795cf = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ['root'],
      parentToChildren: {
        root: new Set(['child-1']),
        'child-1': ['child-2'],
        'child-2': (function* () {
          yield 'child-3';
        })(),
      },
    });
    assert.deepEqual(new Set(_0x5795cf), new Set(['root', 'child-1', 'child-2', 'child-3']));
  }),
  test('rendererVirtualization: 重复 child 不会重复入队', () => {
    const _0x534b4d = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ['root'],
      parentToChildren: { root: ['dup', 'dup', 'dup-child'], dup: ['dup-child'], 'dup-child': [] },
    });
    assert.deepEqual(new Set(_0x534b4d), new Set(['root', 'dup', 'dup-child']));
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
