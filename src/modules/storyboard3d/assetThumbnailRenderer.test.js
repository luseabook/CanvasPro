import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createStoryboard3DAssetThumbnailCache,
  createStoryboard3DAssetThumbnailFraming,
  createStoryboard3DAssetThumbnailRenderer,
  createStoryboard3DBuiltinAssetThumbnailModel,
  disposeStoryboard3DAssetThumbnailModel,
} from './assetThumbnailRenderer.js';
import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { DEFAULT_SCENE_ASSET_ID } from '../panoramaSceneNode/sceneAssetCatalog.js';

test('assetThumbnailRenderer: cache refreshes LRU order and evicts the oldest entry', () => {
  const cache = createStoryboard3DAssetThumbnailCache({ limit: 2 });
  assert.equal(cache.get({ id: 'a' }), '');
  assert.equal(cache.set({ id: 'a', url: 'a.png' }, ' A '), 'A');
  assert.equal(cache.set({ id: 'b', url: 'b.png' }, 'B'), 'B');
  assert.equal(cache.get({ id: 'a', url: 'a.png' }), 'A');
  assert.equal(cache.set({ id: 'c', url: 'c.png' }, 'C'), 'C');
  assert.equal(cache.size, 2);
  assert.equal(cache.get({ id: 'b', url: 'b.png' }), '');
  assert.equal(cache.get({ id: 'a', url: 'a.png' }), 'A');
  cache.clear();
  assert.equal(cache.size, 0);
});

test('assetThumbnailRenderer: cache ignores entries without an id or usable payload', () => {
  const cache = createStoryboard3DAssetThumbnailCache();
  assert.equal(cache.set({}, 'value'), '');
  assert.equal(cache.set({ id: 'a' }, '   '), '');
  assert.equal(cache.get({ id: 'a' }), '');
});

test('assetThumbnailRenderer: builtin thumbnail models use the real scene catalog and reject unknown ids', () => {
  assert.equal(createStoryboard3DBuiltinAssetThumbnailModel('missing-asset'), null);
  const model = createStoryboard3DBuiltinAssetThumbnailModel(DEFAULT_SCENE_ASSET_ID);
  assert.equal(model.isObject3D, true);
  assert.ok(model.children.length > 0);
  disposeStoryboard3DAssetThumbnailModel(model);
});

test('assetThumbnailRenderer: framing centers the camera on the model bounds', () => {
  const mesh = new threeRuntime.Mesh(
    new threeRuntime.BoxGeometry(2, 2, 2),
    new threeRuntime.MeshBasicMaterial(),
  );
  const framing = createStoryboard3DAssetThumbnailFraming(mesh, { aspect: 16 / 9 });

  assert.equal(framing.camera.isPerspectiveCamera, true);
  assert.ok(framing.radius > 1);
  assert.ok(framing.distance > framing.radius);
  assert.ok(framing.camera.position.distanceTo(framing.center) > framing.radius);
  assert.equal(framing.bounds.isEmpty(), false);
  assert.throws(
    () => createStoryboard3DAssetThumbnailFraming(new threeRuntime.Object3D()),
    /模型没有可渲染的几何体/,
  );
});

test('assetThumbnailRenderer: renderer produces a JPEG data URL and disposes its canvas renderer', () => {
  const calls = [];
  const renderer = {
    domElement: {
      toDataURL(type, quality) {
        calls.push([type, quality]);
        return 'data:image/jpeg;base64,preview';
      },
    },
    setPixelRatio(value) {
      calls.push(['pixel-ratio', value]);
    },
    setSize(width, height, updateStyle) {
      calls.push(['size', width, height, updateStyle]);
    },
    render(scene, camera) {
      calls.push(['render', scene.isScene, camera.isPerspectiveCamera]);
    },
    dispose() {
      calls.push(['dispose']);
    },
    forceContextLoss() {
      calls.push(['force-context-loss']);
    },
  };
  const thumbnailRenderer = createStoryboard3DAssetThumbnailRenderer({
    documentObject: { createElement: () => ({}) },
    rendererFactory: () => renderer,
    width: 120,
    height: 80,
  });
  const mesh = new threeRuntime.Mesh(
    new threeRuntime.BoxGeometry(1, 1, 1),
    new threeRuntime.MeshBasicMaterial(),
  );

  assert.equal(thumbnailRenderer.render(mesh), 'data:image/jpeg;base64,preview');
  assert.deepEqual(calls.slice(0, 2), [
    ['pixel-ratio', 1],
    ['size', 120, 80, false],
  ]);
  assert.deepEqual(
    calls.find((entry) => entry[0] === 'render'),
    ['render', true, true],
  );
  assert.deepEqual(
    calls.find((entry) => entry[0] === 'image/jpeg'),
    ['image/jpeg', 0.82],
  );
  thumbnailRenderer.dispose();
  assert.deepEqual(calls.slice(-2), [['dispose'], ['force-context-loss']]);
});

test('assetThumbnailRenderer: disposal traverses geometry and material resources', () => {
  const calls = [];
  const geometryNode = { geometry: { dispose: () => calls.push('geometry') } };
  const materialNode = {
    material: [{ dispose: () => calls.push('material-a') }, null],
  };
  const root = {
    traverse(callback) {
      callback(geometryNode);
      callback(materialNode);
    },
  };

  disposeStoryboard3DAssetThumbnailModel(root);
  assert.deepEqual(calls, ['geometry', 'material-a']);
});
