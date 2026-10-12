// Presentation helpers extracted from personReplacementWorkspace.js.
// The workspace module imports these; its export surface is unchanged.

import { formatPersonReplacementScopeLabel, PERSON_REPLACEMENT_ORIENTATIONS, PERSON_REPLACEMENT_SCOPES } from './personReplacementProject.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { getWorkspaceAssetAppearances, getWorkspaceAssetBaseAppearance } from '../workspaceAssetAppearance.js';
import { MEDIA_CLIP_REVERSE_ICON_PATHS } from '../../components/media-clip/mediaClipReverseControl.js';
import { createPersonReplacementSmartDetectPresentation } from './personReplacementSmartDetectPresentation.js';
import { createPersonReplacementShotTimelinePresentation } from './personReplacementShotTimelinePresentation.js';
import { createPersonReplacementIdentityPresentation } from './personReplacementIdentityPresentation.js';
import { createPersonReplacementCompositePreviewPresentation } from './personReplacementCompositePreviewPresentation.js';
import { createPersonReplacementShellPresentation } from './personReplacementShellPresentation.js';
import { getPersonReplacementVoiceCloneCharacters, renderPersonReplacementVoiceClonePage } from './personReplacementVoiceClonePresentation.js';
import { createPersonReplacementImagePresentation } from './personReplacementImagePresentation.js';
import { renderPersonReplacementLayoutSplitter } from './personReplacementLayoutResizeController.js';
import { createPersonReplacementVideoPresentation } from './personReplacementVideoPresentation.js';
import { buildPersonReplacementCompositePreviewSnapshot } from './personReplacementCompositePreviewProjection.js';
import { renderPersonReplacementAssetSettingsPage } from './personReplacementAssetSettingsPresentation.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');
}
export function normalizeText(item, key = '') {
  const index = String(item ?? '').trim();
  return index || key;
}
export function cloneJson(result) {
  return result && typeof result === 'object' ? JSON.parse(JSON.stringify(result)) : result;
}
export function clamp(data, options, target, source = options) {
  const next = Number(data);
  return Number.isFinite(next) ? Math.min(target, Math.max(options, next)) : source;
}
export const PERSON_REPLACEMENT_ORIENTATION_LABELS = Object.freeze({
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
export function formatPersonOrientation(current) {
  return (
    PERSON_REPLACEMENT_ORIENTATION_LABELS[normalizeText(current)] ||
    PERSON_REPLACEMENT_ORIENTATION_LABELS.unknown
  );
}
export function getPersonOrientationOptions() {
  const list = PERSON_REPLACEMENT_ORIENTATIONS.filter((entry) => entry !== 'unknown');
  return list.map((value2) => ({ value: value2, label: formatPersonOrientation(value2) }));
}
export function getPersonReplacementScopeOptions() {
  return PERSON_REPLACEMENT_SCOPES.map((value3) => ({
    value: value3,
    label: formatPersonReplacementScopeLabel(value3),
  }));
}
export function normalizeMediaUrl(record) {
  const text = normalizeText(record);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
export function getCharacterAppearance(payload, handle = '') {
  const list2 = getWorkspaceAssetAppearances(payload);
  return (
    list2.find((state) => state.id === handle) ||
    getWorkspaceAssetBaseAppearance(payload) ||
    list2[0] ||
    null
  );
}
export function getCharacterVoiceUrl(options2 = {}) {
  return normalizeMediaUrl(
    options2.voiceReference?.audioUrl ||
      options2.voiceReference?.localPath ||
      options2.voiceRef,
  );
}
export function formatClock(config) {
  const scope = Math.max(0, Number(config) || 0),
    input = Math.floor(scope / 60),
    output = Math.floor(scope % 60);
  return String(input).padStart(2, '0') + ':' + String(output).padStart(2, '0');
}
export function renderIcon(value4) {
  const value5 = {
    upload:
      '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
    video:
      '<rect x="3" y="5" width="14" height="14" rx="3"/><path d="m17 10 4-2v8l-4-2"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    undo: '<path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    soundOff:
      '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 5m0-5-5 5"/>',
    soundOn:
      '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18 7a7 7 0 0 1 0 10"/>',
    smartDetect:
      '<path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2z"/><path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z"/><path d="M5 14v5h5"/>',
    reverse: MEDIA_CLIP_REVERSE_ICON_PATHS,
    merge:
      '<path d="M4 6h6v5H4zM14 13h6v5h-6z"/><path d="M10 8.5h2a2 2 0 0 1 2 2v5"/><path d="m11.5 13 2.5 2.5 2.5-2.5"/>',
  };
  return (
    '<svg class="person-replacement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (value5[value4] || '') +
    '</svg>'
  );
}
export const personReplacementSmartDetectPresentation = createPersonReplacementSmartDetectPresentation({
    renderIcon: renderIcon,
  }),
  personReplacementShotTimelinePresentation = createPersonReplacementShotTimelinePresentation({
    renderIcon: renderIcon,
  }),
  personReplacementIdentityPresentation = createPersonReplacementIdentityPresentation(),
  personReplacementCompositePreviewPresentation = createPersonReplacementCompositePreviewPresentation(),
  personReplacementShellPresentation = createPersonReplacementShellPresentation({
    resolveVoiceReferenceCount: (value6) =>
      getPersonReplacementVoiceCloneCharacters(value6).filter((value7) => getCharacterVoiceUrl(value7)).length,
  }),
  personReplacementImagePresentation = createPersonReplacementImagePresentation({
    buildIdentityView: (value8, value9, value10) =>
      personReplacementIdentityPresentation.buildImage(value8, value9, value10),
    renderShotTimeline: (value11, value12) =>
      personReplacementShotTimelinePresentation.renderStage(value11, value12),
    renderLayoutSplitter: renderPersonReplacementLayoutSplitter,
    renderFooter: (value13, value14) =>
      personReplacementShellPresentation.renderStepFooter(value13, value14),
    renderSmartDetectTrigger: personReplacementSmartDetectPresentation.renderTrigger,
  }),
  personReplacementVideoPresentation = createPersonReplacementVideoPresentation({
    buildIdentityView: (value15, value16) =>
      personReplacementIdentityPresentation.buildVideo(value15, value16),
    renderShotTimeline: (value17, value18) =>
      personReplacementShotTimelinePresentation.renderStage(value17, value18),
    renderLayoutSplitter: renderPersonReplacementLayoutSplitter,
    renderFooter: (value19, value20) =>
      personReplacementShellPresentation.renderStepFooter(value19, value20),
  });
export function renderCompositeComposeAction(value21, value22 = {}) {
  const enabled = value21.shots.some((value23) => normalizeText(value23.resultVideoRef)),
    value24 = value22.composeOutputPending === true,
    personReplacementCompositePreviewSnapshot =
      buildPersonReplacementCompositePreviewSnapshot(value21).fullAvailable,
    value25 = value24
      ? '合成中…'
      : personReplacementCompositePreviewSnapshot
        ? '重新合成全部视频'
        : '合成全部视频';
  return (
    '<button type="button" class="story-workbench-action-button story-main-action-button person-replacement-compose-output' +
    (value24 ? ' is-loading' : '') +
    '" data-person-replacement-action="compose-output" aria-busy="' +
    value24 +
    '"' +
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
export function renderAssetSettings(value26, args = {}) {
  return renderPersonReplacementAssetSettingsPage(value26, {
    ...args,
    renderDetailSplitter: (assetDetailSplitRatio) =>
      renderPersonReplacementLayoutSplitter('asset-detail', { assetDetailSplitRatio: assetDetailSplitRatio }),
    footerHtml: personReplacementShellPresentation.renderStepFooter(value26, {
      nextLabel: '进入图像替换',
      hidePrevious: true,
    }),
  });
}
export function renderVoiceClone(value27) {
  return renderPersonReplacementVoiceClonePage(value27, {
    footerHtml: personReplacementShellPresentation.renderStepFooter(value27, {
      nextLabel: '进入合成视频',
    }),
  });
}
export function renderCompositePreview(value28, composeOutputPending = {}) {
  const personReplacementCompositePreviewSnapshot2 = buildPersonReplacementCompositePreviewSnapshot(value28);
  return personReplacementCompositePreviewPresentation.render(personReplacementCompositePreviewSnapshot2, {
    composeActionHtml: renderCompositeComposeAction(value28, composeOutputPending),
    playbackControlsHtml: personReplacementVideoPresentation.renderPlaybackControls(
      personReplacementCompositePreviewSnapshot2.selectedShot,
      { context: 'comparison', disabled: !personReplacementCompositePreviewSnapshot2.canCompare },
    ),
    composeOutputPending: composeOutputPending.composeOutputPending === true,
  });
}
export function renderProject(value29, smartDetecting = {}) {
  const value30 = {
      1: renderAssetSettings,
      2: (value31, value32) => personReplacementImagePresentation.render(value31, value32),
      3: (value33, value34) => personReplacementVideoPresentation.render(value33, value34),
      4: renderVoiceClone,
      5: renderCompositePreview,
    },
    value35 = smartDetecting.cutEditorSmartDetectOpen
      ? personReplacementSmartDetectPresentation.renderPanel(value29, {
          smartDetecting: smartDetecting.cutEditorSmartDetecting,
        })
      : '',
    value36 =
      smartDetecting.canvasSyncOverlayInline === false
        ? ''
        : personReplacementShellPresentation.renderCanvasSyncLoadingOverlay(smartDetecting);
  return (
    personReplacementShellPresentation.renderHeader(value29, smartDetecting) +
    '<main class="person-replacement-project-body"' +
    (smartDetecting.canvasSyncPending === true ? ' aria-hidden="true" inert' : '') +
    '>' +
    value30[value29.workspace.step](value29, smartDetecting) +
    '</main>' +
    value35 +
    value36
  );
}
export function renderHiddenInputs() {
  return '<div class="story-asset-hover-preview" data-story-asset-hover-preview role="tooltip" aria-hidden="true"></div><input type="file" accept="video/*" multiple hidden data-person-replacement-input="source-videos"><input type="file" accept="image/*" multiple hidden data-person-replacement-input="new-character-images"><input type="file" accept="image/*" multiple hidden data-person-replacement-input="new-scene-images"><input type="file" accept="audio/*" multiple hidden data-person-replacement-input="new-audio-files"><input type="file" accept="image/*" hidden data-person-replacement-input="appearance-image"><input type="file" accept="image/*" hidden data-person-replacement-input="replacement-image"><input type="file" accept="video/*" hidden data-person-replacement-input="replacement-video-result"><input type="file" accept="image/*,video/*" hidden data-person-replacement-input="replacement-video-slot"><input type="file" accept="audio/*" hidden data-person-replacement-input="character-voice">';
}
