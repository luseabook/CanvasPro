import { openDebugRequestWindow, renderRequestDebugButton } from '../debugRequestWindow.js';
import { RECORDING_ASR_MODELS } from '../../../api/recordingAsrModels.js';
import { updateStoryEpisodeScriptText } from './storyScriptRevision.js';
import { renderStoryPlanningTextModelPicker } from './storyPlanningModelPicker.js';
import { mountStorySpeechGapEditor } from './storySpeechGapEditor.js';
import { bindStoryWorkspacePricing } from './storyWorkspacePricing.js';
import {
  createStoryAssetImageUploadController,
  bindStoryAssetImageDrop,
} from './storyAssetImageUploadController.js';
import { hasWorkspaceScrollableOverflow } from '../workspaceWheelNavigation.js';
import { buildGenerationDebugPreview } from '../../utils/generationDebugPreview.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import { createWorkspacePresentationLifecycle } from '../workspacePresentationLifecycle.js';
import { createWorkspacePersistencePresentation } from '../workspacePersistencePresentation.js';
import { syncStoryClipAdjustmentMenu, canGenerateStoryClipAdjustment } from './storyClipAdjustmentMenu.js';
import { normalizeStoryPromptLanguage } from '../../domain/storyGeneration/promptLanguage.js';
import {
  getAssetMentionCandidates,
  resolveAssetMentionRef,
  subscribeAssetMentionRegistry,
} from '../assetMentionRegistry.js';
import { createWorkspacePageTransitionController } from '../workspacePageTransition.js';
import { refreshWorkspaceProjectResultsInPlace } from '../workspaceProjectHome.js';
import {
  createWorkspaceMenuController,
  syncWorkspaceInlineMenuExpandedWidth,
} from '../workspaceMenuController.js';
import {
  bindAIGenTextModelSelector,
  renderAIGenTextModelSelectorMarkup,
} from '../../components/aigenText/modelSelector.js';
import {
  bindAIGenImageModelSelector,
  renderAIGenImageModelSelectorMarkup,
} from '../../components/aigenImage/modelSelector.js';
import { bindAIGenVideoModelSelector } from '../../components/aigenVideo/modelSelector.js';
import { buildAudioWorkflowFooterHtml } from '../../components/audio-node/audioFooterSchemaSlots.js';
import { bindAudioWorkflowSchemaSlotControls } from '../../components/audio-node/audioWorkflowSchemaSlotSync.js';
import {
  bindNodeFooterController,
  closeNodeFooterMenus,
  createFloatingModelMenuPortal,
} from '../../components/shared/nodeFooterControls.js';
import { createModelProviderProfileControl } from '../../components/shared/modelProviderProfileControl.js';
import { resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
import {
  hasPendingRuntimeManifestLoad,
  waitForRuntimeManifestLoad,
} from '../../manifests/runtimeManifestReadiness.js';
import { openImagePreview, openVideoPreview } from '../imagePreview.js';
import { showProviderApiKeyMissingToastForError } from '../providerApiKeyMissingToast.js';
import { resolveModelProviderProfileId } from '../modelProviderProfileSelection.js';
import { getDisplayModelName } from '../providers.js';
import { saveOutputFromUrl, uploadFile } from '../../services/projectService.js';
import { saveMediaDownload } from '../../services/downloadSaveService.js';
import { playCompletionSound } from '../../services/completionSoundService.js';
import {
  showGenerationCompleteNotification,
  subscribeGenerationCompleteNotificationClicks,
} from '../../services/completionNotificationService.js';
import { DEBUG_WRENCH_ICON_HTML } from '../../utils/debugRequestPreview.js';
import { createDemoStoryWorkspaceData } from './storyWorkspaceData.js';
import {
  renderWorkspaceAssetSelectionActions,
  resolveWorkspaceCardMultiSelection,
  focusWorkspaceAssetCard,
  toggleWorkspaceAssetSelectAll,
  toggleWorkspaceAssetSelection,
} from '../workspaceAssetSelection.js';
import {
  buildWorkspaceAssetLibraryItems,
  createWorkspaceAssetLibraryDisclosure,
  getWorkspaceAssetLibraryMediaLabel,
  handleWorkspaceAssetLibraryImageError,
  getWorkspaceAssetLibrarySelectionOrder,
} from '../workspaceAssetLibrary.js';
import {
  renderWorkspaceImageDownloadButton,
  runWorkspaceImageDownloadAction,
  saveWorkspaceImageDownload,
} from '../workspaceImageDownload.js';
import {
  buildWorkspaceAssetHoverPreviewContent,
  consumeWorkspaceWheelDirection,
  isWorkspaceAssetHoverLandscape,
  renderWorkspaceAssetLoadingOverlay,
  renderWorkspaceAssetTabIcon,
  resolveWorkspaceTabTransitionDirection,
} from '../workspaceAssetPresentation.js';
import {
  renderStoryAddToLibraryIcon,
  renderStoryDeleteIcon,
  renderStoryUploadIcon,
} from './storyWorkspaceIcons.js';
import { createStoryMediaHistoryMenuController } from './storyMediaHistory.js';
import {
  captureStoryRequestPayload,
  buildStoryRequestDebugPreviewModel,
  closeStoryRequestDebugPreview,
  openStoryRequestDebugPreview,
} from './storyRequestDebugPreview.js';
import {
  clearStoryAssetAppearanceReferenceImage,
  ensureStoryAssetBaseAppearance,
  getStoryAssetAppearance,
  getStoryAssetAppearances,
  getStoryAssetAppearanceReferenceUrls,
  getStoryAssetBaseAppearance,
  isStoryAssetBaseAppearance,
  normalizeStoryAsset,
  normalizeStoryWorkspaceAssetData,
  resolveStoryAssetAppearanceOriginalUrl,
  setStoryAssetAppearanceReferenceImage,
  setStoryAssetBaseAppearance,
  shouldGenerateStoryAssetBaseAppearanceFirst,
} from './storyAssetAppearances.js';
import {
  buildMissingStoryAssetImageWarning,
  createStoryAssetSettingsWorkspacePresentation,
  clearStoryAssetAppearanceImage,
  getMissingStoryAssetImages,
  removeStoryAddedAssetAppearance,
} from './storyAssetSettingsWorkspacePresentation.js';
import { removeStoryReplicationCharacterAppearance } from './storyReplicationAppearanceOperations.js';
import { createStoryAssetBatchGenerationController } from './storyAssetBatchGenerationController.js';
import { createStoryAssetGenerationController } from './storyAssetGenerationController.js';
import {
  createStoryAssetExtractionWorkspaceController,
  getStoryAssetBreakdownEpisodes,
  isStoryAssetExperimentalExtractionAvailable,
  shouldUseStoryAssetBatchedExtraction,
  shouldUseStoryAssetParallelExtraction,
} from './storyAssetExtractionWorkspaceController.js';
import {
  buildStoryAssetStyleReferenceMentionCandidate,
  readStoryAssetPromptText,
  renderStoryAssetPromptMentions,
  STORY_ASSET_STYLE_REFERENCE_PILL_KIND,
} from './storyAssetPromptMentions.js';
import {
  getStoryCharacterAssetPromptPreset,
  getStorySceneAssetPromptPreset,
  STORY_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
  STORY_SCENE_ASSET_PROMPT_PRESET_NONE_ID,
} from './storyAssetPromptPresets.js';
import {
  STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS,
  getStoryWorkspaceModelChoice,
  getStoryWorkspaceModelOptions,
  resolveStoryWorkspaceModelId,
  resolveStoryVideoInputTextModelId,
} from './storyWorkspaceModelCatalog.js';
import {
  createStoryWorkspaceSnapshot,
  hasStoryWorkspaceSnapshotChanged,
  mergeStoryWorkspaceHydratedProjects,
  parseStoryWorkspaceSnapshotPayload,
} from './storyWorkspacePersistence.js';
import {
  buildStoryBackgroundTaskId,
  getStoryBackgroundTasks,
  isStoryBackgroundTaskActive,
} from './storyBackgroundTasks.js';
import { createStoryProjectTaskWorkspaceController } from './storyProjectTaskWorkspaceController.js';
import { createStoryProjectPersistenceWorkspaceController } from './storyProjectPersistenceWorkspaceController.js';
import { createStoryProjectDataOwner } from './storyProjectDataOwner.js';
import { createStoryCollaboration } from './storyCollaboration.js';
import { isStoryCollaborationProject } from './storyCollaborationPolicy.js';
import { renderStoryConceptionPage } from './storyCollaborationPresentation.js';
import { openStoryProjectPage } from './storyProjectNavigation.js';
import { runStoryEpisodeScriptBatchQueue } from './storyEpisodeScriptBatchQueue.js';
import { createStoryEpisodeScriptWorkspaceController } from './storyEpisodeScriptApplication.js';
import { createStoryEpisodeOutlineWorkspaceController } from './storyEpisodeOutlineApplication.js';
import {
  createStoryEpisodeSplitWorkspaceController,
  isStoryEpisodeExperimentalSplitAvailable,
  resolveStoryEpisodeExperimentalErrorMessage,
  shouldUseStoryEpisodeExperimentalSplit,
} from './storyEpisodeSplitWorkspaceController.js';
import { createStorySummaryGenerationWorkspaceController } from './storySummaryGenerationWorkspaceController.js';
import { createStoryTaskBatchCancellationRegistry } from './storyTaskBatchCancellation.js';
import {
  getStoryAssetExperimentalDraftDisplay,
  isStoryAssetLocalQualityRevalidationDraft,
} from './storyAssetExtractionDraft.js';
import { STORY_STYLE_CUSTOM_ID, resolveStoryStyleSelection } from './storyStyleCatalog.js';
import {
  renderStoryHome,
  renderStoryHomeModelBar,
  renderStoryHomeParamChevron,
  renderStoryHomeProjectResults,
  renderStoryProjectCard,
  renderStoryProjectSortControl,
  renderStoryScriptModeControl,
} from './storyHomePresentation.js';
import {
  clearStoryHomeReferenceScript,
  handleStoryHomeDocumentDragLeave,
  handleStoryHomeDocumentDragOver,
  handleStoryHomeDocumentDrop,
} from './storyHomeRewrite.js';
import {
  canGenerateStoryEpisodeScript,
  compileStoryEpisodeScripts,
  deriveStoryEpisodeAssetSummary,
  deriveStoryEpisodeStatus,
  getNextStoryEpisodeScriptIndex,
  getStoryEpisodeScriptBatchTargets,
  invalidateStoryEpisodeScriptsFrom,
  insertStoryEpisodeClip,
  removeStoryEpisodeClip,
  mergeStoryEpisodePlans,
  syncStoryPlanningVisualStyle,
} from './storyPlanningData.js';
import { buildStoryClipInputSlotViewModel, updateStoryClipInput } from './storyClipInputSlots.js';
import { createStoryClipVideoTaskWorkspaceController } from './storyClipVideoTaskWorkspaceController.js';
import { createStoryClipInputWorkspaceController } from './storyClipInputWorkspaceController.js';
import { createStoryClipProductionWorkspaceController } from './storyClipProductionWorkspaceController.js';
import { createStoryClipResultSelectionController } from './storyClipResultSelectionController.js';
import { storyClipProduction } from './storyClipProduction.js';
import { createStoryClipProductionPresentation } from './storyClipProductionPresentation.js';
import { createStoryScriptPlanningPresentation } from './storyScriptPlanningPresentation.js';
import { createStoryAssetSettingsPresentation } from './storyAssetSettingsPresentation.js';
import {
  createStoryAssetSettingsProjection,
  formatStoryAssetOccurrences,
  getStoryAssetBatchDirectMode,
  shouldRenderStoryAssetRoleTag,
} from './storyAssetSettingsProjection.js';
import { addStoryLibraryAssetsToProject } from './storyLibraryProjectAssignment.js';
import { createStoryLibraryAssignmentMenuPortal } from './storyLibraryAppearanceMenuPortal.js';
import { createStoryWorkspaceChromePresentation } from './storyWorkspaceChromePresentation.js';
import { renderStoryGenerationSpinner, syncStoryAsyncButton } from './storyAsyncButtonPresentation.js';
import {
  createStoryWorkspaceChromeProjection,
  getStoryEpisodeToolbarOptions,
  getStoryProjectCanvasEpisodes,
} from './storyWorkspaceChromeProjection.js';
import { backfillStoryVideoThumbnails } from './storyVideoThumbnailBackfill.js';
import { bindStoryVideoPreviewPlayer } from './storyVideoPlayback.js';
import { createStoryClipFrameProductionController } from './storyClipFrameProductionController.js';
import { playAssetCreateFly } from '../assetCreateFly.js';
import {
  buildStoryClipFrameMentionCandidates,
  buildStoryClipFrameMentionId,
  createStoryClipFrameHoverAsset,
  getStoryClipFrameMediaType,
  normalizeStoryClipFrames,
  removeStoryClipFrame,
  resolveStoryClipFrameImageUrl,
  resolveStoryClipFrameMediaUrl,
  resolveStoryClipFrameMentionRef,
  STORY_CLIP_MEDIA_TYPE_VIDEO,
  upsertStoryClipFrame,
} from './storyClipFrames.js';
import {
  canEnterStoryWorkspaceStep,
  canReuseStoryStepNavigation,
  createStoryWorkspaceNavigationTransaction,
  getStoryEpisodeGenerationControlState,
  getStoryVideoEpisodes,
  getStoryWorkspacePageTransitionDirection,
  getStoryWorkspaceTransitionDirection,
  normalizeStoryWorkspaceStep,
} from './storyWorkspaceNavigationTransaction.js';
import { exportStoryClipVideos } from './storyClipExport.js';
import {
  applyStoryAssetNativeDragPreview,
  hasStoryAssetDragData,
  readStoryAssetDragData,
  readStoryAssetDragItemIndex,
  writeStoryAssetDragData,
} from './storyAssetDrag.js';
import { createStoryAssetPromptDragController } from './storyAssetPromptDragController.js';
import { createStoryAssetHoverPreviewController } from './storyAssetHoverPreviewController.js';
import { bindWorkspaceEntityContextMenu } from '../workspaceEntityContextMenu.js';
import { resolveStoryWorkspaceContextMenuItems } from './storyWorkspaceContextMenu.js';
import { handleWorkspaceStepShortcut } from '../workspaceStepShortcut.js';
import { t } from '../../i18n/index.js';
import {
  _insertMentionPill,
  appendMentionPillToPrompt,
  bindPromptMentionHost,
  sanitizePromptHtmlForCommit,
} from '../nodePromptShared.js';
import { shouldSkipPromptTriggerForBulkInput } from '../promptTriggerComposition.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  STORY_REPLICATION_VIDEO_ACCEPT,
  findStoryReplicationEpisode,
  getStoryReplicationLocale,
  getStoryVideoReplicationFooterState,
  mergeStoryReplicationSourceFiles,
  reorderStoryVideoReplicationEpisodes,
  resolveStoryVideoReplicationClipVoiceAssetIds,
  resolveStoryVideoReplicationHomeTab,
  syncStoryVideoReplicationProject,
  validateStoryReplicationVideoFile,
} from './storyVideoReplication.js';
import {
  renderStoryVideoReplicationEpisodeRail,
  renderStoryVideoReplicationPage,
  syncStoryVideoReplicationCardElement,
} from './storyVideoReplicationPresentation.js';
import { bindStoryReplicationReview } from './storyReplicationReviewController.js';
import { addStoryLibraryAudioToProject, bindStoryAudioAssets } from './storyAudioAssetsController.js';
import { bindStoryAudioToCharacter } from './storyAudioAssets.js';
import { updateStoryReplicationReplacement } from './storyReplicationReplacement.js';
import { selectStoryWorkspaceSurface, getStoryProjectWorkspaceMode } from './storyWorkspaceSurface.js';
import {
  bindStoryReplicationIntake,
  syncStoryReplicationHomeSources,
} from './storyReplicationIntakeController.js';
import {
  previewReplicationCardOrder,
  setReplicationCardDragImage,
  settleReplicationCardMotion,
} from './storyReplicationCardMotion.js';
import { createStoryVideoReplicationWorkspaceController } from './storyVideoReplicationWorkspaceController.js';
import { createStoryHomeWorkspaceController } from './storyHomeWorkspaceController.js';
import { createAudioPlaybackSurfaceController } from '../../components/audio-node/audioPlaybackSurface.js';
import { clearDeletedStoryCanvasBindings } from './storyEpisodeCanvas.js';
import { reconcileStoryCanvasMediaNodes } from './storyCanvasMediaSync.js';
import { createStoryCanvasSyncWorkspaceController } from './storyCanvasSyncWorkspaceController.js';
import {
  beginStoryClipTimePillEdit,
  buildStoryClipMentionCandidates,
  createStoryClipTimeMentionIcon,
  getStoryAssetIdFromMentionNodeId,
  getStoryEpisodeCharacterVoiceEnabled,
  getStoryClipMentionVoiceState,
  renderStoryClipPromptMentions,
  resolveStoryClipAssetMentionRef,
  setStoryEpisodeCharacterVoiceEnabled,
  setStoryClipMentionVoiceEnabled,
  syncStoryClipPromptPillHoverTarget,
  syncStoryClipPromptPillPresentation,
} from './storyClipMentions.js';
import { clearStoryClipAdjustmentUndo } from './storyClipAdjustment.js';
import { createStoryClipAdjustmentController } from './storyClipAdjustmentController.js';
import {
  getStoryPromptModeLabel,
  normalizeStoryPromptMode,
  resolveStoryPromptModeDefaultVideoModelId,
} from './storyPromptModes.js';
import {
  STORY_CHARACTER_VOICE_SAMPLE_MAX_CHARACTERS,
  clearStoryCharacterVoiceReference,
  hasStoryCharacterVoiceReference,
  normalizeStoryCharacterVoiceReference,
  replaceStoryCharacterVoiceReference,
  selectStoryCharacterVoiceWorkflow,
} from './storyCharacterVoice.js';
import { createStoryCharacterVoiceWorkspaceController } from './storyCharacterVoiceWorkspaceController.js';
import { bindStoryOutlineNavigation, jumpToStoryOutlineSection } from './storyOutlineNavigation.js';
import {
  createStoryMarqueeSelectionController,
  createStoryAssetMarqueeConfig,
} from './storyMarqueeSelection.js';
import {
  STORY_ASSET_HOVER_CARD_SELECTOR,
  applyStoryEpisodePanelRatiosToLayout,
  beginStoryHorizontalResizeSession,
  captureStoryAssetListScrollPosition,
  captureStoryWorkspaceNestedScrollPositions,
  findStoryAssetForHover,
  getStoryAssetHoverCard,
  getStoryAssetHoverCardAppearanceId,
  getStoryAssetHoverCardId,
  isStoryGenerateShortcut,
  normalizeStoryAssetDetailSplitRatio,
  normalizeStoryAssetSplitRatio,
  normalizeStoryEpisodePanelRatios,
  restoreStoryAssetListScrollPosition,
  restoreStoryWorkspaceNestedScrollPositions,
  scrollStoryClipPromptHistoryWithWheel,
  scrollStoryClipStripWithWheel,
  shouldPreserveStoryWorkspaceNestedWheel,
} from './storyWorkspaceInteractions.js';
import { createStoryAssetLayoutResizeController } from './storyAssetLayoutResizeController.js';
import {
  STORY_CUSTOM_STYLE_MAX_CHARACTERS,
  STORY_EPISODE_COUNT_MAX,
  STORY_EPISODE_COUNT_OPTIONS,
  STORY_HOME_GENERATION_PROMPTS,
  STORY_IDEA_MAX_CHARACTERS,
  STORY_SCRIPT_MAX_CHARACTERS,
  getNextStoryScriptMode,
  markStorySummaryDownstreamStale,
  normalizeGeneratedStoryContract,
  normalizeGeneratedStoryContinuityFacts,
  normalizeStoryAspectRatio,
  normalizeStoryEpisodeCount,
  normalizeStoryProjectPlanning,
  normalizeStorySceneMaxSeconds,
  normalizeStoryScriptMode,
  resolveGeneratedProjectTitle,
  resolveStoryTextProviderProfileId,
} from './storyProjectPlanning.js';
import { deriveStoryProjectTaskState, reconcilePersistedStoryProjectTasks } from './storyProjectTaskState.js';
import {
  buildStoryAssetBatchGenerationPlan,
  buildStoryAssetGenerationPayload,
  getStoryAssetGenerationControlState,
  isStoryAssetAppearanceLoading,
  isStoryAssetBatchLoading,
  isStoryAssetCardLoading,
  isStoryAssetVoiceLoading,
  normalizeStoryImageGenerationParams,
  runStoryAssetBatchGenerationPhases,
  setStoryAssetAppearanceGenerating,
  setStoryAssetVoiceGenerating,
  settleStoryAssetBatchLoading,
} from './storyAssetGenerationState.js';
import {
  STORY_ASSET_TAB_LABELS,
  applyStoryLibraryAdditionUiState,
  applyStoryProjectUiState,
  createStoryProjectUiState,
  duplicateStoryProjectEntry,
  getStoryProjectHomeEntries,
  normalizeStoryEpisodeAssetRailTab,
  normalizeStoryProjectSortOrder,
  normalizeStoryProjectVoiceEditor,
  removeStoryProjectEntry,
} from './storyProjectSession.js';
import {
  applyStoryEpisodeVideoModelDefault,
  applyStoryPromptModeVideoModelDefault,
  applyStoryAspectRatioToVideoGenerationParams,
  applyStoryVideoInitialModeDefault,
  formatStoryClipVideoGenerationDuration,
  getStoryVideoFixedInputVisibilityKey,
  normalizeStoryVideoGenerationParams,
  reconcileStoryClipVideoGenerationDurationChange,
  recoverUnavailableStoryVideoModelState,
  resolveStoryClipVideoGenerationParams,
  resolveStoryClipVideoGenerationSettings,
  resolveStoryVideoClipDurationConstraints,
  resolveStoryVideoProvider,
  seedStoryAspectRatioInVideoGenerationParams,
  syncStoryPromptModeForVideoModel,
} from './storyVideoGenerationSettings.js';
import {
  getStoryEpisodeBatchControlState,
  getStoryEpisodeBatchTargets,
  getStoryEpisodeCardAction,
  isStoryAssetExtractionOperation,
  runStoryEpisodeSplitBatchTasks,
  setStoryEpisodeSplitRunning,
} from './storyPlanningTaskState.js';
export {
  addStoryLibraryAssetsToProject,
  applyStoryAspectRatioToVideoGenerationParams,
  applyStoryProjectUiState,
  buildStoryAssetBatchGenerationPlan,
  buildStoryAssetGenerationPayload,
  createStoryProjectUiState,
  duplicateStoryProjectEntry,
  getStoryAssetBreakdownEpisodes,
  getStoryAssetGenerationControlState,
  getStoryEpisodeBatchControlState,
  getStoryEpisodeBatchTargets,
  getStoryEpisodeCardAction,
  getStoryProjectHomeEntries,
  isStoryAssetAppearanceLoading,
  isStoryAssetBatchLoading,
  isStoryAssetCardLoading,
  isStoryAssetExperimentalExtractionAvailable,
  isStoryEpisodeExperimentalSplitAvailable,
  isStoryAssetVoiceLoading,
  isStoryAssetExtractionOperation,
  normalizeStoryEpisodeAssetRailTab,
  normalizeStoryImageGenerationParams,
  normalizeStoryProjectSortOrder,
  normalizeStoryVideoGenerationParams,
  recoverUnavailableStoryVideoModelState,
  removeStoryProjectEntry,
  renderStoryProjectCard,
  renderStoryProjectSortControl,
  renderStoryScriptModeControl,
  resolveStoryEpisodeCardMedia,
  resolveStoryClipVideoGenerationSettings,
  resolveStoryVideoClipDurationConstraints,
  runStoryAssetBatchGenerationPhases,
  runStoryEpisodeSplitBatchTasks,
  seedStoryAspectRatioInVideoGenerationParams,
  setStoryAssetAppearanceGenerating,
  setStoryAssetVoiceGenerating,
  setStoryEpisodeSplitRunning,
  settleStoryAssetBatchLoading,
  shouldUseStoryEpisodeExperimentalSplit,
  shouldUseStoryAssetBatchedExtraction,
  shouldUseStoryAssetParallelExtraction,
  resolveStoryEpisodeExperimentalErrorMessage,
};
export { syncStoryCharacterVoicePlayerPreviewUi } from './storyCharacterVoiceWorkspaceController.js';
const STORY_STEPS = Object['freeze']([
    { id: 0x1, label: '剧本' },
    { id: 0x2, label: '素材设定' },
    { id: 0x3, label: '分集视频' },
  ]),
  STORY_ASSET_TAB_ORDER = Object['freeze'](['character', 'scene', 'prop', 'audio', 'library']);
function escapeHtml(_0x279310) {
  return String(_0x279310 ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function normalizeText(_0x5ae674) {
  return String(_0x5ae674 || '')['trim']();
}
export function syncStoryClipFrameCardSaveError(_0x5977ed, _0x4505d5 = '') {
  if (!_0x5977ed) return ![];
  const _0x13ef38 = normalizeText(_0x4505d5);
  _0x5977ed['classList']?.['toggle']?.('is-save-error', Boolean(_0x13ef38));
  if (_0x13ef38) _0x5977ed['setAttribute']?.('data-tooltip', _0x13ef38);
  else _0x5977ed['removeAttribute']?.('data-tooltip');
  return (
    _0x5977ed['removeAttribute']?.('data-native-title'),
    _0x5977ed['removeAttribute']?.('data-tooltip-source'),
    _0x5977ed['removeAttribute']?.('title'),
    !![]
  );
}
export function toggleStoryAssetSelectAll(_0x4e477b = [], _0x17d67e = []) {
  return toggleWorkspaceAssetSelectAll(_0x4e477b, _0x17d67e);
}
export function toggleStoryAssetSelection(_0x35e09f = [], _0x1adbeb = '', _0xf9e584 = ![]) {
  return toggleWorkspaceAssetSelection(_0x35e09f, _0x1adbeb, _0xf9e584);
}
export function updateStoryAssetBatchButtonLabel(_0x1aacd2, _0x62ea62 = '') {
  const _0x2d6443 = _0x1aacd2?.['querySelector']?.('.story-asset-batch-trigger-label');
  if (!_0x2d6443) return ![];
  return ((_0x2d6443['textContent'] = String(_0x62ea62 ?? '')), !![]);
}
export function toggleStoryEpisodeSelectAll(_0x32f3a6 = [], _0x2a801a = []) {
  return toggleStoryAssetSelectAll(_0x32f3a6, _0x2a801a);
}
function toModelSearchText(_0x7a94be = {}) {
  return [_0x7a94be['label'], _0x7a94be['providerLabel'], _0x7a94be['description'], _0x7a94be['modelId']]
    ['filter'](Boolean)
    ['join']('\x20')
    ['toLowerCase']();
}
function isUsableImageUrl(_0x20aca4) {
  return /^(?:https?:|blob:|data:|\/|images\/|assets\/)/i['test'](normalizeText(_0x20aca4));
}
const storyClipProductionPresentation = createStoryClipProductionPresentation({
    localPathToUrl: localPathToUrl,
    isUsableImageUrl: isUsableImageUrl,
    renderImageOrEmpty: renderImageOrEmpty,
    renderDeleteIcon: renderStoryDeleteIcon,
    renderEpisodeCardActionIcon: renderStoryEpisodeCardActionIcon,
  }),
  { resolveEpisodeCardMedia: resolveStoryEpisodeCardMedia } = storyClipProductionPresentation,
  storyScriptPlanningPresentation = createStoryScriptPlanningPresentation(),
  storyAssetSettingsProjection = createStoryAssetSettingsProjection({
    resolveLibraryReference: resolveAssetMentionRef,
  }),
  storyAssetSettingsPresentation = createStoryAssetSettingsPresentation({
    renderAddToLibraryIcon: renderStoryAddToLibraryIcon,
    renderDeleteIcon: renderStoryDeleteIcon,
    renderDownloadButton: renderWorkspaceImageDownloadButton,
    renderHomeParamChevron: renderStoryHomeParamChevron,
    renderImage: renderImageOrEmpty,
    renderImageModelSelector: renderAIGenImageModelSelectorMarkup,
    renderLoadingOverlay: renderStoryAssetLoadingOverlay,
    renderPromptMentions: renderStoryAssetPromptMentions,
    renderSelectionActions: renderWorkspaceAssetSelectionActions,
    renderTabIcon: renderStoryAssetTabIcon,
    renderUploadIcon: renderStoryUploadIcon,
    renderVoiceFooter: buildAudioWorkflowFooterHtml,
  }),
  storyAssetSettingsWorkspacePresentation = createStoryAssetSettingsWorkspacePresentation({
    projection: storyAssetSettingsProjection,
    presentation: storyAssetSettingsPresentation,
    getTabLabel: getStoryAssetTabLabel,
    renderTabIcon: renderStoryAssetTabIcon,
    renderPageFooter: renderPageFooter,
  }),
  {
    getAppearanceActionKey: getStoryAssetAppearanceActionKey,
    getLibraryActionAssetIds: getStoryLibraryActionAssetIds,
    getSelectedAppearance: getSelectedAssetAppearance,
    getSelectedAppearanceIndex: getSelectedAssetAppearanceIndex,
    getSelectedAsset: getSelectedStoryAsset,
    getVisibleAssets: getVisibleStoryAssets,
    isAddedAppearance: isStoryAddedAssetAppearance,
    isSupportedCharacterVoiceFile: isSupportedStoryCharacterVoiceFile,
    renderAppearanceArrow: renderStoryAppearanceArrow,
    renderAssetBatchGenerationControl: renderStoryAssetBatchGenerationControl,
    renderAssetCard: renderStoryAssetCard,
    renderAssetDetail: renderStoryAssetDetail,
    renderAssetPreviewActions: renderStoryAssetPreviewActions,
    renderAssetPromptGenerationControl: renderStoryAssetPromptGenerationControl,
    renderAssetReferenceInput: renderStoryAssetReferenceInput,
    renderAssetsPage,
    renderClipNavigationArrow: renderStoryClipNavigationArrow,
    renderLibraryAddToProjectControl: renderStoryLibraryAddToProjectControl,
    renderLibrarySelectionActions: renderStoryLibrarySelectionActions,
    renderPreviewArrow: renderStoryPreviewArrow,
    renderVoiceIcon: renderStoryVoiceIcon,
    syncCharacterVoiceCapsuleState: syncStoryCharacterVoiceCapsuleState,
    syncCharacterVoicePlayerState: syncStoryCharacterVoicePlayerState,
  } = storyAssetSettingsWorkspacePresentation;
export {
  buildMissingStoryAssetImageWarning,
  formatStoryAssetOccurrences,
  getStoryAssetBatchDirectMode,
  getMissingStoryAssetImages,
  removeStoryAddedAssetAppearance,
  renderStoryAssetBatchGenerationControl,
  renderStoryAssetCard,
  renderStoryAssetDetail,
  renderStoryAssetPromptGenerationControl,
  renderStoryAssetReferenceInput,
  renderStoryLibraryAddToProjectControl,
  renderStoryLibrarySelectionActions,
  renderStoryPreviewArrow,
  shouldRenderStoryAssetRoleTag,
  syncStoryCharacterVoiceCapsuleState,
  syncStoryCharacterVoicePlayerState,
};
const storyWorkspaceChromeProjection = createStoryWorkspaceChromeProjection({ steps: STORY_STEPS }),
  storyWorkspaceChromePresentation = createStoryWorkspaceChromePresentation();
export function getStoryAssetHoverGridColumns(_0x1a663b) {
  const _0x468322 = Math['max'](0x1, Math['floor'](Number(_0x1a663b) || 0x1));
  return Math['ceil'](Math['sqrt'](_0x468322));
}
export function isStoryAssetHoverLandscape(_0x325fe1, _0x464f5a) {
  return isWorkspaceAssetHoverLandscape(_0x325fe1, _0x464f5a);
}
export function getGeneratedStoryAssetHoverAppearances(_0x4bc2ab = [], _0x565ed7 = '') {
  const _0x18e45b = normalizeText(_0x565ed7);
  return (Array['isArray'](_0x4bc2ab) ? _0x4bc2ab : [])['filter'](
    (_0x1b5e04) =>
      Boolean(normalizeText(_0x1b5e04?.['imageUrl'])) &&
      (!_0x18e45b || normalizeText(_0x1b5e04?.['id']) === _0x18e45b),
  );
}
export function buildStoryAssetHoverPreviewContent(
  _0x2b7d0f,
  {
    appearanceId: appearanceId = '',
    selectedAssetId: selectedAssetId = '',
    selectedAppearanceId: selectedAppearanceId = '',
    mediaOnly: mediaOnly = ![],
  } = {},
) {
  return buildWorkspaceAssetHoverPreviewContent(_0x2b7d0f, {
    appearanceId: appearanceId,
    selectedAssetId: selectedAssetId,
    selectedAppearanceId: selectedAppearanceId,
    mediaOnly: mediaOnly,
    getAppearances: getStoryAssetAppearances,
    hasVoiceReference: hasStoryCharacterVoiceReference,
  });
}
export function resolveStoryAppearanceWheelDelta(_0x475257) {
  const _0x1d77b5 = Number(_0x475257?.['deltaX'] || 0x0),
    _0x1c6780 = Number(_0x475257?.['deltaY'] || 0x0),
    _0x237cd8 = Math['abs'](_0x1c6780) >= Math['abs'](_0x1d77b5) ? _0x1c6780 : _0x1d77b5,
    _0x4a1433 = Number(_0x475257?.['deltaMode'] || 0x0),
    _0x457c0e = _0x4a1433 === 0x1 ? 0x10 : _0x4a1433 === 0x2 ? 0x320 : 0x1;
  return _0x237cd8 * _0x457c0e;
}
export function consumeStoryWheelDirection(
  _0x1b1ca7,
  _0x3692b8,
  { threshold: threshold = 0x18, lockDuration: lockDuration = 0xdc, now: now = Date['now']() } = {},
) {
  return consumeWorkspaceWheelDirection(_0x1b1ca7, _0x3692b8, {
    threshold: threshold,
    lockDuration: lockDuration,
    now: now,
  });
}
export function getStoryAssetTabLabel(_0x4f0f77) {
  return STORY_ASSET_TAB_LABELS[_0x4f0f77] || STORY_ASSET_TAB_LABELS['character'];
}
export function getStoryAssetTabTransitionDirection(_0x8368f7, _0x1bde36) {
  return resolveWorkspaceTabTransitionDirection(_0x8368f7, _0x1bde36, STORY_ASSET_TAB_ORDER);
}
export function renderStoryAssetTabIcon(_0x269781) {
  return renderWorkspaceAssetTabIcon(_0x269781);
}
const STORY_ASSET_PACKAGE_CATEGORY = '剧本资产';
export function buildStoryAssetPackageItemRequest({
  project: project = {},
  asset: asset = {},
  appearance: appearance = {},
  image: image = null,
} = {}) {
  const _0x54f97c = normalizeText(project?.['id']),
    _0x514c9e = normalizeText(asset?.['id']),
    _0xe89298 = normalizeText(appearance?.['id']),
    _0x183ac0 = normalizeText(project?.['title']) || '未命名剧本',
    _0x13f142 = ['scene', 'prop']['includes'](normalizeText(asset?.['kind']))
      ? normalizeText(asset['kind'])
      : 'character',
    _0x341f7a = getStoryAssetTabLabel(_0x13f142),
    _0x1b7292 = normalizeText(asset?.['name']) || '未命名' + _0x341f7a,
    _0x5948d4 = normalizeText(appearance?.['name']) || '基础形象',
    _0x5cfbcf =
      image && typeof image === 'object'
        ? image
        : {
            ...(appearance?.['generatedImage'] && typeof appearance['generatedImage'] === 'object'
              ? appearance['generatedImage']
              : {}),
            imageUrl: normalizeText(appearance?.['imageUrl']),
          };
  return {
    packageKey: 'story-project:' + _0x54f97c,
    packageName: _0x183ac0,
    category: STORY_ASSET_PACKAGE_CATEGORY,
    itemKey: 'story-appearance:' + _0x514c9e + ':' + _0xe89298,
    itemName: _0x341f7a + '｜' + _0x1b7292 + '｜' + _0x5948d4,
    image: {
      ..._0x5cfbcf,
      imageUrl: normalizeText(
        _0x5cfbcf['imageUrl'] || _0x5cfbcf['displayUrl'] || _0x5cfbcf['url'] || appearance?.['imageUrl'],
      ),
    },
    metadata: { sourceKind: 'story-workspace', sourceProjectId: _0x54f97c },
    itemMetadata: {
      sourceKind: 'story-workspace',
      sourceProjectId: _0x54f97c,
      sourceStoryAssetId: _0x514c9e,
      sourceStoryAppearanceId: _0xe89298,
      sourceStoryAssetKind: _0x13f142,
    },
  };
}
function renderImageOrEmpty({
  imageUrl: imageUrl = '',
  fallbackImageUrl: fallbackImageUrl = '',
  workspaceAssetLibraryImage: workspaceAssetLibraryImage = ![],
  alt: alt = '',
  className: className = '',
} = {}) {
  if (isUsableImageUrl(imageUrl)) {
    const _0x5107b2 = normalizeText(imageUrl),
      _0x2f2cb9 = normalizeText(fallbackImageUrl),
      _0x499a32 = workspaceAssetLibraryImage
        ? '\x20data-workspace-asset-library-image' +
          (isUsableImageUrl(_0x2f2cb9) && _0x2f2cb9 !== _0x5107b2
            ? ' data-workspace-asset-library-fallback-src="' + escapeHtml(_0x2f2cb9) + '\x22'
            : '')
        : '';
    return (
      '<img class="' +
      escapeHtml(className) +
      '" src="' +
      escapeHtml(_0x5107b2) +
      '" alt="' +
      escapeHtml(alt) +
      '\x22\x20loading=\x22lazy\x22\x20decoding=\x22async\x22' +
      _0x499a32 +
      '>'
    );
  }
  return (
    '<div\x20class=\x22' +
    escapeHtml(className) +
    '\x20story-media-empty\x22\x20role=\x22img\x22\x20aria-label=\x22' +
    escapeHtml(alt + '待生成') +
    '">\n    <span>待生成</span>\n  </div>'
  );
}
export { renderStoryGenerationSpinner };
export function renderStoryAssetLoadingOverlay({
  compact: compact = ![],
  title: title = '图片生成中',
  description: _0x3a085b,
} = {}) {
  return renderWorkspaceAssetLoadingOverlay({ compact: compact, title: title, description: _0x3a085b });
}
function renderModelIcon(_0x5164df, _0x590284 = 'story-model-icon') {
  if (!_0x5164df?.['icon'] || !isUsableImageUrl(_0x5164df['icon'])) return '';
  return (
    '<img class="' +
    escapeHtml(_0x590284) +
    '" src="' +
    escapeHtml(_0x5164df['icon']) +
    '\x22\x20alt=\x22\x22\x20loading=\x22eager\x22\x20decoding=\x22async\x22>'
  );
}
function renderModelPicker(_0x13cbef, _0x5c9d8b, _0x54c155) {
  const _0x551567 = _0x13cbef['models'][_0x5c9d8b],
    _0x3683be = getStoryWorkspaceModelChoice(_0x5c9d8b, _0x551567),
    _0x968126 = getStoryWorkspaceModelOptions(_0x5c9d8b),
    _0x1a90d9 = new Map();
  _0x968126['forEach']((_0x500fac) => {
    if (!_0x1a90d9['has'](_0x500fac['providerLabel'])) _0x1a90d9['set'](_0x500fac['providerLabel'], []);
    _0x1a90d9['get'](_0x500fac['providerLabel'])['push'](_0x500fac);
  });
  const _0x301384 = [..._0x1a90d9['entries']()]
    ['map'](
      ([_0x317315, _0x506658]) =>
        '<section class="story-model-group">\n        <h4>' +
        escapeHtml(_0x317315) +
        '</h4>\n        ' +
        _0x506658['map'](
          (_0x5a543a) =>
            '<button type="button" class="story-model-option ' +
            (_0x5a543a['modelId'] === _0x3683be?.['modelId'] ? 'is-selected' : '') +
            '" data-story-model-option="' +
            escapeHtml(_0x5a543a['modelId']) +
            '" data-story-model-kind="' +
            escapeHtml(_0x5c9d8b) +
            '" data-story-model-search="' +
            escapeHtml(toModelSearchText(_0x5a543a)) +
            '" role="option" aria-selected="' +
            (_0x5a543a['modelId'] === _0x3683be?.['modelId']) +
            '">\n              ' +
            renderModelIcon(_0x5a543a) +
            '\n              <span class="story-model-option-copy">\n                <strong>' +
            escapeHtml(_0x5a543a['label']) +
            '</strong>\n                <small>' +
            escapeHtml(_0x5a543a['description'] || _0x5a543a['providerLabel']) +
            '</small>\n              </span>\n              ' +
            (_0x5a543a['vip'] ? '<span\x20class=\x22story-model-vip\x22>VIP</span>' : '') +
            '\n            </button>',
        )['join']('') +
        '\n      </section>',
    )
    ['join']('');
  return (
    '<div\x20class=\x22story-model-picker\x22\x20data-story-model-picker=\x22' +
    escapeHtml(_0x54c155) +
    '">\n    <button type="button" class="story-model-trigger" data-story-model-trigger aria-haspopup="listbox" aria-expanded="false">\n      ' +
    renderModelIcon(_0x3683be) +
    '\n      <span class="story-model-trigger-copy">\n        <small>' +
    (_0x5c9d8b === 'text' ? '文本模型' : _0x5c9d8b === 'image' ? '图像模型' : '视频模型') +
    '</small>\n        <strong>' +
    escapeHtml(_0x3683be?.['label'] || '选择模型') +
    '</strong>\n      </span>\n    </button>\n    <div class="story-model-popover" data-story-model-popover role="listbox">\n      <label class="story-model-search-wrap">\n        <span>搜索模型</span>\n        <input type="search" class="story-model-search" data-story-model-search-input placeholder="输入模型或厂商名称" autocomplete="off">\n      </label>\n      <div class="story-model-options">' +
    _0x301384 +
    '</div>\n    </div>\n  </div>'
  );
}
export { getStoryEpisodeToolbarOptions, getStoryProjectCanvasEpisodes };
export function renderProjectToolbar(_0x2a9d16) {
  return storyWorkspaceChromePresentation['renderToolbar'](
    storyWorkspaceChromeProjection['projectToolbar'](_0x2a9d16),
  );
}
export function getStoryScriptWorkflowStage(_0x31c4f9 = {}) {
  const _0x3691b9 = _0x31c4f9?.['project'] || {},
    _0x6a4a8 = Array['isArray'](_0x31c4f9?.['episodes']) ? _0x31c4f9['episodes'] : [];
  if (_0x3691b9['sourceMode'] === 'upload-original')
    return compileStoryEpisodeScripts(_0x6a4a8)['complete'] ? 'scripts-complete' : 'scripts-pending';
  if (_0x3691b9['summaryStatus'] === 'generating') return 'summary-generating';
  if (!normalizeText(_0x3691b9['summary'])) return 'summary-pending';
  if (_0x3691b9['outlineStatus'] === 'generating') return 'outline-generating';
  if (_0x3691b9['outlineStatus'] === 'stale') return 'outline-stale';
  if (!_0x6a4a8['length']) return 'summary-ready';
  return compileStoryEpisodeScripts(_0x6a4a8)['complete'] ? 'scripts-complete' : 'scripts-pending';
}
export function updateStorySummaryCharacterField(
  _0xc1c465 = [],
  _0x197c03 = -0x1,
  _0x4216c0 = '',
  _0x5ab8de = '',
) {
  const _0x2cace9 = Array['isArray'](_0xc1c465) ? _0xc1c465[_0x197c03] : null,
    _0x2cce35 = new Set([
      'name',
      'roleType',
      'fixedTraits',
      'visualAppearance',
      'voiceDescription',
      'coreTags',
      'profile',
      'motivation',
      'personality',
      'relationships',
      'arc',
    ]);
  if (!_0x2cace9 || !_0x2cce35['has'](_0x4216c0)) return ![];
  return (
    _0x4216c0 === 'coreTags'
      ? (_0x2cace9['coreTags'] = String(_0x5ab8de || '')
          ['split'](/[、,，\n]+/)
          ['map']((_0x743cd2) => normalizeText(_0x743cd2))
          ['filter'](Boolean))
      : (_0x2cace9[_0x4216c0] = String(_0x5ab8de || '')),
    !![]
  );
}
export function updateStoryEpisodeOutlineField(
  _0x2da3e2 = {},
  _0x530659 = '',
  _0x37a45c = '',
  _0x2f2eda = '',
) {
  if (!['synopsis', 'hook']['includes'](_0x37a45c) || !Array['isArray'](_0x2da3e2?.['episodes'])) return ![];
  const _0x539842 = _0x2da3e2['episodes']['findIndex'](
    (_0x2002e8) => String(_0x2002e8?.['id'] || '') === String(_0x530659 || ''),
  );
  if (_0x539842 < 0x0) return ![];
  return (
    _0x2da3e2['episodes'][_0x539842]?.['script']?.['fullText'] &&
      (_0x2da3e2['episodes'] = invalidateStoryEpisodeScriptsFrom(_0x2da3e2['episodes'], _0x539842)),
    (_0x2da3e2['episodes'][_0x539842][_0x37a45c] = String(_0x2f2eda ?? '')),
    !![]
  );
}
export function isStoryOutlineSectionOpen(_0x105a46 = {}, _0x491046 = '', _0x4a6125 = ![]) {
  const _0xc8f148 = _0x105a46?.['outlineSectionOpenState'];
  if (_0xc8f148 && Object['prototype']['hasOwnProperty']['call'](_0xc8f148, _0x491046))
    return _0xc8f148[_0x491046] === !![];
  return Boolean(_0x4a6125);
}
function createStoryScriptPlanningEpisodeView(_0x12f9a2, _0x3c06f0, _0x1fd308) {
  const _0x3eea29 = Array['isArray'](_0x12f9a2['data']?.['episodes']) ? _0x12f9a2['data']['episodes'] : [],
    _0x3245f3 = _0x12f9a2['data']?.['project'] || {},
    _0x11084a = Math['max'](0x0, Math['trunc'](Number(_0x1fd308) || 0x0)),
    _0x1af8f9 = Math['max'](0x1, Math['trunc'](Number(_0x3c06f0?.['number']) || _0x11084a + 0x1)),
    _0x29fb3 = _0x3c06f0?.['id'],
    _0xcad4eb = normalizeText(_0x29fb3),
    _0x233265 = Boolean(_0x3c06f0?.['script']?.['fullText']),
    _0x5b33cd = _0x12f9a2['generatingEpisodeScriptId'] === _0x29fb3,
    _0x3e9fc5 = Array['isArray'](_0x12f9a2['selectedScriptEpisodeIds'])
      ? _0x12f9a2['selectedScriptEpisodeIds']
      : [],
    _0x174216 = normalizeText(_0x12f9a2['generatingEpisodeScriptId']);
  return {
    id: _0xcad4eb,
    index: _0x11084a,
    number: _0x1af8f9,
    title: _0x3c06f0?.['title'] || '',
    synopsis: _0x3c06f0?.['synopsis'] || '',
    hook: _0x3c06f0?.['hook'] || '',
    scriptFullText: _0x3c06f0?.['script']?.['fullText'] || '',
    isComplete: _0x233265,
    isGenerating: _0x5b33cd,
    isSelected: _0x3e9fc5['includes'](_0x29fb3),
    isOpen: _0x174216
      ? _0x5b33cd
      : isStoryOutlineSectionOpen(_0x12f9a2, 'episode-' + _0xcad4eb, _0x11084a < 0x2),
    canSelect: !_0x233265 && _0x11084a >= getNextStoryEpisodeScriptIndex(_0x3eea29),
    canGenerate:
      _0x3245f3['sourceMode'] !== 'upload-original' &&
      _0x3245f3['outlineStatus'] !== 'stale' &&
      canGenerateStoryEpisodeScript(_0x3eea29, _0x11084a),
    selectionMode: _0x12f9a2['scriptSelectionMode'] === !![],
    disabled: Boolean(_0x12f9a2['storyPlanningOperation']),
    generationMessage:
      _0x12f9a2['episodeScriptGenerationStatus'] || '正在生成第 ' + _0x1af8f9 + ' 集完整剧本',
    allowRegeneration:
      _0x3245f3['sourceMode'] !== 'upload-original' && _0x3245f3['outlineStatus'] !== 'stale',
    regeneration: {
      isConfirming: normalizeText(_0x12f9a2['pendingRegenerationTarget']) === 'episode-script:' + _0xcad4eb,
      disabled: Boolean(_0x12f9a2['storyPlanningOperation'] || _0x12f9a2['isGeneratingStory']),
    },
  };
}
function createStoryScriptPlanningEpisodeSectionView(_0x520c51) {
  const _0x4b4bc9 = _0x520c51['data']?.['project'] || {},
    _0x419749 = Array['isArray'](_0x520c51['data']?.['episodes']) ? _0x520c51['data']['episodes'] : [],
    _0x3cf99e = compileStoryEpisodeScripts(_0x419749),
    _0x3f830d = Array['isArray'](_0x520c51['selectedScriptEpisodeIds'])
      ? _0x520c51['selectedScriptEpisodeIds']
      : [],
    _0x398a8f = _0x3f830d['length'] ? getStoryEpisodeScriptBatchTargets(_0x419749, _0x3f830d) : [],
    _0x581b45 = _0x520c51['scriptSelectionMode'] === !![];
  return {
    episodes: _0x419749['map']((_0x5f4086, _0x15d52e) =>
      createStoryScriptPlanningEpisodeView(_0x520c51, _0x5f4086, _0x15d52e),
    ),
    isUploadedOriginal: _0x4b4bc9['sourceMode'] === 'upload-original',
    isOutlineGenerating: _0x520c51['storyPlanningOperation'] === 'planning-episode-outlines',
    loadingMessage: _0x520c51['storyPlanningStatus'] || '正在生成所有分集大纲...',
    complete: _0x3cf99e['complete'],
    selectionMode: _0x581b45,
    batchCount: _0x581b45
      ? _0x398a8f['length']
      : Math['max'](0x0, _0x3cf99e['totalCount'] - _0x3cf99e['completedCount']),
    isStale: _0x4b4bc9['outlineStatus'] === 'stale',
    busy: Boolean(_0x520c51['storyPlanningOperation']),
    batchGenerating: _0x520c51['storyPlanningOperation'] === 'writing-episode-scripts',
    batchCancelRequested: _0x520c51['episodeScriptBatchCancelRequested'] === !![],
  };
}
export function renderStoryEpisodeOutlineItem(_0x330c5f, _0x4a556c, _0x2177e3) {
  return storyScriptPlanningPresentation['renderPlanning']({
    kind: 'episode-item',
    item: createStoryScriptPlanningEpisodeView(_0x330c5f, _0x4a556c, _0x2177e3),
  });
}
function renderStoryAssetContinuationIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 18 12 8 18.5Z"/></svg>';
}
export function renderStoryEpisodeOutlineSection(_0x4882e5) {
  return storyScriptPlanningPresentation['renderPlanning']({
    kind: 'episode-section',
    section: createStoryScriptPlanningEpisodeSectionView(_0x4882e5),
  });
}
export function renderStoryTextRequestDebugAction({
  isDeveloperMode: isDeveloperMode = ![],
  action: action = '',
  title: title = '只预览下一次请求，不发送 API',
  disabled: disabled = ![],
} = {}) {
  if (!isDeveloperMode || !normalizeText(action)) return '';
  return renderRequestDebugButton(
    'data-story-action="' +
      escapeHtml(action) +
      '" title="' +
      escapeHtml(title) +
      '\x22\x20' +
      (disabled ? 'disabled' : ''),
  );
}
export function renderStoryScriptGenerationFooter(_0x58a4cb) {
  const _0x360da8 = compileStoryEpisodeScripts(_0x58a4cb['data']['episodes']),
    _0x14e94e = Math['max'](0x0, _0x360da8['totalCount'] - _0x360da8['completedCount']),
    _0x227b5b = getNextStoryEpisodeScriptIndex(_0x58a4cb['data']['episodes']),
    _0x34c6d5 = _0x58a4cb['data']['episodes'][_0x227b5b] || null,
    _0x510e2c = _0x34c6d5
      ? Math['max'](0x1, Math['trunc'](Number(_0x34c6d5['number']) || _0x227b5b + 0x1))
      : 0x0,
    _0x3f7284 = Boolean(_0x58a4cb['storyPlanningOperation']),
    _0x499e2b = _0x58a4cb['storyPlanningOperation'] === 'writing-episode-scripts',
    _0x90ddc7 = _0x58a4cb['storyPlanningOperation'] === 'writing-episode-script',
    _0x4b66a0 = _0x58a4cb['episodeScriptBatchCancelRequested'] === !![],
    _0x3c0edb = _0x58a4cb['scriptSelectionMode']
      ? getStoryEpisodeScriptBatchTargets(
          _0x58a4cb['data']['episodes'],
          _0x58a4cb['selectedScriptEpisodeIds'],
        )
      : [],
    _0x330b26 = _0x3c0edb['length'],
    _0x1cc0b4 = _0x58a4cb['scriptSelectionMode']
      ? 'data-story-action="generate-episode-scripts-batch" data-story-script-batch-scope="selected"'
      : 'data-story-action=\x22generate-next-episode-script\x22',
    _0x5b289e = _0x58a4cb['scriptSelectionMode']
      ? '生成 ' + _0x330b26 + '\x20集'
      : _0x34c6d5
        ? '生成第\x20' + _0x510e2c + '\x20集'
        : '已全部生成',
    _0x5bb749 = _0x3f7284 || (_0x58a4cb['scriptSelectionMode'] ? !_0x330b26 : !_0x34c6d5),
    _0x40629d = renderStoryTextRequestDebugAction({
      isDeveloperMode: Boolean(_0x58a4cb['experimentalSplitAvailable']),
      action: 'debug-episode-script-request',
      title: '只预览下一集正文的实际请求，不发送\x20API',
      disabled: _0x3f7284 || !_0x34c6d5,
    }),
    _0x22c80e = _0x499e2b
      ? '<button type="button" class="story-primary-button" data-story-action="cancel-episode-scripts-batch" aria-label="取消尚未开始的分集" ' +
        (_0x4b66a0 ? 'disabled' : '') +
        '>' +
        (_0x4b66a0 ? '已取消排队' : '取消') +
        '</button>'
      : '<button type="button" class="story-secondary-button" data-story-action="generate-episode-scripts-batch" data-story-script-batch-scope="all" ' +
        (_0x3f7284 || !_0x14e94e ? 'disabled' : '') +
        '>生成全集</button>\x0a\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x22\x20' +
        _0x1cc0b4 +
        '\x20' +
        (_0x5bb749 ? 'disabled' : '') +
        ' aria-busy="' +
        _0x90ddc7 +
        '\x22>' +
        (_0x90ddc7 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
        escapeHtml(_0x90ddc7 ? _0x58a4cb['storyPlanningStatus'] || '正在生成分集正文' : _0x5b289e) +
        '</button>';
  return renderPageFooter(_0x58a4cb, {
    title: '分集大纲生成完成后，将按顺序生成剧本正文',
    hint:
      _0x58a4cb['episodeScriptGenerationStatus'] ||
      '已完成 ' + _0x360da8['completedCount'] + '/' + _0x360da8['totalCount'] + '\x20集',
    actionsMarkup:
      '\n      ' +
      renderStoryPlanningTextModelPicker(_0x58a4cb, 'script', { disabled: _0x3f7284 }) +
      '\n      ' +
      _0x40629d +
      '\n      ' +
      _0x22c80e +
      '\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x20story-script-continue-button\x22\x20data-story-action=\x22continue-to-assets\x22\x20aria-label=\x22进入下一步：人设与素材拆解\x22\x20' +
      (_0x3f7284 ? 'disabled' : '') +
      '>' +
      renderStoryAssetContinuationIcon() +
      '</button>',
  });
}
export { getStoryAssetExperimentalDraftDisplay, isStoryAssetLocalQualityRevalidationDraft };
export function renderStoryAssetExtractionFooter(_0x5304af = {}) {
  const _0xe52e9c = Boolean(_0x5304af['storyPlanningOperation']),
    _0x17c1d1 = _0x5304af['storyPlanningOperation'] === 'extracting-assets-experimental',
    _0x539286 = _0x5304af['storyPlanningStatus'] || '正在提取角色、场景与道具',
    _0x547274 = getStoryAssetExperimentalDraftDisplay(_0x5304af['data']?.['assetExtractionDraft']),
    _0x2b7459 = getStoryAssetExperimentalDraftDisplay(
      _0x5304af['data']?.['experimentalAssetExtractionDraft'],
    ),
    _0x4a6949 =
      _0x5304af['storyPlanningOperation'] === 'extracting-assets-experimental'
        ? '混合提取中'
        : _0x2b7459['hasProgress']
          ? _0x2b7459['actionLabel']
          : '开发测试',
    _0x560574 = _0x2b7459['hasProgress']
      ? _0x2b7459['summary']
      : '开发测试\x20V1：先由本地\x20PP-UIE\x20建立候选清单；中短剧本仍把完整原文交给角色、场景、道具三条专用\x20API，超长剧本只提交受预算约束的剧情证据。每类最多一次且不自动重试；失败不会写入本地兜底提示词，也不会覆盖现有素材',
    _0xb0d29a = _0x2b7459['hasProgress'] ? '' : '\x20title=\x22' + escapeHtml(_0x560574) + '\x22',
    _0x577cae = _0xe52e9c
      ? _0x539286
      : _0x547274['hasProgress']
        ? _0x547274['actionLabel']
        : '下一步：提取角色、场景与道具',
    _0x61a337 = renderStoryPlanningTextModelPicker(_0x5304af, 'assets', {
      disabled: _0xe52e9c,
      className: _0x547274['needsModelChange'] ? 'story-asset-recovery-model-picker' : '',
    }),
    _0x35eea3 = _0x5304af['experimentalAssetExtractionAvailable']
      ? '<button type="button" class="story-secondary-button story-experimental-asset-extraction" data-story-action="extract-assets-experimental"' +
        _0xb0d29a +
        '\x20' +
        (_0xe52e9c ? 'disabled' : '') +
        ' aria-busy="' +
        _0x17c1d1 +
        '\x22>' +
        (_0x17c1d1 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
        escapeHtml(_0x4a6949) +
        '</button>'
      : '',
    _0x372c79 = renderStoryTextRequestDebugAction({
      isDeveloperMode: Boolean(_0x5304af['experimentalAssetExtractionAvailable']),
      action: 'debug-asset-extraction-experimental-request',
      title: '只预览首批本地素材抽取输入，不运行模型',
      disabled: _0xe52e9c,
    });
  return renderPageFooter(_0x5304af, {
    nextLabel: '下一步：提取角色、场景与道具',
    nextAction: 'extract-assets',
    title: _0x547274['hasProgress'] ? '素材提取进度' : '',
    hint: _0x547274['summary'] || _0x2b7459['summary'],
    actionsMarkup:
      '\n      ' +
      _0x372c79 +
      '\n      ' +
      _0x35eea3 +
      '\n      ' +
      _0x61a337 +
      '\x0a\x20\x20\x20\x20\x20\x20' +
      renderRequestDebugButton('data-story-action="debug-asset-extraction-request"') +
      '\n      <button type="button" class="story-next-button" data-story-action="extract-assets" ' +
      (_0xe52e9c ? 'disabled' : '') +
      ' aria-busy="' +
      _0xe52e9c +
      '\x22>' +
      (_0xe52e9c ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      '<span>' +
      escapeHtml(_0x577cae) +
      '</span>' +
      (_0xe52e9c ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
      '</button>',
  });
}
export function renderStoryEpisodeOutlinePlanningFooter(_0x18bc4e = {}, { stale: stale = ![] } = {}) {
  const _0x212562 = Boolean(_0x18bc4e['storyPlanningOperation']),
    _0x415012 = stale ? '重新运行' : '生成分集大纲',
    _0x5eb1c0 = renderStoryTextRequestDebugAction({
      isDeveloperMode: Boolean(_0x18bc4e['experimentalSplitAvailable']),
      action: 'debug-episode-outline-request',
      title: '只预览生成分集大纲的实际请求，不发送 API',
      disabled: _0x212562,
    }),
    _0x1eea5 = _0x212562 ? _0x18bc4e['storyPlanningStatus'] || '正在生成分集大纲' : _0x415012;
  return renderPageFooter(_0x18bc4e, {
    nextLabel: _0x415012,
    nextAction: 'plan-episode-outlines',
    title: stale ? '故事蓝图已修改' : '',
    hint: stale ? '现有分集内容仍然保留；重新运行后将按当前蓝图更新' : '',
    actionsMarkup:
      '\n      ' +
      renderStoryPlanningTextModelPicker(_0x18bc4e, 'outline', { disabled: _0x212562 }) +
      '\n      ' +
      _0x5eb1c0 +
      '\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-next-button\x22\x20data-story-action=\x22plan-episode-outlines\x22\x20' +
      (_0x212562 ? 'disabled' : '') +
      ' aria-busy="' +
      _0x212562 +
      '\x22>' +
      (_0x212562 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      '<span>' +
      escapeHtml(_0x1eea5) +
      '</span>' +
      (_0x212562 ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
      '</button>',
  });
}
function createStoryScriptPlanningPageView(_0x1ebcbd, _0x404e70 = '') {
  const _0xe6add6 = _0x1ebcbd['data']?.['project'] || {},
    _0x166b54 = Array['isArray'](_0x1ebcbd['data']?.['episodes']) ? _0x1ebcbd['data']['episodes'] : [],
    _0x142c5b = _0xe6add6['sourceMode'] === 'upload-original',
    _0x37367a = _0xe6add6['sourceMode'] === 'upload-rewrite',
    _0x5c0e8e = _0x1ebcbd['storyPlanningOperation'] === 'planning-episode-outlines',
    _0x263e92 = Boolean(_0x5c0e8e || (_0x1ebcbd['scriptGenerationFocusMode'] && _0x166b54['length'])),
    _0x230866 = !_0x263e92 && isStoryOutlineSectionOpen(_0x1ebcbd, 'original', !![]),
    _0x5e8616 = !_0x263e92 && isStoryOutlineSectionOpen(_0x1ebcbd, 'summary', !![]),
    _0x3724b6 = _0x263e92 || isStoryOutlineSectionOpen(_0x1ebcbd, 'episodes', !![]),
    _0x14147f = Boolean(_0x1ebcbd['storyPlanningOperation'] || _0x1ebcbd['isGeneratingStory']);
  return {
    isUploadedOriginal: _0x142c5b,
    isUploadedRewrite: _0x37367a,
    originalCreative: _0xe6add6['originalCreative'] || _0xe6add6['sourceDocument']?.['text'] || '',
    rewriteInstruction: _0xe6add6['rewriteInstruction'] || '',
    originalOpen: _0x230866,
    summaryOpen: _0x5e8616,
    episodesOpen: _0x3724b6,
    summary: {
      status: _0xe6add6['summaryStatus'],
      loadingMessage: _0x1ebcbd['generationStatus'] || '正在根据原始创意生成剧本摘要...',
      isStale: _0xe6add6['outlineStatus'] === 'stale',
      episodeCount: normalizeStoryEpisodeCount(_0xe6add6['planning']?.['episodeCount']),
      storyType: _0xe6add6['storyType'],
      targetAudience: _0xe6add6['targetAudience'],
      logline: _0xe6add6['logline'],
      coreHook: _0xe6add6['coreHook'],
      synopsis: _0xe6add6['summary'],
      background: _0xe6add6['background'],
      setting: _0xe6add6['setting'],
      contract: _0xe6add6['storyContract'],
      plotBeats: _0xe6add6['plotBeats'],
      continuityFacts: _0xe6add6['continuityFacts'],
      characters: _0xe6add6['characters'] || [],
    },
    summaryRegeneration: {
      isConfirming: normalizeText(_0x1ebcbd['pendingRegenerationTarget']) === 'summary',
      disabled: _0x14147f,
    },
    outlineRegeneration: {
      isConfirming: normalizeText(_0x1ebcbd['pendingRegenerationTarget']) === 'episode-outlines',
      disabled: _0x14147f,
    },
    outlineStatus: _0xe6add6['outlineStatus'],
    episodeSection: createStoryScriptPlanningEpisodeSectionView(_0x1ebcbd),
    footerMarkup: _0x404e70,
  };
}
export function renderOutlinePage(_0x25c994) {
  const _0x3d895b = _0x25c994['data']?.['project'] || {},
    _0x5117a5 = getStoryScriptWorkflowStage(_0x25c994['data']),
    _0x1fb56f = _0x3d895b['sourceMode'] === 'upload-original',
    _0xa7f4b7 = _0x25c994['storyPlanningOperation'] === 'planning-episode-outlines',
    _0x142184 = _0xa7f4b7
      ? renderStoryEpisodeOutlinePlanningFooter(_0x25c994, { stale: _0x3d895b['outlineStatus'] === 'stale' })
      : _0x5117a5 === 'scripts-pending'
        ? _0x1fb56f
          ? renderStoryAssetExtractionFooter(_0x25c994)
          : renderStoryScriptGenerationFooter(_0x25c994)
        : _0x5117a5 === 'summary-ready'
          ? renderStoryEpisodeOutlinePlanningFooter(_0x25c994)
          : _0x5117a5 === 'outline-stale'
            ? renderStoryEpisodeOutlinePlanningFooter(_0x25c994, { stale: !![] })
            : _0x5117a5 === 'scripts-complete'
              ? renderStoryAssetExtractionFooter(_0x25c994)
              : '';
  return storyScriptPlanningPresentation['renderPlanning']({
    kind: 'page',
    page: createStoryScriptPlanningPageView(_0x25c994, _0x142184),
  });
}
export function renderStoryAssetBreakdownPage(_0x2f7c52 = {}) {
  const _0x514c69 = getStoryAssetBreakdownEpisodes(_0x2f7c52),
    _0x4c496d = Math['trunc'](Number(_0x2f7c52['assetBreakdownVisibleCount']) || 0x0),
    _0x2caa52 = Math['min'](_0x514c69['length'], Math['max'](_0x514c69['length'] ? 0x1 : 0x0, _0x4c496d)),
    _0x12d633 = _0x514c69['slice'](0x0, _0x2caa52);
  return storyScriptPlanningPresentation['renderAssetBreakdown']({ episodes: _0x12d633 });
}
function renderStoryChapter(_0x5026c9, _0x11c5a4) {
  return (
    '<article class="story-chapter-card" data-story-chapter-index="' +
    _0x11c5a4 +
    '">\n    <label class="story-chapter-title"><span>第 ' +
    (_0x11c5a4 + 0x1) +
    ' 章</span><input type="text" value="' +
    escapeHtml(_0x5026c9['title'] || '') +
    '" data-story-chapter-title="' +
    _0x11c5a4 +
    '"></label>\n    <label class="story-chapter-content"><span>章节正文</span><textarea data-story-chapter-content="' +
    _0x11c5a4 +
    '\x22>' +
    escapeHtml(_0x5026c9['content'] || '') +
    '</textarea></label>\n  </article>'
  );
}
export function renderStoryEpisodeCardActionIcon(_0x1ba47b = 'generate') {
  if (_0x1ba47b === 'edit')
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19h4l10-10-4-4L5 15v4Z"/><path d="m13.5 6.5 4 4M5 19l4-1"/></svg>';
  if (_0x1ba47b === 'regenerate')
    return '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M20\x2011a8\x208\x200\x201\x200-2.34\x205.66\x22/><path\x20d=\x22M20\x204v7h-7\x22/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="12" height="14" rx="2"/><path d="M4 10h12M8 5v14M18.5 4v5M16 6.5h5"/></svg>';
}
export function renderStoryEpisodeExperimentalSplitAction(
  _0x5196f2 = {},
  { isDeveloperMode: isDeveloperMode = ![], disabled: disabled = ![], busy: busy = ![] } = {},
) {
  if (!isDeveloperMode) return '';
  const _0x2406d5 = Math['max'](0x1, Math['trunc'](Number(_0x5196f2?.['number']) || 0x1)),
    _0x321ee7 = getStoryEpisodeCardAction(_0x5196f2);
  return (
    '<button type="button" class="story-episode-experimental-split story-episode-experimental-split--after-' +
    _0x321ee7['kind'] +
    '" data-story-action="experimental-split-episode" data-story-episode-id="' +
    escapeHtml(_0x5196f2?.['id']) +
    '" aria-label="使用开发测试生成第 ' +
    _0x2406d5 +
    '\x20集\x22\x20title=\x22仅开发者模式可用：使用实验性分批生成流程，先规划整集蓝图，再分批生成\x203–5\x20个片段\x22\x20' +
    (disabled ? 'disabled' : '') +
    '\x20aria-busy=\x22' +
    busy +
    '\x22>' +
    (busy ? renderStoryGenerationSpinner({ button: !![] }) : renderStoryEpisodeCardActionIcon('generate')) +
    '<span>' +
    (busy ? '生成中' : '开发测试') +
    '</span></button>'
  );
}
export function renderStoryEpisodeExperimentalModeToggle(_0x197c60 = ![], { disabled: disabled = ![] } = {}) {
  const _0x4c4831 = ![];
  disabled = !![];
  const _0x559e08 = '实验模式暂未开放';
  return (
    '<button type="button" class="story-experimental-mode-toggle ' +
    (_0x4c4831 ? 'is-active' : '') +
    '" data-story-action="toggle-experimental-split-mode" aria-pressed="' +
    _0x4c4831 +
    '\x22\x20aria-label=\x22' +
    (_0x4c4831 ? '关闭' : '开启') +
    '实验模式\x22\x20title=\x22' +
    _0x559e08 +
    '\x22\x20' +
    (disabled ? 'disabled' : '') +
    '><span class="story-experimental-mode-track" aria-hidden="true"><span class="story-experimental-mode-thumb"></span></span><span class="story-experimental-mode-label">实验模式</span></button>'
  );
}
export function renderStoryEpisodeRequestDebugAction(
  _0x485c95 = {},
  { isDeveloperMode: isDeveloperMode = ![], disabled: disabled = ![] } = {},
) {
  if (!isDeveloperMode) return '';
  const _0x32a7d5 = Math['max'](0x1, Math['trunc'](Number(_0x485c95?.['number']) || 0x1)),
    _0x2c73b8 = getStoryEpisodeCardAction(_0x485c95);
  return renderRequestDebugButton(
    'data-story-action="debug-experimental-split-request" data-story-episode-id="' +
      escapeHtml(_0x485c95?.['id']) +
      '" title="调试第 ' +
      _0x32a7d5 +
      '\x20集实验分批请求\x22\x20' +
      (disabled ? 'disabled' : ''),
  );
}
export function renderStoryEpisodeSplitDraftStatus(_0x504d3a = {}, { disabled: disabled = ![] } = {}) {
  const _0x594f55 = _0x504d3a?.['splitDraft'],
    _0x3016ca = Array['isArray'](_0x594f55?.['items']) ? _0x594f55['items'] : [],
    _0x571597 = _0x3016ca['reduce'](
      (_0x189d04, _0xfa496a) =>
        _0x189d04 +
        (_0xfa496a?.['status'] === 'valid' && Array['isArray'](_0xfa496a?.['clips'])
          ? _0xfa496a['clips']['length']
          : 0x0),
      0x0,
    ),
    _0x46878e = _0x3016ca['filter']((_0x1056be) => _0x1056be?.['status'] !== 'valid'),
    _0x149540 = _0x46878e['length'];
  if (!_0x149540) return '';
  const _0x58298e = normalizeText(
      (Array['isArray'](_0x594f55?.['rejectedClips']) ? _0x594f55['rejectedClips'] : [])['find'](
        (_0x5a640a) => normalizeText(_0x5a640a?.['message']),
      )?.['message'] ||
        _0x46878e['find']((_0x4e3b17) => normalizeText(_0x4e3b17?.['error']?.['message']))?.['error']?.[
          'message'
        ],
    ),
    _0x4ff1d7 = _0x46878e['some'](
      (_0x5977f9) => Array['isArray'](_0x5977f9?.['rawClips']) && _0x5977f9['rawClips']['length'] > 0x0,
    ),
    _0x3697bf = _0x571597 > 0x0 || _0x4ff1d7,
    _0x424040 = _0x571597 > 0x0 ? '应用 ' + _0x571597 + ' 个合格片段' : '重新校验已保存结果',
    _0x21bb74 =
      _0x571597 > 0x0 ? '只应用已通过校验的片段，不调用模型' : '使用当前规则重新校验已保存的片段，不调用模型',
    _0x13d487 = _0x3697bf
      ? '<button type="button" class="story-secondary-button story-episode-split-draft-repair" data-story-action="repair-episode-split-draft" data-story-episode-id="' +
        escapeHtml(_0x504d3a?.['id']) +
        '\x22\x20title=\x22' +
        _0x21bb74 +
        '\x22\x20' +
        (disabled ? 'disabled' : '') +
        '>' +
        _0x424040 +
        '</button>'
      : '<span class="story-episode-split-draft-guidance">请点击右上角重新生成</span>';
  return (
    '<div class="story-episode-split-draft" role="status" aria-live="polite">\n    <span class="story-episode-split-draft-copy">本次返回未完全通过：已保留 ' +
    _0x571597 +
    ' 个合格片段和 ' +
    _0x149540 +
    ' 项原始错误；当前旧版本未被覆盖。' +
    (_0x58298e ? ' 失败原因：' + escapeHtml(_0x58298e) : '') +
    '</span>\x0a\x20\x20\x20\x20' +
    _0x13d487 +
    '\n  </div>'
  );
}
function createStoryEpisodeCardPresentation(_0x4d6ecd, _0x4ffffd) {
  const _0xc6e09c = _0x4d6ecd['selectedEpisodeIds']['includes'](_0x4ffffd['id']),
    _0x4376a2 = Array['isArray'](_0x4d6ecd?.['data']?.['assets']),
    _0xe7ce96 = _0x4376a2
      ? deriveStoryEpisodeAssetSummary(_0x4ffffd, _0x4d6ecd['data']['assets'])
      : {
          characterCount: Number(_0x4ffffd?.['characterCount']) || 0x0,
          sceneCount: Number(_0x4ffffd?.['sceneCount']) || 0x0,
          propCount: Number(_0x4ffffd?.['propCount']) || 0x0,
        },
    _0x420f07 = getStoryEpisodeGenerationControlState(_0x4d6ecd, _0x4ffffd['id']),
    _0x4d8db9 = _0x420f07['isGenerating'],
    _0x59fa0f = deriveStoryEpisodeStatus(_0x4ffffd['clips']),
    _0x591ba4 = getStoryEpisodeCardAction(_0x4ffffd),
    _0xfd769c = _0x4d6ecd['episodeSelectionMode'] === !![];
  return {
    id: _0x4ffffd['id'],
    number: _0x4ffffd['number'],
    sequenceLabel:
      _0x4d6ecd['data']?.['project']?.['sourceMode'] === 'video-replication'
        ? '视频 ' + _0x4ffffd['number']
        : '第\x20' + _0x4ffffd['number'] + '\x20集',
    posterLayout: _0x4d6ecd['workspaceSurface'] === 'replication',
    title: _0x4ffffd['title'],
    status: _0x4ffffd['storyboardStale'] ? '分镜待更新' : _0x59fa0f === '待生成' ? '分镜已生成' : _0x59fa0f,
    characterCount: _0xe7ce96['characterCount'],
    sceneCount: _0xe7ce96['sceneCount'],
    propCount: _0xe7ce96['propCount'],
    clipCount: _0x4ffffd['clipCount'],
    isChecked: _0xc6e09c,
    isSelectionMode: _0xfd769c,
    isSplitting: _0x4d8db9,
    disabled: _0x420f07['disabled'],
    actionKind: _0x591ba4['kind'],
    actionLabel: _0x591ba4['label'],
    media: resolveStoryEpisodeCardMedia(_0x4ffffd),
    experimentalActionMarkup: renderStoryEpisodeExperimentalSplitAction(_0x4ffffd, {
      isDeveloperMode: Boolean(_0x4d6ecd['experimentalSplitAvailable']),
      disabled: _0x420f07['disabled'],
      busy: _0x4d8db9,
    }),
    requestDebugMarkup: renderStoryEpisodeRequestDebugAction(_0x4ffffd, {
      isDeveloperMode: Boolean(_0x4d6ecd['experimentalSplitAvailable']),
      disabled: _0x420f07['disabled'],
    }),
    splitDraftMarkup: renderStoryEpisodeSplitDraftStatus(_0x4ffffd, { disabled: _0x420f07['disabled'] }),
  };
}
export function renderEpisodeCard(_0x1c10c9, _0x51afb2) {
  return storyClipProductionPresentation['renderOverview']({
    kind: 'card',
    card: createStoryEpisodeCardPresentation(_0x1c10c9, _0x51afb2),
  });
}
export function renderEpisodesPage(_0x3e3b04) {
  const _0x1e77a7 = getStoryEpisodeBatchControlState(_0x3e3b04),
    _0x319795 = getStoryVideoEpisodes(_0x3e3b04['data']['episodes']),
    _0x9201cb = shouldUseStoryEpisodeExperimentalSplit(_0x3e3b04),
    _0x1be395 =
      _0x1e77a7['disabled'] ||
      (Array['isArray'](_0x3e3b04['splittingEpisodeIds']) &&
        _0x3e3b04['splittingEpisodeIds']['length'] > 0x0),
    _0x2ce9b9 =
      _0x319795['length'] > 0x0 &&
      _0x319795['every']((_0x55e10f) => _0x3e3b04['selectedEpisodeIds']['includes'](_0x55e10f['id']));
  return storyClipProductionPresentation['renderOverview']({
    kind: 'page',
    title: _0x3e3b04['workspaceSurface'] === 'replication' ? '视频列表' : '分集视频',
    eyebrow: _0x3e3b04['workspaceSurface'] === 'replication' ? '分段提示词与视频制作' : '剧本拆分结果',
    description:
      _0x3e3b04['workspaceSurface'] === 'replication'
        ? ''
        : '每一集会形成一套片段脚本；确认后可创建为新的画布页面。',
    experimentalMode: _0x9201cb,
    experimentalModeToggleMarkup: renderStoryEpisodeExperimentalModeToggle(_0x9201cb, {
      disabled: _0x1be395,
    }),
    selectionMode: _0x3e3b04['episodeSelectionMode'] === !![],
    allEpisodesSelected: _0x2ce9b9,
    selectedCount: _0x3e3b04['selectedEpisodeIds']['length'],
    batchControl: _0x1e77a7,
    cards: _0x319795['map']((_0x304f7f) => createStoryEpisodeCardPresentation(_0x3e3b04, _0x304f7f)),
    footerMarkup: renderPageFooter(_0x3e3b04, {
      nextLabel: '保存并返回项目列表',
      isLast: !![],
      leadingActionsMarkup: renderStoryPlanningTextModelPicker(_0x3e3b04, 'video', {
        disabled: Boolean(_0x3e3b04['storyPlanningOperation']),
      }),
    }),
  });
}
function renderPageFooter(_0x5964eb, _0x2bfffa = {}) {
  return storyWorkspaceChromePresentation['renderFooter'](
    storyWorkspaceChromeProjection['projectFooter'](_0x5964eb, _0x2bfffa),
  );
}
function getSelectedEpisode(_0x369ee9) {
  return (
    _0x369ee9['data']['episodes']['find'](
      (_0x1a19a5) => _0x1a19a5['id'] === _0x369ee9['selectedEpisodeId'],
    ) || _0x369ee9['data']['episodes'][0x0]
  );
}
function getSelectedClip(_0x3e6b63, _0x3a3d93) {
  return (
    _0x3a3d93?.['clips']?.['find']((_0x51e01f) => _0x51e01f['id'] === _0x3e6b63['selectedClipId']) ||
    _0x3a3d93?.['clips']?.[0x0] ||
    null
  );
}
function getStoryEpisodeAssetRailHelp(_0x1be391) {
  if (_0x1be391 === 'frames') return '视频提取画面与裁剪片段，可拖入提示词或删除';
  if (_0x1be391 === 'library') return '连接画布素材库，可拖入提示词';
  return '拖入提示词';
}
export function renderEpisodeAssetRail(_0x22e22f) {
  const _0x4ed26c = getSelectedEpisode(_0x22e22f),
    _0x18aeed = deriveStoryEpisodeAssetSummary(_0x4ed26c, _0x22e22f['data']['assets'])['assets'],
    _0x211595 = normalizeText(_0x4ed26c?.['id']),
    _0x542ab4 = Array['isArray'](_0x4ed26c?.['clips']) ? _0x4ed26c['clips'] : [],
    _0x403ccd = new Set(_0x542ab4['map']((_0x276c00) => normalizeText(_0x276c00?.['id']))['filter'](Boolean)),
    _0x2f770 = normalizeStoryClipFrames(_0x22e22f['data']['clipFrames'])['filter']((_0x3310ae) => {
      const _0x495600 = normalizeText(_0x3310ae['episodeId']);
      if (_0x495600) return _0x495600 === _0x211595;
      return _0x403ccd['has'](normalizeText(_0x3310ae['clipId']));
    }),
    _0x5cbab1 = normalizeStoryEpisodeAssetRailTab(_0x22e22f['episodeAssetRailTab']),
    _0x50da1e = buildWorkspaceAssetLibraryItems({ allowedTypes: null })['map']((_0x402e76) => {
      const _0x2097a8 = normalizeText(_0x402e76['mediaKind']);
      return {
        ..._0x402e76,
        mediaKind: _0x2097a8,
        imageUrl:
          _0x2097a8 === 'image'
            ? normalizeText(_0x402e76['thumbnailUrl'] || _0x402e76['sourceUrl'])
            : normalizeText(_0x402e76['thumbnailUrl']),
        typeLabel: getWorkspaceAssetLibraryMediaLabel(_0x2097a8),
      };
    });
  return storyClipProductionPresentation['renderAssetRail']({
    activeTab: _0x5cbab1,
    helpText: getStoryEpisodeAssetRailHelp(_0x5cbab1),
    assetKindLabels: Object['fromEntries'](
      ['character', 'scene', 'prop']['map']((_0x4bf6d5) => [_0x4bf6d5, getStoryAssetTabLabel(_0x4bf6d5)]),
    ),
    assets: _0x18aeed['map']((_0x41d481) => ({
      id: _0x41d481['id'],
      name: _0x41d481['name'],
      kind: _0x41d481['kind'],
      imageUrl:
        getStoryAssetBaseAppearance(_0x41d481)?.['imageUrl'] ||
        getStoryAssetAppearances(_0x41d481)['find']((_0x5eb4f9) => normalizeText(_0x5eb4f9['imageUrl']))?.[
          'imageUrl'
        ] ||
        '',
    })),
    clips: _0x542ab4['map']((_0x21ab9f) => ({ id: _0x21ab9f?.['id'], title: _0x21ab9f?.['title'] })),
    frames: _0x2f770['map']((_0x505e7d) => ({
      id: _0x505e7d['id'],
      name: _0x505e7d['name'],
      clipId: _0x505e7d['clipId'],
      clipTitle: _0x505e7d['clipTitle'],
      captureSavePending: _0x505e7d['captureSavePending'] === !![],
      mentionId: buildStoryClipFrameMentionId(_0x505e7d['id']),
      mediaType: getStoryClipFrameMediaType(_0x505e7d),
      imageUrl: resolveStoryClipFrameImageUrl(_0x505e7d),
      mediaUrl: resolveStoryClipFrameMediaUrl(_0x505e7d),
    })),
    libraryAssets: _0x50da1e,
  });
}
function renderEpisodeDetail(_0x4ea350) {
  const _0x4d7037 = getSelectedEpisode(_0x4ea350),
    _0x11472e = getSelectedClip(_0x4ea350, _0x4d7037),
    _0x5400e9 = _0x4ea350['data']?.['project'] || {},
    _0x102816 = resolveStoryStyleSelection({
      styleId: _0x5400e9['videoStyleId'],
      stylePrompt: _0x5400e9['videoStylePrompt'],
      videoStyle: _0x5400e9['videoStyle'],
    }),
    _0x36ef35 = [_0x102816['label'], normalizeStoryAspectRatio(_0x5400e9['aspectRatio'])]['filter'](Boolean),
    _0x334d7a = (_0x4d7037?.['clips'] || [])['length'] > 0x1;
  if (_0x4d7037 && _0x4ea350['selectedEpisodeId'] !== _0x4d7037['id'])
    _0x4ea350['selectedEpisodeId'] = _0x4d7037['id'];
  if (_0x11472e && _0x4ea350['selectedClipId'] !== _0x11472e['id'])
    _0x4ea350['selectedClipId'] = _0x11472e['id'];
  const _0x23b207 = normalizeStoryEpisodePanelRatios(
      _0x4ea350['episodeAssetPanelRatio'],
      _0x4ea350['episodeEditorPanelRatio'],
    ),
    _0x4bfc0c = storyClipProduction['renderEpisode'](_0x4ea350, _0x4d7037, _0x11472e);
  return storyClipProductionPresentation['renderDetail']({
    title: _0x11472e?.['title'] || '片段脚本',
    clipMeta: _0x36ef35,
    ratios: _0x23b207,
    hasMultipleClips: _0x334d7a,
    assetRailMarkup: renderEpisodeAssetRail(_0x4ea350),
    episodeRailMarkup:
      _0x5400e9['sourceMode'] === 'video-replication'
        ? renderStoryVideoReplicationEpisodeRail(
            getStoryEpisodeToolbarOptions(_0x4ea350['data']['episodes']),
            _0x4ea350['selectedEpisodeId'],
          )
        : '',
    referenceSummary: _0x4bfc0c['referenceSummary'],
    promptSurface: _0x4bfc0c['promptSurface'],
    navigationMarkup: _0x334d7a
      ? '' + renderStoryClipNavigationArrow('previous') + renderStoryClipNavigationArrow('next')
      : '',
    videoPreview: _0x4bfc0c['videoPreview'],
    timeline: _0x4bfc0c['timeline'],
  });
}
function renderProjectPage(_0x12636b) {
  if (
    _0x12636b['step'] === 0x0 &&
    _0x12636b['view'] === 'project' &&
    isStoryCollaborationProject(_0x12636b['data'])
  )
    return renderStoryConceptionPage(_0x12636b);
  if (_0x12636b['view'] === 'episode') return renderEpisodeDetail(_0x12636b);
  if (_0x12636b['step'] === 0x1 && _0x12636b['data']?.['project']?.['sourceMode'] === 'video-replication') {
    const _0x3500b7 = getStoryReplicationLocale(
        _0x12636b['data']['project']?.['replication']?.['targetLocale'],
      ),
      _0x1415a8 = resolveStoryStyleSelection({
        styleId: _0x12636b['data']['project']?.['videoStyleId'],
        stylePrompt: _0x12636b['data']['project']?.['videoStylePrompt'],
        videoStyle: _0x12636b['data']['project']?.['videoStyle'],
      });
    return renderStoryVideoReplicationPage({
      episodes: _0x12636b['data']['episodes'],
      targetLabel: _0x3500b7['label'],
      styleLabel: _0x1415a8['label'],
      selectionMode: _0x12636b['replicationSelectionMode'] === !![],
      footerMarkup: renderStoryVideoReplicationFooter(_0x12636b),
    });
  }
  if (_0x12636b['step'] === 0x1 && isStoryAssetExtractionOperation(_0x12636b['storyPlanningOperation']))
    return renderStoryAssetBreakdownPage(_0x12636b);
  if (_0x12636b['step'] === 0x2) return renderAssetsPage(_0x12636b);
  if (_0x12636b['step'] === 0x3) return renderEpisodesPage(_0x12636b);
  return renderOutlinePage(_0x12636b);
}
function renderStoryVideoReplicationFooter(_0x21c928) {
  const _0x5a93ac = getStoryVideoReplicationFooterState(_0x21c928['data'], {
    localizing: isStoryAssetExtractionOperation(_0x21c928['storyPlanningOperation']),
    planningStatus: _0x21c928['storyPlanningStatus'],
  });
  return renderPageFooter(_0x21c928, {
    title: _0x5a93ac['title'],
    hint: _0x5a93ac['hint'],
    useDefaultCopy: ![],
    actionsMarkup:
      '<button type="button" class="story-next-button story-replication-next-button' +
      (_0x5a93ac['actionAttention'] ? ' is-attention' : '') +
      '" data-story-action="' +
      _0x5a93ac['action'] +
      '\x22\x20' +
      (_0x5a93ac['actionDisabled'] ? 'disabled' : '') +
      ' aria-busy="' +
      _0x5a93ac['busy'] +
      '\x22>' +
      (_0x5a93ac['busy'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      '<span>' +
      escapeHtml(_0x5a93ac['actionLabel']) +
      '</span>' +
      (_0x5a93ac['busy'] ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
      '</button>',
  });
}
function findStoryAsset(_0x3db13f, _0x4a8647) {
  return _0x3db13f['data']['assets']['find']((_0x5ee4fe) => _0x5ee4fe['id'] === _0x4a8647) || null;
}
function getStoryAssetPromptEditorContext(_0x42e469 = {}, _0x442e5f = null) {
  const _0x15aaab = normalizeText(_0x442e5f?.['dataset']?.['storyAssetPromptAssetId']),
    _0x1046fc = normalizeText(_0x442e5f?.['dataset']?.['storyAssetPromptAppearanceId']);
  if (!_0x15aaab || !_0x1046fc) return { asset: null, appearance: null };
  const _0x59773b =
      (Array['isArray'](_0x42e469?.['data']?.['assets']) ? _0x42e469['data']['assets'] : [])['find'](
        (_0x497e81) => normalizeText(_0x497e81?.['id']) === _0x15aaab,
      ) || null,
    _0x2465cc = _0x59773b
      ? getStoryAssetAppearances(_0x59773b)['find'](
          (_0xce8692) => normalizeText(_0xce8692?.['id']) === _0x1046fc,
        ) || null
      : null;
  return { asset: _0x59773b, appearance: _0x2465cc };
}
export function updateStoryAssetPromptFromEditor(_0x1e63b5 = {}, _0x29c0f0 = null) {
  const { asset: _0x408ebb, appearance: _0x1a7dc5 } = getStoryAssetPromptEditorContext(_0x1e63b5, _0x29c0f0);
  if (!_0x408ebb || !_0x1a7dc5 || _0x408ebb['isLibraryAsset']) return ![];
  return (
    (_0x1a7dc5['prompt'] = readStoryAssetPromptText(_0x29c0f0)),
    normalizeText(getStoryAssetAppearances(_0x408ebb)[0x0]?.['id']) === normalizeText(_0x1a7dc5['id']) &&
      (_0x408ebb['prompt'] = _0x1a7dc5['prompt']),
    !![]
  );
}
function updateSelectedClipPrompt(_0xcc2b93, _0x33c6a2) {
  const _0x228bc2 = getSelectedEpisode(_0xcc2b93),
    _0x5d3be6 = getSelectedClip(_0xcc2b93, _0x228bc2);
  if (_0x5d3be6) _0x5d3be6['prompt'] = sanitizePromptHtmlForCommit(String(_0x33c6a2 || ''));
}
function syncProjectChapterContent(_0x5317e5) {
  normalizeText(_0x5317e5?.['outlineStatus']) !== 'completed' &&
    !_0x5317e5?.['compiledScript'] &&
    (_0x5317e5['sourceChapters'] = (_0x5317e5['chapters'] || [])['map']((_0x1d7509) => ({
      id: normalizeText(_0x1d7509?.['id']),
      title: normalizeText(_0x1d7509?.['title']),
      content: normalizeText(_0x1d7509?.['content']),
    })));
  const _0x2886fd = (_0x5317e5['chapters'] || [])
    ['map']((_0x82a4fa) =>
      (normalizeText(_0x82a4fa['title']) + '\x0a' + normalizeText(_0x82a4fa['content']))['trim'](),
    )
    ['filter'](Boolean)
    ['join']('\x0a\x0a');
  ((_0x5317e5['plotScript'] = _0x2886fd), (_0x5317e5['narrationScript'] = _0x2886fd));
}
export function reportStoryWorkspaceApiError(_0x50222b, _0x12eea3, _0x2906f1 = {}) {
  const _0xed72d7 = normalizeText(_0x50222b) || 'unknown-operation',
    _0x40e6ae = Number(_0x12eea3?.['status']),
    _0x14db14 = {
      operation: _0xed72d7,
      message: normalizeText(_0x12eea3?.['message'] || _0x12eea3) || '未知错误',
      model: normalizeText(_0x2906f1?.['model']),
      provider: normalizeText(_0x12eea3?.['provider'] || _0x2906f1?.['provider']),
      status: Number['isFinite'](_0x40e6ae) ? _0x40e6ae : null,
      code: _0x12eea3?.['code'] ?? null,
      type: normalizeText(_0x12eea3?.['type'] || _0x12eea3?.['name']) || 'Error',
      retryable: typeof _0x12eea3?.['retryable'] === 'boolean' ? _0x12eea3['retryable'] : null,
      raw: _0x12eea3?.['raw'] ?? null,
    };
  return (
    globalThis['console']?.['error']?.(
      '[storyWorkspace][' + _0xed72d7 + ']\x20API\x20请求失败',
      _0x14db14,
      _0x12eea3,
    ),
    _0x14db14
  );
}
export function resolveStoryTaskResultDestination(_0x6794d = {}, _0x153ee7 = {}) {
  const _0x5966f4 = Array['isArray'](_0x6794d?.['episodes']) ? _0x6794d['episodes'] : [],
    _0x3e64a7 = Array['isArray'](_0x6794d?.['assets']) ? _0x6794d['assets'] : [],
    _0x379f8b = normalizeText(_0x153ee7?.['episodeId']),
    _0x6bd8bd = _0x5966f4['find']((_0x1d79b8) => normalizeText(_0x1d79b8?.['id']) === _0x379f8b);
  if (_0x6bd8bd && Array['isArray'](_0x6bd8bd['clips']) && _0x6bd8bd['clips']['length']) {
    const _0x52abdd = normalizeText(_0x153ee7?.['clipId']),
      _0x2275d4 =
        _0x6bd8bd['clips']['find']((_0x4d45fa) => normalizeText(_0x4d45fa?.['id']) === _0x52abdd) ||
        _0x6bd8bd['clips'][0x0];
    return {
      view: 'episode',
      step: 0x3,
      episodeId: normalizeText(_0x6bd8bd['id']),
      clipId: normalizeText(_0x2275d4?.['id']),
    };
  }
  const _0x514581 = normalizeText(_0x153ee7?.['assetId']),
    _0x44312a = _0x3e64a7['find']((_0xf51f4) => normalizeText(_0xf51f4?.['id']) === _0x514581);
  if (_0x44312a)
    return {
      view: 'project',
      step: 0x2,
      assetId: normalizeText(_0x44312a['id']),
      assetFilter: normalizeText(_0x44312a['kind']) || 'character',
    };
  const _0x21024a = normalizeStoryWorkspaceStep(_0x153ee7?.['step']);
  return {
    view: 'project',
    step: _0x21024a,
    outlineSectionId: _0x21024a === 0x1 ? normalizeText(_0x153ee7?.['outlineSectionId']) : '',
  };
}
export function notifyStoryTaskResult(
  _0xbcb98c,
  _0x547ff9,
  _0x5003fe = 'info',
  {
    details: _0x90aead,
    duration: _0x304202,
    toastOptions: _0xe61136,
    consoleObject: consoleObject = globalThis['console'],
  } = {},
) {
  const _0x2762e7 = _0x5003fe === 'warning' ? 'warn' : String(_0x5003fe || 'info'),
    _0xf96538 = String(_0x547ff9 || '')['trim']() || '任务状态已更新。',
    _0x281a91 = consoleObject?.['error'] || consoleObject?.['log'];
  if (_0x2762e7 === 'error' && typeof _0x281a91 === 'function') {
    const _0x171958 = { tone: _0x2762e7, message: _0xf96538, timestamp: new Date()['toISOString']() };
    _0x90aead === undefined
      ? _0x281a91['call'](consoleObject, '[storyWorkspace][task-result]', _0x171958)
      : _0x281a91['call'](consoleObject, '[storyWorkspace][task-result]', _0x171958, _0x90aead);
  }
  if (typeof _0xbcb98c !== 'function') return ![];
  return (
    _0x304202 === undefined && _0xe61136 === undefined
      ? _0xbcb98c(_0xf96538, _0x2762e7)
      : _0xbcb98c(_0xf96538, _0x2762e7, _0x304202, _0xe61136),
    !![]
  );
}
export function notifyStoryTextGenerationComplete(
  _0x312fef,
  {
    playSound: playSound = playCompletionSound,
    showNotification: showNotification = showGenerationCompleteNotification,
    navigationTarget: navigationTarget = null,
  } = {},
) {
  const _0x43bf4a = String(_0x312fef || '')['trim']() || '剧本工作室文本生成完成。';
  return Promise['allSettled']([
    Promise['resolve']()['then'](() => playSound('generation-success')),
    Promise['resolve']()['then'](() =>
      showNotification({ body: _0x43bf4a, ...(navigationTarget ? { navigation: navigationTarget } : {}) }),
    ),
  ]);
}
export function initStoryWorkspace({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  adjustClipPrompt: adjustClipPrompt = null,
  generateStory: generateStory = null,
  generateEpisodeScript: generateEpisodeScript = null,
  extractAssets: extractAssets = null,
  extractAssetsParallel: extractAssetsParallel = null,
  extractAssetsExperimental: extractAssetsExperimental = null,
  planEpisodes: planEpisodes = null,
  recoverEpisodeSplitDraft: recoverEpisodeSplitDraft = null,
  splitEpisode: splitEpisode = null,
  splitEpisodesBatch: splitEpisodesBatch = null,
  splitEpisodeExperimental: splitEpisodeExperimental = null,
  reviewEpisodeSplit: reviewEpisodeSplit = null,
  extractDocumentText: extractDocumentText = null,
  analyzeSourceVideo: analyzeSourceVideo = null,
  createEpisodeCanvas: createEpisodeCanvas = null,
  createProjectCanvas: createProjectCanvas = null,
  subscribeCanvasNodeDeletions: subscribeCanvasNodeDeletions = null,
  subscribeCanvasMediaNodeChanges: subscribeCanvasMediaNodeChanges = null,
  getCanvasMediaSnapshot: getCanvasMediaSnapshot = null,
  syncClipFrameToCanvas: syncClipFrameToCanvas = null,
  deleteCanvasNodes: deleteCanvasNodes = null,
  generateAssetImage: generateAssetImage = null,
  saveAssetPackageItem: saveAssetPackageItem = null,
  saveMedia: saveMedia = saveMediaDownload,
  loadWorkspace: loadWorkspace = null,
  saveWorkspace: saveWorkspace = null,
  projectPackages: projectPackages = null,
  requestWorkspaceMode: requestWorkspaceMode = () => ![],
} = {}) {
  if (!documentObject?.['body']) return null;
  const _0x3afc1c = documentObject['getElementById']('storyWorkspaceRoot');
  if (_0x3afc1c?.['_storyWorkspaceApi']) return _0x3afc1c['_storyWorkspaceApi'];
  const _0x22961d = documentObject['getElementById']('v2-wrap');
  if (!_0x22961d) return null;
  const _0x13dcbc = normalizeStoryWorkspaceAssetData(createDemoStoryWorkspaceData());
  _0x13dcbc['project']['planning'] = normalizeStoryProjectPlanning(_0x13dcbc['project'], {
    allowDeveloperPromptModes: windowObject?.['DEV_MODE'] === !![],
  });
  const _0x55ddb6 = resolveStoryWorkspaceModelId('text'),
    _0x3cea9e = resolveStoryWorkspaceModelId('image'),
    _0x15c009 = resolveStoryWorkspaceModelId('video'),
    _0x109ee4 = {
      storyProjectSessionId: 0x1,
      storyProjectSessionById: { [normalizeText(_0x13dcbc['project']?.['id'])]: 0x1 },
      experimentalSplitAvailable: isStoryEpisodeExperimentalSplitAvailable(windowObject),
      experimentalAssetExtractionAvailable: isStoryAssetExperimentalExtractionAvailable(windowObject),
      developerModeAvailable: windowObject?.['DEV_MODE'] === !![],
      view: 'home',
      step: 0x1,
      homeTab: 'generate',
      uploadInputMode: 'file',
      replicationSourceFiles: [],
      replicationSourcePreviewUrls: [],
      replicationTargetLocale: 'zh-CN',
      replicationAsrProvider: 'volcengine-speech',
      idea: '',
      scriptFileName: '',
      scriptText: '',
      scriptCharacterCount: null,
      isGeneratingStory: ![],
      isParsingDocument: ![],
      canvasSyncPending: ![],
      canvasSyncScope: '',
      hasCreatedProject: ![],
      projectTitleEdited: ![],
      projects: [],
      projectSearchQuery: '',
      projectSortOrder: 'updated-desc',
      showArchivedProjects: ![],
      openProjectMenuId: '',
      pendingDeleteProjectId: '',
      pendingDeleteAssetAppearanceKey: '',
      generationStatus: '',
      storyPlanningOperation: '',
      storyPlanningStatus: '',
      assetBreakdownEpisodes: [],
      assetBreakdownVisibleCount: 0x0,
      scriptSelectionMode: ![],
      selectedScriptEpisodeIds: [],
      generatingEpisodeScriptId: '',
      isBatchGeneratingScripts: ![],
      episodeScriptBatchId: '',
      episodeScriptBatchCancelRequested: ![],
      scriptGenerationFocusMode: ![],
      outlineSectionOpenState: {},
      pageScrollPositions: {},
      episodeScriptGenerationStatus: '',
      pendingRegenerationTarget: '',
      pendingClipInput: null,
      generatingClipId: '',
      generatingClipIds: [],
      pendingDeleteClipId: '',
      clipAdjustmentOpen: ![],
      clipAdjustmentInstruction: '',
      clipAdjustmentPromptMode: '',
      clipAdjustmentPromptModeOpen: ![],
      clipAdjustmentLanguage: '',
      clipAdjustmentLanguageOpen: ![],
      clipPromptHistoryOpen: ![],
      clipAdjustmentGeneratingIds: [],
      clipSelectionMode: ![],
      selectedClipGenerationIds: [],
      clipBatchGenerationByEpisode: {},
      textProvider: getStoryWorkspaceModelChoice('text', _0x55ddb6)?.['provider'] || '',
      textProviderProfileId: '',
      imageProvider: resolveModelProvider(_0x3cea9e),
      imageGenerationParams: normalizeStoryImageGenerationParams(_0x3cea9e),
      imageGenerationParamsByModel: {},
      assetPromptPresetId: STORY_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
      sceneAssetPromptPresetId: STORY_SCENE_ASSET_PROMPT_PRESET_NONE_ID,
      videoProvider: resolveStoryVideoProvider(_0x15c009),
      videoProviderProfileId: '',
      videoProviderProfileIdByModel: {},
      videoGenerationParams: applyStoryAspectRatioToVideoGenerationParams(
        _0x15c009,
        {},
        _0x13dcbc['project']?.['aspectRatio'],
      ),
      videoGenerationParamsByModel: {},
      scriptMode: 'plot',
      assetFilter: 'character',
      assetLibraryDisclosure: createWorkspaceAssetLibraryDisclosure(),
      assetSplitRatio: 0x32,
      assetDetailSplitRatio: 0x32,
      episodeAssetPanelRatio: 0x16,
      episodeEditorPanelRatio: 0x22,
      episodeAssetRailTab: 'assets',
      assetSelectionMode: ![],
      selectedAssetIds: [],
      exportingAssetAppearanceKey: '',
      experimentalSplitMode: ![],
      episodeSelectionMode: ![],
      selectedEpisodeIds: [],
      splittingEpisodeIds: [],
      episodeBatchSplitOperation: '',
      episodeBatchSplitStatus: '',
      episodeBatchSplitId: '',
      episodeBatchSplitCancelRequested: ![],
      assetAppearanceIndexes: {},
      assetAppearanceMotion: '',
      selectedAssetId:
        _0x13dcbc['assets']['find']((_0x4cda40) => _0x4cda40['kind'] === 'character')?.['id'] || '',
      selectedEpisodeId: _0x13dcbc['episodes'][0x0]?.['id'] || '',
      selectedClipId: _0x13dcbc['episodes'][0x0]?.['clips']?.[0x0]?.['id'] || '',
      pendingAssetUploadId: '',
      pendingAssetAppearanceId: '',
      pendingCharacterVoiceAssetId: '',
      characterVoiceEditor: null,
      characterVoicePanelMotion: '',
      generatingAppearanceKeys: [],
      generatingVoiceAssetIds: [],
      isBatchGenerating: ![],
      batchGeneratingAssetIds: [],
      batchGeneratingAppearanceKeys: [],
      batchGeneratingVoiceAssetIds: [],
      assetBatchId: '',
      assetBatchCancelRequested: ![],
      batchGenerationLabel: '',
      data: _0x13dcbc,
      models: { text: _0x55ddb6, image: _0x3cea9e, video: _0x15c009 },
    },
    _0x2e97b0 = documentObject['createElement']('section');
  ((_0x2e97b0['id'] = 'storyWorkspaceRoot'),
    (_0x2e97b0['className'] = 'story-workspace-root'),
    (_0x2e97b0['dataset']['uiStop'] = '1'),
    (_0x2e97b0['hidden'] = !![]),
    _0x2e97b0['setAttribute']('aria-hidden', 'true'),
    (_0x2e97b0['innerHTML'] =
      '<div class="story-workspace-shell" data-story-workspace-shell>\n    <div class="story-workspace-toolbar" data-story-toolbar></div>\n    <div class="story-page-stage" data-story-page-stage>\n      <main class="story-page-viewport" data-story-page-viewport></main>\n      <div class="story-workspace-generation-loading storyboard-script-loading-overlay" data-story-planning-loading role="status" aria-live="polite" hidden>\n        <div class="storyboard-script-loading-spinner"></div>\n        <div class="storyboard-script-loading-label" data-story-planning-loading-label>正在提取角色、场景与道具</div>\n        <div class="storyboard-script-loading-bar"><div class="storyboard-script-loading-bar-fill"></div></div>\n      </div>\n    </div>\n  </div>\n  <div class="story-canvas-sync-loading storyboard-script-loading-overlay" data-story-canvas-sync-loading role="status" aria-live="polite" aria-label="正在加入画布" aria-hidden="true" tabindex="-1" hidden>\n    <div class="storyboard-script-loading-spinner"></div>\n    <strong class="storyboard-script-loading-label">正在加入画布</strong>\n    <small>同步完成后将自动跳转到画布</small>\n  </div>\n  <div class="story-asset-hover-preview" data-story-asset-hover-preview role="tooltip" aria-hidden="true"></div>\n  <div class="story-clip-video-history-menu" data-story-clip-video-history-menu aria-hidden="true"></div>\n  <input class="story-hidden-input" type="file" data-story-script-file accept=".txt,.docx,.pdf">\n  <input class="story-hidden-input" type="file" data-story-replication-video-file accept="' +
      STORY_REPLICATION_VIDEO_ACCEPT +
      '" multiple>\n  <input class="story-hidden-input" type="file" data-story-asset-file accept="image/*">\n  <input class="story-hidden-input" type="file" data-story-asset-reference-file accept="image/*">\n  <input class="story-hidden-input" type="file" data-story-character-voice-file accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a">\n  <input class="story-hidden-input" type="file" data-story-clip-input-file>'),
    _0x22961d['appendChild'](_0x2e97b0));
  const _0x1e2d82 = createStoryLibraryAssignmentMenuPortal({
      storyRoot: _0x2e97b0,
      windowObject: windowObject,
    }),
    _0x925fef = (_0x3ced34 = _0x2e97b0) => _0x1e2d82['closeAppearance'](_0x3ced34),
    _0x19d9e0 = (_0xdc75ef) => _0x1e2d82['openAppearance'](_0xdc75ef),
    _0x3881c5 = (_0x10b746 = _0x2e97b0) => _0x1e2d82['closeTarget'](_0x10b746),
    _0x5db0ce = (_0x2f6c93) => _0x1e2d82['toggleTarget'](_0x2f6c93),
    _0x198a72 = _0x2e97b0['querySelector']('[data-story-toolbar]'),
    _0x2aa570 = _0x2e97b0['querySelector']('[data-story-workspace-shell]'),
    _0x317c92 = _0x2e97b0['querySelector']('[data-story-page-stage]'),
    _0x44835e = _0x2e97b0['querySelector']('[data-story-page-viewport]'),
    _0xb03d0d = _0x2e97b0['querySelector']('[data-story-planning-loading]'),
    _0x2d2c7a = _0x2e97b0['querySelector']('[data-story-planning-loading-label]'),
    _0x74ad1a = _0x2e97b0['querySelector']('[data-story-canvas-sync-loading]'),
    _0x38c1e3 = _0x2e97b0['querySelector']('[data-story-asset-hover-preview]'),
    _0x401ab9 = _0x2e97b0['querySelector']('[data-story-clip-video-history-menu]'),
    _0x52dd70 = _0x2e97b0['querySelector']('[data-story-script-file]'),
    _0x46be0a = _0x2e97b0['querySelector']('[data-story-replication-video-file]'),
    _0x53cb21 = _0x2e97b0['querySelector']('[data-story-asset-file]'),
    _0x46a449 = _0x2e97b0['querySelector']('[data-story-asset-reference-file]'),
    _0x4ce129 = _0x2e97b0['querySelector']('[data-story-character-voice-file]'),
    _0x10678e = _0x2e97b0['querySelector']('[data-story-clip-input-file]');
  let _0x309f60 = '',
    _0xc6f8ce = null,
    _0x3023cf = null,
    _0x56abf0 = null,
    _0x5aee6c = null,
    _0x58790f = null,
    _0x31318e = '',
    _0x5df8d0 = '',
    _0x7dc14 = [],
    _0x5836f9 = '';
  const _0x36feea = new Map(),
    _0x579b1e = new Map();
  let _0x398985 = 0x0;
  const _0x2c041c = createStoryAssetHoverPreviewController({
      previewElement: _0x38c1e3,
      getState: () => _0x109ee4,
      getSelectedAppearance: getSelectedAssetAppearance,
      buildContent: buildStoryAssetHoverPreviewContent,
      isStoryAssetHoverLandscape: isStoryAssetHoverLandscape,
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    _0x1f3d39 = (..._0x49d606) => _0x2c041c['show'](..._0x49d606);
  let _0x27857a = null;
  const _0x58e89b = { accumulator: 0x0, lockedUntil: 0x0 },
    _0x234da6 = new WeakMap(),
    _0x594051 = createWorkspacePageTransitionController({
      windowObject: windowObject,
      disposePage: _0x1206b1,
    }),
    _0x3d21f9 = new Map(),
    _0x6fd759 = new Set(),
    _0x1560e7 = new Set(),
    _0xb3aeb9 = createStoryTaskBatchCancellationRegistry(),
    _0x1d9381 = createStoryTaskBatchCancellationRegistry(),
    _0x2f0de7 = createStoryProjectDataOwner({ state: _0x109ee4 });
  let _0x579cca = ![],
    _0x57f246 = ![],
    _0xdac690 = null;
  const _0x3cc085 = createWorkspacePresentationLifecycle({
      getRoot: () => _0x2e97b0,
      getContentKey: () => _0x167ce5['getRevision'](),
    }),
    _0x51f555 = () => {
      const _0x5e2b09 = isStoryEpisodeExperimentalSplitAvailable(windowObject),
        _0xd9f594 = isStoryAssetExperimentalExtractionAvailable(windowObject),
        _0x3146cc = windowObject?.['DEV_MODE'] === !![];
      if (
        _0x109ee4['experimentalSplitAvailable'] === _0x5e2b09 &&
        _0x109ee4['experimentalAssetExtractionAvailable'] === _0xd9f594 &&
        _0x109ee4['developerModeAvailable'] === _0x3146cc
      )
        return;
      ((_0x109ee4['experimentalSplitAvailable'] = _0x5e2b09),
        (_0x109ee4['experimentalAssetExtractionAvailable'] = _0xd9f594),
        (_0x109ee4['developerModeAvailable'] = _0x3146cc),
        (_0x109ee4['homeTab'] = resolveStoryVideoReplicationHomeTab(_0x109ee4, _0x109ee4['homeTab'])));
      _0x109ee4['data']?.['project'] &&
        ((_0x109ee4['data']['project']['planning'] = normalizeStoryProjectPlanning(
          _0x109ee4['data']['project'],
          { allowDeveloperPromptModes: _0x3146cc },
        )),
        _0x487a78({ immediate: !![] }));
      if (_0x579cca) return;
      if (_0x57f246) _0xb8a26b();
    };
  (windowObject?.['addEventListener']?.('aicanvas:runtime-info', _0x51f555),
    windowObject?.['addEventListener']?.('dev-mode-changed', _0x51f555));
  const _0x50d1ac = (_0x141c6c, _0x3d0ee0 = 'info', _0x1a0d32, _0x1bf818) => {
      typeof windowObject?.['showToast'] === 'function' &&
        (_0x1a0d32 === undefined && _0x1bf818 === undefined
          ? windowObject['showToast'](_0x141c6c, _0x3d0ee0)
          : windowObject['showToast'](_0x141c6c, _0x3d0ee0, _0x1a0d32, _0x1bf818));
    },
    _0x3989e8 = (_0x209f42, _0x2662d8 = {}) => ({
      source: 'story-workspace',
      projectId: normalizeText(_0x209f42?.['projectId']),
      ..._0x2662d8,
    }),
    _0x2f2968 = (_0xf69114, _0x5b84d2 = {}) => {
      const _0x40fe39 =
        _0xf69114?.['credentialPromptShown'] === !![] ||
        showProviderApiKeyMissingToastForError(_0xf69114, { ..._0x5b84d2 });
      return (
        _0x40fe39 &&
          notifyStoryTaskResult(
            null,
            _0xf69114?.['getUserMessage']?.() || _0xf69114?.['message'] || '生成任务缺少可用的 API Key。',
            'error',
            { details: _0xf69114 },
          ),
        _0x40fe39
      );
    },
    _0x2024a5 = (_0x422109, _0x14cd5c = 'info', _0xeb9656, _0x47ba42) => {
      if (_0x14cd5c === 'error' && _0xeb9656 && _0x2f2968(_0xeb9656)) return !![];
      const _0x429e30 = Boolean(_0x47ba42?.['projectId']);
      return notifyStoryTaskResult(windowObject?.['showToast'], _0x422109, _0x14cd5c, {
        details: _0xeb9656,
        ...(_0x429e30
          ? {
              duration: 0x2710,
              toastOptions: {
                ariaLabel: String(_0x422109 || '任务完成')['trim']() + '，点击查看结果',
                onClick: () => {
                  void _0xebcca6(_0x47ba42);
                },
              },
            }
          : {}),
      });
    },
    _0x34edeb = (
      _0x5683a6,
      _0x597b93,
      _0x4b09c8,
      {
        notificationMessage: notificationMessage = _0x5683a6,
        tone: tone = 'success',
        details: _0x34bdba,
        showResultToast: showResultToast = !![],
      } = {},
    ) => {
      const _0x3aef2e = _0x3989e8(_0x597b93, _0x4b09c8),
        _0x523fce = showResultToast ? _0x2024a5(_0x5683a6, tone, _0x34bdba, _0x3aef2e) : ![];
      return (
        void notifyStoryTextGenerationComplete(notificationMessage, { navigationTarget: _0x3aef2e }),
        _0x523fce
      );
    },
    _0x437371 = (_0x453812, _0x3bfab6, _0x2b2261, _0x4416cd, _0x55adfe) =>
      _0x34edeb(_0x453812, _0x2b2261, _0x4416cd, { tone: _0x3bfab6, details: _0x55adfe }),
    _0x176e4e = (
      _0x4be598,
      _0x3e8700,
      _0x14d60a,
      {
        notificationMessage: notificationMessage = _0x4be598,
        tone: tone = 'success',
        details: _0x193292,
      } = {},
    ) =>
      _0x34edeb(_0x4be598, _0x3e8700, _0x14d60a, {
        notificationMessage: notificationMessage,
        tone: tone,
        details: _0x193292,
      }),
    _0x177bdc = subscribeGenerationCompleteNotificationClicks((_0x1cbfd6) => {
      if (_0x1cbfd6?.['source'] !== 'story-workspace') return;
      void _0xebcca6(_0x1cbfd6);
    });
  function _0x38dbd3(_0x311f78) {
    return JSON['parse'](JSON['stringify'](_0x311f78));
  }
  const _0x51b855 = createWorkspacePersistencePresentation({ getRoot: () => _0x2e97b0 }),
    _0x4476d2 = createStoryProjectPersistenceWorkspaceController({
      state: _0x109ee4,
      projectData: _0x2f0de7,
      windowObject: windowObject,
      saveWorkspace: saveWorkspace,
      onPersistenceState: (_0x22d098) => _0x51b855['update'](_0x22d098),
      projectPackages: projectPackages,
      advanceProjectSession: (_0x2f1687) => _0x1cfd62(_0x109ee4, _0x2f1687),
      openStoredProject: (..._0x8b6701) => _0x3bfffe(..._0x8b6701),
      render: (..._0x353b07) => _0xb8a26b(..._0x353b07),
      showToast: _0x50d1ac,
    }),
    {
      collectStoredProject: _0x1744eb,
      coordinator: _0x167ce5,
      importProjectPackage: _0x253c02,
      importProjectPackageResult: _0x1ea29a,
      persistNow: _0x2d2251,
      schedule: _0x555ffb,
      syncCurrentProjectEntry: _0x41990e,
    } = _0x4476d2,
    _0x487a78 = (..._0x314257) => {
      return (
        _0x234da6['get'](_0x44835e?.['querySelector']?.('.story-page.is-current'))?.['syncPrices']?.(),
        _0x555ffb(..._0x314257)
      );
    },
    _0x274d26 = createStoryAssetLayoutResizeController({
      state: _0x109ee4,
      viewportElement: _0x44835e,
      documentObject: documentObject,
      windowObject: windowObject,
      schedulePersistence: _0x487a78,
    }),
    { beginAssetDetailSplitResize: _0x460b52, beginAssetSplitResize: _0x4ede93 } = _0x274d26;
  function _0x2bdfc4(_0x3f4e9f = {}) {
    const { changed: _0x50a546 } = _0x2f0de7['applyChanges']((_0x183763, { isCurrent: _0x29709f }) => {
      const _0xeaa978 = _0x29709f
          ? new Set(normalizeStoryClipFrames(_0x183763['clipFrames'])['map']((_0x379b1b) => _0x379b1b['id']))
          : null,
        _0x103620 = clearDeletedStoryCanvasBindings(_0x183763, _0x3f4e9f);
      if (_0x103620 && _0xeaa978) {
        const _0xfd30fe = new Set(
          normalizeStoryClipFrames(_0x183763['clipFrames'])['map']((_0x2263d8) => _0x2263d8['id']),
        );
        _0xeaa978['forEach']((_0x3b5a39) => {
          if (!_0xfd30fe['has'](_0x3b5a39)) _0x41d0f8(_0x3b5a39);
        });
      }
      return _0x103620;
    });
    if (_0x50a546) {
      if (_0x57f246 && _0x109ee4['view'] === 'episode') {
        if (!_0x1adf2f({ refreshContent: !![] })) _0xb8a26b();
      }
      _0x487a78({ immediate: !![] });
    }
    return _0x50a546;
  }
  function _0x4a9030(_0x3e5de4 = {}) {
    const { changed: _0x308796, currentProjectChanged: _0x57bfb6 } = _0x2f0de7['applyChanges'](
      (_0x14daec, { isCurrent: _0x496274 }) => {
        const _0x54f4fa = _0x496274 ? getSelectedEpisode(_0x109ee4) : _0x14daec['episodes']?.[0x0] || null,
          _0x26fdca = _0x496274 ? getSelectedClip(_0x109ee4, _0x54f4fa) : _0x54f4fa?.['clips']?.[0x0] || null;
        return reconcileStoryCanvasMediaNodes(_0x14daec, {
          ..._0x3e5de4,
          episodeId: _0x54f4fa?.['id'],
          clipId: _0x26fdca?.['id'],
        });
      },
    );
    if (!_0x308796) return ![];
    if (_0x57bfb6) {
      if (_0x57f246 && _0x109ee4['view'] === 'episode') {
        if (!_0x1adf2f({ refreshContent: !![] })) _0xb8a26b();
      }
    }
    return (_0x487a78({ immediate: !![] }), !![]);
  }
  const _0x2a13f4 = createStoryProjectTaskWorkspaceController({
      state: _0x109ee4,
      activeClipGenerationControllers: _0x3d21f9,
      activeBackgroundExecutions: _0x1560e7,
      activeBackgroundRecoveries: _0x6fd759,
      replicationAnalysisPromises: _0x36feea,
      replicationSourceFileByEpisodeKey: _0x579b1e,
      projectData: _0x2f0de7,
      getWorkspaceDestroyed: () => _0x579cca,
      stopAssetBreakdownProgress: (..._0x33b9d8) => _0x378f1f(..._0x33b9d8),
      schedulePersistence: (..._0x4e6e67) => _0x487a78(..._0x4e6e67),
      render: (..._0x2252c3) => _0xb8a26b(..._0x2252c3),
    }),
    {
      advanceProjectSession: _0x1cfd62,
      beginSession: _0x3d765a,
      createProjectToken: _0xa88d71,
      createTaskBatch: _0xdfe98f,
      createTokenForData: _0x47869f,
      finishBackgroundTask: _0x3cde55,
      getBackgroundExecutionKey: _0x1f98cf,
      invalidateRuntime: _0x198f7c,
      isCurrent: _0x111644,
      isLive: _0x1539c4,
      persistChange: _0x583aaa,
      registerProjectData: _0x4dfbc5,
      resetTaskState: _0x1e76e1,
      restoreTaskState: _0x150704,
      startBackgroundTask: _0x2ccfa9,
      syncProjectEntry: _0x262e0d,
      syncTaskBatch: _0x43e7dd,
      updateBackgroundTask: _0x3aebdc,
      updateBackgroundTaskBatch: _0x101eef,
    } = _0x2a13f4,
    _0xa8c610 = createStoryCanvasSyncWorkspaceController({
      state: _0x109ee4,
      root: _0x2e97b0,
      workspaceShell: _0x2aa570,
      loadingElement: _0x74ad1a,
      documentObject: documentObject,
      operations: {
        createEpisodeCanvas: createEpisodeCanvas,
        createProjectCanvas: createProjectCanvas,
        syncClipFrame: syncClipFrameToCanvas,
      },
      projectTasks: {
        createToken: () => _0xa88d71(_0x109ee4),
        isCurrent: _0x111644,
        isLive: _0x1539c4,
        syncEntry: _0x262e0d,
      },
      persistence: { schedule: _0x487a78 },
      presentation: {
        closeMenu: (..._0x590428) => _0x457f02(..._0x590428),
        handleMediaNodeChanges: (..._0x314f3d) => _0x4a9030(..._0x314f3d),
        refreshEpisodeRail: (..._0x120f2f) => _0x1adf2f(..._0x120f2f),
        refreshToolbar: (..._0x137a7b) => _0x1925bd(..._0x137a7b),
        requestWorkspaceMode: requestWorkspaceMode,
        showToast: _0x50d1ac,
      },
      getSelectedEpisode: (_0xc78ab6) => getSelectedEpisode({ ..._0x109ee4, data: _0xc78ab6 }),
      getProjectCanvasEpisodes: (..._0x4c0194) => getStoryProjectCanvasEpisodes(..._0x4c0194),
      resolveClipGenerationSettings: (_0x3f53d0, _0x3f41f7) =>
        resolveStoryClipVideoGenerationSettings(_0x3f53d0, _0x3f41f7, {
          fallbackModelId: _0x109ee4['models']['video'],
          fallbackProvider: _0x109ee4['videoProvider'],
        }),
    }),
    {
      addProject: _0xd7e322,
      addSelectedEpisode: _0x529a3b,
      destroy: _0x926d10,
      syncFrame: _0x355aa1,
    } = _0xa8c610,
    _0x4985b6 = createStoryClipVideoTaskWorkspaceController({
      state: _0x109ee4,
      activeControllers: _0x3d21f9,
      createProjectToken: _0xa88d71,
      createProjectTokenForData: _0x47869f,
      isProjectTaskLive: _0x1539c4,
      isProjectTaskCurrent: _0x111644,
      registerProjectData: _0x4dfbc5,
      startBackgroundTask: _0x2ccfa9,
      updateBackgroundTask: _0x3aebdc,
      finishBackgroundTask: _0x3cde55,
      syncProjectEntry: _0x262e0d,
      restoreProjectTaskState: _0x150704,
      schedulePersistence: (..._0x295670) => _0x487a78(..._0x295670),
      refreshEpisodeCard: (..._0x427701) => _0x16bd81(..._0x427701),
      refreshClipGeneration: (..._0x58345f) => _0x69a755(..._0x58345f),
      render: (..._0x448df1) => _0xb8a26b(..._0x448df1),
      showTaskResultToast: _0x2024a5,
      showNavigableTaskResultToast: _0x437371,
      getWorkspaceDestroyed: () => _0x579cca,
      windowObject: windowObject,
    }),
    {
      createGenerationController: _0x5d50ed,
      getGenerationKey: _0x29625d,
      replaceClip: _0x25ede7,
      resumeTask: _0x28e10d,
      resumeTasks: _0x58b0ac,
      syncBackgroundTask: _0x242cb3,
      waitForRecoveryManifest: _0x3b8361,
    } = _0x4985b6,
    _0x396dc9 = createStoryClipInputWorkspaceController({
      state: _0x109ee4,
      root: _0x2e97b0,
      getSelectedEpisode: getSelectedEpisode,
      getSelectedClip: getSelectedClip,
      replaceClip: _0x25ede7,
      takePendingInputContext: () => {
        const _0x33b1a3 = _0x58790f || _0x109ee4['pendingClipInput'];
        return ((_0x58790f = null), (_0x109ee4['pendingClipInput'] = null), _0x33b1a3);
      },
      createProjectToken: _0xa88d71,
      isProjectTaskCurrent: _0x111644,
      isProjectTaskLive: _0x1539c4,
      syncProjectEntry: _0x262e0d,
      schedulePersistence: (..._0x386920) => _0x487a78(..._0x386920),
      render: (..._0xc09db3) => _0xb8a26b(..._0xc09db3),
      showToast: _0x50d1ac,
    }),
    {
      applyVideoSettings: _0x38bff8,
      prepareVideoSettings: _0x5bfff6,
      reconcileSelectedInputsForModel: _0x2d610d,
      syncVideoDurationInPlace: _0x319eed,
      updateSelectedInput: _0x552b94,
      uploadSelectedInput: _0x5711da,
    } = _0x396dc9,
    _0x3478a1 = createStoryCharacterVoiceWorkspaceController({
      state: _0x109ee4,
      root: _0x2e97b0,
      documentObject: documentObject,
      windowObject: windowObject,
      projectTasks: {
        createToken: () => _0xa88d71(_0x109ee4),
        isCurrent: _0x111644,
        isLive: _0x1539c4,
        start: _0x2ccfa9,
        update: _0x3aebdc,
        finish: _0x3cde55,
      },
      findAsset: (_0x27d426) => findStoryAsset(_0x109ee4, _0x27d426),
      render: _0xb8a26b,
      schedulePersistence: _0x487a78,
      showToast: _0x50d1ac,
      showTaskApiKeyError: _0x2f2968,
      showTaskResultToast: _0x2024a5,
      showNavigableTaskResultToast: _0x437371,
      isEditorSurfaceActive: () => _0x57f246 && _0x109ee4['view'] === 'project' && _0x109ee4['step'] === 0x2,
    }),
    {
      closeEditor: _0x50b62a,
      generateSelected: _0x4d6578,
      openEditor: _0xa1b14f,
      playHistory: _0x5d34a2,
      playPreview: _0x21df6e,
      requestGeneration: _0xbfaf3,
      restoreHistory: _0x214885,
      stopPreview: _0x49f360,
      syncPlayerUi: _0x3d3c35,
    } = _0x3478a1,
    _0x240aa7 = createStoryAssetGenerationController({
      state: _0x109ee4,
      activeRecoveries: _0x6fd759,
      activeExecutions: _0x1560e7,
      isWorkspaceDestroyed: () => _0x579cca,
      hasImageGenerator: () => typeof generateAssetImage === 'function',
      generateImage: (..._0x5c4f1e) => generateAssetImage(..._0x5c4f1e),
      createProjectToken: () => _0xa88d71(_0x109ee4),
      createProjectTokenForData: _0x47869f,
      isProjectTaskLive: _0x1539c4,
      isProjectTaskCurrent: _0x111644,
      registerProjectData: _0x4dfbc5,
      waitForRecoveryManifest: _0x3b8361,
      startBackgroundTask: _0x2ccfa9,
      updateBackgroundTask: _0x3aebdc,
      finishBackgroundTask: _0x3cde55,
      schedulePersistence: _0x487a78,
      render: _0xb8a26b,
      findAsset: (_0x50cbde) => findStoryAsset(_0x109ee4, _0x50cbde),
      getSelectedAppearance: getSelectedAssetAppearance,
      showToast: _0x50d1ac,
      showTaskApiKeyError: _0x2f2968,
      showTaskResultToast: _0x2024a5,
      notifyTaskResult: notifyStoryTaskResult,
      showNavigableTaskResultToast: _0x437371,
    }),
    {
      generateSelected: _0x3799ed,
      requestAppearanceImage: _0x4e0e73,
      resumePersistedTasks: _0x53d4c1,
      showGenerationError: _0x1b5996,
    } = _0x240aa7,
    _0x342f63 = createStoryAssetBatchGenerationController({
      state: _0x109ee4,
      windowObject: windowObject,
      cancellationRegistry: _0x1d9381,
      hasImageGenerator: () => typeof generateAssetImage === 'function',
      createProjectToken: () => _0xa88d71(_0x109ee4),
      isProjectTaskLive: _0x1539c4,
      isProjectTaskCurrent: _0x111644,
      createTaskBatch: _0xdfe98f,
      syncTaskBatch: _0x43e7dd,
      updateBackgroundTaskBatch: _0x101eef,
      requestAppearanceImage: _0x4e0e73,
      requestVoiceGeneration: _0xbfaf3,
      stopVoicePreview: _0x49f360,
      render: _0xb8a26b,
      refreshBatchLabel: _0xd51873,
      refreshAssetCard: _0x12cdc4,
      refreshSelectedAsset: _0x4d5584,
      schedulePersistence: _0x487a78,
      showToast: _0x50d1ac,
      showAssetGenerationError: _0x1b5996,
      showTaskApiKeyError: _0x2f2968,
      notifyTaskResult: notifyStoryTaskResult,
      showNavigableTaskResultToast: _0x437371,
      notifyNavigableGenerationComplete: _0x34edeb,
    }),
    { cancel: _0x4baec6, generate: _0x5af5f7 } = _0x342f63;
  function _0x219024(_0x2baef2) {
    return findStoryAssetForHover(_0x109ee4, _0x2baef2, getVisibleStoryAssets(_0x109ee4));
  }
  function _0x17bd82(_0x3a42f7, _0x4a4318) {
    if (
      _0x3a42f7?.['closest']?.('.story-assets-page .story-asset-card-shell') ||
      _0x549cf5['isActive']() ||
      _0x31318e
    ) {
      _0x456306();
      return;
    }
    if (_0x3a42f7?.['dataset']?.['storyReferenceSource'] === 'library') {
      const _0x37e01f = resolveAssetMentionRef({
          assetId: _0x3a42f7['dataset']['storyReferenceAsset'],
          itemIndex: Math['max'](
            0x0,
            Math['trunc'](Number(_0x3a42f7['dataset']['storyReferenceAssetIndex']) || 0x0),
          ),
        }),
        _0x4755a6 =
          _0x37e01f?.['type'] === 'image'
            ? normalizeText(_0x37e01f['thumbUrl'] || _0x37e01f['url'])
            : normalizeText(_0x37e01f?.['thumbUrl']);
      if (!_0x37e01f || !_0x4755a6) {
        _0x456306();
        return;
      }
      return _0x1f3d39(_0x3a42f7, _0x4a4318, {
        id: normalizeText(_0x37e01f['assetId']),
        kind: 'library',
        name: normalizeText(_0x37e01f['name']) || '总素材',
        hoverTitle: normalizeText(_0x37e01f['assetName']) || '总素材',
        imageUrl: _0x4755a6,
        isLibraryAsset: !![],
      });
    }
    const _0x25fd9f = normalizeText(_0x3a42f7?.['dataset']?.['storyReferenceFrame']);
    if (_0x25fd9f) {
      const _0x1cd1dc = normalizeStoryClipFrames(_0x109ee4['data']['clipFrames'])['find'](
        (_0x2a5322) => _0x2a5322['id'] === _0x25fd9f,
      );
      return _0x1f3d39(
        _0x3a42f7,
        _0x4a4318,
        createStoryClipFrameHoverAsset(_0x1cd1dc, getStoryAssetHoverCardId(_0x3a42f7)),
      );
    }
    return _0x1f3d39(
      _0x3a42f7,
      _0x4a4318,
      _0x219024(getStoryAssetHoverCardId(_0x3a42f7)),
      getStoryAssetHoverCardAppearanceId(_0x3a42f7),
    );
  }
  function _0x456306() {
    _0x2c041c['hide']();
  }
  _0x27857a = createStoryMediaHistoryMenuController({
    menuElement: _0x401ab9,
    windowObject: windowObject,
    getMarkup: (_0x249c43) => {
      if (_0x109ee4['clipSelectionMode']) return '';
      const _0x54a01d = getSelectedEpisode(_0x109ee4),
        _0x472980 = normalizeText(_0x249c43?.['dataset']?.['storyClipId']),
        _0x57f9ab = (Array['isArray'](_0x54a01d?.['clips']) ? _0x54a01d['clips'] : [])['find'](
          (_0x5b4edb) => normalizeText(_0x5b4edb?.['id']) === _0x472980,
        );
      return (
        _0x401ab9 && (_0x401ab9['dataset']['storyClipId'] = _0x472980),
        storyClipProduction['renderEpisode'](_0x109ee4, _0x54a01d, _0x57f9ab)['videoHistoryMenu']
      );
    },
  });
  function _0x21f5cb() {
    _0x27857a?.['clearHideTimer']();
  }
  function _0x15d8ff(_0x4c9de8 = {}) {
    _0x27857a?.['hide'](_0x4c9de8);
  }
  function _0x4b5bfd(_0x221446, _0x282ba4) {
    _0x27857a?.['show'](_0x221446, { event: _0x282ba4 });
  }
  function _0x4af1e5(_0x52268d, _0x217f1d, { persist: persist = ![], layout: layout = null } = {}) {
    const _0x2a1c25 =
        layout ||
        _0x44835e['querySelector']('.story-page.is-current .story-episode-detail-page') ||
        _0x44835e['querySelector']('.story-episode-detail-page'),
      _0x49a37b = applyStoryEpisodePanelRatiosToLayout(
        _0x2a1c25,
        {
          assetSplitter: _0x2a1c25?.['querySelector']?.('[data-story-episode-splitter=\x22assets\x22]'),
          previewSplitter: _0x2a1c25?.['querySelector']?.('[data-story-episode-splitter=\x22preview\x22]'),
        },
        _0x52268d,
        _0x217f1d,
      );
    ((_0x109ee4['episodeAssetPanelRatio'] = _0x49a37b['left']),
      (_0x109ee4['episodeEditorPanelRatio'] = _0x49a37b['center']));
    if (persist) _0x487a78({ uiOnly: !![] });
  }
  function _0x22a215(_0x4ce08a) {
    const _0x1eaf48 = _0x4ce08a['target']['closest']?.('[data-story-episode-splitter]');
    if (!_0x1eaf48) return ![];
    const _0x1a3c7a = _0x1eaf48['closest']('.story-episode-detail-page'),
      _0x2e2cc8 = _0x1eaf48['dataset']['storyEpisodeSplitter'];
    return beginStoryHorizontalResizeSession({
      event: _0x4ce08a,
      splitter: _0x1eaf48,
      layout: _0x1a3c7a,
      windowObject: windowObject,
      body: documentObject['body'],
      resizingClass: 'story-episode-resizing',
      onRatio: (_0x429b23) => {
        _0x2e2cc8 === 'assets'
          ? _0x4af1e5(_0x429b23, _0x109ee4['episodeEditorPanelRatio'], { layout: _0x1a3c7a })
          : _0x4af1e5(_0x109ee4['episodeAssetPanelRatio'], _0x429b23 - _0x109ee4['episodeAssetPanelRatio'], {
              layout: _0x1a3c7a,
            });
      },
      onFinish: () => _0x487a78({ uiOnly: !![] }),
    });
  }
  function _0x1925bd() {
    _0x198a72['innerHTML'] = _0x109ee4['view'] === 'home' ? '' : renderProjectToolbar(_0x109ee4);
  }
  function _0x521761(_0x804618, _0xb4dd57, _0x4cb63b) {
    if (!_0x804618 || _0x804618['dataset']?.['promptPillKind'] === 'time') return;
    (syncStoryClipPromptPillHoverTarget(_0x804618),
      _0x804618['querySelectorAll']?.('[data-story-voice-separator], [data-story-voice-toggle]')?.['forEach'](
        (_0x15ee90) => _0x15ee90['remove'](),
      ),
      _0x804618['classList']?.['remove']('has-story-voice-reference', 'is-story-voice-enabled'));
    const _0x7c6af9 = getSelectedEpisode(_0x109ee4),
      _0x527c17 = getStoryAssetIdFromMentionNodeId(_0x804618['dataset']?.['assetId']),
      _0x3acbc3 = resolveStoryVideoReplicationClipVoiceAssetIds(_0x109ee4['data'], _0x4cb63b);
    if (_0x3acbc3 && !_0x3acbc3['includes'](_0x527c17)) {
      setStoryClipMentionVoiceEnabled(_0x804618, _0x109ee4['data']['assets'], ![]);
      return;
    }
    const _0x375da7 = getStoryEpisodeCharacterVoiceEnabled(_0x7c6af9, _0x527c17);
    typeof _0x375da7 === 'boolean' &&
      setStoryClipMentionVoiceEnabled(_0x804618, _0x109ee4['data']['assets'], _0x375da7);
    const _0x28b2f0 = getStoryClipMentionVoiceState(_0x804618, _0x109ee4['data']['assets'], {
      voiceEnabled: _0x375da7,
    });
    if (!_0x28b2f0['available']) {
      setStoryClipMentionVoiceEnabled(_0x804618, _0x109ee4['data']['assets'], ![]);
      return;
    }
    (_0x804618['classList']?.['add']('has-story-voice-reference'),
      _0x804618['classList']?.['toggle']('is-story-voice-enabled', _0x28b2f0['enabled']));
    const _0x75230c = documentObject['createElement']('span');
    ((_0x75230c['className'] = 'story-voice-pill-separator'),
      (_0x75230c['dataset']['storyVoiceSeparator'] = 'true'),
      _0x75230c['setAttribute']('aria-hidden', 'true'),
      _0x75230c['setAttribute']('contenteditable', 'false'),
      (_0x75230c['textContent'] = '·'));
    const _0x48881d = documentObject['createElement']('button');
    ((_0x48881d['type'] = 'button'),
      (_0x48881d['className'] = 'story-voice-pill-toggle' + (_0x28b2f0['enabled'] ? '\x20is-active' : '')),
      (_0x48881d['dataset']['storyVoiceToggle'] = 'true'),
      _0x48881d['setAttribute']('contenteditable', 'false'),
      _0x48881d['setAttribute']('aria-pressed', String(_0x28b2f0['enabled'])),
      _0x48881d['setAttribute']('aria-label', _0x28b2f0['enabled'] ? '关闭角色声音参考' : '启用角色声音参考'),
      (_0x48881d['innerHTML'] = renderStoryVoiceIcon(![])),
      _0x48881d['addEventListener']('mousedown', (_0x2f029f) => {
        (_0x2f029f['preventDefault'](), _0x2f029f['stopPropagation']());
      }),
      _0x48881d['addEventListener']('click', (_0x1e4529) => {
        (_0x1e4529['preventDefault'](), _0x1e4529['stopPropagation']());
        const _0xb31c55 = getStoryEpisodeCharacterVoiceEnabled(_0x7c6af9, _0x527c17),
          _0x28360a = getStoryClipMentionVoiceState(_0x804618, _0x109ee4['data']['assets'], {
            voiceEnabled: _0xb31c55,
          }),
          _0x232ede = !_0x28360a['enabled'];
        (setStoryEpisodeCharacterVoiceEnabled(_0x7c6af9, _0x527c17, _0x232ede),
          _0xb4dd57['querySelectorAll']?.('.ref-pill')?.['forEach']((_0x2d1cae) => {
            if (getStoryAssetIdFromMentionNodeId(_0x2d1cae['dataset']?.['assetId']) !== _0x527c17) return;
            (setStoryClipMentionVoiceEnabled(_0x2d1cae, _0x109ee4['data']['assets'], _0x232ede),
              _0x521761(_0x2d1cae, _0xb4dd57, _0x4cb63b));
          }),
          (_0x4cb63b['prompt'] = sanitizePromptHtmlForCommit(_0xb4dd57['innerHTML'])),
          _0x2fa8a7(),
          _0x487a78());
      }),
      _0x804618['appendChild'](_0x75230c),
      _0x804618['appendChild'](_0x48881d));
  }
  function _0x2f6058() {
    const _0x4207b0 = findStoryAsset(_0x109ee4, _0x109ee4['selectedAssetId']),
      _0x5d1d56 = _0x4207b0 ? getSelectedAssetAppearance(_0x109ee4, _0x4207b0) : null;
    return { asset: _0x4207b0, appearance: _0x5d1d56 };
  }
  function _0x4a3aa8(_0x38e32e) {
    const _0x15651e = getStoryAssetPromptEditorContext(_0x109ee4, _0x38e32e);
    if (!_0x38e32e || !_0x15651e['asset'] || !_0x15651e['appearance'] || _0x15651e['asset']['isLibraryAsset'])
      return null;
    return {
      nodeId: 'story-asset-prompt:' + _0x15651e['asset']['id'],
      promptEl: _0x38e32e,
      _data: { type: 'ai-image', model: _0x109ee4['models']['image'], provider: _0x109ee4['imageProvider'] },
      getMentionCandidates: ({ query: query = '' } = {}) => {
        const { asset: _0xc5c74e, appearance: _0x13f33c } = getStoryAssetPromptEditorContext(
          _0x109ee4,
          _0x38e32e,
        );
        if (
          !_0xc5c74e ||
          !_0x13f33c ||
          _0xc5c74e['isLibraryAsset'] ||
          !isStoryAssetBaseAppearance(_0xc5c74e, _0x13f33c)
        )
          return [];
        const _0x3a5b86 = buildStoryAssetStyleReferenceMentionCandidate(_0x13f33c, { query: query });
        return _0x3a5b86 ? [_0x3a5b86] : [];
      },
      getMentionVisual: ({ mention: _0x287372 } = {}) => ({
        thumbUrl: normalizeText(_0x287372?.['thumbUrl']),
        iconType: 'image',
      }),
      decorateMentionPill: ({ pill: _0x220ba5 } = {}) => {
        (_0x220ba5?.['classList']?.['add']('story-asset-style-reference-pill'),
          _0x220ba5?.['dataset'] &&
            (_0x220ba5['dataset']['promptPillKind'] = STORY_ASSET_STYLE_REFERENCE_PILL_KIND));
      },
      commitPromptHtml: () => {
        updateStoryAssetPromptFromEditor(_0x109ee4, _0x38e32e) && _0x487a78();
      },
      getPromptHtml: () => {
        const { appearance: _0x233345 } = getStoryAssetPromptEditorContext(_0x109ee4, _0x38e32e);
        return _0x233345?.['prompt'] || '';
      },
    };
  }
  function _0x56a58c(_0x116f2d) {
    const _0x4a884d = getSelectedEpisode(_0x109ee4),
      _0x318d3c = getSelectedClip(_0x109ee4, _0x4a884d);
    if (!_0x116f2d || !_0x4a884d || !_0x318d3c) return null;
    if (_0x109ee4['data']['project']['sourceMode'] === 'video-replication')
      mountStorySpeechGapEditor(_0x116f2d);
    return {
      nodeId: 'story-clip:' + _0x318d3c['id'],
      promptEl: _0x116f2d,
      keepAssetMentionPills: !![],
      _data: {
        type: 'ai-video',
        model: _0x109ee4['models']['video'],
        provider: _0x109ee4['videoProvider'],
        generationParams: _0x109ee4['videoGenerationParams'],
      },
      getMentionMenuPages: () => [
        { id: 'assets', label: '素材', icon: 'assets' },
        { id: 'tools', label: '工具', icon: 'tools' },
      ],
      getMentionMenuDefaultPage: () => 'assets',
      getMentionCandidates: ({ query: query = '' } = {}) =>
        buildStoryClipMentionCandidates({
          assets: _0x109ee4['data']['assets'],
          episode: _0x4a884d,
          libraryCandidates: getAssetMentionCandidates(),
          clipFrames: _0x109ee4['data']['clipFrames'],
          query: query,
          includeTime: !![],
          includeClipFrames: !![],
          defaultDuration: _0x318d3c['duration'],
        })['map']((_0x5ccc3e) =>
          _0x5ccc3e['pillKind'] === 'time'
            ? { ..._0x5ccc3e, thumbNode: createStoryClipTimeMentionIcon(documentObject) }
            : _0x5ccc3e,
        ),
      onMentionCandidateHover: ({ candidate: _0x3f5bb9, item: _0x2004f7, event: _0x5e49d1 } = {}) => {
        const _0x593204 = normalizeText(_0x3f5bb9?.['storyClipFrameId']);
        if (_0x593204 && _0x2004f7) {
          const _0x8128ed = normalizeStoryClipFrames(_0x109ee4['data']['clipFrames'])['find'](
              (_0x3a5bab) => _0x3a5bab['id'] === _0x593204,
            ),
            _0x48814b = resolveStoryClipFrameImageUrl(_0x8128ed);
          if (!_0x8128ed || !_0x48814b) {
            _0x456306();
            return;
          }
          _0x1f3d39(_0x2004f7, _0x5e49d1, {
            id: 'story-clip-frame-preview:' + _0x8128ed['id'],
            kind: 'clip-frame',
            name: normalizeText(_0x3f5bb9['subtitle'] || _0x8128ed['name']) || '视频提取帧',
            hoverTitle: normalizeText(_0x3f5bb9['label']) || '片段帧',
            imageUrl: _0x48814b,
            isLibraryAsset: !![],
          });
          return;
        }
        const _0xdbd685 = normalizeText(_0x3f5bb9?.['storyAssetId']),
          _0x3f531d = normalizeText(_0x3f5bb9?.['storyAppearanceId']);
        if (!_0xdbd685 || !_0x2004f7) {
          _0x456306();
          return;
        }
        ((_0x2004f7['dataset']['storyAssetHoverId'] = _0xdbd685),
          _0x3f531d
            ? (_0x2004f7['dataset']['storyAssetHoverAppearanceId'] = _0x3f531d)
            : delete _0x2004f7['dataset']['storyAssetHoverAppearanceId'],
          _0x17bd82(_0x2004f7, _0x5e49d1));
      },
      onMentionCandidateHoverEnd: () => _0x456306(),
      getMentionVisual: ({ mention: _0x160ff1, pill: _0x5b6653 } = {}) => {
        const _0x1dbcfb = normalizeText(
          _0x160ff1?.['pillKind'] || _0x5b6653?.['dataset']?.['promptPillKind'],
        );
        if (_0x1dbcfb === 'time') return { thumbNode: createStoryClipTimeMentionIcon(documentObject) };
        if (_0x160ff1?.['storyAssetId'])
          return { thumbUrl: normalizeText(_0x160ff1['thumbUrl']), iconType: 'image' };
        const _0x3ff08d = resolveStoryClipFrameMentionRef(
          { dataset: { assetId: _0x160ff1?.['assetId'] || _0x5b6653?.['dataset']?.['assetId'] } },
          _0x109ee4['data']['clipFrames'],
        );
        if (_0x3ff08d)
          return { thumbUrl: normalizeText(_0x3ff08d['thumbUrl'] || _0x3ff08d['url']), iconType: 'image' };
        const _0x31b711 = resolveStoryClipAssetMentionRef(_0x5b6653, _0x109ee4['data']['assets']);
        if (!_0x31b711) return null;
        return { thumbUrl: normalizeText(_0x31b711['thumbUrl'] || _0x31b711['url']), iconType: 'image' };
      },
      decorateMentionPill: ({ pill: _0x3fc60b } = {}) => {
        (_0x521761(_0x3fc60b, _0x116f2d, _0x318d3c),
          _0x3fc60b?.['dataset']?.['refUnresolved'] === 'true' &&
            (_0x3fc60b['setAttribute']?.('data-tooltip', '缺少图片素材'),
            _0x3fc60b['removeAttribute']?.('data-native-title'),
            _0x3fc60b['removeAttribute']?.('data-tooltip-source'),
            _0x3fc60b['removeAttribute']?.('title')));
      },
      commitPromptHtml: (_0x3ecd45) => {
        ((_0x318d3c['prompt'] = _0x3ecd45), _0x2fa8a7(), _0x487a78());
      },
      getPromptHtml: () => _0x318d3c['prompt'],
      onPromptPillActivate: ({ pill: _0x26ad6c } = {}) => {
        if (_0x26ad6c?.['dataset']?.['promptPillKind'] !== 'time') return ![];
        return (
          beginStoryClipTimePillEdit({
            pill: _0x26ad6c,
            documentObject: documentObject,
            onCommit: () => {
              ((_0x318d3c['prompt'] = sanitizePromptHtmlForCommit(_0x116f2d['innerHTML'])), _0x487a78());
            },
          }),
          !![]
        );
      },
    };
  }
  function _0x3c392f(_0x581149, { assetIndex: assetIndex = 0x0, triggerRange: triggerRange = null } = {}) {
    const _0x380ff1 = findStoryAsset(_0x109ee4, _0x581149),
      _0x43bb0f = getSelectedEpisode(_0x109ee4),
      _0x52b6c8 = getSelectedClip(_0x109ee4, _0x43bb0f);
    if (!_0x52b6c8) return ![];
    const _0xb33e23 = _0x2e97b0['querySelector']('[data-story-clip-prompt]'),
      _0x2fe1e6 = _0x56a58c(_0xb33e23);
    let _0x79ba84 = _0x380ff1
      ? buildStoryClipMentionCandidates({
          assets: [_0x380ff1],
          episode: { assetIds: [_0x380ff1['id']] },
        })[0x0]
      : null;
    !_0x79ba84 &&
      (_0x79ba84 = buildStoryClipFrameMentionCandidates(_0x109ee4['data']['clipFrames'], {
        clips: _0x43bb0f?.['clips'],
        episodeId: _0x43bb0f?.['id'],
      })
        ['flatMap']((_0x1af5de) => _0x1af5de['mentionVariants'] || [_0x1af5de])
        ['find'](
          (_0x5c623b) => _0x5c623b['assetId'] === normalizeText(_0x581149) && !_0x5c623b['limitReason'],
        ));
    if (!_0x79ba84) {
      const _0x1a0e75 = resolveAssetMentionRef({
        assetId: _0x581149,
        itemIndex: Math['max'](0x0, Math['trunc'](Number(assetIndex) || 0x0)),
      });
      _0x79ba84 = _0x1a0e75 ? buildStoryClipMentionCandidates({ libraryCandidates: [_0x1a0e75] })[0x0] : null;
    }
    if (!_0x2fe1e6 || !_0x79ba84) return ![];
    const _0x168224 = triggerRange
      ? _insertMentionPill(_0x2fe1e6, {
          candidate: _0x79ba84,
          triggerRange: triggerRange,
          atIndex: triggerRange['startOffset'],
        })
      : Boolean(appendMentionPillToPrompt(_0x2fe1e6, _0x79ba84));
    if (!_0x168224) return ![];
    return (_0xb33e23?.['focus']?.(), !![]);
  }
  const _0x549cf5 = createStoryAssetPromptDragController({
      root: _0x2e97b0,
      documentObject: documentObject,
      windowObject: windowObject,
      insertMention: _0x3c392f,
      hideHoverPreview: _0x456306,
    }),
    {
      begin: _0x96940,
      finish: _0x28d3ef,
      handleWindowPointerCancel: _0x26aeab,
      handleWindowPointerMove: _0xa05991,
      handleWindowPointerUp: _0x4a7636,
      hideCaret: _0x650343,
      showCaret: _0x4bbd06,
    } = _0x549cf5;
  function _0x132152() {
    ((_0x31318e = ''), (_0x398985 = 0x0), _0x549cf5['clear']());
  }
  const _0x7d25b8 = createStoryClipAdjustmentController({
      state: _0x109ee4,
      root: _0x2e97b0,
      documentObject: documentObject,
      adjustClipPrompt: adjustClipPrompt,
      getSelection: () => {
        const _0x5b5542 = getSelectedEpisode(_0x109ee4);
        return { episode: _0x5b5542, clip: getSelectedClip(_0x109ee4, _0x5b5542) };
      },
      projectTasks: {
        createToken: () => _0xa88d71(_0x109ee4),
        isLive: _0x1539c4,
        isCurrent: _0x111644,
        syncEntry: _0x262e0d,
      },
      applyClipVideoSettings: _0x38bff8,
      schedulePersistence: _0x487a78,
      render: _0xb8a26b,
      refreshPromptRestore: _0x2a1e31,
      refreshReferenceSummary: _0x2fa8a7,
      refreshTimeline: _0x5f0bd5,
      notifyTextTaskComplete: _0x176e4e,
      showToast: _0x50d1ac,
      showTaskApiKeyError: _0x2f2968,
      showTaskResultToast: _0x2024a5,
    }),
    {
      applySelected: _0x5354b3,
      discardSelected: _0x1052be,
      generateCandidate: _0x46422f,
      regenerateSelected: _0x4d9f47,
      resetUi: _0x216d6c,
      restorePromptHistory: _0x32d5e0,
    } = _0x7d25b8;
  function _0xeeb243(_0x19713d) {
    const _0x3019e8 = _0x19713d?.['querySelector']?.('[data-story-clip-prompt]'),
      _0x4b3f9b = _0x56a58c(_0x3019e8);
    if (!_0x4b3f9b) return null;
    const _0x5847dc = bindPromptMentionHost(_0x4b3f9b);
    return (
      syncStoryClipPromptPillPresentation(
        _0x3019e8,
        _0x109ee4['data']['assets'],
        _0x109ee4['data']['clipFrames'],
      ),
      _0x5847dc
    );
  }
  function _0x323bdd(_0x5ad3a8) {
    const _0x44b003 = _0x5ad3a8?.['querySelector']?.('[data-story-asset-prompt][contenteditable="true"]'),
      _0x156f81 = _0x4a3aa8(_0x44b003);
    if (!_0x156f81) return null;
    return bindPromptMentionHost(_0x156f81, { commitHydratedPrompt: ![] });
  }
  function _0x16e29d(_0xabc6b0) {
    const _0x2551a4 = getSelectedEpisode(_0x109ee4),
      _0x529158 = getSelectedClip(_0x109ee4, _0x2551a4);
    return bindStoryVideoPreviewPlayer(_0xabc6b0, {
      projectId: _0x109ee4['data']?.['project']?.['id'],
      episodeId: _0x2551a4?.['id'],
      clipId: _0x529158?.['id'],
    });
  }
  const _0x1c02fc = createStoryClipFrameProductionController({
      state: _0x109ee4,
      viewportEl: _0x44835e,
      documentObject: documentObject,
      windowObject: windowObject,
      getSelection: () => {
        const _0x50264f = getSelectedEpisode(_0x109ee4);
        return { episode: _0x50264f, clip: getSelectedClip(_0x109ee4, _0x50264f) };
      },
      projectTasks: {
        createToken: () => _0xa88d71(_0x109ee4),
        isLive: _0x1539c4,
        isCurrent: _0x111644,
        syncEntry: _0x262e0d,
      },
      schedulePersistence: _0x487a78,
      syncFrameToCanvas: _0x355aa1,
      syncFrameRail: _0x1adf2f,
      settleFrameCard: _0x39b2bf,
      render: _0xb8a26b,
      showToast: _0x50d1ac,
    }),
    { captureSelected: _0x5074b8, trimSelected: _0x1e1621 } = _0x1c02fc;
  function _0x30db99(_0xdafe0e) {
    const _0x840fb5 = documentObject['createElement']('article');
    ((_0x840fb5['className'] = 'story-page'), (_0x840fb5['innerHTML'] = _0xdafe0e));
    const _0x5b1308 = _0x840fb5['querySelector']('[data-story-marquee-page-surface]');
    _0x5b1308?.['dataset']['storyMarqueePageSurface'] &&
      (_0x840fb5['dataset']['storyMarqueeSurface'] = _0x5b1308['dataset']['storyMarqueePageSurface']);
    _0x840fb5['querySelector']('.story-outline-page') && _0x840fb5['classList']['add']('story-page--outline');
    (_0x840fb5['querySelector']('.story-assets-layout')?.['style']['setProperty'](
      '--story-assets-left',
      normalizeStoryAssetSplitRatio(_0x109ee4['assetSplitRatio']) + '%',
    ),
      _0x840fb5['querySelector']('.story-assets-page')?.['style']['setProperty'](
        '--story-assets-left',
        normalizeStoryAssetSplitRatio(_0x109ee4['assetSplitRatio']) + '%',
      ));
    const _0x558624 = normalizeStoryEpisodePanelRatios(
        _0x109ee4['episodeAssetPanelRatio'],
        _0x109ee4['episodeEditorPanelRatio'],
      ),
      _0x2dfd45 = _0x840fb5['querySelector']('.story-episode-detail-page');
    return (
      _0x2dfd45?.['style']['setProperty']('--story-episode-assets-width', _0x558624['left'] + '%'),
      _0x2dfd45?.['style']['setProperty']('--story-episode-editor-width', _0x558624['center'] + '%'),
      _0x5a95c3(_0x840fb5),
      windowObject['requestAnimationFrame']?.(() =>
        _0x840fb5['querySelector']('[data-workspace-episode-rail-item][aria-current=\x22page\x22]')?.[
          'scrollIntoView'
        ]?.({ block: 'nearest', inline: 'nearest' }),
      ),
      _0x840fb5
    );
  }
  function _0x5a95c3(_0x2b5fd4) {
    const _0x4aef23 = [],
      _0x244ce6 = bindStoryWorkspacePricing(_0x2b5fd4, {
        state: _0x109ee4,
        getSelectedClip: () => getSelectedClip(_0x109ee4, getSelectedEpisode(_0x109ee4)),
        getSelectedImageData: () => {
          const _0x2fed56 = getSelectedStoryAsset(_0x109ee4, getVisibleStoryAssets(_0x109ee4)),
            _0x3a2c7e = _0x2fed56 ? getSelectedAssetAppearance(_0x109ee4, _0x2fed56) : null;
          return {
            prompt: _0x3a2c7e?.['prompt'] || _0x2fed56?.['prompt'] || '',
            referenceImageUrls: _0x2fed56 ? getStoryAssetAppearanceReferenceUrls(_0x2fed56, _0x3a2c7e) : [],
          };
        },
        getVideoReferenceCounts: (_0x120d58) => storyClipProduction['getInputReferenceCounts'](_0x120d58),
      });
    (_0x4aef23['push'](_0x244ce6),
      _0x4aef23['push'](
        bindStoryAudioAssets(_0x2b5fd4, {
          state: _0x109ee4,
          createToken: () => _0xa88d71(_0x109ee4),
          isLive: _0x1539c4,
          isCurrent: _0x111644,
          syncEntry: _0x262e0d,
          persist: _0x487a78,
          render: _0xb8a26b,
          uploadFile: uploadFile,
          saveAssetPackageItem: saveAssetPackageItem,
          showToast: _0x50d1ac,
          startTask: _0x2ccfa9,
          finishTask: _0x3cde55,
        }),
      ),
      _0x4aef23['push'](
        bindStoryReplicationIntake(_0x2b5fd4, {
          root: _0x2e97b0,
          state: _0x109ee4,
          analyze: (_0x4b426a) => _0x74bf2d['analyzeSelected'](_0x4b426a),
          sync: _0x41990e,
          persist: () => _0x487a78({ immediate: !![] }),
        }),
      ),
      _0x4aef23['push'](
        bindStoryReplicationReview(_0x2b5fd4, {
          state: _0x109ee4,
          createProjectToken: () => _0xa88d71(_0x109ee4),
          isProjectTaskLive: _0x1539c4,
          syncProjectEntry: _0x262e0d,
          schedulePersistence: _0x487a78,
          refreshFooter: () => _0xaaaaf7(),
          reanalyze: (_0x2e445d) => _0x74bf2d['reanalyzeEpisode'](_0x2e445d),
          showToast: _0x50d1ac,
        }),
      ));
    let _0x24ec67 = ![];
    const _0x5925e5 = () => {
      if (_0x24ec67) return;
      _0x24ec67 = !![];
      for (const _0x127763 of _0x4aef23['reverse']()) {
        try {
          _0x127763?.['destroy']?.();
        } catch (_0xb1c47b) {
          globalThis['console']?.['warn']?.('[storyWorkspace] 页面控制器清理失败', _0xb1c47b);
        }
      }
      _0x4aef23['length'] = 0x0;
    };
    try {
      const _0x20d990 = (_0x54ac43, _0xfe72e) => {
        if (!_0x54ac43) return;
        const _0x26a03c = (_0x419f89) => {
          _0xfe72e(_0x419f89);
        };
        (_0x54ac43['addEventListener']('pointerdown', _0x26a03c),
          _0x4aef23['push']({ destroy: () => _0x54ac43['removeEventListener']('pointerdown', _0x26a03c) }));
      };
      (_0x20d990(_0x2b5fd4['querySelector']('[data-story-assets-splitter]'), _0x4ede93),
        _0x20d990(_0x2b5fd4['querySelector']('[data-story-asset-detail-splitter]'), _0x460b52),
        _0x2b5fd4['querySelectorAll']('[data-story-episode-splitter]')['forEach']((_0x5da5e8) => {
          _0x20d990(_0x5da5e8, _0x22a215);
        }));
      const _0x412982 = _0x323bdd(_0x2b5fd4);
      _0x412982 && _0x4aef23['push'](_0x412982);
      const _0x70b3b2 = _0xeeb243(_0x2b5fd4);
      if (_0x70b3b2) _0x4aef23['push'](_0x70b3b2);
      let _0x4e4113 = _0x16e29d(_0x2b5fd4);
      _0x4aef23['push']({
        destroy() {
          (_0x4e4113?.['destroy']?.(), (_0x4e4113 = null));
        },
      });
      const _0x28450f = bindStoryOutlineNavigation(_0x2b5fd4, { windowObject: windowObject });
      if (_0x28450f) _0x4aef23['push'](_0x28450f);
      let _0x36b718 = null;
      const _0x4ede56 = () => {
        (_0x36b718?.['destroy']?.(), (_0x36b718 = null));
        const _0x5f17c2 = _0x2b5fd4['querySelector']('[data-aigen-text-model-selector]');
        if (!_0x5f17c2) return;
        const _0x55da8e = Boolean(
          _0x5f17c2['classList']?.['contains']('story-home-text-model-selector') &&
          _0x109ee4['view'] === 'home' &&
          _0x109ee4['homeTab'] === 'replication',
        );
        _0x36b718 = bindAIGenTextModelSelector(_0x5f17c2, {
          modelId: _0x109ee4['models']['text'],
          provider: _0x109ee4['textProvider'],
          providerProfileId: _0x109ee4['textProviderProfileId'],
          getDisplayModelName: getDisplayModelName,
          documentObject: documentObject,
          onChange: ({ modelId: _0xa956f6, provider: _0x30882c, providerProfileId: _0x17c72a }) => {
            if (_0x55da8e && resolveStoryVideoInputTextModelId(_0xa956f6) !== _0xa956f6) return;
            ((_0x109ee4['models']['text'] = _0xa956f6),
              (_0x109ee4['textProvider'] = _0x30882c),
              (_0x109ee4['textProviderProfileId'] = _0x17c72a),
              _0x487a78());
          },
        });
      };
      (_0x4ede56(),
        _0x4aef23['push']({
          destroy() {
            (_0x36b718?.['destroy']?.(), (_0x36b718 = null));
          },
        }));
      const _0x120922 = _0x2b5fd4['querySelector']('[data-aigen-image-model-selector]');
      if (_0x120922) {
        const _0x2976eb = bindAIGenImageModelSelector(_0x120922, {
          modelId: _0x109ee4['models']['image'],
          provider: _0x109ee4['imageProvider'],
          generationParams: _0x109ee4['imageGenerationParams'],
          generationParamsByModel: _0x109ee4['imageGenerationParamsByModel'],
          showSchemaControls: !![],
          onChange: ({
            modelId: _0x2894cd,
            provider: _0x7c55d6,
            generationParams: _0x337fc5,
            generationParamsByModel: _0x31d1ac,
          }) => {
            ((_0x109ee4['models']['image'] = _0x2894cd),
              (_0x109ee4['imageProvider'] = resolveModelProvider(_0x2894cd, _0x7c55d6)),
              (_0x109ee4['imageGenerationParams'] = normalizeStoryImageGenerationParams(
                _0x2894cd,
                _0x337fc5,
              )),
              (_0x109ee4['imageGenerationParamsByModel'] = _0x31d1ac),
              _0x487a78());
          },
          documentObject: documentObject,
          windowObject: windowObject,
          floatingMenuHost: _0x2e97b0,
          schemaPopupPlacement: 'portal-auto-up',
        });
        _0x4aef23['push'](_0x2976eb);
      }
      let _0x5420f4 = null,
        _0x2a857e = null;
      const _0x461517 = _0x2b5fd4['querySelector']('[data-aigen-video-model-selector]');
      if (_0x461517) {
        const _0x3a8521 = getSelectedClip(_0x109ee4, getSelectedEpisode(_0x109ee4)),
          _0x353a0f = resolveStoryClipVideoGenerationParams(
            _0x3a8521,
            _0x109ee4['models']['video'],
            _0x109ee4['videoGenerationParams'],
          );
        ((_0x5420f4 = bindAIGenVideoModelSelector(_0x461517, {
          modelId: _0x109ee4['models']['video'],
          provider: _0x109ee4['videoProvider'],
          generationParams: _0x353a0f,
          generationParamsByModel: {
            ..._0x109ee4['videoGenerationParamsByModel'],
            [_0x109ee4['models']['video']]: { ..._0x353a0f },
          },
          providerProfileId: _0x109ee4['videoProviderProfileId'],
          providerProfileIdByModel: _0x109ee4['videoProviderProfileIdByModel'],
          referenceCounts: storyClipProduction['getInputReferenceCounts'](
            getSelectedClip(_0x109ee4, getSelectedEpisode(_0x109ee4)),
          ),
          showSchemaControls: !![],
          runningHubWorkflowAllowedModelIds: STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS,
          modelSubmenuPlacement: 'viewport-auto',
          onChange: ({
            modelId: _0x296e99,
            provider: _0x420a48,
            generationParams: _0x5da694,
            generationParamsByModel: _0xc7728c,
            providerProfileId: _0xbeb5a8,
            providerProfileIdByModel: _0x579ca8,
            patch: _0x12ebe0,
          }) => {
            const _0x44ab3b = _0x109ee4['models']['video'],
              _0x8623bc = getSelectedClip(_0x109ee4, getSelectedEpisode(_0x109ee4)),
              _0x4a5604 = normalizeStoryVideoGenerationParams(_0x44ab3b, _0x109ee4['videoGenerationParams']),
              _0x45dfd1 = getStoryVideoFixedInputVisibilityKey(
                _0x44ab3b,
                _0x109ee4['videoProvider'],
                _0x4a5604,
              ),
              _0x24cbf0 = Boolean(_0x109ee4['videoGenerationParamsByModel']?.[_0x296e99]),
              _0x2a2609 = Boolean(_0x12ebe0?.['model']) && !_0x24cbf0,
              _0x592314 = Boolean(_0x12ebe0?.['model']) && _0x296e99 !== _0x44ab3b;
            _0x109ee4['models']['video'] = _0x296e99;
            if (_0x592314)
              syncStoryPromptModeForVideoModel(_0x109ee4, _0x296e99, getSelectedEpisode(_0x109ee4));
            ((_0x109ee4['videoProvider'] = resolveStoryVideoProvider(_0x296e99, _0x420a48)),
              (_0x109ee4['videoProviderProfileId'] = _0xbeb5a8),
              (_0x109ee4['videoProviderProfileIdByModel'] = _0x579ca8));
            const _0x219665 = normalizeStoryVideoGenerationParams(
              _0x296e99,
              _0x2a2609 ? applyStoryVideoInitialModeDefault(_0x296e99, _0x5da694) : _0x5da694,
            );
            let _0x291933 = _0x2a2609
              ? applyStoryAspectRatioToVideoGenerationParams(
                  _0x296e99,
                  _0x219665,
                  _0x109ee4['data']['project']?.['aspectRatio'],
                )
              : _0x219665;
            const _0x370465 = reconcileStoryClipVideoGenerationDurationChange({
              clip: _0x8623bc,
              previousModelId: _0x44ab3b,
              modelId: _0x296e99,
              previousGenerationParams: _0x4a5604,
              nextGenerationParams: _0x291933,
              generationParamsChanged: Boolean(_0x12ebe0?.['generationParams']),
              modelChanged: _0x592314,
            });
            _0x291933 = _0x370465['generationParams'];
            _0x370465['durationChanged'] && _0x319eed(_0x8623bc);
            ((_0x109ee4['videoGenerationParams'] = _0x291933),
              (_0x109ee4['videoGenerationParamsByModel'] = {
                ..._0xc7728c,
                [_0x44ab3b]: { ..._0x4a5604 },
                [_0x296e99]: { ..._0x109ee4['videoGenerationParams'] },
              }),
              _0x2d610d(),
              _0x487a78(),
              _0x2a857e?.['sync']());
            const _0x27fb03 =
              _0x45dfd1 !==
              getStoryVideoFixedInputVisibilityKey(
                _0x109ee4['models']['video'],
                _0x109ee4['videoProvider'],
                _0x109ee4['videoGenerationParams'],
              );
            _0x109ee4['view'] === 'episode' && (_0x12ebe0?.['model'] || _0x27fb03) && _0xb8a26b();
          },
          documentObject: documentObject,
          windowObject: windowObject,
          floatingMenuHost: _0x2e97b0,
          schemaPopupPlacement: 'portal-auto-up',
        })),
          _0x4aef23['push'](_0x5420f4));
      }
      const _0x33df5e = _0x2b5fd4['querySelector']('[data-story-video-provider-profile]');
      _0x461517 && _0x33df5e && _0x461517['appendChild'](_0x33df5e);
      _0x33df5e &&
        ((_0x2a857e = createModelProviderProfileControl({
          panel: _0x33df5e,
          getNodeData: () => ({
            model: _0x109ee4['models']['video'],
            provider: _0x109ee4['videoProvider'],
            providerProfileId: _0x109ee4['videoProviderProfileId'],
            providerProfileIdByModel: _0x109ee4['videoProviderProfileIdByModel'],
          }),
          onChange: (_0x42304e) => {
            if (_0x5420f4?.['applyProviderProfilePatch']?.(_0x42304e)) return;
            ((_0x109ee4['videoProviderProfileId'] = _0x42304e['providerProfileId']),
              (_0x109ee4['videoProviderProfileIdByModel'] = _0x42304e['providerProfileIdByModel']),
              _0x487a78(),
              _0x2a857e?.['sync']());
          },
        })),
        _0x4aef23['push']({ destroy: () => _0x2a857e?.['remove']() }));
      const _0x296cd3 = _0x2b5fd4['querySelector']('[data-story-character-voice-panel]');
      if (_0x296cd3 && _0x109ee4['characterVoiceEditor']) {
        const _0x36b0c4 = _0x296cd3['querySelector']('[data-story-character-voice-model-footer]'),
          _0x37cfdb = 'story-character-voice-draft-' + _0x109ee4['characterVoiceEditor']['assetId'],
          _0x45f8bc = {
            getState: () => ({
              nodes: { [_0x37cfdb]: _0x109ee4['characterVoiceEditor']?.['nodeData'] || {} },
            }),
            updateNodeData: (_0x294120, _0x53674c = {}) => {
              if (!_0x109ee4['characterVoiceEditor']) return;
              ((_0x109ee4['characterVoiceEditor']['nodeData'] = {
                ...(_0x109ee4['characterVoiceEditor']['nodeData'] || {}),
                ..._0x53674c,
              }),
                _0x244ce6['syncPrices']());
            },
          };
        if (_0x36b0c4) {
          const _0x4d1ad9 = _0x36b0c4['querySelector']('.img-model-btn-trigger'),
            _0x5ada14 = _0x36b0c4['querySelector']('.node-model-menu'),
            _0x597be6 = createFloatingModelMenuPortal({
              menu: _0x5ada14,
              trigger: _0x4d1ad9,
              host: _0x2e97b0,
              documentObject: documentObject,
              windowObject: windowObject,
              portalClass: 'aigen-audio-model-menu-portal',
              submenuPlacement: 'viewport-auto-up',
            });
          (_0x4aef23['push']({
            destroy: bindAudioWorkflowSchemaSlotControls({
              footer: _0x36b0c4,
              nodeId: _0x37cfdb,
              nodeData: _0x109ee4['characterVoiceEditor']['nodeData'],
              store: _0x45f8bc,
            }),
          }),
            _0x4aef23['push']({
              destroy: bindNodeFooterController(_0x36b0c4, { onOutsideClose: () => _0x597be6['close']() }),
            }));
          const _0x210266 = (_0x5425c3) => {
              _0x5425c3['stopPropagation']();
              const _0x1b66dc = !_0x597be6['isOpen']();
              closeNodeFooterMenus(_0x36b0c4);
              if (_0x1b66dc) _0x597be6['open']();
              else _0x597be6['close']();
            },
            _0x5e2281 = (_0x398d3) => _0x398d3['stopPropagation'](),
            _0x5e6414 = () => _0x597be6['close']();
          (_0x4d1ad9?.['addEventListener']('click', _0x210266),
            _0x5ada14?.['addEventListener']('click', _0x5e2281),
            _0x36b0c4['addEventListener']('ui-schema-menu-before-open', _0x5e6414),
            _0x4aef23['push']({
              destroy: () => {
                (_0x4d1ad9?.['removeEventListener']('click', _0x210266),
                  _0x5ada14?.['removeEventListener']('click', _0x5e2281),
                  _0x36b0c4['removeEventListener']('ui-schema-menu-before-open', _0x5e6414),
                  _0x597be6['destroy']());
              },
            }));
          const _0x1b5ef4 = (_0x49e4a8) => {
            const _0xe9b350 = _0x49e4a8['target']['closest']('.node-menu-item[data-value]');
            if (
              !_0xe9b350 ||
              !_0x5ada14?.['contains'](_0xe9b350) ||
              _0xe9b350['dataset']['disabled'] === 'true'
            )
              return;
            (_0x49e4a8['stopPropagation'](),
              (_0x109ee4['characterVoiceEditor'] = selectStoryCharacterVoiceWorkflow(
                _0x109ee4['characterVoiceEditor'],
                _0xe9b350['dataset']['value'],
              )),
              _0xb8a26b());
          };
          (_0x5ada14?.['addEventListener']('click', _0x1b5ef4),
            _0x4aef23['push']({ destroy: () => _0x5ada14?.['removeEventListener']('click', _0x1b5ef4) }));
          const _0x46e638 = _0x36b0c4['querySelector']('.rh-adv-btn'),
            _0xc3e531 = _0x36b0c4['querySelector']('.rh-adv-panel'),
            _0x114a40 = (_0x5717da) => {
              _0x5717da['stopPropagation']();
              const _0x43c537 = !_0xc3e531?.['classList']['contains']('show');
              (_0x597be6['close'](),
                closeNodeFooterMenus(_0x36b0c4, _0x43c537 ? _0xc3e531 : null),
                _0xc3e531?.['classList']['toggle']('show', _0x43c537),
                _0x46e638?.['classList']['toggle']('active', _0x43c537),
                _0x46e638?.['setAttribute']('aria-expanded', String(_0x43c537)));
            };
          (_0x46e638?.['addEventListener']('click', _0x114a40),
            _0x4aef23['push']({ destroy: () => _0x46e638?.['removeEventListener']('click', _0x114a40) }));
        }
        const _0x345f74 = _0x296cd3['querySelector']('[data-audio-playback-surface]'),
          _0x42db57 = createAudioPlaybackSurfaceController(_0x345f74, {
            onBeforePlay: _0x49f360,
            onError: () => _0x50d1ac('声音参考播放失败。', 'warn'),
          });
        if (_0x42db57) _0x4aef23['push'](_0x42db57);
      }
      return (
        _0x234da6['set'](_0x2b5fd4, {
          syncPrices: _0x244ce6['syncPrices'],
          destroy: _0x5925e5,
          refreshTextModelSelector: _0x4ede56,
          refreshVideoPreview() {
            (_0x4e4113?.['destroy']?.(), (_0x4e4113 = _0x16e29d(_0x2b5fd4)));
          },
        }),
        _0x2b5fd4
      );
    } catch (_0x18587c) {
      _0x5925e5();
      throw _0x18587c;
    }
  }
  function _0x1206b1(_0x53c4dd) {
    (_0x234da6['get'](_0x53c4dd)?.['destroy']?.(), _0x234da6['delete'](_0x53c4dd), _0x53c4dd?.['remove']?.());
  }
  function _0x4d3491() {
    _0x594051['cancel']();
  }
  function _0x8d2362(
    _0x287adb,
    _0xcbb828 = 'none',
    _0x2e2691 = null,
    { transitionScope: transitionScope = 'page' } = {},
  ) {
    (_0x3881c5(), _0x4d3491());
    const _0xeaafca = _0x44835e['querySelector']('.story-page.is-current'),
      _0x51e22f = _0x30db99(_0x287adb);
    if (!_0xeaafca || _0xcbb828 === 'none')
      return (
        _0x44835e['querySelectorAll'](':scope\x20>\x20.story-page')['forEach']((_0x40b258) => {
          if (_0x40b258 !== _0x51e22f) _0x1206b1(_0x40b258);
        }),
        _0x44835e['replaceChildren'](_0x51e22f),
        _0x51e22f['classList']['add']('is-current'),
        _0x2e2691?.(),
        { page: _0x51e22f, committed: Promise['resolve'](!![]), committedImmediately: !![] }
      );
    const _0x1e36d1 = _0xeaafca['querySelector']('[data-story-assets-switch-region]'),
      _0x5731aa = _0x51e22f['querySelector']('[data-story-assets-switch-region]'),
      _0x420600 = transitionScope === 'asset-content' && _0x1e36d1 && _0x5731aa,
      _0x4e51dc = _0x51e22f['querySelector']('.story-asset-tabs'),
      _0xc71681 = _0x4e51dc?.['dataset']['activeTab'];
    _0x420600 &&
      _0x4e51dc &&
      (_0x4e51dc['dataset']['activeTab'] =
        _0xeaafca['querySelector']('.story-asset-tabs')?.['dataset']['activeTab'] || _0xc71681);
    const _0x4a0d38 = _0x594051['start']({
      current: _0xeaafca,
      next: _0x51e22f,
      parent: _0x44835e,
      direction: _0xcbb828,
      transitionElement: _0x420600
        ? _0x5731aa['querySelector']('.story-assets-layout--column-heading > .story-assets-list') || _0x5731aa
        : _0x51e22f,
      classNames: {
        current: 'is-current',
        scopeCurrent: _0x420600 ? 'story-page--asset-content-transition' : '',
        scopeNext: _0x420600 ? 'story-page--asset-content-transition' : '',
        scopeTarget: _0x420600 ? 'story-page--asset-content-transition-target' : '',
      },
      mount: () => _0x44835e['appendChild'](_0x51e22f),
      forceLayout: () => _0x4e51dc?.['getBoundingClientRect'](),
      onBeforeCommit: () => {
        if (_0x420600 && _0x4e51dc) _0x4e51dc['dataset']['activeTab'] = _0xc71681;
      },
      onTransitionComplete: _0x2e2691,
    });
    return {
      page: _0x51e22f,
      committed: _0x4a0d38?.['committed'] || Promise['resolve'](![]),
      committedImmediately: ![],
    };
  }
  function _0xde8860() {
    if (_0x109ee4['view'] === 'home') return 'home';
    const _0x34229e = normalizeText(_0x109ee4['data']?.['project']?.['id']) || 'draft';
    if (_0x109ee4['view'] === 'episode')
      return (
        'project:' + _0x34229e + ':episode:' + (normalizeText(_0x109ee4['selectedEpisodeId']) || 'selected')
      );
    if (
      _0x109ee4['step'] === 0x1 &&
      _0x109ee4['data']?.['project']?.['sourceMode'] !== 'video-replication' &&
      isStoryAssetExtractionOperation(_0x109ee4['storyPlanningOperation'])
    )
      return 'project:' + _0x34229e + ':asset-breakdown';
    return 'project:' + _0x34229e + ':step:' + normalizeStoryWorkspaceStep(_0x109ee4['step']);
  }
  function _0x2d84bd() {
    const _0x4feef6 = _0x44835e['querySelector']('.story-page.is-current');
    if (!_0x4feef6) return;
    const _0x3b36c7 = { ...(_0x109ee4['outlineSectionOpenState'] || {}) };
    (_0x4feef6['querySelectorAll']('details[data-story-outline-section]')['forEach']((_0x38ffb7) => {
      _0x3b36c7[_0x38ffb7['dataset']['storyOutlineSection']] = _0x38ffb7['open'];
    }),
      (_0x109ee4['outlineSectionOpenState'] = _0x3b36c7));
    const _0x4d838b = _0x309f60 || _0xde8860();
    _0x109ee4['pageScrollPositions'] = {
      ...(_0x109ee4['pageScrollPositions'] || {}),
      [_0x4d838b]: {
        top: Math['max'](0x0, Number(_0x4feef6['scrollTop']) || 0x0),
        left: Math['max'](0x0, Number(_0x4feef6['scrollLeft']) || 0x0),
      },
    };
  }
  function _0x529f88() {
    const _0x24a5b8 =
      _0x109ee4['view'] === 'project' &&
      _0x109ee4['step'] === 0x2 &&
      _0x109ee4['storyPlanningOperation'] === 'planning-episodes';
    (_0x317c92['classList']['toggle']('is-planning', _0x24a5b8),
      _0x317c92['setAttribute']('aria-busy', String(_0x24a5b8)),
      (_0xb03d0d['hidden'] = !_0x24a5b8),
      _0x24a5b8 && (_0x2d2c7a['textContent'] = _0x109ee4['storyPlanningStatus'] || '正在生成分镜视频'));
  }
  function _0x2ca1d8() {
    if (_0x109ee4['view'] !== 'project' || _0x109ee4['step'] !== 0x1) return ![];
    if (_0x109ee4['data']?.['project']?.['sourceMode'] === 'video-replication') return _0xaaaaf7();
    const _0x273643 = _0x44835e['querySelector']('.story-page.is-current\x20.story-page-footer');
    if (!_0x273643) return ![];
    const _0x3b4ea4 = documentObject['createElement']('template');
    _0x3b4ea4['innerHTML'] = renderStoryAssetExtractionFooter(_0x109ee4)['trim']();
    const _0x16e845 = _0x3b4ea4['content']['firstElementChild'];
    if (!_0x16e845) return ![];
    return (_0x273643['replaceWith'](_0x16e845), !![]);
  }
  function _0xb8a26b({
    direction: direction = 'none',
    updateToolbar: updateToolbar = !![],
    capturePageState: capturePageState = !![],
    onTransitionComplete: onTransitionComplete = null,
    transitionScope: transitionScope = 'page',
  } = {}) {
    _0xdac690?.['sync']();
    if (!_0x57f246) return (_0x3cc085['invalidate'](), Promise['resolve'](![]));
    _0x15d8ff();
    const _0x179191 = _0x44835e['querySelector']('.story-page.is-current'),
      _0x257e32 = _0x309f60 || _0xde8860(),
      _0x5de9b4 = _0xde8860(),
      _0x5e7342 =
        direction === 'none' && _0x257e32 === _0x5de9b4
          ? captureStoryWorkspaceNestedScrollPositions(_0x179191)
          : null;
    if (capturePageState) _0x2d84bd();
    const _0x4d1e82 = _0x109ee4['pageScrollPositions']?.[_0x5de9b4] || {};
    if (updateToolbar) _0x1925bd();
    const _0x37f756 = _0x8d2362(
        _0x109ee4['view'] === 'home' ? renderStoryHome(_0x109ee4) : renderProjectPage(_0x109ee4),
        direction,
        onTransitionComplete,
        { transitionScope: transitionScope },
      ),
      _0x1dc9b2 = _0x37f756['page'];
    return (
      _0x1dc9b2 &&
        ((_0x1dc9b2['scrollTop'] = Math['max'](0x0, Number(_0x4d1e82['top']) || 0x0)),
        (_0x1dc9b2['scrollLeft'] = Math['max'](0x0, Number(_0x4d1e82['left']) || 0x0)),
        restoreStoryWorkspaceNestedScrollPositions(_0x1dc9b2, _0x5e7342)),
      _0x37f756['committedImmediately']
        ? (_0x309f60 = _0x5de9b4)
        : void _0x37f756['committed']['then'](
            (_0x249ca6) => {
              _0x249ca6 &&
                _0x1dc9b2['isConnected'] &&
                _0x1dc9b2['classList']['contains']('is-current') &&
                (_0x309f60 = _0x5de9b4);
            },
            () => {},
          ),
      _0x529f88(),
      _0x3d3c35(),
      _0x37f756['committed']['then']((_0x28d0e3) => {
        if (_0x28d0e3) _0xdac690?.['sync']();
        return _0x28d0e3;
      })
    );
  }
  function _0x54cd25() {
    if (_0x109ee4['view'] !== 'project' || _0x109ee4['step'] !== 0x2) return null;
    return _0x44835e['querySelector']('.story-page.is-current');
  }
  function _0x1adf2f({ refreshContent: refreshContent = ![] } = {}) {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x1fabfd = _0x44835e['querySelector']('.story-page.is-current'),
      _0x17fe6e = _0x1fabfd?.['querySelector']('[data-story-episode-asset-rail]');
    if (!_0x1fabfd || !_0x17fe6e) return ![];
    if (refreshContent) {
      const _0x9777cf = documentObject['createElement']('div');
      _0x9777cf['innerHTML'] = renderEpisodeAssetRail(_0x109ee4);
      const _0x331f93 = _0x9777cf['firstElementChild'];
      ['assets', 'frames', 'library']['forEach']((_0x467501) => {
        const _0x565ae0 = _0x17fe6e['querySelector'](
            '[data-story-episode-asset-panel="' + _0x467501 + '\x22]',
          ),
          _0x1c518f = _0x331f93?.['querySelector']('[data-story-episode-asset-panel="' + _0x467501 + '\x22]');
        if (_0x565ae0 && _0x1c518f) _0x565ae0['innerHTML'] = _0x1c518f['innerHTML'];
        const _0x3340de = _0x17fe6e['querySelector'](
            '[data-story-episode-asset-count="' + _0x467501 + '\x22]',
          ),
          _0x1ebd07 = _0x331f93?.['querySelector'](
            '[data-story-episode-asset-count=\x22' + _0x467501 + '\x22]',
          );
        if (_0x3340de && _0x1ebd07) _0x3340de['textContent'] = _0x1ebd07['textContent'];
      });
    }
    const _0xda4f03 = normalizeStoryEpisodeAssetRailTab(_0x109ee4['episodeAssetRailTab']);
    ((_0x17fe6e['dataset']['activeTab'] = _0xda4f03),
      _0x17fe6e['querySelectorAll']('[data-story-episode-asset-tab]')['forEach']((_0x33d257) => {
        const _0x36ecbd = _0x33d257['dataset']['storyEpisodeAssetTab'] === _0xda4f03;
        (_0x33d257['classList']['toggle']('is-active', _0x36ecbd),
          _0x33d257['setAttribute']('aria-selected', String(_0x36ecbd)),
          (_0x33d257['tabIndex'] = _0x36ecbd ? 0x0 : -0x1));
      }),
      _0x17fe6e['querySelectorAll']('[data-story-episode-asset-panel]')['forEach']((_0x2e54ab) => {
        const _0x3c621b = _0x2e54ab['dataset']['storyEpisodeAssetPanel'] === _0xda4f03;
        (_0x2e54ab['classList']['toggle']('is-active', _0x3c621b),
          _0x2e54ab['setAttribute']('aria-hidden', String(!_0x3c621b)),
          (_0x2e54ab['inert'] = !_0x3c621b));
      }));
    const _0x49c91e = _0x17fe6e['querySelector']('[data-story-episode-asset-help]');
    return (_0x49c91e && (_0x49c91e['textContent'] = getStoryEpisodeAssetRailHelp(_0xda4f03)), !![]);
  }
  function _0x39b2bf(_0x116e78, { errorMessage: errorMessage = '' } = {}) {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x779b4b = normalizeText(_0x116e78),
      _0x46311e = [..._0x44835e['querySelectorAll']('[data-story-reference-frame]')]['find'](
        (_0x59a65f) => _0x59a65f['dataset']['storyReferenceFrame'] === _0x779b4b,
      );
    if (!_0x46311e) return ![];
    _0x46311e['setAttribute']('aria-busy', 'false');
    const _0x842012 = _0x46311e['closest']('.story-episode-frame-card')?.['querySelector'](
      '[data-story-action="delete-clip-frame"]',
    );
    if (_0x842012) _0x842012['disabled'] = ![];
    return (syncStoryClipFrameCardSaveError(_0x46311e, errorMessage), !![]);
  }
  function _0x16bd81(_0x53afc0) {
    if (_0x109ee4['view'] !== 'project' || _0x109ee4['step'] !== 0x3) return ![];
    const _0x153175 = _0x44835e['querySelector']('.story-page.is-current'),
      _0xe8e3f2 = _0x109ee4['data']['episodes']['find']((_0x4fa912) => _0x4fa912['id'] === _0x53afc0),
      _0x2a4ed2 = [...(_0x153175?.['querySelectorAll']('.story-episode-card[data-story-marquee-id]') || [])][
        'find'
      ]((_0x1e2f1f) => _0x1e2f1f['dataset']['storyMarqueeId'] === _0x53afc0);
    if (!_0x153175 || !_0xe8e3f2 || !_0x2a4ed2) return ![];
    const _0x9ce94a = documentObject['createElement']('div');
    _0x9ce94a['innerHTML'] = renderEpisodeCard(_0x109ee4, _0xe8e3f2);
    const _0x5e7a92 = _0x9ce94a['firstElementChild'];
    if (!_0x5e7a92) return ![];
    return (_0x2a4ed2['replaceWith'](_0x5e7a92), !![]);
  }
  function _0x12cdc4(_0x391be7) {
    const _0x145c8a = _0x54cd25(),
      _0x224341 = findStoryAsset(_0x109ee4, _0x391be7),
      _0x3703c8 = [...(_0x145c8a?.['querySelectorAll']('[data-story-asset-id]') || [])]['find'](
        (_0xdf0619) => _0xdf0619['dataset']['storyAssetId'] === _0x391be7,
      );
    if (!_0x145c8a || !_0x224341 || !_0x3703c8) return ![];
    const _0x497f8a = documentObject['createElement']('div');
    _0x497f8a['innerHTML'] = renderStoryAssetCard(_0x109ee4, _0x224341);
    const _0x275d9a = _0x497f8a['firstElementChild'];
    if (!_0x275d9a) return ![];
    return ((_0x3703c8['closest']('.story-asset-card-shell') || _0x3703c8)['replaceWith'](_0x275d9a), !![]);
  }
  function _0x4d5584() {
    const _0x5679a8 = _0x54cd25(),
      _0x3257ad = getVisibleStoryAssets(_0x109ee4),
      _0x6926d1 = getSelectedStoryAsset(_0x109ee4, _0x3257ad),
      _0x57674e = _0x5679a8?.['querySelector']('.story-asset-detail');
    if (!_0x5679a8 || !_0x6926d1 || _0x6926d1['isLibraryAsset'] || !_0x57674e) return ![];
    _0x5679a8['querySelectorAll']('[data-story-asset-id]')['forEach']((_0x5bd01f) => {
      _0x5bd01f['classList']['toggle'](
        'is-selected',
        _0x5bd01f['dataset']['storyAssetId'] === _0x6926d1['id'],
      );
    });
    const _0x4734dc = getStoryAssetAppearances(_0x6926d1),
      _0x494b7a = getSelectedAssetAppearanceIndex(_0x109ee4, _0x6926d1),
      _0x555512 = getSelectedAssetAppearance(_0x109ee4, _0x6926d1) || _0x6926d1,
      _0x125327 = _0x4734dc['length'] > 0x1,
      _0x1c8d8e = getStoryAssetGenerationControlState(_0x109ee4, _0x6926d1['id'], _0x555512['id']),
      _0x1e9d57 = _0x1c8d8e['isGenerating'],
      _0x1bc141 = _0x57674e['querySelector']('.story-asset-preview-slide'),
      _0x459805 = _0x57674e['querySelector']('.story-asset-preview-wrap');
    _0x459805?.['querySelectorAll']('.story-asset-preview-slide--outgoing')['forEach']((_0x5cf135) =>
      _0x5cf135['remove'](),
    );
    if (_0x1bc141 && _0x459805 && _0x109ee4['assetAppearanceMotion']) {
      const _0x43ee57 = _0x1bc141['cloneNode'](!![]);
      (_0x43ee57['classList']['remove']('img-preview-loading'),
        _0x43ee57['classList']['add'](
          'story-asset-preview-slide--outgoing',
          'is-sliding-' + _0x109ee4['assetAppearanceMotion'],
        ),
        _0x43ee57['removeAttribute']('aria-busy'),
        _0x43ee57['setAttribute']('aria-hidden', 'true'),
        _0x43ee57['querySelector']('.img-loading-overlay')?.['remove'](),
        _0x1bc141['after'](_0x43ee57));
      const _0x2c2e1f = () => _0x43ee57['remove']();
      (_0x43ee57['addEventListener']('animationend', _0x2c2e1f, { once: !![] }),
        windowObject['setTimeout'](_0x2c2e1f, 0x1cc));
    }
    _0x57674e['classList']['remove']('is-sliding-next', 'is-sliding-previous');
    _0x109ee4['assetAppearanceMotion'] &&
      (void _0x57674e['offsetWidth'],
      _0x57674e['classList']['add']('is-sliding-' + _0x109ee4['assetAppearanceMotion']));
    _0x1bc141 &&
      (_0x1bc141['classList']['toggle']('img-preview-loading', _0x1e9d57),
      _0x1bc141['setAttribute']('aria-busy', String(_0x1e9d57)),
      (_0x1bc141['innerHTML'] =
        '' +
        renderImageOrEmpty({
          imageUrl: _0x555512['imageUrl'],
          alt: _0x6926d1['name'] + '\x20·\x20' + (_0x555512['name'] || '形象'),
          className: 'story-asset-preview',
        }) +
        (_0x1e9d57 ? renderStoryAssetLoadingOverlay() : '')));
    if (_0x459805) {
      const _0x3f213e = documentObject['createElement']('div');
      _0x3f213e['innerHTML'] = renderStoryAssetPreviewActions({
        state: _0x109ee4,
        asset: _0x6926d1,
        appearance: _0x555512,
        generationControl: _0x1c8d8e,
      });
      const _0x49c42b = _0x459805['querySelector']('.story-asset-preview-actions'),
        _0x34c6c5 = _0x3f213e['firstElementChild'];
      if (_0x49c42b && _0x34c6c5) _0x49c42b['replaceWith'](_0x34c6c5);
      ((_0x459805['dataset']['storyAppearanceWheel'] = String(_0x125327)),
        _0x125327
          ? ((_0x459805['tabIndex'] = 0x0),
            _0x459805['setAttribute']('aria-label', '滚动鼠标滚轮或按左右方向键切换形象'))
          : (_0x459805['removeAttribute']('tabindex'),
            _0x459805['removeAttribute']('aria-label'),
            _0x459805['removeAttribute']('title')),
        _0x459805['querySelectorAll']('.story-appearance-arrow')['forEach']((_0x57a601) => {
          _0x57a601['remove']();
        }));
    }
    const _0x211bcf = _0x57674e['querySelector']('.story-asset-preview-caption');
    (syncStoryCharacterVoiceCapsuleState(
      _0x211bcf?.['querySelector']('[data-story-character-voice-capsule]'),
      _0x6926d1,
    ),
      syncStoryCharacterVoicePlayerState(_0x211bcf, _0x6926d1));
    _0x125327 &&
      _0x459805 &&
      _0x459805['insertAdjacentHTML'](
        'beforeend',
        '' + renderStoryAppearanceArrow('previous') + renderStoryAppearanceArrow('next'),
      );
    const _0x1822ca = _0x211bcf?.['querySelector']('strong'),
      _0x3b5d6d = _0x211bcf?.['querySelector']('[data-story-asset-caption-meta]');
    if (_0x1822ca) _0x1822ca['textContent'] = _0x6926d1['name'];
    _0x3b5d6d &&
      (_0x3b5d6d['textContent'] =
        (_0x555512['name'] || _0x6926d1['role'] || '素材') +
        '\x20·\x20' +
        formatStoryAssetOccurrences(_0x555512['occurrences'] || _0x6926d1['occurrences'] || '当前项目') +
        (_0x125327 ? ' · ' + (_0x494b7a + 0x1) + '/' + _0x4734dc['length'] : ''));
    const _0x20e051 = _0x211bcf?.['querySelector']('.story-base-appearance-button');
    if (_0x20e051) {
      const _0x5a6c10 = isStoryAssetBaseAppearance(_0x6926d1, _0x555512),
        _0x309947 = Boolean(isStoryAssetCardLoading(_0x109ee4, _0x6926d1['id']));
      (_0x20e051['classList']['toggle']('is-active', _0x5a6c10),
        _0x20e051['classList']['toggle']('is-disabled', _0x309947),
        _0x20e051['setAttribute']('aria-pressed', String(_0x5a6c10)),
        _0x20e051['setAttribute']('aria-disabled', String(_0x309947)),
        (_0x20e051['textContent'] = _0x5a6c10 ? '基础形象' : '设为基础形象'));
    }
    const _0x435d55 = _0x57674e['querySelector']('.story-asset-prompt-field'),
      _0x4e71ad = _0x435d55?.['querySelector']('[data-story-asset-prompt]'),
      _0x2d44d7 = isStoryAssetBaseAppearance(_0x6926d1, _0x555512),
      _0x4215b8 = _0x211bcf?.['querySelector']('.story-asset-caption-tags'),
      _0x5d66f3 = _0x4215b8?.['querySelector'](':scope > .story-asset-style-reference-control');
    if (_0x109ee4['allowAssetStyleReference'] !== ![] && _0x2d44d7 && _0x4215b8) {
      const _0x198308 = documentObject['createElement']('div');
      _0x198308['innerHTML'] = renderStoryAssetReferenceInput(_0x555512, { disabled: _0x1c8d8e['disabled'] });
      const _0x48df0e = _0x198308['firstElementChild'];
      if (_0x48df0e && _0x5d66f3) _0x5d66f3['replaceWith'](_0x48df0e);
      else
        _0x48df0e &&
          _0x4215b8['insertBefore'](
            _0x48df0e,
            _0x4215b8['querySelector']('[data-story-character-voice-capsule]'),
          );
    } else _0x5d66f3?.['remove']();
    _0x4e71ad &&
      ((_0x4e71ad['dataset']['storyAssetPromptAssetId'] = _0x6926d1['id']),
      (_0x4e71ad['dataset']['storyAssetPromptAppearanceId'] = _0x555512['id']),
      (_0x4e71ad['innerHTML'] = renderStoryAssetPromptMentions(_0x555512['prompt'] || '', _0x555512)));
    const _0x2faa82 = _0x57674e['querySelector']('[data-story-home-param-trigger="asset-preset"]');
    if (_0x2faa82) _0x2faa82['disabled'] = _0x1c8d8e['disabled'];
    const _0x58ffca = _0x57674e['querySelector']('[data-story-action="generate-asset"]');
    if (_0x58ffca) {
      ((_0x58ffca['disabled'] = _0x1c8d8e['disabled']),
        syncStoryAsyncButton(_0x58ffca, _0x1c8d8e['isGenerating']));
      const _0x362d37 = _0x58ffca['querySelector']('[data-story-asset-generate-label]');
      if (_0x362d37) _0x362d37['textContent'] = _0x1c8d8e['label'];
    }
    return !![];
  }
  function _0x446fd0(_0xc77ff3) {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x296b67 = _0x44835e['querySelector']('.story-page.is-current'),
      _0x4474af = _0x296b67?.['querySelector']('.story-clip-editor'),
      _0x7cfcbc = _0x296b67?.['querySelector']('.story-video-preview'),
      _0x4d32d9 = _0x296b67?.['querySelector']('.story-clip-timeline');
    if (!_0x296b67 || !_0x4474af || !_0x7cfcbc || !_0x4d32d9) return ![];
    const _0x95c6b6 = documentObject['createElement']('div');
    _0x95c6b6['innerHTML'] = renderEpisodeDetail(_0x109ee4);
    const _0x2bbea7 = _0x95c6b6['firstElementChild'],
      _0x1061f6 = _0x2bbea7?.['querySelector']('.story-clip-editor'),
      _0x368e90 = _0x2bbea7?.['querySelector']('.story-video-preview'),
      _0x43edcb = _0x368e90?.['querySelector']('[data-story-clip-preview-slide]');
    if (!_0x1061f6 || !_0x368e90 || !_0x43edcb) return ![];
    const _0x2d751a = _0xc77ff3 === 'previous' ? 'previous' : 'next',
      _0x1ff42b = _0x7cfcbc['querySelector'](
        '[data-story-clip-preview-slide]:not(.story-clip-preview-slide--outgoing)',
      );
    (_0x234da6['get'](_0x296b67)?.['destroy']?.(),
      _0x234da6['delete'](_0x296b67),
      _0x4474af['replaceWith'](_0x1061f6),
      _0x368e90['classList']['add']('is-sliding-' + _0x2d751a));
    _0x1ff42b &&
      (_0x1ff42b['classList']['add']('story-clip-preview-slide--outgoing', 'is-sliding-' + _0x2d751a),
      _0x1ff42b['setAttribute']('aria-hidden', 'true'),
      _0x368e90['appendChild'](_0x1ff42b));
    (_0x7cfcbc['replaceWith'](_0x368e90),
      _0x4d32d9['querySelectorAll']('[data-story-clip-id]')['forEach']((_0x27ca63) => {
        const _0x220ca9 = _0x27ca63['dataset']['storyClipId'] === _0x109ee4['selectedClipId'];
        (_0x27ca63['classList']['toggle']('is-selected', _0x220ca9),
          _0x27ca63['setAttribute']('aria-current', _0x220ca9 ? 'true' : 'false'));
      }),
      _0x5a95c3(_0x296b67));
    const _0x248f45 = () => {
      (_0x1ff42b?.['querySelector']('video')?.['pause']?.(),
        _0x1ff42b?.['remove'](),
        _0x368e90['classList']['remove']('is-sliding-next', 'is-sliding-previous'));
    };
    return (
      _0x1ff42b?.['addEventListener']('animationend', _0x248f45, { once: !![] }),
      windowObject['setTimeout'](_0x248f45, 0x1cc),
      windowObject['requestAnimationFrame'](() => {
        _0x4d32d9['querySelector']('[data-story-clip-id].is-selected')?.['scrollIntoView']?.({
          block: 'nearest',
          inline: 'nearest',
        });
      }),
      !![]
    );
  }
  function _0x1bcd6a(_0x5d6a86) {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x17f0fc = _0x44835e['querySelector']('.story-page.is-current'),
      _0x3a4939 = _0x17f0fc?.['querySelector']('.story-video-preview'),
      _0xa193f1 = _0x3a4939?.['querySelector'](
        '[data-story-clip-preview-slide]:not(.story-clip-preview-slide--outgoing)',
      );
    if (!_0x17f0fc || !_0x3a4939 || !_0xa193f1) return ![];
    const _0x27f4f7 = documentObject['createElement']('div');
    _0x27f4f7['innerHTML'] = renderEpisodeDetail(_0x109ee4);
    const _0x133e7b = _0x27f4f7['firstElementChild'],
      _0x375fae = _0x133e7b?.['querySelector']('.story-video-preview'),
      _0x208717 = _0x375fae?.['querySelector']('[data-story-clip-preview-slide]');
    if (!_0x375fae || !_0x208717) return ![];
    const _0x5ce48f = _0x5d6a86 === 'previous' ? 'previous' : 'next';
    (_0x234da6['get'](_0x17f0fc)?.['destroy']?.(),
      _0x234da6['delete'](_0x17f0fc),
      _0x375fae['classList']['add']('is-result-sliding-' + _0x5ce48f),
      _0xa193f1['classList']['add']('story-clip-preview-slide--outgoing', 'is-result-sliding-' + _0x5ce48f),
      _0xa193f1['setAttribute']('aria-hidden', 'true'),
      _0x375fae['appendChild'](_0xa193f1),
      _0x3a4939['replaceWith'](_0x375fae));
    const _0x59d959 = [..._0x17f0fc['querySelectorAll']('.story-clip-card-shell[data-story-clip-id]')][
        'find'
      ]((_0x5e8630) => _0x5e8630['dataset']['storyClipId'] === _0x109ee4['selectedClipId']),
      _0x2967d7 = [...(_0x133e7b?.['querySelectorAll']('.story-clip-card-shell[data-story-clip-id]') || [])][
        'find'
      ]((_0x51e3a7) => _0x51e3a7['dataset']['storyClipId'] === _0x109ee4['selectedClipId']);
    if (_0x59d959 && _0x2967d7) _0x59d959['replaceWith'](_0x2967d7);
    _0x5a95c3(_0x17f0fc);
    const _0x4f56ed = () => {
      (_0xa193f1['querySelector']('video')?.['pause']?.(),
        _0xa193f1['remove'](),
        _0x375fae['classList']['remove']('is-result-sliding-next', 'is-result-sliding-previous'));
    };
    return (
      _0xa193f1['addEventListener']('animationend', _0x4f56ed, { once: !![] }),
      windowObject['setTimeout'](_0x4f56ed, 0x1cc),
      !![]
    );
  }
  function _0x5f0bd5() {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x64e902 = _0x44835e['querySelector']('.story-page.is-current'),
      _0x115c5a = _0x64e902?.['querySelector']('.story-clip-timeline');
    if (!_0x64e902 || !_0x115c5a) return ![];
    const _0x58a9cf = _0x115c5a['querySelector']('.story-clip-strip'),
      _0x18589a = documentObject['createElement']('div');
    _0x18589a['innerHTML'] = renderEpisodeDetail(_0x109ee4);
    const _0x1b4971 = _0x18589a['firstElementChild']?.['querySelector']('.story-clip-timeline');
    if (!_0x1b4971) return ![];
    const _0x386ea1 = Math['max'](0x0, Number(_0x58a9cf?.['scrollLeft']) || 0x0);
    _0x115c5a['replaceWith'](_0x1b4971);
    const _0x3f7c80 = _0x1b4971['querySelector']('.story-clip-strip');
    if (_0x3f7c80) _0x3f7c80['scrollLeft'] = _0x386ea1;
    return !![];
  }
  function _0x2fa8a7() {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x3793cd = _0x44835e['querySelector'](
        '.story-page.is-current [data-story-clip-reference-summary]',
      ),
      _0x5e14b5 = getSelectedEpisode(_0x109ee4),
      _0x2cc771 = getSelectedClip(_0x109ee4, _0x5e14b5);
    if (!_0x3793cd || !_0x5e14b5 || !_0x2cc771) return ![];
    const _0x99f2c0 = storyClipProduction['renderEpisode'](_0x109ee4, _0x5e14b5, _0x2cc771),
      _0x535996 = _0x99f2c0['referenceCounts'];
    (['image', 'audio', 'video']['forEach']((_0x543229) => {
      const _0x31ba7c = _0x3793cd['querySelector']('[data-story-reference-count=\x22' + _0x543229 + '\x22]');
      if (_0x31ba7c) _0x31ba7c['textContent'] = String(_0x535996[_0x543229 + 'Count']);
    }),
      _0x3793cd['setAttribute'](
        'aria-label',
        '参考素材，图片 ' +
          _0x535996['imageCount'] +
          '，音频 ' +
          _0x535996['audioCount'] +
          '，视频 ' +
          _0x535996['videoCount'],
      ));
    const _0x18705a = _0x44835e['querySelector'](
      '.story-page.is-current [data-story-clip-prompt-surface] .story-clip-prompt-toolbar > .node-ref-bar',
    );
    if (_0x18705a) {
      const _0x357479 = documentObject['createElement']('div');
      _0x357479['innerHTML'] = _0x99f2c0['referenceBar'];
      const _0x18137e = _0x357479['firstElementChild'],
        _0x35cd8b = _0x18705a['querySelector']('.ref-thumb-container--readonly'),
        _0x252c60 = _0x18137e?.['querySelector']('.ref-thumb-container--readonly'),
        _0x4fa339 = (_0x2e55bb) =>
          Array['from'](_0x2e55bb?.['querySelectorAll']?.('[data-ref-readonly-key]') || [])
            ['map']((_0x50d491) => _0x50d491['dataset']['refReadonlyKey'] || '')
            ['join']('|');
      if (_0x4fa339(_0x35cd8b) !== _0x4fa339(_0x252c60)) {
        if (_0x35cd8b && _0x252c60) _0x35cd8b['replaceWith'](_0x252c60);
        else {
          if (_0x35cd8b) _0x35cd8b['remove']();
          else {
            if (_0x252c60) _0x18705a['appendChild'](_0x252c60);
          }
        }
        if (_0x18137e) _0x18705a['className'] = _0x18137e['className'];
      }
    }
    return !![];
  }
  function _0x2a1e31() {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x48759c = _0x44835e['querySelector']('.story-page.is-current'),
      _0x16d989 = _0x48759c?.['querySelector']('[data-story-clip-prompt]'),
      _0x365fa2 = _0x48759c?.['querySelector']('.story-clip-adjustment-control'),
      _0x205e76 = getSelectedEpisode(_0x109ee4),
      _0xa9d182 = getSelectedClip(_0x109ee4, _0x205e76);
    if (!_0x48759c || !_0x16d989 || !_0x365fa2 || !_0x205e76 || !_0xa9d182) return ![];
    _0x16d989['innerHTML'] = renderStoryClipPromptMentions(_0xa9d182['prompt'] || '', {
      assets: _0x109ee4['data']['assets'],
      episode: _0x205e76,
      clipFrames: _0x109ee4['data']['clipFrames'],
    });
    if (_0x109ee4['data']['project']['sourceMode'] === 'video-replication')
      mountStorySpeechGapEditor(_0x16d989);
    (syncStoryClipPromptPillPresentation(
      _0x16d989,
      _0x109ee4['data']['assets'],
      _0x109ee4['data']['clipFrames'],
    ),
      _0x16d989['querySelectorAll']('.ref-pill')['forEach']((_0x1e7052) => {
        _0x521761(_0x1e7052, _0x16d989, _0xa9d182);
      }));
    const _0x3fa416 = documentObject['createElement']('div');
    _0x3fa416['innerHTML'] = storyClipProduction['renderEpisode'](_0x109ee4, _0x205e76, _0xa9d182)[
      'adjustmentControl'
    ];
    const _0x14fe2d = _0x3fa416['firstElementChild'];
    if (!_0x14fe2d) return ![];
    return (_0x365fa2['replaceWith'](_0x14fe2d), !![]);
  }
  function _0x5be567() {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x50fa43 = _0x44835e['querySelector']('.story-page.is-current'),
      _0x3e5aab = _0x50fa43?.['querySelector']('.story-clip-adjustment-control'),
      _0x43670b = _0x3e5aab?.['querySelector']('[data-story-action=\x22toggle-clip-adjustment\x22]'),
      _0x3ac7c7 = getSelectedEpisode(_0x109ee4),
      _0x57c005 = getSelectedClip(_0x109ee4, _0x3ac7c7);
    if (!_0x50fa43 || !_0x3e5aab || !_0x43670b || !_0x3ac7c7 || !_0x57c005) return ![];
    const _0x16444d = _0x3e5aab['querySelector']('[data-story-clip-adjustment-bar]'),
      _0x9e0a23 = storyClipProduction['renderEpisode'](_0x109ee4, _0x3ac7c7, _0x57c005)['adjustmentBar'];
    _0x43670b['setAttribute']('aria-expanded', String(_0x109ee4['clipAdjustmentOpen'] === !![]));
    if (!_0x9e0a23) return (_0x16444d?.['remove'](), !![]);
    const _0x20da07 = documentObject['createElement']('div');
    _0x20da07['innerHTML'] = _0x9e0a23;
    const _0x1066ab = _0x20da07['firstElementChild'];
    if (!_0x1066ab) return ![];
    if (_0x16444d) _0x16444d['replaceWith'](_0x1066ab);
    else _0x3e5aab['appendChild'](_0x1066ab);
    return !![];
  }
  function _0x2298ed({ focus: focus = '' } = {}) {
    const _0xf22e35 = _0x44835e['querySelector']('.story-page.is-current [data-story-clip-prompt-history]'),
      _0x5e07c6 = _0xf22e35?.['querySelector']('[data-story-action="toggle-clip-prompt-history"]'),
      _0x367cca = _0xf22e35?.['querySelector']('[data-story-clip-prompt-history-panel]');
    if (!_0xf22e35 || !_0x5e07c6 || !_0x367cca) return ![];
    const _0x228d53 = _0x109ee4['clipPromptHistoryOpen'] === !![];
    (_0x5e07c6['setAttribute']('aria-expanded', String(_0x228d53)), (_0x367cca['hidden'] = !_0x228d53));
    if (focus === 'trigger') _0x5e07c6['focus']();
    return (
      focus === 'first' &&
        _0x367cca['querySelector']('[data-story-action="restore-clip-prompt-history"]')?.['focus'](),
      !![]
    );
  }
  function _0x3adde1(_0x4bd8d3 = {}) {
    const _0x1725c3 = getSelectedEpisode(_0x109ee4);
    return syncStoryClipAdjustmentMenu({
      state: _0x109ee4,
      root: _0x44835e,
      episode: _0x1725c3,
      clip: getSelectedClip(_0x109ee4, _0x1725c3),
      ..._0x4bd8d3,
    });
  }
  function _0x69a755() {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x326af1 = _0x44835e['querySelector']('.story-page.is-current'),
      _0xaa1f6b = _0x326af1?.['querySelector']('.story-clip-selection-controls'),
      _0x1b50c4 = _0x326af1?.['querySelector']('[data-story-clip-preview-slide]'),
      _0x365dc3 = _0x326af1?.['querySelector']('.story-clip-timeline');
    if (!_0x326af1 || !_0xaa1f6b || !_0x1b50c4 || !_0x365dc3) return ![];
    const _0x114454 = documentObject['createElement']('div');
    _0x114454['innerHTML'] = renderEpisodeDetail(_0x109ee4);
    const _0x314c9c = _0x114454['firstElementChild'],
      _0xe2616f = _0x314c9c?.['querySelector']('.story-clip-selection-controls'),
      _0xe8809 = _0x314c9c?.['querySelector']('[data-story-clip-preview-slide]'),
      _0x3eb32a = _0x314c9c?.['querySelector']('.story-clip-timeline'),
      _0x41ec3c = Array['from'](_0x365dc3['querySelectorAll']('.story-clip-card-shell[data-story-clip-id]')),
      _0x5939a8 = Array['from'](
        _0x3eb32a?.['querySelectorAll']?.('.story-clip-card-shell[data-story-clip-id]') || [],
      );
    if (!_0xe2616f || !_0xe8809 || !_0x3eb32a || _0x41ec3c['length'] !== _0x5939a8['length']) return ![];
    const _0x178448 = new Map(
      _0x41ec3c['map']((_0x5d75b1) => [normalizeText(_0x5d75b1['dataset']['storyClipId']), _0x5d75b1]),
    );
    if (
      _0x5939a8['some']((_0x1ce532) => !_0x178448['has'](normalizeText(_0x1ce532['dataset']['storyClipId'])))
    )
      return ![];
    return (
      _0xaa1f6b['outerHTML'] !== _0xe2616f['outerHTML'] && _0xaa1f6b['replaceWith'](_0xe2616f),
      _0x1b50c4['innerHTML'] !== _0xe8809['innerHTML'] &&
        ((_0x1b50c4['innerHTML'] = _0xe8809['innerHTML']),
        _0x234da6['get'](_0x326af1)?.['refreshVideoPreview']?.()),
      _0x5939a8['forEach']((_0x42c90a) => {
        const _0x5413a9 = _0x178448['get'](normalizeText(_0x42c90a['dataset']['storyClipId']));
        _0x5413a9?.['outerHTML'] !== _0x42c90a['outerHTML'] && _0x5413a9['replaceWith'](_0x42c90a);
      }),
      !![]
    );
  }
  function _0x3deaa5() {
    if (_0x109ee4['view'] !== 'episode') return ![];
    const _0x34dea8 = _0x44835e['querySelector']('.story-page.is-current'),
      _0xf4c88d = _0x34dea8?.['querySelector']('.story-clip-timeline');
    if (!_0x34dea8 || !_0xf4c88d) return ![];
    const _0x4b1284 = _0x34dea8['querySelector']('.story-clip-selection-controls'),
      _0x2664d1 = documentObject['createElement']('div');
    _0x2664d1['innerHTML'] = storyClipProduction['renderEpisode'](_0x109ee4, getSelectedEpisode(_0x109ee4))[
      'selectionControls'
    ];
    const _0x4065a9 = _0x2664d1['firstElementChild'];
    if (_0x4b1284 && _0x4065a9) _0x4b1284['replaceWith'](_0x4065a9);
    const _0x3e5c91 = new Set(
      (Array['isArray'](_0x109ee4['selectedClipGenerationIds']) ? _0x109ee4['selectedClipGenerationIds'] : [])
        ['map']((_0x578902) => normalizeText(_0x578902))
        ['filter'](Boolean),
    );
    _0xf4c88d['classList']['toggle']('is-selection-mode', _0x109ee4['clipSelectionMode']);
    const _0x39459f = _0xf4c88d['querySelector']('.story-clip-timeline-header\x20small');
    return (
      _0x39459f &&
        (_0x39459f['textContent'] = _0x109ee4['clipSelectionMode']
          ? '点击片段选择需要生成的视频'
          : '点击片段切换提示词和视频结果'),
      _0xf4c88d['querySelectorAll']('[data-story-clip-id]')['forEach']((_0x26b485) => {
        const _0x14a7a5 = _0x3e5c91['has'](normalizeText(_0x26b485['dataset']['storyClipId']));
        (_0x26b485['classList']['toggle']('is-selection-mode', _0x109ee4['clipSelectionMode']),
          _0x26b485['classList']['toggle']('is-checked', _0x109ee4['clipSelectionMode'] && _0x14a7a5));
        if (!_0x109ee4['clipSelectionMode']) _0x26b485['classList']['remove']('is-marquee-hit');
        _0x26b485['setAttribute'](
          'aria-pressed',
          _0x109ee4['clipSelectionMode'] ? String(_0x14a7a5) : 'false',
        );
        const _0x2caf04 = _0x26b485['closest']('.story-clip-card-shell'),
          _0x1ae614 =
            !_0x109ee4['clipSelectionMode'] &&
            normalizeText(_0x109ee4['pendingDeleteClipId']) ===
              normalizeText(_0x26b485['dataset']['storyClipId']);
        _0x2caf04?.['classList']['toggle']('is-delete-confirming', _0x1ae614);
        const _0x4ef486 = _0x2caf04?.['querySelector']('.story-clip-delete-trigger'),
          _0x28b869 = _0x2caf04?.['querySelector']('.story-clip-delete-confirm');
        if (_0x4ef486) _0x4ef486['hidden'] = _0x109ee4['clipSelectionMode'] || _0x1ae614;
        if (_0x28b869) _0x28b869['hidden'] = _0x109ee4['clipSelectionMode'] || !_0x1ae614;
      }),
      !![]
    );
  }
  function _0xd51873() {
    const _0x42a01c = _0x54cd25()?.['querySelectorAll']('[data-story-asset-batch-control]') || [],
      _0x58609e = storyAssetSettingsProjection['projectAssetControl']('batch-generation', {
        state: _0x109ee4,
      });
    let _0x248fb1 = ![];
    return (
      _0x42a01c['forEach']((_0x1bd63c) => {
        _0x248fb1 = updateStoryAssetBatchButtonLabel(_0x1bd63c, _0x58609e['label']) || _0x248fb1;
      }),
      _0x248fb1
    );
  }
  function _0x5062b4({ previousMode: previousMode = '', surface: surface = 'story' } = {}) {
    if (_0x579cca) return null;
    if (_0x109ee4['workspaceSurface'] !== surface) _0x41990e();
    const _0x282cc7 = selectStoryWorkspaceSurface(_0x109ee4, surface);
    if (_0x282cc7) _0x3cc085['invalidate']();
    _0x57f246 = !![];
    if (_0x3cc085['activate']()) _0xb8a26b({ capturePageState: previousMode === 'story' });
    return (_0xdac690?.['sync'](), _0x2e97b0);
  }
  function _0x15fd10({ nextMode: nextMode = '' } = {}) {
    if (['story', 'replication']['includes'](nextMode)) return !![];
    if (_0x579cca) return ![];
    return (
      closeStoryRequestDebugPreview(documentObject),
      _0x57f246 && (_0x2d84bd(), _0x487a78({ immediate: !![] })),
      (_0x57f246 = ![]),
      _0xdac690?.['sync'](),
      _0x456306(),
      _0x15d8ff(),
      _0x49f360(),
      _0x345d08(),
      _0x76c71e(),
      _0x403c84(),
      _0x457f02(),
      _0x593e47(),
      _0x3cc085['deactivate'](),
      !![]
    );
  }
  function _0x345d08(_0xf5972c = null) {
    _0x2e97b0['querySelectorAll']('.story-model-picker.is-open')['forEach']((_0x3d7761) => {
      if (_0x3d7761 === _0xf5972c) return;
      (_0x3d7761['classList']['remove']('is-open'),
        _0x3d7761['querySelector']('[data-story-model-trigger]')?.['setAttribute']('aria-expanded', 'false'));
    });
  }
  function _0x76c71e(_0x874151 = null) {
    _0x2e97b0['querySelectorAll']('.story-home-param-picker.is-open')['forEach']((_0x17b1a3) => {
      if (_0x17b1a3 === _0x874151) return;
      (_0x17b1a3['classList']['remove']('is-open'),
        _0x17b1a3['querySelector']('[data-story-home-param-trigger]')?.['setAttribute'](
          'aria-expanded',
          'false',
        ));
    });
  }
  // Keeps a param popover inside the viewport: shrink to the space below, or
  // flip above when the trigger sits too low for the popover to fit.
  function fitStoryParamPopoverToViewport(_0x7b21c4) {
    const _0x2f81a6 = _0x7b21c4?.['querySelector']?.('.story-home-param-popover');
    if (!_0x2f81a6) return;
    (_0x2f81a6['classList']?.['remove']?.('story-home-param-popover--above'),
      (_0x2f81a6['style']['maxHeight'] = ''));
    if (globalThis['getComputedStyle']?.(_0x2f81a6)?.['position'] === 'fixed') return;
    const _0x3d9c11 = Number(globalThis['innerHeight'] || 0);
    if (!_0x3d9c11) return;
    const _0x4b7e28 = _0x7b21c4?.['querySelector']?.('[data-story-home-param-trigger]'),
      _0x1c93ad = _0x4b7e28?.['getBoundingClientRect']?.();
    if (!_0x1c93ad) return;
    const _0x2c6f47 = 16,
      _0x1f0a4a = _0x3d9c11 - _0x1c93ad['bottom'] - _0x2c6f47,
      _0x5a7d1e = _0x1c93ad['top'] - _0x2c6f47,
      _0x1a8f2c = 420;
    if (_0x1f0a4a < _0x1a8f2c && _0x5a7d1e > _0x1f0a4a) {
      (_0x2f81a6['classList']?.['add']?.('story-home-param-popover--above'),
        (_0x2f81a6['style']['maxHeight'] = Math['max'](160, Math['floor'](_0x5a7d1e)) + 'px'));
      return;
    }
    _0x2f81a6['style']['maxHeight'] = Math['max'](160, Math['floor'](_0x1f0a4a)) + 'px';
  }
  function _0x1ac9be(_0x8f417 = '') {
    const _0x4258d9 = normalizeText(_0x8f417);
    ((_0x109ee4['openProjectMenuId'] = _0x4258d9),
      _0x2e97b0['querySelectorAll']('[data-story-open-project]')['forEach']((_0x2b54be) => {
        const _0x10e3f6 = normalizeText(_0x2b54be['dataset']['storyOpenProject']) === _0x4258d9;
        _0x2b54be['classList']['toggle']('is-menu-open', _0x10e3f6);
        const _0x5e4382 = _0x2b54be['querySelector']('[data-story-action="toggle-project-menu"]'),
          _0x19c2df = _0x2b54be['querySelector']('[data-story-project-menu]');
        (_0x5e4382?.['setAttribute']('aria-expanded', String(_0x10e3f6)),
          _0x19c2df &&
            ((_0x19c2df['hidden'] = !_0x10e3f6),
            _0x19c2df['setAttribute']('aria-hidden', String(!_0x10e3f6))));
      }));
  }
  function _0x475004() {
    _0x2e97b0['querySelectorAll']('[data-story-project-sort-wrap].is-open')['forEach']((_0x3355f0) => {
      (_0x3355f0['classList']['remove']('is-open'),
        _0x3355f0['querySelector']('[data-story-action="toggle-project-sort-menu"]')?.['setAttribute'](
          'aria-expanded',
          'false',
        ),
        _0x3355f0['querySelector']('[data-story-project-sort-menu]')?.['setAttribute'](
          'aria-hidden',
          'true',
        ));
    });
  }
  function _0x1dab2d(_0x432565, _0x555773) {
    const _0x2d3e90 = _0x432565?.['querySelector']('[data-story-project-sort-menu]');
    if (!_0x432565 || !_0x555773 || !_0x2d3e90) return;
    (_0x475004(),
      _0x432565['classList']['add']('is-open'),
      _0x555773['setAttribute']('aria-expanded', 'true'),
      _0x2d3e90['setAttribute']('aria-hidden', 'false'));
  }
  function _0x403c84(_0xcf505b = null) {
    _0x2e97b0['querySelectorAll']('.story-asset-batch-menu-wrap.is-open')['forEach']((_0x47ad06) => {
      if (_0x47ad06 === _0xcf505b) return;
      (_0x3881c5(_0x47ad06),
        _0x47ad06['classList']['remove']('is-open'),
        _0x47ad06['querySelector']('.story-asset-batch-trigger')?.['setAttribute']('aria-expanded', 'false'));
    });
  }
  function _0x19d242(_0x47499f, _0x48eae4) {
    const _0x353d52 = _0x47499f?.['querySelector']('.story-asset-batch-menu');
    if (!_0x47499f || !_0x48eae4 || !_0x353d52) return;
    (_0x403c84(_0x47499f),
      _0x3881c5(_0x47499f),
      syncWorkspaceInlineMenuExpandedWidth(_0x353d52),
      _0x47499f['classList']['add']('is-open'),
      _0x48eae4['setAttribute']('aria-expanded', 'true'));
  }
  const _0x279782 = createWorkspaceMenuController({
    root: _0x2e97b0,
    wrapperSelector: '.story-canvas-sync-menu-wrap',
    triggerSelector: '[data-story-action="toggle-canvas-sync-menu"]',
    menuSelector: '.story-canvas-sync-menu',
    optionSelector: '.story-canvas-sync-option',
  });
  function _0x457f02(_0x5ce422 = null) {
    _0x279782['close'](_0x5ce422);
  }
  function _0x158da1(_0x5a4c80, _0x3bafe6) {
    return _0x279782['open'](_0x5a4c80, _0x3bafe6);
  }
  function _0x1099fe(_0xe45c6d) {
    return _0x279782['handleKeyDown'](_0xe45c6d);
  }
  function _0x593e47(_0x545331 = null) {
    _0x2e97b0['querySelectorAll']('.story-character-voice-history-wrap.is-open')['forEach']((_0x4c05e) => {
      if (_0x4c05e === _0x545331) return;
      (_0x4c05e['classList']['remove']('is-open'),
        _0x4c05e['querySelector']('[data-story-action="toggle-character-voice-history"]')?.['setAttribute'](
          'aria-expanded',
          'false',
        ),
        _0x4c05e['querySelector']('.story-character-voice-history-panel')?.['setAttribute'](
          'aria-hidden',
          'true',
        ));
    });
  }
  function _0x484853(_0x52a2fc, _0x2fa8c4) {
    const _0x425c80 = _0x52a2fc?.['querySelector']('[data-story-style-library]'),
      _0x53b7bb = _0x52a2fc?.['querySelector']('[data-story-style-custom-editor]');
    if (!_0x425c80 || !_0x53b7bb) return;
    ((_0x425c80['hidden'] = _0x2fa8c4),
      (_0x53b7bb['hidden'] = !_0x2fa8c4),
      _0x52a2fc['classList']['toggle']('is-custom-editing', _0x2fa8c4),
      _0x2fa8c4 &&
        windowObject['requestAnimationFrame'](() => {
          const _0x40be0e = _0x53b7bb['querySelector']('[data-story-style-custom-input]');
          (_0x40be0e?.['focus'](),
            _0x40be0e?.['setSelectionRange']?.(_0x40be0e['value']['length'], _0x40be0e['value']['length']));
        }));
  }
  function _0x4bd181(_0x1463a2) {
    const _0x92aa17 =
        _0x1463a2?.['querySelector']('[data-story-style-category].is-active')?.['dataset'][
          'storyStyleCategory'
        ] || 'all',
      _0x3ff19a = normalizeText(_0x1463a2?.['querySelector']('[data-story-style-search-input]')?.['value'])[
        'toLowerCase'
      ]();
    let _0xe35381 = 0x0;
    _0x1463a2?.['querySelectorAll']('[data-story-style-card-category]')['forEach']((_0x2f8a31) => {
      const _0x4771e7 = _0x2f8a31['dataset']['storyStyleCardCategory'],
        _0xf74748 = _0x92aa17 === 'all' || _0x4771e7 === _0x92aa17,
        _0x363003 =
          !_0x3ff19a || String(_0x2f8a31['dataset']['storyStyleSearch'] || '')['includes'](_0x3ff19a);
      _0x2f8a31['hidden'] = !(_0xf74748 && _0x363003);
      if (!_0x2f8a31['hidden']) _0xe35381 += 0x1;
    });
    const _0x56923a = _0x1463a2?.['querySelector']('[data-story-style-empty]');
    if (_0x56923a) _0x56923a['hidden'] = _0xe35381 > 0x0;
  }
  function _0x1d7489(_0x5b902d) {
    const _0x49f850 = normalizeStoryAspectRatio(_0x5b902d);
    ((_0x109ee4['data']['project']['aspectRatio'] = _0x49f850),
      (_0x109ee4['videoGenerationParams'] = applyStoryAspectRatioToVideoGenerationParams(
        _0x109ee4['models']['video'],
        _0x109ee4['videoGenerationParams'],
        _0x49f850,
      )),
      (_0x109ee4['videoGenerationParamsByModel'] = {
        ..._0x109ee4['videoGenerationParamsByModel'],
        [_0x109ee4['models']['video']]: { ..._0x109ee4['videoGenerationParams'] },
      }),
      _0x487a78(),
      _0xb8a26b());
  }
  function _0x39cd32(_0x40a99a, _0x5a0654, { renderWorkspace: renderWorkspace = !![] } = {}) {
    if (_0x40a99a === 'replicationAsrProvider') {
      if (!RECORDING_ASR_MODELS['some']((_0x26f2e8) => _0x26f2e8['id'] === _0x5a0654)) return;
      ((_0x109ee4['replicationAsrProvider'] = _0x5a0654), _0x487a78(), _0xb8a26b());
      return;
    }
    const _0x5be636 = normalizeStoryProjectPlanning(_0x109ee4['data']['project'], {
      allowDeveloperPromptModes: _0x109ee4['developerModeAvailable'],
    });
    if (_0x40a99a === 'targetLocale') {
      _0x109ee4['replicationTargetLocale'] = getStoryReplicationLocale(_0x5a0654)['value'];
      if (
        _0x109ee4['hasCreatedProject'] &&
        updateStoryReplicationReplacement(_0x109ee4['data'], {
          field: _0x40a99a,
          value: _0x109ee4['replicationTargetLocale'],
        })
      )
        _0x41990e();
      (_0x487a78(), _0xb8a26b());
      return;
    }
    const _0x2100fa =
      _0x40a99a === 'episodeCount'
        ? normalizeStoryEpisodeCount(_0x5a0654)
        : _0x40a99a === 'promptMode'
          ? normalizeStoryPromptMode(_0x5a0654, { allowDeveloperModes: _0x109ee4['developerModeAvailable'] })
          : normalizeStorySceneMaxSeconds(_0x5a0654);
    _0x109ee4['data']['project']['planning'] = { ..._0x5be636, [_0x40a99a]: _0x2100fa };
    _0x40a99a === 'promptMode' && applyStoryPromptModeVideoModelDefault(_0x109ee4, _0x2100fa) && _0x2d610d();
    _0x487a78();
    if (renderWorkspace) _0xb8a26b();
    return _0x2100fa;
  }
  function _0x2dbe5b(_0x31a22c) {
    const _0x4c4802 = Number(_0x31a22c?.['value']);
    if (!Number['isInteger'](_0x4c4802) || _0x4c4802 < 0x1 || _0x4c4802 > STORY_EPISODE_COUNT_MAX)
      return (
        _0x31a22c?.['setAttribute']('aria-invalid', 'true'),
        _0x50d1ac('请输入 1-' + STORY_EPISODE_COUNT_MAX + ' 的整数集数。', 'warn'),
        _0x31a22c?.['focus'](),
        ![]
      );
    _0x31a22c?.['setAttribute']('aria-invalid', 'false');
    const _0x472db5 = _0x39cd32('episodeCount', _0x4c4802, { renderWorkspace: ![] });
    return (_0x5e1c3d(_0x31a22c, _0x472db5), !![]);
  }
  function _0x5e1c3d(_0x376d77, _0x290750) {
    const _0x308b23 = _0x376d77?.['closest']('.story-episode-count-custom-editor'),
      _0x4e7058 = _0x308b23?.['closest']('.story-planning-picker');
    if (!_0x308b23 || !_0x4e7058) return ![];
    const _0x2f3144 = !STORY_EPISODE_COUNT_OPTIONS['includes'](_0x290750);
    (_0x308b23['classList']['toggle']('is-selected', _0x2f3144),
      _0x308b23['setAttribute']('aria-selected', String(_0x2f3144)),
      (_0x376d77['value'] = _0x2f3144 ? String(_0x290750) : ''),
      _0x4e7058['querySelectorAll']('[data-story-planning-field="episodeCount"]')['forEach']((_0x3c62f7) => {
        const _0x237c5f = Number(_0x3c62f7['dataset']['storyPlanningOption']) === _0x290750;
        (_0x3c62f7['classList']['toggle']('is-selected', _0x237c5f),
          _0x3c62f7['setAttribute']('aria-selected', String(_0x237c5f)));
      }));
    const _0x392ee6 = _0x4e7058['querySelector']('[data-story-planning-trigger-label]');
    if (_0x392ee6) _0x392ee6['textContent'] = _0x290750 + '集';
    return !![];
  }
  function _0x3a2ffc(_0x417dce) {
    windowObject['setTimeout'](() => {
      if (!_0x417dce?.['isConnected']) return;
      normalizeText(_0x417dce['value'])
        ? _0x2dbe5b(_0x417dce)
        : _0x5e1c3d(
            _0x417dce,
            normalizeStoryEpisodeCount(_0x109ee4['data']['project']?.['planning']?.['episodeCount']),
          );
    }, 0x0);
  }
  function _0x1582f2(_0x3a926b) {
    const _0x38769e = resolveStoryStyleSelection({ styleId: _0x3a926b });
    if (_0x38769e['isCustom']) return;
    const _0x5eef02 = resolveStoryStyleSelection({
      styleId: _0x109ee4['data']['project']['videoStyleId'],
      stylePrompt: _0x109ee4['data']['project']['videoStylePrompt'],
      videoStyle: _0x109ee4['data']['project']['videoStyle'],
    })['stylePrompt'];
    ((_0x109ee4['data']['project']['videoStyleId'] = _0x38769e['styleId']),
      (_0x109ee4['data']['project']['videoStylePrompt'] = _0x38769e['stylePrompt']),
      (_0x109ee4['data']['project']['videoStyle'] = _0x38769e['label']),
      _0x2f0de7['replaceCurrent'](
        syncStoryPlanningVisualStyle(_0x109ee4['data'], {
          previousStyle: _0x5eef02,
          visualStyle: _0x38769e['stylePrompt'],
        }),
      ),
      _0x487a78(),
      _0xb8a26b());
  }
  function _0x149b2f(_0x51c041) {
    const _0x395aab = normalizeText(_0x51c041?.['value'])['slice'](0x0, STORY_CUSTOM_STYLE_MAX_CHARACTERS);
    if (!_0x395aab) {
      (_0x50d1ac('请输入自定义风格提示词。', 'warn'), _0x51c041?.['focus']());
      return;
    }
    const _0x36c234 = resolveStoryStyleSelection({
      styleId: _0x109ee4['data']['project']['videoStyleId'],
      stylePrompt: _0x109ee4['data']['project']['videoStylePrompt'],
      videoStyle: _0x109ee4['data']['project']['videoStyle'],
    })['stylePrompt'];
    ((_0x109ee4['data']['project']['videoStyleId'] = STORY_STYLE_CUSTOM_ID),
      (_0x109ee4['data']['project']['videoStylePrompt'] = _0x395aab),
      (_0x109ee4['data']['project']['customVideoStylePrompt'] = _0x395aab),
      (_0x109ee4['data']['project']['videoStyle'] = _0x395aab),
      _0x2f0de7['replaceCurrent'](
        syncStoryPlanningVisualStyle(_0x109ee4['data'], { previousStyle: _0x36c234, visualStyle: _0x395aab }),
      ),
      _0x487a78(),
      _0xb8a26b());
  }
  const _0x18f74e = (_0x3255fe) =>
    openStoryProjectPage(
      { state: _0x109ee4, canEnterStep: canEnterStoryWorkspaceStep, render: _0xb8a26b },
      _0x3255fe,
    );
  function _0x3bfffe(_0x3b14fa) {
    const _0x3e0a13 = normalizeText(_0x3b14fa),
      _0x5b6740 = normalizeText(_0x109ee4['data']?.['project']?.['id']),
      _0x176a57 = _0x2f0de7['getEntry'](_0x3e0a13);
    _0x109ee4['pendingDeleteAssetAppearanceKey'] = '';
    if (_0x3e0a13 && _0x3e0a13 === _0x5b6740 && _0x109ee4['hasCreatedProject']) {
      (applyStoryProjectUiState(_0x109ee4, _0x176a57?.['ui'], _0x109ee4['data']),
        _0x150704(_0x109ee4['data']));
      const _0x5b0a32 = getSelectedEpisode(_0x109ee4);
      (_0x5bfff6(getSelectedClip(_0x109ee4, _0x5b0a32), {
        episode: _0x5b0a32,
        enteringEpisode: _0x109ee4['view'] === 'episode',
      }),
        _0x18f74e({ restoreView: !![] }),
        _0x2cfc60(),
        _0x487a78({ immediate: !![] }),
        _0x58b0ac(),
        _0x53d4c1());
      return;
    }
    if (!_0x176a57?.['data']) return;
    const _0x2f172b = _0x2f0de7['activate'](_0x3e0a13, {
      beforeActivate: () => {
        (_0x378f1f({ clearState: !![] }), _0x1e76e1());
      },
    });
    if (!_0x2f172b) return;
    ((_0x109ee4['scriptMode'] = normalizeStoryScriptMode(_0x109ee4['data']['project']?.['scriptMode'])),
      (_0x109ee4['data']['project']['planning'] = normalizeStoryProjectPlanning(
        _0x109ee4['data']['project'],
        { allowDeveloperPromptModes: _0x109ee4['developerModeAvailable'] },
      )));
    const _0x30f68b = _0x109ee4['data']['project']?.['sourceDocument'];
    _0x30f68b &&
      typeof _0x30f68b === 'object' &&
      ((_0x109ee4['scriptFileName'] = String(_0x30f68b['fileName'] || '')),
      (_0x109ee4['scriptText'] = String(_0x30f68b['text'] || '')['slice'](0x0, STORY_SCRIPT_MAX_CHARACTERS)),
      (_0x109ee4['scriptCharacterCount'] = Number['isFinite'](_0x30f68b['characterCount'])
        ? _0x30f68b['characterCount']
        : _0x109ee4['scriptText']['length']));
    ((_0x109ee4['assetSelectionMode'] = ![]),
      (_0x109ee4['selectedAssetIds'] = []),
      (_0x109ee4['scriptSelectionMode'] = ![]),
      (_0x109ee4['selectedScriptEpisodeIds'] = []),
      (_0x109ee4['characterVoiceEditor'] = null),
      (_0x109ee4['characterVoicePanelMotion'] = ''),
      (_0x109ee4['pendingCharacterVoiceAssetId'] = ''),
      (_0x109ee4['pendingDeleteClipId'] = ''),
      (_0x109ee4['pendingDeleteAssetAppearanceKey'] = ''),
      (_0x109ee4['clipSelectionMode'] = ![]),
      (_0x109ee4['selectedClipGenerationIds'] = []),
      applyStoryProjectUiState(_0x109ee4, _0x2f172b['ui'], _0x109ee4['data']),
      _0x150704(_0x109ee4['data']),
      (_0x109ee4['projectTitleEdited'] = _0x2f172b['projectTitleEdited'] === !![]),
      (_0x109ee4['hasCreatedProject'] = !![]));
    const _0x59022b = getSelectedEpisode(_0x109ee4);
    (_0x5bfff6(getSelectedClip(_0x109ee4, _0x59022b), {
      episode: _0x59022b,
      enteringEpisode: _0x109ee4['view'] === 'episode',
    }),
      _0x18f74e({ restoreView: !![] }),
      _0x2cfc60(),
      _0x487a78({ immediate: !![] }),
      _0x58b0ac(),
      _0x53d4c1());
  }
  function _0x5e9a72(_0x2c1fca) {
    const _0x585bad = _0x44835e['querySelector']('.story-page.is-current');
    if (!_0x585bad) return ![];
    if (_0x2c1fca['outlineSectionId'])
      return jumpToStoryOutlineSection(_0x585bad, _0x2c1fca['outlineSectionId'], {
        windowObject: windowObject,
      });
    const _0x26d447 = _0x2c1fca['assetId'] ? 'storyAssetId' : _0x2c1fca['clipId'] ? 'storyClipId' : '',
      _0x40286e = _0x2c1fca['assetId'] || _0x2c1fca['clipId'];
    if (!_0x26d447 || !_0x40286e) return ![];
    const _0xd06b57 = _0x2c1fca['assetId'] ? '[data-story-asset-id]' : '[data-story-clip-id]',
      _0x15c755 = [..._0x585bad['querySelectorAll'](_0xd06b57)]['find'](
        (_0x5d0dbe) => normalizeText(_0x5d0dbe?.['dataset']?.[_0x26d447]) === _0x40286e,
      );
    if (!_0x15c755) return ![];
    const _0x3ffeeb = () =>
      _0x15c755['scrollIntoView']?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    return (
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? windowObject['requestAnimationFrame'](_0x3ffeeb)
        : _0x3ffeeb(),
      !![]
    );
  }
  async function _0xebcca6(_0x29188a = {}) {
    const _0xe772d1 = normalizeText(_0x29188a['projectId']);
    if (!_0xe772d1) return ![];
    if (normalizeText(_0x109ee4['data']?.['project']?.['id']) !== _0xe772d1) {
      const _0x5947c9 = _0x109ee4['projects']['some'](
        (_0x1c699b) =>
          normalizeText(_0x1c699b?.['id'] || _0x1c699b?.['data']?.['project']?.['id']) === _0xe772d1,
      );
      if (!_0x5947c9) return (_0x50d1ac('对应的剧本项目已不存在。', 'warn'), ![]);
      _0x3bfffe(_0xe772d1);
    }
    if (normalizeText(_0x109ee4['data']?.['project']?.['id']) !== _0xe772d1)
      return (_0x50d1ac('无法打开任务对应的剧本项目。', 'warn'), ![]);
    requestWorkspaceMode(getStoryProjectWorkspaceMode(_0x109ee4['data']?.['project']));
    const _0x59494a = resolveStoryTaskResultDestination(_0x109ee4['data'], _0x29188a);
    if (_0x59494a['view'] === 'episode') {
      const _0x54209c = await _0x48fc72(_0x59494a['episodeId'], _0x59494a['clipId']);
      if (!_0x54209c) return ![];
      return (_0x5e9a72(_0x59494a), !![]);
    }
    if (
      !(await _0x40b04a(_0x59494a['step'], {
        assetId: _0x59494a['assetId'],
        assetFilter: _0x59494a['assetFilter'],
        outlineSectionId: _0x59494a['outlineSectionId'],
      }))
    )
      return ![];
    return (_0x5e9a72(_0x59494a), !![]);
  }
  function _0x3f72c0(_0x4eeda8) {
    const _0x10e9a0 = normalizeText(_0x4eeda8),
      _0x142464 = getSelectedEpisode(_0x109ee4),
      _0x3844d3 = _0x109ee4['data']['episodes']['findIndex'](
        (_0x3a1f61) => _0x3a1f61['id'] === _0x142464?.['id'],
      ),
      _0x4e773d = removeStoryEpisodeClip(_0x142464, _0x10e9a0);
    if (!_0x10e9a0 || !_0x4e773d || _0x3844d3 < 0x0)
      return (
        (_0x109ee4['pendingDeleteClipId'] = ''),
        _0xb8a26b(),
        _0x50d1ac('删除片段失败，请刷新后重试。', 'error'),
        ![]
      );
    ((_0x109ee4['data']['episodes'][_0x3844d3] = _0x4e773d['episode']),
      (_0x109ee4['pendingDeleteClipId'] = ''),
      (_0x109ee4['selectedClipGenerationIds'] = _0x109ee4['selectedClipGenerationIds']['filter'](
        (_0x5a0d07) => normalizeText(_0x5a0d07) !== _0x10e9a0,
      )));
    const _0x108f4f = _0x4e773d['episode']['clips']['find'](
        (_0x5558fa) => normalizeText(_0x5558fa?.['id']) === normalizeText(_0x109ee4['selectedClipId']),
      ),
      _0x380188 = _0x108f4f || _0x4e773d['nextClip'] || null;
    return (
      (_0x109ee4['selectedClipId'] = _0x380188?.['id'] || ''),
      _0x38bff8(_0x380188),
      _0x487a78({ immediate: !![] }),
      _0xb8a26b(),
      _0x50d1ac('片段已删除。', 'success'),
      !![]
    );
  }
  function _0x41d0f8(_0x47a40a) {
    const _0x411ec8 = buildStoryClipFrameMentionId(_0x47a40a);
    if (!_0x411ec8) return 0x0;
    const _0x9c76b1 = (_0xb0e976) => {
      let _0x3e5043 = 0x0;
      return (
        _0xb0e976?.['querySelectorAll']?.('.ref-pill')?.['forEach']((_0x11e936) => {
          if (normalizeText(_0x11e936['dataset']?.['assetId']) !== _0x411ec8) return;
          (_0x11e936['remove']?.(), (_0x3e5043 += 0x1));
        }),
        _0x3e5043
      );
    };
    let _0x189fc2 = 0x0;
    const _0x41d080 = getSelectedClip(_0x109ee4, getSelectedEpisode(_0x109ee4)),
      _0x280d61 = _0x2e97b0['querySelector']('[data-story-clip-prompt]');
    if (_0x280d61 && _0x41d080) {
      const _0x49ca2d = _0x9c76b1(_0x280d61);
      _0x49ca2d &&
        ((_0x41d080['prompt'] = sanitizePromptHtmlForCommit(_0x280d61['innerHTML'])),
        (_0x189fc2 += _0x49ca2d));
    }
    return (
      _0x109ee4['data']['episodes']['forEach']((_0x4e9f19) => {
        (_0x4e9f19?.['clips'] || [])['forEach']((_0x43b916) => {
          if (!normalizeText(_0x43b916?.['prompt'])['includes'](_0x411ec8)) return;
          const _0x513f8e = documentObject['createElement']('div');
          _0x513f8e['innerHTML'] = _0x43b916['prompt'];
          const _0x2db644 = _0x9c76b1(_0x513f8e);
          if (!_0x2db644) return;
          ((_0x43b916['prompt'] = sanitizePromptHtmlForCommit(_0x513f8e['innerHTML'])),
            (_0x189fc2 += _0x2db644));
        });
      }),
      _0x189fc2
    );
  }
  async function _0x24c314(_0x4814de) {
    const _0x251929 = normalizeText(_0x4814de),
      _0x15f63e = normalizeStoryClipFrames(_0x109ee4['data']['clipFrames']),
      _0xab3d6d = _0x15f63e['find']((_0x1e3996) => _0x1e3996['id'] === _0x251929);
    if (!_0xab3d6d) return (_0x50d1ac('删除失败，当前内容已不存在。', 'error'), ![]);
    if (_0xab3d6d['captureSavePending'] === !![])
      return (_0x50d1ac('请等待当前片段帧保存完成。', 'info'), ![]);
    if (
      typeof deleteCanvasNodes === 'function' &&
      normalizeText(_0xab3d6d['canvasId']) &&
      normalizeText(_0xab3d6d['canvasNodeId'])
    )
      try {
        await deleteCanvasNodes({ canvasId: _0xab3d6d['canvasId'], nodeIds: [_0xab3d6d['canvasNodeId']] });
      } catch (_0x3c52c4) {
        return (_0x50d1ac(_0x3c52c4?.['message'] || '关联画布节点删除失败。', 'error'), ![]);
      }
    const _0x327466 = _0x41d0f8(_0x251929);
    ((_0x109ee4['data']['clipFrames'] = removeStoryClipFrame(_0x15f63e, _0x251929)),
      _0x456306(),
      _0x2fa8a7());
    if (!_0x1adf2f({ refreshContent: !![] })) _0xb8a26b();
    _0x487a78({ immediate: !![] });
    const _0x55e3ca =
      getStoryClipFrameMediaType(_0xab3d6d) === STORY_CLIP_MEDIA_TYPE_VIDEO ? '视频片段' : '片段帧';
    return (
      _0x50d1ac(
        _0x327466 > 0x0 ? _0x55e3ca + '已删除，相关提示词引用已移除。' : _0x55e3ca + '已删除。',
        'success',
      ),
      !![]
    );
  }
  const _0x74bf2d = createStoryVideoReplicationWorkspaceController({
      state: _0x109ee4,
      viewport: _0x44835e,
      documentObject: documentObject,
      windowObject: windowObject,
      analyzeSourceVideo: analyzeSourceVideo,
      analysisPromises: _0x36feea,
      sourceFileByEpisodeKey: _0x579b1e,
      createProjectToken: () => _0xa88d71(_0x109ee4),
      beginProjectSession: () => _0x3d765a(),
      isProjectTaskLive: _0x1539c4,
      isProjectTaskCurrent: _0x111644,
      startBackgroundTask: _0x2ccfa9,
      updateBackgroundTask: _0x3aebdc,
      finishBackgroundTask: _0x3cde55,
      syncProjectEntry: _0x262e0d,
      syncCurrentProjectEntry: _0x41990e,
      schedulePersistence: _0x487a78,
      openProject: _0x18f74e,
      renderFooter: renderStoryVideoReplicationFooter,
      showToast: _0x50d1ac,
      showNavigableTaskResultToast: _0x437371,
      notifyTextTaskComplete: _0x176e4e,
    }),
    {
      createSourcePreviewUrl: _0x5d78d9,
      refreshFooter: _0xaaaaf7,
      releaseSourcePreviewUrls: _0x3c10f8,
      retryFailedAnalysis: _0x2e9061,
      revokeSourcePreviewUrl: _0x38253d,
      runAnalysis: _0xc1885b,
      startFromHome: _0x1a0ba2,
    } = _0x74bf2d,
    _0x39fdaf = createStoryHomeWorkspaceController({
      state: _0x109ee4,
      root: _0x2e97b0,
      viewport: _0x44835e,
      documentObject: documentObject,
      windowObject: windowObject,
      projectData: _0x2f0de7,
      extractDocumentText: extractDocumentText,
      syncCurrentProjectEntry: _0x41990e,
      beginProjectSession: () => _0x3d765a(),
      advanceProjectSession: _0x1cfd62,
      invalidateProjectRuntime: _0x198f7c,
      releaseReplicationSourcePreviewUrls: _0x3c10f8,
      schedulePersistence: _0x487a78,
      render: _0xb8a26b,
      showToast: _0x50d1ac,
      showTaskResultToast: _0x2024a5,
      refreshTextModelSelector: (_0xffbd1e) => _0x234da6['get'](_0xffbd1e)?.['refreshTextModelSelector']?.(),
    }),
    {
      deleteProject: _0x3389fe,
      duplicateProject: _0x460c74,
      focusProjectTitle: _0x2c612e,
      resetCreationState: _0x331cec,
      selectScriptFile: _0x919e40,
      selectScriptMode: _0x1df320,
      setProjectArchived: _0xdd700d,
      switchTab: _0x4d9633,
      syncGenerateState: _0x320ec9,
    } = _0x39fdaf;
  function _0xcf575b({
    overlayId: overlayId = 'story-planning-confirm-overlay',
    title: _0x22cefc,
    message: _0xea7b92,
    choices: choices = [],
    fallbackValue: fallbackValue = null,
  } = {}) {
    if (!documentObject?.['body']) return Promise['resolve'](fallbackValue);
    return (
      documentObject['getElementById'](overlayId)?.['remove'](),
      new Promise((_0x2e4c45) => {
        const _0x4063f1 = documentObject['createElement']('div');
        ((_0x4063f1['id'] = overlayId), (_0x4063f1['className'] = 'custom-confirm-overlay'));
        const _0x559472 = documentObject['createElement']('div');
        _0x559472['className'] = 'custom-confirm-box';
        const _0x589e95 = documentObject['createElement']('div');
        ((_0x589e95['className'] = 'confirm-title'), (_0x589e95['textContent'] = _0x22cefc || '重新生成'));
        const _0x1b7522 = documentObject['createElement']('div');
        ((_0x1b7522['className'] = 'confirm-msg'),
          (_0x1b7522['textContent'] = _0xea7b92 || '请选择如何处理已有生成结果。'));
        const _0x22e0cd = documentObject['createElement']('div');
        ((_0x22e0cd['className'] = 'confirm-btns'),
          _0x559472['append'](_0x589e95, _0x1b7522, _0x22e0cd),
          _0x4063f1['appendChild'](_0x559472),
          documentObject['body']['appendChild'](_0x4063f1));
        let _0x9fe463 = ![],
          _0x427426 = null;
        const _0x58396b = (_0x2b554b) => {
            if (_0x9fe463) return;
            ((_0x9fe463 = !![]),
              documentObject['removeEventListener']('keydown', _0x511884, !![]),
              _0x4063f1['remove'](),
              _0x2e4c45(_0x2b554b));
          },
          _0x511884 = (_0x414efd) => {
            if (_0x414efd['key'] !== 'Escape') return;
            (_0x414efd['preventDefault'](), _0x58396b(null));
          };
        (_0x4063f1['addEventListener']('click', (_0x3f2631) => {
          if (_0x3f2631['target'] === _0x4063f1) _0x58396b(null);
        }),
          choices['forEach']((_0x42693a) => {
            const _0x50b4f3 = documentObject['createElement']('button');
            ((_0x50b4f3['type'] = 'button'),
              (_0x50b4f3['className'] =
                'confirm-btn ' + (_0x42693a['primary'] ? 'confirm-ok' : 'confirm-cancel')),
              (_0x50b4f3['textContent'] = _0x42693a['label']),
              _0x50b4f3['addEventListener']('click', () => _0x58396b(_0x42693a['value'])),
              _0x22e0cd['appendChild'](_0x50b4f3));
            if (_0x42693a['autofocus']) _0x427426 = _0x50b4f3;
          }),
          documentObject['addEventListener']('keydown', _0x511884, !![]),
          _0x427426?.['focus']?.());
      })
    );
  }
  const _0x10b8ea = createStoryAssetExtractionWorkspaceController({
      state: _0x109ee4,
      windowObject: windowObject,
      extractAssets: extractAssets,
      extractAssetsParallel: extractAssetsParallel,
      extractAssetsExperimental: extractAssetsExperimental,
      host: {
        createStoryProjectTaskToken: _0xa88d71,
        finishStoryProjectBackgroundTask: _0x3cde55,
        goToStep: (..._0x4aa637) => _0x40b04a(..._0x4aa637),
        isProjectTaskCurrent: _0x111644,
        isProjectTaskLive: _0x1539c4,
        notifyNavigableTextTaskComplete: _0x176e4e,
        persistWorkspaceNow: _0x2d2251,
        refreshStoryAssetExtractionFooterInPlace: _0x2ca1d8,
        refreshStoryReplicationFooterInPlace: _0xaaaaf7,
        registerStoryProjectData: _0x4dfbc5,
        render: (..._0x8b3b6f) => _0xb8a26b(..._0x8b3b6f),
        reportStoryWorkspaceApiError: reportStoryWorkspaceApiError,
        requestStoryWorkspaceChoice: _0xcf575b,
        resetStoryDownstreamUiState: (..._0x3afd1a) => _0x4ad8b8(..._0x3afd1a),
        scheduleWorkspacePersistence: _0x487a78,
        showTaskResultToast: _0x2024a5,
        showToast: _0x50d1ac,
        startStoryProjectBackgroundTask: _0x2ccfa9,
        syncCompiledEpisodeScripts: (..._0x15e201) => _0x29c6fb(..._0x15e201),
        syncStoryPlanningLoading: _0x529f88,
        syncStoryProjectTaskEntry: _0x262e0d,
        updateStoryProjectBackgroundTask: _0x3aebdc,
      },
    }),
    {
      continueToProjectAssets: _0x20f7f2,
      extractProjectAssets: _0x9b50ec,
      getStoryPlanningAgentContext: _0x287159,
      openEpisodeStage: _0x457c7e,
      requestPlanningRegenerationMode: _0x20a04e,
      restoreStoryAssetBreakdownProgress: _0x2cfc60,
      setStoryPlanningOperation: _0x2c35bb,
      stopStoryAssetBreakdownProgress: _0x378f1f,
    } = _0x10b8ea,
    _0x18b440 = createStoryEpisodeOutlineWorkspaceController({
      state: _0x109ee4,
      planEpisodes: planEpisodes,
      host: {
        showToast: _0x50d1ac,
        showTaskResultToast: _0x2024a5,
        requestChoice: _0xcf575b,
        requestRegenerationMode: _0x20a04e,
        createProjectTaskToken: () => _0xa88d71(_0x109ee4),
        getPlanningContext: _0x287159,
        isProjectTaskLive: _0x1539c4,
        isProjectTaskCurrent: _0x111644,
        startBackgroundTask: _0x2ccfa9,
        updateBackgroundTask: _0x3aebdc,
        finishBackgroundTask: _0x3cde55,
        persistNow: _0x2d2251,
        persistenceRequired: () => typeof saveWorkspace === 'function' && _0x167ce5['isReady'](),
        setPlanningOperation: _0x2c35bb,
        syncPlanningLoading: _0x529f88,
        registerProjectData: _0x4dfbc5,
        resetDownstreamUi: _0x4ad8b8,
        schedulePersistence: _0x487a78,
        notifyComplete: _0x176e4e,
        render: _0xb8a26b,
      },
    });
  function _0x1a9c0a(_0xe09b8b = {}) {
    return _0x18b440['execute'](_0xe09b8b);
  }
  function _0x29c6fb(_0x53c8e8 = _0x109ee4['data']) {
    const _0x3063b3 = compileStoryEpisodeScripts(_0x53c8e8['episodes']),
      _0x5334cc = _0x53c8e8['project'] || {};
    return (
      (_0x5334cc['chapters'] = _0x3063b3['chapters']),
      (_0x5334cc['plotScript'] = _0x3063b3['fullText']),
      (_0x5334cc['narrationScript'] = _0x3063b3['fullText']),
      (_0x5334cc['compiledScript'] = _0x3063b3['complete']
        ? {
            revision: Number(_0x5334cc['compiledScript']?.['revision'] || 0x0) + 0x1,
            episodeIds: _0x53c8e8['episodes']['map']((_0x291121) => _0x291121['id']),
            fullText: _0x3063b3['fullText'],
            confirmedAt: Date['now'](),
          }
        : null),
      _0x3063b3
    );
  }
  function _0x4ad8b8({ selectedEpisodeId: selectedEpisodeId = '' } = {}) {
    ((_0x109ee4['assetSelectionMode'] = _0x109ee4['replicationSelectionMode'] = ![]),
      (_0x109ee4['selectedAssetIds'] = []),
      (_0x109ee4['selectedAssetId'] = ''),
      (_0x109ee4['assetAppearanceIndexes'] = {}),
      (_0x109ee4['characterVoiceEditor'] = null),
      (_0x109ee4['episodeSelectionMode'] = ![]),
      (_0x109ee4['selectedEpisodeIds'] = []),
      (_0x109ee4['selectedEpisodeId'] = selectedEpisodeId),
      (_0x109ee4['selectedClipId'] = ''),
      (_0x109ee4['pendingDeleteClipId'] = ''),
      (_0x109ee4['clipSelectionMode'] = ![]),
      (_0x109ee4['selectedClipGenerationIds'] = []),
      (_0x109ee4['scriptSelectionMode'] = ![]),
      (_0x109ee4['selectedScriptEpisodeIds'] = []));
  }
  const _0xf38233 = createStorySummaryGenerationWorkspaceController({
      state: _0x109ee4,
      windowObject: windowObject,
      generateStory: generateStory,
      startReplicationFromHome: (..._0x4cb32f) => _0x1a0ba2(..._0x4cb32f),
      createProjectToken: () => _0xa88d71(_0x109ee4),
      beginProjectSession: () => _0x3d765a(),
      isProjectTaskLive: _0x1539c4,
      isProjectTaskCurrent: _0x111644,
      registerProjectData: _0x4dfbc5,
      startBackgroundTask: _0x2ccfa9,
      updateBackgroundTask: _0x3aebdc,
      finishBackgroundTask: _0x3cde55,
      syncProjectEntry: _0x262e0d,
      syncCurrentProjectEntry: _0x41990e,
      persistNow: _0x2d2251,
      schedulePersistence: _0x487a78,
      requiresDurableRunPersistence: () => typeof saveWorkspace === 'function' && _0x167ce5['isReady'](),
      openProject: _0x18f74e,
      render: _0xb8a26b,
      showToast: _0x50d1ac,
      showTaskResultToast: _0x2024a5,
      notifyTextTaskComplete: _0x176e4e,
      requestChoice: _0xcf575b,
      extractProjectAssets: _0x9b50ec,
      resetDownstreamUi: _0x4ad8b8,
      reportApiError: reportStoryWorkspaceApiError,
    }),
    { generateFromHome: _0xc512da, regenerateSummary: _0x4a497b } = _0xf38233,
    _0x2629c3 = createStoryEpisodeScriptWorkspaceController({
      state: _0x109ee4,
      generateEpisodeScript: generateEpisodeScript,
      host: {
        createProjectTaskToken: () => _0xa88d71(_0x109ee4),
        isProjectTaskLive: _0x1539c4,
        isProjectTaskCurrent: _0x111644,
        getPlanningContext: _0x287159,
        requestChoice: _0xcf575b,
        startBackgroundTask: _0x2ccfa9,
        updateBackgroundTask: _0x3aebdc,
        finishBackgroundTask: _0x3cde55,
        persistNow: _0x2d2251,
        persistenceRequired: () => typeof saveWorkspace === 'function' && _0x167ce5['isReady'](),
        renderPlanningProgress: () => {
          if (_0x109ee4['view'] === 'project' && _0x109ee4['step'] === 0x1) _0xb8a26b();
        },
        registerProjectData: _0x4dfbc5,
        resetDownstreamUi: _0x4ad8b8,
        syncCompiledScripts: _0x29c6fb,
        schedulePersistence: _0x487a78,
      },
    });
  async function _0x1c83e6(
    _0x16bc51,
    _0xc36d6c = _0xa88d71(_0x109ee4),
    { batch: batch = null, regeneration: regeneration = ![] } = {},
  ) {
    return await _0x2629c3['request'](_0x16bc51, _0xc36d6c, { batch: batch, regeneration: regeneration });
  }
  async function _0x52980b(_0x564261, { regeneration: regeneration = ![] } = {}) {
    if (_0x109ee4['storyPlanningOperation']) return ![];
    const _0x3588cd = _0x109ee4['data']['episodes']['findIndex']((_0xf94b7) => _0xf94b7['id'] === _0x564261);
    if (_0x3588cd < 0x0) return ![];
    if (!regeneration && !canGenerateStoryEpisodeScript(_0x109ee4['data']['episodes'], _0x3588cd))
      return (
        _0x50d1ac(
          '请先完成第\x20' +
            (getNextStoryEpisodeScriptIndex(_0x109ee4['data']['episodes']) + 0x1) +
            ' 集剧本。',
          'warn',
        ),
        ![]
      );
    const _0x4397ab = _0x109ee4['data']['episodes'][_0x3588cd];
    ((_0x109ee4['scriptGenerationFocusMode'] = !![]),
      (_0x109ee4['generatingEpisodeScriptId'] = _0x4397ab['id']),
      (_0x109ee4['episodeScriptGenerationStatus'] = '正在生成第 ' + (_0x3588cd + 0x1) + ' 集完整剧本'),
      _0x2c35bb('writing-episode-script', _0x109ee4['episodeScriptGenerationStatus']));
    const _0x193018 = _0xa88d71(_0x109ee4);
    try {
      const _0x1196a8 = await _0x1c83e6(_0x4397ab, _0x193018, { regeneration: regeneration });
      if (!_0x1539c4(_0x193018)) return ![];
      return (
        _0x176e4e('第\x20' + (_0x3588cd + 0x1) + ' 集完整剧本生成完成。', _0x193018, {
          step: 0x1,
          outlineSectionId: 'episode-' + _0x564261,
        }),
        Boolean(_0x1196a8)
      );
    } catch (_0x5f2ea9) {
      if (!_0x1539c4(_0x193018)) return ![];
      return (
        reportStoryWorkspaceApiError('write-episode-script', _0x5f2ea9, {
          model: _0x109ee4['models']['text'],
          provider: _0x109ee4['textProvider'],
          episodeId: _0x564261,
        }),
        _0x2024a5(
          _0x5f2ea9?.['message'] || '第\x20' + (_0x3588cd + 0x1) + '\x20集剧本生成失败。',
          'error',
          _0x5f2ea9,
        ),
        ![]
      );
    } finally {
      _0x111644(_0x193018) &&
        ((_0x109ee4['generatingEpisodeScriptId'] = ''),
        (_0x109ee4['episodeScriptGenerationStatus'] = ''),
        (_0x109ee4['storyPlanningOperation'] = ''),
        (_0x109ee4['storyPlanningStatus'] = ''),
        _0xb8a26b());
    }
  }
  function _0x1e6791() {
    if (_0x109ee4['storyPlanningOperation'] !== 'writing-episode-scripts') return ![];
    const _0x3b2402 = normalizeText(_0x109ee4['episodeScriptBatchId']);
    if (!_0x3b2402) return ![];
    const _0x3ee693 = getStoryBackgroundTasks(_0x109ee4['data'])['find'](
      (_0x40f68d) => isStoryBackgroundTaskActive(_0x40f68d) && _0x40f68d['batch']?.['id'] === _0x3b2402,
    );
    if (!_0x3ee693) return ![];
    const _0x36b356 = normalizeText(_0x109ee4['generatingEpisodeScriptId']),
      _0x44b4da = (
        Array['isArray'](_0x3ee693['batch']?.['pendingEpisodeIds'])
          ? _0x3ee693['batch']['pendingEpisodeIds']
          : []
      )
        ['map']((_0x586255) => normalizeText(_0x586255))
        ['filter']((_0x34235d) => _0x34235d && _0x34235d !== _0x36b356);
    if (!_0x44b4da['length']) return (_0x50d1ac('当前集正在生成，暂无可取消的排队分集。', 'info'), ![]);
    if (!_0xb3aeb9['request'](_0x3b2402)) return ![];
    const _0x439169 = _0x109ee4['data']['episodes']['findIndex'](
        (_0x29857d) => normalizeText(_0x29857d?.['id']) === _0x36b356,
      ),
      _0x57466f =
        _0x439169 >= 0x0
          ? '已取消后续 ' + _0x44b4da['length'] + '\x20集排队，正在完成第\x20' + (_0x439169 + 0x1) + '\x20集'
          : '已取消后续\x20' + _0x44b4da['length'] + '\x20集排队，正在完成当前集',
      _0x1301e5 = _0xa88d71(_0x109ee4);
    return (
      _0x101eef(_0x1301e5, _0x3b2402, {
        cancelRequested: !![],
        cancelledEpisodeIds: _0x44b4da,
        pendingEpisodeIds: _0x36b356 ? [_0x36b356] : [],
        label: _0x57466f,
      }),
      (_0x109ee4['episodeScriptBatchCancelRequested'] = !![]),
      (_0x109ee4['episodeScriptGenerationStatus'] = _0x57466f),
      (_0x109ee4['storyPlanningStatus'] = _0x57466f),
      _0xb8a26b(),
      _0x50d1ac('已取消后续 ' + _0x44b4da['length'] + ' 集排队；当前集会继续生成。', 'info'),
      !![]
    );
  }
  async function _0x2d58d3({ selectedOnly: selectedOnly = ![] } = {}) {
    if (_0x109ee4['storyPlanningOperation']) return ![];
    if (selectedOnly && !_0x109ee4['selectedScriptEpisodeIds']['length'])
      return (_0x50d1ac('请先选择从下一集开始的连续分集。', 'info'), ![]);
    const _0xb98a6a = getStoryEpisodeScriptBatchTargets(
      _0x109ee4['data']['episodes'],
      selectedOnly ? _0x109ee4['selectedScriptEpisodeIds'] : [],
    );
    if (!_0xb98a6a['length'])
      return (
        _0x50d1ac(selectedOnly ? '请选择从下一集开始的连续分集。' : '没有待生成的分集剧本。', 'info'),
        ![]
      );
    ((_0x109ee4['isBatchGeneratingScripts'] = !![]), (_0x109ee4['scriptGenerationFocusMode'] = !![]));
    const _0x5e4b56 = _0xa88d71(_0x109ee4),
      _0x1e98f5 = _0x5e4b56['data'],
      _0x43df1a = _0xdfe98f('episode-scripts', {
        total: _0xb98a6a['length'],
        completed: 0x0,
        targetEpisodeIds: _0xb98a6a['map']((_0x285c95) => _0x285c95['id']),
        pendingEpisodeIds: _0xb98a6a['map']((_0x11a7eb) => _0x11a7eb['id']),
        label: '批量生成 0/' + _0xb98a6a['length'],
      });
    ((_0x109ee4['episodeScriptBatchId'] = _0x43df1a['id']),
      (_0x109ee4['episodeScriptBatchCancelRequested'] = ![]),
      _0x2c35bb('writing-episode-scripts', '准备按顺序生成 ' + _0xb98a6a['length'] + '\x20集'));
    let _0x37751 = 0x0;
    try {
      const _0x275a35 = await runStoryEpisodeScriptBatchQueue({
        targets: _0xb98a6a,
        batchId: _0x43df1a['id'],
        isLive: () => _0x1539c4(_0x5e4b56),
        isCancellationRequested: (_0x29c61d) => _0xb3aeb9['isRequested'](_0x29c61d),
        beforeTarget: ({
          target: _0x5f23a9,
          completed: _0xc6f2bf,
          total: _0x2364a8,
          pendingTargets: _0x20f9b7,
        }) => {
          const _0x2e6628 = _0x1e98f5['episodes']['findIndex'](
              (_0x19d5a2) => _0x19d5a2['id'] === _0x5f23a9['id'],
            ),
            _0x3d5a35 = '正在生成第 ' + (_0x2e6628 + 0x1) + ' 集 · ' + (_0xc6f2bf + 0x1) + '/' + _0x2364a8;
          (_0x43e7dd(_0x5e4b56, _0x43df1a, {
            completed: _0xc6f2bf,
            pendingEpisodeIds: _0x20f9b7['map']((_0x1c1b84) => _0x1c1b84['id']),
            label: _0x3d5a35,
          }),
            _0x111644(_0x5e4b56) &&
              ((_0x109ee4['generatingEpisodeScriptId'] = _0x5f23a9['id']),
              (_0x109ee4['episodeScriptGenerationStatus'] = _0x3d5a35),
              _0xb8a26b()));
        },
        runTarget: async (_0x2e7c2c) => {
          const _0x15d54f = _0x1e98f5['episodes']['findIndex'](
            (_0x31451a) => _0x31451a['id'] === _0x2e7c2c['id'],
          );
          return _0x1c83e6(_0x1e98f5['episodes'][_0x15d54f], _0x5e4b56, { batch: _0x43df1a });
        },
        afterTarget: ({
          completed: _0x33b321,
          total: _0x1f618b,
          pendingTargets: _0x191a52,
          cancelRequested: _0x14c769,
        }) => {
          ((_0x37751 = _0x33b321),
            _0x43e7dd(_0x5e4b56, _0x43df1a, {
              completed: _0x37751,
              cancelRequested: _0x14c769,
              pendingEpisodeIds: _0x191a52['map']((_0x5d854d) => _0x5d854d['id']),
              label: _0x14c769
                ? '批量生成已停止 · 完成 ' + _0x37751 + '/' + _0x1f618b
                : '批量生成\x20' + _0x37751 + '/' + _0x1f618b,
            }));
        },
      });
      if (_0x275a35['status'] === 'interrupted') return ![];
      if (_0x275a35['status'] === 'cancelled')
        return (
          _0x176e4e(
            _0x275a35['cancelled']
              ? '当前集已完成，已取消剩余 ' + _0x275a35['cancelled'] + '\x20集排队。'
              : '当前集已完成，批量生成已停止。',
            _0x5e4b56,
            { step: 0x1, outlineSectionId: 'episodes' },
          ),
          _0x111644(_0x5e4b56) &&
            ((_0x109ee4['scriptSelectionMode'] = ![]), (_0x109ee4['selectedScriptEpisodeIds'] = [])),
          !![]
        );
      return (
        _0x176e4e('已按顺序完成\x20' + _0x37751 + '\x20集完整剧本。', _0x5e4b56, {
          step: 0x1,
          outlineSectionId: 'episodes',
        }),
        _0x111644(_0x5e4b56) &&
          ((_0x109ee4['scriptSelectionMode'] = ![]), (_0x109ee4['selectedScriptEpisodeIds'] = [])),
        !![]
      );
    } catch (_0x1dc04d) {
      if (!_0x1539c4(_0x5e4b56)) return ![];
      return (
        reportStoryWorkspaceApiError('write-episode-scripts-batch', _0x1dc04d, {
          model: _0x109ee4['models']['text'],
          provider: _0x109ee4['textProvider'],
          completed: _0x37751,
        }),
        _0x2024a5(
          '已完成 ' + _0x37751 + ' 集；' + (_0x1dc04d?.['message'] || '后续分集生成失败。'),
          'error',
          _0x1dc04d,
        ),
        ![]
      );
    } finally {
      (_0xb3aeb9['clear'](_0x43df1a['id']),
        _0x111644(_0x5e4b56) &&
          ((_0x109ee4['isBatchGeneratingScripts'] = ![]),
          (_0x109ee4['generatingEpisodeScriptId'] = ''),
          (_0x109ee4['episodeScriptBatchId'] = ''),
          (_0x109ee4['episodeScriptBatchCancelRequested'] = ![]),
          (_0x109ee4['episodeScriptGenerationStatus'] = ''),
          (_0x109ee4['storyPlanningOperation'] = ''),
          (_0x109ee4['storyPlanningStatus'] = ''),
          _0xb8a26b()));
    }
  }
  async function _0x3d170(_0x3bb6eb) {
    if (_0x109ee4['storyPlanningOperation']) return ![];
    if (_0x109ee4['data']['project']?.['sourceMode'] === 'upload-original')
      return (_0x50d1ac('上传剧本保持原稿，不支持 AI 扩写分集正文。', 'info'), ![]);
    const _0x5c22fa = _0x109ee4['data']['episodes']['findIndex'](
      (_0x6dcc3f) => _0x6dcc3f['id'] === _0x3bb6eb,
    );
    if (_0x5c22fa < 0x0 || !normalizeText(_0x109ee4['data']['episodes'][_0x5c22fa]?.['script']?.['fullText']))
      return (_0x50d1ac('当前分集正文尚未生成。', 'info'), ![]);
    return _0x52980b(_0x3bb6eb, { regeneration: !![] });
  }
  function _0x19fcb7(_0x108cdb) {
    const _0x56dd6b = getNextStoryEpisodeScriptIndex(_0x109ee4['data']['episodes']),
      _0x373d7d = _0x109ee4['data']['episodes']['findIndex']((_0xd8d0d0) => _0xd8d0d0['id'] === _0x108cdb);
    if (_0x373d7d < _0x56dd6b || _0x373d7d < 0x0) return ![];
    const _0x525a6a = _0x109ee4['selectedScriptEpisodeIds']['includes'](_0x108cdb),
      _0x2de187 = _0x525a6a ? _0x373d7d : _0x373d7d + 0x1;
    return (
      (_0x109ee4['selectedScriptEpisodeIds'] = _0x109ee4['data']['episodes']
        ['slice'](_0x56dd6b, _0x2de187)
        ['map']((_0x13633f) => _0x13633f['id'])),
      (_0x109ee4['scriptSelectionMode'] = _0x109ee4['selectedScriptEpisodeIds']['length'] > 0x0),
      _0xb8a26b(),
      !![]
    );
  }
  const _0xcd6697 = createStoryEpisodeSplitWorkspaceController({
      state: _0x109ee4,
      windowObject: windowObject,
      operations: {
        recoverDraft: recoverEpisodeSplitDraft,
        review: reviewEpisodeSplit,
        splitExperimental: splitEpisodeExperimental,
        splitStandard: splitEpisode,
      },
      projectTasks: _0x2a13f4,
      persistence: {
        isDurableRequired: () => typeof saveWorkspace === 'function' && _0x167ce5['isReady'](),
        persistNow: _0x2d2251,
        schedule: _0x487a78,
      },
      presentation: {
        getGenerationControl: (_0x5d4377) => getStoryEpisodeGenerationControlState(_0x109ee4, _0x5d4377),
        notifyComplete: _0x176e4e,
        notifyGenerationResult: _0x34edeb,
        openEpisode: (..._0x555542) => _0x48fc72(..._0x555542),
        render: (..._0x5d9480) => _0xb8a26b(..._0x5d9480),
        requestChoice: _0xcf575b,
        showTaskResult: _0x2024a5,
        showToast: _0x50d1ac,
      },
      getPlanningContext: _0x287159,
    }),
    {
      cancelBatch: _0x4a0d8c,
      recoverDraft: _0x1db911,
      splitBatch: _0x33d6b9,
      splitEpisode: _0x4d20fa,
      splitEpisodeExperimental: _0x122630,
    } = _0xcd6697;
  async function _0x5cf2f6() {
    if (!isStoryEpisodeExperimentalSplitAvailable(windowObject)) return ![];
    if (_0x109ee4['storyPlanningOperation']) return ![];
    if (typeof planEpisodes !== 'function')
      return (_0x50d1ac('分集规划\x20Agent\x20尚未初始化。', 'error'), ![]);
    const _0x311b61 = normalizeStoryWorkspaceAssetData(_0x38dbd3(_0x109ee4['data'])),
      _0x5dbaa6 = _0x287159(_0x311b61);
    try {
      const _0x1e9594 = () =>
        captureStoryRequestPayload((_0xb94732) =>
          planEpisodes({
            project: _0x5dbaa6['project'],
            constraints: _0x5dbaa6['project']['planning'],
            model: _0x5dbaa6['model'],
            provider: _0x5dbaa6['provider'],
            providerProfileId: _0x5dbaa6['providerProfileId'],
            request: _0xb94732,
          }),
        );
      return (
        openStoryRequestDebugPreview({
          documentObject: documentObject,
          windowObject: windowObject,
          preparePayload: _0x1e9594,
          title: '分集大纲请求调试',
          subtitle: '以下是点击“生成分集大纲”后构造的实际请求；本次仅预览，不会发送到 API。',
        }),
        !![]
      );
    } catch (_0x2abbc9) {
      return (
        reportStoryWorkspaceApiError('debug-episode-outline-request', _0x2abbc9),
        _0x50d1ac(_0x2abbc9?.['message'] || '分集大纲调试请求构建失败。', 'error'),
        ![]
      );
    }
  }
  async function _0x542653() {
    if (!isStoryEpisodeExperimentalSplitAvailable(windowObject)) return ![];
    if (_0x109ee4['storyPlanningOperation']) return ![];
    if (typeof generateEpisodeScript !== 'function')
      return (_0x50d1ac('完整分集剧本 Agent 尚未初始化。', 'error'), ![]);
    const _0x18e53f = normalizeStoryWorkspaceAssetData(_0x38dbd3(_0x109ee4['data'])),
      _0x2ff69d = getNextStoryEpisodeScriptIndex(_0x18e53f['episodes']),
      _0x5402f2 = _0x18e53f['episodes'][_0x2ff69d];
    if (!_0x5402f2) return (_0x50d1ac('没有待生成的分集正文。', 'info'), ![]);
    const _0x394504 = _0x287159(_0x18e53f);
    try {
      const _0x1b4428 = () =>
        captureStoryRequestPayload((_0x3aed59) =>
          generateEpisodeScript({
            project: _0x394504['project'],
            episode: _0x5402f2,
            previousEpisode: _0x2ff69d > 0x0 ? _0x18e53f['episodes'][_0x2ff69d - 0x1] : null,
            nextEpisode: _0x18e53f['episodes'][_0x2ff69d + 0x1] || null,
            model: _0x394504['model'],
            provider: _0x394504['provider'],
            providerProfileId: _0x394504['providerProfileId'],
            request: _0x3aed59,
          }),
        );
      return (
        openStoryRequestDebugPreview({
          documentObject: documentObject,
          windowObject: windowObject,
          preparePayload: _0x1b4428,
          title: '第\x20' + (_0x5402f2['number'] || _0x2ff69d + 0x1) + ' 集正文请求调试',
          subtitle: '以下是下一集正文生成时构造的实际请求；本次仅预览，不会发送到 API。',
        }),
        !![]
      );
    } catch (_0x487252) {
      return (
        reportStoryWorkspaceApiError('debug-episode-script-request', _0x487252, {
          episodeId: _0x5402f2['id'],
        }),
        _0x50d1ac(_0x487252?.['message'] || '分集正文调试请求构建失败。', 'error'),
        ![]
      );
    }
  }
  async function _0x4c05d5() {
    if (!isStoryAssetExperimentalExtractionAvailable(windowObject)) return ![];
    if (_0x109ee4['storyPlanningOperation']) return ![];
    if (typeof extractAssetsExperimental !== 'function')
      return (_0x50d1ac('混合素材开发测试尚未初始化。', 'error'), ![]);
    const _0x165abc = normalizeStoryWorkspaceAssetData(_0x38dbd3(_0x109ee4['data'])),
      _0x5e9fe3 = _0x287159(_0x165abc);
    try {
      const _0xa4aa0e = () =>
        captureStoryRequestPayload((_0x1d4009) =>
          extractAssetsExperimental({
            ..._0x5e9fe3,
            episodes: _0x165abc['episodes'],
            resumeDraft: _0x165abc['experimentalAssetExtractionDraft'],
            preferLocal: ![],
            request: _0x1d4009,
          }),
        );
      return (
        openStoryRequestDebugPreview({
          documentObject: documentObject,
          windowObject: windowObject,
          preparePayload: _0xa4aa0e,
          title: '混合素材抽取 API 请求调试',
          subtitle:
            '以下是开发链路构造的首个 API 请求；中短剧本预览角色专用请求，超长剧本因本次不运行本地模型而预览备用分批请求。仅供调试，不会发送到 API。',
        }),
        !![]
      );
    } catch (_0x1b4aea) {
      return (
        reportStoryWorkspaceApiError('debug-asset-extraction-experimental-request', _0x1b4aea),
        _0x50d1ac(_0x1b4aea?.['message'] || '混合素材抽取调试请求构建失败。', 'error'),
        ![]
      );
    }
  }
  async function _0x5ae72d(_0x52c86b, _0x7c0c9e = !![]) {
    if (!isStoryEpisodeExperimentalSplitAvailable(windowObject)) return ![];
    const _0x3985eb = getStoryEpisodeGenerationControlState(_0x109ee4, _0x52c86b);
    if (_0x3985eb['disabled']) return ![];
    const _0x32192a = _0x7c0c9e ? splitEpisodeExperimental : splitEpisode;
    if (typeof _0x32192a !== 'function')
      return (_0x50d1ac('实验分批拆分\x20Agent\x20尚未初始化。', 'error'), ![]);
    const _0x43d6a3 = normalizeStoryWorkspaceAssetData(_0x38dbd3(_0x109ee4['data'])),
      _0x815433 = _0x43d6a3['episodes']['find']((_0x14ba0b) => _0x14ba0b['id'] === _0x52c86b);
    if (!_0x815433) return ![];
    const _0x41705e = _0x287159(_0x43d6a3),
      _0x207790 = _0x43d6a3['episodes']['findIndex']((_0x2ac84c) => _0x2ac84c['id'] === _0x815433['id']),
      _0xa80099 = _0x207790 > 0x0 ? _0x43d6a3['episodes'][_0x207790 - 0x1] : null,
      _0x41188f = _0x207790 >= 0x0 ? _0x43d6a3['episodes'][_0x207790 + 0x1] || null : null,
      _0x27a0df =
        _0x815433?.['experimentalSplitDraft']?.['status'] === 'completed'
          ? null
          : _0x815433?.['experimentalSplitDraft'] || null;
    try {
      const _0x586234 = () =>
        captureStoryRequestPayload((_0x45dc7c) =>
          _0x32192a({
            project: _0x41705e['project'],
            episode: _0x815433,
            previousEpisode: _0xa80099,
            nextEpisode: _0x41188f,
            assets: _0x43d6a3['assets'],
            constraints: _0x41705e['project']['planning'],
            model: _0x41705e['model'],
            provider: _0x41705e['provider'],
            providerProfileId: _0x41705e['providerProfileId'],
            promptExperiment: _0x7c0c9e,
            resumeDraft: _0x27a0df,
            request: _0x45dc7c,
          }),
        );
      return (
        openStoryRequestDebugPreview({
          documentObject: documentObject,
          windowObject: windowObject,
          preparePayload: _0x586234,
          title: '第\x20' + (_0x815433['number'] || '') + ' 集请求调试',
          subtitle: '下一次分镜生成构造的请求；本次仅预览，不会发送到 API。',
        }),
        !![]
      );
    } catch (_0x239183) {
      return (
        reportStoryWorkspaceApiError('debug-experimental-split-request', _0x239183, {
          episodeId: _0x815433['id'],
        }),
        _0x50d1ac(_0x239183?.['message'] || '调试请求构建失败。', 'error'),
        ![]
      );
    }
  }
  const _0x1e0212 = createStoryClipProductionWorkspaceController({
      state: _0x109ee4,
      root: _0x2e97b0,
      documentObject: documentObject,
      windowObject: windowObject,
      activeControllers: _0x3d21f9,
      projectTasks: {
        createToken: () => _0xa88d71(_0x109ee4),
        isLive: _0x1539c4,
        isCurrent: _0x111644,
        register: _0x4dfbc5,
        createBatch: _0xdfe98f,
        syncBatch: _0x43e7dd,
      },
      createGenerationController: _0x5d50ed,
      render: _0xb8a26b,
      refreshGeneration: _0x69a755,
      persistWorkspaceNow: _0x2d2251,
      schedulePersistence: _0x487a78,
      showToast: _0x50d1ac,
      showTaskApiKeyError: _0x2f2968,
      showTaskResultToast: _0x2024a5,
      showNavigableTaskResultToast: _0x437371,
      notifyNavigableGenerationComplete: _0x34edeb,
    }),
    { generateSelection: _0x46df8c, runtime: _0x36bfa5 } = _0x1e0212;
  async function _0x1b4994(_0x4a282e, _0x1e5175 = null) {
    const _0xf0b5f1 = getSelectedEpisode(_0x109ee4),
      _0x10cdf4 = getSelectedClip(_0x109ee4, _0xf0b5f1);
    if (!_0xf0b5f1 || (_0x4a282e === 'current' && !_0x10cdf4))
      return (_0x50d1ac('请先选择要导出的片段。', 'warn'), ![]);
    const _0x3a8b07 = _0x1e5175?.['disabled'] === !![];
    if (_0x1e5175 && 'disabled' in _0x1e5175) _0x1e5175['disabled'] = !![];
    syncStoryAsyncButton(_0x1e5175, !![]);
    try {
      const _0x4709bd = await exportStoryClipVideos({
        project: _0x109ee4['data']['project'],
        episode: _0xf0b5f1,
        clip: _0x10cdf4,
        mode: _0x4a282e,
      });
      if (_0x4709bd?.['canceled']) return ![];
      if (!_0x4709bd?.['success'])
        throw new Error(_0x4709bd?.['error'] || _0x4709bd?.['message'] || '视频片段导出失败。');
      const _0x4e4d05 = Math['max'](0x0, Number(_0x4709bd['exportedCount']) || 0x0),
        _0x1d4440 = Math['max'](0x0, Number(_0x4709bd['skippedCount']) || 0x0);
      return (
        _0x50d1ac(
          _0x1d4440
            ? '已导出 ' + _0x4e4d05 + ' 个片段，跳过 ' + _0x1d4440 + ' 个无可用视频的片段。'
            : _0x4a282e === 'current'
              ? '当前片段已导出。'
              : '已导出本集 ' + _0x4e4d05 + ' 个片段。',
          'success',
        ),
        !![]
      );
    } catch (_0x2c5ff8) {
      return (_0x50d1ac(_0x2c5ff8?.['message'] || '视频片段导出失败。', 'error'), ![]);
    } finally {
      syncStoryAsyncButton(_0x1e5175, ![]);
      if (_0x1e5175 && 'disabled' in _0x1e5175) _0x1e5175['disabled'] = _0x3a8b07;
    }
  }
  async function _0x219abf(_0xf9cc32) {
    const _0x371544 = getSelectedStoryAsset(_0x109ee4, getVisibleStoryAssets(_0x109ee4)),
      _0x1fb05f = _0x371544 ? getSelectedAssetAppearance(_0x109ee4, _0x371544) : null,
      _0x11ef28 = normalizeText(_0x1fb05f?.['imageUrl']);
    if (!_0x371544 || !_0x1fb05f || !_0x11ef28) return (_0x50d1ac('当前没有可下载的图片。', 'warn'), ![]);
    const _0x139978 = normalizeText(_0x1fb05f['name']),
      _0x4d219e = normalizeText(_0x371544['name']) || '生成图片',
      _0x1c9014 =
        _0x139978 && _0x139978 !== _0x4d219e && _0x139978 !== '基础形象'
          ? [_0x4d219e, _0x139978]['join']('-')
          : _0x4d219e;
    try {
      syncStoryAsyncButton(_0xf9cc32, !![], { spinnerOnly: !![] });
      const _0x3eab88 = await runWorkspaceImageDownloadAction(_0xf9cc32, () =>
        saveWorkspaceImageDownload({ imageRef: _0x11ef28, filenameBase: _0x1c9014, saveMedia: saveMedia }),
      );
      if (!_0x3eab88 || _0x3eab88['canceled']) return ![];
      if (_0x3eab88['success'] === ![]) throw new Error(_0x3eab88['error'] || '图片下载失败，请稍后重试。');
      return (_0x50d1ac('图片已保存。', 'success'), !![]);
    } catch (_0x146c5d) {
      return (_0x50d1ac(_0x146c5d?.['message'] || '图片下载失败，请稍后重试。', 'error'), ![]);
    } finally {
      syncStoryAsyncButton(_0xf9cc32, ![]);
    }
  }
  async function _0x471edc() {
    const _0x368ffa = findStoryAsset(_0x109ee4, _0x109ee4['selectedAssetId']),
      _0x129dc8 = _0x368ffa ? getSelectedAssetAppearance(_0x109ee4, _0x368ffa) : null;
    if (!_0x368ffa || !_0x129dc8 || _0x368ffa['isLibraryAsset'])
      return (_0x50d1ac('当前形象不可加入总素材。', 'warn'), ![]);
    if (!normalizeText(_0x129dc8['imageUrl'])) return (_0x50d1ac('请先生成或上传当前形象。', 'warn'), ![]);
    if (typeof saveAssetPackageItem !== 'function')
      return (_0x50d1ac('总素材服务尚未初始化。', 'error'), ![]);
    const _0x25fa4e = _0x368ffa['id'] + ':' + _0x129dc8['id'];
    if (normalizeText(_0x109ee4['exportingAssetAppearanceKey']) === _0x25fa4e) return ![];
    const _0x3142dc = _0xa88d71(_0x109ee4),
      _0x346edb = _0x2e97b0['querySelector'](
        '.story-page.is-current\x20.story-asset-detail\x20.story-asset-preview',
      ),
      _0x32f2f0 = _0x346edb?.['getBoundingClientRect']?.() || null;
    let _0x3b2447 = ![];
    ((_0x109ee4['exportingAssetAppearanceKey'] = _0x25fa4e), _0xb8a26b());
    try {
      let _0x1d950c = buildStoryAssetPackageItemRequest({
        project: _0x3142dc['data']['project'],
        asset: _0x368ffa,
        appearance: _0x129dc8,
      });
      const _0x1c8918 = normalizeText(_0x1d950c['image']?.['imageUrl'] || _0x129dc8['imageUrl']),
        _0x16da10 = Boolean(
          normalizeText(
            _0x1d950c['image']?.['localPath'] ||
              _0x1d950c['image']?.['originalLocalPath'] ||
              _0x1d950c['image']?.['displayLocalPath'],
          ),
        );
      if (!_0x16da10 && /^(?:https?:|blob:|data:)/i['test'](_0x1c8918)) {
        const _0x4b9661 = await saveOutputFromUrl(_0x1c8918, {
          kind: 'image',
          ext: 'png',
          dedupeKey: [
            'story-asset-package',
            normalizeText(_0x3142dc['projectId']),
            normalizeText(_0x368ffa['id']),
            normalizeText(_0x129dc8['id']),
            _0x1c8918,
          ]['join'](':'),
        });
        if (_0x4b9661?.['error']) throw new Error(_0x4b9661['error']);
        const _0x5608ab = normalizeText(
          _0x4b9661?.['displayUrl'] ||
            _0x4b9661?.['url'] ||
            _0x4b9661?.['originalUrl'] ||
            _0x4b9661?.['thumbUrl'],
        );
        if (!_0x5608ab) throw new Error('保存当前形象失败：缺少稳定图片地址。');
        _0x1d950c = buildStoryAssetPackageItemRequest({
          project: _0x3142dc['data']['project'],
          asset: _0x368ffa,
          appearance: _0x129dc8,
          image: {
            ..._0x1d950c['image'],
            ...(_0x4b9661 && typeof _0x4b9661 === 'object' ? _0x4b9661 : {}),
            imageUrl: _0x5608ab,
          },
        });
      }
      const _0x1f9968 = await saveAssetPackageItem(_0x1d950c);
      if (!_0x1539c4(_0x3142dc)) return ![];
      const _0x3a7777 = normalizeText(_0x1f9968?.['imageUrl'] || _0x1d950c['image']?.['imageUrl']);
      return (
        _0x3a7777 && (_0x129dc8['imageUrl'] = _0x3a7777),
        (_0x129dc8['totalAssetRef'] = {
          assetId: normalizeText(_0x1f9968?.['assetId']),
          itemIndex: Math['max'](0x0, Math['trunc'](Number(_0x1f9968?.['itemIndex']) || 0x0)),
          itemKey: _0x1d950c['itemKey'],
          imageUrl: _0x3a7777,
          updatedAt: Date['now'](),
        }),
        _0x487a78({ immediate: !![] }),
        _0x50d1ac(
          _0x1f9968?.['itemCreated'] === ![] ? '已更新总素材中的当前形象。' : '当前形象已加入总素材。',
          'success',
        ),
        (_0x3b2447 = !![]),
        !![]
      );
    } catch (_0x3bb6dd) {
      return (
        _0x1539c4(_0x3142dc) && _0x50d1ac(_0x3bb6dd?.['message'] || '加入总素材失败，请稍后重试。', 'error'),
        ![]
      );
    } finally {
      _0x111644(_0x3142dc) &&
        ((_0x109ee4['exportingAssetAppearanceKey'] = ''),
        _0xb8a26b(),
        _0x3b2447 &&
          _0x346edb &&
          _0x32f2f0 &&
          playAssetCreateFly({
            fromRect: _0x32f2f0,
            contentElement: _0x346edb,
            toElement: _0x2e97b0['querySelector']('[data-story-asset-filter="library"]'),
            documentObject: documentObject,
            windowObject: windowObject,
          }));
    }
  }
  function _0x412ed9(_0x59d502 = '', _0x4cbb9c = '', _0x34cd5b = ![], _0x4a79b4 = null) {
    const _0x2f0ffd = findStoryAsset(_0x109ee4, _0x59d502);
    if (!_0x2f0ffd) return (_0x50d1ac('请选择本剧已有的角色、场景或道具。', 'warn'), ![]);
    const _0x477f22 = getVisibleStoryAssets(_0x109ee4),
      _0x5c76ea = _0x4a79b4 || getStoryLibraryActionAssetIds(_0x109ee4, _0x477f22);
    if (normalizeText(_0x4cbb9c) && _0x5c76ea['length'] !== 0x1)
      return (_0x50d1ac('替换已有形象时只能选择一张总素材图片。', 'warn'), ![]);
    const _0x43a02f = addStoryLibraryAssetsToProject(
        _0x109ee4['data']['assets'],
        _0x477f22,
        _0x5c76ea,
        _0x2f0ffd['id'],
        { targetAppearanceId: _0x4cbb9c, createAppearance: _0x34cd5b },
      ),
      _0x4ff093 = [
        ..._0x43a02f['updatedAppearanceIds'],
        ..._0x43a02f['existingAssetIds'],
        ..._0x43a02f['addedAssetIds'],
      ];
    if (!_0x4ff093['length']) return (_0x50d1ac('请选择总素材中的图片后再加入项目。', 'warn'), ![]);
    (_0x403c84(), (_0x109ee4['data']['assets'] = _0x43a02f['assets']));
    const _0x2233bf = findStoryAsset(_0x109ee4, _0x2f0ffd['id']),
      _0x2fa12e = _0x4ff093['at'](-0x1) || '',
      _0xa46e56 = getStoryAssetAppearances(_0x2233bf)['findIndex'](
        (_0x304b5f) => normalizeText(_0x304b5f?.['id']) === _0x2fa12e,
      );
    (applyStoryLibraryAdditionUiState(_0x109ee4, {
      targetAssetId: _0x2f0ffd['id'],
      selectedAppearanceIndex: _0xa46e56,
    }),
      _0xb8a26b(),
      _0x487a78({ immediate: !![] }));
    if (_0x43a02f['updatedAppearanceIds']['length'])
      _0x50d1ac('已更新' + _0x2f0ffd['name'] + '的所选形象。', 'success');
    else
      _0x43a02f['addedAssetIds']['length']
        ? _0x50d1ac(
            '已为' + _0x2f0ffd['name'] + '新增\x20' + _0x43a02f['addedAssetIds']['length'] + ' 个形象。',
            'success',
          )
        : _0x50d1ac('所选图片已在' + _0x2f0ffd['name'] + '的形象中。', 'info');
    return !![];
  }
  function _0x241ae6(_0x418ca6, _0x391d5e = _0x109ee4['selectedAssetId']) {
    const _0x359fec = findStoryAsset(_0x109ee4, _0x391d5e),
      _0x3484bc = _0x359fec ? getStoryAssetAppearances(_0x359fec) : [];
    if (_0x3484bc['length'] < 0x2) return;
    const _0x8761be = getSelectedAssetAppearanceIndex(_0x109ee4, _0x359fec),
      _0x54570e = (_0x8761be + _0x418ca6 + _0x3484bc['length']) % _0x3484bc['length'];
    ((_0x109ee4['assetAppearanceIndexes'] = {
      ..._0x109ee4['assetAppearanceIndexes'],
      [_0x359fec['id']]: _0x54570e,
    }),
      (_0x109ee4['pendingDeleteAssetAppearanceKey'] = ''),
      (_0x109ee4['assetAppearanceMotion'] = _0x418ca6 > 0x0 ? 'next' : 'previous'));
    const _0x26bd5f = [..._0x2e97b0['querySelectorAll']('.story-asset-card[data-story-asset-id]')]['find'](
      (_0xad338d) => _0xad338d['dataset']['storyAssetId'] === _0x391d5e,
    );
    if (_0x26bd5f) {
      const _0x2a5e0f = documentObject['createElement']('div');
      _0x2a5e0f['innerHTML'] = renderStoryAssetCard(_0x109ee4, _0x359fec);
      const _0x36f7a7 = _0x26bd5f['querySelector']('.story-replacement-comparison')
        ? '.story-replacement-comparison > span:last-child'
        : '.story-asset-card-media';
      ((_0x26bd5f['querySelector'](_0x36f7a7)['innerHTML'] =
        _0x2a5e0f['querySelector'](_0x36f7a7)['innerHTML']),
        (_0x26bd5f['querySelector']('.story-asset-card-copy')['innerHTML'] =
          _0x2a5e0f['querySelector']('.story-asset-card-copy')['innerHTML']));
      const _0x499134 = _0x26bd5f['parentElement']['querySelector'](
          '[data-story-action="request-delete-asset-appearance"]',
        ),
        _0x5439e4 = _0x2a5e0f['querySelector']('[data-story-action="request-delete-asset-appearance"]');
      if (_0x499134 && _0x5439e4) _0x499134['replaceWith'](_0x5439e4);
      else {
        if (_0x499134) _0x499134['remove']();
        else {
          if (_0x5439e4) _0x26bd5f['parentElement']['append'](_0x5439e4);
        }
      }
    }
    if (_0x391d5e === _0x109ee4['selectedAssetId'] && !_0x4d5584()) _0xb8a26b();
    ((_0x109ee4['assetAppearanceMotion'] = ''), _0x487a78({ uiOnly: !![] }));
  }
  function _0x3c4bd6(_0x2525d5) {
    const _0x23aead = _0x2525d5['target']['closest']?.(
      '[data-story-appearance-wheel="true"], [data-story-card-appearance-wheel]',
    );
    if (!_0x23aead || _0x109ee4['view'] !== 'project' || _0x109ee4['step'] !== 0x2) return ![];
    for (
      let _0x2cffcb = _0x2525d5['target'];
      _0x2cffcb && _0x2cffcb !== _0x23aead;
      _0x2cffcb = _0x2cffcb['parentElement']
    ) {
      if (hasWorkspaceScrollableOverflow(_0x2cffcb, windowObject['getComputedStyle'](_0x2cffcb))) return ![];
    }
    _0x2525d5['preventDefault']();
    const _0x381c20 = consumeStoryWheelDirection(_0x2525d5, _0x58e89b);
    if (_0x381c20)
      _0x241ae6(_0x381c20, _0x23aead['dataset']['storyCardAppearanceWheel'] || _0x109ee4['selectedAssetId']);
    return !![];
  }
  const _0xe24661 = createStoryClipResultSelectionController({
      state: _0x109ee4,
      viewport: _0x44835e,
      documentObject: documentObject,
      getSelectedEpisode: getSelectedEpisode,
      getSelectedClip: getSelectedClip,
      resetAdjustmentUi: _0x216d6c,
      applyVideoSettings: _0x38bff8,
      refreshSelectedClip: _0x446fd0,
      refreshSelectedVideoResult: _0x1bcd6a,
      refreshHistory: (_0x2d0657) => _0x27857a?.['refresh']?.(_0x2d0657),
      hideHistory: _0x15d8ff,
      render: _0xb8a26b,
      schedulePersistence: _0x487a78,
    }),
    {
      deleteVideoResult: _0x534c72,
      handleNavigationWheel: _0x3cf425,
      selectVideoResult: _0x45e3c2,
      switchSelectedClip: _0x5a2318,
      switchSelectedVideoResult: _0xd470b3,
    } = _0xe24661;
  function _0x597d8a(_0x24425d) {
    if (!_0x24425d?.['closest']?.('.story-page')?.['classList']['contains']('is-current')) return null;
    const _0x2e2315 = normalizeText(_0x24425d?.['dataset']?.['storyMarqueeSurface']);
    if (_0x2e2315 === 'assets')
      return createStoryAssetMarqueeConfig(_0x109ee4, {
        getVisibleAssets: getVisibleStoryAssets,
        beforeCommit: () =>
          updateStoryAssetPromptFromEditor(
            _0x109ee4,
            _0x54cd25()?.['querySelector']?.('[data-story-asset-prompt][contenteditable=\x22true\x22]'),
          ),
        render: () => {
          (_0xb8a26b(), focusWorkspaceAssetCard(_0x2e97b0, _0x109ee4['selectedAssetId']));
        },
      });
    if (_0x2e2315 === 'episodes')
      return {
        enabled:
          _0x109ee4['view'] === 'project' &&
          _0x109ee4['step'] === 0x3 &&
          !getStoryEpisodeBatchControlState(_0x109ee4)['disabled'],
        selectedIds: _0x109ee4['selectedEpisodeIds'],
        commit(_0x1fa230) {
          ((_0x109ee4['episodeSelectionMode'] = !![]),
            (_0x109ee4['selectedEpisodeIds'] = _0x1fa230),
            _0xb8a26b());
        },
      };
    if (_0x2e2315 === 'clips')
      return {
        enabled: _0x109ee4['view'] === 'episode',
        selectedIds: _0x109ee4['selectedClipGenerationIds'],
        commit(_0x5d04ff) {
          ((_0x109ee4['pendingDeleteClipId'] = ''),
            (_0x109ee4['clipSelectionMode'] = !![]),
            (_0x109ee4['selectedClipGenerationIds'] = _0x5d04ff),
            _0x457f02(),
            _0x3deaa5());
        },
      };
    return null;
  }
  const _0xd0330d = createStoryMarqueeSelectionController({
      root: _0x2e97b0,
      documentObject: documentObject,
      windowObject: windowObject,
      getConfig: _0x597d8a,
      onActivate: _0x456306,
    }),
    _0x5dc928 = [
      '[data-story-marquee-item]',
      'button',
      'a[href]',
      'input',
      'textarea',
      'select',
      'label',
      'img',
      'video',
      'audio',
      'canvas',
      "[contenteditable='true']",
      "[role='button']",
      "[role='option']",
      '[role=\x27menuitem\x27]',
      "[role='slider']",
      '[tabindex]',
    ]['join'](',');
  function _0xf33372(_0x22c80b) {
    const _0x50b41d = _0x44835e['querySelector']('.story-page.is-current'),
      _0x2d599f = _0x22c80b?.['target'];
    if (!_0x50b41d?.['contains'](_0x2d599f) || !_0x2d599f?.['closest']) return ![];
    if (_0x2d599f['closest'](_0x5dc928)) return ![];
    if (_0x109ee4['view'] === 'project' && _0x109ee4['step'] === 0x2 && _0x109ee4['assetSelectionMode'])
      ((_0x109ee4['assetSelectionMode'] = ![]), (_0x109ee4['selectedAssetIds'] = []), _0xb8a26b());
    else {
      if (_0x109ee4['view'] === 'project' && _0x109ee4['step'] === 0x3 && _0x109ee4['episodeSelectionMode'])
        ((_0x109ee4['episodeSelectionMode'] = ![]), (_0x109ee4['selectedEpisodeIds'] = []), _0xb8a26b());
      else {
        if (_0x109ee4['view'] === 'episode' && _0x109ee4['clipSelectionMode'])
          ((_0x109ee4['clipSelectionMode'] = ![]),
            (_0x109ee4['selectedClipGenerationIds'] = []),
            _0x3deaa5());
        else return ![];
      }
    }
    return (_0xd0330d['cancel'](), !![]);
  }
  const _0x2839d9 = createStoryWorkspaceNavigationTransaction({
    state: _0x109ee4,
    toolbarEl: _0x198a72,
    windowObject: windowObject,
    renderAdapter: { render: _0xb8a26b, renderToolbar: _0x1925bd, capturePageState: _0x2d84bd },
    onClipSelected: _0x5bfff6,
    onCommit: () => _0x487a78({ uiOnly: !![] }),
    notify: _0x50d1ac,
  });
  async function _0x40b04a(_0x5d456a, _0x84c89d = {}) {
    return _0x2839d9['navigate']({ ..._0x84c89d, view: 'project', step: _0x5d456a });
  }
  function _0x1f5594(_0xd3540c) {
    const _0x3034d7 = normalizeStoryWorkspaceStep(_0xd3540c);
    if (_0x109ee4['data']?.['project']?.['outlineStatus'] === 'stale' && _0x3034d7 > 0x1) {
      _0x50d1ac('故事蓝图已修改，请先重新运行分集规划。', 'warn');
      return;
    }
    if (_0x109ee4['step'] !== 0x3 && _0x3034d7 === 0x3) void _0x457c7e();
    else void _0x40b04a(_0x3034d7);
  }
  function _0x40e91d(_0x89a26e) {
    return handleWorkspaceStepShortcut(_0x89a26e, {
      enabled:
        _0x57f246 && !_0x109ee4['canvasSyncPending'] && ['project', 'episode']['includes'](_0x109ee4['view']),
      stepCount: STORY_STEPS['length'] + (isStoryCollaborationProject(_0x109ee4['data']) ? 0x1 : 0x0),
      navigate: (_0x4dada8) =>
        _0x1f5594(_0x4dada8 - (isStoryCollaborationProject(_0x109ee4['data']) ? 0x1 : 0x0)),
    });
  }
  async function _0x48fc72(_0x43d4ea, _0x42f3cb = '', _0x4902c2 = null) {
    const _0x24b667 = _0x4902c2?.['disabled'] === !![];
    (_0x4902c2?.['classList']?.['add']('is-opening'), syncStoryAsyncButton(_0x4902c2, !![]));
    if (_0x4902c2 && 'disabled' in _0x4902c2) _0x4902c2['disabled'] = !![];
    try {
      return (
        hasPendingRuntimeManifestLoad() && (await waitForRuntimeManifestLoad({ timeoutMs: 0x1f4 })),
        _0x2839d9['navigate']({ view: 'episode', episodeId: _0x43d4ea, clipId: _0x42f3cb })
      );
    } finally {
      (_0x4902c2?.['classList']?.['remove']('is-opening'), syncStoryAsyncButton(_0x4902c2, ![]));
      if (_0x4902c2 && 'disabled' in _0x4902c2) _0x4902c2['disabled'] = _0x24b667;
    }
  }
  function _0x2e2d85(_0x10a3be) {
    const _0x2b1b99 = _0x10a3be['dataset']['storyModelKind'],
      _0x3752af = _0x10a3be['dataset']['storyModelOption'];
    if (!_0x2b1b99 || !_0x3752af) return;
    ((_0x109ee4['models'][_0x2b1b99] = resolveStoryWorkspaceModelId(_0x2b1b99, _0x3752af)),
      _0x487a78(),
      _0xb8a26b());
  }
  function _0x5ac7c0(_0x242551) {
    return resolveStoryWorkspaceContextMenuItems({
      event: _0x242551,
      root: _0x2e97b0,
      projects: _0x109ee4['projects'],
      state: _0x109ee4,
      libraryAssets: getVisibleStoryAssets(_0x109ee4),
      getTabLabel: getStoryAssetTabLabel,
      commands: {
        addLibraryAudioAssets: (_0x35292a) => {
          if (
            !addStoryLibraryAudioToProject(
              _0x109ee4,
              getVisibleStoryAssets(_0x109ee4)['filter']((_0x4bc650) =>
                _0x35292a['includes'](_0x4bc650['id']),
              ),
            )
          )
            return;
          (_0x41990e(), _0x487a78({ immediate: !![] }), _0xb8a26b());
        },
        bindAudioCharacter: (_0x72e28b, _0x1ea4b1) => {
          const _0x2208dc = getVisibleStoryAssets(_0x109ee4)['find'](
            (_0x1df49c) => _0x1df49c['id'] === _0x72e28b,
          );
          if (!_0x2208dc || !bindStoryAudioToCharacter(_0x109ee4['data'], _0x2208dc, _0x1ea4b1)) return;
          (_0x41990e(), _0x487a78({ immediate: !![] }), _0xb8a26b());
        },
        addLibraryAssets: (_0x201b81, _0x3fe4c2, _0x3b7fb5, _0x164298) =>
          _0x412ed9(_0x3fe4c2, _0x3b7fb5, _0x164298, _0x201b81),
        openProject: _0x3bfffe,
        renameProject(_0x3fc0fe) {
          ((_0x109ee4['openProjectMenuId'] = ''), _0xb8a26b(), _0x2c612e(_0x3fc0fe));
        },
        duplicateProject: _0x460c74,
        collectProject: (_0x105eab) => void _0x1744eb(_0x105eab),
        setProjectArchived: _0xdd700d,
        requestDeleteProject(_0x3f5dec) {
          ((_0x109ee4['openProjectMenuId'] = ''),
            (_0x109ee4['pendingDeleteProjectId'] = _0x3f5dec),
            _0xb8a26b());
        },
      },
    });
  }
  windowObject?.['addEventListener']?.('keydown', _0x40e91d, !![]);
  const _0x89ceea = bindWorkspaceEntityContextMenu(_0x2e97b0, {
    resolveItems: _0x5ac7c0,
    beforeOpen() {
      if (!_0x109ee4['openProjectMenuId']) return;
      ((_0x109ee4['openProjectMenuId'] = ''), _0xb8a26b());
    },
  });
  (windowObject?.['addEventListener']?.('pointermove', _0xa05991, !![]),
    windowObject?.['addEventListener']?.('pointerup', _0x4a7636, !![]),
    windowObject?.['addEventListener']?.('pointercancel', _0x26aeab, !![]),
    _0x2e97b0['addEventListener']('pointerdown', (_0x3f56bb) => {
      (_0x3f56bb['stopPropagation'](), _0x456306());
      !_0x3f56bb['target']['closest']?.('[data-story-clip-video-history-menu]') && _0x15d8ff();
      if (_0x96940(_0x3f56bb)) return;
      _0xd0330d['begin'](_0x3f56bb);
    }),
    _0x2e97b0['addEventListener']('pointerover', (_0xd3aead) => {
      const _0x3daf52 = _0xd3aead['target']['closest']?.('[data-story-library-appearance-target]');
      _0x3daf52 &&
        !(_0xd3aead['relatedTarget'] && _0x3daf52['contains'](_0xd3aead['relatedTarget'])) &&
        _0x19d9e0(_0x3daf52);
      const _0x522793 = _0xd3aead['target']['closest']?.(
        '.story-clip-card-shell[data-story-video-history=\x22true\x22]',
      );
      _0x522793 &&
        _0x2e97b0['contains'](_0x522793) &&
        !(_0xd3aead['relatedTarget'] && _0x522793['contains'](_0xd3aead['relatedTarget'])) &&
        _0x4b5bfd(_0x522793, _0xd3aead);
      const _0x4d5377 = getStoryAssetHoverCard(_0xd3aead['target']);
      if (!_0x4d5377 || !_0x2e97b0['contains'](_0x4d5377)) return;
      if (_0xd3aead['relatedTarget'] && _0x4d5377['contains'](_0xd3aead['relatedTarget'])) return;
      _0x17bd82(_0x4d5377, _0xd3aead);
    }),
    _0x2e97b0['addEventListener']('focusin', (_0x481e2e) => {
      const _0x3c7922 = _0x481e2e['target']['closest']?.('[data-story-library-appearance-target]');
      if (_0x3c7922) _0x19d9e0(_0x3c7922);
    }),
    _0x2e97b0['addEventListener']('pointermove', (_0xd23299) => {
      if (_0xd0330d['update'](_0xd23299)) return;
      const _0x108409 = getStoryAssetHoverCard(_0xd23299['target']);
      if (!_0x108409) {
        _0x2c041c['getHoveredAssetId']() && _0x456306();
        return;
      }
      _0x17bd82(_0x108409, _0xd23299);
    }),
    _0x2e97b0['addEventListener']('pointerup', (_0x221509) => {
      _0xd0330d['finish'](_0x221509);
    }),
    _0x2e97b0['addEventListener']('pointercancel', (_0x1d2ea3) => {
      _0xd0330d['finish'](_0x1d2ea3, { cancelled: !![] });
    }),
    _0x2e97b0['addEventListener']('lostpointercapture', (_0x15468a) => {
      if (_0x28d3ef(_0x15468a, { cancelled: !![] })) return;
      (_0x549cf5['cancelSession'](), _0xd0330d['finish'](_0x15468a, { cancelled: !![] }));
    }),
    _0x2e97b0['addEventListener']('dragstart', (_0x48eec2) => {
      const _0x50fd6b = _0x48eec2['target']['closest']?.('article[data-story-replication-episode-id]');
      if (_0x50fd6b) {
        if (!_0x48eec2['target']['closest']?.('[data-story-replication-drag-handle]')) {
          _0x48eec2['preventDefault']();
          return;
        }
        _0x5df8d0 = normalizeText(_0x50fd6b['dataset']['storyReplicationEpisodeId']);
        if (!_0x5df8d0) {
          _0x48eec2['preventDefault']();
          return;
        }
        ((_0x7dc14 = [
          ...(_0x50fd6b['closest']('[data-story-replication-grid]')?.['querySelectorAll'](
            'article[data-story-replication-episode-id]',
          ) || []),
        ]['map']((_0x4f37f3) => normalizeText(_0x4f37f3['dataset']['storyReplicationEpisodeId']))),
          _0x48eec2['dataTransfer']?.['setData']?.('application/x-story-replication-episode', _0x5df8d0));
        if (_0x48eec2['dataTransfer']) _0x48eec2['dataTransfer']['effectAllowed'] = 'move';
        (setReplicationCardDragImage(_0x48eec2, _0x50fd6b),
          _0x50fd6b['classList']['add']('is-reordering'),
          _0x50fd6b['closest']('[data-story-replication-grid]')?.['classList']['add']('is-reordering'));
        return;
      }
      const _0x3895af = _0x48eec2['target']['closest']?.('[data-story-reference-asset]');
      if (_0x3895af) {
        if (_0x549cf5['hasSession']()) {
          _0x48eec2['preventDefault']();
          return;
        }
        const _0xf6c1ef = normalizeText(_0x3895af['dataset']['storyReferenceAsset']),
          _0x5046aa = Math['max'](
            0x0,
            Math['trunc'](Number(_0x3895af['dataset']['storyReferenceAssetIndex']) || 0x0),
          );
        if (!writeStoryAssetDragData(_0x48eec2['dataTransfer'], _0xf6c1ef, _0x5046aa)) return;
        (applyStoryAssetNativeDragPreview(_0x48eec2['dataTransfer'], _0x3895af),
          (_0x31318e = _0xf6c1ef),
          (_0x398985 = _0x5046aa),
          _0x3895af['classList']['add']('is-story-asset-dragging'),
          _0x456306());
        return;
      }
      if (_0x48eec2['target']['closest']?.('[data-story-marquee-item]')) _0x48eec2['preventDefault']();
    }),
    _0x2e97b0['addEventListener']('dragend', () => {
      if (_0x5df8d0) {
        const _0x329951 = _0x2e97b0['querySelector']('[data-story-replication-grid]');
        settleReplicationCardMotion(_0x329951);
        if (_0x329951 && _0x7dc14['length']) {
          const _0x121b4a = new Map(
            [..._0x329951['querySelectorAll']('article[data-story-replication-episode-id]')]['map'](
              (_0x4bbead) => [normalizeText(_0x4bbead['dataset']['storyReplicationEpisodeId']), _0x4bbead],
            ),
          );
          _0x7dc14['forEach']((_0x2d519b) => {
            const _0x42a9e2 = _0x121b4a['get'](_0x2d519b);
            if (_0x42a9e2) _0x329951['appendChild'](_0x42a9e2);
          });
        }
        (_0x2e97b0['querySelectorAll']('.story-replication-card.is-reordering')['forEach']((_0x507d48) =>
          _0x507d48['classList']['remove']('is-reordering'),
        ),
          _0x2e97b0['querySelector']('[data-story-replication-grid]')?.['classList']['remove'](
            'is-reordering',
          ),
          (_0x5df8d0 = ''),
          (_0x7dc14 = []));
      }
      _0x132152();
    }),
    _0x2e97b0['addEventListener']('keydown', (_0x1e2e8d) => {
      const _0x561a1d = _0x1e2e8d['target']['closest']?.('[data-story-replication-drag-handle]');
      if (!_0x561a1d || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']['includes'](_0x1e2e8d['key']))
        return;
      const _0x209f64 = _0x561a1d['closest']('article[data-story-replication-episode-id]'),
        _0x11682f = normalizeText(_0x209f64?.['dataset']['storyReplicationEpisodeId']),
        _0x1db6f7 = _0x109ee4['data']['episodes']['findIndex'](
          (_0x4ec65c) => normalizeText(_0x4ec65c?.['id']) === _0x11682f,
        ),
        _0x5b4bd0 = ['ArrowUp', 'ArrowLeft']['includes'](_0x1e2e8d['key']) ? -0x1 : 0x1,
        _0x176cb0 = _0x1db6f7 + _0x5b4bd0;
      if (_0x1db6f7 < 0x0 || _0x176cb0 < 0x0 || _0x176cb0 >= _0x109ee4['data']['episodes']['length']) return;
      (_0x1e2e8d['preventDefault'](), _0x1e2e8d['stopPropagation']());
      const _0x4eef43 = _0x109ee4['data']['episodes']['map']((_0x183b99) => _0x183b99['id']);
      (([_0x4eef43[_0x1db6f7], _0x4eef43[_0x176cb0]] = [_0x4eef43[_0x176cb0], _0x4eef43[_0x1db6f7]]),
        (_0x109ee4['data']['episodes'] = reorderStoryVideoReplicationEpisodes(
          _0x109ee4['data']['episodes'],
          _0x4eef43,
        )),
        syncStoryVideoReplicationProject(_0x109ee4['data']));
      const _0x15783e = _0x209f64['closest']('[data-story-replication-grid]'),
        _0x26f72d = [
          ...(_0x15783e?.['querySelectorAll']('article[data-story-replication-episode-id]') || []),
        ]['find'](
          (_0x44fc7d) =>
            normalizeText(_0x44fc7d['dataset']['storyReplicationEpisodeId']) === _0x4eef43[_0x1db6f7],
        );
      (_0x15783e &&
        _0x26f72d &&
        (_0x15783e['insertBefore'](_0x209f64, _0x5b4bd0 < 0x0 ? _0x26f72d : _0x26f72d['nextSibling']),
        _0x109ee4['data']['episodes']['forEach']((_0x4225f8, _0xada63) => {
          const _0x454567 = [..._0x15783e['querySelectorAll']('article[data-story-replication-episode-id]')][
            'find'
          ](
            (_0x259506) =>
              normalizeText(_0x259506['dataset']['storyReplicationEpisodeId']) === _0x4225f8['id'],
          );
          syncStoryVideoReplicationCardElement(_0x454567, _0x4225f8, _0xada63);
        }),
        _0x209f64['querySelector']('[data-story-replication-drag-handle]')?.['focus']()),
        _0x487a78({ immediate: !![] }));
    }),
    _0x2e97b0['addEventListener']('pointerout', (_0x546c16) => {
      const _0x2b89b1 = _0x546c16['target']['closest']?.(
        '.story-clip-card-shell[data-story-video-history="true"]',
      );
      _0x2b89b1 &&
        !(_0x546c16['relatedTarget'] && _0x2b89b1['contains'](_0x546c16['relatedTarget'])) &&
        !_0x401ab9?.['contains'](_0x546c16['relatedTarget']) &&
        _0x15d8ff({ delayed: !![] });
      const _0x5cfc8d = getStoryAssetHoverCard(_0x546c16['target']);
      if (!_0x5cfc8d || getStoryAssetHoverCardId(_0x5cfc8d) !== _0x2c041c['getHoveredAssetId']()) return;
      if (_0x546c16['relatedTarget'] && _0x5cfc8d['contains'](_0x546c16['relatedTarget'])) return;
      _0x456306();
    }),
    _0x2e97b0['addEventListener']('dblclick', (_0x138e6b) => {
      _0x138e6b['stopPropagation']();
      const _0x3eff3e = _0x138e6b['target']['closest']?.('img.story-asset-preview');
      if (!_0x3eff3e || !_0x2e97b0['contains'](_0x3eff3e)) return;
      const _0x455a5f = _0x3eff3e['closest']('[data-story-asset-detail-layout]')
          ? findStoryAsset(_0x109ee4, _0x109ee4['selectedAssetId'])
          : null,
        _0x5b3dd1 = _0x455a5f ? getSelectedAssetAppearance(_0x109ee4, _0x455a5f) : null,
        _0x596d60 =
          (_0x5b3dd1 && resolveStoryAssetAppearanceOriginalUrl(_0x5b3dd1)) ||
          normalizeText(_0x3eff3e['currentSrc'] || _0x3eff3e['getAttribute']('src'));
      if (!isUsableImageUrl(_0x596d60)) return;
      (_0x138e6b['preventDefault'](),
        openImagePreview(_0x596d60, { alt: _0x3eff3e['alt'] || '素材图片预览' }));
    }),
    _0x2e97b0['addEventListener'](
      'wheel',
      (_0x306786) => {
        _0x306786['stopPropagation']();
        if (_0x3c4bd6(_0x306786)) return;
        if (_0x3cf425(_0x306786)) return;
        if (scrollStoryClipPromptHistoryWithWheel(_0x306786)) return;
        if (scrollStoryClipStripWithWheel(_0x306786)) return;
        if (shouldPreserveStoryWorkspaceNestedWheel(_0x306786['target'])) return;
        const _0x306330 = _0x44835e['querySelector']('.story-page.is-current');
        if (!_0x306330) return;
        (_0x306786['preventDefault'](),
          (_0x306330['scrollTop'] += Number(_0x306786['deltaY'] || 0x0)),
          (_0x306330['scrollLeft'] += Number(_0x306786['deltaX'] || 0x0)));
      },
      { passive: ![] },
    ),
    _0x44835e['addEventListener'](
      'scroll',
      (_0x23297c) => {
        const _0xd6d311 = _0x23297c['target'];
        if (!_0x57f246 || !_0xd6d311?.['matches']?.('.story-page.is-current')) return;
        const _0x30485d = _0x309f60 || _0xde8860();
        ((_0x109ee4['pageScrollPositions'] = {
          ...(_0x109ee4['pageScrollPositions'] || {}),
          [_0x30485d]: {
            top: Math['max'](0x0, Number(_0xd6d311['scrollTop']) || 0x0),
            left: Math['max'](0x0, Number(_0xd6d311['scrollLeft']) || 0x0),
          },
        }),
          _0x487a78({ uiOnly: !![] }));
      },
      !![],
    ),
    _0x2e97b0['addEventListener']('keydown', (_0x4b13a0) => {
      const _0x2cd85f = _0x4b13a0['target']['closest']?.('[data-story-custom-episode-count-input]');
      if (_0x2cd85f) {
        if (_0x4b13a0['key'] === 'Enter')
          (_0x4b13a0['preventDefault'](), _0x4b13a0['stopPropagation'](), _0x2dbe5b(_0x2cd85f));
        else
          _0x4b13a0['key'] === 'Escape' &&
            (_0x4b13a0['preventDefault'](),
            _0x4b13a0['stopPropagation'](),
            _0x5e1c3d(
              _0x2cd85f,
              normalizeStoryEpisodeCount(_0x109ee4['data']['project']?.['planning']?.['episodeCount']),
            ));
        return;
      }
      const _0x4f25b5 = _0x4b13a0['target']['closest']?.(
        '[data-story-action=\x22toggle-clip-adjustment-mode\x22]',
      );
      if (_0x4f25b5 && ['ArrowDown', 'ArrowUp']['includes'](_0x4b13a0['key'])) {
        (_0x4b13a0['preventDefault'](), _0x4b13a0['stopPropagation']());
        const _0x4a9ca5 =
          _0x4f25b5['closest']('[data-story-adjustment-kind]')?.['dataset']['storyAdjustmentKind'] || 'mode';
        ((_0x109ee4[
          _0x4a9ca5 === 'language' ? 'clipAdjustmentLanguageOpen' : 'clipAdjustmentPromptModeOpen'
        ] = !![]),
          (_0x109ee4[
            _0x4a9ca5 === 'language' ? 'clipAdjustmentPromptModeOpen' : 'clipAdjustmentLanguageOpen'
          ] = ![]),
          _0x3adde1({ kind: _0x4a9ca5 === 'language' ? 'mode' : 'language' }),
          _0x3adde1({ kind: _0x4a9ca5, focus: 'selected' }));
        return;
      }
      const _0x2fe8f8 = _0x4b13a0['target']['closest']?.('[data-story-clip-adjustment-mode-option]');
      if (_0x2fe8f8 && ['ArrowDown', 'ArrowUp', 'Home', 'End']['includes'](_0x4b13a0['key'])) {
        const _0x15652e = _0x2fe8f8['closest']('[role=listbox]'),
          _0x50e987 = [
            ...(_0x15652e?.['querySelectorAll']('[data-story-clip-adjustment-mode-option]') || []),
          ],
          _0x3a9286 = Math['max'](0x0, _0x50e987['indexOf'](_0x2fe8f8)),
          _0x4102f7 =
            _0x4b13a0['key'] === 'Home'
              ? 0x0
              : _0x4b13a0['key'] === 'End'
                ? _0x50e987['length'] - 0x1
                : (_0x3a9286 + (_0x4b13a0['key'] === 'ArrowDown' ? 0x1 : -0x1) + _0x50e987['length']) %
                  _0x50e987['length'];
        (_0x4b13a0['preventDefault'](), _0x4b13a0['stopPropagation'](), _0x50e987[_0x4102f7]?.['focus']());
        return;
      }
      if (
        _0x4b13a0['key'] === 'Enter' &&
        _0x4b13a0['target']['matches']?.('[data-story-clip-adjustment-instruction]')
      ) {
        (_0x4b13a0['preventDefault'](), _0x4b13a0['stopPropagation'](), void _0x46422f());
        return;
      }
      if (_0x1099fe(_0x4b13a0)) return;
      if (_0x40e91d(_0x4b13a0)) return;
      if (_0x4b13a0['key'] === 'Escape') {
        if (_0x109ee4['clipPromptHistoryOpen']) {
          (_0x4b13a0['preventDefault'](),
            _0x4b13a0['stopPropagation'](),
            (_0x109ee4['clipPromptHistoryOpen'] = ![]),
            _0x2298ed({ focus: 'trigger' }));
          return;
        }
        if (_0x109ee4['clipAdjustmentPromptModeOpen'] || _0x109ee4['clipAdjustmentLanguageOpen']) {
          (_0x4b13a0['preventDefault'](), _0x4b13a0['stopPropagation']());
          const _0x1229f2 = _0x109ee4['clipAdjustmentLanguageOpen'] ? 'language' : 'mode';
          ((_0x109ee4['clipAdjustmentPromptModeOpen'] = _0x109ee4['clipAdjustmentLanguageOpen'] = ![]),
            _0x3adde1({ kind: _0x1229f2, focus: 'trigger' }));
          return;
        }
        (_0xd0330d['cancel'](),
          _0x345d08(),
          _0x76c71e(),
          _0x403c84(),
          _0x457f02(),
          _0x109ee4['view'] === 'project' &&
            _0x109ee4['step'] === 0x2 &&
            ((_0x109ee4['assetSelectionMode'] = ![]), (_0x109ee4['selectedAssetIds'] = []), _0xb8a26b()),
          _0x109ee4['clipSelectionMode'] &&
            ((_0x109ee4['clipSelectionMode'] = ![]),
            (_0x109ee4['selectedClipGenerationIds'] = []),
            _0x3deaa5()),
          (_0x109ee4['episodeSelectionMode'] || _0x109ee4['scriptSelectionMode']) &&
            ((_0x109ee4['episodeSelectionMode'] = _0x109ee4['scriptSelectionMode'] = ![]),
            (_0x109ee4['selectedEpisodeIds'] = []),
            (_0x109ee4['selectedScriptEpisodeIds'] = []),
            _0xb8a26b()));
      }
      const _0x31213d = _0x4b13a0['target']['closest']?.(
        '[data-story-appearance-wheel="true"], [data-story-card-appearance-wheel]',
      );
      if (_0x31213d && ['ArrowLeft', 'ArrowRight']['includes'](_0x4b13a0['key'])) {
        (_0x4b13a0['preventDefault'](),
          _0x4b13a0['stopPropagation'](),
          _0x241ae6(
            _0x4b13a0['key'] === 'ArrowRight' ? 0x1 : -0x1,
            _0x31213d['dataset']['storyCardAppearanceWheel'] || _0x109ee4['selectedAssetId'],
          ));
        return;
      }
      const _0x2badfb = _0x4b13a0['target']['closest']?.('[data-story-clip-navigation="true"]');
      if (_0x2badfb && ['ArrowLeft', 'ArrowRight']['includes'](_0x4b13a0['key'])) {
        (_0x4b13a0['preventDefault'](),
          _0x4b13a0['stopPropagation'](),
          _0x5a2318(_0x4b13a0['key'] === 'ArrowRight' ? 0x1 : -0x1));
        return;
      }
      if (_0x274d26['handleKeyDown'](_0x4b13a0)) return;
      const _0x759173 = _0x4b13a0['target']['closest']?.('[data-story-episode-splitter]');
      if (_0x759173 && ['ArrowLeft', 'ArrowRight']['includes'](_0x4b13a0['key'])) {
        (_0x4b13a0['preventDefault'](), _0x4b13a0['stopPropagation']());
        const _0x4f2909 = _0x4b13a0['key'] === 'ArrowLeft' ? -0x2 : 0x2;
        _0x759173['dataset']['storyEpisodeSplitter'] === 'assets'
          ? _0x4af1e5(_0x109ee4['episodeAssetPanelRatio'] + _0x4f2909, _0x109ee4['episodeEditorPanelRatio'], {
              persist: !![],
            })
          : _0x4af1e5(_0x109ee4['episodeAssetPanelRatio'], _0x109ee4['episodeEditorPanelRatio'] + _0x4f2909, {
              persist: !![],
            });
        return;
      }
      if (!_0x57f246 || _0x109ee4['view'] !== 'home') return;
      if (!isStoryGenerateShortcut(_0x4b13a0)) return;
      (_0x4b13a0['preventDefault'](), _0x4b13a0['stopPropagation']());
      if (_0x109ee4['homeTab'] === 'collaborate') _0xdac690['start']();
      else void _0xc512da();
    }),
    _0x2e97b0['addEventListener'](
      'toggle',
      (_0xf7bb7) => {
        const _0x4dd940 = _0xf7bb7['target'];
        if (!_0x4dd940?.['matches']?.('details[data-story-outline-section]')) return;
        const _0x41b343 = _0x4dd940['dataset']['storyOutlineSection'];
        ((_0x109ee4['outlineSectionOpenState'] = {
          ...(_0x109ee4['outlineSectionOpenState'] || {}),
          [_0x41b343]: _0x4dd940['open'],
        }),
          _0x487a78({ uiOnly: !![] }));
        if (!_0x4dd940['open']) return;
        if (!_0x109ee4['scriptGenerationFocusMode'] || !['original', 'summary']['includes'](_0x41b343))
          return;
        if (
          ['writing-episode-script', 'writing-episode-scripts']['includes'](
            _0x109ee4['storyPlanningOperation'],
          )
        )
          return;
        _0x109ee4['scriptGenerationFocusMode'] = ![];
      },
      !![],
    ),
    _0x2e97b0['addEventListener']('error', handleWorkspaceAssetLibraryImageError, !![]),
    _0x2e97b0['addEventListener']('click', (_0x25006a) => {
      if (_0xd0330d['consumeClick'](_0x25006a)) return;
      if (_0xf33372(_0x25006a)) return;
      const _0x33b455 = _0x2e97b0['querySelector']('[data-story-custom-episode-count-input]'),
        _0xcb91d0 =
          normalizeText(_0x33b455?.['value']) ||
          _0x33b455?.['closest']('.story-episode-count-custom-editor')?.['classList']['contains'](
            'is-selected',
          );
      if (
        _0x33b455 &&
        _0xcb91d0 &&
        _0x25006a['target']['closest']('[data-story-action="generate-story"]') &&
        !_0x2dbe5b(_0x33b455)
      ) {
        _0x25006a['preventDefault']();
        return;
      }
      _0x109ee4['openProjectMenuId'] &&
        !_0x25006a['target']['closest']('[data-story-project-menu-wrap]') &&
        _0x1ac9be('');
      if (!_0x25006a['target']['closest']('[data-story-project-sort-wrap]')) _0x475004();
      if (!_0x25006a['target']['closest']('.story-home-param-picker')) _0x76c71e();
      !_0x25006a['target']['closest'](
        '.story-asset-batch-menu-wrap, [data-story-library-target-menu], [data-story-library-appearance-menu]',
      ) && _0x403c84();
      if (!_0x25006a['target']['closest']('.story-canvas-sync-menu-wrap')) _0x457f02();
      !_0x25006a['target']['closest']('.story-character-voice-history-wrap') && _0x593e47();
      const _0x4fecfa = _0x25006a['target']['closest']('[data-story-select-script-episode]');
      if (
        _0x4fecfa &&
        (_0x109ee4['scriptSelectionMode'] ||
          _0x25006a['shiftKey'] ||
          _0x25006a['ctrlKey'] ||
          _0x25006a['metaKey']) &&
        !_0x25006a['target']['closest']('[data-story-action]')
      ) {
        (_0x25006a['preventDefault'](),
          (_0x109ee4['scriptSelectionMode'] = !![]),
          _0x19fcb7(_0x4fecfa['dataset']['storySelectScriptEpisode']));
        return;
      }
      const _0x16e455 = _0x25006a['target']['closest']('[data-story-home-param-trigger]');
      if (_0x16e455) {
        const _0x3951e6 = _0x16e455['closest']('.story-home-param-picker'),
          _0x5a97bc = !_0x3951e6['classList']['contains']('is-open');
        (_0x345d08(),
          _0x76c71e(_0x3951e6),
          _0x3951e6['classList']['toggle']('is-open', _0x5a97bc),
          _0x16e455['setAttribute']('aria-expanded', String(_0x5a97bc)),
          _0x5a97bc && fitStoryParamPopoverToViewport(_0x3951e6));
        return;
      }
      const _0x34d3dc = _0x25006a['target']['closest']('[data-story-asset-preset-option]');
      if (_0x34d3dc) {
        _0x34d3dc['dataset']['storyAssetPresetKind'] === 'scene'
          ? (_0x109ee4['sceneAssetPromptPresetId'] = getStorySceneAssetPromptPreset(
              _0x34d3dc['dataset']['storyAssetPresetOption'],
            )['id'])
          : (_0x109ee4['assetPromptPresetId'] = getStoryCharacterAssetPromptPreset(
              _0x34d3dc['dataset']['storyAssetPresetOption'],
            )['id']);
        (_0x76c71e(), _0xb8a26b());
        return;
      }
      const _0x4ed67a = _0x25006a['target']['closest']('[data-story-aspect-ratio-option]');
      if (_0x4ed67a) {
        _0x1d7489(_0x4ed67a['dataset']['storyAspectRatioOption']);
        return;
      }
      const _0x48fb9d = _0x25006a['target']['closest']('[data-story-planning-option]');
      if (_0x48fb9d) {
        _0x39cd32(_0x48fb9d['dataset']['storyPlanningField'], _0x48fb9d['dataset']['storyPlanningOption']);
        return;
      }
      const _0x34748a = _0x25006a['target']['closest']('[data-story-style-option]');
      if (_0x34748a) {
        _0x1582f2(_0x34748a['dataset']['storyStyleOption']);
        return;
      }
      const _0x4541d4 = _0x25006a['target']['closest']('[data-story-style-category]');
      if (_0x4541d4) {
        const _0x1ef2c4 = _0x4541d4['closest']('.story-style-picker');
        (_0x1ef2c4?.['querySelectorAll']('[data-story-style-category]')['forEach']((_0x1ba69d) => {
          const _0x40418b = _0x1ba69d === _0x4541d4;
          (_0x1ba69d['classList']['toggle']('is-active', _0x40418b),
            _0x1ba69d['setAttribute']('aria-pressed', String(_0x40418b)));
        }),
          _0x4bd181(_0x1ef2c4));
        return;
      }
      const _0x25f168 = _0x25006a['target']['closest']('[data-story-style-custom]');
      if (_0x25f168) {
        _0x484853(_0x25f168['closest']('.story-style-picker'), !![]);
        return;
      }
      const _0x36958c = _0x25006a['target']['closest']('[data-story-style-custom-back]');
      if (_0x36958c) {
        _0x484853(_0x36958c['closest']('.story-style-picker'), ![]);
        return;
      }
      const _0x560e7c = _0x25006a['target']['closest']('[data-story-style-custom-confirm]');
      if (_0x560e7c) {
        _0x149b2f(
          _0x560e7c['closest']('.story-style-picker')?.['querySelector']('[data-story-style-custom-input]'),
        );
        return;
      }
      const _0x56b2e5 = _0x25006a['target']['closest']('[data-story-model-option]');
      if (_0x56b2e5) {
        _0x2e2d85(_0x56b2e5);
        return;
      }
      const _0x1a381c = _0x25006a['target']['closest']('[data-story-model-trigger]');
      if (_0x1a381c) {
        const _0x43159c = _0x1a381c['closest']('.story-model-picker'),
          _0x126c2e = !_0x43159c['classList']['contains']('is-open');
        (_0x76c71e(),
          _0x345d08(_0x43159c),
          _0x43159c['classList']['toggle']('is-open', _0x126c2e),
          _0x1a381c['setAttribute']('aria-expanded', String(_0x126c2e)));
        if (_0x126c2e) _0x43159c['querySelector']('[data-story-model-search-input]')?.['focus']();
        return;
      }
      const _0xe8215b = _0x25006a['target']['closest']('[data-story-home-tab]');
      if (_0xe8215b) {
        _0x4d9633(_0xe8215b['dataset']['storyHomeTab']);
        return;
      }
      const _0x3b9b3e = _0x25006a['target']['closest']('[data-story-step]');
      if (_0x3b9b3e) {
        _0x1f5594(_0x3b9b3e['dataset']['storyStep']);
        return;
      }
      if (_0x109ee4['assetLibraryDisclosure']?.['toggleFromTarget'](_0x25006a['target'])) return;
      const _0x20652c = _0x25006a['target']['closest']('[data-story-asset-filter]');
      if (_0x20652c) {
        const _0x2aa26e = normalizeText(_0x20652c['dataset']['storyAssetFilter']),
          _0x306859 = getStoryAssetTabTransitionDirection(_0x109ee4['assetFilter'], _0x2aa26e);
        if (_0x306859 === 'none') return;
        ((_0x109ee4['characterVoiceEditor'] = null),
          (_0x109ee4['characterVoicePanelMotion'] = ''),
          (_0x109ee4['pendingCharacterVoiceAssetId'] = ''),
          (_0x109ee4['assetFilter'] = _0x2aa26e),
          (_0x109ee4['selectedAssetId'] = ''),
          (_0x109ee4['pendingDeleteAssetAppearanceKey'] = ''),
          (_0x109ee4['assetSelectionMode'] = ![]),
          (_0x109ee4['selectedAssetIds'] = []));
        const _0x204feb = _0x54cd25()?.['querySelector']('.story-asset-tabs');
        _0x204feb &&
          _0x204feb['querySelectorAll']('[data-story-asset-filter]')['forEach']((_0x4888c8) => {
            const _0x119cdd = _0x4888c8['dataset']['storyAssetFilter'] === _0x2aa26e;
            (_0x4888c8['classList']['toggle']('is-active', _0x119cdd),
              _0x4888c8['setAttribute']('aria-selected', String(_0x119cdd)),
              (_0x4888c8['tabIndex'] = _0x119cdd ? 0x0 : -0x1));
          });
        (_0xb8a26b({ direction: _0x306859, updateToolbar: ![], transitionScope: 'asset-content' }),
          _0x487a78({ uiOnly: !![] }));
        return;
      }
      const _0x355029 = _0x25006a['target']['closest']('[data-story-episode-asset-tab]');
      if (_0x355029) {
        _0x109ee4['episodeAssetRailTab'] = normalizeStoryEpisodeAssetRailTab(
          _0x355029['dataset']['storyEpisodeAssetTab'],
        );
        if (!_0x1adf2f()) _0xb8a26b();
        _0x487a78({ uiOnly: !![] });
        return;
      }
      const _0x4327da = _0x25006a['target']['closest']('[data-story-asset-id]');
      if (_0x4327da) {
        const _0x58b58a = _0x4327da['dataset']['storyAssetId'],
          _0x322b44 = _0x109ee4['selectedAssetId'],
          _0x407f6c = _0x109ee4['selectedAssetId'] !== _0x58b58a;
        _0x407f6c &&
          (updateStoryAssetPromptFromEditor(
            _0x109ee4,
            _0x54cd25()?.['querySelector']?.('[data-story-asset-prompt][contenteditable="true"]'),
          ),
          _0x49f360(),
          (_0x109ee4['characterVoiceEditor'] = null),
          (_0x109ee4['characterVoicePanelMotion'] = ''),
          (_0x109ee4['pendingCharacterVoiceAssetId'] = ''),
          (_0x109ee4['pendingDeleteAssetAppearanceKey'] = ''));
        _0x109ee4['selectedAssetId'] = _0x58b58a;
        {
          const _0x13bb1c =
              _0x109ee4['assetFilter'] === 'library'
                ? getVisibleStoryAssets(_0x109ee4)['find']((_0x1e0f23) => _0x1e0f23['id'] === _0x58b58a)
                : null,
            _0x26ee6c =
              _0x109ee4['assetFilter'] !== 'library' ||
              Boolean(
                ['image', 'audio']['includes'](normalizeText(_0x13bb1c?.['mediaKind'])['toLowerCase']()) &&
                normalizeText(_0x13bb1c?.['sourceUrl'] || _0x13bb1c?.['imageUrl']),
              ),
            _0x2b5276 = resolveWorkspaceCardMultiSelection({
              selectedIds: _0x109ee4['selectedAssetIds'],
              itemId: _0x58b58a,
              activeItemId: _0x322b44,
              orderedIds:
                _0x109ee4['assetFilter'] === 'library'
                  ? getWorkspaceAssetLibrarySelectionOrder(
                      getVisibleStoryAssets(_0x109ee4)['filter'](
                        (_0x200f28) =>
                          ['image', 'audio']['includes'](
                            normalizeText(_0x200f28['mediaKind'])['toLowerCase'](),
                          ) && normalizeText(_0x200f28['sourceUrl'] || _0x200f28['imageUrl']),
                      ),
                      _0x109ee4['assetLibraryDisclosure'],
                    )
                  : getVisibleStoryAssets(_0x109ee4)['map']((_0x54f017) => _0x54f017['id']),
              toggleKey: _0x25006a['ctrlKey'] || _0x25006a['metaKey'],
              selectionMode: _0x109ee4['assetSelectionMode'],
              shiftKey: _0x25006a['shiftKey'] === !![],
              enabled: _0x26ee6c,
            });
          _0x2b5276['handled'] &&
            ((_0x109ee4['assetSelectionMode'] = _0x2b5276['selectionMode']),
            (_0x109ee4['selectedAssetIds'] = _0x2b5276['selectedIds']));
        }
        (_0xb8a26b(), _0x487a78({ uiOnly: !![] }), focusWorkspaceAssetCard(_0x2e97b0, _0x58b58a));
        return;
      }
      const _0x1ff4f7 = _0x25006a['target']['closest']('[data-story-select-episode]');
      if (
        _0x1ff4f7 &&
        !_0x25006a['target']['closest']('[data-story-action]') &&
        (_0x109ee4['episodeSelectionMode'] ||
          _0x25006a['shiftKey'] ||
          _0x25006a['ctrlKey'] ||
          _0x25006a['metaKey'])
      ) {
        const _0x9921f6 = _0x1ff4f7['dataset']['storySelectEpisode'];
        if (getStoryEpisodeGenerationControlState(_0x109ee4, _0x9921f6)['disabled']) return;
        const _0x2b24b8 = resolveWorkspaceCardMultiSelection({
          selectedIds: _0x109ee4['selectedEpisodeIds'],
          itemId: _0x9921f6,
          activeItemId: _0x109ee4['selectedEpisodeId'],
          selectionMode: _0x109ee4['episodeSelectionMode'],
          shiftKey: _0x25006a['shiftKey'] === !![],
          toggleKey: _0x25006a['ctrlKey'] || _0x25006a['metaKey'],
          orderedIds: getStoryVideoEpisodes(_0x109ee4['data']['episodes'])['map'](
            (_0x5a90bb) => _0x5a90bb['id'],
          ),
        });
        if (_0x2b24b8['handled']) {
          ((_0x109ee4['episodeSelectionMode'] = _0x2b24b8['selectionMode']),
            (_0x109ee4['selectedEpisodeIds'] = _0x2b24b8['selectedIds']));
          if (!_0x25006a['shiftKey']) _0x109ee4['selectedEpisodeId'] = _0x9921f6;
          (_0xb8a26b(),
            _0x2e97b0['querySelector']('[data-story-select-episode="' + CSS['escape'](_0x9921f6) + '\x22]')?.[
              'focus'
            ]());
        }
        return;
      }
      const _0x508903 = _0x25006a['target']['closest']('[data-story-open-episode]');
      if (_0x508903) {
        const _0x5a469f = _0x508903['dataset']['storyOpenEpisode'];
        if (getStoryEpisodeGenerationControlState(_0x109ee4, _0x5a469f)['disabled']) return;
        void _0x48fc72(_0x5a469f, '', _0x508903);
        return;
      }
      const _0x1796bb = _0x25006a['target']['closest']('[data-story-insert-after-clip-id]');
      if (_0x1796bb) {
        if (_0x109ee4['clipSelectionMode']) return;
        const _0x2c35a4 = getSelectedEpisode(_0x109ee4),
          _0x522fb9 = insertStoryEpisodeClip(_0x2c35a4, _0x1796bb['dataset']['storyInsertAfterClipId'], {
            promptMode:
              _0x2c35a4?.['promptMode'] || _0x109ee4['data']['project']?.['planning']?.['promptMode'],
          }),
          _0xbd7ad6 = _0x109ee4['data']['episodes']['findIndex'](
            (_0x25c264) => _0x25c264['id'] === _0x2c35a4?.['id'],
          );
        if (!_0x522fb9 || _0xbd7ad6 < 0x0) {
          _0x50d1ac('新增片段失败，请刷新后重试。', 'error');
          return;
        }
        ((_0x109ee4['data']['episodes'][_0xbd7ad6] = _0x522fb9['episode']),
          _0x216d6c({ close: !![] }),
          (_0x109ee4['selectedClipId'] = _0x522fb9['clip']['id']),
          (_0x109ee4['pendingDeleteClipId'] = ''),
          (_0x109ee4['selectedClipGenerationIds'] = []),
          _0x38bff8(_0x522fb9['clip']),
          _0x487a78({ immediate: !![] }),
          _0xb8a26b(),
          _0x50d1ac('已新增片段。', 'success'));
        return;
      }
      const _0x1ece85 = _0x25006a['target']['closest']('.story-clip-card[data-story-clip-id]');
      if (_0x1ece85) {
        const _0x53132c = _0x1ece85['dataset']['storyClipId'],
          _0x17a58c = resolveWorkspaceCardMultiSelection({
            selectedIds: _0x109ee4['selectedClipGenerationIds'],
            itemId: _0x53132c,
            activeItemId: _0x109ee4['selectedClipId'],
            selectionMode: _0x109ee4['clipSelectionMode'],
            shiftKey: _0x25006a['shiftKey'] === !![],
            toggleKey: _0x25006a['ctrlKey'] || _0x25006a['metaKey'],
            orderedIds: (getSelectedEpisode(_0x109ee4)?.['clips'] || [])['map'](
              (_0x4e15e8) => _0x4e15e8['id'],
            ),
          });
        _0x17a58c['handled'] &&
          ((_0x109ee4['pendingDeleteClipId'] = ''),
          (_0x109ee4['clipSelectionMode'] = _0x17a58c['selectionMode']),
          (_0x109ee4['selectedClipGenerationIds'] = _0x17a58c['selectedIds']),
          _0x457f02(),
          _0x3deaa5());
        if (!_0x25006a['shiftKey'] && !_0x25006a['ctrlKey'] && !_0x25006a['metaKey']) {
          const _0x4a97a5 = getSelectedEpisode(_0x109ee4),
            _0x4c2de6 = Array['isArray'](_0x4a97a5?.['clips']) ? _0x4a97a5['clips'] : [],
            _0x1d3969 = _0x4c2de6['findIndex'](
              (_0x44c636) => _0x44c636['id'] === _0x109ee4['selectedClipId'],
            ),
            _0x2e1d47 = _0x4c2de6['findIndex']((_0xe56956) => _0xe56956['id'] === _0x53132c),
            _0x99586 = _0x109ee4['selectedClipId'] !== _0x53132c,
            _0x542b7d = _0x2e1d47 >= 0x0 && _0x2e1d47 < _0x1d3969 ? 'previous' : 'next';
          _0x109ee4['pendingDeleteClipId'] = '';
          if (_0x99586) _0x216d6c({ close: !![] });
          ((_0x109ee4['selectedClipId'] = _0x53132c), _0x38bff8(getSelectedClip(_0x109ee4, _0x4a97a5)));
          if (_0x99586) {
            if (!_0x446fd0(_0x542b7d)) _0xb8a26b();
          } else _0x3deaa5();
          _0x487a78({ uiOnly: !![] });
        }
        _0x2e97b0['querySelector'](
          '.story-clip-card[data-story-clip-id="' + CSS['escape'](_0x53132c) + '\x22]',
        )?.['focus']({ preventScroll: !![] });
        return;
      }
      const _0x8245a4 = _0x25006a['target']['closest'](
        '[data-story-clip-prompt-surface]\x20.ref-thumb-delete',
      );
      if (_0x8245a4) {
        const _0x2bb8c0 = _0x8245a4['closest']('[data-slot]');
        if (!_0x2bb8c0) return;
        _0x552b94({ kind: _0x2bb8c0['dataset']['kind'], slotId: _0x2bb8c0['dataset']['slot'], value: null });
        return;
      }
      const _0x53a856 = _0x25006a['target']['closest'](
        '[data-story-clip-prompt-surface] .ref-upload-slot[data-slot]',
      );
      if (_0x53a856) {
        const _0xe10c88 = _0x53a856['dataset']['kind'],
          _0x32d7ff = _0xa88d71(_0x109ee4),
          _0x3de8c8 = getSelectedEpisode(_0x109ee4),
          _0x5d5016 = getSelectedClip(_0x109ee4, _0x3de8c8);
        ((_0x109ee4['pendingClipInput'] = { kind: _0xe10c88, slotId: _0x53a856['dataset']['slot'] }),
          (_0x58790f = {
            ..._0x109ee4['pendingClipInput'],
            projectToken: _0x32d7ff,
            episodeId: _0x3de8c8?.['id'],
            clipId: _0x5d5016?.['id'],
          }),
          (_0x10678e['accept'] =
            _0xe10c88 === 'image' ? 'image/*' : _0xe10c88 === 'audio' ? 'audio/*' : 'video/*'),
          _0x10678e['click']());
        return;
      }
      const _0x22c763 = _0x25006a['target']['closest'](
        '[data-story-clip-prompt-surface]\x20.prompt-attachment-btn',
      );
      if (_0x22c763) {
        const _0x243f3f = getSelectedEpisode(_0x109ee4),
          _0x1c75c3 = getSelectedClip(_0x109ee4, _0x243f3f),
          _0x59dbb7 = buildStoryClipInputSlotViewModel({
            modelId: _0x109ee4['models']['video'],
            provider: _0x109ee4['videoProvider'],
            inputs: _0x1c75c3?.['inputs'],
          }),
          _0x5d7999 = _0x59dbb7['groups']
            ['filter']((_0x2cd8e7) => _0x2cd8e7['slots']['some']((_0x45116f) => !_0x45116f['input']?.['url']))
            ['map']((_0xed66d2) => _0xed66d2['kind']);
        if (!_0x5d7999['length']) {
          _0x50d1ac('当前视频模型的入参槽已满。', 'warn');
          return;
        }
        const _0x1ce057 = _0xa88d71(_0x109ee4);
        ((_0x109ee4['pendingClipInput'] = { kind: '', slotId: '' }),
          (_0x58790f = {
            ..._0x109ee4['pendingClipInput'],
            projectToken: _0x1ce057,
            episodeId: _0x243f3f?.['id'],
            clipId: _0x1c75c3?.['id'],
          }),
          (_0x10678e['accept'] = _0x5d7999['map']((_0x5ad475) => _0x5ad475 + '/*')['join'](',')),
          _0x10678e['click']());
        return;
      }
      const _0x3ba749 = _0x25006a['target']['closest']('[data-story-script-mode]');
      if (_0x3ba749) {
        _0x1df320(getNextStoryScriptMode(_0x109ee4['scriptMode']));
        return;
      }
      const _0x19175e = _0x25006a['target']['closest']('[data-story-asset-batch-mode]');
      if (_0x19175e) {
        (_0x403c84(), void _0x5af5f7(_0x19175e['dataset']['storyAssetBatchMode']));
        return;
      }
      const _0x1dee37 = _0x25006a['target']['closest']('[data-story-library-target-asset-id]');
      if (_0x1dee37) {
        _0x412ed9(
          _0x1dee37['dataset']['storyLibraryTargetAssetId'],
          _0x1dee37['dataset']['storyLibraryTargetAppearanceId'],
          _0x1dee37['dataset']['storyLibraryTargetCreateAppearance'] === 'true',
        );
        return;
      }
      const _0x5a11ab = _0x25006a['target']['closest']('[data-story-library-appearance-target]');
      if (_0x5a11ab) {
        _0x19d9e0(_0x5a11ab);
        return;
      }
      const _0x3a42ad = _0x25006a['target']['closest']('[data-story-library-target-kind]');
      if (_0x3a42ad) {
        _0x5db0ce(_0x3a42ad);
        return;
      }
      const _0x5a1871 = _0x25006a['target']['closest']('[data-story-character-voice-history-play]');
      if (_0x5a1871) {
        void _0x5d34a2(
          _0x109ee4['characterVoiceEditor']?.['assetId'],
          _0x5a1871['dataset']['storyCharacterVoiceHistoryPlay'],
        );
        return;
      }
      const _0x323edf = _0x25006a['target']['closest']('[data-story-character-voice-history-restore]');
      if (_0x323edf) {
        _0x214885(
          _0x109ee4['characterVoiceEditor']?.['assetId'],
          _0x323edf['dataset']['storyCharacterVoiceHistoryRestore'],
        );
        return;
      }
      const _0xc8aea = _0x25006a['target']['closest']('[data-story-open-project]');
      if (_0xc8aea && !_0x25006a['target']['closest']('[data-story-action]')) {
        if (_0x25006a['target']['closest']('[data-story-project-title]')) return;
        _0x3bfffe(_0xc8aea['dataset']['storyOpenProject']);
        return;
      }
      const _0x145f02 = _0x25006a['target']['closest']('[data-story-action]'),
        _0x4078b4 = _0x145f02?.['dataset']['storyAction'];
      if (!_0x4078b4) return;
      const _0x503fbb = _0x167ce5['getRevision']();
      [
        'request-inline-regeneration',
        'confirm-inline-regeneration',
        'cancel-inline-regeneration',
        'request-delete-asset-appearance',
        'confirm-delete-asset-appearance',
        'cancel-delete-asset-appearance',
      ]['includes'](_0x4078b4) && (_0x25006a['preventDefault'](), _0x25006a['stopPropagation']());
      if (
        _0x4078b4 === 'select-all-novel-chapters' ||
        _0x4078b4 === 'clear-novel-chapters' ||
        _0x4078b4 === 'set-novel-episode-count' ||
        _0x4078b4 === 'toggle-novel-chapter' ||
        _0x4078b4 === 'start-novel-conversion'
      ) {
        const _0x4c0a1e = Array['isArray'](_0x109ee4['novelChapters'])
            ? _0x109ee4['novelChapters']
            : [],
          _0x2b7d90 = _0x4c0a1e['filter']((_0x3d8f2a) => _0x3d8f2a['adaptation'] !== 'done'),
          _0x1e0e5c = Array['isArray'](_0x109ee4['novelSelectedChapterIds'])
            ? _0x109ee4['novelSelectedChapterIds']['slice']()
            : [];
        if (_0x4078b4 === 'select-all-novel-chapters')
          _0x109ee4['novelSelectedChapterIds'] = _0x2b7d90['map']((_0x3d8f2a) => _0x3d8f2a['id']);
        else if (_0x4078b4 === 'clear-novel-chapters')
          _0x109ee4['novelSelectedChapterIds'] = [];
        else if (_0x4078b4 === 'toggle-novel-chapter') {
          const _0x19c2b3 = normalizeText(_0x145f02['dataset']['storyNovelChapter']),
            _0x50e0a6 = _0x1e0e5c['indexOf'](_0x19c2b3);
          (_0x50e0a6 >= 0x0 ? _0x1e0e5c['splice'](_0x50e0a6, 0x1) : _0x1e0e5c['push'](_0x19c2b3),
            (_0x109ee4['novelSelectedChapterIds'] = _0x1e0e5c));
        } else if (_0x4078b4 === 'set-novel-episode-count')
          _0x109ee4['novelEpisodeCount'] = Math['max'](
            0x1,
            Math['trunc'](
              Number(
                _0x2e97b0['querySelector']('[data-story-novel-episode-count]')?.['value'],
              ) || 0x1,
            ),
          );
        else {
          const _0x32d1f5 = Number(
            _0x2e97b0['querySelector']('[data-story-novel-episode-count]')?.['value'],
          );
          (Number['isFinite'](_0x32d1f5) &&
            _0x32d1f5 > 0x0 &&
            (_0x109ee4['novelEpisodeCount'] = Math['trunc'](_0x32d1f5)),
            _0x50d1ac(
              '批次转换尚未接通（下一步实现逐集生成）。本次已选 ' +
                _0x1e0e5c['length'] +
                ' 章、计划 ' +
                _0x109ee4['novelEpisodeCount'] +
                ' 集。',
              'info',
            ));
        }
        _0xb8a26b();
      }
      if (_0x4078b4 === 'toggle-clip-adjustment') {
        ((_0x109ee4['clipAdjustmentOpen'] = !_0x109ee4['clipAdjustmentOpen']),
          (_0x109ee4['clipAdjustmentPromptModeOpen'] = ![]),
          (_0x109ee4['clipAdjustmentLanguageOpen'] = ![]),
          (_0x109ee4['clipAdjustmentLanguage'] = ''),
          (_0x109ee4['clipPromptHistoryOpen'] = ![]),
          _0x2298ed());
        if (_0x109ee4['clipAdjustmentOpen']) {
          const _0xfbc01e = getSelectedEpisode(_0x109ee4),
            _0x41e684 = getSelectedClip(_0x109ee4, _0xfbc01e);
          _0x109ee4['clipAdjustmentPromptMode'] = '';
        }
        (_0x5be567(),
          _0x109ee4['clipAdjustmentOpen'] &&
            _0x2e97b0['querySelector']('[data-story-clip-adjustment-instruction]')?.['focus']());
      } else {
        if (_0x4078b4 === 'toggle-clip-prompt-history') {
          _0x109ee4['clipPromptHistoryOpen'] = !_0x109ee4['clipPromptHistoryOpen'];
          const _0x4a0090 = _0x109ee4['clipAdjustmentOpen'] === !![];
          ((_0x109ee4['clipAdjustmentOpen'] = ![]), (_0x109ee4['clipAdjustmentPromptModeOpen'] = ![]));
          if (_0x4a0090) _0x5be567();
          _0x2298ed({ focus: _0x109ee4['clipPromptHistoryOpen'] ? 'first' : 'trigger' });
        } else {
          if (_0x4078b4 === 'restore-clip-prompt-history')
            _0x32d5e0(_0x145f02['dataset']['storyClipPromptHistoryId']);
          else {
            if (_0x4078b4 === 'toggle-clip-adjustment-mode') {
              const _0x3608e3 =
                  _0x145f02['closest']('[data-story-adjustment-kind]')?.['dataset']['storyAdjustmentKind'] ||
                  'mode',
                _0x42b3e1 =
                  _0x3608e3 === 'language' ? 'clipAdjustmentLanguageOpen' : 'clipAdjustmentPromptModeOpen';
              ((_0x109ee4[_0x42b3e1] = !_0x109ee4[_0x42b3e1]),
                (_0x109ee4[
                  _0x3608e3 === 'language' ? 'clipAdjustmentPromptModeOpen' : 'clipAdjustmentLanguageOpen'
                ] = ![]),
                _0x3adde1({ kind: _0x3608e3 === 'language' ? 'mode' : 'language' }),
                _0x3adde1({ kind: _0x3608e3, focus: _0x109ee4[_0x42b3e1] ? 'selected' : 'trigger' }));
            } else {
              if (_0x4078b4 === 'select-clip-adjustment-mode') {
                const _0x8011f2 =
                  _0x145f02['closest']('[data-story-adjustment-kind]')?.['dataset']['storyAdjustmentKind'] ||
                  'mode';
                ((_0x109ee4[
                  _0x8011f2 === 'language' ? 'clipAdjustmentLanguage' : 'clipAdjustmentPromptMode'
                ] =
                  _0x8011f2 === 'language'
                    ? normalizeStoryPromptLanguage(_0x145f02['dataset']['storyClipAdjustmentModeOption'])
                    : normalizeStoryPromptMode(_0x145f02['dataset']['storyClipAdjustmentModeOption'], {
                        allowDeveloperModes: !![],
                      })),
                  (_0x109ee4['clipAdjustmentPromptModeOpen'] = ![]),
                  (_0x109ee4['clipAdjustmentLanguageOpen'] = ![]),
                  _0x3adde1({ kind: _0x8011f2, focus: 'instruction', updateSelection: !![] }));
              } else {
                if (_0x4078b4 === 'generate-clip-adjustment') void _0x46422f();
                else {
                  if (_0x4078b4 === 'regenerate-clip-adjustment') _0x4d9f47();
                  else {
                    if (_0x4078b4 === 'use-ai-clip-prompt') _0x5354b3();
                    else {
                      if (_0x4078b4 === 'keep-current-clip-prompt') _0x1052be();
                      else {
                        if (
                          _0x4078b4 === 'choose-script' ||
                          _0x4078b4 === 'choose-rewrite-script' ||
                          _0x4078b4 === 'choose-novel'
                        )
                          ((_0x109ee4['scriptIntent'] =
                            _0x4078b4 === 'choose-novel' ? 'novel' : 'script'),
                            _0xb8a26b(),
                            _0x52dd70?.['click']());
                        else {
                          if (_0x4078b4 === 'remove-rewrite-script')
                            (clearStoryHomeReferenceScript(_0x109ee4),
                              _0x487a78({ immediate: !![] }),
                              _0xb8a26b(),
                              _0x2e97b0['querySelector']('[data-story-idea-input]')?.['focus']());
                          else {
                            if (_0x4078b4 === 'choose-replication-videos')
                              ((_0x5836f9 = ''), _0x46be0a?.['click']());
                            else {
                              if (_0x4078b4 === 'reupload-replication-video') {
                                const _0xd6489c = normalizeText(
                                    _0x145f02['dataset']['storyReplicationEpisodeId'],
                                  ),
                                  _0x3ff6ef = findStoryReplicationEpisode(_0x109ee4['data'], _0xd6489c),
                                  _0x5ec1ad = normalizeText(_0x109ee4['data']?.['project']?.['id']);
                                _0x3ff6ef &&
                                  _0x109ee4['data']?.['project']?.['sourceMode'] === 'video-replication' &&
                                  _0x3ff6ef['replication']?.['status'] === 'failed' &&
                                  !normalizeText(_0x3ff6ef['sourceVideo']?.['videoRef']) &&
                                  (_0x36feea['has'](_0x5ec1ad)
                                    ? _0x50d1ac('请等待当前视频解析完成后再重新上传。', 'info')
                                    : ((_0x5836f9 = _0xd6489c), _0x46be0a?.['click']()));
                              } else {
                                if (_0x4078b4 === 'remove-replication-video') {
                                  const _0xb287b = Math['trunc'](
                                    Number(_0x145f02['dataset']['storyReplicationFileIndex']),
                                  );
                                  if (
                                    _0xb287b >= 0x0 &&
                                    _0xb287b < _0x109ee4['replicationSourceFiles']['length']
                                  ) {
                                    (_0x38253d(_0x109ee4['replicationSourcePreviewUrls'][_0xb287b]),
                                      (_0x109ee4['replicationSourceFiles'] = _0x109ee4[
                                        'replicationSourceFiles'
                                      ]['filter']((_0xacb8ee, _0x32dc44) => _0x32dc44 !== _0xb287b)),
                                      (_0x109ee4['replicationSourcePreviewUrls'] = _0x109ee4[
                                        'replicationSourcePreviewUrls'
                                      ]['filter']((_0x299a1c, _0x24d122) => _0x24d122 !== _0xb287b)));
                                    const _0x2ac25b = _0x44835e['querySelector'](
                                      '.story-page.is-current\x20.story-home-composer-body',
                                    );
                                    if (_0x2ac25b) syncStoryReplicationHomeSources(_0x2ac25b, _0x109ee4);
                                    _0x320ec9();
                                  }
                                } else {
                                  if (_0x4078b4 === 'paste-script')
                                    ((_0x109ee4['uploadInputMode'] = 'paste'),
                                      (_0x109ee4['scriptFileName'] = normalizeText(_0x109ee4['scriptText'])
                                        ? '粘贴文本'
                                        : ''),
                                      _0xb8a26b(),
                                      _0x2e97b0['querySelector']('[data-story-paste-input]')?.['focus']());
                                  else {
                                    if (
                                      _0x4078b4 === 'debug-story-summary' ||
                                      _0x4078b4 === 'debug-story-home'
                                    ) {
                                      if (windowObject?.['DEV_MODE'] !== !![]) return;
                                      openDebugRequestWindow({
                                        documentObject: documentObject,
                                        windowObject: windowObject,
                                        title: '剧本摘要请求调试',
                                        prepare: async () => {
                                          const _0x1d80f5 = await captureStoryRequestPayload((_0x59dc43) =>
                                            _0xf38233['preview']({
                                              home: _0x4078b4 === 'debug-story-home',
                                              captureRequest: _0x59dc43,
                                            }),
                                          );
                                          return {
                                            tabs: buildStoryRequestDebugPreviewModel(_0x1d80f5)['tabs'],
                                          };
                                        },
                                      });
                                      return;
                                    } else {
                                      if (_0x4078b4 === 'generate-story') _0xc512da();
                                      else {
                                        if (_0x4078b4 === 'preview-replication-video') {
                                          const _0x35ee5c = findStoryReplicationEpisode(
                                              _0x109ee4['data'],
                                              _0x145f02['dataset']['storyReplicationEpisodeId'],
                                            ),
                                            _0x42bfd0 = normalizeText(
                                              _0x35ee5c?.['sourceVideo']?.['videoRef'],
                                            );
                                          _0x42bfd0 &&
                                            openVideoPreview(_0x42bfd0, {
                                              ariaLabel:
                                                (normalizeText(_0x35ee5c?.['title']) || '原视频') + '预览',
                                              loop: ![],
                                            });
                                        } else {
                                          if (_0x4078b4 === 'retry-replication-analysis') void _0x2e9061();
                                          else {
                                            if (_0x4078b4 === 'localize-replication-assets')
                                              void _0x9b50ec({ advance: !![] });
                                            else {
                                              if (_0x4078b4 === 'request-inline-regeneration') {
                                                if (
                                                  _0x109ee4['storyPlanningOperation'] ||
                                                  _0x109ee4['isGeneratingStory']
                                                )
                                                  return;
                                                const _0x186831 = normalizeText(
                                                  _0x145f02['dataset']['storyRegenerationTarget'],
                                                );
                                                if (
                                                  _0x109ee4['data']?.['project']?.['outlineStatus'] ===
                                                    'stale' &&
                                                  _0x186831['startsWith']('episode-script:')
                                                ) {
                                                  _0x50d1ac('故事蓝图已修改，请先重新运行分集规划。', 'warn');
                                                  return;
                                                }
                                                ((_0x109ee4['pendingRegenerationTarget'] = _0x186831),
                                                  _0xb8a26b());
                                              } else {
                                                if (_0x4078b4 === 'cancel-inline-regeneration')
                                                  ((_0x109ee4['pendingRegenerationTarget'] = ''),
                                                    _0xb8a26b());
                                                else {
                                                  if (_0x4078b4 === 'confirm-inline-regeneration') {
                                                    const _0x4741ea = normalizeText(
                                                      _0x145f02['dataset']['storyRegenerationTarget'],
                                                    );
                                                    if (
                                                      !_0x4741ea ||
                                                      _0x4741ea !== _0x109ee4['pendingRegenerationTarget']
                                                    )
                                                      return;
                                                    _0x109ee4['pendingRegenerationTarget'] = '';
                                                    if (_0x4741ea === 'summary') void _0x4a497b();
                                                    else {
                                                      if (_0x4741ea === 'episode-outlines')
                                                        void _0x1a9c0a({
                                                          advance: ![],
                                                          confirmRegeneration: ![],
                                                        });
                                                      else
                                                        _0x4741ea['startsWith']('episode-script:') &&
                                                          void _0x3d170(
                                                            _0x145f02['dataset']['storyEpisodeId'],
                                                          );
                                                    }
                                                  } else {
                                                    if (_0x4078b4 === 'debug-episode-outline-request') {
                                                      if (
                                                        !isStoryEpisodeExperimentalSplitAvailable(
                                                          windowObject,
                                                        )
                                                      )
                                                        return;
                                                      void _0x5cf2f6();
                                                    } else {
                                                      if (_0x4078b4 === 'debug-episode-script-request') {
                                                        if (
                                                          !isStoryEpisodeExperimentalSplitAvailable(
                                                            windowObject,
                                                          )
                                                        )
                                                          return;
                                                        void _0x542653();
                                                      } else {
                                                        if (_0x4078b4 === 'debug-asset-extraction-request') {
                                                          if (windowObject?.['DEV_MODE'] !== !![]) return;
                                                          openStoryRequestDebugPreview({
                                                            documentObject: documentObject,
                                                            windowObject: windowObject,
                                                            title: '素材提取请求调试',
                                                            preparePayload: () =>
                                                              captureStoryRequestPayload((_0x22d4df) =>
                                                                _0x10b8ea['preview'](_0x22d4df),
                                                              ),
                                                            subtitle:
                                                              '预览当前提取链路的首个请求，不运行本地模型或发送 API。',
                                                          });
                                                          return;
                                                        } else {
                                                          if (
                                                            _0x4078b4 ===
                                                            'debug-asset-extraction-experimental-request'
                                                          ) {
                                                            if (
                                                              !isStoryAssetExperimentalExtractionAvailable(
                                                                windowObject,
                                                              )
                                                            )
                                                              return;
                                                            void _0x4c05d5();
                                                          } else {
                                                            if (_0x4078b4 === 'plan-episode-outlines')
                                                              void _0x1a9c0a({
                                                                advance: ![],
                                                                confirmRegeneration: !![],
                                                              });
                                                            else {
                                                              if (_0x4078b4 === 'generate-episode-script')
                                                                void _0x52980b(
                                                                  _0x145f02['dataset']['storyEpisodeId'],
                                                                );
                                                              else {
                                                                if (
                                                                  _0x4078b4 === 'generate-next-episode-script'
                                                                ) {
                                                                  const _0x70fe4 =
                                                                      getNextStoryEpisodeScriptIndex(
                                                                        _0x109ee4['data']['episodes'],
                                                                      ),
                                                                    _0x46e523 =
                                                                      _0x109ee4['data']['episodes'][_0x70fe4];
                                                                  if (_0x46e523)
                                                                    void _0x52980b(_0x46e523['id']);
                                                                } else {
                                                                  if (_0x4078b4 === 'continue-to-assets')
                                                                    void _0x20f7f2();
                                                                  else {
                                                                    if (
                                                                      _0x4078b4 ===
                                                                      'generate-episode-scripts-batch'
                                                                    )
                                                                      void _0x2d58d3({
                                                                        selectedOnly:
                                                                          _0x145f02['dataset'][
                                                                            'storyScriptBatchScope'
                                                                          ] === 'selected',
                                                                      });
                                                                    else {
                                                                      if (
                                                                        _0x4078b4 ===
                                                                        'cancel-episode-scripts-batch'
                                                                      )
                                                                        _0x1e6791();
                                                                      else {
                                                                        if (
                                                                          _0x4078b4 ===
                                                                          'cancel-script-selection'
                                                                        )
                                                                          ((_0x109ee4['scriptSelectionMode'] =
                                                                            ![]),
                                                                            (_0x109ee4[
                                                                              'selectedScriptEpisodeIds'
                                                                            ] = []),
                                                                            _0xb8a26b());
                                                                        else {
                                                                          if (
                                                                            _0x4078b4 ===
                                                                            'select-all-script-episodes'
                                                                          ) {
                                                                            const _0x1249db =
                                                                              getStoryEpisodeScriptBatchTargets(
                                                                                _0x109ee4['data']['episodes'],
                                                                                [],
                                                                              )['map'](
                                                                                (_0x5c60b8) =>
                                                                                  _0x5c60b8['id'],
                                                                              );
                                                                            ((_0x109ee4[
                                                                              'selectedScriptEpisodeIds'
                                                                            ] = _0x1249db['every'](
                                                                              (_0x3ff498) =>
                                                                                _0x109ee4[
                                                                                  'selectedScriptEpisodeIds'
                                                                                ]['includes'](_0x3ff498),
                                                                            )
                                                                              ? []
                                                                              : _0x1249db),
                                                                              (_0x109ee4[
                                                                                'scriptSelectionMode'
                                                                              ] =
                                                                                _0x109ee4[
                                                                                  'selectedScriptEpisodeIds'
                                                                                ]['length'] > 0x0),
                                                                              _0xb8a26b(),
                                                                              _0x2e97b0['querySelector'](
                                                                                '[data-story-action="select-all-script-episodes"]',
                                                                              )?.['focus']());
                                                                          } else {
                                                                            if (
                                                                              _0x4078b4 ===
                                                                              'select-script-episode'
                                                                            )
                                                                              (_0x25006a['preventDefault'](),
                                                                                _0x19fcb7(
                                                                                  _0x145f02['dataset'][
                                                                                    'storyEpisodeId'
                                                                                  ],
                                                                                ));
                                                                            else {
                                                                              if (
                                                                                _0x4078b4 ===
                                                                                'toggle-project-sort-menu'
                                                                              ) {
                                                                                (_0x25006a[
                                                                                  'preventDefault'
                                                                                ](),
                                                                                  _0x25006a[
                                                                                    'stopPropagation'
                                                                                  ]());
                                                                                const _0x5bdcdd = _0x145f02[
                                                                                    'closest'
                                                                                  ](
                                                                                    '[data-story-project-sort-wrap]',
                                                                                  ),
                                                                                  _0xfe239c =
                                                                                    !_0x5bdcdd?.['classList'][
                                                                                      'contains'
                                                                                    ]('is-open');
                                                                                (_0x1ac9be(''), _0x76c71e());
                                                                                if (_0xfe239c)
                                                                                  _0x1dab2d(
                                                                                    _0x5bdcdd,
                                                                                    _0x145f02,
                                                                                  );
                                                                                else _0x475004();
                                                                              } else {
                                                                                if (
                                                                                  _0x4078b4 ===
                                                                                  'select-project-sort'
                                                                                )
                                                                                  (_0x25006a[
                                                                                    'preventDefault'
                                                                                  ](),
                                                                                    _0x25006a[
                                                                                      'stopPropagation'
                                                                                    ](),
                                                                                    (_0x109ee4[
                                                                                      'projectSortOrder'
                                                                                    ] =
                                                                                      normalizeStoryProjectSortOrder(
                                                                                        _0x145f02['dataset'][
                                                                                          'storyProjectSortOption'
                                                                                        ],
                                                                                      )),
                                                                                    _0x1ac9be(''),
                                                                                    _0x475004(),
                                                                                    _0xb8a26b({
                                                                                      capturePageState: ![],
                                                                                    }));
                                                                                else {
                                                                                  if (
                                                                                    _0x4078b4 ===
                                                                                    'toggle-project-menu'
                                                                                  ) {
                                                                                    (_0x25006a[
                                                                                      'preventDefault'
                                                                                    ](),
                                                                                      _0x25006a[
                                                                                        'stopPropagation'
                                                                                      ]());
                                                                                    const _0x35c235 =
                                                                                      normalizeText(
                                                                                        _0x145f02['dataset'][
                                                                                          'storyProjectId'
                                                                                        ],
                                                                                      );
                                                                                    _0x109ee4[
                                                                                      'pendingDeleteProjectId'
                                                                                    ] = '';
                                                                                    const _0x116af4 =
                                                                                      _0x109ee4[
                                                                                        'openProjectMenuId'
                                                                                      ] !== _0x35c235;
                                                                                    (_0x475004(),
                                                                                      _0x1ac9be(
                                                                                        _0x116af4
                                                                                          ? _0x35c235
                                                                                          : '',
                                                                                      ));
                                                                                  } else {
                                                                                    if (
                                                                                      _0x4078b4 ===
                                                                                      'rename-project'
                                                                                    ) {
                                                                                      const _0x144ec1 =
                                                                                        normalizeText(
                                                                                          _0x145f02[
                                                                                            'dataset'
                                                                                          ]['storyProjectId'],
                                                                                        );
                                                                                      ((_0x109ee4[
                                                                                        'openProjectMenuId'
                                                                                      ] = ''),
                                                                                        _0xb8a26b(),
                                                                                        _0x2c612e(_0x144ec1));
                                                                                    } else {
                                                                                      if (
                                                                                        _0x4078b4 ===
                                                                                        'duplicate-project'
                                                                                      )
                                                                                        _0x460c74(
                                                                                          _0x145f02[
                                                                                            'dataset'
                                                                                          ]['storyProjectId'],
                                                                                        );
                                                                                      else {
                                                                                        if (
                                                                                          _0x4078b4 ===
                                                                                          'collect-project'
                                                                                        )
                                                                                          void _0x1744eb(
                                                                                            _0x145f02[
                                                                                              'dataset'
                                                                                            ][
                                                                                              'storyProjectId'
                                                                                            ],
                                                                                          );
                                                                                        else {
                                                                                          if (
                                                                                            _0x4078b4 ===
                                                                                            'import-project'
                                                                                          )
                                                                                            void _0x253c02();
                                                                                          else {
                                                                                            if (
                                                                                              _0x4078b4 ===
                                                                                              'archive-project'
                                                                                            )
                                                                                              _0xdd700d(
                                                                                                _0x145f02[
                                                                                                  'dataset'
                                                                                                ][
                                                                                                  'storyProjectId'
                                                                                                ],
                                                                                                !![],
                                                                                              );
                                                                                            else {
                                                                                              if (
                                                                                                _0x4078b4 ===
                                                                                                'unarchive-project'
                                                                                              )
                                                                                                _0xdd700d(
                                                                                                  _0x145f02[
                                                                                                    'dataset'
                                                                                                  ][
                                                                                                    'storyProjectId'
                                                                                                  ],
                                                                                                  ![],
                                                                                                );
                                                                                              else {
                                                                                                if (
                                                                                                  _0x4078b4 ===
                                                                                                  'toggle-archived-projects'
                                                                                                )
                                                                                                  ((_0x109ee4[
                                                                                                    'showArchivedProjects'
                                                                                                  ] =
                                                                                                    !_0x109ee4[
                                                                                                      'showArchivedProjects'
                                                                                                    ]),
                                                                                                    (_0x109ee4[
                                                                                                      'openProjectMenuId'
                                                                                                    ] = ''),
                                                                                                    (_0x109ee4[
                                                                                                      'pendingDeleteProjectId'
                                                                                                    ] = ''),
                                                                                                    _0xb8a26b());
                                                                                                else {
                                                                                                  if (
                                                                                                    _0x4078b4 ===
                                                                                                    'request-delete-project'
                                                                                                  )
                                                                                                    ((_0x109ee4[
                                                                                                      'openProjectMenuId'
                                                                                                    ] = ''),
                                                                                                      (_0x109ee4[
                                                                                                        'pendingDeleteProjectId'
                                                                                                      ] =
                                                                                                        normalizeText(
                                                                                                          _0x145f02[
                                                                                                            'dataset'
                                                                                                          ][
                                                                                                            'storyProjectId'
                                                                                                          ],
                                                                                                        )),
                                                                                                      _0xb8a26b());
                                                                                                  else {
                                                                                                    if (
                                                                                                      _0x4078b4 ===
                                                                                                      'cancel-delete-project'
                                                                                                    )
                                                                                                      ((_0x109ee4[
                                                                                                        'pendingDeleteProjectId'
                                                                                                      ] = ''),
                                                                                                        _0xb8a26b());
                                                                                                    else {
                                                                                                      if (
                                                                                                        _0x4078b4 ===
                                                                                                        'confirm-delete-project'
                                                                                                      )
                                                                                                        _0x3389fe(
                                                                                                          _0x145f02[
                                                                                                            'dataset'
                                                                                                          ][
                                                                                                            'storyProjectId'
                                                                                                          ],
                                                                                                        );
                                                                                                      else {
                                                                                                        if (
                                                                                                          _0x4078b4 ===
                                                                                                          'delete-clip-frame'
                                                                                                        )
                                                                                                          (_0x25006a[
                                                                                                            'preventDefault'
                                                                                                          ](),
                                                                                                            _0x25006a[
                                                                                                              'stopPropagation'
                                                                                                            ](),
                                                                                                            void _0x24c314(
                                                                                                              _0x145f02[
                                                                                                                'dataset'
                                                                                                              ][
                                                                                                                'storyClipFrameId'
                                                                                                              ],
                                                                                                            ));
                                                                                                        else {
                                                                                                          if (
                                                                                                            _0x4078b4 ===
                                                                                                            'request-delete-clip'
                                                                                                          ) {
                                                                                                            if (
                                                                                                              _0x109ee4[
                                                                                                                'clipSelectionMode'
                                                                                                              ]
                                                                                                            )
                                                                                                              return;
                                                                                                            if (
                                                                                                              storyClipProduction[
                                                                                                                'getGenerationState'
                                                                                                              ](
                                                                                                                _0x109ee4,
                                                                                                                getSelectedEpisode(
                                                                                                                  _0x109ee4,
                                                                                                                ),
                                                                                                              )[
                                                                                                                'busy'
                                                                                                              ]
                                                                                                            ) {
                                                                                                              _0x50d1ac(
                                                                                                                '请等待当前视频生成任务完成。',
                                                                                                                'info',
                                                                                                              );
                                                                                                              return;
                                                                                                            }
                                                                                                            ((_0x109ee4[
                                                                                                              'pendingDeleteClipId'
                                                                                                            ] =
                                                                                                              normalizeText(
                                                                                                                _0x145f02[
                                                                                                                  'dataset'
                                                                                                                ][
                                                                                                                  'storyClipDeleteId'
                                                                                                                ],
                                                                                                              )),
                                                                                                              _0xb8a26b());
                                                                                                          } else {
                                                                                                            if (
                                                                                                              _0x4078b4 ===
                                                                                                              'cancel-delete-clip'
                                                                                                            )
                                                                                                              ((_0x109ee4[
                                                                                                                'pendingDeleteClipId'
                                                                                                              ] =
                                                                                                                ''),
                                                                                                                _0xb8a26b());
                                                                                                            else {
                                                                                                              if (
                                                                                                                _0x4078b4 ===
                                                                                                                'confirm-delete-clip'
                                                                                                              ) {
                                                                                                                if (
                                                                                                                  storyClipProduction[
                                                                                                                    'getGenerationState'
                                                                                                                  ](
                                                                                                                    _0x109ee4,
                                                                                                                    getSelectedEpisode(
                                                                                                                      _0x109ee4,
                                                                                                                    ),
                                                                                                                  )[
                                                                                                                    'busy'
                                                                                                                  ]
                                                                                                                ) {
                                                                                                                  ((_0x109ee4[
                                                                                                                    'pendingDeleteClipId'
                                                                                                                  ] =
                                                                                                                    ''),
                                                                                                                    _0xb8a26b(),
                                                                                                                    _0x50d1ac(
                                                                                                                      '请等待当前视频生成任务完成。',
                                                                                                                      'info',
                                                                                                                    ));
                                                                                                                  return;
                                                                                                                }
                                                                                                                _0x3f72c0(
                                                                                                                  _0x145f02[
                                                                                                                    'dataset'
                                                                                                                  ][
                                                                                                                    'storyClipDeleteId'
                                                                                                                  ],
                                                                                                                );
                                                                                                              } else {
                                                                                                                if (
                                                                                                                  _0x4078b4 ===
                                                                                                                  'extract-assets'
                                                                                                                )
                                                                                                                  void _0x9b50ec(
                                                                                                                    {
                                                                                                                      advance:
                                                                                                                        !![],
                                                                                                                    },
                                                                                                                  );
                                                                                                                else {
                                                                                                                  if (
                                                                                                                    _0x4078b4 ===
                                                                                                                    'extract-assets-experimental'
                                                                                                                  ) {
                                                                                                                    if (
                                                                                                                      !isStoryAssetExperimentalExtractionAvailable(
                                                                                                                        windowObject,
                                                                                                                      )
                                                                                                                    )
                                                                                                                      return;
                                                                                                                    void _0x9b50ec(
                                                                                                                      {
                                                                                                                        advance:
                                                                                                                          !![],
                                                                                                                        experimental:
                                                                                                                          !![],
                                                                                                                      },
                                                                                                                    );
                                                                                                                  } else {
                                                                                                                    if (
                                                                                                                      _0x4078b4 ===
                                                                                                                      'plan-episodes'
                                                                                                                    )
                                                                                                                      void _0x1a9c0a(
                                                                                                                        {
                                                                                                                          advance:
                                                                                                                            !![],
                                                                                                                        },
                                                                                                                      );
                                                                                                                    else {
                                                                                                                      if (
                                                                                                                        _0x4078b4 ===
                                                                                                                        'open-episode-stage'
                                                                                                                      )
                                                                                                                        void _0x457c7e(
                                                                                                                          {
                                                                                                                            confirmMissingImages:
                                                                                                                              !![],
                                                                                                                          },
                                                                                                                        );
                                                                                                                      else {
                                                                                                                        if (
                                                                                                                          _0x4078b4 ===
                                                                                                                          'toggle-experimental-split-mode'
                                                                                                                        )
                                                                                                                          return;
                                                                                                                        else {
                                                                                                                          if (
                                                                                                                            _0x4078b4 ===
                                                                                                                            'cancel-episode-selection'
                                                                                                                          )
                                                                                                                            (_0xd0330d[
                                                                                                                              'cancel'
                                                                                                                            ](),
                                                                                                                              (_0x109ee4[
                                                                                                                                'episodeSelectionMode'
                                                                                                                              ] =
                                                                                                                                ![]),
                                                                                                                              (_0x109ee4[
                                                                                                                                'selectedEpisodeIds'
                                                                                                                              ] =
                                                                                                                                []),
                                                                                                                              _0xb8a26b());
                                                                                                                          else {
                                                                                                                            if (
                                                                                                                              _0x4078b4 ===
                                                                                                                              'toggle-all-episodes'
                                                                                                                            )
                                                                                                                              ((_0x109ee4[
                                                                                                                                'selectedEpisodeIds'
                                                                                                                              ] =
                                                                                                                                toggleStoryEpisodeSelectAll(
                                                                                                                                  getStoryVideoEpisodes(
                                                                                                                                    _0x109ee4[
                                                                                                                                      'data'
                                                                                                                                    ][
                                                                                                                                      'episodes'
                                                                                                                                    ],
                                                                                                                                  ),
                                                                                                                                  _0x109ee4[
                                                                                                                                    'selectedEpisodeIds'
                                                                                                                                  ],
                                                                                                                                )),
                                                                                                                                (_0x109ee4[
                                                                                                                                  'episodeSelectionMode'
                                                                                                                                ] =
                                                                                                                                  _0x109ee4[
                                                                                                                                    'selectedEpisodeIds'
                                                                                                                                  ][
                                                                                                                                    'length'
                                                                                                                                  ] >
                                                                                                                                  0x0),
                                                                                                                                _0xb8a26b(),
                                                                                                                                _0x2e97b0[
                                                                                                                                  'querySelector'
                                                                                                                                ](
                                                                                                                                  '[data-story-action=\x22toggle-all-episodes\x22]',
                                                                                                                                )?.[
                                                                                                                                  'focus'
                                                                                                                                ]());
                                                                                                                            else {
                                                                                                                              if (
                                                                                                                                _0x4078b4 ===
                                                                                                                                'split-selected-episodes'
                                                                                                                              )
                                                                                                                                void _0x33d6b9(
                                                                                                                                  {
                                                                                                                                    selectionMode:
                                                                                                                                      !![],
                                                                                                                                  },
                                                                                                                                );
                                                                                                                              else {
                                                                                                                                if (
                                                                                                                                  _0x4078b4 ===
                                                                                                                                  'split-all-episodes'
                                                                                                                                )
                                                                                                                                  void _0x33d6b9(
                                                                                                                                    {
                                                                                                                                      selectionMode:
                                                                                                                                        ![],
                                                                                                                                    },
                                                                                                                                  );
                                                                                                                                else {
                                                                                                                                  if (
                                                                                                                                    _0x4078b4 ===
                                                                                                                                    'cancel-episode-split-batch'
                                                                                                                                  )
                                                                                                                                    _0x4a0d8c();
                                                                                                                                  else {
                                                                                                                                    if (
                                                                                                                                      _0x4078b4 ===
                                                                                                                                      'split-episode'
                                                                                                                                    )
                                                                                                                                      void _0x4d20fa(
                                                                                                                                        _0x145f02[
                                                                                                                                          'dataset'
                                                                                                                                        ][
                                                                                                                                          'storyEpisodeId'
                                                                                                                                        ],
                                                                                                                                        {
                                                                                                                                          openAfter:
                                                                                                                                            ![],
                                                                                                                                        },
                                                                                                                                      );
                                                                                                                                    else {
                                                                                                                                      if (
                                                                                                                                        _0x4078b4 ===
                                                                                                                                        'experimental-split-episode'
                                                                                                                                      ) {
                                                                                                                                        if (
                                                                                                                                          !isStoryEpisodeExperimentalSplitAvailable(
                                                                                                                                            windowObject,
                                                                                                                                          )
                                                                                                                                        )
                                                                                                                                          return;
                                                                                                                                        void _0x122630(
                                                                                                                                          _0x145f02[
                                                                                                                                            'dataset'
                                                                                                                                          ][
                                                                                                                                            'storyEpisodeId'
                                                                                                                                          ],
                                                                                                                                        );
                                                                                                                                      } else {
                                                                                                                                        if (
                                                                                                                                          _0x4078b4 ===
                                                                                                                                          'debug-episode-split-request'
                                                                                                                                        ) {
                                                                                                                                          void _0x5ae72d(
                                                                                                                                            _0x145f02[
                                                                                                                                              'dataset'
                                                                                                                                            ][
                                                                                                                                              'storyEpisodeId'
                                                                                                                                            ],
                                                                                                                                            shouldUseStoryEpisodeExperimentalSplit(
                                                                                                                                              _0x109ee4,
                                                                                                                                            ),
                                                                                                                                          );
                                                                                                                                          return;
                                                                                                                                        } else {
                                                                                                                                          if (
                                                                                                                                            _0x4078b4 ===
                                                                                                                                            'debug-experimental-split-request'
                                                                                                                                          ) {
                                                                                                                                            if (
                                                                                                                                              !isStoryEpisodeExperimentalSplitAvailable(
                                                                                                                                                windowObject,
                                                                                                                                              )
                                                                                                                                            )
                                                                                                                                              return;
                                                                                                                                            void _0x5ae72d(
                                                                                                                                              _0x145f02[
                                                                                                                                                'dataset'
                                                                                                                                              ][
                                                                                                                                                'storyEpisodeId'
                                                                                                                                              ],
                                                                                                                                            );
                                                                                                                                          } else {
                                                                                                                                            if (
                                                                                                                                              _0x4078b4 ===
                                                                                                                                              'regenerate-episode'
                                                                                                                                            )
                                                                                                                                              void _0x4d20fa(
                                                                                                                                                _0x145f02[
                                                                                                                                                  'dataset'
                                                                                                                                                ][
                                                                                                                                                  'storyEpisodeId'
                                                                                                                                                ],
                                                                                                                                                {
                                                                                                                                                  openAfter:
                                                                                                                                                    ![],
                                                                                                                                                },
                                                                                                                                              );
                                                                                                                                            else {
                                                                                                                                              if (
                                                                                                                                                _0x4078b4 ===
                                                                                                                                                'repair-episode-split-draft'
                                                                                                                                              )
                                                                                                                                                _0x1db911(
                                                                                                                                                  _0x145f02[
                                                                                                                                                    'dataset'
                                                                                                                                                  ][
                                                                                                                                                    'storyEpisodeId'
                                                                                                                                                  ],
                                                                                                                                                );
                                                                                                                                              else {
                                                                                                                                                if (
                                                                                                                                                  _0x4078b4 ===
                                                                                                                                                  'new-story'
                                                                                                                                                )
                                                                                                                                                  (_0x331cec(),
                                                                                                                                                    _0xb8a26b(),
                                                                                                                                                    _0x2e97b0[
                                                                                                                                                      'querySelector'
                                                                                                                                                    ](
                                                                                                                                                      '[data-story-idea-input]',
                                                                                                                                                    )?.[
                                                                                                                                                      'focus'
                                                                                                                                                    ]());
                                                                                                                                                else {
                                                                                                                                                  if (
                                                                                                                                                    _0x4078b4 ===
                                                                                                                                                    'back-home'
                                                                                                                                                  )
                                                                                                                                                    (_0x487a78(
                                                                                                                                                      {
                                                                                                                                                        immediate:
                                                                                                                                                          !![],
                                                                                                                                                      },
                                                                                                                                                    ),
                                                                                                                                                      (_0x109ee4[
                                                                                                                                                        'view'
                                                                                                                                                      ] =
                                                                                                                                                        'home'),
                                                                                                                                                      _0xb8a26b(
                                                                                                                                                        {
                                                                                                                                                          direction:
                                                                                                                                                            'backward',
                                                                                                                                                        },
                                                                                                                                                      ));
                                                                                                                                                  else {
                                                                                                                                                    if (
                                                                                                                                                      _0x4078b4 ===
                                                                                                                                                      'previous-step'
                                                                                                                                                    )
                                                                                                                                                      _0x40b04a(
                                                                                                                                                        _0x109ee4[
                                                                                                                                                          'step'
                                                                                                                                                        ] -
                                                                                                                                                          0x1,
                                                                                                                                                      );
                                                                                                                                                    else {
                                                                                                                                                      if (
                                                                                                                                                        _0x4078b4 ===
                                                                                                                                                        'finish-story-workbench'
                                                                                                                                                      )
                                                                                                                                                        ((_0x109ee4[
                                                                                                                                                          'view'
                                                                                                                                                        ] =
                                                                                                                                                          'home'),
                                                                                                                                                          _0x487a78(
                                                                                                                                                            {
                                                                                                                                                              immediate:
                                                                                                                                                                !![],
                                                                                                                                                            },
                                                                                                                                                          ),
                                                                                                                                                          _0xb8a26b(
                                                                                                                                                            {
                                                                                                                                                              direction:
                                                                                                                                                                'backward',
                                                                                                                                                            },
                                                                                                                                                          ),
                                                                                                                                                          _0x50d1ac(
                                                                                                                                                            '剧本工作室已保存。',
                                                                                                                                                            'success',
                                                                                                                                                          ));
                                                                                                                                                      else {
                                                                                                                                                        if (
                                                                                                                                                          _0x4078b4 ===
                                                                                                                                                          'request-delete-asset-appearance'
                                                                                                                                                        ) {
                                                                                                                                                          if (
                                                                                                                                                            _0x145f02[
                                                                                                                                                              'dataset'
                                                                                                                                                            ][
                                                                                                                                                              'storyCardAppearanceId'
                                                                                                                                                            ]
                                                                                                                                                          )
                                                                                                                                                            _0x109ee4[
                                                                                                                                                              'selectedAssetId'
                                                                                                                                                            ] =
                                                                                                                                                              _0x145f02[
                                                                                                                                                                'dataset'
                                                                                                                                                              ][
                                                                                                                                                                'storyCardAppearanceId'
                                                                                                                                                              ];
                                                                                                                                                          const _0x2e7b59 =
                                                                                                                                                              findStoryAsset(
                                                                                                                                                                _0x109ee4,
                                                                                                                                                                _0x109ee4[
                                                                                                                                                                  'selectedAssetId'
                                                                                                                                                                ],
                                                                                                                                                              ),
                                                                                                                                                            _0x435f62 =
                                                                                                                                                              _0x2e7b59
                                                                                                                                                                ? getSelectedAssetAppearance(
                                                                                                                                                                    _0x109ee4,
                                                                                                                                                                    _0x2e7b59,
                                                                                                                                                                  )
                                                                                                                                                                : null,
                                                                                                                                                            _0x2a5da2 =
                                                                                                                                                              getStoryAssetAppearanceActionKey(
                                                                                                                                                                _0x2e7b59,
                                                                                                                                                                _0x435f62,
                                                                                                                                                              );
                                                                                                                                                          if (
                                                                                                                                                            !_0x2e7b59 ||
                                                                                                                                                            !_0x435f62 ||
                                                                                                                                                            !_0x2a5da2
                                                                                                                                                          )
                                                                                                                                                            return;
                                                                                                                                                          if (
                                                                                                                                                            _0x109ee4[
                                                                                                                                                              'data'
                                                                                                                                                            ][
                                                                                                                                                              'project'
                                                                                                                                                            ][
                                                                                                                                                              'sourceMode'
                                                                                                                                                            ] ===
                                                                                                                                                            'video-replication'
                                                                                                                                                              ? !normalizeText(
                                                                                                                                                                  _0x435f62[
                                                                                                                                                                    'imageUrl'
                                                                                                                                                                  ],
                                                                                                                                                                ) &&
                                                                                                                                                                (_0x2e7b59[
                                                                                                                                                                  'kind'
                                                                                                                                                                ] !==
                                                                                                                                                                  'character' ||
                                                                                                                                                                  getStoryAssetAppearances(
                                                                                                                                                                    _0x2e7b59,
                                                                                                                                                                  )[
                                                                                                                                                                    'length'
                                                                                                                                                                  ] <=
                                                                                                                                                                    0x1)
                                                                                                                                                              : !isStoryAddedAssetAppearance(
                                                                                                                                                                  _0x435f62,
                                                                                                                                                                ) ||
                                                                                                                                                                getStoryAssetAppearances(
                                                                                                                                                                  _0x2e7b59,
                                                                                                                                                                )[
                                                                                                                                                                  'length'
                                                                                                                                                                ] <=
                                                                                                                                                                  0x1
                                                                                                                                                          ) {
                                                                                                                                                            _0x50d1ac(
                                                                                                                                                              '剧本识别出的原始形象不能删除。',
                                                                                                                                                              'warn',
                                                                                                                                                            );
                                                                                                                                                            return;
                                                                                                                                                          }
                                                                                                                                                          if (
                                                                                                                                                            isStoryAssetAppearanceLoading(
                                                                                                                                                              _0x109ee4,
                                                                                                                                                              _0x2e7b59[
                                                                                                                                                                'id'
                                                                                                                                                              ],
                                                                                                                                                              _0x435f62[
                                                                                                                                                                'id'
                                                                                                                                                              ],
                                                                                                                                                            ) ||
                                                                                                                                                            normalizeText(
                                                                                                                                                              _0x109ee4[
                                                                                                                                                                'exportingAssetAppearanceKey'
                                                                                                                                                              ],
                                                                                                                                                            ) ===
                                                                                                                                                              _0x2a5da2
                                                                                                                                                          ) {
                                                                                                                                                            _0x50d1ac(
                                                                                                                                                              '请等待当前形象任务完成。',
                                                                                                                                                              'info',
                                                                                                                                                            );
                                                                                                                                                            return;
                                                                                                                                                          }
                                                                                                                                                          if (
                                                                                                                                                            removeStoryReplicationCharacterAppearance(
                                                                                                                                                              _0x109ee4,
                                                                                                                                                              _0x2e7b59,
                                                                                                                                                              _0x435f62[
                                                                                                                                                                'id'
                                                                                                                                                              ],
                                                                                                                                                            )
                                                                                                                                                          ) {
                                                                                                                                                            (_0x487a78(
                                                                                                                                                              {
                                                                                                                                                                immediate:
                                                                                                                                                                  !![],
                                                                                                                                                              },
                                                                                                                                                            ),
                                                                                                                                                              _0xb8a26b());
                                                                                                                                                            return;
                                                                                                                                                          }
                                                                                                                                                          ((_0x109ee4[
                                                                                                                                                            'pendingDeleteAssetAppearanceKey'
                                                                                                                                                          ] =
                                                                                                                                                            _0x2a5da2),
                                                                                                                                                            _0xb8a26b());
                                                                                                                                                        } else {
                                                                                                                                                          if (
                                                                                                                                                            _0x4078b4 ===
                                                                                                                                                            'cancel-delete-asset-appearance'
                                                                                                                                                          )
                                                                                                                                                            ((_0x109ee4[
                                                                                                                                                              'pendingDeleteAssetAppearanceKey'
                                                                                                                                                            ] =
                                                                                                                                                              ''),
                                                                                                                                                              _0xb8a26b());
                                                                                                                                                          else {
                                                                                                                                                            if (
                                                                                                                                                              _0x4078b4 ===
                                                                                                                                                              'confirm-delete-asset-appearance'
                                                                                                                                                            ) {
                                                                                                                                                              const _0x1d2e27 =
                                                                                                                                                                  findStoryAsset(
                                                                                                                                                                    _0x109ee4,
                                                                                                                                                                    _0x109ee4[
                                                                                                                                                                      'selectedAssetId'
                                                                                                                                                                    ],
                                                                                                                                                                  ),
                                                                                                                                                                _0x1ee72d =
                                                                                                                                                                  _0x1d2e27
                                                                                                                                                                    ? getSelectedAssetAppearance(
                                                                                                                                                                        _0x109ee4,
                                                                                                                                                                        _0x1d2e27,
                                                                                                                                                                      )
                                                                                                                                                                    : null,
                                                                                                                                                                _0x2b4e42 =
                                                                                                                                                                  getStoryAssetAppearanceActionKey(
                                                                                                                                                                    _0x1d2e27,
                                                                                                                                                                    _0x1ee72d,
                                                                                                                                                                  );
                                                                                                                                                              if (
                                                                                                                                                                !_0x1d2e27 ||
                                                                                                                                                                !_0x1ee72d ||
                                                                                                                                                                !_0x2b4e42 ||
                                                                                                                                                                _0x2b4e42 !==
                                                                                                                                                                  normalizeText(
                                                                                                                                                                    _0x109ee4[
                                                                                                                                                                      'pendingDeleteAssetAppearanceKey'
                                                                                                                                                                    ],
                                                                                                                                                                  )
                                                                                                                                                              )
                                                                                                                                                                return;
                                                                                                                                                              if (
                                                                                                                                                                isStoryAssetAppearanceLoading(
                                                                                                                                                                  _0x109ee4,
                                                                                                                                                                  _0x1d2e27[
                                                                                                                                                                    'id'
                                                                                                                                                                  ],
                                                                                                                                                                  _0x1ee72d[
                                                                                                                                                                    'id'
                                                                                                                                                                  ],
                                                                                                                                                                ) ||
                                                                                                                                                                normalizeText(
                                                                                                                                                                  _0x109ee4[
                                                                                                                                                                    'exportingAssetAppearanceKey'
                                                                                                                                                                  ],
                                                                                                                                                                ) ===
                                                                                                                                                                  _0x2b4e42
                                                                                                                                                              ) {
                                                                                                                                                                ((_0x109ee4[
                                                                                                                                                                  'pendingDeleteAssetAppearanceKey'
                                                                                                                                                                ] =
                                                                                                                                                                  ''),
                                                                                                                                                                  _0xb8a26b(),
                                                                                                                                                                  _0x50d1ac(
                                                                                                                                                                    '请等待当前形象任务完成。',
                                                                                                                                                                    'info',
                                                                                                                                                                  ));
                                                                                                                                                                return;
                                                                                                                                                              }
                                                                                                                                                              const _0xe6fb2c =
                                                                                                                                                                  _0x109ee4[
                                                                                                                                                                    'data'
                                                                                                                                                                  ][
                                                                                                                                                                    'project'
                                                                                                                                                                  ][
                                                                                                                                                                    'sourceMode'
                                                                                                                                                                  ] ===
                                                                                                                                                                  'video-replication',
                                                                                                                                                                _0xe58fbb =
                                                                                                                                                                  _0xe6fb2c
                                                                                                                                                                    ? clearStoryAssetAppearanceImage(
                                                                                                                                                                        _0x1d2e27,
                                                                                                                                                                        _0x1ee72d[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                      )
                                                                                                                                                                    : removeStoryAddedAssetAppearance(
                                                                                                                                                                        _0x1d2e27,
                                                                                                                                                                        _0x1ee72d[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                      );
                                                                                                                                                              _0x109ee4[
                                                                                                                                                                'pendingDeleteAssetAppearanceKey'
                                                                                                                                                              ] =
                                                                                                                                                                '';
                                                                                                                                                              if (
                                                                                                                                                                !_0xe58fbb[
                                                                                                                                                                  'removed'
                                                                                                                                                                ]
                                                                                                                                                              ) {
                                                                                                                                                                (_0xb8a26b(),
                                                                                                                                                                  _0x50d1ac(
                                                                                                                                                                    '剧本识别出的原始形象不能删除。',
                                                                                                                                                                    'warn',
                                                                                                                                                                  ));
                                                                                                                                                                return;
                                                                                                                                                              }
                                                                                                                                                              ((_0x109ee4[
                                                                                                                                                                'assetAppearanceIndexes'
                                                                                                                                                              ] =
                                                                                                                                                                {
                                                                                                                                                                  ..._0x109ee4[
                                                                                                                                                                    'assetAppearanceIndexes'
                                                                                                                                                                  ],
                                                                                                                                                                  [_0x1d2e27[
                                                                                                                                                                    'id'
                                                                                                                                                                  ]]:
                                                                                                                                                                    _0xe58fbb[
                                                                                                                                                                      'nextIndex'
                                                                                                                                                                    ],
                                                                                                                                                                }),
                                                                                                                                                                _0x487a78(
                                                                                                                                                                  {
                                                                                                                                                                    immediate:
                                                                                                                                                                      !![],
                                                                                                                                                                  },
                                                                                                                                                                ),
                                                                                                                                                                _0xb8a26b(),
                                                                                                                                                                _0x50d1ac(
                                                                                                                                                                  _0xe6fb2c
                                                                                                                                                                    ? '当前图片已删除，可重新生成或上传。'
                                                                                                                                                                    : '追加形象已删除，原始形象仍保留。',
                                                                                                                                                                  'success',
                                                                                                                                                                ));
                                                                                                                                                            } else {
                                                                                                                                                              if (
                                                                                                                                                                _0x4078b4 ===
                                                                                                                                                                'upload-asset'
                                                                                                                                                              )
                                                                                                                                                                ((_0x109ee4[
                                                                                                                                                                  'pendingAssetUploadId'
                                                                                                                                                                ] =
                                                                                                                                                                  _0x145f02[
                                                                                                                                                                    'dataset'
                                                                                                                                                                  ][
                                                                                                                                                                    'storyCardAppearanceId'
                                                                                                                                                                  ] ||
                                                                                                                                                                  _0x109ee4[
                                                                                                                                                                    'selectedAssetId'
                                                                                                                                                                  ]),
                                                                                                                                                                  (_0xc6f8ce =
                                                                                                                                                                    _0x3bd979[
                                                                                                                                                                      'capture'
                                                                                                                                                                    ](
                                                                                                                                                                      _0x109ee4[
                                                                                                                                                                        'pendingAssetUploadId'
                                                                                                                                                                      ],
                                                                                                                                                                      {
                                                                                                                                                                        appendAppearance:
                                                                                                                                                                          Boolean(
                                                                                                                                                                            _0x145f02[
                                                                                                                                                                              'dataset'
                                                                                                                                                                            ][
                                                                                                                                                                              'storyCardAppearanceId'
                                                                                                                                                                            ],
                                                                                                                                                                          ),
                                                                                                                                                                      },
                                                                                                                                                                    )),
                                                                                                                                                                  (_0x109ee4[
                                                                                                                                                                    'pendingAssetAppearanceId'
                                                                                                                                                                  ] =
                                                                                                                                                                    _0xc6f8ce[
                                                                                                                                                                      'appearanceId'
                                                                                                                                                                    ] ||
                                                                                                                                                                    ''),
                                                                                                                                                                  _0x53cb21?.[
                                                                                                                                                                    'click'
                                                                                                                                                                  ]());
                                                                                                                                                              else {
                                                                                                                                                                if (
                                                                                                                                                                  _0x4078b4 ===
                                                                                                                                                                  'upload-asset-reference'
                                                                                                                                                                ) {
                                                                                                                                                                  const _0x21f8aa =
                                                                                                                                                                      findStoryAsset(
                                                                                                                                                                        _0x109ee4,
                                                                                                                                                                        _0x109ee4[
                                                                                                                                                                          'selectedAssetId'
                                                                                                                                                                        ],
                                                                                                                                                                      ),
                                                                                                                                                                    _0xa826f8 =
                                                                                                                                                                      _0x21f8aa
                                                                                                                                                                        ? getSelectedAssetAppearance(
                                                                                                                                                                            _0x109ee4,
                                                                                                                                                                            _0x21f8aa,
                                                                                                                                                                          )
                                                                                                                                                                        : null;
                                                                                                                                                                  if (
                                                                                                                                                                    !_0x21f8aa ||
                                                                                                                                                                    !_0xa826f8 ||
                                                                                                                                                                    !isStoryAssetBaseAppearance(
                                                                                                                                                                      _0x21f8aa,
                                                                                                                                                                      _0xa826f8,
                                                                                                                                                                    )
                                                                                                                                                                  )
                                                                                                                                                                    _0x50d1ac(
                                                                                                                                                                      '只有基础形象可以上传风格参考。',
                                                                                                                                                                      'warn',
                                                                                                                                                                    );
                                                                                                                                                                  else
                                                                                                                                                                    isStoryAssetAppearanceLoading(
                                                                                                                                                                      _0x109ee4,
                                                                                                                                                                      _0x21f8aa[
                                                                                                                                                                        'id'
                                                                                                                                                                      ],
                                                                                                                                                                      _0xa826f8[
                                                                                                                                                                        'id'
                                                                                                                                                                      ],
                                                                                                                                                                    )
                                                                                                                                                                      ? _0x50d1ac(
                                                                                                                                                                          '请等待当前生成或上传任务完成。',
                                                                                                                                                                          'info',
                                                                                                                                                                        )
                                                                                                                                                                      : ((_0x3023cf =
                                                                                                                                                                          {
                                                                                                                                                                            projectToken:
                                                                                                                                                                              _0xa88d71(
                                                                                                                                                                                _0x109ee4,
                                                                                                                                                                              ),
                                                                                                                                                                            assetId:
                                                                                                                                                                              _0x21f8aa[
                                                                                                                                                                                'id'
                                                                                                                                                                              ],
                                                                                                                                                                            appearanceId:
                                                                                                                                                                              _0xa826f8[
                                                                                                                                                                                'id'
                                                                                                                                                                              ],
                                                                                                                                                                          }),
                                                                                                                                                                        _0x46a449?.[
                                                                                                                                                                          'click'
                                                                                                                                                                        ]());
                                                                                                                                                                } else {
                                                                                                                                                                  if (
                                                                                                                                                                    _0x4078b4 ===
                                                                                                                                                                    'remove-asset-reference'
                                                                                                                                                                  ) {
                                                                                                                                                                    const _0x4a7025 =
                                                                                                                                                                        findStoryAsset(
                                                                                                                                                                          _0x109ee4,
                                                                                                                                                                          _0x109ee4[
                                                                                                                                                                            'selectedAssetId'
                                                                                                                                                                          ],
                                                                                                                                                                        ),
                                                                                                                                                                      _0x38dc0f =
                                                                                                                                                                        _0x4a7025
                                                                                                                                                                          ? getSelectedAssetAppearance(
                                                                                                                                                                              _0x109ee4,
                                                                                                                                                                              _0x4a7025,
                                                                                                                                                                            )
                                                                                                                                                                          : null;
                                                                                                                                                                    _0x4a7025 &&
                                                                                                                                                                      _0x38dc0f &&
                                                                                                                                                                      !isStoryAssetAppearanceLoading(
                                                                                                                                                                        _0x109ee4,
                                                                                                                                                                        _0x4a7025[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                        _0x38dc0f[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                      ) &&
                                                                                                                                                                      clearStoryAssetAppearanceReferenceImage(
                                                                                                                                                                        _0x38dc0f,
                                                                                                                                                                      ) &&
                                                                                                                                                                      (_0x12cdc4(
                                                                                                                                                                        _0x4a7025[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                      ),
                                                                                                                                                                      _0x4d5584(),
                                                                                                                                                                      _0x487a78(
                                                                                                                                                                        {
                                                                                                                                                                          immediate:
                                                                                                                                                                            !![],
                                                                                                                                                                        },
                                                                                                                                                                      ),
                                                                                                                                                                      _0x50d1ac(
                                                                                                                                                                        '风格参考已删除。',
                                                                                                                                                                        'success',
                                                                                                                                                                      ));
                                                                                                                                                                  } else {
                                                                                                                                                                    if (
                                                                                                                                                                      _0x4078b4 ===
                                                                                                                                                                      'play-character-voice'
                                                                                                                                                                    )
                                                                                                                                                                      void _0x21df6e(
                                                                                                                                                                        _0x145f02[
                                                                                                                                                                          'dataset'
                                                                                                                                                                        ][
                                                                                                                                                                          'storyVoiceAssetId'
                                                                                                                                                                        ] ||
                                                                                                                                                                          _0x109ee4[
                                                                                                                                                                            'selectedAssetId'
                                                                                                                                                                          ],
                                                                                                                                                                      );
                                                                                                                                                                    else {
                                                                                                                                                                      if (
                                                                                                                                                                        _0x4078b4 ===
                                                                                                                                                                        'open-character-voice'
                                                                                                                                                                      )
                                                                                                                                                                        _0xa1b14f(
                                                                                                                                                                          _0x109ee4[
                                                                                                                                                                            'selectedAssetId'
                                                                                                                                                                          ],
                                                                                                                                                                        );
                                                                                                                                                                      else {
                                                                                                                                                                        if (
                                                                                                                                                                          _0x4078b4 ===
                                                                                                                                                                          'close-character-voice'
                                                                                                                                                                        )
                                                                                                                                                                          _0x50b62a();
                                                                                                                                                                        else {
                                                                                                                                                                          if (
                                                                                                                                                                            _0x4078b4 ===
                                                                                                                                                                            'upload-character-voice'
                                                                                                                                                                          )
                                                                                                                                                                            ((_0x109ee4[
                                                                                                                                                                              'pendingCharacterVoiceAssetId'
                                                                                                                                                                            ] =
                                                                                                                                                                              _0x109ee4[
                                                                                                                                                                                'characterVoiceEditor'
                                                                                                                                                                              ]?.[
                                                                                                                                                                                'assetId'
                                                                                                                                                                              ] ||
                                                                                                                                                                              _0x109ee4[
                                                                                                                                                                                'selectedAssetId'
                                                                                                                                                                              ] ||
                                                                                                                                                                              ''),
                                                                                                                                                                              (_0x56abf0 =
                                                                                                                                                                                {
                                                                                                                                                                                  projectToken:
                                                                                                                                                                                    _0xa88d71(
                                                                                                                                                                                      _0x109ee4,
                                                                                                                                                                                    ),
                                                                                                                                                                                  assetId:
                                                                                                                                                                                    _0x109ee4[
                                                                                                                                                                                      'pendingCharacterVoiceAssetId'
                                                                                                                                                                                    ],
                                                                                                                                                                                  editor:
                                                                                                                                                                                    _0x109ee4[
                                                                                                                                                                                      'characterVoiceEditor'
                                                                                                                                                                                    ],
                                                                                                                                                                                }),
                                                                                                                                                                              _0x4ce129?.[
                                                                                                                                                                                'click'
                                                                                                                                                                              ]());
                                                                                                                                                                          else {
                                                                                                                                                                            if (
                                                                                                                                                                              _0x4078b4 ===
                                                                                                                                                                              'remove-character-voice'
                                                                                                                                                                            ) {
                                                                                                                                                                              const _0x300612 =
                                                                                                                                                                                findStoryAsset(
                                                                                                                                                                                  _0x109ee4,
                                                                                                                                                                                  _0x145f02[
                                                                                                                                                                                    'closest'
                                                                                                                                                                                  ](
                                                                                                                                                                                    '.story-voice-source-menu',
                                                                                                                                                                                  )
                                                                                                                                                                                    ? _0x109ee4[
                                                                                                                                                                                        'selectedAssetId'
                                                                                                                                                                                      ]
                                                                                                                                                                                    : _0x109ee4[
                                                                                                                                                                                        'characterVoiceEditor'
                                                                                                                                                                                      ]?.[
                                                                                                                                                                                        'assetId'
                                                                                                                                                                                      ],
                                                                                                                                                                                );
                                                                                                                                                                              _0x300612 &&
                                                                                                                                                                                (_0x49f360(),
                                                                                                                                                                                clearStoryCharacterVoiceReference(
                                                                                                                                                                                  _0x300612,
                                                                                                                                                                                ),
                                                                                                                                                                                _0x487a78(
                                                                                                                                                                                  {
                                                                                                                                                                                    immediate:
                                                                                                                                                                                      !![],
                                                                                                                                                                                  },
                                                                                                                                                                                ),
                                                                                                                                                                                _0xb8a26b(),
                                                                                                                                                                                _0x50d1ac(
                                                                                                                                                                                  '已移除角色声音参考。',
                                                                                                                                                                                  'success',
                                                                                                                                                                                ));
                                                                                                                                                                            } else {
                                                                                                                                                                              if (
                                                                                                                                                                                _0x4078b4 ===
                                                                                                                                                                                'toggle-character-voice-history'
                                                                                                                                                                              ) {
                                                                                                                                                                                const _0x4eb8b1 =
                                                                                                                                                                                    _0x145f02[
                                                                                                                                                                                      'closest'
                                                                                                                                                                                    ](
                                                                                                                                                                                      '.story-character-voice-history-wrap',
                                                                                                                                                                                    ),
                                                                                                                                                                                  _0x253ede =
                                                                                                                                                                                    _0x4eb8b1?.[
                                                                                                                                                                                      'querySelector'
                                                                                                                                                                                    ](
                                                                                                                                                                                      '.story-character-voice-history-panel',
                                                                                                                                                                                    ),
                                                                                                                                                                                  _0x51eb44 =
                                                                                                                                                                                    !_0x4eb8b1?.[
                                                                                                                                                                                      'classList'
                                                                                                                                                                                    ][
                                                                                                                                                                                      'contains'
                                                                                                                                                                                    ](
                                                                                                                                                                                      'is-open',
                                                                                                                                                                                    );
                                                                                                                                                                                (_0x593e47(
                                                                                                                                                                                  _0x4eb8b1,
                                                                                                                                                                                ),
                                                                                                                                                                                  _0x4eb8b1?.[
                                                                                                                                                                                    'classList'
                                                                                                                                                                                  ][
                                                                                                                                                                                    'toggle'
                                                                                                                                                                                  ](
                                                                                                                                                                                    'is-open',
                                                                                                                                                                                    _0x51eb44,
                                                                                                                                                                                  ),
                                                                                                                                                                                  _0x145f02[
                                                                                                                                                                                    'setAttribute'
                                                                                                                                                                                  ](
                                                                                                                                                                                    'aria-expanded',
                                                                                                                                                                                    String(
                                                                                                                                                                                      _0x51eb44,
                                                                                                                                                                                    ),
                                                                                                                                                                                  ),
                                                                                                                                                                                  _0x253ede?.[
                                                                                                                                                                                    'setAttribute'
                                                                                                                                                                                  ](
                                                                                                                                                                                    'aria-hidden',
                                                                                                                                                                                    String(
                                                                                                                                                                                      !_0x51eb44,
                                                                                                                                                                                    ),
                                                                                                                                                                                  ));
                                                                                                                                                                              } else {
                                                                                                                                                                                if (
                                                                                                                                                                                  _0x4078b4 ===
                                                                                                                                                                                  'generate-character-voice'
                                                                                                                                                                                )
                                                                                                                                                                                  void _0x4d6578();
                                                                                                                                                                                else {
                                                                                                                                                                                  if (
                                                                                                                                                                                    _0x4078b4 ===
                                                                                                                                                                                    'download-asset-image'
                                                                                                                                                                                  )
                                                                                                                                                                                    void _0x219abf(
                                                                                                                                                                                      _0x145f02,
                                                                                                                                                                                    );
                                                                                                                                                                                  else {
                                                                                                                                                                                    if (
                                                                                                                                                                                      _0x4078b4 ===
                                                                                                                                                                                      'add-asset-appearance-to-library'
                                                                                                                                                                                    )
                                                                                                                                                                                      void _0x471edc();
                                                                                                                                                                                    else {
                                                                                                                                                                                      if (
                                                                                                                                                                                        _0x4078b4 ===
                                                                                                                                                                                        'previous-appearance'
                                                                                                                                                                                      )
                                                                                                                                                                                        _0x241ae6(
                                                                                                                                                                                          -0x1,
                                                                                                                                                                                          _0x145f02[
                                                                                                                                                                                            'dataset'
                                                                                                                                                                                          ][
                                                                                                                                                                                            'storyCardAppearanceId'
                                                                                                                                                                                          ] ||
                                                                                                                                                                                            _0x109ee4[
                                                                                                                                                                                              'selectedAssetId'
                                                                                                                                                                                            ],
                                                                                                                                                                                        );
                                                                                                                                                                                      else {
                                                                                                                                                                                        if (
                                                                                                                                                                                          _0x4078b4 ===
                                                                                                                                                                                          'next-appearance'
                                                                                                                                                                                        )
                                                                                                                                                                                          _0x241ae6(
                                                                                                                                                                                            0x1,
                                                                                                                                                                                            _0x145f02[
                                                                                                                                                                                              'dataset'
                                                                                                                                                                                            ][
                                                                                                                                                                                              'storyCardAppearanceId'
                                                                                                                                                                                            ] ||
                                                                                                                                                                                              _0x109ee4[
                                                                                                                                                                                                'selectedAssetId'
                                                                                                                                                                                              ],
                                                                                                                                                                                          );
                                                                                                                                                                                        else {
                                                                                                                                                                                          if (
                                                                                                                                                                                            _0x4078b4 ===
                                                                                                                                                                                            'previous-clip'
                                                                                                                                                                                          )
                                                                                                                                                                                            _0x5a2318(
                                                                                                                                                                                              -0x1,
                                                                                                                                                                                            );
                                                                                                                                                                                          else {
                                                                                                                                                                                            if (
                                                                                                                                                                                              _0x4078b4 ===
                                                                                                                                                                                              'next-clip'
                                                                                                                                                                                            )
                                                                                                                                                                                              _0x5a2318(
                                                                                                                                                                                                0x1,
                                                                                                                                                                                              );
                                                                                                                                                                                            else {
                                                                                                                                                                                              if (
                                                                                                                                                                                                _0x4078b4 ===
                                                                                                                                                                                                'previous-video-result'
                                                                                                                                                                                              )
                                                                                                                                                                                                _0xd470b3(
                                                                                                                                                                                                  -0x1,
                                                                                                                                                                                                );
                                                                                                                                                                                              else {
                                                                                                                                                                                                if (
                                                                                                                                                                                                  _0x4078b4 ===
                                                                                                                                                                                                  'next-video-result'
                                                                                                                                                                                                )
                                                                                                                                                                                                  _0xd470b3(
                                                                                                                                                                                                    0x1,
                                                                                                                                                                                                  );
                                                                                                                                                                                                else {
                                                                                                                                                                                                  if (
                                                                                                                                                                                                    _0x4078b4 ===
                                                                                                                                                                                                    'select-video-result'
                                                                                                                                                                                                  )
                                                                                                                                                                                                    _0x45e3c2(
                                                                                                                                                                                                      _0x145f02[
                                                                                                                                                                                                        'dataset'
                                                                                                                                                                                                      ][
                                                                                                                                                                                                        'storyClipId'
                                                                                                                                                                                                      ],
                                                                                                                                                                                                      _0x145f02[
                                                                                                                                                                                                        'dataset'
                                                                                                                                                                                                      ][
                                                                                                                                                                                                        'storyVideoResultIndex'
                                                                                                                                                                                                      ],
                                                                                                                                                                                                    );
                                                                                                                                                                                                  else {
                                                                                                                                                                                                    if (
                                                                                                                                                                                                      _0x4078b4 ===
                                                                                                                                                                                                      'delete-video-result'
                                                                                                                                                                                                    )
                                                                                                                                                                                                      _0x534c72(
                                                                                                                                                                                                        _0x145f02[
                                                                                                                                                                                                          'dataset'
                                                                                                                                                                                                        ][
                                                                                                                                                                                                          'storyClipId'
                                                                                                                                                                                                        ],
                                                                                                                                                                                                        _0x145f02[
                                                                                                                                                                                                          'dataset'
                                                                                                                                                                                                        ][
                                                                                                                                                                                                          'storyVideoResultIndex'
                                                                                                                                                                                                        ],
                                                                                                                                                                                                      );
                                                                                                                                                                                                    else {
                                                                                                                                                                                                      if (
                                                                                                                                                                                                        _0x4078b4 ===
                                                                                                                                                                                                        'capture-video-frame'
                                                                                                                                                                                                      )
                                                                                                                                                                                                        void _0x5074b8(
                                                                                                                                                                                                          _0x145f02,
                                                                                                                                                                                                        );
                                                                                                                                                                                                      else {
                                                                                                                                                                                                        if (
                                                                                                                                                                                                          _0x4078b4 ===
                                                                                                                                                                                                          'trim-video'
                                                                                                                                                                                                        )
                                                                                                                                                                                                          _0x1e1621(
                                                                                                                                                                                                            _0x145f02,
                                                                                                                                                                                                          );
                                                                                                                                                                                                        else {
                                                                                                                                                                                                          if (
                                                                                                                                                                                                            _0x4078b4 ===
                                                                                                                                                                                                            'set-base-appearance'
                                                                                                                                                                                                          ) {
                                                                                                                                                                                                            const _0x40dc93 =
                                                                                                                                                                                                                findStoryAsset(
                                                                                                                                                                                                                  _0x109ee4,
                                                                                                                                                                                                                  _0x109ee4[
                                                                                                                                                                                                                    'selectedAssetId'
                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                ),
                                                                                                                                                                                                              _0x4fc133 =
                                                                                                                                                                                                                _0x40dc93
                                                                                                                                                                                                                  ? getSelectedAssetAppearance(
                                                                                                                                                                                                                      _0x109ee4,
                                                                                                                                                                                                                      _0x40dc93,
                                                                                                                                                                                                                    )
                                                                                                                                                                                                                  : null;
                                                                                                                                                                                                            if (
                                                                                                                                                                                                              _0x40dc93 &&
                                                                                                                                                                                                              isStoryAssetCardLoading(
                                                                                                                                                                                                                _0x109ee4,
                                                                                                                                                                                                                _0x40dc93[
                                                                                                                                                                                                                  'id'
                                                                                                                                                                                                                ],
                                                                                                                                                                                                              )
                                                                                                                                                                                                            )
                                                                                                                                                                                                              _0x50d1ac(
                                                                                                                                                                                                                '请等待当前生成任务完成。',
                                                                                                                                                                                                                'info',
                                                                                                                                                                                                              );
                                                                                                                                                                                                            else {
                                                                                                                                                                                                              if (
                                                                                                                                                                                                                !_0x40dc93 ||
                                                                                                                                                                                                                !_0x4fc133
                                                                                                                                                                                                              )
                                                                                                                                                                                                                _0x50d1ac(
                                                                                                                                                                                                                  '当前形象不可用。',
                                                                                                                                                                                                                  'warn',
                                                                                                                                                                                                                );
                                                                                                                                                                                                              else
                                                                                                                                                                                                                setStoryAssetBaseAppearance(
                                                                                                                                                                                                                  _0x40dc93,
                                                                                                                                                                                                                  _0x4fc133[
                                                                                                                                                                                                                    'id'
                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                ) &&
                                                                                                                                                                                                                  (_0x12cdc4(
                                                                                                                                                                                                                    _0x40dc93[
                                                                                                                                                                                                                      'id'
                                                                                                                                                                                                                    ],
                                                                                                                                                                                                                  ),
                                                                                                                                                                                                                  _0x4d5584(),
                                                                                                                                                                                                                  _0x487a78(
                                                                                                                                                                                                                    {
                                                                                                                                                                                                                      immediate:
                                                                                                                                                                                                                        !![],
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                  ),
                                                                                                                                                                                                                  _0x50d1ac(
                                                                                                                                                                                                                    '已设为基础形象；生成后会作为其他形象的参考。',
                                                                                                                                                                                                                    'success',
                                                                                                                                                                                                                  ));
                                                                                                                                                                                                            }
                                                                                                                                                                                                          } else {
                                                                                                                                                                                                            if (
                                                                                                                                                                                                              _0x4078b4 ===
                                                                                                                                                                                                              'toggle-all-assets'
                                                                                                                                                                                                            ) {
                                                                                                                                                                                                              const _0x545202 =
                                                                                                                                                                                                                getVisibleStoryAssets(
                                                                                                                                                                                                                  _0x109ee4,
                                                                                                                                                                                                                );
                                                                                                                                                                                                              ((_0x109ee4[
                                                                                                                                                                                                                'selectedAssetIds'
                                                                                                                                                                                                              ] =
                                                                                                                                                                                                                toggleStoryAssetSelectAll(
                                                                                                                                                                                                                  _0x109ee4[
                                                                                                                                                                                                                    'assetFilter'
                                                                                                                                                                                                                  ] ===
                                                                                                                                                                                                                    'library'
                                                                                                                                                                                                                    ? _0x545202[
                                                                                                                                                                                                                        'filter'
                                                                                                                                                                                                                      ](
                                                                                                                                                                                                                        (
                                                                                                                                                                                                                          _0x394d26,
                                                                                                                                                                                                                        ) =>
                                                                                                                                                                                                                          [
                                                                                                                                                                                                                            'image',
                                                                                                                                                                                                                            'audio',
                                                                                                                                                                                                                          ][
                                                                                                                                                                                                                            'includes'
                                                                                                                                                                                                                          ](
                                                                                                                                                                                                                            normalizeText(
                                                                                                                                                                                                                              _0x394d26?.[
                                                                                                                                                                                                                                'mediaKind'
                                                                                                                                                                                                                              ],
                                                                                                                                                                                                                            )[
                                                                                                                                                                                                                              'toLowerCase'
                                                                                                                                                                                                                            ](),
                                                                                                                                                                                                                          ) &&
                                                                                                                                                                                                                          normalizeText(
                                                                                                                                                                                                                            _0x394d26?.[
                                                                                                                                                                                                                              'sourceUrl'
                                                                                                                                                                                                                            ] ||
                                                                                                                                                                                                                              _0x394d26?.[
                                                                                                                                                                                                                                'imageUrl'
                                                                                                                                                                                                                              ],
                                                                                                                                                                                                                          ),
                                                                                                                                                                                                                      )
                                                                                                                                                                                                                    : _0x545202,
                                                                                                                                                                                                                  _0x109ee4[
                                                                                                                                                                                                                    'selectedAssetIds'
                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                )),
                                                                                                                                                                                                                (_0x109ee4[
                                                                                                                                                                                                                  'assetSelectionMode'
                                                                                                                                                                                                                ] =
                                                                                                                                                                                                                  _0x109ee4[
                                                                                                                                                                                                                    'selectedAssetIds'
                                                                                                                                                                                                                  ][
                                                                                                                                                                                                                    'length'
                                                                                                                                                                                                                  ] >
                                                                                                                                                                                                                  0x0),
                                                                                                                                                                                                                _0xb8a26b(),
                                                                                                                                                                                                                focusWorkspaceAssetCard(
                                                                                                                                                                                                                  _0x2e97b0,
                                                                                                                                                                                                                  _0x109ee4[
                                                                                                                                                                                                                    'selectedAssetId'
                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                ));
                                                                                                                                                                                                            } else {
                                                                                                                                                                                                              if (
                                                                                                                                                                                                                _0x4078b4 ===
                                                                                                                                                                                                                'add-library-assets-to-project'
                                                                                                                                                                                                              ) {
                                                                                                                                                                                                                const _0x5ef9a1 =
                                                                                                                                                                                                                    _0x145f02[
                                                                                                                                                                                                                      'closest'
                                                                                                                                                                                                                    ](
                                                                                                                                                                                                                      '.story-asset-batch-menu-wrap',
                                                                                                                                                                                                                    ),
                                                                                                                                                                                                                  _0x4d4fbc =
                                                                                                                                                                                                                    !_0x5ef9a1?.[
                                                                                                                                                                                                                      'classList'
                                                                                                                                                                                                                    ][
                                                                                                                                                                                                                      'contains'
                                                                                                                                                                                                                    ](
                                                                                                                                                                                                                      'is-open',
                                                                                                                                                                                                                    );
                                                                                                                                                                                                                if (
                                                                                                                                                                                                                  _0x4d4fbc
                                                                                                                                                                                                                )
                                                                                                                                                                                                                  _0x19d242(
                                                                                                                                                                                                                    _0x5ef9a1,
                                                                                                                                                                                                                    _0x145f02,
                                                                                                                                                                                                                  );
                                                                                                                                                                                                                else
                                                                                                                                                                                                                  _0x403c84();
                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                if (
                                                                                                                                                                                                                  _0x4078b4 ===
                                                                                                                                                                                                                  'cancel-asset-batch-generation'
                                                                                                                                                                                                                )
                                                                                                                                                                                                                  _0x4baec6();
                                                                                                                                                                                                                else {
                                                                                                                                                                                                                  if (
                                                                                                                                                                                                                    _0x4078b4 ===
                                                                                                                                                                                                                    'batch-generate-assets'
                                                                                                                                                                                                                  ) {
                                                                                                                                                                                                                    (_0x345d08(),
                                                                                                                                                                                                                      _0x76c71e());
                                                                                                                                                                                                                    const _0x46f8b3 =
                                                                                                                                                                                                                      _0x145f02[
                                                                                                                                                                                                                        'dataset'
                                                                                                                                                                                                                      ][
                                                                                                                                                                                                                        'storyAssetBatchDirectMode'
                                                                                                                                                                                                                      ];
                                                                                                                                                                                                                    if (
                                                                                                                                                                                                                      _0x46f8b3
                                                                                                                                                                                                                    ) {
                                                                                                                                                                                                                      (_0x403c84(),
                                                                                                                                                                                                                        void _0x5af5f7(
                                                                                                                                                                                                                          _0x46f8b3,
                                                                                                                                                                                                                        ));
                                                                                                                                                                                                                      return;
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                    const _0x2298f4 =
                                                                                                                                                                                                                        _0x145f02[
                                                                                                                                                                                                                          'closest'
                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                          '.story-asset-batch-menu-wrap',
                                                                                                                                                                                                                        ),
                                                                                                                                                                                                                      _0x13b151 =
                                                                                                                                                                                                                        !_0x2298f4?.[
                                                                                                                                                                                                                          'classList'
                                                                                                                                                                                                                        ][
                                                                                                                                                                                                                          'contains'
                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                          'is-open',
                                                                                                                                                                                                                        );
                                                                                                                                                                                                                    if (
                                                                                                                                                                                                                      _0x13b151
                                                                                                                                                                                                                    )
                                                                                                                                                                                                                      _0x19d242(
                                                                                                                                                                                                                        _0x2298f4,
                                                                                                                                                                                                                        _0x145f02,
                                                                                                                                                                                                                      );
                                                                                                                                                                                                                    else
                                                                                                                                                                                                                      _0x403c84();
                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                    if (
                                                                                                                                                                                                                      _0x4078b4 ===
                                                                                                                                                                                                                      'select-all-clips'
                                                                                                                                                                                                                    ) {
                                                                                                                                                                                                                      const _0x3f5857 =
                                                                                                                                                                                                                          getSelectedEpisode(
                                                                                                                                                                                                                            _0x109ee4,
                                                                                                                                                                                                                          ),
                                                                                                                                                                                                                        _0x3be3a1 =
                                                                                                                                                                                                                          (_0x3f5857?.[
                                                                                                                                                                                                                            'clips'
                                                                                                                                                                                                                          ] ||
                                                                                                                                                                                                                            [])
                                                                                                                                                                                                                            [
                                                                                                                                                                                                                              'map'
                                                                                                                                                                                                                            ](
                                                                                                                                                                                                                              (
                                                                                                                                                                                                                                _0x3c0917,
                                                                                                                                                                                                                              ) =>
                                                                                                                                                                                                                                normalizeText(
                                                                                                                                                                                                                                  _0x3c0917?.[
                                                                                                                                                                                                                                    'id'
                                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                                ),
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            [
                                                                                                                                                                                                                              'filter'
                                                                                                                                                                                                                            ](
                                                                                                                                                                                                                              Boolean,
                                                                                                                                                                                                                            );
                                                                                                                                                                                                                      ((_0x109ee4[
                                                                                                                                                                                                                        'selectedClipGenerationIds'
                                                                                                                                                                                                                      ] =
                                                                                                                                                                                                                        _0x3be3a1[
                                                                                                                                                                                                                          'every'
                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                          (
                                                                                                                                                                                                                            _0x5695af,
                                                                                                                                                                                                                          ) =>
                                                                                                                                                                                                                            _0x109ee4[
                                                                                                                                                                                                                              'selectedClipGenerationIds'
                                                                                                                                                                                                                            ][
                                                                                                                                                                                                                              'includes'
                                                                                                                                                                                                                            ](
                                                                                                                                                                                                                              _0x5695af,
                                                                                                                                                                                                                            ),
                                                                                                                                                                                                                        )
                                                                                                                                                                                                                          ? []
                                                                                                                                                                                                                          : _0x3be3a1),
                                                                                                                                                                                                                        (_0x109ee4[
                                                                                                                                                                                                                          'clipSelectionMode'
                                                                                                                                                                                                                        ] =
                                                                                                                                                                                                                          _0x109ee4[
                                                                                                                                                                                                                            'selectedClipGenerationIds'
                                                                                                                                                                                                                          ][
                                                                                                                                                                                                                            'length'
                                                                                                                                                                                                                          ] >
                                                                                                                                                                                                                          0x0),
                                                                                                                                                                                                                        _0x3deaa5(),
                                                                                                                                                                                                                        _0x2e97b0[
                                                                                                                                                                                                                          'querySelector'
                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                          '[data-story-action="select-all-clips"]',
                                                                                                                                                                                                                        )?.[
                                                                                                                                                                                                                          'focus'
                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                          {
                                                                                                                                                                                                                            preventScroll:
                                                                                                                                                                                                                              !![],
                                                                                                                                                                                                                          },
                                                                                                                                                                                                                        ));
                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                      if (
                                                                                                                                                                                                                        _0x4078b4 ===
                                                                                                                                                                                                                        'cancel-clip-selection'
                                                                                                                                                                                                                      )
                                                                                                                                                                                                                        (_0xd0330d[
                                                                                                                                                                                                                          'cancel'
                                                                                                                                                                                                                        ](),
                                                                                                                                                                                                                          (_0x109ee4[
                                                                                                                                                                                                                            'clipSelectionMode'
                                                                                                                                                                                                                          ] =
                                                                                                                                                                                                                            ![]),
                                                                                                                                                                                                                          (_0x109ee4[
                                                                                                                                                                                                                            'selectedClipGenerationIds'
                                                                                                                                                                                                                          ] =
                                                                                                                                                                                                                            []),
                                                                                                                                                                                                                          _0x3deaa5());
                                                                                                                                                                                                                      else {
                                                                                                                                                                                                                        if (
                                                                                                                                                                                                                          _0x4078b4 ===
                                                                                                                                                                                                                          'episode-back'
                                                                                                                                                                                                                        )
                                                                                                                                                                                                                          (_0xd0330d[
                                                                                                                                                                                                                            'cancel'
                                                                                                                                                                                                                          ](),
                                                                                                                                                                                                                            (_0x109ee4[
                                                                                                                                                                                                                              'clipSelectionMode'
                                                                                                                                                                                                                            ] =
                                                                                                                                                                                                                              ![]),
                                                                                                                                                                                                                            (_0x109ee4[
                                                                                                                                                                                                                              'selectedClipGenerationIds'
                                                                                                                                                                                                                            ] =
                                                                                                                                                                                                                              []),
                                                                                                                                                                                                                            void _0x40b04a(
                                                                                                                                                                                                                              canEnterStoryWorkspaceStep(
                                                                                                                                                                                                                                _0x109ee4[
                                                                                                                                                                                                                                  'data'
                                                                                                                                                                                                                                ],
                                                                                                                                                                                                                                0x3,
                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                ? 0x3
                                                                                                                                                                                                                                : 0x1,
                                                                                                                                                                                                                            ));
                                                                                                                                                                                                                        else {
                                                                                                                                                                                                                          if (
                                                                                                                                                                                                                            _0x4078b4 ===
                                                                                                                                                                                                                            'toggle-canvas-sync-menu'
                                                                                                                                                                                                                          ) {
                                                                                                                                                                                                                            const _0x2fb7fd =
                                                                                                                                                                                                                                _0x145f02[
                                                                                                                                                                                                                                  'closest'
                                                                                                                                                                                                                                ](
                                                                                                                                                                                                                                  '.story-canvas-sync-menu-wrap',
                                                                                                                                                                                                                                ),
                                                                                                                                                                                                                              _0x473304 =
                                                                                                                                                                                                                                !_0x2fb7fd?.[
                                                                                                                                                                                                                                  'classList'
                                                                                                                                                                                                                                ][
                                                                                                                                                                                                                                  'contains'
                                                                                                                                                                                                                                ](
                                                                                                                                                                                                                                  'is-open',
                                                                                                                                                                                                                                );
                                                                                                                                                                                                                            _0x403c84();
                                                                                                                                                                                                                            if (
                                                                                                                                                                                                                              _0x473304
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                              _0x158da1(
                                                                                                                                                                                                                                _0x2fb7fd,
                                                                                                                                                                                                                                _0x145f02,
                                                                                                                                                                                                                              );
                                                                                                                                                                                                                            else
                                                                                                                                                                                                                              _0x457f02();
                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                            if (
                                                                                                                                                                                                                              _0x4078b4 ===
                                                                                                                                                                                                                              'sync-episode-to-canvas'
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                              (_0x457f02(),
                                                                                                                                                                                                                                void _0x529a3b());
                                                                                                                                                                                                                            else {
                                                                                                                                                                                                                              if (
                                                                                                                                                                                                                                _0x4078b4 ===
                                                                                                                                                                                                                                'sync-project-to-canvas'
                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                (_0x457f02(),
                                                                                                                                                                                                                                  void _0xd7e322());
                                                                                                                                                                                                                              else {
                                                                                                                                                                                                                                if (
                                                                                                                                                                                                                                  _0x4078b4 ===
                                                                                                                                                                                                                                  'export-current-clip'
                                                                                                                                                                                                                                ) {
                                                                                                                                                                                                                                  const _0x1f6228 =
                                                                                                                                                                                                                                    _0x145f02[
                                                                                                                                                                                                                                      'closest'
                                                                                                                                                                                                                                    ](
                                                                                                                                                                                                                                      '.story-clip-export-menu-wrap',
                                                                                                                                                                                                                                    )?.[
                                                                                                                                                                                                                                      'querySelector'
                                                                                                                                                                                                                                    ](
                                                                                                                                                                                                                                      '.story-menu-trigger',
                                                                                                                                                                                                                                    );
                                                                                                                                                                                                                                  (_0x457f02(),
                                                                                                                                                                                                                                    void _0x1b4994(
                                                                                                                                                                                                                                      'current',
                                                                                                                                                                                                                                      _0x1f6228,
                                                                                                                                                                                                                                    ));
                                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                                  if (
                                                                                                                                                                                                                                    _0x4078b4 ===
                                                                                                                                                                                                                                    'export-episode-clips'
                                                                                                                                                                                                                                  ) {
                                                                                                                                                                                                                                    const _0xb0847d =
                                                                                                                                                                                                                                      _0x145f02[
                                                                                                                                                                                                                                        'closest'
                                                                                                                                                                                                                                      ](
                                                                                                                                                                                                                                        '.story-clip-export-menu-wrap',
                                                                                                                                                                                                                                      )?.[
                                                                                                                                                                                                                                        'querySelector'
                                                                                                                                                                                                                                      ](
                                                                                                                                                                                                                                        '.story-menu-trigger',
                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                    (_0x457f02(),
                                                                                                                                                                                                                                      void _0x1b4994(
                                                                                                                                                                                                                                        'episode',
                                                                                                                                                                                                                                        _0xb0847d,
                                                                                                                                                                                                                                      ));
                                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                                    if (
                                                                                                                                                                                                                                      _0x4078b4 ===
                                                                                                                                                                                                                                      'cancel-clip-batch-generation'
                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                      void _0x36bfa5[
                                                                                                                                                                                                                                        'cancelBatch'
                                                                                                                                                                                                                                      ]();
                                                                                                                                                                                                                                    else {
                                                                                                                                                                                                                                      if (
                                                                                                                                                                                                                                        [
                                                                                                                                                                                                                                          'debug-asset-image',
                                                                                                                                                                                                                                          'debug-clip-video',
                                                                                                                                                                                                                                          'debug-character-voice',
                                                                                                                                                                                                                                        ][
                                                                                                                                                                                                                                          'includes'
                                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                                          _0x4078b4,
                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                      ) {
                                                                                                                                                                                                                                        if (
                                                                                                                                                                                                                                          windowObject?.[
                                                                                                                                                                                                                                            'DEV_MODE'
                                                                                                                                                                                                                                          ] !==
                                                                                                                                                                                                                                          !![]
                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                          return;
                                                                                                                                                                                                                                        openDebugRequestWindow(
                                                                                                                                                                                                                                          {
                                                                                                                                                                                                                                            documentObject:
                                                                                                                                                                                                                                              documentObject,
                                                                                                                                                                                                                                            windowObject:
                                                                                                                                                                                                                                              windowObject,
                                                                                                                                                                                                                                            title:
                                                                                                                                                                                                                                              '剧本工作室请求调试',
                                                                                                                                                                                                                                            prepare:
                                                                                                                                                                                                                                              async () =>
                                                                                                                                                                                                                                                buildGenerationDebugPreview(
                                                                                                                                                                                                                                                  _0x4078b4 ===
                                                                                                                                                                                                                                                    'debug-asset-image'
                                                                                                                                                                                                                                                    ? _0x240aa7[
                                                                                                                                                                                                                                                        'previewSelected'
                                                                                                                                                                                                                                                      ]()
                                                                                                                                                                                                                                                    : _0x4078b4 ===
                                                                                                                                                                                                                                                        'debug-character-voice'
                                                                                                                                                                                                                                                      ? _0x3478a1[
                                                                                                                                                                                                                                                          'previewSelected'
                                                                                                                                                                                                                                                        ]()
                                                                                                                                                                                                                                                      : _0x36bfa5[
                                                                                                                                                                                                                                                          'previewSelection'
                                                                                                                                                                                                                                                        ](),
                                                                                                                                                                                                                                                ),
                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                        return;
                                                                                                                                                                                                                                      } else {
                                                                                                                                                                                                                                        if (
                                                                                                                                                                                                                                          _0x4078b4 ===
                                                                                                                                                                                                                                          'generate-clip-video'
                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                          void _0x46df8c();
                                                                                                                                                                                                                                        else
                                                                                                                                                                                                                                          _0x4078b4 ===
                                                                                                                                                                                                                                            'generate-asset' &&
                                                                                                                                                                                                                                            (_0x145f02[
                                                                                                                                                                                                                                              'dataset'
                                                                                                                                                                                                                                            ][
                                                                                                                                                                                                                                              'storyCardAppearanceId'
                                                                                                                                                                                                                                            ] &&
                                                                                                                                                                                                                                              (updateStoryAssetPromptFromEditor(
                                                                                                                                                                                                                                                _0x109ee4,
                                                                                                                                                                                                                                                _0x54cd25()?.[
                                                                                                                                                                                                                                                  'querySelector'
                                                                                                                                                                                                                                                ](
                                                                                                                                                                                                                                                  '[data-story-asset-prompt][contenteditable="true"]',
                                                                                                                                                                                                                                                ),
                                                                                                                                                                                                                                              ),
                                                                                                                                                                                                                                              _0x49f360(),
                                                                                                                                                                                                                                              (_0x109ee4[
                                                                                                                                                                                                                                                'characterVoiceEditor'
                                                                                                                                                                                                                                              ] =
                                                                                                                                                                                                                                                null),
                                                                                                                                                                                                                                              (_0x109ee4[
                                                                                                                                                                                                                                                'pendingDeleteAssetAppearanceKey'
                                                                                                                                                                                                                                              ] =
                                                                                                                                                                                                                                                ''),
                                                                                                                                                                                                                                              (_0x109ee4[
                                                                                                                                                                                                                                                'selectedAssetId'
                                                                                                                                                                                                                                              ] =
                                                                                                                                                                                                                                                _0x145f02[
                                                                                                                                                                                                                                                  'dataset'
                                                                                                                                                                                                                                                ][
                                                                                                                                                                                                                                                  'storyCardAppearanceId'
                                                                                                                                                                                                                                                ]),
                                                                                                                                                                                                                                              _0x4d5584()),
                                                                                                                                                                                                                                            void _0x3799ed());
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                }
                                                                                                                                                                                                              }
                                                                                                                                                                                                            }
                                                                                                                                                                                                          }
                                                                                                                                                                                                        }
                                                                                                                                                                                                      }
                                                                                                                                                                                                    }
                                                                                                                                                                                                  }
                                                                                                                                                                                                }
                                                                                                                                                                                              }
                                                                                                                                                                                            }
                                                                                                                                                                                          }
                                                                                                                                                                                        }
                                                                                                                                                                                      }
                                                                                                                                                                                    }
                                                                                                                                                                                  }
                                                                                                                                                                                }
                                                                                                                                                                              }
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (_0x167ce5['getRevision']() === _0x503fbb) _0x487a78({ action: _0x4078b4 });
    }),
    _0x2e97b0['addEventListener']('input', (_0x50802a) => {
      if (_0x50802a['target']['matches']('[data-story-custom-episode-count-input]')) {
        const _0x59843a = String(_0x50802a['target']['value'] || '')
          ['replace'](/\D+/gu, '')
          ['slice'](0x0, 0x3);
        _0x50802a['target']['value'] =
          _0x59843a && Number(_0x59843a) > STORY_EPISODE_COUNT_MAX
            ? String(STORY_EPISODE_COUNT_MAX)
            : _0x59843a;
        return;
      }
      if (_0x50802a['target']['matches']('[data-story-clip-adjustment-instruction]')) {
        _0x109ee4['clipAdjustmentInstruction'] = String(_0x50802a['target']['value'] || '')['slice'](
          0x0,
          0x258,
        );
        const _0x544373 = getSelectedEpisode(_0x109ee4),
          _0x2fce8b = getSelectedClip(_0x109ee4, _0x544373),
          _0x2b9aa2 = normalizeStoryPromptMode(
            _0x2fce8b?.['promptMode'] ||
              _0x544373?.['promptMode'] ||
              _0x109ee4['data']['project']?.['planning']?.['promptMode'],
            { allowDeveloperModes: !![] },
          ),
          _0x2bd79d = normalizeStoryPromptMode(_0x109ee4['clipAdjustmentPromptMode'] || _0x2b9aa2, {
            allowDeveloperModes: !![],
          }),
          _0x4e2533 = _0x50802a['target']
            ['closest']('[data-story-clip-adjustment-bar]')
            ?.['querySelector']('[data-story-action=\x22generate-clip-adjustment\x22]');
        _0x4e2533 &&
          (_0x4e2533['disabled'] = !canGenerateStoryClipAdjustment(_0x109ee4, _0x544373, _0x2fce8b));
        return;
      }
      if (_0x50802a['target']['matches']('[data-story-project-search]')) {
        const _0x2c53d5 = String(_0x50802a['target']['value'] || '')['slice'](0x0, 0x78);
        ((_0x109ee4['projectSearchQuery'] = _0x2c53d5),
          (_0x109ee4['openProjectMenuId'] = ''),
          (_0x50802a['target']['value'] = _0x2c53d5));
        const _0x99798a = refreshWorkspaceProjectResultsInPlace({
          root: _0x50802a['target']['closest']?.('.story-home-page') || _0x2e97b0,
          documentObject: documentObject,
          renderResults: () => renderStoryHomeProjectResults(_0x109ee4),
        });
        if (!_0x99798a) _0xb8a26b({ capturePageState: ![] });
        const _0x43d654 = _0x99798a
          ? _0x50802a['target']
          : _0x2e97b0['querySelector']('[data-story-project-search]');
        (_0x43d654?.['focus'](),
          _0x43d654?.['setSelectionRange']?.(_0x2c53d5['length'], _0x2c53d5['length']));
        return;
      }
      if (_0x50802a['target']['matches']('[data-story-character-voice-sample]')) {
        _0x109ee4['characterVoiceEditor'] &&
          (_0x109ee4['characterVoiceEditor']['sampleText'] = String(_0x50802a['target']['value'] || '')[
            'slice'
          ](0x0, STORY_CHARACTER_VOICE_SAMPLE_MAX_CHARACTERS));
        return;
      }
      if (_0x50802a['target']['matches']('[data-story-character-voice-description]')) {
        _0x109ee4['characterVoiceEditor'] &&
          (_0x109ee4['characterVoiceEditor']['voiceDescription'] = String(_0x50802a['target']['value'] || '')[
            'slice'
          ](0x0, 0x258));
        return;
      }
      if (_0x50802a['target']['matches']('[data-story-style-search-input]')) {
        _0x4bd181(_0x50802a['target']['closest']('.story-style-picker'));
        return;
      }
      if (_0x50802a['target']['matches']('[data-story-style-custom-input]')) {
        const _0x25aa19 = String(_0x50802a['target']['value'] || '')['slice'](
          0x0,
          STORY_CUSTOM_STYLE_MAX_CHARACTERS,
        );
        if (_0x50802a['target']['value'] !== _0x25aa19) _0x50802a['target']['value'] = _0x25aa19;
        const _0x31d72b = _0x50802a['target']
          ['closest']('.story-style-custom-editor')
          ?.['querySelector']('[data-story-style-custom-count]');
        if (_0x31d72b)
          _0x31d72b['textContent'] = _0x25aa19['length'] + '\x20/\x20' + STORY_CUSTOM_STYLE_MAX_CHARACTERS;
        return;
      }
      if (_0x50802a['target']['matches']('[data-story-idea-input]'))
        ((_0x109ee4['idea'] = _0x50802a['target']['value']['slice'](0x0, STORY_IDEA_MAX_CHARACTERS)),
          _0x320ec9());
      else {
        if (_0x50802a['target']['matches']('[data-story-paste-input]')) {
          ((_0x109ee4['scriptText'] = _0x50802a['target']['value']['slice'](
            0x0,
            STORY_SCRIPT_MAX_CHARACTERS,
          )),
            (_0x109ee4['scriptCharacterCount'] = _0x109ee4['scriptText']['length']),
            (_0x109ee4['scriptFileName'] = normalizeText(_0x109ee4['scriptText']) ? '粘贴文本' : ''));
          if (!_0x109ee4['hasCreatedProject'])
            _0x109ee4['data']['project']['sourceDocument'] = normalizeText(_0x109ee4['scriptText'])
              ? {
                  fileName: '粘贴文本',
                  text: _0x109ee4['scriptText'],
                  characterCount: _0x109ee4['scriptText']['length'],
                }
              : null;
          _0x320ec9();
        } else {
          if (_0x50802a['target']['matches']('[data-story-outline-field]')) {
            const _0x4fe223 = {
                'story-type': 'storyType',
                'story-target-audience': 'targetAudience',
                'story-logline': 'logline',
                'story-summary': 'summary',
                'story-background': 'background',
                'story-setting': 'setting',
                'story-core-hook': 'coreHook',
              },
              _0x347b76 = _0x4fe223[_0x50802a['target']['dataset']['storyOutlineField']];
            _0x347b76 &&
              ((_0x109ee4['data']['project'][_0x347b76] = _0x50802a['target']['value']),
              markStorySummaryDownstreamStale(_0x109ee4['data']));
          } else {
            if (_0x50802a['target']['matches']('[data-story-contract-field]')) {
              const _0x26bc9c = normalizeText(_0x50802a['target']['dataset']['storyContractField']);
              Object['hasOwn'](STORY_CONTRACT_FIELD_LABELS, _0x26bc9c) &&
                ((_0x109ee4['data']['project']['storyContract'] ||= normalizeGeneratedStoryContract()),
                (_0x109ee4['data']['project']['storyContract'][_0x26bc9c] = _0x50802a['target']['value']),
                markStorySummaryDownstreamStale(_0x109ee4['data']));
            } else {
              if (
                _0x50802a['target']['matches']('[data-story-plot-beat-index][data-story-plot-beat-field]')
              ) {
                const _0x2a7342 = Number(_0x50802a['target']['dataset']['storyPlotBeatIndex']),
                  _0x2a6de3 = normalizeText(_0x50802a['target']['dataset']['storyPlotBeatField']),
                  _0x31be6f = _0x109ee4['data']['project']?.['plotBeats']?.[_0x2a7342];
                _0x31be6f &&
                  ['stage', 'event', 'consequence']['includes'](_0x2a6de3) &&
                  ((_0x31be6f[_0x2a6de3] = _0x50802a['target']['value']),
                  markStorySummaryDownstreamStale(_0x109ee4['data']));
              } else {
                if (_0x50802a['target']['matches']('[data-story-continuity-facts]'))
                  ((_0x109ee4['data']['project']['continuityFacts'] = normalizeGeneratedStoryContinuityFacts(
                    String(_0x50802a['target']['value'] || '')['split'](/\r?\n/u),
                  )),
                    markStorySummaryDownstreamStale(_0x109ee4['data']));
                else {
                  if (_0x50802a['target']['matches']('[data-story-summary-character-field]'))
                    updateStorySummaryCharacterField(
                      _0x109ee4['data']['project']?.['characters'],
                      Number(_0x50802a['target']['dataset']['storySummaryCharacterIndex']),
                      _0x50802a['target']['dataset']['storySummaryCharacterField'],
                      _0x50802a['target']['value'],
                    ) && markStorySummaryDownstreamStale(_0x109ee4['data']);
                  else {
                    if (
                      _0x50802a['target']['matches'](
                        '[data-story-episode-synopsis], [data-story-episode-hook]',
                      )
                    ) {
                      const _0x19f10c = _0x50802a['target']['matches']('[data-story-episode-hook]')
                          ? 'hook'
                          : 'synopsis',
                        _0x16b080 =
                          _0x19f10c === 'hook'
                            ? _0x50802a['target']['dataset']['storyEpisodeHook']
                            : _0x50802a['target']['dataset']['storyEpisodeSynopsis'];
                      updateStoryEpisodeOutlineField(
                        _0x109ee4['data'],
                        _0x16b080,
                        _0x19f10c,
                        _0x50802a['target']['value'],
                      ) && _0x29c6fb();
                    } else {
                      if (_0x50802a['target']['matches']('[data-story-episode-script]')) {
                        const _0x3fbdc9 = _0x109ee4['data']['episodes']['find'](
                          (_0x554540) =>
                            _0x554540['id'] === _0x50802a['target']['dataset']['storyEpisodeScript'],
                        );
                        updateStoryEpisodeScriptText(_0x3fbdc9, _0x50802a['target']['value']) && _0x29c6fb();
                      } else {
                        if (_0x50802a['target']['matches']('[data-story-chapter-title]')) {
                          const _0x1ac173 =
                            _0x109ee4['data']['project']['chapters']?.[
                              Number(_0x50802a['target']['dataset']['storyChapterTitle'])
                            ];
                          _0x1ac173 &&
                            ((_0x1ac173['title'] = _0x50802a['target']['value']),
                            syncProjectChapterContent(_0x109ee4['data']['project']));
                        } else {
                          if (_0x50802a['target']['matches']('[data-story-chapter-content]')) {
                            const _0x330b19 =
                              _0x109ee4['data']['project']['chapters']?.[
                                Number(_0x50802a['target']['dataset']['storyChapterContent'])
                              ];
                            _0x330b19 &&
                              ((_0x330b19['content'] = _0x50802a['target']['value']),
                              syncProjectChapterContent(_0x109ee4['data']['project']));
                          } else {
                            if (_0x50802a['target']['matches']('[data-story-clip-prompt]')) {
                              clearStoryClipAdjustmentUndo(
                                getSelectedClip(_0x109ee4, getSelectedEpisode(_0x109ee4)),
                              );
                              if (shouldSkipPromptTriggerForBulkInput(_0x50802a)) return;
                              (updateSelectedClipPrompt(_0x109ee4, _0x50802a['target']['innerHTML']),
                                _0x2fa8a7());
                            } else {
                              if (_0x50802a['target']['matches']('[data-story-asset-prompt]')) {
                                if (shouldSkipPromptTriggerForBulkInput(_0x50802a)) return;
                                updateStoryAssetPromptFromEditor(_0x109ee4, _0x50802a['target']);
                              } else {
                                if (_0x50802a['target']['matches']('[data-story-model-search-input]')) {
                                  const _0x3c1754 = normalizeText(_0x50802a['target']['value'])[
                                      'toLowerCase'
                                    ](),
                                    _0x56b18e = _0x50802a['target']['closest']('.story-model-picker');
                                  _0x56b18e?.['querySelectorAll']('[data-story-model-option]')['forEach'](
                                    (_0x3c4e14) => {
                                      _0x3c4e14['hidden'] =
                                        Boolean(_0x3c1754) &&
                                        !String(_0x3c4e14['dataset']['storyModelSearch'] || '')['includes'](
                                          _0x3c1754,
                                        );
                                    },
                                  );
                                  return;
                                } else {
                                  if (_0x50802a['target']['matches']('[data-story-project-title]')) {
                                    const _0x2da971 = String(_0x50802a['target']['value'] || '')['slice'](
                                        0x0,
                                        0x78,
                                      ),
                                      _0x4ea6c4 = _0x50802a['target']['dataset']['storyProjectTitle'],
                                      _0x501a14 = _0x109ee4['projects']['find'](
                                        (_0x3a52ee) => String(_0x3a52ee?.['id']) === String(_0x4ea6c4),
                                      );
                                    (_0x501a14?.['data']?.['project'] &&
                                      ((_0x501a14['data']['project']['title'] = _0x2da971),
                                      (_0x501a14['title'] = _0x2da971),
                                      (_0x501a14['projectTitleEdited'] = !![]),
                                      (_0x501a14['updatedAt'] = Date['now']())),
                                      String(_0x109ee4['data']['project']?.['id']) === String(_0x4ea6c4) &&
                                        ((_0x109ee4['data']['project']['title'] = _0x2da971),
                                        (_0x109ee4['projectTitleEdited'] = !![])));
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      _0x487a78();
    }),
    _0x2e97b0['addEventListener']('change', (_0x2f9464) => {
      if (_0x2f9464['target']['matches']('[data-story-custom-episode-count-input]')) {
        _0x3a2ffc(_0x2f9464['target']);
        return;
      }
      if (!_0x2f9464['target']['matches']('[data-story-project-title]')) return;
      const _0x295262 = normalizeText(_0x2f9464['target']['value']) || '未命名故事',
        _0x646ddb = _0x2f9464['target']['dataset']['storyProjectTitle'],
        _0x5e4fe9 = _0x109ee4['projects']['find'](
          (_0x5dd3c4) => String(_0x5dd3c4?.['id']) === String(_0x646ddb),
        );
      (_0x5e4fe9?.['data']?.['project'] &&
        ((_0x5e4fe9['data']['project']['title'] = _0x295262),
        (_0x5e4fe9['title'] = _0x295262),
        (_0x5e4fe9['projectTitleEdited'] = !![]),
        (_0x5e4fe9['updatedAt'] = Date['now']())),
        String(_0x109ee4['data']['project']?.['id']) === String(_0x646ddb) &&
          ((_0x109ee4['data']['project']['title'] = _0x295262), (_0x109ee4['projectTitleEdited'] = !![])),
        (_0x2f9464['target']['value'] = _0x295262),
        _0x487a78({ immediate: !![] }));
    }),
    _0x52dd70?.['addEventListener']('change', async () => {
      const _0x388423 = _0x52dd70['files']?.[0x0];
      if (!_0x388423) return;
      (await _0x919e40(_0x388423), (_0x52dd70['value'] = ''));
    }));
  function _0x2aceaa(_0x23534d = []) {
    const _0x42e11f = Array['from'](_0x23534d || []),
      _0x225a88 = [];
    _0x42e11f['forEach']((_0x29ed64) => {
      const _0xf15b9c = validateStoryReplicationVideoFile(_0x29ed64, _0x109ee4['models']['text']);
      if (_0xf15b9c['ok']) _0x225a88['push'](_0x29ed64);
      else _0x50d1ac(_0xf15b9c['error'], 'warn');
    });
    if (!_0x225a88['length']) return ![];
    const _0x1ed984 = _0x109ee4['replicationSourceFiles'],
      _0x4e1dc6 = _0x109ee4['replicationSourcePreviewUrls'];
    _0x109ee4['replicationSourceFiles'] = mergeStoryReplicationSourceFiles(
      _0x1ed984,
      _0x225a88,
      _0x109ee4['models']['text'],
    );
    const _0x4d623a = new Map(
      _0x1ed984['map']((_0x2ce833, _0x3755ea) => [_0x2ce833, _0x4e1dc6[_0x3755ea] || '']),
    );
    _0x109ee4['replicationSourcePreviewUrls'] = _0x109ee4['replicationSourceFiles']['map'](
      (_0x564607) => _0x4d623a['get'](_0x564607) || _0x5d78d9(_0x564607),
    );
    const _0xe8fcab = _0x44835e['querySelector']('.story-page.is-current .story-home-composer-body');
    return (
      _0xe8fcab && _0x109ee4['view'] === 'home' && _0x109ee4['homeTab'] === 'replication'
        ? (syncStoryReplicationHomeSources(_0xe8fcab, _0x109ee4), _0x320ec9())
        : _0xb8a26b({ capturePageState: ![] }),
      !![]
    );
  }
  _0x46be0a?.['addEventListener']('change', () => {
    const _0x3b6377 = _0x5836f9;
    _0x5836f9 = '';
    if (_0x3b6377 && _0x109ee4['data']?.['project']?.['sourceMode'] === 'video-replication') {
      const _0x4cbbd1 = _0x46be0a['files']?.[0x0],
        _0x187381 = validateStoryReplicationVideoFile(_0x4cbbd1, _0x109ee4['models']['text']);
      if (!_0x187381['ok']) _0x50d1ac(_0x187381['error'], 'warn');
      else {
        const _0x2d6c31 = _0xa88d71(_0x109ee4),
          _0xb9bda2 = normalizeText(_0x2d6c31['projectId']);
        (_0x579b1e['set'](_0xb9bda2 + ':' + _0x3b6377, _0x4cbbd1),
          void _0xc1885b(_0x2d6c31, [{ episodeId: _0x3b6377, file: _0x4cbbd1 }]));
      }
      _0x46be0a['value'] = '';
      return;
    }
    (_0x2aceaa(_0x46be0a['files']), (_0x46be0a['value'] = ''));
  });
  const _0x3bd979 = createStoryAssetImageUploadController({
      state: _0x109ee4,
      createProjectToken: () => _0xa88d71(_0x109ee4),
      isProjectTaskLive: _0x1539c4,
      isProjectTaskCurrent: _0x111644,
      getSelectedAppearance: getSelectedAssetAppearance,
      isLoading: isStoryAssetAppearanceLoading,
      setGenerating: setStoryAssetAppearanceGenerating,
      startTask: _0x2ccfa9,
      finishTask: _0x3cde55,
      applyImageResult: _0x240aa7['applyImageResult'],
      showToast: _0x50d1ac,
      refresh: (_0x3b0679) => {
        _0x12cdc4(_0x3b0679);
        if (_0x109ee4['selectedAssetId'] === _0x3b0679) _0x4d5584();
      },
    }),
    _0x1d63ec = bindStoryAssetImageDrop(_0x2e97b0, { state: _0x109ee4, ..._0x3bd979 });
  (_0x53cb21?.['addEventListener']('change', async () => {
    const _0x17a4c5 = _0x53cb21['files']?.[0x0],
      _0x68b5e6 = _0xc6f8ce;
    ((_0xc6f8ce = null),
      (_0x109ee4['pendingAssetUploadId'] = ''),
      (_0x109ee4['pendingAssetAppearanceId'] = ''),
      (_0x53cb21['value'] = ''),
      await _0x3bd979['upload'](_0x17a4c5, _0x68b5e6));
  }),
    _0x46a449?.['addEventListener']('change', async () => {
      const _0x99e9f7 = _0x46a449['files']?.[0x0],
        _0x5b7c88 = _0x3023cf;
      _0x3023cf = null;
      const _0x456865 = _0x5b7c88?.['projectToken'],
        _0x3a9fde = _0x456865?.['data']?.['assets']?.['find'](
          (_0x11929e) => normalizeText(_0x11929e?.['id']) === normalizeText(_0x5b7c88['assetId']),
        ),
        _0x37c77b = getStoryAssetAppearances(_0x3a9fde)['find'](
          (_0x361e60) => normalizeText(_0x361e60?.['id']) === normalizeText(_0x5b7c88?.['appearanceId']),
        ),
        _0x48589f = normalizeText(_0x99e9f7?.['name'])['toLowerCase'](),
        _0x842e41 =
          String(_0x99e9f7?.['type'] || '')
            ['toLowerCase']()
            ['startsWith']('image/') || /\.(?:avif|bmp|gif|jpe?g|png|webp)$/u['test'](_0x48589f);
      if (!_0x99e9f7 || !_0x456865 || !_0x3a9fde || !_0x37c77b || !_0x1539c4(_0x456865)) {
        _0x46a449['value'] = '';
        return;
      }
      if (!_0x842e41) {
        _0x111644(_0x456865) && _0x50d1ac('风格参考只支持图片文件。', 'warn');
        _0x46a449['value'] = '';
        return;
      }
      if (!isStoryAssetBaseAppearance(_0x3a9fde, _0x37c77b)) {
        _0x111644(_0x456865) && _0x50d1ac('当前形象已不再是基础形象，风格参考未上传。', 'warn');
        _0x46a449['value'] = '';
        return;
      }
      const _0x5c2fdd = buildStoryBackgroundTaskId('asset-reference-image-upload', {
        assetId: _0x3a9fde['id'],
        appearanceId: _0x37c77b['id'],
      });
      _0x111644(_0x456865) &&
        (setStoryAssetAppearanceGenerating(_0x109ee4, _0x3a9fde['id'], _0x37c77b['id'], !![]), _0xb8a26b());
      _0x2ccfa9(_0x456865, {
        id: _0x5c2fdd,
        type: 'asset-image-upload',
        scope: { assetId: _0x3a9fde['id'], appearanceId: _0x37c77b['id'] },
        label: '上传' + (normalizeText(_0x3a9fde['name']) || '基础形象') + '风格参考',
        message: '正在保存风格参考',
      });
      try {
        const _0x1e59bf = await uploadFile(_0x99e9f7, _0x456865['projectId']);
        if (!_0x1539c4(_0x456865)) return;
        if (!buildCanvasLocalImageFields(_0x1e59bf)['imageUrl'])
          throw new Error('风格参考保存结果缺少可用地址');
        (setStoryAssetAppearanceReferenceImage(_0x37c77b, _0x1e59bf),
          _0x3cde55(_0x456865, _0x5c2fdd, { status: 'succeeded', message: '风格参考已保存' }),
          _0x111644(_0x456865) && (_0xb8a26b(), _0x50d1ac('风格参考已上传，并已补充提示词。', 'success')));
      } catch (_0xe99efd) {
        if (!_0x1539c4(_0x456865)) return;
        (_0x3cde55(_0x456865, _0x5c2fdd, {
          status: 'failed',
          message: '风格参考保存失败',
          error: _0xe99efd?.['message'] || '风格参考上传失败，请稍后重试。',
        }),
          _0x111644(_0x456865) &&
            _0x50d1ac(_0xe99efd?.['message'] || '风格参考上传失败，请稍后重试。', 'error'));
      } finally {
        (_0x111644(_0x456865) &&
          (setStoryAssetAppearanceGenerating(_0x109ee4, _0x3a9fde['id'], _0x37c77b['id'], ![]), _0xb8a26b()),
          (_0x46a449['value'] = ''));
      }
    }));
  async function _0x4dd90d(_0x26157c, _0x4fe14e) {
    const _0x1accc5 = _0x5aee6c || {};
    _0x5aee6c = null;
    const _0x85b805 = _0x1accc5['projectToken'] || _0xa88d71(_0x109ee4),
      _0x6bff7c = _0x85b805['data']?.['assets']?.['find'](
        (_0x46add3) => normalizeText(_0x46add3?.['id']) === normalizeText(_0x4fe14e),
      );
    if (!_0x26157c || !_0x6bff7c || _0x6bff7c['kind'] !== 'character') return;
    const _0x21f207 = _0x111644(_0x85b805) ? _0x109ee4 : deriveStoryProjectTaskState(_0x85b805['data']);
    if (isStoryAssetVoiceLoading(_0x21f207, _0x6bff7c['id'])) {
      _0x111644(_0x85b805) && _0x50d1ac('请等待当前生成任务完成。', 'info');
      return;
    }
    const _0x111d68 =
      _0x1accc5['editor']?.['assetId'] === _0x6bff7c['id']
        ? _0x1accc5['editor']
        : _0x109ee4['characterVoiceEditor']?.['assetId'] === _0x6bff7c['id']
          ? _0x109ee4['characterVoiceEditor']
          : null;
    if (!isSupportedStoryCharacterVoiceFile(_0x26157c)) {
      _0x111d68 && (_0x111d68['error'] = '仅支持\x20MP3、WAV\x20或\x20M4A\x20音频文件。');
      if (_0x111644(_0x85b805)) _0xb8a26b();
      return;
    }
    const _0x255aba = buildStoryBackgroundTaskId('asset-voice-upload', { assetId: _0x6bff7c['id'] });
    _0x111644(_0x85b805) &&
      (setStoryAssetVoiceGenerating(_0x109ee4, _0x6bff7c['id'], !![]),
      _0x109ee4['characterVoiceEditor']?.['assetId'] === _0x6bff7c['id'] &&
        (_0x109ee4['characterVoiceEditor']['isGenerating'] = !![]),
      _0xb8a26b());
    _0x2ccfa9(_0x85b805, {
      id: _0x255aba,
      type: 'asset-voice-upload',
      scope: { assetId: _0x6bff7c['id'] },
      label: '上传' + (normalizeText(_0x6bff7c['name']) || '角色') + '声音',
      message: '正在保存本地音频',
    });
    try {
      const _0x469195 = await uploadFile(_0x26157c, _0x85b805['projectId']);
      if (!_0x1539c4(_0x85b805)) return ![];
      const _0x2eae19 = normalizeStoryCharacterVoiceReference({
        source: 'upload',
        audioUrl:
          _0x469195?.['displayUrl'] ||
          _0x469195?.['url'] ||
          _0x469195?.['originalUrl'] ||
          _0x469195?.['localUrl'],
        localPath: _0x469195?.['localPath'] || _0x469195?.['originalLocalPath'] || _0x469195?.['path'],
        fileName: _0x26157c['name'],
        sampleText: _0x111d68?.['sampleText'],
        voiceDescription: _0x111d68?.['voiceDescription'],
        updatedAt: Date['now'](),
      });
      if (!_0x2eae19) throw new Error('音频保存结果缺少可用地址');
      if (_0x111644(_0x85b805)) _0x49f360();
      return (
        replaceStoryCharacterVoiceReference(_0x6bff7c, _0x2eae19),
        _0x3cde55(_0x85b805, _0x255aba, { status: 'succeeded', message: '本地音频已保存' }),
        _0x111644(_0x85b805) &&
          (_0x109ee4['characterVoiceEditor']?.['assetId'] === _0x6bff7c['id'] &&
            (_0x109ee4['characterVoiceEditor']['error'] = ''),
          _0xb8a26b(),
          _0x50d1ac('角色声音参考已上传。', 'success')),
        !![]
      );
    } catch (_0x29862e) {
      if (!_0x1539c4(_0x85b805)) return ![];
      return (
        _0x111d68 && (_0x111d68['error'] = _0x29862e?.['message'] || '声音参考上传失败。'),
        _0x3cde55(_0x85b805, _0x255aba, {
          status: 'failed',
          message: '本地音频保存失败',
          error: _0x29862e?.['message'] || '声音参考上传失败。',
        }),
        _0x111644(_0x85b805) &&
          (_0x109ee4['characterVoiceEditor']?.['assetId'] === _0x6bff7c['id'] &&
            (_0x109ee4['characterVoiceEditor']['error'] = _0x29862e?.['message'] || '声音参考上传失败。'),
          _0xb8a26b()),
        ![]
      );
    } finally {
      _0x111644(_0x85b805) &&
        (setStoryAssetVoiceGenerating(_0x109ee4, _0x6bff7c['id'], ![]),
        _0x109ee4['characterVoiceEditor']?.['assetId'] === _0x6bff7c['id'] &&
          (_0x109ee4['characterVoiceEditor']['isGenerating'] = ![]),
        _0xb8a26b());
    }
  }
  (_0x4ce129?.['addEventListener']('change', async () => {
    const _0x1c0732 = _0x4ce129['files']?.[0x0],
      _0x34c6f5 = _0x56abf0 || {
        projectToken: _0xa88d71(_0x109ee4),
        assetId: _0x109ee4['pendingCharacterVoiceAssetId'],
        editor: _0x109ee4['characterVoiceEditor'],
      };
    ((_0x56abf0 = null),
      (_0x109ee4['pendingCharacterVoiceAssetId'] = ''),
      (_0x5aee6c = _0x34c6f5),
      await _0x4dd90d(_0x1c0732, _0x34c6f5['assetId']),
      (_0x4ce129['value'] = ''));
  }),
    _0x10678e?.['addEventListener']('change', async () => {
      const _0x173d4a = _0x10678e['files']?.[0x0];
      (await _0x5711da(_0x173d4a), (_0x10678e['value'] = ''));
    }),
    _0x2e97b0['addEventListener']('dragover', (_0x56cf25) => {
      if (projectPackages?.['hasProjectPackageDrag']?.(_0x56cf25['dataTransfer'])) {
        (_0x56cf25['preventDefault'](), _0x56cf25['stopPropagation']());
        if (_0x56cf25['dataTransfer']) _0x56cf25['dataTransfer']['dropEffect'] = 'copy';
        return;
      }
      const _0x34b02b = _0x56cf25['target']['closest']('[data-story-replication-grid]');
      if (_0x34b02b && _0x5df8d0) {
        (_0x56cf25['preventDefault'](), _0x56cf25['stopPropagation']());
        if (_0x56cf25['dataTransfer']) _0x56cf25['dataTransfer']['dropEffect'] = 'move';
        const _0x38a601 = [..._0x34b02b['querySelectorAll']('article[data-story-replication-episode-id]')][
            'find'
          ]((_0x13787f) => normalizeText(_0x13787f['dataset']['storyReplicationEpisodeId']) === _0x5df8d0),
          _0x2551dd = _0x56cf25['target']['closest']('article[data-story-replication-episode-id]');
        _0x38a601 &&
          _0x2551dd &&
          _0x2551dd !== _0x38a601 &&
          previewReplicationCardOrder(_0x34b02b, _0x38a601, _0x2551dd);
        return;
      }
      const _0x59228e = _0x56cf25['target']['closest']('[data-story-clip-prompt-surface]');
      if (_0x59228e && (_0x31318e || hasStoryAssetDragData(_0x56cf25['dataTransfer']))) {
        (_0x56cf25['preventDefault'](), _0x56cf25['stopPropagation']());
        if (_0x56cf25['dataTransfer']) _0x56cf25['dataTransfer']['dropEffect'] = 'copy';
        (_0x59228e['classList']['add']('is-story-asset-drop-target'),
          _0x4bbd06(_0x59228e['querySelector']?.('[data-story-clip-prompt]'), _0x56cf25));
        return;
      }
      const _0x30034a = _0x56cf25['target']['closest']('[data-story-character-voice-drop]');
      if (_0x30034a) {
        (_0x56cf25['preventDefault'](), _0x56cf25['stopPropagation']());
        if (_0x56cf25['dataTransfer']) _0x56cf25['dataTransfer']['dropEffect'] = 'copy';
        _0x30034a['classList']['add']('is-dragover');
        return;
      }
      const _0x2d6860 = _0x56cf25['target']['closest']('[data-story-replication-drop]');
      if (_0x2d6860) {
        (_0x56cf25['preventDefault'](), _0x56cf25['stopPropagation']());
        if (_0x56cf25['dataTransfer']) _0x56cf25['dataTransfer']['dropEffect'] = 'copy';
        _0x2d6860['classList']['add']('is-dragover');
        return;
      }
      handleStoryHomeDocumentDragOver(_0x56cf25);
    }),
    _0x2e97b0['addEventListener']('dragleave', (_0x2616cc) => {
      const _0x265523 = _0x2616cc['target']['closest']('[data-story-clip-prompt-surface]');
      _0x265523 &&
        !_0x265523['contains'](_0x2616cc['relatedTarget']) &&
        (_0x265523['classList']['remove']('is-story-asset-drop-target'), _0x650343());
      const _0x3d5ddb = _0x2616cc['target']['closest']('[data-story-character-voice-drop]');
      _0x3d5ddb &&
        !_0x3d5ddb['contains'](_0x2616cc['relatedTarget']) &&
        _0x3d5ddb['classList']['remove']('is-dragover');
      handleStoryHomeDocumentDragLeave(_0x2616cc);
      const _0x2293cc = _0x2616cc['target']['closest']('[data-story-replication-drop]');
      _0x2293cc &&
        !_0x2293cc['contains'](_0x2616cc['relatedTarget']) &&
        _0x2293cc['classList']['remove']('is-dragover');
    }),
    _0x2e97b0['addEventListener']('drop', async (_0x30cdc4) => {
      if (projectPackages?.['importProjectFromDrop']?.(_0x30cdc4)) return;
      const _0x20ebd8 = _0x30cdc4['target']['closest']('[data-story-replication-grid]');
      if (_0x20ebd8 && _0x5df8d0) {
        (_0x30cdc4['preventDefault'](), _0x30cdc4['stopPropagation']());
        const _0x5cd63f = [..._0x20ebd8['querySelectorAll']('article[data-story-replication-episode-id]')][
          'map'
        ]((_0x2cdd30) => normalizeText(_0x2cdd30['dataset']['storyReplicationEpisodeId']));
        (settleReplicationCardMotion(_0x20ebd8),
          (_0x109ee4['data']['episodes'] = reorderStoryVideoReplicationEpisodes(
            _0x109ee4['data']['episodes'],
            _0x5cd63f,
          )),
          syncStoryVideoReplicationProject(_0x109ee4['data']),
          _0x109ee4['data']['episodes']['forEach']((_0x12faa2, _0x2ba1bc) => {
            const _0x24c120 = [
              ..._0x20ebd8['querySelectorAll']('article[data-story-replication-episode-id]'),
            ]['find'](
              (_0x66266b) =>
                normalizeText(_0x66266b['dataset']['storyReplicationEpisodeId']) === _0x12faa2['id'],
            );
            syncStoryVideoReplicationCardElement(_0x24c120, _0x12faa2, _0x2ba1bc);
          }),
          _0x20ebd8['querySelectorAll']('.story-replication-card.is-reordering')['forEach']((_0x23546a) =>
            _0x23546a['classList']['remove']('is-reordering'),
          ),
          (_0x5df8d0 = ''),
          (_0x7dc14 = []),
          _0x20ebd8['classList']['remove']('is-reordering'),
          _0x487a78({ immediate: !![] }));
        return;
      }
      const _0x552ab3 = _0x30cdc4['target']['closest']('[data-story-clip-prompt-surface]'),
        _0x1a4f8d = readStoryAssetDragData(_0x30cdc4['dataTransfer']) || _0x31318e,
        _0x1e2cd3 = readStoryAssetDragItemIndex(_0x30cdc4['dataTransfer']) || _0x398985;
      if (_0x552ab3 && _0x1a4f8d) {
        (_0x30cdc4['preventDefault'](), _0x30cdc4['stopPropagation']());
        const _0x33312a = _0x552ab3['querySelector']?.('[data-story-clip-prompt]'),
          _0x356073 = _0x4bbd06(_0x33312a, _0x30cdc4);
        _0x132152();
        !_0x3c392f(_0x1a4f8d, { assetIndex: _0x1e2cd3, triggerRange: _0x356073 }) &&
          _0x50d1ac('素材引用添加失败，请重试。', 'error');
        return;
      }
      const _0x4596d4 = _0x30cdc4['target']['closest']('[data-story-character-voice-drop]');
      if (_0x4596d4) {
        (_0x30cdc4['preventDefault'](),
          _0x30cdc4['stopPropagation'](),
          _0x4596d4['classList']['remove']('is-dragover'));
        const _0x569445 = _0x30cdc4['dataTransfer']?.['files']?.[0x0];
        await _0x4dd90d(_0x569445, _0x109ee4['characterVoiceEditor']?.['assetId']);
        return;
      }
      const _0x19b7bf = _0x30cdc4['target']['closest']('[data-story-replication-drop]');
      if (_0x19b7bf) {
        (_0x30cdc4['preventDefault'](),
          _0x30cdc4['stopPropagation'](),
          _0x19b7bf['classList']['remove']('is-dragover'),
          _0x2aceaa(_0x30cdc4['dataTransfer']?.['files']));
        return;
      }
      await handleStoryHomeDocumentDrop(_0x30cdc4, _0x919e40);
    }),
    documentObject['addEventListener']('click', (_0x139ce5) => {
      if (storyClipProduction['shouldCloseAdjustmentOnOutsideClick'](_0x109ee4, _0x139ce5['target']))
        ((_0x109ee4['clipAdjustmentOpen'] = ![]),
          (_0x109ee4['clipAdjustmentPromptModeOpen'] = ![]),
          (_0x109ee4['clipAdjustmentLanguageOpen'] = ![]),
          _0x5be567());
      else
        (_0x109ee4['clipAdjustmentPromptModeOpen'] || _0x109ee4['clipAdjustmentLanguageOpen']) &&
          !_0x139ce5['target']['closest']?.('[data-story-clip-adjustment-mode]') &&
          ((_0x109ee4['clipAdjustmentPromptModeOpen'] = ![]),
          (_0x109ee4['clipAdjustmentLanguageOpen'] = ![]),
          _0x3adde1(),
          _0x3adde1({ kind: 'language' }));
      (storyClipProduction['shouldClosePromptHistoryOnOutsideClick'](_0x109ee4, _0x139ce5['target']) &&
        ((_0x109ee4['clipPromptHistoryOpen'] = ![]), _0x2298ed()),
        !_0x2e97b0['contains'](_0x139ce5['target']) &&
          (_0x1ac9be(''), _0x475004(), _0x345d08(), _0x76c71e(), _0x403c84(), _0x457f02(), _0x593e47()));
    }));
  const _0x2e8331 = subscribeAssetMentionRegistry(() => {
      if (
        _0x57f246 &&
        _0x109ee4['view'] === 'project' &&
        _0x109ee4['step'] === 0x2 &&
        _0x109ee4['assetFilter'] === 'library'
      ) {
        _0xb8a26b();
        return;
      }
      if (_0x57f246 && _0x109ee4['view'] === 'episode') {
        if (!_0x1adf2f({ refreshContent: !![] })) _0xb8a26b();
      }
    }),
    _0x15ab42 =
      typeof subscribeCanvasNodeDeletions === 'function' ? subscribeCanvasNodeDeletions(_0x2bdfc4) : null,
    _0x3f7dbf =
      typeof subscribeCanvasMediaNodeChanges === 'function'
        ? subscribeCanvasMediaNodeChanges(_0x4a9030)
        : null;
  async function _0x2e99b5() {
    if (typeof loadWorkspace !== 'function') {
      _0x167ce5['setReady'](!![]);
      return;
    }
    const _0x16edda = _0x167ce5['getRevision'](),
      _0x584d85 = createStoryWorkspaceSnapshot(_0x109ee4);
    let _0x16acb5 = ![],
      _0x430813 = ![];
    try {
      const _0x3afea5 = await loadWorkspace();
      await waitForRuntimeManifestLoad({ timeoutMs: 0x1f4 });
      const _0xd9122f = parseStoryWorkspaceSnapshotPayload(_0x3afea5);
      if (_0xd9122f) {
        const _0xa3cd55 = _0xd9122f['projects']['map']((_0x48a4c3) => {
            const _0x188c13 = _0x48a4c3?.['data']
              ? normalizeStoryWorkspaceAssetData(_0x48a4c3['data'])
              : _0x48a4c3?.['data'];
            return (reconcilePersistedStoryProjectTasks(_0x188c13), { ..._0x48a4c3, data: _0x188c13 });
          }),
          _0x494b2e =
            _0x167ce5['getRevision']() !== _0x16edda ||
            hasStoryWorkspaceSnapshotChanged(_0x584d85, createStoryWorkspaceSnapshot(_0x109ee4));
        if (_0x494b2e)
          (_0x2f0de7['restoreEntries'](
            mergeStoryWorkspaceHydratedProjects(_0x109ee4['projects'], _0xa3cd55),
            { preserveLive: !![] },
          ),
            (_0x16acb5 = _0xa3cd55['length'] > 0x0),
            _0x167ce5['schedule']());
        else {
          (_0x2f0de7['restoreEntries'](_0xa3cd55),
            _0x1cfd62(_0x109ee4),
            _0x2f0de7['replaceCurrent'](normalizeStoryWorkspaceAssetData(_0xd9122f['currentData'])),
            reconcilePersistedStoryProjectTasks(_0x109ee4['data']),
            (_0x109ee4['data']['project']['planning'] = normalizeStoryProjectPlanning(
              _0x109ee4['data']['project'],
              { allowDeveloperPromptModes: _0x109ee4['developerModeAvailable'] },
            )),
            (_0x109ee4['hasCreatedProject'] = _0xd9122f['hasCreatedProject'] === !![]),
            (_0x109ee4['projectTitleEdited'] = _0xd9122f['projectTitleEdited'] === !![]),
            (_0x109ee4['models'] = { ..._0x109ee4['models'], ..._0xd9122f['models'] }),
            (_0x109ee4['textProvider'] =
              _0xd9122f['modelProviders']?.['text'] ||
              getStoryWorkspaceModelChoice('text', _0x109ee4['models']['text'])?.['provider'] ||
              _0x109ee4['textProvider']),
            (_0x109ee4['textProviderProfileId'] = resolveStoryTextProviderProfileId(
              _0x109ee4['textProvider'],
              _0xd9122f['modelProviderProfiles']?.['text'] || _0x109ee4['textProviderProfileId'],
            )),
            (_0x109ee4['imageProvider'] = resolveModelProvider(
              _0x109ee4['models']['image'],
              _0xd9122f['modelProviders']?.['image'] || _0x109ee4['imageProvider'],
            )),
            (_0x109ee4['imageGenerationParams'] = normalizeStoryImageGenerationParams(
              _0x109ee4['models']['image'],
              _0xd9122f['modelParams']?.['image'],
            )),
            (_0x109ee4['imageGenerationParamsByModel'] =
              _0xd9122f['modelParams']?.['imageByModel'] &&
              typeof _0xd9122f['modelParams']['imageByModel'] === 'object'
                ? { ..._0xd9122f['modelParams']['imageByModel'] }
                : {}),
            (_0x109ee4['videoProvider'] = resolveStoryVideoProvider(
              _0x109ee4['models']['video'],
              _0xd9122f['modelProviders']?.['video'] || _0x109ee4['videoProvider'],
            )),
            (_0x109ee4['videoProviderProfileIdByModel'] =
              _0xd9122f['modelProviderProfiles']?.['videoByModel'] &&
              typeof _0xd9122f['modelProviderProfiles']['videoByModel'] === 'object'
                ? { ..._0xd9122f['modelProviderProfiles']['videoByModel'] }
                : {}),
            (_0x109ee4['videoProviderProfileId'] = resolveModelProviderProfileId({
              model: _0x109ee4['models']['video'],
              providerProfileId:
                _0xd9122f['modelProviderProfiles']?.['video'] || _0x109ee4['videoProviderProfileId'],
              providerProfileIdByModel: _0x109ee4['videoProviderProfileIdByModel'],
            })),
            (_0x109ee4['videoGenerationParams'] = normalizeStoryVideoGenerationParams(
              _0x109ee4['models']['video'],
              _0xd9122f['modelParams']?.['video'],
            )),
            (_0x109ee4['videoGenerationParamsByModel'] =
              _0xd9122f['modelParams']?.['videoByModel'] &&
              typeof _0xd9122f['modelParams']['videoByModel'] === 'object'
                ? { ..._0xd9122f['modelParams']['videoByModel'] }
                : {}),
            (_0x109ee4['view'] = ['home', 'project', 'episode']['includes'](_0xd9122f['ui']['view'])
              ? _0xd9122f['ui']['view']
              : 'home'));
          const _0x2ed6f1 = normalizeStoryWorkspaceStep(_0xd9122f['ui']['step']);
          _0x109ee4['step'] = canEnterStoryWorkspaceStep(_0x109ee4['data'], _0x2ed6f1)
            ? _0x2ed6f1
            : _0x109ee4['data']['project']['collaboration']?.['stage'] === 'writing'
              ? 0x0
              : 0x1;
          _0x109ee4['view'] === 'episode' &&
            !canEnterStoryWorkspaceStep(_0x109ee4['data'], 0x3) &&
            (_0x109ee4['view'] = 'project');
          ((_0x109ee4['homeTab'] = resolveStoryVideoReplicationHomeTab(
            _0x109ee4,
            _0xd9122f['ui']['homeTab'],
          )),
            (_0x109ee4['replicationAsrProvider'] =
              _0xd9122f['ui']['replicationAsrProvider'] || 'volcengine-speech'),
            (_0x109ee4['replicationTargetLocale'] = getStoryReplicationLocale(
              _0xd9122f['ui']['replicationTargetLocale'] || 'zh-CN',
            )['value']),
            (_0x109ee4['scriptMode'] = normalizeStoryScriptMode(
              _0xd9122f['ui']['scriptMode'] || _0x109ee4['data']['project']?.['scriptMode'],
            )),
            (_0x109ee4['uploadInputMode'] =
              _0xd9122f['ui']['uploadInputMode'] === 'paste' ? 'paste' : 'file'),
            (_0x109ee4['idea'] = String(_0xd9122f['ui']['idea'] || '')['slice'](
              0x0,
              STORY_IDEA_MAX_CHARACTERS,
            )),
            (_0x109ee4['scriptFileName'] = String(_0xd9122f['ui']['scriptFileName'] || '')),
            (_0x109ee4['scriptText'] = String(_0xd9122f['ui']['scriptText'] || '')['slice'](
              0x0,
              STORY_SCRIPT_MAX_CHARACTERS,
            )),
            (_0x109ee4['scriptCharacterCount'] = Number['isFinite'](_0xd9122f['ui']['scriptCharacterCount'])
              ? _0xd9122f['ui']['scriptCharacterCount']
              : null));
          const _0x30de36 = _0x109ee4['data']['project']?.['sourceDocument'];
          _0x30de36 &&
            typeof _0x30de36 === 'object' &&
            ((_0x109ee4['scriptFileName'] = String(_0x30de36['fileName'] || _0x109ee4['scriptFileName'])),
            (_0x109ee4['scriptText'] = String(_0x30de36['text'] || _0x109ee4['scriptText'])['slice'](
              0x0,
              STORY_SCRIPT_MAX_CHARACTERS,
            )),
            (_0x109ee4['scriptCharacterCount'] = Number['isFinite'](_0x30de36['characterCount'])
              ? _0x30de36['characterCount']
              : _0x109ee4['scriptText']['length']));
          ((_0x109ee4['assetFilter'] = _0xd9122f['ui']['assetFilter'] || _0x109ee4['assetFilter']),
            (_0x109ee4['assetSplitRatio'] = normalizeStoryAssetSplitRatio(
              _0xd9122f['ui']['assetSplitRatio'],
            )),
            (_0x109ee4['assetDetailSplitRatio'] = normalizeStoryAssetDetailSplitRatio(
              _0xd9122f['ui']['assetDetailSplitRatio'],
            )));
          const _0x50201f = normalizeStoryEpisodePanelRatios(
            _0xd9122f['ui']['episodeAssetPanelRatio'],
            _0xd9122f['ui']['episodeEditorPanelRatio'],
          );
          ((_0x109ee4['episodeAssetPanelRatio'] = _0x50201f['left']),
            (_0x109ee4['episodeEditorPanelRatio'] = _0x50201f['center']),
            (_0x109ee4['episodeAssetRailTab'] = normalizeStoryEpisodeAssetRailTab(
              _0xd9122f['ui']['episodeAssetRailTab'],
            )),
            (_0x109ee4['assetAppearanceIndexes'] =
              _0xd9122f['ui']['assetAppearanceIndexes'] &&
              typeof _0xd9122f['ui']['assetAppearanceIndexes'] === 'object'
                ? { ..._0xd9122f['ui']['assetAppearanceIndexes'] }
                : {}),
            (_0x109ee4['outlineSectionOpenState'] =
              _0xd9122f['ui']['outlineSectionOpenState'] &&
              typeof _0xd9122f['ui']['outlineSectionOpenState'] === 'object'
                ? { ..._0xd9122f['ui']['outlineSectionOpenState'] }
                : {}),
            (_0x109ee4['pageScrollPositions'] =
              _0xd9122f['ui']['pageScrollPositions'] &&
              typeof _0xd9122f['ui']['pageScrollPositions'] === 'object'
                ? { ..._0xd9122f['ui']['pageScrollPositions'] }
                : {}),
            (_0x109ee4['experimentalSplitMode'] = _0xd9122f['ui']['experimentalSplitMode'] === !![]),
            (_0x109ee4['selectedAssetId'] = _0xd9122f['ui']['selectedAssetId'] || ''),
            (_0x109ee4['selectedEpisodeId'] = _0xd9122f['ui']['selectedEpisodeId'] || ''),
            (_0x109ee4['selectedClipId'] = _0xd9122f['ui']['selectedClipId'] || ''),
            (_0x109ee4['characterVoiceEditor'] = normalizeStoryProjectVoiceEditor(
              _0xd9122f['ui']['characterVoiceEditor'],
              _0x109ee4['data'],
            )),
            _0x150704(_0x109ee4['data']));
          const _0x30f836 = getSelectedEpisode(_0x109ee4);
          ((_0x430813 = _0x5bfff6(getSelectedClip(_0x109ee4, _0x30f836), {
            episode: _0x30f836,
            enteringEpisode: _0x109ee4['view'] === 'episode',
          })),
            (_0x16acb5 = !![]));
          if (_0x109ee4['workspaceSurface'])
            selectStoryWorkspaceSurface(_0x109ee4, _0x109ee4['workspaceSurface']);
          if (_0x57f246) _0xb8a26b({ capturePageState: ![] });
        }
      }
    } catch (_0x4cf0e2) {
      (console['warn']('[storyWorkspace] 用户数据加载失败', _0x4cf0e2),
        _0x167ce5['setHydrationError'](_0x4cf0e2),
        _0x50d1ac('历史剧本项目加载失败，已暂停自动保存以防覆盖数据。', 'error', 0x2710));
      return;
    }
    _0x167ce5['setReady'](!![]);
    typeof getCanvasMediaSnapshot === 'function' && _0x4a9030(getCanvasMediaSnapshot() || {});
    _0x430813 && _0x487a78({ immediate: !![] });
    if (_0x16acb5 && !_0x579cca)
      for (const _0x153938 of _0x2f0de7['getAllData']()) {
        (_0x58b0ac(_0x153938), _0x53d4c1(_0x153938));
      }
    _0x16acb5 &&
      !_0x579cca &&
      void backfillStoryVideoThumbnails(_0x2f0de7['getAllData'](), { concurrency: 0x1 })
        ['then']((_0x5f2714) => {
          if (_0x579cca || !_0x5f2714['updatedCount']) return;
          _0x487a78({ immediate: !![] });
          if (!_0x57f246) return;
          if (_0x109ee4['view'] === 'project' && _0x109ee4['step'] === 0x3)
            _0x5f2714['changedEpisodeIds']['forEach']((_0x4f5695) => {
              _0x16bd81(_0x4f5695);
            });
          else
            _0x109ee4['view'] === 'episode' &&
              _0x5f2714['changedEpisodeIds']['includes'](normalizeText(_0x109ee4['selectedEpisodeId'])) &&
              (_0x15d8ff(), _0x5f0bd5());
        })
        ['catch']((_0x134f5e) => {
          console['warn']('[storyWorkspace]\x20历史视频缩略图补全失败', _0x134f5e);
        });
  }
  _0xdac690 = createStoryCollaboration({
    state: _0x109ee4,
    root: _0x2e97b0,
    projectData: _0x2f0de7,
    save: _0x487a78,
    render: _0xb8a26b,
    beginProjectSession: _0x3d765a,
    isActive: () => _0x57f246,
    showToast: _0x50d1ac,
    resetCreationState: _0x331cec,
  });
  const _0x352fe1 = {
    collaboration: _0xdac690,
    activate: _0x5062b4,
    deactivate: _0x15fd10,
    isActive: () => _0x57f246,
    flushPersistence() {
      return _0x167ce5['destroy']({ flush: !![], force: !![] })['then'](
        () => !![],
        () => ![],
      );
    },
    getProjectWorkspaceMode: () => getStoryProjectWorkspaceMode(_0x109ee4['data']?.['project']),
    openHome() {
      _0x109ee4['view'] = 'home';
      if (_0x57f246) _0xb8a26b();
      else requestWorkspaceMode(_0x109ee4['workspaceSurface'] || 'story');
    },
    openProject() {
      (requestWorkspaceMode(getStoryProjectWorkspaceMode(_0x109ee4['data']?.['project'])), _0x18f74e());
    },
    importProjectPackageResult: _0x1ea29a,
    destroy() {
      (_0x1d63ec['destroy'](),
        _0x15fd10(),
        _0xdac690['destroy'](),
        (_0x579cca = !![]),
        _0x3cc085['dispose'](),
        _0x3c10f8(),
        closeStoryRequestDebugPreview(documentObject),
        _0x2839d9['destroy'](),
        _0x594051['destroy'](),
        _0xd0330d['destroy'](),
        _0x3d21f9['forEach']((_0xd14cf9) => _0xd14cf9['pause']()),
        _0x3d21f9['clear'](),
        _0x36feea['clear'](),
        _0x579b1e['clear'](),
        _0x926d10(),
        _0x378f1f({ clearState: !![] }),
        _0x2c041c['destroy'](),
        _0x27857a?.['destroy'](),
        (_0x27857a = null),
        _0x132152(),
        _0x3478a1['destroy'](),
        void _0x352fe1['flushPersistence'](),
        _0x51b855['destroy'](),
        _0x177bdc?.(),
        _0x2e8331?.(),
        _0x15ab42?.(),
        _0x3f7dbf?.(),
        _0x44835e['querySelectorAll'](':scope\x20>\x20.story-page')['forEach'](_0x1206b1),
        _0x89ceea(),
        _0x2e97b0['removeEventListener']('error', handleWorkspaceAssetLibraryImageError, !![]),
        windowObject?.['removeEventListener']?.('pointermove', _0xa05991, !![]),
        windowObject?.['removeEventListener']?.('pointerup', _0x4a7636, !![]),
        windowObject?.['removeEventListener']?.('pointercancel', _0x26aeab, !![]),
        _0x1e2d82['destroy'](),
        windowObject?.['removeEventListener']?.('keydown', _0x40e91d, !![]),
        windowObject?.['removeEventListener']?.('aicanvas:runtime-info', _0x51f555),
        windowObject?.['removeEventListener']?.('dev-mode-changed', _0x51f555),
        _0x2e97b0['remove']());
    },
  };
  return ((_0x2e97b0['_storyWorkspaceApi'] = _0x352fe1), void _0x2e99b5(), _0x352fe1);
}
