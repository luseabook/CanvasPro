import test from 'node:test';
import assert from 'node:assert/strict';

import { canReuseRasterPaint } from './rendererRasterPaintPlan.js';

function createPaint() {
  return {
    paintScaleKey: 'scale-1',
    worldBounds: { x: 0, y: 0, width: 100, height: 80 },
    palette: { background: '#fff', foreground: '#000' },
    admittedSources: new Set(['source-a', 'source-b']),
    items: [
      {
        id: 'item-a',
        kind: 'image',
        label: 'A',
        invalid: false,
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        sources: ['source-a', 'source-b'],
        ignoredExtra: 'value',
      },
    ],
  };
}

test('rendererRasterPaintPlan: reuses paint when identity, sources and item fields match', () => {
  const first = createPaint();
  const second = createPaint();
  second.items[0].ignoredExtra = 'different';

  assert.equal(canReuseRasterPaint(first, second), true);
  assert.equal(canReuseRasterPaint(null, second), false);
  assert.equal(canReuseRasterPaint(first, null), false);
});

test('rendererRasterPaintPlan: invalidates paint on scale, bounds, palette, source or item changes', () => {
  const base = createPaint();

  assert.equal(canReuseRasterPaint(base, { ...createPaint(), paintScaleKey: 'scale-2' }), false);
  assert.equal(
    canReuseRasterPaint(base, {
      ...createPaint(),
      worldBounds: { x: 0, y: 0, width: 101, height: 80 },
    }),
    false,
  );
  assert.equal(
    canReuseRasterPaint(base, {
      ...createPaint(),
      palette: { background: '#eee', foreground: '#000' },
    }),
    false,
  );
  assert.equal(
    canReuseRasterPaint(base, {
      ...createPaint(),
      admittedSources: new Set(['source-a', 'source-c']),
    }),
    false,
  );
  const changedItem = createPaint();
  changedItem.items[0].label = 'B';
  assert.equal(canReuseRasterPaint(base, changedItem), false);
});
