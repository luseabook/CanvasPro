import { openDebugRequestWindow, renderRequestDebugButton } from './debugRequestWindow.js';
import { buildGenerationDebugPreview } from '../utils/generationDebugPreview.js';
import { cancelRunningHubAudioTask, generateAudio } from '../../api/aiAudioApi.js';
import {
  AUDIO_VOICE_TRANSLATION_PROVIDER_ID,
  translateAudioVoiceSegments,
} from '../../api/audioVoiceTranslationApi.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { testProviderConnection } from '../../api/providerConnectionTestApi.js';
import {
  cancelElectronMediaTask,
  enqueueElectronMediaTask,
  waitForElectronMediaTask,
} from '../../api/localMediaTaskApi.js';
import { buildAudioGenerationResultPatch } from '../components/audio-node/audioGenerationResultRenderer.js';
import {
  buildAudioWorkflowItems,
  buildAudioWorkflowMenuGroups,
} from '../components/audio-node/audioModelMenuHelpers.js';
import {
  doesAudioWorkflowSupportMultipleAudioInputs,
  getAudioWorkflowSlots,
  normalizeAudioWorkflowRefSlots,
} from '../components/audio-node/audioWorkflowRefSlots.js';
import { createPromptAttachmentButtonHTML } from '../components/refAttachmentButton.js';
import { resolveGenerationButtonMode, shouldAllowCancel } from '../core/generationTaskUiState.js';
import { cancelTask, submitTask } from '../core/generationTaskRuntime.js';
import { createTaskBatchCancellationController } from '../core/taskBatchExecution.js';
import { t } from '../i18n/index.js';
import {
  AUDIO_VOICE_ASR_PROVIDER_IDS,
  assertAudioVoiceAsrResult,
  getAudioVoiceAsrProvider,
  getAudioVoiceAsrProviderOptions,
  normalizeAudioVoiceAsrProvider,
} from './audioVoiceAsrProviders.js';
export { normalizeAudioVoiceAsrProvider } from './audioVoiceAsrProviders.js';
import { translateManifestText } from '../i18n/manifestText.js';
import { normalizeAudioVoiceAnalyzeSegments as normalizeAudioVoiceAnalyzeSegments_2 } from './audioVoiceAnalysisSegments.js';
import { createAudioVoiceAnalysisSession } from './audioVoiceAnalysisSession.js';
import { createAudioVoiceConfirmDialog } from './audioVoiceConfirmDialog.js';
import {
  createAudioVoiceTaskProgressTracker,
  prepareAudioVoiceLocalAsr,
} from './audioVoiceLocalAsrRuntime.js';
import {
  createAudioVoiceInitialAnalysisProgress,
  getAudioVoiceAnalyzeErrorMessage,
  recoverAudioVoiceLocalAsrRuntime,
} from './audioVoiceRuntimeRepairFlow.js';
import { AUDIO_VOICE_STUDIO_VIP_MODEL_ID } from './subscriptionAccess.js';
import {
  resolveCanvasAudioLocalPath,
  resolveCanvasAudioUrl,
  resolveCanvasVideoLocalPath,
  resolveCanvasVideoPosterUrl,
} from '../services/canvasMediaLocalService.js';
import { pickAudioDurationSec } from '../services/audioMetadataService.js';
import { saveRemoteAudioLocallyDetailed } from '../services/projectService.js';
import { closeVolcengineSpeechApiKeyGuide } from './volcengineSpeechApiKeyGuide.js';
import {
  closeProviderApiKeyGuide,
  openProviderApiKeySettings,
  showProviderApiKeyGuide,
} from './providerApiKeyGuide.js';
import {
  getModelManifest,
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  RH_AUDIO_INDEXTTS2_CLONE_MODEL_ID,
  RH_AUDIO_VOICE_CONVERT_MODEL_ID,
} from '../manifests/index.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import AudioClipController from './AudioClipController.js';
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from './previewGenerateButtonUi.js';
import { showGenerationCompleteNotification } from '../services/completionNotificationService.js';
import { playCompletionSound } from '../services/completionSoundService.js';
import { composeAudioVoiceTimelineNearNode } from './VideoComposeController.js';
import { AUDIO_VOICE_PANEL_OPEN_EVENT } from './audioVoicePanelEvents.js';
import {
  buildAudioVoiceGenerationCompletionMessage,
  notifyAudioVoiceGenerationComplete,
  summarizeAudioVoiceGenerationResults,
} from './audioVoicePanelGenerationFeedback.js';
import { createAudioVoiceTaskRecoveryManager } from './audioVoiceTaskRecovery.js';
import {
  AUDIO_VOICE_SOURCE_CLIP_MIN_MS,
  applyAudioVoiceTranslationResults,
  buildAudioVoiceApplySourceClipPatch,
  buildAudioVoiceSplitSourceSegmentDraft,
  buildAudioVoiceTextEditPatch,
  commitAudioVoiceSourceClipEdit,
  mergeAudioVoiceSourceSegments,
  resolveAudioVoiceSourceClipEditBase,
  shouldCloseAudioVoiceEmptyConvertedTextEdit,
} from './audioVoicePanelSegmentEditing.js';
import {
  createAudioVoicePlaybackSession,
  isAudioVoicePreviewControlTarget,
  prepareAudioVoicePlaybackElement,
} from './audioVoicePlaybackSession.js';
import {
  createAudioVoiceGenerationTaskOrchestration,
  createAudioVoiceGenerationTaskStoreAdapter,
  normalizeAudioVoiceBatchConcurrencyLimit,
  resolveAudioVoiceProviderBatchConcurrency,
  resolveAudioVoiceProviderBatchConcurrencyWithProbe,
  runAudioVoiceBatchGenerationQueue,
} from './audioVoiceGenerationTaskOrchestration.js';
import { createAudioVoiceSegmentEditSession } from './audioVoiceSegmentEditSession.js';
import { createAudioVoiceSegmentMergeController } from './audioVoiceSegmentMergeController.js';
import {
  buildAudioVoiceHistoryEntry,
  cloneAudioVoiceSegment,
  createAudioVoicePayloadError,
  createAudioVoiceSegmentAfter,
  firstNonEmptyString,
  getVisibleAudioVoiceSegments,
  normalizeAudioVoiceHistory,
  normalizeAudioVoiceSegmentModelSelection,
  prependAudioVoiceHistory,
  prependAudioVoiceHistoryEntries,
  resolveSegmentLocalAudioUrl,
} from './audioVoicePanelSegmentState.js';
import {
  AUDIO_VOICE_BATCH_AUDIO_PICK_ID,
  createAudioVoicePanelPickSession,
  isAudioVoiceAudioNode,
  isAudioVoiceSourceNode,
  resolveAudioVoiceSelectionTargetIds,
} from './audioVoicePanelPickSession.js';
import {
  bindAudioVoiceModelSubmenuPosition,
  createAudioVoiceModelIcon,
  createButton,
  createEl,
  iconSvg,
  positionAudioVoiceModelSubmenu,
} from './audioVoicePanelPresentation.js';
import {
  buildAudioVoiceSegmentContextMenuItems,
  buildAudioVoiceSegmentMenuEntries,
  createAudioVoiceSegmentContextMenuController,
  renderAudioVoiceSegmentInlineMenu,
} from './audioVoiceContextMenu.js';
import {
  addAudioVoiceSegmentAudioToCanvas,
  saveAudioVoiceSegmentDownload,
} from './audioVoiceSegmentOutputActions.js';
import {
  AUDIO_VOICE_TRANSLATION_LANGUAGES,
  classifyAudioVoiceTranslationConfigFailure,
  getAudioVoiceTranslationLanguage,
  resolveAudioVoiceTranslationTargets,
} from './audioVoiceTranslation.js';
export { AUDIO_VOICE_PANEL_OPEN_EVENT };
export { positionAudioVoiceModelSubmenu };
export { isAudioVoicePreviewControlTarget, prepareAudioVoicePlaybackElement };
export {
  normalizeAudioVoiceBatchConcurrencyLimit,
  resolveAudioVoiceProviderBatchConcurrency,
  resolveAudioVoiceProviderBatchConcurrencyWithProbe,
  runAudioVoiceBatchGenerationQueue,
};
export {
  applyAudioVoiceTranslationResults,
  buildAudioVoiceApplySourceClipPatch,
  buildAudioVoiceGenerationCompletionMessage,
  buildAudioVoiceHistoryEntry,
  buildAudioVoiceSplitSourceSegmentDraft,
  buildAudioVoiceTextEditPatch,
  commitAudioVoiceSourceClipEdit,
  mergeAudioVoiceSourceSegments,
  normalizeAudioVoiceHistory,
  notifyAudioVoiceGenerationComplete,
  prependAudioVoiceHistory,
  prependAudioVoiceHistoryEntries,
  resolveAudioVoiceSourceClipEditBase,
  shouldCloseAudioVoiceEmptyConvertedTextEdit,
  summarizeAudioVoiceGenerationResults,
};
export {
  isAudioVoiceAudioNode,
  isAudioVoiceSourceNode,
  isAudioVoiceVideoNode,
  resolveAudioVoiceSelectionTargetIds,
} from './audioVoicePanelPickSession.js';
const AUDIO_VOICE_IMITATE_TONE_WORKFLOW_IDS = new Set([
    RH_AUDIO_INDEXTTS2_CLONE_MODEL_ID,
    RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  ]),
  AUDIO_VOICE_PANEL_MODEL_MENU_GROUPS = new Set(['runninghubWorkflow']),
  AUDIO_VOICE_PANEL_WIDTH_STORAGE_KEY = 'aiCanvas.audioVoicePanelWidth.v1',
  AUDIO_VOICE_STUDIO_VIP_PROVIDER = 'aicanvas',
  AUDIO_VOICE_ANALYSIS_STATE_FIELD = 'audioVoiceAnalysis',
  AUDIO_VOICE_ANALYSIS_SCHEMA_VERSION = 1,
  AUDIO_VOICE_WARM_SEGMENT_LIMIT = 4,
  AUDIO_VOICE_PANEL_WIDTH_LIMITS = Object['freeze']({ min: 560, max: 860 }),
  AUDIO_VOICE_INLINE_ERROR_CODES = new Set([
    'missingVoiceRefAudio',
    'missingSecondVoiceRefAudio',
    'missingSourceAudio',
    'missingPromptText',
    'unsupportedVoiceModel',
  ]),
  AUDIO_VOICE_TRANSLATION_BLOCKED_ACTIONS = new Set([
    'load-selected',
    'start-analyze',
    'voice',
    'merge',
    'insert',
    'generate',
    'batch-generate',
    'compose-all',
    'use-history',
    'use-converted',
    'use-source',
    'edit-source',
    'audio-param',
    'clear-audio-param',
    'toggle-imitate-tone',
    'remove',
    'select-global-model',
    'select-segment-model',
  ]),
  ANALYZE_TASK_TIMEOUT_MS = 45 * 60 * 1000,
  AUDIO_VOICE_ASR_RUNTIME_PROGRESS_SHARE = 0.35,
  AUDIO_CUT_TASK_TIMEOUT_MS = 2 * 60 * 1000,
  AUDIO_VOICE_ANALYSIS_STAGES = new Set([
    'asr-runtime-check',
    'asr-runtime-manifest',
    'asr-runtime-download',
    'asr-runtime-extract',
    'asr-runtime-verify',
    'gpu-torch-check',
    'gpu-torch-install',
    'gpu-torch-verify',
    'model-download',
    'model-prepare',
    'transcribe',
    'diarization-model-download',
    'diarization-model-prepare',
    'diarize',
    'slice',
  ]),
  VOLCENGINE_SPEECH_ASR_AUTH_PATTERN =
    /invalid\s+x-api-key|x-api-key\s+invalid|api\s*key\s+invalid|api\s*key\s*未填写|api\s*key\s*无效|key\s*无效|key\s*没有|permission|denied|forbid|unauthor|not\s+authorized|no\s+access|无权限|未授权|鉴权|权限|密钥|令牌/i;
function panelText(value, item = {}) {
  return t('audioVoicePanel.' + value, item);
}
function getAudioVoiceSegmentMenuEntries(options = {}) {
  return buildAudioVoiceSegmentMenuEntries({
    hasConverted: hasSegmentConvertedAudio(options),
    hasSource: hasSegmentSourceAudio(options),
    usingConverted: isSegmentUsingConvertedAudio(options),
    text: panelText,
  });
}
function getAudioVoiceSegmentContextMenuItems(imitateToneEnabled, onAction) {
  const selectedModelId =
    imitateToneEnabled['voiceModelSelectionMode'] === 'global'
      ? ''
      : String(imitateToneEnabled['voiceModelId'] || '')['trim']();
  return buildAudioVoiceSegmentContextMenuItems({
    entries: getAudioVoiceSegmentMenuEntries(imitateToneEnabled),
    modelOptions: getAudioVoicePanelModelOptions(),
    selectedModelId: selectedModelId,
    imitateToneAvailable: isSegmentImitateToneAvailable(imitateToneEnabled),
    imitateToneEnabled: imitateToneEnabled['imitateToneEnabled'] === true,
    text: panelText,
    onAction: onAction,
  });
}
export function isVolcengineSpeechAsrAuthFailure(error = '') {
  const key = String(error?.['message'] || error || '')['trim']();
  return VOLCENGINE_SPEECH_ASR_AUTH_PATTERN['test'](key);
}
export function shouldShowVolcengineSpeechApiKeyHelp(options2 = {}, index = '') {
  const result = String(options2?.['category'] || '')['trim']();
  if (result === 'missing_key' || result === 'auth_failed' || result === 'bad_base_url') return true;
  return isVolcengineSpeechAsrAuthFailure(
    [index, options2?.['summary'], options2?.['suggestion'], options2?.['detail'], options2?.['error']]
      ['filter'](Boolean)
      ['join'](' '),
  );
}
function clampProgress01(data) {
  const target = Number(data);
  if (!Number['isFinite'](target)) return 0;
  return Math['max'](0, Math['min'](1, target));
}
function normalizeAnalysisProgressStage(source) {
  const next = String(source || '')['trim']();
  return AUDIO_VOICE_ANALYSIS_STAGES['has'](next) ? next : 'model-prepare';
}
function getStateSnapshot(store) {
  return store?.['getStateRaw']?.() || store?.['getState']?.() || {};
}
function clampAudioVoicePanelWidth(current, entry = globalThis['window']?.['innerWidth']) {
  const record = Number(current),
    payload = Number['isFinite'](Number(entry))
      ? Math['max'](320, Number(entry) - 24)
      : AUDIO_VOICE_PANEL_WIDTH_LIMITS['max'],
    handle = Math['min'](AUDIO_VOICE_PANEL_WIDTH_LIMITS['max'], payload),
    state = Math['min'](AUDIO_VOICE_PANEL_WIDTH_LIMITS['min'], handle);
  return Math['max'](state, Math['min'](handle, record));
}
function readStoredPanelWidth(config = globalThis['window']) {
  const count = Number(config?.['localStorage']?.['getItem']?.(AUDIO_VOICE_PANEL_WIDTH_STORAGE_KEY));
  return Number['isFinite'](count) && count > 0 ? count : null;
}
function writeStoredPanelWidth(scope, input = globalThis['window']) {
  try {
    input?.['localStorage']?.['setItem']?.(AUDIO_VOICE_PANEL_WIDTH_STORAGE_KEY, String(Math['round'](scope)));
  } catch {}
}
function dispatchWebPreviewPanelSync(reason) {
  const enabled = globalThis['window'];
  if (!enabled || typeof enabled['dispatchEvent'] !== 'function') return;
  const detail = { reason: reason },
    output =
      typeof globalThis['CustomEvent'] === 'function'
        ? new globalThis['CustomEvent']('web-preview:force-sync', { detail: detail })
        : { type: 'web-preview:force-sync', detail: detail };
  enabled['dispatchEvent'](output);
}
function formatTimecode(value2) {
  const value3 = Math['max'](0, Math['round'](Number(value2) || 0)),
    value4 = Math['floor'](value3 / 60000),
    value5 = Math['floor']((value3 % 60000) / 1000),
    value6 = value3 % 1000;
  return (
    String(value4)['padStart'](2, '0') +
    ':' +
    String(value5)['padStart'](2, '0') +
    ':' +
    String(value6)['padStart'](3, '0')
  );
}
export function formatAudioVoiceTimeRange(value7, value8) {
  const value9 = Math['max'](0, Math['round'](Number(value7) || 0)),
    value10 = Math['max'](value9, Math['round'](Number(value8) || 0)),
    value11 = ((value10 - value9) / 1000)['toFixed'](1);
  return formatTimecode(value9) + ' - ' + formatTimecode(value10) + ' （约 ' + value11 + ' 秒）';
}
export function resolveAudioVoicePanelCoverUrl(options3 = {}) {
  return resolveCanvasVideoPosterUrl(options3);
}
export function createDefaultAudioVoiceSegments() {
  return [
    {
      id: 'mock-segment-1',
      startMs: 80,
      endMs: 4270,
      sourceText: '马某人这个县长买来的，嗯，买官就是为了挣钱。',
      targetText: '',
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      imitateToneEnabled: false,
      status: 'detected',
    },
    {
      id: 'mock-segment-2',
      startMs: 5413,
      endMs: 10132,
      sourceText: '今天参加会议的人里面，就有一个人是怪物伪装的。',
      targetText: '',
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      imitateToneEnabled: false,
      status: 'detected',
    },
    {
      id: 'mock-segment-3',
      startMs: 10080,
      endMs: 11849,
      sourceText: '谁有钱就挣谁的。',
      targetText: '',
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      imitateToneEnabled: false,
      status: 'detected',
    },
    {
      id: 'mock-segment-4',
      startMs: 12060,
      endMs: 15380,
      sourceText: '那你想挣谁的钱呢？',
      targetText: '',
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      imitateToneEnabled: false,
      status: 'detected',
    },
  ]['map']((args) => ({ ...args }));
}
function isAudioVoicePanelWorkflowItem(options4 = {}) {
  const value12 = String(options4?.['group'] || '')['trim'](),
    value13 = String(options4?.['provider'] || '')['trim'](),
    value14 = String(options4?.['adapterType'] || '')['trim']();
  return (
    AUDIO_VOICE_PANEL_MODEL_MENU_GROUPS['has'](value12) &&
    value13 === 'runninghubwf' &&
    value14 === 'workflow'
  );
}
function getAudioVoicePanelWorkflowItems() {
  return buildAudioWorkflowItems()['filter'](isAudioVoicePanelWorkflowItem);
}
function toAudioVoicePanelModelOption(icon = {}) {
  const id = String(icon['id'] || icon['key'] || icon['modelId'] || '')['trim']();
  return {
    id: id,
    label: translateManifestText(icon['label']),
    subtitle: translateManifestText(icon['subtitle'] || ''),
    icon: icon['icon'] || 'images/RH.png',
    iconAlt: icon['iconAlt'] || 'runninghub',
    provider: icon['provider'] || '',
    adapterType: icon['adapterType'] || '',
    executionId: icon['executionId'] || '',
    async: icon['async'] === true,
    cancellable: icon['cancellable'] === true,
    vip: icon['vip'] === true,
  };
}
export function getAudioVoicePanelModelOptions() {
  return getAudioVoicePanelWorkflowItems()['map'](toAudioVoicePanelModelOption);
}
export function getAudioVoicePanelModelGroups() {
  const list = getAudioVoicePanelWorkflowItems(),
    map = new Map(
      list['map'](toAudioVoicePanelModelOption)
        ['filter']((value15) => value15['id'])
        ['map']((value16) => [value16['id'], value16]),
    );
  return buildAudioWorkflowMenuGroups(list)
    ['map']((icon2) => ({
      id: String(icon2['id'] || '')['trim'](),
      label: translateManifestText(icon2['label'] || icon2['id'] || ''),
      subtitle: translateManifestText(icon2['subtitle'] || ''),
      icon: icon2['icon'] || 'images/RH.png',
      iconAlt: icon2['iconAlt'] || icon2['id'] || 'runninghub',
      items: (Array['isArray'](icon2['items']) ? icon2['items'] : [])
        ['map']((value17) => map['get'](String(value17?.['modelId'] || '')['trim']()))
        ['filter'](Boolean),
    }))
    ['filter']((value18) => value18['items']['length'] > 0);
}
export function getAudioVoiceWorkflowAudioSlots(value19 = '') {
  return getAudioWorkflowSlots(value19)['map']((args2) => ({
    ...args2,
    label: translateManifestText(args2['label'] || args2['slot'] || ''),
  }));
}
export function doesAudioVoiceWorkflowSupportToneClone(value20 = '') {
  return doesAudioWorkflowSupportMultipleAudioInputs(value20);
}
export function normalizeAudioVoicePanelWidth(value21, value22) {
  return clampAudioVoicePanelWidth(value21, value22);
}
export function resolveAudioVoiceSourceLocalPath(options5 = {}) {
  return isAudioVoiceAudioNode(options5)
    ? resolveCanvasAudioLocalPath(options5)
    : resolveCanvasVideoLocalPath(options5);
}
export function resolveAudioVoiceSourceUrl(options6 = {}) {
  return isAudioVoiceAudioNode(options6)
    ? resolveCanvasAudioUrl(options6)
    : localPathToUrl(resolveCanvasVideoLocalPath(options6));
}
function normalizeAudioVoicePromptForBackend(value23, value24) {
  const value25 = String(value24 || '')['trim']();
  if (value23 !== RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID) return value25;
  return value25['replace'](/(^|\s+)@?音频1\s*[:：]?\s*/g, '$1[speaker_1]: ')
    ['replace'](/(^|\s+)@?音频2\s*[:：]?\s*/g, '$1[speaker_2]: ')
    ['replace'](/\s+(\[speaker_[12]\]:)/g, '\n$1')
    ['trim']();
}
export function resolveAudioVoiceSegmentAudioInput(options7 = {}, value26 = 1) {
  const count2 = Number(value26) === 2 ? 2 : 1;
  if (count2 === 2)
    return {
      nodeId: String(options7['voiceRefNodeId'] || ''),
      localPath: normalizeLocalPath(options7['voiceRefAudioLocalPath'] || ''),
      audioUrl: resolveSegmentLocalAudioUrl(options7['voiceRefAudioUrl'], options7['voiceRefAudioLocalPath']),
      name: String(options7['voiceRefName'] || ''),
      imageUrl: String(options7['voiceRefImageUrl'] || ''),
    };
  return {
    nodeId: String(options7['id'] || ''),
    localPath: normalizeLocalPath(options7['sourceAudioLocalPath'] || ''),
    audioUrl: resolveSegmentLocalAudioUrl(options7['sourceAudioUrl'], options7['sourceAudioLocalPath']),
    name: String(options7['sourceAudioName'] || ''),
  };
}
function createAudioVoiceWorkflowAudioRef(sourceId = {}, refSlot = '') {
  const url = sourceId?.['audioUrl'];
  if (!url) return null;
  return { refSlot: refSlot, url: url, sourceId: sourceId['nodeId'], sourceType: 'source-audio' };
}
function isAudioVoiceImitateToneWorkflow(value27 = '') {
  return AUDIO_VOICE_IMITATE_TONE_WORKFLOW_IDS['has'](String(value27 || '')['trim']());
}
function getAudioVoicePrimaryAudioSlot(value28 = '') {
  return value28 === RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID ? 'audio1' : 'audioRef';
}
function buildAudioVoiceWorkflowAudioRefs(options8 = {}, value29 = '', value30 = []) {
  const audioVoiceSegmentAudioInput = resolveAudioVoiceSegmentAudioInput(options8, 1),
    audioVoiceSegmentAudioInput2 = resolveAudioVoiceSegmentAudioInput(options8, 2);
  if (isAudioVoiceImitateToneWorkflow(value29)) {
    const audioVoicePrimaryAudioSlot = getAudioVoicePrimaryAudioSlot(value29),
      list2 = [];
    if (audioVoiceSegmentAudioInput2['audioUrl']) {
      list2['push'](
        createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput2, audioVoicePrimaryAudioSlot),
      );
      if (options8['imitateToneEnabled'] === true) {
        if (!audioVoiceSegmentAudioInput['audioUrl'])
          throw createAudioVoicePayloadError('missingSourceAudio');
        list2['push'](createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput, 'audio2'));
      }
    } else
      list2['push'](
        createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput, audioVoicePrimaryAudioSlot),
      );
    return normalizeAudioWorkflowRefSlots(list2['filter'](Boolean), value29);
  }
  if (value29 === RH_AUDIO_VOICE_CONVERT_MODEL_ID)
    return normalizeAudioWorkflowRefSlots(
      [
        createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput2, value30[0]?.['slot'] || ''),
        createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput, value30[1]?.['slot'] || ''),
      ]['filter'](Boolean),
      value29,
    );
  return normalizeAudioWorkflowRefSlots(
    [audioVoiceSegmentAudioInput, audioVoiceSegmentAudioInput2]
      ['map']((value31, value32) =>
        createAudioVoiceWorkflowAudioRef(value31, value30[value32]?.['slot'] || ''),
      )
      ['filter'](Boolean),
    value29,
  );
}
export function buildAudioVoiceGeneratePayload(
  options9 = {},
  value33 = '',
  { workflowLabel: workflowLabel = '', nodeId: nodeId = '', installId: installId = '' } = {},
) {
  const audioWorkflowKey = String(value33 || '')['trim']();
  if (!audioWorkflowKey || !getModelManifest(audioWorkflowKey))
    throw createAudioVoicePayloadError('unsupportedVoiceModel');
  const prompt = normalizeAudioVoicePromptForBackend(
      audioWorkflowKey,
      firstNonEmptyString(options9['targetText'], options9['sourceText']),
    ),
    list3 = getAudioVoiceWorkflowAudioSlots(audioWorkflowKey),
    audioRefs = buildAudioVoiceWorkflowAudioRefs(options9, audioWorkflowKey, list3),
    map2 = new Map(audioRefs['map']((value34) => [String(value34?.['refSlot'] || ''), value34]));
  list3['forEach']((value35, count3) => {
    const response = map2['get'](value35['slot']);
    if (value35['required'] && !response?.['url']) {
      if (audioWorkflowKey === RH_AUDIO_VOICE_CONVERT_MODEL_ID)
        throw createAudioVoicePayloadError(
          value35['slot'] === 'audioRef' ? 'missingVoiceRefAudio' : 'missingSourceAudio',
        );
      throw createAudioVoicePayloadError(
        count3 === 0 ? 'missingSourceAudio' : 'missingSecondVoiceRefAudio',
      );
    }
  });
  if (audioWorkflowKey === RH_AUDIO_INDEXTTS2_CLONE_MODEL_ID) {
    if (!prompt) throw createAudioVoicePayloadError('missingPromptText');
  }
  if (audioWorkflowKey === RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID && !prompt)
    throw createAudioVoicePayloadError('missingPromptText');
  const value36 = {
      provider: 'runninghubwf',
      audioWorkflowKey: audioWorkflowKey,
      audioWorkflowLabel: String(workflowLabel || '')['trim'](),
      nodeId: String(nodeId || '')['trim'](),
      prompt: prompt,
      textInputs: prompt ? [prompt] : [],
      audioRefs: audioRefs,
    },
    value37 = String(installId || '')['trim']();
  if (value37) value36['installId'] = value37;
  return value36;
}
export async function resolveAudioVoiceGenerateInstallId(value38 = globalThis['window'], value39 = '') {
  const value40 = String(value38?.['__aicInstallId'] || globalThis['__aicInstallId'] || '')['trim'](),
    modelManifest = getModelManifest(String(value39 || '')['trim']());
  if (modelManifest?.['vip'] !== true) return value40;
  if (typeof value38?.['ensureSubscriptionInstallId'] === 'function')
    try {
      const value41 = String(await value38['ensureSubscriptionInstallId']())['trim']();
      if (value41) return value41;
    } catch {}
  return value40;
}
function normalizeAudioVoiceLastUsedAt(value42) {
  const count4 = Number(value42);
  return Number['isFinite'](count4) && count4 > 0 ? Math['round'](count4) : 0;
}
function resolveLatestAudioVoicePersistedSourceNode(options10 = {}) {
  let value43 = null,
    value44 = 0;
  return (
    Object['values'](options10 || {})['forEach']((value45) => {
      if (!isAudioVoiceSourceNode(value45)) return;
      const audioVoicePersistedAnalysisSnapshot = resolveAudioVoicePersistedAnalysisSnapshot(value45),
        audioVoiceLastUsedAt = normalizeAudioVoiceLastUsedAt(
          audioVoicePersistedAnalysisSnapshot?.['lastUsedAt'],
        );
      if (!audioVoicePersistedAnalysisSnapshot || audioVoiceLastUsedAt <= value44) return;
      ((value43 = value45), (value44 = audioVoiceLastUsedAt));
    }),
    value43
  );
}
export function resolveAudioVoicePanelSourceNode(state2 = {}, value46 = '', value47 = '') {
  const value48 = state2?.['nodes'] || {},
    value49 = String(value46 || '')['trim']();
  if (value49 && isAudioVoiceSourceNode(value48[value49])) return value48[value49];
  const value50 = Array['isArray'](state2?.['selectedNodeIds']) ? state2['selectedNodeIds'] : [];
  for (const value51 of value50) {
    const value52 = value48?.[value51];
    if (isAudioVoiceSourceNode(value52)) return value52;
  }
  const value53 = String(value47 || '')['trim']();
  if (value53 && isAudioVoiceSourceNode(value48[value53])) return value48[value53];
  return resolveLatestAudioVoicePersistedSourceNode(value48);
}
export function resolveAudioVoicePanelOpenSourceNode(options11 = {}, value54 = {}, value55 = '') {
  const value56 = String(value54?.['sourceNodeId'] || '')['trim']();
  if (value56) return resolveAudioVoicePanelSourceNode(options11, value56, '');
  return resolveAudioVoicePanelSourceNode({ ...(options11 || {}), selectedNodeIds: [] }, '', value55);
}
function normalizeAudioVoiceMemoryKeyPart(value57) {
  return String(value57 || '')
    ['trim']()
    ['replace'](/\\/g, '/');
}
export function resolveAudioVoiceAnalysisMemoryKey(options12 = {}) {
  const response2 = options12 || {},
    nonEmptyString = firstNonEmptyString(response2['displayLocalPath'], response2['localPath']),
    value58 = /^(?:https?:|blob:|data:|file:)/i['test'](nonEmptyString)
      ? ''
      : normalizeLocalPath(nonEmptyString) || normalizeAudioVoiceMemoryKeyPart(nonEmptyString);
  if (value58) return 'path:' + normalizeAudioVoiceMemoryKeyPart(value58);
  const nonEmptyString2 = firstNonEmptyString(
    response2['src'],
    response2['videoUrl'],
    response2['audioUrl'],
    response2['url'],
    response2['resultUrl'],
  );
  if (nonEmptyString2) return 'src:' + normalizeAudioVoiceMemoryKeyPart(nonEmptyString2);
  const value59 = String(response2['id'] || '')['trim']();
  return value59 ? 'id:' + value59 : '';
}
function formatDuration(value60) {
  const count5 = Number(value60);
  if (!Number['isFinite'](count5) || count5 <= 0) return '';
  const value61 = Math['round'](count5),
    value62 = Math['floor'](value61 / 60),
    value63 = String(value61 % 60)['padStart'](2, '0');
  return value62 + ':' + value63;
}
function getSourceLabel(options13 = {}) {
  if (isAudioVoiceAudioNode(options13))
    return options13['localPath'] ? panelText('source.localAudio') : panelText('source.canvasAudio');
  return options13['localPath'] ? panelText('source.localVideo') : panelText('source.canvasVideo');
}
function getSourceName(error2 = {}) {
  return (
    error2['name'] || error2['fileName'] || error2['title'] || error2['label'] || panelText('source.empty')
  );
}
function getSourceMeta(options14 = {}) {
  const formatDuration2 = formatDuration(
      options14['videoDuration'] || options14['audioDuration'] || options14['duration'],
    ),
    list4 = [getSourceLabel(options14), formatDuration2]['filter'](Boolean);
  return list4['join'](' / ');
}
export function normalizeAudioVoiceAnalyzeSegments(options15 = {}) {
  return normalizeAudioVoiceAnalyzeSegments_2(options15, { normalizeSegment: cloneAudioVoiceSegment });
}
export function buildAudioVoiceVideoAnalysisMemorySnapshot({
  sourceNode: sourceNode = {},
  sourceNodeId: sourceNodeId = '',
  segments: segments = [],
  analysisSourceAudioLocalPath: analysisSourceAudioLocalPath = '',
  analysisSourceAudioUrl: analysisSourceAudioUrl = '',
  analysisStatus: analysisStatus = 'ready',
  lastUsedAt: lastUsedAt = 0,
  completedComposeKey: completedComposeKey = '',
} = {}) {
  const value64 = sourceNode || {},
    key2 = resolveAudioVoiceAnalysisMemoryKey(value64);
  if (!key2) return null;
  const analysisSourceAudioLocalPath2 = normalizeLocalPath(analysisSourceAudioLocalPath || ''),
    audioVoiceLastUsedAt2 = normalizeAudioVoiceLastUsedAt(lastUsedAt),
    value65 = {
      schemaVersion: AUDIO_VOICE_ANALYSIS_SCHEMA_VERSION,
      key: key2,
      sourceNodeId: String(sourceNodeId || value64['id'] || ''),
      analysisSourceAudioLocalPath: analysisSourceAudioLocalPath2,
      analysisSourceAudioUrl: firstNonEmptyString(
        analysisSourceAudioUrl,
        localPathToUrl(analysisSourceAudioLocalPath2),
      ),
      analysisStatus: String(analysisStatus || 'ready'),
      completedComposeKey: String(completedComposeKey || ''),
      segments: (Array['isArray'](segments) ? segments : [])['map'](cloneAudioVoiceSegment),
    };
  if (audioVoiceLastUsedAt2 > 0) value65['lastUsedAt'] = audioVoiceLastUsedAt2;
  return value65;
}
export function resolveAudioVoicePersistedAnalysisSnapshot(sourceNode2 = {}) {
  const sourceNodeId2 = sourceNode2?.[AUDIO_VOICE_ANALYSIS_STATE_FIELD];
  if (!sourceNodeId2 || typeof sourceNodeId2 !== 'object' || Array['isArray'](sourceNodeId2)) return null;
  const event = buildAudioVoiceVideoAnalysisMemorySnapshot({
    sourceNode: sourceNode2,
    sourceNodeId: sourceNodeId2['sourceNodeId'] || sourceNode2?.['id'],
    segments: sourceNodeId2['segments'],
    analysisSourceAudioLocalPath: sourceNodeId2['analysisSourceAudioLocalPath'],
    analysisSourceAudioUrl: sourceNodeId2['analysisSourceAudioUrl'],
    analysisStatus: sourceNodeId2['analysisStatus'],
    lastUsedAt: sourceNodeId2['lastUsedAt'],
    completedComposeKey: sourceNodeId2['completedComposeKey'],
  });
  if (!event) return null;
  const value66 = String(sourceNodeId2['key'] || '')['trim']();
  if (value66 && value66 !== event['key']) return null;
  if (event['analysisStatus'] !== 'ready' && event['segments']['length'] <= 0) return null;
  return event;
}
function shouldShowConvertedRow(response3 = {}) {
  return (
    !!String(response3['targetText'] || '')['trim']() ||
    !!String(response3['error'] || '')['trim']() ||
    response3['convertedAudioReady'] === true ||
    response3['status'] === 'generating' ||
    response3['status'] === 'ready'
  );
}
function hasSegmentSourceAudio(options16 = {}) {
  return !!resolveSegmentLocalAudioUrl(options16['sourceAudioUrl'], options16['sourceAudioLocalPath']);
}
function hasSegmentConvertedAudio(options17 = {}) {
  return (
    options17['convertedAudioReady'] === true &&
    !!resolveSegmentLocalAudioUrl(options17['convertedAudioUrl'], options17['convertedAudioLocalPath'])
  );
}
function isSegmentUsingConvertedAudio(options18 = {}) {
  return hasSegmentConvertedAudio(options18) && options18['activeAudio'] !== 'source';
}
export function resolveAudioVoiceSegmentActiveAudioUrl(options19 = {}) {
  if (isSegmentUsingConvertedAudio(options19))
    return resolveSegmentLocalAudioUrl(options19['convertedAudioUrl'], options19['convertedAudioLocalPath']);
  return resolveSegmentLocalAudioUrl(options19['sourceAudioUrl'], options19['sourceAudioLocalPath']);
}
export function resolveAudioVoiceSegmentActiveAudioLocalPath(options20 = {}) {
  if (isSegmentUsingConvertedAudio(options20))
    return normalizeLocalPath(options20['convertedAudioLocalPath'] || '');
  return normalizeLocalPath(options20['sourceAudioLocalPath'] || '');
}
function resolveAudioVoiceSegmentActiveAudioDurationMs(options21 = {}, value67 = 0, value68 = 0) {
  const value69 = Math['max'](
    0,
    Math['round'](Number(value68) || 0) - Math['round'](Number(value67) || 0),
  );
  if (isSegmentUsingConvertedAudio(options21)) {
    const audioDurationSec = pickAudioDurationSec(
      options21['convertedAudioDuration'],
      options21['audioDuration'],
    );
    if (audioDurationSec > 0) return Math['max'](1, Math['round'](audioDurationSec * 1000));
    return 0;
  }
  return value69;
}
export function buildAudioVoiceComposeSources(list5 = []) {
  return (Array['isArray'](list5) ? list5 : [])
    ['filter']((response4) => response4?.['status'] !== 'removed')
    ['map'](resolveAudioVoiceSegmentActiveAudioUrl)
    ['filter'](Boolean);
}
export function applyAudioVoiceReferenceToSegments(list6 = [], value70 = [], voiceRefNodeId = {}) {
  const segments2 = Array['isArray'](list6) ? list6 : [];
  if (!isAudioVoiceAudioNode(voiceRefNodeId))
    return { segments: segments2, appliedIds: [], reason: 'unsupported' };
  const voiceRefAudioLocalPath = resolveCanvasAudioLocalPath(voiceRefNodeId),
    voiceRefAudioUrl = resolveCanvasAudioUrl(voiceRefNodeId);
  if (!voiceRefAudioUrl) return { segments: segments2, appliedIds: [], reason: 'invalid' };
  const map3 = new Set(
      segments2['filter']((response5) => response5?.['status'] !== 'removed')
        ['map']((value71) => String(value71?.['id'] || '')['trim']())
        ['filter'](Boolean),
    ),
    appliedIds = [
      ...new Set(
        (Array['isArray'](value70) ? value70 : [])
          ['map']((value72) => String(value72 || '')['trim']())
          ['filter']((value73) => map3['has'](value73)),
      ),
    ];
  if (!appliedIds['length']) return { segments: segments2, appliedIds: appliedIds, reason: 'no-target' };
  const map4 = new Set(appliedIds),
    voiceRefName = getSourceName(voiceRefNodeId),
    voiceRefImageUrl = firstNonEmptyString(
      voiceRefNodeId['voiceRefImageUrl'],
      voiceRefNodeId['imageUrl'],
      voiceRefNodeId['thumbUrl'],
      voiceRefNodeId['posterUrl'],
    );
  return {
    segments: segments2['map']((args3) =>
      map4['has'](args3['id'])
        ? {
            ...args3,
            voiceRefNodeId: voiceRefNodeId['id'] || '',
            voiceRefAudioLocalPath: voiceRefAudioLocalPath,
            voiceRefAudioUrl: voiceRefAudioUrl,
            voiceRefName: voiceRefName,
            voiceRefImageUrl: voiceRefImageUrl,
            error: '',
          }
        : args3,
    ),
    appliedIds: appliedIds,
    reason: '',
  };
}
export function buildAudioVoiceComposeTimelineClips(list7 = []) {
  return (Array['isArray'](list7) ? list7 : [])
    ['filter']((response6) => response6?.['status'] !== 'removed')
    ['map']((value74) => {
      const src = resolveAudioVoiceSegmentActiveAudioLocalPath(value74),
        startMs = Math['max'](0, Math['round'](Number(value74['startMs']) || 0)),
        endMs = Math['max'](startMs, Math['round'](Number(value74['endMs']) || startMs));
      if (!src || !(endMs > startMs)) return null;
      const durationMs = resolveAudioVoiceSegmentActiveAudioDurationMs(value74, startMs, endMs);
      return {
        id: String(value74['id'] || ''),
        src: src,
        startMs: startMs,
        endMs: endMs,
        ...(durationMs > 0 ? { durationMs: durationMs } : {}),
      };
    })
    ['filter'](Boolean);
}
export function resolveAudioVoiceComposeDurationSec(options22 = {}, value75 = []) {
  const count6 = Number(
    options22?.['videoDuration'] || options22?.['audioDuration'] || options22?.['duration'],
  );
  if (Number['isFinite'](count6) && count6 > 0) return count6;
  const count7 = Math['max'](
    0,
    ...(Array['isArray'](value75) ? value75 : [])
      ['map']((value76) => Math['round'](Number(value76?.['endMs']) || 0))
      ['filter']((count8) => Number['isFinite'](count8) && count8 > 0),
  );
  return count7 > 0 ? count7 / 1000 : 0;
}
export function getDefaultAudioVoiceModelId() {
  const list8 = getAudioVoicePanelModelOptions();
  return (
    list8['find']((value77) => value77['id'] === RH_AUDIO_INDEXTTS2_CLONE_MODEL_ID)?.['id'] ||
    list8[0]?.['id'] ||
    ''
  );
}
export function initAudioVoicePanel({
  store: store2,
  fabBtnEl: fabBtnEl,
  root: root = document['body'],
  windowObject: windowObject = window,
  embedded: embedded = false,
  composeTimeline: composeTimeline = composeAudioVoiceTimelineNearNode,
  translateSegments: translateSegments = translateAudioVoiceSegments,
  playCompletion: playCompletion = playCompletionSound,
  showCompletionNotification: showCompletionNotification = showGenerationCompleteNotification,
  onComposeResult: onComposeResult = null,
  onAudioPickStateChange: onAudioPickStateChange = null,
  resolveStartAnalyzeConfirmation: resolveStartAnalyzeConfirmation = null,
} = {}) {
  if (!root || !fabBtnEl) return null;
  const audioVoiceConfirmDialog = createAudioVoiceConfirmDialog({
    root: root,
    documentObject: root['ownerDocument'] || globalThis['document'],
    windowObject: windowObject,
  });
  let sourceNodeId3 = '',
    sourceNode3 = null,
    lastUsedAt2 = 0,
    analysisSourceAudioLocalPath3 = '',
    analysisSourceAudioUrl2 = '',
    segments3 = [],
    map5 = new Set(),
    defaultAudioVoiceModelId = getDefaultAudioVoiceModelId(),
    audioVoiceAsrProvider = AUDIO_VOICE_ASR_PROVIDER_IDS['DOUBAO'],
    alert2 = null,
    alert3 = null,
    analysisStatus2 = 'idle',
    audioVoiceInitialAnalysisProgress = null;
  const progressTracker = createAudioVoiceTaskProgressTracker({ onProgress: onProgress }),
    analysisSession = createAudioVoiceAnalysisSession({ cancelMediaTask: cancelElectronMediaTask });
  let value78 = '';
  const map6 = new Set(),
    map7 = new Map();
  let value79 = null,
    value80 = '',
    value81 = null,
    value82 = '',
    value83 = null,
    runAudioVoiceBatchGenerationQueue2 = null,
    value84 = null;
  const map8 = new Set();
  let enabled2 = null,
    value85 = null,
    value86 = 0,
    completedComposeKey2 = '',
    map9 = new Set();
  const cancelInFlight = createAudioVoiceGenerationTaskOrchestration({
      createStore: ({ sourceNodeId: sourceNodeId4, segmentId: segmentId2, targetNodeId: targetNodeId2 }) =>
        run(segmentId2, targetNodeId2, sourceNodeId4),
    }),
    audioVoiceTaskRecoveryManager = createAudioVoiceTaskRecoveryManager(),
    session = createAudioVoiceSegmentEditSession(),
    audioVoiceSegmentMergeController = createAudioVoiceSegmentMergeController({
      session: session,
      getSourceNodeId: () => sourceNodeId3,
      getSegments: () => segments3,
      composeAudio: ({ sourceNodeId: sourceNodeId5, srcs: srcs, durationMs: durationMs2 }) =>
        enqueueElectronMediaTask(
          {
            kind: 'audioCompose',
            nodeId: sourceNodeId5,
            srcs: srcs,
            args: { srcs: srcs, duration: Math['max'](0, Number(durationMs2 || 0) / 1000) },
          },
          { wait: true, timeout: AUDIO_CUT_TASK_TIMEOUT_MS },
        ),
      commitSegments: commitSegments,
      render: render,
      markMutation: (value87) => run2('merge', [value87]),
      showPending: () => run3(panelText('status.merging')),
      showError: (value88) =>
        windowObject?.['showToast']?.(error3(value88, panelText('toasts.sourceClipFailed')), 'error'),
      showStale: () => windowObject?.['showToast']?.(panelText('toasts.mergeChanged'), 'warn'),
    }),
    map10 = createAudioVoicePlaybackSession({
      windowObject: windowObject,
      documentObject: root?.['ownerDocument'] || globalThis['document'],
    }),
    panel = createEl('aside', 'audio-voice-panel');
  (panel['classList']['toggle']('is-embedded', embedded === true),
    panel['setAttribute']('aria-hidden', 'true'),
    panel['setAttribute']('aria-label', panelText('title') + ' ' + panelText('betaBadge')));
  const el = createEl('div', 'audio-voice-panel-resize-handle panel-resize-handle');
  (el['setAttribute']('role', 'separator'),
    el['setAttribute']('aria-orientation', 'vertical'),
    el['setAttribute']('aria-label', panelText('resizeLabel')),
    (el['tabIndex'] = 0));
  const el2 = createEl('div', 'audio-voice-panel-header'),
    el3 = createEl('div', 'audio-voice-panel-title');
  el3['append'](
    createEl('span', 'audio-voice-panel-title-main', panelText('title')),
    createEl('span', 'audio-voice-panel-title-beta', panelText('betaBadge')),
  );
  const el4 = createButton('audio-voice-panel-close', panelText('close'), 'close');
  el2['append'](el3, el4);
  const el5 = createEl('div', 'audio-voice-panel-main');
  (panel['append'](el, el2, el5), root['appendChild'](panel));
  const noticeElement = createEl('div', 'audio-voice-pick-notice', panelText('source.pickNotice'));
  ((noticeElement['hidden'] = true),
    noticeElement['setAttribute']('role', 'status'),
    noticeElement['setAttribute']('aria-live', 'polite'),
    root['appendChild'](noticeElement));
  const canSelectAudioReference = createAudioVoicePanelPickSession({
      panel: panel,
      noticeElement: noticeElement,
      store: store2,
      documentObject: panel['ownerDocument'] || globalThis['document'],
      windowObject: windowObject,
      getSegments: () => segments3,
      getSelectedSegmentIds: () => map5,
      doesSegmentSupportAudioReference: (value89) =>
        doesAudioVoiceWorkflowSupportToneClone(run4(value89)?.['id'] || defaultAudioVoiceModelId),
      loadSourceNode: loadSourceNode,
      applyAudioReference: (value90, value91) => {
        const segments4 = applyAudioVoiceReferenceToSegments(segments3, value91, value90);
        return (
          segments4['appliedIds']['length'] && ((segments3 = segments4['segments']), run5()),
          segments4
        );
      },
      syncSourceUi: syncSourceUi,
      syncAudioTargetUi: syncAudioTargetUi,
      onAudioPickStateChange: onAudioPickStateChange,
      text: panelText,
    }),
    storedPanelWidth = readStoredPanelWidth(windowObject);
  storedPanelWidth &&
    document?.['body']?.['style']?.['setProperty']?.(
      '--audio-voice-panel-width',
      clampAudioVoicePanelWidth(storedPanelWidth) + 'px',
    );
  function run3(panelText2 = panelText('toasts.pipelinePending')) {
    windowObject?.['showToast']?.(panelText2, 'info');
  }
  function run6() {
    return Boolean(value85);
  }
  function run7(enabled3 = false) {
    audioVoiceConfirmDialog['close'](enabled3);
  }
  function run8() {
    ((value86 += 1), (value85 = null), run7(false));
  }
  function confirmAction(options23 = {}) {
    return audioVoiceConfirmDialog['confirm'](options23);
  }
  function run9({ language: language, count: count9, scope: scope2, returnFocus: returnFocus } = {}) {
    return confirmAction({
      className: 'audio-voice-translation-confirm',
      title: panelText('translation.confirmTitle'),
      message: panelText(scope2 === 'selected' ? 'translation.confirmSelected' : 'translation.confirmAll', {
        count: count9,
        language: language?.['label'] || '',
      }),
      cancelLabel: panelText('translation.cancel'),
      confirmLabel: panelText('translation.confirm'),
      returnFocus: returnFocus,
    });
  }
  function error3(error4, panelText3 = panelText('toasts.operationFailed')) {
    const value92 = String(error4?.['code'] || error4?.['message'] || '')['trim']();
    if (value92 && value92 === error4?.['code']) {
      const panelText4 = panelText('toasts.' + value92);
      if (panelText4 && panelText4 !== 'audioVoicePanel.toasts.' + value92) return panelText4;
    }
    return String(error4?.['message'] || error4 || panelText3)['trim']() || panelText3;
  }
  function run10(value93 = 'invalid', value94 = '') {
    const audioVoiceAsrProvider2 = getAudioVoiceAsrProvider(audioVoiceAsrProvider)['helpPath'],
      reason2 = String(value93 || '')['trim']() === 'missing' ? 'missing' : 'invalid',
      value95 =
        reason2 === 'missing'
          ? panelText(audioVoiceAsrProvider2 + '.missingMessage')
          : panelText(audioVoiceAsrProvider2 + '.invalidMessage');
    return {
      reason: reason2,
      title:
        reason2 === 'missing'
          ? panelText(audioVoiceAsrProvider2 + '.missingTitle')
          : panelText(audioVoiceAsrProvider2 + '.invalidTitle'),
      message: String(value94 || value95)['trim']() || value95,
    };
  }
  function run11(value96 = 'invalid', value97 = '') {
    ((alert2 = run10(value96, value97)),
      render(),
      panel['querySelector']?.('.audio-voice-asr-config-alert')?.['scrollIntoView']?.({
        block: 'nearest',
        behavior: 'smooth',
      }));
  }
  function run12() {
    if (!alert2) return;
    ((alert2 = null), render());
  }
  async function run13() {
    const requiredCapabilities = getAudioVoiceAsrProvider(audioVoiceAsrProvider);
    try {
      await ensureConfig();
    } catch {
      return (run11('invalid', panelText('toasts.asrConfigReadFailed')), false);
    }
    const providerConfig = getProviderConfig(requiredCapabilities['configProviderId']);
    if (!String(providerConfig?.['apiKey'] || '')['trim']()) return (run11('missing'), false);
    const response7 = await testProviderConnection(requiredCapabilities['configProviderId'], providerConfig, {
      requiredCapabilities: requiredCapabilities['requiredCapabilities'],
    })['catch'](() => null);
    if (response7 && !response7['ok'])
      return (
        shouldShowVolcengineSpeechApiKeyHelp(response7, response7['summary'] || '')
          ? run11('invalid', response7['summary'])
          : windowObject?.['showToast']?.(
              response7['summary'] || response7['suggestion'] || panelText('toasts.analysisFailed'),
              'error',
            ),
        false
      );
    return (run12(), true);
  }
  function run14(value98 = 'invalid', value99 = '') {
    const reason3 = String(value98 || '')['trim']() === 'missing' ? 'missing' : 'invalid',
      value100 =
        reason3 === 'missing'
          ? panelText('translationApiKeyHelp.missingMessage')
          : panelText('translationApiKeyHelp.invalidMessage');
    return {
      reason: reason3,
      title:
        reason3 === 'missing'
          ? panelText('translationApiKeyHelp.missingTitle')
          : panelText('translationApiKeyHelp.invalidTitle'),
      message: String(value99 || value100)['trim']() || value100,
    };
  }
  function run15(value101 = 'invalid', value102 = '') {
    ((alert3 = run14(value101, value102)),
      render(),
      panel['querySelector']?.('.audio-voice-translation-config-alert')?.['scrollIntoView']?.({
        block: 'nearest',
        behavior: 'smooth',
      }));
  }
  function run16() {
    if (!alert3) return;
    ((alert3 = null), render());
  }
  async function run17() {
    try {
      await ensureConfig();
    } catch {
      return (run15('invalid', panelText('toasts.translationConfigReadFailed')), false);
    }
    const providerConfig2 = getProviderConfig(AUDIO_VOICE_TRANSLATION_PROVIDER_ID);
    if (!String(providerConfig2?.['apiKey'] || '')['trim']())
      return (run15('missing', panelText('translationApiKeyHelp.missingMessage')), false);
    return (run16(), true);
  }
  function run18(value103) {
    return AUDIO_VOICE_INLINE_ERROR_CODES['has'](String(value103?.['code'] || '')['trim']());
  }
  function run19() {
    return (
      getAudioVoicePanelModelOptions()['find']((value104) => value104['id'] === defaultAudioVoiceModelId) ||
      null
    );
  }
  function run4(options24 = {}) {
    const list9 = getAudioVoicePanelModelOptions(),
      value105 =
        options24['voiceModelSelectionMode'] === 'global'
          ? ''
          : String(options24['voiceModelId'] || '')['trim']();
    return (
      list9['find']((value106) => value106['id'] === value105) ||
      list9['find']((value107) => value107['id'] === defaultAudioVoiceModelId) ||
      null
    );
  }
  function resolveModelOption(options25 = {}) {
    const value108 = String(options25['taskModelId'] || '')['trim']();
    return (
      getAudioVoicePanelModelOptions()['find']((value109) => value109['id'] === value108) || run4(options25)
    );
  }
  function cancellable(options26 = {}) {
    return resolveModelOption(options26)?.['cancellable'] === true;
  }
  function run20(value110, value111 = sourceNodeId3) {
    return 'audio-voice:' + (value111 || 'source') + ':' + value110;
  }
  function buildTaskNode(isGenerating = {}) {
    const provider = resolveModelOption(isGenerating);
    return {
      ...isGenerating,
      provider: provider?.['provider'] || 'runninghubwf',
      adapterType: provider?.['adapterType'] || 'workflow',
      isGenerating: isGenerating['isGenerating'] === true || isGenerating['status'] === 'generating',
      jobStatus:
        isGenerating['jobStatus'] ||
        (isGenerating['status'] === 'generating'
          ? 'running'
          : isGenerating['status'] === 'ready'
            ? 'success'
            : ''),
      rhTaskStatus:
        isGenerating['rhTaskStatus'] ||
        (isGenerating['status'] === 'generating' ? (isGenerating['rhTaskId'] ? 'running' : 'pending') : ''),
    };
  }
  function run(segmentId3, targetNodeId3, value112 = sourceNodeId3) {
    const sourceNodeId6 = String(value112 || '')['trim']();
    return createAudioVoiceGenerationTaskStoreAdapter({
      sourceNodeId: sourceNodeId6,
      segmentId: segmentId3,
      targetNodeId: targetNodeId3,
      readCurrentSourceNodeId: () => sourceNodeId3,
      readCurrentSegment: (value113) => segments3[run21(value113)] || {},
      updateCurrentSegment: updateCurrentSegment,
      readPersistedSnapshot: (value114) => {
        const stateSnapshot = getStateSnapshot(store2)['nodes']?.[value114];
        return resolveAudioVoicePersistedAnalysisSnapshot(stateSnapshot);
      },
      writePersistedSnapshot: (value115, event2) => {
        const stateSnapshot2 = getStateSnapshot(store2)['nodes']?.[sourceNodeId6];
        if (!stateSnapshot2 || value115 !== sourceNodeId6) return;
        (store2['updateNodeData'](value115, { [AUDIO_VOICE_ANALYSIS_STATE_FIELD]: event2 }),
          map7['set'](event2['key'], event2));
      },
      buildTaskNode: buildTaskNode,
    });
  }
  function createTaskStore(segmentId4, targetNodeId4, sourceNodeId7 = sourceNodeId3) {
    return cancelInFlight['getStore']({
      sourceNodeId: sourceNodeId7,
      segmentId: segmentId4,
      targetNodeId: targetNodeId4,
    });
  }
  function run22(value116, value117 = {}) {
    const cancellable2 = cancellable(value117),
      disabled = resolveGenerationButtonMode(buildTaskNode(value117), {
        cancellable: cancellable2,
        cancelInFlight: cancelInFlight['isCancelInFlight'](sourceNodeId3, value117['id']),
      });
    if (disabled['busy'] && disabled['canCancel']) {
      setGenerateButtonCancellableUi(value116, {
        title: panelText('actions.cancelGeneration'),
        tooltip: panelText('actions.cancelGeneration'),
        ariaLabel: panelText('actions.cancelGeneration'),
        color: 'var(--red)',
        busy: true,
      });
      return;
    }
    if (disabled['busy']) {
      setGenerateButtonLoadingUi(value116, {
        title: panelText('status.generating'),
        tooltip: panelText('status.generating'),
        disabled: disabled['disabled'],
        ariaLabel: panelText('status.generating'),
      });
      return;
    }
    resetGenerateButtonIdleUi(value116, panelText('actions.generate'));
  }
  function commitSegments(list10) {
    segments3 = list10['map'](cloneAudioVoiceSegment);
    const map11 = new Set(segments3['map']((value118) => value118['id']));
    for (const value119 of [...map6]) {
      if (!map11['has'](value119)) map6['delete'](value119);
    }
    ((map5 = new Set([...map5]['filter']((value120) => map11['has'](value120)))), run5(), render(), run23());
  }
  function run24(enabled4) {
    if (!enabled4 || !sourceNodeId3 || typeof store2?.['updateNodeData'] !== 'function') return;
    const args4 = getStateSnapshot(store2)['nodes']?.[sourceNodeId3];
    if (!isAudioVoiceSourceNode(args4)) return;
    const audioVoicePersistedAnalysisSnapshot2 = resolveAudioVoicePersistedAnalysisSnapshot(args4);
    if (
      audioVoicePersistedAnalysisSnapshot2 &&
      JSON['stringify'](audioVoicePersistedAnalysisSnapshot2) === JSON['stringify'](enabled4)
    ) {
      sourceNode3 = args4;
      return;
    }
    const args5 = { [AUDIO_VOICE_ANALYSIS_STATE_FIELD]: enabled4 };
    (store2['updateNodeData'](sourceNodeId3, args5), (sourceNode3 = { ...args4, ...args5 }));
  }
  function run5({ markLastUsed: markLastUsed = false } = {}) {
    markLastUsed && sourceNodeId3 && (lastUsedAt2 = Math['max'](lastUsedAt2, Date['now']()));
    const event3 = buildAudioVoiceVideoAnalysisMemorySnapshot({
      sourceNode: sourceNode3,
      sourceNodeId: sourceNodeId3,
      segments: segments3,
      analysisSourceAudioLocalPath: analysisSourceAudioLocalPath3,
      analysisSourceAudioUrl: analysisSourceAudioUrl2,
      analysisStatus: analysisStatus2,
      lastUsedAt: lastUsedAt2,
      completedComposeKey: completedComposeKey2,
    });
    if (!event3) return;
    if (event3['analysisStatus'] !== 'ready' && event3['segments']['length'] <= 0) return;
    (map7['set'](event3['key'], event3), run24(event3));
  }
  function run25(value121) {
    ((map5 = new Set()), (audioVoiceInitialAnalysisProgress = null));
    const audioVoiceAnalysisMemoryKey = resolveAudioVoiceAnalysisMemoryKey(value121),
      event4 =
        (audioVoiceAnalysisMemoryKey ? map7['get'](audioVoiceAnalysisMemoryKey) : null) ||
        resolveAudioVoicePersistedAnalysisSnapshot(value121);
    if (!event4)
      return (
        (segments3 = []),
        map6['clear'](),
        (analysisSourceAudioLocalPath3 = ''),
        (analysisSourceAudioUrl2 = ''),
        (analysisStatus2 = 'idle'),
        (lastUsedAt2 = 0),
        (completedComposeKey2 = ''),
        false
      );
    ((segments3 = event4['segments']['map']((value122) =>
      cloneAudioVoiceSegment(normalizeAudioVoiceSegmentModelSelection(value122, defaultAudioVoiceModelId)),
    )),
      map6['clear'](),
      (analysisSourceAudioLocalPath3 = normalizeLocalPath(event4['analysisSourceAudioLocalPath'] || '')),
      (analysisSourceAudioUrl2 = firstNonEmptyString(
        event4['analysisSourceAudioUrl'],
        localPathToUrl(analysisSourceAudioLocalPath3),
      )),
      (analysisStatus2 =
        event4['analysisStatus'] === 'ready' || segments3['length'] > 0 ? 'ready' : 'idle'),
      (lastUsedAt2 = normalizeAudioVoiceLastUsedAt(event4['lastUsedAt'])),
      (completedComposeKey2 = String(event4['completedComposeKey'] || '')));
    const value123 = { ...event4, segments: segments3['map'](cloneAudioVoiceSegment) };
    return (
      map7['set'](event4['key'], value123),
      run24(value123),
      void audioVoiceTaskRecoveryManager['recover']({
        sourceNodeId: sourceNodeId3,
        segments: segments3,
        resolveModelOption: resolveModelOption,
        createTaskStore: createTaskStore,
        buildResultPatch: buildResultPatch,
        getErrorMessage: (value124) => error3(value124, panelText('toasts.generateFailed')),
        cancelledMessage: panelText('toasts.generationCancelled'),
      }),
      true
    );
  }
  function loadSourceNode(value125, { markLastUsed: markLastUsed = false } = {}) {
    (run8(),
      void analysisSession['invalidate'](),
      session['invalidateAll'](),
      (enabled2 = null),
      (map9 = new Set()),
      progressTracker['clear'](),
      run5(),
      (sourceNode3 = value125 || null),
      (sourceNodeId3 = sourceNode3?.['id'] || ''),
      (lastUsedAt2 = 0),
      map10['clear'](),
      run25(sourceNode3));
    if (markLastUsed) run5({ markLastUsed: true });
    (render(), run23());
  }
  function run23() {
    const visibleAudioVoiceSegments = getVisibleAudioVoiceSegments(segments3)
      ['slice'](0, AUDIO_VOICE_WARM_SEGMENT_LIMIT)
      ['flatMap']((value126) => [
        resolveSegmentLocalAudioUrl(value126['sourceAudioUrl'], value126['sourceAudioLocalPath']),
        value126['convertedAudioReady']
          ? resolveSegmentLocalAudioUrl(value126['convertedAudioUrl'], value126['convertedAudioLocalPath'])
          : '',
      ])
      ['filter'](Boolean);
    void map10['warmMany'](visibleAudioVoiceSegments, { limit: AUDIO_VOICE_WARM_SEGMENT_LIMIT * 2 });
  }
  function closeInlineMenus() {
    const list11 = panel['querySelectorAll']?.(
      '.audio-voice-more-wrap.is-open, .audio-voice-history-wrap.is-open, .audio-voice-global-settings.is-open, .audio-voice-asr-settings.is-open, .audio-voice-translation-settings.is-open, .is-model-submenu-open',
    );
    list11?.['forEach']((el6) => {
      (el6['classList']['remove']('is-open', 'is-model-submenu-open'),
        el6['querySelector']?.('[aria-expanded="true"]')?.['setAttribute']?.('aria-expanded', 'false'));
    });
  }
  function run26() {
    if (!sourceNode3) return panelText('status.noSource');
    if (analysisStatus2 === 'analyzing') return panelText('status.analyzing');
    if (analysisStatus2 === 'error') return panelText('status.analysisFailed');
    const count10 = audioVoiceSegmentMergeController['getProjectedVisibleSegments']()['length'];
    if (count10 || analysisStatus2 === 'ready') return panelText('status.detectedCount', { count: count10 });
    return panelText('status.notAnalyzed');
  }
  function onProgress(options27 = {}) {
    ((audioVoiceInitialAnalysisProgress = {
      stage: normalizeAnalysisProgressStage(
        options27['stage'] || audioVoiceInitialAnalysisProgress?.['stage'],
      ),
      progress: clampProgress01(
        options27['progress'] ?? audioVoiceInitialAnalysisProgress?.['progress'] ?? 0,
      ),
    }),
      run27());
  }
  function run28() {
    return panelText(
      'progress.' + normalizeAnalysisProgressStage(audioVoiceInitialAnalysisProgress?.['stage']),
    );
  }
  function run29() {
    if (analysisStatus2 !== 'analyzing' || !audioVoiceInitialAnalysisProgress) return null;
    const el7 = createEl('section', 'audio-voice-analysis-progress'),
      el8 = createEl('div', 'audio-voice-analysis-progress-head');
    el8['append'](
      createEl('div', 'audio-voice-analysis-progress-title', run28()),
      createEl(
        'div',
        'audio-voice-analysis-progress-percent',
        Math['round'](clampProgress01(audioVoiceInitialAnalysisProgress['progress']) * 100) + '%',
      ),
    );
    const el9 = createEl('div', 'update-banner-progress-track audio-voice-analysis-progress-track'),
      el10 = createEl('div', 'update-banner-progress-bar audio-voice-analysis-progress-bar');
    ((el10['style']['width'] =
      Math['round'](clampProgress01(audioVoiceInitialAnalysisProgress['progress']) * 100) + '%'),
      el9['appendChild'](el10));
    const el11 = createEl(
      'div',
      'update-banner-progress-text audio-voice-analysis-progress-text',
      panelText('progress.' + normalizeAnalysisProgressStage(audioVoiceInitialAnalysisProgress['stage'])),
    );
    return (el7['append'](el8, el9, el11), el7);
  }
  function run30({
    alert: alert = null,
    className: className = '',
    helpLabel: helpLabel = '',
    settingsLabel: settingsLabel = '',
    closeLabel: closeLabel = '',
    helpAction: helpAction = '',
    settingsAction: settingsAction = '',
    closeAction: closeAction = '',
  } = {}) {
    if (!alert) return null;
    const el12 = createEl(
      'section',
      ['audio-voice-asr-config-alert', className]['filter'](Boolean)['join'](' '),
    );
    el12['setAttribute']('role', 'alert');
    const el13 = createEl('span', 'audio-voice-asr-config-alert-icon');
    (el13['setAttribute']('aria-hidden', 'true'), (el13['innerHTML'] = iconSvg('settings')));
    const el14 = createEl('div', 'audio-voice-asr-config-alert-body'),
      el15 = createEl('div', 'audio-voice-asr-config-alert-title', alert['title']),
      el16 = createEl('div', 'audio-voice-asr-config-alert-message');
    (el16['appendChild'](document['createTextNode'](alert['message'])),
      el16['appendChild'](document['createTextNode'](' ')));
    const el17 = createEl('button', 'audio-voice-asr-config-alert-link', helpLabel);
    ((el17['type'] = 'button'),
      (el17['dataset']['audioVoiceAction'] = helpAction),
      el16['appendChild'](el17),
      el14['append'](el15, el16));
    const el18 = createEl('div', 'audio-voice-asr-config-alert-actions'),
      el19 = createEl('button', 'audio-voice-asr-config-alert-btn', settingsLabel);
    ((el19['type'] = 'button'), (el19['dataset']['audioVoiceAction'] = settingsAction));
    const el20 = createEl('button', 'audio-voice-asr-config-alert-close', '×');
    return (
      (el20['type'] = 'button'),
      (el20['title'] = closeLabel),
      el20['setAttribute']('aria-label', closeLabel),
      (el20['dataset']['audioVoiceAction'] = closeAction),
      el18['append'](el19, el20),
      el12['append'](el13, el14, el18),
      el12
    );
  }
  function run31() {
    return run30({
      alert: alert2,
      helpLabel: panelText('asrApiKeyHelp.howToGet'),
      settingsLabel: panelText('asrApiKeyHelp.openSettings'),
      closeLabel: panelText('asrApiKeyHelp.close'),
      helpAction: 'show-asr-api-key-guide',
      settingsAction: 'open-asr-api-key-settings',
      closeAction: 'close-asr-config-alert',
    });
  }
  function run32() {
    return run30({
      alert: alert3,
      className: 'audio-voice-translation-config-alert',
      helpLabel: panelText('translationApiKeyHelp.howToGet'),
      settingsLabel: panelText('translationApiKeyHelp.openSettings'),
      closeLabel: panelText('translationApiKeyHelp.close'),
      helpAction: 'show-translation-api-key-guide',
      settingsAction: 'open-translation-api-key-settings',
      closeAction: 'close-translation-config-alert',
    });
  }
  function run33() {
    const list12 = getAudioVoiceAsrProviderOptions();
    audioVoiceAsrProvider = normalizeAudioVoiceAsrProvider(audioVoiceAsrProvider);
    const value127 = list12['find']((value128) => value128['id'] === audioVoiceAsrProvider) || list12[0],
      provider2 = value127?.['label'] || '',
      panelText5 = panelText('actions.subtitleRecognitionWithName', { provider: provider2 }),
      el21 = createEl('div', 'audio-voice-asr-settings'),
      el22 = createEl('button', 'audio-voice-asr-settings-btn');
    ((el22['type'] = 'button'),
      (el22['title'] = panelText5),
      el22['setAttribute']('aria-label', panelText5),
      el22['append'](
        createAudioVoiceModelIcon(value127 || {}, 'audio-voice-global-model-trigger-icon'),
        createEl('span', 'audio-voice-btn-label audio-voice-global-model-trigger-label', panelText5),
      ),
      (el22['dataset']['audioVoiceAction'] = 'toggle-asr-settings'));
    const el23 = createEl('div', 'audio-voice-asr-settings-menu');
    return (
      el23['appendChild'](
        createEl('div', 'audio-voice-global-settings-title', panelText('settings.subtitleRecognition')),
      ),
      list12['forEach']((value129) => {
        const el24 = createEl('button', 'audio-voice-global-model-item');
        ((el24['type'] = 'button'),
          (el24['dataset']['audioVoiceAction'] = 'select-asr-provider'),
          (el24['dataset']['providerId'] = value129['id']));
        if (value129['id'] === audioVoiceAsrProvider) el24['classList']['add']('is-active');
        const audioVoiceModelIcon = createAudioVoiceModelIcon(value129, 'audio-voice-global-model-provider'),
          el25 = createEl('span', 'audio-voice-global-model-body');
        (el25['append'](
          createEl('span', 'audio-voice-global-model-name', value129['label'] || value129['id']),
          createEl('span', 'audio-voice-global-model-subtitle', value129['subtitle'] || value129['id']),
        ),
          el24['append'](audioVoiceModelIcon, el25),
          el23['appendChild'](el24));
      }),
      el21['append'](el22, el23),
      el21
    );
  }
  function run34() {
    const list13 = getAudioVoicePanelModelOptions(),
      list14 = getAudioVoicePanelModelGroups();
    (!defaultAudioVoiceModelId ||
      !list13['some']((value130) => value130['id'] === defaultAudioVoiceModelId)) &&
      (defaultAudioVoiceModelId = getDefaultAudioVoiceModelId());
    const value131 =
        list13['find']((value132) => value132['id'] === defaultAudioVoiceModelId) || list13[0] || null,
      model = value131?.['label'] || panelText('settings.noModels'),
      panelText6 = panelText('actions.globalModelWithName', { model: model }),
      el26 = createEl('div', 'audio-voice-global-settings'),
      el27 = createEl('button', 'audio-voice-global-settings-btn');
    ((el27['type'] = 'button'),
      (el27['title'] = panelText6),
      el27['setAttribute']('aria-label', panelText6),
      el27['append'](
        createAudioVoiceModelIcon(value131 || {}, 'audio-voice-global-model-trigger-icon'),
        createEl('span', 'audio-voice-btn-label audio-voice-global-model-trigger-label', panelText6),
      ),
      (el27['dataset']['audioVoiceAction'] = 'toggle-global-settings'));
    const el28 = createEl('div', 'audio-voice-global-settings-menu'),
      handler = (value133) => {
        const el29 = createEl('button', 'audio-voice-global-model-item floating-menu-item');
        ((el29['type'] = 'button'),
          (el29['dataset']['audioVoiceAction'] = 'select-global-model'),
          (el29['dataset']['modelId'] = value133['id']));
        if (value133['id'] === defaultAudioVoiceModelId) el29['classList']['add']('is-active');
        const audioVoiceModelIcon2 = createAudioVoiceModelIcon(value133, 'audio-voice-global-model-provider'),
          el30 = createEl('span', 'audio-voice-global-model-body fmi-content');
        return (
          el30['append'](
            createEl('span', 'audio-voice-global-model-name fmi-title', value133['label'] || value133['id']),
            createEl(
              'span',
              'audio-voice-global-model-subtitle fmi-sub',
              value133['subtitle'] || value133['id'],
            ),
          ),
          el29['append'](audioVoiceModelIcon2, el30),
          value133['vip'] && el29['appendChild'](createEl('span', 'audio-voice-global-model-vip', 'VIP')),
          el29
        );
      };
    return (
      list13['length']
        ? list14['forEach']((value134) => {
            const el31 = createEl('div', 'audio-voice-global-model-group'),
              el32 = createEl(
                'button',
                'audio-voice-global-model-item audio-voice-global-model-group-trigger floating-menu-item',
              );
            ((el32['type'] = 'button'), el32['setAttribute']('aria-haspopup', 'menu'));
            value134['items']['some']((value135) => value135['id'] === defaultAudioVoiceModelId) &&
              el32['classList']['add']('is-active');
            const audioVoiceModelIcon3 = createAudioVoiceModelIcon(
                value134,
                'audio-voice-global-model-provider',
              ),
              el33 = createEl('span', 'audio-voice-global-model-body fmi-content');
            (el33['append'](
              createEl(
                'span',
                'audio-voice-global-model-name fmi-title',
                value134['label'] || value134['id'],
              ),
              createEl(
                'span',
                'audio-voice-global-model-subtitle fmi-sub',
                value134['subtitle'] || value134['id'],
              ),
            ),
              el32['append'](
                audioVoiceModelIcon3,
                el33,
                createEl('span', 'audio-voice-global-model-caret', '>'),
              ));
            const el34 = createEl('div', 'audio-voice-global-model-submenu');
            ((el34['dataset']['audioVoiceGlobalModelPortal'] = 'true'),
              value134['items']['forEach']((value136) => el34['appendChild'](handler(value136))),
              el31['appendChild'](el32),
              panel['appendChild'](el34),
              bindAudioVoiceModelSubmenuPosition(el31, el34, windowObject, {
                container: panel,
              }),
              el28['appendChild'](el31));
          })
        : el28['appendChild'](
            createEl('div', 'audio-voice-global-settings-empty', panelText('settings.noModels')),
          ),
      el26['append'](el27, el28),
      el26
    );
  }
  function run35() {
    const tooltip = panelText('actions.loadSelected'),
      { sourceActive: sourceActive } = canSelectAudioReference['getSnapshot'](),
      el35 = document['createElement']('template');
    el35['innerHTML'] = createPromptAttachmentButtonHTML({
      tooltip: tooltip,
      stroke: sourceActive ? 'var(--blue)' : 'var(--text-primary)',
      circleFill: sourceActive ? 'var(--blue)' : 'var(--text-primary)',
    })['trim']();
    const el36 = el35['content']['firstElementChild'],
      el37 = createEl('button', 'audio-voice-video-pick-btn agent-connect-btn prompt-attachment-btn');
    return (
      (el37['type'] = 'button'),
      (el37['title'] = tooltip),
      el37['setAttribute']('aria-label', tooltip),
      (el37['dataset']['audioVoiceAction'] = 'load-selected'),
      el37['classList']['toggle']('is-picking', sourceActive),
      el37['classList']['toggle']('is-connecting-active', sourceActive),
      el37['setAttribute']('aria-pressed', sourceActive ? 'true' : 'false'),
      (el37['disabled'] = run6()),
      el36?.['innerHTML'] && (el37['innerHTML'] = el36['innerHTML']),
      el37
    );
  }
  function run36() {
    const el38 = createEl('section', 'audio-voice-hero'),
      el39 = createEl('div', 'audio-voice-hero-cover'),
      value137 = sourceNode3 ? resolveAudioVoicePanelCoverUrl(sourceNode3) : '';
    if (value137) {
      const el40 = createEl('img', 'audio-voice-hero-img');
      ((el40['src'] = value137),
        (el40['alt'] = getSourceName(sourceNode3)),
        (el40['draggable'] = false),
        el39['appendChild'](el40));
    } else el39['innerHTML'] = iconSvg(isAudioVoiceAudioNode(sourceNode3) ? 'audio' : 'video');
    const el41 = createEl('div', 'audio-voice-hero-body');
    el41['append'](
      createEl('div', 'audio-voice-hero-name', getSourceName(sourceNode3 || {})),
      createEl(
        'div',
        'audio-voice-hero-meta',
        sourceNode3 ? getSourceMeta(sourceNode3) : panelText('source.emptyMeta'),
      ),
      createEl('div', 'audio-voice-hero-status', run26()),
    );
    const el42 = createEl('div', 'audio-voice-hero-actions'),
      el43 = createButton(
        'audio-voice-analyze-btn',
        panelText('actions.startAnalyzeTooltip'),
        'generate',
        analysisStatus2 === 'analyzing' ? panelText('status.analyzing') : panelText('actions.startAnalyze'),
      );
    ((el43['dataset']['audioVoiceAction'] = 'start-analyze'),
      (el43['disabled'] =
        analysisStatus2 === 'analyzing' || run6() || audioVoiceSegmentMergeController['hasPending']()),
      el42['append'](run33(), el43));
    if (!embedded) el38['appendChild'](run35());
    return (el38['append'](el39, el41, el42), el38);
  }
  function run37(value138 = '') {
    const args6 = getAudioVoiceTranslationLanguage(value138);
    if (!args6) return null;
    return { ...args6, label: panelText('translation.languages.' + args6['labelKey']) };
  }
  function run38() {
    return resolveAudioVoiceTranslationTargets(segments3, map5);
  }
  function run39() {
    return (
      analysisStatus2 === 'ready' &&
      run38()['targets']['length'] > 0 &&
      !run6() &&
      !runAudioVoiceBatchGenerationQueue2 &&
      !enabled2 &&
      !audioVoiceSegmentMergeController['hasPending']() &&
      !getVisibleAudioVoiceSegments(segments3)['some']((response8) => response8['status'] === 'generating')
    );
  }
  function run40() {
    const value139 = run6(),
      el44 = createEl('div', 'audio-voice-translation-settings'),
      el45 = createButton(
        'audio-voice-toolbar-btn audio-voice-translation-btn',
        panelText('actions.translateTooltip'),
        value139 ? 'loading' : 'translate',
        value139 ? panelText('status.translating') : panelText('actions.translate'),
      );
    ((el45['dataset']['audioVoiceAction'] = 'toggle-translation'),
      (el45['dataset']['loading'] = String(value139)),
      el45['classList']['toggle']('is-translating', value139),
      el45['setAttribute']('aria-haspopup', 'menu'),
      el45['setAttribute']('aria-expanded', 'false'),
      el45['setAttribute']('aria-busy', String(value139)),
      (el45['disabled'] = !run39()));
    const el46 = createEl('div', 'audio-voice-translation-menu');
    return (
      el46['setAttribute']('role', 'menu'),
      el46['setAttribute']('aria-label', panelText('translation.menuLabel')),
      AUDIO_VOICE_TRANSLATION_LANGUAGES['forEach']((error5) => {
        const value140 = run37(error5['id']),
          el47 = createEl(
            'button',
            'audio-voice-menu-item audio-voice-translation-language',
            value140?.['label'] || error5['name'],
          );
        ((el47['type'] = 'button'),
          el47['setAttribute']('role', 'menuitem'),
          (el47['dataset']['audioVoiceAction'] = 'translate-language'),
          (el47['dataset']['languageId'] = error5['id']),
          el46['appendChild'](el47));
      }),
      el44['append'](el45, el46),
      el44
    );
  }
  function run41() {
    const el48 = createEl('div', 'audio-voice-toolbar'),
      value141 = run42(),
      el49 = createEl('div', 'audio-voice-toolbar-primary');
    ([
      [
        'select-all',
        value141 ? panelText('toolbar.cancelSelectAll') : panelText('toolbar.selectAll'),
        'grid',
      ],
    ]['forEach'](([value142, value143, value144]) => {
      const el50 = createButton('audio-voice-toolbar-btn', value143, value144, value143);
      ((el50['dataset']['audioVoiceAction'] = value142),
        value142 === 'select-all' &&
          (el50['classList']['toggle']('is-active', value141),
          el50['setAttribute']('aria-pressed', value141 ? 'true' : 'false'),
          (el50['disabled'] = audioVoiceSegmentMergeController['hasPending']())),
        el49['appendChild'](el50));
    }),
      el49['appendChild'](run40()),
      el48['appendChild'](el49));
    const value145 = run43();
    if (value145) el48['appendChild'](value145);
    return el48;
  }
  function run42() {
    const list15 = getVisibleAudioVoiceSegments(segments3);
    return list15['length'] > 0 && list15['every']((value146) => map5['has'](value146['id']));
  }
  function run44() {
    return getVisibleAudioVoiceSegments(segments3)['filter']((value147) => map5['has'](value147['id']));
  }
  function run45() {
    const list16 = run44(),
      list17 = list16['length'] > 0 ? list16 : getVisibleAudioVoiceSegments(segments3);
    return list17['filter']((response9) => response9['status'] !== 'generating');
  }
  function run46(list18 = []) {
    const list19 = Array['isArray'](list18) ? list18 : [],
      list20 = list19['map']((value148) => {
        const value149 = run4(value148) || {},
          provider3 = value149['provider'] || 'runninghubwf',
          value150 = String(provider3)['trim']()['toLowerCase'](),
          adapterType = String(value149['adapterType'] || 'workflow')
            ['trim']()
            ['toLowerCase'](),
          value151 = value150 === 'runninghubwf' || (value150 === 'runninghub' && adapterType === 'workflow'),
          providerConfig3 = getProviderConfig(provider3) || {};
        return resolveAudioVoiceProviderBatchConcurrency(
          providerConfig3,
          { provider: provider3, adapterType: adapterType },
          value151 ? list19['length'] : 1,
        );
      }),
      list21 = list20['filter']((value152) => Number['isFinite'](Number(value152)) && Number(value152) > 0);
    if (list21['length'] <= 0) return 1;
    return normalizeAudioVoiceBatchConcurrencyLimit(Math['min'](...list21), 1);
  }
  function run47() {
    return analysisStatus2 === 'ready' && getVisibleAudioVoiceSegments(segments3)['length'] > 0;
  }
  function run48(clips = buildAudioVoiceComposeTimelineClips(segments3)) {
    const sourceLocalPath = resolveAudioVoiceSourceLocalPath(sourceNode3 || {});
    if (!sourceLocalPath || clips['length'] < 1) return '';
    return JSON['stringify']({
      sourceNodeId: sourceNodeId3,
      sourceLocalPath: sourceLocalPath,
      durationSec: resolveAudioVoiceComposeDurationSec(sourceNode3, segments3),
      clips: clips,
    });
  }
  function run43() {
    panel['querySelectorAll']?.('[data-audio-voice-global-model-portal="true"]')?.['forEach']((el51) =>
      el51['remove'](),
    );
    if (!run47()) return null;
    const el52 = createEl('div', 'audio-voice-batch-actions'),
      value153 = run44()['length'] > 0,
      value154 = value153 ? panelText('actions.selectedGenerate') : panelText('actions.batchGenerate'),
      value155 = value153
        ? panelText('actions.selectedGenerateTooltip')
        : panelText('actions.batchGenerateTooltip'),
      enabled5 = Boolean(runAudioVoiceBatchGenerationQueue2),
      value156 = Boolean(value84?.['isRequested']?.()),
      el53 = createButton(
        'audio-voice-batch-action-btn audio-voice-batch-generate-btn',
        enabled5 ? panelText('actions.stopBatchGeneration') : value155,
        enabled5 ? 'loading' : 'generateAction',
        enabled5
          ? value156
            ? panelText('status.stopping')
            : panelText('actions.stopBatchGeneration')
          : value154,
      );
    ((el53['dataset']['audioVoiceAction'] = enabled5 ? 'cancel-batch-generation' : 'batch-generate'),
      (el53['dataset']['loading'] = String(enabled5)),
      el53['setAttribute']('aria-busy', String(enabled5)),
      (el53['disabled'] =
        value156 ||
        (!enabled5 && Boolean(enabled2)) ||
        run6() ||
        audioVoiceSegmentMergeController['hasPending']() ||
        (!enabled5 && run45()['length'] <= 0)));
    const list22 = buildAudioVoiceComposeTimelineClips(segments3),
      enabled6 = Boolean(enabled2),
      value157 = !enabled6 && completedComposeKey2 !== '' && completedComposeKey2 === run48(list22),
      el54 = createButton(
        'audio-voice-batch-action-btn audio-voice-compose-btn',
        enabled6
          ? panelText('status.composing')
          : value157
            ? panelText('actions.recomposeTooltip')
            : panelText('actions.composeAllTooltip'),
        enabled6 ? 'loading' : value157 ? 'check' : 'merge',
        enabled6
          ? panelText('status.composing')
          : value157
            ? panelText('status.composed')
            : panelText('actions.composeAll'),
      );
    return (
      (el54['dataset']['audioVoiceAction'] = 'compose-all'),
      (el54['dataset']['loading'] = String(enabled6)),
      el54['classList']['toggle']('is-composing', enabled6),
      el54['classList']['toggle']('is-composed', value157),
      el54['setAttribute']('aria-busy', String(enabled6)),
      (el54['disabled'] =
        enabled6 || run6() || audioVoiceSegmentMergeController['hasPending']() || list22['length'] < 1),
      el52['append'](run34(), run49(), el53, el54),
      el52
    );
  }
  function run50() {
    const list23 = getAudioVoicePanelModelOptions(),
      value158 =
        list23['find']((value159) => value159['id'] === defaultAudioVoiceModelId) || list23[0] || null;
    return [
      run47() ? 'show' : 'hide',
      analysisStatus2,
      panelText('actions.batchGenerate'),
      panelText('actions.selectedGenerate'),
      panelText('actions.composeAll'),
      defaultAudioVoiceModelId,
      value158?.['label'] || '',
      value158?.['icon'] || '',
      value158?.['iconAlt'] || '',
      runAudioVoiceBatchGenerationQueue2 ? 'generating' : 'idle',
      enabled2 ? 'composing' : 'idle',
      run6() ? 'translating' : 'translation-idle',
      audioVoiceSegmentMergeController['getOperations']()
        ['map']((value160) => value160['segmentIds']['join'](','))
        ['join']('|'),
      run44()
        ['map']((value161) => value161['id'])
        ['join'](','),
      getVisibleAudioVoiceSegments(segments3)
        ['map'](
          (response10) =>
            response10['id'] +
            ':' +
            response10['status'] +
            ':' +
            response10['activeAudio'] +
            ':' +
            (response10['convertedAudioReady'] ? 1 : 0),
        )
        ['join'](','),
      canSelectAudioReference['getSnapshot']()['audioSegmentId'],
    ]['join']('\x1f');
  }
  function run51() {
    const list24 = getAudioVoiceAsrProviderOptions(),
      value162 =
        list24['find']((value163) => value163['id'] === audioVoiceAsrProvider) || list24[0] || null;
    return [
      sourceNodeId3,
      sourceNode3 ? getSourceName(sourceNode3) : '',
      sourceNode3 ? getSourceMeta(sourceNode3) : panelText('source.emptyMeta'),
      sourceNode3 ? resolveAudioVoicePanelCoverUrl(sourceNode3) : '',
      analysisStatus2,
      run26(),
      audioVoiceAsrProvider,
      value162?.['label'] || '',
      value162?.['icon'] || '',
      value162?.['iconAlt'] || '',
      canSelectAudioReference['getSnapshot']()['sourceActive'] ? '1' : '0',
      run6() ? 'translating' : 'translation-idle',
    ]['join']('\x1f');
  }
  function run52() {
    const value164 = run51();
    if (value79 && value80 === value164) return value79;
    return ((value80 = value164), (value79 = run36()), value79);
  }
  function run53() {
    return [
      panelText('toolbar.selectAll'),
      panelText('toolbar.cancelSelectAll'),
      panelText('actions.translate'),
      panelText('actions.translateTooltip'),
      panelText('status.translating'),
      AUDIO_VOICE_TRANSLATION_LANGUAGES['map']((value165) =>
        panelText('translation.languages.' + value165['labelKey']),
      )['join'](','),
      run42() ? 'all' : 'partial',
      audioVoiceSegmentMergeController['getProjectedVisibleSegments']()['length'],
      run6() ? 'translating' : 'translation-idle',
      run50(),
    ]['join']('\x1f');
  }
  function run54() {
    const value166 = run53();
    if (value81 && value82 === value166) return value81;
    return ((value82 = value166), (value81 = run41()), value81);
  }
  function run55(list25) {
    const list26 = list25['filter'](Boolean);
    list26['forEach']((value167, value168) => {
      if (el5['children'][value168] === value167) return;
      el5['insertBefore'](value167, el5['children'][value168] || null);
    });
    while (el5['children']['length'] > list26['length']) {
      el5['removeChild'](el5['lastElementChild']);
    }
  }
  function run56(options28 = {}, value169 = 1) {
    const error6 = resolveAudioVoiceSegmentAudioInput(options28, value169),
      enabled7 = String(error6['name'] || error6['nodeId'] || '')['trim']();
    if (!enabled7) return '+';
    const value170 = enabled7['replace'](/\.[^.\\/:]+$/, '')['trim']();
    return Array['from'](value170 || enabled7)
      ['slice'](0, 2)
      ['join']('')
      ['toUpperCase']();
  }
  function run57(value171, value172) {
    const enabled8 = segments3[run21(value171)],
      enabled9 = String(value172 || '')['trim']();
    if (!enabled8 || !enabled9) return null;
    return (
      normalizeAudioVoiceHistory(enabled8['convertedAudioHistory'])['find'](
        (value173) => value173['id'] === enabled9,
      ) || null
    );
  }
  function run58(value174) {
    const value175 = new Date(Number(value174 || 0) || Date['now']()),
      handler2 = (value176) => String(value176)['padStart'](2, '0');
    return (
      handler2(value175['getMonth']() + 1) +
      '/' +
      handler2(value175['getDate']()) +
      ' ' +
      handler2(value175['getHours']()) +
      ':' +
      handler2(value175['getMinutes']())
    );
  }
  function run59(options29 = {}) {
    if (typeof options29['_audioVoiceConvertedRowVisible'] === 'boolean')
      return options29['_audioVoiceConvertedRowVisible'];
    return shouldShowConvertedRow(options29) || map6['has'](String(options29['id'] || ''));
  }
  function run60(value177, value178, value179, value180 = 'converted') {
    const el55 = createEl('textarea', 'audio-voice-line-text audio-voice-line-input');
    return (
      (el55['rows'] = 1),
      (el55['value'] = String(value178 || '')),
      (el55['placeholder'] = String(value179 || '')),
      (el55['autocomplete'] = 'off'),
      (el55['spellcheck'] = true),
      (el55['dataset']['audioVoiceTextInput'] = 'true'),
      (el55['dataset']['audioVoiceTextKind'] = value180 === 'source' ? 'source' : 'converted'),
      (el55['dataset']['segmentId'] = value177['id']),
      el55['setAttribute']('aria-multiline', 'true'),
      el55['setAttribute']('aria-label', value179 || panelText('actions.editSource')),
      el55
    );
  }
  function run61(value181) {
    const list27 = normalizeAudioVoiceHistory(value181['convertedAudioHistory']),
      el56 = createEl('div', 'audio-voice-history-wrap'),
      el57 = createButton(
        'audio-voice-icon-btn audio-voice-history-trigger',
        panelText('actions.history'),
        'history',
      );
    ((el57['dataset']['audioVoiceAction'] = 'toggle-history'),
      (el57['dataset']['segmentId'] = value181['id']),
      (el57['disabled'] = list27['length'] <= 0));
    if (el57['disabled']) el57['setAttribute']('aria-disabled', 'true');
    const el58 = createEl('div', 'audio-voice-history-menu');
    return (
      list27['length'] <= 0
        ? el58['appendChild'](createEl('div', 'audio-voice-history-empty', panelText('history.empty')))
        : list27['forEach']((value182, index2) => {
            const el59 = createEl('div', 'audio-voice-history-item'),
              el60 = createButton('audio-voice-history-play', panelText('history.play'), 'play');
            ((el60['dataset']['audioVoiceAction'] = 'play-history'),
              (el60['dataset']['segmentId'] = value181['id']),
              (el60['dataset']['historyId'] = value182['id']));
            const el61 = createEl('button', 'audio-voice-history-main');
            ((el61['type'] = 'button'),
              (el61['dataset']['audioVoiceAction'] = 'use-history'),
              (el61['dataset']['segmentId'] = value181['id']),
              (el61['dataset']['historyId'] = value182['id']),
              el61['append'](
                createEl(
                  'span',
                  'audio-voice-history-title',
                  value182['modelLabel'] || panelText('history.itemTitle', { index: index2 + 1 }),
                ),
                createEl('span', 'audio-voice-history-meta', run58(value182['createdAt'])),
              ),
              el59['append'](el60, el61),
              el58['appendChild'](el59));
          }),
      el56['append'](el57, el58),
      el56
    );
  }
  function run62(enabled10, value183) {
    const enabled11 = value183 === 'converted',
      el62 = createEl(
        'div',
        'audio-voice-audio-line ' +
          (enabled11 ? 'audio-voice-audio-line-converted' : 'audio-voice-audio-line-source'),
      );
    !enabled11 && run59(enabled10) && el62['classList']['add']('audio-voice-audio-line-source-has-draft');
    const value184 =
        enabled11 && !enabled10['convertedAudioReady']
          ? panelText('actions.generateAudio')
          : panelText('actions.playAudio'),
      el63 = createButton('audio-voice-line-play', value184, 'speaker');
    ((el63['dataset']['audioVoiceAction'] = enabled11 ? 'play-converted' : 'play-source'),
      (el63['dataset']['segmentId'] = enabled10['id']));
    const enabled12 = run59(enabled10);
    let value185 = null;
    if (enabled11 && !enabled10['error'])
      value185 = run60(
        enabled10,
        enabled10['targetText'] || enabled10['sourceText'],
        panelText('sentences.convertedPlaceholder'),
        'converted',
      );
    else {
      if (!enabled11 && !enabled12)
        value185 = run60(
          enabled10,
          enabled10['sourceText'],
          panelText('sentences.sourcePlaceholder'),
          'source',
        );
      else {
        const value186 = enabled11
          ? enabled10['targetText'] || enabled10['sourceText'] || panelText('sentences.convertedPlaceholder')
          : enabled10['sourceText'] || panelText('sentences.sourcePlaceholder');
        value185 = createEl('span', 'audio-voice-line-text', value186);
      }
    }
    const el64 = createEl('div', 'audio-voice-line-actions');
    if (enabled11) {
      const el65 = createButton(
        'audio-voice-icon-btn audio-voice-generate-btn',
        panelText('actions.generate'),
        'generate',
      );
      ((el65['dataset']['audioVoiceAction'] = 'generate'),
        (el65['dataset']['segmentId'] = enabled10['id']),
        run22(el65, enabled10),
        el64['append'](run61(enabled10), run49(enabled10['id']), el65));
    } else
      (el64['append'](
        createButton('audio-voice-icon-btn', panelText('actions.editSourceTooltip'), 'edit'),
        createButton('audio-voice-icon-btn', panelText('actions.alignSourceText'), 'align'),
      ),
        (el64['children'][0]['dataset']['audioVoiceAction'] = 'edit-source'),
        (el64['children'][1]['dataset']['audioVoiceAction'] = 'align-source'));
    return (
      [...el64['children']]['forEach']((el66) => {
        if (el66['matches']?.('button')) el66['dataset']['segmentId'] = enabled10['id'];
      }),
      el62['append'](el63, value185, el64),
      el62
    );
  }
  function run63(options30 = {}) {
    const enabled13 = String(options30['error'] || '')['trim']();
    if (!enabled13) return null;
    const el67 = createEl('div', 'audio-voice-segment-error', enabled13);
    return (el67['setAttribute']('role', 'status'), el67['setAttribute']('aria-live', 'polite'), el67);
  }
  function run64(segmentId5) {
    const el68 = createEl('div', 'audio-voice-more-wrap');
    if (run65(segmentId5)) {
      const el69 = createEl(
        'button',
        'audio-voice-imitate-tone-btn ' + (segmentId5['imitateToneEnabled'] ? 'is-active' : ''),
        panelText('actions.imitateTone'),
      );
      ((el69['type'] = 'button'),
        (el69['title'] = panelText('actions.imitateToneTooltip')),
        el69['setAttribute']('aria-label', el69['title']),
        (el69['dataset']['audioVoiceAction'] = 'toggle-imitate-tone'),
        (el69['dataset']['segmentId'] = segmentId5['id']),
        el69['setAttribute']('aria-pressed', segmentId5['imitateToneEnabled'] ? 'true' : 'false'),
        el68['appendChild'](el69));
    }
    const selectedModelId2 =
        segmentId5['voiceModelSelectionMode'] === 'global'
          ? ''
          : String(segmentId5['voiceModelId'] || '')['trim'](),
      model2 = selectedModelId2
        ? getAudioVoicePanelModelOptions()['find']((value187) => value187['id'] === selectedModelId2)
        : null;
    if (model2) {
      const el70 = createEl('span', 'audio-voice-segment-model-badge', model2['label'] || model2['id']);
      ((el70['title'] = panelText('actions.segmentModelWithName', {
        model: model2['label'] || model2['id'],
      })),
        el68['appendChild'](el70));
    }
    const el71 = createButton('audio-voice-more-trigger', panelText('actions.more'), 'more');
    ((el71['dataset']['audioVoiceAction'] = 'toggle-menu'),
      (el71['dataset']['segmentId'] = segmentId5['id']));
    const renderAudioVoiceSegmentInlineMenu2 = renderAudioVoiceSegmentInlineMenu({
      segmentId: segmentId5['id'],
      entries: getAudioVoiceSegmentMenuEntries(segmentId5),
      modelOptions: getAudioVoicePanelModelOptions(),
      selectedModelId: selectedModelId2,
      text: panelText,
      windowObject: windowObject,
    });
    return (el68['append'](el71, renderAudioVoiceSegmentInlineMenu2), el68);
  }
  function run66(value188) {
    const error7 = resolveAudioVoiceSegmentAudioInput(value188, 2),
      el72 = createEl('div', 'audio-voice-audio-param-wrap'),
      el73 = createEl('button', 'audio-voice-audio-param');
    el73['type'] = 'button';
    const value189 = !!error7['audioUrl'];
    el72['classList']['toggle']('has-audio-ref', value189);
    const value190 = canSelectAudioReference['getSnapshot']()['audioTargetSegmentIds']['includes'](
      value188['id'],
    );
    (el73['classList']['toggle']('has-audio-ref', value189),
      el73['classList']['toggle']('is-picking', value190),
      (el73['title'] = value189
        ? panelText('actions.changeVoiceCloneInputParam')
        : panelText('actions.voiceCloneInputParam')),
      el73['setAttribute']('aria-label', el73['title']),
      (el73['dataset']['audioVoiceAction'] = 'audio-param'),
      (el73['dataset']['segmentId'] = value188['id']));
    const el74 = createEl(
      'span',
      value189 ? 'audio-voice-audio-param-avatar' : 'audio-voice-audio-param-plus',
      error7['imageUrl'] ? '' : run56(value188, 2),
    );
    if (error7['imageUrl']) {
      const el75 = createEl('img', 'audio-voice-audio-param-image');
      ((el75['src'] = error7['imageUrl']),
        (el75['alt'] = error7['name'] || panelText('actions.voiceCloneInputParam')),
        (el75['draggable'] = false),
        el74['appendChild'](el75));
    }
    (el73['appendChild'](el74), el72['appendChild'](el73));
    if (value189) {
      const el76 = createButton(
        'audio-voice-audio-param-clear',
        panelText('actions.clearVoiceCloneInputParam'),
        'close',
      );
      ((el76['dataset']['audioVoiceAction'] = 'clear-audio-param'),
        (el76['dataset']['segmentId'] = value188['id']),
        el72['appendChild'](el76));
    }
    return el72;
  }
  function run67(value191) {
    const el77 = createEl('div', 'audio-voice-audio-param-stack');
    return (el77['appendChild'](run66(value191)), el77);
  }
  function run68(options31 = {}) {
    return map9['has'](String(options31?.['id'] || options31 || '')['trim']());
  }
  function run69(options32 = {}) {
    const value192 = String(options32?.['id'] || options32 || '')['trim']();
    return Boolean(value192 && value85?.['segmentIds']?.['has']?.(value192));
  }
  function run70(panelText7 = panelText('status.generating')) {
    const el78 = createEl('div', 'audio-voice-segment-loading storyboard-script-loading-overlay');
    return (
      el78['setAttribute']('role', 'status'),
      el78['setAttribute']('aria-live', 'polite'),
      el78['append'](
        createEl('span', 'storyboard-script-loading-spinner'),
        createEl('span', 'storyboard-script-loading-label', panelText7),
        (() => {
          const el79 = createEl('span', 'storyboard-script-loading-bar');
          return (el79['appendChild'](createEl('span', 'storyboard-script-loading-bar-fill')), el79);
        })(),
      ),
      el78
    );
  }
  function run71(el80) {
    el80?.['querySelectorAll']?.('button, input, textarea, select, [role="button"]')?.['forEach']((el81) => {
      if ('disabled' in el81) el81['disabled'] = true;
      el81['setAttribute']?.('aria-disabled', 'true');
      if (el81['hasAttribute']?.('tabindex')) el81['tabIndex'] = -1;
    });
  }
  function run72(response11, value193, value194) {
    const el82 = createEl('article', 'audio-voice-segment-card');
    ((el82['dataset']['segmentId'] = response11['id']),
      el82['classList']['add']('is-' + (response11['status'] || 'detected')));
    const value195 = run68(response11),
      value196 = audioVoiceSegmentMergeController['isMerging'](response11),
      value197 = run69(response11);
    (el82['classList']['toggle']('is-composing', value195 || value196),
      el82['classList']['toggle']('is-translating', value197),
      el82['setAttribute'](
        'aria-busy',
        String(response11['status'] === 'generating' || value195 || value196 || value197),
      ));
    const value198 = map5['has'](response11['id']);
    if (value198) el82['classList']['add']('is-selected');
    el82['setAttribute']('aria-selected', value198 ? 'true' : 'false');
    value83?.['ids']?.['has']?.(response11['id']) &&
      el82['classList']['add']('is-' + value83['type'] + '-animation');
    const el83 = createEl('div', 'audio-voice-segment-time-row');
    ((el83['dataset']['audioVoiceAction'] = 'toggle-select'),
      (el83['dataset']['segmentId'] = response11['id']),
      el83['setAttribute']('role', 'button'),
      (el83['tabIndex'] = 0),
      el83['append'](
        createEl(
          'div',
          'audio-voice-segment-time',
          formatAudioVoiceTimeRange(response11['startMs'], response11['endMs']),
        ),
        run64(response11),
      ));
    const el84 = createEl('div', 'audio-voice-segment-body'),
      el85 = createEl('div', 'audio-voice-segment-lines');
    el85['appendChild'](run62(response11, 'source'));
    shouldShowConvertedRow(response11) && el85['appendChild'](run62(response11, 'converted'));
    (el84['append'](run67(response11), el85), el82['append'](el83, el84));
    const value199 = run63(response11);
    if (value199) el82['appendChild'](value199);
    (response11['status'] === 'generating' || value195 || value196 || value197) &&
      el82['appendChild'](
        run70(
          value196
            ? panelText('status.merging')
            : value197
              ? panelText('status.translating')
              : value195
                ? panelText('status.composing')
                : response11['rhStatusMessage'] || panelText('status.generating'),
        ),
      );
    if (value196) run71(el82);
    return el82;
  }
  function run73(value200, value201, value202, value203) {
    const el86 = createButton('audio-voice-gap-pill', value201, value202, value201);
    return (
      (el86['dataset']['audioVoiceAction'] = value200),
      (el86['dataset']['segmentId'] = value203),
      el86
    );
  }
  function run74(value204, value205, list28) {
    const el87 = createEl('div', 'audio-voice-segment-gap-actions');
    el87['dataset']['segmentId'] = value204['id'];
    if (value205 >= list28['length'] - 1) el87['classList']['add']('is-last');
    if (value205 < list28['length'] - 1) {
      const el88 = run73('merge', panelText('actions.merge'), 'merge', value204['id']);
      ((el88['disabled'] =
        audioVoiceSegmentMergeController['isReserved'](value204) ||
        audioVoiceSegmentMergeController['isReserved'](list28[value205 + 1])),
        el87['appendChild'](el88));
    }
    const el89 = run73('insert', panelText('actions.insertSegment'), 'insert', value204['id']);
    return (
      (el89['disabled'] = audioVoiceSegmentMergeController['isReserved'](value204)),
      el87['appendChild'](el89),
      el87
    );
  }
  function run75() {
    const el90 = createEl('section', 'audio-voice-workspace'),
      el91 = createEl('div', 'audio-voice-workspace-title-row');
    el91['append'](
      createEl('div', 'audio-voice-workspace-title', panelText('sections.sentences')),
      createEl('div', 'audio-voice-workspace-count', run26()),
    );
    const el92 = createEl('div', 'audio-voice-segment-list'),
      list29 = audioVoiceSegmentMergeController['getProjectedVisibleSegments']();
    return (
      list29['length']
        ? list29['forEach']((value206, value207) => {
            (el92['appendChild'](run72(value206, value207, list29['length'])),
              el92['appendChild'](run74(value206, value207, list29)));
          })
        : el92['appendChild'](
            createEl(
              'div',
              'audio-voice-segment-empty',
              sourceNode3 ? panelText('sentences.analysisHint') : panelText('source.emptyMeta'),
            ),
          ),
      el90['append'](el91, el92),
      el90
    );
  }
  function render() {
    const list30 = [run52()],
      value208 = run31();
    if (value208) list30['push'](value208);
    const value209 = run32();
    if (value209) list30['push'](value209);
    const value210 = run29();
    if (value210) list30['push'](value210);
    (list30['push'](run54(), run75()), run55(list30), run76(), (value83 = null));
  }
  function run77() {
    let count11 = 0;
    return (
      panel['querySelectorAll']('.audio-voice-segment-card[data-segment-id]')['forEach']((el93) => {
        const enabled14 = String(el93['dataset']['segmentId'] || '')['trim']();
        if (!enabled14) return;
        count11 += 1;
        const value211 = map5['has'](enabled14);
        (el93['classList']['toggle']('is-selected', value211),
          el93['setAttribute']('aria-selected', value211 ? 'true' : 'false'));
      }),
      count11 > 0
    );
  }
  function run78(el94, enabled15) {
    if (!el94 || !enabled15 || el94 === enabled15) return true;
    if (!el94['isConnected']) return false;
    return (el94['replaceWith'](enabled15), true);
  }
  function run79() {
    const value212 = value81,
      value213 = run54();
    return run78(value212, value213);
  }
  function run27() {
    const enabled16 = panel['querySelector']?.('.audio-voice-analysis-progress'),
      enabled17 = run29();
    if (enabled16 && enabled17) return (enabled16['replaceWith'](enabled17), true);
    if (!enabled16 && !enabled17) return true;
    return (render(), false);
  }
  function run80() {
    const enabled18 = run77(),
      enabled19 = run79();
    (!enabled18 || !enabled19) && render();
  }
  function syncSourceUi() {
    const value214 = value79;
    value80 = '';
    const value215 = run52();
    !run78(value214, value215) && render();
  }
  function run81() {
    let enabled20 = true;
    getVisibleAudioVoiceSegments(segments3)['forEach']((value216) => {
      if (!run82(value216['id'])) enabled20 = false;
    });
    if (!enabled20) render();
    return enabled20;
  }
  function run83(value217) {
    (panel['classList']['toggle']('is-open', value217),
      panel['setAttribute']('aria-hidden', value217 ? 'false' : 'true'));
    if (!embedded) document?.['body']?.['classList']?.['toggle']('audio-voice-panel-open', value217);
    (fabBtnEl['classList']['toggle']('is-audio-voice-open', value217),
      !embedded &&
        dispatchWebPreviewPanelSync(value217 ? 'audio-voice-panel-open' : 'audio-voice-panel-close'));
  }
  function run84(onSuccess = null) {
    const run85 = windowObject?.['isModelAllowedBySubscription'];
    if (
      typeof run85 === 'function' &&
      run85(AUDIO_VOICE_STUDIO_VIP_MODEL_ID, AUDIO_VOICE_STUDIO_VIP_PROVIDER)
    )
      return true;
    return (
      typeof windowObject?.['openSubscriptionDialog'] === 'function'
        ? windowObject['openSubscriptionDialog']({
            modelId: AUDIO_VOICE_STUDIO_VIP_MODEL_ID,
            provider: AUDIO_VOICE_STUDIO_VIP_PROVIDER,
            onSuccess: onSuccess,
          })
        : windowObject?.['showToast']?.(panelText('vip.needAuthorization'), 'warn'),
      false
    );
  }
  function open(args7 = {}) {
    if (args7['skipSubscriptionGate'] !== true) {
      const enabled21 = run84(() => {
        open({ ...args7, skipSubscriptionGate: true });
      });
      if (!enabled21) return false;
    }
    const stateSnapshot3 = getStateSnapshot(store2);
    return (
      progressTracker['clear'](),
      canSelectAudioReference['stopAll'](),
      loadSourceNode(resolveAudioVoicePanelOpenSourceNode(stateSnapshot3, args7, sourceNodeId3), {
        markLastUsed: true,
      }),
      run83(true),
      true
    );
  }
  function close() {
    (run5({ markLastUsed: true }),
      run8(),
      void analysisSession['invalidate'](),
      session['invalidateAll'](),
      (enabled2 = null),
      (map9 = new Set()),
      progressTracker['clear'](),
      canSelectAudioReference['stopAll'](),
      map10['clear'](),
      closeVolcengineSpeechApiKeyGuide(),
      closeProviderApiKeyGuide(),
      audioVoiceSegmentContextMenuController['close'](),
      run83(false),
      closeInlineMenus());
  }
  function toggle() {
    if (panel['classList']['contains']('is-open')) {
      close();
      return;
    }
    open();
  }
  function run86(value218, { persist: persist = false } = {}) {
    const clampAudioVoicePanelWidth2 = clampAudioVoicePanelWidth(value218);
    document?.['body']?.['style']?.['setProperty']?.(
      '--audio-voice-panel-width',
      clampAudioVoicePanelWidth2 + 'px',
    );
    if (persist) writeStoredPanelWidth(clampAudioVoicePanelWidth2, windowObject);
    return clampAudioVoicePanelWidth2;
  }
  function run87(event5) {
    (event5['preventDefault']?.(), event5['stopPropagation']?.());
    const value219 = Number(event5['clientX']),
      enabled22 = panel['getBoundingClientRect']?.()['width'] || panel['offsetWidth'] || 0;
    if (!Number['isFinite'](value219) || !enabled22) return;
    document?.['body']?.['classList']?.['add']?.('audio-voice-panel-resizing');
    const value220 = (event6) => {
        const value221 = Number(event6['clientX']);
        if (!Number['isFinite'](value221)) return;
        run86(enabled22 + (value219 - value221));
      },
      value222 = (event7) => {
        (document?.['removeEventListener']?.('pointermove', value220),
          document?.['removeEventListener']?.('pointerup', value222),
          document?.['body']?.['classList']?.['remove']?.('audio-voice-panel-resizing'));
        const value223 = Number(event7['clientX']);
        Number['isFinite'](value223) && run86(enabled22 + (value219 - value223), { persist: true });
      };
    (document?.['addEventListener']?.('pointermove', value220),
      document?.['addEventListener']?.('pointerup', value222));
  }
  function run21(value224) {
    return segments3['findIndex']((value225) => value225['id'] === value224);
  }
  function run88(value226, args8) {
    commitSegments(segments3['map']((args9) => (args9['id'] === value226 ? { ...args9, ...args8 } : args9)));
  }
  function run89(value227, args10) {
    const count12 = run21(value227);
    if (count12 < 0) return null;
    const value228 = { ...segments3[count12], ...args10 };
    return (
      (segments3 = segments3['map']((value229, value230) => (value230 === count12 ? value228 : value229))),
      run5(),
      value228
    );
  }
  function run90(value231) {
    const enabled23 = String(value231 || '')['trim']();
    if (!enabled23) return null;
    return (
      [...panel['querySelectorAll']('.audio-voice-segment-card[data-segment-id]')]['find'](
        (el95) => el95['dataset']['segmentId'] === enabled23,
      ) || null
    );
  }
  function run82(value232) {
    const enabled24 = segments3[run21(value232)],
      el96 = run90(value232),
      enabled25 = el96?.['querySelector']?.('.audio-voice-more-wrap');
    if (!enabled24 || !enabled25) return false;
    return (enabled25['replaceWith'](run64(enabled24)), true);
  }
  function run91(value233) {
    const enabled26 = segments3[run21(value233)],
      el97 = run90(value233),
      enabled27 = el97?.['querySelector']?.('.audio-voice-audio-param-wrap');
    if (!enabled26 || !enabled27) return false;
    return (enabled27['replaceWith'](run66(enabled26)), true);
  }
  function syncAudioTargetUi(list31 = []) {
    const list32 = [
      ...new Set(
        (Array['isArray'](list31) ? list31 : [list31])
          ['map']((value234) => String(value234 || '')['trim']())
          ['filter'](Boolean),
      ),
    ];
    let enabled28 = run79();
    list32['forEach']((value235) => {
      if (!run91(value235)) enabled28 = false;
      if (!run82(value235)) enabled28 = false;
    });
    if (!enabled28) render();
    return enabled28;
  }
  function run92(el98, value236 = {}) {
    const el99 = el98?.['querySelector']?.('[data-audio-voice-text-input]');
    if (!el99) return false;
    const value237 = String(value236['targetText'] || value236['sourceText'] || '');
    return (
      el99 !== document?.['activeElement'] && el99['value'] !== value237 && (el99['value'] = value237),
      (el99['dataset']['segmentId'] = value236['id']),
      true
    );
  }
  function run93(el100, value238 = {}, value239 = {}) {
    const el101 = el100?.['querySelector']?.('.audio-voice-segment-lines');
    if (!el101) return false;
    let el102 = el101['querySelector']('.audio-voice-audio-line-source');
    const enabled29 = run59(value238),
      enabled30 = run59(value239);
    if (el102 && enabled29 !== enabled30)
      (el102['replaceWith'](run62(value239, 'source')),
        (el102 = el101['querySelector']('.audio-voice-audio-line-source')));
    else el102 && el102['classList']['toggle']('audio-voice-audio-line-source-has-draft', enabled30);
    const el103 = el101['querySelector']('.audio-voice-audio-line-converted');
    if (!enabled30) return (el103?.['remove']?.(), true);
    if (!el103) {
      const el104 = run62(value239, 'converted');
      return (el104['classList']['add']('is-entering'), el101['appendChild'](el104), true);
    }
    const value240 =
      !!String(value238['error'] || '')['trim']() !== !!String(value239['error'] || '')['trim']();
    if (!enabled29 || value240) return (el103['replaceWith'](run62(value239, 'converted')), true);
    if (!run92(el103, value239)) return (el103['replaceWith'](run62(value239, 'converted')), true);
    const value241 = el103['querySelector']('.audio-voice-history-wrap');
    if (value241) value241['replaceWith'](run61(value239));
    const value242 = el103['querySelector']('.audio-voice-generate-btn');
    if (value242) run22(value242, value239);
    const el105 = el103['querySelector']('.audio-voice-line-play');
    if (el105) {
      const value243 = value239['convertedAudioReady']
        ? panelText('actions.playAudio')
        : panelText('actions.generateAudio');
      ((el105['title'] = value243), el105['setAttribute']('aria-label', value243));
    }
    return true;
  }
  function run94(el106, response12 = {}) {
    const el107 = [...el106['children']]['find']((el108) =>
        el108['classList']?.['contains']?.('audio-voice-segment-loading'),
      ),
      value244 = run68(response12),
      value245 = audioVoiceSegmentMergeController['isMerging'](response12),
      value246 = run69(response12);
    (el106['classList']?.['toggle']?.('is-composing', value244 || value245),
      el106['classList']?.['toggle']?.('is-translating', value246),
      el106['setAttribute']?.(
        'aria-busy',
        String(response12['status'] === 'generating' || value244 || value245 || value246),
      ));
    if (response12['status'] === 'generating' || value244 || value245 || value246) {
      const value247 = value245
        ? panelText('status.merging')
        : value246
          ? panelText('status.translating')
          : value244
            ? panelText('status.composing')
            : response12['rhStatusMessage'] || panelText('status.generating');
      if (!el107) el106['appendChild'](run70(value247));
      else {
        const el109 = el107['querySelector']?.('.storyboard-script-loading-label');
        if (el109 && el109['textContent'] !== value247) el109['textContent'] = value247;
      }
      return;
    }
    el107?.['remove']?.();
  }
  function run95(el110, value248 = {}) {
    const el111 = [...el110['children']]['find']((el112) =>
        el112['classList']?.['contains']?.('audio-voice-segment-error'),
      ),
      enabled31 = String(value248['error'] || '')['trim']();
    if (!enabled31) {
      el111?.['remove']?.();
      return;
    }
    if (el111) {
      if (el111['textContent'] !== enabled31) el111['textContent'] = enabled31;
      return;
    }
    const enabled32 = run63(value248);
    if (!enabled32) return;
    const el113 = [...el110['children']]['find']((el114) =>
      el114['classList']?.['contains']?.('audio-voice-segment-body'),
    );
    if (el113?.['parentNode'] === el110 && el113['nextSibling']) {
      el110['insertBefore'](enabled32, el113['nextSibling']);
      return;
    }
    el110['appendChild'](enabled32);
  }
  function run96(options33 = {}, value249 = {}) {
    return (
      hasSegmentConvertedAudio(options33) !== hasSegmentConvertedAudio(value249) ||
      isSegmentUsingConvertedAudio(options33) !== isSegmentUsingConvertedAudio(value249) ||
      String(options33['voiceModelId'] || '') !== String(value249['voiceModelId'] || '') ||
      String(options33['voiceRefAudioUrl'] || '') !== String(value249['voiceRefAudioUrl'] || '') ||
      String(options33['voiceRefAudioLocalPath'] || '') !==
        String(value249['voiceRefAudioLocalPath'] || '') ||
      (options33['imitateToneEnabled'] === true) !== (value249['imitateToneEnabled'] === true)
    );
  }
  function run97(value250, response13 = {}, response14 = {}, { syncToolbar: syncToolbar = true } = {}) {
    const el115 = run90(value250);
    if (!el115 || !response14) return false;
    const value251 = 'is-' + (response13['status'] || 'detected'),
      value252 = 'is-' + (response14['status'] || 'detected');
    value251 !== value252 && (el115['classList']['remove'](value251), el115['classList']['add'](value252));
    const value253 = map5['has'](value250);
    (el115['classList']['toggle']('is-selected', value253),
      el115['setAttribute']('aria-selected', value253 ? 'true' : 'false'));
    if (!run93(el115, response13, response14)) return false;
    (run95(el115, response14), run94(el115, response14));
    if (run96(response13, response14)) {
      if (!run82(value250)) return false;
    }
    return syncToolbar ? run79() : true;
  }
  function run98(list33 = []) {
    let enabled33 = run79();
    [...new Set(list33['map']((value254) => String(value254 || '')['trim']())['filter'](Boolean))]['forEach'](
      (value255) => {
        const enabled34 = segments3[run21(value255)],
          enabled35 = run90(value255);
        if (!enabled34 || !enabled35) {
          enabled33 = false;
          return;
        }
        run94(enabled35, enabled34);
      },
    );
    if (!enabled33) render();
    return enabled33;
  }
  function run99(list34 = []) {
    let enabled36 = run79();
    ([...new Set(list34['map']((value256) => String(value256 || '')['trim']())['filter'](Boolean))][
      'forEach'
    ]((value257) => {
      const enabled37 = segments3[run21(value257)],
        enabled38 = run90(value257);
      if (!enabled37 || !enabled38) {
        enabled36 = false;
        return;
      }
      run94(enabled38, enabled37);
    }),
      syncSourceUi());
    if (!enabled36) render();
    return enabled36;
  }
  function run100(map12, list35 = []) {
    let enabled39 = true;
    [...new Set(list35['map']((value258) => String(value258 || '')['trim']())['filter'](Boolean))]['forEach'](
      (value259) => {
        const enabled40 = map12['get'](value259),
          enabled41 = segments3[run21(value259)];
        (!enabled40 || !enabled41 || !run97(value259, enabled40, enabled41, { syncToolbar: false })) &&
          (enabled39 = false);
      },
    );
    if (!run79()) enabled39 = false;
    if (!enabled39) render();
    return enabled39;
  }
  function run101(value260, value261) {
    const value262 = segments3[run21(value260)],
      enabled42 = run89(value260, value261);
    if (!enabled42) return null;
    if (!run97(value260, value262, enabled42)) render();
    return enabled42;
  }
  function run65(options34 = {}) {
    return (
      isAudioVoiceImitateToneWorkflow(run4(options34)?.['id']) &&
      !!resolveAudioVoiceSegmentAudioInput(options34, 2)['audioUrl']
    );
  }
  function run102(value263) {
    const enabled43 = String(value263 || '')['trim']();
    if (!enabled43) return [];
    const list36 =
      map5['has'](enabled43) && map5['size'] > 1
        ? getVisibleAudioVoiceSegments(segments3)
            ['filter']((value264) => map5['has'](value264['id']))
            ['map']((value265) => value265['id'])
        : [enabled43];
    return list36['filter']((value266) => {
      const value267 = segments3[run21(value266)];
      return run65(value267);
    });
  }
  function run103(value268, imitateToneEnabled2) {
    const list37 = run102(value268);
    if (list37['length'] <= 0) return false;
    const map13 = new Set(list37);
    ((segments3 = segments3['map']((args11) =>
      map13['has'](args11['id'])
        ? { ...args11, imitateToneEnabled: imitateToneEnabled2 === true, error: '' }
        : args11,
    )),
      run5());
    let enabled44 = true;
    list37['forEach']((value269) => {
      if (!run82(value269)) enabled44 = false;
    });
    if (!enabled44) render();
    return true;
  }
  function run104(enabled45) {
    if (!enabled45) return;
    const map14 = new Set(map5);
    (map14['has'](enabled45) ? map14['delete'](enabled45) : map14['add'](enabled45), (map5 = map14), run80());
  }
  function updateCurrentSegment(value270, args12) {
    const count13 = run21(value270);
    if (count13 < 0) return;
    const args13 = segments3[count13],
      value271 = { ...args13, ...args12 };
    ((segments3 = segments3['map']((value272, value273) => (value273 === count13 ? value271 : value272))),
      run5(),
      !run97(value270, args13, value271) && render());
  }
  function run2(value274, value275 = []) {
    const list38 = (Array['isArray'](value275) ? value275 : [value275])
      ['map']((value276) => String(value276 || '')['trim']())
      ['filter'](Boolean);
    value83 = list38['length'] ? { type: String(value274 || 'change'), ids: new Set(list38) } : null;
  }
  function run76() {
    const enabled46 = value78;
    if (!enabled46) return;
    ((value78 = ''), run105(enabled46, 'converted'));
  }
  function run105(value277, enabled47 = 'converted') {
    const enabled48 = String(value277 || '')['trim']();
    if (!enabled48) return false;
    const el116 =
      [...panel['querySelectorAll']('[data-audio-voice-text-input]')]['find'](
        (el117) =>
          el117['dataset']['segmentId'] === enabled48 &&
          (!enabled47 || el117['dataset']['audioVoiceTextKind'] === enabled47),
      ) || null;
    if (!el116) return false;
    el116['focus']?.();
    const value278 = String(el116['value'] || '')['length'];
    return (el116['setSelectionRange']?.(value278, value278), true);
  }
  function run106(value279, el118 = {}) {
    const value280 = String(value279 || '')['trim'](),
      count14 = run21(value280);
    if (count14 < 0) return false;
    const args14 = segments3[count14],
      _audioVoiceConvertedRowVisible = run59(args14);
    map6['add'](value280);
    const value281 = { ...args14, _audioVoiceConvertedRowVisible: _audioVoiceConvertedRowVisible };
    if (!run97(value280, value281, args14)) render();
    return (el118['focus'] !== false && run105(value280, 'converted'), true);
  }
  function run107(value282) {
    const value283 = String(value282 || '')['trim'](),
      count15 = run21(value283);
    if (count15 < 0 || !map6['has'](value283)) return false;
    const args15 = segments3[count15];
    if (shouldShowConvertedRow(args15)) return false;
    map6['delete'](value283);
    const value284 = { ...args15, _audioVoiceConvertedRowVisible: true };
    if (!run97(value283, value284, args15)) render();
    return true;
  }
  function run108(value285, value286 = 1) {
    const list39 = getVisibleAudioVoiceSegments(segments3),
      count16 = list39['findIndex']((value287) => value287['id'] === value285);
    if (count16 < 0) return false;
    const enabled49 = list39[count16 + value286];
    if (!enabled49) return false;
    return run106(enabled49['id'], { focus: true });
  }
  function run109(event8, el119) {
    if (!el119) return false;
    const enabled50 = String(el119['dataset']['segmentId'] || '')['trim']();
    if (!enabled50) return false;
    if (shouldCloseAudioVoiceEmptyConvertedTextEdit(event8, el119) && run107(enabled50))
      return (event8['preventDefault']?.(), event8['stopPropagation']?.(), true);
    if (event8['key'] === 'Enter' && el119['dataset']['audioVoiceTextKind'] === 'source')
      return (
        event8['preventDefault']?.(),
        event8['stopPropagation']?.(),
        run106(enabled50, { focus: true }),
        true
      );
    if (event8['key'] === 'Tab') {
      const value288 = event8['shiftKey'] ? -1 : 1;
      if (!run108(enabled50, value288)) return false;
      return (event8['preventDefault']?.(), event8['stopPropagation']?.(), true);
    }
    return false;
  }
  function run110(value289, value290, value291 = 'converted') {
    const count17 = run21(value289);
    if (count17 < 0) return;
    const args16 = segments3[count17],
      _audioVoiceConvertedRowVisible2 = run59(args16),
      value292 = { ...args16, ...buildAudioVoiceTextEditPatch(args16, value290) };
    value291 === 'converted' &&
      (shouldShowConvertedRow(value292) ? map6['delete'](value289) : map6['add'](value289));
    const value293 = _audioVoiceConvertedRowVisible2 !== run59(value292);
    ((segments3 = segments3['map']((value294) =>
      value294['id'] === value289 ? cloneAudioVoiceSegment(value292) : value294,
    )),
      run5());
    value293 && (value78 = value289);
    const enabled51 = run97(
      value289,
      { ...args16, _audioVoiceConvertedRowVisible: _audioVoiceConvertedRowVisible2 },
      value292,
    );
    if (!enabled51) {
      render();
      return;
    }
    value293 && run76();
  }
  async function run111(options35 = {}, value295 = {}, nodeId2 = sourceNodeId3) {
    const value296 = Math['max'](0, Math['round'](Number(value295['startMs']) || 0)),
      src2 =
        normalizeLocalPath(value295['localPath'] || '') ||
        String(value295['audioUrl'] || '')['trim']() ||
        analysisSourceAudioLocalPath3,
      response15 = await enqueueElectronMediaTask(
        {
          kind: 'audioCut',
          src: src2,
          nodeId: nodeId2,
          args: {
            start: Math['max'](0, (Number(options35['startMs'] || 0) - value296) / 1000),
            end: Math['max'](0, (Number(options35['endMs'] || 0) - value296) / 1000),
          },
        },
        { wait: true, timeout: AUDIO_CUT_TASK_TIMEOUT_MS },
      ),
      localPath = normalizeLocalPath(response15?.['localPath'] || response15?.['path'] || ''),
      audioUrl = firstNonEmptyString(response15?.['url'], localPathToUrl(localPath));
    if (!localPath && !audioUrl) throw new Error(panelText('toasts.sourceClipFailed'));
    return { localPath: localPath, audioUrl: audioUrl };
  }
  function run112(value297) {
    return (
      [...panel['querySelectorAll']('.audio-voice-segment-card')]['find'](
        (el120) => el120['dataset']['segmentId'] === value297,
      ) || null
    );
  }
  function run113(value298) {
    const value299 = run21(value298),
      anchorId = segments3[value299];
    if (!anchorId) return;
    const sourceNodeId8 = String(sourceNodeId3 || '')['trim']();
    if (!analysisSourceAudioLocalPath3) {
      windowObject?.['showToast']?.(panelText('toasts.sourceClipNeedsAnalysis'), 'warn');
      return;
    }
    const wrapperEl = run112(anchorId['id']);
    if (!wrapperEl) return;
    const sourceLocalPath2 = resolveAudioVoiceSourceClipEditBase(anchorId, {
      analysisSourceAudioLocalPath: analysisSourceAudioLocalPath3,
      analysisSourceAudioUrl: analysisSourceAudioUrl2,
    });
    if (!sourceLocalPath2['localPath'] && !sourceLocalPath2['audioUrl']) {
      windowObject?.['showToast']?.(panelText('toasts.sourceClipNeedsAnalysis'), 'warn');
      return;
    }
    AudioClipController['initForSource']({
      anchorId: anchorId['id'],
      wrapperEl: wrapperEl,
      sourceLocalPath: sourceLocalPath2['localPath'],
      sourceUrl: sourceLocalPath2['audioUrl'],
      initialStartSec: 0,
      initialEndSec:
        Math['max'](AUDIO_VOICE_SOURCE_CLIP_MIN_MS, Number(sourceLocalPath2['durationMs'] || 0)) / 1000,
      allowSplit: true,
      dimMode: false,
      onConfirm: async ({ startSec: startSec, endSec: endSec, splitSec: splitSec, ranges: ranges }) => {
        const enabled52 = session['begin']({
          kind: 'source-clip',
          sourceNodeId: sourceNodeId8,
          segmentId: anchorId['id'],
        });
        if (!enabled52) {
          run3();
          return;
        }
        let list40 = null;
        try {
          const list41 = Array['isArray'](ranges)
              ? ranges['map']((value300) => ({
                  id: String(value300?.['id'] || ''),
                  startMs:
                    sourceLocalPath2['startMs'] +
                    Math['round'](Math['max'](0, Number(value300?.['startSec']) || 0) * 1000),
                  endMs:
                    sourceLocalPath2['startMs'] +
                    Math['round'](Math['max'](0, Number(value300?.['endSec']) || 0) * 1000),
                }))['sort']((value301, value302) => value301['startMs'] - value302['startMs'])
              : null,
            rangesMs = Array['isArray'](list41) && list41['length'] >= 2,
            selectionStartMs = rangesMs
              ? list41[0]['startMs']
              : sourceLocalPath2['startMs'] +
                Math['round'](Math['max'](0, Number(startSec) || 0) * 1000),
            selectionEndMs = rangesMs
              ? list41[list41['length'] - 1]['endMs']
              : sourceLocalPath2['startMs'] + Math['round'](Math['max'](0, Number(endSec) || 0) * 1000),
            args17 = await commitAudioVoiceSourceClipEdit(anchorId, {
              selectionStartMs: selectionStartMs,
              selectionEndMs: selectionEndMs,
              rangesMs: rangesMs ? list41 : null,
              splitAtMs:
                rangesMs || splitSec === undefined || splitSec === null
                  ? null
                  : sourceLocalPath2['startMs'] +
                    Math['round'](Math['max'](0, Number(splitSec) || 0) * 1000),
              newSegmentId: anchorId['id'] + '-split-' + Date['now'](),
              editBase: sourceLocalPath2,
              cutRange: (value303) => run111(value303, sourceLocalPath2, sourceNodeId8),
            });
          if (!session['isCurrent'](enabled52, sourceNodeId3)) return;
          ((list40 = []),
            segments3['forEach']((value304) => {
              if (value304['id'] !== anchorId['id']) {
                list40['push'](value304);
                return;
              }
              list40['push'](...args17);
            }));
        } finally {
          session['finish'](enabled52);
        }
        (commitSegments(list40),
          windowObject?.['showToast']?.(panelText('toasts.sourceClipApplied'), 'success'));
      },
    });
  }
  async function run114(value305) {
    const enabled53 = String(value305 || '')['trim']();
    if (!enabled53) {
      windowObject?.['showToast']?.(panelText('toasts.audioMissing'), 'warn');
      return;
    }
    const response16 = await map10['play'](enabled53);
    if (response16['status'] === 'unavailable') {
      windowObject?.['showToast']?.(panelText('toasts.playUnavailable'), 'warn');
      return;
    }
    response16['status'] === 'failed' &&
      windowObject?.['showToast']?.(panelText('toasts.playFailed'), 'warn');
  }
  function run115(value306, value307) {
    const enabled54 = segments3[run21(value306)];
    if (!enabled54) return;
    if (value307 === 'converted') {
      if (!enabled54['convertedAudioReady']) {
        void run116(value306);
        return;
      }
      void run114(
        resolveSegmentLocalAudioUrl(enabled54['convertedAudioUrl'], enabled54['convertedAudioLocalPath']),
      );
      return;
    }
    void run114(resolveSegmentLocalAudioUrl(enabled54['sourceAudioUrl'], enabled54['sourceAudioLocalPath']));
  }
  function run117(value308, kind, value309) {
    const segment = segments3[run21(value308)];
    if (!segment) return;
    const args18 = {
      segment: segment,
      kind: kind,
      sourceName: getSourceName(sourceNode3 || {}),
      text: panelText,
      showToast: windowObject?.['showToast'],
    };
    if (value309 === 'download') {
      void saveAudioVoiceSegmentDownload(args18);
      return;
    }
    addAudioVoiceSegmentAudioToCanvas({
      ...args18,
      store: store2,
      anchorNode: sourceNode3,
      windowObject: windowObject,
    });
  }
  async function persistAudioOutput(value310) {
    const enabled55 = String(value310 || '')['trim']();
    if (!enabled55) return { localPath: '', audioUrl: '' };
    const localPath2 = normalizeLocalPath(enabled55);
    if (localPath2) return { localPath: localPath2, audioUrl: localPathToUrl(localPath2) };
    const saveRemoteAudioLocallyDetailed2 = await saveRemoteAudioLocallyDetailed(enabled55),
      localPath3 = normalizeLocalPath(
        saveRemoteAudioLocallyDetailed2?.['localPath'] ||
          saveRemoteAudioLocallyDetailed2?.['originalLocalPath'] ||
          pickResultLocalPath(saveRemoteAudioLocallyDetailed2),
      );
    if (!localPath3) throw new Error(panelText('toasts.localSaveGeneratedFailed'));
    const audioDuration = pickAudioDurationSec(
      saveRemoteAudioLocallyDetailed2?.['audioDuration'],
      saveRemoteAudioLocallyDetailed2?.['duration'],
    );
    return {
      ...(saveRemoteAudioLocallyDetailed2 && typeof saveRemoteAudioLocallyDetailed2 === 'object'
        ? saveRemoteAudioLocallyDetailed2
        : {}),
      localPath: localPath3,
      audioUrl: localPathToUrl(localPath3),
      ...(audioDuration > 0 ? { audioDuration: audioDuration } : {}),
    };
  }
  async function run118(
    args19,
    {
      ownerSourceNodeId: ownerSourceNodeId = '',
      ownerAnalysisSourceAudioLocalPath: ownerAnalysisSourceAudioLocalPath = '',
      taskStore: taskStore = null,
      targetNodeId: targetNodeId = '',
    } = {},
  ) {
    if (!args19?.['id']) return null;
    const segmentLocalAudioUrl = resolveSegmentLocalAudioUrl(
      args19['sourceAudioUrl'],
      args19['sourceAudioLocalPath'],
    );
    if (segmentLocalAudioUrl && !args19['needsSourceAudioRecut']) return args19;
    if (!ownerAnalysisSourceAudioLocalPath) return args19;
    const response17 = await enqueueElectronMediaTask(
        {
          kind: 'audioCut',
          src: ownerAnalysisSourceAudioLocalPath,
          nodeId: ownerSourceNodeId,
          args: {
            start: Math['max'](0, Number(args19['startMs'] || 0) / 1000),
            end: Math['max'](0, Number(args19['endMs'] || 0) / 1000),
          },
        },
        { wait: true, timeout: AUDIO_CUT_TASK_TIMEOUT_MS },
      ),
      args20 = {
        sourceAudioLocalPath: normalizeLocalPath(response17?.['localPath'] || response17?.['path'] || ''),
        sourceAudioUrl: firstNonEmptyString(
          response17?.['url'],
          localPathToUrl(response17?.['localPath'] || response17?.['path']),
        ),
        sourceAudioReady: true,
        needsSourceAudioRecut: false,
      };
    return (taskStore?.['updateNodeData']?.(targetNodeId, args20), { ...args19, ...args20 });
  }
  function run119(value311) {
    const count18 = run21(value311);
    if (count18 < 0) return;
    const targetText = segments3[count18];
    updateCurrentSegment(value311, {
      targetText:
        targetText['targetText'] ||
        (targetText['sourceText'] || panelText('sentences.sourcePlaceholder')) +
          ' ' +
          panelText('sentences.convertedSuffix'),
      convertedAudioReady: false,
      convertedAudioDuration: 0,
      activeAudio: 'source',
      status: 'edited',
    });
  }
  async function buildResultPatch(
    value312,
    startedAt2,
    {
      segmentId: segmentId = '',
      modelOption: modelOption = {},
      modelId: modelId = '',
      startedAt: startedAt = 0,
      fallbackSegment: fallbackSegment = null,
    } = {},
  ) {
    startedAt2?.['updateTaskNode']?.({ rhStatusMessage: panelText('status.savingAudio') });
    const args21 = await buildAudioGenerationResultPatch(value312, {
      startedAt: startedAt2?.['startedAt'] || startedAt,
      persistAudioOutput: persistAudioOutput,
    });
    if (!args21?.['localPath'] && !args21?.['audioUrl']) throw new Error(panelText('toasts.generateFailed'));
    const list42 =
        Array['isArray'](args21['audios']) && args21['audios']['length'] ? args21['audios'] : [args21],
      createdAt = Date['now'](),
      value313 = list42['map']((value314, value315) =>
        buildAudioVoiceHistoryEntry(value314, {
          id: 'audio-voice-history-' + createdAt + '-' + value315,
          modelId: modelId,
          modelLabel: modelOption?.['label'] || modelId,
          createdAt: createdAt - value315,
        }),
      )['filter'](Boolean),
      targetText2 = startedAt2?.['getTaskNode']?.() || fallbackSegment || {};
    return {
      ...args21,
      taskModelId: modelId,
      targetText: targetText2['targetText'] || targetText2['sourceText'],
      convertedAudioLocalPath: normalizeLocalPath(args21['localPath'] || ''),
      convertedAudioUrl: firstNonEmptyString(
        args21['audioUrl'],
        args21['src'],
        localPathToUrl(args21['localPath']),
      ),
      convertedAudioDuration: pickAudioDurationSec(args21['audioDuration'], args21['duration']),
      convertedAudioReady: true,
      activeAudio: 'converted',
      status: 'ready',
      error: '',
      convertedAudioHistory: prependAudioVoiceHistoryEntries(targetText2['convertedAudioHistory'], value313),
    };
  }
  function run49(value316 = '') {
    const el121 = document['createElement']('template');
    el121['innerHTML'] = renderRequestDebugButton('data-audio-voice-action="debug-generation"');
    const el122 = el121['content']['firstElementChild'];
    return ((el122['dataset']['segmentId'] = value316), el122);
  }
  function run120(value317) {
    if (windowObject?.['DEV_MODE'] !== true) return;
    const enabled56 = value317 ? segments3[run21(value317)] : run45()[0];
    openDebugRequestWindow({
      windowObject: windowObject,
      title: '声音生成请求调试',
      prepare: () => {
        if (!enabled56) throw new Error('请先选择待生成的句子');
        const workflowLabel2 = run4(enabled56),
          value318 = workflowLabel2?.['id'] || defaultAudioVoiceModelId;
        return buildGenerationDebugPreview({
          payload: buildAudioVoiceGeneratePayload(cloneAudioVoiceSegment(enabled56), value318, {
            workflowLabel: workflowLabel2?.['label'] || value318,
            nodeId: sourceNodeId3,
          }),
          notes: '预览当前句子（批量入口预览第一句）。尚未提取的原声音频需先完成本地处理。',
        });
      },
    });
  }
  async function run116(segmentId6, runningHubWorkflowConcurrency = {}) {
    const sourceNodeId9 = String(runningHubWorkflowConcurrency['ownerSourceNodeId'] || sourceNodeId3 || '')[
        'trim'
      ](),
      count19 = run21(segmentId6);
    if (count19 < 0) return { status: 'skipped' };
    const response18 = cloneAudioVoiceSegment(segments3[count19]);
    if (response18['status'] === 'generating') return { status: 'skipped' };
    if (cancelInFlight['getRun'](sourceNodeId9, segmentId6)) return { status: 'skipped' };
    const value319 = runningHubWorkflowConcurrency['showResultToast'] !== false,
      value320 = runningHubWorkflowConcurrency['notifyCompletion'] !== false,
      workflowLabel3 = run4(response18),
      modelId2 = workflowLabel3?.['id'] || defaultAudioVoiceModelId,
      ownerAnalysisSourceAudioLocalPath2 = analysisSourceAudioLocalPath3,
      targetNodeId5 = run20(segmentId6, sourceNodeId9),
      abortController = new AbortController(),
      value321 = cancelInFlight['begin'](
        { sourceNodeId: sourceNodeId9, segmentId: segmentId6, targetNodeId: targetNodeId5 },
        { abortController: abortController },
      ),
      taskStore2 = value321['store'];
    taskStore2['updateNodeData'](targetNodeId5, {
      status: 'generating',
      error: '',
      rhStatusMessage: null,
      jobStatus: 'running',
      rhTaskStatus: 'pending',
      isGenerating: true,
    });
    try {
      const fallbackSegment2 = await run118(response18, {
        ownerSourceNodeId: sourceNodeId9,
        ownerAnalysisSourceAudioLocalPath: ownerAnalysisSourceAudioLocalPath2,
        taskStore: taskStore2,
        targetNodeId: targetNodeId5,
      });
      if (!fallbackSegment2)
        return (
          taskStore2['updateNodeData'](targetNodeId5, {
            status: 'edited',
            isGenerating: false,
            jobStatus: '',
            rhTaskStatus: '',
          }),
          { status: 'failed' }
        );
      if (value321['cancelRequested'] || !cancelInFlight['isCurrent'](value321))
        return { status: 'cancelled' };
      const installId2 = await resolveAudioVoiceGenerateInstallId(windowObject, modelId2);
      if (value321['cancelRequested'] || !cancelInFlight['isCurrent'](value321))
        return { status: 'cancelled' };
      const payload2 = buildAudioVoiceGeneratePayload(fallbackSegment2, modelId2, {
          workflowLabel: workflowLabel3?.['label'] || modelId2,
          nodeId: sourceNodeId9,
          installId: installId2,
        }),
        startedAt3 = Date['now'](),
        response19 = await submitTask(
          {
            sourceNodeId: sourceNodeId9,
            targetNodeId: targetNodeId5,
            trigger: 'audio-voice-panel',
            taskType: 'audio-generation',
            provider: workflowLabel3?.['provider'] || 'runninghubwf',
            adapterType: workflowLabel3?.['adapterType'] || 'workflow',
            modelId: modelId2,
            executionId: workflowLabel3?.['executionId'] || 'runninghub.audio.' + (modelId2 || 'workflow'),
            payload: payload2,
            cancellable: workflowLabel3?.['cancellable'] === true,
            resumable: true,
            completionFeedback: false,
            startBuilder: () => ({
              provider: payload2['provider'],
              audioWorkflowKey: payload2['audioWorkflowKey'],
              audioWorkflowLabel: payload2['audioWorkflowLabel'],
              model: payload2['audioWorkflowKey'],
              taskModelId: modelId2,
              rhInstanceType: payload2['rhInstanceType'],
              rhTaskUseOpenapiQuery: true,
              status: 'generating',
              error: '',
            }),
            submit: async (value322, signal) => {
              return generateAudio(payload2, {
                signal: signal['signal'] || abortController['signal'],
                runningHubWorkflowQueueLease: signal['runningHubWorkflowQueueLease'],
                onTaskId: (value323) => {
                  const enabled57 = String(value323 || '')['trim']();
                  if (!enabled57) return;
                  signal['onTaskId'](enabled57);
                },
                onTaskMeta: ({ taskId: taskId, useOpenapiQuery: useOpenapiQuery, apiKey: apiKey }) => {
                  const enabled58 = String(taskId || '')['trim']();
                  if (!enabled58) return;
                  if (apiKey) value321['apiKey'] = String(apiKey || '')['trim']();
                  (signal['onTaskId'](enabled58),
                    taskStore2['updateNodeData'](targetNodeId5, {
                      rhTaskUseOpenapiQuery: useOpenapiQuery === true,
                    }));
                },
              });
            },
            cancel: async ({ taskId: taskId2 }) => {
              const apiKey2 = String(value321['apiKey'] || payload2?.['apiKey'] || '')['trim']();
              if (!apiKey2 || !taskId2) return;
              await cancelRunningHubAudioTask({ apiKey: apiKey2, taskId: taskId2 });
            },
            resultBuilder: (value324, value325) =>
              buildResultPatch(value324, value325, {
                segmentId: segmentId6,
                modelOption: workflowLabel3,
                modelId: modelId2,
                startedAt: startedAt3,
                fallbackSegment: fallbackSegment2,
              }),
            failureBuilder: (value326) => ({
              status: 'edited',
              error: error3(value326, panelText('toasts.generateFailed')),
              rhStatusMessage: error3(value326, panelText('toasts.generateFailed')),
            }),
            cancelledBuilder: () => ({
              status: 'edited',
              error: '',
              rhStatusMessage: panelText('toasts.generationCancelled'),
            }),
            parseError: (value327) => error3(value327, panelText('toasts.generateFailed')),
          },
          {
            store: taskStore2,
            startedAt: startedAt3,
            abortController: abortController,
            runningHubWorkflowConcurrency: runningHubWorkflowConcurrency['runningHubWorkflowConcurrency'],
          },
        );
      if (response19['status'] === 'success')
        return (
          value319 && windowObject?.['showToast']?.(panelText('toasts.generateComplete'), 'success'),
          value320 &&
            (await notifyAudioVoiceGenerationComplete(
              { total: 1, succeeded: 1, incomplete: 0 },
              { playSound: playCompletion, showNotification: showCompletionNotification },
            )),
          { status: 'success' }
        );
      if (response19['status'] === 'cancelled')
        return (
          value319 && windowObject?.['showToast']?.(panelText('toasts.generationCancelled'), 'info'),
          { status: 'cancelled' }
        );
      throw response19['error'] || new Error(panelText('toasts.generateFailed'));
    } catch (error8) {
      if (value321['cancelRequested']) return { status: 'cancelled' };
      const error9 = error3(error8, panelText('toasts.generateFailed'));
      return (
        taskStore2['updateNodeData'](targetNodeId5, {
          status: 'edited',
          isGenerating: false,
          jobStatus: 'error',
          rhTaskStatus: 'failed',
          error: error9,
        }),
        value319 && !run18(error8) && windowObject?.['showToast']?.(error9, 'error'),
        { status: 'failed', error: error8 }
      );
    } finally {
      cancelInFlight['finish'](value321);
    }
  }
  async function run121(segmentId7) {
    const sourceNodeId10 = String(sourceNodeId3 || '')['trim'](),
      taskId3 = segments3[run21(segmentId7)];
    if (!taskId3) return;
    const targetNodeId6 = run20(segmentId7, sourceNodeId10),
      enabled59 = cancelInFlight['getRun'](sourceNodeId10, segmentId7),
      cancelInFlight2 =
        enabled59 ||
        cancelInFlight['begin']({
          sourceNodeId: sourceNodeId10,
          segmentId: segmentId7,
          targetNodeId: targetNodeId6,
        });
    if (
      !shouldAllowCancel(buildTaskNode(taskId3), {
        cancellable: cancellable(taskId3),
        cancelInFlight: cancelInFlight2['cancelInFlight'],
      })
    ) {
      if (!enabled59) cancelInFlight['finish'](cancelInFlight2);
      return;
    }
    cancelInFlight['setCancelInFlight'](cancelInFlight2, true);
    if (!run97(segmentId7, taskId3, taskId3)) render();
    try {
      (await cancelTask(targetNodeId6, {
        store: cancelInFlight2['store'],
        cancellable: true,
        taskId: taskId3['rhTaskId'],
        abortLocal: true,
        cancel: async ({ taskId: taskId4 }) => {
          const value328 = resolveModelOption(taskId3),
            providerConfig4 = getProviderConfig(value328?.['provider']) || {},
            apiKey3 = String(cancelInFlight2['apiKey'] || providerConfig4['apiKey'] || '')['trim']();
          if (!apiKey3 || !taskId4) return;
          await cancelRunningHubAudioTask({ apiKey: apiKey3, taskId: taskId4 });
        },
        cancelledBuilder: () => ({
          status: 'edited',
          error: '',
          rhStatusMessage: panelText('toasts.generationCancelled'),
        }),
      }),
        cancelInFlight2['abortController']?.['abort']?.(),
        windowObject?.['showToast']?.(panelText('toasts.generationCancelled'), 'info'));
    } finally {
      cancelInFlight['setCancelInFlight'](cancelInFlight2, false);
      if (!enabled59) cancelInFlight['finish'](cancelInFlight2);
      if (String(sourceNodeId3 || '')['trim']() === sourceNodeId10) {
        const value329 = segments3[run21(segmentId7)] || taskId3;
        if (!run97(segmentId7, value329, value329)) render();
      }
    }
  }
  async function run122() {
    if (runAudioVoiceBatchGenerationQueue2) {
      run3();
      return;
    }
    const list43 = run45();
    if (list43['length'] <= 0) {
      windowObject?.['showToast']?.(panelText('toasts.noGenerateTargets'), 'warn');
      return;
    }
    const ownerSourceNodeId2 = String(sourceNodeId3 || '')['trim'](),
      runningHubWorkflowConcurrency2 = run46(list43),
      shouldStop = createTaskBatchCancellationController();
    ((value84 = shouldStop),
      map8['clear'](),
      (runAudioVoiceBatchGenerationQueue2 = runAudioVoiceBatchGenerationQueue(
        list43,
        (value330) =>
          run116(value330['id'], {
            ownerSourceNodeId: ownerSourceNodeId2,
            runningHubWorkflowConcurrency: runningHubWorkflowConcurrency2,
            notifyCompletion: false,
            showResultToast: false,
          }),
        {
          concurrency: runningHubWorkflowConcurrency2,
          shouldStop: shouldStop['isRequested'],
          onTargetStart: ({ target: target2 }) => {
            map8['add'](String(target2?.['id'] || '')['trim']());
          },
          onTargetSettled: ({ target: target3 }) => {
            map8['delete'](String(target3?.['id'] || '')['trim']());
          },
        },
      )),
      run79());
    try {
      const value331 = await runAudioVoiceBatchGenerationQueue2,
        summarizeAudioVoiceGenerationResults2 = summarizeAudioVoiceGenerationResults(
          value331,
          list43['length'],
        ),
        audioVoiceGenerationCompletionMessage = buildAudioVoiceGenerationCompletionMessage(
          summarizeAudioVoiceGenerationResults2,
        );
      return (
        windowObject?.['showToast']?.(
          audioVoiceGenerationCompletionMessage,
          summarizeAudioVoiceGenerationResults2['incomplete'] > 0 ? 'warn' : 'success',
        ),
        await notifyAudioVoiceGenerationComplete(summarizeAudioVoiceGenerationResults2, {
          playSound: playCompletion,
          showNotification: showCompletionNotification,
        }),
        value331
      );
    } finally {
      ((runAudioVoiceBatchGenerationQueue2 = null), (value84 = null), map8['clear'](), run79());
    }
  }
  async function run123() {
    const enabled60 = value84;
    if (!runAudioVoiceBatchGenerationQueue2 || !enabled60?.['request']?.()) return false;
    run79();
    const list44 = [...map8]['filter'](Boolean);
    return (
      await Promise['allSettled'](list44['map']((value332) => run121(value332))),
      windowObject?.['showToast']?.(panelText('toasts.batchCancellationRequested'), 'info'),
      true
    );
  }
  function run124(value333) {
    const list45 = getVisibleAudioVoiceSegments(segments3),
      value334 = list45['findIndex']((value335) => value335['id'] === value333),
      enabled61 = list45[value334],
      value336 = list45[value334 + 1] || null;
    if (!enabled61) return;
    const audioVoiceSegmentAfter = createAudioVoiceSegmentAfter(enabled61, value336);
    run2('insert', [audioVoiceSegmentAfter['id']]);
    const list46 = [];
    (segments3['forEach']((value337) => {
      list46['push'](value337);
      if (value337['id'] === enabled61['id']) list46['push'](audioVoiceSegmentAfter);
    }),
      commitSegments(list46));
  }
  async function run125(triggerEl = null) {
    if (enabled2) return (run3(panelText('status.composing')), enabled2);
    const clips2 = buildAudioVoiceComposeTimelineClips(segments3);
    if (clips2['length'] < 1) {
      windowObject?.['showToast']?.(panelText('toasts.composeNeedsMoreAudio'), 'warn');
      return;
    }
    const src3 = resolveAudioVoiceSourceLocalPath(sourceNode3 || {});
    if (!sourceNode3 || !src3) {
      windowObject?.['showToast']?.(panelText('toasts.invalidSource'), 'warn');
      return;
    }
    const sourceNodeId11 = String(sourceNodeId3 || '')['trim'](),
      anchorNode = sourceNode3 ? { ...sourceNode3 } : null,
      segments5 = getVisibleAudioVoiceSegments(segments3)['map'](cloneAudioVoiceSegment),
      enabled62 = session['begin']({
        kind: 'compose-all',
        sourceNodeId: sourceNodeId11,
        segmentId: 'all',
        segmentIds: ['all'],
      });
    if (!enabled62) {
      run3(panelText('status.composing'));
      return;
    }
    const args22 = {
        sourceKind: isAudioVoiceAudioNode(anchorNode) ? 'audio' : 'video',
        src: src3,
        clips: clips2,
        durationSec: resolveAudioVoiceComposeDurationSec(anchorNode, segments5),
        anchorNode: anchorNode,
        triggerEl: triggerEl,
      },
      value338 = run48(clips2);
    map9 = new Set(clips2['map']((value339) => value339['id'])['filter'](Boolean));
    const value340 = Promise['resolve']()['then'](async () => {
      const enabled63 =
        composeTimeline === composeAudioVoiceTimelineNearNode
          ? await composeAudioVoiceTimelineNearNode({ ...args22 })
          : await composeTimeline(args22);
      if (!enabled63) return null;
      if (!session['isCurrent'](enabled62, sourceNodeId3)) return enabled63;
      return (
        (completedComposeKey2 = value338),
        run5(),
        onComposeResult?.(enabled63, {
          sourceNodeId: sourceNodeId11,
          sourceNode: anchorNode,
          segments: segments5,
        }),
        void Promise['resolve']()
          ['then'](() => playCompletion?.('audio-voice-compose'))
          ['catch']((value341) => {
            console['warn']('[audioVoicePanel] completion sound failed', value341);
          }),
        enabled63
      );
    });
    enabled2 = value340;
    const value342 = [...map9];
    run98(value342);
    try {
      return await value340;
    } catch (value343) {
      if (!session['isCurrent'](enabled62, sourceNodeId3)) return null;
      return (
        windowObject?.['showToast']?.(error3(value343, panelText('toasts.composeFailed')), 'error'),
        null
      );
    } finally {
      (session['finish'](enabled62),
        enabled2 === value340 && ((enabled2 = null), (map9 = new Set()), run98(value342)));
    }
  }
  async function run126(value344, returnFocus2 = null) {
    if (run6()) return (run3(panelText('status.translating')), null);
    const language2 = run37(value344),
      count20 = run38();
    if (!language2 || analysisStatus2 !== 'ready' || count20['targets']['length'] <= 0)
      return (windowObject?.['showToast']?.(panelText('toasts.noTranslationText'), 'warn'), null);
    closeInlineMenus();
    const enabled64 = await run9({
      language: language2,
      count: count20['targets']['length'],
      scope: count20['scope'],
      returnFocus: returnFocus2,
    });
    if (!enabled64) return null;
    const value345 = run38();
    if (value345['targets']['length'] <= 0)
      return (windowObject?.['showToast']?.(panelText('toasts.noTranslationText'), 'warn'), null);
    const id2 = ++value86,
      value346 = sourceNodeId3,
      segments6 = value345['targets']['map']((args23) => ({ ...args23 })),
      segmentIds = new Set(segments6['map']((value347) => value347['id']));
    ((value85 = { id: id2, languageId: language2['id'], segmentIds: segmentIds }), run99([...segmentIds]));
    try {
      if (!(await run17())) return null;
      const translateSegments2 = await translateSegments({
        languageId: language2['id'],
        segments: segments6,
      });
      if (value85?.['id'] !== id2) return null;
      const map15 = new Map(
          segments3['map']((value348) => [String(value348['id'] || '')['trim'](), value348]),
        ),
        value349 =
          sourceNodeId3 !== value346 ||
          segments6['some']((value350) => {
            const response20 = map15['get'](value350['id']);
            return (
              !response20 ||
              response20['status'] === 'removed' ||
              String(response20['sourceText'] || '')['trim']() !== value350['sourceText']
            );
          });
      if (value349)
        return (windowObject?.['showToast']?.(panelText('toasts.translationStale'), 'warn'), null);
      const value351 = new Map(
        segments3['filter']((value352) => segmentIds['has'](value352['id']))['map']((value353) => [
          value353['id'],
          value353,
        ]),
      );
      return (
        (segments3 = applyAudioVoiceTranslationResults(segments3, translateSegments2)),
        run5(),
        run100(value351, [...segmentIds]),
        windowObject?.['showToast']?.(
          panelText('toasts.translationComplete', {
            count: segmentIds['size'],
            language: language2['label'],
          }),
          'success',
        ),
        translateSegments2
      );
    } catch (value354) {
      if (value85?.['id'] !== id2) return null;
      const message = error3(value354, panelText('toasts.translationFailed')),
        classifyAudioVoiceTranslationConfigFailure2 = classifyAudioVoiceTranslationConfigFailure(value354);
      return (
        classifyAudioVoiceTranslationConfigFailure2
          ? run15(classifyAudioVoiceTranslationConfigFailure2, message)
          : windowObject?.['showToast']?.(
              panelText('toasts.translationFailedWithMessage', { message: message }),
              'error',
            ),
        null
      );
    } finally {
      value85?.['id'] === id2 && ((value85 = null), run99([...segmentIds]));
    }
  }
  async function run127({ runtimeRepairAttempted: runtimeRepairAttempted = false } = {}) {
    if (!sourceNode3) {
      windowObject?.['showToast']?.(panelText('toasts.selectSource'), 'warn');
      return;
    }
    const value355 = sourceNode3,
      sourceNodeId12 = String(sourceNodeId3 || '')['trim']();
    if (analysisSession['isActiveFor'](sourceNodeId12)) {
      run3(panelText('status.analyzing'));
      return;
    }
    const src4 = resolveAudioVoiceSourceLocalPath(value355);
    if (!src4) {
      windowObject?.['showToast']?.(panelText('toasts.invalidSource'), 'warn');
      return;
    }
    run8();
    const sourceKey = resolveAudioVoiceAnalysisMemoryKey(value355),
      operation = analysisSession['begin']({ sourceNodeId: sourceNodeId12, sourceKey: sourceKey }),
      canCommit = () =>
        analysisSession['isCurrent'](operation) && String(sourceNodeId3 || '')['trim']() === sourceNodeId12,
      value356 = sourceKey
        ? map7['get'](sourceKey) || resolveAudioVoicePersistedAnalysisSnapshot(value355)
        : null,
      isLocal = normalizeAudioVoiceAsrProvider(audioVoiceAsrProvider),
      value357 = analysisStatus2,
      value358 = audioVoiceInitialAnalysisProgress;
    ((analysisStatus2 = 'analyzing'),
      (audioVoiceInitialAnalysisProgress = createAudioVoiceInitialAnalysisProgress({
        isLocal: isLocal === AUDIO_VOICE_ASR_PROVIDER_IDS['FUNASR'],
        text: panelText,
      })),
      render());
    if (getAudioVoiceAsrProvider(isLocal)['configProviderId'] && !(await run13())) {
      if (!canCommit()) return;
      ((analysisStatus2 = value357),
        (audioVoiceInitialAnalysisProgress = value358),
        analysisSession['complete'](operation),
        render());
      return;
    }
    if (!canCommit()) return;
    (progressTracker['clear'](),
      (map5 = new Set()),
      (segments3 = []),
      (analysisSourceAudioLocalPath3 = ''),
      (analysisSourceAudioUrl2 = ''),
      render());
    try {
      let args24 = {};
      if (isLocal === AUDIO_VOICE_ASR_PROVIDER_IDS['FUNASR']) {
        args24 = await prepareAudioVoiceLocalAsr({
          nodeId: sourceNodeId12,
          onTaskStarted: (value359) => {
            void analysisSession['trackTask'](operation, value359);
            if (!canCommit()) return;
            progressTracker['install'](value359, { progressScale: AUDIO_VOICE_ASR_RUNTIME_PROGRESS_SHARE });
          },
        });
        if (!canCommit()) return;
      }
      const enqueueElectronMediaTask2 = await enqueueElectronMediaTask({
          kind: 'audioVoiceAnalyze',
          src: src4,
          nodeId: sourceNodeId12,
          args: {
            asrProvider: isLocal,
            ...args24,
            noiseDb: -35,
            minSilenceSec: 0.35,
            paddingMs: 80,
          },
        }),
        enabled65 = String(enqueueElectronMediaTask2?.['taskId'] || '')['trim']();
      if (!enabled65) throw new Error(panelText('toasts.analysisFailed'));
      if (!(await analysisSession['trackTask'](operation, enabled65)) || !canCommit()) return;
      progressTracker['install'](
        enabled65,
        isLocal === AUDIO_VOICE_ASR_PROVIDER_IDS['FUNASR']
          ? {
              progressOffset: AUDIO_VOICE_ASR_RUNTIME_PROGRESS_SHARE,
              progressScale: 1 - AUDIO_VOICE_ASR_RUNTIME_PROGRESS_SHARE,
            }
          : {},
      );
      const waitForElectronMediaTask2 = await waitForElectronMediaTask(enabled65, {
        timeout: ANALYZE_TASK_TIMEOUT_MS,
        diagnosticPayload: { kind: 'audioVoiceAnalyze', src: src4, nodeId: sourceNodeId12 },
      });
      if (!canCommit()) return;
      (assertAudioVoiceAsrResult(waitForElectronMediaTask2, isLocal),
        (analysisSourceAudioLocalPath3 = normalizeLocalPath(
          waitForElectronMediaTask2?.['sourceAudio']?.['localPath'] || '',
        )),
        (analysisSourceAudioUrl2 = firstNonEmptyString(
          waitForElectronMediaTask2?.['sourceAudio']?.['url'],
          localPathToUrl(analysisSourceAudioLocalPath3),
        )),
        (analysisStatus2 = 'ready'),
        (audioVoiceInitialAnalysisProgress = null),
        progressTracker['clear'](),
        commitSegments(normalizeAudioVoiceAnalyzeSegments(waitForElectronMediaTask2)),
        windowObject?.['showToast']?.(
          panelText('toasts.analysisComplete', { count: getVisibleAudioVoiceSegments(segments3)['length'] }),
          'success',
        ));
    } catch (error10) {
      if (!canCommit()) return;
      ((analysisStatus2 = 'error'), (audioVoiceInitialAnalysisProgress = null), progressTracker['clear']());
      value356
        ? ((segments3 = value356['segments']['map'](cloneAudioVoiceSegment)),
          (analysisSourceAudioLocalPath3 = normalizeLocalPath(
            value356['analysisSourceAudioLocalPath'] || '',
          )),
          (analysisSourceAudioUrl2 = firstNonEmptyString(
            value356['analysisSourceAudioUrl'],
            localPathToUrl(analysisSourceAudioLocalPath3),
          )))
        : (segments3 = []);
      render();
      const message2 = getAudioVoiceAnalyzeErrorMessage(error10, {
        getErrorMessage: error3,
        text: panelText,
        authErrorKeys: getAudioVoiceAsrProvider(isLocal)['authErrorKeys'],
      });
      if (getAudioVoiceAsrProvider(isLocal)['configProviderId'] && isVolcengineSpeechAsrAuthFailure(message2))
        run11('invalid', message2);
      else {
        if (isLocal === AUDIO_VOICE_ASR_PROVIDER_IDS['FUNASR']) {
          const recoverAudioVoiceLocalAsrRuntime2 = await recoverAudioVoiceLocalAsrRuntime({
            error: error10,
            repairAttempted: runtimeRepairAttempted,
            message: message2,
            nodeId: sourceNodeId12,
            canCommit: canCommit,
            confirmAction: confirmAction,
            text: panelText,
            analysisSession: analysisSession,
            operation: operation,
            progressTracker: progressTracker,
            windowObject: windowObject,
            setAnalysisState: (value360, value361) => {
              ((analysisStatus2 = value360), (audioVoiceInitialAnalysisProgress = value361), render());
            },
          });
          recoverAudioVoiceLocalAsrRuntime2 &&
            (analysisSession['complete'](operation), await run127({ runtimeRepairAttempted: true }));
        } else windowObject?.['showToast']?.(message2, 'error');
      }
    } finally {
      analysisSession['complete'](operation);
    }
  }
  async function run128(returnFocus3) {
    const args25 =
      typeof resolveStartAnalyzeConfirmation === 'function'
        ? await resolveStartAnalyzeConfirmation({ sourceNodeId: sourceNodeId3, sourceNode: sourceNode3 })
        : null;
    if (args25) {
      const enabled66 = await confirmAction({
        className: 'audio-voice-start-analyze-confirm',
        ...args25,
        returnFocus: returnFocus3,
      });
      if (!enabled66) return;
    }
    await run127();
  }
  function onAction2(value362, value363, el123, value364 = {}) {
    if (
      audioVoiceSegmentMergeController['hasPending']() &&
      (audioVoiceSegmentMergeController['isReserved'](value363) ||
        audioVoiceSegmentMergeController['blocksGlobalAction'](value362))
    ) {
      (run3(panelText('status.merging')), closeInlineMenus());
      return;
    }
    if (run6() && AUDIO_VOICE_TRANSLATION_BLOCKED_ACTIONS['has'](value362)) {
      (run3(panelText('status.translating')), closeInlineMenus());
      return;
    }
    if (value362 === 'show-asr-api-key-guide') {
      Promise['resolve'](getAudioVoiceAsrProvider(audioVoiceAsrProvider)['openGuide']?.())['catch'](
        (value365) => windowObject?.['showToast']?.(error3(value365), 'error'),
      );
      return;
    }
    if (value362 === 'open-asr-api-key-settings') {
      getAudioVoiceAsrProvider(audioVoiceAsrProvider)['openSettings']?.();
      return;
    }
    if (value362 === 'close-asr-config-alert') {
      run12();
      return;
    }
    if (value362 === 'show-translation-api-key-guide') {
      showProviderApiKeyGuide(AUDIO_VOICE_TRANSLATION_PROVIDER_ID);
      return;
    }
    if (value362 === 'open-translation-api-key-settings') {
      openProviderApiKeySettings(AUDIO_VOICE_TRANSLATION_PROVIDER_ID);
      return;
    }
    if (value362 === 'close-translation-config-alert') {
      run16();
      return;
    }
    if (value362 === 'load-selected') {
      canSelectAudioReference['startSourcePick']();
      return;
    }
    if (value362 === 'start-analyze') {
      void run128(el123);
      return;
    }
    if (value362 === 'toggle-menu') {
      const el124 = el123['closest']?.('.audio-voice-more-wrap'),
        enabled67 = el124?.['classList']?.['contains']?.('is-open');
      (closeInlineMenus(), el124?.['classList']?.['toggle']?.('is-open', !enabled67));
      return;
    }
    if (value362 === 'toggle-asr-settings') {
      const el125 = el123['closest']?.('.audio-voice-asr-settings'),
        enabled68 = el125?.['classList']?.['contains']?.('is-open');
      (closeInlineMenus(), el125?.['classList']?.['toggle']?.('is-open', !enabled68));
      return;
    }
    if (value362 === 'toggle-translation') {
      const el126 = el123['closest']?.('.audio-voice-translation-settings'),
        enabled69 = el126?.['classList']?.['contains']?.('is-open');
      (closeInlineMenus(),
        el126?.['classList']?.['toggle']?.('is-open', !enabled69),
        el123['setAttribute']('aria-expanded', enabled69 ? 'false' : 'true'));
      return;
    }
    if (value362 === 'translate-language') {
      void run126(el123['dataset']['languageId'], el123);
      return;
    }
    if (value362 === 'select-asr-provider') {
      audioVoiceAsrProvider = normalizeAudioVoiceAsrProvider(el123['dataset']['providerId']);
      const value366 = !!alert2;
      ((alert2 = null), closeInlineMenus(), syncSourceUi());
      if (value366) render();
      return;
    }
    if (value362 === 'toggle-global-settings') {
      const el127 = el123['closest']?.('.audio-voice-global-settings'),
        enabled70 = el127?.['classList']?.['contains']?.('is-open');
      (closeInlineMenus(), el127?.['classList']?.['toggle']?.('is-open', !enabled70));
      return;
    }
    if (value362 === 'select-global-model') {
      const value367 = String(el123['dataset']['modelId'] || '')['trim']();
      if (value367) defaultAudioVoiceModelId = value367;
      (closeInlineMenus(), run79(), run81());
      return;
    }
    if (value362 === 'select-segment-model') {
      const voiceModelId = String(el123['dataset']['modelId'] || '')['trim']();
      (run101(value363, {
        voiceModelId: voiceModelId,
        voiceModelSelectionMode: voiceModelId ? 'segment' : 'global',
      }),
        closeInlineMenus());
      return;
    }
    if (value362 === 'select-all') {
      ((map5 = run42()
        ? new Set()
        : new Set(getVisibleAudioVoiceSegments(segments3)['map']((value368) => value368['id']))),
        run80());
      return;
    }
    if (value362 === 'voice') {
      canSelectAudioReference['startAudioPick'](AUDIO_VOICE_BATCH_AUDIO_PICK_ID);
      return;
    }
    if (value362 === 'toggle-select') {
      run104(value363);
      return;
    }
    if (value362 === 'toggle-history') {
      const el128 = el123['closest']?.('.audio-voice-history-wrap'),
        enabled71 = el128?.['classList']?.['contains']?.('is-open');
      (closeInlineMenus(), el128?.['classList']?.['toggle']?.('is-open', !enabled71));
      return;
    }
    if (value362 === 'use-history') {
      const convertedAudioLocalPath = run57(value363, el123['dataset']['historyId']);
      if (!convertedAudioLocalPath) return;
      (run101(value363, {
        convertedAudioLocalPath: convertedAudioLocalPath['localPath'],
        convertedAudioUrl: convertedAudioLocalPath['audioUrl'],
        convertedAudioDuration: pickAudioDurationSec(
          convertedAudioLocalPath['audioDuration'],
          convertedAudioLocalPath['duration'],
        ),
        convertedAudioReady: true,
        activeAudio: 'converted',
        status: 'ready',
        error: '',
      }),
        closeInlineMenus());
      return;
    }
    if (value362 === 'play-history') {
      const value369 = run57(value363, el123['dataset']['historyId']);
      if (value369) void run114(value369['audioUrl']);
      return;
    }
    if (value362 === 'merge') {
      void audioVoiceSegmentMergeController['merge'](value363);
      return;
    }
    if (value362 === 'insert') {
      run124(value363);
      return;
    }
    if (value362 === 'play-source') {
      run115(value363, 'source');
      return;
    }
    if (value362 === 'debug-generation') {
      run120(value363);
      return;
    }
    if (value362 === 'generate') {
      const value370 = segments3[run21(value363)];
      value370 &&
      shouldAllowCancel(buildTaskNode(value370), {
        cancellable: cancellable(value370),
        cancelInFlight: cancelInFlight['isCancelInFlight'](sourceNodeId3, value363),
      })
        ? void run121(value363)
        : void run116(value363);
      return;
    }
    if (value362 === 'play-converted') {
      run115(value363, 'converted');
      return;
    }
    if (value362 === 'batch-generate') {
      void run122();
      return;
    }
    if (value362 === 'cancel-batch-generation') {
      void run123();
      return;
    }
    if (value362 === 'compose-all') {
      void run125(el123);
      return;
    }
    if (value362 === 'use-converted') {
      (run101(value363, { activeAudio: 'converted' }), closeInlineMenus());
      return;
    }
    if (value362 === 'use-source') {
      (run101(value363, { activeAudio: 'source' }), closeInlineMenus());
      return;
    }
    if (value362 === 'download-source') {
      (run117(value363, 'source', 'download'), closeInlineMenus());
      return;
    }
    if (value362 === 'download-converted') {
      (run117(value363, 'converted', 'download'), closeInlineMenus());
      return;
    }
    if (value362 === 'add-source-to-canvas') {
      (run117(value363, 'source', 'add-to-canvas'), closeInlineMenus());
      return;
    }
    if (value362 === 'add-converted-to-canvas') {
      (run117(value363, 'converted', 'add-to-canvas'), closeInlineMenus());
      return;
    }
    if (value362 === 'edit-source') {
      run113(value363);
      return;
    }
    if (value362 === 'audio-param') {
      canSelectAudioReference['startAudioPick'](value363);
      return;
    }
    if (value362 === 'clear-audio-param') {
      const audioVoiceSelectionTargetIds = resolveAudioVoiceSelectionTargetIds(
          value363,
          map5,
          getVisibleAudioVoiceSegments(segments3),
        ),
        map16 = new Set(audioVoiceSelectionTargetIds);
      if (map16['size'] <= 0) return;
      ((segments3 = segments3['map']((args26) =>
        map16['has'](args26['id'])
          ? {
              ...args26,
              voiceRefNodeId: '',
              voiceRefAudioLocalPath: '',
              voiceRefAudioUrl: '',
              voiceRefName: '',
              voiceRefImageUrl: '',
              imitateToneEnabled: false,
              error: '',
            }
          : args26,
      )),
        run5(),
        render());
      return;
    }
    if (value362 === 'toggle-imitate-tone') {
      const enabled72 = segments3[run21(value363)];
      if (!enabled72) return;
      run103(value363, enabled72['imitateToneEnabled'] !== true);
      return;
    }
    if (value362 === 'remove') {
      const list47 = getVisibleAudioVoiceSegments(segments3),
        value371 = list47['findIndex']((value372) => value372['id'] === value363),
        value373 = list47[value371 + 1] || list47[value371 - 1] || null;
      (run2('remove-shift', value373 ? [value373['id']] : []),
        commitSegments(segments3['filter']((value374) => value374['id'] !== value363)));
      return;
    }
    (run3(), closeInlineMenus());
  }
  const audioVoiceSegmentContextMenuController = createAudioVoiceSegmentContextMenuController({
      panel: panel,
      getSegment: (value375) => segments3[run21(value375)],
      buildItems: getAudioVoiceSegmentContextMenuItems,
      onAction: onAction2,
      closeInlineMenus: closeInlineMenus,
    }),
    value376 = (event9) => {
      (event9['stopPropagation'](), toggle());
    };
  (fabBtnEl['addEventListener']('click', value376),
    el4['addEventListener']('click', close),
    el['addEventListener']('pointerdown', run87),
    el['addEventListener']('keydown', (event10) => {
      if (event10['key'] !== 'ArrowLeft' && event10['key'] !== 'ArrowRight') return;
      event10['preventDefault']?.();
      const value377 = panel['getBoundingClientRect']?.()['width'] || panel['offsetWidth'] || 0,
        value378 = event10['key'] === 'ArrowLeft' ? 24 : -24;
      run86(value377 + value378, { persist: true });
    }),
    panel['addEventListener']('pointerdown', (event11) => {
      event11['stopPropagation']();
    }),
    panel['addEventListener']('input', (event12) => {
      const el129 = event12['target']?.['closest']?.('[data-audio-voice-text-input]');
      if (!el129) return;
      const value379 = el129['dataset']['segmentId'] || '';
      if (run69(value379)) {
        const value380 = segments3[run21(value379)];
        el129['value'] =
          el129['dataset']['audioVoiceTextKind'] === 'converted'
            ? String(value380?.['targetText'] || value380?.['sourceText'] || '')
            : String(value380?.['sourceText'] || '');
        return;
      }
      run110(value379, el129['value'], el129['dataset']['audioVoiceTextKind']);
    }),
    panel['addEventListener']('focusout', (event13) => {
      const el130 = event13['target']?.['closest']?.('[data-audio-voice-text-input]');
      if (!el130 || el130['dataset']['audioVoiceTextKind'] !== 'converted') return;
      const value381 = String(el130['dataset']['segmentId'] || '')['trim']();
      windowObject?.['setTimeout']?.(() => {
        const el131 = document?.['activeElement']?.['closest']?.('[data-audio-voice-text-input]');
        if (el131?.['dataset']['segmentId'] === value381) return;
        run107(value381);
      }, 0);
    }),
    panel['addEventListener']('click', (event14) => {
      const el132 = event14['target']?.['closest']?.('[data-audio-voice-action]');
      if (!el132) {
        const el133 = event14['target']?.['closest']?.('.audio-voice-segment-card'),
          enabled73 = event14['target']?.['closest']?.(
            'button, input, textarea, select, .audio-voice-more-menu, .audio-voice-history-menu, .audio-voice-global-settings-menu, .audio-voice-asr-settings-menu, .audio-voice-translation-menu',
          );
        if (el133 && !enabled73) {
          event14['stopPropagation']?.();
          if (audioVoiceSegmentMergeController['isReserved'](el133['dataset']['segmentId'] || '')) {
            run3(panelText('status.merging'));
            return;
          }
          run104(el133['dataset']['segmentId'] || '');
          return;
        }
        !event14['target']?.['closest']?.(
          '.audio-voice-more-menu, .audio-voice-history-menu, .audio-voice-global-settings-menu, .audio-voice-asr-settings-menu, .audio-voice-translation-menu',
        ) && closeInlineMenus();
        return;
      }
      if (el132['disabled']) return;
      (event14['stopPropagation']?.(),
        onAction2(el132['dataset']['audioVoiceAction'], el132['dataset']['segmentId'] || '', el132, event14));
    }),
    panel['addEventListener']('keydown', (event15) => {
      const value382 = event15['target']?.['closest']?.('[data-audio-voice-text-input]');
      if (value382 && run109(event15, value382)) return;
      if (event15['key'] !== 'Enter' && event15['key'] !== ' ') return;
      const el134 = event15['target']?.['closest']?.('[data-audio-voice-action="toggle-select"]');
      if (!el134) return;
      (event15['preventDefault']?.(), onAction2('toggle-select', el134['dataset']['segmentId'] || '', el134));
    }));
  const value383 = (value384) => {
    open(value384?.['detail'] || {});
  };
  return (
    !embedded && windowObject?.['addEventListener']?.(AUDIO_VOICE_PANEL_OPEN_EVENT, value383),
    render(),
    {
      panel: panel,
      open: open,
      close: close,
      toggle: toggle,
      setWidth: (value385) => run86(value385, { persist: true }),
      getSourceNodeId: () => sourceNodeId3,
      getSegments: () => getVisibleAudioVoiceSegments(segments3)['map'](cloneAudioVoiceSegment),
      canSelectAudioReference: canSelectAudioReference['canSelectAudioReference'],
      selectAudioReference: canSelectAudioReference['selectAudioReference'],
      destroy() {
        (audioVoiceSegmentContextMenuController['destroy'](),
          close(),
          map10['destroy'](),
          canSelectAudioReference['destroy'](),
          fabBtnEl['removeEventListener']?.('click', value376),
          windowObject?.['removeEventListener']?.(AUDIO_VOICE_PANEL_OPEN_EVENT, value383),
          panel['remove']?.(),
          noticeElement['remove']?.());
      },
    }
  );
}
