import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryTaskBatchCancellationRegistry } from './storyTaskBatchCancellation.js';

test('batch cancellation requests are tracked by trimmed id', () => {
  const registry = createStoryTaskBatchCancellationRegistry();
  assert.equal(registry.request(''), false);
  assert.equal(registry.request('  '), false);
  assert.equal(registry.request(' batch-1 '), true);
  assert.equal(registry.isRequested('batch-1'), true);
  assert.equal(registry.isRequested('batch-2'), false);
  assert.equal(registry.isRequested(null), false);
  assert.equal(registry.clear('batch-1 '), true);
  assert.equal(registry.clear('batch-1'), false);
  assert.equal(registry.isRequested('batch-1'), false);
});

test('each registry keeps its own requests', () => {
  const first = createStoryTaskBatchCancellationRegistry();
  const second = createStoryTaskBatchCancellationRegistry();
  first.request('shared');
  assert.equal(second.isRequested('shared'), false);
  assert.equal(second.clear(''), false);
});
