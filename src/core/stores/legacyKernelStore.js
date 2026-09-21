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
function deepClone(_0x55ad00) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x55ad00);
    } catch {}
  return JSON.parse(JSON.stringify(_0x55ad00));
}
function stripPersistedRichText(_0x3a53a3) {
  if (typeof _0x3a53a3 !== 'string') return _0x3a53a3;
  return _0x3a53a3.replace(/<[^>]*>/g, '');
}
function sanitizePersistedPromptHtml(_0x4792a6) {
  if (typeof _0x4792a6 !== 'string') return _0x4792a6;
  return sanitizePromptHtml(_0x4792a6);
}
function cloneShallowObjectArray(_0x1790f2) {
  if (!Array.isArray(_0x1790f2)) return _0x1790f2;
  return _0x1790f2.map((_0x11f41f) =>
    _0x11f41f && typeof _0x11f41f === 'object' ? { ..._0x11f41f } : _0x11f41f,
  );
}
function cloneViewportSnapshot(_0x5b1d17) {
  if (!_0x5b1d17 || typeof _0x5b1d17 !== 'object') return _0x5b1d17;
  return { ..._0x5b1d17 };
}
function cloneEdgeSnapshot(_0xad1968) {
  if (!_0xad1968 || typeof _0xad1968 !== 'object') return _0xad1968;
  return { ..._0xad1968 };
}
function cloneAssetSnapshot(_0x1203ef) {
  if (!_0x1203ef || typeof _0x1203ef !== 'object') return _0x1203ef;
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x1203ef);
    } catch {}
  try {
    return JSON.parse(JSON.stringify(_0x1203ef));
  } catch {}
  return { ..._0x1203ef };
}
function cloneWorkflowSnapshot(_0x49af8c) {
  if (!_0x49af8c || typeof _0x49af8c !== 'object') return _0x49af8c;
  return deepClone(_0x49af8c);
}
function isBlobLikeUrl(_0x508f5f) {
  return typeof _0x508f5f === 'string' && /^blob:/i.test(_0x508f5f.trim());
}
function sanitizePanoramaStateForPersistence(_0x1ebc01) {
  if (!_0x1ebc01 || typeof _0x1ebc01 !== 'object') return _0x1ebc01;
  const _0xedd1e9 = deepClone(_0x1ebc01);
  return (
    _0xedd1e9.ui && typeof _0xedd1e9.ui === 'object' && delete _0xedd1e9.ui.isEditing,
    _0xedd1e9.panorama &&
      typeof _0xedd1e9.panorama === 'object' &&
      (delete _0xedd1e9.panorama.isLoaded,
      delete _0xedd1e9.panorama.error,
      isBlobLikeUrl(_0xedd1e9.panorama.imageUrl) && delete _0xedd1e9.panorama.imageUrl,
      isBlobLikeUrl(_0xedd1e9.panorama.localPath) && delete _0xedd1e9.panorama.localPath),
    _0xedd1e9.capture &&
      typeof _0xedd1e9.capture === 'object' &&
      (delete _0xedd1e9.capture.pending,
      delete _0xedd1e9.capture.error,
      delete _0xedd1e9.capture.lastCaptureAt),
    _0xedd1e9
  );
}
function sanitizePanoramaStateForHistory(_0x4a18a5) {
  const _0x56e7cb = sanitizePanoramaStateForPersistence(_0x4a18a5);
  if (!_0x56e7cb || typeof _0x56e7cb !== 'object') return _0x56e7cb;
  return (delete _0x56e7cb.viewport, _0x56e7cb);
}
function cloneNodeSnapshot(
  _0x4bd96e,
  {
    stripRichText: stripRichText = false,
    hydratedAt: hydratedAt = null,
    featureSelections: featureSelections = null,
    stripPanoramaViewport: stripPanoramaViewport = false,
    preserveLiveGeneration: preserveLiveGeneration = false,
  } = {},
) {
  if (!_0x4bd96e || typeof _0x4bd96e !== 'object') return _0x4bd96e;
  const _0x5be18d = { ..._0x4bd96e };
  normalizeNodeModel(_0x5be18d);
  stripRichText &&
    (_0x5be18d.content !== undefined && (_0x5be18d.content = stripPersistedRichText(_0x5be18d.content)),
    _0x5be18d.prompt !== undefined && (_0x5be18d.prompt = sanitizePersistedPromptHtml(_0x5be18d.prompt)));
  Array.isArray(_0x4bd96e.cells) && (_0x5be18d.cells = cloneShallowObjectArray(_0x4bd96e.cells));
  Array.isArray(_0x4bd96e.images) && (_0x5be18d.images = cloneShallowObjectArray(_0x4bd96e.images));
  Array.isArray(_0x4bd96e.videos) && (_0x5be18d.videos = cloneShallowObjectArray(_0x4bd96e.videos));
  _0x4bd96e.sceneNode &&
    typeof _0x4bd96e.sceneNode === 'object' &&
    (_0x5be18d.sceneNode = stripPanoramaViewport
      ? sanitizePanoramaStateForHistory(_0x4bd96e.sceneNode)
      : sanitizePanoramaStateForPersistence(_0x4bd96e.sceneNode));
  _0x4bd96e.panorama360Node &&
    typeof _0x4bd96e.panorama360Node === 'object' &&
    (_0x5be18d.panorama360Node = stripPanoramaViewport
      ? sanitizePanoramaStateForHistory(_0x4bd96e.panorama360Node)
      : sanitizePanoramaStateForPersistence(_0x4bd96e.panorama360Node));
  typeof hydratedAt === 'number' &&
    Number.isFinite(hydratedAt) &&
    typeof _0x5be18d.generationStartTime === 'number' &&
    Number.isFinite(_0x5be18d.generationStartTime) &&
    _0x5be18d.generationDuration == null &&
    !shouldPreserveRunningGenerationOnHydrate(_0x5be18d, {
      preserveLiveGeneration: preserveLiveGeneration,
    }) &&
    finalizeHydratedGenerationSnapshot(_0x5be18d, Math.max(1, hydratedAt - _0x5be18d.generationStartTime));
  if (typeof _0x5be18d._bizRev !== 'number') _0x5be18d._bizRev = 1;
  return featureSelections ? applyFeatureSelectionsToNodeData(_0x5be18d, featureSelections) : _0x5be18d;
}
function shallowEqual(_0x16a3b6, _0x1391b9) {
  if (_0x16a3b6 === _0x1391b9) return true;
  if (typeof _0x16a3b6 !== typeof _0x1391b9) return false;
  if (typeof _0x16a3b6 !== 'object' || _0x16a3b6 === null || _0x1391b9 === null) return false;
  const _0x4a85f2 = Object.keys(_0x16a3b6),
    _0x59fe51 = Object.keys(_0x1391b9);
  if (_0x4a85f2.length !== _0x59fe51.length) return false;
  for (const _0x5dd029 of _0x4a85f2) {
    if (!_0x59fe51.includes(_0x5dd029) || _0x16a3b6[_0x5dd029] !== _0x1391b9[_0x5dd029]) return false;
  }
  return true;
}
function isPlainObject(_0x338f4a) {
  if (!_0x338f4a || typeof _0x338f4a !== 'object' || Array.isArray(_0x338f4a)) return false;
  const _0x105a52 = Object.getPrototypeOf(_0x338f4a);
  return _0x105a52 === Object.prototype || _0x105a52 === null;
}
function snapshotSelectorValue(_0x2feaa9) {
  if (_0x2feaa9 == null || typeof _0x2feaa9 !== 'object') return _0x2feaa9;
  if (Array.isArray(_0x2feaa9)) return _0x2feaa9.slice();
  if (isPlainObject(_0x2feaa9)) return { ..._0x2feaa9 };
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x2feaa9);
    } catch {}
  return _0x2feaa9;
}
function _isSameStoreValue(_0x59a819, _0x8f2346) {
  return Object.is(_0x59a819, _0x8f2346);
}
function _isPatchNoop(_0x1eec1c, _0x5129f9) {
  if (!_0x1eec1c || !_0x5129f9 || typeof _0x5129f9 !== 'object') return false;
  const _0x2d7bc0 = Object.keys(_0x5129f9);
  if (_0x2d7bc0.length === 0) return true;
  return _0x2d7bc0.every((_0x2d87d2) => _isSameStoreValue(_0x1eec1c[_0x2d87d2], _0x5129f9[_0x2d87d2]));
}
function _trimText(_0x3267b1) {
  return typeof _0x3267b1 === 'string' ? _0x3267b1.trim() : '';
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
function normalizeHistoryStatus(_0x150a30) {
  return String(_0x150a30 || '')
    .trim()
    .toLowerCase();
}
function hasUsableImageResultItem(_0x2b4cc8) {
  if (!_0x2b4cc8 || typeof _0x2b4cc8 !== 'object') return false;
  if (_trimText(_0x2b4cc8.error)) return false;
  return !!(
    _trimText(_0x2b4cc8.imageUrl) ||
    _trimText(_0x2b4cc8.sourceUrl) ||
    _trimText(_0x2b4cc8.thumbUrl) ||
    _trimText(_0x2b4cc8.localPath) ||
    _trimText(_0x2b4cc8.originalLocalPath) ||
    _trimText(_0x2b4cc8.displayLocalPath) ||
    _trimText(_0x2b4cc8.thumbLocalPath) ||
    _trimText(_0x2b4cc8.thumbId) ||
    _trimText(_0x2b4cc8.sourceId)
  );
}
function hasResolvedAiImageResultSnapshot(_0x4985e8) {
  if (!_0x4985e8 || typeof _0x4985e8 !== 'object') return false;
  if (String(_0x4985e8.type || '') !== 'ai-image') return false;
  const _0x500542 = Array.isArray(_0x4985e8.images) ? _0x4985e8.images : [];
  if (_0x500542.some((_0x3ac0f3) => hasUsableImageResultItem(_0x3ac0f3))) return true;
  return hasUsableImageResultItem(_0x4985e8);
}
function isRunningAiImageHistorySnapshot(_0x21a97c) {
  if (!_0x21a97c || typeof _0x21a97c !== 'object') return false;
  if (String(_0x21a97c.type || '') !== 'ai-image') return false;
  if (_0x21a97c.isGenerating === true) return true;
  if (
    _0x21a97c.rhTaskRecovering === true ||
    _0x21a97c.dreaminaTaskRecovering === true ||
    _0x21a97c.asyncTaskRecovering === true
  )
    return true;
  return HISTORY_GENERATION_STATUS_FIELDS.some((_0x17568e) =>
    HISTORY_RUNNING_STATUSES.has(normalizeHistoryStatus(_0x21a97c[_0x17568e])),
  );
}
function normalizeAiImageRunningHistorySnapshot(_0x29bfb0) {
  if (!isRunningAiImageHistorySnapshot(_0x29bfb0)) return _0x29bfb0;
  const _0x51d353 = hasResolvedAiImageResultSnapshot(_0x29bfb0);
  return (
    (_0x29bfb0.isGenerating = false),
    (_0x29bfb0.jobStatus = _0x51d353 ? 'success' : null),
    (_0x29bfb0.jobError = null),
    (_0x29bfb0.rhStatusMessage = null),
    (_0x29bfb0.rhStatusCode = null),
    (_0x29bfb0.rhTaskId = ''),
    (_0x29bfb0.rhTaskStatus = 'idle'),
    (_0x29bfb0.rhTaskRecovering = false),
    (_0x29bfb0.dreaminaSubmitId = ''),
    (_0x29bfb0.dreaminaTaskStatus = 'idle'),
    (_0x29bfb0.dreaminaTaskPhase = 'done'),
    (_0x29bfb0.dreaminaTaskLabel = ''),
    (_0x29bfb0.dreaminaTaskRecovering = false),
    (_0x29bfb0.dreaminaTaskLastRaw = {}),
    (_0x29bfb0.asyncTaskId = ''),
    (_0x29bfb0.asyncTaskStatus = 'idle'),
    (_0x29bfb0.asyncTaskRecovering = false),
    _0x29bfb0
  );
}
function _getStoryboardCellPosition(_0x185e0f, _0x3bb28a) {
  const _0x118096 = Math.max(1, Math.round(Number(_0x185e0f?.cols) || 1));
  return { col: _0x3bb28a % _0x118096, row: Math.floor(_0x3bb28a / _0x118096) };
}
function _placeStoryboardCellForSwap(_0x91cdd4, _0x43e631, _0x3fe9f5, _0x2b68c3, _0x3ae289, _0x404ce5) {
  Object.assign(_0x91cdd4, _getStoryboardCellPosition(_0x3ae289, _0x404ce5));
  if (isStoryboardCellEmpty(_0x43e631)) return normalizeEmptyStoryboardCell(_0x91cdd4);
  return (
    (_0x91cdd4.storyboardSourceIndex = resolveStoryboardCellSourceIndex(_0x43e631, _0x2b68c3, _0x3fe9f5)),
    _0x91cdd4
  );
}
function _isValidStoryboardCellTarget(_0xc22dca, _0x46cbea) {
  return (
    _0xc22dca &&
    _0xc22dca.type === 'storyboard' &&
    Array.isArray(_0xc22dca.cells) &&
    Number.isInteger(_0x46cbea) &&
    _0x46cbea >= 0 &&
    _0x46cbea < _0xc22dca.cells.length
  );
}
const LEGACY_VIDEO_EDIT_V52_MODEL_ID = 'runninghub/2037339851183366146';
function normalizeNodeModel(_0x3b197a) {
  if (!_0x3b197a || typeof _0x3b197a !== 'object') return;
  String(_0x3b197a.model || '') === LEGACY_VIDEO_EDIT_V52_MODEL_ID &&
    (_0x3b197a.model = RH_VIDEO_V54_MODEL_ID);
}
function normalizeNodesCollection(_0x314e51) {
  if (!_0x314e51) return;
  if (Array.isArray(_0x314e51)) {
    _0x314e51.forEach(normalizeNodeModel);
    return;
  }
  typeof _0x314e51 === 'object' && Object.values(_0x314e51).forEach(normalizeNodeModel);
}
function isDreaminaTaskNodeSnapshot(_0xc1db40) {
  if (!_0xc1db40 || typeof _0xc1db40 !== 'object') return false;
  const _0xf82a4e = String(_0xc1db40.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-image', 'source-video'].includes(_0xf82a4e)) return false;
  const _0x248a33 = String(_0xc1db40.provider || '')
      .trim()
      .toLowerCase(),
    _0x28cf7b = String(_0xc1db40.model || '').trim();
  return _0x248a33 === 'dreamina' || resolveModelProvider(_0x28cf7b, _0x248a33) === 'dreamina';
}
function inferAsyncProviderByModel(_0x5a8637, _0x134542 = '') {
  const _0x2525cc = resolveModelProvider(_0x5a8637, '', { allowProviderHint: false });
  if (_0x2525cc) return _0x2525cc;
  const _0x255769 = String(_0x134542 || '')
    .trim()
    .toLowerCase();
  if (_0x255769) return _0x255769;
  const _0x42df0e = String(_0x5a8637 || '').trim();
  if (_0x42df0e && !_0x42df0e.includes('/')) return 'grsai';
  return 'grsai';
}
function isAsyncTaskNodeSnapshot(_0x43b4d3) {
  if (!_0x43b4d3 || typeof _0x43b4d3 !== 'object') return false;
  const _0x1086e2 = String(_0x43b4d3.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-video', 'source-image'].includes(_0x1086e2)) return false;
  const _0x1a0afd = inferAsyncProviderByModel(
    _0x43b4d3.model,
    _0x43b4d3.asyncTaskProvider || _0x43b4d3.provider || '',
  );
  if (!_0x1a0afd || _0x1a0afd === 'runninghubwf' || _0x1a0afd === 'runninghub' || _0x1a0afd === 'dreamina')
    return false;
  return true;
}
function isRunningHubTaskNodeSnapshot(_0x39ad9d) {
  if (!_0x39ad9d || typeof _0x39ad9d !== 'object') return false;
  const _0x3bc7bd = String(_0x39ad9d.type || '')
      .trim()
      .toLowerCase(),
    _0x4ed9b2 = String(_0x39ad9d.provider || '')
      .trim()
      .toLowerCase(),
    _0x1e055d = String(_0x39ad9d.model || '').trim(),
    _0x21f73c = resolveModelProvider(_0x1e055d, _0x4ed9b2, { allowProviderHint: false }),
    _0x2cfbcd = isWorkflowModel(_0x1e055d, _0x4ed9b2 || 'runninghubwf'),
    _0x6defd7 = _0x21f73c === 'runninghub' && isModelApiModel(_0x1e055d, 'runninghub');
  if (_0x3bc7bd === 'ai-audio') return _0x4ed9b2 === 'runninghubwf';
  if (_0x3bc7bd === 'source-video') return _0x4ed9b2 === 'runninghubwf' || _0x2cfbcd;
  if (_0x3bc7bd === 'source-image')
    return _0x4ed9b2 === 'runninghubwf' || _0x4ed9b2 === 'runninghub' || _0x2cfbcd || _0x6defd7;
  if (_0x3bc7bd === 'source-audio') return _0x4ed9b2 === 'runninghubwf' && _0x2cfbcd;
  if (_0x3bc7bd === 'ai-video') return _0x4ed9b2 === 'runninghubwf' && _0x2cfbcd;
  if (_0x3bc7bd === 'ai-image')
    return _0x2cfbcd || _0x6defd7 || _0x4ed9b2 === 'runninghub' || _0x4ed9b2 === 'runninghubwf';
  return false;
}
function hasResolvedVideoResultSnapshot(_0x46c934) {
  if (!_0x46c934 || typeof _0x46c934 !== 'object') return false;
  const _0x1688da = Array.isArray(_0x46c934.videos) ? _0x46c934.videos : [];
  if (_0x1688da.length > 0) return true;
  return !!String(_0x46c934.videoUrl || '').trim() || !!String(_0x46c934.localPath || '').trim();
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
function finalizeHydratedGenerationSnapshot(_0x3cf00c, _0xf0f9a9) {
  _0x3cf00c.generationDuration = _0xf0f9a9;
  if (_0x3cf00c.isGenerating === true) _0x3cf00c.isGenerating = false;
  for (const _0x410f1d of HYDRATE_ACTIVE_STATUS_FIELDS) {
    const _0x421f67 = String(_0x3cf00c[_0x410f1d] || '').trim();
    if (_0x421f67 && !isGenerationTaskTerminalStatus(_0x421f67)) _0x3cf00c[_0x410f1d] = 'cancelled';
  }
  for (const _0x3b145b of HYDRATE_RECOVERING_FIELDS)
    if (_0x3cf00c[_0x3b145b] === true) _0x3cf00c[_0x3b145b] = false;
}
function shouldPreserveRunningGenerationOnHydrate(
  _0x913eaa,
  { preserveLiveGeneration: preserveLiveGeneration = false } = {},
) {
  if (preserveLiveGeneration && _0x913eaa?.isGenerating === true) {
    const _0x10cde4 = [
      _0x913eaa.dreaminaTaskPhase,
      _0x913eaa.dreaminaTaskStatus,
      _0x913eaa.asyncTaskStatus,
      _0x913eaa.rhTaskStatus,
      _0x913eaa.mediaTaskStatus,
      _0x913eaa.jobStatus,
    ].some((_0x2e8c4f) => {
      const _0x2b6a0b = String(_0x2e8c4f || '')
        .trim()
        .toLowerCase();
      return !!_0x2b6a0b && _0x2b6a0b !== 'idle' && isGenerationTaskTerminalStatus(_0x2b6a0b);
    });
    if (!_0x10cde4) return true;
  }
  if (isDreaminaTaskNodeSnapshot(_0x913eaa)) {
    const _0x3dd690 = String(_0x913eaa.dreaminaSubmitId || '').trim();
    if (!_0x3dd690) return false;
    const _0x49fee8 = String(_0x913eaa.dreaminaTaskPhase || '')
        .trim()
        .toLowerCase(),
      _0x5e5214 = String(_0x913eaa.dreaminaTaskStatus || '')
        .trim()
        .toLowerCase();
    if (isGenerationTaskTerminalStatus(_0x49fee8)) return false;
    if (isGenerationTaskTerminalStatus(_0x5e5214)) return false;
    return true;
  }
  if (isAsyncTaskNodeSnapshot(_0x913eaa)) {
    const _0x143a6e = String(_0x913eaa.asyncTaskId || '').trim();
    if (!_0x143a6e) return false;
    const _0x3926a2 = String(_0x913eaa.asyncTaskKind || '')
        .trim()
        .toLowerCase(),
      _0x1d2a10 = String(_0x913eaa.type || '')
        .trim()
        .toLowerCase();
    if (_0x3926a2 === 'image' && !['ai-image', 'source-image'].includes(_0x1d2a10)) return false;
    if (_0x3926a2 === 'video' && !['ai-video', 'source-video'].includes(_0x1d2a10)) return false;
    const _0x54190e = String(_0x913eaa.asyncTaskStatus || '')
      .trim()
      .toLowerCase();
    if (isGenerationTaskTerminalStatus(_0x54190e)) return false;
    return true;
  }
  if (!isRunningHubTaskNodeSnapshot(_0x913eaa)) return false;
  const _0x48a9fc = String(_0x913eaa.rhTaskId || '').trim();
  if (!_0x48a9fc) return false;
  const _0x279832 = String(_0x913eaa.rhTaskStatus || '')
    .trim()
    .toLowerCase();
  if (isGenerationTaskTerminalStatus(_0x279832)) return false;
  return true;
}
function createStore() {
  let _0x36929b = createInitialState();
  const _0x137896 = [],
    _0x5f4349 = [],
    _0x488878 = [];
  let _0x135c8c = 0,
    _0x3d0976 = false,
    _0x2edeb0 = () => true;
  function _0x1bb4d0() {
    _0x36929b._persistRev = (_0x36929b._persistRev || 0) + 1;
  }
  function _0x35099c() {
    _0x36929b._edgesRev = (_0x36929b._edgesRev || 0) + 1;
  }
  function _0x28a140(_0x27147c) {
    _0x2edeb0 = typeof _0x27147c === 'function' ? _0x27147c : () => true;
  }
  function _0x45d0b9(_0x5b7add, _0xa374f) {
    if (!_0xa374f || typeof _0xa374f !== 'object') return _0xa374f;
    const _0x1802e5 = { ..._0xa374f },
      _0x39fac2 = (_0x43f378) => Object.prototype.hasOwnProperty.call(_0x1802e5, _0x43f378),
      _0x37a9dc = () => {
        const _0x3b402a = [_0x1802e5.images, _0x1802e5.videos].filter(Array.isArray);
        for (const _0x177a41 of _0x3b402a) {
          let _0x1e6b51 = '',
            _0x4e14d2 = false;
          for (const _0x22311a of _0x177a41) {
            if (!_0x22311a || typeof _0x22311a !== 'object') continue;
            const _0x32554f = String(_0x22311a.error || _0x22311a.message || '').trim();
            if (_0x32554f && !_0x1e6b51) _0x1e6b51 = _0x32554f;
            String(
              _0x22311a.localPath ||
                _0x22311a.originalLocalPath ||
                _0x22311a.displayLocalPath ||
                _0x22311a.thumbLocalPath ||
                _0x22311a.imageUrl ||
                _0x22311a.videoUrl ||
                _0x22311a.thumbUrl ||
                _0x22311a.sourceUrl ||
                '',
            ).trim() && (_0x4e14d2 = true);
          }
          if (_0x1e6b51 && !_0x4e14d2) return _0x1e6b51;
        }
        return String(_0x1802e5.jobError || '').trim();
      },
      _0x312b8c = _0x39fac2('isGenerating'),
      _0x3358f3 = _0x37a9dc(),
      _0x34aab = (_0x9cc6db) =>
        String(_0x9cc6db || '')
          .trim()
          .toLowerCase(),
      _0x1033be = (_0xd23d18) =>
        ['error', 'failed', 'fail', 'cancelled', 'canceled'].includes(_0x34aab(_0xd23d18)),
      _0x3028a0 = (_0x48c324) => {
        if (_0x39fac2(_0x48c324)) return String(_0x1802e5[_0x48c324] || '').trim();
        return String(_0x5b7add?.[_0x48c324] || '').trim();
      },
      _0xacb493 = () => !!_0x3028a0('dreaminaSubmitId'),
      _0x7c248d = (_0x295946) => {
        if (_0x1033be(_0x295946)) return true;
        if (_0xacb493()) return true;
        if (_0x34aab(_0x295946) === 'idle') return false;
        return _0x34aab(_0x1802e5.dreaminaTaskStatus) !== 'idle';
      },
      _0x3549ee = [
        {
          status: _0x39fac2('asyncTaskStatus') ? _0x1802e5.asyncTaskStatus : null,
          active:
            _0x1033be(_0x1802e5.asyncTaskStatus) ||
            !!_0x3028a0('asyncTaskId') ||
            _0x34aab(_0x1802e5.asyncTaskStatus) !== 'idle',
        },
        {
          status: _0x39fac2('rhTaskStatus') ? _0x1802e5.rhTaskStatus : null,
          active:
            _0x1033be(_0x1802e5.rhTaskStatus) ||
            !!_0x3028a0('rhTaskId') ||
            _0x34aab(_0x1802e5.rhTaskStatus) !== 'idle',
        },
        {
          status: _0x39fac2('dreaminaTaskStatus') ? _0x1802e5.dreaminaTaskStatus : null,
          active: _0x7c248d(_0x1802e5.dreaminaTaskStatus),
        },
        {
          status: _0x39fac2('dreaminaTaskPhase') ? _0x1802e5.dreaminaTaskPhase : null,
          active: _0x7c248d(_0x1802e5.dreaminaTaskPhase),
        },
        { status: _0x39fac2('mediaTaskStatus') ? _0x1802e5.mediaTaskStatus : null, active: true },
      ].filter((_0x426cc7) => _0x426cc7.active === true && String(_0x426cc7.status || '').trim()),
      _0x302e27 = _0x3549ee.find((_0x49d845) => isGenerationTaskTerminalStatus(_0x49d845.status))?.status,
      _0x21d1a2 = _0x39fac2('mediaTaskStatus')
        ? String(_0x1802e5.mediaTaskStatus || '')
            .trim()
            .toLowerCase()
        : '';
    !_0x312b8c && (_0x21d1a2 === 'waiting' || _0x21d1a2 === 'processing') && (_0x1802e5.isGenerating = true);
    if (_0x3358f3) {
      ((_0x1802e5.isGenerating = false), (_0x1802e5.jobStatus = 'error'), (_0x1802e5.jobError = _0x3358f3));
      if (_0x39fac2('dreaminaTaskStatus')) _0x1802e5.dreaminaTaskStatus = 'failed';
      if (_0x39fac2('dreaminaTaskPhase')) _0x1802e5.dreaminaTaskPhase = 'failed';
      if (_0x39fac2('dreaminaTaskLabel')) _0x1802e5.dreaminaTaskLabel = _0x3358f3;
      if (_0x39fac2('dreaminaTaskRecovering')) _0x1802e5.dreaminaTaskRecovering = false;
      if (_0x39fac2('asyncTaskStatus')) _0x1802e5.asyncTaskStatus = 'failed';
      if (_0x39fac2('asyncTaskRecovering')) _0x1802e5.asyncTaskRecovering = false;
      if (_0x39fac2('rhTaskStatus')) _0x1802e5.rhTaskStatus = 'failed';
      if (_0x39fac2('rhTaskRecovering')) _0x1802e5.rhTaskRecovering = false;
    }
    if (_0x302e27) {
      _0x1802e5.isGenerating = false;
      const _0x654671 = resolveJobStatusFromTaskStatus(_0x302e27, _0x1802e5.jobStatus ?? null);
      if (_0x654671 !== undefined) _0x1802e5.jobStatus = _0x654671;
      (_0x39fac2('dreaminaTaskStatus') || _0x39fac2('dreaminaTaskPhase')) &&
        (_0x1802e5.dreaminaTaskRecovering = false);
      if (_0x39fac2('asyncTaskStatus')) _0x1802e5.asyncTaskRecovering = false;
      if (_0x39fac2('rhTaskStatus')) _0x1802e5.rhTaskRecovering = false;
    }
    if (_0x1802e5.isGenerating === true) {
      if (!_0x39fac2('jobStatus')) _0x1802e5.jobStatus = 'running';
      const _0x3a8d63 = Number(_0x1802e5.generationStartTime);
      if (!Number.isFinite(_0x3a8d63) || _0x3a8d63 <= 0) {
        const _0x41851a = Number(_0x5b7add?.generationStartTime);
        _0x1802e5.generationStartTime = Number.isFinite(_0x41851a) && _0x41851a > 0 ? _0x41851a : Date.now();
      }
      return ((_0x1802e5.generationDuration = null), _0x1802e5);
    }
    const _0x556cc4 = _0x5b7add?.isGenerating === true,
      _0x23e251 =
        _0x1802e5.isGenerating === false &&
        _0x1802e5.generationDuration == null &&
        (_0x556cc4 || !!_0x3358f3 || !!_0x302e27);
    if (_0x23e251) {
      const _0x27e6de = _0x39fac2('generationStartTime')
        ? Number(_0x1802e5.generationStartTime)
        : Number(_0x5b7add?.generationStartTime);
      _0x1802e5.generationDuration =
        Number.isFinite(_0x27e6de) && _0x27e6de > 0
          ? Math.max(0, Date.now() - _0x27e6de)
          : _0x556cc4
            ? 0
            : _0x1802e5.generationDuration;
    }
    return _0x1802e5;
  }
  function _0x3fbc44() {
    if (_0x135c8c > 0) {
      _0x3d0976 = true;
      return;
    }
    for (const _0x119742 of _0x5f4349) {
      _0x119742(_0x36929b);
    }
    if (_0x137896.length > 0) {
      const _0xe7f712 = deepClone(_0x36929b);
      for (const _0x911e3f of _0x137896) {
        _0x911e3f(_0xe7f712);
      }
    }
    for (const {
      selector: _0x548b74,
      callback: _0x3c7888,
      isEqual: _0x327027,
      lastValue: _0xbab57b,
    } of _0x488878) {
      const _0xb09b95 = _0x548b74(_0x36929b);
      !_0x327027(_0xbab57b.value, _0xb09b95) &&
        ((_0xbab57b.value = snapshotSelectorValue(_0xb09b95)), _0x3c7888(_0xb09b95));
    }
  }
  function _0x55ed64(_0x48d345) {
    if (typeof _0x48d345 !== 'function') throw new TypeError('[store] batch() 的参数必须是函数');
    _0x135c8c++;
    try {
      return _0x48d345();
    } finally {
      (_0x135c8c--, _0x135c8c === 0 && _0x3d0976 && ((_0x3d0976 = false), _0x3fbc44()));
    }
  }
  function _0x626269() {
    _0x3fbc44();
  }
  function _0x1769b9() {
    _0x3fbc44();
  }
  function _0x4b9dbb(_0x32fca7) {
    if (typeof _0x32fca7 !== 'function') throw new TypeError('[store] subscribe() 的参数必须是一个函数');
    return (
      _0x137896.push(_0x32fca7),
      _0x32fca7(deepClone(_0x36929b)),
      function _0x22a108() {
        const _0x348036 = _0x137896.indexOf(_0x32fca7);
        _0x348036 !== -1 && _0x137896.splice(_0x348036, 1);
      }
    );
  }
  function _0x2817d4(_0x1b65a5) {
    if (typeof _0x1b65a5 !== 'function') throw new TypeError('[store] subscribeRaw() 的参数必须是一个函数');
    return (
      _0x5f4349.push(_0x1b65a5),
      _0x1b65a5(_0x36929b),
      function _0x317451() {
        const _0x14a8bc = _0x5f4349.indexOf(_0x1b65a5);
        _0x14a8bc !== -1 && _0x5f4349.splice(_0x14a8bc, 1);
      }
    );
  }
  function _0x45783d(_0x23caed, _0x5667bd, _0x3f2e85 = {}) {
    if (typeof _0x23caed !== 'function')
      throw new TypeError('[store] subscribeSelector() 的 selector 必须是函数');
    if (typeof _0x5667bd !== 'function')
      throw new TypeError('[store] subscribeSelector() 的 callback 必须是函数');
    const _0x10797c = _0x3f2e85.isEqual || shallowEqual,
      _0x232057 = _0x23caed(_0x36929b),
      _0x1146ab = {
        selector: _0x23caed,
        callback: _0x5667bd,
        isEqual: _0x10797c,
        lastValue: { value: snapshotSelectorValue(_0x232057) },
      };
    return (
      _0x488878.push(_0x1146ab),
      _0x5667bd(_0x232057),
      function _0x46d43c() {
        const _0x1ef891 = _0x488878.indexOf(_0x1146ab);
        _0x1ef891 !== -1 && _0x488878.splice(_0x1ef891, 1);
      }
    );
  }
  function _0x2d2833(_0x28103c) {
    if (!_0x28103c || !_0x28103c.id) throw new Error('[store] addNode() 需要提供含有 id 字段的节点数据');
    const _0x232ccb = applyFeatureSelectionsToNodeData(
        JSON.parse(JSON.stringify(_0x28103c)),
        _0x36929b.ui?.featureSelections || {},
      ),
      _0x4c2681 = sanitizeCanvasNodeMediaPatchForStore(_0x232ccb),
      _0x38eb3f = {
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
      _0xd0ff0b = Object.prototype.hasOwnProperty.call(_0x38eb3f, _0x4c2681.type)
        ? _0x38eb3f[_0x4c2681.type]
        : '未命名';
    _0x4c2681.type === 'storyboard' &&
      (!Array.isArray(_0x4c2681.cells)
        ? (_0x4c2681.cells = [])
        : (_0x4c2681.cells = _0x4c2681.cells.map((_0x38faa1) => ({ ..._0x38faa1, id: generateId('cell') }))));
    _0x4c2681.type === 'storyboard-script' &&
      (_0x4c2681.storyboardScript = createDefaultStoryboardScriptState(_0x4c2681.storyboardScript));
    _0x4c2681.type === 'comment-note' &&
      (_0x4c2681.jumpShortcut = normalizeCommentNoteJumpShortcut(_0x4c2681.jumpShortcut));
    const { _bizRev: _0x2a4ba2, ..._0x2f26ab } = _0x4c2681,
      _0x3e4f45 = _0x45d0b9(null, _0x2f26ab),
      _0xcc58 = { parentId: null, name: _0xd0ff0b, _bizRev: 1, ..._0x3e4f45 };
    (captureFeatureSelectionsFromNodePatch(_0xcc58, _0xcc58, _0x36929b.ui?.featureSelections || {}),
      (_0x36929b.nodes[_0xcc58.id] = _0xcc58),
      (_0x36929b._nodeCount = (_0x36929b._nodeCount || 0) + 1),
      _0x1bb4d0(),
      _0xcc58.parentId && _0x152cda(_0xcc58.id, _0xcc58.parentId),
      _0x3fbc44());
  }
  function _0x152cda(_0x4123fc, _0x1aefcb, _0x1f352a = null) {
    (_0x1f352a && _0x36929b._parentToChildren[_0x1f352a]?.delete(_0x4123fc),
      _0x1aefcb &&
        (!_0x36929b._parentToChildren[_0x1aefcb] && (_0x36929b._parentToChildren[_0x1aefcb] = new Set()),
        _0x36929b._parentToChildren[_0x1aefcb].add(_0x4123fc)));
  }
  function _0x28a4b1(_0x5ad77f, _0x51578d = null) {
    if (_0x51578d) {
      const _0x4a4e16 = _0x36929b._parentToChildren[_0x51578d];
      _0x4a4e16 &&
        (_0x4a4e16.delete(_0x5ad77f), _0x4a4e16.size === 0 && delete _0x36929b._parentToChildren[_0x51578d]);
    }
    _0x36929b._parentToChildren[_0x5ad77f] && delete _0x36929b._parentToChildren[_0x5ad77f];
  }
  function _0x55b252(_0x4f08f5) {
    const _0x2161e5 = new Set(_0x4f08f5),
      _0x3b2738 = [..._0x4f08f5];
    while (_0x3b2738.length > 0) {
      const _0x2e6e1e = _0x3b2738.pop(),
        _0x41b010 = _0x36929b._parentToChildren[_0x2e6e1e];
      if (!_0x41b010) continue;
      for (const _0xaf3afc of _0x41b010) {
        if (!_0x36929b.nodes[_0xaf3afc]) continue;
        if (_0x2161e5.has(_0xaf3afc)) continue;
        (_0x2161e5.add(_0xaf3afc), _0x3b2738.push(_0xaf3afc));
      }
    }
    return _0x2161e5;
  }
  function _0x344d66(_0x457fe2, _0x18e6ef, _0x249125) {
    _0x1a3394([_0x457fe2], _0x18e6ef, _0x249125);
  }
  function _0x1a3394(_0x5bca7d, _0x12a6d6, _0x199e94) {
    if (!_0x5bca7d || _0x5bca7d.length === 0) return;
    const _0x55fe2e = Number(_0x12a6d6),
      _0x349836 = Number(_0x199e94);
    if (!Number.isFinite(_0x55fe2e) || !Number.isFinite(_0x349836)) return;
    if (_0x55fe2e === 0 && _0x349836 === 0) return;
    const _0x34bce5 = _0x55b252(_0x5bca7d);
    let _0x3e2928 = false;
    for (const _0x40e464 of _0x34bce5) {
      const _0x3b427b = _0x36929b.nodes[_0x40e464];
      if (!_0x3b427b) continue;
      const _0x2c7b21 = (_0x3b427b.x || 0) + _0x55fe2e,
        _0x310c58 = (_0x3b427b.y || 0) + _0x349836;
      if (_0x2c7b21 === _0x3b427b.x && _0x310c58 === _0x3b427b.y) continue;
      ((_0x3b427b.x = _0x2c7b21), (_0x3b427b.y = _0x310c58), (_0x3e2928 = true));
    }
    if (!_0x3e2928) return;
    (_0x1bb4d0(), _0x3fbc44());
  }
  function _0x2e1381(_0x339b25, _0x33ae68, _0x2d298d, _0x1327c2) {
    if (!_0x33ae68) return;
    const _0xc9e42b = _0x339b25[_0x33ae68];
    if (_0xc9e42b) {
      ((_0xc9e42b.dx += _0x2d298d), (_0xc9e42b.dy += _0x1327c2));
      return;
    }
    _0x339b25[_0x33ae68] = { dx: _0x2d298d, dy: _0x1327c2 };
  }
  function _0x5acfa6(_0x448145) {
    if (!_0x448145 || typeof _0x448145 !== 'object') return;
    const _0xb85bdf = {};
    for (const [_0x4474bd, _0x49f40e] of Object.entries(_0x448145)) {
      if (!_0x4474bd || !_0x49f40e || !_0x36929b.nodes[_0x4474bd]) continue;
      const _0xa59e2f = Number(_0x49f40e.dx),
        _0x20015a = Number(_0x49f40e.dy);
      if (!Number.isFinite(_0xa59e2f) || !Number.isFinite(_0x20015a)) continue;
      if (_0xa59e2f === 0 && _0x20015a === 0) continue;
      _0xb85bdf[_0x4474bd] = { dx: _0xa59e2f, dy: _0x20015a };
    }
    const _0x2e68d6 = Object.keys(_0xb85bdf);
    if (_0x2e68d6.length === 0) return;
    const _0x655ed9 = new Set(_0x2e68d6),
      _0x1b90fb = {};
    for (const _0x376401 of _0x2e68d6) {
      const _0x46b44d = _0xb85bdf[_0x376401];
      _0x2e1381(_0x1b90fb, _0x376401, _0x46b44d.dx, _0x46b44d.dy);
      const _0x43cc5c = [_0x376401];
      while (_0x43cc5c.length > 0) {
        const _0x553d84 = _0x43cc5c.pop(),
          _0x1a8529 = _0x36929b._parentToChildren[_0x553d84];
        if (!_0x1a8529) continue;
        for (const _0x49f26c of _0x1a8529) {
          if (!_0x36929b.nodes[_0x49f26c]) continue;
          if (_0x655ed9.has(_0x49f26c)) continue;
          (_0x2e1381(_0x1b90fb, _0x49f26c, _0x46b44d.dx, _0x46b44d.dy), _0x43cc5c.push(_0x49f26c));
        }
      }
    }
    let _0x30ed52 = false;
    for (const [_0x10fffd, _0x4d0994] of Object.entries(_0x1b90fb)) {
      const _0x476353 = _0x36929b.nodes[_0x10fffd];
      if (!_0x476353) continue;
      const _0x4d4b11 = (_0x476353.x || 0) + _0x4d0994.dx,
        _0x18f1e3 = (_0x476353.y || 0) + _0x4d0994.dy;
      if (_0x4d4b11 === _0x476353.x && _0x18f1e3 === _0x476353.y) continue;
      ((_0x476353.x = _0x4d4b11), (_0x476353.y = _0x18f1e3), (_0x30ed52 = true));
    }
    if (!_0x30ed52) return;
    (_0x1bb4d0(), _0x3fbc44());
  }
  function _0x5190ca(_0x1a1e3b, _0x4c9c48) {
    if (!Array.isArray(_0x1a1e3b) || _0x1a1e3b.length === 0) return;
    const _0x567a9b = _0x4c9c48 || null;
    let _0x3571cc = false;
    _0x1a1e3b.forEach((_0x5a5f53) => {
      const _0x2345f1 = _0x36929b.nodes[_0x5a5f53];
      if (_0x2345f1) {
        const _0x4f9606 = _0x2345f1.parentId || null;
        if (_0x4f9606 === _0x567a9b) return;
        ((_0x2345f1.parentId = _0x567a9b),
          (_0x2345f1._bizRev = (typeof _0x2345f1._bizRev === 'number' ? _0x2345f1._bizRev : 0) + 1),
          _0x152cda(_0x5a5f53, _0x567a9b, _0x4f9606),
          (_0x3571cc = true));
      }
    });
    if (!_0x3571cc) return;
    (_0x1bb4d0(), _0x3fbc44());
  }
  function _0x315dc1(_0x541841 = {}) {
    const _0x185f26 = getFixedInputSlotConfigFromManifest(_0x541841);
    if (!_0x185f26) return null;
    const _0x22c9a5 = getTargetInputPolicy(_0x541841),
      _0x1da7d6 = new Set(_0x185f26.visibleSlots || []),
      _0x6ba3f = new Set(),
      _0x15882 = new Set(),
      _0x14c262 = {},
      _0x35fdc3 = new Map();
    (_0x185f26.exclusiveGroups || []).forEach((_0x1a09de) => {
      (_0x1a09de.slots || []).forEach((_0x12966f) => {
        _0x35fdc3.set(_0x12966f, _0x1a09de.id);
      });
    });
    const _0x1d6af9 = (_0x2241e5, _0x43c609) => {
      const _0x134aa3 = Number(_0x22c9a5?.maxByKind?.[_0x2241e5]),
        _0x597cea = Number(_0x14c262[_0x2241e5] || 0);
      if (!Number.isFinite(_0x134aa3) || _0x134aa3 <= _0x43c609 || _0x597cea >= _0x134aa3) return false;
      return ((_0x14c262[_0x2241e5] = _0x597cea + 1), true);
    };
    return {
      reserveSlot(_0x4c3f34, _0x263256 = null) {
        const _0x5257af = String(_0x4c3f34 || '').trim();
        if (_0x5257af === 'text') return true;
        const _0x17174d = String(_0x263256?.refSlot || '').trim(),
          _0x21b689 = (_0x185f26.slotOrderByType?.[_0x5257af] || []).filter((_0x1f45cb) =>
            _0x1da7d6.has(_0x1f45cb),
          );
        if (_0x21b689.length === 0) return _0x1d6af9(_0x5257af, 0);
        const _0x2380fb =
          _0x17174d && _0x21b689.includes(_0x17174d) && _0x1da7d6.has(_0x17174d)
            ? _0x17174d
            : _0x21b689.find((_0x6c0a5f) => !_0x6ba3f.has(_0x6c0a5f));
        if (!_0x2380fb || _0x6ba3f.has(_0x2380fb)) return _0x1d6af9(_0x5257af, _0x21b689.length);
        const _0x3da98b = _0x35fdc3.get(_0x2380fb);
        if (_0x3da98b && _0x15882.has(_0x3da98b)) return _0x1d6af9(_0x5257af, _0x21b689.length);
        _0x6ba3f.add(_0x2380fb);
        if (_0x3da98b) _0x15882.add(_0x3da98b);
        return ((_0x14c262[_0x5257af] = Number(_0x14c262[_0x5257af] || 0) + 1), _0x2380fb);
      },
      reserve(_0xa5b053, _0x40a2a4 = null) {
        return !!this.reserveSlot(_0xa5b053, _0x40a2a4);
      },
    };
  }
  function _0x34557a(_0x563309) {
    const _0x459c5a = _0x36929b,
      _0x253e6c = _0x459c5a.nodes[_0x563309];
    if (!_0x253e6c) return [];
    if (!canTargetReceiveInputs(_0x253e6c)) return [];
    const _0x124663 = _0x253e6c.parentId,
      _0x5a81e2 = getTargetInputPolicy(_0x253e6c),
      _0x15ecfe = _0x315dc1(_0x253e6c),
      _0x547e79 = { text: 0, image: 0, video: 0, audio: 0 },
      _0x439297 = [],
      _0x1a4545 = [],
      _0x1f4f31 = new Set(),
      _0x2f79e4 = (_0x31646c, _0x3ed43c = null) => {
        const _0x5c4659 = resolveEffectiveInputKind(_0x31646c, _0x3ed43c);
        if (!_0x5c4659) return '';
        if (!isInputKindAllowed(_0x5a81e2, _0x5c4659)) return '';
        if (!hasUsableInputNodeSource(_0x31646c, { edge: _0x3ed43c, kind: _0x5c4659 })) return '';
        return _0x5c4659;
      };
    return (
      Object.values(_0x459c5a.edges || {}).forEach((_0x565ec1) => {
        if (!_0x565ec1 || _0x565ec1.targetId !== _0x563309) return;
        const _0x1300a4 = _0x459c5a.nodes[_0x565ec1.sourceId];
        if (!_0x1300a4) return;
        if (isGroupNodeData(_0x1300a4)) return;
        const _0x1855dd = _0x2f79e4(_0x1300a4, _0x565ec1);
        if (!_0x1855dd) return;
        const _0x210782 = _0x15ecfe ? _0x15ecfe.reserveSlot(_0x1855dd, _0x565ec1) : '';
        if (_0x15ecfe && !_0x210782) return;
        (_0x210782 && typeof _0x210782 === 'string' && !_0x565ec1.refSlot
          ? _0x439297.push({ ..._0x565ec1, refSlot: _0x210782 })
          : _0x439297.push(_0x565ec1),
          _0x1f4f31.add(_0x565ec1.sourceId),
          (_0x547e79[_0x1855dd] = (_0x547e79[_0x1855dd] || 0) + 1));
      }),
      Object.values(_0x459c5a.edges || {}).forEach((_0x61b7a1) => {
        if (!_0x61b7a1 || _0x61b7a1.targetId !== _0x563309) return;
        const _0x4de55a = _0x459c5a.nodes[_0x61b7a1.sourceId];
        if (!isGroupNodeData(_0x4de55a)) return;
        _0x439297.push(
          ...collectGroupOutputIncomingEdges({
            edge: _0x61b7a1,
            groupNode: _0x4de55a,
            nodes: _0x459c5a.nodes,
            targetId: _0x563309,
            policy: _0x5a81e2,
            counts: _0x547e79,
            directSourceIds: _0x1f4f31,
            acceptSource: _0x2f79e4,
            canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
            reserveInputSlot: _0x15ecfe
              ? (_0x4f5ff3, _0x1aa091) => _0x15ecfe.reserveSlot(_0x4f5ff3, _0x1aa091)
              : null,
          }),
        );
      }),
      _0x124663 &&
        Object.values(_0x459c5a.edges || {}).forEach((_0x5d27c4) => {
          if (!_0x5d27c4 || _0x5d27c4.targetId !== _0x124663) return;
          const _0x4fddfb = _0x459c5a.nodes[_0x5d27c4.sourceId];
          if (!_0x4fddfb) return;
          if (isGroupNodeData(_0x4fddfb)) {
            const _0x485b89 = collectGroupOutputIncomingEdges({
              edge: _0x5d27c4,
              groupNode: _0x4fddfb,
              nodes: _0x459c5a.nodes,
              targetId: _0x563309,
              policy: _0x5a81e2,
              counts: _0x547e79,
              directSourceIds: _0x1f4f31,
              acceptSource: _0x2f79e4,
              canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
              reserveInputSlot: _0x15ecfe
                ? (_0x3a41fd, _0x48745c) => _0x15ecfe.reserveSlot(_0x3a41fd, _0x48745c)
                : null,
            });
            _0x1a4545.push(
              ..._0x485b89.map((_0x1c3176) => ({
                ..._0x1c3176,
                isGroupShared: true,
                sharedGroupId: _0x124663,
              })),
            );
            return;
          }
          const _0x1fb2b4 = _0x2f79e4(_0x4fddfb, _0x5d27c4);
          if (!_0x1fb2b4) return;
          if (!canAppendInputKindWithinLimit(_0x5a81e2, _0x1fb2b4, _0x547e79)) return;
          const _0x1a680f = _0x15ecfe ? _0x15ecfe.reserveSlot(_0x1fb2b4, _0x5d27c4) : '';
          if (_0x15ecfe && !_0x1a680f) return;
          (_0x1a4545.push({
            ..._0x5d27c4,
            ...(_0x1a680f && typeof _0x1a680f === 'string' && !_0x5d27c4.refSlot
              ? { refSlot: _0x1a680f }
              : null),
            isGroupShared: true,
            sharedGroupId: _0x124663,
            effectiveTargetId: _0x563309,
          }),
            (_0x547e79[_0x1fb2b4] = (_0x547e79[_0x1fb2b4] || 0) + 1));
        }),
      [..._0x439297, ..._0x1a4545].map((_0x15f148) => cloneEdgeSnapshot(_0x15f148))
    );
  }
  function _0x3a30d6(_0x3f3141) {
    const _0x16a51b = new Set(_0x3f3141),
      _0x55c383 = [];
    for (const _0x51ac7c of _0x3f3141) {
      const _0x2a1a60 = _0x36929b.nodes[_0x51ac7c];
      if (!_0x2a1a60) continue;
      _0x55c383.push({ id: _0x51ac7c, parentId: _0x2a1a60.parentId || null });
    }
    for (const _0x8f2e43 of _0x3f3141) {
      delete _0x36929b.nodes[_0x8f2e43];
    }
    _0x36929b._nodeCount = Object.keys(_0x36929b.nodes).length;
    for (const { id: _0x668cad, parentId: _0x1c7014 } of _0x55c383) {
      _0x28a4b1(_0x668cad, _0x1c7014);
    }
    let _0x3c0f1c = false;
    for (const _0x4dcb77 of Object.keys(_0x36929b.edges)) {
      const _0x13f9ab = _0x36929b.edges[_0x4dcb77];
      (_0x16a51b.has(_0x13f9ab.sourceId) || _0x16a51b.has(_0x13f9ab.targetId)) &&
        (delete _0x36929b.edges[_0x4dcb77], (_0x3c0f1c = true));
    }
    if (_0x3c0f1c) _0x35099c();
    (_0x1bb4d0(), _0x3fbc44());
  }
  function _0xcb3d10(_0x4db921) {
    if (!_0x4db921 || !_0x4db921.id) throw new Error('[store] addEdge() 需要提供含有 id 字段的连线数据');
    ((_0x36929b.edges[_0x4db921.id] = { isThumbnailActive: true, type: null, ..._0x4db921 }),
      _0x35099c(),
      _0x1bb4d0(),
      _0x3fbc44());
  }
  function _0x2107c7(_0x582314, _0x533039) {
    (_0x582314.forEach((_0x14df78) => {
      if (_0x36929b.edges[_0x14df78]) delete _0x36929b.edges[_0x14df78];
    }),
      _0x533039.forEach((_0x7549f8) => {
        const {
          isGroupShared: _0x54cf4f,
          sharedGroupId: _0x783483,
          effectiveTargetId: _0x434067,
          ..._0xd79a45
        } = _0x7549f8 || {};
        if (!_0xd79a45.id) return;
        _0x36929b.edges[_0xd79a45.id] = _0xd79a45;
      }),
      _0x35099c(),
      _0x1bb4d0(),
      _0x3fbc44());
  }
  function _0x4bd4ec(_0x5c133b, _0x1018c7, _0x14f060) {
    const _0x276a02 = _0x36929b.viewport || {};
    if (_0x276a02.x === _0x5c133b && _0x276a02.y === _0x1018c7 && _0x276a02.zoom === _0x14f060) return;
    const _0x541e90 = _0x276a02.zoom;
    _0x36929b.viewport = { x: _0x5c133b, y: _0x1018c7, zoom: _0x14f060 };
    if (_0x541e90 !== _0x14f060) {
      if (_0x2edeb0()) _0x1bb4d0();
    }
    _0x3fbc44();
  }
  function _0x5bc2c1() {
    (_0x1bb4d0(), _0x3fbc44());
  }
  function _0x48b811(_0x3d2ecd, _0x4ebbf8) {
    const _0x24c000 = _0x36929b.nodes[_0x3d2ecd];
    if (!_0x24c000) throw new Error('[store] updateNodeData() 找不到 id 为 "' + _0x3d2ecd + '" 的节点');
    const _0x236db5 = JSON.parse(JSON.stringify(_0x4ebbf8)),
      { _bizRev: _0x2ce869, ..._0x242bd1 } = _0x236db5;
    _0x242bd1.cells &&
      Array.isArray(_0x242bd1.cells) &&
      (_0x242bd1.cells = _0x242bd1.cells.map((_0x104df9) => ({ ..._0x104df9 })));
    const _0x3efe43 = sanitizeCanvasNodeMediaPatchForStore(_0x242bd1, _0x24c000),
      _0x37806e = _0x45d0b9(_0x24c000, _0x3efe43);
    if (_isPatchNoop(_0x24c000, _0x37806e)) return;
    const _0x277f11 = Object.prototype.hasOwnProperty.call(_0x37806e, 'parentId')
      ? _0x37806e.parentId
      : _0x24c000.parentId;
    captureFeatureSelectionsFromNodePatch(_0x24c000, _0x37806e, _0x36929b.ui?.featureSelections || {});
    const _0x190b7d = (typeof _0x24c000._bizRev === 'number' ? _0x24c000._bizRev : 0) + 1;
    ((_0x36929b.nodes[_0x3d2ecd] = { ..._0x24c000, ..._0x37806e, _bizRev: _0x190b7d }),
      _0x277f11 !== _0x24c000.parentId && _0x152cda(_0x3d2ecd, _0x277f11, _0x24c000.parentId),
      _0x1bb4d0(),
      _0x3fbc44());
  }
  function _0x5ce97d(_0x3e773c) {
    let _0xf44421 = false;
    for (const [_0x48902a, _0x2b933d] of Object.entries(_0x3e773c)) {
      const _0x9a6312 = _0x36929b.nodes[_0x48902a];
      if (_0x9a6312) {
        const _0x4b38fa = JSON.parse(JSON.stringify(_0x2b933d)),
          { _bizRev: _0xd9248a, ..._0x17b344 } = _0x4b38fa;
        _0x17b344.cells &&
          Array.isArray(_0x17b344.cells) &&
          (_0x17b344.cells = _0x17b344.cells.map((_0x21f3ae) => ({ ..._0x21f3ae })));
        const _0x2e541c = sanitizeCanvasNodeMediaPatchForStore(_0x17b344, _0x9a6312),
          _0x45fb8c = _0x45d0b9(_0x9a6312, _0x2e541c);
        if (_isPatchNoop(_0x9a6312, _0x45fb8c)) continue;
        const _0x492d36 = Object.prototype.hasOwnProperty.call(_0x45fb8c, 'parentId')
          ? _0x45fb8c.parentId
          : _0x9a6312.parentId;
        captureFeatureSelectionsFromNodePatch(_0x9a6312, _0x45fb8c, _0x36929b.ui?.featureSelections || {});
        const _0x2acb86 = (typeof _0x9a6312._bizRev === 'number' ? _0x9a6312._bizRev : 0) + 1;
        ((_0x36929b.nodes[_0x48902a] = { ..._0x9a6312, ..._0x45fb8c, _bizRev: _0x2acb86 }),
          _0x492d36 !== _0x9a6312.parentId && _0x152cda(_0x48902a, _0x492d36, _0x9a6312.parentId),
          (_0xf44421 = true));
      }
    }
    _0xf44421 && (_0x1bb4d0(), _0x3fbc44());
  }
  function _0x86c72b(_0x1dea6e, _0x1e232b, _0x3da132, _0x42b9d8) {
    const _0x4f9f4a = _0x36929b.nodes[_0x1dea6e],
      _0x10ec40 = _0x36929b.nodes[_0x3da132],
      _0x5894e8 = Number(_0x1e232b),
      _0x110441 = Number(_0x42b9d8);
    if (
      !_isValidStoryboardCellTarget(_0x4f9f4a, _0x5894e8) ||
      !_isValidStoryboardCellTarget(_0x10ec40, _0x110441)
    )
      return false;
    if (_0x1dea6e === _0x3da132 && _0x5894e8 === _0x110441) return false;
    const _0x3a6dd3 = _0x4f9f4a.cells.slice(),
      _0x5be774 = _0x4f9f4a.cells[_0x5894e8],
      _0x5b3d70 = _0x10ec40.cells[_0x110441];
    if (_0x1dea6e === _0x3da132)
      ((_0x3a6dd3[_0x110441] = _placeStoryboardCellForSwap(
        cloneStoryboardCellForSwapDestination(_0x5be774),
        _0x5be774,
        _0x4f9f4a,
        _0x5894e8,
        _0x4f9f4a,
        _0x110441,
      )),
        (_0x3a6dd3[_0x5894e8] = _placeStoryboardCellForSwap(
          cloneStoryboardCellForSwapDestination(_0x5b3d70),
          _0x5b3d70,
          _0x4f9f4a,
          _0x110441,
          _0x4f9f4a,
          _0x5894e8,
        )),
        (_0x36929b.nodes[_0x1dea6e] = {
          ..._0x4f9f4a,
          cells: _0x3a6dd3,
          _bizRev: (typeof _0x4f9f4a._bizRev === 'number' ? _0x4f9f4a._bizRev : 0) + 1,
        }));
    else {
      const _0x3c4614 = _0x10ec40.cells.slice();
      ((_0x3c4614[_0x110441] = _placeStoryboardCellForSwap(
        cloneStoryboardCellForSwapDestination(_0x5be774),
        _0x5be774,
        _0x4f9f4a,
        _0x5894e8,
        _0x10ec40,
        _0x110441,
      )),
        (_0x3a6dd3[_0x5894e8] = normalizeEmptyStoryboardCell({
          ...cloneStoryboardCellForSwap(_0x5be774),
          ..._getStoryboardCellPosition(_0x4f9f4a, _0x5894e8),
        })),
        (_0x36929b.nodes[_0x1dea6e] = {
          ..._0x4f9f4a,
          cells: _0x3a6dd3,
          _bizRev: (typeof _0x4f9f4a._bizRev === 'number' ? _0x4f9f4a._bizRev : 0) + 1,
        }),
        (_0x36929b.nodes[_0x3da132] = {
          ..._0x10ec40,
          cells: _0x3c4614,
          _bizRev: (typeof _0x10ec40._bizRev === 'number' ? _0x10ec40._bizRev : 0) + 1,
        }));
    }
    return (_0x1bb4d0(), _0x3fbc44(), true);
  }
  function _0x483c6d(_0x198e89, _0x404b90) {
    const _0xa75780 = _0x36929b.nodes[_0x198e89];
    if (!_0xa75780) return;
    if (_0xa75780.name === _0x404b90) return;
    const _0x2db21c = (typeof _0xa75780._bizRev === 'number' ? _0xa75780._bizRev : 0) + 1;
    ((_0x36929b.nodes[_0x198e89] = { ..._0xa75780, name: _0x404b90, _bizRev: _0x2db21c }),
      _0x1bb4d0(),
      _0x3fbc44());
  }
  function _0x51cbba(_0x2dc257) {
    _0x36929b.edges[_0x2dc257] && (delete _0x36929b.edges[_0x2dc257], _0x35099c(), _0x1bb4d0(), _0x3fbc44());
  }
  function _0x265616(_0x2d628b, _0x1b45c4, _0x560dc6, _0x1c47bd) {
    ((_0x36929b.picker = {
      visible: true,
      x: _0x560dc6,
      y: _0x1c47bd,
      screenX: _0x2d628b,
      screenY: _0x1b45c4,
    }),
      _0x3fbc44());
  }
  function _0x4946d1() {
    if (_0x36929b.picker?.visible === false) return;
    ((_0x36929b.picker = { ..._0x36929b.picker, visible: false }), _0x3fbc44());
  }
  function _0x4e40ac() {
    return deepClone(_0x36929b);
  }
  function _0x499b4e() {
    return _0x36929b;
  }
  function _0x4b0af2(_0x3cb36e) {
    if (!_0x3cb36e) return;
    _0x36929b.nodes = deepClone(_0x3cb36e.nodes ?? {});
    for (const [_0x2606ad, _0x29392c] of Object.entries(_0x36929b.nodes)) {
      _0x36929b.nodes[_0x2606ad] = applyFeatureSelectionsToNodeData(
        _0x29392c,
        _0x36929b.ui?.featureSelections || {},
      );
    }
    (normalizeNodesCollection(_0x36929b.nodes),
      (_0x36929b.edges = deepClone(_0x3cb36e.edges ?? {})),
      (_0x36929b.viewport = deepClone(_0x3cb36e.viewport ?? { x: 0, y: 0, zoom: 1 })),
      (_0x36929b._nodeCount = Object.keys(_0x36929b.nodes).length));
    for (const _0x5245a8 of Object.values(_0x36929b.nodes)) {
      if (!_0x5245a8 || typeof _0x5245a8 !== 'object') continue;
      if (typeof _0x5245a8._bizRev !== 'number') _0x5245a8._bizRev = 1;
    }
    _0x36929b._parentToChildren = {};
    for (const [_0x1a3570, _0x1eca11] of Object.entries(_0x36929b.nodes)) {
      _0x1eca11.parentId && _0x152cda(_0x1a3570, _0x1eca11.parentId);
    }
    (_0x35099c(), _0x1bb4d0(), _0x3fbc44());
  }
  function _0x561e04() {
    const _0x393f59 = {};
    for (const [_0x43ec74, _0x2380a8] of Object.entries(_0x36929b.nodes || {})) {
      _0x393f59[_0x43ec74] = cloneNodeSnapshot(_0x2380a8, { stripPanoramaViewport: true });
    }
    const _0x5ddb01 = {};
    for (const [_0x5eec45, _0x28fe2c] of Object.entries(_0x36929b.edges || {})) {
      _0x5ddb01[_0x5eec45] = cloneEdgeSnapshot(_0x28fe2c);
    }
    return { nodes: _0x393f59, edges: _0x5ddb01 };
  }
  function _0x555bbe(_0x4432a3) {
    if (!_0x4432a3) return;
    const _0x11e714 = _0x36929b.nodes || {},
      _0xb3b391 = deepClone(_0x4432a3.nodes ?? {});
    for (const [_0x5c4139, _0x117539] of Object.entries(_0xb3b391)) {
      if (!_0x117539 || typeof _0x117539 !== 'object') continue;
      const _0x110b6a = _0x11e714[_0x5c4139];
      if (_0x117539.type === 'panorama-scene') {
        const _0x3b82d4 = _0x110b6a?.sceneNode?.viewport;
        _0x3b82d4 &&
          (_0x117539.sceneNode = { ...(_0x117539.sceneNode || {}), viewport: deepClone(_0x3b82d4) });
      } else {
        if (_0x117539.type === 'panorama-360') {
          const _0x369d92 = _0x110b6a?.panorama360Node?.viewport;
          _0x369d92 &&
            (_0x117539.panorama360Node = {
              ...(_0x117539.panorama360Node || {}),
              viewport: deepClone(_0x369d92),
            });
        } else _0x117539.type === 'ai-image' && normalizeAiImageRunningHistorySnapshot(_0x117539);
      }
    }
    _0x4b0af2({ ..._0x4432a3, nodes: _0xb3b391, viewport: cloneViewportSnapshot(_0x36929b.viewport) });
  }
  function _0x54527a(_0x36e041) {
    const _0x2be8f0 = Object.values(_0x36929b.edges).filter((_0x5f19d4) => _0x5f19d4.targetId === _0x36e041);
    return _0x2be8f0
      .map((_0x516589) => _0x36929b.nodes[_0x516589.sourceId])
      .filter((_0x42af0e) => !!_0x42af0e);
  }
  function _0x296e26(_0x1acb8e, _0x5d3213) {
    if (!_0x5d3213 || typeof _0x5d3213 !== 'object') return false;
    for (const [_0x290b5e, _0x42b407] of Object.entries(_0x5d3213)) {
      if (_0x1acb8e?.[_0x290b5e] !== _0x42b407) return true;
    }
    return false;
  }
  function _0x118a16(_0x2bd9b2, _0x3ab9ed) {
    if (_0x2bd9b2 === _0x3ab9ed) return true;
    if (!Array.isArray(_0x2bd9b2) || !Array.isArray(_0x3ab9ed)) return false;
    if (_0x2bd9b2.length !== _0x3ab9ed.length) return false;
    for (let _0x112e77 = 0; _0x112e77 < _0x2bd9b2.length; _0x112e77 += 1) {
      if (!Object.is(_0x2bd9b2[_0x112e77], _0x3ab9ed[_0x112e77])) return false;
    }
    return true;
  }
  function _0x21400e(_0x440c8e, _0x5e4d6c) {
    if (_0x440c8e === _0x5e4d6c) return true;
    if (
      !_0x440c8e ||
      !_0x5e4d6c ||
      typeof _0x440c8e !== 'object' ||
      typeof _0x5e4d6c !== 'object' ||
      Array.isArray(_0x440c8e) ||
      Array.isArray(_0x5e4d6c)
    )
      return false;
    const _0x4ea00c = Object.keys(_0x440c8e),
      _0x5c30bb = Object.keys(_0x5e4d6c);
    if (_0x4ea00c.length !== _0x5c30bb.length) return false;
    for (const _0x1f7c20 of _0x4ea00c) {
      if (!Object.prototype.hasOwnProperty.call(_0x5e4d6c, _0x1f7c20)) return false;
      const _0x16b3a1 = _0x440c8e[_0x1f7c20],
        _0x1effeb = _0x5e4d6c[_0x1f7c20];
      if (Array.isArray(_0x16b3a1) || Array.isArray(_0x1effeb)) {
        if (!_0x118a16(_0x16b3a1, _0x1effeb)) return false;
      } else {
        if (!Object.is(_0x16b3a1, _0x1effeb)) return false;
      }
    }
    return true;
  }
  function _0x5a1e85(_0x119d8e) {
    if (!_0x119d8e || typeof _0x119d8e !== 'object') return;
    if (!_0x296e26(_0x36929b.selectionBox, _0x119d8e)) return;
    ((_0x36929b.selectionBox = { ..._0x36929b.selectionBox, ..._0x119d8e }), _0x3fbc44());
  }
  function _0x2d557b(_0x21899d) {
    const _0x3ce653 = _0x21899d || {};
    if (!_0x296e26(_0x36929b.selectionMeta, _0x3ce653)) return;
    ((_0x36929b.selectionMeta = { ..._0x36929b.selectionMeta, ..._0x3ce653 }), _0x3fbc44());
  }
  function _0x2fb512(_0x2dd0b5) {
    const _0x9e627c = Array.from(_0x2dd0b5 || []);
    if (_0x118a16(_0x36929b.selectedNodeIds, _0x9e627c)) return;
    ((_0x36929b.selectedNodeIds = _0x9e627c), _0x3fbc44());
  }
  function _0x512409() {
    const _0x55a918 = _0x36929b.selectionBox?.active === true,
      _0x315f4c = Array.isArray(_0x36929b.selectedNodeIds) ? _0x36929b.selectedNodeIds.length > 0 : false,
      _0x2a48b7 = _0x36929b.selectionMeta?.source != null;
    if (!_0x55a918 && !_0x315f4c && !_0x2a48b7) return;
    ((_0x36929b.selectionBox.active = false),
      (_0x36929b.selectedNodeIds = []),
      (_0x36929b.selectionMeta.source = null),
      _0x3fbc44());
  }
  function _0x2b5b97(_0x10b890, _0x57078e, _0x5f542c) {
    ((_0x36929b.contextMenu = { visible: true, x: _0x10b890, y: _0x57078e, items: _0x5f542c }), _0x3fbc44());
  }
  function _0x51575e() {
    ((_0x36929b.contextMenu = { visible: false, x: 0, y: 0, items: [] }), _0x3fbc44());
  }
  function _0x27474e({ srcId: _0x15757a, invalidNodeIds: _0x4b970d, hoverId: _0x121fd4, side: _0x21e105 }) {
    const _0x2a9c6f = {
      srcId: _0x15757a !== undefined ? _0x15757a : _0x36929b.connOverlay.srcId,
      invalidNodeIds:
        _0x4b970d !== undefined
          ? Array.isArray(_0x4b970d)
            ? _0x4b970d
            : []
          : _0x36929b.connOverlay.invalidNodeIds,
      hoverId: _0x121fd4 !== undefined ? _0x121fd4 : _0x36929b.connOverlay.hoverId,
      side: _0x21e105 !== undefined ? _0x21e105 : _0x36929b.connOverlay.side,
    };
    if (_0x21400e(_0x36929b.connOverlay, _0x2a9c6f)) return;
    ((_0x36929b.connOverlay = _0x2a9c6f), _0x3fbc44());
  }
  function _0x58a54f() {
    const _0x7a646 = { srcId: null, invalidNodeIds: [], hoverId: null, side: null };
    if (_0x21400e(_0x36929b.connOverlay, _0x7a646)) return;
    ((_0x36929b.connOverlay = _0x7a646), _0x3fbc44());
  }
  function _0x1d9961() {
    const _0x2a3a0d = Object.values(_0x36929b.nodes || {}).map((_0x37bbfd) =>
        cloneNodeSnapshot(_0x37bbfd, { stripRichText: true }),
      ),
      _0x5bb086 = Object.values(_0x36929b.edges || {}).map((_0x11b1e7) => cloneEdgeSnapshot(_0x11b1e7)),
      _0x5c00bb = {
        nodes: _0x2a3a0d,
        edges: _0x5bb086,
        viewport: cloneViewportSnapshot(_0x36929b.viewport),
        assets: Array.isArray(_0x36929b.assets)
          ? _0x36929b.assets.map((_0x490f26) => cloneAssetSnapshot(_0x490f26))
          : [],
      };
    return sanitizeSerializedCanvasData(_0x5c00bb);
  }
  function _0x2e9360(_0x55fb49, { preserveLiveGeneration: preserveLiveGeneration = false } = {}) {
    if (!_0x55fb49) return;
    const _0x3bd42e = Date.now(),
      _0x294df4 = _0x36929b.ui?.featureSelections || {};
    _0x55fb49.viewport && (_0x36929b.viewport = cloneViewportSnapshot(_0x55fb49.viewport));
    ((_0x36929b.nodes = {}), (_0x36929b._parentToChildren = {}));
    let _0x97a922 = 0;
    if (Array.isArray(_0x55fb49.nodes))
      _0x55fb49.nodes.forEach((_0x15458f) => {
        if (!_0x15458f || typeof _0x15458f !== 'object') return;
        const _0x4afffe = cloneNodeSnapshot(_0x15458f, {
          hydratedAt: _0x3bd42e,
          featureSelections: _0x294df4,
          preserveLiveGeneration: preserveLiveGeneration,
        });
        ((_0x36929b.nodes[_0x4afffe.id] = _0x4afffe),
          (_0x97a922 += 1),
          _0x4afffe.parentId && _0x152cda(_0x4afffe.id, _0x4afffe.parentId));
      });
    else {
      if (_0x55fb49.nodes && typeof _0x55fb49.nodes === 'object')
        for (const [_0x5684f2, _0x14df6a] of Object.entries(_0x55fb49.nodes)) {
          if (!_0x14df6a || typeof _0x14df6a !== 'object') continue;
          const _0x1aa6c1 = cloneNodeSnapshot(_0x14df6a.id ? _0x14df6a : { ..._0x14df6a, id: _0x5684f2 }, {
            hydratedAt: _0x3bd42e,
            featureSelections: _0x294df4,
            preserveLiveGeneration: preserveLiveGeneration,
          });
          ((_0x36929b.nodes[_0x5684f2] = _0x1aa6c1),
            (_0x97a922 += 1),
            _0x1aa6c1.parentId && _0x152cda(_0x5684f2, _0x1aa6c1.parentId));
        }
    }
    _0x36929b._nodeCount = _0x97a922;
    const _0x10af48 = {};
    if (Array.isArray(_0x55fb49.edges))
      for (const _0x189de9 of _0x55fb49.edges) {
        if (!_0x189de9 || typeof _0x189de9 !== 'object') continue;
        _0x10af48[_0x189de9.id] = cloneEdgeSnapshot(_0x189de9);
      }
    else {
      if (_0x55fb49.edges && typeof _0x55fb49.edges === 'object')
        for (const [_0x4be338, _0x1e9c83] of Object.entries(_0x55fb49.edges)) {
          if (!_0x1e9c83 || typeof _0x1e9c83 !== 'object') continue;
          const _0x2232d2 = cloneEdgeSnapshot(_0x1e9c83);
          if (_0x2232d2.id == null) _0x2232d2.id = _0x4be338;
          _0x10af48[_0x2232d2.id] = _0x2232d2;
        }
    }
    ((_0x36929b.edges = _0x10af48),
      _0x35099c(),
      (_0x36929b.assets = Array.isArray(_0x55fb49.assets)
        ? _0x55fb49.assets.map((_0x2a6fc5) => cloneAssetSnapshot(_0x2a6fc5))
        : []),
      _0x1bb4d0(),
      _0x3fbc44());
  }
  function _0x2aa762(_0x36c837, _0x4e06fd = {}) {
    _0x2e9360(_0x36c837, _0x4e06fd);
  }
  function _0xfa620c(_0xdff7d) {
    if (!_0xdff7d) return;
    const _0x1b56d9 = deepClone(_0xdff7d);
    _0x2e9360(_0x1b56d9);
  }
  function _0x29147d({
    active: _0x31a25c,
    sourceNodeId: sourceNodeId = null,
    handleDirection: handleDirection = null,
    hoverNodeId: hoverNodeId = null,
  }) {
    ((_0x36929b.pickConnectMode = {
      active: _0x31a25c,
      sourceNodeId: sourceNodeId,
      handleDirection: handleDirection,
      hoverNodeId: hoverNodeId,
    }),
      _0x3fbc44());
  }
  function _0x5c7b2b(_0x9c78fb) {
    if (_0x36929b.isServerConnected === _0x9c78fb) return;
    ((_0x36929b.isServerConnected = _0x9c78fb), _0x3fbc44());
  }
  function _0x37bbc9(_0x53f4be) {
    if (!_0x36929b.pickConnectMode || !_0x36929b.pickConnectMode.active) return;
    if (_0x36929b.pickConnectMode.hoverNodeId === _0x53f4be) return;
    ((_0x36929b.pickConnectMode = { ..._0x36929b.pickConnectMode, hoverNodeId: _0x53f4be }), _0x3fbc44());
  }
  function _0x2f561c(_0x3e5467) {
    const _0x3b91e3 = _0x36929b.annotate || {},
      _0x904aeb = _0x3e5467 || {};
    if (!_0x296e26(_0x3b91e3, _0x904aeb)) return;
    const _0x439c73 = { ..._0x3b91e3, ..._0x904aeb };
    ((_0x36929b.annotate = _0x439c73), _0x3fbc44());
  }
  function _0x49e24f(_0x3e4aba) {
    const _0x403355 = _0x36929b.matting || {},
      _0x30daed = _0x3e4aba || {};
    if (!_0x296e26(_0x403355, _0x30daed)) return;
    const _0x128c1d = { ..._0x403355, ..._0x30daed };
    ((_0x36929b.matting = _0x128c1d), _0x3fbc44());
  }
  function _0x4d3097(_0x38d6be) {
    const _0x1eb04e = _0x36929b.videoKeying || {},
      _0xc5b4fb = _0x38d6be || {};
    if (!_0x296e26(_0x1eb04e, _0xc5b4fb)) return;
    const _0x43d158 = { ..._0x1eb04e, ..._0xc5b4fb };
    ((_0x36929b.videoKeying = _0x43d158), _0x3fbc44());
  }
  function _0x3e2c2a(_0x4786d3) {
    const _0x305fd0 = _0x36929b.videoClip || {},
      _0x1accde = _0x4786d3 || {};
    if (!_0x296e26(_0x305fd0, _0x1accde)) return;
    const _0x35d89f = { ..._0x305fd0, ..._0x1accde };
    ((_0x36929b.videoClip = _0x35d89f), _0x3fbc44());
  }
  function _0xf16295(_0x5a053f) {
    if (_0x36929b.theme === _0x5a053f) return;
    ((_0x36929b.theme = _0x5a053f), _0x3fbc44());
  }
  function _0x196b09() {
    const _0x13151c = _0x36929b.theme === 'dark' ? 'light' : 'dark';
    _0xf16295(_0x13151c);
  }
  function _0x3e7991(_0xb264bb = 'dark') {
    const _0x21d448 = _0xb264bb === 'light' ? 'light' : 'dark';
    _0x36929b.theme = _0x21d448;
  }
  function _0xc2d84c(_0x3b3c76 = {}) {
    if (!_0x36929b.ui) _0x36929b.ui = {};
    _0x36929b.ui.featureSelections = sanitizeFeatureSelectionsRecord(_0x3b3c76);
  }
  function _0x46a9f1(_0x388e36, _0x2052b9, _0x5139cd = undefined) {
    const _0x3288ae = String(_0x388e36 || '').trim(),
      _0x227ee7 = String(_0x2052b9 || '').trim();
    if (!_0x3288ae || !_0x227ee7) return _0x5139cd;
    const _0x334b39 = _0x36929b.ui?.featureSelections?.[_0x3288ae]?.[_0x227ee7];
    return _0x334b39 === undefined ? _0x5139cd : _0x334b39;
  }
  function _0x41d357(_0x20f259, _0x24e354, _0x218744) {
    const _0x24159f = String(_0x20f259 || '').trim(),
      _0x24279d = String(_0x24e354 || '').trim();
    if (!_0x24159f || !_0x24279d) return;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    (!_0x36929b.ui.featureSelections || typeof _0x36929b.ui.featureSelections !== 'object') &&
      (_0x36929b.ui.featureSelections = {});
    const _0x18528e = _0x36929b.ui.featureSelections[_0x24159f] || {};
    if (_0x18528e[_0x24279d] === _0x218744) return;
    ((_0x36929b.ui.featureSelections = {
      ..._0x36929b.ui.featureSelections,
      [_0x24159f]: { ..._0x18528e, [_0x24279d]: _0x218744 },
    }),
      _0x3fbc44());
  }
  function _0x1780b7(_0x5c976a, _0x81d64f) {
    if (_0x36929b.ui && _0x36929b.ui[_0x5c976a] === _0x81d64f) return;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    ((_0x36929b.ui[_0x5c976a] = _0x81d64f), _0x3fbc44());
  }
  function _0x4f715f(_0x479624) {
    _0x1780b7('showVideoMeta', _0x479624 === true);
  }
  function _0x813c63(_0x349dc7) {
    _0x1780b7('titleFollowsCanvasZoom', _0x349dc7 === true);
  }
  function _0x4ec81c(_0xce2a74) {
    _0x1780b7('promptBoxResizeEnabled', _0xce2a74 !== false);
  }
  function _0x52322f(_0x17073c) {
    _0x1780b7('promptEnterBehavior', _0x17073c === 'newline' ? 'newline' : 'submit');
  }
  function _0x1b16f3(_0x1e57af) {
    _0x1780b7('promptAttachmentButtonHidden', _0x1e57af === true);
  }
  function _0x5ca58f(_0x22872c) {
    _0x1780b7('imageVideoNodeResizeEnabled', _0x22872c === true);
  }
  function _0x417420(_0x1af6a3, _0x16ebdd, _0x3f7ec5, _0x3e1607) {
    const _0x41497d = _0x3f7ec5(_0x16ebdd);
    if (!_0x36929b.ui) _0x36929b.ui = {};
    if (_0x3e1607(_0x36929b.ui[_0x1af6a3]) === _0x3e1607(_0x41497d)) return;
    ((_0x36929b.ui[_0x1af6a3] = _0x41497d), _0x3fbc44());
  }
  function _0x5a4686(_0x4b048a) {
    _0x417420('imageToolbarLayout', _0x4b048a, normalizeImageToolbarLayout, serializeImageToolbarLayout);
  }
  function _0x2e4fba(_0x5328af) {
    _0x417420('videoToolbarLayout', _0x5328af, normalizeVideoToolbarLayout, serializeVideoToolbarLayout);
  }
  function _0x2356e8(_0x32046d) {
    const _0x389a9f = _0x32046d !== false;
    if (_0x36929b.ui && _0x36929b.ui.alignFeatureEnabled === _0x389a9f) return;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    _0x36929b.ui.alignFeatureEnabled = _0x389a9f;
    if (!_0x389a9f)
      ((_0x36929b.ui.alignFeatureTriggerMode = 'off'),
        (_0x36929b.ui.alignPanelVisible = false),
        (_0x36929b.ui.alignPanelAnchorWorld = null));
    else _0x36929b.ui.alignFeatureTriggerMode === 'off' && (_0x36929b.ui.alignFeatureTriggerMode = 'click');
    _0x3fbc44();
  }
  function _0x413236(_0xc2ca82) {
    const _0x5e4c11 =
      _0xc2ca82 === 'hold' || _0xc2ca82 === 'click' || _0xc2ca82 === 'off' ? _0xc2ca82 : 'click';
    if (!_0x36929b.ui) _0x36929b.ui = {};
    if (_0x36929b.ui.alignFeatureTriggerMode === _0x5e4c11) return;
    ((_0x36929b.ui.alignFeatureTriggerMode = _0x5e4c11),
      (_0x36929b.ui.alignFeatureEnabled = _0x5e4c11 !== 'off'),
      _0x5e4c11 === 'off' &&
        ((_0x36929b.ui.alignPanelVisible = false), (_0x36929b.ui.alignPanelAnchorWorld = null)),
      _0x3fbc44());
  }
  function _0x266c3a(_0x2e018a) {
    const _0x17abb3 = Number(_0x2e018a),
      _0x51163d = Number.isFinite(_0x17abb3) ? Math.max(0, Math.min(200, Math.round(_0x17abb3))) : 40;
    if (_0x36929b.ui && _0x36929b.ui.alignDistributeGap === _0x51163d) return;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    ((_0x36929b.ui.alignDistributeGap = _0x51163d), _0x3fbc44());
  }
  function _0x11529a(_0x12d5bb) {
    const _0x2ff80b = _0x12d5bb === true;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    if (!_0x2ff80b) {
      const _0x1108af = !!_0x36929b.ui.alignPanelAnchorWorld;
      if (_0x36929b.ui.alignPanelVisible === _0x2ff80b && !_0x1108af) return;
      ((_0x36929b.ui.alignPanelVisible = false), (_0x36929b.ui.alignPanelAnchorWorld = null), _0x3fbc44());
      return;
    }
    if (_0x36929b.ui.alignPanelVisible === _0x2ff80b) return;
    ((_0x36929b.ui.alignPanelVisible = _0x2ff80b), _0x3fbc44());
  }
  function _0x1d4fd4(_0x9d3112) {
    if (!_0x36929b.ui) _0x36929b.ui = {};
    let _0x3c4b00 = null;
    _0x9d3112 &&
      Number.isFinite(_0x9d3112.x) &&
      Number.isFinite(_0x9d3112.y) &&
      (_0x3c4b00 = { x: Number(_0x9d3112.x), y: Number(_0x9d3112.y) });
    const _0x5797d8 = _0x36929b.ui.alignPanelAnchorWorld,
      _0x545baf =
        (!_0x5797d8 && !_0x3c4b00) ||
        (_0x5797d8 &&
          _0x3c4b00 &&
          Number(_0x5797d8.x) === Number(_0x3c4b00.x) &&
          Number(_0x5797d8.y) === Number(_0x3c4b00.y));
    if (_0x545baf) return;
    ((_0x36929b.ui.alignPanelAnchorWorld = _0x3c4b00), _0x3fbc44());
  }
  function _0x1d39df(_0x597c1a) {
    const _0x161326 = _0x597c1a !== false;
    if (_0x36929b.ui && _0x36929b.ui.snapGuidesEnabled === _0x161326) return;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    ((_0x36929b.ui.snapGuidesEnabled = _0x161326), _0x3fbc44());
  }
  function _0x5039cd(_0x5216db) {
    const _0x22f430 = _0x5216db !== false;
    if (_0x36929b.ui && _0x36929b.ui.selectionRelatedHighlightEnabled === _0x22f430) return;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    ((_0x36929b.ui.selectionRelatedHighlightEnabled = _0x22f430), _0x3fbc44());
  }
  function _0x38a168(_0x91fc89) {
    const _0x1402d2 = String(_0x91fc89 || '').trim();
    return ['white', 'blue', 'green', 'cyan', 'purple', 'red', 'yellow'].includes(_0x1402d2)
      ? _0x1402d2
      : 'white';
  }
  function _0x6e2d82(_0x3e715a) {
    const _0x12db53 = _0x38a168(_0x3e715a);
    if (_0x36929b.ui && _0x36929b.ui.selectionRelatedHighlightColor === _0x12db53) return;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    ((_0x36929b.ui.selectionRelatedHighlightColor = _0x12db53), _0x3fbc44());
  }
  function _0x1f5c63(_0x3bb48e) {
    const _0x5ef1a2 = _0x3bb48e !== false;
    if (_0x36929b.ui && _0x36929b.ui.connectionLinesVisible === _0x5ef1a2) return;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    ((_0x36929b.ui.connectionLinesVisible = _0x5ef1a2), _0x3fbc44());
  }
  function _0x5bf9f6(_0x256811 = {}) {
    const _0x5886bf = _0x256811?.showVideoMeta === true,
      _0x3eb4d8 = _0x256811?.titleFollowsCanvasZoom === true,
      _0x23b7e6 = _0x256811?.promptBoxResizeEnabled !== false,
      _0x528070 = _0x256811?.promptAttachmentButtonHidden === true,
      _0x26e960 = _0x256811?.imageVideoNodeResizeEnabled === true,
      _0x4fedb9 = _0x256811?.selectionRelatedHighlightEnabled !== false,
      _0x43f30f = _0x38a168(_0x256811?.selectionRelatedHighlightColor),
      _0x3f3af0 = _0x256811?.connectionLinesVisible !== false,
      _0x5f249b = String(_0x256811?.alignFeatureTriggerMode || '').trim(),
      _0x3def33 =
        _0x5f249b === 'hold' || _0x5f249b === 'click' || _0x5f249b === 'off'
          ? _0x5f249b
          : _0x256811?.alignFeatureEnabled === false
            ? 'off'
            : 'click',
      _0x141b45 = _0x256811?.alignFeatureEnabled === false ? false : _0x3def33 !== 'off',
      _0x407102 = Number(_0x256811?.alignDistributeGap),
      _0x2eb42f = Number.isFinite(_0x407102) ? Math.max(0, Math.min(200, Math.round(_0x407102))) : 40,
      _0x89d71d = _0x256811?.snapGuidesEnabled !== false;
    if (!_0x36929b.ui) _0x36929b.ui = {};
    ((_0x36929b.ui.showVideoMeta = _0x5886bf),
      (_0x36929b.ui.titleFollowsCanvasZoom = _0x3eb4d8),
      (_0x36929b.ui.promptBoxResizeEnabled = _0x23b7e6),
      (_0x36929b.ui.promptEnterBehavior =
        _0x256811?.promptEnterBehavior === 'newline' ? 'newline' : 'submit'),
      (_0x36929b.ui.promptAttachmentButtonHidden = _0x528070),
      (_0x36929b.ui.imageVideoNodeResizeEnabled = _0x26e960),
      (_0x36929b.ui.imageToolbarLayout = normalizeImageToolbarLayout(_0x256811?.imageToolbarLayout)),
      (_0x36929b.ui.videoToolbarLayout = normalizeVideoToolbarLayout(_0x256811?.videoToolbarLayout)),
      (_0x36929b.ui.selectionRelatedHighlightEnabled = _0x4fedb9),
      (_0x36929b.ui.selectionRelatedHighlightColor = _0x43f30f),
      (_0x36929b.ui.connectionLinesVisible = _0x3f3af0),
      (_0x36929b.ui.alignFeatureEnabled = _0x141b45),
      (_0x36929b.ui.alignFeatureTriggerMode = _0x3def33),
      (_0x36929b.ui.alignDistributeGap = _0x2eb42f),
      (_0x36929b.ui.alignPanelVisible = false),
      (_0x36929b.ui.alignPanelAnchorWorld = null),
      (_0x36929b.ui.snapGuidesEnabled = _0x89d71d),
      _0xc2d84c(_0x256811?.featureSelections || {}),
      _0x3fbc44());
  }
  function _0x2bc64d(_0x4ad1f7) {
    const _0x14be86 = _0x36929b.subscription || {};
    ((_0x36929b.subscription = { ..._0x14be86, ...(_0x4ad1f7 || {}) }), _0x3fbc44());
  }
  function _0x4bcc62(_0x357f3f) {
    if (!_0x357f3f || !_0x357f3f.id) throw new Error('[store] addAsset() 需要提供含有 id 字段的资产数据');
    const _0x25e041 = JSON.parse(JSON.stringify(_0x357f3f));
    if (!_0x36929b.assets) _0x36929b.assets = [];
    (_0x36929b.assets.unshift(_0x25e041), _0x1bb4d0(), _0x3fbc44());
  }
  function _0x4d7d29(_0xc6949d) {
    if (!_0x36929b.assets) return;
    const _0x372d60 = _0x36929b.assets.length;
    ((_0x36929b.assets = _0x36929b.assets.filter((_0x46ba75) => _0x46ba75.id !== _0xc6949d)),
      _0x36929b.assets.length !== _0x372d60 && (_0x1bb4d0(), _0x3fbc44()));
  }
  function _0x19b1f6(_0x392bed, _0x399530) {
    if (!_0x36929b.assets) return;
    const _0x5ae450 = _0x36929b.assets.findIndex((_0xbb2e0c) => _0xbb2e0c.id === _0x392bed);
    if (_0x5ae450 !== -1) {
      const _0x739b9 = _0x36929b.assets[_0x5ae450],
        _0x479410 = { ..._0x739b9, ..._0x399530 };
      if (shallowEqual(_0x739b9, _0x479410)) return;
      ((_0x36929b.assets[_0x5ae450] = _0x479410), _0x1bb4d0(), _0x3fbc44());
    }
  }
  function _0x49d0a5() {
    ((!_0x36929b.workflows || typeof _0x36929b.workflows !== 'object') &&
      (_0x36929b.workflows = { items: [], loading: false, error: null, loadedAt: 0 }),
      !Array.isArray(_0x36929b.workflows.items) && (_0x36929b.workflows.items = []),
      (!_0x36929b.workflowUi || typeof _0x36929b.workflowUi !== 'object') &&
        (_0x36929b.workflowUi = createInitialWorkflowUiState()));
  }
  function _0x111094(_0x16d7cb, _0x4ed8a7 = null) {
    (_0x49d0a5(),
      (_0x36929b.workflows = {
        ..._0x36929b.workflows,
        loading: _0x16d7cb === true,
        error: _0x4ed8a7 == null ? null : String(_0x4ed8a7),
      }),
      _0x3fbc44());
  }
  function _0x741bec(_0x17cc0b) {
    (_0x49d0a5(),
      (_0x36929b.workflows = {
        ..._0x36929b.workflows,
        items: Array.isArray(_0x17cc0b) ? _0x17cc0b.map((_0x4be3e3) => cloneWorkflowSnapshot(_0x4be3e3)) : [],
        loading: false,
        error: null,
        loadedAt: Date.now(),
      }),
      _0x3fbc44());
  }
  function _0x49c444(_0x4ba033) {
    if (!_0x4ba033 || !_0x4ba033.id) return;
    _0x49d0a5();
    const _0xd8aaa4 = cloneWorkflowSnapshot(_0x4ba033),
      _0x561240 = _0x36929b.workflows.items.findIndex((_0x497deb) => _0x497deb?.id === _0xd8aaa4.id);
    (_0x561240 >= 0
      ? (_0x36929b.workflows.items[_0x561240] = { ..._0x36929b.workflows.items[_0x561240], ..._0xd8aaa4 })
      : _0x36929b.workflows.items.unshift(_0xd8aaa4),
      _0x3fbc44());
  }
  function _0xeb52d2(_0x2b0b2f, _0x1927b8) {
    const _0x455b39 = String(_0x2b0b2f || '').trim();
    if (!_0x455b39 || !_0x1927b8 || typeof _0x1927b8 !== 'object') return;
    _0x49d0a5();
    const _0x4b4eb0 = _0x36929b.workflows.items.findIndex((_0x4aa626) => _0x4aa626?.id === _0x455b39);
    if (_0x4b4eb0 < 0) return;
    ((_0x36929b.workflows.items[_0x4b4eb0] = {
      ..._0x36929b.workflows.items[_0x4b4eb0],
      ...cloneWorkflowSnapshot(_0x1927b8),
    }),
      _0x3fbc44());
  }
  function _0x1dc29a(_0x1037cc, _0x6c12be = Date.now()) {
    _0xeb52d2(_0x1037cc, { lastUsedAt: _0x6c12be });
  }
  function _0x337626(_0x44e482) {
    if (!_0x44e482 || typeof _0x44e482 !== 'object') return;
    _0x49d0a5();
    const _0x404d22 = { ..._0x36929b.workflowUi };
    for (const [_0x3f9417, _0xf19553] of Object.entries(_0x44e482)) {
      _0x3f9417 === 'draft' && _0xf19553 && typeof _0xf19553 === 'object'
        ? (_0x404d22.draft = { ..._0x404d22.draft, ...cloneWorkflowSnapshot(_0xf19553) })
        : (_0x404d22[_0x3f9417] = cloneWorkflowSnapshot(_0xf19553));
    }
    ((_0x36929b.workflowUi = _0x404d22), _0x3fbc44());
  }
  function _0x2f04bd(_0x46f78f) {
    if (!_0x46f78f || typeof _0x46f78f !== 'object') return;
    (_0x49d0a5(),
      (_0x36929b.workflowUi = {
        ..._0x36929b.workflowUi,
        draft: {
          ...(_0x36929b.workflowUi.draft || createInitialWorkflowDraftState()),
          ...cloneWorkflowSnapshot(_0x46f78f),
        },
      }),
      _0x3fbc44());
  }
  function _0x4094cd(_0x1cd218 = {}) {
    (_0x49d0a5(),
      (_0x36929b.workflowUi = {
        ..._0x36929b.workflowUi,
        draft: { ...createInitialWorkflowDraftState(), ...cloneWorkflowSnapshot(_0x1cd218) },
        tagDraft: '',
        updateConfirmOpen: false,
        error: null,
      }),
      _0x3fbc44());
  }
  function _0x37c233({ tab: tab = 'create', sourceGroupId: sourceGroupId = null } = {}) {
    (_0x49d0a5(),
      (_0x36929b.workflowUi = {
        ..._0x36929b.workflowUi,
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
      _0x3fbc44());
  }
  function _0x5def08() {
    (_0x49d0a5(),
      (_0x36929b.workflowUi = {
        ..._0x36929b.workflowUi,
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
      _0x3fbc44());
  }
  function _0x5a6a85(_0x3c715e) {
    _0x337626({ saving: _0x3c715e === true });
  }
  function _0x5de945(_0x368571) {
    const _0x4d124e = _0x368571 == null ? null : String(_0x368571);
    _0x337626({ applyingWorkflowId: _0x4d124e || null });
  }
  return {
    subscribe: _0x4b9dbb,
    subscribeRaw: _0x2817d4,
    subscribeSelector: _0x45783d,
    batch: _0x55ed64,
    requestRender: _0x626269,
    invalidateUi: _0x1769b9,
    addNode: _0x2d2833,
    updateNodePosition: _0x344d66,
    moveNodes: _0x1a3394,
    moveNodesByOffsets: _0x5acfa6,
    deleteNodes: _0x3a30d6,
    updateNodeData: _0x48b811,
    updateNodesData: _0x5ce97d,
    swapStoryboardCells: _0x86c72b,
    addEdge: _0xcb3d10,
    removeEdge: _0x51cbba,
    updateEdgesBatch: _0x2107c7,
    updateViewport: _0x4bd4ec,
    setViewportPersistPolicy: _0x28a140,
    markViewportPersist: _0x5bc2c1,
    showPicker: _0x265616,
    hidePicker: _0x4946d1,
    loadState: _0x4b0af2,
    loadHistorySnapshot: _0x555bbe,
    getState: _0x4e40ac,
    getStateRaw: _0x499b4e,
    getHistorySnapshot: _0x561e04,
    getSourcesForNode: _0x54527a,
    setSelectionBox: _0x5a1e85,
    setSelectionMeta: _0x2d557b,
    setSelectedNodes: _0x2fb512,
    groupNodes: _0x5190ca,
    getIncomingEdges: _0x34557a,
    renameNode: _0x483c6d,
    clearSelection: _0x512409,
    showContextMenu: _0x2b5b97,
    hideContextMenu: _0x51575e,
    setConnOverlay: _0x27474e,
    clearConnOverlay: _0x58a54f,
    setPickConnectMode: _0x29147d,
    setPickConnectHover: _0x37bbc9,
    setServerConnection: _0x5c7b2b,
    setAnnotateState: _0x2f561c,
    setMattingState: _0x49e24f,
    setVideoKeyingState: _0x4d3097,
    setVideoClipState: _0x3e2c2a,
    setTheme: _0xf16295,
    toggleTheme: _0x196b09,
    initTheme: _0x3e7991,
    setFeatureSelection: _0x41d357,
    getFeatureSelection: _0x46a9f1,
    initFeatureSelections: _0xc2d84c,
    setShowVideoMeta: _0x4f715f,
    setTitleFollowsCanvasZoom: _0x813c63,
    setPromptBoxResizeEnabled: _0x4ec81c,
    setPromptEnterBehavior: _0x52322f,
    setPromptAttachmentButtonHidden: _0x1b16f3,
    setImageVideoNodeResizeEnabled: _0x5ca58f,
    setImageToolbarLayout: _0x5a4686,
    setVideoToolbarLayout: _0x2e4fba,
    setAlignFeatureEnabled: _0x2356e8,
    setAlignFeatureTriggerMode: _0x413236,
    setAlignDistributeGap: _0x266c3a,
    setAlignPanelVisible: _0x11529a,
    setAlignPanelAnchorWorld: _0x1d4fd4,
    setSnapGuidesEnabled: _0x1d39df,
    setSelectionRelatedHighlightEnabled: _0x5039cd,
    setSelectionRelatedHighlightColor: _0x6e2d82,
    setConnectionLinesVisible: _0x1f5c63,
    setSubscriptionState: _0x2bc64d,
    initUiPrefs: _0x5bf9f6,
    addAsset: _0x4bcc62,
    deleteAsset: _0x4d7d29,
    updateAsset: _0x19b1f6,
    setWorkflowsLoading: _0x111094,
    setWorkflows: _0x741bec,
    upsertWorkflow: _0x49c444,
    updateWorkflowLocal: _0xeb52d2,
    markWorkflowUsed: _0x1dc29a,
    setWorkflowUi: _0x337626,
    setWorkflowDraft: _0x2f04bd,
    resetWorkflowDraft: _0x4094cd,
    openWorkflowModal: _0x37c233,
    closeWorkflowModal: _0x5def08,
    setWorkflowSaving: _0x5a6a85,
    setWorkflowApplying: _0x5de945,
    serialize: _0x1d9961,
    hydrate: _0xfa620c,
    hydrateTrustedSnapshot: _0x2aa762,
  };
}
const legacyKernelStore = createStore();
export default legacyKernelStore;
export { createStore, createStore as createLegacyKernelStore };
