import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RENDERER_MEDIA_SLOT_READINESS_STATES,
  RENDERER_MEDIA_SLOT_RESIDENCIES,
  RENDERER_MEDIA_SLOT_SURFACES,
  RENDERER_MEDIA_SLOT_VISIBILITY_TIERS,
  __rendererMediaSlotLifecycleForTest,
  createRendererMediaSlotLifecycle,
  isRendererMediaSlotStable,
} from './rendererMediaSlotLifecycle.js';

const STRICT_FRAME_FACTS = {
  domConnected: true,
  readyState: 2,
  videoWidth: 640,
  videoHeight: 360,
  error: null,
  rvfcObserved: true,
  cssDisplayVisible: true,
  cssVisibilityVisible: true,
  cssOpacityVisible: true,
  overlayClear: true,
};

test('rendererMediaSlotLifecycle: exposes stable enums and strict frame facts', () => {
  assert.ok(RENDERER_MEDIA_SLOT_VISIBILITY_TIERS.includes('focused'));
  assert.ok(RENDERER_MEDIA_SLOT_RESIDENCIES.includes('parked'));
  assert.ok(RENDERER_MEDIA_SLOT_READINESS_STATES.includes('frameReady'));
  assert.ok(RENDERER_MEDIA_SLOT_SURFACES.includes('media'));
  assert.equal(__rendererMediaSlotLifecycleForTest.hasStrictPresentedFrameFacts(STRICT_FRAME_FACTS), true);
  assert.equal(
    __rendererMediaSlotLifecycleForTest.hasStrictPresentedFrameFacts({
      ...STRICT_FRAME_FACTS,
      overlayClear: false,
    }),
    false,
  );
});

test('rendererMediaSlotLifecycle: tracks source tokens, mounting, and presentation', () => {
  const lifecycle = createRendererMediaSlotLifecycle();
  assert.deepEqual(lifecycle.read('slot-a'), {
    visibilityTier: 'far',
    residency: 'unmounted',
    readiness: 'idle',
    surface: 'poster',
    sourceKey: '',
    sourceEpoch: 0,
  });

  assert.equal(
    lifecycle.transition('slot-a', { type: 'visibility', visibilityTier: 'visible' }).changed,
    true,
  );
  assert.equal(lifecycle.transition('slot-a', { type: 'residency', residency: 'mounted' }).changed, true);
  const source = lifecycle.transition('slot-a', { type: 'source-intent', sourceKey: 'src-1' });
  assert.equal(source.state.sourceEpoch, 1);
  assert.deepEqual(source.intents, [
    { type: 'bind-source', slotKey: 'slot-a', sourceKey: 'src-1', sourceEpoch: 1 },
  ]);

  const stale = lifecycle.transition('slot-a', {
    type: 'request-started',
    sourceKey: 'src-1',
    sourceEpoch: 0,
  });
  assert.equal(stale.accepted, false);
  assert.equal(stale.reason, 'stale-source-token');

  assert.equal(
    lifecycle.transition('slot-a', { type: 'request-started', sourceKey: 'src-1', sourceEpoch: 1 }).state
      .readiness,
    'requesting',
  );
  const incomplete = lifecycle.transition('slot-a', {
    type: 'frame-observed',
    sourceKey: 'src-1',
    sourceEpoch: 1,
    facts: { domConnected: true },
  });
  assert.equal(incomplete.accepted, false);
  assert.equal(incomplete.reason, 'presentation-facts-incomplete');

  const ready = lifecycle.transition('slot-a', {
    type: 'frame-observed',
    sourceKey: 'src-1',
    sourceEpoch: 1,
    facts: STRICT_FRAME_FACTS,
  });
  assert.equal(ready.state.readiness, 'frameReady');
  assert.equal(ready.state.surface, 'media');
  assert.equal(isRendererMediaSlotStable(ready.state), true);
});

test('rendererMediaSlotLifecycle: protects active presentation and supports parking', () => {
  const lifecycle = createRendererMediaSlotLifecycle();
  lifecycle.transition('slot-a', { type: 'visibility', visibilityTier: 'visible' });
  lifecycle.transition('slot-a', { type: 'residency', residency: 'mounted' });
  lifecycle.transition('slot-a', { type: 'source-intent', sourceKey: 'src-1' });
  lifecycle.transition('slot-a', { type: 'request-started', sourceKey: 'src-1', sourceEpoch: 1 });
  lifecycle.transition('slot-a', {
    type: 'frame-observed',
    sourceKey: 'src-1',
    sourceEpoch: 1,
    facts: STRICT_FRAME_FACTS,
  });

  assert.equal(
    lifecycle.transition('slot-a', { type: 'poster-requested' }).reason,
    'active-presented-slot-cannot-return-to-poster',
  );
  assert.equal(
    lifecycle.transition('slot-a', { type: 'residency', residency: 'parked' }).reason,
    'active-presented-slot-cannot-park',
  );

  const far = lifecycle.transition('slot-a', { type: 'visibility', visibilityTier: 'far' });
  assert.equal(far.intents[0].type, 'park');
  const parked = lifecycle.transition('slot-a', { type: 'residency', residency: 'parked' });
  assert.equal(parked.accepted, true);
  assert.equal(parked.state.readiness, 'idle');
  assert.equal(parked.state.surface, 'poster');

  assert.throws(() => lifecycle.read(''), { name: 'TypeError' });
  assert.throws(() => lifecycle.transition('slot-a', { type: 'missing' }), { name: 'TypeError' });
});
