import { getProviderConfig } from './configApi.js';
import { fetchRunningHubWorkflowQueueStatus } from './runningHubQueueStatusApi.js';
import {
  getRunningHubProviderProfileId,
  RUNNINGHUB_DOMESTIC_PROFILE_ID,
  normalizeRunningHubModelApiProfileId,
  resolveRunningHubModelApiProfileId,
} from '../src/modules/runningHubProviderProfiles.js';
const DEFAULT_RUNNINGHUB_WORKFLOW_CONCURRENCY = 1,
  DEFAULT_RUNNINGHUB_WORKFLOW_QUEUE_POLL_INTERVAL_MS = 2000,
  PROVIDER_KEY = 'runninghubwf',
  queues = new Map(),
  sessionConcurrencyProbes = new Map();
let nextQueueItemId = 1;
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array['isArray'](enabled);
}
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeProviderId(item) {
  return normalizeText(item)['toLowerCase']();
}
function normalizeAdapterType(key) {
  return normalizeText(key)['toLowerCase']();
}
export function normalizeRunningHubWorkflowConcurrencyLimit(
  index,
  result = DEFAULT_RUNNINGHUB_WORKFLOW_CONCURRENCY,
) {
  const data = Math['max'](1, Math['floor'](Number(result) || DEFAULT_RUNNINGHUB_WORKFLOW_CONCURRENCY)),
    count = Number(index);
  if (!Number['isFinite'](count) || count <= 0) return data;
  return Math['max'](1, Math['floor'](count));
}
function resolveRunningHubWorkflowProfileId(options = {}) {
  const runningHubProviderProfileId = getRunningHubProviderProfileId(options),
    text = normalizeText(readProviderConfig('runninghubwf')?.['providerProfileId']);
  return resolveRunningHubModelApiProfileId(
    options?.['model'] || options?.['modelId'],
    runningHubProviderProfileId || text,
  );
}
function readProviderConfig(target) {
  try {
    return getProviderConfig(target) || {};
  } catch {
    return {};
  }
}
export function resolveRunningHubWorkflowQueueConfig({
  payload: payload = {},
  providerConfig: providerConfig = null,
  concurrency: concurrency = null,
} = {}) {
  const providerProfileId2 = resolveRunningHubWorkflowProfileId(payload),
    providerConfig2 = isPlainObject(providerConfig) ? providerConfig : readProviderConfig(providerProfileId2),
    apiKey2 = normalizeText(payload?.['apiKey'] || providerConfig2?.['apiKey']),
    source =
      concurrency ??
      payload?.['workflowConcurrentLimit'] ??
      payload?.['runninghubWorkflowConcurrentLimit'] ??
      providerConfig2?.['workflowConcurrentLimit'] ??
      providerConfig2?.['runninghubWorkflowConcurrentLimit'] ??
      providerConfig2?.['concurrentLimit'];
  return {
    apiKey: apiKey2,
    providerProfileId: providerProfileId2,
    concurrentLimit: normalizeRunningHubWorkflowConcurrencyLimit(source, 1),
    providerConfig: providerConfig2,
  };
}
export function isRunningHubWorkflowQueueTarget({
  providerId: providerId = '',
  provider: provider = '',
  adapterType: adapterType = '',
  executionManifest: executionManifest = null,
  payload: payload = {},
} = {}) {
  const providerId2 = normalizeProviderId(
      providerId || provider || executionManifest?.['provider'] || payload?.['provider'],
    ),
    adapterType2 = normalizeAdapterType(
      adapterType || executionManifest?.['adapterType'] || payload?.['adapterType'],
    ),
    text2 = normalizeText(payload?.['model'] || payload?.['modelId']);
  return (
    providerId2 === 'runninghubwf' ||
    (providerId2 === 'runninghub' && adapterType2 === 'workflow') ||
    (adapterType2 === 'workflow' && text2['startsWith']('runninghub/'))
  );
}
function createAbortError() {
  const error = new Error('CANCELLED');
  return ((error['name'] = 'AbortError'), error);
}
function normalizeQueueKey(next, current) {
  const runningHubModelApiProfileId = normalizeRunningHubModelApiProfileId(
      current || RUNNINGHUB_DOMESTIC_PROFILE_ID,
    ),
    text3 = normalizeText(next);
  return text3
    ? PROVIDER_KEY + ':' + runningHubModelApiProfileId + ':' + text3
    : PROVIDER_KEY + ':' + runningHubModelApiProfileId + ':default';
}
function isMatchingLease(entry, record) {
  return isPlainObject(entry) && entry['provider'] === PROVIDER_KEY && entry['queueKey'] === record;
}
function getQueue(queueKey) {
  let enabled2 = queues['get'](queueKey);
  return (
    !enabled2 &&
      ((enabled2 = {
        queueKey: queueKey,
        active: 0,
        concurrentLimit: DEFAULT_RUNNINGHUB_WORKFLOW_CONCURRENCY,
        remoteOccupiedCount: 0,
        remoteRunningCount: 0,
        remoteQueuedCount: 0,
        waiting: [],
        probeTimer: null,
        probeOptions: null,
      }),
      queues['set'](queueKey, enabled2)),
    enabled2
  );
}
function getProbeKey(handle) {
  return handle || PROVIDER_KEY + ':default';
}
function normalizeRemoteCount(state) {
  const count2 = Number(state);
  return Number['isFinite'](count2) && count2 > 0 ? Math['floor'](count2) : 0;
}
function normalizeQueueStatus(config, scope = 1) {
  const count3 = Number(config?.['concurrentLimit']);
  if (!Number['isFinite'](count3) || count3 <= 0) return null;
  const runningCount = normalizeRemoteCount(config?.['runningCount']),
    queuedCount = normalizeRemoteCount(config?.['queuedCount']),
    count4 = Number(config?.['totalCurrentTasks']);
  return {
    concurrentLimit: normalizeRunningHubWorkflowConcurrencyLimit(count3, scope),
    runningCount: runningCount,
    queuedCount: queuedCount,
    totalCurrentTasks:
      Number['isFinite'](count4) && count4 >= 0 ? Math['floor'](count4) : runningCount + queuedCount,
  };
}
function applyRemoteQueueStatus(input, output) {
  const queueStatus = normalizeQueueStatus(output, input['concurrentLimit']);
  if (!queueStatus) return false;
  return (
    (input['concurrentLimit'] = queueStatus['concurrentLimit']),
    input['active'] === 0 &&
      ((input['remoteRunningCount'] = queueStatus['runningCount']),
      (input['remoteQueuedCount'] = queueStatus['queuedCount']),
      (input['remoteOccupiedCount'] = queueStatus['totalCurrentTasks'])),
    true
  );
}
async function probeRunningHubWorkflowQueueStatus({
  apiKey: apiKey = '',
  providerConfig: providerConfig = null,
  concurrencyProbe: concurrencyProbe = null,
} = {}) {
  const apiKey3 = normalizeText(apiKey);
  if (!apiKey3) return null;
  const run = typeof concurrencyProbe === 'function' ? concurrencyProbe : fetchRunningHubWorkflowQueueStatus,
    value2 = await run({
      ...(isPlainObject(providerConfig) ? providerConfig : {}),
      apiKey: apiKey3,
    });
  return normalizeQueueStatus(value2);
}
async function ensureSessionQueueStatus(concurrentLimit2, value3 = {}) {
  const text4 = normalizeText(value3['apiKey']);
  if (!text4 || value3['autoProbeConcurrency'] === false)
    return {
      concurrentLimit: concurrentLimit2['concurrentLimit'],
      runningCount: 0,
      queuedCount: 0,
      totalCurrentTasks: 0,
    };
  const probeKey = getProbeKey(concurrentLimit2['queueKey']),
    value4 = sessionConcurrencyProbes['get'](probeKey);
  if (value4?.['promise']) {
    const value5 = await value4['promise'];
    return (applyRemoteQueueStatus(concurrentLimit2, value5), value5);
  }
  const promise = probeRunningHubWorkflowQueueStatus(value3)
    ['then']((enabled3) => {
      if (!enabled3) throw new Error('RunningHub workflow concurrency probe returned no limit');
      return enabled3;
    })
    ['catch']((value6) => {
      sessionConcurrencyProbes['delete'](probeKey);
      throw value6;
    })
    ['finally'](() => {
      sessionConcurrencyProbes['get'](probeKey)?.['promise'] === promise &&
        sessionConcurrencyProbes['delete'](probeKey);
    });
  sessionConcurrencyProbes['set'](probeKey, { status: 'probing', promise: promise });
  const value7 = await promise;
  return (applyRemoteQueueStatus(concurrentLimit2, value7), value7);
}
function buildQueueDetail(queueLength, args = {}) {
  return {
    queueLength: queueLength['waiting']['length'],
    activeCount: queueLength['active'],
    concurrentLimit: queueLength['concurrentLimit'],
    remoteOccupiedCount: queueLength['remoteOccupiedCount'],
    remoteRunningCount: queueLength['remoteRunningCount'],
    remoteQueuedCount: queueLength['remoteQueuedCount'],
    ...args,
  };
}
function emitWaiting(value8, args2 = {}) {
  value8['waiting']['forEach']((value9, queueIndex) => {
    value9['onQueueChange']?.(
      buildQueueDetail(value8, { status: 'queued', queueIndex: queueIndex, ...args2 }),
    );
  });
}
function removeWaitingItem(value10, value11) {
  const count5 = value10['waiting']['indexOf'](value11);
  if (count5 >= 0) return (value10['waiting']['splice'](count5, 1), emitWaiting(value10), true);
  return false;
}
function resolveQueuePollIntervalMs(value12) {
  const count6 = Number(value12);
  if (!Number['isFinite'](count6) || count6 <= 0) return DEFAULT_RUNNINGHUB_WORKFLOW_QUEUE_POLL_INTERVAL_MS;
  return Math['max'](1, Math['floor'](count6));
}
function getRunningHubErrorCode(response) {
  const value13 = [
    response?.['code'],
    response?.['status'],
    response?.['raw']?.['code'],
    response?.['response']?.['code'],
    response?.['response']?.['data']?.['code'],
    response?.['data']?.['code'],
  ];
  for (const value14 of value13) {
    const value15 = Number(value14);
    if (Number['isFinite'](value15)) return value15;
  }
  return null;
}
function isRunningHubQueueMaxedError(error2) {
  if (getRunningHubErrorCode(error2) === 421) return true;
  const list = [
    error2?.['message'],
    error2?.['raw']?.['message'],
    error2?.['response']?.['data']?.['message'],
  ]
    ['map'](normalizeText)
    ['join'](' ')
    ['toUpperCase']();
  return list['includes']('TASK_QUEUE_MAXED');
}
function clearProbeTimer(enabled4) {
  if (!enabled4['probeTimer']) return;
  (clearTimeout(enabled4['probeTimer']), (enabled4['probeTimer'] = null));
}
function scheduleQueueProbe(value16) {
  if (
    value16['probeTimer'] ||
    value16['waiting']['length'] === 0 ||
    value16['active'] + value16['remoteOccupiedCount'] < value16['concurrentLimit']
  )
    return;
  const value17 = value16['probeOptions'] || {},
    queuePollIntervalMs2 = resolveQueuePollIntervalMs(value17['queuePollIntervalMs']);
  ((value16['probeTimer'] = setTimeout(async () => {
    value16['probeTimer'] = null;
    if (value16['waiting']['length'] === 0) return;
    if (value17['autoProbeConcurrency'] !== false && normalizeText(value17['apiKey']))
      try {
        const probeRunningHubWorkflowQueueStatus2 = await probeRunningHubWorkflowQueueStatus(value17);
        !applyRemoteQueueStatus(value16, probeRunningHubWorkflowQueueStatus2) &&
          ((value16['remoteOccupiedCount'] = 0),
          (value16['remoteRunningCount'] = 0),
          (value16['remoteQueuedCount'] = 0));
      } catch {
        ((value16['remoteOccupiedCount'] = 0),
          (value16['remoteRunningCount'] = 0),
          (value16['remoteQueuedCount'] = 0));
      }
    else
      ((value16['remoteOccupiedCount'] = 0),
        (value16['remoteRunningCount'] = 0),
        (value16['remoteQueuedCount'] = 0));
    pumpQueue(value16);
  }, queuePollIntervalMs2)),
    value16['probeTimer']['unref']?.());
}
function pumpQueue(queueKey2) {
  queueKey2['active'] + queueKey2['remoteOccupiedCount'] < queueKey2['concurrentLimit'] &&
    clearProbeTimer(queueKey2);
  while (
    queueKey2['active'] + queueKey2['remoteOccupiedCount'] < queueKey2['concurrentLimit'] &&
    queueKey2['waiting']['length'] > 0
  ) {
    const itemId = queueKey2['waiting']['shift']();
    if (!itemId || itemId['settled']) continue;
    if (itemId['signal']?.['aborted']) {
      ((itemId['settled'] = true), itemId['reject'](createAbortError()));
      continue;
    }
    ((queueKey2['active'] += 1), (itemId['started'] = true));
    const value18 = { provider: PROVIDER_KEY, queueKey: queueKey2['queueKey'], itemId: itemId['id'] };
    (itemId['onQueueChange']?.(buildQueueDetail(queueKey2, { status: 'running', queueIndex: -1 })),
      Promise['resolve']()
        ['then'](() => itemId['runner'](value18))
        ['then'](
          (value19) => {
            ((queueKey2['active'] = Math['max'](0, queueKey2['active'] - 1)),
              (itemId['settled'] = true),
              itemId['resolve'](value19),
              pumpQueue(queueKey2),
              emitWaiting(queueKey2));
          },
          (value20) => {
            queueKey2['active'] = Math['max'](0, queueKey2['active'] - 1);
            if (isRunningHubQueueMaxedError(value20) && !itemId['signal']?.['aborted']) {
              ((itemId['started'] = false),
                (queueKey2['remoteOccupiedCount'] = Math['max'](1, queueKey2['concurrentLimit'])),
                (queueKey2['remoteRunningCount'] = Math['max'](
                  queueKey2['remoteRunningCount'],
                  queueKey2['concurrentLimit'],
                )),
                queueKey2['waiting']['unshift'](itemId),
                emitWaiting(queueKey2, { reason: 'provider-queue-full' }),
                scheduleQueueProbe(queueKey2));
              return;
            }
            ((itemId['settled'] = true),
              itemId['reject'](value20),
              pumpQueue(queueKey2),
              emitWaiting(queueKey2));
          },
        ));
  }
  (emitWaiting(queueKey2), scheduleQueueProbe(queueKey2));
}
export async function runWithRunningHubWorkflowQueue(
  {
    apiKey: apiKey = '',
    providerProfileId: providerProfileId = RUNNINGHUB_DOMESTIC_PROFILE_ID,
    concurrentLimit: concurrentLimit = DEFAULT_RUNNINGHUB_WORKFLOW_CONCURRENCY,
    providerConfig: providerConfig = null,
    signal: signal = null,
    lease: lease = null,
    onQueueChange: onQueueChange = null,
    autoProbeConcurrency: autoProbeConcurrency = true,
    concurrencyProbe: concurrencyProbe = null,
    queuePollIntervalMs: queuePollIntervalMs = DEFAULT_RUNNINGHUB_WORKFLOW_QUEUE_POLL_INTERVAL_MS,
  } = {},
  runner,
) {
  if (typeof runner !== 'function') throw new Error('RunningHub workflow queue runner is required');
  const queueKey3 = normalizeQueueKey(apiKey, providerProfileId);
  if (isMatchingLease(lease, queueKey3)) return runner(lease);
  if (signal?.['aborted']) throw createAbortError();
  const queue = getQueue(queueKey3);
  ((queue['concurrentLimit'] = normalizeRunningHubWorkflowConcurrencyLimit(
    concurrentLimit,
    queue['concurrentLimit'],
  )),
    (queue['probeOptions'] = {
      apiKey: apiKey,
      providerConfig: providerConfig,
      autoProbeConcurrency: autoProbeConcurrency,
      concurrencyProbe: concurrencyProbe,
      queuePollIntervalMs: queuePollIntervalMs,
    }));
  if (autoProbeConcurrency !== false && normalizeText(apiKey))
    try {
      await ensureSessionQueueStatus(queue, {
        apiKey: apiKey,
        providerConfig: providerConfig,
        autoProbeConcurrency: autoProbeConcurrency,
        concurrencyProbe: concurrencyProbe,
        queuePollIntervalMs: queuePollIntervalMs,
      });
    } catch {
      queue['concurrentLimit'] = normalizeRunningHubWorkflowConcurrencyLimit(
        concurrentLimit,
        queue['concurrentLimit'],
      );
    }
  return new Promise((resolve, reject) => {
    const promise2 = {
        id: nextQueueItemId++,
        runner: runner,
        resolve: resolve,
        reject: reject,
        signal: signal,
        onQueueChange: typeof onQueueChange === 'function' ? onQueueChange : null,
        started: false,
        settled: false,
      },
      value21 = () => {
        if (promise2['started'] || promise2['settled']) return;
        ((promise2['settled'] = true), removeWaitingItem(queue, promise2), reject(createAbortError()));
      };
    if (signal && typeof signal['addEventListener'] === 'function') {
      signal['addEventListener']('abort', value21, { once: true });
      const run2 = () => signal['removeEventListener']?.('abort', value21),
        handler = promise2['resolve'],
        handler2 = promise2['reject'];
      ((promise2['resolve'] = (value22) => {
        (run2(), handler(value22));
      }),
        (promise2['reject'] = (value23) => {
          (run2(), handler2(value23));
        }));
    }
    (queue['waiting']['push'](promise2), pumpQueue(queue));
  });
}
export function __resetRunningHubWorkflowQueueForTest() {
  (queues['forEach'](clearProbeTimer),
    queues['clear'](),
    sessionConcurrencyProbes['clear'](),
    (nextQueueItemId = 1));
}
