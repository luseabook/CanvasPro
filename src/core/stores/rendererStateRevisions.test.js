import test from 'node:test';
import assert from 'node:assert/strict';

import { createRendererStateRevisionTracker } from './rendererStateRevisions.js';

test('rendererStateRevisions: tracks graph, geometry, media, and render revisions', () => {
  const video = { type: 'source-video', videoProxyVersion: '1' };
  const unchangedVideo = { ...video };
  const image = { id: 'image-1', type: 'image', x: 1, y: 2 };
  const state = { nodes: { image, video } };
  const tracker = createRendererStateRevisionTracker(state);

  tracker.add(image, image);
  assert.deepEqual(
    [state._nodesRev, state._nodeMembershipRev, state._nodeGeometryRev, state._sourceVideoRev],
    [1, 1, 1, undefined],
  );

  tracker.content();
  tracker.geometry();
  assert.equal(state._nodesRev, 3);
  assert.equal(state._nodeGeometryRev, 2);

  tracker.patch(image, { ...image, x: 2 });
  assert.equal(state._nodesRev, 4);
  assert.equal(state._nodeGeometryRev, 3);
  assert.equal(state._sourceVideoRev, undefined);

  tracker.patch(video, { ...video, videoProxyVersion: '2' });
  tracker.patch(unchangedVideo, unchangedVideo);
  assert.equal(state._nodesRev, 6);
  assert.equal(state._sourceVideoRev, 1);

  tracker.remove(['missing']);
  assert.equal(state._nodesRev, 6);
  tracker.remove(['video']);
  assert.equal(state._nodesRev, 7);
  assert.equal(state._nodeMembershipRev, 2);
  assert.equal(state._nodeGeometryRev, 4);
  assert.equal(state._sourceVideoRev, 2);

  tracker.renderRequest();
  assert.equal(state._renderRequestRev, 1);
});

test('rendererStateRevisions: commits content, geometry, and source-video changes as one batch', () => {
  const state = { nodes: {} };
  const tracker = createRendererStateRevisionTracker(state);
  const batch = tracker.batch();

  batch.patch({ id: 'node-1', x: 1 }, { id: 'node-1', x: 2 });
  batch.patch(
    { type: 'source-video', videoProxyVersion: '1' },
    { type: 'source-video', videoProxyVersion: '2' },
  );
  assert.equal(state._nodesRev, undefined);
  batch.commit();

  assert.equal(state._nodesRev, 1);
  assert.equal(state._nodeGeometryRev, 1);
  assert.equal(state._sourceVideoRev, 1);
  assert.equal(state._nodeMembershipRev, undefined);

  tracker.reload();
  assert.equal(state._nodesRev, 2);
  assert.equal(state._nodeMembershipRev, 1);
  assert.equal(state._nodeGeometryRev, 2);
  assert.equal(state._sourceVideoRev, 2);
});
