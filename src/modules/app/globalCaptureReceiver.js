export function createGlobalCaptureReceiver({ api: api, handle: handle, capacity: capacity = 64 } = {}) {
  const receiverId = globalThis['crypto']['randomUUID'](),
    pendingEvents = new Map();
  let disposed = false;
  async function acknowledgeEvent(eventId, record) {
    try {
      (await api['acknowledgeEvent']({ eventId: eventId, receiverId: receiverId, ...record['outcome'] }),
        (record['acknowledged'] = true));
    } catch {}
  }
  async function receive(payload = {}) {
    if (disposed) return;
    const eventId = String(payload['eventId'] || '');
    if (!eventId) return;
    const existingRecord = pendingEvents['get'](eventId);
    if (existingRecord?.['pending']) return;
    if (existingRecord) {
      await acknowledgeEvent(eventId, existingRecord);
      return;
    }
    if (pendingEvents['size'] >= capacity) {
      const evictKey = [...pendingEvents]['find'](
        ([, candidate]) =>
          !candidate['pending'] && (candidate['acknowledged'] || candidate['expiresAt'] <= Date['now']()),
      )?.[0];
      if (!evictKey) return;
      pendingEvents['delete'](evictKey);
    }
    const entry = { pending: true, expiresAt: Number(payload['expiresAt']) || Date['now']() + 30000 };
    pendingEvents['set'](eventId, entry);
    try {
      const claimResult = await api['claimEvent']({ eventId: eventId, receiverId: receiverId });
      if (claimResult?.['ok'] !== true) {
        pendingEvents['delete'](eventId);
        return;
      }
      const handleResult = disposed
        ? { ok: false, reason: 'receiver-disposed', retryable: true }
        : await handle(payload);
      entry['outcome'] = {
        ok: handleResult?.['ok'] === true,
        ...(handleResult?.['ok'] === true
          ? {}
          : {
              reason: String(handleResult?.['reason'] || 'action-failed'),
              retryable: handleResult?.['retryable'] === true,
            }),
      };
    } catch {
      entry['outcome'] = { ok: false, reason: 'delivery-uncertain', retryable: false };
    }
    ((entry['pending'] = false), await acknowledgeEvent(eventId, entry));
  }
  return {
    receive: receive,
    dispose: () => {
      ((disposed = true), pendingEvents['clear']());
    },
  };
}
