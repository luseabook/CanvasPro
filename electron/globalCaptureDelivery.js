export const GLOBAL_CAPTURE_DELIVERY_CAPACITY = 12;
export const GLOBAL_CAPTURE_DELIVERY_TIMEOUT_MS = 15000;

// Hands a captured global-capture event to exactly one renderer receiver: the event stays
// pending until the receiver claims it (by eventId + receiverId) and acknowledges the outcome,
// or until the delivery times out / the capture is cancelled / the controller is destroyed.
export function createGlobalCaptureDelivery({
  capacity = GLOBAL_CAPTURE_DELIVERY_CAPACITY,
  timeoutMs = GLOBAL_CAPTURE_DELIVERY_TIMEOUT_MS,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
} = {}) {
  const pending = new Map();
  let destroyed = false;

  function settle(entry, result) {
    if (pending.get(entry.event.eventId) !== entry) return false;
    pending.delete(entry.event.eventId);
    clearTimeoutFn(entry.timer);
    entry.signal?.removeEventListener('abort', entry.abort);
    entry.resolve(result);
    return true;
  }

  function enqueue(event, { signal } = {}) {
    if (destroyed || signal?.aborted)
      return { ok: false, reason: 'capture-cancelled', retryable: false };
    if (pending.size >= capacity) return { ok: false, reason: 'capture-queue-full', retryable: true };
    if (!event?.eventId || pending.has(event.eventId))
      return { ok: false, reason: 'duplicate-event', retryable: false };
    event.expiresAt = Date.now() + timeoutMs;
    const entry = { event: event, signal: signal, receiverId: '', timer: null };
    const completion = new Promise((resolve) => {
      entry.resolve = resolve;
    });
    pending.set(event.eventId, entry);
    entry.abort = () => settle(entry, { ok: false, reason: 'capture-cancelled', retryable: false });
    signal?.addEventListener('abort', entry.abort, { once: true });
    entry.timer = setTimeoutFn(
      () => settle(entry, { ok: false, reason: 'delivery-timeout', retryable: !entry.receiverId }),
      timeoutMs,
    );
    return { ok: true, completion: completion };
  }

  function claim(payload = {}) {
    const entry = pending.get(String(payload?.eventId || ''));
    const receiverId = String(payload?.receiverId || '').trim();
    if (!entry || !receiverId || (entry.receiverId && entry.receiverId !== receiverId))
      return { ok: false, reason: 'capture-unavailable' };
    entry.receiverId = receiverId;
    return { ok: true };
  }

  function acknowledge(payload = {}) {
    const entry = pending.get(String(payload?.eventId || ''));
    if (!entry || !entry.receiverId || entry.receiverId !== payload?.receiverId)
      return { ok: false, reason: 'capture-unavailable' };
    const succeeded = payload?.ok === true;
    settle(entry, {
      ok: succeeded,
      ...(succeeded
        ? {}
        : {
            reason: String(payload?.reason || 'node-create-failed'),
            retryable: payload?.retryable === true,
          }),
    });
    return { ok: true };
  }

  function consumeEvents() {
    return Array.from(pending.values(), (entry) => ({ ...entry.event }));
  }

  function destroy() {
    destroyed = true;
    for (const entry of pending.values())
      settle(entry, { ok: false, reason: 'capture-controller-destroyed', retryable: false });
  }

  return {
    enqueue: enqueue,
    claim: claim,
    acknowledge: acknowledge,
    consumeEvents: consumeEvents,
    destroy: destroy,
  };
}
