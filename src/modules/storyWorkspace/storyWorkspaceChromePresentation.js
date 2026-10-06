import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function renderStepNavigation(options = {}) {
  return (
    '<nav class="story-step-navigation" data-step-count="' +
    (options.items?.length || 3) +
    '" data-active-step="' +
    escapeHtml(options.activeStep) +
    '" aria-label="剧本制作步骤">\n    ' +
    (options.items || [])
      .map(
        (el) =>
          '<button type="button" class="story-step ' +
          (el.active ? 'is-active' : '') +
          '" data-story-step="' +
          el.id +
          '" aria-current="' +
          (el.active ? 'step' : 'false') +
          '" aria-keyshortcuts="' +
          (el.number ?? el.id) +
          '" ' +
          (el.disabled ? 'disabled' : '') +
          '>\n        <span>' +
          (el.number ?? el.id) +
          '</span>' +
          escapeHtml(el.label) +
          '\n      </button>',
      )
      .join('') +
    '\n  </nav>'
  );
}
function renderEpisodeSwitcher(options2 = {}) {
  const list = options2.options || [],
    item = list.length > 0;
  return (
    '<div class="story-episode-switcher ' +
    (item ? 'has-options' : '') +
    '">\n    <button type="button" class="story-episode-toolbar-current story-menu-trigger" data-story-episode-state="' +
    (options2.isCurrentPage ? 'active' : 'inactive') +
    '" ' +
    (options2.isCurrentPage
      ? 'aria-current="page"'
      : 'data-story-open-episode="' + escapeHtml(options2.currentEpisodeId) + '"') +
    ' ' +
    (item ? 'aria-haspopup="menu"' : '') +
    '>\n      <span class="story-episode-toolbar-current-label">' +
    escapeHtml(options2.currentEpisodeName) +
    '</span>\n      ' +
    (item ? '<span class="story-episode-switcher-chevron" aria-hidden="true"></span>' : '') +
    '\n    </button>\n    ' +
    (item
      ? '<div class="story-episode-switcher-menu" role="menu" aria-label="切换已生成分集">\n      ' +
        list.map(
          (error) =>
            '<button type="button" class="story-episode-switcher-option" data-story-open-episode="' +
            escapeHtml(error.id) +
            '" role="menuitem">\n          <span>' +
            escapeHtml(error.name) +
            '</span>\n          <small>已生成 ' +
            error.clipCount +
            ' 个分镜片段</small>\n        </button>',
        ).join('') +
        '\n    </div>'
      : '') +
    '\n  </div>'
  );
}
function renderEpisodeToolbarSide(options3 = {}) {
  const key = options3.canvasSyncPending === true,
    index = key ? 'disabled aria-disabled="true"' : '';
  return (
    '<div class="story-episode-toolbar-side">\n      ' +
    renderEpisodeSwitcher(options3.episodeSwitcher) +
    '\n      <div class="story-episode-toolbar-actions">\n        <div class="story-canvas-sync-menu-wrap">\n          <button type="button" class="story-workbench-action-button story-canvas-sync-trigger story-menu-trigger' +
    (key ? ' is-pending' : '') +
    '" data-story-action="toggle-canvas-sync-menu" ' +
    index +
    ' aria-busy="' +
    (key ? 'true' : 'false') +
    '" aria-haspopup="menu" aria-expanded="false">\n            ' +
    (key ? '<span class="story-canvas-sync-spinner" aria-hidden="true"></span>' : '') +
    '\n            <span>' +
    (key ? '加入中…' : '加入画布') +
    '</span><span class="story-canvas-sync-chevron" aria-hidden="true"></span>\n          </button>\n          <div class="story-canvas-sync-menu" role="menu" aria-hidden="true">\n            <button type="button" class="story-canvas-sync-option" data-story-action="sync-episode-to-canvas" role="menuitem" ' +
    index +
    '>\n              <strong>同步本集到画布</strong><small>只更新当前分集的分镜视频</small>\n            </button>\n            <button type="button" class="story-canvas-sync-option" data-story-action="sync-project-to-canvas" role="menuitem" ' +
    index +
    '>\n              <strong>同步整个项目到画布</strong><small>加入项目设定、素材与当前集视频</small>\n            </button>\n          </div>\n        </div>\n        <div class="story-canvas-sync-menu-wrap story-clip-export-menu-wrap">\n          <button type="button" class="story-workbench-action-button story-canvas-sync-trigger story-menu-trigger" data-story-action="toggle-canvas-sync-menu" aria-haspopup="menu" aria-expanded="false">\n            <span>导出</span><span class="story-canvas-sync-chevron" aria-hidden="true"></span>\n          </button>\n          <div class="story-canvas-sync-menu story-clip-export-menu" role="menu" aria-label="导出视频片段" aria-hidden="true">\n            <button type="button" class="story-canvas-sync-option" data-story-action="export-current-clip" role="menuitem">\n              <strong>导出当前片段</strong><small>导出当前选中的视频版本</small>\n            </button>\n            <button type="button" class="story-canvas-sync-option" data-story-action="export-episode-clips" role="menuitem">\n              <strong>导出本集全部片段</strong><small>自动跳过还没有视频的片段</small>\n            </button>\n          </div>\n        </div>\n      </div>\n    </div>'
  );
}
export function createStoryWorkspaceChromePresentation() {
  function renderToolbar(options4 = {}) {
    if (options4.kind === 'episode')
      return (
        '<div class="story-project-toolbar story-project-toolbar--episode">\n      <button type="button" class="story-toolbar-back" data-story-action="back-home"><span class="story-toolbar-back-icon" aria-hidden="true"></span><span>' +
        escapeHtml(options4.projectLabel || '剧本项目') +
        '</span></button>\n      ' +
        renderStepNavigation(options4.steps) +
        '\n      ' +
        renderEpisodeToolbarSide(options4) +
        '\n    </div>'
      );
    return (
      '<div class="story-project-toolbar">\n    <button type="button" class="story-toolbar-back" data-story-action="back-home"><span class="story-toolbar-back-icon" aria-hidden="true"></span><span>' +
      escapeHtml(options4.projectLabel || '剧本项目') +
      '</span></button>\n    ' +
      renderStepNavigation(options4.steps) +
      '\n    <div class="story-episode-toolbar-side">' +
      (options4.episodeSwitcher ? renderEpisodeSwitcher(options4.episodeSwitcher) : '') +
      (options4.collaborationAvailable
        ? '<button type="button" class="story-secondary-button" data-collaboration-toggle>AI 协作</button>'
        : '') +
      '</div>\n  </div>'
    );
  }
  function renderFooter(options5 = {}) {
    const result =
        '\n      ' +
        (options5.showPrevious
          ? '<button type="button" class="story-secondary-button button-press-feedback" data-story-action="previous-step"><span>上一步</span></button>'
          : '') +
        '\n      <button type="button" class="story-next-button" data-story-action="' +
        escapeHtml(options5.nextAction) +
        '" ' +
        (options5.busy ? 'disabled' : '') +
        ' aria-busy="' +
        Boolean(options5.busy) +
        '">' +
        (options5.busy ? renderStoryGenerationSpinner({ button: true }) : '') +
        '<span>' +
        escapeHtml(options5.nextLabel) +
        '</span>' +
        (options5.busy ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
        '</button>',
      data = '' + (options5.leadingActionsMarkup || '') + (options5.actionsMarkup || result);
    return (
      '<footer class="story-page-footer">\n    <div>\n      <strong>' +
      escapeHtml(options5.title) +
      '</strong>\n      <small>' +
      escapeHtml(options5.hint) +
      '</small>\n    </div>\n    <div class="story-page-footer-actions">\n      ' +
      data +
      '\n    </div>\n  </footer>'
    );
  }
  return Object.freeze({ renderFooter: renderFooter, renderToolbar: renderToolbar });
}
