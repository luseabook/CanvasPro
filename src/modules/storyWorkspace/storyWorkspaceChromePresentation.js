import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function renderStepNavigation(options = {}) {
  return (
    '<nav class="story-step-navigation" data-step-count="' +
    (options['items']?.['length'] || 0x3) +
    '" data-active-step="' +
    escapeHtml(options['activeStep']) +
    '" aria-label="剧本制作步骤">\n    ' +
    (options['items'] || [])
      ['map'](
        (el) =>
          '<button type="button" class="story-step ' +
          (el['active'] ? 'is-active' : '') +
          '" data-story-step="' +
          el['id'] +
          '" aria-current="' +
          (el['active'] ? 'step' : 'false') +
          '" aria-keyshortcuts="' +
          (el['number'] ?? el['id']) +
          '\x22\x20' +
          (el['disabled'] ? 'disabled' : '') +
          '>\n        <span>' +
          (el['number'] ?? el['id']) +
          '</span>' +
          escapeHtml(el['label']) +
          '\n      </button>',
      )
      ['join']('') +
    '\x0a\x20\x20</nav>'
  );
}
function renderEpisodeSwitcher(options2 = {}) {
  const list = options2['options'] || [],
    item = list['length'] > 0x0;
  return (
    '<div class="story-episode-switcher ' +
    (item ? 'has-options' : '') +
    '">\n    <button type="button" class="story-episode-toolbar-current story-menu-trigger" data-story-episode-state="' +
    (options2['isCurrentPage'] ? 'active' : 'inactive') +
    '\x22\x20' +
    (options2['isCurrentPage']
      ? 'aria-current=\x22page\x22'
      : 'data-story-open-episode=\x22' + escapeHtml(options2['currentEpisodeId']) + '\x22') +
    '\x20' +
    (item ? 'aria-haspopup=\x22menu\x22' : '') +
    '>\n      <span class="story-episode-toolbar-current-label">' +
    escapeHtml(options2['currentEpisodeName']) +
    '</span>\n      ' +
    (item ? '<span class="story-episode-switcher-chevron" aria-hidden="true"></span>' : '') +
    '\n    </button>\n    ' +
    (item
      ? '<div class="story-episode-switcher-menu" role="menu" aria-label="切换已生成分集">\n      ' +
        list['map'](
          (error) =>
            '<button type="button" class="story-episode-switcher-option" data-story-open-episode="' +
            escapeHtml(error['id']) +
            '" role="menuitem">\n          <span>' +
            escapeHtml(error['name']) +
            '</span>\n          <small>已生成 ' +
            error['clipCount'] +
            ' 个分镜片段</small>\n        </button>',
        )['join']('') +
        '\n    </div>'
      : '') +
    '\n  </div>'
  );
}
function renderEpisodeToolbarSide(options3 = {}) {
  const key = options3['canvasSyncPending'] === !![],
    index = key ? 'disabled aria-disabled="true"' : '';
  return (
    '<div class="story-episode-toolbar-side">\n      ' +
    renderEpisodeSwitcher(options3['episodeSwitcher']) +
    '\n      <div class="story-episode-toolbar-actions">\n        <div class="story-canvas-sync-menu-wrap">\n          <button type="button" class="story-workbench-action-button story-canvas-sync-trigger story-menu-trigger' +
    (key ? '\x20is-pending' : '') +
    '" data-story-action="toggle-canvas-sync-menu" ' +
    index +
    '\x20aria-busy=\x22' +
    (key ? 'true' : 'false') +
    '" aria-haspopup="menu" aria-expanded="false">\n            ' +
    (key ? '<span\x20class=\x22story-canvas-sync-spinner\x22\x20aria-hidden=\x22true\x22></span>' : '') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
    (key ? '加入中…' : '加入画布') +
    '</span><span\x20class=\x22story-canvas-sync-chevron\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-canvas-sync-menu\x22\x20role=\x22menu\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-story-action=\x22sync-episode-to-canvas\x22\x20role=\x22menuitem\x22\x20' +
    index +
    '>\n              <strong>同步本集到画布</strong><small>只更新当前分集的分镜视频</small>\n            </button>\n            <button type="button" class="story-canvas-sync-option" data-story-action="sync-project-to-canvas" role="menuitem" ' +
    index +
    '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>同步整个项目到画布</strong><small>加入项目设定、素材与当前集视频</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-canvas-sync-menu-wrap\x20story-clip-export-menu-wrap\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-workbench-action-button\x20story-canvas-sync-trigger\x20story-menu-trigger\x22\x20data-story-action=\x22toggle-canvas-sync-menu\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22false\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>导出</span><span\x20class=\x22story-canvas-sync-chevron\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-canvas-sync-menu\x20story-clip-export-menu\x22\x20role=\x22menu\x22\x20aria-label=\x22导出视频片段\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-story-action=\x22export-current-clip\x22\x20role=\x22menuitem\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>导出当前片段</strong><small>导出当前选中的视频版本</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-story-action=\x22export-episode-clips\x22\x20role=\x22menuitem\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>导出本集全部片段</strong><small>自动跳过还没有视频的片段</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>'
  );
}
export function createStoryWorkspaceChromePresentation() {
  function renderToolbar(options4 = {}) {
    if (options4['kind'] === 'episode')
      return (
        '<div\x20class=\x22story-project-toolbar\x20story-project-toolbar--episode\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-toolbar-back\x22\x20data-story-action=\x22back-home\x22><span\x20class=\x22story-toolbar-back-icon\x22\x20aria-hidden=\x22true\x22></span><span>' +
        escapeHtml(options4['projectLabel'] || '剧本项目') +
        '</span></button>\n      ' +
        renderStepNavigation(options4['steps']) +
        '\x0a\x20\x20\x20\x20\x20\x20' +
        renderEpisodeToolbarSide(options4) +
        '\n    </div>'
      );
    return (
      '<div class="story-project-toolbar">\n    <button type="button" class="story-toolbar-back" data-story-action="back-home"><span class="story-toolbar-back-icon" aria-hidden="true"></span><span>' +
      escapeHtml(options4['projectLabel'] || '剧本项目') +
      '</span></button>\n    ' +
      renderStepNavigation(options4['steps']) +
      '\x0a\x20\x20\x20\x20<div\x20class=\x22story-episode-toolbar-side\x22>' +
      (options4['episodeSwitcher'] ? renderEpisodeSwitcher(options4['episodeSwitcher']) : '') +
      (options4['collaborationAvailable']
        ? '<button type="button" class="story-secondary-button" data-collaboration-toggle>AI 协作</button>'
        : '') +
      '</div>\n  </div>'
    );
  }
  function renderFooter(options5 = {}) {
    const result =
        '\n      ' +
        (options5['showPrevious']
          ? '<button type="button" class="story-secondary-button button-press-feedback" data-story-action="previous-step"><span>上一步</span></button>'
          : '') +
        '\n      <button type="button" class="story-next-button" data-story-action="' +
        escapeHtml(options5['nextAction']) +
        '\x22\x20' +
        (options5['busy'] ? 'disabled' : '') +
        ' aria-busy="' +
        Boolean(options5['busy']) +
        '\x22>' +
        (options5['busy'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
        '<span>' +
        escapeHtml(options5['nextLabel']) +
        '</span>' +
        (options5['busy'] ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
        '</button>',
      data = '' + (options5['leadingActionsMarkup'] || '') + (options5['actionsMarkup'] || result);
    return (
      '<footer class="story-page-footer">\n    <div>\n      <strong>' +
      escapeHtml(options5['title']) +
      '</strong>\x0a\x20\x20\x20\x20\x20\x20<small>' +
      escapeHtml(options5['hint']) +
      '</small>\n    </div>\n    <div class="story-page-footer-actions">\n      ' +
      data +
      '\n    </div>\n  </footer>'
    );
  }
  return Object['freeze']({ renderFooter: renderFooter, renderToolbar: renderToolbar });
}
