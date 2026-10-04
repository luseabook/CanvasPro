import { openDebugRequestWindow, renderRequestDebugButton } from '../debugRequestWindow.js';
import { handleStoryStyleThumbnailError } from './storyStylePreview.js';
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
function escapeHtml(value) {
  return String(value ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function normalizeText(item) {
  return String(item || '')['trim']();
}
export function syncStoryClipFrameCardSaveError(el, key = '') {
  if (!el) return ![];
  const text = normalizeText(key);
  el['classList']?.['toggle']?.('is-save-error', Boolean(text));
  if (text) el['setAttribute']?.('data-tooltip', text);
  else el['removeAttribute']?.('data-tooltip');
  return (
    el['removeAttribute']?.('data-native-title'),
    el['removeAttribute']?.('data-tooltip-source'),
    el['removeAttribute']?.('title'),
    !![]
  );
}
export function toggleStoryAssetSelectAll(list = [], index = []) {
  return toggleWorkspaceAssetSelectAll(list, index);
}
export function toggleStoryAssetSelection(list2 = [], result = '', data = ![]) {
  return toggleWorkspaceAssetSelection(list2, result, data);
}
export function updateStoryAssetBatchButtonLabel(el2, options = '') {
  const el3 = el2?.['querySelector']?.('.story-asset-batch-trigger-label');
  if (!el3) return ![];
  return ((el3['textContent'] = String(options ?? '')), !![]);
}
export function toggleStoryEpisodeSelectAll(list3 = [], target = []) {
  return toggleStoryAssetSelectAll(list3, target);
}
function toModelSearchText(options2 = {}) {
  return [options2['label'], options2['providerLabel'], options2['description'], options2['modelId']]
    ['filter'](Boolean)
    ['join']('\x20')
    ['toLowerCase']();
}
function isUsableImageUrl(source) {
  return /^(?:https?:|blob:|data:|\/|images\/|assets\/)/i['test'](normalizeText(source));
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
export function getStoryAssetHoverGridColumns(next) {
  const current = Math['max'](0x1, Math['floor'](Number(next) || 0x1));
  return Math['ceil'](Math['sqrt'](current));
}
export function isStoryAssetHoverLandscape(entry, record) {
  return isWorkspaceAssetHoverLandscape(entry, record);
}
export function getGeneratedStoryAssetHoverAppearances(list4 = [], payload = '') {
  const text2 = normalizeText(payload);
  return (Array['isArray'](list4) ? list4 : [])['filter'](
    (handle) =>
      Boolean(normalizeText(handle?.['imageUrl'])) && (!text2 || normalizeText(handle?.['id']) === text2),
  );
}
export function buildStoryAssetHoverPreviewContent(
  state,
  {
    appearanceId: appearanceId = '',
    selectedAssetId: selectedAssetId = '',
    selectedAppearanceId: selectedAppearanceId = '',
    mediaOnly: mediaOnly = ![],
  } = {},
) {
  return buildWorkspaceAssetHoverPreviewContent(state, {
    appearanceId: appearanceId,
    selectedAssetId: selectedAssetId,
    selectedAppearanceId: selectedAppearanceId,
    mediaOnly: mediaOnly,
    getAppearances: getStoryAssetAppearances,
    hasVoiceReference: hasStoryCharacterVoiceReference,
  });
}
export function resolveStoryAppearanceWheelDelta(event2) {
  const config = Number(event2?.['deltaX'] || 0x0),
    scope = Number(event2?.['deltaY'] || 0x0),
    input = Math['abs'](scope) >= Math['abs'](config) ? scope : config,
    count = Number(event2?.['deltaMode'] || 0x0),
    output = count === 0x1 ? 0x10 : count === 0x2 ? 0x320 : 0x1;
  return input * output;
}
export function consumeStoryWheelDirection(
  value2,
  value3,
  { threshold: threshold = 0x18, lockDuration: lockDuration = 0xdc, now: now = Date['now']() } = {},
) {
  return consumeWorkspaceWheelDirection(value2, value3, {
    threshold: threshold,
    lockDuration: lockDuration,
    now: now,
  });
}
export function getStoryAssetTabLabel(value4) {
  return STORY_ASSET_TAB_LABELS[value4] || STORY_ASSET_TAB_LABELS['character'];
}
export function getStoryAssetTabTransitionDirection(value5, value6) {
  return resolveWorkspaceTabTransitionDirection(value5, value6, STORY_ASSET_TAB_ORDER);
}
export function renderStoryAssetTabIcon(value7) {
  return renderWorkspaceAssetTabIcon(value7);
}
const STORY_ASSET_PACKAGE_CATEGORY = '剧本资产';
export function buildStoryAssetPackageItemRequest({
  project: project = {},
  asset: asset = {},
  appearance: appearance = {},
  image: image = null,
} = {}) {
  const sourceProjectId = normalizeText(project?.['id']),
    sourceStoryAssetId = normalizeText(asset?.['id']),
    sourceStoryAppearanceId = normalizeText(appearance?.['id']),
    packageName = normalizeText(project?.['title']) || '未命名剧本',
    sourceStoryAssetKind = ['scene', 'prop']['includes'](normalizeText(asset?.['kind']))
      ? normalizeText(asset['kind'])
      : 'character',
    itemName = getStoryAssetTabLabel(sourceStoryAssetKind),
    text3 = normalizeText(asset?.['name']) || '未命名' + itemName,
    text4 = normalizeText(appearance?.['name']) || '基础形象',
    response =
      image && typeof image === 'object'
        ? image
        : {
            ...(appearance?.['generatedImage'] && typeof appearance['generatedImage'] === 'object'
              ? appearance['generatedImage']
              : {}),
            imageUrl: normalizeText(appearance?.['imageUrl']),
          };
  return {
    packageKey: 'story-project:' + sourceProjectId,
    packageName: packageName,
    category: STORY_ASSET_PACKAGE_CATEGORY,
    itemKey: 'story-appearance:' + sourceStoryAssetId + ':' + sourceStoryAppearanceId,
    itemName: itemName + '｜' + text3 + '｜' + text4,
    image: {
      ...response,
      imageUrl: normalizeText(
        response['imageUrl'] || response['displayUrl'] || response['url'] || appearance?.['imageUrl'],
      ),
    },
    metadata: { sourceKind: 'story-workspace', sourceProjectId: sourceProjectId },
    itemMetadata: {
      sourceKind: 'story-workspace',
      sourceProjectId: sourceProjectId,
      sourceStoryAssetId: sourceStoryAssetId,
      sourceStoryAppearanceId: sourceStoryAppearanceId,
      sourceStoryAssetKind: sourceStoryAssetKind,
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
    const text5 = normalizeText(imageUrl),
      text6 = normalizeText(fallbackImageUrl),
      value8 = workspaceAssetLibraryImage
        ? '\x20data-workspace-asset-library-image' +
          (isUsableImageUrl(text6) && text6 !== text5
            ? ' data-workspace-asset-library-fallback-src="' + escapeHtml(text6) + '\x22'
            : '')
        : '';
    return (
      '<img class="' +
      escapeHtml(className) +
      '" src="' +
      escapeHtml(text5) +
      '" alt="' +
      escapeHtml(alt) +
      '\x22\x20loading=\x22lazy\x22\x20decoding=\x22async\x22' +
      value8 +
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
  description: description,
} = {}) {
  return renderWorkspaceAssetLoadingOverlay({ compact: compact, title: title, description: description });
}
function renderModelIcon(enabled, value9 = 'story-model-icon') {
  if (!enabled?.['icon'] || !isUsableImageUrl(enabled['icon'])) return '';
  return (
    '<img class="' +
    escapeHtml(value9) +
    '" src="' +
    escapeHtml(enabled['icon']) +
    '\x22\x20alt=\x22\x22\x20loading=\x22eager\x22\x20decoding=\x22async\x22>'
  );
}
function renderModelPicker(value10, value11, value12) {
  const value13 = value10['models'][value11],
    storyWorkspaceModelChoice = getStoryWorkspaceModelChoice(value11, value13),
    list5 = getStoryWorkspaceModelOptions(value11),
    map = new Map();
  list5['forEach']((value14) => {
    if (!map['has'](value14['providerLabel'])) map['set'](value14['providerLabel'], []);
    map['get'](value14['providerLabel'])['push'](value14);
  });
  const value15 = [...map['entries']()]
    ['map'](
      ([value16, list6]) =>
        '<section class="story-model-group">\n        <h4>' +
        escapeHtml(value16) +
        '</h4>\n        ' +
        list6['map'](
          (value17) =>
            '<button type="button" class="story-model-option ' +
            (value17['modelId'] === storyWorkspaceModelChoice?.['modelId'] ? 'is-selected' : '') +
            '" data-story-model-option="' +
            escapeHtml(value17['modelId']) +
            '" data-story-model-kind="' +
            escapeHtml(value11) +
            '" data-story-model-search="' +
            escapeHtml(toModelSearchText(value17)) +
            '" role="option" aria-selected="' +
            (value17['modelId'] === storyWorkspaceModelChoice?.['modelId']) +
            '">\n              ' +
            renderModelIcon(value17) +
            '\n              <span class="story-model-option-copy">\n                <strong>' +
            escapeHtml(value17['label']) +
            '</strong>\n                <small>' +
            escapeHtml(value17['description'] || value17['providerLabel']) +
            '</small>\n              </span>\n              ' +
            (value17['vip'] ? '<span\x20class=\x22story-model-vip\x22>VIP</span>' : '') +
            '\n            </button>',
        )['join']('') +
        '\n      </section>',
    )
    ['join']('');
  return (
    '<div\x20class=\x22story-model-picker\x22\x20data-story-model-picker=\x22' +
    escapeHtml(value12) +
    '">\n    <button type="button" class="story-model-trigger" data-story-model-trigger aria-haspopup="listbox" aria-expanded="false">\n      ' +
    renderModelIcon(storyWorkspaceModelChoice) +
    '\n      <span class="story-model-trigger-copy">\n        <small>' +
    (value11 === 'text' ? '文本模型' : value11 === 'image' ? '图像模型' : '视频模型') +
    '</small>\n        <strong>' +
    escapeHtml(storyWorkspaceModelChoice?.['label'] || '选择模型') +
    '</strong>\n      </span>\n    </button>\n    <div class="story-model-popover" data-story-model-popover role="listbox">\n      <label class="story-model-search-wrap">\n        <span>搜索模型</span>\n        <input type="search" class="story-model-search" data-story-model-search-input placeholder="输入模型或厂商名称" autocomplete="off">\n      </label>\n      <div class="story-model-options">' +
    value15 +
    '</div>\n    </div>\n  </div>'
  );
}
export { getStoryEpisodeToolbarOptions, getStoryProjectCanvasEpisodes };
export function renderProjectToolbar(value18) {
  return storyWorkspaceChromePresentation['renderToolbar'](
    storyWorkspaceChromeProjection['projectToolbar'](value18),
  );
}
export function getStoryScriptWorkflowStage(options3 = {}) {
  const value19 = options3?.['project'] || {},
    list7 = Array['isArray'](options3?.['episodes']) ? options3['episodes'] : [];
  if (value19['sourceMode'] === 'upload-original')
    return compileStoryEpisodeScripts(list7)['complete'] ? 'scripts-complete' : 'scripts-pending';
  if (value19['summaryStatus'] === 'generating') return 'summary-generating';
  if (!normalizeText(value19['summary'])) return 'summary-pending';
  if (value19['outlineStatus'] === 'generating') return 'outline-generating';
  if (value19['outlineStatus'] === 'stale') return 'outline-stale';
  if (!list7['length']) return 'summary-ready';
  return compileStoryEpisodeScripts(list7)['complete'] ? 'scripts-complete' : 'scripts-pending';
}
export function updateStorySummaryCharacterField(list8 = [], value20 = -0x1, value21 = '', value22 = '') {
  const enabled2 = Array['isArray'](list8) ? list8[value20] : null,
    map2 = new Set([
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
  if (!enabled2 || !map2['has'](value21)) return ![];
  return (
    value21 === 'coreTags'
      ? (enabled2['coreTags'] = String(value22 || '')
          ['split'](/[、,，\n]+/)
          ['map']((value23) => normalizeText(value23))
          ['filter'](Boolean))
      : (enabled2[value21] = String(value22 || '')),
    !![]
  );
}
export function updateStoryEpisodeOutlineField(options4 = {}, value24 = '', value25 = '', value26 = '') {
  if (!['synopsis', 'hook']['includes'](value25) || !Array['isArray'](options4?.['episodes'])) return ![];
  const count2 = options4['episodes']['findIndex'](
    (value27) => String(value27?.['id'] || '') === String(value24 || ''),
  );
  if (count2 < 0x0) return ![];
  return (
    options4['episodes'][count2]?.['script']?.['fullText'] &&
      (options4['episodes'] = invalidateStoryEpisodeScriptsFrom(options4['episodes'], count2)),
    (options4['episodes'][count2][value25] = String(value26 ?? '')),
    !![]
  );
}
export function isStoryOutlineSectionOpen(options5 = {}, value28 = '', value29 = ![]) {
  const value30 = options5?.['outlineSectionOpenState'];
  if (value30 && Object['prototype']['hasOwnProperty']['call'](value30, value28))
    return value30[value28] === !![];
  return Boolean(value29);
}
function createStoryScriptPlanningEpisodeView(selectionMode, title2, value31) {
  const value32 = Array['isArray'](selectionMode['data']?.['episodes'])
      ? selectionMode['data']['episodes']
      : [],
    canGenerate = selectionMode['data']?.['project'] || {},
    index2 = Math['max'](0x0, Math['trunc'](Number(value31) || 0x0)),
    number = Math['max'](0x1, Math['trunc'](Number(title2?.['number']) || index2 + 0x1)),
    value33 = title2?.['id'],
    id = normalizeText(value33),
    isComplete = Boolean(title2?.['script']?.['fullText']),
    isGenerating = selectionMode['generatingEpisodeScriptId'] === value33,
    isSelected = Array['isArray'](selectionMode['selectedScriptEpisodeIds'])
      ? selectionMode['selectedScriptEpisodeIds']
      : [],
    isOpen = normalizeText(selectionMode['generatingEpisodeScriptId']);
  return {
    id: id,
    index: index2,
    number: number,
    title: title2?.['title'] || '',
    synopsis: title2?.['synopsis'] || '',
    hook: title2?.['hook'] || '',
    scriptFullText: title2?.['script']?.['fullText'] || '',
    isComplete: isComplete,
    isGenerating: isGenerating,
    isSelected: isSelected['includes'](value33),
    isOpen: isOpen ? isGenerating : isStoryOutlineSectionOpen(selectionMode, 'episode-' + id, index2 < 0x2),
    canSelect: !isComplete && index2 >= getNextStoryEpisodeScriptIndex(value32),
    canGenerate:
      canGenerate['sourceMode'] !== 'upload-original' &&
      canGenerate['outlineStatus'] !== 'stale' &&
      canGenerateStoryEpisodeScript(value32, index2),
    selectionMode: selectionMode['scriptSelectionMode'] === !![],
    disabled: Boolean(selectionMode['storyPlanningOperation']),
    generationMessage:
      selectionMode['episodeScriptGenerationStatus'] || '正在生成第 ' + number + ' 集完整剧本',
    allowRegeneration:
      canGenerate['sourceMode'] !== 'upload-original' && canGenerate['outlineStatus'] !== 'stale',
    regeneration: {
      isConfirming: normalizeText(selectionMode['pendingRegenerationTarget']) === 'episode-script:' + id,
      disabled: Boolean(selectionMode['storyPlanningOperation'] || selectionMode['isGeneratingStory']),
    },
  };
}
function createStoryScriptPlanningEpisodeSectionView(isOutlineGenerating) {
  const isUploadedOriginal = isOutlineGenerating['data']?.['project'] || {},
    episodes = Array['isArray'](isOutlineGenerating['data']?.['episodes'])
      ? isOutlineGenerating['data']['episodes']
      : [],
    complete = compileStoryEpisodeScripts(episodes),
    list9 = Array['isArray'](isOutlineGenerating['selectedScriptEpisodeIds'])
      ? isOutlineGenerating['selectedScriptEpisodeIds']
      : [],
    list10 = list9['length'] ? getStoryEpisodeScriptBatchTargets(episodes, list9) : [],
    selectionMode2 = isOutlineGenerating['scriptSelectionMode'] === !![];
  return {
    episodes: episodes['map']((value34, value35) =>
      createStoryScriptPlanningEpisodeView(isOutlineGenerating, value34, value35),
    ),
    isUploadedOriginal: isUploadedOriginal['sourceMode'] === 'upload-original',
    isOutlineGenerating: isOutlineGenerating['storyPlanningOperation'] === 'planning-episode-outlines',
    loadingMessage: isOutlineGenerating['storyPlanningStatus'] || '正在生成所有分集大纲...',
    complete: complete['complete'],
    selectionMode: selectionMode2,
    batchCount: selectionMode2
      ? list10['length']
      : Math['max'](0x0, complete['totalCount'] - complete['completedCount']),
    isStale: isUploadedOriginal['outlineStatus'] === 'stale',
    busy: Boolean(isOutlineGenerating['storyPlanningOperation']),
    batchGenerating: isOutlineGenerating['storyPlanningOperation'] === 'writing-episode-scripts',
    batchCancelRequested: isOutlineGenerating['episodeScriptBatchCancelRequested'] === !![],
  };
}
export function renderStoryEpisodeOutlineItem(value36, value37, value38) {
  return storyScriptPlanningPresentation['renderPlanning']({
    kind: 'episode-item',
    item: createStoryScriptPlanningEpisodeView(value36, value37, value38),
  });
}
function renderStoryAssetContinuationIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 18 12 8 18.5Z"/></svg>';
}
export function renderStoryEpisodeOutlineSection(value39) {
  return storyScriptPlanningPresentation['renderPlanning']({
    kind: 'episode-section',
    section: createStoryScriptPlanningEpisodeSectionView(value39),
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
export function renderStoryScriptGenerationFooter(hint) {
  const compileStoryEpisodeScripts2 = compileStoryEpisodeScripts(hint['data']['episodes']),
    enabled3 = Math['max'](
      0x0,
      compileStoryEpisodeScripts2['totalCount'] - compileStoryEpisodeScripts2['completedCount'],
    ),
    nextStoryEpisodeScriptIndex = getNextStoryEpisodeScriptIndex(hint['data']['episodes']),
    enabled4 = hint['data']['episodes'][nextStoryEpisodeScriptIndex] || null,
    value40 = enabled4
      ? Math['max'](0x1, Math['trunc'](Number(enabled4['number']) || nextStoryEpisodeScriptIndex + 0x1))
      : 0x0,
    disabled2 = Boolean(hint['storyPlanningOperation']),
    value41 = hint['storyPlanningOperation'] === 'writing-episode-scripts',
    value42 = hint['storyPlanningOperation'] === 'writing-episode-script',
    value43 = hint['episodeScriptBatchCancelRequested'] === !![],
    list11 = hint['scriptSelectionMode']
      ? getStoryEpisodeScriptBatchTargets(hint['data']['episodes'], hint['selectedScriptEpisodeIds'])
      : [],
    enabled5 = list11['length'],
    value44 = hint['scriptSelectionMode']
      ? 'data-story-action="generate-episode-scripts-batch" data-story-script-batch-scope="selected"'
      : 'data-story-action=\x22generate-next-episode-script\x22',
    value45 = hint['scriptSelectionMode']
      ? '生成 ' + enabled5 + '\x20集'
      : enabled4
        ? '生成第\x20' + value40 + '\x20集'
        : '已全部生成',
    value46 = disabled2 || (hint['scriptSelectionMode'] ? !enabled5 : !enabled4),
    renderStoryTextRequestDebugAction2 = renderStoryTextRequestDebugAction({
      isDeveloperMode: Boolean(hint['experimentalSplitAvailable']),
      action: 'debug-episode-script-request',
      title: '只预览下一集正文的实际请求，不发送\x20API',
      disabled: disabled2 || !enabled4,
    }),
    value47 = value41
      ? '<button type="button" class="story-primary-button" data-story-action="cancel-episode-scripts-batch" aria-label="取消尚未开始的分集" ' +
        (value43 ? 'disabled' : '') +
        '>' +
        (value43 ? '已取消排队' : '取消') +
        '</button>'
      : '<button type="button" class="story-secondary-button" data-story-action="generate-episode-scripts-batch" data-story-script-batch-scope="all" ' +
        (disabled2 || !enabled3 ? 'disabled' : '') +
        '>生成全集</button>\x0a\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x22\x20' +
        value44 +
        '\x20' +
        (value46 ? 'disabled' : '') +
        ' aria-busy="' +
        value42 +
        '\x22>' +
        (value42 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
        escapeHtml(value42 ? hint['storyPlanningStatus'] || '正在生成分集正文' : value45) +
        '</button>';
  return renderPageFooter(hint, {
    title: '分集大纲生成完成后，将按顺序生成剧本正文',
    hint:
      hint['episodeScriptGenerationStatus'] ||
      '已完成 ' +
        compileStoryEpisodeScripts2['completedCount'] +
        '/' +
        compileStoryEpisodeScripts2['totalCount'] +
        '\x20集',
    actionsMarkup:
      '\n      ' +
      renderStoryPlanningTextModelPicker(hint, 'script', { disabled: disabled2 }) +
      '\n      ' +
      renderStoryTextRequestDebugAction2 +
      '\n      ' +
      value47 +
      '\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x20story-script-continue-button\x22\x20data-story-action=\x22continue-to-assets\x22\x20aria-label=\x22进入下一步：人设与素材拆解\x22\x20' +
      (disabled2 ? 'disabled' : '') +
      '>' +
      renderStoryAssetContinuationIcon() +
      '</button>',
  });
}
export { getStoryAssetExperimentalDraftDisplay, isStoryAssetLocalQualityRevalidationDraft };
export function renderStoryAssetExtractionFooter(options6 = {}) {
  const disabled3 = Boolean(options6['storyPlanningOperation']),
    value48 = options6['storyPlanningOperation'] === 'extracting-assets-experimental',
    value49 = options6['storyPlanningStatus'] || '正在提取角色、场景与道具',
    className2 = getStoryAssetExperimentalDraftDisplay(options6['data']?.['assetExtractionDraft']),
    storyAssetExperimentalDraftDisplay = getStoryAssetExperimentalDraftDisplay(
      options6['data']?.['experimentalAssetExtractionDraft'],
    ),
    value50 =
      options6['storyPlanningOperation'] === 'extracting-assets-experimental'
        ? '混合提取中'
        : storyAssetExperimentalDraftDisplay['hasProgress']
          ? storyAssetExperimentalDraftDisplay['actionLabel']
          : '开发测试',
    value51 = storyAssetExperimentalDraftDisplay['hasProgress']
      ? storyAssetExperimentalDraftDisplay['summary']
      : '开发测试\x20V1：先由本地\x20PP-UIE\x20建立候选清单；中短剧本仍把完整原文交给角色、场景、道具三条专用\x20API，超长剧本只提交受预算约束的剧情证据。每类最多一次且不自动重试；失败不会写入本地兜底提示词，也不会覆盖现有素材',
    value52 = storyAssetExperimentalDraftDisplay['hasProgress']
      ? ''
      : '\x20title=\x22' + escapeHtml(value51) + '\x22',
    value53 = disabled3
      ? value49
      : className2['hasProgress']
        ? className2['actionLabel']
        : '下一步：提取角色、场景与道具',
    renderStoryPlanningTextModelPicker2 = renderStoryPlanningTextModelPicker(options6, 'assets', {
      disabled: disabled3,
      className: className2['needsModelChange'] ? 'story-asset-recovery-model-picker' : '',
    }),
    value54 = options6['experimentalAssetExtractionAvailable']
      ? '<button type="button" class="story-secondary-button story-experimental-asset-extraction" data-story-action="extract-assets-experimental"' +
        value52 +
        '\x20' +
        (disabled3 ? 'disabled' : '') +
        ' aria-busy="' +
        value48 +
        '\x22>' +
        (value48 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
        escapeHtml(value50) +
        '</button>'
      : '',
    renderStoryTextRequestDebugAction3 = renderStoryTextRequestDebugAction({
      isDeveloperMode: Boolean(options6['experimentalAssetExtractionAvailable']),
      action: 'debug-asset-extraction-experimental-request',
      title: '只预览首批本地素材抽取输入，不运行模型',
      disabled: disabled3,
    });
  return renderPageFooter(options6, {
    nextLabel: '下一步：提取角色、场景与道具',
    nextAction: 'extract-assets',
    title: className2['hasProgress'] ? '素材提取进度' : '',
    hint: className2['summary'] || storyAssetExperimentalDraftDisplay['summary'],
    actionsMarkup:
      '\n      ' +
      renderStoryTextRequestDebugAction3 +
      '\n      ' +
      value54 +
      '\n      ' +
      renderStoryPlanningTextModelPicker2 +
      '\x0a\x20\x20\x20\x20\x20\x20' +
      renderRequestDebugButton('data-story-action="debug-asset-extraction-request"') +
      '\n      <button type="button" class="story-next-button" data-story-action="extract-assets" ' +
      (disabled3 ? 'disabled' : '') +
      ' aria-busy="' +
      disabled3 +
      '\x22>' +
      (disabled3 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      '<span>' +
      escapeHtml(value53) +
      '</span>' +
      (disabled3 ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
      '</button>',
  });
}
export function renderStoryEpisodeOutlinePlanningFooter(options7 = {}, { stale: stale = ![] } = {}) {
  const disabled4 = Boolean(options7['storyPlanningOperation']),
    nextLabel = stale ? '重新运行' : '生成分集大纲',
    renderStoryTextRequestDebugAction4 = renderStoryTextRequestDebugAction({
      isDeveloperMode: Boolean(options7['experimentalSplitAvailable']),
      action: 'debug-episode-outline-request',
      title: '只预览生成分集大纲的实际请求，不发送 API',
      disabled: disabled4,
    }),
    value55 = disabled4 ? options7['storyPlanningStatus'] || '正在生成分集大纲' : nextLabel;
  return renderPageFooter(options7, {
    nextLabel: nextLabel,
    nextAction: 'plan-episode-outlines',
    title: stale ? '故事蓝图已修改' : '',
    hint: stale ? '现有分集内容仍然保留；重新运行后将按当前蓝图更新' : '',
    actionsMarkup:
      '\n      ' +
      renderStoryPlanningTextModelPicker(options7, 'outline', { disabled: disabled4 }) +
      '\n      ' +
      renderStoryTextRequestDebugAction4 +
      '\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-next-button\x22\x20data-story-action=\x22plan-episode-outlines\x22\x20' +
      (disabled4 ? 'disabled' : '') +
      ' aria-busy="' +
      disabled4 +
      '\x22>' +
      (disabled4 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      '<span>' +
      escapeHtml(value55) +
      '</span>' +
      (disabled4 ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
      '</button>',
  });
}
function createStoryScriptPlanningPageView(loadingMessage, footerMarkup = '') {
  const originalCreative = loadingMessage['data']?.['project'] || {},
    list12 = Array['isArray'](loadingMessage['data']?.['episodes']) ? loadingMessage['data']['episodes'] : [],
    isUploadedOriginal2 = originalCreative['sourceMode'] === 'upload-original',
    isUploadedRewrite = originalCreative['sourceMode'] === 'upload-rewrite',
    value56 = loadingMessage['storyPlanningOperation'] === 'planning-episode-outlines',
    enabled6 = Boolean(value56 || (loadingMessage['scriptGenerationFocusMode'] && list12['length'])),
    originalOpen = !enabled6 && isStoryOutlineSectionOpen(loadingMessage, 'original', !![]),
    summaryOpen = !enabled6 && isStoryOutlineSectionOpen(loadingMessage, 'summary', !![]),
    episodesOpen = enabled6 || isStoryOutlineSectionOpen(loadingMessage, 'episodes', !![]),
    disabled5 = Boolean(loadingMessage['storyPlanningOperation'] || loadingMessage['isGeneratingStory']);
  return {
    isUploadedOriginal: isUploadedOriginal2,
    isUploadedRewrite: isUploadedRewrite,
    originalCreative:
      originalCreative['originalCreative'] || originalCreative['sourceDocument']?.['text'] || '',
    rewriteInstruction: originalCreative['rewriteInstruction'] || '',
    originalOpen: originalOpen,
    summaryOpen: summaryOpen,
    episodesOpen: episodesOpen,
    summary: {
      status: originalCreative['summaryStatus'],
      loadingMessage: loadingMessage['generationStatus'] || '正在根据原始创意生成剧本摘要...',
      isStale: originalCreative['outlineStatus'] === 'stale',
      episodeCount: normalizeStoryEpisodeCount(originalCreative['planning']?.['episodeCount']),
      storyType: originalCreative['storyType'],
      targetAudience: originalCreative['targetAudience'],
      logline: originalCreative['logline'],
      coreHook: originalCreative['coreHook'],
      synopsis: originalCreative['summary'],
      background: originalCreative['background'],
      setting: originalCreative['setting'],
      contract: originalCreative['storyContract'],
      plotBeats: originalCreative['plotBeats'],
      continuityFacts: originalCreative['continuityFacts'],
      characters: originalCreative['characters'] || [],
    },
    summaryRegeneration: {
      isConfirming: normalizeText(loadingMessage['pendingRegenerationTarget']) === 'summary',
      disabled: disabled5,
    },
    outlineRegeneration: {
      isConfirming: normalizeText(loadingMessage['pendingRegenerationTarget']) === 'episode-outlines',
      disabled: disabled5,
    },
    outlineStatus: originalCreative['outlineStatus'],
    episodeSection: createStoryScriptPlanningEpisodeSectionView(loadingMessage),
    footerMarkup: footerMarkup,
  };
}
export function renderOutlinePage(value57) {
  const stale2 = value57['data']?.['project'] || {},
    storyScriptWorkflowStage = getStoryScriptWorkflowStage(value57['data']),
    value58 = stale2['sourceMode'] === 'upload-original',
    value59 = value57['storyPlanningOperation'] === 'planning-episode-outlines',
    value60 = value59
      ? renderStoryEpisodeOutlinePlanningFooter(value57, { stale: stale2['outlineStatus'] === 'stale' })
      : storyScriptWorkflowStage === 'scripts-pending'
        ? value58
          ? renderStoryAssetExtractionFooter(value57)
          : renderStoryScriptGenerationFooter(value57)
        : storyScriptWorkflowStage === 'summary-ready'
          ? renderStoryEpisodeOutlinePlanningFooter(value57)
          : storyScriptWorkflowStage === 'outline-stale'
            ? renderStoryEpisodeOutlinePlanningFooter(value57, { stale: !![] })
            : storyScriptWorkflowStage === 'scripts-complete'
              ? renderStoryAssetExtractionFooter(value57)
              : '';
  return storyScriptPlanningPresentation['renderPlanning']({
    kind: 'page',
    page: createStoryScriptPlanningPageView(value57, value60),
  });
}
export function renderStoryAssetBreakdownPage(options8 = {}) {
  const list13 = getStoryAssetBreakdownEpisodes(options8),
    value61 = Math['trunc'](Number(options8['assetBreakdownVisibleCount']) || 0x0),
    value62 = Math['min'](list13['length'], Math['max'](list13['length'] ? 0x1 : 0x0, value61)),
    episodes2 = list13['slice'](0x0, value62);
  return storyScriptPlanningPresentation['renderAssetBreakdown']({ episodes: episodes2 });
}
function renderStoryChapter(value63, value64) {
  return (
    '<article class="story-chapter-card" data-story-chapter-index="' +
    value64 +
    '">\n    <label class="story-chapter-title"><span>第 ' +
    (value64 + 0x1) +
    ' 章</span><input type="text" value="' +
    escapeHtml(value63['title'] || '') +
    '" data-story-chapter-title="' +
    value64 +
    '"></label>\n    <label class="story-chapter-content"><span>章节正文</span><textarea data-story-chapter-content="' +
    value64 +
    '\x22>' +
    escapeHtml(value63['content'] || '') +
    '</textarea></label>\n  </article>'
  );
}
export function renderStoryEpisodeCardActionIcon(value65 = 'generate') {
  if (value65 === 'edit')
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19h4l10-10-4-4L5 15v4Z"/><path d="m13.5 6.5 4 4M5 19l4-1"/></svg>';
  if (value65 === 'regenerate')
    return '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M20\x2011a8\x208\x200\x201\x200-2.34\x205.66\x22/><path\x20d=\x22M20\x204v7h-7\x22/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="12" height="14" rx="2"/><path d="M4 10h12M8 5v14M18.5 4v5M16 6.5h5"/></svg>';
}
export function renderStoryEpisodeExperimentalSplitAction(
  options9 = {},
  { isDeveloperMode: isDeveloperMode = ![], disabled: disabled = ![], busy: busy = ![] } = {},
) {
  if (!isDeveloperMode) return '';
  const value66 = Math['max'](0x1, Math['trunc'](Number(options9?.['number']) || 0x1)),
    storyEpisodeCardAction = getStoryEpisodeCardAction(options9);
  return (
    '<button type="button" class="story-episode-experimental-split story-episode-experimental-split--after-' +
    storyEpisodeCardAction['kind'] +
    '" data-story-action="experimental-split-episode" data-story-episode-id="' +
    escapeHtml(options9?.['id']) +
    '" aria-label="使用开发测试生成第 ' +
    value66 +
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
export function renderStoryEpisodeExperimentalModeToggle(enabled7 = ![], { disabled: disabled = ![] } = {}) {
  const value67 = ![];
  disabled = !![];
  const value68 = '实验模式暂未开放';
  return (
    '<button type="button" class="story-experimental-mode-toggle ' +
    (value67 ? 'is-active' : '') +
    '" data-story-action="toggle-experimental-split-mode" aria-pressed="' +
    value67 +
    '\x22\x20aria-label=\x22' +
    (value67 ? '关闭' : '开启') +
    '实验模式\x22\x20title=\x22' +
    value68 +
    '\x22\x20' +
    (disabled ? 'disabled' : '') +
    '><span class="story-experimental-mode-track" aria-hidden="true"><span class="story-experimental-mode-thumb"></span></span><span class="story-experimental-mode-label">实验模式</span></button>'
  );
}
export function renderStoryEpisodeRequestDebugAction(
  options10 = {},
  { isDeveloperMode: isDeveloperMode = ![], disabled: disabled = ![] } = {},
) {
  if (!isDeveloperMode) return '';
  const value69 = Math['max'](0x1, Math['trunc'](Number(options10?.['number']) || 0x1)),
    storyEpisodeCardAction2 = getStoryEpisodeCardAction(options10);
  return renderRequestDebugButton(
    'data-story-action="debug-experimental-split-request" data-story-episode-id="' +
      escapeHtml(options10?.['id']) +
      '" title="调试第 ' +
      value69 +
      '\x20集实验分批请求\x22\x20' +
      (disabled ? 'disabled' : ''),
  );
}
export function renderStoryEpisodeSplitDraftStatus(options11 = {}, { disabled: disabled = ![] } = {}) {
  const value70 = options11?.['splitDraft'],
    list14 = Array['isArray'](value70?.['items']) ? value70['items'] : [],
    count3 = list14['reduce'](
      (value71, response2) =>
        value71 +
        (response2?.['status'] === 'valid' && Array['isArray'](response2?.['clips'])
          ? response2['clips']['length']
          : 0x0),
      0x0,
    ),
    list15 = list14['filter']((response3) => response3?.['status'] !== 'valid'),
    enabled8 = list15['length'];
  if (!enabled8) return '';
  const text7 = normalizeText(
      (Array['isArray'](value70?.['rejectedClips']) ? value70['rejectedClips'] : [])['find']((error) =>
        normalizeText(error?.['message']),
      )?.['message'] ||
        list15['find']((value72) => normalizeText(value72?.['error']?.['message']))?.['error']?.['message'],
    ),
    value73 = list15['some'](
      (value74) => Array['isArray'](value74?.['rawClips']) && value74['rawClips']['length'] > 0x0,
    ),
    value75 = count3 > 0x0 || value73,
    value76 = count3 > 0x0 ? '应用 ' + count3 + ' 个合格片段' : '重新校验已保存结果',
    value77 =
      count3 > 0x0 ? '只应用已通过校验的片段，不调用模型' : '使用当前规则重新校验已保存的片段，不调用模型',
    value78 = value75
      ? '<button type="button" class="story-secondary-button story-episode-split-draft-repair" data-story-action="repair-episode-split-draft" data-story-episode-id="' +
        escapeHtml(options11?.['id']) +
        '\x22\x20title=\x22' +
        value77 +
        '\x22\x20' +
        (disabled ? 'disabled' : '') +
        '>' +
        value76 +
        '</button>'
      : '<span class="story-episode-split-draft-guidance">请点击右上角重新生成</span>';
  return (
    '<div class="story-episode-split-draft" role="status" aria-live="polite">\n    <span class="story-episode-split-draft-copy">本次返回未完全通过：已保留 ' +
    count3 +
    ' 个合格片段和 ' +
    enabled8 +
    ' 项原始错误；当前旧版本未被覆盖。' +
    (text7 ? ' 失败原因：' + escapeHtml(text7) : '') +
    '</span>\x0a\x20\x20\x20\x20' +
    value78 +
    '\n  </div>'
  );
}
function createStoryEpisodeCardPresentation(sequenceLabel, id2) {
  const isChecked = sequenceLabel['selectedEpisodeIds']['includes'](id2['id']),
    value79 = Array['isArray'](sequenceLabel?.['data']?.['assets']),
    characterCount = value79
      ? deriveStoryEpisodeAssetSummary(id2, sequenceLabel['data']['assets'])
      : {
          characterCount: Number(id2?.['characterCount']) || 0x0,
          sceneCount: Number(id2?.['sceneCount']) || 0x0,
          propCount: Number(id2?.['propCount']) || 0x0,
        },
    disabled6 = getStoryEpisodeGenerationControlState(sequenceLabel, id2['id']),
    isSplitting = disabled6['isGenerating'],
    storyEpisodeStatus = deriveStoryEpisodeStatus(id2['clips']),
    actionKind = getStoryEpisodeCardAction(id2),
    isSelectionMode = sequenceLabel['episodeSelectionMode'] === !![];
  return {
    id: id2['id'],
    number: id2['number'],
    sequenceLabel:
      sequenceLabel['data']?.['project']?.['sourceMode'] === 'video-replication'
        ? '视频 ' + id2['number']
        : '第\x20' + id2['number'] + '\x20集',
    posterLayout: sequenceLabel['workspaceSurface'] === 'replication',
    title: id2['title'],
    status: id2['storyboardStale']
      ? '分镜待更新'
      : storyEpisodeStatus === '待生成'
        ? '分镜已生成'
        : storyEpisodeStatus,
    characterCount: characterCount['characterCount'],
    sceneCount: characterCount['sceneCount'],
    propCount: characterCount['propCount'],
    clipCount: id2['clipCount'],
    isChecked: isChecked,
    isSelectionMode: isSelectionMode,
    isSplitting: isSplitting,
    disabled: disabled6['disabled'],
    actionKind: actionKind['kind'],
    actionLabel: actionKind['label'],
    media: resolveStoryEpisodeCardMedia(id2),
    experimentalActionMarkup: renderStoryEpisodeExperimentalSplitAction(id2, {
      isDeveloperMode: Boolean(sequenceLabel['experimentalSplitAvailable']),
      disabled: disabled6['disabled'],
      busy: isSplitting,
    }),
    requestDebugMarkup: renderStoryEpisodeRequestDebugAction(id2, {
      isDeveloperMode: Boolean(sequenceLabel['experimentalSplitAvailable']),
      disabled: disabled6['disabled'],
    }),
    splitDraftMarkup: renderStoryEpisodeSplitDraftStatus(id2, { disabled: disabled6['disabled'] }),
  };
}
export function renderEpisodeCard(value80, value81) {
  return storyClipProductionPresentation['renderOverview']({
    kind: 'card',
    card: createStoryEpisodeCardPresentation(value80, value81),
  });
}
export function renderEpisodesPage(title3) {
  const batchControl = getStoryEpisodeBatchControlState(title3),
    cards = getStoryVideoEpisodes(title3['data']['episodes']),
    experimentalMode = shouldUseStoryEpisodeExperimentalSplit(title3),
    disabled7 =
      batchControl['disabled'] ||
      (Array['isArray'](title3['splittingEpisodeIds']) && title3['splittingEpisodeIds']['length'] > 0x0),
    allEpisodesSelected =
      cards['length'] > 0x0 &&
      cards['every']((value82) => title3['selectedEpisodeIds']['includes'](value82['id']));
  return storyClipProductionPresentation['renderOverview']({
    kind: 'page',
    title: title3['workspaceSurface'] === 'replication' ? '视频列表' : '分集视频',
    eyebrow: title3['workspaceSurface'] === 'replication' ? '分段提示词与视频制作' : '剧本拆分结果',
    description:
      title3['workspaceSurface'] === 'replication'
        ? ''
        : '每一集会形成一套片段脚本；确认后可创建为新的画布页面。',
    experimentalMode: experimentalMode,
    experimentalModeToggleMarkup: renderStoryEpisodeExperimentalModeToggle(experimentalMode, {
      disabled: disabled7,
    }),
    selectionMode: title3['episodeSelectionMode'] === !![],
    allEpisodesSelected: allEpisodesSelected,
    selectedCount: title3['selectedEpisodeIds']['length'],
    batchControl: batchControl,
    cards: cards['map']((value83) => createStoryEpisodeCardPresentation(title3, value83)),
    footerMarkup: renderPageFooter(title3, {
      nextLabel: '保存并返回项目列表',
      isLast: !![],
      leadingActionsMarkup: renderStoryPlanningTextModelPicker(title3, 'video', {
        disabled: Boolean(title3['storyPlanningOperation']),
      }),
    }),
  });
}
function renderPageFooter(value84, value85 = {}) {
  return storyWorkspaceChromePresentation['renderFooter'](
    storyWorkspaceChromeProjection['projectFooter'](value84, value85),
  );
}
function getSelectedEpisode(value86) {
  return (
    value86['data']['episodes']['find']((value87) => value87['id'] === value86['selectedEpisodeId']) ||
    value86['data']['episodes'][0x0]
  );
}
function getSelectedClip(value88, value89) {
  return (
    value89?.['clips']?.['find']((value90) => value90['id'] === value88['selectedClipId']) ||
    value89?.['clips']?.[0x0] ||
    null
  );
}
function getStoryEpisodeAssetRailHelp(value91) {
  if (value91 === 'frames') return '视频提取画面与裁剪片段，可拖入提示词或删除';
  if (value91 === 'library') return '连接画布素材库，可拖入提示词';
  return '拖入提示词';
}
export function renderEpisodeAssetRail(value92) {
  const selectedEpisode = getSelectedEpisode(value92),
    assets = deriveStoryEpisodeAssetSummary(selectedEpisode, value92['data']['assets'])['assets'],
    text8 = normalizeText(selectedEpisode?.['id']),
    clips = Array['isArray'](selectedEpisode?.['clips']) ? selectedEpisode['clips'] : [],
    map3 = new Set(clips['map']((value93) => normalizeText(value93?.['id']))['filter'](Boolean)),
    frames = normalizeStoryClipFrames(value92['data']['clipFrames'])['filter']((value94) => {
      const text9 = normalizeText(value94['episodeId']);
      if (text9) return text9 === text8;
      return map3['has'](normalizeText(value94['clipId']));
    }),
    activeTab = normalizeStoryEpisodeAssetRailTab(value92['episodeAssetRailTab']),
    libraryAssets = buildWorkspaceAssetLibraryItems({ allowedTypes: null })['map']((args) => {
      const mediaKind = normalizeText(args['mediaKind']);
      return {
        ...args,
        mediaKind: mediaKind,
        imageUrl:
          mediaKind === 'image'
            ? normalizeText(args['thumbnailUrl'] || args['sourceUrl'])
            : normalizeText(args['thumbnailUrl']),
        typeLabel: getWorkspaceAssetLibraryMediaLabel(mediaKind),
      };
    });
  return storyClipProductionPresentation['renderAssetRail']({
    activeTab: activeTab,
    helpText: getStoryEpisodeAssetRailHelp(activeTab),
    assetKindLabels: Object['fromEntries'](
      ['character', 'scene', 'prop']['map']((value95) => [value95, getStoryAssetTabLabel(value95)]),
    ),
    assets: assets['map']((id3) => ({
      id: id3['id'],
      name: id3['name'],
      kind: id3['kind'],
      imageUrl:
        getStoryAssetBaseAppearance(id3)?.['imageUrl'] ||
        getStoryAssetAppearances(id3)['find']((value96) => normalizeText(value96['imageUrl']))?.[
          'imageUrl'
        ] ||
        '',
    })),
    clips: clips['map']((id4) => ({ id: id4?.['id'], title: id4?.['title'] })),
    frames: frames['map']((id5) => ({
      id: id5['id'],
      name: id5['name'],
      clipId: id5['clipId'],
      clipTitle: id5['clipTitle'],
      captureSavePending: id5['captureSavePending'] === !![],
      mentionId: buildStoryClipFrameMentionId(id5['id']),
      mediaType: getStoryClipFrameMediaType(id5),
      imageUrl: resolveStoryClipFrameImageUrl(id5),
      mediaUrl: resolveStoryClipFrameMediaUrl(id5),
    })),
    libraryAssets: libraryAssets,
  });
}
function renderEpisodeDetail(value97) {
  const selectedEpisode2 = getSelectedEpisode(value97),
    title4 = getSelectedClip(value97, selectedEpisode2),
    styleId = value97['data']?.['project'] || {},
    storyStyleSelection = resolveStoryStyleSelection({
      styleId: styleId['videoStyleId'],
      stylePrompt: styleId['videoStylePrompt'],
      videoStyle: styleId['videoStyle'],
    }),
    clipMeta = [storyStyleSelection['label'], normalizeStoryAspectRatio(styleId['aspectRatio'])]['filter'](
      Boolean,
    ),
    hasMultipleClips = (selectedEpisode2?.['clips'] || [])['length'] > 0x1;
  if (selectedEpisode2 && value97['selectedEpisodeId'] !== selectedEpisode2['id'])
    value97['selectedEpisodeId'] = selectedEpisode2['id'];
  if (title4 && value97['selectedClipId'] !== title4['id']) value97['selectedClipId'] = title4['id'];
  const ratios = normalizeStoryEpisodePanelRatios(
      value97['episodeAssetPanelRatio'],
      value97['episodeEditorPanelRatio'],
    ),
    referenceSummary = storyClipProduction['renderEpisode'](value97, selectedEpisode2, title4);
  return storyClipProductionPresentation['renderDetail']({
    title: title4?.['title'] || '片段脚本',
    clipMeta: clipMeta,
    ratios: ratios,
    hasMultipleClips: hasMultipleClips,
    assetRailMarkup: renderEpisodeAssetRail(value97),
    episodeRailMarkup:
      styleId['sourceMode'] === 'video-replication'
        ? renderStoryVideoReplicationEpisodeRail(
            getStoryEpisodeToolbarOptions(value97['data']['episodes']),
            value97['selectedEpisodeId'],
          )
        : '',
    referenceSummary: referenceSummary['referenceSummary'],
    promptSurface: referenceSummary['promptSurface'],
    navigationMarkup: hasMultipleClips
      ? '' + renderStoryClipNavigationArrow('previous') + renderStoryClipNavigationArrow('next')
      : '',
    videoPreview: referenceSummary['videoPreview'],
    timeline: referenceSummary['timeline'],
  });
}
function renderProjectPage(styleId2) {
  if (
    styleId2['step'] === 0x0 &&
    styleId2['view'] === 'project' &&
    isStoryCollaborationProject(styleId2['data'])
  )
    return renderStoryConceptionPage(styleId2);
  if (styleId2['view'] === 'episode') return renderEpisodeDetail(styleId2);
  if (styleId2['step'] === 0x1 && styleId2['data']?.['project']?.['sourceMode'] === 'video-replication') {
    const targetLabel = getStoryReplicationLocale(
        styleId2['data']['project']?.['replication']?.['targetLocale'],
      ),
      styleLabel = resolveStoryStyleSelection({
        styleId: styleId2['data']['project']?.['videoStyleId'],
        stylePrompt: styleId2['data']['project']?.['videoStylePrompt'],
        videoStyle: styleId2['data']['project']?.['videoStyle'],
      });
    return renderStoryVideoReplicationPage({
      episodes: styleId2['data']['episodes'],
      targetLabel: targetLabel['label'],
      styleLabel: styleLabel['label'],
      selectionMode: styleId2['replicationSelectionMode'] === !![],
      footerMarkup: renderStoryVideoReplicationFooter(styleId2),
    });
  }
  if (styleId2['step'] === 0x1 && isStoryAssetExtractionOperation(styleId2['storyPlanningOperation']))
    return renderStoryAssetBreakdownPage(styleId2);
  if (styleId2['step'] === 0x2) return renderAssetsPage(styleId2);
  if (styleId2['step'] === 0x3) return renderEpisodesPage(styleId2);
  return renderOutlinePage(styleId2);
}
function renderStoryVideoReplicationFooter(planningStatus) {
  const title5 = getStoryVideoReplicationFooterState(planningStatus['data'], {
    localizing: isStoryAssetExtractionOperation(planningStatus['storyPlanningOperation']),
    planningStatus: planningStatus['storyPlanningStatus'],
  });
  return renderPageFooter(planningStatus, {
    title: title5['title'],
    hint: title5['hint'],
    useDefaultCopy: ![],
    actionsMarkup:
      '<button type="button" class="story-next-button story-replication-next-button' +
      (title5['actionAttention'] ? ' is-attention' : '') +
      '" data-story-action="' +
      title5['action'] +
      '\x22\x20' +
      (title5['actionDisabled'] ? 'disabled' : '') +
      ' aria-busy="' +
      title5['busy'] +
      '\x22>' +
      (title5['busy'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      '<span>' +
      escapeHtml(title5['actionLabel']) +
      '</span>' +
      (title5['busy'] ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
      '</button>',
  });
}
function findStoryAsset(value98, value99) {
  return value98['data']['assets']['find']((value100) => value100['id'] === value99) || null;
}
function getStoryAssetPromptEditorContext(options12 = {}, el4 = null) {
  const text10 = normalizeText(el4?.['dataset']?.['storyAssetPromptAssetId']),
    text11 = normalizeText(el4?.['dataset']?.['storyAssetPromptAppearanceId']);
  if (!text10 || !text11) return { asset: null, appearance: null };
  const asset2 =
      (Array['isArray'](options12?.['data']?.['assets']) ? options12['data']['assets'] : [])['find'](
        (value101) => normalizeText(value101?.['id']) === text10,
      ) || null,
    appearance2 = asset2
      ? getStoryAssetAppearances(asset2)['find']((value102) => normalizeText(value102?.['id']) === text11) ||
        null
      : null;
  return { asset: asset2, appearance: appearance2 };
}
export function updateStoryAssetPromptFromEditor(options13 = {}, value103 = null) {
  const { asset: asset3, appearance: appearance3 } = getStoryAssetPromptEditorContext(options13, value103);
  if (!asset3 || !appearance3 || asset3['isLibraryAsset']) return ![];
  return (
    (appearance3['prompt'] = readStoryAssetPromptText(value103)),
    normalizeText(getStoryAssetAppearances(asset3)[0x0]?.['id']) === normalizeText(appearance3['id']) &&
      (asset3['prompt'] = appearance3['prompt']),
    !![]
  );
}
function updateSelectedClipPrompt(value104, value105) {
  const selectedEpisode3 = getSelectedEpisode(value104),
    selectedClip = getSelectedClip(value104, selectedEpisode3);
  if (selectedClip) selectedClip['prompt'] = sanitizePromptHtmlForCommit(String(value105 || ''));
}
function syncProjectChapterContent(enabled9) {
  normalizeText(enabled9?.['outlineStatus']) !== 'completed' &&
    !enabled9?.['compiledScript'] &&
    (enabled9['sourceChapters'] = (enabled9['chapters'] || [])['map']((value106) => ({
      id: normalizeText(value106?.['id']),
      title: normalizeText(value106?.['title']),
      content: normalizeText(value106?.['content']),
    })));
  const value107 = (enabled9['chapters'] || [])
    ['map']((value108) =>
      (normalizeText(value108['title']) + '\x0a' + normalizeText(value108['content']))['trim'](),
    )
    ['filter'](Boolean)
    ['join']('\x0a\x0a');
  ((enabled9['plotScript'] = value107), (enabled9['narrationScript'] = value107));
}
export function reportStoryWorkspaceApiError(value109, code, value110 = {}) {
  const operation = normalizeText(value109) || 'unknown-operation',
    value111 = Number(code?.['status']),
    value112 = {
      operation: operation,
      message: normalizeText(code?.['message'] || code) || '未知错误',
      model: normalizeText(value110?.['model']),
      provider: normalizeText(code?.['provider'] || value110?.['provider']),
      status: Number['isFinite'](value111) ? value111 : null,
      code: code?.['code'] ?? null,
      type: normalizeText(code?.['type'] || code?.['name']) || 'Error',
      retryable: typeof code?.['retryable'] === 'boolean' ? code['retryable'] : null,
      raw: code?.['raw'] ?? null,
    };
  return (
    globalThis['console']?.['error']?.(
      '[storyWorkspace][' + operation + ']\x20API\x20请求失败',
      value112,
      code,
    ),
    value112
  );
}
export function resolveStoryTaskResultDestination(options14 = {}, value113 = {}) {
  const list16 = Array['isArray'](options14?.['episodes']) ? options14['episodes'] : [],
    list17 = Array['isArray'](options14?.['assets']) ? options14['assets'] : [],
    text12 = normalizeText(value113?.['episodeId']),
    value114 = list16['find']((value115) => normalizeText(value115?.['id']) === text12);
  if (value114 && Array['isArray'](value114['clips']) && value114['clips']['length']) {
    const text13 = normalizeText(value113?.['clipId']),
      value116 =
        value114['clips']['find']((value117) => normalizeText(value117?.['id']) === text13) ||
        value114['clips'][0x0];
    return {
      view: 'episode',
      step: 0x3,
      episodeId: normalizeText(value114['id']),
      clipId: normalizeText(value116?.['id']),
    };
  }
  const text14 = normalizeText(value113?.['assetId']),
    value118 = list17['find']((value119) => normalizeText(value119?.['id']) === text14);
  if (value118)
    return {
      view: 'project',
      step: 0x2,
      assetId: normalizeText(value118['id']),
      assetFilter: normalizeText(value118['kind']) || 'character',
    };
  const step = normalizeStoryWorkspaceStep(value113?.['step']);
  return {
    view: 'project',
    step: step,
    outlineSectionId: step === 0x1 ? normalizeText(value113?.['outlineSectionId']) : '',
  };
}
export function notifyStoryTaskResult(
  handler,
  value120,
  value121 = 'info',
  {
    details: details,
    duration: duration,
    toastOptions: toastOptions,
    consoleObject: consoleObject = globalThis['console'],
  } = {},
) {
  const tone2 = value121 === 'warning' ? 'warn' : String(value121 || 'info'),
    message = String(value120 || '')['trim']() || '任务状态已更新。',
    value122 = consoleObject?.['error'] || consoleObject?.['log'];
  if (tone2 === 'error' && typeof value122 === 'function') {
    const value123 = { tone: tone2, message: message, timestamp: new Date()['toISOString']() };
    details === undefined
      ? value122['call'](consoleObject, '[storyWorkspace][task-result]', value123)
      : value122['call'](consoleObject, '[storyWorkspace][task-result]', value123, details);
  }
  if (typeof handler !== 'function') return ![];
  return (
    duration === undefined && toastOptions === undefined
      ? handler(message, tone2)
      : handler(message, tone2, duration, toastOptions),
    !![]
  );
}
export function notifyStoryTextGenerationComplete(
  value124,
  {
    playSound: playSound = playCompletionSound,
    showNotification: showNotification = showGenerationCompleteNotification,
    navigationTarget: navigationTarget = null,
  } = {},
) {
  const body = String(value124 || '')['trim']() || '剧本工作室文本生成完成。';
  return Promise['allSettled']([
    Promise['resolve']()['then'](() => playSound('generation-success')),
    Promise['resolve']()['then'](() =>
      showNotification({ body: body, ...(navigationTarget ? { navigation: navigationTarget } : {}) }),
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
  const value125 = documentObject['getElementById']('storyWorkspaceRoot');
  if (value125?.['_storyWorkspaceApi']) return value125['_storyWorkspaceApi'];
  const el5 = documentObject['getElementById']('v2-wrap');
  if (!el5) return null;
  const selectedAssetId2 = normalizeStoryWorkspaceAssetData(createDemoStoryWorkspaceData());
  selectedAssetId2['project']['planning'] = normalizeStoryProjectPlanning(selectedAssetId2['project'], {
    allowDeveloperPromptModes: windowObject?.['DEV_MODE'] === !![],
  });
  const text15 = resolveStoryWorkspaceModelId('text'),
    image2 = resolveStoryWorkspaceModelId('image'),
    video = resolveStoryWorkspaceModelId('video'),
    state2 = {
      storyProjectSessionId: 0x1,
      storyProjectSessionById: { [normalizeText(selectedAssetId2['project']?.['id'])]: 0x1 },
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
      textProvider: getStoryWorkspaceModelChoice('text', text15)?.['provider'] || '',
      textProviderProfileId: '',
      imageProvider: resolveModelProvider(image2),
      imageGenerationParams: normalizeStoryImageGenerationParams(image2),
      imageGenerationParamsByModel: {},
      assetPromptPresetId: STORY_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
      sceneAssetPromptPresetId: STORY_SCENE_ASSET_PROMPT_PRESET_NONE_ID,
      videoProvider: resolveStoryVideoProvider(video),
      videoProviderProfileId: '',
      videoProviderProfileIdByModel: {},
      videoGenerationParams: applyStoryAspectRatioToVideoGenerationParams(
        video,
        {},
        selectedAssetId2['project']?.['aspectRatio'],
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
        selectedAssetId2['assets']['find']((value126) => value126['kind'] === 'character')?.['id'] || '',
      selectedEpisodeId: selectedAssetId2['episodes'][0x0]?.['id'] || '',
      selectedClipId: selectedAssetId2['episodes'][0x0]?.['clips']?.[0x0]?.['id'] || '',
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
      data: selectedAssetId2,
      models: { text: text15, image: image2, video: video },
    },
    storyRoot = documentObject['createElement']('section');
  const handleStoryWorkspaceImageError = (event) => {
    if (!handleStoryStyleThumbnailError(event)) handleWorkspaceAssetLibraryImageError(event);
  };
  ((storyRoot['id'] = 'storyWorkspaceRoot'),
    (storyRoot['className'] = 'story-workspace-root'),
    (storyRoot['dataset']['uiStop'] = '1'),
    (storyRoot['hidden'] = !![]),
    storyRoot['setAttribute']('aria-hidden', 'true'),
    (storyRoot['innerHTML'] =
      '<div class="story-workspace-shell" data-story-workspace-shell>\n    <div class="story-workspace-toolbar" data-story-toolbar></div>\n    <div class="story-page-stage" data-story-page-stage>\n      <main class="story-page-viewport" data-story-page-viewport></main>\n      <div class="story-workspace-generation-loading storyboard-script-loading-overlay" data-story-planning-loading role="status" aria-live="polite" hidden>\n        <div class="storyboard-script-loading-spinner"></div>\n        <div class="storyboard-script-loading-label" data-story-planning-loading-label>正在提取角色、场景与道具</div>\n        <div class="storyboard-script-loading-bar"><div class="storyboard-script-loading-bar-fill"></div></div>\n      </div>\n    </div>\n  </div>\n  <div class="story-canvas-sync-loading storyboard-script-loading-overlay" data-story-canvas-sync-loading role="status" aria-live="polite" aria-label="正在加入画布" aria-hidden="true" tabindex="-1" hidden>\n    <div class="storyboard-script-loading-spinner"></div>\n    <strong class="storyboard-script-loading-label">正在加入画布</strong>\n    <small>同步完成后将自动跳转到画布</small>\n  </div>\n  <div class="story-asset-hover-preview" data-story-asset-hover-preview role="tooltip" aria-hidden="true"></div>\n  <div class="story-clip-video-history-menu" data-story-clip-video-history-menu aria-hidden="true"></div>\n  <input class="story-hidden-input" type="file" data-story-script-file accept=".txt,.docx,.pdf">\n  <input class="story-hidden-input" type="file" data-story-replication-video-file accept="' +
      STORY_REPLICATION_VIDEO_ACCEPT +
      '" multiple>\n  <input class="story-hidden-input" type="file" data-story-asset-file accept="image/*">\n  <input class="story-hidden-input" type="file" data-story-asset-reference-file accept="image/*">\n  <input class="story-hidden-input" type="file" data-story-character-voice-file accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a">\n  <input class="story-hidden-input" type="file" data-story-clip-input-file>'),
    el5['appendChild'](storyRoot));
  const storyLibraryAssignmentMenuPortal = createStoryLibraryAssignmentMenuPortal({
      storyRoot: storyRoot,
      windowObject: windowObject,
    }),
    value127 = (value128 = storyRoot) => storyLibraryAssignmentMenuPortal['closeAppearance'](value128),
    handler2 = (value129) => storyLibraryAssignmentMenuPortal['openAppearance'](value129),
    handler3 = (value130 = storyRoot) => storyLibraryAssignmentMenuPortal['closeTarget'](value130),
    handler4 = (value131) => storyLibraryAssignmentMenuPortal['toggleTarget'](value131),
    toolbarEl = storyRoot['querySelector']('[data-story-toolbar]'),
    workspaceShell = storyRoot['querySelector']('[data-story-workspace-shell]'),
    el6 = storyRoot['querySelector']('[data-story-page-stage]'),
    viewportElement = storyRoot['querySelector']('[data-story-page-viewport]'),
    el7 = storyRoot['querySelector']('[data-story-planning-loading]'),
    el8 = storyRoot['querySelector']('[data-story-planning-loading-label]'),
    loadingElement = storyRoot['querySelector']('[data-story-canvas-sync-loading]'),
    previewElement = storyRoot['querySelector']('[data-story-asset-hover-preview]'),
    menuElement = storyRoot['querySelector']('[data-story-clip-video-history-menu]'),
    el9 = storyRoot['querySelector']('[data-story-script-file]'),
    el10 = storyRoot['querySelector']('[data-story-replication-video-file]'),
    el11 = storyRoot['querySelector']('[data-story-asset-file]'),
    el12 = storyRoot['querySelector']('[data-story-asset-reference-file]'),
    el13 = storyRoot['querySelector']('[data-story-character-voice-file]'),
    el14 = storyRoot['querySelector']('[data-story-clip-input-file]');
  let value132 = '',
    value133 = null,
    value134 = null,
    value135 = null,
    value136 = null,
    value137 = null,
    value138 = '',
    text16 = '',
    list18 = [],
    value139 = '';
  const replicationAnalysisPromises = new Map(),
    replicationSourceFileByEpisodeKey = new Map();
  let value140 = 0x0;
  const storyAssetHoverPreviewController = createStoryAssetHoverPreviewController({
      previewElement: previewElement,
      getState: () => state2,
      getSelectedAppearance: getSelectedAssetAppearance,
      buildContent: buildStoryAssetHoverPreviewContent,
      isStoryAssetHoverLandscape: isStoryAssetHoverLandscape,
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    handler5 = (...args2) => storyAssetHoverPreviewController['show'](...args2);
  let timer = null;
  const value141 = { accumulator: 0x0, lockedUntil: 0x0 },
    map4 = new WeakMap(),
    workspacePageTransitionController = createWorkspacePageTransitionController({
      windowObject: windowObject,
      disposePage: disposePage,
    }),
    activeClipGenerationControllers = new Map(),
    activeBackgroundRecoveries = new Set(),
    activeBackgroundExecutions = new Set(),
    map5 = createStoryTaskBatchCancellationRegistry(),
    cancellationRegistry = createStoryTaskBatchCancellationRegistry(),
    projectData = createStoryProjectDataOwner({ state: state2 });
  let enabled10 = ![],
    enabled11 = ![],
    collaboration = null;
  const workspacePresentationLifecycle = createWorkspacePresentationLifecycle({
      getRoot: () => storyRoot,
      getContentKey: () => coordinator['getRevision'](),
    }),
    value142 = () => {
      const isStoryEpisodeExperimentalSplitAvailable2 =
          isStoryEpisodeExperimentalSplitAvailable(windowObject),
        isStoryAssetExperimentalExtractionAvailable2 =
          isStoryAssetExperimentalExtractionAvailable(windowObject),
        allowDeveloperPromptModes = windowObject?.['DEV_MODE'] === !![];
      if (
        state2['experimentalSplitAvailable'] === isStoryEpisodeExperimentalSplitAvailable2 &&
        state2['experimentalAssetExtractionAvailable'] === isStoryAssetExperimentalExtractionAvailable2 &&
        state2['developerModeAvailable'] === allowDeveloperPromptModes
      )
        return;
      ((state2['experimentalSplitAvailable'] = isStoryEpisodeExperimentalSplitAvailable2),
        (state2['experimentalAssetExtractionAvailable'] = isStoryAssetExperimentalExtractionAvailable2),
        (state2['developerModeAvailable'] = allowDeveloperPromptModes),
        (state2['homeTab'] = resolveStoryVideoReplicationHomeTab(state2, state2['homeTab'])));
      state2['data']?.['project'] &&
        ((state2['data']['project']['planning'] = normalizeStoryProjectPlanning(state2['data']['project'], {
          allowDeveloperPromptModes: allowDeveloperPromptModes,
        })),
        schedulePersistence({ immediate: !![] }));
      if (enabled10) return;
      if (enabled11) render();
    };
  (windowObject?.['addEventListener']?.('aicanvas:runtime-info', value142),
    windowObject?.['addEventListener']?.('dev-mode-changed', value142));
  const showToast = (value143, value144 = 'info', value145, value146) => {
      typeof windowObject?.['showToast'] === 'function' &&
        (value145 === undefined && value146 === undefined
          ? windowObject['showToast'](value143, value144)
          : windowObject['showToast'](value143, value144, value145, value146));
    },
    handler6 = (value147, args3 = {}) => ({
      source: 'story-workspace',
      projectId: normalizeText(value147?.['projectId']),
      ...args3,
    }),
    showTaskApiKeyError = (details2, args4 = {}) => {
      const value148 =
        details2?.['credentialPromptShown'] === !![] ||
        showProviderApiKeyMissingToastForError(details2, { ...args4 });
      return (
        value148 &&
          notifyStoryTaskResult(
            null,
            details2?.['getUserMessage']?.() || details2?.['message'] || '生成任务缺少可用的 API Key。',
            'error',
            { details: details2 },
          ),
        value148
      );
    },
    showTaskResultToast = (value149, value150 = 'info', details3, value151) => {
      if (value150 === 'error' && details3 && showTaskApiKeyError(details3)) return !![];
      const value152 = Boolean(value151?.['projectId']);
      return notifyStoryTaskResult(windowObject?.['showToast'], value149, value150, {
        details: details3,
        ...(value152
          ? {
              duration: 0x2710,
              toastOptions: {
                ariaLabel: String(value149 || '任务完成')['trim']() + '，点击查看结果',
                onClick: () => {
                  void run(value151);
                },
              },
            }
          : {}),
      });
    },
    notifyNavigableGenerationComplete = (
      value153,
      value154,
      value155,
      {
        notificationMessage: notificationMessage = value153,
        tone: tone = 'success',
        details: details4,
        showResultToast: showResultToast = !![],
      } = {},
    ) => {
      const navigationTarget2 = handler6(value154, value155),
        value156 = showResultToast ? showTaskResultToast(value153, tone, details4, navigationTarget2) : ![];
      return (
        void notifyStoryTextGenerationComplete(notificationMessage, { navigationTarget: navigationTarget2 }),
        value156
      );
    },
    showNavigableTaskResultToast = (value157, tone3, value158, value159, details5) =>
      notifyNavigableGenerationComplete(value157, value158, value159, { tone: tone3, details: details5 }),
    notifyTextTaskComplete = (
      value160,
      value161,
      value162,
      { notificationMessage: notificationMessage = value160, tone: tone = 'success', details: details6 } = {},
    ) =>
      notifyNavigableGenerationComplete(value160, value161, value162, {
        notificationMessage: notificationMessage,
        tone: tone,
        details: details6,
      }),
    subscribeGenerationCompleteNotificationClicks2 = subscribeGenerationCompleteNotificationClicks(
      (value163) => {
        if (value163?.['source'] !== 'story-workspace') return;
        void run(value163);
      },
    );
  function run2(value164) {
    return JSON['parse'](JSON['stringify'](value164));
  }
  const workspacePersistencePresentation = createWorkspacePersistencePresentation({
      getRoot: () => storyRoot,
    }),
    storyProjectPersistenceWorkspaceController = createStoryProjectPersistenceWorkspaceController({
      state: state2,
      projectData: projectData,
      windowObject: windowObject,
      saveWorkspace: saveWorkspace,
      onPersistenceState: (value165) => workspacePersistencePresentation['update'](value165),
      projectPackages: projectPackages,
      advanceProjectSession: (value166) => advanceProjectSession(state2, value166),
      openStoredProject: (...args5) => openProject2(...args5),
      render: (...args6) => render(...args6),
      showToast: showToast,
    }),
    {
      collectStoredProject: collectStoredProject,
      coordinator: coordinator,
      importProjectPackage: importProjectPackage,
      importProjectPackageResult: importProjectPackageResult,
      persistNow: persistNow,
      schedule: schedule,
      syncCurrentProjectEntry: syncCurrentProjectEntry,
    } = storyProjectPersistenceWorkspaceController,
    schedulePersistence = (...args7) => {
      return (
        map4['get'](viewportElement?.['querySelector']?.('.story-page.is-current'))?.['syncPrices']?.(),
        schedule(...args7)
      );
    },
    storyAssetLayoutResizeController = createStoryAssetLayoutResizeController({
      state: state2,
      viewportElement: viewportElement,
      documentObject: documentObject,
      windowObject: windowObject,
      schedulePersistence: schedulePersistence,
    }),
    {
      beginAssetDetailSplitResize: beginAssetDetailSplitResize,
      beginAssetSplitResize: beginAssetSplitResize,
    } = storyAssetLayoutResizeController;
  function run3(options15 = {}) {
    const { changed: changed } = projectData['applyChanges']((value167, { isCurrent: isCurrent }) => {
      const list19 = isCurrent
          ? new Set(normalizeStoryClipFrames(value167['clipFrames'])['map']((value168) => value168['id']))
          : null,
        clearDeletedStoryCanvasBindings2 = clearDeletedStoryCanvasBindings(value167, options15);
      if (clearDeletedStoryCanvasBindings2 && list19) {
        const map6 = new Set(
          normalizeStoryClipFrames(value167['clipFrames'])['map']((value169) => value169['id']),
        );
        list19['forEach']((value170) => {
          if (!map6['has'](value170)) run4(value170);
        });
      }
      return clearDeletedStoryCanvasBindings2;
    });
    if (changed) {
      if (enabled11 && state2['view'] === 'episode') {
        if (!syncFrameRail({ refreshContent: !![] })) render();
      }
      schedulePersistence({ immediate: !![] });
    }
    return changed;
  }
  function run5(args8 = {}) {
    const { changed: changed2, currentProjectChanged: currentProjectChanged } = projectData['applyChanges'](
      (value171, { isCurrent: isCurrent2 }) => {
        const episodeId = isCurrent2 ? getSelectedEpisode(state2) : value171['episodes']?.[0x0] || null,
          clipId = isCurrent2 ? getSelectedClip(state2, episodeId) : episodeId?.['clips']?.[0x0] || null;
        return reconcileStoryCanvasMediaNodes(value171, {
          ...args8,
          episodeId: episodeId?.['id'],
          clipId: clipId?.['id'],
        });
      },
    );
    if (!changed2) return ![];
    if (currentProjectChanged) {
      if (enabled11 && state2['view'] === 'episode') {
        if (!syncFrameRail({ refreshContent: !![] })) render();
      }
    }
    return (schedulePersistence({ immediate: !![] }), !![]);
  }
  const projectTasks = createStoryProjectTaskWorkspaceController({
      state: state2,
      activeClipGenerationControllers: activeClipGenerationControllers,
      activeBackgroundExecutions: activeBackgroundExecutions,
      activeBackgroundRecoveries: activeBackgroundRecoveries,
      replicationAnalysisPromises: replicationAnalysisPromises,
      replicationSourceFileByEpisodeKey: replicationSourceFileByEpisodeKey,
      projectData: projectData,
      getWorkspaceDestroyed: () => enabled10,
      stopAssetBreakdownProgress: (...args9) => stopStoryAssetBreakdownProgress(...args9),
      schedulePersistence: (...args10) => schedulePersistence(...args10),
      render: (...args11) => render(...args11),
    }),
    {
      advanceProjectSession: advanceProjectSession,
      beginSession: beginSession,
      createProjectToken: createProjectToken,
      createTaskBatch: createTaskBatch,
      createTokenForData: createTokenForData,
      finishBackgroundTask: finishBackgroundTask,
      getBackgroundExecutionKey: getBackgroundExecutionKey,
      invalidateRuntime: invalidateRuntime,
      isCurrent: isCurrent3,
      isLive: isLive,
      persistChange: persistChange,
      registerProjectData: registerProjectData,
      resetTaskState: resetTaskState,
      restoreTaskState: restoreTaskState,
      startBackgroundTask: startBackgroundTask,
      syncProjectEntry: syncProjectEntry,
      syncTaskBatch: syncTaskBatch,
      updateBackgroundTask: updateBackgroundTask,
      updateBackgroundTaskBatch: updateBackgroundTaskBatch,
    } = projectTasks,
    storyCanvasSyncWorkspaceController = createStoryCanvasSyncWorkspaceController({
      state: state2,
      root: storyRoot,
      workspaceShell: workspaceShell,
      loadingElement: loadingElement,
      documentObject: documentObject,
      operations: {
        createEpisodeCanvas: createEpisodeCanvas,
        createProjectCanvas: createProjectCanvas,
        syncClipFrame: syncClipFrameToCanvas,
      },
      projectTasks: {
        createToken: () => createProjectToken(state2),
        isCurrent: isCurrent3,
        isLive: isLive,
        syncEntry: syncProjectEntry,
      },
      persistence: { schedule: schedulePersistence },
      presentation: {
        closeMenu: (...args12) => run6(...args12),
        handleMediaNodeChanges: (...args13) => run5(...args13),
        refreshEpisodeRail: (...args14) => syncFrameRail(...args14),
        refreshToolbar: (...args15) => renderToolbar(...args15),
        requestWorkspaceMode: requestWorkspaceMode,
        showToast: showToast,
      },
      getSelectedEpisode: (data2) => getSelectedEpisode({ ...state2, data: data2 }),
      getProjectCanvasEpisodes: (...args16) => getStoryProjectCanvasEpisodes(...args16),
      resolveClipGenerationSettings: (value172, value173) =>
        resolveStoryClipVideoGenerationSettings(value172, value173, {
          fallbackModelId: state2['models']['video'],
          fallbackProvider: state2['videoProvider'],
        }),
    }),
    {
      addProject: addProject,
      addSelectedEpisode: addSelectedEpisode,
      destroy: destroy2,
      syncFrame: syncFrame,
    } = storyCanvasSyncWorkspaceController,
    storyClipVideoTaskWorkspaceController = createStoryClipVideoTaskWorkspaceController({
      state: state2,
      activeControllers: activeClipGenerationControllers,
      createProjectToken: createProjectToken,
      createProjectTokenForData: createTokenForData,
      isProjectTaskLive: isLive,
      isProjectTaskCurrent: isCurrent3,
      registerProjectData: registerProjectData,
      startBackgroundTask: startBackgroundTask,
      updateBackgroundTask: updateBackgroundTask,
      finishBackgroundTask: finishBackgroundTask,
      syncProjectEntry: syncProjectEntry,
      restoreProjectTaskState: restoreTaskState,
      schedulePersistence: (...args17) => schedulePersistence(...args17),
      refreshEpisodeCard: (...args18) => run7(...args18),
      refreshClipGeneration: (...args19) => refreshGeneration(...args19),
      render: (...args20) => render(...args20),
      showTaskResultToast: showTaskResultToast,
      showNavigableTaskResultToast: showNavigableTaskResultToast,
      getWorkspaceDestroyed: () => enabled10,
      windowObject: windowObject,
    }),
    {
      createGenerationController: createGenerationController,
      getGenerationKey: getGenerationKey,
      replaceClip: replaceClip,
      resumeTask: resumeTask,
      resumeTasks: resumeTasks,
      syncBackgroundTask: syncBackgroundTask,
      waitForRecoveryManifest: waitForRecoveryManifest,
    } = storyClipVideoTaskWorkspaceController,
    storyClipInputWorkspaceController = createStoryClipInputWorkspaceController({
      state: state2,
      root: storyRoot,
      getSelectedEpisode: getSelectedEpisode,
      getSelectedClip: getSelectedClip,
      replaceClip: replaceClip,
      takePendingInputContext: () => {
        const value174 = value137 || state2['pendingClipInput'];
        return ((value137 = null), (state2['pendingClipInput'] = null), value174);
      },
      createProjectToken: createProjectToken,
      isProjectTaskCurrent: isCurrent3,
      isProjectTaskLive: isLive,
      syncProjectEntry: syncProjectEntry,
      schedulePersistence: (...args21) => schedulePersistence(...args21),
      render: (...args22) => render(...args22),
      showToast: showToast,
    }),
    {
      applyVideoSettings: applyVideoSettings,
      prepareVideoSettings: prepareVideoSettings,
      reconcileSelectedInputsForModel: reconcileSelectedInputsForModel,
      syncVideoDurationInPlace: syncVideoDurationInPlace,
      updateSelectedInput: updateSelectedInput,
      uploadSelectedInput: uploadSelectedInput,
    } = storyClipInputWorkspaceController,
    storyCharacterVoiceWorkspaceController = createStoryCharacterVoiceWorkspaceController({
      state: state2,
      root: storyRoot,
      documentObject: documentObject,
      windowObject: windowObject,
      projectTasks: {
        createToken: () => createProjectToken(state2),
        isCurrent: isCurrent3,
        isLive: isLive,
        start: startBackgroundTask,
        update: updateBackgroundTask,
        finish: finishBackgroundTask,
      },
      findAsset: (value175) => findStoryAsset(state2, value175),
      render: render,
      schedulePersistence: schedulePersistence,
      showToast: showToast,
      showTaskApiKeyError: showTaskApiKeyError,
      showTaskResultToast: showTaskResultToast,
      showNavigableTaskResultToast: showNavigableTaskResultToast,
      isEditorSurfaceActive: () => enabled11 && state2['view'] === 'project' && state2['step'] === 0x2,
    }),
    {
      closeEditor: closeEditor,
      generateSelected: generateSelected,
      openEditor: openEditor,
      playHistory: playHistory,
      playPreview: playPreview,
      requestGeneration: requestGeneration,
      restoreHistory: restoreHistory,
      stopPreview: stopPreview,
      syncPlayerUi: syncPlayerUi,
    } = storyCharacterVoiceWorkspaceController,
    applyImageResult = createStoryAssetGenerationController({
      state: state2,
      activeRecoveries: activeBackgroundRecoveries,
      activeExecutions: activeBackgroundExecutions,
      isWorkspaceDestroyed: () => enabled10,
      hasImageGenerator: () => typeof generateAssetImage === 'function',
      generateImage: (...args23) => generateAssetImage(...args23),
      createProjectToken: () => createProjectToken(state2),
      createProjectTokenForData: createTokenForData,
      isProjectTaskLive: isLive,
      isProjectTaskCurrent: isCurrent3,
      registerProjectData: registerProjectData,
      waitForRecoveryManifest: waitForRecoveryManifest,
      startBackgroundTask: startBackgroundTask,
      updateBackgroundTask: updateBackgroundTask,
      finishBackgroundTask: finishBackgroundTask,
      schedulePersistence: schedulePersistence,
      render: render,
      findAsset: (value176) => findStoryAsset(state2, value176),
      getSelectedAppearance: getSelectedAssetAppearance,
      showToast: showToast,
      showTaskApiKeyError: showTaskApiKeyError,
      showTaskResultToast: showTaskResultToast,
      notifyTaskResult: notifyStoryTaskResult,
      showNavigableTaskResultToast: showNavigableTaskResultToast,
    }),
    {
      generateSelected: generateSelected2,
      requestAppearanceImage: requestAppearanceImage,
      resumePersistedTasks: resumePersistedTasks,
      showGenerationError: showGenerationError,
    } = applyImageResult,
    storyAssetBatchGenerationController = createStoryAssetBatchGenerationController({
      state: state2,
      windowObject: windowObject,
      cancellationRegistry: cancellationRegistry,
      hasImageGenerator: () => typeof generateAssetImage === 'function',
      createProjectToken: () => createProjectToken(state2),
      isProjectTaskLive: isLive,
      isProjectTaskCurrent: isCurrent3,
      createTaskBatch: createTaskBatch,
      syncTaskBatch: syncTaskBatch,
      updateBackgroundTaskBatch: updateBackgroundTaskBatch,
      requestAppearanceImage: requestAppearanceImage,
      requestVoiceGeneration: requestGeneration,
      stopVoicePreview: stopPreview,
      render: render,
      refreshBatchLabel: refreshBatchLabel,
      refreshAssetCard: refreshAssetCard,
      refreshSelectedAsset: refreshSelectedAsset,
      schedulePersistence: schedulePersistence,
      showToast: showToast,
      showAssetGenerationError: showGenerationError,
      showTaskApiKeyError: showTaskApiKeyError,
      notifyTaskResult: notifyStoryTaskResult,
      showNavigableTaskResultToast: showNavigableTaskResultToast,
      notifyNavigableGenerationComplete: notifyNavigableGenerationComplete,
    }),
    { cancel: cancel, generate: generate } = storyAssetBatchGenerationController;
  function run8(value177) {
    return findStoryAssetForHover(state2, value177, getVisibleStoryAssets(state2));
  }
  function run9(assetId2, value178) {
    if (
      assetId2?.['closest']?.('.story-assets-page .story-asset-card-shell') ||
      map7['isActive']() ||
      value138
    ) {
      hideHoverPreview();
      return;
    }
    if (assetId2?.['dataset']?.['storyReferenceSource'] === 'library') {
      const error2 = resolveAssetMentionRef({
          assetId: assetId2['dataset']['storyReferenceAsset'],
          itemIndex: Math['max'](
            0x0,
            Math['trunc'](Number(assetId2['dataset']['storyReferenceAssetIndex']) || 0x0),
          ),
        }),
        imageUrl2 =
          error2?.['type'] === 'image'
            ? normalizeText(error2['thumbUrl'] || error2['url'])
            : normalizeText(error2?.['thumbUrl']);
      if (!error2 || !imageUrl2) {
        hideHoverPreview();
        return;
      }
      return handler5(assetId2, value178, {
        id: normalizeText(error2['assetId']),
        kind: 'library',
        name: normalizeText(error2['name']) || '总素材',
        hoverTitle: normalizeText(error2['assetName']) || '总素材',
        imageUrl: imageUrl2,
        isLibraryAsset: !![],
      });
    }
    const text17 = normalizeText(assetId2?.['dataset']?.['storyReferenceFrame']);
    if (text17) {
      const storyClipFrames = normalizeStoryClipFrames(state2['data']['clipFrames'])['find'](
        (value179) => value179['id'] === text17,
      );
      return handler5(
        assetId2,
        value178,
        createStoryClipFrameHoverAsset(storyClipFrames, getStoryAssetHoverCardId(assetId2)),
      );
    }
    return handler5(
      assetId2,
      value178,
      run8(getStoryAssetHoverCardId(assetId2)),
      getStoryAssetHoverCardAppearanceId(assetId2),
    );
  }
  function hideHoverPreview() {
    storyAssetHoverPreviewController['hide']();
  }
  timer = createStoryMediaHistoryMenuController({
    menuElement: menuElement,
    windowObject: windowObject,
    getMarkup: (el15) => {
      if (state2['clipSelectionMode']) return '';
      const selectedEpisode4 = getSelectedEpisode(state2),
        text18 = normalizeText(el15?.['dataset']?.['storyClipId']),
        value180 = (Array['isArray'](selectedEpisode4?.['clips']) ? selectedEpisode4['clips'] : [])['find'](
          (value181) => normalizeText(value181?.['id']) === text18,
        );
      return (
        menuElement && (menuElement['dataset']['storyClipId'] = text18),
        storyClipProduction['renderEpisode'](state2, selectedEpisode4, value180)['videoHistoryMenu']
      );
    },
  });
  function run10() {
    timer?.['clearHideTimer']();
  }
  function hideHistory(options16 = {}) {
    timer?.['hide'](options16);
  }
  function run11(value182, event3) {
    timer?.['show'](value182, { event: event3 });
  }
  function run12(value183, value184, { persist: persist = ![], layout: layout = null } = {}) {
    const assetSplitter =
        layout ||
        viewportElement['querySelector']('.story-page.is-current .story-episode-detail-page') ||
        viewportElement['querySelector']('.story-episode-detail-page'),
      box = applyStoryEpisodePanelRatiosToLayout(
        assetSplitter,
        {
          assetSplitter: assetSplitter?.['querySelector']?.('[data-story-episode-splitter=\x22assets\x22]'),
          previewSplitter: assetSplitter?.['querySelector']?.(
            '[data-story-episode-splitter=\x22preview\x22]',
          ),
        },
        value183,
        value184,
      );
    ((state2['episodeAssetPanelRatio'] = box['left']), (state2['episodeEditorPanelRatio'] = box['center']));
    if (persist) schedulePersistence({ uiOnly: !![] });
  }
  function run13(event4) {
    const splitter = event4['target']['closest']?.('[data-story-episode-splitter]');
    if (!splitter) return ![];
    const layout2 = splitter['closest']('.story-episode-detail-page'),
      value185 = splitter['dataset']['storyEpisodeSplitter'];
    return beginStoryHorizontalResizeSession({
      event: event4,
      splitter: splitter,
      layout: layout2,
      windowObject: windowObject,
      body: documentObject['body'],
      resizingClass: 'story-episode-resizing',
      onRatio: (value186) => {
        value185 === 'assets'
          ? run12(value186, state2['episodeEditorPanelRatio'], { layout: layout2 })
          : run12(state2['episodeAssetPanelRatio'], value186 - state2['episodeAssetPanelRatio'], {
              layout: layout2,
            });
      },
      onFinish: () => schedulePersistence({ uiOnly: !![] }),
    });
  }
  function renderToolbar() {
    toolbarEl['innerHTML'] = state2['view'] === 'home' ? '' : renderProjectToolbar(state2);
  }
  function run14(el16, el17, value187) {
    if (!el16 || el16['dataset']?.['promptPillKind'] === 'time') return;
    (syncStoryClipPromptPillHoverTarget(el16),
      el16['querySelectorAll']?.('[data-story-voice-separator], [data-story-voice-toggle]')?.['forEach'](
        (el18) => el18['remove'](),
      ),
      el16['classList']?.['remove']('has-story-voice-reference', 'is-story-voice-enabled'));
    const selectedEpisode5 = getSelectedEpisode(state2),
      storyAssetIdFromMentionNodeId = getStoryAssetIdFromMentionNodeId(el16['dataset']?.['assetId']),
      list20 = resolveStoryVideoReplicationClipVoiceAssetIds(state2['data'], value187);
    if (list20 && !list20['includes'](storyAssetIdFromMentionNodeId)) {
      setStoryClipMentionVoiceEnabled(el16, state2['data']['assets'], ![]);
      return;
    }
    const voiceEnabled = getStoryEpisodeCharacterVoiceEnabled(
      selectedEpisode5,
      storyAssetIdFromMentionNodeId,
    );
    typeof voiceEnabled === 'boolean' &&
      setStoryClipMentionVoiceEnabled(el16, state2['data']['assets'], voiceEnabled);
    const storyClipMentionVoiceState = getStoryClipMentionVoiceState(el16, state2['data']['assets'], {
      voiceEnabled: voiceEnabled,
    });
    if (!storyClipMentionVoiceState['available']) {
      setStoryClipMentionVoiceEnabled(el16, state2['data']['assets'], ![]);
      return;
    }
    (el16['classList']?.['add']('has-story-voice-reference'),
      el16['classList']?.['toggle']('is-story-voice-enabled', storyClipMentionVoiceState['enabled']));
    const el19 = documentObject['createElement']('span');
    ((el19['className'] = 'story-voice-pill-separator'),
      (el19['dataset']['storyVoiceSeparator'] = 'true'),
      el19['setAttribute']('aria-hidden', 'true'),
      el19['setAttribute']('contenteditable', 'false'),
      (el19['textContent'] = '·'));
    const el20 = documentObject['createElement']('button');
    ((el20['type'] = 'button'),
      (el20['className'] =
        'story-voice-pill-toggle' + (storyClipMentionVoiceState['enabled'] ? '\x20is-active' : '')),
      (el20['dataset']['storyVoiceToggle'] = 'true'),
      el20['setAttribute']('contenteditable', 'false'),
      el20['setAttribute']('aria-pressed', String(storyClipMentionVoiceState['enabled'])),
      el20['setAttribute'](
        'aria-label',
        storyClipMentionVoiceState['enabled'] ? '关闭角色声音参考' : '启用角色声音参考',
      ),
      (el20['innerHTML'] = renderStoryVoiceIcon(![])),
      el20['addEventListener']('mousedown', (event5) => {
        (event5['preventDefault'](), event5['stopPropagation']());
      }),
      el20['addEventListener']('click', (event6) => {
        (event6['preventDefault'](), event6['stopPropagation']());
        const voiceEnabled2 = getStoryEpisodeCharacterVoiceEnabled(
            selectedEpisode5,
            storyAssetIdFromMentionNodeId,
          ),
          storyClipMentionVoiceState2 = getStoryClipMentionVoiceState(el16, state2['data']['assets'], {
            voiceEnabled: voiceEnabled2,
          }),
          value188 = !storyClipMentionVoiceState2['enabled'];
        (setStoryEpisodeCharacterVoiceEnabled(selectedEpisode5, storyAssetIdFromMentionNodeId, value188),
          el17['querySelectorAll']?.('.ref-pill')?.['forEach']((el21) => {
            if (
              getStoryAssetIdFromMentionNodeId(el21['dataset']?.['assetId']) !== storyAssetIdFromMentionNodeId
            )
              return;
            (setStoryClipMentionVoiceEnabled(el21, state2['data']['assets'], value188),
              run14(el21, el17, value187));
          }),
          (value187['prompt'] = sanitizePromptHtmlForCommit(el17['innerHTML'])),
          refreshReferenceSummary(),
          schedulePersistence());
      }),
      el16['appendChild'](el19),
      el16['appendChild'](el20));
  }
  function run15() {
    const asset4 = findStoryAsset(state2, state2['selectedAssetId']),
      appearance4 = asset4 ? getSelectedAssetAppearance(state2, asset4) : null;
    return { asset: asset4, appearance: appearance4 };
  }
  function run16(promptEl) {
    const storyAssetPromptEditorContext = getStoryAssetPromptEditorContext(state2, promptEl);
    if (
      !promptEl ||
      !storyAssetPromptEditorContext['asset'] ||
      !storyAssetPromptEditorContext['appearance'] ||
      storyAssetPromptEditorContext['asset']['isLibraryAsset']
    )
      return null;
    return {
      nodeId: 'story-asset-prompt:' + storyAssetPromptEditorContext['asset']['id'],
      promptEl: promptEl,
      _data: { type: 'ai-image', model: state2['models']['image'], provider: state2['imageProvider'] },
      getMentionCandidates: ({ query: query = '' } = {}) => {
        const { asset: asset5, appearance: appearance5 } = getStoryAssetPromptEditorContext(state2, promptEl);
        if (
          !asset5 ||
          !appearance5 ||
          asset5['isLibraryAsset'] ||
          !isStoryAssetBaseAppearance(asset5, appearance5)
        )
          return [];
        const storyAssetStyleReferenceMentionCandidate = buildStoryAssetStyleReferenceMentionCandidate(
          appearance5,
          { query: query },
        );
        return storyAssetStyleReferenceMentionCandidate ? [storyAssetStyleReferenceMentionCandidate] : [];
      },
      getMentionVisual: ({ mention: mention } = {}) => ({
        thumbUrl: normalizeText(mention?.['thumbUrl']),
        iconType: 'image',
      }),
      decorateMentionPill: ({ pill: pill } = {}) => {
        (pill?.['classList']?.['add']('story-asset-style-reference-pill'),
          pill?.['dataset'] && (pill['dataset']['promptPillKind'] = STORY_ASSET_STYLE_REFERENCE_PILL_KIND));
      },
      commitPromptHtml: () => {
        updateStoryAssetPromptFromEditor(state2, promptEl) && schedulePersistence();
      },
      getPromptHtml: () => {
        const { appearance: appearance6 } = getStoryAssetPromptEditorContext(state2, promptEl);
        return appearance6?.['prompt'] || '';
      },
    };
  }
  function run17(promptEl2) {
    const episode = getSelectedEpisode(state2),
      defaultDuration = getSelectedClip(state2, episode);
    if (!promptEl2 || !episode || !defaultDuration) return null;
    if (state2['data']['project']['sourceMode'] === 'video-replication') mountStorySpeechGapEditor(promptEl2);
    return {
      nodeId: 'story-clip:' + defaultDuration['id'],
      promptEl: promptEl2,
      keepAssetMentionPills: !![],
      _data: {
        type: 'ai-video',
        model: state2['models']['video'],
        provider: state2['videoProvider'],
        generationParams: state2['videoGenerationParams'],
      },
      getMentionMenuPages: () => [
        { id: 'assets', label: '素材', icon: 'assets' },
        { id: 'tools', label: '工具', icon: 'tools' },
      ],
      getMentionMenuDefaultPage: () => 'assets',
      getMentionCandidates: ({ query: query = '' } = {}) =>
        buildStoryClipMentionCandidates({
          assets: state2['data']['assets'],
          episode: episode,
          libraryCandidates: getAssetMentionCandidates(),
          clipFrames: state2['data']['clipFrames'],
          query: query,
          includeTime: !![],
          includeClipFrames: !![],
          defaultDuration: defaultDuration['duration'],
        })['map']((args24) =>
          args24['pillKind'] === 'time'
            ? { ...args24, thumbNode: createStoryClipTimeMentionIcon(documentObject) }
            : args24,
        ),
      onMentionCandidateHover: ({ candidate: candidate, item: item2, event: event7 } = {}) => {
        const text19 = normalizeText(candidate?.['storyClipFrameId']);
        if (text19 && item2) {
          const error3 = normalizeStoryClipFrames(state2['data']['clipFrames'])['find'](
              (value189) => value189['id'] === text19,
            ),
            imageUrl3 = resolveStoryClipFrameImageUrl(error3);
          if (!error3 || !imageUrl3) {
            hideHoverPreview();
            return;
          }
          handler5(item2, event7, {
            id: 'story-clip-frame-preview:' + error3['id'],
            kind: 'clip-frame',
            name: normalizeText(candidate['subtitle'] || error3['name']) || '视频提取帧',
            hoverTitle: normalizeText(candidate['label']) || '片段帧',
            imageUrl: imageUrl3,
            isLibraryAsset: !![],
          });
          return;
        }
        const text20 = normalizeText(candidate?.['storyAssetId']),
          text21 = normalizeText(candidate?.['storyAppearanceId']);
        if (!text20 || !item2) {
          hideHoverPreview();
          return;
        }
        ((item2['dataset']['storyAssetHoverId'] = text20),
          text21
            ? (item2['dataset']['storyAssetHoverAppearanceId'] = text21)
            : delete item2['dataset']['storyAssetHoverAppearanceId'],
          run9(item2, event7));
      },
      onMentionCandidateHoverEnd: () => hideHoverPreview(),
      getMentionVisual: ({ mention: mention2, pill: pill2 } = {}) => {
        const text22 = normalizeText(mention2?.['pillKind'] || pill2?.['dataset']?.['promptPillKind']);
        if (text22 === 'time') return { thumbNode: createStoryClipTimeMentionIcon(documentObject) };
        if (mention2?.['storyAssetId'])
          return { thumbUrl: normalizeText(mention2['thumbUrl']), iconType: 'image' };
        const response4 = resolveStoryClipFrameMentionRef(
          { dataset: { assetId: mention2?.['assetId'] || pill2?.['dataset']?.['assetId'] } },
          state2['data']['clipFrames'],
        );
        if (response4)
          return { thumbUrl: normalizeText(response4['thumbUrl'] || response4['url']), iconType: 'image' };
        const response5 = resolveStoryClipAssetMentionRef(pill2, state2['data']['assets']);
        if (!response5) return null;
        return { thumbUrl: normalizeText(response5['thumbUrl'] || response5['url']), iconType: 'image' };
      },
      decorateMentionPill: ({ pill: pill3 } = {}) => {
        (run14(pill3, promptEl2, defaultDuration),
          pill3?.['dataset']?.['refUnresolved'] === 'true' &&
            (pill3['setAttribute']?.('data-tooltip', '缺少图片素材'),
            pill3['removeAttribute']?.('data-native-title'),
            pill3['removeAttribute']?.('data-tooltip-source'),
            pill3['removeAttribute']?.('title')));
      },
      commitPromptHtml: (value190) => {
        ((defaultDuration['prompt'] = value190), refreshReferenceSummary(), schedulePersistence());
      },
      getPromptHtml: () => defaultDuration['prompt'],
      onPromptPillActivate: ({ pill: pill4 } = {}) => {
        if (pill4?.['dataset']?.['promptPillKind'] !== 'time') return ![];
        return (
          beginStoryClipTimePillEdit({
            pill: pill4,
            documentObject: documentObject,
            onCommit: () => {
              ((defaultDuration['prompt'] = sanitizePromptHtmlForCommit(promptEl2['innerHTML'])),
                schedulePersistence());
            },
          }),
          !![]
        );
      },
    };
  }
  function insertMention(assetId3, { assetIndex: assetIndex = 0x0, triggerRange: triggerRange = null } = {}) {
    const storyAsset = findStoryAsset(state2, assetId3),
      clips2 = getSelectedEpisode(state2),
      selectedClip2 = getSelectedClip(state2, clips2);
    if (!selectedClip2) return ![];
    const el22 = storyRoot['querySelector']('[data-story-clip-prompt]'),
      enabled12 = run17(el22);
    let candidate2 = storyAsset
      ? buildStoryClipMentionCandidates({
          assets: [storyAsset],
          episode: { assetIds: [storyAsset['id']] },
        })[0x0]
      : null;
    !candidate2 &&
      (candidate2 = buildStoryClipFrameMentionCandidates(state2['data']['clipFrames'], {
        clips: clips2?.['clips'],
        episodeId: clips2?.['id'],
      })
        ['flatMap']((value191) => value191['mentionVariants'] || [value191])
        ['find'](
          (enabled13) => enabled13['assetId'] === normalizeText(assetId3) && !enabled13['limitReason'],
        ));
    if (!candidate2) {
      const assetMentionRef = resolveAssetMentionRef({
        assetId: assetId3,
        itemIndex: Math['max'](0x0, Math['trunc'](Number(assetIndex) || 0x0)),
      });
      candidate2 = assetMentionRef
        ? buildStoryClipMentionCandidates({ libraryCandidates: [assetMentionRef] })[0x0]
        : null;
    }
    if (!enabled12 || !candidate2) return ![];
    const enabled14 = triggerRange
      ? _insertMentionPill(enabled12, {
          candidate: candidate2,
          triggerRange: triggerRange,
          atIndex: triggerRange['startOffset'],
        })
      : Boolean(appendMentionPillToPrompt(enabled12, candidate2));
    if (!enabled14) return ![];
    return (el22?.['focus']?.(), !![]);
  }
  const map7 = createStoryAssetPromptDragController({
      root: storyRoot,
      documentObject: documentObject,
      windowObject: windowObject,
      insertMention: insertMention,
      hideHoverPreview: hideHoverPreview,
    }),
    {
      begin: begin,
      finish: finish,
      handleWindowPointerCancel: handleWindowPointerCancel,
      handleWindowPointerMove: handleWindowPointerMove,
      handleWindowPointerUp: handleWindowPointerUp,
      hideCaret: hideCaret,
      showCaret: showCaret,
    } = map7;
  function run18() {
    ((value138 = ''), (value140 = 0x0), map7['clear']());
  }
  const storyClipAdjustmentController = createStoryClipAdjustmentController({
      state: state2,
      root: storyRoot,
      documentObject: documentObject,
      adjustClipPrompt: adjustClipPrompt,
      getSelection: () => {
        const episode2 = getSelectedEpisode(state2);
        return { episode: episode2, clip: getSelectedClip(state2, episode2) };
      },
      projectTasks: {
        createToken: () => createProjectToken(state2),
        isLive: isLive,
        isCurrent: isCurrent3,
        syncEntry: syncProjectEntry,
      },
      applyClipVideoSettings: applyVideoSettings,
      schedulePersistence: schedulePersistence,
      render: render,
      refreshPromptRestore: refreshPromptRestore,
      refreshReferenceSummary: refreshReferenceSummary,
      refreshTimeline: refreshTimeline,
      notifyTextTaskComplete: notifyTextTaskComplete,
      showToast: showToast,
      showTaskApiKeyError: showTaskApiKeyError,
      showTaskResultToast: showTaskResultToast,
    }),
    {
      applySelected: applySelected,
      discardSelected: discardSelected,
      generateCandidate: generateCandidate,
      regenerateSelected: regenerateSelected,
      resetUi: resetUi,
      restorePromptHistory: restorePromptHistory,
    } = storyClipAdjustmentController;
  function run19(el23) {
    const value192 = el23?.['querySelector']?.('[data-story-clip-prompt]'),
      enabled15 = run17(value192);
    if (!enabled15) return null;
    const bindPromptMentionHost2 = bindPromptMentionHost(enabled15);
    return (
      syncStoryClipPromptPillPresentation(value192, state2['data']['assets'], state2['data']['clipFrames']),
      bindPromptMentionHost2
    );
  }
  function run20(el24) {
    const value193 = el24?.['querySelector']?.('[data-story-asset-prompt][contenteditable="true"]'),
      enabled16 = run16(value193);
    if (!enabled16) return null;
    return bindPromptMentionHost(enabled16, { commitHydratedPrompt: ![] });
  }
  function run21(value194) {
    const episodeId2 = getSelectedEpisode(state2),
      clipId2 = getSelectedClip(state2, episodeId2);
    return bindStoryVideoPreviewPlayer(value194, {
      projectId: state2['data']?.['project']?.['id'],
      episodeId: episodeId2?.['id'],
      clipId: clipId2?.['id'],
    });
  }
  const storyClipFrameProductionController = createStoryClipFrameProductionController({
      state: state2,
      viewportEl: viewportElement,
      documentObject: documentObject,
      windowObject: windowObject,
      getSelection: () => {
        const episode3 = getSelectedEpisode(state2);
        return { episode: episode3, clip: getSelectedClip(state2, episode3) };
      },
      projectTasks: {
        createToken: () => createProjectToken(state2),
        isLive: isLive,
        isCurrent: isCurrent3,
        syncEntry: syncProjectEntry,
      },
      schedulePersistence: schedulePersistence,
      syncFrameToCanvas: syncFrame,
      syncFrameRail: syncFrameRail,
      settleFrameCard: settleFrameCard,
      render: render,
      showToast: showToast,
    }),
    { captureSelected: captureSelected, trimSelected: trimSelected } = storyClipFrameProductionController;
  function run22(value195) {
    const el25 = documentObject['createElement']('article');
    ((el25['className'] = 'story-page'), (el25['innerHTML'] = value195));
    const el26 = el25['querySelector']('[data-story-marquee-page-surface]');
    el26?.['dataset']['storyMarqueePageSurface'] &&
      (el25['dataset']['storyMarqueeSurface'] = el26['dataset']['storyMarqueePageSurface']);
    el25['querySelector']('.story-outline-page') && el25['classList']['add']('story-page--outline');
    (el25['querySelector']('.story-assets-layout')?.['style']['setProperty'](
      '--story-assets-left',
      normalizeStoryAssetSplitRatio(state2['assetSplitRatio']) + '%',
    ),
      el25['querySelector']('.story-assets-page')?.['style']['setProperty'](
        '--story-assets-left',
        normalizeStoryAssetSplitRatio(state2['assetSplitRatio']) + '%',
      ));
    const box2 = normalizeStoryEpisodePanelRatios(
        state2['episodeAssetPanelRatio'],
        state2['episodeEditorPanelRatio'],
      ),
      el27 = el25['querySelector']('.story-episode-detail-page');
    return (
      el27?.['style']['setProperty']('--story-episode-assets-width', box2['left'] + '%'),
      el27?.['style']['setProperty']('--story-episode-editor-width', box2['center'] + '%'),
      run23(el25),
      windowObject['requestAnimationFrame']?.(() =>
        el25['querySelector']('[data-workspace-episode-rail-item][aria-current=\x22page\x22]')?.[
          'scrollIntoView'
        ]?.({ block: 'nearest', inline: 'nearest' }),
      ),
      el25
    );
  }
  function run23(el28) {
    const list21 = [],
      syncPrices = bindStoryWorkspacePricing(el28, {
        state: state2,
        getSelectedClip: () => getSelectedClip(state2, getSelectedEpisode(state2)),
        getSelectedImageData: () => {
          const referenceImageUrls = getSelectedStoryAsset(state2, getVisibleStoryAssets(state2)),
            prompt = referenceImageUrls ? getSelectedAssetAppearance(state2, referenceImageUrls) : null;
          return {
            prompt: prompt?.['prompt'] || referenceImageUrls?.['prompt'] || '',
            referenceImageUrls: referenceImageUrls
              ? getStoryAssetAppearanceReferenceUrls(referenceImageUrls, prompt)
              : [],
          };
        },
        getVideoReferenceCounts: (value196) => storyClipProduction['getInputReferenceCounts'](value196),
      });
    (list21['push'](syncPrices),
      list21['push'](
        bindStoryAudioAssets(el28, {
          state: state2,
          createToken: () => createProjectToken(state2),
          isLive: isLive,
          isCurrent: isCurrent3,
          syncEntry: syncProjectEntry,
          persist: schedulePersistence,
          render: render,
          uploadFile: uploadFile,
          saveAssetPackageItem: saveAssetPackageItem,
          showToast: showToast,
          startTask: startBackgroundTask,
          finishTask: finishBackgroundTask,
        }),
      ),
      list21['push'](
        bindStoryReplicationIntake(el28, {
          root: storyRoot,
          state: state2,
          analyze: (value197) => storyVideoReplicationWorkspaceController['analyzeSelected'](value197),
          sync: syncCurrentProjectEntry,
          persist: () => schedulePersistence({ immediate: !![] }),
        }),
      ),
      list21['push'](
        bindStoryReplicationReview(el28, {
          state: state2,
          createProjectToken: () => createProjectToken(state2),
          isProjectTaskLive: isLive,
          syncProjectEntry: syncProjectEntry,
          schedulePersistence: schedulePersistence,
          refreshFooter: () => refreshFooter(),
          reanalyze: (value198) => storyVideoReplicationWorkspaceController['reanalyzeEpisode'](value198),
          showToast: showToast,
        }),
      ));
    let value199 = ![];
    const destroy3 = () => {
      if (value199) return;
      value199 = !![];
      for (const value200 of list21['reverse']()) {
        try {
          value200?.['destroy']?.();
        } catch (value201) {
          globalThis['console']?.['warn']?.('[storyWorkspace] 页面控制器清理失败', value201);
        }
      }
      list21['length'] = 0x0;
    };
    try {
      const run24 = (el29, handler7) => {
        if (!el29) return;
        const value202 = (value203) => {
          handler7(value203);
        };
        (el29['addEventListener']('pointerdown', value202),
          list21['push']({ destroy: () => el29['removeEventListener']('pointerdown', value202) }));
      };
      (run24(el28['querySelector']('[data-story-assets-splitter]'), beginAssetSplitResize),
        run24(el28['querySelector']('[data-story-asset-detail-splitter]'), beginAssetDetailSplitResize),
        el28['querySelectorAll']('[data-story-episode-splitter]')['forEach']((value204) => {
          run24(value204, run13);
        }));
      const value205 = run20(el28);
      value205 && list21['push'](value205);
      const value206 = run19(el28);
      if (value206) list21['push'](value206);
      let value207 = run21(el28);
      list21['push']({
        destroy() {
          (value207?.['destroy']?.(), (value207 = null));
        },
      });
      const bindStoryOutlineNavigation2 = bindStoryOutlineNavigation(el28, { windowObject: windowObject });
      if (bindStoryOutlineNavigation2) list21['push'](bindStoryOutlineNavigation2);
      let bindAIGenTextModelSelector2 = null;
      const refreshTextModelSelector = () => {
        (bindAIGenTextModelSelector2?.['destroy']?.(), (bindAIGenTextModelSelector2 = null));
        const el30 = el28['querySelector']('[data-aigen-text-model-selector]');
        if (!el30) return;
        const value208 = Boolean(
          el30['classList']?.['contains']('story-home-text-model-selector') &&
          state2['view'] === 'home' &&
          state2['homeTab'] === 'replication',
        );
        bindAIGenTextModelSelector2 = bindAIGenTextModelSelector(el30, {
          modelId: state2['models']['text'],
          provider: state2['textProvider'],
          providerProfileId: state2['textProviderProfileId'],
          getDisplayModelName: getDisplayModelName,
          documentObject: documentObject,
          onChange: ({ modelId: modelId, provider: provider, providerProfileId: providerProfileId }) => {
            if (value208 && resolveStoryVideoInputTextModelId(modelId) !== modelId) return;
            ((state2['models']['text'] = modelId),
              (state2['textProvider'] = provider),
              (state2['textProviderProfileId'] = providerProfileId),
              schedulePersistence());
          },
        });
      };
      (refreshTextModelSelector(),
        list21['push']({
          destroy() {
            (bindAIGenTextModelSelector2?.['destroy']?.(), (bindAIGenTextModelSelector2 = null));
          },
        }));
      const value209 = el28['querySelector']('[data-aigen-image-model-selector]');
      if (value209) {
        const bindAIGenImageModelSelector2 = bindAIGenImageModelSelector(value209, {
          modelId: state2['models']['image'],
          provider: state2['imageProvider'],
          generationParams: state2['imageGenerationParams'],
          generationParamsByModel: state2['imageGenerationParamsByModel'],
          showSchemaControls: !![],
          onChange: ({
            modelId: modelId2,
            provider: provider2,
            generationParams: generationParams,
            generationParamsByModel: generationParamsByModel,
          }) => {
            ((state2['models']['image'] = modelId2),
              (state2['imageProvider'] = resolveModelProvider(modelId2, provider2)),
              (state2['imageGenerationParams'] = normalizeStoryImageGenerationParams(
                modelId2,
                generationParams,
              )),
              (state2['imageGenerationParamsByModel'] = generationParamsByModel),
              schedulePersistence());
          },
          documentObject: documentObject,
          windowObject: windowObject,
          floatingMenuHost: storyRoot,
          schemaPopupPlacement: 'portal-auto-up',
        });
        list21['push'](bindAIGenImageModelSelector2);
      }
      let bindAIGenVideoModelSelector2 = null,
        el31 = null;
      const el32 = el28['querySelector']('[data-aigen-video-model-selector]');
      if (el32) {
        const selectedClip3 = getSelectedClip(state2, getSelectedEpisode(state2)),
          generationParams2 = resolveStoryClipVideoGenerationParams(
            selectedClip3,
            state2['models']['video'],
            state2['videoGenerationParams'],
          );
        ((bindAIGenVideoModelSelector2 = bindAIGenVideoModelSelector(el32, {
          modelId: state2['models']['video'],
          provider: state2['videoProvider'],
          generationParams: generationParams2,
          generationParamsByModel: {
            ...state2['videoGenerationParamsByModel'],
            [state2['models']['video']]: { ...generationParams2 },
          },
          providerProfileId: state2['videoProviderProfileId'],
          providerProfileIdByModel: state2['videoProviderProfileIdByModel'],
          referenceCounts: storyClipProduction['getInputReferenceCounts'](
            getSelectedClip(state2, getSelectedEpisode(state2)),
          ),
          showSchemaControls: !![],
          runningHubWorkflowAllowedModelIds: STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS,
          modelSubmenuPlacement: 'viewport-auto',
          onChange: ({
            modelId: modelId3,
            provider: provider3,
            generationParams: generationParams3,
            generationParamsByModel: generationParamsByModel2,
            providerProfileId: providerProfileId2,
            providerProfileIdByModel: providerProfileIdByModel,
            patch: patch,
          }) => {
            const previousModelId = state2['models']['video'],
              clip = getSelectedClip(state2, getSelectedEpisode(state2)),
              previousGenerationParams = normalizeStoryVideoGenerationParams(
                previousModelId,
                state2['videoGenerationParams'],
              ),
              storyVideoFixedInputVisibilityKey = getStoryVideoFixedInputVisibilityKey(
                previousModelId,
                state2['videoProvider'],
                previousGenerationParams,
              ),
              enabled17 = Boolean(state2['videoGenerationParamsByModel']?.[modelId3]),
              value210 = Boolean(patch?.['model']) && !enabled17,
              modelChanged = Boolean(patch?.['model']) && modelId3 !== previousModelId;
            state2['models']['video'] = modelId3;
            if (modelChanged) syncStoryPromptModeForVideoModel(state2, modelId3, getSelectedEpisode(state2));
            ((state2['videoProvider'] = resolveStoryVideoProvider(modelId3, provider3)),
              (state2['videoProviderProfileId'] = providerProfileId2),
              (state2['videoProviderProfileIdByModel'] = providerProfileIdByModel));
            const storyVideoGenerationParams = normalizeStoryVideoGenerationParams(
              modelId3,
              value210 ? applyStoryVideoInitialModeDefault(modelId3, generationParams3) : generationParams3,
            );
            let nextGenerationParams = value210
              ? applyStoryAspectRatioToVideoGenerationParams(
                  modelId3,
                  storyVideoGenerationParams,
                  state2['data']['project']?.['aspectRatio'],
                )
              : storyVideoGenerationParams;
            const reconcileStoryClipVideoGenerationDurationChange2 =
              reconcileStoryClipVideoGenerationDurationChange({
                clip: clip,
                previousModelId: previousModelId,
                modelId: modelId3,
                previousGenerationParams: previousGenerationParams,
                nextGenerationParams: nextGenerationParams,
                generationParamsChanged: Boolean(patch?.['generationParams']),
                modelChanged: modelChanged,
              });
            nextGenerationParams = reconcileStoryClipVideoGenerationDurationChange2['generationParams'];
            reconcileStoryClipVideoGenerationDurationChange2['durationChanged'] &&
              syncVideoDurationInPlace(clip);
            ((state2['videoGenerationParams'] = nextGenerationParams),
              (state2['videoGenerationParamsByModel'] = {
                ...generationParamsByModel2,
                [previousModelId]: { ...previousGenerationParams },
                [modelId3]: { ...state2['videoGenerationParams'] },
              }),
              reconcileSelectedInputsForModel(),
              schedulePersistence(),
              el31?.['sync']());
            const value211 =
              storyVideoFixedInputVisibilityKey !==
              getStoryVideoFixedInputVisibilityKey(
                state2['models']['video'],
                state2['videoProvider'],
                state2['videoGenerationParams'],
              );
            state2['view'] === 'episode' && (patch?.['model'] || value211) && render();
          },
          documentObject: documentObject,
          windowObject: windowObject,
          floatingMenuHost: storyRoot,
          schemaPopupPlacement: 'portal-auto-up',
        })),
          list21['push'](bindAIGenVideoModelSelector2));
      }
      const panel = el28['querySelector']('[data-story-video-provider-profile]');
      el32 && panel && el32['appendChild'](panel);
      panel &&
        ((el31 = createModelProviderProfileControl({
          panel: panel,
          getNodeData: () => ({
            model: state2['models']['video'],
            provider: state2['videoProvider'],
            providerProfileId: state2['videoProviderProfileId'],
            providerProfileIdByModel: state2['videoProviderProfileIdByModel'],
          }),
          onChange: (value212) => {
            if (bindAIGenVideoModelSelector2?.['applyProviderProfilePatch']?.(value212)) return;
            ((state2['videoProviderProfileId'] = value212['providerProfileId']),
              (state2['videoProviderProfileIdByModel'] = value212['providerProfileIdByModel']),
              schedulePersistence(),
              el31?.['sync']());
          },
        })),
        list21['push']({ destroy: () => el31?.['remove']() }));
      const el33 = el28['querySelector']('[data-story-character-voice-panel]');
      if (el33 && state2['characterVoiceEditor']) {
        const footer = el33['querySelector']('[data-story-character-voice-model-footer]'),
          nodeId = 'story-character-voice-draft-' + state2['characterVoiceEditor']['assetId'],
          store = {
            getState: () => ({
              nodes: { [nodeId]: state2['characterVoiceEditor']?.['nodeData'] || {} },
            }),
            updateNodeData: (value213, args25 = {}) => {
              if (!state2['characterVoiceEditor']) return;
              ((state2['characterVoiceEditor']['nodeData'] = {
                ...(state2['characterVoiceEditor']['nodeData'] || {}),
                ...args25,
              }),
                syncPrices['syncPrices']());
            },
          };
        if (footer) {
          const trigger = footer['querySelector']('.img-model-btn-trigger'),
            menu = footer['querySelector']('.node-model-menu'),
            floatingModelMenuPortal = createFloatingModelMenuPortal({
              menu: menu,
              trigger: trigger,
              host: storyRoot,
              documentObject: documentObject,
              windowObject: windowObject,
              portalClass: 'aigen-audio-model-menu-portal',
              submenuPlacement: 'viewport-auto-up',
            });
          (list21['push']({
            destroy: bindAudioWorkflowSchemaSlotControls({
              footer: footer,
              nodeId: nodeId,
              nodeData: state2['characterVoiceEditor']['nodeData'],
              store: store,
            }),
          }),
            list21['push']({
              destroy: bindNodeFooterController(footer, {
                onOutsideClose: () => floatingModelMenuPortal['close'](),
              }),
            }));
          const value214 = (event8) => {
              event8['stopPropagation']();
              const value215 = !floatingModelMenuPortal['isOpen']();
              closeNodeFooterMenus(footer);
              if (value215) floatingModelMenuPortal['open']();
              else floatingModelMenuPortal['close']();
            },
            value216 = (event9) => event9['stopPropagation'](),
            value217 = () => floatingModelMenuPortal['close']();
          (trigger?.['addEventListener']('click', value214),
            menu?.['addEventListener']('click', value216),
            footer['addEventListener']('ui-schema-menu-before-open', value217),
            list21['push']({
              destroy: () => {
                (trigger?.['removeEventListener']('click', value214),
                  menu?.['removeEventListener']('click', value216),
                  footer['removeEventListener']('ui-schema-menu-before-open', value217),
                  floatingModelMenuPortal['destroy']());
              },
            }));
          const value218 = (event10) => {
            const el34 = event10['target']['closest']('.node-menu-item[data-value]');
            if (!el34 || !menu?.['contains'](el34) || el34['dataset']['disabled'] === 'true') return;
            (event10['stopPropagation'](),
              (state2['characterVoiceEditor'] = selectStoryCharacterVoiceWorkflow(
                state2['characterVoiceEditor'],
                el34['dataset']['value'],
              )),
              render());
          };
          (menu?.['addEventListener']('click', value218),
            list21['push']({ destroy: () => menu?.['removeEventListener']('click', value218) }));
          const el35 = footer['querySelector']('.rh-adv-btn'),
            el36 = footer['querySelector']('.rh-adv-panel'),
            value219 = (event11) => {
              event11['stopPropagation']();
              const value220 = !el36?.['classList']['contains']('show');
              (floatingModelMenuPortal['close'](),
                closeNodeFooterMenus(footer, value220 ? el36 : null),
                el36?.['classList']['toggle']('show', value220),
                el35?.['classList']['toggle']('active', value220),
                el35?.['setAttribute']('aria-expanded', String(value220)));
            };
          (el35?.['addEventListener']('click', value219),
            list21['push']({ destroy: () => el35?.['removeEventListener']('click', value219) }));
        }
        const value221 = el33['querySelector']('[data-audio-playback-surface]'),
          audioPlaybackSurfaceController = createAudioPlaybackSurfaceController(value221, {
            onBeforePlay: stopPreview,
            onError: () => showToast('声音参考播放失败。', 'warn'),
          });
        if (audioPlaybackSurfaceController) list21['push'](audioPlaybackSurfaceController);
      }
      return (
        map4['set'](el28, {
          syncPrices: syncPrices['syncPrices'],
          destroy: destroy3,
          refreshTextModelSelector: refreshTextModelSelector,
          refreshVideoPreview() {
            (value207?.['destroy']?.(), (value207 = run21(el28)));
          },
        }),
        el28
      );
    } catch (value222) {
      destroy3();
      throw value222;
    }
  }
  function disposePage(el37) {
    (map4['get'](el37)?.['destroy']?.(), map4['delete'](el37), el37?.['remove']?.());
  }
  function run25() {
    workspacePageTransitionController['cancel']();
  }
  function run26(
    value223,
    direction2 = 'none',
    onTransitionComplete2 = null,
    { transitionScope: transitionScope = 'page' } = {},
  ) {
    (handler3(), run25());
    const current2 = viewportElement['querySelector']('.story-page.is-current'),
      page = run22(value223);
    if (!current2 || direction2 === 'none')
      return (
        viewportElement['querySelectorAll'](':scope\x20>\x20.story-page')['forEach']((value224) => {
          if (value224 !== page) disposePage(value224);
        }),
        viewportElement['replaceChildren'](page),
        page['classList']['add']('is-current'),
        onTransitionComplete2?.(),
        { page: page, committed: Promise['resolve'](!![]), committedImmediately: !![] }
      );
    const value225 = current2['querySelector']('[data-story-assets-switch-region]'),
      el38 = page['querySelector']('[data-story-assets-switch-region]'),
      transitionElement = transitionScope === 'asset-content' && value225 && el38,
      el39 = page['querySelector']('.story-asset-tabs'),
      value226 = el39?.['dataset']['activeTab'];
    transitionElement &&
      el39 &&
      (el39['dataset']['activeTab'] =
        current2['querySelector']('.story-asset-tabs')?.['dataset']['activeTab'] || value226);
    const committed = workspacePageTransitionController['start']({
      current: current2,
      next: page,
      parent: viewportElement,
      direction: direction2,
      transitionElement: transitionElement
        ? el38['querySelector']('.story-assets-layout--column-heading > .story-assets-list') || el38
        : page,
      classNames: {
        current: 'is-current',
        scopeCurrent: transitionElement ? 'story-page--asset-content-transition' : '',
        scopeNext: transitionElement ? 'story-page--asset-content-transition' : '',
        scopeTarget: transitionElement ? 'story-page--asset-content-transition-target' : '',
      },
      mount: () => viewportElement['appendChild'](page),
      forceLayout: () => el39?.['getBoundingClientRect'](),
      onBeforeCommit: () => {
        if (transitionElement && el39) el39['dataset']['activeTab'] = value226;
      },
      onTransitionComplete: onTransitionComplete2,
    });
    return {
      page: page,
      committed: committed?.['committed'] || Promise['resolve'](![]),
      committedImmediately: ![],
    };
  }
  function run27() {
    if (state2['view'] === 'home') return 'home';
    const text23 = normalizeText(state2['data']?.['project']?.['id']) || 'draft';
    if (state2['view'] === 'episode')
      return 'project:' + text23 + ':episode:' + (normalizeText(state2['selectedEpisodeId']) || 'selected');
    if (
      state2['step'] === 0x1 &&
      state2['data']?.['project']?.['sourceMode'] !== 'video-replication' &&
      isStoryAssetExtractionOperation(state2['storyPlanningOperation'])
    )
      return 'project:' + text23 + ':asset-breakdown';
    return 'project:' + text23 + ':step:' + normalizeStoryWorkspaceStep(state2['step']);
  }
  function capturePageState2() {
    const el40 = viewportElement['querySelector']('.story-page.is-current');
    if (!el40) return;
    const value227 = { ...(state2['outlineSectionOpenState'] || {}) };
    (el40['querySelectorAll']('details[data-story-outline-section]')['forEach']((el41) => {
      value227[el41['dataset']['storyOutlineSection']] = el41['open'];
    }),
      (state2['outlineSectionOpenState'] = value227));
    const value228 = value132 || run27();
    state2['pageScrollPositions'] = {
      ...(state2['pageScrollPositions'] || {}),
      [value228]: {
        top: Math['max'](0x0, Number(el40['scrollTop']) || 0x0),
        left: Math['max'](0x0, Number(el40['scrollLeft']) || 0x0),
      },
    };
  }
  function syncStoryPlanningLoading() {
    const enabled18 =
      state2['view'] === 'project' &&
      state2['step'] === 0x2 &&
      state2['storyPlanningOperation'] === 'planning-episodes';
    (el6['classList']['toggle']('is-planning', enabled18),
      el6['setAttribute']('aria-busy', String(enabled18)),
      (el7['hidden'] = !enabled18),
      enabled18 && (el8['textContent'] = state2['storyPlanningStatus'] || '正在生成分镜视频'));
  }
  function refreshStoryAssetExtractionFooterInPlace() {
    if (state2['view'] !== 'project' || state2['step'] !== 0x1) return ![];
    if (state2['data']?.['project']?.['sourceMode'] === 'video-replication') return refreshFooter();
    const enabled19 = viewportElement['querySelector']('.story-page.is-current\x20.story-page-footer');
    if (!enabled19) return ![];
    const el42 = documentObject['createElement']('template');
    el42['innerHTML'] = renderStoryAssetExtractionFooter(state2)['trim']();
    const enabled20 = el42['content']['firstElementChild'];
    if (!enabled20) return ![];
    return (enabled19['replaceWith'](enabled20), !![]);
  }
  function render({
    direction: direction = 'none',
    updateToolbar: updateToolbar = !![],
    capturePageState: capturePageState = !![],
    onTransitionComplete: onTransitionComplete = null,
    transitionScope: transitionScope = 'page',
  } = {}) {
    collaboration?.['sync']();
    if (!enabled11) return (workspacePresentationLifecycle['invalidate'](), Promise['resolve'](![]));
    hideHistory();
    const value229 = viewportElement['querySelector']('.story-page.is-current'),
      value230 = value132 || run27(),
      value231 = run27(),
      value232 =
        direction === 'none' && value230 === value231
          ? captureStoryWorkspaceNestedScrollPositions(value229)
          : null;
    if (capturePageState) capturePageState2();
    const box3 = state2['pageScrollPositions']?.[value231] || {};
    if (updateToolbar) renderToolbar();
    const value233 = run26(
        state2['view'] === 'home' ? renderStoryHome(state2) : renderProjectPage(state2),
        direction,
        onTransitionComplete,
        { transitionScope: transitionScope },
      ),
      el43 = value233['page'];
    return (
      el43 &&
        ((el43['scrollTop'] = Math['max'](0x0, Number(box3['top']) || 0x0)),
        (el43['scrollLeft'] = Math['max'](0x0, Number(box3['left']) || 0x0)),
        restoreStoryWorkspaceNestedScrollPositions(el43, value232)),
      value233['committedImmediately']
        ? (value132 = value231)
        : void value233['committed']['then'](
            (value234) => {
              value234 &&
                el43['isConnected'] &&
                el43['classList']['contains']('is-current') &&
                (value132 = value231);
            },
            () => {},
          ),
      syncStoryPlanningLoading(),
      syncPlayerUi(),
      value233['committed']['then']((value235) => {
        if (value235) collaboration?.['sync']();
        return value235;
      })
    );
  }
  function run28() {
    if (state2['view'] !== 'project' || state2['step'] !== 0x2) return null;
    return viewportElement['querySelector']('.story-page.is-current');
  }
  function syncFrameRail({ refreshContent: refreshContent = ![] } = {}) {
    if (state2['view'] !== 'episode') return ![];
    const el44 = viewportElement['querySelector']('.story-page.is-current'),
      el45 = el44?.['querySelector']('[data-story-episode-asset-rail]');
    if (!el44 || !el45) return ![];
    if (refreshContent) {
      const el46 = documentObject['createElement']('div');
      el46['innerHTML'] = renderEpisodeAssetRail(state2);
      const el47 = el46['firstElementChild'];
      ['assets', 'frames', 'library']['forEach']((value236) => {
        const el48 = el45['querySelector']('[data-story-episode-asset-panel="' + value236 + '\x22]'),
          el49 = el47?.['querySelector']('[data-story-episode-asset-panel="' + value236 + '\x22]');
        if (el48 && el49) el48['innerHTML'] = el49['innerHTML'];
        const el50 = el45['querySelector']('[data-story-episode-asset-count="' + value236 + '\x22]'),
          el51 = el47?.['querySelector']('[data-story-episode-asset-count=\x22' + value236 + '\x22]');
        if (el50 && el51) el50['textContent'] = el51['textContent'];
      });
    }
    const storyEpisodeAssetRailTab = normalizeStoryEpisodeAssetRailTab(state2['episodeAssetRailTab']);
    ((el45['dataset']['activeTab'] = storyEpisodeAssetRailTab),
      el45['querySelectorAll']('[data-story-episode-asset-tab]')['forEach']((el52) => {
        const value237 = el52['dataset']['storyEpisodeAssetTab'] === storyEpisodeAssetRailTab;
        (el52['classList']['toggle']('is-active', value237),
          el52['setAttribute']('aria-selected', String(value237)),
          (el52['tabIndex'] = value237 ? 0x0 : -0x1));
      }),
      el45['querySelectorAll']('[data-story-episode-asset-panel]')['forEach']((el53) => {
        const enabled21 = el53['dataset']['storyEpisodeAssetPanel'] === storyEpisodeAssetRailTab;
        (el53['classList']['toggle']('is-active', enabled21),
          el53['setAttribute']('aria-hidden', String(!enabled21)),
          (el53['inert'] = !enabled21));
      }));
    const el54 = el45['querySelector']('[data-story-episode-asset-help]');
    return (el54 && (el54['textContent'] = getStoryEpisodeAssetRailHelp(storyEpisodeAssetRailTab)), !![]);
  }
  function settleFrameCard(value238, { errorMessage: errorMessage = '' } = {}) {
    if (state2['view'] !== 'episode') return ![];
    const text24 = normalizeText(value238),
      el55 = [...viewportElement['querySelectorAll']('[data-story-reference-frame]')]['find'](
        (el56) => el56['dataset']['storyReferenceFrame'] === text24,
      );
    if (!el55) return ![];
    el55['setAttribute']('aria-busy', 'false');
    const el57 = el55['closest']('.story-episode-frame-card')?.['querySelector'](
      '[data-story-action="delete-clip-frame"]',
    );
    if (el57) el57['disabled'] = ![];
    return (syncStoryClipFrameCardSaveError(el55, errorMessage), !![]);
  }
  function run7(value239) {
    if (state2['view'] !== 'project' || state2['step'] !== 0x3) return ![];
    const el58 = viewportElement['querySelector']('.story-page.is-current'),
      enabled22 = state2['data']['episodes']['find']((value240) => value240['id'] === value239),
      enabled23 = [...(el58?.['querySelectorAll']('.story-episode-card[data-story-marquee-id]') || [])][
        'find'
      ]((el59) => el59['dataset']['storyMarqueeId'] === value239);
    if (!el58 || !enabled22 || !enabled23) return ![];
    const el60 = documentObject['createElement']('div');
    el60['innerHTML'] = renderEpisodeCard(state2, enabled22);
    const enabled24 = el60['firstElementChild'];
    if (!enabled24) return ![];
    return (enabled23['replaceWith'](enabled24), !![]);
  }
  function refreshAssetCard(value241) {
    const el61 = run28(),
      storyAsset2 = findStoryAsset(state2, value241),
      el62 = [...(el61?.['querySelectorAll']('[data-story-asset-id]') || [])]['find'](
        (el63) => el63['dataset']['storyAssetId'] === value241,
      );
    if (!el61 || !storyAsset2 || !el62) return ![];
    const el64 = documentObject['createElement']('div');
    el64['innerHTML'] = renderStoryAssetCard(state2, storyAsset2);
    const enabled25 = el64['firstElementChild'];
    if (!enabled25) return ![];
    return ((el62['closest']('.story-asset-card-shell') || el62)['replaceWith'](enabled25), !![]);
  }
  function refreshSelectedAsset() {
    const el65 = run28(),
      visibleStoryAssets = getVisibleStoryAssets(state2),
      alt2 = getSelectedStoryAsset(state2, visibleStoryAssets),
      el66 = el65?.['querySelector']('.story-asset-detail');
    if (!el65 || !alt2 || alt2['isLibraryAsset'] || !el66) return ![];
    el65['querySelectorAll']('[data-story-asset-id]')['forEach']((el67) => {
      el67['classList']['toggle']('is-selected', el67['dataset']['storyAssetId'] === alt2['id']);
    });
    const list22 = getStoryAssetAppearances(alt2),
      selectedAssetAppearanceIndex = getSelectedAssetAppearanceIndex(state2, alt2),
      imageUrl4 = getSelectedAssetAppearance(state2, alt2) || alt2,
      value242 = list22['length'] > 0x1,
      generationControl = getStoryAssetGenerationControlState(state2, alt2['id'], imageUrl4['id']),
      value243 = generationControl['isGenerating'],
      el68 = el66['querySelector']('.story-asset-preview-slide'),
      el69 = el66['querySelector']('.story-asset-preview-wrap');
    el69?.['querySelectorAll']('.story-asset-preview-slide--outgoing')['forEach']((el70) => el70['remove']());
    if (el68 && el69 && state2['assetAppearanceMotion']) {
      const el71 = el68['cloneNode'](!![]);
      (el71['classList']['remove']('img-preview-loading'),
        el71['classList']['add'](
          'story-asset-preview-slide--outgoing',
          'is-sliding-' + state2['assetAppearanceMotion'],
        ),
        el71['removeAttribute']('aria-busy'),
        el71['setAttribute']('aria-hidden', 'true'),
        el71['querySelector']('.img-loading-overlay')?.['remove'](),
        el68['after'](el71));
      const value244 = () => el71['remove']();
      (el71['addEventListener']('animationend', value244, { once: !![] }),
        windowObject['setTimeout'](value244, 0x1cc));
    }
    el66['classList']['remove']('is-sliding-next', 'is-sliding-previous');
    state2['assetAppearanceMotion'] &&
      (void el66['offsetWidth'], el66['classList']['add']('is-sliding-' + state2['assetAppearanceMotion']));
    el68 &&
      (el68['classList']['toggle']('img-preview-loading', value243),
      el68['setAttribute']('aria-busy', String(value243)),
      (el68['innerHTML'] =
        '' +
        renderImageOrEmpty({
          imageUrl: imageUrl4['imageUrl'],
          alt: alt2['name'] + '\x20·\x20' + (imageUrl4['name'] || '形象'),
          className: 'story-asset-preview',
        }) +
        (value243 ? renderStoryAssetLoadingOverlay() : '')));
    if (el69) {
      const el72 = documentObject['createElement']('div');
      el72['innerHTML'] = renderStoryAssetPreviewActions({
        state: state2,
        asset: alt2,
        appearance: imageUrl4,
        generationControl: generationControl,
      });
      const value245 = el69['querySelector']('.story-asset-preview-actions'),
        value246 = el72['firstElementChild'];
      if (value245 && value246) value245['replaceWith'](value246);
      ((el69['dataset']['storyAppearanceWheel'] = String(value242)),
        value242
          ? ((el69['tabIndex'] = 0x0),
            el69['setAttribute']('aria-label', '滚动鼠标滚轮或按左右方向键切换形象'))
          : (el69['removeAttribute']('tabindex'),
            el69['removeAttribute']('aria-label'),
            el69['removeAttribute']('title')),
        el69['querySelectorAll']('.story-appearance-arrow')['forEach']((el73) => {
          el73['remove']();
        }));
    }
    const el74 = el66['querySelector']('.story-asset-preview-caption');
    (syncStoryCharacterVoiceCapsuleState(
      el74?.['querySelector']('[data-story-character-voice-capsule]'),
      alt2,
    ),
      syncStoryCharacterVoicePlayerState(el74, alt2));
    value242 &&
      el69 &&
      el69['insertAdjacentHTML'](
        'beforeend',
        '' + renderStoryAppearanceArrow('previous') + renderStoryAppearanceArrow('next'),
      );
    const el75 = el74?.['querySelector']('strong'),
      el76 = el74?.['querySelector']('[data-story-asset-caption-meta]');
    if (el75) el75['textContent'] = alt2['name'];
    el76 &&
      (el76['textContent'] =
        (imageUrl4['name'] || alt2['role'] || '素材') +
        '\x20·\x20' +
        formatStoryAssetOccurrences(imageUrl4['occurrences'] || alt2['occurrences'] || '当前项目') +
        (value242 ? ' · ' + (selectedAssetAppearanceIndex + 0x1) + '/' + list22['length'] : ''));
    const el77 = el74?.['querySelector']('.story-base-appearance-button');
    if (el77) {
      const isStoryAssetBaseAppearance2 = isStoryAssetBaseAppearance(alt2, imageUrl4),
        value247 = Boolean(isStoryAssetCardLoading(state2, alt2['id']));
      (el77['classList']['toggle']('is-active', isStoryAssetBaseAppearance2),
        el77['classList']['toggle']('is-disabled', value247),
        el77['setAttribute']('aria-pressed', String(isStoryAssetBaseAppearance2)),
        el77['setAttribute']('aria-disabled', String(value247)),
        (el77['textContent'] = isStoryAssetBaseAppearance2 ? '基础形象' : '设为基础形象'));
    }
    const el78 = el66['querySelector']('.story-asset-prompt-field'),
      el79 = el78?.['querySelector']('[data-story-asset-prompt]'),
      isStoryAssetBaseAppearance3 = isStoryAssetBaseAppearance(alt2, imageUrl4),
      el80 = el74?.['querySelector']('.story-asset-caption-tags'),
      el81 = el80?.['querySelector'](':scope > .story-asset-style-reference-control');
    if (state2['allowAssetStyleReference'] !== ![] && isStoryAssetBaseAppearance3 && el80) {
      const el82 = documentObject['createElement']('div');
      el82['innerHTML'] = renderStoryAssetReferenceInput(imageUrl4, {
        disabled: generationControl['disabled'],
      });
      const value248 = el82['firstElementChild'];
      if (value248 && el81) el81['replaceWith'](value248);
      else
        value248 &&
          el80['insertBefore'](value248, el80['querySelector']('[data-story-character-voice-capsule]'));
    } else el81?.['remove']();
    el79 &&
      ((el79['dataset']['storyAssetPromptAssetId'] = alt2['id']),
      (el79['dataset']['storyAssetPromptAppearanceId'] = imageUrl4['id']),
      (el79['innerHTML'] = renderStoryAssetPromptMentions(imageUrl4['prompt'] || '', imageUrl4)));
    const el83 = el66['querySelector']('[data-story-home-param-trigger="asset-preset"]');
    if (el83) el83['disabled'] = generationControl['disabled'];
    const el84 = el66['querySelector']('[data-story-action="generate-asset"]');
    if (el84) {
      ((el84['disabled'] = generationControl['disabled']),
        syncStoryAsyncButton(el84, generationControl['isGenerating']));
      const el85 = el84['querySelector']('[data-story-asset-generate-label]');
      if (el85) el85['textContent'] = generationControl['label'];
    }
    return !![];
  }
  function refreshSelectedClip(value249) {
    if (state2['view'] !== 'episode') return ![];
    const el86 = viewportElement['querySelector']('.story-page.is-current'),
      enabled26 = el86?.['querySelector']('.story-clip-editor'),
      el87 = el86?.['querySelector']('.story-video-preview'),
      el88 = el86?.['querySelector']('.story-clip-timeline');
    if (!el86 || !enabled26 || !el87 || !el88) return ![];
    const el89 = documentObject['createElement']('div');
    el89['innerHTML'] = renderEpisodeDetail(state2);
    const el90 = el89['firstElementChild'],
      enabled27 = el90?.['querySelector']('.story-clip-editor'),
      el91 = el90?.['querySelector']('.story-video-preview'),
      enabled28 = el91?.['querySelector']('[data-story-clip-preview-slide]');
    if (!enabled27 || !el91 || !enabled28) return ![];
    const value250 = value249 === 'previous' ? 'previous' : 'next',
      el92 = el87['querySelector'](
        '[data-story-clip-preview-slide]:not(.story-clip-preview-slide--outgoing)',
      );
    (map4['get'](el86)?.['destroy']?.(),
      map4['delete'](el86),
      enabled26['replaceWith'](enabled27),
      el91['classList']['add']('is-sliding-' + value250));
    el92 &&
      (el92['classList']['add']('story-clip-preview-slide--outgoing', 'is-sliding-' + value250),
      el92['setAttribute']('aria-hidden', 'true'),
      el91['appendChild'](el92));
    (el87['replaceWith'](el91),
      el88['querySelectorAll']('[data-story-clip-id]')['forEach']((el93) => {
        const value251 = el93['dataset']['storyClipId'] === state2['selectedClipId'];
        (el93['classList']['toggle']('is-selected', value251),
          el93['setAttribute']('aria-current', value251 ? 'true' : 'false'));
      }),
      run23(el86));
    const value252 = () => {
      (el92?.['querySelector']('video')?.['pause']?.(),
        el92?.['remove'](),
        el91['classList']['remove']('is-sliding-next', 'is-sliding-previous'));
    };
    return (
      el92?.['addEventListener']('animationend', value252, { once: !![] }),
      windowObject['setTimeout'](value252, 0x1cc),
      windowObject['requestAnimationFrame'](() => {
        el88['querySelector']('[data-story-clip-id].is-selected')?.['scrollIntoView']?.({
          block: 'nearest',
          inline: 'nearest',
        });
      }),
      !![]
    );
  }
  function refreshSelectedVideoResult(value253) {
    if (state2['view'] !== 'episode') return ![];
    const el94 = viewportElement['querySelector']('.story-page.is-current'),
      el95 = el94?.['querySelector']('.story-video-preview'),
      el96 = el95?.['querySelector'](
        '[data-story-clip-preview-slide]:not(.story-clip-preview-slide--outgoing)',
      );
    if (!el94 || !el95 || !el96) return ![];
    const el97 = documentObject['createElement']('div');
    el97['innerHTML'] = renderEpisodeDetail(state2);
    const el98 = el97['firstElementChild'],
      el99 = el98?.['querySelector']('.story-video-preview'),
      enabled29 = el99?.['querySelector']('[data-story-clip-preview-slide]');
    if (!el99 || !enabled29) return ![];
    const value254 = value253 === 'previous' ? 'previous' : 'next';
    (map4['get'](el94)?.['destroy']?.(),
      map4['delete'](el94),
      el99['classList']['add']('is-result-sliding-' + value254),
      el96['classList']['add']('story-clip-preview-slide--outgoing', 'is-result-sliding-' + value254),
      el96['setAttribute']('aria-hidden', 'true'),
      el99['appendChild'](el96),
      el95['replaceWith'](el99));
    const value255 = [...el94['querySelectorAll']('.story-clip-card-shell[data-story-clip-id]')]['find'](
        (el100) => el100['dataset']['storyClipId'] === state2['selectedClipId'],
      ),
      value256 = [...(el98?.['querySelectorAll']('.story-clip-card-shell[data-story-clip-id]') || [])][
        'find'
      ]((el101) => el101['dataset']['storyClipId'] === state2['selectedClipId']);
    if (value255 && value256) value255['replaceWith'](value256);
    run23(el94);
    const value257 = () => {
      (el96['querySelector']('video')?.['pause']?.(),
        el96['remove'](),
        el99['classList']['remove']('is-result-sliding-next', 'is-result-sliding-previous'));
    };
    return (
      el96['addEventListener']('animationend', value257, { once: !![] }),
      windowObject['setTimeout'](value257, 0x1cc),
      !![]
    );
  }
  function refreshTimeline() {
    if (state2['view'] !== 'episode') return ![];
    const el102 = viewportElement['querySelector']('.story-page.is-current'),
      el103 = el102?.['querySelector']('.story-clip-timeline');
    if (!el102 || !el103) return ![];
    const value258 = el103['querySelector']('.story-clip-strip'),
      el104 = documentObject['createElement']('div');
    el104['innerHTML'] = renderEpisodeDetail(state2);
    const el105 = el104['firstElementChild']?.['querySelector']('.story-clip-timeline');
    if (!el105) return ![];
    const value259 = Math['max'](0x0, Number(value258?.['scrollLeft']) || 0x0);
    el103['replaceWith'](el105);
    const value260 = el105['querySelector']('.story-clip-strip');
    if (value260) value260['scrollLeft'] = value259;
    return !![];
  }
  function refreshReferenceSummary() {
    if (state2['view'] !== 'episode') return ![];
    const el106 = viewportElement['querySelector'](
        '.story-page.is-current [data-story-clip-reference-summary]',
      ),
      selectedEpisode6 = getSelectedEpisode(state2),
      selectedClip4 = getSelectedClip(state2, selectedEpisode6);
    if (!el106 || !selectedEpisode6 || !selectedClip4) return ![];
    const value261 = storyClipProduction['renderEpisode'](state2, selectedEpisode6, selectedClip4),
      value262 = value261['referenceCounts'];
    (['image', 'audio', 'video']['forEach']((value263) => {
      const el107 = el106['querySelector']('[data-story-reference-count=\x22' + value263 + '\x22]');
      if (el107) el107['textContent'] = String(value262[value263 + 'Count']);
    }),
      el106['setAttribute'](
        'aria-label',
        '参考素材，图片 ' +
          value262['imageCount'] +
          '，音频 ' +
          value262['audioCount'] +
          '，视频 ' +
          value262['videoCount'],
      ));
    const el108 = viewportElement['querySelector'](
      '.story-page.is-current [data-story-clip-prompt-surface] .story-clip-prompt-toolbar > .node-ref-bar',
    );
    if (el108) {
      const el109 = documentObject['createElement']('div');
      el109['innerHTML'] = value261['referenceBar'];
      const el110 = el109['firstElementChild'],
        el111 = el108['querySelector']('.ref-thumb-container--readonly'),
        value264 = el110?.['querySelector']('.ref-thumb-container--readonly'),
        handler8 = (el112) =>
          Array['from'](el112?.['querySelectorAll']?.('[data-ref-readonly-key]') || [])
            ['map']((el113) => el113['dataset']['refReadonlyKey'] || '')
            ['join']('|');
      if (handler8(el111) !== handler8(value264)) {
        if (el111 && value264) el111['replaceWith'](value264);
        else {
          if (el111) el111['remove']();
          else {
            if (value264) el108['appendChild'](value264);
          }
        }
        if (el110) el108['className'] = el110['className'];
      }
    }
    return !![];
  }
  function refreshPromptRestore() {
    if (state2['view'] !== 'episode') return ![];
    const el114 = viewportElement['querySelector']('.story-page.is-current'),
      el115 = el114?.['querySelector']('[data-story-clip-prompt]'),
      enabled30 = el114?.['querySelector']('.story-clip-adjustment-control'),
      episode4 = getSelectedEpisode(state2),
      selectedClip5 = getSelectedClip(state2, episode4);
    if (!el114 || !el115 || !enabled30 || !episode4 || !selectedClip5) return ![];
    el115['innerHTML'] = renderStoryClipPromptMentions(selectedClip5['prompt'] || '', {
      assets: state2['data']['assets'],
      episode: episode4,
      clipFrames: state2['data']['clipFrames'],
    });
    if (state2['data']['project']['sourceMode'] === 'video-replication') mountStorySpeechGapEditor(el115);
    (syncStoryClipPromptPillPresentation(el115, state2['data']['assets'], state2['data']['clipFrames']),
      el115['querySelectorAll']('.ref-pill')['forEach']((value265) => {
        run14(value265, el115, selectedClip5);
      }));
    const el116 = documentObject['createElement']('div');
    el116['innerHTML'] = storyClipProduction['renderEpisode'](state2, episode4, selectedClip5)[
      'adjustmentControl'
    ];
    const enabled31 = el116['firstElementChild'];
    if (!enabled31) return ![];
    return (enabled30['replaceWith'](enabled31), !![]);
  }
  function run29() {
    if (state2['view'] !== 'episode') return ![];
    const el117 = viewportElement['querySelector']('.story-page.is-current'),
      el118 = el117?.['querySelector']('.story-clip-adjustment-control'),
      el119 = el118?.['querySelector']('[data-story-action=\x22toggle-clip-adjustment\x22]'),
      selectedEpisode7 = getSelectedEpisode(state2),
      selectedClip6 = getSelectedClip(state2, selectedEpisode7);
    if (!el117 || !el118 || !el119 || !selectedEpisode7 || !selectedClip6) return ![];
    const el120 = el118['querySelector']('[data-story-clip-adjustment-bar]'),
      enabled32 = storyClipProduction['renderEpisode'](state2, selectedEpisode7, selectedClip6)[
        'adjustmentBar'
      ];
    el119['setAttribute']('aria-expanded', String(state2['clipAdjustmentOpen'] === !![]));
    if (!enabled32) return (el120?.['remove'](), !![]);
    const el121 = documentObject['createElement']('div');
    el121['innerHTML'] = enabled32;
    const enabled33 = el121['firstElementChild'];
    if (!enabled33) return ![];
    if (el120) el120['replaceWith'](enabled33);
    else el118['appendChild'](enabled33);
    return !![];
  }
  function run30({ focus: focus = '' } = {}) {
    const el122 = viewportElement['querySelector']('.story-page.is-current [data-story-clip-prompt-history]'),
      el123 = el122?.['querySelector']('[data-story-action="toggle-clip-prompt-history"]'),
      el124 = el122?.['querySelector']('[data-story-clip-prompt-history-panel]');
    if (!el122 || !el123 || !el124) return ![];
    const enabled34 = state2['clipPromptHistoryOpen'] === !![];
    (el123['setAttribute']('aria-expanded', String(enabled34)), (el124['hidden'] = !enabled34));
    if (focus === 'trigger') el123['focus']();
    return (
      focus === 'first' &&
        el124['querySelector']('[data-story-action="restore-clip-prompt-history"]')?.['focus'](),
      !![]
    );
  }
  function run31(args26 = {}) {
    const episode5 = getSelectedEpisode(state2);
    return syncStoryClipAdjustmentMenu({
      state: state2,
      root: viewportElement,
      episode: episode5,
      clip: getSelectedClip(state2, episode5),
      ...args26,
    });
  }
  function refreshGeneration() {
    if (state2['view'] !== 'episode') return ![];
    const el125 = viewportElement['querySelector']('.story-page.is-current'),
      enabled35 = el125?.['querySelector']('.story-clip-selection-controls'),
      el126 = el125?.['querySelector']('[data-story-clip-preview-slide]'),
      el127 = el125?.['querySelector']('.story-clip-timeline');
    if (!el125 || !enabled35 || !el126 || !el127) return ![];
    const el128 = documentObject['createElement']('div');
    el128['innerHTML'] = renderEpisodeDetail(state2);
    const el129 = el128['firstElementChild'],
      enabled36 = el129?.['querySelector']('.story-clip-selection-controls'),
      el130 = el129?.['querySelector']('[data-story-clip-preview-slide]'),
      el131 = el129?.['querySelector']('.story-clip-timeline'),
      list23 = Array['from'](el127['querySelectorAll']('.story-clip-card-shell[data-story-clip-id]')),
      list24 = Array['from'](
        el131?.['querySelectorAll']?.('.story-clip-card-shell[data-story-clip-id]') || [],
      );
    if (!enabled36 || !el130 || !el131 || list23['length'] !== list24['length']) return ![];
    const map8 = new Map(list23['map']((el132) => [normalizeText(el132['dataset']['storyClipId']), el132]));
    if (list24['some']((el133) => !map8['has'](normalizeText(el133['dataset']['storyClipId'])))) return ![];
    return (
      enabled35['outerHTML'] !== enabled36['outerHTML'] && enabled35['replaceWith'](enabled36),
      el126['innerHTML'] !== el130['innerHTML'] &&
        ((el126['innerHTML'] = el130['innerHTML']), map4['get'](el125)?.['refreshVideoPreview']?.()),
      list24['forEach']((el134) => {
        const value266 = map8['get'](normalizeText(el134['dataset']['storyClipId']));
        value266?.['outerHTML'] !== el134['outerHTML'] && value266['replaceWith'](el134);
      }),
      !![]
    );
  }
  function run32() {
    if (state2['view'] !== 'episode') return ![];
    const el135 = viewportElement['querySelector']('.story-page.is-current'),
      el136 = el135?.['querySelector']('.story-clip-timeline');
    if (!el135 || !el136) return ![];
    const value267 = el135['querySelector']('.story-clip-selection-controls'),
      el137 = documentObject['createElement']('div');
    el137['innerHTML'] = storyClipProduction['renderEpisode'](state2, getSelectedEpisode(state2))[
      'selectionControls'
    ];
    const value268 = el137['firstElementChild'];
    if (value267 && value268) value267['replaceWith'](value268);
    const map9 = new Set(
      (Array['isArray'](state2['selectedClipGenerationIds']) ? state2['selectedClipGenerationIds'] : [])
        ['map']((value269) => normalizeText(value269))
        ['filter'](Boolean),
    );
    el136['classList']['toggle']('is-selection-mode', state2['clipSelectionMode']);
    const el138 = el136['querySelector']('.story-clip-timeline-header\x20small');
    return (
      el138 &&
        (el138['textContent'] = state2['clipSelectionMode']
          ? '点击片段选择需要生成的视频'
          : '点击片段切换提示词和视频结果'),
      el136['querySelectorAll']('[data-story-clip-id]')['forEach']((el139) => {
        const value270 = map9['has'](normalizeText(el139['dataset']['storyClipId']));
        (el139['classList']['toggle']('is-selection-mode', state2['clipSelectionMode']),
          el139['classList']['toggle']('is-checked', state2['clipSelectionMode'] && value270));
        if (!state2['clipSelectionMode']) el139['classList']['remove']('is-marquee-hit');
        el139['setAttribute']('aria-pressed', state2['clipSelectionMode'] ? String(value270) : 'false');
        const el140 = el139['closest']('.story-clip-card-shell'),
          enabled37 =
            !state2['clipSelectionMode'] &&
            normalizeText(state2['pendingDeleteClipId']) === normalizeText(el139['dataset']['storyClipId']);
        el140?.['classList']['toggle']('is-delete-confirming', enabled37);
        const el141 = el140?.['querySelector']('.story-clip-delete-trigger'),
          el142 = el140?.['querySelector']('.story-clip-delete-confirm');
        if (el141) el141['hidden'] = state2['clipSelectionMode'] || enabled37;
        if (el142) el142['hidden'] = state2['clipSelectionMode'] || !enabled37;
      }),
      !![]
    );
  }
  function refreshBatchLabel() {
    const list25 = run28()?.['querySelectorAll']('[data-story-asset-batch-control]') || [],
      value271 = storyAssetSettingsProjection['projectAssetControl']('batch-generation', {
        state: state2,
      });
    let updateStoryAssetBatchButtonLabel2 = ![];
    return (
      list25['forEach']((value272) => {
        updateStoryAssetBatchButtonLabel2 =
          updateStoryAssetBatchButtonLabel(value272, value271['label']) || updateStoryAssetBatchButtonLabel2;
      }),
      updateStoryAssetBatchButtonLabel2
    );
  }
  function activate({ previousMode: previousMode = '', surface: surface = 'story' } = {}) {
    if (enabled10) return null;
    if (state2['workspaceSurface'] !== surface) syncCurrentProjectEntry();
    const storyWorkspaceSurface = selectStoryWorkspaceSurface(state2, surface);
    if (storyWorkspaceSurface) workspacePresentationLifecycle['invalidate']();
    enabled11 = !![];
    if (workspacePresentationLifecycle['activate']()) render({ capturePageState: previousMode === 'story' });
    return (collaboration?.['sync'](), storyRoot);
  }
  function deactivate({ nextMode: nextMode = '' } = {}) {
    if (['story', 'replication']['includes'](nextMode)) return !![];
    if (enabled10) return ![];
    return (
      closeStoryRequestDebugPreview(documentObject),
      enabled11 && (capturePageState2(), schedulePersistence({ immediate: !![] })),
      (enabled11 = ![]),
      collaboration?.['sync'](),
      hideHoverPreview(),
      hideHistory(),
      stopPreview(),
      run33(),
      run34(),
      run35(),
      run6(),
      run36(),
      workspacePresentationLifecycle['deactivate'](),
      !![]
    );
  }
  function run33(value273 = null) {
    storyRoot['querySelectorAll']('.story-model-picker.is-open')['forEach']((el143) => {
      if (el143 === value273) return;
      (el143['classList']['remove']('is-open'),
        el143['querySelector']('[data-story-model-trigger]')?.['setAttribute']('aria-expanded', 'false'));
    });
  }
  function run34(value274 = null) {
    storyRoot['querySelectorAll']('.story-home-param-picker.is-open')['forEach']((el144) => {
      if (el144 === value274) return;
      (el144['classList']['remove']('is-open'),
        el144['querySelector']('[data-story-home-param-trigger]')?.['setAttribute'](
          'aria-expanded',
          'false',
        ));
    });
  }
  // Keeps a param popover inside the viewport: shrink to the space below, or
  // flip above when the trigger sits too low for the popover to fit.
  function fitStoryParamPopoverToViewport(el145) {
    const el146 = el145?.['querySelector']?.('.story-home-param-popover');
    if (!el146) return;
    (el146['classList']?.['remove']?.('story-home-param-popover--above'), (el146['style']['maxHeight'] = ''));
    if (globalThis['getComputedStyle']?.(el146)?.['position'] === 'fixed') return;
    const enabled38 = Number(globalThis['innerHeight'] || 0);
    if (!enabled38) return;
    const el147 = el145?.['querySelector']?.('[data-story-home-param-trigger]'),
      box4 = el147?.['getBoundingClientRect']?.();
    if (!box4) return;
    const value275 = 16,
      value276 = enabled38 - box4['bottom'] - value275,
      value277 = box4['top'] - value275,
      value278 = 420;
    if (value276 < value278 && value277 > value276) {
      (el146['classList']?.['add']?.('story-home-param-popover--above'),
        (el146['style']['maxHeight'] = Math['max'](160, Math['floor'](value277)) + 'px'));
      return;
    }
    el146['style']['maxHeight'] = Math['max'](160, Math['floor'](value276)) + 'px';
  }
  function run37(value279 = '') {
    const text25 = normalizeText(value279);
    ((state2['openProjectMenuId'] = text25),
      storyRoot['querySelectorAll']('[data-story-open-project]')['forEach']((el148) => {
        const text26 = normalizeText(el148['dataset']['storyOpenProject']) === text25;
        el148['classList']['toggle']('is-menu-open', text26);
        const el149 = el148['querySelector']('[data-story-action="toggle-project-menu"]'),
          el150 = el148['querySelector']('[data-story-project-menu]');
        (el149?.['setAttribute']('aria-expanded', String(text26)),
          el150 && ((el150['hidden'] = !text26), el150['setAttribute']('aria-hidden', String(!text26))));
      }));
  }
  function run38() {
    storyRoot['querySelectorAll']('[data-story-project-sort-wrap].is-open')['forEach']((el151) => {
      (el151['classList']['remove']('is-open'),
        el151['querySelector']('[data-story-action="toggle-project-sort-menu"]')?.['setAttribute'](
          'aria-expanded',
          'false',
        ),
        el151['querySelector']('[data-story-project-sort-menu]')?.['setAttribute']('aria-hidden', 'true'));
    });
  }
  function run39(el152, el153) {
    const el154 = el152?.['querySelector']('[data-story-project-sort-menu]');
    if (!el152 || !el153 || !el154) return;
    (run38(),
      el152['classList']['add']('is-open'),
      el153['setAttribute']('aria-expanded', 'true'),
      el154['setAttribute']('aria-hidden', 'false'));
  }
  function run35(value280 = null) {
    storyRoot['querySelectorAll']('.story-asset-batch-menu-wrap.is-open')['forEach']((el155) => {
      if (el155 === value280) return;
      (handler3(el155),
        el155['classList']['remove']('is-open'),
        el155['querySelector']('.story-asset-batch-trigger')?.['setAttribute']('aria-expanded', 'false'));
    });
  }
  function run40(el156, el157) {
    const enabled39 = el156?.['querySelector']('.story-asset-batch-menu');
    if (!el156 || !el157 || !enabled39) return;
    (run35(el156),
      handler3(el156),
      syncWorkspaceInlineMenuExpandedWidth(enabled39),
      el156['classList']['add']('is-open'),
      el157['setAttribute']('aria-expanded', 'true'));
  }
  const workspaceMenuController = createWorkspaceMenuController({
    root: storyRoot,
    wrapperSelector: '.story-canvas-sync-menu-wrap',
    triggerSelector: '[data-story-action="toggle-canvas-sync-menu"]',
    menuSelector: '.story-canvas-sync-menu',
    optionSelector: '.story-canvas-sync-option',
  });
  function run6(value281 = null) {
    workspaceMenuController['close'](value281);
  }
  function run41(value282, value283) {
    return workspaceMenuController['open'](value282, value283);
  }
  function run42(value284) {
    return workspaceMenuController['handleKeyDown'](value284);
  }
  function run36(value285 = null) {
    storyRoot['querySelectorAll']('.story-character-voice-history-wrap.is-open')['forEach']((el158) => {
      if (el158 === value285) return;
      (el158['classList']['remove']('is-open'),
        el158['querySelector']('[data-story-action="toggle-character-voice-history"]')?.['setAttribute'](
          'aria-expanded',
          'false',
        ),
        el158['querySelector']('.story-character-voice-history-panel')?.['setAttribute'](
          'aria-hidden',
          'true',
        ));
    });
  }
  function run43(el159, enabled40) {
    const el160 = el159?.['querySelector']('[data-story-style-library]'),
      el161 = el159?.['querySelector']('[data-story-style-custom-editor]');
    if (!el160 || !el161) return;
    ((el160['hidden'] = enabled40),
      (el161['hidden'] = !enabled40),
      el159['classList']['toggle']('is-custom-editing', enabled40),
      enabled40 &&
        windowObject['requestAnimationFrame'](() => {
          const el162 = el161['querySelector']('[data-story-style-custom-input]');
          (el162?.['focus'](),
            el162?.['setSelectionRange']?.(el162['value']['length'], el162['value']['length']));
        }));
  }
  function run44(el163) {
    const value286 =
        el163?.['querySelector']('[data-story-style-category].is-active')?.['dataset'][
          'storyStyleCategory'
        ] || 'all',
      text27 = normalizeText(el163?.['querySelector']('[data-story-style-search-input]')?.['value'])[
        'toLowerCase'
      ]();
    let count4 = 0x0;
    el163?.['querySelectorAll']('[data-story-style-card-category]')['forEach']((el164) => {
      const value287 = el164['dataset']['storyStyleCardCategory'],
        value288 = value286 === 'all' || value287 === value286,
        value289 = !text27 || String(el164['dataset']['storyStyleSearch'] || '')['includes'](text27);
      el164['hidden'] = !(value288 && value289);
      if (!el164['hidden']) count4 += 0x1;
    });
    const el165 = el163?.['querySelector']('[data-story-style-empty]');
    if (el165) el165['hidden'] = count4 > 0x0;
  }
  function run45(value290) {
    const storyAspectRatio = normalizeStoryAspectRatio(value290);
    ((state2['data']['project']['aspectRatio'] = storyAspectRatio),
      (state2['videoGenerationParams'] = applyStoryAspectRatioToVideoGenerationParams(
        state2['models']['video'],
        state2['videoGenerationParams'],
        storyAspectRatio,
      )),
      (state2['videoGenerationParamsByModel'] = {
        ...state2['videoGenerationParamsByModel'],
        [state2['models']['video']]: { ...state2['videoGenerationParams'] },
      }),
      schedulePersistence(),
      render());
  }
  function run46(field, value291, { renderWorkspace: renderWorkspace = !![] } = {}) {
    if (field === 'replicationAsrProvider') {
      if (!RECORDING_ASR_MODELS['some']((value292) => value292['id'] === value291)) return;
      ((state2['replicationAsrProvider'] = value291), schedulePersistence(), render());
      return;
    }
    const args27 = normalizeStoryProjectPlanning(state2['data']['project'], {
      allowDeveloperPromptModes: state2['developerModeAvailable'],
    });
    if (field === 'targetLocale') {
      state2['replicationTargetLocale'] = getStoryReplicationLocale(value291)['value'];
      if (
        state2['hasCreatedProject'] &&
        updateStoryReplicationReplacement(state2['data'], {
          field: field,
          value: state2['replicationTargetLocale'],
        })
      )
        syncCurrentProjectEntry();
      (schedulePersistence(), render());
      return;
    }
    const value293 =
      field === 'episodeCount'
        ? normalizeStoryEpisodeCount(value291)
        : field === 'promptMode'
          ? normalizeStoryPromptMode(value291, { allowDeveloperModes: state2['developerModeAvailable'] })
          : normalizeStorySceneMaxSeconds(value291);
    state2['data']['project']['planning'] = { ...args27, [field]: value293 };
    field === 'promptMode' &&
      applyStoryPromptModeVideoModelDefault(state2, value293) &&
      reconcileSelectedInputsForModel();
    schedulePersistence();
    if (renderWorkspace) render();
    return value293;
  }
  function run47(el166) {
    const count5 = Number(el166?.['value']);
    if (!Number['isInteger'](count5) || count5 < 0x1 || count5 > STORY_EPISODE_COUNT_MAX)
      return (
        el166?.['setAttribute']('aria-invalid', 'true'),
        showToast('请输入 1-' + STORY_EPISODE_COUNT_MAX + ' 的整数集数。', 'warn'),
        el166?.['focus'](),
        ![]
      );
    el166?.['setAttribute']('aria-invalid', 'false');
    const value294 = run46('episodeCount', count5, { renderWorkspace: ![] });
    return (run48(el166, value294), !![]);
  }
  function run48(el167, value295) {
    const el168 = el167?.['closest']('.story-episode-count-custom-editor'),
      el169 = el168?.['closest']('.story-planning-picker');
    if (!el168 || !el169) return ![];
    const value296 = !STORY_EPISODE_COUNT_OPTIONS['includes'](value295);
    (el168['classList']['toggle']('is-selected', value296),
      el168['setAttribute']('aria-selected', String(value296)),
      (el167['value'] = value296 ? String(value295) : ''),
      el169['querySelectorAll']('[data-story-planning-field="episodeCount"]')['forEach']((el170) => {
        const value297 = Number(el170['dataset']['storyPlanningOption']) === value295;
        (el170['classList']['toggle']('is-selected', value297),
          el170['setAttribute']('aria-selected', String(value297)));
      }));
    const el171 = el169['querySelector']('[data-story-planning-trigger-label]');
    if (el171) el171['textContent'] = value295 + '集';
    return !![];
  }
  function run49(el172) {
    windowObject['setTimeout'](() => {
      if (!el172?.['isConnected']) return;
      normalizeText(el172['value'])
        ? run47(el172)
        : run48(el172, normalizeStoryEpisodeCount(state2['data']['project']?.['planning']?.['episodeCount']));
    }, 0x0);
  }
  function run50(styleId3) {
    const visualStyle = resolveStoryStyleSelection({ styleId: styleId3 });
    if (visualStyle['isCustom']) return;
    const previousStyle = resolveStoryStyleSelection({
      styleId: state2['data']['project']['videoStyleId'],
      stylePrompt: state2['data']['project']['videoStylePrompt'],
      videoStyle: state2['data']['project']['videoStyle'],
    })['stylePrompt'];
    ((state2['data']['project']['videoStyleId'] = visualStyle['styleId']),
      (state2['data']['project']['videoStylePrompt'] = visualStyle['stylePrompt']),
      (state2['data']['project']['videoStyle'] = visualStyle['label']),
      projectData['replaceCurrent'](
        syncStoryPlanningVisualStyle(state2['data'], {
          previousStyle: previousStyle,
          visualStyle: visualStyle['stylePrompt'],
        }),
      ),
      schedulePersistence(),
      render());
  }
  function run51(el173) {
    const visualStyle2 = normalizeText(el173?.['value'])['slice'](0x0, STORY_CUSTOM_STYLE_MAX_CHARACTERS);
    if (!visualStyle2) {
      (showToast('请输入自定义风格提示词。', 'warn'), el173?.['focus']());
      return;
    }
    const previousStyle2 = resolveStoryStyleSelection({
      styleId: state2['data']['project']['videoStyleId'],
      stylePrompt: state2['data']['project']['videoStylePrompt'],
      videoStyle: state2['data']['project']['videoStyle'],
    })['stylePrompt'];
    ((state2['data']['project']['videoStyleId'] = STORY_STYLE_CUSTOM_ID),
      (state2['data']['project']['videoStylePrompt'] = visualStyle2),
      (state2['data']['project']['customVideoStylePrompt'] = visualStyle2),
      (state2['data']['project']['videoStyle'] = visualStyle2),
      projectData['replaceCurrent'](
        syncStoryPlanningVisualStyle(state2['data'], {
          previousStyle: previousStyle2,
          visualStyle: visualStyle2,
        }),
      ),
      schedulePersistence(),
      render());
  }
  const openProject3 = (value298) =>
    openStoryProjectPage(
      { state: state2, canEnterStep: canEnterStoryWorkspaceStep, render: render },
      value298,
    );
  function openProject2(value299) {
    const text28 = normalizeText(value299),
      text29 = normalizeText(state2['data']?.['project']?.['id']),
      enabled41 = projectData['getEntry'](text28);
    state2['pendingDeleteAssetAppearanceKey'] = '';
    if (text28 && text28 === text29 && state2['hasCreatedProject']) {
      (applyStoryProjectUiState(state2, enabled41?.['ui'], state2['data']), restoreTaskState(state2['data']));
      const episode6 = getSelectedEpisode(state2);
      (prepareVideoSettings(getSelectedClip(state2, episode6), {
        episode: episode6,
        enteringEpisode: state2['view'] === 'episode',
      }),
        openProject3({ restoreView: !![] }),
        restoreStoryAssetBreakdownProgress(),
        schedulePersistence({ immediate: !![] }),
        resumeTasks(),
        resumePersistedTasks());
      return;
    }
    if (!enabled41?.['data']) return;
    const enabled42 = projectData['activate'](text28, {
      beforeActivate: () => {
        (stopStoryAssetBreakdownProgress({ clearState: !![] }), resetTaskState());
      },
    });
    if (!enabled42) return;
    ((state2['scriptMode'] = normalizeStoryScriptMode(state2['data']['project']?.['scriptMode'])),
      (state2['data']['project']['planning'] = normalizeStoryProjectPlanning(state2['data']['project'], {
        allowDeveloperPromptModes: state2['developerModeAvailable'],
      })));
    const response6 = state2['data']['project']?.['sourceDocument'];
    response6 &&
      typeof response6 === 'object' &&
      ((state2['scriptFileName'] = String(response6['fileName'] || '')),
      (state2['scriptText'] = String(response6['text'] || '')['slice'](0x0, STORY_SCRIPT_MAX_CHARACTERS)),
      (state2['scriptCharacterCount'] = Number['isFinite'](response6['characterCount'])
        ? response6['characterCount']
        : state2['scriptText']['length']));
    ((state2['assetSelectionMode'] = ![]),
      (state2['selectedAssetIds'] = []),
      (state2['scriptSelectionMode'] = ![]),
      (state2['selectedScriptEpisodeIds'] = []),
      (state2['characterVoiceEditor'] = null),
      (state2['characterVoicePanelMotion'] = ''),
      (state2['pendingCharacterVoiceAssetId'] = ''),
      (state2['pendingDeleteClipId'] = ''),
      (state2['pendingDeleteAssetAppearanceKey'] = ''),
      (state2['clipSelectionMode'] = ![]),
      (state2['selectedClipGenerationIds'] = []),
      applyStoryProjectUiState(state2, enabled42['ui'], state2['data']),
      restoreTaskState(state2['data']),
      (state2['projectTitleEdited'] = enabled42['projectTitleEdited'] === !![]),
      (state2['hasCreatedProject'] = !![]));
    const episode7 = getSelectedEpisode(state2);
    (prepareVideoSettings(getSelectedClip(state2, episode7), {
      episode: episode7,
      enteringEpisode: state2['view'] === 'episode',
    }),
      openProject3({ restoreView: !![] }),
      restoreStoryAssetBreakdownProgress(),
      schedulePersistence({ immediate: !![] }),
      resumeTasks(),
      resumePersistedTasks());
  }
  function run52(value300) {
    const el174 = viewportElement['querySelector']('.story-page.is-current');
    if (!el174) return ![];
    if (value300['outlineSectionId'])
      return jumpToStoryOutlineSection(el174, value300['outlineSectionId'], {
        windowObject: windowObject,
      });
    const enabled43 = value300['assetId'] ? 'storyAssetId' : value300['clipId'] ? 'storyClipId' : '',
      enabled44 = value300['assetId'] || value300['clipId'];
    if (!enabled43 || !enabled44) return ![];
    const value301 = value300['assetId'] ? '[data-story-asset-id]' : '[data-story-clip-id]',
      enabled45 = [...el174['querySelectorAll'](value301)]['find'](
        (el175) => normalizeText(el175?.['dataset']?.[enabled43]) === enabled44,
      );
    if (!enabled45) return ![];
    const run53 = () =>
      enabled45['scrollIntoView']?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    return (
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? windowObject['requestAnimationFrame'](run53)
        : run53(),
      !![]
    );
  }
  async function run(options17 = {}) {
    const text30 = normalizeText(options17['projectId']);
    if (!text30) return ![];
    if (normalizeText(state2['data']?.['project']?.['id']) !== text30) {
      const enabled46 = state2['projects']['some'](
        (value302) => normalizeText(value302?.['id'] || value302?.['data']?.['project']?.['id']) === text30,
      );
      if (!enabled46) return (showToast('对应的剧本项目已不存在。', 'warn'), ![]);
      openProject2(text30);
    }
    if (normalizeText(state2['data']?.['project']?.['id']) !== text30)
      return (showToast('无法打开任务对应的剧本项目。', 'warn'), ![]);
    requestWorkspaceMode(getStoryProjectWorkspaceMode(state2['data']?.['project']));
    const assetId4 = resolveStoryTaskResultDestination(state2['data'], options17);
    if (assetId4['view'] === 'episode') {
      const enabled47 = await run54(assetId4['episodeId'], assetId4['clipId']);
      if (!enabled47) return ![];
      return (run52(assetId4), !![]);
    }
    if (
      !(await run55(assetId4['step'], {
        assetId: assetId4['assetId'],
        assetFilter: assetId4['assetFilter'],
        outlineSectionId: assetId4['outlineSectionId'],
      }))
    )
      return ![];
    return (run52(assetId4), !![]);
  }
  function run56(value303) {
    const text31 = normalizeText(value303),
      selectedEpisode8 = getSelectedEpisode(state2),
      count6 = state2['data']['episodes']['findIndex'](
        (value304) => value304['id'] === selectedEpisode8?.['id'],
      ),
      removeStoryEpisodeClip2 = removeStoryEpisodeClip(selectedEpisode8, text31);
    if (!text31 || !removeStoryEpisodeClip2 || count6 < 0x0)
      return (
        (state2['pendingDeleteClipId'] = ''),
        render(),
        showToast('删除片段失败，请刷新后重试。', 'error'),
        ![]
      );
    ((state2['data']['episodes'][count6] = removeStoryEpisodeClip2['episode']),
      (state2['pendingDeleteClipId'] = ''),
      (state2['selectedClipGenerationIds'] = state2['selectedClipGenerationIds']['filter'](
        (value305) => normalizeText(value305) !== text31,
      )));
    const value306 = removeStoryEpisodeClip2['episode']['clips']['find'](
        (value307) => normalizeText(value307?.['id']) === normalizeText(state2['selectedClipId']),
      ),
      value308 = value306 || removeStoryEpisodeClip2['nextClip'] || null;
    return (
      (state2['selectedClipId'] = value308?.['id'] || ''),
      applyVideoSettings(value308),
      schedulePersistence({ immediate: !![] }),
      render(),
      showToast('片段已删除。', 'success'),
      !![]
    );
  }
  function run4(value309) {
    const storyClipFrameMentionId = buildStoryClipFrameMentionId(value309);
    if (!storyClipFrameMentionId) return 0x0;
    const run57 = (el176) => {
      let value310 = 0x0;
      return (
        el176?.['querySelectorAll']?.('.ref-pill')?.['forEach']((el177) => {
          if (normalizeText(el177['dataset']?.['assetId']) !== storyClipFrameMentionId) return;
          (el177['remove']?.(), (value310 += 0x1));
        }),
        value310
      );
    };
    let value311 = 0x0;
    const selectedClip7 = getSelectedClip(state2, getSelectedEpisode(state2)),
      el178 = storyRoot['querySelector']('[data-story-clip-prompt]');
    if (el178 && selectedClip7) {
      const value312 = run57(el178);
      value312 &&
        ((selectedClip7['prompt'] = sanitizePromptHtmlForCommit(el178['innerHTML'])), (value311 += value312));
    }
    return (
      state2['data']['episodes']['forEach']((value313) => {
        (value313?.['clips'] || [])['forEach']((value314) => {
          if (!normalizeText(value314?.['prompt'])['includes'](storyClipFrameMentionId)) return;
          const el179 = documentObject['createElement']('div');
          el179['innerHTML'] = value314['prompt'];
          const enabled48 = run57(el179);
          if (!enabled48) return;
          ((value314['prompt'] = sanitizePromptHtmlForCommit(el179['innerHTML'])), (value311 += enabled48));
        });
      }),
      value311
    );
  }
  async function run58(value315) {
    const text32 = normalizeText(value315),
      list26 = normalizeStoryClipFrames(state2['data']['clipFrames']),
      canvasId = list26['find']((value316) => value316['id'] === text32);
    if (!canvasId) return (showToast('删除失败，当前内容已不存在。', 'error'), ![]);
    if (canvasId['captureSavePending'] === !![])
      return (showToast('请等待当前片段帧保存完成。', 'info'), ![]);
    if (
      typeof deleteCanvasNodes === 'function' &&
      normalizeText(canvasId['canvasId']) &&
      normalizeText(canvasId['canvasNodeId'])
    )
      try {
        await deleteCanvasNodes({ canvasId: canvasId['canvasId'], nodeIds: [canvasId['canvasNodeId']] });
      } catch (error4) {
        return (showToast(error4?.['message'] || '关联画布节点删除失败。', 'error'), ![]);
      }
    const count7 = run4(text32);
    ((state2['data']['clipFrames'] = removeStoryClipFrame(list26, text32)),
      hideHoverPreview(),
      refreshReferenceSummary());
    if (!syncFrameRail({ refreshContent: !![] })) render();
    schedulePersistence({ immediate: !![] });
    const storyClipFrameMediaType =
      getStoryClipFrameMediaType(canvasId) === STORY_CLIP_MEDIA_TYPE_VIDEO ? '视频片段' : '片段帧';
    return (
      showToast(
        count7 > 0x0
          ? storyClipFrameMediaType + '已删除，相关提示词引用已移除。'
          : storyClipFrameMediaType + '已删除。',
        'success',
      ),
      !![]
    );
  }
  const storyVideoReplicationWorkspaceController = createStoryVideoReplicationWorkspaceController({
      state: state2,
      viewport: viewportElement,
      documentObject: documentObject,
      windowObject: windowObject,
      analyzeSourceVideo: analyzeSourceVideo,
      analysisPromises: replicationAnalysisPromises,
      sourceFileByEpisodeKey: replicationSourceFileByEpisodeKey,
      createProjectToken: () => createProjectToken(state2),
      beginProjectSession: () => beginSession(),
      isProjectTaskLive: isLive,
      isProjectTaskCurrent: isCurrent3,
      startBackgroundTask: startBackgroundTask,
      updateBackgroundTask: updateBackgroundTask,
      finishBackgroundTask: finishBackgroundTask,
      syncProjectEntry: syncProjectEntry,
      syncCurrentProjectEntry: syncCurrentProjectEntry,
      schedulePersistence: schedulePersistence,
      openProject: openProject3,
      renderFooter: renderStoryVideoReplicationFooter,
      showToast: showToast,
      showNavigableTaskResultToast: showNavigableTaskResultToast,
      notifyTextTaskComplete: notifyTextTaskComplete,
    }),
    {
      createSourcePreviewUrl: createSourcePreviewUrl,
      refreshFooter: refreshFooter,
      releaseSourcePreviewUrls: releaseSourcePreviewUrls,
      retryFailedAnalysis: retryFailedAnalysis,
      revokeSourcePreviewUrl: revokeSourcePreviewUrl,
      runAnalysis: runAnalysis,
      startFromHome: startFromHome,
    } = storyVideoReplicationWorkspaceController,
    storyHomeWorkspaceController = createStoryHomeWorkspaceController({
      state: state2,
      root: storyRoot,
      viewport: viewportElement,
      documentObject: documentObject,
      windowObject: windowObject,
      projectData: projectData,
      extractDocumentText: extractDocumentText,
      syncCurrentProjectEntry: syncCurrentProjectEntry,
      beginProjectSession: () => beginSession(),
      advanceProjectSession: advanceProjectSession,
      invalidateProjectRuntime: invalidateRuntime,
      releaseReplicationSourcePreviewUrls: releaseSourcePreviewUrls,
      schedulePersistence: schedulePersistence,
      render: render,
      showToast: showToast,
      showTaskResultToast: showTaskResultToast,
      refreshTextModelSelector: (value317) => map4['get'](value317)?.['refreshTextModelSelector']?.(),
    }),
    {
      deleteProject: deleteProject,
      duplicateProject: duplicateProject,
      focusProjectTitle: focusProjectTitle,
      resetCreationState: resetCreationState,
      selectScriptFile: selectScriptFile,
      selectScriptMode: selectScriptMode,
      setProjectArchived: setProjectArchived,
      switchTab: switchTab,
      syncGenerateState: syncGenerateState,
    } = storyHomeWorkspaceController;
  function requestStoryWorkspaceChoice({
    overlayId: overlayId = 'story-planning-confirm-overlay',
    title: title6,
    message: message2,
    choices: choices = [],
    fallbackValue: fallbackValue = null,
  } = {}) {
    if (!documentObject?.['body']) return Promise['resolve'](fallbackValue);
    return (
      documentObject['getElementById'](overlayId)?.['remove'](),
      new Promise((handler9) => {
        const el180 = documentObject['createElement']('div');
        ((el180['id'] = overlayId), (el180['className'] = 'custom-confirm-overlay'));
        const value318 = documentObject['createElement']('div');
        value318['className'] = 'custom-confirm-box';
        const el181 = documentObject['createElement']('div');
        ((el181['className'] = 'confirm-title'), (el181['textContent'] = title6 || '重新生成'));
        const el182 = documentObject['createElement']('div');
        ((el182['className'] = 'confirm-msg'),
          (el182['textContent'] = message2 || '请选择如何处理已有生成结果。'));
        const el183 = documentObject['createElement']('div');
        ((el183['className'] = 'confirm-btns'),
          value318['append'](el181, el182, el183),
          el180['appendChild'](value318),
          documentObject['body']['appendChild'](el180));
        let value319 = ![],
          el184 = null;
        const run59 = (value320) => {
            if (value319) return;
            ((value319 = !![]),
              documentObject['removeEventListener']('keydown', value321, !![]),
              el180['remove'](),
              handler9(value320));
          },
          value321 = (event12) => {
            if (event12['key'] !== 'Escape') return;
            (event12['preventDefault'](), run59(null));
          };
        (el180['addEventListener']('click', (event13) => {
          if (event13['target'] === el180) run59(null);
        }),
          choices['forEach']((el185) => {
            const el186 = documentObject['createElement']('button');
            ((el186['type'] = 'button'),
              (el186['className'] = 'confirm-btn ' + (el185['primary'] ? 'confirm-ok' : 'confirm-cancel')),
              (el186['textContent'] = el185['label']),
              el186['addEventListener']('click', () => run59(el185['value'])),
              el183['appendChild'](el186));
            if (el185['autofocus']) el184 = el186;
          }),
          documentObject['addEventListener']('keydown', value321, !![]),
          el184?.['focus']?.());
      })
    );
  }
  const storyAssetExtractionWorkspaceController = createStoryAssetExtractionWorkspaceController({
      state: state2,
      windowObject: windowObject,
      extractAssets: extractAssets,
      extractAssetsParallel: extractAssetsParallel,
      extractAssetsExperimental: extractAssetsExperimental,
      host: {
        createStoryProjectTaskToken: createProjectToken,
        finishStoryProjectBackgroundTask: finishBackgroundTask,
        goToStep: (...args28) => run55(...args28),
        isProjectTaskCurrent: isCurrent3,
        isProjectTaskLive: isLive,
        notifyNavigableTextTaskComplete: notifyTextTaskComplete,
        persistWorkspaceNow: persistNow,
        refreshStoryAssetExtractionFooterInPlace: refreshStoryAssetExtractionFooterInPlace,
        refreshStoryReplicationFooterInPlace: refreshFooter,
        registerStoryProjectData: registerProjectData,
        render: (...args29) => render(...args29),
        reportStoryWorkspaceApiError: reportStoryWorkspaceApiError,
        requestStoryWorkspaceChoice: requestStoryWorkspaceChoice,
        resetStoryDownstreamUiState: (...args30) => resetDownstreamUi(...args30),
        scheduleWorkspacePersistence: schedulePersistence,
        showTaskResultToast: showTaskResultToast,
        showToast: showToast,
        startStoryProjectBackgroundTask: startBackgroundTask,
        syncCompiledEpisodeScripts: (...args31) => syncCompiledScripts(...args31),
        syncStoryPlanningLoading: syncStoryPlanningLoading,
        syncStoryProjectTaskEntry: syncProjectEntry,
        updateStoryProjectBackgroundTask: updateBackgroundTask,
      },
    }),
    {
      continueToProjectAssets: continueToProjectAssets,
      extractProjectAssets: extractProjectAssets,
      getStoryPlanningAgentContext: getStoryPlanningAgentContext,
      openEpisodeStage: openEpisodeStage,
      requestPlanningRegenerationMode: requestPlanningRegenerationMode,
      restoreStoryAssetBreakdownProgress: restoreStoryAssetBreakdownProgress,
      setStoryPlanningOperation: setStoryPlanningOperation,
      stopStoryAssetBreakdownProgress: stopStoryAssetBreakdownProgress,
    } = storyAssetExtractionWorkspaceController,
    storyEpisodeOutlineWorkspaceController = createStoryEpisodeOutlineWorkspaceController({
      state: state2,
      planEpisodes: planEpisodes,
      host: {
        showToast: showToast,
        showTaskResultToast: showTaskResultToast,
        requestChoice: requestStoryWorkspaceChoice,
        requestRegenerationMode: requestPlanningRegenerationMode,
        createProjectTaskToken: () => createProjectToken(state2),
        getPlanningContext: getStoryPlanningAgentContext,
        isProjectTaskLive: isLive,
        isProjectTaskCurrent: isCurrent3,
        startBackgroundTask: startBackgroundTask,
        updateBackgroundTask: updateBackgroundTask,
        finishBackgroundTask: finishBackgroundTask,
        persistNow: persistNow,
        persistenceRequired: () => typeof saveWorkspace === 'function' && coordinator['isReady'](),
        setPlanningOperation: setStoryPlanningOperation,
        syncPlanningLoading: syncStoryPlanningLoading,
        registerProjectData: registerProjectData,
        resetDownstreamUi: resetDownstreamUi,
        schedulePersistence: schedulePersistence,
        notifyComplete: notifyTextTaskComplete,
        render: render,
      },
    });
  function run60(options18 = {}) {
    return storyEpisodeOutlineWorkspaceController['execute'](options18);
  }
  function syncCompiledScripts(episodeIds = state2['data']) {
    const fullText = compileStoryEpisodeScripts(episodeIds['episodes']),
      value322 = episodeIds['project'] || {};
    return (
      (value322['chapters'] = fullText['chapters']),
      (value322['plotScript'] = fullText['fullText']),
      (value322['narrationScript'] = fullText['fullText']),
      (value322['compiledScript'] = fullText['complete']
        ? {
            revision: Number(value322['compiledScript']?.['revision'] || 0x0) + 0x1,
            episodeIds: episodeIds['episodes']['map']((value323) => value323['id']),
            fullText: fullText['fullText'],
            confirmedAt: Date['now'](),
          }
        : null),
      fullText
    );
  }
  function resetDownstreamUi({ selectedEpisodeId: selectedEpisodeId = '' } = {}) {
    ((state2['assetSelectionMode'] = state2['replicationSelectionMode'] = ![]),
      (state2['selectedAssetIds'] = []),
      (state2['selectedAssetId'] = ''),
      (state2['assetAppearanceIndexes'] = {}),
      (state2['characterVoiceEditor'] = null),
      (state2['episodeSelectionMode'] = ![]),
      (state2['selectedEpisodeIds'] = []),
      (state2['selectedEpisodeId'] = selectedEpisodeId),
      (state2['selectedClipId'] = ''),
      (state2['pendingDeleteClipId'] = ''),
      (state2['clipSelectionMode'] = ![]),
      (state2['selectedClipGenerationIds'] = []),
      (state2['scriptSelectionMode'] = ![]),
      (state2['selectedScriptEpisodeIds'] = []));
  }
  const storySummaryGenerationWorkspaceController = createStorySummaryGenerationWorkspaceController({
      state: state2,
      windowObject: windowObject,
      generateStory: generateStory,
      startReplicationFromHome: (...args32) => startFromHome(...args32),
      createProjectToken: () => createProjectToken(state2),
      beginProjectSession: () => beginSession(),
      isProjectTaskLive: isLive,
      isProjectTaskCurrent: isCurrent3,
      registerProjectData: registerProjectData,
      startBackgroundTask: startBackgroundTask,
      updateBackgroundTask: updateBackgroundTask,
      finishBackgroundTask: finishBackgroundTask,
      syncProjectEntry: syncProjectEntry,
      syncCurrentProjectEntry: syncCurrentProjectEntry,
      persistNow: persistNow,
      schedulePersistence: schedulePersistence,
      requiresDurableRunPersistence: () => typeof saveWorkspace === 'function' && coordinator['isReady'](),
      openProject: openProject3,
      render: render,
      showToast: showToast,
      showTaskResultToast: showTaskResultToast,
      notifyTextTaskComplete: notifyTextTaskComplete,
      requestChoice: requestStoryWorkspaceChoice,
      extractProjectAssets: extractProjectAssets,
      resetDownstreamUi: resetDownstreamUi,
      reportApiError: reportStoryWorkspaceApiError,
    }),
    { generateFromHome: generateFromHome, regenerateSummary: regenerateSummary } =
      storySummaryGenerationWorkspaceController,
    storyEpisodeScriptWorkspaceController = createStoryEpisodeScriptWorkspaceController({
      state: state2,
      generateEpisodeScript: generateEpisodeScript,
      host: {
        createProjectTaskToken: () => createProjectToken(state2),
        isProjectTaskLive: isLive,
        isProjectTaskCurrent: isCurrent3,
        getPlanningContext: getStoryPlanningAgentContext,
        requestChoice: requestStoryWorkspaceChoice,
        startBackgroundTask: startBackgroundTask,
        updateBackgroundTask: updateBackgroundTask,
        finishBackgroundTask: finishBackgroundTask,
        persistNow: persistNow,
        persistenceRequired: () => typeof saveWorkspace === 'function' && coordinator['isReady'](),
        renderPlanningProgress: () => {
          if (state2['view'] === 'project' && state2['step'] === 0x1) render();
        },
        registerProjectData: registerProjectData,
        resetDownstreamUi: resetDownstreamUi,
        syncCompiledScripts: syncCompiledScripts,
        schedulePersistence: schedulePersistence,
      },
    });
  async function run61(
    value324,
    value325 = createProjectToken(state2),
    { batch: batch = null, regeneration: regeneration = ![] } = {},
  ) {
    return await storyEpisodeScriptWorkspaceController['request'](value324, value325, {
      batch: batch,
      regeneration: regeneration,
    });
  }
  async function run62(episodeId3, { regeneration: regeneration = ![] } = {}) {
    if (state2['storyPlanningOperation']) return ![];
    const count8 = state2['data']['episodes']['findIndex']((value326) => value326['id'] === episodeId3);
    if (count8 < 0x0) return ![];
    if (!regeneration && !canGenerateStoryEpisodeScript(state2['data']['episodes'], count8))
      return (
        showToast(
          '请先完成第\x20' + (getNextStoryEpisodeScriptIndex(state2['data']['episodes']) + 0x1) + ' 集剧本。',
          'warn',
        ),
        ![]
      );
    const value327 = state2['data']['episodes'][count8];
    ((state2['scriptGenerationFocusMode'] = !![]),
      (state2['generatingEpisodeScriptId'] = value327['id']),
      (state2['episodeScriptGenerationStatus'] = '正在生成第 ' + (count8 + 0x1) + ' 集完整剧本'),
      setStoryPlanningOperation('writing-episode-script', state2['episodeScriptGenerationStatus']));
    const value328 = createProjectToken(state2);
    try {
      const value329 = await run61(value327, value328, { regeneration: regeneration });
      if (!isLive(value328)) return ![];
      return (
        notifyTextTaskComplete('第\x20' + (count8 + 0x1) + ' 集完整剧本生成完成。', value328, {
          step: 0x1,
          outlineSectionId: 'episode-' + episodeId3,
        }),
        Boolean(value329)
      );
    } catch (error5) {
      if (!isLive(value328)) return ![];
      return (
        reportStoryWorkspaceApiError('write-episode-script', error5, {
          model: state2['models']['text'],
          provider: state2['textProvider'],
          episodeId: episodeId3,
        }),
        showTaskResultToast(
          error5?.['message'] || '第\x20' + (count8 + 0x1) + '\x20集剧本生成失败。',
          'error',
          error5,
        ),
        ![]
      );
    } finally {
      isCurrent3(value328) &&
        ((state2['generatingEpisodeScriptId'] = ''),
        (state2['episodeScriptGenerationStatus'] = ''),
        (state2['storyPlanningOperation'] = ''),
        (state2['storyPlanningStatus'] = ''),
        render());
    }
  }
  function run63() {
    if (state2['storyPlanningOperation'] !== 'writing-episode-scripts') return ![];
    const text33 = normalizeText(state2['episodeScriptBatchId']);
    if (!text33) return ![];
    const storyBackgroundTasks = getStoryBackgroundTasks(state2['data'])['find'](
      (value330) => isStoryBackgroundTaskActive(value330) && value330['batch']?.['id'] === text33,
    );
    if (!storyBackgroundTasks) return ![];
    const pendingEpisodeIds = normalizeText(state2['generatingEpisodeScriptId']),
      cancelledEpisodeIds = (
        Array['isArray'](storyBackgroundTasks['batch']?.['pendingEpisodeIds'])
          ? storyBackgroundTasks['batch']['pendingEpisodeIds']
          : []
      )
        ['map']((value331) => normalizeText(value331))
        ['filter']((value332) => value332 && value332 !== pendingEpisodeIds);
    if (!cancelledEpisodeIds['length'])
      return (showToast('当前集正在生成，暂无可取消的排队分集。', 'info'), ![]);
    if (!map5['request'](text33)) return ![];
    const count9 = state2['data']['episodes']['findIndex'](
        (value333) => normalizeText(value333?.['id']) === pendingEpisodeIds,
      ),
      label =
        count9 >= 0x0
          ? '已取消后续 ' +
            cancelledEpisodeIds['length'] +
            '\x20集排队，正在完成第\x20' +
            (count9 + 0x1) +
            '\x20集'
          : '已取消后续\x20' + cancelledEpisodeIds['length'] + '\x20集排队，正在完成当前集',
      value334 = createProjectToken(state2);
    return (
      updateBackgroundTaskBatch(value334, text33, {
        cancelRequested: !![],
        cancelledEpisodeIds: cancelledEpisodeIds,
        pendingEpisodeIds: pendingEpisodeIds ? [pendingEpisodeIds] : [],
        label: label,
      }),
      (state2['episodeScriptBatchCancelRequested'] = !![]),
      (state2['episodeScriptGenerationStatus'] = label),
      (state2['storyPlanningStatus'] = label),
      render(),
      showToast('已取消后续 ' + cancelledEpisodeIds['length'] + ' 集排队；当前集会继续生成。', 'info'),
      !![]
    );
  }
  async function run64({ selectedOnly: selectedOnly = ![] } = {}) {
    if (state2['storyPlanningOperation']) return ![];
    if (selectedOnly && !state2['selectedScriptEpisodeIds']['length'])
      return (showToast('请先选择从下一集开始的连续分集。', 'info'), ![]);
    const total = getStoryEpisodeScriptBatchTargets(
      state2['data']['episodes'],
      selectedOnly ? state2['selectedScriptEpisodeIds'] : [],
    );
    if (!total['length'])
      return (
        showToast(selectedOnly ? '请选择从下一集开始的连续分集。' : '没有待生成的分集剧本。', 'info'),
        ![]
      );
    ((state2['isBatchGeneratingScripts'] = !![]), (state2['scriptGenerationFocusMode'] = !![]));
    const value335 = createProjectToken(state2),
      value336 = value335['data'],
      batchId = createTaskBatch('episode-scripts', {
        total: total['length'],
        completed: 0x0,
        targetEpisodeIds: total['map']((value337) => value337['id']),
        pendingEpisodeIds: total['map']((value338) => value338['id']),
        label: '批量生成 0/' + total['length'],
      });
    ((state2['episodeScriptBatchId'] = batchId['id']),
      (state2['episodeScriptBatchCancelRequested'] = ![]),
      setStoryPlanningOperation('writing-episode-scripts', '准备按顺序生成 ' + total['length'] + '\x20集'));
    let completed = 0x0;
    try {
      const response7 = await runStoryEpisodeScriptBatchQueue({
        targets: total,
        batchId: batchId['id'],
        isLive: () => isLive(value335),
        isCancellationRequested: (value339) => map5['isRequested'](value339),
        beforeTarget: ({
          target: target2,
          completed: completed2,
          total: total2,
          pendingTargets: pendingTargets,
        }) => {
          const value340 = value336['episodes']['findIndex']((value341) => value341['id'] === target2['id']),
            label2 = '正在生成第 ' + (value340 + 0x1) + ' 集 · ' + (completed2 + 0x1) + '/' + total2;
          (syncTaskBatch(value335, batchId, {
            completed: completed2,
            pendingEpisodeIds: pendingTargets['map']((value342) => value342['id']),
            label: label2,
          }),
            isCurrent3(value335) &&
              ((state2['generatingEpisodeScriptId'] = target2['id']),
              (state2['episodeScriptGenerationStatus'] = label2),
              render()));
        },
        runTarget: async (value343) => {
          const value344 = value336['episodes']['findIndex']((value345) => value345['id'] === value343['id']);
          return run61(value336['episodes'][value344], value335, { batch: batchId });
        },
        afterTarget: ({
          completed: completed3,
          total: total3,
          pendingTargets: pendingTargets2,
          cancelRequested: cancelRequested,
        }) => {
          ((completed = completed3),
            syncTaskBatch(value335, batchId, {
              completed: completed,
              cancelRequested: cancelRequested,
              pendingEpisodeIds: pendingTargets2['map']((value346) => value346['id']),
              label: cancelRequested
                ? '批量生成已停止 · 完成 ' + completed + '/' + total3
                : '批量生成\x20' + completed + '/' + total3,
            }));
        },
      });
      if (response7['status'] === 'interrupted') return ![];
      if (response7['status'] === 'cancelled')
        return (
          notifyTextTaskComplete(
            response7['cancelled']
              ? '当前集已完成，已取消剩余 ' + response7['cancelled'] + '\x20集排队。'
              : '当前集已完成，批量生成已停止。',
            value335,
            { step: 0x1, outlineSectionId: 'episodes' },
          ),
          isCurrent3(value335) &&
            ((state2['scriptSelectionMode'] = ![]), (state2['selectedScriptEpisodeIds'] = [])),
          !![]
        );
      return (
        notifyTextTaskComplete('已按顺序完成\x20' + completed + '\x20集完整剧本。', value335, {
          step: 0x1,
          outlineSectionId: 'episodes',
        }),
        isCurrent3(value335) &&
          ((state2['scriptSelectionMode'] = ![]), (state2['selectedScriptEpisodeIds'] = [])),
        !![]
      );
    } catch (error6) {
      if (!isLive(value335)) return ![];
      return (
        reportStoryWorkspaceApiError('write-episode-scripts-batch', error6, {
          model: state2['models']['text'],
          provider: state2['textProvider'],
          completed: completed,
        }),
        showTaskResultToast(
          '已完成 ' + completed + ' 集；' + (error6?.['message'] || '后续分集生成失败。'),
          'error',
          error6,
        ),
        ![]
      );
    } finally {
      (map5['clear'](batchId['id']),
        isCurrent3(value335) &&
          ((state2['isBatchGeneratingScripts'] = ![]),
          (state2['generatingEpisodeScriptId'] = ''),
          (state2['episodeScriptBatchId'] = ''),
          (state2['episodeScriptBatchCancelRequested'] = ![]),
          (state2['episodeScriptGenerationStatus'] = ''),
          (state2['storyPlanningOperation'] = ''),
          (state2['storyPlanningStatus'] = ''),
          render()));
    }
  }
  async function run65(value347) {
    if (state2['storyPlanningOperation']) return ![];
    if (state2['data']['project']?.['sourceMode'] === 'upload-original')
      return (showToast('上传剧本保持原稿，不支持 AI 扩写分集正文。', 'info'), ![]);
    const count10 = state2['data']['episodes']['findIndex']((value348) => value348['id'] === value347);
    if (count10 < 0x0 || !normalizeText(state2['data']['episodes'][count10]?.['script']?.['fullText']))
      return (showToast('当前分集正文尚未生成。', 'info'), ![]);
    return run62(value347, { regeneration: !![] });
  }
  function run66(value349) {
    const nextStoryEpisodeScriptIndex2 = getNextStoryEpisodeScriptIndex(state2['data']['episodes']),
      count11 = state2['data']['episodes']['findIndex']((value350) => value350['id'] === value349);
    if (count11 < nextStoryEpisodeScriptIndex2 || count11 < 0x0) return ![];
    const value351 = state2['selectedScriptEpisodeIds']['includes'](value349),
      value352 = value351 ? count11 : count11 + 0x1;
    return (
      (state2['selectedScriptEpisodeIds'] = state2['data']['episodes']
        ['slice'](nextStoryEpisodeScriptIndex2, value352)
        ['map']((value353) => value353['id'])),
      (state2['scriptSelectionMode'] = state2['selectedScriptEpisodeIds']['length'] > 0x0),
      render(),
      !![]
    );
  }
  const storyEpisodeSplitWorkspaceController = createStoryEpisodeSplitWorkspaceController({
      state: state2,
      windowObject: windowObject,
      operations: {
        recoverDraft: recoverEpisodeSplitDraft,
        review: reviewEpisodeSplit,
        splitExperimental: splitEpisodeExperimental,
        splitStandard: splitEpisode,
      },
      projectTasks: projectTasks,
      persistence: {
        isDurableRequired: () => typeof saveWorkspace === 'function' && coordinator['isReady'](),
        persistNow: persistNow,
        schedule: schedulePersistence,
      },
      presentation: {
        getGenerationControl: (value354) => getStoryEpisodeGenerationControlState(state2, value354),
        notifyComplete: notifyTextTaskComplete,
        notifyGenerationResult: notifyNavigableGenerationComplete,
        openEpisode: (...args33) => run54(...args33),
        render: (...args34) => render(...args34),
        requestChoice: requestStoryWorkspaceChoice,
        showTaskResult: showTaskResultToast,
        showToast: showToast,
      },
      getPlanningContext: getStoryPlanningAgentContext,
    }),
    {
      cancelBatch: cancelBatch,
      recoverDraft: recoverDraft,
      splitBatch: splitBatch,
      splitEpisode: splitEpisode2,
      splitEpisodeExperimental: splitEpisodeExperimental2,
    } = storyEpisodeSplitWorkspaceController;
  async function run67() {
    if (!isStoryEpisodeExperimentalSplitAvailable(windowObject)) return ![];
    if (state2['storyPlanningOperation']) return ![];
    if (typeof planEpisodes !== 'function')
      return (showToast('分集规划\x20Agent\x20尚未初始化。', 'error'), ![]);
    const storyWorkspaceAssetData = normalizeStoryWorkspaceAssetData(run2(state2['data'])),
      project2 = getStoryPlanningAgentContext(storyWorkspaceAssetData);
    try {
      const preparePayload = () =>
        captureStoryRequestPayload((request) =>
          planEpisodes({
            project: project2['project'],
            constraints: project2['project']['planning'],
            model: project2['model'],
            provider: project2['provider'],
            providerProfileId: project2['providerProfileId'],
            request: request,
          }),
        );
      return (
        openStoryRequestDebugPreview({
          documentObject: documentObject,
          windowObject: windowObject,
          preparePayload: preparePayload,
          title: '分集大纲请求调试',
          subtitle: '以下是点击“生成分集大纲”后构造的实际请求；本次仅预览，不会发送到 API。',
        }),
        !![]
      );
    } catch (error7) {
      return (
        reportStoryWorkspaceApiError('debug-episode-outline-request', error7),
        showToast(error7?.['message'] || '分集大纲调试请求构建失败。', 'error'),
        ![]
      );
    }
  }
  async function run68() {
    if (!isStoryEpisodeExperimentalSplitAvailable(windowObject)) return ![];
    if (state2['storyPlanningOperation']) return ![];
    if (typeof generateEpisodeScript !== 'function')
      return (showToast('完整分集剧本 Agent 尚未初始化。', 'error'), ![]);
    const nextEpisode = normalizeStoryWorkspaceAssetData(run2(state2['data'])),
      previousEpisode = getNextStoryEpisodeScriptIndex(nextEpisode['episodes']),
      episode8 = nextEpisode['episodes'][previousEpisode];
    if (!episode8) return (showToast('没有待生成的分集正文。', 'info'), ![]);
    const project3 = getStoryPlanningAgentContext(nextEpisode);
    try {
      const preparePayload2 = () =>
        captureStoryRequestPayload((request2) =>
          generateEpisodeScript({
            project: project3['project'],
            episode: episode8,
            previousEpisode: previousEpisode > 0x0 ? nextEpisode['episodes'][previousEpisode - 0x1] : null,
            nextEpisode: nextEpisode['episodes'][previousEpisode + 0x1] || null,
            model: project3['model'],
            provider: project3['provider'],
            providerProfileId: project3['providerProfileId'],
            request: request2,
          }),
        );
      return (
        openStoryRequestDebugPreview({
          documentObject: documentObject,
          windowObject: windowObject,
          preparePayload: preparePayload2,
          title: '第\x20' + (episode8['number'] || previousEpisode + 0x1) + ' 集正文请求调试',
          subtitle: '以下是下一集正文生成时构造的实际请求；本次仅预览，不会发送到 API。',
        }),
        !![]
      );
    } catch (error8) {
      return (
        reportStoryWorkspaceApiError('debug-episode-script-request', error8, {
          episodeId: episode8['id'],
        }),
        showToast(error8?.['message'] || '分集正文调试请求构建失败。', 'error'),
        ![]
      );
    }
  }
  async function run69() {
    if (!isStoryAssetExperimentalExtractionAvailable(windowObject)) return ![];
    if (state2['storyPlanningOperation']) return ![];
    if (typeof extractAssetsExperimental !== 'function')
      return (showToast('混合素材开发测试尚未初始化。', 'error'), ![]);
    const episodes3 = normalizeStoryWorkspaceAssetData(run2(state2['data'])),
      args35 = getStoryPlanningAgentContext(episodes3);
    try {
      const preparePayload3 = () =>
        captureStoryRequestPayload((request3) =>
          extractAssetsExperimental({
            ...args35,
            episodes: episodes3['episodes'],
            resumeDraft: episodes3['experimentalAssetExtractionDraft'],
            preferLocal: ![],
            request: request3,
          }),
        );
      return (
        openStoryRequestDebugPreview({
          documentObject: documentObject,
          windowObject: windowObject,
          preparePayload: preparePayload3,
          title: '混合素材抽取 API 请求调试',
          subtitle:
            '以下是开发链路构造的首个 API 请求；中短剧本预览角色专用请求，超长剧本因本次不运行本地模型而预览备用分批请求。仅供调试，不会发送到 API。',
        }),
        !![]
      );
    } catch (error9) {
      return (
        reportStoryWorkspaceApiError('debug-asset-extraction-experimental-request', error9),
        showToast(error9?.['message'] || '混合素材抽取调试请求构建失败。', 'error'),
        ![]
      );
    }
  }
  async function run70(value355, promptExperiment = !![]) {
    if (!isStoryEpisodeExperimentalSplitAvailable(windowObject)) return ![];
    const el187 = getStoryEpisodeGenerationControlState(state2, value355);
    if (el187['disabled']) return ![];
    const run71 = promptExperiment ? splitEpisodeExperimental : splitEpisode;
    if (typeof run71 !== 'function')
      return (showToast('实验分批拆分\x20Agent\x20尚未初始化。', 'error'), ![]);
    const assets2 = normalizeStoryWorkspaceAssetData(run2(state2['data'])),
      episode9 = assets2['episodes']['find']((value356) => value356['id'] === value355);
    if (!episode9) return ![];
    const project4 = getStoryPlanningAgentContext(assets2),
      count12 = assets2['episodes']['findIndex']((value357) => value357['id'] === episode9['id']),
      previousEpisode2 = count12 > 0x0 ? assets2['episodes'][count12 - 0x1] : null,
      nextEpisode2 = count12 >= 0x0 ? assets2['episodes'][count12 + 0x1] || null : null,
      resumeDraft =
        episode9?.['experimentalSplitDraft']?.['status'] === 'completed'
          ? null
          : episode9?.['experimentalSplitDraft'] || null;
    try {
      const preparePayload4 = () =>
        captureStoryRequestPayload((request4) =>
          run71({
            project: project4['project'],
            episode: episode9,
            previousEpisode: previousEpisode2,
            nextEpisode: nextEpisode2,
            assets: assets2['assets'],
            constraints: project4['project']['planning'],
            model: project4['model'],
            provider: project4['provider'],
            providerProfileId: project4['providerProfileId'],
            promptExperiment: promptExperiment,
            resumeDraft: resumeDraft,
            request: request4,
          }),
        );
      return (
        openStoryRequestDebugPreview({
          documentObject: documentObject,
          windowObject: windowObject,
          preparePayload: preparePayload4,
          title: '第\x20' + (episode9['number'] || '') + ' 集请求调试',
          subtitle: '下一次分镜生成构造的请求；本次仅预览，不会发送到 API。',
        }),
        !![]
      );
    } catch (error10) {
      return (
        reportStoryWorkspaceApiError('debug-experimental-split-request', error10, {
          episodeId: episode9['id'],
        }),
        showToast(error10?.['message'] || '调试请求构建失败。', 'error'),
        ![]
      );
    }
  }
  const storyClipProductionWorkspaceController = createStoryClipProductionWorkspaceController({
      state: state2,
      root: storyRoot,
      documentObject: documentObject,
      windowObject: windowObject,
      activeControllers: activeClipGenerationControllers,
      projectTasks: {
        createToken: () => createProjectToken(state2),
        isLive: isLive,
        isCurrent: isCurrent3,
        register: registerProjectData,
        createBatch: createTaskBatch,
        syncBatch: syncTaskBatch,
      },
      createGenerationController: createGenerationController,
      render: render,
      refreshGeneration: refreshGeneration,
      persistWorkspaceNow: persistNow,
      schedulePersistence: schedulePersistence,
      showToast: showToast,
      showTaskApiKeyError: showTaskApiKeyError,
      showTaskResultToast: showTaskResultToast,
      showNavigableTaskResultToast: showNavigableTaskResultToast,
      notifyNavigableGenerationComplete: notifyNavigableGenerationComplete,
    }),
    { generateSelection: generateSelection, runtime: runtime } = storyClipProductionWorkspaceController;
  async function run72(mode, el188 = null) {
    const episode10 = getSelectedEpisode(state2),
      clip2 = getSelectedClip(state2, episode10);
    if (!episode10 || (mode === 'current' && !clip2))
      return (showToast('请先选择要导出的片段。', 'warn'), ![]);
    const value358 = el188?.['disabled'] === !![];
    if (el188 && 'disabled' in el188) el188['disabled'] = !![];
    syncStoryAsyncButton(el188, !![]);
    try {
      const error11 = await exportStoryClipVideos({
        project: state2['data']['project'],
        episode: episode10,
        clip: clip2,
        mode: mode,
      });
      if (error11?.['canceled']) return ![];
      if (!error11?.['success'])
        throw new Error(error11?.['error'] || error11?.['message'] || '视频片段导出失败。');
      const value359 = Math['max'](0x0, Number(error11['exportedCount']) || 0x0),
        value360 = Math['max'](0x0, Number(error11['skippedCount']) || 0x0);
      return (
        showToast(
          value360
            ? '已导出 ' + value359 + ' 个片段，跳过 ' + value360 + ' 个无可用视频的片段。'
            : mode === 'current'
              ? '当前片段已导出。'
              : '已导出本集 ' + value359 + ' 个片段。',
          'success',
        ),
        !![]
      );
    } catch (error12) {
      return (showToast(error12?.['message'] || '视频片段导出失败。', 'error'), ![]);
    } finally {
      syncStoryAsyncButton(el188, ![]);
      if (el188 && 'disabled' in el188) el188['disabled'] = value358;
    }
  }
  async function run73(value361) {
    const error13 = getSelectedStoryAsset(state2, getVisibleStoryAssets(state2)),
      error14 = error13 ? getSelectedAssetAppearance(state2, error13) : null,
      imageRef = normalizeText(error14?.['imageUrl']);
    if (!error13 || !error14 || !imageRef) return (showToast('当前没有可下载的图片。', 'warn'), ![]);
    const text34 = normalizeText(error14['name']),
      text35 = normalizeText(error13['name']) || '生成图片',
      filenameBase =
        text34 && text34 !== text35 && text34 !== '基础形象' ? [text35, text34]['join']('-') : text35;
    try {
      syncStoryAsyncButton(value361, !![], { spinnerOnly: !![] });
      const response8 = await runWorkspaceImageDownloadAction(value361, () =>
        saveWorkspaceImageDownload({ imageRef: imageRef, filenameBase: filenameBase, saveMedia: saveMedia }),
      );
      if (!response8 || response8['canceled']) return ![];
      if (response8['success'] === ![]) throw new Error(response8['error'] || '图片下载失败，请稍后重试。');
      return (showToast('图片已保存。', 'success'), !![]);
    } catch (error15) {
      return (showToast(error15?.['message'] || '图片下载失败，请稍后重试。', 'error'), ![]);
    } finally {
      syncStoryAsyncButton(value361, ![]);
    }
  }
  async function run74() {
    const asset6 = findStoryAsset(state2, state2['selectedAssetId']),
      appearance7 = asset6 ? getSelectedAssetAppearance(state2, asset6) : null;
    if (!asset6 || !appearance7 || asset6['isLibraryAsset'])
      return (showToast('当前形象不可加入总素材。', 'warn'), ![]);
    if (!normalizeText(appearance7['imageUrl'])) return (showToast('请先生成或上传当前形象。', 'warn'), ![]);
    if (typeof saveAssetPackageItem !== 'function')
      return (showToast('总素材服务尚未初始化。', 'error'), ![]);
    const value362 = asset6['id'] + ':' + appearance7['id'];
    if (normalizeText(state2['exportingAssetAppearanceKey']) === value362) return ![];
    const project5 = createProjectToken(state2),
      contentElement = storyRoot['querySelector'](
        '.story-page.is-current\x20.story-asset-detail\x20.story-asset-preview',
      ),
      fromRect = contentElement?.['getBoundingClientRect']?.() || null;
    let value363 = ![];
    ((state2['exportingAssetAppearanceKey'] = value362), render());
    try {
      let itemKey = buildStoryAssetPackageItemRequest({
        project: project5['data']['project'],
        asset: asset6,
        appearance: appearance7,
      });
      const text36 = normalizeText(itemKey['image']?.['imageUrl'] || appearance7['imageUrl']),
        enabled49 = Boolean(
          normalizeText(
            itemKey['image']?.['localPath'] ||
              itemKey['image']?.['originalLocalPath'] ||
              itemKey['image']?.['displayLocalPath'],
          ),
        );
      if (!enabled49 && /^(?:https?:|blob:|data:)/i['test'](text36)) {
        const response9 = await saveOutputFromUrl(text36, {
          kind: 'image',
          ext: 'png',
          dedupeKey: [
            'story-asset-package',
            normalizeText(project5['projectId']),
            normalizeText(asset6['id']),
            normalizeText(appearance7['id']),
            text36,
          ]['join'](':'),
        });
        if (response9?.['error']) throw new Error(response9['error']);
        const imageUrl5 = normalizeText(
          response9?.['displayUrl'] ||
            response9?.['url'] ||
            response9?.['originalUrl'] ||
            response9?.['thumbUrl'],
        );
        if (!imageUrl5) throw new Error('保存当前形象失败：缺少稳定图片地址。');
        itemKey = buildStoryAssetPackageItemRequest({
          project: project5['data']['project'],
          asset: asset6,
          appearance: appearance7,
          image: {
            ...itemKey['image'],
            ...(response9 && typeof response9 === 'object' ? response9 : {}),
            imageUrl: imageUrl5,
          },
        });
      }
      const saveAssetPackageItem2 = await saveAssetPackageItem(itemKey);
      if (!isLive(project5)) return ![];
      const imageUrl6 = normalizeText(saveAssetPackageItem2?.['imageUrl'] || itemKey['image']?.['imageUrl']);
      return (
        imageUrl6 && (appearance7['imageUrl'] = imageUrl6),
        (appearance7['totalAssetRef'] = {
          assetId: normalizeText(saveAssetPackageItem2?.['assetId']),
          itemIndex: Math['max'](0x0, Math['trunc'](Number(saveAssetPackageItem2?.['itemIndex']) || 0x0)),
          itemKey: itemKey['itemKey'],
          imageUrl: imageUrl6,
          updatedAt: Date['now'](),
        }),
        schedulePersistence({ immediate: !![] }),
        showToast(
          saveAssetPackageItem2?.['itemCreated'] === ![]
            ? '已更新总素材中的当前形象。'
            : '当前形象已加入总素材。',
          'success',
        ),
        (value363 = !![]),
        !![]
      );
    } catch (error16) {
      return (
        isLive(project5) && showToast(error16?.['message'] || '加入总素材失败，请稍后重试。', 'error'),
        ![]
      );
    } finally {
      isCurrent3(project5) &&
        ((state2['exportingAssetAppearanceKey'] = ''),
        render(),
        value363 &&
          contentElement &&
          fromRect &&
          playAssetCreateFly({
            fromRect: fromRect,
            contentElement: contentElement,
            toElement: storyRoot['querySelector']('[data-story-asset-filter="library"]'),
            documentObject: documentObject,
            windowObject: windowObject,
          }));
    }
  }
  function run75(value364 = '', targetAppearanceId = '', createAppearance = ![], value365 = null) {
    const targetAssetId = findStoryAsset(state2, value364);
    if (!targetAssetId) return (showToast('请选择本剧已有的角色、场景或道具。', 'warn'), ![]);
    const visibleStoryAssets2 = getVisibleStoryAssets(state2),
      list27 = value365 || getStoryLibraryActionAssetIds(state2, visibleStoryAssets2);
    if (normalizeText(targetAppearanceId) && list27['length'] !== 0x1)
      return (showToast('替换已有形象时只能选择一张总素材图片。', 'warn'), ![]);
    const args36 = addStoryLibraryAssetsToProject(
        state2['data']['assets'],
        visibleStoryAssets2,
        list27,
        targetAssetId['id'],
        { targetAppearanceId: targetAppearanceId, createAppearance: createAppearance },
      ),
      list28 = [...args36['updatedAppearanceIds'], ...args36['existingAssetIds'], ...args36['addedAssetIds']];
    if (!list28['length']) return (showToast('请选择总素材中的图片后再加入项目。', 'warn'), ![]);
    (run35(), (state2['data']['assets'] = args36['assets']));
    const storyAsset3 = findStoryAsset(state2, targetAssetId['id']),
      value366 = list28['at'](-0x1) || '',
      selectedAppearanceIndex = getStoryAssetAppearances(storyAsset3)['findIndex'](
        (value367) => normalizeText(value367?.['id']) === value366,
      );
    (applyStoryLibraryAdditionUiState(state2, {
      targetAssetId: targetAssetId['id'],
      selectedAppearanceIndex: selectedAppearanceIndex,
    }),
      render(),
      schedulePersistence({ immediate: !![] }));
    if (args36['updatedAppearanceIds']['length'])
      showToast('已更新' + targetAssetId['name'] + '的所选形象。', 'success');
    else
      args36['addedAssetIds']['length']
        ? showToast(
            '已为' + targetAssetId['name'] + '新增\x20' + args36['addedAssetIds']['length'] + ' 个形象。',
            'success',
          )
        : showToast('所选图片已在' + targetAssetId['name'] + '的形象中。', 'info');
    return !![];
  }
  function run76(count13, value368 = state2['selectedAssetId']) {
    const storyAsset4 = findStoryAsset(state2, value368),
      list29 = storyAsset4 ? getStoryAssetAppearances(storyAsset4) : [];
    if (list29['length'] < 0x2) return;
    const selectedAssetAppearanceIndex2 = getSelectedAssetAppearanceIndex(state2, storyAsset4),
      value369 = (selectedAssetAppearanceIndex2 + count13 + list29['length']) % list29['length'];
    ((state2['assetAppearanceIndexes'] = {
      ...state2['assetAppearanceIndexes'],
      [storyAsset4['id']]: value369,
    }),
      (state2['pendingDeleteAssetAppearanceKey'] = ''),
      (state2['assetAppearanceMotion'] = count13 > 0x0 ? 'next' : 'previous'));
    const el189 = [...storyRoot['querySelectorAll']('.story-asset-card[data-story-asset-id]')]['find'](
      (el190) => el190['dataset']['storyAssetId'] === value368,
    );
    if (el189) {
      const el191 = documentObject['createElement']('div');
      el191['innerHTML'] = renderStoryAssetCard(state2, storyAsset4);
      const value370 = el189['querySelector']('.story-replacement-comparison')
        ? '.story-replacement-comparison > span:last-child'
        : '.story-asset-card-media';
      ((el189['querySelector'](value370)['innerHTML'] = el191['querySelector'](value370)['innerHTML']),
        (el189['querySelector']('.story-asset-card-copy')['innerHTML'] =
          el191['querySelector']('.story-asset-card-copy')['innerHTML']));
      const el192 = el189['parentElement']['querySelector'](
          '[data-story-action="request-delete-asset-appearance"]',
        ),
        value371 = el191['querySelector']('[data-story-action="request-delete-asset-appearance"]');
      if (el192 && value371) el192['replaceWith'](value371);
      else {
        if (el192) el192['remove']();
        else {
          if (value371) el189['parentElement']['append'](value371);
        }
      }
    }
    if (value368 === state2['selectedAssetId'] && !refreshSelectedAsset()) render();
    ((state2['assetAppearanceMotion'] = ''), schedulePersistence({ uiOnly: !![] }));
  }
  function run77(event14) {
    const el193 = event14['target']['closest']?.(
      '[data-story-appearance-wheel="true"], [data-story-card-appearance-wheel]',
    );
    if (!el193 || state2['view'] !== 'project' || state2['step'] !== 0x2) return ![];
    for (
      let value372 = event14['target'];
      value372 && value372 !== el193;
      value372 = value372['parentElement']
    ) {
      if (hasWorkspaceScrollableOverflow(value372, windowObject['getComputedStyle'](value372))) return ![];
    }
    event14['preventDefault']();
    const consumeStoryWheelDirection2 = consumeStoryWheelDirection(event14, value141);
    if (consumeStoryWheelDirection2)
      run76(
        consumeStoryWheelDirection2,
        el193['dataset']['storyCardAppearanceWheel'] || state2['selectedAssetId'],
      );
    return !![];
  }
  const storyClipResultSelectionController = createStoryClipResultSelectionController({
      state: state2,
      viewport: viewportElement,
      documentObject: documentObject,
      getSelectedEpisode: getSelectedEpisode,
      getSelectedClip: getSelectedClip,
      resetAdjustmentUi: resetUi,
      applyVideoSettings: applyVideoSettings,
      refreshSelectedClip: refreshSelectedClip,
      refreshSelectedVideoResult: refreshSelectedVideoResult,
      refreshHistory: (value373) => timer?.['refresh']?.(value373),
      hideHistory: hideHistory,
      render: render,
      schedulePersistence: schedulePersistence,
    }),
    {
      deleteVideoResult: deleteVideoResult,
      handleNavigationWheel: handleNavigationWheel,
      selectVideoResult: selectVideoResult,
      switchSelectedClip: switchSelectedClip,
      switchSelectedVideoResult: switchSelectedVideoResult,
    } = storyClipResultSelectionController;
  function getConfig(el194) {
    if (!el194?.['closest']?.('.story-page')?.['classList']['contains']('is-current')) return null;
    const text37 = normalizeText(el194?.['dataset']?.['storyMarqueeSurface']);
    if (text37 === 'assets')
      return createStoryAssetMarqueeConfig(state2, {
        getVisibleAssets: getVisibleStoryAssets,
        beforeCommit: () =>
          updateStoryAssetPromptFromEditor(
            state2,
            run28()?.['querySelector']?.('[data-story-asset-prompt][contenteditable=\x22true\x22]'),
          ),
        render: () => {
          (render(), focusWorkspaceAssetCard(storyRoot, state2['selectedAssetId']));
        },
      });
    if (text37 === 'episodes')
      return {
        enabled:
          state2['view'] === 'project' &&
          state2['step'] === 0x3 &&
          !getStoryEpisodeBatchControlState(state2)['disabled'],
        selectedIds: state2['selectedEpisodeIds'],
        commit(value374) {
          ((state2['episodeSelectionMode'] = !![]), (state2['selectedEpisodeIds'] = value374), render());
        },
      };
    if (text37 === 'clips')
      return {
        enabled: state2['view'] === 'episode',
        selectedIds: state2['selectedClipGenerationIds'],
        commit(value375) {
          ((state2['pendingDeleteClipId'] = ''),
            (state2['clipSelectionMode'] = !![]),
            (state2['selectedClipGenerationIds'] = value375),
            run6(),
            run32());
        },
      };
    return null;
  }
  const storyMarqueeSelectionController = createStoryMarqueeSelectionController({
      root: storyRoot,
      documentObject: documentObject,
      windowObject: windowObject,
      getConfig: getConfig,
      onActivate: hideHoverPreview,
    }),
    value376 = [
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
  function run78(event15) {
    const enabled50 = viewportElement['querySelector']('.story-page.is-current'),
      el195 = event15?.['target'];
    if (!enabled50?.['contains'](el195) || !el195?.['closest']) return ![];
    if (el195['closest'](value376)) return ![];
    if (state2['view'] === 'project' && state2['step'] === 0x2 && state2['assetSelectionMode'])
      ((state2['assetSelectionMode'] = ![]), (state2['selectedAssetIds'] = []), render());
    else {
      if (state2['view'] === 'project' && state2['step'] === 0x3 && state2['episodeSelectionMode'])
        ((state2['episodeSelectionMode'] = ![]), (state2['selectedEpisodeIds'] = []), render());
      else {
        if (state2['view'] === 'episode' && state2['clipSelectionMode'])
          ((state2['clipSelectionMode'] = ![]), (state2['selectedClipGenerationIds'] = []), run32());
        else return ![];
      }
    }
    return (storyMarqueeSelectionController['cancel'](), !![]);
  }
  const storyWorkspaceNavigationTransaction = createStoryWorkspaceNavigationTransaction({
    state: state2,
    toolbarEl: toolbarEl,
    windowObject: windowObject,
    renderAdapter: { render: render, renderToolbar: renderToolbar, capturePageState: capturePageState2 },
    onClipSelected: prepareVideoSettings,
    onCommit: () => schedulePersistence({ uiOnly: !![] }),
    notify: showToast,
  });
  async function run55(step2, args37 = {}) {
    return storyWorkspaceNavigationTransaction['navigate']({ ...args37, view: 'project', step: step2 });
  }
  function run79(value377) {
    const storyWorkspaceStep = normalizeStoryWorkspaceStep(value377);
    if (state2['data']?.['project']?.['outlineStatus'] === 'stale' && storyWorkspaceStep > 0x1) {
      showToast('故事蓝图已修改，请先重新运行分集规划。', 'warn');
      return;
    }
    if (state2['step'] !== 0x3 && storyWorkspaceStep === 0x3) void openEpisodeStage();
    else void run55(storyWorkspaceStep);
  }
  function run80(value378) {
    return handleWorkspaceStepShortcut(value378, {
      enabled:
        enabled11 && !state2['canvasSyncPending'] && ['project', 'episode']['includes'](state2['view']),
      stepCount: STORY_STEPS['length'] + (isStoryCollaborationProject(state2['data']) ? 0x1 : 0x0),
      navigate: (value379) => run79(value379 - (isStoryCollaborationProject(state2['data']) ? 0x1 : 0x0)),
    });
  }
  async function run54(episodeId4, clipId3 = '', el196 = null) {
    const value380 = el196?.['disabled'] === !![];
    (el196?.['classList']?.['add']('is-opening'), syncStoryAsyncButton(el196, !![]));
    if (el196 && 'disabled' in el196) el196['disabled'] = !![];
    try {
      return (
        hasPendingRuntimeManifestLoad() && (await waitForRuntimeManifestLoad({ timeoutMs: 0x1f4 })),
        storyWorkspaceNavigationTransaction['navigate']({
          view: 'episode',
          episodeId: episodeId4,
          clipId: clipId3,
        })
      );
    } finally {
      (el196?.['classList']?.['remove']('is-opening'), syncStoryAsyncButton(el196, ![]));
      if (el196 && 'disabled' in el196) el196['disabled'] = value380;
    }
  }
  function run81(el197) {
    const enabled51 = el197['dataset']['storyModelKind'],
      enabled52 = el197['dataset']['storyModelOption'];
    if (!enabled51 || !enabled52) return;
    ((state2['models'][enabled51] = resolveStoryWorkspaceModelId(enabled51, enabled52)),
      schedulePersistence(),
      render());
  }
  function resolveItems(event16) {
    return resolveStoryWorkspaceContextMenuItems({
      event: event16,
      root: storyRoot,
      projects: state2['projects'],
      state: state2,
      libraryAssets: getVisibleStoryAssets(state2),
      getTabLabel: getStoryAssetTabLabel,
      commands: {
        addLibraryAudioAssets: (list30) => {
          if (
            !addStoryLibraryAudioToProject(
              state2,
              getVisibleStoryAssets(state2)['filter']((value381) => list30['includes'](value381['id'])),
            )
          )
            return;
          (syncCurrentProjectEntry(), schedulePersistence({ immediate: !![] }), render());
        },
        bindAudioCharacter: (value382, value383) => {
          const visibleStoryAssets3 = getVisibleStoryAssets(state2)['find'](
            (value384) => value384['id'] === value382,
          );
          if (
            !visibleStoryAssets3 ||
            !bindStoryAudioToCharacter(state2['data'], visibleStoryAssets3, value383)
          )
            return;
          (syncCurrentProjectEntry(), schedulePersistence({ immediate: !![] }), render());
        },
        addLibraryAssets: (value385, value386, value387, value388) =>
          run75(value386, value387, value388, value385),
        openProject: openProject2,
        renameProject(value389) {
          ((state2['openProjectMenuId'] = ''), render(), focusProjectTitle(value389));
        },
        duplicateProject: duplicateProject,
        collectProject: (value390) => void collectStoredProject(value390),
        setProjectArchived: setProjectArchived,
        requestDeleteProject(value391) {
          ((state2['openProjectMenuId'] = ''), (state2['pendingDeleteProjectId'] = value391), render());
        },
      },
    });
  }
  windowObject?.['addEventListener']?.('keydown', run80, !![]);
  const run82 = bindWorkspaceEntityContextMenu(storyRoot, {
    resolveItems: resolveItems,
    beforeOpen() {
      if (!state2['openProjectMenuId']) return;
      ((state2['openProjectMenuId'] = ''), render());
    },
  });
  (windowObject?.['addEventListener']?.('pointermove', handleWindowPointerMove, !![]),
    windowObject?.['addEventListener']?.('pointerup', handleWindowPointerUp, !![]),
    windowObject?.['addEventListener']?.('pointercancel', handleWindowPointerCancel, !![]),
    storyRoot['addEventListener']('pointerdown', (event17) => {
      (event17['stopPropagation'](), hideHoverPreview());
      !event17['target']['closest']?.('[data-story-clip-video-history-menu]') && hideHistory();
      if (begin(event17)) return;
      storyMarqueeSelectionController['begin'](event17);
    }),
    storyRoot['addEventListener']('pointerover', (event18) => {
      const value392 = event18['target']['closest']?.('[data-story-library-appearance-target]');
      value392 &&
        !(event18['relatedTarget'] && value392['contains'](event18['relatedTarget'])) &&
        handler2(value392);
      const value393 = event18['target']['closest']?.(
        '.story-clip-card-shell[data-story-video-history=\x22true\x22]',
      );
      value393 &&
        storyRoot['contains'](value393) &&
        !(event18['relatedTarget'] && value393['contains'](event18['relatedTarget'])) &&
        run11(value393, event18);
      const storyAssetHoverCard = getStoryAssetHoverCard(event18['target']);
      if (!storyAssetHoverCard || !storyRoot['contains'](storyAssetHoverCard)) return;
      if (event18['relatedTarget'] && storyAssetHoverCard['contains'](event18['relatedTarget'])) return;
      run9(storyAssetHoverCard, event18);
    }),
    storyRoot['addEventListener']('focusin', (event19) => {
      const value394 = event19['target']['closest']?.('[data-story-library-appearance-target]');
      if (value394) handler2(value394);
    }),
    storyRoot['addEventListener']('pointermove', (event20) => {
      if (storyMarqueeSelectionController['update'](event20)) return;
      const storyAssetHoverCard2 = getStoryAssetHoverCard(event20['target']);
      if (!storyAssetHoverCard2) {
        storyAssetHoverPreviewController['getHoveredAssetId']() && hideHoverPreview();
        return;
      }
      run9(storyAssetHoverCard2, event20);
    }),
    storyRoot['addEventListener']('pointerup', (value395) => {
      storyMarqueeSelectionController['finish'](value395);
    }),
    storyRoot['addEventListener']('pointercancel', (value396) => {
      storyMarqueeSelectionController['finish'](value396, { cancelled: !![] });
    }),
    storyRoot['addEventListener']('lostpointercapture', (value397) => {
      if (finish(value397, { cancelled: !![] })) return;
      (map7['cancelSession'](), storyMarqueeSelectionController['finish'](value397, { cancelled: !![] }));
    }),
    storyRoot['addEventListener']('dragstart', (event21) => {
      const el198 = event21['target']['closest']?.('article[data-story-replication-episode-id]');
      if (el198) {
        if (!event21['target']['closest']?.('[data-story-replication-drag-handle]')) {
          event21['preventDefault']();
          return;
        }
        text16 = normalizeText(el198['dataset']['storyReplicationEpisodeId']);
        if (!text16) {
          event21['preventDefault']();
          return;
        }
        ((list18 = [
          ...(el198['closest']('[data-story-replication-grid]')?.['querySelectorAll'](
            'article[data-story-replication-episode-id]',
          ) || []),
        ]['map']((el199) => normalizeText(el199['dataset']['storyReplicationEpisodeId']))),
          event21['dataTransfer']?.['setData']?.('application/x-story-replication-episode', text16));
        if (event21['dataTransfer']) event21['dataTransfer']['effectAllowed'] = 'move';
        (setReplicationCardDragImage(event21, el198),
          el198['classList']['add']('is-reordering'),
          el198['closest']('[data-story-replication-grid]')?.['classList']['add']('is-reordering'));
        return;
      }
      const el200 = event21['target']['closest']?.('[data-story-reference-asset]');
      if (el200) {
        if (map7['hasSession']()) {
          event21['preventDefault']();
          return;
        }
        const text38 = normalizeText(el200['dataset']['storyReferenceAsset']),
          value398 = Math['max'](
            0x0,
            Math['trunc'](Number(el200['dataset']['storyReferenceAssetIndex']) || 0x0),
          );
        if (!writeStoryAssetDragData(event21['dataTransfer'], text38, value398)) return;
        (applyStoryAssetNativeDragPreview(event21['dataTransfer'], el200),
          (value138 = text38),
          (value140 = value398),
          el200['classList']['add']('is-story-asset-dragging'),
          hideHoverPreview());
        return;
      }
      if (event21['target']['closest']?.('[data-story-marquee-item]')) event21['preventDefault']();
    }),
    storyRoot['addEventListener']('dragend', () => {
      if (text16) {
        const el201 = storyRoot['querySelector']('[data-story-replication-grid]');
        settleReplicationCardMotion(el201);
        if (el201 && list18['length']) {
          const map10 = new Map(
            [...el201['querySelectorAll']('article[data-story-replication-episode-id]')]['map']((el202) => [
              normalizeText(el202['dataset']['storyReplicationEpisodeId']),
              el202,
            ]),
          );
          list18['forEach']((value399) => {
            const value400 = map10['get'](value399);
            if (value400) el201['appendChild'](value400);
          });
        }
        (storyRoot['querySelectorAll']('.story-replication-card.is-reordering')['forEach']((el203) =>
          el203['classList']['remove']('is-reordering'),
        ),
          storyRoot['querySelector']('[data-story-replication-grid]')?.['classList']['remove'](
            'is-reordering',
          ),
          (text16 = ''),
          (list18 = []));
      }
      run18();
    }),
    storyRoot['addEventListener']('keydown', (event22) => {
      const el204 = event22['target']['closest']?.('[data-story-replication-drag-handle]');
      if (!el204 || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']['includes'](event22['key'])) return;
      const el205 = el204['closest']('article[data-story-replication-episode-id]'),
        text39 = normalizeText(el205?.['dataset']['storyReplicationEpisodeId']),
        count14 = state2['data']['episodes']['findIndex'](
          (value401) => normalizeText(value401?.['id']) === text39,
        ),
        count15 = ['ArrowUp', 'ArrowLeft']['includes'](event22['key']) ? -0x1 : 0x1,
        count16 = count14 + count15;
      if (count14 < 0x0 || count16 < 0x0 || count16 >= state2['data']['episodes']['length']) return;
      (event22['preventDefault'](), event22['stopPropagation']());
      const value402 = state2['data']['episodes']['map']((value403) => value403['id']);
      (([value402[count14], value402[count16]] = [value402[count16], value402[count14]]),
        (state2['data']['episodes'] = reorderStoryVideoReplicationEpisodes(
          state2['data']['episodes'],
          value402,
        )),
        syncStoryVideoReplicationProject(state2['data']));
      const el206 = el205['closest']('[data-story-replication-grid]'),
        value404 = [...(el206?.['querySelectorAll']('article[data-story-replication-episode-id]') || [])][
          'find'
        ]((el207) => normalizeText(el207['dataset']['storyReplicationEpisodeId']) === value402[count14]);
      (el206 &&
        value404 &&
        (el206['insertBefore'](el205, count15 < 0x0 ? value404 : value404['nextSibling']),
        state2['data']['episodes']['forEach']((value405, value406) => {
          const value407 = [...el206['querySelectorAll']('article[data-story-replication-episode-id]')][
            'find'
          ]((el208) => normalizeText(el208['dataset']['storyReplicationEpisodeId']) === value405['id']);
          syncStoryVideoReplicationCardElement(value407, value405, value406);
        }),
        el205['querySelector']('[data-story-replication-drag-handle]')?.['focus']()),
        schedulePersistence({ immediate: !![] }));
    }),
    storyRoot['addEventListener']('pointerout', (event23) => {
      const value408 = event23['target']['closest']?.(
        '.story-clip-card-shell[data-story-video-history="true"]',
      );
      value408 &&
        !(event23['relatedTarget'] && value408['contains'](event23['relatedTarget'])) &&
        !menuElement?.['contains'](event23['relatedTarget']) &&
        hideHistory({ delayed: !![] });
      const storyAssetHoverCard3 = getStoryAssetHoverCard(event23['target']);
      if (
        !storyAssetHoverCard3 ||
        getStoryAssetHoverCardId(storyAssetHoverCard3) !==
          storyAssetHoverPreviewController['getHoveredAssetId']()
      )
        return;
      if (event23['relatedTarget'] && storyAssetHoverCard3['contains'](event23['relatedTarget'])) return;
      hideHoverPreview();
    }),
    storyRoot['addEventListener']('dblclick', (event24) => {
      event24['stopPropagation']();
      const alt3 = event24['target']['closest']?.('img.story-asset-preview');
      if (!alt3 || !storyRoot['contains'](alt3)) return;
      const value409 = alt3['closest']('[data-story-asset-detail-layout]')
          ? findStoryAsset(state2, state2['selectedAssetId'])
          : null,
        value410 = value409 ? getSelectedAssetAppearance(state2, value409) : null,
        value411 =
          (value410 && resolveStoryAssetAppearanceOriginalUrl(value410)) ||
          normalizeText(alt3['currentSrc'] || alt3['getAttribute']('src'));
      if (!isUsableImageUrl(value411)) return;
      (event24['preventDefault'](), openImagePreview(value411, { alt: alt3['alt'] || '素材图片预览' }));
    }),
    storyRoot['addEventListener'](
      'wheel',
      (event25) => {
        event25['stopPropagation']();
        if (run77(event25)) return;
        if (handleNavigationWheel(event25)) return;
        if (scrollStoryClipPromptHistoryWithWheel(event25)) return;
        if (scrollStoryClipStripWithWheel(event25)) return;
        if (shouldPreserveStoryWorkspaceNestedWheel(event25['target'])) return;
        const enabled53 = viewportElement['querySelector']('.story-page.is-current');
        if (!enabled53) return;
        (event25['preventDefault'](),
          (enabled53['scrollTop'] += Number(event25['deltaY'] || 0x0)),
          (enabled53['scrollLeft'] += Number(event25['deltaX'] || 0x0)));
      },
      { passive: ![] },
    ),
    viewportElement['addEventListener'](
      'scroll',
      (event26) => {
        const enabled54 = event26['target'];
        if (!enabled11 || !enabled54?.['matches']?.('.story-page.is-current')) return;
        const value412 = value132 || run27();
        ((state2['pageScrollPositions'] = {
          ...(state2['pageScrollPositions'] || {}),
          [value412]: {
            top: Math['max'](0x0, Number(enabled54['scrollTop']) || 0x0),
            left: Math['max'](0x0, Number(enabled54['scrollLeft']) || 0x0),
          },
        }),
          schedulePersistence({ uiOnly: !![] }));
      },
      !![],
    ),
    storyRoot['addEventListener']('keydown', (event27) => {
      const value413 = event27['target']['closest']?.('[data-story-custom-episode-count-input]');
      if (value413) {
        if (event27['key'] === 'Enter')
          (event27['preventDefault'](), event27['stopPropagation'](), run47(value413));
        else
          event27['key'] === 'Escape' &&
            (event27['preventDefault'](),
            event27['stopPropagation'](),
            run48(
              value413,
              normalizeStoryEpisodeCount(state2['data']['project']?.['planning']?.['episodeCount']),
            ));
        return;
      }
      const el209 = event27['target']['closest']?.('[data-story-action=\x22toggle-clip-adjustment-mode\x22]');
      if (el209 && ['ArrowDown', 'ArrowUp']['includes'](event27['key'])) {
        (event27['preventDefault'](), event27['stopPropagation']());
        const kind =
          el209['closest']('[data-story-adjustment-kind]')?.['dataset']['storyAdjustmentKind'] || 'mode';
        ((state2[kind === 'language' ? 'clipAdjustmentLanguageOpen' : 'clipAdjustmentPromptModeOpen'] = !![]),
          (state2[kind === 'language' ? 'clipAdjustmentPromptModeOpen' : 'clipAdjustmentLanguageOpen'] = ![]),
          run31({ kind: kind === 'language' ? 'mode' : 'language' }),
          run31({ kind: kind, focus: 'selected' }));
        return;
      }
      const el210 = event27['target']['closest']?.('[data-story-clip-adjustment-mode-option]');
      if (el210 && ['ArrowDown', 'ArrowUp', 'Home', 'End']['includes'](event27['key'])) {
        const el211 = el210['closest']('[role=listbox]'),
          list31 = [...(el211?.['querySelectorAll']('[data-story-clip-adjustment-mode-option]') || [])],
          value414 = Math['max'](0x0, list31['indexOf'](el210)),
          value415 =
            event27['key'] === 'Home'
              ? 0x0
              : event27['key'] === 'End'
                ? list31['length'] - 0x1
                : (value414 + (event27['key'] === 'ArrowDown' ? 0x1 : -0x1) + list31['length']) %
                  list31['length'];
        (event27['preventDefault'](), event27['stopPropagation'](), list31[value415]?.['focus']());
        return;
      }
      if (
        event27['key'] === 'Enter' &&
        event27['target']['matches']?.('[data-story-clip-adjustment-instruction]')
      ) {
        (event27['preventDefault'](), event27['stopPropagation'](), void generateCandidate());
        return;
      }
      if (run42(event27)) return;
      if (run80(event27)) return;
      if (event27['key'] === 'Escape') {
        if (state2['clipPromptHistoryOpen']) {
          (event27['preventDefault'](),
            event27['stopPropagation'](),
            (state2['clipPromptHistoryOpen'] = ![]),
            run30({ focus: 'trigger' }));
          return;
        }
        if (state2['clipAdjustmentPromptModeOpen'] || state2['clipAdjustmentLanguageOpen']) {
          (event27['preventDefault'](), event27['stopPropagation']());
          const kind2 = state2['clipAdjustmentLanguageOpen'] ? 'language' : 'mode';
          ((state2['clipAdjustmentPromptModeOpen'] = state2['clipAdjustmentLanguageOpen'] = ![]),
            run31({ kind: kind2, focus: 'trigger' }));
          return;
        }
        (storyMarqueeSelectionController['cancel'](),
          run33(),
          run34(),
          run35(),
          run6(),
          state2['view'] === 'project' &&
            state2['step'] === 0x2 &&
            ((state2['assetSelectionMode'] = ![]), (state2['selectedAssetIds'] = []), render()),
          state2['clipSelectionMode'] &&
            ((state2['clipSelectionMode'] = ![]), (state2['selectedClipGenerationIds'] = []), run32()),
          (state2['episodeSelectionMode'] || state2['scriptSelectionMode']) &&
            ((state2['episodeSelectionMode'] = state2['scriptSelectionMode'] = ![]),
            (state2['selectedEpisodeIds'] = []),
            (state2['selectedScriptEpisodeIds'] = []),
            render()));
      }
      const el212 = event27['target']['closest']?.(
        '[data-story-appearance-wheel="true"], [data-story-card-appearance-wheel]',
      );
      if (el212 && ['ArrowLeft', 'ArrowRight']['includes'](event27['key'])) {
        (event27['preventDefault'](),
          event27['stopPropagation'](),
          run76(
            event27['key'] === 'ArrowRight' ? 0x1 : -0x1,
            el212['dataset']['storyCardAppearanceWheel'] || state2['selectedAssetId'],
          ));
        return;
      }
      const value416 = event27['target']['closest']?.('[data-story-clip-navigation="true"]');
      if (value416 && ['ArrowLeft', 'ArrowRight']['includes'](event27['key'])) {
        (event27['preventDefault'](),
          event27['stopPropagation'](),
          switchSelectedClip(event27['key'] === 'ArrowRight' ? 0x1 : -0x1));
        return;
      }
      if (storyAssetLayoutResizeController['handleKeyDown'](event27)) return;
      const el213 = event27['target']['closest']?.('[data-story-episode-splitter]');
      if (el213 && ['ArrowLeft', 'ArrowRight']['includes'](event27['key'])) {
        (event27['preventDefault'](), event27['stopPropagation']());
        const value417 = event27['key'] === 'ArrowLeft' ? -0x2 : 0x2;
        el213['dataset']['storyEpisodeSplitter'] === 'assets'
          ? run12(state2['episodeAssetPanelRatio'] + value417, state2['episodeEditorPanelRatio'], {
              persist: !![],
            })
          : run12(state2['episodeAssetPanelRatio'], state2['episodeEditorPanelRatio'] + value417, {
              persist: !![],
            });
        return;
      }
      if (!enabled11 || state2['view'] !== 'home') return;
      if (!isStoryGenerateShortcut(event27)) return;
      (event27['preventDefault'](), event27['stopPropagation']());
      if (state2['homeTab'] === 'collaborate') collaboration['start']();
      else void generateFromHome();
    }),
    storyRoot['addEventListener'](
      'toggle',
      (event28) => {
        const el214 = event28['target'];
        if (!el214?.['matches']?.('details[data-story-outline-section]')) return;
        const value418 = el214['dataset']['storyOutlineSection'];
        ((state2['outlineSectionOpenState'] = {
          ...(state2['outlineSectionOpenState'] || {}),
          [value418]: el214['open'],
        }),
          schedulePersistence({ uiOnly: !![] }));
        if (!el214['open']) return;
        if (!state2['scriptGenerationFocusMode'] || !['original', 'summary']['includes'](value418)) return;
        if (
          ['writing-episode-script', 'writing-episode-scripts']['includes'](state2['storyPlanningOperation'])
        )
          return;
        state2['scriptGenerationFocusMode'] = ![];
      },
      !![],
    ),
    storyRoot['addEventListener']('error', handleStoryWorkspaceImageError, !![]),
    storyRoot['addEventListener']('click', (toggleKey) => {
      if (storyMarqueeSelectionController['consumeClick'](toggleKey)) return;
      if (run78(toggleKey)) return;
      const el215 = storyRoot['querySelector']('[data-story-custom-episode-count-input]'),
        text40 =
          normalizeText(el215?.['value']) ||
          el215?.['closest']('.story-episode-count-custom-editor')?.['classList']['contains']('is-selected');
      if (
        el215 &&
        text40 &&
        toggleKey['target']['closest']('[data-story-action="generate-story"]') &&
        !run47(el215)
      ) {
        toggleKey['preventDefault']();
        return;
      }
      state2['openProjectMenuId'] &&
        !toggleKey['target']['closest']('[data-story-project-menu-wrap]') &&
        run37('');
      if (!toggleKey['target']['closest']('[data-story-project-sort-wrap]')) run38();
      if (!toggleKey['target']['closest']('.story-home-param-picker')) run34();
      !toggleKey['target']['closest'](
        '.story-asset-batch-menu-wrap, [data-story-library-target-menu], [data-story-library-appearance-menu]',
      ) && run35();
      if (!toggleKey['target']['closest']('.story-canvas-sync-menu-wrap')) run6();
      !toggleKey['target']['closest']('.story-character-voice-history-wrap') && run36();
      const el216 = toggleKey['target']['closest']('[data-story-select-script-episode]');
      if (
        el216 &&
        (state2['scriptSelectionMode'] ||
          toggleKey['shiftKey'] ||
          toggleKey['ctrlKey'] ||
          toggleKey['metaKey']) &&
        !toggleKey['target']['closest']('[data-story-action]')
      ) {
        (toggleKey['preventDefault'](),
          (state2['scriptSelectionMode'] = !![]),
          run66(el216['dataset']['storySelectScriptEpisode']));
        return;
      }
      const el217 = toggleKey['target']['closest']('[data-story-home-param-trigger]');
      if (el217) {
        const el218 = el217['closest']('.story-home-param-picker'),
          value419 = !el218['classList']['contains']('is-open');
        (run33(),
          run34(el218),
          el218['classList']['toggle']('is-open', value419),
          el217['setAttribute']('aria-expanded', String(value419)),
          value419 && fitStoryParamPopoverToViewport(el218));
        return;
      }
      const el219 = toggleKey['target']['closest']('[data-story-asset-preset-option]');
      if (el219) {
        el219['dataset']['storyAssetPresetKind'] === 'scene'
          ? (state2['sceneAssetPromptPresetId'] = getStorySceneAssetPromptPreset(
              el219['dataset']['storyAssetPresetOption'],
            )['id'])
          : (state2['assetPromptPresetId'] = getStoryCharacterAssetPromptPreset(
              el219['dataset']['storyAssetPresetOption'],
            )['id']);
        (run34(), render());
        return;
      }
      const el220 = toggleKey['target']['closest']('[data-story-aspect-ratio-option]');
      if (el220) {
        run45(el220['dataset']['storyAspectRatioOption']);
        return;
      }
      const el221 = toggleKey['target']['closest']('[data-story-planning-option]');
      if (el221) {
        run46(el221['dataset']['storyPlanningField'], el221['dataset']['storyPlanningOption']);
        return;
      }
      const el222 = toggleKey['target']['closest']('[data-story-style-option]');
      if (el222) {
        run50(el222['dataset']['storyStyleOption']);
        return;
      }
      const el223 = toggleKey['target']['closest']('[data-story-style-category]');
      if (el223) {
        const el224 = el223['closest']('.story-style-picker');
        (el224?.['querySelectorAll']('[data-story-style-category]')['forEach']((el225) => {
          const value420 = el225 === el223;
          (el225['classList']['toggle']('is-active', value420),
            el225['setAttribute']('aria-pressed', String(value420)));
        }),
          run44(el224));
        return;
      }
      const el226 = toggleKey['target']['closest']('[data-story-style-custom]');
      if (el226) {
        run43(el226['closest']('.story-style-picker'), !![]);
        return;
      }
      const el227 = toggleKey['target']['closest']('[data-story-style-custom-back]');
      if (el227) {
        run43(el227['closest']('.story-style-picker'), ![]);
        return;
      }
      const el228 = toggleKey['target']['closest']('[data-story-style-custom-confirm]');
      if (el228) {
        run51(el228['closest']('.story-style-picker')?.['querySelector']('[data-story-style-custom-input]'));
        return;
      }
      const value421 = toggleKey['target']['closest']('[data-story-model-option]');
      if (value421) {
        run81(value421);
        return;
      }
      const el229 = toggleKey['target']['closest']('[data-story-model-trigger]');
      if (el229) {
        const el230 = el229['closest']('.story-model-picker'),
          value422 = !el230['classList']['contains']('is-open');
        (run34(),
          run33(el230),
          el230['classList']['toggle']('is-open', value422),
          el229['setAttribute']('aria-expanded', String(value422)));
        if (value422) el230['querySelector']('[data-story-model-search-input]')?.['focus']();
        return;
      }
      const el231 = toggleKey['target']['closest']('[data-story-home-tab]');
      if (el231) {
        switchTab(el231['dataset']['storyHomeTab']);
        return;
      }
      const el232 = toggleKey['target']['closest']('[data-story-step]');
      if (el232) {
        run79(el232['dataset']['storyStep']);
        return;
      }
      if (state2['assetLibraryDisclosure']?.['toggleFromTarget'](toggleKey['target'])) return;
      const el233 = toggleKey['target']['closest']('[data-story-asset-filter]');
      if (el233) {
        const text41 = normalizeText(el233['dataset']['storyAssetFilter']),
          direction3 = getStoryAssetTabTransitionDirection(state2['assetFilter'], text41);
        if (direction3 === 'none') return;
        ((state2['characterVoiceEditor'] = null),
          (state2['characterVoicePanelMotion'] = ''),
          (state2['pendingCharacterVoiceAssetId'] = ''),
          (state2['assetFilter'] = text41),
          (state2['selectedAssetId'] = ''),
          (state2['pendingDeleteAssetAppearanceKey'] = ''),
          (state2['assetSelectionMode'] = ![]),
          (state2['selectedAssetIds'] = []));
        const el234 = run28()?.['querySelector']('.story-asset-tabs');
        el234 &&
          el234['querySelectorAll']('[data-story-asset-filter]')['forEach']((el235) => {
            const value423 = el235['dataset']['storyAssetFilter'] === text41;
            (el235['classList']['toggle']('is-active', value423),
              el235['setAttribute']('aria-selected', String(value423)),
              (el235['tabIndex'] = value423 ? 0x0 : -0x1));
          });
        (render({ direction: direction3, updateToolbar: ![], transitionScope: 'asset-content' }),
          schedulePersistence({ uiOnly: !![] }));
        return;
      }
      const el236 = toggleKey['target']['closest']('[data-story-episode-asset-tab]');
      if (el236) {
        state2['episodeAssetRailTab'] = normalizeStoryEpisodeAssetRailTab(
          el236['dataset']['storyEpisodeAssetTab'],
        );
        if (!syncFrameRail()) render();
        schedulePersistence({ uiOnly: !![] });
        return;
      }
      const el237 = toggleKey['target']['closest']('[data-story-asset-id]');
      if (el237) {
        const itemId = el237['dataset']['storyAssetId'],
          activeItemId = state2['selectedAssetId'],
          value424 = state2['selectedAssetId'] !== itemId;
        value424 &&
          (updateStoryAssetPromptFromEditor(
            state2,
            run28()?.['querySelector']?.('[data-story-asset-prompt][contenteditable="true"]'),
          ),
          stopPreview(),
          (state2['characterVoiceEditor'] = null),
          (state2['characterVoicePanelMotion'] = ''),
          (state2['pendingCharacterVoiceAssetId'] = ''),
          (state2['pendingDeleteAssetAppearanceKey'] = ''));
        state2['selectedAssetId'] = itemId;
        {
          const value425 =
              state2['assetFilter'] === 'library'
                ? getVisibleStoryAssets(state2)['find']((value426) => value426['id'] === itemId)
                : null,
            enabled55 =
              state2['assetFilter'] !== 'library' ||
              Boolean(
                ['image', 'audio']['includes'](normalizeText(value425?.['mediaKind'])['toLowerCase']()) &&
                normalizeText(value425?.['sourceUrl'] || value425?.['imageUrl']),
              ),
            workspaceCardMultiSelection = resolveWorkspaceCardMultiSelection({
              selectedIds: state2['selectedAssetIds'],
              itemId: itemId,
              activeItemId: activeItemId,
              orderedIds:
                state2['assetFilter'] === 'library'
                  ? getWorkspaceAssetLibrarySelectionOrder(
                      getVisibleStoryAssets(state2)['filter'](
                        (value427) =>
                          ['image', 'audio']['includes'](
                            normalizeText(value427['mediaKind'])['toLowerCase'](),
                          ) && normalizeText(value427['sourceUrl'] || value427['imageUrl']),
                      ),
                      state2['assetLibraryDisclosure'],
                    )
                  : getVisibleStoryAssets(state2)['map']((value428) => value428['id']),
              toggleKey: toggleKey['ctrlKey'] || toggleKey['metaKey'],
              selectionMode: state2['assetSelectionMode'],
              shiftKey: toggleKey['shiftKey'] === !![],
              enabled: enabled55,
            });
          workspaceCardMultiSelection['handled'] &&
            ((state2['assetSelectionMode'] = workspaceCardMultiSelection['selectionMode']),
            (state2['selectedAssetIds'] = workspaceCardMultiSelection['selectedIds']));
        }
        (render(), schedulePersistence({ uiOnly: !![] }), focusWorkspaceAssetCard(storyRoot, itemId));
        return;
      }
      const el238 = toggleKey['target']['closest']('[data-story-select-episode]');
      if (
        el238 &&
        !toggleKey['target']['closest']('[data-story-action]') &&
        (state2['episodeSelectionMode'] ||
          toggleKey['shiftKey'] ||
          toggleKey['ctrlKey'] ||
          toggleKey['metaKey'])
      ) {
        const itemId2 = el238['dataset']['storySelectEpisode'];
        if (getStoryEpisodeGenerationControlState(state2, itemId2)['disabled']) return;
        const workspaceCardMultiSelection2 = resolveWorkspaceCardMultiSelection({
          selectedIds: state2['selectedEpisodeIds'],
          itemId: itemId2,
          activeItemId: state2['selectedEpisodeId'],
          selectionMode: state2['episodeSelectionMode'],
          shiftKey: toggleKey['shiftKey'] === !![],
          toggleKey: toggleKey['ctrlKey'] || toggleKey['metaKey'],
          orderedIds: getStoryVideoEpisodes(state2['data']['episodes'])['map']((value429) => value429['id']),
        });
        if (workspaceCardMultiSelection2['handled']) {
          ((state2['episodeSelectionMode'] = workspaceCardMultiSelection2['selectionMode']),
            (state2['selectedEpisodeIds'] = workspaceCardMultiSelection2['selectedIds']));
          if (!toggleKey['shiftKey']) state2['selectedEpisodeId'] = itemId2;
          (render(),
            storyRoot['querySelector']('[data-story-select-episode="' + CSS['escape'](itemId2) + '\x22]')?.[
              'focus'
            ]());
        }
        return;
      }
      const el239 = toggleKey['target']['closest']('[data-story-open-episode]');
      if (el239) {
        const value430 = el239['dataset']['storyOpenEpisode'];
        if (getStoryEpisodeGenerationControlState(state2, value430)['disabled']) return;
        void run54(value430, '', el239);
        return;
      }
      const el240 = toggleKey['target']['closest']('[data-story-insert-after-clip-id]');
      if (el240) {
        if (state2['clipSelectionMode']) return;
        const promptMode = getSelectedEpisode(state2),
          insertStoryEpisodeClip2 = insertStoryEpisodeClip(
            promptMode,
            el240['dataset']['storyInsertAfterClipId'],
            {
              promptMode:
                promptMode?.['promptMode'] || state2['data']['project']?.['planning']?.['promptMode'],
            },
          ),
          count17 = state2['data']['episodes']['findIndex'](
            (value431) => value431['id'] === promptMode?.['id'],
          );
        if (!insertStoryEpisodeClip2 || count17 < 0x0) {
          showToast('新增片段失败，请刷新后重试。', 'error');
          return;
        }
        ((state2['data']['episodes'][count17] = insertStoryEpisodeClip2['episode']),
          resetUi({ close: !![] }),
          (state2['selectedClipId'] = insertStoryEpisodeClip2['clip']['id']),
          (state2['pendingDeleteClipId'] = ''),
          (state2['selectedClipGenerationIds'] = []),
          applyVideoSettings(insertStoryEpisodeClip2['clip']),
          schedulePersistence({ immediate: !![] }),
          render(),
          showToast('已新增片段。', 'success'));
        return;
      }
      const el241 = toggleKey['target']['closest']('.story-clip-card[data-story-clip-id]');
      if (el241) {
        const itemId3 = el241['dataset']['storyClipId'],
          workspaceCardMultiSelection3 = resolveWorkspaceCardMultiSelection({
            selectedIds: state2['selectedClipGenerationIds'],
            itemId: itemId3,
            activeItemId: state2['selectedClipId'],
            selectionMode: state2['clipSelectionMode'],
            shiftKey: toggleKey['shiftKey'] === !![],
            toggleKey: toggleKey['ctrlKey'] || toggleKey['metaKey'],
            orderedIds: (getSelectedEpisode(state2)?.['clips'] || [])['map']((value432) => value432['id']),
          });
        workspaceCardMultiSelection3['handled'] &&
          ((state2['pendingDeleteClipId'] = ''),
          (state2['clipSelectionMode'] = workspaceCardMultiSelection3['selectionMode']),
          (state2['selectedClipGenerationIds'] = workspaceCardMultiSelection3['selectedIds']),
          run6(),
          run32());
        if (!toggleKey['shiftKey'] && !toggleKey['ctrlKey'] && !toggleKey['metaKey']) {
          const selectedEpisode9 = getSelectedEpisode(state2),
            list32 = Array['isArray'](selectedEpisode9?.['clips']) ? selectedEpisode9['clips'] : [],
            value433 = list32['findIndex']((value434) => value434['id'] === state2['selectedClipId']),
            count18 = list32['findIndex']((value435) => value435['id'] === itemId3),
            value436 = state2['selectedClipId'] !== itemId3,
            value437 = count18 >= 0x0 && count18 < value433 ? 'previous' : 'next';
          state2['pendingDeleteClipId'] = '';
          if (value436) resetUi({ close: !![] });
          ((state2['selectedClipId'] = itemId3),
            applyVideoSettings(getSelectedClip(state2, selectedEpisode9)));
          if (value436) {
            if (!refreshSelectedClip(value437)) render();
          } else run32();
          schedulePersistence({ uiOnly: !![] });
        }
        storyRoot['querySelector'](
          '.story-clip-card[data-story-clip-id="' + CSS['escape'](itemId3) + '\x22]',
        )?.['focus']({ preventScroll: !![] });
        return;
      }
      const el242 = toggleKey['target']['closest']('[data-story-clip-prompt-surface]\x20.ref-thumb-delete');
      if (el242) {
        const kind3 = el242['closest']('[data-slot]');
        if (!kind3) return;
        updateSelectedInput({
          kind: kind3['dataset']['kind'],
          slotId: kind3['dataset']['slot'],
          value: null,
        });
        return;
      }
      const slotId = toggleKey['target']['closest'](
        '[data-story-clip-prompt-surface] .ref-upload-slot[data-slot]',
      );
      if (slotId) {
        const kind4 = slotId['dataset']['kind'],
          projectToken2 = createProjectToken(state2),
          episodeId5 = getSelectedEpisode(state2),
          clipId4 = getSelectedClip(state2, episodeId5);
        ((state2['pendingClipInput'] = { kind: kind4, slotId: slotId['dataset']['slot'] }),
          (value137 = {
            ...state2['pendingClipInput'],
            projectToken: projectToken2,
            episodeId: episodeId5?.['id'],
            clipId: clipId4?.['id'],
          }),
          (el14['accept'] = kind4 === 'image' ? 'image/*' : kind4 === 'audio' ? 'audio/*' : 'video/*'),
          el14['click']());
        return;
      }
      const value438 = toggleKey['target']['closest'](
        '[data-story-clip-prompt-surface]\x20.prompt-attachment-btn',
      );
      if (value438) {
        const episodeId6 = getSelectedEpisode(state2),
          inputs = getSelectedClip(state2, episodeId6),
          storyClipInputSlotViewModel = buildStoryClipInputSlotViewModel({
            modelId: state2['models']['video'],
            provider: state2['videoProvider'],
            inputs: inputs?.['inputs'],
          }),
          list33 = storyClipInputSlotViewModel['groups']
            ['filter']((value439) => value439['slots']['some']((enabled56) => !enabled56['input']?.['url']))
            ['map']((value440) => value440['kind']);
        if (!list33['length']) {
          showToast('当前视频模型的入参槽已满。', 'warn');
          return;
        }
        const projectToken3 = createProjectToken(state2);
        ((state2['pendingClipInput'] = { kind: '', slotId: '' }),
          (value137 = {
            ...state2['pendingClipInput'],
            projectToken: projectToken3,
            episodeId: episodeId6?.['id'],
            clipId: inputs?.['id'],
          }),
          (el14['accept'] = list33['map']((value441) => value441 + '/*')['join'](',')),
          el14['click']());
        return;
      }
      const value442 = toggleKey['target']['closest']('[data-story-script-mode]');
      if (value442) {
        selectScriptMode(getNextStoryScriptMode(state2['scriptMode']));
        return;
      }
      const el243 = toggleKey['target']['closest']('[data-story-asset-batch-mode]');
      if (el243) {
        (run35(), void generate(el243['dataset']['storyAssetBatchMode']));
        return;
      }
      const el244 = toggleKey['target']['closest']('[data-story-library-target-asset-id]');
      if (el244) {
        run75(
          el244['dataset']['storyLibraryTargetAssetId'],
          el244['dataset']['storyLibraryTargetAppearanceId'],
          el244['dataset']['storyLibraryTargetCreateAppearance'] === 'true',
        );
        return;
      }
      const value443 = toggleKey['target']['closest']('[data-story-library-appearance-target]');
      if (value443) {
        handler2(value443);
        return;
      }
      const value444 = toggleKey['target']['closest']('[data-story-library-target-kind]');
      if (value444) {
        handler4(value444);
        return;
      }
      const el245 = toggleKey['target']['closest']('[data-story-character-voice-history-play]');
      if (el245) {
        void playHistory(
          state2['characterVoiceEditor']?.['assetId'],
          el245['dataset']['storyCharacterVoiceHistoryPlay'],
        );
        return;
      }
      const el246 = toggleKey['target']['closest']('[data-story-character-voice-history-restore]');
      if (el246) {
        restoreHistory(
          state2['characterVoiceEditor']?.['assetId'],
          el246['dataset']['storyCharacterVoiceHistoryRestore'],
        );
        return;
      }
      const el247 = toggleKey['target']['closest']('[data-story-open-project]');
      if (el247 && !toggleKey['target']['closest']('[data-story-action]')) {
        if (toggleKey['target']['closest']('[data-story-project-title]')) return;
        openProject2(el247['dataset']['storyOpenProject']);
        return;
      }
      const selectedOnly2 = toggleKey['target']['closest']('[data-story-action]'),
        home = selectedOnly2?.['dataset']['storyAction'];
      if (!home) return;
      const value445 = coordinator['getRevision']();
      [
        'request-inline-regeneration',
        'confirm-inline-regeneration',
        'cancel-inline-regeneration',
        'request-delete-asset-appearance',
        'confirm-delete-asset-appearance',
        'cancel-delete-asset-appearance',
      ]['includes'](home) && (toggleKey['preventDefault'](), toggleKey['stopPropagation']());
      if (
        home === 'select-all-novel-chapters' ||
        home === 'clear-novel-chapters' ||
        home === 'set-novel-episode-count' ||
        home === 'toggle-novel-chapter' ||
        home === 'start-novel-conversion'
      ) {
        const list34 = Array['isArray'](state2['novelChapters']) ? state2['novelChapters'] : [],
          list35 = list34['filter']((value446) => value446['adaptation'] !== 'done'),
          list36 = Array['isArray'](state2['novelSelectedChapterIds'])
            ? state2['novelSelectedChapterIds']['slice']()
            : [];
        if (home === 'select-all-novel-chapters')
          state2['novelSelectedChapterIds'] = list35['map']((value446) => value446['id']);
        else if (home === 'clear-novel-chapters') state2['novelSelectedChapterIds'] = [];
        else if (home === 'toggle-novel-chapter') {
          const text42 = normalizeText(selectedOnly2['dataset']['storyNovelChapter']),
            count19 = list36['indexOf'](text42);
          (count19 >= 0x0 ? list36['splice'](count19, 0x1) : list36['push'](text42),
            (state2['novelSelectedChapterIds'] = list36));
        } else if (home === 'set-novel-episode-count')
          state2['novelEpisodeCount'] = Math['max'](
            0x1,
            Math['trunc'](
              Number(storyRoot['querySelector']('[data-story-novel-episode-count]')?.['value']) || 0x1,
            ),
          );
        else {
          const count20 = Number(storyRoot['querySelector']('[data-story-novel-episode-count]')?.['value']);
          (Number['isFinite'](count20) &&
            count20 > 0x0 &&
            (state2['novelEpisodeCount'] = Math['trunc'](count20)),
            showToast(
              '批次转换尚未接通（下一步实现逐集生成）。本次已选 ' +
                list36['length'] +
                ' 章、计划 ' +
                state2['novelEpisodeCount'] +
                ' 集。',
              'info',
            ));
        }
        render();
      }
      if (home === 'toggle-clip-adjustment') {
        ((state2['clipAdjustmentOpen'] = !state2['clipAdjustmentOpen']),
          (state2['clipAdjustmentPromptModeOpen'] = ![]),
          (state2['clipAdjustmentLanguageOpen'] = ![]),
          (state2['clipAdjustmentLanguage'] = ''),
          (state2['clipPromptHistoryOpen'] = ![]),
          run30());
        if (state2['clipAdjustmentOpen']) {
          const selectedEpisode10 = getSelectedEpisode(state2),
            selectedClip8 = getSelectedClip(state2, selectedEpisode10);
          state2['clipAdjustmentPromptMode'] = '';
        }
        (run29(),
          state2['clipAdjustmentOpen'] &&
            storyRoot['querySelector']('[data-story-clip-adjustment-instruction]')?.['focus']());
      } else {
        if (home === 'toggle-clip-prompt-history') {
          state2['clipPromptHistoryOpen'] = !state2['clipPromptHistoryOpen'];
          const value447 = state2['clipAdjustmentOpen'] === !![];
          ((state2['clipAdjustmentOpen'] = ![]), (state2['clipAdjustmentPromptModeOpen'] = ![]));
          if (value447) run29();
          run30({ focus: state2['clipPromptHistoryOpen'] ? 'first' : 'trigger' });
        } else {
          if (home === 'restore-clip-prompt-history')
            restorePromptHistory(selectedOnly2['dataset']['storyClipPromptHistoryId']);
          else {
            if (home === 'toggle-clip-adjustment-mode') {
              const kind5 =
                  selectedOnly2['closest']('[data-story-adjustment-kind]')?.['dataset'][
                    'storyAdjustmentKind'
                  ] || 'mode',
                value448 =
                  kind5 === 'language' ? 'clipAdjustmentLanguageOpen' : 'clipAdjustmentPromptModeOpen';
              ((state2[value448] = !state2[value448]),
                (state2[
                  kind5 === 'language' ? 'clipAdjustmentPromptModeOpen' : 'clipAdjustmentLanguageOpen'
                ] = ![]),
                run31({ kind: kind5 === 'language' ? 'mode' : 'language' }),
                run31({ kind: kind5, focus: state2[value448] ? 'selected' : 'trigger' }));
            } else {
              if (home === 'select-clip-adjustment-mode') {
                const kind6 =
                  selectedOnly2['closest']('[data-story-adjustment-kind]')?.['dataset'][
                    'storyAdjustmentKind'
                  ] || 'mode';
                ((state2[kind6 === 'language' ? 'clipAdjustmentLanguage' : 'clipAdjustmentPromptMode'] =
                  kind6 === 'language'
                    ? normalizeStoryPromptLanguage(selectedOnly2['dataset']['storyClipAdjustmentModeOption'])
                    : normalizeStoryPromptMode(selectedOnly2['dataset']['storyClipAdjustmentModeOption'], {
                        allowDeveloperModes: !![],
                      })),
                  (state2['clipAdjustmentPromptModeOpen'] = ![]),
                  (state2['clipAdjustmentLanguageOpen'] = ![]),
                  run31({ kind: kind6, focus: 'instruction', updateSelection: !![] }));
              } else {
                if (home === 'generate-clip-adjustment') void generateCandidate();
                else {
                  if (home === 'regenerate-clip-adjustment') regenerateSelected();
                  else {
                    if (home === 'use-ai-clip-prompt') applySelected();
                    else {
                      if (home === 'keep-current-clip-prompt') discardSelected();
                      else {
                        if (
                          home === 'choose-script' ||
                          home === 'choose-rewrite-script' ||
                          home === 'choose-novel'
                        )
                          ((state2['scriptIntent'] = home === 'choose-novel' ? 'novel' : 'script'),
                            render(),
                            el9?.['click']());
                        else {
                          if (home === 'remove-rewrite-script')
                            (clearStoryHomeReferenceScript(state2),
                              schedulePersistence({ immediate: !![] }),
                              render(),
                              storyRoot['querySelector']('[data-story-idea-input]')?.['focus']());
                          else {
                            if (home === 'choose-replication-videos') ((value139 = ''), el10?.['click']());
                            else {
                              if (home === 'reupload-replication-video') {
                                const text43 = normalizeText(
                                    selectedOnly2['dataset']['storyReplicationEpisodeId'],
                                  ),
                                  storyReplicationEpisode = findStoryReplicationEpisode(
                                    state2['data'],
                                    text43,
                                  ),
                                  text44 = normalizeText(state2['data']?.['project']?.['id']);
                                storyReplicationEpisode &&
                                  state2['data']?.['project']?.['sourceMode'] === 'video-replication' &&
                                  storyReplicationEpisode['replication']?.['status'] === 'failed' &&
                                  !normalizeText(storyReplicationEpisode['sourceVideo']?.['videoRef']) &&
                                  (replicationAnalysisPromises['has'](text44)
                                    ? showToast('请等待当前视频解析完成后再重新上传。', 'info')
                                    : ((value139 = text43), el10?.['click']()));
                              } else {
                                if (home === 'remove-replication-video') {
                                  const count21 = Math['trunc'](
                                    Number(selectedOnly2['dataset']['storyReplicationFileIndex']),
                                  );
                                  if (
                                    count21 >= 0x0 &&
                                    count21 < state2['replicationSourceFiles']['length']
                                  ) {
                                    (revokeSourcePreviewUrl(state2['replicationSourcePreviewUrls'][count21]),
                                      (state2['replicationSourceFiles'] = state2['replicationSourceFiles'][
                                        'filter'
                                      ]((value449, value450) => value450 !== count21)),
                                      (state2['replicationSourcePreviewUrls'] = state2[
                                        'replicationSourcePreviewUrls'
                                      ]['filter']((value451, value452) => value452 !== count21)));
                                    const value453 = viewportElement['querySelector'](
                                      '.story-page.is-current\x20.story-home-composer-body',
                                    );
                                    if (value453) syncStoryReplicationHomeSources(value453, state2);
                                    syncGenerateState();
                                  }
                                } else {
                                  if (home === 'paste-script')
                                    ((state2['uploadInputMode'] = 'paste'),
                                      (state2['scriptFileName'] = normalizeText(state2['scriptText'])
                                        ? '粘贴文本'
                                        : ''),
                                      render(),
                                      storyRoot['querySelector']('[data-story-paste-input]')?.['focus']());
                                  else {
                                    if (home === 'debug-story-summary' || home === 'debug-story-home') {
                                      if (windowObject?.['DEV_MODE'] !== !![]) return;
                                      openDebugRequestWindow({
                                        documentObject: documentObject,
                                        windowObject: windowObject,
                                        title: '剧本摘要请求调试',
                                        prepare: async () => {
                                          const captureStoryRequestPayload2 =
                                            await captureStoryRequestPayload((captureRequest) =>
                                              storySummaryGenerationWorkspaceController['preview']({
                                                home: home === 'debug-story-home',
                                                captureRequest: captureRequest,
                                              }),
                                            );
                                          return {
                                            tabs: buildStoryRequestDebugPreviewModel(
                                              captureStoryRequestPayload2,
                                            )['tabs'],
                                          };
                                        },
                                      });
                                      return;
                                    } else {
                                      if (home === 'generate-story') generateFromHome();
                                      else {
                                        if (home === 'preview-replication-video') {
                                          const storyReplicationEpisode2 = findStoryReplicationEpisode(
                                              state2['data'],
                                              selectedOnly2['dataset']['storyReplicationEpisodeId'],
                                            ),
                                            text45 = normalizeText(
                                              storyReplicationEpisode2?.['sourceVideo']?.['videoRef'],
                                            );
                                          text45 &&
                                            openVideoPreview(text45, {
                                              ariaLabel:
                                                (normalizeText(storyReplicationEpisode2?.['title']) ||
                                                  '原视频') + '预览',
                                              loop: ![],
                                            });
                                        } else {
                                          if (home === 'retry-replication-analysis')
                                            void retryFailedAnalysis();
                                          else {
                                            if (home === 'localize-replication-assets')
                                              void extractProjectAssets({ advance: !![] });
                                            else {
                                              if (home === 'request-inline-regeneration') {
                                                if (
                                                  state2['storyPlanningOperation'] ||
                                                  state2['isGeneratingStory']
                                                )
                                                  return;
                                                const text46 = normalizeText(
                                                  selectedOnly2['dataset']['storyRegenerationTarget'],
                                                );
                                                if (
                                                  state2['data']?.['project']?.['outlineStatus'] ===
                                                    'stale' &&
                                                  text46['startsWith']('episode-script:')
                                                ) {
                                                  showToast('故事蓝图已修改，请先重新运行分集规划。', 'warn');
                                                  return;
                                                }
                                                ((state2['pendingRegenerationTarget'] = text46), render());
                                              } else {
                                                if (home === 'cancel-inline-regeneration')
                                                  ((state2['pendingRegenerationTarget'] = ''), render());
                                                else {
                                                  if (home === 'confirm-inline-regeneration') {
                                                    const text47 = normalizeText(
                                                      selectedOnly2['dataset']['storyRegenerationTarget'],
                                                    );
                                                    if (
                                                      !text47 ||
                                                      text47 !== state2['pendingRegenerationTarget']
                                                    )
                                                      return;
                                                    state2['pendingRegenerationTarget'] = '';
                                                    if (text47 === 'summary') void regenerateSummary();
                                                    else {
                                                      if (text47 === 'episode-outlines')
                                                        void run60({
                                                          advance: ![],
                                                          confirmRegeneration: ![],
                                                        });
                                                      else
                                                        text47['startsWith']('episode-script:') &&
                                                          void run65(
                                                            selectedOnly2['dataset']['storyEpisodeId'],
                                                          );
                                                    }
                                                  } else {
                                                    if (home === 'debug-episode-outline-request') {
                                                      if (
                                                        !isStoryEpisodeExperimentalSplitAvailable(
                                                          windowObject,
                                                        )
                                                      )
                                                        return;
                                                      void run67();
                                                    } else {
                                                      if (home === 'debug-episode-script-request') {
                                                        if (
                                                          !isStoryEpisodeExperimentalSplitAvailable(
                                                            windowObject,
                                                          )
                                                        )
                                                          return;
                                                        void run68();
                                                      } else {
                                                        if (home === 'debug-asset-extraction-request') {
                                                          if (windowObject?.['DEV_MODE'] !== !![]) return;
                                                          openStoryRequestDebugPreview({
                                                            documentObject: documentObject,
                                                            windowObject: windowObject,
                                                            title: '素材提取请求调试',
                                                            preparePayload: () =>
                                                              captureStoryRequestPayload((value454) =>
                                                                storyAssetExtractionWorkspaceController[
                                                                  'preview'
                                                                ](value454),
                                                              ),
                                                            subtitle:
                                                              '预览当前提取链路的首个请求，不运行本地模型或发送 API。',
                                                          });
                                                          return;
                                                        } else {
                                                          if (
                                                            home ===
                                                            'debug-asset-extraction-experimental-request'
                                                          ) {
                                                            if (
                                                              !isStoryAssetExperimentalExtractionAvailable(
                                                                windowObject,
                                                              )
                                                            )
                                                              return;
                                                            void run69();
                                                          } else {
                                                            if (home === 'plan-episode-outlines')
                                                              void run60({
                                                                advance: ![],
                                                                confirmRegeneration: !![],
                                                              });
                                                            else {
                                                              if (home === 'generate-episode-script')
                                                                void run62(
                                                                  selectedOnly2['dataset']['storyEpisodeId'],
                                                                );
                                                              else {
                                                                if (home === 'generate-next-episode-script') {
                                                                  const nextStoryEpisodeScriptIndex3 =
                                                                      getNextStoryEpisodeScriptIndex(
                                                                        state2['data']['episodes'],
                                                                      ),
                                                                    value455 =
                                                                      state2['data']['episodes'][
                                                                        nextStoryEpisodeScriptIndex3
                                                                      ];
                                                                  if (value455) void run62(value455['id']);
                                                                } else {
                                                                  if (home === 'continue-to-assets')
                                                                    void continueToProjectAssets();
                                                                  else {
                                                                    if (
                                                                      home ===
                                                                      'generate-episode-scripts-batch'
                                                                    )
                                                                      void run64({
                                                                        selectedOnly:
                                                                          selectedOnly2['dataset'][
                                                                            'storyScriptBatchScope'
                                                                          ] === 'selected',
                                                                      });
                                                                    else {
                                                                      if (
                                                                        home ===
                                                                        'cancel-episode-scripts-batch'
                                                                      )
                                                                        run63();
                                                                      else {
                                                                        if (
                                                                          home === 'cancel-script-selection'
                                                                        )
                                                                          ((state2['scriptSelectionMode'] =
                                                                            ![]),
                                                                            (state2[
                                                                              'selectedScriptEpisodeIds'
                                                                            ] = []),
                                                                            render());
                                                                        else {
                                                                          if (
                                                                            home ===
                                                                            'select-all-script-episodes'
                                                                          ) {
                                                                            const list37 =
                                                                              getStoryEpisodeScriptBatchTargets(
                                                                                state2['data']['episodes'],
                                                                                [],
                                                                              )['map'](
                                                                                (value456) => value456['id'],
                                                                              );
                                                                            ((state2[
                                                                              'selectedScriptEpisodeIds'
                                                                            ] = list37['every']((value457) =>
                                                                              state2[
                                                                                'selectedScriptEpisodeIds'
                                                                              ]['includes'](value457),
                                                                            )
                                                                              ? []
                                                                              : list37),
                                                                              (state2['scriptSelectionMode'] =
                                                                                state2[
                                                                                  'selectedScriptEpisodeIds'
                                                                                ]['length'] > 0x0),
                                                                              render(),
                                                                              storyRoot['querySelector'](
                                                                                '[data-story-action="select-all-script-episodes"]',
                                                                              )?.['focus']());
                                                                          } else {
                                                                            if (
                                                                              home === 'select-script-episode'
                                                                            )
                                                                              (toggleKey['preventDefault'](),
                                                                                run66(
                                                                                  selectedOnly2['dataset'][
                                                                                    'storyEpisodeId'
                                                                                  ],
                                                                                ));
                                                                            else {
                                                                              if (
                                                                                home ===
                                                                                'toggle-project-sort-menu'
                                                                              ) {
                                                                                (toggleKey[
                                                                                  'preventDefault'
                                                                                ](),
                                                                                  toggleKey[
                                                                                    'stopPropagation'
                                                                                  ]());
                                                                                const el248 = selectedOnly2[
                                                                                    'closest'
                                                                                  ](
                                                                                    '[data-story-project-sort-wrap]',
                                                                                  ),
                                                                                  value458 =
                                                                                    !el248?.['classList'][
                                                                                      'contains'
                                                                                    ]('is-open');
                                                                                (run37(''), run34());
                                                                                if (value458)
                                                                                  run39(el248, selectedOnly2);
                                                                                else run38();
                                                                              } else {
                                                                                if (
                                                                                  home ===
                                                                                  'select-project-sort'
                                                                                )
                                                                                  (toggleKey[
                                                                                    'preventDefault'
                                                                                  ](),
                                                                                    toggleKey[
                                                                                      'stopPropagation'
                                                                                    ](),
                                                                                    (state2[
                                                                                      'projectSortOrder'
                                                                                    ] =
                                                                                      normalizeStoryProjectSortOrder(
                                                                                        selectedOnly2[
                                                                                          'dataset'
                                                                                        ][
                                                                                          'storyProjectSortOption'
                                                                                        ],
                                                                                      )),
                                                                                    run37(''),
                                                                                    run38(),
                                                                                    render({
                                                                                      capturePageState: ![],
                                                                                    }));
                                                                                else {
                                                                                  if (
                                                                                    home ===
                                                                                    'toggle-project-menu'
                                                                                  ) {
                                                                                    (toggleKey[
                                                                                      'preventDefault'
                                                                                    ](),
                                                                                      toggleKey[
                                                                                        'stopPropagation'
                                                                                      ]());
                                                                                    const text48 =
                                                                                      normalizeText(
                                                                                        selectedOnly2[
                                                                                          'dataset'
                                                                                        ]['storyProjectId'],
                                                                                      );
                                                                                    state2[
                                                                                      'pendingDeleteProjectId'
                                                                                    ] = '';
                                                                                    const value459 =
                                                                                      state2[
                                                                                        'openProjectMenuId'
                                                                                      ] !== text48;
                                                                                    (run38(),
                                                                                      run37(
                                                                                        value459
                                                                                          ? text48
                                                                                          : '',
                                                                                      ));
                                                                                  } else {
                                                                                    if (
                                                                                      home ===
                                                                                      'rename-project'
                                                                                    ) {
                                                                                      const text49 =
                                                                                        normalizeText(
                                                                                          selectedOnly2[
                                                                                            'dataset'
                                                                                          ]['storyProjectId'],
                                                                                        );
                                                                                      ((state2[
                                                                                        'openProjectMenuId'
                                                                                      ] = ''),
                                                                                        render(),
                                                                                        focusProjectTitle(
                                                                                          text49,
                                                                                        ));
                                                                                    } else {
                                                                                      if (
                                                                                        home ===
                                                                                        'duplicate-project'
                                                                                      )
                                                                                        duplicateProject(
                                                                                          selectedOnly2[
                                                                                            'dataset'
                                                                                          ]['storyProjectId'],
                                                                                        );
                                                                                      else {
                                                                                        if (
                                                                                          home ===
                                                                                          'collect-project'
                                                                                        )
                                                                                          void collectStoredProject(
                                                                                            selectedOnly2[
                                                                                              'dataset'
                                                                                            ][
                                                                                              'storyProjectId'
                                                                                            ],
                                                                                          );
                                                                                        else {
                                                                                          if (
                                                                                            home ===
                                                                                            'import-project'
                                                                                          )
                                                                                            void importProjectPackage();
                                                                                          else {
                                                                                            if (
                                                                                              home ===
                                                                                              'archive-project'
                                                                                            )
                                                                                              setProjectArchived(
                                                                                                selectedOnly2[
                                                                                                  'dataset'
                                                                                                ][
                                                                                                  'storyProjectId'
                                                                                                ],
                                                                                                !![],
                                                                                              );
                                                                                            else {
                                                                                              if (
                                                                                                home ===
                                                                                                'unarchive-project'
                                                                                              )
                                                                                                setProjectArchived(
                                                                                                  selectedOnly2[
                                                                                                    'dataset'
                                                                                                  ][
                                                                                                    'storyProjectId'
                                                                                                  ],
                                                                                                  ![],
                                                                                                );
                                                                                              else {
                                                                                                if (
                                                                                                  home ===
                                                                                                  'toggle-archived-projects'
                                                                                                )
                                                                                                  ((state2[
                                                                                                    'showArchivedProjects'
                                                                                                  ] =
                                                                                                    !state2[
                                                                                                      'showArchivedProjects'
                                                                                                    ]),
                                                                                                    (state2[
                                                                                                      'openProjectMenuId'
                                                                                                    ] = ''),
                                                                                                    (state2[
                                                                                                      'pendingDeleteProjectId'
                                                                                                    ] = ''),
                                                                                                    render());
                                                                                                else {
                                                                                                  if (
                                                                                                    home ===
                                                                                                    'request-delete-project'
                                                                                                  )
                                                                                                    ((state2[
                                                                                                      'openProjectMenuId'
                                                                                                    ] = ''),
                                                                                                      (state2[
                                                                                                        'pendingDeleteProjectId'
                                                                                                      ] =
                                                                                                        normalizeText(
                                                                                                          selectedOnly2[
                                                                                                            'dataset'
                                                                                                          ][
                                                                                                            'storyProjectId'
                                                                                                          ],
                                                                                                        )),
                                                                                                      render());
                                                                                                  else {
                                                                                                    if (
                                                                                                      home ===
                                                                                                      'cancel-delete-project'
                                                                                                    )
                                                                                                      ((state2[
                                                                                                        'pendingDeleteProjectId'
                                                                                                      ] = ''),
                                                                                                        render());
                                                                                                    else {
                                                                                                      if (
                                                                                                        home ===
                                                                                                        'confirm-delete-project'
                                                                                                      )
                                                                                                        deleteProject(
                                                                                                          selectedOnly2[
                                                                                                            'dataset'
                                                                                                          ][
                                                                                                            'storyProjectId'
                                                                                                          ],
                                                                                                        );
                                                                                                      else {
                                                                                                        if (
                                                                                                          home ===
                                                                                                          'delete-clip-frame'
                                                                                                        )
                                                                                                          (toggleKey[
                                                                                                            'preventDefault'
                                                                                                          ](),
                                                                                                            toggleKey[
                                                                                                              'stopPropagation'
                                                                                                            ](),
                                                                                                            void run58(
                                                                                                              selectedOnly2[
                                                                                                                'dataset'
                                                                                                              ][
                                                                                                                'storyClipFrameId'
                                                                                                              ],
                                                                                                            ));
                                                                                                        else {
                                                                                                          if (
                                                                                                            home ===
                                                                                                            'request-delete-clip'
                                                                                                          ) {
                                                                                                            if (
                                                                                                              state2[
                                                                                                                'clipSelectionMode'
                                                                                                              ]
                                                                                                            )
                                                                                                              return;
                                                                                                            if (
                                                                                                              storyClipProduction[
                                                                                                                'getGenerationState'
                                                                                                              ](
                                                                                                                state2,
                                                                                                                getSelectedEpisode(
                                                                                                                  state2,
                                                                                                                ),
                                                                                                              )[
                                                                                                                'busy'
                                                                                                              ]
                                                                                                            ) {
                                                                                                              showToast(
                                                                                                                '请等待当前视频生成任务完成。',
                                                                                                                'info',
                                                                                                              );
                                                                                                              return;
                                                                                                            }
                                                                                                            ((state2[
                                                                                                              'pendingDeleteClipId'
                                                                                                            ] =
                                                                                                              normalizeText(
                                                                                                                selectedOnly2[
                                                                                                                  'dataset'
                                                                                                                ][
                                                                                                                  'storyClipDeleteId'
                                                                                                                ],
                                                                                                              )),
                                                                                                              render());
                                                                                                          } else {
                                                                                                            if (
                                                                                                              home ===
                                                                                                              'cancel-delete-clip'
                                                                                                            )
                                                                                                              ((state2[
                                                                                                                'pendingDeleteClipId'
                                                                                                              ] =
                                                                                                                ''),
                                                                                                                render());
                                                                                                            else {
                                                                                                              if (
                                                                                                                home ===
                                                                                                                'confirm-delete-clip'
                                                                                                              ) {
                                                                                                                if (
                                                                                                                  storyClipProduction[
                                                                                                                    'getGenerationState'
                                                                                                                  ](
                                                                                                                    state2,
                                                                                                                    getSelectedEpisode(
                                                                                                                      state2,
                                                                                                                    ),
                                                                                                                  )[
                                                                                                                    'busy'
                                                                                                                  ]
                                                                                                                ) {
                                                                                                                  ((state2[
                                                                                                                    'pendingDeleteClipId'
                                                                                                                  ] =
                                                                                                                    ''),
                                                                                                                    render(),
                                                                                                                    showToast(
                                                                                                                      '请等待当前视频生成任务完成。',
                                                                                                                      'info',
                                                                                                                    ));
                                                                                                                  return;
                                                                                                                }
                                                                                                                run56(
                                                                                                                  selectedOnly2[
                                                                                                                    'dataset'
                                                                                                                  ][
                                                                                                                    'storyClipDeleteId'
                                                                                                                  ],
                                                                                                                );
                                                                                                              } else {
                                                                                                                if (
                                                                                                                  home ===
                                                                                                                  'extract-assets'
                                                                                                                )
                                                                                                                  void extractProjectAssets(
                                                                                                                    {
                                                                                                                      advance:
                                                                                                                        !![],
                                                                                                                    },
                                                                                                                  );
                                                                                                                else {
                                                                                                                  if (
                                                                                                                    home ===
                                                                                                                    'extract-assets-experimental'
                                                                                                                  ) {
                                                                                                                    if (
                                                                                                                      !isStoryAssetExperimentalExtractionAvailable(
                                                                                                                        windowObject,
                                                                                                                      )
                                                                                                                    )
                                                                                                                      return;
                                                                                                                    void extractProjectAssets(
                                                                                                                      {
                                                                                                                        advance:
                                                                                                                          !![],
                                                                                                                        experimental:
                                                                                                                          !![],
                                                                                                                      },
                                                                                                                    );
                                                                                                                  } else {
                                                                                                                    if (
                                                                                                                      home ===
                                                                                                                      'plan-episodes'
                                                                                                                    )
                                                                                                                      void run60(
                                                                                                                        {
                                                                                                                          advance:
                                                                                                                            !![],
                                                                                                                        },
                                                                                                                      );
                                                                                                                    else {
                                                                                                                      if (
                                                                                                                        home ===
                                                                                                                        'open-episode-stage'
                                                                                                                      )
                                                                                                                        void openEpisodeStage(
                                                                                                                          {
                                                                                                                            confirmMissingImages:
                                                                                                                              !![],
                                                                                                                          },
                                                                                                                        );
                                                                                                                      else {
                                                                                                                        if (
                                                                                                                          home ===
                                                                                                                          'toggle-experimental-split-mode'
                                                                                                                        )
                                                                                                                          return;
                                                                                                                        else {
                                                                                                                          if (
                                                                                                                            home ===
                                                                                                                            'cancel-episode-selection'
                                                                                                                          )
                                                                                                                            (storyMarqueeSelectionController[
                                                                                                                              'cancel'
                                                                                                                            ](),
                                                                                                                              (state2[
                                                                                                                                'episodeSelectionMode'
                                                                                                                              ] =
                                                                                                                                ![]),
                                                                                                                              (state2[
                                                                                                                                'selectedEpisodeIds'
                                                                                                                              ] =
                                                                                                                                []),
                                                                                                                              render());
                                                                                                                          else {
                                                                                                                            if (
                                                                                                                              home ===
                                                                                                                              'toggle-all-episodes'
                                                                                                                            )
                                                                                                                              ((state2[
                                                                                                                                'selectedEpisodeIds'
                                                                                                                              ] =
                                                                                                                                toggleStoryEpisodeSelectAll(
                                                                                                                                  getStoryVideoEpisodes(
                                                                                                                                    state2[
                                                                                                                                      'data'
                                                                                                                                    ][
                                                                                                                                      'episodes'
                                                                                                                                    ],
                                                                                                                                  ),
                                                                                                                                  state2[
                                                                                                                                    'selectedEpisodeIds'
                                                                                                                                  ],
                                                                                                                                )),
                                                                                                                                (state2[
                                                                                                                                  'episodeSelectionMode'
                                                                                                                                ] =
                                                                                                                                  state2[
                                                                                                                                    'selectedEpisodeIds'
                                                                                                                                  ][
                                                                                                                                    'length'
                                                                                                                                  ] >
                                                                                                                                  0x0),
                                                                                                                                render(),
                                                                                                                                storyRoot[
                                                                                                                                  'querySelector'
                                                                                                                                ](
                                                                                                                                  '[data-story-action=\x22toggle-all-episodes\x22]',
                                                                                                                                )?.[
                                                                                                                                  'focus'
                                                                                                                                ]());
                                                                                                                            else {
                                                                                                                              if (
                                                                                                                                home ===
                                                                                                                                'split-selected-episodes'
                                                                                                                              )
                                                                                                                                void splitBatch(
                                                                                                                                  {
                                                                                                                                    selectionMode:
                                                                                                                                      !![],
                                                                                                                                  },
                                                                                                                                );
                                                                                                                              else {
                                                                                                                                if (
                                                                                                                                  home ===
                                                                                                                                  'split-all-episodes'
                                                                                                                                )
                                                                                                                                  void splitBatch(
                                                                                                                                    {
                                                                                                                                      selectionMode:
                                                                                                                                        ![],
                                                                                                                                    },
                                                                                                                                  );
                                                                                                                                else {
                                                                                                                                  if (
                                                                                                                                    home ===
                                                                                                                                    'cancel-episode-split-batch'
                                                                                                                                  )
                                                                                                                                    cancelBatch();
                                                                                                                                  else {
                                                                                                                                    if (
                                                                                                                                      home ===
                                                                                                                                      'split-episode'
                                                                                                                                    )
                                                                                                                                      void splitEpisode2(
                                                                                                                                        selectedOnly2[
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
                                                                                                                                        home ===
                                                                                                                                        'experimental-split-episode'
                                                                                                                                      ) {
                                                                                                                                        if (
                                                                                                                                          !isStoryEpisodeExperimentalSplitAvailable(
                                                                                                                                            windowObject,
                                                                                                                                          )
                                                                                                                                        )
                                                                                                                                          return;
                                                                                                                                        void splitEpisodeExperimental2(
                                                                                                                                          selectedOnly2[
                                                                                                                                            'dataset'
                                                                                                                                          ][
                                                                                                                                            'storyEpisodeId'
                                                                                                                                          ],
                                                                                                                                        );
                                                                                                                                      } else {
                                                                                                                                        if (
                                                                                                                                          home ===
                                                                                                                                          'debug-episode-split-request'
                                                                                                                                        ) {
                                                                                                                                          void run70(
                                                                                                                                            selectedOnly2[
                                                                                                                                              'dataset'
                                                                                                                                            ][
                                                                                                                                              'storyEpisodeId'
                                                                                                                                            ],
                                                                                                                                            shouldUseStoryEpisodeExperimentalSplit(
                                                                                                                                              state2,
                                                                                                                                            ),
                                                                                                                                          );
                                                                                                                                          return;
                                                                                                                                        } else {
                                                                                                                                          if (
                                                                                                                                            home ===
                                                                                                                                            'debug-experimental-split-request'
                                                                                                                                          ) {
                                                                                                                                            if (
                                                                                                                                              !isStoryEpisodeExperimentalSplitAvailable(
                                                                                                                                                windowObject,
                                                                                                                                              )
                                                                                                                                            )
                                                                                                                                              return;
                                                                                                                                            void run70(
                                                                                                                                              selectedOnly2[
                                                                                                                                                'dataset'
                                                                                                                                              ][
                                                                                                                                                'storyEpisodeId'
                                                                                                                                              ],
                                                                                                                                            );
                                                                                                                                          } else {
                                                                                                                                            if (
                                                                                                                                              home ===
                                                                                                                                              'regenerate-episode'
                                                                                                                                            )
                                                                                                                                              void splitEpisode2(
                                                                                                                                                selectedOnly2[
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
                                                                                                                                                home ===
                                                                                                                                                'repair-episode-split-draft'
                                                                                                                                              )
                                                                                                                                                recoverDraft(
                                                                                                                                                  selectedOnly2[
                                                                                                                                                    'dataset'
                                                                                                                                                  ][
                                                                                                                                                    'storyEpisodeId'
                                                                                                                                                  ],
                                                                                                                                                );
                                                                                                                                              else {
                                                                                                                                                if (
                                                                                                                                                  home ===
                                                                                                                                                  'new-story'
                                                                                                                                                )
                                                                                                                                                  (resetCreationState(),
                                                                                                                                                    render(),
                                                                                                                                                    storyRoot[
                                                                                                                                                      'querySelector'
                                                                                                                                                    ](
                                                                                                                                                      '[data-story-idea-input]',
                                                                                                                                                    )?.[
                                                                                                                                                      'focus'
                                                                                                                                                    ]());
                                                                                                                                                else {
                                                                                                                                                  if (
                                                                                                                                                    home ===
                                                                                                                                                    'back-home'
                                                                                                                                                  )
                                                                                                                                                    (schedulePersistence(
                                                                                                                                                      {
                                                                                                                                                        immediate:
                                                                                                                                                          !![],
                                                                                                                                                      },
                                                                                                                                                    ),
                                                                                                                                                      (state2[
                                                                                                                                                        'view'
                                                                                                                                                      ] =
                                                                                                                                                        'home'),
                                                                                                                                                      render(
                                                                                                                                                        {
                                                                                                                                                          direction:
                                                                                                                                                            'backward',
                                                                                                                                                        },
                                                                                                                                                      ));
                                                                                                                                                  else {
                                                                                                                                                    if (
                                                                                                                                                      home ===
                                                                                                                                                      'previous-step'
                                                                                                                                                    )
                                                                                                                                                      run55(
                                                                                                                                                        state2[
                                                                                                                                                          'step'
                                                                                                                                                        ] -
                                                                                                                                                          0x1,
                                                                                                                                                      );
                                                                                                                                                    else {
                                                                                                                                                      if (
                                                                                                                                                        home ===
                                                                                                                                                        'finish-story-workbench'
                                                                                                                                                      )
                                                                                                                                                        ((state2[
                                                                                                                                                          'view'
                                                                                                                                                        ] =
                                                                                                                                                          'home'),
                                                                                                                                                          schedulePersistence(
                                                                                                                                                            {
                                                                                                                                                              immediate:
                                                                                                                                                                !![],
                                                                                                                                                            },
                                                                                                                                                          ),
                                                                                                                                                          render(
                                                                                                                                                            {
                                                                                                                                                              direction:
                                                                                                                                                                'backward',
                                                                                                                                                            },
                                                                                                                                                          ),
                                                                                                                                                          showToast(
                                                                                                                                                            '剧本工作室已保存。',
                                                                                                                                                            'success',
                                                                                                                                                          ));
                                                                                                                                                      else {
                                                                                                                                                        if (
                                                                                                                                                          home ===
                                                                                                                                                          'request-delete-asset-appearance'
                                                                                                                                                        ) {
                                                                                                                                                          if (
                                                                                                                                                            selectedOnly2[
                                                                                                                                                              'dataset'
                                                                                                                                                            ][
                                                                                                                                                              'storyCardAppearanceId'
                                                                                                                                                            ]
                                                                                                                                                          )
                                                                                                                                                            state2[
                                                                                                                                                              'selectedAssetId'
                                                                                                                                                            ] =
                                                                                                                                                              selectedOnly2[
                                                                                                                                                                'dataset'
                                                                                                                                                              ][
                                                                                                                                                                'storyCardAppearanceId'
                                                                                                                                                              ];
                                                                                                                                                          const storyAsset5 =
                                                                                                                                                              findStoryAsset(
                                                                                                                                                                state2,
                                                                                                                                                                state2[
                                                                                                                                                                  'selectedAssetId'
                                                                                                                                                                ],
                                                                                                                                                              ),
                                                                                                                                                            enabled57 =
                                                                                                                                                              storyAsset5
                                                                                                                                                                ? getSelectedAssetAppearance(
                                                                                                                                                                    state2,
                                                                                                                                                                    storyAsset5,
                                                                                                                                                                  )
                                                                                                                                                                : null,
                                                                                                                                                            storyAssetAppearanceActionKey =
                                                                                                                                                              getStoryAssetAppearanceActionKey(
                                                                                                                                                                storyAsset5,
                                                                                                                                                                enabled57,
                                                                                                                                                              );
                                                                                                                                                          if (
                                                                                                                                                            !storyAsset5 ||
                                                                                                                                                            !enabled57 ||
                                                                                                                                                            !storyAssetAppearanceActionKey
                                                                                                                                                          )
                                                                                                                                                            return;
                                                                                                                                                          if (
                                                                                                                                                            state2[
                                                                                                                                                              'data'
                                                                                                                                                            ][
                                                                                                                                                              'project'
                                                                                                                                                            ][
                                                                                                                                                              'sourceMode'
                                                                                                                                                            ] ===
                                                                                                                                                            'video-replication'
                                                                                                                                                              ? !normalizeText(
                                                                                                                                                                  enabled57[
                                                                                                                                                                    'imageUrl'
                                                                                                                                                                  ],
                                                                                                                                                                ) &&
                                                                                                                                                                (storyAsset5[
                                                                                                                                                                  'kind'
                                                                                                                                                                ] !==
                                                                                                                                                                  'character' ||
                                                                                                                                                                  getStoryAssetAppearances(
                                                                                                                                                                    storyAsset5,
                                                                                                                                                                  )[
                                                                                                                                                                    'length'
                                                                                                                                                                  ] <=
                                                                                                                                                                    0x1)
                                                                                                                                                              : !isStoryAddedAssetAppearance(
                                                                                                                                                                  enabled57,
                                                                                                                                                                ) ||
                                                                                                                                                                getStoryAssetAppearances(
                                                                                                                                                                  storyAsset5,
                                                                                                                                                                )[
                                                                                                                                                                  'length'
                                                                                                                                                                ] <=
                                                                                                                                                                  0x1
                                                                                                                                                          ) {
                                                                                                                                                            showToast(
                                                                                                                                                              '剧本识别出的原始形象不能删除。',
                                                                                                                                                              'warn',
                                                                                                                                                            );
                                                                                                                                                            return;
                                                                                                                                                          }
                                                                                                                                                          if (
                                                                                                                                                            isStoryAssetAppearanceLoading(
                                                                                                                                                              state2,
                                                                                                                                                              storyAsset5[
                                                                                                                                                                'id'
                                                                                                                                                              ],
                                                                                                                                                              enabled57[
                                                                                                                                                                'id'
                                                                                                                                                              ],
                                                                                                                                                            ) ||
                                                                                                                                                            normalizeText(
                                                                                                                                                              state2[
                                                                                                                                                                'exportingAssetAppearanceKey'
                                                                                                                                                              ],
                                                                                                                                                            ) ===
                                                                                                                                                              storyAssetAppearanceActionKey
                                                                                                                                                          ) {
                                                                                                                                                            showToast(
                                                                                                                                                              '请等待当前形象任务完成。',
                                                                                                                                                              'info',
                                                                                                                                                            );
                                                                                                                                                            return;
                                                                                                                                                          }
                                                                                                                                                          if (
                                                                                                                                                            removeStoryReplicationCharacterAppearance(
                                                                                                                                                              state2,
                                                                                                                                                              storyAsset5,
                                                                                                                                                              enabled57[
                                                                                                                                                                'id'
                                                                                                                                                              ],
                                                                                                                                                            )
                                                                                                                                                          ) {
                                                                                                                                                            (schedulePersistence(
                                                                                                                                                              {
                                                                                                                                                                immediate:
                                                                                                                                                                  !![],
                                                                                                                                                              },
                                                                                                                                                            ),
                                                                                                                                                              render());
                                                                                                                                                            return;
                                                                                                                                                          }
                                                                                                                                                          ((state2[
                                                                                                                                                            'pendingDeleteAssetAppearanceKey'
                                                                                                                                                          ] =
                                                                                                                                                            storyAssetAppearanceActionKey),
                                                                                                                                                            render());
                                                                                                                                                        } else {
                                                                                                                                                          if (
                                                                                                                                                            home ===
                                                                                                                                                            'cancel-delete-asset-appearance'
                                                                                                                                                          )
                                                                                                                                                            ((state2[
                                                                                                                                                              'pendingDeleteAssetAppearanceKey'
                                                                                                                                                            ] =
                                                                                                                                                              ''),
                                                                                                                                                              render());
                                                                                                                                                          else {
                                                                                                                                                            if (
                                                                                                                                                              home ===
                                                                                                                                                              'confirm-delete-asset-appearance'
                                                                                                                                                            ) {
                                                                                                                                                              const storyAsset6 =
                                                                                                                                                                  findStoryAsset(
                                                                                                                                                                    state2,
                                                                                                                                                                    state2[
                                                                                                                                                                      'selectedAssetId'
                                                                                                                                                                    ],
                                                                                                                                                                  ),
                                                                                                                                                                enabled58 =
                                                                                                                                                                  storyAsset6
                                                                                                                                                                    ? getSelectedAssetAppearance(
                                                                                                                                                                        state2,
                                                                                                                                                                        storyAsset6,
                                                                                                                                                                      )
                                                                                                                                                                    : null,
                                                                                                                                                                storyAssetAppearanceActionKey2 =
                                                                                                                                                                  getStoryAssetAppearanceActionKey(
                                                                                                                                                                    storyAsset6,
                                                                                                                                                                    enabled58,
                                                                                                                                                                  );
                                                                                                                                                              if (
                                                                                                                                                                !storyAsset6 ||
                                                                                                                                                                !enabled58 ||
                                                                                                                                                                !storyAssetAppearanceActionKey2 ||
                                                                                                                                                                storyAssetAppearanceActionKey2 !==
                                                                                                                                                                  normalizeText(
                                                                                                                                                                    state2[
                                                                                                                                                                      'pendingDeleteAssetAppearanceKey'
                                                                                                                                                                    ],
                                                                                                                                                                  )
                                                                                                                                                              )
                                                                                                                                                                return;
                                                                                                                                                              if (
                                                                                                                                                                isStoryAssetAppearanceLoading(
                                                                                                                                                                  state2,
                                                                                                                                                                  storyAsset6[
                                                                                                                                                                    'id'
                                                                                                                                                                  ],
                                                                                                                                                                  enabled58[
                                                                                                                                                                    'id'
                                                                                                                                                                  ],
                                                                                                                                                                ) ||
                                                                                                                                                                normalizeText(
                                                                                                                                                                  state2[
                                                                                                                                                                    'exportingAssetAppearanceKey'
                                                                                                                                                                  ],
                                                                                                                                                                ) ===
                                                                                                                                                                  storyAssetAppearanceActionKey2
                                                                                                                                                              ) {
                                                                                                                                                                ((state2[
                                                                                                                                                                  'pendingDeleteAssetAppearanceKey'
                                                                                                                                                                ] =
                                                                                                                                                                  ''),
                                                                                                                                                                  render(),
                                                                                                                                                                  showToast(
                                                                                                                                                                    '请等待当前形象任务完成。',
                                                                                                                                                                    'info',
                                                                                                                                                                  ));
                                                                                                                                                                return;
                                                                                                                                                              }
                                                                                                                                                              const value460 =
                                                                                                                                                                  state2[
                                                                                                                                                                    'data'
                                                                                                                                                                  ][
                                                                                                                                                                    'project'
                                                                                                                                                                  ][
                                                                                                                                                                    'sourceMode'
                                                                                                                                                                  ] ===
                                                                                                                                                                  'video-replication',
                                                                                                                                                                enabled59 =
                                                                                                                                                                  value460
                                                                                                                                                                    ? clearStoryAssetAppearanceImage(
                                                                                                                                                                        storyAsset6,
                                                                                                                                                                        enabled58[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                      )
                                                                                                                                                                    : removeStoryAddedAssetAppearance(
                                                                                                                                                                        storyAsset6,
                                                                                                                                                                        enabled58[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                      );
                                                                                                                                                              state2[
                                                                                                                                                                'pendingDeleteAssetAppearanceKey'
                                                                                                                                                              ] =
                                                                                                                                                                '';
                                                                                                                                                              if (
                                                                                                                                                                !enabled59[
                                                                                                                                                                  'removed'
                                                                                                                                                                ]
                                                                                                                                                              ) {
                                                                                                                                                                (render(),
                                                                                                                                                                  showToast(
                                                                                                                                                                    '剧本识别出的原始形象不能删除。',
                                                                                                                                                                    'warn',
                                                                                                                                                                  ));
                                                                                                                                                                return;
                                                                                                                                                              }
                                                                                                                                                              ((state2[
                                                                                                                                                                'assetAppearanceIndexes'
                                                                                                                                                              ] =
                                                                                                                                                                {
                                                                                                                                                                  ...state2[
                                                                                                                                                                    'assetAppearanceIndexes'
                                                                                                                                                                  ],
                                                                                                                                                                  [storyAsset6[
                                                                                                                                                                    'id'
                                                                                                                                                                  ]]:
                                                                                                                                                                    enabled59[
                                                                                                                                                                      'nextIndex'
                                                                                                                                                                    ],
                                                                                                                                                                }),
                                                                                                                                                                schedulePersistence(
                                                                                                                                                                  {
                                                                                                                                                                    immediate:
                                                                                                                                                                      !![],
                                                                                                                                                                  },
                                                                                                                                                                ),
                                                                                                                                                                render(),
                                                                                                                                                                showToast(
                                                                                                                                                                  value460
                                                                                                                                                                    ? '当前图片已删除，可重新生成或上传。'
                                                                                                                                                                    : '追加形象已删除，原始形象仍保留。',
                                                                                                                                                                  'success',
                                                                                                                                                                ));
                                                                                                                                                            } else {
                                                                                                                                                              if (
                                                                                                                                                                home ===
                                                                                                                                                                'upload-asset'
                                                                                                                                                              )
                                                                                                                                                                ((state2[
                                                                                                                                                                  'pendingAssetUploadId'
                                                                                                                                                                ] =
                                                                                                                                                                  selectedOnly2[
                                                                                                                                                                    'dataset'
                                                                                                                                                                  ][
                                                                                                                                                                    'storyCardAppearanceId'
                                                                                                                                                                  ] ||
                                                                                                                                                                  state2[
                                                                                                                                                                    'selectedAssetId'
                                                                                                                                                                  ]),
                                                                                                                                                                  (value133 =
                                                                                                                                                                    args38[
                                                                                                                                                                      'capture'
                                                                                                                                                                    ](
                                                                                                                                                                      state2[
                                                                                                                                                                        'pendingAssetUploadId'
                                                                                                                                                                      ],
                                                                                                                                                                      {
                                                                                                                                                                        appendAppearance:
                                                                                                                                                                          Boolean(
                                                                                                                                                                            selectedOnly2[
                                                                                                                                                                              'dataset'
                                                                                                                                                                            ][
                                                                                                                                                                              'storyCardAppearanceId'
                                                                                                                                                                            ],
                                                                                                                                                                          ),
                                                                                                                                                                      },
                                                                                                                                                                    )),
                                                                                                                                                                  (state2[
                                                                                                                                                                    'pendingAssetAppearanceId'
                                                                                                                                                                  ] =
                                                                                                                                                                    value133[
                                                                                                                                                                      'appearanceId'
                                                                                                                                                                    ] ||
                                                                                                                                                                    ''),
                                                                                                                                                                  el11?.[
                                                                                                                                                                    'click'
                                                                                                                                                                  ]());
                                                                                                                                                              else {
                                                                                                                                                                if (
                                                                                                                                                                  home ===
                                                                                                                                                                  'upload-asset-reference'
                                                                                                                                                                ) {
                                                                                                                                                                  const assetId5 =
                                                                                                                                                                      findStoryAsset(
                                                                                                                                                                        state2,
                                                                                                                                                                        state2[
                                                                                                                                                                          'selectedAssetId'
                                                                                                                                                                        ],
                                                                                                                                                                      ),
                                                                                                                                                                    appearanceId2 =
                                                                                                                                                                      assetId5
                                                                                                                                                                        ? getSelectedAssetAppearance(
                                                                                                                                                                            state2,
                                                                                                                                                                            assetId5,
                                                                                                                                                                          )
                                                                                                                                                                        : null;
                                                                                                                                                                  if (
                                                                                                                                                                    !assetId5 ||
                                                                                                                                                                    !appearanceId2 ||
                                                                                                                                                                    !isStoryAssetBaseAppearance(
                                                                                                                                                                      assetId5,
                                                                                                                                                                      appearanceId2,
                                                                                                                                                                    )
                                                                                                                                                                  )
                                                                                                                                                                    showToast(
                                                                                                                                                                      '只有基础形象可以上传风格参考。',
                                                                                                                                                                      'warn',
                                                                                                                                                                    );
                                                                                                                                                                  else
                                                                                                                                                                    isStoryAssetAppearanceLoading(
                                                                                                                                                                      state2,
                                                                                                                                                                      assetId5[
                                                                                                                                                                        'id'
                                                                                                                                                                      ],
                                                                                                                                                                      appearanceId2[
                                                                                                                                                                        'id'
                                                                                                                                                                      ],
                                                                                                                                                                    )
                                                                                                                                                                      ? showToast(
                                                                                                                                                                          '请等待当前生成或上传任务完成。',
                                                                                                                                                                          'info',
                                                                                                                                                                        )
                                                                                                                                                                      : ((value134 =
                                                                                                                                                                          {
                                                                                                                                                                            projectToken:
                                                                                                                                                                              createProjectToken(
                                                                                                                                                                                state2,
                                                                                                                                                                              ),
                                                                                                                                                                            assetId:
                                                                                                                                                                              assetId5[
                                                                                                                                                                                'id'
                                                                                                                                                                              ],
                                                                                                                                                                            appearanceId:
                                                                                                                                                                              appearanceId2[
                                                                                                                                                                                'id'
                                                                                                                                                                              ],
                                                                                                                                                                          }),
                                                                                                                                                                        el12?.[
                                                                                                                                                                          'click'
                                                                                                                                                                        ]());
                                                                                                                                                                } else {
                                                                                                                                                                  if (
                                                                                                                                                                    home ===
                                                                                                                                                                    'remove-asset-reference'
                                                                                                                                                                  ) {
                                                                                                                                                                    const storyAsset7 =
                                                                                                                                                                        findStoryAsset(
                                                                                                                                                                          state2,
                                                                                                                                                                          state2[
                                                                                                                                                                            'selectedAssetId'
                                                                                                                                                                          ],
                                                                                                                                                                        ),
                                                                                                                                                                      value461 =
                                                                                                                                                                        storyAsset7
                                                                                                                                                                          ? getSelectedAssetAppearance(
                                                                                                                                                                              state2,
                                                                                                                                                                              storyAsset7,
                                                                                                                                                                            )
                                                                                                                                                                          : null;
                                                                                                                                                                    storyAsset7 &&
                                                                                                                                                                      value461 &&
                                                                                                                                                                      !isStoryAssetAppearanceLoading(
                                                                                                                                                                        state2,
                                                                                                                                                                        storyAsset7[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                        value461[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                      ) &&
                                                                                                                                                                      clearStoryAssetAppearanceReferenceImage(
                                                                                                                                                                        value461,
                                                                                                                                                                      ) &&
                                                                                                                                                                      (refreshAssetCard(
                                                                                                                                                                        storyAsset7[
                                                                                                                                                                          'id'
                                                                                                                                                                        ],
                                                                                                                                                                      ),
                                                                                                                                                                      refreshSelectedAsset(),
                                                                                                                                                                      schedulePersistence(
                                                                                                                                                                        {
                                                                                                                                                                          immediate:
                                                                                                                                                                            !![],
                                                                                                                                                                        },
                                                                                                                                                                      ),
                                                                                                                                                                      showToast(
                                                                                                                                                                        '风格参考已删除。',
                                                                                                                                                                        'success',
                                                                                                                                                                      ));
                                                                                                                                                                  } else {
                                                                                                                                                                    if (
                                                                                                                                                                      home ===
                                                                                                                                                                      'play-character-voice'
                                                                                                                                                                    )
                                                                                                                                                                      void playPreview(
                                                                                                                                                                        selectedOnly2[
                                                                                                                                                                          'dataset'
                                                                                                                                                                        ][
                                                                                                                                                                          'storyVoiceAssetId'
                                                                                                                                                                        ] ||
                                                                                                                                                                          state2[
                                                                                                                                                                            'selectedAssetId'
                                                                                                                                                                          ],
                                                                                                                                                                      );
                                                                                                                                                                    else {
                                                                                                                                                                      if (
                                                                                                                                                                        home ===
                                                                                                                                                                        'open-character-voice'
                                                                                                                                                                      )
                                                                                                                                                                        openEditor(
                                                                                                                                                                          state2[
                                                                                                                                                                            'selectedAssetId'
                                                                                                                                                                          ],
                                                                                                                                                                        );
                                                                                                                                                                      else {
                                                                                                                                                                        if (
                                                                                                                                                                          home ===
                                                                                                                                                                          'close-character-voice'
                                                                                                                                                                        )
                                                                                                                                                                          closeEditor();
                                                                                                                                                                        else {
                                                                                                                                                                          if (
                                                                                                                                                                            home ===
                                                                                                                                                                            'upload-character-voice'
                                                                                                                                                                          )
                                                                                                                                                                            ((state2[
                                                                                                                                                                              'pendingCharacterVoiceAssetId'
                                                                                                                                                                            ] =
                                                                                                                                                                              state2[
                                                                                                                                                                                'characterVoiceEditor'
                                                                                                                                                                              ]?.[
                                                                                                                                                                                'assetId'
                                                                                                                                                                              ] ||
                                                                                                                                                                              state2[
                                                                                                                                                                                'selectedAssetId'
                                                                                                                                                                              ] ||
                                                                                                                                                                              ''),
                                                                                                                                                                              (value135 =
                                                                                                                                                                                {
                                                                                                                                                                                  projectToken:
                                                                                                                                                                                    createProjectToken(
                                                                                                                                                                                      state2,
                                                                                                                                                                                    ),
                                                                                                                                                                                  assetId:
                                                                                                                                                                                    state2[
                                                                                                                                                                                      'pendingCharacterVoiceAssetId'
                                                                                                                                                                                    ],
                                                                                                                                                                                  editor:
                                                                                                                                                                                    state2[
                                                                                                                                                                                      'characterVoiceEditor'
                                                                                                                                                                                    ],
                                                                                                                                                                                }),
                                                                                                                                                                              el13?.[
                                                                                                                                                                                'click'
                                                                                                                                                                              ]());
                                                                                                                                                                          else {
                                                                                                                                                                            if (
                                                                                                                                                                              home ===
                                                                                                                                                                              'remove-character-voice'
                                                                                                                                                                            ) {
                                                                                                                                                                              const storyAsset8 =
                                                                                                                                                                                findStoryAsset(
                                                                                                                                                                                  state2,
                                                                                                                                                                                  selectedOnly2[
                                                                                                                                                                                    'closest'
                                                                                                                                                                                  ](
                                                                                                                                                                                    '.story-voice-source-menu',
                                                                                                                                                                                  )
                                                                                                                                                                                    ? state2[
                                                                                                                                                                                        'selectedAssetId'
                                                                                                                                                                                      ]
                                                                                                                                                                                    : state2[
                                                                                                                                                                                        'characterVoiceEditor'
                                                                                                                                                                                      ]?.[
                                                                                                                                                                                        'assetId'
                                                                                                                                                                                      ],
                                                                                                                                                                                );
                                                                                                                                                                              storyAsset8 &&
                                                                                                                                                                                (stopPreview(),
                                                                                                                                                                                clearStoryCharacterVoiceReference(
                                                                                                                                                                                  storyAsset8,
                                                                                                                                                                                ),
                                                                                                                                                                                schedulePersistence(
                                                                                                                                                                                  {
                                                                                                                                                                                    immediate:
                                                                                                                                                                                      !![],
                                                                                                                                                                                  },
                                                                                                                                                                                ),
                                                                                                                                                                                render(),
                                                                                                                                                                                showToast(
                                                                                                                                                                                  '已移除角色声音参考。',
                                                                                                                                                                                  'success',
                                                                                                                                                                                ));
                                                                                                                                                                            } else {
                                                                                                                                                                              if (
                                                                                                                                                                                home ===
                                                                                                                                                                                'toggle-character-voice-history'
                                                                                                                                                                              ) {
                                                                                                                                                                                const el249 =
                                                                                                                                                                                    selectedOnly2[
                                                                                                                                                                                      'closest'
                                                                                                                                                                                    ](
                                                                                                                                                                                      '.story-character-voice-history-wrap',
                                                                                                                                                                                    ),
                                                                                                                                                                                  el250 =
                                                                                                                                                                                    el249?.[
                                                                                                                                                                                      'querySelector'
                                                                                                                                                                                    ](
                                                                                                                                                                                      '.story-character-voice-history-panel',
                                                                                                                                                                                    ),
                                                                                                                                                                                  enabled60 =
                                                                                                                                                                                    !el249?.[
                                                                                                                                                                                      'classList'
                                                                                                                                                                                    ][
                                                                                                                                                                                      'contains'
                                                                                                                                                                                    ](
                                                                                                                                                                                      'is-open',
                                                                                                                                                                                    );
                                                                                                                                                                                (run36(
                                                                                                                                                                                  el249,
                                                                                                                                                                                ),
                                                                                                                                                                                  el249?.[
                                                                                                                                                                                    'classList'
                                                                                                                                                                                  ][
                                                                                                                                                                                    'toggle'
                                                                                                                                                                                  ](
                                                                                                                                                                                    'is-open',
                                                                                                                                                                                    enabled60,
                                                                                                                                                                                  ),
                                                                                                                                                                                  selectedOnly2[
                                                                                                                                                                                    'setAttribute'
                                                                                                                                                                                  ](
                                                                                                                                                                                    'aria-expanded',
                                                                                                                                                                                    String(
                                                                                                                                                                                      enabled60,
                                                                                                                                                                                    ),
                                                                                                                                                                                  ),
                                                                                                                                                                                  el250?.[
                                                                                                                                                                                    'setAttribute'
                                                                                                                                                                                  ](
                                                                                                                                                                                    'aria-hidden',
                                                                                                                                                                                    String(
                                                                                                                                                                                      !enabled60,
                                                                                                                                                                                    ),
                                                                                                                                                                                  ));
                                                                                                                                                                              } else {
                                                                                                                                                                                if (
                                                                                                                                                                                  home ===
                                                                                                                                                                                  'generate-character-voice'
                                                                                                                                                                                )
                                                                                                                                                                                  void generateSelected();
                                                                                                                                                                                else {
                                                                                                                                                                                  if (
                                                                                                                                                                                    home ===
                                                                                                                                                                                    'download-asset-image'
                                                                                                                                                                                  )
                                                                                                                                                                                    void run73(
                                                                                                                                                                                      selectedOnly2,
                                                                                                                                                                                    );
                                                                                                                                                                                  else {
                                                                                                                                                                                    if (
                                                                                                                                                                                      home ===
                                                                                                                                                                                      'add-asset-appearance-to-library'
                                                                                                                                                                                    )
                                                                                                                                                                                      void run74();
                                                                                                                                                                                    else {
                                                                                                                                                                                      if (
                                                                                                                                                                                        home ===
                                                                                                                                                                                        'previous-appearance'
                                                                                                                                                                                      )
                                                                                                                                                                                        run76(
                                                                                                                                                                                          -0x1,
                                                                                                                                                                                          selectedOnly2[
                                                                                                                                                                                            'dataset'
                                                                                                                                                                                          ][
                                                                                                                                                                                            'storyCardAppearanceId'
                                                                                                                                                                                          ] ||
                                                                                                                                                                                            state2[
                                                                                                                                                                                              'selectedAssetId'
                                                                                                                                                                                            ],
                                                                                                                                                                                        );
                                                                                                                                                                                      else {
                                                                                                                                                                                        if (
                                                                                                                                                                                          home ===
                                                                                                                                                                                          'next-appearance'
                                                                                                                                                                                        )
                                                                                                                                                                                          run76(
                                                                                                                                                                                            0x1,
                                                                                                                                                                                            selectedOnly2[
                                                                                                                                                                                              'dataset'
                                                                                                                                                                                            ][
                                                                                                                                                                                              'storyCardAppearanceId'
                                                                                                                                                                                            ] ||
                                                                                                                                                                                              state2[
                                                                                                                                                                                                'selectedAssetId'
                                                                                                                                                                                              ],
                                                                                                                                                                                          );
                                                                                                                                                                                        else {
                                                                                                                                                                                          if (
                                                                                                                                                                                            home ===
                                                                                                                                                                                            'previous-clip'
                                                                                                                                                                                          )
                                                                                                                                                                                            switchSelectedClip(
                                                                                                                                                                                              -0x1,
                                                                                                                                                                                            );
                                                                                                                                                                                          else {
                                                                                                                                                                                            if (
                                                                                                                                                                                              home ===
                                                                                                                                                                                              'next-clip'
                                                                                                                                                                                            )
                                                                                                                                                                                              switchSelectedClip(
                                                                                                                                                                                                0x1,
                                                                                                                                                                                              );
                                                                                                                                                                                            else {
                                                                                                                                                                                              if (
                                                                                                                                                                                                home ===
                                                                                                                                                                                                'previous-video-result'
                                                                                                                                                                                              )
                                                                                                                                                                                                switchSelectedVideoResult(
                                                                                                                                                                                                  -0x1,
                                                                                                                                                                                                );
                                                                                                                                                                                              else {
                                                                                                                                                                                                if (
                                                                                                                                                                                                  home ===
                                                                                                                                                                                                  'next-video-result'
                                                                                                                                                                                                )
                                                                                                                                                                                                  switchSelectedVideoResult(
                                                                                                                                                                                                    0x1,
                                                                                                                                                                                                  );
                                                                                                                                                                                                else {
                                                                                                                                                                                                  if (
                                                                                                                                                                                                    home ===
                                                                                                                                                                                                    'select-video-result'
                                                                                                                                                                                                  )
                                                                                                                                                                                                    selectVideoResult(
                                                                                                                                                                                                      selectedOnly2[
                                                                                                                                                                                                        'dataset'
                                                                                                                                                                                                      ][
                                                                                                                                                                                                        'storyClipId'
                                                                                                                                                                                                      ],
                                                                                                                                                                                                      selectedOnly2[
                                                                                                                                                                                                        'dataset'
                                                                                                                                                                                                      ][
                                                                                                                                                                                                        'storyVideoResultIndex'
                                                                                                                                                                                                      ],
                                                                                                                                                                                                    );
                                                                                                                                                                                                  else {
                                                                                                                                                                                                    if (
                                                                                                                                                                                                      home ===
                                                                                                                                                                                                      'delete-video-result'
                                                                                                                                                                                                    )
                                                                                                                                                                                                      deleteVideoResult(
                                                                                                                                                                                                        selectedOnly2[
                                                                                                                                                                                                          'dataset'
                                                                                                                                                                                                        ][
                                                                                                                                                                                                          'storyClipId'
                                                                                                                                                                                                        ],
                                                                                                                                                                                                        selectedOnly2[
                                                                                                                                                                                                          'dataset'
                                                                                                                                                                                                        ][
                                                                                                                                                                                                          'storyVideoResultIndex'
                                                                                                                                                                                                        ],
                                                                                                                                                                                                      );
                                                                                                                                                                                                    else {
                                                                                                                                                                                                      if (
                                                                                                                                                                                                        home ===
                                                                                                                                                                                                        'capture-video-frame'
                                                                                                                                                                                                      )
                                                                                                                                                                                                        void captureSelected(
                                                                                                                                                                                                          selectedOnly2,
                                                                                                                                                                                                        );
                                                                                                                                                                                                      else {
                                                                                                                                                                                                        if (
                                                                                                                                                                                                          home ===
                                                                                                                                                                                                          'trim-video'
                                                                                                                                                                                                        )
                                                                                                                                                                                                          trimSelected(
                                                                                                                                                                                                            selectedOnly2,
                                                                                                                                                                                                          );
                                                                                                                                                                                                        else {
                                                                                                                                                                                                          if (
                                                                                                                                                                                                            home ===
                                                                                                                                                                                                            'set-base-appearance'
                                                                                                                                                                                                          ) {
                                                                                                                                                                                                            const storyAsset9 =
                                                                                                                                                                                                                findStoryAsset(
                                                                                                                                                                                                                  state2,
                                                                                                                                                                                                                  state2[
                                                                                                                                                                                                                    'selectedAssetId'
                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                ),
                                                                                                                                                                                                              enabled61 =
                                                                                                                                                                                                                storyAsset9
                                                                                                                                                                                                                  ? getSelectedAssetAppearance(
                                                                                                                                                                                                                      state2,
                                                                                                                                                                                                                      storyAsset9,
                                                                                                                                                                                                                    )
                                                                                                                                                                                                                  : null;
                                                                                                                                                                                                            if (
                                                                                                                                                                                                              storyAsset9 &&
                                                                                                                                                                                                              isStoryAssetCardLoading(
                                                                                                                                                                                                                state2,
                                                                                                                                                                                                                storyAsset9[
                                                                                                                                                                                                                  'id'
                                                                                                                                                                                                                ],
                                                                                                                                                                                                              )
                                                                                                                                                                                                            )
                                                                                                                                                                                                              showToast(
                                                                                                                                                                                                                '请等待当前生成任务完成。',
                                                                                                                                                                                                                'info',
                                                                                                                                                                                                              );
                                                                                                                                                                                                            else {
                                                                                                                                                                                                              if (
                                                                                                                                                                                                                !storyAsset9 ||
                                                                                                                                                                                                                !enabled61
                                                                                                                                                                                                              )
                                                                                                                                                                                                                showToast(
                                                                                                                                                                                                                  '当前形象不可用。',
                                                                                                                                                                                                                  'warn',
                                                                                                                                                                                                                );
                                                                                                                                                                                                              else
                                                                                                                                                                                                                setStoryAssetBaseAppearance(
                                                                                                                                                                                                                  storyAsset9,
                                                                                                                                                                                                                  enabled61[
                                                                                                                                                                                                                    'id'
                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                ) &&
                                                                                                                                                                                                                  (refreshAssetCard(
                                                                                                                                                                                                                    storyAsset9[
                                                                                                                                                                                                                      'id'
                                                                                                                                                                                                                    ],
                                                                                                                                                                                                                  ),
                                                                                                                                                                                                                  refreshSelectedAsset(),
                                                                                                                                                                                                                  schedulePersistence(
                                                                                                                                                                                                                    {
                                                                                                                                                                                                                      immediate:
                                                                                                                                                                                                                        !![],
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                  ),
                                                                                                                                                                                                                  showToast(
                                                                                                                                                                                                                    '已设为基础形象；生成后会作为其他形象的参考。',
                                                                                                                                                                                                                    'success',
                                                                                                                                                                                                                  ));
                                                                                                                                                                                                            }
                                                                                                                                                                                                          } else {
                                                                                                                                                                                                            if (
                                                                                                                                                                                                              home ===
                                                                                                                                                                                                              'toggle-all-assets'
                                                                                                                                                                                                            ) {
                                                                                                                                                                                                              const list38 =
                                                                                                                                                                                                                getVisibleStoryAssets(
                                                                                                                                                                                                                  state2,
                                                                                                                                                                                                                );
                                                                                                                                                                                                              ((state2[
                                                                                                                                                                                                                'selectedAssetIds'
                                                                                                                                                                                                              ] =
                                                                                                                                                                                                                toggleStoryAssetSelectAll(
                                                                                                                                                                                                                  state2[
                                                                                                                                                                                                                    'assetFilter'
                                                                                                                                                                                                                  ] ===
                                                                                                                                                                                                                    'library'
                                                                                                                                                                                                                    ? list38[
                                                                                                                                                                                                                        'filter'
                                                                                                                                                                                                                      ](
                                                                                                                                                                                                                        (
                                                                                                                                                                                                                          value462,
                                                                                                                                                                                                                        ) =>
                                                                                                                                                                                                                          [
                                                                                                                                                                                                                            'image',
                                                                                                                                                                                                                            'audio',
                                                                                                                                                                                                                          ][
                                                                                                                                                                                                                            'includes'
                                                                                                                                                                                                                          ](
                                                                                                                                                                                                                            normalizeText(
                                                                                                                                                                                                                              value462?.[
                                                                                                                                                                                                                                'mediaKind'
                                                                                                                                                                                                                              ],
                                                                                                                                                                                                                            )[
                                                                                                                                                                                                                              'toLowerCase'
                                                                                                                                                                                                                            ](),
                                                                                                                                                                                                                          ) &&
                                                                                                                                                                                                                          normalizeText(
                                                                                                                                                                                                                            value462?.[
                                                                                                                                                                                                                              'sourceUrl'
                                                                                                                                                                                                                            ] ||
                                                                                                                                                                                                                              value462?.[
                                                                                                                                                                                                                                'imageUrl'
                                                                                                                                                                                                                              ],
                                                                                                                                                                                                                          ),
                                                                                                                                                                                                                      )
                                                                                                                                                                                                                    : list38,
                                                                                                                                                                                                                  state2[
                                                                                                                                                                                                                    'selectedAssetIds'
                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                )),
                                                                                                                                                                                                                (state2[
                                                                                                                                                                                                                  'assetSelectionMode'
                                                                                                                                                                                                                ] =
                                                                                                                                                                                                                  state2[
                                                                                                                                                                                                                    'selectedAssetIds'
                                                                                                                                                                                                                  ][
                                                                                                                                                                                                                    'length'
                                                                                                                                                                                                                  ] >
                                                                                                                                                                                                                  0x0),
                                                                                                                                                                                                                render(),
                                                                                                                                                                                                                focusWorkspaceAssetCard(
                                                                                                                                                                                                                  storyRoot,
                                                                                                                                                                                                                  state2[
                                                                                                                                                                                                                    'selectedAssetId'
                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                ));
                                                                                                                                                                                                            } else {
                                                                                                                                                                                                              if (
                                                                                                                                                                                                                home ===
                                                                                                                                                                                                                'add-library-assets-to-project'
                                                                                                                                                                                                              ) {
                                                                                                                                                                                                                const el251 =
                                                                                                                                                                                                                    selectedOnly2[
                                                                                                                                                                                                                      'closest'
                                                                                                                                                                                                                    ](
                                                                                                                                                                                                                      '.story-asset-batch-menu-wrap',
                                                                                                                                                                                                                    ),
                                                                                                                                                                                                                  value463 =
                                                                                                                                                                                                                    !el251?.[
                                                                                                                                                                                                                      'classList'
                                                                                                                                                                                                                    ][
                                                                                                                                                                                                                      'contains'
                                                                                                                                                                                                                    ](
                                                                                                                                                                                                                      'is-open',
                                                                                                                                                                                                                    );
                                                                                                                                                                                                                if (
                                                                                                                                                                                                                  value463
                                                                                                                                                                                                                )
                                                                                                                                                                                                                  run40(
                                                                                                                                                                                                                    el251,
                                                                                                                                                                                                                    selectedOnly2,
                                                                                                                                                                                                                  );
                                                                                                                                                                                                                else
                                                                                                                                                                                                                  run35();
                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                if (
                                                                                                                                                                                                                  home ===
                                                                                                                                                                                                                  'cancel-asset-batch-generation'
                                                                                                                                                                                                                )
                                                                                                                                                                                                                  cancel();
                                                                                                                                                                                                                else {
                                                                                                                                                                                                                  if (
                                                                                                                                                                                                                    home ===
                                                                                                                                                                                                                    'batch-generate-assets'
                                                                                                                                                                                                                  ) {
                                                                                                                                                                                                                    (run33(),
                                                                                                                                                                                                                      run34());
                                                                                                                                                                                                                    const value464 =
                                                                                                                                                                                                                      selectedOnly2[
                                                                                                                                                                                                                        'dataset'
                                                                                                                                                                                                                      ][
                                                                                                                                                                                                                        'storyAssetBatchDirectMode'
                                                                                                                                                                                                                      ];
                                                                                                                                                                                                                    if (
                                                                                                                                                                                                                      value464
                                                                                                                                                                                                                    ) {
                                                                                                                                                                                                                      (run35(),
                                                                                                                                                                                                                        void generate(
                                                                                                                                                                                                                          value464,
                                                                                                                                                                                                                        ));
                                                                                                                                                                                                                      return;
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                    const el252 =
                                                                                                                                                                                                                        selectedOnly2[
                                                                                                                                                                                                                          'closest'
                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                          '.story-asset-batch-menu-wrap',
                                                                                                                                                                                                                        ),
                                                                                                                                                                                                                      value465 =
                                                                                                                                                                                                                        !el252?.[
                                                                                                                                                                                                                          'classList'
                                                                                                                                                                                                                        ][
                                                                                                                                                                                                                          'contains'
                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                          'is-open',
                                                                                                                                                                                                                        );
                                                                                                                                                                                                                    if (
                                                                                                                                                                                                                      value465
                                                                                                                                                                                                                    )
                                                                                                                                                                                                                      run40(
                                                                                                                                                                                                                        el252,
                                                                                                                                                                                                                        selectedOnly2,
                                                                                                                                                                                                                      );
                                                                                                                                                                                                                    else
                                                                                                                                                                                                                      run35();
                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                    if (
                                                                                                                                                                                                                      home ===
                                                                                                                                                                                                                      'select-all-clips'
                                                                                                                                                                                                                    ) {
                                                                                                                                                                                                                      const selectedEpisode11 =
                                                                                                                                                                                                                          getSelectedEpisode(
                                                                                                                                                                                                                            state2,
                                                                                                                                                                                                                          ),
                                                                                                                                                                                                                        list39 =
                                                                                                                                                                                                                          (selectedEpisode11?.[
                                                                                                                                                                                                                            'clips'
                                                                                                                                                                                                                          ] ||
                                                                                                                                                                                                                            [])
                                                                                                                                                                                                                            [
                                                                                                                                                                                                                              'map'
                                                                                                                                                                                                                            ](
                                                                                                                                                                                                                              (
                                                                                                                                                                                                                                value466,
                                                                                                                                                                                                                              ) =>
                                                                                                                                                                                                                                normalizeText(
                                                                                                                                                                                                                                  value466?.[
                                                                                                                                                                                                                                    'id'
                                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                                ),
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            [
                                                                                                                                                                                                                              'filter'
                                                                                                                                                                                                                            ](
                                                                                                                                                                                                                              Boolean,
                                                                                                                                                                                                                            );
                                                                                                                                                                                                                      ((state2[
                                                                                                                                                                                                                        'selectedClipGenerationIds'
                                                                                                                                                                                                                      ] =
                                                                                                                                                                                                                        list39[
                                                                                                                                                                                                                          'every'
                                                                                                                                                                                                                        ](
                                                                                                                                                                                                                          (
                                                                                                                                                                                                                            value467,
                                                                                                                                                                                                                          ) =>
                                                                                                                                                                                                                            state2[
                                                                                                                                                                                                                              'selectedClipGenerationIds'
                                                                                                                                                                                                                            ][
                                                                                                                                                                                                                              'includes'
                                                                                                                                                                                                                            ](
                                                                                                                                                                                                                              value467,
                                                                                                                                                                                                                            ),
                                                                                                                                                                                                                        )
                                                                                                                                                                                                                          ? []
                                                                                                                                                                                                                          : list39),
                                                                                                                                                                                                                        (state2[
                                                                                                                                                                                                                          'clipSelectionMode'
                                                                                                                                                                                                                        ] =
                                                                                                                                                                                                                          state2[
                                                                                                                                                                                                                            'selectedClipGenerationIds'
                                                                                                                                                                                                                          ][
                                                                                                                                                                                                                            'length'
                                                                                                                                                                                                                          ] >
                                                                                                                                                                                                                          0x0),
                                                                                                                                                                                                                        run32(),
                                                                                                                                                                                                                        storyRoot[
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
                                                                                                                                                                                                                        home ===
                                                                                                                                                                                                                        'cancel-clip-selection'
                                                                                                                                                                                                                      )
                                                                                                                                                                                                                        (storyMarqueeSelectionController[
                                                                                                                                                                                                                          'cancel'
                                                                                                                                                                                                                        ](),
                                                                                                                                                                                                                          (state2[
                                                                                                                                                                                                                            'clipSelectionMode'
                                                                                                                                                                                                                          ] =
                                                                                                                                                                                                                            ![]),
                                                                                                                                                                                                                          (state2[
                                                                                                                                                                                                                            'selectedClipGenerationIds'
                                                                                                                                                                                                                          ] =
                                                                                                                                                                                                                            []),
                                                                                                                                                                                                                          run32());
                                                                                                                                                                                                                      else {
                                                                                                                                                                                                                        if (
                                                                                                                                                                                                                          home ===
                                                                                                                                                                                                                          'episode-back'
                                                                                                                                                                                                                        )
                                                                                                                                                                                                                          (storyMarqueeSelectionController[
                                                                                                                                                                                                                            'cancel'
                                                                                                                                                                                                                          ](),
                                                                                                                                                                                                                            (state2[
                                                                                                                                                                                                                              'clipSelectionMode'
                                                                                                                                                                                                                            ] =
                                                                                                                                                                                                                              ![]),
                                                                                                                                                                                                                            (state2[
                                                                                                                                                                                                                              'selectedClipGenerationIds'
                                                                                                                                                                                                                            ] =
                                                                                                                                                                                                                              []),
                                                                                                                                                                                                                            void run55(
                                                                                                                                                                                                                              canEnterStoryWorkspaceStep(
                                                                                                                                                                                                                                state2[
                                                                                                                                                                                                                                  'data'
                                                                                                                                                                                                                                ],
                                                                                                                                                                                                                                0x3,
                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                ? 0x3
                                                                                                                                                                                                                                : 0x1,
                                                                                                                                                                                                                            ));
                                                                                                                                                                                                                        else {
                                                                                                                                                                                                                          if (
                                                                                                                                                                                                                            home ===
                                                                                                                                                                                                                            'toggle-canvas-sync-menu'
                                                                                                                                                                                                                          ) {
                                                                                                                                                                                                                            const el253 =
                                                                                                                                                                                                                                selectedOnly2[
                                                                                                                                                                                                                                  'closest'
                                                                                                                                                                                                                                ](
                                                                                                                                                                                                                                  '.story-canvas-sync-menu-wrap',
                                                                                                                                                                                                                                ),
                                                                                                                                                                                                                              value468 =
                                                                                                                                                                                                                                !el253?.[
                                                                                                                                                                                                                                  'classList'
                                                                                                                                                                                                                                ][
                                                                                                                                                                                                                                  'contains'
                                                                                                                                                                                                                                ](
                                                                                                                                                                                                                                  'is-open',
                                                                                                                                                                                                                                );
                                                                                                                                                                                                                            run35();
                                                                                                                                                                                                                            if (
                                                                                                                                                                                                                              value468
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                              run41(
                                                                                                                                                                                                                                el253,
                                                                                                                                                                                                                                selectedOnly2,
                                                                                                                                                                                                                              );
                                                                                                                                                                                                                            else
                                                                                                                                                                                                                              run6();
                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                            if (
                                                                                                                                                                                                                              home ===
                                                                                                                                                                                                                              'sync-episode-to-canvas'
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                              (run6(),
                                                                                                                                                                                                                                void addSelectedEpisode());
                                                                                                                                                                                                                            else {
                                                                                                                                                                                                                              if (
                                                                                                                                                                                                                                home ===
                                                                                                                                                                                                                                'sync-project-to-canvas'
                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                (run6(),
                                                                                                                                                                                                                                  void addProject());
                                                                                                                                                                                                                              else {
                                                                                                                                                                                                                                if (
                                                                                                                                                                                                                                  home ===
                                                                                                                                                                                                                                  'export-current-clip'
                                                                                                                                                                                                                                ) {
                                                                                                                                                                                                                                  const value469 =
                                                                                                                                                                                                                                    selectedOnly2[
                                                                                                                                                                                                                                      'closest'
                                                                                                                                                                                                                                    ](
                                                                                                                                                                                                                                      '.story-clip-export-menu-wrap',
                                                                                                                                                                                                                                    )?.[
                                                                                                                                                                                                                                      'querySelector'
                                                                                                                                                                                                                                    ](
                                                                                                                                                                                                                                      '.story-menu-trigger',
                                                                                                                                                                                                                                    );
                                                                                                                                                                                                                                  (run6(),
                                                                                                                                                                                                                                    void run72(
                                                                                                                                                                                                                                      'current',
                                                                                                                                                                                                                                      value469,
                                                                                                                                                                                                                                    ));
                                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                                  if (
                                                                                                                                                                                                                                    home ===
                                                                                                                                                                                                                                    'export-episode-clips'
                                                                                                                                                                                                                                  ) {
                                                                                                                                                                                                                                    const value470 =
                                                                                                                                                                                                                                      selectedOnly2[
                                                                                                                                                                                                                                        'closest'
                                                                                                                                                                                                                                      ](
                                                                                                                                                                                                                                        '.story-clip-export-menu-wrap',
                                                                                                                                                                                                                                      )?.[
                                                                                                                                                                                                                                        'querySelector'
                                                                                                                                                                                                                                      ](
                                                                                                                                                                                                                                        '.story-menu-trigger',
                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                    (run6(),
                                                                                                                                                                                                                                      void run72(
                                                                                                                                                                                                                                        'episode',
                                                                                                                                                                                                                                        value470,
                                                                                                                                                                                                                                      ));
                                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                                    if (
                                                                                                                                                                                                                                      home ===
                                                                                                                                                                                                                                      'cancel-clip-batch-generation'
                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                      void runtime[
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
                                                                                                                                                                                                                                          home,
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
                                                                                                                                                                                                                                                  home ===
                                                                                                                                                                                                                                                    'debug-asset-image'
                                                                                                                                                                                                                                                    ? applyImageResult[
                                                                                                                                                                                                                                                        'previewSelected'
                                                                                                                                                                                                                                                      ]()
                                                                                                                                                                                                                                                    : home ===
                                                                                                                                                                                                                                                        'debug-character-voice'
                                                                                                                                                                                                                                                      ? storyCharacterVoiceWorkspaceController[
                                                                                                                                                                                                                                                          'previewSelected'
                                                                                                                                                                                                                                                        ]()
                                                                                                                                                                                                                                                      : runtime[
                                                                                                                                                                                                                                                          'previewSelection'
                                                                                                                                                                                                                                                        ](),
                                                                                                                                                                                                                                                ),
                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                        return;
                                                                                                                                                                                                                                      } else {
                                                                                                                                                                                                                                        if (
                                                                                                                                                                                                                                          home ===
                                                                                                                                                                                                                                          'generate-clip-video'
                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                          void generateSelection();
                                                                                                                                                                                                                                        else
                                                                                                                                                                                                                                          home ===
                                                                                                                                                                                                                                            'generate-asset' &&
                                                                                                                                                                                                                                            (selectedOnly2[
                                                                                                                                                                                                                                              'dataset'
                                                                                                                                                                                                                                            ][
                                                                                                                                                                                                                                              'storyCardAppearanceId'
                                                                                                                                                                                                                                            ] &&
                                                                                                                                                                                                                                              (updateStoryAssetPromptFromEditor(
                                                                                                                                                                                                                                                state2,
                                                                                                                                                                                                                                                run28()?.[
                                                                                                                                                                                                                                                  'querySelector'
                                                                                                                                                                                                                                                ](
                                                                                                                                                                                                                                                  '[data-story-asset-prompt][contenteditable="true"]',
                                                                                                                                                                                                                                                ),
                                                                                                                                                                                                                                              ),
                                                                                                                                                                                                                                              stopPreview(),
                                                                                                                                                                                                                                              (state2[
                                                                                                                                                                                                                                                'characterVoiceEditor'
                                                                                                                                                                                                                                              ] =
                                                                                                                                                                                                                                                null),
                                                                                                                                                                                                                                              (state2[
                                                                                                                                                                                                                                                'pendingDeleteAssetAppearanceKey'
                                                                                                                                                                                                                                              ] =
                                                                                                                                                                                                                                                ''),
                                                                                                                                                                                                                                              (state2[
                                                                                                                                                                                                                                                'selectedAssetId'
                                                                                                                                                                                                                                              ] =
                                                                                                                                                                                                                                                selectedOnly2[
                                                                                                                                                                                                                                                  'dataset'
                                                                                                                                                                                                                                                ][
                                                                                                                                                                                                                                                  'storyCardAppearanceId'
                                                                                                                                                                                                                                                ]),
                                                                                                                                                                                                                                              refreshSelectedAsset()),
                                                                                                                                                                                                                                            void generateSelected2());
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
      if (coordinator['getRevision']() === value445) schedulePersistence({ action: home });
    }),
    storyRoot['addEventListener']('input', (root) => {
      if (root['target']['matches']('[data-story-custom-episode-count-input]')) {
        const value471 = String(root['target']['value'] || '')
          ['replace'](/\D+/gu, '')
          ['slice'](0x0, 0x3);
        root['target']['value'] =
          value471 && Number(value471) > STORY_EPISODE_COUNT_MAX ? String(STORY_EPISODE_COUNT_MAX) : value471;
        return;
      }
      if (root['target']['matches']('[data-story-clip-adjustment-instruction]')) {
        state2['clipAdjustmentInstruction'] = String(root['target']['value'] || '')['slice'](0x0, 0x258);
        const selectedEpisode12 = getSelectedEpisode(state2),
          selectedClip9 = getSelectedClip(state2, selectedEpisode12),
          storyPromptMode = normalizeStoryPromptMode(
            selectedClip9?.['promptMode'] ||
              selectedEpisode12?.['promptMode'] ||
              state2['data']['project']?.['planning']?.['promptMode'],
            { allowDeveloperModes: !![] },
          ),
          storyPromptMode2 = normalizeStoryPromptMode(state2['clipAdjustmentPromptMode'] || storyPromptMode, {
            allowDeveloperModes: !![],
          }),
          el254 = root['target']
            ['closest']('[data-story-clip-adjustment-bar]')
            ?.['querySelector']('[data-story-action=\x22generate-clip-adjustment\x22]');
        el254 &&
          (el254['disabled'] = !canGenerateStoryClipAdjustment(state2, selectedEpisode12, selectedClip9));
        return;
      }
      if (root['target']['matches']('[data-story-project-search]')) {
        const list40 = String(root['target']['value'] || '')['slice'](0x0, 0x78);
        ((state2['projectSearchQuery'] = list40),
          (state2['openProjectMenuId'] = ''),
          (root['target']['value'] = list40));
        const refreshWorkspaceProjectResultsInPlace2 = refreshWorkspaceProjectResultsInPlace({
          root: root['target']['closest']?.('.story-home-page') || storyRoot,
          documentObject: documentObject,
          renderResults: () => renderStoryHomeProjectResults(state2),
        });
        if (!refreshWorkspaceProjectResultsInPlace2) render({ capturePageState: ![] });
        const el255 = refreshWorkspaceProjectResultsInPlace2
          ? root['target']
          : storyRoot['querySelector']('[data-story-project-search]');
        (el255?.['focus'](), el255?.['setSelectionRange']?.(list40['length'], list40['length']));
        return;
      }
      if (root['target']['matches']('[data-story-character-voice-sample]')) {
        state2['characterVoiceEditor'] &&
          (state2['characterVoiceEditor']['sampleText'] = String(root['target']['value'] || '')['slice'](
            0x0,
            STORY_CHARACTER_VOICE_SAMPLE_MAX_CHARACTERS,
          ));
        return;
      }
      if (root['target']['matches']('[data-story-character-voice-description]')) {
        state2['characterVoiceEditor'] &&
          (state2['characterVoiceEditor']['voiceDescription'] = String(root['target']['value'] || '')[
            'slice'
          ](0x0, 0x258));
        return;
      }
      if (root['target']['matches']('[data-story-style-search-input]')) {
        run44(root['target']['closest']('.story-style-picker'));
        return;
      }
      if (root['target']['matches']('[data-story-style-custom-input]')) {
        const list41 = String(root['target']['value'] || '')['slice'](0x0, STORY_CUSTOM_STYLE_MAX_CHARACTERS);
        if (root['target']['value'] !== list41) root['target']['value'] = list41;
        const el256 = root['target']
          ['closest']('.story-style-custom-editor')
          ?.['querySelector']('[data-story-style-custom-count]');
        if (el256) el256['textContent'] = list41['length'] + '\x20/\x20' + STORY_CUSTOM_STYLE_MAX_CHARACTERS;
        return;
      }
      if (root['target']['matches']('[data-story-idea-input]'))
        ((state2['idea'] = root['target']['value']['slice'](0x0, STORY_IDEA_MAX_CHARACTERS)),
          syncGenerateState());
      else {
        if (root['target']['matches']('[data-story-paste-input]')) {
          ((state2['scriptText'] = root['target']['value']['slice'](0x0, STORY_SCRIPT_MAX_CHARACTERS)),
            (state2['scriptCharacterCount'] = state2['scriptText']['length']),
            (state2['scriptFileName'] = normalizeText(state2['scriptText']) ? '粘贴文本' : ''));
          if (!state2['hasCreatedProject'])
            state2['data']['project']['sourceDocument'] = normalizeText(state2['scriptText'])
              ? {
                  fileName: '粘贴文本',
                  text: state2['scriptText'],
                  characterCount: state2['scriptText']['length'],
                }
              : null;
          syncGenerateState();
        } else {
          if (root['target']['matches']('[data-story-outline-field]')) {
            const value472 = {
                'story-type': 'storyType',
                'story-target-audience': 'targetAudience',
                'story-logline': 'logline',
                'story-summary': 'summary',
                'story-background': 'background',
                'story-setting': 'setting',
                'story-core-hook': 'coreHook',
              },
              value473 = value472[root['target']['dataset']['storyOutlineField']];
            value473 &&
              ((state2['data']['project'][value473] = root['target']['value']),
              markStorySummaryDownstreamStale(state2['data']));
          } else {
            if (root['target']['matches']('[data-story-contract-field]')) {
              const text50 = normalizeText(root['target']['dataset']['storyContractField']);
              Object['hasOwn'](STORY_CONTRACT_FIELD_LABELS, text50) &&
                ((state2['data']['project']['storyContract'] ||= normalizeGeneratedStoryContract()),
                (state2['data']['project']['storyContract'][text50] = root['target']['value']),
                markStorySummaryDownstreamStale(state2['data']));
            } else {
              if (root['target']['matches']('[data-story-plot-beat-index][data-story-plot-beat-field]')) {
                const value474 = Number(root['target']['dataset']['storyPlotBeatIndex']),
                  text51 = normalizeText(root['target']['dataset']['storyPlotBeatField']),
                  value475 = state2['data']['project']?.['plotBeats']?.[value474];
                value475 &&
                  ['stage', 'event', 'consequence']['includes'](text51) &&
                  ((value475[text51] = root['target']['value']),
                  markStorySummaryDownstreamStale(state2['data']));
              } else {
                if (root['target']['matches']('[data-story-continuity-facts]'))
                  ((state2['data']['project']['continuityFacts'] = normalizeGeneratedStoryContinuityFacts(
                    String(root['target']['value'] || '')['split'](/\r?\n/u),
                  )),
                    markStorySummaryDownstreamStale(state2['data']));
                else {
                  if (root['target']['matches']('[data-story-summary-character-field]'))
                    updateStorySummaryCharacterField(
                      state2['data']['project']?.['characters'],
                      Number(root['target']['dataset']['storySummaryCharacterIndex']),
                      root['target']['dataset']['storySummaryCharacterField'],
                      root['target']['value'],
                    ) && markStorySummaryDownstreamStale(state2['data']);
                  else {
                    if (
                      root['target']['matches']('[data-story-episode-synopsis], [data-story-episode-hook]')
                    ) {
                      const value476 = root['target']['matches']('[data-story-episode-hook]')
                          ? 'hook'
                          : 'synopsis',
                        value477 =
                          value476 === 'hook'
                            ? root['target']['dataset']['storyEpisodeHook']
                            : root['target']['dataset']['storyEpisodeSynopsis'];
                      updateStoryEpisodeOutlineField(
                        state2['data'],
                        value477,
                        value476,
                        root['target']['value'],
                      ) && syncCompiledScripts();
                    } else {
                      if (root['target']['matches']('[data-story-episode-script]')) {
                        const value478 = state2['data']['episodes']['find'](
                          (value479) => value479['id'] === root['target']['dataset']['storyEpisodeScript'],
                        );
                        updateStoryEpisodeScriptText(value478, root['target']['value']) &&
                          syncCompiledScripts();
                      } else {
                        if (root['target']['matches']('[data-story-chapter-title]')) {
                          const value480 =
                            state2['data']['project']['chapters']?.[
                              Number(root['target']['dataset']['storyChapterTitle'])
                            ];
                          value480 &&
                            ((value480['title'] = root['target']['value']),
                            syncProjectChapterContent(state2['data']['project']));
                        } else {
                          if (root['target']['matches']('[data-story-chapter-content]')) {
                            const value481 =
                              state2['data']['project']['chapters']?.[
                                Number(root['target']['dataset']['storyChapterContent'])
                              ];
                            value481 &&
                              ((value481['content'] = root['target']['value']),
                              syncProjectChapterContent(state2['data']['project']));
                          } else {
                            if (root['target']['matches']('[data-story-clip-prompt]')) {
                              clearStoryClipAdjustmentUndo(
                                getSelectedClip(state2, getSelectedEpisode(state2)),
                              );
                              if (shouldSkipPromptTriggerForBulkInput(root)) return;
                              (updateSelectedClipPrompt(state2, root['target']['innerHTML']),
                                refreshReferenceSummary());
                            } else {
                              if (root['target']['matches']('[data-story-asset-prompt]')) {
                                if (shouldSkipPromptTriggerForBulkInput(root)) return;
                                updateStoryAssetPromptFromEditor(state2, root['target']);
                              } else {
                                if (root['target']['matches']('[data-story-model-search-input]')) {
                                  const text52 = normalizeText(root['target']['value'])['toLowerCase'](),
                                    el257 = root['target']['closest']('.story-model-picker');
                                  el257?.['querySelectorAll']('[data-story-model-option]')['forEach'](
                                    (el258) => {
                                      el258['hidden'] =
                                        Boolean(text52) &&
                                        !String(el258['dataset']['storyModelSearch'] || '')['includes'](
                                          text52,
                                        );
                                    },
                                  );
                                  return;
                                } else {
                                  if (root['target']['matches']('[data-story-project-title]')) {
                                    const value482 = String(root['target']['value'] || '')['slice'](
                                        0x0,
                                        0x78,
                                      ),
                                      value483 = root['target']['dataset']['storyProjectTitle'],
                                      value484 = state2['projects']['find'](
                                        (value485) => String(value485?.['id']) === String(value483),
                                      );
                                    (value484?.['data']?.['project'] &&
                                      ((value484['data']['project']['title'] = value482),
                                      (value484['title'] = value482),
                                      (value484['projectTitleEdited'] = !![]),
                                      (value484['updatedAt'] = Date['now']())),
                                      String(state2['data']['project']?.['id']) === String(value483) &&
                                        ((state2['data']['project']['title'] = value482),
                                        (state2['projectTitleEdited'] = !![])));
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
      schedulePersistence();
    }),
    storyRoot['addEventListener']('change', (event29) => {
      if (event29['target']['matches']('[data-story-custom-episode-count-input]')) {
        run49(event29['target']);
        return;
      }
      if (!event29['target']['matches']('[data-story-project-title]')) return;
      const text53 = normalizeText(event29['target']['value']) || '未命名故事',
        value486 = event29['target']['dataset']['storyProjectTitle'],
        value487 = state2['projects']['find']((value488) => String(value488?.['id']) === String(value486));
      (value487?.['data']?.['project'] &&
        ((value487['data']['project']['title'] = text53),
        (value487['title'] = text53),
        (value487['projectTitleEdited'] = !![]),
        (value487['updatedAt'] = Date['now']())),
        String(state2['data']['project']?.['id']) === String(value486) &&
          ((state2['data']['project']['title'] = text53), (state2['projectTitleEdited'] = !![])),
        (event29['target']['value'] = text53),
        schedulePersistence({ immediate: !![] }));
    }),
    el9?.['addEventListener']('change', async () => {
      const enabled62 = el9['files']?.[0x0];
      if (!enabled62) return;
      (await selectScriptFile(enabled62), (el9['value'] = ''));
    }));
  function run83(list42 = []) {
    const list43 = Array['from'](list42 || []),
      list44 = [];
    list43['forEach']((value489) => {
      const response10 = validateStoryReplicationVideoFile(value489, state2['models']['text']);
      if (response10['ok']) list44['push'](value489);
      else showToast(response10['error'], 'warn');
    });
    if (!list44['length']) return ![];
    const list45 = state2['replicationSourceFiles'],
      value490 = state2['replicationSourcePreviewUrls'];
    state2['replicationSourceFiles'] = mergeStoryReplicationSourceFiles(
      list45,
      list44,
      state2['models']['text'],
    );
    const map11 = new Map(list45['map']((value491, value492) => [value491, value490[value492] || '']));
    state2['replicationSourcePreviewUrls'] = state2['replicationSourceFiles']['map'](
      (value493) => map11['get'](value493) || createSourcePreviewUrl(value493),
    );
    const value494 = viewportElement['querySelector']('.story-page.is-current .story-home-composer-body');
    return (
      value494 && state2['view'] === 'home' && state2['homeTab'] === 'replication'
        ? (syncStoryReplicationHomeSources(value494, state2), syncGenerateState())
        : render({ capturePageState: ![] }),
      !![]
    );
  }
  el10?.['addEventListener']('change', () => {
    const episodeId7 = value139;
    value139 = '';
    if (episodeId7 && state2['data']?.['project']?.['sourceMode'] === 'video-replication') {
      const file = el10['files']?.[0x0],
        response11 = validateStoryReplicationVideoFile(file, state2['models']['text']);
      if (!response11['ok']) showToast(response11['error'], 'warn');
      else {
        const value495 = createProjectToken(state2),
          text54 = normalizeText(value495['projectId']);
        (replicationSourceFileByEpisodeKey['set'](text54 + ':' + episodeId7, file),
          void runAnalysis(value495, [{ episodeId: episodeId7, file: file }]));
      }
      el10['value'] = '';
      return;
    }
    (run83(el10['files']), (el10['value'] = ''));
  });
  const args38 = createStoryAssetImageUploadController({
      state: state2,
      createProjectToken: () => createProjectToken(state2),
      isProjectTaskLive: isLive,
      isProjectTaskCurrent: isCurrent3,
      getSelectedAppearance: getSelectedAssetAppearance,
      isLoading: isStoryAssetAppearanceLoading,
      setGenerating: setStoryAssetAppearanceGenerating,
      startTask: startBackgroundTask,
      finishTask: finishBackgroundTask,
      applyImageResult: applyImageResult['applyImageResult'],
      showToast: showToast,
      refresh: (value496) => {
        refreshAssetCard(value496);
        if (state2['selectedAssetId'] === value496) refreshSelectedAsset();
      },
    }),
    bindStoryAssetImageDrop2 = bindStoryAssetImageDrop(storyRoot, { state: state2, ...args38 });
  (el11?.['addEventListener']('change', async () => {
    const value497 = el11['files']?.[0x0],
      value498 = value133;
    ((value133 = null),
      (state2['pendingAssetUploadId'] = ''),
      (state2['pendingAssetAppearanceId'] = ''),
      (el11['value'] = ''),
      await args38['upload'](value497, value498));
  }),
    el12?.['addEventListener']('change', async () => {
      const error17 = el12['files']?.[0x0],
        value499 = value134;
      value134 = null;
      const enabled63 = value499?.['projectToken'],
        assetId6 = enabled63?.['data']?.['assets']?.['find'](
          (value500) => normalizeText(value500?.['id']) === normalizeText(value499['assetId']),
        ),
        appearanceId3 = getStoryAssetAppearances(assetId6)['find'](
          (value501) => normalizeText(value501?.['id']) === normalizeText(value499?.['appearanceId']),
        ),
        text55 = normalizeText(error17?.['name'])['toLowerCase'](),
        enabled64 =
          String(error17?.['type'] || '')
            ['toLowerCase']()
            ['startsWith']('image/') || /\.(?:avif|bmp|gif|jpe?g|png|webp)$/u['test'](text55);
      if (!error17 || !enabled63 || !assetId6 || !appearanceId3 || !isLive(enabled63)) {
        el12['value'] = '';
        return;
      }
      if (!enabled64) {
        isCurrent3(enabled63) && showToast('风格参考只支持图片文件。', 'warn');
        el12['value'] = '';
        return;
      }
      if (!isStoryAssetBaseAppearance(assetId6, appearanceId3)) {
        isCurrent3(enabled63) && showToast('当前形象已不再是基础形象，风格参考未上传。', 'warn');
        el12['value'] = '';
        return;
      }
      const id6 = buildStoryBackgroundTaskId('asset-reference-image-upload', {
        assetId: assetId6['id'],
        appearanceId: appearanceId3['id'],
      });
      isCurrent3(enabled63) &&
        (setStoryAssetAppearanceGenerating(state2, assetId6['id'], appearanceId3['id'], !![]), render());
      startBackgroundTask(enabled63, {
        id: id6,
        type: 'asset-image-upload',
        scope: { assetId: assetId6['id'], appearanceId: appearanceId3['id'] },
        label: '上传' + (normalizeText(assetId6['name']) || '基础形象') + '风格参考',
        message: '正在保存风格参考',
      });
      try {
        const uploadFile2 = await uploadFile(error17, enabled63['projectId']);
        if (!isLive(enabled63)) return;
        if (!buildCanvasLocalImageFields(uploadFile2)['imageUrl'])
          throw new Error('风格参考保存结果缺少可用地址');
        (setStoryAssetAppearanceReferenceImage(appearanceId3, uploadFile2),
          finishBackgroundTask(enabled63, id6, { status: 'succeeded', message: '风格参考已保存' }),
          isCurrent3(enabled63) && (render(), showToast('风格参考已上传，并已补充提示词。', 'success')));
      } catch (error18) {
        if (!isLive(enabled63)) return;
        (finishBackgroundTask(enabled63, id6, {
          status: 'failed',
          message: '风格参考保存失败',
          error: error18?.['message'] || '风格参考上传失败，请稍后重试。',
        }),
          isCurrent3(enabled63) &&
            showToast(error18?.['message'] || '风格参考上传失败，请稍后重试。', 'error'));
      } finally {
        (isCurrent3(enabled63) &&
          (setStoryAssetAppearanceGenerating(state2, assetId6['id'], appearanceId3['id'], ![]), render()),
          (el12['value'] = ''));
      }
    }));
  async function run84(fileName, value502) {
    const value503 = value136 || {};
    value136 = null;
    const value504 = value503['projectToken'] || createProjectToken(state2),
      assetId7 = value504['data']?.['assets']?.['find'](
        (value505) => normalizeText(value505?.['id']) === normalizeText(value502),
      );
    if (!fileName || !assetId7 || assetId7['kind'] !== 'character') return;
    const value506 = isCurrent3(value504) ? state2 : deriveStoryProjectTaskState(value504['data']);
    if (isStoryAssetVoiceLoading(value506, assetId7['id'])) {
      isCurrent3(value504) && showToast('请等待当前生成任务完成。', 'info');
      return;
    }
    const sampleText =
      value503['editor']?.['assetId'] === assetId7['id']
        ? value503['editor']
        : state2['characterVoiceEditor']?.['assetId'] === assetId7['id']
          ? state2['characterVoiceEditor']
          : null;
    if (!isSupportedStoryCharacterVoiceFile(fileName)) {
      sampleText && (sampleText['error'] = '仅支持\x20MP3、WAV\x20或\x20M4A\x20音频文件。');
      if (isCurrent3(value504)) render();
      return;
    }
    const id7 = buildStoryBackgroundTaskId('asset-voice-upload', { assetId: assetId7['id'] });
    isCurrent3(value504) &&
      (setStoryAssetVoiceGenerating(state2, assetId7['id'], !![]),
      state2['characterVoiceEditor']?.['assetId'] === assetId7['id'] &&
        (state2['characterVoiceEditor']['isGenerating'] = !![]),
      render());
    startBackgroundTask(value504, {
      id: id7,
      type: 'asset-voice-upload',
      scope: { assetId: assetId7['id'] },
      label: '上传' + (normalizeText(assetId7['name']) || '角色') + '声音',
      message: '正在保存本地音频',
    });
    try {
      const audioUrl = await uploadFile(fileName, value504['projectId']);
      if (!isLive(value504)) return ![];
      const storyCharacterVoiceReference = normalizeStoryCharacterVoiceReference({
        source: 'upload',
        audioUrl:
          audioUrl?.['displayUrl'] ||
          audioUrl?.['url'] ||
          audioUrl?.['originalUrl'] ||
          audioUrl?.['localUrl'],
        localPath: audioUrl?.['localPath'] || audioUrl?.['originalLocalPath'] || audioUrl?.['path'],
        fileName: fileName['name'],
        sampleText: sampleText?.['sampleText'],
        voiceDescription: sampleText?.['voiceDescription'],
        updatedAt: Date['now'](),
      });
      if (!storyCharacterVoiceReference) throw new Error('音频保存结果缺少可用地址');
      if (isCurrent3(value504)) stopPreview();
      return (
        replaceStoryCharacterVoiceReference(assetId7, storyCharacterVoiceReference),
        finishBackgroundTask(value504, id7, { status: 'succeeded', message: '本地音频已保存' }),
        isCurrent3(value504) &&
          (state2['characterVoiceEditor']?.['assetId'] === assetId7['id'] &&
            (state2['characterVoiceEditor']['error'] = ''),
          render(),
          showToast('角色声音参考已上传。', 'success')),
        !![]
      );
    } catch (error19) {
      if (!isLive(value504)) return ![];
      return (
        sampleText && (sampleText['error'] = error19?.['message'] || '声音参考上传失败。'),
        finishBackgroundTask(value504, id7, {
          status: 'failed',
          message: '本地音频保存失败',
          error: error19?.['message'] || '声音参考上传失败。',
        }),
        isCurrent3(value504) &&
          (state2['characterVoiceEditor']?.['assetId'] === assetId7['id'] &&
            (state2['characterVoiceEditor']['error'] = error19?.['message'] || '声音参考上传失败。'),
          render()),
        ![]
      );
    } finally {
      isCurrent3(value504) &&
        (setStoryAssetVoiceGenerating(state2, assetId7['id'], ![]),
        state2['characterVoiceEditor']?.['assetId'] === assetId7['id'] &&
          (state2['characterVoiceEditor']['isGenerating'] = ![]),
        render());
    }
  }
  (el13?.['addEventListener']('change', async () => {
    const value507 = el13['files']?.[0x0],
      value508 = value135 || {
        projectToken: createProjectToken(state2),
        assetId: state2['pendingCharacterVoiceAssetId'],
        editor: state2['characterVoiceEditor'],
      };
    ((value135 = null),
      (state2['pendingCharacterVoiceAssetId'] = ''),
      (value136 = value508),
      await run84(value507, value508['assetId']),
      (el13['value'] = ''));
  }),
    el14?.['addEventListener']('change', async () => {
      const value509 = el14['files']?.[0x0];
      (await uploadSelectedInput(value509), (el14['value'] = ''));
    }),
    storyRoot['addEventListener']('dragover', (event30) => {
      if (projectPackages?.['hasProjectPackageDrag']?.(event30['dataTransfer'])) {
        (event30['preventDefault'](), event30['stopPropagation']());
        if (event30['dataTransfer']) event30['dataTransfer']['dropEffect'] = 'copy';
        return;
      }
      const el259 = event30['target']['closest']('[data-story-replication-grid]');
      if (el259 && text16) {
        (event30['preventDefault'](), event30['stopPropagation']());
        if (event30['dataTransfer']) event30['dataTransfer']['dropEffect'] = 'move';
        const value510 = [...el259['querySelectorAll']('article[data-story-replication-episode-id]')]['find'](
            (el260) => normalizeText(el260['dataset']['storyReplicationEpisodeId']) === text16,
          ),
          value511 = event30['target']['closest']('article[data-story-replication-episode-id]');
        value510 &&
          value511 &&
          value511 !== value510 &&
          previewReplicationCardOrder(el259, value510, value511);
        return;
      }
      const el261 = event30['target']['closest']('[data-story-clip-prompt-surface]');
      if (el261 && (value138 || hasStoryAssetDragData(event30['dataTransfer']))) {
        (event30['preventDefault'](), event30['stopPropagation']());
        if (event30['dataTransfer']) event30['dataTransfer']['dropEffect'] = 'copy';
        (el261['classList']['add']('is-story-asset-drop-target'),
          showCaret(el261['querySelector']?.('[data-story-clip-prompt]'), event30));
        return;
      }
      const el262 = event30['target']['closest']('[data-story-character-voice-drop]');
      if (el262) {
        (event30['preventDefault'](), event30['stopPropagation']());
        if (event30['dataTransfer']) event30['dataTransfer']['dropEffect'] = 'copy';
        el262['classList']['add']('is-dragover');
        return;
      }
      const el263 = event30['target']['closest']('[data-story-replication-drop]');
      if (el263) {
        (event30['preventDefault'](), event30['stopPropagation']());
        if (event30['dataTransfer']) event30['dataTransfer']['dropEffect'] = 'copy';
        el263['classList']['add']('is-dragover');
        return;
      }
      handleStoryHomeDocumentDragOver(event30);
    }),
    storyRoot['addEventListener']('dragleave', (event31) => {
      const el264 = event31['target']['closest']('[data-story-clip-prompt-surface]');
      el264 &&
        !el264['contains'](event31['relatedTarget']) &&
        (el264['classList']['remove']('is-story-asset-drop-target'), hideCaret());
      const el265 = event31['target']['closest']('[data-story-character-voice-drop]');
      el265 && !el265['contains'](event31['relatedTarget']) && el265['classList']['remove']('is-dragover');
      handleStoryHomeDocumentDragLeave(event31);
      const el266 = event31['target']['closest']('[data-story-replication-drop]');
      el266 && !el266['contains'](event31['relatedTarget']) && el266['classList']['remove']('is-dragover');
    }),
    storyRoot['addEventListener']('drop', async (event32) => {
      if (projectPackages?.['importProjectFromDrop']?.(event32)) return;
      const el267 = event32['target']['closest']('[data-story-replication-grid]');
      if (el267 && text16) {
        (event32['preventDefault'](), event32['stopPropagation']());
        const value512 = [...el267['querySelectorAll']('article[data-story-replication-episode-id]')]['map'](
          (el268) => normalizeText(el268['dataset']['storyReplicationEpisodeId']),
        );
        (settleReplicationCardMotion(el267),
          (state2['data']['episodes'] = reorderStoryVideoReplicationEpisodes(
            state2['data']['episodes'],
            value512,
          )),
          syncStoryVideoReplicationProject(state2['data']),
          state2['data']['episodes']['forEach']((value513, value514) => {
            const value515 = [...el267['querySelectorAll']('article[data-story-replication-episode-id]')][
              'find'
            ]((el269) => normalizeText(el269['dataset']['storyReplicationEpisodeId']) === value513['id']);
            syncStoryVideoReplicationCardElement(value515, value513, value514);
          }),
          el267['querySelectorAll']('.story-replication-card.is-reordering')['forEach']((el270) =>
            el270['classList']['remove']('is-reordering'),
          ),
          (text16 = ''),
          (list18 = []),
          el267['classList']['remove']('is-reordering'),
          schedulePersistence({ immediate: !![] }));
        return;
      }
      const el271 = event32['target']['closest']('[data-story-clip-prompt-surface]'),
        storyAssetDragData = readStoryAssetDragData(event32['dataTransfer']) || value138,
        assetIndex2 = readStoryAssetDragItemIndex(event32['dataTransfer']) || value140;
      if (el271 && storyAssetDragData) {
        (event32['preventDefault'](), event32['stopPropagation']());
        const value516 = el271['querySelector']?.('[data-story-clip-prompt]'),
          triggerRange2 = showCaret(value516, event32);
        run18();
        !insertMention(storyAssetDragData, { assetIndex: assetIndex2, triggerRange: triggerRange2 }) &&
          showToast('素材引用添加失败，请重试。', 'error');
        return;
      }
      const el272 = event32['target']['closest']('[data-story-character-voice-drop]');
      if (el272) {
        (event32['preventDefault'](),
          event32['stopPropagation'](),
          el272['classList']['remove']('is-dragover'));
        const value517 = event32['dataTransfer']?.['files']?.[0x0];
        await run84(value517, state2['characterVoiceEditor']?.['assetId']);
        return;
      }
      const el273 = event32['target']['closest']('[data-story-replication-drop]');
      if (el273) {
        (event32['preventDefault'](),
          event32['stopPropagation'](),
          el273['classList']['remove']('is-dragover'),
          run83(event32['dataTransfer']?.['files']));
        return;
      }
      await handleStoryHomeDocumentDrop(event32, selectScriptFile);
    }),
    documentObject['addEventListener']('click', (event33) => {
      if (storyClipProduction['shouldCloseAdjustmentOnOutsideClick'](state2, event33['target']))
        ((state2['clipAdjustmentOpen'] = ![]),
          (state2['clipAdjustmentPromptModeOpen'] = ![]),
          (state2['clipAdjustmentLanguageOpen'] = ![]),
          run29());
      else
        (state2['clipAdjustmentPromptModeOpen'] || state2['clipAdjustmentLanguageOpen']) &&
          !event33['target']['closest']?.('[data-story-clip-adjustment-mode]') &&
          ((state2['clipAdjustmentPromptModeOpen'] = ![]),
          (state2['clipAdjustmentLanguageOpen'] = ![]),
          run31(),
          run31({ kind: 'language' }));
      (storyClipProduction['shouldClosePromptHistoryOnOutsideClick'](state2, event33['target']) &&
        ((state2['clipPromptHistoryOpen'] = ![]), run30()),
        !storyRoot['contains'](event33['target']) &&
          (run37(''), run38(), run33(), run34(), run35(), run6(), run36()));
    }));
  const subscribeAssetMentionRegistry2 = subscribeAssetMentionRegistry(() => {
      if (
        enabled11 &&
        state2['view'] === 'project' &&
        state2['step'] === 0x2 &&
        state2['assetFilter'] === 'library'
      ) {
        render();
        return;
      }
      if (enabled11 && state2['view'] === 'episode') {
        if (!syncFrameRail({ refreshContent: !![] })) render();
      }
    }),
    value518 = typeof subscribeCanvasNodeDeletions === 'function' ? subscribeCanvasNodeDeletions(run3) : null,
    value519 =
      typeof subscribeCanvasMediaNodeChanges === 'function' ? subscribeCanvasMediaNodeChanges(run5) : null;
  async function run85() {
    if (typeof loadWorkspace !== 'function') {
      coordinator['setReady'](!![]);
      return;
    }
    const value520 = coordinator['getRevision'](),
      storyWorkspaceSnapshot = createStoryWorkspaceSnapshot(state2);
    let value521 = ![],
      value522 = ![];
    try {
      const workspace = await loadWorkspace();
      await waitForRuntimeManifestLoad({ timeoutMs: 0x1f4 });
      const providerProfileId3 = parseStoryWorkspaceSnapshotPayload(workspace);
      if (providerProfileId3) {
        const list46 = providerProfileId3['projects']['map']((args39) => {
            const data3 = args39?.['data']
              ? normalizeStoryWorkspaceAssetData(args39['data'])
              : args39?.['data'];
            return (reconcilePersistedStoryProjectTasks(data3), { ...args39, data: data3 });
          }),
          value523 =
            coordinator['getRevision']() !== value520 ||
            hasStoryWorkspaceSnapshotChanged(storyWorkspaceSnapshot, createStoryWorkspaceSnapshot(state2));
        if (value523)
          (projectData['restoreEntries'](mergeStoryWorkspaceHydratedProjects(state2['projects'], list46), {
            preserveLive: !![],
          }),
            (value521 = list46['length'] > 0x0),
            coordinator['schedule']());
        else {
          (projectData['restoreEntries'](list46),
            advanceProjectSession(state2),
            projectData['replaceCurrent'](
              normalizeStoryWorkspaceAssetData(providerProfileId3['currentData']),
            ),
            reconcilePersistedStoryProjectTasks(state2['data']),
            (state2['data']['project']['planning'] = normalizeStoryProjectPlanning(
              state2['data']['project'],
              { allowDeveloperPromptModes: state2['developerModeAvailable'] },
            )),
            (state2['hasCreatedProject'] = providerProfileId3['hasCreatedProject'] === !![]),
            (state2['projectTitleEdited'] = providerProfileId3['projectTitleEdited'] === !![]),
            (state2['models'] = { ...state2['models'], ...providerProfileId3['models'] }),
            (state2['textProvider'] =
              providerProfileId3['modelProviders']?.['text'] ||
              getStoryWorkspaceModelChoice('text', state2['models']['text'])?.['provider'] ||
              state2['textProvider']),
            (state2['textProviderProfileId'] = resolveStoryTextProviderProfileId(
              state2['textProvider'],
              providerProfileId3['modelProviderProfiles']?.['text'] || state2['textProviderProfileId'],
            )),
            (state2['imageProvider'] = resolveModelProvider(
              state2['models']['image'],
              providerProfileId3['modelProviders']?.['image'] || state2['imageProvider'],
            )),
            (state2['imageGenerationParams'] = normalizeStoryImageGenerationParams(
              state2['models']['image'],
              providerProfileId3['modelParams']?.['image'],
            )),
            (state2['imageGenerationParamsByModel'] =
              providerProfileId3['modelParams']?.['imageByModel'] &&
              typeof providerProfileId3['modelParams']['imageByModel'] === 'object'
                ? { ...providerProfileId3['modelParams']['imageByModel'] }
                : {}),
            (state2['videoProvider'] = resolveStoryVideoProvider(
              state2['models']['video'],
              providerProfileId3['modelProviders']?.['video'] || state2['videoProvider'],
            )),
            (state2['videoProviderProfileIdByModel'] =
              providerProfileId3['modelProviderProfiles']?.['videoByModel'] &&
              typeof providerProfileId3['modelProviderProfiles']['videoByModel'] === 'object'
                ? { ...providerProfileId3['modelProviderProfiles']['videoByModel'] }
                : {}),
            (state2['videoProviderProfileId'] = resolveModelProviderProfileId({
              model: state2['models']['video'],
              providerProfileId:
                providerProfileId3['modelProviderProfiles']?.['video'] || state2['videoProviderProfileId'],
              providerProfileIdByModel: state2['videoProviderProfileIdByModel'],
            })),
            (state2['videoGenerationParams'] = normalizeStoryVideoGenerationParams(
              state2['models']['video'],
              providerProfileId3['modelParams']?.['video'],
            )),
            (state2['videoGenerationParamsByModel'] =
              providerProfileId3['modelParams']?.['videoByModel'] &&
              typeof providerProfileId3['modelParams']['videoByModel'] === 'object'
                ? { ...providerProfileId3['modelParams']['videoByModel'] }
                : {}),
            (state2['view'] = ['home', 'project', 'episode']['includes'](providerProfileId3['ui']['view'])
              ? providerProfileId3['ui']['view']
              : 'home'));
          const storyWorkspaceStep2 = normalizeStoryWorkspaceStep(providerProfileId3['ui']['step']);
          state2['step'] = canEnterStoryWorkspaceStep(state2['data'], storyWorkspaceStep2)
            ? storyWorkspaceStep2
            : state2['data']['project']['collaboration']?.['stage'] === 'writing'
              ? 0x0
              : 0x1;
          state2['view'] === 'episode' &&
            !canEnterStoryWorkspaceStep(state2['data'], 0x3) &&
            (state2['view'] = 'project');
          ((state2['homeTab'] = resolveStoryVideoReplicationHomeTab(
            state2,
            providerProfileId3['ui']['homeTab'],
          )),
            (state2['replicationAsrProvider'] =
              providerProfileId3['ui']['replicationAsrProvider'] || 'volcengine-speech'),
            (state2['replicationTargetLocale'] = getStoryReplicationLocale(
              providerProfileId3['ui']['replicationTargetLocale'] || 'zh-CN',
            )['value']),
            (state2['scriptMode'] = normalizeStoryScriptMode(
              providerProfileId3['ui']['scriptMode'] || state2['data']['project']?.['scriptMode'],
            )),
            (state2['uploadInputMode'] =
              providerProfileId3['ui']['uploadInputMode'] === 'paste' ? 'paste' : 'file'),
            (state2['idea'] = String(providerProfileId3['ui']['idea'] || '')['slice'](
              0x0,
              STORY_IDEA_MAX_CHARACTERS,
            )),
            (state2['scriptFileName'] = String(providerProfileId3['ui']['scriptFileName'] || '')),
            (state2['scriptText'] = String(providerProfileId3['ui']['scriptText'] || '')['slice'](
              0x0,
              STORY_SCRIPT_MAX_CHARACTERS,
            )),
            (state2['scriptCharacterCount'] = Number['isFinite'](
              providerProfileId3['ui']['scriptCharacterCount'],
            )
              ? providerProfileId3['ui']['scriptCharacterCount']
              : null));
          const response12 = state2['data']['project']?.['sourceDocument'];
          response12 &&
            typeof response12 === 'object' &&
            ((state2['scriptFileName'] = String(response12['fileName'] || state2['scriptFileName'])),
            (state2['scriptText'] = String(response12['text'] || state2['scriptText'])['slice'](
              0x0,
              STORY_SCRIPT_MAX_CHARACTERS,
            )),
            (state2['scriptCharacterCount'] = Number['isFinite'](response12['characterCount'])
              ? response12['characterCount']
              : state2['scriptText']['length']));
          ((state2['assetFilter'] = providerProfileId3['ui']['assetFilter'] || state2['assetFilter']),
            (state2['assetSplitRatio'] = normalizeStoryAssetSplitRatio(
              providerProfileId3['ui']['assetSplitRatio'],
            )),
            (state2['assetDetailSplitRatio'] = normalizeStoryAssetDetailSplitRatio(
              providerProfileId3['ui']['assetDetailSplitRatio'],
            )));
          const box5 = normalizeStoryEpisodePanelRatios(
            providerProfileId3['ui']['episodeAssetPanelRatio'],
            providerProfileId3['ui']['episodeEditorPanelRatio'],
          );
          ((state2['episodeAssetPanelRatio'] = box5['left']),
            (state2['episodeEditorPanelRatio'] = box5['center']),
            (state2['episodeAssetRailTab'] = normalizeStoryEpisodeAssetRailTab(
              providerProfileId3['ui']['episodeAssetRailTab'],
            )),
            (state2['assetAppearanceIndexes'] =
              providerProfileId3['ui']['assetAppearanceIndexes'] &&
              typeof providerProfileId3['ui']['assetAppearanceIndexes'] === 'object'
                ? { ...providerProfileId3['ui']['assetAppearanceIndexes'] }
                : {}),
            (state2['outlineSectionOpenState'] =
              providerProfileId3['ui']['outlineSectionOpenState'] &&
              typeof providerProfileId3['ui']['outlineSectionOpenState'] === 'object'
                ? { ...providerProfileId3['ui']['outlineSectionOpenState'] }
                : {}),
            (state2['pageScrollPositions'] =
              providerProfileId3['ui']['pageScrollPositions'] &&
              typeof providerProfileId3['ui']['pageScrollPositions'] === 'object'
                ? { ...providerProfileId3['ui']['pageScrollPositions'] }
                : {}),
            (state2['experimentalSplitMode'] = providerProfileId3['ui']['experimentalSplitMode'] === !![]),
            (state2['selectedAssetId'] = providerProfileId3['ui']['selectedAssetId'] || ''),
            (state2['selectedEpisodeId'] = providerProfileId3['ui']['selectedEpisodeId'] || ''),
            (state2['selectedClipId'] = providerProfileId3['ui']['selectedClipId'] || ''),
            (state2['characterVoiceEditor'] = normalizeStoryProjectVoiceEditor(
              providerProfileId3['ui']['characterVoiceEditor'],
              state2['data'],
            )),
            restoreTaskState(state2['data']));
          const episode11 = getSelectedEpisode(state2);
          ((value522 = prepareVideoSettings(getSelectedClip(state2, episode11), {
            episode: episode11,
            enteringEpisode: state2['view'] === 'episode',
          })),
            (value521 = !![]));
          if (state2['workspaceSurface']) selectStoryWorkspaceSurface(state2, state2['workspaceSurface']);
          if (enabled11) render({ capturePageState: ![] });
        }
      }
    } catch (value524) {
      (console['warn']('[storyWorkspace] 用户数据加载失败', value524),
        coordinator['setHydrationError'](value524),
        showToast('历史剧本项目加载失败，已暂停自动保存以防覆盖数据。', 'error', 0x2710));
      return;
    }
    coordinator['setReady'](!![]);
    typeof getCanvasMediaSnapshot === 'function' && run5(getCanvasMediaSnapshot() || {});
    value522 && schedulePersistence({ immediate: !![] });
    if (value521 && !enabled10)
      for (const value525 of projectData['getAllData']()) {
        (resumeTasks(value525), resumePersistedTasks(value525));
      }
    value521 &&
      !enabled10 &&
      void backfillStoryVideoThumbnails(projectData['getAllData'](), { concurrency: 0x1 })
        ['then']((enabled65) => {
          if (enabled10 || !enabled65['updatedCount']) return;
          schedulePersistence({ immediate: !![] });
          if (!enabled11) return;
          if (state2['view'] === 'project' && state2['step'] === 0x3)
            enabled65['changedEpisodeIds']['forEach']((value526) => {
              run7(value526);
            });
          else
            state2['view'] === 'episode' &&
              enabled65['changedEpisodeIds']['includes'](normalizeText(state2['selectedEpisodeId'])) &&
              (hideHistory(), refreshTimeline());
        })
        ['catch']((value527) => {
          console['warn']('[storyWorkspace]\x20历史视频缩略图补全失败', value527);
        });
  }
  collaboration = createStoryCollaboration({
    state: state2,
    root: storyRoot,
    projectData: projectData,
    save: schedulePersistence,
    render: render,
    beginProjectSession: beginSession,
    isActive: () => enabled11,
    showToast: showToast,
    resetCreationState: resetCreationState,
  });
  const value528 = {
    collaboration: collaboration,
    activate: activate,
    deactivate: deactivate,
    isActive: () => enabled11,
    flushPersistence() {
      return coordinator['destroy']({ flush: !![], force: !![] })['then'](
        () => !![],
        () => ![],
      );
    },
    hasUnsavedChanges: () => coordinator.isDirty(),
    async prepareForClose() {
      if (!coordinator.isDirty()) return { success: true };
      if (!coordinator.isReady()) return { success: false, reason: 'story-workspace-not-ready' };
      await coordinator.flush();
      return { success: !coordinator.isDirty(), reason: 'story-workspace-save' };
    },
    getProjectWorkspaceMode: () => getStoryProjectWorkspaceMode(state2['data']?.['project']),
    openHome() {
      state2['view'] = 'home';
      if (enabled11) render();
      else requestWorkspaceMode(state2['workspaceSurface'] || 'story');
    },
    openProject() {
      (requestWorkspaceMode(getStoryProjectWorkspaceMode(state2['data']?.['project'])), openProject3());
    },
    importProjectPackageResult: importProjectPackageResult,
    destroy() {
      (bindStoryAssetImageDrop2['destroy'](),
        deactivate(),
        collaboration['destroy'](),
        (enabled10 = !![]),
        workspacePresentationLifecycle['dispose'](),
        releaseSourcePreviewUrls(),
        closeStoryRequestDebugPreview(documentObject),
        storyWorkspaceNavigationTransaction['destroy'](),
        workspacePageTransitionController['destroy'](),
        storyMarqueeSelectionController['destroy'](),
        activeClipGenerationControllers['forEach']((value529) => value529['pause']()),
        activeClipGenerationControllers['clear'](),
        replicationAnalysisPromises['clear'](),
        replicationSourceFileByEpisodeKey['clear'](),
        destroy2(),
        stopStoryAssetBreakdownProgress({ clearState: !![] }),
        storyAssetHoverPreviewController['destroy'](),
        timer?.['destroy'](),
        (timer = null),
        run18(),
        storyCharacterVoiceWorkspaceController['destroy'](),
        void value528['flushPersistence'](),
        workspacePersistencePresentation['destroy'](),
        subscribeGenerationCompleteNotificationClicks2?.(),
        subscribeAssetMentionRegistry2?.(),
        value518?.(),
        value519?.(),
        viewportElement['querySelectorAll'](':scope\x20>\x20.story-page')['forEach'](disposePage),
        run82(),
        storyRoot['removeEventListener']('error', handleStoryWorkspaceImageError, !![]),
        windowObject?.['removeEventListener']?.('pointermove', handleWindowPointerMove, !![]),
        windowObject?.['removeEventListener']?.('pointerup', handleWindowPointerUp, !![]),
        windowObject?.['removeEventListener']?.('pointercancel', handleWindowPointerCancel, !![]),
        storyLibraryAssignmentMenuPortal['destroy'](),
        windowObject?.['removeEventListener']?.('keydown', run80, !![]),
        windowObject?.['removeEventListener']?.('aicanvas:runtime-info', value142),
        windowObject?.['removeEventListener']?.('dev-mode-changed', value142),
        storyRoot['remove']());
    },
  };
  return ((storyRoot['_storyWorkspaceApi'] = value528), void run85(), value528);
}
