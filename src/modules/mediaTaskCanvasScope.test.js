// Offline store/tab doubles; never enqueue, cancel, render, or access user files.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureMediaTaskCanvasScope,
  isMediaTaskCanvasCurrent,
  registerMediaTaskCanvasScope,
  mayApplyMediaTaskUpdate,
  releaseMediaTaskCanvasScope,
} from './mediaTaskCanvasScope.js';

function fixture() {
  let nodes = { sameNodeId: { id: 'sameNodeId', assetId: 'sameAssetId' } };
  let canvasId = 'canvas-A';
  const store = { getStateRaw: () => ({ nodes }) };
  const host = { CanvasTabManager: { getActiveCanvasId: () => canvasId } };
  return { store, host, switchTo(id, replacement = nodes) { canvasId = id; nodes = replacement; }, getNodes: () => nodes };
}

test('same node/asset IDs in a different canvas never own the queued task', () => {
  const f = fixture();
  const owner = captureMediaTaskCanvasScope(f.store, f.host);
  registerMediaTaskCanvasScope('renderer-task-A', owner);
  assert.equal(mayApplyMediaTaskUpdate('renderer-task-A', f.store, f.host), true);
  f.switchTo('canvas-B', { sameNodeId: { id: 'sameNodeId', assetId: 'sameAssetId' } });
  assert.equal(mayApplyMediaTaskUpdate('renderer-task-A', f.store, f.host), false);
  // Reopening another project with the same saved tab ID still has a new nodes object.
  f.switchTo('canvas-A', { sameNodeId: { id: 'sameNodeId', assetId: 'sameAssetId' } });
  assert.equal(isMediaTaskCanvasCurrent(owner, f.store, f.host), false);
  assert.equal(mayApplyMediaTaskUpdate('renderer-task-A', f.store, f.host), false);
  releaseMediaTaskCanvasScope('renderer-task-A');
});

test('deferred progress rechecks the live nodes object at write time', () => {
  const f = fixture();
  registerMediaTaskCanvasScope('renderer-task-progress', captureMediaTaskCanvasScope(f.store, f.host));
  const pending = () => mayApplyMediaTaskUpdate('renderer-task-progress', f.store, f.host);
  assert.equal(pending(), true);
  f.switchTo('canvas-B', f.getNodes()); // even an unchanged nodes object needs the tab ID check
  assert.equal(pending(), false);
  f.switchTo('canvas-A', { sameNodeId: { id: 'sameNodeId' } }); // hydration replaces the object
  assert.equal(pending(), false);
  releaseMediaTaskCanvasScope('renderer-task-progress');
});

test('unknown task, missing canvas context, duplicate reservation and terminal release fail closed', () => {
  const f = fixture();
  assert.equal(mayApplyMediaTaskUpdate('old-host-task', f.store, f.host), false);
  assert.equal(isMediaTaskCanvasCurrent(null, f.store, f.host), false);
  const owner = captureMediaTaskCanvasScope(f.store, f.host);
  registerMediaTaskCanvasScope('renderer-task-dup', owner);
  assert.throws(() => registerMediaTaskCanvasScope('renderer-task-dup', null), /already reserved/);
  assert.equal(mayApplyMediaTaskUpdate('renderer-task-dup', f.store, f.host), true);
  releaseMediaTaskCanvasScope('renderer-task-dup');
  assert.equal(mayApplyMediaTaskUpdate('renderer-task-dup', f.store, f.host), false);
  registerMediaTaskCanvasScope('renderer-task-null', null);
  assert.equal(mayApplyMediaTaskUpdate('renderer-task-null', f.store, f.host), false);
  releaseMediaTaskCanvasScope('renderer-task-null');
});
