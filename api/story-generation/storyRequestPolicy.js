export function withStoryRequestPolicy(args = {}) {
  return { ...args, stream: !![], streamTimeouts: { idleMs: 3 * 60000, totalMs: 30 * 60000 } };
}
export function withReplicationRequestPolicy(handler, value = {}) {
  return value['sourceMode'] === 'video-replication'
    ? (item) => handler(withStoryRequestPolicy(item))
    : handler;
}
