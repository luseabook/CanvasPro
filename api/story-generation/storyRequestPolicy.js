export function withStoryRequestPolicy(args = {}) {
  return { ...args, stream: !![], streamTimeouts: { idleMs: 0x3 * 0xea60, totalMs: 0x1e * 0xea60 } };
}
export function withReplicationRequestPolicy(handler, value = {}) {
  return value['sourceMode'] === 'video-replication'
    ? (item) => handler(withStoryRequestPolicy(item))
    : handler;
}
