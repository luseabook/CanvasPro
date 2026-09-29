import test from 'node:test';
import assert from 'node:assert/strict';

import { getRendererPickerNodeTypes } from './rendererPickerCatalog.js';

test('rendererPickerCatalog: returns the five renderer picker entries with catalog sizes', () => {
  const entries = getRendererPickerNodeTypes();

  assert.deepEqual(
    entries.map((entry) => entry.type),
    ['ai-text', 'ai-image', 'ai-video', 'ai-audio', 'storyboard'],
  );
  assert.deepEqual(
    entries.map(({ width, height }) => [width, height]),
    [
      [384, 288],
      [288, 288],
      [288, 288],
      [288, 288],
      [320, 180],
    ],
  );
  for (const entry of entries) {
    assert.equal(typeof entry.label, 'string');
    assert.ok(entry.label.trim());
    assert.equal(typeof entry.defaultLabel, 'string');
    assert.ok(entry.defaultLabel.trim());
  }
});

test('rendererPickerCatalog: places storyboard last and preserves its default name', () => {
  const entries = getRendererPickerNodeTypes();
  const storyboard = entries.at(-1);

  assert.equal(storyboard.type, 'storyboard');
  assert.equal(storyboard.label, '宫格图');
  assert.equal(storyboard.defaultLabel, '宫格图');
});
