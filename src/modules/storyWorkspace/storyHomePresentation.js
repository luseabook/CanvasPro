import { renderRequestDebugButton } from '../debugRequestWindow.js';
import { RECORDING_ASR_MODELS } from '../../../api/recordingAsrModels.js';
import { renderAIGenTextModelSelectorMarkup } from '../../components/aigenText/modelSelector.js';
import { renderStoryNovelBatchPanel } from './storyNovelBatchPresentation.js';
import { getDisplayModelName } from '../providers.js';
import { getStorySurfaceProjects } from './storyWorkspaceSurface.js';
import { renderWorkspaceProjectCard, renderWorkspaceProjectSortControl } from '../workspaceProjectHome.js';
import { getStoryAssetAppearances } from './storyAssetAppearances.js';
import { getStoryBackgroundTaskSummary } from './storyBackgroundTasks.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
import {
  STORY_HOME_REWRITE_SOURCE_HINT,
  canStartStoryHomeGeneration,
  hasStoryHomeReferenceScript,
} from './storyHomeRewrite.js';
import {
  STORY_STYLE_CATEGORIES,
  STORY_STYLE_PRESETS,
  resolveStoryStyleSelection,
} from './storyStyleCatalog.js';
import {
  STORY_ASPECT_RATIO_OPTIONS,
  STORY_CUSTOM_STYLE_MAX_CHARACTERS,
  STORY_DEVELOPER_EPISODE_COUNT_OPTIONS,
  STORY_EPISODE_COUNT_MAX,
  STORY_EPISODE_COUNT_OPTIONS,
  STORY_IDEA_MAX_CHARACTERS,
  STORY_PROMPT_MODE_OPTIONS,
  STORY_PUBLIC_EPISODE_COUNT_OPTIONS,
  STORY_SCRIPT_MAX_CHARACTERS,
  getStoryPromptModeLabel,
  getStoryScriptModeHint,
  normalizeStoryAspectRatio,
  normalizeStoryEpisodeCount,
  normalizeStoryPromptMode,
  normalizeStoryScriptMode,
} from './storyProjectPlanning.js';
import { getStoryProjectHomeEntries } from './storyProjectSession.js';
import { getStoryVideoInputTextModelOptions } from './storyWorkspaceModelCatalog.js';
import {
  STORY_REPLICATION_LOCALES,
  getStoryReplicationLocale,
  isStoryVideoReplicationHomeAvailable,
  resolveStoryVideoReplicationHomeTab,
} from './storyVideoReplication.js';
function escapeHtml(_0xf6fd44) {
  return String(_0xf6fd44 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x4b2282) {
  return String(_0x4b2282 ?? '')['trim']();
}
export function getStoryHomeModeDescription(_0x40025a, _0x30af2c = '') {
  if (_0x40025a === 'upload' && _0x30af2c === 'novel') return '上传小说，AI 改编为分集剧本后制作';
  return (
    {
      upload: '导入已有剧本，按原稿进入制作',
      generate: '输入故事想法，AI\x20帮你生成剧本',
      collaborate: '与 AI 讨论方向，自定设定，逐段打磨剧本',
    }[_0x40025a] || ''
  );
}
function getStoryDocumentExtension(_0x4e428a = '') {
  const _0x14b7bb = normalizeText(_0x4e428a)['split']('.')['pop']();
  return _0x14b7bb && _0x14b7bb !== _0x4e428a ? '.' + _0x14b7bb['toLowerCase']() : '.txt';
}
function renderStoryReplicationVideoIcon() {
  return '<svg class="story-replication-upload-video-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="3"/><path d="m17 10 4-2v8l-4-2"/></svg>';
}
function renderStoryHomeTabIcon(_0x134944) {
  if (_0x134944 === 'upload')
    return '<span class="story-home-tab-icon story-home-tab-icon--upload" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 14.5v3.75A1.75 1.75 0 0 0 5.75 20h12.5A1.75 1.75 0 0 0 20 18.25V14.5"/></svg></span>';
  if (_0x134944 === 'replication')
    return '<span class="story-home-tab-icon story-home-tab-icon--replication" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="13" height="14" rx="2"/><path d="m16.5 9 4-2v10l-4-2z"/><path d="m8.5 9 4 3-4 3z"/></svg></span>';
  return '<span class="story-home-tab-icon story-home-tab-icon--generate" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m11.5 3 .9 3.1a4.7 4.7 0 0 0 3.2 3.2l3.1.9-3.1.9a4.7 4.7 0 0 0-3.2 3.2l-.9 3.1-.9-3.1a4.7 4.7 0 0 0-3.2-3.2l-3.1-.9 3.1-.9a4.7 4.7 0 0 0 3.2-3.2z"/><path d="m18.5 15.5.35 1.15a2.2 2.2 0 0 0 1.5 1.5l1.15.35-1.15.35a2.2 2.2 0 0 0-1.5 1.5l-.35 1.15-.35-1.15a2.2 2.2 0 0 0-1.5-1.5l-1.15-.35 1.15-.35a2.2 2.2 0 0 0 1.5-1.5z"/></svg></span>';
}
function renderHomeTabs(_0x2f8070) {
  if (_0x2f8070['workspaceSurface'] === 'replication') return '';
  const _0x386be3 = isStoryVideoReplicationHomeAvailable(_0x2f8070),
    _0x5a638c = [
      ['upload', '上传剧本'],
      ['generate', '快速创作'],
      ['collaborate', 'AI 协作创作'],
    ];
  return (
    '<div class="story-home-tabs" data-story-home-tabs data-active-tab="' +
    escapeHtml(_0x2f8070['homeTab']) +
    '" role="tablist">\n    <span class="story-home-tab-indicator" aria-hidden="true"></span>\n    ' +
    _0x5a638c['map'](([_0x3ab6c6, _0x384af4]) => {
      const _0x41c666 =
          (_0x3ab6c6 === 'replication' && !_0x386be3) ||
          (_0x3ab6c6 === 'collaborate' && _0x2f8070['developerModeAvailable'] !== !![]),
        _0x1f9c7b = _0x2f8070['homeTab'] === _0x3ab6c6 && !_0x41c666;
      return (
        '<button type="button" class="story-home-tab ' +
        (_0x1f9c7b ? 'is-active' : '') +
        '" data-story-home-tab="' +
        _0x3ab6c6 +
        '" role="tab" aria-selected="' +
        _0x1f9c7b +
        '\x22\x20aria-disabled=\x22' +
        _0x41c666 +
        '" tabindex="' +
        (_0x1f9c7b ? '0' : '-1') +
        '\x22\x20' +
        (_0x41c666 ? 'disabled' : '') +
        '><span class="story-home-tab-content">' +
        renderStoryHomeTabIcon(_0x3ab6c6) +
        '<span>' +
        _0x384af4 +
        '</span></span></button>'
      );
    })['join']('') +
    '\x0a\x20\x20</div>'
  );
}
export function renderStoryHomeComposerBody(_0x1ef196) {
  // A parsed novel turns the upload tab into the chapter batch picker.
  if (
    _0x1ef196['homeTab'] === 'upload' &&
    _0x1ef196['scriptIntent'] === 'novel' &&
    Array['isArray'](_0x1ef196['novelChapters']) &&
    _0x1ef196['novelChapters']['length']
  )
    return renderStoryNovelBatchPanel(_0x1ef196);
  if (_0x1ef196['homeTab'] === 'collaborate')
    return (
      '<div class="story-home-composer-panel story-home-input-wrap story-home-story-input">\n      <label for="storyIdeaInput">输入故事想法</label>\n      <textarea id="storyIdeaInput" data-story-idea-input maxlength="' +
      STORY_IDEA_MAX_CHARACTERS +
      '" placeholder="写下一段故事、人物设定或一个灵感，和 AI 一起把它展开……">' +
      escapeHtml(_0x1ef196['idea'] || '') +
      '</textarea>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-home-input-meta\x22><p>先讨论方向，再由你决定如何写成正文。</p><span\x20data-story-idea-count>' +
      (_0x1ef196['idea'] || '')['length'] +
      ' / ' +
      STORY_IDEA_MAX_CHARACTERS +
      '</span></div>\n    </div>'
    );
  if (_0x1ef196['homeTab'] === 'replication') {
    const _0x202225 = Array['isArray'](_0x1ef196['replicationSourceFiles'])
        ? _0x1ef196['replicationSourceFiles']
        : [],
      _0x2ac059 = Array['isArray'](_0x1ef196['replicationSourcePreviewUrls'])
        ? _0x1ef196['replicationSourcePreviewUrls']
        : [],
      _0x1f851f =
        '<div\x20class=\x22story-replication-upload-list\x20workspace-video-import-grid\x22\x20data-story-replication-upload-list\x20' +
        (_0x202225['length'] ? '' : 'hidden') +
        '>\n          ' +
        _0x202225['map']((_0x4e2985, _0x1b3f58) => {
          const _0x2cef09 = _0x4e2985['name'] || '视频 ' + (_0x1b3f58 + 0x1),
            _0x3a8e0e = normalizeText(_0x2ac059[_0x1b3f58]);
          return (
            '<article class="story-replication-upload-item workspace-video-import-item" data-replication-source-key="' +
            escapeHtml(_0x3a8e0e || _0x2cef09 + ':' + _0x4e2985['size'] + ':' + _0x4e2985['lastModified']) +
            '">\n              <button type="button" class="story-replication-upload-thumbnail workspace-video-import-thumbnail" data-story-action="choose-replication-videos" aria-label="' +
            escapeHtml(_0x2cef09) +
            '，点击继续上传参考视频\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
            (_0x3a8e0e
              ? '<video\x20src=\x22' +
                escapeHtml(_0x3a8e0e) +
                '\x22\x20preload=\x22metadata\x22\x20muted\x20playsinline\x20aria-label=\x22' +
                escapeHtml(_0x2cef09) +
                ' 视频缩略图" draggable="false"></video>'
              : '<span\x20class=\x22workspace-video-import-placeholder\x22>' +
                renderStoryReplicationVideoIcon() +
                '</span>') +
            '\n              </button>\n              <button type="button" class="story-replication-upload-remove workspace-video-import-remove" data-story-action="remove-replication-video" data-story-replication-file-index="' +
            _0x1b3f58 +
            '" aria-label="移除 ' +
            escapeHtml(_0x2cef09) +
            '\x22>×</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22workspace-video-import-copy\x22><strong>' +
            escapeHtml(_0x2cef09) +
            '</strong></div>\n            </article>'
          );
        })['join']('') +
        '\n        </div>';
    return (
      '<div class="story-home-composer-panel story-upload-drop workspace-video-import-panel story-replication-upload ' +
      (_0x202225['length'] ? 'has-sources' : '') +
      '" data-story-replication-drop>\n      ' +
      _0x1f851f +
      '\n      <div class="story-replication-upload-empty" ' +
      (_0x202225['length'] ? 'hidden' : '') +
      '>\n        <strong>上传原视频，复刻原剧情</strong>\n        <p>支持多选 MP4、MOV、AVI，豆包官方每条不超过 500MB，其他模型不超过 100MB。</p>\n        <div class="story-upload-actions"><button type="button" class="story-secondary-button" data-story-action="choose-replication-videos">选择视频</button></div>\n      </div>\n    </div>'
    );
  }
  if (_0x1ef196['homeTab'] === 'generate') {
    const _0x47bd51 = hasStoryHomeReferenceScript(_0x1ef196),
      _0x5f45be = normalizeText(_0x1ef196['scriptFileName']),
      _0x49a243 = _0x47bd51
        ? '描述你希望如何改写这份剧本，例如：改成海外爆款短剧风格，强化冲突与集尾钩子。'
        : '输入你想创作的剧本内容，或上传参考剧本进行改编……';
    return (
      '<div\x20class=\x22story-home-composer-panel\x20story-home-input-wrap\x20story-home-story-input\x20story-home-creation-input\x20' +
      (_0x47bd51 ? 'has-reference-script' : '') +
      '" data-story-rewrite-drop>\n      <div class="story-home-reference-source">\n        <button type="button" class="story-home-reference-upload" data-story-action="choose-rewrite-script" aria-label="' +
      (_0x47bd51 ? '替换参考剧本（改写模式）' : '上传参考剧本') +
      '\x22\x20' +
      (_0x1ef196['isParsingDocument'] ? 'disabled' : '') +
      ' aria-busy="' +
      Boolean(_0x1ef196['isParsingDocument']) +
      '">\n          <span class="story-home-reference-upload-icon" aria-hidden="true">' +
      (_0x1ef196['isParsingDocument']
        ? renderStoryGenerationSpinner({ button: !![] })
        : '<span class="story-home-reference-document-icon"></span><span class="story-home-reference-add-icon"></span><span class="story-home-reference-extension">' +
          escapeHtml(getStoryDocumentExtension(_0x5f45be)) +
          '</span>') +
      '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      (_0x1ef196['isParsingDocument'] ? '<span class="story-home-reference-status">解析中</span>' : '') +
      '\n        </button>\n        ' +
      (_0x47bd51
        ? '<span class="story-home-reference-file-name">' +
          escapeHtml(_0x5f45be) +
          '</span>\n          <button type="button" class="story-home-reference-remove" data-story-action="remove-rewrite-script" aria-label="移除参考剧本">×</button>'
        : '') +
      '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-home-creation-copy\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label\x20for=\x22storyIdeaInput\x22>' +
      (_0x47bd51 ? '填写改写要求' : '输入故事设定') +
      '</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<textarea\x20id=\x22storyIdeaInput\x22\x20data-story-idea-input\x20maxlength=\x22' +
      STORY_IDEA_MAX_CHARACTERS +
      '\x22\x20placeholder=\x22' +
      _0x49a243 +
      '\x22>' +
      escapeHtml(_0x1ef196['idea']) +
      '</textarea>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-home-input-meta\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p\x20data-story-script-mode-hint>' +
      (_0x47bd51
        ? STORY_HOME_REWRITE_SOURCE_HINT
        : escapeHtml(getStoryScriptModeHint(_0x1ef196['scriptMode']))) +
      '</p>\n          <span data-story-idea-count>' +
      _0x1ef196['idea']['length'] +
      ' / ' +
      STORY_IDEA_MAX_CHARACTERS +
      '</span>\n        </div>\n      </div>\n    </div>'
    );
  }
  const isNovelIntent = _0x1ef196['scriptIntent'] === 'novel';
  if (_0x1ef196['uploadInputMode'] === 'paste')
    return (
      '<div class="story-home-composer-panel story-home-input-wrap story-home-story-input story-home-paste-input" data-story-script-drop>\n      <label for="storyPasteInput">粘贴剧本文本</label>\n      <textarea id="storyPasteInput" data-story-paste-input maxlength="' +
      STORY_SCRIPT_MAX_CHARACTERS +
      '" placeholder="在这里粘贴完整剧本……">' +
      escapeHtml(_0x1ef196['scriptText']) +
      '</textarea>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-home-input-meta\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<p>支持最多\x20' +
      STORY_SCRIPT_MAX_CHARACTERS +
      ' 字，' +
      (isNovelIntent ? '将改编为分集剧本，拆分场景后生成正文。' : '将按原稿导入，不扩写、不重新分集。') +
      '</p>\n        <span data-story-paste-count>' +
      _0x1ef196['scriptText']['length'] +
      '\x20/\x20' +
      STORY_SCRIPT_MAX_CHARACTERS +
      '</span>\n      </div>\n      <div class="story-upload-actions">\n        <button type="button" class="story-secondary-button button-press-feedback" data-story-action="choose-script"><span>上传剧本</span></button>\n        <button type="button" class="story-secondary-button button-press-feedback is-active" data-story-action="paste-script" aria-pressed="true"><span>粘贴文本</span></button>\n      </div>\n    </div>'
    );
  return (
    '<div class="story-home-composer-panel story-upload-drop" data-story-script-drop>\n    <strong>' +
    (_0x1ef196['isParsingDocument']
      ? '正在解析文档…'
      : _0x1ef196['scriptFileName']
        ? escapeHtml(_0x1ef196['scriptFileName'])
        : isNovelIntent
          ? '上传小说'
          : '上传剧本文件') +
    '</strong>\n    <p>' +
    (_0x1ef196['scriptFileName']
      ? isNovelIntent
        ? '小说已就绪，将改编为分集剧本并拆分场景。'
        : '剧本已就绪，将按原稿结构导入并直接提取素材。'
      : '支持 TXT、DOCX、文本型 PDF，文本内容不超过 ' + STORY_SCRIPT_MAX_CHARACTERS + ' 字。') +
    '</p>\x0a\x20\x20\x20\x20<div\x20class=\x22story-upload-actions\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x20button-press-feedback' +
    (isNovelIntent ? '' : ' is-active') +
    '\x22\x20data-story-action=\x22choose-script\x22\x20' +
    (_0x1ef196['isParsingDocument'] ? 'disabled' : '') +
    ' aria-busy="' +
    Boolean(_0x1ef196['isParsingDocument']) +
    '\x22>' +
    (_0x1ef196['isParsingDocument'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
    '<span>' +
    (_0x1ef196['isParsingDocument'] ? '解析中' : '上传剧本') +
    '</span></button>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x20button-press-feedback' +
    (isNovelIntent ? ' is-active' : '') +
    '\x22\x20data-story-action=\x22choose-novel\x22\x20aria-pressed=\x22false\x22><span>上传小说</span></button>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x20button-press-feedback\x22\x20data-story-action=\x22paste-script\x22\x20aria-pressed=\x22false\x22><span>粘贴文本</span></button>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>'
  );
}
export function renderStoryScriptModeControl(_0x5ed5ca = 'plot', { hidden: hidden = ![] } = {}) {
  const _0x211f92 = normalizeStoryScriptMode(_0x5ed5ca),
    _0xf8de5e = _0x211f92 === 'narration' ? '解说模式' : '剧情模式',
    _0x7afbe2 = _0x211f92 === 'narration' ? '剧情模式' : '解说模式';
  return (
    '<button type="button" class="story-home-param-trigger story-script-mode-toggle ' +
    (_0x211f92 === 'narration' ? 'is-narration' : '') +
    '\x22\x20data-story-script-mode-control\x20data-story-script-mode=\x22' +
    _0x211f92 +
    '\x22\x20aria-pressed=\x22' +
    (_0x211f92 === 'narration') +
    '\x22\x20aria-label=\x22当前' +
    _0xf8de5e +
    '，点击切换为' +
    _0x7afbe2 +
    '\x22\x20' +
    (hidden ? 'hidden' : '') +
    '>\x0a\x20\x20\x20\x20<span\x20class=\x22story-home-param-icon\x20story-script-mode-icon\x22\x20aria-hidden=\x22true\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.8\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22><path\x20d=\x22M7\x207h10l-2.5-2.5M17\x2017H7l2.5\x202.5\x22/><path\x20d=\x22M17\x207l-2.5\x202.5M7\x2017l2.5-2.5\x22/></svg></span>\x0a\x20\x20\x20\x20<span\x20data-story-script-mode-label>' +
    _0xf8de5e +
    '</span>\n  </button>'
  );
}
export function getStoryHomeGenerateButtonLabel(_0x12ee2d) {
  if (_0x12ee2d['homeTab'] === 'collaborate') return '开始协作';
  if (_0x12ee2d['isGeneratingStory']) return _0x12ee2d['generationStatus'] || '正在创建剧情';
  if (_0x12ee2d['homeTab'] === 'replication') return '导入视频';
  if (_0x12ee2d['homeTab'] === 'upload') return '导入剧本';
  if (hasStoryHomeReferenceScript(_0x12ee2d)) return '开始改写';
  return '生成剧本';
}
export function renderStoryHomeParamChevron() {
  return '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="story-home-param-chevron node-menu-caret" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
}
function renderStoryAspectRatioPicker(
  _0x2dd942,
  { placement: placement = 'above', compact: compact = ![] } = {},
) {
  const _0x38a74f = normalizeStoryAspectRatio(_0x2dd942['data']?.['project']?.['aspectRatio']),
    _0x21ea72 = placement === 'below' ? ' story-ratio-picker--below' : '',
    _0x5daeeb = compact ? ' story-home-param-picker--compact' : '';
  return (
    '<div class="story-home-param-picker story-ratio-picker' +
    _0x21ea72 +
    _0x5daeeb +
    '">\n    <button type="button" class="story-home-param-trigger story-menu-trigger" data-story-home-param-trigger="ratio" aria-haspopup="listbox" aria-expanded="false">\n      <span class="story-home-param-icon" aria-hidden="true">▭</span>\n      <span>' +
    escapeHtml(_0x38a74f) +
    '</span>\n      ' +
    renderStoryHomeParamChevron() +
    '\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20<div\x20class=\x22story-home-param-popover\x20story-ratio-popover\x22\x20role=\x22listbox\x22\x20aria-label=\x22画面比例\x22>\x0a\x20\x20\x20\x20\x20\x20<strong>画面比例</strong>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-ratio-options\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    STORY_ASPECT_RATIO_OPTIONS['map'](
      (_0x1f3bb5) =>
        '<button type="button" class="story-ratio-option ' +
        (_0x1f3bb5['value'] === _0x38a74f ? 'is-selected' : '') +
        '\x22\x20data-story-aspect-ratio-option=\x22' +
        escapeHtml(_0x1f3bb5['value']) +
        '\x22\x20role=\x22option\x22\x20aria-selected=\x22' +
        (_0x1f3bb5['value'] === _0x38a74f) +
        '\x22>' +
        escapeHtml(_0x1f3bb5['selectedLabel'] || _0x1f3bb5['label']) +
        '</button>',
    )['join']('') +
    '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>'
  );
}
function renderStoryPlanningPicker({
  field: _0x1e8641,
  label: _0x3bbd3e,
  icon: _0x529993,
  value: _0xdd8106,
  options: _0x52741a,
  disabledOptions: disabledOptions = [],
  customOption: customOption = null,
  formatOption: _0x3bf9dd,
  singleColumn: singleColumn = ![],
  hidden: hidden = ![],
} = {}) {
  const _0x3f3e57 = new Set(disabledOptions);
  return (
    '<div class="story-home-param-picker story-ratio-picker story-planning-picker" data-story-planning-picker="' +
    escapeHtml(_0x1e8641) +
    '\x22\x20' +
    (hidden ? 'hidden' : '') +
    '>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-home-param-trigger\x20story-menu-trigger\x22\x20data-story-home-param-trigger=\x22' +
    escapeHtml(_0x1e8641) +
    '" aria-haspopup="listbox" aria-expanded="false">\n      <span class="story-home-param-icon" aria-hidden="true">' +
    escapeHtml(_0x529993) +
    '</span>' +
    (_0x1e8641 === 'promptMode'
      ? '<span class="story-home-param-kind-label">提示词</span>'
      : '') +
    '\n      <span data-story-planning-trigger-label>' +
    escapeHtml(_0x3bf9dd(_0xdd8106)) +
    '</span>\n      ' +
    renderStoryHomeParamChevron() +
    '\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20<div\x20class=\x22story-home-param-popover\x20story-ratio-popover\x20story-planning-popover\x22\x20role=\x22listbox\x22\x20aria-label=\x22' +
    escapeHtml(_0x3bbd3e) +
    '\x22>\x0a\x20\x20\x20\x20\x20\x20<strong>' +
    escapeHtml(_0x3bbd3e) +
    '</strong>\n      <div class="story-ratio-options story-planning-options' +
    (singleColumn ? ' story-planning-options--single-column' : '') +
    '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    _0x52741a['map']((_0x6b8999) => {
      const _0x41abab = _0x3f3e57['has'](_0x6b8999);
      return (
        '<button\x20type=\x22button\x22\x20class=\x22story-ratio-option\x20' +
        (_0x6b8999 === _0xdd8106 ? 'is-selected' : '') +
        '\x20' +
        (_0x41abab ? 'is-disabled' : '') +
        '" data-story-planning-field="' +
        escapeHtml(_0x1e8641) +
        '\x22\x20data-story-planning-option=\x22' +
        _0x6b8999 +
        '" role="option" aria-selected="' +
        (_0x6b8999 === _0xdd8106) +
        '\x22\x20aria-disabled=\x22' +
        _0x41abab +
        '\x22\x20' +
        (_0x41abab ? 'disabled' : '') +
        '>' +
        escapeHtml(_0x3bf9dd(_0x6b8999)) +
        '</button>'
      );
    })['join']('') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    (customOption?.['visible']
      ? '<label\x20class=\x22story-ratio-option\x20story-episode-count-custom-editor\x20' +
        (customOption['selected'] ? 'is-selected' : '') +
        '" data-story-custom-episode-count role="option" aria-selected="' +
        customOption['selected'] +
        '" aria-label="自定义分集数，最多 ' +
        STORY_EPISODE_COUNT_MAX +
        ' 集">\n          <input type="number" min="1" max="' +
        STORY_EPISODE_COUNT_MAX +
        '" step="1" inputmode="numeric" autocomplete="off" data-story-custom-episode-count-input aria-label="输入自定义分集数，1 到 ' +
        STORY_EPISODE_COUNT_MAX +
        '\x20集\x22\x20placeholder=\x22输入集数\x22\x20value=\x22' +
        (customOption['selected'] ? escapeHtml(_0xdd8106) : '') +
        '">\n          <span>集</span>\n        </label>'
      : '') +
    '\n      </div>\n    </div>\n  </div>'
  );
}
function renderStoryStylePicker(
  _0x541312,
  { placement: placement = 'overlay', compact: compact = ![] } = {},
) {
  const _0x10773e = _0x541312['data']?.['project'] || {},
    _0x252997 = resolveStoryStyleSelection({
      styleId: _0x10773e['videoStyleId'],
      stylePrompt: _0x10773e['videoStylePrompt'],
      videoStyle: _0x10773e['videoStyle'],
    }),
    _0x331a08 = _0x252997['isCustom']
      ? _0x252997['stylePrompt']
      : normalizeText(_0x10773e['customVideoStylePrompt']),
    _0x4f6c91 = placement === 'below' ? ' story-style-picker--below' : '',
    _0x55773c = compact ? ' story-home-param-picker--compact' : '';
  return (
    '<div class="story-home-param-picker story-style-picker' +
    _0x4f6c91 +
    _0x55773c +
    '">\n    <button type="button" class="story-home-param-trigger story-menu-trigger story-style-trigger" data-story-home-param-trigger="style" aria-haspopup="dialog" aria-expanded="false" title="选择提示词风格">\n      ' +
    (_0x252997['thumbnail']
      ? '<img src="' + escapeHtml(_0x252997['thumbnail']) + '" alt="" draggable="false">'
      : '<span\x20class=\x22story-home-param-icon\x20story-style-custom-icon\x22\x20aria-hidden=\x22true\x22>✦</span>') +
    '\n      <span class="story-home-param-kind-label">风格</span>\n      <span class="story-style-trigger-label">' +
    escapeHtml(_0x252997['label']) +
    '</span>\x0a\x20\x20\x20\x20\x20\x20' +
    renderStoryHomeParamChevron() +
    '\n    </button>\n    <section class="story-home-param-popover story-style-popover" role="dialog" aria-label="风格库">\n      <div class="story-style-library" data-story-style-library>\n        <div class="story-style-header">\n          <div>\n            <strong>风格库</strong>\n            <small>为后续角色、场景、道具和分集画面统一视觉方向</small>\n          </div>\n          <label class="story-style-search">\n            <span aria-hidden="true">⌕</span>\n            <input type="search" data-story-style-search-input placeholder="搜索风格" autocomplete="off">\n          </label>\n        </div>\n        <div class="story-style-tabs" role="group" aria-label="风格分类">\n          ' +
    STORY_STYLE_CATEGORIES['map'](
      (_0x15bb20) =>
        '<button type="button" class="story-style-tab ' +
        (_0x15bb20['id'] === 'all' ? 'is-active' : '') +
        '" data-story-style-category="' +
        _0x15bb20['id'] +
        '" role="button" aria-pressed="' +
        (_0x15bb20['id'] === 'all') +
        '\x22>' +
        _0x15bb20['label'] +
        '</button>',
    )['join']('') +
    '\n        </div>\n        <div class="story-style-grid" data-story-style-grid>\n          <button type="button" class="story-style-card story-style-card--custom ' +
    (_0x252997['isCustom'] ? 'is-selected' : '') +
    '" data-story-style-custom data-story-style-search="自定义风格提示词" data-story-style-card-category="custom">\n            <span class="story-style-custom-mark" aria-hidden="true">✦</span>\n            <span>自定义风格提示词</span>\n          </button>\n          ' +
    STORY_STYLE_PRESETS['map'](
      (_0x66b6d9) =>
        '<button type="button" class="story-style-card ' +
        (_0x66b6d9['id'] === _0x252997['styleId'] ? 'is-selected' : '') +
        '" data-story-style-option="' +
        escapeHtml(_0x66b6d9['id']) +
        '" data-story-style-search="' +
        escapeHtml(_0x66b6d9['label']['toLowerCase']()) +
        '" data-story-style-card-category="' +
        escapeHtml(_0x66b6d9['category']) +
        '">\n            <img src="' +
        escapeHtml(_0x66b6d9['thumbnail']) +
        '" alt="" loading="lazy" decoding="async" draggable="false">\n            <span>' +
        escapeHtml(_0x66b6d9['label']) +
        '</span>\n          </button>',
    )['join']('') +
    '\n        </div>\n        <p class="story-style-empty" data-story-style-empty hidden>没有匹配的风格</p>\n      </div>\n      <div class="story-style-custom-editor" data-story-style-custom-editor hidden>\n        <div class="story-style-custom-editor-heading">\n          <button type="button" data-story-style-custom-back aria-label="返回风格库">←</button>\n          <div>\n            <strong>自定义风格提示词</strong>\n            <small>描述画面媒介、光线、色调、质感与时代气质</small>\n          </div>\n        </div>\n        <textarea data-story-style-custom-input maxlength="' +
    STORY_CUSTOM_STYLE_MAX_CHARACTERS +
    '" placeholder="例如：真人写实，90 年代港片胶片质感，暖黄色街灯，低饱和色调">' +
    escapeHtml(_0x331a08) +
    '</textarea>\n        <div class="story-style-custom-footer">\n          <span data-story-style-custom-count>' +
    _0x331a08['length'] +
    '\x20/\x20' +
    STORY_CUSTOM_STYLE_MAX_CHARACTERS +
    '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-style-custom-confirm\x22\x20data-story-style-custom-confirm\x20aria-label=\x22确认自定义风格\x22>✓</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</section>\x0a\x20\x20</div>'
  );
}
function renderStoryHomeEmptyIcon() {
  return '<span class="workspace-mode-icon workspace-mode-icon--story" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 3.75h8.5L19 7.25v13H7z"/><path d="M15.5 3.75v3.5H19M10 11h6M10 14.5h6M10 18h4"/></svg></span>';
}
export function renderStoryHomeModelBar(_0x1b0219) {
  const _0x3ff3fd = _0x1b0219['data']?.['project']?.['planning'] || {},
    _0x1f451e = normalizeStoryEpisodeCount(_0x3ff3fd['episodeCount']),
    _0x520cba = normalizeStoryPromptMode(_0x3ff3fd['promptMode'], {
      allowDeveloperModes: _0x1b0219['developerModeAvailable'] === !![],
    }),
    _0x3f8b38 =
      _0x1b0219['homeTab'] === 'collaborate'
        ? Boolean(_0x1b0219['idea']?.['trim']())
        : canStartStoryHomeGeneration(_0x1b0219),
    _0x3fc8ef = getStoryVideoInputTextModelOptions()['map']((_0x1b1508) => _0x1b1508['modelId']),
    _0x1ca97a =
      _0x1b0219['homeTab'] === 'replication' && !_0x3fc8ef['includes'](_0x1b0219['models']['text'])
        ? _0x3fc8ef[0x0] || _0x1b0219['models']['text']
        : _0x1b0219['models']['text'],
    _0x5300d5 = getStoryReplicationLocale(
      _0x1b0219['hasCreatedProject'] && _0x1b0219['data']?.['project']?.['sourceMode'] === 'video-replication'
        ? _0x1b0219['data']['project']['replication']?.['targetLocale']
        : _0x1b0219['replicationTargetLocale'],
    );
  return (
    '<div\x20class=\x22story-home-model-bar\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22story-home-model-controls\x22>\x0a\x20\x20\x20\x20\x20\x20' +
    renderAIGenTextModelSelectorMarkup({
      modelId: _0x1ca97a,
      provider: _0x1b0219['textProvider'],
      providerProfileId: _0x1b0219['textProviderProfileId'],
      includeRunningHubInternational: !![],
      getDisplayModelName: getDisplayModelName,
      className: 'story-home-text-model-selector',
      allowedModelIds: _0x1b0219['homeTab'] === 'replication' ? _0x3fc8ef : undefined,
    }) +
    '\x0a\x20\x20\x20\x20\x20\x20' +
    (_0x1b0219['homeTab'] === 'replication'
      ? renderStoryPlanningPicker({
          field: 'replicationAsrProvider',
          label: '语音识别模型',
          icon: '♫',
          value: _0x1b0219['replicationAsrProvider'] || 'volcengine-speech',
          options: RECORDING_ASR_MODELS['map']((_0x15dac2) => _0x15dac2['id']),
          singleColumn: !![],
          formatOption: (_0x5ef168) =>
            RECORDING_ASR_MODELS['find']((_0x27535f) => _0x27535f['id'] === _0x5ef168)?.['label'] ||
            _0x5ef168,
        })
      : renderStoryStylePicker(_0x1b0219)) +
    '\x0a\x20\x20\x20\x20\x20\x20' +
    renderStoryPlanningPicker({
      field: 'promptMode',
      label: '单片段提示词模式',
      icon: '✦',
      value: _0x520cba,
      options: STORY_PROMPT_MODE_OPTIONS['map']((_0x9c0989) => _0x9c0989['value']),
      disabledOptions: STORY_PROMPT_MODE_OPTIONS['filter'](
        (_0x7bd70c) => !_0x7bd70c['enabled'] && !_0x1b0219['developerModeAvailable'],
      )['map']((_0x29a867) => _0x29a867['value']),
      formatOption: getStoryPromptModeLabel,
      singleColumn: !![],
      hidden: ![],
    }) +
    '\n      ' +
    renderStoryPlanningPicker({
      field: 'targetLocale',
      label: '语种与地区',
      icon: '文',
      value: _0x5300d5['value'],
      options: STORY_REPLICATION_LOCALES['map']((_0x1f4183) => _0x1f4183['value']),
      formatOption: (_0x1f2ecd) => getStoryReplicationLocale(_0x1f2ecd)['shortLabel'],
      hidden: _0x1b0219['homeTab'] !== 'replication',
    }) +
    '\n      ' +
    renderStoryPlanningPicker({
      field: 'episodeCount',
      label: '目标分集数',
      icon: '≡',
      value: _0x1f451e,
      options: _0x1b0219['developerModeAvailable']
        ? [...STORY_PUBLIC_EPISODE_COUNT_OPTIONS, ...STORY_DEVELOPER_EPISODE_COUNT_OPTIONS]
        : STORY_PUBLIC_EPISODE_COUNT_OPTIONS,
      customOption: {
        visible: _0x1b0219['developerModeAvailable'] === !![],
        selected: !STORY_EPISODE_COUNT_OPTIONS['includes'](_0x1f451e),
      },
      formatOption: (_0x28f052) => _0x28f052 + '集',
      singleColumn: !![],
      hidden: !['generate', 'collaborate']['includes'](_0x1b0219['homeTab']),
    }) +
    '\n      ' +
    renderStoryScriptModeControl(_0x1b0219['scriptMode'], {
      hidden: !['generate', 'collaborate']['includes'](_0x1b0219['homeTab']),
    }) +
    '\n    </div>\n    ' +
    (['replication', 'collaborate']['includes'](_0x1b0219['homeTab'])
      ? ''
      : renderRequestDebugButton('data-story-action="debug-story-home"')) +
    '<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x20story-home-generate\x20story-main-action-button\x22\x20' +
    (_0x1b0219['homeTab'] === 'collaborate'
      ? 'data-collaboration-start'
      : 'data-story-action="generate-story"') +
    '\x20' +
    (_0x3f8b38 && !_0x1b0219['isGeneratingStory'] ? '' : 'disabled') +
    ' aria-busy="' +
    Boolean(_0x1b0219['isGeneratingStory']) +
    '\x22>' +
    (_0x1b0219['isGeneratingStory'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
    '<span\x20data-story-generate-label>' +
    escapeHtml(getStoryHomeGenerateButtonLabel(_0x1b0219)) +
    '</span>' +
    (_0x1b0219['isGeneratingStory']
      ? ''
      : '<span\x20class=\x22story-generate-arrow\x22\x20aria-hidden=\x22true\x22>→</span>') +
    '</button>\x0a\x20\x20</div>'
  );
}
export function renderStoryHomeProjectResults(_0x1f0fc6) {
  _0x1f0fc6 = { ..._0x1f0fc6, projects: getStorySurfaceProjects(_0x1f0fc6) };
  const _0x191d68 = _0x1f0fc6['workspaceSurface'] === 'replication' ? '复刻项目' : '剧本项目',
    _0x1055fa = _0x1f0fc6['showArchivedProjects'] === !![],
    _0x4faa49 = getStoryProjectHomeEntries(_0x1f0fc6['projects'], {
      query: _0x1f0fc6['projectSearchQuery'],
      sortOrder: _0x1f0fc6['projectSortOrder'],
      showArchived: _0x1055fa,
    });
  return _0x1f0fc6['projects']['length']
    ? '<div class="story-project-grid">\n        ' +
        _0x4faa49['map']((_0x3adbfd) =>
          renderStoryProjectCard(_0x3adbfd, {
            itemLabel: _0x1f0fc6['workspaceSurface'] === 'replication' ? '条视频' : '集',
            isDeleteConfirming:
              normalizeText(_0x1f0fc6['pendingDeleteProjectId']) ===
              normalizeText(_0x3adbfd?.['id'] || _0x3adbfd?.['data']?.['project']?.['id']),
            isMenuOpen:
              normalizeText(_0x1f0fc6['openProjectMenuId']) ===
              normalizeText(_0x3adbfd?.['id'] || _0x3adbfd?.['data']?.['project']?.['id']),
          }),
        )['join']('') +
        '\n        ' +
        (_0x4faa49['length']
          ? ''
          : '<div\x20class=\x22story-project-filter-empty\x22><strong>' +
            (_0x1055fa ? '没有匹配的归档项目' : '没有匹配的' + _0x191d68) +
            '</strong><span>可以尝试其他搜索词，或清空搜索条件。</span></div>') +
        '\n        ' +
        (_0x1055fa
          ? ''
          : '<button type="button" class="story-project-create-tile" data-story-action="new-story" aria-label="新建' +
            _0x191d68 +
            '">\n          <span aria-hidden="true">+</span>\n          <strong>新建' +
            _0x191d68 +
            '</strong>\n        </button>') +
        '\n      </div>'
    : '<div class="story-project-empty">\n        <div class="story-project-empty-icon" aria-hidden="true">' +
        renderStoryHomeEmptyIcon() +
        '</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<strong>还没有' +
        _0x191d68 +
        '</strong>\n        <span>创建项目后，它会保存在当前用户项目数据中。</span>\n        <button type="button" class="story-primary-button story-project-empty-action" data-story-action="new-story">创建第一个项目</button>\n      </div>';
}
export function renderStoryHome(_0x3d80d7) {
  _0x3d80d7 = { ..._0x3d80d7, projects: getStorySurfaceProjects(_0x3d80d7) };
  const _0x1693af = {
      ..._0x3d80d7,
      homeTab: resolveStoryVideoReplicationHomeTab(_0x3d80d7, _0x3d80d7['homeTab']),
    },
    _0x5397e5 = _0x3d80d7['showArchivedProjects'] === !![],
    _0x2f2c48 = _0x3d80d7['projects']['filter'](
      (_0x557d3d) => Number(_0x557d3d?.['archivedAt'] || 0x0) > 0x0,
    )['length'];
  return (
    '<div class="story-home-page' +
    (_0x1693af['homeTab'] === 'replication' ? ' story-home-page--replication' : '') +
    '\x22>\x0a\x20\x20\x20\x20<section\x20class=\x22story-home-hero\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-eyebrow\x22>SHUO\x20Canvas\x20·\x20' +
    (_0x3d80d7['workspaceSurface'] === 'replication' ? 'Replication\x20Studio' : 'Story Studio') +
    '</span>\n      <h1>' +
    (_0x3d80d7['workspaceSurface'] === 'replication' ? '复刻工作室' : '从一个想法到完整的AI视频') +
    '</h1>\n      ' +
    (_0x3d80d7['workspaceSurface'] === 'replication'
      ? ''
      : '<p class="story-home-mode-description" data-story-home-mode-description aria-live="polite">' +
        escapeHtml(getStoryHomeModeDescription(_0x1693af['homeTab'], _0x1693af['scriptIntent'])) +
        '</p>') +
    '\n      <div class="story-home-composer ' +
    (_0x3d80d7['isGeneratingStory'] ? 'is-generating' : '') +
    '" aria-busy="' +
    (_0x3d80d7['isGeneratingStory'] ? 'true' : 'false') +
    '">\n        ' +
    renderHomeTabs(_0x1693af) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-home-composer-body\x22>' +
    renderStoryHomeComposerBody(_0x1693af) +
    '</div>\n        ' +
    renderStoryHomeModelBar(_0x1693af) +
    '\n        <div class="story-home-generation-loading storyboard-script-loading-overlay" data-story-generation-loading role="status" aria-live="polite" ' +
    (_0x3d80d7['isGeneratingStory'] ? '' : 'hidden') +
    '>\n          <div class="storyboard-script-loading-spinner"></div>\n          <div class="storyboard-script-loading-label" data-story-generation-loading-label>' +
    escapeHtml(_0x3d80d7['generationStatus'] || '正在创建剧情') +
    '</div>\n          <div class="storyboard-script-loading-bar"><div class="storyboard-script-loading-bar-fill"></div></div>\n        </div>\n      </div>\n    </section>\n    <section class="story-projects-section">\n      <div class="story-section-heading">\n        <div>\n          <h2>' +
    (_0x5397e5
      ? '已归档项目'
      : _0x3d80d7['workspaceSurface'] === 'replication'
        ? '我的复刻项目'
        : '我的剧本项目') +
    '</h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-project-list-controls\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-project-import-button\x22\x20data-story-action=\x22import-project\x22>导入项目</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label\x20class=\x22story-project-search\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20aria-hidden=\x22true\x22>⌕</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<input\x20type=\x22search\x22\x20data-story-project-search\x20value=\x22' +
    escapeHtml(_0x3d80d7['projectSearchQuery'] || '') +
    '" placeholder="搜索项目名称" autocomplete="off" aria-label="搜索' +
    (_0x3d80d7['workspaceSurface'] === 'replication' ? '复刻项目' : '剧本项目') +
    '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderStoryProjectSortControl(_0x3d80d7['projectSortOrder']) +
    '\n          <button type="button" class="story-project-archive-toggle ' +
    (_0x5397e5 ? 'is-active' : '') +
    '" data-story-action="toggle-archived-projects" aria-pressed="' +
    _0x5397e5 +
    '\x22>' +
    (_0x5397e5 ? '返回项目' : '已归档\x20' + _0x2f2c48) +
    '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20' +
    renderStoryHomeProjectResults(_0x3d80d7) +
    '\x0a\x20\x20\x20\x20</section>\x0a\x20\x20</div>'
  );
}
export function renderStoryProjectSortControl(_0x28eb1a = 'updated-desc') {
  return renderWorkspaceProjectSortControl(_0x28eb1a);
}
export function getStoryProjectTypeLabel(_0x42e003 = {}) {
  const _0x532a2e = normalizeText(_0x42e003?.['data']?.['project']?.['sourceMode']);
  if (_0x532a2e === 'upload-original') return '个人剧本';
  if (_0x532a2e === 'upload-rewrite') return 'AI改写';
  if (_0x532a2e === 'video-replication') return '复刻视频';
  return 'AI剧本';
}
export function renderStoryProjectCard(
  _0x2b7202,
  {
    isDeleteConfirming: isDeleteConfirming = ![],
    isMenuOpen: isMenuOpen = ![],
    fallbackTitle: fallbackTitle = '未命名故事',
    itemCount: itemCount = null,
    itemLabel: itemLabel = '集',
    coverImageUrls: coverImageUrls = null,
    emptyCoverLabel: emptyCoverLabel = '剧本项目',
    coverAltPrefix: coverAltPrefix = '项目角色封面',
  } = {},
) {
  const _0xc9f707 = Array['isArray'](_0x2b7202?.['data']?.['episodes'])
      ? _0x2b7202['data']['episodes']['length']
      : 0x0,
    _0x41652c =
      itemCount !== null && itemCount !== undefined && Number['isFinite'](Number(itemCount))
        ? Math['max'](0x0, Math['trunc'](Number(itemCount)))
        : _0xc9f707,
    _0x5daba1 = getStoryBackgroundTaskSummary(_0x2b7202?.['data']);
  return renderWorkspaceProjectCard(_0x2b7202, {
    isDeleteConfirming: isDeleteConfirming,
    isMenuOpen: isMenuOpen,
    fallbackTitle: fallbackTitle,
    itemCount: _0x41652c,
    itemLabel: itemLabel,
    coverImageUrls: resolveStoryProjectCoverImageUrls(_0x2b7202, coverImageUrls),
    emptyCoverLabel: emptyCoverLabel,
    coverAltPrefix: coverAltPrefix,
    projectTypeLabel: getStoryProjectTypeLabel(_0x2b7202),
    taskSummary: _0x5daba1,
  });
}
function resolveStoryProjectCoverImageUrls(_0x1a69bf, _0x587ebe = null) {
  return (
    Array['isArray'](_0x587ebe)
      ? _0x587ebe
      : (Array['isArray'](_0x1a69bf?.['data']?.['assets']) ? _0x1a69bf['data']['assets'] : [])
          ['filter']((_0x16010c) => _0x16010c?.['kind'] === 'character')
          ['flatMap']((_0x441d4d) => getStoryAssetAppearances(_0x441d4d))
          ['map']((_0x2a8e65) => _0x2a8e65?.['imageUrl'])
  )
    ['map'](normalizeText)
    ['filter'](
      (_0x3c40c9, _0x263950, _0x5a2aca) => _0x3c40c9 && _0x5a2aca['indexOf'](_0x3c40c9) === _0x263950,
    )
    ['slice'](0x0, 0x3);
}
