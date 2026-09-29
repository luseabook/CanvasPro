import test from 'node:test';
import assert from 'node:assert/strict';

import { syncRendererBridge } from './rendererBridge.js';

test('rendererBridge: exposes mounted-node and edge helpers', () => {
  const calls = [];
  const selectedElement = {};
  const component = {
    el: {
      querySelector: (selector) => (selector === '.target' ? selectedElement : null),
    },
    highlightCell: (index) => calls.push(['cell', index]),
    highlightSlot: (index) => calls.push(['slot', index]),
    syncDragPreview: (payload) => calls.push(['sync', payload]),
    applyImmediateCellSwap: (sourceIndex, targetIndex) => ({
      ok: true,
      revert: () => calls.push(['revert', sourceIndex, targetIndex]),
    }),
    previewItems: (items) => calls.push(['preview', items]),
    runGeneration: async () => 'generated',
  };
  const wrapper = { isConnected: true, dataset: {} };
  const fastWrapper = {
    isConnected: true,
    dataset: { rendererPresentationOwner: 'fast-preview' },
  };
  const componentMap = new Map([['node', component]]);
  const wrapperMap = new Map([
    ['node', wrapper],
    ['fast', fastWrapper],
  ]);
  const mountedNodeIds = new Set(['node', 'fast']);
  const nodeToEdgeIds = new Map([['node', new Set(['e1', 'e2'])]]);
  const target = { v2Renderer: { nodeInstances: {}, wrapperMap: {} } };

  syncRendererBridge(target, {
    componentMap,
    wrapperMap,
    mountedNodeIds,
    nodeToEdgeIds,
    getEdgeLayerStats: () => ({ total: 2 }),
    pinNode: () => {},
    unpinNode: () => {},
  });

  assert.equal('nodeInstances' in target.v2Renderer, false);
  assert.equal('wrapperMap' in target.v2Renderer, false);
  assert.equal(target.v2Renderer.getMountedNodeCount(), 2);
  assert.equal(target.v2Renderer.isNodeMounted('node'), true);
  assert.equal(target.v2Renderer.getMountedWrapper('missing'), null);
  assert.equal(target.v2Renderer.getDragSurfaceWrapper('fast'), null);
  assert.equal(target.v2Renderer.queryMountedNodeElement('node', '.target'), selectedElement);
  assert.equal(target.v2Renderer.highlightDropSlot('node', { kind: 'storyboard', index: 2 }), true);
  assert.equal(target.v2Renderer.clearDropSlotHighlight('node'), true);
  assert.deepEqual(calls, [
    ['cell', 2],
    ['cell', -1],
    ['slot', -1],
  ]);
  assert.deepEqual(target.v2Renderer.getEdgeIdsForNode('node'), ['e1', 'e2']);
  assert.deepEqual(target.v2Renderer.getEdgeLayerStats(), { total: 2 });
});

test('rendererBridge: coordinates drag previews, cell swaps, and generation', async () => {
  const calls = [];
  const component = {
    syncDragPreview: (payload) => calls.push(['sync', payload]),
    applyImmediateCellSwap: (sourceIndex, targetIndex) => ({
      ok: true,
      revert: () => calls.push(['revert', sourceIndex, targetIndex]),
    }),
    previewItems: (items) => calls.push(['preview', items]),
    runGeneration: async () => 'generated',
  };
  const target = {};
  syncRendererBridge(target, {
    componentMap: new Map([['node', component]]),
    wrapperMap: new Map([
      ['node', { isConnected: true, dataset: {} }],
      ['fast', { isConnected: true, dataset: { rendererPresentationOwner: 'fast-preview' } }],
    ]),
    mountedNodeIds: new Set(['node', 'fast']),
    captureRasterPreviewNode: () => 'raster-frame',
    excludeRasterPreviewNode: () => true,
    syncFastPreviewDragProxy: (nodeId, payload) => {
      calls.push(['proxy', nodeId, payload.rasterFrame]);
      return true;
    },
  });

  assert.equal(target.v2Renderer.syncNodeDragPreview('node', { active: true }), true);
  const swap = target.v2Renderer.applyImmediateCellSwapPreview('node', {
    sourceIndex: 1,
    targetIndex: 2,
  });
  assert.equal(swap.ok, true);
  swap.revert();
  assert.equal(target.v2Renderer.previewCollageItems('node', ['a']), true);
  const generation = target.v2Renderer.runMountedNodeGeneration('node');
  assert.equal(generation.started, true);
  assert.equal(await generation.result, 'generated');
  assert.deepEqual(calls, [
    ['sync', { active: true }],
    ['proxy', 'node', 'raster-frame'],
    ['revert', 1, 2],
    ['preview', ['a']],
  ]);
});
