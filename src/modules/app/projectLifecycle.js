import { sanitizeSerializedCanvasData } from '../../utils/thumbnailPersistence.js';
import { buildImageNodeStorageFields } from '../../services/imageDerivativeService.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import { createStableSignature } from '../../utils/stableSignature.js';
import { normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { requireProjectDocument } from '../../services/projectDocumentGuard.js';
import { isModelApiModel, isWorkflowModel, resolveModelProvider } from '../../manifests/index.js';
import { t } from '../../i18n/index.js';
import { rendererStartupState } from '../../services/rendererStartupState.js';
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
  PAGE_LIFECYCLE_FLUSH_DEDUPE_MS = 2000,
  RECOVERY_SNAPSHOT_DEDUPE_MS = 5000,
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
function buildWorkspaceCanvasKey(value) {
  return '' + WORKSPACE_CANVAS_KEY_PREFIX + String(value || '').trim();
}
function inferAsyncProviderByModel(item, key = '') {
  const modelProvider = resolveModelProvider(item, '', { allowProviderHint: false });
  if (modelProvider) return modelProvider;
  const result = String(key || '')
    .trim()
    .toLowerCase();
  if (result) return result;
  const list = String(item || '').trim();
  if (list && !list.includes('/')) return 'grsai';
  return 'grsai';
}
function isDreaminaResumeCandidateNode(enabled) {
  if (!enabled || typeof enabled !== 'object') return false;
  const data = String(enabled.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-image', 'source-video'].includes(data)) return false;
  const options = String(enabled.provider || '')
      .trim()
      .toLowerCase(),
    target = String(enabled.model || '').trim(),
    enabled2 = options === 'dreamina' || resolveModelProvider(target, options) === 'dreamina';
  if (!enabled2) return false;
  if (hasDreaminaResultError(enabled)) return false;
  const source = String(enabled.jobStatus || '')
    .trim()
    .toLowerCase();
  if (source === 'error' || source === 'failed') return false;
  if (String(enabled.jobError || '').trim()) return false;
  const enabled3 = String(enabled.dreaminaSubmitId || '').trim();
  if (!enabled3) return false;
  const next = String(enabled.dreaminaTaskPhase || '')
      .trim()
      .toLowerCase(),
    current = String(enabled.dreaminaTaskStatus || '')
      .trim()
      .toLowerCase();
  if (next === 'done' || next === 'failed') return false;
  if (current === 'failed') return false;
  return true;
}
function hasDreaminaUsableResult(entry) {
  const list2 = [entry?.images, entry?.videos].filter(Array.isArray);
  return list2.some((list3) =>
    list3.some((enabled4) => {
      if (!enabled4 || typeof enabled4 !== 'object') return false;
      return !!String(
        enabled4.localPath ||
          enabled4.originalLocalPath ||
          enabled4.displayLocalPath ||
          enabled4.thumbLocalPath ||
          enabled4.imageUrl ||
          enabled4.videoUrl ||
          enabled4.thumbUrl ||
          enabled4.sourceUrl ||
          '',
      ).trim();
    }),
  );
}
function hasDreaminaResultError(record) {
  const list4 = [record?.images, record?.videos].filter(Array.isArray);
  if (list4.length === 0) return false;
  if (hasDreaminaUsableResult(record)) return false;
  return list4.some((list5) =>
    list5.some(
      (error) => error && typeof error === 'object' && String(error.error || error.message || '').trim(),
    ),
  );
}
function isAsyncResumeCandidateNode(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object') return false;
  const payload = String(enabled5.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-video', 'source-image'].includes(payload)) return false;
  const enabled6 = String(enabled5.asyncTaskId || '').trim();
  if (!enabled6) return false;
  const inferAsyncProviderByModel2 = inferAsyncProviderByModel(
    enabled5.model,
    enabled5.asyncTaskProvider || enabled5.provider || '',
  );
  if (
    !inferAsyncProviderByModel2 ||
    inferAsyncProviderByModel2 === 'runninghubwf' ||
    inferAsyncProviderByModel2 === 'runninghub' ||
    inferAsyncProviderByModel2 === 'dreamina'
  )
    return false;
  const handle = String(enabled5.asyncTaskKind || '')
    .trim()
    .toLowerCase();
  if (handle === 'image' && !['ai-image', 'source-image'].includes(payload)) return false;
  if (handle === 'video' && !['ai-video', 'source-video'].includes(payload)) return false;
  const state = String(enabled5.asyncTaskStatus || '')
    .trim()
    .toLowerCase();
  if (state === 'success' || state === 'failed' || state === 'idle' || state === 'cancelled') return false;
  return true;
}
function isRunningHubResumeCandidateNode(enabled7) {
  if (!enabled7 || typeof enabled7 !== 'object') return false;
  const config = String(enabled7.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'ai-audio', 'source-video', 'source-image', 'source-audio'].includes(config))
    return false;
  const scope = String(enabled7.provider || '')
      .trim()
      .toLowerCase(),
    input = String(enabled7.model || '').trim(),
    modelProvider2 = resolveModelProvider(input, scope, { allowProviderHint: false }),
    isWorkflowModel2 = isWorkflowModel(input, scope || 'runninghubwf'),
    output = modelProvider2 === 'runninghub' && isModelApiModel(input, 'runninghub'),
    value2 = config === 'ai-audio' && scope === 'runninghubwf',
    value3 = config === 'source-video' && (scope === 'runninghubwf' || isWorkflowModel2),
    value4 =
      config === 'source-image' &&
      (scope === 'runninghubwf' || scope === 'runninghub' || isWorkflowModel2 || output),
    value5 = config === 'source-audio' && scope === 'runninghubwf' && isWorkflowModel2,
    enabled8 =
      value4 ||
      value5 ||
      value3 ||
      value2 ||
      isWorkflowModel2 ||
      output ||
      scope === 'runninghub' ||
      scope === 'runninghubwf';
  if (!enabled8) return false;
  const enabled9 = String(enabled7.rhTaskId || '').trim();
  if (!enabled9) return false;
  const value6 = String(enabled7.rhTaskStatus || '')
    .trim()
    .toLowerCase();
  if (value6 === 'success' || value6 === 'failed' || value6 === 'idle' || value6 === 'cancelled')
    return false;
  return true;
}
function buildDreaminaResumeBackupPayload({
  projectId: projectId,
  projectName: projectName,
  multiData: multiData,
}) {
  const list6 = Array.isArray(multiData?.canvases) ? multiData.canvases : [],
    items = [];
  return (
    list6.forEach((item2) => {
      const canvasId = String(item2?.id || '').trim();
      if (!canvasId) return;
      const list7 = Array.isArray(item2?.nodes) ? item2.nodes : [];
      list7.forEach((generationDuration) => {
        const args = {
          canvasId: canvasId,
          nodeId: String(generationDuration.id || '').trim(),
          generationStartTime: Number(generationDuration.generationStartTime || 0),
          generationDuration:
            generationDuration.generationDuration == null
              ? null
              : Number(generationDuration.generationDuration || 0),
        };
        if (isDreaminaResumeCandidateNode(generationDuration)) {
          const value7 = {
            ...args,
            kind: 'dreamina',
            dreaminaSubmitId: String(generationDuration.dreaminaSubmitId || '').trim(),
            dreaminaTaskStatus: String(generationDuration.dreaminaTaskStatus || '').trim(),
            dreaminaTaskPhase: String(generationDuration.dreaminaTaskPhase || '').trim(),
            dreaminaTaskLabel: String(generationDuration.dreaminaTaskLabel || '').trim(),
            dreaminaTaskStartedAt: Number(generationDuration.dreaminaTaskStartedAt || 0),
            dreaminaTaskLastCheckedAt: Number(generationDuration.dreaminaTaskLastCheckedAt || 0),
            dreaminaTaskRecovering: !!generationDuration.dreaminaTaskRecovering,
          };
          items.push(value7);
          return;
        }
        if (isAsyncResumeCandidateNode(generationDuration)) {
          items.push({
            ...args,
            kind: 'async',
            nodeType: String(generationDuration.type || '')
              .trim()
              .toLowerCase(),
            asyncTaskProvider: inferAsyncProviderByModel(
              generationDuration.model,
              generationDuration.asyncTaskProvider || generationDuration.provider || '',
            ),
            asyncTaskKind: String(generationDuration.asyncTaskKind || '').trim() || 'image',
            asyncTaskId: String(generationDuration.asyncTaskId || '').trim(),
            asyncTaskStatus: String(generationDuration.asyncTaskStatus || '').trim(),
            asyncTaskStartedAt: Number(generationDuration.asyncTaskStartedAt || 0),
            asyncTaskRecovering: !!generationDuration.asyncTaskRecovering,
          });
          return;
        }
        if (!isRunningHubResumeCandidateNode(generationDuration)) return;
        items.push({
          ...args,
          kind: 'runninghub',
          nodeType: String(generationDuration.type || '')
            .trim()
            .toLowerCase(),
          rhTaskId: String(generationDuration.rhTaskId || '').trim(),
          rhTaskStatus: String(generationDuration.rhTaskStatus || '').trim(),
          rhTaskStartedAt: Number(generationDuration.rhTaskStartedAt || 0),
          rhTaskRecovering: !!generationDuration.rhTaskRecovering,
          rhTaskUseOpenapiQuery: generationDuration.rhTaskUseOpenapiQuery === true,
        });
      });
    }),
    {
      projectId: projectId || 'default_v2_project',
      projectName: projectName || getUntitledProjectName(),
      timestamp: Date.now(),
      items: items,
    }
  );
}
function writeDreaminaResumeBackupSync(value8) {
  try {
    const dreaminaResumeBackupPayload = buildDreaminaResumeBackupPayload(value8);
    if (!Array.isArray(dreaminaResumeBackupPayload.items) || dreaminaResumeBackupPayload.items.length === 0) {
      window.localStorage?.removeItem(DREAMINA_RESUME_BACKUP_KEY);
      return;
    }
    window.localStorage?.setItem(DREAMINA_RESUME_BACKUP_KEY, JSON.stringify(dreaminaResumeBackupPayload));
  } catch (value9) {
    console.warn('[projectLifecycle] 写入即梦恢复兜底失败:', value9);
  }
}
function readDreaminaResumeBackupSync() {
  try {
    const enabled10 = window.localStorage?.getItem(DREAMINA_RESUME_BACKUP_KEY);
    if (!enabled10) return null;
    const enabled11 = JSON.parse(enabled10);
    if (!enabled11 || typeof enabled11 !== 'object') return null;
    if (!Array.isArray(enabled11.items) || enabled11.items.length === 0) return null;
    return enabled11;
  } catch (value10) {
    return (console.warn('[projectLifecycle] 读取即梦恢复兜底失败:', value10), null);
  }
}
function mergeDreaminaResumeBackupIntoMultiData(value11, enabled12, value12) {
  if (!enabled12 || typeof enabled12 !== 'object') return value11;
  if (String(enabled12.projectId || '') !== String(value12 || '')) return value11;
  const list8 = Array.isArray(enabled12.items) ? enabled12.items : [];
  if (list8.length === 0) return value11;
  const value13 = {
      ...(value11 || {}),
      canvases: Array.isArray(value11?.canvases)
        ? value11.canvases.map((args2) => ({
            ...args2,
            nodes: Array.isArray(args2?.nodes) ? args2.nodes.map((args3) => ({ ...args3 })) : [],
          }))
        : [],
    },
    map = new Map();
  return (
    list8.forEach((item3) => {
      const enabled13 = String(item3?.canvasId || '').trim(),
        enabled14 = String(item3?.nodeId || '').trim();
      if (!enabled13 || !enabled14) return;
      map.set(enabled13 + '::' + enabled14, item3);
    }),
    value13.canvases.forEach((item4) => {
      const enabled15 = String(item4?.id || '').trim();
      if (!enabled15 || !Array.isArray(item4.nodes)) return;
      item4.nodes = item4.nodes.map((args4) => {
        const value14 = String(args4?.id || '').trim(),
          rhTaskUseOpenapiQuery = map.get(enabled15 + '::' + value14);
        if (!rhTaskUseOpenapiQuery) return args4;
        if (
          String(rhTaskUseOpenapiQuery?.kind || '')
            .trim()
            .toLowerCase() === 'dreamina'
        ) {
          if (hasDreaminaResultError(args4)) return args4;
          const value15 = String(args4?.jobStatus || '')
            .trim()
            .toLowerCase();
          if (value15 === 'error' || value15 === 'failed') return args4;
          const value16 = {};
          for (const value17 of DREAMINA_RESUME_BACKUP_FIELDS) {
            Object.hasOwn(rhTaskUseOpenapiQuery, value17) &&
              (value16[value17] = rhTaskUseOpenapiQuery[value17]);
          }
          const dreaminaTaskLastRaw =
            Object.hasOwn(rhTaskUseOpenapiQuery, 'dreaminaTaskLastRaw') &&
            rhTaskUseOpenapiQuery.dreaminaTaskLastRaw &&
            typeof rhTaskUseOpenapiQuery.dreaminaTaskLastRaw === 'object' &&
            !Array.isArray(rhTaskUseOpenapiQuery.dreaminaTaskLastRaw)
              ? rhTaskUseOpenapiQuery.dreaminaTaskLastRaw
              : null;
          return {
            ...args4,
            generationStartTime:
              Number(value16.generationStartTime) > 0
                ? Number(value16.generationStartTime)
                : Number(args4?.generationStartTime || 0),
            generationDuration: null,
            dreaminaSubmitId: String(value16.dreaminaSubmitId || '').trim(),
            dreaminaTaskStatus: String(value16.dreaminaTaskStatus || '').trim(),
            dreaminaTaskPhase: String(value16.dreaminaTaskPhase || '').trim(),
            dreaminaTaskLabel: String(value16.dreaminaTaskLabel || '').trim(),
            dreaminaTaskStartedAt: Number(value16.dreaminaTaskStartedAt || 0),
            dreaminaTaskLastCheckedAt: Number(value16.dreaminaTaskLastCheckedAt || 0),
            dreaminaTaskRecovering: true,
            dreaminaTaskLastRaw: dreaminaTaskLastRaw || {},
          };
        }
        if (
          String(rhTaskUseOpenapiQuery?.kind || '')
            .trim()
            .toLowerCase() !== 'runninghub'
        ) {
          if (
            String(rhTaskUseOpenapiQuery?.kind || '')
              .trim()
              .toLowerCase() !== 'async'
          )
            return args4;
          const value18 = String(rhTaskUseOpenapiQuery?.nodeType || '')
              .trim()
              .toLowerCase(),
            value19 = String(args4?.type || '')
              .trim()
              .toLowerCase();
          if (value18 && value19 && value18 !== value19) return args4;
          const asyncTaskProvider = inferAsyncProviderByModel(
            args4?.model,
            rhTaskUseOpenapiQuery.asyncTaskProvider || args4?.asyncTaskProvider || args4?.provider || '',
          );
          return {
            ...args4,
            generationStartTime:
              Number(rhTaskUseOpenapiQuery.generationStartTime) > 0
                ? Number(rhTaskUseOpenapiQuery.generationStartTime)
                : Number(args4?.generationStartTime || 0),
            generationDuration: null,
            asyncTaskProvider: asyncTaskProvider,
            asyncTaskKind: String(rhTaskUseOpenapiQuery.asyncTaskKind || '').trim() || 'image',
            asyncTaskId: String(rhTaskUseOpenapiQuery.asyncTaskId || '').trim(),
            asyncTaskStatus: String(rhTaskUseOpenapiQuery.asyncTaskStatus || '').trim() || 'pending',
            asyncTaskStartedAt: Number(rhTaskUseOpenapiQuery.asyncTaskStartedAt || 0),
            asyncTaskRecovering: true,
          };
        }
        const value20 = String(rhTaskUseOpenapiQuery?.nodeType || '')
            .trim()
            .toLowerCase(),
          value21 = String(args4?.type || '')
            .trim()
            .toLowerCase();
        if (value20 && value21 && value20 !== value21) return args4;
        return {
          ...args4,
          generationStartTime:
            Number(rhTaskUseOpenapiQuery.generationStartTime) > 0
              ? Number(rhTaskUseOpenapiQuery.generationStartTime)
              : Number(args4?.generationStartTime || 0),
          generationDuration: null,
          rhTaskId: String(rhTaskUseOpenapiQuery.rhTaskId || '').trim(),
          rhTaskStatus: String(rhTaskUseOpenapiQuery.rhTaskStatus || '').trim() || 'pending',
          rhTaskStartedAt: Number(rhTaskUseOpenapiQuery.rhTaskStartedAt || 0),
          rhTaskRecovering: true,
          rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery.rhTaskUseOpenapiQuery === true,
        };
      });
    }),
    value13
  );
}
function buildCanvasRecordSignature(id, _persistRevHint = id?._persistRevHint) {
  const visualSnapshot =
      id?.visualSnapshot && typeof id.visualSnapshot === 'object'
        ? {
            schemaVersion: Number(id.visualSnapshot.schemaVersion) || 1,
            srcLength: String(id.visualSnapshot.src || '').length,
            width: Number(id.visualSnapshot.width) || 0,
            height: Number(id.visualSnapshot.height) || 0,
            capturedAt: Number(id.visualSnapshot.capturedAt) || 0,
            visibleNodeCount: Number(id.visualSnapshot.visibleNodeCount) || 0,
            mediaNodeCount: Number(id.visualSnapshot.mediaNodeCount) || 0,
            readyMediaNodeCount: Number(id.visualSnapshot.readyMediaNodeCount) || 0,
          }
        : null,
    value22 = Number.isFinite(_persistRevHint);
  if (value22) {
    const box = id?.viewport && typeof id.viewport === 'object' ? id.viewport : {};
    return createStableSignature({
      _persistRevHint: _persistRevHint,
      viewport: {
        x: Number.isFinite(box?.x) ? box.x : 0,
        y: Number.isFinite(box?.y) ? box.y : 0,
        zoom: Number.isFinite(box?.zoom) ? box.zoom : 1.1,
      },
      nodesLength: Array.isArray(id?.nodes) ? id.nodes.length : 0,
      edgesLength: Array.isArray(id?.edges) ? id.edges.length : 0,
      assetsLength: Array.isArray(id?.assets) ? id.assets.length : 0,
      visualSnapshot: visualSnapshot,
    });
  }
  return createStableSignature({
    id: id?.id ?? null,
    name: id?.name ?? getUntitledCanvasName(),
    nodes: Array.isArray(id?.nodes) ? id.nodes : [],
    edges: Array.isArray(id?.edges) ? id.edges : [],
    viewport: id?.viewport && typeof id.viewport === 'object' ? id.viewport : { x: 0, y: 0, zoom: 1.1 },
    assets: Array.isArray(id?.assets) ? id.assets : [],
    visualSnapshot: visualSnapshot,
  });
}
export function buildWorkspaceShardRecords(value23) {
  const projectId2 = value23?.projectId || 'default_v2_project',
    projectName2 = value23?.projectName || getUntitledProjectName(),
    canvasOrder = Array.isArray(value23?.multiData?.canvases) ? value23.multiData.canvases : [],
    activeCanvasId2 = value23?.multiData?.activeCanvasId || canvasOrder[0]?.id || null,
    _timestamp = Date.now(),
    metaRecord = {
      cacheVersion: 2,
      projectId: projectId2,
      projectName: projectName2,
      activeCanvasId: activeCanvasId2,
      canvasOrder: canvasOrder.map((id2) => ({
        id: id2?.id ?? null,
        name: id2?.name ?? getUntitledCanvasName(),
      })),
      _timestamp: _timestamp,
    },
    canvasRecords = canvasOrder.map((id3) => {
      const record2 = {
          id: id3?.id ?? null,
          name: id3?.name ?? getUntitledCanvasName(),
          _persistRevHint: Number.isFinite(id3?._persistRevHint) ? id3._persistRevHint : undefined,
          nodes: Array.isArray(id3?.nodes) ? id3.nodes : [],
          edges: Array.isArray(id3?.edges) ? id3.edges : [],
          viewport:
            id3?.viewport && typeof id3.viewport === 'object' ? id3.viewport : { x: 0, y: 0, zoom: 1.1 },
          assets: Array.isArray(id3?.assets) ? id3.assets : [],
          visualSnapshot:
            id3?.visualSnapshot && typeof id3.visualSnapshot === 'object' ? id3.visualSnapshot : undefined,
          _timestamp: _timestamp,
        },
        persistedRecord = sanitizeSerializedCanvasData(record2),
        value24 = Number.isFinite(record2._persistRevHint) ? record2._persistRevHint : undefined;
      return {
        key: buildWorkspaceCanvasKey(record2.id),
        record: record2,
        persistedRecord: persistedRecord,
        signature: buildCanvasRecordSignature(persistedRecord, value24),
      };
    });
  return {
    metaRecord: metaRecord,
    metaSignature: createStableSignature({
      cacheVersion: metaRecord.cacheVersion,
      projectId: metaRecord.projectId,
      projectName: metaRecord.projectName,
      activeCanvasId: metaRecord.activeCanvasId,
      canvasOrder: metaRecord.canvasOrder,
    }),
    canvasRecords: canvasRecords,
  };
}
export function restoreWorkspacePayloadFromShardRecords(projectId3, list9) {
  if (
    !Array.isArray(projectId3?.canvasOrder) ||
    !projectId3.canvasOrder.length ||
    !Array.isArray(list9) ||
    list9.length !== projectId3.canvasOrder.length ||
    typeof projectId3.projectId !== 'string' ||
    !projectId3.projectId.trim()
  )
    return null;
  const seen = new Set();
  const canvases2 = [];
  for (let index = 0; index < projectId3.canvasOrder.length; index++) {
    const name = projectId3.canvasOrder[index];
    const id4 = name?.id;
    const nodes = list9[index];
    if (
      typeof id4 !== 'string' ||
      !id4.trim() ||
      seen.has(id4) ||
      !nodes ||
      typeof nodes !== 'object' ||
      Array.isArray(nodes) ||
      nodes.id !== id4 ||
      !Array.isArray(nodes.nodes) ||
      !Array.isArray(nodes.edges) ||
      (nodes.assets != null && !Array.isArray(nodes.assets))
    )
      return null;
    seen.add(id4);
    canvases2.push({
      id: id4,
      name: name.name || nodes.name || getUntitledCanvasName(),
      _persistRevHint: Number.isFinite(nodes._persistRevHint) ? nodes._persistRevHint : undefined,
      nodes: nodes.nodes,
      edges: nodes.edges,
      viewport:
        nodes.viewport && typeof nodes.viewport === 'object' && !Array.isArray(nodes.viewport)
          ? nodes.viewport
          : { x: 0, y: 0, zoom: 1.1 },
      assets: nodes.assets || [],
      visualSnapshot:
        nodes.visualSnapshot && typeof nodes.visualSnapshot === 'object' ? nodes.visualSnapshot : null,
    });
  }
  if (projectId3.activeCanvasId && !seen.has(projectId3.activeCanvasId)) return null;
  return {
    projectId: projectId3.projectId,
    projectName: projectId3.projectName || getUntitledProjectName(),
    multiData: { canvases: canvases2, activeCanvasId: projectId3.activeCanvasId || canvases2[0]?.id || null },
  };
}
export function createProjectLifecycle({
  store: store,
  CanvasTabManager: CanvasTabManager,
  project: project,
  loadCustomPresets: loadCustomPresets,
  migrateLegacyThumbnailsInMultiData: migrateLegacyThumbnailsInMultiData,
  sanitizeMultiCanvasDataForPersistence: sanitizeMultiCanvasDataForPersistence,
  commit: commit,
  patchStoreSourceNodeNamesFromFileName: patchStoreSourceNodeNamesFromFileName,
  applySourceNamesFromFileNameToCanvas: applySourceNamesFromFileNameToCanvas,
}) {
  let value25 = '',
    value26 = '';
  const map2 = new Map();
  let value27 = new Set(),
    enabled16 = false,
    value28 = null,
    value29 = false,
    value30 = null,
    count = 0,
    setTimeout2 = null,
    promise = null,
    value31 = '',
    value32 = '',
    value33 = 0,
    value34 = false;
  let recoveryWriteWarningShown = false;
  function run() {
    ((value25 = ''), (value26 = ''), map2.clear(), (value27 = new Set()), (enabled16 = false));
  }
  function run2(projectId4) {
    const value35 = {
        projectId: projectId4?.projectId || 'default_v2_project',
        projectName: projectId4?.projectName || getUntitledProjectName(),
        multiData: projectId4?.multiData || { canvases: [], activeCanvasId: null },
      },
      { metaSignature: metaSignature, canvasRecords: canvasRecords2 } = buildWorkspaceShardRecords(value35);
    ((value25 = value35.projectId),
      (value26 = metaSignature),
      map2.clear(),
      (value27 = new Set()),
      canvasRecords2.forEach(({ record: record3, signature: signature }) => {
        if (!record3?.id) return;
        (map2.set(record3.id, signature), value27.add(record3.id));
      }),
      (enabled16 = true));
  }
  const V2LocalCache = {
    dbName: 'TapNowV2Cache',
    storeName: 'workspace',
    version: 1,
    _dbPromise: null,
    async initDB() {
      if (this._dbPromise) return this._dbPromise;
      return (
        (this._dbPromise = new Promise((handler, handler2) => {
          const value36 = indexedDB.open(this.dbName, this.version);
          ((value36.onupgradeneeded = (event) => {
            const enabled17 = event.target.result;
            !enabled17.objectStoreNames.contains(this.storeName) &&
              enabled17.createObjectStore(this.storeName);
          }),
            (value36.onsuccess = (event2) => {
              const value37 = event2.target.result;
              ((value37.onversionchange = () => {
                (value37.close(), (this._dbPromise = null));
              }),
                handler(value37));
            }),
            (value36.onerror = (event3) => {
              ((this._dbPromise = null), handler2(event3.target.error));
            }));
        })),
        this._dbPromise
      );
    },
    async getRecord(value38) {
      const value39 = await this.initDB();
      return new Promise((handler3, handler4) => {
        const value40 = value39.transaction(this.storeName, 'readonly'),
          map3 = value40.objectStore(this.storeName),
          value41 = map3.get(value38);
        ((value41.onsuccess = (event4) => handler3(event4.target.result ?? null)),
          (value41.onerror = (event5) => handler4(event5.target.error)));
      });
    },
    async getRecords(list10) {
      const value42 = await this.initDB();
      return new Promise((value43, value44) => {
        const value45 = value42.transaction(this.storeName, 'readonly'),
          map4 = value45.objectStore(this.storeName),
          value46 = list10.map(
            (item5) =>
              new Promise((handler5, handler6) => {
                const value47 = map4.get(item5);
                ((value47.onsuccess = (event6) => handler5(event6.target.result ?? null)),
                  (value47.onerror = (event7) => handler6(event7.target.error)));
              }),
          );
        Promise.all(value46).then(value43).catch(value44);
      });
    },
    async listKeys() {
      const value48 = await this.initDB();
      return new Promise((handler7, handler8) => {
        const value49 = value48.transaction(this.storeName, 'readonly'),
          value50 = value49.objectStore(this.storeName),
          value51 = value50.getAllKeys();
        ((value51.onsuccess = (event8) => handler7(event8.target.result || [])),
          (value51.onerror = (event9) => handler8(event9.target.error)));
      });
    },
    async save(projectId5) {
      try {
        const value52 = {
            projectId: projectId5?.projectId || 'default_v2_project',
            projectName: projectId5?.projectName || getUntitledProjectName(),
            multiData: projectId5?.multiData || { canvases: [], activeCanvasId: null },
          },
          {
            metaRecord: metaRecord2,
            metaSignature: metaSignature2,
            canvasRecords: canvasRecords3,
          } = buildWorkspaceShardRecords(value52),
          value53 = await this.initDB(),
          list11 = canvasRecords3
            .map(({ record: record4 }) => String(record4?.id || '').trim())
            .filter(Boolean),
          map5 = new Set(list11),
          map6 = new Set(list11.map((item6) => buildWorkspaceCanvasKey(item6))),
          value54 = value25 !== value52.projectId,
          value55 = value54 || !enabled16 || (value27.size === 0 && canvasRecords3.length > 0);
        let list12 = [];
        if (value54) value55 && (await this.listKeys());
        else {
          if (enabled16)
            list12 = Array.from(value27)
              .filter((item7) => !map5.has(item7))
              .map((item8) => buildWorkspaceCanvasKey(item8));
          else {
            if (value55) {
              const list13 = await this.listKeys(),
                list14 = list13.filter((item9) => String(item9).startsWith(WORKSPACE_CANVAS_KEY_PREFIX));
              list12 = list14.filter((item10) => !map6.has(item10));
            }
          }
        }
        const list15 = canvasRecords3.filter(
            ({ record: record5, signature: signature2 }) => value54 || map2.get(record5.id) !== signature2,
          ),
          enabled18 = value54 || value26 !== metaSignature2;
        if (!enabled18 && list15.length === 0 && list12.length === 0) return;
        return new Promise((handler9, handler10) => {
          const value56 = value53.transaction(this.storeName, 'readwrite'),
            map7 = value56.objectStore(this.storeName);
          (enabled18 && map7.put(metaRecord2, WORKSPACE_META_KEY),
            list15.forEach(({ key: key2, persistedRecord: persistedRecord2 }) => {
              map7.put(persistedRecord2, key2);
            }),
            list12.forEach((item11) => {
              map7.delete(item11);
            }),
            (value56.oncomplete = () => {
              ((value25 = value52.projectId), (value26 = metaSignature2));
              const list16 = new Map();
              (canvasRecords3.forEach(({ record: record6, signature: signature3 }) => {
                if (!record6?.id) return;
                list16.set(record6.id, signature3);
              }),
                map2.clear(),
                (value27 = new Set()),
                list16.forEach((item12, value57) => {
                  (map2.set(value57, item12), value27.add(value57));
                }),
                (enabled16 = true),
                handler9());
            }),
            (value56.onerror = (event10) => handler10(event10.target.error)),
            (value56.onabort = (event11) => handler10(event11.target.error)));
        });
      } catch (value58) {
        console.warn('[V2LocalCache] Save failed:', value58);
      }
    },
    async load() {
      try {
        const enabled19 = await this.getRecord(WORKSPACE_META_KEY);
        if (enabled19 != null) {
          if (
            enabled19.cacheVersion !== 2 ||
            !Array.isArray(enabled19.canvasOrder) ||
            !enabled19.canvasOrder.length
          )
            throw unsafeRecoveryError();
          const value59 = enabled19.canvasOrder.map((item13) => buildWorkspaceCanvasKey(item13?.id)),
            value60 = await this.getRecords(value59),
            restoreWorkspacePayloadFromShardRecords2 = restoreWorkspacePayloadFromShardRecords(
              enabled19,
              value60,
            );
          if (!restoreWorkspacePayloadFromShardRecords2?.multiData?.canvases?.length)
            throw unsafeRecoveryError();
          return (run2(restoreWorkspacePayloadFromShardRecords2), restoreWorkspacePayloadFromShardRecords2);
        }
        const enabled20 = await this.getRecord(LEGACY_WORKSPACE_KEY);
        if (enabled20 != null) {
          if (
            typeof enabled20.projectId !== 'string' ||
            !enabled20.projectId.trim() ||
            !Array.isArray(enabled20.multiData?.canvases) ||
            !enabled20.multiData.canvases.length ||
            enabled20.multiData.canvases.some((canvas) => canvas.nodes == null || canvas.edges == null)
          )
            throw unsafeRecoveryError();
          requireProjectDocument(enabled20.multiData);
          return (run(), enabled20);
        }
        return (run(), null);
      } catch (value61) {
        console.warn('[V2LocalCache] Load failed:', value61);
        run();
        // A rejected IndexedDB read cannot prove the cache is absent; fail closed.
        throw unsafeRecoveryError();
      }
    },
    async clear() {
      try {
        const value62 = await this.initDB(),
          list17 = await this.listKeys(),
          list18 = list17.filter((item14) => {
            const value63 = String(item14);
            return (
              value63 === LEGACY_WORKSPACE_KEY ||
              value63 === WORKSPACE_META_KEY ||
              value63.startsWith(WORKSPACE_CANVAS_KEY_PREFIX)
            );
          });
        return new Promise((handler11, handler12) => {
          const value64 = value62.transaction(this.storeName, 'readwrite'),
            map8 = value64.objectStore(this.storeName);
          (list18.forEach((item15) => map8.delete(item15)),
            (value64.oncomplete = () => {
              (run(), handler11());
            }),
            (value64.onerror = (event12) => handler12(event12.target.error)),
            (value64.onabort = (event13) => handler12(event13.target.error)));
        });
      } catch (value65) {
        console.warn('[V2LocalCache] Clear failed:', value65);
      }
    },
  };
  window.V2LocalCache = V2LocalCache;
  function run3(value66) {
    if (typeof performance?.mark !== 'function') return;
    performance.mark(value66);
  }
  function run4(value67, value68, value69) {
    if (typeof performance?.measure !== 'function') return;
    try {
      performance.measure(value67, value68, value69);
    } catch {}
  }
  function run5() {
    if (window.__perfDebug !== true) return;
    if (typeof performance?.getEntriesByName !== 'function') return;
    BOOT_PERF_MEASURE_NAMES.forEach((item16) => {
      const list19 = performance.getEntriesByName(item16),
        enabled21 = list19[list19.length - 1];
      if (!enabled21) return;
      console.log('[perf] ' + item16 + ': ' + enabled21.duration.toFixed(1) + 'ms');
    });
  }
  function run6({ projectId: projectId6, projectName: projectName3, multiData: multiData2 }) {
    return { projectId: projectId6, projectName: projectName3, multiData: multiData2 || {} };
  }
  function run7({ projectId: projectId7, projectName: projectName4, multiData: multiData3 }) {
    const value70 = run6({ projectId: projectId7, projectName: projectName4, multiData: multiData3 });
    return (writeDreaminaResumeBackupSync(value70), V2LocalCache.save(value70));
  }
  function run8(enabled22, { sanitizeForPersistence: sanitizeForPersistence = false } = {}) {
    if (!enabled22) return null;
    if (typeof enabled22.getMultiDataSnapshot === 'function')
      return enabled22.getMultiDataSnapshot({ sanitizeForPersistence: sanitizeForPersistence });
    if (typeof enabled22.getMultiData === 'function') return enabled22.getMultiData();
    return null;
  }
  function projectName5() {
    return document.getElementById('projectNameText')?.textContent || getUntitledProjectName();
  }
  function run9() {
    const value71 = window.electronAPI?.project;
    return value71 && typeof value71 === 'object' ? value71 : null;
  }
  function lastKnownProjectLastModified() {
    const count2 = Number(window._v2CurrentProjectLastModified || 0);
    return Number.isFinite(count2) && count2 > 0 ? Math.round(count2) : 0;
  }
  function run10() {
    return {
      projectId: window.currentProjectId || 'default_v2_project',
      projectName: projectName5(),
      filename: window._v2CurrentFile || '',
      recentId: window._v2CurrentRecentProjectId || '',
      displayPath: window._v2CurrentProjectDisplayPath || '',
      lastKnownProjectLastModified: lastKnownProjectLastModified(),
    };
  }
  function run11() {
    return CanvasTabManager?.hasDirtyCanvases?.() === true;
  }
  async function run12(reason2 = 'auto') {
    // Flush the story workspace auto-save before the close/update handshake
    // resolves, so a pending write is not lost when the renderer goes away.
    const storyRoot = window.document?.['getElementById']?.('storyWorkspaceRoot');
    const storyApi = storyRoot?.['_storyWorkspaceApi'];
    if (typeof storyApi?.['flushPersistence'] === 'function') {
      try {
        await storyApi['flushPersistence']();
      } catch (value72) {
        console.warn('[projectLifecycle] 关闭前刷新剧本保存失败:', value72);
      }
    }
    const value73 = run9();
    if (typeof value73?.writeRecoverySnapshot !== 'function')
      return { success: false, reason: 'api-unavailable' };
    if (typeof value73.writeRecoverySnapshotIfCompatible !== 'function') {
      if (!recoveryWriteWarningShown) {
        recoveryWriteWarningShown = true;
        window.showToast?.(t('projectLifecycle.recoverySnapshotUpgradeRequired'), 'warning');
      }
      return { success: false, code: 'RECOVERY_SNAPSHOT_PROTECTED', reason: 'guard-unavailable' };
    }
    if (!run11()) return { success: false, reason: 'clean' };
    const multiData4 = run8(CanvasTabManager, { sanitizeForPersistence: true });
    if (!multiData4?.canvases?.length) return { success: false, reason: 'empty-canvas' };
    const args5 = run10(),
      stableSignature = createStableSignature({ ...args5, multiData: multiData4 }),
      value74 = Date.now();
    if (stableSignature && stableSignature === value32 && value74 - value33 < RECOVERY_SNAPSHOT_DEDUPE_MS)
      return { success: true, deduped: true };
    if (promise && value31 === stableSignature) return promise;
    if (promise) return promise.catch(() => null).then(() => run12(reason2));
    return (
      (promise = value73
        .writeRecoverySnapshotIfCompatible({ ...args5, reason: reason2, multiData: multiData4 })
        .then((response) => {
          if (response?.code === 'RECOVERY_SNAPSHOT_PROTECTED' && !recoveryWriteWarningShown) {
            recoveryWriteWarningShown = true;
            window.showToast?.(t('projectLifecycle.recoverySnapshotProtected'), 'warning');
          }
          return (
            response?.success !== false && ((value32 = stableSignature), (value33 = Date.now())),
            response
          );
        })
        .finally(() => {
          ((promise = null), (value31 = ''));
        })),
      (value31 = stableSignature),
      promise
    );
  }
  function run13(value75 = 'dirty-state') {
    const value76 = run9();
    if (typeof value76?.writeRecoverySnapshot !== 'function') return;
    (setTimeout2 !== null && clearTimeout(setTimeout2),
      (setTimeout2 = setTimeout(() => {
        ((setTimeout2 = null),
          void run12(value75).catch((value77) => {
            console.warn('[projectLifecycle] 写入恢复快照失败:', value77);
          }));
      }, 1200)));
  }
  function run14() {
    if (setTimeout2 === null) return;
    (clearTimeout(setTimeout2), (setTimeout2 = null));
  }
  function run15({ writeRecovery: writeRecovery = false, reason: reason = 'dirty-state' } = {}) {
    const value78 = run9(),
      hasUnsavedChanges = run11();
    typeof value78?.setUnsavedState === 'function' &&
      value78.setUnsavedState({ hasUnsavedChanges: hasUnsavedChanges, projectName: projectName5() });
    if (hasUnsavedChanges && writeRecovery) {
      run13(reason);
      return;
    }
    !hasUnsavedChanges && run14();
  }
  async function run16() {
    const value79 = run9();
    if (
      typeof value79?.getRecoverySnapshotInfo !== 'function' ||
      typeof value79?.readRecoverySnapshot !== 'function'
    )
      return null;
    try {
      const enabled23 = await value79.getRecoverySnapshotInfo(run10());
      if (enabled23?.invalid || enabled23?.error || typeof enabled23?.exists !== 'boolean')
        throw unsafeRecoveryError();
      if (!enabled23?.exists) return null;
      if (enabled23.isNewerThanProject !== true) return null; // Never auto-delete an older recovery file.
      const projectId8 = await value79.readRecoverySnapshot();
      if (!projectId8?.success) throw unsafeRecoveryError();
      const verifiedData = requireProjectDocument(projectId8.data);
      if (Array.isArray(verifiedData.canvases) && verifiedData.canvases.length === 0)
        throw unsafeRecoveryError();
      return {
        projectId: projectId8.projectId || window.currentProjectId || 'default_v2_project',
        projectName: projectId8.projectName || getUntitledProjectName(),
        multiData: project.resolveCanvasData(verifiedData),
        recovery: true,
        filename: projectId8.filename || '',
        recentId: projectId8.recentId || '',
        displayPath: projectId8.displayPath || '',
        lastModified: Number(projectId8.lastModified || 0) || 0,
      };
    } catch (value80) {
      console.warn('[projectLifecycle] 读取恢复快照失败:', value80);
      throw unsafeRecoveryError();
    }
  }
  function run17(enabled24) {
    if (!enabled24?.recovery) return;
    ((window._v2CurrentFile = enabled24.filename || ''),
      (window._v2CurrentRecentProjectId = enabled24.recentId || ''),
      (window._v2CurrentProjectDisplayPath = enabled24.displayPath || ''),
      (window._v2CurrentProjectLastModified = Number(enabled24.lastModified || 0) || 0));
  }
  function run18() {
    if (value34) return;
    ((value34 = true),
      (window.__aiCanvasWriteRecoverySnapshotForClose = (value81 = 'window-close') => run12(value81)),
      window.addEventListener('aicanvas:dirty-state-changed', () => {
        run15({ writeRecovery: true, reason: 'dirty-state' });
      }));
  }
  function run19() {
    if (value28) return ((value29 = true), value28);
    const run20 = async () => {
      const multiData5 = run8(CanvasTabManager, { sanitizeForPersistence: true }),
        projectId9 = window.currentProjectId,
        projectName6 = projectName5();
      if (!multiData5?.canvases?.length) return;
      await run7({ projectId: projectId9, projectName: projectName6, multiData: multiData5 });
    };
    return (
      (value28 = (async () => {
        try {
          do {
            ((value29 = false), await run20());
          } while (value29);
        } finally {
          value28 = null;
        }
      })()),
      value28
    );
  }
  function run21(value82) {
    return sanitizeMultiCanvasDataForPersistence(value82 || {});
  }
  function run22(handler13, { timeout: timeout = 1500 } = {}) {
    if (typeof handler13 !== 'function') return;
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(
        () => {
          void handler13();
        },
        { timeout: timeout },
      );
      return;
    }
    setTimeout(() => {
      void handler13();
    }, 0);
  }
  function run23() {
    return new Promise((value83) => setTimeout(value83, 0));
  }
  function run24({
    wrapEl: wrapEl,
    canvasEl: canvasEl,
    animate: animate = false,
    afterHidden: afterHidden,
  } = {}) {
    const run25 = () => {
      if (canvasEl) canvasEl.style.transition = '';
      wrapEl &&
        ((wrapEl.style.transition = animate ? 'opacity 0.2s ease-in-out' : ''), (wrapEl.style.opacity = '1'));
      const el = document.getElementById('v2-initial-loader');
      el &&
        ((el.style.opacity = '0'), (el.style.visibility = 'hidden'), setTimeout(() => el.remove(), 400));
      if (window.hideGlobalLoading) window.hideGlobalLoading();
      (run3('loader hidden:end'), run4('loader hidden', 'initApp:start', 'loader hidden:end'));
      if (typeof afterHidden === 'function') afterHidden();
      run5();
    };
    if (animate) {
      setTimeout(run25, 80);
      return;
    }
    run25();
  }
  function run26(value84) {
    run22(value84, { timeout: 1500 });
  }
  function run27({ projectId: projectId10, projectName: projectName7, multiData: multiData6 }) {
    if (!multiData6?.canvases?.length) return;
    run26(async () => {
      try {
        const { changed: changed, multiData: multiData7 } =
          await migrateLegacyThumbnailsInMultiData(multiData6);
        if (!changed) return;
        await run7({ projectId: projectId10, projectName: projectName7, multiData: multiData7 });
      } catch (value85) {
        console.warn('[main] 缩略图迁移失败', value85);
      }
    });
  }
  function run28(value86) {
    const value87 = String(value86 || '').trim();
    return /^https?:\/\//i.test(value87) || value87.startsWith('//');
  }
  function run29(value88) {
    const list20 = [];
    for (const nodeId of Object.values(value88 || {})) {
      if (!nodeId || nodeId.type !== 'ai-image') continue;
      const list21 = Array.isArray(nodeId.images) ? nodeId.images : [];
      for (let idx = 0; idx < list21.length; idx += 1) {
        const value89 = list21[idx] || {};
        if (String(value89.localPath || '').trim()) continue;
        const remote = String(value89.sourceUrl || value89.imageUrl || value89.thumbUrl || '').trim();
        if (!remote || !run28(remote)) continue;
        list20.push({ nodeId: nodeId.id, idx: idx, remote: remote });
      }
      if (
        list21.length === 0 &&
        !String(nodeId.localPath || '').trim() &&
        run28(nodeId.thumbUrl || nodeId.imageUrl || nodeId.sourceUrl)
      ) {
        const remote2 = String(nodeId.sourceUrl || nodeId.imageUrl || nodeId.thumbUrl || '').trim();
        if (remote2) list20.push({ nodeId: nodeId.id, idx: -1, remote: remote2 });
      }
    }
    return list20;
  }
  function run30(enabled25, value90) {
    if (!enabled25) return false;
    if (value90.idx >= 0) {
      const value91 = Array.isArray(enabled25.images) ? enabled25.images : [],
        enabled26 = value91[value90.idx];
      if (!enabled26 || String(enabled26.localPath || '').trim()) return false;
      const value92 = String(enabled26.sourceUrl || enabled26.imageUrl || enabled26.thumbUrl || '').trim();
      return value92 === value90.remote;
    }
    if (String(enabled25.localPath || '').trim()) return false;
    const value93 = String(enabled25.sourceUrl || enabled25.imageUrl || enabled25.thumbUrl || '').trim();
    return value93 === value90.remote;
  }
  function run31(value94, response2) {
    const value95 =
        typeof response2 === 'string'
          ? String(response2 || '').trim()
          : String(response2?.localUrl || response2?.url || '').trim(),
      localPath =
        typeof response2 === 'string'
          ? normalizeLocalPath(response2)
          : pickResultLocalPath(response2) || normalizeLocalPath(value95);
    if (!localPath) return false;
    const args6 = response2 && typeof response2 === 'object' ? buildImageNodeStorageFields(response2) : {},
      args7 = buildCanvasLocalImageFields(
        response2 && typeof response2 === 'object' ? response2 : { localPath: localPath },
      ),
      value96 = store.getStateRaw()?.nodes?.[value94.nodeId];
    if (!run30(value96, value94)) return false;
    const value97 = {};
    if (value94.idx >= 0) {
      const enabled27 = Array.isArray(value96.images) ? value96.images.slice() : [];
      if (!enabled27[value94.idx]) return false;
      ((enabled27[value94.idx] = {
        ...(enabled27[value94.idx] || {}),
        ...args7,
        ...args6,
        originalWidth: Number(response2?.originalWidth || 0) || enabled27[value94.idx]?.originalWidth,
        originalHeight: Number(response2?.originalHeight || 0) || enabled27[value94.idx]?.originalHeight,
      }),
        (value97.images = enabled27),
        (value96.mainImageIndex || 0) === value94.idx &&
          (Object.assign(value97, args7),
          Object.assign(value97, args6),
          (value97.originalWidth = Number(response2?.originalWidth || 0) || value96.originalWidth),
          (value97.originalHeight = Number(response2?.originalHeight || 0) || value96.originalHeight)));
    } else
      (Object.assign(value97, args7),
        Object.assign(value97, args6),
        (value97.originalWidth = Number(response2?.originalWidth || 0) || value96.originalWidth),
        (value97.originalHeight = Number(response2?.originalHeight || 0) || value96.originalHeight));
    if (Object.keys(value97).length === 0) return false;
    return (store.updateNodeData(value94.nodeId, value97), true);
  }
  function localPath2(value98) {
    return normalizeLocalPath(value98?.originalLocalPath || value98?.localPath);
  }
  function run32(value99) {
    return {
      displayLocalPath: normalizeLocalPath(value99?.displayLocalPath),
      thumbLocalPath: normalizeLocalPath(value99?.thumbLocalPath),
    };
  }
  function run33(value100) {
    const enabled28 = localPath2(value100);
    if (!enabled28) return false;
    const { displayLocalPath: displayLocalPath, thumbLocalPath: thumbLocalPath } = run32(value100),
      value101 = !!displayLocalPath,
      value102 = !!thumbLocalPath;
    return !(value101 && value102);
  }
  async function run34(value103) {
    if (typeof project?.checkLocalMediaExists !== 'function') return false;
    const enabled29 = localPath2(value103);
    if (!enabled29) return false;
    const { displayLocalPath: displayLocalPath2, thumbLocalPath: thumbLocalPath2 } = run32(value103),
      list22 = [displayLocalPath2, thumbLocalPath2].filter(Boolean);
    if (list22.length === 0) return false;
    for (const value104 of list22) {
      try {
        if (!(await project.checkLocalMediaExists(value104))) return true;
      } catch {
        return true;
      }
    }
    return false;
  }
  async function run35(value105) {
    if (run33(value105)) return true;
    return await run34(value105);
  }
  async function run36(value106) {
    const list23 = [];
    for (const nodeId2 of Object.values(value106 || {})) {
      if (!nodeId2) continue;
      const nodeType = String(nodeId2.type || '').trim();
      if (nodeType === 'source-image') {
        (await run35(nodeId2)) &&
          list23.push({
            nodeId: nodeId2.id,
            idx: -1,
            nodeType: nodeType,
            localPath: localPath2(nodeId2),
          });
        continue;
      }
      if (nodeType !== 'ai-image') continue;
      const list24 = Array.isArray(nodeId2.images) ? nodeId2.images : [];
      if (list24.length > 0) {
        for (let idx2 = 0; idx2 < list24.length; idx2 += 1) {
          const value107 = list24[idx2] || {};
          if (!(await run35(value107))) continue;
          list23.push({
            nodeId: nodeId2.id,
            idx: idx2,
            nodeType: nodeType,
            localPath: localPath2(value107),
          });
        }
        continue;
      }
      (await run35(nodeId2)) &&
        list23.push({
          nodeId: nodeId2.id,
          idx: -1,
          nodeType: nodeType,
          localPath: localPath2(nodeId2),
        });
    }
    return list23;
  }
  function run37(enabled30, value108) {
    if (!enabled30) return false;
    if (value108.idx >= 0) {
      const value109 = Array.isArray(enabled30.images) ? enabled30.images : [],
        enabled31 = value109[value108.idx];
      if (!enabled31) return false;
      return localPath2(enabled31) === value108.localPath;
    }
    return localPath2(enabled30) === value108.localPath;
  }
  function run38(value110, value111) {
    const args8 = buildImageNodeStorageFields(value111);
    if (!args8.displayLocalPath && !args8.thumbLocalPath) return false;
    const value112 = store.getStateRaw()?.nodes?.[value110.nodeId];
    if (!run37(value112, value110)) return false;
    const value113 = {};
    if (value110.idx >= 0) {
      const enabled32 = Array.isArray(value112.images) ? value112.images.slice() : [];
      if (!enabled32[value110.idx]) return false;
      ((enabled32[value110.idx] = {
        ...(enabled32[value110.idx] || {}),
        ...args8,
        originalWidth: Number(value111?.originalWidth || 0) || enabled32[value110.idx]?.originalWidth,
        originalHeight: Number(value111?.originalHeight || 0) || enabled32[value110.idx]?.originalHeight,
      }),
        (value113.images = enabled32),
        (value112.mainImageIndex || 0) === value110.idx &&
          Object.assign(value113, {
            ...args8,
            originalWidth: Number(value111?.originalWidth || 0) || value112.originalWidth,
            originalHeight: Number(value111?.originalHeight || 0) || value112.originalHeight,
          }));
    } else
      Object.assign(value113, {
        ...args8,
        originalWidth: Number(value111?.originalWidth || 0) || value112.originalWidth,
        originalHeight: Number(value111?.originalHeight || 0) || value112.originalHeight,
      });
    if (Object.keys(value113).length === 0) return false;
    return (store.updateNodeData(value110.nodeId, value113), true);
  }
  async function run39(enabled33, value114 = 10) {
    if (
      typeof project?.saveRemoteImageLocallyDetailed !== 'function' &&
      typeof project?.saveRemoteImageLocally !== 'function'
    )
      return;
    if (!enabled33 || window.currentProjectId !== enabled33) return;
    const count3 = run29(store.getStateRaw()?.nodes || {});
    if (count3.length === 0) return;
    window.showToast?.(
      t('projectLifecycle.historicalAiLocalizationStarted', { count: count3.length }),
      'info',
    );
    let count4 = 0;
    await run23();
    for (let value115 = 0; value115 < count3.length; value115 += value114) {
      if (window.currentProjectId !== enabled33) return;
      const value116 = count3.slice(value115, value115 + value114);
      for (const value117 of value116) {
        if (window.currentProjectId !== enabled33) return;
        try {
          const value118 =
            typeof project.saveRemoteImageLocallyDetailed === 'function'
              ? await project.saveRemoteImageLocallyDetailed(value117.remote, enabled33)
              : await project.saveRemoteImageLocally(value117.remote, enabled33);
          run31(value117, value118) && (count4 += 1);
        } catch {}
      }
      value115 + value114 < count3.length && (await run23());
    }
    if (window.currentProjectId !== enabled33) return;
    count4 > 0 &&
      window.showToast?.(t('projectLifecycle.historicalAiLocalizationFixed', { count: count4 }), 'success');
  }
  async function run40(enabled34, value119 = 10) {
    if (typeof project?.ensureLocalImageDerivatives !== 'function') return;
    if (!enabled34 || window.currentProjectId !== enabled34) return;
    const list25 = await run36(store.getStateRaw()?.nodes || {});
    if (list25.length === 0) return;
    let count5 = 0;
    await run23();
    for (let value120 = 0; value120 < list25.length; value120 += value119) {
      if (window.currentProjectId !== enabled34) return;
      const value121 = list25.slice(value120, value120 + value119);
      for (const value122 of value121) {
        if (window.currentProjectId !== enabled34) return;
        try {
          const value123 = await project.ensureLocalImageDerivatives(value122.localPath);
          run38(value122, value123) && (count5 += 1);
        } catch {}
      }
      value120 + value119 < list25.length && (await run23());
    }
    if (window.currentProjectId !== enabled34) return;
    count5 > 0 &&
      (window._triggerLocalCacheSave?.(),
      window.showToast?.(
        t('projectLifecycle.historicalImageDerivativesFixed', { count: count5 }),
        'success',
      ));
  }
  function run41(enabled35, value124 = 10) {
    if (!enabled35) return;
    (run3('historicalAiLocalization queued:end'),
      run4('historicalAiLocalization queued', 'initApp:start', 'historicalAiLocalization queued:end'),
      run22(() => run39(enabled35, value124), { timeout: 2500 }));
  }
  function run42(enabled36, value125 = 10) {
    if (!enabled36) return;
    run22(() => run40(enabled36, value125), { timeout: 3200 });
  }
  window._queueLegacyThumbnailMigration = run27;
  function triggerLocalCacheSave() {
    return run19();
  }
  window._triggerLocalCacheSave = triggerLocalCacheSave;
  let setTimeout3 = null,
    setTimeout4 = null,
    value126 = false;
  function run43() {
    return (
      setTimeout4 !== null && clearTimeout(setTimeout4),
      (setTimeout4 = setTimeout(() => {
        ((setTimeout4 = null), triggerLocalCacheSave());
      }, 150)),
      setTimeout4
    );
  }
  window._triggerLocalCacheMetaSave = run43;
  function flushPendingLocalCacheSaveNow({ pageLifecycle: pageLifecycle = false } = {}) {
    setTimeout3 !== null && (clearTimeout(setTimeout3), (setTimeout3 = null));
    setTimeout4 !== null && (clearTimeout(setTimeout4), (setTimeout4 = null));
    if (window._isAppLoaded !== true) return null;
    if (!pageLifecycle) return triggerLocalCacheSave();
    const value127 = Date.now();
    if (value30) return value30;
    if (count > 0 && value127 - count < PAGE_LIFECYCLE_FLUSH_DEDUPE_MS)
      return value28 || Promise.resolve(null);
    const promise2 = triggerLocalCacheSave();
    if (!promise2 || typeof promise2.finally !== 'function') return ((count = Date.now()), promise2);
    return (
      (value30 = promise2),
      promise2.finally(() => {
        value30 === promise2 && ((count = Date.now()), (value30 = null));
      }),
      promise2
    );
  }
  function bindPersistRevisionAutoSave() {
    if (value126) return;
    ((value126 = true), run18());
    let enabled37 = false;
    store.subscribeSelector(
      (value128) => value128._persistRev,
      () => {
        if (!enabled37) {
          enabled37 = true;
          return;
        }
        if (window._isAppLoaded !== true) return;
        (setTimeout3 !== null && clearTimeout(setTimeout3),
          (setTimeout3 = setTimeout(() => {
            ((setTimeout3 = null), triggerLocalCacheSave());
          }, 1000)),
          run15({ writeRecovery: true, reason: 'persist-rev' }));
      },
    );
  }
  function onBeforeUnload() {
    return (
      run11() && void run12('beforeunload').catch(() => {}),
      flushPendingLocalCacheSaveNow({ pageLifecycle: true })
    );
  }
  function onPageHide() {
    return flushPendingLocalCacheSaveNow({ pageLifecycle: true });
  }
  function onVisibilityChange() {
    if (document.visibilityState !== 'hidden') {
      count = 0;
      return;
    }
    return flushPendingLocalCacheSaveNow({ pageLifecycle: true });
  }
  async function initApp() {
    const wrapEl2 = document.getElementById('v2-wrap'),
      canvasEl2 = document.getElementById('v2-canvas') || document.querySelector('.v2-canvas');
    try {
      (run3('initApp:start'), loadCustomPresets());
      const dreaminaResumeBackupSync = readDreaminaResumeBackupSync(),
        value129 = await run16(),
        // Validate both persisted sources before a good snapshot can overwrite a damaged cache.
        value130 = await V2LocalCache.load(),
        projectName8 = value129 || value130;
      if (
        projectName8 &&
        projectName8.multiData &&
        projectName8.multiData.canvases &&
        projectName8.multiData.canvases.length > 0
      ) {
        (store.updateViewport(0, 0, 1),
          run17(projectName8),
          (window.currentProjectId = projectName8.projectId || 'default_v2_project'));
        const el2 = document.getElementById('projectNameText');
        el2 && (el2.textContent = projectName8.projectName || getUntitledProjectName());
        const multiData8 = project.resolveCanvasData(
          mergeDreaminaResumeBackupIntoMultiData(
            projectName8.multiData,
            dreaminaResumeBackupSync,
            projectName8.projectId || window.currentProjectId,
          ),
        );
        run3('buildHydrationSafeMultiData:start');
        const value131 = run21(multiData8);
        (run3('buildHydrationSafeMultiData:end'),
          run4(
            'buildHydrationSafeMultiData',
            'buildHydrationSafeMultiData:start',
            'buildHydrationSafeMultiData:end',
          ),
          run3('CanvasTabManager.init:start'),
          CanvasTabManager.init(value131, { markClean: false }),
          run3('CanvasTabManager.init:end'),
          run4('CanvasTabManager.init', 'CanvasTabManager.init:start', 'CanvasTabManager.init:end'),
          run27({
            projectId: window.currentProjectId,
            projectName: projectName8.projectName || getUntitledProjectName(),
            multiData: multiData8,
          }),
          (window._isAppLoaded = true),
          run15({ writeRecovery: projectName8.recovery === true, reason: 'startup' }),
          window._checkEmptyHint?.(),
          commit());
        rendererStartupState.complete('project');
        if (!(await rendererStartupState.settled).ready) return;
        run24({
          wrapEl: wrapEl2,
          canvasEl: canvasEl2,
          animate: false,
          afterHidden: () => {
            (run41(window.currentProjectId), run42(window.currentProjectId));
          },
        });
        return;
      }
      canvasEl2 && ((canvasEl2.style.transition = 'none'), void canvasEl2.offsetHeight);
      store.updateViewport(0, 0, 1);
      window.showGlobalLoading && window.showGlobalLoading(t('projectLifecycle.loadingWorkspaceFiles'));
      const projectId11 = window.currentProjectId || 'default_v2_project',
        allowMissing =
          projectId11 === 'default_v2_project' && !new URLSearchParams(window.location.search).get('id');
      let missingDefaultProject = false;
      ((window.currentProjectId = projectId11), run3('project.loadProject:start'));
      const value132 = await project.loadProject(projectId11, {
          allowMissing: allowMissing,
          onMissing: () => {
            missingDefaultProject = true;
          },
        }),
        multiData9 = mergeDreaminaResumeBackupIntoMultiData(value132, dreaminaResumeBackupSync, projectId11);
      (run3('project.loadProject:end'),
        run4('project.loadProject', 'project.loadProject:start', 'project.loadProject:end'),
        run3('buildHydrationSafeMultiData:start'));
      const value133 = run21(multiData9);
      (run3('buildHydrationSafeMultiData:end'),
        run4(
          'buildHydrationSafeMultiData',
          'buildHydrationSafeMultiData:start',
          'buildHydrationSafeMultiData:end',
        ),
        run3('CanvasTabManager.init:start'),
        CanvasTabManager.init(value133),
        run3('CanvasTabManager.init:end'),
        run4('CanvasTabManager.init', 'CanvasTabManager.init:start', 'CanvasTabManager.init:end'),
        run27({
          projectId: projectId11,
          projectName: document.getElementById('projectNameText')?.textContent || getDefaultCanvasName(),
          multiData: multiData9,
        }),
        patchStoreSourceNodeNamesFromFileName(),
        (window._isAppLoaded = true),
        run15({ writeRecovery: false, reason: 'startup' }),
        window._checkEmptyHint?.());
      const el3 = document.getElementById('projectNameText');
      el3 && (el3.textContent = getDefaultCanvasName());
      rendererStartupState.complete('project');
      if (!(await rendererStartupState.settled).ready) return;
      run24({
        wrapEl: wrapEl2,
        canvasEl: canvasEl2,
        animate: true,
        afterHidden: () => {
          (run41(projectId11), run42(projectId11));
          if (missingDefaultProject)
            window.showToast?.(t('projectLifecycle.defaultProjectMissing'), 'warning');
        },
      });
    } catch (value134) {
      rendererStartupState.fail('project-hydration');
      // An unsuccessful read must not leave an old project ID attached to an empty store.
      (console.error('Failed to init app:', value134),
        (window._isAppLoaded = false),
        (window.currentProjectId = ''),
        (window._v2CurrentFile = ''),
        (window._v2CurrentRecentProjectId = ''),
        (window._v2CurrentProjectDisplayPath = ''),
        (window._v2CurrentProjectLastModified = 0),
        window.showToast?.(
          t(
            value134?.code === 'UNSAFE_PROJECT_RECOVERY'
              ? 'projectLifecycle.recoveryReadFailedNoSave'
              : 'projectLifecycle.projectLoadFailedNoSave',
          ),
          'error',
        ),
        run24({ wrapEl: wrapEl2, canvasEl: canvasEl2, animate: true }));
    }
  }
  function run44(value135) {
    const enabled38 = value135?.dataTransfer?.types;
    return !!enabled38 && Array.from(enabled38).includes('Files');
  }
  function run45(event14) {
    if (!run44(event14)) return false;
    event14.preventDefault();
    if (event14.dataTransfer) event14.dataTransfer.dropEffect = 'copy';
    return true;
  }
  function onDocumentDragEnter(value136) {
    run45(value136);
  }
  function onDocumentDragOver(event15) {
    if (run45(event15)) return;
    event15.preventDefault();
  }
  function onDocumentDrop(event16) {
    event16.preventDefault();
    const error2 = event16.dataTransfer.files[0];
    if (!error2) return;
    if (/\.aicpkg$/i.test(error2.name || '')) {
      const run46 = window._v2ImportProjectPackageByPath;
      if (typeof run46 !== 'function') {
        window.showToast?.(t('projectLifecycle.packageUnsupported'), 'error');
        return;
      }
      let enabled39 = '';
      try {
        enabled39 = String(window.electronAPI?.getPathForFile?.(error2) || '').trim();
      } catch {
        enabled39 = '';
      }
      if (!enabled39) {
        window.showToast?.(t('projectLifecycle.packagePathMissing'), 'error');
        return;
      }
      void run46(enabled39);
      return;
    }
    if (!error2.name.endsWith('.json')) return;
    const fileReader = new FileReader();
    ((fileReader.onload = (event17) => {
      try {
        const requireProjectDocument2 = requireProjectDocument(JSON.parse(event17.target.result));
        if (Array.isArray(requireProjectDocument2.canvases) && !requireProjectDocument2.canvases.length)
          throw new Error('空画布存档不能覆盖当前工程');
        const multiData10 = project.resolveCanvasData(requireProjectDocument2),
          value137 = run21(multiData10),
          value138 =
            value137.canvases.find((item17) => item17.id === value137.activeCanvasId) || value137.canvases[0],
          projectId12 = error2.name.replace('.json', ''),
          value139 = CanvasTabManager._canvases.find((error3) => error3.name === projectId12);
        value139
          ? CanvasTabManager.switchTo(value139.id)
          : (CanvasTabManager.addCanvas(),
            CanvasTabManager.renameCanvas(CanvasTabManager._activeId, projectId12));
        (applySourceNamesFromFileNameToCanvas(value138),
          CanvasTabManager.hydrateActiveCanvasSnapshot(value138),
          CanvasTabManager.markCanvasClean(CanvasTabManager._activeId),
          commit());
        const el4 = document.getElementById('projectNameText');
        if (el4) el4.textContent = projectId12;
        (CanvasTabManager.renderTabs(),
          (window._v2CurrentFile = error2.name),
          (window.currentProjectId = projectId12),
          run27({ projectId: projectId12, projectName: projectId12, multiData: multiData10 }),
          run42(projectId12),
          window.showToast?.(t('projectLifecycle.localArchiveLoaded', { name: projectId12 })));
      } catch (value140) {
        (console.error('[Drop] 读取本地 JSON 失败:', value140),
          window.showToast?.(t('projectLifecycle.jsonArchiveParseFailed'), 'error'));
      }
    }),
      (fileReader.onerror = () => window.showToast?.(t('projectLifecycle.jsonArchiveParseFailed'), 'error')),
      fileReader.readAsText(error2));
  }
  function bindHeaderProjectNameAutoSave() {
    const el5 = document.getElementById('projectNameText');
    if (!el5) return;
    const async2 = async () => {
      if (!window.currentProjectId) return;
      const enabled40 = el5.textContent.trim();
      if (!enabled40) return;
      try {
        CanvasTabManager._flushCurrentCanvas();
        const value141 = CanvasTabManager.getMultiData(),
          response3 = await project.saveProject(enabled40, value141);
        (response3?.success && CanvasTabManager.markAllCanvasesClean(), triggerLocalCacheSave());
      } catch (value142) {
        console.error('Failed to save project name:', value142);
      }
    };
    (el5.addEventListener('blur', async2),
      el5.addEventListener('keydown', (event18) => {
        event18.key === 'Enter' && (event18.preventDefault(), el5.blur());
      }));
  }
  function bindLogoProjectSave() {
    const el6 = document.getElementById('logoLink');
    if (!el6) return;
    el6.addEventListener('click', async () => {
      (window.currentProjectId && (await window.ProjectManager.saveCurrentProject()),
        console.log('Gallery view disabled by user.'));
    });
  }
  return {
    V2LocalCache: V2LocalCache,
    initApp: initApp,
    onBeforeUnload: onBeforeUnload,
    onPageHide: onPageHide,
    onVisibilityChange: onVisibilityChange,
    onDocumentDragEnter: onDocumentDragEnter,
    onDocumentDragOver: onDocumentDragOver,
    onDocumentDrop: onDocumentDrop,
    triggerLocalCacheSave: triggerLocalCacheSave,
    flushPendingLocalCacheSaveNow: flushPendingLocalCacheSaveNow,
    bindPersistRevisionAutoSave: bindPersistRevisionAutoSave,
    bindHeaderProjectNameAutoSave: bindHeaderProjectNameAutoSave,
    bindLogoProjectSave: bindLogoProjectSave,
  };
}
