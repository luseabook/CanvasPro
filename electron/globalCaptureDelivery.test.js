import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GLOBAL_CAPTURE_DELIVERY_CAPACITY,
  GLOBAL_CAPTURE_DELIVERY_TIMEOUT_MS,
  createGlobalCaptureDelivery,
} from './globalCaptureDelivery.js';

function createFakeTimers() {
  const scheduled = [];
  return {
    scheduled: scheduled,
    setTimeoutFn: (fn, ms) => {
      const entry = { fn: fn, ms: ms, cleared: false };
      scheduled.push(entry);
      return entry;
    },
    clearTimeoutFn: (entry) => {
      if (entry) entry.cleared = true;
    },
    fire(entry) {
      if (!entry.cleared) entry.fn();
    },
  };
}

test('globalCaptureDelivery: an unclaimed event stays pending until it is claimed and acknowledged', async () => {
  const delivery = createGlobalCaptureDelivery();
  const queued = delivery.enqueue({ eventId: 'e1', actionId: 'ai-text', text: 'hello' });
  assert.equal(queued.ok, true);
  assert.equal(typeof queued.completion.then, 'function');
  const events = delivery.consumeEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].eventId, 'e1');
  assert.equal(events[0].actionId, 'ai-text');
  assert.equal(typeof events[0].expiresAt, 'number');
  // consumeEvents is a peek: a re-polling renderer sees the event again until it acknowledges it.
  assert.equal(delivery.consumeEvents().length, 1);
  delivery.claim({ eventId: 'e1', receiverId: 'r1' });
  delivery.acknowledge({ eventId: 'e1', receiverId: 'r1', ok: true });
  assert.deepEqual(await queued.completion, { ok: true });
  assert.deepEqual(delivery.consumeEvents(), []);
});

test('globalCaptureDelivery: consumeEvents hands out copies, not the live events', () => {
  const delivery = createGlobalCaptureDelivery();
  delivery.enqueue({ eventId: 'e1', text: 'original' });
  const events = delivery.consumeEvents();
  events[0].text = 'mutated';
  assert.equal(delivery.consumeEvents()[0].text, 'original');
});

test('globalCaptureDelivery: claim requires eventId and a matching receiverId', async () => {
  const delivery = createGlobalCaptureDelivery();
  const queued = delivery.enqueue({ eventId: 'e1', text: 'x' });
  assert.deepEqual(delivery.claim({ eventId: 'missing', receiverId: 'r1' }), {
    ok: false,
    reason: 'capture-unavailable',
  });
  assert.deepEqual(delivery.claim({ eventId: 'e1', receiverId: '  ' }), {
    ok: false,
    reason: 'capture-unavailable',
  });
  assert.deepEqual(delivery.claim({ eventId: 'e1', receiverId: 'r1' }), { ok: true });
  assert.deepEqual(delivery.claim({ eventId: 'e1', receiverId: 'r2' }), {
    ok: false,
    reason: 'capture-unavailable',
  });
  assert.deepEqual(delivery.acknowledge({ eventId: 'e1', receiverId: 'r2', ok: true }), {
    ok: false,
    reason: 'capture-unavailable',
  });
  assert.deepEqual(delivery.acknowledge({ eventId: 'e1', receiverId: 'r1', ok: true }), { ok: true });
  assert.deepEqual(await queued.completion, { ok: true });
  assert.deepEqual(delivery.consumeEvents(), []);
});

test('globalCaptureDelivery: acknowledge without a claim or on a finished event is unavailable', async () => {
  const delivery = createGlobalCaptureDelivery();
  const queued = delivery.enqueue({ eventId: 'e1', text: 'x' });
  assert.deepEqual(delivery.acknowledge({ eventId: 'e1', receiverId: 'r1', ok: true }), {
    ok: false,
    reason: 'capture-unavailable',
  });
  delivery.claim({ eventId: 'e1', receiverId: 'r1' });
  delivery.acknowledge({ eventId: 'e1', receiverId: 'r1', ok: true });
  assert.deepEqual(await queued.completion, { ok: true });
  assert.deepEqual(delivery.acknowledge({ eventId: 'e1', receiverId: 'r1', ok: true }), {
    ok: false,
    reason: 'capture-unavailable',
  });
});

test('globalCaptureDelivery: a failed acknowledgement carries the renderer reason', async () => {
  const delivery = createGlobalCaptureDelivery();
  const queued = delivery.enqueue({ eventId: 'e1', text: 'x' });
  delivery.claim({ eventId: 'e1', receiverId: 'r1' });
  delivery.acknowledge({
    eventId: 'e1',
    receiverId: 'r1',
    ok: false,
    reason: 'node-create-failed',
    retryable: true,
  });
  assert.deepEqual(await queued.completion, {
    ok: false,
    reason: 'node-create-failed',
    retryable: true,
  });
  const fallback = delivery.enqueue({ eventId: 'e2', text: 'y' });
  delivery.claim({ eventId: 'e2', receiverId: 'r1' });
  delivery.acknowledge({ eventId: 'e2', receiverId: 'r1', ok: false });
  assert.deepEqual(await fallback.completion, {
    ok: false,
    reason: 'node-create-failed',
    retryable: false,
  });
});

test('globalCaptureDelivery: rejects duplicates and over-capacity events', () => {
  const delivery = createGlobalCaptureDelivery({ capacity: 3 });
  assert.equal(delivery.enqueue({ eventId: 'e1' }).ok, true);
  assert.equal(delivery.enqueue({ eventId: 'e2' }).ok, true);
  assert.deepEqual(delivery.enqueue({ eventId: 'e1' }), {
    ok: false,
    reason: 'duplicate-event',
    retryable: false,
  });
  assert.equal(delivery.enqueue({ eventId: 'e3' }).ok, true);
  assert.deepEqual(delivery.enqueue({ eventId: 'e4' }), {
    ok: false,
    reason: 'capture-queue-full',
    retryable: true,
  });
  assert.deepEqual(delivery.enqueue({}), { ok: false, reason: 'capture-queue-full', retryable: true });
  assert.deepEqual(createGlobalCaptureDelivery().enqueue({}), {
    ok: false,
    reason: 'duplicate-event',
    retryable: false,
  });
  assert.equal(GLOBAL_CAPTURE_DELIVERY_CAPACITY, 12);
  assert.equal(GLOBAL_CAPTURE_DELIVERY_TIMEOUT_MS, 15000);
  const defaultCapacity = createGlobalCaptureDelivery();
  for (let index = 1; index <= GLOBAL_CAPTURE_DELIVERY_CAPACITY; index += 1)
    assert.equal(defaultCapacity.enqueue({ eventId: 'e' + index }).ok, true);
  assert.equal(defaultCapacity.consumeEvents().length, GLOBAL_CAPTURE_DELIVERY_CAPACITY);
  assert.deepEqual(defaultCapacity.enqueue({ eventId: 'overflow' }), {
    ok: false,
    reason: 'capture-queue-full',
    retryable: true,
  });
});

test('globalCaptureDelivery: aborting the signal cancels an unacknowledged event', async () => {
  const delivery = createGlobalCaptureDelivery();
  assert.deepEqual(delivery.enqueue({ eventId: 'e0' }, { signal: { aborted: true } }), {
    ok: false,
    reason: 'capture-cancelled',
    retryable: false,
  });
  const controller = new AbortController();
  const queued = delivery.enqueue({ eventId: 'e1' }, { signal: controller.signal });
  controller.abort();
  assert.deepEqual(await queued.completion, {
    ok: false,
    reason: 'capture-cancelled',
    retryable: false,
  });
  assert.deepEqual(delivery.consumeEvents(), []);
});

test('globalCaptureDelivery: a delivery timeout is retryable only while unclaimed', async () => {
  const timers = createFakeTimers();
  const delivery = createGlobalCaptureDelivery({ timeoutMs: 120, ...timers });
  const unclaimed = delivery.enqueue({ eventId: 'e1' });
  const claimed = delivery.enqueue({ eventId: 'e2' });
  delivery.claim({ eventId: 'e2', receiverId: 'r1' });
  assert.deepEqual(
    timers.scheduled.map((entry) => entry.ms),
    [120, 120],
  );
  timers.fire(timers.scheduled[0]);
  timers.fire(timers.scheduled[1]);
  assert.deepEqual(await unclaimed.completion, {
    ok: false,
    reason: 'delivery-timeout',
    retryable: true,
  });
  assert.deepEqual(await claimed.completion, {
    ok: false,
    reason: 'delivery-timeout',
    retryable: false,
  });
});

test('globalCaptureDelivery: destroy settles every pending event and blocks new ones', async () => {
  const delivery = createGlobalCaptureDelivery();
  const first = delivery.enqueue({ eventId: 'e1' }),
    second = delivery.enqueue({ eventId: 'e2' });
  delivery.destroy();
  assert.deepEqual(await first.completion, {
    ok: false,
    reason: 'capture-controller-destroyed',
    retryable: false,
  });
  assert.deepEqual(await second.completion, {
    ok: false,
    reason: 'capture-controller-destroyed',
    retryable: false,
  });
  assert.deepEqual(delivery.consumeEvents(), []);
  assert.deepEqual(delivery.enqueue({ eventId: 'e3' }), {
    ok: false,
    reason: 'capture-cancelled',
    retryable: false,
  });
});

test('globalCaptureDelivery: settling clears the timeout timer', async () => {
  const timers = createFakeTimers();
  const delivery = createGlobalCaptureDelivery(timers);
  const queued = delivery.enqueue({ eventId: 'e1' });
  delivery.claim({ eventId: 'e1', receiverId: 'r1' });
  delivery.acknowledge({ eventId: 'e1', receiverId: 'r1', ok: true });
  assert.deepEqual(await queued.completion, { ok: true });
  assert.equal(timers.scheduled[0].cleared, true);
});
