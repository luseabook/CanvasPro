export function createCollaborationChangeFeed({
  read: read,
  onChange: onChange,
  onError: onError,
  signal: signal,
}) {
  let enabled = null,
    setTimeout2,
    enabled2 = false;
  async function start() {
    if (enabled2 || signal.aborted) return;
    let value = 0;
    try {
      const enabled3 = await read(enabled);
      if (enabled2 || signal.aborted) return;
      if (!enabled3?.cursor || !Array.isArray(enabled3.presence)) throw new Error('协作通知无效');
      const item = !enabled || enabled.graph !== enabled3.cursor.graph;
      ((enabled = enabled3.cursor), onChange(enabled3, item));
    } catch (key) {
      if (!enabled2 && !signal.aborted) onError(key);
      value = 1500;
    }
    if (!enabled2 && !signal.aborted) setTimeout2 = setTimeout(start, value);
  }
  return {
    start: start,
    stop() {
      ((enabled2 = true), clearTimeout(setTimeout2));
    },
  };
}
