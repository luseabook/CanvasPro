import { generateId } from '../math.js';
import {
  applyFeatureSelectionsToNodeData,
  captureFeatureSelectionsFromNodePatch,
  sanitizeFeatureSelectionsRecord,
} from '../../modules/featureSelectionMemory.js';
import {
  normalizeImageToolbarLayout,
  serializeImageToolbarLayout,
} from '../../modules/imageToolbarLayoutMemory.js';
import {
  normalizeVideoToolbarLayout,
  serializeVideoToolbarLayout,
} from '../../modules/videoToolbarLayoutMemory.js';
import { normalizeCommentNoteJumpShortcut } from '../../modules/commentNoteJumpShortcut.js';
import { sanitizeSerializedCanvasData } from '../../utils/thumbnailPersistence.js';
import { sanitizePromptHtml } from '../../utils/dom.js';
import {
  isGenerationTaskTerminalStatus,
  resolveJobStatusFromTaskStatus,
} from '../generationTaskLifecycle.js';
import { createDefaultStoryboardScriptState } from '../storyboardScriptFactory.js';
import {
  cloneStoryboardCellForSwap,
  cloneStoryboardCellForSwapDestination,
  isStoryboardCellEmpty,
  normalizeEmptyStoryboardCell,
  resolveStoryboardCellSourceIndex,
} from '../storyboardCellUtils.js';
import { cloneStoryboard3DProjects, createStoryboard3DProjectActions } from './storyboard3dProjectState.js';
import { createNodeFieldSubscriptions } from './nodeFieldSubscriptions.js';
import { sanitizeCanvasNodeMediaPatchForStore } from '../../services/canvasMediaLocalService.js';
import {
  canAppendInputKindWithinLimit,
  canTargetReceiveInputs,
  getTargetInputPolicy,
  hasUsableInputNodeSource,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from '../../modules/modelInputPolicy.js';
import { collectGroupOutputIncomingEdges, isGroupNodeData } from '../../modules/groupDynamicOutput.js';
import { getFixedInputSlotConfigFromManifest } from '../../modules/fixedInputAssetRefs.js';
import {
  isModelApiModel,
  isWorkflowModel,
  RH_VIDEO_V54_MODEL_ID,
  resolveModelProvider,
} from '../../manifests/index.js';
import {
  createInitialState,
  createInitialWorkflowDraftState,
  createInitialWorkflowUiState,
} from './legacyInitialState.js';
function deepClone(value) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(value);
    } catch {}
  return JSON.parse(JSON.stringify(value));
}
function stripPersistedRichText(item) {
  if (typeof item !== 'string') return item;
  return item.replace(/<[^>]*>/g, '');
}
function sanitizePersistedPromptHtml(key) {
  if (typeof key !== 'string') return key;
  return sanitizePromptHtml(key);
}
function cloneShallowObjectArray(list) {
  if (!Array.isArray(list)) return list;
  return list.map((args) => (args && typeof args === 'object' ? { ...args } : args));
}
function cloneViewportSnapshot(args2) {
  if (!args2 || typeof args2 !== 'object') return args2;
  return { ...args2 };
}
function cloneEdgeSnapshot(args3) {
  if (!args3 || typeof args3 !== 'object') return args3;
  return { ...args3 };
}
function cloneAssetSnapshot(args4) {
  if (!args4 || typeof args4 !== 'object') return args4;
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(args4);
    } catch {}
  try {
    return JSON.parse(JSON.stringify(args4));
  } catch {}
  return { ...args4 };
}
function cloneWorkflowSnapshot(enabled) {
  if (!enabled || typeof enabled !== 'object') return enabled;
  return deepClone(enabled);
}
function isBlobLikeUrl(index) {
  return typeof index === 'string' && /^blob:/i.test(index.trim());
}
function sanitizePanoramaStateForPersistence(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return enabled2;
  const deepClone2 = deepClone(enabled2);
  return (
    deepClone2.ui && typeof deepClone2.ui === 'object' && delete deepClone2.ui.isEditing,
    deepClone2.panorama &&
      typeof deepClone2.panorama === 'object' &&
      (delete deepClone2.panorama.isLoaded,
      delete deepClone2.panorama.error,
      isBlobLikeUrl(deepClone2.panorama.imageUrl) && delete deepClone2.panorama.imageUrl,
      isBlobLikeUrl(deepClone2.panorama.localPath) && delete deepClone2.panorama.localPath),
    deepClone2.capture &&
      typeof deepClone2.capture === 'object' &&
      (delete deepClone2.capture.pending,
      delete deepClone2.capture.error,
      delete deepClone2.capture.lastCaptureAt),
    deepClone2
  );
}
function sanitizePanoramaStateForHistory(result) {
  const sanitizePanoramaStateForPersistence2 = sanitizePanoramaStateForPersistence(result);
  if (!sanitizePanoramaStateForPersistence2 || typeof sanitizePanoramaStateForPersistence2 !== 'object')
    return sanitizePanoramaStateForPersistence2;
  return (delete sanitizePanoramaStateForPersistence2.viewport, sanitizePanoramaStateForPersistence2);
}
function cloneNodeSnapshot(
  args5,
  {
    stripRichText: stripRichText = false,
    hydratedAt: hydratedAt = null,
    featureSelections: featureSelections = null,
    stripPanoramaViewport: stripPanoramaViewport = false,
    preserveLiveGeneration: preserveLiveGeneration = false,
  } = {},
) {
  if (!args5 || typeof args5 !== 'object') return args5;
  const data = { ...args5 };
  normalizeNodeModel(data);
  stripRichText &&
    (data.content !== undefined && (data.content = stripPersistedRichText(data.content)),
    data.prompt !== undefined && (data.prompt = sanitizePersistedPromptHtml(data.prompt)));
  Array.isArray(args5.cells) && (data.cells = cloneShallowObjectArray(args5.cells));
  Array.isArray(args5.images) && (data.images = cloneShallowObjectArray(args5.images));
  Array.isArray(args5.videos) && (data.videos = cloneShallowObjectArray(args5.videos));
  args5.sceneNode &&
    typeof args5.sceneNode === 'object' &&
    (data.sceneNode = stripPanoramaViewport
      ? sanitizePanoramaStateForHistory(args5.sceneNode)
      : sanitizePanoramaStateForPersistence(args5.sceneNode));
  args5.panorama360Node &&
    typeof args5.panorama360Node === 'object' &&
    (data.panorama360Node = stripPanoramaViewport
      ? sanitizePanoramaStateForHistory(args5.panorama360Node)
      : sanitizePanoramaStateForPersistence(args5.panorama360Node));
  typeof hydratedAt === 'number' &&
    Number.isFinite(hydratedAt) &&
    typeof data.generationStartTime === 'number' &&
    Number.isFinite(data.generationStartTime) &&
    data.generationDuration == null &&
    !shouldPreserveRunningGenerationOnHydrate(data, {
      preserveLiveGeneration: preserveLiveGeneration,
    }) &&
    finalizeHydratedGenerationSnapshot(data, Math.max(1, hydratedAt - data.generationStartTime));
  if (typeof data._bizRev !== 'number') data._bizRev = 1;
  return featureSelections ? applyFeatureSelectionsToNodeData(data, featureSelections) : data;
}
function shallowEqual(options, target) {
  if (options === target) return true;
  if (typeof options !== typeof target) return false;
  if (typeof options !== 'object' || options === null || target === null) return false;
  const list2 = Object.keys(options),
    list3 = Object.keys(target);
  if (list2.length !== list3.length) return false;
  for (const source of list2) {
    if (!list3.includes(source) || options[source] !== target[source]) return false;
  }
  return true;
}
function isPlainObject(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object' || Array.isArray(enabled3)) return false;
  const next = Object.getPrototypeOf(enabled3);
  return next === Object.prototype || next === null;
}
function snapshotSelectorValue(list4) {
  if (list4 == null || typeof list4 !== 'object') return list4;
  if (Array.isArray(list4)) return list4.slice();
  if (isPlainObject(list4)) return { ...list4 };
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(list4);
    } catch {}
  return list4;
}
function _isSameStoreValue(current, entry) {
  return Object.is(current, entry);
}
function _isPatchNoop(enabled4, enabled5) {
  if (!enabled4 || !enabled5 || typeof enabled5 !== 'object') return false;
  const list5 = Object.keys(enabled5);
  if (list5.length === 0) return true;
  return list5.every((item2) => _isSameStoreValue(enabled4[item2], enabled5[item2]));
}
function _trimText(record) {
  return typeof record === 'string' ? record.trim() : '';
}
const HISTORY_RUNNING_STATUSES = new Set([
    'pending',
    'queued',
    'queueing',
    'waiting',
    'submitted',
    'submitting',
    'submit',
    'running',
    'processing',
    'generating',
    'in_progress',
    'in-progress',
    'recovering',
  ]),
  HISTORY_GENERATION_STATUS_FIELDS = Object.freeze([
    'jobStatus',
    'rhTaskStatus',
    'dreaminaTaskStatus',
    'dreaminaTaskPhase',
    'asyncTaskStatus',
  ]);
function normalizeHistoryStatus(payload) {
  return String(payload || '')
    .trim()
    .toLowerCase();
}
function hasUsableImageResultItem(enabled6) {
  if (!enabled6 || typeof enabled6 !== 'object') return false;
  if (_trimText(enabled6.error)) return false;
  return !!(
    _trimText(enabled6.imageUrl) ||
    _trimText(enabled6.sourceUrl) ||
    _trimText(enabled6.thumbUrl) ||
    _trimText(enabled6.localPath) ||
    _trimText(enabled6.originalLocalPath) ||
    _trimText(enabled6.displayLocalPath) ||
    _trimText(enabled6.thumbLocalPath) ||
    _trimText(enabled6.thumbId) ||
    _trimText(enabled6.sourceId)
  );
}
function hasResolvedAiImageResultSnapshot(enabled7) {
  if (!enabled7 || typeof enabled7 !== 'object') return false;
  if (String(enabled7.type || '') !== 'ai-image') return false;
  const list6 = Array.isArray(enabled7.images) ? enabled7.images : [];
  if (list6.some((item3) => hasUsableImageResultItem(item3))) return true;
  return hasUsableImageResultItem(enabled7);
}
function isRunningAiImageHistorySnapshot(enabled8) {
  if (!enabled8 || typeof enabled8 !== 'object') return false;
  if (String(enabled8.type || '') !== 'ai-image') return false;
  if (enabled8.isGenerating === true) return true;
  if (
    enabled8.rhTaskRecovering === true ||
    enabled8.dreaminaTaskRecovering === true ||
    enabled8.asyncTaskRecovering === true
  )
    return true;
  return HISTORY_GENERATION_STATUS_FIELDS.some((item4) =>
    HISTORY_RUNNING_STATUSES.has(normalizeHistoryStatus(enabled8[item4])),
  );
}
function normalizeAiImageRunningHistorySnapshot(handle) {
  if (!isRunningAiImageHistorySnapshot(handle)) return handle;
  const hasResolvedAiImageResultSnapshot2 = hasResolvedAiImageResultSnapshot(handle);
  return (
    (handle.isGenerating = false),
    (handle.jobStatus = hasResolvedAiImageResultSnapshot2 ? 'success' : null),
    (handle.jobError = null),
    (handle.rhStatusMessage = null),
    (handle.rhStatusCode = null),
    (handle.rhTaskId = ''),
    (handle.rhTaskStatus = 'idle'),
    (handle.rhTaskRecovering = false),
    (handle.dreaminaSubmitId = ''),
    (handle.dreaminaTaskStatus = 'idle'),
    (handle.dreaminaTaskPhase = 'done'),
    (handle.dreaminaTaskLabel = ''),
    (handle.dreaminaTaskRecovering = false),
    (handle.dreaminaTaskLastRaw = {}),
    (handle.asyncTaskId = ''),
    (handle.asyncTaskStatus = 'idle'),
    (handle.asyncTaskRecovering = false),
    handle
  );
}
function _getStoryboardCellPosition(state, col) {
  const config = Math.max(1, Math.round(Number(state?.cols) || 1));
  return { col: col % config, row: Math.floor(col / config) };
}
function _placeStoryboardCellForSwap(scope, input, output, value2, value3, value4) {
  Object.assign(scope, _getStoryboardCellPosition(value3, value4));
  if (isStoryboardCellEmpty(input)) return normalizeEmptyStoryboardCell(scope);
  return ((scope.storyboardSourceIndex = resolveStoryboardCellSourceIndex(input, value2, output)), scope);
}
function _isValidStoryboardCellTarget(value5, count) {
  return (
    value5 &&
    value5.type === 'storyboard' &&
    Array.isArray(value5.cells) &&
    Number.isInteger(count) &&
    count >= 0 &&
    count < value5.cells.length
  );
}
const LEGACY_VIDEO_EDIT_V52_MODEL_ID = 'runninghub/2037339851183366146';
function normalizeNodeModel(enabled9) {
  if (!enabled9 || typeof enabled9 !== 'object') return;
  String(enabled9.model || '') === LEGACY_VIDEO_EDIT_V52_MODEL_ID && (enabled9.model = RH_VIDEO_V54_MODEL_ID);
}
function normalizeNodesCollection(list7) {
  if (!list7) return;
  if (Array.isArray(list7)) {
    list7.forEach(normalizeNodeModel);
    return;
  }
  typeof list7 === 'object' && Object.values(list7).forEach(normalizeNodeModel);
}
function isDreaminaTaskNodeSnapshot(enabled10) {
  if (!enabled10 || typeof enabled10 !== 'object') return false;
  const value6 = String(enabled10.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-image', 'source-video'].includes(value6)) return false;
  const value7 = String(enabled10.provider || '')
      .trim()
      .toLowerCase(),
    value8 = String(enabled10.model || '').trim();
  return value7 === 'dreamina' || resolveModelProvider(value8, value7) === 'dreamina';
}
function inferAsyncProviderByModel(value9, value10 = '') {
  const modelProvider = resolveModelProvider(value9, '', { allowProviderHint: false });
  if (modelProvider) return modelProvider;
  const value11 = String(value10 || '')
    .trim()
    .toLowerCase();
  if (value11) return value11;
  const list8 = String(value9 || '').trim();
  if (list8 && !list8.includes('/')) return 'grsai';
  return 'grsai';
}
function isAsyncTaskNodeSnapshot(enabled11) {
  if (!enabled11 || typeof enabled11 !== 'object') return false;
  const value12 = String(enabled11.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-video', 'source-image'].includes(value12)) return false;
  const inferAsyncProviderByModel2 = inferAsyncProviderByModel(
    enabled11.model,
    enabled11.asyncTaskProvider || enabled11.provider || '',
  );
  if (
    !inferAsyncProviderByModel2 ||
    inferAsyncProviderByModel2 === 'runninghubwf' ||
    inferAsyncProviderByModel2 === 'runninghub' ||
    inferAsyncProviderByModel2 === 'dreamina'
  )
    return false;
  return true;
}
function isRunningHubTaskNodeSnapshot(enabled12) {
  if (!enabled12 || typeof enabled12 !== 'object') return false;
  const value13 = String(enabled12.type || '')
      .trim()
      .toLowerCase(),
    value14 = String(enabled12.provider || '')
      .trim()
      .toLowerCase(),
    value15 = String(enabled12.model || '').trim(),
    modelProvider2 = resolveModelProvider(value15, value14, { allowProviderHint: false }),
    isWorkflowModel2 = isWorkflowModel(value15, value14 || 'runninghubwf'),
    value16 = modelProvider2 === 'runninghub' && isModelApiModel(value15, 'runninghub');
  if (value13 === 'ai-audio') return value14 === 'runninghubwf';
  if (value13 === 'source-video') return value14 === 'runninghubwf' || isWorkflowModel2;
  if (value13 === 'source-image')
    return value14 === 'runninghubwf' || value14 === 'runninghub' || isWorkflowModel2 || value16;
  if (value13 === 'source-audio') return value14 === 'runninghubwf' && isWorkflowModel2;
  if (value13 === 'ai-video') return value14 === 'runninghubwf' && isWorkflowModel2;
  if (value13 === 'ai-image')
    return isWorkflowModel2 || value16 || value14 === 'runninghub' || value14 === 'runninghubwf';
  return false;
}
function hasResolvedVideoResultSnapshot(enabled13) {
  if (!enabled13 || typeof enabled13 !== 'object') return false;
  const list9 = Array.isArray(enabled13.videos) ? enabled13.videos : [];
  if (list9.length > 0) return true;
  return !!String(enabled13.videoUrl || '').trim() || !!String(enabled13.localPath || '').trim();
}
const HYDRATE_ACTIVE_STATUS_FIELDS = Object.freeze([
    'jobStatus',
    'rhTaskStatus',
    'dreaminaTaskStatus',
    'dreaminaTaskPhase',
    'asyncTaskStatus',
    'mediaTaskStatus',
  ]),
  HYDRATE_RECOVERING_FIELDS = Object.freeze([
    'rhTaskRecovering',
    'dreaminaTaskRecovering',
    'asyncTaskRecovering',
  ]);
function finalizeHydratedGenerationSnapshot(value17, value18) {
  value17.generationDuration = value18;
  if (value17.isGenerating === true) value17.isGenerating = false;
  for (const value19 of HYDRATE_ACTIVE_STATUS_FIELDS) {
    const value20 = String(value17[value19] || '').trim();
    if (value20 && !isGenerationTaskTerminalStatus(value20)) value17[value19] = 'cancelled';
  }
  for (const value21 of HYDRATE_RECOVERING_FIELDS) if (value17[value21] === true) value17[value21] = false;
}
function shouldPreserveRunningGenerationOnHydrate(
  value22,
  { preserveLiveGeneration: preserveLiveGeneration = false } = {},
) {
  if (preserveLiveGeneration && value22?.isGenerating === true) {
    const enabled14 = [
      value22.dreaminaTaskPhase,
      value22.dreaminaTaskStatus,
      value22.asyncTaskStatus,
      value22.rhTaskStatus,
      value22.mediaTaskStatus,
      value22.jobStatus,
    ].some((item5) => {
      const enabled15 = String(item5 || '')
        .trim()
        .toLowerCase();
      return !!enabled15 && enabled15 !== 'idle' && isGenerationTaskTerminalStatus(enabled15);
    });
    if (!enabled14) return true;
  }
  if (isDreaminaTaskNodeSnapshot(value22)) {
    const enabled16 = String(value22.dreaminaSubmitId || '').trim();
    if (!enabled16) return false;
    const value23 = String(value22.dreaminaTaskPhase || '')
        .trim()
        .toLowerCase(),
      value24 = String(value22.dreaminaTaskStatus || '')
        .trim()
        .toLowerCase();
    if (isGenerationTaskTerminalStatus(value23)) return false;
    if (isGenerationTaskTerminalStatus(value24)) return false;
    return true;
  }
  if (isAsyncTaskNodeSnapshot(value22)) {
    const enabled17 = String(value22.asyncTaskId || '').trim();
    if (!enabled17) return false;
    const value25 = String(value22.asyncTaskKind || '')
        .trim()
        .toLowerCase(),
      value26 = String(value22.type || '')
        .trim()
        .toLowerCase();
    if (value25 === 'image' && !['ai-image', 'source-image'].includes(value26)) return false;
    if (value25 === 'video' && !['ai-video', 'source-video'].includes(value26)) return false;
    const value27 = String(value22.asyncTaskStatus || '')
      .trim()
      .toLowerCase();
    if (isGenerationTaskTerminalStatus(value27)) return false;
    return true;
  }
  if (!isRunningHubTaskNodeSnapshot(value22)) return false;
  const enabled18 = String(value22.rhTaskId || '').trim();
  if (!enabled18) return false;
  const value28 = String(value22.rhTaskStatus || '')
    .trim()
    .toLowerCase();
  if (isGenerationTaskTerminalStatus(value28)) return false;
  return true;
}
function createStore() {
  let args6 = createInitialState();
  const subscribeNodeField = createNodeFieldSubscriptions(() => args6.nodes),
    list10 = [],
    list11 = [],
    list12 = [];
  let count2 = 0,
    value29 = false,
    handler = () => true;
  function run() {
    args6._persistRev = (args6._persistRev || 0) + 1;
  }
  function run2() {
    args6._edgesRev = (args6._edgesRev || 0) + 1;
  }
  function setViewportPersistPolicy(value30) {
    handler = typeof value30 === 'function' ? value30 : () => true;
  }
  function run3(value31, args7) {
    if (!args7 || typeof args7 !== 'object') return args7;
    const value32 = { ...args7 },
      status = (value33) => Object.prototype.hasOwnProperty.call(value32, value33),
      handler2 = () => {
        const value34 = [value32.images, value32.videos].filter(Array.isArray);
        for (const value35 of value34) {
          let enabled19 = '',
            enabled20 = false;
          for (const error of value35) {
            if (!error || typeof error !== 'object') continue;
            const value36 = String(error.error || error.message || '').trim();
            if (value36 && !enabled19) enabled19 = value36;
            String(
              error.localPath ||
                error.originalLocalPath ||
                error.displayLocalPath ||
                error.thumbLocalPath ||
                error.imageUrl ||
                error.videoUrl ||
                error.thumbUrl ||
                error.sourceUrl ||
                '',
            ).trim() && (enabled20 = true);
          }
          if (enabled19 && !enabled20) return enabled19;
        }
        return String(value32.jobError || '').trim();
      },
      enabled21 = status('isGenerating'),
      enabled22 = handler2(),
      handler3 = (value37) =>
        String(value37 || '')
          .trim()
          .toLowerCase(),
      active = (value38) => ['error', 'failed', 'fail', 'cancelled', 'canceled'].includes(handler3(value38)),
      handler4 = (value39) => {
        if (status(value39)) return String(value32[value39] || '').trim();
        return String(value31?.[value39] || '').trim();
      },
      handler5 = () => !!handler4('dreaminaSubmitId'),
      active2 = (value40) => {
        if (active(value40)) return true;
        if (handler5()) return true;
        if (handler3(value40) === 'idle') return false;
        return handler3(value32.dreaminaTaskStatus) !== 'idle';
      },
      list13 = [
        {
          status: status('asyncTaskStatus') ? value32.asyncTaskStatus : null,
          active:
            active(value32.asyncTaskStatus) ||
            !!handler4('asyncTaskId') ||
            handler3(value32.asyncTaskStatus) !== 'idle',
        },
        {
          status: status('rhTaskStatus') ? value32.rhTaskStatus : null,
          active:
            active(value32.rhTaskStatus) ||
            !!handler4('rhTaskId') ||
            handler3(value32.rhTaskStatus) !== 'idle',
        },
        {
          status: status('dreaminaTaskStatus') ? value32.dreaminaTaskStatus : null,
          active: active2(value32.dreaminaTaskStatus),
        },
        {
          status: status('dreaminaTaskPhase') ? value32.dreaminaTaskPhase : null,
          active: active2(value32.dreaminaTaskPhase),
        },
        { status: status('mediaTaskStatus') ? value32.mediaTaskStatus : null, active: true },
      ].filter((response) => response.active === true && String(response.status || '').trim()),
      enabled23 = list13.find((response2) => isGenerationTaskTerminalStatus(response2.status))?.status,
      value41 = status('mediaTaskStatus')
        ? String(value32.mediaTaskStatus || '')
            .trim()
            .toLowerCase()
        : '';
    !enabled21 && (value41 === 'waiting' || value41 === 'processing') && (value32.isGenerating = true);
    if (enabled22) {
      ((value32.isGenerating = false), (value32.jobStatus = 'error'), (value32.jobError = enabled22));
      if (status('dreaminaTaskStatus')) value32.dreaminaTaskStatus = 'failed';
      if (status('dreaminaTaskPhase')) value32.dreaminaTaskPhase = 'failed';
      if (status('dreaminaTaskLabel')) value32.dreaminaTaskLabel = enabled22;
      if (status('dreaminaTaskRecovering')) value32.dreaminaTaskRecovering = false;
      if (status('asyncTaskStatus')) value32.asyncTaskStatus = 'failed';
      if (status('asyncTaskRecovering')) value32.asyncTaskRecovering = false;
      if (status('rhTaskStatus')) value32.rhTaskStatus = 'failed';
      if (status('rhTaskRecovering')) value32.rhTaskRecovering = false;
    }
    if (enabled23) {
      value32.isGenerating = false;
      const jobStatusFromTaskStatus = resolveJobStatusFromTaskStatus(enabled23, value32.jobStatus ?? null);
      if (jobStatusFromTaskStatus !== undefined) value32.jobStatus = jobStatusFromTaskStatus;
      (status('dreaminaTaskStatus') || status('dreaminaTaskPhase')) &&
        (value32.dreaminaTaskRecovering = false);
      if (status('asyncTaskStatus')) value32.asyncTaskRecovering = false;
      if (status('rhTaskStatus')) value32.rhTaskRecovering = false;
    }
    if (value32.isGenerating === true) {
      if (!status('jobStatus')) value32.jobStatus = 'running';
      const count3 = Number(value32.generationStartTime);
      if (!Number.isFinite(count3) || count3 <= 0) {
        const count4 = Number(value31?.generationStartTime);
        value32.generationStartTime = Number.isFinite(count4) && count4 > 0 ? count4 : Date.now();
      }
      return ((value32.generationDuration = null), value32);
    }
    const value42 = value31?.isGenerating === true,
      value43 =
        value32.isGenerating === false &&
        value32.generationDuration == null &&
        (value42 || !!enabled22 || !!enabled23);
    if (value43) {
      const count5 = status('generationStartTime')
        ? Number(value32.generationStartTime)
        : Number(value31?.generationStartTime);
      value32.generationDuration =
        Number.isFinite(count5) && count5 > 0
          ? Math.max(0, Date.now() - count5)
          : value42
            ? 0
            : value32.generationDuration;
    }
    return value32;
  }
  function run4() {
    if (count2 > 0) {
      value29 = true;
      return;
    }
    subscribeNodeField.flush();
    for (const run5 of list11) {
      run5(args6);
    }
    if (list10.length > 0) {
      const deepClone3 = deepClone(args6);
      for (const run6 of list10) {
        run6(deepClone3);
      }
    }
    for (const { selector: selector, callback: callback, isEqual: isEqual, lastValue: lastValue } of list12) {
      const value44 = selector(args6);
      !isEqual(lastValue.value, value44) &&
        ((lastValue.value = snapshotSelectorValue(value44)), callback(value44));
    }
  }
  function batch(handler6) {
    if (typeof handler6 !== 'function') throw new TypeError('[store] batch() 的参数必须是函数');
    count2++;
    try {
      return handler6();
    } finally {
      (count2--, count2 === 0 && value29 && ((value29 = false), run4()));
    }
  }
  function requestRender() {
    run4();
  }
  function invalidateUi() {
    run4();
  }
  function subscribe(handler7) {
    if (typeof handler7 !== 'function') throw new TypeError('[store] subscribe() 的参数必须是一个函数');
    return (
      list10.push(handler7),
      handler7(deepClone(args6)),
      function run7() {
        const value45 = list10.indexOf(handler7);
        value45 !== -1 && list10.splice(value45, 1);
      }
    );
  }
  function subscribeRaw(handler8) {
    if (typeof handler8 !== 'function') throw new TypeError('[store] subscribeRaw() 的参数必须是一个函数');
    return (
      list11.push(handler8),
      handler8(args6),
      function run8() {
        const value46 = list11.indexOf(handler8);
        value46 !== -1 && list11.splice(value46, 1);
      }
    );
  }
  function subscribeSelector(selector2, callback2, value47 = {}) {
    if (typeof selector2 !== 'function')
      throw new TypeError('[store] subscribeSelector() 的 selector 必须是函数');
    if (typeof callback2 !== 'function')
      throw new TypeError('[store] subscribeSelector() 的 callback 必须是函数');
    const isEqual2 = value47.isEqual || shallowEqual,
      value48 = selector2(args6),
      value49 = {
        selector: selector2,
        callback: callback2,
        isEqual: isEqual2,
        lastValue: { value: snapshotSelectorValue(value48) },
      };
    return (
      list12.push(value49),
      callback2(value48),
      function run9() {
        const value50 = list12.indexOf(value49);
        value50 !== -1 && list12.splice(value50, 1);
      }
    );
  }
  function addNode(enabled24) {
    if (!enabled24 || !enabled24.id) throw new Error('[store] addNode() 需要提供含有 id 字段的节点数据');
    const nodeData = applyFeatureSelectionsToNodeData(
        JSON.parse(JSON.stringify(enabled24)),
        args6.ui?.featureSelections || {},
      ),
      sanitizeCanvasNodeMediaPatchForStore2 = sanitizeCanvasNodeMediaPatchForStore(nodeData),
      value51 = {
        text: '文本块',
        'ai-text': '生成文本',
        'ai-image': '生成图像',
        'ai-video': '生成视频',
        'ai-audio': '生成音频',
        'source-text': '源文本',
        'comment-note': '',
        'source-image': '源图像',
        'source-video': '源视频',
        'source-audio': '源音频',
        'panorama-scene': '3D导演台',
        'panorama-360': '360全景图',
        'storyboard-script': '分镜脚本',
        group: '组合',
        storyboard: '宫格分镜',
        image: '源图像',
        audio: '源音频',
        video: '源视频',
      },
      name = Object.prototype.hasOwnProperty.call(value51, sanitizeCanvasNodeMediaPatchForStore2.type)
        ? value51[sanitizeCanvasNodeMediaPatchForStore2.type]
        : '未命名';
    sanitizeCanvasNodeMediaPatchForStore2.type === 'storyboard' &&
      (!Array.isArray(sanitizeCanvasNodeMediaPatchForStore2.cells)
        ? (sanitizeCanvasNodeMediaPatchForStore2.cells = [])
        : (sanitizeCanvasNodeMediaPatchForStore2.cells = sanitizeCanvasNodeMediaPatchForStore2.cells.map(
            (args8) => ({ ...args8, id: generateId('cell') }),
          )));
    sanitizeCanvasNodeMediaPatchForStore2.type === 'storyboard-script' &&
      (sanitizeCanvasNodeMediaPatchForStore2.storyboardScript = createDefaultStoryboardScriptState(
        sanitizeCanvasNodeMediaPatchForStore2.storyboardScript,
      ));
    sanitizeCanvasNodeMediaPatchForStore2.type === 'comment-note' &&
      (sanitizeCanvasNodeMediaPatchForStore2.jumpShortcut = normalizeCommentNoteJumpShortcut(
        sanitizeCanvasNodeMediaPatchForStore2.jumpShortcut,
      ));
    const { _bizRev: _bizRev, ...args9 } = sanitizeCanvasNodeMediaPatchForStore2,
      args10 = run3(null, args9),
      value52 = { parentId: null, name: name, _bizRev: 1, ...args10 };
    (captureFeatureSelectionsFromNodePatch(value52, value52, args6.ui?.featureSelections || {}),
      (args6.nodes[value52.id] = value52),
      subscribeNodeField.touch(value52.id),
      (args6._nodeCount = (args6._nodeCount || 0) + 1),
      run(),
      value52.parentId && run10(value52.id, value52.parentId),
      run4());
  }
  function run10(value53, value54, value55 = null) {
    (value55 && args6._parentToChildren[value55]?.delete(value53),
      value54 &&
        (!args6._parentToChildren[value54] && (args6._parentToChildren[value54] = new Set()),
        args6._parentToChildren[value54].add(value53)));
  }
  function run11(value56, value57 = null) {
    if (value57) {
      const map = args6._parentToChildren[value57];
      map && (map.delete(value56), map.size === 0 && delete args6._parentToChildren[value57]);
    }
    args6._parentToChildren[value56] && delete args6._parentToChildren[value56];
  }
  function run12(args11) {
    const map2 = new Set(args11),
      list14 = [...args11];
    while (list14.length > 0) {
      const value58 = list14.pop(),
        enabled25 = args6._parentToChildren[value58];
      if (!enabled25) continue;
      for (const value59 of enabled25) {
        if (!args6.nodes[value59]) continue;
        if (map2.has(value59)) continue;
        (map2.add(value59), list14.push(value59));
      }
    }
    return map2;
  }
  function updateNodePosition(value60, value61, value62) {
    moveNodes([value60], value61, value62);
  }
  function moveNodes(list15, value63, value64) {
    if (!list15 || list15.length === 0) return;
    const count6 = Number(value63),
      count7 = Number(value64);
    if (!Number.isFinite(count6) || !Number.isFinite(count7)) return;
    if (count6 === 0 && count7 === 0) return;
    const value65 = run12(list15);
    let enabled26 = false;
    for (const value66 of value65) {
      const box = args6.nodes[value66];
      if (!box) continue;
      const value67 = (box.x || 0) + count6,
        value68 = (box.y || 0) + count7;
      if (value67 === box.x && value68 === box.y) continue;
      ((box.x = value67), (box.y = value68), (enabled26 = true));
    }
    if (!enabled26) return;
    (run(), run4());
  }
  function run13(value69, enabled27, dx, dy) {
    if (!enabled27) return;
    const value70 = value69[enabled27];
    if (value70) {
      ((value70.dx += dx), (value70.dy += dy));
      return;
    }
    value69[enabled27] = { dx: dx, dy: dy };
  }
  function moveNodesByOffsets(enabled28) {
    if (!enabled28 || typeof enabled28 !== 'object') return;
    const value71 = {};
    for (const [enabled29, enabled30] of Object.entries(enabled28)) {
      if (!enabled29 || !enabled30 || !args6.nodes[enabled29]) continue;
      const dx2 = Number(enabled30.dx),
        dy2 = Number(enabled30.dy);
      if (!Number.isFinite(dx2) || !Number.isFinite(dy2)) continue;
      if (dx2 === 0 && dy2 === 0) continue;
      value71[enabled29] = { dx: dx2, dy: dy2 };
    }
    const list16 = Object.keys(value71);
    if (list16.length === 0) return;
    const map3 = new Set(list16),
      value72 = {};
    for (const value73 of list16) {
      const value74 = value71[value73];
      run13(value72, value73, value74.dx, value74.dy);
      const list17 = [value73];
      while (list17.length > 0) {
        const value75 = list17.pop(),
          enabled31 = args6._parentToChildren[value75];
        if (!enabled31) continue;
        for (const value76 of enabled31) {
          if (!args6.nodes[value76]) continue;
          if (map3.has(value76)) continue;
          (run13(value72, value76, value74.dx, value74.dy), list17.push(value76));
        }
      }
    }
    let enabled32 = false;
    for (const [value77, value78] of Object.entries(value72)) {
      const box2 = args6.nodes[value77];
      if (!box2) continue;
      const value79 = (box2.x || 0) + value78.dx,
        value80 = (box2.y || 0) + value78.dy;
      if (value79 === box2.x && value80 === box2.y) continue;
      ((box2.x = value79), (box2.y = value80), (enabled32 = true));
    }
    if (!enabled32) return;
    (run(), run4());
  }
  function groupNodes(list18, value81) {
    if (!Array.isArray(list18) || list18.length === 0) return;
    const value82 = value81 || null;
    let enabled33 = false;
    list18.forEach((item6) => {
      const value83 = args6.nodes[item6];
      if (value83) {
        const value84 = value83.parentId || null;
        if (value84 === value82) return;
        ((value83.parentId = value82),
          (value83._bizRev = (typeof value83._bizRev === 'number' ? value83._bizRev : 0) + 1),
          run10(item6, value82, value84),
          (enabled33 = true));
      }
    });
    if (!enabled33) return;
    (run(), run4());
  }
  function run14(options2 = {}) {
    const fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(options2);
    if (!fixedInputSlotConfigFromManifest) return null;
    const targetInputPolicy = getTargetInputPolicy(options2),
      map4 = new Set(fixedInputSlotConfigFromManifest.visibleSlots || []),
      map5 = new Set(),
      map6 = new Set(),
      value85 = {},
      map7 = new Map();
    (fixedInputSlotConfigFromManifest.exclusiveGroups || []).forEach((item7) => {
      (item7.slots || []).forEach((item8) => {
        map7.set(item8, item7.id);
      });
    });
    const run15 = (value86, value87) => {
      const value88 = Number(targetInputPolicy?.maxByKind?.[value86]),
        value89 = Number(value85[value86] || 0);
      if (!Number.isFinite(value88) || value88 <= value87 || value89 >= value88) return false;
      return ((value85[value86] = value89 + 1), true);
    };
    return {
      reserveSlot(value90, value91 = null) {
        const value92 = String(value90 || '').trim();
        if (value92 === 'text') return true;
        const value93 = String(value91?.refSlot || '').trim(),
          list19 = (fixedInputSlotConfigFromManifest.slotOrderByType?.[value92] || []).filter((item9) =>
            map4.has(item9),
          );
        if (list19.length === 0) return run15(value92, 0);
        const enabled34 =
          value93 && list19.includes(value93) && map4.has(value93)
            ? value93
            : list19.find((item10) => !map5.has(item10));
        if (!enabled34 || map5.has(enabled34)) return run15(value92, list19.length);
        const value94 = map7.get(enabled34);
        if (value94 && map6.has(value94)) return run15(value92, list19.length);
        map5.add(enabled34);
        if (value94) map6.add(value94);
        return ((value85[value92] = Number(value85[value92] || 0) + 1), enabled34);
      },
      reserve(value95, value96 = null) {
        return !!this.reserveSlot(value95, value96);
      },
    };
  }
  function getIncomingEdges(targetId) {
    const nodes = args6,
      enabled35 = nodes.nodes[targetId];
    if (!enabled35) return [];
    if (!canTargetReceiveInputs(enabled35)) return [];
    const sharedGroupId = enabled35.parentId,
      policy = getTargetInputPolicy(enabled35),
      reserveInputSlot = run14(enabled35),
      counts = { text: 0, image: 0, video: 0, audio: 0 },
      list20 = [],
      list21 = [],
      directSourceIds = new Set(),
      acceptSource = (value97, edge = null) => {
        const kind = resolveEffectiveInputKind(value97, edge);
        if (!kind) return '';
        if (!isInputKindAllowed(policy, kind)) return '';
        if (!hasUsableInputNodeSource(value97, { edge: edge, kind: kind })) return '';
        return kind;
      };
    return (
      Object.values(nodes.edges || {}).forEach((args12) => {
        if (!args12 || args12.targetId !== targetId) return;
        const enabled36 = nodes.nodes[args12.sourceId];
        if (!enabled36) return;
        if (isGroupNodeData(enabled36)) return;
        const enabled37 = acceptSource(enabled36, args12);
        if (!enabled37) return;
        const refSlot = reserveInputSlot ? reserveInputSlot.reserveSlot(enabled37, args12) : '';
        if (reserveInputSlot && !refSlot) return;
        (refSlot && typeof refSlot === 'string' && !args12.refSlot
          ? list20.push({ ...args12, refSlot: refSlot })
          : list20.push(args12),
          directSourceIds.add(args12.sourceId),
          (counts[enabled37] = (counts[enabled37] || 0) + 1));
      }),
      Object.values(nodes.edges || {}).forEach((edge2) => {
        if (!edge2 || edge2.targetId !== targetId) return;
        const groupNode = nodes.nodes[edge2.sourceId];
        if (!isGroupNodeData(groupNode)) return;
        list20.push(
          ...collectGroupOutputIncomingEdges({
            edge: edge2,
            groupNode: groupNode,
            nodes: nodes.nodes,
            targetId: targetId,
            policy: policy,
            counts: counts,
            directSourceIds: directSourceIds,
            acceptSource: acceptSource,
            canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
            reserveInputSlot: reserveInputSlot
              ? (value98, value99) => reserveInputSlot.reserveSlot(value98, value99)
              : null,
          }),
        );
      }),
      sharedGroupId &&
        Object.values(nodes.edges || {}).forEach((edge3) => {
          if (!edge3 || edge3.targetId !== sharedGroupId) return;
          const groupNode2 = nodes.nodes[edge3.sourceId];
          if (!groupNode2) return;
          if (isGroupNodeData(groupNode2)) {
            const list22 = collectGroupOutputIncomingEdges({
              edge: edge3,
              groupNode: groupNode2,
              nodes: nodes.nodes,
              targetId: targetId,
              policy: policy,
              counts: counts,
              directSourceIds: directSourceIds,
              acceptSource: acceptSource,
              canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
              reserveInputSlot: reserveInputSlot
                ? (value100, value101) => reserveInputSlot.reserveSlot(value100, value101)
                : null,
            });
            list21.push(
              ...list22.map((args13) => ({
                ...args13,
                isGroupShared: true,
                sharedGroupId: sharedGroupId,
              })),
            );
            return;
          }
          const enabled38 = acceptSource(groupNode2, edge3);
          if (!enabled38) return;
          if (!canAppendInputKindWithinLimit(policy, enabled38, counts)) return;
          const refSlot2 = reserveInputSlot ? reserveInputSlot.reserveSlot(enabled38, edge3) : '';
          if (reserveInputSlot && !refSlot2) return;
          (list21.push({
            ...edge3,
            ...(refSlot2 && typeof refSlot2 === 'string' && !edge3.refSlot ? { refSlot: refSlot2 } : null),
            isGroupShared: true,
            sharedGroupId: sharedGroupId,
            effectiveTargetId: targetId,
          }),
            (counts[enabled38] = (counts[enabled38] || 0) + 1));
        }),
      [...list20, ...list21].map((item11) => cloneEdgeSnapshot(item11))
    );
  }
  function deleteNodes(value102) {
    const map8 = new Set(value102),
      list23 = [];
    for (const id of value102) {
      const parentId = args6.nodes[id];
      if (!parentId) continue;
      list23.push({ id: id, parentId: parentId.parentId || null });
    }
    for (const value103 of value102) {
      delete args6.nodes[value103];
      subscribeNodeField.touch(value103);
    }
    args6._nodeCount = Object.keys(args6.nodes).length;
    for (const { id: id2, parentId: parentId2 } of list23) {
      run11(id2, parentId2);
    }
    let value104 = false;
    for (const value105 of Object.keys(args6.edges)) {
      const value106 = args6.edges[value105];
      (map8.has(value106.sourceId) || map8.has(value106.targetId)) &&
        (delete args6.edges[value105], (value104 = true));
    }
    if (value104) run2();
    (run(), run4());
  }
  function addEdge(args14) {
    if (!args14 || !args14.id) throw new Error('[store] addEdge() 需要提供含有 id 字段的连线数据');
    ((args6.edges[args14.id] = { isThumbnailActive: true, type: null, ...args14 }), run2(), run(), run4());
  }
  function updateEdgesBatch(list24, list25) {
    (list24.forEach((item12) => {
      if (args6.edges[item12]) delete args6.edges[item12];
    }),
      list25.forEach((item13) => {
        const {
          isGroupShared: isGroupShared,
          sharedGroupId: sharedGroupId2,
          effectiveTargetId: effectiveTargetId,
          ...args15
        } = item13 || {};
        if (!args15.id) return;
        args6.edges[args15.id] = args15;
      }),
      run2(),
      run(),
      run4());
  }
  function updateViewport(x2, y2, zoom2) {
    const box3 = args6.viewport || {};
    if (box3.x === x2 && box3.y === y2 && box3.zoom === zoom2) return;
    const value107 = box3.zoom;
    args6.viewport = { x: x2, y: y2, zoom: zoom2 };
    if (value107 !== zoom2) {
      if (handler()) run();
    }
    run4();
  }
  function markViewportPersist() {
    (run(), run4());
  }
  function updateNodeData(value108, value109) {
    const args16 = args6.nodes[value108];
    if (!args16) throw new Error('[store] updateNodeData() 找不到 id 为 "' + value108 + '" 的节点');
    const value110 = JSON.parse(JSON.stringify(value109)),
      { _bizRev: _bizRev2, ...args17 } = value110;
    args17.cells &&
      Array.isArray(args17.cells) &&
      (args17.cells = args17.cells.map((args18) => ({ ...args18 })));
    const sanitizeCanvasNodeMediaPatchForStore3 = sanitizeCanvasNodeMediaPatchForStore(args17, args16),
      args19 = run3(args16, sanitizeCanvasNodeMediaPatchForStore3);
    if (_isPatchNoop(args16, args19)) return;
    const value111 = Object.prototype.hasOwnProperty.call(args19, 'parentId')
      ? args19.parentId
      : args16.parentId;
    captureFeatureSelectionsFromNodePatch(args16, args19, args6.ui?.featureSelections || {});
    const _bizRev3 = (typeof args16._bizRev === 'number' ? args16._bizRev : 0) + 1;
    ((args6.nodes[value108] = { ...args16, ...args19, _bizRev: _bizRev3 }),
      subscribeNodeField.touch(value108),
      value111 !== args16.parentId && run10(value108, value111, args16.parentId),
      run(),
      run4());
  }
  function updateNodesData(value112) {
    let value113 = false;
    for (const [value114, value115] of Object.entries(value112)) {
      const args20 = args6.nodes[value114];
      if (args20) {
        const value116 = JSON.parse(JSON.stringify(value115)),
          { _bizRev: _bizRev4, ...args21 } = value116;
        args21.cells &&
          Array.isArray(args21.cells) &&
          (args21.cells = args21.cells.map((args22) => ({ ...args22 })));
        const sanitizeCanvasNodeMediaPatchForStore4 = sanitizeCanvasNodeMediaPatchForStore(args21, args20),
          args23 = run3(args20, sanitizeCanvasNodeMediaPatchForStore4);
        if (_isPatchNoop(args20, args23)) continue;
        const value117 = Object.prototype.hasOwnProperty.call(args23, 'parentId')
          ? args23.parentId
          : args20.parentId;
        captureFeatureSelectionsFromNodePatch(args20, args23, args6.ui?.featureSelections || {});
        const _bizRev5 = (typeof args20._bizRev === 'number' ? args20._bizRev : 0) + 1;
        ((args6.nodes[value114] = { ...args20, ...args23, _bizRev: _bizRev5 }),
          subscribeNodeField.touch(value114),
          value117 !== args20.parentId && run10(value114, value117, args20.parentId),
          (value113 = true));
      }
    }
    value113 && (run(), run4());
  }
  function swapStoryboardCells(value118, value119, value120, value121) {
    const args24 = args6.nodes[value118],
      args25 = args6.nodes[value120],
      value122 = Number(value119),
      value123 = Number(value121);
    if (!_isValidStoryboardCellTarget(args24, value122) || !_isValidStoryboardCellTarget(args25, value123))
      return false;
    if (value118 === value120 && value122 === value123) return false;
    const cells = args24.cells.slice(),
      value124 = args24.cells[value122],
      value125 = args25.cells[value123];
    if (value118 === value120)
      ((cells[value123] = _placeStoryboardCellForSwap(
        cloneStoryboardCellForSwapDestination(value124),
        value124,
        args24,
        value122,
        args24,
        value123,
      )),
        (cells[value122] = _placeStoryboardCellForSwap(
          cloneStoryboardCellForSwapDestination(value125),
          value125,
          args24,
          value123,
          args24,
          value122,
        )),
        (args6.nodes[value118] = {
          ...args24,
          cells: cells,
          _bizRev: (typeof args24._bizRev === 'number' ? args24._bizRev : 0) + 1,
        }));
    else {
      const cells2 = args25.cells.slice();
      ((cells2[value123] = _placeStoryboardCellForSwap(
        cloneStoryboardCellForSwapDestination(value124),
        value124,
        args24,
        value122,
        args25,
        value123,
      )),
        (cells[value122] = normalizeEmptyStoryboardCell({
          ...cloneStoryboardCellForSwap(value124),
          ..._getStoryboardCellPosition(args24, value122),
        })),
        (args6.nodes[value118] = {
          ...args24,
          cells: cells,
          _bizRev: (typeof args24._bizRev === 'number' ? args24._bizRev : 0) + 1,
        }),
        (args6.nodes[value120] = {
          ...args25,
          cells: cells2,
          _bizRev: (typeof args25._bizRev === 'number' ? args25._bizRev : 0) + 1,
        }));
    }
    return (subscribeNodeField.touch(value118), subscribeNodeField.touch(value120), run(), run4(), true);
  }
  function renameNode(value126, name2) {
    const error2 = args6.nodes[value126];
    if (!error2) return;
    if (error2.name === name2) return;
    const _bizRev6 = (typeof error2._bizRev === 'number' ? error2._bizRev : 0) + 1;
    ((args6.nodes[value126] = { ...error2, name: name2, _bizRev: _bizRev6 }),
      subscribeNodeField.touch(value126),
      run(),
      run4());
  }
  function removeEdge(value127) {
    args6.edges[value127] && (delete args6.edges[value127], run2(), run(), run4());
  }
  function showPicker(screenX, screenY, x3, y3) {
    ((args6.picker = {
      visible: true,
      x: x3,
      y: y3,
      screenX: screenX,
      screenY: screenY,
    }),
      run4());
  }
  function hidePicker() {
    if (args6.picker?.visible === false) return;
    ((args6.picker = { ...args6.picker, visible: false }), run4());
  }
  function getState() {
    return deepClone(args6);
  }
  function getStateRaw() {
    return args6;
  }
  function loadState(enabled39) {
    if (!enabled39) return;
    args6.nodes = deepClone(enabled39.nodes ?? {});
    for (const [value128, value129] of Object.entries(args6.nodes)) {
      args6.nodes[value128] = applyFeatureSelectionsToNodeData(value129, args6.ui?.featureSelections || {});
    }
    (normalizeNodesCollection(args6.nodes),
      (args6.edges = deepClone(enabled39.edges ?? {})),
      (args6.viewport = deepClone(enabled39.viewport ?? { x: 0, y: 0, zoom: 1 })),
      (args6._nodeCount = Object.keys(args6.nodes).length));
    for (const enabled40 of Object.values(args6.nodes)) {
      if (!enabled40 || typeof enabled40 !== 'object') continue;
      if (typeof enabled40._bizRev !== 'number') enabled40._bizRev = 1;
    }
    args6._parentToChildren = {};
    for (const [value130, value131] of Object.entries(args6.nodes)) {
      value131.parentId && run10(value130, value131.parentId);
    }
    (subscribeNodeField.reload(), run2(), run(), run4());
  }
  function getHistorySnapshot() {
    const nodes2 = {};
    for (const [value132, value133] of Object.entries(args6.nodes || {})) {
      nodes2[value132] = cloneNodeSnapshot(value133, { stripPanoramaViewport: true });
    }
    const edges = {};
    for (const [value134, value135] of Object.entries(args6.edges || {})) {
      edges[value134] = cloneEdgeSnapshot(value135);
    }
    return { nodes: nodes2, edges: edges };
  }
  function loadHistorySnapshot(args26) {
    if (!args26) return;
    const value136 = args6.nodes || {},
      nodes3 = deepClone(args26.nodes ?? {});
    for (const [value137, enabled41] of Object.entries(nodes3)) {
      if (!enabled41 || typeof enabled41 !== 'object') continue;
      const value138 = value136[value137];
      if (enabled41.type === 'panorama-scene') {
        const value139 = value138?.sceneNode?.viewport;
        value139 && (enabled41.sceneNode = { ...(enabled41.sceneNode || {}), viewport: deepClone(value139) });
      } else {
        if (enabled41.type === 'panorama-360') {
          const value140 = value138?.panorama360Node?.viewport;
          value140 &&
            (enabled41.panorama360Node = {
              ...(enabled41.panorama360Node || {}),
              viewport: deepClone(value140),
            });
        } else enabled41.type === 'ai-image' && normalizeAiImageRunningHistorySnapshot(enabled41);
      }
    }
    loadState({ ...args26, nodes: nodes3, viewport: cloneViewportSnapshot(args6.viewport) });
  }
  function getSourcesForNode(value141) {
    const list26 = Object.values(args6.edges).filter((item14) => item14.targetId === value141);
    return list26.map((item15) => args6.nodes[item15.sourceId]).filter((enabled42) => !!enabled42);
  }
  function run16(value142, enabled43) {
    if (!enabled43 || typeof enabled43 !== 'object') return false;
    for (const [value143, value144] of Object.entries(enabled43)) {
      if (value142?.[value143] !== value144) return true;
    }
    return false;
  }
  function run17(list27, list28) {
    if (list27 === list28) return true;
    if (!Array.isArray(list27) || !Array.isArray(list28)) return false;
    if (list27.length !== list28.length) return false;
    for (let value145 = 0; value145 < list27.length; value145 += 1) {
      if (!Object.is(list27[value145], list28[value145])) return false;
    }
    return true;
  }
  function run18(enabled44, enabled45) {
    if (enabled44 === enabled45) return true;
    if (
      !enabled44 ||
      !enabled45 ||
      typeof enabled44 !== 'object' ||
      typeof enabled45 !== 'object' ||
      Array.isArray(enabled44) ||
      Array.isArray(enabled45)
    )
      return false;
    const list29 = Object.keys(enabled44),
      list30 = Object.keys(enabled45);
    if (list29.length !== list30.length) return false;
    for (const value146 of list29) {
      if (!Object.prototype.hasOwnProperty.call(enabled45, value146)) return false;
      const value147 = enabled44[value146],
        value148 = enabled45[value146];
      if (Array.isArray(value147) || Array.isArray(value148)) {
        if (!run17(value147, value148)) return false;
      } else {
        if (!Object.is(value147, value148)) return false;
      }
    }
    return true;
  }
  function setSelectionBox(args27) {
    if (!args27 || typeof args27 !== 'object') return;
    if (!run16(args6.selectionBox, args27)) return;
    ((args6.selectionBox = { ...args6.selectionBox, ...args27 }), run4());
  }
  function setSelectionMeta(value149) {
    const args28 = value149 || {};
    if (!run16(args6.selectionMeta, args28)) return;
    ((args6.selectionMeta = { ...args6.selectionMeta, ...args28 }), run4());
  }
  function setSelectedNodes(value150) {
    const value151 = Array.from(value150 || []);
    if (run17(args6.selectedNodeIds, value151)) return;
    ((args6.selectedNodeIds = value151), run4());
  }
  function clearSelection() {
    const enabled46 = args6.selectionBox?.active === true,
      enabled47 = Array.isArray(args6.selectedNodeIds) ? args6.selectedNodeIds.length > 0 : false,
      enabled48 = args6.selectionMeta?.source != null;
    if (!enabled46 && !enabled47 && !enabled48) return;
    ((args6.selectionBox.active = false),
      (args6.selectedNodeIds = []),
      (args6.selectionMeta.source = null),
      run4());
  }
  function showContextMenu(x4, y4, items) {
    ((args6.contextMenu = { visible: true, x: x4, y: y4, items: items }), run4());
  }
  function hideContextMenu() {
    ((args6.contextMenu = { visible: false, x: 0, y: 0, items: [] }), run4());
  }
  function setConnOverlay({ srcId: srcId, invalidNodeIds: invalidNodeIds, hoverId: hoverId, side: side }) {
    const value152 = {
      srcId: srcId !== undefined ? srcId : args6.connOverlay.srcId,
      invalidNodeIds:
        invalidNodeIds !== undefined
          ? Array.isArray(invalidNodeIds)
            ? invalidNodeIds
            : []
          : args6.connOverlay.invalidNodeIds,
      hoverId: hoverId !== undefined ? hoverId : args6.connOverlay.hoverId,
      side: side !== undefined ? side : args6.connOverlay.side,
    };
    if (run18(args6.connOverlay, value152)) return;
    ((args6.connOverlay = value152), run4());
  }
  function clearConnOverlay() {
    const value153 = { srcId: null, invalidNodeIds: [], hoverId: null, side: null };
    if (run18(args6.connOverlay, value153)) return;
    ((args6.connOverlay = value153), run4());
  }
  function serialize() {
    const nodes4 = Object.values(args6.nodes || {}).map((item16) =>
        cloneNodeSnapshot(item16, { stripRichText: true }),
      ),
      edges2 = Object.values(args6.edges || {}).map((item17) => cloneEdgeSnapshot(item17)),
      value154 = {
        nodes: nodes4,
        edges: edges2,
        viewport: cloneViewportSnapshot(args6.viewport),
        assets: Array.isArray(args6.assets) ? args6.assets.map((item18) => cloneAssetSnapshot(item18)) : [],
        storyboard3dProjects: cloneStoryboard3DProjects(args6.storyboard3dProjects, deepClone),
      };
    return sanitizeSerializedCanvasData(value154);
  }
  function run19(enabled49, { preserveLiveGeneration: preserveLiveGeneration = false } = {}) {
    if (!enabled49) return;
    const hydratedAt2 = Date.now(),
      featureSelections2 = args6.ui?.featureSelections || {};
    enabled49.viewport && (args6.viewport = cloneViewportSnapshot(enabled49.viewport));
    ((args6.nodes = {}), (args6._parentToChildren = {}));
    let value155 = 0;
    if (Array.isArray(enabled49.nodes))
      enabled49.nodes.forEach((enabled50) => {
        if (!enabled50 || typeof enabled50 !== 'object') return;
        const cloneNodeSnapshot2 = cloneNodeSnapshot(enabled50, {
          hydratedAt: hydratedAt2,
          featureSelections: featureSelections2,
          preserveLiveGeneration: preserveLiveGeneration,
        });
        ((args6.nodes[cloneNodeSnapshot2.id] = cloneNodeSnapshot2),
          (value155 += 1),
          cloneNodeSnapshot2.parentId && run10(cloneNodeSnapshot2.id, cloneNodeSnapshot2.parentId));
      });
    else {
      if (enabled49.nodes && typeof enabled49.nodes === 'object')
        for (const [id3, args29] of Object.entries(enabled49.nodes)) {
          if (!args29 || typeof args29 !== 'object') continue;
          const cloneNodeSnapshot3 = cloneNodeSnapshot(args29.id ? args29 : { ...args29, id: id3 }, {
            hydratedAt: hydratedAt2,
            featureSelections: featureSelections2,
            preserveLiveGeneration: preserveLiveGeneration,
          });
          ((args6.nodes[id3] = cloneNodeSnapshot3),
            (value155 += 1),
            cloneNodeSnapshot3.parentId && run10(id3, cloneNodeSnapshot3.parentId));
        }
    }
    args6._nodeCount = value155;
    const value156 = {};
    if (Array.isArray(enabled49.edges))
      for (const enabled51 of enabled49.edges) {
        if (!enabled51 || typeof enabled51 !== 'object') continue;
        value156[enabled51.id] = cloneEdgeSnapshot(enabled51);
      }
    else {
      if (enabled49.edges && typeof enabled49.edges === 'object')
        for (const [value157, enabled52] of Object.entries(enabled49.edges)) {
          if (!enabled52 || typeof enabled52 !== 'object') continue;
          const cloneEdgeSnapshot2 = cloneEdgeSnapshot(enabled52);
          if (cloneEdgeSnapshot2.id == null) cloneEdgeSnapshot2.id = value157;
          value156[cloneEdgeSnapshot2.id] = cloneEdgeSnapshot2;
        }
    }
    ((args6.edges = value156),
      run2(),
      (args6.assets = Array.isArray(enabled49.assets)
        ? enabled49.assets.map((item19) => cloneAssetSnapshot(item19))
        : []),
      (args6.storyboard3dProjects = cloneStoryboard3DProjects(enabled49.storyboard3dProjects, deepClone)),
      subscribeNodeField.reload(),
      run(),
      run4());
  }
  function hydrateTrustedSnapshot(value158, value159 = {}) {
    run19(value158, value159);
  }
  function hydrate(enabled53) {
    if (!enabled53) return;
    const deepClone4 = deepClone(enabled53);
    run19(deepClone4);
  }
  function setPickConnectMode({
    active: active3,
    sourceNodeId: sourceNodeId = null,
    handleDirection: handleDirection = null,
    hoverNodeId: hoverNodeId = null,
  }) {
    ((args6.pickConnectMode = {
      active: active3,
      sourceNodeId: sourceNodeId,
      handleDirection: handleDirection,
      hoverNodeId: hoverNodeId,
    }),
      run4());
  }
  function setServerConnection(value160) {
    if (args6.isServerConnected === value160) return;
    ((args6.isServerConnected = value160), run4());
  }
  function setPickConnectHover(hoverNodeId2) {
    if (!args6.pickConnectMode || !args6.pickConnectMode.active) return;
    if (args6.pickConnectMode.hoverNodeId === hoverNodeId2) return;
    ((args6.pickConnectMode = { ...args6.pickConnectMode, hoverNodeId: hoverNodeId2 }), run4());
  }
  function setAnnotateState(value161) {
    const args30 = args6.annotate || {},
      args31 = value161 || {};
    if (!run16(args30, args31)) return;
    const value162 = { ...args30, ...args31 };
    ((args6.annotate = value162), run4());
  }
  function setMattingState(value163) {
    const args32 = args6.matting || {},
      args33 = value163 || {};
    if (!run16(args32, args33)) return;
    const value164 = { ...args32, ...args33 };
    ((args6.matting = value164), run4());
  }
  function setVideoKeyingState(value165) {
    const args34 = args6.videoKeying || {},
      args35 = value165 || {};
    if (!run16(args34, args35)) return;
    const value166 = { ...args34, ...args35 };
    ((args6.videoKeying = value166), run4());
  }
  function setVideoClipState(value167) {
    const args36 = args6.videoClip || {},
      args37 = value167 || {};
    if (!run16(args36, args37)) return;
    const value168 = { ...args36, ...args37 };
    ((args6.videoClip = value168), run4());
  }
  function setTheme(value169) {
    if (args6.theme === value169) return;
    ((args6.theme = value169), run4());
  }
  function toggleTheme() {
    const value170 = args6.theme === 'dark' ? 'light' : 'dark';
    setTheme(value170);
  }
  function initTheme(value171 = 'dark') {
    const value172 = value171 === 'light' ? 'light' : 'dark';
    args6.theme = value172;
  }
  function initFeatureSelections(options3 = {}) {
    if (!args6.ui) args6.ui = {};
    args6.ui.featureSelections = sanitizeFeatureSelectionsRecord(options3);
  }
  function getFeatureSelection(value173, value174, value175 = undefined) {
    const enabled54 = String(value173 || '').trim(),
      enabled55 = String(value174 || '').trim();
    if (!enabled54 || !enabled55) return value175;
    const value176 = args6.ui?.featureSelections?.[enabled54]?.[enabled55];
    return value176 === undefined ? value175 : value176;
  }
  function setFeatureSelection(value177, value178, value179) {
    const enabled56 = String(value177 || '').trim(),
      enabled57 = String(value178 || '').trim();
    if (!enabled56 || !enabled57) return;
    if (!args6.ui) args6.ui = {};
    (!args6.ui.featureSelections || typeof args6.ui.featureSelections !== 'object') &&
      (args6.ui.featureSelections = {});
    const args38 = args6.ui.featureSelections[enabled56] || {};
    if (args38[enabled57] === value179) return;
    ((args6.ui.featureSelections = {
      ...args6.ui.featureSelections,
      [enabled56]: { ...args38, [enabled57]: value179 },
    }),
      run4());
  }
  function run20(value180, value181) {
    if (args6.ui && args6.ui[value180] === value181) return;
    if (!args6.ui) args6.ui = {};
    ((args6.ui[value180] = value181), run4());
  }
  function setShowVideoMeta(value182) {
    run20('showVideoMeta', value182 === true);
  }
  function setTitleFollowsCanvasZoom(value183) {
    run20('titleFollowsCanvasZoom', value183 === true);
  }
  function setPromptBoxResizeEnabled(value184) {
    run20('promptBoxResizeEnabled', value184 !== false);
  }
  function setPromptEnterBehavior(value185) {
    run20('promptEnterBehavior', value185 === 'newline' ? 'newline' : 'submit');
  }
  function setPromptAttachmentButtonHidden(value186) {
    run20('promptAttachmentButtonHidden', value186 === true);
  }
  function setImageVideoNodeResizeEnabled(value187) {
    run20('imageVideoNodeResizeEnabled', value187 === true);
  }
  function run21(value188, value189, handler9, handler10) {
    const value190 = handler9(value189);
    if (!args6.ui) args6.ui = {};
    if (handler10(args6.ui[value188]) === handler10(value190)) return;
    ((args6.ui[value188] = value190), run4());
  }
  function setImageToolbarLayout(value191) {
    run21('imageToolbarLayout', value191, normalizeImageToolbarLayout, serializeImageToolbarLayout);
  }
  function setVideoToolbarLayout(value192) {
    run21('videoToolbarLayout', value192, normalizeVideoToolbarLayout, serializeVideoToolbarLayout);
  }
  function setAlignFeatureEnabled(value193) {
    const enabled58 = value193 !== false;
    if (args6.ui && args6.ui.alignFeatureEnabled === enabled58) return;
    if (!args6.ui) args6.ui = {};
    args6.ui.alignFeatureEnabled = enabled58;
    if (!enabled58)
      ((args6.ui.alignFeatureTriggerMode = 'off'),
        (args6.ui.alignPanelVisible = false),
        (args6.ui.alignPanelAnchorWorld = null));
    else args6.ui.alignFeatureTriggerMode === 'off' && (args6.ui.alignFeatureTriggerMode = 'click');
    run4();
  }
  function setAlignFeatureTriggerMode(value194) {
    const value195 = value194 === 'hold' || value194 === 'click' || value194 === 'off' ? value194 : 'click';
    if (!args6.ui) args6.ui = {};
    if (args6.ui.alignFeatureTriggerMode === value195) return;
    ((args6.ui.alignFeatureTriggerMode = value195),
      (args6.ui.alignFeatureEnabled = value195 !== 'off'),
      value195 === 'off' && ((args6.ui.alignPanelVisible = false), (args6.ui.alignPanelAnchorWorld = null)),
      run4());
  }
  function setAlignDistributeGap(value196) {
    const value197 = Number(value196),
      value198 = Number.isFinite(value197) ? Math.max(0, Math.min(200, Math.round(value197))) : 40;
    if (args6.ui && args6.ui.alignDistributeGap === value198) return;
    if (!args6.ui) args6.ui = {};
    ((args6.ui.alignDistributeGap = value198), run4());
  }
  function setAlignPanelVisible(value199) {
    const enabled59 = value199 === true;
    if (!args6.ui) args6.ui = {};
    if (!enabled59) {
      const enabled60 = !!args6.ui.alignPanelAnchorWorld;
      if (args6.ui.alignPanelVisible === enabled59 && !enabled60) return;
      ((args6.ui.alignPanelVisible = false), (args6.ui.alignPanelAnchorWorld = null), run4());
      return;
    }
    if (args6.ui.alignPanelVisible === enabled59) return;
    ((args6.ui.alignPanelVisible = enabled59), run4());
  }
  function setAlignPanelAnchorWorld(box4) {
    if (!args6.ui) args6.ui = {};
    let box5 = null;
    box4 &&
      Number.isFinite(box4.x) &&
      Number.isFinite(box4.y) &&
      (box5 = { x: Number(box4.x), y: Number(box4.y) });
    const box6 = args6.ui.alignPanelAnchorWorld,
      value200 =
        (!box6 && !box5) ||
        (box6 && box5 && Number(box6.x) === Number(box5.x) && Number(box6.y) === Number(box5.y));
    if (value200) return;
    ((args6.ui.alignPanelAnchorWorld = box5), run4());
  }
  function setSnapGuidesEnabled(value201) {
    const value202 = value201 !== false;
    if (args6.ui && args6.ui.snapGuidesEnabled === value202) return;
    if (!args6.ui) args6.ui = {};
    ((args6.ui.snapGuidesEnabled = value202), run4());
  }
  function setSelectionRelatedHighlightEnabled(value203) {
    const value204 = value203 !== false;
    if (args6.ui && args6.ui.selectionRelatedHighlightEnabled === value204) return;
    if (!args6.ui) args6.ui = {};
    ((args6.ui.selectionRelatedHighlightEnabled = value204), run4());
  }
  function run22(value205) {
    const value206 = String(value205 || '').trim();
    return ['white', 'blue', 'green', 'cyan', 'purple', 'red', 'yellow'].includes(value206)
      ? value206
      : 'white';
  }
  function setSelectionRelatedHighlightColor(value207) {
    const value208 = run22(value207);
    if (args6.ui && args6.ui.selectionRelatedHighlightColor === value208) return;
    if (!args6.ui) args6.ui = {};
    ((args6.ui.selectionRelatedHighlightColor = value208), run4());
  }
  function setConnectionLinesVisible(value209) {
    const value210 = value209 !== false;
    if (args6.ui && args6.ui.connectionLinesVisible === value210) return;
    if (!args6.ui) args6.ui = {};
    ((args6.ui.connectionLinesVisible = value210), run4());
  }
  function initUiPrefs(options4 = {}) {
    const value211 = options4?.showVideoMeta === true,
      value212 = options4?.titleFollowsCanvasZoom === true,
      value213 = options4?.promptBoxResizeEnabled !== false,
      value214 = options4?.promptAttachmentButtonHidden === true,
      value215 = options4?.imageVideoNodeResizeEnabled === true,
      value216 = options4?.selectionRelatedHighlightEnabled !== false,
      value217 = run22(options4?.selectionRelatedHighlightColor),
      value218 = options4?.connectionLinesVisible !== false,
      value219 = String(options4?.alignFeatureTriggerMode || '').trim(),
      value220 =
        value219 === 'hold' || value219 === 'click' || value219 === 'off'
          ? value219
          : options4?.alignFeatureEnabled === false
            ? 'off'
            : 'click',
      value221 = options4?.alignFeatureEnabled === false ? false : value220 !== 'off',
      value222 = Number(options4?.alignDistributeGap),
      value223 = Number.isFinite(value222) ? Math.max(0, Math.min(200, Math.round(value222))) : 40,
      value224 = options4?.snapGuidesEnabled !== false;
    if (!args6.ui) args6.ui = {};
    ((args6.ui.showVideoMeta = value211),
      (args6.ui.titleFollowsCanvasZoom = value212),
      (args6.ui.promptBoxResizeEnabled = value213),
      (args6.ui.promptEnterBehavior = options4?.promptEnterBehavior === 'newline' ? 'newline' : 'submit'),
      (args6.ui.promptAttachmentButtonHidden = value214),
      (args6.ui.imageVideoNodeResizeEnabled = value215),
      (args6.ui.imageToolbarLayout = normalizeImageToolbarLayout(options4?.imageToolbarLayout)),
      (args6.ui.videoToolbarLayout = normalizeVideoToolbarLayout(options4?.videoToolbarLayout)),
      (args6.ui.selectionRelatedHighlightEnabled = value216),
      (args6.ui.selectionRelatedHighlightColor = value217),
      (args6.ui.connectionLinesVisible = value218),
      (args6.ui.alignFeatureEnabled = value221),
      (args6.ui.alignFeatureTriggerMode = value220),
      (args6.ui.alignDistributeGap = value223),
      (args6.ui.alignPanelVisible = false),
      (args6.ui.alignPanelAnchorWorld = null),
      (args6.ui.snapGuidesEnabled = value224),
      initFeatureSelections(options4?.featureSelections || {}),
      run4());
  }
  function setSubscriptionState(value225) {
    const args39 = args6.subscription || {};
    ((args6.subscription = { ...args39, ...(value225 || {}) }), run4());
  }
  function setModelCatalogState(value226) {
    const args40 = args6.modelCatalog || {};
    ((args6.modelCatalog = { ...args40, ...(value226 || {}) }), run4());
  }
  const {
    upsertStoryboard3DProject: upsertStoryboard3DProject,
    deleteStoryboard3DProject: deleteStoryboard3DProject,
  } = createStoryboard3DProjectActions({
    readProjects: () => args6.storyboard3dProjects,
    writeProjects: (value227) => {
      args6.storyboard3dProjects = value227;
      run();
      run4();
    },
    clone: deepClone,
  });
  function addAsset(enabled61) {
    if (!enabled61 || !enabled61.id) throw new Error('[store] addAsset() 需要提供含有 id 字段的资产数据');
    const value228 = JSON.parse(JSON.stringify(enabled61));
    if (!args6.assets) args6.assets = [];
    (args6.assets.unshift(value228), run(), run4());
  }
  function deleteAsset(value229) {
    if (!args6.assets) return;
    const value230 = args6.assets.length;
    ((args6.assets = args6.assets.filter((item20) => item20.id !== value229)),
      args6.assets.length !== value230 && (run(), run4()));
  }
  function updateAsset(value231, args41) {
    if (!args6.assets) return;
    const value232 = args6.assets.findIndex((item21) => item21.id === value231);
    if (value232 !== -1) {
      const args42 = args6.assets[value232],
        value233 = { ...args42, ...args41 };
      if (shallowEqual(args42, value233)) return;
      ((args6.assets[value232] = value233), run(), run4());
    }
  }
  function run23() {
    ((!args6.workflows || typeof args6.workflows !== 'object') &&
      (args6.workflows = { items: [], loading: false, error: null, loadedAt: 0 }),
      !Array.isArray(args6.workflows.items) && (args6.workflows.items = []),
      (!args6.workflowUi || typeof args6.workflowUi !== 'object') &&
        (args6.workflowUi = createInitialWorkflowUiState()));
  }
  function setWorkflowsLoading(loading, error3 = null) {
    (run23(),
      (args6.workflows = {
        ...args6.workflows,
        loading: loading === true,
        error: error3 == null ? null : String(error3),
      }),
      run4());
  }
  function setWorkflows(list31) {
    (run23(),
      (args6.workflows = {
        ...args6.workflows,
        items: Array.isArray(list31) ? list31.map((item22) => cloneWorkflowSnapshot(item22)) : [],
        loading: false,
        error: null,
        loadedAt: Date.now(),
      }),
      run4());
  }
  function upsertWorkflow(enabled62) {
    if (!enabled62 || !enabled62.id) return;
    run23();
    const args43 = cloneWorkflowSnapshot(enabled62),
      count8 = args6.workflows.items.findIndex((item23) => item23?.id === args43.id);
    (count8 >= 0
      ? (args6.workflows.items[count8] = { ...args6.workflows.items[count8], ...args43 })
      : args6.workflows.items.unshift(args43),
      run4());
  }
  function updateWorkflowLocal(value234, enabled63) {
    const enabled64 = String(value234 || '').trim();
    if (!enabled64 || !enabled63 || typeof enabled63 !== 'object') return;
    run23();
    const count9 = args6.workflows.items.findIndex((item24) => item24?.id === enabled64);
    if (count9 < 0) return;
    ((args6.workflows.items[count9] = {
      ...args6.workflows.items[count9],
      ...cloneWorkflowSnapshot(enabled63),
    }),
      run4());
  }
  function markWorkflowUsed(value235, lastUsedAt = Date.now()) {
    updateWorkflowLocal(value235, { lastUsedAt: lastUsedAt });
  }
  function setWorkflowUi(enabled65) {
    if (!enabled65 || typeof enabled65 !== 'object') return;
    run23();
    const args44 = { ...args6.workflowUi };
    for (const [value236, value237] of Object.entries(enabled65)) {
      value236 === 'draft' && value237 && typeof value237 === 'object'
        ? (args44.draft = { ...args44.draft, ...cloneWorkflowSnapshot(value237) })
        : (args44[value236] = cloneWorkflowSnapshot(value237));
    }
    ((args6.workflowUi = args44), run4());
  }
  function setWorkflowDraft(enabled66) {
    if (!enabled66 || typeof enabled66 !== 'object') return;
    (run23(),
      (args6.workflowUi = {
        ...args6.workflowUi,
        draft: {
          ...(args6.workflowUi.draft || createInitialWorkflowDraftState()),
          ...cloneWorkflowSnapshot(enabled66),
        },
      }),
      run4());
  }
  function resetWorkflowDraft(options5 = {}) {
    (run23(),
      (args6.workflowUi = {
        ...args6.workflowUi,
        draft: { ...createInitialWorkflowDraftState(), ...cloneWorkflowSnapshot(options5) },
        tagDraft: '',
        updateConfirmOpen: false,
        error: null,
      }),
      run4());
  }
  function openWorkflowModal({ tab: tab = 'create', sourceGroupId: sourceGroupId = null } = {}) {
    (run23(),
      (args6.workflowUi = {
        ...args6.workflowUi,
        modalOpen: true,
        modalTab: tab === 'update' ? 'update' : 'create',
        sourceGroupId: sourceGroupId == null ? null : String(sourceGroupId || '').trim() || null,
        draft: createInitialWorkflowDraftState(),
        tagDraft: '',
        updateTargetId: null,
        updateSearchKeyword: '',
        updateConfirmOpen: false,
        saving: false,
        error: null,
      }),
      run4());
  }
  function closeWorkflowModal() {
    (run23(),
      (args6.workflowUi = {
        ...args6.workflowUi,
        modalOpen: false,
        modalTab: 'create',
        sourceGroupId: null,
        draft: createInitialWorkflowDraftState(),
        tagDraft: '',
        updateTargetId: null,
        updateSearchKeyword: '',
        updateConfirmOpen: false,
        saving: false,
        error: null,
      }),
      run4());
  }
  function setWorkflowSaving(saving) {
    setWorkflowUi({ saving: saving === true });
  }
  function setWorkflowApplying(value238) {
    const applyingWorkflowId = value238 == null ? null : String(value238);
    setWorkflowUi({ applyingWorkflowId: applyingWorkflowId || null });
  }
  return {
    subscribe: subscribe,
    subscribeRaw: subscribeRaw,
    subscribeSelector: subscribeSelector,
    subscribeNodeField: subscribeNodeField.subscribe,
    batch: batch,
    requestRender: requestRender,
    invalidateUi: invalidateUi,
    addNode: addNode,
    updateNodePosition: updateNodePosition,
    moveNodes: moveNodes,
    moveNodesByOffsets: moveNodesByOffsets,
    deleteNodes: deleteNodes,
    updateNodeData: updateNodeData,
    updateNodesData: updateNodesData,
    swapStoryboardCells: swapStoryboardCells,
    addEdge: addEdge,
    removeEdge: removeEdge,
    updateEdgesBatch: updateEdgesBatch,
    updateViewport: updateViewport,
    setViewportPersistPolicy: setViewportPersistPolicy,
    markViewportPersist: markViewportPersist,
    showPicker: showPicker,
    hidePicker: hidePicker,
    loadState: loadState,
    loadHistorySnapshot: loadHistorySnapshot,
    getState: getState,
    getStateRaw: getStateRaw,
    getHistorySnapshot: getHistorySnapshot,
    getSourcesForNode: getSourcesForNode,
    setSelectionBox: setSelectionBox,
    setSelectionMeta: setSelectionMeta,
    setSelectedNodes: setSelectedNodes,
    groupNodes: groupNodes,
    getIncomingEdges: getIncomingEdges,
    renameNode: renameNode,
    clearSelection: clearSelection,
    showContextMenu: showContextMenu,
    hideContextMenu: hideContextMenu,
    setConnOverlay: setConnOverlay,
    clearConnOverlay: clearConnOverlay,
    setPickConnectMode: setPickConnectMode,
    setPickConnectHover: setPickConnectHover,
    setServerConnection: setServerConnection,
    setAnnotateState: setAnnotateState,
    setMattingState: setMattingState,
    setVideoKeyingState: setVideoKeyingState,
    setVideoClipState: setVideoClipState,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    initTheme: initTheme,
    setFeatureSelection: setFeatureSelection,
    getFeatureSelection: getFeatureSelection,
    initFeatureSelections: initFeatureSelections,
    setShowVideoMeta: setShowVideoMeta,
    setTitleFollowsCanvasZoom: setTitleFollowsCanvasZoom,
    setPromptBoxResizeEnabled: setPromptBoxResizeEnabled,
    setPromptEnterBehavior: setPromptEnterBehavior,
    setPromptAttachmentButtonHidden: setPromptAttachmentButtonHidden,
    setImageVideoNodeResizeEnabled: setImageVideoNodeResizeEnabled,
    setImageToolbarLayout: setImageToolbarLayout,
    setVideoToolbarLayout: setVideoToolbarLayout,
    setAlignFeatureEnabled: setAlignFeatureEnabled,
    setAlignFeatureTriggerMode: setAlignFeatureTriggerMode,
    setAlignDistributeGap: setAlignDistributeGap,
    setAlignPanelVisible: setAlignPanelVisible,
    setAlignPanelAnchorWorld: setAlignPanelAnchorWorld,
    setSnapGuidesEnabled: setSnapGuidesEnabled,
    setSelectionRelatedHighlightEnabled: setSelectionRelatedHighlightEnabled,
    setSelectionRelatedHighlightColor: setSelectionRelatedHighlightColor,
    setConnectionLinesVisible: setConnectionLinesVisible,
    setSubscriptionState: setSubscriptionState,
    setModelCatalogState: setModelCatalogState,
    initUiPrefs: initUiPrefs,
    addAsset: addAsset,
    deleteAsset: deleteAsset,
    updateAsset: updateAsset,
    upsertStoryboard3DProject: upsertStoryboard3DProject,
    deleteStoryboard3DProject: deleteStoryboard3DProject,
    setWorkflowsLoading: setWorkflowsLoading,
    setWorkflows: setWorkflows,
    upsertWorkflow: upsertWorkflow,
    updateWorkflowLocal: updateWorkflowLocal,
    markWorkflowUsed: markWorkflowUsed,
    setWorkflowUi: setWorkflowUi,
    setWorkflowDraft: setWorkflowDraft,
    resetWorkflowDraft: resetWorkflowDraft,
    openWorkflowModal: openWorkflowModal,
    closeWorkflowModal: closeWorkflowModal,
    setWorkflowSaving: setWorkflowSaving,
    setWorkflowApplying: setWorkflowApplying,
    serialize: serialize,
    hydrate: hydrate,
    hydrateTrustedSnapshot: hydrateTrustedSnapshot,
  };
}
const legacyKernelStore = createStore();
export default legacyKernelStore;
export { createStore, createStore as createLegacyKernelStore };
