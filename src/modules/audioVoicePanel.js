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
  AUDIO_VOICE_ANALYSIS_SCHEMA_VERSION = 0x1,
  AUDIO_VOICE_WARM_SEGMENT_LIMIT = 0x4,
  AUDIO_VOICE_PANEL_WIDTH_LIMITS = Object['freeze']({ min: 0x230, max: 0x35c }),
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
  ANALYZE_TASK_TIMEOUT_MS = 0x2d * 0x3c * 0x3e8,
  AUDIO_VOICE_ASR_RUNTIME_PROGRESS_SHARE = 0.35,
  AUDIO_CUT_TASK_TIMEOUT_MS = 0x2 * 0x3c * 0x3e8,
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
function panelText(_0x56e571, _0x5435ac = {}) {
  return t('audioVoicePanel.' + _0x56e571, _0x5435ac);
}
function getAudioVoiceSegmentMenuEntries(_0x192365 = {}) {
  return buildAudioVoiceSegmentMenuEntries({
    hasConverted: hasSegmentConvertedAudio(_0x192365),
    hasSource: hasSegmentSourceAudio(_0x192365),
    usingConverted: isSegmentUsingConvertedAudio(_0x192365),
    text: panelText,
  });
}
function getAudioVoiceSegmentContextMenuItems(_0x5b1245, _0x5b44ce) {
  const _0x546bbf =
    _0x5b1245['voiceModelSelectionMode'] === 'global'
      ? ''
      : String(_0x5b1245['voiceModelId'] || '')['trim']();
  return buildAudioVoiceSegmentContextMenuItems({
    entries: getAudioVoiceSegmentMenuEntries(_0x5b1245),
    modelOptions: getAudioVoicePanelModelOptions(),
    selectedModelId: _0x546bbf,
    imitateToneAvailable: isSegmentImitateToneAvailable(_0x5b1245),
    imitateToneEnabled: _0x5b1245['imitateToneEnabled'] === !![],
    text: panelText,
    onAction: _0x5b44ce,
  });
}
export function isVolcengineSpeechAsrAuthFailure(_0x56556a = '') {
  const _0x4e8732 = String(_0x56556a?.['message'] || _0x56556a || '')['trim']();
  return VOLCENGINE_SPEECH_ASR_AUTH_PATTERN['test'](_0x4e8732);
}
export function shouldShowVolcengineSpeechApiKeyHelp(_0xb4120c = {}, _0x32fece = '') {
  const _0x3f28e2 = String(_0xb4120c?.['category'] || '')['trim']();
  if (_0x3f28e2 === 'missing_key' || _0x3f28e2 === 'auth_failed' || _0x3f28e2 === 'bad_base_url') return !![];
  return isVolcengineSpeechAsrAuthFailure(
    [
      _0x32fece,
      _0xb4120c?.['summary'],
      _0xb4120c?.['suggestion'],
      _0xb4120c?.['detail'],
      _0xb4120c?.['error'],
    ]
      ['filter'](Boolean)
      ['join']('\x20'),
  );
}
function clampProgress01(_0x3bb6f1) {
  const _0x247bae = Number(_0x3bb6f1);
  if (!Number['isFinite'](_0x247bae)) return 0x0;
  return Math['max'](0x0, Math['min'](0x1, _0x247bae));
}
function normalizeAnalysisProgressStage(_0x2fd310) {
  const _0x274ac6 = String(_0x2fd310 || '')['trim']();
  return AUDIO_VOICE_ANALYSIS_STAGES['has'](_0x274ac6) ? _0x274ac6 : 'model-prepare';
}
function getStateSnapshot(_0x267a32) {
  return _0x267a32?.['getStateRaw']?.() || _0x267a32?.['getState']?.() || {};
}
function clampAudioVoicePanelWidth(_0x551ef6, _0xfbd6bc = globalThis['window']?.['innerWidth']) {
  const _0x360329 = Number(_0x551ef6),
    _0x57b2b3 = Number['isFinite'](Number(_0xfbd6bc))
      ? Math['max'](0x140, Number(_0xfbd6bc) - 0x18)
      : AUDIO_VOICE_PANEL_WIDTH_LIMITS['max'],
    _0x32c531 = Math['min'](AUDIO_VOICE_PANEL_WIDTH_LIMITS['max'], _0x57b2b3),
    _0x1f0020 = Math['min'](AUDIO_VOICE_PANEL_WIDTH_LIMITS['min'], _0x32c531);
  return Math['max'](_0x1f0020, Math['min'](_0x32c531, _0x360329));
}
function readStoredPanelWidth(_0xc2d04b = globalThis['window']) {
  const _0x15d72f = Number(_0xc2d04b?.['localStorage']?.['getItem']?.(AUDIO_VOICE_PANEL_WIDTH_STORAGE_KEY));
  return Number['isFinite'](_0x15d72f) && _0x15d72f > 0x0 ? _0x15d72f : null;
}
function writeStoredPanelWidth(_0x56a42c, _0x2f0b31 = globalThis['window']) {
  try {
    _0x2f0b31?.['localStorage']?.['setItem']?.(
      AUDIO_VOICE_PANEL_WIDTH_STORAGE_KEY,
      String(Math['round'](_0x56a42c)),
    );
  } catch {}
}
function dispatchWebPreviewPanelSync(_0x8f6be7) {
  const _0x2830bc = globalThis['window'];
  if (!_0x2830bc || typeof _0x2830bc['dispatchEvent'] !== 'function') return;
  const _0x59940b = { reason: _0x8f6be7 },
    _0x14302c =
      typeof globalThis['CustomEvent'] === 'function'
        ? new globalThis['CustomEvent']('web-preview:force-sync', { detail: _0x59940b })
        : { type: 'web-preview:force-sync', detail: _0x59940b };
  _0x2830bc['dispatchEvent'](_0x14302c);
}
function formatTimecode(_0x509394) {
  const _0x56f646 = Math['max'](0x0, Math['round'](Number(_0x509394) || 0x0)),
    _0x198f07 = Math['floor'](_0x56f646 / 0xea60),
    _0x47282f = Math['floor']((_0x56f646 % 0xea60) / 0x3e8),
    _0x2e9768 = _0x56f646 % 0x3e8;
  return (
    String(_0x198f07)['padStart'](0x2, '0') +
    ':' +
    String(_0x47282f)['padStart'](0x2, '0') +
    ':' +
    String(_0x2e9768)['padStart'](0x3, '0')
  );
}
export function formatAudioVoiceTimeRange(_0x3bc5b3, _0xe08267) {
  const _0x360f2a = Math['max'](0x0, Math['round'](Number(_0x3bc5b3) || 0x0)),
    _0x9a0713 = Math['max'](_0x360f2a, Math['round'](Number(_0xe08267) || 0x0)),
    _0x546bdf = ((_0x9a0713 - _0x360f2a) / 0x3e8)['toFixed'](0x1);
  return formatTimecode(_0x360f2a) + '\x20-\x20' + formatTimecode(_0x9a0713) + ' （约 ' + _0x546bdf + ' 秒）';
}
export function resolveAudioVoicePanelCoverUrl(_0x23e1e9 = {}) {
  return resolveCanvasVideoPosterUrl(_0x23e1e9);
}
export function createDefaultAudioVoiceSegments() {
  return [
    {
      id: 'mock-segment-1',
      startMs: 0x50,
      endMs: 0x10ae,
      sourceText: '马某人这个县长买来的，嗯，买官就是为了挣钱。',
      targetText: '',
      sourceAudioReady: !![],
      convertedAudioReady: ![],
      activeAudio: 'source',
      imitateToneEnabled: ![],
      status: 'detected',
    },
    {
      id: 'mock-segment-2',
      startMs: 0x1525,
      endMs: 0x2794,
      sourceText: '今天参加会议的人里面，就有一个人是怪物伪装的。',
      targetText: '',
      sourceAudioReady: !![],
      convertedAudioReady: ![],
      activeAudio: 'source',
      imitateToneEnabled: ![],
      status: 'detected',
    },
    {
      id: 'mock-segment-3',
      startMs: 0x2760,
      endMs: 0x2e49,
      sourceText: '谁有钱就挣谁的。',
      targetText: '',
      sourceAudioReady: !![],
      convertedAudioReady: ![],
      activeAudio: 'source',
      imitateToneEnabled: ![],
      status: 'detected',
    },
    {
      id: 'mock-segment-4',
      startMs: 0x2f1c,
      endMs: 0x3c14,
      sourceText: '那你想挣谁的钱呢？',
      targetText: '',
      sourceAudioReady: !![],
      convertedAudioReady: ![],
      activeAudio: 'source',
      imitateToneEnabled: ![],
      status: 'detected',
    },
  ]['map']((_0xb204eb) => ({ ..._0xb204eb }));
}
function isAudioVoicePanelWorkflowItem(_0x1fc5b0 = {}) {
  const _0x100475 = String(_0x1fc5b0?.['group'] || '')['trim'](),
    _0x290435 = String(_0x1fc5b0?.['provider'] || '')['trim'](),
    _0x57eac5 = String(_0x1fc5b0?.['adapterType'] || '')['trim']();
  return (
    AUDIO_VOICE_PANEL_MODEL_MENU_GROUPS['has'](_0x100475) &&
    _0x290435 === 'runninghubwf' &&
    _0x57eac5 === 'workflow'
  );
}
function getAudioVoicePanelWorkflowItems() {
  return buildAudioWorkflowItems()['filter'](isAudioVoicePanelWorkflowItem);
}
function toAudioVoicePanelModelOption(_0x307cc9 = {}) {
  const _0x12a60b = String(_0x307cc9['id'] || _0x307cc9['key'] || _0x307cc9['modelId'] || '')['trim']();
  return {
    id: _0x12a60b,
    label: translateManifestText(_0x307cc9['label']),
    subtitle: translateManifestText(_0x307cc9['subtitle'] || ''),
    icon: _0x307cc9['icon'] || 'images/RH.png',
    iconAlt: _0x307cc9['iconAlt'] || 'runninghub',
    provider: _0x307cc9['provider'] || '',
    adapterType: _0x307cc9['adapterType'] || '',
    executionId: _0x307cc9['executionId'] || '',
    async: _0x307cc9['async'] === !![],
    cancellable: _0x307cc9['cancellable'] === !![],
    vip: _0x307cc9['vip'] === !![],
  };
}
export function getAudioVoicePanelModelOptions() {
  return getAudioVoicePanelWorkflowItems()['map'](toAudioVoicePanelModelOption);
}
export function getAudioVoicePanelModelGroups() {
  const _0x592870 = getAudioVoicePanelWorkflowItems(),
    _0x25a229 = new Map(
      _0x592870['map'](toAudioVoicePanelModelOption)
        ['filter']((_0x1afa84) => _0x1afa84['id'])
        ['map']((_0x4d36dc) => [_0x4d36dc['id'], _0x4d36dc]),
    );
  return buildAudioWorkflowMenuGroups(_0x592870)
    ['map']((_0x43ce82) => ({
      id: String(_0x43ce82['id'] || '')['trim'](),
      label: translateManifestText(_0x43ce82['label'] || _0x43ce82['id'] || ''),
      subtitle: translateManifestText(_0x43ce82['subtitle'] || ''),
      icon: _0x43ce82['icon'] || 'images/RH.png',
      iconAlt: _0x43ce82['iconAlt'] || _0x43ce82['id'] || 'runninghub',
      items: (Array['isArray'](_0x43ce82['items']) ? _0x43ce82['items'] : [])
        ['map']((_0x1a1e17) => _0x25a229['get'](String(_0x1a1e17?.['modelId'] || '')['trim']()))
        ['filter'](Boolean),
    }))
    ['filter']((_0x23c0e7) => _0x23c0e7['items']['length'] > 0x0);
}
export function getAudioVoiceWorkflowAudioSlots(_0x3e33cd = '') {
  return getAudioWorkflowSlots(_0x3e33cd)['map']((_0x5d2773) => ({
    ..._0x5d2773,
    label: translateManifestText(_0x5d2773['label'] || _0x5d2773['slot'] || ''),
  }));
}
export function doesAudioVoiceWorkflowSupportToneClone(_0x11c295 = '') {
  return doesAudioWorkflowSupportMultipleAudioInputs(_0x11c295);
}
export function normalizeAudioVoicePanelWidth(_0x562092, _0x45f180) {
  return clampAudioVoicePanelWidth(_0x562092, _0x45f180);
}
export function resolveAudioVoiceSourceLocalPath(_0x1cbde6 = {}) {
  return isAudioVoiceAudioNode(_0x1cbde6)
    ? resolveCanvasAudioLocalPath(_0x1cbde6)
    : resolveCanvasVideoLocalPath(_0x1cbde6);
}
export function resolveAudioVoiceSourceUrl(_0x38e307 = {}) {
  return isAudioVoiceAudioNode(_0x38e307)
    ? resolveCanvasAudioUrl(_0x38e307)
    : localPathToUrl(resolveCanvasVideoLocalPath(_0x38e307));
}
function normalizeAudioVoicePromptForBackend(_0x23e84e, _0xb918b4) {
  const _0x2739c5 = String(_0xb918b4 || '')['trim']();
  if (_0x23e84e !== RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID) return _0x2739c5;
  return _0x2739c5['replace'](/(^|\s+)@?音频1\s*[:：]?\s*/g, '$1[speaker_1]: ')
    ['replace'](/(^|\s+)@?音频2\s*[:：]?\s*/g, '$1[speaker_2]:\x20')
    ['replace'](/\s+(\[speaker_[12]\]:)/g, '\x0a$1')
    ['trim']();
}
export function resolveAudioVoiceSegmentAudioInput(_0x4f9e41 = {}, _0x395325 = 0x1) {
  const _0x2665f1 = Number(_0x395325) === 0x2 ? 0x2 : 0x1;
  if (_0x2665f1 === 0x2)
    return {
      nodeId: String(_0x4f9e41['voiceRefNodeId'] || ''),
      localPath: normalizeLocalPath(_0x4f9e41['voiceRefAudioLocalPath'] || ''),
      audioUrl: resolveSegmentLocalAudioUrl(
        _0x4f9e41['voiceRefAudioUrl'],
        _0x4f9e41['voiceRefAudioLocalPath'],
      ),
      name: String(_0x4f9e41['voiceRefName'] || ''),
      imageUrl: String(_0x4f9e41['voiceRefImageUrl'] || ''),
    };
  return {
    nodeId: String(_0x4f9e41['id'] || ''),
    localPath: normalizeLocalPath(_0x4f9e41['sourceAudioLocalPath'] || ''),
    audioUrl: resolveSegmentLocalAudioUrl(_0x4f9e41['sourceAudioUrl'], _0x4f9e41['sourceAudioLocalPath']),
    name: String(_0x4f9e41['sourceAudioName'] || ''),
  };
}
function createAudioVoiceWorkflowAudioRef(_0x40c08b = {}, _0x246e6c = '') {
  const _0x330a7b = _0x40c08b?.['audioUrl'];
  if (!_0x330a7b) return null;
  return { refSlot: _0x246e6c, url: _0x330a7b, sourceId: _0x40c08b['nodeId'], sourceType: 'source-audio' };
}
function isAudioVoiceImitateToneWorkflow(_0x385234 = '') {
  return AUDIO_VOICE_IMITATE_TONE_WORKFLOW_IDS['has'](String(_0x385234 || '')['trim']());
}
function getAudioVoicePrimaryAudioSlot(_0x4446e2 = '') {
  return _0x4446e2 === RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID ? 'audio1' : 'audioRef';
}
function buildAudioVoiceWorkflowAudioRefs(_0x2781d3 = {}, _0xd581cc = '', _0x1efc76 = []) {
  const _0x533ca6 = resolveAudioVoiceSegmentAudioInput(_0x2781d3, 0x1),
    _0x5c1f84 = resolveAudioVoiceSegmentAudioInput(_0x2781d3, 0x2);
  if (isAudioVoiceImitateToneWorkflow(_0xd581cc)) {
    const _0x1b2802 = getAudioVoicePrimaryAudioSlot(_0xd581cc),
      _0x1a95d9 = [];
    if (_0x5c1f84['audioUrl']) {
      _0x1a95d9['push'](createAudioVoiceWorkflowAudioRef(_0x5c1f84, _0x1b2802));
      if (_0x2781d3['imitateToneEnabled'] === !![]) {
        if (!_0x533ca6['audioUrl']) throw createAudioVoicePayloadError('missingSourceAudio');
        _0x1a95d9['push'](createAudioVoiceWorkflowAudioRef(_0x533ca6, 'audio2'));
      }
    } else _0x1a95d9['push'](createAudioVoiceWorkflowAudioRef(_0x533ca6, _0x1b2802));
    return normalizeAudioWorkflowRefSlots(_0x1a95d9['filter'](Boolean), _0xd581cc);
  }
  if (_0xd581cc === RH_AUDIO_VOICE_CONVERT_MODEL_ID)
    return normalizeAudioWorkflowRefSlots(
      [
        createAudioVoiceWorkflowAudioRef(_0x5c1f84, _0x1efc76[0x0]?.['slot'] || ''),
        createAudioVoiceWorkflowAudioRef(_0x533ca6, _0x1efc76[0x1]?.['slot'] || ''),
      ]['filter'](Boolean),
      _0xd581cc,
    );
  return normalizeAudioWorkflowRefSlots(
    [_0x533ca6, _0x5c1f84]
      ['map']((_0x2354d0, _0x498f3c) =>
        createAudioVoiceWorkflowAudioRef(_0x2354d0, _0x1efc76[_0x498f3c]?.['slot'] || ''),
      )
      ['filter'](Boolean),
    _0xd581cc,
  );
}
export function buildAudioVoiceGeneratePayload(
  _0x32512b = {},
  _0x4e0b14 = '',
  { workflowLabel: workflowLabel = '', nodeId: nodeId = '', installId: installId = '' } = {},
) {
  const _0x202eb2 = String(_0x4e0b14 || '')['trim']();
  if (!_0x202eb2 || !getModelManifest(_0x202eb2)) throw createAudioVoicePayloadError('unsupportedVoiceModel');
  const _0x700fc5 = normalizeAudioVoicePromptForBackend(
      _0x202eb2,
      firstNonEmptyString(_0x32512b['targetText'], _0x32512b['sourceText']),
    ),
    _0xa708c2 = getAudioVoiceWorkflowAudioSlots(_0x202eb2),
    _0x301ed9 = buildAudioVoiceWorkflowAudioRefs(_0x32512b, _0x202eb2, _0xa708c2),
    _0x30daac = new Map(_0x301ed9['map']((_0x3a618d) => [String(_0x3a618d?.['refSlot'] || ''), _0x3a618d]));
  _0xa708c2['forEach']((_0x38b105, _0x51e91b) => {
    const _0x16ffed = _0x30daac['get'](_0x38b105['slot']);
    if (_0x38b105['required'] && !_0x16ffed?.['url']) {
      if (_0x202eb2 === RH_AUDIO_VOICE_CONVERT_MODEL_ID)
        throw createAudioVoicePayloadError(
          _0x38b105['slot'] === 'audioRef' ? 'missingVoiceRefAudio' : 'missingSourceAudio',
        );
      throw createAudioVoicePayloadError(
        _0x51e91b === 0x0 ? 'missingSourceAudio' : 'missingSecondVoiceRefAudio',
      );
    }
  });
  if (_0x202eb2 === RH_AUDIO_INDEXTTS2_CLONE_MODEL_ID) {
    if (!_0x700fc5) throw createAudioVoicePayloadError('missingPromptText');
  }
  if (_0x202eb2 === RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID && !_0x700fc5)
    throw createAudioVoicePayloadError('missingPromptText');
  const _0x1fcac9 = {
      provider: 'runninghubwf',
      audioWorkflowKey: _0x202eb2,
      audioWorkflowLabel: String(workflowLabel || '')['trim'](),
      nodeId: String(nodeId || '')['trim'](),
      prompt: _0x700fc5,
      textInputs: _0x700fc5 ? [_0x700fc5] : [],
      audioRefs: _0x301ed9,
    },
    _0x12906b = String(installId || '')['trim']();
  if (_0x12906b) _0x1fcac9['installId'] = _0x12906b;
  return _0x1fcac9;
}
export async function resolveAudioVoiceGenerateInstallId(_0x79f501 = globalThis['window'], _0x1b2c89 = '') {
  const _0x38c077 = String(_0x79f501?.['__aicInstallId'] || globalThis['__aicInstallId'] || '')['trim'](),
    _0x1b0623 = getModelManifest(String(_0x1b2c89 || '')['trim']());
  if (_0x1b0623?.['vip'] !== !![]) return _0x38c077;
  if (typeof _0x79f501?.['ensureSubscriptionInstallId'] === 'function')
    try {
      const _0x26c67e = String(await _0x79f501['ensureSubscriptionInstallId']())['trim']();
      if (_0x26c67e) return _0x26c67e;
    } catch {}
  return _0x38c077;
}
function normalizeAudioVoiceLastUsedAt(_0x2a2579) {
  const _0x11989a = Number(_0x2a2579);
  return Number['isFinite'](_0x11989a) && _0x11989a > 0x0 ? Math['round'](_0x11989a) : 0x0;
}
function resolveLatestAudioVoicePersistedSourceNode(_0x16ee5b = {}) {
  let _0xde9033 = null,
    _0xda7254 = 0x0;
  return (
    Object['values'](_0x16ee5b || {})['forEach']((_0x7a32ba) => {
      if (!isAudioVoiceSourceNode(_0x7a32ba)) return;
      const _0x4d5714 = resolveAudioVoicePersistedAnalysisSnapshot(_0x7a32ba),
        _0x1b782d = normalizeAudioVoiceLastUsedAt(_0x4d5714?.['lastUsedAt']);
      if (!_0x4d5714 || _0x1b782d <= _0xda7254) return;
      ((_0xde9033 = _0x7a32ba), (_0xda7254 = _0x1b782d));
    }),
    _0xde9033
  );
}
export function resolveAudioVoicePanelSourceNode(_0x3e5bdc = {}, _0x5277bd = '', _0x2f02c6 = '') {
  const _0x3adff1 = _0x3e5bdc?.['nodes'] || {},
    _0x5da10c = String(_0x5277bd || '')['trim']();
  if (_0x5da10c && isAudioVoiceSourceNode(_0x3adff1[_0x5da10c])) return _0x3adff1[_0x5da10c];
  const _0x55060 = Array['isArray'](_0x3e5bdc?.['selectedNodeIds']) ? _0x3e5bdc['selectedNodeIds'] : [];
  for (const _0x465a57 of _0x55060) {
    const _0x1714bf = _0x3adff1?.[_0x465a57];
    if (isAudioVoiceSourceNode(_0x1714bf)) return _0x1714bf;
  }
  const _0x2dd526 = String(_0x2f02c6 || '')['trim']();
  if (_0x2dd526 && isAudioVoiceSourceNode(_0x3adff1[_0x2dd526])) return _0x3adff1[_0x2dd526];
  return resolveLatestAudioVoicePersistedSourceNode(_0x3adff1);
}
export function resolveAudioVoicePanelOpenSourceNode(_0x232f6b = {}, _0x36f87c = {}, _0x375de2 = '') {
  const _0x5a6d73 = String(_0x36f87c?.['sourceNodeId'] || '')['trim']();
  if (_0x5a6d73) return resolveAudioVoicePanelSourceNode(_0x232f6b, _0x5a6d73, '');
  return resolveAudioVoicePanelSourceNode({ ...(_0x232f6b || {}), selectedNodeIds: [] }, '', _0x375de2);
}
function normalizeAudioVoiceMemoryKeyPart(_0x5ded4f) {
  return String(_0x5ded4f || '')
    ['trim']()
    ['replace'](/\\/g, '/');
}
export function resolveAudioVoiceAnalysisMemoryKey(_0x2a529a = {}) {
  const _0x47f42a = _0x2a529a || {},
    _0x2df2a9 = firstNonEmptyString(_0x47f42a['displayLocalPath'], _0x47f42a['localPath']),
    _0x3eb517 = /^(?:https?:|blob:|data:|file:)/i['test'](_0x2df2a9)
      ? ''
      : normalizeLocalPath(_0x2df2a9) || normalizeAudioVoiceMemoryKeyPart(_0x2df2a9);
  if (_0x3eb517) return 'path:' + normalizeAudioVoiceMemoryKeyPart(_0x3eb517);
  const _0x380116 = firstNonEmptyString(
    _0x47f42a['src'],
    _0x47f42a['videoUrl'],
    _0x47f42a['audioUrl'],
    _0x47f42a['url'],
    _0x47f42a['resultUrl'],
  );
  if (_0x380116) return 'src:' + normalizeAudioVoiceMemoryKeyPart(_0x380116);
  const _0x49de23 = String(_0x47f42a['id'] || '')['trim']();
  return _0x49de23 ? 'id:' + _0x49de23 : '';
}
function formatDuration(_0x470f1d) {
  const _0x6d2a55 = Number(_0x470f1d);
  if (!Number['isFinite'](_0x6d2a55) || _0x6d2a55 <= 0x0) return '';
  const _0xa1769b = Math['round'](_0x6d2a55),
    _0x14c44b = Math['floor'](_0xa1769b / 0x3c),
    _0x3295b0 = String(_0xa1769b % 0x3c)['padStart'](0x2, '0');
  return _0x14c44b + ':' + _0x3295b0;
}
function getSourceLabel(_0x1f9d76 = {}) {
  if (isAudioVoiceAudioNode(_0x1f9d76))
    return _0x1f9d76['localPath'] ? panelText('source.localAudio') : panelText('source.canvasAudio');
  return _0x1f9d76['localPath'] ? panelText('source.localVideo') : panelText('source.canvasVideo');
}
function getSourceName(_0x31dc78 = {}) {
  return (
    _0x31dc78['name'] ||
    _0x31dc78['fileName'] ||
    _0x31dc78['title'] ||
    _0x31dc78['label'] ||
    panelText('source.empty')
  );
}
function getSourceMeta(_0x450f1a = {}) {
  const _0x108906 = formatDuration(
      _0x450f1a['videoDuration'] || _0x450f1a['audioDuration'] || _0x450f1a['duration'],
    ),
    _0x29cdbe = [getSourceLabel(_0x450f1a), _0x108906]['filter'](Boolean);
  return _0x29cdbe['join'](' / ');
}
export function normalizeAudioVoiceAnalyzeSegments(_0x4dbc47 = {}) {
  return normalizeAudioVoiceAnalyzeSegments_2(_0x4dbc47, { normalizeSegment: cloneAudioVoiceSegment });
}
export function buildAudioVoiceVideoAnalysisMemorySnapshot({
  sourceNode: sourceNode = {},
  sourceNodeId: sourceNodeId = '',
  segments: segments = [],
  analysisSourceAudioLocalPath: analysisSourceAudioLocalPath = '',
  analysisSourceAudioUrl: analysisSourceAudioUrl = '',
  analysisStatus: analysisStatus = 'ready',
  lastUsedAt: lastUsedAt = 0x0,
  completedComposeKey: completedComposeKey = '',
} = {}) {
  const _0x5ec3da = sourceNode || {},
    _0x2151f5 = resolveAudioVoiceAnalysisMemoryKey(_0x5ec3da);
  if (!_0x2151f5) return null;
  const _0x5bcf51 = normalizeLocalPath(analysisSourceAudioLocalPath || ''),
    _0x57d74e = normalizeAudioVoiceLastUsedAt(lastUsedAt),
    _0xc1fba1 = {
      schemaVersion: AUDIO_VOICE_ANALYSIS_SCHEMA_VERSION,
      key: _0x2151f5,
      sourceNodeId: String(sourceNodeId || _0x5ec3da['id'] || ''),
      analysisSourceAudioLocalPath: _0x5bcf51,
      analysisSourceAudioUrl: firstNonEmptyString(analysisSourceAudioUrl, localPathToUrl(_0x5bcf51)),
      analysisStatus: String(analysisStatus || 'ready'),
      completedComposeKey: String(completedComposeKey || ''),
      segments: (Array['isArray'](segments) ? segments : [])['map'](cloneAudioVoiceSegment),
    };
  if (_0x57d74e > 0x0) _0xc1fba1['lastUsedAt'] = _0x57d74e;
  return _0xc1fba1;
}
export function resolveAudioVoicePersistedAnalysisSnapshot(_0x468330 = {}) {
  const _0x3c9e0b = _0x468330?.[AUDIO_VOICE_ANALYSIS_STATE_FIELD];
  if (!_0x3c9e0b || typeof _0x3c9e0b !== 'object' || Array['isArray'](_0x3c9e0b)) return null;
  const _0x16b670 = buildAudioVoiceVideoAnalysisMemorySnapshot({
    sourceNode: _0x468330,
    sourceNodeId: _0x3c9e0b['sourceNodeId'] || _0x468330?.['id'],
    segments: _0x3c9e0b['segments'],
    analysisSourceAudioLocalPath: _0x3c9e0b['analysisSourceAudioLocalPath'],
    analysisSourceAudioUrl: _0x3c9e0b['analysisSourceAudioUrl'],
    analysisStatus: _0x3c9e0b['analysisStatus'],
    lastUsedAt: _0x3c9e0b['lastUsedAt'],
    completedComposeKey: _0x3c9e0b['completedComposeKey'],
  });
  if (!_0x16b670) return null;
  const _0x76af3f = String(_0x3c9e0b['key'] || '')['trim']();
  if (_0x76af3f && _0x76af3f !== _0x16b670['key']) return null;
  if (_0x16b670['analysisStatus'] !== 'ready' && _0x16b670['segments']['length'] <= 0x0) return null;
  return _0x16b670;
}
function shouldShowConvertedRow(_0x4cc022 = {}) {
  return (
    !!String(_0x4cc022['targetText'] || '')['trim']() ||
    !!String(_0x4cc022['error'] || '')['trim']() ||
    _0x4cc022['convertedAudioReady'] === !![] ||
    _0x4cc022['status'] === 'generating' ||
    _0x4cc022['status'] === 'ready'
  );
}
function hasSegmentSourceAudio(_0x5baff8 = {}) {
  return !!resolveSegmentLocalAudioUrl(_0x5baff8['sourceAudioUrl'], _0x5baff8['sourceAudioLocalPath']);
}
function hasSegmentConvertedAudio(_0x2b4ecf = {}) {
  return (
    _0x2b4ecf['convertedAudioReady'] === !![] &&
    !!resolveSegmentLocalAudioUrl(_0x2b4ecf['convertedAudioUrl'], _0x2b4ecf['convertedAudioLocalPath'])
  );
}
function isSegmentUsingConvertedAudio(_0x1b5ce2 = {}) {
  return hasSegmentConvertedAudio(_0x1b5ce2) && _0x1b5ce2['activeAudio'] !== 'source';
}
export function resolveAudioVoiceSegmentActiveAudioUrl(_0x4f34d1 = {}) {
  if (isSegmentUsingConvertedAudio(_0x4f34d1))
    return resolveSegmentLocalAudioUrl(_0x4f34d1['convertedAudioUrl'], _0x4f34d1['convertedAudioLocalPath']);
  return resolveSegmentLocalAudioUrl(_0x4f34d1['sourceAudioUrl'], _0x4f34d1['sourceAudioLocalPath']);
}
export function resolveAudioVoiceSegmentActiveAudioLocalPath(_0x3b0e5a = {}) {
  if (isSegmentUsingConvertedAudio(_0x3b0e5a))
    return normalizeLocalPath(_0x3b0e5a['convertedAudioLocalPath'] || '');
  return normalizeLocalPath(_0x3b0e5a['sourceAudioLocalPath'] || '');
}
function resolveAudioVoiceSegmentActiveAudioDurationMs(_0x77e2f1 = {}, _0x339115 = 0x0, _0x17ff1a = 0x0) {
  const _0x23d9e4 = Math['max'](
    0x0,
    Math['round'](Number(_0x17ff1a) || 0x0) - Math['round'](Number(_0x339115) || 0x0),
  );
  if (isSegmentUsingConvertedAudio(_0x77e2f1)) {
    const _0x820edf = pickAudioDurationSec(_0x77e2f1['convertedAudioDuration'], _0x77e2f1['audioDuration']);
    if (_0x820edf > 0x0) return Math['max'](0x1, Math['round'](_0x820edf * 0x3e8));
    return 0x0;
  }
  return _0x23d9e4;
}
export function buildAudioVoiceComposeSources(_0x4ea86e = []) {
  return (Array['isArray'](_0x4ea86e) ? _0x4ea86e : [])
    ['filter']((_0x1975e0) => _0x1975e0?.['status'] !== 'removed')
    ['map'](resolveAudioVoiceSegmentActiveAudioUrl)
    ['filter'](Boolean);
}
export function applyAudioVoiceReferenceToSegments(_0x49b6a0 = [], _0x58506c = [], _0x54c1da = {}) {
  const _0x5b9043 = Array['isArray'](_0x49b6a0) ? _0x49b6a0 : [];
  if (!isAudioVoiceAudioNode(_0x54c1da))
    return { segments: _0x5b9043, appliedIds: [], reason: 'unsupported' };
  const _0x485646 = resolveCanvasAudioLocalPath(_0x54c1da),
    _0x289583 = resolveCanvasAudioUrl(_0x54c1da);
  if (!_0x289583) return { segments: _0x5b9043, appliedIds: [], reason: 'invalid' };
  const _0x2af7fb = new Set(
      _0x5b9043['filter']((_0x113a09) => _0x113a09?.['status'] !== 'removed')
        ['map']((_0x4089eb) => String(_0x4089eb?.['id'] || '')['trim']())
        ['filter'](Boolean),
    ),
    _0x5ba541 = [
      ...new Set(
        (Array['isArray'](_0x58506c) ? _0x58506c : [])
          ['map']((_0x28c64c) => String(_0x28c64c || '')['trim']())
          ['filter']((_0x452122) => _0x2af7fb['has'](_0x452122)),
      ),
    ];
  if (!_0x5ba541['length']) return { segments: _0x5b9043, appliedIds: _0x5ba541, reason: 'no-target' };
  const _0x202b5a = new Set(_0x5ba541),
    _0x2c257c = getSourceName(_0x54c1da),
    _0x4e6023 = firstNonEmptyString(
      _0x54c1da['voiceRefImageUrl'],
      _0x54c1da['imageUrl'],
      _0x54c1da['thumbUrl'],
      _0x54c1da['posterUrl'],
    );
  return {
    segments: _0x5b9043['map']((_0x524cc7) =>
      _0x202b5a['has'](_0x524cc7['id'])
        ? {
            ..._0x524cc7,
            voiceRefNodeId: _0x54c1da['id'] || '',
            voiceRefAudioLocalPath: _0x485646,
            voiceRefAudioUrl: _0x289583,
            voiceRefName: _0x2c257c,
            voiceRefImageUrl: _0x4e6023,
            error: '',
          }
        : _0x524cc7,
    ),
    appliedIds: _0x5ba541,
    reason: '',
  };
}
export function buildAudioVoiceComposeTimelineClips(_0x5ab310 = []) {
  return (Array['isArray'](_0x5ab310) ? _0x5ab310 : [])
    ['filter']((_0xddbb91) => _0xddbb91?.['status'] !== 'removed')
    ['map']((_0x7832c) => {
      const _0x2acecf = resolveAudioVoiceSegmentActiveAudioLocalPath(_0x7832c),
        _0x3dbbe0 = Math['max'](0x0, Math['round'](Number(_0x7832c['startMs']) || 0x0)),
        _0x32f0fd = Math['max'](_0x3dbbe0, Math['round'](Number(_0x7832c['endMs']) || _0x3dbbe0));
      if (!_0x2acecf || !(_0x32f0fd > _0x3dbbe0)) return null;
      const _0x4e3ce9 = resolveAudioVoiceSegmentActiveAudioDurationMs(_0x7832c, _0x3dbbe0, _0x32f0fd);
      return {
        id: String(_0x7832c['id'] || ''),
        src: _0x2acecf,
        startMs: _0x3dbbe0,
        endMs: _0x32f0fd,
        ...(_0x4e3ce9 > 0x0 ? { durationMs: _0x4e3ce9 } : {}),
      };
    })
    ['filter'](Boolean);
}
export function resolveAudioVoiceComposeDurationSec(_0x1c6302 = {}, _0x5f5025 = []) {
  const _0x19c694 = Number(
    _0x1c6302?.['videoDuration'] || _0x1c6302?.['audioDuration'] || _0x1c6302?.['duration'],
  );
  if (Number['isFinite'](_0x19c694) && _0x19c694 > 0x0) return _0x19c694;
  const _0x374315 = Math['max'](
    0x0,
    ...(Array['isArray'](_0x5f5025) ? _0x5f5025 : [])
      ['map']((_0x2970e) => Math['round'](Number(_0x2970e?.['endMs']) || 0x0))
      ['filter']((_0x270f45) => Number['isFinite'](_0x270f45) && _0x270f45 > 0x0),
  );
  return _0x374315 > 0x0 ? _0x374315 / 0x3e8 : 0x0;
}
export function getDefaultAudioVoiceModelId() {
  const _0x33e59f = getAudioVoicePanelModelOptions();
  return (
    _0x33e59f['find']((_0x5c57ef) => _0x5c57ef['id'] === RH_AUDIO_INDEXTTS2_CLONE_MODEL_ID)?.['id'] ||
    _0x33e59f[0x0]?.['id'] ||
    ''
  );
}
export function initAudioVoicePanel({
  store: _0x6aa227,
  fabBtnEl: _0x31f254,
  root: root = document['body'],
  windowObject: windowObject = window,
  embedded: embedded = ![],
  composeTimeline: composeTimeline = composeAudioVoiceTimelineNearNode,
  translateSegments: translateSegments = translateAudioVoiceSegments,
  playCompletion: playCompletion = playCompletionSound,
  showCompletionNotification: showCompletionNotification = showGenerationCompleteNotification,
  onComposeResult: onComposeResult = null,
  onAudioPickStateChange: onAudioPickStateChange = null,
  resolveStartAnalyzeConfirmation: resolveStartAnalyzeConfirmation = null,
} = {}) {
  if (!root || !_0x31f254) return null;
  const _0x102e8c = createAudioVoiceConfirmDialog({
    root: root,
    documentObject: root['ownerDocument'] || globalThis['document'],
    windowObject: windowObject,
  });
  let _0x2826aa = '',
    _0x207e98 = null,
    _0x4544d9 = 0x0,
    _0x343faf = '',
    _0xb8517e = '',
    _0x5d4fd6 = [],
    _0x511db2 = new Set(),
    _0x4fc784 = getDefaultAudioVoiceModelId(),
    _0x3a0686 = AUDIO_VOICE_ASR_PROVIDER_IDS['DOUBAO'],
    _0xbd3cd4 = null,
    _0x810e66 = null,
    _0x28dfe5 = 'idle',
    _0x215d3a = null;
  const _0x77f56 = createAudioVoiceTaskProgressTracker({ onProgress: _0x413af3 }),
    _0x2e64ce = createAudioVoiceAnalysisSession({ cancelMediaTask: cancelElectronMediaTask });
  let _0x2ffe6d = '';
  const _0x58be89 = new Set(),
    _0x4f424a = new Map();
  let _0x41ebf3 = null,
    _0x3882e0 = '',
    _0x3fa9c9 = null,
    _0x22de4b = '',
    _0x25be96 = null,
    _0x17c39e = null,
    _0x1d44da = null;
  const _0x262dcd = new Set();
  let _0x222157 = null,
    _0x17489b = null,
    _0x54fa7e = 0x0,
    _0x4d4071 = '',
    _0x5ac370 = new Set();
  const _0x144607 = createAudioVoiceGenerationTaskOrchestration({
      createStore: ({ sourceNodeId: _0x3b5250, segmentId: _0x317050, targetNodeId: _0x2bf4af }) =>
        _0x3868af(_0x317050, _0x2bf4af, _0x3b5250),
    }),
    _0xe69b0c = createAudioVoiceTaskRecoveryManager(),
    _0x507df3 = createAudioVoiceSegmentEditSession(),
    _0x34fe12 = createAudioVoiceSegmentMergeController({
      session: _0x507df3,
      getSourceNodeId: () => _0x2826aa,
      getSegments: () => _0x5d4fd6,
      composeAudio: ({ sourceNodeId: _0x3546fc, srcs: _0x752663, durationMs: _0x1b5f71 }) =>
        enqueueElectronMediaTask(
          {
            kind: 'audioCompose',
            nodeId: _0x3546fc,
            srcs: _0x752663,
            args: { srcs: _0x752663, duration: Math['max'](0x0, Number(_0x1b5f71 || 0x0) / 0x3e8) },
          },
          { wait: !![], timeout: AUDIO_CUT_TASK_TIMEOUT_MS },
        ),
      commitSegments: _0x3ae613,
      render: _0x2f3430,
      markMutation: (_0xa4225e) => _0x355496('merge', [_0xa4225e]),
      showPending: () => _0x2f148b(panelText('status.merging')),
      showError: (_0x226c9d) =>
        windowObject?.['showToast']?.(_0x1808af(_0x226c9d, panelText('toasts.sourceClipFailed')), 'error'),
      showStale: () => windowObject?.['showToast']?.(panelText('toasts.mergeChanged'), 'warn'),
    }),
    _0x105473 = createAudioVoicePlaybackSession({
      windowObject: windowObject,
      documentObject: root?.['ownerDocument'] || globalThis['document'],
    }),
    _0x2f6fa4 = createEl('aside', 'audio-voice-panel');
  (_0x2f6fa4['classList']['toggle']('is-embedded', embedded === !![]),
    _0x2f6fa4['setAttribute']('aria-hidden', 'true'),
    _0x2f6fa4['setAttribute']('aria-label', panelText('title') + '\x20' + panelText('betaBadge')));
  const _0x51cf48 = createEl('div', 'audio-voice-panel-resize-handle panel-resize-handle');
  (_0x51cf48['setAttribute']('role', 'separator'),
    _0x51cf48['setAttribute']('aria-orientation', 'vertical'),
    _0x51cf48['setAttribute']('aria-label', panelText('resizeLabel')),
    (_0x51cf48['tabIndex'] = 0x0));
  const _0x42f092 = createEl('div', 'audio-voice-panel-header'),
    _0x2cf7fc = createEl('div', 'audio-voice-panel-title');
  _0x2cf7fc['append'](
    createEl('span', 'audio-voice-panel-title-main', panelText('title')),
    createEl('span', 'audio-voice-panel-title-beta', panelText('betaBadge')),
  );
  const _0x4d26ea = createButton('audio-voice-panel-close', panelText('close'), 'close');
  _0x42f092['append'](_0x2cf7fc, _0x4d26ea);
  const _0x542795 = createEl('div', 'audio-voice-panel-main');
  (_0x2f6fa4['append'](_0x51cf48, _0x42f092, _0x542795), root['appendChild'](_0x2f6fa4));
  const _0x3106f2 = createEl('div', 'audio-voice-pick-notice', panelText('source.pickNotice'));
  ((_0x3106f2['hidden'] = !![]),
    _0x3106f2['setAttribute']('role', 'status'),
    _0x3106f2['setAttribute']('aria-live', 'polite'),
    root['appendChild'](_0x3106f2));
  const _0x30ed43 = createAudioVoicePanelPickSession({
      panel: _0x2f6fa4,
      noticeElement: _0x3106f2,
      store: _0x6aa227,
      documentObject: _0x2f6fa4['ownerDocument'] || globalThis['document'],
      windowObject: windowObject,
      getSegments: () => _0x5d4fd6,
      getSelectedSegmentIds: () => _0x511db2,
      doesSegmentSupportAudioReference: (_0x15c3bd) =>
        doesAudioVoiceWorkflowSupportToneClone(_0x3f3bda(_0x15c3bd)?.['id'] || _0x4fc784),
      loadSourceNode: _0x30d3f8,
      applyAudioReference: (_0xe5ec1d, _0x4c8cf9) => {
        const _0xac0523 = applyAudioVoiceReferenceToSegments(_0x5d4fd6, _0x4c8cf9, _0xe5ec1d);
        return (
          _0xac0523['appliedIds']['length'] && ((_0x5d4fd6 = _0xac0523['segments']), _0x3b587b()),
          _0xac0523
        );
      },
      syncSourceUi: _0x5abe5b,
      syncAudioTargetUi: _0x302448,
      onAudioPickStateChange: onAudioPickStateChange,
      text: panelText,
    }),
    _0x39f9ad = readStoredPanelWidth(windowObject);
  _0x39f9ad &&
    document?.['body']?.['style']?.['setProperty']?.(
      '--audio-voice-panel-width',
      clampAudioVoicePanelWidth(_0x39f9ad) + 'px',
    );
  function _0x2f148b(_0xf065b9 = panelText('toasts.pipelinePending')) {
    windowObject?.['showToast']?.(_0xf065b9, 'info');
  }
  function _0x4ca78c() {
    return Boolean(_0x17489b);
  }
  function _0x6f8925(_0x5a3748 = ![]) {
    _0x102e8c['close'](_0x5a3748);
  }
  function _0x5aca2b() {
    ((_0x54fa7e += 0x1), (_0x17489b = null), _0x6f8925(![]));
  }
  function _0x5b86d2(_0x5386c5 = {}) {
    return _0x102e8c['confirm'](_0x5386c5);
  }
  function _0x27ec6b({
    language: _0x4ec3e5,
    count: _0x17f223,
    scope: _0x1c6be8,
    returnFocus: _0x3b6f8b,
  } = {}) {
    return _0x5b86d2({
      className: 'audio-voice-translation-confirm',
      title: panelText('translation.confirmTitle'),
      message: panelText(
        _0x1c6be8 === 'selected' ? 'translation.confirmSelected' : 'translation.confirmAll',
        { count: _0x17f223, language: _0x4ec3e5?.['label'] || '' },
      ),
      cancelLabel: panelText('translation.cancel'),
      confirmLabel: panelText('translation.confirm'),
      returnFocus: _0x3b6f8b,
    });
  }
  function _0x1808af(_0x220f6d, _0xb70831 = panelText('toasts.operationFailed')) {
    const _0x5b43c7 = String(_0x220f6d?.['code'] || _0x220f6d?.['message'] || '')['trim']();
    if (_0x5b43c7 && _0x5b43c7 === _0x220f6d?.['code']) {
      const _0x2cba52 = panelText('toasts.' + _0x5b43c7);
      if (_0x2cba52 && _0x2cba52 !== 'audioVoicePanel.toasts.' + _0x5b43c7) return _0x2cba52;
    }
    return String(_0x220f6d?.['message'] || _0x220f6d || _0xb70831)['trim']() || _0xb70831;
  }
  function _0x2e8a98(_0x4a3832 = 'invalid', _0x3fba09 = '') {
    const _0x26d475 = getAudioVoiceAsrProvider(_0x3a0686)['helpPath'],
      _0xe120f2 = String(_0x4a3832 || '')['trim']() === 'missing' ? 'missing' : 'invalid',
      _0x598f2a =
        _0xe120f2 === 'missing'
          ? panelText(_0x26d475 + '.missingMessage')
          : panelText(_0x26d475 + '.invalidMessage');
    return {
      reason: _0xe120f2,
      title:
        _0xe120f2 === 'missing'
          ? panelText(_0x26d475 + '.missingTitle')
          : panelText(_0x26d475 + '.invalidTitle'),
      message: String(_0x3fba09 || _0x598f2a)['trim']() || _0x598f2a,
    };
  }
  function _0x674e0(_0x45e5d1 = 'invalid', _0x4dd247 = '') {
    ((_0xbd3cd4 = _0x2e8a98(_0x45e5d1, _0x4dd247)),
      _0x2f3430(),
      _0x2f6fa4['querySelector']?.('.audio-voice-asr-config-alert')?.['scrollIntoView']?.({
        block: 'nearest',
        behavior: 'smooth',
      }));
  }
  function _0x2b5c63() {
    if (!_0xbd3cd4) return;
    ((_0xbd3cd4 = null), _0x2f3430());
  }
  async function _0x511f1e() {
    const _0x2a2685 = getAudioVoiceAsrProvider(_0x3a0686);
    try {
      await ensureConfig();
    } catch {
      return (_0x674e0('invalid', panelText('toasts.asrConfigReadFailed')), ![]);
    }
    const _0x4332d5 = getProviderConfig(_0x2a2685['configProviderId']);
    if (!String(_0x4332d5?.['apiKey'] || '')['trim']()) return (_0x674e0('missing'), ![]);
    const _0x205ce8 = await testProviderConnection(_0x2a2685['configProviderId'], _0x4332d5, {
      requiredCapabilities: _0x2a2685['requiredCapabilities'],
    })['catch'](() => null);
    if (_0x205ce8 && !_0x205ce8['ok'])
      return (
        shouldShowVolcengineSpeechApiKeyHelp(_0x205ce8, _0x205ce8['summary'] || '')
          ? _0x674e0('invalid', _0x205ce8['summary'])
          : windowObject?.['showToast']?.(
              _0x205ce8['summary'] || _0x205ce8['suggestion'] || panelText('toasts.analysisFailed'),
              'error',
            ),
        ![]
      );
    return (_0x2b5c63(), !![]);
  }
  function _0x453734(_0x4e9b53 = 'invalid', _0x38002f = '') {
    const _0x38ef7a = String(_0x4e9b53 || '')['trim']() === 'missing' ? 'missing' : 'invalid',
      _0x7d740 =
        _0x38ef7a === 'missing'
          ? panelText('translationApiKeyHelp.missingMessage')
          : panelText('translationApiKeyHelp.invalidMessage');
    return {
      reason: _0x38ef7a,
      title:
        _0x38ef7a === 'missing'
          ? panelText('translationApiKeyHelp.missingTitle')
          : panelText('translationApiKeyHelp.invalidTitle'),
      message: String(_0x38002f || _0x7d740)['trim']() || _0x7d740,
    };
  }
  function _0x4aa051(_0x204ddc = 'invalid', _0x25dd50 = '') {
    ((_0x810e66 = _0x453734(_0x204ddc, _0x25dd50)),
      _0x2f3430(),
      _0x2f6fa4['querySelector']?.('.audio-voice-translation-config-alert')?.['scrollIntoView']?.({
        block: 'nearest',
        behavior: 'smooth',
      }));
  }
  function _0x1cd02a() {
    if (!_0x810e66) return;
    ((_0x810e66 = null), _0x2f3430());
  }
  async function _0x380d5b() {
    try {
      await ensureConfig();
    } catch {
      return (_0x4aa051('invalid', panelText('toasts.translationConfigReadFailed')), ![]);
    }
    const _0x567ac4 = getProviderConfig(AUDIO_VOICE_TRANSLATION_PROVIDER_ID);
    if (!String(_0x567ac4?.['apiKey'] || '')['trim']())
      return (_0x4aa051('missing', panelText('translationApiKeyHelp.missingMessage')), ![]);
    return (_0x1cd02a(), !![]);
  }
  function _0x3cd89f(_0x47e5e4) {
    return AUDIO_VOICE_INLINE_ERROR_CODES['has'](String(_0x47e5e4?.['code'] || '')['trim']());
  }
  function _0x555552() {
    return getAudioVoicePanelModelOptions()['find']((_0x115f8e) => _0x115f8e['id'] === _0x4fc784) || null;
  }
  function _0x3f3bda(_0x32018f = {}) {
    const _0x4825ef = getAudioVoicePanelModelOptions(),
      _0xd03fbc =
        _0x32018f['voiceModelSelectionMode'] === 'global'
          ? ''
          : String(_0x32018f['voiceModelId'] || '')['trim']();
    return (
      _0x4825ef['find']((_0x42b463) => _0x42b463['id'] === _0xd03fbc) ||
      _0x4825ef['find']((_0x412264) => _0x412264['id'] === _0x4fc784) ||
      null
    );
  }
  function _0x35150a(_0x2fe1f6 = {}) {
    const _0x50c935 = String(_0x2fe1f6['taskModelId'] || '')['trim']();
    return (
      getAudioVoicePanelModelOptions()['find']((_0x495a30) => _0x495a30['id'] === _0x50c935) ||
      _0x3f3bda(_0x2fe1f6)
    );
  }
  function _0x1900fb(_0x8e674b = {}) {
    return _0x35150a(_0x8e674b)?.['cancellable'] === !![];
  }
  function _0x52359a(_0x197357, _0xc54f0a = _0x2826aa) {
    return 'audio-voice:' + (_0xc54f0a || 'source') + ':' + _0x197357;
  }
  function _0x563ba3(_0xea739 = {}) {
    const _0x184b8e = _0x35150a(_0xea739);
    return {
      ..._0xea739,
      provider: _0x184b8e?.['provider'] || 'runninghubwf',
      adapterType: _0x184b8e?.['adapterType'] || 'workflow',
      isGenerating: _0xea739['isGenerating'] === !![] || _0xea739['status'] === 'generating',
      jobStatus:
        _0xea739['jobStatus'] ||
        (_0xea739['status'] === 'generating' ? 'running' : _0xea739['status'] === 'ready' ? 'success' : ''),
      rhTaskStatus:
        _0xea739['rhTaskStatus'] ||
        (_0xea739['status'] === 'generating' ? (_0xea739['rhTaskId'] ? 'running' : 'pending') : ''),
    };
  }
  function _0x3868af(_0x4ae0e1, _0x4a0cdf, _0x2054f5 = _0x2826aa) {
    const _0x4ddab7 = String(_0x2054f5 || '')['trim']();
    return createAudioVoiceGenerationTaskStoreAdapter({
      sourceNodeId: _0x4ddab7,
      segmentId: _0x4ae0e1,
      targetNodeId: _0x4a0cdf,
      readCurrentSourceNodeId: () => _0x2826aa,
      readCurrentSegment: (_0x5d36c2) => _0x5d4fd6[_0x35cecb(_0x5d36c2)] || {},
      updateCurrentSegment: _0x2ef379,
      readPersistedSnapshot: (_0x5eadeb) => {
        const _0x59bdd6 = getStateSnapshot(_0x6aa227)['nodes']?.[_0x5eadeb];
        return resolveAudioVoicePersistedAnalysisSnapshot(_0x59bdd6);
      },
      writePersistedSnapshot: (_0x1781d0, _0x2d6227) => {
        const _0x3ccccd = getStateSnapshot(_0x6aa227)['nodes']?.[_0x4ddab7];
        if (!_0x3ccccd || _0x1781d0 !== _0x4ddab7) return;
        (_0x6aa227['updateNodeData'](_0x1781d0, { [AUDIO_VOICE_ANALYSIS_STATE_FIELD]: _0x2d6227 }),
          _0x4f424a['set'](_0x2d6227['key'], _0x2d6227));
      },
      buildTaskNode: _0x563ba3,
    });
  }
  function _0x19d8f9(_0x230518, _0x3ec0f8, _0x35abc0 = _0x2826aa) {
    return _0x144607['getStore']({ sourceNodeId: _0x35abc0, segmentId: _0x230518, targetNodeId: _0x3ec0f8 });
  }
  function _0x5411de(_0x4de154, _0x44af6a = {}) {
    const _0x196ce0 = _0x1900fb(_0x44af6a),
      _0x3ecd57 = resolveGenerationButtonMode(_0x563ba3(_0x44af6a), {
        cancellable: _0x196ce0,
        cancelInFlight: _0x144607['isCancelInFlight'](_0x2826aa, _0x44af6a['id']),
      });
    if (_0x3ecd57['busy'] && _0x3ecd57['canCancel']) {
      setGenerateButtonCancellableUi(_0x4de154, {
        title: panelText('actions.cancelGeneration'),
        tooltip: panelText('actions.cancelGeneration'),
        ariaLabel: panelText('actions.cancelGeneration'),
        color: 'var(--red)',
        busy: !![],
      });
      return;
    }
    if (_0x3ecd57['busy']) {
      setGenerateButtonLoadingUi(_0x4de154, {
        title: panelText('status.generating'),
        tooltip: panelText('status.generating'),
        disabled: _0x3ecd57['disabled'],
        ariaLabel: panelText('status.generating'),
      });
      return;
    }
    resetGenerateButtonIdleUi(_0x4de154, panelText('actions.generate'));
  }
  function _0x3ae613(_0xa8131f) {
    _0x5d4fd6 = _0xa8131f['map'](cloneAudioVoiceSegment);
    const _0x3804c2 = new Set(_0x5d4fd6['map']((_0x30d578) => _0x30d578['id']));
    for (const _0x3f1cc9 of [..._0x58be89]) {
      if (!_0x3804c2['has'](_0x3f1cc9)) _0x58be89['delete'](_0x3f1cc9);
    }
    ((_0x511db2 = new Set([..._0x511db2]['filter']((_0x96f372) => _0x3804c2['has'](_0x96f372)))),
      _0x3b587b(),
      _0x2f3430(),
      _0x18bf24());
  }
  function _0x744b3e(_0x3a4249) {
    if (!_0x3a4249 || !_0x2826aa || typeof _0x6aa227?.['updateNodeData'] !== 'function') return;
    const _0x24b29d = getStateSnapshot(_0x6aa227)['nodes']?.[_0x2826aa];
    if (!isAudioVoiceSourceNode(_0x24b29d)) return;
    const _0x32907e = resolveAudioVoicePersistedAnalysisSnapshot(_0x24b29d);
    if (_0x32907e && JSON['stringify'](_0x32907e) === JSON['stringify'](_0x3a4249)) {
      _0x207e98 = _0x24b29d;
      return;
    }
    const _0x3e5f24 = { [AUDIO_VOICE_ANALYSIS_STATE_FIELD]: _0x3a4249 };
    (_0x6aa227['updateNodeData'](_0x2826aa, _0x3e5f24), (_0x207e98 = { ..._0x24b29d, ..._0x3e5f24 }));
  }
  function _0x3b587b({ markLastUsed: markLastUsed = ![] } = {}) {
    markLastUsed && _0x2826aa && (_0x4544d9 = Math['max'](_0x4544d9, Date['now']()));
    const _0x2c566c = buildAudioVoiceVideoAnalysisMemorySnapshot({
      sourceNode: _0x207e98,
      sourceNodeId: _0x2826aa,
      segments: _0x5d4fd6,
      analysisSourceAudioLocalPath: _0x343faf,
      analysisSourceAudioUrl: _0xb8517e,
      analysisStatus: _0x28dfe5,
      lastUsedAt: _0x4544d9,
      completedComposeKey: _0x4d4071,
    });
    if (!_0x2c566c) return;
    if (_0x2c566c['analysisStatus'] !== 'ready' && _0x2c566c['segments']['length'] <= 0x0) return;
    (_0x4f424a['set'](_0x2c566c['key'], _0x2c566c), _0x744b3e(_0x2c566c));
  }
  function _0xd19fb2(_0x3f9166) {
    ((_0x511db2 = new Set()), (_0x215d3a = null));
    const _0x123b26 = resolveAudioVoiceAnalysisMemoryKey(_0x3f9166),
      _0x35cb0e =
        (_0x123b26 ? _0x4f424a['get'](_0x123b26) : null) ||
        resolveAudioVoicePersistedAnalysisSnapshot(_0x3f9166);
    if (!_0x35cb0e)
      return (
        (_0x5d4fd6 = []),
        _0x58be89['clear'](),
        (_0x343faf = ''),
        (_0xb8517e = ''),
        (_0x28dfe5 = 'idle'),
        (_0x4544d9 = 0x0),
        (_0x4d4071 = ''),
        ![]
      );
    ((_0x5d4fd6 = _0x35cb0e['segments']['map']((_0x206ea0) =>
      cloneAudioVoiceSegment(normalizeAudioVoiceSegmentModelSelection(_0x206ea0, _0x4fc784)),
    )),
      _0x58be89['clear'](),
      (_0x343faf = normalizeLocalPath(_0x35cb0e['analysisSourceAudioLocalPath'] || '')),
      (_0xb8517e = firstNonEmptyString(_0x35cb0e['analysisSourceAudioUrl'], localPathToUrl(_0x343faf))),
      (_0x28dfe5 = _0x35cb0e['analysisStatus'] === 'ready' || _0x5d4fd6['length'] > 0x0 ? 'ready' : 'idle'),
      (_0x4544d9 = normalizeAudioVoiceLastUsedAt(_0x35cb0e['lastUsedAt'])),
      (_0x4d4071 = String(_0x35cb0e['completedComposeKey'] || '')));
    const _0x1170c1 = { ..._0x35cb0e, segments: _0x5d4fd6['map'](cloneAudioVoiceSegment) };
    return (
      _0x4f424a['set'](_0x35cb0e['key'], _0x1170c1),
      _0x744b3e(_0x1170c1),
      void _0xe69b0c['recover']({
        sourceNodeId: _0x2826aa,
        segments: _0x5d4fd6,
        resolveModelOption: _0x35150a,
        createTaskStore: _0x19d8f9,
        buildResultPatch: _0x3ba68,
        getErrorMessage: (_0x448f59) => _0x1808af(_0x448f59, panelText('toasts.generateFailed')),
        cancelledMessage: panelText('toasts.generationCancelled'),
      }),
      !![]
    );
  }
  function _0x30d3f8(_0x1c9814, { markLastUsed: markLastUsed = ![] } = {}) {
    (_0x5aca2b(),
      void _0x2e64ce['invalidate'](),
      _0x507df3['invalidateAll'](),
      (_0x222157 = null),
      (_0x5ac370 = new Set()),
      _0x77f56['clear'](),
      _0x3b587b(),
      (_0x207e98 = _0x1c9814 || null),
      (_0x2826aa = _0x207e98?.['id'] || ''),
      (_0x4544d9 = 0x0),
      _0x105473['clear'](),
      _0xd19fb2(_0x207e98));
    if (markLastUsed) _0x3b587b({ markLastUsed: !![] });
    (_0x2f3430(), _0x18bf24());
  }
  function _0x18bf24() {
    const _0x30ddfa = getVisibleAudioVoiceSegments(_0x5d4fd6)
      ['slice'](0x0, AUDIO_VOICE_WARM_SEGMENT_LIMIT)
      ['flatMap']((_0x416745) => [
        resolveSegmentLocalAudioUrl(_0x416745['sourceAudioUrl'], _0x416745['sourceAudioLocalPath']),
        _0x416745['convertedAudioReady']
          ? resolveSegmentLocalAudioUrl(_0x416745['convertedAudioUrl'], _0x416745['convertedAudioLocalPath'])
          : '',
      ])
      ['filter'](Boolean);
    void _0x105473['warmMany'](_0x30ddfa, { limit: AUDIO_VOICE_WARM_SEGMENT_LIMIT * 0x2 });
  }
  function _0x1b22f3() {
    const _0x9e0cbc = _0x2f6fa4['querySelectorAll']?.(
      '.audio-voice-more-wrap.is-open, .audio-voice-history-wrap.is-open, .audio-voice-global-settings.is-open, .audio-voice-asr-settings.is-open, .audio-voice-translation-settings.is-open, .is-model-submenu-open',
    );
    _0x9e0cbc?.['forEach']((_0x3b0f9c) => {
      (_0x3b0f9c['classList']['remove']('is-open', 'is-model-submenu-open'),
        _0x3b0f9c['querySelector']?.('[aria-expanded="true"]')?.['setAttribute']?.('aria-expanded', 'false'));
    });
  }
  function _0x6b5d46() {
    if (!_0x207e98) return panelText('status.noSource');
    if (_0x28dfe5 === 'analyzing') return panelText('status.analyzing');
    if (_0x28dfe5 === 'error') return panelText('status.analysisFailed');
    const _0x2cad87 = _0x34fe12['getProjectedVisibleSegments']()['length'];
    if (_0x2cad87 || _0x28dfe5 === 'ready') return panelText('status.detectedCount', { count: _0x2cad87 });
    return panelText('status.notAnalyzed');
  }
  function _0x413af3(_0x23dec0 = {}) {
    ((_0x215d3a = {
      stage: normalizeAnalysisProgressStage(_0x23dec0['stage'] || _0x215d3a?.['stage']),
      progress: clampProgress01(_0x23dec0['progress'] ?? _0x215d3a?.['progress'] ?? 0x0),
    }),
      _0x4d9b33());
  }
  function _0x29beec() {
    return panelText('progress.' + normalizeAnalysisProgressStage(_0x215d3a?.['stage']));
  }
  function _0x3d24ab() {
    if (_0x28dfe5 !== 'analyzing' || !_0x215d3a) return null;
    const _0xd19162 = createEl('section', 'audio-voice-analysis-progress'),
      _0xb35684 = createEl('div', 'audio-voice-analysis-progress-head');
    _0xb35684['append'](
      createEl('div', 'audio-voice-analysis-progress-title', _0x29beec()),
      createEl(
        'div',
        'audio-voice-analysis-progress-percent',
        Math['round'](clampProgress01(_0x215d3a['progress']) * 0x64) + '%',
      ),
    );
    const _0x7b38b1 = createEl('div', 'update-banner-progress-track\x20audio-voice-analysis-progress-track'),
      _0xdd584e = createEl('div', 'update-banner-progress-bar\x20audio-voice-analysis-progress-bar');
    ((_0xdd584e['style']['width'] = Math['round'](clampProgress01(_0x215d3a['progress']) * 0x64) + '%'),
      _0x7b38b1['appendChild'](_0xdd584e));
    const _0x1418c7 = createEl(
      'div',
      'update-banner-progress-text audio-voice-analysis-progress-text',
      panelText('progress.' + normalizeAnalysisProgressStage(_0x215d3a['stage'])),
    );
    return (_0xd19162['append'](_0xb35684, _0x7b38b1, _0x1418c7), _0xd19162);
  }
  function _0x5a18c5({
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
    const _0x3c8ee7 = createEl(
      'section',
      ['audio-voice-asr-config-alert', className]['filter'](Boolean)['join']('\x20'),
    );
    _0x3c8ee7['setAttribute']('role', 'alert');
    const _0x21eb93 = createEl('span', 'audio-voice-asr-config-alert-icon');
    (_0x21eb93['setAttribute']('aria-hidden', 'true'), (_0x21eb93['innerHTML'] = iconSvg('settings')));
    const _0x2e1ae8 = createEl('div', 'audio-voice-asr-config-alert-body'),
      _0x1af1e6 = createEl('div', 'audio-voice-asr-config-alert-title', alert['title']),
      _0x11e88e = createEl('div', 'audio-voice-asr-config-alert-message');
    (_0x11e88e['appendChild'](document['createTextNode'](alert['message'])),
      _0x11e88e['appendChild'](document['createTextNode']('\x20')));
    const _0x442355 = createEl('button', 'audio-voice-asr-config-alert-link', helpLabel);
    ((_0x442355['type'] = 'button'),
      (_0x442355['dataset']['audioVoiceAction'] = helpAction),
      _0x11e88e['appendChild'](_0x442355),
      _0x2e1ae8['append'](_0x1af1e6, _0x11e88e));
    const _0x5607c1 = createEl('div', 'audio-voice-asr-config-alert-actions'),
      _0x18cc5d = createEl('button', 'audio-voice-asr-config-alert-btn', settingsLabel);
    ((_0x18cc5d['type'] = 'button'), (_0x18cc5d['dataset']['audioVoiceAction'] = settingsAction));
    const _0x22fad2 = createEl('button', 'audio-voice-asr-config-alert-close', '×');
    return (
      (_0x22fad2['type'] = 'button'),
      (_0x22fad2['title'] = closeLabel),
      _0x22fad2['setAttribute']('aria-label', closeLabel),
      (_0x22fad2['dataset']['audioVoiceAction'] = closeAction),
      _0x5607c1['append'](_0x18cc5d, _0x22fad2),
      _0x3c8ee7['append'](_0x21eb93, _0x2e1ae8, _0x5607c1),
      _0x3c8ee7
    );
  }
  function _0x731c21() {
    return _0x5a18c5({
      alert: _0xbd3cd4,
      helpLabel: panelText('asrApiKeyHelp.howToGet'),
      settingsLabel: panelText('asrApiKeyHelp.openSettings'),
      closeLabel: panelText('asrApiKeyHelp.close'),
      helpAction: 'show-asr-api-key-guide',
      settingsAction: 'open-asr-api-key-settings',
      closeAction: 'close-asr-config-alert',
    });
  }
  function _0x39ca5c() {
    return _0x5a18c5({
      alert: _0x810e66,
      className: 'audio-voice-translation-config-alert',
      helpLabel: panelText('translationApiKeyHelp.howToGet'),
      settingsLabel: panelText('translationApiKeyHelp.openSettings'),
      closeLabel: panelText('translationApiKeyHelp.close'),
      helpAction: 'show-translation-api-key-guide',
      settingsAction: 'open-translation-api-key-settings',
      closeAction: 'close-translation-config-alert',
    });
  }
  function _0x22037f() {
    const _0x3777f6 = getAudioVoiceAsrProviderOptions();
    _0x3a0686 = normalizeAudioVoiceAsrProvider(_0x3a0686);
    const _0x3a6532 = _0x3777f6['find']((_0x1f2ec0) => _0x1f2ec0['id'] === _0x3a0686) || _0x3777f6[0x0],
      _0x4717cc = _0x3a6532?.['label'] || '',
      _0x399ea5 = panelText('actions.subtitleRecognitionWithName', { provider: _0x4717cc }),
      _0x1653f3 = createEl('div', 'audio-voice-asr-settings'),
      _0x47ae82 = createEl('button', 'audio-voice-asr-settings-btn');
    ((_0x47ae82['type'] = 'button'),
      (_0x47ae82['title'] = _0x399ea5),
      _0x47ae82['setAttribute']('aria-label', _0x399ea5),
      _0x47ae82['append'](
        createAudioVoiceModelIcon(_0x3a6532 || {}, 'audio-voice-global-model-trigger-icon'),
        createEl('span', 'audio-voice-btn-label audio-voice-global-model-trigger-label', _0x399ea5),
      ),
      (_0x47ae82['dataset']['audioVoiceAction'] = 'toggle-asr-settings'));
    const _0x39cf40 = createEl('div', 'audio-voice-asr-settings-menu');
    return (
      _0x39cf40['appendChild'](
        createEl('div', 'audio-voice-global-settings-title', panelText('settings.subtitleRecognition')),
      ),
      _0x3777f6['forEach']((_0x100683) => {
        const _0x4c162e = createEl('button', 'audio-voice-global-model-item');
        ((_0x4c162e['type'] = 'button'),
          (_0x4c162e['dataset']['audioVoiceAction'] = 'select-asr-provider'),
          (_0x4c162e['dataset']['providerId'] = _0x100683['id']));
        if (_0x100683['id'] === _0x3a0686) _0x4c162e['classList']['add']('is-active');
        const _0x23d9c0 = createAudioVoiceModelIcon(_0x100683, 'audio-voice-global-model-provider'),
          _0xcda7cb = createEl('span', 'audio-voice-global-model-body');
        (_0xcda7cb['append'](
          createEl('span', 'audio-voice-global-model-name', _0x100683['label'] || _0x100683['id']),
          createEl('span', 'audio-voice-global-model-subtitle', _0x100683['subtitle'] || _0x100683['id']),
        ),
          _0x4c162e['append'](_0x23d9c0, _0xcda7cb),
          _0x39cf40['appendChild'](_0x4c162e));
      }),
      _0x1653f3['append'](_0x47ae82, _0x39cf40),
      _0x1653f3
    );
  }
  function _0x24ea4b() {
    const _0x63c208 = getAudioVoicePanelModelOptions(),
      _0x173086 = getAudioVoicePanelModelGroups();
    (!_0x4fc784 || !_0x63c208['some']((_0x5e8be2) => _0x5e8be2['id'] === _0x4fc784)) &&
      (_0x4fc784 = getDefaultAudioVoiceModelId());
    const _0x374e4b =
        _0x63c208['find']((_0x59a969) => _0x59a969['id'] === _0x4fc784) || _0x63c208[0x0] || null,
      _0x3e21e1 = _0x374e4b?.['label'] || panelText('settings.noModels'),
      _0x5d8c21 = panelText('actions.globalModelWithName', { model: _0x3e21e1 }),
      _0x50f107 = createEl('div', 'audio-voice-global-settings'),
      _0x2f0f61 = createEl('button', 'audio-voice-global-settings-btn');
    ((_0x2f0f61['type'] = 'button'),
      (_0x2f0f61['title'] = _0x5d8c21),
      _0x2f0f61['setAttribute']('aria-label', _0x5d8c21),
      _0x2f0f61['append'](
        createAudioVoiceModelIcon(_0x374e4b || {}, 'audio-voice-global-model-trigger-icon'),
        createEl('span', 'audio-voice-btn-label audio-voice-global-model-trigger-label', _0x5d8c21),
      ),
      (_0x2f0f61['dataset']['audioVoiceAction'] = 'toggle-global-settings'));
    const _0x40349a = createEl('div', 'audio-voice-global-settings-menu'),
      _0x51101b = (_0x1ee913) => {
        const _0x50eae4 = createEl('button', 'audio-voice-global-model-item floating-menu-item');
        ((_0x50eae4['type'] = 'button'),
          (_0x50eae4['dataset']['audioVoiceAction'] = 'select-global-model'),
          (_0x50eae4['dataset']['modelId'] = _0x1ee913['id']));
        if (_0x1ee913['id'] === _0x4fc784) _0x50eae4['classList']['add']('is-active');
        const _0x58f0f9 = createAudioVoiceModelIcon(_0x1ee913, 'audio-voice-global-model-provider'),
          _0x4ce183 = createEl('span', 'audio-voice-global-model-body fmi-content');
        return (
          _0x4ce183['append'](
            createEl(
              'span',
              'audio-voice-global-model-name fmi-title',
              _0x1ee913['label'] || _0x1ee913['id'],
            ),
            createEl(
              'span',
              'audio-voice-global-model-subtitle fmi-sub',
              _0x1ee913['subtitle'] || _0x1ee913['id'],
            ),
          ),
          _0x50eae4['append'](_0x58f0f9, _0x4ce183),
          _0x1ee913['vip'] &&
            _0x50eae4['appendChild'](createEl('span', 'audio-voice-global-model-vip', 'VIP')),
          _0x50eae4
        );
      };
    return (
      _0x63c208['length']
        ? _0x173086['forEach']((_0x499e4c) => {
            const _0x4d4e4a = createEl('div', 'audio-voice-global-model-group'),
              _0x32926d = createEl(
                'button',
                'audio-voice-global-model-item audio-voice-global-model-group-trigger floating-menu-item',
              );
            ((_0x32926d['type'] = 'button'), _0x32926d['setAttribute']('aria-haspopup', 'menu'));
            _0x499e4c['items']['some']((_0x4aff20) => _0x4aff20['id'] === _0x4fc784) &&
              _0x32926d['classList']['add']('is-active');
            const _0x2dbbc3 = createAudioVoiceModelIcon(_0x499e4c, 'audio-voice-global-model-provider'),
              _0x8c5f64 = createEl('span', 'audio-voice-global-model-body fmi-content');
            (_0x8c5f64['append'](
              createEl(
                'span',
                'audio-voice-global-model-name\x20fmi-title',
                _0x499e4c['label'] || _0x499e4c['id'],
              ),
              createEl(
                'span',
                'audio-voice-global-model-subtitle\x20fmi-sub',
                _0x499e4c['subtitle'] || _0x499e4c['id'],
              ),
            ),
              _0x32926d['append'](
                _0x2dbbc3,
                _0x8c5f64,
                createEl('span', 'audio-voice-global-model-caret', '>'),
              ));
            const _0x757422 = createEl('div', 'audio-voice-global-model-submenu');
            ((_0x757422['dataset']['audioVoiceGlobalModelPortal'] = 'true'),
              _0x499e4c['items']['forEach']((_0x41b2fb) => _0x757422['appendChild'](_0x51101b(_0x41b2fb))),
              _0x4d4e4a['appendChild'](_0x32926d),
              _0x2f6fa4['appendChild'](_0x757422),
              bindAudioVoiceModelSubmenuPosition(_0x4d4e4a, _0x757422, windowObject, {
                container: _0x2f6fa4,
              }),
              _0x40349a['appendChild'](_0x4d4e4a));
          })
        : _0x40349a['appendChild'](
            createEl('div', 'audio-voice-global-settings-empty', panelText('settings.noModels')),
          ),
      _0x50f107['append'](_0x2f0f61, _0x40349a),
      _0x50f107
    );
  }
  function _0x31ec88() {
    const _0x2e7867 = panelText('actions.loadSelected'),
      { sourceActive: _0x4ff666 } = _0x30ed43['getSnapshot'](),
      _0x38660b = document['createElement']('template');
    _0x38660b['innerHTML'] = createPromptAttachmentButtonHTML({
      tooltip: _0x2e7867,
      stroke: _0x4ff666 ? 'var(--blue)' : 'var(--text-primary)',
      circleFill: _0x4ff666 ? 'var(--blue)' : 'var(--text-primary)',
    })['trim']();
    const _0x5279ed = _0x38660b['content']['firstElementChild'],
      _0x89bb2a = createEl('button', 'audio-voice-video-pick-btn agent-connect-btn prompt-attachment-btn');
    return (
      (_0x89bb2a['type'] = 'button'),
      (_0x89bb2a['title'] = _0x2e7867),
      _0x89bb2a['setAttribute']('aria-label', _0x2e7867),
      (_0x89bb2a['dataset']['audioVoiceAction'] = 'load-selected'),
      _0x89bb2a['classList']['toggle']('is-picking', _0x4ff666),
      _0x89bb2a['classList']['toggle']('is-connecting-active', _0x4ff666),
      _0x89bb2a['setAttribute']('aria-pressed', _0x4ff666 ? 'true' : 'false'),
      (_0x89bb2a['disabled'] = _0x4ca78c()),
      _0x5279ed?.['innerHTML'] && (_0x89bb2a['innerHTML'] = _0x5279ed['innerHTML']),
      _0x89bb2a
    );
  }
  function _0x29802e() {
    const _0x555115 = createEl('section', 'audio-voice-hero'),
      _0x2c34f7 = createEl('div', 'audio-voice-hero-cover'),
      _0x46c154 = _0x207e98 ? resolveAudioVoicePanelCoverUrl(_0x207e98) : '';
    if (_0x46c154) {
      const _0x5bfa88 = createEl('img', 'audio-voice-hero-img');
      ((_0x5bfa88['src'] = _0x46c154),
        (_0x5bfa88['alt'] = getSourceName(_0x207e98)),
        (_0x5bfa88['draggable'] = ![]),
        _0x2c34f7['appendChild'](_0x5bfa88));
    } else _0x2c34f7['innerHTML'] = iconSvg(isAudioVoiceAudioNode(_0x207e98) ? 'audio' : 'video');
    const _0x632822 = createEl('div', 'audio-voice-hero-body');
    _0x632822['append'](
      createEl('div', 'audio-voice-hero-name', getSourceName(_0x207e98 || {})),
      createEl(
        'div',
        'audio-voice-hero-meta',
        _0x207e98 ? getSourceMeta(_0x207e98) : panelText('source.emptyMeta'),
      ),
      createEl('div', 'audio-voice-hero-status', _0x6b5d46()),
    );
    const _0x4852d5 = createEl('div', 'audio-voice-hero-actions'),
      _0x41120b = createButton(
        'audio-voice-analyze-btn',
        panelText('actions.startAnalyzeTooltip'),
        'generate',
        _0x28dfe5 === 'analyzing' ? panelText('status.analyzing') : panelText('actions.startAnalyze'),
      );
    ((_0x41120b['dataset']['audioVoiceAction'] = 'start-analyze'),
      (_0x41120b['disabled'] = _0x28dfe5 === 'analyzing' || _0x4ca78c() || _0x34fe12['hasPending']()),
      _0x4852d5['append'](_0x22037f(), _0x41120b));
    if (!embedded) _0x555115['appendChild'](_0x31ec88());
    return (_0x555115['append'](_0x2c34f7, _0x632822, _0x4852d5), _0x555115);
  }
  function _0x1665c1(_0x20be4d = '') {
    const _0x254f55 = getAudioVoiceTranslationLanguage(_0x20be4d);
    if (!_0x254f55) return null;
    return { ..._0x254f55, label: panelText('translation.languages.' + _0x254f55['labelKey']) };
  }
  function _0x29971e() {
    return resolveAudioVoiceTranslationTargets(_0x5d4fd6, _0x511db2);
  }
  function _0x2ed955() {
    return (
      _0x28dfe5 === 'ready' &&
      _0x29971e()['targets']['length'] > 0x0 &&
      !_0x4ca78c() &&
      !_0x17c39e &&
      !_0x222157 &&
      !_0x34fe12['hasPending']() &&
      !getVisibleAudioVoiceSegments(_0x5d4fd6)['some']((_0x2fc3c8) => _0x2fc3c8['status'] === 'generating')
    );
  }
  function _0x24fb96() {
    const _0x466e9e = _0x4ca78c(),
      _0x57061b = createEl('div', 'audio-voice-translation-settings'),
      _0x397a91 = createButton(
        'audio-voice-toolbar-btn audio-voice-translation-btn',
        panelText('actions.translateTooltip'),
        _0x466e9e ? 'loading' : 'translate',
        _0x466e9e ? panelText('status.translating') : panelText('actions.translate'),
      );
    ((_0x397a91['dataset']['audioVoiceAction'] = 'toggle-translation'),
      (_0x397a91['dataset']['loading'] = String(_0x466e9e)),
      _0x397a91['classList']['toggle']('is-translating', _0x466e9e),
      _0x397a91['setAttribute']('aria-haspopup', 'menu'),
      _0x397a91['setAttribute']('aria-expanded', 'false'),
      _0x397a91['setAttribute']('aria-busy', String(_0x466e9e)),
      (_0x397a91['disabled'] = !_0x2ed955()));
    const _0x271d9d = createEl('div', 'audio-voice-translation-menu');
    return (
      _0x271d9d['setAttribute']('role', 'menu'),
      _0x271d9d['setAttribute']('aria-label', panelText('translation.menuLabel')),
      AUDIO_VOICE_TRANSLATION_LANGUAGES['forEach']((_0x9833df) => {
        const _0x5866ac = _0x1665c1(_0x9833df['id']),
          _0x4ba461 = createEl(
            'button',
            'audio-voice-menu-item\x20audio-voice-translation-language',
            _0x5866ac?.['label'] || _0x9833df['name'],
          );
        ((_0x4ba461['type'] = 'button'),
          _0x4ba461['setAttribute']('role', 'menuitem'),
          (_0x4ba461['dataset']['audioVoiceAction'] = 'translate-language'),
          (_0x4ba461['dataset']['languageId'] = _0x9833df['id']),
          _0x271d9d['appendChild'](_0x4ba461));
      }),
      _0x57061b['append'](_0x397a91, _0x271d9d),
      _0x57061b
    );
  }
  function _0x2d5651() {
    const _0x12905b = createEl('div', 'audio-voice-toolbar'),
      _0x17a3bc = _0x4227fb(),
      _0x204419 = createEl('div', 'audio-voice-toolbar-primary');
    ([
      [
        'select-all',
        _0x17a3bc ? panelText('toolbar.cancelSelectAll') : panelText('toolbar.selectAll'),
        'grid',
      ],
    ]['forEach'](([_0x5537d8, _0x3cd1b2, _0x50daa7]) => {
      const _0x2f8cc4 = createButton('audio-voice-toolbar-btn', _0x3cd1b2, _0x50daa7, _0x3cd1b2);
      ((_0x2f8cc4['dataset']['audioVoiceAction'] = _0x5537d8),
        _0x5537d8 === 'select-all' &&
          (_0x2f8cc4['classList']['toggle']('is-active', _0x17a3bc),
          _0x2f8cc4['setAttribute']('aria-pressed', _0x17a3bc ? 'true' : 'false'),
          (_0x2f8cc4['disabled'] = _0x34fe12['hasPending']())),
        _0x204419['appendChild'](_0x2f8cc4));
    }),
      _0x204419['appendChild'](_0x24fb96()),
      _0x12905b['appendChild'](_0x204419));
    const _0x3a5dd7 = _0x26a394();
    if (_0x3a5dd7) _0x12905b['appendChild'](_0x3a5dd7);
    return _0x12905b;
  }
  function _0x4227fb() {
    const _0x50efa1 = getVisibleAudioVoiceSegments(_0x5d4fd6);
    return _0x50efa1['length'] > 0x0 && _0x50efa1['every']((_0x22306e) => _0x511db2['has'](_0x22306e['id']));
  }
  function _0x131311() {
    return getVisibleAudioVoiceSegments(_0x5d4fd6)['filter']((_0x56374b) =>
      _0x511db2['has'](_0x56374b['id']),
    );
  }
  function _0x443c01() {
    const _0xd18fb7 = _0x131311(),
      _0x36a5a1 = _0xd18fb7['length'] > 0x0 ? _0xd18fb7 : getVisibleAudioVoiceSegments(_0x5d4fd6);
    return _0x36a5a1['filter']((_0xf720fc) => _0xf720fc['status'] !== 'generating');
  }
  function _0x450288(_0x49ca63 = []) {
    const _0x3022e9 = Array['isArray'](_0x49ca63) ? _0x49ca63 : [],
      _0x569578 = _0x3022e9['map']((_0x3a1fc7) => {
        const _0x4a6ec6 = _0x3f3bda(_0x3a1fc7) || {},
          _0x1b9ee5 = _0x4a6ec6['provider'] || 'runninghubwf',
          _0x2fba43 = String(_0x1b9ee5)['trim']()['toLowerCase'](),
          _0x30fb6a = String(_0x4a6ec6['adapterType'] || 'workflow')
            ['trim']()
            ['toLowerCase'](),
          _0x371aa5 =
            _0x2fba43 === 'runninghubwf' || (_0x2fba43 === 'runninghub' && _0x30fb6a === 'workflow'),
          _0x33ac54 = getProviderConfig(_0x1b9ee5) || {};
        return resolveAudioVoiceProviderBatchConcurrency(
          _0x33ac54,
          { provider: _0x1b9ee5, adapterType: _0x30fb6a },
          _0x371aa5 ? _0x3022e9['length'] : 0x1,
        );
      }),
      _0x5b5e6f = _0x569578['filter'](
        (_0x5787ed) => Number['isFinite'](Number(_0x5787ed)) && Number(_0x5787ed) > 0x0,
      );
    if (_0x5b5e6f['length'] <= 0x0) return 0x1;
    return normalizeAudioVoiceBatchConcurrencyLimit(Math['min'](..._0x5b5e6f), 0x1);
  }
  function _0x520dd7() {
    return _0x28dfe5 === 'ready' && getVisibleAudioVoiceSegments(_0x5d4fd6)['length'] > 0x0;
  }
  function _0x30c0e1(_0x14ccde = buildAudioVoiceComposeTimelineClips(_0x5d4fd6)) {
    const _0x470de5 = resolveAudioVoiceSourceLocalPath(_0x207e98 || {});
    if (!_0x470de5 || _0x14ccde['length'] < 0x1) return '';
    return JSON['stringify']({
      sourceNodeId: _0x2826aa,
      sourceLocalPath: _0x470de5,
      durationSec: resolveAudioVoiceComposeDurationSec(_0x207e98, _0x5d4fd6),
      clips: _0x14ccde,
    });
  }
  function _0x26a394() {
    _0x2f6fa4['querySelectorAll']?.('[data-audio-voice-global-model-portal="true"]')?.['forEach'](
      (_0x2195ef) => _0x2195ef['remove'](),
    );
    if (!_0x520dd7()) return null;
    const _0x240a4e = createEl('div', 'audio-voice-batch-actions'),
      _0x7bf770 = _0x131311()['length'] > 0x0,
      _0x158b1c = _0x7bf770 ? panelText('actions.selectedGenerate') : panelText('actions.batchGenerate'),
      _0xa3fd7f = _0x7bf770
        ? panelText('actions.selectedGenerateTooltip')
        : panelText('actions.batchGenerateTooltip'),
      _0x8fd1fc = Boolean(_0x17c39e),
      _0x1a5e3e = Boolean(_0x1d44da?.['isRequested']?.()),
      _0x31adfa = createButton(
        'audio-voice-batch-action-btn\x20audio-voice-batch-generate-btn',
        _0x8fd1fc ? panelText('actions.stopBatchGeneration') : _0xa3fd7f,
        _0x8fd1fc ? 'loading' : 'generateAction',
        _0x8fd1fc
          ? _0x1a5e3e
            ? panelText('status.stopping')
            : panelText('actions.stopBatchGeneration')
          : _0x158b1c,
      );
    ((_0x31adfa['dataset']['audioVoiceAction'] = _0x8fd1fc ? 'cancel-batch-generation' : 'batch-generate'),
      (_0x31adfa['dataset']['loading'] = String(_0x8fd1fc)),
      _0x31adfa['setAttribute']('aria-busy', String(_0x8fd1fc)),
      (_0x31adfa['disabled'] =
        _0x1a5e3e ||
        (!_0x8fd1fc && Boolean(_0x222157)) ||
        _0x4ca78c() ||
        _0x34fe12['hasPending']() ||
        (!_0x8fd1fc && _0x443c01()['length'] <= 0x0)));
    const _0x3f5c23 = buildAudioVoiceComposeTimelineClips(_0x5d4fd6),
      _0x5e8954 = Boolean(_0x222157),
      _0x1d7750 = !_0x5e8954 && _0x4d4071 !== '' && _0x4d4071 === _0x30c0e1(_0x3f5c23),
      _0x46adeb = createButton(
        'audio-voice-batch-action-btn audio-voice-compose-btn',
        _0x5e8954
          ? panelText('status.composing')
          : _0x1d7750
            ? panelText('actions.recomposeTooltip')
            : panelText('actions.composeAllTooltip'),
        _0x5e8954 ? 'loading' : _0x1d7750 ? 'check' : 'merge',
        _0x5e8954
          ? panelText('status.composing')
          : _0x1d7750
            ? panelText('status.composed')
            : panelText('actions.composeAll'),
      );
    return (
      (_0x46adeb['dataset']['audioVoiceAction'] = 'compose-all'),
      (_0x46adeb['dataset']['loading'] = String(_0x5e8954)),
      _0x46adeb['classList']['toggle']('is-composing', _0x5e8954),
      _0x46adeb['classList']['toggle']('is-composed', _0x1d7750),
      _0x46adeb['setAttribute']('aria-busy', String(_0x5e8954)),
      (_0x46adeb['disabled'] =
        _0x5e8954 || _0x4ca78c() || _0x34fe12['hasPending']() || _0x3f5c23['length'] < 0x1),
      _0x240a4e['append'](_0x24ea4b(), _0x2a6edc(), _0x31adfa, _0x46adeb),
      _0x240a4e
    );
  }
  function _0x40e64f() {
    const _0x3dfe69 = getAudioVoicePanelModelOptions(),
      _0x118d4d = _0x3dfe69['find']((_0x3ff24f) => _0x3ff24f['id'] === _0x4fc784) || _0x3dfe69[0x0] || null;
    return [
      _0x520dd7() ? 'show' : 'hide',
      _0x28dfe5,
      panelText('actions.batchGenerate'),
      panelText('actions.selectedGenerate'),
      panelText('actions.composeAll'),
      _0x4fc784,
      _0x118d4d?.['label'] || '',
      _0x118d4d?.['icon'] || '',
      _0x118d4d?.['iconAlt'] || '',
      _0x17c39e ? 'generating' : 'idle',
      _0x222157 ? 'composing' : 'idle',
      _0x4ca78c() ? 'translating' : 'translation-idle',
      _0x34fe12['getOperations']()
        ['map']((_0x23aa5a) => _0x23aa5a['segmentIds']['join'](','))
        ['join']('|'),
      _0x131311()
        ['map']((_0x4b2680) => _0x4b2680['id'])
        ['join'](','),
      getVisibleAudioVoiceSegments(_0x5d4fd6)
        ['map'](
          (_0x599bd6) =>
            _0x599bd6['id'] +
            ':' +
            _0x599bd6['status'] +
            ':' +
            _0x599bd6['activeAudio'] +
            ':' +
            (_0x599bd6['convertedAudioReady'] ? 0x1 : 0x0),
        )
        ['join'](','),
      _0x30ed43['getSnapshot']()['audioSegmentId'],
    ]['join']('\x1f');
  }
  function _0x45787b() {
    const _0x533ba7 = getAudioVoiceAsrProviderOptions(),
      _0x16120b = _0x533ba7['find']((_0x5f68b2) => _0x5f68b2['id'] === _0x3a0686) || _0x533ba7[0x0] || null;
    return [
      _0x2826aa,
      _0x207e98 ? getSourceName(_0x207e98) : '',
      _0x207e98 ? getSourceMeta(_0x207e98) : panelText('source.emptyMeta'),
      _0x207e98 ? resolveAudioVoicePanelCoverUrl(_0x207e98) : '',
      _0x28dfe5,
      _0x6b5d46(),
      _0x3a0686,
      _0x16120b?.['label'] || '',
      _0x16120b?.['icon'] || '',
      _0x16120b?.['iconAlt'] || '',
      _0x30ed43['getSnapshot']()['sourceActive'] ? '1' : '0',
      _0x4ca78c() ? 'translating' : 'translation-idle',
    ]['join']('\x1f');
  }
  function _0x5d52f7() {
    const _0x300a11 = _0x45787b();
    if (_0x41ebf3 && _0x3882e0 === _0x300a11) return _0x41ebf3;
    return ((_0x3882e0 = _0x300a11), (_0x41ebf3 = _0x29802e()), _0x41ebf3);
  }
  function _0x1be488() {
    return [
      panelText('toolbar.selectAll'),
      panelText('toolbar.cancelSelectAll'),
      panelText('actions.translate'),
      panelText('actions.translateTooltip'),
      panelText('status.translating'),
      AUDIO_VOICE_TRANSLATION_LANGUAGES['map']((_0x27af80) =>
        panelText('translation.languages.' + _0x27af80['labelKey']),
      )['join'](','),
      _0x4227fb() ? 'all' : 'partial',
      _0x34fe12['getProjectedVisibleSegments']()['length'],
      _0x4ca78c() ? 'translating' : 'translation-idle',
      _0x40e64f(),
    ]['join']('\x1f');
  }
  function _0x14707d() {
    const _0x3ebc74 = _0x1be488();
    if (_0x3fa9c9 && _0x22de4b === _0x3ebc74) return _0x3fa9c9;
    return ((_0x22de4b = _0x3ebc74), (_0x3fa9c9 = _0x2d5651()), _0x3fa9c9);
  }
  function _0x3c3e95(_0x43b35a) {
    const _0xbafccc = _0x43b35a['filter'](Boolean);
    _0xbafccc['forEach']((_0x32468b, _0x1e1e89) => {
      if (_0x542795['children'][_0x1e1e89] === _0x32468b) return;
      _0x542795['insertBefore'](_0x32468b, _0x542795['children'][_0x1e1e89] || null);
    });
    while (_0x542795['children']['length'] > _0xbafccc['length']) {
      _0x542795['removeChild'](_0x542795['lastElementChild']);
    }
  }
  function _0x34566b(_0xee8a56 = {}, _0xd38c40 = 0x1) {
    const _0x300f69 = resolveAudioVoiceSegmentAudioInput(_0xee8a56, _0xd38c40),
      _0x457951 = String(_0x300f69['name'] || _0x300f69['nodeId'] || '')['trim']();
    if (!_0x457951) return '+';
    const _0x19dda = _0x457951['replace'](/\.[^.\\/:]+$/, '')['trim']();
    return Array['from'](_0x19dda || _0x457951)
      ['slice'](0x0, 0x2)
      ['join']('')
      ['toUpperCase']();
  }
  function _0xb1ffb0(_0x721a88, _0x162d06) {
    const _0x25c994 = _0x5d4fd6[_0x35cecb(_0x721a88)],
      _0x569900 = String(_0x162d06 || '')['trim']();
    if (!_0x25c994 || !_0x569900) return null;
    return (
      normalizeAudioVoiceHistory(_0x25c994['convertedAudioHistory'])['find'](
        (_0x3069f3) => _0x3069f3['id'] === _0x569900,
      ) || null
    );
  }
  function _0x4217a3(_0x554f5c) {
    const _0x2cf2bc = new Date(Number(_0x554f5c || 0x0) || Date['now']()),
      _0x203dbf = (_0x15d7e9) => String(_0x15d7e9)['padStart'](0x2, '0');
    return (
      _0x203dbf(_0x2cf2bc['getMonth']() + 0x1) +
      '/' +
      _0x203dbf(_0x2cf2bc['getDate']()) +
      '\x20' +
      _0x203dbf(_0x2cf2bc['getHours']()) +
      ':' +
      _0x203dbf(_0x2cf2bc['getMinutes']())
    );
  }
  function _0x5df5ea(_0x1db306 = {}) {
    if (typeof _0x1db306['_audioVoiceConvertedRowVisible'] === 'boolean')
      return _0x1db306['_audioVoiceConvertedRowVisible'];
    return shouldShowConvertedRow(_0x1db306) || _0x58be89['has'](String(_0x1db306['id'] || ''));
  }
  function _0x5b1e5c(_0x2572c4, _0xc1955e, _0x125097, _0x49d2ba = 'converted') {
    const _0x5658d7 = createEl('textarea', 'audio-voice-line-text audio-voice-line-input');
    return (
      (_0x5658d7['rows'] = 0x1),
      (_0x5658d7['value'] = String(_0xc1955e || '')),
      (_0x5658d7['placeholder'] = String(_0x125097 || '')),
      (_0x5658d7['autocomplete'] = 'off'),
      (_0x5658d7['spellcheck'] = !![]),
      (_0x5658d7['dataset']['audioVoiceTextInput'] = 'true'),
      (_0x5658d7['dataset']['audioVoiceTextKind'] = _0x49d2ba === 'source' ? 'source' : 'converted'),
      (_0x5658d7['dataset']['segmentId'] = _0x2572c4['id']),
      _0x5658d7['setAttribute']('aria-multiline', 'true'),
      _0x5658d7['setAttribute']('aria-label', _0x125097 || panelText('actions.editSource')),
      _0x5658d7
    );
  }
  function _0x580d9f(_0x3e286d) {
    const _0x5e7816 = normalizeAudioVoiceHistory(_0x3e286d['convertedAudioHistory']),
      _0x1770a7 = createEl('div', 'audio-voice-history-wrap'),
      _0x5b411c = createButton(
        'audio-voice-icon-btn\x20audio-voice-history-trigger',
        panelText('actions.history'),
        'history',
      );
    ((_0x5b411c['dataset']['audioVoiceAction'] = 'toggle-history'),
      (_0x5b411c['dataset']['segmentId'] = _0x3e286d['id']),
      (_0x5b411c['disabled'] = _0x5e7816['length'] <= 0x0));
    if (_0x5b411c['disabled']) _0x5b411c['setAttribute']('aria-disabled', 'true');
    const _0x5bc204 = createEl('div', 'audio-voice-history-menu');
    return (
      _0x5e7816['length'] <= 0x0
        ? _0x5bc204['appendChild'](createEl('div', 'audio-voice-history-empty', panelText('history.empty')))
        : _0x5e7816['forEach']((_0x1edde2, _0x4db348) => {
            const _0x43bb5c = createEl('div', 'audio-voice-history-item'),
              _0x21cd6c = createButton('audio-voice-history-play', panelText('history.play'), 'play');
            ((_0x21cd6c['dataset']['audioVoiceAction'] = 'play-history'),
              (_0x21cd6c['dataset']['segmentId'] = _0x3e286d['id']),
              (_0x21cd6c['dataset']['historyId'] = _0x1edde2['id']));
            const _0xb75362 = createEl('button', 'audio-voice-history-main');
            ((_0xb75362['type'] = 'button'),
              (_0xb75362['dataset']['audioVoiceAction'] = 'use-history'),
              (_0xb75362['dataset']['segmentId'] = _0x3e286d['id']),
              (_0xb75362['dataset']['historyId'] = _0x1edde2['id']),
              _0xb75362['append'](
                createEl(
                  'span',
                  'audio-voice-history-title',
                  _0x1edde2['modelLabel'] || panelText('history.itemTitle', { index: _0x4db348 + 0x1 }),
                ),
                createEl('span', 'audio-voice-history-meta', _0x4217a3(_0x1edde2['createdAt'])),
              ),
              _0x43bb5c['append'](_0x21cd6c, _0xb75362),
              _0x5bc204['appendChild'](_0x43bb5c));
          }),
      _0x1770a7['append'](_0x5b411c, _0x5bc204),
      _0x1770a7
    );
  }
  function _0x447c65(_0x4880d2, _0x4f5e6c) {
    const _0x28b4bf = _0x4f5e6c === 'converted',
      _0x278131 = createEl(
        'div',
        'audio-voice-audio-line ' +
          (_0x28b4bf ? 'audio-voice-audio-line-converted' : 'audio-voice-audio-line-source'),
      );
    !_0x28b4bf &&
      _0x5df5ea(_0x4880d2) &&
      _0x278131['classList']['add']('audio-voice-audio-line-source-has-draft');
    const _0x43a346 =
        _0x28b4bf && !_0x4880d2['convertedAudioReady']
          ? panelText('actions.generateAudio')
          : panelText('actions.playAudio'),
      _0x3973ac = createButton('audio-voice-line-play', _0x43a346, 'speaker');
    ((_0x3973ac['dataset']['audioVoiceAction'] = _0x28b4bf ? 'play-converted' : 'play-source'),
      (_0x3973ac['dataset']['segmentId'] = _0x4880d2['id']));
    const _0xde1995 = _0x5df5ea(_0x4880d2);
    let _0x164886 = null;
    if (_0x28b4bf && !_0x4880d2['error'])
      _0x164886 = _0x5b1e5c(
        _0x4880d2,
        _0x4880d2['targetText'] || _0x4880d2['sourceText'],
        panelText('sentences.convertedPlaceholder'),
        'converted',
      );
    else {
      if (!_0x28b4bf && !_0xde1995)
        _0x164886 = _0x5b1e5c(
          _0x4880d2,
          _0x4880d2['sourceText'],
          panelText('sentences.sourcePlaceholder'),
          'source',
        );
      else {
        const _0x49d9ca = _0x28b4bf
          ? _0x4880d2['targetText'] || _0x4880d2['sourceText'] || panelText('sentences.convertedPlaceholder')
          : _0x4880d2['sourceText'] || panelText('sentences.sourcePlaceholder');
        _0x164886 = createEl('span', 'audio-voice-line-text', _0x49d9ca);
      }
    }
    const _0x421b34 = createEl('div', 'audio-voice-line-actions');
    if (_0x28b4bf) {
      const _0x2b1933 = createButton(
        'audio-voice-icon-btn audio-voice-generate-btn',
        panelText('actions.generate'),
        'generate',
      );
      ((_0x2b1933['dataset']['audioVoiceAction'] = 'generate'),
        (_0x2b1933['dataset']['segmentId'] = _0x4880d2['id']),
        _0x5411de(_0x2b1933, _0x4880d2),
        _0x421b34['append'](_0x580d9f(_0x4880d2), _0x2a6edc(_0x4880d2['id']), _0x2b1933));
    } else
      (_0x421b34['append'](
        createButton('audio-voice-icon-btn', panelText('actions.editSourceTooltip'), 'edit'),
        createButton('audio-voice-icon-btn', panelText('actions.alignSourceText'), 'align'),
      ),
        (_0x421b34['children'][0x0]['dataset']['audioVoiceAction'] = 'edit-source'),
        (_0x421b34['children'][0x1]['dataset']['audioVoiceAction'] = 'align-source'));
    return (
      [..._0x421b34['children']]['forEach']((_0x20c276) => {
        if (_0x20c276['matches']?.('button')) _0x20c276['dataset']['segmentId'] = _0x4880d2['id'];
      }),
      _0x278131['append'](_0x3973ac, _0x164886, _0x421b34),
      _0x278131
    );
  }
  function _0x5033d2(_0x2c3c0d = {}) {
    const _0x20e2cd = String(_0x2c3c0d['error'] || '')['trim']();
    if (!_0x20e2cd) return null;
    const _0x52b308 = createEl('div', 'audio-voice-segment-error', _0x20e2cd);
    return (
      _0x52b308['setAttribute']('role', 'status'),
      _0x52b308['setAttribute']('aria-live', 'polite'),
      _0x52b308
    );
  }
  function _0x2f0e12(_0x177728) {
    const _0x2d6d0b = createEl('div', 'audio-voice-more-wrap');
    if (_0x2f4cdf(_0x177728)) {
      const _0x341a81 = createEl(
        'button',
        'audio-voice-imitate-tone-btn ' + (_0x177728['imitateToneEnabled'] ? 'is-active' : ''),
        panelText('actions.imitateTone'),
      );
      ((_0x341a81['type'] = 'button'),
        (_0x341a81['title'] = panelText('actions.imitateToneTooltip')),
        _0x341a81['setAttribute']('aria-label', _0x341a81['title']),
        (_0x341a81['dataset']['audioVoiceAction'] = 'toggle-imitate-tone'),
        (_0x341a81['dataset']['segmentId'] = _0x177728['id']),
        _0x341a81['setAttribute']('aria-pressed', _0x177728['imitateToneEnabled'] ? 'true' : 'false'),
        _0x2d6d0b['appendChild'](_0x341a81));
    }
    const _0x187350 =
        _0x177728['voiceModelSelectionMode'] === 'global'
          ? ''
          : String(_0x177728['voiceModelId'] || '')['trim'](),
      _0x2b7d46 = _0x187350
        ? getAudioVoicePanelModelOptions()['find']((_0x447fe2) => _0x447fe2['id'] === _0x187350)
        : null;
    if (_0x2b7d46) {
      const _0x17f7a8 = createEl(
        'span',
        'audio-voice-segment-model-badge',
        _0x2b7d46['label'] || _0x2b7d46['id'],
      );
      ((_0x17f7a8['title'] = panelText('actions.segmentModelWithName', {
        model: _0x2b7d46['label'] || _0x2b7d46['id'],
      })),
        _0x2d6d0b['appendChild'](_0x17f7a8));
    }
    const _0xadda4f = createButton('audio-voice-more-trigger', panelText('actions.more'), 'more');
    ((_0xadda4f['dataset']['audioVoiceAction'] = 'toggle-menu'),
      (_0xadda4f['dataset']['segmentId'] = _0x177728['id']));
    const _0x142e49 = renderAudioVoiceSegmentInlineMenu({
      segmentId: _0x177728['id'],
      entries: getAudioVoiceSegmentMenuEntries(_0x177728),
      modelOptions: getAudioVoicePanelModelOptions(),
      selectedModelId: _0x187350,
      text: panelText,
      windowObject: windowObject,
    });
    return (_0x2d6d0b['append'](_0xadda4f, _0x142e49), _0x2d6d0b);
  }
  function _0x50e6e9(_0x358a6c) {
    const _0x2c9a20 = resolveAudioVoiceSegmentAudioInput(_0x358a6c, 0x2),
      _0x4888cb = createEl('div', 'audio-voice-audio-param-wrap'),
      _0x6aaee9 = createEl('button', 'audio-voice-audio-param');
    _0x6aaee9['type'] = 'button';
    const _0x556be4 = !!_0x2c9a20['audioUrl'];
    _0x4888cb['classList']['toggle']('has-audio-ref', _0x556be4);
    const _0x4e6163 = _0x30ed43['getSnapshot']()['audioTargetSegmentIds']['includes'](_0x358a6c['id']);
    (_0x6aaee9['classList']['toggle']('has-audio-ref', _0x556be4),
      _0x6aaee9['classList']['toggle']('is-picking', _0x4e6163),
      (_0x6aaee9['title'] = _0x556be4
        ? panelText('actions.changeVoiceCloneInputParam')
        : panelText('actions.voiceCloneInputParam')),
      _0x6aaee9['setAttribute']('aria-label', _0x6aaee9['title']),
      (_0x6aaee9['dataset']['audioVoiceAction'] = 'audio-param'),
      (_0x6aaee9['dataset']['segmentId'] = _0x358a6c['id']));
    const _0x548394 = createEl(
      'span',
      _0x556be4 ? 'audio-voice-audio-param-avatar' : 'audio-voice-audio-param-plus',
      _0x2c9a20['imageUrl'] ? '' : _0x34566b(_0x358a6c, 0x2),
    );
    if (_0x2c9a20['imageUrl']) {
      const _0x3525d4 = createEl('img', 'audio-voice-audio-param-image');
      ((_0x3525d4['src'] = _0x2c9a20['imageUrl']),
        (_0x3525d4['alt'] = _0x2c9a20['name'] || panelText('actions.voiceCloneInputParam')),
        (_0x3525d4['draggable'] = ![]),
        _0x548394['appendChild'](_0x3525d4));
    }
    (_0x6aaee9['appendChild'](_0x548394), _0x4888cb['appendChild'](_0x6aaee9));
    if (_0x556be4) {
      const _0x4de632 = createButton(
        'audio-voice-audio-param-clear',
        panelText('actions.clearVoiceCloneInputParam'),
        'close',
      );
      ((_0x4de632['dataset']['audioVoiceAction'] = 'clear-audio-param'),
        (_0x4de632['dataset']['segmentId'] = _0x358a6c['id']),
        _0x4888cb['appendChild'](_0x4de632));
    }
    return _0x4888cb;
  }
  function _0x2f29fb(_0x3812f8) {
    const _0x4cec4f = createEl('div', 'audio-voice-audio-param-stack');
    return (_0x4cec4f['appendChild'](_0x50e6e9(_0x3812f8)), _0x4cec4f);
  }
  function _0x2e8d02(_0x237be5 = {}) {
    return _0x5ac370['has'](String(_0x237be5?.['id'] || _0x237be5 || '')['trim']());
  }
  function _0x278666(_0x5b63f7 = {}) {
    const _0x3ca787 = String(_0x5b63f7?.['id'] || _0x5b63f7 || '')['trim']();
    return Boolean(_0x3ca787 && _0x17489b?.['segmentIds']?.['has']?.(_0x3ca787));
  }
  function _0x16e983(_0x1b943f = panelText('status.generating')) {
    const _0xe0bc69 = createEl('div', 'audio-voice-segment-loading storyboard-script-loading-overlay');
    return (
      _0xe0bc69['setAttribute']('role', 'status'),
      _0xe0bc69['setAttribute']('aria-live', 'polite'),
      _0xe0bc69['append'](
        createEl('span', 'storyboard-script-loading-spinner'),
        createEl('span', 'storyboard-script-loading-label', _0x1b943f),
        (() => {
          const _0x38698b = createEl('span', 'storyboard-script-loading-bar');
          return (
            _0x38698b['appendChild'](createEl('span', 'storyboard-script-loading-bar-fill')),
            _0x38698b
          );
        })(),
      ),
      _0xe0bc69
    );
  }
  function _0x476f46(_0x2d79fc) {
    _0x2d79fc?.['querySelectorAll']?.('button, input, textarea, select, [role="button"]')?.['forEach'](
      (_0xb7d508) => {
        if ('disabled' in _0xb7d508) _0xb7d508['disabled'] = !![];
        _0xb7d508['setAttribute']?.('aria-disabled', 'true');
        if (_0xb7d508['hasAttribute']?.('tabindex')) _0xb7d508['tabIndex'] = -0x1;
      },
    );
  }
  function _0x581eb5(_0x50ee8f, _0x560c01, _0xab9fa3) {
    const _0x2dadce = createEl('article', 'audio-voice-segment-card');
    ((_0x2dadce['dataset']['segmentId'] = _0x50ee8f['id']),
      _0x2dadce['classList']['add']('is-' + (_0x50ee8f['status'] || 'detected')));
    const _0x15f301 = _0x2e8d02(_0x50ee8f),
      _0x506147 = _0x34fe12['isMerging'](_0x50ee8f),
      _0x96a813 = _0x278666(_0x50ee8f);
    (_0x2dadce['classList']['toggle']('is-composing', _0x15f301 || _0x506147),
      _0x2dadce['classList']['toggle']('is-translating', _0x96a813),
      _0x2dadce['setAttribute'](
        'aria-busy',
        String(_0x50ee8f['status'] === 'generating' || _0x15f301 || _0x506147 || _0x96a813),
      ));
    const _0x22e3e8 = _0x511db2['has'](_0x50ee8f['id']);
    if (_0x22e3e8) _0x2dadce['classList']['add']('is-selected');
    _0x2dadce['setAttribute']('aria-selected', _0x22e3e8 ? 'true' : 'false');
    _0x25be96?.['ids']?.['has']?.(_0x50ee8f['id']) &&
      _0x2dadce['classList']['add']('is-' + _0x25be96['type'] + '-animation');
    const _0x2a9df3 = createEl('div', 'audio-voice-segment-time-row');
    ((_0x2a9df3['dataset']['audioVoiceAction'] = 'toggle-select'),
      (_0x2a9df3['dataset']['segmentId'] = _0x50ee8f['id']),
      _0x2a9df3['setAttribute']('role', 'button'),
      (_0x2a9df3['tabIndex'] = 0x0),
      _0x2a9df3['append'](
        createEl(
          'div',
          'audio-voice-segment-time',
          formatAudioVoiceTimeRange(_0x50ee8f['startMs'], _0x50ee8f['endMs']),
        ),
        _0x2f0e12(_0x50ee8f),
      ));
    const _0xd1e22f = createEl('div', 'audio-voice-segment-body'),
      _0x5a70af = createEl('div', 'audio-voice-segment-lines');
    _0x5a70af['appendChild'](_0x447c65(_0x50ee8f, 'source'));
    shouldShowConvertedRow(_0x50ee8f) && _0x5a70af['appendChild'](_0x447c65(_0x50ee8f, 'converted'));
    (_0xd1e22f['append'](_0x2f29fb(_0x50ee8f), _0x5a70af), _0x2dadce['append'](_0x2a9df3, _0xd1e22f));
    const _0x494761 = _0x5033d2(_0x50ee8f);
    if (_0x494761) _0x2dadce['appendChild'](_0x494761);
    (_0x50ee8f['status'] === 'generating' || _0x15f301 || _0x506147 || _0x96a813) &&
      _0x2dadce['appendChild'](
        _0x16e983(
          _0x506147
            ? panelText('status.merging')
            : _0x96a813
              ? panelText('status.translating')
              : _0x15f301
                ? panelText('status.composing')
                : _0x50ee8f['rhStatusMessage'] || panelText('status.generating'),
        ),
      );
    if (_0x506147) _0x476f46(_0x2dadce);
    return _0x2dadce;
  }
  function _0x55da61(_0x4d594e, _0x50613d, _0x533a22, _0x17f140) {
    const _0x5eeff6 = createButton('audio-voice-gap-pill', _0x50613d, _0x533a22, _0x50613d);
    return (
      (_0x5eeff6['dataset']['audioVoiceAction'] = _0x4d594e),
      (_0x5eeff6['dataset']['segmentId'] = _0x17f140),
      _0x5eeff6
    );
  }
  function _0x2c48fc(_0x2bf2a4, _0x14c553, _0x38ad64) {
    const _0x1dec6a = createEl('div', 'audio-voice-segment-gap-actions');
    _0x1dec6a['dataset']['segmentId'] = _0x2bf2a4['id'];
    if (_0x14c553 >= _0x38ad64['length'] - 0x1) _0x1dec6a['classList']['add']('is-last');
    if (_0x14c553 < _0x38ad64['length'] - 0x1) {
      const _0x4f2d3b = _0x55da61('merge', panelText('actions.merge'), 'merge', _0x2bf2a4['id']);
      ((_0x4f2d3b['disabled'] =
        _0x34fe12['isReserved'](_0x2bf2a4) || _0x34fe12['isReserved'](_0x38ad64[_0x14c553 + 0x1])),
        _0x1dec6a['appendChild'](_0x4f2d3b));
    }
    const _0x402902 = _0x55da61('insert', panelText('actions.insertSegment'), 'insert', _0x2bf2a4['id']);
    return (
      (_0x402902['disabled'] = _0x34fe12['isReserved'](_0x2bf2a4)),
      _0x1dec6a['appendChild'](_0x402902),
      _0x1dec6a
    );
  }
  function _0x19cb08() {
    const _0x14747b = createEl('section', 'audio-voice-workspace'),
      _0x1d76e3 = createEl('div', 'audio-voice-workspace-title-row');
    _0x1d76e3['append'](
      createEl('div', 'audio-voice-workspace-title', panelText('sections.sentences')),
      createEl('div', 'audio-voice-workspace-count', _0x6b5d46()),
    );
    const _0x4b8512 = createEl('div', 'audio-voice-segment-list'),
      _0x5501d9 = _0x34fe12['getProjectedVisibleSegments']();
    return (
      _0x5501d9['length']
        ? _0x5501d9['forEach']((_0x5c04c7, _0x300998) => {
            (_0x4b8512['appendChild'](_0x581eb5(_0x5c04c7, _0x300998, _0x5501d9['length'])),
              _0x4b8512['appendChild'](_0x2c48fc(_0x5c04c7, _0x300998, _0x5501d9)));
          })
        : _0x4b8512['appendChild'](
            createEl(
              'div',
              'audio-voice-segment-empty',
              _0x207e98 ? panelText('sentences.analysisHint') : panelText('source.emptyMeta'),
            ),
          ),
      _0x14747b['append'](_0x1d76e3, _0x4b8512),
      _0x14747b
    );
  }
  function _0x2f3430() {
    const _0x2bbe56 = [_0x5d52f7()],
      _0x2841fd = _0x731c21();
    if (_0x2841fd) _0x2bbe56['push'](_0x2841fd);
    const _0x1dfbf4 = _0x39ca5c();
    if (_0x1dfbf4) _0x2bbe56['push'](_0x1dfbf4);
    const _0x64256e = _0x3d24ab();
    if (_0x64256e) _0x2bbe56['push'](_0x64256e);
    (_0x2bbe56['push'](_0x14707d(), _0x19cb08()), _0x3c3e95(_0x2bbe56), _0x307694(), (_0x25be96 = null));
  }
  function _0x55f267() {
    let _0x31b0c8 = 0x0;
    return (
      _0x2f6fa4['querySelectorAll']('.audio-voice-segment-card[data-segment-id]')['forEach']((_0x3be468) => {
        const _0x2b25bb = String(_0x3be468['dataset']['segmentId'] || '')['trim']();
        if (!_0x2b25bb) return;
        _0x31b0c8 += 0x1;
        const _0x4bc356 = _0x511db2['has'](_0x2b25bb);
        (_0x3be468['classList']['toggle']('is-selected', _0x4bc356),
          _0x3be468['setAttribute']('aria-selected', _0x4bc356 ? 'true' : 'false'));
      }),
      _0x31b0c8 > 0x0
    );
  }
  function _0x1e6ffc(_0x98042c, _0x480b55) {
    if (!_0x98042c || !_0x480b55 || _0x98042c === _0x480b55) return !![];
    if (!_0x98042c['isConnected']) return ![];
    return (_0x98042c['replaceWith'](_0x480b55), !![]);
  }
  function _0x3c94d5() {
    const _0x2eecde = _0x3fa9c9,
      _0x4dd81a = _0x14707d();
    return _0x1e6ffc(_0x2eecde, _0x4dd81a);
  }
  function _0x4d9b33() {
    const _0x528960 = _0x2f6fa4['querySelector']?.('.audio-voice-analysis-progress'),
      _0x4d7d12 = _0x3d24ab();
    if (_0x528960 && _0x4d7d12) return (_0x528960['replaceWith'](_0x4d7d12), !![]);
    if (!_0x528960 && !_0x4d7d12) return !![];
    return (_0x2f3430(), ![]);
  }
  function _0x159881() {
    const _0x5612fb = _0x55f267(),
      _0x5c350a = _0x3c94d5();
    (!_0x5612fb || !_0x5c350a) && _0x2f3430();
  }
  function _0x5abe5b() {
    const _0x4dbe2f = _0x41ebf3;
    _0x3882e0 = '';
    const _0x53fb9c = _0x5d52f7();
    !_0x1e6ffc(_0x4dbe2f, _0x53fb9c) && _0x2f3430();
  }
  function _0x17b35c() {
    let _0x40e7d4 = !![];
    getVisibleAudioVoiceSegments(_0x5d4fd6)['forEach']((_0x5d2f65) => {
      if (!_0x51df4f(_0x5d2f65['id'])) _0x40e7d4 = ![];
    });
    if (!_0x40e7d4) _0x2f3430();
    return _0x40e7d4;
  }
  function _0x596c4c(_0xa55aef) {
    (_0x2f6fa4['classList']['toggle']('is-open', _0xa55aef),
      _0x2f6fa4['setAttribute']('aria-hidden', _0xa55aef ? 'false' : 'true'));
    if (!embedded) document?.['body']?.['classList']?.['toggle']('audio-voice-panel-open', _0xa55aef);
    (_0x31f254['classList']['toggle']('is-audio-voice-open', _0xa55aef),
      !embedded &&
        dispatchWebPreviewPanelSync(_0xa55aef ? 'audio-voice-panel-open' : 'audio-voice-panel-close'));
  }
  function _0x2a7137(_0x164b67 = null) {
    const _0x1648b8 = windowObject?.['isModelAllowedBySubscription'];
    if (
      typeof _0x1648b8 === 'function' &&
      _0x1648b8(AUDIO_VOICE_STUDIO_VIP_MODEL_ID, AUDIO_VOICE_STUDIO_VIP_PROVIDER)
    )
      return !![];
    return (
      typeof windowObject?.['openSubscriptionDialog'] === 'function'
        ? windowObject['openSubscriptionDialog']({
            modelId: AUDIO_VOICE_STUDIO_VIP_MODEL_ID,
            provider: AUDIO_VOICE_STUDIO_VIP_PROVIDER,
            onSuccess: _0x164b67,
          })
        : windowObject?.['showToast']?.(panelText('vip.needAuthorization'), 'warn'),
      ![]
    );
  }
  function _0x3fb90d(_0x7cfc8 = {}) {
    if (_0x7cfc8['skipSubscriptionGate'] !== !![]) {
      const _0x488516 = _0x2a7137(() => {
        _0x3fb90d({ ..._0x7cfc8, skipSubscriptionGate: !![] });
      });
      if (!_0x488516) return ![];
    }
    const _0xe3f788 = getStateSnapshot(_0x6aa227);
    return (
      _0x77f56['clear'](),
      _0x30ed43['stopAll'](),
      _0x30d3f8(resolveAudioVoicePanelOpenSourceNode(_0xe3f788, _0x7cfc8, _0x2826aa), { markLastUsed: !![] }),
      _0x596c4c(!![]),
      !![]
    );
  }
  function _0x5cb6e2() {
    (_0x3b587b({ markLastUsed: !![] }),
      _0x5aca2b(),
      void _0x2e64ce['invalidate'](),
      _0x507df3['invalidateAll'](),
      (_0x222157 = null),
      (_0x5ac370 = new Set()),
      _0x77f56['clear'](),
      _0x30ed43['stopAll'](),
      _0x105473['clear'](),
      closeVolcengineSpeechApiKeyGuide(),
      closeProviderApiKeyGuide(),
      _0x1a532c['close'](),
      _0x596c4c(![]),
      _0x1b22f3());
  }
  function _0x17ad93() {
    if (_0x2f6fa4['classList']['contains']('is-open')) {
      _0x5cb6e2();
      return;
    }
    _0x3fb90d();
  }
  function _0x2d0101(_0x466fbe, { persist: persist = ![] } = {}) {
    const _0x3371dd = clampAudioVoicePanelWidth(_0x466fbe);
    document?.['body']?.['style']?.['setProperty']?.('--audio-voice-panel-width', _0x3371dd + 'px');
    if (persist) writeStoredPanelWidth(_0x3371dd, windowObject);
    return _0x3371dd;
  }
  function _0x25f697(_0x25d8b1) {
    (_0x25d8b1['preventDefault']?.(), _0x25d8b1['stopPropagation']?.());
    const _0x5842e8 = Number(_0x25d8b1['clientX']),
      _0x2e93a4 = _0x2f6fa4['getBoundingClientRect']?.()['width'] || _0x2f6fa4['offsetWidth'] || 0x0;
    if (!Number['isFinite'](_0x5842e8) || !_0x2e93a4) return;
    document?.['body']?.['classList']?.['add']?.('audio-voice-panel-resizing');
    const _0x1c7c20 = (_0x30d42c) => {
        const _0x2c85a7 = Number(_0x30d42c['clientX']);
        if (!Number['isFinite'](_0x2c85a7)) return;
        _0x2d0101(_0x2e93a4 + (_0x5842e8 - _0x2c85a7));
      },
      _0x1232de = (_0x2d2c2a) => {
        (document?.['removeEventListener']?.('pointermove', _0x1c7c20),
          document?.['removeEventListener']?.('pointerup', _0x1232de),
          document?.['body']?.['classList']?.['remove']?.('audio-voice-panel-resizing'));
        const _0x3543fa = Number(_0x2d2c2a['clientX']);
        Number['isFinite'](_0x3543fa) && _0x2d0101(_0x2e93a4 + (_0x5842e8 - _0x3543fa), { persist: !![] });
      };
    (document?.['addEventListener']?.('pointermove', _0x1c7c20),
      document?.['addEventListener']?.('pointerup', _0x1232de));
  }
  function _0x35cecb(_0x3fb077) {
    return _0x5d4fd6['findIndex']((_0x2e4600) => _0x2e4600['id'] === _0x3fb077);
  }
  function _0x4d9d46(_0x2e4723, _0x291432) {
    _0x3ae613(
      _0x5d4fd6['map']((_0x343a1e) =>
        _0x343a1e['id'] === _0x2e4723 ? { ..._0x343a1e, ..._0x291432 } : _0x343a1e,
      ),
    );
  }
  function _0x32d68d(_0x6babc1, _0x3155cb) {
    const _0x1181d0 = _0x35cecb(_0x6babc1);
    if (_0x1181d0 < 0x0) return null;
    const _0x3560b7 = { ..._0x5d4fd6[_0x1181d0], ..._0x3155cb };
    return (
      (_0x5d4fd6 = _0x5d4fd6['map']((_0xfa784f, _0x3b86f3) =>
        _0x3b86f3 === _0x1181d0 ? _0x3560b7 : _0xfa784f,
      )),
      _0x3b587b(),
      _0x3560b7
    );
  }
  function _0x523a94(_0x458fb9) {
    const _0x5958f4 = String(_0x458fb9 || '')['trim']();
    if (!_0x5958f4) return null;
    return (
      [..._0x2f6fa4['querySelectorAll']('.audio-voice-segment-card[data-segment-id]')]['find'](
        (_0x5c6647) => _0x5c6647['dataset']['segmentId'] === _0x5958f4,
      ) || null
    );
  }
  function _0x51df4f(_0x1988a1) {
    const _0x370a4a = _0x5d4fd6[_0x35cecb(_0x1988a1)],
      _0x160c09 = _0x523a94(_0x1988a1),
      _0xa1ac0e = _0x160c09?.['querySelector']?.('.audio-voice-more-wrap');
    if (!_0x370a4a || !_0xa1ac0e) return ![];
    return (_0xa1ac0e['replaceWith'](_0x2f0e12(_0x370a4a)), !![]);
  }
  function _0x29cc44(_0x418633) {
    const _0x166b3a = _0x5d4fd6[_0x35cecb(_0x418633)],
      _0x4835b9 = _0x523a94(_0x418633),
      _0x4efe2a = _0x4835b9?.['querySelector']?.('.audio-voice-audio-param-wrap');
    if (!_0x166b3a || !_0x4efe2a) return ![];
    return (_0x4efe2a['replaceWith'](_0x50e6e9(_0x166b3a)), !![]);
  }
  function _0x302448(_0x59c11d = []) {
    const _0x779d09 = [
      ...new Set(
        (Array['isArray'](_0x59c11d) ? _0x59c11d : [_0x59c11d])
          ['map']((_0x166990) => String(_0x166990 || '')['trim']())
          ['filter'](Boolean),
      ),
    ];
    let _0x4b2e30 = _0x3c94d5();
    _0x779d09['forEach']((_0x168029) => {
      if (!_0x29cc44(_0x168029)) _0x4b2e30 = ![];
      if (!_0x51df4f(_0x168029)) _0x4b2e30 = ![];
    });
    if (!_0x4b2e30) _0x2f3430();
    return _0x4b2e30;
  }
  function _0x4a1b13(_0x5c3106, _0x3105bb = {}) {
    const _0x2aadde = _0x5c3106?.['querySelector']?.('[data-audio-voice-text-input]');
    if (!_0x2aadde) return ![];
    const _0xea657a = String(_0x3105bb['targetText'] || _0x3105bb['sourceText'] || '');
    return (
      _0x2aadde !== document?.['activeElement'] &&
        _0x2aadde['value'] !== _0xea657a &&
        (_0x2aadde['value'] = _0xea657a),
      (_0x2aadde['dataset']['segmentId'] = _0x3105bb['id']),
      !![]
    );
  }
  function _0x463415(_0x3821cd, _0x5b7da7 = {}, _0x21e4f2 = {}) {
    const _0xfd4873 = _0x3821cd?.['querySelector']?.('.audio-voice-segment-lines');
    if (!_0xfd4873) return ![];
    let _0x329ea0 = _0xfd4873['querySelector']('.audio-voice-audio-line-source');
    const _0x47a442 = _0x5df5ea(_0x5b7da7),
      _0x49430b = _0x5df5ea(_0x21e4f2);
    if (_0x329ea0 && _0x47a442 !== _0x49430b)
      (_0x329ea0['replaceWith'](_0x447c65(_0x21e4f2, 'source')),
        (_0x329ea0 = _0xfd4873['querySelector']('.audio-voice-audio-line-source')));
    else _0x329ea0 && _0x329ea0['classList']['toggle']('audio-voice-audio-line-source-has-draft', _0x49430b);
    const _0x2ec160 = _0xfd4873['querySelector']('.audio-voice-audio-line-converted');
    if (!_0x49430b) return (_0x2ec160?.['remove']?.(), !![]);
    if (!_0x2ec160) {
      const _0xadc48d = _0x447c65(_0x21e4f2, 'converted');
      return (_0xadc48d['classList']['add']('is-entering'), _0xfd4873['appendChild'](_0xadc48d), !![]);
    }
    const _0x4a4592 =
      !!String(_0x5b7da7['error'] || '')['trim']() !== !!String(_0x21e4f2['error'] || '')['trim']();
    if (!_0x47a442 || _0x4a4592) return (_0x2ec160['replaceWith'](_0x447c65(_0x21e4f2, 'converted')), !![]);
    if (!_0x4a1b13(_0x2ec160, _0x21e4f2))
      return (_0x2ec160['replaceWith'](_0x447c65(_0x21e4f2, 'converted')), !![]);
    const _0x55e5e2 = _0x2ec160['querySelector']('.audio-voice-history-wrap');
    if (_0x55e5e2) _0x55e5e2['replaceWith'](_0x580d9f(_0x21e4f2));
    const _0x49e2bb = _0x2ec160['querySelector']('.audio-voice-generate-btn');
    if (_0x49e2bb) _0x5411de(_0x49e2bb, _0x21e4f2);
    const _0xf81569 = _0x2ec160['querySelector']('.audio-voice-line-play');
    if (_0xf81569) {
      const _0x3afb0a = _0x21e4f2['convertedAudioReady']
        ? panelText('actions.playAudio')
        : panelText('actions.generateAudio');
      ((_0xf81569['title'] = _0x3afb0a), _0xf81569['setAttribute']('aria-label', _0x3afb0a));
    }
    return !![];
  }
  function _0x4ffe49(_0x1691e7, _0x13c39c = {}) {
    const _0x272d46 = [..._0x1691e7['children']]['find']((_0x152f8a) =>
        _0x152f8a['classList']?.['contains']?.('audio-voice-segment-loading'),
      ),
      _0x205dde = _0x2e8d02(_0x13c39c),
      _0xc68fbc = _0x34fe12['isMerging'](_0x13c39c),
      _0x5cb4fc = _0x278666(_0x13c39c);
    (_0x1691e7['classList']?.['toggle']?.('is-composing', _0x205dde || _0xc68fbc),
      _0x1691e7['classList']?.['toggle']?.('is-translating', _0x5cb4fc),
      _0x1691e7['setAttribute']?.(
        'aria-busy',
        String(_0x13c39c['status'] === 'generating' || _0x205dde || _0xc68fbc || _0x5cb4fc),
      ));
    if (_0x13c39c['status'] === 'generating' || _0x205dde || _0xc68fbc || _0x5cb4fc) {
      const _0x233ac4 = _0xc68fbc
        ? panelText('status.merging')
        : _0x5cb4fc
          ? panelText('status.translating')
          : _0x205dde
            ? panelText('status.composing')
            : _0x13c39c['rhStatusMessage'] || panelText('status.generating');
      if (!_0x272d46) _0x1691e7['appendChild'](_0x16e983(_0x233ac4));
      else {
        const _0x45d19b = _0x272d46['querySelector']?.('.storyboard-script-loading-label');
        if (_0x45d19b && _0x45d19b['textContent'] !== _0x233ac4) _0x45d19b['textContent'] = _0x233ac4;
      }
      return;
    }
    _0x272d46?.['remove']?.();
  }
  function _0x1f7053(_0x18e34c, _0x4d99ef = {}) {
    const _0xe0e75d = [..._0x18e34c['children']]['find']((_0x3c6fcc) =>
        _0x3c6fcc['classList']?.['contains']?.('audio-voice-segment-error'),
      ),
      _0x57a599 = String(_0x4d99ef['error'] || '')['trim']();
    if (!_0x57a599) {
      _0xe0e75d?.['remove']?.();
      return;
    }
    if (_0xe0e75d) {
      if (_0xe0e75d['textContent'] !== _0x57a599) _0xe0e75d['textContent'] = _0x57a599;
      return;
    }
    const _0x40aac9 = _0x5033d2(_0x4d99ef);
    if (!_0x40aac9) return;
    const _0x384ad1 = [..._0x18e34c['children']]['find']((_0x267897) =>
      _0x267897['classList']?.['contains']?.('audio-voice-segment-body'),
    );
    if (_0x384ad1?.['parentNode'] === _0x18e34c && _0x384ad1['nextSibling']) {
      _0x18e34c['insertBefore'](_0x40aac9, _0x384ad1['nextSibling']);
      return;
    }
    _0x18e34c['appendChild'](_0x40aac9);
  }
  function _0x3935ed(_0x1d2a26 = {}, _0x2d866d = {}) {
    return (
      hasSegmentConvertedAudio(_0x1d2a26) !== hasSegmentConvertedAudio(_0x2d866d) ||
      isSegmentUsingConvertedAudio(_0x1d2a26) !== isSegmentUsingConvertedAudio(_0x2d866d) ||
      String(_0x1d2a26['voiceModelId'] || '') !== String(_0x2d866d['voiceModelId'] || '') ||
      String(_0x1d2a26['voiceRefAudioUrl'] || '') !== String(_0x2d866d['voiceRefAudioUrl'] || '') ||
      String(_0x1d2a26['voiceRefAudioLocalPath'] || '') !==
        String(_0x2d866d['voiceRefAudioLocalPath'] || '') ||
      (_0x1d2a26['imitateToneEnabled'] === !![]) !== (_0x2d866d['imitateToneEnabled'] === !![])
    );
  }
  function _0x127966(_0x3ab698, _0x317920 = {}, _0x4b1f07 = {}, { syncToolbar: syncToolbar = !![] } = {}) {
    const _0xd44c1f = _0x523a94(_0x3ab698);
    if (!_0xd44c1f || !_0x4b1f07) return ![];
    const _0x1fb126 = 'is-' + (_0x317920['status'] || 'detected'),
      _0x340743 = 'is-' + (_0x4b1f07['status'] || 'detected');
    _0x1fb126 !== _0x340743 &&
      (_0xd44c1f['classList']['remove'](_0x1fb126), _0xd44c1f['classList']['add'](_0x340743));
    const _0x1cf4dd = _0x511db2['has'](_0x3ab698);
    (_0xd44c1f['classList']['toggle']('is-selected', _0x1cf4dd),
      _0xd44c1f['setAttribute']('aria-selected', _0x1cf4dd ? 'true' : 'false'));
    if (!_0x463415(_0xd44c1f, _0x317920, _0x4b1f07)) return ![];
    (_0x1f7053(_0xd44c1f, _0x4b1f07), _0x4ffe49(_0xd44c1f, _0x4b1f07));
    if (_0x3935ed(_0x317920, _0x4b1f07)) {
      if (!_0x51df4f(_0x3ab698)) return ![];
    }
    return syncToolbar ? _0x3c94d5() : !![];
  }
  function _0x5b864e(_0x14cb55 = []) {
    let _0x1c2439 = _0x3c94d5();
    [...new Set(_0x14cb55['map']((_0x58aa16) => String(_0x58aa16 || '')['trim']())['filter'](Boolean))][
      'forEach'
    ]((_0xaebaac) => {
      const _0x5e841b = _0x5d4fd6[_0x35cecb(_0xaebaac)],
        _0xc3ddad = _0x523a94(_0xaebaac);
      if (!_0x5e841b || !_0xc3ddad) {
        _0x1c2439 = ![];
        return;
      }
      _0x4ffe49(_0xc3ddad, _0x5e841b);
    });
    if (!_0x1c2439) _0x2f3430();
    return _0x1c2439;
  }
  function _0x3dca31(_0xedcac0 = []) {
    let _0x8b8949 = _0x3c94d5();
    ([...new Set(_0xedcac0['map']((_0x4a1168) => String(_0x4a1168 || '')['trim']())['filter'](Boolean))][
      'forEach'
    ]((_0x4af1aa) => {
      const _0x1d63a0 = _0x5d4fd6[_0x35cecb(_0x4af1aa)],
        _0x4fd9bf = _0x523a94(_0x4af1aa);
      if (!_0x1d63a0 || !_0x4fd9bf) {
        _0x8b8949 = ![];
        return;
      }
      _0x4ffe49(_0x4fd9bf, _0x1d63a0);
    }),
      _0x5abe5b());
    if (!_0x8b8949) _0x2f3430();
    return _0x8b8949;
  }
  function _0x214f2b(_0xf04ac2, _0x444b15 = []) {
    let _0x561a70 = !![];
    [...new Set(_0x444b15['map']((_0x5ee249) => String(_0x5ee249 || '')['trim']())['filter'](Boolean))][
      'forEach'
    ]((_0x356303) => {
      const _0x3681cc = _0xf04ac2['get'](_0x356303),
        _0x20ec41 = _0x5d4fd6[_0x35cecb(_0x356303)];
      (!_0x3681cc || !_0x20ec41 || !_0x127966(_0x356303, _0x3681cc, _0x20ec41, { syncToolbar: ![] })) &&
        (_0x561a70 = ![]);
    });
    if (!_0x3c94d5()) _0x561a70 = ![];
    if (!_0x561a70) _0x2f3430();
    return _0x561a70;
  }
  function _0x3ebc37(_0x1f8c3c, _0xf6971a) {
    const _0x3d60cf = _0x5d4fd6[_0x35cecb(_0x1f8c3c)],
      _0x2e0dc1 = _0x32d68d(_0x1f8c3c, _0xf6971a);
    if (!_0x2e0dc1) return null;
    if (!_0x127966(_0x1f8c3c, _0x3d60cf, _0x2e0dc1)) _0x2f3430();
    return _0x2e0dc1;
  }
  function _0x2f4cdf(_0x2d97b9 = {}) {
    return (
      isAudioVoiceImitateToneWorkflow(_0x3f3bda(_0x2d97b9)?.['id']) &&
      !!resolveAudioVoiceSegmentAudioInput(_0x2d97b9, 0x2)['audioUrl']
    );
  }
  function _0x2c4c90(_0x1c9558) {
    const _0x53e669 = String(_0x1c9558 || '')['trim']();
    if (!_0x53e669) return [];
    const _0x1d2756 =
      _0x511db2['has'](_0x53e669) && _0x511db2['size'] > 0x1
        ? getVisibleAudioVoiceSegments(_0x5d4fd6)
            ['filter']((_0x3e0110) => _0x511db2['has'](_0x3e0110['id']))
            ['map']((_0x2e64a9) => _0x2e64a9['id'])
        : [_0x53e669];
    return _0x1d2756['filter']((_0x4b2e50) => {
      const _0x467ef2 = _0x5d4fd6[_0x35cecb(_0x4b2e50)];
      return _0x2f4cdf(_0x467ef2);
    });
  }
  function _0x39bfc0(_0x34964d, _0x2d3333) {
    const _0xe8b37c = _0x2c4c90(_0x34964d);
    if (_0xe8b37c['length'] <= 0x0) return ![];
    const _0xafadd1 = new Set(_0xe8b37c);
    ((_0x5d4fd6 = _0x5d4fd6['map']((_0x58c60b) =>
      _0xafadd1['has'](_0x58c60b['id'])
        ? { ..._0x58c60b, imitateToneEnabled: _0x2d3333 === !![], error: '' }
        : _0x58c60b,
    )),
      _0x3b587b());
    let _0x1fa377 = !![];
    _0xe8b37c['forEach']((_0x1dd06e) => {
      if (!_0x51df4f(_0x1dd06e)) _0x1fa377 = ![];
    });
    if (!_0x1fa377) _0x2f3430();
    return !![];
  }
  function _0x538df6(_0x539da3) {
    if (!_0x539da3) return;
    const _0x1616f1 = new Set(_0x511db2);
    (_0x1616f1['has'](_0x539da3) ? _0x1616f1['delete'](_0x539da3) : _0x1616f1['add'](_0x539da3),
      (_0x511db2 = _0x1616f1),
      _0x159881());
  }
  function _0x2ef379(_0x50487e, _0x433469) {
    const _0x11944a = _0x35cecb(_0x50487e);
    if (_0x11944a < 0x0) return;
    const _0x3704b = _0x5d4fd6[_0x11944a],
      _0x1c3043 = { ..._0x3704b, ..._0x433469 };
    ((_0x5d4fd6 = _0x5d4fd6['map']((_0x4eecb4, _0x51b547) =>
      _0x51b547 === _0x11944a ? _0x1c3043 : _0x4eecb4,
    )),
      _0x3b587b(),
      !_0x127966(_0x50487e, _0x3704b, _0x1c3043) && _0x2f3430());
  }
  function _0x355496(_0x446550, _0x536492 = []) {
    const _0x1278fb = (Array['isArray'](_0x536492) ? _0x536492 : [_0x536492])
      ['map']((_0x5ba332) => String(_0x5ba332 || '')['trim']())
      ['filter'](Boolean);
    _0x25be96 = _0x1278fb['length'] ? { type: String(_0x446550 || 'change'), ids: new Set(_0x1278fb) } : null;
  }
  function _0x307694() {
    const _0x5960e9 = _0x2ffe6d;
    if (!_0x5960e9) return;
    ((_0x2ffe6d = ''), _0x33627c(_0x5960e9, 'converted'));
  }
  function _0x33627c(_0x1e23fc, _0xdeb92a = 'converted') {
    const _0x128097 = String(_0x1e23fc || '')['trim']();
    if (!_0x128097) return ![];
    const _0x1d5215 =
      [..._0x2f6fa4['querySelectorAll']('[data-audio-voice-text-input]')]['find'](
        (_0x2bbd6b) =>
          _0x2bbd6b['dataset']['segmentId'] === _0x128097 &&
          (!_0xdeb92a || _0x2bbd6b['dataset']['audioVoiceTextKind'] === _0xdeb92a),
      ) || null;
    if (!_0x1d5215) return ![];
    _0x1d5215['focus']?.();
    const _0x219df0 = String(_0x1d5215['value'] || '')['length'];
    return (_0x1d5215['setSelectionRange']?.(_0x219df0, _0x219df0), !![]);
  }
  function _0xb75e33(_0x721432, _0xf9ec46 = {}) {
    const _0x33df89 = String(_0x721432 || '')['trim'](),
      _0x1c40c2 = _0x35cecb(_0x33df89);
    if (_0x1c40c2 < 0x0) return ![];
    const _0x5f3285 = _0x5d4fd6[_0x1c40c2],
      _0x4b3cc6 = _0x5df5ea(_0x5f3285);
    _0x58be89['add'](_0x33df89);
    const _0x92ec05 = { ..._0x5f3285, _audioVoiceConvertedRowVisible: _0x4b3cc6 };
    if (!_0x127966(_0x33df89, _0x92ec05, _0x5f3285)) _0x2f3430();
    return (_0xf9ec46['focus'] !== ![] && _0x33627c(_0x33df89, 'converted'), !![]);
  }
  function _0x10720a(_0x2839b) {
    const _0x5ce259 = String(_0x2839b || '')['trim'](),
      _0x2444f9 = _0x35cecb(_0x5ce259);
    if (_0x2444f9 < 0x0 || !_0x58be89['has'](_0x5ce259)) return ![];
    const _0x4fe391 = _0x5d4fd6[_0x2444f9];
    if (shouldShowConvertedRow(_0x4fe391)) return ![];
    _0x58be89['delete'](_0x5ce259);
    const _0xe97497 = { ..._0x4fe391, _audioVoiceConvertedRowVisible: !![] };
    if (!_0x127966(_0x5ce259, _0xe97497, _0x4fe391)) _0x2f3430();
    return !![];
  }
  function _0x35fa61(_0x277631, _0x43f8ba = 0x1) {
    const _0x54f8ae = getVisibleAudioVoiceSegments(_0x5d4fd6),
      _0x389521 = _0x54f8ae['findIndex']((_0x7411a5) => _0x7411a5['id'] === _0x277631);
    if (_0x389521 < 0x0) return ![];
    const _0x525db9 = _0x54f8ae[_0x389521 + _0x43f8ba];
    if (!_0x525db9) return ![];
    return _0xb75e33(_0x525db9['id'], { focus: !![] });
  }
  function _0x2da5b5(_0x2f840a, _0x29505b) {
    if (!_0x29505b) return ![];
    const _0x2eb37e = String(_0x29505b['dataset']['segmentId'] || '')['trim']();
    if (!_0x2eb37e) return ![];
    if (shouldCloseAudioVoiceEmptyConvertedTextEdit(_0x2f840a, _0x29505b) && _0x10720a(_0x2eb37e))
      return (_0x2f840a['preventDefault']?.(), _0x2f840a['stopPropagation']?.(), !![]);
    if (_0x2f840a['key'] === 'Enter' && _0x29505b['dataset']['audioVoiceTextKind'] === 'source')
      return (
        _0x2f840a['preventDefault']?.(),
        _0x2f840a['stopPropagation']?.(),
        _0xb75e33(_0x2eb37e, { focus: !![] }),
        !![]
      );
    if (_0x2f840a['key'] === 'Tab') {
      const _0x5ab626 = _0x2f840a['shiftKey'] ? -0x1 : 0x1;
      if (!_0x35fa61(_0x2eb37e, _0x5ab626)) return ![];
      return (_0x2f840a['preventDefault']?.(), _0x2f840a['stopPropagation']?.(), !![]);
    }
    return ![];
  }
  function _0x19d711(_0x200a7b, _0x2e1fb9, _0x3b3b8a = 'converted') {
    const _0x3c2f7d = _0x35cecb(_0x200a7b);
    if (_0x3c2f7d < 0x0) return;
    const _0x32cb4f = _0x5d4fd6[_0x3c2f7d],
      _0x17b9cb = _0x5df5ea(_0x32cb4f),
      _0x159f0c = { ..._0x32cb4f, ...buildAudioVoiceTextEditPatch(_0x32cb4f, _0x2e1fb9) };
    _0x3b3b8a === 'converted' &&
      (shouldShowConvertedRow(_0x159f0c) ? _0x58be89['delete'](_0x200a7b) : _0x58be89['add'](_0x200a7b));
    const _0x1ba5ef = _0x17b9cb !== _0x5df5ea(_0x159f0c);
    ((_0x5d4fd6 = _0x5d4fd6['map']((_0x471234) =>
      _0x471234['id'] === _0x200a7b ? cloneAudioVoiceSegment(_0x159f0c) : _0x471234,
    )),
      _0x3b587b());
    _0x1ba5ef && (_0x2ffe6d = _0x200a7b);
    const _0x133f6d = _0x127966(
      _0x200a7b,
      { ..._0x32cb4f, _audioVoiceConvertedRowVisible: _0x17b9cb },
      _0x159f0c,
    );
    if (!_0x133f6d) {
      _0x2f3430();
      return;
    }
    _0x1ba5ef && _0x307694();
  }
  async function _0x498cb1(_0x4c7dea = {}, _0x50321b = {}, _0x34f8ae = _0x2826aa) {
    const _0x2a0f82 = Math['max'](0x0, Math['round'](Number(_0x50321b['startMs']) || 0x0)),
      _0x2eb6e1 =
        normalizeLocalPath(_0x50321b['localPath'] || '') ||
        String(_0x50321b['audioUrl'] || '')['trim']() ||
        _0x343faf,
      _0x161c7f = await enqueueElectronMediaTask(
        {
          kind: 'audioCut',
          src: _0x2eb6e1,
          nodeId: _0x34f8ae,
          args: {
            start: Math['max'](0x0, (Number(_0x4c7dea['startMs'] || 0x0) - _0x2a0f82) / 0x3e8),
            end: Math['max'](0x0, (Number(_0x4c7dea['endMs'] || 0x0) - _0x2a0f82) / 0x3e8),
          },
        },
        { wait: !![], timeout: AUDIO_CUT_TASK_TIMEOUT_MS },
      ),
      _0x396b09 = normalizeLocalPath(_0x161c7f?.['localPath'] || _0x161c7f?.['path'] || ''),
      _0x1e8b27 = firstNonEmptyString(_0x161c7f?.['url'], localPathToUrl(_0x396b09));
    if (!_0x396b09 && !_0x1e8b27) throw new Error(panelText('toasts.sourceClipFailed'));
    return { localPath: _0x396b09, audioUrl: _0x1e8b27 };
  }
  function _0x3bf6b5(_0x191d69) {
    return (
      [..._0x2f6fa4['querySelectorAll']('.audio-voice-segment-card')]['find'](
        (_0x44355d) => _0x44355d['dataset']['segmentId'] === _0x191d69,
      ) || null
    );
  }
  function _0x14c2be(_0x439690) {
    const _0x76d243 = _0x35cecb(_0x439690),
      _0x45c2c9 = _0x5d4fd6[_0x76d243];
    if (!_0x45c2c9) return;
    const _0x14331f = String(_0x2826aa || '')['trim']();
    if (!_0x343faf) {
      windowObject?.['showToast']?.(panelText('toasts.sourceClipNeedsAnalysis'), 'warn');
      return;
    }
    const _0xab39ab = _0x3bf6b5(_0x45c2c9['id']);
    if (!_0xab39ab) return;
    const _0x29bff5 = resolveAudioVoiceSourceClipEditBase(_0x45c2c9, {
      analysisSourceAudioLocalPath: _0x343faf,
      analysisSourceAudioUrl: _0xb8517e,
    });
    if (!_0x29bff5['localPath'] && !_0x29bff5['audioUrl']) {
      windowObject?.['showToast']?.(panelText('toasts.sourceClipNeedsAnalysis'), 'warn');
      return;
    }
    AudioClipController['initForSource']({
      anchorId: _0x45c2c9['id'],
      wrapperEl: _0xab39ab,
      sourceLocalPath: _0x29bff5['localPath'],
      sourceUrl: _0x29bff5['audioUrl'],
      initialStartSec: 0x0,
      initialEndSec:
        Math['max'](AUDIO_VOICE_SOURCE_CLIP_MIN_MS, Number(_0x29bff5['durationMs'] || 0x0)) / 0x3e8,
      allowSplit: !![],
      dimMode: ![],
      onConfirm: async ({
        startSec: _0x18bcb9,
        endSec: _0x9ec194,
        splitSec: _0x30abb3,
        ranges: _0x20393b,
      }) => {
        const _0x41245c = _0x507df3['begin']({
          kind: 'source-clip',
          sourceNodeId: _0x14331f,
          segmentId: _0x45c2c9['id'],
        });
        if (!_0x41245c) {
          _0x2f148b();
          return;
        }
        let _0x2dadac = null;
        try {
          const _0x1524e7 = Array['isArray'](_0x20393b)
              ? _0x20393b['map']((_0x3a9f5d) => ({
                  id: String(_0x3a9f5d?.['id'] || ''),
                  startMs:
                    _0x29bff5['startMs'] +
                    Math['round'](Math['max'](0x0, Number(_0x3a9f5d?.['startSec']) || 0x0) * 0x3e8),
                  endMs:
                    _0x29bff5['startMs'] +
                    Math['round'](Math['max'](0x0, Number(_0x3a9f5d?.['endSec']) || 0x0) * 0x3e8),
                }))['sort']((_0x4c278a, _0x4a0f53) => _0x4c278a['startMs'] - _0x4a0f53['startMs'])
              : null,
            _0x3835e2 = Array['isArray'](_0x1524e7) && _0x1524e7['length'] >= 0x2,
            _0x1552eb = _0x3835e2
              ? _0x1524e7[0x0]['startMs']
              : _0x29bff5['startMs'] + Math['round'](Math['max'](0x0, Number(_0x18bcb9) || 0x0) * 0x3e8),
            _0x49c436 = _0x3835e2
              ? _0x1524e7[_0x1524e7['length'] - 0x1]['endMs']
              : _0x29bff5['startMs'] + Math['round'](Math['max'](0x0, Number(_0x9ec194) || 0x0) * 0x3e8),
            _0x1c389a = await commitAudioVoiceSourceClipEdit(_0x45c2c9, {
              selectionStartMs: _0x1552eb,
              selectionEndMs: _0x49c436,
              rangesMs: _0x3835e2 ? _0x1524e7 : null,
              splitAtMs:
                _0x3835e2 || _0x30abb3 === undefined || _0x30abb3 === null
                  ? null
                  : _0x29bff5['startMs'] + Math['round'](Math['max'](0x0, Number(_0x30abb3) || 0x0) * 0x3e8),
              newSegmentId: _0x45c2c9['id'] + '-split-' + Date['now'](),
              editBase: _0x29bff5,
              cutRange: (_0x4a3348) => _0x498cb1(_0x4a3348, _0x29bff5, _0x14331f),
            });
          if (!_0x507df3['isCurrent'](_0x41245c, _0x2826aa)) return;
          ((_0x2dadac = []),
            _0x5d4fd6['forEach']((_0x3611fa) => {
              if (_0x3611fa['id'] !== _0x45c2c9['id']) {
                _0x2dadac['push'](_0x3611fa);
                return;
              }
              _0x2dadac['push'](..._0x1c389a);
            }));
        } finally {
          _0x507df3['finish'](_0x41245c);
        }
        (_0x3ae613(_0x2dadac),
          windowObject?.['showToast']?.(panelText('toasts.sourceClipApplied'), 'success'));
      },
    });
  }
  async function _0x323777(_0x4ea92d) {
    const _0x20214d = String(_0x4ea92d || '')['trim']();
    if (!_0x20214d) {
      windowObject?.['showToast']?.(panelText('toasts.audioMissing'), 'warn');
      return;
    }
    const _0x840daa = await _0x105473['play'](_0x20214d);
    if (_0x840daa['status'] === 'unavailable') {
      windowObject?.['showToast']?.(panelText('toasts.playUnavailable'), 'warn');
      return;
    }
    _0x840daa['status'] === 'failed' && windowObject?.['showToast']?.(panelText('toasts.playFailed'), 'warn');
  }
  function _0x1166ca(_0x437153, _0x3c6203) {
    const _0x169827 = _0x5d4fd6[_0x35cecb(_0x437153)];
    if (!_0x169827) return;
    if (_0x3c6203 === 'converted') {
      if (!_0x169827['convertedAudioReady']) {
        void _0xbc876c(_0x437153);
        return;
      }
      void _0x323777(
        resolveSegmentLocalAudioUrl(_0x169827['convertedAudioUrl'], _0x169827['convertedAudioLocalPath']),
      );
      return;
    }
    void _0x323777(
      resolveSegmentLocalAudioUrl(_0x169827['sourceAudioUrl'], _0x169827['sourceAudioLocalPath']),
    );
  }
  function _0x2fb60a(_0x1abbc7, _0xbee01e, _0x4f642e) {
    const _0x8f4b81 = _0x5d4fd6[_0x35cecb(_0x1abbc7)];
    if (!_0x8f4b81) return;
    const _0x15b6d9 = {
      segment: _0x8f4b81,
      kind: _0xbee01e,
      sourceName: getSourceName(_0x207e98 || {}),
      text: panelText,
      showToast: windowObject?.['showToast'],
    };
    if (_0x4f642e === 'download') {
      void saveAudioVoiceSegmentDownload(_0x15b6d9);
      return;
    }
    addAudioVoiceSegmentAudioToCanvas({
      ..._0x15b6d9,
      store: _0x6aa227,
      anchorNode: _0x207e98,
      windowObject: windowObject,
    });
  }
  async function _0x354626(_0x1567f4) {
    const _0x42257e = String(_0x1567f4 || '')['trim']();
    if (!_0x42257e) return { localPath: '', audioUrl: '' };
    const _0x3e28a5 = normalizeLocalPath(_0x42257e);
    if (_0x3e28a5) return { localPath: _0x3e28a5, audioUrl: localPathToUrl(_0x3e28a5) };
    const _0x341e0f = await saveRemoteAudioLocallyDetailed(_0x42257e),
      _0x4fa9be = normalizeLocalPath(
        _0x341e0f?.['localPath'] || _0x341e0f?.['originalLocalPath'] || pickResultLocalPath(_0x341e0f),
      );
    if (!_0x4fa9be) throw new Error(panelText('toasts.localSaveGeneratedFailed'));
    const _0x2414da = pickAudioDurationSec(_0x341e0f?.['audioDuration'], _0x341e0f?.['duration']);
    return {
      ...(_0x341e0f && typeof _0x341e0f === 'object' ? _0x341e0f : {}),
      localPath: _0x4fa9be,
      audioUrl: localPathToUrl(_0x4fa9be),
      ...(_0x2414da > 0x0 ? { audioDuration: _0x2414da } : {}),
    };
  }
  async function _0x5eb51d(
    _0x19e35d,
    {
      ownerSourceNodeId: ownerSourceNodeId = '',
      ownerAnalysisSourceAudioLocalPath: ownerAnalysisSourceAudioLocalPath = '',
      taskStore: taskStore = null,
      targetNodeId: targetNodeId = '',
    } = {},
  ) {
    if (!_0x19e35d?.['id']) return null;
    const _0x4cb6e8 = resolveSegmentLocalAudioUrl(
      _0x19e35d['sourceAudioUrl'],
      _0x19e35d['sourceAudioLocalPath'],
    );
    if (_0x4cb6e8 && !_0x19e35d['needsSourceAudioRecut']) return _0x19e35d;
    if (!ownerAnalysisSourceAudioLocalPath) return _0x19e35d;
    const _0x4caa14 = await enqueueElectronMediaTask(
        {
          kind: 'audioCut',
          src: ownerAnalysisSourceAudioLocalPath,
          nodeId: ownerSourceNodeId,
          args: {
            start: Math['max'](0x0, Number(_0x19e35d['startMs'] || 0x0) / 0x3e8),
            end: Math['max'](0x0, Number(_0x19e35d['endMs'] || 0x0) / 0x3e8),
          },
        },
        { wait: !![], timeout: AUDIO_CUT_TASK_TIMEOUT_MS },
      ),
      _0x5814a6 = {
        sourceAudioLocalPath: normalizeLocalPath(_0x4caa14?.['localPath'] || _0x4caa14?.['path'] || ''),
        sourceAudioUrl: firstNonEmptyString(
          _0x4caa14?.['url'],
          localPathToUrl(_0x4caa14?.['localPath'] || _0x4caa14?.['path']),
        ),
        sourceAudioReady: !![],
        needsSourceAudioRecut: ![],
      };
    return (taskStore?.['updateNodeData']?.(targetNodeId, _0x5814a6), { ..._0x19e35d, ..._0x5814a6 });
  }
  function _0x4ae56f(_0x4f40d6) {
    const _0x74fbda = _0x35cecb(_0x4f40d6);
    if (_0x74fbda < 0x0) return;
    const _0x42528a = _0x5d4fd6[_0x74fbda];
    _0x2ef379(_0x4f40d6, {
      targetText:
        _0x42528a['targetText'] ||
        (_0x42528a['sourceText'] || panelText('sentences.sourcePlaceholder')) +
          '\x20' +
          panelText('sentences.convertedSuffix'),
      convertedAudioReady: ![],
      convertedAudioDuration: 0x0,
      activeAudio: 'source',
      status: 'edited',
    });
  }
  async function _0x3ba68(
    _0x1fdf01,
    _0x1970b6,
    {
      segmentId: segmentId = '',
      modelOption: modelOption = {},
      modelId: modelId = '',
      startedAt: startedAt = 0x0,
      fallbackSegment: fallbackSegment = null,
    } = {},
  ) {
    _0x1970b6?.['updateTaskNode']?.({ rhStatusMessage: panelText('status.savingAudio') });
    const _0x1b584a = await buildAudioGenerationResultPatch(_0x1fdf01, {
      startedAt: _0x1970b6?.['startedAt'] || startedAt,
      persistAudioOutput: _0x354626,
    });
    if (!_0x1b584a?.['localPath'] && !_0x1b584a?.['audioUrl'])
      throw new Error(panelText('toasts.generateFailed'));
    const _0x41326b =
        Array['isArray'](_0x1b584a['audios']) && _0x1b584a['audios']['length']
          ? _0x1b584a['audios']
          : [_0x1b584a],
      _0x19df01 = Date['now'](),
      _0xe30801 = _0x41326b['map']((_0x40836e, _0x53a4e1) =>
        buildAudioVoiceHistoryEntry(_0x40836e, {
          id: 'audio-voice-history-' + _0x19df01 + '-' + _0x53a4e1,
          modelId: modelId,
          modelLabel: modelOption?.['label'] || modelId,
          createdAt: _0x19df01 - _0x53a4e1,
        }),
      )['filter'](Boolean),
      _0x173dc0 = _0x1970b6?.['getTaskNode']?.() || fallbackSegment || {};
    return {
      ..._0x1b584a,
      taskModelId: modelId,
      targetText: _0x173dc0['targetText'] || _0x173dc0['sourceText'],
      convertedAudioLocalPath: normalizeLocalPath(_0x1b584a['localPath'] || ''),
      convertedAudioUrl: firstNonEmptyString(
        _0x1b584a['audioUrl'],
        _0x1b584a['src'],
        localPathToUrl(_0x1b584a['localPath']),
      ),
      convertedAudioDuration: pickAudioDurationSec(_0x1b584a['audioDuration'], _0x1b584a['duration']),
      convertedAudioReady: !![],
      activeAudio: 'converted',
      status: 'ready',
      error: '',
      convertedAudioHistory: prependAudioVoiceHistoryEntries(_0x173dc0['convertedAudioHistory'], _0xe30801),
    };
  }
  function _0x2a6edc(_0x976493 = '') {
    const _0x33280b = document['createElement']('template');
    _0x33280b['innerHTML'] = renderRequestDebugButton('data-audio-voice-action=\x22debug-generation\x22');
    const _0x3a225c = _0x33280b['content']['firstElementChild'];
    return ((_0x3a225c['dataset']['segmentId'] = _0x976493), _0x3a225c);
  }
  function _0x46f8fc(_0x13adc9) {
    if (windowObject?.['DEV_MODE'] !== !![]) return;
    const _0x19433a = _0x13adc9 ? _0x5d4fd6[_0x35cecb(_0x13adc9)] : _0x443c01()[0x0];
    openDebugRequestWindow({
      windowObject: windowObject,
      title: '声音生成请求调试',
      prepare: () => {
        if (!_0x19433a) throw new Error('请先选择待生成的句子');
        const _0x3a9f58 = _0x3f3bda(_0x19433a),
          _0x4971f3 = _0x3a9f58?.['id'] || _0x4fc784;
        return buildGenerationDebugPreview({
          payload: buildAudioVoiceGeneratePayload(cloneAudioVoiceSegment(_0x19433a), _0x4971f3, {
            workflowLabel: _0x3a9f58?.['label'] || _0x4971f3,
            nodeId: _0x2826aa,
          }),
          notes: '预览当前句子（批量入口预览第一句）。尚未提取的原声音频需先完成本地处理。',
        });
      },
    });
  }
  async function _0xbc876c(_0x450710, _0x2ea8eb = {}) {
    const _0x32f688 = String(_0x2ea8eb['ownerSourceNodeId'] || _0x2826aa || '')['trim'](),
      _0xd06e64 = _0x35cecb(_0x450710);
    if (_0xd06e64 < 0x0) return { status: 'skipped' };
    const _0x22d177 = cloneAudioVoiceSegment(_0x5d4fd6[_0xd06e64]);
    if (_0x22d177['status'] === 'generating') return { status: 'skipped' };
    if (_0x144607['getRun'](_0x32f688, _0x450710)) return { status: 'skipped' };
    const _0x45ab0f = _0x2ea8eb['showResultToast'] !== ![],
      _0x45c1f8 = _0x2ea8eb['notifyCompletion'] !== ![],
      _0x57cf5a = _0x3f3bda(_0x22d177),
      _0x2b71a2 = _0x57cf5a?.['id'] || _0x4fc784,
      _0x270a0d = _0x343faf,
      _0x373aea = _0x52359a(_0x450710, _0x32f688),
      _0x2d3d71 = new AbortController(),
      _0x47cd71 = _0x144607['begin'](
        { sourceNodeId: _0x32f688, segmentId: _0x450710, targetNodeId: _0x373aea },
        { abortController: _0x2d3d71 },
      ),
      _0x4aaadf = _0x47cd71['store'];
    _0x4aaadf['updateNodeData'](_0x373aea, {
      status: 'generating',
      error: '',
      rhStatusMessage: null,
      jobStatus: 'running',
      rhTaskStatus: 'pending',
      isGenerating: !![],
    });
    try {
      const _0x1d40ee = await _0x5eb51d(_0x22d177, {
        ownerSourceNodeId: _0x32f688,
        ownerAnalysisSourceAudioLocalPath: _0x270a0d,
        taskStore: _0x4aaadf,
        targetNodeId: _0x373aea,
      });
      if (!_0x1d40ee)
        return (
          _0x4aaadf['updateNodeData'](_0x373aea, {
            status: 'edited',
            isGenerating: ![],
            jobStatus: '',
            rhTaskStatus: '',
          }),
          { status: 'failed' }
        );
      if (_0x47cd71['cancelRequested'] || !_0x144607['isCurrent'](_0x47cd71)) return { status: 'cancelled' };
      const _0xd11c43 = await resolveAudioVoiceGenerateInstallId(windowObject, _0x2b71a2);
      if (_0x47cd71['cancelRequested'] || !_0x144607['isCurrent'](_0x47cd71)) return { status: 'cancelled' };
      const _0x29ed0f = buildAudioVoiceGeneratePayload(_0x1d40ee, _0x2b71a2, {
          workflowLabel: _0x57cf5a?.['label'] || _0x2b71a2,
          nodeId: _0x32f688,
          installId: _0xd11c43,
        }),
        _0x4ba7f6 = Date['now'](),
        _0x44626b = await submitTask(
          {
            sourceNodeId: _0x32f688,
            targetNodeId: _0x373aea,
            trigger: 'audio-voice-panel',
            taskType: 'audio-generation',
            provider: _0x57cf5a?.['provider'] || 'runninghubwf',
            adapterType: _0x57cf5a?.['adapterType'] || 'workflow',
            modelId: _0x2b71a2,
            executionId: _0x57cf5a?.['executionId'] || 'runninghub.audio.' + (_0x2b71a2 || 'workflow'),
            payload: _0x29ed0f,
            cancellable: _0x57cf5a?.['cancellable'] === !![],
            resumable: !![],
            completionFeedback: ![],
            startBuilder: () => ({
              provider: _0x29ed0f['provider'],
              audioWorkflowKey: _0x29ed0f['audioWorkflowKey'],
              audioWorkflowLabel: _0x29ed0f['audioWorkflowLabel'],
              model: _0x29ed0f['audioWorkflowKey'],
              taskModelId: _0x2b71a2,
              rhInstanceType: _0x29ed0f['rhInstanceType'],
              rhTaskUseOpenapiQuery: !![],
              status: 'generating',
              error: '',
            }),
            submit: async (_0x1f405a, _0x121789) => {
              return generateAudio(_0x29ed0f, {
                signal: _0x121789['signal'] || _0x2d3d71['signal'],
                runningHubWorkflowQueueLease: _0x121789['runningHubWorkflowQueueLease'],
                onTaskId: (_0xa7cbe1) => {
                  const _0x5caed9 = String(_0xa7cbe1 || '')['trim']();
                  if (!_0x5caed9) return;
                  _0x121789['onTaskId'](_0x5caed9);
                },
                onTaskMeta: ({ taskId: _0x3fe964, useOpenapiQuery: _0x5256a4, apiKey: _0x49232a }) => {
                  const _0x2c5712 = String(_0x3fe964 || '')['trim']();
                  if (!_0x2c5712) return;
                  if (_0x49232a) _0x47cd71['apiKey'] = String(_0x49232a || '')['trim']();
                  (_0x121789['onTaskId'](_0x2c5712),
                    _0x4aaadf['updateNodeData'](_0x373aea, { rhTaskUseOpenapiQuery: _0x5256a4 === !![] }));
                },
              });
            },
            cancel: async ({ taskId: _0x273e59 }) => {
              const _0x5271cc = String(_0x47cd71['apiKey'] || _0x29ed0f?.['apiKey'] || '')['trim']();
              if (!_0x5271cc || !_0x273e59) return;
              await cancelRunningHubAudioTask({ apiKey: _0x5271cc, taskId: _0x273e59 });
            },
            resultBuilder: (_0x11d165, _0x3f10e9) =>
              _0x3ba68(_0x11d165, _0x3f10e9, {
                segmentId: _0x450710,
                modelOption: _0x57cf5a,
                modelId: _0x2b71a2,
                startedAt: _0x4ba7f6,
                fallbackSegment: _0x1d40ee,
              }),
            failureBuilder: (_0x388efa) => ({
              status: 'edited',
              error: _0x1808af(_0x388efa, panelText('toasts.generateFailed')),
              rhStatusMessage: _0x1808af(_0x388efa, panelText('toasts.generateFailed')),
            }),
            cancelledBuilder: () => ({
              status: 'edited',
              error: '',
              rhStatusMessage: panelText('toasts.generationCancelled'),
            }),
            parseError: (_0x20fe35) => _0x1808af(_0x20fe35, panelText('toasts.generateFailed')),
          },
          {
            store: _0x4aaadf,
            startedAt: _0x4ba7f6,
            abortController: _0x2d3d71,
            runningHubWorkflowConcurrency: _0x2ea8eb['runningHubWorkflowConcurrency'],
          },
        );
      if (_0x44626b['status'] === 'success')
        return (
          _0x45ab0f && windowObject?.['showToast']?.(panelText('toasts.generateComplete'), 'success'),
          _0x45c1f8 &&
            (await notifyAudioVoiceGenerationComplete(
              { total: 0x1, succeeded: 0x1, incomplete: 0x0 },
              { playSound: playCompletion, showNotification: showCompletionNotification },
            )),
          { status: 'success' }
        );
      if (_0x44626b['status'] === 'cancelled')
        return (
          _0x45ab0f && windowObject?.['showToast']?.(panelText('toasts.generationCancelled'), 'info'),
          { status: 'cancelled' }
        );
      throw _0x44626b['error'] || new Error(panelText('toasts.generateFailed'));
    } catch (_0x412cd9) {
      if (_0x47cd71['cancelRequested']) return { status: 'cancelled' };
      const _0x50cfb7 = _0x1808af(_0x412cd9, panelText('toasts.generateFailed'));
      return (
        _0x4aaadf['updateNodeData'](_0x373aea, {
          status: 'edited',
          isGenerating: ![],
          jobStatus: 'error',
          rhTaskStatus: 'failed',
          error: _0x50cfb7,
        }),
        _0x45ab0f && !_0x3cd89f(_0x412cd9) && windowObject?.['showToast']?.(_0x50cfb7, 'error'),
        { status: 'failed', error: _0x412cd9 }
      );
    } finally {
      _0x144607['finish'](_0x47cd71);
    }
  }
  async function _0x1dcb09(_0x400e49) {
    const _0x1c2c62 = String(_0x2826aa || '')['trim'](),
      _0x14c085 = _0x5d4fd6[_0x35cecb(_0x400e49)];
    if (!_0x14c085) return;
    const _0xd4ebe5 = _0x52359a(_0x400e49, _0x1c2c62),
      _0x1f695c = _0x144607['getRun'](_0x1c2c62, _0x400e49),
      _0x55127b =
        _0x1f695c ||
        _0x144607['begin']({ sourceNodeId: _0x1c2c62, segmentId: _0x400e49, targetNodeId: _0xd4ebe5 });
    if (
      !shouldAllowCancel(_0x563ba3(_0x14c085), {
        cancellable: _0x1900fb(_0x14c085),
        cancelInFlight: _0x55127b['cancelInFlight'],
      })
    ) {
      if (!_0x1f695c) _0x144607['finish'](_0x55127b);
      return;
    }
    _0x144607['setCancelInFlight'](_0x55127b, !![]);
    if (!_0x127966(_0x400e49, _0x14c085, _0x14c085)) _0x2f3430();
    try {
      (await cancelTask(_0xd4ebe5, {
        store: _0x55127b['store'],
        cancellable: !![],
        taskId: _0x14c085['rhTaskId'],
        abortLocal: !![],
        cancel: async ({ taskId: _0x396671 }) => {
          const _0x3b3f04 = _0x35150a(_0x14c085),
            _0xf1cbed = getProviderConfig(_0x3b3f04?.['provider']) || {},
            _0x291a8a = String(_0x55127b['apiKey'] || _0xf1cbed['apiKey'] || '')['trim']();
          if (!_0x291a8a || !_0x396671) return;
          await cancelRunningHubAudioTask({ apiKey: _0x291a8a, taskId: _0x396671 });
        },
        cancelledBuilder: () => ({
          status: 'edited',
          error: '',
          rhStatusMessage: panelText('toasts.generationCancelled'),
        }),
      }),
        _0x55127b['abortController']?.['abort']?.(),
        windowObject?.['showToast']?.(panelText('toasts.generationCancelled'), 'info'));
    } finally {
      _0x144607['setCancelInFlight'](_0x55127b, ![]);
      if (!_0x1f695c) _0x144607['finish'](_0x55127b);
      if (String(_0x2826aa || '')['trim']() === _0x1c2c62) {
        const _0x3a5790 = _0x5d4fd6[_0x35cecb(_0x400e49)] || _0x14c085;
        if (!_0x127966(_0x400e49, _0x3a5790, _0x3a5790)) _0x2f3430();
      }
    }
  }
  async function _0xfe6be5() {
    if (_0x17c39e) {
      _0x2f148b();
      return;
    }
    const _0x1c97e6 = _0x443c01();
    if (_0x1c97e6['length'] <= 0x0) {
      windowObject?.['showToast']?.(panelText('toasts.noGenerateTargets'), 'warn');
      return;
    }
    const _0x24e134 = String(_0x2826aa || '')['trim'](),
      _0x5d9adc = _0x450288(_0x1c97e6),
      _0xcee5f0 = createTaskBatchCancellationController();
    ((_0x1d44da = _0xcee5f0),
      _0x262dcd['clear'](),
      (_0x17c39e = runAudioVoiceBatchGenerationQueue(
        _0x1c97e6,
        (_0x573c44) =>
          _0xbc876c(_0x573c44['id'], {
            ownerSourceNodeId: _0x24e134,
            runningHubWorkflowConcurrency: _0x5d9adc,
            notifyCompletion: ![],
            showResultToast: ![],
          }),
        {
          concurrency: _0x5d9adc,
          shouldStop: _0xcee5f0['isRequested'],
          onTargetStart: ({ target: _0x605493 }) => {
            _0x262dcd['add'](String(_0x605493?.['id'] || '')['trim']());
          },
          onTargetSettled: ({ target: _0x6f5ba7 }) => {
            _0x262dcd['delete'](String(_0x6f5ba7?.['id'] || '')['trim']());
          },
        },
      )),
      _0x3c94d5());
    try {
      const _0x5d8698 = await _0x17c39e,
        _0x216369 = summarizeAudioVoiceGenerationResults(_0x5d8698, _0x1c97e6['length']),
        _0x47214f = buildAudioVoiceGenerationCompletionMessage(_0x216369);
      return (
        windowObject?.['showToast']?.(_0x47214f, _0x216369['incomplete'] > 0x0 ? 'warn' : 'success'),
        await notifyAudioVoiceGenerationComplete(_0x216369, {
          playSound: playCompletion,
          showNotification: showCompletionNotification,
        }),
        _0x5d8698
      );
    } finally {
      ((_0x17c39e = null), (_0x1d44da = null), _0x262dcd['clear'](), _0x3c94d5());
    }
  }
  async function _0x27d7be() {
    const _0xc00ea = _0x1d44da;
    if (!_0x17c39e || !_0xc00ea?.['request']?.()) return ![];
    _0x3c94d5();
    const _0x27ee4 = [..._0x262dcd]['filter'](Boolean);
    return (
      await Promise['allSettled'](_0x27ee4['map']((_0x4d143a) => _0x1dcb09(_0x4d143a))),
      windowObject?.['showToast']?.(panelText('toasts.batchCancellationRequested'), 'info'),
      !![]
    );
  }
  function _0x13cc63(_0x164ce3) {
    const _0x17d259 = getVisibleAudioVoiceSegments(_0x5d4fd6),
      _0xf265f9 = _0x17d259['findIndex']((_0x5c01a4) => _0x5c01a4['id'] === _0x164ce3),
      _0x56dec2 = _0x17d259[_0xf265f9],
      _0x2c7433 = _0x17d259[_0xf265f9 + 0x1] || null;
    if (!_0x56dec2) return;
    const _0x403053 = createAudioVoiceSegmentAfter(_0x56dec2, _0x2c7433);
    _0x355496('insert', [_0x403053['id']]);
    const _0x5adcd2 = [];
    (_0x5d4fd6['forEach']((_0x5d3bd3) => {
      _0x5adcd2['push'](_0x5d3bd3);
      if (_0x5d3bd3['id'] === _0x56dec2['id']) _0x5adcd2['push'](_0x403053);
    }),
      _0x3ae613(_0x5adcd2));
  }
  async function _0x2ea9bf(_0x4624bd = null) {
    if (_0x222157) return (_0x2f148b(panelText('status.composing')), _0x222157);
    const _0x4747bd = buildAudioVoiceComposeTimelineClips(_0x5d4fd6);
    if (_0x4747bd['length'] < 0x1) {
      windowObject?.['showToast']?.(panelText('toasts.composeNeedsMoreAudio'), 'warn');
      return;
    }
    const _0x9f2698 = resolveAudioVoiceSourceLocalPath(_0x207e98 || {});
    if (!_0x207e98 || !_0x9f2698) {
      windowObject?.['showToast']?.(panelText('toasts.invalidSource'), 'warn');
      return;
    }
    const _0x26938a = String(_0x2826aa || '')['trim'](),
      _0x478b37 = _0x207e98 ? { ..._0x207e98 } : null,
      _0x593bcb = getVisibleAudioVoiceSegments(_0x5d4fd6)['map'](cloneAudioVoiceSegment),
      _0x33d969 = _0x507df3['begin']({
        kind: 'compose-all',
        sourceNodeId: _0x26938a,
        segmentId: 'all',
        segmentIds: ['all'],
      });
    if (!_0x33d969) {
      _0x2f148b(panelText('status.composing'));
      return;
    }
    const _0x315a3d = {
        sourceKind: isAudioVoiceAudioNode(_0x478b37) ? 'audio' : 'video',
        src: _0x9f2698,
        clips: _0x4747bd,
        durationSec: resolveAudioVoiceComposeDurationSec(_0x478b37, _0x593bcb),
        anchorNode: _0x478b37,
        triggerEl: _0x4624bd,
      },
      _0x189ff1 = _0x30c0e1(_0x4747bd);
    _0x5ac370 = new Set(_0x4747bd['map']((_0xe9446f) => _0xe9446f['id'])['filter'](Boolean));
    const _0x2c1624 = Promise['resolve']()['then'](async () => {
      const _0xd43866 =
        composeTimeline === composeAudioVoiceTimelineNearNode
          ? await composeAudioVoiceTimelineNearNode({ ..._0x315a3d })
          : await composeTimeline(_0x315a3d);
      if (!_0xd43866) return null;
      if (!_0x507df3['isCurrent'](_0x33d969, _0x2826aa)) return _0xd43866;
      return (
        (_0x4d4071 = _0x189ff1),
        _0x3b587b(),
        onComposeResult?.(_0xd43866, { sourceNodeId: _0x26938a, sourceNode: _0x478b37, segments: _0x593bcb }),
        void Promise['resolve']()
          ['then'](() => playCompletion?.('audio-voice-compose'))
          ['catch']((_0x1ace0c) => {
            console['warn']('[audioVoicePanel]\x20completion\x20sound\x20failed', _0x1ace0c);
          }),
        _0xd43866
      );
    });
    _0x222157 = _0x2c1624;
    const _0x1a498e = [..._0x5ac370];
    _0x5b864e(_0x1a498e);
    try {
      return await _0x2c1624;
    } catch (_0x4faa5b) {
      if (!_0x507df3['isCurrent'](_0x33d969, _0x2826aa)) return null;
      return (
        windowObject?.['showToast']?.(_0x1808af(_0x4faa5b, panelText('toasts.composeFailed')), 'error'),
        null
      );
    } finally {
      (_0x507df3['finish'](_0x33d969),
        _0x222157 === _0x2c1624 && ((_0x222157 = null), (_0x5ac370 = new Set()), _0x5b864e(_0x1a498e)));
    }
  }
  async function _0xbfad56(_0x4f64ee, _0x2b2d3c = null) {
    if (_0x4ca78c()) return (_0x2f148b(panelText('status.translating')), null);
    const _0x349730 = _0x1665c1(_0x4f64ee),
      _0xc5c7d5 = _0x29971e();
    if (!_0x349730 || _0x28dfe5 !== 'ready' || _0xc5c7d5['targets']['length'] <= 0x0)
      return (windowObject?.['showToast']?.(panelText('toasts.noTranslationText'), 'warn'), null);
    _0x1b22f3();
    const _0x5dbe0b = await _0x27ec6b({
      language: _0x349730,
      count: _0xc5c7d5['targets']['length'],
      scope: _0xc5c7d5['scope'],
      returnFocus: _0x2b2d3c,
    });
    if (!_0x5dbe0b) return null;
    const _0xab9ba0 = _0x29971e();
    if (_0xab9ba0['targets']['length'] <= 0x0)
      return (windowObject?.['showToast']?.(panelText('toasts.noTranslationText'), 'warn'), null);
    const _0x20c4f1 = ++_0x54fa7e,
      _0x356fd3 = _0x2826aa,
      _0x54ab90 = _0xab9ba0['targets']['map']((_0x423175) => ({ ..._0x423175 })),
      _0x726567 = new Set(_0x54ab90['map']((_0x5c6e1c) => _0x5c6e1c['id']));
    ((_0x17489b = { id: _0x20c4f1, languageId: _0x349730['id'], segmentIds: _0x726567 }),
      _0x3dca31([..._0x726567]));
    try {
      if (!(await _0x380d5b())) return null;
      const _0x4c2fa5 = await translateSegments({ languageId: _0x349730['id'], segments: _0x54ab90 });
      if (_0x17489b?.['id'] !== _0x20c4f1) return null;
      const _0x321604 = new Map(
          _0x5d4fd6['map']((_0x3bc185) => [String(_0x3bc185['id'] || '')['trim'](), _0x3bc185]),
        ),
        _0x5270ea =
          _0x2826aa !== _0x356fd3 ||
          _0x54ab90['some']((_0x229762) => {
            const _0x2b2bc2 = _0x321604['get'](_0x229762['id']);
            return (
              !_0x2b2bc2 ||
              _0x2b2bc2['status'] === 'removed' ||
              String(_0x2b2bc2['sourceText'] || '')['trim']() !== _0x229762['sourceText']
            );
          });
      if (_0x5270ea)
        return (windowObject?.['showToast']?.(panelText('toasts.translationStale'), 'warn'), null);
      const _0x98acbf = new Map(
        _0x5d4fd6['filter']((_0x5ca49c) => _0x726567['has'](_0x5ca49c['id']))['map']((_0x341d37) => [
          _0x341d37['id'],
          _0x341d37,
        ]),
      );
      return (
        (_0x5d4fd6 = applyAudioVoiceTranslationResults(_0x5d4fd6, _0x4c2fa5)),
        _0x3b587b(),
        _0x214f2b(_0x98acbf, [..._0x726567]),
        windowObject?.['showToast']?.(
          panelText('toasts.translationComplete', { count: _0x726567['size'], language: _0x349730['label'] }),
          'success',
        ),
        _0x4c2fa5
      );
    } catch (_0x567309) {
      if (_0x17489b?.['id'] !== _0x20c4f1) return null;
      const _0x9d660d = _0x1808af(_0x567309, panelText('toasts.translationFailed')),
        _0x95e83b = classifyAudioVoiceTranslationConfigFailure(_0x567309);
      return (
        _0x95e83b
          ? _0x4aa051(_0x95e83b, _0x9d660d)
          : windowObject?.['showToast']?.(
              panelText('toasts.translationFailedWithMessage', { message: _0x9d660d }),
              'error',
            ),
        null
      );
    } finally {
      _0x17489b?.['id'] === _0x20c4f1 && ((_0x17489b = null), _0x3dca31([..._0x726567]));
    }
  }
  async function _0x5de72d({ runtimeRepairAttempted: runtimeRepairAttempted = ![] } = {}) {
    if (!_0x207e98) {
      windowObject?.['showToast']?.(panelText('toasts.selectSource'), 'warn');
      return;
    }
    const _0x15b5d0 = _0x207e98,
      _0x48de28 = String(_0x2826aa || '')['trim']();
    if (_0x2e64ce['isActiveFor'](_0x48de28)) {
      _0x2f148b(panelText('status.analyzing'));
      return;
    }
    const _0xd2e2b7 = resolveAudioVoiceSourceLocalPath(_0x15b5d0);
    if (!_0xd2e2b7) {
      windowObject?.['showToast']?.(panelText('toasts.invalidSource'), 'warn');
      return;
    }
    _0x5aca2b();
    const _0x3f0632 = resolveAudioVoiceAnalysisMemoryKey(_0x15b5d0),
      _0x3c993d = _0x2e64ce['begin']({ sourceNodeId: _0x48de28, sourceKey: _0x3f0632 }),
      _0x58066a = () => _0x2e64ce['isCurrent'](_0x3c993d) && String(_0x2826aa || '')['trim']() === _0x48de28,
      _0xf1ef74 = _0x3f0632
        ? _0x4f424a['get'](_0x3f0632) || resolveAudioVoicePersistedAnalysisSnapshot(_0x15b5d0)
        : null,
      _0x10fdaf = normalizeAudioVoiceAsrProvider(_0x3a0686),
      _0x450b8b = _0x28dfe5,
      _0x46cd38 = _0x215d3a;
    ((_0x28dfe5 = 'analyzing'),
      (_0x215d3a = createAudioVoiceInitialAnalysisProgress({
        isLocal: _0x10fdaf === AUDIO_VOICE_ASR_PROVIDER_IDS['FUNASR'],
        text: panelText,
      })),
      _0x2f3430());
    if (getAudioVoiceAsrProvider(_0x10fdaf)['configProviderId'] && !(await _0x511f1e())) {
      if (!_0x58066a()) return;
      ((_0x28dfe5 = _0x450b8b), (_0x215d3a = _0x46cd38), _0x2e64ce['complete'](_0x3c993d), _0x2f3430());
      return;
    }
    if (!_0x58066a()) return;
    (_0x77f56['clear'](),
      (_0x511db2 = new Set()),
      (_0x5d4fd6 = []),
      (_0x343faf = ''),
      (_0xb8517e = ''),
      _0x2f3430());
    try {
      let _0x2257c7 = {};
      if (_0x10fdaf === AUDIO_VOICE_ASR_PROVIDER_IDS['FUNASR']) {
        _0x2257c7 = await prepareAudioVoiceLocalAsr({
          nodeId: _0x48de28,
          onTaskStarted: (_0x5a7e91) => {
            void _0x2e64ce['trackTask'](_0x3c993d, _0x5a7e91);
            if (!_0x58066a()) return;
            _0x77f56['install'](_0x5a7e91, { progressScale: AUDIO_VOICE_ASR_RUNTIME_PROGRESS_SHARE });
          },
        });
        if (!_0x58066a()) return;
      }
      const _0x2f02df = await enqueueElectronMediaTask({
          kind: 'audioVoiceAnalyze',
          src: _0xd2e2b7,
          nodeId: _0x48de28,
          args: {
            asrProvider: _0x10fdaf,
            ..._0x2257c7,
            noiseDb: -0x23,
            minSilenceSec: 0.35,
            paddingMs: 0x50,
          },
        }),
        _0x2fbc50 = String(_0x2f02df?.['taskId'] || '')['trim']();
      if (!_0x2fbc50) throw new Error(panelText('toasts.analysisFailed'));
      if (!(await _0x2e64ce['trackTask'](_0x3c993d, _0x2fbc50)) || !_0x58066a()) return;
      _0x77f56['install'](
        _0x2fbc50,
        _0x10fdaf === AUDIO_VOICE_ASR_PROVIDER_IDS['FUNASR']
          ? {
              progressOffset: AUDIO_VOICE_ASR_RUNTIME_PROGRESS_SHARE,
              progressScale: 0x1 - AUDIO_VOICE_ASR_RUNTIME_PROGRESS_SHARE,
            }
          : {},
      );
      const _0x345b2e = await waitForElectronMediaTask(_0x2fbc50, {
        timeout: ANALYZE_TASK_TIMEOUT_MS,
        diagnosticPayload: { kind: 'audioVoiceAnalyze', src: _0xd2e2b7, nodeId: _0x48de28 },
      });
      if (!_0x58066a()) return;
      (assertAudioVoiceAsrResult(_0x345b2e, _0x10fdaf),
        (_0x343faf = normalizeLocalPath(_0x345b2e?.['sourceAudio']?.['localPath'] || '')),
        (_0xb8517e = firstNonEmptyString(_0x345b2e?.['sourceAudio']?.['url'], localPathToUrl(_0x343faf))),
        (_0x28dfe5 = 'ready'),
        (_0x215d3a = null),
        _0x77f56['clear'](),
        _0x3ae613(normalizeAudioVoiceAnalyzeSegments(_0x345b2e)),
        windowObject?.['showToast']?.(
          panelText('toasts.analysisComplete', { count: getVisibleAudioVoiceSegments(_0x5d4fd6)['length'] }),
          'success',
        ));
    } catch (_0x4de681) {
      if (!_0x58066a()) return;
      ((_0x28dfe5 = 'error'), (_0x215d3a = null), _0x77f56['clear']());
      _0xf1ef74
        ? ((_0x5d4fd6 = _0xf1ef74['segments']['map'](cloneAudioVoiceSegment)),
          (_0x343faf = normalizeLocalPath(_0xf1ef74['analysisSourceAudioLocalPath'] || '')),
          (_0xb8517e = firstNonEmptyString(_0xf1ef74['analysisSourceAudioUrl'], localPathToUrl(_0x343faf))))
        : (_0x5d4fd6 = []);
      _0x2f3430();
      const _0x103ce6 = getAudioVoiceAnalyzeErrorMessage(_0x4de681, {
        getErrorMessage: _0x1808af,
        text: panelText,
        authErrorKeys: getAudioVoiceAsrProvider(_0x10fdaf)['authErrorKeys'],
      });
      if (
        getAudioVoiceAsrProvider(_0x10fdaf)['configProviderId'] &&
        isVolcengineSpeechAsrAuthFailure(_0x103ce6)
      )
        _0x674e0('invalid', _0x103ce6);
      else {
        if (_0x10fdaf === AUDIO_VOICE_ASR_PROVIDER_IDS['FUNASR']) {
          const _0x52db38 = await recoverAudioVoiceLocalAsrRuntime({
            error: _0x4de681,
            repairAttempted: runtimeRepairAttempted,
            message: _0x103ce6,
            nodeId: _0x48de28,
            canCommit: _0x58066a,
            confirmAction: _0x5b86d2,
            text: panelText,
            analysisSession: _0x2e64ce,
            operation: _0x3c993d,
            progressTracker: _0x77f56,
            windowObject: windowObject,
            setAnalysisState: (_0x5ade75, _0xa86bae) => {
              ((_0x28dfe5 = _0x5ade75), (_0x215d3a = _0xa86bae), _0x2f3430());
            },
          });
          _0x52db38 && (_0x2e64ce['complete'](_0x3c993d), await _0x5de72d({ runtimeRepairAttempted: !![] }));
        } else windowObject?.['showToast']?.(_0x103ce6, 'error');
      }
    } finally {
      _0x2e64ce['complete'](_0x3c993d);
    }
  }
  async function _0x2d1837(_0x24a3c2) {
    const _0x342011 =
      typeof resolveStartAnalyzeConfirmation === 'function'
        ? await resolveStartAnalyzeConfirmation({ sourceNodeId: _0x2826aa, sourceNode: _0x207e98 })
        : null;
    if (_0x342011) {
      const _0x3117a3 = await _0x5b86d2({
        className: 'audio-voice-start-analyze-confirm',
        ..._0x342011,
        returnFocus: _0x24a3c2,
      });
      if (!_0x3117a3) return;
    }
    await _0x5de72d();
  }
  function _0x5c6104(_0x647909, _0x4c79c6, _0x3597d2, _0x165f8c = {}) {
    if (
      _0x34fe12['hasPending']() &&
      (_0x34fe12['isReserved'](_0x4c79c6) || _0x34fe12['blocksGlobalAction'](_0x647909))
    ) {
      (_0x2f148b(panelText('status.merging')), _0x1b22f3());
      return;
    }
    if (_0x4ca78c() && AUDIO_VOICE_TRANSLATION_BLOCKED_ACTIONS['has'](_0x647909)) {
      (_0x2f148b(panelText('status.translating')), _0x1b22f3());
      return;
    }
    if (_0x647909 === 'show-asr-api-key-guide') {
      Promise['resolve'](getAudioVoiceAsrProvider(_0x3a0686)['openGuide']?.())['catch']((_0x766486) =>
        windowObject?.['showToast']?.(_0x1808af(_0x766486), 'error'),
      );
      return;
    }
    if (_0x647909 === 'open-asr-api-key-settings') {
      getAudioVoiceAsrProvider(_0x3a0686)['openSettings']?.();
      return;
    }
    if (_0x647909 === 'close-asr-config-alert') {
      _0x2b5c63();
      return;
    }
    if (_0x647909 === 'show-translation-api-key-guide') {
      showProviderApiKeyGuide(AUDIO_VOICE_TRANSLATION_PROVIDER_ID);
      return;
    }
    if (_0x647909 === 'open-translation-api-key-settings') {
      openProviderApiKeySettings(AUDIO_VOICE_TRANSLATION_PROVIDER_ID);
      return;
    }
    if (_0x647909 === 'close-translation-config-alert') {
      _0x1cd02a();
      return;
    }
    if (_0x647909 === 'load-selected') {
      _0x30ed43['startSourcePick']();
      return;
    }
    if (_0x647909 === 'start-analyze') {
      void _0x2d1837(_0x3597d2);
      return;
    }
    if (_0x647909 === 'toggle-menu') {
      const _0x2329d2 = _0x3597d2['closest']?.('.audio-voice-more-wrap'),
        _0x42e208 = _0x2329d2?.['classList']?.['contains']?.('is-open');
      (_0x1b22f3(), _0x2329d2?.['classList']?.['toggle']?.('is-open', !_0x42e208));
      return;
    }
    if (_0x647909 === 'toggle-asr-settings') {
      const _0x228f6f = _0x3597d2['closest']?.('.audio-voice-asr-settings'),
        _0x788ff = _0x228f6f?.['classList']?.['contains']?.('is-open');
      (_0x1b22f3(), _0x228f6f?.['classList']?.['toggle']?.('is-open', !_0x788ff));
      return;
    }
    if (_0x647909 === 'toggle-translation') {
      const _0x32595b = _0x3597d2['closest']?.('.audio-voice-translation-settings'),
        _0x2d575c = _0x32595b?.['classList']?.['contains']?.('is-open');
      (_0x1b22f3(),
        _0x32595b?.['classList']?.['toggle']?.('is-open', !_0x2d575c),
        _0x3597d2['setAttribute']('aria-expanded', _0x2d575c ? 'false' : 'true'));
      return;
    }
    if (_0x647909 === 'translate-language') {
      void _0xbfad56(_0x3597d2['dataset']['languageId'], _0x3597d2);
      return;
    }
    if (_0x647909 === 'select-asr-provider') {
      _0x3a0686 = normalizeAudioVoiceAsrProvider(_0x3597d2['dataset']['providerId']);
      const _0x1f83bc = !!_0xbd3cd4;
      ((_0xbd3cd4 = null), _0x1b22f3(), _0x5abe5b());
      if (_0x1f83bc) _0x2f3430();
      return;
    }
    if (_0x647909 === 'toggle-global-settings') {
      const _0x36ee67 = _0x3597d2['closest']?.('.audio-voice-global-settings'),
        _0x3a8feb = _0x36ee67?.['classList']?.['contains']?.('is-open');
      (_0x1b22f3(), _0x36ee67?.['classList']?.['toggle']?.('is-open', !_0x3a8feb));
      return;
    }
    if (_0x647909 === 'select-global-model') {
      const _0x480472 = String(_0x3597d2['dataset']['modelId'] || '')['trim']();
      if (_0x480472) _0x4fc784 = _0x480472;
      (_0x1b22f3(), _0x3c94d5(), _0x17b35c());
      return;
    }
    if (_0x647909 === 'select-segment-model') {
      const _0x32cddd = String(_0x3597d2['dataset']['modelId'] || '')['trim']();
      (_0x3ebc37(_0x4c79c6, {
        voiceModelId: _0x32cddd,
        voiceModelSelectionMode: _0x32cddd ? 'segment' : 'global',
      }),
        _0x1b22f3());
      return;
    }
    if (_0x647909 === 'select-all') {
      ((_0x511db2 = _0x4227fb()
        ? new Set()
        : new Set(getVisibleAudioVoiceSegments(_0x5d4fd6)['map']((_0x46236a) => _0x46236a['id']))),
        _0x159881());
      return;
    }
    if (_0x647909 === 'voice') {
      _0x30ed43['startAudioPick'](AUDIO_VOICE_BATCH_AUDIO_PICK_ID);
      return;
    }
    if (_0x647909 === 'toggle-select') {
      _0x538df6(_0x4c79c6);
      return;
    }
    if (_0x647909 === 'toggle-history') {
      const _0x439fa8 = _0x3597d2['closest']?.('.audio-voice-history-wrap'),
        _0x7e8773 = _0x439fa8?.['classList']?.['contains']?.('is-open');
      (_0x1b22f3(), _0x439fa8?.['classList']?.['toggle']?.('is-open', !_0x7e8773));
      return;
    }
    if (_0x647909 === 'use-history') {
      const _0x3eb6e6 = _0xb1ffb0(_0x4c79c6, _0x3597d2['dataset']['historyId']);
      if (!_0x3eb6e6) return;
      (_0x3ebc37(_0x4c79c6, {
        convertedAudioLocalPath: _0x3eb6e6['localPath'],
        convertedAudioUrl: _0x3eb6e6['audioUrl'],
        convertedAudioDuration: pickAudioDurationSec(_0x3eb6e6['audioDuration'], _0x3eb6e6['duration']),
        convertedAudioReady: !![],
        activeAudio: 'converted',
        status: 'ready',
        error: '',
      }),
        _0x1b22f3());
      return;
    }
    if (_0x647909 === 'play-history') {
      const _0xdba2e8 = _0xb1ffb0(_0x4c79c6, _0x3597d2['dataset']['historyId']);
      if (_0xdba2e8) void _0x323777(_0xdba2e8['audioUrl']);
      return;
    }
    if (_0x647909 === 'merge') {
      void _0x34fe12['merge'](_0x4c79c6);
      return;
    }
    if (_0x647909 === 'insert') {
      _0x13cc63(_0x4c79c6);
      return;
    }
    if (_0x647909 === 'play-source') {
      _0x1166ca(_0x4c79c6, 'source');
      return;
    }
    if (_0x647909 === 'debug-generation') {
      _0x46f8fc(_0x4c79c6);
      return;
    }
    if (_0x647909 === 'generate') {
      const _0x38cafb = _0x5d4fd6[_0x35cecb(_0x4c79c6)];
      _0x38cafb &&
      shouldAllowCancel(_0x563ba3(_0x38cafb), {
        cancellable: _0x1900fb(_0x38cafb),
        cancelInFlight: _0x144607['isCancelInFlight'](_0x2826aa, _0x4c79c6),
      })
        ? void _0x1dcb09(_0x4c79c6)
        : void _0xbc876c(_0x4c79c6);
      return;
    }
    if (_0x647909 === 'play-converted') {
      _0x1166ca(_0x4c79c6, 'converted');
      return;
    }
    if (_0x647909 === 'batch-generate') {
      void _0xfe6be5();
      return;
    }
    if (_0x647909 === 'cancel-batch-generation') {
      void _0x27d7be();
      return;
    }
    if (_0x647909 === 'compose-all') {
      void _0x2ea9bf(_0x3597d2);
      return;
    }
    if (_0x647909 === 'use-converted') {
      (_0x3ebc37(_0x4c79c6, { activeAudio: 'converted' }), _0x1b22f3());
      return;
    }
    if (_0x647909 === 'use-source') {
      (_0x3ebc37(_0x4c79c6, { activeAudio: 'source' }), _0x1b22f3());
      return;
    }
    if (_0x647909 === 'download-source') {
      (_0x2fb60a(_0x4c79c6, 'source', 'download'), _0x1b22f3());
      return;
    }
    if (_0x647909 === 'download-converted') {
      (_0x2fb60a(_0x4c79c6, 'converted', 'download'), _0x1b22f3());
      return;
    }
    if (_0x647909 === 'add-source-to-canvas') {
      (_0x2fb60a(_0x4c79c6, 'source', 'add-to-canvas'), _0x1b22f3());
      return;
    }
    if (_0x647909 === 'add-converted-to-canvas') {
      (_0x2fb60a(_0x4c79c6, 'converted', 'add-to-canvas'), _0x1b22f3());
      return;
    }
    if (_0x647909 === 'edit-source') {
      _0x14c2be(_0x4c79c6);
      return;
    }
    if (_0x647909 === 'audio-param') {
      _0x30ed43['startAudioPick'](_0x4c79c6);
      return;
    }
    if (_0x647909 === 'clear-audio-param') {
      const _0x5cf9d2 = resolveAudioVoiceSelectionTargetIds(
          _0x4c79c6,
          _0x511db2,
          getVisibleAudioVoiceSegments(_0x5d4fd6),
        ),
        _0x447c60 = new Set(_0x5cf9d2);
      if (_0x447c60['size'] <= 0x0) return;
      ((_0x5d4fd6 = _0x5d4fd6['map']((_0xe4cfff) =>
        _0x447c60['has'](_0xe4cfff['id'])
          ? {
              ..._0xe4cfff,
              voiceRefNodeId: '',
              voiceRefAudioLocalPath: '',
              voiceRefAudioUrl: '',
              voiceRefName: '',
              voiceRefImageUrl: '',
              imitateToneEnabled: ![],
              error: '',
            }
          : _0xe4cfff,
      )),
        _0x3b587b(),
        _0x2f3430());
      return;
    }
    if (_0x647909 === 'toggle-imitate-tone') {
      const _0x42dac7 = _0x5d4fd6[_0x35cecb(_0x4c79c6)];
      if (!_0x42dac7) return;
      _0x39bfc0(_0x4c79c6, _0x42dac7['imitateToneEnabled'] !== !![]);
      return;
    }
    if (_0x647909 === 'remove') {
      const _0x30f192 = getVisibleAudioVoiceSegments(_0x5d4fd6),
        _0x314616 = _0x30f192['findIndex']((_0x3e318b) => _0x3e318b['id'] === _0x4c79c6),
        _0x4b6f80 = _0x30f192[_0x314616 + 0x1] || _0x30f192[_0x314616 - 0x1] || null;
      (_0x355496('remove-shift', _0x4b6f80 ? [_0x4b6f80['id']] : []),
        _0x3ae613(_0x5d4fd6['filter']((_0x525d8d) => _0x525d8d['id'] !== _0x4c79c6)));
      return;
    }
    (_0x2f148b(), _0x1b22f3());
  }
  const _0x1a532c = createAudioVoiceSegmentContextMenuController({
      panel: _0x2f6fa4,
      getSegment: (_0x36a020) => _0x5d4fd6[_0x35cecb(_0x36a020)],
      buildItems: getAudioVoiceSegmentContextMenuItems,
      onAction: _0x5c6104,
      closeInlineMenus: _0x1b22f3,
    }),
    _0x43e87f = (_0x2e85f1) => {
      (_0x2e85f1['stopPropagation'](), _0x17ad93());
    };
  (_0x31f254['addEventListener']('click', _0x43e87f),
    _0x4d26ea['addEventListener']('click', _0x5cb6e2),
    _0x51cf48['addEventListener']('pointerdown', _0x25f697),
    _0x51cf48['addEventListener']('keydown', (_0x1632c7) => {
      if (_0x1632c7['key'] !== 'ArrowLeft' && _0x1632c7['key'] !== 'ArrowRight') return;
      _0x1632c7['preventDefault']?.();
      const _0x34a060 = _0x2f6fa4['getBoundingClientRect']?.()['width'] || _0x2f6fa4['offsetWidth'] || 0x0,
        _0x12a410 = _0x1632c7['key'] === 'ArrowLeft' ? 0x18 : -0x18;
      _0x2d0101(_0x34a060 + _0x12a410, { persist: !![] });
    }),
    _0x2f6fa4['addEventListener']('pointerdown', (_0x37245f) => {
      _0x37245f['stopPropagation']();
    }),
    _0x2f6fa4['addEventListener']('input', (_0x4b91f0) => {
      const _0x107b22 = _0x4b91f0['target']?.['closest']?.('[data-audio-voice-text-input]');
      if (!_0x107b22) return;
      const _0x53c80d = _0x107b22['dataset']['segmentId'] || '';
      if (_0x278666(_0x53c80d)) {
        const _0x50f813 = _0x5d4fd6[_0x35cecb(_0x53c80d)];
        _0x107b22['value'] =
          _0x107b22['dataset']['audioVoiceTextKind'] === 'converted'
            ? String(_0x50f813?.['targetText'] || _0x50f813?.['sourceText'] || '')
            : String(_0x50f813?.['sourceText'] || '');
        return;
      }
      _0x19d711(_0x53c80d, _0x107b22['value'], _0x107b22['dataset']['audioVoiceTextKind']);
    }),
    _0x2f6fa4['addEventListener']('focusout', (_0x30d838) => {
      const _0x4090ef = _0x30d838['target']?.['closest']?.('[data-audio-voice-text-input]');
      if (!_0x4090ef || _0x4090ef['dataset']['audioVoiceTextKind'] !== 'converted') return;
      const _0x51ccc3 = String(_0x4090ef['dataset']['segmentId'] || '')['trim']();
      windowObject?.['setTimeout']?.(() => {
        const _0x273476 = document?.['activeElement']?.['closest']?.('[data-audio-voice-text-input]');
        if (_0x273476?.['dataset']['segmentId'] === _0x51ccc3) return;
        _0x10720a(_0x51ccc3);
      }, 0x0);
    }),
    _0x2f6fa4['addEventListener']('click', (_0x58ceaf) => {
      const _0xd1a193 = _0x58ceaf['target']?.['closest']?.('[data-audio-voice-action]');
      if (!_0xd1a193) {
        const _0x39370f = _0x58ceaf['target']?.['closest']?.('.audio-voice-segment-card'),
          _0x5b7a29 = _0x58ceaf['target']?.['closest']?.(
            'button, input, textarea, select, .audio-voice-more-menu, .audio-voice-history-menu, .audio-voice-global-settings-menu, .audio-voice-asr-settings-menu, .audio-voice-translation-menu',
          );
        if (_0x39370f && !_0x5b7a29) {
          _0x58ceaf['stopPropagation']?.();
          if (_0x34fe12['isReserved'](_0x39370f['dataset']['segmentId'] || '')) {
            _0x2f148b(panelText('status.merging'));
            return;
          }
          _0x538df6(_0x39370f['dataset']['segmentId'] || '');
          return;
        }
        !_0x58ceaf['target']?.['closest']?.(
          '.audio-voice-more-menu, .audio-voice-history-menu, .audio-voice-global-settings-menu, .audio-voice-asr-settings-menu, .audio-voice-translation-menu',
        ) && _0x1b22f3();
        return;
      }
      if (_0xd1a193['disabled']) return;
      (_0x58ceaf['stopPropagation']?.(),
        _0x5c6104(
          _0xd1a193['dataset']['audioVoiceAction'],
          _0xd1a193['dataset']['segmentId'] || '',
          _0xd1a193,
          _0x58ceaf,
        ));
    }),
    _0x2f6fa4['addEventListener']('keydown', (_0x34855a) => {
      const _0x57bbe7 = _0x34855a['target']?.['closest']?.('[data-audio-voice-text-input]');
      if (_0x57bbe7 && _0x2da5b5(_0x34855a, _0x57bbe7)) return;
      if (_0x34855a['key'] !== 'Enter' && _0x34855a['key'] !== '\x20') return;
      const _0x32ebbf = _0x34855a['target']?.['closest']?.('[data-audio-voice-action="toggle-select"]');
      if (!_0x32ebbf) return;
      (_0x34855a['preventDefault']?.(),
        _0x5c6104('toggle-select', _0x32ebbf['dataset']['segmentId'] || '', _0x32ebbf));
    }));
  const _0x3b9117 = (_0x889d4c) => {
    _0x3fb90d(_0x889d4c?.['detail'] || {});
  };
  return (
    !embedded && windowObject?.['addEventListener']?.(AUDIO_VOICE_PANEL_OPEN_EVENT, _0x3b9117),
    _0x2f3430(),
    {
      panel: _0x2f6fa4,
      open: _0x3fb90d,
      close: _0x5cb6e2,
      toggle: _0x17ad93,
      setWidth: (_0x5ebedb) => _0x2d0101(_0x5ebedb, { persist: !![] }),
      getSourceNodeId: () => _0x2826aa,
      getSegments: () => getVisibleAudioVoiceSegments(_0x5d4fd6)['map'](cloneAudioVoiceSegment),
      canSelectAudioReference: _0x30ed43['canSelectAudioReference'],
      selectAudioReference: _0x30ed43['selectAudioReference'],
      destroy() {
        (_0x1a532c['destroy'](),
          _0x5cb6e2(),
          _0x105473['destroy'](),
          _0x30ed43['destroy'](),
          _0x31f254['removeEventListener']?.('click', _0x43e87f),
          windowObject?.['removeEventListener']?.(AUDIO_VOICE_PANEL_OPEN_EVENT, _0x3b9117),
          _0x2f6fa4['remove']?.(),
          _0x3106f2['remove']?.());
      },
    }
  );
}
