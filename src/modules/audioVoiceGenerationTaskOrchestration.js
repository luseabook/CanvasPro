import { runTaskBatchQueue } from '../core/taskBatchExecution.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function createAudioVoiceGenerationOwnerKey(item, key) {
  return (normalizeText(item) || 'source') + '\x1f' + normalizeText(key);
}
export function normalizeAudioVoiceBatchConcurrencyLimit(index, result = 0x1) {
  const count = Number(result),
    data = Number['isFinite'](count) && count > 0x0 ? Math['max'](0x1, Math['floor'](count)) : 0x1,
    count2 = Number(index);
  if (!Number['isFinite'](count2) || count2 <= 0x0) return data;
  return Math['max'](0x1, Math['floor'](count2));
}
export function resolveAudioVoiceProviderBatchConcurrency(options = {}, target = {}, source = 0x1) {
  const text = normalizeText(target?.['provider'])['toLowerCase'](),
    text2 = normalizeText(target?.['adapterType'])['toLowerCase'](),
    next = text === 'runninghubwf' || (text === 'runninghub' && text2 === 'workflow'),
    current = text === 'runninghub' && text2 === 'modelapi';
  if (next)
    return normalizeAudioVoiceBatchConcurrencyLimit(
      options['workflowConcurrentLimit'] ??
        options['runninghubWorkflowConcurrentLimit'] ??
        options['concurrentLimit'],
      source,
    );
  if (current)
    return normalizeAudioVoiceBatchConcurrencyLimit(
      options['modelConcurrentLimit'] ??
        options['runninghubModelConcurrentLimit'] ??
        options['concurrentLimit'],
      source,
    );
  return normalizeAudioVoiceBatchConcurrencyLimit(options['concurrentLimit'], source);
}
export async function resolveAudioVoiceProviderBatchConcurrencyWithProbe(
  options2 = {},
  entry = {},
  record = {},
) {
  const audioVoiceProviderBatchConcurrency = resolveAudioVoiceProviderBatchConcurrency(options2, entry),
    text3 = normalizeText(entry?.['provider'])['toLowerCase'](),
    text4 = normalizeText(entry?.['adapterType'])['toLowerCase'](),
    enabled = text3 === 'runninghubwf' || (text3 === 'runninghub' && text4 === 'workflow'),
    handler =
      typeof record['fetchRunningHubWorkflowQueueStatus'] === 'function'
        ? record['fetchRunningHubWorkflowQueueStatus']
        : null,
    text5 = normalizeText(options2?.['apiKey']);
  if (!enabled || !handler || !text5) return audioVoiceProviderBatchConcurrency;
  const payload = await handler(options2)['catch'](() => null);
  return normalizeAudioVoiceBatchConcurrencyLimit(
    payload?.['concurrentLimit'] ?? audioVoiceProviderBatchConcurrency,
    audioVoiceProviderBatchConcurrency,
  );
}
export async function runAudioVoiceBatchGenerationQueue(list = [], runTarget, concurrency = {}) {
  const targets = Array['isArray'](list) ? list['filter'](Boolean) : [];
  if (!targets['length'] || typeof runTarget !== 'function') return [];
  return runTaskBatchQueue({
    targets: targets,
    concurrency: concurrency['concurrency'],
    shouldStop: concurrency['shouldStop'],
    onTargetStart: concurrency['onTargetStart'],
    onTargetSettled: concurrency['onTargetSettled'],
    runTarget: runTarget,
  });
}
export function createAudioVoiceGenerationTaskStoreAdapter({
  sourceNodeId: sourceNodeId = '',
  segmentId: segmentId = '',
  targetNodeId: targetNodeId = '',
  readCurrentSourceNodeId: readCurrentSourceNodeId = () => '',
  readCurrentSegment: readCurrentSegment = () => ({}),
  updateCurrentSegment: updateCurrentSegment = () => {},
  readPersistedSnapshot: readPersistedSnapshot = () => null,
  writePersistedSnapshot: writePersistedSnapshot = () => {},
  buildTaskNode: buildTaskNode = (handle) => handle,
} = {}) {
  const text6 = normalizeText(sourceNodeId),
    text7 = normalizeText(segmentId),
    text8 = normalizeText(targetNodeId);
  function run() {
    return normalizeText(readCurrentSourceNodeId()) === text6;
  }
  function run2() {
    if (run()) return readCurrentSegment(text7) || {};
    const persistedSnapshot = readPersistedSnapshot(text6);
    return persistedSnapshot?.['segments']?.['find']((state) => normalizeText(state?.['id']) === text7) || {};
  }
  return {
    getState() {
      return { nodes: { [text8]: buildTaskNode(run2()) } };
    },
    updateNodeData(config, args = {}) {
      if (normalizeText(config) !== text8) return;
      if (run()) {
        updateCurrentSegment(text7, args);
        return;
      }
      const segments = readPersistedSnapshot(text6);
      if (!segments || !Array['isArray'](segments['segments'])) return;
      const count3 = segments['segments']['findIndex']((scope) => normalizeText(scope?.['id']) === text7);
      if (count3 < 0x0) return;
      writePersistedSnapshot(text6, {
        ...segments,
        segments: segments['segments']['map']((args2, input) =>
          input === count3 ? { ...args2, ...args } : args2,
        ),
      });
    },
    addNode() {},
  };
}
export function createAudioVoiceGenerationTaskOrchestration({ createStore: createStore } = {}) {
  if (typeof createStore !== 'function')
    throw new Error('[audioVoiceGeneration]\x20createStore\x20is\x20required');
  const map = new Map(),
    map2 = new Map();
  let output = 0x0;
  function run3(options3 = {}) {
    const sourceNodeId2 = normalizeText(options3['sourceNodeId']),
      segmentId2 = normalizeText(options3['segmentId']),
      targetNodeId2 = normalizeText(options3['targetNodeId']);
    return {
      sourceNodeId: sourceNodeId2,
      segmentId: segmentId2,
      targetNodeId: targetNodeId2,
      key: createAudioVoiceGenerationOwnerKey(sourceNodeId2, segmentId2),
    };
  }
  function run4(options4 = {}) {
    const event = run3(options4),
      value2 = map['get'](event['key']);
    if (value2) return value2;
    const event2 = { ...event, store: null };
    return ((event2['store'] = createStore(event2)), map['set'](event2['key'], event2), event2);
  }
  function getStore(options5 = {}) {
    return run4(options5)['store'];
  }
  function begin(options6 = {}, { abortController: abortController = null } = {}) {
    const event3 = run4(options6),
      value3 = map2['get'](event3['key']);
    if (value3) return value3;
    const value4 = {
      ...event3,
      id: ++output,
      abortController: abortController,
      apiKey: '',
      cancelInFlight: ![],
      cancelRequested: ![],
    };
    return (map2['set'](event3['key'], value4), value4);
  }
  function getRun(value5, value6) {
    return map2['get'](createAudioVoiceGenerationOwnerKey(value5, value6)) || null;
  }
  function isCurrent(event4) {
    return !!event4 && map2['get'](event4['key']) === event4;
  }
  function finish(event5) {
    if (!isCurrent(event5)) return ![];
    return (map2['delete'](event5['key']), !![]);
  }
  function setCancelInFlight(value7, value8) {
    if (!isCurrent(value7)) return ![];
    value7['cancelInFlight'] = value8 === !![];
    if (value7['cancelInFlight']) value7['cancelRequested'] = !![];
    return !![];
  }
  return {
    begin: begin,
    finish: finish,
    getRun: getRun,
    getStore: getStore,
    isCancelInFlight: (value9, value10) => getRun(value9, value10)?.['cancelInFlight'] === !![],
    isCurrent: isCurrent,
    setCancelInFlight: setCancelInFlight,
  };
}
