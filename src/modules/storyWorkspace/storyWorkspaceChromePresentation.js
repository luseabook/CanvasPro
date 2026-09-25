import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
function escapeHtml(_0x17d820) {
  return String(_0x17d820 ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function renderStepNavigation(_0x549d9e = {}) {
  return (
    '<nav class="story-step-navigation" data-step-count="' +
    (_0x549d9e['items']?.['length'] || 0x3) +
    '" data-active-step="' +
    escapeHtml(_0x549d9e['activeStep']) +
    '" aria-label="剧本制作步骤">\n    ' +
    (_0x549d9e['items'] || [])
      ['map'](
        (_0x2f16ab) =>
          '<button type="button" class="story-step ' +
          (_0x2f16ab['active'] ? 'is-active' : '') +
          '" data-story-step="' +
          _0x2f16ab['id'] +
          '" aria-current="' +
          (_0x2f16ab['active'] ? 'step' : 'false') +
          '" aria-keyshortcuts="' +
          (_0x2f16ab['number'] ?? _0x2f16ab['id']) +
          '\x22\x20' +
          (_0x2f16ab['disabled'] ? 'disabled' : '') +
          '>\n        <span>' +
          (_0x2f16ab['number'] ?? _0x2f16ab['id']) +
          '</span>' +
          escapeHtml(_0x2f16ab['label']) +
          '\n      </button>',
      )
      ['join']('') +
    '\x0a\x20\x20</nav>'
  );
}
function renderEpisodeSwitcher(_0xf1147c = {}) {
  const _0x114079 = _0xf1147c['options'] || [],
    _0x494afb = _0x114079['length'] > 0x0;
  return (
    '<div class="story-episode-switcher ' +
    (_0x494afb ? 'has-options' : '') +
    '">\n    <button type="button" class="story-episode-toolbar-current story-menu-trigger" data-story-episode-state="' +
    (_0xf1147c['isCurrentPage'] ? 'active' : 'inactive') +
    '\x22\x20' +
    (_0xf1147c['isCurrentPage']
      ? 'aria-current=\x22page\x22'
      : 'data-story-open-episode=\x22' + escapeHtml(_0xf1147c['currentEpisodeId']) + '\x22') +
    '\x20' +
    (_0x494afb ? 'aria-haspopup=\x22menu\x22' : '') +
    '>\n      <span class="story-episode-toolbar-current-label">' +
    escapeHtml(_0xf1147c['currentEpisodeName']) +
    '</span>\n      ' +
    (_0x494afb ? '<span class="story-episode-switcher-chevron" aria-hidden="true"></span>' : '') +
    '\n    </button>\n    ' +
    (_0x494afb
      ? '<div class="story-episode-switcher-menu" role="menu" aria-label="切换已生成分集">\n      ' +
        _0x114079['map'](
          (_0x252a97) =>
            '<button type="button" class="story-episode-switcher-option" data-story-open-episode="' +
            escapeHtml(_0x252a97['id']) +
            '" role="menuitem">\n          <span>' +
            escapeHtml(_0x252a97['name']) +
            '</span>\n          <small>已生成 ' +
            _0x252a97['clipCount'] +
            ' 个分镜片段</small>\n        </button>',
        )['join']('') +
        '\n    </div>'
      : '') +
    '\n  </div>'
  );
}
function renderEpisodeToolbarSide(_0x37a5d2 = {}) {
  const _0x1ab7f4 = _0x37a5d2['canvasSyncPending'] === !![],
    _0x3843e3 = _0x1ab7f4 ? 'disabled aria-disabled="true"' : '';
  return (
    '<div class="story-episode-toolbar-side">\n      ' +
    renderEpisodeSwitcher(_0x37a5d2['episodeSwitcher']) +
    '\n      <div class="story-episode-toolbar-actions">\n        <div class="story-canvas-sync-menu-wrap">\n          <button type="button" class="story-workbench-action-button story-canvas-sync-trigger story-menu-trigger' +
    (_0x1ab7f4 ? '\x20is-pending' : '') +
    '" data-story-action="toggle-canvas-sync-menu" ' +
    _0x3843e3 +
    '\x20aria-busy=\x22' +
    (_0x1ab7f4 ? 'true' : 'false') +
    '" aria-haspopup="menu" aria-expanded="false">\n            ' +
    (_0x1ab7f4
      ? '<span\x20class=\x22story-canvas-sync-spinner\x22\x20aria-hidden=\x22true\x22></span>'
      : '') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
    (_0x1ab7f4 ? '加入中…' : '加入画布') +
    '</span><span\x20class=\x22story-canvas-sync-chevron\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-canvas-sync-menu\x22\x20role=\x22menu\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-story-action=\x22sync-episode-to-canvas\x22\x20role=\x22menuitem\x22\x20' +
    _0x3843e3 +
    '>\n              <strong>同步本集到画布</strong><small>只更新当前分集的分镜视频</small>\n            </button>\n            <button type="button" class="story-canvas-sync-option" data-story-action="sync-project-to-canvas" role="menuitem" ' +
    _0x3843e3 +
    '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>同步整个项目到画布</strong><small>加入项目设定、素材与当前集视频</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-canvas-sync-menu-wrap\x20story-clip-export-menu-wrap\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-workbench-action-button\x20story-canvas-sync-trigger\x20story-menu-trigger\x22\x20data-story-action=\x22toggle-canvas-sync-menu\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22false\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>导出</span><span\x20class=\x22story-canvas-sync-chevron\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-canvas-sync-menu\x20story-clip-export-menu\x22\x20role=\x22menu\x22\x20aria-label=\x22导出视频片段\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-story-action=\x22export-current-clip\x22\x20role=\x22menuitem\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>导出当前片段</strong><small>导出当前选中的视频版本</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-story-action=\x22export-episode-clips\x22\x20role=\x22menuitem\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>导出本集全部片段</strong><small>自动跳过还没有视频的片段</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>'
  );
}
export function createStoryWorkspaceChromePresentation() {
  function _0x5cb559(_0x1659a4 = {}) {
    if (_0x1659a4['kind'] === 'episode')
      return (
        '<div\x20class=\x22story-project-toolbar\x20story-project-toolbar--episode\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-toolbar-back\x22\x20data-story-action=\x22back-home\x22><span\x20class=\x22story-toolbar-back-icon\x22\x20aria-hidden=\x22true\x22></span><span>' +
        escapeHtml(_0x1659a4['projectLabel'] || '剧本项目') +
        '</span></button>\n      ' +
        renderStepNavigation(_0x1659a4['steps']) +
        '\x0a\x20\x20\x20\x20\x20\x20' +
        renderEpisodeToolbarSide(_0x1659a4) +
        '\n    </div>'
      );
    return (
      '<div class="story-project-toolbar">\n    <button type="button" class="story-toolbar-back" data-story-action="back-home"><span class="story-toolbar-back-icon" aria-hidden="true"></span><span>' +
      escapeHtml(_0x1659a4['projectLabel'] || '剧本项目') +
      '</span></button>\n    ' +
      renderStepNavigation(_0x1659a4['steps']) +
      '\x0a\x20\x20\x20\x20<div\x20class=\x22story-episode-toolbar-side\x22>' +
      (_0x1659a4['episodeSwitcher'] ? renderEpisodeSwitcher(_0x1659a4['episodeSwitcher']) : '') +
      (_0x1659a4['collaborationAvailable']
        ? '<button type="button" class="story-secondary-button" data-collaboration-toggle>AI 协作</button>'
        : '') +
      '</div>\n  </div>'
    );
  }
  function _0xe3af0d(_0x54d80c = {}) {
    const _0x583d93 =
        '\n      ' +
        (_0x54d80c['showPrevious']
          ? '<button type="button" class="story-secondary-button button-press-feedback" data-story-action="previous-step"><span>上一步</span></button>'
          : '') +
        '\n      <button type="button" class="story-next-button" data-story-action="' +
        escapeHtml(_0x54d80c['nextAction']) +
        '\x22\x20' +
        (_0x54d80c['busy'] ? 'disabled' : '') +
        ' aria-busy="' +
        Boolean(_0x54d80c['busy']) +
        '\x22>' +
        (_0x54d80c['busy'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
        '<span>' +
        escapeHtml(_0x54d80c['nextLabel']) +
        '</span>' +
        (_0x54d80c['busy'] ? '' : '<span class="story-next-arrow" aria-hidden="true">→</span>') +
        '</button>',
      _0x3c6db2 = '' + (_0x54d80c['leadingActionsMarkup'] || '') + (_0x54d80c['actionsMarkup'] || _0x583d93);
    return (
      '<footer class="story-page-footer">\n    <div>\n      <strong>' +
      escapeHtml(_0x54d80c['title']) +
      '</strong>\x0a\x20\x20\x20\x20\x20\x20<small>' +
      escapeHtml(_0x54d80c['hint']) +
      '</small>\n    </div>\n    <div class="story-page-footer-actions">\n      ' +
      _0x3c6db2 +
      '\n    </div>\n  </footer>'
    );
  }
  return Object['freeze']({ renderFooter: _0xe3af0d, renderToolbar: _0x5cb559 });
}
