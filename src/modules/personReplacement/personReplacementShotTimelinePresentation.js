import { VIDEO_CLIP_ICON_SVG } from '../../components/nodeToolbar/videoToolbarHtml.js';
import {
  getMediaClipTimelineRangeRect,
  getMediaClipTimelineTrackWidthPx,
} from '../../components/media-clip/mediaClipTimelineModel.js';
import { formatDurationLabel } from '../../components/media-clip/mediaClipUtils.js';
import { resolveMediaClipReverseControlState } from '../../components/media-clip/mediaClipReverseControl.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  renderWorkspaceActionIcon,
  renderWorkspaceConfirmIcon,
  renderWorkspaceKeyframeIcon,
} from '../workspaceActionIcons.js';
import {
  renderWorkspaceAssetLoadingOverlay,
  renderWorkspaceCardDeleteControl,
} from '../workspaceAssetPresentation.js';
import { renderWorkspaceMediaHistoryMenu } from '../workspaceMediaHistory.js';
import {
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementActiveVideoResultIndex,
  getPersonReplacementImageResults,
  getPersonReplacementVideoResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementVideoResultRef,
} from './personReplacementProject.js';
import { resolvePersonReplacementImageGenerationState } from './personReplacementImageGeneration.js';
import {
  isPersonReplacementVideoGenerationActive,
  resolvePersonReplacementVideoGenerationState,
} from './personReplacementVideoGeneration.js';
import {
  renderPersonReplacementAssetCard,
  renderPersonReplacementBatchGenerationControl,
} from './personReplacementAssetPresentation.js';
import {
  PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
  PERSON_REPLACEMENT_CUT_MIN_SEC,
  canMergePersonReplacementShotCutRanges,
  canSplitPersonReplacementShotCutRange,
  countEditablePersonReplacementShotCuts,
  createPersonReplacementShotCutDraft,
  getPersonReplacementShotCutDisplayDuration,
  getPersonReplacementShotCutFrameSec,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTimelineSec,
  getPersonReplacementShotCutTotalDuration,
  getPersonReplacementShotDurationSec,
  hasPersonReplacementShotCutUpdateChanges,
} from './personReplacementShotCutModel.js';
import {
  getPersonReplacementShotCutRulerFrameRate,
  hasSplittablePersonReplacementShotCut,
  renderPersonReplacementShotCutFilmstrip,
  renderPersonReplacementShotCutRulerTicks,
} from './personReplacementShotCutRendering.js';
import { resolveShotCutSubmissionUi } from './personReplacementShotReverse.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(item, key = '') {
  const index = String(item ?? '')['trim']();
  return index || key;
}
function normalizeMediaUrl(result) {
  const text = normalizeText(result);
  return text ? localPathToUrl(text) || text : '';
}
function clamp(data, options, target, source = options) {
  const next = Number(data);
  return Number['isFinite'](next) ? Math['min'](target, Math['max'](options, next)) : source;
}
function formatClock(current) {
  const entry = Math['max'](0x0, Number(current) || 0x0),
    record = Math['floor'](entry / 0x3c),
    payload = Math['floor'](entry % 0x3c);
  return String(record)['padStart'](0x2, '0') + ':' + String(payload)['padStart'](0x2, '0');
}
function formatPreciseClock(handle) {
  const state = Math['max'](0x0, Number(handle) || 0x0),
    config = Math['floor'](state / 0x3c),
    scope = state - config * 0x3c;
  return String(config)['padStart'](0x2, '0') + ':' + scope['toFixed'](0x2)['padStart'](0x5, '0');
}
function resolvePersonReplacementVideoResultPosterRef(enabled = {}) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled)) return '';
  return (
    [
      enabled['posterUrl'],
      enabled['thumbUrl'],
      enabled['thumbnailUrl'],
      enabled['coverUrl'],
      enabled['posterLocalPath'],
      enabled['thumbLocalPath'],
      enabled['thumbnailLocalPath'],
    ]
      ['map']((input) => normalizeText(input))
      ['find'](Boolean) || ''
  );
}
function renderShotTimelineVideoMedia({
  shot: shot = {},
  title: title = '镜头片段',
  resultRef: resultRef = '',
  resultPosterRef: resultPosterRef = '',
} = {}) {
  const text2 = normalizeText(resultRef),
    enabled2 = text2 || normalizeText(shot['videoRef']) || normalizeText(shot['sourceVideoRef']);
  if (!enabled2) return '';
  const output = text2 ? 'result' : 'source',
    value2 = text2 ? normalizeText(resultPosterRef) : normalizeText(shot['keyframeRef']),
    mediaUrl = normalizeMediaUrl(enabled2),
    mediaUrl2 = normalizeMediaUrl(value2),
    value3 = output === 'result' ? title + '替换视频结果' : title + '原视频片段';
  return (
    '<video class="story-asset-card-image person-replacement-shot-card-video" data-person-replacement-shot-card-video="' +
    output +
    '" src="' +
    escapeHtml(mediaUrl) +
    '\x22' +
    (mediaUrl2 ? ' poster="' + escapeHtml(mediaUrl2) + '\x22' : '') +
    '\x20muted\x20playsinline\x20preload=\x22metadata\x22\x20aria-label=\x22' +
    escapeHtml(value3) +
    '" draggable="false"></video>'
  );
}
function renderReplacementResultReferenceButton(options2 = {}, value4 = 0x0, value5 = 'image') {
  const value6 = value5 === 'video',
    value7 = value6 ? getPersonReplacementVideoResults(options2) : getPersonReplacementImageResults(options2),
    value8 = value7[value4],
    enabled3 = value6
      ? resolvePersonReplacementVideoResultRef(value8)
      : resolvePersonReplacementImageResultRef(value8);
  if (!enabled3) return '';
  const value9 =
      enabled3 ===
      normalizeText(
        value6 ? options2?.['videoIterationReferenceRef'] : options2?.['imageIterationReferenceRef'],
      ),
    value10 = value6 ? '视频' : '图片',
    value11 = value9
      ? '取消' + value10 + '\x20' + (value4 + 0x1) + ' 的参考'
      : '将' + value10 + '\x20' + (value4 + 0x1) + ' 设为参考',
    value12 = value9
      ? '再次点击取消下一轮参考'
      : value6
        ? '设为下一轮视频替换的原视频'
        : '设为下一轮图像替换的参考';
  return (
    '<button type="button" class="story-base-appearance-button person-replacement-result-reference-button' +
    (value9 ? ' is-active' : '') +
    '" data-story-action="set-replacement-' +
    value5 +
    '-reference" data-shot-id="' +
    escapeHtml(options2?.['id']) +
    '\x22\x20data-replacement-' +
    value5 +
    '-result-index="' +
    value4 +
    '" aria-pressed="' +
    value9 +
    '" aria-label="' +
    escapeHtml(value11) +
    '\x22\x20title=\x22' +
    escapeHtml(value12) +
    '\x22>' +
    (value9 ? '参考中' : '设为参考') +
    '</button>'
  );
}
function renderReplacementImageHistoryMenu(
  options3 = {},
  title2 = '镜头片段',
  { allowSingleResult: allowSingleResult = ![] } = {},
) {
  const results = getPersonReplacementImageResults(options3),
    activeIndex = getPersonReplacementActiveImageResultIndex(options3, results);
  return renderWorkspaceMediaHistoryMenu({
    title: title2,
    results: results,
    activeIndex: activeIndex,
    minimumItemCount: allowSingleResult ? 0x1 : 0x2,
    countLabel: results['length'] + ' 张图片',
    menuLabel: title2 + '替换图片',
    getItemLabel: (value13, value14) => '图片 ' + (value14 + 0x1),
    getItemStatus: (value15, value16) => (value16 === activeIndex ? '当前使用' : '点击切换'),
    renderMedia: (value17, value18) => {
      const personReplacementImageResultRef = resolvePersonReplacementImageResultRef(value17);
      return personReplacementImageResultRef
        ? '<img class="story-media-history-thumbnail story-clip-video-history-thumbnail" src="' +
            escapeHtml(normalizeMediaUrl(personReplacementImageResultRef)) +
            '" alt="' +
            escapeHtml(title2 + ' · 图片 ' + (value18 + 0x1)) +
            '" loading="lazy" draggable="false">'
        : '';
    },
    getItemAttributes: (value19, value20) =>
      'data-story-action="select-replacement-image-result" data-shot-id="' +
      escapeHtml(options3?.['id']) +
      '" data-replacement-image-result-index="' +
      value20 +
      '\x22',
    renderItemAction: (value21, value22) =>
      '' +
      renderReplacementResultReferenceButton(options3, value22) +
      (results['length'] > 0x1
        ? renderWorkspaceCardDeleteControl({
            className: 'story-media-history-delete',
            ariaLabel: '删除图片\x20' + (value22 + 0x1),
            actionAttributes: {
              'data-story-action': 'delete-replacement-image-result',
              'data-shot-id': options3?.['id'],
              'data-replacement-image-result-index': value22,
            },
          })
        : ''),
  });
}
function renderReplacementVideoHistoryMenu(
  options4 = {},
  title3 = '镜头片段',
  { allowSingleResult: allowSingleResult = ![] } = {},
) {
  const results2 = getPersonReplacementVideoResults(options4),
    activeIndex2 = getPersonReplacementActiveVideoResultIndex(options4, results2);
  return renderWorkspaceMediaHistoryMenu({
    title: title3,
    results: results2,
    activeIndex: activeIndex2,
    minimumItemCount: allowSingleResult ? 0x1 : 0x2,
    countLabel: results2['length'] + ' 个视频',
    menuLabel: title3 + '替换结果视频',
    getItemLabel: (value23, value24) => '视频 ' + (value24 + 0x1),
    getItemStatus: (value25, value26) => (value26 === activeIndex2 ? '当前播放' : '点击切换'),
    renderMedia: (value27, value28) => {
      const personReplacementVideoResultPosterRef = resolvePersonReplacementVideoResultPosterRef(value27);
      if (personReplacementVideoResultPosterRef)
        return (
          '<img\x20class=\x22story-media-history-thumbnail\x20story-clip-video-history-thumbnail\x22\x20src=\x22' +
          escapeHtml(normalizeMediaUrl(personReplacementVideoResultPosterRef)) +
          '" alt="' +
          escapeHtml(title3 + ' · 视频 ' + (value28 + 0x1)) +
          '" loading="lazy" draggable="false">'
        );
      const personReplacementVideoResultRef = resolvePersonReplacementVideoResultRef(value27);
      return personReplacementVideoResultRef
        ? '<video class="story-media-history-thumbnail story-clip-video-history-thumbnail" src="' +
            escapeHtml(normalizeMediaUrl(personReplacementVideoResultRef)) +
            '" aria-label="' +
            escapeHtml(title3 + ' · 视频 ' + (value28 + 0x1)) +
            '" muted playsinline preload="metadata"></video>'
        : '';
    },
    getItemAttributes: (value29, value30) =>
      'data-story-action="select-replacement-video-result" data-shot-id="' +
      escapeHtml(options4?.['id']) +
      '\x22\x20data-replacement-video-result-index=\x22' +
      value30 +
      '\x22',
    renderItemAction: (value31, value32) =>
      '' +
      renderReplacementResultReferenceButton(options4, value32, 'video') +
      (results2['length'] > 0x1
        ? renderWorkspaceCardDeleteControl({
            className: 'story-media-history-delete',
            ariaLabel: '删除视频 ' + (value32 + 0x1),
            actionAttributes: {
              'data-story-action': 'delete-replacement-video-result',
              'data-shot-id': options4?.['id'],
              'data-replacement-video-result-index': value32,
            },
          })
        : ''),
  });
}
function renderShotTimeline(
  selectedAssetId,
  {
    allowCutEditing: allowCutEditing = ![],
    mode: mode = 'image',
    isBatchGenerating: isBatchGenerating = ![],
    batchGeneratingShotIds: batchGeneratingShotIds = [],
    batchCancelRequested: batchCancelRequested = ![],
  } = {},
) {
  const name = mode === 'video',
    list = Array['isArray'](selectedAssetId['shots']) ? selectedAssetId['shots'] : [],
    value33 = list['reduce'](
      (value34, value35) => value34 + getPersonReplacementShotDurationSec(value35),
      0x0,
    ),
    personReplacementShotCutDraft = createPersonReplacementShotCutDraft(selectedAssetId),
    countEditablePersonReplacementShotCuts2 = countEditablePersonReplacementShotCuts(
      personReplacementShotCutDraft,
    ),
    value36 =
      countEditablePersonReplacementShotCuts2 > 0x0 ||
      hasSplittablePersonReplacementShotCut(personReplacementShotCutDraft),
    selectedAssetIds = selectedAssetId['workspace']['selectedShotIds'],
    value37 = list['length'] > 0x0 && list['every']((value38) => selectedAssetIds['includes'](value38['id'])),
    args = name
      ? list['filter']((value39) =>
          isPersonReplacementVideoGenerationActive(
            resolvePersonReplacementVideoGenerationState(selectedAssetId['workspace'], value39['id']),
          ),
        )['map']((value40) => normalizeText(value40['id']))
      : list['filter'](
          (value41) =>
            resolvePersonReplacementImageGenerationState(selectedAssetId['workspace'], value41['id'])[
              'status'
            ] === 'running',
        )['map']((value42) => normalizeText(value42['id'])),
    generatingAppearanceKeys = [
      ...new Set(
        [...(Array['isArray'](batchGeneratingShotIds) ? batchGeneratingShotIds : []), ...args]
          ['map'](normalizeText)
          ['filter'](Boolean),
      ),
    ],
    batchGenerationActionLabel = name
      ? selectedAssetIds['length'] > 0x1
        ? '批量生成视频'
        : '生成视频'
      : selectedAssetIds['length'] > 0x1
        ? '批量生成替换图'
        : '生成替换图',
    value43 = {
      data: { assets: [], project: {} },
      assetFilter: 'scene',
      selectedAssetId: selectedAssetId['workspace']['selectedShotId'],
      selectedAssetIds: selectedAssetIds,
      assetSelectionMode: selectedAssetId['workspace']['shotSelectionMode'],
      assetAppearanceIndexes: {},
      generatingAppearanceKeys: generatingAppearanceKeys['map']((value44) => value44 + ':keyframe'),
      isBatchGenerating: isBatchGenerating,
      batchGenerationActionLabel: batchGenerationActionLabel,
      batchCancelAction: 'cancel-shot-batch-generation',
      batchCancelRequested: batchCancelRequested,
      batchGeneratingAssetIds: isBatchGenerating ? generatingAppearanceKeys : [],
      allowDeleteAssetCard: ![],
      allowAssetRename: ![],
      hideAssetRoleTag: !![],
      hideAssetNameTooltip: !![],
    },
    value45 =
      (allowCutEditing
        ? '<button type="button" class="story-secondary-button person-replacement-shot-split-trigger is-icon-only" data-person-replacement-action="edit-shot-cuts" data-tooltip="剪辑全部切口" aria-label="剪辑全部切口" ' +
          (value36 ? '' : 'disabled') +
          '>' +
          VIDEO_CLIP_ICON_SVG +
          '</button>'
        : '') +
      '<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x22\x20data-story-action=\x22toggle-all-shots\x22\x20aria-pressed=\x22' +
      value37 +
      '\x22\x20' +
      (list['length'] ? '' : 'disabled') +
      '>' +
      (value37 ? '取消全选' : '全选') +
      '</button>' +
      (selectedAssetId['workspace']['shotSelectionMode'] || isBatchGenerating
        ? renderPersonReplacementBatchGenerationControl(value43)
        : ''),
    value46 = list['map']((shot2, value47) => {
      const title4 = '片段' + String(value47 + 0x1)['padStart'](0x2, '0'),
        list2 = getPersonReplacementImageResults(shot2),
        personReplacementActiveImageResultIndex = getPersonReplacementActiveImageResultIndex(shot2, list2),
        personReplacementImageResultRef2 = resolvePersonReplacementImageResultRef(
          list2[personReplacementActiveImageResultIndex],
        ),
        list3 = name ? getPersonReplacementVideoResults(shot2) : [],
        value48 = name ? getPersonReplacementActiveVideoResultIndex(shot2, list3) : 0x0,
        value49 = list3[value48] || null,
        resultRef2 =
          resolvePersonReplacementVideoResultRef(value49) || normalizeText(shot2['resultVideoRef']),
        resultPosterRef2 = resolvePersonReplacementVideoResultPosterRef(value49),
        imageUrl = normalizeMediaUrl(
          name
            ? resultPosterRef2 || shot2['keyframeRef']
            : personReplacementImageResultRef2 || shot2['keyframeRef'],
        ),
        cardMediaHtml = name
          ? renderShotTimelineVideoMedia({
              shot: shot2,
              title: title4,
              resultRef: resultRef2,
              resultPosterRef: resultPosterRef2,
            })
          : '',
        formatClock2 = formatClock(shot2['startTimeSec']) + '–' + formatClock(shot2['endTimeSec']),
        value50 = name ? resultRef2 : shot2['replacementImageRef'],
        statusText = value50 ? formatClock2 + ' · 已生成' : formatClock2,
        count = (name ? list3 : list2)['length'],
        value51 = name
          ? 'data-person-replacement-video-history="' + (list3['length'] > 0x1) + '\x22'
          : 'data-person-replacement-image-history="' + (list2['length'] > 0x1) + '\x22',
        accessoryHtml =
          !selectedAssetId['workspace']['shotSelectionMode'] && (name ? list3 : list2)['length'] === 0x1
            ? renderReplacementResultReferenceButton(shot2, 0x0, name ? 'video' : 'image')
            : '',
        value52 =
          count > 0x1
            ? '<button type="button" class="person-replacement-shot-result-count" data-person-replacement-result-history-toggle data-shot-id="' +
              escapeHtml(shot2['id']) +
              '" data-result-count="' +
              count +
              '" aria-expanded="false" aria-label="展开' +
              count +
              ' 个结果" title="查看 ' +
              count +
              ' 个生成结果"' +
              (selectedAssetId['workspace']['shotSelectionMode'] ? '\x20disabled' : '') +
              '>' +
              renderWorkspaceActionIcon('results') +
              '<span>' +
              count +
              '</span></button>'
            : '';
      return renderPersonReplacementAssetCard(
        value43,
        {
          id: shot2['id'],
          kind: 'scene',
          name: title4,
          description: '',
          imageUrl: imageUrl,
          appearances: [
            { id: 'keyframe', name: name && resultRef2 ? '替换结果视频' : '检测帧', imageUrl: imageUrl },
          ],
        },
        {
          statusText: statusText,
          cardMediaHtml: cardMediaHtml,
          cardClassName: 'person-replacement-shot-card',
          cardAttributes:
            'data-person-replacement-shot-card="true" data-shot-id="' +
            escapeHtml(shot2['id']) +
            '\x22\x20' +
            value51 +
            ' aria-current="' +
            (shot2['id'] === selectedAssetId['workspace']['selectedShotId'] ? 'true' : 'false') +
            '" aria-label="' +
            escapeHtml(
              title4 +
                '，' +
                formatClock(shot2['startTimeSec']) +
                ' 到 ' +
                formatClock(shot2['endTimeSec']) +
                (value50 ? (name ? '，替换视频已生成' : '，替换图已生成') : ''),
            ) +
            '\x22',
          shellClassName: [
            accessoryHtml || value52 ? 'person-replacement-shot-card-shell' : '',
            accessoryHtml ? 'has-reference-control' : '',
            value52 ? 'has-result-count-control' : '',
          ]
            ['filter'](Boolean)
            ['join']('\x20'),
          accessoryHtml: accessoryHtml + value52,
          preserveShell: !![],
        },
      );
    })['join'](''),
    value53 = selectedAssetId['workspace']['shotSelectionMode']
      ? '已选择 ' + selectedAssetIds['length'] + '\x20项'
      : '',
    value54 = value53 ? '<small>' + value53 + '</small>' : '',
    value55 = 'data-story-marquee-surface="shots" tabindex="0"';
  return (
    '<section\x20class=\x22person-replacement-shot-timeline\x22\x20aria-label=\x22镜头片段网格\x22>\x0a\x20\x20\x20\x20<section\x20class=\x22person-replacement-result-history-panel\x22\x20data-person-replacement-result-history-menu\x20aria-label=\x22片段生成结果\x22\x20aria-hidden=\x22true\x22\x20hidden></section>\x0a\x20\x20\x20\x20<header\x20class=\x22person-replacement-shot-timeline-header\x22><div><strong>镜头片段</strong><span>' +
    list['length'] +
    ' 个片段 · ' +
    formatClock(value33) +
    '</span></div><div class="person-replacement-shot-timeline-actions">' +
    value54 +
    value45 +
    '</div></header>\n    <div class="person-replacement-shot-timeline-scroll" data-person-replacement-shot-timeline-scroll ' +
    value55 +
    '>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-shot-grid\x20story-asset-grid\x22>' +
    (value46 ||
      '<div class="person-replacement-shot-timeline-empty-state">镜头切分完成后会显示在这里</div>') +
    '</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</section>'
  );
}
function renderShotCutEditor(
  value56,
  list4 = [],
  {
    submitting: submitting = ![],
    keyframeCapturing: keyframeCapturing = ![],
    smartDetecting: smartDetecting = ![],
    playheadSec: playheadSec = 0x0,
    previewShotId: previewShotId = '',
    timelineZoom: timelineZoom = 0x1,
    soundEnabled: soundEnabled = ![],
    canUndo: canUndo = ![],
    selectedShotIds: selectedShotIds = [],
  } = {},
  handler = () => '',
) {
  const map = new Map((value56['shots'] || [])['map']((value57) => [value57['id'], value57])),
    durationSec = getPersonReplacementShotCutTotalDuration(list4),
    personReplacementShotCutDisplayDuration = getPersonReplacementShotCutDisplayDuration(list4),
    countEditablePersonReplacementShotCuts3 = countEditablePersonReplacementShotCuts(list4),
    hasPersonReplacementShotCutUpdateChanges2 = hasPersonReplacementShotCutUpdateChanges(
      value56['shots'],
      list4,
    ),
    title5 = resolveShotCutSubmissionUi(submitting, smartDetecting),
    { reversePending: reversePending, cutSubmitting: cutSubmitting, editorBusy: editorBusy } = title5,
    value58 = editorBusy || keyframeCapturing,
    value59 = editorBusy
      ? renderWorkspaceAssetLoadingOverlay({
          title: title5['loadingTitle'],
          description: title5['loadingDescription'],
        })
      : '',
    trackWidthPx = getMediaClipTimelineTrackWidthPx({
      durationSec: durationSec,
      viewportWidthPx: PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
      zoom: timelineZoom,
    }),
    clamp2 = clamp(playheadSec, 0x0, durationSec, 0x0),
    personReplacementShotCutPositionAtTimelineSec = getPersonReplacementShotCutPositionAtTimelineSec(
      list4,
      clamp2,
    ),
    isReversed = list4[personReplacementShotCutPositionAtTimelineSec['shotIndex']] || null,
    map2 = new Set(
      (Array['isArray'](selectedShotIds) ? selectedShotIds : [])['map'](normalizeText)['filter'](Boolean),
    ),
    value60 = map2['size'] === 0x2,
    enabled4 = value60 && canMergePersonReplacementShotCutRanges(list4, [...map2]),
    enabled5 = Boolean(
      isReversed &&
      canSplitPersonReplacementShotCutRange(
        isReversed,
        personReplacementShotCutPositionAtTimelineSec['sourceTimeSec'] -
          (Number(isReversed['startSec']) || 0x0),
      ),
    ),
    renderPersonReplacementShotCutRulerTicks2 = renderPersonReplacementShotCutRulerTicks(
      durationSec,
      trackWidthPx,
      personReplacementShotCutDisplayDuration,
      getPersonReplacementShotCutRulerFrameRate(list4),
    );
  let endSec = 0x0;
  const list5 = [],
    list6 = [],
    value61 = list4['map']((value62, count2) => {
      const value63 = map['get'](value62['shotId']) || map['get'](value62['originShotId']) || {},
        value64 = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, value62['durationSec']),
        startSec = endSec;
      endSec += value64;
      const mediaClipTimelineRangeRect = getMediaClipTimelineRangeRect({
          startSec: startSec,
          endSec: endSec,
          durationSec: durationSec,
          trackWidthPx: trackWidthPx,
          minWidthPct: 0x0,
        }),
        value65 = '片段' + String(count2 + 0x1)['padStart'](0x2, '0');
      list5['push'](
        '<span class="person-replacement-shot-cut-segment-label" data-person-replacement-cut-segment-label="' +
          count2 +
          '\x22\x20style=\x22left:' +
          mediaClipTimelineRangeRect['leftPct']['toFixed'](0x5) +
          '%;width:' +
          mediaClipTimelineRangeRect['widthPct']['toFixed'](0x5) +
          '%" aria-hidden="true">' +
          value65 +
          '</span>',
      );
      if (value62['keyframeManuallySelected'] === !![] && normalizeText(value62['keyframeRef'])) {
        const personReplacementShotCutTimelineSec = getPersonReplacementShotCutTimelineSec(
            list4,
            value62['shotId'],
            value62['keyframeTimeSec'],
          ),
          clamp3 = clamp(
            (personReplacementShotCutTimelineSec / personReplacementShotCutDisplayDuration) * 0x64,
            0x0,
            0x64,
            0x0,
          ),
          value66 = clamp3 < 0x5 ? ' is-start' : clamp3 > 0x5f ? '\x20is-end' : '',
          value67 = value65 + ' 关键帧';
        list6['push'](
          '<div\x20class=\x22person-replacement-shot-cut-keyframe-marker' +
            value66 +
            '" data-person-replacement-keyframe-marker="' +
            count2 +
            '" style="left:' +
            clamp3['toFixed'](0x5) +
            '%" role="note" aria-label="' +
            value67 +
            '"><span aria-hidden="true">' +
            value67 +
            '</span></div>',
        );
      }
      const value68 = count2 > 0x0 && list4[count2 - 0x1]?.['sourceId'] !== value62['sourceId'],
        text3 = normalizeText(previewShotId) === normalizeText(value62['shotId']),
        value69 = map2['has'](normalizeText(value62['shotId'])),
        value70 = list4[count2 - 0x1],
        value71 = list4[count2 + 0x1],
        value72 = Boolean(value70 && value70['sourceId'] && value70['sourceId'] === value62['sourceId']),
        value73 = Boolean(value71 && value71['sourceId'] && value71['sourceId'] === value62['sourceId']),
        value74 = value72
          ? '<button\x20type=\x22button\x22\x20class=\x22person-replacement-shot-cut-boundary\x20media-clip-trim\x20media-clip-trim-left\x22\x20data-person-replacement-cut-boundary-index=\x22' +
            count2 +
            '\x22\x20data-person-replacement-cut-boundary-side=\x22left\x22\x20role=\x22slider\x22\x20aria-label=\x22调整片段\x20' +
            (count2 + 0x1) +
            ' 的左切口" aria-valuemin="' +
            (value70['startSec'] + getPersonReplacementShotCutFrameSec(value70, value62))['toFixed'](0x4) +
            '" aria-valuemax="' +
            (value62['endSec'] - getPersonReplacementShotCutFrameSec(value70, value62))['toFixed'](0x4) +
            '" aria-valuenow="' +
            value62['startSec']['toFixed'](0x4) +
            '\x22><span\x20class=\x22media-clip-trim-visual\x22\x20aria-hidden=\x22true\x22></span></button>'
          : '',
        value75 = value73
          ? '<button type="button" class="person-replacement-shot-cut-boundary media-clip-trim media-clip-trim-right" data-person-replacement-cut-boundary-index="' +
            (count2 + 0x1) +
            '" data-person-replacement-cut-boundary-side="right" role="slider" aria-label="调整片段 ' +
            (count2 + 0x1) +
            ' 的右切口" aria-valuemin="' +
            (value62['startSec'] + getPersonReplacementShotCutFrameSec(value62, value71))['toFixed'](0x4) +
            '" aria-valuemax="' +
            (value71['endSec'] - getPersonReplacementShotCutFrameSec(value62, value71))['toFixed'](0x4) +
            '" aria-valuenow="' +
            value62['endSec']['toFixed'](0x4) +
            '\x22><span\x20class=\x22media-clip-trim-visual\x22\x20aria-hidden=\x22true\x22></span></button>'
          : '';
      return (
        '<div class="person-replacement-shot-cut-segment media-clip-segment media-clip-material-strip media-clip-segment-video ' +
        (text3 ? 'is-previewing' : '') +
        '\x20' +
        (value69 ? 'is-merge-selected' : '') +
        '\x20' +
        (value68 ? 'is-source-start' : '') +
        '\x20' +
        (value62['isReversed'] === !![] ? 'is-reversed' : '') +
        '" style="left:' +
        mediaClipTimelineRangeRect['leftPct']['toFixed'](0x5) +
        '%;width:' +
        mediaClipTimelineRangeRect['widthPct']['toFixed'](0x5) +
        '%" data-person-replacement-action="preview-shot-cut" data-person-replacement-shot-cut-selectable data-story-marquee-item data-story-marquee-id="' +
        escapeHtml(value62['shotId']) +
        '" data-person-replacement-cut-shot-index="' +
        count2 +
        '" data-clip-index="' +
        count2 +
        '" data-media-kind="video" data-shot-id="' +
        escapeHtml(value62['shotId']) +
        '\x22\x20' +
        (text3 ? 'data-selected-clip="true"' : '') +
        '\x20' +
        (value69 ? 'data-person-replacement-cut-merge-selected="true"' : '') +
        '\x20' +
        (value62['isReversed'] === !![] ? 'data-person-replacement-cut-reversed="true"' : '') +
        ' role="button" tabindex="0" aria-pressed="' +
        text3 +
        '" aria-label="' +
        escapeHtml(
          (value63['title'] || '片段 ' + (count2 + 0x1)) +
            '，' +
            formatClock(value62['startSec']) +
            ' 到 ' +
            formatClock(value62['endSec']) +
            (value62['isReversed'] === !![] ? '，已设为倒放' : '') +
            (value69 ? '，已框选' : ''),
        ) +
        '">\n      ' +
        renderPersonReplacementShotCutFilmstrip(value63, trackWidthPx, value62['keyframeRef']) +
        '\n      <div class="media-clip-material-selection v2-video-clipselection person-replacement-shot-cut-selection" style="left:0%;width:100%" aria-hidden="true"><div class="media-clip-material-label v2-video-cliplabel" data-person-replacement-cut-duration="' +
        count2 +
        '\x22>' +
        formatDurationLabel(value64) +
        '</div></div>\n      ' +
        (value62['isReversed'] === !![]
          ? '<span class="person-replacement-shot-cut-reverse-badge" aria-hidden="true">倒放</span>'
          : '') +
        '\n      ' +
        value74 +
        value75 +
        '\n    </div>'
      );
    })['join'](''),
    mediaClipReverseControlState = resolveMediaClipReverseControlState({
      isReversed: isReversed?.['isReversed'] === !![],
      pending: reversePending,
    }),
    value76 = mediaClipReverseControlState['isReversed'];
  return (
    '<section class="person-replacement-shot-cut-editor" data-person-replacement-shot-cut-editor tabindex="-1" aria-label="调整全部镜头切口" aria-busy="' +
    editorBusy +
    '">\n    <header class="person-replacement-shot-timeline-header">\n      <div><strong>调整全部切口</strong><span>' +
    list4['length'] +
    '\x20个片段\x20·\x20' +
    countEditablePersonReplacementShotCuts3 +
    ' 个可调切口</span><span class="person-replacement-shot-cut-clock"><output data-person-replacement-shot-cut-current-time>' +
    formatPreciseClock(clamp2) +
    '</output> / ' +
    formatPreciseClock(durationSec) +
    '</span></div>\n      <div class="person-replacement-shot-cut-actions">\n        <button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-sound is-icon-only ' +
    (soundEnabled ? 'is-sound-enabled' : '') +
    '" data-person-replacement-action="toggle-shot-cut-sound" data-tooltip="' +
    (soundEnabled ? '关闭声音' : '打开声音') +
    '" aria-label="' +
    (soundEnabled ? '关闭声音' : '打开声音') +
    '" aria-pressed="' +
    soundEnabled +
    '\x22\x20' +
    (editorBusy ? 'disabled' : '') +
    '>' +
    handler(soundEnabled ? 'soundOn' : 'soundOff') +
    '</button>\n        <button type="button" class="person-replacement-shot-cut-action is-icon-only" data-person-replacement-action="undo-shot-cut" aria-keyshortcuts="Control+Z Meta+Z" data-tooltip="撤回" aria-label="撤回" ' +
    (value58 || !canUndo ? 'disabled' : '') +
    '>' +
    handler('undo') +
    '</button>\n        <button type="button" class="person-replacement-shot-cut-action is-icon-only" data-person-replacement-action="reset-shot-cuts" data-tooltip="重置" aria-label="重置" ' +
    (value58 ? 'disabled' : '') +
    '>' +
    handler('reset') +
    '</button>\n        <button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-cancel is-icon-only" data-person-replacement-action="cancel-shot-cuts" data-tooltip="取消" aria-label="取消" ' +
    (value58 ? 'disabled' : '') +
    '>' +
    handler('close') +
    '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22person-replacement-shot-cut-action\x20is-primary\x20is-icon-only\x20' +
    (cutSubmitting ? 'is-loading' : '') +
    '\x22\x20data-person-replacement-action=\x22confirm-shot-cuts\x22\x20data-tooltip=\x22' +
    (cutSubmitting ? '正在应用切口' : '应用切口') +
    '" aria-label="' +
    (cutSubmitting ? '正在应用切口' : '应用切口') +
    '" aria-busy="' +
    cutSubmitting +
    '\x22\x20' +
    (value58 || !hasPersonReplacementShotCutUpdateChanges2 ? 'disabled' : '') +
    '>' +
    renderWorkspaceConfirmIcon() +
    '</button>\n      </div>\n    </header>\n    <div class="person-replacement-shot-cut-shell media-clip-compact is-editing' +
    (editorBusy ? '\x20img-preview-loading' : '') +
    '" aria-busy="' +
    editorBusy +
    '">\n      <div class="media-clip-compact-body">\n        <div class="person-replacement-shot-cut-scroll media-clip-timeline-scroll" data-person-replacement-shot-timeline-scroll data-story-marquee-surface="shot-cuts" tabindex="0">\n          <div class="person-replacement-shot-cut-timeline media-clip-compact-timeline is-editing" data-person-replacement-shot-cut-timeline style="--media-clip-track-content-width:' +
    trackWidthPx +
    'px;--media-clip-timeline-content-width:' +
    trackWidthPx +
    'px;--media-clip-track-axis-width:0px;--cut-total-duration:' +
    durationSec['toFixed'](0x5) +
    '">\n            <div class="media-clip-ruler person-replacement-shot-cut-ruler" aria-hidden="true">' +
    renderPersonReplacementShotCutRulerTicks2 +
    '</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-clip-timeline-lane\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-clip-timeline-tracks\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-shot-cut-track\x20media-clip-track\x20media-clip-track-video\x20is-active\x22\x20data-person-replacement-shot-cut-track>' +
    (value61 || '<div class="person-replacement-shot-timeline-empty-state">暂无可调整的镜头切口</div>') +
    '</div>\n              </div>\n            </div>\n            <div class="person-replacement-shot-cut-annotations">' +
    list5['join']('') +
    list6['join']('') +
    '</div>\n            <div class="media-clip-timeline-cursors person-replacement-shot-cut-cursors" aria-hidden="true">\n              <div class="media-clip-playhead media-clip-timeline-cursor media-clip-timeline-cursor-fixed person-replacement-shot-cut-playhead" data-person-replacement-shot-cut-playhead style="left:' +
    ((clamp2 / personReplacementShotCutDisplayDuration) * 0x64)['toFixed'](0x4) +
    '%\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-clip-hover-playhead\x20media-clip-timeline-cursor\x20media-clip-timeline-cursor-hover\x20person-replacement-shot-cut-hover-playhead\x22\x20data-person-replacement-shot-cut-hover-playhead\x20hidden></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20' +
    value59 +
    '\n    </div>\n    <div class="person-replacement-shot-cut-primary-actions" aria-label="片段编辑工具">\n      <button type="button" class="person-replacement-shot-cut-action is-icon-only ' +
    (keyframeCapturing ? 'is-loading' : '') +
    '" data-person-replacement-action="capture-shot-keyframe" data-tooltip="' +
    (keyframeCapturing ? '正在获取关键帧' : '获取关键帧') +
    '\x22\x20aria-label=\x22' +
    (keyframeCapturing ? '正在获取关键帧' : '获取关键帧') +
    '\x22\x20aria-busy=\x22' +
    keyframeCapturing +
    '\x22\x20' +
    (editorBusy || keyframeCapturing || personReplacementShotCutPositionAtTimelineSec['shotIndex'] < 0x0
      ? 'disabled'
      : '') +
    '>' +
    renderWorkspaceKeyframeIcon() +
    '</button>\n      <button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-split is-icon-only" data-person-replacement-action="split-shot-cut" aria-keyshortcuts="C" data-tooltip="裁剪（C）" aria-label="裁剪（C）" ' +
    (value58 || !enabled5 ? 'disabled' : '') +
    '>' +
    VIDEO_CLIP_ICON_SVG +
    '</button>\n      <button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-reverse is-icon-only ' +
    (reversePending ? 'is-loading' : value76 ? 'is-active' : '') +
    '" data-person-replacement-action="toggle-shot-cut-reverse" data-tooltip="' +
    mediaClipReverseControlState['label'] +
    '\x22\x20aria-label=\x22' +
    mediaClipReverseControlState['label'] +
    '\x22\x20aria-busy=\x22' +
    mediaClipReverseControlState['ariaBusy'] +
    '" aria-pressed="' +
    mediaClipReverseControlState['ariaPressed'] +
    '\x22\x20' +
    (value58 || personReplacementShotCutPositionAtTimelineSec['shotIndex'] < 0x0 ? 'disabled' : '') +
    '>' +
    handler('reverse') +
    '</button>\n      ' +
    (value60
      ? '<button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-merge is-icon-only" data-person-replacement-action="merge-shot-cuts" data-tooltip="合并片段" aria-label="合并片段" ' +
        (value58 || !enabled4 ? 'disabled' : '') +
        '>' +
        handler('merge') +
        '</button>'
      : '') +
    '\n    </div>\n    <div class="person-replacement-shot-cut-helper-row" aria-label="时间轴操作提示">\n      <div class="person-replacement-shot-cut-helper-left">\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:0"><kbd>Space</kbd><span>播放 / 暂停</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:1"><kbd>← →</kbd><span>逐帧移动播放头</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:2"><kbd>C</kbd><span>在播放头处增加切口</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:3"><kbd>Ctrl / ⌘ Z</kbd><span>撤回上一步裁剪操作</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:4"><kbd>Ctrl / ⌘ + −</kbd><span>缩放时间轴</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:5"><kbd>拖动切口</kbd><span>左右片段同步伸缩</span></span>\n      </div>\n    </div>\n  </section>'
  );
}
function renderShotTimelineStage(
  value77,
  {
    cutEditorOpen: cutEditorOpen = ![],
    cutEditorOpening: cutEditorOpening = ![],
    cutEditorMotion: cutEditorMotion = '',
    cutEditorDraft: cutEditorDraft = [],
    cutEditorSubmitting: cutEditorSubmitting = ![],
    cutEditorKeyframeCapturing: cutEditorKeyframeCapturing = ![],
    cutEditorSmartDetecting: cutEditorSmartDetecting = ![],
    cutEditorPlayheadSec: cutEditorPlayheadSec = 0x0,
    cutEditorPreviewShotId: cutEditorPreviewShotId = '',
    cutEditorTimelineZoom: cutEditorTimelineZoom = 0x1,
    cutEditorSoundEnabled: cutEditorSoundEnabled = ![],
    cutEditorSelectedShotIds: cutEditorSelectedShotIds = [],
    cutEditorCanUndo: cutEditorCanUndo = ![],
    allowCutEditing: allowCutEditing = ![],
    timelineMode: timelineMode = 'image',
    shotBatchGenerationActive: shotBatchGenerationActive = ![],
    shotBatchGeneratingShotIds: shotBatchGeneratingShotIds = [],
    shotBatchCancelRequested: shotBatchCancelRequested = ![],
  } = {},
  value78 = () => '',
) {
  const enabled6 = cutEditorOpen && cutEditorMotion !== 'to-timeline',
    value79 =
      cutEditorMotion === 'to-editor'
        ? 'is-flipping-to-editor'
        : cutEditorMotion === 'to-timeline'
          ? 'is-flipping-to-timeline'
          : '',
    value80 = Boolean(value79),
    value81 = cutEditorOpening ? '\x20is-cut-editor-loading\x20img-preview-loading' : '',
    value82 = enabled6 || cutEditorOpening;
  return (
    '<div class="person-replacement-shot-timeline-stage ' +
    (enabled6 ? 'is-editor' : 'is-timeline') +
    '\x20' +
    (value80 ? 'is-animating' : 'is-settled') +
    value81 +
    '" data-person-replacement-shot-timeline-stage aria-busy="' +
    cutEditorOpening +
    '\x22' +
    (cutEditorOpening ? ' aria-label="视频加载中，正在准备裁剪预览"' : '') +
    '>\n    <div class="person-replacement-shot-timeline-cube ' +
    value79 +
    '">\n      <div class="person-replacement-shot-timeline-face person-replacement-shot-timeline-face--timeline" aria-hidden="' +
    enabled6 +
    '\x22\x20' +
    (value82 ? 'inert' : '') +
    '>' +
    renderShotTimeline(value77, {
      allowCutEditing: allowCutEditing,
      mode: timelineMode,
      isBatchGenerating: shotBatchGenerationActive,
      batchGeneratingShotIds: shotBatchGeneratingShotIds,
      batchCancelRequested: shotBatchCancelRequested,
    }) +
    '</div>\n      <div class="person-replacement-shot-timeline-face person-replacement-shot-timeline-face--editor" aria-hidden="' +
    !enabled6 +
    '\x22\x20' +
    (enabled6 ? '' : 'inert') +
    '>' +
    renderShotCutEditor(
      value77,
      cutEditorDraft,
      {
        submitting: cutEditorSubmitting,
        keyframeCapturing: cutEditorKeyframeCapturing,
        smartDetecting: cutEditorSmartDetecting,
        playheadSec: cutEditorPlayheadSec,
        previewShotId: cutEditorPreviewShotId,
        timelineZoom: cutEditorTimelineZoom,
        soundEnabled: cutEditorSoundEnabled,
        selectedShotIds: cutEditorSelectedShotIds,
        canUndo: cutEditorCanUndo,
      },
      value78,
    ) +
    '</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20' +
    (cutEditorOpening
      ? renderWorkspaceAssetLoadingOverlay({
          title: '视频加载中',
          description: '正在准备裁剪预览，加载完成后会自动进入。',
        })
      : '') +
    '\n  </div>'
  );
}
export function createPersonReplacementShotTimelinePresentation({ renderIcon: renderIcon = () => '' } = {}) {
  const value83 = typeof renderIcon === 'function' ? renderIcon : () => '';
  return Object['freeze']({
    renderHistoryMenu({
      kind: kind = 'image',
      shot: shot = {},
      title: title = '镜头片段',
      allowSingleResult: allowSingleResult = ![],
    } = {}) {
      const value84 = { allowSingleResult: allowSingleResult };
      return kind === 'video'
        ? renderReplacementVideoHistoryMenu(shot, title, value84)
        : renderReplacementImageHistoryMenu(shot, title, value84);
    },
    renderTimeline: renderShotTimeline,
    renderStage(value85, value86 = {}) {
      return renderShotTimelineStage(value85, value86, value83);
    },
  });
}
