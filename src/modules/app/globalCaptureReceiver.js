export function createGlobalCaptureReceiver({ api: api, handle: handle, capacity: capacity = 0x40 } = {}) {
  const receiverId = globalThis['crypto']['randomUUID'](),
    pendingEvents = new Map();
  let disposed = ![];
  async function acknowledgeEvent(eventId, record) {
    try {
      (await api['acknowledgeEvent']({ eventId: eventId, receiverId: receiverId, ...record['outcome'] }),
        (record['acknowledged'] = !![]));
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
      )?.[0x0];
      if (!evictKey) return;
      pendingEvents['delete'](evictKey);
    }
    const entry = { pending: !![], expiresAt: Number(payload['expiresAt']) || Date['now']() + 0x7530 };
    pendingEvents['set'](eventId, entry);
    try {
      const claimResult = await api['claimEvent']({ eventId: eventId, receiverId: receiverId });
      if (claimResult?.['ok'] !== !![]) {
        pendingEvents['delete'](eventId);
        return;
      }
      const handleResult = disposed
        ? { ok: ![], reason: 'receiver-disposed', retryable: !![] }
        : await handle(payload);
      entry['outcome'] = {
        ok: handleResult?.['ok'] === !![],
        ...(handleResult?.['ok'] === !![]
          ? {}
          : {
              reason: String(handleResult?.['reason'] || 'action-failed'),
              retryable: handleResult?.['retryable'] === !![],
            }),
      };
    } catch {
      entry['outcome'] = { ok: ![], reason: 'delivery-uncertain', retryable: ![] };
    }
    ((entry['pending'] = ![]), await acknowledgeEvent(eventId, entry));
  }
  return {
    receive: receive,
    dispose: () => {
      ((disposed = !![]), pendingEvents['clear']());
    },
  };
}
