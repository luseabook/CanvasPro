import { renderRequestDebugButton } from '../debugRequestWindow.js';
import { renderStoryClipQualityNotes } from './storyClipQualityPresentation.js';
import { resolveAssetMentionRef } from '../assetMentionRegistry.js';
import { renderAIGenVideoModelSelectorMarkup } from '../../components/aigenVideo/modelSelector.js';
import {
  renderVideoPromptEditorMarkup,
  renderVideoReferenceBarMarkup,
} from '../../components/video-node/promptInputSurface.js';
import { resolveModelExecution } from '../../manifests/index.js';
import {
  buildFixedInputAssetSlotMapFromRefs,
  getFixedInputSlotConfigFromManifest,
  shouldHideFixedInputSlots,
} from '../fixedInputAssetRefs.js';
import { sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
import { STORY_PROMPT_LANGUAGES } from '../../domain/storyGeneration/promptLanguage.js';
import { canGenerateStoryClipAdjustment } from './storyClipAdjustmentMenu.js';
import { t } from '../../i18n/index.js';
import { buildStoryClipInputSlotViewModel } from './storyClipInputSlots.js';
import { getRecoverableStoryClipVideoTask, buildStoryClipVideoPayload } from './storyClipGeneration.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { renderWorkspaceVideoPlaybackControls } from '../workspaceVideoPlaybackControls.js';
import { renderStoryClipPromptMentions, resolveStoryClipPromptAssetRefs } from './storyClipMentions.js';
import { normalizeDurationSeconds } from './storyPlanningData.js';
import { resolveStoryVideoReplicationClipVoiceAssetIds } from './storyVideoReplication.js';
import { renderStoryKeyframeIcon } from './storyWorkspaceIcons.js';
import { renderStoryMediaHistoryMenu } from './storyMediaHistory.js';
import { VIDEO_CLIP_ICON_SVG } from '../../components/nodeToolbar/videoToolbarHtml.js';
import { renderWorkspaceCardDeleteControl } from '../workspaceAssetPresentation.js';
import {
  formatStoryClipVideoGenerationDuration,
  resolveStoryClipVideoGenerationParams,
} from './storyVideoGenerationSettings.js';
import { STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS } from './storyWorkspaceModelCatalog.js';
import { isStoryClipAdjustmentGenerating, normalizeStoryClipPromptHistory } from './storyClipAdjustment.js';
import {
  STORY_PROMPT_MODE_OPTIONS,
  isStoryMinimaxH3PromptMode,
  getStoryPromptModeLabel,
  normalizeStoryMinimaxH3OfficialTags,
  normalizeStoryPromptMode,
} from './storyPromptModes.js';
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
function formatPromptHistorySavedAt(key) {
  const index = new Date(Number(key));
  if (!Number['isFinite'](index['getTime']()) || Number(key) <= 0) return '时间未记录';
  const run = (result) => String(result)['padStart'](2, '0');
  return (
    index['getFullYear']() +
    '-' +
    run(index['getMonth']() + 1) +
    '-' +
    run(index['getDate']()) +
    ' ' +
    run(index['getHours']()) +
    ':' +
    run(index['getMinutes']())
  );
}
function getPromptHistoryPreview(data) {
  return normalizeText(
    String(data || '')
      ['replace'](/<br\s*\/?\s*>/gi, ' ')
      ['replace'](/<[^>]+>/g, ' ')
      ['replace'](/&nbsp;/gi, ' ')
      ['replace'](/&lt;/gi, '<')
      ['replace'](/&gt;/gi, '>')
      ['replace'](/&quot;/gi, '"')
      ['replace'](/&#39;|&apos;/gi, '\'')
      ['replace'](/&amp;/gi, '&')
      ['replace'](/\s+/g, ' '),
  )['slice'](0, 96);
}
function getVideoResults(options = {}) {
  return Array['isArray'](options?.['video']?.['results'])
    ? options['video']['results']['filter']((target) => target && typeof target === 'object')
    : [];
}
function getActiveVideoResultIndex(options2 = {}, list = getVideoResults(options2)) {
  if (!list['length']) return 0;
  const source = Math['trunc'](Number(options2?.['video']?.['activeIndex']) || 0);
  return Math['max'](0, Math['min'](list['length'] - 1, source));
}
function removeVideoResult(clip = {}, next) {
  const results = getVideoResults(clip),
    count = Number(next),
    activeIndex = getActiveVideoResultIndex(clip, results);
  if (results['length'] < 2 || !Number['isInteger'](count) || count < 0 || count >= results['length'])
    return {
      changed: ![],
      clip: clip,
      results: results,
      activeIndex: activeIndex,
      activeResultChanged: ![],
      direction: '',
    };
  const current = results[activeIndex],
    results2 = results['filter']((entry, record) => record !== count),
    activeIndex2 =
      count < activeIndex
        ? activeIndex - 1
        : count === activeIndex
          ? Math['min'](count, results2['length'] - 1)
          : activeIndex,
    activeResultChanged = results2[activeIndex2] !== current;
  return {
    changed: !![],
    clip: {
      ...clip,
      video: { ...(clip?.['video'] || {}), results: results2, activeIndex: activeIndex2 },
    },
    results: results2,
    activeIndex: activeIndex2,
    activeResultChanged: activeResultChanged,
    direction:
      activeResultChanged && count >= results2['length'] ? 'previous' : activeResultChanged ? 'next' : '',
  };
}
function resolveVideoResultUrl(response = {}) {
  return (
    [
      localPathToUrl(response['displayLocalPath']),
      localPathToUrl(response['localPath']),
      response['videoUrl'],
      response['url'],
      response['displayUrl'],
    ]
      ['map']((payload) => normalizeText(payload))
      ['find'](Boolean) || ''
  );
}
function resolveVideoResultPosterUrl(options3 = {}) {
  return (
    [
      options3['posterUrl'],
      options3['thumbUrl'],
      options3['thumbnailUrl'],
      options3['coverUrl'],
      localPathToUrl(options3['posterLocalPath']),
      localPathToUrl(options3['thumbLocalPath']),
      localPathToUrl(options3['thumbnailLocalPath']),
    ]
      ['map']((handle) => normalizeText(handle))
      ['find'](Boolean) || ''
  );
}
function renderVideoThumbnail(state, { className: className = '', label: label = '视频缩略图' } = {}) {
  const videoResultPosterUrl = resolveVideoResultPosterUrl(state);
  if (videoResultPosterUrl)
    return (
      '<img class="' +
      escapeHtml(className) +
      '" src="' +
      escapeHtml(videoResultPosterUrl) +
      '" alt="' +
      escapeHtml(label) +
      '" loading="lazy" draggable="false">'
    );
  const videoResultUrl = resolveVideoResultUrl(state);
  if (videoResultUrl)
    return (
      '<video class="' +
      escapeHtml(className) +
      '" src="' +
      escapeHtml(videoResultUrl) +
      '" aria-label="' +
      escapeHtml(label) +
      '" muted playsinline preload="metadata"></video>'
    );
  return '';
}
function getAdjacentVideoResultIndex(options4 = {}, config = 1) {
  const list2 = getVideoResults(options4);
  if (list2['length'] < 2) return getActiveVideoResultIndex(options4, list2);
  const activeVideoResultIndex2 = getActiveVideoResultIndex(options4, list2),
    scope = Number(config) < 0 ? -1 : 1;
  return (activeVideoResultIndex2 + scope + list2['length']) % list2['length'];
}
function renderVideoHistoryMenu(title = {}) {
  const results3 = getVideoResults(title),
    activeIndex3 = getActiveVideoResultIndex(title, results3);
  return renderStoryMediaHistoryMenu({
    title: title?.['title'] || '片段视频',
    results: results3,
    activeIndex: activeIndex3,
    menuLabel: (title?.['title'] || '片段') + '历史视频',
    getItemStatus: (input, output) => (output === activeIndex3 ? '当前播放' : '点击切换'),
    renderMedia: (value2, value3) =>
      renderVideoThumbnail(value2, {
        className: 'story-media-history-thumbnail story-clip-video-history-thumbnail',
        label: (title?.['title'] || '片段') + ' · 版本 ' + (value3 + 1),
      }),
    getItemAttributes: (value4, value5) =>
      'data-story-action="select-video-result" data-story-clip-id="' +
      escapeHtml(title?.['id']) +
      '" data-story-video-result-index="' +
      value5 +
      '"',
    renderItemAction: (value6, value7) =>
      renderWorkspaceCardDeleteControl({
        className: 'story-media-history-delete',
        ariaLabel: '删除版本 ' + (value7 + 1),
        actionAttributes: {
          'data-story-action': 'delete-video-result',
          'data-story-clip-id': title?.['id'],
          'data-story-video-result-index': value7,
        },
      }),
  });
}
function renderGenerationSpinner() {
  return renderStoryGenerationSpinner();
}
function renderTimelineVideoThumbnail(options5 = {}) {
  const videoResults2 = getVideoResults(options5),
    value8 = videoResults2[getActiveVideoResultIndex(options5, videoResults2)] || null;
  return value8
    ? renderVideoThumbnail(value8, {
        className: 'story-clip-card-thumbnail',
        label: '片段 ' + options5['number'] + ' 视频缩略图',
      })
    : '';
}
function getSelectedEpisode(value9) {
  const list3 = Array['isArray'](value9?.['data']?.['episodes']) ? value9['data']['episodes'] : [];
  return list3['find']((value10) => value10['id'] === value9?.['selectedEpisodeId']) || list3[0] || null;
}
function getSelectedClip(value11, value12) {
  const list4 = Array['isArray'](value12?.['clips']) ? value12['clips'] : [];
  return list4['find']((value13) => value13['id'] === value11?.['selectedClipId']) || list4[0] || null;
}
function getAdjacentClipId(list5 = [], value14 = '', value15 = 1) {
  const list6 = (Array['isArray'](list5) ? list5 : [])['filter']((value16) => normalizeText(value16?.['id']));
  if (!list6['length']) return '';
  const count2 = list6['findIndex']((value17) => value17['id'] === value14),
    value18 = count2 >= 0 ? count2 : 0,
    value19 = Number(value15) < 0 ? -1 : 1,
    value20 = (value18 + value19 + list6['length']) % list6['length'];
  return list6[value20]['id'];
}
function selectBatchTargets(list7 = [], value21 = []) {
  const map = new Set(
    (Array['isArray'](value21) ? value21 : [])['map']((value22) => normalizeText(value22))['filter'](Boolean),
  );
  return (Array['isArray'](list7) ? list7 : [])['filter']((value23) =>
    map['has'](normalizeText(value23?.['id'])),
  );
}
async function runBatch(list8 = [], handler = null, { onProgress: onProgress = null } = {}) {
  if (typeof handler !== 'function') return [];
  const total2 = Array['isArray'](list8) ? list8 : [];
  let completed2 = 0;
  return Promise['all'](
    total2['map'](async (target2, index2) => {
      let result2;
      try {
        result2 = await handler(target2, { index: index2, total: total2['length'] });
      } catch (error) {
        result2 = { ok: ![], error: error };
      }
      return (
        (completed2 += 1),
        onProgress?.({
          completed: completed2,
          total: total2['length'],
          index: index2,
          target: target2,
          result: result2,
        }),
        result2
      );
    }),
  );
}
function getGeneratingClipIds(options6 = {}, enabled = null) {
  const args = new Set(
      (Array['isArray'](options6?.['generatingClipIds']) ? options6['generatingClipIds'] : [])
        ['map']((value24) => normalizeText(value24))
        ['filter'](Boolean),
    ),
    text = normalizeText(options6?.['generatingClipId']);
  if (text) args['add'](text);
  const list9 = [...args];
  if (!enabled) return list9;
  const map2 = new Set(
    (Array['isArray'](enabled?.['clips']) ? enabled['clips'] : [])
      ['map']((value25) => normalizeText(value25?.['id']))
      ['filter'](Boolean),
  );
  return list9['filter']((value26) => map2['has'](value26));
}
function setClipGenerationRunning(args2, value27, value28 = !![]) {
  if (!args2 || typeof args2 !== 'object') return [];
  const text2 = normalizeText(value27),
    map3 = new Set(getGeneratingClipIds(args2));
  if (text2) {
    if (value28) map3['add'](text2);
    else map3['delete'](text2);
  }
  return (
    (args2['generatingClipIds'] = [...map3]),
    (args2['generatingClipId'] = args2['generatingClipIds'][0] || ''),
    [...args2['generatingClipIds']]
  );
}
function getGenerationState(options7 = {}, value29 = null) {
  const text3 = normalizeText(value29?.['id']),
    value30 = options7?.['clipBatchGenerationByEpisode'],
    isBatchGenerating = Boolean(
      text3 &&
      value30 &&
      typeof value30 === 'object' &&
      !Array['isArray'](value30) &&
      Object['hasOwn'](value30, text3),
    ),
    batchCancelRequested = isBatchGenerating ? value30[text3] : null,
    generatingClipIds2 = getGeneratingClipIds(options7, value29);
  return {
    generatingClipIds: generatingClipIds2,
    isBatchGenerating: isBatchGenerating,
    batchLabel: normalizeText(batchCancelRequested?.['label']),
    batchCancelRequested: batchCancelRequested?.['cancelRequested'] === !![],
    busy: isBatchGenerating || generatingClipIds2['length'] > 0,
  };
}
function setEpisodeBatchRunning(enabled2, value31, value32 = !![], value33 = '', value34 = {}) {
  if (!enabled2 || typeof enabled2 !== 'object') return null;
  const text4 = normalizeText(value31);
  if (!text4) return null;
  const value35 = enabled2['clipBatchGenerationByEpisode'],
    value36 = {
      ...(value35 && typeof value35 === 'object' && !Array['isArray'](value35) ? value35 : {}),
    };
  if (value32)
    value36[text4] = {
      ...(value36[text4] || {}),
      ...(value34 && typeof value34 === 'object' ? value34 : {}),
      label: normalizeText(value33),
    };
  else delete value36[text4];
  return ((enabled2['clipBatchGenerationByEpisode'] = value36), value36[text4] || null);
}
function getClipInputSurface(providerHint, episode2, inputs) {
  if (!inputs) return '';
  const manifest = resolveModelExecution(providerHint['models']['video'], {
      providerHint: providerHint['videoProvider'],
    }),
    storyClipInputSlotViewModel = buildStoryClipInputSlotViewModel({
      modelId: providerHint['models']['video'],
      provider: providerHint['videoProvider'],
      inputs: inputs['inputs'],
    }),
    value37 = {
      model: providerHint['models']['video'],
      provider: providerHint['videoProvider'],
      generationParams: providerHint['videoGenerationParams'],
    },
    fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(value37, {
      manifest: manifest?.['modelManifest'] || null,
    }),
    slotOrderByType = shouldHideFixedInputSlots(fixedInputSlotConfigFromManifest)
      ? null
      : fixedInputSlotConfigFromManifest,
    occupiedSlots = storyClipInputSlotViewModel['slots']['filter']((value38) => value38['input']?.['url']),
    inputsBySlot = Object['fromEntries'](
      occupiedSlots['map']((kind) => [kind['id'], { ...kind['input'], kind: kind['kind'] }]),
    ),
    map4 = new Set(
      occupiedSlots['map'](
        (value39) => normalizeText(value39['kind']) + ':' + normalizeText(value39['input']?.['url']),
      )['filter'](Boolean),
    ),
    voiceAssetIds2 = resolveStoryVideoReplicationClipVoiceAssetIds(providerHint?.['data'], inputs),
    list10 = resolveStoryClipPromptAssetRefs(inputs?.['prompt'] || '', {
      assets: Array['isArray'](providerHint?.['data']?.['assets']) ? providerHint['data']['assets'] : [],
      episode: episode2,
      clipFrames: Array['isArray'](providerHint?.['data']?.['clipFrames'])
        ? providerHint['data']['clipFrames']
        : [],
      resolveExternalAssetRef: resolveAssetMentionRef,
      voiceAssetIds: voiceAssetIds2,
    })
      ['map']((error2, value40) => ({
        ...error2,
        type: normalizeText(error2?.['type'] || error2?.['kind']),
        kind: normalizeText(error2?.['type'] || error2?.['kind']),
        url: normalizeText(error2?.['url']),
        thumbUrl: normalizeText(error2?.['thumbUrl'] || error2?.['url']),
        name: normalizeText(error2?.['name'] || error2?.['label']) || '素材 ' + (value40 + 1),
        refSlot: normalizeText(error2?.['refSlot'] || error2?.['slotId']),
      }))
      ['filter'](
        (response2) =>
          response2['kind'] && response2['url'] && !map4['has'](response2['kind'] + ':' + response2['url']),
      );
  let readOnlyInputs = list10['filter']((value41) => value41['kind'] === 'image');
  const readOnlyFixedInputSlots = [];
  if (manifest?.['modelManifest']?.['extensions']?.['rhAiApp'] && slotOrderByType) {
    const fixedInputAssetSlotMapFromRefs = buildFixedInputAssetSlotMapFromRefs(list10, {
        slotOrderByType: slotOrderByType['slotOrderByType'],
        visibleSlots: slotOrderByType['visibleSlots'],
        occupiedSlots: occupiedSlots['map']((value42) => value42['id']),
        exclusiveGroups: slotOrderByType['exclusiveGroups'],
        slotById: slotOrderByType['slotById'],
      }),
      map5 = new Set();
    (Object['entries'](fixedInputAssetSlotMapFromRefs)['forEach'](([slotId, response3]) => {
      if (!response3?.['url']) return;
      const kind2 = normalizeText(response3['type'] || response3['kind']);
      ((inputsBySlot[slotId] = { ...response3, kind: kind2, slotId: slotId }),
        readOnlyFixedInputSlots['push'](slotId),
        map5['add'](kind2 + ':' + normalizeText(response3['url'])));
    }),
      (readOnlyInputs = readOnlyInputs['filter'](
        (response4) => !map5['has'](response4['kind'] + ':' + response4['url']),
      )));
  }
  return {
    fixedInputConfig: slotOrderByType,
    inputsBySlot: inputsBySlot,
    inputs: occupiedSlots['map']((kind3) => ({
      ...kind3['input'],
      kind: kind3['kind'],
      slotId: kind3['id'],
    })),
    readOnlyInputs: readOnlyInputs,
    readOnlyFixedInputSlots: readOnlyFixedInputSlots,
  };
}
function getInputReferenceCounts(value43) {
  const value44 = value43?.['inputs'] && typeof value43['inputs'] === 'object' ? value43['inputs'] : {},
    imageCount = (value45) =>
      (Array['isArray'](value44[value45]) ? value44[value45] : [])['filter']((response5) =>
        normalizeText(response5?.['url']),
      )['length'];
  return {
    imageCount: imageCount('image'),
    videoCount: imageCount('video'),
    audioCount: imageCount('audio'),
  };
}
function getUsedReferenceCounts(
  value46,
  {
    assets: assets = [],
    episode: episode = null,
    clipFrames: clipFrames = [],
    voiceAssetIds: voiceAssetIds = null,
  } = {},
) {
  const value47 = { imageCount: 0, audioCount: 0, videoCount: 0 },
    map6 = new Set(),
    handler2 = (response6, value48 = '') => {
      const text5 = normalizeText(response6?.['type'] || response6?.['kind'] || value48),
        text6 = normalizeText(response6?.['url']);
      if (!Object['hasOwn'](value47, text5 + 'Count') || !text6) return;
      const value49 = text5 + ':' + text6;
      if (map6['has'](value49)) return;
      (map6['add'](value49), (value47[text5 + 'Count'] += 1));
    },
    value50 = value46?.['inputs'] && typeof value46['inputs'] === 'object' ? value46['inputs'] : {};
  return (
    ['image', 'audio', 'video']['forEach']((value51) => {
      (Array['isArray'](value50[value51]) ? value50[value51] : [])['forEach']((value52) =>
        handler2(value52, value51),
      );
    }),
    resolveStoryClipPromptAssetRefs(value46?.['prompt'] || '', {
      assets: assets,
      episode: episode,
      clipFrames: clipFrames,
      resolveExternalAssetRef: resolveAssetMentionRef,
      voiceAssetIds: voiceAssetIds,
    })['forEach']((value53) => handler2(value53)),
    value47
  );
}
function renderReferenceSummary(
  value54,
  {
    assets: assets = [],
    episode: episode = null,
    clipFrames: clipFrames = [],
    voiceAssetIds: voiceAssetIds = null,
  } = {},
) {
  const usedReferenceCounts = getUsedReferenceCounts(value54, {
      assets: assets,
      episode: episode,
      clipFrames: clipFrames,
      voiceAssetIds: voiceAssetIds,
    }),
    value55 =
      '参考素材，图片 ' +
      usedReferenceCounts['imageCount'] +
      '，音频 ' +
      usedReferenceCounts['audioCount'] +
      '，视频 ' +
      usedReferenceCounts['videoCount'];
  return (
    '<div class="story-clip-reference-summary" data-story-clip-reference-summary role="status" aria-live="polite" aria-label="' +
    value55 +
    '">\n    <span>图片：<strong data-story-reference-count="image">' +
    usedReferenceCounts['imageCount'] +
    '</strong></span>\n    <span>音频：<strong data-story-reference-count="audio">' +
    usedReferenceCounts['audioCount'] +
    '</strong></span>\n    <span>视频：<strong data-story-reference-count="video">' +
    usedReferenceCounts['videoCount'] +
    '</strong></span>\n  </div>'
  );
}
function renderSelectionControls(enabled3, value56, value57 = null) {
  const list11 = Array['isArray'](value56?.['clips']) ? value56['clips'] : [],
    value58 = Array['isArray'](enabled3?.['selectedClipGenerationIds'])
      ? enabled3['selectedClipGenerationIds']
      : [],
    list12 = selectBatchTargets(list11, value58),
    count3 = list12['length'],
    generationState = getGenerationState(enabled3, value56),
    { generatingClipIds: generatingClipIds3 } = generationState,
    enabled4 = value57 || getSelectedClip(enabled3, value56),
    value59 = enabled3?.['clipSelectionMode'] ? list12[0] : enabled4,
    value60 = enabled3?.['clipSelectionMode'] && count3 > 1,
    value61 = !enabled3?.['clipSelectionMode'] || count3 === 1,
    value62 =
      value61 &&
      Boolean(
        value59 &&
        (generatingClipIds3['includes'](normalizeText(value59['id'])) ||
          getRecoverableStoryClipVideoTask(value59)),
      ),
    value63 = enabled3?.['clipSelectionMode']
      ? count3 === 0 ||
        generationState['isBatchGenerating'] ||
        (value60 ? generatingClipIds3['length'] > 0 : value62)
      : !enabled4 || generationState['isBatchGenerating'] || value62,
    text7 = normalizeText(value59?.['generation']?.['status'])['toLowerCase']() === 'queued',
    value64 = '批量生成视频' + (count3 ? ' (' + count3 + ')' : ''),
    value65 = generationState['isBatchGenerating']
      ? value64
      : value62
        ? text7
          ? '排队中'
          : '生成中'
        : enabled3?.['clipSelectionMode'] && count3 > 1
          ? value64
          : '生成本片段',
    value66 = Boolean(generationState['isBatchGenerating'] || value62),
    renderRequestDebugButton2 =
      renderRequestDebugButton('data-story-action="debug-clip-video"') +
      '<button type="button" class="story-workbench-action-button story-main-action-button" data-story-action="generate-clip-video" aria-busy="' +
      value66 +
      '" ' +
      (value63 ? 'disabled' : '') +
      '>' +
      (value66 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      value65 +
      '</button>',
    value67 = generationState['isBatchGenerating']
      ? '<button type="button" class="story-secondary-button" data-story-action="cancel-clip-batch-generation" ' +
        (generationState['batchCancelRequested'] ? 'disabled' : '') +
        '>' +
        (generationState['batchCancelRequested'] ? '正在停止' : '停止批量生成') +
        '</button>'
      : '',
    value68 =
      '<div class="story-clip-selection-actions">\n        <button type="button" class="story-secondary-button" data-story-action="select-all-clips" aria-pressed="' +
      (count3 > 0 && count3 === list11['length']) +
      '" ' +
      (!list11['length'] ? 'disabled' : '') +
      '>' +
      (count3 > 0 && count3 === list11['length'] ? '取消全选' : '全选') +
      '</button>\n        ' +
      value67 +
      '\n        ' +
      renderRequestDebugButton2 +
      '\n      </div>';
  return '<div class="story-clip-selection-controls">' + value68 + '</div>';
}
function renderAdjustmentBar(value69, value70, value71 = null) {
  if (value69?.['clipAdjustmentOpen'] !== !![]) return '';
  const isStoryClipAdjustmentGenerating2 = isStoryClipAdjustmentGenerating(value69, value71, value70),
    storyPromptMode = normalizeStoryPromptMode(
      value70?.['promptMode'] ||
        value71?.['promptMode'] ||
        value69?.['data']?.['project']?.['planning']?.['promptMode'],
      { allowDeveloperModes: !![] },
    ),
    storyPromptMode2 = normalizeStoryPromptMode(value69?.['clipAdjustmentPromptMode'] || storyPromptMode, {
      allowDeveloperModes: !![],
    }),
    canGenerateStoryClipAdjustment2 = canGenerateStoryClipAdjustment(value69, value71, value70);
  return (
    '<div class="story-clip-adjustment-bar" data-story-clip-adjustment-bar>\n    <div class="story-clip-adjustment-selectors">\n    <div class="story-clip-adjustment-mode" data-story-clip-adjustment-mode data-story-adjustment-kind="mode">\n      <button type="button" class="story-clip-adjustment-mode-trigger" data-story-action="toggle-clip-adjustment-mode" aria-haspopup="listbox" aria-expanded="' +
    (value69?.['clipAdjustmentPromptModeOpen'] === !![]) +
    '" ' +
    (isStoryClipAdjustmentGenerating2 ? 'disabled' : '') +
    '>\n        <strong data-story-clip-adjustment-mode-label>' +
    escapeHtml(getStoryPromptModeLabel(storyPromptMode2)) +
    '</strong>\n      </button>\n      <div class="story-clip-adjustment-mode-menu" role="listbox" aria-label="提示词模式" ' +
    (value69?.['clipAdjustmentPromptModeOpen'] === !![] ? '' : 'hidden') +
    '>\n        ' +
    STORY_PROMPT_MODE_OPTIONS['map'](
      (el) =>
        '<button type="button" class="' +
        (el['value'] === storyPromptMode2 ? 'is-selected' : '') +
        '" data-story-action="select-clip-adjustment-mode" data-story-clip-adjustment-mode-option="' +
        escapeHtml(el['value']) +
        '" role="option" aria-selected="' +
        (el['value'] === storyPromptMode2) +
        '">' +
        escapeHtml(el['label']) +
        '</button>',
    )['join']('') +
    '\n      </div>\n    </div>\n    <div class="story-clip-adjustment-mode" data-story-clip-adjustment-mode data-story-adjustment-kind="language">\n      <button type="button" class="story-clip-adjustment-mode-trigger" data-story-action="toggle-clip-adjustment-mode" aria-label="语言转换" aria-haspopup="listbox" aria-expanded="' +
    (value69?.['clipAdjustmentLanguageOpen'] === !![]) +
    '" ' +
    (isStoryClipAdjustmentGenerating2 ? 'disabled' : '') +
    '>\n        <strong data-story-clip-adjustment-mode-label>' +
    escapeHtml(
      STORY_PROMPT_LANGUAGES['find']((el2) => el2['value'] === value69?.['clipAdjustmentLanguage'])?.[
        'label'
      ] || '语言转换',
    ) +
    '</strong>\n      </button>\n      <div class="story-clip-adjustment-mode-menu" role="listbox" aria-label="语言转换" ' +
    (value69?.['clipAdjustmentLanguageOpen'] ? '' : 'hidden') +
    '>\n        ' +
    [{ value: '', label: '保持当前语言' }, ...STORY_PROMPT_LANGUAGES]
      ['map'](
        (el3) =>
          '<button type="button" class="' +
          (el3['value'] === (value69?.['clipAdjustmentLanguage'] || '') ? 'is-selected' : '') +
          '" data-story-action="select-clip-adjustment-mode" data-story-clip-adjustment-mode-option="' +
          el3['value'] +
          '" role="option" aria-selected="' +
          (el3['value'] === (value69?.['clipAdjustmentLanguage'] || '')) +
          '">' +
          el3['label'] +
          '</button>',
      )
      ['join']('') +
    '\n      </div>\n    </div></div>\n    <div class="story-clip-adjustment-compose">\n      <input type="text" data-story-clip-adjustment-instruction maxlength="600" value="' +
    escapeHtml(value69?.['clipAdjustmentInstruction'] || '') +
    '" placeholder="可选：补充这一段还要怎么调整" aria-label="AI 调整说明" ' +
    (isStoryClipAdjustmentGenerating2 ? 'disabled' : '') +
    '>\n      <button type="button" class="story-workbench-action-button" data-story-action="generate-clip-adjustment" ' +
    (isStoryClipAdjustmentGenerating2 || !canGenerateStoryClipAdjustment2 ? 'disabled' : '') +
    ' aria-busy="' +
    isStoryClipAdjustmentGenerating2 +
    '">' +
    (isStoryClipAdjustmentGenerating2 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
    (isStoryClipAdjustmentGenerating2 ? '生成中' : '生成') +
    '</button>\n    </div>\n  </div>'
  );
}
function shouldCloseAdjustmentOnOutsideClick(value72, el4) {
  return value72?.['clipAdjustmentOpen'] === !![] && !el4?.['closest']?.('.story-clip-adjustment-control');
}
function shouldClosePromptHistoryOnOutsideClick(value73, el5) {
  return (
    value73?.['clipPromptHistoryOpen'] === !![] && !el5?.['closest']?.('[data-story-clip-prompt-history]')
  );
}
function renderPromptHistoryControl(value74, value75) {
  const list13 = normalizeStoryClipPromptHistory(value75?.['promptHistory']);
  if (!list13['length']) return '';
  const value76 = value74?.['clipPromptHistoryOpen'] === !![];
  return (
    '<div class="story-clip-prompt-history" data-story-clip-prompt-history>\n    <button type="button" class="story-clip-prompt-history-trigger" data-story-action="toggle-clip-prompt-history" aria-label="提示词历史" aria-haspopup="dialog" aria-expanded="' +
    value76 +
    '">\n      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.8 12a8.2 8.2 0 1 0 2.4-5.8L4 8.4M4 4.8v3.6h3.6M12 7.8v4.7l3.1 1.8"/></svg>\n    </button>\n    <section class="story-clip-prompt-history-panel" data-story-clip-prompt-history-panel role="dialog" aria-label="提示词历史" ' +
    (value76 ? '' : 'hidden') +
    '>\n      <header><strong>提示词历史</strong><span>最近 ' +
    list13['length'] +
    ' 个已确认版本</span></header>\n      <div class="story-clip-prompt-history-list">\n        ' +
    list13['map']((value77) => {
      const value78 =
          value77['durationSec'] > 0 ? value77['durationSec']['toFixed'](1) + 's' : '时长未记录',
        promptHistoryPreview = getPromptHistoryPreview(value77['promptHtml']) || '空提示词';
      return (
        '<button type="button" class="story-clip-prompt-history-item" data-story-action="restore-clip-prompt-history" data-story-clip-prompt-history-id="' +
        escapeHtml(value77['id']) +
        '" aria-label="恢复 ' +
        escapeHtml(getStoryPromptModeLabel(value77['promptMode'])) +
        ' 历史提示词">\n            <span class="story-clip-prompt-history-item-meta"><strong>' +
        escapeHtml(getStoryPromptModeLabel(value77['promptMode'])) +
        ' · ' +
        value78 +
        '</strong><small>' +
        escapeHtml(formatPromptHistorySavedAt(value77['savedAt'])) +
        '</small></span>\n            <span class="story-clip-prompt-history-item-preview">' +
        escapeHtml(promptHistoryPreview) +
        '</span>\n            <span class="story-clip-prompt-history-item-action">恢复</span>\n          </button>'
      );
    })['join']('') +
    '\n      </div>\n    </section>\n  </div>'
  );
}
function renderAdjustmentControl(value79, value80, value81 = null) {
  if (value80?.['promptAdjustment']?.['candidate']) return '';
  const isStoryClipAdjustmentGenerating3 = isStoryClipAdjustmentGenerating(value79, value81, value80),
    value82 =
      '<div class="story-clip-adjustment-header">\n    ' +
      renderPromptHistoryControl(value79, value80) +
      '\n    <button type="button" class="story-clip-adjustment-trigger" data-story-action="toggle-clip-adjustment" aria-expanded="' +
      (value79?.['clipAdjustmentOpen'] === !![]) +
      '" ' +
      (isStoryClipAdjustmentGenerating3 ? 'disabled' : '') +
      '><span aria-hidden="true">✦</span>AI 调整</button>\n  </div>';
  return (
    '<div class="story-clip-adjustment-control">\n    ' +
    value82 +
    '\n    ' +
    renderAdjustmentBar(value79, value80, value81) +
    '\n  </div>'
  );
}
function renderPromptComparison(value83) {
  const enabled5 = value83?.['promptAdjustment']?.['candidate'];
  if (!enabled5) return '';
  const durationSeconds = normalizeDurationSeconds(
      enabled5['sourceDurationSeconds'] || value83?.['durationSec'] || value83?.['duration'],
    ),
    durationSeconds2 = normalizeDurationSeconds(enabled5['candidateDurationSeconds'] || durationSeconds),
    storyPromptMode3 = normalizeStoryPromptMode(enabled5['sourcePromptMode'] || value83?.['promptMode'], {
      allowDeveloperModes: !![],
    }),
    storyPromptMode4 = normalizeStoryPromptMode(enabled5['targetPromptMode'] || storyPromptMode3, {
      allowDeveloperModes: !![],
    }),
    handler3 = (count4) => (count4 > 0 ? count4['toFixed'](1) + 's' : '--');
  return (
    '<div class="story-clip-prompt-comparison" data-story-clip-prompt-comparison>\n    <header>\n      <span>AI 调整完成</span>\n      <strong>选择这个片段要使用的提示词版本</strong>\n    </header>\n    <div class="story-clip-prompt-comparison-grid">\n      <article>\n        <div class="story-clip-prompt-version-title"><strong>原版本 · ' +
    escapeHtml(getStoryPromptModeLabel(storyPromptMode3)) +
    '</strong><span>总时长 ' +
    handler3(durationSeconds) +
    '</span></div>\n        <div class="story-clip-prompt-version-content">' +
    sanitizePromptHtmlForCommit(enabled5['sourcePromptHtml']) +
    '</div>\n        <button type="button" data-story-action="keep-current-clip-prompt">保留原版本</button>\n      </article>\n      <article class="is-ai-version">\n        <div class="story-clip-prompt-version-title"><strong>AI 调整后 · ' +
    escapeHtml(getStoryPromptModeLabel(storyPromptMode4)) +
    '</strong><span>总时长 ' +
    handler3(durationSeconds2) +
    '</span></div>\n        <div class="story-clip-prompt-version-content">' +
    sanitizePromptHtmlForCommit(enabled5['promptHtml']) +
    '</div>\n        <div class="story-clip-prompt-version-actions">\n          <button type="button" class="story-regenerate-button" data-story-action="regenerate-clip-adjustment">重新生成</button>\n          <button type="button" class="story-workbench-action-button" data-story-action="use-ai-clip-prompt">使用 AI 版本</button>\n        </div>\n      </article>\n    </div>\n  </div>'
  );
}
function renderPromptSurface(modelId2, episode3, value84) {
  try {
    const args3 = getClipInputSurface(modelId2, episode3, value84),
      generationParams2 = resolveStoryClipVideoGenerationParams(
        value84,
        modelId2['models']['video'],
        modelId2['videoGenerationParams'],
      ),
      generationParamsByModel = {
        ...(modelId2['videoGenerationParamsByModel'] || {}),
        [modelId2['models']['video']]: { ...generationParams2 },
      },
      storyPromptMode5 = normalizeStoryPromptMode(
        value84?.['promptMode'] ||
          episode3?.['promptMode'] ||
          modelId2?.['data']?.['project']?.['planning']?.['promptMode'],
        { allowDeveloperModes: !![] },
      ),
      isStoryMinimaxH3PromptMode2 = isStoryMinimaxH3PromptMode(storyPromptMode5)
        ? normalizeStoryMinimaxH3OfficialTags(value84?.['prompt'] || '')
        : value84?.['prompt'] || '',
      promptHtml = renderStoryClipPromptMentions(isStoryMinimaxH3PromptMode2, {
        assets: Array['isArray'](modelId2?.['data']?.['assets']) ? modelId2['data']['assets'] : [],
        episode: episode3,
        clipFrames: Array['isArray'](modelId2?.['data']?.['clipFrames'])
          ? modelId2['data']['clipFrames']
          : [],
      }),
      isStoryClipAdjustmentGenerating4 = isStoryClipAdjustmentGenerating(modelId2, episode3, value84),
      value85 = Boolean(value84?.['promptAdjustment']?.['candidate']);
    return (
      '<div class="story-video-node-prompt text-prompt-panel" data-story-clip-prompt-surface>\n      ' +
      renderStoryClipQualityNotes(episode3, value84, escapeHtml) +
      '\n      <div class="story-clip-prompt-toolbar">\n        ' +
      renderVideoReferenceBarMarkup({ ...args3, attachmentButtonHtml: '' }) +
      '\n        ' +
      renderAdjustmentControl(modelId2, value84, episode3) +
      '\n      </div>\n      ' +
      (isStoryClipAdjustmentGenerating4
        ? '<div class="story-clip-prompt-adjustment-loading" role="status" aria-live="polite" aria-busy="true">\n            ' +
          renderGenerationSpinner() +
          '\n            <strong>正在调整当前片段提示词</strong>\n            <span>其他片段不受影响</span>\n          </div>'
        : value85
          ? renderPromptComparison(value84)
          : renderVideoPromptEditorMarkup({
              promptHtml: promptHtml,
              placeholder: t('aigenVideoNode.prompt.placeholder'),
              attributes: 'data-story-clip-prompt',
            })) +
      '\n      <div class="story-clip-model-bar prompt-panel-footer">\n        ' +
      renderAIGenVideoModelSelectorMarkup({
        modelId: modelId2['models']['video'],
        provider: modelId2['videoProvider'],
        generationParams: generationParams2,
        generationParamsByModel: generationParamsByModel,
        providerProfileId: modelId2['videoProviderProfileId'],
        providerProfileIdByModel: modelId2['videoProviderProfileIdByModel'],
        referenceCounts: getInputReferenceCounts(value84),
        showSchemaControls: !![],
        className: 'story-clip-video-model-selector',
        runningHubWorkflowAllowedModelIds: STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS,
      }) +
      '\n        <span class="story-clip-provider-profile-control" data-story-video-provider-profile></span>\n        <div class="story-clip-generation-actions">\n          ' +
      renderSelectionControls(modelId2, episode3, value84) +
      '\n        </div>\n      </div>\n    </div>'
    );
  } catch (error3) {
    return (
      '<div class="story-inline-error">' +
      escapeHtml(error3?.['message'] || '当前模型输入槽不可用') +
      '</div>'
    );
  }
}
function renderVideoResultSwitchButton(value86, value87) {
  const value88 = value86 === 'previous',
    value89 = value88 ? 'previous-video-result' : 'next-video-result',
    value90 = value88 ? '切换到上一个历史视频' : '切换到下一个历史视频',
    value91 = value88 ? 'story-video-result-switch--previous' : 'story-video-result-switch--next',
    value92 = value88 ? 'm6.5 14.5 5.5-5.5 5.5 5.5' : 'm6.5 9.5 5.5 5.5 5.5-5.5';
  return (
    '<button type="button" class="story-appearance-arrow story-video-result-switch ' +
    value91 +
    '" data-story-action="' +
    value89 +
    '" data-story-clip-id="' +
    escapeHtml(value87?.['id']) +
    '" aria-label="' +
    value90 +
    '"><svg class="story-appearance-arrow-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="' +
    value92 +
    '"/></svg></button>'
  );
}
function renderVideoPlaybackControls(value93, value94) {
  const escapeHtml2 = escapeHtml(value93?.['id']);
  return renderWorkspaceVideoPlaybackControls({
    label: '视频',
    playLabel: '播放视频',
    playTitle: '播放视频',
    controlsAttributes: { 'data-story-video-controls': !![] },
    playAttributes: { 'data-story-video-play': !![] },
    currentTimeAttributes: { 'data-story-video-time-current': !![] },
    progressAttributes: { 'data-story-video-progress': !![] },
    progressFillAttributes: { 'data-story-video-progress-fill': !![] },
    totalTimeAttributes: { 'data-story-video-time-total': !![] },
    volumeAttributes: { 'data-story-video-volume': !![] },
    volumeToggleAttributes: { 'data-story-video-volume-toggle': !![] },
    slots: {
      beforeVolume:
        '<button type="button" class="video-snap-btn story-video-snap-btn" data-story-action="capture-video-frame" data-story-clip-id="' +
        escapeHtml2 +
        '" data-story-video-result-index="' +
        value94 +
        '" aria-label="获取当前帧" title="获取当前帧">\n        ' +
        renderStoryKeyframeIcon() +
        '\n      </button>\n      <button type="button" class="video-snap-btn story-video-snap-btn story-video-clip-btn" data-story-action="trim-video" data-story-clip-id="' +
        escapeHtml2 +
        '" data-story-video-result-index="' +
        value94 +
        '" aria-label="裁剪视频" title="裁剪视频">\n        ' +
        VIDEO_CLIP_ICON_SVG +
        '\n      </button>',
    },
  });
}
function renderVideoPreview(value95, { isGenerating: isGenerating = ![] } = {}) {
  const list14 = getVideoResults(value95),
    activeVideoResultIndex3 = getActiveVideoResultIndex(value95, list14),
    value96 = list14[activeVideoResultIndex3] || {},
    videoResultUrl2 = resolveVideoResultUrl(value96),
    text8 = normalizeText(value95?.['generation']?.['status'])['toLowerCase'](),
    value97 = isGenerating || ['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](text8);
  if (value97)
    return (
      '<div class="story-video-empty story-video-loading" role="status" aria-live="polite" aria-busy="true">\n      ' +
      renderGenerationSpinner() +
      '\n      <strong>视频生成中</strong>\n      <p>正在等待生成结果，完成后会自动显示。</p>\n      <div class="storyboard-script-loading-bar" aria-hidden="true"><div class="storyboard-script-loading-bar-fill"></div></div>\n    </div>'
    );
  if (videoResultUrl2) {
    const value98 = list14['length'] > 1;
    return (
      '<div class="story-video-result" data-story-video-result-index="' +
      activeVideoResultIndex3 +
      '">\n      <div class="story-video-stage">\n        ' +
      (value98 ? renderVideoResultSwitchButton('previous', value95) : '') +
      '\n        <video data-story-video-player data-story-video-url="' +
      escapeHtml(videoResultUrl2) +
      '" playsinline preload="auto"></video>\n        ' +
      (value98 ? renderVideoResultSwitchButton('next', value95) : '') +
      '\n        ' +
      renderVideoPlaybackControls(value95, activeVideoResultIndex3) +
      '\n      </div>\n      <div class="story-video-result-meta"><strong>视频结果</strong><span>' +
      (activeVideoResultIndex3 + 1) +
      '/' +
      list14['length'] +
      '</span></div>\n    </div>'
    );
  }
  const value99 = value95?.['generation']?.['error'] || '',
    value100 = value99 ? 'story-video-empty story-video-error' : 'story-video-empty';
  return (
    '<div class="' +
    value100 +
    '">\n    <strong>视频结果</strong>\n    <p>' +
    escapeHtml(value99 || '生成完成后将在这里预览本片段视频。') +
    '</p>\n  </div>'
  );
}
function renderTimeline(
  value101,
  value102,
  {
    selectionMode: selectionMode = ![],
    selectedClipIds: selectedClipIds = [],
    pendingDeleteClipId: pendingDeleteClipId = '',
    generatingClipIds: generatingClipIds = [],
    adjustingClipIds: adjustingClipIds = [],
    modelId: modelId = '',
    generationParams: generationParams = {},
  } = {},
) {
  const list15 = Array['isArray'](value101?.['clips']) ? value101['clips'] : [],
    map7 = new Set(
      (Array['isArray'](selectedClipIds) ? selectedClipIds : [])['map']((value103) =>
        normalizeText(value103),
      ),
    ),
    map8 = new Set(
      (Array['isArray'](generatingClipIds) ? generatingClipIds : [])
        ['map']((value104) => normalizeText(value104))
        ['filter'](Boolean),
    );
  return (
    '<div class="story-clip-timeline ' +
    (selectionMode ? 'is-selection-mode' : '') +
    '">\n    <div class="story-clip-timeline-header">\n      <span>' +
    escapeHtml(value101?.['duration'] || '--:--') +
    '</span>\n      <small>' +
    (selectionMode ? '点击片段选择需要生成的视频' : '点击片段切换提示词和视频结果') +
    '</small>\n    </div>\n    <div class="story-clip-strip" data-story-marquee-surface="clips">\n      ' +
    list15['map']((value105, value106) => {
      const text9 = normalizeText(value105['id']),
        value107 = adjustingClipIds['includes'](text9),
        list16 = getVideoResults(value105),
        renderTimelineVideoThumbnail2 = renderTimelineVideoThumbnail(value105),
        text10 = normalizeText(value105?.['generation']?.['status'])['toLowerCase'](),
        enabled6 =
          map8['has'](text9) ||
          ['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](text10),
        value108 = map7['has'](text9),
        hidden = !enabled6 && normalizeText(pendingDeleteClipId) === text9,
        value109 =
          '<div class="story-clip-card-shell' +
          (enabled6 ? ' is-generating' : '') +
          (hidden ? ' is-delete-confirming' : '') +
          '" data-story-video-history="' +
          (list16['length'] > 1) +
          '" data-story-clip-id="' +
          escapeHtml(value105['id']) +
          '">\n          <button type="button" class="story-clip-card ' +
          (value105['id'] === value102 ? 'is-selected' : '') +
          ' ' +
          (selectionMode ? 'is-selection-mode' : '') +
          ' ' +
          (value108 ? 'is-checked' : '') +
          (renderTimelineVideoThumbnail2 ? ' has-video-thumbnail' : '') +
          '" data-story-clip-id="' +
          escapeHtml(value105['id']) +
          '" data-story-marquee-item data-story-marquee-id="' +
          escapeHtml(value105['id']) +
          '" aria-pressed="' +
          (selectionMode ? String(value108) : 'false') +
          '" aria-busy="' +
          enabled6 +
          '">\n            ' +
          (renderTimelineVideoThumbnail2
            ? '<span class="story-clip-card-media" aria-hidden="true">' +
              renderTimelineVideoThumbnail2 +
              '</span>'
            : '') +
          '\n            <span class="story-clip-card-copy"><strong>片段' +
          escapeHtml(String(value105['number'] || value106 + 1)['padStart'](2, '0')) +
          '</strong><small data-story-clip-duration="' +
          escapeHtml(value105['id']) +
          '">' +
          escapeHtml(formatStoryClipVideoGenerationDuration(value105, modelId, generationParams)) +
          '</small></span>\n          </button>\n          ' +
          (value107 && !enabled6
            ? '<span class="story-clip-card-adjusting generation-loading-surface" role="status" aria-busy="true" aria-label="正在调整提示词"><span class="generation-loading-shimmer" aria-hidden="true"></span><span class="generation-loading-label">正在调整提示词</span></span>'
            : '') +
          '\n          ' +
          (enabled6
            ? '<span class="story-clip-card-loading generation-loading-surface" role="status" aria-busy="true" aria-label="片段 ' +
              escapeHtml(value105['number']) +
              ' 视频生成中">' +
              renderGenerationSpinner() +
              '</span>'
            : selectionMode || value107
              ? ''
              : renderWorkspaceCardDeleteControl({
                  className: 'story-clip-delete-trigger',
                  ariaLabel: '删除片段 ' + value105['number'] + '：' + (value105['title'] || '未命名片段'),
                  actionAttributes: {
                    'data-story-action': 'request-delete-clip',
                    'data-story-clip-delete-id': value105['id'],
                    hidden: hidden,
                  },
                }) +
                '\n          <div class="story-project-delete-confirm story-clip-delete-confirm" ' +
                (hidden ? '' : 'hidden') +
                ' aria-label="确认删除片段 ' +
                escapeHtml(value105['number']) +
                '">\n            <button type="button" class="confirm-btn confirm-cancel" data-story-action="cancel-delete-clip" data-story-clip-delete-id="' +
                escapeHtml(value105['id']) +
                '">取消</button>\n            <button type="button" class="confirm-btn confirm-ok" data-story-action="confirm-delete-clip" data-story-clip-delete-id="' +
                escapeHtml(value105['id']) +
                '">删除</button>\n          </div>') +
          '\n        </div>';
      if (value106 >= list15['length'] - 1) return value109;
      const value110 = list15[value106 + 1];
      return (
        value109 +
        '<button type="button" class="story-clip-insert-button" data-story-insert-after-clip-id="' +
        escapeHtml(value105['id']) +
        '" aria-label="在片段 ' +
        escapeHtml(value105['number']) +
        ' 和片段 ' +
        escapeHtml(value110?.['number']) +
        ' 之间新增片段"><span aria-hidden="true">+</span></button>'
      );
    })['join']('') +
    '\n    </div>\n  </div>'
  );
}
function renderEpisode(selectionMode2 = {}, value111 = null, value112 = null) {
  const episode4 = value111 || getSelectedEpisode(selectionMode2),
    value113 = value112 || getSelectedClip(selectionMode2, episode4),
    assets2 = Array['isArray'](selectionMode2?.['data']?.['assets']) ? selectionMode2['data']['assets'] : [],
    clipFrames2 = Array['isArray'](selectionMode2?.['data']?.['clipFrames'])
      ? selectionMode2['data']['clipFrames']
      : [],
    voiceAssetIds3 = resolveStoryVideoReplicationClipVoiceAssetIds(selectionMode2?.['data'], value113);
  return {
    get referenceCounts() {
      return getUsedReferenceCounts(value113, {
        assets: assets2,
        episode: episode4,
        clipFrames: clipFrames2,
        voiceAssetIds: voiceAssetIds3,
      });
    },
    get referenceSummary() {
      return renderReferenceSummary(value113, {
        assets: assets2,
        episode: episode4,
        clipFrames: clipFrames2,
        voiceAssetIds: voiceAssetIds3,
      });
    },
    get referenceBar() {
      return renderVideoReferenceBarMarkup({
        ...getClipInputSurface(selectionMode2, episode4, value113),
        attachmentButtonHtml: '',
      });
    },
    get selectionControls() {
      return renderSelectionControls(selectionMode2, episode4, value113);
    },
    get adjustmentBar() {
      return renderAdjustmentBar(selectionMode2, value113, episode4);
    },
    get adjustmentControl() {
      return renderAdjustmentControl(selectionMode2, value113, episode4);
    },
    get promptSurface() {
      return renderPromptSurface(selectionMode2, episode4, value113);
    },
    get videoPreview() {
      const isGenerating2 = getGenerationState(selectionMode2, episode4);
      return renderVideoPreview(value113, {
        isGenerating: isGenerating2['generatingClipIds']['includes'](normalizeText(value113?.['id'])),
      });
    },
    get videoResults() {
      return getVideoResults(value113);
    },
    get activeVideoResultIndex() {
      return getActiveVideoResultIndex(value113);
    },
    get videoHistoryMenu() {
      return renderVideoHistoryMenu(value113);
    },
    getAdjacentVideoResultIndex(value114) {
      return getAdjacentVideoResultIndex(value113, value114);
    },
    get timeline() {
      const generatingClipIds4 = getGenerationState(selectionMode2, episode4);
      return renderTimeline(episode4, value113?.['id'], {
        selectionMode: selectionMode2?.['clipSelectionMode'],
        selectedClipIds: selectionMode2?.['selectedClipGenerationIds'],
        pendingDeleteClipId: selectionMode2?.['pendingDeleteClipId'],
        generatingClipIds: generatingClipIds4['generatingClipIds'],
        adjustingClipIds: (episode4?.['clips'] || [])
          ['filter']((value115) => isStoryClipAdjustmentGenerating(selectionMode2, episode4, value115))
          ['map']((value116) => value116['id']),
        modelId: selectionMode2?.['models']?.['video'],
        generationParams: selectionMode2?.['videoGenerationParams'],
      });
    },
  };
}
function createRuntime({
  state: state2,
  projectAdapter: projectAdapter = {},
  generationAdapter: generationAdapter = {},
  projectionAdapter: projectionAdapter = {},
} = {}) {
  if (!state2 || typeof state2 !== 'object') throw new Error('[storyClipProduction] state is required');
  if (typeof projectAdapter['createToken'] !== 'function')
    throw new Error('[storyClipProduction] projectAdapter.createToken is required');
  if (typeof generationAdapter['createController'] !== 'function')
    throw new Error('[storyClipProduction] generationAdapter.createController is required');
  const map9 = generationAdapter['controllers'] instanceof Map ? generationAdapter['controllers'] : new Map(),
    map10 = new Map(),
    handler4 = (value117) => projectAdapter['isLive']?.(value117) !== ![],
    handler5 = (value118) => projectAdapter['isCurrent']?.(value118) !== ![],
    handler6 = (value119, value120, value121) =>
      [value119?.['projectId'], value120?.['id'], value121?.['id']]['map'](normalizeText)['join'](':'),
    handler7 = (value122, value123) =>
      [value122?.['projectId'], value123?.['id']]['map'](normalizeText)['join'](':'),
    handler8 = () => {
      if (projectionAdapter['refreshGeneration']?.() === !![]) return !![];
      return (projectionAdapter['render']?.(), ![]);
    };
  function run2({ episode: episode5, clip: clip2, projectToken: projectToken }) {
    return {
      ok: ![],
      cancelled: !![],
      reason: 'batch-cancelled',
      projectToken: projectToken,
      episodeId: episode5?.['id'] || '',
      clipId: clip2?.['id'] || '',
    };
  }
  function run3({
    episode: episode6,
    clip: clip3,
    displayedClip: displayedClip,
    projectToken: projectToken2,
  }) {
    const prompt =
        generationAdapter['resolvePrompt']?.({
          state: state2,
          episode: episode6,
          clip: clip3,
          displayedClip: displayedClip,
          projectToken: projectToken2,
        }) || {},
      modelId3 =
        generationAdapter['resolveSettings']?.({
          state: state2,
          episode: episode6,
          clip: clip3,
          projectToken: projectToken2,
        }) || {};
    return {
      projectId: projectToken2['projectId'],
      episodeId: episode6['id'],
      modelId: modelId3['modelId'],
      provider: modelId3['provider'],
      providerProfileId: modelId3['providerProfileId'],
      prompt: prompt['prompt'],
      generationParams: modelId3['generationParams'],
      inputs: clip3['inputs'],
      assetInputRefs: prompt['assetInputRefs'],
    };
  }
  function previewSelection() {
    const episode7 = getSelectedEpisode(state2),
      displayedClip2 = getSelectedClip(state2, episode7),
      clip4 = state2['clipSelectionMode']
        ? selectBatchTargets(episode7?.['clips'], state2['selectedClipGenerationIds'])
        : [displayedClip2];
    if (!episode7 || !clip4[0]) throw new Error('请先选择片段');
    const value124 = run3({
      episode: episode7,
      clip: clip4[0],
      displayedClip: displayedClip2,
      projectToken: projectAdapter['createToken'](),
    });
    return buildStoryClipVideoPayload(value124);
  }
  async function run4({
    episode: episode8,
    clip: clip5,
    displayedClip: displayedClip3,
    projectToken: projectToken3,
    batch: batch = null,
    batchRun: batchRun = null,
  }) {
    if (batchRun?.['cancelRequested'])
      return run2({ episode: episode8, clip: clip5, projectToken: projectToken3 });
    const value125 = handler6(projectToken3, episode8, clip5);
    if (
      !episode8 ||
      !clip5 ||
      getGenerationState(state2, episode8)['generatingClipIds']['includes'](normalizeText(clip5['id'])) ||
      getRecoverableStoryClipVideoTask(clip5) ||
      map9['has'](value125)
    )
      return { ok: ![], reason: 'unavailable' };
    let enabled7 = null,
      modelId4 = '',
      provider = '';
    try {
      const args4 = run3({
        episode: episode8,
        clip: clip5,
        displayedClip: displayedClip3,
        projectToken: projectToken3,
      });
      if (!normalizeText(args4['prompt'])) return { ok: ![], reason: 'empty-prompt' };
      const value126 = args4;
      ((modelId4 = normalizeText(value126['modelId'])), (provider = normalizeText(value126['provider'])));
      const installId = normalizeText(
        await generationAdapter['resolveInstallId']?.({
          state: state2,
          episode: episode8,
          clip: clip5,
          projectToken: projectToken3,
          modelId: modelId4,
          provider: provider,
        }),
      );
      if (batchRun?.['cancelRequested'])
        return run2({ episode: episode8, clip: clip5, projectToken: projectToken3 });
      enabled7 = generationAdapter['createController']({
        state: state2,
        episode: episode8,
        clip: clip5,
        projectToken: projectToken3,
        batch: batch,
      });
      if (!enabled7 || typeof enabled7['generate'] !== 'function')
        throw new Error('story clip generation controller is unavailable');
      (map9['set'](value125, enabled7), batchRun?.['controllers']['add'](enabled7));
      if (batchRun?.['cancelRequested'])
        return run2({ episode: episode8, clip: clip5, projectToken: projectToken3 });
      projectAdapter['register']?.(projectToken3);
      handler5(projectToken3) && (setClipGenerationRunning(state2, clip5['id'], !![]), handler8());
      const result3 = await enabled7['generate']({ ...args4, installId: installId });
      if (!handler4(projectToken3))
        return { ok: ![], reason: 'stale-project', modelId: modelId4, provider: provider };
      const text11 = normalizeText(result3?.['status'])['toLowerCase']();
      if (
        batchRun?.['cancelRequested'] &&
        (result3?.['ok'] === ![] || ['cancelled', 'canceled', 'paused']['includes'](text11))
      )
        return run2({ episode: episode8, clip: clip5, projectToken: projectToken3 });
      if (result3?.['ok'] === ![] || ['cancelled', 'canceled', 'error', 'failed']['includes'](text11)) {
        const error4 = result3?.['error'],
          error5 =
            error4 instanceof Error
              ? error4
              : new Error(normalizeText(error4?.['message'] || error4) || '片段视频生成失败');
        return {
          ok: ![],
          type: 'single-failed',
          error: error5,
          projectToken: projectToken3,
          episodeId: episode8['id'],
          clipId: clip5['id'],
          modelId: modelId4,
          provider: provider,
        };
      }
      return (
        await projectionAdapter['persist']?.({ immediate: !![] }),
        {
          ok: !![],
          type: 'single-complete',
          result: result3,
          projectToken: projectToken3,
          episodeId: episode8['id'],
          clipId: clip5['id'],
          modelId: modelId4,
          provider: provider,
        }
      );
    } catch (error6) {
      if (!handler4(projectToken3))
        return { ok: ![], reason: 'stale-project', modelId: modelId4, provider: provider };
      if (batchRun?.['cancelRequested'])
        return run2({ episode: episode8, clip: clip5, projectToken: projectToken3 });
      return {
        ok: ![],
        type: 'single-failed',
        error: error6,
        projectToken: projectToken3,
        episodeId: episode8?.['id'] || '',
        clipId: clip5?.['id'] || '',
        modelId: modelId4,
        provider: provider,
      };
    } finally {
      enabled7 && map9['get'](value125) === enabled7 && map9['delete'](value125);
      if (enabled7) batchRun?.['controllers']['delete'](enabled7);
      enabled7 &&
        handler5(projectToken3) &&
        (setClipGenerationRunning(state2, clip5?.['id'], ![]), handler8());
    }
  }
  async function run5({ episode: episode9, targets: targets, projectToken: projectToken4 }) {
    const map11 = new Set(targets['map']((value127) => normalizeText(value127?.['id']))['filter'](Boolean)),
      batch2 = projectAdapter['createBatch']?.('clip-videos', {
        episodeId: episode9['id'],
        total: targets['length'],
        completed: 0,
        targetClipIds: [...map11],
        pendingClipIds: [...map11],
        label: '批量生成 0/' + targets['length'],
      }) || {
        id: 'clip-videos:' + normalizeText(projectToken4?.['projectId']) + ':' + Date['now'](),
        type: 'clip-videos',
        episodeId: episode9['id'],
        total: targets['length'],
        completed: 0,
      },
      batchRun2 = {
        batch: batch2,
        projectToken: projectToken4,
        episodeId: normalizeText(episode9['id']),
        controllers: new Set(),
        cancelRequested: ![],
      },
      value128 = handler7(projectToken4, episode9);
    (map10['set'](value128, batchRun2),
      setEpisodeBatchRunning(state2, episode9['id'], !![], '批量生成 0/' + targets['length'], {
        batchId: batch2['id'],
        cancelRequested: ![],
      }));
    let succeeded = 0,
      failed = 0,
      cancelled = 0,
      firstFailure = null,
      suppressToast = ![];
    handler8();
    try {
      await runBatch(
        targets,
        (clip6) =>
          run4({
            episode: episode9,
            clip: clip6,
            displayedClip: null,
            projectToken: projectToken4,
            batch: batch2,
            batchRun: batchRun2,
          }),
        {
          onProgress: ({ completed: completed3, total: total3, target: target3, result: result4 }) => {
            if (!handler4(projectToken4)) return;
            map11['delete'](normalizeText(target3?.['id']));
            const label2 = batchRun2['cancelRequested']
              ? '正在停止批量生成 · 已结束 ' + completed3 + '/' + total3
              : '批量生成 ' + completed3 + '/' + total3;
            projectAdapter['syncBatch']?.(projectToken4, batch2, {
              completed: completed3,
              pendingClipIds: [...map11],
              cancelRequested: batchRun2['cancelRequested'],
              label: label2,
            });
            if (result4?.['ok']) succeeded += 1;
            else
              result4?.['cancelled'] || result4?.['reason'] === 'batch-cancelled'
                ? (cancelled += 1)
                : ((failed += 1),
                  (firstFailure ||= result4),
                  !suppressToast &&
                    result4?.['error'] &&
                    (suppressToast =
                      projectionAdapter['present']?.({
                        type: 'provider-error',
                        error: result4['error'],
                        modelId: result4['modelId'],
                        provider: result4['provider'],
                      }) === !![]));
            handler5(projectToken4) &&
              (setEpisodeBatchRunning(state2, episode9['id'], !![], label2, {
                batchId: batch2['id'],
                cancelRequested: batchRun2['cancelRequested'],
              }),
              handler8());
          },
        },
      );
    } finally {
      (map10['get'](value128) === batchRun2 && map10['delete'](value128),
        handler5(projectToken4) &&
          (setEpisodeBatchRunning(state2, episode9['id'], ![]),
          await projectionAdapter['persist']?.({ immediate: !![] }),
          handler8()));
    }
    if (!handler4(projectToken4)) return ![];
    return (
      projectionAdapter['present']?.({
        type: 'batch-complete',
        projectToken: projectToken4,
        episodeId: episode9['id'],
        clipId: targets[0]?.['id'] || '',
        succeeded: succeeded,
        failed: failed,
        cancelled: cancelled,
        cancelRequested: batchRun2['cancelRequested'],
        firstFailure: firstFailure,
        suppressToast: suppressToast,
      }),
      succeeded > 0
    );
  }
  async function cancelBatch() {
    const selectedEpisode = getSelectedEpisode(state2),
      episodeId2 = normalizeText(selectedEpisode?.['id']),
      projectToken5 = projectAdapter['createToken'](),
      value129 = handler7(projectToken5, selectedEpisode);
    let batchId = map10['get'](value129);
    if (!batchId) {
      const id2 = state2['clipBatchGenerationByEpisode']?.[episodeId2],
        value130 = value129 + ':',
        controllers = new Set(
          [...map9['entries']()]
            ['filter'](([value131]) => normalizeText(value131)['startsWith'](value130))
            ['map'](([, value132]) => value132),
        );
      if (!id2?.['batchId'] || !controllers['size']) return ![];
      batchId = {
        batch: { id: id2['batchId'], type: 'clip-videos', episodeId: episodeId2 },
        projectToken: projectToken5,
        episodeId: episodeId2,
        controllers: controllers,
        cancelRequested: id2['cancelRequested'] === !![],
      };
    }
    if (!batchId || batchId['cancelRequested']) return ![];
    batchId['cancelRequested'] = !![];
    const label3 = '正在停止批量生成';
    return (
      projectAdapter['syncBatch']?.(batchId['projectToken'], batchId['batch'], {
        type: 'clip-videos-stopped',
        cancelRequested: !![],
        pendingClipIds: [],
        label: label3,
      }),
      handler5(batchId['projectToken']) &&
        (setEpisodeBatchRunning(state2, episodeId2, !![], label3, {
          batchId: batchId['batch']['id'],
          cancelRequested: !![],
        }),
        handler8()),
      await Promise['allSettled'](
        [...batchId['controllers']]['map']((value133) => {
          if (typeof value133?.['cancel'] === 'function') return value133['cancel']();
          return value133?.['pause']?.();
        }),
      ),
      !![]
    );
  }
  async function generateSelection() {
    const episode10 = getSelectedEpisode(state2),
      generationState2 = getGenerationState(state2, episode10);
    if (generationState2['isBatchGenerating']) return ![];
    const displayedClip4 = getSelectedClip(state2, episode10),
      targets2 = state2['clipSelectionMode']
        ? selectBatchTargets(episode10?.['clips'], state2['selectedClipGenerationIds'])
        : [];
    if (state2['clipSelectionMode'] && targets2['length'] > 1) {
      if (generationState2['busy']) return ![];
      return run5({
        episode: episode10,
        targets: targets2,
        projectToken: projectAdapter['createToken'](),
      });
    }
    const clip7 = state2['clipSelectionMode'] ? targets2[0] : displayedClip4;
    if (!clip7) return (projectionAdapter['present']?.({ type: 'selection-missing' }), ![]);
    const projectToken6 = projectAdapter['createToken'](),
      response7 = await run4({
        episode: episode10,
        clip: clip7,
        displayedClip: displayedClip4,
        projectToken: projectToken6,
      });
    if (response7['reason'] === 'empty-prompt')
      return (projectionAdapter['present']?.({ ...response7, type: 'empty-prompt' }), ![]);
    if (response7['type']) projectionAdapter['present']?.(response7);
    return response7['ok'] === !![];
  }
  return Object['freeze']({
    generateSelection: generateSelection,
    previewSelection: previewSelection,
    cancelBatch: cancelBatch,
  });
}
export const storyClipProduction = Object['freeze']({
  createRuntime: createRuntime,
  getAdjacentClipId: getAdjacentClipId,
  getInputReferenceCounts: getInputReferenceCounts,
  removeVideoResult: removeVideoResult,
  renderTimelineVideoThumbnail: renderTimelineVideoThumbnail,
  selectBatchTargets: selectBatchTargets,
  runBatch: runBatch,
  getGenerationState: getGenerationState,
  setClipGenerationRunning: setClipGenerationRunning,
  setEpisodeBatchRunning: setEpisodeBatchRunning,
  shouldCloseAdjustmentOnOutsideClick: shouldCloseAdjustmentOnOutsideClick,
  shouldClosePromptHistoryOnOutsideClick: shouldClosePromptHistoryOnOutsideClick,
  renderEpisode: renderEpisode,
});
