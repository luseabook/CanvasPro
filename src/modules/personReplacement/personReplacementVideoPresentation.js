import { renderRequestDebugButton } from '../debugRequestWindow.js';
import {
  PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  PERSON_REPLACEMENT_DEFAULT_VIDEO_PROMPT,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
  PERSON_REPLACEMENT_VIDEO_MODEL_IDS,
  PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
  getPersonReplacementActiveVideoResultIndex,
  getPersonReplacementVideoResults,
  resolvePersonReplacementVideoGenerationFps,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoParameterPolicy,
  resolvePersonReplacementVideoResultRef,
} from './personReplacementProject.js';
import {
  isPersonReplacementVideoGenerationActive,
  resolvePersonReplacementVideoGenerationState,
} from './personReplacementVideoGeneration.js';
import { resolvePersonReplacementVideoSlotState } from './personReplacementVideoInputs.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { renderAIGenVideoModelSelectorMarkup } from '../../components/aigenVideo/modelSelector.js';
import { VIDEO_CLIP_ICON_SVG } from '../../components/nodeToolbar/videoToolbarHtml.js';
import { getModelManifest, resolveModelProvider } from '../../manifests/index.js';
import { renderWorkspaceAssetLoadingOverlay } from '../workspaceAssetPresentation.js';
import { renderPersonReplacementPreviewArrow } from './personReplacementAssetPresentation.js';
import { renderWorkspaceVideoPlaybackControls } from '../workspaceVideoPlaybackControls.js';
import { renderWorkspaceVideoDownloadButton } from '../workspaceVideoDownload.js';
import { renderWorkspaceUploadIcon } from '../workspaceActionIcons.js';
import { normalizePersonReplacementLayout } from './personReplacementProjectSession.js';
import { renderPersonReplacementPromptHtml } from './personReplacementPromptMentions.js';
export const PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS = Object['freeze']({
  MISSING_SHOT: 'missing-shot',
  GENERATION_RUNNING: 'generation-running',
  SOURCE_PREPARING: 'source-preparing',
  SOURCE_PREPARATION_FAILED: 'source-preparation-failed',
  MISSING_SOURCE_VIDEO: 'missing-source-video',
  MISSING_IMAGE_INPUT: 'missing-image-input',
});
function normalizeText(_0x438e7b) {
  return String(_0x438e7b ?? '')['trim']();
}
function resolveVideoResultPosterRef(_0xc17bb4, _0x442c7f) {
  const _0x1fc263 = normalizeText(
    _0xc17bb4?.['posterLocalPath'] ||
      _0xc17bb4?.['thumbLocalPath'] ||
      _0xc17bb4?.['posterUrl'] ||
      _0xc17bb4?.['thumbUrl'] ||
      _0xc17bb4?.['thumbnailLocalPath'] ||
      _0xc17bb4?.['thumbnailUrl'] ||
      _0xc17bb4?.['coverUrl'],
  );
  if (_0x1fc263) return _0x1fc263;
  return normalizeText(_0xc17bb4?.['source'])['toLowerCase']() === 'upload'
    ? ''
    : normalizeText(_0x442c7f?.['replacementImageRef'] || _0x442c7f?.['keyframeRef']);
}
function buildVideoStageFrameStyle(_0xf971f7 = {}) {
  const _0x30e740 = Math['max'](0x1, Number(_0xf971f7?.['frame']?.['width']) || 0x10),
    _0x225b87 = Math['max'](0x1, Number(_0xf971f7?.['frame']?.['height']) || 0x9);
  return (
    '--frame-aspect:' +
    _0x30e740 +
    '\x20/\x20' +
    _0x225b87 +
    ';' +
    ('--frame-width:' + _0x30e740 + ';--frame-height:' + _0x225b87)
  );
}
export function syncPersonReplacementVideoStageFrame(_0x482cf2) {
  const _0x5c93b1 = Math['max'](0x0, Number(_0x482cf2?.['videoWidth']) || 0x0),
    _0x389a1b = Math['max'](0x0, Number(_0x482cf2?.['videoHeight']) || 0x0),
    _0x468c59 = _0x482cf2?.['closest']?.('[data-person-replacement-video-playback-stage]');
  if (!(_0x5c93b1 > 0x0 && _0x389a1b > 0x0) || !_0x468c59?.['style']) return ![];
  return (
    _0x468c59['style']['setProperty']('--frame-aspect', _0x5c93b1 + ' / ' + _0x389a1b),
    _0x468c59['style']['setProperty']('--frame-width', String(_0x5c93b1)),
    _0x468c59['style']['setProperty']('--frame-height', String(_0x389a1b)),
    !![]
  );
}
function normalizeProgress(_0x30ecc1) {
  const _0x16f31b = Number(_0x30ecc1);
  if (!Number['isFinite'](_0x16f31b)) return 0x0;
  return Math['max'](0x0, Math['min'](0x64, _0x16f31b));
}
function resolveSelectedShot(_0x5bfa09 = {}, _0x490339 = '') {
  const _0x4085e0 = Array['isArray'](_0x5bfa09?.['shots']) ? _0x5bfa09['shots'] : [],
    _0x46ffb0 = normalizeText(_0x490339 || _0x5bfa09?.['workspace']?.['selectedShotId']);
  return (
    _0x4085e0['find']((_0x5684e5) => normalizeText(_0x5684e5?.['id']) === _0x46ffb0) || _0x4085e0[0x0] || null
  );
}
function buildPreparationPresentation(_0x31f8be, _0xbb58b1, _0x100ce2, _0x2f370e) {
  const _0x271807 = _0x31f8be?.['workspace']?.['videoPreparation'],
    _0x5bd409 = _0x271807 && typeof _0x271807 === 'object' && !Array['isArray'](_0x271807) ? _0x271807 : {},
    _0x1ce78e = normalizeText(_0x5bd409['status'])['toLowerCase']() || 'idle',
    _0x4ea105 = normalizeText(_0xbb58b1?.['materializationStatus'])['toLowerCase']() || 'idle',
    _0x22bbeb =
      !_0x2f370e &&
      Boolean(_0x100ce2?.['pending'] === !![] || _0x4ea105 === 'running' || _0x1ce78e === 'running'),
    _0xb2ae9f =
      !_0x2f370e &&
      Boolean(_0x4ea105 === 'failed' || (_0x1ce78e === 'failed' && normalizeText(_0x5bd409['error']))),
    _0x501380 =
      _0x4ea105 === 'running'
        ? normalizeProgress(_0xbb58b1?.['materializationProgress'])
        : normalizeProgress(_0x5bd409['progress']);
  return {
    status: _0x1ce78e,
    progress: _0x501380,
    error: normalizeText(_0xbb58b1?.['error'] || _0x5bd409['error']),
    materializationStatus: _0x4ea105,
    isRunning: _0x1ce78e === 'running' || _0x4ea105 === 'running',
    sourcePending: _0x22bbeb,
    sourceFailed: _0xb2ae9f,
  };
}
function buildGenerationEligibility({
  shot: _0x97cfb6,
  generation: _0x279f70,
  preparation: _0x174246,
  sourceReady: _0x579d94,
  imageInput: _0x14ffaf,
}) {
  if (!_0x97cfb6)
    return { canGenerate: ![], reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['MISSING_SHOT'] };
  if (_0x279f70['isActive'])
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['GENERATION_RUNNING'],
    };
  if (_0x174246['sourcePending'])
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['SOURCE_PREPARING'],
    };
  if (_0x174246['sourceFailed'])
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['SOURCE_PREPARATION_FAILED'],
    };
  if (!_0x579d94)
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['MISSING_SOURCE_VIDEO'],
    };
  if (_0x14ffaf['status'] !== 'ready')
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['MISSING_IMAGE_INPUT'],
    };
  return { canGenerate: !![], reason: '' };
}
function buildOutputPresentation(_0x18e73a, _0xf85f9) {
  const _0x549548 =
      _0x18e73a?.['output'] &&
      typeof _0x18e73a['output'] === 'object' &&
      !Array['isArray'](_0x18e73a['output'])
        ? _0x18e73a['output']
        : {},
    _0xb6562a = normalizeText(_0x549548['composeStatus'])['toLowerCase']() || 'idle',
    _0x311718 = normalizeText(_0x549548['originalMasterRef']),
    _0x5733dc = normalizeText(_0x549548['visualMasterRef']),
    _0xd25bec = normalizeText(_0x549548['finalVideoRef']),
    _0x48ad3f = normalizeText(_0x549548['finalAudioTrack']),
    _0x1c1b91 = Array['isArray'](_0x549548['composedShotIds'])
      ? _0x549548['composedShotIds']['map'](normalizeText)['filter'](Boolean)
      : [],
    _0x4a10a4 = _0xd25bec || _0x5733dc;
  return {
    composeStatus: _0xb6562a,
    originalMasterRef: _0x311718,
    visualMasterRef: _0x5733dc,
    finalVideoRef: _0xd25bec,
    finalAudioTrack: _0x48ad3f,
    composedShotIds: _0x1c1b91,
    previewVideoRef: _0x4a10a4,
    compositionAvailable: Boolean(_0xb6562a === 'succeeded' && _0x311718 && _0x4a10a4),
    finalVideoAvailable: Boolean(_0xd25bec),
    selectedShotComposed: Boolean(_0xf85f9 && _0x1c1b91['includes'](_0xf85f9)),
  };
}
export function buildPersonReplacementVideoPresentation(_0xa06d2a = {}, { shotId: _0x554930 = '' } = {}) {
  const _0x367fc1 = resolveSelectedShot(_0xa06d2a, _0x554930),
    _0x106f1d = normalizeText(_0x367fc1?.['id']),
    _0x3e9f5b = resolvePersonReplacementVideoImageInput(_0xa06d2a, _0x367fc1),
    _0x2494fc = resolvePersonReplacementVideoSlotState(_0xa06d2a, _0x367fc1),
    _0x4803cc = resolvePersonReplacementVideoGenerationState(_0xa06d2a?.['workspace'], _0x106f1d),
    _0x568144 = { ..._0x4803cc, isActive: isPersonReplacementVideoGenerationActive(_0x4803cc) },
    _0x17dff6 = getPersonReplacementVideoResults(_0x367fc1),
    _0x5772ff = getPersonReplacementActiveVideoResultIndex(_0x367fc1, _0x17dff6),
    _0x24bdde = _0x17dff6[_0x5772ff] || null,
    _0xac3007 = resolvePersonReplacementVideoResultRef(_0x24bdde),
    _0x44df33 = _0x2494fc['inputsBySlot']?.['sourceVideo'] || null,
    _0x2bc622 = Boolean(_0x2494fc['slotEntries']?.['sourceVideo']?.['url']),
    _0x4282b5 = buildPreparationPresentation(_0xa06d2a, _0x367fc1, _0x44df33, _0x2bc622),
    _0xef4407 = {
      sourceRef: normalizeText(_0x2bc622 ? _0x44df33?.['url'] : ''),
      sourceInputRef: normalizeText(_0x44df33?.['url']),
      sourcePosterRef: normalizeText(_0x44df33?.['thumbUrl']),
      sourceReady: _0x2bc622,
      sourcePending: _0x4282b5['sourcePending'],
      resultRef: _0xac3007 || normalizeText(_0x367fc1?.['resultVideoRef']),
      resultPosterRef: resolveVideoResultPosterRef(_0x24bdde, _0x367fc1),
    };
  return {
    shot: _0x367fc1,
    shotId: _0x106f1d,
    imageInput: _0x3e9f5b,
    slotState: _0x2494fc,
    generation: _0x568144,
    preparation: _0x4282b5,
    history: {
      results: _0x17dff6,
      activeIndex: _0x5772ff,
      activeResult: _0x24bdde,
      activeResultRef: _0xac3007,
      count: _0x17dff6['length'],
      hasMultipleResults: _0x17dff6['length'] > 0x1,
    },
    media: _0xef4407,
    eligibility: buildGenerationEligibility({
      shot: _0x367fc1,
      generation: _0x568144,
      preparation: _0x4282b5,
      sourceReady: _0x2bc622,
      imageInput: _0x3e9f5b,
    }),
    output: buildOutputPresentation(_0xa06d2a, _0x106f1d),
  };
}
function escapeHtml(_0x1a1393) {
  return String(_0x1a1393 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeMediaUrl(_0x50386f) {
  const _0x3ba1e3 = normalizeText(_0x50386f);
  return _0x3ba1e3 ? localPathToUrl(_0x3ba1e3) || _0x3ba1e3 : '';
}
function renderVideoInputModeControl(_0x196322) {
  const _0x540ba3 =
      _0x196322['settings']['replacementVideoInputMode'] !==
      PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
    _0x421604 = _0x540ba3
      ? PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE
      : PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
    _0x549cbc = _0x540ba3 ? '替换首帧' : '人物参考图',
    _0x590a55 = _0x540ba3
      ? '替换首帧：从左侧选择图像替换结果，作为生成视频的参考首帧。点击切换为人物参考图。'
      : '人物参考图：可从左侧选择任一已绑定的人物形象或图像替换结果，作为生成视频的参考图。点击切换为替换首帧。';
  return (
    '<div\x20class=\x22person-replacement-video-input-mode\x22\x20role=\x22group\x22\x20aria-label=\x22视频替换入参模式\x22>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x20person-replacement-toggle-button\x22\x20data-person-replacement-action=\x22set-video-input-mode\x22\x20data-person-replacement-video-input-mode=\x22' +
    _0x421604 +
    '\x22\x20aria-pressed=\x22' +
    _0x540ba3 +
    '\x22\x20data-tooltip=\x22' +
    _0x590a55 +
    '\x22>' +
    _0x549cbc +
    '</button>\x0a\x20\x20</div>'
  );
}
function renderVideoNodeCenterPlayIndicator() {
  return '<span class="video-center-indicator person-replacement-video-center-indicator" data-person-replacement-video-center-play aria-hidden="true"><span class="indicator-inner"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg></span></span>';
}
function renderVideoReplacementPlaybackControls(
  _0x181a25 = {},
  { role: role = 'source', context: context = 'video-replacement', disabled: disabled = ![] } = {},
) {
  const _0x1a5b2a = context === 'comparison',
    _0x30adf7 = role === 'result' ? 'result' : 'source',
    _0x5bb169 = _0x1a5b2a ? '原视频和替换视频' : _0x30adf7 === 'result' ? '替换结果' : '当前片段';
  return renderWorkspaceVideoPlaybackControls({
    label: _0x5bb169,
    disabled: disabled,
    className: _0x1a5b2a
      ? 'person-replacement-video-playback-controls person-replacement-compare-playback-controls'
      : 'person-replacement-video-playback-controls',
    controlsAttributes: _0x1a5b2a
      ? { 'data-person-replacement-compare-playback-controls': !![] }
      : {
          'data-person-replacement-video-controls': _0x30adf7,
          'data-person-replacement-video-label': _0x5bb169,
        },
    playAttributes: _0x1a5b2a
      ? {
          'data-person-replacement-compare-playback-control': !![],
          'data-person-replacement-action': 'toggle-comparison-playback',
          'aria-pressed': 'false',
        }
      : { 'data-person-replacement-video-play': !![] },
    currentTimeAttributes: {
      [_0x1a5b2a
        ? 'data-person-replacement-compare-current-time'
        : 'data-person-replacement-video-time-current']: !![],
    },
    progressAttributes: {
      [_0x1a5b2a ? 'data-person-replacement-compare-progress' : 'data-person-replacement-video-progress']:
        !![],
    },
    progressFillAttributes: {
      [_0x1a5b2a
        ? 'data-person-replacement-compare-progress-fill'
        : 'data-person-replacement-video-progress-fill']: !![],
    },
    totalTimeAttributes: {
      [_0x1a5b2a ? 'data-person-replacement-compare-total-time' : 'data-person-replacement-video-time-total']:
        !![],
    },
    volumeAttributes: {
      [_0x1a5b2a ? 'data-person-replacement-compare-volume' : 'data-person-replacement-video-volume']: !![],
    },
    volumeToggleAttributes: {
      [_0x1a5b2a
        ? 'data-person-replacement-compare-volume-toggle'
        : 'data-person-replacement-video-volume-toggle']: !![],
    },
    playLabel: '播放' + _0x5bb169,
    progressLabel: _0x1a5b2a ? '同步播放进度' : _0x5bb169 + '播放进度',
    volumeLabel: _0x5bb169 + '音量',
    volumeToggleLabel: '静音' + _0x5bb169,
    slots: {
      afterPlay:
        !_0x1a5b2a && _0x30adf7 === 'result'
          ? '<button type="button" class="person-replacement-video-sync-toggle" data-person-replacement-action="toggle-video-replacement-sync-playback" data-person-replacement-video-sync-play data-tooltip="同步播放" aria-label="开启同步播放" aria-pressed="false">\n      <svg class="person-replacement-video-sync-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.15-1.15"></path></svg>\n    </button>'
          : '',
      beforeVolume:
        !_0x1a5b2a && _0x30adf7 === 'source'
          ? '<button type="button" class="video-snap-btn story-video-snap-btn story-video-clip-btn" data-person-replacement-action="trim-current-video" data-shot-id="' +
            escapeHtml(_0x181a25['id']) +
            '\x22\x20aria-label=\x22裁剪当前片段\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
            VIDEO_CLIP_ICON_SVG +
            '\n      </button>'
          : '',
    },
  });
}
function renderVideoReplacementPreview(_0x430cfa, _0x53af8c, _0x13b060) {
  const _0x2a8dd2 = _0x53af8c?.['shot'] || null,
    _0x47a661 = _0x53af8c?.['media'] || {},
    _0x3c7977 = Math['max'](0x0, _0x430cfa['shots']['indexOf'](_0x2a8dd2)),
    _0x148e12 = _0x2a8dd2?.['title'] || '片段' + String(_0x3c7977 + 0x1)['padStart'](0x2, '0'),
    _0x13960b = _0x430cfa['shots']['length'] > 0x1,
    _0x331c93 = _0x13960b
      ? '' +
        renderPersonReplacementPreviewArrow('previous', {
          action: 'previous-shot',
          label: '上一个片段',
          className:
            'person-replacement-shot-navigation-arrow ' + 'person-replacement-video-shot-navigation-arrow',
        }) +
        renderPersonReplacementPreviewArrow('next', {
          action: 'next-shot',
          label: '下一个片段',
          className:
            'person-replacement-shot-navigation-arrow ' + 'person-replacement-video-shot-navigation-arrow',
        })
      : '',
    _0x32400f = _0x13960b
      ? ' data-person-replacement-shot-wheel="true" aria-label="滚动鼠标滚轮切换原视频片段"'
      : '';
  if (!_0x47a661['sourceReady'])
    return (
      '<div class="person-replacement-video-preview-panel person-replacement-middle-preview-slide" aria-label="' +
      escapeHtml(_0x148e12 + '原视频片段') +
      '">\n      <div class="story-video-result person-replacement-video-preview"' +
      _0x32400f +
      '><div class="person-replacement-inline-empty">' +
      escapeHtml(_0x13b060) +
      '</div>' +
      _0x331c93 +
      '</div>\n    </div>'
    );
  const _0xfc210c = normalizeMediaUrl(_0x47a661['sourceRef']),
    _0x5bafee = normalizeMediaUrl(_0x47a661['sourcePosterRef']),
    _0x2e0654 = buildVideoStageFrameStyle(_0x2a8dd2);
  return (
    '<div class="person-replacement-video-preview-panel person-replacement-middle-preview-slide" aria-label="' +
    escapeHtml(_0x148e12 + '原视频片段') +
    '">\n    <div class="story-video-result person-replacement-video-preview"' +
    _0x32400f +
    '>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-video-stage\x20person-replacement-video-stage\x22\x20data-person-replacement-video-stage\x20data-person-replacement-video-playback-stage=\x22source\x22\x20data-person-replacement-video-url=\x22' +
    escapeHtml(_0xfc210c) +
    '" data-person-replacement-video-poster="' +
    escapeHtml(_0x5bafee) +
    '" data-person-replacement-video-reversed="' +
    (_0x2a8dd2['materializedIsReversed'] === !![]) +
    '\x22\x20data-person-replacement-video-center-stage\x20data-shot-id=\x22' +
    escapeHtml(_0x2a8dd2['id']) +
    '\x22\x20style=\x22' +
    _0x2e0654 +
    '">\n        <video data-person-replacement-video-player="source" data-person-replacement-video-center-player data-person-replacement-video-url="' +
    escapeHtml(_0xfc210c) +
    '" playsinline preload="metadata" ' +
    (_0x5bafee ? 'poster="' + escapeHtml(_0x5bafee) + '\x22' : '') +
    ' aria-label="' +
    escapeHtml(_0x148e12 + '原视频片段') +
    '"></video>\n        ' +
    renderVideoNodeCenterPlayIndicator() +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderVideoReplacementPlaybackControls(_0x2a8dd2, { role: 'source' }) +
    '\n      </div>\n      ' +
    _0x331c93 +
    '\n    </div>\n  </div>'
  );
}
function renderVideoReplacementResult(_0x4cea2, { isGenerating: isGenerating = ![] } = {}) {
  const _0x4e582d = _0x4cea2?.['shot'] || null,
    _0x1eb4b1 = _0x4cea2?.['history'] || {},
    _0x485525 = _0x4cea2?.['media'] || {},
    _0x1d067d = Number(_0x1eb4b1['activeIndex']) || 0x0,
    _0x18e5f2 = normalizeText(_0x485525['resultRef']),
    _0x2d4451 = _0x1eb4b1['hasMultipleResults'] === !![],
    _0xe92d57 = _0x2d4451
      ? '' +
        renderPersonReplacementPreviewArrow('previous', {
          action: 'previous-replacement-video-result',
          label: '上一个生成版本',
          className: 'person-replacement-video-result-arrow',
        }) +
        renderPersonReplacementPreviewArrow('next', {
          action: 'next-replacement-video-result',
          label: '下一个生成版本',
          className: 'person-replacement-video-result-arrow',
        })
      : '',
    _0x159f9d = _0x2d4451
      ? ' data-person-replacement-video-result-wheel="true" aria-label="滚动鼠标滚轮切换生成版本"'
      : '',
    _0x31eb8b = isGenerating
      ? renderWorkspaceAssetLoadingOverlay({
          title: _0x4cea2?.['generation']?.['status'] === 'queued' ? '视频排队中' : '视频生成中',
          description:
            _0x4cea2?.['generation']?.['status'] === 'queued'
              ? 'RunningHub 并发已占满，释放名额后会自动开始。'
              : '正在等待生成结果，完成后会自动显示。',
        })
      : '',
    _0x687251 = normalizeMediaUrl(_0x18e5f2),
    _0x1d987b = normalizeMediaUrl(_0x485525['resultPosterRef']),
    _0x23ae5c = Math['max'](Number(_0x1eb4b1['count']) || 0x0, _0x18e5f2 ? 0x1 : 0x0),
    _0x1d3bf7 = buildVideoStageFrameStyle(_0x4e582d),
    _0x245a93 = _0x18e5f2
      ? '<div\x20class=\x22story-video-stage\x20person-replacement-video-stage\x20person-replacement-video-result-stage\x22\x20data-person-replacement-video-playback-stage=\x22result\x22\x20data-person-replacement-video-url=\x22' +
        escapeHtml(_0x687251) +
        '" data-person-replacement-video-poster="' +
        escapeHtml(_0x1d987b) +
        '" data-person-replacement-video-center-stage data-shot-id="' +
        escapeHtml(_0x4e582d?.['id'] || '') +
        '" style="' +
        _0x1d3bf7 +
        '">\n        <video data-person-replacement-video-player="result" data-person-replacement-video-center-player data-person-replacement-video-url="' +
        escapeHtml(_0x687251) +
        '" playsinline preload="metadata"' +
        (_0x1d987b ? ' poster="' + escapeHtml(_0x1d987b) + '\x22' : '') +
        ' aria-label="替换视频生成版本 ' +
        (_0x1d067d + 0x1) +
        '/' +
        _0x23ae5c +
        '"></video>\n        ' +
        (isGenerating ? '' : renderVideoNodeCenterPlayIndicator()) +
        '\n        ' +
        (isGenerating ? '' : renderVideoReplacementPlaybackControls(_0x4e582d, { role: 'result' })) +
        '\n      </div>'
      : '<span>生成视频显示在这里</span>',
    _0x5a8da9 =
      '<div class="story-asset-preview-actions person-replacement-result-actions">\n    ' +
      renderWorkspaceVideoDownloadButton({
        enabled: Boolean(_0x18e5f2),
        className: 'person-replacement-result-download',
      }) +
      '\n    <button type="button" class="story-upload-replace story-character-voice-upload-button person-replacement-result-upload" data-story-action="upload-replacement-video" aria-label="上传替换视频" title="上传替换视频" ' +
      (!_0x4e582d || isGenerating ? 'disabled' : '') +
      '>' +
      renderWorkspaceUploadIcon() +
      '</button>\x0a\x20\x20</div>';
  return (
    '<div\x20class=\x22person-replacement-generation-preview\x20person-replacement-video-result' +
    (isGenerating ? '\x20img-preview-loading' : '') +
    '" aria-busy="' +
    isGenerating +
    '\x22' +
    _0x159f9d +
    '><div class="person-replacement-video-result-slide">' +
    _0x245a93 +
    '</div>' +
    _0x5a8da9 +
    _0xe92d57 +
    _0x31eb8b +
    '</div>'
  );
}
function renderVideoReplacementGenerateButton(
  _0x1394bc,
  {
    presentation: presentation = {},
    shotBatchGenerationActive: shotBatchGenerationActive = ![],
    shotBatchGeneratingShotIds: shotBatchGeneratingShotIds = [],
    shotBatchCancelRequested: shotBatchCancelRequested = ![],
  } = {},
) {
  const _0x2d2ffb = presentation['shot'] || null,
    _0x1ef6ad = _0x1394bc['workspace']['shotSelectionMode'] === !![],
    _0x359348 = Array['isArray'](_0x1394bc['workspace']['selectedShotIds'])
      ? _0x1394bc['workspace']['selectedShotIds']['length']
      : 0x0,
    _0x3ea1bb = Boolean(
      _0x2d2ffb?.['id'] &&
      ((presentation['generation']?.['isActive'] &&
        normalizeText(presentation['generation']['shotId']) === normalizeText(_0x2d2ffb['id'])) ||
        (Array['isArray'](shotBatchGeneratingShotIds) &&
          shotBatchGeneratingShotIds['includes'](_0x2d2ffb['id']))),
    ),
    _0x1c4892 = Boolean(
      !_0x1ef6ad &&
      presentation['generation']?.['isActive'] &&
      normalizeText(presentation['generation']['shotId']) === normalizeText(_0x2d2ffb?.['id']),
    ),
    _0x55369e = _0x359348 ? '\x20(' + _0x359348 + ')' : '',
    _0x7e205c = _0x1ef6ad
      ? shotBatchGenerationActive
        ? shotBatchCancelRequested
          ? '正在停止' + _0x55369e
          : '取消运行' + _0x55369e
        : '批量生成视频' + _0x55369e
      : _0x1c4892
        ? '取消运行'
        : _0x3ea1bb
          ? '生成中'
          : '生成视频',
    _0xe2ed38 = _0x1ef6ad
      ? !_0x359348 || shotBatchCancelRequested
      : !_0x1c4892 && (!presentation['eligibility']?.['canGenerate'] || _0x3ea1bb);
  return (
    '<button\x20type=\x22button\x22\x20class=\x22story-asset-generate-button\x22\x20aria-busy=\x22' +
    shotBatchGenerationActive +
    '" data-person-replacement-action="generate-replacement-video" ' +
    (_0xe2ed38 ? 'disabled' : '') +
    '>' +
    escapeHtml(_0x7e205c) +
    '</button>'
  );
}
function renderVideoReplacementPage(
  _0x97a3b7,
  _0x56542c,
  {
    buildIdentityView: _0x2438e8,
    renderShotTimeline: _0x31f8fb,
    renderLayoutSplitter: _0x135c6f,
    renderFooter: _0x50e5e9,
  },
) {
  const _0x2d19cb = buildPersonReplacementVideoPresentation(_0x97a3b7),
    _0x8588eb = _0x2438e8(_0x97a3b7, _0x2d19cb),
    _0x10e2d7 = _0x2d19cb['shot'],
    _0x384bd3 = _0x2d19cb['generation'],
    _0x13d046 = _0x2d19cb['preparation'],
    _0x17e6e6 = _0x2d19cb['imageInput'],
    _0x41e2e =
      _0x384bd3['isActive'] ||
      Boolean(
        Array['isArray'](_0x56542c['shotBatchGeneratingShotIds']) &&
        _0x56542c['shotBatchGeneratingShotIds']['includes'](_0x10e2d7?.['id']),
      ),
    _0x1f3776 =
      _0x13d046['materializationStatus'] === 'running'
        ? '正在切片并统一为 ' + (_0x10e2d7['outputFps'] || 0x18) + ' FPS…'
        : _0x13d046['materializationStatus'] === 'failed'
          ? _0x13d046['error'] || '镜头切片失败'
          : _0x13d046['status'] === 'running'
            ? '正在准备视频片段 ' + Math['round'](_0x13d046['progress']) + '%'
            : '进入视频替换时生成固定帧率片段',
    _0x58a728 = _0x97a3b7['settings']['replacementModelId'] || PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
    _0x471e51 = resolveModelProvider(_0x58a728),
    _0x15f823 = getModelManifest(_0x58a728)?.['prompt'],
    _0x54f897 =
      _0x10e2d7?.['videoPrompt'] ||
      (_0x15f823?.['emptyPolicy'] === 'allow' ? '' : PERSON_REPLACEMENT_DEFAULT_VIDEO_PROMPT),
    _0x27aca1 = normalizeText(_0x15f823?.['placeholder']) || '描述视频人物替换效果',
    _0x2fd89a = _0x27aca1 + '；输入\x20/\x20选择预设',
    _0x22566f = resolvePersonReplacementVideoParameterPolicy({
      modelId: _0x58a728,
      inputMode: _0x97a3b7['settings']['replacementVideoInputMode'],
      generationParams: _0x97a3b7['settings']['replacementVideoGenerationParams'],
    }),
    _0x24efa7 = {
      ..._0x22566f['generationParams'],
      rhVideoFps: resolvePersonReplacementVideoGenerationFps(_0x97a3b7['settings']),
    },
    _0x438b6e =
      _0x17e6e6['referenceKind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE
        ? '人物参考图'
        : '替换首帧',
    _0x19da27 = normalizePersonReplacementLayout(_0x97a3b7['workspace']['replacementLayout']),
    _0x4fb674 =
      '--person-replacement-left-width:' +
      _0x19da27['left'] +
      '%;' +
      ('--person-replacement-right-width:' + _0x19da27['right'] + '%;') +
      ('--person-replacement-center-top:' + _0x19da27['centerTop'] + '%;');
  return (
    '<div\x20class=\x22person-replacement-production-page\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-four-panel-layout\x22\x20data-person-replacement-layout\x20style=\x22' +
    _0x4fb674 +
    '">\n      ' +
    _0x8588eb['referenceRailHtml'] +
    '\n      ' +
    _0x135c6f('left', _0x19da27) +
    '\n      <section class="person-replacement-keyframe-panel person-replacement-middle-layout person-replacement-video-middle-layout">' +
    renderVideoReplacementPreview(_0x97a3b7, _0x2d19cb, _0x1f3776) +
    _0x135c6f('center', _0x19da27) +
    _0x31f8fb(_0x97a3b7, {
      timelineMode: 'video',
      shotBatchGenerationActive: _0x56542c['shotBatchGenerationActive'],
      shotBatchGenerationLabel: _0x56542c['shotBatchGenerationLabel'],
      shotBatchGeneratingShotIds: _0x56542c['shotBatchGeneratingShotIds'],
      shotBatchCancelRequested: _0x56542c['shotBatchCancelRequested'],
    }) +
    '</section>\n      ' +
    _0x135c6f('right', _0x19da27) +
    '\n      <aside class="person-replacement-generation-panel person-replacement-video-generation-panel">\n        ' +
    renderVideoReplacementResult(_0x2d19cb, { isGenerating: _0x41e2e }) +
    '\n        ' +
    _0x135c6f('center', _0x19da27, { label: '调整结果预览与提示词区域高度' }) +
    '\n        <div class="story-asset-detail-copy person-replacement-generation-copy">\n          <div class="story-asset-prompt-field person-replacement-prompt-field">\n            <div class="person-replacement-prompt-field-heading" role="group" aria-label="模型入参"><div class="person-replacement-video-prompt-heading-actions"><div class="person-replacement-prompt-reference-inputs" data-person-replacement-video-reference-inputs>' +
    _0x8588eb['referenceInputsHtml'] +
    '</div>' +
    renderVideoInputModeControl(_0x97a3b7) +
    '</div></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22prompt-input-wrapper\x20is-resizable\x20person-replacement-prompt-input-wrapper\x22><div\x20class=\x22prompt-textarea\x20custom-textarea\x20story-asset-prompt-editor\x20person-replacement-prompt-editor\x22\x20contenteditable=\x22true\x22\x20role=\x22textbox\x22\x20aria-multiline=\x22true\x22\x20aria-label=\x22视频替换提示词\x22\x20spellcheck=\x22false\x22\x20data-placeholder=\x22' +
    escapeHtml(_0x2fd89a) +
    '" data-person-replacement-field="video-prompt" data-shot-id="' +
    escapeHtml(_0x10e2d7?.['id'] || '') +
    '\x22>' +
    renderPersonReplacementPromptHtml(_0x54f897) +
    '</div></div>\n          </div>\n          ' +
    (_0x17e6e6['status'] === 'ready'
      ? ''
      : '<p\x20class=\x22person-replacement-reference-note\x22>' +
        escapeHtml(_0x438b6e + '：' + _0x17e6e6['message']) +
        '</p>') +
    '\n          <div class="story-asset-generation-bar prompt-panel-footer">' +
    renderAIGenVideoModelSelectorMarkup({
      modelId: _0x58a728,
      provider: _0x471e51,
      generationParams: _0x24efa7,
      uiSchemaFieldState: _0x22566f['uiSchemaFieldState'],
      providerProfileId: _0x97a3b7['settings']['replacementVideoProviderProfileId'],
      providerProfileIdByModel: _0x97a3b7['settings']['replacementVideoProviderProfileIdByModel'],
      referenceCounts: _0x2d19cb['slotState']['referenceCounts'],
      showSchemaControls: !![],
      allowedModelIds: PERSON_REPLACEMENT_VIDEO_MODEL_IDS,
      className: 'person-replacement-video-model-selector',
    }) +
    renderRequestDebugButton('data-story-action="debug-generation-video"') +
    renderVideoReplacementGenerateButton(_0x97a3b7, { presentation: _0x2d19cb, ..._0x56542c }) +
    '</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    (_0x384bd3['error']
      ? '<p class="person-replacement-error">' + escapeHtml(_0x384bd3['error']) + '</p>'
      : '') +
    '\n        </div>\n      </aside>\n    </div>' +
    _0x50e5e9(_0x97a3b7, { nextLabel: '进入声音克隆' }) +
    '\n  </div>'
  );
}
function cloneFrozenPresentationValue(_0x73bebe) {
  if (Array['isArray'](_0x73bebe)) return Object['freeze'](_0x73bebe['map'](cloneFrozenPresentationValue));
  if (!_0x73bebe || typeof _0x73bebe !== 'object') return _0x73bebe;
  return Object['freeze'](
    Object['fromEntries'](
      Object['entries'](_0x73bebe)['map'](([_0x19af26, _0x3206bb]) => [
        _0x19af26,
        cloneFrozenPresentationValue(_0x3206bb),
      ]),
    ),
  );
}
function buildReadonlyVideoPresentation(_0x103ac9, _0x5a9326) {
  const _0x39eee3 = buildPersonReplacementVideoPresentation(_0x103ac9, _0x5a9326);
  return Object['freeze']({
    shot: _0x39eee3['shot'] ? cloneFrozenPresentationValue(_0x39eee3['shot']) : null,
    shotId: _0x39eee3['shotId'],
    imageInput: cloneFrozenPresentationValue(_0x39eee3['imageInput']),
    slotState: cloneFrozenPresentationValue(_0x39eee3['slotState']),
    generation: cloneFrozenPresentationValue(_0x39eee3['generation']),
    preparation: cloneFrozenPresentationValue(_0x39eee3['preparation']),
    history: cloneFrozenPresentationValue(_0x39eee3['history']),
    media: cloneFrozenPresentationValue(_0x39eee3['media']),
    eligibility: cloneFrozenPresentationValue(_0x39eee3['eligibility']),
    output: cloneFrozenPresentationValue(_0x39eee3['output']),
  });
}
export function createPersonReplacementVideoPresentation({
  buildIdentityView: buildIdentityView = () => ({ referenceInputsHtml: '', referenceRailHtml: '' }),
  renderShotTimeline: renderShotTimeline = () => '',
  renderLayoutSplitter: renderLayoutSplitter = () => '',
  renderFooter: renderFooter = () => '',
} = {}) {
  const _0x309ec7 = Object['freeze']({
    buildIdentityView: buildIdentityView,
    renderShotTimeline: renderShotTimeline,
    renderLayoutSplitter: renderLayoutSplitter,
    renderFooter: renderFooter,
  });
  return Object['freeze']({
    build: buildReadonlyVideoPresentation,
    render: (_0x576c6c, _0x1e0e18 = {}) => renderVideoReplacementPage(_0x576c6c, _0x1e0e18, _0x309ec7),
    renderGenerateButton: renderVideoReplacementGenerateButton,
    renderPlaybackControls: renderVideoReplacementPlaybackControls,
  });
}
