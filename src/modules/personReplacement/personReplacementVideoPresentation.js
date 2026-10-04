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
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function resolveVideoResultPosterRef(item, key) {
  const text = normalizeText(
    item?.['posterLocalPath'] ||
      item?.['thumbLocalPath'] ||
      item?.['posterUrl'] ||
      item?.['thumbUrl'] ||
      item?.['thumbnailLocalPath'] ||
      item?.['thumbnailUrl'] ||
      item?.['coverUrl'],
  );
  if (text) return text;
  return normalizeText(item?.['source'])['toLowerCase']() === 'upload'
    ? ''
    : normalizeText(key?.['replacementImageRef'] || key?.['keyframeRef']);
}
function buildVideoStageFrameStyle(options = {}) {
  const index = Math['max'](0x1, Number(options?.['frame']?.['width']) || 0x10),
    result = Math['max'](0x1, Number(options?.['frame']?.['height']) || 0x9);
  return (
    '--frame-aspect:' +
    index +
    '\x20/\x20' +
    result +
    ';' +
    ('--frame-width:' + index + ';--frame-height:' + result)
  );
}
export function syncPersonReplacementVideoStageFrame(el) {
  const count = Math['max'](0x0, Number(el?.['videoWidth']) || 0x0),
    count2 = Math['max'](0x0, Number(el?.['videoHeight']) || 0x0),
    el2 = el?.['closest']?.('[data-person-replacement-video-playback-stage]');
  if (!(count > 0x0 && count2 > 0x0) || !el2?.['style']) return ![];
  return (
    el2['style']['setProperty']('--frame-aspect', count + ' / ' + count2),
    el2['style']['setProperty']('--frame-width', String(count)),
    el2['style']['setProperty']('--frame-height', String(count2)),
    !![]
  );
}
function normalizeProgress(data) {
  const target = Number(data);
  if (!Number['isFinite'](target)) return 0x0;
  return Math['max'](0x0, Math['min'](0x64, target));
}
function resolveSelectedShot(options2 = {}, source = '') {
  const list = Array['isArray'](options2?.['shots']) ? options2['shots'] : [],
    text2 = normalizeText(source || options2?.['workspace']?.['selectedShotId']);
  return list['find']((next) => normalizeText(next?.['id']) === text2) || list[0x0] || null;
}
function buildPreparationPresentation(current, entry, record, enabled) {
  const payload = current?.['workspace']?.['videoPreparation'],
    response = payload && typeof payload === 'object' && !Array['isArray'](payload) ? payload : {},
    status = normalizeText(response['status'])['toLowerCase']() || 'idle',
    materializationStatus = normalizeText(entry?.['materializationStatus'])['toLowerCase']() || 'idle',
    sourcePending =
      !enabled &&
      Boolean(record?.['pending'] === !![] || materializationStatus === 'running' || status === 'running'),
    sourceFailed =
      !enabled &&
      Boolean(
        materializationStatus === 'failed' || (status === 'failed' && normalizeText(response['error'])),
      ),
    progress =
      materializationStatus === 'running'
        ? normalizeProgress(entry?.['materializationProgress'])
        : normalizeProgress(response['progress']);
  return {
    status: status,
    progress: progress,
    error: normalizeText(entry?.['error'] || response['error']),
    materializationStatus: materializationStatus,
    isRunning: status === 'running' || materializationStatus === 'running',
    sourcePending: sourcePending,
    sourceFailed: sourceFailed,
  };
}
function buildGenerationEligibility({
  shot: shot,
  generation: generation,
  preparation: preparation,
  sourceReady: sourceReady,
  imageInput: imageInput,
}) {
  if (!shot)
    return { canGenerate: ![], reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['MISSING_SHOT'] };
  if (generation['isActive'])
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['GENERATION_RUNNING'],
    };
  if (preparation['sourcePending'])
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['SOURCE_PREPARING'],
    };
  if (preparation['sourceFailed'])
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['SOURCE_PREPARATION_FAILED'],
    };
  if (!sourceReady)
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['MISSING_SOURCE_VIDEO'],
    };
  if (imageInput['status'] !== 'ready')
    return {
      canGenerate: ![],
      reason: PERSON_REPLACEMENT_VIDEO_GENERATION_BLOCK_REASONS['MISSING_IMAGE_INPUT'],
    };
  return { canGenerate: !![], reason: '' };
}
function buildOutputPresentation(handle, state) {
  const config =
      handle?.['output'] && typeof handle['output'] === 'object' && !Array['isArray'](handle['output'])
        ? handle['output']
        : {},
    composeStatus = normalizeText(config['composeStatus'])['toLowerCase']() || 'idle',
    originalMasterRef = normalizeText(config['originalMasterRef']),
    visualMasterRef = normalizeText(config['visualMasterRef']),
    finalVideoRef = normalizeText(config['finalVideoRef']),
    finalAudioTrack = normalizeText(config['finalAudioTrack']),
    composedShotIds = Array['isArray'](config['composedShotIds'])
      ? config['composedShotIds']['map'](normalizeText)['filter'](Boolean)
      : [],
    previewVideoRef = finalVideoRef || visualMasterRef;
  return {
    composeStatus: composeStatus,
    originalMasterRef: originalMasterRef,
    visualMasterRef: visualMasterRef,
    finalVideoRef: finalVideoRef,
    finalAudioTrack: finalAudioTrack,
    composedShotIds: composedShotIds,
    previewVideoRef: previewVideoRef,
    compositionAvailable: Boolean(composeStatus === 'succeeded' && originalMasterRef && previewVideoRef),
    finalVideoAvailable: Boolean(finalVideoRef),
    selectedShotComposed: Boolean(state && composedShotIds['includes'](state)),
  };
}
export function buildPersonReplacementVideoPresentation(options3 = {}, { shotId: shotId = '' } = {}) {
  const shot2 = resolveSelectedShot(options3, shotId),
    shotId2 = normalizeText(shot2?.['id']),
    imageInput2 = resolvePersonReplacementVideoImageInput(options3, shot2),
    slotState = resolvePersonReplacementVideoSlotState(options3, shot2),
    args = resolvePersonReplacementVideoGenerationState(options3?.['workspace'], shotId2),
    generation2 = { ...args, isActive: isPersonReplacementVideoGenerationActive(args) },
    results = getPersonReplacementVideoResults(shot2),
    activeIndex = getPersonReplacementActiveVideoResultIndex(shot2, results),
    activeResult = results[activeIndex] || null,
    resultRef = resolvePersonReplacementVideoResultRef(activeResult),
    response2 = slotState['inputsBySlot']?.['sourceVideo'] || null,
    sourceReady2 = Boolean(slotState['slotEntries']?.['sourceVideo']?.['url']),
    sourcePending2 = buildPreparationPresentation(options3, shot2, response2, sourceReady2),
    media = {
      sourceRef: normalizeText(sourceReady2 ? response2?.['url'] : ''),
      sourceInputRef: normalizeText(response2?.['url']),
      sourcePosterRef: normalizeText(response2?.['thumbUrl']),
      sourceReady: sourceReady2,
      sourcePending: sourcePending2['sourcePending'],
      resultRef: resultRef || normalizeText(shot2?.['resultVideoRef']),
      resultPosterRef: resolveVideoResultPosterRef(activeResult, shot2),
    };
  return {
    shot: shot2,
    shotId: shotId2,
    imageInput: imageInput2,
    slotState: slotState,
    generation: generation2,
    preparation: sourcePending2,
    history: {
      results: results,
      activeIndex: activeIndex,
      activeResult: activeResult,
      activeResultRef: resultRef,
      count: results['length'],
      hasMultipleResults: results['length'] > 0x1,
    },
    media: media,
    eligibility: buildGenerationEligibility({
      shot: shot2,
      generation: generation2,
      preparation: sourcePending2,
      sourceReady: sourceReady2,
      imageInput: imageInput2,
    }),
    output: buildOutputPresentation(options3, shotId2),
  };
}
function escapeHtml(scope) {
  return String(scope ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeMediaUrl(input) {
  const text3 = normalizeText(input);
  return text3 ? localPathToUrl(text3) || text3 : '';
}
function renderVideoInputModeControl(output) {
  const value2 =
      output['settings']['replacementVideoInputMode'] !==
      PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
    value3 = value2
      ? PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE
      : PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
    value4 = value2 ? '替换首帧' : '人物参考图',
    value5 = value2
      ? '替换首帧：从左侧选择图像替换结果，作为生成视频的参考首帧。点击切换为人物参考图。'
      : '人物参考图：可从左侧选择任一已绑定的人物形象或图像替换结果，作为生成视频的参考图。点击切换为替换首帧。';
  return (
    '<div\x20class=\x22person-replacement-video-input-mode\x22\x20role=\x22group\x22\x20aria-label=\x22视频替换入参模式\x22>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x20person-replacement-toggle-button\x22\x20data-person-replacement-action=\x22set-video-input-mode\x22\x20data-person-replacement-video-input-mode=\x22' +
    value3 +
    '\x22\x20aria-pressed=\x22' +
    value2 +
    '\x22\x20data-tooltip=\x22' +
    value5 +
    '\x22>' +
    value4 +
    '</button>\x0a\x20\x20</div>'
  );
}
function renderVideoNodeCenterPlayIndicator() {
  return '<span class="video-center-indicator person-replacement-video-center-indicator" data-person-replacement-video-center-play aria-hidden="true"><span class="indicator-inner"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg></span></span>';
}
function renderVideoReplacementPlaybackControls(
  options4 = {},
  { role: role = 'source', context: context = 'video-replacement', disabled: disabled = ![] } = {},
) {
  const className = context === 'comparison',
    value6 = role === 'result' ? 'result' : 'source',
    label = className ? '原视频和替换视频' : value6 === 'result' ? '替换结果' : '当前片段';
  return renderWorkspaceVideoPlaybackControls({
    label: label,
    disabled: disabled,
    className: className
      ? 'person-replacement-video-playback-controls person-replacement-compare-playback-controls'
      : 'person-replacement-video-playback-controls',
    controlsAttributes: className
      ? { 'data-person-replacement-compare-playback-controls': !![] }
      : {
          'data-person-replacement-video-controls': value6,
          'data-person-replacement-video-label': label,
        },
    playAttributes: className
      ? {
          'data-person-replacement-compare-playback-control': !![],
          'data-person-replacement-action': 'toggle-comparison-playback',
          'aria-pressed': 'false',
        }
      : { 'data-person-replacement-video-play': !![] },
    currentTimeAttributes: {
      [className
        ? 'data-person-replacement-compare-current-time'
        : 'data-person-replacement-video-time-current']: !![],
    },
    progressAttributes: {
      [className ? 'data-person-replacement-compare-progress' : 'data-person-replacement-video-progress']:
        !![],
    },
    progressFillAttributes: {
      [className
        ? 'data-person-replacement-compare-progress-fill'
        : 'data-person-replacement-video-progress-fill']: !![],
    },
    totalTimeAttributes: {
      [className ? 'data-person-replacement-compare-total-time' : 'data-person-replacement-video-time-total']:
        !![],
    },
    volumeAttributes: {
      [className ? 'data-person-replacement-compare-volume' : 'data-person-replacement-video-volume']: !![],
    },
    volumeToggleAttributes: {
      [className
        ? 'data-person-replacement-compare-volume-toggle'
        : 'data-person-replacement-video-volume-toggle']: !![],
    },
    playLabel: '播放' + label,
    progressLabel: className ? '同步播放进度' : label + '播放进度',
    volumeLabel: label + '音量',
    volumeToggleLabel: '静音' + label,
    slots: {
      afterPlay:
        !className && value6 === 'result'
          ? '<button type="button" class="person-replacement-video-sync-toggle" data-person-replacement-action="toggle-video-replacement-sync-playback" data-person-replacement-video-sync-play data-tooltip="同步播放" aria-label="开启同步播放" aria-pressed="false">\n      <svg class="person-replacement-video-sync-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.15-1.15"></path></svg>\n    </button>'
          : '',
      beforeVolume:
        !className && value6 === 'source'
          ? '<button type="button" class="video-snap-btn story-video-snap-btn story-video-clip-btn" data-person-replacement-action="trim-current-video" data-shot-id="' +
            escapeHtml(options4['id']) +
            '\x22\x20aria-label=\x22裁剪当前片段\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
            VIDEO_CLIP_ICON_SVG +
            '\n      </button>'
          : '',
    },
  });
}
function renderVideoReplacementPreview(value7, value8, value9) {
  const value10 = value8?.['shot'] || null,
    enabled2 = value8?.['media'] || {},
    value11 = Math['max'](0x0, value7['shots']['indexOf'](value10)),
    value12 = value10?.['title'] || '片段' + String(value11 + 0x1)['padStart'](0x2, '0'),
    value13 = value7['shots']['length'] > 0x1,
    value14 = value13
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
    value15 = value13
      ? ' data-person-replacement-shot-wheel="true" aria-label="滚动鼠标滚轮切换原视频片段"'
      : '';
  if (!enabled2['sourceReady'])
    return (
      '<div class="person-replacement-video-preview-panel person-replacement-middle-preview-slide" aria-label="' +
      escapeHtml(value12 + '原视频片段') +
      '">\n      <div class="story-video-result person-replacement-video-preview"' +
      value15 +
      '><div class="person-replacement-inline-empty">' +
      escapeHtml(value9) +
      '</div>' +
      value14 +
      '</div>\n    </div>'
    );
  const mediaUrl = normalizeMediaUrl(enabled2['sourceRef']),
    mediaUrl2 = normalizeMediaUrl(enabled2['sourcePosterRef']),
    videoStageFrameStyle = buildVideoStageFrameStyle(value10);
  return (
    '<div class="person-replacement-video-preview-panel person-replacement-middle-preview-slide" aria-label="' +
    escapeHtml(value12 + '原视频片段') +
    '">\n    <div class="story-video-result person-replacement-video-preview"' +
    value15 +
    '>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-video-stage\x20person-replacement-video-stage\x22\x20data-person-replacement-video-stage\x20data-person-replacement-video-playback-stage=\x22source\x22\x20data-person-replacement-video-url=\x22' +
    escapeHtml(mediaUrl) +
    '" data-person-replacement-video-poster="' +
    escapeHtml(mediaUrl2) +
    '" data-person-replacement-video-reversed="' +
    (value10['materializedIsReversed'] === !![]) +
    '\x22\x20data-person-replacement-video-center-stage\x20data-shot-id=\x22' +
    escapeHtml(value10['id']) +
    '\x22\x20style=\x22' +
    videoStageFrameStyle +
    '">\n        <video data-person-replacement-video-player="source" data-person-replacement-video-center-player data-person-replacement-video-url="' +
    escapeHtml(mediaUrl) +
    '" playsinline preload="metadata" ' +
    (mediaUrl2 ? 'poster="' + escapeHtml(mediaUrl2) + '\x22' : '') +
    ' aria-label="' +
    escapeHtml(value12 + '原视频片段') +
    '"></video>\n        ' +
    renderVideoNodeCenterPlayIndicator() +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderVideoReplacementPlaybackControls(value10, { role: 'source' }) +
    '\n      </div>\n      ' +
    value14 +
    '\n    </div>\n  </div>'
  );
}
function renderVideoReplacementResult(title, { isGenerating: isGenerating = ![] } = {}) {
  const enabled3 = title?.['shot'] || null,
    value16 = title?.['history'] || {},
    value17 = title?.['media'] || {},
    value18 = Number(value16['activeIndex']) || 0x0,
    text4 = normalizeText(value17['resultRef']),
    value19 = value16['hasMultipleResults'] === !![],
    value20 = value19
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
    value21 = value19
      ? ' data-person-replacement-video-result-wheel="true" aria-label="滚动鼠标滚轮切换生成版本"'
      : '',
    value22 = isGenerating
      ? renderWorkspaceAssetLoadingOverlay({
          title: title?.['generation']?.['status'] === 'queued' ? '视频排队中' : '视频生成中',
          description:
            title?.['generation']?.['status'] === 'queued'
              ? 'RunningHub 并发已占满，释放名额后会自动开始。'
              : '正在等待生成结果，完成后会自动显示。',
        })
      : '',
    mediaUrl3 = normalizeMediaUrl(text4),
    mediaUrl4 = normalizeMediaUrl(value17['resultPosterRef']),
    value23 = Math['max'](Number(value16['count']) || 0x0, text4 ? 0x1 : 0x0),
    videoStageFrameStyle2 = buildVideoStageFrameStyle(enabled3),
    value24 = text4
      ? '<div\x20class=\x22story-video-stage\x20person-replacement-video-stage\x20person-replacement-video-result-stage\x22\x20data-person-replacement-video-playback-stage=\x22result\x22\x20data-person-replacement-video-url=\x22' +
        escapeHtml(mediaUrl3) +
        '" data-person-replacement-video-poster="' +
        escapeHtml(mediaUrl4) +
        '" data-person-replacement-video-center-stage data-shot-id="' +
        escapeHtml(enabled3?.['id'] || '') +
        '" style="' +
        videoStageFrameStyle2 +
        '">\n        <video data-person-replacement-video-player="result" data-person-replacement-video-center-player data-person-replacement-video-url="' +
        escapeHtml(mediaUrl3) +
        '" playsinline preload="metadata"' +
        (mediaUrl4 ? ' poster="' + escapeHtml(mediaUrl4) + '\x22' : '') +
        ' aria-label="替换视频生成版本 ' +
        (value18 + 0x1) +
        '/' +
        value23 +
        '"></video>\n        ' +
        (isGenerating ? '' : renderVideoNodeCenterPlayIndicator()) +
        '\n        ' +
        (isGenerating ? '' : renderVideoReplacementPlaybackControls(enabled3, { role: 'result' })) +
        '\n      </div>'
      : '<span>生成视频显示在这里</span>',
    value25 =
      '<div class="story-asset-preview-actions person-replacement-result-actions">\n    ' +
      renderWorkspaceVideoDownloadButton({
        enabled: Boolean(text4),
        className: 'person-replacement-result-download',
      }) +
      '\n    <button type="button" class="story-upload-replace story-character-voice-upload-button person-replacement-result-upload" data-story-action="upload-replacement-video" aria-label="上传替换视频" title="上传替换视频" ' +
      (!enabled3 || isGenerating ? 'disabled' : '') +
      '>' +
      renderWorkspaceUploadIcon() +
      '</button>\x0a\x20\x20</div>';
  return (
    '<div\x20class=\x22person-replacement-generation-preview\x20person-replacement-video-result' +
    (isGenerating ? '\x20img-preview-loading' : '') +
    '" aria-busy="' +
    isGenerating +
    '\x22' +
    value21 +
    '><div class="person-replacement-video-result-slide">' +
    value24 +
    '</div>' +
    value25 +
    value20 +
    value22 +
    '</div>'
  );
}
function renderVideoReplacementGenerateButton(
  value26,
  {
    presentation: presentation = {},
    shotBatchGenerationActive: shotBatchGenerationActive = ![],
    shotBatchGeneratingShotIds: shotBatchGeneratingShotIds = [],
    shotBatchCancelRequested: shotBatchCancelRequested = ![],
  } = {},
) {
  const value27 = presentation['shot'] || null,
    enabled4 = value26['workspace']['shotSelectionMode'] === !![],
    enabled5 = Array['isArray'](value26['workspace']['selectedShotIds'])
      ? value26['workspace']['selectedShotIds']['length']
      : 0x0,
    value28 = Boolean(
      value27?.['id'] &&
      ((presentation['generation']?.['isActive'] &&
        normalizeText(presentation['generation']['shotId']) === normalizeText(value27['id'])) ||
        (Array['isArray'](shotBatchGeneratingShotIds) &&
          shotBatchGeneratingShotIds['includes'](value27['id']))),
    ),
    enabled6 = Boolean(
      !enabled4 &&
      presentation['generation']?.['isActive'] &&
      normalizeText(presentation['generation']['shotId']) === normalizeText(value27?.['id']),
    ),
    value29 = enabled5 ? '\x20(' + enabled5 + ')' : '',
    value30 = enabled4
      ? shotBatchGenerationActive
        ? shotBatchCancelRequested
          ? '正在停止' + value29
          : '取消运行' + value29
        : '批量生成视频' + value29
      : enabled6
        ? '取消运行'
        : value28
          ? '生成中'
          : '生成视频',
    value31 = enabled4
      ? !enabled5 || shotBatchCancelRequested
      : !enabled6 && (!presentation['eligibility']?.['canGenerate'] || value28);
  return (
    '<button\x20type=\x22button\x22\x20class=\x22story-asset-generate-button\x22\x20aria-busy=\x22' +
    shotBatchGenerationActive +
    '" data-person-replacement-action="generate-replacement-video" ' +
    (value31 ? 'disabled' : '') +
    '>' +
    escapeHtml(value30) +
    '</button>'
  );
}
function renderVideoReplacementPage(
  inputMode,
  shotBatchGenerationActive2,
  {
    buildIdentityView: buildIdentityView2,
    renderShotTimeline: renderShotTimeline2,
    renderLayoutSplitter: renderLayoutSplitter2,
    renderFooter: renderFooter2,
  },
) {
  const referenceCounts = buildPersonReplacementVideoPresentation(inputMode),
    value32 = buildIdentityView2(inputMode, referenceCounts),
    value33 = referenceCounts['shot'],
    value34 = referenceCounts['generation'],
    response3 = referenceCounts['preparation'],
    error = referenceCounts['imageInput'],
    isGenerating2 =
      value34['isActive'] ||
      Boolean(
        Array['isArray'](shotBatchGenerationActive2['shotBatchGeneratingShotIds']) &&
        shotBatchGenerationActive2['shotBatchGeneratingShotIds']['includes'](value33?.['id']),
      ),
    value35 =
      response3['materializationStatus'] === 'running'
        ? '正在切片并统一为 ' + (value33['outputFps'] || 0x18) + ' FPS…'
        : response3['materializationStatus'] === 'failed'
          ? response3['error'] || '镜头切片失败'
          : response3['status'] === 'running'
            ? '正在准备视频片段 ' + Math['round'](response3['progress']) + '%'
            : '进入视频替换时生成固定帧率片段',
    modelId = inputMode['settings']['replacementModelId'] || PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
    provider = resolveModelProvider(modelId),
    modelManifest = getModelManifest(modelId)?.['prompt'],
    value36 =
      value33?.['videoPrompt'] ||
      (modelManifest?.['emptyPolicy'] === 'allow' ? '' : PERSON_REPLACEMENT_DEFAULT_VIDEO_PROMPT),
    text5 = normalizeText(modelManifest?.['placeholder']) || '描述视频人物替换效果',
    value37 = text5 + '；输入\x20/\x20选择预设',
    uiSchemaFieldState = resolvePersonReplacementVideoParameterPolicy({
      modelId: modelId,
      inputMode: inputMode['settings']['replacementVideoInputMode'],
      generationParams: inputMode['settings']['replacementVideoGenerationParams'],
    }),
    generationParams = {
      ...uiSchemaFieldState['generationParams'],
      rhVideoFps: resolvePersonReplacementVideoGenerationFps(inputMode['settings']),
    },
    value38 =
      error['referenceKind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE
        ? '人物参考图'
        : '替换首帧',
    box = normalizePersonReplacementLayout(inputMode['workspace']['replacementLayout']),
    value39 =
      '--person-replacement-left-width:' +
      box['left'] +
      '%;' +
      ('--person-replacement-right-width:' + box['right'] + '%;') +
      ('--person-replacement-center-top:' + box['centerTop'] + '%;');
  return (
    '<div\x20class=\x22person-replacement-production-page\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-four-panel-layout\x22\x20data-person-replacement-layout\x20style=\x22' +
    value39 +
    '">\n      ' +
    value32['referenceRailHtml'] +
    '\n      ' +
    renderLayoutSplitter2('left', box) +
    '\n      <section class="person-replacement-keyframe-panel person-replacement-middle-layout person-replacement-video-middle-layout">' +
    renderVideoReplacementPreview(inputMode, referenceCounts, value35) +
    renderLayoutSplitter2('center', box) +
    renderShotTimeline2(inputMode, {
      timelineMode: 'video',
      shotBatchGenerationActive: shotBatchGenerationActive2['shotBatchGenerationActive'],
      shotBatchGenerationLabel: shotBatchGenerationActive2['shotBatchGenerationLabel'],
      shotBatchGeneratingShotIds: shotBatchGenerationActive2['shotBatchGeneratingShotIds'],
      shotBatchCancelRequested: shotBatchGenerationActive2['shotBatchCancelRequested'],
    }) +
    '</section>\n      ' +
    renderLayoutSplitter2('right', box) +
    '\n      <aside class="person-replacement-generation-panel person-replacement-video-generation-panel">\n        ' +
    renderVideoReplacementResult(referenceCounts, { isGenerating: isGenerating2 }) +
    '\n        ' +
    renderLayoutSplitter2('center', box, { label: '调整结果预览与提示词区域高度' }) +
    '\n        <div class="story-asset-detail-copy person-replacement-generation-copy">\n          <div class="story-asset-prompt-field person-replacement-prompt-field">\n            <div class="person-replacement-prompt-field-heading" role="group" aria-label="模型入参"><div class="person-replacement-video-prompt-heading-actions"><div class="person-replacement-prompt-reference-inputs" data-person-replacement-video-reference-inputs>' +
    value32['referenceInputsHtml'] +
    '</div>' +
    renderVideoInputModeControl(inputMode) +
    '</div></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22prompt-input-wrapper\x20is-resizable\x20person-replacement-prompt-input-wrapper\x22><div\x20class=\x22prompt-textarea\x20custom-textarea\x20story-asset-prompt-editor\x20person-replacement-prompt-editor\x22\x20contenteditable=\x22true\x22\x20role=\x22textbox\x22\x20aria-multiline=\x22true\x22\x20aria-label=\x22视频替换提示词\x22\x20spellcheck=\x22false\x22\x20data-placeholder=\x22' +
    escapeHtml(value37) +
    '" data-person-replacement-field="video-prompt" data-shot-id="' +
    escapeHtml(value33?.['id'] || '') +
    '\x22>' +
    renderPersonReplacementPromptHtml(value36) +
    '</div></div>\n          </div>\n          ' +
    (error['status'] === 'ready'
      ? ''
      : '<p\x20class=\x22person-replacement-reference-note\x22>' +
        escapeHtml(value38 + '：' + error['message']) +
        '</p>') +
    '\n          <div class="story-asset-generation-bar prompt-panel-footer">' +
    renderAIGenVideoModelSelectorMarkup({
      modelId: modelId,
      provider: provider,
      generationParams: generationParams,
      uiSchemaFieldState: uiSchemaFieldState['uiSchemaFieldState'],
      providerProfileId: inputMode['settings']['replacementVideoProviderProfileId'],
      providerProfileIdByModel: inputMode['settings']['replacementVideoProviderProfileIdByModel'],
      referenceCounts: referenceCounts['slotState']['referenceCounts'],
      showSchemaControls: !![],
      allowedModelIds: PERSON_REPLACEMENT_VIDEO_MODEL_IDS,
      className: 'person-replacement-video-model-selector',
    }) +
    renderRequestDebugButton('data-story-action="debug-generation-video"') +
    renderVideoReplacementGenerateButton(inputMode, {
      presentation: referenceCounts,
      ...shotBatchGenerationActive2,
    }) +
    '</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    (value34['error'] ? '<p class="person-replacement-error">' + escapeHtml(value34['error']) + '</p>' : '') +
    '\n        </div>\n      </aside>\n    </div>' +
    renderFooter2(inputMode, { nextLabel: '进入声音克隆' }) +
    '\n  </div>'
  );
}
function cloneFrozenPresentationValue(list2) {
  if (Array['isArray'](list2)) return Object['freeze'](list2['map'](cloneFrozenPresentationValue));
  if (!list2 || typeof list2 !== 'object') return list2;
  return Object['freeze'](
    Object['fromEntries'](
      Object['entries'](list2)['map'](([value40, value41]) => [
        value40,
        cloneFrozenPresentationValue(value41),
      ]),
    ),
  );
}
function buildReadonlyVideoPresentation(value42, value43) {
  const shot3 = buildPersonReplacementVideoPresentation(value42, value43);
  return Object['freeze']({
    shot: shot3['shot'] ? cloneFrozenPresentationValue(shot3['shot']) : null,
    shotId: shot3['shotId'],
    imageInput: cloneFrozenPresentationValue(shot3['imageInput']),
    slotState: cloneFrozenPresentationValue(shot3['slotState']),
    generation: cloneFrozenPresentationValue(shot3['generation']),
    preparation: cloneFrozenPresentationValue(shot3['preparation']),
    history: cloneFrozenPresentationValue(shot3['history']),
    media: cloneFrozenPresentationValue(shot3['media']),
    eligibility: cloneFrozenPresentationValue(shot3['eligibility']),
    output: cloneFrozenPresentationValue(shot3['output']),
  });
}
export function createPersonReplacementVideoPresentation({
  buildIdentityView: buildIdentityView = () => ({ referenceInputsHtml: '', referenceRailHtml: '' }),
  renderShotTimeline: renderShotTimeline = () => '',
  renderLayoutSplitter: renderLayoutSplitter = () => '',
  renderFooter: renderFooter = () => '',
} = {}) {
  const value44 = Object['freeze']({
    buildIdentityView: buildIdentityView,
    renderShotTimeline: renderShotTimeline,
    renderLayoutSplitter: renderLayoutSplitter,
    renderFooter: renderFooter,
  });
  return Object['freeze']({
    build: buildReadonlyVideoPresentation,
    render: (value45, value46 = {}) => renderVideoReplacementPage(value45, value46, value44),
    renderGenerateButton: renderVideoReplacementGenerateButton,
    renderPlaybackControls: renderVideoReplacementPlaybackControls,
  });
}
