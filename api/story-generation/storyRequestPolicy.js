export function withStoryRequestPolicy(_0x188e5a = {}) {
  return { ..._0x188e5a, stream: !![], streamTimeouts: { idleMs: 0x3 * 0xea60, totalMs: 0x1e * 0xea60 } };
}
export function withReplicationRequestPolicy(_0x9e8076, _0x41c8c4 = {}) {
  return _0x41c8c4['sourceMode'] === 'video-replication'
    ? (_0x5871d6) => _0x9e8076(withStoryRequestPolicy(_0x5871d6))
    : _0x9e8076;
}
