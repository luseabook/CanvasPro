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
function escapeHtml(_0x567846) {
  return String(_0x567846 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#039;');
}
function normalizeText(_0x12ca66, _0x38dcaa = '') {
  const _0x17127f = String(_0x12ca66 ?? '')['trim']();
  return _0x17127f || _0x38dcaa;
}
function cloneJson(_0x3764ce) {
  return _0x3764ce && typeof _0x3764ce === 'object' ? JSON['parse'](JSON['stringify'](_0x3764ce)) : _0x3764ce;
}
function clamp(_0x1d45b9, _0x4b7723, _0x5acc7f, _0x36343e = _0x4b7723) {
  const _0x2f90e9 = Number(_0x1d45b9);
  return Number['isFinite'](_0x2f90e9)
    ? Math['min'](_0x5acc7f, Math['max'](_0x4b7723, _0x2f90e9))
    : _0x36343e;
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
function formatPersonOrientation(_0x518f7b) {
  return (
    PERSON_REPLACEMENT_ORIENTATION_LABELS[normalizeText(_0x518f7b)] ||
    PERSON_REPLACEMENT_ORIENTATION_LABELS['unknown']
  );
}
function getPersonOrientationOptions() {
  const _0x29c150 = PERSON_REPLACEMENT_ORIENTATIONS['filter']((_0x13ca84) => _0x13ca84 !== 'unknown');
  return _0x29c150['map']((_0x119f5f) => ({ value: _0x119f5f, label: formatPersonOrientation(_0x119f5f) }));
}
function getPersonReplacementScopeOptions() {
  return PERSON_REPLACEMENT_SCOPES['map']((_0x5d5e92) => ({
    value: _0x5d5e92,
    label: formatPersonReplacementScopeLabel(_0x5d5e92),
  }));
}
function normalizeMediaUrl(_0xba8946) {
  const _0x1ff03c = normalizeText(_0xba8946);
  if (!_0x1ff03c) return '';
  return localPathToUrl(_0x1ff03c) || _0x1ff03c;
}
function getCharacterAppearance(_0x511449, _0xc29b15 = '') {
  const _0x42d240 = getWorkspaceAssetAppearances(_0x511449);
  return (
    _0x42d240['find']((_0xfdb0e0) => _0xfdb0e0['id'] === _0xc29b15) ||
    getWorkspaceAssetBaseAppearance(_0x511449) ||
    _0x42d240[0x0] ||
    null
  );
}
function getCharacterVoiceUrl(_0xaebda = {}) {
  return normalizeMediaUrl(
    _0xaebda['voiceReference']?.['audioUrl'] ||
      _0xaebda['voiceReference']?.['localPath'] ||
      _0xaebda['voiceRef'],
  );
}
function formatClock(_0x17fb17) {
  const _0x21e7ad = Math['max'](0x0, Number(_0x17fb17) || 0x0),
    _0xd68d71 = Math['floor'](_0x21e7ad / 0x3c),
    _0x1748ce = Math['floor'](_0x21e7ad % 0x3c);
  return String(_0xd68d71)['padStart'](0x2, '0') + ':' + String(_0x1748ce)['padStart'](0x2, '0');
}
function renderIcon(_0x4a8933) {
  const _0x3e5711 = {
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
    (_0x3e5711[_0x4a8933] || '') +
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
    resolveVoiceReferenceCount: (_0x16f35c) =>
      getPersonReplacementVoiceCloneCharacters(_0x16f35c)['filter']((_0x143fb6) =>
        getCharacterVoiceUrl(_0x143fb6),
      )['length'],
  }),
  personReplacementImagePresentation = createPersonReplacementImagePresentation({
    buildIdentityView: (_0x4c49a3, _0x495bb4, _0x25c09b) =>
      personReplacementIdentityPresentation['buildImage'](_0x4c49a3, _0x495bb4, _0x25c09b),
    renderShotTimeline: (_0x5d9bd0, _0x24094f) =>
      personReplacementShotTimelinePresentation['renderStage'](_0x5d9bd0, _0x24094f),
    renderLayoutSplitter: renderPersonReplacementLayoutSplitter,
    renderFooter: (_0x4c034c, _0x3a0eba) =>
      personReplacementShellPresentation['renderStepFooter'](_0x4c034c, _0x3a0eba),
    renderSmartDetectTrigger: personReplacementSmartDetectPresentation['renderTrigger'],
  }),
  personReplacementVideoPresentation = createPersonReplacementVideoPresentation({
    buildIdentityView: (_0x185ce4, _0x555054) =>
      personReplacementIdentityPresentation['buildVideo'](_0x185ce4, _0x555054),
    renderShotTimeline: (_0x270678, _0x73e295) =>
      personReplacementShotTimelinePresentation['renderStage'](_0x270678, _0x73e295),
    renderLayoutSplitter: renderPersonReplacementLayoutSplitter,
    renderFooter: (_0x2ac36f, _0x468d35) =>
      personReplacementShellPresentation['renderStepFooter'](_0x2ac36f, _0x468d35),
  });
function renderCompositeComposeAction(_0x5007be, _0x4371d9 = {}) {
  const _0x28b9e1 = _0x5007be['shots']['some']((_0x4cdb56) => normalizeText(_0x4cdb56['resultVideoRef'])),
    _0x2bbb48 = _0x4371d9['composeOutputPending'] === !![],
    _0x42d207 = buildPersonReplacementCompositePreviewSnapshot(_0x5007be)['fullAvailable'],
    _0x23ce24 = _0x2bbb48 ? '合成中…' : _0x42d207 ? '重新合成全部视频' : '合成全部视频';
  return (
    '<button\x20type=\x22button\x22\x20class=\x22story-workbench-action-button\x20story-main-action-button\x20person-replacement-compose-output' +
    (_0x2bbb48 ? ' is-loading' : '') +
    '" data-person-replacement-action="compose-output" aria-busy="' +
    _0x2bbb48 +
    '\x22' +
    (_0x2bbb48 || !_0x28b9e1 ? ' disabled' : '') +
    '>' +
    (_0x2bbb48
      ? '<span class="storyboard-script-loading-spinner person-replacement-compose-spinner" aria-hidden="true"></span>'
      : '') +
    '<span>' +
    _0x23ce24 +
    '</span></button>'
  );
}
function renderAssetSettings(_0x821e46, _0x9ddb23 = {}) {
  return renderPersonReplacementAssetSettingsPage(_0x821e46, {
    ..._0x9ddb23,
    renderDetailSplitter: (_0x44f2fe) =>
      renderPersonReplacementLayoutSplitter('asset-detail', { assetDetailSplitRatio: _0x44f2fe }),
    footerHtml: personReplacementShellPresentation['renderStepFooter'](_0x821e46, {
      nextLabel: '进入图像替换',
      hidePrevious: !![],
    }),
  });
}
function renderVoiceClone(_0x4c6c08) {
  return renderPersonReplacementVoiceClonePage(_0x4c6c08, {
    footerHtml: personReplacementShellPresentation['renderStepFooter'](_0x4c6c08, {
      nextLabel: '进入合成视频',
    }),
  });
}
function renderCompositePreview(_0x3a863c, _0xd3de14 = {}) {
  const _0x22a2c6 = buildPersonReplacementCompositePreviewSnapshot(_0x3a863c);
  return personReplacementCompositePreviewPresentation['render'](_0x22a2c6, {
    composeActionHtml: renderCompositeComposeAction(_0x3a863c, _0xd3de14),
    playbackControlsHtml: personReplacementVideoPresentation['renderPlaybackControls'](
      _0x22a2c6['selectedShot'],
      { context: 'comparison', disabled: !_0x22a2c6['canCompare'] },
    ),
    composeOutputPending: _0xd3de14['composeOutputPending'] === !![],
  });
}
function renderProject(_0x12b8e5, _0x1e5e38 = {}) {
  const _0xc093af = {
      0x1: renderAssetSettings,
      0x2: (_0x61b215, _0x451893) => personReplacementImagePresentation['render'](_0x61b215, _0x451893),
      0x3: (_0x4a42a0, _0x281f91) => personReplacementVideoPresentation['render'](_0x4a42a0, _0x281f91),
      0x4: renderVoiceClone,
      0x5: renderCompositePreview,
    },
    _0x2e22ec = _0x1e5e38['cutEditorSmartDetectOpen']
      ? personReplacementSmartDetectPresentation['renderPanel'](_0x12b8e5, {
          smartDetecting: _0x1e5e38['cutEditorSmartDetecting'],
        })
      : '',
    _0x1f608c =
      _0x1e5e38['canvasSyncOverlayInline'] === ![]
        ? ''
        : personReplacementShellPresentation['renderCanvasSyncLoadingOverlay'](_0x1e5e38);
  return (
    personReplacementShellPresentation['renderHeader'](_0x12b8e5, _0x1e5e38) +
    '<main class="person-replacement-project-body"' +
    (_0x1e5e38['canvasSyncPending'] === !![] ? ' aria-hidden="true" inert' : '') +
    '>' +
    _0xc093af[_0x12b8e5['workspace']['step']](_0x12b8e5, _0x1e5e38) +
    '</main>' +
    _0x2e22ec +
    _0x1f608c
  );
}
function renderHiddenInputs() {
  return '<div\x20class=\x22story-asset-hover-preview\x22\x20data-story-asset-hover-preview\x20role=\x22tooltip\x22\x20aria-hidden=\x22true\x22></div><input\x20type=\x22file\x22\x20accept=\x22video/*\x22\x20multiple\x20hidden\x20data-person-replacement-input=\x22source-videos\x22><input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20multiple\x20hidden\x20data-person-replacement-input=\x22new-character-images\x22><input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20multiple\x20hidden\x20data-person-replacement-input=\x22new-scene-images\x22><input\x20type=\x22file\x22\x20accept=\x22audio/*\x22\x20multiple\x20hidden\x20data-person-replacement-input=\x22new-audio-files\x22><input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20hidden\x20data-person-replacement-input=\x22appearance-image\x22><input\x20type=\x22file\x22\x20accept=\x22image/*\x22\x20hidden\x20data-person-replacement-input=\x22replacement-image\x22><input\x20type=\x22file\x22\x20accept=\x22video/*\x22\x20hidden\x20data-person-replacement-input=\x22replacement-video-result\x22><input\x20type=\x22file\x22\x20accept=\x22image/*,video/*\x22\x20hidden\x20data-person-replacement-input=\x22replacement-video-slot\x22><input\x20type=\x22file\x22\x20accept=\x22audio/*\x22\x20hidden\x20data-person-replacement-input=\x22character-voice\x22>';
}
export function renderPersonReplacementWorkspace(_0x1ad505 = {}, _0x25c8d5 = {}) {
  const _0x579d1d = normalizePersonReplacementWorkspaceProject(_0x1ad505),
    _0x36e70e =
      _0x579d1d['workspace']['view'] === 'home'
        ? personReplacementShellPresentation['renderHome'](_0x579d1d)
        : renderProject(_0x579d1d, _0x25c8d5);
  return (
    '<section class="person-replacement-workspace" data-person-replacement-workspace data-person-replacement-view="' +
    _0x579d1d['workspace']['view'] +
    '" data-person-replacement-step="' +
    _0x579d1d['workspace']['step'] +
    '\x22>' +
    _0x36e70e +
    renderHiddenInputs() +
    '</section>'
  );
}
function resolveMountTarget(_0x29c113, _0x301df6) {
  if (_0x301df6?.['nodeType'] === 0x1) return _0x301df6;
  return _0x29c113?.['querySelector']?.(_0x301df6) || _0x29c113?.['body'] || null;
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
  const _0x43f995 = PERSON_REPLACEMENT_WORKSPACE_INTENTS,
    _0x750640 = (_0x25c329) => workspaceIntentPort['supports'](_0x25c329),
    _0x4ad4fe = (_0x150dd2, ..._0x36cec5) => workspaceIntentPort['request'](_0x150dd2, ..._0x36cec5),
    _0x52549f =
      (_0x120cc9) =>
      (..._0x3dabc4) =>
        _0x4ad4fe(_0x120cc9, ..._0x3dabc4);
  let _0x57b9e5 = normalizePersonReplacementWorkspaceProject(initialProject);
  const _0x5b9bfb = createWorkspaceAssetLibraryDisclosure();
  let _0x42b7b0 = null,
    _0x348b2e = null,
    _0x2f325d = ![];
  const _0x3accc4 = createWorkspacePresentationLifecycle({ getRoot: () => _0x42b7b0 }),
    _0x3a22a2 = createWorkspacePersistencePresentation({ getRoot: () => _0x42b7b0 });
  let _0x2c9c4b = mountTarget,
    _0x40a90d = null,
    _0x116a03 = null;
  const _0x29b772 = new Set();
  let _0x834763 = '',
    _0x42cf44 = [],
    _0x2fa649 = null,
    _0x5cb732 = null,
    _0xdc14ac = null,
    _0xc29065 = null,
    _0x1b7b58 = ![],
    _0x47513d = '',
    _0x4fcdf7 = ![],
    _0x463a8b = ![],
    _0x3b1585 = null,
    _0xbd6d44 = null;
  const _0x1ffaf2 = new Map();
  let _0x177009 = ![],
    _0x59e1d9 = null,
    _0x546083 = null,
    _0x4aeba7 = null,
    _0x3e5d6c = null;
  const _0x2ba69b = createPersonReplacementVideoPlaybackController({
      getRoot: () => _0x42b7b0,
      getProject: () => _0x57b9e5,
      getSelectedShot: (_0x319459) => personReplacementVideoPresentation['build'](_0x319459)['shot'],
      createVideoPlayback: createVideoPlayback,
      videoClipController: videoClipController,
    }),
    _0x2fb45b = (_0x33e407) => _0x2ba69b['bind'](_0x33e407),
    _0x31cf87 = () => _0x2ba69b['bindCenterIndicators'](),
    _0x3c691d = (_0x4096c) => _0x2ba69b['stop'](_0x4096c),
    _0x31cdf2 = createPersonReplacementCompositePreviewController({
      getRoot: () => _0x42b7b0,
      getProject: () => _0x57b9e5,
      documentObject: documentObject,
      windowObject: windowObject,
      createVideoPlayback: createVideoPlayback,
    }),
    _0xa770b0 = () => _0x31cdf2['stop'](),
    _0x5083e0 = (_0xa792cd) => _0x31cdf2['releaseOriginalWarmup'](_0xa792cd),
    _0x2f6a26 = (_0x438102) => _0x31cdf2['startOriginalWarmup'](_0x438102),
    _0x481bb9 = () => _0x31cdf2['prepareOriginalHandoff'](),
    _0x2d6050 = () => _0x31cdf2['retainFullVideosForPageRefresh'](),
    _0x1d0ea5 = () => _0x31cdf2['bind']();
  let _0x57b119 = null;
  const _0x24b921 = createPersonReplacementShotCutSession({
      initialProject: _0x57b9e5,
      windowObject: windowObject,
      onBoundaryDragStopped: () => {
        documentObject?.['body']?.['classList']?.['remove']?.('person-replacement-cut-resizing');
      },
      onDetectionRequested: async (_0x475438) => {
        const _0x521ea6 = await _0x4ad4fe(_0x43f995['DETECT_SHOT_CUT_RANGES'], _0x475438, {
            project: cloneJson(_0x57b9e5),
          }),
          _0x50a1b3 = Array['isArray'](_0x521ea6?.['ranges']) ? _0x521ea6['ranges'] : [];
        if (!_0x50a1b3['length']) throw new Error('智能检测未返回可用切口');
        return _0x50a1b3;
      },
      playbackControllerOptions: {
        windowObject: windowObject,
        isEditorOpen: () => _0x4e4610['isOpen'],
        getDraft: () => _0x4e4610['draft'],
        getProject: () => _0x57b9e5,
        syncNativePlayback: (_0x538c1d) => _0x57b119?.['syncPlaybackFromVideo'](_0x538c1d),
        syncTimelinePosition: (_0x2132c8) => _0x57b119?.['syncTimelinePosition'](_0x2132c8),
        previewShotCut: (..._0x26eb46) => _0x57b119?.['preview'](..._0x26eb46),
      },
    }),
    _0x4e4610 = _0x24b921['workspaceState'],
    _0x177092 = createPersonReplacementShotCutPreviewMediaController({
      session: _0x24b921,
      getRoot: () => _0x42b7b0,
      getProject: () => _0x57b9e5,
      getSelectedShot: (_0x15a1cc) => personReplacementImagePresentation['build'](_0x15a1cc)['selectedShot'],
      createVideoPlayback: createVideoPlayback,
      documentObject: documentObject,
      isDestroyed: () => _0x2f325d,
    }),
    {
      preparePreviewVideo: _0x53b56d,
      preserveBufferedVideo: _0x45ae96,
      releaseBufferedVideo: _0x551a99,
      restoreBufferedVideo: _0x1eb029,
    } = _0x177092,
    _0x2ca5f9 = createPersonReplacementShotCutViewportController({
      session: _0x24b921,
      getRoot: () => _0x42b7b0,
      renderIcon: renderIcon,
    }),
    { applyTimelineZoom: _0x1d4206, isBusy: _0x26d2a5, isDraftMutationBusy: _0x374e20 } = _0x2ca5f9;
  _0x57b119 = createPersonReplacementShotCutPreviewController({
    session: _0x24b921,
    mediaController: _0x177092,
    viewportController: _0x2ca5f9,
    getRoot: () => _0x42b7b0,
    getProject: () => _0x57b9e5,
  });
  const {
      armFrameWait: _0x324bbc,
      cancelFrameWait: _0x139716,
      cancelHoverPreview: _0x2a5781,
      clearPreviewMetadata: _0x41541c,
      markFrameReady: _0x52e2c5,
      preview: _0x2fd756,
      seekTimeline: _0x57503e,
      stepTimeline: _0x3b2808,
      stopPlayback: _0x33e2c8,
      syncPlaybackFromVideo: _0x6f845a,
      togglePlayback: _0x4b8ea2,
    } = _0x57b119,
    _0x16350b = createPersonReplacementShotCutEditorController({
      session: _0x24b921,
      previewController: _0x57b119,
      mediaController: _0x177092,
      viewportController: _0x2ca5f9,
      getRoot: () => _0x42b7b0,
      getProject: () => _0x57b9e5,
      documentObject: documentObject,
      windowObject: windowObject,
      isDestroyed: () => _0x2f325d,
      requestRender: () => _0x4cf492(),
      onShotKeyframeSelected: _0x52549f(_0x43f995['SELECT_SHOT_KEYFRAME']),
      onShotReverseRequested: _0x52549f(_0x43f995['UPDATE_SHOT_REVERSE']),
      hideResultHistoryMenu: () => _0x446a6f(),
      scrollShotCardIntoView: (_0x1a2b96) => _0x25aef6(_0x1a2b96),
    }),
    {
      close: _0x26bf5a,
      requestReverseChange: _0x482b47,
      reset: _0x119305,
      splitAtPlayhead: _0x4299a2,
      watchOpeningVideo: _0x5e0fff,
    } = _0x16350b,
    _0x27ca5e = createPersonReplacementShotCutInteractionController({
      session: _0x24b921,
      previewController: _0x57b119,
      viewportController: _0x2ca5f9,
      editorController: _0x16350b,
      getRoot: () => _0x42b7b0,
      getProject: () => _0x57b9e5,
      documentObject: documentObject,
      windowObject: windowObject,
      isDestroyed: () => _0x2f325d,
      requestRender: () => _0x4cf492(),
      onShotCutDetectionRequested: _0x52549f(_0x43f995['DETECT_SHOT_CUT_RANGES']),
      onShotCutRangesRequested: _0x52549f(_0x43f995['UPDATE_SHOT_CUT_RANGES']),
      runRequest: (_0x7a1283, _0x23e9d7) => _0x267b3(_0x7a1283, _0x23e9d7),
      updateSmartClipSettings: (..._0x22153e) => _0x2583b7(..._0x22153e),
    }),
    {
      applyBoundaryTime: _0x42c738,
      beginBoundaryDrag: _0x1217d1,
      getTimelineSecFromPointer: _0x5272fe,
      hideHoverPlayhead: _0x22c15c,
      syncHoverPlayhead: _0x1e50c3,
      undoDraft: _0x3ca241,
    } = _0x27ca5e,
    _0x400faa = createPersonReplacementAssetHoverPreviewController({
      getRoot: () => _0x42b7b0,
      getProject: () => _0x57b9e5,
      getSelectedAppearance: (_0x2863cb) => _0x391a96(_0x2863cb),
      isTargetAssetDragActive: () => _0x177009,
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    {
      blockDropTarget: _0x297e45,
      handlePointerMove: _0x5ae2bd,
      handlePointerOut: _0x54b283,
      handlePointerOver: _0x3f459d,
      hide: _0x58b712,
    } = _0x400faa;
  let _0x553216 = ![],
    _0x3d05d4 = null,
    _0x236762 = null,
    _0x59940c = 'none',
    _0x5bc315 = 'page',
    _0x3238d5 = '',
    _0x1c8531 = () => ![];
  const _0x1f77e4 = { accumulator: 0x0, lockedUntil: 0x0 },
    _0x110a98 = { accumulator: 0x0, lockedUntil: 0x0 },
    _0x4092b9 = { accumulator: 0x0, lockedUntil: 0x0 },
    _0x260afc = { accumulator: 0x0, lockedUntil: 0x0 },
    _0x32e60f = { accumulator: 0x0, lockedUntil: 0x0 },
    _0x4625b2 = new Map(),
    _0x735220 = new Map(),
    _0x3d57d6 = createWorkspaceMenuController({
      root: () => _0x42b7b0,
      wrapperSelector: '[data-person-replacement-output-menu]',
      triggerSelector: '[data-person-replacement-output-menu-trigger]',
      menuSelector: '.story-canvas-sync-menu',
      optionSelector: '[data-person-replacement-output-menu-item]',
    }),
    _0x23c082 = createPersonReplacementExportSubmenuController({ root: () => _0x42b7b0 }),
    _0x624e11 = (_0x1616a7 = null) => {
      return (_0x23c082['close'](), _0x3d57d6['close'](_0x1616a7));
    },
    _0x37ce51 = (_0x250afc) => _0x3d57d6['toggle'](_0x250afc),
    _0x17c907 = (_0x5b946d) => {
      if (_0x750640(_0x43f995['SELECT_SOURCE_VIDEOS']))
        return _0x4e3281(_0x43f995['SELECT_SOURCE_VIDEOS'], _0x5b946d);
      if (_0x750640(_0x43f995['SELECT_SOURCE_VIDEO']))
        return Promise['all'](
          _0x5b946d['map']((_0x5ee74a) => _0x4ad4fe(_0x43f995['SELECT_SOURCE_VIDEO'], _0x5ee74a)),
        );
      return null;
    },
    _0x59d19e = (_0x5df881) => {
      if (_0x750640(_0x43f995['SELECT_NEW_CHARACTER_IMAGES']))
        return _0x4e3281(_0x43f995['SELECT_NEW_CHARACTER_IMAGES'], _0x5df881);
      if (_0x750640(_0x43f995['SELECT_NEW_CHARACTER_IMAGE']))
        return Promise['all'](
          _0x5df881['map']((_0x1c85be) =>
            _0x4ad4fe(_0x43f995['SELECT_NEW_CHARACTER_IMAGE'], _0x1c85be, { project: cloneJson(_0x57b9e5) }),
          ),
        );
      return null;
    },
    _0x3ccd2d = (_0x3dd2d5 = _0x57b9e5) =>
      refreshPersonReplacementWorkspaceAssets(_0x3dd2d5, () =>
        _0x750640(_0x43f995['LIST_LIBRARY_ASSETS']) ? _0x4ad4fe(_0x43f995['LIST_LIBRARY_ASSETS']) : null,
      ),
    _0x906547 = (_0x506756, _0x567b63) => {
      const _0x468f07 = normalizePersonReplacementWorkspaceProject(_0x506756);
      if (typeof projectSession?.['commitWorkspaceProject'] !== 'function') return _0x468f07;
      const _0x1e923f = projectSession['commitWorkspaceProject'](cloneJson(_0x468f07), { reason: _0x567b63 });
      return normalizePersonReplacementWorkspaceProject({
        ..._0x1e923f,
        libraryProjects: _0x468f07['libraryProjects'],
        libraryAssets: _0x468f07['libraryAssets'],
        sourcePreviewRefs: _0x468f07['sourcePreviewRefs'],
        persistenceState: _0x468f07['persistenceState'],
      });
    },
    _0x273c17 = (_0xdb0c5a) => {
      ((_0x57b9e5 = _0x906547(_0x57b9e5, _0xdb0c5a)),
        _0x42cf44['forEach']((_0x27c55e) => _0x27c55e?.['syncPrices']?.()));
      if (_0xdb0c5a === 'image-prompt')
        syncPersonReplacementImagePromptGate(_0x42b7b0, _0x57b9e5, _0x1f9cef());
      return cloneJson(_0x57b9e5);
    },
    _0x4175c2 = () => isPersonReplacementSourceProcessing(_0x57b9e5),
    _0x3fc4d6 = (_0x625e20, _0xd9d7af = 0x0) => {
      _0x4ad4fe(_0x43f995['REPORT_STEP_NAVIGATION_BLOCKED'], {
        reason: _0x625e20,
        currentStep: _0x57b9e5['workspace']['step'],
        requestedStep: _0xd9d7af,
        project: cloneJson(_0x57b9e5),
      });
    },
    _0x934d2e = (_0x95f7ee = _0x57b9e5) => {
      const _0x22a002 = _0x95f7ee?.['workspace'] || {};
      if (_0x22a002['view'] !== 'project') return normalizeText(_0x22a002['view']) || 'home';
      const _0x3262ab = Math['trunc'](Number(_0x22a002['step']) || 0x1);
      return _0x3262ab === 0x1
        ? 'project:' +
            _0x3262ab +
            ':asset:' +
            (['character', 'scene', 'audio', 'library']['includes'](_0x22a002['characterAssetTab'])
              ? _0x22a002['characterAssetTab']
              : 'character')
        : 'project:' + _0x3262ab;
    },
    _0x4c0940 = (_0x1910e0 = _0x57b9e5) =>
      (normalizeText(_0x1910e0?.['id']) || 'draft') + '\x1f' + _0x934d2e(_0x1910e0),
    _0x969ed5 = (_0x41c3cb, _0x5166d3, { assetScope: assetScope = 'asset-content' } = {}) => {
      const _0x2f50c6 = _0x41c3cb?.['workspace'] || {},
        _0x40ba6b = _0x5166d3?.['workspace'] || {};
      if (_0x2f50c6['view'] !== 'project' || _0x40ba6b['view'] !== 'project') return;
      const _0x56c3c = Math['trunc'](Number(_0x2f50c6['step']) || 0x1),
        _0x2e4c62 = Math['trunc'](Number(_0x40ba6b['step']) || 0x1);
      if (_0x56c3c !== _0x2e4c62) {
        ((_0x59940c = _0x2e4c62 > _0x56c3c ? 'forward' : 'backward'), (_0x5bc315 = 'page'));
        return;
      }
      if (_0x2e4c62 !== 0x1) return;
      const _0x4fe482 = resolveWorkspaceTabTransitionDirection(
        _0x2f50c6['characterAssetTab'],
        _0x40ba6b['characterAssetTab'],
        ['character', 'scene', 'audio', 'library'],
      );
      if (_0x4fe482 === 'none') return;
      ((_0x59940c = _0x4fe482), (_0x5bc315 = assetScope === 'asset-list' ? 'asset-list' : 'asset-content'));
    },
    _0x5bad7b = (_0x13deba, _0x232299 = null, { inPlace: inPlace = ![] } = {}) => {
      const _0x34f7da = _0x13deba?.['project'] || _0x13deba;
      if (_0x34f7da && typeof _0x34f7da === 'object') {
        const _0x41e06f = _0x232299
          ? { ..._0x34f7da, workspace: { ...(_0x34f7da['workspace'] || {}), ..._0x232299 } }
          : _0x34f7da;
        inPlace
          ? _0x2edc43['syncProjectState'](_0x41e06f, { returnSnapshot: ![] })
          : _0x2edc43['setProject'](_0x41e06f);
      }
    },
    _0x267b3 = (
      _0x3204bf,
      _0x4efbb7,
      _0x5f0a58 = {},
      {
        applyCallbackResult: applyCallbackResult = !![],
        applyCallbackResultInPlace: applyCallbackResultInPlace = ![],
      } = {},
    ) => {
      const _0x4ce8ca =
        _0x57b9e5['workspace']['view'] === 'home'
          ? {
              projectSearchQuery: _0x57b9e5['workspace']['projectSearchQuery'],
              projectSortOrder: _0x57b9e5['workspace']['projectSortOrder'],
              showArchivedProjects: _0x57b9e5['workspace']['showArchivedProjects'],
              openProjectMenuId: '',
              pendingDeleteProjectId: '',
            }
          : null;
      try {
        const _0x9d445e = _0x3204bf(_0x4efbb7, { project: cloneJson(_0x57b9e5), ..._0x5f0a58 });
        if (_0x9d445e?.['then'])
          void _0x9d445e['then'](
            (_0xa67189) => {
              applyCallbackResult && _0x5bad7b(_0xa67189, _0x4ce8ca, { inPlace: applyCallbackResultInPlace });
            },
            () => {},
          );
        else applyCallbackResult && _0x5bad7b(_0x9d445e, _0x4ce8ca, { inPlace: applyCallbackResultInPlace });
        return _0x9d445e;
      } catch (_0x416d66) {
        return (
          globalThis['queueMicrotask']?.(() => {
            throw _0x416d66;
          }),
          null
        );
      }
    },
    _0x4e3281 = (_0x41c9f1, _0x28fe58, _0x393848 = {}, _0x419f8b = {}) =>
      _0x267b3(_0x52549f(_0x41c9f1), _0x28fe58, _0x393848, _0x419f8b),
    _0x1fc768 = (_0x5b7017, _0xa2c2c2 = '') => {
      const _0x4ce83b = normalizeText(_0x5b7017?.['dataset']?.['shotId']);
      if (!_0x4ce83b) return '';
      const _0x2fe64a = readPersonReplacementVideoPromptEditor(_0x5b7017);
      _0x57b9e5 = normalizePersonReplacementWorkspaceProject({
        ..._0x57b9e5,
        shots: _0x57b9e5['shots']['map']((_0x796c9c) =>
          _0x796c9c['id'] === _0x4ce83b ? { ..._0x796c9c, videoPrompt: _0x2fe64a } : _0x796c9c,
        ),
      });
      if (_0xa2c2c2) _0x273c17(_0xa2c2c2);
      return _0x2fe64a;
    },
    _0x56892a = (_0x64d355, _0x5bd323, _0x2db51e = {}) => {
      if (!_0x64d355) return;
      (insertPresetPromptIntoEditor({
        storeApi: null,
        promptEl: _0x64d355,
        template: _0x5bd323,
        allowedAssetTypes: ['text', 'image', 'video', 'audio'],
      }),
        _0x1fc768(_0x64d355, 'video-prompt-preset'));
      if (_0x2db51e?.['insertPrompt'] === !![]) return;
      _0x4e3281(
        _0x43f995['GENERATE_REPLACEMENT_VIDEO'],
        { projectId: _0x57b9e5['id'], shotId: normalizeText(_0x64d355['dataset']?.['shotId']) },
        {},
        { applyCallbackResult: ![] },
      );
    },
    _0x7a45ba = (_0x491624, _0x28bfdc = _0x57b9e5['id']) =>
      normalizeText(_0x28bfdc) + '\x1f' + normalizeText(_0x491624),
    _0x533135 = (_0x535383, _0x2c8a62) => {
      const _0x3f67e8 = _0x7a45ba(_0x535383);
      if (_0x29b772['has'](_0x3f67e8)) return null;
      (_0x29b772['add'](_0x3f67e8), _0x4cf492());
      let _0x28c176 = null;
      try {
        _0x28c176 = _0x2c8a62();
      } catch (_0x5517f5) {
        return (
          _0x29b772['delete'](_0x3f67e8),
          _0x4cf492(),
          windowObject?.['showToast']?.(_0x5517f5?.['message'] || '素材上传失败，请稍后重试。', 'error'),
          null
        );
      }
      const _0x2fb8f0 = () => {
        if (!_0x29b772['delete'](_0x3f67e8)) return;
        _0x4cf492();
      };
      if (!_0x28c176?.['then']) return (_0x2fb8f0(), _0x28c176);
      return (
        void Promise['resolve'](_0x28c176)
          ['catch']((_0x1a2008) => {
            windowObject?.['showToast']?.(_0x1a2008?.['message'] || '素材上传失败，请稍后重试。', 'error');
          })
          ['finally'](_0x2fb8f0),
        _0x28c176
      );
    },
    _0x29175f = (_0x1f86f0, _0x45330d) => {
      const _0x41527e = _0x1f86f0?.['querySelector']?.(
          '[data-person-replacement-action="toggle-library-add-targets"]',
        ),
        _0x3f3ce0 = _0x1f86f0?.['querySelector']?.('.story-asset-batch-menu');
      if (!_0x1f86f0 || !_0x41527e || !_0x3f3ce0) return ![];
      if (_0x45330d) syncWorkspaceInlineMenuExpandedWidth(_0x3f3ce0);
      return (
        _0x1f86f0['classList']?.['toggle']?.('is-open', _0x45330d),
        _0x41527e['setAttribute']?.('aria-expanded', String(_0x45330d)),
        _0x3f3ce0['setAttribute']?.('aria-hidden', String(!_0x45330d)),
        !![]
      );
    },
    _0x318ab0 = (_0x269582 = null) => {
      _0x42b7b0?.['querySelectorAll']?.('.person-replacement-library-add-menu-wrap.is-open')?.['forEach']?.(
        (_0x631db5) => {
          if (_0x631db5 !== _0x269582) _0x29175f(_0x631db5, ![]);
        },
      );
    },
    _0x28395d = (_0x4b65e5, _0x204d54) => {
      const _0x2dcfad = _0x4b65e5?.['querySelector']?.(
          '[data-story-action=\x22toggle-character-voice-menu\x22]',
        ),
        _0x1033c0 = _0x4b65e5?.['querySelector']?.('.person-replacement-add-voice-menu');
      if (!_0x4b65e5 || !_0x2dcfad || !_0x1033c0) return ![];
      return (
        _0x4b65e5['classList']?.['toggle']?.('is-open', _0x204d54),
        _0x2dcfad['setAttribute']?.('aria-expanded', String(_0x204d54)),
        _0x1033c0['setAttribute']?.('aria-hidden', String(!_0x204d54)),
        !![]
      );
    },
    _0x4ba512 = (_0x492c83 = null) => {
      _0x42b7b0?.['querySelectorAll']?.('.person-replacement-add-voice-menu-wrap.is-open')?.['forEach']?.(
        (_0xebe492) => {
          if (_0xebe492 !== _0x492c83) _0x28395d(_0xebe492, ![]);
        },
      );
    },
    _0x26d845 = (_0x5a5faf, _0x26a2bc, _0x267940 = {}) => {
      const _0x15d4fc = _0x57b9e5;
      _0x57b9e5 = _0x906547(_0x5a5faf, _0x26a2bc);
      const _0xca52b2 = normalizeText(_0x26a2bc),
        _0x57cb2c = [
          'character-voice-library-open',
          'character-voice-library-cancel',
          'character-voice-library-confirm',
        ]['includes'](_0xca52b2)
          ? 'asset-list'
          : 'asset-content';
      _0x969ed5(_0x15d4fc, _0x57b9e5, { assetScope: _0x57cb2c });
      if (!_0x1c8531(_0x26a2bc, _0x267940)) _0x4cf492();
      return (_0x4aeba7?.['refresh'](), cloneJson(_0x57b9e5));
    },
    _0x5569e2 = ({
      detectionBox: _0x5276ca,
      label: _0x470b70,
      sourceCharacterId: _0x34d0f0,
      orientation: _0x42ad43,
    } = {}) => {
      const _0xc708bc = normalizeText(_0x5276ca?.['dataset']?.['shotId']),
        _0x4d4c2a = normalizeText(_0x5276ca?.['dataset']?.['personId']),
        _0x36962d = _0x57b9e5['shots']['find']((_0x1e4684) => _0x1e4684['id'] === _0xc708bc),
        _0x34b4a7 = _0x36962d?.['people']?.['find']((_0x55867a) => _0x55867a['id'] === _0x4d4c2a);
      if (!_0x34b4a7) return ![];
      const _0x1d5419 =
        _0x470b70 === undefined ? normalizeText(_0x34b4a7['label']) : normalizeText(_0x470b70);
      if (!_0x1d5419) return ![];
      const _0x1a16e7 = normalizeText(_0x34d0f0, normalizeText(_0x34b4a7['sourceCharacterId'])),
        _0x1ea77a =
          _0x42ad43 === undefined ? normalizeText(_0x34b4a7['orientation']) : normalizeText(_0x42ad43),
        _0x4dbd7f = getPersonReplacementIdentityCorrectionDraftKey(_0xc708bc, _0x4d4c2a),
        _0x64ee2c = { ..._0x57b9e5['workspace']['identityCorrectionDrafts'] };
      delete _0x64ee2c[_0x4dbd7f];
      const _0x30a933 = _0x57b9e5['workspace']['removedCustomPersonLabels']['filter'](
        (_0x4fc94c) => _0x4fc94c !== _0x1d5419,
      );
      return (
        (_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
          ..._0x57b9e5,
          workspace: {
            ..._0x57b9e5['workspace'],
            identityCorrectionDrafts: _0x64ee2c,
            removedCustomPersonLabels: _0x30a933,
          },
        })),
        _0x4e3281(_0x43f995['CONFIRM_SOURCE_IDENTITY'], {
          sourceCharacterId: _0x34b4a7['sourceCharacterId'],
          targetSourceCharacterId: _0x1a16e7,
          shotId: _0xc708bc,
          personId: _0x4d4c2a,
          label: _0x1d5419,
          orientation: _0x1ea77a,
          silent: !![],
        }),
        !![]
      );
    },
    _0x57cd0f = (_0x11e11d) => {
      const _0x389c60 = _0x11e11d === 'original' ? 'original' : 'replacement';
      if (_0x389c60 === 'replacement') {
        const _0x4f9189 = buildPersonReplacementCompositePreviewSnapshot(_0x57b9e5)['media'];
        if (!_0x4f9189['replacementAudioRef'])
          return (
            windowObject?.['showToast']?.(
              '请返回「声音克隆」，先生成语音并点击「合成」，完成后再选择替换音轨。',
              'warn',
            ),
            cloneJson(_0x57b9e5)
          );
      }
      if (_0x389c60 === _0x57b9e5['audio']['previewTrack'] && _0x389c60 === _0x57b9e5['audio']['exportTrack'])
        return (_0x31cdf2['setTrack'](_0x389c60), cloneJson(_0x57b9e5));
      return (
        (_0x57b9e5 = normalizePersonReplacementWorkspaceProject(
          transitionPersonReplacementOutput(
            {
              ..._0x57b9e5,
              audio: { ..._0x57b9e5['audio'], previewTrack: _0x389c60, exportTrack: _0x389c60 },
            },
            { type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['FINAL_MUX_INVALIDATE'] },
          ),
        )),
        _0x42b7b0?.['querySelectorAll']?.('[data-person-replacement-action="set-preview-track"]')?.[
          'forEach'
        ]?.((_0x5e34ee) => {
          const _0x2c4659 = _0x5e34ee['dataset']?.['previewTrack'] === _0x389c60;
          (_0x5e34ee['classList']?.['toggle']?.('is-selected', _0x2c4659),
            _0x5e34ee['setAttribute']?.('aria-pressed', String(_0x2c4659)));
        }),
        _0x31cdf2['setTrack'](_0x389c60),
        _0x273c17('preview-track'),
        cloneJson(_0x57b9e5)
      );
    },
    _0x3013ce = (_0x40c56d = '') => {
      const _0x4afcee = _0x57b9e5['shots']['find'](
          (_0x1674b2) =>
            _0x1674b2['id'] === normalizeText(_0x40c56d || _0x57b9e5['workspace']['selectedShotId']),
        ),
        _0x4c0f44 = _0x42b7b0?.['querySelector']?.('[data-person-replacement-video-stage]'),
        _0x56c830 = _0x4c0f44?.['querySelector']?.('[data-person-replacement-video-player]'),
        _0x53b114 = resolvePersonReplacementVideoSlotState(_0x57b9e5, _0x4afcee)['slotEntries'][
          'sourceVideo'
        ]?.['url'],
        _0x38450d = normalizeMediaUrl(_0x53b114);
      if (!_0x4afcee || !_0x4c0f44 || !_0x56c830 || !_0x38450d)
        return (windowObject?.['showToast']?.('当前视频片段尚未准备完成。', 'warn'), ![]);
      if (isPersonReplacementVideoCropReverseRunning(_0x4afcee))
        return (windowObject?.['showToast']?.('当前视频片段正在处理倒放，请稍后再裁剪。', 'info'), ![]);
      _0x56c830['pause']?.();
      const _0x671a59 =
          Number(_0x56c830['duration']) > 0x0
            ? Number(_0x56c830['duration'])
            : Math['max'](0x0, Number(_0x4afcee['durationSec']) || 0x0),
        _0x5219f4 = videoClipController?.['initForSource']?.(
          createPersonReplacementVideoCropOptions({
            projectId: _0x57b9e5['id'],
            selectedShot: _0x4afcee,
            stage: _0x4c0f44,
            videoEl: _0x56c830,
            durationSec: _0x671a59,
            getProject: () => _0x57b9e5,
            acceptProject: (_0x2b523b) => {
              const _0x233a37 = normalizePersonReplacementWorkspaceProject(_0x2b523b);
              return (
                normalizeText(_0x233a37['id']) === normalizeText(_0x57b9e5['id']) && (_0x57b9e5 = _0x233a37),
                _0x57b9e5
              );
            },
            requestReverseChange: _0x482b47,
            onConfirm: (_0x5ce056) => {
              (_0x2ba69b['setClipActive'](![]),
                _0x26d845(
                  applyPersonReplacementVideoCrop(_0x57b9e5, { ..._0x5ce056, shotId: _0x4afcee['id'] }),
                  'video-crop',
                ));
            },
            onExit: ({ reason: _0x15834e } = {}) => {
              _0x2ba69b['setClipActive'](![]);
              if (['confirm', 'silent']['includes'](_0x15834e) || _0x2f325d) return;
              if (!_0x59d0d2()) _0x4cf492();
            },
          }),
        );
      return _0x2ba69b['setClipActive'](_0x5219f4 === !![]);
    },
    _0x26dd8e = createPersonReplacementLayoutResizeController({
      documentObject: documentObject,
      windowObject: windowObject,
      getProject: () => _0x57b9e5,
      commitLayoutChange: (_0x386cb1) => {
        ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject(_0x57b9e5)),
          _0x273c17(_0x386cb1 === 'asset-detail' ? 'asset-detail-split-ratio' : 'replacement-layout'));
      },
    }),
    { begin: _0x22c867, stop: _0xea53df } = _0x26dd8e,
    _0x56d700 = () => {
      if (_0x2f325d || !_0x3accc4['isActive']()) return;
      if (_0x57b9e5['workspace']['step'] !== 0x2 || !_0x593f36()) _0x4cf492();
    },
    _0x1feb36 = (_0x20c23b, _0x4e6581) => {
      const _0x13d5ff = _0x4e3281(
        _0x20c23b,
        _0x4e6581,
        { renderWorkspace: ![] },
        { applyCallbackResultInPlace: !![] },
      );
      if (_0x13d5ff?.['then']) void _0x13d5ff['then'](_0x56d700, () => {});
      else _0x56d700();
    },
    _0x4b407f = createPersonReplacementPersonBoxInteractionController({
      getRoot: () => _0x42b7b0,
      getProject: () => _0x57b9e5,
      requestRender: _0x56d700,
      runRequest: (..._0x19cbf5) => _0x267b3(..._0x19cbf5),
      updateStageA11y: (..._0x58c995) => _0x33236e(..._0x58c995),
      onDeletePeopleRequested: (_0x1589db) => _0x1feb36(_0x43f995['DELETE_PEOPLE'], _0x1589db),
      onManualPersonSelected: (_0x4aa92a) => _0x1feb36(_0x43f995['SELECT_MANUAL_PERSON'], _0x4aa92a),
      onUpdatePeopleRequested: (_0x28c12f) =>
        _0x4e3281(
          _0x43f995['UPDATE_PEOPLE'],
          _0x28c12f,
          { renderWorkspace: ![] },
          { applyCallbackResultInPlace: !![] },
        ),
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    {
      beginBoxEdit: _0x4dc575,
      beginManualSelection: _0x42019b,
      bringBoxToFront: _0x29b3c0,
      cancelManualSelection: _0x32d3c6,
      clearBatchSelection: _0x113bbe,
      clearKeyboardSelection: _0x218fa0,
      destroy: _0x54fdfd,
      focusBatchSelectionStage: _0x431ffd,
      handleEscape: _0x46a111,
      handleSelectionKeyDown: _0x213c96,
      isManualSelectionActive: _0x31602a,
      restoreLayerState: _0x25fae1,
      selectBatch: _0x29b821,
      selectBox: _0x348a7d,
      setManualSelectionActive: _0x454e24,
      syncAfterRender: _0x2e8658,
    } = _0x4b407f,
    _0xe8cb52 = (_0x11248a = _0x57b9e5['workspace']['selectedCharacterId']) =>
      _0x57b9e5['characters']['find']((_0x37a50f) => _0x37a50f['id'] === _0x11248a) || null,
    _0x391a96 = (_0x300082 = _0xe8cb52()) => {
      const _0x5e8916 = Math['trunc'](
        Number(_0x57b9e5['workspace']['assetAppearanceIndexes']?.[_0x300082?.['id']]) || 0x0,
      );
      return (
        getWorkspaceAssetAppearances(_0x300082)[_0x5e8916] ||
        getWorkspaceAssetAppearances(_0x300082)[0x0] ||
        null
      );
    },
    _0x295d0b = () => {
      const _0x55b2cd = _0x57b9e5['workspace']['characterAssetTab'],
        _0x13c97e =
          _0x55b2cd === 'scene'
            ? _0x57b9e5['scenes']['find'](
                (_0x4d0a98) => _0x4d0a98['id'] === _0x57b9e5['workspace']['selectedSceneId'],
              )
            : _0x55b2cd === 'library'
              ? _0x57b9e5['libraryAssets']['find'](
                  (_0x95a185) => _0x95a185['id'] === _0x57b9e5['workspace']['selectedLibraryAssetId'],
                )
              : _0xe8cb52(),
        _0xb50e9e = _0x55b2cd === 'library' ? _0x13c97e : _0x391a96(_0x13c97e),
        _0x141169 = normalizeText(
          _0xb50e9e?.['sourceUrl'] || _0xb50e9e?.['imageUrl'] || _0xb50e9e?.['thumbnailUrl'],
        );
      if (!_0x13c97e || !_0x141169) return null;
      const _0xf98fc6 = normalizeText(_0x13c97e['name']) || '生成图片',
        _0x25f904 = normalizeText(_0xb50e9e?.['name']);
      return {
        imageRef: _0x141169,
        filenameBase:
          _0x25f904 && _0x25f904 !== _0xf98fc6 && _0x25f904 !== '基础形象'
            ? [_0xf98fc6, _0x25f904]['join']('-')
            : _0xf98fc6,
        title: '下载图片',
      };
    },
    {
      getSelectedReplacementImageDownloadRequest: _0x570287,
      getSelectedReplacementVideoDownloadRequest: _0x22da78,
      requestImageDownload: _0x3f9454,
      requestVideoDownload: _0x47874c,
    } = createPersonReplacementResultMediaActions({
      getProject: () => _0x57b9e5,
      runIntent: _0x4e3281,
      downloadImageIntent: _0x43f995['DOWNLOAD_IMAGE'],
      downloadVideoIntent: _0x43f995['DOWNLOAD_VIDEO'],
    }),
    _0x2bff49 = (_0x39c4d5, _0xf9e2d2 = '未命名人物') =>
      String(_0x39c4d5 ?? '')
        ['replace'](/\s+/gu, '\x20')
        ['trim']() || _0xf9e2d2,
    _0x5a1098 = (_0x5a43e6) => {
      const _0x437972 = normalizeText(_0x5a43e6?.['dataset']?.['storyAssetNameId']),
        _0xe21f46 = _0x57b9e5['characters']['find']((_0x68af51) => _0x68af51['id'] === _0x437972);
      if (!_0x5a43e6 || !_0xe21f46 || _0x5a43e6['getAttribute']?.('contenteditable') === 'true') return ![];
      ((_0x5a43e6['dataset']['storyAssetOriginalName'] = _0xe21f46['name']),
        _0x5a43e6['setAttribute']?.('contenteditable', 'true'),
        _0x5a43e6['setAttribute']?.('role', 'textbox'),
        _0x5a43e6['setAttribute']?.('aria-label', '修改' + _0xe21f46['name'] + '的名称'),
        _0x5a43e6['classList']?.['add']?.('is-editing'),
        _0x5a43e6['focus']?.());
      const _0x43b7af = windowObject?.['getSelection']?.(),
        _0x471a90 = documentObject?.['createRange']?.();
      return (
        _0x43b7af &&
          _0x471a90 &&
          (_0x471a90['selectNodeContents']?.(_0x5a43e6),
          _0x43b7af['removeAllRanges']?.(),
          _0x43b7af['addRange']?.(_0x471a90)),
        !![]
      );
    },
    _0x31e38b = (_0x18b449, { cancel: cancel = ![] } = {}) => {
      const _0x276549 = normalizeText(_0x18b449?.['dataset']?.['storyAssetNameId']),
        _0x53d786 = _0x57b9e5['characters']['find']((_0x2528e1) => _0x2528e1['id'] === _0x276549);
      if (!_0x18b449 || !_0x53d786 || _0x18b449['getAttribute']?.('contenteditable') !== 'true') return ![];
      const _0x399e00 = _0x2bff49(_0x18b449['dataset']['storyAssetOriginalName'], _0x53d786['name']),
        _0x17c344 = cancel ? _0x399e00 : _0x2bff49(_0x18b449['textContent'], _0x399e00);
      ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
        ..._0x57b9e5,
        characters: _0x57b9e5['characters']['map']((_0x44b62b) =>
          _0x44b62b['id'] === _0x276549 ? { ..._0x44b62b, name: _0x17c344 } : _0x44b62b,
        ),
      })),
        _0x42b7b0?.['querySelectorAll']?.('[data-story-asset-name-id]')?.['forEach']?.((_0x5e39df) => {
          if (normalizeText(_0x5e39df['dataset']['storyAssetNameId']) !== _0x276549) return;
          ((_0x5e39df['textContent'] = _0x17c344),
            _0x5e39df['removeAttribute']?.('contenteditable'),
            _0x5e39df['removeAttribute']?.('role'),
            _0x5e39df['setAttribute']?.('aria-label', '重命名' + _0x17c344),
            _0x5e39df['classList']?.['remove']?.('is-editing'),
            delete _0x5e39df['dataset']['storyAssetOriginalName']);
        }));
      if (!cancel && _0x17c344 !== _0x53d786['name']) _0x273c17('character-name');
      return !![];
    },
    _0x135d3b = () => {
      ((_0x4aeba7 ??= createPersonReplacementResultHistoryController({
        getRoot: () => _0x42b7b0,
        getProject: () => _0x57b9e5,
        renderHistoryMenu: (_0x15215f) =>
          personReplacementShotTimelinePresentation['renderHistoryMenu'](_0x15215f),
        selectShot: (..._0x19b693) => _0x2bd9ab(..._0x19b693),
        isCutEditorOpen: () => _0x4e4610['isOpen'],
      })),
        _0x4aeba7['refresh']());
    },
    _0x446a6f = () => _0x4aeba7?.['hide'](),
    _0x502778 = () => _0x4aeba7?.['capture'](),
    _0x229882 = (_0x2f6d9a) => _0x4aeba7?.['restore'](_0x2f6d9a),
    _0x124a6a = createPersonReplacementVoiceCloneInteractionController({
      getRoot: () => _0x42b7b0,
      getProject: () => _0x57b9e5,
      isDestroyed: () => _0x2f325d,
      commitProject: (_0x251d74, { reason: reason = 'voice-clone', render: _0x462fef = ![] } = {}) => {
        if (_0x462fef) return _0x26d845(_0x251d74, reason);
        return (
          (_0x57b9e5 = normalizePersonReplacementWorkspaceProject(_0x251d74)),
          _0x273c17(reason),
          cloneJson(_0x57b9e5)
        );
      },
      mountStudio: (..._0x597500) => _0x4ad4fe(_0x43f995['MOUNT_VOICE_STUDIO'], ..._0x597500),
      resumeVoiceSeparation: (_0x43de28) =>
        _0x4e3281(_0x43f995['RESUME_VOICE_EXTRACTION'], _0x43de28, {}, { applyCallbackResult: ![] }),
      resolveCharacterVoiceUrl: getCharacterVoiceUrl,
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    {
      bindSourcePlayback: _0x3324fa,
      canDropOnAudioParam: _0x112ccc,
      clearDropTarget: _0x308696,
      destroy: _0x773f3f,
      destroySourcePlaybackBindings: _0x379113,
      mount: _0x46feac,
      playPreview: _0x50e1f0,
      refreshSourceCards: _0x152aca,
      resetDropEligibility: _0x49234b,
      selectSource: _0x43d4f5,
      selectVoiceAsset: _0x3400a4,
      setDropTarget: _0x1454c7,
      stopPreview: _0x196980,
      syncPreviewUi: _0x2929aa,
      unmount: _0xb8cf88,
    } = _0x124a6a,
    _0x84de04 = () => {
      (_0x42cf44['forEach']((_0x25ad5f) => _0x25ad5f?.['destroy']?.()), (_0x42cf44 = []));
      const _0x432876 = _0x42b7b0?.['querySelector']?.('.story-audio-detail');
      if (_0x432876?.['ownerDocument']) _0x42cf44['push'](bindWorkspaceSelects(_0x432876));
      _0x42cf44['push'](bindPersonReplacementPricing(_0x42b7b0, () => _0x57b9e5));
      const _0xa7da9 = createAudioPlaybackSurfaceController(
        _0x42b7b0?.['querySelector']?.(
          '.person-replacement-audio-playback[data-audio-playback-surface], .person-replacement-voice-library-playback[data-audio-playback-surface]',
        ),
        {
          onBeforePlay: _0x196980,
          onError: () => windowObject?.['showToast']?.('声音素材播放失败。', 'warn'),
        },
      );
      if (_0xa7da9) _0x42cf44['push'](_0xa7da9);
      _0x3324fa();
      let _0x56cd8d = null;
      _0x2fa649 = null;
      const _0x1b19ad = _0x42b7b0?.['querySelector']?.('[data-aigen-image-model-selector]');
      if (_0x1b19ad) {
        const _0x54b826 = _0x57b9e5['workspace']['step'] === 0x1,
          _0x4a58ec = _0x54b826
            ? _0x57b9e5['settings']['characterImageModelId']
            : _0x57b9e5['settings']['replacementImageModelId'],
          _0x308cc4 = _0x54b826
            ? _0x57b9e5['settings']['characterImageGenerationParams']
            : _0x57b9e5['settings']['replacementImageGenerationParams'],
          _0x3df977 = _0x54b826
            ? _0x57b9e5['settings']['characterImageProvider']
            : _0x57b9e5['settings']['replacementImageProvider'],
          _0xdd1473 = _0x54b826
            ? _0x57b9e5['settings']['characterImageProviderProfileId']
            : _0x57b9e5['settings']['replacementImageProviderProfileId'],
          _0x30cc82 = _0x54b826
            ? _0x57b9e5['settings']['characterImageProviderProfileIdByModel']
            : _0x57b9e5['settings']['replacementImageProviderProfileIdByModel'];
        _0x42cf44['push'](
          bindAIGenImageModelSelector(_0x1b19ad, {
            modelId: _0x4a58ec,
            provider: resolveModelProvider(_0x4a58ec, _0x3df977),
            generationParams: _0x308cc4,
            generationParamsByModel: _0x54b826
              ? _0x57b9e5['settings']['characterImageGenerationParamsByModel']
              : _0x57b9e5['settings']['replacementImageGenerationParamsByModel'],
            providerProfileId: _0xdd1473,
            providerProfileIdByModel: _0x30cc82,
            showSchemaControls: !![],
            documentObject: documentObject,
            windowObject: windowObject,
            floatingMenuHost: _0x42b7b0,
            schemaPopupPlacement: 'portal-auto-up',
            onChange: ({
              modelId: _0x432b41,
              provider: _0x1bfe8a,
              generationParams: _0x3d9c29,
              generationParamsByModel: _0x5ce64a,
              providerProfileId: _0x4826f7,
              providerProfileIdByModel: _0xc86fad,
            }) => {
              const _0x55d122 = { ..._0x57b9e5['settings'] };
              _0x54b826
                ? ((_0x55d122['characterImageModelId'] = _0x432b41),
                  (_0x55d122['characterImageProvider'] = resolveModelProvider(_0x432b41, _0x1bfe8a)),
                  (_0x55d122['characterImageGenerationParams'] = normalizeCharacterAssetImageGenerationParams(
                    _0x432b41,
                    _0x3d9c29,
                  )),
                  (_0x55d122['characterImageGenerationParamsByModel'] = _0x5ce64a),
                  (_0x55d122['characterImageProviderProfileId'] = _0x4826f7),
                  (_0x55d122['characterImageProviderProfileIdByModel'] = _0xc86fad))
                : ((_0x55d122['replacementImageModelId'] = _0x432b41),
                  (_0x55d122['replacementImageProvider'] = resolveModelProvider(_0x432b41, _0x1bfe8a)),
                  (_0x55d122['replacementImageGenerationParams'] = _0x3d9c29),
                  (_0x55d122['replacementImageGenerationParamsByModel'] = _0x5ce64a),
                  (_0x55d122['replacementImageProviderProfileId'] = _0x4826f7),
                  (_0x55d122['replacementImageProviderProfileIdByModel'] = _0xc86fad));
              ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
                ..._0x57b9e5,
                settings: _0x55d122,
              })),
                _0x273c17('image-model'));
              if (!_0x54b826) _0x4c1ba8();
              _0x56cd8d?.['sync']();
            },
          }),
        );
      }
      const _0x2dfdf4 = _0x42b7b0?.['querySelector']?.('[data-aigen-video-model-selector]');
      if (_0x2dfdf4) {
        const _0x55ae2b = personReplacementVideoPresentation['build'](_0x57b9e5),
          _0x304ff2 = resolvePersonReplacementVideoParameterPolicy({
            modelId: _0x57b9e5['settings']['replacementModelId'],
            inputMode: _0x57b9e5['settings']['replacementVideoInputMode'],
            generationParams: _0x57b9e5['settings']['replacementVideoGenerationParams'],
          });
        ((_0x2fa649 = bindAIGenVideoModelSelector(_0x2dfdf4, {
          modelId: _0x57b9e5['settings']['replacementModelId'],
          provider: resolveModelProvider(_0x57b9e5['settings']['replacementModelId']),
          generationParams: _0x304ff2['generationParams'],
          uiSchemaFieldState: _0x304ff2['uiSchemaFieldState'],
          providerProfileId: _0x57b9e5['settings']['replacementVideoProviderProfileId'],
          providerProfileIdByModel: _0x57b9e5['settings']['replacementVideoProviderProfileIdByModel'],
          referenceCounts: _0x55ae2b['slotState']['referenceCounts'],
          showSchemaControls: !![],
          allowedModelIds: PERSON_REPLACEMENT_VIDEO_MODEL_IDS,
          documentObject: documentObject,
          windowObject: windowObject,
          floatingMenuHost: _0x42b7b0,
          modelSubmenuPlacement: 'viewport-auto-up',
          schemaPopupPlacement: 'viewport-auto-up',
          onChange: ({
            modelId: _0xf7f0e6,
            generationParams: _0x1ae786,
            providerProfileId: _0x372d66,
            providerProfileIdByModel: _0x1e6ac8,
          }) => {
            const _0x3b30e1 = resolvePersonReplacementVideoParameterPolicy({
              modelId: _0xf7f0e6,
              inputMode: _0x57b9e5['settings']['replacementVideoInputMode'],
              generationParams: _0x1ae786,
              resetModeDefaults: _0xf7f0e6 !== _0x57b9e5['settings']['replacementModelId'],
            });
            _0x57b9e5 = normalizePersonReplacementWorkspaceProject({
              ..._0x57b9e5,
              settings: {
                ..._0x57b9e5['settings'],
                replacementModelId: _0xf7f0e6,
                replacementVideoGenerationParams: _0x3b30e1['generationParams'],
                replacementVideoProviderProfileId: _0x372d66,
                replacementVideoProviderProfileIdByModel: _0x1e6ac8,
              },
            });
            const _0x1d31b4 = _0x42b7b0?.['querySelector']?.(
              '[data-person-replacement-video-reference-inputs]',
            );
            if (_0x1d31b4) {
              const _0x43be97 = personReplacementIdentityPresentation['buildVideo'](
                  _0x57b9e5,
                  personReplacementVideoPresentation['build'](_0x57b9e5),
                )['referenceInputsHtml'],
                _0x165b04 = typeof _0x1d31b4['cloneNode'] === 'function' ? _0x1d31b4['cloneNode'](![]) : null;
              (_0x165b04 && (_0x165b04['innerHTML'] = _0x43be97),
                (!_0x165b04 ||
                  !reconcilePersonReplacementReferenceInputs({
                    currentInputs: _0x1d31b4,
                    nextInputs: _0x165b04,
                  })) &&
                  (_0x1d31b4['innerHTML'] = _0x43be97));
            }
            (_0x273c17('video-model'), _0x56cd8d?.['sync']());
          },
        })),
          _0x42cf44['push'](_0x2fa649));
      }
      const _0x4ea010 =
        _0x57b9e5['workspace']['step'] === 0x1
          ? {
              panel: _0x42b7b0?.['querySelector']?.('.story-asset-detail-panel .story-asset-prompt-field'),
              modelSetting: 'characterImageModelId',
              providerSetting: 'characterImageProvider',
              profileSetting: 'characterImageProviderProfileId',
              memorySetting: 'characterImageProviderProfileIdByModel',
            }
          : _0x57b9e5['workspace']['step'] === 0x2
            ? {
                panel: _0x42b7b0?.['querySelector']?.(
                  '.person-replacement-image-generation-panel .person-replacement-prompt-input-wrapper',
                ),
                modelSetting: 'replacementImageModelId',
                providerSetting: 'replacementImageProvider',
                profileSetting: 'replacementImageProviderProfileId',
                memorySetting: 'replacementImageProviderProfileIdByModel',
              }
            : _0x57b9e5['workspace']['step'] === 0x3
              ? {
                  panel: _0x42b7b0?.['querySelector']?.(
                    '.person-replacement-video-generation-panel .person-replacement-prompt-input-wrapper',
                  ),
                  modelSetting: 'replacementModelId',
                  providerSetting: '',
                  profileSetting: 'replacementVideoProviderProfileId',
                  memorySetting: 'replacementVideoProviderProfileIdByModel',
                }
              : null;
      _0x4ea010?.['panel'] &&
        ((_0x56cd8d = createModelProviderProfileControl({
          panel: _0x4ea010['panel'],
          getNodeData: () => ({
            model: _0x57b9e5['settings'][_0x4ea010['modelSetting']],
            provider: _0x4ea010['providerSetting']
              ? _0x57b9e5['settings'][_0x4ea010['providerSetting']]
              : resolveModelProvider(_0x57b9e5['settings'][_0x4ea010['modelSetting']]),
            providerProfileId: _0x57b9e5['settings'][_0x4ea010['profileSetting']],
            providerProfileIdByModel: _0x57b9e5['settings'][_0x4ea010['memorySetting']],
          }),
          onChange: (_0x5d9222) => {
            if (
              _0x4ea010['profileSetting'] === 'replacementVideoProviderProfileId' &&
              _0x2fa649?.['applyProviderProfilePatch']?.(_0x5d9222)
            )
              return;
            ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
              ..._0x57b9e5,
              settings: {
                ..._0x57b9e5['settings'],
                [_0x4ea010['profileSetting']]: _0x5d9222['providerProfileId'],
                [_0x4ea010['memorySetting']]: _0x5d9222['providerProfileIdByModel'],
              },
            })),
              _0x273c17('provider-profile'),
              _0x56cd8d?.['sync']());
          },
        })),
        _0x42cf44['push']({ destroy: () => _0x56cd8d?.['remove']() }));
    },
    _0x3d140b = (_0x4ee09f) => {
      const _0x4b0181 = personReplacementImagePresentation['build'](_0x57b9e5)['selectedShot'];
      if (!_0x4ee09f || !_0x4b0181) return null;
      const _0xd39599 = normalizeText(_0x57b9e5['id']),
        _0x1d60be = normalizeText(_0x4b0181['id']),
        _0x184faa = () =>
          normalizeText(_0x57b9e5['id']) === _0xd39599
            ? _0x57b9e5['shots']['find']((_0x679da7) => normalizeText(_0x679da7['id']) === _0x1d60be)
            : null;
      return {
        nodeId: 'person-replacement-image:' + _0x1d60be,
        promptEl: _0x4ee09f,
        keepAssetMentionPills: !![],
        _data: {
          type: 'ai-image',
          model: _0x57b9e5['settings']['replacementImageModelId'],
          provider: resolveModelProvider(
            _0x57b9e5['settings']['replacementImageModelId'],
            _0x57b9e5['settings']['replacementImageProvider'],
          ),
        },
        getMentionMenuPages: () => [{ id: 'assets', label: '素材', icon: 'assets' }],
        getMentionMenuDefaultPage: () => 'assets',
        getMentionCandidates: ({ query: query = '' } = {}) =>
          buildPersonReplacementPromptMentionCandidates(_0x57b9e5, { query: query, shot: _0x184faa() }),
        getMentionVisual: ({ mention: _0x32be14, pill: _0x487e6f } = {}) => {
          const _0x22b710 = _0x32be14?.['thumbUrl']
            ? _0x32be14
            : resolvePersonReplacementPromptMentionRef(_0x487e6f, { project: _0x57b9e5, shot: _0x184faa() });
          return {
            thumbUrl: normalizeMediaUrl(_0x22b710?.['thumbUrl'] || _0x22b710?.['url']),
            iconType: 'image',
          };
        },
        commitPromptHtml: (_0xa0a0c0) => {
          if (!_0x184faa()) return;
          ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
            ..._0x57b9e5,
            shots: _0x57b9e5['shots']['map']((_0x1efe87) =>
              normalizeText(_0x1efe87['id']) === _0x1d60be
                ? { ..._0x1efe87, imagePrompt: sanitizePromptHtmlForCommit(_0xa0a0c0) }
                : _0x1efe87,
            ),
          })),
            _0x273c17('image-prompt'));
        },
        getPromptHtml: () => normalizeText(_0x184faa()?.['imagePrompt']),
      };
    },
    _0x3d9d7b = () => {
      (_0x5cb732?.(), (_0x5cb732 = null));
      if (_0x57b9e5['workspace']['view'] !== 'project' || _0x57b9e5['workspace']['step'] !== 0x2) return;
      const _0x5d1359 = _0x42b7b0?.['querySelector']?.(
          '[data-person-replacement-field=\x22image-prompt\x22][contenteditable=\x22true\x22]',
        ),
        _0x5cae8b = _0x3d140b(_0x5d1359);
      if (!_0x5cae8b) return;
      const _0x9d27c0 = bindPromptMentionHost(_0x5cae8b);
      _0x5cb732 = () => _0x9d27c0?.['destroy']?.();
    },
    _0x2538e3 = () => {
      (_0x3e5d6c?.(), (_0x3e5d6c = null));
      if (_0x57b9e5['workspace']['view'] !== 'project' || _0x57b9e5['workspace']['step'] !== 0x2) return;
      const _0x5293bb =
        _0x42b7b0?.['querySelector']?.(
          '.person-replacement-middle-preview-slide:not(' +
            '.person-replacement-middle-preview-slide--outgoing) ' +
            '[data-person-replacement-keyframe-stage]\x20>\x20img',
        ) || _0x42b7b0?.['querySelector']?.('[data-person-replacement-keyframe-stage] > img');
      if (!_0x5293bb) return;
      const _0x230d76 = () => syncPersonReplacementImageStageFrame(_0x5293bb);
      if (_0x5293bb['complete'] && Number(_0x5293bb['naturalWidth']) > 0x0) _0x230d76();
      else _0x5293bb['addEventListener']?.('load', _0x230d76, { once: !![] });
      const _0x518e92 = _0x5293bb['closest']?.('[data-person-replacement-keyframe-stage]')?.['parentElement'],
        _0x48b05f = windowObject?.['ResizeObserver'],
        _0x1610c2 = typeof _0x48b05f === 'function' ? new _0x48b05f(_0x230d76) : null;
      (_0x1610c2?.['observe']?.(_0x518e92),
        windowObject?.['addEventListener']?.('resize', _0x230d76),
        (_0x3e5d6c = () => {
          (_0x5293bb['removeEventListener']?.('load', _0x230d76),
            _0x1610c2?.['disconnect']?.(),
            windowObject?.['removeEventListener']?.('resize', _0x230d76));
        }));
    },
    _0x57f715 = createPersonReplacementBatchGenerationController({
      getProject: () => _0x57b9e5,
      buildImagePresentation: (_0x3601d8) => personReplacementImagePresentation['build'](_0x3601d8),
      getCharacterAppearance: getCharacterAppearance,
      runRequest: (..._0x30f1c0) => _0x267b3(..._0x30f1c0),
      requestRender: () => _0x4cf492(),
      refreshShotSelectionControls: () => _0x4c1ba8(),
      resolveCharacterImageBatchConcurrency: _0x52549f(
        _0x43f995['RESOLVE_CHARACTER_IMAGE_BATCH_CONCURRENCY'],
      ),
      onGenerateReplacementImageRequested: _0x52549f(_0x43f995['GENERATE_REPLACEMENT_IMAGE']),
      onCancelReplacementImageRequested: _0x52549f(_0x43f995['CANCEL_REPLACEMENT_IMAGE']),
      onGenerateReplacementVideoRequested: _0x52549f(_0x43f995['GENERATE_REPLACEMENT_VIDEO']),
      onCancelReplacementVideoRequested: _0x52549f(_0x43f995['CANCEL_REPLACEMENT_VIDEO']),
      onGenerateCharacterImageRequested: _0x52549f(_0x43f995['GENERATE_CHARACTER_IMAGE']),
      onGenerationBatchCompleted: _0x52549f(_0x43f995['COMPLETE_GENERATION_BATCH']),
      windowObject: windowObject,
    }),
    {
      cancelAssetBatch: _0x3f648b,
      cancelShotBatch: _0x1d3a8e,
      destroy: _0xc2e7d1,
      getAssetRenderState: _0x546595,
      getShotRenderState: _0x53365b,
      isShotBatchForCurrentProject: _0x4fea56,
      runAssetBatch: _0x5e8e9c,
      runShotBatch: _0x2daac8,
    } = _0x57f715,
    _0x1f9cef = () => {
      const _0xb256ac = _0x53365b(),
        _0xa80fad = _0x546595();
      return _0x24b921['getWorkspacePresentation']({
        shotBatchGenerationActive: _0xb256ac['active'],
        shotBatchGenerationLabel: _0xb256ac['label'],
        shotBatchGeneratingShotIds: _0xb256ac['generatingShotIds'],
        shotBatchCancelRequested: _0xb256ac['cancelRequested'],
        assetBatchGenerationActive: _0xa80fad['active'],
        assetBatchGenerationLabel: _0xa80fad['label'],
        assetBatchGeneratingCharacterIds: _0xa80fad['generatingCharacterIds'],
        assetBatchCancelRequested: _0xa80fad['cancelRequested'],
        canvasSyncPending: _0x1b7b58,
        canvasSyncScope: _0x47513d,
        composeOutputPending: _0x4fcdf7,
        exportOutputPending: _0x463a8b,
        canvasSyncOverlayInline: ![],
        assetLibraryDisclosure: _0x5b9bfb,
        assetUploadPendingKinds: ['character', 'scene', 'audio']['filter']((_0x15f889) =>
          _0x29b772['has'](_0x7a45ba(_0x15f889)),
        ),
        voiceLibraryTargetCharacterId: _0x834763,
        promptEnhancementModel: _0x4ad4fe(_0x43f995['GET_PROMPT_ENHANCEMENT_MODEL']) || {},
      });
    },
    _0x218b57 = () => {
      const _0x13da3e = _0x42b7b0?.['querySelector']?.('#person-replacement-shot-cut-smart-detect-panel');
      if (!_0x13da3e?.['style']) return ![];
      const _0x313e6a =
        Number(windowObject?.['innerWidth'] || documentObject?.['documentElement']?.['clientWidth']) || 0x0;
      if (_0x313e6a <= 0x2d0)
        return (
          ['top', 'right', 'bottom', 'left']['forEach']((_0x5803f1) => {
            _0x13da3e['style']['removeProperty']?.(_0x5803f1);
          }),
          !![]
        );
      const _0x51baa2 = _0x42b7b0?.['querySelector']?.(
          '[data-person-replacement-action="toggle-shot-cut-smart-detect"]',
        ),
        _0x39ccda = _0x51baa2?.['getBoundingClientRect']?.(),
        _0x15fc12 = _0x13da3e['getBoundingClientRect']?.();
      if (!_0x39ccda || !_0x15fc12) return ![];
      const _0x160409 =
          Number(windowObject?.['innerHeight'] || documentObject?.['documentElement']?.['clientHeight']) ||
          0x0,
        _0x4a2b6f = 0x10,
        _0x21ae43 = 0x8,
        _0x127012 = Math['max'](
          _0x4a2b6f,
          Math['min'](_0x313e6a - _0x15fc12['width'] - _0x4a2b6f, _0x39ccda['right'] - _0x15fc12['width']),
        ),
        _0x5a39d9 = _0x39ccda['bottom'] + _0x21ae43,
        _0x658218 =
          _0x5a39d9 + _0x15fc12['height'] <= _0x160409 - _0x4a2b6f
            ? _0x5a39d9
            : Math['max'](_0x4a2b6f, _0x39ccda['top'] - _0x15fc12['height'] - _0x21ae43);
      return (
        _0x13da3e['style']['setProperty']?.('top', _0x658218 + 'px'),
        _0x13da3e['style']['setProperty']?.('right', 'auto'),
        _0x13da3e['style']['setProperty']?.('bottom', 'auto'),
        _0x13da3e['style']['setProperty']?.('left', _0x127012 + 'px'),
        !![]
      );
    },
    _0x11a836 = () => {
      if (_0x4e4610['isSmartDetectOpen']) _0x218b57();
    },
    _0x1dc794 = (_0x4851b3) => {
      const _0xa7aa90 = documentObject?.['createElement']?.('div');
      if (!_0xa7aa90) return null;
      return ((_0xa7aa90['innerHTML'] = String(_0x4851b3 || '')['trim']()), _0xa7aa90['firstElementChild']);
    },
    _0x3ff432 = () => {
      const _0x569e4b = _0x42b7b0?.['querySelector']?.(
        '[data-person-replacement-compare-card="replacement"] .person-replacement-compare-media-frame',
      );
      if (!_0x569e4b) return ![];
      (_0x569e4b['classList']?.['toggle']?.('img-preview-loading', _0x4fcdf7),
        _0x569e4b['setAttribute']?.('aria-busy', String(_0x4fcdf7)));
      if (_0x4fcdf7) _0x569e4b['setAttribute']?.('inert', '');
      else _0x569e4b['removeAttribute']?.('inert');
      const _0x55826f = _0x569e4b['querySelector']?.('.story-asset-loading-overlay');
      if (_0x4fcdf7 && !_0x55826f) {
        const _0x2eef20 = _0x1dc794(
          renderWorkspaceAssetLoadingOverlay({
            title: '视频合成中',
            description: '正在合成替换片段，完成后会自动显示完整视频。',
          }),
        );
        if (_0x2eef20) _0x569e4b['appendChild']?.(_0x2eef20);
      } else !_0x4fcdf7 && _0x55826f?.['remove']?.();
      return !![];
    },
    _0x245ac4 = (_0x264ed2, _0x311526) => {
      if (!_0x264ed2) return;
      try {
        _0x264ed2['inert'] = _0x311526;
      } catch {
        if (_0x311526) _0x264ed2['setAttribute']?.('inert', '');
        else _0x264ed2['removeAttribute']?.('inert');
      }
      if (_0x311526) _0x264ed2['setAttribute']?.('inert', '');
      else _0x264ed2['removeAttribute']?.('inert');
    },
    _0x13053b = ({ restoreFocus: restoreFocus = !![] } = {}) => {
      (_0x1ffaf2['forEach']((_0x3bc680, _0x2bb3c6) => {
        _0x245ac4(_0x2bb3c6, _0x3bc680);
      }),
        _0x1ffaf2['clear'](),
        _0x3b1585?.['remove']?.(),
        (_0x3b1585 = null),
        documentObject?.['body']?.['classList']?.['remove']?.('person-replacement-canvas-sync-active'),
        _0x42b7b0?.['classList']?.['remove']?.('is-canvas-sync-pending'),
        _0x42b7b0?.['setAttribute']?.('aria-busy', 'false'));
      if (
        restoreFocus &&
        _0x42b7b0?.['hidden'] === ![] &&
        _0xbd6d44 &&
        _0xbd6d44['isConnected'] !== ![] &&
        typeof _0xbd6d44['focus'] === 'function'
      )
        try {
          _0xbd6d44['focus']({ preventScroll: !![] });
        } catch {
          _0xbd6d44['focus']();
        }
      _0xbd6d44 = null;
    },
    _0x59adb4 = ({ captureFocus: captureFocus = ![] } = {}) => {
      if (!_0x1b7b58) {
        _0x13053b();
        return;
      }
      const _0x2fc525 = documentObject?.['body'];
      if (!_0x2fc525) return;
      if (captureFocus) {
        const _0x840c8a = documentObject?.['activeElement'];
        _0xbd6d44 = _0x42b7b0?.['contains']?.(_0x840c8a) ? _0x840c8a : null;
      }
      if (!_0x3b1585) {
        _0x3b1585 = _0x1dc794(
          personReplacementShellPresentation['renderCanvasSyncLoadingOverlay']({ canvasSyncPending: !![] }),
        );
        if (_0x3b1585) _0x2fc525['appendChild']?.(_0x3b1585);
      }
      (Array['from'](_0x2fc525['children'] || [])['forEach']((_0x3458b9) => {
        if (_0x3458b9 === _0x3b1585) return;
        (!_0x1ffaf2['has'](_0x3458b9) &&
          _0x1ffaf2['set'](
            _0x3458b9,
            Boolean(_0x3458b9?.['inert'] || _0x3458b9?.['hasAttribute']?.('inert')),
          ),
          _0x245ac4(_0x3458b9, !![]));
      }),
        documentObject['body']?.['classList']?.['add']?.('person-replacement-canvas-sync-active'),
        _0x42b7b0?.['classList']?.['add']?.('is-canvas-sync-pending'),
        _0x42b7b0?.['setAttribute']?.('aria-busy', 'true'));
      try {
        _0x3b1585?.['focus']?.({ preventScroll: !![] });
      } catch {
        _0x3b1585?.['focus']?.();
      }
    },
    _0xfd0282 = () => '[data-person-replacement-shot-timeline-scroll]',
    _0x4c34e9 = (_0x3624a2) => {
      const _0xbfd19d = normalizeText(_0x57b9e5['workspace']['selectedShotId']);
      Array['from'](_0x3624a2?.['querySelectorAll']?.('[data-person-replacement-shot-card="true"]') || [])[
        'forEach'
      ]((_0x5ae14d) => {
        const _0x397160 = normalizeText(_0x5ae14d['dataset']?.['shotId']) === _0xbfd19d;
        (_0x5ae14d['classList']?.['toggle']?.('is-selected', _0x397160),
          _0x5ae14d['setAttribute']?.('aria-current', String(_0x397160)));
      });
    },
    _0x124d27 = () => {
      (_0x58b712(),
        _0x3c691d(),
        _0x42cf44['forEach']((_0x490ae5) => _0x490ae5?.['destroy']?.()),
        (_0x42cf44 = []),
        _0x379113(),
        _0x5cb732?.(),
        (_0x5cb732 = null),
        _0x3e5d6c?.(),
        (_0x3e5d6c = null));
    },
    _0x16d8a2 = () => {
      const _0x13f245 = _0x57b9e5['workspace']['step'] === 0x2 && !_0x4e4610['isOpen'];
      _0x2e8658({ manualSelectionSurfaceActive: _0x13f245 });
    },
    _0x54458e = (_0x294e97) => {
      const _0x213131 = Number(_0x294e97?.['scrollLeft']) || 0x0,
        _0x2d10b4 = Number(_0x294e97?.['scrollTop']) || 0x0,
        _0x160a7e = _0x294e97?.['style']?.['overflowAnchor'] || '';
      _0x294e97?.['style']?.['setProperty']?.('overflow-anchor', 'none');
      const _0x30e332 = () => {
        if (!_0x294e97) return;
        ((_0x294e97['scrollLeft'] = _0x213131), (_0x294e97['scrollTop'] = _0x2d10b4));
      };
      return () => {
        _0x30e332();
        const _0x1656ef = () => {
          (_0x30e332(),
            _0x160a7e
              ? _0x294e97?.['style']?.['setProperty']?.('overflow-anchor', _0x160a7e)
              : _0x294e97?.['style']?.['removeProperty']?.('overflow-anchor'));
        };
        typeof windowObject?.['requestAnimationFrame'] === 'function'
          ? windowObject['requestAnimationFrame'](_0x1656ef)
          : _0x1656ef();
      };
    },
    _0x5f4137 = (_0x989098, _0x3dcc7e = _0x57b9e5['workspace']['selectedShotId']) => {
      const _0x2d30f9 = _0x53365b(),
        _0x854599 = _0x1dc794(
          personReplacementShotTimelinePresentation['renderTimeline'](_0x57b9e5, {
            allowCutEditing: !![],
            mode: 'image',
            isBatchGenerating: _0x2d30f9['active'],
            batchGenerationLabel: _0x2d30f9['label'],
            batchGeneratingShotIds: _0x2d30f9['generatingShotIds'],
            batchCancelRequested: _0x2d30f9['cancelRequested'],
          }),
        ),
        _0x3d4d63 = _0x854599?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]');
      if (!_0x989098 || !_0x3d4d63) return ![];
      const _0x329e30 = _0x54458e(_0x989098),
        _0x342ba9 = reconcilePersonReplacementShotTimelineCard({
          currentScroller: _0x989098,
          nextScroller: _0x3d4d63,
          shotId: _0x3dcc7e,
        });
      if (!_0x342ba9) return (_0x329e30(), ![]);
      return (_0x4c34e9(_0x989098), _0x329e30(), !![]);
    },
    _0x4c1ba8 = () => {
      if (
        _0x57b9e5['workspace']['view'] !== 'project' ||
        ![0x2, 0x3]['includes'](_0x57b9e5['workspace']['step']) ||
        _0x4e4610['isOpen']
      )
        return ![];
      const _0x4b5097 = _0x57b9e5['workspace']['step'] === 0x3,
        _0x34bfe0 = _0x53365b();
      syncPersonReplacementPromptModeControl(_0x42b7b0, _0x57b9e5, _0x34bfe0['generatingShotIds']);
      const _0x519fa9 = _0x42b7b0?.['querySelector']?.('.person-replacement-shot-timeline'),
        _0x597a89 = _0x1dc794(
          personReplacementShotTimelinePresentation['renderTimeline'](_0x57b9e5, {
            allowCutEditing: !_0x4b5097,
            mode: _0x4b5097 ? 'video' : 'image',
            isBatchGenerating: _0x34bfe0['active'],
            batchGenerationLabel: _0x34bfe0['label'],
            batchGeneratingShotIds: _0x34bfe0['generatingShotIds'],
            batchCancelRequested: _0x34bfe0['cancelRequested'],
          }),
        ),
        _0x4bd350 = _0x519fa9?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
        _0x41db2e = _0x597a89?.['querySelector']?.('[data-person-replacement-shot-timeline-scroll]'),
        _0x435682 = _0x42b7b0?.['querySelector']?.(
          _0x4b5097
            ? '[data-person-replacement-action="generate-replacement-video"]'
            : '[data-person-replacement-action=\x22generate-replacement-image\x22]',
        ),
        _0x1ec60a = _0x1f9cef(),
        _0x4e700d = _0x4b5097
          ? personReplacementVideoPresentation['build'](_0x57b9e5)
          : personReplacementImagePresentation['build'](_0x57b9e5, _0x1ec60a['shotBatchGeneratingShotIds']),
        _0x14862a = _0x1dc794(
          _0x4b5097
            ? personReplacementVideoPresentation['renderGenerateButton'](_0x57b9e5, {
                presentation: _0x4e700d,
                ..._0x1ec60a,
              })
            : personReplacementImagePresentation['renderGenerateButton'](_0x57b9e5, {
                presentation: _0x4e700d,
                ..._0x1ec60a,
              }),
        );
      if (
        !_0x519fa9 ||
        !_0x597a89 ||
        !_0x4bd350 ||
        !_0x41db2e ||
        !_0x435682 ||
        !_0x14862a ||
        typeof _0x519fa9['replaceWith'] !== 'function' ||
        typeof _0x435682['replaceWith'] !== 'function'
      )
        return ![];
      const _0x42c31e = _0x54458e(_0x4bd350);
      if (!reconcilePersonReplacementShotCardList({ currentList: _0x4bd350, nextList: _0x41db2e }))
        return (_0x42c31e(), ![]);
      (reconcileElementTree(_0x519fa9, _0x597a89, {
        preserveChildNodes: !![],
        preserveSelector: '[data-person-replacement-shot-timeline-scroll]',
      }),
        reconcileElementTree(_0x435682, _0x14862a, { preserveChildNodes: !![] }));
      if (!_0x4b5097) syncPersonReplacementImageGenerationLoading(_0x42b7b0, _0x4e700d);
      return (_0x42c31e(), _0x4aeba7?.['refresh'](), !![]);
    },
    _0x1fff09 = () => {
      if (
        _0x57b9e5['workspace']['view'] !== 'project' ||
        _0x57b9e5['workspace']['step'] !== 0x5 ||
        _0x4e4610['isOpen']
      )
        return ![];
      const _0x31f29b = _0x42b7b0?.['querySelector']?.('.person-replacement-preview-shot-rail'),
        _0x439b53 = _0x1dc794(
          personReplacementCompositePreviewPresentation['renderRail'](
            buildPersonReplacementCompositePreviewSnapshot(_0x57b9e5),
          ),
        ),
        _0x21c8de = _0x42b7b0?.['querySelector']?.('.person-replacement-preview-actions--toolbar'),
        _0x3314e7 = _0x1dc794(
          personReplacementShellPresentation['renderToolbarActions'](_0x57b9e5, _0x1f9cef()),
        ),
        _0x47a4b7 = _0x31f29b?.['querySelector']?.('.person-replacement-preview-shot-list'),
        _0x387c4f = _0x439b53?.['querySelector']?.('.person-replacement-preview-shot-list');
      if (
        !_0x31f29b ||
        !_0x439b53 ||
        !_0x21c8de ||
        !_0x3314e7 ||
        typeof _0x31f29b['replaceWith'] !== 'function' ||
        typeof _0x21c8de['replaceWith'] !== 'function'
      )
        return ![];
      const _0x1c0649 = _0x47a4b7 && _0x387c4f ? _0x54458e(_0x47a4b7) : null;
      if (_0x47a4b7 && _0x387c4f) {
        if (!reconcilePersonReplacementShotCardList({ currentList: _0x47a4b7, nextList: _0x387c4f }))
          return (_0x1c0649?.(), ![]);
        _0x387c4f['replaceWith'](_0x47a4b7);
      }
      return (_0x31f29b['replaceWith'](_0x439b53), _0x21c8de['replaceWith'](_0x3314e7), _0x1c0649?.(), !![]);
    },
    _0x539642 = () => {
      if (
        _0x57b9e5['workspace']['view'] !== 'project' ||
        _0x57b9e5['workspace']['step'] !== 0x5 ||
        _0x4e4610['isOpen']
      )
        return ![];
      const _0x2970d3 = _0x42b7b0?.['querySelector']?.('[data-person-replacement-composite-preview]'),
        _0x381dcb = _0x1dc794(renderCompositePreview(_0x57b9e5, _0x1f9cef())),
        _0x1fc275 = _0x2970d3?.['querySelector']?.('.person-replacement-preview-shot-list'),
        _0x1ae558 = _0x381dcb?.['querySelector']?.('.person-replacement-preview-shot-list');
      if (
        !_0x2970d3 ||
        !_0x381dcb ||
        !_0x1fc275 ||
        !_0x1ae558 ||
        typeof _0x2970d3['replaceWith'] !== 'function' ||
        typeof _0x1ae558['replaceWith'] !== 'function'
      )
        return ![];
      const _0x51400d = _0x54458e(_0x1fc275);
      if (!reconcilePersonReplacementShotCardList({ currentList: _0x1fc275, nextList: _0x1ae558 }))
        return (_0x51400d(), ![]);
      return (
        _0x1ae558['replaceWith'](_0x1fc275),
        _0x58b712(),
        _0x2d6050(),
        _0xa770b0(),
        _0x2970d3['replaceWith'](_0x381dcb),
        _0x51400d(),
        _0x1d0ea5(),
        !![]
      );
    },
    _0x593f36 = ({
      refreshTimelineCard: refreshTimelineCard = ![],
      timelineShotId: timelineShotId = _0x57b9e5['workspace']['selectedShotId'],
    } = {}) => {
      if (
        _0x57b9e5['workspace']['view'] !== 'project' ||
        ![0x2, 0x3]['includes'](_0x57b9e5['workspace']['step']) ||
        _0x4e4610['isOpen']
      )
        return ![];
      const _0x23e1b7 = _0x42b7b0?.['querySelector']?.('.person-replacement-production-page'),
        _0xf759ca = _0x57b9e5['workspace']['step'] === 0x3,
        _0x264360 = _0x1f9cef(),
        _0x3f4805 = _0x1dc794(
          _0xf759ca
            ? personReplacementVideoPresentation['render'](_0x57b9e5, _0x264360)
            : personReplacementImagePresentation['render'](_0x57b9e5, {
                ..._0x264360,
                omitShotTimeline: !![],
              }),
        ),
        _0x1a1875 = _0xfd0282(),
        _0x3773a1 = _0x23e1b7?.['querySelector']?.(_0x1a1875),
        _0x35fdc3 = _0x3f4805?.['querySelector']?.(_0x1a1875),
        _0x5cca93 = _0x23e1b7?.['querySelector']?.('.person-replacement-middle-layout'),
        _0x4beacd = _0x3f4805?.['querySelector']?.('.person-replacement-middle-layout'),
        _0x11c522 = _0x5cca93?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]');
      if (_0xf759ca) {
        if (!_0x23e1b7 || !_0x3f4805 || !_0x3773a1 || !_0x35fdc3) return ![];
        const _0x4f81d9 = _0x54458e(_0x3773a1);
        if (!reconcilePersonReplacementVideoShotSelection({ currentPage: _0x23e1b7, nextPage: _0x3f4805 }))
          return ![];
        return (_0x124d27(), _0x4f81d9(), _0x16d8a2(), _0x3d9d7b(), _0x84de04(), _0x2fb45b(), !![]);
      }
      if (!_0x3773a1 || !_0x5cca93 || !_0x4beacd || !_0x11c522) return ![];
      if (refreshTimelineCard && !_0x5f4137(_0x3773a1, timelineShotId)) return ![];
      if (!refreshTimelineCard) _0x4c34e9(_0x3773a1);
      (_0x58b712(), _0x5cb732?.(), (_0x5cb732 = null));
      if (!reconcilePersonReplacementImageShotSelection({ currentPage: _0x23e1b7, nextPage: _0x3f4805 }))
        return ![];
      return (_0x16d8a2(), _0x3d9d7b(), _0x2538e3(), !![]);
    },
    _0x59d0d2 = () => {
      if (
        _0x57b9e5['workspace']['view'] !== 'project' ||
        _0x57b9e5['workspace']['step'] !== 0x3 ||
        _0x4e4610['isOpen'] ||
        _0x2ba69b['isClipActive']()
      )
        return ![];
      const _0x55c679 = _0x42b7b0?.['querySelector']?.('.person-replacement-production-page'),
        _0x54b76c = _0x1dc794(personReplacementVideoPresentation['render'](_0x57b9e5, _0x1f9cef())),
        _0x150b65 = _0x55c679?.['querySelector']?.('[data-person-replacement-video-playback-stage="source"]'),
        _0x522003 = _0x54b76c?.['querySelector']?.('[data-person-replacement-video-playback-stage="source"]'),
        _0x1e13a2 = shouldReusePersonReplacementVideoPlaybackStage(_0x150b65, _0x522003),
        _0x3693a6 = _0x55c679?.['querySelector']?.('.person-replacement-video-reference-assets'),
        _0x192922 = _0x54b76c?.['querySelector']?.('.person-replacement-video-reference-assets'),
        _0x46868b = _0x55c679?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
        _0xe5256a = _0x54b76c?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
        _0x121789 = _0x46868b?.['querySelector']?.('.person-replacement-shot-timeline-scroll'),
        _0x3b4b04 = _0xe5256a?.['querySelector']?.('.person-replacement-shot-timeline-scroll'),
        _0x1e1afe = _0x55c679?.['querySelector']?.('.person-replacement-video-generation-panel'),
        _0x3ebaa5 = _0x54b76c?.['querySelector']?.('.person-replacement-video-generation-panel'),
        _0x5d232c = _0x1e1afe?.['querySelector']?.('[data-person-replacement-video-reference-inputs]'),
        _0x4ee1e0 = _0x3ebaa5?.['querySelector']?.('[data-person-replacement-video-reference-inputs]'),
        _0x2fae36 = _0x1e1afe?.['querySelector']?.(
          '[data-person-replacement-field="video-prompt"][contenteditable="true"]',
        ),
        _0x37a041 = _0x3ebaa5?.['querySelector']?.(
          '[data-person-replacement-field="video-prompt"][contenteditable="true"]',
        ),
        _0x4997e3 = _0x1e1afe?.['querySelector']?.('[data-person-replacement-video-playback-stage="result"]'),
        _0x514813 = _0x3ebaa5?.['querySelector']?.(
          '[data-person-replacement-video-playback-stage=\x22result\x22]',
        ),
        _0x130509 =
          shouldReusePersonReplacementVideoPlaybackStage(_0x4997e3, _0x514813) &&
          typeof _0x514813?.['replaceWith'] === 'function',
        _0x59b684 = _0x55c679?.['querySelector']?.('.person-replacement-step-footer'),
        _0x13da21 = _0x54b76c?.['querySelector']?.('.person-replacement-step-footer'),
        _0xc10e9c = [
          ...(!_0x1e13a2
            ? [
                [
                  _0x55c679?.['querySelector']?.('.person-replacement-middle-preview-slide'),
                  _0x54b76c?.['querySelector']?.('.person-replacement-middle-preview-slide'),
                ],
              ]
            : []),
          [_0x46868b, _0xe5256a],
          [_0x1e1afe, _0x3ebaa5],
          [_0x59b684, _0x13da21],
        ];
      if (
        !_0x55c679 ||
        !_0x54b76c ||
        !_0x121789 ||
        !_0x3b4b04 ||
        !_0x3693a6 ||
        !_0x192922 ||
        !_0x5d232c ||
        !_0x4ee1e0 ||
        !_0x2fae36 ||
        !_0x37a041 ||
        _0xc10e9c['some'](
          ([_0x3b4c8b, _0x3d586e]) =>
            !_0x3b4c8b || !_0x3d586e || typeof _0x3b4c8b['replaceWith'] !== 'function',
        )
      )
        return ![];
      const _0x1c0a38 = _0x54458e(_0x121789);
      if (!reconcilePersonReplacementShotCardList({ currentList: _0x121789, nextList: _0x3b4b04 }))
        return (_0x1c0a38(), ![]);
      (_0x58b712(), reconcileElementTree(_0x3693a6, _0x192922, { preserveChildNodes: !![] }));
      if (!_0x130509) _0x2ba69b['destroyRole']('result');
      if (!_0x1e13a2) _0x2ba69b['destroyRole']('source');
      (_0xc10e9c['forEach'](([_0x1698e1, _0x5b5273]) => {
        reconcileElementTree(_0x1698e1, _0x5b5273, {
          preserveChildNodes: !![],
          preserveSelector:
            '[data-person-replacement-result-history-menu], .person-replacement-shot-timeline-scroll, [data-aigen-video-model-selector], .person-replacement-prompt-input-wrapper' +
            (_0x130509 ? ', [data-person-replacement-video-playback-stage="result"]' : ''),
        });
      }),
        _0x1c0a38(),
        _0x2fa649?.['syncContext']?.({
          ...resolvePersonReplacementVideoParameterPolicy({
            modelId: _0x57b9e5['settings']['replacementModelId'],
            inputMode: _0x57b9e5['settings']['replacementVideoInputMode'],
            generationParams: _0x57b9e5['settings']['replacementVideoGenerationParams'],
          }),
          referenceCounts:
            personReplacementVideoPresentation['build'](_0x57b9e5)['slotState']['referenceCounts'],
        }));
      if (_0x130509) _0x31cf87();
      else _0x2fb45b({ roles: ['result'], reset: ![] });
      if (!_0x1e13a2) _0x2fb45b({ roles: ['source'], reset: ![] });
      return !![];
    };
  _0x1c8531 = (
    _0x51df5d,
    { timelineShotId: timelineShotId = _0x57b9e5['workspace']['selectedShotId'] } = {},
  ) => {
    const _0xfae2fe = normalizeText(_0x51df5d);
    if (
      _0x57b9e5['workspace']['step'] === 0x1 &&
      [
        'asset-selection-mode',
        'asset-selection-cancel',
        'asset-selection-all',
        'asset-selection',
        'scene-asset-selection',
      ]['includes'](_0xfae2fe)
    )
      return syncPersonReplacementAssetSelection(_0x42b7b0, renderAssetSettings(_0x57b9e5, _0x1f9cef()));
    if (
      _0x57b9e5['workspace']['step'] === 0x2 &&
      [
        'replacement-target-asset-select',
        'replacement-scene-asset-select',
        'target-appearance-preview-change',
      ]['includes'](_0xfae2fe)
    )
      return syncPersonReplacementAssetSelection(
        _0x42b7b0,
        personReplacementImagePresentation['render'](_0x57b9e5, { ..._0x1f9cef(), omitShotTimeline: !![] }),
        { targetRail: !![] },
      );
    if (
      _0x57b9e5['workspace']['step'] === 0x2 &&
      [
        'person-mapping',
        'person-mapping-current-shot',
        'person-mapping-clear',
        'person-mapping-clear-reference',
      ]['includes'](_0xfae2fe)
    )
      return _0x593f36();
    if (_0xfae2fe === 'shot-marquee' || _0xfae2fe['startsWith']('shot-selection'))
      return _0x57b9e5['workspace']['step'] === 0x5 ? _0x1fff09() : _0x4c1ba8();
    if (
      _0xfae2fe === 'video-input-mode' ||
      _0xfae2fe === 'video-reference-change' ||
      _0xfae2fe === 'replacement-video-result' ||
      _0xfae2fe === 'replacement-video-reference' ||
      _0xfae2fe === 'delete-replacement-video-result' ||
      ((_0xfae2fe === 'replacement-image-result' || _0xfae2fe === 'delete-replacement-image-result') &&
        _0x57b9e5['workspace']['step'] === 0x3)
    )
      return _0x59d0d2();
    if (
      (_0xfae2fe === 'replacement-image-result' || _0xfae2fe === 'delete-replacement-image-result') &&
      _0x57b9e5['workspace']['step'] === 0x2
    )
      return _0x593f36({ refreshTimelineCard: !![], timelineShotId: timelineShotId });
    if (_0xfae2fe === 'shot-select')
      return _0x57b9e5['workspace']['step'] === 0x5 ? _0x539642() : _0x593f36();
    if (_0xfae2fe === 'replacement-image-reference' && _0x57b9e5['workspace']['step'] === 0x2)
      return _0x593f36({ refreshTimelineCard: !![] });
    if (_0xfae2fe === 'composite-full-video-select') return _0x539642();
    return ![];
  };
  let _0x4cf492 = () => {
    if (!_0x42b7b0 || _0x2f325d) return;
    ((_0x236762 = null),
      _0x481bb9(),
      _0x2d6050(),
      _0x3c691d(),
      _0xa770b0(),
      _0x33e2c8(),
      _0x41541c(),
      _0x139716(),
      (_0x4e4610['pendingPreviewSeek'] = null),
      (_0x4e4610['hoverPreviewActive'] = ![]),
      (_0x4e4610['hoverPreviewTimeSec'] = null),
      _0x2a5781(),
      _0x42cf44['forEach']((_0x303b84) => _0x303b84?.['destroy']?.()),
      (_0x42cf44 = []),
      _0x379113(),
      _0x5cb732?.(),
      (_0x5cb732 = null),
      _0xb8cf88(),
      (_0x4e4610['playheadElement'] = null),
      (_0x4e4610['clockElement'] = null),
      (_0x42b7b0['dataset']['personReplacementView'] = _0x57b9e5['workspace']['view']),
      (_0x42b7b0['dataset']['personReplacementStep'] = String(_0x57b9e5['workspace']['step'])),
      (_0x42b7b0['innerHTML'] =
        _0x57b9e5['workspace']['view'] === 'home'
          ? personReplacementShellPresentation['renderHome'](_0x57b9e5)
          : renderProject(_0x57b9e5, _0x1f9cef())),
      _0x25fae1(),
      _0x3d9d7b(),
      _0x2538e3(),
      _0x84de04(),
      _0x2fb45b(),
      _0x1d0ea5(),
      _0x46feac(),
      _0x2929aa());
  };
  const _0x1a3d01 = (_0x30f352) => {
      const _0x520d3c = Math['trunc'](clamp(_0x30f352, 0x1, 0x5, _0x57b9e5['workspace']['step']));
      if (_0x520d3c > _0x57b9e5['workspace']['step'] && _0x4175c2())
        return (_0x3fc4d6('step-change', _0x520d3c), cloneJson(_0x57b9e5));
      const _0xe160b7 = getPersonReplacementStepGate(_0x57b9e5, _0x520d3c);
      if (_0x520d3c !== _0x57b9e5['workspace']['step'] && !_0xe160b7['allowed'])
        return (_0x3fc4d6(_0xe160b7['reason'], _0x520d3c), cloneJson(_0x57b9e5));
      return (
        _0x26bf5a({ animate: ![], renderWorkspace: ![] }),
        _0x26d845({ ..._0x57b9e5, workspace: { ..._0x57b9e5['workspace'], step: _0x520d3c } }, 'step-change')
      );
    },
    _0x4d5162 = (_0x5ed16b) =>
      handleWorkspaceStepShortcut(_0x5ed16b, {
        enabled: Boolean(
          _0x42b7b0 && !_0x42b7b0['hidden'] && !_0x1b7b58 && _0x57b9e5['workspace']['view'] === 'project',
        ),
        stepCount: PERSON_REPLACEMENT_STEPS['length'],
        navigate: _0x1a3d01,
      }),
    _0x4d01cc = (_0x5392bc, _0x4ac74c = '') => {
      const _0x24b38f = _0x4ac74c
          ? [..._0x57b9e5['characters'], ..._0x57b9e5['scenes']]['find'](
              (_0x4241c9) => _0x4241c9['id'] === _0x4ac74c,
            )
          : _0x57b9e5['workspace']['characterAssetTab'] === 'scene'
            ? _0x57b9e5['scenes']['find'](
                (_0x14bc18) => _0x14bc18['id'] === _0x57b9e5['workspace']['selectedSceneId'],
              )
            : _0xe8cb52(),
        _0x510502 = getWorkspaceAssetAppearances(_0x24b38f);
      if (_0x510502['length'] < 0x2) return;
      const _0x443df5 = Math['trunc'](
          Number(_0x57b9e5['workspace']['assetAppearanceIndexes']?.[_0x24b38f['id']]) || 0x0,
        ),
        _0x9e3a38 = (_0x443df5 + _0x5392bc + _0x510502['length']) % _0x510502['length'],
        _0x332ed5 = _0x5392bc > 0x0 ? 'next' : 'previous',
        _0x317075 =
          _0x24b38f['id'] ===
          (_0x57b9e5['workspace']['characterAssetTab'] === 'scene'
            ? _0x57b9e5['workspace']['selectedSceneId']
            : _0x57b9e5['workspace']['selectedCharacterId']),
        _0x2a3c7f = _0x42b7b0?.['querySelector']?.('.story-asset-detail .story-asset-preview-slide')?.[
          'cloneNode'
        ]?.(!![]);
      _0x26d845(
        {
          ..._0x57b9e5,
          workspace: {
            ..._0x57b9e5['workspace'],
            assetAppearanceIndexes: {
              ..._0x57b9e5['workspace']['assetAppearanceIndexes'],
              [_0x24b38f['id']]: _0x9e3a38,
            },
          },
        },
        'appearance-change',
      );
      if (!_0x317075) return;
      const _0xeb6e23 = _0x42b7b0?.['querySelector']?.('.story-asset-detail'),
        _0x21a4b4 = _0xeb6e23?.['querySelector']?.('.story-asset-preview-slide');
      if (!_0xeb6e23 || !_0x21a4b4) return;
      _0xeb6e23['classList']['remove']('is-sliding-next', 'is-sliding-previous');
      if (_0x2a3c7f) {
        (_0x2a3c7f['classList']['remove']('img-preview-loading'),
          _0x2a3c7f['classList']['add']('story-asset-preview-slide--outgoing', 'is-sliding-' + _0x332ed5),
          _0x2a3c7f['removeAttribute']?.('aria-busy'),
          _0x2a3c7f['setAttribute']?.('aria-hidden', 'true'),
          _0x2a3c7f['querySelector']?.('.img-loading-overlay')?.['remove']?.(),
          _0x21a4b4['after']?.(_0x2a3c7f));
        const _0x27a2d1 = () => _0x2a3c7f['remove']?.();
        (_0x2a3c7f['addEventListener']?.('animationend', _0x27a2d1, { once: !![] }),
          windowObject?.['setTimeout']?.(_0x27a2d1, 0x1cc));
      }
      (void _0xeb6e23['offsetWidth'], _0xeb6e23['classList']['add']('is-sliding-' + _0x332ed5));
    },
    _0x6f1208 = (_0xe1874) => {
      const _0x2286f5 = getPersonReplacementProjectAudioAssets(_0x57b9e5)['find'](
          (_0x3475c3) => _0x3475c3['id'] === _0x57b9e5['workspace']['selectedAudioAssetId'],
        ),
        _0x83d951 = getPersonReplacementVoiceLibraryBoundCharacters(_0x57b9e5, _0x2286f5);
      if (_0x83d951['length'] < 0x2) return;
      const _0x1f5413 = Math['max'](
          0x0,
          _0x83d951['findIndex'](
            (_0x241e1f) => _0x241e1f['id'] === _0x57b9e5['workspace']['selectedCharacterId'],
          ),
        ),
        _0x453709 = (_0x1f5413 + _0xe1874 + _0x83d951['length']) % _0x83d951['length'];
      _0x26d845(
        {
          ..._0x57b9e5,
          workspace: { ..._0x57b9e5['workspace'], selectedCharacterId: _0x83d951[_0x453709]['id'] },
        },
        'audio-bound-character-change',
      );
    },
    _0x25aef6 = (_0x39dedc) => {
      const _0xee04a5 = () => {
        Array['from'](_0x42b7b0?.['querySelectorAll']?.('[data-person-replacement-shot-card="true"]') || [])
          ['find']((_0x432767) => _0x432767['dataset']?.['shotId'] === normalizeText(_0x39dedc))
          ?.['scrollIntoView']?.({ block: 'nearest', inline: 'nearest' });
      };
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? windowObject['requestAnimationFrame'](_0xee04a5)
        : _0xee04a5();
    },
    _0x42b6b8 = (_0x29ae48) => {
      const _0x5ba68c = _0x57b9e5['shots']['findIndex'](
          (_0xd77692) => _0xd77692['id'] === normalizeText(_0x57b9e5['workspace']['selectedShotId']),
        ),
        _0x266b18 = _0x57b9e5['shots']['findIndex'](
          (_0x4ddb91) => _0x4ddb91['id'] === normalizeText(_0x29ae48),
        );
      if (_0x5ba68c < 0x0 || _0x266b18 < 0x0 || _0x5ba68c === _0x266b18) return '';
      return _0x266b18 > _0x5ba68c ? 'next' : 'previous';
    },
    _0x8f9a8a = () =>
      _0x42b7b0?.['querySelector']?.(
        '.person-replacement-image-generation-panel ' +
          '.person-replacement-image-preview-slide:not(' +
          '.person-replacement-image-preview-slide--outgoing)',
      )?.['cloneNode']?.(!![]) || null,
    _0x5b886b = () =>
      _0x42b7b0?.['querySelector']?.(
        '.person-replacement-middle-layout ' +
          '>\x20.person-replacement-middle-preview-slide:not(' +
          '.person-replacement-middle-preview-slide--outgoing)',
      )?.['cloneNode']?.(!![]) || null,
    _0x1b8454 = (_0x43450f) => {
      return (
        _0x43450f?.['querySelectorAll']?.(
          '.person-replacement-detection-empty,\x20' +
            '.person-replacement-keyframe-tools, ' +
            '.person-replacement-shot-navigation-arrow',
        )?.['forEach']?.((_0x523321) => _0x523321['remove']?.()),
        _0x43450f?.['querySelectorAll']?.('.person-replacement-detection-box')?.['forEach']?.((_0x2e0eab) =>
          _0x2e0eab['replaceChildren']?.(),
        ),
        _0x43450f
      );
    },
    _0x4e7f64 = () =>
      _0x42b7b0?.['querySelector']?.(
        '.person-replacement-video-generation-panel\x20' +
          '.person-replacement-video-result-slide:not(' +
          '.person-replacement-video-result-slide--outgoing)',
      ) || null,
    _0x4fe063 = (_0x484e23, _0x1b814c) => {
      const _0x272476 = _0x484e23 === 'previous' ? 'previous' : 'next',
        _0x4ccb28 = _0x42b7b0?.['querySelector']?.('.person-replacement-middle-layout'),
        _0x23337d = _0x4ccb28?.['querySelector']?.(
          '.person-replacement-middle-preview-slide:not(' +
            '.person-replacement-middle-preview-slide--outgoing)',
        );
      if (!_0x4ccb28 || !_0x23337d || _0x23337d === _0x1b814c) return ![];
      (_0x4ccb28['querySelectorAll']?.('.person-replacement-middle-preview-slide--outgoing')?.['forEach']?.(
        (_0x1ced79) => _0x1ced79['remove']?.(),
      ),
        _0x4ccb28['classList']?.['remove']?.('is-sliding-next', 'is-sliding-previous'));
      if (_0x1b814c) {
        (_0x1b8454(_0x1b814c),
          _0x1b814c['classList']?.['remove']?.(
            'img-preview-loading',
            'is-sliding-next',
            'is-sliding-previous',
          ),
          _0x1b814c['classList']?.['add']?.('person-replacement-middle-preview-slide--outgoing'),
          _0x1b814c['removeAttribute']?.('aria-busy'),
          _0x1b814c['setAttribute']?.('aria-hidden', 'true'));
        try {
          _0x1b814c['inert'] = !![];
        } catch {}
        (_0x1b814c['querySelector']?.('.story-asset-loading-overlay, .img-loading-overlay')?.['remove']?.(),
          _0x4ccb28['append']?.(_0x1b814c));
      }
      const _0x566386 = startPersonReplacementSlideTransition({
        windowObject: windowObject,
        incomingSlide: _0x23337d,
        outgoingSlide: _0x1b814c,
        direction: _0x272476,
      });
      let _0x333667 = ![];
      const _0x5ce8ab = () => {
        if (_0x333667) return;
        ((_0x333667 = !![]), cancelPersonReplacementSlideTransition(_0x566386), _0x1b814c?.['remove']?.());
      };
      return (
        _0x566386['finished']['then'](_0x5ce8ab),
        windowObject?.['setTimeout']?.(_0x5ce8ab, _0x566386['duration'] + 0x50),
        !![]
      );
    },
    _0x361573 = (_0x196b1f, _0x555c58) => {
      const _0x6ae8ec = _0x196b1f === 'previous' ? 'previous' : 'next',
        _0x11b364 = _0x42b7b0?.['querySelector']?.(
          '.person-replacement-image-generation-panel ' + '.person-replacement-generation-preview',
        ),
        _0x33a55f = _0x11b364?.['querySelector']?.(
          '.person-replacement-image-preview-slide:not(' +
            '.person-replacement-image-preview-slide--outgoing)',
        );
      if (!_0x11b364 || !_0x33a55f) return ![];
      (_0x11b364['querySelectorAll']?.('.person-replacement-image-preview-slide--outgoing')?.['forEach']?.(
        (_0x1b3b34) => _0x1b3b34['remove']?.(),
      ),
        _0x11b364['classList']?.['remove']?.('is-sliding-next', 'is-sliding-previous'));
      _0x555c58 &&
        (_0x555c58['classList']?.['remove']?.('img-preview-loading'),
        _0x555c58['classList']?.['add']?.('person-replacement-image-preview-slide--outgoing'),
        _0x555c58['removeAttribute']?.('aria-busy'),
        _0x555c58['setAttribute']?.('aria-hidden', 'true'),
        _0x555c58['querySelector']?.('.story-asset-loading-overlay, .img-loading-overlay')?.['remove']?.(),
        _0x11b364['append']?.(_0x555c58));
      const _0x526c7a = startPersonReplacementSlideTransition({
        windowObject: windowObject,
        incomingSlide: _0x33a55f,
        outgoingSlide: _0x555c58,
        direction: _0x6ae8ec,
      });
      let _0x1e3cea = ![];
      const _0x4fcbc0 = () => {
        if (_0x1e3cea) return;
        ((_0x1e3cea = !![]), cancelPersonReplacementSlideTransition(_0x526c7a), _0x555c58?.['remove']?.());
      };
      return (
        _0x526c7a['finished']['then'](_0x4fcbc0),
        windowObject?.['setTimeout']?.(_0x4fcbc0, _0x526c7a['duration'] + 0x50),
        !![]
      );
    },
    _0x19fb24 = (_0x178695, _0x1fab6d) => {
      const _0x28b2bb = _0x178695 === 'previous' ? 'previous' : 'next',
        _0x25f2f2 = _0x42b7b0?.['querySelector']?.(
          '.person-replacement-video-generation-panel ' + '.person-replacement-video-result',
        ),
        _0x3cc29c = _0x25f2f2?.['querySelector']?.(
          '.person-replacement-video-result-slide:not(' + '.person-replacement-video-result-slide--outgoing)',
        );
      if (!_0x25f2f2 || !_0x3cc29c || _0x3cc29c === _0x1fab6d) return ![];
      (_0x25f2f2['querySelectorAll']?.('.person-replacement-video-result-slide--outgoing')?.['forEach']?.(
        (_0x8bb93e) => _0x8bb93e['remove']?.(),
      ),
        _0x25f2f2['classList']?.['remove']?.('is-sliding-next', 'is-sliding-previous'));
      if (_0x1fab6d) {
        (_0x1fab6d['classList']?.['remove']?.(
          'img-preview-loading',
          'is-sliding-next',
          'is-sliding-previous',
        ),
          _0x1fab6d['classList']?.['add']?.('person-replacement-video-result-slide--outgoing'),
          _0x1fab6d['removeAttribute']?.('aria-busy'),
          _0x1fab6d['setAttribute']?.('aria-hidden', 'true'));
        try {
          _0x1fab6d['inert'] = !![];
        } catch {}
        (_0x1fab6d['querySelector']?.('.story-asset-loading-overlay, .img-loading-overlay')?.['remove']?.(),
          _0x25f2f2['append']?.(_0x1fab6d));
      }
      const _0x5c6da0 = startPersonReplacementSlideTransition({
        windowObject: windowObject,
        incomingSlide: _0x3cc29c,
        outgoingSlide: _0x1fab6d,
        direction: _0x28b2bb,
      });
      let _0x1c4ed2 = ![];
      const _0x54652f = () => {
        if (_0x1c4ed2) return;
        ((_0x1c4ed2 = !![]), cancelPersonReplacementSlideTransition(_0x5c6da0), _0x1fab6d?.['remove']?.());
      };
      return (
        _0x5c6da0['finished']['then'](_0x54652f),
        windowObject?.['setTimeout']?.(_0x54652f, _0x5c6da0['duration'] + 0x50),
        !![]
      );
    },
    _0x546c9f = (_0x5eabb1) => {
      if (_0x57b9e5['workspace']['view'] !== 'project' || _0x57b9e5['workspace']['step'] !== 0x5) return ![];
      const _0xae4081 = _0x42b7b0?.['querySelector']?.('.person-replacement-compare-grid');
      if (!_0xae4081) return ![];
      const _0x3461a6 = _0x5eabb1 === 'previous' ? 'previous' : 'next';
      return (
        _0xae4081['classList']?.['remove']?.('is-sliding-next'),
        _0xae4081['classList']?.['remove']?.('is-sliding-previous'),
        void _0xae4081['offsetWidth'],
        _0xae4081['classList']?.['add']?.('is-sliding-' + _0x3461a6),
        !![]
      );
    },
    _0x2bd9ab = (_0x45cb9c, { direction: direction = '', ensureVisible: ensureVisible = ![] } = {}) => {
      const _0x3a0866 = normalizeText(_0x45cb9c),
        _0x19d724 = _0x57b9e5['shots']['find']((_0x756e19) => _0x756e19['id'] === _0x3a0866),
        _0x50e28d =
          _0x57b9e5['workspace']['step'] === 0x5 &&
          buildPersonReplacementCompositePreviewSnapshot(_0x57b9e5)['previewMode'] === 'full';
      if (!_0x19d724 || (_0x3a0866 === _0x57b9e5['workspace']['selectedShotId'] && !_0x50e28d)) return ![];
      const _0x1d54e6 = direction || _0x42b6b8(_0x3a0866),
        _0x1da298 = _0x8f9a8a(),
        _0x307fc9 = _0x5b886b(),
        _0x352bbd = _0x4e7f64();
      (_0x26d845(
        {
          ..._0x57b9e5,
          workspace: {
            ..._0x57b9e5['workspace'],
            selectedShotId: _0x3a0866,
            ...(_0x57b9e5['workspace']['step'] === 0x5 ? { compositePreviewMode: 'shot' } : {}),
          },
        },
        'shot-select',
      ),
        _0x361573(_0x1d54e6 || 'next', _0x1da298),
        _0x4fe063(_0x1d54e6 || 'next', _0x307fc9),
        _0x19fb24(_0x1d54e6 || 'next', _0x352bbd),
        _0x546c9f(_0x1d54e6 || 'next'));
      if (ensureVisible) _0x25aef6(_0x3a0866);
      return !![];
    },
    _0x33236e = (_0x41f363) => {
      _0x41f363?.['setAttribute']?.(
        'aria-label',
        _0x41f363?.['dataset']?.['personReplacementShotWheel'] === 'true'
          ? '拖拽新增可替换主体；按住 Ctrl 拖拽可多选人物框；按 D 或 Delete 删除选中框；滚轮或左右方向键切换片段'
          : '拖拽新增可替换主体；按住 Ctrl 拖拽可多选人物框，按 D 或 Delete 批量删除',
      );
    },
    _0x38b343 = (_0x550640) => {
      const _0x131e43 = Array['isArray'](_0x57b9e5['shots']) ? _0x57b9e5['shots'] : [];
      if (_0x131e43['length'] < 0x2) return ![];
      const _0x4f353a = Math['max'](
          0x0,
          _0x131e43['findIndex']((_0x30b6f8) => _0x30b6f8['id'] === _0x57b9e5['workspace']['selectedShotId']),
        ),
        _0x5207f4 =
          (_0x4f353a + Math['sign'](Number(_0x550640) || 0x0) + _0x131e43['length']) % _0x131e43['length'],
        _0x1fc713 = _0x131e43[_0x5207f4];
      if (!_0x1fc713 || _0x1fc713['id'] === _0x57b9e5['workspace']['selectedShotId']) return ![];
      return _0x2bd9ab(_0x1fc713['id'], {
        direction: Math['sign'](Number(_0x550640) || 0x0) < 0x0 ? 'previous' : 'next',
        ensureVisible: !![],
      });
    },
    _0x1cb2a4 = createPersonReplacementResultSelectionController({
      getProject: () => _0x57b9e5,
      updateProject: _0x26d845,
      getShotSwitchDirection: _0x42b6b8,
      captureImagePreviewSlide: _0x8f9a8a,
      captureMiddlePreviewSlide: _0x5b886b,
      captureVideoResultSlide: _0x4e7f64,
      playImagePreviewTransition: _0x361573,
      playMiddlePreviewTransition: _0x4fe063,
      playVideoResultTransition: _0x19fb24,
      scrollShotCardIntoView: _0x25aef6,
      captureResultHistoryMenu: _0x502778,
      restoreResultHistoryMenu: _0x229882,
      windowObject: windowObject,
    }),
    {
      deleteImageResult: _0x2f0478,
      deleteVideoResult: _0x2727d8,
      selectImageResult: _0x2e11e0,
      selectVideoReference: _0x3b2204,
      selectVideoResult: _0x5f1af7,
      setImageReference: _0x3d31c5,
      setVideoReference: _0x7e07c0,
      switchImageResult: _0x110efe,
      switchVideoReferenceResult: _0x4f2b4a,
      switchVideoResult: _0x473d04,
    } = _0x1cb2a4,
    _0x1b6ef9 = (_0x5cbaf6) => {
      const _0x1ef472 = _0x5cbaf6['target']?.['closest']?.(
        '[data-person-replacement-video-reference-wheel="true"]',
      );
      if (
        !_0x1ef472 ||
        _0x57b9e5['workspace']['view'] !== 'project' ||
        _0x57b9e5['workspace']['step'] !== 0x3
      )
        return ![];
      _0x5cbaf6['preventDefault']();
      const _0x24f62d = normalizeText(_0x1ef472['dataset']['personReplacementVideoReferenceSourceShotId']),
        _0x441117 = _0x735220['get'](_0x24f62d) || { accumulator: 0x0, lockedUntil: 0x0 };
      _0x735220['set'](_0x24f62d, _0x441117);
      const _0x3be202 = consumeWorkspaceWheelDirection(_0x5cbaf6, _0x441117, {
        threshold: 0x4,
        lockDuration: 0xa0,
      });
      return (
        _0x3be202 &&
          _0x4f2b4a({
            sourceShotId: _0x24f62d,
            currentResultIndex: _0x1ef472['dataset']['personReplacementVideoReferenceResultIndex'],
            delta: _0x3be202,
          }),
        !![]
      );
    },
    _0x1c6c30 = (_0x2f48c4, _0x12db8e) => {
      const _0x90385e = _0x57b9e5['characters']['find'](
          (_0x1ae4b7) => _0x1ae4b7['id'] === normalizeText(_0x2f48c4),
        ),
        _0x5f4538 = getWorkspaceAssetAppearances(_0x90385e),
        _0x297eca = _0x5f4538['filter']((_0xaf364) => _0xaf364['imageUrl']);
      if (!_0x90385e || _0x297eca['length'] < 0x2) return ![];
      const _0x574682 = Math['max'](
          0x0,
          Math['min'](
            _0x5f4538['length'] - 0x1,
            Math['trunc'](Number(_0x57b9e5['workspace']['assetAppearanceIndexes']?.[_0x90385e['id']]) || 0x0),
          ),
        ),
        _0x163202 = _0x5f4538[_0x574682]?.['id'],
        _0x577c0b = Math['max'](
          0x0,
          _0x297eca['findIndex']((_0x398a08) => _0x398a08['id'] === _0x163202),
        ),
        _0x330add =
          (_0x577c0b + Math['sign'](Number(_0x12db8e) || 0x0) + _0x297eca['length']) % _0x297eca['length'];
      if (_0x330add === _0x577c0b) return ![];
      const _0x1dc77c = _0x297eca[_0x330add]?.['id'],
        _0x35ee06 = _0x5f4538['findIndex']((_0x20b826) => _0x20b826['id'] === _0x1dc77c),
        _0x108a74 = {
          ..._0x57b9e5,
          workspace: {
            ..._0x57b9e5['workspace'],
            assetAppearanceIndexes: {
              ..._0x57b9e5['workspace']['assetAppearanceIndexes'],
              [_0x90385e['id']]: Math['max'](0x0, _0x35ee06),
            },
          },
        };
      return (_0x26d845(_0x108a74, 'target-appearance-preview-change'), !![]);
    },
    _0x52ce70 = (_0x5af66d) => {
      const _0x4249fc = _0x5af66d['target']?.['closest']?.(
        '[data-person-replacement-target-appearance-wheel="true"]',
      );
      if (
        !_0x4249fc ||
        _0x57b9e5['workspace']['view'] !== 'project' ||
        _0x57b9e5['workspace']['step'] !== 0x2
      )
        return ![];
      _0x5af66d['preventDefault']();
      const _0x1c9316 = normalizeText(_0x4249fc['dataset']['personReplacementTargetCharacterId']),
        _0x4863f2 = _0x4625b2['get'](_0x1c9316) || { accumulator: 0x0, lockedUntil: 0x0 };
      _0x4625b2['set'](_0x1c9316, _0x4863f2);
      const _0x2cd941 = consumeWorkspaceWheelDirection(_0x5af66d, _0x4863f2, {
        threshold: 0x4,
        lockDuration: 0xa0,
      });
      if (_0x2cd941) _0x1c6c30(_0x1c9316, _0x2cd941);
      return !![];
    },
    _0x3f9fb5 = (_0x1deb11) => {
      const _0x52e474 = _0x1deb11['target']?.['closest']?.(
        '[data-story-appearance-wheel="true"], [data-story-card-appearance-wheel]',
      );
      if (
        !_0x52e474 ||
        _0x57b9e5['workspace']['view'] !== 'project' ||
        _0x57b9e5['workspace']['step'] !== 0x1 ||
        _0x57b9e5['workspace']['characterAssetTab'] === 'library'
      )
        return ![];
      if (shouldPreserveWorkspaceNestedWheel(_0x1deb11['target'], { boundaryRoot: _0x52e474 })) return ![];
      _0x1deb11['preventDefault']();
      const _0x3ceec0 = consumeWorkspaceWheelDirection(_0x1deb11, _0x1f77e4);
      if (_0x3ceec0) _0x4d01cc(_0x3ceec0, _0x52e474['dataset']['storyCardAppearanceWheel']);
      return !![];
    },
    _0x32a2f0 = (_0x5f4123) => {
      const _0x4a08a7 = _0x5f4123['target']?.['closest']?.(
        '[data-person-replacement-audio-bound-wheel="true"]',
      );
      if (
        !_0x4a08a7 ||
        _0x57b9e5['workspace']['view'] !== 'project' ||
        _0x57b9e5['workspace']['step'] !== 0x1 ||
        _0x57b9e5['workspace']['characterAssetTab'] !== 'audio'
      )
        return ![];
      _0x5f4123['preventDefault']();
      const _0x197195 = consumeWorkspaceWheelDirection(_0x5f4123, _0x110a98);
      if (_0x197195) _0x6f1208(_0x197195);
      return !![];
    },
    _0x204611 = (_0x209e42) => {
      const _0x471629 = _0x209e42['target']?.['closest']?.('[data-person-replacement-shot-wheel="true"]');
      if (
        !_0x471629 ||
        _0x57b9e5['workspace']['view'] !== 'project' ||
        ![0x2, 0x3, 0x5]['includes'](_0x57b9e5['workspace']['step']) ||
        (_0x57b9e5['workspace']['step'] === 0x2 && _0x4e4610['isOpen'])
      )
        return ![];
      _0x209e42['preventDefault']();
      const _0x3ac5dd = consumeWorkspaceWheelDirection(_0x209e42, _0x4092b9);
      if (_0x3ac5dd) _0x38b343(_0x3ac5dd);
      return !![];
    },
    _0x4a6238 = (_0x4d690b) => {
      const _0x32fab9 = _0x4d690b['target']?.['closest']?.(
        '[data-person-replacement-video-result-wheel=\x22true\x22]',
      );
      if (
        _0x32fab9 &&
        _0x57b9e5['workspace']['view'] === 'project' &&
        _0x57b9e5['workspace']['step'] === 0x3
      ) {
        _0x4d690b['preventDefault']();
        const _0x427bcd = consumeWorkspaceWheelDirection(_0x4d690b, _0x32e60f);
        if (_0x427bcd) _0x473d04(_0x427bcd);
        return !![];
      }
      const _0x32d147 = _0x4d690b['target']?.['closest']?.(
        '[data-person-replacement-image-result-wheel="true"]',
      );
      if (
        !_0x32d147 ||
        _0x57b9e5['workspace']['view'] !== 'project' ||
        _0x57b9e5['workspace']['step'] !== 0x2
      )
        return ![];
      _0x4d690b['preventDefault']();
      const _0x5f00da = consumeWorkspaceWheelDirection(_0x4d690b, _0x260afc);
      if (_0x5f00da) _0x110efe(_0x5f00da);
      return !![];
    },
    _0x31ad17 = (_0x59ec47) => {
      const _0x284015 = _0x59ec47['target']?.['closest']?.('[data-person-replacement-shot-timeline-scroll]'),
        _0x1d8a96 = _0x59ec47['target']?.['closest']?.('[data-person-replacement-shot-cut-timeline]');
      if (!_0x4e4610['isOpen'] || !_0x284015 || !_0x1d8a96 || !_0x42b7b0?.['contains']?.(_0x284015))
        return ![];
      const _0x235e37 = Number(_0x59ec47['deltaX']) || 0x0,
        _0x249f2b = Number(_0x59ec47['deltaY']) || 0x0,
        _0x5574e1 = Math['abs'](_0x235e37) > Math['abs'](_0x249f2b) ? _0x235e37 : _0x249f2b;
      if (!_0x5574e1) return ![];
      if (_0x59ec47['ctrlKey'] || _0x59ec47['metaKey'])
        return (
          _0x59ec47['preventDefault']?.(),
          _0x59ec47['stopPropagation']?.(),
          _0x1d4206(_0x5574e1 > 0x0 ? 'out' : 'in', { clientX: _0x59ec47['clientX'] }),
          !![]
        );
      const _0x12e4df = Math['max'](0x0, Number(_0x284015['scrollWidth']) - Number(_0x284015['clientWidth']));
      if (!(_0x12e4df > 0x0)) return ![];
      const _0x530f92 = clamp(
        Number(_0x284015['scrollLeft']) + _0x5574e1,
        0x0,
        _0x12e4df,
        Number(_0x284015['scrollLeft']) || 0x0,
      );
      if (_0x530f92 === Number(_0x284015['scrollLeft'])) return ![];
      return (
        _0x59ec47['preventDefault']?.(),
        _0x59ec47['stopPropagation']?.(),
        (_0x284015['scrollLeft'] = _0x530f92),
        !![]
      );
    },
    _0x460f91 = (_0x3accab) => {
      return scrollClosestElementHorizontallyWithWheel(
        _0x3accab,
        '[data-person-replacement-shot-timeline-scroll]',
        { boundaryRoot: _0x42b7b0, preserveNestedScrollable: !![] },
      );
    },
    _0xbbcbef = (_0x567f12) => {
      return scrollClosestElementHorizontallyWithWheel(
        _0x567f12,
        '.person-replacement-video-model-selector',
        { boundaryRoot: _0x42b7b0, preserveNestedScrollable: !![], stopPropagation: !![] },
      );
    },
    _0x1af548 = (_0x4a43ab) => {
      if (_0x4aeba7?.['handleKeyDown'](_0x4a43ab)) return;
      const _0x36b98e = _0x4a43ab['target']?.['closest']?.(
        '[data-person-replacement-composite-project-title]',
      );
      if (_0x36b98e && ['Enter', 'Escape']['includes'](_0x4a43ab['key'])) {
        (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
        _0x4a43ab['key'] === 'Escape' && (_0x36b98e['value'] = _0x57b9e5['title']);
        _0x36b98e['blur']?.();
        return;
      }
      if (
        _0x4a43ab['target']?.['dataset']?.['personReplacementField'] === 'video-prompt' &&
        handleSlashKeyboardNavigation(_0x4a43ab)
      )
        return;
      if (_0x23c082['handleKeyDown'](_0x4a43ab)) return;
      if (_0x3d57d6['handleKeyDown'](_0x4a43ab)) return;
      const _0x3365b3 = _0x4a43ab['target']?.['closest']?.(
        '[data-person-replacement-composite-sidebar-splitter]',
      );
      if (_0x3365b3 && ['ArrowLeft', 'ArrowRight']['includes'](_0x4a43ab['key'])) {
        (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
        const _0x4e5f93 = _0x3365b3['closest']?.('.person-replacement-preview-workbench'),
          _0x2fab2d = _0x4a43ab['key'] === 'ArrowLeft' ? -0x10 : 0x10;
        ((_0x57b9e5['workspace']['compositeSidebarWidth'] =
          applyPersonReplacementCompositeSidebarWidthToLayout(
            _0x4e5f93,
            _0x3365b3,
            _0x57b9e5['workspace']['compositeSidebarWidth'] + _0x2fab2d,
          )),
          _0x273c17('composite-sidebar-width'));
        return;
      }
      const _0x20e35c = _0x4a43ab['target']?.['closest']?.('[data-person-replacement-voice-layout-splitter]');
      if (_0x20e35c && ['ArrowLeft', 'ArrowRight']['includes'](_0x4a43ab['key'])) {
        (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
        const _0x486ae3 = normalizeText(_0x20e35c['dataset']?.['personReplacementVoiceLayoutSplitter']);
        if (['assets', 'sources']['includes'](_0x486ae3)) {
          const _0x3def8b = _0x20e35c['closest']?.('[data-person-replacement-voice-layout]'),
            _0x1f043f = normalizePersonReplacementVoiceLayout(_0x57b9e5['workspace']['voiceLayout']),
            _0x40161e = _0x4a43ab['key'] === 'ArrowLeft' ? -0x2 : 0x2;
          ((_0x57b9e5['workspace']['voiceLayout'] = applyPersonReplacementVoiceLayoutToElement(_0x3def8b, {
            ..._0x1f043f,
            ...(_0x486ae3 === 'assets'
              ? { assetsEnd: _0x1f043f['assetsEnd'] + _0x40161e }
              : { sourcesEnd: _0x1f043f['sourcesEnd'] + _0x40161e }),
          })),
            _0x273c17('voice-layout'));
        }
        return;
      }
      if (_0x4a43ab['key'] === 'Escape') {
        const _0x5747f0 = _0x42b7b0?.['querySelector']?.('.person-replacement-add-voice-menu-wrap.is-open');
        if (_0x5747f0) {
          (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
          const _0x1bcca1 = _0x5747f0['querySelector']?.(
            '[data-story-action=\x22toggle-character-voice-menu\x22]',
          );
          (_0x28395d(_0x5747f0, ![]), _0x1bcca1?.['focus']?.());
          return;
        }
        const _0xcfa8 = _0x42b7b0?.['querySelector']?.('.person-replacement-library-add-menu-wrap.is-open');
        if (_0xcfa8) {
          (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
          const _0x2318f3 = _0xcfa8['querySelector']?.(
            '[data-person-replacement-action="toggle-library-add-targets"]',
          );
          (_0x29175f(_0xcfa8, ![]), _0x2318f3?.['focus']?.());
          return;
        }
      }
      if (_0x4a43ab['key'] === 'Escape' && _0x236762) {
        (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation'](), _0x524d22({ restoreFocus: !![] }));
        return;
      }
      const _0x343428 = _0x4a43ab['target']?.['closest']?.('[data-person-replacement-person-custom-label]');
      if (_0x343428 && ['Enter', 'Escape']['includes'](_0x4a43ab['key'])) {
        (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
        const _0x7b104c = _0x343428['closest']?.('[data-person-replacement-detection-picker]');
        (_0x51b3c8(_0x343428, { cancelled: _0x4a43ab['key'] === 'Escape' }),
          _0x7b104c?.['querySelector']?.('[data-person-replacement-detection-picker-trigger]')?.[
            'focus'
          ]?.());
        return;
      }
      const _0xaec5e9 = _0x4a43ab['target']?.['closest']?.('[data-person-replacement-cut-boundary-index]');
      if (_0xaec5e9 && _0x4e4610['isOpen'] && ['ArrowLeft', 'ArrowRight']['includes'](_0x4a43ab['key'])) {
        const _0x11cd56 = _0x4a43ab['shiftKey'] ? 0x5 : _0x4a43ab['ctrlKey'] ? 0x1 : 0x0;
        if (!_0x11cd56) return;
        (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
        const _0x32559d = Math['trunc'](Number(_0xaec5e9['dataset']['personReplacementCutBoundaryIndex'])),
          _0x3ae96c = _0x4e4610['draft'][_0x32559d - 0x1],
          _0x129be7 = _0x4e4610['draft'][_0x32559d],
          _0x1b8635 = _0x4a43ab['key'] === 'ArrowRight' ? 0x1 : -0x1,
          _0x3e916b = getPersonReplacementShotCutFrameSec(_0x3ae96c, _0x129be7) * _0x11cd56;
        _0x42c738(_0x32559d, Number(_0x129be7?.['startSec']) + _0x1b8635 * _0x3e916b, { active: _0x32559d });
        return;
      }
      const _0x2869f3 = _0x4a43ab['target']?.['closest']?.('[data-person-replacement-cut-shot-index]'),
        _0x497c53 = Boolean(
          _0x4a43ab['target']?.['closest']?.(
            'input, textarea, select, [contenteditable="true"], [role="textbox"]',
          ),
        );
      if (_0x4d5162(_0x4a43ab)) return;
      if (
        _0x213c96(_0x4a43ab, {
          deletionEnabled:
            _0x57b9e5['workspace']['view'] === 'project' &&
            _0x57b9e5['workspace']['step'] === 0x2 &&
            !_0x4e4610['isOpen'],
          isEditableTarget: _0x497c53,
        })
      )
        return;
      const _0x2f05b6 = Boolean(_0x4a43ab['target']?.['closest']?.('.person-replacement-shot-cut-action'));
      if (
        _0x4e4610['isOpen'] &&
        !_0x26d2a5() &&
        !_0x497c53 &&
        (_0x4a43ab['key'] === '\x20' || _0x4a43ab['code'] === 'Space')
      ) {
        (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
        const _0x578595 = _0x42b7b0?.['querySelector']?.('[data-person-replacement-shot-cut-editor]');
        if (_0x578595 && _0x4a43ab['target'] !== _0x578595)
          try {
            _0x578595['focus']?.({ preventScroll: !![] });
          } catch {
            _0x578595['focus']?.();
          }
        if (!_0x4a43ab['repeat']) _0x4b8ea2();
        return;
      }
      if (_0x4e4610['isOpen'] && !_0x26d2a5() && !_0x497c53 && !_0x2f05b6) {
        if (
          !_0x4a43ab['repeat'] &&
          (_0x4a43ab['ctrlKey'] || _0x4a43ab['metaKey']) &&
          !_0x4a43ab['shiftKey'] &&
          String(_0x4a43ab['key'] || '')['toLowerCase']() === 'z'
        ) {
          (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation'](), _0x3ca241());
          return;
        }
        if (
          !_0x4a43ab['repeat'] &&
          (_0x4a43ab['ctrlKey'] || _0x4a43ab['metaKey']) &&
          (String(_0x4a43ab['key'] || '') === '+' ||
            String(_0x4a43ab['key'] || '') === '=' ||
            _0x4a43ab['code'] === 'Equal')
        ) {
          (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation'](), _0x1d4206('in'));
          return;
        }
        if (
          !_0x4a43ab['repeat'] &&
          (_0x4a43ab['ctrlKey'] || _0x4a43ab['metaKey']) &&
          (String(_0x4a43ab['key'] || '') === '-' || _0x4a43ab['code'] === 'Minus')
        ) {
          (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation'](), _0x1d4206('out'));
          return;
        }
        if (
          !_0x4a43ab['repeat'] &&
          (_0x4a43ab['ctrlKey'] || _0x4a43ab['metaKey']) &&
          (String(_0x4a43ab['key'] || '') === '0' || _0x4a43ab['code'] === 'Digit0')
        ) {
          (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation'](), _0x1d4206('reset'));
          return;
        }
        if (
          !_0x4a43ab['repeat'] &&
          !_0x4a43ab['ctrlKey'] &&
          !_0x4a43ab['metaKey'] &&
          !_0x4a43ab['altKey'] &&
          (String(_0x4a43ab['key'] || '')['toLowerCase']() === 'c' || _0x4a43ab['code'] === 'KeyC')
        ) {
          (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation'](), _0x4299a2());
          return;
        }
        if (['ArrowLeft', 'ArrowRight']['includes'](_0x4a43ab['key'])) {
          (_0x4a43ab['preventDefault'](),
            _0x4a43ab['stopPropagation'](),
            _0x3b2808(_0x4a43ab['key'] === 'ArrowLeft' ? -0x1 : 0x1, _0x4a43ab['shiftKey'] ? 0x5 : 0x1));
          return;
        }
        if (['Home', 'End']['includes'](_0x4a43ab['key'])) {
          (_0x4a43ab['preventDefault'](),
            _0x4a43ab['stopPropagation'](),
            _0x57503e(
              _0x4a43ab['key'] === 'Home'
                ? 0x0
                : getPersonReplacementShotCutTotalDuration(_0x4e4610['draft']),
            ));
          return;
        }
      }
      if (_0x2869f3 && _0x4e4610['isOpen'] && _0x4a43ab['key'] === 'Enter') {
        (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
        const _0x4a300c =
          _0x4e4610['draft'][Math['trunc'](Number(_0x2869f3['dataset']['personReplacementCutShotIndex']))];
        if (_0x4a300c) _0x2fd756(_0x4a300c['shotId'], _0x4a300c['startSec']);
        return;
      }
      const _0x4865be = _0x4a43ab['target']?.['closest']?.(
        '[data-story-asset-name-id][contenteditable="true"]',
      );
      if (_0x4865be && ['Enter', 'Escape']['includes'](_0x4a43ab['key'])) {
        (_0x4a43ab['preventDefault'](),
          _0x4a43ab['stopPropagation'](),
          _0x31e38b(_0x4865be, { cancel: _0x4a43ab['key'] === 'Escape' }),
          _0x4865be['blur']?.());
        return;
      }
      if (_0x4a43ab['key'] === 'Escape') {
        if (_0x1c8c49()) {
          (_0x4a43ab['preventDefault'](), _0x4a43ab['stopPropagation']());
          return;
        }
        if (
          !_0x57b9e5['workspace']['shotSelectionMode'] &&
          !_0x57b9e5['workspace']['selectedShotIds']['length'] &&
          _0x46a111(_0x4a43ab)
        )
          return;
        if (_0x4e4610['isSmartDetectOpen'] && !_0x4e4610['isSmartDetecting']) {
          (_0x4a43ab['preventDefault'](),
            _0x4a43ab['stopPropagation'](),
            (_0x4e4610['isSmartDetectOpen'] = ![]),
            _0x4cf492());
          return;
        }
        if (_0x4e4610['isOpen'] && !_0x374e20()) {
          (_0x4a43ab['preventDefault'](), _0x26bf5a({ animate: !![], renderWorkspace: !![] }));
          return;
        }
        (_0x4d8968?.['cancel']?.(),
          _0x1399ed(),
          (_0x57b9e5['workspace']['shotSelectionMode'] ||
            _0x57b9e5['workspace']['selectedShotIds']['length']) &&
            _0x26d845(
              {
                ..._0x57b9e5,
                workspace: { ..._0x57b9e5['workspace'], shotSelectionMode: ![], selectedShotIds: [] },
              },
              'shot-selection-cancel',
            ),
          _0x57b9e5['workspace']['step'] === 0x1 &&
            _0x57b9e5['workspace']['selectedAssetIds']['length'] &&
            _0x26d845(
              {
                ..._0x57b9e5,
                workspace: { ..._0x57b9e5['workspace'], assetSelectionMode: ![], selectedAssetIds: [] },
              },
              'asset-selection-cancel',
            ));
      }
      const _0xa1922c = _0x4a43ab['target']?.['closest']?.(
        '[data-person-replacement-target-appearance-wheel="true"]',
      );
      if (
        _0xa1922c &&
        _0x57b9e5['workspace']['step'] === 0x2 &&
        ['ArrowLeft', 'ArrowRight']['includes'](_0x4a43ab['key'])
      ) {
        (_0x4a43ab['preventDefault'](),
          _0x4a43ab['stopPropagation'](),
          _0x1c6c30(
            _0xa1922c['dataset']['personReplacementTargetCharacterId'],
            _0x4a43ab['key'] === 'ArrowRight' ? 0x1 : -0x1,
          ));
        return;
      }
      const _0x523df8 = _0x4a43ab['target']?.['closest']?.('[data-person-replacement-shot-wheel="true"]');
      if (
        _0x523df8 &&
        _0x57b9e5['workspace']['step'] === 0x2 &&
        ['ArrowLeft', 'ArrowRight']['includes'](_0x4a43ab['key'])
      ) {
        (_0x4a43ab['preventDefault'](),
          _0x4a43ab['stopPropagation'](),
          _0x38b343(_0x4a43ab['key'] === 'ArrowRight' ? 0x1 : -0x1));
        return;
      }
      const _0x457b6b = _0x4a43ab['target']?.['closest']?.(
        '[data-person-replacement-audio-bound-wheel="true"]',
      );
      if (
        _0x457b6b &&
        _0x57b9e5['workspace']['step'] === 0x1 &&
        _0x57b9e5['workspace']['characterAssetTab'] === 'audio' &&
        ['ArrowLeft', 'ArrowRight']['includes'](_0x4a43ab['key'])
      ) {
        (_0x4a43ab['preventDefault'](),
          _0x4a43ab['stopPropagation'](),
          _0x6f1208(_0x4a43ab['key'] === 'ArrowRight' ? 0x1 : -0x1));
        return;
      }
      const _0x30e4be = _0x4a43ab['target']?.['closest']?.('[data-story-appearance-wheel="true"]');
      if (!_0x30e4be || !['ArrowLeft', 'ArrowRight']['includes'](_0x4a43ab['key'])) return;
      (_0x4a43ab['preventDefault'](),
        _0x4a43ab['stopPropagation'](),
        _0x4d01cc(_0x4a43ab['key'] === 'ArrowRight' ? 0x1 : -0x1));
    },
    _0x2b3990 = (_0x166ec5) => {
      _0x166ec5['stopPropagation']();
      const _0x1802ba = _0x166ec5['target']?.['closest']?.(
        '.person-replacement-image-preview-slide:not(' +
          '.person-replacement-image-preview-slide--outgoing) > img',
      );
      if (_0x1802ba && _0x42b7b0?.['contains']?.(_0x1802ba)) {
        const _0x423d67 = normalizeMediaUrl(_0x1802ba['currentSrc'] || _0x1802ba['getAttribute']?.('src'));
        if (!_0x423d67) return;
        (_0x166ec5['preventDefault'](),
          openImagePreview(_0x423d67, { alt: _0x1802ba['alt'] || '替换图片生成结果预览' }));
        return;
      }
      const _0x347885 = _0x166ec5['target']?.['closest']?.(
        'video[data-person-replacement-video-player="result"]',
      );
      if (_0x347885 && _0x42b7b0?.['contains']?.(_0x347885)) {
        const _0x27f1a9 = normalizeMediaUrl(
          _0x347885['dataset']?.['personReplacementVideoUrl'] ||
            _0x347885['getAttribute']?.('src') ||
            _0x347885['currentSrc'],
        );
        if (!_0x27f1a9) return;
        const _0x40a5cd = normalizeMediaUrl(_0x347885['currentSrc'] || _0x347885['getAttribute']?.('src'));
        (_0x166ec5['preventDefault'](), openVideoPreview(_0x27f1a9, { playbackUrl: _0x40a5cd }));
        return;
      }
      const _0x152fea = _0x166ec5['target']?.['closest']?.('img.story-asset-preview');
      if (!_0x152fea || !_0x42b7b0?.['contains']?.(_0x152fea)) return;
      const _0x3c8866 = normalizeMediaUrl(_0x152fea['currentSrc'] || _0x152fea['getAttribute']?.('src'));
      if (!_0x3c8866) return;
      (_0x166ec5['preventDefault'](),
        openImagePreview(_0x3c8866, { alt: _0x152fea['alt'] || '人物形象图片预览' }));
    },
    _0x2118fd = (_0x4ef9df = {}) => {
      return (
        (_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
          ..._0x57b9e5,
          workspace: { ..._0x57b9e5['workspace'], ..._0x4ef9df },
        })),
        _0x4cf492(),
        cloneJson(_0x57b9e5)
      );
    },
    _0x2515df = () => {
      if (_0x57b9e5['workspace']['view'] !== 'home') return ![];
      const _0x1e1806 = _0x42b7b0?.['querySelector']?.('[data-person-replacement-smart-clip-settings]'),
        _0x1c1b99 = _0x1e1806?.['querySelector']?.(
          '[data-person-replacement-action="toggle-smart-clip-settings"]',
        );
      if (!_0x1e1806 || !_0x1c1b99) return ![];
      const _0x1a4619 = _0x57b9e5['workspace']['smartClipSettingsOpen'] === !![],
        _0x5c59be = _0x1e1806['querySelector']?.('.person-replacement-smart-clip-settings-panel');
      if (_0x1a4619 && !_0x5c59be && typeof _0x1e1806['insertAdjacentHTML'] !== 'function') return ![];
      (_0x1c1b99['classList']?.['toggle']?.('is-active', _0x1a4619),
        _0x1c1b99['setAttribute']?.('aria-expanded', String(_0x1a4619)));
      if (_0x1a4619 && !_0x5c59be)
        _0x1e1806['insertAdjacentHTML'](
          'beforeend',
          personReplacementShellPresentation['renderSmartClipSettingsPanel'](_0x57b9e5),
        );
      else !_0x1a4619 && _0x5c59be?.['remove']?.();
      return (
        _0x1e1806['querySelectorAll']?.('[data-smart-clip-mode]')?.['forEach']?.((_0xc5f862) => {
          const _0x10c733 =
            _0xc5f862['dataset']?.['smartClipMode'] === _0x57b9e5['settings']['smartClipMode'];
          (_0xc5f862['classList']?.['toggle']?.('is-active', _0x10c733),
            _0xc5f862['setAttribute']?.('aria-pressed', String(_0x10c733)));
        }),
        _0x1e1806['querySelectorAll']?.('[data-smart-clip-fps]')?.['forEach']?.((_0x2d4487) => {
          const _0x3f4aba =
            Number(_0x2d4487['dataset']?.['smartClipFps']) === _0x57b9e5['settings']['smartClipFps'];
          (_0x2d4487['classList']?.['toggle']?.('is-active', _0x3f4aba),
            _0x2d4487['setAttribute']?.('aria-pressed', String(_0x3f4aba)));
        }),
        !![]
      );
    },
    _0x2583b7 = (
      { workspace: workspace = {}, settings: settings = {} } = {},
      { notify: notify = ![] } = {},
    ) => {
      _0x57b9e5 = normalizePersonReplacementWorkspaceProject({
        ..._0x57b9e5,
        settings: { ..._0x57b9e5['settings'], ...settings },
        workspace: { ..._0x57b9e5['workspace'], ...workspace },
      });
      if (!_0x2515df()) _0x4cf492();
      if (notify) _0x273c17('smart-clip-settings');
      return cloneJson(_0x57b9e5);
    },
    _0x497b01 = (_0x1c0fd8) => {
      const _0x1a1c0f = _0x42b7b0?.['querySelector']?.('[data-story-project-sort-wrap]'),
        _0x18a01a = _0x1a1c0f?.['querySelector']?.("[data-story-action='toggle-project-sort-menu']"),
        _0x44f5b7 = _0x1a1c0f?.['querySelector']?.('[data-story-project-sort-menu]');
      (_0x1a1c0f?.['classList']?.['toggle']?.('is-open', _0x1c0fd8),
        _0x18a01a?.['setAttribute']?.('aria-expanded', String(_0x1c0fd8)),
        _0x44f5b7?.['setAttribute']?.('aria-hidden', String(!_0x1c0fd8)));
    },
    _0x1399ed = (_0x26328f = null) => {
      _0x42b7b0?.['querySelectorAll']?.('.story-home-param-picker.is-open')?.['forEach']?.((_0x3ab519) => {
        if (_0x3ab519 === _0x26328f) return;
        (_0x3ab519['classList']?.['remove']?.('is-open'),
          _0x3ab519['querySelector']?.('[data-story-home-param-trigger]')?.['setAttribute']?.(
            'aria-expanded',
            'false',
          ));
      });
    },
    _0x403e9c = (_0x2c1e4a) => {
      const _0x587f58 = _0x2c1e4a?.['querySelector']?.('[data-person-replacement-detection-picker-menu]'),
        _0x2891e5 = _0x2c1e4a?.['querySelector']?.('[data-person-replacement-detection-picker-trigger]');
      if (!_0x587f58 || !_0x2891e5) return ![];
      if (_0x587f58['dataset']?.['personReplacementPickerOptionsReady'] === 'true') return !![];
      const _0x1d8e89 = normalizeText(_0x2c1e4a['dataset']?.['personReplacementDetectionPicker']);
      let _0x1e07a9 = [];
      if (_0x1d8e89 === 'orientation') _0x1e07a9 = getPersonOrientationOptions();
      else {
        if (_0x1d8e89 === 'scope') _0x1e07a9 = getPersonReplacementScopeOptions();
        else {
          if (_0x1d8e89 === 'label') {
            const _0x1b5951 = _0x2c1e4a['closest']?.('.person-replacement-detection-box'),
              _0x106d8c = normalizeText(
                _0x1b5951?.['dataset']?.['shotId'] || _0x57b9e5['workspace']['selectedShotId'],
              ),
              _0x4b75a9 = _0x57b9e5['shots']['find']((_0x188225) => _0x188225['id'] === _0x106d8c),
              _0x5f17b2 = getPersonReplacementBoxedPeople(_0x4b75a9),
              _0x48bdce = normalizeText(
                _0x2891e5['querySelector']?.('[data-person-replacement-detection-picker-value]')?.[
                  'textContent'
                ],
                _0x2891e5['value'],
              );
            _0x1e07a9 = getPersonReplacementLabelOptions({
              labels: [
                ..._0x5f17b2['map']((_0x310b75, _0x4c246b) => formatPersonReplacementPersonLabel(_0x4c246b)),
                ...getPersonReplacementReusableLabels(_0x57b9e5),
              ],
              selectedLabel: _0x48bdce,
              removedLabels: _0x57b9e5['workspace']['removedCustomPersonLabels'],
              project: _0x57b9e5,
            });
          }
        }
      }
      return (
        (_0x587f58['innerHTML'] = personReplacementIdentityPresentation['renderOverlay']('picker-options', {
          options: _0x1e07a9,
          selectedValue: _0x2891e5['value'],
        })),
        _0x587f58['dataset'] && (_0x587f58['dataset']['personReplacementPickerOptionsReady'] = 'true'),
        !![]
      );
    },
    _0x30a2f8 = (_0x3207cf, _0x2c403f) => {
      const _0x433ab3 = _0x3207cf?.['querySelector']?.('[data-person-replacement-detection-picker-trigger]'),
        _0x1b02a7 = _0x3207cf?.['querySelector']?.('[data-person-replacement-detection-picker-menu]');
      if (_0x2c403f && !_0x403e9c(_0x3207cf)) return ![];
      return (
        _0x3207cf?.['classList']?.['toggle']?.('is-open', _0x2c403f),
        _0x3207cf?.['closest']?.('.person-replacement-detection-box')?.['classList']?.['toggle']?.(
          'is-picker-open',
          _0x2c403f,
        ),
        _0x433ab3?.['setAttribute']?.('aria-expanded', String(_0x2c403f)),
        _0x1b02a7?.['setAttribute']?.('aria-hidden', String(!_0x2c403f)),
        !_0x2c403f &&
          _0x1b02a7?.['dataset']?.['personReplacementPickerOptionsLazy'] === 'true' &&
          ((_0x1b02a7['innerHTML'] = ''),
          _0x1b02a7['dataset'] && delete _0x1b02a7['dataset']['personReplacementPickerOptionsReady']),
        !![]
      );
    },
    _0x1c8c49 = (_0x35442a = null) => {
      let _0x313908 = ![];
      return (
        _0x42b7b0?.['querySelectorAll']?.('[data-person-replacement-detection-picker].is-open')?.[
          'forEach'
        ]?.((_0x281a70) => {
          if (_0x281a70 === _0x35442a) return;
          (_0x30a2f8(_0x281a70, ![]), (_0x313908 = !![]));
        }),
        _0x313908
      );
    },
    _0x51b3c8 = (_0x8b3198, { cancelled: cancelled = ![] } = {}) => {
      if (!_0x8b3198 || _0x8b3198['hidden']) return ![];
      const _0x534663 = _0x8b3198['closest']?.('[data-person-replacement-detection-picker]'),
        _0x4ea481 = _0x8b3198['closest']?.('.person-replacement-detection-box'),
        _0x40c536 = _0x534663?.['querySelector']?.('[data-person-replacement-detection-picker-trigger]'),
        _0x20a97b = _0x40c536?.['querySelector']?.('[data-person-replacement-detection-picker-value]');
      if (!_0x534663 || !_0x40c536 || !_0x20a97b) return ![];
      const _0x5da065 = normalizeText(_0x534663['dataset']['personReplacementPreviousValue']),
        _0xfe3720 = normalizeText(_0x534663['dataset']['personReplacementPreviousLabel'], _0x5da065),
        _0x3431ac = normalizeText(_0x534663['dataset']['personReplacementPreviousSourceCharacterId']),
        _0x1b2fb3 = normalizeText(_0x8b3198['value']),
        _0x5488d0 = cancelled || !_0x1b2fb3,
        _0x4431a0 = _0x5488d0 ? _0x5da065 : PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE,
        _0x3b7dd3 = _0x5488d0 ? _0xfe3720 : _0x1b2fb3;
      return (
        (_0x40c536['value'] = _0x4431a0),
        (_0x40c536['dataset']['personReplacementSelectedSourceCharacterId'] = _0x5488d0
          ? _0x3431ac
          : normalizeText(
              _0x57b9e5['shots']
                ['find']((_0x328911) => _0x328911['id'] === normalizeText(_0x4ea481?.['dataset']?.['shotId']))
                ?.['people']?.['find'](
                  (_0x4f7fc6) => _0x4f7fc6['id'] === normalizeText(_0x4ea481?.['dataset']?.['personId']),
                )?.['sourceCharacterId'],
            )),
        (_0x40c536['hidden'] = ![]),
        _0x40c536['setAttribute']('aria-label', '人物名称：' + _0x3b7dd3),
        (_0x20a97b['textContent'] = _0x3b7dd3),
        (_0x8b3198['value'] = _0x3b7dd3),
        (_0x8b3198['hidden'] = !![]),
        _0x534663['querySelectorAll']?.('[data-person-replacement-detection-picker-option]')?.['forEach']?.(
          (_0x359494) => {
            const _0x14086e =
              normalizeText(_0x359494['dataset']['personReplacementDetectionPickerOption']) === _0x4431a0;
            (_0x359494['classList']?.['toggle']?.('is-selected', _0x14086e),
              _0x359494['setAttribute']?.('aria-selected', String(_0x14086e)));
          },
        ),
        delete _0x534663['dataset']['personReplacementPreviousValue'],
        delete _0x534663['dataset']['personReplacementPreviousLabel'],
        delete _0x534663['dataset']['personReplacementPreviousSourceCharacterId'],
        !_0x5488d0 &&
          _0x5569e2({
            detectionBox: _0x4ea481,
            label: _0x3b7dd3,
            sourceCharacterId: _0x40c536['dataset']['personReplacementSelectedSourceCharacterId'],
          }),
        !_0x5488d0
      );
    },
    _0x4935d9 = (_0x3376cf) => {
      const _0x49b660 = _0x3376cf?.['target'],
        _0x264847 = _0x49b660?.['closest']?.('[data-story-marquee-surface="shots"]'),
        _0x3f655c =
          _0x57b9e5['workspace']['step'] === 0x1 &&
          _0x57b9e5['workspace']['assetSelectionMode'] &&
          _0x49b660?.['closest']?.('.person-replacement-assets-page'),
        _0x49cd22 =
          [0x2, 0x3, 0x5]['includes'](_0x57b9e5['workspace']['step']) &&
          (_0x57b9e5['workspace']['shotSelectionMode'] ||
            _0x57b9e5['workspace']['selectedShotIds']['length']) &&
          _0x264847,
        _0x71a11e = _0x49b660?.['closest']?.(PERSON_REPLACEMENT_MULTI_SELECTION_INTERACTIVE_SELECTOR),
        _0x4124b0 = _0x49cd22 && _0x71a11e === _0x264847;
      if (
        _0x57b9e5['workspace']['view'] !== 'project' ||
        (!_0x3f655c && !_0x49cd22) ||
        (_0x71a11e && !_0x4124b0)
      )
        return ![];
      return (
        _0x4d8968?.['cancel']?.(),
        _0x26d845(
          {
            ..._0x57b9e5,
            workspace: {
              ..._0x57b9e5['workspace'],
              ...(_0x49cd22
                ? { shotSelectionMode: ![], selectedShotIds: [] }
                : { assetSelectionMode: ![], selectedAssetIds: [] }),
            },
          },
          _0x49cd22 ? 'shot-selection-cancel' : 'asset-selection-cancel',
        ),
        !![]
      );
    },
    _0x560d76 = (_0xed9468) => {
      const _0x23ad15 = () => {
        const _0x628b9a = Array['from'](
          _0x42b7b0?.['querySelectorAll']?.('[data-story-project-title]') || [],
        )['find'](
          (_0x6d4474) =>
            normalizeText(_0x6d4474['dataset']['storyProjectTitle']) === normalizeText(_0xed9468),
        );
        (_0x628b9a?.['focus']?.(), _0x628b9a?.['select']?.());
      };
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? windowObject['requestAnimationFrame'](_0x23ad15)
        : globalThis['queueMicrotask']?.(_0x23ad15);
    },
    _0x478e16 = (_0x2849af, _0x1797b4) => {
      if (_0x57b9e5['workspace']['view'] === 'home' && _0x1797b4 === 'toggle-project-sort-menu') {
        const _0xf352cc = _0x2849af['closest']?.('[data-story-project-sort-wrap]');
        _0x497b01(!_0xf352cc?.['classList']?.['contains']?.('is-open'));
      } else {
        if (_0x57b9e5['workspace']['view'] === 'home' && _0x1797b4 === 'select-project-sort')
          _0x2118fd({
            projectSortOrder: normalizeWorkspaceProjectSortOrder(
              _0x2849af['dataset']['storyProjectSortOption'],
            ),
          });
        else {
          if (_0x57b9e5['workspace']['view'] === 'home' && _0x1797b4 === 'toggle-archived-projects')
            _0x2118fd({
              showArchivedProjects: !_0x57b9e5['workspace']['showArchivedProjects'],
              openProjectMenuId: '',
              pendingDeleteProjectId: '',
            });
          else {
            if (_0x57b9e5['workspace']['view'] === 'home' && _0x1797b4 === 'toggle-project-menu') {
              const _0x2527a2 = normalizeText(_0x2849af['dataset']['storyProjectId']);
              _0x2118fd({
                openProjectMenuId: _0x57b9e5['workspace']['openProjectMenuId'] === _0x2527a2 ? '' : _0x2527a2,
                pendingDeleteProjectId: '',
              });
            } else {
              if (_0x57b9e5['workspace']['view'] === 'home' && _0x1797b4 === 'rename-project') {
                const _0x3fb59b = normalizeText(_0x2849af['dataset']['storyProjectId']);
                (_0x2118fd({ openProjectMenuId: '', pendingDeleteProjectId: '' }), _0x560d76(_0x3fb59b));
              } else {
                if (_0x57b9e5['workspace']['view'] === 'home' && _0x1797b4 === 'duplicate-project')
                  _0x4e3281(_0x43f995['DUPLICATE_PROJECT'], {
                    projectId: _0x2849af['dataset']['storyProjectId'],
                  });
                else {
                  if (_0x57b9e5['workspace']['view'] === 'home' && _0x1797b4 === 'collect-project')
                    _0x4e3281(_0x43f995['COLLECT_PROJECT'], {
                      projectId: _0x2849af['dataset']['storyProjectId'],
                    });
                  else {
                    if (_0x57b9e5['workspace']['view'] === 'home' && _0x1797b4 === 'import-project')
                      _0x4e3281(_0x43f995['IMPORT_PROJECT']);
                    else {
                      if (
                        _0x57b9e5['workspace']['view'] === 'home' &&
                        (_0x1797b4 === 'archive-project' || _0x1797b4 === 'unarchive-project')
                      )
                        _0x4e3281(_0x43f995['ARCHIVE_PROJECT'], {
                          projectId: _0x2849af['dataset']['storyProjectId'],
                          archived: _0x1797b4 === 'archive-project',
                        });
                      else {
                        if (
                          _0x57b9e5['workspace']['view'] === 'home' &&
                          _0x1797b4 === 'request-delete-project'
                        )
                          _0x2118fd({
                            openProjectMenuId: '',
                            pendingDeleteProjectId: normalizeText(_0x2849af['dataset']['storyProjectId']),
                          });
                        else {
                          if (
                            _0x57b9e5['workspace']['view'] === 'home' &&
                            _0x1797b4 === 'cancel-delete-project'
                          )
                            _0x2118fd({ pendingDeleteProjectId: '' });
                          else {
                            if (
                              _0x57b9e5['workspace']['view'] === 'home' &&
                              _0x1797b4 === 'confirm-delete-project'
                            )
                              _0x4e3281(_0x43f995['DELETE_PROJECT'], {
                                projectId: _0x2849af['dataset']['storyProjectId'],
                              });
                            else {
                              if (
                                _0x1797b4 === 'target-previous-appearance' ||
                                _0x1797b4 === 'target-next-appearance'
                              ) {
                                const _0x23618b = _0x2849af['closest']?.(
                                  '[data-person-replacement-target-controls]',
                                );
                                _0x1c6c30(
                                  _0x23618b?.['dataset']?.['personReplacementTargetControls'],
                                  _0x1797b4 === 'target-next-appearance' ? 0x1 : -0x1,
                                );
                              } else {
                                if (
                                  _0x1797b4 === 'video-reference-previous-result' ||
                                  _0x1797b4 === 'video-reference-next-result'
                                ) {
                                  const _0xfcb3f9 = _0x2849af['closest']?.(
                                    '[data-person-replacement-video-reference-controls]',
                                  );
                                  _0x4f2b4a({
                                    sourceShotId:
                                      _0xfcb3f9?.['dataset']?.['personReplacementVideoReferenceControls'],
                                    currentResultIndex:
                                      _0xfcb3f9?.['dataset']?.['personReplacementVideoReferenceResultIndex'],
                                    delta: _0x1797b4 === 'video-reference-next-result' ? 0x1 : -0x1,
                                  });
                                } else {
                                  if (_0x1797b4 === 'cancel-asset-selection')
                                    _0x26d845(
                                      {
                                        ..._0x57b9e5,
                                        workspace: {
                                          ..._0x57b9e5['workspace'],
                                          assetSelectionMode: ![],
                                          selectedAssetIds: [],
                                        },
                                      },
                                      'asset-selection-cancel',
                                    );
                                  else {
                                    if (_0x1797b4 === 'cancel-shot-batch-generation') _0x1d3a8e();
                                    else {
                                      if (_0x1797b4 === 'cancel-asset-batch-generation') _0x3f648b();
                                      else {
                                        if (_0x1797b4 === 'toggle-all-assets') {
                                          const _0x27012d = getPersonReplacementSelectableAssets(
                                              _0x57b9e5,
                                              _0x57b9e5['workspace']['characterAssetTab'],
                                            ),
                                            _0x9d5843 =
                                              _0x27012d['length'] > 0x0 &&
                                              _0x27012d['every']((_0x3545e2) =>
                                                _0x57b9e5['workspace']['selectedAssetIds']['includes'](
                                                  _0x3545e2['id'],
                                                ),
                                              );
                                          _0x26d845(
                                            {
                                              ..._0x57b9e5,
                                              workspace: {
                                                ..._0x57b9e5['workspace'],
                                                selectedAssetIds: _0x9d5843
                                                  ? []
                                                  : _0x27012d['map']((_0x39bff8) => _0x39bff8['id']),
                                                assetSelectionMode: !_0x9d5843 && _0x27012d['length'] > 0x0,
                                              },
                                            },
                                            'asset-selection-all',
                                          );
                                        } else {
                                          if (_0x1797b4 === 'toggle-all-shots') {
                                            const _0x3df4c1 = _0x57b9e5['shots']['every']((_0x4bb489) =>
                                              _0x57b9e5['workspace']['selectedShotIds']['includes'](
                                                _0x4bb489['id'],
                                              ),
                                            );
                                            _0x26d845(
                                              {
                                                ..._0x57b9e5,
                                                workspace: {
                                                  ..._0x57b9e5['workspace'],
                                                  shotSelectionMode: !_0x3df4c1,
                                                  selectedShotIds: _0x3df4c1
                                                    ? []
                                                    : _0x57b9e5['shots']['map'](
                                                        (_0x88cd54) => _0x88cd54['id'],
                                                      ),
                                                },
                                              },
                                              'shot-selection-all',
                                            );
                                          } else {
                                            if (_0x1797b4 === 'previous-appearance')
                                              _0x4d01cc(-0x1, _0x2849af['dataset']['storyCardAppearanceId']);
                                            else {
                                              if (_0x1797b4 === 'next-appearance')
                                                _0x4d01cc(0x1, _0x2849af['dataset']['storyCardAppearanceId']);
                                              else {
                                                if (_0x1797b4 === 'previous-audio-bound-character')
                                                  _0x6f1208(-0x1);
                                                else {
                                                  if (_0x1797b4 === 'next-audio-bound-character')
                                                    _0x6f1208(0x1);
                                                  else {
                                                    if (_0x1797b4 === 'previous-shot') _0x38b343(-0x1);
                                                    else {
                                                      if (_0x1797b4 === 'next-shot') _0x38b343(0x1);
                                                      else {
                                                        if (_0x1797b4 === 'previous-replacement-image-result')
                                                          _0x110efe(-0x1);
                                                        else {
                                                          if (_0x1797b4 === 'next-replacement-image-result')
                                                            _0x110efe(0x1);
                                                          else {
                                                            if (
                                                              _0x1797b4 ===
                                                              'previous-replacement-video-result'
                                                            )
                                                              _0x473d04(-0x1);
                                                            else {
                                                              if (
                                                                _0x1797b4 === 'next-replacement-video-result'
                                                              )
                                                                _0x473d04(0x1);
                                                              else {
                                                                if (
                                                                  _0x1797b4 === 'select-video-shot-reference'
                                                                )
                                                                  _0x3b2204(
                                                                    _0x2849af['dataset']['shotId'] ||
                                                                      _0x57b9e5['workspace'][
                                                                        'selectedShotId'
                                                                      ],
                                                                    _0x2849af['dataset'][
                                                                      'personReplacementVideoReferenceIndex'
                                                                    ],
                                                                    {
                                                                      sourceShotId:
                                                                        _0x2849af['dataset'][
                                                                          'personReplacementVideoReferenceSourceShotId'
                                                                        ],
                                                                      resultIndex:
                                                                        _0x2849af['dataset'][
                                                                          'personReplacementVideoReferenceResultIndex'
                                                                        ],
                                                                      referencePersonId:
                                                                        _0x2849af['dataset'][
                                                                          'personReplacementVideoCharacterReference'
                                                                        ],
                                                                      referenceKind:
                                                                        _0x2849af['dataset'][
                                                                          'personReplacementVideoReferenceKind'
                                                                        ],
                                                                    },
                                                                  );
                                                                else {
                                                                  if (
                                                                    _0x1797b4 ===
                                                                    'select-replacement-image-result'
                                                                  )
                                                                    (_0x2e11e0(
                                                                      _0x2849af['dataset']['shotId'],
                                                                      _0x2849af['dataset'][
                                                                        'replacementImageResultIndex'
                                                                      ],
                                                                    ),
                                                                      _0x4aeba7?.['refresh']());
                                                                  else {
                                                                    if (
                                                                      _0x1797b4 ===
                                                                      'set-replacement-image-reference'
                                                                    )
                                                                      _0x3d31c5(
                                                                        _0x2849af['dataset']['shotId'],
                                                                        _0x2849af['dataset'][
                                                                          'replacementImageResultIndex'
                                                                        ],
                                                                      );
                                                                    else {
                                                                      if (
                                                                        _0x1797b4 ===
                                                                        'delete-replacement-image-result'
                                                                      )
                                                                        _0x2f0478(
                                                                          _0x2849af['dataset']['shotId'],
                                                                          _0x2849af['dataset'][
                                                                            'replacementImageResultIndex'
                                                                          ],
                                                                        );
                                                                      else {
                                                                        if (
                                                                          _0x1797b4 ===
                                                                          'select-replacement-video-result'
                                                                        )
                                                                          (_0x5f1af7(
                                                                            _0x2849af['dataset']['shotId'],
                                                                            _0x2849af['dataset'][
                                                                              'replacementVideoResultIndex'
                                                                            ],
                                                                          ),
                                                                            _0x4aeba7?.['refresh']());
                                                                        else {
                                                                          if (
                                                                            _0x1797b4 ===
                                                                            'set-replacement-video-reference'
                                                                          )
                                                                            _0x7e07c0(
                                                                              _0x2849af['dataset']['shotId'],
                                                                              _0x2849af['dataset'][
                                                                                'replacementVideoResultIndex'
                                                                              ],
                                                                            );
                                                                          else {
                                                                            if (
                                                                              _0x1797b4 ===
                                                                              'delete-replacement-video-result'
                                                                            )
                                                                              _0x2727d8(
                                                                                _0x2849af['dataset'][
                                                                                  'shotId'
                                                                                ],
                                                                                _0x2849af['dataset'][
                                                                                  'replacementVideoResultIndex'
                                                                                ],
                                                                              );
                                                                            else {
                                                                              if (
                                                                                _0x1797b4 ===
                                                                                'download-asset-image'
                                                                              )
                                                                                _0x3f9454(
                                                                                  _0x2849af,
                                                                                  _0x295d0b(),
                                                                                );
                                                                              else {
                                                                                if (
                                                                                  _0x1797b4 ===
                                                                                  'add-asset-appearance-to-library'
                                                                                )
                                                                                  void addPersonReplacementAppearanceToLibraryWithFly(
                                                                                    _0x42b7b0,
                                                                                    _0xe8cb52(),
                                                                                    _0x391a96(),
                                                                                    _0x52549f(
                                                                                      _0x43f995[
                                                                                        'ADD_ASSET_APPEARANCE_TO_LIBRARY'
                                                                                      ],
                                                                                    ),
                                                                                    _0x267b3,
                                                                                    documentObject,
                                                                                    windowObject,
                                                                                  );
                                                                                else {
                                                                                  if (
                                                                                    _0x1797b4 ===
                                                                                    'download-replacement-image'
                                                                                  )
                                                                                    _0x3f9454(
                                                                                      _0x2849af,
                                                                                      _0x570287(),
                                                                                    );
                                                                                  else {
                                                                                    if (
                                                                                      _0x1797b4 ===
                                                                                      'upload-replacement-image'
                                                                                    )
                                                                                      ((_0x40a90d = {
                                                                                        kind: 'replacement-image',
                                                                                        shotId:
                                                                                          _0x57b9e5[
                                                                                            'workspace'
                                                                                          ]['selectedShotId'],
                                                                                      }),
                                                                                        _0x42b7b0[
                                                                                          'querySelector'
                                                                                        ](
                                                                                          "[data-person-replacement-input='replacement-image']",
                                                                                        )?.['click']?.());
                                                                                    else {
                                                                                      if (
                                                                                        _0x1797b4 ===
                                                                                        'download-replacement-video'
                                                                                      )
                                                                                        _0x47874c(
                                                                                          _0x2849af,
                                                                                          _0x22da78(),
                                                                                        );
                                                                                      else {
                                                                                        if (
                                                                                          _0x1797b4 ===
                                                                                          'upload-replacement-video'
                                                                                        )
                                                                                          ((_0x116a03 =
                                                                                            _0x2849af),
                                                                                            (_0x40a90d = {
                                                                                              kind: 'replacement-video',
                                                                                              shotId:
                                                                                                _0x57b9e5[
                                                                                                  'workspace'
                                                                                                ][
                                                                                                  'selectedShotId'
                                                                                                ],
                                                                                            }),
                                                                                            _0x42b7b0[
                                                                                              'querySelector'
                                                                                            ](
                                                                                              "[data-person-replacement-input='replacement-video-result']",
                                                                                            )?.['click']?.());
                                                                                        else {
                                                                                          if (
                                                                                            _0x1797b4 ===
                                                                                            'upload-asset'
                                                                                          ) {
                                                                                            const _0x479c43 =
                                                                                                _0xe8cb52(
                                                                                                  _0x2849af[
                                                                                                    'dataset'
                                                                                                  ][
                                                                                                    'storyCardAppearanceId'
                                                                                                  ] ||
                                                                                                    _0x57b9e5[
                                                                                                      'workspace'
                                                                                                    ][
                                                                                                      'selectedCharacterId'
                                                                                                    ],
                                                                                                ),
                                                                                              _0x2d7e9c =
                                                                                                _0x391a96(
                                                                                                  _0x479c43,
                                                                                                );
                                                                                            ((_0x40a90d = {
                                                                                              kind: 'appearance',
                                                                                              characterId:
                                                                                                _0x479c43?.[
                                                                                                  'id'
                                                                                                ],
                                                                                              appearanceId:
                                                                                                _0x2d7e9c?.[
                                                                                                  'id'
                                                                                                ],
                                                                                            }),
                                                                                              _0x42b7b0[
                                                                                                'querySelector'
                                                                                              ](
                                                                                                "[data-person-replacement-input='appearance-image']",
                                                                                              )?.[
                                                                                                'click'
                                                                                              ]?.());
                                                                                          } else {
                                                                                            if (
                                                                                              _0x1797b4 ===
                                                                                              'toggle-character-voice-menu'
                                                                                            ) {
                                                                                              const _0x5d9c92 =
                                                                                                  _0x2849af[
                                                                                                    'closest'
                                                                                                  ]?.(
                                                                                                    '.person-replacement-add-voice-menu-wrap',
                                                                                                  ),
                                                                                                _0x3d58b6 =
                                                                                                  !_0x5d9c92?.[
                                                                                                    'classList'
                                                                                                  ]?.[
                                                                                                    'contains'
                                                                                                  ]?.(
                                                                                                    'is-open',
                                                                                                  );
                                                                                              (_0x4ba512(
                                                                                                _0x5d9c92,
                                                                                              ),
                                                                                                _0x28395d(
                                                                                                  _0x5d9c92,
                                                                                                  _0x3d58b6,
                                                                                                ));
                                                                                            } else {
                                                                                              if (
                                                                                                _0x1797b4 ===
                                                                                                'remove-character-voice'
                                                                                              ) {
                                                                                                _0x4ba512();
                                                                                                const _0x16a835 =
                                                                                                  _0xe8cb52();
                                                                                                if (
                                                                                                  !_0x16a835
                                                                                                )
                                                                                                  return;
                                                                                                (_0x196980(),
                                                                                                  _0x26d845(
                                                                                                    {
                                                                                                      ..._0x57b9e5,
                                                                                                      characters:
                                                                                                        _0x57b9e5[
                                                                                                          'characters'
                                                                                                        ][
                                                                                                          'map'
                                                                                                        ](
                                                                                                          (
                                                                                                            _0x580fa6,
                                                                                                          ) =>
                                                                                                            _0x580fa6[
                                                                                                              'id'
                                                                                                            ] ===
                                                                                                            _0x16a835[
                                                                                                              'id'
                                                                                                            ]
                                                                                                              ? {
                                                                                                                  ..._0x580fa6,
                                                                                                                  voiceReference:
                                                                                                                    null,
                                                                                                                  voiceRef:
                                                                                                                    '',
                                                                                                                }
                                                                                                              : _0x580fa6,
                                                                                                        ),
                                                                                                    },
                                                                                                    'remove-character-voice',
                                                                                                  ));
                                                                                              } else {
                                                                                                if (
                                                                                                  _0x1797b4 ===
                                                                                                  'upload-character-voice'
                                                                                                )
                                                                                                  (_0x4ba512(),
                                                                                                    (_0x40a90d =
                                                                                                      {
                                                                                                        kind: 'voice',
                                                                                                        characterId:
                                                                                                          _0xe8cb52()?.[
                                                                                                            'id'
                                                                                                          ],
                                                                                                      }),
                                                                                                    _0x42b7b0[
                                                                                                      'querySelector'
                                                                                                    ](
                                                                                                      '[data-person-replacement-input=\x27character-voice\x27]',
                                                                                                    )?.[
                                                                                                      'click'
                                                                                                    ]?.());
                                                                                                else {
                                                                                                  if (
                                                                                                    _0x1797b4 ===
                                                                                                    'choose-character-voice-from-library'
                                                                                                  ) {
                                                                                                    _0x4ba512();
                                                                                                    const _0x4adfc4 =
                                                                                                      _0xe8cb52();
                                                                                                    if (
                                                                                                      !_0x4adfc4
                                                                                                    ) {
                                                                                                      windowObject?.[
                                                                                                        'showToast'
                                                                                                      ]?.(
                                                                                                        '请先选择要添加声音的人设。',
                                                                                                        'warn',
                                                                                                      );
                                                                                                      return;
                                                                                                    }
                                                                                                    const _0xfed31a =
                                                                                                        _0x57b9e5,
                                                                                                      _0x33fc07 =
                                                                                                        getPersonReplacementProjectAudioAssets(
                                                                                                          _0xfed31a,
                                                                                                        ),
                                                                                                      _0x1a37ec =
                                                                                                        _0x33fc07[
                                                                                                          'find'
                                                                                                        ](
                                                                                                          (
                                                                                                            _0x431fb7,
                                                                                                          ) =>
                                                                                                            getPersonReplacementVoiceLibraryBoundCharacters(
                                                                                                              _0xfed31a,
                                                                                                              _0x431fb7,
                                                                                                            )[
                                                                                                              'some'
                                                                                                            ](
                                                                                                              (
                                                                                                                _0x4177b8,
                                                                                                              ) =>
                                                                                                                _0x4177b8[
                                                                                                                  'id'
                                                                                                                ] ===
                                                                                                                _0x4adfc4[
                                                                                                                  'id'
                                                                                                                ],
                                                                                                            ),
                                                                                                        );
                                                                                                    ((_0x834763 =
                                                                                                      _0x4adfc4[
                                                                                                        'id'
                                                                                                      ]),
                                                                                                      _0x26d845(
                                                                                                        {
                                                                                                          ..._0xfed31a,
                                                                                                          workspace:
                                                                                                            {
                                                                                                              ..._0xfed31a[
                                                                                                                'workspace'
                                                                                                              ],
                                                                                                              characterAssetTab:
                                                                                                                'audio',
                                                                                                              selectedAudioAssetId:
                                                                                                                _0x1a37ec?.[
                                                                                                                  'id'
                                                                                                                ] ||
                                                                                                                _0x33fc07[0x0]?.[
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
                                                                                                      _0x1797b4 ===
                                                                                                      'set-base-appearance'
                                                                                                    ) {
                                                                                                      const _0x313443 =
                                                                                                          _0xe8cb52(),
                                                                                                        _0x1298ac =
                                                                                                          _0x391a96(
                                                                                                            _0x313443,
                                                                                                          ),
                                                                                                        _0x3f686e =
                                                                                                          _0x57b9e5[
                                                                                                            'characters'
                                                                                                          ][
                                                                                                            'map'
                                                                                                          ](
                                                                                                            (
                                                                                                              _0x6db60c,
                                                                                                            ) =>
                                                                                                              _0x6db60c[
                                                                                                                'id'
                                                                                                              ] ===
                                                                                                              _0x313443?.[
                                                                                                                'id'
                                                                                                              ]
                                                                                                                ? {
                                                                                                                    ..._0x6db60c,
                                                                                                                    baseAppearanceId:
                                                                                                                      _0x1298ac?.[
                                                                                                                        'id'
                                                                                                                      ],
                                                                                                                  }
                                                                                                                : _0x6db60c,
                                                                                                          );
                                                                                                      _0x26d845(
                                                                                                        {
                                                                                                          ..._0x57b9e5,
                                                                                                          characters:
                                                                                                            _0x3f686e,
                                                                                                        },
                                                                                                        'set-base-appearance',
                                                                                                      );
                                                                                                    } else {
                                                                                                      if (
                                                                                                        _0x1797b4 ===
                                                                                                        'delete-appearance'
                                                                                                      ) {
                                                                                                        const _0x3128cc =
                                                                                                            _0xe8cb52(),
                                                                                                          _0x1bda71 =
                                                                                                            _0x391a96(
                                                                                                              _0x3128cc,
                                                                                                            );
                                                                                                        if (
                                                                                                          !_0x3128cc ||
                                                                                                          !_0x1bda71 ||
                                                                                                          _0x1bda71[
                                                                                                            'id'
                                                                                                          ] ===
                                                                                                            _0x3128cc[
                                                                                                              'baseAppearanceId'
                                                                                                            ]
                                                                                                        )
                                                                                                          return;
                                                                                                        const _0xe900a6 =
                                                                                                          _0x57b9e5[
                                                                                                            'characters'
                                                                                                          ][
                                                                                                            'map'
                                                                                                          ](
                                                                                                            (
                                                                                                              _0x3972d5,
                                                                                                            ) =>
                                                                                                              _0x3972d5[
                                                                                                                'id'
                                                                                                              ] ===
                                                                                                              _0x3128cc[
                                                                                                                'id'
                                                                                                              ]
                                                                                                                ? {
                                                                                                                    ..._0x3972d5,
                                                                                                                    appearances:
                                                                                                                      _0x3972d5[
                                                                                                                        'appearances'
                                                                                                                      ][
                                                                                                                        'filter'
                                                                                                                      ](
                                                                                                                        (
                                                                                                                          _0x570dba,
                                                                                                                        ) =>
                                                                                                                          _0x570dba[
                                                                                                                            'id'
                                                                                                                          ] !==
                                                                                                                          _0x1bda71[
                                                                                                                            'id'
                                                                                                                          ],
                                                                                                                      ),
                                                                                                                  }
                                                                                                                : _0x3972d5,
                                                                                                          );
                                                                                                        _0x26d845(
                                                                                                          {
                                                                                                            ..._0x57b9e5,
                                                                                                            characters:
                                                                                                              _0xe900a6,
                                                                                                            workspace:
                                                                                                              {
                                                                                                                ..._0x57b9e5[
                                                                                                                  'workspace'
                                                                                                                ],
                                                                                                                assetAppearanceIndexes:
                                                                                                                  {
                                                                                                                    ..._0x57b9e5[
                                                                                                                      'workspace'
                                                                                                                    ][
                                                                                                                      'assetAppearanceIndexes'
                                                                                                                    ],
                                                                                                                    [_0x3128cc[
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
                                                                                                          _0x1797b4 ===
                                                                                                          'delete-asset-card'
                                                                                                        ) {
                                                                                                          _0x58b712();
                                                                                                          const _0x2885a9 =
                                                                                                            normalizeText(
                                                                                                              _0x2849af[
                                                                                                                'dataset'
                                                                                                              ][
                                                                                                                'storyAssetDeleteId'
                                                                                                              ],
                                                                                                            );
                                                                                                          if (
                                                                                                            _0x57b9e5[
                                                                                                              'workspace'
                                                                                                            ][
                                                                                                              'characterAssetTab'
                                                                                                            ] ===
                                                                                                              'scene' &&
                                                                                                            _0x57b9e5[
                                                                                                              'scenes'
                                                                                                            ][
                                                                                                              'some'
                                                                                                            ](
                                                                                                              (
                                                                                                                _0x459253,
                                                                                                              ) =>
                                                                                                                _0x459253[
                                                                                                                  'id'
                                                                                                                ] ===
                                                                                                                _0x2885a9,
                                                                                                            )
                                                                                                          )
                                                                                                            _0x4e3281(
                                                                                                              _0x43f995[
                                                                                                                'DELETE_SCENE'
                                                                                                              ],
                                                                                                              {
                                                                                                                sceneId:
                                                                                                                  _0x2885a9,
                                                                                                              },
                                                                                                            );
                                                                                                          else
                                                                                                            _0x57b9e5[
                                                                                                              'workspace'
                                                                                                            ][
                                                                                                              'characterAssetTab'
                                                                                                            ] ===
                                                                                                              'audio' &&
                                                                                                            _0x57b9e5[
                                                                                                              'audioAssets'
                                                                                                            ][
                                                                                                              'some'
                                                                                                            ](
                                                                                                              (
                                                                                                                _0x5b7700,
                                                                                                              ) =>
                                                                                                                _0x5b7700[
                                                                                                                  'id'
                                                                                                                ] ===
                                                                                                                _0x2885a9,
                                                                                                            )
                                                                                                              ? _0x4e3281(
                                                                                                                  _0x43f995[
                                                                                                                    'DELETE_AUDIO_ASSET'
                                                                                                                  ],
                                                                                                                  {
                                                                                                                    audioAssetId:
                                                                                                                      _0x2885a9,
                                                                                                                  },
                                                                                                                )
                                                                                                              : _0x4e3281(
                                                                                                                  _0x43f995[
                                                                                                                    'DELETE_CHARACTER'
                                                                                                                  ],
                                                                                                                  {
                                                                                                                    characterId:
                                                                                                                      _0x2885a9,
                                                                                                                  },
                                                                                                                );
                                                                                                        } else {
                                                                                                          if (
                                                                                                            _0x1797b4[
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
                                                                                                            const _0x35f3fa =
                                                                                                                _0x1797b4[
                                                                                                                  'slice'
                                                                                                                ](
                                                                                                                  'debug-generation-'[
                                                                                                                    'length'
                                                                                                                  ],
                                                                                                                ),
                                                                                                              _0x1b39a0 =
                                                                                                                _0xe8cb52(),
                                                                                                              _0x4b72c2 =
                                                                                                                _0x391a96(
                                                                                                                  _0x1b39a0,
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
                                                                                                                        ...(await _0x4e3281(
                                                                                                                          _0x43f995[
                                                                                                                            'PREVIEW_GENERATION'
                                                                                                                          ],
                                                                                                                          {
                                                                                                                            kind: _0x35f3fa,
                                                                                                                            projectId:
                                                                                                                              _0x57b9e5[
                                                                                                                                'id'
                                                                                                                              ],
                                                                                                                            shotId:
                                                                                                                              _0x57b9e5[
                                                                                                                                'workspace'
                                                                                                                              ][
                                                                                                                                'selectedShotId'
                                                                                                                              ],
                                                                                                                            sourceImageSize:
                                                                                                                              resolvePersonReplacementSourceImageSize(
                                                                                                                                _0x42b7b0?.[
                                                                                                                                  'querySelector'
                                                                                                                                ](
                                                                                                                                  '[data-person-replacement-keyframe-stage] > img',
                                                                                                                                ),
                                                                                                                                _0x57b9e5[
                                                                                                                                  'shots'
                                                                                                                                ][
                                                                                                                                  'find'
                                                                                                                                ](
                                                                                                                                  (
                                                                                                                                    _0xee522e,
                                                                                                                                  ) =>
                                                                                                                                    _0xee522e[
                                                                                                                                      'id'
                                                                                                                                    ] ===
                                                                                                                                    _0x57b9e5[
                                                                                                                                      'workspace'
                                                                                                                                    ][
                                                                                                                                      'selectedShotId'
                                                                                                                                    ],
                                                                                                                                ),
                                                                                                                              ),
                                                                                                                            characterId:
                                                                                                                              _0x1b39a0?.[
                                                                                                                                'id'
                                                                                                                              ],
                                                                                                                            appearanceId:
                                                                                                                              _0x4b72c2?.[
                                                                                                                                'id'
                                                                                                                              ],
                                                                                                                            prompt:
                                                                                                                              _0x4b72c2?.[
                                                                                                                                'prompt'
                                                                                                                              ] ||
                                                                                                                              _0x1b39a0?.[
                                                                                                                                'description'
                                                                                                                              ],
                                                                                                                            promptPresetId:
                                                                                                                              _0x57b9e5[
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
                                                                                                                          _0x57b9e5[
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
                                                                                                              _0x1797b4 ===
                                                                                                              'generate-asset'
                                                                                                            ) {
                                                                                                              const _0x4725e5 =
                                                                                                                  _0xe8cb52(
                                                                                                                    _0x2849af[
                                                                                                                      'dataset'
                                                                                                                    ][
                                                                                                                      'storyCardAppearanceId'
                                                                                                                    ] ||
                                                                                                                      _0x57b9e5[
                                                                                                                        'workspace'
                                                                                                                      ][
                                                                                                                        'selectedCharacterId'
                                                                                                                      ],
                                                                                                                  ),
                                                                                                                _0x1ffca2 =
                                                                                                                  _0x391a96(
                                                                                                                    _0x4725e5,
                                                                                                                  );
                                                                                                              _0x4e3281(
                                                                                                                _0x43f995[
                                                                                                                  'GENERATE_CHARACTER_IMAGE'
                                                                                                                ],
                                                                                                                {
                                                                                                                  characterId:
                                                                                                                    _0x4725e5?.[
                                                                                                                      'id'
                                                                                                                    ],
                                                                                                                  appearanceId:
                                                                                                                    _0x1ffca2?.[
                                                                                                                      'id'
                                                                                                                    ],
                                                                                                                  prompt:
                                                                                                                    _0x1ffca2?.[
                                                                                                                      'prompt'
                                                                                                                    ] ||
                                                                                                                    _0x4725e5?.[
                                                                                                                      'description'
                                                                                                                    ],
                                                                                                                  promptPresetId:
                                                                                                                    _0x57b9e5[
                                                                                                                      'workspace'
                                                                                                                    ][
                                                                                                                      'assetPromptPresetId'
                                                                                                                    ],
                                                                                                                  modelId:
                                                                                                                    _0x57b9e5[
                                                                                                                      'settings'
                                                                                                                    ][
                                                                                                                      'characterImageModelId'
                                                                                                                    ],
                                                                                                                  provider:
                                                                                                                    _0x57b9e5[
                                                                                                                      'settings'
                                                                                                                    ][
                                                                                                                      'characterImageProvider'
                                                                                                                    ],
                                                                                                                  providerProfileId:
                                                                                                                    _0x57b9e5[
                                                                                                                      'settings'
                                                                                                                    ][
                                                                                                                      'characterImageProviderProfileId'
                                                                                                                    ],
                                                                                                                  generationParams:
                                                                                                                    _0x57b9e5[
                                                                                                                      'settings'
                                                                                                                    ][
                                                                                                                      'characterImageGenerationParams'
                                                                                                                    ],
                                                                                                                },
                                                                                                              );
                                                                                                            } else {
                                                                                                              if (
                                                                                                                _0x1797b4 ===
                                                                                                                  'batch-generate-assets' &&
                                                                                                                [
                                                                                                                  0x2,
                                                                                                                  0x3,
                                                                                                                ][
                                                                                                                  'includes'
                                                                                                                ](
                                                                                                                  _0x57b9e5[
                                                                                                                    'workspace'
                                                                                                                  ][
                                                                                                                    'step'
                                                                                                                  ],
                                                                                                                )
                                                                                                              )
                                                                                                                _0x2daac8(
                                                                                                                  _0x57b9e5[
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
                                                                                                                  _0x1797b4 ===
                                                                                                                  'batch-generate-assets'
                                                                                                                )
                                                                                                                  _0x5e8e9c();
                                                                                                                else
                                                                                                                  _0x1797b4 ===
                                                                                                                    'play-character-voice' &&
                                                                                                                    void _0x50e1f0(
                                                                                                                      _0x2849af[
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
    _0x2d9fc4 = (_0x110e6f) => {
      if (!_0x110e6f?.['project']) return ![];
      return (_0x58b712(), _0x26d845(_0x110e6f['project'], _0x110e6f['reason']), !![]);
    },
    _0x41e8c9 = (_0x54782f, _0xc23ca4 = 'scene-reference-change') =>
      _0x2d9fc4(applyPersonReplacementShotSceneReference(_0x57b9e5, _0x54782f, { reason: _0xc23ca4 })),
    _0x2012da = (_0xc8d386, _0x580a71 = 'person-mapping-clear') =>
      _0x2d9fc4(clearPersonReplacementShotPersonMappings(_0x57b9e5, _0xc8d386, { reason: _0x580a71 })),
    _0x2337bb = (_0x22ac30) => _0x2d9fc4(assignPersonReplacementShotPersonMapping(_0x57b9e5, _0x22ac30)),
    _0x524d22 = ({ restoreFocus: restoreFocus = ![] } = {}) => {
      const _0x1340fc = _0x236762?.['focusTarget'];
      ((_0x236762 = null),
        _0x42b7b0?.['querySelector']?.('[data-person-replacement-mapping-scope-menu]')?.['remove']?.());
      if (restoreFocus) _0x1340fc?.['focus']?.();
    },
    _0xe2ad53 = ({
      personBox: _0x5a35fc,
      mapping: _0x28c617,
      personLabel: personLabel = '',
      targetName: targetName = '',
      appearanceName: appearanceName = '',
      clientX: _0x277d96,
      clientY: _0x5c58e5,
    } = {}) => {
      if (!_0x42b7b0 || !_0x5a35fc || !_0x28c617) return ![];
      (_0x524d22(),
        (_0x236762 = { mapping: _0x28c617, focusTarget: _0x5a35fc }),
        _0x42b7b0['insertAdjacentHTML']?.(
          'beforeend',
          personReplacementIdentityPresentation['renderOverlay']('mapping-scope', {
            personLabel: personLabel,
            targetName: targetName,
            appearanceName: appearanceName,
          }),
        ));
      const _0x377c13 = _0x42b7b0['querySelector']?.('[data-person-replacement-mapping-scope-menu]');
      if (!_0x377c13) return ((_0x236762 = null), ![]);
      const _0x4f8ca5 = _0x42b7b0['getBoundingClientRect']?.(),
        _0xd9123e = _0x5a35fc['getBoundingClientRect']?.(),
        _0x37434e = _0x377c13['getBoundingClientRect']?.();
      if (_0x4f8ca5 && _0xd9123e && _0x37434e) {
        const _0x31d203 = _0x37434e['width'] || 0x104,
          _0x2af71d = _0x37434e['height'] || 0xaa,
          _0x44e96d = Number['isFinite'](Number(_0x277d96)) ? Number(_0x277d96) : _0xd9123e['right'],
          _0x1faca1 = Number['isFinite'](Number(_0x5c58e5)) ? Number(_0x5c58e5) : _0xd9123e['top'],
          _0x1b3b01 = clamp(
            _0x44e96d - _0x4f8ca5['left'] - _0x31d203 / 0x2,
            0xc,
            _0x4f8ca5['width'] - _0x31d203 - 0xc,
            0xc,
          ),
          _0x54ca02 = _0x1faca1 - _0x4f8ca5['top'] + 0xa,
          _0x8ce688 =
            _0x54ca02 + _0x2af71d <= _0x4f8ca5['height'] - 0xc
              ? _0x54ca02
              : clamp(
                  _0x1faca1 - _0x4f8ca5['top'] - _0x2af71d - 0xa,
                  0xc,
                  _0x4f8ca5['height'] - _0x2af71d - 0xc,
                  0xc,
                );
        (_0x377c13['style']?.['setProperty']?.('--person-replacement-mapping-scope-left', _0x1b3b01 + 'px'),
          _0x377c13['style']?.['setProperty']?.('--person-replacement-mapping-scope-top', _0x8ce688 + 'px'));
      }
      return (
        _0x377c13['querySelector']?.('[data-person-replacement-mapping-scope=\x27current\x27]')?.[
          'focus'
        ]?.(),
        !![]
      );
    },
    _0x4f358e = (_0x5eb983, _0x5321c7) =>
      requestPersonReplacementLibraryAssignment({
        project: _0x57b9e5,
        selectedAssetIds: _0x5eb983,
        targetKind: _0x5321c7,
        root: _0x42b7b0,
        documentObject: documentObject,
        windowObject: windowObject,
        hasWorkspaceIntent: _0x750640,
        runIntent: _0x4e3281,
      }),
    _0x1ee13c = (_0x4721fa) => {
      if (_0x4aeba7?.['handleClick'](_0x4721fa)) return;
      const _0x2c73b4 = _0x546083;
      _0x546083 = null;
      if (_0x2c73b4 && (_0x4721fa['target'] === _0x2c73b4 || _0x2c73b4['contains']?.(_0x4721fa['target']))) {
        (_0x4721fa['preventDefault']?.(), _0x4721fa['stopPropagation']?.());
        return;
      }
      if (_0x23c082['handleClick'](_0x4721fa)) return;
      !_0x4721fa['target']?.['closest']?.('[data-person-replacement-output-menu]') && _0x624e11();
      !_0x4721fa['target']?.['closest']?.('.person-replacement-library-add-menu-wrap') && _0x318ab0();
      !_0x4721fa['target']?.['closest']?.('.person-replacement-add-voice-menu-wrap') && _0x4ba512();
      if (_0x5b9bfb['toggleFromTarget'](_0x4721fa['target'])) return;
      if (_0x4d8968?.['consumeClick']?.(_0x4721fa)) return;
      if (!_0x4721fa['target']?.['closest']?.('.story-home-param-picker')) _0x1399ed();
      !_0x4721fa['target']?.['closest']?.('[data-person-replacement-detection-picker]') && _0x1c8c49();
      if (_0x4935d9(_0x4721fa)) return;
      const _0x956563 = _0x4721fa['target']?.['closest']?.('[data-person-replacement-shot-cut-timeline]');
      if (
        _0x4e4610['isOpen'] &&
        _0x956563 &&
        Number(_0x4721fa['detail']) > 0x0 &&
        !_0x4721fa['target']?.['closest']?.('[data-person-replacement-cut-boundary-index]')
      ) {
        (_0x4721fa['preventDefault']?.(), _0x57503e(_0x5272fe(_0x4721fa, _0x956563)));
        return;
      }
      const _0x5b364d = _0x4721fa['target']?.['closest']?.('[data-story-asset-name-id]');
      if (_0x5b364d && _0x42b7b0['contains'](_0x5b364d)) {
        (_0x4721fa['preventDefault']?.(),
          _0x4721fa['stopPropagation']?.(),
          _0x58b712(),
          _0x5a1098(_0x5b364d));
        return;
      }
      const _0x4330ba = _0x4721fa['target']?.['closest']?.('[data-story-home-param-trigger="asset-preset"]');
      if (_0x4330ba && _0x42b7b0['contains'](_0x4330ba)) {
        const _0x2ab477 = _0x4330ba['closest']?.('.story-home-param-picker'),
          _0x2a4cdf = !_0x2ab477?.['classList']?.['contains']?.('is-open');
        (_0x1399ed(_0x2ab477),
          _0x2ab477?.['classList']?.['toggle']?.('is-open', _0x2a4cdf),
          _0x4330ba['setAttribute']?.('aria-expanded', String(_0x2a4cdf)));
        return;
      }
      const _0xb780e5 = _0x4721fa['target']?.['closest']?.('[data-story-asset-preset-option]');
      if (_0xb780e5 && _0x42b7b0['contains'](_0xb780e5)) {
        _0x26d845(
          {
            ..._0x57b9e5,
            workspace: {
              ..._0x57b9e5['workspace'],
              assetPromptPresetId: normalizePersonReplacementAssetPromptPresetId(
                _0xb780e5['dataset']['storyAssetPresetOption'],
              ),
            },
          },
          'asset-prompt-preset',
        );
        return;
      }
      const _0x3dbca1 = _0x4721fa['target']?.['closest']?.('[data-ref-remove-action]');
      if (_0x3dbca1 && _0x42b7b0['contains'](_0x3dbca1)) {
        const _0xad5d2e = normalizeText(_0x3dbca1['dataset']['refRemoveAction']);
        if (
          ['clear-person-replacement-target', 'clear-person-replacement-scene-reference']['includes'](
            _0xad5d2e,
          )
        ) {
          _0x4721fa['preventDefault']?.();
          let _0x3347d1 = null;
          try {
            _0x3347d1 = JSON['parse'](_0x3dbca1['dataset']['refRemoveValue'] || '{}');
          } catch {
            _0x3347d1 = null;
          }
          if (_0x3347d1 && _0xad5d2e === 'clear-person-replacement-target')
            _0x2012da(_0x3347d1, 'person-mapping-clear-reference');
          else
            _0x3347d1 &&
              _0xad5d2e === 'clear-person-replacement-scene-reference' &&
              _0x41e8c9({ shotId: _0x3347d1['shotId'] }, 'scene-reference-clear');
          return;
        }
      }
      const _0x30d011 = _0x4721fa['target']?.['closest']?.(
        '[data-person-replacement-video-reference-inputs] .ref-thumb-delete',
      );
      if (_0x30d011 && _0x42b7b0['contains'](_0x30d011)) {
        const _0x15b948 = _0x30d011['closest']?.('[data-slot]');
        _0x15b948 &&
          (_0x4721fa['preventDefault']?.(),
          _0x4e3281(
            _0x43f995['REMOVE_REPLACEMENT_VIDEO_INPUT'],
            {
              shotId: _0x57b9e5['workspace']['selectedShotId'],
              slotId: _0x15b948['dataset']['slot'],
              kind: _0x15b948['dataset']['kind'],
              modelId: _0x57b9e5['settings']['replacementModelId'],
            },
            {},
            { applyCallbackResult: ![] },
          ));
        return;
      }
      const _0x470b8f = _0x4721fa['target']?.['closest']?.(
        '[data-person-replacement-video-reference-inputs]\x20.ref-upload-slot[data-slot]',
      );
      if (_0x470b8f && _0x42b7b0['contains'](_0x470b8f)) {
        const _0x1da40c = normalizeText(_0x470b8f['dataset']['kind']);
        _0x40a90d = {
          kind: _0x1da40c,
          shotId: _0x57b9e5['workspace']['selectedShotId'],
          slotId: _0x470b8f['dataset']['slot'],
          modelId: _0x57b9e5['settings']['replacementModelId'],
        };
        const _0x5343d3 = _0x42b7b0['querySelector']?.(
          '[data-person-replacement-input=\x27replacement-video-slot\x27]',
        );
        _0x5343d3 &&
          ((_0x5343d3['accept'] = _0x1da40c === 'image' ? 'image/*' : 'video/*'), _0x5343d3['click']?.());
        return;
      }
      const _0x1560f2 = _0x4721fa['target']?.['closest']?.('[data-story-asset-id]');
      if (_0x1560f2 && _0x42b7b0['contains'](_0x1560f2)) {
        const _0x2e05f4 = normalizeText(_0x1560f2['dataset']['storyAssetId']);
        if (_0x1560f2['dataset']['personReplacementShotCard'] === 'true') {
          const _0x4db69e = resolveWorkspaceCardMultiSelection({
            selectedIds: _0x57b9e5['workspace']['selectedShotIds'],
            itemId: _0x2e05f4,
            activeItemId: _0x57b9e5['workspace']['selectedShotId'],
            selectionMode: _0x57b9e5['workspace']['shotSelectionMode'],
            shiftKey: _0x4721fa['shiftKey'] === !![],
            toggleKey: _0x4721fa['ctrlKey'] || _0x4721fa['metaKey'],
            orderedIds: _0x57b9e5['shots']['map']((_0x4280c4) => _0x4280c4['id']),
          });
          (_0x4db69e['handled'] &&
            _0x26d845(
              {
                ..._0x57b9e5,
                workspace: {
                  ..._0x57b9e5['workspace'],
                  shotSelectionMode:
                    _0x4db69e['selectionMode'] &&
                    Boolean(_0x4721fa['shiftKey'] || _0x4721fa['ctrlKey'] || _0x4721fa['metaKey']),
                  selectedShotIds: _0x4db69e['selectedIds'],
                },
              },
              'shot-selection',
            ),
            !_0x4721fa['shiftKey'] && !_0x4721fa['ctrlKey'] && !_0x4721fa['metaKey'] && _0x2bd9ab(_0x2e05f4));
        } else {
          if (
            _0x57b9e5['workspace']['step'] === 0x2 &&
            _0x1560f2['dataset']['personReplacementReplacementAssetKind'] === 'scene'
          ) {
            if (_0x57b9e5['workspace']['selectedSceneId'] === _0x2e05f4) return;
            _0x26d845(
              { ..._0x57b9e5, workspace: { ..._0x57b9e5['workspace'], selectedSceneId: _0x2e05f4 } },
              'replacement-scene-asset-select',
            );
          } else {
            if (
              _0x57b9e5['workspace']['step'] === 0x2 &&
              _0x1560f2['dataset']['personReplacementTargetCharacterId']
            ) {
              if (_0x57b9e5['workspace']['selectedCharacterId'] === _0x2e05f4) return;
              _0x26d845(
                { ..._0x57b9e5, workspace: { ..._0x57b9e5['workspace'], selectedCharacterId: _0x2e05f4 } },
                'replacement-target-asset-select',
              );
            } else {
              if (_0x57b9e5['workspace']['characterAssetTab'] === 'audio') {
                const _0x19dc02 = resolveWorkspaceCardMultiSelection({
                  selectedIds: _0x57b9e5['workspace']['selectedAssetIds'],
                  itemId: _0x2e05f4,
                  activeItemId: _0x57b9e5['workspace']['selectedAudioAssetId'],
                  orderedIds: getPersonReplacementSelectableAssets(_0x57b9e5, 'audio')['map'](
                    (_0xaa2cca) => _0xaa2cca['id'],
                  ),
                  shiftKey: _0x4721fa['shiftKey'],
                  toggleKey: _0x4721fa['ctrlKey'] || _0x4721fa['metaKey'],
                });
                _0x26d845(
                  {
                    ..._0x57b9e5,
                    workspace: {
                      ..._0x57b9e5['workspace'],
                      selectedAudioAssetId: _0x2e05f4,
                      assetSelectionMode: _0x19dc02['selectionMode'],
                      selectedAssetIds: _0x19dc02['selectedIds'],
                    },
                  },
                  'audio-library-asset-select',
                );
              } else {
                if (_0x57b9e5['workspace']['characterAssetTab'] === 'scene') {
                  const _0xdaec17 = resolveWorkspaceCardMultiSelection({
                    selectedIds: _0x57b9e5['workspace']['selectedAssetIds'],
                    itemId: _0x2e05f4,
                    activeItemId: _0x57b9e5['workspace']['selectedSceneId'],
                    orderedIds: getPersonReplacementSelectableAssets(_0x57b9e5, 'scene')['map'](
                      (_0x5ce21c) => _0x5ce21c['id'],
                    ),
                    toggleKey: _0x4721fa['ctrlKey'] || _0x4721fa['metaKey'],
                    selectionMode: _0x57b9e5['workspace']['assetSelectionMode'],
                    shiftKey: _0x4721fa['shiftKey'] === !![],
                  });
                  _0x26d845(
                    {
                      ..._0x57b9e5,
                      workspace: {
                        ..._0x57b9e5['workspace'],
                        selectedSceneId: _0x2e05f4,
                        ...(_0xdaec17['handled']
                          ? {
                              assetSelectionMode: _0xdaec17['selectionMode'],
                              selectedAssetIds: _0xdaec17['selectedIds'],
                            }
                          : { selectedSceneId: _0x2e05f4 }),
                      },
                    },
                    'scene-asset-select',
                  );
                } else {
                  if (_0x57b9e5['workspace']['characterAssetTab'] === 'library') {
                    const _0x520c16 = _0x57b9e5['libraryAssets']['find'](
                        (_0x372b84) => _0x372b84['id'] === _0x2e05f4,
                      ),
                      _0x1cfb00 = resolveWorkspaceCardMultiSelection({
                        selectedIds: _0x57b9e5['workspace']['selectedAssetIds'],
                        itemId: _0x2e05f4,
                        activeItemId: _0x57b9e5['workspace']['selectedLibraryAssetId'],
                        orderedIds: getWorkspaceAssetLibrarySelectionOrder(
                          getPersonReplacementSelectableAssets(_0x57b9e5, 'library'),
                          _0x5b9bfb,
                        ),
                        toggleKey: _0x4721fa['ctrlKey'] || _0x4721fa['metaKey'],
                        selectionMode: _0x57b9e5['workspace']['assetSelectionMode'],
                        shiftKey: _0x4721fa['shiftKey'] === !![],
                        enabled: Boolean(
                          (normalizeText(_0x520c16?.['mediaKind'])['toLowerCase']() === 'image' &&
                            normalizeText(_0x520c16?.['sourceUrl'] || _0x520c16?.['imageUrl'])) ||
                          (normalizeText(_0x520c16?.['mediaKind'])['toLowerCase']() === 'audio' &&
                            getPersonReplacementLibraryAudioRef(_0x520c16)),
                        ),
                      });
                    _0x26d845(
                      {
                        ..._0x57b9e5,
                        workspace: {
                          ..._0x57b9e5['workspace'],
                          selectedLibraryAssetId: _0x2e05f4,
                          ...(_0x1cfb00['handled']
                            ? {
                                assetSelectionMode: _0x1cfb00['selectionMode'],
                                selectedAssetIds: _0x1cfb00['selectedIds'],
                              }
                            : {}),
                        },
                      },
                      'library-asset-select',
                    );
                  } else {
                    const _0x5f0709 = resolveWorkspaceCardMultiSelection({
                      selectedIds: _0x57b9e5['workspace']['selectedAssetIds'],
                      itemId: _0x2e05f4,
                      activeItemId: _0x57b9e5['workspace']['selectedCharacterId'],
                      orderedIds: getPersonReplacementSelectableAssets(_0x57b9e5, 'character')['map'](
                        (_0x26a61a) => _0x26a61a['id'],
                      ),
                      toggleKey: _0x4721fa['ctrlKey'] || _0x4721fa['metaKey'],
                      selectionMode: _0x57b9e5['workspace']['assetSelectionMode'],
                      shiftKey: _0x4721fa['shiftKey'] === !![],
                    });
                    _0x26d845(
                      {
                        ..._0x57b9e5,
                        workspace: {
                          ..._0x57b9e5['workspace'],
                          selectedCharacterId: _0x2e05f4,
                          ...(_0x5f0709['handled']
                            ? {
                                assetSelectionMode: _0x5f0709['selectionMode'],
                                selectedAssetIds: _0x5f0709['selectedIds'],
                              }
                            : { selectedCharacterId: _0x2e05f4 }),
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
        focusWorkspaceAssetCard(_0x42b7b0, _0x2e05f4);
        return;
      }
      const _0x728570 = _0x4721fa['target']?.['closest']?.('[data-story-action]');
      if (_0x728570 && _0x42b7b0['contains'](_0x728570)) {
        _0x478e16(_0x728570, normalizeText(_0x728570['dataset']['storyAction']));
        return;
      }
      const _0x8ec19 = _0x4721fa['target']?.['closest']?.('[data-story-open-project]');
      if (
        _0x8ec19 &&
        _0x42b7b0['contains'](_0x8ec19) &&
        !_0x4721fa['target']?.['closest']?.('[data-story-project-title]')
      ) {
        _0x4e3281(_0x43f995['OPEN_PROJECT'], _0x8ec19['dataset']['storyOpenProject']);
        return;
      }
      _0x57b9e5['workspace']['view'] === 'home' &&
        !_0x4721fa['target']?.['closest']?.('[data-story-project-sort-wrap]') &&
        _0x497b01(![]);
      _0x57b9e5['workspace']['view'] === 'home' &&
        _0x57b9e5['workspace']['openProjectMenuId'] &&
        !_0x4721fa['target']?.['closest']?.('[data-story-project-menu-wrap]') &&
        ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
          ..._0x57b9e5,
          workspace: { ..._0x57b9e5['workspace'], openProjectMenuId: '' },
        })),
        _0x42b7b0?.['querySelectorAll']?.('.story-project-card.is-menu-open')?.['forEach']?.((_0x544497) => {
          _0x544497['classList']?.['remove']?.('is-menu-open');
          const _0x4b7463 = _0x544497['querySelector']?.("[data-story-action='toggle-project-menu']"),
            _0x1ead8c = _0x544497['querySelector']?.('[data-story-project-menu]');
          (_0x4b7463?.['setAttribute']?.('aria-expanded', 'false'),
            _0x1ead8c?.['setAttribute']?.('aria-hidden', 'true'));
          if (_0x1ead8c) _0x1ead8c['hidden'] = !![];
        }));
      if (_0x4721fa['target']?.['closest']?.('[data-person-replacement-cut-boundary-index]')) return;
      const _0x1d4b2f = _0x4721fa['target']?.['closest']?.('[data-person-replacement-action]');
      if (!_0x1d4b2f || !_0x42b7b0['contains'](_0x1d4b2f)) return;
      const _0x2a330c = _0x1d4b2f['dataset']['personReplacementAction'];
      if (_0x2a330c === 'confirm-person-mapping-scope') {
        const _0x58707f = _0x236762?.['mapping'],
          _0x4d3660 =
            normalizeText(_0x1d4b2f['dataset']['personReplacementMappingScope'])['toLowerCase']() ===
            'current'
              ? 'current'
              : 'all';
        (_0x524d22(), _0x58707f && _0x2337bb({ ..._0x58707f, scope: _0x4d3660 }));
      } else {
        if (_0x2a330c === 'close') _0x2edc43['close']();
        else {
          if (_0x2a330c === 'back-home') _0x4e3281(_0x43f995['BACK_HOME'], cloneJson(_0x57b9e5));
          else {
            if (_0x2a330c === 'open-project')
              _0x4e3281(_0x43f995['OPEN_PROJECT'], _0x1d4b2f['dataset']['projectId']);
            else {
              if (_0x2a330c === 'select-step') _0x1a3d01(_0x1d4b2f['dataset']['personReplacementStep']);
              else {
                if (_0x2a330c === 'previous-step') _0x1a3d01(_0x57b9e5['workspace']['step'] - 0x1);
                else {
                  if (_0x2a330c === 'next-step') _0x1a3d01(_0x57b9e5['workspace']['step'] + 0x1);
                  else {
                    if (_0x2a330c === 'set-video-input-mode') {
                      const _0x5a960d =
                        _0x1d4b2f['dataset']['personReplacementVideoInputMode'] ===
                        PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE
                          ? PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE
                          : PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME;
                      if (_0x5a960d === _0x57b9e5['settings']['replacementVideoInputMode']) return;
                      const _0x3fa261 = documentObject?.['activeElement'] === _0x1d4b2f,
                        _0x3379d5 = resolvePersonReplacementVideoParameterPolicy({
                          modelId: _0x57b9e5['settings']['replacementModelId'],
                          inputMode: _0x5a960d,
                          generationParams: _0x57b9e5['settings']['replacementVideoGenerationParams'],
                          resetModeDefaults: !![],
                        });
                      _0x26d845(
                        {
                          ..._0x57b9e5,
                          settings: {
                            ..._0x57b9e5['settings'],
                            replacementVideoInputMode: _0x5a960d,
                            replacementVideoGenerationParams: _0x3379d5['generationParams'],
                          },
                        },
                        'video-input-mode',
                      );
                      if (_0x3fa261)
                        _0x42b7b0['querySelector'](
                          '[data-person-replacement-action="set-video-input-mode"]',
                        )?.['focus']?.({ preventScroll: !![] });
                    } else {
                      if (_0x2a330c === 'select-voice-source') _0x43d4f5(_0x1d4b2f['dataset']['sourceId']);
                      else {
                        if (_0x2a330c === 'extract-clean-voice')
                          _0x4e3281(
                            _0x43f995['EXTRACT_VOICE'],
                            _0x1d4b2f['dataset']['sourceId'],
                            {},
                            { applyCallbackResult: ![] },
                          );
                        else {
                          if (_0x2a330c === 'cancel-voice-separation')
                            _0x4e3281(
                              _0x43f995['CANCEL_VOICE_EXTRACTION'],
                              _0x1d4b2f['dataset']['sourceId'],
                              {},
                              { applyCallbackResult: ![] },
                            );
                          else {
                            if (_0x2a330c === 'select-voice-asset')
                              _0x3400a4(_0x1d4b2f['dataset']['characterId']);
                            else {
                              if (_0x2a330c === 'choose-source-videos')
                                _0x42b7b0['querySelector'](
                                  "[data-person-replacement-input='source-videos']",
                                )?.['click']?.();
                              else {
                                if (_0x2a330c === 'remove-source')
                                  _0x4e3281(_0x43f995['REMOVE_SOURCE'], {
                                    sourceId: _0x1d4b2f['dataset']['sourceId'],
                                  });
                                else {
                                  if (_0x2a330c === 'choose-new-character-images')
                                    _0x42b7b0['querySelector'](
                                      "[data-person-replacement-input='new-character-images']",
                                    )?.['click']?.();
                                  else {
                                    if (_0x2a330c === 'choose-new-scene-images')
                                      _0x42b7b0['querySelector'](
                                        "[data-person-replacement-input='new-scene-images']",
                                      )?.['click']?.();
                                    else {
                                      if (_0x2a330c === 'choose-new-audio-files')
                                        _0x42b7b0['querySelector'](
                                          "[data-person-replacement-input='new-audio-files']",
                                        )?.['click']?.();
                                      else {
                                        if (_0x2a330c === 'cancel-character-voice-library') {
                                          const _0x2c62c4 = _0x834763;
                                          ((_0x834763 = ''),
                                            _0x26d845(
                                              {
                                                ..._0x57b9e5,
                                                workspace: {
                                                  ..._0x57b9e5['workspace'],
                                                  characterAssetTab: 'character',
                                                  selectedCharacterId:
                                                    _0x2c62c4 ||
                                                    _0x57b9e5['workspace']['selectedCharacterId'],
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
                                            ]['includes'](_0x2a330c)
                                          ) {
                                            const _0xc667a9 = _0x1d4b2f['closest'](
                                                '[data-workspace-audio-asset-id]',
                                              ),
                                              _0x551cb3 = _0xc667a9?.['dataset']['workspaceAudioAssetId'],
                                              _0x37864b = [
                                                ..._0x57b9e5['audioAssets'],
                                                ..._0x57b9e5['libraryAssets'],
                                              ]['find']((_0x39d500) => _0x39d500['id'] === _0x551cb3);
                                            if (!_0x37864b) return;
                                            if (_0x2a330c === 'add-project-audio')
                                              _0x4f358e([_0x551cb3], 'audio');
                                            else {
                                              if (_0x2a330c === 'remove-project-audio')
                                                _0x4e3281(_0x43f995['DELETE_AUDIO_ASSET'], {
                                                  audioAssetId: _0x551cb3,
                                                });
                                              else {
                                                const _0x560239 = _0xc667a9['querySelector'](
                                                  '[data-person-replacement-audio-character]',
                                                )?.['value'];
                                                if (
                                                  _0x57b9e5['characters']['some'](
                                                    (_0x15050c) => _0x15050c['id'] === _0x560239,
                                                  )
                                                )
                                                  _0x4e3281(_0x43f995['SELECT_CHARACTER_VOICE_LIBRARY'], {
                                                    characterId: _0x560239,
                                                    asset: cloneJson(_0x37864b),
                                                  });
                                              }
                                            }
                                          } else {
                                            if (_0x2a330c === 'confirm-character-voice-library') {
                                              const _0x76c2fb = _0x834763,
                                                _0x3b23ad = normalizeText(
                                                  _0x1d4b2f['dataset']['personReplacementAudioAssetId'],
                                                ),
                                                _0x4ab82a = _0x57b9e5['audioAssets']['find'](
                                                  (_0x38a2bd) =>
                                                    _0x38a2bd['id'] ===
                                                      (_0x3b23ad ||
                                                        _0x57b9e5['workspace']['selectedAudioAssetId']) &&
                                                    normalizeText(_0x38a2bd?.['mediaKind'])[
                                                      'toLowerCase'
                                                    ]() === 'audio',
                                                );
                                              if (
                                                !_0x76c2fb ||
                                                !getPersonReplacementLibraryAudioRef(_0x4ab82a)
                                              ) {
                                                windowObject?.['showToast']?.(
                                                  '请选择要添加的人设声音。',
                                                  'warn',
                                                );
                                                return;
                                              }
                                              const _0x35f2cd = (_0x1be0ad) => {
                                                  if (!_0x1be0ad) return;
                                                  ((_0x834763 = ''),
                                                    _0x26d845(
                                                      {
                                                        ..._0x57b9e5,
                                                        workspace: {
                                                          ..._0x57b9e5['workspace'],
                                                          characterAssetTab: 'character',
                                                          selectedCharacterId: _0x76c2fb,
                                                          assetSelectionMode: ![],
                                                          selectedAssetIds: [],
                                                        },
                                                      },
                                                      'character-voice-library-confirm',
                                                    ));
                                                },
                                                _0x320c4e = _0x4e3281(
                                                  _0x43f995['SELECT_CHARACTER_VOICE_LIBRARY'],
                                                  { characterId: _0x76c2fb, asset: cloneJson(_0x4ab82a) },
                                                );
                                              if (_0x320c4e?.['then']) void _0x320c4e['then'](_0x35f2cd);
                                              else _0x35f2cd(_0x320c4e);
                                            } else {
                                              if (_0x2a330c === 'toggle-library-add-targets') {
                                                const _0x30704c = _0x1d4b2f['closest']?.(
                                                    '.person-replacement-library-add-menu-wrap',
                                                  ),
                                                  _0x4abeb4 =
                                                    !_0x30704c?.['classList']?.['contains']?.('is-open');
                                                (_0x318ab0(_0x30704c), _0x29175f(_0x30704c, _0x4abeb4));
                                              } else {
                                                if (
                                                  _0x2a330c === 'add-library-assets-to-project' ||
                                                  _0x2a330c === 'add-library-assets-to-characters'
                                                ) {
                                                  const _0x1d040b = normalizeText(
                                                      _0x1d4b2f['dataset'][
                                                        'personReplacementLibraryTargetKind'
                                                      ],
                                                    ),
                                                    _0x383517 =
                                                      _0x2a330c === 'add-library-assets-to-characters'
                                                        ? 'character'
                                                        : ['character', 'scene', 'audio']['includes'](
                                                              _0x1d040b,
                                                            )
                                                          ? _0x1d040b
                                                          : 'character';
                                                  _0x29175f(
                                                    _0x1d4b2f['closest']?.(
                                                      '.person-replacement-library-add-menu-wrap',
                                                    ),
                                                    ![],
                                                  );
                                                  const _0x598d8b = _0x57b9e5['workspace'][
                                                    'assetSelectionMode'
                                                  ]
                                                    ? _0x57b9e5['workspace']['selectedAssetIds']
                                                    : [_0x57b9e5['workspace']['selectedLibraryAssetId']];
                                                  _0x4f358e(_0x598d8b, _0x383517);
                                                } else {
                                                  if (_0x2a330c === 'select-character-asset-tab') {
                                                    const _0x1f2605 = normalizeText(
                                                        _0x1d4b2f['dataset']['assetTab'],
                                                      ),
                                                      _0x3f849e = ['character', 'scene', 'audio', 'library'][
                                                        'includes'
                                                      ](_0x1f2605)
                                                        ? _0x1f2605
                                                        : 'character',
                                                      _0x55a692 =
                                                        _0x3f849e === 'library'
                                                          ? _0x3ccd2d(_0x57b9e5)
                                                          : _0x57b9e5,
                                                      _0x367353 =
                                                        _0x3f849e === 'audio'
                                                          ? getPersonReplacementProjectAudioAssets(_0x55a692)
                                                          : [],
                                                      _0x57b960 =
                                                        _0x3f849e === 'audio'
                                                          ? _0x367353['some'](
                                                              (_0x4fc108) =>
                                                                _0x4fc108['id'] ===
                                                                _0x55a692['workspace'][
                                                                  'selectedAudioAssetId'
                                                                ],
                                                            )
                                                            ? _0x55a692['workspace']['selectedAudioAssetId']
                                                            : _0x367353[0x0]?.['id'] || ''
                                                          : _0x55a692['workspace']['selectedAudioAssetId'];
                                                    if (_0x3f849e !== 'audio') _0x834763 = '';
                                                    _0x26d845(
                                                      {
                                                        ..._0x55a692,
                                                        workspace: {
                                                          ..._0x55a692['workspace'],
                                                          characterAssetTab: _0x3f849e,
                                                          selectedAudioAssetId: _0x57b960,
                                                          assetSelectionMode: ![],
                                                          selectedAssetIds: [],
                                                        },
                                                      },
                                                      'character-asset-tab',
                                                    );
                                                  } else {
                                                    if (_0x2a330c === 'toggle-smart-clip-settings')
                                                      _0x2583b7({
                                                        workspace: {
                                                          smartClipSettingsOpen:
                                                            !_0x57b9e5['workspace']['smartClipSettingsOpen'],
                                                        },
                                                      });
                                                    else {
                                                      if (_0x2a330c === 'set-smart-clip-mode')
                                                        _0x2583b7(
                                                          {
                                                            settings: {
                                                              smartClipMode:
                                                                _0x1d4b2f['dataset']['smartClipMode'],
                                                            },
                                                          },
                                                          { notify: !![] },
                                                        );
                                                      else {
                                                        if (_0x2a330c === 'set-smart-clip-fps')
                                                          _0x2583b7(
                                                            {
                                                              settings: {
                                                                smartClipFps: Number(
                                                                  _0x1d4b2f['dataset']['smartClipFps'],
                                                                ),
                                                              },
                                                            },
                                                            { notify: !![] },
                                                          );
                                                        else {
                                                          if (_0x2a330c === 'process-sources')
                                                            _0x4e3281(_0x43f995['PROCESS_SOURCES'], {
                                                              mode: _0x1d4b2f['dataset']['processingMode'],
                                                            });
                                                          else {
                                                            if (
                                                              _0x24b921['handleAction'](_0x2a330c, {
                                                                target: _0x1d4b2f,
                                                                event: _0x4721fa,
                                                              })
                                                            ) {
                                                            } else {
                                                              if (_0x2a330c === 'select-shot')
                                                                (_0x26bf5a({
                                                                  animate: ![],
                                                                  renderWorkspace: ![],
                                                                }),
                                                                  _0x2bd9ab(_0x1d4b2f['dataset']['shotId']));
                                                              else {
                                                                if (
                                                                  _0x2a330c === 'select-composite-full-video'
                                                                )
                                                                  buildPersonReplacementCompositePreviewSnapshot(
                                                                    _0x57b9e5,
                                                                  )['fullAvailable'] &&
                                                                    _0x26d845(
                                                                      {
                                                                        ..._0x57b9e5,
                                                                        workspace: {
                                                                          ..._0x57b9e5['workspace'],
                                                                          compositePreviewMode: 'full',
                                                                        },
                                                                      },
                                                                      'composite-full-video-select',
                                                                    );
                                                                else {
                                                                  if (
                                                                    _0x2a330c ===
                                                                    'toggle-source-identity-selection'
                                                                  ) {
                                                                    const _0x48e5bb = normalizeText(
                                                                        _0x1d4b2f['dataset'][
                                                                          'sourceCharacterId'
                                                                        ],
                                                                      ),
                                                                      _0x1921f2 = new Set(
                                                                        _0x57b9e5['workspace'][
                                                                          'selectedIdentityIds'
                                                                        ],
                                                                      );
                                                                    if (_0x1921f2['has'](_0x48e5bb))
                                                                      _0x1921f2['delete'](_0x48e5bb);
                                                                    else _0x1921f2['add'](_0x48e5bb);
                                                                    _0x26d845(
                                                                      {
                                                                        ..._0x57b9e5,
                                                                        workspace: {
                                                                          ..._0x57b9e5['workspace'],
                                                                          selectedIdentityIds: [..._0x1921f2],
                                                                        },
                                                                      },
                                                                      'identity-selection',
                                                                    );
                                                                  } else {
                                                                    if (
                                                                      _0x2a330c === 'merge-source-identities'
                                                                    )
                                                                      _0x4e3281(
                                                                        _0x43f995['MERGE_SOURCE_IDENTITIES'],
                                                                        {
                                                                          sourceCharacterIds:
                                                                            _0x57b9e5['workspace'][
                                                                              'selectedIdentityIds'
                                                                            ],
                                                                        },
                                                                      );
                                                                    else {
                                                                      if (
                                                                        _0x2a330c ===
                                                                        'toggle-detection-picker'
                                                                      ) {
                                                                        const _0x32cfdc = _0x1d4b2f[
                                                                            'closest'
                                                                          ]?.(
                                                                            '[data-person-replacement-detection-picker]',
                                                                          ),
                                                                          _0x788884 =
                                                                            !_0x32cfdc?.['classList']?.[
                                                                              'contains'
                                                                            ]?.('is-open');
                                                                        (_0x1c8c49(_0x32cfdc),
                                                                          _0x30a2f8(_0x32cfdc, _0x788884));
                                                                      } else {
                                                                        if (
                                                                          _0x2a330c ===
                                                                          'select-detection-picker-option'
                                                                        ) {
                                                                          const _0x2578b3 = _0x1d4b2f[
                                                                              'closest'
                                                                            ]?.(
                                                                              '[data-person-replacement-detection-picker]',
                                                                            ),
                                                                            _0x4eff23 = normalizeText(
                                                                              _0x2578b3?.['dataset']?.[
                                                                                'personReplacementDetectionPicker'
                                                                              ],
                                                                            ),
                                                                            _0x138735 = normalizeText(
                                                                              _0x1d4b2f['dataset'][
                                                                                'personReplacementDetectionPickerOption'
                                                                              ],
                                                                            ),
                                                                            _0x3365c4 = normalizeText(
                                                                              _0x1d4b2f['querySelector']?.(
                                                                                'span',
                                                                              )?.['textContent'],
                                                                              _0x138735,
                                                                            ),
                                                                            _0x4287f5 = normalizeText(
                                                                              _0x1d4b2f['dataset'][
                                                                                'personReplacementSourceCharacterId'
                                                                              ],
                                                                            ),
                                                                            _0x22a0a9 = _0x2578b3?.[
                                                                              'querySelector'
                                                                            ]?.(
                                                                              '[data-person-replacement-detection-picker-trigger]',
                                                                            ),
                                                                            _0x24e92e = _0x22a0a9?.[
                                                                              'querySelector'
                                                                            ]?.(
                                                                              '[data-person-replacement-detection-picker-value]',
                                                                            ),
                                                                            _0x4caec4 =
                                                                              _0x4eff23 === 'label' &&
                                                                              _0x138735 ===
                                                                                PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE;
                                                                          _0x4caec4 &&
                                                                            _0x22a0a9 &&
                                                                            ((_0x2578b3['dataset'][
                                                                              'personReplacementPreviousValue'
                                                                            ] = normalizeText(
                                                                              _0x22a0a9['value'],
                                                                            )),
                                                                            (_0x2578b3['dataset'][
                                                                              'personReplacementPreviousLabel'
                                                                            ] = normalizeText(
                                                                              _0x24e92e?.['textContent'],
                                                                            )),
                                                                            (_0x2578b3['dataset'][
                                                                              'personReplacementPreviousSourceCharacterId'
                                                                            ] = normalizeText(
                                                                              _0x22a0a9['dataset']?.[
                                                                                'personReplacementSelectedSourceCharacterId'
                                                                              ],
                                                                            )));
                                                                          _0x22a0a9 &&
                                                                            ((_0x22a0a9['value'] = _0x138735),
                                                                            _0x4eff23 === 'label' &&
                                                                              !_0x4caec4 &&
                                                                              (_0x22a0a9['dataset'][
                                                                                'personReplacementSelectedSourceCharacterId'
                                                                              ] = _0x4287f5),
                                                                            _0x22a0a9['setAttribute'](
                                                                              'aria-label',
                                                                              (_0x4eff23 === 'label'
                                                                                ? '人物名称'
                                                                                : _0x4eff23 === 'scope'
                                                                                  ? '替换范围'
                                                                                  : '人物朝向') +
                                                                                '：' +
                                                                                _0x3365c4,
                                                                            ));
                                                                          if (_0x24e92e)
                                                                            _0x24e92e['textContent'] =
                                                                              _0x3365c4;
                                                                          _0x2578b3?.['querySelectorAll']?.(
                                                                            '[data-person-replacement-detection-picker-option]',
                                                                          )?.['forEach']?.((_0x5cd4a5) => {
                                                                            const _0x1e6fa9 =
                                                                              _0x5cd4a5 === _0x1d4b2f;
                                                                            (_0x5cd4a5['classList']?.[
                                                                              'toggle'
                                                                            ]?.('is-selected', _0x1e6fa9),
                                                                              _0x5cd4a5['setAttribute']?.(
                                                                                'aria-selected',
                                                                                String(_0x1e6fa9),
                                                                              ));
                                                                          });
                                                                          if (_0x4eff23 === 'label') {
                                                                            const _0x1458b7 = _0x2578b3?.[
                                                                                'querySelector'
                                                                              ]?.(
                                                                                '[data-person-replacement-person-custom-label]',
                                                                              ),
                                                                              _0x4000f5 =
                                                                                _0x138735 ===
                                                                                PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE;
                                                                            if (_0x22a0a9)
                                                                              _0x22a0a9['hidden'] = _0x4000f5;
                                                                            _0x1458b7 &&
                                                                              ((_0x1458b7['hidden'] =
                                                                                !_0x4000f5),
                                                                              _0x4000f5 &&
                                                                                ((_0x1458b7['value'] = ''),
                                                                                _0x1458b7['focus']?.()));
                                                                          }
                                                                          _0x30a2f8(_0x2578b3, ![]);
                                                                          const _0x1fb399 = _0x2578b3?.[
                                                                            'closest'
                                                                          ]?.(
                                                                            '.person-replacement-detection-box',
                                                                          );
                                                                          if (_0x4eff23 === 'orientation') {
                                                                            const _0x5d0111 = _0x1fb399?.[
                                                                              'querySelector'
                                                                            ]?.(
                                                                              '[data-person-replacement-person-label]',
                                                                            );
                                                                            _0x5569e2({
                                                                              detectionBox: _0x1fb399,
                                                                              label: _0x5d0111?.[
                                                                                'querySelector'
                                                                              ]?.(
                                                                                '[data-person-replacement-detection-picker-value]',
                                                                              )?.['textContent'],
                                                                              sourceCharacterId:
                                                                                _0x5d0111?.['dataset']?.[
                                                                                  'personReplacementSelectedSourceCharacterId'
                                                                                ],
                                                                              orientation: _0x138735,
                                                                            });
                                                                          } else {
                                                                            if (_0x4eff23 === 'scope')
                                                                              _0x4e3281(
                                                                                _0x43f995['UPDATE_PEOPLE'],
                                                                                {
                                                                                  shotId: normalizeText(
                                                                                    _0x1fb399?.['dataset']?.[
                                                                                      'shotId'
                                                                                    ] ||
                                                                                      _0x57b9e5['workspace'][
                                                                                        'selectedShotId'
                                                                                      ],
                                                                                  ),
                                                                                  updates: [
                                                                                    {
                                                                                      personId: normalizeText(
                                                                                        _0x1fb399?.[
                                                                                          'dataset'
                                                                                        ]?.['personId'],
                                                                                      ),
                                                                                      replacementScope:
                                                                                        _0x138735,
                                                                                    },
                                                                                  ],
                                                                                },
                                                                              );
                                                                            else
                                                                              _0x138735 !==
                                                                                PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE &&
                                                                                _0x5569e2({
                                                                                  detectionBox: _0x1fb399,
                                                                                  label: _0x3365c4,
                                                                                  sourceCharacterId:
                                                                                    _0x4287f5,
                                                                                });
                                                                          }
                                                                        } else {
                                                                          if (
                                                                            _0x2a330c ===
                                                                            'delete-detection-custom-label'
                                                                          ) {
                                                                            const _0x108e8d = normalizeText(
                                                                              _0x1d4b2f['dataset'][
                                                                                'personReplacementCustomLabel'
                                                                              ],
                                                                            );
                                                                            if (
                                                                              !_0x108e8d ||
                                                                              isGeneratedPersonReplacementLabel(
                                                                                _0x108e8d,
                                                                              )
                                                                            )
                                                                              return;
                                                                            const _0x3b2b5a = new Set(
                                                                              _0x57b9e5['workspace'][
                                                                                'removedCustomPersonLabels'
                                                                              ],
                                                                            );
                                                                            (_0x3b2b5a['add'](_0x108e8d),
                                                                              _0x26d845(
                                                                                {
                                                                                  ..._0x57b9e5,
                                                                                  workspace: {
                                                                                    ..._0x57b9e5['workspace'],
                                                                                    removedCustomPersonLabels:
                                                                                      [..._0x3b2b5a],
                                                                                  },
                                                                                },
                                                                                'person-custom-label-delete',
                                                                              ));
                                                                          } else {
                                                                            if (
                                                                              _0x2a330c ===
                                                                              'clear-person-mapping'
                                                                            )
                                                                              _0x2012da({
                                                                                shotId:
                                                                                  _0x1d4b2f['dataset'][
                                                                                    'shotId'
                                                                                  ],
                                                                                personId:
                                                                                  _0x1d4b2f['dataset'][
                                                                                    'personId'
                                                                                  ],
                                                                              });
                                                                            else {
                                                                              if (
                                                                                _0x2a330c === 'delete-person'
                                                                              )
                                                                                (_0x218fa0(),
                                                                                  _0x1feb36(
                                                                                    _0x43f995[
                                                                                      'DELETE_PEOPLE'
                                                                                    ],
                                                                                    {
                                                                                      shotId:
                                                                                        _0x1d4b2f['dataset'][
                                                                                          'shotId'
                                                                                        ],
                                                                                      personIds: [
                                                                                        _0x1d4b2f['dataset'][
                                                                                          'personId'
                                                                                        ],
                                                                                      ],
                                                                                    },
                                                                                  ));
                                                                              else {
                                                                                if (
                                                                                  _0x2a330c ===
                                                                                  'clear-shot-people'
                                                                                ) {
                                                                                  const _0x53ca0b =
                                                                                      normalizeText(
                                                                                        _0x1d4b2f['dataset'][
                                                                                          'shotId'
                                                                                        ] ||
                                                                                          _0x57b9e5[
                                                                                            'workspace'
                                                                                          ]['selectedShotId'],
                                                                                      ),
                                                                                    _0x372efc = _0x57b9e5[
                                                                                      'shots'
                                                                                    ]['find'](
                                                                                      (_0x77ba1a) =>
                                                                                        _0x77ba1a['id'] ===
                                                                                        _0x53ca0b,
                                                                                    ),
                                                                                    _0x357cc7 =
                                                                                      getPersonReplacementBoxedPeople(
                                                                                        _0x372efc,
                                                                                      )
                                                                                        ['map']((_0x2c6bbf) =>
                                                                                          normalizeText(
                                                                                            _0x2c6bbf['id'],
                                                                                          ),
                                                                                        )
                                                                                        ['filter'](Boolean);
                                                                                  if (!_0x357cc7['length'])
                                                                                    return;
                                                                                  (_0x218fa0(),
                                                                                    _0x113bbe(),
                                                                                    _0x1feb36(
                                                                                      _0x43f995[
                                                                                        'DELETE_PEOPLE'
                                                                                      ],
                                                                                      {
                                                                                        shotId: _0x53ca0b,
                                                                                        personIds: _0x357cc7,
                                                                                      },
                                                                                    ));
                                                                                } else {
                                                                                  if (
                                                                                    _0x2a330c ===
                                                                                      'toggle-prompt-enhancement' ||
                                                                                    _0x2a330c ===
                                                                                      'toggle-prompt-mode'
                                                                                  ) {
                                                                                    const _0x3bfbf3 =
                                                                                      applyPersonReplacementPromptControlAction(
                                                                                        _0x57b9e5,
                                                                                        _0x2a330c,
                                                                                        _0x1d4b2f,
                                                                                        _0x53365b()[
                                                                                          'generatingShotIds'
                                                                                        ],
                                                                                      );
                                                                                    if (!_0x3bfbf3) return;
                                                                                    ((_0x57b9e5 =
                                                                                      normalizePersonReplacementWorkspaceProject(
                                                                                        {
                                                                                          ..._0x57b9e5,
                                                                                          ..._0x3bfbf3[
                                                                                            'patch'
                                                                                          ],
                                                                                        },
                                                                                      )),
                                                                                      syncPersonReplacementPromptModeControl(
                                                                                        _0x42b7b0,
                                                                                        _0x57b9e5,
                                                                                        _0x53365b()[
                                                                                          'generatingShotIds'
                                                                                        ],
                                                                                      ),
                                                                                      _0x273c17(
                                                                                        _0x3bfbf3['reason'],
                                                                                      ));
                                                                                    if (
                                                                                      _0x2a330c ===
                                                                                      'toggle-prompt-mode'
                                                                                    )
                                                                                      syncPersonReplacementImagePromptGate(
                                                                                        _0x42b7b0,
                                                                                        _0x57b9e5,
                                                                                        _0x1f9cef(),
                                                                                      );
                                                                                  } else {
                                                                                    if (
                                                                                      _0x2a330c ===
                                                                                      'generate-replacement-image'
                                                                                    ) {
                                                                                      if (
                                                                                        _0x57b9e5[
                                                                                          'workspace'
                                                                                        ]['shotSelectionMode']
                                                                                      ) {
                                                                                        if (_0x4fea56()) {
                                                                                          _0x1d3a8e();
                                                                                          return;
                                                                                        }
                                                                                        _0x2daac8('image');
                                                                                        return;
                                                                                      }
                                                                                      const _0x1109c3 =
                                                                                          personReplacementImagePresentation[
                                                                                            'build'
                                                                                          ](_0x57b9e5),
                                                                                        _0x1bd06d =
                                                                                          _0x1109c3[
                                                                                            'selectedShot'
                                                                                          ],
                                                                                        _0x22ce60 =
                                                                                          _0x1109c3['gate'][
                                                                                            'duplicateRoleLabels'
                                                                                          ];
                                                                                      if (
                                                                                        !_0x1109c3['gate'][
                                                                                          'sceneOnly'
                                                                                        ] &&
                                                                                        _0x22ce60['length']
                                                                                      ) {
                                                                                        windowObject?.[
                                                                                          'showToast'
                                                                                        ]?.(
                                                                                          '同一镜头内角色不能重复：' +
                                                                                            _0x22ce60['join'](
                                                                                              '、',
                                                                                            ) +
                                                                                            '。请修改红色框中的角色名。',
                                                                                          'warn',
                                                                                        );
                                                                                        return;
                                                                                      }
                                                                                      if (
                                                                                        !_0x1109c3['gate'][
                                                                                          'sceneOnly'
                                                                                        ] &&
                                                                                        _0x1109c3['gate'][
                                                                                          'unresolvedOrientationPersonIds'
                                                                                        ]['length']
                                                                                      ) {
                                                                                        windowObject?.[
                                                                                          'showToast'
                                                                                        ]?.(
                                                                                          '还有 ' +
                                                                                            _0x1109c3['gate'][
                                                                                              'unresolvedOrientationPersonIds'
                                                                                            ]['length'] +
                                                                                            '\x20个人物未确认朝向，请先选择朝向。',
                                                                                          'warn',
                                                                                        );
                                                                                        return;
                                                                                      }
                                                                                      const _0x418f88 =
                                                                                        _0x42b7b0?.[
                                                                                          'querySelector'
                                                                                        ]?.(
                                                                                          '[data-person-replacement-keyframe-stage] > img',
                                                                                        );
                                                                                      _0x4e3281(
                                                                                        _0x43f995[
                                                                                          'GENERATE_REPLACEMENT_IMAGE'
                                                                                        ],
                                                                                        {
                                                                                          projectId:
                                                                                            _0x57b9e5['id'],
                                                                                          shotId:
                                                                                            _0x57b9e5[
                                                                                              'workspace'
                                                                                            ][
                                                                                              'selectedShotId'
                                                                                            ],
                                                                                          sourceImageSize:
                                                                                            resolvePersonReplacementSourceImageSize(
                                                                                              _0x418f88,
                                                                                              _0x1bd06d,
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
                                                                                        _0x2a330c ===
                                                                                        'generate-replacement-video'
                                                                                      ) {
                                                                                        if (
                                                                                          _0x57b9e5[
                                                                                            'workspace'
                                                                                          ][
                                                                                            'shotSelectionMode'
                                                                                          ]
                                                                                        ) {
                                                                                          if (_0x4fea56()) {
                                                                                            _0x1d3a8e();
                                                                                            return;
                                                                                          }
                                                                                          _0x2daac8('video');
                                                                                          return;
                                                                                        }
                                                                                        const _0x4cfb22 =
                                                                                            _0x57b9e5[
                                                                                              'workspace'
                                                                                            ][
                                                                                              'selectedShotId'
                                                                                            ],
                                                                                          _0x5111f1 =
                                                                                            resolvePersonReplacementVideoGenerationState(
                                                                                              _0x57b9e5[
                                                                                                'workspace'
                                                                                              ],
                                                                                              _0x4cfb22,
                                                                                            );
                                                                                        if (
                                                                                          isPersonReplacementVideoGenerationActive(
                                                                                            _0x5111f1,
                                                                                          )
                                                                                        ) {
                                                                                          _0x4e3281(
                                                                                            _0x43f995[
                                                                                              'CANCEL_REPLACEMENT_VIDEO'
                                                                                            ],
                                                                                            {
                                                                                              projectId:
                                                                                                _0x57b9e5[
                                                                                                  'id'
                                                                                                ],
                                                                                              shotId:
                                                                                                _0x4cfb22,
                                                                                            },
                                                                                            {},
                                                                                            {
                                                                                              applyCallbackResult:
                                                                                                ![],
                                                                                            },
                                                                                          );
                                                                                          return;
                                                                                        }
                                                                                        _0x4e3281(
                                                                                          _0x43f995[
                                                                                            'GENERATE_REPLACEMENT_VIDEO'
                                                                                          ],
                                                                                          {
                                                                                            projectId:
                                                                                              _0x57b9e5['id'],
                                                                                            shotId: _0x4cfb22,
                                                                                          },
                                                                                          {},
                                                                                          {
                                                                                            applyCallbackResult:
                                                                                              ![],
                                                                                          },
                                                                                        );
                                                                                      } else {
                                                                                        if (
                                                                                          _0x2a330c ===
                                                                                          'trim-current-video'
                                                                                        )
                                                                                          _0x3013ce(
                                                                                            _0x1d4b2f[
                                                                                              'dataset'
                                                                                            ]['shotId'],
                                                                                          );
                                                                                        else {
                                                                                          if (
                                                                                            _0x2a330c ===
                                                                                            'toggle-video-replacement-sync-playback'
                                                                                          )
                                                                                            void _0x2ba69b[
                                                                                              'toggleSyncEnabled'
                                                                                            ]();
                                                                                          else {
                                                                                            if (
                                                                                              _0x2a330c ===
                                                                                              'toggle-comparison-playback'
                                                                                            )
                                                                                              _0x31cdf2[
                                                                                                'togglePlayback'
                                                                                              ]();
                                                                                            else {
                                                                                              if (
                                                                                                _0x2a330c ===
                                                                                                'set-preview-track'
                                                                                              )
                                                                                                _0x57cd0f(
                                                                                                  _0x1d4b2f[
                                                                                                    'dataset'
                                                                                                  ][
                                                                                                    'previewTrack'
                                                                                                  ],
                                                                                                );
                                                                                              else {
                                                                                                if (
                                                                                                  _0x2a330c ===
                                                                                                  'compose-output'
                                                                                                )
                                                                                                  _0x4e3281(
                                                                                                    _0x43f995[
                                                                                                      'COMPOSE_OUTPUT'
                                                                                                    ],
                                                                                                    cloneJson(
                                                                                                      _0x57b9e5,
                                                                                                    ),
                                                                                                    {},
                                                                                                    {
                                                                                                      applyCallbackResult:
                                                                                                        ![],
                                                                                                    },
                                                                                                  );
                                                                                                else {
                                                                                                  if (
                                                                                                    _0x2a330c ===
                                                                                                    'toggle-output-menu'
                                                                                                  )
                                                                                                    _0x37ce51(
                                                                                                      _0x1d4b2f,
                                                                                                    );
                                                                                                  else {
                                                                                                    if (
                                                                                                      _0x2a330c ===
                                                                                                      'sync-all-clips-to-canvas'
                                                                                                    )
                                                                                                      (_0x624e11(),
                                                                                                        _0x4e3281(
                                                                                                          _0x43f995[
                                                                                                            'ADD_OUTPUT_TO_CANVAS'
                                                                                                          ],
                                                                                                          {
                                                                                                            scope:
                                                                                                              PERSON_REPLACEMENT_CANVAS_SCOPES[
                                                                                                                'CLIPS'
                                                                                                              ],
                                                                                                            project:
                                                                                                              cloneJson(
                                                                                                                _0x57b9e5,
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
                                                                                                        _0x2a330c ===
                                                                                                        'sync-project-to-canvas'
                                                                                                      )
                                                                                                        (_0x624e11(),
                                                                                                          _0x4e3281(
                                                                                                            _0x43f995[
                                                                                                              'ADD_OUTPUT_TO_CANVAS'
                                                                                                            ],
                                                                                                            {
                                                                                                              scope:
                                                                                                                PERSON_REPLACEMENT_CANVAS_SCOPES[
                                                                                                                  'PROJECT'
                                                                                                                ],
                                                                                                              project:
                                                                                                                cloneJson(
                                                                                                                  _0x57b9e5,
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
                                                                                                          _0x2a330c,
                                                                                                        ) &&
                                                                                                          (_0x624e11(),
                                                                                                          _0x4e3281(
                                                                                                            _0x43f995[
                                                                                                              'EXPORT_OUTPUT'
                                                                                                            ],
                                                                                                            {
                                                                                                              mode: _0x2a330c[
                                                                                                                'slice'
                                                                                                              ](
                                                                                                                'export-'[
                                                                                                                  'length'
                                                                                                                ],
                                                                                                              ),
                                                                                                              project:
                                                                                                                cloneJson(
                                                                                                                  _0x57b9e5,
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
    _0x2f6384 = (_0x4cb0cc) => {
      if (_0x4cb0cc['target']?.['matches']?.('[data-story-project-search]')) {
        const _0x23e6b5 = Number(_0x4cb0cc['target']['selectionStart']);
        ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
          ..._0x57b9e5,
          workspace: {
            ..._0x57b9e5['workspace'],
            projectSearchQuery: _0x4cb0cc['target']['value'],
            openProjectMenuId: '',
            pendingDeleteProjectId: '',
          },
        })),
          (_0x4cb0cc['target']['value'] = _0x57b9e5['workspace']['projectSearchQuery']));
        const _0x4be4eb = refreshWorkspaceProjectResultsInPlace({
          root: _0x4cb0cc['target']['closest']?.('.story-home-page') || _0x42b7b0,
          documentObject: documentObject,
          renderResults: () => personReplacementShellPresentation['renderHomeProjectResults'](_0x57b9e5),
        });
        if (!_0x4be4eb) _0x4cf492();
        const _0x41381d = _0x4be4eb
          ? _0x4cb0cc['target']
          : _0x42b7b0?.['querySelector']?.('[data-story-project-search]');
        _0x41381d?.['focus']?.();
        Number['isFinite'](_0x23e6b5) && _0x41381d?.['setSelectionRange']?.(_0x23e6b5, _0x23e6b5);
        return;
      }
      if (_0x4cb0cc['target']?.['matches']?.('[data-story-project-title]')) {
        const _0x487575 = normalizeText(_0x4cb0cc['target']['dataset']['storyProjectTitle']);
        _0x57b9e5 = normalizePersonReplacementWorkspaceProject({
          ..._0x57b9e5,
          libraryProjects: _0x57b9e5['libraryProjects']['map']((_0x43c55a) =>
            normalizeText(_0x43c55a?.['id']) === _0x487575
              ? { ..._0x43c55a, title: _0x4cb0cc['target']['value'] }
              : _0x43c55a,
          ),
        });
        return;
      }
      if (_0x4cb0cc['target']?.['matches']?.('[data-story-asset-prompt]')) {
        const _0x33d6d2 = _0xe8cb52(),
          _0x3bef6d = _0x391a96(_0x33d6d2);
        if (!_0x33d6d2 || !_0x3bef6d) return;
        ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
          ..._0x57b9e5,
          characters: _0x57b9e5['characters']['map']((_0x572a90) =>
            _0x572a90['id'] === _0x33d6d2['id']
              ? {
                  ..._0x572a90,
                  appearances: _0x572a90['appearances']['map']((_0x1ff62d) =>
                    _0x1ff62d['id'] === _0x3bef6d['id']
                      ? { ..._0x1ff62d, prompt: readPersonReplacementAssetPromptText(_0x4cb0cc['target']) }
                      : _0x1ff62d,
                  ),
                }
              : _0x572a90,
          ),
        })),
          _0x273c17('appearance-prompt'));
        return;
      }
      if (_0x4cb0cc['target']?.['dataset']?.['personReplacementField'] === 'image-prompt') {
        if (shouldSkipPromptTriggerForBulkInput(_0x4cb0cc)) return;
        const _0x5a846c = _0x4cb0cc['target']['dataset']['shotId'],
          _0x36ea54 = _0x4cb0cc['target']['matches']?.('[contenteditable="true"]')
            ? sanitizePromptHtmlForCommit(_0x4cb0cc['target']['innerHTML'])
            : _0x4cb0cc['target']['value'];
        ((_0x57b9e5 = normalizePersonReplacementWorkspaceProject({
          ..._0x57b9e5,
          shots: _0x57b9e5['shots']['map']((_0x211b4f) =>
            _0x211b4f['id'] === _0x5a846c ? { ..._0x211b4f, imagePrompt: _0x36ea54 } : _0x211b4f,
          ),
        })),
          _0x273c17('image-prompt'));
        return;
      }
      _0x4cb0cc['target']?.['dataset']?.['personReplacementField'] === 'video-prompt' &&
        (_0x4cb0cc['type'] === 'input' &&
          checkSlashTrigger(_0x4cb0cc, {
            promptEl: _0x4cb0cc['target'],
            nodeType: 'ai-video',
            nodeId: '',
            onPromptCommit: () => _0x1fc768(_0x4cb0cc['target'], 'video-prompt'),
            onGenerate: (_0x269309, _0x33262b) => _0x56892a(_0x4cb0cc['target'], _0x269309, _0x33262b),
          }),
        _0x1fc768(_0x4cb0cc['target']));
    },
    _0x50349f = (_0x40afb6) => {
      if (_0x40afb6['target']['matches']?.('[data-person-replacement-audio-character]')) {
        const _0x32d6b2 = _0x40afb6['target']
          ['closest']('[data-workspace-audio-asset-id]')
          ?.['querySelector']('[data-person-replacement-action=\x22bind-project-audio\x22]');
        if (_0x32d6b2)
          _0x32d6b2['disabled'] = !_0x57b9e5['characters']['some'](
            (_0x5a59b0) => _0x5a59b0['id'] === _0x40afb6['target']['value'],
          );
        return;
      }
      const _0x511971 = _0x40afb6['target']?.['dataset']?.['personReplacementInput'];
      if (_0x511971) {
        const _0x11cb47 = Array['from'](_0x40afb6['target']['files'] || []);
        if (_0x511971 === 'source-videos') _0x17c907(_0x11cb47['filter'](isPersonReplacementVideoFile));
        else {
          if (_0x511971 === 'new-character-images') {
            const _0x1d8200 = _0x11cb47['filter'](isPersonReplacementImageFile);
            _0x1d8200['length'] && _0x533135('character', () => _0x59d19e(_0x1d8200));
          } else {
            if (_0x511971 === 'new-scene-images') {
              const _0x2bf916 = _0x11cb47['filter'](isPersonReplacementImageFile);
              _0x2bf916['length'] &&
                _0x533135('scene', () => _0x4e3281(_0x43f995['SELECT_NEW_SCENE_IMAGES'], _0x2bf916));
            } else {
              if (_0x511971 === 'new-audio-files') {
                const _0x416358 = _0x11cb47['filter'](isPersonReplacementAudioFile);
                _0x416358['length'] &&
                  _0x533135('audio', () => _0x4e3281(_0x43f995['SELECT_NEW_AUDIO_FILES'], _0x416358));
              } else {
                if (_0x511971 === 'appearance-image' && _0x11cb47[0x0])
                  _0x4e3281(_0x43f995['SELECT_CHARACTER_REFERENCE'], _0x11cb47[0x0], _0x40a90d || {});
                else {
                  if (_0x511971 === 'replacement-image' && _0x11cb47[0x0])
                    _0x4e3281(_0x43f995['SELECT_REPLACEMENT_IMAGE'], _0x11cb47[0x0], _0x40a90d || {}, {
                      applyCallbackResult: ![],
                    });
                  else {
                    if (_0x511971 === 'replacement-video-result' && _0x11cb47[0x0]) {
                      const _0x32a66a = _0x116a03,
                        _0x42ccd7 = _0x40a90d || {};
                      void runWorkspaceVideoDownloadAction(_0x32a66a, () =>
                        Promise['resolve'](
                          _0x4e3281(_0x43f995['SELECT_REPLACEMENT_VIDEO_RESULT'], _0x11cb47[0x0], _0x42ccd7, {
                            applyCallbackResult: ![],
                          }),
                        ),
                      )['catch'](() => {});
                    } else {
                      if (_0x511971 === 'replacement-video-slot' && _0x11cb47[0x0])
                        _0x4e3281(
                          _0x43f995['SELECT_REPLACEMENT_VIDEO_INPUT'],
                          _0x11cb47[0x0],
                          _0x40a90d || {},
                          { applyCallbackResult: ![] },
                        );
                      else {
                        if (_0x511971 === 'character-voice' && _0x11cb47[0x0])
                          _0x4e3281(_0x43f995['SELECT_CHARACTER_VOICE'], _0x11cb47[0x0], _0x40a90d || {});
                      }
                    }
                  }
                }
              }
            }
          }
        }
        ((_0x40afb6['target']['value'] = ''), (_0x40a90d = null), (_0x116a03 = null));
        return;
      }
      if (_0x40afb6['target']?.['matches']?.('[data-story-project-title]')) {
        const _0x58d49b = normalizeText(_0x40afb6['target']['dataset']['storyProjectTitle']),
          _0xf554d5 = normalizeText(_0x40afb6['target']['value'], '未命名人物替换项目');
        ((_0x40afb6['target']['value'] = _0xf554d5),
          _0x4e3281(_0x43f995['RENAME_PROJECT'], { projectId: _0x58d49b, title: _0xf554d5 }));
      } else {
        if (_0x40afb6['target']?.['matches']?.('[data-person-replacement-composite-project-title]')) {
          const _0x17b390 = normalizeText(_0x40afb6['target']['value']) || '未命名人物替换项目';
          ((_0x40afb6['target']['value'] = _0x17b390),
            _0x17b390 !== _0x57b9e5['title'] &&
              _0x4e3281(_0x43f995['RENAME_PROJECT'], { projectId: _0x57b9e5['id'], title: _0x17b390 }));
        } else {
          if (_0x40afb6['target']?.['matches']?.('[data-story-asset-prompt]')) _0x2f6384(_0x40afb6);
          else {
            if (
              _0x40afb6['target']?.['dataset']?.['personReplacementField'] === 'image-prompt' ||
              _0x40afb6['target']?.['dataset']?.['personReplacementField'] === 'video-prompt'
            )
              (_0x2f6384(_0x40afb6),
                _0x40afb6['target']['dataset']['personReplacementField'] === 'video-prompt' &&
                  _0x273c17('video-prompt'));
            else
              _0x40afb6['target']?.['dataset']?.['personReplacementField'] === 'voice-source' &&
                _0x26d845(
                  {
                    ..._0x57b9e5,
                    workspace: {
                      ..._0x57b9e5['workspace'],
                      selectedVoiceSourceId: _0x40afb6['target']['value'],
                    },
                  },
                  'voice-source',
                );
          }
        }
      }
    },
    _0x1f0bcb = (_0x5d5053) => {
      _0x23c082['handleFocusOut'](_0x5d5053);
      const _0x36abcf = _0x5d5053['target']?.['closest']?.('[data-person-replacement-person-custom-label]');
      if (_0x36abcf) _0x51b3c8(_0x36abcf);
      const _0x31d848 = _0x5d5053['target']?.['closest']?.('[data-person-replacement-detection-picker]');
      _0x31d848 && !_0x31d848['contains']?.(_0x5d5053['relatedTarget']) && _0x30a2f8(_0x31d848, ![]);
      const _0x5233a1 = _0x5d5053['target']?.['closest']?.(
        '[data-story-asset-name-id][contenteditable="true"]',
      );
      if (_0x5233a1) _0x31e38b(_0x5233a1);
    },
    _0x47c5ed = (_0x4520bf) => {
      _0x58b712();
      const _0x6cce74 = _0x4520bf['target']?.['closest']?.('[data-person-replacement-voice-asset-id]');
      if (_0x6cce74) {
        const _0x517ce4 = normalizeText(_0x6cce74['dataset']?.['personReplacementVoiceAssetId']);
        if (!_0x4520bf['dataTransfer'] || !_0x517ce4 || _0x6cce74['disabled']) {
          _0x4520bf['preventDefault']?.();
          return;
        }
        ((_0x4520bf['dataTransfer']['effectAllowed'] = 'copy'),
          _0x4520bf['dataTransfer']['setData'](
            PERSON_REPLACEMENT_VOICE_ASSET_DRAG_TYPE,
            JSON['stringify']({ characterId: _0x517ce4 }),
          ),
          applyWorkspaceAssetNativeDragPreview(
            _0x4520bf['dataTransfer'],
            _0x6cce74['querySelector']?.('.person-replacement-voice-asset-image img') || _0x6cce74,
          ),
          _0x6cce74['classList']?.['add']?.('is-voice-asset-dragging'),
          _0x42b7b0?.['classList']?.['add']?.('is-voice-asset-dragging'));
        return;
      }
      const _0x2452a0 = _0x4520bf['target']?.['closest']?.(
        '[data-person-replacement-target-character-id], [data-person-replacement-target-scene-id]',
      );
      if (!_0x2452a0 || !_0x4520bf['dataTransfer']) {
        _0x4520bf['preventDefault']?.();
        return;
      }
      if (_0x4520bf['target']?.['closest']?.('.at-mention-variant-arrow')) {
        _0x4520bf['preventDefault']?.();
        return;
      }
      const _0x548698 = normalizeText(_0x2452a0['dataset']['personReplacementTargetSceneId']),
        _0x1fa1bc = normalizeText(_0x2452a0['dataset']['personReplacementTargetCharacterId']),
        _0x169621 = normalizeText(
          _0x548698
            ? _0x2452a0['dataset']['personReplacementTargetSceneAppearanceId']
            : _0x2452a0['dataset']['personReplacementTargetAppearanceId'],
        );
      if ((!_0x548698 && !_0x1fa1bc) || !_0x169621) {
        _0x4520bf['preventDefault']?.();
        return;
      }
      ((_0x177009 = !![]),
        (_0x4520bf['dataTransfer']['effectAllowed'] = 'copy'),
        _0x548698
          ? _0x4520bf['dataTransfer']['setData'](
              PERSON_REPLACEMENT_SCENE_ASSET_DRAG_TYPE,
              JSON['stringify']({ sceneId: _0x548698, appearanceId: _0x169621 }),
            )
          : _0x4520bf['dataTransfer']['setData'](
              'application/x-person-replacement-target',
              JSON['stringify']({ characterId: _0x1fa1bc, appearanceId: _0x169621 }),
            ),
        applyWorkspaceAssetNativeDragPreview(
          _0x4520bf['dataTransfer'],
          _0x2452a0['querySelector']?.('.story-asset-card-image') || _0x2452a0,
        ),
        _0x2452a0['classList']?.['add']?.('is-story-asset-dragging'));
    },
    _0x58f3f3 = (_0x408c2f) => {
      const _0x260b42 = _0x408c2f?.['querySelector']?.('.story-asset-card-image'),
        _0x1d1219 = normalizeText(
          _0x260b42?.['currentSrc'] || _0x260b42?.['src'] || _0x260b42?.['getAttribute']?.('src'),
        );
      if (!_0x260b42 || !_0x1d1219 || !documentObject?.['createElement']) return null;
      const _0x2dc774 =
          _0x260b42['getBoundingClientRect']?.() || _0x408c2f['getBoundingClientRect']?.() || {},
        _0x494191 = Math['max'](0x1, Number(_0x2dc774['width']) || 0x80),
        _0x2d39d7 = Math['max'](0x1, Number(_0x2dc774['height']) || _0x494191),
        _0x11b19a = Math['min'](0xa0, Math['max'](0x60, _0x494191)),
        _0x57c426 = Math['max'](0x36, Math['round']((_0x11b19a * _0x2d39d7) / _0x494191)),
        _0x4a0870 = documentObject['createElement']('div'),
        _0xd85839 = documentObject['createElement']('img');
      return (
        (_0x4a0870['className'] = 'story-asset-drag-preview\x20person-replacement-target-asset-drag-preview'),
        _0x4a0870['setAttribute']('aria-hidden', 'true'),
        (_0x4a0870['style']['width'] = Math['round'](_0x11b19a) + 'px'),
        (_0x4a0870['style']['height'] = Math['round'](_0x57c426) + 'px'),
        (_0xd85839['src'] = _0x1d1219),
        (_0xd85839['alt'] = ''),
        (_0xd85839['draggable'] = ![]),
        _0x4a0870['appendChild'](_0xd85839),
        documentObject['body']?.['appendChild']?.(_0x4a0870),
        _0x4a0870
      );
    },
    _0x1a4d6c = (_0xce34da, _0x304a45) => {
      if (!_0xce34da) return;
      const _0xec73cd = Number(_0x304a45?.['clientX']) || 0x0,
        _0x1ef7a9 = Number(_0x304a45?.['clientY']) || 0x0,
        _0xaa0cc4 = _0xce34da['getBoundingClientRect']?.() || {},
        _0x28bd64 = Math['max'](
          0x1,
          Number(_0xaa0cc4['width']) || Number['parseFloat'](_0xce34da['style']['width']) || 0x1,
        ),
        _0x4b3aa5 = Math['max'](
          0x1,
          Number(_0xaa0cc4['height']) || Number['parseFloat'](_0xce34da['style']['height']) || 0x1,
        ),
        _0x43577e = Number(windowObject?.['innerWidth']) || Number['POSITIVE_INFINITY'],
        _0x3dd7d7 = Number(windowObject?.['innerHeight']) || Number['POSITIVE_INFINITY'],
        _0x3b4ca4 = 0x8;
      let _0x58b3a4 = _0xec73cd + WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP,
        _0x90a3f6 = _0x1ef7a9 + WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP;
      (_0x58b3a4 + _0x28bd64 > _0x43577e - _0x3b4ca4 &&
        (_0x58b3a4 = _0xec73cd - _0x28bd64 - WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP),
        _0x90a3f6 + _0x4b3aa5 > _0x3dd7d7 - _0x3b4ca4 &&
          (_0x90a3f6 = _0x1ef7a9 - _0x4b3aa5 - WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP),
        (_0xce34da['style']['transform'] =
          'translate3d(' +
          Math['max'](_0x3b4ca4, _0x58b3a4) +
          'px, ' +
          Math['max'](_0x3b4ca4, _0x90a3f6) +
          'px,\x200)'));
    },
    _0xe08a21 = (_0x165caf) => {
      const _0x18d277 = documentObject?.['elementFromPoint']?.(
          Number(_0x165caf?.['clientX']) || 0x0,
          Number(_0x165caf?.['clientY']) || 0x0,
        ),
        _0x40f25d = _0x18d277?.['closest']?.('[data-person-replacement-person-drop]');
      return _0x40f25d && _0x42b7b0?.['contains']?.(_0x40f25d) ? _0x40f25d : null;
    },
    _0x4a0065 = (_0x29cd85) => {
      const _0x4bc343 = documentObject?.['elementFromPoint']?.(
          Number(_0x29cd85?.['clientX']) || 0x0,
          Number(_0x29cd85?.['clientY']) || 0x0,
        ),
        _0x1f6b24 = _0x4bc343?.['closest']?.('[data-person-replacement-keyframe-stage]');
      return _0x1f6b24 && _0x42b7b0?.['contains']?.(_0x1f6b24) ? _0x1f6b24 : null;
    },
    _0x105813 = (_0x58d666) => {
      if (_0xc29065 === _0x58d666) return;
      (_0xc29065?.['classList']?.['remove']?.('is-scene-reference-drop-target'),
        (_0xc29065 = _0x58d666 || null),
        _0xc29065?.['classList']?.['add']?.('is-scene-reference-drop-target'));
    },
    _0x2012e0 = ({
      personBox: _0x55e2fd,
      target: _0x53dadd,
      clientX: clientX = 0x0,
      clientY: clientY = 0x0,
    } = {}) => {
      if (
        !_0x55e2fd ||
        !normalizeText(_0x53dadd?.['characterId']) ||
        !normalizeText(_0x53dadd?.['appearanceId'])
      )
        return ![];
      const _0x198bd0 = {
          shotId: _0x55e2fd['dataset']['shotId'],
          personId: _0x55e2fd['dataset']['personId'],
          targetCharacterId: _0x53dadd['characterId'],
          targetAppearanceId: _0x53dadd['appearanceId'],
        },
        _0x3d740b = _0x57b9e5['shots']['find'](
          (_0x5eafe7) => _0x5eafe7['id'] === normalizeText(_0x198bd0['shotId']),
        ),
        _0x4f7a0f = _0x3d740b?.['people']?.['find'](
          (_0x13d6c5) => _0x13d6c5['id'] === normalizeText(_0x198bd0['personId']),
        );
      if (!_0x4f7a0f) return ![];
      const _0x120db9 = normalizeText(_0x4f7a0f['sourceCharacterId']),
        _0x6a878f = _0x57b9e5['mappings']['find'](
          (_0x8660aa) => normalizeText(_0x8660aa['sourceCharacterId']) === _0x120db9,
        )?.['targetCharacterId'],
        _0x3d5f74 = Boolean(normalizeText(_0x4f7a0f['targetCharacterId']) || normalizeText(_0x6a878f));
      if (_0x3d5f74) {
        const _0x44b7ea = _0x57b9e5['characters']['find'](
            (_0x78511d) => _0x78511d['id'] === normalizeText(_0x53dadd['characterId']),
          ),
          _0x4f7199 = getCharacterAppearance(_0x44b7ea, normalizeText(_0x53dadd['appearanceId']));
        _0xe2ad53({
          personBox: _0x55e2fd,
          mapping: _0x198bd0,
          personLabel: normalizeText(_0x4f7a0f['label'], _0x120db9 || '当前人物'),
          targetName: normalizeText(_0x44b7ea?.['name'], '目标人物'),
          appearanceName: normalizeText(_0x4f7199?.['name'], '当前形象'),
          clientX: clientX,
          clientY: clientY,
        });
      } else _0x2337bb(_0x198bd0);
      return (
        _0x297e45({
          assetId: normalizeText(_0x53dadd['characterId']),
          shotId: normalizeText(_0x198bd0['shotId']),
          personId: normalizeText(_0x198bd0['personId']),
        }),
        _0x58b712(),
        !![]
      );
    },
    _0x2228cf = () => {
      const _0x3b30bd = _0x59e1d9;
      ((_0x59e1d9 = null),
        _0x3b30bd?.['preview']?.['remove']?.(),
        documentObject['body']?.['classList']?.['remove']?.('person-replacement-target-asset-dragging'));
      if (!_0x3b30bd?.['element']) return;
      (_0x3b30bd['originalDraggable'] == null
        ? _0x3b30bd['element']['removeAttribute']?.('draggable')
        : _0x3b30bd['element']['setAttribute']?.('draggable', _0x3b30bd['originalDraggable']),
        _0x3b30bd['element']['hasPointerCapture']?.(_0x3b30bd['pointerId']) &&
          _0x3b30bd['element']['releasePointerCapture']?.(_0x3b30bd['pointerId']));
    },
    _0xcda9ef = (_0x20f3bf) => {
      const _0x34de37 = _0x20f3bf['target']?.['closest']?.(
        '[data-person-replacement-target-character-id], [data-person-replacement-target-scene-id]',
      );
      if (
        !_0x34de37 ||
        !_0x42b7b0?.['contains']?.(_0x34de37) ||
        _0x20f3bf['button'] !== 0x0 ||
        _0x20f3bf['target']?.['closest']?.('.story-appearance-arrow, .at-mention-variant-arrow')
      )
        return ![];
      const _0x54d2c6 = normalizeText(_0x34de37['dataset']?.['personReplacementTargetSceneId']),
        _0xcbab03 = normalizeText(_0x34de37['dataset']?.['personReplacementTargetCharacterId']),
        _0x1ba080 = normalizeText(
          _0x54d2c6
            ? _0x34de37['dataset']?.['personReplacementTargetSceneAppearanceId']
            : _0x34de37['dataset']?.['personReplacementTargetAppearanceId'],
        );
      if ((!_0x54d2c6 && !_0xcbab03) || !_0x1ba080) return ![];
      return (
        (_0x59e1d9 = {
          kind: _0x54d2c6 ? 'scene' : 'character',
          sceneId: _0x54d2c6,
          characterId: _0xcbab03,
          appearanceId: _0x1ba080,
          element: _0x34de37,
          pointerId: _0x20f3bf['pointerId'],
          startX: Number(_0x20f3bf['clientX']) || 0x0,
          startY: Number(_0x20f3bf['clientY']) || 0x0,
          originalDraggable: _0x34de37['getAttribute']?.('draggable'),
          active: ![],
          preview: null,
        }),
        _0x34de37['setAttribute']?.('draggable', 'false'),
        _0x34de37['setPointerCapture']?.(_0x20f3bf['pointerId']),
        !![]
      );
    },
    _0x244e35 = (_0x4a8d73) => {
      const _0x5a5939 = _0x59e1d9;
      if (!_0x5a5939 || _0x5a5939['pointerId'] !== _0x4a8d73['pointerId']) return ![];
      if (!_0x5a5939['active']) {
        const _0x392ecd = (Number(_0x4a8d73['clientX']) || 0x0) - _0x5a5939['startX'],
          _0x18c5f4 = (Number(_0x4a8d73['clientY']) || 0x0) - _0x5a5939['startY'];
        if (Math['hypot'](_0x392ecd, _0x18c5f4) < 0x8) return ![];
        ((_0x5a5939['active'] = !![]),
          (_0x177009 = !![]),
          _0x5a5939['element']['classList']?.['add']?.('is-story-asset-dragging'),
          documentObject['body']?.['classList']?.['add']?.('person-replacement-target-asset-dragging'),
          _0x58b712(),
          (_0x5a5939['preview'] = _0x58f3f3(_0x5a5939['element'])));
      }
      return (
        _0x1a4d6c(_0x5a5939['preview'], _0x4a8d73),
        _0x5a5939['kind'] === 'scene' && _0x105813(_0x4a0065(_0x4a8d73)),
        _0x4a8d73['preventDefault']?.(),
        !![]
      );
    },
    _0x40b574 = (_0x5a8c35, { cancelled: cancelled = ![] } = {}) => {
      const _0x3e6705 = _0x59e1d9;
      if (!_0x3e6705 || _0x3e6705['pointerId'] !== _0x5a8c35['pointerId']) return ![];
      const _0x25383a =
          _0x3e6705['kind'] === 'scene' && !cancelled && _0x3e6705['active'] ? _0x4a0065(_0x5a8c35) : null,
        _0x2d0f13 =
          _0x3e6705['kind'] === 'character' && !cancelled && _0x3e6705['active']
            ? _0xe08a21(_0x5a8c35)
            : null,
        _0x5e56fc = _0x3e6705['active'],
        _0x50a3f0 = { characterId: _0x3e6705['characterId'], appearanceId: _0x3e6705['appearanceId'] };
      (_0x2228cf(),
        _0x105813(null),
        (_0x177009 = ![]),
        _0x3e6705['element']['classList']?.['remove']?.('is-story-asset-dragging'));
      if (!_0x5e56fc) return ![];
      ((_0x546083 = _0x3e6705['element']), _0x5a8c35['preventDefault']?.(), _0x5a8c35['stopPropagation']?.());
      if (_0x25383a)
        _0x41e8c9({
          shotId: _0x25383a['dataset']['shotId'],
          sceneId: _0x3e6705['sceneId'],
          appearanceId: _0x3e6705['appearanceId'],
        });
      else
        _0x2d0f13 &&
          _0x2012e0({
            personBox: _0x2d0f13,
            target: _0x50a3f0,
            clientX: _0x5a8c35['clientX'],
            clientY: _0x5a8c35['clientY'],
          });
      return !![];
    },
    _0x27c84f = () => {
      (_0xdc14ac?.['classList']?.['remove']?.('is-dragover'),
        (_0xdc14ac = null),
        _0x42b7b0?.['classList']?.['remove']?.('is-dragging-file'));
    },
    _0x115624 = (_0x5412b8) => {
      if (_0x4ad4fe(_0x43f995['HAS_PROJECT_PACKAGE_DRAG'], _0x5412b8['dataTransfer']) === !![]) {
        (_0x5412b8['preventDefault']?.(), _0x5412b8['stopPropagation']?.());
        if (_0x5412b8['dataTransfer']) _0x5412b8['dataTransfer']['dropEffect'] = 'copy';
        return;
      }
      const _0x3f4b18 = _0x5412b8['target']?.['closest']?.('[data-audio-voice-action="audio-param"]'),
        _0x44541b = Array['from'](_0x5412b8['dataTransfer']?.['types'] || []),
        _0x5814b1 =
          _0x42b7b0?.['classList']?.['contains']?.('is-voice-asset-dragging') ||
          _0x44541b['includes'](PERSON_REPLACEMENT_VOICE_ASSET_DRAG_TYPE);
      if (_0x3f4b18 && _0x5814b1) {
        if (!_0x112ccc(_0x3f4b18)) {
          _0x308696();
          if (_0x5412b8['dataTransfer']) _0x5412b8['dataTransfer']['dropEffect'] = 'none';
          return;
        }
        _0x5412b8['preventDefault']?.();
        if (_0x5412b8['dataTransfer']) _0x5412b8['dataTransfer']['dropEffect'] = 'copy';
        _0x1454c7(_0x3f4b18);
        return;
      }
      _0x5814b1 && (_0x308696(), _0x49234b());
      const _0x4ab73c = _0x5412b8['target']?.['closest']?.('[data-person-replacement-keyframe-stage]'),
        _0x533d22 = _0x44541b['includes'](PERSON_REPLACEMENT_SCENE_ASSET_DRAG_TYPE);
      if (_0x4ab73c && _0x533d22) {
        _0x5412b8['preventDefault']?.();
        if (_0x5412b8['dataTransfer']) _0x5412b8['dataTransfer']['dropEffect'] = 'copy';
        (_0x105813(_0x4ab73c), _0x27c84f());
        return;
      }
      if (_0x533d22) _0x105813(null);
      const _0x1d1a98 = _0x5412b8['target']?.['closest']?.('[data-person-replacement-video-drop]'),
        _0x5f4797 = Boolean(_0x5412b8['target']?.['closest']?.('[data-person-replacement-person-drop]')),
        _0x307b35 = _0x44541b['includes']('Files');
      if (!_0x5f4797 && !_0x307b35) return;
      (_0x5412b8['preventDefault'](), _0x42b7b0['classList']['add']('is-dragging-file'));
      if (_0x1d1a98 && _0x307b35 && _0x57b9e5['workspace']['view'] === 'home') {
        if (_0x5412b8['dataTransfer']) _0x5412b8['dataTransfer']['dropEffect'] = 'copy';
        _0xdc14ac !== _0x1d1a98 &&
          (_0x27c84f(),
          (_0xdc14ac = _0x1d1a98),
          _0xdc14ac['classList']?.['add']?.('is-dragover'),
          _0x42b7b0['classList']['add']('is-dragging-file'));
      } else {
        _0x27c84f();
        if (_0x307b35) _0x42b7b0['classList']['add']('is-dragging-file');
      }
    },
    _0x303d4e = () => {
      ((_0x177009 = ![]),
        _0x2228cf(),
        _0x105813(null),
        _0x42b7b0?.['querySelectorAll']?.('.person-replacement-target-asset.is-story-asset-dragging')?.[
          'forEach'
        ]?.((_0x3dbb0e) => _0x3dbb0e['classList']?.['remove']?.('is-story-asset-dragging')));
    },
    _0x56cb63 = () => {
      (_0x42b7b0?.['classList']?.['remove']?.('is-voice-asset-dragging'),
        _0x42b7b0?.['querySelectorAll']?.('.person-replacement-voice-asset-card.is-voice-asset-dragging')?.[
          'forEach'
        ]?.((_0x19f0fc) => _0x19f0fc['classList']?.['remove']?.('is-voice-asset-dragging')),
        _0x308696(),
        _0x49234b());
    },
    _0x416474 = () => {
      (_0x58b712(), _0x303d4e(), _0x56cb63(), _0x27c84f());
    },
    _0x11adf8 = (_0x1b5168) => {
      const _0x4c4735 = _0x1b5168['target']?.['closest']?.('[data-person-replacement-video-drop]');
      _0x4c4735 && !_0x4c4735['contains']?.(_0x1b5168['relatedTarget']) && _0x27c84f();
      const _0x522ac3 = _0x1b5168['relatedTarget'];
      if (_0x522ac3 && _0x42b7b0?.['contains']?.(_0x522ac3)) return;
      (_0x308696(), _0x49234b(), _0x27c84f(), _0x105813(null));
    },
    _0x4565af = (_0x1da01f) => {
      if (_0x4ad4fe(_0x43f995['DROP_PROJECT_PACKAGE'], _0x1da01f) === !![]) return;
      const _0x433e58 = _0x1da01f['target']?.['closest']?.('[data-audio-voice-action="audio-param"]'),
        _0x5cc04d = _0x1da01f['dataTransfer']?.['getData']?.(PERSON_REPLACEMENT_VOICE_ASSET_DRAG_TYPE),
        _0x3d8fd3 = _0x1da01f['dataTransfer']?.['getData']?.(PERSON_REPLACEMENT_SCENE_ASSET_DRAG_TYPE),
        _0x4bc2e7 = _0x1da01f['target']?.['closest']?.('[data-person-replacement-keyframe-stage]');
      _0x416474();
      if (_0x433e58 && _0x5cc04d) {
        _0x1da01f['stopPropagation']?.();
        if (!_0x112ccc(_0x433e58)) return;
        _0x1da01f['preventDefault']?.();
        let _0x325880;
        try {
          _0x325880 = JSON['parse'](_0x5cc04d);
        } catch {
          return;
        }
        const _0x3bdcfc = normalizeText(_0x325880?.['characterId']),
          _0x30beb2 = normalizeText(_0x433e58['dataset']?.['segmentId']);
        if (!_0x3bdcfc || !_0x30beb2) return;
        _0x3400a4(_0x3bdcfc, { segmentId: _0x30beb2 });
        return;
      }
      if (_0x4bc2e7 && _0x3d8fd3) {
        (_0x1da01f['stopPropagation']?.(), _0x1da01f['preventDefault']?.());
        let _0x3ec14d;
        try {
          _0x3ec14d = JSON['parse'](_0x3d8fd3);
        } catch {
          return;
        }
        _0x41e8c9({
          shotId: _0x4bc2e7['dataset']['shotId'],
          sceneId: _0x3ec14d?.['sceneId'],
          appearanceId: _0x3ec14d?.['appearanceId'],
        });
        return;
      }
      const _0x313424 = _0x1da01f['target']?.['closest']?.('[data-person-replacement-person-drop]');
      if (_0x313424) {
        const _0x540dea = _0x1da01f['dataTransfer']?.['getData']?.('application/x-person-replacement-target');
        if (!_0x540dea) return;
        (_0x1da01f['stopPropagation']?.(), _0x1da01f['preventDefault']());
        let _0x5cecfc;
        try {
          _0x5cecfc = JSON['parse'](_0x540dea);
        } catch {
          return;
        }
        _0x2012e0({
          personBox: _0x313424,
          target: _0x5cecfc,
          clientX: _0x1da01f['clientX'],
          clientY: _0x1da01f['clientY'],
        });
        return;
      }
      const _0x55f0a5 = Array['from'](_0x1da01f['dataTransfer']?.['files'] || []);
      if (!_0x55f0a5['length']) return;
      (_0x1da01f['stopPropagation']?.(), _0x1da01f['preventDefault']());
      if (_0x57b9e5['workspace']['view'] === 'home')
        _0x17c907(_0x55f0a5['filter'](isPersonReplacementVideoFile));
      else {
        if (_0x57b9e5['workspace']['step'] === 0x1)
          _0x59d19e(_0x55f0a5['filter'](isPersonReplacementImageFile));
      }
    };
  let _0x4d8968 = null;
  const _0x1c28ec = (_0x5ba955) =>
      _0x5ba955?.['ctrlKey'] === !![] || _0x5ba955?.['getModifierState']?.('Control') === !![] || _0x553216,
    _0x2f9b10 = (_0x45c381) => {
      ((_0x546083 = null), _0x45c381['stopPropagation'](), _0x58b712());
      !_0x45c381['target']?.['closest']?.('[data-person-replacement-mapping-scope-menu]') && _0x524d22();
      const _0xa6b9a7 = _0x45c381['target']?.['closest']?.('[data-person-replacement-person-drop]');
      _0xa6b9a7 && _0x42b7b0['contains'](_0xa6b9a7) && _0x29b3c0(_0xa6b9a7);
      if (
        _0x45c381['target']?.['closest']?.(
          '[data-person-replacement-result-history-toggle], [data-person-replacement-result-history-close]',
        )
      )
        return;
      if (_0xcda9ef(_0x45c381)) return;
      const _0x502fba = _0x45c381['target']?.['closest']?.('[data-story-marquee-surface="people"]'),
        _0x55d67f = _0x45c381['target']?.['closest']?.(
          '.person-replacement-detection-label, .person-replacement-mapping-badge, [data-person-replacement-action], [data-person-replacement-manual-resize]',
        );
      if (
        _0x1c28ec(_0x45c381) &&
        _0x502fba &&
        _0x42b7b0['contains'](_0x502fba) &&
        !_0x55d67f &&
        _0x4d8968?.['begin']?.(_0x45c381)
      )
        return;
      const _0x54f702 = Boolean(_0xa6b9a7?.['classList']?.['contains']?.('is-batch-selected'));
      if (_0x54f702 && !_0x55d67f && _0x4dc575(_0x45c381, _0xa6b9a7, { batch: !![] })) return;
      !_0x1c28ec(_0x45c381) && (!_0xa6b9a7 || !_0x54f702) && _0x113bbe();
      const _0x447565 = _0xa6b9a7?.['matches']?.('.person-replacement-detection-box[data-person-id]')
        ? _0xa6b9a7
        : null;
      _0x447565 && _0x42b7b0['contains'](_0x447565)
        ? _0x348a7d(_0x447565, {
            focus: !_0x45c381['target']?.['closest']?.(
              '.person-replacement-detection-label, .person-replacement-mapping-badge, [data-person-replacement-action]',
            ),
          })
        : _0x218fa0();
      if (
        _0x447565 &&
        _0x42b7b0['contains'](_0x447565) &&
        !_0x45c381['target']?.['closest']?.(
          '.person-replacement-detection-label,\x20.person-replacement-mapping-badge,\x20[data-person-replacement-action]',
        ) &&
        _0x4dc575(_0x45c381, _0x447565)
      )
        return;
      if (_0x31602a()) {
        const _0x13870c = _0x45c381['target']?.['closest']?.('[data-person-replacement-keyframe-stage]');
        if (
          _0x13870c &&
          _0x42b7b0['contains'](_0x13870c) &&
          !_0x1c28ec(_0x45c381) &&
          !_0x45c381['target']?.['closest']?.('[data-person-replacement-person-drop]') &&
          !_0x45c381['target']?.['closest']?.('[data-person-replacement-action], [data-story-action]')
        ) {
          if (_0x42019b(_0x45c381, _0x13870c)) return;
        }
      }
      const _0x840f02 = _0x45c381['target']?.['closest']?.('[data-person-replacement-layout-splitter]');
      if (_0x840f02 && _0x22c867(_0x45c381, _0x840f02)) return;
      const _0x3abf7f = _0x45c381['target']?.['closest']?.(
        '[data-person-replacement-composite-sidebar-splitter]',
      );
      if (_0x3abf7f) {
        const _0xfacecd = _0x3abf7f['closest']?.('.person-replacement-preview-workbench');
        _0x3abf7f['classList']?.['add']?.('is-active');
        const _0x3530c1 = beginWorkspaceHorizontalResizeSession({
          event: _0x45c381,
          splitter: _0x3abf7f,
          layout: _0xfacecd,
          windowObject: windowObject,
          body: documentObject['body'],
          resizingClass: 'person-replacement-composite-sidebar-resizing',
          onRatio: (_0x298ff0) => {
            const _0x1d306d = Number(_0xfacecd?.['getBoundingClientRect']?.()?.['width']),
              _0x4f3a1e = Number['isFinite'](_0x1d306d)
                ? (_0x1d306d * _0x298ff0) / 0x64
                : _0x57b9e5['workspace']['compositeSidebarWidth'];
            _0x57b9e5['workspace']['compositeSidebarWidth'] =
              applyPersonReplacementCompositeSidebarWidthToLayout(_0xfacecd, _0x3abf7f, _0x4f3a1e);
          },
          onFinish: () => {
            (_0x3abf7f['classList']?.['remove']?.('is-active'), _0x273c17('composite-sidebar-width'));
          },
        });
        if (!_0x3530c1) _0x3abf7f['classList']?.['remove']?.('is-active');
        if (_0x3530c1) return;
      }
      const _0x1dbdb8 = _0x45c381['target']?.['closest']?.('[data-person-replacement-voice-layout-splitter]');
      if (_0x1dbdb8) {
        const _0x178680 = _0x1dbdb8['closest']?.('[data-person-replacement-voice-layout]'),
          _0xdd19c3 = normalizeText(_0x1dbdb8['dataset']?.['personReplacementVoiceLayoutSplitter']),
          _0x5b842c = ['assets', 'sources']['includes'](_0xdd19c3);
        if (_0x5b842c) _0x1dbdb8['classList']?.['add']?.('is-active');
        const _0x4b18a9 =
          _0x5b842c &&
          beginWorkspaceHorizontalResizeSession({
            event: _0x45c381,
            splitter: _0x1dbdb8,
            layout: _0x178680,
            windowObject: windowObject,
            body: documentObject['body'],
            resizingClass: 'person-replacement-voice-layout-resizing',
            onRatio: (_0x5ad143) => {
              const _0xb58a15 = normalizePersonReplacementVoiceLayout(_0x57b9e5['workspace']['voiceLayout']),
                _0x3ada23 = normalizePersonReplacementVoiceLayout({
                  ..._0xb58a15,
                  ...(_0xdd19c3 === 'assets'
                    ? {
                        assetsEnd: clamp(
                          _0x5ad143,
                          0x10,
                          _0xb58a15['sourcesEnd'] - 0x10,
                          _0xb58a15['assetsEnd'],
                        ),
                      }
                    : {
                        sourcesEnd: clamp(
                          _0x5ad143,
                          _0xb58a15['assetsEnd'] + 0x10,
                          0x3c,
                          _0xb58a15['sourcesEnd'],
                        ),
                      }),
                });
              _0x57b9e5['workspace']['voiceLayout'] = applyPersonReplacementVoiceLayoutToElement(
                _0x178680,
                _0x3ada23,
              );
            },
            onFinish: () => {
              (_0x1dbdb8['classList']?.['remove']?.('is-active'), _0x273c17('voice-layout'));
            },
          });
        if (!_0x4b18a9) _0x1dbdb8['classList']?.['remove']?.('is-active');
        if (_0x4b18a9) return;
      }
      const _0x47dd76 = _0x45c381['target']?.['closest']?.('[data-person-replacement-cut-boundary-index]');
      if (_0x47dd76 && _0x1217d1(_0x45c381, _0x47dd76)) return;
      const _0x565c77 = _0x45c381['target']?.['closest']?.('[data-story-assets-splitter]');
      if (_0x565c77) {
        const _0x2a78a0 = _0x565c77['closest']?.('.story-assets-layout');
        beginWorkspaceHorizontalResizeSession({
          event: _0x45c381,
          splitter: _0x565c77,
          layout: _0x2a78a0,
          windowObject: windowObject,
          body: documentObject['body'],
          resizingClass: 'story-assets-resizing',
          onRatio: (_0x2b8fdb) => {
            _0x57b9e5['workspace']['assetSplitRatio'] = applyWorkspaceAssetSplitRatioToLayout(
              _0x2a78a0,
              _0x565c77,
              _0x2b8fdb,
            );
          },
          onFinish: () => _0x273c17('asset-split-ratio'),
        });
        return;
      }
      if (_0x45c381['target']) _0x4d8968?.['begin']?.(_0x45c381);
    },
    _0x41a116 = (_0xd42019) => {
      if (_0x244e35(_0xd42019)) return;
      (_0x1e50c3(_0xd42019), _0x5ae2bd(_0xd42019));
    },
    _0x1fcbf5 = (_0x564213) => {
      (_0x23c082['handlePointerOver'](_0x564213), _0x3f459d(_0x564213));
    },
    _0x2f55c5 = (_0x5ab8cd) => {
      _0x40b574(_0x5ab8cd);
    },
    _0x314a54 = (_0x261c09) => {
      _0x40b574(_0x261c09, { cancelled: !![] });
    },
    _0x1e5a56 = (_0x35bc52) => {
      (_0x23c082['handlePointerOut'](_0x35bc52), _0x22c15c(_0x35bc52), _0x54b283(_0x35bc52));
    },
    _0x1dce51 = () => {
      _0x1eb029();
      const _0x4e6328 = _0x42b7b0?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!_0x4e6328 || !_0x4e4610['isOpen']) return;
      ((_0x4e6328['preload'] = 'auto'), (_0x4e6328['muted'] = !_0x4e4610['soundEnabled']));
      if (_0x4e4610['boundPreviewVideos']['has'](_0x4e6328)) {
        if (_0x4e6328['paused'] === ![]) cutEditorPlaybackController['startNative'](_0x4e6328);
        return;
      }
      (_0x4e4610['boundPreviewVideos']['add'](_0x4e6328),
        _0x4e6328['addEventListener']?.('playing', () =>
          cutEditorPlaybackController['startNative'](_0x4e6328),
        ),
        _0x4e6328['addEventListener']?.('pause', () => {
          (_0x33e2c8(), _0x6f845a(_0x4e6328));
        }),
        _0x4e6328['addEventListener']?.('seeked', () => {
          const _0x3c747c = _0x4e4610['pendingPreviewSeek'];
          if (!_0x3c747c) {
            _0x6f845a(_0x4e6328);
            return;
          }
          const _0x1c5d12 = Number(_0x3c747c['token']);
          _0x3c747c['seeked'] = !![];
          if (typeof _0x4e6328['requestVideoFrameCallback'] !== 'function')
            _0x3c747c['presentedSourceSec'] = Number(_0x4e6328['currentTime']);
          else
            !Number['isFinite'](Number(_0x3c747c['presentedSourceSec'])) &&
              _0x4e4610['previewFrameCallbackId'] == null &&
              _0x324bbc(_0x4e6328, _0x3c747c, _0x1c5d12);
          (_0x52e2c5(_0x4e6328, _0x3c747c, _0x1c5d12), _0x6f845a(_0x4e6328));
        }),
        _0x4e6328['addEventListener']?.('timeupdate', () => {
          if (!_0x4e6328['paused']) cutEditorPlaybackController['startNative'](_0x4e6328);
          else _0x6f845a(_0x4e6328);
        }),
        _0x4e6328['addEventListener']?.('ended', () => {
          (_0x33e2c8(), _0x6f845a(_0x4e6328));
        }),
        _0x4e6328['addEventListener']?.('error', () => {
          (_0x139716(),
            (_0x4e4610['pendingPreviewSeek'] = null),
            windowObject?.['showToast']?.('裁剪预览视频加载失败，请稍后重试。', 'warn'));
        }));
      if (_0x4e6328['paused'] === ![]) cutEditorPlaybackController['startNative'](_0x4e6328);
    },
    _0x35b1d5 = (_0xe4c09d) => {
      const _0x25885b = _0x57b9e5['id'],
        _0x10614f = (_0x1cbffb, _0x305286) =>
          _0x478e16({ dataset: { storyProjectId: _0x1cbffb } }, _0x305286);
      return resolvePersonReplacementContextMenuItems({
        event: _0xe4c09d,
        root: _0x42b7b0,
        projects: _0x57b9e5['libraryProjects'],
        project: _0x57b9e5,
        commands: {
          addLibraryAssets: (_0x2ed7df, _0x4833c1) => {
            if (_0x57b9e5['id'] !== _0x25885b || _0x57b9e5['workspace']['characterAssetTab'] !== 'library')
              return;
            _0x4f358e(_0x2ed7df, _0x4833c1);
          },
          bindAudioCharacter: (_0x22edce, _0x528ad9) => {
            if (_0x57b9e5['id'] !== _0x25885b) return;
            const _0x4ce5a4 = [...(_0x57b9e5['audioAssets'] || []), ...(_0x57b9e5['libraryAssets'] || [])][
              'find'
            ]((_0x454b28) => _0x454b28['id'] === _0x22edce);
            if (_0x4ce5a4)
              _0x4e3281(_0x43f995['SELECT_CHARACTER_VOICE_LIBRARY'], {
                characterId: _0x528ad9,
                asset: { ..._0x4ce5a4 },
              });
          },
          openProject: (_0x4df4f7) => _0x4e3281(_0x43f995['OPEN_PROJECT'], _0x4df4f7),
          renameProject: (_0x3da953) => _0x10614f(_0x3da953, 'rename-project'),
          duplicateProject: (_0x5da5e0) => _0x10614f(_0x5da5e0, 'duplicate-project'),
          collectProject: (_0x4043d) => _0x10614f(_0x4043d, 'collect-project'),
          setProjectArchived: (_0x48ed93, _0x156bde) =>
            _0x10614f(_0x48ed93, _0x156bde ? 'archive-project' : 'unarchive-project'),
          requestDeleteProject: (_0x446a21) => _0x10614f(_0x446a21, 'request-delete-project'),
        },
      });
    },
    _0x2b9821 = (_0x2efe8e) => {
      ((_0x42b7b0 = documentObject['createElement']('section')),
        (_0x42b7b0['className'] = 'person-replacement-workspace replacement-studio-workspace'),
        (_0x42b7b0['dataset']['personReplacementWorkspace'] = ''),
        (_0x42b7b0['dataset']['replacementStudioWorkspace'] = ''),
        (_0x42b7b0['dataset']['uiStop'] = '1'),
        _0x42b7b0['setAttribute']('aria-label', REPLACEMENT_STUDIO_NAME),
        (_0x42b7b0['innerHTML'] = renderHiddenInputs()),
        _0x2efe8e['appendChild'](_0x42b7b0),
        _0x42b7b0['addEventListener']('click', _0x1ee13c),
        _0x42b7b0['addEventListener']('input', _0x2f6384),
        _0x42b7b0['addEventListener']('change', _0x50349f),
        _0x42b7b0['addEventListener']('focusin', _0x23c082['handleFocusIn']),
        _0x42b7b0['addEventListener']('focusout', _0x1f0bcb),
        _0x42b7b0['addEventListener']('dragstart', _0x47c5ed),
        _0x42b7b0['addEventListener']('dragend', _0x416474),
        _0x42b7b0['addEventListener']('dragover', _0x115624),
        _0x42b7b0['addEventListener']('dragleave', _0x11adf8),
        _0x42b7b0['addEventListener']('drop', _0x4565af),
        _0x348b2e?.(),
        (_0x348b2e = bindWorkspaceEntityContextMenu(_0x42b7b0, {
          resolveItems: _0x35b1d5,
          beforeOpen() {
            if (!_0x57b9e5['workspace']['openProjectMenuId']) return;
            _0x2118fd({ openProjectMenuId: '' });
          },
        })),
        _0x42b7b0['addEventListener']('error', handleWorkspaceAssetLibraryImageError, !![]),
        _0x42b7b0['addEventListener']('pointerdown', _0x2f9b10),
        _0x42b7b0['addEventListener']('pointerup', _0x2f55c5),
        _0x42b7b0['addEventListener']('pointercancel', _0x314a54),
        _0x42b7b0['addEventListener']('pointerover', _0x1fcbf5),
        _0x42b7b0['addEventListener']('pointermove', _0x41a116),
        _0x42b7b0['addEventListener']('pointerout', _0x1e5a56),
        _0x42b7b0['addEventListener']('dblclick', _0x2b3990));
      const _0x7a9ac3 = (_0x242a55) => {
        const _0x4217e3 = _0x242a55['target']?.['closest']?.('.person-replacement-production-page');
        if (!_0x4217e3 || !_0x42b7b0['contains'](_0x4217e3)) return ![];
        const _0x52c107 =
          _0x4217e3['ownerDocument']?.['defaultView']?.['getComputedStyle']?.(_0x4217e3)?.['overflowY'];
        if (!['auto', 'scroll', 'overlay']['includes'](_0x52c107)) return ![];
        const _0x532a78 = Number(_0x242a55['deltaY']) || 0x0,
          _0x47bc4e = Math['max'](0x0, _0x4217e3['scrollHeight'] - _0x4217e3['clientHeight']);
        if (_0x532a78 < 0x0) return _0x4217e3['scrollTop'] > 0x0;
        if (_0x532a78 > 0x0) return _0x4217e3['scrollTop'] < _0x47bc4e;
        return ![];
      };
      (_0x42b7b0['addEventListener'](
        'wheel',
        (_0x569213) => {
          if (_0x7a9ac3(_0x569213)) {
            _0x569213['stopPropagation']();
            return;
          }
          if (_0x31ad17(_0x569213)) {
            _0x569213['stopPropagation']();
            return;
          }
          if (_0x4a6238(_0x569213)) {
            _0x569213['stopPropagation']();
            return;
          }
          if (_0xbbcbef(_0x569213)) return;
          if (_0x460f91(_0x569213)) {
            _0x569213['stopPropagation']();
            return;
          }
          if (_0x1b6ef9(_0x569213)) {
            _0x569213['stopPropagation']();
            return;
          }
          if (_0x3f9fb5(_0x569213)) {
            _0x569213['stopPropagation']();
            return;
          }
          if (
            shouldPreserveWorkspaceNestedWheel(_0x569213['target'], {
              nestedSelector:
                'textarea, [contenteditable="true"], .node-model-submenu, .story-style-grid, .story-assets-list, .story-episode-assets, .story-clip-strip',
              boundaryRoot: _0x42b7b0,
            })
          ) {
            _0x569213['stopPropagation']();
            return;
          }
          _0x569213['stopPropagation']();
          if (_0x204611(_0x569213) || _0x52ce70(_0x569213)) return;
          _0x32a2f0(_0x569213);
        },
        { passive: ![] },
      ),
        _0x42b7b0['addEventListener']('keydown', _0x1af548, !![]),
        windowObject?.['addEventListener']?.('keydown', _0x4d5162, !![]),
        windowObject?.['addEventListener']?.('resize', _0x11a836));
      const _0x44bcb7 = (_0x4f9251) => {
          (_0x4f9251?.['key'] === 'Control' ||
            _0x4f9251?.['code'] === 'ControlLeft' ||
            _0x4f9251?.['code'] === 'ControlRight') &&
            (_0x553216 = _0x4f9251['type'] === 'keydown');
        },
        _0x1d2210 = () => {
          ((_0x553216 = ![]), _0x303d4e());
        };
      return (
        windowObject?.['addEventListener']?.('keydown', _0x44bcb7, !![]),
        windowObject?.['addEventListener']?.('keyup', _0x44bcb7, !![]),
        windowObject?.['addEventListener']?.('blur', _0x1d2210, !![]),
        (_0x3d05d4 = () => {
          (windowObject?.['removeEventListener']?.('keydown', _0x44bcb7, !![]),
            windowObject?.['removeEventListener']?.('keyup', _0x44bcb7, !![]),
            windowObject?.['removeEventListener']?.('blur', _0x1d2210, !![]),
            _0x1d2210());
        }),
        (_0x4d8968 = createWorkspaceMarqueeSelectionController({
          root: _0x42b7b0,
          documentObject: documentObject,
          windowObject: windowObject,
          surfaceSelector: '[data-story-marquee-surface]',
          blockedControlSelector:
            "[data-story-action], [data-person-replacement-action], input, textarea, select, a, [contenteditable='true']",
          overlayClassName: 'story-marquee-selection',
          itemSelector: '[data-story-marquee-item]',
          getItemId: (_0x364a7b) => _0x364a7b['dataset']?.['storyMarqueeId'],
          getConfig: (_0x3c317b) => {
            if (
              _0x3c317b?.['dataset']?.['storyMarqueeSurface'] === 'shot-cuts' &&
              _0x57b9e5['workspace']['view'] === 'project' &&
              _0x57b9e5['workspace']['step'] === 0x2 &&
              _0x4e4610['isOpen']
            )
              return {
                enabled: !_0x374e20(),
                selectedIds: _0x4e4610['selectedShotIds'],
                itemSelector: '[data-person-replacement-shot-cut-selectable]',
                getItemId: (_0x42c7c7) => _0x42c7c7['dataset']?.['shotId'],
                hitClassName: 'is-marquee-hit',
                rootClassName: 'is-shot-cut-marquee-selecting',
                commit: (_0x5cd880) => {
                  (_0x24b921['setSelectedShotIds'](_0x5cd880), _0x4cf492());
                },
              };
            if (
              _0x3c317b?.['dataset']?.['storyMarqueeSurface'] === 'people' &&
              _0x57b9e5['workspace']['view'] === 'project' &&
              _0x57b9e5['workspace']['step'] === 0x2 &&
              !_0x4e4610['isOpen']
            )
              return {
                enabled: !![],
                canBegin: (_0x52cebf) => _0x1c28ec(_0x52cebf),
                additive: ![],
                selectedIds: [],
                itemSelector: '[data-person-replacement-person-drop]',
                hitClassName: 'is-batch-selection-hit',
                overlayClassName: 'is-person-box-selection',
                rootClassName: 'is-person-box-marquee-selecting',
                getItemId: (_0x4ae01e) => _0x4ae01e['dataset']?.['personId'],
                commit: (_0x1ced81) => {
                  (_0x29b821(_0x3c317b['dataset']?.['shotId'], _0x1ced81), _0x431ffd());
                },
              };
            if (
              _0x3c317b?.['dataset']?.['storyMarqueeSurface'] === 'shots' &&
              _0x57b9e5['workspace']['view'] === 'project' &&
              [0x2, 0x3, 0x5]['includes'](_0x57b9e5['workspace']['step']) &&
              !_0x4e4610['isOpen']
            )
              return {
                enabled: !![],
                selectedIds: _0x57b9e5['workspace']['selectedShotIds'],
                commit: (_0x5e885c) => {
                  _0x26d845(
                    {
                      ..._0x57b9e5,
                      workspace: {
                        ..._0x57b9e5['workspace'],
                        shotSelectionMode: !![],
                        selectedShotIds: _0x5e885c,
                      },
                    },
                    'shot-marquee',
                  );
                },
              };
            return {
              enabled:
                _0x3c317b?.['dataset']?.['storyMarqueeSurface'] === 'assets' &&
                _0x57b9e5['workspace']['view'] === 'project' &&
                _0x57b9e5['workspace']['step'] === 0x1 &&
                ['character', 'scene', 'audio', 'library']['includes'](
                  _0x57b9e5['workspace']['characterAssetTab'],
                ),
              selectedIds: _0x57b9e5['workspace']['selectedAssetIds'],
              commit: (_0x343e7b) => {
                const _0x399dc2 = new Set(
                    getPersonReplacementSelectableAssets(
                      _0x57b9e5,
                      _0x57b9e5['workspace']['characterAssetTab'],
                    )['map']((_0x32e7fc) => _0x32e7fc['id']),
                  ),
                  _0x34ca05 = _0x343e7b['filter']((_0x44e3f4) => _0x399dc2['has'](_0x44e3f4));
                (_0x26d845(
                  {
                    ..._0x57b9e5,
                    workspace: {
                      ..._0x57b9e5['workspace'],
                      assetSelectionMode: _0x34ca05['length'] > 0x0,
                      selectedAssetIds: _0x34ca05,
                      ...(_0x34ca05['length']
                        ? {
                            [{
                              character: 'selectedCharacterId',
                              scene: 'selectedSceneId',
                              audio: 'selectedAudioAssetId',
                              library: 'selectedLibraryAssetId',
                            }[_0x57b9e5['workspace']['characterAssetTab']]]: _0x34ca05['at'](-0x1),
                          }
                        : {}),
                    },
                  },
                  'asset-marquee',
                ),
                  focusWorkspaceAssetCard(_0x42b7b0, _0x34ca05['at'](-0x1)));
              },
            };
          },
        })),
        _0x42b7b0
      );
    },
    _0x2e5b13 = createPersonReplacementPageTransitionController({
      getRoot: () => _0x42b7b0,
      getTransitionKey: () => _0x934d2e(_0x57b9e5),
      isCutEditorOpen: () => _0x4e4610['isOpen'],
      isDestroyed: () => _0x2f325d,
      requestRender: () => _0x4cf492(),
      documentObject: documentObject,
      windowObject: windowObject,
    }),
    {
      captureFocus: _0x7bff34,
      deferRenderIfSettling: _0x41a669,
      destroy: _0x4a9758,
      restoreFocus: _0x38d4d3,
      start: _0x2ac7c4,
      stop: _0x550b2a,
      syncProjectToolbarInPlace: _0x565909,
    } = _0x2e5b13,
    _0x1fe8bc = _0x4cf492;
  _0x4cf492 = () => {
    if (!_0x42b7b0 || _0x2f325d || !_0x3accc4['isActive']()) return;
    if (personReplacementShellPresentation['syncHome'](_0x42b7b0, _0x57b9e5)) {
      _0x3a22a2['update'](_0x57b9e5['persistenceState']);
      return;
    }
    const _0x5eee1a = _0x59940c,
      _0x1d94b7 = _0x5bc315,
      _0xaa3130 = _0x4c0940(_0x57b9e5),
      _0x219004 =
        _0x5eee1a === 'none' && _0x3238d5 === _0xaa3130
          ? captureWorkspaceNestedScrollPositions(
              _0x42b7b0,
              PERSON_REPLACEMENT_PERSISTENT_NESTED_SCROLL_SELECTORS,
            )
          : null;
    ((_0x59940c = 'none'), (_0x5bc315 = 'page'));
    if (_0x41a669(_0x5eee1a)) return;
    const _0xdb623a = _0x7bff34();
    (_0x45ae96(), _0x550b2a({ renderPending: ![] }));
    const _0x4237c2 = _0x42b7b0['querySelector']?.('.person-replacement-project-body'),
      _0xf577e1 = ['forward', 'backward']['includes'](_0x5eee1a)
        ? _0x4237c2?.['firstElementChild'] || null
        : null,
      _0x3b95da = _0xf577e1 ? _0x42b7b0['querySelector']?.('.story-workspace-toolbar') : null;
    (_0xf577e1?.['remove']?.(), _0x3b95da?.['remove']?.());
    const _0x56e6cc =
      _0x57b9e5['workspace']['view'] === 'project' &&
      _0x57b9e5['workspace']['step'] === 0x2 &&
      !_0x4e4610['isOpen'];
    (_0x454e24(_0x56e6cc),
      _0x1fe8bc(),
      _0x3a22a2['update'](_0x57b9e5['persistenceState']),
      restoreWorkspaceNestedScrollPositions(_0x42b7b0, _0x219004),
      (_0x3238d5 = _0xaa3130),
      _0x218b57());
    const _0x5df4b6 = _0x42b7b0['querySelector']?.('.person-replacement-project-body'),
      _0x2555bd = _0x5df4b6?.['firstElementChild'] || null,
      _0x15ba9a = _0x3b95da ? _0x42b7b0['querySelector']?.('.story-workspace-toolbar') : null;
    if (_0x3b95da && _0x15ba9a) _0x15ba9a['replaceWith']?.(_0x3b95da);
    const _0x5cb455 = _0x2ac7c4(_0xf577e1, _0x2555bd, _0x5eee1a, _0x1d94b7, {
      currentToolbar: _0x3b95da,
      nextToolbar: _0x15ba9a,
      focusKey: _0xdb623a,
    });
    (!_0x5cb455 && _0x565909(_0x3b95da, _0x15ba9a),
      _0x38d4d3(_0xdb623a, { currentToolbar: _0x3b95da, incomingPage: _0x2555bd }),
      _0x2e8658(),
      typeof _0x42b7b0['insertAdjacentHTML'] === 'function'
        ? _0x42b7b0['insertAdjacentHTML']('beforeend', renderHiddenInputs())
        : (_0x42b7b0['innerHTML'] += renderHiddenInputs()),
      _0x135d3b(),
      _0x1dce51(),
      _0x53b56d(),
      _0x5e0fff());
  };
  const _0x2edc43 = Object['freeze']({
    open(_0x499d18 = {}) {
      if (_0x2f325d) return null;
      _0x499d18['project'] &&
        (_0x119305(),
        (_0x57b9e5 = normalizePersonReplacementWorkspaceProject(_0x499d18['project'])),
        _0x24b921['syncProject'](_0x57b9e5),
        _0x31cdf2['switchProject'](_0x57b9e5['id']));
      ((_0x57b9e5 = _0x3ccd2d(_0x57b9e5)), (_0x2c9c4b = _0x499d18['mountTarget'] || _0x2c9c4b));
      const _0x692fa = resolveMountTarget(documentObject, _0x2c9c4b);
      if (!_0x692fa) return null;
      if (!_0x42b7b0) _0x2b9821(_0x692fa);
      else {
        if (_0x42b7b0['parentElement'] !== _0x692fa) _0x692fa['appendChild'](_0x42b7b0);
      }
      return (_0x3accc4['activate'](), _0x4cf492(), _0x42b7b0);
    },
    close() {
      if (!_0x42b7b0 || _0x2f325d) return ![];
      (_0xea53df(), _0x32d3c6(), _0x4d8968?.['cancel']?.(), _0x113bbe());
      let _0x592421 = !![];
      try {
        _0x592421 = _0x4ad4fe(_0x43f995['CAN_CLOSE'], cloneJson(_0x57b9e5)) !== ![];
      } catch {
        _0x592421 = !![];
      }
      if (!_0x592421) return (_0x3fc4d6('close'), ![]);
      return (
        closeDebugRequestWindow(documentObject),
        _0x119305(),
        _0x551a99(),
        _0x3c691d(),
        _0x481bb9(),
        _0x2d6050(),
        _0xa770b0(),
        _0x446a6f(),
        _0x3accc4['deactivate'](),
        _0x196980(),
        (_0x834763 = ''),
        _0xb8cf88(),
        _0x4ad4fe(_0x43f995['CLOSE'], { project: cloneJson(_0x57b9e5) }),
        !![]
      );
    },
    setProject(_0x34218f) {
      if (_0x2f325d) return null;
      const _0x419b95 = _0x57b9e5,
        _0x3f99f3 = _0x3ccd2d(normalizePersonReplacementWorkspaceProject(_0x34218f)),
        _0x3bee27 = normalizeText(_0x3f99f3['id']);
      _0x3bee27 !== normalizeText(_0x419b95['id']) &&
        (closeDebugRequestWindow(documentObject), _0xa770b0(), _0x31cdf2['switchProject'](_0x3bee27));
      _0x57b9e5 = _0x3f99f3;
      _0x834763 &&
        !_0x57b9e5['characters']['some']((_0x2b685b) => _0x2b685b['id'] === _0x834763) &&
        (_0x834763 = '');
      const _0x26f59b = _0x24b921['syncProject'](_0x57b9e5);
      _0x969ed5(_0x419b95, _0x57b9e5);
      const _0x285434 = new Set(_0x57b9e5['shots']['map']((_0x40acc5) => _0x40acc5['id']));
      return (
        (_0x26f59b ||
          ((_0x4e4610['isOpen'] || _0x4e4610['isOpening']) &&
            (_0x57b9e5['workspace']['view'] !== 'project' ||
              _0x57b9e5['workspace']['step'] !== 0x2 ||
              _0x4e4610['draft']['some']((_0x97a7e8) => !_0x285434['has'](_0x97a7e8['shotId']))))) &&
          _0x119305(),
        _0x4cf492(),
        cloneJson(_0x57b9e5)
      );
    },
    syncProjectState(_0x155ab6, { returnSnapshot: returnSnapshot = !![] } = {}) {
      if (_0x2f325d) return null;
      const _0x292d94 = _0x57b9e5,
        _0x38ae7e = normalizePersonReplacementWorkspaceProject(_0x155ab6);
      if (!Object['hasOwn'](_0x155ab6, 'libraryProjects') && _0x38ae7e['id'] === _0x292d94['id'])
        _0x38ae7e['libraryProjects'] = _0x292d94['libraryProjects'];
      const _0x213363 = Boolean(
          _0x42b7b0 &&
          normalizeText(_0x38ae7e['id']) === normalizeText(_0x57b9e5['id']) &&
          _0x38ae7e['workspace']?.['view'] === 'project' &&
          _0x38ae7e['workspace']?.['step'] === 0x3 &&
          _0x57b9e5['workspace']?.['view'] === 'project' &&
          _0x57b9e5['workspace']?.['step'] === 0x3,
        ),
        _0x3c0760 = _0x213363
          ? resolvePersonReplacementVideoGenerationUiRefreshScope(_0x292d94, _0x38ae7e)
          : '',
        _0x48bc7e = Boolean(
          _0x42b7b0 &&
          normalizeText(_0x38ae7e['id']) === normalizeText(_0x57b9e5['id']) &&
          _0x38ae7e['workspace']?.['view'] === 'project' &&
          _0x38ae7e['workspace']?.['step'] === 0x2 &&
          _0x57b9e5['workspace']?.['view'] === 'project' &&
          _0x57b9e5['workspace']?.['step'] === 0x2,
        ),
        _0x2b52c3 = _0x48bc7e
          ? resolvePersonReplacementImageGenerationUiRefreshScope(_0x292d94, _0x38ae7e)
          : '';
      normalizeText(_0x38ae7e['id']) !== normalizeText(_0x57b9e5['id']) &&
        (_0xa770b0(), _0x31cdf2['switchProject'](_0x38ae7e['id']));
      _0x57b9e5 = _0x38ae7e;
      if (_0x24b921['syncProject'](_0x57b9e5)) _0x119305();
      if (!_0x3accc4['isActive']()) return returnSnapshot ? cloneJson(_0x57b9e5) : null;
      if (_0x2b52c3 === 'selected-shot') _0x593f36({ refreshTimelineCard: !![] });
      else {
        if (_0x2b52c3 === 'timeline') _0x4c1ba8();
        else {
          if (_0x3c0760 === 'selected-shot') {
            if (!_0x59d0d2() && !_0x2ba69b['isClipActive']()) _0x4cf492();
          } else _0x3c0760 === 'timeline' && _0x4c1ba8();
        }
      }
      return (
        syncPersonReplacementPromptModeControl(_0x42b7b0, _0x57b9e5, _0x53365b()['generatingShotIds']),
        personReplacementShellPresentation['syncStatus'](_0x42b7b0, _0x57b9e5),
        _0x53b56d(),
        _0x5e0fff(),
        _0x4aeba7?.['refresh'](),
        returnSnapshot ? cloneJson(_0x57b9e5) : null
      );
    },
    setPersistenceState(_0x502839) {
      if (_0x2f325d) return null;
      return (
        (_0x57b9e5 = {
          ..._0x57b9e5,
          persistenceState: normalizePersonReplacementPersistenceState(_0x502839),
        }),
        _0x3a22a2['update'](_0x57b9e5['persistenceState']),
        cloneJson(_0x57b9e5['persistenceState'])
      );
    },
    setOutputCanvasSyncState(_0x37a0b5 = {}) {
      if (_0x2f325d) return null;
      const _0x46962f = _0x1b7b58;
      ((_0x1b7b58 = _0x37a0b5?.['pending'] === !![]),
        (_0x47513d = _0x1b7b58 ? normalizeText(_0x37a0b5?.['scope']) : ''),
        _0x624e11());
      const _0x3caf3a = _0x42b7b0?.['querySelector']?.('.person-replacement-toolbar-actions'),
        _0x3798c9 = _0x1dc794(
          personReplacementShellPresentation['renderToolbarActions'](_0x57b9e5, _0x1f9cef()),
        );
      return (
        _0x3caf3a &&
          _0x3798c9 &&
          typeof _0x3caf3a['replaceWith'] === 'function' &&
          _0x3caf3a['replaceWith'](_0x3798c9),
        _0x59adb4({ captureFocus: _0x1b7b58 && !_0x46962f }),
        { pending: _0x1b7b58, scope: _0x47513d }
      );
    },
    setComposeOutputState(_0x3789f6 = {}) {
      if (_0x2f325d) return null;
      const _0x435892 = _0x4fcdf7;
      _0x4fcdf7 = _0x3789f6?.['pending'] === !![];
      const _0x150637 = _0x42b7b0?.['querySelector']?.(
          '[data-person-replacement-action=\x22compose-output\x22]',
        ),
        _0x502d7a = _0x1dc794(renderCompositeComposeAction(_0x57b9e5, _0x1f9cef()));
      return (
        _0x150637 &&
          _0x502d7a &&
          typeof _0x150637['replaceWith'] === 'function' &&
          _0x150637['replaceWith'](_0x502d7a),
        _0x3ff432(),
        _0x435892 && !_0x4fcdf7 && _0x5083e0({ composeOnly: !![] }),
        { pending: _0x4fcdf7 }
      );
    },
    setExportOutputState(_0x127722 = {}) {
      if (_0x2f325d) return null;
      ((_0x463a8b = _0x127722?.['pending'] === !![]), _0x624e11());
      const _0x147638 = _0x42b7b0?.['querySelector']?.('.person-replacement-toolbar-actions'),
        _0x252817 = _0x1dc794(
          personReplacementShellPresentation['renderToolbarActions'](_0x57b9e5, _0x1f9cef()),
        );
      return (
        _0x147638 &&
          _0x252817 &&
          typeof _0x147638['replaceWith'] === 'function' &&
          _0x147638['replaceWith'](_0x252817),
        { pending: _0x463a8b }
      );
    },
    prewarmCompositeOriginalVideo(_0x14b025 = '') {
      if (_0x2f325d) return ![];
      return _0x2f6a26(_0x14b025);
    },
    getProject() {
      return cloneJson(_0x57b9e5);
    },
    refreshVoiceSources(_0x2a0ad2 = {}) {
      return _0x152aca(_0x2a0ad2);
    },
    destroy() {
      if (_0x2f325d) return;
      (_0xc2e7d1(),
        _0xea53df(),
        _0x54fdfd(),
        _0x119305(),
        _0x24b921['dispose'](),
        _0x551a99(),
        _0x3c691d(),
        _0xa770b0(),
        _0x31cdf2['dispose'](),
        _0x4a9758(),
        _0x524d22(),
        _0x416474(),
        _0x773f3f(),
        _0x13053b({ restoreFocus: ![] }),
        _0x3accc4['dispose'](),
        _0x3a22a2['destroy'](),
        (_0x2f325d = !![]),
        _0x42cf44['forEach']((_0x2e7d9c) => _0x2e7d9c?.['destroy']?.()),
        _0x4aeba7?.['destroy']?.(),
        (_0x4aeba7 = null),
        _0x5cb732?.(),
        (_0x5cb732 = null),
        _0x3e5d6c?.(),
        (_0x3e5d6c = null),
        typeof _0x42b7b0?.['removeEventListener'] === 'function' &&
          _0x42b7b0['removeEventListener']('error', handleWorkspaceAssetLibraryImageError, !![]),
        _0x348b2e?.(),
        (_0x348b2e = null),
        _0x3d05d4?.(),
        (_0x3d05d4 = null),
        windowObject?.['removeEventListener']?.('keydown', _0x4d5162, !![]),
        windowObject?.['removeEventListener']?.('resize', _0x11a836),
        _0x4d8968?.['destroy']?.(),
        _0x400faa['destroy'](),
        _0x42b7b0?.['remove']?.(),
        (_0x42b7b0 = null));
    },
  });
  return _0x2edc43;
}
