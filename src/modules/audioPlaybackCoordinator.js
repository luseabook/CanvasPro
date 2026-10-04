const clients = new Map();
function normalizeClientId(value) {
  return String(value || '').trim();
}
export function registerAudioPlaybackClient(item, key = {}) {
  const clientId = normalizeClientId(item);
  if (!clientId) return () => {};
  return (
    clients.set(clientId, key),
    () => {
      if (clients.get(clientId) === key) clients.delete(clientId);
    }
  );
}
export function beginAudioPlayback(index) {
  const clientId2 = normalizeClientId(index);
  if (!clientId2) return;
  for (const [result, data] of clients.entries()) {
    if (result === clientId2) continue;
    try {
      data?.stopForExternalPlayback?.();
    } catch {}
  }
}
export function __resetAudioPlaybackCoordinatorForTest() {
  clients.clear();
}
