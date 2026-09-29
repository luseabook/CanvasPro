import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearNodeGeometryPreview,
  readNodeGeometryPreview,
  readNodeGeometryPreviewEntries,
  setNodeGeometryPreview,
  subscribeNodeGeometryPreview,
} from './nodeGeometryPreview.js';

test('nodeGeometryPreview: stores finite geometry fields and notifies subscribers', () => {
  const layer = 'nodeGeometryPreview-test-basic';
  const notifications = [];
  const unsubscribe = subscribeNodeGeometryPreview((changedLayer) => notifications.push(changedLayer));

  try {
    setNodeGeometryPreview(
      [
        ['node-a', { x: 1, y: 2, width: 30, height: 40, label: 'ignored' }],
        ['node-b', { x: Number.NaN, width: 10 }],
      ],
      layer,
    );

    assert.deepEqual(notifications, [layer]);
    assert.deepEqual(readNodeGeometryPreviewEntries(layer), [
      ['node-a', { x: 1, y: 2, width: 30, height: 40 }],
      ['node-b', { width: 10 }],
    ]);
    assert.deepEqual(readNodeGeometryPreview('node-a', { x: 0, label: 'base' }), {
      x: 1,
      y: 2,
      width: 30,
      height: 40,
      label: 'base',
    });
  } finally {
    unsubscribe();
    clearNodeGeometryPreview(['node-a', 'node-b'], layer);
  }
});

test('nodeGeometryPreview: falls back from global geometry to any registered layer', () => {
  const globalId = 'nodeGeometryPreview-test-global';
  const layerId = 'nodeGeometryPreview-test-layer';
  setNodeGeometryPreview([[globalId, { x: 4, y: 5 }]]);
  setNodeGeometryPreview([[layerId, { width: 12, height: 13 }]], 'layer-search');

  try {
    assert.deepEqual(readNodeGeometryPreview(globalId, {}), { x: 4, y: 5 });
    assert.deepEqual(readNodeGeometryPreview(layerId, {}), { width: 12, height: 13 });
    assert.deepEqual(readNodeGeometryPreview('missing', { x: 1 }), { x: 1 });
  } finally {
    clearNodeGeometryPreview([globalId]);
    clearNodeGeometryPreview([layerId], 'layer-search');
  }
});

test('nodeGeometryPreview: only notifies on clear when a value was removed', () => {
  const layer = 'nodeGeometryPreview-test-clear';
  setNodeGeometryPreview([['node-a', { x: 1, y: 2 }]], layer);
  const notifications = [];
  const unsubscribe = subscribeNodeGeometryPreview((changedLayer) => notifications.push(changedLayer));

  try {
    clearNodeGeometryPreview(['missing'], layer);
    assert.deepEqual(notifications, []);
    clearNodeGeometryPreview(['node-a'], layer);
    assert.deepEqual(notifications, [layer]);
    assert.deepEqual(readNodeGeometryPreviewEntries(layer), []);
  } finally {
    unsubscribe();
  }
});
