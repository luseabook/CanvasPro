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
function escapeHtml(_0x1f5a70) {
  return String(_0x1f5a70 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x417627, _0x3f0c4a = '') {
  const _0x4c3197 = String(_0x417627 ?? '')['trim']();
  return _0x4c3197 || _0x3f0c4a;
}
function normalizeMediaUrl(_0x241ff1) {
  const _0x2f7d56 = normalizeText(_0x241ff1);
  return _0x2f7d56 ? localPathToUrl(_0x2f7d56) || _0x2f7d56 : '';
}
function clamp(_0x3b4da4, _0xc9a67f, _0x4ed05f, _0x5ecff4 = _0xc9a67f) {
  const _0x2254c5 = Number(_0x3b4da4);
  return Number['isFinite'](_0x2254c5)
    ? Math['min'](_0x4ed05f, Math['max'](_0xc9a67f, _0x2254c5))
    : _0x5ecff4;
}
function formatClock(_0x12ca5c) {
  const _0x5000c1 = Math['max'](0x0, Number(_0x12ca5c) || 0x0),
    _0x4b08dc = Math['floor'](_0x5000c1 / 0x3c),
    _0x640fa3 = Math['floor'](_0x5000c1 % 0x3c);
  return String(_0x4b08dc)['padStart'](0x2, '0') + ':' + String(_0x640fa3)['padStart'](0x2, '0');
}
function formatPreciseClock(_0x419dbf) {
  const _0x593a26 = Math['max'](0x0, Number(_0x419dbf) || 0x0),
    _0x5818e4 = Math['floor'](_0x593a26 / 0x3c),
    _0xaa9bca = _0x593a26 - _0x5818e4 * 0x3c;
  return String(_0x5818e4)['padStart'](0x2, '0') + ':' + _0xaa9bca['toFixed'](0x2)['padStart'](0x5, '0');
}
function resolvePersonReplacementVideoResultPosterRef(_0x49aaae = {}) {
  if (!_0x49aaae || typeof _0x49aaae !== 'object' || Array['isArray'](_0x49aaae)) return '';
  return (
    [
      _0x49aaae['posterUrl'],
      _0x49aaae['thumbUrl'],
      _0x49aaae['thumbnailUrl'],
      _0x49aaae['coverUrl'],
      _0x49aaae['posterLocalPath'],
      _0x49aaae['thumbLocalPath'],
      _0x49aaae['thumbnailLocalPath'],
    ]
      ['map']((_0x4c51cb) => normalizeText(_0x4c51cb))
      ['find'](Boolean) || ''
  );
}
function renderShotTimelineVideoMedia({
  shot: shot = {},
  title: title = '镜头片段',
  resultRef: resultRef = '',
  resultPosterRef: resultPosterRef = '',
} = {}) {
  const _0x251793 = normalizeText(resultRef),
    _0x307a74 = _0x251793 || normalizeText(shot['videoRef']) || normalizeText(shot['sourceVideoRef']);
  if (!_0x307a74) return '';
  const _0x3f01cd = _0x251793 ? 'result' : 'source',
    _0x533479 = _0x251793 ? normalizeText(resultPosterRef) : normalizeText(shot['keyframeRef']),
    _0x406e9d = normalizeMediaUrl(_0x307a74),
    _0x57b7e4 = normalizeMediaUrl(_0x533479),
    _0x130f74 = _0x3f01cd === 'result' ? title + '替换视频结果' : title + '原视频片段';
  return (
    '<video class="story-asset-card-image person-replacement-shot-card-video" data-person-replacement-shot-card-video="' +
    _0x3f01cd +
    '" src="' +
    escapeHtml(_0x406e9d) +
    '\x22' +
    (_0x57b7e4 ? ' poster="' + escapeHtml(_0x57b7e4) + '\x22' : '') +
    '\x20muted\x20playsinline\x20preload=\x22metadata\x22\x20aria-label=\x22' +
    escapeHtml(_0x130f74) +
    '" draggable="false"></video>'
  );
}
function renderReplacementResultReferenceButton(_0x49cc78 = {}, _0x62c376 = 0x0, _0x5400d7 = 'image') {
  const _0x1d24e1 = _0x5400d7 === 'video',
    _0x43c475 = _0x1d24e1
      ? getPersonReplacementVideoResults(_0x49cc78)
      : getPersonReplacementImageResults(_0x49cc78),
    _0x13c4ac = _0x43c475[_0x62c376],
    _0x4e5aae = _0x1d24e1
      ? resolvePersonReplacementVideoResultRef(_0x13c4ac)
      : resolvePersonReplacementImageResultRef(_0x13c4ac);
  if (!_0x4e5aae) return '';
  const _0x1b16c7 =
      _0x4e5aae ===
      normalizeText(
        _0x1d24e1 ? _0x49cc78?.['videoIterationReferenceRef'] : _0x49cc78?.['imageIterationReferenceRef'],
      ),
    _0x362590 = _0x1d24e1 ? '视频' : '图片',
    _0x4544fb = _0x1b16c7
      ? '取消' + _0x362590 + '\x20' + (_0x62c376 + 0x1) + ' 的参考'
      : '将' + _0x362590 + '\x20' + (_0x62c376 + 0x1) + ' 设为参考',
    _0x147318 = _0x1b16c7
      ? '再次点击取消下一轮参考'
      : _0x1d24e1
        ? '设为下一轮视频替换的原视频'
        : '设为下一轮图像替换的参考';
  return (
    '<button type="button" class="story-base-appearance-button person-replacement-result-reference-button' +
    (_0x1b16c7 ? ' is-active' : '') +
    '" data-story-action="set-replacement-' +
    _0x5400d7 +
    '-reference" data-shot-id="' +
    escapeHtml(_0x49cc78?.['id']) +
    '\x22\x20data-replacement-' +
    _0x5400d7 +
    '-result-index="' +
    _0x62c376 +
    '" aria-pressed="' +
    _0x1b16c7 +
    '" aria-label="' +
    escapeHtml(_0x4544fb) +
    '\x22\x20title=\x22' +
    escapeHtml(_0x147318) +
    '\x22>' +
    (_0x1b16c7 ? '参考中' : '设为参考') +
    '</button>'
  );
}
function renderReplacementImageHistoryMenu(
  _0x23b464 = {},
  _0x4a7eeb = '镜头片段',
  { allowSingleResult: allowSingleResult = ![] } = {},
) {
  const _0x58d347 = getPersonReplacementImageResults(_0x23b464),
    _0x3b1ac7 = getPersonReplacementActiveImageResultIndex(_0x23b464, _0x58d347);
  return renderWorkspaceMediaHistoryMenu({
    title: _0x4a7eeb,
    results: _0x58d347,
    activeIndex: _0x3b1ac7,
    minimumItemCount: allowSingleResult ? 0x1 : 0x2,
    countLabel: _0x58d347['length'] + ' 张图片',
    menuLabel: _0x4a7eeb + '替换图片',
    getItemLabel: (_0x5b46cd, _0x469a6e) => '图片 ' + (_0x469a6e + 0x1),
    getItemStatus: (_0x567820, _0x4f3a1a) => (_0x4f3a1a === _0x3b1ac7 ? '当前使用' : '点击切换'),
    renderMedia: (_0x2f8bdf, _0x214fb7) => {
      const _0x568ace = resolvePersonReplacementImageResultRef(_0x2f8bdf);
      return _0x568ace
        ? '<img class="story-media-history-thumbnail story-clip-video-history-thumbnail" src="' +
            escapeHtml(normalizeMediaUrl(_0x568ace)) +
            '" alt="' +
            escapeHtml(_0x4a7eeb + ' · 图片 ' + (_0x214fb7 + 0x1)) +
            '" loading="lazy" draggable="false">'
        : '';
    },
    getItemAttributes: (_0x1ce35d, _0x74b68a) =>
      'data-story-action="select-replacement-image-result" data-shot-id="' +
      escapeHtml(_0x23b464?.['id']) +
      '" data-replacement-image-result-index="' +
      _0x74b68a +
      '\x22',
    renderItemAction: (_0x4fcdde, _0x4af52a) =>
      '' +
      renderReplacementResultReferenceButton(_0x23b464, _0x4af52a) +
      (_0x58d347['length'] > 0x1
        ? renderWorkspaceCardDeleteControl({
            className: 'story-media-history-delete',
            ariaLabel: '删除图片\x20' + (_0x4af52a + 0x1),
            actionAttributes: {
              'data-story-action': 'delete-replacement-image-result',
              'data-shot-id': _0x23b464?.['id'],
              'data-replacement-image-result-index': _0x4af52a,
            },
          })
        : ''),
  });
}
function renderReplacementVideoHistoryMenu(
  _0x5f45a0 = {},
  _0x116f83 = '镜头片段',
  { allowSingleResult: allowSingleResult = ![] } = {},
) {
  const _0x32eda2 = getPersonReplacementVideoResults(_0x5f45a0),
    _0x298c81 = getPersonReplacementActiveVideoResultIndex(_0x5f45a0, _0x32eda2);
  return renderWorkspaceMediaHistoryMenu({
    title: _0x116f83,
    results: _0x32eda2,
    activeIndex: _0x298c81,
    minimumItemCount: allowSingleResult ? 0x1 : 0x2,
    countLabel: _0x32eda2['length'] + ' 个视频',
    menuLabel: _0x116f83 + '替换结果视频',
    getItemLabel: (_0x30a93d, _0x42c79f) => '视频 ' + (_0x42c79f + 0x1),
    getItemStatus: (_0x1f5780, _0x15e16a) => (_0x15e16a === _0x298c81 ? '当前播放' : '点击切换'),
    renderMedia: (_0x4e3861, _0x2ec4fb) => {
      const _0xa805 = resolvePersonReplacementVideoResultPosterRef(_0x4e3861);
      if (_0xa805)
        return (
          '<img\x20class=\x22story-media-history-thumbnail\x20story-clip-video-history-thumbnail\x22\x20src=\x22' +
          escapeHtml(normalizeMediaUrl(_0xa805)) +
          '" alt="' +
          escapeHtml(_0x116f83 + ' · 视频 ' + (_0x2ec4fb + 0x1)) +
          '" loading="lazy" draggable="false">'
        );
      const _0x23ccdf = resolvePersonReplacementVideoResultRef(_0x4e3861);
      return _0x23ccdf
        ? '<video class="story-media-history-thumbnail story-clip-video-history-thumbnail" src="' +
            escapeHtml(normalizeMediaUrl(_0x23ccdf)) +
            '" aria-label="' +
            escapeHtml(_0x116f83 + ' · 视频 ' + (_0x2ec4fb + 0x1)) +
            '" muted playsinline preload="metadata"></video>'
        : '';
    },
    getItemAttributes: (_0x3d3c28, _0x3347c2) =>
      'data-story-action="select-replacement-video-result" data-shot-id="' +
      escapeHtml(_0x5f45a0?.['id']) +
      '\x22\x20data-replacement-video-result-index=\x22' +
      _0x3347c2 +
      '\x22',
    renderItemAction: (_0x166c8a, _0x412545) =>
      '' +
      renderReplacementResultReferenceButton(_0x5f45a0, _0x412545, 'video') +
      (_0x32eda2['length'] > 0x1
        ? renderWorkspaceCardDeleteControl({
            className: 'story-media-history-delete',
            ariaLabel: '删除视频 ' + (_0x412545 + 0x1),
            actionAttributes: {
              'data-story-action': 'delete-replacement-video-result',
              'data-shot-id': _0x5f45a0?.['id'],
              'data-replacement-video-result-index': _0x412545,
            },
          })
        : ''),
  });
}
function renderShotTimeline(
  _0x4760e3,
  {
    allowCutEditing: allowCutEditing = ![],
    mode: mode = 'image',
    isBatchGenerating: isBatchGenerating = ![],
    batchGeneratingShotIds: batchGeneratingShotIds = [],
    batchCancelRequested: batchCancelRequested = ![],
  } = {},
) {
  const _0xf289f4 = mode === 'video',
    _0x504932 = Array['isArray'](_0x4760e3['shots']) ? _0x4760e3['shots'] : [],
    _0x1dd1cd = _0x504932['reduce'](
      (_0x58f1bf, _0x4de7c8) => _0x58f1bf + getPersonReplacementShotDurationSec(_0x4de7c8),
      0x0,
    ),
    _0x737cb5 = createPersonReplacementShotCutDraft(_0x4760e3),
    _0x5cba50 = countEditablePersonReplacementShotCuts(_0x737cb5),
    _0x42b066 = _0x5cba50 > 0x0 || hasSplittablePersonReplacementShotCut(_0x737cb5),
    _0x2e23ae = _0x4760e3['workspace']['selectedShotIds'],
    _0x41894d =
      _0x504932['length'] > 0x0 && _0x504932['every']((_0x2657d3) => _0x2e23ae['includes'](_0x2657d3['id'])),
    _0x573d91 = _0xf289f4
      ? _0x504932['filter']((_0x2d0005) =>
          isPersonReplacementVideoGenerationActive(
            resolvePersonReplacementVideoGenerationState(_0x4760e3['workspace'], _0x2d0005['id']),
          ),
        )['map']((_0x469725) => normalizeText(_0x469725['id']))
      : _0x504932['filter'](
          (_0x1313df) =>
            resolvePersonReplacementImageGenerationState(_0x4760e3['workspace'], _0x1313df['id'])[
              'status'
            ] === 'running',
        )['map']((_0x2a0d96) => normalizeText(_0x2a0d96['id'])),
    _0x41bf92 = [
      ...new Set(
        [...(Array['isArray'](batchGeneratingShotIds) ? batchGeneratingShotIds : []), ..._0x573d91]
          ['map'](normalizeText)
          ['filter'](Boolean),
      ),
    ],
    _0x581fda = _0xf289f4
      ? _0x2e23ae['length'] > 0x1
        ? '批量生成视频'
        : '生成视频'
      : _0x2e23ae['length'] > 0x1
        ? '批量生成替换图'
        : '生成替换图',
    _0x36efb2 = {
      data: { assets: [], project: {} },
      assetFilter: 'scene',
      selectedAssetId: _0x4760e3['workspace']['selectedShotId'],
      selectedAssetIds: _0x2e23ae,
      assetSelectionMode: _0x4760e3['workspace']['shotSelectionMode'],
      assetAppearanceIndexes: {},
      generatingAppearanceKeys: _0x41bf92['map']((_0x64c220) => _0x64c220 + ':keyframe'),
      isBatchGenerating: isBatchGenerating,
      batchGenerationActionLabel: _0x581fda,
      batchCancelAction: 'cancel-shot-batch-generation',
      batchCancelRequested: batchCancelRequested,
      batchGeneratingAssetIds: isBatchGenerating ? _0x41bf92 : [],
      allowDeleteAssetCard: ![],
      allowAssetRename: ![],
      hideAssetRoleTag: !![],
      hideAssetNameTooltip: !![],
    },
    _0x443553 =
      (allowCutEditing
        ? '<button type="button" class="story-secondary-button person-replacement-shot-split-trigger is-icon-only" data-person-replacement-action="edit-shot-cuts" data-tooltip="剪辑全部切口" aria-label="剪辑全部切口" ' +
          (_0x42b066 ? '' : 'disabled') +
          '>' +
          VIDEO_CLIP_ICON_SVG +
          '</button>'
        : '') +
      '<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x22\x20data-story-action=\x22toggle-all-shots\x22\x20aria-pressed=\x22' +
      _0x41894d +
      '\x22\x20' +
      (_0x504932['length'] ? '' : 'disabled') +
      '>' +
      (_0x41894d ? '取消全选' : '全选') +
      '</button>' +
      (_0x4760e3['workspace']['shotSelectionMode'] || isBatchGenerating
        ? renderPersonReplacementBatchGenerationControl(_0x36efb2)
        : ''),
    _0x304a03 = _0x504932['map']((_0x5ba5a8, _0x406ae5) => {
      const _0x166b0e = '片段' + String(_0x406ae5 + 0x1)['padStart'](0x2, '0'),
        _0x51259f = getPersonReplacementImageResults(_0x5ba5a8),
        _0x5d1ff1 = getPersonReplacementActiveImageResultIndex(_0x5ba5a8, _0x51259f),
        _0x168eb1 = resolvePersonReplacementImageResultRef(_0x51259f[_0x5d1ff1]),
        _0x4da3ba = _0xf289f4 ? getPersonReplacementVideoResults(_0x5ba5a8) : [],
        _0x88b6c7 = _0xf289f4 ? getPersonReplacementActiveVideoResultIndex(_0x5ba5a8, _0x4da3ba) : 0x0,
        _0x48e061 = _0x4da3ba[_0x88b6c7] || null,
        _0xf9aafe =
          resolvePersonReplacementVideoResultRef(_0x48e061) || normalizeText(_0x5ba5a8['resultVideoRef']),
        _0x63103c = resolvePersonReplacementVideoResultPosterRef(_0x48e061),
        _0x554492 = normalizeMediaUrl(
          _0xf289f4 ? _0x63103c || _0x5ba5a8['keyframeRef'] : _0x168eb1 || _0x5ba5a8['keyframeRef'],
        ),
        _0x3ce78 = _0xf289f4
          ? renderShotTimelineVideoMedia({
              shot: _0x5ba5a8,
              title: _0x166b0e,
              resultRef: _0xf9aafe,
              resultPosterRef: _0x63103c,
            })
          : '',
        _0x45bf89 = formatClock(_0x5ba5a8['startTimeSec']) + '–' + formatClock(_0x5ba5a8['endTimeSec']),
        _0x1c9c48 = _0xf289f4 ? _0xf9aafe : _0x5ba5a8['replacementImageRef'],
        _0x177cdd = _0x1c9c48 ? _0x45bf89 + ' · 已生成' : _0x45bf89,
        _0x2d9b7e = (_0xf289f4 ? _0x4da3ba : _0x51259f)['length'],
        _0x528523 = _0xf289f4
          ? 'data-person-replacement-video-history="' + (_0x4da3ba['length'] > 0x1) + '\x22'
          : 'data-person-replacement-image-history="' + (_0x51259f['length'] > 0x1) + '\x22',
        _0x4a535a =
          !_0x4760e3['workspace']['shotSelectionMode'] &&
          (_0xf289f4 ? _0x4da3ba : _0x51259f)['length'] === 0x1
            ? renderReplacementResultReferenceButton(_0x5ba5a8, 0x0, _0xf289f4 ? 'video' : 'image')
            : '',
        _0x534f75 =
          _0x2d9b7e > 0x1
            ? '<button type="button" class="person-replacement-shot-result-count" data-person-replacement-result-history-toggle data-shot-id="' +
              escapeHtml(_0x5ba5a8['id']) +
              '" data-result-count="' +
              _0x2d9b7e +
              '" aria-expanded="false" aria-label="展开' +
              _0x2d9b7e +
              ' 个结果" title="查看 ' +
              _0x2d9b7e +
              ' 个生成结果"' +
              (_0x4760e3['workspace']['shotSelectionMode'] ? '\x20disabled' : '') +
              '>' +
              renderWorkspaceActionIcon('results') +
              '<span>' +
              _0x2d9b7e +
              '</span></button>'
            : '';
      return renderPersonReplacementAssetCard(
        _0x36efb2,
        {
          id: _0x5ba5a8['id'],
          kind: 'scene',
          name: _0x166b0e,
          description: '',
          imageUrl: _0x554492,
          appearances: [
            { id: 'keyframe', name: _0xf289f4 && _0xf9aafe ? '替换结果视频' : '检测帧', imageUrl: _0x554492 },
          ],
        },
        {
          statusText: _0x177cdd,
          cardMediaHtml: _0x3ce78,
          cardClassName: 'person-replacement-shot-card',
          cardAttributes:
            'data-person-replacement-shot-card="true" data-shot-id="' +
            escapeHtml(_0x5ba5a8['id']) +
            '\x22\x20' +
            _0x528523 +
            ' aria-current="' +
            (_0x5ba5a8['id'] === _0x4760e3['workspace']['selectedShotId'] ? 'true' : 'false') +
            '" aria-label="' +
            escapeHtml(
              _0x166b0e +
                '，' +
                formatClock(_0x5ba5a8['startTimeSec']) +
                ' 到 ' +
                formatClock(_0x5ba5a8['endTimeSec']) +
                (_0x1c9c48 ? (_0xf289f4 ? '，替换视频已生成' : '，替换图已生成') : ''),
            ) +
            '\x22',
          shellClassName: [
            _0x4a535a || _0x534f75 ? 'person-replacement-shot-card-shell' : '',
            _0x4a535a ? 'has-reference-control' : '',
            _0x534f75 ? 'has-result-count-control' : '',
          ]
            ['filter'](Boolean)
            ['join']('\x20'),
          accessoryHtml: _0x4a535a + _0x534f75,
          preserveShell: !![],
        },
      );
    })['join'](''),
    _0x12406e = _0x4760e3['workspace']['shotSelectionMode'] ? '已选择 ' + _0x2e23ae['length'] + '\x20项' : '',
    _0x36d522 = _0x12406e ? '<small>' + _0x12406e + '</small>' : '',
    _0x5c3675 = 'data-story-marquee-surface="shots" tabindex="0"';
  return (
    '<section\x20class=\x22person-replacement-shot-timeline\x22\x20aria-label=\x22镜头片段网格\x22>\x0a\x20\x20\x20\x20<section\x20class=\x22person-replacement-result-history-panel\x22\x20data-person-replacement-result-history-menu\x20aria-label=\x22片段生成结果\x22\x20aria-hidden=\x22true\x22\x20hidden></section>\x0a\x20\x20\x20\x20<header\x20class=\x22person-replacement-shot-timeline-header\x22><div><strong>镜头片段</strong><span>' +
    _0x504932['length'] +
    ' 个片段 · ' +
    formatClock(_0x1dd1cd) +
    '</span></div><div class="person-replacement-shot-timeline-actions">' +
    _0x36d522 +
    _0x443553 +
    '</div></header>\n    <div class="person-replacement-shot-timeline-scroll" data-person-replacement-shot-timeline-scroll ' +
    _0x5c3675 +
    '>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-shot-grid\x20story-asset-grid\x22>' +
    (_0x304a03 ||
      '<div class="person-replacement-shot-timeline-empty-state">镜头切分完成后会显示在这里</div>') +
    '</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</section>'
  );
}
function renderShotCutEditor(
  _0x5f52e8,
  _0x1074f3 = [],
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
  _0x41aa00 = () => '',
) {
  const _0x509e8e = new Map((_0x5f52e8['shots'] || [])['map']((_0x50c6d6) => [_0x50c6d6['id'], _0x50c6d6])),
    _0x882c21 = getPersonReplacementShotCutTotalDuration(_0x1074f3),
    _0x3bff4b = getPersonReplacementShotCutDisplayDuration(_0x1074f3),
    _0x1e821a = countEditablePersonReplacementShotCuts(_0x1074f3),
    _0x2a4c17 = hasPersonReplacementShotCutUpdateChanges(_0x5f52e8['shots'], _0x1074f3),
    _0x23fe75 = resolveShotCutSubmissionUi(submitting, smartDetecting),
    { reversePending: _0x5b59d2, cutSubmitting: _0x57df65, editorBusy: _0x5e0350 } = _0x23fe75,
    _0x39dd97 = _0x5e0350 || keyframeCapturing,
    _0x480ff6 = _0x5e0350
      ? renderWorkspaceAssetLoadingOverlay({
          title: _0x23fe75['loadingTitle'],
          description: _0x23fe75['loadingDescription'],
        })
      : '',
    _0x649903 = getMediaClipTimelineTrackWidthPx({
      durationSec: _0x882c21,
      viewportWidthPx: PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX,
      zoom: timelineZoom,
    }),
    _0x2704be = clamp(playheadSec, 0x0, _0x882c21, 0x0),
    _0x28ec2c = getPersonReplacementShotCutPositionAtTimelineSec(_0x1074f3, _0x2704be),
    _0x519bc0 = _0x1074f3[_0x28ec2c['shotIndex']] || null,
    _0x96a400 = new Set(
      (Array['isArray'](selectedShotIds) ? selectedShotIds : [])['map'](normalizeText)['filter'](Boolean),
    ),
    _0x44ac92 = _0x96a400['size'] === 0x2,
    _0x3983a3 = _0x44ac92 && canMergePersonReplacementShotCutRanges(_0x1074f3, [..._0x96a400]),
    _0x25b61c = Boolean(
      _0x519bc0 &&
      canSplitPersonReplacementShotCutRange(
        _0x519bc0,
        _0x28ec2c['sourceTimeSec'] - (Number(_0x519bc0['startSec']) || 0x0),
      ),
    ),
    _0x30081f = renderPersonReplacementShotCutRulerTicks(
      _0x882c21,
      _0x649903,
      _0x3bff4b,
      getPersonReplacementShotCutRulerFrameRate(_0x1074f3),
    );
  let _0x2878ed = 0x0;
  const _0x5c9940 = [],
    _0x12e1ce = [],
    _0x5a2a4b = _0x1074f3['map']((_0x12b98f, _0x5d6f78) => {
      const _0x3013c3 =
          _0x509e8e['get'](_0x12b98f['shotId']) || _0x509e8e['get'](_0x12b98f['originShotId']) || {},
        _0x43dceb = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, _0x12b98f['durationSec']),
        _0x4cf374 = _0x2878ed;
      _0x2878ed += _0x43dceb;
      const _0x27bd61 = getMediaClipTimelineRangeRect({
          startSec: _0x4cf374,
          endSec: _0x2878ed,
          durationSec: _0x882c21,
          trackWidthPx: _0x649903,
          minWidthPct: 0x0,
        }),
        _0x597676 = '片段' + String(_0x5d6f78 + 0x1)['padStart'](0x2, '0');
      _0x5c9940['push'](
        '<span class="person-replacement-shot-cut-segment-label" data-person-replacement-cut-segment-label="' +
          _0x5d6f78 +
          '\x22\x20style=\x22left:' +
          _0x27bd61['leftPct']['toFixed'](0x5) +
          '%;width:' +
          _0x27bd61['widthPct']['toFixed'](0x5) +
          '%" aria-hidden="true">' +
          _0x597676 +
          '</span>',
      );
      if (_0x12b98f['keyframeManuallySelected'] === !![] && normalizeText(_0x12b98f['keyframeRef'])) {
        const _0x37d26b = getPersonReplacementShotCutTimelineSec(
            _0x1074f3,
            _0x12b98f['shotId'],
            _0x12b98f['keyframeTimeSec'],
          ),
          _0x3eea92 = clamp((_0x37d26b / _0x3bff4b) * 0x64, 0x0, 0x64, 0x0),
          _0xd293cf = _0x3eea92 < 0x5 ? ' is-start' : _0x3eea92 > 0x5f ? '\x20is-end' : '',
          _0x54e25b = _0x597676 + ' 关键帧';
        _0x12e1ce['push'](
          '<div\x20class=\x22person-replacement-shot-cut-keyframe-marker' +
            _0xd293cf +
            '" data-person-replacement-keyframe-marker="' +
            _0x5d6f78 +
            '" style="left:' +
            _0x3eea92['toFixed'](0x5) +
            '%" role="note" aria-label="' +
            _0x54e25b +
            '"><span aria-hidden="true">' +
            _0x54e25b +
            '</span></div>',
        );
      }
      const _0x41d8c6 = _0x5d6f78 > 0x0 && _0x1074f3[_0x5d6f78 - 0x1]?.['sourceId'] !== _0x12b98f['sourceId'],
        _0x1fd39b = normalizeText(previewShotId) === normalizeText(_0x12b98f['shotId']),
        _0x51ef77 = _0x96a400['has'](normalizeText(_0x12b98f['shotId'])),
        _0x476f75 = _0x1074f3[_0x5d6f78 - 0x1],
        _0x909369 = _0x1074f3[_0x5d6f78 + 0x1],
        _0x335577 = Boolean(
          _0x476f75 && _0x476f75['sourceId'] && _0x476f75['sourceId'] === _0x12b98f['sourceId'],
        ),
        _0x8087df = Boolean(
          _0x909369 && _0x909369['sourceId'] && _0x909369['sourceId'] === _0x12b98f['sourceId'],
        ),
        _0x4f241b = _0x335577
          ? '<button\x20type=\x22button\x22\x20class=\x22person-replacement-shot-cut-boundary\x20media-clip-trim\x20media-clip-trim-left\x22\x20data-person-replacement-cut-boundary-index=\x22' +
            _0x5d6f78 +
            '\x22\x20data-person-replacement-cut-boundary-side=\x22left\x22\x20role=\x22slider\x22\x20aria-label=\x22调整片段\x20' +
            (_0x5d6f78 + 0x1) +
            ' 的左切口" aria-valuemin="' +
            (_0x476f75['startSec'] + getPersonReplacementShotCutFrameSec(_0x476f75, _0x12b98f))['toFixed'](
              0x4,
            ) +
            '" aria-valuemax="' +
            (_0x12b98f['endSec'] - getPersonReplacementShotCutFrameSec(_0x476f75, _0x12b98f))['toFixed'](
              0x4,
            ) +
            '" aria-valuenow="' +
            _0x12b98f['startSec']['toFixed'](0x4) +
            '\x22><span\x20class=\x22media-clip-trim-visual\x22\x20aria-hidden=\x22true\x22></span></button>'
          : '',
        _0x399c05 = _0x8087df
          ? '<button type="button" class="person-replacement-shot-cut-boundary media-clip-trim media-clip-trim-right" data-person-replacement-cut-boundary-index="' +
            (_0x5d6f78 + 0x1) +
            '" data-person-replacement-cut-boundary-side="right" role="slider" aria-label="调整片段 ' +
            (_0x5d6f78 + 0x1) +
            ' 的右切口" aria-valuemin="' +
            (_0x12b98f['startSec'] + getPersonReplacementShotCutFrameSec(_0x12b98f, _0x909369))['toFixed'](
              0x4,
            ) +
            '" aria-valuemax="' +
            (_0x909369['endSec'] - getPersonReplacementShotCutFrameSec(_0x12b98f, _0x909369))['toFixed'](
              0x4,
            ) +
            '" aria-valuenow="' +
            _0x12b98f['endSec']['toFixed'](0x4) +
            '\x22><span\x20class=\x22media-clip-trim-visual\x22\x20aria-hidden=\x22true\x22></span></button>'
          : '';
      return (
        '<div class="person-replacement-shot-cut-segment media-clip-segment media-clip-material-strip media-clip-segment-video ' +
        (_0x1fd39b ? 'is-previewing' : '') +
        '\x20' +
        (_0x51ef77 ? 'is-merge-selected' : '') +
        '\x20' +
        (_0x41d8c6 ? 'is-source-start' : '') +
        '\x20' +
        (_0x12b98f['isReversed'] === !![] ? 'is-reversed' : '') +
        '" style="left:' +
        _0x27bd61['leftPct']['toFixed'](0x5) +
        '%;width:' +
        _0x27bd61['widthPct']['toFixed'](0x5) +
        '%" data-person-replacement-action="preview-shot-cut" data-person-replacement-shot-cut-selectable data-story-marquee-item data-story-marquee-id="' +
        escapeHtml(_0x12b98f['shotId']) +
        '" data-person-replacement-cut-shot-index="' +
        _0x5d6f78 +
        '" data-clip-index="' +
        _0x5d6f78 +
        '" data-media-kind="video" data-shot-id="' +
        escapeHtml(_0x12b98f['shotId']) +
        '\x22\x20' +
        (_0x1fd39b ? 'data-selected-clip="true"' : '') +
        '\x20' +
        (_0x51ef77 ? 'data-person-replacement-cut-merge-selected="true"' : '') +
        '\x20' +
        (_0x12b98f['isReversed'] === !![] ? 'data-person-replacement-cut-reversed="true"' : '') +
        ' role="button" tabindex="0" aria-pressed="' +
        _0x1fd39b +
        '" aria-label="' +
        escapeHtml(
          (_0x3013c3['title'] || '片段 ' + (_0x5d6f78 + 0x1)) +
            '，' +
            formatClock(_0x12b98f['startSec']) +
            ' 到 ' +
            formatClock(_0x12b98f['endSec']) +
            (_0x12b98f['isReversed'] === !![] ? '，已设为倒放' : '') +
            (_0x51ef77 ? '，已框选' : ''),
        ) +
        '">\n      ' +
        renderPersonReplacementShotCutFilmstrip(_0x3013c3, _0x649903, _0x12b98f['keyframeRef']) +
        '\n      <div class="media-clip-material-selection v2-video-clipselection person-replacement-shot-cut-selection" style="left:0%;width:100%" aria-hidden="true"><div class="media-clip-material-label v2-video-cliplabel" data-person-replacement-cut-duration="' +
        _0x5d6f78 +
        '\x22>' +
        formatDurationLabel(_0x43dceb) +
        '</div></div>\n      ' +
        (_0x12b98f['isReversed'] === !![]
          ? '<span class="person-replacement-shot-cut-reverse-badge" aria-hidden="true">倒放</span>'
          : '') +
        '\n      ' +
        _0x4f241b +
        _0x399c05 +
        '\n    </div>'
      );
    })['join'](''),
    _0x2142c0 = resolveMediaClipReverseControlState({
      isReversed: _0x519bc0?.['isReversed'] === !![],
      pending: _0x5b59d2,
    }),
    _0x3a992 = _0x2142c0['isReversed'];
  return (
    '<section class="person-replacement-shot-cut-editor" data-person-replacement-shot-cut-editor tabindex="-1" aria-label="调整全部镜头切口" aria-busy="' +
    _0x5e0350 +
    '">\n    <header class="person-replacement-shot-timeline-header">\n      <div><strong>调整全部切口</strong><span>' +
    _0x1074f3['length'] +
    '\x20个片段\x20·\x20' +
    _0x1e821a +
    ' 个可调切口</span><span class="person-replacement-shot-cut-clock"><output data-person-replacement-shot-cut-current-time>' +
    formatPreciseClock(_0x2704be) +
    '</output> / ' +
    formatPreciseClock(_0x882c21) +
    '</span></div>\n      <div class="person-replacement-shot-cut-actions">\n        <button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-sound is-icon-only ' +
    (soundEnabled ? 'is-sound-enabled' : '') +
    '" data-person-replacement-action="toggle-shot-cut-sound" data-tooltip="' +
    (soundEnabled ? '关闭声音' : '打开声音') +
    '" aria-label="' +
    (soundEnabled ? '关闭声音' : '打开声音') +
    '" aria-pressed="' +
    soundEnabled +
    '\x22\x20' +
    (_0x5e0350 ? 'disabled' : '') +
    '>' +
    _0x41aa00(soundEnabled ? 'soundOn' : 'soundOff') +
    '</button>\n        <button type="button" class="person-replacement-shot-cut-action is-icon-only" data-person-replacement-action="undo-shot-cut" aria-keyshortcuts="Control+Z Meta+Z" data-tooltip="撤回" aria-label="撤回" ' +
    (_0x39dd97 || !canUndo ? 'disabled' : '') +
    '>' +
    _0x41aa00('undo') +
    '</button>\n        <button type="button" class="person-replacement-shot-cut-action is-icon-only" data-person-replacement-action="reset-shot-cuts" data-tooltip="重置" aria-label="重置" ' +
    (_0x39dd97 ? 'disabled' : '') +
    '>' +
    _0x41aa00('reset') +
    '</button>\n        <button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-cancel is-icon-only" data-person-replacement-action="cancel-shot-cuts" data-tooltip="取消" aria-label="取消" ' +
    (_0x39dd97 ? 'disabled' : '') +
    '>' +
    _0x41aa00('close') +
    '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22person-replacement-shot-cut-action\x20is-primary\x20is-icon-only\x20' +
    (_0x57df65 ? 'is-loading' : '') +
    '\x22\x20data-person-replacement-action=\x22confirm-shot-cuts\x22\x20data-tooltip=\x22' +
    (_0x57df65 ? '正在应用切口' : '应用切口') +
    '" aria-label="' +
    (_0x57df65 ? '正在应用切口' : '应用切口') +
    '" aria-busy="' +
    _0x57df65 +
    '\x22\x20' +
    (_0x39dd97 || !_0x2a4c17 ? 'disabled' : '') +
    '>' +
    renderWorkspaceConfirmIcon() +
    '</button>\n      </div>\n    </header>\n    <div class="person-replacement-shot-cut-shell media-clip-compact is-editing' +
    (_0x5e0350 ? '\x20img-preview-loading' : '') +
    '" aria-busy="' +
    _0x5e0350 +
    '">\n      <div class="media-clip-compact-body">\n        <div class="person-replacement-shot-cut-scroll media-clip-timeline-scroll" data-person-replacement-shot-timeline-scroll data-story-marquee-surface="shot-cuts" tabindex="0">\n          <div class="person-replacement-shot-cut-timeline media-clip-compact-timeline is-editing" data-person-replacement-shot-cut-timeline style="--media-clip-track-content-width:' +
    _0x649903 +
    'px;--media-clip-timeline-content-width:' +
    _0x649903 +
    'px;--media-clip-track-axis-width:0px;--cut-total-duration:' +
    _0x882c21['toFixed'](0x5) +
    '">\n            <div class="media-clip-ruler person-replacement-shot-cut-ruler" aria-hidden="true">' +
    _0x30081f +
    '</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-clip-timeline-lane\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-clip-timeline-tracks\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-shot-cut-track\x20media-clip-track\x20media-clip-track-video\x20is-active\x22\x20data-person-replacement-shot-cut-track>' +
    (_0x5a2a4b || '<div class="person-replacement-shot-timeline-empty-state">暂无可调整的镜头切口</div>') +
    '</div>\n              </div>\n            </div>\n            <div class="person-replacement-shot-cut-annotations">' +
    _0x5c9940['join']('') +
    _0x12e1ce['join']('') +
    '</div>\n            <div class="media-clip-timeline-cursors person-replacement-shot-cut-cursors" aria-hidden="true">\n              <div class="media-clip-playhead media-clip-timeline-cursor media-clip-timeline-cursor-fixed person-replacement-shot-cut-playhead" data-person-replacement-shot-cut-playhead style="left:' +
    ((_0x2704be / _0x3bff4b) * 0x64)['toFixed'](0x4) +
    '%\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-clip-hover-playhead\x20media-clip-timeline-cursor\x20media-clip-timeline-cursor-hover\x20person-replacement-shot-cut-hover-playhead\x22\x20data-person-replacement-shot-cut-hover-playhead\x20hidden></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20' +
    _0x480ff6 +
    '\n    </div>\n    <div class="person-replacement-shot-cut-primary-actions" aria-label="片段编辑工具">\n      <button type="button" class="person-replacement-shot-cut-action is-icon-only ' +
    (keyframeCapturing ? 'is-loading' : '') +
    '" data-person-replacement-action="capture-shot-keyframe" data-tooltip="' +
    (keyframeCapturing ? '正在获取关键帧' : '获取关键帧') +
    '\x22\x20aria-label=\x22' +
    (keyframeCapturing ? '正在获取关键帧' : '获取关键帧') +
    '\x22\x20aria-busy=\x22' +
    keyframeCapturing +
    '\x22\x20' +
    (_0x5e0350 || keyframeCapturing || _0x28ec2c['shotIndex'] < 0x0 ? 'disabled' : '') +
    '>' +
    renderWorkspaceKeyframeIcon() +
    '</button>\n      <button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-split is-icon-only" data-person-replacement-action="split-shot-cut" aria-keyshortcuts="C" data-tooltip="裁剪（C）" aria-label="裁剪（C）" ' +
    (_0x39dd97 || !_0x25b61c ? 'disabled' : '') +
    '>' +
    VIDEO_CLIP_ICON_SVG +
    '</button>\n      <button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-reverse is-icon-only ' +
    (_0x5b59d2 ? 'is-loading' : _0x3a992 ? 'is-active' : '') +
    '" data-person-replacement-action="toggle-shot-cut-reverse" data-tooltip="' +
    _0x2142c0['label'] +
    '\x22\x20aria-label=\x22' +
    _0x2142c0['label'] +
    '\x22\x20aria-busy=\x22' +
    _0x2142c0['ariaBusy'] +
    '" aria-pressed="' +
    _0x2142c0['ariaPressed'] +
    '\x22\x20' +
    (_0x39dd97 || _0x28ec2c['shotIndex'] < 0x0 ? 'disabled' : '') +
    '>' +
    _0x41aa00('reverse') +
    '</button>\n      ' +
    (_0x44ac92
      ? '<button type="button" class="person-replacement-shot-cut-action person-replacement-shot-cut-merge is-icon-only" data-person-replacement-action="merge-shot-cuts" data-tooltip="合并片段" aria-label="合并片段" ' +
        (_0x39dd97 || !_0x3983a3 ? 'disabled' : '') +
        '>' +
        _0x41aa00('merge') +
        '</button>'
      : '') +
    '\n    </div>\n    <div class="person-replacement-shot-cut-helper-row" aria-label="时间轴操作提示">\n      <div class="person-replacement-shot-cut-helper-left">\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:0"><kbd>Space</kbd><span>播放 / 暂停</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:1"><kbd>← →</kbd><span>逐帧移动播放头</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:2"><kbd>C</kbd><span>在播放头处增加切口</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:3"><kbd>Ctrl / ⌘ Z</kbd><span>撤回上一步裁剪操作</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:4"><kbd>Ctrl / ⌘ + −</kbd><span>缩放时间轴</span></span>\n        <span class="person-replacement-shot-cut-helper-msg" style="--person-replacement-shot-cut-helper-index:5"><kbd>拖动切口</kbd><span>左右片段同步伸缩</span></span>\n      </div>\n    </div>\n  </section>'
  );
}
function renderShotTimelineStage(
  _0x3b11fa,
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
  _0x4b91e9 = () => '',
) {
  const _0x1c65ad = cutEditorOpen && cutEditorMotion !== 'to-timeline',
    _0x3cf1db =
      cutEditorMotion === 'to-editor'
        ? 'is-flipping-to-editor'
        : cutEditorMotion === 'to-timeline'
          ? 'is-flipping-to-timeline'
          : '',
    _0x2a2125 = Boolean(_0x3cf1db),
    _0x226306 = cutEditorOpening ? '\x20is-cut-editor-loading\x20img-preview-loading' : '',
    _0x39112d = _0x1c65ad || cutEditorOpening;
  return (
    '<div class="person-replacement-shot-timeline-stage ' +
    (_0x1c65ad ? 'is-editor' : 'is-timeline') +
    '\x20' +
    (_0x2a2125 ? 'is-animating' : 'is-settled') +
    _0x226306 +
    '" data-person-replacement-shot-timeline-stage aria-busy="' +
    cutEditorOpening +
    '\x22' +
    (cutEditorOpening ? ' aria-label="视频加载中，正在准备裁剪预览"' : '') +
    '>\n    <div class="person-replacement-shot-timeline-cube ' +
    _0x3cf1db +
    '">\n      <div class="person-replacement-shot-timeline-face person-replacement-shot-timeline-face--timeline" aria-hidden="' +
    _0x1c65ad +
    '\x22\x20' +
    (_0x39112d ? 'inert' : '') +
    '>' +
    renderShotTimeline(_0x3b11fa, {
      allowCutEditing: allowCutEditing,
      mode: timelineMode,
      isBatchGenerating: shotBatchGenerationActive,
      batchGeneratingShotIds: shotBatchGeneratingShotIds,
      batchCancelRequested: shotBatchCancelRequested,
    }) +
    '</div>\n      <div class="person-replacement-shot-timeline-face person-replacement-shot-timeline-face--editor" aria-hidden="' +
    !_0x1c65ad +
    '\x22\x20' +
    (_0x1c65ad ? '' : 'inert') +
    '>' +
    renderShotCutEditor(
      _0x3b11fa,
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
      _0x4b91e9,
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
  const _0x2180e3 = typeof renderIcon === 'function' ? renderIcon : () => '';
  return Object['freeze']({
    renderHistoryMenu({
      kind: kind = 'image',
      shot: shot = {},
      title: title = '镜头片段',
      allowSingleResult: allowSingleResult = ![],
    } = {}) {
      const _0x15df47 = { allowSingleResult: allowSingleResult };
      return kind === 'video'
        ? renderReplacementVideoHistoryMenu(shot, title, _0x15df47)
        : renderReplacementImageHistoryMenu(shot, title, _0x15df47);
    },
    renderTimeline: renderShotTimeline,
    renderStage(_0x3b6f7c, _0x223abe = {}) {
      return renderShotTimelineStage(_0x3b6f7c, _0x223abe, _0x2180e3);
    },
  });
}
