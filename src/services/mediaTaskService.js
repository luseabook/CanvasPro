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
  schedule: schedule = (_0x42000d, _0x24a20b) => setTimeout(_0x42000d, _0x24a20b),
  maxPendingTerminalCount: maxPendingTerminalCount = MAX_PENDING_PROXY_MIGRATION_TERMINAL_COUNT,
} = {}) {
  const _0x1778cb = new Set(),
    _0x2d4d58 = new Map(),
    _0x2b4f6c = new Map(),
    _0x433106 = Math['max'](
      0x1,
      Math['min'](
        MAX_PENDING_PROXY_MIGRATION_TERMINAL_COUNT,
        Math['trunc'](Number(maxPendingTerminalCount) || 0x0) || MAX_PENDING_PROXY_MIGRATION_TERMINAL_COUNT,
      ),
    ),
    _0x789697 = (_0x5e4b4a = {}) => {
      const _0x40eb88 = String(_0x5e4b4a?.['taskId'] || _0x5e4b4a?.['id'] || '')['trim'](),
        _0x39d423 = _0x2d4d58['get'](_0x40eb88),
        _0x21b20c = String(_0x5e4b4a?.['status'] || '')
          ['trim']()
          ['toLowerCase']();
      if (!_0x39d423) {
        if (
          _0x40eb88 &&
          TERMINAL_STATUSES['has'](_0x21b20c) &&
          String(_0x5e4b4a?.['purpose'] || '')['trim']() === VIDEO_PROXY_MIGRATION_PURPOSE
        ) {
          _0x2b4f6c['has'](_0x40eb88) && _0x2b4f6c['delete'](_0x40eb88);
          while (_0x2b4f6c['size'] >= _0x433106) {
            const _0x40efc5 = _0x2b4f6c['keys']()['next']()['value'];
            _0x2b4f6c['delete'](_0x40efc5);
          }
          _0x2b4f6c['set'](_0x40eb88, _0x5e4b4a);
        }
        return null;
      }
      _0x2d4d58['delete'](_0x40eb88);
      if (_0x21b20c === 'complete' || _0x21b20c === 'cancelled')
        return (_0x1778cb['delete'](_0x39d423), _0x5e4b4a);
      return (
        _0x21b20c === 'failed' &&
          schedule(() => _0x1778cb['delete'](_0x39d423), Math['max'](0x0, Number(retryDelayMs) || 0x0)),
        _0x5e4b4a
      );
    },
    _0x159db4 = (_0x2eeb6d = {}, _0x3ec347 = '') => {
      const _0x17d4eb = String(_0x2eeb6d?.['taskId'] || _0x2eeb6d?.['id'] || '')['trim'](),
        _0x225072 = String(_0x3ec347 || '')['trim']();
      _0x17d4eb && _0x225072 && (_0x1778cb['add'](_0x225072), _0x2d4d58['set'](_0x17d4eb, _0x225072));
      const _0x146ccc = String(_0x2eeb6d?.['status'] || '')
          ['trim']()
          ['toLowerCase'](),
        _0x748ffd = _0x2b4f6c['get'](_0x17d4eb) || null,
        _0x8ee98b = _0x748ffd || (TERMINAL_STATUSES['has'](_0x146ccc) ? _0x2eeb6d : null);
      if (!_0x8ee98b || !_0x17d4eb || !_0x225072) return null;
      return (_0x2b4f6c['delete'](_0x17d4eb), _0x789697(_0x8ee98b), _0x8ee98b);
    };
  return { requestedKeys: _0x1778cb, track: _0x159db4, release: _0x789697 };
}
const proxyMigrationRequestTracker = createProxyMigrationRequestTracker();
export function createMediaTaskListCache({
  list: _0x528869,
  ttlMs: ttlMs = PROXY_MIGRATION_TASK_LIST_CACHE_MS,
  now: now = () => Date['now'](),
} = {}) {
  let _0x9b2679 = null;
  return {
    async get(_0xffb301 = '') {
      const _0x2721a6 = Number(now()) || 0x0;
      if (
        _0x9b2679 &&
        _0x2721a6 - _0x9b2679['createdAt'] < Math['max'](0x0, Number(ttlMs) || 0x0) &&
        (_0x9b2679['pending'] || !_0xffb301 || _0x9b2679['taskIds']['has'](_0xffb301))
      )
        return _0x9b2679['promise'];
      const _0x3d83b7 = {
        createdAt: _0x2721a6,
        pending: !![],
        taskIds: new Set(_0xffb301 ? [_0xffb301] : []),
        promise: null,
      };
      return (
        (_0x3d83b7['promise'] = Promise['resolve']()
          ['then'](() => _0x528869?.())
          ['then']((_0x2161a1) => {
            const _0xf31ede = Array['isArray'](_0x2161a1?.['tasks'])
              ? _0x2161a1['tasks']
              : Array['isArray'](_0x2161a1)
                ? _0x2161a1
                : [];
            return (
              _0xf31ede['forEach']((_0x1dde55) => {
                const _0x566bc6 = String(_0x1dde55?.['taskId'] || _0x1dde55?.['id'] || '')['trim']();
                if (_0x566bc6) _0x3d83b7['taskIds']['add'](_0x566bc6);
              }),
              _0xf31ede
            );
          })
          ['catch']((_0x25476c) => {
            if (_0x9b2679 === _0x3d83b7) _0x9b2679 = null;
            throw _0x25476c;
          })
          ['finally'](() => {
            _0x3d83b7['pending'] = ![];
          })),
        (_0x9b2679 = _0x3d83b7),
        _0x3d83b7['promise']
      );
    },
  };
}
const mediaTaskListCache = createMediaTaskListCache({
  list: () => desktopBridge['mediaTask']['list']({ limit: 0x1f4 }),
});
function normalizeStatus(_0x5eb928) {
  return String(_0x5eb928 || '')['trim']();
}
function buildStatusPatch(_0x63b9c1 = {}) {
  const _0x389691 = normalizeStatus(_0x63b9c1['status']),
    _0x1c8164 = {
      mediaTaskId: String(_0x63b9c1['taskId'] || ''),
      mediaTaskKind: String(_0x63b9c1['kind'] || ''),
      mediaTaskStatus: _0x389691,
      mediaTaskProgress: Number(_0x63b9c1['progress'] || 0x0) || 0x0,
      mediaTaskError: String(_0x63b9c1['error'] || ''),
    };
  if (_0x389691 === 'waiting' || _0x389691 === 'processing')
    ((_0x1c8164['isGenerating'] = !![]),
      (_0x1c8164['jobStatus'] = 'running'),
      (_0x1c8164['jobError'] = null));
  else {
    if (_0x389691 === 'complete')
      ((_0x1c8164['isGenerating'] = ![]),
        (_0x1c8164['jobStatus'] = 'success'),
        (_0x1c8164['jobError'] = null));
    else {
      if (_0x389691 === 'failed')
        ((_0x1c8164['isGenerating'] = ![]),
          (_0x1c8164['jobStatus'] = 'error'),
          (_0x1c8164['jobError'] = _0x1c8164['mediaTaskError'] || 'Media task failed'),
          void logDiagnosticEvent({
            type: 'generation.media_task_failed',
            level: 'error',
            source: 'renderer',
            message: _0x1c8164['jobError'],
            context: {
              taskId: _0x1c8164['mediaTaskId'],
              kind: _0x1c8164['mediaTaskKind'],
              nodeId: _0x63b9c1['nodeId'] || '',
              assetId: _0x63b9c1['assetId'] || '',
            },
          }));
      else
        _0x389691 === 'cancelled' &&
          ((_0x1c8164['isGenerating'] = ![]),
          (_0x1c8164['jobStatus'] = null),
          (_0x1c8164['jobError'] = null));
    }
  }
  return _0x1c8164;
}
function isVideoProxyMigrationEvent(_0x1c7dbc = {}) {
  return String(_0x1c7dbc?.['purpose'] || '')['trim']() === VIDEO_PROXY_MIGRATION_PURPOSE;
}
function publishVideoProxyMigrationUpdate(_0x22c14a = {}) {
  if (!isVideoProxyMigrationEvent(_0x22c14a)) return;
  for (const _0x2429ee of videoProxyMigrationUpdateListeners) {
    try {
      _0x2429ee(_0x22c14a);
    } catch (_0x34cdca) {
      console['warn']('[mediaTaskService]\x20video\x20proxy\x20migration\x20listener\x20failed:', _0x34cdca);
    }
  }
}
export function subscribeVideoProxyMigrationUpdates(_0x92dd51) {
  if (typeof _0x92dd51 !== 'function') return () => {};
  return (
    videoProxyMigrationUpdateListeners['add'](_0x92dd51),
    installMediaTaskUpdateListener(),
    () => videoProxyMigrationUpdateListeners['delete'](_0x92dd51)
  );
}
export function shouldApplyMediaTaskEventToNode(_0x401d46 = {}, _0x3e642e = {}) {
  const _0x2fb136 = String(_0x3e642e?.['taskId'] || _0x3e642e?.['id'] || '')['trim']();
  if (!_0x2fb136) return !![];
  const _0xf2cdba = String(
    isVideoProxyMigrationEvent(_0x3e642e)
      ? _0x401d46?.['videoProxyMigrationTaskId']
      : _0x401d46?.['mediaTaskId'],
  )['trim']();
  return !_0xf2cdba || _0xf2cdba === _0x2fb136;
}
function buildVideoProxyMigrationStatusPatch(_0x492ae4 = {}) {
  const _0x204e5a = normalizeStatus(_0x492ae4['status']);
  return {
    videoProxyMigrationTaskId: String(_0x492ae4['taskId'] || ''),
    videoProxyMigrationStatus: _0x204e5a,
    videoProxyMigrationError: _0x204e5a === 'failed' ? String(_0x492ae4['error'] || '') : '',
  };
}
function shouldClearVideoCapturePreview(_0x57e986 = {}, _0x35acef = {}) {
  const _0x159bef = String(_0x35acef['videoProxyStatus'] || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x159bef !== 'generated' && _0x159bef !== 'not_required') return ![];
  return !!resolveCanvasVideoUrl({ ..._0x57e986, ..._0x35acef });
}
function buildResultPatch(_0x22468f = {}, _0x541d74 = {}) {
  const _0x258ec2 = _0x22468f['result'] && typeof _0x22468f['result'] === 'object' ? _0x22468f['result'] : {},
    _0x409643 = String(_0x22468f['kind'] || '');
  if (!_0x258ec2 || Object['keys'](_0x258ec2)['length'] === 0x0) return {};
  if (_0x409643 === 'videoPoster' && isVideoProxyMigrationEvent(_0x22468f))
    return buildCanvasLocalVideoFields({
      pendingVideoProxyLocalPath: _0x258ec2['displayLocalPath'] || '',
      pendingVideoProxyVersion: _0x258ec2['videoProxyVersion'] || '',
    });
  if (_0x409643 === 'videoPoster' || _0x409643 === 'videoFirstFrame') {
    const _0x59a8a4 = buildCanvasLocalVideoFields({
      ...(_0x409643 === 'videoPoster' && _0x258ec2['displayLocalPath']
        ? { displayLocalPath: _0x258ec2['displayLocalPath'] }
        : {}),
      ...(_0x409643 === 'videoPoster'
        ? {
            videoProxyStatus: _0x258ec2['videoProxyStatus'] || '',
            videoProxyVersion: _0x258ec2['videoProxyVersion'] || '',
            videoCodec: _0x258ec2['videoCodec'] || '',
          }
        : {}),
      posterLocalPath:
        _0x258ec2['posterLocalPath'] || _0x258ec2['thumbLocalPath'] || _0x258ec2['localPath'] || '',
      thumbUrl: _0x258ec2['posterUrl'] || _0x258ec2['thumbUrl'] || _0x258ec2['url'] || '',
      videoThumbSrc: _0x258ec2['src'] || '',
    });
    return (
      _0x409643 === 'videoPoster' &&
        shouldClearVideoCapturePreview(_0x541d74, _0x59a8a4) &&
        (_0x59a8a4['capturePreviewUrl'] = ''),
      _0x59a8a4
    );
  }
  if (_0x409643 === 'audioWaveform')
    return buildCanvasLocalAudioFields({ waveformLocalPath: _0x258ec2['waveformLocalPath'] || '' });
  return {};
}
function buildMediaTaskUpdatePatch(_0x412810 = {}, _0x2c17e3 = {}) {
  return {
    ...(isVideoProxyMigrationEvent(_0x412810)
      ? buildVideoProxyMigrationStatusPatch(_0x412810)
      : buildStatusPatch(_0x412810)),
    ...(normalizeStatus(_0x412810['status']) === 'complete' ? buildResultPatch(_0x412810, _0x2c17e3) : {}),
  };
}
function getUpdateKey(_0x30dbdd = {}) {
  return [
    String(_0x30dbdd['taskId'] || ''),
    String(_0x30dbdd['kind'] || ''),
    String(_0x30dbdd['nodeId'] || ''),
    String(_0x30dbdd['assetId'] || ''),
  ]['join']('|');
}
function nowMs() {
  return Number(globalThis['performance']?.['now']?.() || Date['now']()) || 0x0;
}
function flushPendingUpdates() {
  ((pendingUpdateTimer = null), (lastPendingUpdateFlushAt = nowMs()));
  const _0x4438ea = Array['from'](pendingUpdates['values']());
  (pendingUpdates['clear'](),
    _0x4438ea['forEach']((_0x52fcd2) => {
      try {
        applyMediaTaskUpdate(_0x52fcd2);
      } catch (_0xa36daf) {
        console['warn']('[mediaTaskService] failed to apply media task update:', _0xa36daf);
      }
    }));
}
function schedulePendingUpdateFlush() {
  if (pendingUpdateTimer !== null) return;
  const _0x3cf9a9 = nowMs() - lastPendingUpdateFlushAt,
    _0x1b98ec = Math['max'](0x0, COALESCED_UPDATE_INTERVAL_MS - _0x3cf9a9);
  pendingUpdateTimer = setTimeout(flushPendingUpdates, _0x1b98ec);
}
function handleMediaTaskUpdate(_0x1929fd = {}) {
  publishVideoProxyMigrationUpdate(_0x1929fd);
  const _0x21043a = normalizeStatus(_0x1929fd['status']),
    _0x4d2a55 = getUpdateKey(_0x1929fd);
  if (TERMINAL_STATUSES['has'](_0x21043a)) {
    const _0x2428b8 = pendingUpdates['get'](_0x4d2a55);
    if (_0x2428b8) pendingUpdates['delete'](_0x4d2a55);
    (proxyMigrationRequestTracker['release'](_0x1929fd),
      applyMediaTaskUpdate({ ...(_0x2428b8 || {}), ..._0x1929fd }));
    return;
  }
  if (COALESCED_STATUSES['has'](_0x21043a)) {
    (pendingUpdates['set'](_0x4d2a55, _0x1929fd), schedulePendingUpdateFlush());
    return;
  }
  applyMediaTaskUpdate(_0x1929fd);
}
function resolveMatchingNodeIds(_0x424a36 = {}, _0x9efc6a = {}) {
  const _0x204ab0 = String(_0x9efc6a['nodeId'] || '')['trim'](),
    _0x1a1437 = String(_0x9efc6a['assetId'] || '')['trim'](),
    _0x2ddd23 = [];
  if (_0x204ab0 && _0x424a36[_0x204ab0]) _0x2ddd23['push'](_0x204ab0);
  const _0x50e10a =
    !_0x204ab0 ||
    (String(_0x9efc6a?.['status'] || '')
      ['trim']()
      ['toLowerCase']() === 'complete' &&
      SHARED_ASSET_RESULT_TASK_KINDS['has'](String(_0x9efc6a?.['kind'] || '')['trim']()));
  return (
    _0x1a1437 &&
      _0x50e10a &&
      Object['values'](_0x424a36)['forEach']((_0x2ca1c1) => {
        if (String(_0x2ca1c1?.['assetId'] || '')['trim']() !== _0x1a1437) return;
        if (_0x2ca1c1?.['id'] && !_0x2ddd23['includes'](_0x2ca1c1['id'])) _0x2ddd23['push'](_0x2ca1c1['id']);
      }),
    _0x2ddd23
  );
}
function getMatchingNodeIds(_0x275c17 = {}) {
  const _0x276936 =
    typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
  return resolveMatchingNodeIds(_0x276936?.['nodes'] || {}, _0x275c17);
}
function applyMediaTaskUpdate(_0x135a40 = {}) {
  const _0x2d2ef5 = getMatchingNodeIds(_0x135a40);
  if (!_0x2d2ef5['length']) return;
  const _0x14d4e8 =
      typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState'](),
    _0x1fa0a5 = {};
  _0x2d2ef5['forEach']((_0x559915) => {
    const _0xc1c670 = _0x14d4e8?.['nodes']?.[_0x559915];
    if (!shouldApplyMediaTaskEventToNode(_0xc1c670, _0x135a40)) return;
    const _0x5d7cd8 = buildMediaTaskUpdatePatch(_0x135a40, _0xc1c670),
      _0x34659d = Object['entries'](_0x5d7cd8)['some'](
        ([_0x52288e, _0xb69579]) => _0xc1c670?.[_0x52288e] !== _0xb69579,
      );
    if (_0x34659d) _0x1fa0a5[_0x559915] = _0x5d7cd8;
  });
  const _0x440abe = Object['keys'](_0x1fa0a5);
  if (!_0x440abe['length']) return;
  if (typeof appStore['updateNodesData'] === 'function' && _0x440abe['length'] > 0x1) {
    appStore['updateNodesData'](_0x1fa0a5);
    return;
  }
  _0x440abe['forEach']((_0xe83b52) => appStore['updateNodeData'](_0xe83b52, _0x1fa0a5[_0xe83b52]));
}
function normalizeProxyPath(_0x578733) {
  return normalizeCanvasLocalPath(_0x578733)['replace'](/\\/g, '/');
}
function isLegacyProjectImportProxyPath(_0x510212) {
  const _0x113240 = normalizeProxyPath(_0x510212);
  return /(?:^|\/)ProjectImports\/[^/]+(?:\/.*)?\.proxy\.mp4$/i['test'](_0x113240);
}
export function getLegacyVideoProxyAssetId(_0x2f9925) {
  const _0x386004 = normalizeProxyPath(_0x2f9925);
  if (!_0x386004) return '';
  let _0x2f88ec = 0xcbf29ce484222325n;
  for (let _0x427ea2 = 0x0; _0x427ea2 < _0x386004['length']; _0x427ea2 += 0x1) {
    ((_0x2f88ec ^= BigInt(_0x386004['charCodeAt'](_0x427ea2))),
      (_0x2f88ec = BigInt['asUintN'](0x40, _0x2f88ec * 0x100000001b3n)));
  }
  return 'legacy-' + _0x2f88ec['toString'](0x10)['padStart'](0x10, '0');
}
export function getLegacyProjectImportVideoProxyMigration(_0x2c9691 = {}) {
  if (
    String(_0x2c9691?.['type'] || '')
      ['trim']()
      ['toLowerCase']() !== 'source-video'
  )
    return null;
  if (String(_0x2c9691?.['videoProxyVersion'] || '')['trim']() === VIDEO_PROXY_VERSION_V2_1280) return null;
  if (
    String(_0x2c9691?.['pendingVideoProxyVersion'] || '')['trim']() === VIDEO_PROXY_VERSION_V2_1280 &&
    normalizeProxyPath(_0x2c9691?.['pendingVideoProxyLocalPath'])
  )
    return null;
  const _0x350177 = [
      _0x2c9691?.['originalLocalPath'],
      _0x2c9691?.['localPath'],
      _0x2c9691?.['displayLocalPath'],
      _0x2c9691?.['videoUrl'],
      _0x2c9691?.['src'],
      _0x2c9691?.['url'],
      _0x2c9691?.['resultUrl'],
    ]
      ['map'](normalizeProxyPath)
      ['find'](isLegacyProjectImportProxyPath),
    _0x317a5f = String(_0x2c9691?.['assetId'] || '')['trim'](),
    _0x3d3022 =
      (/^[a-z0-9_-]+$/i['test'](_0x317a5f) ? _0x317a5f : '') || getLegacyVideoProxyAssetId(_0x350177),
    _0x1577c7 = String(_0x2c9691?.['id'] || '')['trim']();
  if (!_0x350177 || !_0x3d3022 || !_0x1577c7) return null;
  return {
    nodeId: _0x1577c7,
    assetId: _0x3d3022,
    sourceLocalPath: _0x350177,
    hasDisplayLocalPath: !!normalizeProxyPath(_0x2c9691?.['displayLocalPath']),
    targetVersion: VIDEO_PROXY_VERSION_V2_1280,
    key: _0x3d3022 + '|' + _0x350177 + '|' + VIDEO_PROXY_VERSION_V2_1280,
  };
}
export function getVisibleVideoProxyMigration(_0x5db22e = {}) {
  const _0x4385a4 = getLegacyProjectImportVideoProxyMigration(_0x5db22e);
  if (_0x4385a4) return _0x4385a4;
  if (
    String(_0x5db22e?.['type'] || '')
      ['trim']()
      ['toLowerCase']() !== 'source-video'
  )
    return null;
  if (String(_0x5db22e?.['videoProxyVersion'] || '')['trim']() === VIDEO_PROXY_VERSION_V2_1280) return null;
  const _0x34499e = String(_0x5db22e?.['videoProxyStatus'] || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x34499e !== 'processing' && _0x34499e !== 'waiting') return null;
  if (normalizeProxyPath(_0x5db22e?.['displayLocalPath'])) return null;
  const _0x5ba1d5 = String(_0x5db22e?.['id'] || '')['trim'](),
    _0x528d6f = String(_0x5db22e?.['assetId'] || '')['trim'](),
    _0xd571e5 = normalizeProxyPath(
      _0x5db22e?.['originalLocalPath'] ||
        _0x5db22e?.['localPath'] ||
        _0x5db22e?.['videoUrl'] ||
        _0x5db22e?.['src'],
    );
  if (!_0x5ba1d5 || !/^[a-z0-9_-]+$/i['test'](_0x528d6f) || !_0xd571e5) return null;
  return {
    nodeId: _0x5ba1d5,
    assetId: _0x528d6f,
    sourceLocalPath: _0xd571e5,
    hasDisplayLocalPath: ![],
    targetVersion: VIDEO_PROXY_VERSION_V2_1280,
    key: _0x528d6f + '|' + _0xd571e5 + '|' + VIDEO_PROXY_VERSION_V2_1280,
  };
}
export function isMediaTaskActiveInList(_0x78819f = {}, _0x579ab6 = []) {
  const _0x395208 = String(_0x78819f?.['mediaTaskId'] || '')['trim'](),
    _0x38dfca = String(_0x78819f?.['mediaTaskStatus'] || '')
      ['trim']()
      ['toLowerCase']();
  if (!_0x395208 || !ACTIVE_TASK_STATUSES['has'](_0x38dfca)) return ![];
  return (Array['isArray'](_0x579ab6) ? _0x579ab6 : [])['some']((_0x487dde) => {
    const _0x46148b = String(_0x487dde?.['taskId'] || _0x487dde?.['id'] || '')['trim'](),
      _0x45e75f = String(_0x487dde?.['status'] || '')
        ['trim']()
        ['toLowerCase']();
    return _0x46148b === _0x395208 && ACTIVE_TASK_STATUSES['has'](_0x45e75f);
  });
}
async function listMediaTasksCached(_0x1a08b1 = '') {
  return mediaTaskListCache['get'](_0x1a08b1);
}
async function enqueueVideoProxyMigration(
  _0x203178,
  {
    enqueue: enqueue = (_0x507823) => desktopBridge['mediaTask']['enqueue'](_0x507823),
    updateNode: updateNode = (_0x26df40, _0x4c0a06) => appStore['updateNodeData'](_0x26df40, _0x4c0a06),
    requestTracker: requestTracker = proxyMigrationRequestTracker,
    requestedKeys: requestedKeys = requestTracker?.['requestedKeys'] ||
      proxyMigrationRequestTracker['requestedKeys'],
  } = {},
) {
  if (!_0x203178 || requestedKeys['has'](_0x203178['key'])) return null;
  requestedKeys['add'](_0x203178['key']);
  try {
    const _0x1cd947 = await enqueue({
      kind: 'videoPoster',
      purpose: VIDEO_PROXY_MIGRATION_PURPOSE,
      priority: VIDEO_PROXY_MIGRATION_PRIORITY,
      migrationKey: _0x203178['key'],
      nodeId: _0x203178['nodeId'],
      assetId: _0x203178['assetId'],
      src: _0x203178['sourceLocalPath'],
      originalLocalPath: _0x203178['sourceLocalPath'],
      videoProxyTargetVersion: _0x203178['targetVersion'],
    });
    if (!_0x1cd947 || typeof _0x1cd947 !== 'object') return (requestedKeys['delete'](_0x203178['key']), null);
    const _0x41e6a9 =
        requestTracker?.['requestedKeys'] === requestedKeys && typeof requestTracker?.['track'] === 'function'
          ? requestTracker['track'](_0x1cd947, _0x203178['key'])
          : null,
      _0x1893d8 = _0x41e6a9 ? { ..._0x1cd947, ..._0x41e6a9 } : _0x1cd947,
      _0x1d5c4e = { ..._0x1893d8, purpose: VIDEO_PROXY_MIGRATION_PURPOSE },
      _0x5369a1 = normalizeStatus(_0x1d5c4e['status'])['toLowerCase']();
    return (
      updateNode(_0x203178['nodeId'], {
        ...buildVideoProxyMigrationStatusPatch(_0x1d5c4e),
        ...(_0x5369a1 === 'complete' ? buildResultPatch(_0x1d5c4e) : {}),
        assetId: _0x203178['assetId'],
        ...(ACTIVE_TASK_STATUSES['has'](_0x5369a1) ? { videoProxyStatus: 'processing' } : {}),
        ...(!_0x203178['hasDisplayLocalPath'] ? { displayLocalPath: _0x203178['sourceLocalPath'] } : {}),
      }),
      _0x1893d8 || null
    );
  } catch (_0x4f246b) {
    requestedKeys['delete'](_0x203178['key']);
    throw _0x4f246b;
  }
}
export async function requestVisibleVideoProxyMigration(_0x2deee7) {
  const _0x898d7b = String(_0x2deee7 || '')['trim']();
  if (!_0x898d7b) return null;
  const _0x30f1d3 =
      typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState'](),
    _0x38acc6 = _0x30f1d3?.['nodes']?.[_0x898d7b],
    _0x3bbcd1 = getVisibleVideoProxyMigration(_0x38acc6);
  if (!_0x3bbcd1) return null;
  if (!getLegacyProjectImportVideoProxyMigration(_0x38acc6))
    try {
      if (
        isMediaTaskActiveInList(
          _0x38acc6,
          await listMediaTasksCached(String(_0x38acc6?.['mediaTaskId'] || '')['trim']()),
        )
      )
        return null;
    } catch {
      return null;
    }
  return enqueueVideoProxyMigration(_0x3bbcd1);
}
async function cancelVideoProxyMigrationTaskWithDeps(
  _0x142b06,
  { cancel: cancel = (_0x13dd04) => desktopBridge['mediaTask']['cancel'](_0x13dd04) } = {},
) {
  const _0x5c1f4c = String(_0x142b06 || '')['trim']();
  if (!_0x5c1f4c) return { ok: ![], error: 'Missing media task id' };
  return cancel({ taskId: _0x5c1f4c, onlyIfWaiting: !![] });
}
export function cancelVideoProxyMigrationTask(_0x22804c) {
  return cancelVideoProxyMigrationTaskWithDeps(_0x22804c);
}
export function __enqueueVideoProxyMigrationForTest(_0x119924, _0x1db9aa) {
  return enqueueVideoProxyMigration(_0x119924, _0x1db9aa);
}
export function __cancelVideoProxyMigrationTaskForTest(_0x128536, _0x4429ff) {
  return cancelVideoProxyMigrationTaskWithDeps(_0x128536, _0x4429ff);
}
export function __resolveMatchingMediaTaskNodeIdsForTest(_0x168d20, _0x5a2005) {
  return resolveMatchingNodeIds(_0x168d20, _0x5a2005);
}
export function installMediaTaskUpdateListener() {
  if (installed) return;
  installed = !![];
  const _0x3e0260 = desktopBridge['mediaTask']['onUpdate'];
  typeof _0x3e0260 === 'function' &&
    _0x3e0260((_0x3eb6b5) => {
      try {
        handleMediaTaskUpdate(_0x3eb6b5 || {});
      } catch (_0x3c518b) {
        console['warn']('[mediaTaskService] failed to apply media task update:', _0x3c518b);
      }
    });
}
export function __buildMediaTaskStatusPatchForTest(_0x1d9d8e = {}) {
  return buildStatusPatch(_0x1d9d8e);
}
export function __buildMediaTaskResultPatchForTest(_0x523915 = {}, _0x3c5fd9 = {}) {
  return buildResultPatch(_0x523915, _0x3c5fd9);
}
export function __buildMediaTaskUpdatePatchForTest(_0x31afcc = {}, _0x1933c4 = {}) {
  return buildMediaTaskUpdatePatch(_0x31afcc, _0x1933c4);
}
export function __applyMediaTaskUpdateForTest(_0x2d43dd = {}) {
  return applyMediaTaskUpdate(_0x2d43dd);
}
export function __handleMediaTaskUpdateForTest(_0x2a5d81 = {}) {
  return handleMediaTaskUpdate(_0x2a5d81);
}
