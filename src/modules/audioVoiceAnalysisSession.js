function normalizeText(value) {
  return String(value || '').trim();
}
export function createAudioVoiceAnalysisSession({ cancelMediaTask: cancelMediaTask = async () => {} } = {}) {
  let item = 0,
    value2 = null;
  async function run(args) {
    if (!args || args.tasksCancelled === true) return;
    args.tasksCancelled = true;
    const list = [...args.taskIds];
    await Promise.allSettled(list.map((key) => cancelMediaTask(key)));
  }
  function isCurrent(enabled) {
    return !!enabled && enabled.invalidated !== true && value2 === enabled;
  }
  function begin({ sourceNodeId: sourceNodeId = '', sourceKey: sourceKey = '' } = {}) {
    value2 && ((value2.invalidated = true), void run(value2));
    const index = {
      id: ++item,
      sourceNodeId: normalizeText(sourceNodeId),
      sourceKey: normalizeText(sourceKey),
      taskIds: new Set(),
      tasksCancelled: false,
      invalidated: false,
    };
    return ((value2 = index), index);
  }
  async function trackTask(result, data) {
    const text = normalizeText(data);
    if (!text) return false;
    if (!isCurrent(result)) return (await cancelMediaTask(text).catch(() => {}), false);
    return (result.taskIds.add(text), true);
  }
  async function invalidate() {
    const enabled2 = value2;
    if (!enabled2) return;
    ((enabled2.invalidated = true), (value2 = null), await run(enabled2));
  }
  function complete(options) {
    if (!isCurrent(options)) return false;
    return ((value2 = null), (options.invalidated = true), true);
  }
  return {
    begin: begin,
    complete: complete,
    getActive: () => value2,
    invalidate: invalidate,
    isActiveFor: (target) => isCurrent(value2) && value2.sourceNodeId === normalizeText(target),
    isCurrent: isCurrent,
    trackTask: trackTask,
  };
}
