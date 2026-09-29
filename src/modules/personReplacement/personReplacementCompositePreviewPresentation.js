import { localPathToUrl } from '../../utils/localMediaPath.js';
import { renderWorkspaceAssetLoadingOverlay } from '../workspaceAssetPresentation.js';
import {
  renderPersonReplacementAssetCard,
  renderPersonReplacementPreviewArrow,
} from './personReplacementAssetPresentation.js';
import {
  PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE,
  normalizePersonReplacementCompositeSidebarWidth,
} from './personReplacementProjectSession.js';
import { getPersonReplacementShotDurationSec } from './personReplacementShotCutModel.js';
function escapeHtml(_0x5acd49) {
  return String(_0x5acd49 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x2dc3a3, _0x37c547 = '') {
  const _0x349ed2 = String(_0x2dc3a3 ?? '')['trim']();
  return _0x349ed2 || _0x37c547;
}
function normalizeMediaUrl(_0x436c0f) {
  const _0x49b48f = normalizeText(_0x436c0f);
  return _0x49b48f ? localPathToUrl(_0x49b48f) || _0x49b48f : '';
}
function formatClock(_0x4e2b5a) {
  const _0xa17880 = Math['max'](0x0, Number(_0x4e2b5a) || 0x0),
    _0xc69953 = Math['floor'](_0xa17880 / 0x3c),
    _0x512dda = Math['floor'](_0xa17880 % 0x3c);
  return String(_0xc69953)['padStart'](0x2, '0') + ':' + String(_0x512dda)['padStart'](0x2, '0');
}
function renderVideoIcon() {
  return '<svg class="person-replacement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="3"/><path d="m17 10 4-2v8l-4-2"/></svg>';
}
function renderCompositePreviewShotList(_0x27d7fc) {
  const _0x3ad0b7 =
      _0x27d7fc['previewMode'] === 'full' ? '' : normalizeText(_0x27d7fc['selectedShot']?.['id']),
    _0x348d13 = {
      data: { assets: [], project: {} },
      assetFilter: 'scene',
      selectedAssetId: _0x3ad0b7,
      selectedAssetIds: _0x27d7fc['selectedShotIds'],
      assetSelectionMode: _0x27d7fc['selectionMode'],
      assetAppearanceIndexes: {},
      generatingAppearanceKeys: [],
      isBatchGenerating: ![],
      batchGeneratingAssetIds: [],
      allowDeleteAssetCard: ![],
      allowAssetRename: ![],
      hideAssetRoleTag: !![],
      hideAssetNameTooltip: !![],
    };
  return _0x27d7fc['shots']
    ['map']((_0x2fa701, _0x4297b0) => {
      const _0x36d003 = normalizeText(_0x2fa701?.['id']),
        _0x48c9f4 = _0x36d003 === _0x3ad0b7,
        _0x1d80e6 = Boolean(_0x2fa701?.['resultVideoRef']),
        _0x3d0e20 = getPersonReplacementShotDurationSec(_0x2fa701),
        _0x10a754 = '镜头片段' + String(_0x4297b0 + 0x1)['padStart'](0x2, '0'),
        _0x7b36ed = normalizeMediaUrl(_0x2fa701?.['replacementImageRef'] || _0x2fa701?.['keyframeRef']),
        _0x447231 =
          (_0x3d0e20 > 0x0 ? formatClock(_0x3d0e20) : '00:00') +
          ' · ' +
          (_0x1d80e6 ? '替换视频已就绪' : '等待替换视频'),
        _0x1fd698 = _0x7b36ed ? 'data-person-replacement-composite-shot-hover-preview="true"' : '';
      return renderPersonReplacementAssetCard(
        _0x348d13,
        {
          id: _0x36d003,
          kind: 'scene',
          name: _0x10a754,
          description: '',
          imageUrl: _0x7b36ed,
          appearances: [{ id: 'composite-thumbnail', name: '片段缩略图', imageUrl: _0x7b36ed }],
        },
        {
          statusText: _0x447231,
          cardClassName: 'person-replacement-shot-card person-replacement-preview-shot-card',
          cardAttributes:
            'data-person-replacement-shot-card=\x22true\x22\x20data-shot-id=\x22' +
            escapeHtml(_0x36d003) +
            '\x22\x20' +
            _0x1fd698 +
            '\x20aria-current=\x22' +
            _0x48c9f4 +
            '\x22\x20aria-label=\x22' +
            escapeHtml(_0x10a754 + '，' + _0x447231 + (_0x48c9f4 ? '，当前片段' : '')) +
            '\x22',
        },
      );
    })
    ['join']('');
}
function renderCompositeFullVideoEntry(_0x2bdb5c) {
  if (!_0x2bdb5c['fullAvailable']) return '';
  const _0x51e833 = _0x2bdb5c['composedShots']['reduce'](
      (_0x429678, _0x272631) => _0x429678 + getPersonReplacementShotDurationSec(_0x272631),
      0x0,
    ),
    _0x3ed9d7 = _0x2bdb5c['previewMode'] === 'full',
    _0x1860d2 = _0x2bdb5c['composedShots']['length'] + ' 个片段 · ' + formatClock(_0x51e833),
    _0x1d03ee = _0x2bdb5c['compositionStale'] ? '旧合成视频' : '完整视频',
    _0x33b35 = _0x2bdb5c['compositionStale'] ? _0x1860d2 + ' · 需重新合成' : _0x1860d2;
  return (
    '<div class="person-replacement-composite-full-entry">\n    <button type="button" class="person-replacement-composite-full-button' +
    (_0x3ed9d7 ? ' is-selected' : '') +
    '" data-person-replacement-action="select-composite-full-video" aria-current="' +
    _0x3ed9d7 +
    '" aria-label="' +
    escapeHtml(_0x1d03ee) +
    '，' +
    escapeHtml(_0x33b35) +
    '\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-composite-full-icon\x22\x20aria-hidden=\x22true\x22>' +
    renderVideoIcon() +
    '</span>\n      <span class="person-replacement-composite-full-copy"><strong>' +
    escapeHtml(_0x1d03ee) +
    '</strong><small>' +
    escapeHtml(_0x33b35) +
    '</small></span>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20</div>'
  );
}
function renderCompositePreviewShotRail(_0x194ad1) {
  const _0x1e18ed =
      _0x194ad1['shots']['length'] > 0x0 &&
      _0x194ad1['shots']['every']((_0x5aa715) => _0x194ad1['selectedShotIds']['includes'](_0x5aa715['id'])),
    _0x12833e =
      '<button type="button" class="story-secondary-button" data-story-action="toggle-all-shots" aria-pressed="' +
      _0x1e18ed +
      '\x22\x20' +
      (_0x194ad1['shots']['length'] ? '' : 'disabled') +
      '>' +
      (_0x1e18ed ? '取消全选' : '全选') +
      '</button>',
    _0x3c88bf = _0x194ad1['selectionMode']
      ? '已选 ' + _0x194ad1['selectedShotIds']['length']
      : _0x194ad1['completed'] + '/' + _0x194ad1['shots']['length'];
  return (
    '<aside class="person-replacement-preview-shot-rail' +
    (_0x194ad1['fullAvailable'] ? ' has-complete-video' : '') +
    '" aria-label="待检查片段">\n    ' +
    renderCompositeFullVideoEntry(_0x194ad1) +
    '\x0a\x20\x20\x20\x20<header\x20class=\x22' +
    (_0x194ad1['selectionMode'] ? 'is-selection-mode' : '') +
    '">\n      <div class="person-replacement-preview-shot-heading"><strong>镜头片段</strong><small>' +
    (_0x194ad1['selectionMode'] ? '拖拽空白区域可框选' : '逐段检查替换结果') +
    '</small></div>\n      <div class="person-replacement-preview-shot-actions"><span>' +
    _0x3c88bf +
    '</span>' +
    _0x12833e +
    '</div>\x0a\x20\x20\x20\x20</header>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-preview-shot-list\x22\x20data-story-marquee-surface=\x22shots\x22\x20tabindex=\x220\x22>' +
    renderCompositePreviewShotList(_0x194ad1) +
    '</div>\n  </aside>'
  );
}
function renderCompositePreviewMediaCard({
  kind: _0x46dbf9,
  label: _0x24c91a,
  description: _0x1c8bf4,
  mediaRef: _0x2a10ac,
  posterRef: posterRef = '',
  playable: playable = ![],
  loading: loading = ![],
  showShotNavigation: showShotNavigation = ![],
  footerDetail: footerDetail = '',
} = {}) {
  const _0x4e1fbb = normalizeText(_0x2a10ac),
    _0x26b57e = normalizeText(posterRef),
    _0x10ed7b = _0x46dbf9 === 'replacement',
    _0x338a48 = showShotNavigation
      ? '' +
        renderPersonReplacementPreviewArrow('previous', {
          action: 'previous-shot',
          label: '上一个片段',
          className:
            'person-replacement-shot-navigation-arrow ' +
            'person-replacement-composite-shot-navigation-arrow',
        }) +
        renderPersonReplacementPreviewArrow('next', {
          action: 'next-shot',
          label: '下一个片段',
          className:
            'person-replacement-shot-navigation-arrow\x20' +
            'person-replacement-composite-shot-navigation-arrow',
        })
      : '',
    _0x118bf9 = showShotNavigation
      ? ' data-person-replacement-shot-wheel="true" aria-label="滚动鼠标滚轮或使用左右按钮切换片段"'
      : '';
  return (
    '<article class="person-replacement-compare-card is-' +
    escapeHtml(_0x46dbf9) +
    '" data-person-replacement-compare-card="' +
    escapeHtml(_0x46dbf9) +
    '">\n    <header class="person-replacement-compare-card-heading">\n      <span class="person-replacement-compare-card-label"><i aria-hidden="true"></i>' +
    escapeHtml(_0x24c91a) +
    '</span>\x0a\x20\x20\x20\x20\x20\x20<small>' +
    escapeHtml(_0x1c8bf4) +
    '</small>\n    </header>\n    <div class="person-replacement-compare-media-frame' +
    (loading ? ' img-preview-loading' : '') +
    '\x22' +
    _0x118bf9 +
    (loading ? ' aria-busy="true" inert' : '') +
    '>\n      <button type="button" class="person-replacement-compare-media" data-person-replacement-compare-playback="' +
    escapeHtml(_0x46dbf9) +
    '" data-person-replacement-action="toggle-comparison-playback" aria-label="播放原视频和替换视频" aria-pressed="false" ' +
    (playable && _0x4e1fbb ? '' : 'disabled') +
    '>\n        ' +
    (_0x4e1fbb
      ? '<video data-person-replacement-compare-video="' +
        escapeHtml(_0x46dbf9) +
        '" data-person-replacement-compare-video-url="' +
        escapeHtml(normalizeMediaUrl(_0x4e1fbb)) +
        '" playsinline preload="metadata" muted' +
        (_0x26b57e ? ' poster="' + escapeHtml(normalizeMediaUrl(_0x26b57e)) + '\x22' : '') +
        '\x20aria-label=\x22' +
        escapeHtml(_0x24c91a) +
        '"></video>'
      : '<div class="person-replacement-compare-empty"><span aria-hidden="true">' +
        (_0x10ed7b ? '↗' : '□') +
        '</span><strong>' +
        (_0x10ed7b ? '等待替换视频' : '原视频尚未准备') +
        '</strong><small>' +
        (_0x10ed7b ? '返回视频替换生成当前片段后，可在这里同步对比。' : '完成视频切片后即可预览。') +
        '</small></div>') +
    '\n      </button>\n      ' +
    _0x338a48 +
    '\n      ' +
    (loading
      ? renderWorkspaceAssetLoadingOverlay({
          title: '视频合成中',
          description: '正在合成替换片段，完成后会自动显示完整视频。',
        })
      : '') +
    '\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20<footer><span>' +
    (_0x4e1fbb ? '已载入' : '未载入') +
    '</span><small>' +
    escapeHtml(footerDetail || (_0x10ed7b ? '生成结果' : '原始片段')) +
    '</small></footer>\n  </article>'
  );
}
function renderCompositeSidebarSplitter(_0x3ab6b0) {
  const _0x545024 = normalizePersonReplacementCompositeSidebarWidth(_0x3ab6b0);
  return (
    '<div\x20class=\x22person-replacement-composite-sidebar-splitter\x20panel-resize-handle\x20panel-resize-handle--transient\x22\x20data-person-replacement-composite-sidebar-splitter\x20role=\x22separator\x22\x20aria-orientation=\x22vertical\x22\x20aria-label=\x22调整镜头片段侧栏与显示区域宽度\x22\x20aria-valuemin=\x22' +
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE['min'] +
    '" aria-valuemax="' +
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE['max'] +
    '\x22\x20aria-valuenow=\x22' +
    Math['round'](_0x545024) +
    '\x22\x20tabindex=\x220\x22></div>'
  );
}
function renderCompositePreview(
  _0x337fbe,
  {
    composeActionHtml: composeActionHtml = '',
    playbackControlsHtml: playbackControlsHtml = '',
    composeOutputPending: composeOutputPending = ![],
  } = {},
) {
  const _0x8ba6f3 = _0x337fbe['previewMode'] === 'full',
    _0x36c98e = _0x337fbe['media']['replacementAudioRef'] ? '声音克隆音轨' : '替换视频内音轨',
    _0x3ecbe0 = _0x8ba6f3
      ? _0x337fbe['compositionStale']
        ? '<span>旧合成视频</span><small>图像或视频已更新 · 需重新合成</small>'
        : '<span>完整视频</span><small>' +
          _0x337fbe['composedShots']['length'] +
          '\x20个片段\x20·\x20对比已就绪</small>'
      : '<span>' +
        String(_0x337fbe['selectedShotIndex'] + 0x1)['padStart'](0x2, '0') +
        ' / ' +
        String(Math['max'](_0x337fbe['total'], 0x1))['padStart'](0x2, '0') +
        '</span><small>' +
        (_0x337fbe['composeSucceeded']
          ? '全部视频已合成'
          : '已替换 ' + _0x337fbe['completed'] + '/' + _0x337fbe['total'] + '，其余保留原片') +
        '</small>';
  return (
    '<div class="person-replacement-preview-page" data-person-replacement-composite-preview data-preview-track="' +
    escapeHtml(_0x337fbe['previewTrack']) +
    '\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-preview-workbench\x22\x20style=\x22--person-replacement-composite-sidebar-width:' +
    _0x337fbe['sidebarWidth'] +
    'px;">\n      ' +
    renderCompositePreviewShotRail(_0x337fbe) +
    '\n      ' +
    renderCompositeSidebarSplitter(_0x337fbe['sidebarWidth']) +
    '\n      <section class="person-replacement-compare-workspace" aria-label="原视频与替换视频对比">\n        <header class="person-replacement-compare-heading">\n          <div><span class="person-replacement-eyebrow">合成视频</span><h2><input type="text" class="person-replacement-composite-project-title" data-person-replacement-composite-project-title value="' +
    escapeHtml(_0x337fbe['title']) +
    '" maxlength="120" autocomplete="off" spellcheck="false" aria-label="项目名称，点击修改"></h2><p>同步检查动作、构图与声音，确认后再生成最终合成。</p></div>\n          <div class="person-replacement-compare-heading-actions">\n            ' +
    composeActionHtml +
    '\n            <div class="person-replacement-compare-summary">' +
    _0x3ecbe0 +
    '</div>\n          </div>\n        </header>\n        <div class="person-replacement-compare-grid">\n          ' +
    renderCompositePreviewMediaCard({
      kind: 'original',
      label: '原视频',
      description: _0x8ba6f3 ? '全部原片按时间轴合成' : '动作与镜头基准',
      mediaRef: _0x337fbe['media']['originalRef'],
      posterRef: _0x8ba6f3 ? '' : _0x337fbe['selectedShot']?.['keyframeRef'],
      playable: _0x337fbe['canCompare'],
      showShotNavigation: !_0x8ba6f3 && _0x337fbe['total'] > 0x1,
      footerDetail: _0x8ba6f3 ? '原片完整对照' : '原始片段',
    }) +
    '\n          ' +
    renderCompositePreviewMediaCard({
      kind: 'replacement',
      label: '替换视频',
      description: _0x8ba6f3 ? '替换片段优先，未替换片段保留原片' : '人物替换结果',
      mediaRef: _0x337fbe['media']['replacementRef'],
      posterRef: _0x8ba6f3 ? '' : _0x337fbe['selectedShot']?.['replacementImageRef'],
      playable: _0x337fbe['canCompare'],
      loading: composeOutputPending,
      showShotNavigation: !_0x8ba6f3 && _0x337fbe['total'] > 0x1,
      footerDetail: _0x8ba6f3 ? '替换完整结果' : '生成结果',
    }) +
    '\n        </div>\n        <div class="person-replacement-compare-controls" data-person-replacement-compare-footer>\n          ' +
    playbackControlsHtml +
    '\n          <div class="person-replacement-compare-control-row">\n            <div class="person-replacement-track-setting"><span>播放音轨</span><div class="person-replacement-track-options" role="group" aria-label="播放音轨">\n              <button type="button" class="' +
    (_0x337fbe['previewTrack'] === 'original' ? 'is-selected' : '') +
    '" data-person-replacement-action="set-preview-track" data-preview-track="original" aria-pressed="' +
    (_0x337fbe['previewTrack'] === 'original') +
    '"><strong>原视频音轨</strong><small>保留现场原声</small></button>\n              <button type="button" class="' +
    (_0x337fbe['previewTrack'] === 'replacement' ? 'is-selected' : '') +
    '" data-person-replacement-action="set-preview-track" data-preview-track="replacement" aria-pressed="' +
    (_0x337fbe['previewTrack'] === 'replacement') +
    '"><strong>替换音轨</strong><small>' +
    escapeHtml(_0x36c98e) +
    '</small></button>\n            </div></div>\n          </div>\n        </div>\n        ' +
    (_0x8ba6f3 && _0x337fbe['media']['originalAudioRef']
      ? '<audio\x20data-person-replacement-compare-original-audio\x20data-person-replacement-compare-original-audio-url=\x22' +
        escapeHtml(normalizeMediaUrl(_0x337fbe['media']['originalAudioRef'])) +
        '\x22\x20preload=\x22none\x22></audio>'
      : '') +
    '\n        ' +
    (_0x337fbe['media']['replacementAudioRef']
      ? '<audio data-person-replacement-compare-replacement-audio data-person-replacement-compare-replacement-audio-url="' +
        escapeHtml(normalizeMediaUrl(_0x337fbe['media']['replacementAudioRef'])) +
        '\x22\x20preload=\x22none\x22></audio>'
      : '') +
    '\x0a\x20\x20\x20\x20\x20\x20</section>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>'
  );
}
export function createPersonReplacementCompositePreviewPresentation() {
  return Object['freeze']({ render: renderCompositePreview, renderRail: renderCompositePreviewShotRail });
}
