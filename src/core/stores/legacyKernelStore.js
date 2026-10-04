import { generateId } from '../math.js';
import { createNodeFieldSubscriptions } from './nodeFieldSubscriptions.js';
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
import {
  sanitizeSerializedCanvasData,
  sanitizeNodeForPersistence,
} from '../../utils/thumbnailPersistence.js';
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
import { createViewportScreenFrame } from './viewportScreenFrame.js';
import { createGenerationHistoryState } from './generationHistoryState.js';
import { planNodeMovement } from './graphMutationImpact.js';
import { sanitizeCanvasNodeMediaPatchForStore } from '../../services/canvasMediaLocalService.js';
import { createRendererStateRevisionTracker } from './rendererStateRevisions.js';
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
import { emitNodeDeletions } from '../nodeDeletionEvents.js';
import { normalizeConnectionLineStyle } from '../edgePathGeometry.js';
import { normalizeCanvasToolbarPlacement } from '../../modules/canvasToolbarPlacement.js';
import { normalizeNodeManagerPlacement } from '../../modules/nodeManager/nodeManagerPlacement.js';
function deepClone(value) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(value);
    } catch {}
  return JSON['parse'](JSON['stringify'](value));
}
function stripPersistedRichText(item) {
  if (typeof item !== 'string') return item;
  return item['replace'](/<[^>]*>/g, '');
}
function sanitizePersistedPromptHtml(key) {
  if (typeof key !== 'string') return key;
  return sanitizePromptHtml(key);
}
function cloneShallowObjectArray(list) {
  if (!Array['isArray'](list)) return list;
  return list['map']((args) =>
    args && typeof args === 'object' ? { ...args } : args,
  );
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
    return JSON['parse'](JSON['stringify'](args4));
  } catch {}
  return { ...args4 };
}
function cloneWorkflowSnapshot(enabled) {
  if (!enabled || typeof enabled !== 'object') return enabled;
  return deepClone(enabled);
}
function isBlobLikeUrl(index) {
  return typeof index === 'string' && /^blob:/i['test'](index['trim']());
}
function sanitizePanoramaStateForPersistence(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return enabled2;
  const deepClone2 = deepClone(enabled2);
  return (
    deepClone2['ui'] && typeof deepClone2['ui'] === 'object' && delete deepClone2['ui']['isEditing'],
    deepClone2['panorama'] &&
      typeof deepClone2['panorama'] === 'object' &&
      (delete deepClone2['panorama']['isLoaded'],
      delete deepClone2['panorama']['error'],
      isBlobLikeUrl(deepClone2['panorama']['imageUrl']) && delete deepClone2['panorama']['imageUrl'],
      isBlobLikeUrl(deepClone2['panorama']['localPath']) && delete deepClone2['panorama']['localPath']),
    deepClone2['capture'] &&
      typeof deepClone2['capture'] === 'object' &&
      (delete deepClone2['capture']['pending'],
      delete deepClone2['capture']['error'],
      delete deepClone2['capture']['lastCaptureAt']),
    deepClone2
  );
}
function sanitizePanoramaStateForHistory(result) {
  const sanitizePanoramaStateForPersistence2 = sanitizePanoramaStateForPersistence(result);
  if (!sanitizePanoramaStateForPersistence2 || typeof sanitizePanoramaStateForPersistence2 !== 'object') return sanitizePanoramaStateForPersistence2;
  return (delete sanitizePanoramaStateForPersistence2['viewport'], sanitizePanoramaStateForPersistence2);
}
function cloneNodeSnapshot(
  args5,
  {
    stripRichText: stripRichText = ![],
    hydratedAt: hydratedAt = null,
    featureSelections: featureSelections = null,
    stripPanoramaViewport: stripPanoramaViewport = ![],
    preserveLiveGeneration: preserveLiveGeneration = ![],
  } = {},
) {
  if (!args5 || typeof args5 !== 'object') return args5;
  const data = { ...args5 };
  normalizeNodeModel(data);
  stripRichText &&
    (data['content'] !== undefined &&
      (data['content'] = stripPersistedRichText(data['content'])),
    data['prompt'] !== undefined &&
      (data['prompt'] = sanitizePersistedPromptHtml(data['prompt'])));
  Array['isArray'](args5['cells']) && (data['cells'] = cloneShallowObjectArray(args5['cells']));
  Array['isArray'](args5['images']) &&
    (data['images'] = cloneShallowObjectArray(args5['images']));
  Array['isArray'](args5['videos']) &&
    (data['videos'] = cloneShallowObjectArray(args5['videos']));
  args5['sceneNode'] &&
    typeof args5['sceneNode'] === 'object' &&
    (data['sceneNode'] = stripPanoramaViewport
      ? sanitizePanoramaStateForHistory(args5['sceneNode'])
      : sanitizePanoramaStateForPersistence(args5['sceneNode']));
  args5['panorama360Node'] &&
    typeof args5['panorama360Node'] === 'object' &&
    (data['panorama360Node'] = stripPanoramaViewport
      ? sanitizePanoramaStateForHistory(args5['panorama360Node'])
      : sanitizePanoramaStateForPersistence(args5['panorama360Node']));
  args5['storyboard3d'] &&
    typeof args5['storyboard3d'] === 'object' &&
    (data['storyboard3d'] = deepClone(args5['storyboard3d']));
  typeof hydratedAt === 'number' &&
    Number['isFinite'](hydratedAt) &&
    typeof data['generationStartTime'] === 'number' &&
    Number['isFinite'](data['generationStartTime']) &&
    data['generationDuration'] == null &&
    !shouldPreserveRunningGenerationOnHydrate(data, {
      preserveLiveGeneration: preserveLiveGeneration,
    }) &&
    finalizeHydratedGenerationSnapshot(
      data,
      Math['max'](0x1, hydratedAt - data['generationStartTime']),
    );
  if (typeof data['_bizRev'] !== 'number') data['_bizRev'] = 0x1;
  return featureSelections ? applyFeatureSelectionsToNodeData(data, featureSelections) : data;
}
function shallowEqual(options, target) {
  if (options === target) return !![];
  if (typeof options !== typeof target) return ![];
  if (typeof options !== 'object' || options === null || target === null) return ![];
  const list2 = Object['keys'](options),
    list3 = Object['keys'](target);
  if (list2['length'] !== list3['length']) return ![];
  for (const source of list2) {
    if (
      !Object['prototype']['hasOwnProperty']['call'](target, source) ||
      options[source] !== target[source]
    )
      return ![];
  }
  return !![];
}
function isPlainObject(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object' || Array['isArray'](enabled3)) return ![];
  const next = Object['getPrototypeOf'](enabled3);
  return next === Object['prototype'] || next === null;
}
function snapshotSelectorValue(list4) {
  if (list4 == null || typeof list4 !== 'object') return list4;
  if (Array['isArray'](list4)) return list4['slice']();
  if (isPlainObject(list4)) return { ...list4 };
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(list4);
    } catch {}
  return list4;
}
function _isSameStoreValue(current, entry) {
  return Object['is'](current, entry);
}
function _isPatchNoop(enabled4, enabled5) {
  if (!enabled4 || !enabled5 || typeof enabled5 !== 'object') return ![];
  const list5 = Object['keys'](enabled5);
  if (list5['length'] === 0x0) return !![];
  return list5['every']((record) => _isSameStoreValue(enabled4[record], enabled5[record]));
}
function _trimText(payload) {
  return typeof payload === 'string' ? payload['trim']() : '';
}
function _getStoryboardCellPosition(handle, col) {
  const state = Math['max'](0x1, Math['round'](Number(handle?.['cols']) || 0x1));
  return { col: col % state, row: Math['floor'](col / state) };
}
function _placeStoryboardCellForSwap(config, scope, input, output, value2, value3) {
  Object['assign'](config, _getStoryboardCellPosition(value2, value3));
  if (isStoryboardCellEmpty(scope)) return normalizeEmptyStoryboardCell(config);
  return (
    (config['storyboardSourceIndex'] = resolveStoryboardCellSourceIndex(scope, output, input)),
    config
  );
}
function _isValidStoryboardCellTarget(value4, count) {
  return (
    value4 &&
    value4['type'] === 'storyboard' &&
    Array['isArray'](value4['cells']) &&
    Number['isInteger'](count) &&
    count >= 0x0 &&
    count < value4['cells']['length']
  );
}
const LEGACY_VIDEO_EDIT_V52_MODEL_ID = 'runninghub/2037339851183366146';
function normalizeNodeModel(enabled6) {
  if (!enabled6 || typeof enabled6 !== 'object') return;
  String(enabled6['model'] || '') === LEGACY_VIDEO_EDIT_V52_MODEL_ID &&
    (enabled6['model'] = RH_VIDEO_V54_MODEL_ID);
}
function normalizeNodesCollection(list6) {
  if (!list6) return;
  if (Array['isArray'](list6)) {
    list6['forEach'](normalizeNodeModel);
    return;
  }
  typeof list6 === 'object' && Object['values'](list6)['forEach'](normalizeNodeModel);
}
function isDreaminaTaskNodeSnapshot(enabled7) {
  if (!enabled7 || typeof enabled7 !== 'object') return ![];
  const value5 = String(enabled7['type'] || '')
    ['trim']()
    ['toLowerCase']();
  if (!['ai-video', 'ai-image', 'source-image', 'source-video']['includes'](value5)) return ![];
  const value6 = String(enabled7['provider'] || '')
      ['trim']()
      ['toLowerCase'](),
    value7 = String(enabled7['model'] || '')['trim']();
  return value6 === 'dreamina' || resolveModelProvider(value7, value6) === 'dreamina';
}
function inferAsyncProviderByModel(value8, value9 = '') {
  const modelProvider = resolveModelProvider(value8, '', { allowProviderHint: ![] });
  if (modelProvider) return modelProvider;
  const value10 = String(value9 || '')
    ['trim']()
    ['toLowerCase']();
  if (value10) return value10;
  const list7 = String(value8 || '')['trim']();
  if (list7 && !list7['includes']('/')) return 'grsai';
  return 'grsai';
}
function isAsyncTaskNodeSnapshot(enabled8) {
  if (!enabled8 || typeof enabled8 !== 'object') return ![];
  const value11 = String(enabled8['type'] || '')
    ['trim']()
    ['toLowerCase']();
  if (!['ai-video', 'ai-image', 'source-video', 'source-image']['includes'](value11)) return ![];
  const inferAsyncProviderByModel2 = inferAsyncProviderByModel(
    enabled8['model'],
    enabled8['asyncTaskProvider'] || enabled8['provider'] || '',
  );
  if (!inferAsyncProviderByModel2 || inferAsyncProviderByModel2 === 'runninghubwf' || inferAsyncProviderByModel2 === 'runninghub' || inferAsyncProviderByModel2 === 'dreamina')
    return ![];
  return !![];
}
function isRunningHubTaskNodeSnapshot(enabled9) {
  if (!enabled9 || typeof enabled9 !== 'object') return ![];
  const value12 = String(enabled9['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    value13 = String(enabled9['provider'] || '')
      ['trim']()
      ['toLowerCase'](),
    value14 = String(enabled9['model'] || '')['trim'](),
    modelProvider2 = resolveModelProvider(value14, value13, { allowProviderHint: ![] }),
    isWorkflowModel2 = isWorkflowModel(value14, value13 || 'runninghubwf'),
    value15 = modelProvider2 === 'runninghub' && isModelApiModel(value14, 'runninghub');
  if (value12 === 'ai-audio') return value13 === 'runninghubwf';
  if (value12 === 'source-video') return value13 === 'runninghubwf' || isWorkflowModel2;
  if (value12 === 'source-image')
    return value13 === 'runninghubwf' || value13 === 'runninghub' || isWorkflowModel2 || value15;
  if (value12 === 'source-audio') return value13 === 'runninghubwf' && isWorkflowModel2;
  if (value12 === 'ai-video') return value13 === 'runninghubwf' && isWorkflowModel2;
  if (value12 === 'ai-image')
    return isWorkflowModel2 || value15 || value13 === 'runninghub' || value13 === 'runninghubwf';
  return ![];
}
function hasResolvedVideoResultSnapshot(enabled10) {
  if (!enabled10 || typeof enabled10 !== 'object') return ![];
  const list8 = Array['isArray'](enabled10['videos']) ? enabled10['videos'] : [];
  if (list8['length'] > 0x0) return !![];
  return !!String(enabled10['videoUrl'] || '')['trim']() || !!String(enabled10['localPath'] || '')['trim']();
}
const HYDRATE_ACTIVE_STATUS_FIELDS = Object['freeze']([
    'jobStatus',
    'rhTaskStatus',
    'dreaminaTaskStatus',
    'dreaminaTaskPhase',
    'asyncTaskStatus',
    'mediaTaskStatus',
  ]),
  HYDRATE_RECOVERING_FIELDS = Object['freeze']([
    'rhTaskRecovering',
    'dreaminaTaskRecovering',
    'asyncTaskRecovering',
  ]);
function finalizeHydratedGenerationSnapshot(value16, value17) {
  value16['generationDuration'] = value17;
  if (value16['isGenerating'] === !![]) value16['isGenerating'] = ![];
  for (const value18 of HYDRATE_ACTIVE_STATUS_FIELDS) {
    const value19 = String(value16[value18] || '')['trim']();
    if (value19 && !isGenerationTaskTerminalStatus(value19)) value16[value18] = 'cancelled';
  }
  for (const value20 of HYDRATE_RECOVERING_FIELDS)
    if (value16[value20] === !![]) value16[value20] = ![];
}
function shouldPreserveRunningGenerationOnHydrate(
  value21,
  { preserveLiveGeneration: preserveLiveGeneration = ![] } = {},
) {
  if (preserveLiveGeneration && value21?.['isGenerating'] === !![]) {
    const enabled11 = [
      value21['dreaminaTaskPhase'],
      value21['dreaminaTaskStatus'],
      value21['asyncTaskStatus'],
      value21['rhTaskStatus'],
      value21['mediaTaskStatus'],
      value21['jobStatus'],
    ]['some']((value22) => {
      const enabled12 = String(value22 || '')
        ['trim']()
        ['toLowerCase']();
      return !!enabled12 && enabled12 !== 'idle' && isGenerationTaskTerminalStatus(enabled12);
    });
    if (!enabled11) return !![];
  }
  if (isDreaminaTaskNodeSnapshot(value21)) {
    const enabled13 = String(value21['dreaminaSubmitId'] || '')['trim']();
    if (!enabled13) return ![];
    const value23 = String(value21['dreaminaTaskPhase'] || '')
        ['trim']()
        ['toLowerCase'](),
      value24 = String(value21['dreaminaTaskStatus'] || '')
        ['trim']()
        ['toLowerCase']();
    if (isGenerationTaskTerminalStatus(value23)) return ![];
    if (isGenerationTaskTerminalStatus(value24)) return ![];
    return !![];
  }
  if (isAsyncTaskNodeSnapshot(value21)) {
    const enabled14 = String(value21['asyncTaskId'] || '')['trim']();
    if (!enabled14) return ![];
    const value25 = String(value21['asyncTaskKind'] || '')
        ['trim']()
        ['toLowerCase'](),
      value26 = String(value21['type'] || '')
        ['trim']()
        ['toLowerCase']();
    if (value25 === 'image' && !['ai-image', 'source-image']['includes'](value26)) return ![];
    if (value25 === 'video' && !['ai-video', 'source-video']['includes'](value26)) return ![];
    const value27 = String(value21['asyncTaskStatus'] || '')
      ['trim']()
      ['toLowerCase']();
    if (isGenerationTaskTerminalStatus(value27)) return ![];
    return !![];
  }
  if (!isRunningHubTaskNodeSnapshot(value21)) return ![];
  const enabled15 = String(value21['rhTaskId'] || '')['trim']();
  if (!enabled15) return ![];
  const value28 = String(value21['rhTaskStatus'] || '')
    ['trim']()
    ['toLowerCase']();
  if (isGenerationTaskTerminalStatus(value28)) return ![];
  return !![];
}
function createStore() {
  const map = createGenerationHistoryState();
  let args6 = createInitialState();
  const el = createRendererStateRevisionTracker(args6),
    subscribeNodeField = createNodeFieldSubscriptions(() => args6['nodes']),
    viewport = createViewportScreenFrame(),
    list9 = [],
    list10 = [],
    list11 = [];
  let count2 = 0x0,
    enabled16 = ![],
    handler = () => !![];
  function run(value29 = !![]) {
    args6['_persistRev'] = (args6['_persistRev'] || 0x0) + 0x1;
    if (value29) args6['_contentPersistRev'] = (args6['_contentPersistRev'] || 0x0) + 0x1;
  }
  function run2() {
    args6['_edgesRev'] = (args6['_edgesRev'] || 0x0) + 0x1;
  }
  function setViewportPersistPolicy(value30) {
    handler = typeof value30 === 'function' ? value30 : () => !![];
  }
  function setViewportScreenOrigin(value31, value32) {
    if (!viewport['set'](value31, value32)) return;
    ((args6['viewport'] = viewport['attach'](args6['viewport'])), run3());
  }
  function run4(value33, args7) {
    if (!args7 || typeof args7 !== 'object') return args7;
    const value34 = { ...args7 },
      status = (value35) => Object['prototype']['hasOwnProperty']['call'](value34, value35),
      handler2 = () => {
        const value36 = [value34['images'], value34['videos']]['filter'](Array['isArray']);
        for (const value37 of value36) {
          let enabled17 = '',
            enabled18 = ![];
          for (const error of value37) {
            if (!error || typeof error !== 'object') continue;
            const value38 = String(error['error'] || error['message'] || '')['trim']();
            if (value38 && !enabled17) enabled17 = value38;
            String(
              error['localPath'] ||
                error['originalLocalPath'] ||
                error['displayLocalPath'] ||
                error['thumbLocalPath'] ||
                error['imageUrl'] ||
                error['videoUrl'] ||
                error['thumbUrl'] ||
                error['sourceUrl'] ||
                '',
            )['trim']() && (enabled18 = !![]);
          }
          if (enabled17 && !enabled18) return enabled17;
        }
        return String(value34['jobError'] || '')['trim']();
      },
      enabled19 = status('isGenerating'),
      enabled20 = handler2(),
      handler3 = (value39) =>
        String(value39 || '')
          ['trim']()
          ['toLowerCase'](),
      active = (value40) =>
        ['error', 'failed', 'fail', 'cancelled', 'canceled']['includes'](handler3(value40)),
      handler4 = (value41) => {
        if (status(value41)) return String(value34[value41] || '')['trim']();
        return String(value33?.[value41] || '')['trim']();
      },
      handler5 = () => !!handler4('dreaminaSubmitId'),
      active2 = (value42) => {
        if (active(value42)) return !![];
        if (handler5()) return !![];
        if (handler3(value42) === 'idle') return ![];
        return handler3(value34['dreaminaTaskStatus']) !== 'idle';
      },
      list12 = [
        {
          status: status('asyncTaskStatus') ? value34['asyncTaskStatus'] : null,
          active:
            active(value34['asyncTaskStatus']) ||
            !!handler4('asyncTaskId') ||
            handler3(value34['asyncTaskStatus']) !== 'idle',
        },
        {
          status: status('rhTaskStatus') ? value34['rhTaskStatus'] : null,
          active:
            active(value34['rhTaskStatus']) ||
            !!handler4('rhTaskId') ||
            handler3(value34['rhTaskStatus']) !== 'idle',
        },
        {
          status: status('dreaminaTaskStatus') ? value34['dreaminaTaskStatus'] : null,
          active: active2(value34['dreaminaTaskStatus']),
        },
        {
          status: status('dreaminaTaskPhase') ? value34['dreaminaTaskPhase'] : null,
          active: active2(value34['dreaminaTaskPhase']),
        },
        { status: status('mediaTaskStatus') ? value34['mediaTaskStatus'] : null, active: !![] },
      ]['filter']((response) => response['active'] === !![] && String(response['status'] || '')['trim']()),
      enabled21 = list12['find']((response2) => isGenerationTaskTerminalStatus(response2['status']))?.[
        'status'
      ],
      value43 = status('mediaTaskStatus')
        ? String(value34['mediaTaskStatus'] || '')
            ['trim']()
            ['toLowerCase']()
        : '';
    !enabled19 &&
      (value43 === 'waiting' || value43 === 'processing') &&
      (value34['isGenerating'] = !![]);
    if (enabled20) {
      ((value34['isGenerating'] = ![]),
        (value34['jobStatus'] = 'error'),
        (value34['jobError'] = enabled20));
      if (status('dreaminaTaskStatus')) value34['dreaminaTaskStatus'] = 'failed';
      if (status('dreaminaTaskPhase')) value34['dreaminaTaskPhase'] = 'failed';
      if (status('dreaminaTaskLabel')) value34['dreaminaTaskLabel'] = enabled20;
      if (status('dreaminaTaskRecovering')) value34['dreaminaTaskRecovering'] = ![];
      if (status('asyncTaskStatus')) value34['asyncTaskStatus'] = 'failed';
      if (status('asyncTaskRecovering')) value34['asyncTaskRecovering'] = ![];
      if (status('rhTaskStatus')) value34['rhTaskStatus'] = 'failed';
      if (status('rhTaskRecovering')) value34['rhTaskRecovering'] = ![];
    }
    if (enabled21) {
      value34['isGenerating'] = ![];
      const jobStatusFromTaskStatus = resolveJobStatusFromTaskStatus(enabled21, value34['jobStatus'] ?? null);
      if (jobStatusFromTaskStatus !== undefined) value34['jobStatus'] = jobStatusFromTaskStatus;
      (status('dreaminaTaskStatus') || status('dreaminaTaskPhase')) &&
        (value34['dreaminaTaskRecovering'] = ![]);
      if (status('asyncTaskStatus')) value34['asyncTaskRecovering'] = ![];
      if (status('rhTaskStatus')) value34['rhTaskRecovering'] = ![];
    }
    if (value34['isGenerating'] === !![]) {
      if (!status('jobStatus')) value34['jobStatus'] = 'running';
      const count3 = Number(value34['generationStartTime']);
      if (!Number['isFinite'](count3) || count3 <= 0x0) {
        const count4 = Number(value33?.['generationStartTime']);
        value34['generationStartTime'] =
          Number['isFinite'](count4) && count4 > 0x0 ? count4 : Date['now']();
      }
      return ((value34['generationDuration'] = null), value34);
    }
    const value44 = value33?.['isGenerating'] === !![],
      value45 =
        value34['isGenerating'] === ![] &&
        value34['generationDuration'] == null &&
        (value44 || !!enabled20 || !!enabled21);
    if (value45) {
      const count5 = status('generationStartTime')
        ? Number(value34['generationStartTime'])
        : Number(value33?.['generationStartTime']);
      value34['generationDuration'] =
        Number['isFinite'](count5) && count5 > 0x0
          ? Math['max'](0x0, Date['now']() - count5)
          : value44
            ? 0x0
            : value34['generationDuration'];
    }
    return value34;
  }
  function run3() {
    if (count2 > 0x0) {
      enabled16 = !![];
      return;
    }
    subscribeNodeField['flush']();
    for (const run5 of list10) {
      run5(args6);
    }
    if (list9['length'] > 0x0) {
      const deepClone3 = deepClone(args6);
      for (const run6 of list9) {
        run6(deepClone3);
      }
    }
    for (const {
      selector: selector,
      callback: callback,
      isEqual: isEqual,
      lastValue: lastValue,
    } of list11) {
      const value46 = selector(args6);
      !isEqual(lastValue['value'], value46) &&
        ((lastValue['value'] = snapshotSelectorValue(value46)), callback(value46));
    }
  }
  function batch(handler6) {
    if (typeof handler6 !== 'function') throw new TypeError('[store] batch() 的参数必须是函数');
    count2++;
    try {
      return handler6();
    } finally {
      (count2--, count2 === 0x0 && enabled16 && ((enabled16 = ![]), run3()));
    }
  }
  function requestRender() {
    (el['renderRequest'](), run3());
  }
  function invalidateUi() {
    (el['renderRequest'](), run3());
  }
  function subscribe(handler7) {
    if (typeof handler7 !== 'function') throw new TypeError('[store] subscribe() 的参数必须是一个函数');
    return (
      list9['push'](handler7),
      handler7(deepClone(args6)),
      function run7() {
        const value47 = list9['indexOf'](handler7);
        value47 !== -0x1 && list9['splice'](value47, 0x1);
      }
    );
  }
  function subscribeRaw(handler8) {
    if (typeof handler8 !== 'function')
      throw new TypeError('[store]\x20subscribeRaw()\x20的参数必须是一个函数');
    return (
      list10['push'](handler8),
      handler8(args6),
      function run8() {
        const value48 = list10['indexOf'](handler8);
        value48 !== -0x1 && list10['splice'](value48, 0x1);
      }
    );
  }
  function subscribeSelector(selector2, callback2, value49 = {}) {
    if (typeof selector2 !== 'function')
      throw new TypeError('[store]\x20subscribeSelector()\x20的\x20selector\x20必须是函数');
    if (typeof callback2 !== 'function')
      throw new TypeError('[store] subscribeSelector() 的 callback 必须是函数');
    const isEqual2 = value49['isEqual'] || shallowEqual,
      value50 = selector2(args6),
      value51 = {
        selector: selector2,
        callback: callback2,
        isEqual: isEqual2,
        lastValue: { value: snapshotSelectorValue(value50) },
      };
    return (
      list11['push'](value51),
      callback2(value50),
      function run9() {
        const value52 = list11['indexOf'](value51);
        value52 !== -0x1 && list11['splice'](value52, 0x1);
      }
    );
  }
  function addNode(enabled22) {
    if (!enabled22 || !enabled22['id']) throw new Error('[store] addNode() 需要提供含有 id 字段的节点数据');
    const nodeData = applyFeatureSelectionsToNodeData(
        JSON['parse'](JSON['stringify'](enabled22)),
        args6['ui']?.['featureSelections'] || {},
      ),
      sanitizeCanvasNodeMediaPatchForStore2 = sanitizeCanvasNodeMediaPatchForStore(nodeData),
      value53 = {
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
      name = Object['prototype']['hasOwnProperty']['call'](value53, sanitizeCanvasNodeMediaPatchForStore2['type'])
        ? value53[sanitizeCanvasNodeMediaPatchForStore2['type']]
        : '未命名';
    sanitizeCanvasNodeMediaPatchForStore2['type'] === 'storyboard' &&
      (!Array['isArray'](sanitizeCanvasNodeMediaPatchForStore2['cells'])
        ? (sanitizeCanvasNodeMediaPatchForStore2['cells'] = [])
        : (sanitizeCanvasNodeMediaPatchForStore2['cells'] = sanitizeCanvasNodeMediaPatchForStore2['cells']['map']((args8) => ({
            ...args8,
            id: generateId('cell'),
          }))));
    sanitizeCanvasNodeMediaPatchForStore2['type'] === 'storyboard-script' &&
      (sanitizeCanvasNodeMediaPatchForStore2['storyboardScript'] = createDefaultStoryboardScriptState(sanitizeCanvasNodeMediaPatchForStore2['storyboardScript']));
    sanitizeCanvasNodeMediaPatchForStore2['type'] === 'comment-note' &&
      (sanitizeCanvasNodeMediaPatchForStore2['jumpShortcut'] = normalizeCommentNoteJumpShortcut(sanitizeCanvasNodeMediaPatchForStore2['jumpShortcut']));
    const { _bizRev: _bizRev, ...args9 } = sanitizeCanvasNodeMediaPatchForStore2,
      args10 = run4(null, args9),
      value54 = { parentId: null, name: name, _bizRev: 0x1, ...args10 };
    (captureFeatureSelectionsFromNodePatch(
      value54,
      value54,
      args6['ui']?.['featureSelections'] || {},
    ),
      el['add'](args6['nodes'][value54['id']], value54),
      (args6['nodes'][value54['id']] = value54),
      subscribeNodeField['touch'](value54['id']),
      (args6['_nodeCount'] = (args6['_nodeCount'] || 0x0) + 0x1),
      run(),
      value54['parentId'] && run10(value54['id'], value54['parentId']),
      run3());
  }
  function run10(value55, value56, value57 = null) {
    (value57 && args6['_parentToChildren'][value57]?.['delete'](value55),
      value56 &&
        (!args6['_parentToChildren'][value56] &&
          (args6['_parentToChildren'][value56] = new Set()),
        args6['_parentToChildren'][value56]['add'](value55)));
  }
  function run11(value58, value59 = null) {
    if (value59) {
      const map2 = args6['_parentToChildren'][value59];
      map2 &&
        (map2['delete'](value58),
        map2['size'] === 0x0 && delete args6['_parentToChildren'][value59]);
    }
    args6['_parentToChildren'][value58] && delete args6['_parentToChildren'][value58];
  }
  function updateNodePosition(value60, value61, value62) {
    moveNodes([value60], value61, value62);
  }
  function moveNodes(value63, value64, value65) {
    run12(planNodeMovement(args6, 'moveNodes', [value63, value64, value65]));
  }
  function moveNodesByOffsets(value66) {
    run12(planNodeMovement(args6, 'moveNodesByOffsets', [value66]));
  }
  function run12(value67) {
    let enabled23 = ![];
    for (const [value68, value69] of Object['entries'](value67)) {
      const box = args6['nodes'][value68];
      if (!box) continue;
      const x2 = (box['x'] || 0x0) + value69['dx'],
        y2 = (box['y'] || 0x0) + value69['dy'];
      if (x2 === box['x'] && y2 === box['y']) continue;
      ((box['x'] = x2),
        (box['y'] = y2),
        subscribeNodeField['touch'](value68),
        map['record'](value68, { x: x2, y: y2 }),
        (enabled23 = !![]));
    }
    if (!enabled23) return;
    (el['geometry'](), run(), run3());
  }
  function groupNodes(list13, value70) {
    if (!Array['isArray'](list13) || list13['length'] === 0x0) return;
    const parentId = value70 || null;
    let enabled24 = ![];
    list13['forEach']((value71) => {
      const value72 = args6['nodes'][value71];
      if (value72) {
        const value73 = value72['parentId'] || null;
        if (value73 === parentId) return;
        ((value72['parentId'] = parentId),
          subscribeNodeField['touch'](value71),
          map['record'](value71, { parentId: parentId }),
          (value72['_bizRev'] =
            (typeof value72['_bizRev'] === 'number' ? value72['_bizRev'] : 0x0) + 0x1),
          run10(value71, parentId, value73),
          (enabled24 = !![]));
      }
    });
    if (!enabled24) return;
    (el['content'](), run(), run3());
  }
  function run13(options2 = {}) {
    const fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(options2);
    if (!fixedInputSlotConfigFromManifest) return null;
    const targetInputPolicy = getTargetInputPolicy(options2),
      map3 = new Set(fixedInputSlotConfigFromManifest['visibleSlots'] || []),
      map4 = new Set(),
      map5 = new Set(),
      value74 = {},
      map6 = new Map();
    (fixedInputSlotConfigFromManifest['exclusiveGroups'] || [])['forEach']((value75) => {
      (value75['slots'] || [])['forEach']((value76) => {
        map6['set'](value76, value75['id']);
      });
    });
    const run14 = (value77, value78) => {
      const value79 = Number(targetInputPolicy?.['maxByKind']?.[value77]),
        value80 = Number(value74[value77] || 0x0);
      if (!Number['isFinite'](value79) || value79 <= value78 || value80 >= value79) return ![];
      return ((value74[value77] = value80 + 0x1), !![]);
    };
    return {
      reserveSlot(value81, value82 = null) {
        const value83 = String(value81 || '')['trim']();
        if (value83 === 'text') return !![];
        const value84 = String(value82?.['refSlot'] || '')['trim'](),
          list14 = (fixedInputSlotConfigFromManifest['slotOrderByType']?.[value83] || [])['filter']((value85) =>
            map3['has'](value85),
          );
        if (list14['length'] === 0x0) return run14(value83, 0x0);
        const enabled25 =
          value84 && list14['includes'](value84) && map3['has'](value84)
            ? value84
            : list14['find']((value86) => !map4['has'](value86));
        if (!enabled25 || map4['has'](enabled25)) return run14(value83, list14['length']);
        const value87 = map6['get'](enabled25);
        if (value87 && map5['has'](value87)) return run14(value83, list14['length']);
        map4['add'](enabled25);
        if (value87) map5['add'](value87);
        return ((value74[value83] = Number(value74[value83] || 0x0) + 0x1), enabled25);
      },
      reserve(value88, value89 = null) {
        return !!this['reserveSlot'](value88, value89);
      },
    };
  }
  function getIncomingEdges(targetId) {
    const nodes = args6,
      enabled26 = nodes['nodes'][targetId];
    if (!enabled26) return [];
    if (!canTargetReceiveInputs(enabled26)) return [];
    const sharedGroupId = enabled26['parentId'],
      policy = getTargetInputPolicy(enabled26),
      reserveInputSlot = run13(enabled26),
      counts = { text: 0x0, image: 0x0, video: 0x0, audio: 0x0 },
      list15 = [],
      list16 = [],
      directSourceIds = new Set(),
      acceptSource = (value90, edge = null) => {
        const kind = resolveEffectiveInputKind(value90, edge);
        if (!kind) return '';
        if (!isInputKindAllowed(policy, kind)) return '';
        if (!hasUsableInputNodeSource(value90, { edge: edge, kind: kind })) return '';
        return kind;
      };
    return (
      Object['values'](nodes['edges'] || {})['forEach']((args11) => {
        if (!args11 || args11['targetId'] !== targetId) return;
        const enabled27 = nodes['nodes'][args11['sourceId']];
        if (!enabled27) return;
        if (isGroupNodeData(enabled27)) return;
        const enabled28 = acceptSource(enabled27, args11);
        if (!enabled28) return;
        const refSlot = reserveInputSlot ? reserveInputSlot['reserveSlot'](enabled28, args11) : '';
        if (reserveInputSlot && !refSlot) return;
        (refSlot && typeof refSlot === 'string' && !args11['refSlot']
          ? list15['push']({ ...args11, refSlot: refSlot })
          : list15['push'](args11),
          directSourceIds['add'](args11['sourceId']),
          (counts[enabled28] = (counts[enabled28] || 0x0) + 0x1));
      }),
      Object['values'](nodes['edges'] || {})['forEach']((edge2) => {
        if (!edge2 || edge2['targetId'] !== targetId) return;
        const groupNode = nodes['nodes'][edge2['sourceId']];
        if (!isGroupNodeData(groupNode)) return;
        list15['push'](
          ...collectGroupOutputIncomingEdges({
            edge: edge2,
            groupNode: groupNode,
            nodes: nodes['nodes'],
            targetId: targetId,
            policy: policy,
            counts: counts,
            directSourceIds: directSourceIds,
            acceptSource: acceptSource,
            canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
            reserveInputSlot: reserveInputSlot
              ? (value91, value92) => reserveInputSlot['reserveSlot'](value91, value92)
              : null,
          }),
        );
      }),
      sharedGroupId &&
        Object['values'](nodes['edges'] || {})['forEach']((edge3) => {
          if (!edge3 || edge3['targetId'] !== sharedGroupId) return;
          const groupNode2 = nodes['nodes'][edge3['sourceId']];
          if (!groupNode2) return;
          if (isGroupNodeData(groupNode2)) {
            const list17 = collectGroupOutputIncomingEdges({
              edge: edge3,
              groupNode: groupNode2,
              nodes: nodes['nodes'],
              targetId: targetId,
              policy: policy,
              counts: counts,
              directSourceIds: directSourceIds,
              acceptSource: acceptSource,
              canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
              reserveInputSlot: reserveInputSlot
                ? (value93, value94) => reserveInputSlot['reserveSlot'](value93, value94)
                : null,
            });
            list16['push'](
              ...list17['map']((args12) => ({
                ...args12,
                isGroupShared: !![],
                sharedGroupId: sharedGroupId,
              })),
            );
            return;
          }
          const enabled29 = acceptSource(groupNode2, edge3);
          if (!enabled29) return;
          if (!canAppendInputKindWithinLimit(policy, enabled29, counts)) return;
          const refSlot2 = reserveInputSlot ? reserveInputSlot['reserveSlot'](enabled29, edge3) : '';
          if (reserveInputSlot && !refSlot2) return;
          (list16['push']({
            ...edge3,
            ...(refSlot2 && typeof refSlot2 === 'string' && !edge3['refSlot']
              ? { refSlot: refSlot2 }
              : null),
            isGroupShared: !![],
            sharedGroupId: sharedGroupId,
            effectiveTargetId: targetId,
          }),
            (counts[enabled29] = (counts[enabled29] || 0x0) + 0x1));
        }),
      [...list15, ...list16]['map']((value95) => cloneEdgeSnapshot(value95))
    );
  }
  function deleteNodes(value96) {
    const map7 = new Set(value96),
      list18 = [];
    el['remove'](value96);
    for (const id of value96) {
      const parentId2 = args6['nodes'][id];
      if (!parentId2) continue;
      list18['push']({ id: id, parentId: parentId2['parentId'] || null });
    }
    for (const value97 of value96) {
      (delete args6['nodes'][value97], subscribeNodeField['touch'](value97), map['delete'](value97));
    }
    args6['_nodeCount'] = Object['keys'](args6['nodes'])['length'];
    for (const { id: id2, parentId: parentId3 } of list18) {
      run11(id2, parentId3);
    }
    let value98 = ![];
    for (const value99 of Object['keys'](args6['edges'])) {
      const value100 = args6['edges'][value99];
      (map7['has'](value100['sourceId']) || map7['has'](value100['targetId'])) &&
        (delete args6['edges'][value99], (value98 = !![]));
    }
    if (value98) run2();
    (run(), emitNodeDeletions(list18), run3());
  }
  function addEdge(args13) {
    if (!args13 || !args13['id']) throw new Error('[store] addEdge() 需要提供含有 id 字段的连线数据');
    ((args6['edges'][args13['id']] = { isThumbnailActive: !![], type: null, ...args13 }),
      run2(),
      run(),
      run3());
  }
  function updateEdgesBatch(list19, list20) {
    (list19['forEach']((value101) => {
      if (args6['edges'][value101]) delete args6['edges'][value101];
    }),
      list20['forEach']((value102) => {
        const {
          isGroupShared: isGroupShared,
          sharedGroupId: sharedGroupId2,
          effectiveTargetId: effectiveTargetId,
          ...args14
        } = value102 || {};
        if (!args14['id']) return;
        args6['edges'][args14['id']] = args14;
      }),
      run2(),
      run(),
      run3());
  }
  function updateViewport(x3, y3, zoom2) {
    const box2 = args6['viewport'] || {};
    if (box2['x'] === x3 && box2['y'] === y3 && box2['zoom'] === zoom2)
      return;
    const value103 = box2['zoom'];
    args6['viewport'] = viewport['attach']({ x: x3, y: y3, zoom: zoom2 });
    if (value103 !== zoom2 && handler()) run(![]);
    run3();
  }
  function markViewportPersist() {
    (run(![]), run3());
  }
  function updateNodeData(value104, value105, value106 = {}) {
    const id3 = args6['nodes'][value104];
    if (!id3)
      throw new Error('[store]\x20updateNodeData()\x20找不到\x20id\x20为\x20\x22' + value104 + '" 的节点');
    const value107 = JSON['parse'](JSON['stringify'](value105)),
      { _bizRev: _bizRev2, ...args15 } = value107;
    args15['cells'] &&
      Array['isArray'](args15['cells']) &&
      (args15['cells'] = args15['cells']['map']((args16) => ({ ...args16 })));
    const sanitizeCanvasNodeMediaPatchForStore3 = sanitizeCanvasNodeMediaPatchForStore(args15, id3),
      args17 = run4(id3, sanitizeCanvasNodeMediaPatchForStore3);
    if (value106['replace'] !== !![] && _isPatchNoop(id3, args17)) return;
    map['record'](value104, args17, value106);
    const value108 = Object['prototype']['hasOwnProperty']['call'](args17, 'parentId')
      ? args17['parentId']
      : id3['parentId'];
    captureFeatureSelectionsFromNodePatch(id3, args17, args6['ui']?.['featureSelections'] || {});
    const _bizRev3 = (typeof id3['_bizRev'] === 'number' ? id3['_bizRev'] : 0x0) + 0x1;
    ((args6['nodes'][value104] = {
      ...(value106['replace'] === !![] ? { id: id3['id'], type: id3['type'] } : id3),
      ...args17,
      _bizRev: _bizRev3,
    }),
      value108 !== id3['parentId'] && run10(value104, value108, id3['parentId']),
      el['patch'](id3, args6['nodes'][value104]),
      subscribeNodeField['touch'](value104),
      run(),
      run3());
  }
  function updateNodesData(value109) {
    let value110 = ![];
    const store = el['batch']();
    for (const [value111, value112] of Object['entries'](value109)) {
      const args18 = args6['nodes'][value111];
      if (args18) {
        const value113 = JSON['parse'](JSON['stringify'](value112)),
          { _bizRev: _bizRev4, ...args19 } = value113;
        args19['cells'] &&
          Array['isArray'](args19['cells']) &&
          (args19['cells'] = args19['cells']['map']((args20) => ({ ...args20 })));
        const sanitizeCanvasNodeMediaPatchForStore4 = sanitizeCanvasNodeMediaPatchForStore(args19, args18),
          args21 = run4(args18, sanitizeCanvasNodeMediaPatchForStore4);
        map['record'](value111, args21);
        if (_isPatchNoop(args18, args21)) continue;
        const value114 = Object['prototype']['hasOwnProperty']['call'](args21, 'parentId')
          ? args21['parentId']
          : args18['parentId'];
        captureFeatureSelectionsFromNodePatch(
          args18,
          args21,
          args6['ui']?.['featureSelections'] || {},
        );
        const _bizRev5 = (typeof args18['_bizRev'] === 'number' ? args18['_bizRev'] : 0x0) + 0x1;
        ((args6['nodes'][value111] = { ...args18, ...args21, _bizRev: _bizRev5 }),
          store['patch'](args18, args6['nodes'][value111]),
          subscribeNodeField['touch'](value111),
          value114 !== args18['parentId'] && run10(value111, value114, args18['parentId']),
          (value110 = !![]));
      }
    }
    value110 && (store['commit'](), run(), run3());
  }
  function swapStoryboardCells(value115, value116, value117, value118) {
    const args22 = args6['nodes'][value115],
      args23 = args6['nodes'][value117],
      value119 = Number(value116),
      value120 = Number(value118);
    if (
      !_isValidStoryboardCellTarget(args22, value119) ||
      !_isValidStoryboardCellTarget(args23, value120)
    )
      return ![];
    if (value115 === value117 && value119 === value120) return ![];
    const cells = args22['cells']['slice'](),
      value121 = args22['cells'][value119],
      value122 = args23['cells'][value120];
    if (value115 === value117)
      ((cells[value120] = _placeStoryboardCellForSwap(
        cloneStoryboardCellForSwapDestination(value121),
        value121,
        args22,
        value119,
        args22,
        value120,
      )),
        (cells[value119] = _placeStoryboardCellForSwap(
          cloneStoryboardCellForSwapDestination(value122),
          value122,
          args22,
          value120,
          args22,
          value119,
        )),
        (args6['nodes'][value115] = {
          ...args22,
          cells: cells,
          _bizRev: (typeof args22['_bizRev'] === 'number' ? args22['_bizRev'] : 0x0) + 0x1,
        }));
    else {
      const cells2 = args23['cells']['slice']();
      ((cells2[value120] = _placeStoryboardCellForSwap(
        cloneStoryboardCellForSwapDestination(value121),
        value121,
        args22,
        value119,
        args23,
        value120,
      )),
        (cells[value119] = normalizeEmptyStoryboardCell({
          ...cloneStoryboardCellForSwap(value121),
          ..._getStoryboardCellPosition(args22, value119),
        })),
        (args6['nodes'][value115] = {
          ...args22,
          cells: cells,
          _bizRev: (typeof args22['_bizRev'] === 'number' ? args22['_bizRev'] : 0x0) + 0x1,
        }),
        (args6['nodes'][value117] = {
          ...args23,
          cells: cells2,
          _bizRev: (typeof args23['_bizRev'] === 'number' ? args23['_bizRev'] : 0x0) + 0x1,
        }));
    }
    return (
      el['content'](),
      subscribeNodeField['touch'](value115),
      subscribeNodeField['touch'](value117),
      run(),
      run3(),
      !![]
    );
  }
  function renameNode(value123, name2) {
    const error2 = args6['nodes'][value123];
    if (!error2) return;
    if (error2['name'] === name2) return;
    const _bizRev6 = (typeof error2['_bizRev'] === 'number' ? error2['_bizRev'] : 0x0) + 0x1;
    ((args6['nodes'][value123] = { ...error2, name: name2, _bizRev: _bizRev6 }),
      subscribeNodeField['touch'](value123),
      el['content'](),
      run(),
      run3());
  }
  function removeEdge(value124) {
    args6['edges'][value124] &&
      (delete args6['edges'][value124], run2(), run(), run3());
  }
  function showPicker(screenX, screenY, x4, y4) {
    ((args6['picker'] = {
      visible: !![],
      x: x4,
      y: y4,
      screenX: screenX,
      screenY: screenY,
    }),
      run3());
  }
  function hidePicker() {
    if (args6['picker']?.['visible'] === ![]) return;
    ((args6['picker'] = { ...args6['picker'], visible: ![] }), run3());
  }
  function getState() {
    return deepClone(args6);
  }
  function getStateRaw() {
    return args6;
  }
  function loadState(enabled30, { preserveHistoryProjection: preserveHistoryProjection = ![] } = {}) {
    if (!enabled30) return;
    if (!preserveHistoryProjection) map['clear']();
    ((args6['nodes'] = deepClone(enabled30['nodes'] ?? {})), map['prune'](args6['nodes']));
    for (const [value125, value126] of Object['entries'](args6['nodes'])) {
      args6['nodes'][value125] = applyFeatureSelectionsToNodeData(
        value126,
        args6['ui']?.['featureSelections'] || {},
      );
    }
    (normalizeNodesCollection(args6['nodes']),
      (args6['edges'] = deepClone(enabled30['edges'] ?? {})),
      (args6['viewport'] = viewport['attach'](
        deepClone(enabled30['viewport'] ?? { x: 0x0, y: 0x0, zoom: 0x1 }),
      )),
      (args6['_nodeCount'] = Object['keys'](args6['nodes'])['length']));
    for (const enabled31 of Object['values'](args6['nodes'])) {
      if (!enabled31 || typeof enabled31 !== 'object') continue;
      if (typeof enabled31['_bizRev'] !== 'number') enabled31['_bizRev'] = 0x1;
    }
    args6['_parentToChildren'] = {};
    for (const [value127, value128] of Object['entries'](args6['nodes'])) {
      value128['parentId'] && run10(value127, value128['parentId']);
    }
    (run2(), el['reload'](), subscribeNodeField['reload'](), run(), run3());
  }
  function getHistorySnapshot() {
    const nodes2 = {};
    for (const [value129, value130] of Object['entries'](args6['nodes'] || {})) {
      nodes2[value129] = cloneNodeSnapshot(value130, { stripPanoramaViewport: !![] });
    }
    const edges = {};
    for (const [value131, value132] of Object['entries'](args6['edges'] || {})) {
      edges[value131] = cloneEdgeSnapshot(value132);
    }
    return { nodes: nodes2, edges: edges };
  }
  function loadHistorySnapshot(args24) {
    if (!args24) return;
    const value133 = args6['nodes'] || {},
      nodes3 = deepClone(args24['nodes'] ?? {});
    for (const [value134, enabled32] of Object['entries'](nodes3)) {
      if (!enabled32 || typeof enabled32 !== 'object') continue;
      const value135 = value133[value134];
      if (enabled32['type'] === 'panorama-scene') {
        const value136 = value135?.['sceneNode']?.['viewport'];
        value136 &&
          (enabled32['sceneNode'] = { ...(enabled32['sceneNode'] || {}), viewport: deepClone(value136) });
      } else {
        if (enabled32['type'] === 'panorama-360') {
          const value137 = value135?.['panorama360Node']?.['viewport'];
          value137 &&
            (enabled32['panorama360Node'] = {
              ...(enabled32['panorama360Node'] || {}),
              viewport: deepClone(value137),
            });
        }
      }
      map['restore'](enabled32, value135);
    }
    loadState(
      { ...args24, nodes: nodes3, viewport: cloneViewportSnapshot(args6['viewport']) },
      { preserveHistoryProjection: !![] },
    );
  }
  function getSourcesForNode(value138) {
    const list21 = Object['values'](args6['edges'])['filter'](
      (value139) => value139['targetId'] === value138,
    );
    return list21['map']((value140) => args6['nodes'][value140['sourceId']])['filter'](
      (enabled33) => !!enabled33,
    );
  }
  function run15(value141, enabled34) {
    if (!enabled34 || typeof enabled34 !== 'object') return ![];
    for (const [value142, value143] of Object['entries'](enabled34)) {
      if (value141?.[value142] !== value143) return !![];
    }
    return ![];
  }
  function run16(list22, list23) {
    if (list22 === list23) return !![];
    if (!Array['isArray'](list22) || !Array['isArray'](list23)) return ![];
    if (list22['length'] !== list23['length']) return ![];
    for (let value144 = 0x0; value144 < list22['length']; value144 += 0x1) {
      if (!Object['is'](list22[value144], list23[value144])) return ![];
    }
    return !![];
  }
  function run17(enabled35, enabled36) {
    if (enabled35 === enabled36) return !![];
    if (
      !enabled35 ||
      !enabled36 ||
      typeof enabled35 !== 'object' ||
      typeof enabled36 !== 'object' ||
      Array['isArray'](enabled35) ||
      Array['isArray'](enabled36)
    )
      return ![];
    const list24 = Object['keys'](enabled35),
      list25 = Object['keys'](enabled36);
    if (list24['length'] !== list25['length']) return ![];
    for (const value145 of list24) {
      if (!Object['prototype']['hasOwnProperty']['call'](enabled36, value145)) return ![];
      const value146 = enabled35[value145],
        value147 = enabled36[value145];
      if (Array['isArray'](value146) || Array['isArray'](value147)) {
        if (!run16(value146, value147)) return ![];
      } else {
        if (!Object['is'](value146, value147)) return ![];
      }
    }
    return !![];
  }
  function setSelectionBox(args25) {
    if (!args25 || typeof args25 !== 'object') return;
    if (!run15(args6['selectionBox'], args25)) return;
    ((args6['selectionBox'] = { ...args6['selectionBox'], ...args25 }), run3());
  }
  function setSelectionMeta(value148) {
    const args26 = value148 || {};
    if (!run15(args6['selectionMeta'], args26)) return;
    ((args6['selectionMeta'] = { ...args6['selectionMeta'], ...args26 }), run3());
  }
  function setSelectedNodes(value149) {
    const value150 = Array['from'](value149 || []);
    if (run16(args6['selectedNodeIds'], value150)) return;
    ((args6['selectedNodeIds'] = value150), run3());
  }
  function clearSelection() {
    const enabled37 = args6['selectionBox']?.['active'] === !![],
      enabled38 = Array['isArray'](args6['selectedNodeIds'])
        ? args6['selectedNodeIds']['length'] > 0x0
        : ![],
      enabled39 = args6['selectionMeta']?.['source'] != null;
    if (!enabled37 && !enabled38 && !enabled39) return;
    ((args6['selectionBox']['active'] = ![]),
      (args6['selectedNodeIds'] = []),
      (args6['selectionMeta']['source'] = null),
      run3());
  }
  function showContextMenu(x5, y5, items) {
    ((args6['contextMenu'] = { visible: !![], x: x5, y: y5, items: items }),
      run3());
  }
  function hideContextMenu() {
    if (args6['contextMenu']?.['visible'] !== !![]) return;
    ((args6['contextMenu'] = { visible: ![], x: 0x0, y: 0x0, items: [] }), run3());
  }
  function setConnOverlay({ srcId: srcId, invalidNodeIds: invalidNodeIds, hoverId: hoverId, side: side }) {
    const value151 = {
      srcId: srcId !== undefined ? srcId : args6['connOverlay']['srcId'],
      invalidNodeIds:
        invalidNodeIds !== undefined
          ? Array['isArray'](invalidNodeIds)
            ? invalidNodeIds
            : []
          : args6['connOverlay']['invalidNodeIds'],
      hoverId: hoverId !== undefined ? hoverId : args6['connOverlay']['hoverId'],
      side: side !== undefined ? side : args6['connOverlay']['side'],
    };
    if (run17(args6['connOverlay'], value151)) return;
    ((args6['connOverlay'] = value151), run3());
  }
  function clearConnOverlay() {
    const value152 = { srcId: null, invalidNodeIds: [], hoverId: null, side: null };
    if (run17(args6['connOverlay'], value152)) return;
    ((args6['connOverlay'] = value152), run3());
  }
  function serializeNode(value153) {
    const value154 = args6['nodes']?.[value153];
    return value154
      ? sanitizeNodeForPersistence(cloneNodeSnapshot(value154, { stripRichText: !![] }))
      : null;
  }
  function serialize() {
    const nodes4 = Object['values'](args6['nodes'] || {})['map']((value155) =>
        cloneNodeSnapshot(value155, { stripRichText: !![] }),
      ),
      edges2 = Object['values'](args6['edges'] || {})['map']((value156) =>
        cloneEdgeSnapshot(value156),
      ),
      value157 = {
        nodes: nodes4,
        edges: edges2,
        viewport: viewport['strip'](args6['viewport']),
        assets: Array['isArray'](args6['assets'])
          ? args6['assets']['map']((value158) => cloneAssetSnapshot(value158))
          : [],
        storyboard3dProjects: cloneStoryboard3DProjects(args6['storyboard3dProjects'], deepClone),
      };
    return sanitizeSerializedCanvasData(value157);
  }
  function run18(enabled40, { preserveLiveGeneration: preserveLiveGeneration = ![] } = {}) {
    if (!enabled40) return;
    map['clear']();
    const hydratedAt2 = Date['now'](),
      featureSelections2 = args6['ui']?.['featureSelections'] || {};
    enabled40['viewport'] &&
      (args6['viewport'] = viewport['attach'](cloneViewportSnapshot(enabled40['viewport'])));
    ((args6['nodes'] = {}), (args6['_parentToChildren'] = {}));
    let value159 = 0x0;
    if (Array['isArray'](enabled40['nodes']))
      enabled40['nodes']['forEach']((enabled41) => {
        if (!enabled41 || typeof enabled41 !== 'object') return;
        const cloneNodeSnapshot2 = cloneNodeSnapshot(enabled41, {
          hydratedAt: hydratedAt2,
          featureSelections: featureSelections2,
          preserveLiveGeneration: preserveLiveGeneration,
        });
        ((args6['nodes'][cloneNodeSnapshot2['id']] = cloneNodeSnapshot2),
          (value159 += 0x1),
          cloneNodeSnapshot2['parentId'] && run10(cloneNodeSnapshot2['id'], cloneNodeSnapshot2['parentId']));
      });
    else {
      if (enabled40['nodes'] && typeof enabled40['nodes'] === 'object')
        for (const [id4, args27] of Object['entries'](enabled40['nodes'])) {
          if (!args27 || typeof args27 !== 'object') continue;
          const cloneNodeSnapshot3 = cloneNodeSnapshot(args27['id'] ? args27 : { ...args27, id: id4 }, {
            hydratedAt: hydratedAt2,
            featureSelections: featureSelections2,
            preserveLiveGeneration: preserveLiveGeneration,
          });
          ((args6['nodes'][id4] = cloneNodeSnapshot3),
            (value159 += 0x1),
            cloneNodeSnapshot3['parentId'] && run10(id4, cloneNodeSnapshot3['parentId']));
        }
    }
    args6['_nodeCount'] = value159;
    const value160 = {};
    if (Array['isArray'](enabled40['edges']))
      for (const enabled42 of enabled40['edges']) {
        if (!enabled42 || typeof enabled42 !== 'object') continue;
        value160[enabled42['id']] = cloneEdgeSnapshot(enabled42);
      }
    else {
      if (enabled40['edges'] && typeof enabled40['edges'] === 'object')
        for (const [value161, enabled43] of Object['entries'](enabled40['edges'])) {
          if (!enabled43 || typeof enabled43 !== 'object') continue;
          const cloneEdgeSnapshot2 = cloneEdgeSnapshot(enabled43);
          if (cloneEdgeSnapshot2['id'] == null) cloneEdgeSnapshot2['id'] = value161;
          value160[cloneEdgeSnapshot2['id']] = cloneEdgeSnapshot2;
        }
    }
    ((args6['edges'] = value160),
      run2(),
      (args6['assets'] = Array['isArray'](enabled40['assets'])
        ? enabled40['assets']['map']((value162) => cloneAssetSnapshot(value162))
        : []),
      (args6['storyboard3dProjects'] = cloneStoryboard3DProjects(
        enabled40['storyboard3dProjects'],
        deepClone,
      )),
      el['reload'](),
      subscribeNodeField['reload'](),
      run(),
      run3());
  }
  function hydrateTrustedSnapshot(value163, value164 = {}) {
    run18(value163, value164);
  }
  function hydrate(enabled44) {
    if (!enabled44) return;
    const deepClone4 = deepClone(enabled44);
    run18(deepClone4);
  }
  function setPickConnectMode({
    active: active3,
    sourceNodeId: sourceNodeId = null,
    handleDirection: handleDirection = null,
    hoverNodeId: hoverNodeId = null,
  }) {
    ((args6['pickConnectMode'] = {
      active: active3,
      sourceNodeId: sourceNodeId,
      handleDirection: handleDirection,
      hoverNodeId: hoverNodeId,
    }),
      run3());
  }
  function setServerConnection(value165) {
    if (args6['isServerConnected'] === value165) return;
    ((args6['isServerConnected'] = value165), run3());
  }
  function setPickConnectHover(hoverNodeId2) {
    if (!args6['pickConnectMode'] || !args6['pickConnectMode']['active']) return;
    if (args6['pickConnectMode']['hoverNodeId'] === hoverNodeId2) return;
    ((args6['pickConnectMode'] = { ...args6['pickConnectMode'], hoverNodeId: hoverNodeId2 }),
      run3());
  }
  function setAnnotateState(value166) {
    const args28 = args6['annotate'] || {},
      args29 = value166 || {};
    if (!run15(args28, args29)) return;
    const value167 = { ...args28, ...args29 };
    ((args6['annotate'] = value167), run3());
  }
  function setMattingState(value168) {
    const args30 = args6['matting'] || {},
      args31 = value168 || {};
    if (!run15(args30, args31)) return;
    const value169 = { ...args30, ...args31 };
    ((args6['matting'] = value169), run3());
  }
  function setVideoKeyingState(value170) {
    const args32 = args6['videoKeying'] || {},
      args33 = value170 || {};
    if (!run15(args32, args33)) return;
    const value171 = { ...args32, ...args33 };
    ((args6['videoKeying'] = value171), run3());
  }
  function setVideoClipState(value172) {
    const args34 = args6['videoClip'] || {},
      args35 = value172 || {};
    if (!run15(args34, args35)) return;
    const value173 = { ...args34, ...args35 };
    ((args6['videoClip'] = value173), run3());
  }
  function setTheme(value174) {
    if (args6['theme'] === value174) return;
    ((args6['theme'] = value174), run3());
  }
  function toggleTheme() {
    const value175 = args6['theme'] === 'dark' ? 'light' : 'dark';
    setTheme(value175);
  }
  function initTheme(value176 = 'dark') {
    const value177 = value176 === 'light' ? 'light' : 'dark';
    args6['theme'] = value177;
  }
  function initFeatureSelections(options3 = {}) {
    if (!args6['ui']) args6['ui'] = {};
    args6['ui']['featureSelections'] = sanitizeFeatureSelectionsRecord(options3);
  }
  function getFeatureSelection(value178, value179, value180 = undefined) {
    const enabled45 = String(value178 || '')['trim'](),
      enabled46 = String(value179 || '')['trim']();
    if (!enabled45 || !enabled46) return value180;
    const value181 = args6['ui']?.['featureSelections']?.[enabled45]?.[enabled46];
    return value181 === undefined ? value180 : value181;
  }
  function setFeatureSelection(value182, value183, value184) {
    const enabled47 = String(value182 || '')['trim'](),
      enabled48 = String(value183 || '')['trim']();
    if (!enabled47 || !enabled48) return;
    if (!args6['ui']) args6['ui'] = {};
    (!args6['ui']['featureSelections'] || typeof args6['ui']['featureSelections'] !== 'object') &&
      (args6['ui']['featureSelections'] = {});
    const args36 = args6['ui']['featureSelections'][enabled47] || {};
    if (args36[enabled48] === value184) return;
    ((args6['ui']['featureSelections'] = {
      ...args6['ui']['featureSelections'],
      [enabled47]: { ...args36, [enabled48]: value184 },
    }),
      run3());
  }
  function run19(value185, value186) {
    if (args6['ui'] && args6['ui'][value185] === value186) return;
    if (!args6['ui']) args6['ui'] = {};
    ((args6['ui'][value185] = value186), run3());
  }
  function setShowVideoMeta(value187) {
    run19('showVideoMeta', value187 === !![]);
  }
  function setShowSelectionMediaProperties(value188) {
    run19('showSelectionMediaProperties', value188 !== ![]);
  }
  function setTitleFollowsCanvasZoom(value189) {
    run19('titleFollowsCanvasZoom', value189 === !![]);
  }
  function setPromptBoxResizeEnabled(value190) {
    run19('promptBoxResizeEnabled', value190 !== ![]);
  }
  function setPromptEnterBehavior(value191) {
    run19('promptEnterBehavior', value191 === 'newline' ? 'newline' : 'submit');
  }
  function setPromptAttachmentButtonHidden(value192) {
    run19('promptAttachmentButtonHidden', value192 === !![]);
  }
  function setPromptPresetButtonHidden(value193) {
    run19('promptPresetButtonHidden', value193 === !![]);
  }
  function setVideoAudioDefaultEnabled(value194) {
    run19('videoAudioDefaultEnabled', value194 === !![]);
  }
  function setCanvasToolbarPlacement(value195) {
    run19('canvasToolbarPlacement', normalizeCanvasToolbarPlacement(value195));
  }
  function setNodeManagerPlacement(value196) {
    run19('nodeManagerPlacement', normalizeNodeManagerPlacement(value196));
  }
  function setLeftSidebarAutoHideEnabled(value197) {
    run19('leftSidebarAutoHideEnabled', value197 === !![]);
  }
  function setBottomLeftBarAutoHideEnabled(value198) {
    run19('bottomLeftBarAutoHideEnabled', value198 === !![]);
  }
  function setImageVideoNodeResizeEnabled(value199) {
    run19('imageVideoNodeResizeEnabled', value199 === !![]);
  }
  function run20(value200, value201, handler9, handler10) {
    const value202 = handler9(value201);
    if (!args6['ui']) args6['ui'] = {};
    if (handler10(args6['ui'][value200]) === handler10(value202)) return;
    ((args6['ui'][value200] = value202), run3());
  }
  function setImageToolbarLayout(value203) {
    run20('imageToolbarLayout', value203, normalizeImageToolbarLayout, serializeImageToolbarLayout);
  }
  function setVideoToolbarLayout(value204) {
    run20('videoToolbarLayout', value204, normalizeVideoToolbarLayout, serializeVideoToolbarLayout);
  }
  function setAlignFeatureEnabled(value205) {
    const enabled49 = value205 !== ![];
    if (args6['ui'] && args6['ui']['alignFeatureEnabled'] === enabled49) return;
    if (!args6['ui']) args6['ui'] = {};
    args6['ui']['alignFeatureEnabled'] = enabled49;
    if (!enabled49)
      ((args6['ui']['alignFeatureTriggerMode'] = 'off'),
        (args6['ui']['alignPanelVisible'] = ![]),
        (args6['ui']['alignPanelAnchorWorld'] = null));
    else
      args6['ui']['alignFeatureTriggerMode'] === 'off' &&
        (args6['ui']['alignFeatureTriggerMode'] = 'click');
    run3();
  }
  function setAlignFeatureTriggerMode(value206) {
    const value207 =
      value206 === 'hold' || value206 === 'click' || value206 === 'off' ? value206 : 'click';
    if (!args6['ui']) args6['ui'] = {};
    if (args6['ui']['alignFeatureTriggerMode'] === value207) return;
    ((args6['ui']['alignFeatureTriggerMode'] = value207),
      (args6['ui']['alignFeatureEnabled'] = value207 !== 'off'),
      value207 === 'off' &&
        ((args6['ui']['alignPanelVisible'] = ![]), (args6['ui']['alignPanelAnchorWorld'] = null)),
      run3());
  }
  function setAlignDistributeGap(value208) {
    const value209 = Number(value208),
      value210 = Number['isFinite'](value209)
        ? Math['max'](0x0, Math['min'](0xc8, Math['round'](value209)))
        : 0x28;
    if (args6['ui'] && args6['ui']['alignDistributeGap'] === value210) return;
    if (!args6['ui']) args6['ui'] = {};
    ((args6['ui']['alignDistributeGap'] = value210), run3());
  }
  function setAlignPanelVisible(value211) {
    const enabled50 = value211 === !![];
    if (!args6['ui']) args6['ui'] = {};
    if (!enabled50) {
      const enabled51 = !!args6['ui']['alignPanelAnchorWorld'];
      if (args6['ui']['alignPanelVisible'] === enabled50 && !enabled51) return;
      ((args6['ui']['alignPanelVisible'] = ![]),
        (args6['ui']['alignPanelAnchorWorld'] = null),
        run3());
      return;
    }
    if (args6['ui']['alignPanelVisible'] === enabled50) return;
    ((args6['ui']['alignPanelVisible'] = enabled50), run3());
  }
  function setAlignPanelAnchorWorld(box3) {
    if (!args6['ui']) args6['ui'] = {};
    let box4 = null;
    box3 &&
      Number['isFinite'](box3['x']) &&
      Number['isFinite'](box3['y']) &&
      (box4 = { x: Number(box3['x']), y: Number(box3['y']) });
    const box5 = args6['ui']['alignPanelAnchorWorld'],
      value212 =
        (!box5 && !box4) ||
        (box5 &&
          box4 &&
          Number(box5['x']) === Number(box4['x']) &&
          Number(box5['y']) === Number(box4['y']));
    if (value212) return;
    ((args6['ui']['alignPanelAnchorWorld'] = box4), run3());
  }
  function setSnapGuidesEnabled(value213) {
    const value214 = value213 !== ![];
    if (args6['ui'] && args6['ui']['snapGuidesEnabled'] === value214) return;
    if (!args6['ui']) args6['ui'] = {};
    ((args6['ui']['snapGuidesEnabled'] = value214), run3());
  }
  function setSelectionRelatedHighlightEnabled(value215) {
    const value216 = value215 !== ![];
    if (args6['ui'] && args6['ui']['selectionRelatedHighlightEnabled'] === value216) return;
    if (!args6['ui']) args6['ui'] = {};
    ((args6['ui']['selectionRelatedHighlightEnabled'] = value216), run3());
  }
  function run21(value217) {
    const value218 = String(value217 || '')['trim']();
    return ['white', 'blue', 'green', 'cyan', 'purple', 'red', 'yellow']['includes'](value218)
      ? value218
      : 'white';
  }
  function setSelectionRelatedHighlightColor(value219) {
    const value220 = run21(value219);
    if (args6['ui'] && args6['ui']['selectionRelatedHighlightColor'] === value220) return;
    if (!args6['ui']) args6['ui'] = {};
    ((args6['ui']['selectionRelatedHighlightColor'] = value220), run3());
  }
  function setConnectionLinesVisible(value221) {
    const value222 = value221 !== ![];
    if (args6['ui'] && args6['ui']['connectionLinesVisible'] === value222) return;
    if (!args6['ui']) args6['ui'] = {};
    ((args6['ui']['connectionLinesVisible'] = value222), run3());
  }
  function setConnectionLineStyle(value223) {
    const connectionLineStyle = normalizeConnectionLineStyle(value223);
    if (args6['ui'] && args6['ui']['connectionLineStyle'] === connectionLineStyle) return;
    if (!args6['ui']) args6['ui'] = {};
    ((args6['ui']['connectionLineStyle'] = connectionLineStyle), run3());
  }
  function initUiPrefs(options4 = {}) {
    const value224 = options4?.['showSelectionMediaProperties'] !== ![],
      value225 = options4?.['titleFollowsCanvasZoom'] === !![],
      value226 = options4?.['promptBoxResizeEnabled'] !== ![],
      value227 = options4?.['promptAttachmentButtonHidden'] === !![],
      value228 = options4?.['imageVideoNodeResizeEnabled'] === !![],
      value229 = options4?.['selectionRelatedHighlightEnabled'] !== ![],
      value230 = run21(options4?.['selectionRelatedHighlightColor']),
      value231 = options4?.['connectionLinesVisible'] !== ![],
      connectionLineStyle2 = normalizeConnectionLineStyle(options4?.['connectionLineStyle']),
      value232 = String(options4?.['alignFeatureTriggerMode'] || '')['trim'](),
      value233 =
        value232 === 'hold' || value232 === 'click' || value232 === 'off'
          ? value232
          : options4?.['alignFeatureEnabled'] === ![]
            ? 'off'
            : 'click',
      value234 = options4?.['alignFeatureEnabled'] === ![] ? ![] : value233 !== 'off',
      value235 = Number(options4?.['alignDistributeGap']),
      value236 = Number['isFinite'](value235)
        ? Math['max'](0x0, Math['min'](0xc8, Math['round'](value235)))
        : 0x28,
      value237 = options4?.['snapGuidesEnabled'] !== ![];
    if (!args6['ui']) args6['ui'] = {};
    ((args6['ui']['showVideoMeta'] = ![]),
      (args6['ui']['showSelectionMediaProperties'] = value224),
      (args6['ui']['titleFollowsCanvasZoom'] = value225),
      (args6['ui']['promptBoxResizeEnabled'] = value226),
      (args6['ui']['promptEnterBehavior'] =
        options4?.['promptEnterBehavior'] === 'newline' ? 'newline' : 'submit'),
      (args6['ui']['promptAttachmentButtonHidden'] = value227),
      (args6['ui']['promptPresetButtonHidden'] = options4?.['promptPresetButtonHidden'] === !![]),
      (args6['ui']['videoAudioDefaultEnabled'] = options4?.['videoAudioDefaultEnabled'] === !![]),
      (args6['ui']['canvasToolbarPlacement'] = normalizeCanvasToolbarPlacement(
        options4?.['canvasToolbarPlacement'],
      )),
      (args6['ui']['nodeManagerPlacement'] = normalizeNodeManagerPlacement(
        options4?.['nodeManagerPlacement'],
      )),
      (args6['ui']['leftSidebarAutoHideEnabled'] = options4?.['leftSidebarAutoHideEnabled'] === !![]),
      (args6['ui']['bottomLeftBarAutoHideEnabled'] =
        options4?.['bottomLeftBarAutoHideEnabled'] === !![]),
      (args6['ui']['imageVideoNodeResizeEnabled'] = value228),
      (args6['ui']['imageToolbarLayout'] = normalizeImageToolbarLayout(
        options4?.['imageToolbarLayout'],
      )),
      (args6['ui']['videoToolbarLayout'] = normalizeVideoToolbarLayout(
        options4?.['videoToolbarLayout'],
      )),
      (args6['ui']['selectionRelatedHighlightEnabled'] = value229),
      (args6['ui']['selectionRelatedHighlightColor'] = value230),
      (args6['ui']['connectionLinesVisible'] = value231),
      (args6['ui']['connectionLineStyle'] = connectionLineStyle2),
      (args6['ui']['alignFeatureEnabled'] = value234),
      (args6['ui']['alignFeatureTriggerMode'] = value233),
      (args6['ui']['alignDistributeGap'] = value236),
      (args6['ui']['alignPanelVisible'] = ![]),
      (args6['ui']['alignPanelAnchorWorld'] = null),
      (args6['ui']['snapGuidesEnabled'] = value237),
      initFeatureSelections(options4?.['featureSelections'] || {}),
      run3());
  }
  function run22(value238, value239) {
    const args37 = args6[value238] || {};
    ((args6[value238] = { ...args37, ...(value239 || {}) }), run3());
  }
  const setSubscriptionState = (value240) => run22('subscription', value240),
    setModelCatalogState = (value241) => run22('modelCatalog', value241),
    { upsertStoryboard3DProject: upsertStoryboard3DProject, deleteStoryboard3DProject: deleteStoryboard3DProject } =
      createStoryboard3DProjectActions({
        readProjects: () => args6['storyboard3dProjects'],
        writeProjects: (value242) => {
          ((args6['storyboard3dProjects'] = value242), run(), run3());
        },
        clone: deepClone,
      });
  function addAsset(enabled52) {
    if (!enabled52 || !enabled52['id']) throw new Error('[store] addAsset() 需要提供含有 id 字段的资产数据');
    const value243 = JSON['parse'](JSON['stringify'](enabled52));
    if (!args6['assets']) args6['assets'] = [];
    (args6['assets']['unshift'](value243), run(), run3());
  }
  function deleteAsset(value244) {
    if (!args6['assets']) return;
    const value245 = args6['assets']['length'];
    ((args6['assets'] = args6['assets']['filter']((value246) => value246['id'] !== value244)),
      args6['assets']['length'] !== value245 && (run(), run3()));
  }
  function updateAsset(value247, args38) {
    if (!args6['assets']) return;
    const value248 = args6['assets']['findIndex']((value249) => value249['id'] === value247);
    if (value248 !== -0x1) {
      const args39 = args6['assets'][value248],
        value250 = { ...args39, ...args38 };
      if (shallowEqual(args39, value250)) return;
      ((args6['assets'][value248] = value250), run(), run3());
    }
  }
  function run23() {
    ((!args6['workflows'] || typeof args6['workflows'] !== 'object') &&
      (args6['workflows'] = { items: [], loading: ![], error: null, loadedAt: 0x0 }),
      !Array['isArray'](args6['workflows']['items']) && (args6['workflows']['items'] = []),
      (!args6['workflowUi'] || typeof args6['workflowUi'] !== 'object') &&
        (args6['workflowUi'] = createInitialWorkflowUiState()));
  }
  function setWorkflowsLoading(loading, error3 = null) {
    (run23(),
      (args6['workflows'] = {
        ...args6['workflows'],
        loading: loading === !![],
        error: error3 == null ? null : String(error3),
      }),
      run3());
  }
  function setWorkflows(list26) {
    (run23(),
      (args6['workflows'] = {
        ...args6['workflows'],
        items: Array['isArray'](list26)
          ? list26['map']((value251) => cloneWorkflowSnapshot(value251))
          : [],
        loading: ![],
        error: null,
        loadedAt: Date['now'](),
      }),
      run3());
  }
  function upsertWorkflow(enabled53) {
    if (!enabled53 || !enabled53['id']) return;
    run23();
    const args40 = cloneWorkflowSnapshot(enabled53),
      count6 = args6['workflows']['items']['findIndex'](
        (value252) => value252?.['id'] === args40['id'],
      );
    (count6 >= 0x0
      ? (args6['workflows']['items'][count6] = {
          ...args6['workflows']['items'][count6],
          ...args40,
        })
      : args6['workflows']['items']['unshift'](args40),
      run3());
  }
  function updateWorkflowLocal(value253, enabled54) {
    const enabled55 = String(value253 || '')['trim']();
    if (!enabled55 || !enabled54 || typeof enabled54 !== 'object') return;
    run23();
    const count7 = args6['workflows']['items']['findIndex'](
      (value254) => value254?.['id'] === enabled55,
    );
    if (count7 < 0x0) return;
    ((args6['workflows']['items'][count7] = {
      ...args6['workflows']['items'][count7],
      ...cloneWorkflowSnapshot(enabled54),
    }),
      run3());
  }
  function markWorkflowUsed(value255, lastUsedAt = Date['now']()) {
    updateWorkflowLocal(value255, { lastUsedAt: lastUsedAt });
  }
  function setWorkflowUi(enabled56) {
    if (!enabled56 || typeof enabled56 !== 'object') return;
    run23();
    const args41 = { ...args6['workflowUi'] };
    for (const [value256, value257] of Object['entries'](enabled56)) {
      value256 === 'draft' && value257 && typeof value257 === 'object'
        ? (args41['draft'] = { ...args41['draft'], ...cloneWorkflowSnapshot(value257) })
        : (args41[value256] = cloneWorkflowSnapshot(value257));
    }
    ((args6['workflowUi'] = args41), run3());
  }
  function setWorkflowDraft(enabled57) {
    if (!enabled57 || typeof enabled57 !== 'object') return;
    (run23(),
      (args6['workflowUi'] = {
        ...args6['workflowUi'],
        draft: {
          ...(args6['workflowUi']['draft'] || createInitialWorkflowDraftState()),
          ...cloneWorkflowSnapshot(enabled57),
        },
      }),
      run3());
  }
  function resetWorkflowDraft(options5 = {}) {
    (run23(),
      (args6['workflowUi'] = {
        ...args6['workflowUi'],
        draft: { ...createInitialWorkflowDraftState(), ...cloneWorkflowSnapshot(options5) },
        tagDraft: '',
        updateConfirmOpen: ![],
        error: null,
      }),
      run3());
  }
  function openWorkflowModal({ tab: tab = 'create', sourceGroupId: sourceGroupId = null } = {}) {
    (run23(),
      (args6['workflowUi'] = {
        ...args6['workflowUi'],
        modalOpen: !![],
        modalTab: tab === 'update' ? 'update' : 'create',
        sourceGroupId: sourceGroupId == null ? null : String(sourceGroupId || '')['trim']() || null,
        draft: createInitialWorkflowDraftState(),
        tagDraft: '',
        updateTargetId: null,
        updateSearchKeyword: '',
        updateConfirmOpen: ![],
        saving: ![],
        error: null,
      }),
      run3());
  }
  function closeWorkflowModal() {
    (run23(),
      (args6['workflowUi'] = {
        ...args6['workflowUi'],
        modalOpen: ![],
        modalTab: 'create',
        sourceGroupId: null,
        draft: createInitialWorkflowDraftState(),
        tagDraft: '',
        updateTargetId: null,
        updateSearchKeyword: '',
        updateConfirmOpen: ![],
        saving: ![],
        error: null,
      }),
      run3());
  }
  function setWorkflowSaving(saving) {
    setWorkflowUi({ saving: saving === !![] });
  }
  function setWorkflowApplying(value258) {
    const applyingWorkflowId = value258 == null ? null : String(value258);
    setWorkflowUi({ applyingWorkflowId: applyingWorkflowId || null });
  }
  return {
    subscribe: subscribe,
    subscribeRaw: subscribeRaw,
    subscribeSelector: subscribeSelector,
    subscribeNodeField: subscribeNodeField['subscribe'],
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
    setViewportScreenOrigin: setViewportScreenOrigin,
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
    setShowSelectionMediaProperties: setShowSelectionMediaProperties,
    setTitleFollowsCanvasZoom: setTitleFollowsCanvasZoom,
    setPromptBoxResizeEnabled: setPromptBoxResizeEnabled,
    setPromptEnterBehavior: setPromptEnterBehavior,
    setPromptAttachmentButtonHidden: setPromptAttachmentButtonHidden,
    setPromptPresetButtonHidden: setPromptPresetButtonHidden,
    setVideoAudioDefaultEnabled: setVideoAudioDefaultEnabled,
    setCanvasToolbarPlacement: setCanvasToolbarPlacement,
    setNodeManagerPlacement: setNodeManagerPlacement,
    setLeftSidebarAutoHideEnabled: setLeftSidebarAutoHideEnabled,
    setBottomLeftBarAutoHideEnabled: setBottomLeftBarAutoHideEnabled,
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
    setConnectionLineStyle: setConnectionLineStyle,
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
    serializeNode: serializeNode,
    hydrate: hydrate,
    hydrateTrustedSnapshot: hydrateTrustedSnapshot,
  };
}
const legacyKernelStore = createStore();
export default legacyKernelStore;
export { createStore, createStore as createLegacyKernelStore };
