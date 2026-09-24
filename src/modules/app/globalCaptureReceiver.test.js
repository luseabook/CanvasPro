import assert from 'node:assert/strict';
import test from 'node:test';

import { createGlobalCaptureReceiver } from './globalCaptureReceiver.js';

const settle = () => new Promise((resolve) => setImmediate(resolve));

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createApi({ claimResult = { ok: true } } = {}) {
  const calls = { claimEvent: [], acknowledgeEvent: [] };
  let claimImpl = async () => claimResult;
  let acknowledgeImpl = async () => undefined;
  return {
    calls,
    setClaimImpl(next) {
      claimImpl = next;
    },
    setAcknowledgeImpl(next) {
      acknowledgeImpl = next;
    },
    api: {
      async claimEvent(payload) {
        calls.claimEvent.push(payload);
        return claimImpl(payload);
      },
      async acknowledgeEvent(payload) {
        calls.acknowledgeEvent.push(payload);
        return acknowledgeImpl(payload);
      },
    },
  };
}

test('returns the documented receive/dispose surface', () => {
  const { api } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  assert.equal(typeof receiver.receive, 'function');
  assert.equal(typeof receiver.dispose, 'function');
  assert.deepEqual(Object.keys(receiver).sort(), ['dispose', 'receive']);
});

test('resolves a single receiverId per instance and reuses it on every api call', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive({ eventId: 'evt-1' });
  assert.equal(calls.claimEvent.length, 1);
  assert.equal(calls.acknowledgeEvent.length, 1);
  const receiverId = calls.claimEvent[0].receiverId;
  assert.match(receiverId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  assert.equal(calls.acknowledgeEvent[0].receiverId, receiverId);
  assert.equal(calls.claimEvent[0].eventId, 'evt-1');
});

test('gives distinct receiverIds to distinct instances', async () => {
  const first = createApi();
  const second = createApi();
  const firstReceiver = createGlobalCaptureReceiver({
    api: first.api,
    handle: async () => ({ ok: true }),
  });
  const secondReceiver = createGlobalCaptureReceiver({
    api: second.api,
    handle: async () => ({ ok: true }),
  });
  await firstReceiver.receive({ eventId: 'evt-a' });
  await secondReceiver.receive({ eventId: 'evt-a' });
  assert.notEqual(first.calls.claimEvent[0].receiverId, second.calls.claimEvent[0].receiverId);
});

test('ignores a payload with no eventId and performs no api traffic', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive();
  await receiver.receive({});
  await receiver.receive({ eventId: '' });
  assert.equal(calls.claimEvent.length, 0);
  assert.equal(calls.acknowledgeEvent.length, 0);
});

test('keeps the eventId verbatim (the receiver does not trim)', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive({ eventId: '  evt-pad  ' });
  assert.equal(calls.claimEvent[0].eventId, '  evt-pad  ');
  assert.equal(calls.acknowledgeEvent[0].eventId, '  evt-pad  ');
});

test('a whitespace-only eventId is truthy and is dispatched as-is', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive({ eventId: '   ' });
  assert.equal(calls.claimEvent.length, 1);
  assert.equal(calls.claimEvent[0].eventId, '   ');
});

test('a falsey non-string eventId is dropped', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive({ eventId: 0 });
  await receiver.receive({ eventId: null });
  assert.equal(calls.claimEvent.length, 0);
});

test('numeric eventIds are coerced to strings', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive({ eventId: 12345 });
  assert.equal(calls.claimEvent[0].eventId, '12345');
});

test('happy path: claim then handle then acknowledge with ok:true', async () => {
  const { api, calls } = createApi();
  const handled = [];
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async (payload) => {
      handled.push(payload);
      return { ok: true, nodeId: 'node-1' };
    },
  });
  await receiver.receive({ eventId: 'evt-ok', actionId: 'ai-text' });
  assert.equal(calls.claimEvent.length, 1);
  assert.deepEqual(calls.claimEvent[0].eventId, 'evt-ok');
  assert.equal(handled.length, 1);
  assert.equal(handled[0].actionId, 'ai-text');
  assert.equal(calls.acknowledgeEvent.length, 1);
  assert.deepEqual(calls.acknowledgeEvent[0], {
    eventId: 'evt-ok',
    receiverId: calls.claimEvent[0].receiverId,
    ok: true,
  });
});

test('a failed claim short-circuits: no handle, no acknowledge, id stays re-claimable', async () => {
  const { api, calls } = createApi({ claimResult: { ok: false, reason: 'already-claimed' } });
  let handleCalls = 0;
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => {
      handleCalls += 1;
      return { ok: true };
    },
  });
  await receiver.receive({ eventId: 'evt-lost' });
  assert.equal(handleCalls, 0);
  assert.equal(calls.acknowledgeEvent.length, 0);
  await receiver.receive({ eventId: 'evt-lost' });
  assert.equal(calls.claimEvent.length, 2);
  assert.equal(handleCalls, 0);
});

test('a claim answering without a boolean ok is treated as a failure', async () => {
  const { api, calls } = createApi({ claimResult: {} });
  let handleCalls = 0;
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => {
      handleCalls += 1;
      return { ok: true };
    },
  });
  await receiver.receive({ eventId: 'evt-no-ok' });
  assert.equal(handleCalls, 0);
  assert.equal(calls.acknowledgeEvent.length, 0);
});

test('handle reporting a failure forwards reason and retryable to the acknowledgement', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => ({ ok: false, reason: 'node-create-failed', retryable: true }),
  });
  await receiver.receive({ eventId: 'evt-fail' });
  assert.deepEqual(calls.acknowledgeEvent[0], {
    eventId: 'evt-fail',
    receiverId: calls.claimEvent[0].receiverId,
    ok: false,
    reason: 'node-create-failed',
    retryable: true,
  });
});

test('handle failure without a reason falls back to action-failed and retryable:false', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: false }) });
  await receiver.receive({ eventId: 'evt-bare' });
  assert.equal(calls.acknowledgeEvent[0].reason, 'action-failed');
  assert.equal(calls.acknowledgeEvent[0].retryable, false);
});

test('a non-boolean retryable is normalised to false', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => ({ ok: false, reason: 'boom', retryable: 'yes' }),
  });
  await receiver.receive({ eventId: 'evt-retry' });
  assert.equal(calls.acknowledgeEvent[0].retryable, false);
});

test('a non-string reason is coerced to a string', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: false, reason: 42 }) });
  await receiver.receive({ eventId: 'evt-num' });
  assert.equal(calls.acknowledgeEvent[0].reason, '42');
});

test('a handle returning nothing is acknowledged as action-failed', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => undefined });
  await receiver.receive({ eventId: 'evt-undefined' });
  assert.deepEqual(calls.acknowledgeEvent[0], {
    eventId: 'evt-undefined',
    receiverId: calls.claimEvent[0].receiverId,
    ok: false,
    reason: 'action-failed',
    retryable: false,
  });
});

test('a throwing handle is acknowledged as delivery-uncertain and is not retryable', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => {
      throw new Error('handler exploded');
    },
  });
  await receiver.receive({ eventId: 'evt-throw' });
  assert.deepEqual(calls.acknowledgeEvent[0], {
    eventId: 'evt-throw',
    receiverId: calls.claimEvent[0].receiverId,
    ok: false,
    reason: 'delivery-uncertain',
    retryable: false,
  });
});

test('a throwing claimEvent is also acknowledged as delivery-uncertain', async () => {
  const { api, calls } = createApi();
  api.claimEvent = async () => {
    throw new Error('transport down');
  };
  let handleCalls = 0;
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => {
      handleCalls += 1;
      return { ok: true };
    },
  });
  await receiver.receive({ eventId: 'evt-claim-throw' });
  assert.equal(handleCalls, 0);
  assert.equal(calls.acknowledgeEvent.length, 1);
  assert.equal(calls.acknowledgeEvent[0].reason, 'delivery-uncertain');
  assert.equal(calls.acknowledgeEvent[0].ok, false);
});

test('an acknowledgement transport failure is swallowed', async () => {
  const { api, calls, setAcknowledgeImpl } = createApi();
  setAcknowledgeImpl(async () => {
    throw new Error('ack transport down');
  });
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive({ eventId: 'evt-ack-throw' });
  assert.equal(calls.acknowledgeEvent.length, 1);
  assert.equal(calls.acknowledgeEvent[0].ok, true);
});

test('a second receive for an in-flight event is ignored (no double claim)', async () => {
  const { api, calls } = createApi();
  const deferred = createDeferred();
  let handleCalls = 0;
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => {
      handleCalls += 1;
      return deferred.promise;
    },
  });
  const inflight = receiver.receive({ eventId: 'evt-dup' });
  await settle();
  await receiver.receive({ eventId: 'evt-dup' });
  assert.equal(calls.claimEvent.length, 1);
  assert.equal(handleCalls, 1);
  deferred.resolve({ ok: true });
  await inflight;
  assert.equal(calls.acknowledgeEvent.length, 1);
});

test('a repeat of a settled event is re-acknowledged from the retained record without re-dispatch', async () => {
  const { api, calls } = createApi();
  let handleCalls = 0;
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => {
      handleCalls += 1;
      return { ok: true };
    },
  });
  await receiver.receive({ eventId: 'evt-repeat' });
  await receiver.receive({ eventId: 'evt-repeat' });
  assert.equal(calls.claimEvent.length, 1);
  assert.equal(handleCalls, 1);
  assert.equal(calls.acknowledgeEvent.length, 2);
  assert.deepEqual(calls.acknowledgeEvent[1], calls.acknowledgeEvent[0]);
});

test('a repeat of a failed event replays the cached failure', async () => {
  const { api, calls } = createApi();
  let handleCalls = 0;
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => {
      handleCalls += 1;
      return { ok: false, reason: 'node-not-ready', retryable: true };
    },
  });
  await receiver.receive({ eventId: 'evt-replay' });
  await receiver.receive({ eventId: 'evt-replay' });
  assert.equal(handleCalls, 1);
  assert.equal(calls.acknowledgeEvent.length, 2);
  assert.equal(calls.acknowledgeEvent[1].reason, 'node-not-ready');
  assert.equal(calls.acknowledgeEvent[1].retryable, true);
});

test('dispose blocks further receives', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  receiver.dispose();
  await receiver.receive({ eventId: 'evt-after-dispose' });
  assert.equal(calls.claimEvent.length, 0);
  assert.equal(calls.acknowledgeEvent.length, 0);
});

test('dispose while the claim is in flight acknowledges receiver-disposed without dispatching', async () => {
  const { api, calls, setClaimImpl } = createApi();
  const deferred = createDeferred();
  setClaimImpl(async () => deferred.promise);
  let handleCalls = 0;
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => {
      handleCalls += 1;
      return { ok: true };
    },
  });
  const inflight = receiver.receive({ eventId: 'evt-claim-dispose' });
  await settle();
  assert.equal(calls.claimEvent.length, 1);
  receiver.dispose();
  deferred.resolve({ ok: true });
  await inflight;
  assert.equal(handleCalls, 0);
  assert.deepEqual(calls.acknowledgeEvent[0], {
    eventId: 'evt-claim-dispose',
    receiverId: calls.claimEvent[0].receiverId,
    ok: false,
    reason: 'receiver-disposed',
    retryable: true,
  });
});

test('dispose while handle is in flight does not override the handler result', async () => {
  const { api, calls } = createApi();
  const deferred = createDeferred();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => deferred.promise });
  const inflight = receiver.receive({ eventId: 'evt-handle-dispose' });
  await settle();
  receiver.dispose();
  deferred.resolve({ ok: true, nodeId: 'node-1' });
  await inflight;
  assert.deepEqual(calls.acknowledgeEvent[0], {
    eventId: 'evt-handle-dispose',
    receiverId: calls.claimEvent[0].receiverId,
    ok: true,
  });
});

test('dispose is idempotent and keeps blocking receives', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive({ eventId: 'evt-before' });
  receiver.dispose();
  receiver.dispose();
  await receiver.receive({ eventId: 'evt-before' });
  await receiver.receive({ eventId: 'evt-after' });
  assert.equal(calls.claimEvent.length, 1);
  assert.equal(calls.acknowledgeEvent.length, 1);
});

test('capacity default (0x40 = 64) retains a settled record for replay', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  for (let index = 0; index < 0x40; index += 1) await receiver.receive({ eventId: `evt-${index}` });
  assert.equal(calls.claimEvent.length, 0x40);
  await receiver.receive({ eventId: 'evt-0' });
  assert.equal(calls.claimEvent.length, 0x40);
  assert.equal(calls.acknowledgeEvent.length, 0x41);
});

test('at capacity an acknowledged record is evicted to make room', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }), capacity: 1 });
  await receiver.receive({ eventId: 'evt-first' });
  await receiver.receive({ eventId: 'evt-second' });
  assert.equal(calls.claimEvent.length, 2);
  assert.equal(calls.claimEvent[1].eventId, 'evt-second');
  await receiver.receive({ eventId: 'evt-first' });
  assert.equal(calls.claimEvent.length, 3);
  assert.equal(calls.claimEvent[2].eventId, 'evt-first');
});

test('an expired record is evictable even when it was never acknowledged', async () => {
  const { api, calls, setAcknowledgeImpl } = createApi();
  setAcknowledgeImpl(async () => {
    throw new Error('ack down');
  });
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }), capacity: 1 });
  await receiver.receive({ eventId: 'evt-expired', expiresAt: 1 });
  await receiver.receive({ eventId: 'evt-next' });
  assert.equal(calls.claimEvent.length, 2);
  assert.equal(calls.claimEvent[1].eventId, 'evt-next');
});

test('an unacknowledged, unexpired record is not evictable so a new event is dropped', async () => {
  const { api, calls, setAcknowledgeImpl } = createApi();
  setAcknowledgeImpl(async () => {
    throw new Error('ack down');
  });
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }), capacity: 1 });
  await receiver.receive({ eventId: 'evt-stuck' });
  await receiver.receive({ eventId: 'evt-blocked' });
  assert.equal(calls.claimEvent.length, 1);
  assert.equal(calls.claimEvent[0].eventId, 'evt-stuck');
});

test('an in-flight record is not evictable', async () => {
  const { api, calls } = createApi();
  const deferred = createDeferred();
  const receiver = createGlobalCaptureReceiver({
    api,
    handle: async () => deferred.promise,
    capacity: 1,
  });
  const inflight = receiver.receive({ eventId: 'evt-pending' });
  await settle();
  await receiver.receive({ eventId: 'evt-pending-2' });
  assert.equal(calls.claimEvent.length, 1);
  deferred.resolve({ ok: true });
  await inflight;
});

test('a numeric expiresAt is honoured and a falsey one falls back to now + 0x7530', async () => {
  const originalNow = Date.now;
  let frozen = 1000;
  Date.now = () => frozen;
  try {
    const { api, calls, setAcknowledgeImpl } = createApi();
    setAcknowledgeImpl(async () => {
      throw new Error('ack down');
    });
    const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }), capacity: 1 });
    await receiver.receive({ eventId: 'evt-default-expiry' });
    frozen = 1000 + 0x7530;
    await receiver.receive({ eventId: 'evt-after-default-expiry' });
    assert.equal(calls.claimEvent.length, 2);
    assert.equal(calls.claimEvent[1].eventId, 'evt-after-default-expiry');
  } finally {
    Date.now = originalNow;
  }
});

test('a falsey expiresAt does not expire before the 0x7530 window elapses', async () => {
  const originalNow = Date.now;
  let frozen = 5000;
  Date.now = () => frozen;
  try {
    const { api, calls, setAcknowledgeImpl } = createApi();
    setAcknowledgeImpl(async () => {
      throw new Error('ack down');
    });
    const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }), capacity: 1 });
    await receiver.receive({ eventId: 'evt-window' });
    frozen = 5000 + 0x752f;
    await receiver.receive({ eventId: 'evt-inside-window' });
    assert.equal(calls.claimEvent.length, 1);
  } finally {
    Date.now = originalNow;
  }
});

test('capacity 0 drops every fresh event', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }), capacity: 0 });
  await receiver.receive({ eventId: 'evt-zero' });
  assert.equal(calls.claimEvent.length, 0);
});

test('the settled record keeps its entry so acknowledge runs exactly once per dispatch', async () => {
  const { api, calls } = createApi();
  const receiver = createGlobalCaptureReceiver({ api, handle: async () => ({ ok: true }) });
  await receiver.receive({ eventId: 'evt-once' });
  assert.equal(calls.acknowledgeEvent.length, 1);
  await settle();
  assert.equal(calls.acknowledgeEvent.length, 1);
});
