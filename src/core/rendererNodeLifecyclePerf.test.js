import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createRendererNodeLifecycleStats,
  recordRendererLifecycleDuration,
  recordRendererLifecycleSkippedUpdate,
} from './rendererNodeLifecyclePerf.js';

test('rendererNodeLifecyclePerf: creates normalized counters', () => {
  const stats = createRendererNodeLifecycleStats({
    mode: 'dense',
    nodeCount: '30',
    renderNodeCount: '12',
    mountCandidateCount: '4',
    parkCandidateCount: '3',
    viewportBusy: true,
  });

  assert.equal(stats.mode, 'dense');
  assert.equal(stats.nodeCount, 30);
  assert.equal(stats.renderNodeCount, 12);
  assert.equal(stats.mountCandidateCount, 4);
  assert.equal(stats.parkCandidateCount, 3);
  assert.equal(stats.viewportBusy, true);
  assert.deepEqual(stats.createdByType, {});
  assert.deepEqual(stats.slowUpdates, []);
});

test('rendererNodeLifecyclePerf: records durations by operation and canonical node type', () => {
  const stats = createRendererNodeLifecycleStats();
  const videoNode = { id: 'video-1', type: 'video' };
  recordRendererLifecycleDuration(stats, 'create', videoNode, 5);
  recordRendererLifecycleDuration(stats, 'remount', videoNode, 7);
  recordRendererLifecycleDuration(stats, 'park', videoNode, 9);
  recordRendererLifecycleDuration(stats, 'create', videoNode, -1);

  assert.equal(stats.createdCount, 1);
  assert.equal(stats.createRuntimeMs, 5);
  assert.equal(stats.createRuntimeMaxMs, 5);
  assert.equal(stats.remountedCount, 1);
  assert.equal(stats.remountRuntimeMs, 7);
  assert.equal(stats.parkedCount, 1);
  assert.equal(stats.parkRuntimeMs, 9);
  assert.deepEqual(stats.createdByType['source-video'], { count: 1, durationMs: 5, maxMs: 5 });
  assert.equal(stats.slowCreates.length, 1);
});

test('rendererNodeLifecyclePerf: keeps the eight slowest updates and counts skipped work', () => {
  const stats = createRendererNodeLifecycleStats();
  for (let duration = 1; duration <= 10; duration += 1) {
    recordRendererLifecycleDuration(
      stats,
      'update',
      { id: `node-${duration}`, type: 'ai-image' },
      duration,
      duration === 3 ? 'hidden' : 'visible',
    );
  }
  recordRendererLifecycleSkippedUpdate(stats);

  assert.equal(stats.updateCount, 10);
  assert.equal(stats.hiddenUpdateCount, 1);
  assert.equal(stats.updateRuntimeMs, 55);
  assert.equal(stats.updateRuntimeMaxMs, 10);
  assert.equal(stats.skippedUpdateCount, 1);
  assert.equal(stats.slowUpdates.length, 8);
  assert.deepEqual(
    stats.slowUpdates.map(({ durationMs }) => durationMs),
    [10, 9, 8, 7, 6, 5, 4, 3],
  );
});
