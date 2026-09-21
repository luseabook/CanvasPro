const clients = new Map();
function normalizeClientId(_0x447675) {
  return String(_0x447675 || '').trim();
}
export function registerAudioPlaybackClient(_0x222071, _0x2b95da = {}) {
  const _0x2c5d45 = normalizeClientId(_0x222071);
  if (!_0x2c5d45) return () => {};
  return (
    clients.set(_0x2c5d45, _0x2b95da),
    () => {
      if (clients.get(_0x2c5d45) === _0x2b95da) clients.delete(_0x2c5d45);
    }
  );
}
export function beginAudioPlayback(_0x5eaae6) {
  const _0x5ae610 = normalizeClientId(_0x5eaae6);
  if (!_0x5ae610) return;
  for (const [_0x1c9641, _0x97d9] of clients.entries()) {
    if (_0x1c9641 === _0x5ae610) continue;
    try {
      _0x97d9?.stopForExternalPlayback?.();
    } catch {}
  }
}
export function __resetAudioPlaybackCoordinatorForTest() {
  clients.clear();
}
