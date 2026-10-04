import appStore from '../core/stores/appStore.js';
import {
  buildCanvasLocalAudioFields,
  buildCanvasLocalVideoFields,
  resolveCanvasVideoUrl,
  normalizeCanvasLocalPath,
  VIDEO_PROXY_VERSION_V2_1280,
} from './canvasMediaLocalService.js';
import { logDiagnosticEvent } from './diagnosticsService.js';
import { desktopBridge } from './desktopBridge.js';
let installed = ![],
  pendingUpdateTimer = null,
  lastPendingUpdateFlushAt = 0x0;
const pendingUpdates = new Map(),
  COALESCED_UPDATE_INTERVAL_MS = 0xfa,
  COALESCED_STATUSES = new Set(['waiting', 'processing']),
  TERMINAL_STATUSES = new Set(['complete', 'failed', 'cancelled']),
  ACTIVE_TASK_STATUSES = new Set(['waiting', 'processing']),
  SHARED_ASSET_RESULT_TASK_KINDS = new Set(['videoPoster', 'videoFirstFrame', 'audioWaveform']),
  PROXY_MIGRATION_TASK_LIST_CACHE_MS = 0x1f4,
  VIDEO_PROXY_MIGRATION_PURPOSE = 'video-proxy-migration',
  VIDEO_PROXY_MIGRATION_PRIORITY = -0x64,
  MAX_PENDING_PROXY_MIGRATION_TERMINAL_COUNT = 0x80,
  videoProxyMigrationUpdateListeners = new Set();
export function createProxyMigrationRequestTracker({
  retryDelayMs: retryDelayMs = 0x3e8,
  schedule: schedule = (value, item) => setTimeout(value, item),
  maxPendingTerminalCount: maxPendingTerminalCount = MAX_PENDING_PROXY_MIGRATION_TERMINAL_COUNT,
} = {}) {
  const requestedKeys2 = new Set(),
    map = new Map(),
    map2 = new Map(),
    key = Math['max'](
      0x1,
      Math['min'](
        MAX_PENDING_PROXY_MIGRATION_TERMINAL_COUNT,
        Math['trunc'](Number(maxPendingTerminalCount) || 0x0) || MAX_PENDING_PROXY_MIGRATION_TERMINAL_COUNT,
      ),
    ),
    release = (response = {}) => {
      const index = String(response?.['taskId'] || response?.['id'] || '')['trim'](),
        enabled = map['get'](index),
        result = String(response?.['status'] || '')
          ['trim']()
          ['toLowerCase']();
      if (!enabled) {
        if (
          index &&
          TERMINAL_STATUSES['has'](result) &&
          String(response?.['purpose'] || '')['trim']() === VIDEO_PROXY_MIGRATION_PURPOSE
        ) {
          map2['has'](index) && map2['delete'](index);
          while (map2['size'] >= key) {
            const data = map2['keys']()['next']()['value'];
            map2['delete'](data);
          }
          map2['set'](index, response);
        }
        return null;
      }
      map['delete'](index);
      if (result === 'complete' || result === 'cancelled')
        return (requestedKeys2['delete'](enabled), response);
      return (
        result === 'failed' &&
          schedule(() => requestedKeys2['delete'](enabled), Math['max'](0x0, Number(retryDelayMs) || 0x0)),
        response
      );
    },
    track = (response2 = {}, options = '') => {
      const enabled2 = String(response2?.['taskId'] || response2?.['id'] || '')['trim'](),
        enabled3 = String(options || '')['trim']();
      enabled2 && enabled3 && (requestedKeys2['add'](enabled3), map['set'](enabled2, enabled3));
      const target = String(response2?.['status'] || '')
          ['trim']()
          ['toLowerCase'](),
        source = map2['get'](enabled2) || null,
        enabled4 = source || (TERMINAL_STATUSES['has'](target) ? response2 : null);
      if (!enabled4 || !enabled2 || !enabled3) return null;
      return (map2['delete'](enabled2), release(enabled4), enabled4);
    };
  return { requestedKeys: requestedKeys2, track: track, release: release };
}
const proxyMigrationRequestTracker = createProxyMigrationRequestTracker();
export function createMediaTaskListCache({
  list: list,
  ttlMs: ttlMs = PROXY_MIGRATION_TASK_LIST_CACHE_MS,
  now: now = () => Date['now'](),
} = {}) {
  let next = null;
  return {
    async get(enabled5 = '') {
      const createdAt = Number(now()) || 0x0;
      if (
        next &&
        createdAt - next['createdAt'] < Math['max'](0x0, Number(ttlMs) || 0x0) &&
        (next['pending'] || !enabled5 || next['taskIds']['has'](enabled5))
      )
        return next['promise'];
      const current = {
        createdAt: createdAt,
        pending: !![],
        taskIds: new Set(enabled5 ? [enabled5] : []),
        promise: null,
      };
      return (
        (current['promise'] = Promise['resolve']()
          ['then'](() => list?.())
          ['then']((entry) => {
            const list2 = Array['isArray'](entry?.['tasks'])
              ? entry['tasks']
              : Array['isArray'](entry)
                ? entry
                : [];
            return (
              list2['forEach']((record) => {
                const payload = String(record?.['taskId'] || record?.['id'] || '')['trim']();
                if (payload) current['taskIds']['add'](payload);
              }),
              list2
            );
          })
          ['catch']((handle) => {
            if (next === current) next = null;
            throw handle;
          })
          ['finally'](() => {
            current['pending'] = ![];
          })),
        (next = current),
        current['promise']
      );
    },
  };
}
const mediaTaskListCache = createMediaTaskListCache({
  list: () => desktopBridge['mediaTask']['list']({ limit: 0x1f4 }),
});
function normalizeStatus(state) {
  return String(state || '')['trim']();
}
function buildStatusPatch(nodeId = {}) {
  const mediaTaskStatus = normalizeStatus(nodeId['status']),
    message = {
      mediaTaskId: String(nodeId['taskId'] || ''),
      mediaTaskKind: String(nodeId['kind'] || ''),
      mediaTaskStatus: mediaTaskStatus,
      mediaTaskProgress: Number(nodeId['progress'] || 0x0) || 0x0,
      mediaTaskError: String(nodeId['error'] || ''),
    };
  if (mediaTaskStatus === 'waiting' || mediaTaskStatus === 'processing')
    ((message['isGenerating'] = !![]), (message['jobStatus'] = 'running'), (message['jobError'] = null));
  else {
    if (mediaTaskStatus === 'complete')
      ((message['isGenerating'] = ![]), (message['jobStatus'] = 'success'), (message['jobError'] = null));
    else {
      if (mediaTaskStatus === 'failed')
        ((message['isGenerating'] = ![]),
          (message['jobStatus'] = 'error'),
          (message['jobError'] = message['mediaTaskError'] || 'Media task failed'),
          void logDiagnosticEvent({
            type: 'generation.media_task_failed',
            level: 'error',
            source: 'renderer',
            message: message['jobError'],
            context: {
              taskId: message['mediaTaskId'],
              kind: message['mediaTaskKind'],
              nodeId: nodeId['nodeId'] || '',
              assetId: nodeId['assetId'] || '',
            },
          }));
      else
        mediaTaskStatus === 'cancelled' &&
          ((message['isGenerating'] = ![]), (message['jobStatus'] = null), (message['jobError'] = null));
    }
  }
  return message;
}
function isVideoProxyMigrationEvent(options2 = {}) {
  return String(options2?.['purpose'] || '')['trim']() === VIDEO_PROXY_MIGRATION_PURPOSE;
}
function publishVideoProxyMigrationUpdate(options3 = {}) {
  if (!isVideoProxyMigrationEvent(options3)) return;
  for (const run of videoProxyMigrationUpdateListeners) {
    try {
      run(options3);
    } catch (config) {
      console['warn']('[mediaTaskService]\x20video\x20proxy\x20migration\x20listener\x20failed:', config);
    }
  }
}
export function subscribeVideoProxyMigrationUpdates(scope) {
  if (typeof scope !== 'function') return () => {};
  return (
    videoProxyMigrationUpdateListeners['add'](scope),
    installMediaTaskUpdateListener(),
    () => videoProxyMigrationUpdateListeners['delete'](scope)
  );
}
export function shouldApplyMediaTaskEventToNode(options4 = {}, input = {}) {
  const enabled6 = String(input?.['taskId'] || input?.['id'] || '')['trim']();
  if (!enabled6) return !![];
  const enabled7 = String(
    isVideoProxyMigrationEvent(input) ? options4?.['videoProxyMigrationTaskId'] : options4?.['mediaTaskId'],
  )['trim']();
  return !enabled7 || enabled7 === enabled6;
}
function buildVideoProxyMigrationStatusPatch(response3 = {}) {
  const videoProxyMigrationStatus = normalizeStatus(response3['status']);
  return {
    videoProxyMigrationTaskId: String(response3['taskId'] || ''),
    videoProxyMigrationStatus: videoProxyMigrationStatus,
    videoProxyMigrationError: videoProxyMigrationStatus === 'failed' ? String(response3['error'] || '') : '',
  };
}
function shouldClearVideoCapturePreview(args = {}, args2 = {}) {
  const output = String(args2['videoProxyStatus'] || '')
    ['trim']()
    ['toLowerCase']();
  if (output !== 'generated' && output !== 'not_required') return ![];
  return !!resolveCanvasVideoUrl({ ...args, ...args2 });
}
function buildResultPatch(options5 = {}, value2 = {}) {
  const pendingVideoProxyLocalPath =
      options5['result'] && typeof options5['result'] === 'object' ? options5['result'] : {},
    value3 = String(options5['kind'] || '');
  if (!pendingVideoProxyLocalPath || Object['keys'](pendingVideoProxyLocalPath)['length'] === 0x0) return {};
  if (value3 === 'videoPoster' && isVideoProxyMigrationEvent(options5))
    return buildCanvasLocalVideoFields({
      pendingVideoProxyLocalPath: pendingVideoProxyLocalPath['displayLocalPath'] || '',
      pendingVideoProxyVersion: pendingVideoProxyLocalPath['videoProxyVersion'] || '',
    });
  if (value3 === 'videoPoster' || value3 === 'videoFirstFrame') {
    const canvasLocalVideoFields = buildCanvasLocalVideoFields({
      ...(value3 === 'videoPoster' && pendingVideoProxyLocalPath['displayLocalPath']
        ? { displayLocalPath: pendingVideoProxyLocalPath['displayLocalPath'] }
        : {}),
      ...(value3 === 'videoPoster'
        ? {
            videoProxyStatus: pendingVideoProxyLocalPath['videoProxyStatus'] || '',
            videoProxyVersion: pendingVideoProxyLocalPath['videoProxyVersion'] || '',
            videoCodec: pendingVideoProxyLocalPath['videoCodec'] || '',
          }
        : {}),
      posterLocalPath:
        pendingVideoProxyLocalPath['posterLocalPath'] ||
        pendingVideoProxyLocalPath['thumbLocalPath'] ||
        pendingVideoProxyLocalPath['localPath'] ||
        '',
      thumbUrl:
        pendingVideoProxyLocalPath['posterUrl'] ||
        pendingVideoProxyLocalPath['thumbUrl'] ||
        pendingVideoProxyLocalPath['url'] ||
        '',
      videoThumbSrc: pendingVideoProxyLocalPath['src'] || '',
    });
    return (
      value3 === 'videoPoster' &&
        shouldClearVideoCapturePreview(value2, canvasLocalVideoFields) &&
        (canvasLocalVideoFields['capturePreviewUrl'] = ''),
      canvasLocalVideoFields
    );
  }
  if (value3 === 'audioWaveform')
    return buildCanvasLocalAudioFields({
      waveformLocalPath: pendingVideoProxyLocalPath['waveformLocalPath'] || '',
    });
  return {};
}
function buildMediaTaskUpdatePatch(response4 = {}, value4 = {}) {
  return {
    ...(isVideoProxyMigrationEvent(response4)
      ? buildVideoProxyMigrationStatusPatch(response4)
      : buildStatusPatch(response4)),
    ...(normalizeStatus(response4['status']) === 'complete' ? buildResultPatch(response4, value4) : {}),
  };
}
function getUpdateKey(options6 = {}) {
  return [
    String(options6['taskId'] || ''),
    String(options6['kind'] || ''),
    String(options6['nodeId'] || ''),
    String(options6['assetId'] || ''),
  ]['join']('|');
}
function nowMs() {
  return Number(globalThis['performance']?.['now']?.() || Date['now']()) || 0x0;
}
function flushPendingUpdates() {
  ((pendingUpdateTimer = null), (lastPendingUpdateFlushAt = nowMs()));
  const list3 = Array['from'](pendingUpdates['values']());
  (pendingUpdates['clear'](),
    list3['forEach']((value5) => {
      try {
        applyMediaTaskUpdate(value5);
      } catch (value6) {
        console['warn']('[mediaTaskService] failed to apply media task update:', value6);
      }
    }));
}
function schedulePendingUpdateFlush() {
  if (pendingUpdateTimer !== null) return;
  const nowMs2 = nowMs() - lastPendingUpdateFlushAt,
    value7 = Math['max'](0x0, COALESCED_UPDATE_INTERVAL_MS - nowMs2);
  pendingUpdateTimer = setTimeout(flushPendingUpdates, value7);
}
function handleMediaTaskUpdate(response5 = {}) {
  publishVideoProxyMigrationUpdate(response5);
  const status = normalizeStatus(response5['status']),
    updateKey = getUpdateKey(response5);
  if (TERMINAL_STATUSES['has'](status)) {
    const value8 = pendingUpdates['get'](updateKey);
    if (value8) pendingUpdates['delete'](updateKey);
    (proxyMigrationRequestTracker['release'](response5),
      applyMediaTaskUpdate({ ...(value8 || {}), ...response5 }));
    return;
  }
  if (COALESCED_STATUSES['has'](status)) {
    (pendingUpdates['set'](updateKey, response5), schedulePendingUpdateFlush());
    return;
  }
  applyMediaTaskUpdate(response5);
}
function resolveMatchingNodeIds(options7 = {}, response6 = {}) {
  const enabled8 = String(response6['nodeId'] || '')['trim'](),
    value9 = String(response6['assetId'] || '')['trim'](),
    list4 = [];
  if (enabled8 && options7[enabled8]) list4['push'](enabled8);
  const value10 =
    !enabled8 ||
    (String(response6?.['status'] || '')
      ['trim']()
      ['toLowerCase']() === 'complete' &&
      SHARED_ASSET_RESULT_TASK_KINDS['has'](String(response6?.['kind'] || '')['trim']()));
  return (
    value9 &&
      value10 &&
      Object['values'](options7)['forEach']((value11) => {
        if (String(value11?.['assetId'] || '')['trim']() !== value9) return;
        if (value11?.['id'] && !list4['includes'](value11['id'])) list4['push'](value11['id']);
      }),
    list4
  );
}
function getMatchingNodeIds(options8 = {}) {
  const value12 =
    typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
  return resolveMatchingNodeIds(value12?.['nodes'] || {}, options8);
}
function applyMediaTaskUpdate(options9 = {}) {
  const list5 = getMatchingNodeIds(options9);
  if (!list5['length']) return;
  const value13 =
      typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState'](),
    value14 = {};
  list5['forEach']((value15) => {
    const value16 = value13?.['nodes']?.[value15];
    if (!shouldApplyMediaTaskEventToNode(value16, options9)) return;
    const mediaTaskUpdatePatch = buildMediaTaskUpdatePatch(options9, value16),
      value17 = Object['entries'](mediaTaskUpdatePatch)['some'](
        ([value18, value19]) => value16?.[value18] !== value19,
      );
    if (value17) value14[value15] = mediaTaskUpdatePatch;
  });
  const list6 = Object['keys'](value14);
  if (!list6['length']) return;
  if (typeof appStore['updateNodesData'] === 'function' && list6['length'] > 0x1) {
    appStore['updateNodesData'](value14);
    return;
  }
  list6['forEach']((value20) => appStore['updateNodeData'](value20, value14[value20]));
}
function normalizeProxyPath(value21) {
  return normalizeCanvasLocalPath(value21)['replace'](/\\/g, '/');
}
function isLegacyProjectImportProxyPath(value22) {
  const proxyPath = normalizeProxyPath(value22);
  return /(?:^|\/)ProjectImports\/[^/]+(?:\/.*)?\.proxy\.mp4$/i['test'](proxyPath);
}
export function getLegacyVideoProxyAssetId(value23) {
  const list7 = normalizeProxyPath(value23);
  if (!list7) return '';
  let value24 = 0xcbf29ce484222325n;
  for (let value25 = 0x0; value25 < list7['length']; value25 += 0x1) {
    ((value24 ^= BigInt(list7['charCodeAt'](value25))),
      (value24 = BigInt['asUintN'](0x40, value24 * 0x100000001b3n)));
  }
  return 'legacy-' + value24['toString'](0x10)['padStart'](0x10, '0');
}
export function getLegacyProjectImportVideoProxyMigration(response7 = {}) {
  if (
    String(response7?.['type'] || '')
      ['trim']()
      ['toLowerCase']() !== 'source-video'
  )
    return null;
  if (String(response7?.['videoProxyVersion'] || '')['trim']() === VIDEO_PROXY_VERSION_V2_1280) return null;
  if (
    String(response7?.['pendingVideoProxyVersion'] || '')['trim']() === VIDEO_PROXY_VERSION_V2_1280 &&
    normalizeProxyPath(response7?.['pendingVideoProxyLocalPath'])
  )
    return null;
  const sourceLocalPath = [
      response7?.['originalLocalPath'],
      response7?.['localPath'],
      response7?.['displayLocalPath'],
      response7?.['videoUrl'],
      response7?.['src'],
      response7?.['url'],
      response7?.['resultUrl'],
    ]
      ['map'](normalizeProxyPath)
      ['find'](isLegacyProjectImportProxyPath),
    value26 = String(response7?.['assetId'] || '')['trim'](),
    assetId =
      (/^[a-z0-9_-]+$/i['test'](value26) ? value26 : '') || getLegacyVideoProxyAssetId(sourceLocalPath),
    nodeId2 = String(response7?.['id'] || '')['trim']();
  if (!sourceLocalPath || !assetId || !nodeId2) return null;
  return {
    nodeId: nodeId2,
    assetId: assetId,
    sourceLocalPath: sourceLocalPath,
    hasDisplayLocalPath: !!normalizeProxyPath(response7?.['displayLocalPath']),
    targetVersion: VIDEO_PROXY_VERSION_V2_1280,
    key: assetId + '|' + sourceLocalPath + '|' + VIDEO_PROXY_VERSION_V2_1280,
  };
}
export function getVisibleVideoProxyMigration(options10 = {}) {
  const legacyProjectImportVideoProxyMigration = getLegacyProjectImportVideoProxyMigration(options10);
  if (legacyProjectImportVideoProxyMigration) return legacyProjectImportVideoProxyMigration;
  if (
    String(options10?.['type'] || '')
      ['trim']()
      ['toLowerCase']() !== 'source-video'
  )
    return null;
  if (String(options10?.['videoProxyVersion'] || '')['trim']() === VIDEO_PROXY_VERSION_V2_1280) return null;
  const value27 = String(options10?.['videoProxyStatus'] || '')
    ['trim']()
    ['toLowerCase']();
  if (value27 !== 'processing' && value27 !== 'waiting') return null;
  if (normalizeProxyPath(options10?.['displayLocalPath'])) return null;
  const nodeId3 = String(options10?.['id'] || '')['trim'](),
    assetId2 = String(options10?.['assetId'] || '')['trim'](),
    sourceLocalPath2 = normalizeProxyPath(
      options10?.['originalLocalPath'] ||
        options10?.['localPath'] ||
        options10?.['videoUrl'] ||
        options10?.['src'],
    );
  if (!nodeId3 || !/^[a-z0-9_-]+$/i['test'](assetId2) || !sourceLocalPath2) return null;
  return {
    nodeId: nodeId3,
    assetId: assetId2,
    sourceLocalPath: sourceLocalPath2,
    hasDisplayLocalPath: ![],
    targetVersion: VIDEO_PROXY_VERSION_V2_1280,
    key: assetId2 + '|' + sourceLocalPath2 + '|' + VIDEO_PROXY_VERSION_V2_1280,
  };
}
export function isMediaTaskActiveInList(options11 = {}, value28 = []) {
  const enabled9 = String(options11?.['mediaTaskId'] || '')['trim'](),
    value29 = String(options11?.['mediaTaskStatus'] || '')
      ['trim']()
      ['toLowerCase']();
  if (!enabled9 || !ACTIVE_TASK_STATUSES['has'](value29)) return ![];
  return (Array['isArray'](value28) ? value28 : [])['some']((response8) => {
    const value30 = String(response8?.['taskId'] || response8?.['id'] || '')['trim'](),
      value31 = String(response8?.['status'] || '')
        ['trim']()
        ['toLowerCase']();
    return value30 === enabled9 && ACTIVE_TASK_STATUSES['has'](value31);
  });
}
async function listMediaTasksCached(value32 = '') {
  return mediaTaskListCache['get'](value32);
}
async function enqueueVideoProxyMigration(
  migrationKey,
  {
    enqueue: enqueue = (value33) => desktopBridge['mediaTask']['enqueue'](value33),
    updateNode: updateNode = (value34, value35) => appStore['updateNodeData'](value34, value35),
    requestTracker: requestTracker = proxyMigrationRequestTracker,
    requestedKeys: requestedKeys = requestTracker?.['requestedKeys'] ||
      proxyMigrationRequestTracker['requestedKeys'],
  } = {},
) {
  if (!migrationKey || requestedKeys['has'](migrationKey['key'])) return null;
  requestedKeys['add'](migrationKey['key']);
  try {
    const args3 = await enqueue({
      kind: 'videoPoster',
      purpose: VIDEO_PROXY_MIGRATION_PURPOSE,
      priority: VIDEO_PROXY_MIGRATION_PRIORITY,
      migrationKey: migrationKey['key'],
      nodeId: migrationKey['nodeId'],
      assetId: migrationKey['assetId'],
      src: migrationKey['sourceLocalPath'],
      originalLocalPath: migrationKey['sourceLocalPath'],
      videoProxyTargetVersion: migrationKey['targetVersion'],
    });
    if (!args3 || typeof args3 !== 'object') return (requestedKeys['delete'](migrationKey['key']), null);
    const args4 =
        requestTracker?.['requestedKeys'] === requestedKeys && typeof requestTracker?.['track'] === 'function'
          ? requestTracker['track'](args3, migrationKey['key'])
          : null,
      args5 = args4 ? { ...args3, ...args4 } : args3,
      response9 = { ...args5, purpose: VIDEO_PROXY_MIGRATION_PURPOSE },
      status2 = normalizeStatus(response9['status'])['toLowerCase']();
    return (
      updateNode(migrationKey['nodeId'], {
        ...buildVideoProxyMigrationStatusPatch(response9),
        ...(status2 === 'complete' ? buildResultPatch(response9) : {}),
        assetId: migrationKey['assetId'],
        ...(ACTIVE_TASK_STATUSES['has'](status2) ? { videoProxyStatus: 'processing' } : {}),
        ...(!migrationKey['hasDisplayLocalPath']
          ? { displayLocalPath: migrationKey['sourceLocalPath'] }
          : {}),
      }),
      args5 || null
    );
  } catch (value36) {
    requestedKeys['delete'](migrationKey['key']);
    throw value36;
  }
}
export async function requestVisibleVideoProxyMigration(value37) {
  const enabled10 = String(value37 || '')['trim']();
  if (!enabled10) return null;
  const value38 =
      typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState'](),
    value39 = value38?.['nodes']?.[enabled10],
    visibleVideoProxyMigration = getVisibleVideoProxyMigration(value39);
  if (!visibleVideoProxyMigration) return null;
  if (!getLegacyProjectImportVideoProxyMigration(value39))
    try {
      if (
        isMediaTaskActiveInList(
          value39,
          await listMediaTasksCached(String(value39?.['mediaTaskId'] || '')['trim']()),
        )
      )
        return null;
    } catch {
      return null;
    }
  return enqueueVideoProxyMigration(visibleVideoProxyMigration);
}
async function cancelVideoProxyMigrationTaskWithDeps(
  value40,
  { cancel: cancel = (value41) => desktopBridge['mediaTask']['cancel'](value41) } = {},
) {
  const taskId = String(value40 || '')['trim']();
  if (!taskId) return { ok: ![], error: 'Missing media task id' };
  return cancel({ taskId: taskId, onlyIfWaiting: !![] });
}
export function cancelVideoProxyMigrationTask(value42) {
  return cancelVideoProxyMigrationTaskWithDeps(value42);
}
export function __enqueueVideoProxyMigrationForTest(value43, value44) {
  return enqueueVideoProxyMigration(value43, value44);
}
export function __cancelVideoProxyMigrationTaskForTest(value45, value46) {
  return cancelVideoProxyMigrationTaskWithDeps(value45, value46);
}
export function __resolveMatchingMediaTaskNodeIdsForTest(value47, value48) {
  return resolveMatchingNodeIds(value47, value48);
}
export function installMediaTaskUpdateListener() {
  if (installed) return;
  installed = !![];
  const run2 = desktopBridge['mediaTask']['onUpdate'];
  typeof run2 === 'function' &&
    run2((value49) => {
      try {
        handleMediaTaskUpdate(value49 || {});
      } catch (value50) {
        console['warn']('[mediaTaskService] failed to apply media task update:', value50);
      }
    });
}
export function __buildMediaTaskStatusPatchForTest(options12 = {}) {
  return buildStatusPatch(options12);
}
export function __buildMediaTaskResultPatchForTest(options13 = {}, value51 = {}) {
  return buildResultPatch(options13, value51);
}
export function __buildMediaTaskUpdatePatchForTest(options14 = {}, value52 = {}) {
  return buildMediaTaskUpdatePatch(options14, value52);
}
export function __applyMediaTaskUpdateForTest(options15 = {}) {
  return applyMediaTaskUpdate(options15);
}
export function __handleMediaTaskUpdateForTest(options16 = {}) {
  return handleMediaTaskUpdate(options16);
}
