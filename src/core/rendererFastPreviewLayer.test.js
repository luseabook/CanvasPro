import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cancelRendererFastPreviewMediaPreloads,
  createRendererFastPreviewLayer,
  resolveRendererPreviewNodePresentation,
} from './rendererFastPreviewLayer.js';

const EXPECTED_API = [
  'clear',
  'discardNode',
  'getStats',
  'hasNodePreview',
  'isNodePresentationReady',
  'isNodePreviewReady',
  'prune',
  'reconcileMediaSourceOwners',
  'releaseNode',
  'removeNode',
  'retainNode',
  'stageRasterHandoffFrame',
  'sync',
  'syncNodeDragPreview',
];

test('rendererFastPreviewLayer: exposes the full preview-layer surface', () => {
  const layer = createRendererFastPreviewLayer();

  assert.deepEqual(Object.keys(layer).sort(), [...EXPECTED_API].sort());
  for (const name of EXPECTED_API) {
    assert.equal(typeof layer[name], 'function', `${name} should be a function`);
  }
});

test('rendererFastPreviewLayer: constructing without a DOM stays side-effect free', () => {
  const layer = createRendererFastPreviewLayer({
    getWrapper: () => undefined,
    isMounted: () => false,
  });

  assert.deepEqual(layer.getStats(), {
    fastPreviewCount: 0,
    visibleFastPreviewCount: 0,
    previewWithMediaCount: 0,
    deferredMountedWithPreviewCount: 0,
    stagedPreviewCount: 0,
    connectedStagedPreviewCount: 0,
  });
  assert.equal(layer.hasNodePreview('missing'), false);
  assert.equal(layer.isNodePreviewReady('missing'), false);
  assert.equal(layer.isNodePresentationReady('missing'), false);
  assert.equal(layer.releaseNode('missing'), false);
  assert.equal(layer.discardNode('missing'), false);
});

test('rendererFastPreviewLayer: staged raster handoff frames require an id and a canvas', () => {
  const layer = createRendererFastPreviewLayer();

  assert.equal(layer.stageRasterHandoffFrame('', { canvas: {} }), false);
  assert.equal(layer.stageRasterHandoffFrame('node-a', {}), false);
  assert.equal(layer.stageRasterHandoffFrame('node-a', { canvas: {} }), true);
  assert.equal(layer.hasNodePreview('node-a'), false);
});

test('rendererFastPreviewLayer: prune and discard tolerate unmatched ids', () => {
  const layer = createRendererFastPreviewLayer();

  layer.stageRasterHandoffFrame('node-b', { canvas: {} });

  assert.equal(layer.prune(['node-b']), 0);
  assert.equal(layer.prune(['node-b']), 0);
  assert.equal(layer.discardNode('node-b'), false);
  assert.equal(layer.discardNode(''), false);
});

test('rendererFastPreviewLayer: drag proxy sync tolerates missing preview nodes', () => {
  const layer = createRendererFastPreviewLayer();

  assert.equal(layer.syncNodeDragPreview('', { active: true }), false);
  assert.equal(layer.syncNodeDragPreview('node-c', { active: true }), false);
  assert.equal(layer.syncNodeDragPreview('node-c', { remove: true }), true);
});

test('rendererFastPreviewLayer: cancelRendererFastPreviewMediaPreloads is callable with no scheduler state', () => {
  assert.equal(cancelRendererFastPreviewMediaPreloads(), 0);
  assert.equal(
    cancelRendererFastPreviewMediaPreloads({ includeActive: true, reason: 'test' }),
    0,
  );
});

test('rendererFastPreviewLayer: resolveRendererPreviewNodePresentation reports kind and geometry', () => {
  const presentation = resolveRendererPreviewNodePresentation({
    id: 'image-1',
    type: 'ai-image',
    x: 10,
    y: 20,
    width: 320,
    height: 180,
    images: [{ imageUrl: 'https://example.test/a.png' }],
  });

  assert.equal(presentation.kind, 'image');
  assert.deepEqual(presentation.geometry, { x: 10, y: 20, width: 320, height: 180 });
  assert.equal(Array.isArray(presentation.sources), true);
});
