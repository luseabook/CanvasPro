import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCursorMetrics, readCursorHotspot } from './cursorAssetApi.js';

function createCursorBuffer({ width = 32, height = 48, x = 3, y = 7 } = {}) {
  const buffer = new ArrayBuffer(22);
  const view = new DataView(buffer);
  view.setUint16(2, 2, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, width);
  view.setUint8(7, height);
  view.setUint16(10, x, true);
  view.setUint16(12, y, true);
  return buffer;
}

test('cursorAssetApi: reads hotspot values from a cursor directory', () => {
  assert.deepEqual(readCursorHotspot(createCursorBuffer()), { x: 3, y: 7 });
});

test('cursorAssetApi: rejects unsupported cursor buffers', () => {
  const buffer = createCursorBuffer();
  new DataView(buffer).setUint16(2, 1, true);
  assert.throws(() => readCursorHotspot(buffer), /Unsupported cursor directory/);
  assert.throws(() => readCursorHotspot(new ArrayBuffer(4)), /Unsupported cursor directory/);
});

test('cursorAssetApi: derives dimensions and falls back to 256 pixels', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    arrayBuffer: async () => createCursorBuffer({ width: 0, height: 64, x: 9, y: 10 }),
  });

  try {
    assert.deepEqual(await loadCursorMetrics('cursor.cur'), {
      hotspot: { x: 9, y: 10 },
      width: 256,
      height: 64,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
