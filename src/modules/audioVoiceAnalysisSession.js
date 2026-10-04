function normalizeText(value) {
  return String(value || '')['trim']();
}
export function createAudioVoiceAnalysisSession({ cancelMediaTask: cancelMediaTask = async () => {} } = {}) {
  let item = 0x0,
    value2 = null;
  async function run(args) {
    if (!args || args['tasksCancelled'] === !![]) return;
    args['tasksCancelled'] = !![];
    const list = [...args['taskIds']];
    await Promise['allSettled'](list['map']((key) => cancelMediaTask(key)));
  }
  function isCurrent(enabled) {
    return !!enabled && enabled['invalidated'] !== !![] && value2 === enabled;
  }
  function begin({ sourceNodeId: sourceNodeId = '', sourceKey: sourceKey = '' } = {}) {
    value2 && ((value2['invalidated'] = !![]), void run(value2));
    const index = {
      id: ++item,
      sourceNodeId: normalizeText(sourceNodeId),
      sourceKey: normalizeText(sourceKey),
      taskIds: new Set(),
      tasksCancelled: ![],
      invalidated: ![],
    };
    return ((value2 = index), index);
  }
  async function trackTask(result, data) {
    const text = normalizeText(data);
    if (!text) return ![];
    if (!isCurrent(result)) return (await cancelMediaTask(text)['catch'](() => {}), ![]);
    return (result['taskIds']['add'](text), !![]);
  }
  async function invalidate() {
    const enabled2 = value2;
    if (!enabled2) return;
    ((enabled2['invalidated'] = !![]), (value2 = null), await run(enabled2));
  }
  function complete(options) {
    if (!isCurrent(options)) return ![];
    return ((value2 = null), (options['invalidated'] = !![]), !![]);
  }
  return {
    begin: begin,
    complete: complete,
    getActive: () => value2,
    invalidate: invalidate,
    isActiveFor: (target) => isCurrent(value2) && value2['sourceNodeId'] === normalizeText(target),
    isCurrent: isCurrent,
    trackTask: trackTask,
  };
}
