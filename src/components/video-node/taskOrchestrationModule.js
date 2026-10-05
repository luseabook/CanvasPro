import { normalizeRunningHubInstanceType } from '../../modules/runningHubInstanceTypes.js';
import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  ensureDreaminaStyleVideoModelForTask,
  getDreaminaStyleVideoDefaultModel,
  getDreaminaStyleVideoModelVersion,
  isDreaminaStyleVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaStyleVideoDuration,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from '../../modules/dreaminaVideoModelHelper.js';
import {
  getPromptAssetInputRefsFromNode,
  createPromptMediaReferenceState,
  insertPresetPromptIntoEditor,
  isRunningHubWorkflowNode,
  previewPresetPromptInEditor,
  resolvePresetPromptTextWithTextRefs,
  shouldUsePromptPreviewForPreset,
} from '../../modules/nodePromptShared.js';
import {
  isPreviewModeEnabled,
  isPreviewNodeLoading,
  startPreviewNodeLoading,
} from '../../modules/previewMode.js';
import { evaluateGenerationPromptBoundary } from '../../modules/generationPromptPolicy.js';
import {
  createPreviewGenerateButtonCallbacks,
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from '../../modules/previewGenerateButtonUi.js';
import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
import { logDiagnosticEvent } from '../../services/diagnosticsService.js';
import {
  createPayloadObjectUrlLease,
  releasePayloadObjectUrlLease,
} from '../../services/payloadObjectUrlLease.js';
import { buildGenerationStartPatch } from '../../core/generationTaskLifecycle.js';
import {
  cancelTask,
  getActiveGenerationTask,
  resumeTask,
  submitTask,
} from '../../core/generationTaskRuntime.js';
import {
  createGenerationCancelPlanFromNode,
  createGenerationResumePlanFromNode,
  createGenerationSubmitPlan,
} from '../../core/generationExecutionPlan.js';
import { getGenerationErrorMessage, isGenerationAbortError } from '../../core/generationTaskErrorState.js';
import { showRunningHubMediaUploadGuideForError } from '../../modules/runningHubMediaUploadGuide.js';
import {
  showProviderApiKeyMissingToast,
  showProviderApiKeyMissingToastForError,
} from '../../modules/providerApiKeyMissingToast.js';
import { guardModelGenerationCredentials } from '../../modules/modelCredentialUi.js';
import {
  buildAsyncTaskPatch,
  buildDreaminaTaskPatch,
  buildRunningHubTaskPatch,
} from '../../core/generationTaskProtocolState.js';
import { shouldAllowCancel, shouldShowGenerationBusyUi } from '../../core/generationTaskUiState.js';
import { createGenerationTaskRecoveryOwner } from '../../core/generationTaskRecoveryOwner.js';
import { GENERATION_HISTORY_EVENT } from '../../modules/generationHistoryAssets.js';
import { GENERATION_TASK_CENTER_EVENT } from '../../modules/generationTaskCenterEvents.js';
import { localPathToUrl, normalizeLocalPath } from '../../utils/localMediaPath.js';
import { resolveVideoWorkflowSchemaParam } from './runningHubVideoUiSchema.js';
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
  normalizeVideoGenerationResult,
} from './videoGenerationResultRenderer.js';
import {
  buildRunningHubVideoWorkflowSubmitPatch,
  getDefaultRunningHubVideoWorkflowModelId,
  shouldScopeRunningHubVideoSubmitEdges,
} from './runningHubVideoSubmitPayload.js';
import { isModelApiModel, resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
import { buildRhAiAppResultDisplayPatch } from '../shared/rhAiAppNodeBehavior.js';
import { getVideoSourceKey, resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { validateModelMediaInputLimits } from '../../modules/modelMediaInputLimits.js';
import { t } from '../../i18n/index.js';
import {
  getRunningHubTaskProviderProfileId,
  normalizeRunningHubModelApiProfileId,
} from '../../modules/runningHubProviderProfiles.js';
import { resolveModelGenerationProviderProfileId } from '../../modules/modelProviderProfileSelection.js';
import {
  buildSubmitRandomizedSeedPatch,
  compileModelApiVideoSubmit,
  validateModelApiVideoPrompt,
} from './modelApiVideoSubmitCompiler.js';
import { resolveVideoSubmitInputMaterials } from './videoSubmitInputMaterials.js';
import {
  applySegmentRetakeSubmitParameterPolicy,
  applySegmentRetakeTaskPayload,
  clearSegmentRetakeSessionOnSuccess,
  createSegmentRetakeGenerationLifecycle,
} from '../../modules/videoRetake/segmentRetakeGenerationLifecycle.js';
import { applyVideoNodeAdaptiveAspectRatio } from './videoNodeAdaptiveAspectRatio.js';
import {
  getRhAiAppVideoResultMediaKey,
  hasObviouslyInvalidAsyncVideoResult,
  isRhAiAppVideoNodeData,
} from './videoResultNodeData.js';
const DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS = 9000;
function videoTaskText(value, item = {}) {
  return t('videoTask.' + value, item);
}
function getModelMediaInputLimitMessage(max = {}) {
  const enabled = String(max?.['code'] || '')['trim']();
  if (!enabled) return '';
  return videoTaskText('validation.mediaInputLimits.' + enabled, {
    max: max['max'],
    actual: max['actual'],
  });
}
function getVideoGenerateTitle() {
  return videoTaskText('controls.generateTitle');
}
function getVideoCancelTooltip() {
  return videoTaskText('controls.cancelTooltip');
}
const DREAMINA_STALE_ACTIVE_RESUME_MS = 15 * 1000,
  DREAMINA_COLD_RECOVERY_STALE_AFTER_MS = 24 * 60 * 60 * 1000,
  CANCELLED_TASK_STATUSES = new Set(['cancelled', 'canceled']),
  DREAMINA_NON_RECOVERABLE_STATUSES = new Set([
    'cancelled',
    'canceled',
    'complete',
    'completed',
    'done',
    'error',
    'fail',
    'failed',
    'finish',
    'finished',
    'idle',
    'success',
    'succeeded',
  ]),
  DREAMINA_NON_RECOVERABLE_PHASES = new Set([
    'cancelled',
    'canceled',
    'complete',
    'completed',
    'done',
    'error',
    'fail',
    'failed',
    'finish',
    'finished',
    'success',
    'succeeded',
  ]),
  dreaminaBackgroundQueueToastKeys = new Set(),
  LOCAL_ASYNC_TASK_TIMEOUT_MESSAGES = new Set([
    '任务处理超时，请稍后查询结果',
    'Task processing timed out. Please query the result later.',
  ]);
function normalizeTaskStatus(key) {
  return String(key || '')
    ['trim']()
    ['toLowerCase']();
}
function isRecoverableInterruptedDreaminaStyleTask(options = {}) {
  const index = String(options?.['model'] || '')['trim'](),
    providerHint = String(options?.['provider'] || '')['trim'](),
    modelExecution =
      resolveModelExecution(index, { providerHint: providerHint }) || resolveModelExecution(index);
  if (
    modelExecution?.['modelManifest']?.['extensions']?.['dreaminaStyleVideo'] == null ||
    modelExecution?.['modelManifest']?.['cancellable'] !== false
  )
    return false;
  return [options?.['jobStatus'], options?.['dreaminaTaskPhase'], options?.['dreaminaTaskStatus']]
    ['map'](normalizeTaskStatus)
    ['every']((result) => CANCELLED_TASK_STATUSES['has'](result));
}
function isRecoverableCustomProviderLocalTimeout(options2 = {}) {
  const data = String(options2?.['asyncTaskProvider'] || options2?.['provider'] || '')['trim']();
  if (!/^custom_[a-z0-9_-]+$/i['test'](data)) return false;
  const args = Array['isArray'](options2?.['videos'])
    ? options2['videos']['map']((target) => String(target?.['error'] || '')['trim']())
    : [];
  return [String(options2?.['jobError'] || '')['trim'](), ...args]['some']((source) =>
    LOCAL_ASYNC_TASK_TIMEOUT_MESSAGES['has'](source),
  );
}
function mapDreaminaSnapshotToTaskCenterStatus(response = {}) {
  const next = String(response?.['phase'] || '')
      ['trim']()
      ['toLowerCase'](),
    current = String(response?.['status'] || '')
      ['trim']()
      ['toLowerCase']();
  if (next === 'done' || current === 'success') return 'complete';
  if (next === 'cancelled' || current === 'cancelled' || current === 'canceled') return 'cancelled';
  if (next === 'failed' || current === 'failed') return 'failed';
  if (next === 'queued' || next === 'pending') return 'waiting';
  return 'processing';
}
function buildDreaminaTaskCenterMessage(options3 = {}) {
  const entry = String(options3?.['label'] || '')['trim'](),
    count = Number(options3?.['queueIndex']),
    count2 = Number(options3?.['queueLength']);
  if (Number['isFinite'](count) && count >= 0 && Number['isFinite'](count2) && count2 > 0)
    return (
      (entry || videoTaskText('task.queueing')) +
      ' ' +
      (Math['trunc'](count) + 1) +
      '/' +
      Math['trunc'](count2)
    );
  return entry || '';
}
function isDreaminaUploadDurationErrorMessage(record) {
  const payload = String(record || '')['trim']();
  return payload['startsWith']('上传源视频失败：') || payload['startsWith']('上传源音频失败：');
}
function getPlainObject(handle) {
  return handle && typeof handle === 'object' && !Array['isArray'](handle) ? handle : {};
}
export function createVideoNodeTaskOrchestrationModule(state) {
  const {
      store: store,
      api: api,
      getImage: getImage,
      startLoading: startLoading,
      stopLoading: stopLoading,
      checkLocalMediaExists: checkLocalMediaExists = async () => true,
      ensureConfig: ensureConfig,
      getProviderConfig: getProviderConfig,
      isVideoVipModel: isVideoVipModel,
      ensureVipSessionRecheck: ensureVipSessionRecheck,
    } = state,
    config = 'DREAMINA_POLL_TIMEOUT',
    maxWaitMs = 20 * 60 * 1000,
    intervalMs = 20 * 1000,
    scope = 24 * 60 * 60 * 1000,
    handler = () =>
      typeof store['getStateRaw'] === 'function' ? store['getStateRaw']() : store['getState'](),
    handler2 = (input, output) =>
      input?.['getTaskNode']?.() || store['getState']()['nodes']?.[output] || {},
    handler3 = (value2, value3, value4) => {
      if (typeof value2?.['updateTaskNode'] === 'function') return value2['updateTaskNode'](value4);
      return (store['updateNodeData'](value3, value4), true);
    };
  class value5 {
    ['_getGenerationTaskRecoveryOwner']() {
      return (
        !this['_generationTaskRecoveryOwner'] &&
          ((this['_generationTaskRecoveryOwner'] = createGenerationTaskRecoveryOwner({
            readTaskNode: () => handler()['nodes']?.[this['nodeId']] || this['_data'] || {},
            updateTaskNode: (value6) => store['updateNodeData'](this['nodeId'], value6),
            persist: (value7) => {
              if (value7 === 'dreamina') return this['_persistDreaminaResumeCache']();
              if (value7 === 'asyncModelApi') return this['_persistAsyncResumeCache']();
              return this['_persistRunningHubResumeCache']();
            },
          })),
          this['_generationTaskRecoveryOwner']['bindLegacyState'](this)),
        this['_generationTaskRecoveryOwner']
      );
    }
    async ['_preflightConnectedLocalVideoInputs'](value8 = null) {
      if (typeof checkLocalMediaExists !== 'function') return true;
      const value9 = handler(),
        value10 = value9?.['nodes'] || {},
        value11 =
          typeof store['getIncomingEdges'] === 'function'
            ? store['getIncomingEdges'](this['nodeId'])
            : [],
        map = new Set(),
        handler4 = async (value12) => {
          if (map['has'](value12)) return true;
          map['add'](value12);
          try {
            return (await checkLocalMediaExists(value12)) === true;
          } catch {
            return false;
          }
        },
        handler5 = (path) => {
          window['showToast']?.(videoTaskText('validation.localVideoMissing', { path: path }), 'error');
        };
      for (const value13 of value11) {
        const value14 = String(value13?.['sourceId'] || '')['trim'](),
          enabled2 = value10[value14];
        if (!enabled2 || resolveEffectiveInputKind(enabled2, value13) !== 'video') continue;
        let value15 = enabled2,
          count3 = -1;
        const list = Array['isArray'](enabled2['videos']) ? enabled2['videos'] : [];
        if (String(enabled2['type'] || '') === 'ai-video' && list['length'] > 0) {
          const value16 = String(value13?.['sourceMediaKey'] || '')['trim']();
          value16 &&
            (count3 = list['findIndex']((value17) => getVideoSourceKey(value17) === value16));
          if (count3 < 0) {
            const value18 = Number(enabled2['mainVideoIndex']);
            count3 = Number['isFinite'](value18)
              ? Math['max'](0, Math['min'](list['length'] - 1, Math['trunc'](value18)))
              : 0;
          }
          value15 = list[count3] || enabled2;
        }
        const mediaUnavailableSource = getVideoSourceKey(value15) || getVideoSourceKey(enabled2),
          localPath = normalizeLocalPath(mediaUnavailableSource);
        if (!localPath) continue;
        if (await handler4(localPath)) continue;
        const value19 = handler()?.['nodes']?.[value14] || enabled2;
        if (count3 >= 0 && Array['isArray'](value19['videos'])) {
          const videos = value19['videos']['map']((args2, value20) =>
            value20 === count3
              ? { ...args2, mediaUnavailable: true, mediaUnavailableSource: mediaUnavailableSource }
              : args2,
          );
          store['updateNodeData'](value14, { videos: videos });
        } else
          store['updateNodeData'](value14, {
            mediaUnavailable: true,
            mediaUnavailableSource: mediaUnavailableSource,
          });
        return (handler5(localPath), false);
      }
      const value21 = [
        ...(Array['isArray'](value8?.['videos']) ? value8['videos'] : []),
        value8?.['video'],
        value8?.['videoUrl'],
        value8?.['sourceVideo'],
      ];
      for (const value22 of value21) {
        const localPath2 = normalizeLocalPath(value22);
        if (!localPath2 || (await handler4(localPath2))) continue;
        return (handler5(localPath2), false);
      }
      return true;
    }
    ['_isDreaminaPollTimeoutError'](error) {
      const value23 = String(error?.['code'] || '')
        ['trim']()
        ['toUpperCase']();
      if (value23 === config || value23 === 'TIMEOUT') return true;
      const value24 = String(error?.['type'] || '')
        ['trim']()
        ['toUpperCase']();
      if (value24 === 'TIMEOUT' || value24 === 'TASK_TIMEOUT') return true;
      const list2 = String(error?.['message'] || '')
        ['trim']()
        ['toLowerCase']();
      return list2['includes']('timeout') || list2['includes']('超时');
    }
    ['_buildDreaminaBackgroundPendingSnapshot'](submitId2 = '') {
      return this['_buildDreaminaPendingSnapshot']({
        submitId: submitId2,
        phase: 'generating',
        label: videoTaskText('task.backgroundQueueing'),
      });
    }
    ['_showDreaminaBackgroundQueueingToast'](value25 = '') {
      const value26 =
        String(value25 || '')['trim']() ||
        String(store['getState']()['nodes']?.[this['nodeId']]?.['dreaminaSubmitId'] || '')['trim']() ||
        String(this['nodeId'] || '')['trim']();
      if (value26 && dreaminaBackgroundQueueToastKeys['has'](value26)) return;
      if (value26) dreaminaBackgroundQueueToastKeys['add'](value26);
      window['showToast']?.(videoTaskText('toasts.dreaminaBackgroundQueueing'), 'warning');
    }
    ['_hasResolvedVideoResult'](value27 = this['_data']) {
      const list3 = Array['isArray'](value27?.['videos']) ? value27['videos'] : [];
      if (list3['length'] > 0) return true;
      return (
        !!String(value27?.['videoUrl'] || '')['trim']() ||
        !!String(value27?.['localPath'] || '')['trim']()
      );
    }
    ['_persistDreaminaResumeCache']() {
      try {
        window['_triggerLocalCacheSave']?.();
      } catch {}
    }
    ['_persistRunningHubResumeCache']() {
      try {
        window['_triggerLocalCacheSave']?.();
      } catch {}
    }
    ['_persistAsyncResumeCache']() {
      this['_persistRunningHubResumeCache']();
    }
    ['_resolveDreaminaResumeSubmitId'](options4 = {}) {
      const value28 =
          options4?.['dreaminaTaskLastRaw'] &&
          typeof options4['dreaminaTaskLastRaw'] === 'object' &&
          !Array['isArray'](options4['dreaminaTaskLastRaw'])
            ? options4['dreaminaTaskLastRaw']
            : {},
        value29 = String(value28['remoteSubmitId'] || value28['remote_submit_id'] || '')['trim']();
      if (value29) return value29;
      return String(options4?.['dreaminaSubmitId'] || '')['trim']();
    }
    ['_isDreaminaRecoverableRunningTask'](value30 = this['_data']) {
      if (!this['_isDreaminaVideoNode'](value30)) return false;
      const enabled3 = String(value30?.['dreaminaSubmitId'] || '')['trim']();
      if (!enabled3) return false;
      const taskStatus = normalizeTaskStatus(value30?.['jobStatus']),
        taskStatus2 = normalizeTaskStatus(value30?.['dreaminaTaskPhase']),
        taskStatus3 = normalizeTaskStatus(value30?.['dreaminaTaskStatus']);
      if (!isRecoverableInterruptedDreaminaStyleTask(value30)) {
        if (DREAMINA_NON_RECOVERABLE_STATUSES['has'](taskStatus)) return false;
        if (DREAMINA_NON_RECOVERABLE_PHASES['has'](taskStatus2)) return false;
        if (DREAMINA_NON_RECOVERABLE_STATUSES['has'](taskStatus3)) return false;
      }
      return true;
    }
    ['_isStaleActiveDreaminaTask'](value31 = this['_data']) {
      if (!this['_isGenerating']) return false;
      if (value31?.['dreaminaTaskRecovering'] === true) return false;
      if (this['_dreaminaResumePromise']) return false;
      const count4 = Number(
        value31?.['dreaminaTaskLastCheckedAt'] ||
          value31?.['dreaminaTaskStartedAt'] ||
          value31?.['generationStartTime'] ||
          0,
      );
      if (!Number['isFinite'](count4) || count4 <= 0) return false;
      return Date['now']() - count4 >= DREAMINA_STALE_ACTIVE_RESUME_MS;
    }
    ['_shouldProbeStaleDreaminaRecovery'](value32 = this['_data']) {
      if (!this['_isDreaminaRecoverableRunningTask'](value32)) return false;
      if (getActiveGenerationTask(this['nodeId'])) return false;
      const count5 = Number(
        value32?.['dreaminaTaskLastCheckedAt'] ||
          value32?.['dreaminaTaskStartedAt'] ||
          value32?.['generationStartTime'] ||
          0,
      );
      if (!Number['isFinite'](count5) || count5 <= 0) return false;
      return Date['now']() - count5 >= DREAMINA_COLD_RECOVERY_STALE_AFTER_MS;
    }
    ['_isUncertainStaleDreaminaRecoveryError'](value33) {
      const response2 = value33?.['dreaminaSnapshot'],
        taskStatus4 = normalizeTaskStatus(response2?.['phase']),
        taskStatus5 = normalizeTaskStatus(response2?.['status']);
      return taskStatus4 !== 'failed' && taskStatus5 !== 'failed';
    }
    ['_shouldKeepDreaminaLoading'](
      value34 = store['getState']()['nodes']?.[this['nodeId']] || this['_data'] || {},
    ) {
      if (!this['_isDreaminaVideoNode'](value34)) return false;
      const taskStatus6 = normalizeTaskStatus(value34?.['jobStatus']),
        taskStatus7 = normalizeTaskStatus(value34?.['dreaminaTaskPhase']),
        taskStatus8 = normalizeTaskStatus(value34?.['dreaminaTaskStatus']);
      if (!isRecoverableInterruptedDreaminaStyleTask(value34)) {
        if (DREAMINA_NON_RECOVERABLE_STATUSES['has'](taskStatus6)) return false;
        if (DREAMINA_NON_RECOVERABLE_PHASES['has'](taskStatus7)) return false;
        if (DREAMINA_NON_RECOVERABLE_STATUSES['has'](taskStatus8)) return false;
      }
      if (value34?.['isGenerating'] === true) return true;
      if (
        String(value34?.['jobStatus'] || '')
          ['trim']()
          ['toLowerCase']() === 'running'
      )
        return true;
      if (value34?.['dreaminaTaskRecovering'] === true) return true;
      if (this['_dreaminaResumePromise']) return true;
      return this['_isDreaminaRecoverableRunningTask'](value34);
    }
    ['_inferAsyncProviderFromModel'](value35, value36 = '') {
      const modelProvider = resolveModelProvider(value35, '', { allowProviderHint: false });
      if (modelProvider) return modelProvider;
      const value37 = String(value36 || '')
        ['trim']()
        ['toLowerCase']();
      if (value37) return value37;
      const list4 = String(value35 || '')['trim']();
      if (list4 && !list4['includes']('/')) return 'grsai';
      return '';
    }
    ['_isRunningHubRecoverableRunningTask'](value38 = this['_data']) {
      if (!this['_isRunninghubWorkflowModel'](value38?.['model'], value38?.['provider'])) return false;
      const enabled4 = String(value38?.['rhTaskId'] || '')['trim']();
      if (!enabled4) return false;
      const value39 = String(value38?.['rhTaskStatus'] || '')
        ['trim']()
        ['toLowerCase']();
      if (
        value39 === 'success' ||
        value39 === 'failed' ||
        value39 === 'idle' ||
        value39 === 'cancelled'
      )
        return false;
      return true;
    }
    ['_isAsyncRecoverableRunningTask'](value40 = this['_data']) {
      const enabled5 = String(value40?.['asyncTaskId'] || '')['trim']();
      if (!enabled5) return false;
      const enabled6 = this['_inferAsyncProviderFromModel'](
        value40?.['model'],
        value40?.['asyncTaskProvider'] || value40?.['provider'] || '',
      );
      if (
        !enabled6 ||
        enabled6 === 'runninghubwf' ||
        enabled6 === 'runninghub' ||
        enabled6 === 'dreamina'
      )
        return false;
      const value41 = String(value40?.['asyncTaskKind'] || '')
        ['trim']()
        ['toLowerCase']();
      if (value41 && value41 !== 'video') return false;
      const value42 = String(value40?.['asyncTaskStatus'] || '')
          ['trim']()
          ['toLowerCase'](),
        enabled7 = value42 === 'failed' && isRecoverableCustomProviderLocalTimeout(value40);
      if (
        (value42 === 'success' && !hasObviouslyInvalidAsyncVideoResult(value40)) ||
        (value42 === 'failed' && !enabled7) ||
        value42 === 'idle' ||
        value42 === 'cancelled'
      )
        return false;
      return true;
    }
    ['_buildRunningHubTaskPatch']({
      taskId: taskId = '',
      status: status = 'pending',
      startedAt: startedAt = 0,
      recovering: recovering = false,
      useOpenapiQuery: useOpenapiQuery = false,
    } = {}) {
      return buildRunningHubTaskPatch({
        taskId: taskId,
        status: status,
        startedAt: startedAt,
        recovering: recovering,
        useOpenapiQuery: useOpenapiQuery,
      });
    }
    ['_buildAsyncTaskPatch']({
      provider: provider = '',
      kind: kind = 'video',
      taskId: taskId = '',
      status: status = 'pending',
      startedAt: startedAt = 0,
      recovering: recovering = false,
    } = {}) {
      return buildAsyncTaskPatch({
        provider: provider,
        kind: kind,
        taskId: taskId,
        status: status,
        startedAt: startedAt,
        recovering: recovering,
      });
    }
    async ['_buildResumePayload'](value43 = this['_data'], value44 = {}) {
      const value45 = value43 || {},
        model = String(value45?.['model'] || '')['trim'](),
        provider2 = this['_inferAsyncProviderFromModel'](
          model,
          value44?.['providerHint'] || value45?.['asyncTaskProvider'] || value45?.['provider'] || '',
        );
      if (!model || !provider2)
        throw new Error(videoTaskText('errors.missingAsyncResumeModelOrProvider'));
      const runningHubTaskProviderProfileId = getRunningHubTaskProviderProfileId(value45),
        providerProfileId = resolveModelGenerationProviderProfileId(model, provider2, runningHubTaskProviderProfileId);
      await ensureConfig();
      const value46 = getProviderConfig(providerProfileId || provider2) || {},
        apiKey = String(
          provider2 === 'runninghub'
            ? value46['modelApiKey'] || value46['apiKey'] || ''
            : value46['apiKey'] || window['_appApiKey'] || '',
        )['trim']();
      return {
        nodeId: this['nodeId'],
        model: model,
        provider: provider2,
        ...(providerProfileId ? { providerProfileId: providerProfileId, rhProviderProfileId: providerProfileId } : {}),
        apiKey: apiKey,
      };
    }
    ['_syncLocalTaskNodeData']() {
      const value47 = store['getState']()['nodes']?.[this['nodeId']];
      if (value47) this['_data'] = value47;
      return this['_data'] || {};
    }
    ['_emitDreaminaTaskCenterUpdate'](options5 = {}, result2 = {}) {
      const taskId2 = String(
          options5?.['submitId'] ||
            result2['taskId'] ||
            store['getState']()['nodes']?.[this['nodeId']]?.['dreaminaSubmitId'] ||
            '',
        )['trim'](),
        value48 = globalThis['window'];
      if (!taskId2 || typeof value48?.['dispatchEvent'] !== 'function') return;
      const status2 = String(result2['status'] || mapDreaminaSnapshotToTaskCenterStatus(options5))[
          'trim'
        ](),
        finishedAt = status2 === 'complete' || status2 === 'failed' || status2 === 'cancelled';
      value48['dispatchEvent'](
        new CustomEvent(GENERATION_TASK_CENTER_EVENT, {
          detail: {
            taskId: taskId2,
            nodeId: this['nodeId'],
            kind: 'dreaminaVideo',
            status: status2,
            progress: status2 === 'complete' ? 1 : status2 === 'waiting' ? 0 : 0.45,
            message: String(result2['message'] || buildDreaminaTaskCenterMessage(options5))['trim'](),
            error:
              status2 === 'failed'
                ? String(result2['error'] || options5?.['failReason'] || options5?.['label'] || '')[
                    'trim'
                  ]()
                : '',
            result:
              result2['result'] && typeof result2['result'] === 'object' ? result2['result'] : null,
            cancellable: true,
            createdAt: Number(
              result2['createdAt'] ||
                store['getState']()['nodes']?.[this['nodeId']]?.['dreaminaTaskStartedAt'] ||
                Date['now'](),
            ),
            startedAt: Number(
              result2['startedAt'] ||
                store['getState']()['nodes']?.[this['nodeId']]?.['dreaminaTaskStartedAt'] ||
                0,
            ),
            finishedAt: finishedAt ? Date['now']() : 0,
          },
        }),
      );
    }
    ['_buildDreaminaTaskPatch'](submitId3, recovering2 = {}) {
      const dreaminaTaskPatch = buildDreaminaTaskPatch({
        submitId: submitId3?.['submitId'] || '',
        status: submitId3?.['status'] || 'pending',
        phase: submitId3?.['phase'] || 'generating',
        label: submitId3?.['label'] || '',
        lastCheckedAt: submitId3?.['lastCheckedAt'] || Date['now'](),
        recovering: recovering2['recovering'] === true,
        raw: submitId3?.['raw'] || {},
        defaultLabel: videoTaskText('task.generating'),
      });
      return (
        recovering2['startedAt'] != null &&
          (dreaminaTaskPatch['dreaminaTaskStartedAt'] = Number(recovering2['startedAt'] || 0)),
        dreaminaTaskPatch
      );
    }
    ['_applyDreaminaTaskSnapshot'](value49, recovering3 = {}) {
      const value50 = store['getState']()['nodes']?.[this['nodeId']] || this['_data'] || {},
        startedAt2 = this['_buildDreaminaTaskPatch'](value49, {
          recovering: recovering3['recovering'] === true,
          startedAt:
            recovering3['startedAt'] != null ? recovering3['startedAt'] : value50?.['dreaminaTaskStartedAt'],
        });
      return (
        store['updateNodeData'](this['nodeId'], startedAt2),
        this['_syncLocalTaskNodeData'](),
        this['_persistDreaminaResumeCache'](),
        this['_emitDreaminaTaskCenterUpdate'](value49, { startedAt: startedAt2['dreaminaTaskStartedAt'] }),
        startedAt2
      );
    }
    ['_stopDreaminaRecovery'](resetRecovering = false) {
      (this['_getGenerationTaskRecoveryOwner']()['stop']('dreamina', { resetRecovering: resetRecovering }),
        (this['_dreaminaActiveSubmitId'] = ''));
    }
    ['_stopRunningHubRecovery'](resetRecovering2 = false) {
      this['_getGenerationTaskRecoveryOwner']()['stop']('workflow', { resetRecovering: resetRecovering2 });
    }
    ['_stopAsyncRecovery'](resetRecovering3 = false) {
      this['_getGenerationTaskRecoveryOwner']()['stop']('asyncModelApi', { resetRecovering: resetRecovering3 });
    }
    ['_buildDreaminaPendingSnapshot']({
      submitId: submitId = '',
      phase: phase = 'generating',
      label: label = videoTaskText('task.generating'),
      raw: raw = {},
    } = {}) {
      return {
        submitId: String(submitId || '')['trim'](),
        status: 'pending',
        phase: phase,
        label: label,
        queueStatus: '',
        queueIndex: null,
        queueLength: null,
        outputs: [],
        failReason: '',
        raw: raw && typeof raw === 'object' && !Array['isArray'](raw) ? raw : {},
        isTerminal: false,
        hasOutputs: false,
        lastCheckedAt: Date['now'](),
      };
    }
    ['_buildDreaminaFailedSnapshot'](value51, value52, raw2 = {}) {
      return {
        submitId: String(value51 || '')['trim'](),
        status: 'failed',
        phase: 'failed',
        label: String(value52 || '')['trim']() || videoTaskText('task.queryFailed'),
        queueStatus: '',
        queueIndex: null,
        queueLength: null,
        outputs: [],
        failReason: String(value52 || '')['trim'](),
        raw: raw2 && typeof raw2 === 'object' && !Array['isArray'](raw2) ? raw2 : {},
        isTerminal: true,
        hasOutputs: false,
        lastCheckedAt: Date['now'](),
      };
    }
    ['_applyDreaminaSuccessResult'](
      value53,
      startedAt3,
      value54 = null,
      { writeStore: writeStore = true, returnPatch: returnPatch = false } = {},
    ) {
      const normalizedResult = normalizeVideoGenerationResult(value53),
        result3 = normalizedResult['items'],
        value55 = this['_isDreaminaVideoNode'](
          store['getState']()['nodes']?.[this['nodeId']] || this['_data'] || {},
        ),
        dreaminaSubmitId =
          String(value54?.['submitId'] || '')['trim']() ||
          String(store['getState']()['nodes']?.[this['nodeId']]?.['dreaminaSubmitId'] || '')['trim'](),
        args3 = value55
          ? value54
            ? this['_buildDreaminaTaskPatch'](value54, { recovering: false, startedAt: startedAt3 })
            : {
                isGenerating: false,
                jobStatus: 'success',
                dreaminaSubmitId: dreaminaSubmitId,
                dreaminaTaskStatus: 'success',
                dreaminaTaskPhase: 'done',
                dreaminaTaskLabel: videoTaskText('task.completed'),
                dreaminaTaskStartedAt: startedAt3,
                dreaminaTaskLastCheckedAt: Date['now'](),
                dreaminaTaskLastRaw: {},
                dreaminaTaskRecovering: false,
              }
          : {},
        args4 = buildVideoGenerationResultPatch(normalizedResult, { startedAt: startedAt3 });
      clearSegmentRetakeSessionOnSuccess(
        store['getState']()['nodes']?.[this['nodeId']] || this['_data'],
        args4,
      );
      const patch = args4 ? { ...args4, ...args3 } : null;
      args4 &&
        (writeStore &&
          (store['updateNodeData'](this['nodeId'], patch), this['_persistDreaminaResumeCache']()),
        value55 &&
          this['_emitDreaminaTaskCenterUpdate'](
            value54 || {
              submitId: dreaminaSubmitId,
              status: 'success',
              phase: 'done',
              label: videoTaskText('task.completed'),
            },
            { status: 'complete', startedAt: startedAt3, result: result3[0] || normalizedResult },
          ));
      if (returnPatch) return { videos: result3, patch: patch || {}, normalizedResult: normalizedResult };
      return result3;
    }
    ['_scheduleDreaminaResultEnrichment'](list5) {
      if (!(Array['isArray'](list5) && list5['length'] > 0)) return;
      {
        const nodeId = this['nodeId'],
          value56 = ++this['_resultThumbToken'];
        (async () => {
          for (let value57 = 0; value57 < list5['length']; value57++) {
            if (value56 !== this['_resultThumbToken']) return;
            const enabled8 = store['getState']()['nodes']?.[nodeId];
            if (!enabled8) return;
            const value58 = Array['isArray'](enabled8['videos']) ? enabled8['videos'] : [],
              enabled9 = value58[value57];
            if (!enabled9 || typeof enabled9 !== 'object') continue;
            const value59 = !!String(enabled9['thumbUrl'] || '')['trim']();
            if (value59) {
              const value60 = Number(enabled8['mainVideoIndex']),
                value61 = Number['isFinite'](value60) ? Math['max'](0, Math['trunc'](value60)) : 0;
              value57 === value61 &&
                !String(enabled8['thumbUrl'] || '')['trim']() &&
                store['updateNodeData'](nodeId, { thumbUrl: String(enabled9['thumbUrl'])['trim']() });
              continue;
            }
            const enabled10 = this['_resolveVideoMetaSrcFromVideoData'](enabled9);
            if (!enabled10) continue;
            if (!(enabled10['startsWith']('/output/') || enabled10['startsWith']('/data/'))) continue;
            const value62 = 'gen|' + nodeId + '|' + value57 + '|' + enabled10;
            if (this['_videoThumbPending']['has'](value62)) continue;
            this['_videoThumbPending']['add'](value62);
            let response3 = null;
            try {
              response3 = await api['fetchVideoFirstFrameThumbFromServer'](enabled10, {
                nodeId: nodeId,
                assetId: String(enabled9['assetId'] || enabled9['thumbId'] || ''),
              });
            } catch {
              response3 = null;
            } finally {
              this['_videoThumbPending']['delete'](value62);
            }
            if (value56 !== this['_resultThumbToken']) return;
            const enabled11 = String(response3?.['thumbUrl'] || response3?.['url'] || '')['trim']();
            if (!enabled11) continue;
            const enabled12 = store['getState']()['nodes']?.[nodeId];
            if (!enabled12) return;
            const list6 = Array['isArray'](enabled12['videos']) ? enabled12['videos'] : [],
              args5 = list6[value57];
            if (!args5 || typeof args5 !== 'object') continue;
            const value63 = { ...args5 };
            if (!String(value63['thumbUrl'] || '')['trim']() && enabled11)
              value63['thumbUrl'] = enabled11;
            const videos2 = list6['slice']();
            videos2[value57] = value63;
            const value64 = { videos: videos2 },
              value65 = Number(enabled12['mainVideoIndex']),
              value66 = Number['isFinite'](value65) ? Math['max'](0, Math['trunc'](value65)) : 0;
            if (value57 === value66) {
              if (!String(enabled12['thumbUrl'] || '')['trim']() && enabled11)
                value64['thumbUrl'] = enabled11;
            }
            store['updateNodeData'](nodeId, value64);
          }
        })();
      }
      {
        const value67 = this['nodeId'],
          value68 = ++this['_resultMetaEnrichmentToken'];
        (async () => {
          for (let value69 = 0; value69 < list5['length']; value69++) {
            if (value68 !== this['_resultMetaEnrichmentToken']) return;
            const nodeData = store['getState']()['nodes']?.[value67];
            if (!nodeData) return;
            const value70 = Array['isArray'](nodeData['videos']) ? nodeData['videos'] : [],
              enabled13 = value70[value69];
            if (!enabled13 || typeof enabled13 !== 'object') continue;
            const mediaWidth = Number(enabled13['videoWidth'] || 0),
              mediaHeight = Number(enabled13['videoHeight'] || 0);
            if (mediaWidth > 0 && mediaHeight > 0) {
              const value71 = Number(nodeData['mainVideoIndex']),
                value72 = Number['isFinite'](value71) ? Math['max'](0, Math['trunc'](value71)) : 0;
              if (value69 === value72 && isRhAiAppVideoNodeData(nodeData)) {
                const rhAiAppResultDisplayPatch = buildRhAiAppResultDisplayPatch({
                  nodeData: nodeData,
                  mediaWidth: mediaWidth,
                  mediaHeight: mediaHeight,
                  mediaKey: getRhAiAppVideoResultMediaKey(enabled13, nodeData),
                });
                if (Object['keys'](rhAiAppResultDisplayPatch)['length'] > 0)
                  store['updateNodeData'](value67, rhAiAppResultDisplayPatch);
              }
              continue;
            }
            const enabled14 = this['_resolveVideoMetaSrcFromVideoData'](enabled13);
            if (!enabled14) continue;
            let box = null;
            try {
              box = await api['fetchVideoMetaFromServer'](enabled14);
            } catch {
              box = null;
            }
            if (value68 !== this['_resultMetaEnrichmentToken']) return;
            if (!box || box['success'] !== true) continue;
            const videoWidth = Math['round'](Number(box['width']) || 0),
              videoHeight = Math['round'](Number(box['height']) || 0),
              count6 = Number(box['duration']);
            if (!(videoWidth > 0 && videoHeight > 0)) continue;
            const nodeData2 = store['getState']()['nodes']?.[value67];
            if (!nodeData2) return;
            const list7 = Array['isArray'](nodeData2['videos']) ? nodeData2['videos'] : [],
              args6 = list7[value69];
            if (!args6 || typeof args6 !== 'object') continue;
            const count7 = Number(args6['videoWidth'] || 0),
              count8 = Number(args6['videoHeight'] || 0);
            if (count7 > 0 && count8 > 0) continue;
            const value73 = { ...args6, videoWidth: videoWidth, videoHeight: videoHeight };
            Number['isFinite'](count6) &&
              count6 > 0 &&
              !(Number(value73['duration']) > 0) &&
              (value73['duration'] = count6);
            const videos3 = list7['slice']();
            videos3[value69] = value73;
            const value74 = { videos: videos3 },
              value75 = Number(nodeData2['mainVideoIndex']),
              value76 = Number['isFinite'](value75) ? Math['max'](0, Math['trunc'](value75)) : 0;
            if (value69 === value76) {
              ((value74['videoWidth'] = videoWidth),
                (value74['videoHeight'] = videoHeight),
                (value74['selectedVideoWidth'] = videoWidth),
                (value74['selectedVideoHeight'] = videoHeight));
              if (Number['isFinite'](count6) && count6 > 0) value74['videoDuration'] = count6;
              isRhAiAppVideoNodeData(nodeData2) &&
                Object['assign'](
                  value74,
                  buildRhAiAppResultDisplayPatch({
                    nodeData: nodeData2,
                    mediaWidth: videoWidth,
                    mediaHeight: videoHeight,
                    mediaKey: getRhAiAppVideoResultMediaKey(args6, nodeData2),
                  }),
                );
            }
            store['updateNodeData'](value67, value74);
          }
        })();
      }
    }
    ['_finalizeVideoSuccessSideEffects'](list8, value77) {
      (this['_scheduleDreaminaResultEnrichment'](list8),
        this['_dispatchGenerationHistoryVideos'](list8, value77));
      const error2 = list8['find']((value78) => value78?.['saveError'])?.['saveError'];
      error2 &&
        window['showToast']?.(videoTaskText('toasts.localSaveFailed', { error: error2 }), 'warning');
    }
    ['_finalizeDreaminaSuccessResult'](value79, value80, value81 = null, writeStore2 = {}) {
      const value82 = this['_applyDreaminaSuccessResult'](value79, value80, value81, {
          writeStore: writeStore2['writeStore'] !== false,
          returnPatch: writeStore2['returnPatch'] === true,
        }),
        videos4 = Array['isArray'](value82) ? value82 : value82?.['videos'] || [];
      return (
        this['_finalizeVideoSuccessSideEffects'](videos4, value80),
        writeStore2['returnPatch'] === true
          ? { ...(value82 && !Array['isArray'](value82) ? value82 : {}), videos: videos4 }
          : videos4
      );
    }
    ['_dispatchGenerationHistoryVideos'](list9, startedAt4) {
      if (typeof window === 'undefined' || typeof window['dispatchEvent'] !== 'function') return;
      const videos5 = Array['isArray'](list9)
        ? list9['filter'](
            (enabled15) => enabled15 && typeof enabled15 === 'object' && !enabled15['error'],
          )
        : [];
      if (videos5['length'] === 0) return;
      const nodeData3 = store['getState']()['nodes']?.[this['nodeId']] || this['_data'] || {};
      try {
        window['dispatchEvent'](
          new CustomEvent(GENERATION_HISTORY_EVENT, {
            detail: {
              kind: 'video',
              sourceNodeId: this['nodeId'],
              nodeData: nodeData3,
              videos: videos5,
              startedAt: startedAt4,
              createdAt: Date['now'](),
            },
          }),
        );
      } catch {}
    }
    async ['_maybeResumeDreaminaTaskImpl']() {
      if (this['_videoSubmitInFlight'] === true) return;
      const node = handler()['nodes']?.[this['nodeId']] || this['_data'] || {};
      if (!this['_isDreaminaVideoNode'](node)) {
        this['_stopDreaminaRecovery'](false);
        return;
      }
      if (!this['_isDreaminaRecoverableRunningTask'](node)) {
        this['_stopDreaminaRecovery'](false);
        return;
      }
      const submitId4 = this['_resolveDreaminaResumeSubmitId'](node);
      if (!submitId4) {
        this['_stopDreaminaRecovery'](false);
        return;
      }
      const value83 = String(this['_dreaminaActiveSubmitId'] || '')['trim']();
      if (
        this['_isGenerating'] &&
        node?.['dreaminaTaskRecovering'] !== true &&
        value83 &&
        value83 === submitId4 &&
        !this['_isStaleActiveDreaminaTask'](node)
      )
        return;
      if (this['_dreaminaResumeSubmitId'] === submitId4) return;
      this['_stopDreaminaRecovery'](false);
      const startedAt5 = Number(
          node?.['dreaminaTaskStartedAt'] || node?.['generationStartTime'] || Date['now'](),
        ),
        provider3 = resolveDreaminaStyleVideoProvider(node?.['model'], node?.['provider']),
        maxWaitMs2 = provider3 === 'dreamina' && this['_shouldProbeStaleDreaminaRecovery'](node);
      ((this['_dreaminaResumeSubmitId'] = submitId4), (this['_dreaminaActiveSubmitId'] = submitId4));
      const value84 = (async () => {
        let signal = null;
        try {
          ((signal = new AbortController()),
            (this['_dreaminaResumeAbortController'] = signal),
            (this['_isGenerating'] = true),
            this['_setGenerateButtonBusyUi']({ cancellable: false }),
            startLoading(this['previewEl']));
          const response4 = await resumeTask(
            createGenerationResumePlanFromNode({
              kind: 'video',
              node: node,
              taskProtocol: 'dreamina',
              sourceNodeId: this['nodeId'],
              targetNodeId: this['nodeId'],
              trigger: 'node',
              taskType: 'video-generation',
              provider: provider3 || 'dreamina',
              adapterType: provider3 === 'dreamina' ? 'localRuntime' : 'modelApi',
              payload: {
                ...node,
                provider: provider3 || node?.['provider'] || 'dreamina',
                model:
                  provider3 === 'apimart'
                    ? node?.['model'] || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL
                    : node?.['model'] || '',
              },
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () => ({
                ...this['_buildDreaminaTaskPatch'](
                  this['_buildDreaminaPendingSnapshot']({
                    submitId: submitId4,
                    phase: 'generating',
                    label:
                      String(node?.['dreaminaTaskLabel'] || '')['trim']() ||
                      videoTaskText('task.generating'),
                    raw: node?.['dreaminaTaskLastRaw'] || {},
                  }),
                  { recovering: true, startedAt: startedAt5 },
                ),
              }),
              onTaskStart: () => {
                this['_persistDreaminaResumeCache']();
              },
              poll: async (value85) => {
                const value86 = value85?.['payload'] || {};
                if (provider3 && provider3 !== 'dreamina')
                  return api['resumeAsyncVideoTask'](submitId4, value86, {
                    signal: signal['signal'],
                  });
                const onProgress = async (enabled16) => {
                  if (!enabled16 || signal['signal']['aborted']) return;
                  value85?.['isBackgroundTask']?.()
                    ? handler3(
                        value85,
                        this['nodeId'],
                        this['_buildDreaminaTaskPatch'](enabled16, {
                          recovering: true,
                          startedAt: startedAt5,
                        }),
                      )
                    : this['_applyDreaminaTaskSnapshot'](enabled16, {
                        recovering: true,
                        startedAt: startedAt5,
                      });
                };
                if (maxWaitMs2) {
                  if (typeof api['probeDreaminaVideoTask'] !== 'function')
                    throw new Error('Dreamina 历史任务核验能力不可用');
                  const value87 = await api['probeDreaminaVideoTask'](submitId4, {
                    signal: signal['signal'],
                  });
                  await onProgress(value87?.['dreaminaSnapshot']);
                  if (value87?.['pending'] !== true) return value87;
                }
                return api['resumeDreaminaVideoTask'](submitId4, {
                  signal: signal['signal'],
                  intervalMs: intervalMs,
                  maxWaitMs: maxWaitMs2 ? maxWaitMs : scope,
                  onProgress: onProgress,
                });
              },
              resultBuilder: async (value88, value89) => {
                const value90 = value88?.['dreaminaSnapshot'] || null,
                  value91 = this['_applyDreaminaSuccessResult'](
                    value88,
                    value89['startedAt'],
                    value90,
                    { writeStore: false, returnPatch: true },
                  );
                return value91?.['patch'] || {};
              },
              failureBuilder: (message, startedAt6) => {
                if (maxWaitMs2 && this['_isUncertainStaleDreaminaRecoveryError'](message)) {
                  const label2 = videoTaskText('task.staleRecoveryStopped', {
                      message: message?.['message'] || videoTaskText('task.queryFailed'),
                    }),
                    value92 = this['_buildDreaminaPendingSnapshot']({
                      submitId: submitId4,
                      phase: String(node?.['dreaminaTaskPhase'] || '')['trim']() || 'generating',
                      label: label2,
                      raw: node?.['dreaminaTaskLastRaw'] || {},
                    });
                  return Object['assign'](
                    buildVideoGenerationFailurePatch({ error: label2, startedAt: startedAt6['startedAt'] }),
                    this['_buildDreaminaTaskPatch'](value92, {
                      recovering: false,
                      startedAt: startedAt6['startedAt'],
                    }),
                  );
                }
                if (!maxWaitMs2 && this['_isDreaminaPollTimeoutError'](message)) {
                  const value93 = this['_buildDreaminaBackgroundPendingSnapshot'](submitId4);
                  return Object['assign'](
                    {
                      isGenerating: true,
                      jobStatus: 'running',
                      jobError: null,
                      generationDuration: Date['now']() - startedAt6['startedAt'],
                    },
                    this['_buildDreaminaTaskPatch'](value93, {
                      recovering: false,
                      startedAt: startedAt6['startedAt'],
                    }),
                  );
                }
                const value94 = message?.['dreaminaSnapshot'] || null,
                  error3 =
                    message?.['message'] ||
                    value94?.['failReason'] ||
                    value94?.['label'] ||
                    videoTaskText('task.queryFailed');
                return Object['assign'](
                  buildVideoGenerationFailurePatch({ error: error3, startedAt: startedAt6['startedAt'] }),
                  value94
                    ? this['_buildDreaminaTaskPatch'](value94, {
                        recovering: false,
                        startedAt: startedAt6['startedAt'],
                      })
                    : this['_buildDreaminaTaskPatch'](
                        this['_buildDreaminaFailedSnapshot'](submitId4, error3),
                        { recovering: false, startedAt: startedAt6['startedAt'] },
                      ),
                );
              },
              cancelledBuilder: (startedAt7) =>
                Object['assign'](
                  { generationDuration: Date['now']() - startedAt7['startedAt'] },
                  this['_buildDreaminaTaskPatch'](
                    this['_buildDreaminaPendingSnapshot']({
                      submitId: submitId4,
                      phase: 'generating',
                      label:
                        String(node?.['dreaminaTaskLabel'] || '')['trim']() ||
                        videoTaskText('task.generating'),
                      raw: node?.['dreaminaTaskLastRaw'] || {},
                    }),
                    { recovering: false, startedAt: startedAt7['startedAt'] },
                  ),
                ),
              parseError: (value95) =>
                getGenerationErrorMessage(value95, videoTaskText('task.queryFailed')),
            }),
            { store: store, startedAt: startedAt5, abortController: signal },
          );
          if (response4['status'] === 'pending') {
            this['_persistDreaminaResumeCache']();
            return;
          }
          if (response4['status'] === 'success') {
            const videoGenerationResult = normalizeVideoGenerationResult(response4['result'])['items'];
            this['_finalizeVideoSuccessSideEffects'](videoGenerationResult, startedAt5);
          }
          if (response4['status'] === 'failed' && this['_isDreaminaPollTimeoutError'](response4['error']))
            this['_showDreaminaBackgroundQueueingToast'](submitId4);
          else response4['status'] === 'failed' && (this['_dreaminaActiveSubmitId'] = '');
          this['_persistDreaminaResumeCache']();
        } catch (error4) {
          if (signal?.['signal']?.['aborted'] || isGenerationAbortError(error4)) return;
          const error5 = error4?.['message'] || videoTaskText('task.queryFailed'),
            value96 = this['_buildDreaminaFailedSnapshot'](submitId4, error5);
          (store['updateNodeData'](
            this['nodeId'],
            Object['assign'](
              buildVideoGenerationFailurePatch({ error: error5, startedAt: startedAt5 }),
              this['_buildDreaminaTaskPatch'](value96, { recovering: false, startedAt: startedAt5 }),
            ),
          ),
            this['_persistDreaminaResumeCache']());
        } finally {
          signal &&
            this['_dreaminaResumeAbortController'] === signal &&
            (this['_dreaminaResumeAbortController'] = null);
          this['_dreaminaResumeSubmitId'] === submitId4 && (this['_dreaminaResumeSubmitId'] = '');
          this['_dreaminaResumePromise'] = null;
          const value97 = this['_syncLocalTaskNodeData'](),
            shouldShowGenerationBusyUi2 =
              shouldShowGenerationBusyUi(value97) || this['_shouldKeepDreaminaLoading'](value97);
          ((this['_isGenerating'] = shouldShowGenerationBusyUi2),
            !shouldShowGenerationBusyUi2 && (this['_dreaminaActiveSubmitId'] = ''),
            shouldShowGenerationBusyUi2
              ? this['_updateSubmitButtonState']?.()
              : (this['_resetGenerateButtonIdleUi']({ cancellable: false }),
                stopLoading(this['previewEl']),
                this['_updateSubmitButtonState']?.()));
        }
      })();
      this['_dreaminaResumePromise'] = value84;
    }
    async ['_maybeResumeRunningHubTaskImpl']() {
      const node2 = handler()['nodes']?.[this['nodeId']] || this['_data'] || {};
      if (!this['_isRunninghubWorkflowModel'](node2?.['model'], node2?.['provider'])) {
        this['_stopRunningHubRecovery'](false);
        return;
      }
      if (!this['_isRunningHubRecoverableRunningTask'](node2)) {
        this['_stopRunningHubRecovery'](false);
        return;
      }
      const taskId3 = String(node2?.['rhTaskId'] || '')['trim']();
      if (!taskId3) {
        this['_stopRunningHubRecovery'](false);
        return;
      }
      if (this['_rhResumeTaskId'] === taskId3 && this['_rhResumePromise']) return;
      this['_stopRunningHubRecovery'](false);
      const startedAt8 = Number(
          node2?.['rhTaskStartedAt'] || node2?.['generationStartTime'] || Date['now'](),
        ),
        rhTaskUseOpenapiQuery = node2?.['rhTaskUseOpenapiQuery'] === true;
      this['_rhResumeTaskId'] = taskId3;
      const value98 = (async () => {
        let signal2 = null,
          value99 = null;
        try {
          const payload2 = await this['_buildPayload']();
          value99 = payload2;
          if (!payload2) return;
          ((signal2 = new AbortController()),
            (this['_rhResumeAbortController'] = signal2),
            (this['_rhAbortController'] = signal2),
            (this['_rhTaskId'] = taskId3),
            (this['_rhApiKey'] = String(payload2?.['apiKey'] || '')['trim']() || this['_rhApiKey'] || null),
            (this['_rhCancelRequested'] = false),
            (this['_rhRemoteCancelSent'] = false),
            (this['_isGenerating'] = true),
            this['_setGenerateButtonBusyUi']({ cancellable: true }),
            startLoading(this['previewEl']));
          const response5 = await resumeTask(
            createGenerationResumePlanFromNode({
              kind: 'video',
              node: node2,
              taskProtocol: 'workflow',
              sourceNodeId: this['nodeId'],
              targetNodeId: this['nodeId'],
              trigger: 'node',
              taskType: 'video-generation',
              payload: payload2,
              cancellable: true,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () => ({
                rhStatusMessage: null,
                rhStatusCode: null,
                rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery,
              }),
              onTaskStart: () => {
                this['_persistRunningHubResumeCache']();
              },
              poll: async () =>
                api['resumeRunningHubVideoTask'](taskId3, payload2, {
                  signal: signal2['signal'],
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                }),
              resultBuilder: async (value100, startedAt9) => {
                const value101 = this['_applyDreaminaSuccessResult'](
                  value100,
                  startedAt9['startedAt'],
                  null,
                  { writeStore: false, returnPatch: true },
                );
                return {
                  ...(value101?.['patch'] || {}),
                  rhStatusMessage: null,
                  rhStatusCode: null,
                  ...this['_buildRunningHubTaskPatch']({
                    taskId: taskId3,
                    status: 'success',
                    startedAt: startedAt9['startedAt'],
                    recovering: false,
                    useOpenapiQuery: rhTaskUseOpenapiQuery,
                  }),
                };
              },
              failureBuilder: (error6, startedAt10) => ({
                ...buildVideoGenerationFailurePatch({
                  error: error6?.['message'] || videoTaskText('task.generationFailed'),
                  startedAt: startedAt10['startedAt'],
                  duration: Date['now']() - startedAt10['startedAt'],
                }),
                rhStatusMessage: error6?.['message'] || videoTaskText('task.generationFailed'),
                rhStatusCode: Number['isFinite'](Number(error6?.['code']))
                  ? Number(error6['code'])
                  : null,
                ...this['_buildRunningHubTaskPatch']({
                  taskId: taskId3,
                  status: 'failed',
                  startedAt: startedAt10['startedAt'],
                  recovering: false,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                }),
              }),
              cancelledBuilder: (startedAt11) => ({
                videos: [],
                videoUrl: '',
                localPath: '',
                generationDuration: Date['now']() - startedAt11['startedAt'],
                rhStatusMessage: videoTaskText('cancel.interrupted'),
                rhStatusCode: null,
                ...this['_buildRunningHubTaskPatch']({
                  taskId: taskId3,
                  status: 'cancelled',
                  startedAt: startedAt11['startedAt'],
                  recovering: false,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                }),
              }),
              parseError: (value102) =>
                getGenerationErrorMessage(value102, videoTaskText('task.generationFailed')),
            }),
            { store: store, startedAt: startedAt8, abortController: signal2 },
          );
          if (response5['status'] === 'pending') {
            this['_persistRunningHubResumeCache']();
            return;
          }
          if (response5['status'] === 'success') {
            const videoGenerationResult2 = normalizeVideoGenerationResult(response5['result'])['items'];
            this['_finalizeVideoSuccessSideEffects'](videoGenerationResult2, startedAt8);
          }
          this['_persistRunningHubResumeCache']();
        } catch (rhStatusMessage) {
          if (signal2?.['signal']?.['aborted'] || isGenerationAbortError(rhStatusMessage)) return;
          (store['updateNodeData'](this['nodeId'], {
            generationDuration: Math['max'](0, Date['now']() - startedAt8),
            rhStatusMessage: rhStatusMessage?.['message'] || videoTaskText('task.generationFailed'),
            rhStatusCode: Number['isFinite'](Number(rhStatusMessage?.['code'])) ? Number(rhStatusMessage['code']) : null,
            ...this['_buildRunningHubTaskPatch']({
              taskId: taskId3,
              status: 'failed',
              startedAt: startedAt8,
              recovering: false,
              useOpenapiQuery: rhTaskUseOpenapiQuery,
            }),
          }),
            this['_persistRunningHubResumeCache']());
        } finally {
          signal2 &&
            this['_rhResumeAbortController'] === signal2 &&
            (this['_rhResumeAbortController'] = null);
          signal2 && this['_rhAbortController'] === signal2 && (this['_rhAbortController'] = null);
          this['_rhResumeTaskId'] === taskId3 && (this['_rhResumeTaskId'] = '');
          (releasePayloadObjectUrlLease(value99), (this['_rhResumePromise'] = null));
          const value103 = this['_syncLocalTaskNodeData'](),
            shouldShowGenerationBusyUi3 = shouldShowGenerationBusyUi(value103);
          this['_isGenerating'] = shouldShowGenerationBusyUi3;
          if (shouldShowGenerationBusyUi3) this['_rhTaskId'] = String(value103?.['rhTaskId'] || taskId3 || '')['trim']();
          else {
            this['_rhTaskId'] = null;
            if (!this['_rhCancelRequested']) this['_rhApiKey'] = null;
            (this['_resetGenerateButtonIdleUi']({ cancellable: true }), stopLoading(this['previewEl']));
          }
          this['_updateSubmitButtonState']();
        }
      })();
      this['_rhResumePromise'] = value98;
    }
    async ['_maybeResumeAsyncTaskImpl']() {
      const node3 = handler()['nodes']?.[this['nodeId']] || this['_data'] || {};
      if (this['_isGenerating'] && node3?.['asyncTaskRecovering'] !== true) return;
      if (!this['_isAsyncRecoverableRunningTask'](node3)) {
        this['_stopAsyncRecovery'](false);
        return;
      }
      const taskId4 = String(node3?.['asyncTaskId'] || '')['trim']();
      if (!taskId4) {
        this['_stopAsyncRecovery'](false);
        return;
      }
      const value104 = this['_getGenerationTaskRecoveryOwner'](),
        enabled17 = value104['claim']('asyncModelApi', taskId4);
      if (!enabled17['claimed']) return enabled17['promise'];
      const startedAt12 = Number(
          node3?.['asyncTaskStartedAt'] || node3?.['generationStartTime'] || Date['now'](),
        ),
        providerHint2 = this['_inferAsyncProviderFromModel'](
          node3?.['model'],
          node3?.['asyncTaskProvider'] || node3?.['provider'] || '',
        ),
        signal3 = enabled17['controller'],
        value105 = (async () => {
          try {
            const payload3 = await this['_buildResumePayload'](node3, { providerHint: providerHint2 });
            if (!payload3) return;
            ((this['_isGenerating'] = true),
              this['_setGenerateButtonBusyUi']({ cancellable: false }),
              startLoading(this['previewEl']));
            const response6 = await resumeTask(
              createGenerationResumePlanFromNode({
                kind: 'video',
                node: node3,
                taskProtocol: 'asyncModelApi',
                sourceNodeId: this['nodeId'],
                targetNodeId: this['nodeId'],
                trigger: 'node',
                taskType: 'video-generation',
                payload: payload3,
                pauseOnAbort: true,
                persistTaskState: () => this['_persistAsyncResumeCache'](),
                poll: async () =>
                  api['resumeAsyncVideoTask'](taskId4, payload3, { signal: signal3['signal'] }),
                resultBuilder: async (value106, value107) => {
                  const value108 = this['_applyDreaminaSuccessResult'](
                    value106,
                    value107['startedAt'],
                    null,
                    { writeStore: false, returnPatch: true },
                  );
                  return value108?.['patch'] || {};
                },
                parseError: (value109) =>
                  getGenerationErrorMessage(value109, videoTaskText('task.generationFailed')),
              }),
              { store: store, startedAt: startedAt12, abortController: signal3 },
            );
            if (response6['status'] === 'pending') return;
            if (response6['status'] === 'success') {
              const videoGenerationResult3 = normalizeVideoGenerationResult(response6['result'])['items'];
              this['_finalizeVideoSuccessSideEffects'](videoGenerationResult3, startedAt12);
            }
          } catch (error7) {
            if (signal3?.['signal']?.['aborted'] || isGenerationAbortError(error7)) return;
            (store['updateNodeData'](this['nodeId'], {
              ...buildVideoGenerationFailurePatch({
                error: error7?.['message'] || videoTaskText('task.generationFailed'),
                startedAt: startedAt12,
                duration: Math['max'](0, Date['now']() - startedAt12),
              }),
              ...this['_buildAsyncTaskPatch']({
                provider: providerHint2,
                kind: 'video',
                taskId: taskId4,
                status: 'failed',
                startedAt: startedAt12,
                recovering: false,
              }),
            }),
              this['_persistAsyncResumeCache']());
          } finally {
            value104['finish']('asyncModelApi', { taskId: taskId4, controller: signal3 });
            const value110 = this['_syncLocalTaskNodeData'](),
              enabled18 = value104['isBusy'](value110);
            ((this['_isGenerating'] = enabled18),
              !enabled18 &&
                (this['_resetGenerateButtonIdleUi']({ cancellable: false }), stopLoading(this['previewEl'])),
              this['_updateSubmitButtonState']());
          }
        })();
      value104['setPromise']('asyncModelApi', value105);
    }
    async ['_handleGenerateOrCancelImpl'](value111 = null) {
      const value112 = store['getState']()['nodes']?.[this['nodeId']] || this['_data'] || {},
        cancellable2 = this['_isRunninghubWorkflowModel'](value112?.['model'], value112?.['provider']);
      !cancellable2 && this['_dreaminaResumePromise'] && this['_stopDreaminaRecovery'](true);
      !cancellable2 && this['_asyncResumePromise'] && this['_stopAsyncRecovery'](true);
      if (
        shouldAllowCancel(value112, {
          cancellable: cancellable2,
          cancelInFlight: this['_rhCancelInFlight'] === true,
        })
      ) {
        await this['_cancelRunningHubWorkflowTask']();
        return;
      }
      await this['_onGenerate'](value111);
    }
    async ['_cancelRunningHubWorkflowTaskImpl']() {
      const useOpenapiQuery2 = store['getState']()['nodes']?.[this['nodeId']] || this['_data'] || {},
        apiKey2 = this['_rhApiKey'] || '',
        taskId5 =
          String(this['_rhTaskId'] || '')['trim']() || String(useOpenapiQuery2?.['rhTaskId'] || '')['trim'](),
        value113 = Date['now'](),
        count9 = Number(useOpenapiQuery2?.['generationStartTime']),
        generationDuration =
          useOpenapiQuery2?.['generationDuration'] != null
            ? useOpenapiQuery2['generationDuration']
            : Number['isFinite'](count9) && count9 > 0
              ? Math['max'](0, value113 - count9)
              : 0;
      this['_rhCancelRequested'] = true;
      this['_rhAbortController'] &&
        !this['_rhAbortController']['signal']['aborted'] &&
        this['_rhAbortController']['abort']();
      const enabled19 = !apiKey2,
        rhStatusCode = !taskId5;
      try {
        this['_rhRemoteCancelSent'] = !enabled19 && !rhStatusCode;
        const cancelledBuilder = ({ remoteResult: remoteResult, remoteError: remoteError, startedAt: startedAt13 }) => {
          const count10 = Number(remoteResult?.['code']),
            value114 = enabled19
              ? videoTaskText('cancel.missingApiKey')
              : rhStatusCode
                ? videoTaskText('cancel.interruptedNoTaskId')
                : '',
            rhStatusMessage2 =
              value114 ||
              (remoteError
                ? remoteError['message'] || videoTaskText('cancel.failed')
                : count10 === 0
                  ? videoTaskText('cancel.success')
                  : count10 === 807
                    ? videoTaskText('cancel.taskNotFound')
                    : remoteResult?.['msg'] || videoTaskText('cancel.failed'));
          return {
            rhStatusMessage: rhStatusMessage2,
            rhStatusCode: rhStatusCode ? 813 : Number['isFinite'](count10) ? count10 : null,
            videos: [],
            videoUrl: '',
            localPath: '',
            generationDuration: generationDuration,
            ...this['_buildRunningHubTaskPatch']({
              taskId: taskId5,
              status: 'cancelled',
              startedAt: Number(
                startedAt13 || useOpenapiQuery2?.['rhTaskStartedAt'] || useOpenapiQuery2?.['generationStartTime'] || 0,
              ),
              recovering: false,
              useOpenapiQuery: useOpenapiQuery2?.['rhTaskUseOpenapiQuery'] === true,
            }),
          };
        };
        (await cancelTask(this['nodeId'], {
          store: store,
          taskId: taskId5,
          cancellable: true,
          cancel: ({ taskId: taskId6 }) => {
            if (!apiKey2) throw new Error(videoTaskText('cancel.missingApiKey'));
            return api['cancelRunningHubWorkflowTask']({
              apiKey: apiKey2,
              taskId: taskId6,
              providerProfileId: useOpenapiQuery2?.['providerProfileId'] || useOpenapiQuery2?.['rhProviderProfileId'] || '',
            });
          },
          cancelledBuilder: cancelledBuilder,
          spec: createGenerationCancelPlanFromNode({
            kind: 'video',
            node: useOpenapiQuery2,
            taskProtocol: 'workflow',
            sourceNodeId: this['nodeId'],
            targetNodeId: this['nodeId'],
            trigger: 'node',
            taskType: 'video-generation',
            payload: useOpenapiQuery2,
            cancellable: true,
            resumable: true,
            cancelledBuilder: cancelledBuilder,
          }),
        }),
          this['_persistRunningHubResumeCache']());
      } finally {
        ((this['_isGenerating'] = false),
          (this['_rhAbortController'] = null),
          (this['_rhTaskId'] = null),
          (this['_rhApiKey'] = null),
          (this['_rhRemoteCancelSent'] = false),
          this['_stopRunningHubRecovery'](true),
          this['_resetGenerateButtonIdleUi']({ cancellable: true }),
          stopLoading(this['previewEl']),
          this['_updateSubmitButtonState']());
      }
    }
    ['_setGenerateButtonBusyUi']({ cancellable: cancellable = false } = {}) {
      if (!this['btnEl']) return;
      if (cancellable) {
        const title = getVideoCancelTooltip();
        setGenerateButtonCancellableUi(this['btnEl'], {
          title: title,
          tooltip: title,
          ariaLabel: videoTaskText('controls.cancelGenerateAria'),
          color: 'var(--red)',
          busy: true,
        });
        return;
      }
      const title2 = getVideoGenerateTitle();
      setGenerateButtonLoadingUi(this['btnEl'], { title: title2, disabled: true, ariaLabel: title2 });
    }
    ['_resetGenerateButtonIdleUi']({ cancellable: cancellable = false } = {}) {
      if (!this['btnEl']) return;
      const videoGenerateTitle = getVideoGenerateTitle();
      resetGenerateButtonIdleUi(this['btnEl'], videoGenerateTitle);
      if (cancellable) {
        (this['btnEl']['removeAttribute']('title'),
          this['btnEl']['setAttribute']('data-tooltip', getVideoCancelTooltip()));
        return;
      }
      (this['btnEl']['removeAttribute']('data-tooltip'), (this['btnEl']['title'] = videoGenerateTitle));
    }
    ['_getPreviewGenerateButtonLoadingOptions']() {
      return createPreviewGenerateButtonCallbacks(this, getVideoGenerateTitle());
    }
    async ['_onGenerateImpl'](template = null, value115 = {}) {
      if (this['_isGenerating']) return;
      if (value115?.['insertPrompt'] === true) {
        (insertPresetPromptIntoEditor({
          storeApi: store,
          nodeId: this['nodeId'],
          promptEl: this['promptEl'],
          template: template,
          inEdges: store['getIncomingEdges'](this['nodeId']),
          nodes: store['getState']()['nodes'] || {},
          allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        }),
          this['_updateSubmitButtonState']?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(template)) {
        const promptText = await this['_buildPayload'](template);
        if (!promptText) return;
        try {
          previewPresetPromptInEditor({
            storeApi: store,
            nodeId: this['nodeId'],
            promptEl: this['promptEl'],
            promptText: promptText['prompt'],
          });
        } finally {
          releasePayloadObjectUrlLease(promptText);
        }
        return;
      }
      if (isPreviewModeEnabled()) {
        !isPreviewNodeLoading(this['nodeId']) &&
          startPreviewNodeLoading(
            this['nodeId'],
            this['previewEl'],
            this['_getPreviewGenerateButtonLoadingOptions'](),
          );
        return;
      }
      if (this['_videoSubmitInFlight'] === true) return;
      const nodeData4 = store['getState']()['nodes']?.[this['nodeId']] || this['_data'] || {},
        value116 =
          typeof this['_shouldKeepDreaminaLoading'] === 'function' &&
          typeof this['_isDreaminaVideoNode'] === 'function'
            ? this['_shouldKeepDreaminaLoading'](nodeData4)
            : false;
      if (shouldShowGenerationBusyUi(nodeData4) || value116) return;
      const promise = createSegmentRetakeGenerationLifecycle(this, {
        nodeData: nodeData4,
        store: store,
        startLoading: startLoading,
        stopLoading: stopLoading,
      });
      if (promise['reject']()) return;
      this['_videoSubmitInFlight'] = true;
      let value117 = null;
      try {
        promise['begin']();
        const modelId = String(this['_data']?.['model'] || '')['trim'](),
          provider4 = String(this['_data']?.['provider'] || '')['trim']();
        await ensureVipSessionRecheck(modelId, provider4);
        if (!this['_guardVipSelection'](this['_data']?.['model'] || '', provider4)) return;
        const guardModelGenerationCredentials2 = guardModelGenerationCredentials({
          modelId: modelId,
          provider: provider4,
          providerProfileId: nodeData4?.['providerProfileId'] || nodeData4?.['rhProviderProfileId'],
        });
        if (!guardModelGenerationCredentials2['ready']) return;
        if (typeof window['ensureSubscriptionInstallId'] === 'function')
          try {
            await window['ensureSubscriptionInstallId']();
          } catch {}
        const providerId = await this['_buildPayload'](template, { randomizeSubmitParams: true });
        value117 = providerId;
        if (!providerId) return;
        if (!(await this['_preflightConnectedLocalVideoInputs'](providerId))) return;
        const value118 = String(providerId['model'] || '')['trim']();
        if (isVideoVipModel(value118, providerId['provider']) && !String(providerId['installId'] || '')['trim']()) {
          window['showToast']?.(videoTaskText('toasts.missingInstallId'), 'error');
          return;
        }
        const cancellable3 = this['_isRunninghubWorkflowModel'](providerId['model'], providerId['provider']),
          adapterType =
            String(providerId?.['provider'] || '')
              ['trim']()
              ['toLowerCase']() === 'runninghub' && isModelApiModel(providerId?.['model'], 'runninghub');
        if (adapterType && !String(providerId?.['apiKey'] || '')['trim']()) {
          showProviderApiKeyMissingToast('请先填写 RunningHub 模型 API Key', {
            providerId: providerId?.['providerProfileId'] || 'runninghub',
            keyType: 'modelApi',
            model: providerId?.['model'],
          });
          return;
        }
        const resumable = this['_isDreaminaVideoNode'](providerId),
          provider5 = String(providerId?.['provider'] || this['_data']?.['provider'] || '')
            ['trim']()
            ['toLowerCase'](),
          async2 = !cancellable3 && !resumable;
        resumable && this['_stopDreaminaRecovery'](true);
        cancellable3 && this['_stopRunningHubRecovery'](true);
        async2 && this['_stopAsyncRecovery'](true);
        this['_rhGenToken'] = (this['_rhGenToken'] || 0) + 1;
        const value119 = this['_rhGenToken'];
        ((this['_rhCancelRequested'] = false),
          (this['_rhRemoteCancelSent'] = false),
          (this['_rhApiKey'] = cancellable3 ? providerId['apiKey'] : null),
          (this['_rhTaskId'] = null),
          (this['_rhAbortController'] = resumable || cancellable3 || async2 ? new AbortController() : null),
          (this['_isGenerating'] = true),
          this['_setGenerateButtonBusyUi']({ cancellable: cancellable3 }));
        if (!promise['hasStartedPresentation']()) startLoading(this['previewEl']);
        const startedAt14 = Date['now'](),
          value120 = {
            ...buildGenerationStartPatch({ startedAt: startedAt14 }),
            generationStartTime: startedAt14,
            generationDuration: null,
            rhStatusMessage: null,
            rhStatusCode: null,
          };
        (cancellable3 || adapterType) &&
          providerId?.['providerProfileId'] &&
          (value120['rhProviderProfileId'] = normalizeRunningHubModelApiProfileId(
            providerId?.['providerProfileId'],
          ));
        resumable &&
          (Object['assign'](value120, {
            dreaminaSubmitId: '',
            dreaminaTaskStatus: 'pending',
            dreaminaTaskPhase: 'generating',
            dreaminaTaskLabel: videoTaskText('task.submitting'),
            dreaminaTaskStartedAt: startedAt14,
            dreaminaTaskLastCheckedAt: null,
            dreaminaTaskLastRaw: {},
            dreaminaTaskRecovering: false,
          }),
          Object['assign'](value120, {
            ...this['_buildRunningHubTaskPatch']({
              taskId: '',
              status: 'idle',
              startedAt: 0,
              recovering: false,
              useOpenapiQuery: false,
            }),
            ...this['_buildAsyncTaskPatch']({
              provider: '',
              kind: 'video',
              taskId: '',
              status: 'idle',
              startedAt: 0,
              recovering: false,
            }),
          }));
        cancellable3 &&
          (Object['assign'](value120, {
            rhTaskId: '',
            rhTaskStatus: 'pending',
            rhTaskStartedAt: startedAt14,
            rhTaskRecovering: false,
            rhTaskUseOpenapiQuery: false,
          }),
          Object['assign'](value120, {
            dreaminaSubmitId: '',
            dreaminaTaskStatus: 'idle',
            dreaminaTaskPhase: 'done',
            dreaminaTaskLabel: '',
            dreaminaTaskStartedAt: 0,
            dreaminaTaskLastCheckedAt: null,
            dreaminaTaskLastRaw: {},
            dreaminaTaskRecovering: false,
            ...this['_buildAsyncTaskPatch']({
              provider: '',
              kind: 'video',
              taskId: '',
              status: 'idle',
              startedAt: 0,
              recovering: false,
            }),
          }));
        async2 &&
          (Object['assign'](
            value120,
            this['_buildAsyncTaskPatch']({
              provider: provider5,
              kind: 'video',
              taskId: '',
              status: 'pending',
              startedAt: startedAt14,
              recovering: false,
            }),
          ),
          Object['assign'](value120, {
            ...this['_buildRunningHubTaskPatch']({
              taskId: '',
              status: 'idle',
              startedAt: 0,
              recovering: false,
              useOpenapiQuery: false,
            }),
            dreaminaSubmitId: '',
            dreaminaTaskStatus: 'idle',
            dreaminaTaskPhase: 'done',
            dreaminaTaskLabel: '',
            dreaminaTaskStartedAt: 0,
            dreaminaTaskLastCheckedAt: null,
            dreaminaTaskLastRaw: {},
            dreaminaTaskRecovering: false,
          }));
        try {
          const response7 = await submitTask(
            createGenerationSubmitPlan({
              kind: 'video',
              sourceNodeId: this['nodeId'],
              targetNodeId: this['nodeId'],
              trigger: 'node',
              taskType: 'video-generation',
              provider: providerId['provider'] || provider5 || this['_data']?.['provider'] || '',
              adapterType: cancellable3 ? 'workflow' : 'modelApi',
              modelId: providerId['model'] || this['_data']?.['model'] || '',
              payload: providerId,
              cancellable: cancellable3,
              resumable: resumable || cancellable3 || async2,
              pauseOnAbort: resumable || cancellable3 || async2 ? 'afterTaskId' : false,
              async: async2,
              startBuilder: () => value120,
              onTaskStart: () => {
                (promise['markTaskStarted'](), this['_syncLocalTaskNodeData']());
                if (resumable) this['_persistDreaminaResumeCache']();
                if (cancellable3) this['_persistRunningHubResumeCache']();
                if (async2) this['_persistAsyncResumeCache']();
              },
              submit: async (value121, signal4 = {}) =>
                api['generateVideo'](providerId, {
                  ...(signal4['signal'] ? { signal: signal4['signal'] } : {}),
                  runningHubWorkflowQueueLease: signal4['runningHubWorkflowQueueLease'],
                  ...(resumable ? { maxWaitMs: maxWaitMs } : {}),
                  onTaskMeta: ({ taskId: taskId7, useOpenapiQuery: useOpenapiQuery3, provider: provider6 }) => {
                    if (value119 !== this['_rhGenToken']) return;
                    const submitId5 = String(taskId7 || '')['trim']();
                    if (!submitId5) return;
                    if (cancellable3) {
                      ((this['_rhTaskId'] = submitId5),
                        signal4['onTaskId']?.(submitId5),
                        handler3(signal4, this['nodeId'], {
                          rhStatusMessage: null,
                          rhStatusCode: null,
                          rhTaskUseOpenapiQuery: useOpenapiQuery3 === true,
                        }));
                      !signal4['isBackgroundTask']?.() &&
                        (this['_syncLocalTaskNodeData'](), this['_persistRunningHubResumeCache']());
                      return;
                    }
                    if (resumable) {
                      this['_dreaminaActiveSubmitId'] = submitId5;
                      const value122 = this['_buildDreaminaPendingSnapshot']({
                        submitId: submitId5,
                        phase: 'generating',
                        label: videoTaskText('task.generating'),
                      });
                      signal4['isBackgroundTask']?.()
                        ? handler3(
                            signal4,
                            this['nodeId'],
                            this['_buildDreaminaTaskPatch'](value122, {
                              recovering: false,
                              startedAt: startedAt14,
                            }),
                          )
                        : this['_applyDreaminaTaskSnapshot'](value122, {
                            recovering: false,
                            startedAt: startedAt14,
                          });
                      signal4['onTaskId']?.(submitId5);
                      return;
                    }
                    async2 &&
                      (signal4['onTaskId']?.(submitId5),
                      handler3(signal4, this['nodeId'], {
                        asyncTaskProvider: String(provider6 || provider5 || this['_data']?.['provider'] || '')
                          ['trim']()
                          ['toLowerCase'](),
                        asyncTaskKind: 'video',
                      }),
                      !signal4['isBackgroundTask']?.() &&
                        (this['_syncLocalTaskNodeData'](), this['_persistAsyncResumeCache']()));
                  },
                  onTaskId: (value123) => {
                    if (value119 !== this['_rhGenToken']) return;
                    const submitId6 = String(value123 || '')['trim']();
                    if (!submitId6) return;
                    if (resumable) {
                      this['_dreaminaActiveSubmitId'] = submitId6;
                      const value124 = this['_buildDreaminaPendingSnapshot']({
                        submitId: submitId6,
                        phase: 'generating',
                        label: videoTaskText('task.generating'),
                      });
                      signal4['isBackgroundTask']?.()
                        ? handler3(
                            signal4,
                            this['nodeId'],
                            this['_buildDreaminaTaskPatch'](value124, {
                              recovering: false,
                              startedAt: startedAt14,
                            }),
                          )
                        : this['_applyDreaminaTaskSnapshot'](value124, {
                            recovering: false,
                            startedAt: startedAt14,
                          });
                      signal4['onTaskId']?.(submitId6);
                      return;
                    }
                    if (cancellable3) {
                      ((this['_rhTaskId'] = submitId6), signal4['onTaskId']?.(submitId6));
                      const rhTaskUseOpenapiQuery2 = handler2(signal4, this['nodeId']);
                      handler3(signal4, this['nodeId'], {
                        rhStatusMessage: null,
                        rhStatusCode: null,
                        rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery2?.['rhTaskUseOpenapiQuery'] === true,
                      });
                      !signal4['isBackgroundTask']?.() &&
                        (this['_syncLocalTaskNodeData'](), this['_persistRunningHubResumeCache']());
                      const apiKey3 = this['_rhApiKey'] || '';
                      this['_rhCancelRequested'] &&
                        !this['_rhRemoteCancelSent'] &&
                        apiKey3 &&
                        submitId6 &&
                        ((this['_rhRemoteCancelSent'] = true),
                        (async () => {
                          if (value119 !== this['_rhGenToken']) return;
                          const cancelledBuilder2 = ({ remoteResult: remoteResult2, remoteError: remoteError2 }) => {
                            const count11 = Number(remoteResult2?.['code']),
                              rhStatusMessage3 = remoteError2
                                ? remoteError2['message'] || videoTaskText('cancel.failed')
                                : count11 === 0
                                  ? videoTaskText('cancel.success')
                                  : count11 === 807
                                    ? videoTaskText('cancel.taskNotFound')
                                    : remoteResult2?.['msg'] || videoTaskText('cancel.failed');
                            return {
                              rhStatusMessage: rhStatusMessage3,
                              rhStatusCode: Number['isFinite'](count11) ? count11 : null,
                              videos: [],
                              videoUrl: '',
                              localPath: '',
                              ...this['_buildRunningHubTaskPatch']({
                                taskId: submitId6,
                                status: 'cancelled',
                                startedAt: startedAt14,
                                recovering: false,
                                useOpenapiQuery:
                                  store['getState']()['nodes']?.[this['nodeId']]?.[
                                    'rhTaskUseOpenapiQuery'
                                  ] === true,
                              }),
                            };
                          };
                          await cancelTask(this['nodeId'], {
                            store: store,
                            taskId: submitId6,
                            cancellable: true,
                            cancel: ({ taskId: taskId8 }) =>
                              api['cancelRunningHubWorkflowTask']({
                                apiKey: apiKey3,
                                taskId: taskId8,
                                providerProfileId:
                                  providerId?.['providerProfileId'] ||
                                  providerId?.['rhProviderProfileId'] ||
                                  '',
                              }),
                            cancelledBuilder: cancelledBuilder2,
                            spec: createGenerationCancelPlanFromNode({
                              kind: 'video',
                              node: store['getState']()['nodes']?.[this['nodeId']] || {},
                              taskProtocol: 'workflow',
                              sourceNodeId: this['nodeId'],
                              targetNodeId: this['nodeId'],
                              trigger: 'node',
                              taskType: 'video-generation',
                              payload: providerId,
                              taskId: submitId6,
                              cancellable: true,
                              resumable: true,
                              cancelledBuilder: cancelledBuilder2,
                            }),
                          });
                          if (value119 !== this['_rhGenToken']) return;
                          this['_persistRunningHubResumeCache']();
                        })());
                      return;
                    }
                    if (async2) {
                      const value125 = handler2(signal4, this['nodeId']);
                      (signal4['onTaskId']?.(submitId6),
                        handler3(signal4, this['nodeId'], {
                          asyncTaskProvider: String(
                            value125?.['asyncTaskProvider'] ||
                              provider5 ||
                              this['_data']?.['provider'] ||
                              '',
                          )
                            ['trim']()
                            ['toLowerCase'](),
                          asyncTaskKind: 'video',
                        }),
                        !signal4['isBackgroundTask']?.() &&
                          (this['_syncLocalTaskNodeData'](), this['_persistAsyncResumeCache']()));
                    }
                  },
                  onProgress: resumable
                    ? async (value126) => {
                        if (value119 !== this['_rhGenToken']) return;
                        signal4['isBackgroundTask']?.()
                          ? handler3(
                              signal4,
                              this['nodeId'],
                              this['_buildDreaminaTaskPatch'](value126, {
                                recovering: false,
                                startedAt: startedAt14,
                              }),
                            )
                          : this['_applyDreaminaTaskSnapshot'](value126, {
                              recovering: false,
                              startedAt: startedAt14,
                            });
                      }
                    : undefined,
                }),
              cancel: cancellable3
                ? async ({ taskId: taskId9 }) => {
                    const apiKey4 = this['_rhApiKey'] || providerId['apiKey'] || '',
                      taskId10 = String(taskId9 || '')['trim']();
                    if (!apiKey4 || !taskId10) return null;
                    return api['cancelRunningHubWorkflowTask']({
                      apiKey: apiKey4,
                      taskId: taskId10,
                      providerProfileId:
                        providerId?.['providerProfileId'] || providerId?.['rhProviderProfileId'] || '',
                    });
                  }
                : undefined,
              resultBuilder: (value127, startedAt15) => {
                const value128 = this['_applyDreaminaSuccessResult'](
                    value127,
                    startedAt15['startedAt'],
                    null,
                    { writeStore: false, returnPatch: true },
                  ),
                  value129 = { ...(value128?.['patch'] || {}) };
                if (cancellable3) {
                  const useOpenapiQuery4 = startedAt15['getTaskNode']?.() || {};
                  Object['assign'](
                    value129,
                    { rhStatusMessage: null, rhStatusCode: null },
                    this['_buildRunningHubTaskPatch']({
                      taskId:
                        String(this['_rhTaskId'] || '')['trim']() ||
                        String(useOpenapiQuery4?.['rhTaskId'] || '')['trim'](),
                      status: 'success',
                      startedAt: startedAt15['startedAt'],
                      recovering: false,
                      useOpenapiQuery: useOpenapiQuery4?.['rhTaskUseOpenapiQuery'] === true,
                    }),
                  );
                } else {
                  if (async2) {
                    const value130 = startedAt15['getTaskNode']?.() || {};
                    Object['assign'](
                      value129,
                      this['_buildAsyncTaskPatch']({
                        provider: String(value130?.['asyncTaskProvider'] || provider5 || '')['trim'](),
                        kind: 'video',
                        taskId: String(value130?.['asyncTaskId'] || '')['trim'](),
                        status: 'success',
                        startedAt: startedAt15['startedAt'],
                        recovering: false,
                      }),
                    );
                  }
                }
                return value129;
              },
              failureBuilder: (error8, startedAt16) => {
                const error9 = error8?.['message'] || videoTaskText('task.generationFailed');
                if (resumable && this['_isDreaminaPollTimeoutError'](error8)) {
                  const value131 = startedAt16['getTaskNode']?.() || {},
                    value132 = String(value131?.['dreaminaSubmitId'] || '')['trim'](),
                    value133 = this['_buildDreaminaBackgroundPendingSnapshot'](value132);
                  return Object['assign'](
                    {
                      isGenerating: true,
                      jobStatus: 'running',
                      jobError: null,
                      generationDuration: Date['now']() - startedAt16['startedAt'],
                    },
                    this['_buildDreaminaTaskPatch'](value133, {
                      recovering: false,
                      startedAt: Number(
                        value131?.['dreaminaTaskStartedAt'] ||
                          value131?.['generationStartTime'] ||
                          startedAt16['startedAt'],
                      ),
                    }),
                  );
                }
                const value134 =
                  String(error8?.['code'] || '') === 'SUBSCRIPTION_REQUIRED'
                    ? {}
                    : buildVideoGenerationFailurePatch({
                        error: error9,
                        startedAt: startedAt16['startedAt'],
                        duration: Date['now']() - startedAt16['startedAt'],
                      });
                if (resumable) {
                  const value135 = startedAt16['getTaskNode']?.() || {},
                    value136 = this['_buildDreaminaFailedSnapshot'](
                      value135?.['dreaminaSubmitId'] || '',
                      error9,
                    );
                  (Object['assign'](
                    value134,
                    this['_buildDreaminaTaskPatch'](value136, {
                      recovering: false,
                      startedAt: startedAt16['startedAt'],
                    }),
                  ),
                    this['_emitDreaminaTaskCenterUpdate'](value136, {
                      status: 'failed',
                      error: error9,
                      startedAt: startedAt16['startedAt'],
                    }));
                }
                if (cancellable3) {
                  const useOpenapiQuery5 = startedAt16['getTaskNode']?.() || {};
                  Object['assign'](
                    value134,
                    {
                      rhStatusMessage: error9,
                      rhStatusCode: Number['isFinite'](Number(error8?.['code']))
                        ? Number(error8['code'])
                        : null,
                    },
                    this['_buildRunningHubTaskPatch']({
                      taskId:
                        String(this['_rhTaskId'] || '')['trim']() ||
                        String(useOpenapiQuery5?.['rhTaskId'] || '')['trim'](),
                      status: 'failed',
                      startedAt: startedAt16['startedAt'],
                      recovering: false,
                      useOpenapiQuery: useOpenapiQuery5?.['rhTaskUseOpenapiQuery'] === true,
                    }),
                  );
                }
                if (async2) {
                  const value137 = startedAt16['getTaskNode']?.() || {};
                  Object['assign'](
                    value134,
                    this['_buildAsyncTaskPatch']({
                      provider: String(value137?.['asyncTaskProvider'] || provider5 || '')['trim'](),
                      kind: 'video',
                      taskId: String(value137?.['asyncTaskId'] || '')['trim'](),
                      status: 'failed',
                      startedAt: startedAt16['startedAt'],
                      recovering: false,
                    }),
                  );
                }
                return value134;
              },
              cancelledBuilder: (startedAt17) => {
                const useOpenapiQuery6 = startedAt17['getTaskNode']?.() || {};
                return {
                  videos: [],
                  videoUrl: '',
                  localPath: '',
                  generationDuration: Date['now']() - startedAt17['startedAt'],
                  ...(cancellable3
                    ? {
                        rhStatusMessage: videoTaskText('task.generationCancelled'),
                        rhStatusCode: null,
                        ...this['_buildRunningHubTaskPatch']({
                          taskId:
                            String(this['_rhTaskId'] || '')['trim']() ||
                            String(useOpenapiQuery6?.['rhTaskId'] || '')['trim'](),
                          status: 'cancelled',
                          startedAt: startedAt17['startedAt'],
                          recovering: false,
                          useOpenapiQuery: useOpenapiQuery6?.['rhTaskUseOpenapiQuery'] === true,
                        }),
                      }
                    : {}),
                };
              },
              parseError: (value138) =>
                getGenerationErrorMessage(value138, videoTaskText('task.generationFailed')),
            }),
            { store: store, startedAt: startedAt14, abortController: this['_rhAbortController'] },
          );
          if (response7['status'] === 'pending') return response7;
          if (response7['status'] === 'success') {
            const videoGenerationResult4 = normalizeVideoGenerationResult(response7['result'])['items'];
            this['_finalizeVideoSuccessSideEffects'](videoGenerationResult4, startedAt14);
            if (resumable) this['_persistDreaminaResumeCache']();
            if (cancellable3) this['_persistRunningHubResumeCache']();
            if (async2) this['_persistAsyncResumeCache']();
            return response7;
          }
          const error10 = response7['error'];
          if (
            response7['status'] === 'failed' &&
            String(error10?.['code'] || '') === 'SUBSCRIPTION_REQUIRED'
          ) {
            const value139 = String(error10?.['requiredModelId'] || '')['trim'](),
              modelId2 = value139 || this['_data']?.['model'] || '',
              provider7 = String(this['_data']?.['provider'] || '')['trim'](),
              handler6 = window['handleSubscriptionRequired'];
            if (typeof handler6 === 'function')
              await handler6({ modelId: modelId2, provider: provider7, error: error10 });
            else {
              if (typeof window['openSubscriptionDialog'] === 'function') {
                const response8 = window['getSubscriptionState']?.() || {};
                String(response8['status'] || '')['toLowerCase']() !== 'active'
                  ? window['openSubscriptionDialog']({ modelId: modelId2, provider: provider7 })
                  : window['showToast']?.(
                      error10?.['message'] || videoTaskText('toasts.subscriptionSyncing'),
                      'warning',
                    );
              }
            }
            return response7;
          }
          if (response7['status'] === 'failed' && resumable && this['_isDreaminaPollTimeoutError'](error10))
            return (
              this['_persistDreaminaResumeCache'](),
              this['_showDreaminaBackgroundQueueingToast'](
                store['getState']()['nodes']?.[this['nodeId']]?.['dreaminaSubmitId'] || '',
              ),
              response7
            );
          if (response7['status'] === 'failed') {
            const message2 = error10?.['message'] || '',
              showRunningHubMediaUploadGuideForError2 = showRunningHubMediaUploadGuideForError(error10),
              enabled20 =
                !showRunningHubMediaUploadGuideForError2 &&
                showProviderApiKeyMissingToastForError(error10, {
                  providerId: providerId?.['provider'],
                  model: providerId?.['model'],
                  adapterType: adapterType ? 'modelApi' : providerId?.['adapterType'],
                });
            void logDiagnosticEvent({
              type: 'generation.video_failed',
              level: 'error',
              source: 'renderer',
              message: message2 || videoTaskText('task.videoGenerationFailed'),
              error: error10,
              context: {
                nodeId: this['nodeId'],
                provider: providerId?.['provider'] || '',
                model: providerId?.['model'] || '',
                providerProfileId:
                  providerId?.['providerProfileId'] || providerId?.['rhProviderProfileId'] || '',
                isDreamina: resumable,
                isRhWorkflow: cancellable3,
                isAsyncTaskModel: async2,
              },
            });
            !showRunningHubMediaUploadGuideForError2 &&
              !enabled20 &&
              window['showToast']?.(
                message2,
                'error',
                isDreaminaUploadDurationErrorMessage(message2)
                  ? DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS
                  : undefined,
              );
            if (resumable) this['_persistDreaminaResumeCache']();
            if (cancellable3) this['_persistRunningHubResumeCache']();
            if (async2) this['_persistAsyncResumeCache']();
            return response7;
          }
          return response7;
        } catch (error11) {
          if (cancellable3 && (this['_rhCancelRequested'] || isGenerationAbortError(error11))) return;
          if (String(error11?.['code'] || '') === 'SUBSCRIPTION_REQUIRED') {
            const value140 = String(error11?.['requiredModelId'] || '')['trim'](),
              modelId3 = value140 || this['_data']?.['model'] || '',
              provider8 = String(this['_data']?.['provider'] || '')['trim'](),
              handler7 = window['handleSubscriptionRequired'];
            if (typeof handler7 === 'function')
              await handler7({ modelId: modelId3, provider: provider8, error: error11 });
            else {
              if (typeof window['openSubscriptionDialog'] === 'function') {
                const response9 = window['getSubscriptionState']?.() || {};
                String(response9['status'] || '')['toLowerCase']() !== 'active'
                  ? window['openSubscriptionDialog']({ modelId: modelId3, provider: provider8 })
                  : window['showToast']?.(
                      error11?.['message'] || videoTaskText('toasts.subscriptionSyncing'),
                      'warning',
                    );
              }
            }
            return;
          }
          if (resumable && this['_isDreaminaPollTimeoutError'](error11)) {
            const value141 = store['getState']()['nodes']?.[this['nodeId']] || {},
              value142 = String(value141?.['dreaminaSubmitId'] || '')['trim'](),
              value143 = this['_buildDreaminaBackgroundPendingSnapshot'](value142);
            (store['updateNodeData'](
              this['nodeId'],
              Object['assign'](
                {
                  isGenerating: true,
                  jobStatus: 'running',
                  jobError: null,
                  generationDuration: Date['now']() - startedAt14,
                },
                this['_buildDreaminaTaskPatch'](value143, {
                  recovering: false,
                  startedAt: Number(
                    value141?.['dreaminaTaskStartedAt'] || value141?.['generationStartTime'] || startedAt14,
                  ),
                }),
              ),
            ),
              this['_persistDreaminaResumeCache'](),
              this['_showDreaminaBackgroundQueueingToast'](value142));
            return;
          }
          const message3 = error11?.['message'] || '',
            showRunningHubMediaUploadGuideForError3 = showRunningHubMediaUploadGuideForError(error11),
            enabled21 =
              !showRunningHubMediaUploadGuideForError3 &&
              showProviderApiKeyMissingToastForError(error11, {
                providerId: providerId?.['provider'],
                model: providerId?.['model'],
                adapterType: adapterType ? 'modelApi' : providerId?.['adapterType'],
              });
          void logDiagnosticEvent({
            type: 'generation.video_failed',
            level: 'error',
            source: 'renderer',
            message: message3 || videoTaskText('task.videoGenerationFailed'),
            error: error11,
            context: {
              nodeId: this['nodeId'],
              provider: providerId?.['provider'] || '',
              model: providerId?.['model'] || '',
              providerProfileId: providerId?.['providerProfileId'] || providerId?.['rhProviderProfileId'] || '',
              isDreamina: resumable,
              isRhWorkflow: cancellable3,
              isAsyncTaskModel: async2,
            },
          });
          !showRunningHubMediaUploadGuideForError3 &&
            !enabled21 &&
            window['showToast']?.(
              message3,
              'error',
              isDreaminaUploadDurationErrorMessage(message3)
                ? DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS
                : undefined,
            );
          const submitId7 = buildVideoGenerationFailurePatch({
            error: message3 || videoTaskText('task.generationFailed'),
            startedAt: startedAt14,
            duration: Date['now']() - startedAt14,
          });
          resumable &&
            Object['assign'](
              submitId7,
              this['_buildDreaminaTaskPatch'](
                this['_buildDreaminaFailedSnapshot'](
                  store['getState']()['nodes']?.[this['nodeId']]?.['dreaminaSubmitId'] || '',
                  error11?.['message'] || videoTaskText('task.generationFailed'),
                ),
                { recovering: false, startedAt: startedAt14 },
              ),
            );
          cancellable3 &&
            Object['assign'](
              submitId7,
              {
                rhStatusMessage: error11?.['message'] || videoTaskText('task.generationFailed'),
                rhStatusCode: Number['isFinite'](Number(error11?.['code']))
                  ? Number(error11['code'])
                  : null,
              },
              this['_buildRunningHubTaskPatch']({
                taskId:
                  String(this['_rhTaskId'] || '')['trim']() ||
                  String(store['getState']()['nodes']?.[this['nodeId']]?.['rhTaskId'] || '')['trim'](),
                status: 'failed',
                startedAt: startedAt14,
                recovering: false,
                useOpenapiQuery:
                  store['getState']()['nodes']?.[this['nodeId']]?.['rhTaskUseOpenapiQuery'] === true,
              }),
            );
          if (async2) {
            const value144 = store['getState']()['nodes']?.[this['nodeId']] || {};
            Object['assign'](
              submitId7,
              this['_buildAsyncTaskPatch']({
                provider: String(value144?.['asyncTaskProvider'] || provider5 || '')['trim'](),
                kind: 'video',
                taskId: String(value144?.['asyncTaskId'] || '')['trim'](),
                status: 'failed',
                startedAt: startedAt14,
                recovering: false,
              }),
            );
          }
          resumable &&
            this['_emitDreaminaTaskCenterUpdate'](
              {
                submitId: submitId7['dreaminaSubmitId'],
                status: submitId7['dreaminaTaskStatus'],
                phase: submitId7['dreaminaTaskPhase'],
                label: submitId7['dreaminaTaskLabel'],
                failReason: message3,
              },
              { status: 'failed', error: message3, startedAt: startedAt14 },
            );
          store['updateNodeData'](this['nodeId'], submitId7);
          if (resumable) this['_persistDreaminaResumeCache']();
          if (cancellable3) this['_persistRunningHubResumeCache']();
          if (async2) this['_persistAsyncResumeCache']();
        } finally {
          const value145 = this['_syncLocalTaskNodeData'](),
            shouldShowGenerationBusyUi4 = shouldShowGenerationBusyUi(value145);
          this['_isGenerating'] = shouldShowGenerationBusyUi4;
          resumable && !shouldShowGenerationBusyUi4 && (this['_dreaminaActiveSubmitId'] = '');
          this['_rhAbortController'] = null;
          if (cancellable3 && shouldShowGenerationBusyUi4) {
            const value146 = String(value145?.['rhTaskId'] || '')['trim']();
            if (value146) this['_rhTaskId'] = value146;
          } else {
            this['_rhTaskId'] = null;
            if (!this['_rhCancelRequested']) this['_rhApiKey'] = null;
          }
          shouldShowGenerationBusyUi4
            ? this['_updateSubmitButtonState']?.()
            : (this['_resetGenerateButtonIdleUi']({ cancellable: cancellable3 }),
              stopLoading(this['previewEl']),
              this['_updateSubmitButtonState']?.());
        }
      } finally {
        (promise['restoreBeforeTaskStart'](),
          releasePayloadObjectUrlLease(value117),
          (this['_videoSubmitInFlight'] = false));
      }
    }
    async ['_buildPayloadImpl'](template2 = null, value147 = {}) {
      const payloadObjectUrlLease = createPayloadObjectUrlLease({
        ownerId: 'ai-video:' + this['nodeId'] + ':payload',
        kind: 'image',
      });
      try {
        const state2 = store['getState']?.() || {},
          value148 = state2['nodes']?.[this['nodeId']];
        value148 && typeof value148 === 'object' && (this['_data'] = value148);
        let inEdges = store['getIncomingEdges'](this['nodeId']);
        shouldScopeRunningHubVideoSubmitEdges(this['_data'] || {}) &&
          (inEdges = inEdges['filter']((value149) => value149?.['targetId'] === this['nodeId']));
        const sourceUrl = state2['nodes'] || {};
        let list10 = [],
          initialImageUrls = [];
        const list11 = [];
        for (const value150 of inEdges) {
          const value151 = sourceUrl[value150['sourceId']],
            value152 = String(value151?.['type'] || '')['toLowerCase'](),
            value153 = value152 === 'source-image' || value152 === 'image' || value152 === 'ai-image';
          let generationInputImageUrl = '';
          value153 && (generationInputImageUrl = resolveGenerationInputImageUrl(value151));
          let url = value153 ? generationInputImageUrl : value151?.['videoUrl'] || value151?.['imageUrl'] || '';
          if (String(value151?.['type'] || '') === 'ai-video') {
            const value154 = String(value150?.['sourceMediaKey'] || '')['trim']();
            if (value154) {
              const list12 = Array['isArray'](value151?.['videos']) ? value151['videos'] : [],
                value155 = list12['find']((value156) => {
                  const value157 =
                    String(value156?.['localPath'] || '')['trim']() ||
                    String(value156?.['videoUrl'] || '')['trim']();
                  return value157 === value154;
                });
              value155 &&
                (url =
                  localPathToUrl(value155['localPath']) ||
                  String(value155['videoUrl'] || '')['trim']() ||
                  url);
            }
          }
          if (!url && sourceUrl[value150['sourceId']]?.['sourceId']) {
            const value158 = await getImage(sourceUrl[value150['sourceId']]['sourceId']);
            value158 &&
              (url = payloadObjectUrlLease['create'](value158, {
                sourceUrl: sourceUrl[value150['sourceId']]['sourceId'],
              }));
          }
          if (url && !list10['includes'](url)) list10['push'](url);
          if (url)
            list11['push']({ type: resolveEffectiveInputKind(value151, value150), url: url });
          if (value153) {
            const enabled22 = String(generationInputImageUrl || url || '')['trim']();
            enabled22 &&
              !enabled22['startsWith']('blob:') &&
              !initialImageUrls['includes'](enabled22) &&
              initialImageUrls['push'](enabled22);
          }
        }
        const assetInputRefs = [],
          assetMediaCounts = createPromptMediaReferenceState(list11),
          prompt = resolvePresetPromptTextWithTextRefs({
            template: template2,
            promptEl: this['promptEl'],
            inEdges: inEdges,
            nodes: sourceUrl,
            assetInputRefs: assetInputRefs,
            assetMediaCounts: assetMediaCounts['mediaCounts'],
            assetDedupeState: assetMediaCounts['dedupeState'],
            dedupeAssetMentions: true,
            allowedAssetTypes: ['text', 'image', 'video', 'audio'],
          }),
          model2 = this['_data']['model'] || getDefaultRunningHubVideoWorkflowModelId(),
          isDreaminaStyleVideoModel2 = isDreaminaStyleVideoModel(model2, this['_data']['provider'])
            ? resolveDreaminaStyleVideoProvider(model2, this['_data']['provider'])
            : '',
          provider9 = this['_data']['provider'] || isDreaminaStyleVideoModel2 || resolveModelProvider(model2) || 'grsai',
          isRunningHubWorkflowNode2 = isRunningHubWorkflowNode({ ...this['_data'], model: model2, provider: provider9 });
        if (isRunningHubWorkflowNode2) {
          const value159 = sourceUrl?.[this['nodeId']] || this['_data'] || {};
          assetInputRefs['push'](
            ...getPromptAssetInputRefsFromNode(value159, { allowedTypes: ['image', 'video', 'audio'] }),
          );
        }
        for (const response10 of assetInputRefs) {
          if (response10['url'] && !list10['includes'](response10['url']))
            list10['push'](response10['url']);
          response10['type'] === 'image' &&
            response10['url'] &&
            !initialImageUrls['includes'](response10['url']) &&
            initialImageUrls['push'](response10['url']);
        }
        const isDreaminaStyleVideoModel3 = isDreaminaStyleVideoModel(model2, provider9),
          inputUrls = isDreaminaStyleVideoModel3 ? initialImageUrls['slice'](0, 1) : list10,
          modelManifest =
            resolveModelExecution(model2, { providerHint: provider9 }) || resolveModelExecution(model2),
          value160 =
            modelManifest?.['modelManifest']?.['adapterType'] === 'modelApi' &&
            modelManifest?.['modelManifest']?.['kind'] === 'video' &&
            modelManifest?.['executionManifest']?.['adapterType'] === 'modelApi',
          value161 = this['_isRunninghubWorkflowModel'](model2, provider9) || isRunningHubWorkflowNode2;
        if (value160) {
          const error12 = validateModelApiVideoPrompt({
            model: model2,
            provider: provider9,
            prompt: prompt,
          });
          if (!error12['ok']) return (window['showToast']?.(error12['message'], 'warn'), null);
        }
        const response11 = evaluateGenerationPromptBoundary({
          model: model2,
          provider: provider9,
          promptText: prompt,
          hasInput: false,
        });
        if (!response11['ok']) return null;
        const value162 = this['_data']['resolution'] || '1080p',
          rhInstanceType = value161
            ? normalizeRunningHubInstanceType(
                resolveVideoWorkflowSchemaParam(this['_data'], model2, 'rhInstanceType'),
              )
            : this['_data']['rhInstanceType'],
          value163 = String(
            sourceUrl?.[this['nodeId']]?.['providerProfileId'] ||
              sourceUrl?.[this['nodeId']]?.['rhProviderProfileId'] ||
              this['_data']?.['providerProfileId'] ||
              this['_data']?.['rhProviderProfileId'] ||
              '',
          )['trim'](),
          providerProfileId2 = resolveModelGenerationProviderProfileId(model2, provider9, value163);
        await ensureConfig();
        const value164 = getProviderConfig(providerProfileId2 || provider9);
        let apiKey5 = '';
        if (provider9 === 'runninghub')
          apiKey5 = isModelApiModel(model2, provider9)
            ? value164['modelApiKey'] || ''
            : value164['apiKey'] || '';
        else
          provider9 === 'runninghubwf'
            ? (apiKey5 = value164['apiKey'] || '')
            : (apiKey5 = value164['apiKey'] || '');
        const args7 = getPlainObject(this['_data']['generationParams']),
          aspectRatio = (value165, value166) =>
            Object['prototype']['hasOwnProperty']['call'](args7, value165)
              ? args7[value165]
              : value166,
          payload4 = {
            prompt: prompt,
            model: model2,
            generationParams: { ...args7 },
            aspectRatio: aspectRatio('aspectRatio', this['_data']['aspectRatio'] || '1:1'),
            resolution: aspectRatio('resolution', value162),
            videoSize: aspectRatio('resolution', value162),
            duration: aspectRatio('duration', this['_data']['duration'] || 5),
            mode: this['_data']['mode'] || '全能参考',
            provider: provider9,
            ...(providerProfileId2 ? { providerProfileId: providerProfileId2 } : {}),
            apiKey: apiKey5,
            cameraAngle: this['_data']['cameraAngle'],
            inputUrls: inputUrls,
            rhInstanceType: rhInstanceType,
            installId: String(window['__aicInstallId'] || '')['trim'](),
          };
        if (value147?.['randomizeSubmitParams'] === true && value160) {
          const args8 = buildSubmitRandomizedSeedPatch({
            modelManifest: modelManifest?.['modelManifest'] || null,
            nodeData: this['_data'],
            payload: payload4,
          });
          args8 &&
            ((payload4['generationParams'] = args8['requestParams']),
            store['updateNodeData']?.(this['nodeId'], args8['storePatch']),
            (this['_data'] = { ...(this['_data'] || {}), ...args8['storePatch'] }));
        }
        const inputMaterials = resolveVideoSubmitInputMaterials({
          inEdges: inEdges,
          nodes: sourceUrl,
          assetInputRefs: assetInputRefs,
          initialImageUrls: initialImageUrls,
          resolveMediaUrl: (value167) => this['_resolveMediaUrl'](value167),
        });
        if (
          !(await applySegmentRetakeTaskPayload(this, {
            inputMaterials: inputMaterials,
            payload: payload4,
            store: store,
          }))
        )
          return null;
        const {
          getAudioUrl: getAudioUrl,
          getImageUrl: getImageUrl,
          getMaskImageUrl: getMaskImageUrl,
          getVideoUrl: getVideoUrl,
        } = inputMaterials['helpers'];
        if (isDreaminaStyleVideoModel3) {
          let model3 = this['_data'];
          typeof this['_normalizeDreaminaNodeData'] === 'function' &&
            ((model3 =
              this['_normalizeDreaminaNodeData'](this['_data'], { syncStore: true }) || this['_data']),
            (this['_data'] = model3));
          const args9 = getPlainObject(model3?.['generationParams']),
            handler8 = (value168, value169) => {
              const value170 = Array['isArray'](value168) ? value168 : [value168];
              for (const value171 of value170) {
                const value172 = String(value171 || '')['trim']();
                if (value172 && Object['prototype']['hasOwnProperty']['call'](args9, value172))
                  return args9[value172];
              }
              return value169;
            },
            provider10 = resolveDreaminaStyleVideoProvider(
              model3?.['model'] || model2,
              model3?.['provider'] || provider9,
            ),
            {
              images: images,
              videos: videos6,
              audios: audios,
              videoEntries: videoEntries,
              audioEntries: audioEntries,
              providerAssetRefs: providerAssetRefs,
            } = inputMaterials['dreamina'],
            response12 = validateModelMediaInputLimits({
              inputSlots: modelManifest?.['modelManifest']?.['inputSlots'] || null,
              images: images,
              videos: videos6,
              audios: audios,
              videoEntries: videoEntries,
              audioEntries: audioEntries,
            });
          if (!response12['ok'])
            return (window['showToast']?.(getModelMediaInputLimitMessage(response12), 'warn'), null);
          const routeMode = normalizeDreaminaVideoRouteMode(
            handler8(
              ['dreaminaRouteMode', 'volcengine_seedance_2_mode', 'rh_seedance_2_mode'],
              model3?.['dreaminaRouteMode'],
            ),
            model3?.['mode'],
          );
          if (!isDreaminaVideoRouteModeEnabled(routeMode))
            return (window['showToast']?.(videoTaskText('toasts.smartMultiframeUnavailable'), 'warn'), null);
          const taskType = resolveDreaminaVideoTaskType({
              routeMode: routeMode,
              imageCount: images['length'],
              videoCount: videos6['length'],
              audioCount: audios['length'],
            }),
            validateDreaminaVideoRouteSelection2 = validateDreaminaVideoRouteSelection({
              routeMode: routeMode,
              taskType: taskType,
              model: model3?.['model'],
              provider: provider10,
              imageCount: images['length'],
              videoCount: videos6['length'],
              audioCount: audios['length'],
            });
          if (validateDreaminaVideoRouteSelection2) return (window['showToast']?.(validateDreaminaVideoRouteSelection2, 'warn'), null);
          const model4 =
              ensureDreaminaStyleVideoModelForTask(
                taskType,
                normalizeDreaminaStyleVideoModel(model3?.['model'], provider10),
                provider10,
              ) || normalizeDreaminaStyleVideoModel(model3?.['model'], provider10),
            resolution = normalizeDreaminaStyleVideoResolution(
              taskType,
              model4,
              handler8('resolution', model3?.['resolution'] || model3?.['videoSize']),
              provider10,
            ),
            aspectRatio2 = normalizeDreaminaVideoAspectRatio(
              handler8('aspectRatio', model3?.['aspectRatio']),
            ),
            duration = normalizeDreaminaStyleVideoDuration(
              taskType,
              model4,
              handler8('duration', model3?.['duration']),
              provider10,
            ),
            dreaminaStyleVideoDefaultModel = getDreaminaStyleVideoDefaultModel(taskType, provider10),
            model5 = {
              prompt: prompt,
              provider: provider10,
              model: model4 || dreaminaStyleVideoDefaultModel,
              generationParams: { ...args9 },
              modelVersion:
                provider10 === 'dreamina' ? getDreaminaStyleVideoModelVersion(model4, provider10) : '',
              dreaminaRouteMode: routeMode,
              dreaminaTaskType: taskType,
              aspectRatio: aspectRatio2,
              duration: duration,
              resolution: resolution,
              videoResolution: resolution,
              videoSize: resolution,
              images: images,
              videos: videos6,
              audios: audios,
              inputUrls: images['slice'](),
              providerAssetRefs: providerAssetRefs,
              installId: String(window['__aicInstallId'] || '')['trim'](),
            };
          Object['keys'](args9)['length'] <= 0 && delete model5['generationParams'];
          applyVideoNodeAdaptiveAspectRatio(model5, {
            inEdges: inEdges,
            nodes: sourceUrl,
            nodeData: model3,
            provider: provider10,
            model: model5['model'],
            modelManifest: modelManifest?.['modelManifest'] || null,
          });
          if (providerAssetRefs['length'] <= 0) delete model5['providerAssetRefs'];
          if (!model5['modelVersion']) delete model5['modelVersion'];
          !resolution &&
            (delete model5['resolution'],
            delete model5['videoResolution'],
            delete model5['videoSize']);
          if (taskType === 'text2video') {
            if (!prompt) return null;
            return (
              (model5['inputUrls'] = []),
              (model5['images'] = []),
              (model5['videos'] = []),
              (model5['audios'] = []),
              payloadObjectUrlLease['bind'](model5)
            );
          }
          if (taskType === 'image2video') {
            if (!prompt || !images[0]) return null;
            ((model5['image'] = images[0]),
              (model5['inputUrls'] = [images[0]]),
              (model5['images'] = [images[0]]));
            if (provider10 === 'dreamina') delete model5['aspectRatio'];
            return payloadObjectUrlLease['bind'](model5);
          }
          if (taskType === 'frames2video') {
            if (!prompt || images['length'] < 2) return null;
            ((model5['first'] = images[0]),
              (model5['last'] = images[1]),
              (model5['inputUrls'] = images['slice'](0, 2)),
              (model5['images'] = images['slice'](0, 2)));
            if (provider10 === 'dreamina') delete model5['aspectRatio'];
            return payloadObjectUrlLease['bind'](model5);
          }
          if (taskType === 'multiframe2video') {
            const list13 = images['slice'](0, 20);
            if (list13['length'] < 2) return null;
            const value173 = Math['max'](0, list13['length'] - 1),
              value174 = Array['isArray'](model3?.['dreaminaTransitionPrompts'])
                ? model3['dreaminaTransitionPrompts']
                : [],
              value175 = Array['isArray'](model3?.['dreaminaTransitionDurations'])
                ? model3['dreaminaTransitionDurations']
                : [],
              list14 = [],
              list15 = [];
            for (let value176 = 0; value176 < value173; value176 += 1) {
              const value177 = String(value174[value176] || '')['trim']() || prompt,
                count12 = Number(value175[value176]),
                value178 =
                  Number['isFinite'](count12) && count12 > 0
                    ? Math['max'](1, Math['trunc'](count12))
                    : 3;
              (list14['push'](value177), list15['push'](value178));
            }
            if (!prompt && !list14['some']((value179) => String(value179 || '')['trim']()))
              return null;
            return (
              (model5['images'] = list13),
              (model5['inputUrls'] = list13['slice']()),
              (model5['transitionPrompts'] = list14),
              (model5['transitionDurations'] = list15),
              list13['length'] === 2 &&
                ((model5['prompt'] = list14[0] || prompt),
                (model5['duration'] = list15[0] || 3),
                delete model5['transitionPrompts'],
                delete model5['transitionDurations']),
              delete model5['modelVersion'],
              delete model5['model'],
              delete model5['aspectRatio'],
              delete model5['resolution'],
              delete model5['videoResolution'],
              delete model5['videoSize'],
              payloadObjectUrlLease['bind'](model5)
            );
          }
          if (taskType === 'multimodal2video') {
            if (images['length'] <= 0 && videos6['length'] <= 0 && audios['length'] <= 0)
              return null;
            if (!model5['modelVersion']) {
              if (provider10 === 'dreamina')
                ((model5['model'] = dreaminaStyleVideoDefaultModel || model5['model']),
                  (model5['modelVersion'] = getDreaminaStyleVideoModelVersion(
                    model5['model'],
                    provider10,
                  )));
              else !model5['model'] && (model5['model'] = APIMART_DREAMINA_VIDEO_DEFAULT_MODEL);
            }
            return payloadObjectUrlLease['bind'](applySegmentRetakeSubmitParameterPolicy(model3, model5));
          }
          return null;
        }
        if (value161) {
          const runningHubVideoWorkflowSubmitPatch = await buildRunningHubVideoWorkflowSubmitPatch({
            model: model2,
            nodeData: this['_data'],
            inEdges: inEdges,
            nodes: sourceUrl,
            assetInputRefs: assetInputRefs,
            inputMaterials: inputMaterials['modelApi'],
            prompt: prompt,
            helpers: {
              getVideoUrl: getVideoUrl,
              getImageUrl: getImageUrl,
              getMaskImageUrl: getMaskImageUrl,
              getAudioUrl: getAudioUrl,
            },
          });
          if (runningHubVideoWorkflowSubmitPatch === null) return null;
          return (
            Object['assign'](payload4, runningHubVideoWorkflowSubmitPatch['payloadPatch'] || {}),
            applyVideoNodeAdaptiveAspectRatio(payload4, {
              inEdges: inEdges,
              nodes: sourceUrl,
              nodeData: this['_data'],
              provider: provider9,
              model: model2,
              modelManifest: modelManifest?.['modelManifest'] || null,
            }),
            Object['keys'](runningHubVideoWorkflowSubmitPatch['updateData'] || {})['length'] > 0 &&
              store['updateNodeData'](this['nodeId'], runningHubVideoWorkflowSubmitPatch['updateData']),
            payloadObjectUrlLease['bind'](payload4)
          );
        }
        if (value160 && !isDreaminaStyleVideoModel3) {
          const error13 = compileModelApiVideoSubmit({
            payload: payload4,
            model: model2,
            provider: provider9,
            nodeData: this['_data'],
            modelExecution: modelManifest,
            inputMaterials: inputMaterials['modelApi'],
            assetInputRefs: assetInputRefs,
            assetVideoCount: inputMaterials['assetVideoCount'],
            inEdges: inEdges,
            nodes: sourceUrl,
          });
          if (!error13['ok']) return (window['showToast']?.(error13['message'], 'warn'), null);
          return payloadObjectUrlLease['bind'](
            applySegmentRetakeSubmitParameterPolicy(this['_data'], error13['payload']),
          );
        }
        return payloadObjectUrlLease['bind'](payload4);
      } finally {
        payloadObjectUrlLease['release']();
      }
    }
  }
  return value5['prototype'];
}
