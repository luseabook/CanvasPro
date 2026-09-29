import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearRendererCommitHints,
  consumeRendererNodeDragCommitHint,
  markRendererNodeDragCommitHint,
} from './rendererCommitHints.js';

test('rendererCommitHints: drag commit hints are one-shot', () => {
  clearRendererCommitHints();
  assert.equal(consumeRendererNodeDragCommitHint(), false);
  markRendererNodeDragCommitHint();
  assert.equal(consumeRendererNodeDragCommitHint(), true);
  assert.equal(consumeRendererNodeDragCommitHint(), false);
});

test('rendererCommitHints: clear and non-positive TTL suppress the hint', () => {
  markRendererNodeDragCommitHint();
  clearRendererCommitHints();
  assert.equal(consumeRendererNodeDragCommitHint(), false);

  markRendererNodeDragCommitHint(-100);
  assert.equal(consumeRendererNodeDragCommitHint(), false);
});
