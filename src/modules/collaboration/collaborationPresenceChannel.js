export function createCollaborationPresenceChannel({
  send: send,
  read: read,
  onUpdate: onUpdate,
  onError: onError,
  signal: signal,
  changeDriven: changeDriven = false,
  now: now = () => performance.now(),
}) {
  let setTimeout2 = null,
    enabled = false,
    value = null,
    item = null,
    key = '',
    index = -Infinity;
  async function run() {
    const now2 = now();
    index = now2;
    const result = read(),
      data = JSON.stringify(result);
    let options = 50;
    try {
      const presence = await send(result);
      if (enabled || signal?.aborted) return;
      if (!Array.isArray(presence?.presence) || !presence.locks)
        throw new Error('鼠标同步响应无效');
      const target = Math.max(0, now() - now2);
      ((item = item == null ? target : item * 0.7 + target * 0.3),
        onUpdate({
          presence: presence.presence,
          locks: presence.locks,
          latencyMs: Math.round(item),
          presenceStatus: 'online',
        }),
        (key = data),
        (options =
          changeDriven && JSON.stringify(read()) === key ? 3000 : Math.max(0, 33 - target)));
    } catch (source) {
      if (!enabled && !signal?.aborted) onError(source);
      options = 1000;
    } finally {
      if (!enabled && !signal?.aborted) setTimeout2 = setTimeout(start, options);
    }
  }
  function start() {
    if (enabled || signal?.aborted) return Promise.resolve();
    if (value) return value;
    return (
      clearTimeout(setTimeout2),
      (value = run().finally(() => {
        value = null;
      })),
      value
    );
  }
  return {
    start: start,
    changed() {
      if (!changeDriven || enabled || value || JSON.stringify(read()) === key) return;
      (clearTimeout(setTimeout2),
        (setTimeout2 = setTimeout(start, Math.max(0, 33 - (now() - index)))));
    },
    async flush() {
      if (value) await value;
      await start();
    },
    stop() {
      ((enabled = true), clearTimeout(setTimeout2));
    },
  };
}
