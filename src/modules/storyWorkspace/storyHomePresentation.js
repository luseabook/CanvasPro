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
import { getStoryHomePromptMode } from './storyHomePromptMode.js';
import { isStoryPromptModeSelectable } from '../../domain/storyGeneration/promptModes.js';
import { getStoryProjectHomeEntries } from './storyProjectSession.js';
import { getStoryVideoInputTextModelOptions } from './storyWorkspaceModelCatalog.js';
import {
  STORY_REPLICATION_LOCALES,
  getStoryReplicationLocale,
  isStoryVideoReplicationHomeAvailable,
  resolveStoryVideoReplicationHomeTab,
} from './storyVideoReplication.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#39;');
}
function normalizeText(item) {
  return String(item ?? '')['trim']();
}
export function getStoryHomeModeDescription(key, index = '') {
  if (key === 'upload' && index === 'novel') return '上传小说，AI 改编为分集剧本后制作';
  return (
    {
      upload: '导入已有剧本，按原稿进入制作',
      generate: '输入故事想法，AI 帮你生成剧本',
      collaborate: '与 AI 讨论方向，自定设定，逐段打磨剧本',
    }[key] || ''
  );
}
function getStoryDocumentExtension(result = '') {
  const text = normalizeText(result)['split']('.')['pop']();
  return text && text !== result ? '.' + text['toLowerCase']() : '.txt';
}
function renderStoryReplicationVideoIcon() {
  return '<svg class="story-replication-upload-video-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="3"/><path d="m17 10 4-2v8l-4-2"/></svg>';
}
function renderStoryHomeTabIcon(data) {
  if (data === 'upload')
    return '<span class="story-home-tab-icon story-home-tab-icon--upload" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 14.5v3.75A1.75 1.75 0 0 0 5.75 20h12.5A1.75 1.75 0 0 0 20 18.25V14.5"/></svg></span>';
  if (data === 'replication')
    return '<span class="story-home-tab-icon story-home-tab-icon--replication" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="13" height="14" rx="2"/><path d="m16.5 9 4-2v10l-4-2z"/><path d="m8.5 9 4 3-4 3z"/></svg></span>';
  return '<span class="story-home-tab-icon story-home-tab-icon--generate" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m11.5 3 .9 3.1a4.7 4.7 0 0 0 3.2 3.2l3.1.9-3.1.9a4.7 4.7 0 0 0-3.2 3.2l-.9 3.1-.9-3.1a4.7 4.7 0 0 0-3.2-3.2l-3.1-.9 3.1-.9a4.7 4.7 0 0 0 3.2-3.2z"/><path d="m18.5 15.5.35 1.15a2.2 2.2 0 0 0 1.5 1.5l1.15.35-1.15.35a2.2 2.2 0 0 0-1.5 1.5l-.35 1.15-.35-1.15a2.2 2.2 0 0 0-1.5-1.5l-1.15-.35 1.15-.35a2.2 2.2 0 0 0 1.5-1.5z"/></svg></span>';
}
function renderHomeTabs(options) {
  if (options['workspaceSurface'] === 'replication') return '';
  const isStoryVideoReplicationHomeAvailable2 = isStoryVideoReplicationHomeAvailable(options),
    list = [
      ['upload', '上传剧本'],
      ['generate', '快速创作'],
      ['collaborate', 'AI 协作创作'],
    ];
  return (
    '<div class="story-home-tabs" data-story-home-tabs data-active-tab="' +
    escapeHtml(options['homeTab']) +
    '" role="tablist">\n    <span class="story-home-tab-indicator" aria-hidden="true"></span>\n    ' +
    list['map'](([target, source]) => {
      const enabled =
          (target === 'replication' && !isStoryVideoReplicationHomeAvailable2) ||
          (target === 'collaborate' && options['developerModeAvailable'] !== true),
        next = options['homeTab'] === target && !enabled;
      return (
        '<button type="button" class="story-home-tab ' +
        (next ? 'is-active' : '') +
        '" data-story-home-tab="' +
        target +
        '" role="tab" aria-selected="' +
        next +
        '" aria-disabled="' +
        enabled +
        '" tabindex="' +
        (next ? '0' : '-1') +
        '" ' +
        (enabled ? 'disabled' : '') +
        '><span class="story-home-tab-content">' +
        renderStoryHomeTabIcon(target) +
        '<span>' +
        source +
        '</span></span></button>'
      );
    })['join']('') +
    '\n  </div>'
  );
}
export function renderStoryHomeComposerBody(current) {
  // A parsed novel turns the upload tab into the chapter batch picker.
  if (
    current['homeTab'] === 'upload' &&
    current['scriptIntent'] === 'novel' &&
    Array['isArray'](current['novelChapters']) &&
    current['novelChapters']['length']
  )
    return renderStoryNovelBatchPanel(current);
  if (current['homeTab'] === 'collaborate')
    return (
      '<div class="story-home-composer-panel story-home-input-wrap story-home-story-input">\n      <label for="storyIdeaInput">输入故事想法</label>\n      <textarea id="storyIdeaInput" data-story-idea-input maxlength="' +
      STORY_IDEA_MAX_CHARACTERS +
      '" placeholder="写下一段故事、人物设定或一个灵感，和 AI 一起把它展开……">' +
      escapeHtml(current['idea'] || '') +
      '</textarea>\n      <div class="story-home-input-meta"><p>先讨论方向，再由你决定如何写成正文。</p><span data-story-idea-count>' +
      (current['idea'] || '')['length'] +
      ' / ' +
      STORY_IDEA_MAX_CHARACTERS +
      '</span></div>\n    </div>'
    );
  if (current['homeTab'] === 'replication') {
    const list2 = Array['isArray'](current['replicationSourceFiles'])
        ? current['replicationSourceFiles']
        : [],
      entry = Array['isArray'](current['replicationSourcePreviewUrls'])
        ? current['replicationSourcePreviewUrls']
        : [],
      record =
        '<div class="story-replication-upload-list workspace-video-import-grid" data-story-replication-upload-list ' +
        (list2['length'] ? '' : 'hidden') +
        '>\n          ' +
        list2['map']((error, payload) => {
          const handle = error['name'] || '视频 ' + (payload + 1),
            text2 = normalizeText(entry[payload]);
          return (
            '<article class="story-replication-upload-item workspace-video-import-item" data-replication-source-key="' +
            escapeHtml(text2 || handle + ':' + error['size'] + ':' + error['lastModified']) +
            '">\n              <button type="button" class="story-replication-upload-thumbnail workspace-video-import-thumbnail" data-story-action="choose-replication-videos" aria-label="' +
            escapeHtml(handle) +
            '，点击继续上传参考视频">\n                ' +
            (text2
              ? '<video src="' +
                escapeHtml(text2) +
                '" preload="metadata" muted playsinline aria-label="' +
                escapeHtml(handle) +
                ' 视频缩略图" draggable="false"></video>'
              : '<span class="workspace-video-import-placeholder">' +
                renderStoryReplicationVideoIcon() +
                '</span>') +
            '\n              </button>\n              <button type="button" class="story-replication-upload-remove workspace-video-import-remove" data-story-action="remove-replication-video" data-story-replication-file-index="' +
            payload +
            '" aria-label="移除 ' +
            escapeHtml(handle) +
            '">×</button>\n              <div class="workspace-video-import-copy"><strong>' +
            escapeHtml(handle) +
            '</strong></div>\n            </article>'
          );
        })['join']('') +
        '\n        </div>';
    return (
      '<div class="story-home-composer-panel story-upload-drop workspace-video-import-panel story-replication-upload ' +
      (list2['length'] ? 'has-sources' : '') +
      '" data-story-replication-drop>\n      ' +
      record +
      '\n      <div class="story-replication-upload-empty" ' +
      (list2['length'] ? 'hidden' : '') +
      '>\n        <strong>上传原视频，复刻原剧情</strong>\n        <p>支持多选 MP4、MOV、AVI，豆包官方每条不超过 500MB，其他模型不超过 100MB。</p>\n        <div class="story-upload-actions"><button type="button" class="story-secondary-button" data-story-action="choose-replication-videos">选择视频</button></div>\n      </div>\n    </div>'
    );
  }
  if (current['homeTab'] === 'generate') {
    const hasStoryHomeReferenceScript2 = hasStoryHomeReferenceScript(current),
      text3 = normalizeText(current['scriptFileName']),
      state = hasStoryHomeReferenceScript2
        ? '描述你希望如何改写这份剧本，例如：改成海外爆款短剧风格，强化冲突与集尾钩子。'
        : '输入你想创作的剧本内容，或上传参考剧本进行改编……';
    return (
      '<div class="story-home-composer-panel story-home-input-wrap story-home-story-input story-home-creation-input ' +
      (hasStoryHomeReferenceScript2 ? 'has-reference-script' : '') +
      '" data-story-rewrite-drop>\n      <div class="story-home-reference-source">\n        <button type="button" class="story-home-reference-upload" data-story-action="choose-rewrite-script" aria-label="' +
      (hasStoryHomeReferenceScript2 ? '替换参考剧本（改写模式）' : '上传参考剧本') +
      '" ' +
      (current['isParsingDocument'] ? 'disabled' : '') +
      ' aria-busy="' +
      Boolean(current['isParsingDocument']) +
      '">\n          <span class="story-home-reference-upload-icon" aria-hidden="true">' +
      (current['isParsingDocument']
        ? renderStoryGenerationSpinner({ button: true })
        : '<span class="story-home-reference-document-icon"></span><span class="story-home-reference-add-icon"></span><span class="story-home-reference-extension">' +
          escapeHtml(getStoryDocumentExtension(text3)) +
          '</span>') +
      '</span>\n          ' +
      (current['isParsingDocument'] ? '<span class="story-home-reference-status">解析中</span>' : '') +
      '\n        </button>\n        ' +
      (hasStoryHomeReferenceScript2
        ? '<span class="story-home-reference-file-name">' +
          escapeHtml(text3) +
          '</span>\n          <button type="button" class="story-home-reference-remove" data-story-action="remove-rewrite-script" aria-label="移除参考剧本">×</button>'
        : '') +
      '\n      </div>\n      <div class="story-home-creation-copy">\n        <label for="storyIdeaInput">' +
      (hasStoryHomeReferenceScript2 ? '填写改写要求' : '输入故事设定') +
      '</label>\n        <textarea id="storyIdeaInput" data-story-idea-input maxlength="' +
      STORY_IDEA_MAX_CHARACTERS +
      '" placeholder="' +
      state +
      '">' +
      escapeHtml(current['idea']) +
      '</textarea>\n        <div class="story-home-input-meta">\n          <p data-story-script-mode-hint>' +
      (hasStoryHomeReferenceScript2
        ? STORY_HOME_REWRITE_SOURCE_HINT
        : escapeHtml(getStoryScriptModeHint(current['scriptMode']))) +
      '</p>\n          <span data-story-idea-count>' +
      current['idea']['length'] +
      ' / ' +
      STORY_IDEA_MAX_CHARACTERS +
      '</span>\n        </div>\n      </div>\n    </div>'
    );
  }
  const isNovelIntent = current['scriptIntent'] === 'novel';
  if (current['uploadInputMode'] === 'paste')
    return (
      '<div class="story-home-composer-panel story-home-input-wrap story-home-story-input story-home-paste-input" data-story-script-drop>\n      <label for="storyPasteInput">粘贴剧本文本</label>\n      <textarea id="storyPasteInput" data-story-paste-input maxlength="' +
      STORY_SCRIPT_MAX_CHARACTERS +
      '" placeholder="在这里粘贴完整剧本……">' +
      escapeHtml(current['scriptText']) +
      '</textarea>\n      <div class="story-home-input-meta">\n        <p>支持最多 ' +
      STORY_SCRIPT_MAX_CHARACTERS +
      ' 字，' +
      (isNovelIntent ? '将改编为分集剧本，拆分场景后生成正文。' : '将按原稿导入，不扩写、不重新分集。') +
      '</p>\n        <span data-story-paste-count>' +
      current['scriptText']['length'] +
      ' / ' +
      STORY_SCRIPT_MAX_CHARACTERS +
      '</span>\n      </div>\n      <div class="story-upload-actions">\n        <button type="button" class="story-secondary-button button-press-feedback" data-story-action="choose-script"><span>上传剧本</span></button>\n        <button type="button" class="story-secondary-button button-press-feedback is-active" data-story-action="paste-script" aria-pressed="true"><span>粘贴文本</span></button>\n      </div>\n    </div>'
    );
  return (
    '<div class="story-home-composer-panel story-upload-drop" data-story-script-drop>\n    <strong>' +
    (current['isParsingDocument']
      ? '正在解析文档…'
      : current['scriptFileName']
        ? escapeHtml(current['scriptFileName'])
        : isNovelIntent
          ? '上传小说'
          : '上传剧本文件') +
    '</strong>\n    <p>' +
    (current['scriptFileName']
      ? isNovelIntent
        ? '小说已就绪，将改编为分集剧本并拆分场景。'
        : '剧本已就绪，将按原稿结构导入并直接提取素材。'
      : '支持 TXT、DOCX、文本型 PDF，文本内容不超过 ' + STORY_SCRIPT_MAX_CHARACTERS + ' 字。') +
    '</p>\n    <div class="story-upload-actions">\n      <button type="button" class="story-secondary-button button-press-feedback' +
    (isNovelIntent ? '' : ' is-active') +
    '" data-story-action="choose-script" ' +
    (current['isParsingDocument'] ? 'disabled' : '') +
    ' aria-busy="' +
    Boolean(current['isParsingDocument']) +
    '">' +
    (current['isParsingDocument'] ? renderStoryGenerationSpinner({ button: true }) : '') +
    '<span>' +
    (current['isParsingDocument'] ? '解析中' : '上传剧本') +
    '</span></button>\n      <button type="button" class="story-secondary-button button-press-feedback' +
    (isNovelIntent ? ' is-active' : '') +
    '" data-story-action="choose-novel" aria-pressed="false"><span>上传小说</span></button>\n      <button type="button" class="story-secondary-button button-press-feedback" data-story-action="paste-script" aria-pressed="false"><span>粘贴文本</span></button>\n    </div>\n  </div>'
  );
}
export function renderStoryScriptModeControl(config = 'plot', { hidden: hidden = false } = {}) {
  const storyScriptMode = normalizeStoryScriptMode(config),
    scope = storyScriptMode === 'narration' ? '解说模式' : '剧情模式',
    input = storyScriptMode === 'narration' ? '剧情模式' : '解说模式';
  return (
    '<button type="button" class="story-home-param-trigger story-script-mode-toggle ' +
    (storyScriptMode === 'narration' ? 'is-narration' : '') +
    '" data-story-script-mode-control data-story-script-mode="' +
    storyScriptMode +
    '" aria-pressed="' +
    (storyScriptMode === 'narration') +
    '" aria-label="当前' +
    scope +
    '，点击切换为' +
    input +
    '" ' +
    (hidden ? 'hidden' : '') +
    '>\n    <span class="story-home-param-icon story-script-mode-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5"/><path d="M17 7l-2.5 2.5M7 17l2.5-2.5"/></svg></span>\n    <span data-story-script-mode-label>' +
    scope +
    '</span>\n  </button>'
  );
}
export function getStoryHomeGenerateButtonLabel(output) {
  if (output['homeTab'] === 'collaborate') return '开始协作';
  if (output['isGeneratingStory']) return output['generationStatus'] || '正在创建剧情';
  if (output['homeTab'] === 'replication') return '导入视频';
  if (output['homeTab'] === 'upload') return '导入剧本';
  if (hasStoryHomeReferenceScript(output)) return '开始改写';
  return '生成剧本';
}
export function renderStoryHomeParamChevron() {
  return '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="story-home-param-chevron node-menu-caret" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
}
function renderStoryAspectRatioPicker(
  value2,
  { placement: placement = 'above', compact: compact = false } = {},
) {
  const storyAspectRatio = normalizeStoryAspectRatio(value2['data']?.['project']?.['aspectRatio']),
    value3 = placement === 'below' ? ' story-ratio-picker--below' : '',
    value4 = compact ? ' story-home-param-picker--compact' : '';
  return (
    '<div class="story-home-param-picker story-ratio-picker' +
    value3 +
    value4 +
    '">\n    <button type="button" class="story-home-param-trigger story-menu-trigger" data-story-home-param-trigger="ratio" aria-haspopup="listbox" aria-expanded="false">\n      <span class="story-home-param-icon" aria-hidden="true">▭</span>\n      <span>' +
    escapeHtml(storyAspectRatio) +
    '</span>\n      ' +
    renderStoryHomeParamChevron() +
    '\n    </button>\n    <div class="story-home-param-popover story-ratio-popover" role="listbox" aria-label="画面比例">\n      <strong>画面比例</strong>\n      <div class="story-ratio-options">\n        ' +
    STORY_ASPECT_RATIO_OPTIONS['map'](
      (el) =>
        '<button type="button" class="story-ratio-option ' +
        (el['value'] === storyAspectRatio ? 'is-selected' : '') +
        '" data-story-aspect-ratio-option="' +
        escapeHtml(el['value']) +
        '" role="option" aria-selected="' +
        (el['value'] === storyAspectRatio) +
        '">' +
        escapeHtml(el['selectedLabel'] || el['label']) +
        '</button>',
    )['join']('') +
    '\n      </div>\n    </div>\n  </div>'
  );
}
function renderStoryPlanningPicker({
  field: field,
  label: label,
  icon: icon,
  value: value5,
  options: options2,
  disabledOptions: disabledOptions = [],
  customOption: customOption = null,
  formatOption: formatOption,
  singleColumn: singleColumn = false,
  hidden: hidden = false,
} = {}) {
  const map = new Set(disabledOptions);
  return (
    '<div class="story-home-param-picker story-ratio-picker story-planning-picker" data-story-planning-picker="' +
    escapeHtml(field) +
    '" ' +
    (hidden ? 'hidden' : '') +
    '>\n    <button type="button" class="story-home-param-trigger story-menu-trigger" data-story-home-param-trigger="' +
    escapeHtml(field) +
    '" aria-haspopup="listbox" aria-expanded="false">\n      <span class="story-home-param-icon" aria-hidden="true">' +
    escapeHtml(icon) +
    '</span>' +
    (field === 'promptMode' ? '<span class="story-home-param-kind-label">提示词</span>' : '') +
    '\n      <span data-story-planning-trigger-label>' +
    escapeHtml(formatOption(value5)) +
    '</span>\n      ' +
    renderStoryHomeParamChevron() +
    '\n    </button>\n    <div class="story-home-param-popover story-ratio-popover story-planning-popover" role="listbox" aria-label="' +
    escapeHtml(label) +
    '">\n      <strong>' +
    escapeHtml(label) +
    '</strong>\n      <div class="story-ratio-options story-planning-options' +
    (singleColumn ? ' story-planning-options--single-column' : '') +
    '">\n        ' +
    options2['map']((value6) => {
      const value7 = map['has'](value6);
      return (
        '<button type="button" class="story-ratio-option ' +
        (value6 === value5 ? 'is-selected' : '') +
        ' ' +
        (value7 ? 'is-disabled' : '') +
        '" data-story-planning-field="' +
        escapeHtml(field) +
        '" data-story-planning-option="' +
        value6 +
        '" role="option" aria-selected="' +
        (value6 === value5) +
        '" aria-disabled="' +
        value7 +
        '" ' +
        (value7 ? 'disabled' : '') +
        '>' +
        escapeHtml(formatOption(value6)) +
        '</button>'
      );
    })['join']('') +
    '\n        ' +
    (customOption?.['visible']
      ? '<label class="story-ratio-option story-episode-count-custom-editor ' +
        (customOption['selected'] ? 'is-selected' : '') +
        '" data-story-custom-episode-count role="option" aria-selected="' +
        customOption['selected'] +
        '" aria-label="自定义分集数，最多 ' +
        STORY_EPISODE_COUNT_MAX +
        ' 集">\n          <input type="number" min="1" max="' +
        STORY_EPISODE_COUNT_MAX +
        '" step="1" inputmode="numeric" autocomplete="off" data-story-custom-episode-count-input aria-label="输入自定义分集数，1 到 ' +
        STORY_EPISODE_COUNT_MAX +
        ' 集" placeholder="输入集数" value="' +
        (customOption['selected'] ? escapeHtml(value5) : '') +
        '">\n          <span>集</span>\n        </label>'
      : '') +
    '\n      </div>\n    </div>\n  </div>'
  );
}
function renderStoryStylePicker(value8, { placement: placement = 'overlay', compact: compact = false } = {}) {
  const styleId = value8['data']?.['project'] || {},
    storyStyleSelection = resolveStoryStyleSelection({
      styleId: styleId['videoStyleId'],
      stylePrompt: styleId['videoStylePrompt'],
      videoStyle: styleId['videoStyle'],
    }),
    list3 = storyStyleSelection['isCustom']
      ? storyStyleSelection['stylePrompt']
      : normalizeText(styleId['customVideoStylePrompt']),
    value9 = placement === 'below' ? ' story-style-picker--below' : '',
    value10 = compact ? ' story-home-param-picker--compact' : '';
  return (
    '<div class="story-home-param-picker story-style-picker' +
    value9 +
    value10 +
    '">\n    <button type="button" class="story-home-param-trigger story-menu-trigger story-style-trigger" data-story-home-param-trigger="style" aria-haspopup="dialog" aria-expanded="false" title="选择提示词风格">\n      ' +
    (storyStyleSelection['thumbnail']
      ? '<img data-story-style-thumbnail src="' +
        escapeHtml(storyStyleSelection['thumbnail']) +
        '" alt="" draggable="false">'
      : '<span class="story-home-param-icon story-style-custom-icon" aria-hidden="true">✦</span>') +
    '\n      <span class="story-home-param-kind-label">风格</span>\n      <span class="story-style-trigger-label">' +
    escapeHtml(storyStyleSelection['label']) +
    '</span>\n      ' +
    renderStoryHomeParamChevron() +
    '\n    </button>\n    <section class="story-home-param-popover story-style-popover" role="dialog" aria-label="风格库">\n      <div class="story-style-library" data-story-style-library>\n        <div class="story-style-header">\n          <div>\n            <strong>风格库</strong>\n            <small>为后续角色、场景、道具和分集画面统一视觉方向</small>\n          </div>\n          <label class="story-style-search">\n            <span aria-hidden="true">⌕</span>\n            <input type="search" data-story-style-search-input placeholder="搜索风格" autocomplete="off">\n          </label>\n        </div>\n        <div class="story-style-tabs" role="group" aria-label="风格分类">\n          ' +
    STORY_STYLE_CATEGORIES['map'](
      (value11) =>
        '<button type="button" class="story-style-tab ' +
        (value11['id'] === 'all' ? 'is-active' : '') +
        '" data-story-style-category="' +
        value11['id'] +
        '" role="button" aria-pressed="' +
        (value11['id'] === 'all') +
        '">' +
        value11['label'] +
        '</button>',
    )['join']('') +
    '\n        </div>\n        <div class="story-style-grid" data-story-style-grid>\n          <button type="button" class="story-style-card story-style-card--custom ' +
    (storyStyleSelection['isCustom'] ? 'is-selected' : '') +
    '" data-story-style-custom data-story-style-search="自定义风格提示词" data-story-style-card-category="custom">\n            <span class="story-style-custom-mark" aria-hidden="true">✦</span>\n            <span>自定义风格提示词</span>\n          </button>\n          ' +
    STORY_STYLE_PRESETS['map'](
      (value12) =>
        '<button type="button" class="story-style-card ' +
        (value12['id'] === storyStyleSelection['styleId'] ? 'is-selected' : '') +
        '" data-story-style-option="' +
        escapeHtml(value12['id']) +
        '" data-story-style-search="' +
        escapeHtml(value12['label']['toLowerCase']()) +
        '" data-story-style-card-category="' +
        escapeHtml(value12['category']) +
        '">\n            <img data-story-style-thumbnail src="' +
        escapeHtml(value12['thumbnail']) +
        '" alt="" loading="lazy" decoding="async" draggable="false">\n            <span>' +
        escapeHtml(value12['label']) +
        '</span>\n          </button>',
    )['join']('') +
    '\n        </div>\n        <p class="story-style-empty" data-story-style-empty hidden>没有匹配的风格</p>\n      </div>\n      <div class="story-style-custom-editor" data-story-style-custom-editor hidden>\n        <div class="story-style-custom-editor-heading">\n          <button type="button" data-story-style-custom-back aria-label="返回风格库">←</button>\n          <div>\n            <strong>自定义风格提示词</strong>\n            <small>描述画面媒介、光线、色调、质感与时代气质</small>\n          </div>\n        </div>\n        <textarea data-story-style-custom-input maxlength="' +
    STORY_CUSTOM_STYLE_MAX_CHARACTERS +
    '" placeholder="例如：真人写实，90 年代港片胶片质感，暖黄色街灯，低饱和色调">' +
    escapeHtml(list3) +
    '</textarea>\n        <div class="story-style-custom-footer">\n          <span data-story-style-custom-count>' +
    list3['length'] +
    ' / ' +
    STORY_CUSTOM_STYLE_MAX_CHARACTERS +
    '</span>\n          <button type="button" class="story-style-custom-confirm" data-story-style-custom-confirm aria-label="确认自定义风格">✓</button>\n        </div>\n      </div>\n    </section>\n  </div>'
  );
}
function renderStoryHomeEmptyIcon() {
  return '<span class="workspace-mode-icon workspace-mode-icon--story" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 3.75h8.5L19 7.25v13H7z"/><path d="M15.5 3.75v3.5H19M10 11h6M10 14.5h6M10 18h4"/></svg></span>';
}
export function renderStoryHomeModelBar(allowDeveloperModes) {
  const value13 = allowDeveloperModes['data']?.['project']?.['planning'] || {},
    value14 = normalizeStoryEpisodeCount(value13['episodeCount']),
    value15 = normalizeStoryPromptMode(value13['promptMode'], {
      allowDeveloperModes: allowDeveloperModes['developerModeAvailable'] === true,
    }),
    value16 =
      allowDeveloperModes['homeTab'] === 'collaborate'
        ? Boolean(allowDeveloperModes['idea']?.['trim']())
        : canStartStoryHomeGeneration(allowDeveloperModes),
    list4 = getStoryVideoInputTextModelOptions()['map']((value17) => value17['modelId']),
    modelId =
      allowDeveloperModes['homeTab'] === 'replication' &&
      !list4['includes'](allowDeveloperModes['models']['text'])
        ? list4[0] || allowDeveloperModes['models']['text']
        : allowDeveloperModes['models']['text'],
    value18 = getStoryReplicationLocale(
      allowDeveloperModes['hasCreatedProject'] &&
        allowDeveloperModes['data']?.['project']?.['sourceMode'] === 'video-replication'
        ? allowDeveloperModes['data']['project']['replication']?.['targetLocale']
        : allowDeveloperModes['replicationTargetLocale'],
    );
  return (
    '<div class="story-home-model-bar">\n    <div class="story-home-model-controls">\n      ' +
    renderAIGenTextModelSelectorMarkup({
      modelId: modelId,
      provider: allowDeveloperModes['textProvider'],
      providerProfileId: allowDeveloperModes['textProviderProfileId'],
      includeRunningHubInternational: true,
      getDisplayModelName: getDisplayModelName,
      className: 'story-home-text-model-selector',
      allowedModelIds: allowDeveloperModes['homeTab'] === 'replication' ? list4 : undefined,
    }) +
    '\n      ' +
    (allowDeveloperModes['homeTab'] === 'replication'
      ? renderStoryPlanningPicker({
          field: 'replicationAsrProvider',
          label: '语音识别模型',
          icon: '♫',
          value: allowDeveloperModes['replicationAsrProvider'] || 'volcengine-speech',
          options: RECORDING_ASR_MODELS['map']((value19) => value19['id']),
          singleColumn: true,
          formatOption: (value20) =>
            RECORDING_ASR_MODELS['find']((value21) => value21['id'] === value20)?.['label'] || value20,
        })
      : renderStoryStylePicker(allowDeveloperModes)) +
    '\n      ' +
    renderStoryPlanningPicker({
      field: 'promptMode',
      label: '单片段提示词模式',
      icon: '✦',
      value: value15,
      options: STORY_PROMPT_MODE_OPTIONS['map']((el2) => el2['value']),
      disabledOptions: STORY_PROMPT_MODE_OPTIONS['filter'](
        (enabled2) => !enabled2['enabled'] && !allowDeveloperModes['developerModeAvailable'],
      )['map']((el3) => el3['value']),
      formatOption: getStoryPromptModeLabel,
      singleColumn: true,
      hidden: false,
    }) +
    '\n      ' +
    renderStoryPlanningPicker({
      field: 'targetLocale',
      label: '语种与地区',
      icon: '文',
      value: value18['value'],
      options: STORY_REPLICATION_LOCALES['map']((el4) => el4['value']),
      formatOption: (value22) => getStoryReplicationLocale(value22)['shortLabel'],
      hidden: allowDeveloperModes['homeTab'] !== 'replication',
    }) +
    '\n      ' +
    renderStoryPlanningPicker({
      field: 'episodeCount',
      label: '目标分集数',
      icon: '≡',
      value: value14,
      options: allowDeveloperModes['developerModeAvailable']
        ? [...STORY_PUBLIC_EPISODE_COUNT_OPTIONS, ...STORY_DEVELOPER_EPISODE_COUNT_OPTIONS]
        : STORY_PUBLIC_EPISODE_COUNT_OPTIONS,
      customOption: {
        visible: allowDeveloperModes['developerModeAvailable'] === true,
        selected: !STORY_EPISODE_COUNT_OPTIONS['includes'](value14),
      },
      formatOption: (value23) => value23 + '集',
      singleColumn: true,
      hidden: !['generate', 'collaborate']['includes'](allowDeveloperModes['homeTab']),
    }) +
    '\n      ' +
    renderStoryScriptModeControl(allowDeveloperModes['scriptMode'], {
      hidden: !['generate', 'collaborate']['includes'](allowDeveloperModes['homeTab']),
    }) +
    '\n    </div>\n    ' +
    (['replication', 'collaborate']['includes'](allowDeveloperModes['homeTab'])
      ? ''
      : renderRequestDebugButton('data-story-action="debug-story-home"')) +
    '<button type="button" class="story-primary-button story-home-generate story-main-action-button" ' +
    (allowDeveloperModes['homeTab'] === 'collaborate'
      ? 'data-collaboration-start'
      : 'data-story-action="generate-story"') +
    ' ' +
    (value16 && !allowDeveloperModes['isGeneratingStory'] ? '' : 'disabled') +
    ' aria-busy="' +
    Boolean(allowDeveloperModes['isGeneratingStory']) +
    '">' +
    (allowDeveloperModes['isGeneratingStory'] ? renderStoryGenerationSpinner({ button: true }) : '') +
    '<span data-story-generate-label>' +
    escapeHtml(getStoryHomeGenerateButtonLabel(allowDeveloperModes)) +
    '</span>' +
    (allowDeveloperModes['isGeneratingStory']
      ? ''
      : '<span class="story-generate-arrow" aria-hidden="true">→</span>') +
    '</button>\n  </div>'
  );
}
export function renderStoryHomeProjectResults(query) {
  query = { ...query, projects: getStorySurfaceProjects(query) };
  const value24 = query['workspaceSurface'] === 'replication' ? '复刻项目' : '剧本项目',
    showArchived = query['showArchivedProjects'] === true,
    list5 = getStoryProjectHomeEntries(query['projects'], {
      query: query['projectSearchQuery'],
      sortOrder: query['projectSortOrder'],
      showArchived: showArchived,
    });
  return query['projects']['length']
    ? '<div class="story-project-grid">\n        ' +
        list5['map']((value25) =>
          renderStoryProjectCard(value25, {
            itemLabel: query['workspaceSurface'] === 'replication' ? '条视频' : '集',
            isDeleteConfirming:
              normalizeText(query['pendingDeleteProjectId']) ===
              normalizeText(value25?.['id'] || value25?.['data']?.['project']?.['id']),
            isMenuOpen:
              normalizeText(query['openProjectMenuId']) ===
              normalizeText(value25?.['id'] || value25?.['data']?.['project']?.['id']),
          }),
        )['join']('') +
        '\n        ' +
        (list5['length']
          ? ''
          : '<div class="story-project-filter-empty"><strong>' +
            (showArchived ? '没有匹配的归档项目' : '没有匹配的' + value24) +
            '</strong><span>可以尝试其他搜索词，或清空搜索条件。</span></div>') +
        '\n        ' +
        (showArchived
          ? ''
          : '<button type="button" class="story-project-create-tile" data-story-action="new-story" aria-label="新建' +
            value24 +
            '">\n          <span aria-hidden="true">+</span>\n          <strong>新建' +
            value24 +
            '</strong>\n        </button>') +
        '\n      </div>'
    : '<div class="story-project-empty">\n        <div class="story-project-empty-icon" aria-hidden="true">' +
        renderStoryHomeEmptyIcon() +
        '</div>\n        <strong>还没有' +
        value24 +
        '</strong>\n        <span>创建项目后，它会保存在当前用户项目数据中。</span>\n        <button type="button" class="story-primary-button story-project-empty-action" data-story-action="new-story">创建第一个项目</button>\n      </div>';
}
export function renderStoryHome(args) {
  args = { ...args, projects: getStorySurfaceProjects(args) };
  const value26 = {
      ...args,
      homeTab: resolveStoryVideoReplicationHomeTab(args, args['homeTab']),
    },
    value27 = args['showArchivedProjects'] === true,
    value28 = args['projects']['filter']((value29) => Number(value29?.['archivedAt'] || 0) > 0)['length'];
  return (
    '<div class="story-home-page' +
    (value26['homeTab'] === 'replication' ? ' story-home-page--replication' : '') +
    '">\n    <section class="story-home-hero">\n      <span class="story-eyebrow">SHUO Canvas · ' +
    (args['workspaceSurface'] === 'replication' ? 'Replication Studio' : 'Story Studio') +
    '</span>\n      <h1>' +
    (args['workspaceSurface'] === 'replication' ? '复刻工作室' : '从一个想法到完整的AI视频') +
    '</h1>\n      ' +
    (args['workspaceSurface'] === 'replication'
      ? ''
      : '<p class="story-home-mode-description" data-story-home-mode-description aria-live="polite">' +
        escapeHtml(getStoryHomeModeDescription(value26['homeTab'], value26['scriptIntent'])) +
        '</p>') +
    '\n      <div class="story-home-composer ' +
    (args['isGeneratingStory'] ? 'is-generating' : '') +
    '" aria-busy="' +
    (args['isGeneratingStory'] ? 'true' : 'false') +
    '">\n        ' +
    renderHomeTabs(value26) +
    '\n        <div class="story-home-composer-body">' +
    renderStoryHomeComposerBody(value26) +
    '</div>\n        ' +
    renderStoryHomeModelBar(value26) +
    '\n        <div class="story-home-generation-loading storyboard-script-loading-overlay" data-story-generation-loading role="status" aria-live="polite" ' +
    (args['isGeneratingStory'] ? '' : 'hidden') +
    '>\n          <div class="storyboard-script-loading-spinner"></div>\n          <div class="storyboard-script-loading-label" data-story-generation-loading-label>' +
    escapeHtml(args['generationStatus'] || '正在创建剧情') +
    '</div>\n          <div class="storyboard-script-loading-bar"><div class="storyboard-script-loading-bar-fill"></div></div>\n        </div>\n      </div>\n    </section>\n    <section class="story-projects-section">\n      <div class="story-section-heading">\n        <div>\n          <h2>' +
    (value27 ? '已归档项目' : args['workspaceSurface'] === 'replication' ? '我的复刻项目' : '我的剧本项目') +
    '</h2>\n        </div>\n        <div class="story-project-list-controls">\n          <button type="button" class="story-project-import-button" data-story-action="import-project">导入项目</button>\n          <label class="story-project-search">\n            <span aria-hidden="true">⌕</span>\n            <input type="search" data-story-project-search value="' +
    escapeHtml(args['projectSearchQuery'] || '') +
    '" placeholder="搜索项目名称" autocomplete="off" aria-label="搜索' +
    (args['workspaceSurface'] === 'replication' ? '复刻项目' : '剧本项目') +
    '">\n          </label>\n          ' +
    renderStoryProjectSortControl(args['projectSortOrder']) +
    '\n          <button type="button" class="story-project-archive-toggle ' +
    (value27 ? 'is-active' : '') +
    '" data-story-action="toggle-archived-projects" aria-pressed="' +
    value27 +
    '">' +
    (value27 ? '返回项目' : '已归档 ' + value28) +
    '</button>\n        </div>\n      </div>\n      ' +
    renderStoryHomeProjectResults(args) +
    '\n    </section>\n  </div>'
  );
}
export function renderStoryProjectSortControl(value30 = 'updated-desc') {
  return renderWorkspaceProjectSortControl(value30);
}
export function getStoryProjectTypeLabel(options3 = {}) {
  const text4 = normalizeText(options3?.['data']?.['project']?.['sourceMode']);
  if (text4 === 'upload-original') return '个人剧本';
  if (text4 === 'upload-rewrite') return 'AI改写';
  if (text4 === 'video-replication') return '复刻视频';
  return 'AI剧本';
}
export function renderStoryProjectCard(
  value31,
  {
    isDeleteConfirming: isDeleteConfirming = false,
    isMenuOpen: isMenuOpen = false,
    fallbackTitle: fallbackTitle = '未命名故事',
    itemCount: itemCount = null,
    itemLabel: itemLabel = '集',
    coverImageUrls: coverImageUrls = null,
    emptyCoverLabel: emptyCoverLabel = '剧本项目',
    coverAltPrefix: coverAltPrefix = '项目角色封面',
  } = {},
) {
  const value32 = Array['isArray'](value31?.['data']?.['episodes'])
      ? value31['data']['episodes']['length']
      : 0,
    itemCount2 =
      itemCount !== null && itemCount !== undefined && Number['isFinite'](Number(itemCount))
        ? Math['max'](0, Math['trunc'](Number(itemCount)))
        : value32,
    taskSummary = getStoryBackgroundTaskSummary(value31?.['data']);
  return renderWorkspaceProjectCard(value31, {
    isDeleteConfirming: isDeleteConfirming,
    isMenuOpen: isMenuOpen,
    fallbackTitle: fallbackTitle,
    itemCount: itemCount2,
    itemLabel: itemLabel,
    coverImageUrls: resolveStoryProjectCoverImageUrls(value31, coverImageUrls),
    emptyCoverLabel: emptyCoverLabel,
    coverAltPrefix: coverAltPrefix,
    projectTypeLabel: getStoryProjectTypeLabel(value31),
    taskSummary: taskSummary,
  });
}
function resolveStoryProjectCoverImageUrls(value33, value34 = null) {
  return (
    Array['isArray'](value34)
      ? value34
      : (Array['isArray'](value33?.['data']?.['assets']) ? value33['data']['assets'] : [])
          ['filter']((value35) => value35?.['kind'] === 'character')
          ['flatMap']((value36) => getStoryAssetAppearances(value36))
          ['map']((value37) => value37?.['imageUrl'])
  )
    ['map'](normalizeText)
    ['filter']((value38, value39, list6) => value38 && list6['indexOf'](value38) === value39)
    ['slice'](0, 3);
}

export const STORY_REPLICATION_PROMPT_MODE_HINT='按你准备用于生成视频的模型选择。格式决定提示词结构和每段时长上限；生成或重新生成分镜时生效，切换不会修改已有提示词和视频，无需重新分析原片。';
export function renderStoryPromptModePicker(value12,{field:field='promptMode',value:value=getStoryHomePromptMode(value12),busy:busy=false,hint:hint='',label:label="单片段提示词模式",triggerLabel:triggerLabel=''}={}){const run=value13=>isStoryPromptModeSelectable(value13,{'allowDeveloperModes':value12["developerModeAvailable"]===true});return renderStoryPlanningPicker({'field':field,'label':label,'triggerLabel':triggerLabel,'value':value,'hint':hint,'iconMarkup':"<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 3h8l4 4v14H6z\"/><path d=\"M14 3v4h4M9 11h6M9 15h6M9 18h3\"/></svg>",'options':STORY_PROMPT_MODE_OPTIONS["map"](value14=>value14["value"]),'disabledOptions':STORY_PROMPT_MODE_OPTIONS["filter"](value15=>busy||!run(value15["value"]))["map"](value16=>value16["value"]),'disabledOptionHints':Object["fromEntries"](STORY_PROMPT_MODE_OPTIONS['filter'](value17=>!run(value17["value"]))["map"](value18=>[value18["value"],"开启开发者模式后可选"])),'formatOption':getStoryPromptModeLabel,'singleColumn':true});}
