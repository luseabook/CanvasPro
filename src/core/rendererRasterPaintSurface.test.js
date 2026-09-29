import test from 'node:test';
import assert from 'node:assert/strict';

import { createRendererRasterPaintSurface } from './rendererRasterPaintSurface.js';

test('rendererRasterPaintSurface: uses a backing canvas for resize, present and release', () => {
  const calls = [];
  const mainContext = {
    drawImage(image, x, y) {
      calls.push(['drawImage', image, x, y]);
    },
  };
  const backingContext = {};
  const backing = {
    width: 10,
    height: 20,
    getContext(kind) {
      assert.equal(kind, '2d');
      return backingContext;
    },
  };
  const canvas = {
    width: 10,
    height: 20,
    getContext(kind) {
      assert.equal(kind, '2d');
      return mainContext;
    },
  };

  const surface = createRendererRasterPaintSurface(canvas, {
    createBackingCanvas(width, height) {
      calls.push(['create', width, height]);
      return backing;
    },
  });

  assert.equal(surface.context, backingContext);
  assert.deepEqual(calls.shift(), ['create', 10, 20]);
  surface.resize(320, 180);
  assert.deepEqual([canvas.width, canvas.height], [320, 180]);
  assert.deepEqual([backing.width, backing.height], [320, 180]);

  surface.present();
  assert.equal(mainContext.globalCompositeOperation, 'copy');
  assert.equal(mainContext.imageSmoothingEnabled, false);
  assert.deepEqual(calls, [['drawImage', backing, 0, 0]]);

  surface.release();
  assert.deepEqual([backing.width, backing.height], [1, 1]);
});

test('rendererRasterPaintSurface: falls back to the main context when backing creation fails', () => {
  const mainContext = { drawImage: () => assert.fail('fallback present must not draw') };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => mainContext,
  };
  const surface = createRendererRasterPaintSurface(canvas, {
    createBackingCanvas() {
      throw new Error('unavailable');
    },
  });

  assert.equal(surface.context, mainContext);
  surface.present();
  surface.resize(2, 3);
  surface.release();
  assert.deepEqual([canvas.width, canvas.height], [2, 3]);
});
