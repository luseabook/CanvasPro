import { renderWorkspaceEpisodeRail } from '../workspaceEpisodeRailPresentation.js';
import { formatStoryClockDuration } from './storyPlanningData.js';
import { getVideoReplicationDialogueSummary } from '../../domain/storyGeneration/videoReplicationSourceAnalysis.js';
function getSourceDurationLabel(value) {
  const count = Number(value['sourceVideo']?.['durationSec']);
  return Number['isFinite'](count) && count > 0 ? formatStoryClockDuration(count) : '--:--';
}
function escapeHtml(item) {
  return String(item ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#39;');
}
export function renderStoryVideoReplicationEpisodeRail(list = [], key = '') {
  return renderWorkspaceEpisodeRail({
    items: (Array['isArray'](list) ? list : [])['map']((args) => ({
      ...args,
      meta: String(args?.['clips']?.['length'] || 0),
    })),
    selectedId: key,
    listData: { 'data-story-replication-episode-rail-list': !![] },
    getButtonData: (index) => ({ 'data-story-open-episode': index['id'] }),
  });
}
function getEvidenceSummary(result) {
  if (result['replication']?.['error']) return result['replication']['error'];
  const enabled = result['replication']?.['sourceAnalysis'];
  if (!enabled) return result['replication']?.['error'] || result['replication']?.['message'] || '待分析';
  const data = enabled['characters']['filter']((options) => options['role'] === 'main')['length'];
  return (
    enabled['characters']['length'] +
    ' 个角色' +
    (data ? ' · ' + data + ' 位主角' : '') +
    '\n' +
    getVideoReplicationDialogueSummary(enabled)['label']
  );
}
function syncStoryReplicationCardSelection(el, enabled2, enabled3, target = ![]) {
  const enabled4 = ['pending', 'failed']['includes'](enabled2['replication']?.['status']),
    source = Boolean(enabled3 && enabled4 && enabled2['replication']?.['selectedForAnalysis']);
  (el['classList']['toggle']('is-selection-mode', enabled3), el['classList']['toggle']('is-checked', source));
  const enabled5 = el['querySelector']('[data-replication-card-action]');
  if (!enabled5) return;
  enabled5['disabled'] =
    getStatusView(enabled2)['busy'] ||
    (enabled3 && (!enabled4 || target)) ||
    (!enabled2['replication']?.['sourceAnalysis'] && (target || !enabled2['sourceVideo']?.['videoRef']));
  if (enabled3) enabled5['setAttribute']('aria-pressed', String(source));
  else enabled5['removeAttribute']('aria-pressed');
  if (!enabled3 && enabled2['replication']?.['sourceAnalysis'])
    enabled5['dataset']['replicationOpen'] = enabled2['id'];
  else enabled5['removeAttribute']('data-replication-open');
  const next = enabled5['querySelector']('[data-replication-action-label]');
  ((next['hidden'] = enabled3),
    (next['textContent'] = getStatusView(enabled2)['busy']
      ? '处理中…'
      : enabled2['replication']?.['sourceAnalysis']
        ? '查看分析 →'
        : enabled2['replication']?.['status'] === 'failed'
          ? '选择后重试分析'
          : '选择视频'));
}
export function syncStoryReplicationSelection(current, entry) {
  const record = entry['data']['episodes'],
    enabled6 = entry['replicationSelectionMode'] === !![],
    list2 = record['filter']((payload) =>
      ['pending', 'failed']['includes'](payload['replication']?.['status']),
    ),
    handle = list2['filter']((state) => state['replication']['selectedForAnalysis'])['length'],
    config = record['some']((scope) => getStatusView(scope)['busy']);
  (current['querySelectorAll']('article[data-story-replication-episode-id]')['forEach']((input) => {
    const output = record['find']((value2) => value2['id'] === input['dataset']['storyReplicationEpisodeId']);
    if (output) syncStoryReplicationCardSelection(input, output, enabled6, config);
  }),
    current['querySelectorAll']('[data-replication-selection]')['forEach']((el2) => {
      const value3 = el2['dataset']['replicationSelection'];
      ((el2['hidden'] = value3 !== 'all'),
        (el2['disabled'] = value3 !== 'cancel' && (config || !list2['length'])));
      if (value3 === 'all') el2['textContent'] = handle && handle === list2['length'] ? '取消全选' : '全选';
    }),
    current['querySelectorAll']('[data-replication-analyze]')['forEach']((el3) => {
      const value4 = el3['dataset']['replicationAnalyze'] === 'selected';
      ((el3['hidden'] = value4 ? !enabled6 : enabled6),
        (el3['disabled'] = config || !(value4 ? handle : list2['length'])),
        el3['setAttribute']('aria-busy', String(config)));
      if (value4) el3['textContent'] = '分析选中' + (handle ? ' (' + handle + ')' : '');
    }));
}
function getStatusView(options2 = {}) {
  const value5 = options2?.['replication']?.['status'] || 'queued';
  if (value5 === 'uploading') return { label: '上传中', busy: !![] };
  if (value5 === 'analyzing') return { label: '解析中', busy: !![] };
  if (value5 === 'ready') return { label: '解析完成', busy: ![] };
  if (value5 === 'failed') return { label: '解析失败', busy: ![] };
  if (value5 === 'pending') return { label: '待分析', busy: ![] };
  return { label: '等待解析', busy: !![] };
}
function getLoadingLabel(value6, value7) {
  const value8 = value6['replication']?.['status'];
  return (
    (value8 === 'uploading' ? '正在上传' : value8 === 'queued' ? '等待解析' : '正在解析') +
    '视频 ' +
    (value7 + 1)
  );
}
function renderVideoCard(options3 = {}, value9 = 0, enabled7 = ![]) {
  const enabled8 = options3['sourceVideo'] || {},
    statusView = getStatusView(options3),
    value10 = String(enabled8['posterUrl'] || options3['coverUrl'] || '')['trim'](),
    enabled9 = ['pending', 'failed']['includes'](options3['replication']?.['status']),
    value11 = enabled7 && enabled9 && options3['replication']?.['selectedForAnalysis'],
    value12 = options3?.['replication']?.['status'] === 'failed' && !enabled8['videoRef'];
  return (
    '<article class="story-episode-card story-replication-card is-' +
    escapeHtml(options3?.['replication']?.['status'] || 'queued') +
    (statusView['busy'] ? ' is-splitting' : '') +
    (enabled7 ? ' is-selection-mode' : '') +
    (value11 ? ' is-checked' : '') +
    '" data-story-replication-episode-id="' +
    escapeHtml(options3['id']) +
    '" draggable="false" aria-busy="' +
    statusView['busy'] +
    '">\n    <span class="story-replication-drag-handle" data-story-replication-drag-handle draggable="true" role="button" tabindex="0" aria-label="拖动调整第 ' +
    (value9 + 1) +
    ' 条视频顺序" title="拖动调整顺序"><span></span><span></span><span></span><span></span><span></span><span></span></span>\n    <button type="button" class="story-replication-preview" data-story-action="preview-replication-video" data-story-replication-episode-id="' +
    escapeHtml(options3['id']) +
    '" aria-label="播放第 ' +
    (value9 + 1) +
    ' 条原视频" ' +
    (enabled8['videoRef'] ? '' : 'disabled') +
    '>\n      <img' +
    (value10 ? ' src="' + escapeHtml(value10) + '"' : '') +
    ' alt="第 ' +
    (value9 + 1) +
    ' 条视频首帧" draggable="false" ' +
    (value10 ? '' : 'hidden') +
    '>\n      <span class="story-replication-poster-placeholder" ' +
    (value10 ? 'hidden' : '') +
    ' aria-hidden="true">▶</span>\n      <span class="story-replication-play" aria-hidden="true">▶</span>\n      <span class="story-replication-number" data-story-replication-number>' +
    String(value9 + 1)['padStart'](2, '0') +
    '</span>\n      <span class="story-replication-status" data-story-replication-status>' +
    escapeHtml(statusView['label']) +
    '</span>\n      <span class="story-replication-duration" data-story-replication-duration>' +
    escapeHtml(getSourceDurationLabel(options3)) +
    '</span>\n    </button>\n    <button type="button" class="story-episode-copy story-replication-copy" data-replication-card-action="' +
    escapeHtml(options3['id']) +
    '" ' +
    (!enabled7 && options3['replication']?.['sourceAnalysis']
      ? 'data-replication-open="' + escapeHtml(options3['id']) + '"'
      : '') +
    ' ' +
    (enabled7 ? 'aria-pressed="' + Boolean(value11) + '"' : '') +
    ' ' +
    (statusView['busy'] || (enabled7 && !enabled9) || value12 ? 'disabled' : '') +
    '>\n      <span class="story-episode-title" data-story-replication-title>' +
    escapeHtml(options3['title'] || enabled8['fileName'] || '未命名视频') +
    '</span>\n      <span class="story-replication-meta" data-story-replication-synopsis>' +
    escapeHtml(getEvidenceSummary(options3)) +
    '</span>\n      <span class="story-episode-enter" data-replication-action-label ' +
    (enabled7 ? 'hidden' : '') +
    '>' +
    (statusView['busy']
      ? '处理中…'
      : options3['replication']?.['sourceAnalysis']
        ? '查看分析 →'
        : enabled9
          ? options3['replication']['status'] === 'failed'
            ? '选择后重试分析'
            : '选择视频'
          : '') +
    '</span>\n    </button>\n      <div class="story-replication-card-actions" data-story-replication-card-actions ' +
    (value12 ? '' : 'hidden') +
    '>\n        <button type="button" data-story-action="reupload-replication-video" data-story-replication-episode-id="' +
    escapeHtml(options3['id']) +
    '">重新上传该视频</button>\n      </div>\n    <div class="story-episode-loading storyboard-script-loading-overlay" data-replication-loading role="status" aria-live="polite" ' +
    (statusView['busy'] ? '' : 'hidden') +
    '>\n      <div class="storyboard-script-loading-spinner" aria-hidden="true"></div>\n      <div class="storyboard-script-loading-label">' +
    escapeHtml(getLoadingLabel(options3, value9)) +
    '</div>\n      <div class="storyboard-script-loading-bar"><div class="storyboard-script-loading-bar-fill"></div></div>\n    </div>\n  </article>'
  );
}
export function renderStoryVideoReplicationPage({
  episodes: episodes = [],
  targetLabel: targetLabel = '原语言',
  styleLabel: styleLabel = '',
  selectionMode: selectionMode = ![],
  footerMarkup: footerMarkup = '',
} = {}) {
  const value13 = episodes['some']((value14) => getStatusView(value14)['busy']),
    enabled10 = episodes['filter']((value15) =>
      ['pending', 'failed']['includes'](value15['replication']?.['status']),
    ),
    enabled11 = enabled10['filter']((value16) => value16['replication']['selectedForAnalysis'])['length'];
  return (
    '<section class="story-replication-page story-content-page" data-story-replication-page>\n    <header class="story-replication-heading story-page-heading">\n      <div>\n        <span class="story-eyebrow">原片分析 · ' +
    episodes['length'] +
    ' 条视频</span>\n        <h2>视频解析</h2>\n      </div>\n      <div class="story-heading-actions story-replication-analysis-actions">\n        <button type="button" class="story-secondary-button" data-replication-selection="all" ' +
    (value13 || !enabled10['length'] ? 'disabled' : '') +
    '>' +
    (enabled11 && enabled11 === enabled10['length'] ? '取消全选' : '全选') +
    '</button>\n        <button type="button" class="story-primary-button story-main-action-button" data-replication-analyze="selected" ' +
    (selectionMode ? '' : 'hidden') +
    ' ' +
    (value13 || !enabled11 ? 'disabled' : '') +
    '>分析选中' +
    (enabled11 ? ' (' + enabled11 + ')' : '') +
    '</button>\n        <button type="button" class="story-primary-button story-main-action-button" data-replication-analyze="all" ' +
    (selectionMode ? 'hidden' : '') +
    ' ' +
    (value13 || !enabled10['length'] ? 'disabled' : '') +
    '>批量分析</button>\n      </div>\n    </header>\n    <div class="story-episode-grid story-replication-grid" data-story-replication-grid>\n      ' +
    episodes['map']((value17, value18) => renderVideoCard(value17, value18, selectionMode))['join']('') +
    '\n    </div>\n    <div data-replication-review-host hidden></div>\n    ' +
    footerMarkup +
    '\n  </section>'
  );
}
export function syncStoryVideoReplicationCardElement(el4, enabled12 = {}, value19 = 0) {
  if (!el4 || !enabled12) return ![];
  const value20 = enabled12['sourceVideo'] || {},
    statusView2 = getStatusView(enabled12),
    value21 = enabled12?.['replication']?.['status'] || 'queued';
  (['pending', 'queued', 'uploading', 'analyzing', 'ready', 'failed']['forEach']((value22) => {
    el4['classList']?.['toggle']?.('is-' + value22, value22 === value21);
  }),
    el4['setAttribute']?.('aria-busy', String(statusView2['busy'])),
    el4['classList']?.['toggle']?.('is-splitting', statusView2['busy']));
  const value23 = el4['querySelector']?.('[data-replication-loading]');
  value23 &&
    ((value23['hidden'] = !statusView2['busy']),
    (value23['querySelector']('.storyboard-script-loading-label')['textContent'] = getLoadingLabel(
      enabled12,
      value19,
    )));
  const value24 = el4['querySelector']?.('[data-story-replication-number]'),
    value25 = el4['querySelector']?.('[data-story-replication-title]'),
    el5 = el4['querySelector']?.('[data-story-replication-duration]'),
    value26 = el4['querySelector']?.('[data-story-replication-status]'),
    value27 = el4['querySelector']?.('[data-story-replication-synopsis]'),
    el6 = el4['querySelector']?.('[data-story-replication-card-actions]'),
    el7 = el4['querySelector']?.('.story-replication-preview'),
    el8 = el7?.['querySelector']?.('img'),
    value28 = el7?.['querySelector']?.('.story-replication-poster-placeholder'),
    enabled13 = String(value20['posterUrl'] || enabled12['coverUrl'] || '')['trim']();
  if (value24) value24['textContent'] = String(value19 + 1)['padStart'](2, '0');
  if (value25) value25['textContent'] = enabled12['title'] || '视频 ' + (value19 + 1);
  if (el5) el5['textContent'] = getSourceDurationLabel(enabled12);
  if (value26) value26['textContent'] = statusView2['label'];
  const value29 = el4['querySelector']?.('[data-replication-select-analysis]');
  if (value29) value29['disabled'] = !['pending', 'failed']['includes'](value21);
  value27 && (value27['textContent'] = getEvidenceSummary(enabled12));
  syncStoryReplicationCardSelection(el4, enabled12, el4['classList']['contains']('is-selection-mode'));
  if (el6) {
    el6['hidden'] = !(value21 === 'failed' && !String(value20['videoRef'] || '')['trim']());
    const value30 = el6['querySelector']?.('[data-story-action="reupload-replication-video"]');
    if (value30) value30['dataset']['storyReplicationEpisodeId'] = enabled12['id'];
  }
  el7 &&
    ((el7['disabled'] = !String(value20['videoRef'] || '')['trim']()),
    (el7['dataset']['storyReplicationEpisodeId'] = enabled12['id']),
    el7['setAttribute']('aria-label', '播放第 ' + (value19 + 1) + ' 条原视频'));
  if (el8) {
    if (enabled13 && el8['getAttribute']('src') !== enabled13) el8['setAttribute']('src', enabled13);
    ((el8['hidden'] = !enabled13), (el8['alt'] = '第 ' + (value19 + 1) + ' 条视频首帧'));
  }
  if (value28) value28['hidden'] = Boolean(enabled13);
  const el9 = el4['querySelector']?.('[data-story-replication-drag-handle]');
  return (el9 && el9['setAttribute']('aria-label', '拖动调整第 ' + (value19 + 1) + ' 条视频顺序'), !![]);
}
