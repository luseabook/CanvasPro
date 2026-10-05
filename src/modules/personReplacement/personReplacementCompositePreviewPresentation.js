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
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#39;');
}
function normalizeText(item, key = '') {
  const index = String(item ?? '')['trim']();
  return index || key;
}
function normalizeMediaUrl(result) {
  const text = normalizeText(result);
  return text ? localPathToUrl(text) || text : '';
}
function formatClock(data) {
  const options = Math['max'](0, Number(data) || 0),
    target = Math['floor'](options / 60),
    source = Math['floor'](options % 60);
  return String(target)['padStart'](2, '0') + ':' + String(source)['padStart'](2, '0');
}
function renderVideoIcon() {
  return '<svg class="person-replacement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="3"/><path d="m17 10 4-2v8l-4-2"/></svg>';
}
function renderCompositePreviewShotList(selectedAssetIds) {
  const selectedAssetId =
      selectedAssetIds['previewMode'] === 'full'
        ? ''
        : normalizeText(selectedAssetIds['selectedShot']?.['id']),
    next = {
      data: { assets: [], project: {} },
      assetFilter: 'scene',
      selectedAssetId: selectedAssetId,
      selectedAssetIds: selectedAssetIds['selectedShotIds'],
      assetSelectionMode: selectedAssetIds['selectionMode'],
      assetAppearanceIndexes: {},
      generatingAppearanceKeys: [],
      isBatchGenerating: ![],
      batchGeneratingAssetIds: [],
      allowDeleteAssetCard: ![],
      allowAssetRename: ![],
      hideAssetRoleTag: !![],
      hideAssetNameTooltip: !![],
    };
  return selectedAssetIds['shots']
    ['map']((current, entry) => {
      const id = normalizeText(current?.['id']),
        record = id === selectedAssetId,
        payload = Boolean(current?.['resultVideoRef']),
        personReplacementShotDurationSec = getPersonReplacementShotDurationSec(current),
        name = '镜头片段' + String(entry + 1)['padStart'](2, '0'),
        imageUrl = normalizeMediaUrl(current?.['replacementImageRef'] || current?.['keyframeRef']),
        statusText =
          (personReplacementShotDurationSec > 0 ? formatClock(personReplacementShotDurationSec) : '00:00') +
          ' · ' +
          (payload ? '替换视频已就绪' : '等待替换视频'),
        handle = imageUrl ? 'data-person-replacement-composite-shot-hover-preview="true"' : '';
      return renderPersonReplacementAssetCard(
        next,
        {
          id: id,
          kind: 'scene',
          name: name,
          description: '',
          imageUrl: imageUrl,
          appearances: [{ id: 'composite-thumbnail', name: '片段缩略图', imageUrl: imageUrl }],
        },
        {
          statusText: statusText,
          cardClassName: 'person-replacement-shot-card person-replacement-preview-shot-card',
          cardAttributes:
            'data-person-replacement-shot-card="true" data-shot-id="' +
            escapeHtml(id) +
            '" ' +
            handle +
            ' aria-current="' +
            record +
            '" aria-label="' +
            escapeHtml(name + '，' + statusText + (record ? '，当前片段' : '')) +
            '"',
        },
      );
    })
    ['join']('');
}
function renderCompositeFullVideoEntry(enabled) {
  if (!enabled['fullAvailable']) return '';
  const state = enabled['composedShots']['reduce'](
      (config, scope) => config + getPersonReplacementShotDurationSec(scope),
      0,
    ),
    input = enabled['previewMode'] === 'full',
    output = enabled['composedShots']['length'] + ' 个片段 · ' + formatClock(state),
    value2 = enabled['compositionStale'] ? '旧合成视频' : '完整视频',
    value3 = enabled['compositionStale'] ? output + ' · 需重新合成' : output;
  return (
    '<div class="person-replacement-composite-full-entry">\n    <button type="button" class="person-replacement-composite-full-button' +
    (input ? ' is-selected' : '') +
    '" data-person-replacement-action="select-composite-full-video" aria-current="' +
    input +
    '" aria-label="' +
    escapeHtml(value2) +
    '，' +
    escapeHtml(value3) +
    '">\n      <span class="person-replacement-composite-full-icon" aria-hidden="true">' +
    renderVideoIcon() +
    '</span>\n      <span class="person-replacement-composite-full-copy"><strong>' +
    escapeHtml(value2) +
    '</strong><small>' +
    escapeHtml(value3) +
    '</small></span>\n    </button>\n  </div>'
  );
}
function renderCompositePreviewShotRail(value4) {
  const value5 =
      value4['shots']['length'] > 0 &&
      value4['shots']['every']((value6) => value4['selectedShotIds']['includes'](value6['id'])),
    value7 =
      '<button type="button" class="story-secondary-button" data-story-action="toggle-all-shots" aria-pressed="' +
      value5 +
      '" ' +
      (value4['shots']['length'] ? '' : 'disabled') +
      '>' +
      (value5 ? '取消全选' : '全选') +
      '</button>',
    value8 = value4['selectionMode']
      ? '已选 ' + value4['selectedShotIds']['length']
      : value4['completed'] + '/' + value4['shots']['length'];
  return (
    '<aside class="person-replacement-preview-shot-rail' +
    (value4['fullAvailable'] ? ' has-complete-video' : '') +
    '" aria-label="待检查片段">\n    ' +
    renderCompositeFullVideoEntry(value4) +
    '\n    <header class="' +
    (value4['selectionMode'] ? 'is-selection-mode' : '') +
    '">\n      <div class="person-replacement-preview-shot-heading"><strong>镜头片段</strong><small>' +
    (value4['selectionMode'] ? '拖拽空白区域可框选' : '逐段检查替换结果') +
    '</small></div>\n      <div class="person-replacement-preview-shot-actions"><span>' +
    value8 +
    '</span>' +
    value7 +
    '</div>\n    </header>\n    <div class="person-replacement-preview-shot-list" data-story-marquee-surface="shots" tabindex="0">' +
    renderCompositePreviewShotList(value4) +
    '</div>\n  </aside>'
  );
}
function renderCompositePreviewMediaCard({
  kind: kind,
  label: label,
  description: description,
  mediaRef: mediaRef,
  posterRef: posterRef = '',
  playable: playable = ![],
  loading: loading = ![],
  showShotNavigation: showShotNavigation = ![],
  footerDetail: footerDetail = '',
} = {}) {
  const text2 = normalizeText(mediaRef),
    text3 = normalizeText(posterRef),
    value9 = kind === 'replacement',
    value10 = showShotNavigation
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
            'person-replacement-shot-navigation-arrow ' +
            'person-replacement-composite-shot-navigation-arrow',
        })
      : '',
    value11 = showShotNavigation
      ? ' data-person-replacement-shot-wheel="true" aria-label="滚动鼠标滚轮或使用左右按钮切换片段"'
      : '';
  return (
    '<article class="person-replacement-compare-card is-' +
    escapeHtml(kind) +
    '" data-person-replacement-compare-card="' +
    escapeHtml(kind) +
    '">\n    <header class="person-replacement-compare-card-heading">\n      <span class="person-replacement-compare-card-label"><i aria-hidden="true"></i>' +
    escapeHtml(label) +
    '</span>\n      <small>' +
    escapeHtml(description) +
    '</small>\n    </header>\n    <div class="person-replacement-compare-media-frame' +
    (loading ? ' img-preview-loading' : '') +
    '"' +
    value11 +
    (loading ? ' aria-busy="true" inert' : '') +
    '>\n      <button type="button" class="person-replacement-compare-media" data-person-replacement-compare-playback="' +
    escapeHtml(kind) +
    '" data-person-replacement-action="toggle-comparison-playback" aria-label="播放原视频和替换视频" aria-pressed="false" ' +
    (playable && text2 ? '' : 'disabled') +
    '>\n        ' +
    (text2
      ? '<video data-person-replacement-compare-video="' +
        escapeHtml(kind) +
        '" data-person-replacement-compare-video-url="' +
        escapeHtml(normalizeMediaUrl(text2)) +
        '" playsinline preload="metadata" muted' +
        (text3 ? ' poster="' + escapeHtml(normalizeMediaUrl(text3)) + '"' : '') +
        ' aria-label="' +
        escapeHtml(label) +
        '"></video>'
      : '<div class="person-replacement-compare-empty"><span aria-hidden="true">' +
        (value9 ? '↗' : '□') +
        '</span><strong>' +
        (value9 ? '等待替换视频' : '原视频尚未准备') +
        '</strong><small>' +
        (value9 ? '返回视频替换生成当前片段后，可在这里同步对比。' : '完成视频切片后即可预览。') +
        '</small></div>') +
    '\n      </button>\n      ' +
    value10 +
    '\n      ' +
    (loading
      ? renderWorkspaceAssetLoadingOverlay({
          title: '视频合成中',
          description: '正在合成替换片段，完成后会自动显示完整视频。',
        })
      : '') +
    '\n    </div>\n    <footer><span>' +
    (text2 ? '已载入' : '未载入') +
    '</span><small>' +
    escapeHtml(footerDetail || (value9 ? '生成结果' : '原始片段')) +
    '</small></footer>\n  </article>'
  );
}
function renderCompositeSidebarSplitter(value12) {
  const personReplacementCompositeSidebarWidth = normalizePersonReplacementCompositeSidebarWidth(value12);
  return (
    '<div class="person-replacement-composite-sidebar-splitter panel-resize-handle panel-resize-handle--transient" data-person-replacement-composite-sidebar-splitter role="separator" aria-orientation="vertical" aria-label="调整镜头片段侧栏与显示区域宽度" aria-valuemin="' +
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE['min'] +
    '" aria-valuemax="' +
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE['max'] +
    '" aria-valuenow="' +
    Math['round'](personReplacementCompositeSidebarWidth) +
    '" tabindex="0"></div>'
  );
}
function renderCompositePreview(
  mediaRef2,
  {
    composeActionHtml: composeActionHtml = '',
    playbackControlsHtml: playbackControlsHtml = '',
    composeOutputPending: composeOutputPending = ![],
  } = {},
) {
  const description2 = mediaRef2['previewMode'] === 'full',
    value13 = mediaRef2['media']['replacementAudioRef'] ? '声音克隆音轨' : '替换视频内音轨',
    value14 = description2
      ? mediaRef2['compositionStale']
        ? '<span>旧合成视频</span><small>图像或视频已更新 · 需重新合成</small>'
        : '<span>完整视频</span><small>' +
          mediaRef2['composedShots']['length'] +
          ' 个片段 · 对比已就绪</small>'
      : '<span>' +
        String(mediaRef2['selectedShotIndex'] + 1)['padStart'](2, '0') +
        ' / ' +
        String(Math['max'](mediaRef2['total'], 1))['padStart'](2, '0') +
        '</span><small>' +
        (mediaRef2['composeSucceeded']
          ? '全部视频已合成'
          : '已替换 ' + mediaRef2['completed'] + '/' + mediaRef2['total'] + '，其余保留原片') +
        '</small>';
  return (
    '<div class="person-replacement-preview-page" data-person-replacement-composite-preview data-preview-track="' +
    escapeHtml(mediaRef2['previewTrack']) +
    '">\n    <div class="person-replacement-preview-workbench" style="--person-replacement-composite-sidebar-width:' +
    mediaRef2['sidebarWidth'] +
    'px;">\n      ' +
    renderCompositePreviewShotRail(mediaRef2) +
    '\n      ' +
    renderCompositeSidebarSplitter(mediaRef2['sidebarWidth']) +
    '\n      <section class="person-replacement-compare-workspace" aria-label="原视频与替换视频对比">\n        <header class="person-replacement-compare-heading">\n          <div><span class="person-replacement-eyebrow">合成视频</span><h2><input type="text" class="person-replacement-composite-project-title" data-person-replacement-composite-project-title value="' +
    escapeHtml(mediaRef2['title']) +
    '" maxlength="120" autocomplete="off" spellcheck="false" aria-label="项目名称，点击修改"></h2><p>同步检查动作、构图与声音，确认后再生成最终合成。</p></div>\n          <div class="person-replacement-compare-heading-actions">\n            ' +
    composeActionHtml +
    '\n            <div class="person-replacement-compare-summary">' +
    value14 +
    '</div>\n          </div>\n        </header>\n        <div class="person-replacement-compare-grid">\n          ' +
    renderCompositePreviewMediaCard({
      kind: 'original',
      label: '原视频',
      description: description2 ? '全部原片按时间轴合成' : '动作与镜头基准',
      mediaRef: mediaRef2['media']['originalRef'],
      posterRef: description2 ? '' : mediaRef2['selectedShot']?.['keyframeRef'],
      playable: mediaRef2['canCompare'],
      showShotNavigation: !description2 && mediaRef2['total'] > 1,
      footerDetail: description2 ? '原片完整对照' : '原始片段',
    }) +
    '\n          ' +
    renderCompositePreviewMediaCard({
      kind: 'replacement',
      label: '替换视频',
      description: description2 ? '替换片段优先，未替换片段保留原片' : '人物替换结果',
      mediaRef: mediaRef2['media']['replacementRef'],
      posterRef: description2 ? '' : mediaRef2['selectedShot']?.['replacementImageRef'],
      playable: mediaRef2['canCompare'],
      loading: composeOutputPending,
      showShotNavigation: !description2 && mediaRef2['total'] > 1,
      footerDetail: description2 ? '替换完整结果' : '生成结果',
    }) +
    '\n        </div>\n        <div class="person-replacement-compare-controls" data-person-replacement-compare-footer>\n          ' +
    playbackControlsHtml +
    '\n          <div class="person-replacement-compare-control-row">\n            <div class="person-replacement-track-setting"><span>播放音轨</span><div class="person-replacement-track-options" role="group" aria-label="播放音轨">\n              <button type="button" class="' +
    (mediaRef2['previewTrack'] === 'original' ? 'is-selected' : '') +
    '" data-person-replacement-action="set-preview-track" data-preview-track="original" aria-pressed="' +
    (mediaRef2['previewTrack'] === 'original') +
    '"><strong>原视频音轨</strong><small>保留现场原声</small></button>\n              <button type="button" class="' +
    (mediaRef2['previewTrack'] === 'replacement' ? 'is-selected' : '') +
    '" data-person-replacement-action="set-preview-track" data-preview-track="replacement" aria-pressed="' +
    (mediaRef2['previewTrack'] === 'replacement') +
    '"><strong>替换音轨</strong><small>' +
    escapeHtml(value13) +
    '</small></button>\n            </div></div>\n          </div>\n        </div>\n        ' +
    (description2 && mediaRef2['media']['originalAudioRef']
      ? '<audio data-person-replacement-compare-original-audio data-person-replacement-compare-original-audio-url="' +
        escapeHtml(normalizeMediaUrl(mediaRef2['media']['originalAudioRef'])) +
        '" preload="none"></audio>'
      : '') +
    '\n        ' +
    (mediaRef2['media']['replacementAudioRef']
      ? '<audio data-person-replacement-compare-replacement-audio data-person-replacement-compare-replacement-audio-url="' +
        escapeHtml(normalizeMediaUrl(mediaRef2['media']['replacementAudioRef'])) +
        '" preload="none"></audio>'
      : '') +
    '\n      </section>\n    </div>\n  </div>'
  );
}
export function createPersonReplacementCompositePreviewPresentation() {
  return Object['freeze']({ render: renderCompositePreview, renderRail: renderCompositePreviewShotRail });
}
