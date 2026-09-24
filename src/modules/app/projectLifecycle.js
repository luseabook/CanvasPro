import { sanitizeSerializedCanvasData } from '../../utils/thumbnailPersistence.js';
import { buildImageNodeStorageFields } from '../../services/imageDerivativeService.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import { createStableSignature } from '../../utils/stableSignature.js';
import { normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { requireProjectDocument } from '../../services/projectDocumentGuard.js';
import { isModelApiModel, isWorkflowModel, resolveModelProvider } from '../../manifests/index.js';
import { t } from '../../i18n/index.js';
export { createStableSignature } from '../../utils/stableSignature.js';
const BOOT_PERF_MEASURE_NAMES = [
    'project.loadProject',
    'buildHydrationSafeMultiData',
    'hydrateTrustedSnapshot',
    'CanvasTabManager.init',
    'loader hidden',
    'historicalAiLocalization queued',
  ],
  WORKSPACE_META_KEY = 'workspace_meta',
  LEGACY_WORKSPACE_KEY = 'current_state',
  WORKSPACE_CANVAS_KEY_PREFIX = 'workspace_canvas::',
  DREAMINA_RESUME_BACKUP_KEY = 'tapnow_v2_dreamina_resume_backup',
  PAGE_LIFECYCLE_FLUSH_DEDUPE_MS = 0x7d0,
  RECOVERY_SNAPSHOT_DEDUPE_MS = 0x1388,
  DREAMINA_RESUME_BACKUP_FIELDS = [
    'canvasId',
    'nodeId',
    'generationStartTime',
    'generationDuration',
    'dreaminaSubmitId',
    'dreaminaTaskStatus',
    'dreaminaTaskPhase',
    'dreaminaTaskLabel',
    'dreaminaTaskStartedAt',
    'dreaminaTaskLastCheckedAt',
    'dreaminaTaskRecovering',
  ];
function unsafeRecoveryError() {
  return Object.assign(new Error('恢复快照或本地缓存无法安全读取；保留原始数据，未加载空画布'), {
    code: 'UNSAFE_PROJECT_RECOVERY',
  });
}
function getUntitledProjectName() {
  return t('projectLifecycle.untitledProject');
}
function getUntitledCanvasName() {
  return t('projectLifecycle.untitledCanvas');
}
function getDefaultCanvasName() {
  return t('projectLifecycle.defaultCanvas');
}
function buildWorkspaceCanvasKey(_0x4ee06d) {
  return '' + WORKSPACE_CANVAS_KEY_PREFIX + String(_0x4ee06d || '').trim();
}
function inferAsyncProviderByModel(_0x5ac0cc, _0x195e9c = '') {
  const _0x5661eb = resolveModelProvider(_0x5ac0cc, '', { allowProviderHint: false });
  if (_0x5661eb) return _0x5661eb;
  const _0x2497a3 = String(_0x195e9c || '')
    .trim()
    .toLowerCase();
  if (_0x2497a3) return _0x2497a3;
  const _0x452b65 = String(_0x5ac0cc || '').trim();
  if (_0x452b65 && !_0x452b65.includes('/')) return 'grsai';
  return 'grsai';
}
function isDreaminaResumeCandidateNode(_0x2f3a97) {
  if (!_0x2f3a97 || typeof _0x2f3a97 !== 'object') return false;
  const _0xb9b0f3 = String(_0x2f3a97.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-image', 'source-video'].includes(_0xb9b0f3)) return false;
  const _0x2cdb11 = String(_0x2f3a97.provider || '')
      .trim()
      .toLowerCase(),
    _0x4aae9c = String(_0x2f3a97.model || '').trim(),
    _0x5642ec = _0x2cdb11 === 'dreamina' || resolveModelProvider(_0x4aae9c, _0x2cdb11) === 'dreamina';
  if (!_0x5642ec) return false;
  if (hasDreaminaResultError(_0x2f3a97)) return false;
  const _0x5274c5 = String(_0x2f3a97.jobStatus || '')
    .trim()
    .toLowerCase();
  if (_0x5274c5 === 'error' || _0x5274c5 === 'failed') return false;
  if (String(_0x2f3a97.jobError || '').trim()) return false;
  const _0x4ef2af = String(_0x2f3a97.dreaminaSubmitId || '').trim();
  if (!_0x4ef2af) return false;
  const _0x28dc87 = String(_0x2f3a97.dreaminaTaskPhase || '')
      .trim()
      .toLowerCase(),
    _0x1f671e = String(_0x2f3a97.dreaminaTaskStatus || '')
      .trim()
      .toLowerCase();
  if (_0x28dc87 === 'done' || _0x28dc87 === 'failed') return false;
  if (_0x1f671e === 'failed') return false;
  return true;
}
function hasDreaminaUsableResult(_0xb4ccc9) {
  const _0x9aabc8 = [_0xb4ccc9?.images, _0xb4ccc9?.videos].filter(Array.isArray);
  return _0x9aabc8.some((_0x138a47) =>
    _0x138a47.some((_0x2984a6) => {
      if (!_0x2984a6 || typeof _0x2984a6 !== 'object') return false;
      return !!String(
        _0x2984a6.localPath ||
          _0x2984a6.originalLocalPath ||
          _0x2984a6.displayLocalPath ||
          _0x2984a6.thumbLocalPath ||
          _0x2984a6.imageUrl ||
          _0x2984a6.videoUrl ||
          _0x2984a6.thumbUrl ||
          _0x2984a6.sourceUrl ||
          '',
      ).trim();
    }),
  );
}
function hasDreaminaResultError(_0x4fe32b) {
  const _0x1f0fb9 = [_0x4fe32b?.images, _0x4fe32b?.videos].filter(Array.isArray);
  if (_0x1f0fb9.length === 0) return false;
  if (hasDreaminaUsableResult(_0x4fe32b)) return false;
  return _0x1f0fb9.some((_0x556cae) =>
    _0x556cae.some(
      (_0x5eaf96) =>
        _0x5eaf96 &&
        typeof _0x5eaf96 === 'object' &&
        String(_0x5eaf96.error || _0x5eaf96.message || '').trim(),
    ),
  );
}
function isAsyncResumeCandidateNode(_0x4904e5) {
  if (!_0x4904e5 || typeof _0x4904e5 !== 'object') return false;
  const _0x552827 = String(_0x4904e5.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-video', 'source-image'].includes(_0x552827)) return false;
  const _0x5316a0 = String(_0x4904e5.asyncTaskId || '').trim();
  if (!_0x5316a0) return false;
  const _0x1d1187 = inferAsyncProviderByModel(
    _0x4904e5.model,
    _0x4904e5.asyncTaskProvider || _0x4904e5.provider || '',
  );
  if (!_0x1d1187 || _0x1d1187 === 'runninghubwf' || _0x1d1187 === 'runninghub' || _0x1d1187 === 'dreamina')
    return false;
  const _0x3ff313 = String(_0x4904e5.asyncTaskKind || '')
    .trim()
    .toLowerCase();
  if (_0x3ff313 === 'image' && !['ai-image', 'source-image'].includes(_0x552827)) return false;
  if (_0x3ff313 === 'video' && !['ai-video', 'source-video'].includes(_0x552827)) return false;
  const _0x12ad92 = String(_0x4904e5.asyncTaskStatus || '')
    .trim()
    .toLowerCase();
  if (_0x12ad92 === 'success' || _0x12ad92 === 'failed' || _0x12ad92 === 'idle' || _0x12ad92 === 'cancelled')
    return false;
  return true;
}
function isRunningHubResumeCandidateNode(_0x1daf40) {
  if (!_0x1daf40 || typeof _0x1daf40 !== 'object') return false;
  const _0xbc23fd = String(_0x1daf40.type || '')
    .trim()
    .toLowerCase();
  if (
    !['ai-video', 'ai-image', 'ai-audio', 'source-video', 'source-image', 'source-audio'].includes(_0xbc23fd)
  )
    return false;
  const _0x556942 = String(_0x1daf40.provider || '')
      .trim()
      .toLowerCase(),
    _0x16109a = String(_0x1daf40.model || '').trim(),
    _0x29578a = resolveModelProvider(_0x16109a, _0x556942, { allowProviderHint: false }),
    _0x1670d5 = isWorkflowModel(_0x16109a, _0x556942 || 'runninghubwf'),
    _0x34b5ae = _0x29578a === 'runninghub' && isModelApiModel(_0x16109a, 'runninghub'),
    _0x4818df = _0xbc23fd === 'ai-audio' && _0x556942 === 'runninghubwf',
    _0x4483ee = _0xbc23fd === 'source-video' && (_0x556942 === 'runninghubwf' || _0x1670d5),
    _0x43a3c8 =
      _0xbc23fd === 'source-image' &&
      (_0x556942 === 'runninghubwf' || _0x556942 === 'runninghub' || _0x1670d5 || _0x34b5ae),
    _0x1df0c4 = _0xbc23fd === 'source-audio' && _0x556942 === 'runninghubwf' && _0x1670d5,
    _0x32fdc6 =
      _0x43a3c8 ||
      _0x1df0c4 ||
      _0x4483ee ||
      _0x4818df ||
      _0x1670d5 ||
      _0x34b5ae ||
      _0x556942 === 'runninghub' ||
      _0x556942 === 'runninghubwf';
  if (!_0x32fdc6) return false;
  const _0x4445e1 = String(_0x1daf40.rhTaskId || '').trim();
  if (!_0x4445e1) return false;
  const _0x52d65d = String(_0x1daf40.rhTaskStatus || '')
    .trim()
    .toLowerCase();
  if (_0x52d65d === 'success' || _0x52d65d === 'failed' || _0x52d65d === 'idle' || _0x52d65d === 'cancelled')
    return false;
  return true;
}
function buildDreaminaResumeBackupPayload({
  projectId: _0xb19a28,
  projectName: _0x136e9b,
  multiData: _0x21fcd2,
}) {
  const _0x5786a2 = Array.isArray(_0x21fcd2?.canvases) ? _0x21fcd2.canvases : [],
    _0x5d4367 = [];
  return (
    _0x5786a2.forEach((_0x16bbe4) => {
      const _0x58ffe5 = String(_0x16bbe4?.id || '').trim();
      if (!_0x58ffe5) return;
      const _0x1e9489 = Array.isArray(_0x16bbe4?.nodes) ? _0x16bbe4.nodes : [];
      _0x1e9489.forEach((_0x80fade) => {
        const _0x55ed95 = {
          canvasId: _0x58ffe5,
          nodeId: String(_0x80fade.id || '').trim(),
          generationStartTime: Number(_0x80fade.generationStartTime || 0),
          generationDuration:
            _0x80fade.generationDuration == null ? null : Number(_0x80fade.generationDuration || 0),
        };
        if (isDreaminaResumeCandidateNode(_0x80fade)) {
          const _0xce1377 = {
            ..._0x55ed95,
            kind: 'dreamina',
            dreaminaSubmitId: String(_0x80fade.dreaminaSubmitId || '').trim(),
            dreaminaTaskStatus: String(_0x80fade.dreaminaTaskStatus || '').trim(),
            dreaminaTaskPhase: String(_0x80fade.dreaminaTaskPhase || '').trim(),
            dreaminaTaskLabel: String(_0x80fade.dreaminaTaskLabel || '').trim(),
            dreaminaTaskStartedAt: Number(_0x80fade.dreaminaTaskStartedAt || 0),
            dreaminaTaskLastCheckedAt: Number(_0x80fade.dreaminaTaskLastCheckedAt || 0),
            dreaminaTaskRecovering: !!_0x80fade.dreaminaTaskRecovering,
          };
          _0x5d4367.push(_0xce1377);
          return;
        }
        if (isAsyncResumeCandidateNode(_0x80fade)) {
          _0x5d4367.push({
            ..._0x55ed95,
            kind: 'async',
            nodeType: String(_0x80fade.type || '')
              .trim()
              .toLowerCase(),
            asyncTaskProvider: inferAsyncProviderByModel(
              _0x80fade.model,
              _0x80fade.asyncTaskProvider || _0x80fade.provider || '',
            ),
            asyncTaskKind: String(_0x80fade.asyncTaskKind || '').trim() || 'image',
            asyncTaskId: String(_0x80fade.asyncTaskId || '').trim(),
            asyncTaskStatus: String(_0x80fade.asyncTaskStatus || '').trim(),
            asyncTaskStartedAt: Number(_0x80fade.asyncTaskStartedAt || 0),
            asyncTaskRecovering: !!_0x80fade.asyncTaskRecovering,
          });
          return;
        }
        if (!isRunningHubResumeCandidateNode(_0x80fade)) return;
        _0x5d4367.push({
          ..._0x55ed95,
          kind: 'runninghub',
          nodeType: String(_0x80fade.type || '')
            .trim()
            .toLowerCase(),
          rhTaskId: String(_0x80fade.rhTaskId || '').trim(),
          rhTaskStatus: String(_0x80fade.rhTaskStatus || '').trim(),
          rhTaskStartedAt: Number(_0x80fade.rhTaskStartedAt || 0),
          rhTaskRecovering: !!_0x80fade.rhTaskRecovering,
          rhTaskUseOpenapiQuery: _0x80fade.rhTaskUseOpenapiQuery === true,
        });
      });
    }),
    {
      projectId: _0xb19a28 || 'default_v2_project',
      projectName: _0x136e9b || getUntitledProjectName(),
      timestamp: Date.now(),
      items: _0x5d4367,
    }
  );
}
function writeDreaminaResumeBackupSync(_0x5e08fa) {
  try {
    const _0x438d2c = buildDreaminaResumeBackupPayload(_0x5e08fa);
    if (!Array.isArray(_0x438d2c.items) || _0x438d2c.items.length === 0) {
      window.localStorage?.removeItem(DREAMINA_RESUME_BACKUP_KEY);
      return;
    }
    window.localStorage?.setItem(DREAMINA_RESUME_BACKUP_KEY, JSON.stringify(_0x438d2c));
  } catch (_0xadbe9) {
    console.warn('[projectLifecycle] 写入即梦恢复兜底失败:', _0xadbe9);
  }
}
function readDreaminaResumeBackupSync() {
  try {
    const _0x832637 = window.localStorage?.getItem(DREAMINA_RESUME_BACKUP_KEY);
    if (!_0x832637) return null;
    const _0xd064df = JSON.parse(_0x832637);
    if (!_0xd064df || typeof _0xd064df !== 'object') return null;
    if (!Array.isArray(_0xd064df.items) || _0xd064df.items.length === 0) return null;
    return _0xd064df;
  } catch (_0x1597af) {
    return (console.warn('[projectLifecycle] 读取即梦恢复兜底失败:', _0x1597af), null);
  }
}
function mergeDreaminaResumeBackupIntoMultiData(_0x5132ae, _0x5847d6, _0x3bf050) {
  if (!_0x5847d6 || typeof _0x5847d6 !== 'object') return _0x5132ae;
  if (String(_0x5847d6.projectId || '') !== String(_0x3bf050 || '')) return _0x5132ae;
  const _0x2f9892 = Array.isArray(_0x5847d6.items) ? _0x5847d6.items : [];
  if (_0x2f9892.length === 0) return _0x5132ae;
  const _0x239d7f = {
      ...(_0x5132ae || {}),
      canvases: Array.isArray(_0x5132ae?.canvases)
        ? _0x5132ae.canvases.map((_0x596b89) => ({
            ..._0x596b89,
            nodes: Array.isArray(_0x596b89?.nodes)
              ? _0x596b89.nodes.map((_0x4d6c2c) => ({ ..._0x4d6c2c }))
              : [],
          }))
        : [],
    },
    _0x58147a = new Map();
  return (
    _0x2f9892.forEach((_0x44faae) => {
      const _0x109e1e = String(_0x44faae?.canvasId || '').trim(),
        _0x427286 = String(_0x44faae?.nodeId || '').trim();
      if (!_0x109e1e || !_0x427286) return;
      _0x58147a.set(_0x109e1e + '::' + _0x427286, _0x44faae);
    }),
    _0x239d7f.canvases.forEach((_0x1c331f) => {
      const _0x206c86 = String(_0x1c331f?.id || '').trim();
      if (!_0x206c86 || !Array.isArray(_0x1c331f.nodes)) return;
      _0x1c331f.nodes = _0x1c331f.nodes.map((_0x4a1347) => {
        const _0x3d6585 = String(_0x4a1347?.id || '').trim(),
          _0x384566 = _0x58147a.get(_0x206c86 + '::' + _0x3d6585);
        if (!_0x384566) return _0x4a1347;
        if (
          String(_0x384566?.kind || '')
            .trim()
            .toLowerCase() === 'dreamina'
        ) {
          if (hasDreaminaResultError(_0x4a1347)) return _0x4a1347;
          const _0x34bcfa = String(_0x4a1347?.jobStatus || '')
            .trim()
            .toLowerCase();
          if (_0x34bcfa === 'error' || _0x34bcfa === 'failed') return _0x4a1347;
          const _0x14b950 = {};
          for (const _0x528417 of DREAMINA_RESUME_BACKUP_FIELDS) {
            Object.hasOwn(_0x384566, _0x528417) && (_0x14b950[_0x528417] = _0x384566[_0x528417]);
          }
          const _0x599e69 =
            Object.hasOwn(_0x384566, 'dreaminaTaskLastRaw') &&
            _0x384566.dreaminaTaskLastRaw &&
            typeof _0x384566.dreaminaTaskLastRaw === 'object' &&
            !Array.isArray(_0x384566.dreaminaTaskLastRaw)
              ? _0x384566.dreaminaTaskLastRaw
              : null;
          return {
            ..._0x4a1347,
            generationStartTime:
              Number(_0x14b950.generationStartTime) > 0
                ? Number(_0x14b950.generationStartTime)
                : Number(_0x4a1347?.generationStartTime || 0),
            generationDuration: null,
            dreaminaSubmitId: String(_0x14b950.dreaminaSubmitId || '').trim(),
            dreaminaTaskStatus: String(_0x14b950.dreaminaTaskStatus || '').trim(),
            dreaminaTaskPhase: String(_0x14b950.dreaminaTaskPhase || '').trim(),
            dreaminaTaskLabel: String(_0x14b950.dreaminaTaskLabel || '').trim(),
            dreaminaTaskStartedAt: Number(_0x14b950.dreaminaTaskStartedAt || 0),
            dreaminaTaskLastCheckedAt: Number(_0x14b950.dreaminaTaskLastCheckedAt || 0),
            dreaminaTaskRecovering: true,
            dreaminaTaskLastRaw: _0x599e69 || {},
          };
        }
        if (
          String(_0x384566?.kind || '')
            .trim()
            .toLowerCase() !== 'runninghub'
        ) {
          if (
            String(_0x384566?.kind || '')
              .trim()
              .toLowerCase() !== 'async'
          )
            return _0x4a1347;
          const _0x16c083 = String(_0x384566?.nodeType || '')
              .trim()
              .toLowerCase(),
            _0x3a1b0a = String(_0x4a1347?.type || '')
              .trim()
              .toLowerCase();
          if (_0x16c083 && _0x3a1b0a && _0x16c083 !== _0x3a1b0a) return _0x4a1347;
          const _0x36951f = inferAsyncProviderByModel(
            _0x4a1347?.model,
            _0x384566.asyncTaskProvider || _0x4a1347?.asyncTaskProvider || _0x4a1347?.provider || '',
          );
          return {
            ..._0x4a1347,
            generationStartTime:
              Number(_0x384566.generationStartTime) > 0
                ? Number(_0x384566.generationStartTime)
                : Number(_0x4a1347?.generationStartTime || 0),
            generationDuration: null,
            asyncTaskProvider: _0x36951f,
            asyncTaskKind: String(_0x384566.asyncTaskKind || '').trim() || 'image',
            asyncTaskId: String(_0x384566.asyncTaskId || '').trim(),
            asyncTaskStatus: String(_0x384566.asyncTaskStatus || '').trim() || 'pending',
            asyncTaskStartedAt: Number(_0x384566.asyncTaskStartedAt || 0),
            asyncTaskRecovering: true,
          };
        }
        const _0x4cd725 = String(_0x384566?.nodeType || '')
            .trim()
            .toLowerCase(),
          _0x31ef8a = String(_0x4a1347?.type || '')
            .trim()
            .toLowerCase();
        if (_0x4cd725 && _0x31ef8a && _0x4cd725 !== _0x31ef8a) return _0x4a1347;
        return {
          ..._0x4a1347,
          generationStartTime:
            Number(_0x384566.generationStartTime) > 0
              ? Number(_0x384566.generationStartTime)
              : Number(_0x4a1347?.generationStartTime || 0),
          generationDuration: null,
          rhTaskId: String(_0x384566.rhTaskId || '').trim(),
          rhTaskStatus: String(_0x384566.rhTaskStatus || '').trim() || 'pending',
          rhTaskStartedAt: Number(_0x384566.rhTaskStartedAt || 0),
          rhTaskRecovering: true,
          rhTaskUseOpenapiQuery: _0x384566.rhTaskUseOpenapiQuery === true,
        };
      });
    }),
    _0x239d7f
  );
}
function buildCanvasRecordSignature(_0x851df9, _0x1790e6 = _0x851df9?._persistRevHint) {
  const _0x529d42 =
      _0x851df9?.visualSnapshot && typeof _0x851df9.visualSnapshot === 'object'
        ? {
            schemaVersion: Number(_0x851df9.visualSnapshot.schemaVersion) || 1,
            srcLength: String(_0x851df9.visualSnapshot.src || '').length,
            width: Number(_0x851df9.visualSnapshot.width) || 0,
            height: Number(_0x851df9.visualSnapshot.height) || 0,
            capturedAt: Number(_0x851df9.visualSnapshot.capturedAt) || 0,
            visibleNodeCount: Number(_0x851df9.visualSnapshot.visibleNodeCount) || 0,
            mediaNodeCount: Number(_0x851df9.visualSnapshot.mediaNodeCount) || 0,
            readyMediaNodeCount: Number(_0x851df9.visualSnapshot.readyMediaNodeCount) || 0,
          }
        : null,
    _0x1d4959 = Number.isFinite(_0x1790e6);
  if (_0x1d4959) {
    const _0x2abdf4 = _0x851df9?.viewport && typeof _0x851df9.viewport === 'object' ? _0x851df9.viewport : {};
    return createStableSignature({
      _persistRevHint: _0x1790e6,
      viewport: {
        x: Number.isFinite(_0x2abdf4?.x) ? _0x2abdf4.x : 0,
        y: Number.isFinite(_0x2abdf4?.y) ? _0x2abdf4.y : 0,
        zoom: Number.isFinite(_0x2abdf4?.zoom) ? _0x2abdf4.zoom : 1.1,
      },
      nodesLength: Array.isArray(_0x851df9?.nodes) ? _0x851df9.nodes.length : 0,
      edgesLength: Array.isArray(_0x851df9?.edges) ? _0x851df9.edges.length : 0,
      assetsLength: Array.isArray(_0x851df9?.assets) ? _0x851df9.assets.length : 0,
      visualSnapshot: _0x529d42,
    });
  }
  return createStableSignature({
    id: _0x851df9?.id ?? null,
    name: _0x851df9?.name ?? getUntitledCanvasName(),
    nodes: Array.isArray(_0x851df9?.nodes) ? _0x851df9.nodes : [],
    edges: Array.isArray(_0x851df9?.edges) ? _0x851df9.edges : [],
    viewport:
      _0x851df9?.viewport && typeof _0x851df9.viewport === 'object'
        ? _0x851df9.viewport
        : { x: 0, y: 0, zoom: 1.1 },
    assets: Array.isArray(_0x851df9?.assets) ? _0x851df9.assets : [],
    visualSnapshot: _0x529d42,
  });
}
export function buildWorkspaceShardRecords(_0x3d05ec) {
  const _0x528f9f = _0x3d05ec?.projectId || 'default_v2_project',
    _0x42d80e = _0x3d05ec?.projectName || getUntitledProjectName(),
    _0x526275 = Array.isArray(_0x3d05ec?.multiData?.canvases) ? _0x3d05ec.multiData.canvases : [],
    _0xbf1133 = _0x3d05ec?.multiData?.activeCanvasId || _0x526275[0]?.id || null,
    _0xeb08d = Date.now(),
    _0x5f2c59 = {
      cacheVersion: 2,
      projectId: _0x528f9f,
      projectName: _0x42d80e,
      activeCanvasId: _0xbf1133,
      canvasOrder: _0x526275.map((_0x3fa3da) => ({
        id: _0x3fa3da?.id ?? null,
        name: _0x3fa3da?.name ?? getUntitledCanvasName(),
      })),
      _timestamp: _0xeb08d,
    },
    _0x2110a4 = _0x526275.map((_0x12c3a2) => {
      const _0x5a38ac = {
          id: _0x12c3a2?.id ?? null,
          name: _0x12c3a2?.name ?? getUntitledCanvasName(),
          _persistRevHint: Number.isFinite(_0x12c3a2?._persistRevHint)
            ? _0x12c3a2._persistRevHint
            : undefined,
          nodes: Array.isArray(_0x12c3a2?.nodes) ? _0x12c3a2.nodes : [],
          edges: Array.isArray(_0x12c3a2?.edges) ? _0x12c3a2.edges : [],
          viewport:
            _0x12c3a2?.viewport && typeof _0x12c3a2.viewport === 'object'
              ? _0x12c3a2.viewport
              : { x: 0, y: 0, zoom: 1.1 },
          assets: Array.isArray(_0x12c3a2?.assets) ? _0x12c3a2.assets : [],
          visualSnapshot:
            _0x12c3a2?.visualSnapshot && typeof _0x12c3a2.visualSnapshot === 'object'
              ? _0x12c3a2.visualSnapshot
              : undefined,
          _timestamp: _0xeb08d,
        },
        _0x18069e = sanitizeSerializedCanvasData(_0x5a38ac),
        _0x338edc = Number.isFinite(_0x5a38ac._persistRevHint) ? _0x5a38ac._persistRevHint : undefined;
      return {
        key: buildWorkspaceCanvasKey(_0x5a38ac.id),
        record: _0x5a38ac,
        persistedRecord: _0x18069e,
        signature: buildCanvasRecordSignature(_0x18069e, _0x338edc),
      };
    });
  return {
    metaRecord: _0x5f2c59,
    metaSignature: createStableSignature({
      cacheVersion: _0x5f2c59.cacheVersion,
      projectId: _0x5f2c59.projectId,
      projectName: _0x5f2c59.projectName,
      activeCanvasId: _0x5f2c59.activeCanvasId,
      canvasOrder: _0x5f2c59.canvasOrder,
    }),
    canvasRecords: _0x2110a4,
  };
}
export function restoreWorkspacePayloadFromShardRecords(_0x3a0951, _0x443dc9) {
  if (!Array.isArray(_0x3a0951?.canvasOrder) || !_0x3a0951.canvasOrder.length || !Array.isArray(_0x443dc9) ||
      _0x443dc9.length !== _0x3a0951.canvasOrder.length ||
      typeof _0x3a0951.projectId !== 'string' || !_0x3a0951.projectId.trim()) return null;
  const seen = new Set();
  const _0x546dd9 = [];
  for (let index = 0; index < _0x3a0951.canvasOrder.length; index++) {
    const _0x434e61 = _0x3a0951.canvasOrder[index];
    const _0x7b049f = _0x434e61?.id;
    const _0x10352f = _0x443dc9[index];
    if (typeof _0x7b049f !== 'string' || !_0x7b049f.trim() || seen.has(_0x7b049f) ||
        !_0x10352f || typeof _0x10352f !== 'object' || Array.isArray(_0x10352f) ||
        _0x10352f.id !== _0x7b049f || !Array.isArray(_0x10352f.nodes) ||
        !Array.isArray(_0x10352f.edges) ||
        (_0x10352f.assets != null && !Array.isArray(_0x10352f.assets))) return null;
    seen.add(_0x7b049f);
    _0x546dd9.push({
      id: _0x7b049f,
      name: _0x434e61.name || _0x10352f.name || getUntitledCanvasName(),
      _persistRevHint: Number.isFinite(_0x10352f._persistRevHint) ? _0x10352f._persistRevHint : undefined,
      nodes: _0x10352f.nodes,
      edges: _0x10352f.edges,
      viewport: _0x10352f.viewport && typeof _0x10352f.viewport === 'object' && !Array.isArray(_0x10352f.viewport)
        ? _0x10352f.viewport : { x: 0, y: 0, zoom: 1.1 },
      assets: _0x10352f.assets || [],
      visualSnapshot: _0x10352f.visualSnapshot && typeof _0x10352f.visualSnapshot === 'object'
        ? _0x10352f.visualSnapshot : null,
    });
  }
  if (_0x3a0951.activeCanvasId && !seen.has(_0x3a0951.activeCanvasId)) return null;
  return {
    projectId: _0x3a0951.projectId,
    projectName: _0x3a0951.projectName || getUntitledProjectName(),
    multiData: { canvases: _0x546dd9, activeCanvasId: _0x3a0951.activeCanvasId || _0x546dd9[0]?.id || null },
  };
}
export function createProjectLifecycle({
  store: _0x41c41b,
  CanvasTabManager: _0x27ea37,
  project: _0x3e2003,
  loadCustomPresets: _0x4a3b4f,
  migrateLegacyThumbnailsInMultiData: _0x6a9c75,
  sanitizeMultiCanvasDataForPersistence: _0x2e2cee,
  commit: _0x396c67,
  patchStoreSourceNodeNamesFromFileName: _0xa666b2,
  applySourceNamesFromFileNameToCanvas: _0x96ea6f,
}) {
  let _0x366e9f = '',
    _0x494215 = '';
  const _0x2de4e9 = new Map();
  let _0x5c4fdb = new Set(),
    _0x3bb602 = false,
    _0x339a7d = null,
    _0x15799e = false,
    _0x1b2b29 = null,
    _0x3e7171 = 0,
    _0x526daf = null,
    _0x81e81a = null,
    _0x3d26b7 = '',
    _0x4dc4bb = '',
    _0x26f7e7 = 0,
    _0x11676e = false;
  let recoveryWriteWarningShown = false;
  function _0x1c0741() {
    ((_0x366e9f = ''), (_0x494215 = ''), _0x2de4e9.clear(), (_0x5c4fdb = new Set()), (_0x3bb602 = false));
  }
  function _0x5a04ac(_0xbdcea8) {
    const _0x1b9fe4 = {
        projectId: _0xbdcea8?.projectId || 'default_v2_project',
        projectName: _0xbdcea8?.projectName || getUntitledProjectName(),
        multiData: _0xbdcea8?.multiData || { canvases: [], activeCanvasId: null },
      },
      { metaSignature: _0x2080d3, canvasRecords: _0xc8e3de } = buildWorkspaceShardRecords(_0x1b9fe4);
    ((_0x366e9f = _0x1b9fe4.projectId),
      (_0x494215 = _0x2080d3),
      _0x2de4e9.clear(),
      (_0x5c4fdb = new Set()),
      _0xc8e3de.forEach(({ record: _0x201332, signature: _0x27bb44 }) => {
        if (!_0x201332?.id) return;
        (_0x2de4e9.set(_0x201332.id, _0x27bb44), _0x5c4fdb.add(_0x201332.id));
      }),
      (_0x3bb602 = true));
  }
  const _0x5da0cd = {
    dbName: 'TapNowV2Cache',
    storeName: 'workspace',
    version: 1,
    _dbPromise: null,
    async initDB() {
      if (this._dbPromise) return this._dbPromise;
      return (
        (this._dbPromise = new Promise((_0x1978d6, _0x3f9bca) => {
          const _0x4c2387 = indexedDB.open(this.dbName, this.version);
          ((_0x4c2387.onupgradeneeded = (_0x3a2f14) => {
            const _0x4133d6 = _0x3a2f14.target.result;
            !_0x4133d6.objectStoreNames.contains(this.storeName) &&
              _0x4133d6.createObjectStore(this.storeName);
          }),
            (_0x4c2387.onsuccess = (_0x24e955) => {
              const _0xb11cc0 = _0x24e955.target.result;
              ((_0xb11cc0.onversionchange = () => {
                (_0xb11cc0.close(), (this._dbPromise = null));
              }),
                _0x1978d6(_0xb11cc0));
            }),
            (_0x4c2387.onerror = (_0x2265a0) => {
              ((this._dbPromise = null), _0x3f9bca(_0x2265a0.target.error));
            }));
        })),
        this._dbPromise
      );
    },
    async getRecord(_0x45659b) {
      const _0xf5db4e = await this.initDB();
      return new Promise((_0x48e7e7, _0x1f4047) => {
        const _0x3c42ae = _0xf5db4e.transaction(this.storeName, 'readonly'),
          _0x4a1a7a = _0x3c42ae.objectStore(this.storeName),
          _0x4a0b6d = _0x4a1a7a.get(_0x45659b);
        ((_0x4a0b6d.onsuccess = (_0x5814eb) => _0x48e7e7(_0x5814eb.target.result ?? null)),
          (_0x4a0b6d.onerror = (_0x326e22) => _0x1f4047(_0x326e22.target.error)));
      });
    },
    async getRecords(_0x30d591) {
      const _0x29e827 = await this.initDB();
      return new Promise((_0x14fecd, _0x3a96f9) => {
        const _0x5cdd07 = _0x29e827.transaction(this.storeName, 'readonly'),
          _0x147eaf = _0x5cdd07.objectStore(this.storeName),
          _0x5f22e5 = _0x30d591.map(
            (_0x1e0a21) =>
              new Promise((_0x3b061b, _0xa8856f) => {
                const _0xf54930 = _0x147eaf.get(_0x1e0a21);
                ((_0xf54930.onsuccess = (_0x34cd0b) => _0x3b061b(_0x34cd0b.target.result ?? null)),
                  (_0xf54930.onerror = (_0x3ab428) => _0xa8856f(_0x3ab428.target.error)));
              }),
          );
        Promise.all(_0x5f22e5).then(_0x14fecd).catch(_0x3a96f9);
      });
    },
    async listKeys() {
      const _0x1da75c = await this.initDB();
      return new Promise((_0x1900cc, _0x2fbe14) => {
        const _0x5a7fa9 = _0x1da75c.transaction(this.storeName, 'readonly'),
          _0x21673a = _0x5a7fa9.objectStore(this.storeName),
          _0x4ec587 = _0x21673a.getAllKeys();
        ((_0x4ec587.onsuccess = (_0x2ab0aa) => _0x1900cc(_0x2ab0aa.target.result || [])),
          (_0x4ec587.onerror = (_0x396f6f) => _0x2fbe14(_0x396f6f.target.error)));
      });
    },
    async save(_0x154a93) {
      try {
        const _0x14b352 = {
            projectId: _0x154a93?.projectId || 'default_v2_project',
            projectName: _0x154a93?.projectName || getUntitledProjectName(),
            multiData: _0x154a93?.multiData || { canvases: [], activeCanvasId: null },
          },
          {
            metaRecord: _0x5a33ed,
            metaSignature: _0x125315,
            canvasRecords: _0x3955f7,
          } = buildWorkspaceShardRecords(_0x14b352),
          _0x4fae49 = await this.initDB(),
          _0x333827 = _0x3955f7
            .map(({ record: _0x26ad27 }) => String(_0x26ad27?.id || '').trim())
            .filter(Boolean),
          _0x5066b3 = new Set(_0x333827),
          _0x5d82fc = new Set(_0x333827.map((_0x2efcf6) => buildWorkspaceCanvasKey(_0x2efcf6))),
          _0x5ca20e = _0x366e9f !== _0x14b352.projectId,
          _0xdb64dc = _0x5ca20e || !_0x3bb602 || (_0x5c4fdb.size === 0 && _0x3955f7.length > 0);
        let _0x3e7d7e = [];
        if (_0x5ca20e) _0xdb64dc && (await this.listKeys());
        else {
          if (_0x3bb602)
            _0x3e7d7e = Array.from(_0x5c4fdb)
              .filter((_0x11e979) => !_0x5066b3.has(_0x11e979))
              .map((_0x5c58b9) => buildWorkspaceCanvasKey(_0x5c58b9));
          else {
            if (_0xdb64dc) {
              const _0x157830 = await this.listKeys(),
                _0x4fa5b1 = _0x157830.filter((_0x1e738e) =>
                  String(_0x1e738e).startsWith(WORKSPACE_CANVAS_KEY_PREFIX),
                );
              _0x3e7d7e = _0x4fa5b1.filter((_0x57cff9) => !_0x5d82fc.has(_0x57cff9));
            }
          }
        }
        const _0x25d2e4 = _0x3955f7.filter(
            ({ record: _0x4f1669, signature: _0x15ff4f }) =>
              _0x5ca20e || _0x2de4e9.get(_0x4f1669.id) !== _0x15ff4f,
          ),
          _0x57f3ed = _0x5ca20e || _0x494215 !== _0x125315;
        if (!_0x57f3ed && _0x25d2e4.length === 0 && _0x3e7d7e.length === 0) return;
        return new Promise((_0x5c9115, _0x3a76cb) => {
          const _0x43e55b = _0x4fae49.transaction(this.storeName, 'readwrite'),
            _0xa502da = _0x43e55b.objectStore(this.storeName);
          (_0x57f3ed && _0xa502da.put(_0x5a33ed, WORKSPACE_META_KEY),
            _0x25d2e4.forEach(({ key: _0x438e44, persistedRecord: _0x6ee538 }) => {
              _0xa502da.put(_0x6ee538, _0x438e44);
            }),
            _0x3e7d7e.forEach((_0x3a99bf) => {
              _0xa502da.delete(_0x3a99bf);
            }),
            (_0x43e55b.oncomplete = () => {
              ((_0x366e9f = _0x14b352.projectId), (_0x494215 = _0x125315));
              const _0x304c04 = new Map();
              (_0x3955f7.forEach(({ record: _0x299e9c, signature: _0x4710e5 }) => {
                if (!_0x299e9c?.id) return;
                _0x304c04.set(_0x299e9c.id, _0x4710e5);
              }),
                _0x2de4e9.clear(),
                (_0x5c4fdb = new Set()),
                _0x304c04.forEach((_0x289fb7, _0x31544f) => {
                  (_0x2de4e9.set(_0x31544f, _0x289fb7), _0x5c4fdb.add(_0x31544f));
                }),
                (_0x3bb602 = true),
                _0x5c9115());
            }),
            (_0x43e55b.onerror = (_0x10c33f) => _0x3a76cb(_0x10c33f.target.error)),
            (_0x43e55b.onabort = (_0x195909) => _0x3a76cb(_0x195909.target.error)));
        });
      } catch (_0xf5b23a) {
        console.warn('[V2LocalCache] Save failed:', _0xf5b23a);
      }
    },
    async load() {
      try {
        const _0x131856 = await this.getRecord(WORKSPACE_META_KEY);
        if (_0x131856 != null) {
          if (_0x131856.cacheVersion !== 2 || !Array.isArray(_0x131856.canvasOrder) ||
              !_0x131856.canvasOrder.length) throw unsafeRecoveryError();
          const _0x1ba857 = _0x131856.canvasOrder.map((_0xbd4788) => buildWorkspaceCanvasKey(_0xbd4788?.id)),
            _0x4ed259 = await this.getRecords(_0x1ba857),
            _0x2c1008 = restoreWorkspacePayloadFromShardRecords(_0x131856, _0x4ed259);
          if (!_0x2c1008?.multiData?.canvases?.length) throw unsafeRecoveryError();
          return (_0x5a04ac(_0x2c1008), _0x2c1008);
        }
        const _0x1c9f0c = await this.getRecord(LEGACY_WORKSPACE_KEY);
        if (_0x1c9f0c != null) {
          if (typeof _0x1c9f0c.projectId !== 'string' || !_0x1c9f0c.projectId.trim() ||
              !Array.isArray(_0x1c9f0c.multiData?.canvases) || !_0x1c9f0c.multiData.canvases.length ||
              _0x1c9f0c.multiData.canvases.some(canvas => canvas.nodes == null || canvas.edges == null))
            throw unsafeRecoveryError();
          requireProjectDocument(_0x1c9f0c.multiData);
          return (_0x1c0741(), _0x1c9f0c);
        }
        return (_0x1c0741(), null);
      } catch (_0x39aabd) {
        console.warn('[V2LocalCache] Load failed:', _0x39aabd);
        _0x1c0741();
        // A rejected IndexedDB read cannot prove the cache is absent; fail closed.
        throw unsafeRecoveryError();
      }
    },
    async clear() {
      try {
        const _0x242b88 = await this.initDB(),
          _0x554049 = await this.listKeys(),
          _0x144cac = _0x554049.filter((_0x55806f) => {
            const _0x2e1f97 = String(_0x55806f);
            return (
              _0x2e1f97 === LEGACY_WORKSPACE_KEY ||
              _0x2e1f97 === WORKSPACE_META_KEY ||
              _0x2e1f97.startsWith(WORKSPACE_CANVAS_KEY_PREFIX)
            );
          });
        return new Promise((_0x12f24b, _0x30b2e7) => {
          const _0x2e9b45 = _0x242b88.transaction(this.storeName, 'readwrite'),
            _0x23a06b = _0x2e9b45.objectStore(this.storeName);
          (_0x144cac.forEach((_0x369eb1) => _0x23a06b.delete(_0x369eb1)),
            (_0x2e9b45.oncomplete = () => {
              (_0x1c0741(), _0x12f24b());
            }),
            (_0x2e9b45.onerror = (_0x112a8c) => _0x30b2e7(_0x112a8c.target.error)),
            (_0x2e9b45.onabort = (_0xad2e) => _0x30b2e7(_0xad2e.target.error)));
        });
      } catch (_0x46de4f) {
        console.warn('[V2LocalCache] Clear failed:', _0x46de4f);
      }
    },
  };
  window.V2LocalCache = _0x5da0cd;
  function _0x163715(_0x1fe85a) {
    if (typeof performance?.mark !== 'function') return;
    performance.mark(_0x1fe85a);
  }
  function _0x1fade4(_0x1f2ad2, _0xea51a1, _0x37059a) {
    if (typeof performance?.measure !== 'function') return;
    try {
      performance.measure(_0x1f2ad2, _0xea51a1, _0x37059a);
    } catch {}
  }
  function _0x206ba4() {
    if (window.__perfDebug !== true) return;
    if (typeof performance?.getEntriesByName !== 'function') return;
    BOOT_PERF_MEASURE_NAMES.forEach((_0x43f2c6) => {
      const _0x109349 = performance.getEntriesByName(_0x43f2c6),
        _0x2baadb = _0x109349[_0x109349.length - 1];
      if (!_0x2baadb) return;
      console.log('[perf] ' + _0x43f2c6 + ': ' + _0x2baadb.duration.toFixed(1) + 'ms');
    });
  }
  function _0x1e7df9({ projectId: _0x1b5fc8, projectName: _0x365d08, multiData: _0x6f9df8 }) {
    return { projectId: _0x1b5fc8, projectName: _0x365d08, multiData: _0x6f9df8 || {} };
  }
  function _0x1108f6({ projectId: _0x15df6f, projectName: _0x57a20f, multiData: _0x42a616 }) {
    const _0x146c70 = _0x1e7df9({ projectId: _0x15df6f, projectName: _0x57a20f, multiData: _0x42a616 });
    return (writeDreaminaResumeBackupSync(_0x146c70), _0x5da0cd.save(_0x146c70));
  }
  function _0x50b40f(_0x38a0c5, { sanitizeForPersistence: sanitizeForPersistence = false } = {}) {
    if (!_0x38a0c5) return null;
    if (typeof _0x38a0c5.getMultiDataSnapshot === 'function')
      return _0x38a0c5.getMultiDataSnapshot({ sanitizeForPersistence: sanitizeForPersistence });
    if (typeof _0x38a0c5.getMultiData === 'function') return _0x38a0c5.getMultiData();
    return null;
  }
  function _0x305cca() {
    return document.getElementById('projectNameText')?.textContent || getUntitledProjectName();
  }
  function _0x459735() {
    const _0x9a0b7e = window.electronAPI?.project;
    return _0x9a0b7e && typeof _0x9a0b7e === 'object' ? _0x9a0b7e : null;
  }
  function _0x5bd50d() {
    const _0xcd7060 = Number(window._v2CurrentProjectLastModified || 0);
    return Number.isFinite(_0xcd7060) && _0xcd7060 > 0 ? Math.round(_0xcd7060) : 0;
  }
  function _0x13f488() {
    return {
      projectId: window.currentProjectId || 'default_v2_project',
      projectName: _0x305cca(),
      filename: window._v2CurrentFile || '',
      recentId: window._v2CurrentRecentProjectId || '',
      displayPath: window._v2CurrentProjectDisplayPath || '',
      lastKnownProjectLastModified: _0x5bd50d(),
    };
  }
  function _0x4ea40c() {
    return _0x27ea37?.hasDirtyCanvases?.() === true;
  }
  async function _0x3096d3(_0x313b21 = 'auto') {
    const _0x264f2c = _0x459735();
    if (typeof _0x264f2c?.writeRecoverySnapshot !== 'function')
      return { success: false, reason: 'api-unavailable' };
    if (typeof _0x264f2c.writeRecoverySnapshotIfCompatible !== 'function') {
      if (!recoveryWriteWarningShown) {
        recoveryWriteWarningShown = true;
        window.showToast?.(t('projectLifecycle.recoverySnapshotUpgradeRequired'), 'warning');
      }
      return { success: false, code: 'RECOVERY_SNAPSHOT_PROTECTED', reason: 'guard-unavailable' };
    }
    if (!_0x4ea40c()) return { success: false, reason: 'clean' };
    const _0x124465 = _0x50b40f(_0x27ea37, { sanitizeForPersistence: true });
    if (!_0x124465?.canvases?.length) return { success: false, reason: 'empty-canvas' };
    const _0x2cda12 = _0x13f488(),
      _0xd7e948 = createStableSignature({ ..._0x2cda12, multiData: _0x124465 }),
      _0x114f51 = Date.now();
    if (_0xd7e948 && _0xd7e948 === _0x4dc4bb && _0x114f51 - _0x26f7e7 < RECOVERY_SNAPSHOT_DEDUPE_MS)
      return { success: true, deduped: true };
    if (_0x81e81a && _0x3d26b7 === _0xd7e948) return _0x81e81a;
    if (_0x81e81a) return _0x81e81a.catch(() => null).then(() => _0x3096d3(_0x313b21));
    return (
      (_0x81e81a = _0x264f2c
        .writeRecoverySnapshotIfCompatible({ ..._0x2cda12, reason: _0x313b21, multiData: _0x124465 })
        .then((_0x37cbb8) => {
          if (_0x37cbb8?.code === 'RECOVERY_SNAPSHOT_PROTECTED' && !recoveryWriteWarningShown) {
            recoveryWriteWarningShown = true;
            window.showToast?.(t('projectLifecycle.recoverySnapshotProtected'), 'warning');
          }
          return (
            _0x37cbb8?.success !== false && ((_0x4dc4bb = _0xd7e948), (_0x26f7e7 = Date.now())),
            _0x37cbb8
          );
        })
        .finally(() => {
          ((_0x81e81a = null), (_0x3d26b7 = ''));
        })),
      (_0x3d26b7 = _0xd7e948),
      _0x81e81a
    );
  }
  function _0x2a9bf5(_0x13746a = 'dirty-state') {
    const _0x19a4a7 = _0x459735();
    if (typeof _0x19a4a7?.writeRecoverySnapshot !== 'function') return;
    (_0x526daf !== null && clearTimeout(_0x526daf),
      (_0x526daf = setTimeout(() => {
        ((_0x526daf = null),
          void _0x3096d3(_0x13746a).catch((_0x1796e4) => {
            console.warn('[projectLifecycle] 写入恢复快照失败:', _0x1796e4);
          }));
      }, 0x4b0)));
  }
  function _0x11f077() {
    if (_0x526daf === null) return;
    (clearTimeout(_0x526daf), (_0x526daf = null));
  }
  function _0x30069b({ writeRecovery: writeRecovery = false, reason: reason = 'dirty-state' } = {}) {
    const _0x5bbe81 = _0x459735(),
      _0x390e09 = _0x4ea40c();
    typeof _0x5bbe81?.setUnsavedState === 'function' &&
      _0x5bbe81.setUnsavedState({ hasUnsavedChanges: _0x390e09, projectName: _0x305cca() });
    if (_0x390e09 && writeRecovery) {
      _0x2a9bf5(reason);
      return;
    }
    !_0x390e09 && _0x11f077();
  }
  async function _0x178e0c() {
    const _0x2fabd1 = _0x459735();
    if (
      typeof _0x2fabd1?.getRecoverySnapshotInfo !== 'function' ||
      typeof _0x2fabd1?.readRecoverySnapshot !== 'function'
    )
      return null;
    try {
      const _0x4d2a90 = await _0x2fabd1.getRecoverySnapshotInfo(_0x13f488());
      if (_0x4d2a90?.invalid || _0x4d2a90?.error ||
          typeof _0x4d2a90?.exists !== 'boolean') throw unsafeRecoveryError();
      if (!_0x4d2a90?.exists) return null;
      if (_0x4d2a90.isNewerThanProject !== true) return null; // Never auto-delete an older recovery file.
      const _0x5b9568 = await _0x2fabd1.readRecoverySnapshot();
      if (!_0x5b9568?.success) throw unsafeRecoveryError();
      const verifiedData = requireProjectDocument(_0x5b9568.data);
      if (Array.isArray(verifiedData.canvases) && verifiedData.canvases.length === 0) throw unsafeRecoveryError();
      return {
        projectId: _0x5b9568.projectId || window.currentProjectId || 'default_v2_project',
        projectName: _0x5b9568.projectName || getUntitledProjectName(),
        multiData: _0x3e2003.resolveCanvasData(verifiedData),
        recovery: true,
        filename: _0x5b9568.filename || '',
        recentId: _0x5b9568.recentId || '',
        displayPath: _0x5b9568.displayPath || '',
        lastModified: Number(_0x5b9568.lastModified || 0) || 0,
      };
    } catch (_0x3de964) {
      console.warn('[projectLifecycle] 读取恢复快照失败:', _0x3de964);
      throw unsafeRecoveryError();
    }
  }
  function _0x129e15(_0x41cf4e) {
    if (!_0x41cf4e?.recovery) return;
    ((window._v2CurrentFile = _0x41cf4e.filename || ''),
      (window._v2CurrentRecentProjectId = _0x41cf4e.recentId || ''),
      (window._v2CurrentProjectDisplayPath = _0x41cf4e.displayPath || ''),
      (window._v2CurrentProjectLastModified = Number(_0x41cf4e.lastModified || 0) || 0));
  }
  function _0x267339() {
    if (_0x11676e) return;
    ((_0x11676e = true),
      (window.__aiCanvasWriteRecoverySnapshotForClose = (_0x59402e = 'window-close') => _0x3096d3(_0x59402e)),
      window.addEventListener('aicanvas:dirty-state-changed', () => {
        _0x30069b({ writeRecovery: true, reason: 'dirty-state' });
      }));
  }
  function _0x24bed5() {
    if (_0x339a7d) return ((_0x15799e = true), _0x339a7d);
    const _0x2fa11c = async () => {
      const _0x3967ac = _0x50b40f(_0x27ea37, { sanitizeForPersistence: true }),
        _0x52b789 = window.currentProjectId,
        _0x4ebcd6 = _0x305cca();
      if (!_0x3967ac?.canvases?.length) return;
      await _0x1108f6({ projectId: _0x52b789, projectName: _0x4ebcd6, multiData: _0x3967ac });
    };
    return (
      (_0x339a7d = (async () => {
        try {
          do {
            ((_0x15799e = false), await _0x2fa11c());
          } while (_0x15799e);
        } finally {
          _0x339a7d = null;
        }
      })()),
      _0x339a7d
    );
  }
  function _0x2a60e5(_0x11206f) {
    return _0x2e2cee(_0x11206f || {});
  }
  function _0x2a26e0(_0x942bd5, { timeout: timeout = 0x5dc } = {}) {
    if (typeof _0x942bd5 !== 'function') return;
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(
        () => {
          void _0x942bd5();
        },
        { timeout: timeout },
      );
      return;
    }
    setTimeout(() => {
      void _0x942bd5();
    }, 0);
  }
  function _0x4ef9f7() {
    return new Promise((_0x24e0fd) => setTimeout(_0x24e0fd, 0));
  }
  function _0xa6188c({
    wrapEl: _0x1e74c4,
    canvasEl: _0x2a880f,
    animate: animate = false,
    afterHidden: _0x202d20,
  } = {}) {
    const _0x459e08 = () => {
      if (_0x2a880f) _0x2a880f.style.transition = '';
      _0x1e74c4 &&
        ((_0x1e74c4.style.transition = animate ? 'opacity 0.2s ease-in-out' : ''),
        (_0x1e74c4.style.opacity = '1'));
      const _0x246d5a = document.getElementById('v2-initial-loader');
      _0x246d5a &&
        ((_0x246d5a.style.opacity = '0'),
        (_0x246d5a.style.visibility = 'hidden'),
        setTimeout(() => _0x246d5a.remove(), 0x190));
      if (window.hideGlobalLoading) window.hideGlobalLoading();
      (_0x163715('loader hidden:end'), _0x1fade4('loader hidden', 'initApp:start', 'loader hidden:end'));
      if (typeof _0x202d20 === 'function') _0x202d20();
      _0x206ba4();
    };
    if (animate) {
      setTimeout(_0x459e08, 80);
      return;
    }
    _0x459e08();
  }
  function _0x46f00e(_0x29fea6) {
    _0x2a26e0(_0x29fea6, { timeout: 0x5dc });
  }
  function _0x20e1a7({ projectId: _0x5263aa, projectName: _0x4cabcf, multiData: _0x1c6c45 }) {
    if (!_0x1c6c45?.canvases?.length) return;
    _0x46f00e(async () => {
      try {
        const { changed: _0x9c43ee, multiData: _0x326634 } = await _0x6a9c75(_0x1c6c45);
        if (!_0x9c43ee) return;
        await _0x1108f6({ projectId: _0x5263aa, projectName: _0x4cabcf, multiData: _0x326634 });
      } catch (_0xe2f043) {
        console.warn('[main] 缩略图迁移失败', _0xe2f043);
      }
    });
  }
  function _0x37b943(_0x4d9c5a) {
    const _0x2c1b61 = String(_0x4d9c5a || '').trim();
    return /^https?:\/\//i.test(_0x2c1b61) || _0x2c1b61.startsWith('//');
  }
  function _0x147b20(_0x5325fa) {
    const _0x5e687c = [];
    for (const _0x2222c8 of Object.values(_0x5325fa || {})) {
      if (!_0x2222c8 || _0x2222c8.type !== 'ai-image') continue;
      const _0x24563e = Array.isArray(_0x2222c8.images) ? _0x2222c8.images : [];
      for (let _0x2e2167 = 0; _0x2e2167 < _0x24563e.length; _0x2e2167 += 1) {
        const _0x55bf7a = _0x24563e[_0x2e2167] || {};
        if (String(_0x55bf7a.localPath || '').trim()) continue;
        const _0x28908c = String(
          _0x55bf7a.sourceUrl || _0x55bf7a.imageUrl || _0x55bf7a.thumbUrl || '',
        ).trim();
        if (!_0x28908c || !_0x37b943(_0x28908c)) continue;
        _0x5e687c.push({ nodeId: _0x2222c8.id, idx: _0x2e2167, remote: _0x28908c });
      }
      if (
        _0x24563e.length === 0 &&
        !String(_0x2222c8.localPath || '').trim() &&
        _0x37b943(_0x2222c8.thumbUrl || _0x2222c8.imageUrl || _0x2222c8.sourceUrl)
      ) {
        const _0x172f4d = String(
          _0x2222c8.sourceUrl || _0x2222c8.imageUrl || _0x2222c8.thumbUrl || '',
        ).trim();
        if (_0x172f4d) _0x5e687c.push({ nodeId: _0x2222c8.id, idx: -1, remote: _0x172f4d });
      }
    }
    return _0x5e687c;
  }
  function _0x252feb(_0x14b7ca, _0x5ad6ae) {
    if (!_0x14b7ca) return false;
    if (_0x5ad6ae.idx >= 0) {
      const _0xa0a7ca = Array.isArray(_0x14b7ca.images) ? _0x14b7ca.images : [],
        _0x5d0974 = _0xa0a7ca[_0x5ad6ae.idx];
      if (!_0x5d0974 || String(_0x5d0974.localPath || '').trim()) return false;
      const _0x61f024 = String(_0x5d0974.sourceUrl || _0x5d0974.imageUrl || _0x5d0974.thumbUrl || '').trim();
      return _0x61f024 === _0x5ad6ae.remote;
    }
    if (String(_0x14b7ca.localPath || '').trim()) return false;
    const _0x2cbac3 = String(_0x14b7ca.sourceUrl || _0x14b7ca.imageUrl || _0x14b7ca.thumbUrl || '').trim();
    return _0x2cbac3 === _0x5ad6ae.remote;
  }
  function _0x5797b3(_0x3d998a, _0x292895) {
    const _0x4e2059 =
        typeof _0x292895 === 'string'
          ? String(_0x292895 || '').trim()
          : String(_0x292895?.localUrl || _0x292895?.url || '').trim(),
      _0xa58154 =
        typeof _0x292895 === 'string'
          ? normalizeLocalPath(_0x292895)
          : pickResultLocalPath(_0x292895) || normalizeLocalPath(_0x4e2059);
    if (!_0xa58154) return false;
    const _0x3cf3cc =
        _0x292895 && typeof _0x292895 === 'object' ? buildImageNodeStorageFields(_0x292895) : {},
      _0x2d311e = buildCanvasLocalImageFields(
        _0x292895 && typeof _0x292895 === 'object' ? _0x292895 : { localPath: _0xa58154 },
      ),
      _0x40b372 = _0x41c41b.getStateRaw()?.nodes?.[_0x3d998a.nodeId];
    if (!_0x252feb(_0x40b372, _0x3d998a)) return false;
    const _0xa1690c = {};
    if (_0x3d998a.idx >= 0) {
      const _0xf5494e = Array.isArray(_0x40b372.images) ? _0x40b372.images.slice() : [];
      if (!_0xf5494e[_0x3d998a.idx]) return false;
      ((_0xf5494e[_0x3d998a.idx] = {
        ...(_0xf5494e[_0x3d998a.idx] || {}),
        ..._0x2d311e,
        ..._0x3cf3cc,
        originalWidth: Number(_0x292895?.originalWidth || 0) || _0xf5494e[_0x3d998a.idx]?.originalWidth,
        originalHeight: Number(_0x292895?.originalHeight || 0) || _0xf5494e[_0x3d998a.idx]?.originalHeight,
      }),
        (_0xa1690c.images = _0xf5494e),
        (_0x40b372.mainImageIndex || 0) === _0x3d998a.idx &&
          (Object.assign(_0xa1690c, _0x2d311e),
          Object.assign(_0xa1690c, _0x3cf3cc),
          (_0xa1690c.originalWidth = Number(_0x292895?.originalWidth || 0) || _0x40b372.originalWidth),
          (_0xa1690c.originalHeight = Number(_0x292895?.originalHeight || 0) || _0x40b372.originalHeight)));
    } else
      (Object.assign(_0xa1690c, _0x2d311e),
        Object.assign(_0xa1690c, _0x3cf3cc),
        (_0xa1690c.originalWidth = Number(_0x292895?.originalWidth || 0) || _0x40b372.originalWidth),
        (_0xa1690c.originalHeight = Number(_0x292895?.originalHeight || 0) || _0x40b372.originalHeight));
    if (Object.keys(_0xa1690c).length === 0) return false;
    return (_0x41c41b.updateNodeData(_0x3d998a.nodeId, _0xa1690c), true);
  }
  function _0x47c541(_0x206f8f) {
    return normalizeLocalPath(_0x206f8f?.originalLocalPath || _0x206f8f?.localPath);
  }
  function _0x279fdc(_0x32a294) {
    return {
      displayLocalPath: normalizeLocalPath(_0x32a294?.displayLocalPath),
      thumbLocalPath: normalizeLocalPath(_0x32a294?.thumbLocalPath),
    };
  }
  function _0x22d501(_0x214f42) {
    const _0x291beb = _0x47c541(_0x214f42);
    if (!_0x291beb) return false;
    const { displayLocalPath: _0x53e2de, thumbLocalPath: _0x394c8f } = _0x279fdc(_0x214f42),
      _0x3946e4 = !!_0x53e2de,
      _0x3bafce = !!_0x394c8f;
    return !(_0x3946e4 && _0x3bafce);
  }
  async function _0x16964f(_0x4f6621) {
    if (typeof _0x3e2003?.checkLocalMediaExists !== 'function') return false;
    const _0x22d850 = _0x47c541(_0x4f6621);
    if (!_0x22d850) return false;
    const { displayLocalPath: _0xeca110, thumbLocalPath: _0x374d14 } = _0x279fdc(_0x4f6621),
      _0x5570f6 = [_0xeca110, _0x374d14].filter(Boolean);
    if (_0x5570f6.length === 0) return false;
    for (const _0x308599 of _0x5570f6) {
      try {
        if (!(await _0x3e2003.checkLocalMediaExists(_0x308599))) return true;
      } catch {
        return true;
      }
    }
    return false;
  }
  async function _0x4be43d(_0x41fdaa) {
    if (_0x22d501(_0x41fdaa)) return true;
    return await _0x16964f(_0x41fdaa);
  }
  async function _0x3098b6(_0x449305) {
    const _0x5badc0 = [];
    for (const _0x3e1ace of Object.values(_0x449305 || {})) {
      if (!_0x3e1ace) continue;
      const _0x4e20a1 = String(_0x3e1ace.type || '').trim();
      if (_0x4e20a1 === 'source-image') {
        (await _0x4be43d(_0x3e1ace)) &&
          _0x5badc0.push({
            nodeId: _0x3e1ace.id,
            idx: -1,
            nodeType: _0x4e20a1,
            localPath: _0x47c541(_0x3e1ace),
          });
        continue;
      }
      if (_0x4e20a1 !== 'ai-image') continue;
      const _0x14c64b = Array.isArray(_0x3e1ace.images) ? _0x3e1ace.images : [];
      if (_0x14c64b.length > 0) {
        for (let _0xce9514 = 0; _0xce9514 < _0x14c64b.length; _0xce9514 += 1) {
          const _0x34157a = _0x14c64b[_0xce9514] || {};
          if (!(await _0x4be43d(_0x34157a))) continue;
          _0x5badc0.push({
            nodeId: _0x3e1ace.id,
            idx: _0xce9514,
            nodeType: _0x4e20a1,
            localPath: _0x47c541(_0x34157a),
          });
        }
        continue;
      }
      (await _0x4be43d(_0x3e1ace)) &&
        _0x5badc0.push({
          nodeId: _0x3e1ace.id,
          idx: -1,
          nodeType: _0x4e20a1,
          localPath: _0x47c541(_0x3e1ace),
        });
    }
    return _0x5badc0;
  }
  function _0x197ca7(_0x4fccb9, _0x2341d7) {
    if (!_0x4fccb9) return false;
    if (_0x2341d7.idx >= 0) {
      const _0x135ff9 = Array.isArray(_0x4fccb9.images) ? _0x4fccb9.images : [],
        _0x9ebb5f = _0x135ff9[_0x2341d7.idx];
      if (!_0x9ebb5f) return false;
      return _0x47c541(_0x9ebb5f) === _0x2341d7.localPath;
    }
    return _0x47c541(_0x4fccb9) === _0x2341d7.localPath;
  }
  function _0x5438a2(_0x186c0e, _0x5cec0f) {
    const _0x4b30f1 = buildImageNodeStorageFields(_0x5cec0f);
    if (!_0x4b30f1.displayLocalPath && !_0x4b30f1.thumbLocalPath) return false;
    const _0x904a38 = _0x41c41b.getStateRaw()?.nodes?.[_0x186c0e.nodeId];
    if (!_0x197ca7(_0x904a38, _0x186c0e)) return false;
    const _0x3a1312 = {};
    if (_0x186c0e.idx >= 0) {
      const _0x143d2a = Array.isArray(_0x904a38.images) ? _0x904a38.images.slice() : [];
      if (!_0x143d2a[_0x186c0e.idx]) return false;
      ((_0x143d2a[_0x186c0e.idx] = {
        ...(_0x143d2a[_0x186c0e.idx] || {}),
        ..._0x4b30f1,
        originalWidth: Number(_0x5cec0f?.originalWidth || 0) || _0x143d2a[_0x186c0e.idx]?.originalWidth,
        originalHeight: Number(_0x5cec0f?.originalHeight || 0) || _0x143d2a[_0x186c0e.idx]?.originalHeight,
      }),
        (_0x3a1312.images = _0x143d2a),
        (_0x904a38.mainImageIndex || 0) === _0x186c0e.idx &&
          Object.assign(_0x3a1312, {
            ..._0x4b30f1,
            originalWidth: Number(_0x5cec0f?.originalWidth || 0) || _0x904a38.originalWidth,
            originalHeight: Number(_0x5cec0f?.originalHeight || 0) || _0x904a38.originalHeight,
          }));
    } else
      Object.assign(_0x3a1312, {
        ..._0x4b30f1,
        originalWidth: Number(_0x5cec0f?.originalWidth || 0) || _0x904a38.originalWidth,
        originalHeight: Number(_0x5cec0f?.originalHeight || 0) || _0x904a38.originalHeight,
      });
    if (Object.keys(_0x3a1312).length === 0) return false;
    return (_0x41c41b.updateNodeData(_0x186c0e.nodeId, _0x3a1312), true);
  }
  async function _0x11e16b(_0x3cc1d3, _0xa8b5ff = 10) {
    if (
      typeof _0x3e2003?.saveRemoteImageLocallyDetailed !== 'function' &&
      typeof _0x3e2003?.saveRemoteImageLocally !== 'function'
    )
      return;
    if (!_0x3cc1d3 || window.currentProjectId !== _0x3cc1d3) return;
    const _0x328760 = _0x147b20(_0x41c41b.getStateRaw()?.nodes || {});
    if (_0x328760.length === 0) return;
    window.showToast?.(
      t('projectLifecycle.historicalAiLocalizationStarted', { count: _0x328760.length }),
      'info',
    );
    let _0x3df021 = 0;
    await _0x4ef9f7();
    for (let _0x3fb69f = 0; _0x3fb69f < _0x328760.length; _0x3fb69f += _0xa8b5ff) {
      if (window.currentProjectId !== _0x3cc1d3) return;
      const _0x2b893a = _0x328760.slice(_0x3fb69f, _0x3fb69f + _0xa8b5ff);
      for (const _0x58318d of _0x2b893a) {
        if (window.currentProjectId !== _0x3cc1d3) return;
        try {
          const _0x21249f =
            typeof _0x3e2003.saveRemoteImageLocallyDetailed === 'function'
              ? await _0x3e2003.saveRemoteImageLocallyDetailed(_0x58318d.remote, _0x3cc1d3)
              : await _0x3e2003.saveRemoteImageLocally(_0x58318d.remote, _0x3cc1d3);
          _0x5797b3(_0x58318d, _0x21249f) && (_0x3df021 += 1);
        } catch {}
      }
      _0x3fb69f + _0xa8b5ff < _0x328760.length && (await _0x4ef9f7());
    }
    if (window.currentProjectId !== _0x3cc1d3) return;
    _0x3df021 > 0 &&
      window.showToast?.(
        t('projectLifecycle.historicalAiLocalizationFixed', { count: _0x3df021 }),
        'success',
      );
  }
  async function _0x2e040a(_0x43a232, _0x147c1e = 10) {
    if (typeof _0x3e2003?.ensureLocalImageDerivatives !== 'function') return;
    if (!_0x43a232 || window.currentProjectId !== _0x43a232) return;
    const _0x31f6ee = await _0x3098b6(_0x41c41b.getStateRaw()?.nodes || {});
    if (_0x31f6ee.length === 0) return;
    let _0x3927bd = 0;
    await _0x4ef9f7();
    for (let _0x10c6fd = 0; _0x10c6fd < _0x31f6ee.length; _0x10c6fd += _0x147c1e) {
      if (window.currentProjectId !== _0x43a232) return;
      const _0x1a87e5 = _0x31f6ee.slice(_0x10c6fd, _0x10c6fd + _0x147c1e);
      for (const _0x1451ce of _0x1a87e5) {
        if (window.currentProjectId !== _0x43a232) return;
        try {
          const _0x36b595 = await _0x3e2003.ensureLocalImageDerivatives(_0x1451ce.localPath);
          _0x5438a2(_0x1451ce, _0x36b595) && (_0x3927bd += 1);
        } catch {}
      }
      _0x10c6fd + _0x147c1e < _0x31f6ee.length && (await _0x4ef9f7());
    }
    if (window.currentProjectId !== _0x43a232) return;
    _0x3927bd > 0 &&
      (window._triggerLocalCacheSave?.(),
      window.showToast?.(
        t('projectLifecycle.historicalImageDerivativesFixed', { count: _0x3927bd }),
        'success',
      ));
  }
  function _0x3a5a22(_0xef87dc, _0xb002f = 10) {
    if (!_0xef87dc) return;
    (_0x163715('historicalAiLocalization queued:end'),
      _0x1fade4('historicalAiLocalization queued', 'initApp:start', 'historicalAiLocalization queued:end'),
      _0x2a26e0(() => _0x11e16b(_0xef87dc, _0xb002f), { timeout: 0x9c4 }));
  }
  function _0x568118(_0x4bfdfc, _0x35f03f = 10) {
    if (!_0x4bfdfc) return;
    _0x2a26e0(() => _0x2e040a(_0x4bfdfc, _0x35f03f), { timeout: 0xc80 });
  }
  window._queueLegacyThumbnailMigration = _0x20e1a7;
  function _0x338316() {
    return _0x24bed5();
  }
  window._triggerLocalCacheSave = _0x338316;
  let _0x55355e = null,
    _0x12152d = null,
    _0x13a1c3 = false;
  function _0x22312a() {
    return (
      _0x12152d !== null && clearTimeout(_0x12152d),
      (_0x12152d = setTimeout(() => {
        ((_0x12152d = null), _0x338316());
      }, 150)),
      _0x12152d
    );
  }
  window._triggerLocalCacheMetaSave = _0x22312a;
  function _0x3f7f64({ pageLifecycle: pageLifecycle = false } = {}) {
    _0x55355e !== null && (clearTimeout(_0x55355e), (_0x55355e = null));
    _0x12152d !== null && (clearTimeout(_0x12152d), (_0x12152d = null));
    if (window._isAppLoaded !== true) return null;
    if (!pageLifecycle) return _0x338316();
    const _0x34ee76 = Date.now();
    if (_0x1b2b29) return _0x1b2b29;
    if (_0x3e7171 > 0 && _0x34ee76 - _0x3e7171 < PAGE_LIFECYCLE_FLUSH_DEDUPE_MS)
      return _0x339a7d || Promise.resolve(null);
    const _0x214c5f = _0x338316();
    if (!_0x214c5f || typeof _0x214c5f.finally !== 'function') return ((_0x3e7171 = Date.now()), _0x214c5f);
    return (
      (_0x1b2b29 = _0x214c5f),
      _0x214c5f.finally(() => {
        _0x1b2b29 === _0x214c5f && ((_0x3e7171 = Date.now()), (_0x1b2b29 = null));
      }),
      _0x214c5f
    );
  }
  function _0x3821fb() {
    if (_0x13a1c3) return;
    ((_0x13a1c3 = true), _0x267339());
    let _0x1b1cce = false;
    _0x41c41b.subscribeSelector(
      (_0x302545) => _0x302545._persistRev,
      () => {
        if (!_0x1b1cce) {
          _0x1b1cce = true;
          return;
        }
        if (window._isAppLoaded !== true) return;
        (_0x55355e !== null && clearTimeout(_0x55355e),
          (_0x55355e = setTimeout(() => {
            ((_0x55355e = null), _0x338316());
          }, 0x3e8)),
          _0x30069b({ writeRecovery: true, reason: 'persist-rev' }));
      },
    );
  }
  function _0x59cc5c() {
    return (
      _0x4ea40c() && void _0x3096d3('beforeunload').catch(() => {}),
      _0x3f7f64({ pageLifecycle: true })
    );
  }
  function _0x4e0ece() {
    return _0x3f7f64({ pageLifecycle: true });
  }
  function _0x3b30da() {
    if (document.visibilityState !== 'hidden') {
      _0x3e7171 = 0;
      return;
    }
    return _0x3f7f64({ pageLifecycle: true });
  }
  async function _0x453351() {
    const _0x53b260 = document.getElementById('v2-wrap'),
      _0x3be267 = document.getElementById('v2-canvas') || document.querySelector('.v2-canvas');
    try {
      (_0x163715('initApp:start'), _0x4a3b4f());
      const _0x474ce5 = readDreaminaResumeBackupSync(),
        _0x59ab35 = await _0x178e0c(),
        // Validate both persisted sources before a good snapshot can overwrite a damaged cache.
        _0x3bd8c5 = await _0x5da0cd.load(),
        _0x498899 = _0x59ab35 || _0x3bd8c5;
      if (
        _0x498899 &&
        _0x498899.multiData &&
        _0x498899.multiData.canvases &&
        _0x498899.multiData.canvases.length > 0
      ) {
        (_0x41c41b.updateViewport(0, 0, 1),
          _0x129e15(_0x498899),
          (window.currentProjectId = _0x498899.projectId || 'default_v2_project'));
        const _0x2935f5 = document.getElementById('projectNameText');
        _0x2935f5 && (_0x2935f5.textContent = _0x498899.projectName || getUntitledProjectName());
        const _0x4f9e4f = _0x3e2003.resolveCanvasData(
          mergeDreaminaResumeBackupIntoMultiData(
            _0x498899.multiData,
            _0x474ce5,
            _0x498899.projectId || window.currentProjectId,
          ),
        );
        _0x163715('buildHydrationSafeMultiData:start');
        const _0x4e5d50 = _0x2a60e5(_0x4f9e4f);
        (_0x163715('buildHydrationSafeMultiData:end'),
          _0x1fade4(
            'buildHydrationSafeMultiData',
            'buildHydrationSafeMultiData:start',
            'buildHydrationSafeMultiData:end',
          ),
          _0x163715('CanvasTabManager.init:start'),
          _0x27ea37.init(_0x4e5d50, { markClean: false }),
          _0x163715('CanvasTabManager.init:end'),
          _0x1fade4('CanvasTabManager.init', 'CanvasTabManager.init:start', 'CanvasTabManager.init:end'),
          _0x20e1a7({
            projectId: window.currentProjectId,
            projectName: _0x498899.projectName || getUntitledProjectName(),
            multiData: _0x4f9e4f,
          }),
          (window._isAppLoaded = true),
          _0x30069b({ writeRecovery: _0x498899.recovery === true, reason: 'startup' }),
          window._checkEmptyHint?.(),
          _0x396c67(),
          _0xa6188c({
            wrapEl: _0x53b260,
            canvasEl: _0x3be267,
            animate: false,
            afterHidden: () => {
              (_0x3a5a22(window.currentProjectId), _0x568118(window.currentProjectId));
            },
          }));
        return;
      }
      _0x3be267 && ((_0x3be267.style.transition = 'none'), void _0x3be267.offsetHeight);
      _0x41c41b.updateViewport(0, 0, 1);
      window.showGlobalLoading && window.showGlobalLoading(t('projectLifecycle.loadingWorkspaceFiles'));
      const _0x2e6f8c = window.currentProjectId || 'default_v2_project',
        _0x19bb36 = _0x2e6f8c === 'default_v2_project' &&
          !new URLSearchParams(window.location.search).get('id');
      let missingDefaultProject = false;
      ((window.currentProjectId = _0x2e6f8c), _0x163715('project.loadProject:start'));
      const _0xe76454 = await _0x3e2003.loadProject(_0x2e6f8c, {
          allowMissing: _0x19bb36,
          onMissing: () => { missingDefaultProject = true; },
        }),
        _0x5c7ab1 = mergeDreaminaResumeBackupIntoMultiData(_0xe76454, _0x474ce5, _0x2e6f8c);
      (_0x163715('project.loadProject:end'),
        _0x1fade4('project.loadProject', 'project.loadProject:start', 'project.loadProject:end'),
        _0x163715('buildHydrationSafeMultiData:start'));
      const _0x2a4332 = _0x2a60e5(_0x5c7ab1);
      (_0x163715('buildHydrationSafeMultiData:end'),
        _0x1fade4(
          'buildHydrationSafeMultiData',
          'buildHydrationSafeMultiData:start',
          'buildHydrationSafeMultiData:end',
        ),
        _0x163715('CanvasTabManager.init:start'),
        _0x27ea37.init(_0x2a4332),
        _0x163715('CanvasTabManager.init:end'),
        _0x1fade4('CanvasTabManager.init', 'CanvasTabManager.init:start', 'CanvasTabManager.init:end'),
        _0x20e1a7({
          projectId: _0x2e6f8c,
          projectName: document.getElementById('projectNameText')?.textContent || getDefaultCanvasName(),
          multiData: _0x5c7ab1,
        }),
        _0xa666b2(),
        (window._isAppLoaded = true),
        _0x30069b({ writeRecovery: false, reason: 'startup' }),
        window._checkEmptyHint?.());
      const _0x761d86 = document.getElementById('projectNameText');
      (_0x761d86 && (_0x761d86.textContent = getDefaultCanvasName()),
        _0xa6188c({
          wrapEl: _0x53b260,
          canvasEl: _0x3be267,
          animate: true,
          afterHidden: () => {
            (_0x3a5a22(_0x2e6f8c), _0x568118(_0x2e6f8c));
            if (missingDefaultProject) window.showToast?.(t('projectLifecycle.defaultProjectMissing'), 'warning');
          },
        }));
    } catch (_0x2c4c94) {
      // An unsuccessful read must not leave an old project ID attached to an empty store.
      (console.error('Failed to init app:', _0x2c4c94),
        (window._isAppLoaded = false),
        (window.currentProjectId = ''),
        (window._v2CurrentFile = ''),
        (window._v2CurrentRecentProjectId = ''),
        (window._v2CurrentProjectDisplayPath = ''),
        (window._v2CurrentProjectLastModified = 0),
        window.showToast?.(t(_0x2c4c94?.code === 'UNSAFE_PROJECT_RECOVERY'
          ? 'projectLifecycle.recoveryReadFailedNoSave' : 'projectLifecycle.projectLoadFailedNoSave'), 'error'),
        _0xa6188c({ wrapEl: _0x53b260, canvasEl: _0x3be267, animate: true }));
    }
  }
  function _0x1ea6bf(_0x5947bf) {
    const _0x20ba00 = _0x5947bf?.dataTransfer?.types;
    return !!_0x20ba00 && Array.from(_0x20ba00).includes('Files');
  }
  function _0x5a1039(_0x425245) {
    if (!_0x1ea6bf(_0x425245)) return false;
    _0x425245.preventDefault();
    if (_0x425245.dataTransfer) _0x425245.dataTransfer.dropEffect = 'copy';
    return true;
  }
  function _0x277560(_0x3b2d68) {
    _0x5a1039(_0x3b2d68);
  }
  function _0x3a4f4f(_0x35dd0e) {
    if (_0x5a1039(_0x35dd0e)) return;
    _0x35dd0e.preventDefault();
  }
  function _0x54d51a(_0x2caa1d) {
    _0x2caa1d.preventDefault();
    const _0x25fcbf = _0x2caa1d.dataTransfer.files[0];
    if (!_0x25fcbf) return;
    if (/\.aicpkg$/i.test(_0x25fcbf.name || '')) {
      const _0x2eb820 = window._v2ImportProjectPackageByPath;
      if (typeof _0x2eb820 !== 'function') {
        window.showToast?.(t('projectLifecycle.packageUnsupported'), 'error');
        return;
      }
      let _0x2192e5 = '';
      try {
        _0x2192e5 = String(window.electronAPI?.getPathForFile?.(_0x25fcbf) || '').trim();
      } catch {
        _0x2192e5 = '';
      }
      if (!_0x2192e5) {
        window.showToast?.(t('projectLifecycle.packagePathMissing'), 'error');
        return;
      }
      void _0x2eb820(_0x2192e5);
      return;
    }
    if (!_0x25fcbf.name.endsWith('.json')) return;
    const _0x257d6f = new FileReader();
    ((_0x257d6f.onload = (_0x389586) => {
      try {
        const _0x5c8d7f = requireProjectDocument(JSON.parse(_0x389586.target.result));
        if (Array.isArray(_0x5c8d7f.canvases) && !_0x5c8d7f.canvases.length) throw new Error('空画布存档不能覆盖当前工程');
        const _0x4602ef = _0x3e2003.resolveCanvasData(_0x5c8d7f),
          _0x281fdf = _0x2a60e5(_0x4602ef),
          _0x14ba42 =
            _0x281fdf.canvases.find((_0x316e8f) => _0x316e8f.id === _0x281fdf.activeCanvasId) ||
            _0x281fdf.canvases[0],
          _0xf8f3c5 = _0x25fcbf.name.replace('.json', ''),
          _0x44bf2e = _0x27ea37._canvases.find((_0x226d98) => _0x226d98.name === _0xf8f3c5);
        _0x44bf2e
          ? _0x27ea37.switchTo(_0x44bf2e.id)
          : (_0x27ea37.addCanvas(), _0x27ea37.renameCanvas(_0x27ea37._activeId, _0xf8f3c5));
        (_0x96ea6f(_0x14ba42),
          _0x27ea37.hydrateActiveCanvasSnapshot(_0x14ba42),
          _0x27ea37.markCanvasClean(_0x27ea37._activeId),
          _0x396c67());
        const _0x577eee = document.getElementById('projectNameText');
        if (_0x577eee) _0x577eee.textContent = _0xf8f3c5;
        (_0x27ea37.renderTabs(),
          (window._v2CurrentFile = _0x25fcbf.name),
          (window.currentProjectId = _0xf8f3c5),
          _0x20e1a7({ projectId: _0xf8f3c5, projectName: _0xf8f3c5, multiData: _0x4602ef }),
          _0x568118(_0xf8f3c5),
          window.showToast?.(t('projectLifecycle.localArchiveLoaded', { name: _0xf8f3c5 })));
      } catch (_0x13001e) {
        (console.error('[Drop] 读取本地 JSON 失败:', _0x13001e),
          window.showToast?.(t('projectLifecycle.jsonArchiveParseFailed'), 'error'));
      }
    }),
      (_0x257d6f.onerror = () => window.showToast?.(t('projectLifecycle.jsonArchiveParseFailed'), 'error')),
      _0x257d6f.readAsText(_0x25fcbf));
  }
  function _0x396a6a() {
    const _0x514144 = document.getElementById('projectNameText');
    if (!_0x514144) return;
    const _0x398a89 = async () => {
      if (!window.currentProjectId) return;
      const _0x2712ae = _0x514144.textContent.trim();
      if (!_0x2712ae) return;
      try {
        _0x27ea37._flushCurrentCanvas();
        const _0x5b6ced = _0x27ea37.getMultiData(),
          _0x91d683 = await _0x3e2003.saveProject(_0x2712ae, _0x5b6ced);
        (_0x91d683?.success && _0x27ea37.markAllCanvasesClean(), _0x338316());
      } catch (_0x50d6c6) {
        console.error('Failed to save project name:', _0x50d6c6);
      }
    };
    (_0x514144.addEventListener('blur', _0x398a89),
      _0x514144.addEventListener('keydown', (_0x359482) => {
        _0x359482.key === 'Enter' && (_0x359482.preventDefault(), _0x514144.blur());
      }));
  }
  function _0x415da6() {
    const _0x4e5880 = document.getElementById('logoLink');
    if (!_0x4e5880) return;
    _0x4e5880.addEventListener('click', async () => {
      (window.currentProjectId && (await window.ProjectManager.saveCurrentProject()),
        console.log('Gallery view disabled by user.'));
    });
  }
  return {
    V2LocalCache: _0x5da0cd,
    initApp: _0x453351,
    onBeforeUnload: _0x59cc5c,
    onPageHide: _0x4e0ece,
    onVisibilityChange: _0x3b30da,
    onDocumentDragEnter: _0x277560,
    onDocumentDragOver: _0x3a4f4f,
    onDocumentDrop: _0x54d51a,
    triggerLocalCacheSave: _0x338316,
    flushPendingLocalCacheSaveNow: _0x3f7f64,
    bindPersistRevisionAutoSave: _0x3821fb,
    bindHeaderProjectNameAutoSave: _0x396a6a,
    bindLogoProjectSave: _0x415da6,
  };
}
