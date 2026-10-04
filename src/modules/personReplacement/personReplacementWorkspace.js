import { openDebugRequestWindow, closeDebugRequestWindow } from '../debugRequestWindow.js';
import { bindPersonReplacementPricing } from './personReplacementPricing.js';
import { bindWorkspaceSelects } from '../workspaceSelects.js';
import { buildGenerationDebugPreview } from '../../utils/generationDebugPreview.js';
import { createWorkspacePresentationLifecycle } from '../workspacePresentationLifecycle.js';
import { createWorkspacePersistencePresentation } from '../workspacePersistencePresentation.js';
import { refreshPersonReplacementWorkspaceAssets } from './personReplacementWorkspaceSnapshot.js';
import {
  PERSON_REPLACEMENT_ORIENTATIONS,
  PERSON_REPLACEMENT_SCOPES,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
  PERSON_REPLACEMENT_VIDEO_MODEL_IDS,
  formatPersonReplacementScopeLabel,
  formatPersonReplacementPersonLabel,
  getPersonReplacementCharacterBaseImageRef,
  isGeneratedPersonReplacementLabel,
  resolvePersonReplacementVideoParameterPolicy,
} from './personReplacementProject.js';
import {
  applyPersonReplacementShotSceneReference,
  assignPersonReplacementShotPersonMapping,
  clearPersonReplacementShotPersonMappings,
} from './personReplacementShotMapping.js';
import {
  buildPersonReplacementPromptMentionCandidates,
  resolvePersonReplacementPromptMentionRef,
} from './personReplacementPromptMentions.js';
import {
  applyPersonReplacementPromptControlAction,
  syncPersonReplacementPromptModeControl,
} from './personReplacementPromptControls.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { bindAIGenImageModelSelector } from '../../components/aigenImage/modelSelector.js';
import { bindAIGenVideoModelSelector } from '../../components/aigenVideo/modelSelector.js';
import { createAudioPlaybackSurfaceController } from '../../components/audio-node/audioPlaybackSurface.js';
import { createModelProviderProfileControl } from '../../components/shared/modelProviderProfileControl.js';
import VideoClipController from '../VideoClipController.js';
import { MEDIA_CLIP_REVERSE_ICON_PATHS } from '../../components/media-clip/mediaClipReverseControl.js';
import { resolveModelProvider } from '../../manifests/index.js';
import { normalizeCharacterAssetImageGenerationParams } from '../characterAssets/characterAssetImageGeneration.js';
import {
  normalizePersonReplacementAssetPromptPresetId,
  resolvePersonReplacementImageGenerationUiRefreshScope,
  resolvePersonReplacementImageGenerationState,
  updatePersonReplacementImageGenerationState,
} from './personReplacementImageGeneration.js';
import {
  createPersonReplacementImagePresentation,
  syncPersonReplacementImageStageFrame,
  syncPersonReplacementImagePromptGate,
  syncPersonReplacementImageGenerationLoading,
} from './personReplacementImagePresentation.js';
import {
  applyPersonReplacementVideoCrop,
  resolvePersonReplacementVideoSlotState,
} from './personReplacementVideoInputs.js';
import {
  isPersonReplacementAudioFile,
  isPersonReplacementImageFile,
  isPersonReplacementVideoFile,
  readPersonReplacementVideoPromptEditor,
} from './personReplacementWorkspaceInput.js';
import {
  createPersonReplacementVideoCropOptions,
  isPersonReplacementVideoCropReverseRunning,
} from './personReplacementVideoCrop.js';
import {
  isPersonReplacementVideoGenerationActive,
  resolvePersonReplacementVideoGenerationState,
  resolvePersonReplacementVideoGenerationUiRefreshScope,
  updatePersonReplacementVideoGenerationState,
} from './personReplacementVideoGeneration.js';
import {
  createPersonReplacementVideoPresentation,
  syncPersonReplacementVideoStageFrame,
} from './personReplacementVideoPresentation.js';
import { createPersonReplacementShotTimelinePresentation } from './personReplacementShotTimelinePresentation.js';
import { createPersonReplacementIdentityPresentation } from './personReplacementIdentityPresentation.js';
import { syncPersonReplacementAssetSelection } from './personReplacementAssetSelectionRendering.js';
import { createPersonReplacementCompositePreviewPresentation } from './personReplacementCompositePreviewPresentation.js';
import { buildPersonReplacementCompositePreviewSnapshot } from './personReplacementCompositePreviewProjection.js';
import { createPersonReplacementShellPresentation } from './personReplacementShellPresentation.js';
import { openImagePreview, openVideoPreview } from '../imagePreview.js';
import {
  addPersonReplacementAppearanceToLibraryWithFly,
  requestPersonReplacementLibraryAssignment,
} from './personReplacementAssetLibraryInteraction.js';
import { applyWorkspaceAssetSplitRatioToLayout } from '../workspaceAssetSettingsShell.js';
import {
  normalizeWorkspaceProjectSortOrder,
  refreshWorkspaceProjectResultsInPlace,
} from '../workspaceProjectHome.js';
import { resolveWorkspaceCardMultiSelection, focusWorkspaceAssetCard } from '../workspaceAssetSelection.js';
import {
  createWorkspaceAssetLibraryDisclosure,
  handleWorkspaceAssetLibraryImageError,
  getWorkspaceAssetLibrarySelectionOrder,
} from '../workspaceAssetLibrary.js';
import { runWorkspaceVideoDownloadAction } from '../workspaceVideoDownload.js';
import { createPersonReplacementResultMediaActions } from './personReplacementResultMediaActions.js';
import {
  consumeWorkspaceWheelDirection,
  renderWorkspaceAssetLoadingOverlay,
  resolveWorkspaceTabTransitionDirection,
} from '../workspaceAssetPresentation.js';
import { readPersonReplacementAssetPromptText } from './personReplacementAssetPresentation.js';
import {
  getPersonReplacementSelectableAssets,
  renderPersonReplacementAssetSettingsPage,
} from './personReplacementAssetSettingsPresentation.js';
import {
  applyPersonReplacementVoiceLayoutToElement,
  getPersonReplacementVoiceCloneCharacters,
  renderPersonReplacementVoiceClonePage,
} from './personReplacementVoiceClonePresentation.js';
import { createPersonReplacementVoiceCloneInteractionController } from './personReplacementVoiceCloneInteractionController.js';
import {
  getPersonReplacementProjectAudioAssets,
  getPersonReplacementLibraryAudioRef,
  getPersonReplacementVoiceLibraryBoundCharacters,
} from './personReplacementVoiceLibrary.js';
import { beginWorkspaceHorizontalResizeSession } from '../workspaceResizeSession.js';
import {
  captureWorkspaceNestedScrollPositions,
  restoreWorkspaceNestedScrollPositions,
  shouldPreserveWorkspaceNestedWheel,
} from '../workspaceWheelNavigation.js';
import {
  getWorkspaceAssetAppearances,
  getWorkspaceAssetBaseAppearance,
} from '../workspaceAssetAppearance.js';
import { createPersonReplacementAssetHoverPreviewController } from './personReplacementAssetHoverPreviewController.js';
import { createPersonReplacementResultHistoryController } from './personReplacementResultHistoryController.js';
import { createWorkspaceVideoPlayback } from '../workspaceVideoPlayback.js';
import { createWorkspaceMarqueeSelectionController } from '../workspaceMarqueeSelection.js';
import {
  applyWorkspaceAssetNativeDragPreview,
  WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP,
} from '../workspaceAssetDragPreview.js';
import { bindWorkspaceEntityContextMenu } from '../workspaceEntityContextMenu.js';
import { resolvePersonReplacementContextMenuItems } from './personReplacementContextMenu.js';
import { scrollClosestElementHorizontallyWithWheel } from '../workspaceHorizontalWheel.js';
import {
  createWorkspaceMenuController,
  syncWorkspaceInlineMenuExpandedWidth,
} from '../workspaceMenuController.js';
import { createPersonReplacementExportSubmenuController } from './personReplacementExportSubmenuController.js';
import { handleWorkspaceStepShortcut } from '../workspaceStepShortcut.js';
import {
  bindPromptMentionHost,
  insertPresetPromptIntoEditor,
  sanitizePromptHtmlForCommit,
} from '../nodePromptShared.js';
import { shouldSkipPromptTriggerForBulkInput } from '../promptTriggerComposition.js';
import { checkSlashTrigger, handleSlashKeyboardNavigation } from '../slashMenu.js';
import { REPLACEMENT_STUDIO_NAME } from './replacementStudioTerminology.js';
import { PERSON_REPLACEMENT_CANVAS_SCOPES } from './personReplacementOutputCanvas.js';
import { resolvePersonReplacementSourceImageSize } from './personReplacementManualBox.js';
import { createPersonReplacementPersonBoxInteractionController } from './personReplacementPersonBoxInteractionController.js';
import {
  PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
  getPersonReplacementShotCutFrameSec,
  getPersonReplacementShotCutTimelineSec,
  getPersonReplacementShotCutTotalDuration,
} from './personReplacementShotCutModel.js';
import { createPersonReplacementShotCutSession } from './personReplacementShotCutSession.js';
import {
  reconcilePersonReplacementImageShotSelection,
  reconcilePersonReplacementShotCardList,
  reconcileElementTree,
  reconcilePersonReplacementShotTimelineCard,
  reconcilePersonReplacementReferenceInputs,
  reconcilePersonReplacementVideoShotSelection,
} from './personReplacementShotSelectionRendering.js';
import {
  cancelPersonReplacementSlideTransition,
  startPersonReplacementSlideTransition,
} from './personReplacementSlideTransition.js';
import { shouldReusePersonReplacementVideoPlaybackStage } from './personReplacementVideoSyncPlayback.js';
import { createPersonReplacementVideoPlaybackController } from './personReplacementVideoPlaybackController.js';
import { createPersonReplacementCompositePreviewController } from './personReplacementCompositePreviewController.js';
import { createPersonReplacementShotCutPreviewMediaController } from './personReplacementShotCutPreviewMediaController.js';
import { createPersonReplacementShotCutPreviewController } from './personReplacementShotCutPreviewController.js';
import { createPersonReplacementShotCutEditorController } from './personReplacementShotCutEditorController.js';
import { createPersonReplacementShotCutInteractionController } from './personReplacementShotCutInteractionController.js';
import { createPersonReplacementShotCutViewportController } from './personReplacementShotCutViewportController.js';
import { createPersonReplacementResultSelectionController } from './personReplacementResultSelectionController.js';
import { createPersonReplacementBatchGenerationController } from './personReplacementBatchGenerationController.js';
import { createPersonReplacementPageTransitionController } from './personReplacementPageTransitionController.js';
import {
  applyPersonReplacementCompositeSidebarWidthToLayout,
  createPersonReplacementLayoutResizeController,
  renderPersonReplacementLayoutSplitter,
} from './personReplacementLayoutResizeController.js';
import { createPersonReplacementSmartDetectPresentation } from './personReplacementSmartDetectPresentation.js';
import {
  PERSON_REPLACEMENT_OUTPUT_TRANSITIONS,
  transitionPersonReplacementOutput,
} from './personReplacementOutputLineage.js';
import {
  PERSON_REPLACEMENT_WORKSPACE_INTENTS,
  createPersonReplacementWorkspaceIntentPort,
} from './personReplacementWorkspaceIntentPort.js';
import {
  isPersonReplacementSourceProcessing,
  normalizePersonReplacementCompositeSidebarWidth,
  normalizePersonReplacementPersistenceState,
  normalizePersonReplacementVoiceLayout,
  normalizePersonReplacementWorkspaceProject,
} from './personReplacementProjectSession.js';
import { PERSON_REPLACEMENT_STEPS, getPersonReplacementStepGate } from './personReplacementWorkflow.js';
import {
  PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE,
  getPersonReplacementBoxedPeople,
  getPersonReplacementDuplicateRoleLabels,
  getPersonReplacementIdentityCorrectionDraftKey,
  getPersonReplacementLabelOptions,
  getPersonReplacementReusableLabels,
} from './personReplacementSourceIdentity.js';
const PERSON_REPLACEMENT_VOICE_ASSET_DRAG_TYPE = 'application/x-person-replacement-voice-asset',
  PERSON_REPLACEMENT_SCENE_ASSET_DRAG_TYPE = 'application/x-person-replacement-scene-asset',
  PERSON_REPLACEMENT_PERSISTENT_NESTED_SCROLL_SELECTORS = Object['freeze']([
    '.story-assets-list, [data-person-replacement-video-reference-list]',
    '.person-replacement-shot-timeline-scroll',
    '.person-replacement-shot-cut-scroll',
    '.person-replacement-shot-cut-smart-detect-panel',
  ]),
  PERSON_REPLACEMENT_MULTI_SELECTION_INTERACTIVE_SELECTOR = [
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
    '[role=\x27button\x27]',
    "[role='option']",
    "[role='menuitem']",
    "[role='slider']",
    '[tabindex]',
  ]['join'](',');
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#039;');
}
function normalizeText(item, key = '') {
  const index = String(item ?? '')['trim']();
  return index || key;
}
function cloneJson(result) {
  return result && typeof result === 'object' ? JSON['parse'](JSON['stringify'](result)) : result;
}
function clamp(data, options, target, source = options) {
  const next = Number(data);
  return Number['isFinite'](next) ? Math['min'](target, Math['max'](options, next)) : source;
}
const PERSON_REPLACEMENT_ORIENTATION_LABELS = Object['freeze']({
  front: '正面',
  back: '背面',
  side: '侧面',
  left_profile: '左侧面',
  right_profile: '右侧面',
  three_quarter_left: '左前侧',
  three_quarter_right: '右前侧',
  over_shoulder_left: '左过肩',
  over_shoulder_right: '右过肩',
  unknown: '待确认',
});
function formatPersonOrientation(current) {
  return (
    PERSON_REPLACEMENT_ORIENTATION_LABELS[normalizeText(current)] ||
    PERSON_REPLACEMENT_ORIENTATION_LABELS['unknown']
  );
}
function getPersonOrientationOptions() {
  const list = PERSON_REPLACEMENT_ORIENTATIONS['filter']((entry) => entry !== 'unknown');
  return list['map']((value2) => ({ value: value2, label: formatPersonOrientation(value2) }));
}
function getPersonReplacementScopeOptions() {
  return PERSON_REPLACEMENT_SCOPES['map']((value3) => ({
    value: value3,
    label: formatPersonReplacementScopeLabel(value3),
  }));
}
function normalizeMediaUrl(record) {
  const text = normalizeText(record);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
function getCharacterAppearance(payload, handle = '') {
  const list2 = getWorkspaceAssetAppearances(payload);
  return (
    list2['find']((state) => state['id'] === handle) ||
    getWorkspaceAssetBaseAppearance(payload) ||
    list2[0x0] ||
    null
  );
}
function getCharacterVoiceUrl(options2 = {}) {
  return normalizeMediaUrl(
    options2['voiceReference']?.['audioUrl'] ||
      options2['voiceReference']?.['localPath'] ||
      options2['voiceRef'],
  );
}
function formatClock(config) {
  const scope = Math['max'](0x0, Number(config) || 0x0),
    input = Math['floor'](scope / 0x3c),
    output = Math['floor'](scope % 0x3c);
  return String(input)['padStart'](0x2, '0') + ':' + String(output)['padStart'](0x2, '0');
}
function renderIcon(value4) {
  const value5 = {
    upload:
      '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
    video:
      '<rect\x20x=\x223\x22\x20y=\x225\x22\x20width=\x2214\x22\x20height=\x2214\x22\x20rx=\x223\x22/><path\x20d=\x22m17\x2010\x204-2v8l-4-2\x22/>',
    close: '<path\x20d=\x22m6\x206\x2012\x2012M18\x206\x206\x2018\x22/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    undo: '<path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    soundOff:
      '<path\x20d=\x22M11\x205\x206\x209H3v6h3l5\x204z\x22/><path\x20d=\x22m16\x209\x205\x205m0-5-5\x205\x22/>',
    soundOn:
      '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18 7a7 7 0 0 1 0 10"/>',
    smartDetect:
      '<path\x20d=\x22m12\x203\x201.2\x203.3L16.5\x207.5l-3.3\x201.2L12\x2012l-1.2-3.3-3.3-1.2\x203.3-1.2z\x22/><path\x20d=\x22m18\x2013\x20.8\x202.2L21\x2016l-2.2.8L18\x2019l-.8-2.2L15\x2016l2.2-.8z\x22/><path\x20d=\x22M5\x2014v5h5\x22/>',
    reverse: MEDIA_CLIP_REVERSE_ICON_PATHS,
    merge:
      '<path d="M4 6h6v5H4zM14 13h6v5h-6z"/><path d="M10 8.5h2a2 2 0 0 1 2 2v5"/><path d="m11.5 13 2.5 2.5 2.5-2.5"/>',
  };
  return (
    '<svg\x20class=\x22person-replacement-icon\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.7\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22\x20aria-hidden=\x22true\x22>' +
    (value5[value4] || '') +
    '</svg>'
  );
}
const personReplacementSmartDetectPresentation = createPersonReplacementSmartDetectPresentation({
    renderIcon: renderIcon,
  }),
  personReplacementShotTimelinePresentation = createPersonReplacementShotTimelinePresentation({
    renderIcon: renderIcon,
  }),
  personReplacementIdentityPresentation = createPersonReplacementIdentityPresentation(),
  personReplacementCompositePreviewPresentation = createPersonReplacementCompositePreviewPresentation(),
  personReplacementShellPresentation = createPersonReplacementShellPresentation({
    resolveVoiceReferenceCount: (value6) =>
      getPersonReplacementVoiceCloneCharacters(value6)['filter']((value7) => getCharacterVoiceUrl(value7))[
        'length'
      ],
  }),
  personReplacementImagePresentation = createPersonReplacementImagePresentation({
    buildIdentityView: (value8, value9, value10) =>
      personReplacementIdentityPresentation['buildImage'](value8, value9, value10),
    renderShotTimeline: (value11, value12) =>
      personReplacementShotTimelinePresentation['renderStage'](value11, value12),
    renderLayoutSplitter: renderPersonReplacementLayoutSplitter,
    renderFooter: (value13, value14) =>
      personReplacementShellPresentation['renderStepFooter'](value13, value14),
    renderSmartDetectTrigger: personReplacementSmartDetectPresentation['renderTrigger'],
  }),
  personReplacementVideoPresentation = createPersonReplacementVideoPresentation({
    buildIdentityView: (value15, value16) =>
      personReplacementIdentityPresentation['buildVideo'](value15, value16),
    renderShotTimeline: (value17, value18) =>
      personReplacementShotTimelinePresentation['renderStage'](value17, value18),
    renderLayoutSplitter: renderPersonReplacementLayoutSplitter,
    renderFooter: (value19, value20) =>
      personReplacementShellPresentation['renderStepFooter'](value19, value20),
  });
function renderCompositeComposeAction(value21, value22 = {}) {
  const enabled = value21['shots']['some']((value23) => normalizeText(value23['resultVideoRef'])),
    value24 = value22['composeOutputPending'] === !![],
    personReplacementCompositePreviewSnapshot =
      buildPersonReplacementCompositePreviewSnapshot(value21)['fullAvailable'],
    value25 = value24
      ? '合成中…'
      : personReplacementCompositePreviewSnapshot
        ? '重新合成全部视频'
        : '合成全部视频';
  return (
    '<button\x20type=\x22button\x22\x20class=\x22story-workbench-action-button\x20story-main-action-button\x20person-replacement-compose-output' +
    (value24 ? ' is-loading' : '') +
    '" data-person-replacement-action="compose-output" aria-busy="' +
    value24 +
    '\x22' +
    (value24 || !enabled ? ' disabled' : '') +
    '>' +
    (value24
      ? '<span class="storyboard-script-loading-spinner person-replacement-compose-spinner" aria-hidden="true"></span>'
      : '') +
    '<span>' +
    value25 +
    '</span></button>'
  );
}
function renderAssetSettings(value26, args = {}) {
  return renderPersonReplacementAssetSettingsPage(value26, {
    ...args,
    renderDetailSplitter: (assetDetailSplitRatio) =>
      renderPersonReplacementLayoutSplitter('asset-detail', { assetDetailSplitRatio: assetDetailSplitRatio }),
    footerHtml: personReplacementShellPresentation['renderStepFooter'](value26, {
      nextLabel: '进入图像替换',
      hidePrevious: !![],
    }),
  });
}
function renderVoiceClone(value27) {
  return renderPersonReplacementVoiceClonePage(value27, {
    footerHtml: personReplacementShellPresentation['renderStepFooter'](value27, {
      nextLabel: '进入合成视频',
    }),
  });
}
function renderCompositePreview(value28, composeOutputPending = {}) {
  const personReplacementCompositePreviewSnapshot2 = buildPersonReplacementCompositePreviewSnapshot(value28);
  return personReplacementCompositePreviewPresentation['render'](personReplacementCompositePreviewSnapshot2, {
    composeActionHtml: renderCompositeComposeAction(value28, composeOutputPending),
    playbackControlsHtml: personReplacementVideoPresentation['renderPlaybackControls'](
      personReplacementCompositePreviewSnapshot2['selectedShot'],
      { context: 'comparison', disabled: !personReplacementCompositePreviewSnapshot2['canCompare'] },
    ),
    composeOutputPending: composeOutputPending['composeOutputPending'] === !![],
  });
}
function renderProject(value29, smartDetecting = {}) {
  const value30 = {
      0x1: renderAssetSettings,
      0x2: (value31, value32) => personReplacementImagePresentation['render'](value31, value32),
      0x3: (value33, value34) => personReplacementVideoPresentation['render'](value33, value34),
      0x4: renderVoiceClone,
      0x5: renderCompositePreview,
    },
    value35 = smartDetecting['cutEditorSmartDetectOpen']
      ? personReplacementSmartDetectPresentation['renderPanel'](value29, {
          smartDetecting: smartDetecting['cutEditorSmartDetecting'],
        })
      : '',
    value36 =
      smartDetecting['canvasSyncOverlayInline'] === ![]
        ? ''
        : personReplacementShellPresentation['renderCanvasSyncLoadingOverlay'](smartDetecting);
  return (
    personReplacementShellPresentation['renderHeader'](value29, smartDetecting) +
    '<main class="person-replacement-project-body"' +
    (smartDetecting['canvasSyncPending'] === !![] ? ' aria-hidden="true" inert' : '') +
    '>' +
    value30[value29['workspace']['step']](value29, smartDetecting) +
    '</main>' +
    value35 +
    value36
  );
}
function renderHiddenInputs() {
  return '<div\x20class=\x22story-asset-hover-preview\x22\x20data-story-asset-hover-preview\x20role=\x22tooltip\x22\x20aria-hidden=\x22true\x22></div><input\x20type=\x22file\x22\x20accept=\x22video/*\x22\x20multiple\x20hidden\x20data-person-replacement-input=\x22source-videos\x22><input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20multiple\x20hidden\x20data-person-replacement-input=\x22new-character-images\x22><input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20multiple\x20hidden\x20data-person-replacement-input=\x22new-scene-images\x22><input\x20type=\x22file\x22\x20accept=\x22audio/*\x22\x20multiple\x20hidden\x20data-person-replacement-input=\x22new-audio-files\x22><input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20hidden\x20data-person-replacement-input=\x22appearance-image\x22><input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20hidden\x20data-person-replacement-input=\x22replacement-image\x22><input\x20type=\x22file\x22\x20accept=\x22video/*\x22\x20hidden\x20data-person-replacement-input=\x22replacement-video-result\x22><input\x20type=\x22file\x22\x20accept=\x22image/*,video/*\x22\x20hidden\x20data-person-replacement-input=\x22replacement-video-slot\x22><input\x20type=\x22file\x22\x20accept=\x22audio/*\x22\x20hidden\x20data-person-replacement-input=\x22character-voice\x22>';
}
export function renderPersonReplacementWorkspace(options3 = {}, value37 = {}) {
  const personReplacementWorkspaceProject = normalizePersonReplacementWorkspaceProject(options3),
    value38 =
      personReplacementWorkspaceProject['workspace']['view'] === 'home'
        ? personReplacementShellPresentation['renderHome'](personReplacementWorkspaceProject)
        : renderProject(personReplacementWorkspaceProject, value37);
  return (
    '<section class="person-replacement-workspace" data-person-replacement-workspace data-person-replacement-view="' +
    personReplacementWorkspaceProject['workspace']['view'] +
    '" data-person-replacement-step="' +
    personReplacementWorkspaceProject['workspace']['step'] +
    '\x22>' +
    value38 +
    renderHiddenInputs() +
    '</section>'
  );
}
function resolveMountTarget(el, value39) {
  if (value39?.['nodeType'] === 0x1) return value39;
  return el?.['querySelector']?.(value39) || el?.['body'] || null;
}
export function createReplacementStudioWorkspace({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  videoClipController: videoClipController = VideoClipController,
  createVideoPlayback: createVideoPlayback = createWorkspaceVideoPlayback,
  mountTarget: mountTarget = '#v2-wrap',
  initialProject: initialProject = {},
  projectSession: projectSession = null,
  workspaceIntentPort: workspaceIntentPort = createPersonReplacementWorkspaceIntentPort(),
} = {}) {
  const downloadImageIntent = PERSON_REPLACEMENT_WORKSPACE_INTENTS,
    hasWorkspaceIntent = (value40) => workspaceIntentPort['supports'](value40),
    promptEnhancementModel = (value41, ...args2) => workspaceIntentPort['request'](value41, ...args2),
    onShotKeyframeSelected =
      (value42) =>
      (...args3) =>
        promptEnhancementModel(value42, ...args3);
  let initialProject2 = normalizePersonReplacementWorkspaceProject(initialProject);
  const assetLibraryDisclosure = createWorkspaceAssetLibraryDisclosure();
  let floatingMenuHost = null,
    bindWorkspaceEntityContextMenu2 = null,
    value43 = ![];
  const workspacePresentationLifecycle = createWorkspacePresentationLifecycle({
      getRoot: () => floatingMenuHost,
    }),
    workspacePersistencePresentation = createWorkspacePersistencePresentation({
      getRoot: () => floatingMenuHost,
    });
  let value44 = mountTarget,
    value45 = null,
    value46 = null;
  const map = new Set();
  let voiceLibraryTargetCharacterId = '',
    list3 = [],
    bindAIGenVideoModelSelector2 = null,
    value47 = null,
    el2 = null,
    el3 = null,
    canvasSyncPending = ![],
    canvasSyncScope = '',
    composeOutputPending2 = ![],
    exportOutputPending = ![],
    el4 = null,
    el5 = null;
  const map2 = new Map();
  let enabled2 = ![],
    value48 = null,
    value49 = null,
    ctx = null,
    value50 = null;
  const personReplacementVideoPlaybackController = createPersonReplacementVideoPlaybackController({
      getRoot: () => floatingMenuHost,
      getProject: () => initialProject2,
      getSelectedShot: (value51) => personReplacementVideoPresentation['build'](value51)['shot'],
      createVideoPlayback: createVideoPlayback,
      videoClipController: videoClipController,
    }),
    handler = (value52) => personReplacementVideoPlaybackController['bind'](value52),
    handler2 = () => personReplacementVideoPlaybackController['bindCenterIndicators'](),
    handler3 = (value53) => personReplacementVideoPlaybackController['stop'](value53),
    personReplacementCompositePreviewController = createPersonReplacementCompositePreviewController({
      getRoot: () => floatingMenuHost,
      getProject: () => initialProject2,
      documentObject: documentObject,
      windowObject: windowObject,
      createVideoPlayback: createVideoPlayback,
    }),
    handler4 = () => personReplacementCompositePreviewController['stop'](),
    handler5 = (value54) => personReplacementCompositePreviewController['releaseOriginalWarmup'](value54),
    handler6 = (value55) => personReplacementCompositePreviewController['startOriginalWarmup'](value55),
    handler7 = () => personReplacementCompositePreviewController['prepareOriginalHandoff'](),
    handler8 = () => personReplacementCompositePreviewController['retainFullVideosForPageRefresh'](),
    handler9 = () => personReplacementCompositePreviewController['bind']();
  let previewController = null;
  const session = createPersonReplacementShotCutSession({
      initialProject: initialProject2,
      windowObject: windowObject,
      onBoundaryDragStopped: () => {
        documentObject?.['body']?.['classList']?.['remove']?.('person-replacement-cut-resizing');
      },
      onDetectionRequested: async (value56) => {
        const value57 = await promptEnhancementModel(downloadImageIntent['DETECT_SHOT_CUT_RANGES'], value56, {
            project: cloneJson(initialProject2),
          }),
          list4 = Array['isArray'](value57?.['ranges']) ? value57['ranges'] : [];
        if (!list4['length']) throw new Error('智能检测未返回可用切口');
        return list4;
      },
      playbackControllerOptions: {
        windowObject: windowObject,
        isEditorOpen: () => selectedIds['isOpen'],
        getDraft: () => selectedIds['draft'],
        getProject: () => initialProject2,
        syncNativePlayback: (value58) => previewController?.['syncPlaybackFromVideo'](value58),
        syncTimelinePosition: (value59) => previewController?.['syncTimelinePosition'](value59),
        previewShotCut: (...args4) => previewController?.['preview'](...args4),
      },
    }),
    selectedIds = session['workspaceState'],
    mediaController = createPersonReplacementShotCutPreviewMediaController({
      session: session,
      getRoot: () => floatingMenuHost,
      getProject: () => initialProject2,
      getSelectedShot: (value60) => personReplacementImagePresentation['build'](value60)['selectedShot'],
      createVideoPlayback: createVideoPlayback,
      documentObject: documentObject,
      isDestroyed: () => value43,
    }),
    {
      preparePreviewVideo: preparePreviewVideo,
      preserveBufferedVideo: preserveBufferedVideo,
      releaseBufferedVideo: releaseBufferedVideo,
      restoreBufferedVideo: restoreBufferedVideo,
    } = mediaController,
    viewportController = createPersonReplacementShotCutViewportController({
      session: session,
      getRoot: () => floatingMenuHost,
      renderIcon: renderIcon,
    }),
    {
      applyTimelineZoom: applyTimelineZoom,
      isBusy: isBusy,
      isDraftMutationBusy: isDraftMutationBusy,
    } = viewportController;
  previewController = createPersonReplacementShotCutPreviewController({
    session: session,
    mediaController: mediaController,
    viewportController: viewportController,
    getRoot: () => floatingMenuHost,
    getProject: () => initialProject2,
  });
  const {
      armFrameWait: armFrameWait,
      cancelFrameWait: cancelFrameWait,
      cancelHoverPreview: cancelHoverPreview,
      clearPreviewMetadata: clearPreviewMetadata,
      markFrameReady: markFrameReady,
      preview: preview,
      seekTimeline: seekTimeline,
      stepTimeline: stepTimeline,
      stopPlayback: stopPlayback,
      syncPlaybackFromVideo: syncPlaybackFromVideo,
      togglePlayback: togglePlayback,
    } = previewController,
    editorController = createPersonReplacementShotCutEditorController({
      session: session,
      previewController: previewController,
      mediaController: mediaController,
      viewportController: viewportController,
      getRoot: () => floatingMenuHost,
      getProject: () => initialProject2,
      documentObject: documentObject,
      windowObject: windowObject,
      isDestroyed: () => value43,
      requestRender: () => run(),
      onShotKeyframeSelected: onShotKeyframeSelected(downloadImageIntent['SELECT_SHOT_KEYFRAME']),
      onShotReverseRequested: onShotKeyframeSelected(downloadImageIntent['UPDATE_SHOT_REVERSE']),
      hideResultHistoryMenu: () => handler10(),
      scrollShotCardIntoView: (value61) => scrollShotCardIntoView(value61),
    }),
    {
      close: close2,
      requestReverseChange: requestReverseChange,
      reset: reset,
      splitAtPlayhead: splitAtPlayhead,
      watchOpeningVideo: watchOpeningVideo,
    } = editorController,
    personReplacementShotCutInteractionController = createPersonReplacementShotCutInteractionController({
      session: session,
      previewController: previewController,
      viewportController: viewportController,
      editorController: editorController,
      getRoot: () => floatingMenuHost,
      getProject: () => initialProject2,
      documentObject: documentObject,
      windowObject: windowObject,
      isDestroyed: () => value43,
      requestRender: () => run(),
      onShotCutDetectionRequested: onShotKeyframeSelected(downloadImageIntent['DETECT_SHOT_CUT_RANGES']),
      onShotCutRangesRequested: onShotKeyframeSelected(downloadImageIntent['UPDATE_SHOT_CUT_RANGES']),
      runRequest: (value62, value63) => handler11(value62, value63),
      updateSmartClipSettings: (...args5) => handler12(...args5),
    }),
    {
      applyBoundaryTime: applyBoundaryTime,
      beginBoundaryDrag: beginBoundaryDrag,
      getTimelineSecFromPointer: getTimelineSecFromPointer,
      hideHoverPlayhead: hideHoverPlayhead,
      syncHoverPlayhead: syncHoverPlayhead,
      undoDraft: undoDraft,
    } = personReplacementShotCutInteractionController,
    personReplacementAssetHoverPreviewController = createPersonReplacementAssetHoverPreviewController({
      getRoot: () => floatingMenuHost,
      getProject: () => initialProject2,
      getSelectedAppearance: (value64) => handler13(value64),
      isTargetAssetDragActive: () => enabled2,
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    {
      blockDropTarget: blockDropTarget,
      handlePointerMove: handlePointerMove,
      handlePointerOut: handlePointerOut,
      handlePointerOver: handlePointerOver,
      hide: hide,
    } = personReplacementAssetHoverPreviewController;
  let enabled3 = ![],
    value65 = null,
    value66 = null,
    value67 = 'none',
    value68 = 'page',
    value69 = '',
    handler14 = () => ![];
  const value70 = { accumulator: 0x0, lockedUntil: 0x0 },
    value71 = { accumulator: 0x0, lockedUntil: 0x0 },
    value72 = { accumulator: 0x0, lockedUntil: 0x0 },
    value73 = { accumulator: 0x0, lockedUntil: 0x0 },
    value74 = { accumulator: 0x0, lockedUntil: 0x0 },
    map3 = new Map(),
    map4 = new Map(),
    workspaceMenuController = createWorkspaceMenuController({
      root: () => floatingMenuHost,
      wrapperSelector: '[data-person-replacement-output-menu]',
      triggerSelector: '[data-person-replacement-output-menu-trigger]',
      menuSelector: '.story-canvas-sync-menu',
      optionSelector: '[data-person-replacement-output-menu-item]',
    }),
    personReplacementExportSubmenuController = createPersonReplacementExportSubmenuController({
      root: () => floatingMenuHost,
    }),
    handler15 = (value75 = null) => {
      return (personReplacementExportSubmenuController['close'](), workspaceMenuController['close'](value75));
    },
    handler16 = (value76) => workspaceMenuController['toggle'](value76),
    handler17 = (list5) => {
      if (hasWorkspaceIntent(downloadImageIntent['SELECT_SOURCE_VIDEOS']))
        return runIntent(downloadImageIntent['SELECT_SOURCE_VIDEOS'], list5);
      if (hasWorkspaceIntent(downloadImageIntent['SELECT_SOURCE_VIDEO']))
        return Promise['all'](
          list5['map']((value77) =>
            promptEnhancementModel(downloadImageIntent['SELECT_SOURCE_VIDEO'], value77),
          ),
        );
      return null;
    },
    handler18 = (list6) => {
      if (hasWorkspaceIntent(downloadImageIntent['SELECT_NEW_CHARACTER_IMAGES']))
        return runIntent(downloadImageIntent['SELECT_NEW_CHARACTER_IMAGES'], list6);
      if (hasWorkspaceIntent(downloadImageIntent['SELECT_NEW_CHARACTER_IMAGE']))
        return Promise['all'](
          list6['map']((value78) =>
            promptEnhancementModel(downloadImageIntent['SELECT_NEW_CHARACTER_IMAGE'], value78, {
              project: cloneJson(initialProject2),
            }),
          ),
        );
      return null;
    },
    handler19 = (value79 = initialProject2) =>
      refreshPersonReplacementWorkspaceAssets(value79, () =>
        hasWorkspaceIntent(downloadImageIntent['LIST_LIBRARY_ASSETS'])
          ? promptEnhancementModel(downloadImageIntent['LIST_LIBRARY_ASSETS'])
          : null,
      ),
    handler20 = (value80, reason2) => {
      const libraryProjects = normalizePersonReplacementWorkspaceProject(value80);
      if (typeof projectSession?.['commitWorkspaceProject'] !== 'function') return libraryProjects;
      const args6 = projectSession['commitWorkspaceProject'](cloneJson(libraryProjects), { reason: reason2 });
      return normalizePersonReplacementWorkspaceProject({
        ...args6,
        libraryProjects: libraryProjects['libraryProjects'],
        libraryAssets: libraryProjects['libraryAssets'],
        sourcePreviewRefs: libraryProjects['sourcePreviewRefs'],
        persistenceState: libraryProjects['persistenceState'],
      });
    },
    handler21 = (value81) => {
      ((initialProject2 = handler20(initialProject2, value81)),
        list3['forEach']((value82) => value82?.['syncPrices']?.()));
      if (value81 === 'image-prompt')
        syncPersonReplacementImagePromptGate(floatingMenuHost, initialProject2, handler22());
      return cloneJson(initialProject2);
    },
    handler23 = () => isPersonReplacementSourceProcessing(initialProject2),
    handler24 = (reason3, requestedStep = 0x0) => {
      promptEnhancementModel(downloadImageIntent['REPORT_STEP_NAVIGATION_BLOCKED'], {
        reason: reason3,
        currentStep: initialProject2['workspace']['step'],
        requestedStep: requestedStep,
        project: cloneJson(initialProject2),
      });
    },
    handler25 = (value83 = initialProject2) => {
      const value84 = value83?.['workspace'] || {};
      if (value84['view'] !== 'project') return normalizeText(value84['view']) || 'home';
      const count = Math['trunc'](Number(value84['step']) || 0x1);
      return count === 0x1
        ? 'project:' +
            count +
            ':asset:' +
            (['character', 'scene', 'audio', 'library']['includes'](value84['characterAssetTab'])
              ? value84['characterAssetTab']
              : 'character')
        : 'project:' + count;
    },
    handler26 = (value85 = initialProject2) =>
      (normalizeText(value85?.['id']) || 'draft') + '\x1f' + handler25(value85),
    handler27 = (value86, value87, { assetScope: assetScope = 'asset-content' } = {}) => {
      const value88 = value86?.['workspace'] || {},
        value89 = value87?.['workspace'] || {};
      if (value88['view'] !== 'project' || value89['view'] !== 'project') return;
      const value90 = Math['trunc'](Number(value88['step']) || 0x1),
        count2 = Math['trunc'](Number(value89['step']) || 0x1);
      if (value90 !== count2) {
        ((value67 = count2 > value90 ? 'forward' : 'backward'), (value68 = 'page'));
        return;
      }
      if (count2 !== 0x1) return;
      const workspaceTabTransitionDirection = resolveWorkspaceTabTransitionDirection(
        value88['characterAssetTab'],
        value89['characterAssetTab'],
        ['character', 'scene', 'audio', 'library'],
      );
      if (workspaceTabTransitionDirection === 'none') return;
      ((value67 = workspaceTabTransitionDirection),
        (value68 = assetScope === 'asset-list' ? 'asset-list' : 'asset-content'));
    },
    handler28 = (value91, args7 = null, { inPlace: inPlace = ![] } = {}) => {
      const args8 = value91?.['project'] || value91;
      if (args8 && typeof args8 === 'object') {
        const value92 = args7 ? { ...args8, workspace: { ...(args8['workspace'] || {}), ...args7 } } : args8;
        inPlace
          ? value93['syncProjectState'](value92, { returnSnapshot: ![] })
          : value93['setProject'](value92);
      }
    },
    handler11 = (
      handler29,
      value94,
      args9 = {},
      {
        applyCallbackResult: applyCallbackResult = !![],
        applyCallbackResultInPlace: applyCallbackResultInPlace = ![],
      } = {},
    ) => {
      const value95 =
        initialProject2['workspace']['view'] === 'home'
          ? {
              projectSearchQuery: initialProject2['workspace']['projectSearchQuery'],
              projectSortOrder: initialProject2['workspace']['projectSortOrder'],
              showArchivedProjects: initialProject2['workspace']['showArchivedProjects'],
              openProjectMenuId: '',
              pendingDeleteProjectId: '',
            }
          : null;
      try {
        const promise = handler29(value94, { project: cloneJson(initialProject2), ...args9 });
        if (promise?.['then'])
          void promise['then'](
            (value96) => {
              applyCallbackResult && handler28(value96, value95, { inPlace: applyCallbackResultInPlace });
            },
            () => {},
          );
        else applyCallbackResult && handler28(promise, value95, { inPlace: applyCallbackResultInPlace });
        return promise;
      } catch (value97) {
        return (
          globalThis['queueMicrotask']?.(() => {
            throw value97;
          }),
          null
        );
      }
    },
    runIntent = (value98, value99, value100 = {}, value101 = {}) =>
      handler11(onShotKeyframeSelected(value98), value99, value100, value101),
    handler30 = (el6, value102 = '') => {
      const text2 = normalizeText(el6?.['dataset']?.['shotId']);
      if (!text2) return '';
      const videoPrompt = readPersonReplacementVideoPromptEditor(el6);
      initialProject2 = normalizePersonReplacementWorkspaceProject({
        ...initialProject2,
        shots: initialProject2['shots']['map']((args10) =>
          args10['id'] === text2 ? { ...args10, videoPrompt: videoPrompt } : args10,
        ),
      });
      if (value102) handler21(value102);
      return videoPrompt;
    },
    handler31 = (promptEl, template, value103 = {}) => {
      if (!promptEl) return;
      (insertPresetPromptIntoEditor({
        storeApi: null,
        promptEl: promptEl,
        template: template,
        allowedAssetTypes: ['text', 'image', 'video', 'audio'],
      }),
        handler30(promptEl, 'video-prompt-preset'));
      if (value103?.['insertPrompt'] === !![]) return;
      runIntent(
        downloadImageIntent['GENERATE_REPLACEMENT_VIDEO'],
        { projectId: initialProject2['id'], shotId: normalizeText(promptEl['dataset']?.['shotId']) },
        {},
        { applyCallbackResult: ![] },
      );
    },
    handler32 = (value104, value105 = initialProject2['id']) =>
      normalizeText(value105) + '\x1f' + normalizeText(value104),
    handler33 = (value106, handler34) => {
      const value107 = handler32(value106);
      if (map['has'](value107)) return null;
      (map['add'](value107), run());
      let promise2 = null;
      try {
        promise2 = handler34();
      } catch (error) {
        return (
          map['delete'](value107),
          run(),
          windowObject?.['showToast']?.(error?.['message'] || '素材上传失败，请稍后重试。', 'error'),
          null
        );
      }
      const run2 = () => {
        if (!map['delete'](value107)) return;
        run();
      };
      if (!promise2?.['then']) return (run2(), promise2);
      return (
        void Promise['resolve'](promise2)
          ['catch']((error2) => {
            windowObject?.['showToast']?.(error2?.['message'] || '素材上传失败，请稍后重试。', 'error');
          })
          ['finally'](run2),
        promise2
      );
    },
    handler35 = (el7, enabled4) => {
      const el8 = el7?.['querySelector']?.('[data-person-replacement-action="toggle-library-add-targets"]'),
        el9 = el7?.['querySelector']?.('.story-asset-batch-menu');
      if (!el7 || !el8 || !el9) return ![];
      if (enabled4) syncWorkspaceInlineMenuExpandedWidth(el9);
      return (
        el7['classList']?.['toggle']?.('is-open', enabled4),
        el8['setAttribute']?.('aria-expanded', String(enabled4)),
        el9['setAttribute']?.('aria-hidden', String(!enabled4)),
        !![]
      );
    },
    handler36 = (value108 = null) => {
      floatingMenuHost?.['querySelectorAll']?.('.person-replacement-library-add-menu-wrap.is-open')?.[
        'forEach'
      ]?.((value109) => {
        if (value109 !== value108) handler35(value109, ![]);
      });
    },
    handler37 = (el10, enabled5) => {
      const el11 = el10?.['querySelector']?.('[data-story-action=\x22toggle-character-voice-menu\x22]'),
        el12 = el10?.['querySelector']?.('.person-replacement-add-voice-menu');
      if (!el10 || !el11 || !el12) return ![];
      return (
        el10['classList']?.['toggle']?.('is-open', enabled5),
        el11['setAttribute']?.('aria-expanded', String(enabled5)),
        el12['setAttribute']?.('aria-hidden', String(!enabled5)),
        !![]
      );
    },
    handler38 = (value110 = null) => {
      floatingMenuHost?.['querySelectorAll']?.('.person-replacement-add-voice-menu-wrap.is-open')?.[
        'forEach'
      ]?.((value111) => {
        if (value111 !== value110) handler37(value111, ![]);
      });
    },
    updateProject = (value112, value113, value114 = {}) => {
      const value115 = initialProject2;
      initialProject2 = handler20(value112, value113);
      const text3 = normalizeText(value113),
        assetScope2 = [
          'character-voice-library-open',
          'character-voice-library-cancel',
          'character-voice-library-confirm',
        ]['includes'](text3)
          ? 'asset-list'
          : 'asset-content';
      handler27(value115, initialProject2, { assetScope: assetScope2 });
      if (!handler14(value113, value114)) run();
      return (ctx?.['refresh'](), cloneJson(initialProject2));
    },
    handler39 = ({
      detectionBox: detectionBox,
      label: label,
      sourceCharacterId: sourceCharacterId,
      orientation: orientation,
    } = {}) => {
      const shotId = normalizeText(detectionBox?.['dataset']?.['shotId']),
        personId = normalizeText(detectionBox?.['dataset']?.['personId']),
        value116 = initialProject2['shots']['find']((value117) => value117['id'] === shotId),
        sourceCharacterId2 = value116?.['people']?.['find']((value118) => value118['id'] === personId);
      if (!sourceCharacterId2) return ![];
      const label2 = label === undefined ? normalizeText(sourceCharacterId2['label']) : normalizeText(label);
      if (!label2) return ![];
      const targetSourceCharacterId = normalizeText(
          sourceCharacterId,
          normalizeText(sourceCharacterId2['sourceCharacterId']),
        ),
        orientation2 =
          orientation === undefined
            ? normalizeText(sourceCharacterId2['orientation'])
            : normalizeText(orientation),
        personReplacementIdentityCorrectionDraftKey = getPersonReplacementIdentityCorrectionDraftKey(
          shotId,
          personId,
        ),
        identityCorrectionDrafts = { ...initialProject2['workspace']['identityCorrectionDrafts'] };
      delete identityCorrectionDrafts[personReplacementIdentityCorrectionDraftKey];
      const removedCustomPersonLabels = initialProject2['workspace']['removedCustomPersonLabels']['filter'](
        (value119) => value119 !== label2,
      );
      return (
        (initialProject2 = normalizePersonReplacementWorkspaceProject({
          ...initialProject2,
          workspace: {
            ...initialProject2['workspace'],
            identityCorrectionDrafts: identityCorrectionDrafts,
            removedCustomPersonLabels: removedCustomPersonLabels,
          },
        })),
        runIntent(downloadImageIntent['CONFIRM_SOURCE_IDENTITY'], {
          sourceCharacterId: sourceCharacterId2['sourceCharacterId'],
          targetSourceCharacterId: targetSourceCharacterId,
          shotId: shotId,
          personId: personId,
          label: label2,
          orientation: orientation2,
          silent: !![],
        }),
        !![]
      );
    },
    handler40 = (value120) => {
      const previewTrack = value120 === 'original' ? 'original' : 'replacement';
      if (previewTrack === 'replacement') {
        const personReplacementCompositePreviewSnapshot3 =
          buildPersonReplacementCompositePreviewSnapshot(initialProject2)['media'];
        if (!personReplacementCompositePreviewSnapshot3['replacementAudioRef'])
          return (
            windowObject?.['showToast']?.(
              '请返回「声音克隆」，先生成语音并点击「合成」，完成后再选择替换音轨。',
              'warn',
            ),
            cloneJson(initialProject2)
          );
      }
      if (
        previewTrack === initialProject2['audio']['previewTrack'] &&
        previewTrack === initialProject2['audio']['exportTrack']
      )
        return (
          personReplacementCompositePreviewController['setTrack'](previewTrack),
          cloneJson(initialProject2)
        );
      return (
        (initialProject2 = normalizePersonReplacementWorkspaceProject(
          transitionPersonReplacementOutput(
            {
              ...initialProject2,
              audio: { ...initialProject2['audio'], previewTrack: previewTrack, exportTrack: previewTrack },
            },
            { type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['FINAL_MUX_INVALIDATE'] },
          ),
        )),
        floatingMenuHost?.['querySelectorAll']?.('[data-person-replacement-action="set-preview-track"]')?.[
          'forEach'
        ]?.((el13) => {
          const value121 = el13['dataset']?.['previewTrack'] === previewTrack;
          (el13['classList']?.['toggle']?.('is-selected', value121),
            el13['setAttribute']?.('aria-pressed', String(value121)));
        }),
        personReplacementCompositePreviewController['setTrack'](previewTrack),
        handler21('preview-track'),
        cloneJson(initialProject2)
      );
    },
    handler41 = (value122 = '') => {
      const selectedShot = initialProject2['shots']['find'](
          (value123) =>
            value123['id'] === normalizeText(value122 || initialProject2['workspace']['selectedShotId']),
        ),
        stage = floatingMenuHost?.['querySelector']?.('[data-person-replacement-video-stage]'),
        videoEl = stage?.['querySelector']?.('[data-person-replacement-video-player]'),
        personReplacementVideoSlotState = resolvePersonReplacementVideoSlotState(
          initialProject2,
          selectedShot,
        )['slotEntries']['sourceVideo']?.['url'],
        mediaUrl = normalizeMediaUrl(personReplacementVideoSlotState);
      if (!selectedShot || !stage || !videoEl || !mediaUrl)
        return (windowObject?.['showToast']?.('当前视频片段尚未准备完成。', 'warn'), ![]);
      if (isPersonReplacementVideoCropReverseRunning(selectedShot))
        return (windowObject?.['showToast']?.('当前视频片段正在处理倒放，请稍后再裁剪。', 'info'), ![]);
      videoEl['pause']?.();
      const durationSec =
          Number(videoEl['duration']) > 0x0
            ? Number(videoEl['duration'])
            : Math['max'](0x0, Number(selectedShot['durationSec']) || 0x0),
        value124 = videoClipController?.['initForSource']?.(
          createPersonReplacementVideoCropOptions({
            projectId: initialProject2['id'],
            selectedShot: selectedShot,
            stage: stage,
            videoEl: videoEl,
            durationSec: durationSec,
            getProject: () => initialProject2,
            acceptProject: (value125) => {
              const personReplacementWorkspaceProject2 = normalizePersonReplacementWorkspaceProject(value125);
              return (
                normalizeText(personReplacementWorkspaceProject2['id']) ===
                  normalizeText(initialProject2['id']) &&
                  (initialProject2 = personReplacementWorkspaceProject2),
                initialProject2
              );
            },
            requestReverseChange: requestReverseChange,
            onConfirm: (args11) => {
              (personReplacementVideoPlaybackController['setClipActive'](![]),
                updateProject(
                  applyPersonReplacementVideoCrop(initialProject2, { ...args11, shotId: selectedShot['id'] }),
                  'video-crop',
                ));
            },
            onExit: ({ reason: reason4 } = {}) => {
              personReplacementVideoPlaybackController['setClipActive'](![]);
              if (['confirm', 'silent']['includes'](reason4) || value43) return;
              if (!handler42()) run();
            },
          }),
        );
      return personReplacementVideoPlaybackController['setClipActive'](value124 === !![]);
    },
    personReplacementLayoutResizeController = createPersonReplacementLayoutResizeController({
      documentObject: documentObject,
      windowObject: windowObject,
      getProject: () => initialProject2,
      commitLayoutChange: (value126) => {
        ((initialProject2 = normalizePersonReplacementWorkspaceProject(initialProject2)),
          handler21(value126 === 'asset-detail' ? 'asset-detail-split-ratio' : 'replacement-layout'));
      },
    }),
    { begin: begin, stop: stop } = personReplacementLayoutResizeController,
    requestRender = () => {
      if (value43 || !workspacePresentationLifecycle['isActive']()) return;
      if (initialProject2['workspace']['step'] !== 0x2 || !handler43()) run();
    },
    handler44 = (value127, value128) => {
      const promise3 = runIntent(
        value127,
        value128,
        { renderWorkspace: ![] },
        { applyCallbackResultInPlace: !![] },
      );
      if (promise3?.['then']) void promise3['then'](requestRender, () => {});
      else requestRender();
    },
    personReplacementPersonBoxInteractionController = createPersonReplacementPersonBoxInteractionController({
      getRoot: () => floatingMenuHost,
      getProject: () => initialProject2,
      requestRender: requestRender,
      runRequest: (...args12) => handler11(...args12),
      updateStageA11y: (...args13) => handler45(...args13),
      onDeletePeopleRequested: (value129) => handler44(downloadImageIntent['DELETE_PEOPLE'], value129),
      onManualPersonSelected: (value130) => handler44(downloadImageIntent['SELECT_MANUAL_PERSON'], value130),
      onUpdatePeopleRequested: (value131) =>
        runIntent(
          downloadImageIntent['UPDATE_PEOPLE'],
          value131,
          { renderWorkspace: ![] },
          { applyCallbackResultInPlace: !![] },
        ),
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    {
      beginBoxEdit: beginBoxEdit,
      beginManualSelection: beginManualSelection,
      bringBoxToFront: bringBoxToFront,
      cancelManualSelection: cancelManualSelection,
      clearBatchSelection: clearBatchSelection,
      clearKeyboardSelection: clearKeyboardSelection,
      destroy: destroy2,
      focusBatchSelectionStage: focusBatchSelectionStage,
      handleEscape: handleEscape,
      handleSelectionKeyDown: handleSelectionKeyDown,
      isManualSelectionActive: isManualSelectionActive,
      restoreLayerState: restoreLayerState,
      selectBatch: selectBatch,
      selectBox: selectBox,
      setManualSelectionActive: setManualSelectionActive,
      syncAfterRender: syncAfterRender,
    } = personReplacementPersonBoxInteractionController,
    characterId = (value132 = initialProject2['workspace']['selectedCharacterId']) =>
      initialProject2['characters']['find']((value133) => value133['id'] === value132) || null,
    handler13 = (value134 = characterId()) => {
      const value135 = Math['trunc'](
        Number(initialProject2['workspace']['assetAppearanceIndexes']?.[value134?.['id']]) || 0x0,
      );
      return (
        getWorkspaceAssetAppearances(value134)[value135] ||
        getWorkspaceAssetAppearances(value134)[0x0] ||
        null
      );
    },
    handler46 = () => {
      const value136 = initialProject2['workspace']['characterAssetTab'],
        error3 =
          value136 === 'scene'
            ? initialProject2['scenes']['find'](
                (value137) => value137['id'] === initialProject2['workspace']['selectedSceneId'],
              )
            : value136 === 'library'
              ? initialProject2['libraryAssets']['find'](
                  (value138) => value138['id'] === initialProject2['workspace']['selectedLibraryAssetId'],
                )
              : characterId(),
        error4 = value136 === 'library' ? error3 : handler13(error3),
        imageRef = normalizeText(error4?.['sourceUrl'] || error4?.['imageUrl'] || error4?.['thumbnailUrl']);
      if (!error3 || !imageRef) return null;
      const text4 = normalizeText(error3['name']) || '生成图片',
        filenameBase = normalizeText(error4?.['name']);
      return {
        imageRef: imageRef,
        filenameBase:
          filenameBase && filenameBase !== text4 && filenameBase !== '基础形象'
            ? [text4, filenameBase]['join']('-')
            : text4,
        title: '下载图片',
      };
    },
    {
      getSelectedReplacementImageDownloadRequest: getSelectedReplacementImageDownloadRequest,
      getSelectedReplacementVideoDownloadRequest: getSelectedReplacementVideoDownloadRequest,
      requestImageDownload: requestImageDownload,
      requestVideoDownload: requestVideoDownload,
    } = createPersonReplacementResultMediaActions({
      getProject: () => initialProject2,
      runIntent: runIntent,
      downloadImageIntent: downloadImageIntent['DOWNLOAD_IMAGE'],
      downloadVideoIntent: downloadImageIntent['DOWNLOAD_VIDEO'],
    }),
    handler47 = (value139, value140 = '未命名人物') =>
      String(value139 ?? '')
        ['replace'](/\s+/gu, '\x20')
        ['trim']() || value140,
    handler48 = (el14) => {
      const text5 = normalizeText(el14?.['dataset']?.['storyAssetNameId']),
        error5 = initialProject2['characters']['find']((value141) => value141['id'] === text5);
      if (!el14 || !error5 || el14['getAttribute']?.('contenteditable') === 'true') return ![];
      ((el14['dataset']['storyAssetOriginalName'] = error5['name']),
        el14['setAttribute']?.('contenteditable', 'true'),
        el14['setAttribute']?.('role', 'textbox'),
        el14['setAttribute']?.('aria-label', '修改' + error5['name'] + '的名称'),
        el14['classList']?.['add']?.('is-editing'),
        el14['focus']?.());
      const value142 = windowObject?.['getSelection']?.(),
        value143 = documentObject?.['createRange']?.();
      return (
        value142 &&
          value143 &&
          (value143['selectNodeContents']?.(el14),
          value142['removeAllRanges']?.(),
          value142['addRange']?.(value143)),
        !![]
      );
    },
    handler49 = (el15, { cancel: cancel = ![] } = {}) => {
      const text6 = normalizeText(el15?.['dataset']?.['storyAssetNameId']),
        error6 = initialProject2['characters']['find']((value144) => value144['id'] === text6);
      if (!el15 || !error6 || el15['getAttribute']?.('contenteditable') !== 'true') return ![];
      const value145 = handler47(el15['dataset']['storyAssetOriginalName'], error6['name']),
        name = cancel ? value145 : handler47(el15['textContent'], value145);
      ((initialProject2 = normalizePersonReplacementWorkspaceProject({
        ...initialProject2,
        characters: initialProject2['characters']['map']((args14) =>
          args14['id'] === text6 ? { ...args14, name: name } : args14,
        ),
      })),
        floatingMenuHost?.['querySelectorAll']?.('[data-story-asset-name-id]')?.['forEach']?.((el16) => {
          if (normalizeText(el16['dataset']['storyAssetNameId']) !== text6) return;
          ((el16['textContent'] = name),
            el16['removeAttribute']?.('contenteditable'),
            el16['removeAttribute']?.('role'),
            el16['setAttribute']?.('aria-label', '重命名' + name),
            el16['classList']?.['remove']?.('is-editing'),
            delete el16['dataset']['storyAssetOriginalName']);
        }));
      if (!cancel && name !== error6['name']) handler21('character-name');
      return !![];
    },
    handler50 = () => {
      ((ctx ??= createPersonReplacementResultHistoryController({
        getRoot: () => floatingMenuHost,
        getProject: () => initialProject2,
        renderHistoryMenu: (value146) =>
          personReplacementShotTimelinePresentation['renderHistoryMenu'](value146),
        selectShot: (...args15) => handler51(...args15),
        isCutEditorOpen: () => selectedIds['isOpen'],
      })),
        ctx['refresh']());
    },
    handler10 = () => ctx?.['hide'](),
    captureResultHistoryMenu = () => ctx?.['capture'](),
    restoreResultHistoryMenu = (value147) => ctx?.['restore'](value147),
    personReplacementVoiceCloneInteractionController = createPersonReplacementVoiceCloneInteractionController(
      {
        getRoot: () => floatingMenuHost,
        getProject: () => initialProject2,
        isDestroyed: () => value43,
        commitProject: (value148, { reason: reason = 'voice-clone', render: render = ![] } = {}) => {
          if (render) return updateProject(value148, reason);
          return (
            (initialProject2 = normalizePersonReplacementWorkspaceProject(value148)),
            handler21(reason),
            cloneJson(initialProject2)
          );
        },
        mountStudio: (...args16) =>
          promptEnhancementModel(downloadImageIntent['MOUNT_VOICE_STUDIO'], ...args16),
        resumeVoiceSeparation: (value149) =>
          runIntent(
            downloadImageIntent['RESUME_VOICE_EXTRACTION'],
            value149,
            {},
            { applyCallbackResult: ![] },
          ),
        resolveCharacterVoiceUrl: getCharacterVoiceUrl,
        documentObject: documentObject,
        windowObject: windowObject,
      },
    ),
    {
      bindSourcePlayback: bindSourcePlayback,
      canDropOnAudioParam: canDropOnAudioParam,
      clearDropTarget: clearDropTarget,
      destroy: destroy3,
      destroySourcePlaybackBindings: destroySourcePlaybackBindings,
      mount: mount,
      playPreview: playPreview,
      refreshSourceCards: refreshSourceCards,
      resetDropEligibility: resetDropEligibility,
      selectSource: selectSource,
      selectVoiceAsset: selectVoiceAsset,
      setDropTarget: setDropTarget,
      stopPreview: stopPreview,
      syncPreviewUi: syncPreviewUi,
      unmount: unmount,
    } = personReplacementVoiceCloneInteractionController,
    handler52 = () => {
      (list3['forEach']((value150) => value150?.['destroy']?.()), (list3 = []));
      const value151 = floatingMenuHost?.['querySelector']?.('.story-audio-detail');
      if (value151?.['ownerDocument']) list3['push'](bindWorkspaceSelects(value151));
      list3['push'](bindPersonReplacementPricing(floatingMenuHost, () => initialProject2));
      const audioPlaybackSurfaceController = createAudioPlaybackSurfaceController(
        floatingMenuHost?.['querySelector']?.(
          '.person-replacement-audio-playback[data-audio-playback-surface], .person-replacement-voice-library-playback[data-audio-playback-surface]',
        ),
        {
          onBeforePlay: stopPreview,
          onError: () => windowObject?.['showToast']?.('声音素材播放失败。', 'warn'),
        },
      );
      if (audioPlaybackSurfaceController) list3['push'](audioPlaybackSurfaceController);
      bindSourcePlayback();
      let el17 = null;
      bindAIGenVideoModelSelector2 = null;
      const value152 = floatingMenuHost?.['querySelector']?.('[data-aigen-image-model-selector]');
      if (value152) {
        const generationParamsByModel = initialProject2['workspace']['step'] === 0x1,
          modelId = generationParamsByModel
            ? initialProject2['settings']['characterImageModelId']
            : initialProject2['settings']['replacementImageModelId'],
          generationParams = generationParamsByModel
            ? initialProject2['settings']['characterImageGenerationParams']
            : initialProject2['settings']['replacementImageGenerationParams'],
          value153 = generationParamsByModel
            ? initialProject2['settings']['characterImageProvider']
            : initialProject2['settings']['replacementImageProvider'],
          providerProfileId = generationParamsByModel
            ? initialProject2['settings']['characterImageProviderProfileId']
            : initialProject2['settings']['replacementImageProviderProfileId'],
          providerProfileIdByModel = generationParamsByModel
            ? initialProject2['settings']['characterImageProviderProfileIdByModel']
            : initialProject2['settings']['replacementImageProviderProfileIdByModel'];
        list3['push'](
          bindAIGenImageModelSelector(value152, {
            modelId: modelId,
            provider: resolveModelProvider(modelId, value153),
            generationParams: generationParams,
            generationParamsByModel: generationParamsByModel
              ? initialProject2['settings']['characterImageGenerationParamsByModel']
              : initialProject2['settings']['replacementImageGenerationParamsByModel'],
            providerProfileId: providerProfileId,
            providerProfileIdByModel: providerProfileIdByModel,
            showSchemaControls: !![],
            documentObject: documentObject,
            windowObject: windowObject,
            floatingMenuHost: floatingMenuHost,
            schemaPopupPlacement: 'portal-auto-up',
            onChange: ({
              modelId: modelId2,
              provider: provider,
              generationParams: generationParams2,
              generationParamsByModel: generationParamsByModel2,
              providerProfileId: providerProfileId2,
              providerProfileIdByModel: providerProfileIdByModel2,
            }) => {
              const settings2 = { ...initialProject2['settings'] };
              generationParamsByModel
                ? ((settings2['characterImageModelId'] = modelId2),
                  (settings2['characterImageProvider'] = resolveModelProvider(modelId2, provider)),
                  (settings2['characterImageGenerationParams'] = normalizeCharacterAssetImageGenerationParams(
                    modelId2,
                    generationParams2,
                  )),
                  (settings2['characterImageGenerationParamsByModel'] = generationParamsByModel2),
                  (settings2['characterImageProviderProfileId'] = providerProfileId2),
                  (settings2['characterImageProviderProfileIdByModel'] = providerProfileIdByModel2))
                : ((settings2['replacementImageModelId'] = modelId2),
                  (settings2['replacementImageProvider'] = resolveModelProvider(modelId2, provider)),
                  (settings2['replacementImageGenerationParams'] = generationParams2),
                  (settings2['replacementImageGenerationParamsByModel'] = generationParamsByModel2),
                  (settings2['replacementImageProviderProfileId'] = providerProfileId2),
                  (settings2['replacementImageProviderProfileIdByModel'] = providerProfileIdByModel2));
              ((initialProject2 = normalizePersonReplacementWorkspaceProject({
                ...initialProject2,
                settings: settings2,
              })),
                handler21('image-model'));
              if (!generationParamsByModel) handler53();
              el17?.['sync']();
            },
          }),
        );
      }
      const value154 = floatingMenuHost?.['querySelector']?.('[data-aigen-video-model-selector]');
      if (value154) {
        const referenceCounts = personReplacementVideoPresentation['build'](initialProject2),
          generationParams3 = resolvePersonReplacementVideoParameterPolicy({
            modelId: initialProject2['settings']['replacementModelId'],
            inputMode: initialProject2['settings']['replacementVideoInputMode'],
            generationParams: initialProject2['settings']['replacementVideoGenerationParams'],
          });
        ((bindAIGenVideoModelSelector2 = bindAIGenVideoModelSelector(value154, {
          modelId: initialProject2['settings']['replacementModelId'],
          provider: resolveModelProvider(initialProject2['settings']['replacementModelId']),
          generationParams: generationParams3['generationParams'],
          uiSchemaFieldState: generationParams3['uiSchemaFieldState'],
          providerProfileId: initialProject2['settings']['replacementVideoProviderProfileId'],
          providerProfileIdByModel: initialProject2['settings']['replacementVideoProviderProfileIdByModel'],
          referenceCounts: referenceCounts['slotState']['referenceCounts'],
          showSchemaControls: !![],
          allowedModelIds: PERSON_REPLACEMENT_VIDEO_MODEL_IDS,
          documentObject: documentObject,
          windowObject: windowObject,
          floatingMenuHost: floatingMenuHost,
          modelSubmenuPlacement: 'viewport-auto-up',
          schemaPopupPlacement: 'viewport-auto-up',
          onChange: ({
            modelId: modelId3,
            generationParams: generationParams4,
            providerProfileId: providerProfileId3,
            providerProfileIdByModel: providerProfileIdByModel3,
          }) => {
            const replacementVideoGenerationParams = resolvePersonReplacementVideoParameterPolicy({
              modelId: modelId3,
              inputMode: initialProject2['settings']['replacementVideoInputMode'],
              generationParams: generationParams4,
              resetModeDefaults: modelId3 !== initialProject2['settings']['replacementModelId'],
            });
            initialProject2 = normalizePersonReplacementWorkspaceProject({
              ...initialProject2,
              settings: {
                ...initialProject2['settings'],
                replacementModelId: modelId3,
                replacementVideoGenerationParams: replacementVideoGenerationParams['generationParams'],
                replacementVideoProviderProfileId: providerProfileId3,
                replacementVideoProviderProfileIdByModel: providerProfileIdByModel3,
              },
            });
            const currentInputs = floatingMenuHost?.['querySelector']?.(
              '[data-person-replacement-video-reference-inputs]',
            );
            if (currentInputs) {
              const value155 = personReplacementIdentityPresentation['buildVideo'](
                  initialProject2,
                  personReplacementVideoPresentation['build'](initialProject2),
                )['referenceInputsHtml'],
                nextInputs =
                  typeof currentInputs['cloneNode'] === 'function' ? currentInputs['cloneNode'](![]) : null;
              (nextInputs && (nextInputs['innerHTML'] = value155),
                (!nextInputs ||
                  !reconcilePersonReplacementReferenceInputs({
                    currentInputs: currentInputs,
                    nextInputs: nextInputs,
                  })) &&
                  (currentInputs['innerHTML'] = value155));
            }
            (handler21('video-model'), el17?.['sync']());
          },
        })),
          list3['push'](bindAIGenVideoModelSelector2));
      }
      const panel =
        initialProject2['workspace']['step'] === 0x1
          ? {
              panel: floatingMenuHost?.['querySelector']?.(
                '.story-asset-detail-panel .story-asset-prompt-field',
              ),
              modelSetting: 'characterImageModelId',
              providerSetting: 'characterImageProvider',
              profileSetting: 'characterImageProviderProfileId',
              memorySetting: 'characterImageProviderProfileIdByModel',
            }
          : initialProject2['workspace']['step'] === 0x2
            ? {
                panel: floatingMenuHost?.['querySelector']?.(
                  '.person-replacement-image-generation-panel .person-replacement-prompt-input-wrapper',
                ),
                modelSetting: 'replacementImageModelId',
                providerSetting: 'replacementImageProvider',
                profileSetting: 'replacementImageProviderProfileId',
                memorySetting: 'replacementImageProviderProfileIdByModel',
              }
            : initialProject2['workspace']['step'] === 0x3
              ? {
                  panel: floatingMenuHost?.['querySelector']?.(
                    '.person-replacement-video-generation-panel .person-replacement-prompt-input-wrapper',
                  ),
                  modelSetting: 'replacementModelId',
                  providerSetting: '',
                  profileSetting: 'replacementVideoProviderProfileId',
                  memorySetting: 'replacementVideoProviderProfileIdByModel',
                }
              : null;
      panel?.['panel'] &&
        ((el17 = createModelProviderProfileControl({
          panel: panel['panel'],
          getNodeData: () => ({
            model: initialProject2['settings'][panel['modelSetting']],
            provider: panel['providerSetting']
              ? initialProject2['settings'][panel['providerSetting']]
              : resolveModelProvider(initialProject2['settings'][panel['modelSetting']]),
            providerProfileId: initialProject2['settings'][panel['profileSetting']],
            providerProfileIdByModel: initialProject2['settings'][panel['memorySetting']],
          }),
          onChange: (value156) => {
            if (
              panel['profileSetting'] === 'replacementVideoProviderProfileId' &&
              bindAIGenVideoModelSelector2?.['applyProviderProfilePatch']?.(value156)
            )
              return;
            ((initialProject2 = normalizePersonReplacementWorkspaceProject({
              ...initialProject2,
              settings: {
                ...initialProject2['settings'],
                [panel['profileSetting']]: value156['providerProfileId'],
                [panel['memorySetting']]: value156['providerProfileIdByModel'],
              },
            })),
              handler21('provider-profile'),
              el17?.['sync']());
          },
        })),
        list3['push']({ destroy: () => el17?.['remove']() }));
    },
    handler54 = (promptEl2) => {
      const enabled6 = personReplacementImagePresentation['build'](initialProject2)['selectedShot'];
      if (!promptEl2 || !enabled6) return null;
      const text7 = normalizeText(initialProject2['id']),
        text8 = normalizeText(enabled6['id']),
        shot = () =>
          normalizeText(initialProject2['id']) === text7
            ? initialProject2['shots']['find']((value157) => normalizeText(value157['id']) === text8)
            : null;
      return {
        nodeId: 'person-replacement-image:' + text8,
        promptEl: promptEl2,
        keepAssetMentionPills: !![],
        _data: {
          type: 'ai-image',
          model: initialProject2['settings']['replacementImageModelId'],
          provider: resolveModelProvider(
            initialProject2['settings']['replacementImageModelId'],
            initialProject2['settings']['replacementImageProvider'],
          ),
        },
        getMentionMenuPages: () => [{ id: 'assets', label: '素材', icon: 'assets' }],
        getMentionMenuDefaultPage: () => 'assets',
        getMentionCandidates: ({ query: query = '' } = {}) =>
          buildPersonReplacementPromptMentionCandidates(initialProject2, { query: query, shot: shot() }),
        getMentionVisual: ({ mention: mention, pill: pill } = {}) => {
          const response = mention?.['thumbUrl']
            ? mention
            : resolvePersonReplacementPromptMentionRef(pill, { project: initialProject2, shot: shot() });
          return {
            thumbUrl: normalizeMediaUrl(response?.['thumbUrl'] || response?.['url']),
            iconType: 'image',
          };
        },
        commitPromptHtml: (value158) => {
          if (!shot()) return;
          ((initialProject2 = normalizePersonReplacementWorkspaceProject({
            ...initialProject2,
            shots: initialProject2['shots']['map']((args17) =>
              normalizeText(args17['id']) === text8
                ? { ...args17, imagePrompt: sanitizePromptHtmlForCommit(value158) }
                : args17,
            ),
          })),
            handler21('image-prompt'));
        },
        getPromptHtml: () => normalizeText(shot()?.['imagePrompt']),
      };
    },
    handler55 = () => {
      (value47?.(), (value47 = null));
      if (initialProject2['workspace']['view'] !== 'project' || initialProject2['workspace']['step'] !== 0x2)
        return;
      const value159 = floatingMenuHost?.['querySelector']?.(
          '[data-person-replacement-field=\x22image-prompt\x22][contenteditable=\x22true\x22]',
        ),
        enabled7 = handler54(value159);
      if (!enabled7) return;
      const bindPromptMentionHost2 = bindPromptMentionHost(enabled7);
      value47 = () => bindPromptMentionHost2?.['destroy']?.();
    },
    handler56 = () => {
      (value50?.(), (value50 = null));
      if (initialProject2['workspace']['view'] !== 'project' || initialProject2['workspace']['step'] !== 0x2)
        return;
      const el18 =
        floatingMenuHost?.['querySelector']?.(
          '.person-replacement-middle-preview-slide:not(' +
            '.person-replacement-middle-preview-slide--outgoing) ' +
            '[data-person-replacement-keyframe-stage]\x20>\x20img',
        ) || floatingMenuHost?.['querySelector']?.('[data-person-replacement-keyframe-stage] > img');
      if (!el18) return;
      const run3 = () => syncPersonReplacementImageStageFrame(el18);
      if (el18['complete'] && Number(el18['naturalWidth']) > 0x0) run3();
      else el18['addEventListener']?.('load', run3, { once: !![] });
      const value160 = el18['closest']?.('[data-person-replacement-keyframe-stage]')?.['parentElement'],
        handler57 = windowObject?.['ResizeObserver'],
        value161 = typeof handler57 === 'function' ? new handler57(run3) : null;
      (value161?.['observe']?.(value160),
        windowObject?.['addEventListener']?.('resize', run3),
        (value50 = () => {
          (el18['removeEventListener']?.('load', run3),
            value161?.['disconnect']?.(),
            windowObject?.['removeEventListener']?.('resize', run3));
        }));
    },
    personReplacementBatchGenerationController = createPersonReplacementBatchGenerationController({
      getProject: () => initialProject2,
      buildImagePresentation: (value162) => personReplacementImagePresentation['build'](value162),
      getCharacterAppearance: getCharacterAppearance,
      runRequest: (...args18) => handler11(...args18),
      requestRender: () => run(),
      refreshShotSelectionControls: () => handler53(),
      resolveCharacterImageBatchConcurrency: onShotKeyframeSelected(
        downloadImageIntent['RESOLVE_CHARACTER_IMAGE_BATCH_CONCURRENCY'],
      ),
      onGenerateReplacementImageRequested: onShotKeyframeSelected(
        downloadImageIntent['GENERATE_REPLACEMENT_IMAGE'],
      ),
      onCancelReplacementImageRequested: onShotKeyframeSelected(
        downloadImageIntent['CANCEL_REPLACEMENT_IMAGE'],
      ),
      onGenerateReplacementVideoRequested: onShotKeyframeSelected(
        downloadImageIntent['GENERATE_REPLACEMENT_VIDEO'],
      ),
      onCancelReplacementVideoRequested: onShotKeyframeSelected(
        downloadImageIntent['CANCEL_REPLACEMENT_VIDEO'],
      ),
      onGenerateCharacterImageRequested: onShotKeyframeSelected(
        downloadImageIntent['GENERATE_CHARACTER_IMAGE'],
      ),
      onGenerationBatchCompleted: onShotKeyframeSelected(downloadImageIntent['COMPLETE_GENERATION_BATCH']),
      windowObject: windowObject,
    }),
    {
      cancelAssetBatch: cancelAssetBatch,
      cancelShotBatch: cancelShotBatch,
      destroy: destroy4,
      getAssetRenderState: getAssetRenderState,
      getShotRenderState: getShotRenderState,
      isShotBatchForCurrentProject: isShotBatchForCurrentProject,
      runAssetBatch: runAssetBatch,
      runShotBatch: runShotBatch,
    } = personReplacementBatchGenerationController,
    handler22 = () => {
      const shotBatchGenerationActive = getShotRenderState(),
        assetBatchGenerationActive = getAssetRenderState();
      return session['getWorkspacePresentation']({
        shotBatchGenerationActive: shotBatchGenerationActive['active'],
        shotBatchGenerationLabel: shotBatchGenerationActive['label'],
        shotBatchGeneratingShotIds: shotBatchGenerationActive['generatingShotIds'],
        shotBatchCancelRequested: shotBatchGenerationActive['cancelRequested'],
        assetBatchGenerationActive: assetBatchGenerationActive['active'],
        assetBatchGenerationLabel: assetBatchGenerationActive['label'],
        assetBatchGeneratingCharacterIds: assetBatchGenerationActive['generatingCharacterIds'],
        assetBatchCancelRequested: assetBatchGenerationActive['cancelRequested'],
        canvasSyncPending: canvasSyncPending,
        canvasSyncScope: canvasSyncScope,
        composeOutputPending: composeOutputPending2,
        exportOutputPending: exportOutputPending,
        canvasSyncOverlayInline: ![],
        assetLibraryDisclosure: assetLibraryDisclosure,
        assetUploadPendingKinds: ['character', 'scene', 'audio']['filter']((value163) =>
          map['has'](handler32(value163)),
        ),
        voiceLibraryTargetCharacterId: voiceLibraryTargetCharacterId,
        promptEnhancementModel:
          promptEnhancementModel(downloadImageIntent['GET_PROMPT_ENHANCEMENT_MODEL']) || {},
      });
    },
    handler58 = () => {
      const el19 = floatingMenuHost?.['querySelector']?.('#person-replacement-shot-cut-smart-detect-panel');
      if (!el19?.['style']) return ![];
      const count3 =
        Number(windowObject?.['innerWidth'] || documentObject?.['documentElement']?.['clientWidth']) || 0x0;
      if (count3 <= 0x2d0)
        return (
          ['top', 'right', 'bottom', 'left']['forEach']((value164) => {
            el19['style']['removeProperty']?.(value164);
          }),
          !![]
        );
      const el20 = floatingMenuHost?.['querySelector']?.(
          '[data-person-replacement-action="toggle-shot-cut-smart-detect"]',
        ),
        box = el20?.['getBoundingClientRect']?.(),
        box2 = el19['getBoundingClientRect']?.();
      if (!box || !box2) return ![];
      const value165 =
          Number(windowObject?.['innerHeight'] || documentObject?.['documentElement']?.['clientHeight']) ||
          0x0,
        value166 = 0x10,
        value167 = 0x8,
        value168 = Math['max'](
          value166,
          Math['min'](count3 - box2['width'] - value166, box['right'] - box2['width']),
        ),
        value169 = box['bottom'] + value167,
        value170 =
          value169 + box2['height'] <= value165 - value166
            ? value169
            : Math['max'](value166, box['top'] - box2['height'] - value167);
      return (
        el19['style']['setProperty']?.('top', value170 + 'px'),
        el19['style']['setProperty']?.('right', 'auto'),
        el19['style']['setProperty']?.('bottom', 'auto'),
        el19['style']['setProperty']?.('left', value168 + 'px'),
        !![]
      );
    },
    value171 = () => {
      if (selectedIds['isSmartDetectOpen']) handler58();
    },
    handler59 = (value172) => {
      const el21 = documentObject?.['createElement']?.('div');
      if (!el21) return null;
      return ((el21['innerHTML'] = String(value172 || '')['trim']()), el21['firstElementChild']);
    },
    handler60 = () => {
      const el22 = floatingMenuHost?.['querySelector']?.(
        '[data-person-replacement-compare-card="replacement"] .person-replacement-compare-media-frame',
      );
      if (!el22) return ![];
      (el22['classList']?.['toggle']?.('img-preview-loading', composeOutputPending2),
        el22['setAttribute']?.('aria-busy', String(composeOutputPending2)));
      if (composeOutputPending2) el22['setAttribute']?.('inert', '');
      else el22['removeAttribute']?.('inert');
      const el23 = el22['querySelector']?.('.story-asset-loading-overlay');
      if (composeOutputPending2 && !el23) {
        const value173 = handler59(
          renderWorkspaceAssetLoadingOverlay({
            title: '视频合成中',
            description: '正在合成替换片段，完成后会自动显示完整视频。',
          }),
        );
        if (value173) el22['appendChild']?.(value173);
      } else !composeOutputPending2 && el23?.['remove']?.();
      return !![];
    },
    handler61 = (el24, value174) => {
      if (!el24) return;
      try {
        el24['inert'] = value174;
      } catch {
        if (value174) el24['setAttribute']?.('inert', '');
        else el24['removeAttribute']?.('inert');
      }
      if (value174) el24['setAttribute']?.('inert', '');
      else el24['removeAttribute']?.('inert');
    },
    handler62 = ({ restoreFocus: restoreFocus = !![] } = {}) => {
      (map2['forEach']((value175, value176) => {
        handler61(value176, value175);
      }),
        map2['clear'](),
        el4?.['remove']?.(),
        (el4 = null),
        documentObject?.['body']?.['classList']?.['remove']?.('person-replacement-canvas-sync-active'),
        floatingMenuHost?.['classList']?.['remove']?.('is-canvas-sync-pending'),
        floatingMenuHost?.['setAttribute']?.('aria-busy', 'false'));
      if (
        restoreFocus &&
        floatingMenuHost?.['hidden'] === ![] &&
        el5 &&
        el5['isConnected'] !== ![] &&
        typeof el5['focus'] === 'function'
      )
        try {
          el5['focus']({ preventScroll: !![] });
        } catch {
          el5['focus']();
        }
      el5 = null;
    },
    handler63 = ({ captureFocus: captureFocus = ![] } = {}) => {
      if (!canvasSyncPending) {
        handler62();
        return;
      }
      const el25 = documentObject?.['body'];
      if (!el25) return;
      if (captureFocus) {
        const value177 = documentObject?.['activeElement'];
        el5 = floatingMenuHost?.['contains']?.(value177) ? value177 : null;
      }
      if (!el4) {
        el4 = handler59(
          personReplacementShellPresentation['renderCanvasSyncLoadingOverlay']({ canvasSyncPending: !![] }),
        );
        if (el4) el25['appendChild']?.(el4);
      }
      (Array['from'](el25['children'] || [])['forEach']((value178) => {
        if (value178 === el4) return;
        (!map2['has'](value178) &&
          map2['set'](value178, Boolean(value178?.['inert'] || value178?.['hasAttribute']?.('inert'))),
          handler61(value178, !![]));
      }),
        documentObject['body']?.['classList']?.['add']?.('person-replacement-canvas-sync-active'),
        floatingMenuHost?.['classList']?.['add']?.('is-canvas-sync-pending'),
        floatingMenuHost?.['setAttribute']?.('aria-busy', 'true'));
      try {
        el4?.['focus']?.({ preventScroll: !![] });
      } catch {
        el4?.['focus']?.();
      }
    },
    handler64 = () => '[data-person-replacement-shot-timeline-scroll]',
    handler65 = (el26) => {
      const text9 = normalizeText(initialProject2['workspace']['selectedShotId']);
      Array['from'](el26?.['querySelectorAll']?.('[data-person-replacement-shot-card="true"]') || [])[
        'forEach'
      ]((el27) => {
        const text10 = normalizeText(el27['dataset']?.['shotId']) === text9;
        (el27['classList']?.['toggle']?.('is-selected', text10),
          el27['setAttribute']?.('aria-current', String(text10)));
      });
    },
    handler66 = () => {
      (hide(),
        handler3(),
        list3['forEach']((value179) => value179?.['destroy']?.()),
        (list3 = []),
        destroySourcePlaybackBindings(),
        value47?.(),
        (value47 = null),
        value50?.(),
        (value50 = null));
    },
    handler67 = () => {
      const manualSelectionSurfaceActive =
        initialProject2['workspace']['step'] === 0x2 && !selectedIds['isOpen'];
      syncAfterRender({ manualSelectionSurfaceActive: manualSelectionSurfaceActive });
    },
    handler68 = (el28) => {
      const value180 = Number(el28?.['scrollLeft']) || 0x0,
        value181 = Number(el28?.['scrollTop']) || 0x0,
        value182 = el28?.['style']?.['overflowAnchor'] || '';
      el28?.['style']?.['setProperty']?.('overflow-anchor', 'none');
      const run4 = () => {
        if (!el28) return;
        ((el28['scrollLeft'] = value180), (el28['scrollTop'] = value181));
      };
      return () => {
        run4();
        const run5 = () => {
          (run4(),
            value182
              ? el28?.['style']?.['setProperty']?.('overflow-anchor', value182)
              : el28?.['style']?.['removeProperty']?.('overflow-anchor'));
        };
        typeof windowObject?.['requestAnimationFrame'] === 'function'
          ? windowObject['requestAnimationFrame'](run5)
          : run5();
      };
    },
    handler69 = (currentScroller, shotId2 = initialProject2['workspace']['selectedShotId']) => {
      const isBatchGenerating = getShotRenderState(),
        el29 = handler59(
          personReplacementShotTimelinePresentation['renderTimeline'](initialProject2, {
            allowCutEditing: !![],
            mode: 'image',
            isBatchGenerating: isBatchGenerating['active'],
            batchGenerationLabel: isBatchGenerating['label'],
            batchGeneratingShotIds: isBatchGenerating['generatingShotIds'],
            batchCancelRequested: isBatchGenerating['cancelRequested'],
          }),
        ),
        nextScroller = el29?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]');
      if (!currentScroller || !nextScroller) return ![];
      const run6 = handler68(currentScroller),
        reconcilePersonReplacementShotTimelineCard2 = reconcilePersonReplacementShotTimelineCard({
          currentScroller: currentScroller,
          nextScroller: nextScroller,
          shotId: shotId2,
        });
      if (!reconcilePersonReplacementShotTimelineCard2) return (run6(), ![]);
      return (handler65(currentScroller), run6(), !![]);
    },
    handler53 = () => {
      if (
        initialProject2['workspace']['view'] !== 'project' ||
        ![0x2, 0x3]['includes'](initialProject2['workspace']['step']) ||
        selectedIds['isOpen']
      )
        return ![];
      const mode = initialProject2['workspace']['step'] === 0x3,
        isBatchGenerating2 = getShotRenderState();
      syncPersonReplacementPromptModeControl(
        floatingMenuHost,
        initialProject2,
        isBatchGenerating2['generatingShotIds'],
      );
      const el30 = floatingMenuHost?.['querySelector']?.('.person-replacement-shot-timeline'),
        el31 = handler59(
          personReplacementShotTimelinePresentation['renderTimeline'](initialProject2, {
            allowCutEditing: !mode,
            mode: mode ? 'video' : 'image',
            isBatchGenerating: isBatchGenerating2['active'],
            batchGenerationLabel: isBatchGenerating2['label'],
            batchGeneratingShotIds: isBatchGenerating2['generatingShotIds'],
            batchCancelRequested: isBatchGenerating2['cancelRequested'],
          }),
        ),
        currentList = el30?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
        nextList = el31?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
        enabled8 = floatingMenuHost?.['querySelector']?.(
          mode
            ? '[data-person-replacement-action="generate-replacement-video"]'
            : '[data-person-replacement-action=\x22generate-replacement-image\x22]',
        ),
        args19 = handler22(),
        presentation = mode
          ? personReplacementVideoPresentation['build'](initialProject2)
          : personReplacementImagePresentation['build'](
              initialProject2,
              args19['shotBatchGeneratingShotIds'],
            ),
        enabled9 = handler59(
          mode
            ? personReplacementVideoPresentation['renderGenerateButton'](initialProject2, {
                presentation: presentation,
                ...args19,
              })
            : personReplacementImagePresentation['renderGenerateButton'](initialProject2, {
                presentation: presentation,
                ...args19,
              }),
        );
      if (
        !el30 ||
        !el31 ||
        !currentList ||
        !nextList ||
        !enabled8 ||
        !enabled9 ||
        typeof el30['replaceWith'] !== 'function' ||
        typeof enabled8['replaceWith'] !== 'function'
      )
        return ![];
      const run7 = handler68(currentList);
      if (!reconcilePersonReplacementShotCardList({ currentList: currentList, nextList: nextList }))
        return (run7(), ![]);
      (reconcileElementTree(el30, el31, {
        preserveChildNodes: !![],
        preserveSelector: '[data-person-replacement-shot-timeline-scroll]',
      }),
        reconcileElementTree(enabled8, enabled9, { preserveChildNodes: !![] }));
      if (!mode) syncPersonReplacementImageGenerationLoading(floatingMenuHost, presentation);
      return (run7(), ctx?.['refresh'](), !![]);
    },
    handler70 = () => {
      if (
        initialProject2['workspace']['view'] !== 'project' ||
        initialProject2['workspace']['step'] !== 0x5 ||
        selectedIds['isOpen']
      )
        return ![];
      const el32 = floatingMenuHost?.['querySelector']?.('.person-replacement-preview-shot-rail'),
        el33 = handler59(
          personReplacementCompositePreviewPresentation['renderRail'](
            buildPersonReplacementCompositePreviewSnapshot(initialProject2),
          ),
        ),
        enabled10 = floatingMenuHost?.['querySelector']?.('.person-replacement-preview-actions--toolbar'),
        enabled11 = handler59(
          personReplacementShellPresentation['renderToolbarActions'](initialProject2, handler22()),
        ),
        currentList2 = el32?.['querySelector']?.('.person-replacement-preview-shot-list'),
        nextList2 = el33?.['querySelector']?.('.person-replacement-preview-shot-list');
      if (
        !el32 ||
        !el33 ||
        !enabled10 ||
        !enabled11 ||
        typeof el32['replaceWith'] !== 'function' ||
        typeof enabled10['replaceWith'] !== 'function'
      )
        return ![];
      const value183 = currentList2 && nextList2 ? handler68(currentList2) : null;
      if (currentList2 && nextList2) {
        if (!reconcilePersonReplacementShotCardList({ currentList: currentList2, nextList: nextList2 }))
          return (value183?.(), ![]);
        nextList2['replaceWith'](currentList2);
      }
      return (el32['replaceWith'](el33), enabled10['replaceWith'](enabled11), value183?.(), !![]);
    },
    handler71 = () => {
      if (
        initialProject2['workspace']['view'] !== 'project' ||
        initialProject2['workspace']['step'] !== 0x5 ||
        selectedIds['isOpen']
      )
        return ![];
      const el34 = floatingMenuHost?.['querySelector']?.('[data-person-replacement-composite-preview]'),
        el35 = handler59(renderCompositePreview(initialProject2, handler22())),
        currentList3 = el34?.['querySelector']?.('.person-replacement-preview-shot-list'),
        nextList3 = el35?.['querySelector']?.('.person-replacement-preview-shot-list');
      if (
        !el34 ||
        !el35 ||
        !currentList3 ||
        !nextList3 ||
        typeof el34['replaceWith'] !== 'function' ||
        typeof nextList3['replaceWith'] !== 'function'
      )
        return ![];
      const run8 = handler68(currentList3);
      if (!reconcilePersonReplacementShotCardList({ currentList: currentList3, nextList: nextList3 }))
        return (run8(), ![]);
      return (
        nextList3['replaceWith'](currentList3),
        hide(),
        handler8(),
        handler4(),
        el34['replaceWith'](el35),
        run8(),
        handler9(),
        !![]
      );
    },
    handler43 = ({
      refreshTimelineCard: refreshTimelineCard = ![],
      timelineShotId: timelineShotId = initialProject2['workspace']['selectedShotId'],
    } = {}) => {
      if (
        initialProject2['workspace']['view'] !== 'project' ||
        ![0x2, 0x3]['includes'](initialProject2['workspace']['step']) ||
        selectedIds['isOpen']
      )
        return ![];
      const currentPage = floatingMenuHost?.['querySelector']?.('.person-replacement-production-page'),
        value184 = initialProject2['workspace']['step'] === 0x3,
        args20 = handler22(),
        nextPage = handler59(
          value184
            ? personReplacementVideoPresentation['render'](initialProject2, args20)
            : personReplacementImagePresentation['render'](initialProject2, {
                ...args20,
                omitShotTimeline: !![],
              }),
        ),
        value185 = handler64(),
        enabled12 = currentPage?.['querySelector']?.(value185),
        enabled13 = nextPage?.['querySelector']?.(value185),
        el36 = currentPage?.['querySelector']?.('.person-replacement-middle-layout'),
        enabled14 = nextPage?.['querySelector']?.('.person-replacement-middle-layout'),
        enabled15 = el36?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]');
      if (value184) {
        if (!currentPage || !nextPage || !enabled12 || !enabled13) return ![];
        const run9 = handler68(enabled12);
        if (!reconcilePersonReplacementVideoShotSelection({ currentPage: currentPage, nextPage: nextPage }))
          return ![];
        return (handler66(), run9(), handler67(), handler55(), handler52(), handler(), !![]);
      }
      if (!enabled12 || !el36 || !enabled14 || !enabled15) return ![];
      if (refreshTimelineCard && !handler69(enabled12, timelineShotId)) return ![];
      if (!refreshTimelineCard) handler65(enabled12);
      (hide(), value47?.(), (value47 = null));
      if (!reconcilePersonReplacementImageShotSelection({ currentPage: currentPage, nextPage: nextPage }))
        return ![];
      return (handler67(), handler55(), handler56(), !![]);
    },
    handler42 = () => {
      if (
        initialProject2['workspace']['view'] !== 'project' ||
        initialProject2['workspace']['step'] !== 0x3 ||
        selectedIds['isOpen'] ||
        personReplacementVideoPlaybackController['isClipActive']()
      )
        return ![];
      const el37 = floatingMenuHost?.['querySelector']?.('.person-replacement-production-page'),
        el38 = handler59(personReplacementVideoPresentation['render'](initialProject2, handler22())),
        value186 = el37?.['querySelector']?.('[data-person-replacement-video-playback-stage="source"]'),
        value187 = el38?.['querySelector']?.('[data-person-replacement-video-playback-stage="source"]'),
        shouldReusePersonReplacementVideoPlaybackStage2 = shouldReusePersonReplacementVideoPlaybackStage(
          value186,
          value187,
        ),
        enabled16 = el37?.['querySelector']?.('.person-replacement-video-reference-assets'),
        enabled17 = el38?.['querySelector']?.('.person-replacement-video-reference-assets'),
        el39 = el37?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
        el40 = el38?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
        currentList4 = el39?.['querySelector']?.('.person-replacement-shot-timeline-scroll'),
        nextList4 = el40?.['querySelector']?.('.person-replacement-shot-timeline-scroll'),
        el41 = el37?.['querySelector']?.('.person-replacement-video-generation-panel'),
        el42 = el38?.['querySelector']?.('.person-replacement-video-generation-panel'),
        enabled18 = el41?.['querySelector']?.('[data-person-replacement-video-reference-inputs]'),
        enabled19 = el42?.['querySelector']?.('[data-person-replacement-video-reference-inputs]'),
        enabled20 = el41?.['querySelector']?.(
          '[data-person-replacement-field="video-prompt"][contenteditable="true"]',
        ),
        enabled21 = el42?.['querySelector']?.(
          '[data-person-replacement-field="video-prompt"][contenteditable="true"]',
        ),
        value188 = el41?.['querySelector']?.('[data-person-replacement-video-playback-stage="result"]'),
        value189 = el42?.['querySelector']?.('[data-person-replacement-video-playback-stage=\x22result\x22]'),
        shouldReusePersonReplacementVideoPlaybackStage3 =
          shouldReusePersonReplacementVideoPlaybackStage(value188, value189) &&
          typeof value189?.['replaceWith'] === 'function',
        value190 = el37?.['querySelector']?.('.person-replacement-step-footer'),
        value191 = el38?.['querySelector']?.('.person-replacement-step-footer'),
        list7 = [
          ...(!shouldReusePersonReplacementVideoPlaybackStage2
            ? [
                [
                  el37?.['querySelector']?.('.person-replacement-middle-preview-slide'),
                  el38?.['querySelector']?.('.person-replacement-middle-preview-slide'),
                ],
              ]
            : []),
          [el39, el40],
          [el41, el42],
          [value190, value191],
        ];
      if (
        !el37 ||
        !el38 ||
        !currentList4 ||
        !nextList4 ||
        !enabled16 ||
        !enabled17 ||
        !enabled18 ||
        !enabled19 ||
        !enabled20 ||
        !enabled21 ||
        list7['some'](
          ([enabled22, enabled23]) =>
            !enabled22 || !enabled23 || typeof enabled22['replaceWith'] !== 'function',
        )
      )
        return ![];
      const run10 = handler68(currentList4);
      if (!reconcilePersonReplacementShotCardList({ currentList: currentList4, nextList: nextList4 }))
        return (run10(), ![]);
      (hide(), reconcileElementTree(enabled16, enabled17, { preserveChildNodes: !![] }));
      if (!shouldReusePersonReplacementVideoPlaybackStage3)
        personReplacementVideoPlaybackController['destroyRole']('result');
      if (!shouldReusePersonReplacementVideoPlaybackStage2)
        personReplacementVideoPlaybackController['destroyRole']('source');
      (list7['forEach'](([value192, value193]) => {
        reconcileElementTree(value192, value193, {
          preserveChildNodes: !![],
          preserveSelector:
            '[data-person-replacement-result-history-menu], .person-replacement-shot-timeline-scroll, [data-aigen-video-model-selector], .person-replacement-prompt-input-wrapper' +
            (shouldReusePersonReplacementVideoPlaybackStage3
              ? ', [data-person-replacement-video-playback-stage="result"]'
              : ''),
        });
      }),
        run10(),
        bindAIGenVideoModelSelector2?.['syncContext']?.({
          ...resolvePersonReplacementVideoParameterPolicy({
            modelId: initialProject2['settings']['replacementModelId'],
            inputMode: initialProject2['settings']['replacementVideoInputMode'],
            generationParams: initialProject2['settings']['replacementVideoGenerationParams'],
          }),
          referenceCounts:
            personReplacementVideoPresentation['build'](initialProject2)['slotState']['referenceCounts'],
        }));
      if (shouldReusePersonReplacementVideoPlaybackStage3) handler2();
      else handler({ roles: ['result'], reset: ![] });
      if (!shouldReusePersonReplacementVideoPlaybackStage2) handler({ roles: ['source'], reset: ![] });
      return !![];
    };
  handler14 = (
    value194,
    { timelineShotId: timelineShotId = initialProject2['workspace']['selectedShotId'] } = {},
  ) => {
    const text11 = normalizeText(value194);
    if (
      initialProject2['workspace']['step'] === 0x1 &&
      [
        'asset-selection-mode',
        'asset-selection-cancel',
        'asset-selection-all',
        'asset-selection',
        'scene-asset-selection',
      ]['includes'](text11)
    )
      return syncPersonReplacementAssetSelection(
        floatingMenuHost,
        renderAssetSettings(initialProject2, handler22()),
      );
    if (
      initialProject2['workspace']['step'] === 0x2 &&
      [
        'replacement-target-asset-select',
        'replacement-scene-asset-select',
        'target-appearance-preview-change',
      ]['includes'](text11)
    )
      return syncPersonReplacementAssetSelection(
        floatingMenuHost,
        personReplacementImagePresentation['render'](initialProject2, {
          ...handler22(),
          omitShotTimeline: !![],
        }),
        { targetRail: !![] },
      );
    if (
      initialProject2['workspace']['step'] === 0x2 &&
      [
        'person-mapping',
        'person-mapping-current-shot',
        'person-mapping-clear',
        'person-mapping-clear-reference',
      ]['includes'](text11)
    )
      return handler43();
    if (text11 === 'shot-marquee' || text11['startsWith']('shot-selection'))
      return initialProject2['workspace']['step'] === 0x5 ? handler70() : handler53();
    if (
      text11 === 'video-input-mode' ||
      text11 === 'video-reference-change' ||
      text11 === 'replacement-video-result' ||
      text11 === 'replacement-video-reference' ||
      text11 === 'delete-replacement-video-result' ||
      ((text11 === 'replacement-image-result' || text11 === 'delete-replacement-image-result') &&
        initialProject2['workspace']['step'] === 0x3)
    )
      return handler42();
    if (
      (text11 === 'replacement-image-result' || text11 === 'delete-replacement-image-result') &&
      initialProject2['workspace']['step'] === 0x2
    )
      return handler43({ refreshTimelineCard: !![], timelineShotId: timelineShotId });
    if (text11 === 'shot-select')
      return initialProject2['workspace']['step'] === 0x5 ? handler71() : handler43();
    if (text11 === 'replacement-image-reference' && initialProject2['workspace']['step'] === 0x2)
      return handler43({ refreshTimelineCard: !![] });
    if (text11 === 'composite-full-video-select') return handler71();
    return ![];
  };
  let run = () => {
    if (!floatingMenuHost || value43) return;
    ((value66 = null),
      handler7(),
      handler8(),
      handler3(),
      handler4(),
      stopPlayback(),
      clearPreviewMetadata(),
      cancelFrameWait(),
      (selectedIds['pendingPreviewSeek'] = null),
      (selectedIds['hoverPreviewActive'] = ![]),
      (selectedIds['hoverPreviewTimeSec'] = null),
      cancelHoverPreview(),
      list3['forEach']((value195) => value195?.['destroy']?.()),
      (list3 = []),
      destroySourcePlaybackBindings(),
      value47?.(),
      (value47 = null),
      unmount(),
      (selectedIds['playheadElement'] = null),
      (selectedIds['clockElement'] = null),
      (floatingMenuHost['dataset']['personReplacementView'] = initialProject2['workspace']['view']),
      (floatingMenuHost['dataset']['personReplacementStep'] = String(initialProject2['workspace']['step'])),
      (floatingMenuHost['innerHTML'] =
        initialProject2['workspace']['view'] === 'home'
          ? personReplacementShellPresentation['renderHome'](initialProject2)
          : renderProject(initialProject2, handler22())),
      restoreLayerState(),
      handler55(),
      handler56(),
      handler52(),
      handler(),
      handler9(),
      mount(),
      syncPreviewUi());
  };
  const navigate = (value196) => {
      const step = Math['trunc'](clamp(value196, 0x1, 0x5, initialProject2['workspace']['step']));
      if (step > initialProject2['workspace']['step'] && handler23())
        return (handler24('step-change', step), cloneJson(initialProject2));
      const personReplacementStepGate = getPersonReplacementStepGate(initialProject2, step);
      if (step !== initialProject2['workspace']['step'] && !personReplacementStepGate['allowed'])
        return (handler24(personReplacementStepGate['reason'], step), cloneJson(initialProject2));
      return (
        close2({ animate: ![], renderWorkspace: ![] }),
        updateProject(
          { ...initialProject2, workspace: { ...initialProject2['workspace'], step: step } },
          'step-change',
        )
      );
    },
    handler72 = (value197) =>
      handleWorkspaceStepShortcut(value197, {
        enabled: Boolean(
          floatingMenuHost &&
          !floatingMenuHost['hidden'] &&
          !canvasSyncPending &&
          initialProject2['workspace']['view'] === 'project',
        ),
        stepCount: PERSON_REPLACEMENT_STEPS['length'],
        navigate: navigate,
      }),
    handler73 = (count4, value198 = '') => {
      const value199 = value198
          ? [...initialProject2['characters'], ...initialProject2['scenes']]['find'](
              (value200) => value200['id'] === value198,
            )
          : initialProject2['workspace']['characterAssetTab'] === 'scene'
            ? initialProject2['scenes']['find'](
                (value201) => value201['id'] === initialProject2['workspace']['selectedSceneId'],
              )
            : characterId(),
        list8 = getWorkspaceAssetAppearances(value199);
      if (list8['length'] < 0x2) return;
      const value202 = Math['trunc'](
          Number(initialProject2['workspace']['assetAppearanceIndexes']?.[value199['id']]) || 0x0,
        ),
        value203 = (value202 + count4 + list8['length']) % list8['length'],
        value204 = count4 > 0x0 ? 'next' : 'previous',
        enabled24 =
          value199['id'] ===
          (initialProject2['workspace']['characterAssetTab'] === 'scene'
            ? initialProject2['workspace']['selectedSceneId']
            : initialProject2['workspace']['selectedCharacterId']),
        el43 = floatingMenuHost?.['querySelector']?.('.story-asset-detail .story-asset-preview-slide')?.[
          'cloneNode'
        ]?.(!![]);
      updateProject(
        {
          ...initialProject2,
          workspace: {
            ...initialProject2['workspace'],
            assetAppearanceIndexes: {
              ...initialProject2['workspace']['assetAppearanceIndexes'],
              [value199['id']]: value203,
            },
          },
        },
        'appearance-change',
      );
      if (!enabled24) return;
      const el44 = floatingMenuHost?.['querySelector']?.('.story-asset-detail'),
        enabled25 = el44?.['querySelector']?.('.story-asset-preview-slide');
      if (!el44 || !enabled25) return;
      el44['classList']['remove']('is-sliding-next', 'is-sliding-previous');
      if (el43) {
        (el43['classList']['remove']('img-preview-loading'),
          el43['classList']['add']('story-asset-preview-slide--outgoing', 'is-sliding-' + value204),
          el43['removeAttribute']?.('aria-busy'),
          el43['setAttribute']?.('aria-hidden', 'true'),
          el43['querySelector']?.('.img-loading-overlay')?.['remove']?.(),
          enabled25['after']?.(el43));
        const value205 = () => el43['remove']?.();
        (el43['addEventListener']?.('animationend', value205, { once: !![] }),
          windowObject?.['setTimeout']?.(value205, 0x1cc));
      }
      (void el44['offsetWidth'], el44['classList']['add']('is-sliding-' + value204));
    },
    handler74 = (value206) => {
      const personReplacementProjectAudioAssets = getPersonReplacementProjectAudioAssets(initialProject2)[
          'find'
        ]((value207) => value207['id'] === initialProject2['workspace']['selectedAudioAssetId']),
        selectedCharacterId = getPersonReplacementVoiceLibraryBoundCharacters(
          initialProject2,
          personReplacementProjectAudioAssets,
        );
      if (selectedCharacterId['length'] < 0x2) return;
      const value208 = Math['max'](
          0x0,
          selectedCharacterId['findIndex'](
            (value209) => value209['id'] === initialProject2['workspace']['selectedCharacterId'],
          ),
        ),
        value210 = (value208 + value206 + selectedCharacterId['length']) % selectedCharacterId['length'];
      updateProject(
        {
          ...initialProject2,
          workspace: {
            ...initialProject2['workspace'],
            selectedCharacterId: selectedCharacterId[value210]['id'],
          },
        },
        'audio-bound-character-change',
      );
    },
    scrollShotCardIntoView = (value211) => {
      const run11 = () => {
        Array['from'](
          floatingMenuHost?.['querySelectorAll']?.('[data-person-replacement-shot-card="true"]') || [],
        )
          ['find']((el45) => el45['dataset']?.['shotId'] === normalizeText(value211))
          ?.['scrollIntoView']?.({ block: 'nearest', inline: 'nearest' });
      };
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? windowObject['requestAnimationFrame'](run11)
        : run11();
    },
    getShotSwitchDirection = (value212) => {
      const count5 = initialProject2['shots']['findIndex'](
          (value213) => value213['id'] === normalizeText(initialProject2['workspace']['selectedShotId']),
        ),
        count6 = initialProject2['shots']['findIndex'](
          (value214) => value214['id'] === normalizeText(value212),
        );
      if (count5 < 0x0 || count6 < 0x0 || count5 === count6) return '';
      return count6 > count5 ? 'next' : 'previous';
    },
    captureImagePreviewSlide = () =>
      floatingMenuHost?.['querySelector']?.(
        '.person-replacement-image-generation-panel ' +
          '.person-replacement-image-preview-slide:not(' +
          '.person-replacement-image-preview-slide--outgoing)',
      )?.['cloneNode']?.(!![]) || null,
    captureMiddlePreviewSlide = () =>
      floatingMenuHost?.['querySelector']?.(
        '.person-replacement-middle-layout ' +
          '>\x20.person-replacement-middle-preview-slide:not(' +
          '.person-replacement-middle-preview-slide--outgoing)',
      )?.['cloneNode']?.(!![]) || null,
    handler75 = (el46) => {
      return (
        el46?.['querySelectorAll']?.(
          '.person-replacement-detection-empty,\x20' +
            '.person-replacement-keyframe-tools, ' +
            '.person-replacement-shot-navigation-arrow',
        )?.['forEach']?.((el47) => el47['remove']?.()),
        el46?.['querySelectorAll']?.('.person-replacement-detection-box')?.['forEach']?.((value215) =>
          value215['replaceChildren']?.(),
        ),
        el46
      );
    },
    captureVideoResultSlide = () =>
      floatingMenuHost?.['querySelector']?.(
        '.person-replacement-video-generation-panel\x20' +
          '.person-replacement-video-result-slide:not(' +
          '.person-replacement-video-result-slide--outgoing)',
      ) || null,
    playMiddlePreviewTransition = (value216, outgoingSlide) => {
      const direction2 = value216 === 'previous' ? 'previous' : 'next',
        el48 = floatingMenuHost?.['querySelector']?.('.person-replacement-middle-layout'),
        incomingSlide = el48?.['querySelector']?.(
          '.person-replacement-middle-preview-slide:not(' +
            '.person-replacement-middle-preview-slide--outgoing)',
        );
      if (!el48 || !incomingSlide || incomingSlide === outgoingSlide) return ![];
      (el48['querySelectorAll']?.('.person-replacement-middle-preview-slide--outgoing')?.['forEach']?.(
        (el49) => el49['remove']?.(),
      ),
        el48['classList']?.['remove']?.('is-sliding-next', 'is-sliding-previous'));
      if (outgoingSlide) {
        (handler75(outgoingSlide),
          outgoingSlide['classList']?.['remove']?.(
            'img-preview-loading',
            'is-sliding-next',
            'is-sliding-previous',
          ),
          outgoingSlide['classList']?.['add']?.('person-replacement-middle-preview-slide--outgoing'),
          outgoingSlide['removeAttribute']?.('aria-busy'),
          outgoingSlide['setAttribute']?.('aria-hidden', 'true'));
        try {
          outgoingSlide['inert'] = !![];
        } catch {}
        (outgoingSlide['querySelector']?.('.story-asset-loading-overlay, .img-loading-overlay')?.[
          'remove'
        ]?.(),
          el48['append']?.(outgoingSlide));
      }
      const startPersonReplacementSlideTransition2 = startPersonReplacementSlideTransition({
        windowObject: windowObject,
        incomingSlide: incomingSlide,
        outgoingSlide: outgoingSlide,
        direction: direction2,
      });
      let value217 = ![];
      const value218 = () => {
        if (value217) return;
        ((value217 = !![]),
          cancelPersonReplacementSlideTransition(startPersonReplacementSlideTransition2),
          outgoingSlide?.['remove']?.());
      };
      return (
        startPersonReplacementSlideTransition2['finished']['then'](value218),
        windowObject?.['setTimeout']?.(value218, startPersonReplacementSlideTransition2['duration'] + 0x50),
        !![]
      );
    },
    playImagePreviewTransition = (value219, outgoingSlide2) => {
      const direction3 = value219 === 'previous' ? 'previous' : 'next',
        el50 = floatingMenuHost?.['querySelector']?.(
          '.person-replacement-image-generation-panel ' + '.person-replacement-generation-preview',
        ),
        incomingSlide2 = el50?.['querySelector']?.(
          '.person-replacement-image-preview-slide:not(' +
            '.person-replacement-image-preview-slide--outgoing)',
        );
      if (!el50 || !incomingSlide2) return ![];
      (el50['querySelectorAll']?.('.person-replacement-image-preview-slide--outgoing')?.['forEach']?.(
        (el51) => el51['remove']?.(),
      ),
        el50['classList']?.['remove']?.('is-sliding-next', 'is-sliding-previous'));
      outgoingSlide2 &&
        (outgoingSlide2['classList']?.['remove']?.('img-preview-loading'),
        outgoingSlide2['classList']?.['add']?.('person-replacement-image-preview-slide--outgoing'),
        outgoingSlide2['removeAttribute']?.('aria-busy'),
        outgoingSlide2['setAttribute']?.('aria-hidden', 'true'),
        outgoingSlide2['querySelector']?.('.story-asset-loading-overlay, .img-loading-overlay')?.[
          'remove'
        ]?.(),
        el50['append']?.(outgoingSlide2));
      const startPersonReplacementSlideTransition3 = startPersonReplacementSlideTransition({
        windowObject: windowObject,
        incomingSlide: incomingSlide2,
        outgoingSlide: outgoingSlide2,
        direction: direction3,
      });
      let value220 = ![];
      const value221 = () => {
        if (value220) return;
        ((value220 = !![]),
          cancelPersonReplacementSlideTransition(startPersonReplacementSlideTransition3),
          outgoingSlide2?.['remove']?.());
      };
      return (
        startPersonReplacementSlideTransition3['finished']['then'](value221),
        windowObject?.['setTimeout']?.(value221, startPersonReplacementSlideTransition3['duration'] + 0x50),
        !![]
      );
    },
    playVideoResultTransition = (value222, outgoingSlide3) => {
      const direction4 = value222 === 'previous' ? 'previous' : 'next',
        el52 = floatingMenuHost?.['querySelector']?.(
          '.person-replacement-video-generation-panel ' + '.person-replacement-video-result',
        ),
        incomingSlide3 = el52?.['querySelector']?.(
          '.person-replacement-video-result-slide:not(' + '.person-replacement-video-result-slide--outgoing)',
        );
      if (!el52 || !incomingSlide3 || incomingSlide3 === outgoingSlide3) return ![];
      (el52['querySelectorAll']?.('.person-replacement-video-result-slide--outgoing')?.['forEach']?.((el53) =>
        el53['remove']?.(),
      ),
        el52['classList']?.['remove']?.('is-sliding-next', 'is-sliding-previous'));
      if (outgoingSlide3) {
        (outgoingSlide3['classList']?.['remove']?.(
          'img-preview-loading',
          'is-sliding-next',
          'is-sliding-previous',
        ),
          outgoingSlide3['classList']?.['add']?.('person-replacement-video-result-slide--outgoing'),
          outgoingSlide3['removeAttribute']?.('aria-busy'),
          outgoingSlide3['setAttribute']?.('aria-hidden', 'true'));
        try {
          outgoingSlide3['inert'] = !![];
        } catch {}
        (outgoingSlide3['querySelector']?.('.story-asset-loading-overlay, .img-loading-overlay')?.[
          'remove'
        ]?.(),
          el52['append']?.(outgoingSlide3));
      }
      const startPersonReplacementSlideTransition4 = startPersonReplacementSlideTransition({
        windowObject: windowObject,
        incomingSlide: incomingSlide3,
        outgoingSlide: outgoingSlide3,
        direction: direction4,
      });
      let value223 = ![];
      const value224 = () => {
        if (value223) return;
        ((value223 = !![]),
          cancelPersonReplacementSlideTransition(startPersonReplacementSlideTransition4),
          outgoingSlide3?.['remove']?.());
      };
      return (
        startPersonReplacementSlideTransition4['finished']['then'](value224),
        windowObject?.['setTimeout']?.(value224, startPersonReplacementSlideTransition4['duration'] + 0x50),
        !![]
      );
    },
    handler76 = (value225) => {
      if (initialProject2['workspace']['view'] !== 'project' || initialProject2['workspace']['step'] !== 0x5)
        return ![];
      const el54 = floatingMenuHost?.['querySelector']?.('.person-replacement-compare-grid');
      if (!el54) return ![];
      const value226 = value225 === 'previous' ? 'previous' : 'next';
      return (
        el54['classList']?.['remove']?.('is-sliding-next'),
        el54['classList']?.['remove']?.('is-sliding-previous'),
        void el54['offsetWidth'],
        el54['classList']?.['add']?.('is-sliding-' + value226),
        !![]
      );
    },
    handler51 = (value227, { direction: direction = '', ensureVisible: ensureVisible = ![] } = {}) => {
      const selectedShotId = normalizeText(value227),
        enabled26 = initialProject2['shots']['find']((value228) => value228['id'] === selectedShotId),
        enabled27 =
          initialProject2['workspace']['step'] === 0x5 &&
          buildPersonReplacementCompositePreviewSnapshot(initialProject2)['previewMode'] === 'full';
      if (!enabled26 || (selectedShotId === initialProject2['workspace']['selectedShotId'] && !enabled27))
        return ![];
      const value229 = direction || getShotSwitchDirection(selectedShotId),
        value230 = captureImagePreviewSlide(),
        value231 = captureMiddlePreviewSlide(),
        value232 = captureVideoResultSlide();
      (updateProject(
        {
          ...initialProject2,
          workspace: {
            ...initialProject2['workspace'],
            selectedShotId: selectedShotId,
            ...(initialProject2['workspace']['step'] === 0x5 ? { compositePreviewMode: 'shot' } : {}),
          },
        },
        'shot-select',
      ),
        playImagePreviewTransition(value229 || 'next', value230),
        playMiddlePreviewTransition(value229 || 'next', value231),
        playVideoResultTransition(value229 || 'next', value232),
        handler76(value229 || 'next'));
      if (ensureVisible) scrollShotCardIntoView(selectedShotId);
      return !![];
    },
    handler45 = (el55) => {
      el55?.['setAttribute']?.(
        'aria-label',
        el55?.['dataset']?.['personReplacementShotWheel'] === 'true'
          ? '拖拽新增可替换主体；按住 Ctrl 拖拽可多选人物框；按 D 或 Delete 删除选中框；滚轮或左右方向键切换片段'
          : '拖拽新增可替换主体；按住 Ctrl 拖拽可多选人物框，按 D 或 Delete 批量删除',
      );
    },
    handler77 = (value233) => {
      const list9 = Array['isArray'](initialProject2['shots']) ? initialProject2['shots'] : [];
      if (list9['length'] < 0x2) return ![];
      const value234 = Math['max'](
          0x0,
          list9['findIndex']((value235) => value235['id'] === initialProject2['workspace']['selectedShotId']),
        ),
        value236 = (value234 + Math['sign'](Number(value233) || 0x0) + list9['length']) % list9['length'],
        enabled28 = list9[value236];
      if (!enabled28 || enabled28['id'] === initialProject2['workspace']['selectedShotId']) return ![];
      return handler51(enabled28['id'], {
        direction: Math['sign'](Number(value233) || 0x0) < 0x0 ? 'previous' : 'next',
        ensureVisible: !![],
      });
    },
    personReplacementResultSelectionController = createPersonReplacementResultSelectionController({
      getProject: () => initialProject2,
      updateProject: updateProject,
      getShotSwitchDirection: getShotSwitchDirection,
      captureImagePreviewSlide: captureImagePreviewSlide,
      captureMiddlePreviewSlide: captureMiddlePreviewSlide,
      captureVideoResultSlide: captureVideoResultSlide,
      playImagePreviewTransition: playImagePreviewTransition,
      playMiddlePreviewTransition: playMiddlePreviewTransition,
      playVideoResultTransition: playVideoResultTransition,
      scrollShotCardIntoView: scrollShotCardIntoView,
      captureResultHistoryMenu: captureResultHistoryMenu,
      restoreResultHistoryMenu: restoreResultHistoryMenu,
      windowObject: windowObject,
    }),
    {
      deleteImageResult: deleteImageResult,
      deleteVideoResult: deleteVideoResult,
      selectImageResult: selectImageResult,
      selectVideoReference: selectVideoReference,
      selectVideoResult: selectVideoResult,
      setImageReference: setImageReference,
      setVideoReference: setVideoReference,
      switchImageResult: switchImageResult,
      switchVideoReferenceResult: switchVideoReferenceResult,
      switchVideoResult: switchVideoResult,
    } = personReplacementResultSelectionController,
    handler78 = (event) => {
      const currentResultIndex = event['target']?.['closest']?.(
        '[data-person-replacement-video-reference-wheel="true"]',
      );
      if (
        !currentResultIndex ||
        initialProject2['workspace']['view'] !== 'project' ||
        initialProject2['workspace']['step'] !== 0x3
      )
        return ![];
      event['preventDefault']();
      const sourceShotId = normalizeText(
          currentResultIndex['dataset']['personReplacementVideoReferenceSourceShotId'],
        ),
        value237 = map4['get'](sourceShotId) || { accumulator: 0x0, lockedUntil: 0x0 };
      map4['set'](sourceShotId, value237);
      const delta = consumeWorkspaceWheelDirection(event, value237, {
        threshold: 0x4,
        lockDuration: 0xa0,
      });
      return (
        delta &&
          switchVideoReferenceResult({
            sourceShotId: sourceShotId,
            currentResultIndex: currentResultIndex['dataset']['personReplacementVideoReferenceResultIndex'],
            delta: delta,
          }),
        !![]
      );
    },
    handler79 = (value238, value239) => {
      const enabled29 = initialProject2['characters']['find'](
          (value240) => value240['id'] === normalizeText(value238),
        ),
        list10 = getWorkspaceAssetAppearances(enabled29),
        list11 = list10['filter']((value241) => value241['imageUrl']);
      if (!enabled29 || list11['length'] < 0x2) return ![];
      const value242 = Math['max'](
          0x0,
          Math['min'](
            list10['length'] - 0x1,
            Math['trunc'](
              Number(initialProject2['workspace']['assetAppearanceIndexes']?.[enabled29['id']]) || 0x0,
            ),
          ),
        ),
        value243 = list10[value242]?.['id'],
        value244 = Math['max'](
          0x0,
          list11['findIndex']((value245) => value245['id'] === value243),
        ),
        value246 = (value244 + Math['sign'](Number(value239) || 0x0) + list11['length']) % list11['length'];
      if (value246 === value244) return ![];
      const value247 = list11[value246]?.['id'],
        value248 = list10['findIndex']((value249) => value249['id'] === value247),
        value250 = {
          ...initialProject2,
          workspace: {
            ...initialProject2['workspace'],
            assetAppearanceIndexes: {
              ...initialProject2['workspace']['assetAppearanceIndexes'],
              [enabled29['id']]: Math['max'](0x0, value248),
            },
          },
        };
      return (updateProject(value250, 'target-appearance-preview-change'), !![]);
    },
    handler80 = (event2) => {
      const el56 = event2['target']?.['closest']?.(
        '[data-person-replacement-target-appearance-wheel="true"]',
      );
      if (
        !el56 ||
        initialProject2['workspace']['view'] !== 'project' ||
        initialProject2['workspace']['step'] !== 0x2
      )
        return ![];
      event2['preventDefault']();
      const text12 = normalizeText(el56['dataset']['personReplacementTargetCharacterId']),
        value251 = map3['get'](text12) || { accumulator: 0x0, lockedUntil: 0x0 };
      map3['set'](text12, value251);
      const consumeWorkspaceWheelDirection2 = consumeWorkspaceWheelDirection(event2, value251, {
        threshold: 0x4,
        lockDuration: 0xa0,
      });
      if (consumeWorkspaceWheelDirection2) handler79(text12, consumeWorkspaceWheelDirection2);
      return !![];
    },
    handler81 = (event3) => {
      const boundaryRoot = event3['target']?.['closest']?.(
        '[data-story-appearance-wheel="true"], [data-story-card-appearance-wheel]',
      );
      if (
        !boundaryRoot ||
        initialProject2['workspace']['view'] !== 'project' ||
        initialProject2['workspace']['step'] !== 0x1 ||
        initialProject2['workspace']['characterAssetTab'] === 'library'
      )
        return ![];
      if (shouldPreserveWorkspaceNestedWheel(event3['target'], { boundaryRoot: boundaryRoot })) return ![];
      event3['preventDefault']();
      const consumeWorkspaceWheelDirection3 = consumeWorkspaceWheelDirection(event3, value70);
      if (consumeWorkspaceWheelDirection3)
        handler73(consumeWorkspaceWheelDirection3, boundaryRoot['dataset']['storyCardAppearanceWheel']);
      return !![];
    },
    handler82 = (event4) => {
      const enabled30 = event4['target']?.['closest']?.('[data-person-replacement-audio-bound-wheel="true"]');
      if (
        !enabled30 ||
        initialProject2['workspace']['view'] !== 'project' ||
        initialProject2['workspace']['step'] !== 0x1 ||
        initialProject2['workspace']['characterAssetTab'] !== 'audio'
      )
        return ![];
      event4['preventDefault']();
      const consumeWorkspaceWheelDirection4 = consumeWorkspaceWheelDirection(event4, value71);
      if (consumeWorkspaceWheelDirection4) handler74(consumeWorkspaceWheelDirection4);
      return !![];
    },
    handler83 = (event5) => {
      const enabled31 = event5['target']?.['closest']?.('[data-person-replacement-shot-wheel="true"]');
      if (
        !enabled31 ||
        initialProject2['workspace']['view'] !== 'project' ||
        ![0x2, 0x3, 0x5]['includes'](initialProject2['workspace']['step']) ||
        (initialProject2['workspace']['step'] === 0x2 && selectedIds['isOpen'])
      )
        return ![];
      event5['preventDefault']();
      const consumeWorkspaceWheelDirection5 = consumeWorkspaceWheelDirection(event5, value72);
      if (consumeWorkspaceWheelDirection5) handler77(consumeWorkspaceWheelDirection5);
      return !![];
    },
    handler84 = (event6) => {
      const value252 = event6['target']?.['closest']?.(
        '[data-person-replacement-video-result-wheel=\x22true\x22]',
      );
      if (
        value252 &&
        initialProject2['workspace']['view'] === 'project' &&
        initialProject2['workspace']['step'] === 0x3
      ) {
        event6['preventDefault']();
        const consumeWorkspaceWheelDirection6 = consumeWorkspaceWheelDirection(event6, value74);
        if (consumeWorkspaceWheelDirection6) switchVideoResult(consumeWorkspaceWheelDirection6);
        return !![];
      }
      const enabled32 = event6['target']?.['closest']?.(
        '[data-person-replacement-image-result-wheel="true"]',
      );
      if (
        !enabled32 ||
        initialProject2['workspace']['view'] !== 'project' ||
        initialProject2['workspace']['step'] !== 0x2
      )
        return ![];
      event6['preventDefault']();
      const consumeWorkspaceWheelDirection7 = consumeWorkspaceWheelDirection(event6, value73);
      if (consumeWorkspaceWheelDirection7) switchImageResult(consumeWorkspaceWheelDirection7);
      return !![];
    },
    handler85 = (clientX2) => {
      const el57 = clientX2['target']?.['closest']?.('[data-person-replacement-shot-timeline-scroll]'),
        enabled33 = clientX2['target']?.['closest']?.('[data-person-replacement-shot-cut-timeline]');
      if (!selectedIds['isOpen'] || !el57 || !enabled33 || !floatingMenuHost?.['contains']?.(el57))
        return ![];
      const value253 = Number(clientX2['deltaX']) || 0x0,
        value254 = Number(clientX2['deltaY']) || 0x0,
        enabled34 = Math['abs'](value253) > Math['abs'](value254) ? value253 : value254;
      if (!enabled34) return ![];
      if (clientX2['ctrlKey'] || clientX2['metaKey'])
        return (
          clientX2['preventDefault']?.(),
          clientX2['stopPropagation']?.(),
          applyTimelineZoom(enabled34 > 0x0 ? 'out' : 'in', { clientX: clientX2['clientX'] }),
          !![]
        );
      const count7 = Math['max'](0x0, Number(el57['scrollWidth']) - Number(el57['clientWidth']));
      if (!(count7 > 0x0)) return ![];
      const clamp2 = clamp(
        Number(el57['scrollLeft']) + enabled34,
        0x0,
        count7,
        Number(el57['scrollLeft']) || 0x0,
      );
      if (clamp2 === Number(el57['scrollLeft'])) return ![];
      return (
        clientX2['preventDefault']?.(),
        clientX2['stopPropagation']?.(),
        (el57['scrollLeft'] = clamp2),
        !![]
      );
    },
    handler86 = (value255) => {
      return scrollClosestElementHorizontallyWithWheel(
        value255,
        '[data-person-replacement-shot-timeline-scroll]',
        { boundaryRoot: floatingMenuHost, preserveNestedScrollable: !![] },
      );
    },
    handler87 = (value256) => {
      return scrollClosestElementHorizontallyWithWheel(value256, '.person-replacement-video-model-selector', {
        boundaryRoot: floatingMenuHost,
        preserveNestedScrollable: !![],
        stopPropagation: !![],
      });
    },
    value257 = (cancelled2) => {
      if (ctx?.['handleKeyDown'](cancelled2)) return;
      const el58 = cancelled2['target']?.['closest']?.('[data-person-replacement-composite-project-title]');
      if (el58 && ['Enter', 'Escape']['includes'](cancelled2['key'])) {
        (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
        cancelled2['key'] === 'Escape' && (el58['value'] = initialProject2['title']);
        el58['blur']?.();
        return;
      }
      if (
        cancelled2['target']?.['dataset']?.['personReplacementField'] === 'video-prompt' &&
        handleSlashKeyboardNavigation(cancelled2)
      )
        return;
      if (personReplacementExportSubmenuController['handleKeyDown'](cancelled2)) return;
      if (workspaceMenuController['handleKeyDown'](cancelled2)) return;
      const el59 = cancelled2['target']?.['closest']?.(
        '[data-person-replacement-composite-sidebar-splitter]',
      );
      if (el59 && ['ArrowLeft', 'ArrowRight']['includes'](cancelled2['key'])) {
        (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
        const value258 = el59['closest']?.('.person-replacement-preview-workbench'),
          value259 = cancelled2['key'] === 'ArrowLeft' ? -0x10 : 0x10;
        ((initialProject2['workspace']['compositeSidebarWidth'] =
          applyPersonReplacementCompositeSidebarWidthToLayout(
            value258,
            el59,
            initialProject2['workspace']['compositeSidebarWidth'] + value259,
          )),
          handler21('composite-sidebar-width'));
        return;
      }
      const el60 = cancelled2['target']?.['closest']?.('[data-person-replacement-voice-layout-splitter]');
      if (el60 && ['ArrowLeft', 'ArrowRight']['includes'](cancelled2['key'])) {
        (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
        const text13 = normalizeText(el60['dataset']?.['personReplacementVoiceLayoutSplitter']);
        if (['assets', 'sources']['includes'](text13)) {
          const value260 = el60['closest']?.('[data-person-replacement-voice-layout]'),
            assetsEnd = normalizePersonReplacementVoiceLayout(initialProject2['workspace']['voiceLayout']),
            value261 = cancelled2['key'] === 'ArrowLeft' ? -0x2 : 0x2;
          ((initialProject2['workspace']['voiceLayout'] = applyPersonReplacementVoiceLayoutToElement(
            value260,
            {
              ...assetsEnd,
              ...(text13 === 'assets'
                ? { assetsEnd: assetsEnd['assetsEnd'] + value261 }
                : { sourcesEnd: assetsEnd['sourcesEnd'] + value261 }),
            },
          )),
            handler21('voice-layout'));
        }
        return;
      }
      if (cancelled2['key'] === 'Escape') {
        const el61 = floatingMenuHost?.['querySelector']?.('.person-replacement-add-voice-menu-wrap.is-open');
        if (el61) {
          (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
          const el62 = el61['querySelector']?.('[data-story-action=\x22toggle-character-voice-menu\x22]');
          (handler37(el61, ![]), el62?.['focus']?.());
          return;
        }
        const el63 = floatingMenuHost?.['querySelector']?.(
          '.person-replacement-library-add-menu-wrap.is-open',
        );
        if (el63) {
          (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
          const el64 = el63['querySelector']?.(
            '[data-person-replacement-action="toggle-library-add-targets"]',
          );
          (handler35(el63, ![]), el64?.['focus']?.());
          return;
        }
      }
      if (cancelled2['key'] === 'Escape' && value66) {
        (cancelled2['preventDefault'](), cancelled2['stopPropagation'](), handler88({ restoreFocus: !![] }));
        return;
      }
      const el65 = cancelled2['target']?.['closest']?.('[data-person-replacement-person-custom-label]');
      if (el65 && ['Enter', 'Escape']['includes'](cancelled2['key'])) {
        (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
        const el66 = el65['closest']?.('[data-person-replacement-detection-picker]');
        (handler89(el65, { cancelled: cancelled2['key'] === 'Escape' }),
          el66?.['querySelector']?.('[data-person-replacement-detection-picker-trigger]')?.['focus']?.());
        return;
      }
      const el67 = cancelled2['target']?.['closest']?.('[data-person-replacement-cut-boundary-index]');
      if (el67 && selectedIds['isOpen'] && ['ArrowLeft', 'ArrowRight']['includes'](cancelled2['key'])) {
        const enabled35 = cancelled2['shiftKey'] ? 0x5 : cancelled2['ctrlKey'] ? 0x1 : 0x0;
        if (!enabled35) return;
        (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
        const active = Math['trunc'](Number(el67['dataset']['personReplacementCutBoundaryIndex'])),
          value262 = selectedIds['draft'][active - 0x1],
          value263 = selectedIds['draft'][active],
          value264 = cancelled2['key'] === 'ArrowRight' ? 0x1 : -0x1,
          personReplacementShotCutFrameSec =
            getPersonReplacementShotCutFrameSec(value262, value263) * enabled35;
        applyBoundaryTime(
          active,
          Number(value263?.['startSec']) + value264 * personReplacementShotCutFrameSec,
          { active: active },
        );
        return;
      }
      const el68 = cancelled2['target']?.['closest']?.('[data-person-replacement-cut-shot-index]'),
        isEditableTarget = Boolean(
          cancelled2['target']?.['closest']?.(
            'input, textarea, select, [contenteditable="true"], [role="textbox"]',
          ),
        );
      if (handler72(cancelled2)) return;
      if (
        handleSelectionKeyDown(cancelled2, {
          deletionEnabled:
            initialProject2['workspace']['view'] === 'project' &&
            initialProject2['workspace']['step'] === 0x2 &&
            !selectedIds['isOpen'],
          isEditableTarget: isEditableTarget,
        })
      )
        return;
      const enabled36 = Boolean(cancelled2['target']?.['closest']?.('.person-replacement-shot-cut-action'));
      if (
        selectedIds['isOpen'] &&
        !isBusy() &&
        !isEditableTarget &&
        (cancelled2['key'] === '\x20' || cancelled2['code'] === 'Space')
      ) {
        (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
        const el69 = floatingMenuHost?.['querySelector']?.('[data-person-replacement-shot-cut-editor]');
        if (el69 && cancelled2['target'] !== el69)
          try {
            el69['focus']?.({ preventScroll: !![] });
          } catch {
            el69['focus']?.();
          }
        if (!cancelled2['repeat']) togglePlayback();
        return;
      }
      if (selectedIds['isOpen'] && !isBusy() && !isEditableTarget && !enabled36) {
        if (
          !cancelled2['repeat'] &&
          (cancelled2['ctrlKey'] || cancelled2['metaKey']) &&
          !cancelled2['shiftKey'] &&
          String(cancelled2['key'] || '')['toLowerCase']() === 'z'
        ) {
          (cancelled2['preventDefault'](), cancelled2['stopPropagation'](), undoDraft());
          return;
        }
        if (
          !cancelled2['repeat'] &&
          (cancelled2['ctrlKey'] || cancelled2['metaKey']) &&
          (String(cancelled2['key'] || '') === '+' ||
            String(cancelled2['key'] || '') === '=' ||
            cancelled2['code'] === 'Equal')
        ) {
          (cancelled2['preventDefault'](), cancelled2['stopPropagation'](), applyTimelineZoom('in'));
          return;
        }
        if (
          !cancelled2['repeat'] &&
          (cancelled2['ctrlKey'] || cancelled2['metaKey']) &&
          (String(cancelled2['key'] || '') === '-' || cancelled2['code'] === 'Minus')
        ) {
          (cancelled2['preventDefault'](), cancelled2['stopPropagation'](), applyTimelineZoom('out'));
          return;
        }
        if (
          !cancelled2['repeat'] &&
          (cancelled2['ctrlKey'] || cancelled2['metaKey']) &&
          (String(cancelled2['key'] || '') === '0' || cancelled2['code'] === 'Digit0')
        ) {
          (cancelled2['preventDefault'](), cancelled2['stopPropagation'](), applyTimelineZoom('reset'));
          return;
        }
        if (
          !cancelled2['repeat'] &&
          !cancelled2['ctrlKey'] &&
          !cancelled2['metaKey'] &&
          !cancelled2['altKey'] &&
          (String(cancelled2['key'] || '')['toLowerCase']() === 'c' || cancelled2['code'] === 'KeyC')
        ) {
          (cancelled2['preventDefault'](), cancelled2['stopPropagation'](), splitAtPlayhead());
          return;
        }
        if (['ArrowLeft', 'ArrowRight']['includes'](cancelled2['key'])) {
          (cancelled2['preventDefault'](),
            cancelled2['stopPropagation'](),
            stepTimeline(cancelled2['key'] === 'ArrowLeft' ? -0x1 : 0x1, cancelled2['shiftKey'] ? 0x5 : 0x1));
          return;
        }
        if (['Home', 'End']['includes'](cancelled2['key'])) {
          (cancelled2['preventDefault'](),
            cancelled2['stopPropagation'](),
            seekTimeline(
              cancelled2['key'] === 'Home'
                ? 0x0
                : getPersonReplacementShotCutTotalDuration(selectedIds['draft']),
            ));
          return;
        }
      }
      if (el68 && selectedIds['isOpen'] && cancelled2['key'] === 'Enter') {
        (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
        const value265 =
          selectedIds['draft'][Math['trunc'](Number(el68['dataset']['personReplacementCutShotIndex']))];
        if (value265) preview(value265['shotId'], value265['startSec']);
        return;
      }
      const value266 = cancelled2['target']?.['closest']?.(
        '[data-story-asset-name-id][contenteditable="true"]',
      );
      if (value266 && ['Enter', 'Escape']['includes'](cancelled2['key'])) {
        (cancelled2['preventDefault'](),
          cancelled2['stopPropagation'](),
          handler49(value266, { cancel: cancelled2['key'] === 'Escape' }),
          value266['blur']?.());
        return;
      }
      if (cancelled2['key'] === 'Escape') {
        if (handler90()) {
          (cancelled2['preventDefault'](), cancelled2['stopPropagation']());
          return;
        }
        if (
          !initialProject2['workspace']['shotSelectionMode'] &&
          !initialProject2['workspace']['selectedShotIds']['length'] &&
          handleEscape(cancelled2)
        )
          return;
        if (selectedIds['isSmartDetectOpen'] && !selectedIds['isSmartDetecting']) {
          (cancelled2['preventDefault'](),
            cancelled2['stopPropagation'](),
            (selectedIds['isSmartDetectOpen'] = ![]),
            run());
          return;
        }
        if (selectedIds['isOpen'] && !isDraftMutationBusy()) {
          (cancelled2['preventDefault'](), close2({ animate: !![], renderWorkspace: !![] }));
          return;
        }
        (workspaceMarqueeSelectionController?.['cancel']?.(),
          handler91(),
          (initialProject2['workspace']['shotSelectionMode'] ||
            initialProject2['workspace']['selectedShotIds']['length']) &&
            updateProject(
              {
                ...initialProject2,
                workspace: { ...initialProject2['workspace'], shotSelectionMode: ![], selectedShotIds: [] },
              },
              'shot-selection-cancel',
            ),
          initialProject2['workspace']['step'] === 0x1 &&
            initialProject2['workspace']['selectedAssetIds']['length'] &&
            updateProject(
              {
                ...initialProject2,
                workspace: { ...initialProject2['workspace'], assetSelectionMode: ![], selectedAssetIds: [] },
              },
              'asset-selection-cancel',
            ));
      }
      const el70 = cancelled2['target']?.['closest']?.(
        '[data-person-replacement-target-appearance-wheel="true"]',
      );
      if (
        el70 &&
        initialProject2['workspace']['step'] === 0x2 &&
        ['ArrowLeft', 'ArrowRight']['includes'](cancelled2['key'])
      ) {
        (cancelled2['preventDefault'](),
          cancelled2['stopPropagation'](),
          handler79(
            el70['dataset']['personReplacementTargetCharacterId'],
            cancelled2['key'] === 'ArrowRight' ? 0x1 : -0x1,
          ));
        return;
      }
      const value267 = cancelled2['target']?.['closest']?.('[data-person-replacement-shot-wheel="true"]');
      if (
        value267 &&
        initialProject2['workspace']['step'] === 0x2 &&
        ['ArrowLeft', 'ArrowRight']['includes'](cancelled2['key'])
      ) {
        (cancelled2['preventDefault'](),
          cancelled2['stopPropagation'](),
          handler77(cancelled2['key'] === 'ArrowRight' ? 0x1 : -0x1));
        return;
      }
      const value268 = cancelled2['target']?.['closest']?.(
        '[data-person-replacement-audio-bound-wheel="true"]',
      );
      if (
        value268 &&
        initialProject2['workspace']['step'] === 0x1 &&
        initialProject2['workspace']['characterAssetTab'] === 'audio' &&
        ['ArrowLeft', 'ArrowRight']['includes'](cancelled2['key'])
      ) {
        (cancelled2['preventDefault'](),
          cancelled2['stopPropagation'](),
          handler74(cancelled2['key'] === 'ArrowRight' ? 0x1 : -0x1));
        return;
      }
      const enabled37 = cancelled2['target']?.['closest']?.('[data-story-appearance-wheel="true"]');
      if (!enabled37 || !['ArrowLeft', 'ArrowRight']['includes'](cancelled2['key'])) return;
      (cancelled2['preventDefault'](),
        cancelled2['stopPropagation'](),
        handler73(cancelled2['key'] === 'ArrowRight' ? 0x1 : -0x1));
    },
    value269 = (event7) => {
      event7['stopPropagation']();
      const alt = event7['target']?.['closest']?.(
        '.person-replacement-image-preview-slide:not(' +
          '.person-replacement-image-preview-slide--outgoing) > img',
      );
      if (alt && floatingMenuHost?.['contains']?.(alt)) {
        const mediaUrl2 = normalizeMediaUrl(alt['currentSrc'] || alt['getAttribute']?.('src'));
        if (!mediaUrl2) return;
        (event7['preventDefault'](),
          openImagePreview(mediaUrl2, { alt: alt['alt'] || '替换图片生成结果预览' }));
        return;
      }
      const el71 = event7['target']?.['closest']?.('video[data-person-replacement-video-player="result"]');
      if (el71 && floatingMenuHost?.['contains']?.(el71)) {
        const mediaUrl3 = normalizeMediaUrl(
          el71['dataset']?.['personReplacementVideoUrl'] ||
            el71['getAttribute']?.('src') ||
            el71['currentSrc'],
        );
        if (!mediaUrl3) return;
        const playbackUrl = normalizeMediaUrl(el71['currentSrc'] || el71['getAttribute']?.('src'));
        (event7['preventDefault'](), openVideoPreview(mediaUrl3, { playbackUrl: playbackUrl }));
        return;
      }
      const alt2 = event7['target']?.['closest']?.('img.story-asset-preview');
      if (!alt2 || !floatingMenuHost?.['contains']?.(alt2)) return;
      const mediaUrl4 = normalizeMediaUrl(alt2['currentSrc'] || alt2['getAttribute']?.('src'));
      if (!mediaUrl4) return;
      (event7['preventDefault'](), openImagePreview(mediaUrl4, { alt: alt2['alt'] || '人物形象图片预览' }));
    },
    handler92 = (args21 = {}) => {
      return (
        (initialProject2 = normalizePersonReplacementWorkspaceProject({
          ...initialProject2,
          workspace: { ...initialProject2['workspace'], ...args21 },
        })),
        run(),
        cloneJson(initialProject2)
      );
    },
    handler93 = () => {
      if (initialProject2['workspace']['view'] !== 'home') return ![];
      const el72 = floatingMenuHost?.['querySelector']?.('[data-person-replacement-smart-clip-settings]'),
        el73 = el72?.['querySelector']?.('[data-person-replacement-action="toggle-smart-clip-settings"]');
      if (!el72 || !el73) return ![];
      const enabled38 = initialProject2['workspace']['smartClipSettingsOpen'] === !![],
        el74 = el72['querySelector']?.('.person-replacement-smart-clip-settings-panel');
      if (enabled38 && !el74 && typeof el72['insertAdjacentHTML'] !== 'function') return ![];
      (el73['classList']?.['toggle']?.('is-active', enabled38),
        el73['setAttribute']?.('aria-expanded', String(enabled38)));
      if (enabled38 && !el74)
        el72['insertAdjacentHTML'](
          'beforeend',
          personReplacementShellPresentation['renderSmartClipSettingsPanel'](initialProject2),
        );
      else !enabled38 && el74?.['remove']?.();
      return (
        el72['querySelectorAll']?.('[data-smart-clip-mode]')?.['forEach']?.((el75) => {
          const value270 =
            el75['dataset']?.['smartClipMode'] === initialProject2['settings']['smartClipMode'];
          (el75['classList']?.['toggle']?.('is-active', value270),
            el75['setAttribute']?.('aria-pressed', String(value270)));
        }),
        el72['querySelectorAll']?.('[data-smart-clip-fps]')?.['forEach']?.((el76) => {
          const value271 =
            Number(el76['dataset']?.['smartClipFps']) === initialProject2['settings']['smartClipFps'];
          (el76['classList']?.['toggle']?.('is-active', value271),
            el76['setAttribute']?.('aria-pressed', String(value271)));
        }),
        !![]
      );
    },
    handler12 = (
      { workspace: workspace = {}, settings: settings = {} } = {},
      { notify: notify = ![] } = {},
    ) => {
      initialProject2 = normalizePersonReplacementWorkspaceProject({
        ...initialProject2,
        settings: { ...initialProject2['settings'], ...settings },
        workspace: { ...initialProject2['workspace'], ...workspace },
      });
      if (!handler93()) run();
      if (notify) handler21('smart-clip-settings');
      return cloneJson(initialProject2);
    },
    handler94 = (enabled39) => {
      const el77 = floatingMenuHost?.['querySelector']?.('[data-story-project-sort-wrap]'),
        el78 = el77?.['querySelector']?.("[data-story-action='toggle-project-sort-menu']"),
        el79 = el77?.['querySelector']?.('[data-story-project-sort-menu]');
      (el77?.['classList']?.['toggle']?.('is-open', enabled39),
        el78?.['setAttribute']?.('aria-expanded', String(enabled39)),
        el79?.['setAttribute']?.('aria-hidden', String(!enabled39)));
    },
    handler91 = (value272 = null) => {
      floatingMenuHost?.['querySelectorAll']?.('.story-home-param-picker.is-open')?.['forEach']?.((el80) => {
        if (el80 === value272) return;
        (el80['classList']?.['remove']?.('is-open'),
          el80['querySelector']?.('[data-story-home-param-trigger]')?.['setAttribute']?.(
            'aria-expanded',
            'false',
          ));
      });
    },
    handler95 = (el81) => {
      const el82 = el81?.['querySelector']?.('[data-person-replacement-detection-picker-menu]'),
        selectedValue = el81?.['querySelector']?.('[data-person-replacement-detection-picker-trigger]');
      if (!el82 || !selectedValue) return ![];
      if (el82['dataset']?.['personReplacementPickerOptionsReady'] === 'true') return !![];
      const text14 = normalizeText(el81['dataset']?.['personReplacementDetectionPicker']);
      let options4 = [];
      if (text14 === 'orientation') options4 = getPersonOrientationOptions();
      else {
        if (text14 === 'scope') options4 = getPersonReplacementScopeOptions();
        else {
          if (text14 === 'label') {
            const el83 = el81['closest']?.('.person-replacement-detection-box'),
              text15 = normalizeText(
                el83?.['dataset']?.['shotId'] || initialProject2['workspace']['selectedShotId'],
              ),
              value273 = initialProject2['shots']['find']((value274) => value274['id'] === text15),
              list12 = getPersonReplacementBoxedPeople(value273),
              selectedLabel = normalizeText(
                selectedValue['querySelector']?.('[data-person-replacement-detection-picker-value]')?.[
                  'textContent'
                ],
                selectedValue['value'],
              );
            options4 = getPersonReplacementLabelOptions({
              labels: [
                ...list12['map']((value275, value276) => formatPersonReplacementPersonLabel(value276)),
                ...getPersonReplacementReusableLabels(initialProject2),
              ],
              selectedLabel: selectedLabel,
              removedLabels: initialProject2['workspace']['removedCustomPersonLabels'],
              project: initialProject2,
            });
          }
        }
      }
      return (
        (el82['innerHTML'] = personReplacementIdentityPresentation['renderOverlay']('picker-options', {
          options: options4,
          selectedValue: selectedValue['value'],
        })),
        el82['dataset'] && (el82['dataset']['personReplacementPickerOptionsReady'] = 'true'),
        !![]
      );
    },
    handler96 = (el84, enabled40) => {
      const el85 = el84?.['querySelector']?.('[data-person-replacement-detection-picker-trigger]'),
        el86 = el84?.['querySelector']?.('[data-person-replacement-detection-picker-menu]');
      if (enabled40 && !handler95(el84)) return ![];
      return (
        el84?.['classList']?.['toggle']?.('is-open', enabled40),
        el84?.['closest']?.('.person-replacement-detection-box')?.['classList']?.['toggle']?.(
          'is-picker-open',
          enabled40,
        ),
        el85?.['setAttribute']?.('aria-expanded', String(enabled40)),
        el86?.['setAttribute']?.('aria-hidden', String(!enabled40)),
        !enabled40 &&
          el86?.['dataset']?.['personReplacementPickerOptionsLazy'] === 'true' &&
          ((el86['innerHTML'] = ''),
          el86['dataset'] && delete el86['dataset']['personReplacementPickerOptionsReady']),
        !![]
      );
    },
    handler90 = (value277 = null) => {
      let value278 = ![];
      return (
        floatingMenuHost?.['querySelectorAll']?.('[data-person-replacement-detection-picker].is-open')?.[
          'forEach'
        ]?.((value279) => {
          if (value279 === value277) return;
          (handler96(value279, ![]), (value278 = !![]));
        }),
        value278
      );
    },
    handler89 = (el87, { cancelled: cancelled = ![] } = {}) => {
      if (!el87 || el87['hidden']) return ![];
      const el88 = el87['closest']?.('[data-person-replacement-detection-picker]'),
        detectionBox2 = el87['closest']?.('.person-replacement-detection-box'),
        sourceCharacterId3 = el88?.['querySelector']?.('[data-person-replacement-detection-picker-trigger]'),
        el89 = sourceCharacterId3?.['querySelector']?.('[data-person-replacement-detection-picker-value]');
      if (!el88 || !sourceCharacterId3 || !el89) return ![];
      const text16 = normalizeText(el88['dataset']['personReplacementPreviousValue']),
        text17 = normalizeText(el88['dataset']['personReplacementPreviousLabel'], text16),
        text18 = normalizeText(el88['dataset']['personReplacementPreviousSourceCharacterId']),
        text19 = normalizeText(el87['value']),
        enabled41 = cancelled || !text19,
        value280 = enabled41 ? text16 : PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE,
        label3 = enabled41 ? text17 : text19;
      return (
        (sourceCharacterId3['value'] = value280),
        (sourceCharacterId3['dataset']['personReplacementSelectedSourceCharacterId'] = enabled41
          ? text18
          : normalizeText(
              initialProject2['shots']
                ['find'](
                  (value281) => value281['id'] === normalizeText(detectionBox2?.['dataset']?.['shotId']),
                )
                ?.['people']?.['find'](
                  (value282) => value282['id'] === normalizeText(detectionBox2?.['dataset']?.['personId']),
                )?.['sourceCharacterId'],
            )),
        (sourceCharacterId3['hidden'] = ![]),
        sourceCharacterId3['setAttribute']('aria-label', '人物名称：' + label3),
        (el89['textContent'] = label3),
        (el87['value'] = label3),
        (el87['hidden'] = !![]),
        el88['querySelectorAll']?.('[data-person-replacement-detection-picker-option]')?.['forEach']?.(
          (el90) => {
            const text20 =
              normalizeText(el90['dataset']['personReplacementDetectionPickerOption']) === value280;
            (el90['classList']?.['toggle']?.('is-selected', text20),
              el90['setAttribute']?.('aria-selected', String(text20)));
          },
        ),
        delete el88['dataset']['personReplacementPreviousValue'],
        delete el88['dataset']['personReplacementPreviousLabel'],
        delete el88['dataset']['personReplacementPreviousSourceCharacterId'],
        !enabled41 &&
          handler39({
            detectionBox: detectionBox2,
            label: label3,
            sourceCharacterId: sourceCharacterId3['dataset']['personReplacementSelectedSourceCharacterId'],
          }),
        !enabled41
      );
    },
    handler97 = (event8) => {
      const el91 = event8?.['target'],
        value283 = el91?.['closest']?.('[data-story-marquee-surface="shots"]'),
        enabled42 =
          initialProject2['workspace']['step'] === 0x1 &&
          initialProject2['workspace']['assetSelectionMode'] &&
          el91?.['closest']?.('.person-replacement-assets-page'),
        enabled43 =
          [0x2, 0x3, 0x5]['includes'](initialProject2['workspace']['step']) &&
          (initialProject2['workspace']['shotSelectionMode'] ||
            initialProject2['workspace']['selectedShotIds']['length']) &&
          value283,
        value284 = el91?.['closest']?.(PERSON_REPLACEMENT_MULTI_SELECTION_INTERACTIVE_SELECTOR),
        enabled44 = enabled43 && value284 === value283;
      if (
        initialProject2['workspace']['view'] !== 'project' ||
        (!enabled42 && !enabled43) ||
        (value284 && !enabled44)
      )
        return ![];
      return (
        workspaceMarqueeSelectionController?.['cancel']?.(),
        updateProject(
          {
            ...initialProject2,
            workspace: {
              ...initialProject2['workspace'],
              ...(enabled43
                ? { shotSelectionMode: ![], selectedShotIds: [] }
                : { assetSelectionMode: ![], selectedAssetIds: [] }),
            },
          },
          enabled43 ? 'shot-selection-cancel' : 'asset-selection-cancel',
        ),
        !![]
      );
    },
    handler98 = (value285) => {
      const value286 = () => {
        const el92 = Array['from'](
          floatingMenuHost?.['querySelectorAll']?.('[data-story-project-title]') || [],
        )['find']((el93) => normalizeText(el93['dataset']['storyProjectTitle']) === normalizeText(value285));
        (el92?.['focus']?.(), el92?.['select']?.());
      };
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? windowObject['requestAnimationFrame'](value286)
        : globalThis['queueMicrotask']?.(value286);
    },
    handler99 = (projectId, archived) => {
      if (initialProject2['workspace']['view'] === 'home' && archived === 'toggle-project-sort-menu') {
        const el94 = projectId['closest']?.('[data-story-project-sort-wrap]');
        handler94(!el94?.['classList']?.['contains']?.('is-open'));
      } else {
        if (initialProject2['workspace']['view'] === 'home' && archived === 'select-project-sort')
          handler92({
            projectSortOrder: normalizeWorkspaceProjectSortOrder(
              projectId['dataset']['storyProjectSortOption'],
            ),
          });
        else {
          if (initialProject2['workspace']['view'] === 'home' && archived === 'toggle-archived-projects')
            handler92({
              showArchivedProjects: !initialProject2['workspace']['showArchivedProjects'],
              openProjectMenuId: '',
              pendingDeleteProjectId: '',
            });
          else {
            if (initialProject2['workspace']['view'] === 'home' && archived === 'toggle-project-menu') {
              const text21 = normalizeText(projectId['dataset']['storyProjectId']);
              handler92({
                openProjectMenuId: initialProject2['workspace']['openProjectMenuId'] === text21 ? '' : text21,
                pendingDeleteProjectId: '',
              });
            } else {
              if (initialProject2['workspace']['view'] === 'home' && archived === 'rename-project') {
                const text22 = normalizeText(projectId['dataset']['storyProjectId']);
                (handler92({ openProjectMenuId: '', pendingDeleteProjectId: '' }), handler98(text22));
              } else {
                if (initialProject2['workspace']['view'] === 'home' && archived === 'duplicate-project')
                  runIntent(downloadImageIntent['DUPLICATE_PROJECT'], {
                    projectId: projectId['dataset']['storyProjectId'],
                  });
                else {
                  if (initialProject2['workspace']['view'] === 'home' && archived === 'collect-project')
                    runIntent(downloadImageIntent['COLLECT_PROJECT'], {
                      projectId: projectId['dataset']['storyProjectId'],
                    });
                  else {
                    if (initialProject2['workspace']['view'] === 'home' && archived === 'import-project')
                      runIntent(downloadImageIntent['IMPORT_PROJECT']);
                    else {
                      if (
                        initialProject2['workspace']['view'] === 'home' &&
                        (archived === 'archive-project' || archived === 'unarchive-project')
                      )
                        runIntent(downloadImageIntent['ARCHIVE_PROJECT'], {
                          projectId: projectId['dataset']['storyProjectId'],
                          archived: archived === 'archive-project',
                        });
                      else {
                        if (
                          initialProject2['workspace']['view'] === 'home' &&
                          archived === 'request-delete-project'
                        )
                          handler92({
                            openProjectMenuId: '',
                            pendingDeleteProjectId: normalizeText(projectId['dataset']['storyProjectId']),
                          });
                        else {
                          if (
                            initialProject2['workspace']['view'] === 'home' &&
                            archived === 'cancel-delete-project'
                          )
                            handler92({ pendingDeleteProjectId: '' });
                          else {
                            if (
                              initialProject2['workspace']['view'] === 'home' &&
                              archived === 'confirm-delete-project'
                            )
                              runIntent(downloadImageIntent['DELETE_PROJECT'], {
                                projectId: projectId['dataset']['storyProjectId'],
                              });
                            else {
                              if (
                                archived === 'target-previous-appearance' ||
                                archived === 'target-next-appearance'
                              ) {
                                const el95 = projectId['closest']?.(
                                  '[data-person-replacement-target-controls]',
                                );
                                handler79(
                                  el95?.['dataset']?.['personReplacementTargetControls'],
                                  archived === 'target-next-appearance' ? 0x1 : -0x1,
                                );
                              } else {
                                if (
                                  archived === 'video-reference-previous-result' ||
                                  archived === 'video-reference-next-result'
                                ) {
                                  const sourceShotId2 = projectId['closest']?.(
                                    '[data-person-replacement-video-reference-controls]',
                                  );
                                  switchVideoReferenceResult({
                                    sourceShotId:
                                      sourceShotId2?.['dataset']?.['personReplacementVideoReferenceControls'],
                                    currentResultIndex:
                                      sourceShotId2?.['dataset']?.[
                                        'personReplacementVideoReferenceResultIndex'
                                      ],
                                    delta: archived === 'video-reference-next-result' ? 0x1 : -0x1,
                                  });
                                } else {
                                  if (archived === 'cancel-asset-selection')
                                    updateProject(
                                      {
                                        ...initialProject2,
                                        workspace: {
                                          ...initialProject2['workspace'],
                                          assetSelectionMode: ![],
                                          selectedAssetIds: [],
                                        },
                                      },
                                      'asset-selection-cancel',
                                    );
                                  else {
                                    if (archived === 'cancel-shot-batch-generation') cancelShotBatch();
                                    else {
                                      if (archived === 'cancel-asset-batch-generation') cancelAssetBatch();
                                      else {
                                        if (archived === 'toggle-all-assets') {
                                          const list13 = getPersonReplacementSelectableAssets(
                                              initialProject2,
                                              initialProject2['workspace']['characterAssetTab'],
                                            ),
                                            selectedAssetIds =
                                              list13['length'] > 0x0 &&
                                              list13['every']((value287) =>
                                                initialProject2['workspace']['selectedAssetIds']['includes'](
                                                  value287['id'],
                                                ),
                                              );
                                          updateProject(
                                            {
                                              ...initialProject2,
                                              workspace: {
                                                ...initialProject2['workspace'],
                                                selectedAssetIds: selectedAssetIds
                                                  ? []
                                                  : list13['map']((value288) => value288['id']),
                                                assetSelectionMode:
                                                  !selectedAssetIds && list13['length'] > 0x0,
                                              },
                                            },
                                            'asset-selection-all',
                                          );
                                        } else {
                                          if (archived === 'toggle-all-shots') {
                                            const selectedShotIds = initialProject2['shots']['every'](
                                              (value289) =>
                                                initialProject2['workspace']['selectedShotIds']['includes'](
                                                  value289['id'],
                                                ),
                                            );
                                            updateProject(
                                              {
                                                ...initialProject2,
                                                workspace: {
                                                  ...initialProject2['workspace'],
                                                  shotSelectionMode: !selectedShotIds,
                                                  selectedShotIds: selectedShotIds
                                                    ? []
                                                    : initialProject2['shots']['map'](
                                                        (value290) => value290['id'],
                                                      ),
                                                },
                                              },
                                              'shot-selection-all',
                                            );
                                          } else {
                                            if (archived === 'previous-appearance')
                                              handler73(-0x1, projectId['dataset']['storyCardAppearanceId']);
                                            else {
                                              if (archived === 'next-appearance')
                                                handler73(0x1, projectId['dataset']['storyCardAppearanceId']);
                                              else {
                                                if (archived === 'previous-audio-bound-character')
                                                  handler74(-0x1);
                                                else {
                                                  if (archived === 'next-audio-bound-character')
                                                    handler74(0x1);
                                                  else {
                                                    if (archived === 'previous-shot') handler77(-0x1);
                                                    else {
                                                      if (archived === 'next-shot') handler77(0x1);
                                                      else {
                                                        if (archived === 'previous-replacement-image-result')
                                                          switchImageResult(-0x1);
                                                        else {
                                                          if (archived === 'next-replacement-image-result')
                                                            switchImageResult(0x1);
                                                          else {
                                                            if (
                                                              archived === 'previous-replacement-video-result'
                                                            )
                                                              switchVideoResult(-0x1);
                                                            else {
                                                              if (
                                                                archived === 'next-replacement-video-result'
                                                              )
                                                                switchVideoResult(0x1);
                                                              else {
                                                                if (
                                                                  archived === 'select-video-shot-reference'
                                                                )
                                                                  selectVideoReference(
                                                                    projectId['dataset']['shotId'] ||
                                                                      initialProject2['workspace'][
                                                                        'selectedShotId'
                                                                      ],
                                                                    projectId['dataset'][
                                                                      'personReplacementVideoReferenceIndex'
                                                                    ],
                                                                    {
                                                                      sourceShotId:
                                                                        projectId['dataset'][
                                                                          'personReplacementVideoReferenceSourceShotId'
                                                                        ],
                                                                      resultIndex:
                                                                        projectId['dataset'][
                                                                          'personReplacementVideoReferenceResultIndex'
                                                                        ],
                                                                      referencePersonId:
                                                                        projectId['dataset'][
                                                                          'personReplacementVideoCharacterReference'
                                                                        ],
                                                                      referenceKind:
                                                                        projectId['dataset'][
                                                                          'personReplacementVideoReferenceKind'
                                                                        ],
                                                                    },
                                                                  );
                                                                else {
                                                                  if (
                                                                    archived ===
                                                                    'select-replacement-image-result'
                                                                  )
                                                                    (selectImageResult(
                                                                      projectId['dataset']['shotId'],
                                                                      projectId['dataset'][
                                                                        'replacementImageResultIndex'
                                                                      ],
                                                                    ),
                                                                      ctx?.['refresh']());
                                                                  else {
                                                                    if (
                                                                      archived ===
                                                                      'set-replacement-image-reference'
                                                                    )
                                                                      setImageReference(
                                                                        projectId['dataset']['shotId'],
                                                                        projectId['dataset'][
                                                                          'replacementImageResultIndex'
                                                                        ],
                                                                      );
                                                                    else {
                                                                      if (
                                                                        archived ===
                                                                        'delete-replacement-image-result'
                                                                      )
                                                                        deleteImageResult(
                                                                          projectId['dataset']['shotId'],
                                                                          projectId['dataset'][
                                                                            'replacementImageResultIndex'
                                                                          ],
                                                                        );
                                                                      else {
                                                                        if (
                                                                          archived ===
                                                                          'select-replacement-video-result'
                                                                        )
                                                                          (selectVideoResult(
                                                                            projectId['dataset']['shotId'],
                                                                            projectId['dataset'][
                                                                              'replacementVideoResultIndex'
                                                                            ],
                                                                          ),
                                                                            ctx?.['refresh']());
                                                                        else {
                                                                          if (
                                                                            archived ===
                                                                            'set-replacement-video-reference'
                                                                          )
                                                                            setVideoReference(
                                                                              projectId['dataset']['shotId'],
                                                                              projectId['dataset'][
                                                                                'replacementVideoResultIndex'
                                                                              ],
                                                                            );
                                                                          else {
                                                                            if (
                                                                              archived ===
                                                                              'delete-replacement-video-result'
                                                                            )
                                                                              deleteVideoResult(
                                                                                projectId['dataset'][
                                                                                  'shotId'
                                                                                ],
                                                                                projectId['dataset'][
                                                                                  'replacementVideoResultIndex'
                                                                                ],
                                                                              );
                                                                            else {
                                                                              if (
                                                                                archived ===
                                                                                'download-asset-image'
                                                                              )
                                                                                requestImageDownload(
                                                                                  projectId,
                                                                                  handler46(),
                                                                                );
                                                                              else {
                                                                                if (
                                                                                  archived ===
                                                                                  'add-asset-appearance-to-library'
                                                                                )
                                                                                  void addPersonReplacementAppearanceToLibraryWithFly(
                                                                                    floatingMenuHost,
                                                                                    characterId(),
                                                                                    handler13(),
                                                                                    onShotKeyframeSelected(
                                                                                      downloadImageIntent[
                                                                                        'ADD_ASSET_APPEARANCE_TO_LIBRARY'
                                                                                      ],
                                                                                    ),
                                                                                    handler11,
                                                                                    documentObject,
                                                                                    windowObject,
                                                                                  );
                                                                                else {
                                                                                  if (
                                                                                    archived ===
                                                                                    'download-replacement-image'
                                                                                  )
                                                                                    requestImageDownload(
                                                                                      projectId,
                                                                                      getSelectedReplacementImageDownloadRequest(),
                                                                                    );
                                                                                  else {
                                                                                    if (
                                                                                      archived ===
                                                                                      'upload-replacement-image'
                                                                                    )
                                                                                      ((value45 = {
                                                                                        kind: 'replacement-image',
                                                                                        shotId:
                                                                                          initialProject2[
                                                                                            'workspace'
                                                                                          ]['selectedShotId'],
                                                                                      }),
                                                                                        floatingMenuHost[
                                                                                          'querySelector'
                                                                                        ](
                                                                                          "[data-person-replacement-input='replacement-image']",
                                                                                        )?.['click']?.());
                                                                                    else {
                                                                                      if (
                                                                                        archived ===
                                                                                        'download-replacement-video'
                                                                                      )
                                                                                        requestVideoDownload(
                                                                                          projectId,
                                                                                          getSelectedReplacementVideoDownloadRequest(),
                                                                                        );
                                                                                      else {
                                                                                        if (
                                                                                          archived ===
                                                                                          'upload-replacement-video'
                                                                                        )
                                                                                          ((value46 =
                                                                                            projectId),
                                                                                            (value45 = {
                                                                                              kind: 'replacement-video',
                                                                                              shotId:
                                                                                                initialProject2[
                                                                                                  'workspace'
                                                                                                ][
                                                                                                  'selectedShotId'
                                                                                                ],
                                                                                            }),
                                                                                            floatingMenuHost[
                                                                                              'querySelector'
                                                                                            ](
                                                                                              "[data-person-replacement-input='replacement-video-result']",
                                                                                            )?.['click']?.());
                                                                                        else {
                                                                                          if (
                                                                                            archived ===
                                                                                            'upload-asset'
                                                                                          ) {
                                                                                            const characterId2 =
                                                                                                characterId(
                                                                                                  projectId[
                                                                                                    'dataset'
                                                                                                  ][
                                                                                                    'storyCardAppearanceId'
                                                                                                  ] ||
                                                                                                    initialProject2[
                                                                                                      'workspace'
                                                                                                    ][
                                                                                                      'selectedCharacterId'
                                                                                                    ],
                                                                                                ),
                                                                                              appearanceId =
                                                                                                handler13(
                                                                                                  characterId2,
                                                                                                );
                                                                                            ((value45 = {
                                                                                              kind: 'appearance',
                                                                                              characterId:
                                                                                                characterId2?.[
                                                                                                  'id'
                                                                                                ],
                                                                                              appearanceId:
                                                                                                appearanceId?.[
                                                                                                  'id'
                                                                                                ],
                                                                                            }),
                                                                                              floatingMenuHost[
                                                                                                'querySelector'
                                                                                              ](
                                                                                                "[data-person-replacement-input='appearance-image']",
                                                                                              )?.[
                                                                                                'click'
                                                                                              ]?.());
                                                                                          } else {
                                                                                            if (
                                                                                              archived ===
                                                                                              'toggle-character-voice-menu'
                                                                                            ) {
                                                                                              const el96 =
                                                                                                  projectId[
                                                                                                    'closest'
                                                                                                  ]?.(
                                                                                                    '.person-replacement-add-voice-menu-wrap',
                                                                                                  ),
                                                                                                value291 =
                                                                                                  !el96?.[
                                                                                                    'classList'
                                                                                                  ]?.[
                                                                                                    'contains'
                                                                                                  ]?.(
                                                                                                    'is-open',
                                                                                                  );
                                                                                              (handler38(
                                                                                                el96,
                                                                                              ),
                                                                                                handler37(
                                                                                                  el96,
                                                                                                  value291,
                                                                                                ));
                                                                                            } else {
                                                                                              if (
                                                                                                archived ===
                                                                                                'remove-character-voice'
                                                                                              ) {
                                                                                                handler38();
                                                                                                const enabled45 =
                                                                                                  characterId();
                                                                                                if (
                                                                                                  !enabled45
                                                                                                )
                                                                                                  return;
                                                                                                (stopPreview(),
                                                                                                  updateProject(
                                                                                                    {
                                                                                                      ...initialProject2,
                                                                                                      characters:
                                                                                                        initialProject2[
                                                                                                          'characters'
                                                                                                        ][
                                                                                                          'map'
                                                                                                        ](
                                                                                                          (
                                                                                                            args22,
                                                                                                          ) =>
                                                                                                            args22[
                                                                                                              'id'
                                                                                                            ] ===
                                                                                                            enabled45[
                                                                                                              'id'
                                                                                                            ]
                                                                                                              ? {
                                                                                                                  ...args22,
                                                                                                                  voiceReference:
                                                                                                                    null,
                                                                                                                  voiceRef:
                                                                                                                    '',
                                                                                                                }
                                                                                                              : args22,
                                                                                                        ),
                                                                                                    },
                                                                                                    'remove-character-voice',
                                                                                                  ));
                                                                                              } else {
                                                                                                if (
                                                                                                  archived ===
                                                                                                  'upload-character-voice'
                                                                                                )
                                                                                                  (handler38(),
                                                                                                    (value45 =
                                                                                                      {
                                                                                                        kind: 'voice',
                                                                                                        characterId:
                                                                                                          characterId()?.[
                                                                                                            'id'
                                                                                                          ],
                                                                                                      }),
                                                                                                    floatingMenuHost[
                                                                                                      'querySelector'
                                                                                                    ](
                                                                                                      '[data-person-replacement-input=\x27character-voice\x27]',
                                                                                                    )?.[
                                                                                                      'click'
                                                                                                    ]?.());
                                                                                                else {
                                                                                                  if (
                                                                                                    archived ===
                                                                                                    'choose-character-voice-from-library'
                                                                                                  ) {
                                                                                                    handler38();
                                                                                                    const enabled46 =
                                                                                                      characterId();
                                                                                                    if (
                                                                                                      !enabled46
                                                                                                    ) {
                                                                                                      windowObject?.[
                                                                                                        'showToast'
                                                                                                      ]?.(
                                                                                                        '请先选择要添加声音的人设。',
                                                                                                        'warn',
                                                                                                      );
                                                                                                      return;
                                                                                                    }
                                                                                                    const args23 =
                                                                                                        initialProject2,
                                                                                                      list14 =
                                                                                                        getPersonReplacementProjectAudioAssets(
                                                                                                          args23,
                                                                                                        ),
                                                                                                      selectedAudioAssetId =
                                                                                                        list14[
                                                                                                          'find'
                                                                                                        ](
                                                                                                          (
                                                                                                            value292,
                                                                                                          ) =>
                                                                                                            getPersonReplacementVoiceLibraryBoundCharacters(
                                                                                                              args23,
                                                                                                              value292,
                                                                                                            )[
                                                                                                              'some'
                                                                                                            ](
                                                                                                              (
                                                                                                                value293,
                                                                                                              ) =>
                                                                                                                value293[
                                                                                                                  'id'
                                                                                                                ] ===
                                                                                                                enabled46[
                                                                                                                  'id'
                                                                                                                ],
                                                                                                            ),
                                                                                                        );
                                                                                                    ((voiceLibraryTargetCharacterId =
                                                                                                      enabled46[
                                                                                                        'id'
                                                                                                      ]),
                                                                                                      updateProject(
                                                                                                        {
                                                                                                          ...args23,
                                                                                                          workspace:
                                                                                                            {
                                                                                                              ...args23[
                                                                                                                'workspace'
                                                                                                              ],
                                                                                                              characterAssetTab:
                                                                                                                'audio',
                                                                                                              selectedAudioAssetId:
                                                                                                                selectedAudioAssetId?.[
                                                                                                                  'id'
                                                                                                                ] ||
                                                                                                                list14[0x0]?.[
                                                                                                                  'id'
                                                                                                                ] ||
                                                                                                                '',
                                                                                                              assetSelectionMode:
                                                                                                                ![],
                                                                                                              selectedAssetIds:
                                                                                                                [],
                                                                                                            },
                                                                                                        },
                                                                                                        'character-voice-library-open',
                                                                                                      ));
                                                                                                  } else {
                                                                                                    if (
                                                                                                      archived ===
                                                                                                      'set-base-appearance'
                                                                                                    ) {
                                                                                                      const value294 =
                                                                                                          characterId(),
                                                                                                        baseAppearanceId =
                                                                                                          handler13(
                                                                                                            value294,
                                                                                                          ),
                                                                                                        characters =
                                                                                                          initialProject2[
                                                                                                            'characters'
                                                                                                          ][
                                                                                                            'map'
                                                                                                          ](
                                                                                                            (
                                                                                                              args24,
                                                                                                            ) =>
                                                                                                              args24[
                                                                                                                'id'
                                                                                                              ] ===
                                                                                                              value294?.[
                                                                                                                'id'
                                                                                                              ]
                                                                                                                ? {
                                                                                                                    ...args24,
                                                                                                                    baseAppearanceId:
                                                                                                                      baseAppearanceId?.[
                                                                                                                        'id'
                                                                                                                      ],
                                                                                                                  }
                                                                                                                : args24,
                                                                                                          );
                                                                                                      updateProject(
                                                                                                        {
                                                                                                          ...initialProject2,
                                                                                                          characters:
                                                                                                            characters,
                                                                                                        },
                                                                                                        'set-base-appearance',
                                                                                                      );
                                                                                                    } else {
                                                                                                      if (
                                                                                                        archived ===
                                                                                                        'delete-appearance'
                                                                                                      ) {
                                                                                                        const enabled47 =
                                                                                                            characterId(),
                                                                                                          enabled48 =
                                                                                                            handler13(
                                                                                                              enabled47,
                                                                                                            );
                                                                                                        if (
                                                                                                          !enabled47 ||
                                                                                                          !enabled48 ||
                                                                                                          enabled48[
                                                                                                            'id'
                                                                                                          ] ===
                                                                                                            enabled47[
                                                                                                              'baseAppearanceId'
                                                                                                            ]
                                                                                                        )
                                                                                                          return;
                                                                                                        const characters2 =
                                                                                                          initialProject2[
                                                                                                            'characters'
                                                                                                          ][
                                                                                                            'map'
                                                                                                          ](
                                                                                                            (
                                                                                                              appearances,
                                                                                                            ) =>
                                                                                                              appearances[
                                                                                                                'id'
                                                                                                              ] ===
                                                                                                              enabled47[
                                                                                                                'id'
                                                                                                              ]
                                                                                                                ? {
                                                                                                                    ...appearances,
                                                                                                                    appearances:
                                                                                                                      appearances[
                                                                                                                        'appearances'
                                                                                                                      ][
                                                                                                                        'filter'
                                                                                                                      ](
                                                                                                                        (
                                                                                                                          value295,
                                                                                                                        ) =>
                                                                                                                          value295[
                                                                                                                            'id'
                                                                                                                          ] !==
                                                                                                                          enabled48[
                                                                                                                            'id'
                                                                                                                          ],
                                                                                                                      ),
                                                                                                                  }
                                                                                                                : appearances,
                                                                                                          );
                                                                                                        updateProject(
                                                                                                          {
                                                                                                            ...initialProject2,
                                                                                                            characters:
                                                                                                              characters2,
                                                                                                            workspace:
                                                                                                              {
                                                                                                                ...initialProject2[
                                                                                                                  'workspace'
                                                                                                                ],
                                                                                                                assetAppearanceIndexes:
                                                                                                                  {
                                                                                                                    ...initialProject2[
                                                                                                                      'workspace'
                                                                                                                    ][
                                                                                                                      'assetAppearanceIndexes'
                                                                                                                    ],
                                                                                                                    [enabled47[
                                                                                                                      'id'
                                                                                                                    ]]:
                                                                                                                      0x0,
                                                                                                                  },
                                                                                                              },
                                                                                                          },
                                                                                                          'delete-appearance',
                                                                                                        );
                                                                                                      } else {
                                                                                                        if (
                                                                                                          archived ===
                                                                                                          'delete-asset-card'
                                                                                                        ) {
                                                                                                          hide();
                                                                                                          const sceneId =
                                                                                                            normalizeText(
                                                                                                              projectId[
                                                                                                                'dataset'
                                                                                                              ][
                                                                                                                'storyAssetDeleteId'
                                                                                                              ],
                                                                                                            );
                                                                                                          if (
                                                                                                            initialProject2[
                                                                                                              'workspace'
                                                                                                            ][
                                                                                                              'characterAssetTab'
                                                                                                            ] ===
                                                                                                              'scene' &&
                                                                                                            initialProject2[
                                                                                                              'scenes'
                                                                                                            ][
                                                                                                              'some'
                                                                                                            ](
                                                                                                              (
                                                                                                                value296,
                                                                                                              ) =>
                                                                                                                value296[
                                                                                                                  'id'
                                                                                                                ] ===
                                                                                                                sceneId,
                                                                                                            )
                                                                                                          )
                                                                                                            runIntent(
                                                                                                              downloadImageIntent[
                                                                                                                'DELETE_SCENE'
                                                                                                              ],
                                                                                                              {
                                                                                                                sceneId:
                                                                                                                  sceneId,
                                                                                                              },
                                                                                                            );
                                                                                                          else
                                                                                                            initialProject2[
                                                                                                              'workspace'
                                                                                                            ][
                                                                                                              'characterAssetTab'
                                                                                                            ] ===
                                                                                                              'audio' &&
                                                                                                            initialProject2[
                                                                                                              'audioAssets'
                                                                                                            ][
                                                                                                              'some'
                                                                                                            ](
                                                                                                              (
                                                                                                                value297,
                                                                                                              ) =>
                                                                                                                value297[
                                                                                                                  'id'
                                                                                                                ] ===
                                                                                                                sceneId,
                                                                                                            )
                                                                                                              ? runIntent(
                                                                                                                  downloadImageIntent[
                                                                                                                    'DELETE_AUDIO_ASSET'
                                                                                                                  ],
                                                                                                                  {
                                                                                                                    audioAssetId:
                                                                                                                      sceneId,
                                                                                                                  },
                                                                                                                )
                                                                                                              : runIntent(
                                                                                                                  downloadImageIntent[
                                                                                                                    'DELETE_CHARACTER'
                                                                                                                  ],
                                                                                                                  {
                                                                                                                    characterId:
                                                                                                                      sceneId,
                                                                                                                  },
                                                                                                                );
                                                                                                        } else {
                                                                                                          if (
                                                                                                            archived[
                                                                                                              'startsWith'
                                                                                                            ](
                                                                                                              'debug-generation-',
                                                                                                            )
                                                                                                          ) {
                                                                                                            if (
                                                                                                              windowObject?.[
                                                                                                                'DEV_MODE'
                                                                                                              ] !==
                                                                                                              !![]
                                                                                                            )
                                                                                                              return;
                                                                                                            const kind =
                                                                                                                archived[
                                                                                                                  'slice'
                                                                                                                ](
                                                                                                                  'debug-generation-'[
                                                                                                                    'length'
                                                                                                                  ],
                                                                                                                ),
                                                                                                              characterId3 =
                                                                                                                characterId(),
                                                                                                              appearanceId2 =
                                                                                                                handler13(
                                                                                                                  characterId3,
                                                                                                                );
                                                                                                            openDebugRequestWindow(
                                                                                                              {
                                                                                                                documentObject:
                                                                                                                  documentObject,
                                                                                                                windowObject:
                                                                                                                  windowObject,
                                                                                                                title:
                                                                                                                  '替换工作室请求调试',
                                                                                                                prepare:
                                                                                                                  async () =>
                                                                                                                    buildGenerationDebugPreview(
                                                                                                                      {
                                                                                                                        ...(await runIntent(
                                                                                                                          downloadImageIntent[
                                                                                                                            'PREVIEW_GENERATION'
                                                                                                                          ],
                                                                                                                          {
                                                                                                                            kind: kind,
                                                                                                                            projectId:
                                                                                                                              initialProject2[
                                                                                                                                'id'
                                                                                                                              ],
                                                                                                                            shotId:
                                                                                                                              initialProject2[
                                                                                                                                'workspace'
                                                                                                                              ][
                                                                                                                                'selectedShotId'
                                                                                                                              ],
                                                                                                                            sourceImageSize:
                                                                                                                              resolvePersonReplacementSourceImageSize(
                                                                                                                                floatingMenuHost?.[
                                                                                                                                  'querySelector'
                                                                                                                                ](
                                                                                                                                  '[data-person-replacement-keyframe-stage] > img',
                                                                                                                                ),
                                                                                                                                initialProject2[
                                                                                                                                  'shots'
                                                                                                                                ][
                                                                                                                                  'find'
                                                                                                                                ](
                                                                                                                                  (
                                                                                                                                    value298,
                                                                                                                                  ) =>
                                                                                                                                    value298[
                                                                                                                                      'id'
                                                                                                                                    ] ===
                                                                                                                                    initialProject2[
                                                                                                                                      'workspace'
                                                                                                                                    ][
                                                                                                                                      'selectedShotId'
                                                                                                                                    ],
                                                                                                                                ),
                                                                                                                              ),
                                                                                                                            characterId:
                                                                                                                              characterId3?.[
                                                                                                                                'id'
                                                                                                                              ],
                                                                                                                            appearanceId:
                                                                                                                              appearanceId2?.[
                                                                                                                                'id'
                                                                                                                              ],
                                                                                                                            prompt:
                                                                                                                              appearanceId2?.[
                                                                                                                                'prompt'
                                                                                                                              ] ||
                                                                                                                              characterId3?.[
                                                                                                                                'description'
                                                                                                                              ],
                                                                                                                            promptPresetId:
                                                                                                                              initialProject2[
                                                                                                                                'workspace'
                                                                                                                              ][
                                                                                                                                'assetPromptPresetId'
                                                                                                                              ],
                                                                                                                          },
                                                                                                                          {},
                                                                                                                          {
                                                                                                                            applyCallbackResult:
                                                                                                                              ![],
                                                                                                                          },
                                                                                                                        )),
                                                                                                                        notes:
                                                                                                                          initialProject2[
                                                                                                                            'settings'
                                                                                                                          ]?.[
                                                                                                                            'replacementPromptEnhancementEnabled'
                                                                                                                          ]
                                                                                                                            ? '已开启\x20AI\x20提示词增强；此处显示增强前输入。增强结果需要调用模型后才能确定，调试不会发起该调用。'
                                                                                                                            : '',
                                                                                                                      },
                                                                                                                    ),
                                                                                                              },
                                                                                                            );
                                                                                                            return;
                                                                                                          } else {
                                                                                                            if (
                                                                                                              archived ===
                                                                                                              'generate-asset'
                                                                                                            ) {
                                                                                                              const characterId4 =
                                                                                                                  characterId(
                                                                                                                    projectId[
                                                                                                                      'dataset'
                                                                                                                    ][
                                                                                                                      'storyCardAppearanceId'
                                                                                                                    ] ||
                                                                                                                      initialProject2[
                                                                                                                        'workspace'
                                                                                                                      ][
                                                                                                                        'selectedCharacterId'
                                                                                                                      ],
                                                                                                                  ),
                                                                                                                appearanceId3 =
                                                                                                                  handler13(
                                                                                                                    characterId4,
                                                                                                                  );
                                                                                                              runIntent(
                                                                                                                downloadImageIntent[
                                                                                                                  'GENERATE_CHARACTER_IMAGE'
                                                                                                                ],
                                                                                                                {
                                                                                                                  characterId:
                                                                                                                    characterId4?.[
                                                                                                                      'id'
                                                                                                                    ],
                                                                                                                  appearanceId:
                                                                                                                    appearanceId3?.[
                                                                                                                      'id'
                                                                                                                    ],
                                                                                                                  prompt:
                                                                                                                    appearanceId3?.[
                                                                                                                      'prompt'
                                                                                                                    ] ||
                                                                                                                    characterId4?.[
                                                                                                                      'description'
                                                                                                                    ],
                                                                                                                  promptPresetId:
                                                                                                                    initialProject2[
                                                                                                                      'workspace'
                                                                                                                    ][
                                                                                                                      'assetPromptPresetId'
                                                                                                                    ],
                                                                                                                  modelId:
                                                                                                                    initialProject2[
                                                                                                                      'settings'
                                                                                                                    ][
                                                                                                                      'characterImageModelId'
                                                                                                                    ],
                                                                                                                  provider:
                                                                                                                    initialProject2[
                                                                                                                      'settings'
                                                                                                                    ][
                                                                                                                      'characterImageProvider'
                                                                                                                    ],
                                                                                                                  providerProfileId:
                                                                                                                    initialProject2[
                                                                                                                      'settings'
                                                                                                                    ][
                                                                                                                      'characterImageProviderProfileId'
                                                                                                                    ],
                                                                                                                  generationParams:
                                                                                                                    initialProject2[
                                                                                                                      'settings'
                                                                                                                    ][
                                                                                                                      'characterImageGenerationParams'
                                                                                                                    ],
                                                                                                                },
                                                                                                              );
                                                                                                            } else {
                                                                                                              if (
                                                                                                                archived ===
                                                                                                                  'batch-generate-assets' &&
                                                                                                                [
                                                                                                                  0x2,
                                                                                                                  0x3,
                                                                                                                ][
                                                                                                                  'includes'
                                                                                                                ](
                                                                                                                  initialProject2[
                                                                                                                    'workspace'
                                                                                                                  ][
                                                                                                                    'step'
                                                                                                                  ],
                                                                                                                )
                                                                                                              )
                                                                                                                runShotBatch(
                                                                                                                  initialProject2[
                                                                                                                    'workspace'
                                                                                                                  ][
                                                                                                                    'step'
                                                                                                                  ] ===
                                                                                                                    0x3
                                                                                                                    ? 'video'
                                                                                                                    : 'image',
                                                                                                                );
                                                                                                              else {
                                                                                                                if (
                                                                                                                  archived ===
                                                                                                                  'batch-generate-assets'
                                                                                                                )
                                                                                                                  runAssetBatch();
                                                                                                                else
                                                                                                                  archived ===
                                                                                                                    'play-character-voice' &&
                                                                                                                    void playPreview(
                                                                                                                      projectId[
                                                                                                                        'dataset'
                                                                                                                      ][
                                                                                                                        'storyVoiceAssetId'
                                                                                                                      ],
                                                                                                                    );
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
    },
    handler100 = (enabled49) => {
      if (!enabled49?.['project']) return ![];
      return (hide(), updateProject(enabled49['project'], enabled49['reason']), !![]);
    },
    handler101 = (value299, reason5 = 'scene-reference-change') =>
      handler100(applyPersonReplacementShotSceneReference(initialProject2, value299, { reason: reason5 })),
    handler102 = (value300, reason6 = 'person-mapping-clear') =>
      handler100(clearPersonReplacementShotPersonMappings(initialProject2, value300, { reason: reason6 })),
    handler103 = (value301) =>
      handler100(assignPersonReplacementShotPersonMapping(initialProject2, value301)),
    handler88 = ({ restoreFocus: restoreFocus = ![] } = {}) => {
      const el97 = value66?.['focusTarget'];
      ((value66 = null),
        floatingMenuHost?.['querySelector']?.('[data-person-replacement-mapping-scope-menu]')?.[
          'remove'
        ]?.());
      if (restoreFocus) el97?.['focus']?.();
    },
    handler104 = ({
      personBox: personBox,
      mapping: mapping,
      personLabel: personLabel = '',
      targetName: targetName = '',
      appearanceName: appearanceName = '',
      clientX: clientX3,
      clientY: clientY2,
    } = {}) => {
      if (!floatingMenuHost || !personBox || !mapping) return ![];
      (handler88(),
        (value66 = { mapping: mapping, focusTarget: personBox }),
        floatingMenuHost['insertAdjacentHTML']?.(
          'beforeend',
          personReplacementIdentityPresentation['renderOverlay']('mapping-scope', {
            personLabel: personLabel,
            targetName: targetName,
            appearanceName: appearanceName,
          }),
        ));
      const el98 = floatingMenuHost['querySelector']?.('[data-person-replacement-mapping-scope-menu]');
      if (!el98) return ((value66 = null), ![]);
      const box3 = floatingMenuHost['getBoundingClientRect']?.(),
        box4 = personBox['getBoundingClientRect']?.(),
        box5 = el98['getBoundingClientRect']?.();
      if (box3 && box4 && box5) {
        const value302 = box5['width'] || 0x104,
          value303 = box5['height'] || 0xaa,
          value304 = Number['isFinite'](Number(clientX3)) ? Number(clientX3) : box4['right'],
          value305 = Number['isFinite'](Number(clientY2)) ? Number(clientY2) : box4['top'],
          clamp3 = clamp(value304 - box3['left'] - value302 / 0x2, 0xc, box3['width'] - value302 - 0xc, 0xc),
          value306 = value305 - box3['top'] + 0xa,
          value307 =
            value306 + value303 <= box3['height'] - 0xc
              ? value306
              : clamp(value305 - box3['top'] - value303 - 0xa, 0xc, box3['height'] - value303 - 0xc, 0xc);
        (el98['style']?.['setProperty']?.('--person-replacement-mapping-scope-left', clamp3 + 'px'),
          el98['style']?.['setProperty']?.('--person-replacement-mapping-scope-top', value307 + 'px'));
      }
      return (
        el98['querySelector']?.('[data-person-replacement-mapping-scope=\x27current\x27]')?.['focus']?.(),
        !![]
      );
    },
    handler105 = (selectedAssetIds2, targetKind) =>
      requestPersonReplacementLibraryAssignment({
        project: initialProject2,
        selectedAssetIds: selectedAssetIds2,
        targetKind: targetKind,
        root: floatingMenuHost,
        documentObject: documentObject,
        windowObject: windowObject,
        hasWorkspaceIntent: hasWorkspaceIntent,
        runIntent: runIntent,
      }),
    value308 = (shiftKey) => {
      if (ctx?.['handleClick'](shiftKey)) return;
      const value309 = value49;
      value49 = null;
      if (value309 && (shiftKey['target'] === value309 || value309['contains']?.(shiftKey['target']))) {
        (shiftKey['preventDefault']?.(), shiftKey['stopPropagation']?.());
        return;
      }
      if (personReplacementExportSubmenuController['handleClick'](shiftKey)) return;
      !shiftKey['target']?.['closest']?.('[data-person-replacement-output-menu]') && handler15();
      !shiftKey['target']?.['closest']?.('.person-replacement-library-add-menu-wrap') && handler36();
      !shiftKey['target']?.['closest']?.('.person-replacement-add-voice-menu-wrap') && handler38();
      if (assetLibraryDisclosure['toggleFromTarget'](shiftKey['target'])) return;
      if (workspaceMarqueeSelectionController?.['consumeClick']?.(shiftKey)) return;
      if (!shiftKey['target']?.['closest']?.('.story-home-param-picker')) handler91();
      !shiftKey['target']?.['closest']?.('[data-person-replacement-detection-picker]') && handler90();
      if (handler97(shiftKey)) return;
      const value310 = shiftKey['target']?.['closest']?.('[data-person-replacement-shot-cut-timeline]');
      if (
        selectedIds['isOpen'] &&
        value310 &&
        Number(shiftKey['detail']) > 0x0 &&
        !shiftKey['target']?.['closest']?.('[data-person-replacement-cut-boundary-index]')
      ) {
        (shiftKey['preventDefault']?.(), seekTimeline(getTimelineSecFromPointer(shiftKey, value310)));
        return;
      }
      const value311 = shiftKey['target']?.['closest']?.('[data-story-asset-name-id]');
      if (value311 && floatingMenuHost['contains'](value311)) {
        (shiftKey['preventDefault']?.(), shiftKey['stopPropagation']?.(), hide(), handler48(value311));
        return;
      }
      const el99 = shiftKey['target']?.['closest']?.('[data-story-home-param-trigger="asset-preset"]');
      if (el99 && floatingMenuHost['contains'](el99)) {
        const el100 = el99['closest']?.('.story-home-param-picker'),
          value312 = !el100?.['classList']?.['contains']?.('is-open');
        (handler91(el100),
          el100?.['classList']?.['toggle']?.('is-open', value312),
          el99['setAttribute']?.('aria-expanded', String(value312)));
        return;
      }
      const el101 = shiftKey['target']?.['closest']?.('[data-story-asset-preset-option]');
      if (el101 && floatingMenuHost['contains'](el101)) {
        updateProject(
          {
            ...initialProject2,
            workspace: {
              ...initialProject2['workspace'],
              assetPromptPresetId: normalizePersonReplacementAssetPromptPresetId(
                el101['dataset']['storyAssetPresetOption'],
              ),
            },
          },
          'asset-prompt-preset',
        );
        return;
      }
      const el102 = shiftKey['target']?.['closest']?.('[data-ref-remove-action]');
      if (el102 && floatingMenuHost['contains'](el102)) {
        const text23 = normalizeText(el102['dataset']['refRemoveAction']);
        if (
          ['clear-person-replacement-target', 'clear-person-replacement-scene-reference']['includes'](text23)
        ) {
          shiftKey['preventDefault']?.();
          let shotId3 = null;
          try {
            shotId3 = JSON['parse'](el102['dataset']['refRemoveValue'] || '{}');
          } catch {
            shotId3 = null;
          }
          if (shotId3 && text23 === 'clear-person-replacement-target')
            handler102(shotId3, 'person-mapping-clear-reference');
          else
            shotId3 &&
              text23 === 'clear-person-replacement-scene-reference' &&
              handler101({ shotId: shotId3['shotId'] }, 'scene-reference-clear');
          return;
        }
      }
      const el103 = shiftKey['target']?.['closest']?.(
        '[data-person-replacement-video-reference-inputs] .ref-thumb-delete',
      );
      if (el103 && floatingMenuHost['contains'](el103)) {
        const slotId = el103['closest']?.('[data-slot]');
        slotId &&
          (shiftKey['preventDefault']?.(),
          runIntent(
            downloadImageIntent['REMOVE_REPLACEMENT_VIDEO_INPUT'],
            {
              shotId: initialProject2['workspace']['selectedShotId'],
              slotId: slotId['dataset']['slot'],
              kind: slotId['dataset']['kind'],
              modelId: initialProject2['settings']['replacementModelId'],
            },
            {},
            { applyCallbackResult: ![] },
          ));
        return;
      }
      const slotId2 = shiftKey['target']?.['closest']?.(
        '[data-person-replacement-video-reference-inputs]\x20.ref-upload-slot[data-slot]',
      );
      if (slotId2 && floatingMenuHost['contains'](slotId2)) {
        const kind2 = normalizeText(slotId2['dataset']['kind']);
        value45 = {
          kind: kind2,
          shotId: initialProject2['workspace']['selectedShotId'],
          slotId: slotId2['dataset']['slot'],
          modelId: initialProject2['settings']['replacementModelId'],
        };
        const el104 = floatingMenuHost['querySelector']?.(
          '[data-person-replacement-input=\x27replacement-video-slot\x27]',
        );
        el104 && ((el104['accept'] = kind2 === 'image' ? 'image/*' : 'video/*'), el104['click']?.());
        return;
      }
      const el105 = shiftKey['target']?.['closest']?.('[data-story-asset-id]');
      if (el105 && floatingMenuHost['contains'](el105)) {
        const itemId = normalizeText(el105['dataset']['storyAssetId']);
        if (el105['dataset']['personReplacementShotCard'] === 'true') {
          const shotSelectionMode = resolveWorkspaceCardMultiSelection({
            selectedIds: initialProject2['workspace']['selectedShotIds'],
            itemId: itemId,
            activeItemId: initialProject2['workspace']['selectedShotId'],
            selectionMode: initialProject2['workspace']['shotSelectionMode'],
            shiftKey: shiftKey['shiftKey'] === !![],
            toggleKey: shiftKey['ctrlKey'] || shiftKey['metaKey'],
            orderedIds: initialProject2['shots']['map']((value313) => value313['id']),
          });
          (shotSelectionMode['handled'] &&
            updateProject(
              {
                ...initialProject2,
                workspace: {
                  ...initialProject2['workspace'],
                  shotSelectionMode:
                    shotSelectionMode['selectionMode'] &&
                    Boolean(shiftKey['shiftKey'] || shiftKey['ctrlKey'] || shiftKey['metaKey']),
                  selectedShotIds: shotSelectionMode['selectedIds'],
                },
              },
              'shot-selection',
            ),
            !shiftKey['shiftKey'] && !shiftKey['ctrlKey'] && !shiftKey['metaKey'] && handler51(itemId));
        } else {
          if (
            initialProject2['workspace']['step'] === 0x2 &&
            el105['dataset']['personReplacementReplacementAssetKind'] === 'scene'
          ) {
            if (initialProject2['workspace']['selectedSceneId'] === itemId) return;
            updateProject(
              { ...initialProject2, workspace: { ...initialProject2['workspace'], selectedSceneId: itemId } },
              'replacement-scene-asset-select',
            );
          } else {
            if (
              initialProject2['workspace']['step'] === 0x2 &&
              el105['dataset']['personReplacementTargetCharacterId']
            ) {
              if (initialProject2['workspace']['selectedCharacterId'] === itemId) return;
              updateProject(
                {
                  ...initialProject2,
                  workspace: { ...initialProject2['workspace'], selectedCharacterId: itemId },
                },
                'replacement-target-asset-select',
              );
            } else {
              if (initialProject2['workspace']['characterAssetTab'] === 'audio') {
                const assetSelectionMode = resolveWorkspaceCardMultiSelection({
                  selectedIds: initialProject2['workspace']['selectedAssetIds'],
                  itemId: itemId,
                  activeItemId: initialProject2['workspace']['selectedAudioAssetId'],
                  orderedIds: getPersonReplacementSelectableAssets(initialProject2, 'audio')['map'](
                    (value314) => value314['id'],
                  ),
                  shiftKey: shiftKey['shiftKey'],
                  toggleKey: shiftKey['ctrlKey'] || shiftKey['metaKey'],
                });
                updateProject(
                  {
                    ...initialProject2,
                    workspace: {
                      ...initialProject2['workspace'],
                      selectedAudioAssetId: itemId,
                      assetSelectionMode: assetSelectionMode['selectionMode'],
                      selectedAssetIds: assetSelectionMode['selectedIds'],
                    },
                  },
                  'audio-library-asset-select',
                );
              } else {
                if (initialProject2['workspace']['characterAssetTab'] === 'scene') {
                  const assetSelectionMode2 = resolveWorkspaceCardMultiSelection({
                    selectedIds: initialProject2['workspace']['selectedAssetIds'],
                    itemId: itemId,
                    activeItemId: initialProject2['workspace']['selectedSceneId'],
                    orderedIds: getPersonReplacementSelectableAssets(initialProject2, 'scene')['map'](
                      (value315) => value315['id'],
                    ),
                    toggleKey: shiftKey['ctrlKey'] || shiftKey['metaKey'],
                    selectionMode: initialProject2['workspace']['assetSelectionMode'],
                    shiftKey: shiftKey['shiftKey'] === !![],
                  });
                  updateProject(
                    {
                      ...initialProject2,
                      workspace: {
                        ...initialProject2['workspace'],
                        selectedSceneId: itemId,
                        ...(assetSelectionMode2['handled']
                          ? {
                              assetSelectionMode: assetSelectionMode2['selectionMode'],
                              selectedAssetIds: assetSelectionMode2['selectedIds'],
                            }
                          : { selectedSceneId: itemId }),
                      },
                    },
                    'scene-asset-select',
                  );
                } else {
                  if (initialProject2['workspace']['characterAssetTab'] === 'library') {
                    const value316 = initialProject2['libraryAssets']['find'](
                        (value317) => value317['id'] === itemId,
                      ),
                      assetSelectionMode3 = resolveWorkspaceCardMultiSelection({
                        selectedIds: initialProject2['workspace']['selectedAssetIds'],
                        itemId: itemId,
                        activeItemId: initialProject2['workspace']['selectedLibraryAssetId'],
                        orderedIds: getWorkspaceAssetLibrarySelectionOrder(
                          getPersonReplacementSelectableAssets(initialProject2, 'library'),
                          assetLibraryDisclosure,
                        ),
                        toggleKey: shiftKey['ctrlKey'] || shiftKey['metaKey'],
                        selectionMode: initialProject2['workspace']['assetSelectionMode'],
                        shiftKey: shiftKey['shiftKey'] === !![],
                        enabled: Boolean(
                          (normalizeText(value316?.['mediaKind'])['toLowerCase']() === 'image' &&
                            normalizeText(value316?.['sourceUrl'] || value316?.['imageUrl'])) ||
                          (normalizeText(value316?.['mediaKind'])['toLowerCase']() === 'audio' &&
                            getPersonReplacementLibraryAudioRef(value316)),
                        ),
                      });
                    updateProject(
                      {
                        ...initialProject2,
                        workspace: {
                          ...initialProject2['workspace'],
                          selectedLibraryAssetId: itemId,
                          ...(assetSelectionMode3['handled']
                            ? {
                                assetSelectionMode: assetSelectionMode3['selectionMode'],
                                selectedAssetIds: assetSelectionMode3['selectedIds'],
                              }
                            : {}),
                        },
                      },
                      'library-asset-select',
                    );
                  } else {
                    const assetSelectionMode4 = resolveWorkspaceCardMultiSelection({
                      selectedIds: initialProject2['workspace']['selectedAssetIds'],
                      itemId: itemId,
                      activeItemId: initialProject2['workspace']['selectedCharacterId'],
                      orderedIds: getPersonReplacementSelectableAssets(initialProject2, 'character')['map'](
                        (value318) => value318['id'],
                      ),
                      toggleKey: shiftKey['ctrlKey'] || shiftKey['metaKey'],
                      selectionMode: initialProject2['workspace']['assetSelectionMode'],
                      shiftKey: shiftKey['shiftKey'] === !![],
                    });
                    updateProject(
                      {
                        ...initialProject2,
                        workspace: {
                          ...initialProject2['workspace'],
                          selectedCharacterId: itemId,
                          ...(assetSelectionMode4['handled']
                            ? {
                                assetSelectionMode: assetSelectionMode4['selectionMode'],
                                selectedAssetIds: assetSelectionMode4['selectedIds'],
                              }
                            : { selectedCharacterId: itemId }),
                        },
                      },
                      'asset-select',
                    );
                  }
                }
              }
            }
          }
        }
        focusWorkspaceAssetCard(floatingMenuHost, itemId);
        return;
      }
      const el106 = shiftKey['target']?.['closest']?.('[data-story-action]');
      if (el106 && floatingMenuHost['contains'](el106)) {
        handler99(el106, normalizeText(el106['dataset']['storyAction']));
        return;
      }
      const el107 = shiftKey['target']?.['closest']?.('[data-story-open-project]');
      if (
        el107 &&
        floatingMenuHost['contains'](el107) &&
        !shiftKey['target']?.['closest']?.('[data-story-project-title]')
      ) {
        runIntent(downloadImageIntent['OPEN_PROJECT'], el107['dataset']['storyOpenProject']);
        return;
      }
      initialProject2['workspace']['view'] === 'home' &&
        !shiftKey['target']?.['closest']?.('[data-story-project-sort-wrap]') &&
        handler94(![]);
      initialProject2['workspace']['view'] === 'home' &&
        initialProject2['workspace']['openProjectMenuId'] &&
        !shiftKey['target']?.['closest']?.('[data-story-project-menu-wrap]') &&
        ((initialProject2 = normalizePersonReplacementWorkspaceProject({
          ...initialProject2,
          workspace: { ...initialProject2['workspace'], openProjectMenuId: '' },
        })),
        floatingMenuHost?.['querySelectorAll']?.('.story-project-card.is-menu-open')?.['forEach']?.(
          (el108) => {
            el108['classList']?.['remove']?.('is-menu-open');
            const el109 = el108['querySelector']?.("[data-story-action='toggle-project-menu']"),
              el110 = el108['querySelector']?.('[data-story-project-menu]');
            (el109?.['setAttribute']?.('aria-expanded', 'false'),
              el110?.['setAttribute']?.('aria-hidden', 'true'));
            if (el110) el110['hidden'] = !![];
          },
        ));
      if (shiftKey['target']?.['closest']?.('[data-person-replacement-cut-boundary-index]')) return;
      const sourceId = shiftKey['target']?.['closest']?.('[data-person-replacement-action]');
      if (!sourceId || !floatingMenuHost['contains'](sourceId)) return;
      const mode2 = sourceId['dataset']['personReplacementAction'];
      if (mode2 === 'confirm-person-mapping-scope') {
        const args25 = value66?.['mapping'],
          scope2 =
            normalizeText(sourceId['dataset']['personReplacementMappingScope'])['toLowerCase']() === 'current'
              ? 'current'
              : 'all';
        (handler88(), args25 && handler103({ ...args25, scope: scope2 }));
      } else {
        if (mode2 === 'close') value93['close']();
        else {
          if (mode2 === 'back-home') runIntent(downloadImageIntent['BACK_HOME'], cloneJson(initialProject2));
          else {
            if (mode2 === 'open-project')
              runIntent(downloadImageIntent['OPEN_PROJECT'], sourceId['dataset']['projectId']);
            else {
              if (mode2 === 'select-step') navigate(sourceId['dataset']['personReplacementStep']);
              else {
                if (mode2 === 'previous-step') navigate(initialProject2['workspace']['step'] - 0x1);
                else {
                  if (mode2 === 'next-step') navigate(initialProject2['workspace']['step'] + 0x1);
                  else {
                    if (mode2 === 'set-video-input-mode') {
                      const inputMode =
                        sourceId['dataset']['personReplacementVideoInputMode'] ===
                        PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE
                          ? PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE
                          : PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME;
                      if (inputMode === initialProject2['settings']['replacementVideoInputMode']) return;
                      const value319 = documentObject?.['activeElement'] === sourceId,
                        replacementVideoGenerationParams2 = resolvePersonReplacementVideoParameterPolicy({
                          modelId: initialProject2['settings']['replacementModelId'],
                          inputMode: inputMode,
                          generationParams: initialProject2['settings']['replacementVideoGenerationParams'],
                          resetModeDefaults: !![],
                        });
                      updateProject(
                        {
                          ...initialProject2,
                          settings: {
                            ...initialProject2['settings'],
                            replacementVideoInputMode: inputMode,
                            replacementVideoGenerationParams:
                              replacementVideoGenerationParams2['generationParams'],
                          },
                        },
                        'video-input-mode',
                      );
                      if (value319)
                        floatingMenuHost['querySelector'](
                          '[data-person-replacement-action="set-video-input-mode"]',
                        )?.['focus']?.({ preventScroll: !![] });
                    } else {
                      if (mode2 === 'select-voice-source') selectSource(sourceId['dataset']['sourceId']);
                      else {
                        if (mode2 === 'extract-clean-voice')
                          runIntent(
                            downloadImageIntent['EXTRACT_VOICE'],
                            sourceId['dataset']['sourceId'],
                            {},
                            { applyCallbackResult: ![] },
                          );
                        else {
                          if (mode2 === 'cancel-voice-separation')
                            runIntent(
                              downloadImageIntent['CANCEL_VOICE_EXTRACTION'],
                              sourceId['dataset']['sourceId'],
                              {},
                              { applyCallbackResult: ![] },
                            );
                          else {
                            if (mode2 === 'select-voice-asset')
                              selectVoiceAsset(sourceId['dataset']['characterId']);
                            else {
                              if (mode2 === 'choose-source-videos')
                                floatingMenuHost['querySelector'](
                                  "[data-person-replacement-input='source-videos']",
                                )?.['click']?.();
                              else {
                                if (mode2 === 'remove-source')
                                  runIntent(downloadImageIntent['REMOVE_SOURCE'], {
                                    sourceId: sourceId['dataset']['sourceId'],
                                  });
                                else {
                                  if (mode2 === 'choose-new-character-images')
                                    floatingMenuHost['querySelector'](
                                      "[data-person-replacement-input='new-character-images']",
                                    )?.['click']?.();
                                  else {
                                    if (mode2 === 'choose-new-scene-images')
                                      floatingMenuHost['querySelector'](
                                        "[data-person-replacement-input='new-scene-images']",
                                      )?.['click']?.();
                                    else {
                                      if (mode2 === 'choose-new-audio-files')
                                        floatingMenuHost['querySelector'](
                                          "[data-person-replacement-input='new-audio-files']",
                                        )?.['click']?.();
                                      else {
                                        if (mode2 === 'cancel-character-voice-library') {
                                          const selectedCharacterId2 = voiceLibraryTargetCharacterId;
                                          ((voiceLibraryTargetCharacterId = ''),
                                            updateProject(
                                              {
                                                ...initialProject2,
                                                workspace: {
                                                  ...initialProject2['workspace'],
                                                  characterAssetTab: 'character',
                                                  selectedCharacterId:
                                                    selectedCharacterId2 ||
                                                    initialProject2['workspace']['selectedCharacterId'],
                                                  assetSelectionMode: ![],
                                                  selectedAssetIds: [],
                                                },
                                              },
                                              'character-voice-library-cancel',
                                            ));
                                        } else {
                                          if (
                                            [
                                              'bind-project-audio',
                                              'add-project-audio',
                                              'remove-project-audio',
                                            ]['includes'](mode2)
                                          ) {
                                            const el111 = sourceId['closest'](
                                                '[data-workspace-audio-asset-id]',
                                              ),
                                              audioAssetId = el111?.['dataset']['workspaceAudioAssetId'],
                                              enabled50 = [
                                                ...initialProject2['audioAssets'],
                                                ...initialProject2['libraryAssets'],
                                              ]['find']((value320) => value320['id'] === audioAssetId);
                                            if (!enabled50) return;
                                            if (mode2 === 'add-project-audio')
                                              handler105([audioAssetId], 'audio');
                                            else {
                                              if (mode2 === 'remove-project-audio')
                                                runIntent(downloadImageIntent['DELETE_AUDIO_ASSET'], {
                                                  audioAssetId: audioAssetId,
                                                });
                                              else {
                                                const characterId5 = el111['querySelector'](
                                                  '[data-person-replacement-audio-character]',
                                                )?.['value'];
                                                if (
                                                  initialProject2['characters']['some'](
                                                    (value321) => value321['id'] === characterId5,
                                                  )
                                                )
                                                  runIntent(
                                                    downloadImageIntent['SELECT_CHARACTER_VOICE_LIBRARY'],
                                                    {
                                                      characterId: characterId5,
                                                      asset: cloneJson(enabled50),
                                                    },
                                                  );
                                              }
                                            }
                                          } else {
                                            if (mode2 === 'confirm-character-voice-library') {
                                              const selectedCharacterId3 = voiceLibraryTargetCharacterId,
                                                text24 = normalizeText(
                                                  sourceId['dataset']['personReplacementAudioAssetId'],
                                                ),
                                                value322 = initialProject2['audioAssets']['find'](
                                                  (value323) =>
                                                    value323['id'] ===
                                                      (text24 ||
                                                        initialProject2['workspace'][
                                                          'selectedAudioAssetId'
                                                        ]) &&
                                                    normalizeText(value323?.['mediaKind'])[
                                                      'toLowerCase'
                                                    ]() === 'audio',
                                                );
                                              if (
                                                !selectedCharacterId3 ||
                                                !getPersonReplacementLibraryAudioRef(value322)
                                              ) {
                                                windowObject?.['showToast']?.(
                                                  '请选择要添加的人设声音。',
                                                  'warn',
                                                );
                                                return;
                                              }
                                              const run12 = (enabled51) => {
                                                  if (!enabled51) return;
                                                  ((voiceLibraryTargetCharacterId = ''),
                                                    updateProject(
                                                      {
                                                        ...initialProject2,
                                                        workspace: {
                                                          ...initialProject2['workspace'],
                                                          characterAssetTab: 'character',
                                                          selectedCharacterId: selectedCharacterId3,
                                                          assetSelectionMode: ![],
                                                          selectedAssetIds: [],
                                                        },
                                                      },
                                                      'character-voice-library-confirm',
                                                    ));
                                                },
                                                promise4 = runIntent(
                                                  downloadImageIntent['SELECT_CHARACTER_VOICE_LIBRARY'],
                                                  {
                                                    characterId: selectedCharacterId3,
                                                    asset: cloneJson(value322),
                                                  },
                                                );
                                              if (promise4?.['then']) void promise4['then'](run12);
                                              else run12(promise4);
                                            } else {
                                              if (mode2 === 'toggle-library-add-targets') {
                                                const el112 = sourceId['closest']?.(
                                                    '.person-replacement-library-add-menu-wrap',
                                                  ),
                                                  value324 = !el112?.['classList']?.['contains']?.('is-open');
                                                (handler36(el112), handler35(el112, value324));
                                              } else {
                                                if (
                                                  mode2 === 'add-library-assets-to-project' ||
                                                  mode2 === 'add-library-assets-to-characters'
                                                ) {
                                                  const text25 = normalizeText(
                                                      sourceId['dataset'][
                                                        'personReplacementLibraryTargetKind'
                                                      ],
                                                    ),
                                                    value325 =
                                                      mode2 === 'add-library-assets-to-characters'
                                                        ? 'character'
                                                        : ['character', 'scene', 'audio']['includes'](text25)
                                                          ? text25
                                                          : 'character';
                                                  handler35(
                                                    sourceId['closest']?.(
                                                      '.person-replacement-library-add-menu-wrap',
                                                    ),
                                                    ![],
                                                  );
                                                  const value326 = initialProject2['workspace'][
                                                    'assetSelectionMode'
                                                  ]
                                                    ? initialProject2['workspace']['selectedAssetIds']
                                                    : [
                                                        initialProject2['workspace'][
                                                          'selectedLibraryAssetId'
                                                        ],
                                                      ];
                                                  handler105(value326, value325);
                                                } else {
                                                  if (mode2 === 'select-character-asset-tab') {
                                                    const text26 = normalizeText(
                                                        sourceId['dataset']['assetTab'],
                                                      ),
                                                      characterAssetTab = [
                                                        'character',
                                                        'scene',
                                                        'audio',
                                                        'library',
                                                      ]['includes'](text26)
                                                        ? text26
                                                        : 'character',
                                                      args26 =
                                                        characterAssetTab === 'library'
                                                          ? handler19(initialProject2)
                                                          : initialProject2,
                                                      list15 =
                                                        characterAssetTab === 'audio'
                                                          ? getPersonReplacementProjectAudioAssets(args26)
                                                          : [],
                                                      selectedAudioAssetId2 =
                                                        characterAssetTab === 'audio'
                                                          ? list15['some'](
                                                              (value327) =>
                                                                value327['id'] ===
                                                                args26['workspace']['selectedAudioAssetId'],
                                                            )
                                                            ? args26['workspace']['selectedAudioAssetId']
                                                            : list15[0x0]?.['id'] || ''
                                                          : args26['workspace']['selectedAudioAssetId'];
                                                    if (characterAssetTab !== 'audio')
                                                      voiceLibraryTargetCharacterId = '';
                                                    updateProject(
                                                      {
                                                        ...args26,
                                                        workspace: {
                                                          ...args26['workspace'],
                                                          characterAssetTab: characterAssetTab,
                                                          selectedAudioAssetId: selectedAudioAssetId2,
                                                          assetSelectionMode: ![],
                                                          selectedAssetIds: [],
                                                        },
                                                      },
                                                      'character-asset-tab',
                                                    );
                                                  } else {
                                                    if (mode2 === 'toggle-smart-clip-settings')
                                                      handler12({
                                                        workspace: {
                                                          smartClipSettingsOpen:
                                                            !initialProject2['workspace'][
                                                              'smartClipSettingsOpen'
                                                            ],
                                                        },
                                                      });
                                                    else {
                                                      if (mode2 === 'set-smart-clip-mode')
                                                        handler12(
                                                          {
                                                            settings: {
                                                              smartClipMode:
                                                                sourceId['dataset']['smartClipMode'],
                                                            },
                                                          },
                                                          { notify: !![] },
                                                        );
                                                      else {
                                                        if (mode2 === 'set-smart-clip-fps')
                                                          handler12(
                                                            {
                                                              settings: {
                                                                smartClipFps: Number(
                                                                  sourceId['dataset']['smartClipFps'],
                                                                ),
                                                              },
                                                            },
                                                            { notify: !![] },
                                                          );
                                                        else {
                                                          if (mode2 === 'process-sources')
                                                            runIntent(
                                                              downloadImageIntent['PROCESS_SOURCES'],
                                                              {
                                                                mode: sourceId['dataset']['processingMode'],
                                                              },
                                                            );
                                                          else {
                                                            if (
                                                              session['handleAction'](mode2, {
                                                                target: sourceId,
                                                                event: shiftKey,
                                                              })
                                                            ) {
                                                            } else {
                                                              if (mode2 === 'select-shot')
                                                                (close2({
                                                                  animate: ![],
                                                                  renderWorkspace: ![],
                                                                }),
                                                                  handler51(sourceId['dataset']['shotId']));
                                                              else {
                                                                if (mode2 === 'select-composite-full-video')
                                                                  buildPersonReplacementCompositePreviewSnapshot(
                                                                    initialProject2,
                                                                  )['fullAvailable'] &&
                                                                    updateProject(
                                                                      {
                                                                        ...initialProject2,
                                                                        workspace: {
                                                                          ...initialProject2['workspace'],
                                                                          compositePreviewMode: 'full',
                                                                        },
                                                                      },
                                                                      'composite-full-video-select',
                                                                    );
                                                                else {
                                                                  if (
                                                                    mode2 ===
                                                                    'toggle-source-identity-selection'
                                                                  ) {
                                                                    const text27 = normalizeText(
                                                                        sourceId['dataset'][
                                                                          'sourceCharacterId'
                                                                        ],
                                                                      ),
                                                                      map5 = new Set(
                                                                        initialProject2['workspace'][
                                                                          'selectedIdentityIds'
                                                                        ],
                                                                      );
                                                                    if (map5['has'](text27))
                                                                      map5['delete'](text27);
                                                                    else map5['add'](text27);
                                                                    updateProject(
                                                                      {
                                                                        ...initialProject2,
                                                                        workspace: {
                                                                          ...initialProject2['workspace'],
                                                                          selectedIdentityIds: [...map5],
                                                                        },
                                                                      },
                                                                      'identity-selection',
                                                                    );
                                                                  } else {
                                                                    if (mode2 === 'merge-source-identities')
                                                                      runIntent(
                                                                        downloadImageIntent[
                                                                          'MERGE_SOURCE_IDENTITIES'
                                                                        ],
                                                                        {
                                                                          sourceCharacterIds:
                                                                            initialProject2['workspace'][
                                                                              'selectedIdentityIds'
                                                                            ],
                                                                        },
                                                                      );
                                                                    else {
                                                                      if (
                                                                        mode2 === 'toggle-detection-picker'
                                                                      ) {
                                                                        const el113 = sourceId['closest']?.(
                                                                            '[data-person-replacement-detection-picker]',
                                                                          ),
                                                                          value328 =
                                                                            !el113?.['classList']?.[
                                                                              'contains'
                                                                            ]?.('is-open');
                                                                        (handler90(el113),
                                                                          handler96(el113, value328));
                                                                      } else {
                                                                        if (
                                                                          mode2 ===
                                                                          'select-detection-picker-option'
                                                                        ) {
                                                                          const el114 = sourceId['closest']?.(
                                                                              '[data-person-replacement-detection-picker]',
                                                                            ),
                                                                            text28 = normalizeText(
                                                                              el114?.['dataset']?.[
                                                                                'personReplacementDetectionPicker'
                                                                              ],
                                                                            ),
                                                                            orientation3 = normalizeText(
                                                                              sourceId['dataset'][
                                                                                'personReplacementDetectionPickerOption'
                                                                              ],
                                                                            ),
                                                                            label4 = normalizeText(
                                                                              sourceId['querySelector']?.(
                                                                                'span',
                                                                              )?.['textContent'],
                                                                              orientation3,
                                                                            ),
                                                                            sourceCharacterId4 =
                                                                              normalizeText(
                                                                                sourceId['dataset'][
                                                                                  'personReplacementSourceCharacterId'
                                                                                ],
                                                                              ),
                                                                            el115 = el114?.[
                                                                              'querySelector'
                                                                            ]?.(
                                                                              '[data-person-replacement-detection-picker-trigger]',
                                                                            ),
                                                                            el116 = el115?.[
                                                                              'querySelector'
                                                                            ]?.(
                                                                              '[data-person-replacement-detection-picker-value]',
                                                                            ),
                                                                            enabled52 =
                                                                              text28 === 'label' &&
                                                                              orientation3 ===
                                                                                PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE;
                                                                          enabled52 &&
                                                                            el115 &&
                                                                            ((el114['dataset'][
                                                                              'personReplacementPreviousValue'
                                                                            ] = normalizeText(
                                                                              el115['value'],
                                                                            )),
                                                                            (el114['dataset'][
                                                                              'personReplacementPreviousLabel'
                                                                            ] = normalizeText(
                                                                              el116?.['textContent'],
                                                                            )),
                                                                            (el114['dataset'][
                                                                              'personReplacementPreviousSourceCharacterId'
                                                                            ] = normalizeText(
                                                                              el115['dataset']?.[
                                                                                'personReplacementSelectedSourceCharacterId'
                                                                              ],
                                                                            )));
                                                                          el115 &&
                                                                            ((el115['value'] = orientation3),
                                                                            text28 === 'label' &&
                                                                              !enabled52 &&
                                                                              (el115['dataset'][
                                                                                'personReplacementSelectedSourceCharacterId'
                                                                              ] = sourceCharacterId4),
                                                                            el115['setAttribute'](
                                                                              'aria-label',
                                                                              (text28 === 'label'
                                                                                ? '人物名称'
                                                                                : text28 === 'scope'
                                                                                  ? '替换范围'
                                                                                  : '人物朝向') +
                                                                                '：' +
                                                                                label4,
                                                                            ));
                                                                          if (el116)
                                                                            el116['textContent'] = label4;
                                                                          el114?.['querySelectorAll']?.(
                                                                            '[data-person-replacement-detection-picker-option]',
                                                                          )?.['forEach']?.((el117) => {
                                                                            const value329 =
                                                                              el117 === sourceId;
                                                                            (el117['classList']?.['toggle']?.(
                                                                              'is-selected',
                                                                              value329,
                                                                            ),
                                                                              el117['setAttribute']?.(
                                                                                'aria-selected',
                                                                                String(value329),
                                                                              ));
                                                                          });
                                                                          if (text28 === 'label') {
                                                                            const el118 = el114?.[
                                                                                'querySelector'
                                                                              ]?.(
                                                                                '[data-person-replacement-person-custom-label]',
                                                                              ),
                                                                              enabled53 =
                                                                                orientation3 ===
                                                                                PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE;
                                                                            if (el115)
                                                                              el115['hidden'] = enabled53;
                                                                            el118 &&
                                                                              ((el118['hidden'] = !enabled53),
                                                                              enabled53 &&
                                                                                ((el118['value'] = ''),
                                                                                el118['focus']?.()));
                                                                          }
                                                                          handler96(el114, ![]);
                                                                          const detectionBox3 = el114?.[
                                                                            'closest'
                                                                          ]?.(
                                                                            '.person-replacement-detection-box',
                                                                          );
                                                                          if (text28 === 'orientation') {
                                                                            const label5 = detectionBox3?.[
                                                                              'querySelector'
                                                                            ]?.(
                                                                              '[data-person-replacement-person-label]',
                                                                            );
                                                                            handler39({
                                                                              detectionBox: detectionBox3,
                                                                              label: label5?.[
                                                                                'querySelector'
                                                                              ]?.(
                                                                                '[data-person-replacement-detection-picker-value]',
                                                                              )?.['textContent'],
                                                                              sourceCharacterId:
                                                                                label5?.['dataset']?.[
                                                                                  'personReplacementSelectedSourceCharacterId'
                                                                                ],
                                                                              orientation: orientation3,
                                                                            });
                                                                          } else {
                                                                            if (text28 === 'scope')
                                                                              runIntent(
                                                                                downloadImageIntent[
                                                                                  'UPDATE_PEOPLE'
                                                                                ],
                                                                                {
                                                                                  shotId: normalizeText(
                                                                                    detectionBox3?.[
                                                                                      'dataset'
                                                                                    ]?.['shotId'] ||
                                                                                      initialProject2[
                                                                                        'workspace'
                                                                                      ]['selectedShotId'],
                                                                                  ),
                                                                                  updates: [
                                                                                    {
                                                                                      personId: normalizeText(
                                                                                        detectionBox3?.[
                                                                                          'dataset'
                                                                                        ]?.['personId'],
                                                                                      ),
                                                                                      replacementScope:
                                                                                        orientation3,
                                                                                    },
                                                                                  ],
                                                                                },
                                                                              );
                                                                            else
                                                                              orientation3 !==
                                                                                PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE &&
                                                                                handler39({
                                                                                  detectionBox: detectionBox3,
                                                                                  label: label4,
                                                                                  sourceCharacterId:
                                                                                    sourceCharacterId4,
                                                                                });
                                                                          }
                                                                        } else {
                                                                          if (
                                                                            mode2 ===
                                                                            'delete-detection-custom-label'
                                                                          ) {
                                                                            const text29 = normalizeText(
                                                                              sourceId['dataset'][
                                                                                'personReplacementCustomLabel'
                                                                              ],
                                                                            );
                                                                            if (
                                                                              !text29 ||
                                                                              isGeneratedPersonReplacementLabel(
                                                                                text29,
                                                                              )
                                                                            )
                                                                              return;
                                                                            const args27 = new Set(
                                                                              initialProject2['workspace'][
                                                                                'removedCustomPersonLabels'
                                                                              ],
                                                                            );
                                                                            (args27['add'](text29),
                                                                              updateProject(
                                                                                {
                                                                                  ...initialProject2,
                                                                                  workspace: {
                                                                                    ...initialProject2[
                                                                                      'workspace'
                                                                                    ],
                                                                                    removedCustomPersonLabels:
                                                                                      [...args27],
                                                                                  },
                                                                                },
                                                                                'person-custom-label-delete',
                                                                              ));
                                                                          } else {
                                                                            if (
                                                                              mode2 === 'clear-person-mapping'
                                                                            )
                                                                              handler102({
                                                                                shotId:
                                                                                  sourceId['dataset'][
                                                                                    'shotId'
                                                                                  ],
                                                                                personId:
                                                                                  sourceId['dataset'][
                                                                                    'personId'
                                                                                  ],
                                                                              });
                                                                            else {
                                                                              if (mode2 === 'delete-person')
                                                                                (clearKeyboardSelection(),
                                                                                  handler44(
                                                                                    downloadImageIntent[
                                                                                      'DELETE_PEOPLE'
                                                                                    ],
                                                                                    {
                                                                                      shotId:
                                                                                        sourceId['dataset'][
                                                                                          'shotId'
                                                                                        ],
                                                                                      personIds: [
                                                                                        sourceId['dataset'][
                                                                                          'personId'
                                                                                        ],
                                                                                      ],
                                                                                    },
                                                                                  ));
                                                                              else {
                                                                                if (
                                                                                  mode2 ===
                                                                                  'clear-shot-people'
                                                                                ) {
                                                                                  const shotId4 =
                                                                                      normalizeText(
                                                                                        sourceId['dataset'][
                                                                                          'shotId'
                                                                                        ] ||
                                                                                          initialProject2[
                                                                                            'workspace'
                                                                                          ]['selectedShotId'],
                                                                                      ),
                                                                                    value330 =
                                                                                      initialProject2[
                                                                                        'shots'
                                                                                      ]['find'](
                                                                                        (value331) =>
                                                                                          value331['id'] ===
                                                                                          shotId4,
                                                                                      ),
                                                                                    personIds =
                                                                                      getPersonReplacementBoxedPeople(
                                                                                        value330,
                                                                                      )
                                                                                        ['map']((value332) =>
                                                                                          normalizeText(
                                                                                            value332['id'],
                                                                                          ),
                                                                                        )
                                                                                        ['filter'](Boolean);
                                                                                  if (!personIds['length'])
                                                                                    return;
                                                                                  (clearKeyboardSelection(),
                                                                                    clearBatchSelection(),
                                                                                    handler44(
                                                                                      downloadImageIntent[
                                                                                        'DELETE_PEOPLE'
                                                                                      ],
                                                                                      {
                                                                                        shotId: shotId4,
                                                                                        personIds: personIds,
                                                                                      },
                                                                                    ));
                                                                                } else {
                                                                                  if (
                                                                                    mode2 ===
                                                                                      'toggle-prompt-enhancement' ||
                                                                                    mode2 ===
                                                                                      'toggle-prompt-mode'
                                                                                  ) {
                                                                                    const args28 =
                                                                                      applyPersonReplacementPromptControlAction(
                                                                                        initialProject2,
                                                                                        mode2,
                                                                                        sourceId,
                                                                                        getShotRenderState()[
                                                                                          'generatingShotIds'
                                                                                        ],
                                                                                      );
                                                                                    if (!args28) return;
                                                                                    ((initialProject2 =
                                                                                      normalizePersonReplacementWorkspaceProject(
                                                                                        {
                                                                                          ...initialProject2,
                                                                                          ...args28['patch'],
                                                                                        },
                                                                                      )),
                                                                                      syncPersonReplacementPromptModeControl(
                                                                                        floatingMenuHost,
                                                                                        initialProject2,
                                                                                        getShotRenderState()[
                                                                                          'generatingShotIds'
                                                                                        ],
                                                                                      ),
                                                                                      handler21(
                                                                                        args28['reason'],
                                                                                      ));
                                                                                    if (
                                                                                      mode2 ===
                                                                                      'toggle-prompt-mode'
                                                                                    )
                                                                                      syncPersonReplacementImagePromptGate(
                                                                                        floatingMenuHost,
                                                                                        initialProject2,
                                                                                        handler22(),
                                                                                      );
                                                                                  } else {
                                                                                    if (
                                                                                      mode2 ===
                                                                                      'generate-replacement-image'
                                                                                    ) {
                                                                                      if (
                                                                                        initialProject2[
                                                                                          'workspace'
                                                                                        ]['shotSelectionMode']
                                                                                      ) {
                                                                                        if (
                                                                                          isShotBatchForCurrentProject()
                                                                                        ) {
                                                                                          cancelShotBatch();
                                                                                          return;
                                                                                        }
                                                                                        runShotBatch('image');
                                                                                        return;
                                                                                      }
                                                                                      const enabled54 =
                                                                                          personReplacementImagePresentation[
                                                                                            'build'
                                                                                          ](initialProject2),
                                                                                        value333 =
                                                                                          enabled54[
                                                                                            'selectedShot'
                                                                                          ],
                                                                                        list16 =
                                                                                          enabled54['gate'][
                                                                                            'duplicateRoleLabels'
                                                                                          ];
                                                                                      if (
                                                                                        !enabled54['gate'][
                                                                                          'sceneOnly'
                                                                                        ] &&
                                                                                        list16['length']
                                                                                      ) {
                                                                                        windowObject?.[
                                                                                          'showToast'
                                                                                        ]?.(
                                                                                          '同一镜头内角色不能重复：' +
                                                                                            list16['join'](
                                                                                              '、',
                                                                                            ) +
                                                                                            '。请修改红色框中的角色名。',
                                                                                          'warn',
                                                                                        );
                                                                                        return;
                                                                                      }
                                                                                      if (
                                                                                        !enabled54['gate'][
                                                                                          'sceneOnly'
                                                                                        ] &&
                                                                                        enabled54['gate'][
                                                                                          'unresolvedOrientationPersonIds'
                                                                                        ]['length']
                                                                                      ) {
                                                                                        windowObject?.[
                                                                                          'showToast'
                                                                                        ]?.(
                                                                                          '还有 ' +
                                                                                            enabled54['gate'][
                                                                                              'unresolvedOrientationPersonIds'
                                                                                            ]['length'] +
                                                                                            '\x20个人物未确认朝向，请先选择朝向。',
                                                                                          'warn',
                                                                                        );
                                                                                        return;
                                                                                      }
                                                                                      const value334 =
                                                                                        floatingMenuHost?.[
                                                                                          'querySelector'
                                                                                        ]?.(
                                                                                          '[data-person-replacement-keyframe-stage] > img',
                                                                                        );
                                                                                      runIntent(
                                                                                        downloadImageIntent[
                                                                                          'GENERATE_REPLACEMENT_IMAGE'
                                                                                        ],
                                                                                        {
                                                                                          projectId:
                                                                                            initialProject2[
                                                                                              'id'
                                                                                            ],
                                                                                          shotId:
                                                                                            initialProject2[
                                                                                              'workspace'
                                                                                            ][
                                                                                              'selectedShotId'
                                                                                            ],
                                                                                          sourceImageSize:
                                                                                            resolvePersonReplacementSourceImageSize(
                                                                                              value334,
                                                                                              value333,
                                                                                            ),
                                                                                        },
                                                                                        {},
                                                                                        {
                                                                                          applyCallbackResult:
                                                                                            ![],
                                                                                        },
                                                                                      );
                                                                                    } else {
                                                                                      if (
                                                                                        mode2 ===
                                                                                        'generate-replacement-video'
                                                                                      ) {
                                                                                        if (
                                                                                          initialProject2[
                                                                                            'workspace'
                                                                                          ][
                                                                                            'shotSelectionMode'
                                                                                          ]
                                                                                        ) {
                                                                                          if (
                                                                                            isShotBatchForCurrentProject()
                                                                                          ) {
                                                                                            cancelShotBatch();
                                                                                            return;
                                                                                          }
                                                                                          runShotBatch(
                                                                                            'video',
                                                                                          );
                                                                                          return;
                                                                                        }
                                                                                        const shotId5 =
                                                                                            initialProject2[
                                                                                              'workspace'
                                                                                            ][
                                                                                              'selectedShotId'
                                                                                            ],
                                                                                          personReplacementVideoGenerationState =
                                                                                            resolvePersonReplacementVideoGenerationState(
                                                                                              initialProject2[
                                                                                                'workspace'
                                                                                              ],
                                                                                              shotId5,
                                                                                            );
                                                                                        if (
                                                                                          isPersonReplacementVideoGenerationActive(
                                                                                            personReplacementVideoGenerationState,
                                                                                          )
                                                                                        ) {
                                                                                          runIntent(
                                                                                            downloadImageIntent[
                                                                                              'CANCEL_REPLACEMENT_VIDEO'
                                                                                            ],
                                                                                            {
                                                                                              projectId:
                                                                                                initialProject2[
                                                                                                  'id'
                                                                                                ],
                                                                                              shotId: shotId5,
                                                                                            },
                                                                                            {},
                                                                                            {
                                                                                              applyCallbackResult:
                                                                                                ![],
                                                                                            },
                                                                                          );
                                                                                          return;
                                                                                        }
                                                                                        runIntent(
                                                                                          downloadImageIntent[
                                                                                            'GENERATE_REPLACEMENT_VIDEO'
                                                                                          ],
                                                                                          {
                                                                                            projectId:
                                                                                              initialProject2[
                                                                                                'id'
                                                                                              ],
                                                                                            shotId: shotId5,
                                                                                          },
                                                                                          {},
                                                                                          {
                                                                                            applyCallbackResult:
                                                                                              ![],
                                                                                          },
                                                                                        );
                                                                                      } else {
                                                                                        if (
                                                                                          mode2 ===
                                                                                          'trim-current-video'
                                                                                        )
                                                                                          handler41(
                                                                                            sourceId[
                                                                                              'dataset'
                                                                                            ]['shotId'],
                                                                                          );
                                                                                        else {
                                                                                          if (
                                                                                            mode2 ===
                                                                                            'toggle-video-replacement-sync-playback'
                                                                                          )
                                                                                            void personReplacementVideoPlaybackController[
                                                                                              'toggleSyncEnabled'
                                                                                            ]();
                                                                                          else {
                                                                                            if (
                                                                                              mode2 ===
                                                                                              'toggle-comparison-playback'
                                                                                            )
                                                                                              personReplacementCompositePreviewController[
                                                                                                'togglePlayback'
                                                                                              ]();
                                                                                            else {
                                                                                              if (
                                                                                                mode2 ===
                                                                                                'set-preview-track'
                                                                                              )
                                                                                                handler40(
                                                                                                  sourceId[
                                                                                                    'dataset'
                                                                                                  ][
                                                                                                    'previewTrack'
                                                                                                  ],
                                                                                                );
                                                                                              else {
                                                                                                if (
                                                                                                  mode2 ===
                                                                                                  'compose-output'
                                                                                                )
                                                                                                  runIntent(
                                                                                                    downloadImageIntent[
                                                                                                      'COMPOSE_OUTPUT'
                                                                                                    ],
                                                                                                    cloneJson(
                                                                                                      initialProject2,
                                                                                                    ),
                                                                                                    {},
                                                                                                    {
                                                                                                      applyCallbackResult:
                                                                                                        ![],
                                                                                                    },
                                                                                                  );
                                                                                                else {
                                                                                                  if (
                                                                                                    mode2 ===
                                                                                                    'toggle-output-menu'
                                                                                                  )
                                                                                                    handler16(
                                                                                                      sourceId,
                                                                                                    );
                                                                                                  else {
                                                                                                    if (
                                                                                                      mode2 ===
                                                                                                      'sync-all-clips-to-canvas'
                                                                                                    )
                                                                                                      (handler15(),
                                                                                                        runIntent(
                                                                                                          downloadImageIntent[
                                                                                                            'ADD_OUTPUT_TO_CANVAS'
                                                                                                          ],
                                                                                                          {
                                                                                                            scope:
                                                                                                              PERSON_REPLACEMENT_CANVAS_SCOPES[
                                                                                                                'CLIPS'
                                                                                                              ],
                                                                                                            project:
                                                                                                              cloneJson(
                                                                                                                initialProject2,
                                                                                                              ),
                                                                                                          },
                                                                                                          {},
                                                                                                          {
                                                                                                            applyCallbackResult:
                                                                                                              ![],
                                                                                                          },
                                                                                                        ));
                                                                                                    else {
                                                                                                      if (
                                                                                                        mode2 ===
                                                                                                        'sync-project-to-canvas'
                                                                                                      )
                                                                                                        (handler15(),
                                                                                                          runIntent(
                                                                                                            downloadImageIntent[
                                                                                                              'ADD_OUTPUT_TO_CANVAS'
                                                                                                            ],
                                                                                                            {
                                                                                                              scope:
                                                                                                                PERSON_REPLACEMENT_CANVAS_SCOPES[
                                                                                                                  'PROJECT'
                                                                                                                ],
                                                                                                              project:
                                                                                                                cloneJson(
                                                                                                                  initialProject2,
                                                                                                                ),
                                                                                                            },
                                                                                                            {},
                                                                                                            {
                                                                                                              applyCallbackResult:
                                                                                                                ![],
                                                                                                            },
                                                                                                          ));
                                                                                                      else
                                                                                                        Object[
                                                                                                          'hasOwn'
                                                                                                        ](
                                                                                                          {
                                                                                                            'export-final-video': 0x1,
                                                                                                            'export-all-clips-and-images': 0x1,
                                                                                                            'export-premiere-xml': 0x1,
                                                                                                            'export-jianying-draft': 0x1,
                                                                                                          },
                                                                                                          mode2,
                                                                                                        ) &&
                                                                                                          (handler15(),
                                                                                                          runIntent(
                                                                                                            downloadImageIntent[
                                                                                                              'EXPORT_OUTPUT'
                                                                                                            ],
                                                                                                            {
                                                                                                              mode: mode2[
                                                                                                                'slice'
                                                                                                              ](
                                                                                                                'export-'[
                                                                                                                  'length'
                                                                                                                ],
                                                                                                              ),
                                                                                                              project:
                                                                                                                cloneJson(
                                                                                                                  initialProject2,
                                                                                                                ),
                                                                                                            },
                                                                                                            {},
                                                                                                            {
                                                                                                              applyCallbackResult:
                                                                                                                ![],
                                                                                                            },
                                                                                                          ));
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
    },
    handler106 = (projectSearchQuery) => {
      if (projectSearchQuery['target']?.['matches']?.('[data-story-project-search]')) {
        const value335 = Number(projectSearchQuery['target']['selectionStart']);
        ((initialProject2 = normalizePersonReplacementWorkspaceProject({
          ...initialProject2,
          workspace: {
            ...initialProject2['workspace'],
            projectSearchQuery: projectSearchQuery['target']['value'],
            openProjectMenuId: '',
            pendingDeleteProjectId: '',
          },
        })),
          (projectSearchQuery['target']['value'] = initialProject2['workspace']['projectSearchQuery']));
        const refreshWorkspaceProjectResultsInPlace2 = refreshWorkspaceProjectResultsInPlace({
          root: projectSearchQuery['target']['closest']?.('.story-home-page') || floatingMenuHost,
          documentObject: documentObject,
          renderResults: () =>
            personReplacementShellPresentation['renderHomeProjectResults'](initialProject2),
        });
        if (!refreshWorkspaceProjectResultsInPlace2) run();
        const el119 = refreshWorkspaceProjectResultsInPlace2
          ? projectSearchQuery['target']
          : floatingMenuHost?.['querySelector']?.('[data-story-project-search]');
        el119?.['focus']?.();
        Number['isFinite'](value335) && el119?.['setSelectionRange']?.(value335, value335);
        return;
      }
      if (projectSearchQuery['target']?.['matches']?.('[data-story-project-title]')) {
        const text30 = normalizeText(projectSearchQuery['target']['dataset']['storyProjectTitle']);
        initialProject2 = normalizePersonReplacementWorkspaceProject({
          ...initialProject2,
          libraryProjects: initialProject2['libraryProjects']['map']((args29) =>
            normalizeText(args29?.['id']) === text30
              ? { ...args29, title: projectSearchQuery['target']['value'] }
              : args29,
          ),
        });
        return;
      }
      if (projectSearchQuery['target']?.['matches']?.('[data-story-asset-prompt]')) {
        const enabled55 = characterId(),
          enabled56 = handler13(enabled55);
        if (!enabled55 || !enabled56) return;
        ((initialProject2 = normalizePersonReplacementWorkspaceProject({
          ...initialProject2,
          characters: initialProject2['characters']['map']((appearances2) =>
            appearances2['id'] === enabled55['id']
              ? {
                  ...appearances2,
                  appearances: appearances2['appearances']['map']((args30) =>
                    args30['id'] === enabled56['id']
                      ? {
                          ...args30,
                          prompt: readPersonReplacementAssetPromptText(projectSearchQuery['target']),
                        }
                      : args30,
                  ),
                }
              : appearances2,
          ),
        })),
          handler21('appearance-prompt'));
        return;
      }
      if (projectSearchQuery['target']?.['dataset']?.['personReplacementField'] === 'image-prompt') {
        if (shouldSkipPromptTriggerForBulkInput(projectSearchQuery)) return;
        const value336 = projectSearchQuery['target']['dataset']['shotId'],
          imagePrompt = projectSearchQuery['target']['matches']?.('[contenteditable="true"]')
            ? sanitizePromptHtmlForCommit(projectSearchQuery['target']['innerHTML'])
            : projectSearchQuery['target']['value'];
        ((initialProject2 = normalizePersonReplacementWorkspaceProject({
          ...initialProject2,
          shots: initialProject2['shots']['map']((args31) =>
            args31['id'] === value336 ? { ...args31, imagePrompt: imagePrompt } : args31,
          ),
        })),
          handler21('image-prompt'));
        return;
      }
      projectSearchQuery['target']?.['dataset']?.['personReplacementField'] === 'video-prompt' &&
        (projectSearchQuery['type'] === 'input' &&
          checkSlashTrigger(projectSearchQuery, {
            promptEl: projectSearchQuery['target'],
            nodeType: 'ai-video',
            nodeId: '',
            onPromptCommit: () => handler30(projectSearchQuery['target'], 'video-prompt'),
            onGenerate: (value337, value338) => handler31(projectSearchQuery['target'], value337, value338),
          }),
        handler30(projectSearchQuery['target']));
    },
    value339 = (selectedVoiceSourceId) => {
      if (selectedVoiceSourceId['target']['matches']?.('[data-person-replacement-audio-character]')) {
        const el120 = selectedVoiceSourceId['target']
          ['closest']('[data-workspace-audio-asset-id]')
          ?.['querySelector']('[data-person-replacement-action=\x22bind-project-audio\x22]');
        if (el120)
          el120['disabled'] = !initialProject2['characters']['some'](
            (value340) => value340['id'] === selectedVoiceSourceId['target']['value'],
          );
        return;
      }
      const value341 = selectedVoiceSourceId['target']?.['dataset']?.['personReplacementInput'];
      if (value341) {
        const list17 = Array['from'](selectedVoiceSourceId['target']['files'] || []);
        if (value341 === 'source-videos') handler17(list17['filter'](isPersonReplacementVideoFile));
        else {
          if (value341 === 'new-character-images') {
            const list18 = list17['filter'](isPersonReplacementImageFile);
            list18['length'] && handler33('character', () => handler18(list18));
          } else {
            if (value341 === 'new-scene-images') {
              const list19 = list17['filter'](isPersonReplacementImageFile);
              list19['length'] &&
                handler33('scene', () => runIntent(downloadImageIntent['SELECT_NEW_SCENE_IMAGES'], list19));
            } else {
              if (value341 === 'new-audio-files') {
                const list20 = list17['filter'](isPersonReplacementAudioFile);
                list20['length'] &&
                  handler33('audio', () => runIntent(downloadImageIntent['SELECT_NEW_AUDIO_FILES'], list20));
              } else {
                if (value341 === 'appearance-image' && list17[0x0])
                  runIntent(downloadImageIntent['SELECT_CHARACTER_REFERENCE'], list17[0x0], value45 || {});
                else {
                  if (value341 === 'replacement-image' && list17[0x0])
                    runIntent(downloadImageIntent['SELECT_REPLACEMENT_IMAGE'], list17[0x0], value45 || {}, {
                      applyCallbackResult: ![],
                    });
                  else {
                    if (value341 === 'replacement-video-result' && list17[0x0]) {
                      const value342 = value46,
                        value343 = value45 || {};
                      void runWorkspaceVideoDownloadAction(value342, () =>
                        Promise['resolve'](
                          runIntent(
                            downloadImageIntent['SELECT_REPLACEMENT_VIDEO_RESULT'],
                            list17[0x0],
                            value343,
                            {
                              applyCallbackResult: ![],
                            },
                          ),
                        ),
                      )['catch'](() => {});
                    } else {
                      if (value341 === 'replacement-video-slot' && list17[0x0])
                        runIntent(
                          downloadImageIntent['SELECT_REPLACEMENT_VIDEO_INPUT'],
                          list17[0x0],
                          value45 || {},
                          { applyCallbackResult: ![] },
                        );
                      else {
                        if (value341 === 'character-voice' && list17[0x0])
                          runIntent(
                            downloadImageIntent['SELECT_CHARACTER_VOICE'],
                            list17[0x0],
                            value45 || {},
                          );
                      }
                    }
                  }
                }
              }
            }
          }
        }
        ((selectedVoiceSourceId['target']['value'] = ''), (value45 = null), (value46 = null));
        return;
      }
      if (selectedVoiceSourceId['target']?.['matches']?.('[data-story-project-title]')) {
        const projectId2 = normalizeText(selectedVoiceSourceId['target']['dataset']['storyProjectTitle']),
          title = normalizeText(selectedVoiceSourceId['target']['value'], '未命名人物替换项目');
        ((selectedVoiceSourceId['target']['value'] = title),
          runIntent(downloadImageIntent['RENAME_PROJECT'], { projectId: projectId2, title: title }));
      } else {
        if (
          selectedVoiceSourceId['target']?.['matches']?.('[data-person-replacement-composite-project-title]')
        ) {
          const title2 = normalizeText(selectedVoiceSourceId['target']['value']) || '未命名人物替换项目';
          ((selectedVoiceSourceId['target']['value'] = title2),
            title2 !== initialProject2['title'] &&
              runIntent(downloadImageIntent['RENAME_PROJECT'], {
                projectId: initialProject2['id'],
                title: title2,
              }));
        } else {
          if (selectedVoiceSourceId['target']?.['matches']?.('[data-story-asset-prompt]'))
            handler106(selectedVoiceSourceId);
          else {
            if (
              selectedVoiceSourceId['target']?.['dataset']?.['personReplacementField'] === 'image-prompt' ||
              selectedVoiceSourceId['target']?.['dataset']?.['personReplacementField'] === 'video-prompt'
            )
              (handler106(selectedVoiceSourceId),
                selectedVoiceSourceId['target']['dataset']['personReplacementField'] === 'video-prompt' &&
                  handler21('video-prompt'));
            else
              selectedVoiceSourceId['target']?.['dataset']?.['personReplacementField'] === 'voice-source' &&
                updateProject(
                  {
                    ...initialProject2,
                    workspace: {
                      ...initialProject2['workspace'],
                      selectedVoiceSourceId: selectedVoiceSourceId['target']['value'],
                    },
                  },
                  'voice-source',
                );
          }
        }
      }
    },
    value344 = (event9) => {
      personReplacementExportSubmenuController['handleFocusOut'](event9);
      const value345 = event9['target']?.['closest']?.('[data-person-replacement-person-custom-label]');
      if (value345) handler89(value345);
      const enabled57 = event9['target']?.['closest']?.('[data-person-replacement-detection-picker]');
      enabled57 && !enabled57['contains']?.(event9['relatedTarget']) && handler96(enabled57, ![]);
      const value346 = event9['target']?.['closest']?.('[data-story-asset-name-id][contenteditable="true"]');
      if (value346) handler49(value346);
    },
    value347 = (event10) => {
      hide();
      const el121 = event10['target']?.['closest']?.('[data-person-replacement-voice-asset-id]');
      if (el121) {
        const characterId6 = normalizeText(el121['dataset']?.['personReplacementVoiceAssetId']);
        if (!event10['dataTransfer'] || !characterId6 || el121['disabled']) {
          event10['preventDefault']?.();
          return;
        }
        ((event10['dataTransfer']['effectAllowed'] = 'copy'),
          event10['dataTransfer']['setData'](
            PERSON_REPLACEMENT_VOICE_ASSET_DRAG_TYPE,
            JSON['stringify']({ characterId: characterId6 }),
          ),
          applyWorkspaceAssetNativeDragPreview(
            event10['dataTransfer'],
            el121['querySelector']?.('.person-replacement-voice-asset-image img') || el121,
          ),
          el121['classList']?.['add']?.('is-voice-asset-dragging'),
          floatingMenuHost?.['classList']?.['add']?.('is-voice-asset-dragging'));
        return;
      }
      const el122 = event10['target']?.['closest']?.(
        '[data-person-replacement-target-character-id], [data-person-replacement-target-scene-id]',
      );
      if (!el122 || !event10['dataTransfer']) {
        event10['preventDefault']?.();
        return;
      }
      if (event10['target']?.['closest']?.('.at-mention-variant-arrow')) {
        event10['preventDefault']?.();
        return;
      }
      const sceneId2 = normalizeText(el122['dataset']['personReplacementTargetSceneId']),
        characterId7 = normalizeText(el122['dataset']['personReplacementTargetCharacterId']),
        appearanceId4 = normalizeText(
          sceneId2
            ? el122['dataset']['personReplacementTargetSceneAppearanceId']
            : el122['dataset']['personReplacementTargetAppearanceId'],
        );
      if ((!sceneId2 && !characterId7) || !appearanceId4) {
        event10['preventDefault']?.();
        return;
      }
      ((enabled2 = !![]),
        (event10['dataTransfer']['effectAllowed'] = 'copy'),
        sceneId2
          ? event10['dataTransfer']['setData'](
              PERSON_REPLACEMENT_SCENE_ASSET_DRAG_TYPE,
              JSON['stringify']({ sceneId: sceneId2, appearanceId: appearanceId4 }),
            )
          : event10['dataTransfer']['setData'](
              'application/x-person-replacement-target',
              JSON['stringify']({ characterId: characterId7, appearanceId: appearanceId4 }),
            ),
        applyWorkspaceAssetNativeDragPreview(
          event10['dataTransfer'],
          el122['querySelector']?.('.story-asset-card-image') || el122,
        ),
        el122['classList']?.['add']?.('is-story-asset-dragging'));
    },
    handler107 = (el123) => {
      const el124 = el123?.['querySelector']?.('.story-asset-card-image'),
        text31 = normalizeText(el124?.['currentSrc'] || el124?.['src'] || el124?.['getAttribute']?.('src'));
      if (!el124 || !text31 || !documentObject?.['createElement']) return null;
      const box6 = el124['getBoundingClientRect']?.() || el123['getBoundingClientRect']?.() || {},
        value348 = Math['max'](0x1, Number(box6['width']) || 0x80),
        value349 = Math['max'](0x1, Number(box6['height']) || value348),
        value350 = Math['min'](0xa0, Math['max'](0x60, value348)),
        value351 = Math['max'](0x36, Math['round']((value350 * value349) / value348)),
        el125 = documentObject['createElement']('div'),
        value352 = documentObject['createElement']('img');
      return (
        (el125['className'] = 'story-asset-drag-preview\x20person-replacement-target-asset-drag-preview'),
        el125['setAttribute']('aria-hidden', 'true'),
        (el125['style']['width'] = Math['round'](value350) + 'px'),
        (el125['style']['height'] = Math['round'](value351) + 'px'),
        (value352['src'] = text31),
        (value352['alt'] = ''),
        (value352['draggable'] = ![]),
        el125['appendChild'](value352),
        documentObject['body']?.['appendChild']?.(el125),
        el125
      );
    },
    handler108 = (el126, event11) => {
      if (!el126) return;
      const value353 = Number(event11?.['clientX']) || 0x0,
        value354 = Number(event11?.['clientY']) || 0x0,
        box7 = el126['getBoundingClientRect']?.() || {},
        value355 = Math['max'](
          0x1,
          Number(box7['width']) || Number['parseFloat'](el126['style']['width']) || 0x1,
        ),
        value356 = Math['max'](
          0x1,
          Number(box7['height']) || Number['parseFloat'](el126['style']['height']) || 0x1,
        ),
        value357 = Number(windowObject?.['innerWidth']) || Number['POSITIVE_INFINITY'],
        value358 = Number(windowObject?.['innerHeight']) || Number['POSITIVE_INFINITY'],
        value359 = 0x8;
      let value360 = value353 + WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP,
        value361 = value354 + WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP;
      (value360 + value355 > value357 - value359 &&
        (value360 = value353 - value355 - WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP),
        value361 + value356 > value358 - value359 &&
          (value361 = value354 - value356 - WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP),
        (el126['style']['transform'] =
          'translate3d(' +
          Math['max'](value359, value360) +
          'px, ' +
          Math['max'](value359, value361) +
          'px,\x200)'));
    },
    handler109 = (event12) => {
      const el127 = documentObject?.['elementFromPoint']?.(
          Number(event12?.['clientX']) || 0x0,
          Number(event12?.['clientY']) || 0x0,
        ),
        value362 = el127?.['closest']?.('[data-person-replacement-person-drop]');
      return value362 && floatingMenuHost?.['contains']?.(value362) ? value362 : null;
    },
    handler110 = (event13) => {
      const el128 = documentObject?.['elementFromPoint']?.(
          Number(event13?.['clientX']) || 0x0,
          Number(event13?.['clientY']) || 0x0,
        ),
        value363 = el128?.['closest']?.('[data-person-replacement-keyframe-stage]');
      return value363 && floatingMenuHost?.['contains']?.(value363) ? value363 : null;
    },
    handler111 = (value364) => {
      if (el3 === value364) return;
      (el3?.['classList']?.['remove']?.('is-scene-reference-drop-target'),
        (el3 = value364 || null),
        el3?.['classList']?.['add']?.('is-scene-reference-drop-target'));
    },
    handler112 = ({
      personBox: personBox2,
      target: target2,
      clientX: clientX = 0x0,
      clientY: clientY = 0x0,
    } = {}) => {
      if (
        !personBox2 ||
        !normalizeText(target2?.['characterId']) ||
        !normalizeText(target2?.['appearanceId'])
      )
        return ![];
      const mapping2 = {
          shotId: personBox2['dataset']['shotId'],
          personId: personBox2['dataset']['personId'],
          targetCharacterId: target2['characterId'],
          targetAppearanceId: target2['appearanceId'],
        },
        value365 = initialProject2['shots']['find'](
          (value366) => value366['id'] === normalizeText(mapping2['shotId']),
        ),
        enabled58 = value365?.['people']?.['find'](
          (value367) => value367['id'] === normalizeText(mapping2['personId']),
        );
      if (!enabled58) return ![];
      const text32 = normalizeText(enabled58['sourceCharacterId']),
        value368 = initialProject2['mappings']['find'](
          (value369) => normalizeText(value369['sourceCharacterId']) === text32,
        )?.['targetCharacterId'],
        value370 = Boolean(normalizeText(enabled58['targetCharacterId']) || normalizeText(value368));
      if (value370) {
        const error7 = initialProject2['characters']['find'](
            (value371) => value371['id'] === normalizeText(target2['characterId']),
          ),
          error8 = getCharacterAppearance(error7, normalizeText(target2['appearanceId']));
        handler104({
          personBox: personBox2,
          mapping: mapping2,
          personLabel: normalizeText(enabled58['label'], text32 || '当前人物'),
          targetName: normalizeText(error7?.['name'], '目标人物'),
          appearanceName: normalizeText(error8?.['name'], '当前形象'),
          clientX: clientX,
          clientY: clientY,
        });
      } else handler103(mapping2);
      return (
        blockDropTarget({
          assetId: normalizeText(target2['characterId']),
          shotId: normalizeText(mapping2['shotId']),
          personId: normalizeText(mapping2['personId']),
        }),
        hide(),
        !![]
      );
    },
    handler113 = () => {
      const event14 = value48;
      ((value48 = null),
        event14?.['preview']?.['remove']?.(),
        documentObject['body']?.['classList']?.['remove']?.('person-replacement-target-asset-dragging'));
      if (!event14?.['element']) return;
      (event14['originalDraggable'] == null
        ? event14['element']['removeAttribute']?.('draggable')
        : event14['element']['setAttribute']?.('draggable', event14['originalDraggable']),
        event14['element']['hasPointerCapture']?.(event14['pointerId']) &&
          event14['element']['releasePointerCapture']?.(event14['pointerId']));
    },
    handler114 = (pointerId) => {
      const element = pointerId['target']?.['closest']?.(
        '[data-person-replacement-target-character-id], [data-person-replacement-target-scene-id]',
      );
      if (
        !element ||
        !floatingMenuHost?.['contains']?.(element) ||
        pointerId['button'] !== 0x0 ||
        pointerId['target']?.['closest']?.('.story-appearance-arrow, .at-mention-variant-arrow')
      )
        return ![];
      const kind3 = normalizeText(element['dataset']?.['personReplacementTargetSceneId']),
        characterId8 = normalizeText(element['dataset']?.['personReplacementTargetCharacterId']),
        appearanceId5 = normalizeText(
          kind3
            ? element['dataset']?.['personReplacementTargetSceneAppearanceId']
            : element['dataset']?.['personReplacementTargetAppearanceId'],
        );
      if ((!kind3 && !characterId8) || !appearanceId5) return ![];
      return (
        (value48 = {
          kind: kind3 ? 'scene' : 'character',
          sceneId: kind3,
          characterId: characterId8,
          appearanceId: appearanceId5,
          element: element,
          pointerId: pointerId['pointerId'],
          startX: Number(pointerId['clientX']) || 0x0,
          startY: Number(pointerId['clientY']) || 0x0,
          originalDraggable: element['getAttribute']?.('draggable'),
          active: ![],
          preview: null,
        }),
        element['setAttribute']?.('draggable', 'false'),
        element['setPointerCapture']?.(pointerId['pointerId']),
        !![]
      );
    },
    handler115 = (event15) => {
      const event16 = value48;
      if (!event16 || event16['pointerId'] !== event15['pointerId']) return ![];
      if (!event16['active']) {
        const value372 = (Number(event15['clientX']) || 0x0) - event16['startX'],
          value373 = (Number(event15['clientY']) || 0x0) - event16['startY'];
        if (Math['hypot'](value372, value373) < 0x8) return ![];
        ((event16['active'] = !![]),
          (enabled2 = !![]),
          event16['element']['classList']?.['add']?.('is-story-asset-dragging'),
          documentObject['body']?.['classList']?.['add']?.('person-replacement-target-asset-dragging'),
          hide(),
          (event16['preview'] = handler107(event16['element'])));
      }
      return (
        handler108(event16['preview'], event15),
        event16['kind'] === 'scene' && handler111(handler110(event15)),
        event15['preventDefault']?.(),
        !![]
      );
    },
    handler116 = (clientX4, { cancelled: cancelled = ![] } = {}) => {
      const characterId9 = value48;
      if (!characterId9 || characterId9['pointerId'] !== clientX4['pointerId']) return ![];
      const shotId6 =
          characterId9['kind'] === 'scene' && !cancelled && characterId9['active']
            ? handler110(clientX4)
            : null,
        personBox3 =
          characterId9['kind'] === 'character' && !cancelled && characterId9['active']
            ? handler109(clientX4)
            : null,
        enabled59 = characterId9['active'],
        target3 = { characterId: characterId9['characterId'], appearanceId: characterId9['appearanceId'] };
      (handler113(),
        handler111(null),
        (enabled2 = ![]),
        characterId9['element']['classList']?.['remove']?.('is-story-asset-dragging'));
      if (!enabled59) return ![];
      ((value49 = characterId9['element']), clientX4['preventDefault']?.(), clientX4['stopPropagation']?.());
      if (shotId6)
        handler101({
          shotId: shotId6['dataset']['shotId'],
          sceneId: characterId9['sceneId'],
          appearanceId: characterId9['appearanceId'],
        });
      else
        personBox3 &&
          handler112({
            personBox: personBox3,
            target: target3,
            clientX: clientX4['clientX'],
            clientY: clientX4['clientY'],
          });
      return !![];
    },
    handler117 = () => {
      (el2?.['classList']?.['remove']?.('is-dragover'),
        (el2 = null),
        floatingMenuHost?.['classList']?.['remove']?.('is-dragging-file'));
    },
    value374 = (event17) => {
      if (
        promptEnhancementModel(downloadImageIntent['HAS_PROJECT_PACKAGE_DRAG'], event17['dataTransfer']) ===
        !![]
      ) {
        (event17['preventDefault']?.(), event17['stopPropagation']?.());
        if (event17['dataTransfer']) event17['dataTransfer']['dropEffect'] = 'copy';
        return;
      }
      const value375 = event17['target']?.['closest']?.('[data-audio-voice-action="audio-param"]'),
        list21 = Array['from'](event17['dataTransfer']?.['types'] || []),
        value376 =
          floatingMenuHost?.['classList']?.['contains']?.('is-voice-asset-dragging') ||
          list21['includes'](PERSON_REPLACEMENT_VOICE_ASSET_DRAG_TYPE);
      if (value375 && value376) {
        if (!canDropOnAudioParam(value375)) {
          clearDropTarget();
          if (event17['dataTransfer']) event17['dataTransfer']['dropEffect'] = 'none';
          return;
        }
        event17['preventDefault']?.();
        if (event17['dataTransfer']) event17['dataTransfer']['dropEffect'] = 'copy';
        setDropTarget(value375);
        return;
      }
      value376 && (clearDropTarget(), resetDropEligibility());
      const value377 = event17['target']?.['closest']?.('[data-person-replacement-keyframe-stage]'),
        value378 = list21['includes'](PERSON_REPLACEMENT_SCENE_ASSET_DRAG_TYPE);
      if (value377 && value378) {
        event17['preventDefault']?.();
        if (event17['dataTransfer']) event17['dataTransfer']['dropEffect'] = 'copy';
        (handler111(value377), handler117());
        return;
      }
      if (value378) handler111(null);
      const value379 = event17['target']?.['closest']?.('[data-person-replacement-video-drop]'),
        enabled60 = Boolean(event17['target']?.['closest']?.('[data-person-replacement-person-drop]')),
        enabled61 = list21['includes']('Files');
      if (!enabled60 && !enabled61) return;
      (event17['preventDefault'](), floatingMenuHost['classList']['add']('is-dragging-file'));
      if (value379 && enabled61 && initialProject2['workspace']['view'] === 'home') {
        if (event17['dataTransfer']) event17['dataTransfer']['dropEffect'] = 'copy';
        el2 !== value379 &&
          (handler117(),
          (el2 = value379),
          el2['classList']?.['add']?.('is-dragover'),
          floatingMenuHost['classList']['add']('is-dragging-file'));
      } else {
        handler117();
        if (enabled61) floatingMenuHost['classList']['add']('is-dragging-file');
      }
    },
    handler118 = () => {
      ((enabled2 = ![]),
        handler113(),
        handler111(null),
        floatingMenuHost?.['querySelectorAll']?.(
          '.person-replacement-target-asset.is-story-asset-dragging',
        )?.['forEach']?.((el129) => el129['classList']?.['remove']?.('is-story-asset-dragging')));
    },
    handler119 = () => {
      (floatingMenuHost?.['classList']?.['remove']?.('is-voice-asset-dragging'),
        floatingMenuHost?.['querySelectorAll']?.(
          '.person-replacement-voice-asset-card.is-voice-asset-dragging',
        )?.['forEach']?.((el130) => el130['classList']?.['remove']?.('is-voice-asset-dragging')),
        clearDropTarget(),
        resetDropEligibility());
    },
    handler120 = () => {
      (hide(), handler118(), handler119(), handler117());
    },
    value380 = (event18) => {
      const enabled62 = event18['target']?.['closest']?.('[data-person-replacement-video-drop]');
      enabled62 && !enabled62['contains']?.(event18['relatedTarget']) && handler117();
      const value381 = event18['relatedTarget'];
      if (value381 && floatingMenuHost?.['contains']?.(value381)) return;
      (clearDropTarget(), resetDropEligibility(), handler117(), handler111(null));
    },
    value382 = (clientX5) => {
      if (promptEnhancementModel(downloadImageIntent['DROP_PROJECT_PACKAGE'], clientX5) === !![]) return;
      const el131 = clientX5['target']?.['closest']?.('[data-audio-voice-action="audio-param"]'),
        value383 = clientX5['dataTransfer']?.['getData']?.(PERSON_REPLACEMENT_VOICE_ASSET_DRAG_TYPE),
        value384 = clientX5['dataTransfer']?.['getData']?.(PERSON_REPLACEMENT_SCENE_ASSET_DRAG_TYPE),
        shotId7 = clientX5['target']?.['closest']?.('[data-person-replacement-keyframe-stage]');
      handler120();
      if (el131 && value383) {
        clientX5['stopPropagation']?.();
        if (!canDropOnAudioParam(el131)) return;
        clientX5['preventDefault']?.();
        let value385;
        try {
          value385 = JSON['parse'](value383);
        } catch {
          return;
        }
        const text33 = normalizeText(value385?.['characterId']),
          segmentId = normalizeText(el131['dataset']?.['segmentId']);
        if (!text33 || !segmentId) return;
        selectVoiceAsset(text33, { segmentId: segmentId });
        return;
      }
      if (shotId7 && value384) {
        (clientX5['stopPropagation']?.(), clientX5['preventDefault']?.());
        let sceneId3;
        try {
          sceneId3 = JSON['parse'](value384);
        } catch {
          return;
        }
        handler101({
          shotId: shotId7['dataset']['shotId'],
          sceneId: sceneId3?.['sceneId'],
          appearanceId: sceneId3?.['appearanceId'],
        });
        return;
      }
      const personBox4 = clientX5['target']?.['closest']?.('[data-person-replacement-person-drop]');
      if (personBox4) {
        const enabled63 = clientX5['dataTransfer']?.['getData']?.('application/x-person-replacement-target');
        if (!enabled63) return;
        (clientX5['stopPropagation']?.(), clientX5['preventDefault']());
        let target4;
        try {
          target4 = JSON['parse'](enabled63);
        } catch {
          return;
        }
        handler112({
          personBox: personBox4,
          target: target4,
          clientX: clientX5['clientX'],
          clientY: clientX5['clientY'],
        });
        return;
      }
      const list22 = Array['from'](clientX5['dataTransfer']?.['files'] || []);
      if (!list22['length']) return;
      (clientX5['stopPropagation']?.(), clientX5['preventDefault']());
      if (initialProject2['workspace']['view'] === 'home')
        handler17(list22['filter'](isPersonReplacementVideoFile));
      else {
        if (initialProject2['workspace']['step'] === 0x1)
          handler18(list22['filter'](isPersonReplacementImageFile));
      }
    };
  let workspaceMarqueeSelectionController = null;
  const run13 = (value386) =>
      value386?.['ctrlKey'] === !![] || value386?.['getModifierState']?.('Control') === !![] || enabled3,
    value387 = (event19) => {
      ((value49 = null), event19['stopPropagation'](), hide());
      !event19['target']?.['closest']?.('[data-person-replacement-mapping-scope-menu]') && handler88();
      const el132 = event19['target']?.['closest']?.('[data-person-replacement-person-drop]');
      el132 && floatingMenuHost['contains'](el132) && bringBoxToFront(el132);
      if (
        event19['target']?.['closest']?.(
          '[data-person-replacement-result-history-toggle], [data-person-replacement-result-history-close]',
        )
      )
        return;
      if (handler114(event19)) return;
      const value388 = event19['target']?.['closest']?.('[data-story-marquee-surface="people"]'),
        enabled64 = event19['target']?.['closest']?.(
          '.person-replacement-detection-label, .person-replacement-mapping-badge, [data-person-replacement-action], [data-person-replacement-manual-resize]',
        );
      if (
        run13(event19) &&
        value388 &&
        floatingMenuHost['contains'](value388) &&
        !enabled64 &&
        workspaceMarqueeSelectionController?.['begin']?.(event19)
      )
        return;
      const enabled65 = Boolean(el132?.['classList']?.['contains']?.('is-batch-selected'));
      if (enabled65 && !enabled64 && beginBoxEdit(event19, el132, { batch: !![] })) return;
      !run13(event19) && (!el132 || !enabled65) && clearBatchSelection();
      const value389 = el132?.['matches']?.('.person-replacement-detection-box[data-person-id]')
        ? el132
        : null;
      value389 && floatingMenuHost['contains'](value389)
        ? selectBox(value389, {
            focus: !event19['target']?.['closest']?.(
              '.person-replacement-detection-label, .person-replacement-mapping-badge, [data-person-replacement-action]',
            ),
          })
        : clearKeyboardSelection();
      if (
        value389 &&
        floatingMenuHost['contains'](value389) &&
        !event19['target']?.['closest']?.(
          '.person-replacement-detection-label,\x20.person-replacement-mapping-badge,\x20[data-person-replacement-action]',
        ) &&
        beginBoxEdit(event19, value389)
      )
        return;
      if (isManualSelectionActive()) {
        const value390 = event19['target']?.['closest']?.('[data-person-replacement-keyframe-stage]');
        if (
          value390 &&
          floatingMenuHost['contains'](value390) &&
          !run13(event19) &&
          !event19['target']?.['closest']?.('[data-person-replacement-person-drop]') &&
          !event19['target']?.['closest']?.('[data-person-replacement-action], [data-story-action]')
        ) {
          if (beginManualSelection(event19, value390)) return;
        }
      }
      const value391 = event19['target']?.['closest']?.('[data-person-replacement-layout-splitter]');
      if (value391 && begin(event19, value391)) return;
      const splitter = event19['target']?.['closest']?.(
        '[data-person-replacement-composite-sidebar-splitter]',
      );
      if (splitter) {
        const layout = splitter['closest']?.('.person-replacement-preview-workbench');
        splitter['classList']?.['add']?.('is-active');
        const beginWorkspaceHorizontalResizeSession2 = beginWorkspaceHorizontalResizeSession({
          event: event19,
          splitter: splitter,
          layout: layout,
          windowObject: windowObject,
          body: documentObject['body'],
          resizingClass: 'person-replacement-composite-sidebar-resizing',
          onRatio: (value392) => {
            const value393 = Number(layout?.['getBoundingClientRect']?.()?.['width']),
              value394 = Number['isFinite'](value393)
                ? (value393 * value392) / 0x64
                : initialProject2['workspace']['compositeSidebarWidth'];
            initialProject2['workspace']['compositeSidebarWidth'] =
              applyPersonReplacementCompositeSidebarWidthToLayout(layout, splitter, value394);
          },
          onFinish: () => {
            (splitter['classList']?.['remove']?.('is-active'), handler21('composite-sidebar-width'));
          },
        });
        if (!beginWorkspaceHorizontalResizeSession2) splitter['classList']?.['remove']?.('is-active');
        if (beginWorkspaceHorizontalResizeSession2) return;
      }
      const splitter2 = event19['target']?.['closest']?.('[data-person-replacement-voice-layout-splitter]');
      if (splitter2) {
        const layout2 = splitter2['closest']?.('[data-person-replacement-voice-layout]'),
          text34 = normalizeText(splitter2['dataset']?.['personReplacementVoiceLayoutSplitter']),
          value395 = ['assets', 'sources']['includes'](text34);
        if (value395) splitter2['classList']?.['add']?.('is-active');
        const enabled66 =
          value395 &&
          beginWorkspaceHorizontalResizeSession({
            event: event19,
            splitter: splitter2,
            layout: layout2,
            windowObject: windowObject,
            body: documentObject['body'],
            resizingClass: 'person-replacement-voice-layout-resizing',
            onRatio: (value396) => {
              const args32 = normalizePersonReplacementVoiceLayout(
                  initialProject2['workspace']['voiceLayout'],
                ),
                personReplacementVoiceLayout = normalizePersonReplacementVoiceLayout({
                  ...args32,
                  ...(text34 === 'assets'
                    ? {
                        assetsEnd: clamp(value396, 0x10, args32['sourcesEnd'] - 0x10, args32['assetsEnd']),
                      }
                    : {
                        sourcesEnd: clamp(value396, args32['assetsEnd'] + 0x10, 0x3c, args32['sourcesEnd']),
                      }),
                });
              initialProject2['workspace']['voiceLayout'] = applyPersonReplacementVoiceLayoutToElement(
                layout2,
                personReplacementVoiceLayout,
              );
            },
            onFinish: () => {
              (splitter2['classList']?.['remove']?.('is-active'), handler21('voice-layout'));
            },
          });
        if (!enabled66) splitter2['classList']?.['remove']?.('is-active');
        if (enabled66) return;
      }
      const value397 = event19['target']?.['closest']?.('[data-person-replacement-cut-boundary-index]');
      if (value397 && beginBoundaryDrag(event19, value397)) return;
      const splitter3 = event19['target']?.['closest']?.('[data-story-assets-splitter]');
      if (splitter3) {
        const layout3 = splitter3['closest']?.('.story-assets-layout');
        beginWorkspaceHorizontalResizeSession({
          event: event19,
          splitter: splitter3,
          layout: layout3,
          windowObject: windowObject,
          body: documentObject['body'],
          resizingClass: 'story-assets-resizing',
          onRatio: (value398) => {
            initialProject2['workspace']['assetSplitRatio'] = applyWorkspaceAssetSplitRatioToLayout(
              layout3,
              splitter3,
              value398,
            );
          },
          onFinish: () => handler21('asset-split-ratio'),
        });
        return;
      }
      if (event19['target']) workspaceMarqueeSelectionController?.['begin']?.(event19);
    },
    value399 = (value400) => {
      if (handler115(value400)) return;
      (syncHoverPlayhead(value400), handlePointerMove(value400));
    },
    value401 = (value402) => {
      (personReplacementExportSubmenuController['handlePointerOver'](value402), handlePointerOver(value402));
    },
    value403 = (value404) => {
      handler116(value404);
    },
    value405 = (value406) => {
      handler116(value406, { cancelled: !![] });
    },
    value407 = (value408) => {
      (personReplacementExportSubmenuController['handlePointerOut'](value408),
        hideHoverPlayhead(value408),
        handlePointerOut(value408));
    },
    handler121 = () => {
      restoreBufferedVideo();
      const el133 = floatingMenuHost?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!el133 || !selectedIds['isOpen']) return;
      ((el133['preload'] = 'auto'), (el133['muted'] = !selectedIds['soundEnabled']));
      if (selectedIds['boundPreviewVideos']['has'](el133)) {
        if (el133['paused'] === ![]) cutEditorPlaybackController['startNative'](el133);
        return;
      }
      (selectedIds['boundPreviewVideos']['add'](el133),
        el133['addEventListener']?.('playing', () => cutEditorPlaybackController['startNative'](el133)),
        el133['addEventListener']?.('pause', () => {
          (stopPlayback(), syncPlaybackFromVideo(el133));
        }),
        el133['addEventListener']?.('seeked', () => {
          const enabled67 = selectedIds['pendingPreviewSeek'];
          if (!enabled67) {
            syncPlaybackFromVideo(el133);
            return;
          }
          const value409 = Number(enabled67['token']);
          enabled67['seeked'] = !![];
          if (typeof el133['requestVideoFrameCallback'] !== 'function')
            enabled67['presentedSourceSec'] = Number(el133['currentTime']);
          else
            !Number['isFinite'](Number(enabled67['presentedSourceSec'])) &&
              selectedIds['previewFrameCallbackId'] == null &&
              armFrameWait(el133, enabled67, value409);
          (markFrameReady(el133, enabled67, value409), syncPlaybackFromVideo(el133));
        }),
        el133['addEventListener']?.('timeupdate', () => {
          if (!el133['paused']) cutEditorPlaybackController['startNative'](el133);
          else syncPlaybackFromVideo(el133);
        }),
        el133['addEventListener']?.('ended', () => {
          (stopPlayback(), syncPlaybackFromVideo(el133));
        }),
        el133['addEventListener']?.('error', () => {
          (cancelFrameWait(),
            (selectedIds['pendingPreviewSeek'] = null),
            windowObject?.['showToast']?.('裁剪预览视频加载失败，请稍后重试。', 'warn'));
        }));
      if (el133['paused'] === ![]) cutEditorPlaybackController['startNative'](el133);
    },
    resolveItems = (event20) => {
      const value410 = initialProject2['id'],
        handler122 = (storyProjectId, value411) =>
          handler99({ dataset: { storyProjectId: storyProjectId } }, value411);
      return resolvePersonReplacementContextMenuItems({
        event: event20,
        root: floatingMenuHost,
        projects: initialProject2['libraryProjects'],
        project: initialProject2,
        commands: {
          addLibraryAssets: (value412, value413) => {
            if (
              initialProject2['id'] !== value410 ||
              initialProject2['workspace']['characterAssetTab'] !== 'library'
            )
              return;
            handler105(value412, value413);
          },
          bindAudioCharacter: (value414, characterId10) => {
            if (initialProject2['id'] !== value410) return;
            const args33 = [
              ...(initialProject2['audioAssets'] || []),
              ...(initialProject2['libraryAssets'] || []),
            ]['find']((value415) => value415['id'] === value414);
            if (args33)
              runIntent(downloadImageIntent['SELECT_CHARACTER_VOICE_LIBRARY'], {
                characterId: characterId10,
                asset: { ...args33 },
              });
          },
          openProject: (value416) => runIntent(downloadImageIntent['OPEN_PROJECT'], value416),
          renameProject: (value417) => handler122(value417, 'rename-project'),
          duplicateProject: (value418) => handler122(value418, 'duplicate-project'),
          collectProject: (value419) => handler122(value419, 'collect-project'),
          setProjectArchived: (value420, value421) =>
            handler122(value420, value421 ? 'archive-project' : 'unarchive-project'),
          requestDeleteProject: (value422) => handler122(value422, 'request-delete-project'),
        },
      });
    },
    handler123 = (el134) => {
      ((floatingMenuHost = documentObject['createElement']('section')),
        (floatingMenuHost['className'] = 'person-replacement-workspace replacement-studio-workspace'),
        (floatingMenuHost['dataset']['personReplacementWorkspace'] = ''),
        (floatingMenuHost['dataset']['replacementStudioWorkspace'] = ''),
        (floatingMenuHost['dataset']['uiStop'] = '1'),
        floatingMenuHost['setAttribute']('aria-label', REPLACEMENT_STUDIO_NAME),
        (floatingMenuHost['innerHTML'] = renderHiddenInputs()),
        el134['appendChild'](floatingMenuHost),
        floatingMenuHost['addEventListener']('click', value308),
        floatingMenuHost['addEventListener']('input', handler106),
        floatingMenuHost['addEventListener']('change', value339),
        floatingMenuHost['addEventListener'](
          'focusin',
          personReplacementExportSubmenuController['handleFocusIn'],
        ),
        floatingMenuHost['addEventListener']('focusout', value344),
        floatingMenuHost['addEventListener']('dragstart', value347),
        floatingMenuHost['addEventListener']('dragend', handler120),
        floatingMenuHost['addEventListener']('dragover', value374),
        floatingMenuHost['addEventListener']('dragleave', value380),
        floatingMenuHost['addEventListener']('drop', value382),
        bindWorkspaceEntityContextMenu2?.(),
        (bindWorkspaceEntityContextMenu2 = bindWorkspaceEntityContextMenu(floatingMenuHost, {
          resolveItems: resolveItems,
          beforeOpen() {
            if (!initialProject2['workspace']['openProjectMenuId']) return;
            handler92({ openProjectMenuId: '' });
          },
        })),
        floatingMenuHost['addEventListener']('error', handleWorkspaceAssetLibraryImageError, !![]),
        floatingMenuHost['addEventListener']('pointerdown', value387),
        floatingMenuHost['addEventListener']('pointerup', value403),
        floatingMenuHost['addEventListener']('pointercancel', value405),
        floatingMenuHost['addEventListener']('pointerover', value401),
        floatingMenuHost['addEventListener']('pointermove', value399),
        floatingMenuHost['addEventListener']('pointerout', value407),
        floatingMenuHost['addEventListener']('dblclick', value269));
      const run14 = (event21) => {
        const el135 = event21['target']?.['closest']?.('.person-replacement-production-page');
        if (!el135 || !floatingMenuHost['contains'](el135)) return ![];
        const value423 =
          el135['ownerDocument']?.['defaultView']?.['getComputedStyle']?.(el135)?.['overflowY'];
        if (!['auto', 'scroll', 'overlay']['includes'](value423)) return ![];
        const count8 = Number(event21['deltaY']) || 0x0,
          value424 = Math['max'](0x0, el135['scrollHeight'] - el135['clientHeight']);
        if (count8 < 0x0) return el135['scrollTop'] > 0x0;
        if (count8 > 0x0) return el135['scrollTop'] < value424;
        return ![];
      };
      (floatingMenuHost['addEventListener'](
        'wheel',
        (event22) => {
          if (run14(event22)) {
            event22['stopPropagation']();
            return;
          }
          if (handler85(event22)) {
            event22['stopPropagation']();
            return;
          }
          if (handler84(event22)) {
            event22['stopPropagation']();
            return;
          }
          if (handler87(event22)) return;
          if (handler86(event22)) {
            event22['stopPropagation']();
            return;
          }
          if (handler78(event22)) {
            event22['stopPropagation']();
            return;
          }
          if (handler81(event22)) {
            event22['stopPropagation']();
            return;
          }
          if (
            shouldPreserveWorkspaceNestedWheel(event22['target'], {
              nestedSelector:
                'textarea, [contenteditable="true"], .node-model-submenu, .story-style-grid, .story-assets-list, .story-episode-assets, .story-clip-strip',
              boundaryRoot: floatingMenuHost,
            })
          ) {
            event22['stopPropagation']();
            return;
          }
          event22['stopPropagation']();
          if (handler83(event22) || handler80(event22)) return;
          handler82(event22);
        },
        { passive: ![] },
      ),
        floatingMenuHost['addEventListener']('keydown', value257, !![]),
        windowObject?.['addEventListener']?.('keydown', handler72, !![]),
        windowObject?.['addEventListener']?.('resize', value171));
      const value425 = (event23) => {
          (event23?.['key'] === 'Control' ||
            event23?.['code'] === 'ControlLeft' ||
            event23?.['code'] === 'ControlRight') &&
            (enabled3 = event23['type'] === 'keydown');
        },
        handler124 = () => {
          ((enabled3 = ![]), handler118());
        };
      return (
        windowObject?.['addEventListener']?.('keydown', value425, !![]),
        windowObject?.['addEventListener']?.('keyup', value425, !![]),
        windowObject?.['addEventListener']?.('blur', handler124, !![]),
        (value65 = () => {
          (windowObject?.['removeEventListener']?.('keydown', value425, !![]),
            windowObject?.['removeEventListener']?.('keyup', value425, !![]),
            windowObject?.['removeEventListener']?.('blur', handler124, !![]),
            handler124());
        }),
        (workspaceMarqueeSelectionController = createWorkspaceMarqueeSelectionController({
          root: floatingMenuHost,
          documentObject: documentObject,
          windowObject: windowObject,
          surfaceSelector: '[data-story-marquee-surface]',
          blockedControlSelector:
            "[data-story-action], [data-person-replacement-action], input, textarea, select, a, [contenteditable='true']",
          overlayClassName: 'story-marquee-selection',
          itemSelector: '[data-story-marquee-item]',
          getItemId: (el136) => el136['dataset']?.['storyMarqueeId'],
          getConfig: (enabled68) => {
            if (
              enabled68?.['dataset']?.['storyMarqueeSurface'] === 'shot-cuts' &&
              initialProject2['workspace']['view'] === 'project' &&
              initialProject2['workspace']['step'] === 0x2 &&
              selectedIds['isOpen']
            )
              return {
                enabled: !isDraftMutationBusy(),
                selectedIds: selectedIds['selectedShotIds'],
                itemSelector: '[data-person-replacement-shot-cut-selectable]',
                getItemId: (el137) => el137['dataset']?.['shotId'],
                hitClassName: 'is-marquee-hit',
                rootClassName: 'is-shot-cut-marquee-selecting',
                commit: (value426) => {
                  (session['setSelectedShotIds'](value426), run());
                },
              };
            if (
              enabled68?.['dataset']?.['storyMarqueeSurface'] === 'people' &&
              initialProject2['workspace']['view'] === 'project' &&
              initialProject2['workspace']['step'] === 0x2 &&
              !selectedIds['isOpen']
            )
              return {
                enabled: !![],
                canBegin: (value427) => run13(value427),
                additive: ![],
                selectedIds: [],
                itemSelector: '[data-person-replacement-person-drop]',
                hitClassName: 'is-batch-selection-hit',
                overlayClassName: 'is-person-box-selection',
                rootClassName: 'is-person-box-marquee-selecting',
                getItemId: (el138) => el138['dataset']?.['personId'],
                commit: (value428) => {
                  (selectBatch(enabled68['dataset']?.['shotId'], value428), focusBatchSelectionStage());
                },
              };
            if (
              enabled68?.['dataset']?.['storyMarqueeSurface'] === 'shots' &&
              initialProject2['workspace']['view'] === 'project' &&
              [0x2, 0x3, 0x5]['includes'](initialProject2['workspace']['step']) &&
              !selectedIds['isOpen']
            )
              return {
                enabled: !![],
                selectedIds: initialProject2['workspace']['selectedShotIds'],
                commit: (selectedShotIds2) => {
                  updateProject(
                    {
                      ...initialProject2,
                      workspace: {
                        ...initialProject2['workspace'],
                        shotSelectionMode: !![],
                        selectedShotIds: selectedShotIds2,
                      },
                    },
                    'shot-marquee',
                  );
                },
              };
            return {
              enabled:
                enabled68?.['dataset']?.['storyMarqueeSurface'] === 'assets' &&
                initialProject2['workspace']['view'] === 'project' &&
                initialProject2['workspace']['step'] === 0x1 &&
                ['character', 'scene', 'audio', 'library']['includes'](
                  initialProject2['workspace']['characterAssetTab'],
                ),
              selectedIds: initialProject2['workspace']['selectedAssetIds'],
              commit: (list23) => {
                const map6 = new Set(
                    getPersonReplacementSelectableAssets(
                      initialProject2,
                      initialProject2['workspace']['characterAssetTab'],
                    )['map']((value429) => value429['id']),
                  ),
                  assetSelectionMode5 = list23['filter']((value430) => map6['has'](value430));
                (updateProject(
                  {
                    ...initialProject2,
                    workspace: {
                      ...initialProject2['workspace'],
                      assetSelectionMode: assetSelectionMode5['length'] > 0x0,
                      selectedAssetIds: assetSelectionMode5,
                      ...(assetSelectionMode5['length']
                        ? {
                            [{
                              character: 'selectedCharacterId',
                              scene: 'selectedSceneId',
                              audio: 'selectedAudioAssetId',
                              library: 'selectedLibraryAssetId',
                            }[initialProject2['workspace']['characterAssetTab']]]:
                              assetSelectionMode5['at'](-0x1),
                          }
                        : {}),
                    },
                  },
                  'asset-marquee',
                ),
                  focusWorkspaceAssetCard(floatingMenuHost, assetSelectionMode5['at'](-0x1)));
              },
            };
          },
        })),
        floatingMenuHost
      );
    },
    personReplacementPageTransitionController = createPersonReplacementPageTransitionController({
      getRoot: () => floatingMenuHost,
      getTransitionKey: () => handler25(initialProject2),
      isCutEditorOpen: () => selectedIds['isOpen'],
      isDestroyed: () => value43,
      requestRender: () => run(),
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    {
      captureFocus: captureFocus2,
      deferRenderIfSettling: deferRenderIfSettling,
      destroy: destroy5,
      restoreFocus: restoreFocus2,
      start: start,
      stop: stop2,
      syncProjectToolbarInPlace: syncProjectToolbarInPlace,
    } = personReplacementPageTransitionController,
    handler125 = run;
  run = () => {
    if (!floatingMenuHost || value43 || !workspacePresentationLifecycle['isActive']()) return;
    if (personReplacementShellPresentation['syncHome'](floatingMenuHost, initialProject2)) {
      workspacePersistencePresentation['update'](initialProject2['persistenceState']);
      return;
    }
    const value431 = value67,
      value432 = value68,
      value433 = handler26(initialProject2),
      value434 =
        value431 === 'none' && value69 === value433
          ? captureWorkspaceNestedScrollPositions(
              floatingMenuHost,
              PERSON_REPLACEMENT_PERSISTENT_NESTED_SCROLL_SELECTORS,
            )
          : null;
    ((value67 = 'none'), (value68 = 'page'));
    if (deferRenderIfSettling(value431)) return;
    const focusKey = captureFocus2();
    (preserveBufferedVideo(), stop2({ renderPending: ![] }));
    const value435 = floatingMenuHost['querySelector']?.('.person-replacement-project-body'),
      el139 = ['forward', 'backward']['includes'](value431) ? value435?.['firstElementChild'] || null : null,
      currentToolbar = el139 ? floatingMenuHost['querySelector']?.('.story-workspace-toolbar') : null;
    (el139?.['remove']?.(), currentToolbar?.['remove']?.());
    const value436 =
      initialProject2['workspace']['view'] === 'project' &&
      initialProject2['workspace']['step'] === 0x2 &&
      !selectedIds['isOpen'];
    (setManualSelectionActive(value436),
      handler125(),
      workspacePersistencePresentation['update'](initialProject2['persistenceState']),
      restoreWorkspaceNestedScrollPositions(floatingMenuHost, value434),
      (value69 = value433),
      handler58());
    const value437 = floatingMenuHost['querySelector']?.('.person-replacement-project-body'),
      incomingPage = value437?.['firstElementChild'] || null,
      nextToolbar = currentToolbar ? floatingMenuHost['querySelector']?.('.story-workspace-toolbar') : null;
    if (currentToolbar && nextToolbar) nextToolbar['replaceWith']?.(currentToolbar);
    const enabled69 = start(el139, incomingPage, value431, value432, {
      currentToolbar: currentToolbar,
      nextToolbar: nextToolbar,
      focusKey: focusKey,
    });
    (!enabled69 && syncProjectToolbarInPlace(currentToolbar, nextToolbar),
      restoreFocus2(focusKey, { currentToolbar: currentToolbar, incomingPage: incomingPage }),
      syncAfterRender(),
      typeof floatingMenuHost['insertAdjacentHTML'] === 'function'
        ? floatingMenuHost['insertAdjacentHTML']('beforeend', renderHiddenInputs())
        : (floatingMenuHost['innerHTML'] += renderHiddenInputs()),
      handler50(),
      handler121(),
      preparePreviewVideo(),
      watchOpeningVideo());
  };
  const value93 = Object['freeze']({
    open(options5 = {}) {
      if (value43) return null;
      options5['project'] &&
        (reset(),
        (initialProject2 = normalizePersonReplacementWorkspaceProject(options5['project'])),
        session['syncProject'](initialProject2),
        personReplacementCompositePreviewController['switchProject'](initialProject2['id']));
      ((initialProject2 = handler19(initialProject2)), (value44 = options5['mountTarget'] || value44));
      const el140 = resolveMountTarget(documentObject, value44);
      if (!el140) return null;
      if (!floatingMenuHost) handler123(el140);
      else {
        if (floatingMenuHost['parentElement'] !== el140) el140['appendChild'](floatingMenuHost);
      }
      return (workspacePresentationLifecycle['activate'](), run(), floatingMenuHost);
    },
    close() {
      if (!floatingMenuHost || value43) return ![];
      (stop(),
        cancelManualSelection(),
        workspaceMarqueeSelectionController?.['cancel']?.(),
        clearBatchSelection());
      let enabled70 = !![];
      try {
        enabled70 =
          promptEnhancementModel(downloadImageIntent['CAN_CLOSE'], cloneJson(initialProject2)) !== ![];
      } catch {
        enabled70 = !![];
      }
      if (!enabled70) return (handler24('close'), ![]);
      return (
        closeDebugRequestWindow(documentObject),
        reset(),
        releaseBufferedVideo(),
        handler3(),
        handler7(),
        handler8(),
        handler4(),
        handler10(),
        workspacePresentationLifecycle['deactivate'](),
        stopPreview(),
        (voiceLibraryTargetCharacterId = ''),
        unmount(),
        promptEnhancementModel(downloadImageIntent['CLOSE'], { project: cloneJson(initialProject2) }),
        !![]
      );
    },
    setProject(value438) {
      if (value43) return null;
      const value439 = initialProject2,
        value440 = handler19(normalizePersonReplacementWorkspaceProject(value438)),
        text35 = normalizeText(value440['id']);
      text35 !== normalizeText(value439['id']) &&
        (closeDebugRequestWindow(documentObject),
        handler4(),
        personReplacementCompositePreviewController['switchProject'](text35));
      initialProject2 = value440;
      voiceLibraryTargetCharacterId &&
        !initialProject2['characters']['some'](
          (value441) => value441['id'] === voiceLibraryTargetCharacterId,
        ) &&
        (voiceLibraryTargetCharacterId = '');
      const value442 = session['syncProject'](initialProject2);
      handler27(value439, initialProject2);
      const map7 = new Set(initialProject2['shots']['map']((value443) => value443['id']));
      return (
        (value442 ||
          ((selectedIds['isOpen'] || selectedIds['isOpening']) &&
            (initialProject2['workspace']['view'] !== 'project' ||
              initialProject2['workspace']['step'] !== 0x2 ||
              selectedIds['draft']['some']((value444) => !map7['has'](value444['shotId']))))) &&
          reset(),
        run(),
        cloneJson(initialProject2)
      );
    },
    syncProjectState(value445, { returnSnapshot: returnSnapshot = !![] } = {}) {
      if (value43) return null;
      const value446 = initialProject2,
        personReplacementWorkspaceProject3 = normalizePersonReplacementWorkspaceProject(value445);
      if (
        !Object['hasOwn'](value445, 'libraryProjects') &&
        personReplacementWorkspaceProject3['id'] === value446['id']
      )
        personReplacementWorkspaceProject3['libraryProjects'] = value446['libraryProjects'];
      const value447 = Boolean(
          floatingMenuHost &&
          normalizeText(personReplacementWorkspaceProject3['id']) === normalizeText(initialProject2['id']) &&
          personReplacementWorkspaceProject3['workspace']?.['view'] === 'project' &&
          personReplacementWorkspaceProject3['workspace']?.['step'] === 0x3 &&
          initialProject2['workspace']?.['view'] === 'project' &&
          initialProject2['workspace']?.['step'] === 0x3,
        ),
        value448 = value447
          ? resolvePersonReplacementVideoGenerationUiRefreshScope(
              value446,
              personReplacementWorkspaceProject3,
            )
          : '',
        value449 = Boolean(
          floatingMenuHost &&
          normalizeText(personReplacementWorkspaceProject3['id']) === normalizeText(initialProject2['id']) &&
          personReplacementWorkspaceProject3['workspace']?.['view'] === 'project' &&
          personReplacementWorkspaceProject3['workspace']?.['step'] === 0x2 &&
          initialProject2['workspace']?.['view'] === 'project' &&
          initialProject2['workspace']?.['step'] === 0x2,
        ),
        value450 = value449
          ? resolvePersonReplacementImageGenerationUiRefreshScope(
              value446,
              personReplacementWorkspaceProject3,
            )
          : '';
      normalizeText(personReplacementWorkspaceProject3['id']) !== normalizeText(initialProject2['id']) &&
        (handler4(),
        personReplacementCompositePreviewController['switchProject'](
          personReplacementWorkspaceProject3['id'],
        ));
      initialProject2 = personReplacementWorkspaceProject3;
      if (session['syncProject'](initialProject2)) reset();
      if (!workspacePresentationLifecycle['isActive']())
        return returnSnapshot ? cloneJson(initialProject2) : null;
      if (value450 === 'selected-shot') handler43({ refreshTimelineCard: !![] });
      else {
        if (value450 === 'timeline') handler53();
        else {
          if (value448 === 'selected-shot') {
            if (!handler42() && !personReplacementVideoPlaybackController['isClipActive']()) run();
          } else value448 === 'timeline' && handler53();
        }
      }
      return (
        syncPersonReplacementPromptModeControl(
          floatingMenuHost,
          initialProject2,
          getShotRenderState()['generatingShotIds'],
        ),
        personReplacementShellPresentation['syncStatus'](floatingMenuHost, initialProject2),
        preparePreviewVideo(),
        watchOpeningVideo(),
        ctx?.['refresh'](),
        returnSnapshot ? cloneJson(initialProject2) : null
      );
    },
    setPersistenceState(value451) {
      if (value43) return null;
      return (
        (initialProject2 = {
          ...initialProject2,
          persistenceState: normalizePersonReplacementPersistenceState(value451),
        }),
        workspacePersistencePresentation['update'](initialProject2['persistenceState']),
        cloneJson(initialProject2['persistenceState'])
      );
    },
    setOutputCanvasSyncState(options6 = {}) {
      if (value43) return null;
      const enabled71 = canvasSyncPending;
      ((canvasSyncPending = options6?.['pending'] === !![]),
        (canvasSyncScope = canvasSyncPending ? normalizeText(options6?.['scope']) : ''),
        handler15());
      const value452 = floatingMenuHost?.['querySelector']?.('.person-replacement-toolbar-actions'),
        value453 = handler59(
          personReplacementShellPresentation['renderToolbarActions'](initialProject2, handler22()),
        );
      return (
        value452 &&
          value453 &&
          typeof value452['replaceWith'] === 'function' &&
          value452['replaceWith'](value453),
        handler63({ captureFocus: canvasSyncPending && !enabled71 }),
        { pending: canvasSyncPending, scope: canvasSyncScope }
      );
    },
    setComposeOutputState(options7 = {}) {
      if (value43) return null;
      const value454 = composeOutputPending2;
      composeOutputPending2 = options7?.['pending'] === !![];
      const value455 = floatingMenuHost?.['querySelector']?.(
          '[data-person-replacement-action=\x22compose-output\x22]',
        ),
        value456 = handler59(renderCompositeComposeAction(initialProject2, handler22()));
      return (
        value455 &&
          value456 &&
          typeof value455['replaceWith'] === 'function' &&
          value455['replaceWith'](value456),
        handler60(),
        value454 && !composeOutputPending2 && handler5({ composeOnly: !![] }),
        { pending: composeOutputPending2 }
      );
    },
    setExportOutputState(options8 = {}) {
      if (value43) return null;
      ((exportOutputPending = options8?.['pending'] === !![]), handler15());
      const value457 = floatingMenuHost?.['querySelector']?.('.person-replacement-toolbar-actions'),
        value458 = handler59(
          personReplacementShellPresentation['renderToolbarActions'](initialProject2, handler22()),
        );
      return (
        value457 &&
          value458 &&
          typeof value457['replaceWith'] === 'function' &&
          value457['replaceWith'](value458),
        { pending: exportOutputPending }
      );
    },
    prewarmCompositeOriginalVideo(value459 = '') {
      if (value43) return ![];
      return handler6(value459);
    },
    getProject() {
      return cloneJson(initialProject2);
    },
    refreshVoiceSources(options9 = {}) {
      return refreshSourceCards(options9);
    },
    destroy() {
      if (value43) return;
      (destroy4(),
        stop(),
        destroy2(),
        reset(),
        session['dispose'](),
        releaseBufferedVideo(),
        handler3(),
        handler4(),
        personReplacementCompositePreviewController['dispose'](),
        destroy5(),
        handler88(),
        handler120(),
        destroy3(),
        handler62({ restoreFocus: ![] }),
        workspacePresentationLifecycle['dispose'](),
        workspacePersistencePresentation['destroy'](),
        (value43 = !![]),
        list3['forEach']((value460) => value460?.['destroy']?.()),
        ctx?.['destroy']?.(),
        (ctx = null),
        value47?.(),
        (value47 = null),
        value50?.(),
        (value50 = null),
        typeof floatingMenuHost?.['removeEventListener'] === 'function' &&
          floatingMenuHost['removeEventListener']('error', handleWorkspaceAssetLibraryImageError, !![]),
        bindWorkspaceEntityContextMenu2?.(),
        (bindWorkspaceEntityContextMenu2 = null),
        value65?.(),
        (value65 = null),
        windowObject?.['removeEventListener']?.('keydown', handler72, !![]),
        windowObject?.['removeEventListener']?.('resize', value171),
        workspaceMarqueeSelectionController?.['destroy']?.(),
        personReplacementAssetHoverPreviewController['destroy'](),
        floatingMenuHost?.['remove']?.(),
        (floatingMenuHost = null));
    },
  });
  return value93;
}
