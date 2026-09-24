import { mediaTaskOwnsGuardedWriteback } from '../modules/mediaTaskRecoveryModel.js';
import { mayApplyMediaTaskUpdate, releaseMediaTaskCanvasScope } from '../modules/mediaTaskCanvasScope.js';
import appStore from '../core/stores/appStore.js';
import { buildCanvasLocalAudioFields, buildCanvasLocalVideoFields } from './canvasMediaLocalService.js';
import { logDiagnosticEvent } from './diagnosticsService.js';
let installed = false,
  pendingUpdateTimer = null,
  lastPendingUpdateFlushAt = 0;
const pendingUpdates = new Map(),
  COALESCED_UPDATE_INTERVAL_MS = 250,
  COALESCED_STATUSES = new Set(['waiting', 'processing']),
  TERMINAL_STATUSES = new Set(['complete', 'failed', 'cancelled']);
function normalizeStatus(_0x5ee533) {
  return String(_0x5ee533 || '').trim();
}
function buildStatusPatch(_0x112a0b = {}) {
  const _0x3946c2 = normalizeStatus(_0x112a0b.status),
    _0x47c2d1 = {
      mediaTaskId: String(_0x112a0b.taskId || ''),
      mediaTaskKind: String(_0x112a0b.kind || ''),
      mediaTaskStatus: _0x3946c2,
      mediaTaskProgress: Number(_0x112a0b.progress || 0) || 0,
      mediaTaskError: String(_0x112a0b.error || ''),
    };
  if (_0x3946c2 === 'waiting' || _0x3946c2 === 'processing')
    ((_0x47c2d1.isGenerating = true), (_0x47c2d1.jobStatus = 'running'), (_0x47c2d1.jobError = null));
  else {
    if (_0x3946c2 === 'complete')
      ((_0x47c2d1.isGenerating = false), (_0x47c2d1.jobStatus = 'success'), (_0x47c2d1.jobError = null));
    else {
      if (_0x3946c2 === 'failed')
        ((_0x47c2d1.isGenerating = false),
          (_0x47c2d1.jobStatus = 'error'),
          (_0x47c2d1.jobError = _0x47c2d1.mediaTaskError || 'Media task failed'),
          void logDiagnosticEvent({
            type: 'generation.media_task_failed',
            level: 'error',
            source: 'renderer',
            message: _0x47c2d1.jobError,
            context: {
              taskId: _0x47c2d1.mediaTaskId,
              kind: _0x47c2d1.mediaTaskKind,
              nodeId: _0x112a0b.nodeId || '',
              assetId: _0x112a0b.assetId || '',
            },
          }));
      else
        _0x3946c2 === 'cancelled' &&
          ((_0x47c2d1.isGenerating = false), (_0x47c2d1.jobStatus = null), (_0x47c2d1.jobError = null));
    }
  }
  return _0x47c2d1;
}
function buildResultPatch(_0x3e162a = {}) {
  const _0x356ea7 = _0x3e162a.result && typeof _0x3e162a.result === 'object' ? _0x3e162a.result : {},
    _0x25e61c = String(_0x3e162a.kind || '');
  if (!_0x356ea7 || Object.keys(_0x356ea7).length === 0) return {};
  if (_0x25e61c === 'videoPoster' || _0x25e61c === 'videoFirstFrame') {
    const _0x133333 = buildCanvasLocalVideoFields({
      ...(_0x25e61c === 'videoPoster' && _0x356ea7.displayLocalPath
        ? { displayLocalPath: _0x356ea7.displayLocalPath }
        : {}),
      ...(_0x25e61c === 'videoPoster'
        ? { videoProxyStatus: _0x356ea7.videoProxyStatus || '', videoCodec: _0x356ea7.videoCodec || '' }
        : {}),
      posterLocalPath: _0x356ea7.posterLocalPath || _0x356ea7.thumbLocalPath || _0x356ea7.localPath || '',
      thumbUrl: _0x356ea7.posterUrl || _0x356ea7.thumbUrl || _0x356ea7.url || '',
      videoThumbSrc: _0x356ea7.src || '',
    });
    if (_0x25e61c === 'videoPoster') _0x133333.capturePreviewUrl = '';
    return _0x133333;
  }
  if (_0x25e61c === 'audioWaveform')
    return buildCanvasLocalAudioFields({ waveformLocalPath: _0x356ea7.waveformLocalPath || '' });
  return {};
}
function getUpdateKey(_0x140699 = {}) {
  return [
    String(_0x140699.taskId || ''),
    String(_0x140699.kind || ''),
    String(_0x140699.nodeId || ''),
    String(_0x140699.assetId || ''),
  ].join('|');
}
function nowMs() {
  return Number(globalThis.performance?.now?.() || Date.now()) || 0;
}
function flushPendingUpdates() {
  ((pendingUpdateTimer = null), (lastPendingUpdateFlushAt = nowMs()));
  const _0x5aed4e = Array.from(pendingUpdates.values());
  (pendingUpdates.clear(),
    _0x5aed4e.forEach((_0x41860b) => {
      try {
        applyMediaTaskUpdate(_0x41860b);
      } catch (_0x2e235b) {
        console.warn('[mediaTaskService] failed to apply media task update:', _0x2e235b);
      }
    }));
}
function schedulePendingUpdateFlush() {
  if (pendingUpdateTimer !== null) return;
  const _0x56b40b = nowMs() - lastPendingUpdateFlushAt,
    _0x1647c9 = Math.max(0, COALESCED_UPDATE_INTERVAL_MS - _0x56b40b);
  pendingUpdateTimer = setTimeout(flushPendingUpdates, _0x1647c9);
}
function handleMediaTaskUpdate(_0x594b42 = {}) {
  // Story export has its own canvas/source guard; never mutate a same-ID node here.
  if (mediaTaskOwnsGuardedWriteback(_0x594b42)) {
    if (TERMINAL_STATUSES.has(normalizeStatus(_0x594b42.status))) releaseMediaTaskCanvasScope(_0x594b42.taskId);
    return;
  }
  const _0x40cb6b = normalizeStatus(_0x594b42.status),
    _0x324897 = getUpdateKey(_0x594b42);
  if (TERMINAL_STATUSES.has(_0x40cb6b)) {
    const _0x3ce307 = pendingUpdates.get(_0x324897);
    if (_0x3ce307) pendingUpdates.delete(_0x324897);
    try { applyMediaTaskUpdate({ ...(_0x3ce307 || {}), ..._0x594b42 }); }
    finally { releaseMediaTaskCanvasScope(_0x594b42.taskId); }
    return;
  }
  if (COALESCED_STATUSES.has(_0x40cb6b)) {
    (pendingUpdates.set(_0x324897, _0x594b42), schedulePendingUpdateFlush());
    return;
  }
  applyMediaTaskUpdate(_0x594b42);
}
function getMatchingNodeIds(_0x14c00b = {}) {
  const _0x2d8c87 = typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
    _0x40f489 = _0x2d8c87?.nodes || {},
    _0xa7904e = String(_0x14c00b.nodeId || '').trim();
  if (_0xa7904e && _0x40f489[_0xa7904e]) return [_0xa7904e];
  const _0x206564 = String(_0x14c00b.assetId || '').trim();
  if (!_0x206564) return [];
  return Object.values(_0x40f489)
    .filter((_0x3787ee) => String(_0x3787ee?.assetId || '').trim() === _0x206564)
    .map((_0x9224de) => _0x9224de.id)
    .filter(Boolean);
}
function applyMediaTaskUpdate(_0x394a51 = {}) {
  // Also recheck after coalescing: a canvas may switch during the 250 ms delay.
  if (!mayApplyMediaTaskUpdate(_0x394a51.taskId, appStore, globalThis.window)) return;
  const _0x2e7fe6 = getMatchingNodeIds(_0x394a51);
  if (!_0x2e7fe6.length) return;
  const _0x5c6917 = {
      ...buildStatusPatch(_0x394a51),
      ...(normalizeStatus(_0x394a51.status) === 'complete' ? buildResultPatch(_0x394a51) : {}),
    },
    _0x56808a = {};
  _0x2e7fe6.forEach((_0x1c3cb5) => {
    _0x56808a[_0x1c3cb5] = _0x5c6917;
  });
  if (typeof appStore.updateNodesData === 'function' && _0x2e7fe6.length > 1) {
    appStore.updateNodesData(_0x56808a);
    return;
  }
  _0x2e7fe6.forEach((_0x4f9cc0) => appStore.updateNodeData(_0x4f9cc0, _0x5c6917));
}
export function installMediaTaskUpdateListener() {
  if (installed) return;
  installed = true;
  const _0x2d5323 = globalThis.window?.electronAPI?.mediaTask?.onUpdate;
  if (typeof _0x2d5323 !== 'function') return;
  _0x2d5323((_0x57762e) => {
    try {
      handleMediaTaskUpdate(_0x57762e || {});
    } catch (_0x245213) {
      console.warn('[mediaTaskService] failed to apply media task update:', _0x245213);
    }
  });
}
export function __buildMediaTaskStatusPatchForTest(_0x3822fc = {}) {
  return buildStatusPatch(_0x3822fc);
}
export function __buildMediaTaskResultPatchForTest(_0x3ef59d = {}) {
  return buildResultPatch(_0x3ef59d);
}
