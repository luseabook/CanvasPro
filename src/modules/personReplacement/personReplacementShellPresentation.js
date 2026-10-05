import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  getWorkspaceProjectHomeEntries,
  renderWorkspaceProjectCard,
  renderWorkspaceProjectSortControl,
} from '../workspaceProjectHome.js';
import { SMART_CLIP_FPS_OPTIONS } from '../../services/smartClipJobService.js';
import { t } from '../../i18n/index.js';
import { getPersonReplacementCharacterBaseImageRef } from './personReplacementProject.js';
import {
  getPersonReplacementProjectTaskSummary,
  isPersonReplacementSourceProcessing,
} from './personReplacementProjectSession.js';
import {
  PERSON_REPLACEMENT_STEPS,
  getPersonReplacementStepCompletion,
  getPersonReplacementStepGate,
} from './personReplacementWorkflow.js';
import { REPLACEMENT_STUDIO_NAME } from './replacementStudioTerminology.js';
import { reconcileElementTree } from './personReplacementShotSelectionRendering.js';
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
function clamp(data, options, target, source = options) {
  const next = Number(data);
  if (!Number['isFinite'](next)) return source;
  return Math['max'](options, Math['min'](target, next));
}
function renderVideoIcon() {
  return '<svg class="person-replacement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="3"/><path d="m17 10 4-2v8l-4-2"/></svg>';
}
function smartClipPanelText(current, entry = {}) {
  return t('videoClip.smartPanel.' + current, entry);
}
function renderSmartClipSettingLabel(record, payload) {
  return (
    '<span class="person-replacement-smart-clip-setting-label">' +
    escapeHtml(record) +
    '<span class="rh-tip" data-tooltip="' +
    escapeHtml(payload) +
    '" aria-label="' +
    escapeHtml(payload) +
    '">!</span></span>'
  );
}
function renderSmartClipModeOptions(handle) {
  const list = [
    ['stable', smartClipPanelText('modeStable')],
    ['balanced', smartClipPanelText('modeBalanced')],
    ['sensitive', smartClipPanelText('modeSensitive')],
  ];
  return list['map'](
    ([state, config]) =>
      '<button type="button" class="person-replacement-smart-clip-option ' +
      (handle === state ? 'is-active' : '') +
      '" data-person-replacement-action="set-smart-clip-mode" data-smart-clip-mode="' +
      state +
      '" aria-pressed="' +
      (handle === state) +
      '">' +
      escapeHtml(config) +
      '</button>',
  )['join']('');
}
function renderSmartClipSettingsPanel(scope) {
  const input = scope['settings']['smartClipMode'],
    output = scope['settings']['smartClipFps'];
  return (
    '<div class="person-replacement-smart-clip-settings-panel" role="dialog" aria-label="' +
    escapeHtml(smartClipPanelText('title')) +
    '">\n    <strong class="person-replacement-smart-clip-settings-title">' +
    escapeHtml(smartClipPanelText('title')) +
    '</strong>\n    <div class="person-replacement-smart-clip-setting-row">\n      ' +
    renderSmartClipSettingLabel(smartClipPanelText('mode'), smartClipPanelText('modeTip')) +
    '\n      <div class="person-replacement-smart-clip-option-group" role="group" aria-label="' +
    escapeHtml(smartClipPanelText('mode')) +
    '">\n        ' +
    renderSmartClipModeOptions(input) +
    '\n      </div>\n    </div>\n    <div class="person-replacement-smart-clip-setting-row">\n      ' +
    renderSmartClipSettingLabel(smartClipPanelText('fps'), smartClipPanelText('fpsTip')) +
    '\n      <div class="person-replacement-smart-clip-option-group" role="group" aria-label="' +
    escapeHtml(smartClipPanelText('fps')) +
    '">\n        ' +
    SMART_CLIP_FPS_OPTIONS['map'](
      (fps) =>
        '<button type="button" class="person-replacement-smart-clip-option person-replacement-smart-clip-fps-option ' +
        (output === fps ? 'is-active' : '') +
        '" data-person-replacement-action="set-smart-clip-fps" data-smart-clip-fps="' +
        fps +
        '" aria-pressed="' +
        (output === fps) +
        '">' +
        escapeHtml(smartClipPanelText('fpsValue', { fps: fps })) +
        '</button>',
    )['join']('') +
    '\n      </div>\n    </div>\n    <p class="person-replacement-smart-clip-settings-hint">' +
    escapeHtml(smartClipPanelText('hintDefault')) +
    '</p>\n  </div>'
  );
}
function renderSmartClipSettings(value2) {
  const value3 = value2['workspace']['smartClipSettingsOpen'] === !![];
  return (
    '<div class="person-replacement-smart-clip-settings" data-person-replacement-smart-clip-settings>\n    <button type="button" class="story-secondary-button person-replacement-settings-trigger ' +
    (value3 ? 'is-active' : '') +
    '" data-person-replacement-action="toggle-smart-clip-settings" aria-haspopup="dialog" aria-expanded="' +
    value3 +
    '">设置</button>\n    ' +
    (value3 ? renderSmartClipSettingsPanel(value2) : '') +
    '\n  </div>'
  );
}
function renderStepNavigation(value4) {
  const personReplacementStepCompletion = getPersonReplacementStepCompletion(value4);
  return (
    '<nav class="story-step-navigation person-replacement-story-steps" data-active-step="' +
    value4['workspace']['step'] +
    '" aria-label="人物替换流程">\n    ' +
    PERSON_REPLACEMENT_STEPS['map']((value5) => {
      const error = getPersonReplacementStepGate(value4, value5['id'], personReplacementStepCompletion),
        value6 = [
          'story-step',
          value4['workspace']['step'] === value5['id'] ? 'is-active' : '',
          error['allowed'] ? '' : 'is-locked',
        ]
          ['filter'](Boolean)
          ['join'](' ');
      return (
        '<button type="button" class="' +
        value6 +
        '" data-person-replacement-action="select-step" data-person-replacement-step="' +
        value5['id'] +
        '" aria-current="' +
        (value4['workspace']['step'] === value5['id'] ? 'step' : 'false') +
        '" aria-keyshortcuts="' +
        value5['id'] +
        '" aria-disabled="' +
        !error['allowed'] +
        '"' +
        (error['allowed'] ? '' : ' title="' + escapeHtml(error['message']) + '"') +
        '><span>' +
        value5['id'] +
        '</span>' +
        escapeHtml(value5['label']) +
        '</button>'
      );
    })['join']('') +
    '\n  </nav>'
  );
}
function getStepGuidance(value7, handler) {
  const count = Math['trunc'](clamp(value7['workspace']?.['step'], 1, 5, 1)),
    personReplacementStepCompletion2 = getPersonReplacementStepCompletion(value7),
    value8 = (Array['isArray'](value7['characters']) ? value7['characters'] : [])['filter']((value9) =>
      getPersonReplacementCharacterBaseImageRef(value9),
    )['length'],
    value10 = (Array['isArray'](value7['scenes']) ? value7['scenes'] : [])['filter']((value11) =>
      getPersonReplacementCharacterBaseImageRef(value11),
    )['length'],
    value12 = value8 + value10,
    list2 = Array['isArray'](value7['shots']) ? value7['shots'] : [],
    count2 = list2['filter']((value13) => normalizeText(value13?.['resultVideoRef']))['length'],
    count3 = Math['max'](0, Math['trunc'](Number(handler(value7)) || 0)),
    value14 = Boolean(normalizeText(value7['audio']?.['replacementAudioRef'])),
    value15 = Boolean(
      value7['output']?.['originalMasterRef'] &&
      (value7['output']?.['finalVideoRef'] || value7['output']?.['visualMasterRef']),
    ),
    enabled = value7['output']?.['composeStatus'] === 'succeeded' && value15,
    value16 = value15 && !enabled;
  if (count === 1)
    return personReplacementStepCompletion2['assetSettingsComplete']
      ? { title: '替换素材已应用', detail: '已应用 ' + value12 + ' 个替换素材，可以继续进入图像替换' }
      : { title: '请添加人物或场景素材', detail: '至少添加 1 个人物或场景素材，才能进入图像替换' };
  if (count === 2)
    return personReplacementStepCompletion2['imageReplacementComplete']
      ? { title: '图像替换输入已应用', detail: '可以继续生成替换图，或进入视频替换' }
      : { title: '请绑定替换人物或场景', detail: '可先进入视频替换；添加人物或场景绑定后才能继续声音克隆' };
  if (count === 3) {
    if (!personReplacementStepCompletion2['imageReplacementComplete'])
      return { title: '请绑定替换人物或场景', detail: '至少绑定 1 个人物或场景，才能进入声音克隆' };
    if (count2 > 0)
      return {
        title: '替换视频已生成',
        detail: '已生成 ' + count2 + '/' + list2['length'] + ' 个片段，可以继续进入声音克隆',
      };
    return { title: '视频替换已就绪', detail: '可以生成替换视频，也可以继续进入声音克隆' };
  }
  if (count === 4) {
    if (value14) return { title: '替换音轨已应用', detail: '可以继续进入合成视频，检查并生成最终视频' };
    if (count3 > 0)
      return {
        title: '声音参考已应用',
        detail: '已应用 ' + count3 + ' 个声音参考，可以继续克隆声音或进入合成视频',
      };
    return { title: '可添加声音参考', detail: '上传人物声音参考后可克隆音轨，也可以直接进入合成视频' };
  }
  if (value16)
    return { title: '旧合成视频仍可查看', detail: '图像或片段已更新，重新生成对应替换视频后再合成' };
  if (enabled) return { title: '完整画面已就绪', detail: '可以切换原声或替换声预览，导出时再封装当前音轨' };
  if (count2 > 0)
    return {
      title: '替换片段可以合成',
      detail: '已有 ' + count2 + '/' + list2['length'] + ' 个片段可用于合成',
    };
  return { title: '请先生成替换视频', detail: '返回视频替换生成至少一个片段后，即可创建合成预览' };
}
function getCurrentCanvasSyncMenuCopy(value17) {
  const value18 = Math['trunc'](Number(value17) || 1),
    value19 = {
      1: ['同步素材设定到画布', '同步当前人物素材与分组'],
      2: ['同步图像替换到画布', '同步当前关键帧、素材、提示词与替换结果图'],
      3: ['同步视频替换到画布', '同步当前原视频、替换图与替换视频'],
      4: ['同步声音克隆到画布', '同步当前原音频、参考音频与替换音频'],
      5: ['同步所有片段到画布', '按镜头顺序同步已有的替换视频片段'],
    },
    [label, detail] = value19[value18] || value19[5];
  return { label: label, detail: detail };
}
function renderProjectToolbarActions(value20, value21 = {}) {
  const value22 = value20['workspace']['step'] === 5,
    currentCanvasSyncMenuCopy = getCurrentCanvasSyncMenuCopy(value20['workspace']['step']),
    value23 = value21['canvasSyncPending'] === !![],
    value24 = value21['exportOutputPending'] === !![],
    value25 =
      '<div class="story-canvas-sync-menu-wrap' +
      (value23 ? ' is-loading' : '') +
      '" data-person-replacement-output-menu="canvas" data-person-replacement-canvas-sync-pending="' +
      value23 +
      '">\n    <button type="button" class="story-workbench-action-button story-canvas-sync-trigger story-menu-trigger' +
      (value23 ? ' is-loading' : '') +
      '" data-person-replacement-action="toggle-output-menu" data-person-replacement-output-menu-trigger="canvas" aria-haspopup="menu" aria-expanded="false" aria-busy="' +
      value23 +
      '"' +
      (value23 ? ' disabled' : '') +
      '>\n      ' +
      (value23
        ? '<span class="storyboard-script-loading-spinner person-replacement-canvas-sync-spinner" aria-hidden="true"></span>'
        : '') +
      '<span>' +
      (value23 ? '加入中…' : '加入画布') +
      '</span>' +
      (value23 ? '' : '<span class="story-canvas-sync-chevron" aria-hidden="true"></span>') +
      '\n    </button>\n    <div class="story-canvas-sync-menu" role="menu" aria-label="同步人物替换项目到画布" aria-hidden="true">\n      <button type="button" class="story-canvas-sync-option" data-person-replacement-output-menu-item data-person-replacement-action="sync-all-clips-to-canvas" role="menuitem"' +
      (value23 ? ' aria-disabled="true" disabled' : '') +
      '>\n        <strong>' +
      currentCanvasSyncMenuCopy['label'] +
      '</strong><small>' +
      currentCanvasSyncMenuCopy['detail'] +
      '</small>\n      </button>\n      <button type="button" class="story-canvas-sync-option" data-person-replacement-output-menu-item data-person-replacement-action="sync-project-to-canvas" role="menuitem"' +
      (value23 ? ' aria-disabled="true" disabled' : '') +
      '>\n        <strong>同步整个项目到画布</strong><small>按当前进度同步素材、图像、视频、音频与合成节点</small>\n      </button>\n    </div>\n  </div>',
    value26 = value22
      ? '<div class="story-canvas-sync-menu-wrap story-clip-export-menu-wrap' +
        (value24 ? ' is-loading' : '') +
        '" data-person-replacement-output-menu="export" data-person-replacement-export-pending="' +
        value24 +
        '">\n      <button type="button" class="story-workbench-action-button story-canvas-sync-trigger story-menu-trigger' +
        (value24 ? ' is-loading' : '') +
        '" data-person-replacement-action="toggle-output-menu" data-person-replacement-output-menu-trigger="export" aria-haspopup="menu" aria-expanded="false" aria-busy="' +
        value24 +
        '"' +
        (value24 ? ' disabled' : '') +
        '>\n        ' +
        (value24
          ? '<span class="storyboard-script-loading-spinner person-replacement-export-spinner" aria-hidden="true"></span>'
          : '') +
        '<span>' +
        (value24 ? '导出中…' : '导出') +
        '</span>' +
        (value24 ? '' : '<span class="story-canvas-sync-chevron" aria-hidden="true"></span>') +
        '\n      </button>\n      <div class="story-canvas-sync-menu story-clip-export-menu" role="menu" aria-label="导出人物替换结果" aria-hidden="true">\n        <div class="person-replacement-export-menu-group" data-person-replacement-export-group>\n          <button type="button" class="story-canvas-sync-option person-replacement-export-menu-group-trigger" data-person-replacement-output-menu-item data-person-replacement-export-submenu-trigger="video" role="menuitem" aria-haspopup="menu" aria-expanded="false"' +
        (value24 ? ' aria-disabled="true" disabled' : '') +
        '>\n            <span><strong>导出视频</strong><small>导出成片或全部替换素材</small></span><i aria-hidden="true"></i>\n          </button>\n          <div class="person-replacement-export-submenu" data-person-replacement-export-submenu="video" role="menu" aria-label="导出视频" aria-hidden="true">\n            <button type="button" class="story-canvas-sync-option" data-person-replacement-action="export-final-video" role="menuitem"' +
        (value24 ? ' aria-disabled="true" disabled' : '') +
        '>\n              <strong>完整视频（当前音轨）</strong><small>将完整替换画面与下方选择的音轨封装后导出</small>\n            </button>\n            <button type="button" class="story-canvas-sync-option" data-person-replacement-action="export-all-clips-and-images" role="menuitem"' +
        (value24 ? ' aria-disabled="true" disabled' : '') +
        '>\n              <strong>所有替换结果</strong><small>导出替换视频、替换音频及对应替换图</small>\n            </button>\n          </div>\n        </div>\n        <div class="person-replacement-export-menu-group" data-person-replacement-export-group>\n          <button type="button" class="story-canvas-sync-option person-replacement-export-menu-group-trigger" data-person-replacement-output-menu-item data-person-replacement-export-submenu-trigger="project" role="menuitem" aria-haspopup="menu" aria-expanded="false"' +
        (value24 ? ' aria-disabled="true" disabled' : '') +
        '>\n            <span><strong>导出项目</strong><small>导出到剪辑软件继续处理</small></span><i aria-hidden="true"></i>\n          </button>\n          <div class="person-replacement-export-submenu" data-person-replacement-export-submenu="project" role="menu" aria-label="导出项目" aria-hidden="true">\n            <button type="button" class="story-canvas-sync-option" data-person-replacement-action="export-premiere-xml" role="menuitem"' +
        (value24 ? ' aria-disabled="true" disabled' : '') +
        '>\n              <strong>Premiere XML</strong><small>原片与替换片段、对应音频分四轨，包含素材</small>\n            </button>\n            <button type="button" class="story-canvas-sync-option" data-person-replacement-action="export-jianying-draft" role="menuitem"' +
        (value24 ? ' aria-disabled="true" disabled' : '') +
        '>\n              <strong>剪映草稿</strong><small>保留完整替换片段和轨道空位，包含素材</small>\n            </button>\n          </div>\n        </div>\n      </div>\n    </div>'
      : '';
  return (
    '<div class="person-replacement-toolbar-actions' +
    (value22 ? ' person-replacement-preview-actions person-replacement-preview-actions--toolbar' : '') +
    '">' +
    value25 +
    value26 +
    '</div>'
  );
}
function renderHeader(value27, value28 = {}) {
  return (
    '<header class="story-workspace-toolbar"' +
    (value28['canvasSyncPending'] === !![] ? ' aria-hidden="true" inert' : '') +
    '>\n    <div class="story-project-toolbar person-replacement-story-toolbar">\n      <button type="button" class="story-toolbar-back" data-person-replacement-action="back-home" aria-label="返回人物替换项目"><span class="story-toolbar-back-icon" aria-hidden="true"></span><span>人物替换项目</span></button>\n      ' +
    renderStepNavigation(value27) +
    '\n      <div class="person-replacement-toolbar-side">' +
    renderProjectToolbarActions(value27, value28) +
    '</div>\n    </div>\n  </header>'
  );
}
function renderSourceQueue(enabled2) {
  if (!enabled2['sources']['length']) return '';
  return (
    '<div class="person-replacement-import-queue workspace-video-import-grid">\n    ' +
    enabled2['sources']
      ['map']((value29, value30) => {
        const value31 =
            value29['processingStatus'] === 'uploading'
              ? '正在上传'
              : value29['processingStatus'] === 'failed'
                ? '上传失败'
                : '已加入',
          mediaUrl = normalizeMediaUrl(value29['thumbnailRef']),
          text2 = normalizeText(enabled2['sourcePreviewRefs']?.[value29['id']]),
          mediaUrl2 = normalizeMediaUrl(text2 || value29['videoRef']),
          value32 = value29['fileName'] || '视频 ' + (value30 + 1);
        return (
          '<article class="person-replacement-import-item workspace-video-import-item" data-person-replacement-import-source="' +
          escapeHtml(value29['id']) +
          '">\n        <div class="person-replacement-import-thumbnail workspace-video-import-thumbnail">\n          ' +
          (mediaUrl
            ? '<img src="' +
              escapeHtml(mediaUrl) +
              '" alt="' +
              escapeHtml(value32) +
              ' 视频封面" draggable="false">'
            : mediaUrl2
              ? '<video src="' +
                escapeHtml(mediaUrl2) +
                '" preload="' +
                (text2 ? 'auto' : 'metadata') +
                '" muted playsinline aria-label="' +
                escapeHtml(value32) +
                ' 视频缩略图" draggable="false"></video>'
              : '<span class="workspace-video-import-placeholder">' + renderVideoIcon() + '</span>') +
          '\n          <span class="person-replacement-import-status workspace-video-import-status">' +
          escapeHtml(value31) +
          '</span>\n          <button type="button" class="person-replacement-import-remove workspace-video-import-remove" data-person-replacement-action="remove-source" data-source-id="' +
          escapeHtml(value29['id']) +
          '" aria-label="删除 ' +
          escapeHtml(value32) +
          '">×</button>\n        </div>\n        <div class="person-replacement-import-copy workspace-video-import-copy"><strong>' +
          escapeHtml(value32) +
          '</strong></div>\n      </article>'
        );
      })
      ['join']('') +
    '\n  </div>'
  );
}
function normalizeProjectTimestamp(value33) {
  const count4 = Number(value33);
  if (Number['isFinite'](count4) && count4 > 0) return count4;
  const value34 = Date['parse'](value33 || '');
  return Number['isFinite'](value34) ? value34 : 0;
}
function buildPersonProjectHomeEntry(personReplacementProject = {}) {
  const id = normalizeText(personReplacementProject['id']),
    episodes = Array['isArray'](personReplacementProject['shots']) ? personReplacementProject['shots'] : [];
  return {
    id: id,
    title: normalizeText(personReplacementProject['title'], '未命名人物替换项目'),
    createdAt: normalizeProjectTimestamp(personReplacementProject['createdAt']),
    updatedAt: normalizeProjectTimestamp(personReplacementProject['updatedAt']),
    archivedAt: normalizeProjectTimestamp(personReplacementProject['archivedAt']),
    data: {
      project: { id: id, title: normalizeText(personReplacementProject['title'], '未命名人物替换项目') },
      episodes: episodes,
    },
    personReplacementProject: personReplacementProject,
  };
}
function getPersonProjectCoverImageUrls(options2 = {}) {
  return (Array['isArray'](options2['shots']) ? options2['shots'] : [])
    ['flatMap']((value35) => [value35?.['replacementImageRef'], value35?.['keyframeRef']])
    ['map'](normalizeMediaUrl)
    ['filter']((value36, value37, list3) => value36 && list3['indexOf'](value36) === value37)
    ['slice'](0, 3);
}
function getHomeProjectPresentation(query) {
  const list4 = Array['isArray'](query['libraryProjects']) ? query['libraryProjects'] : [],
    projectEntries = list4['map'](buildPersonProjectHomeEntry)['filter']((value38) => value38['id']),
    showArchived = query['workspace']['showArchivedProjects'] === !![],
    archivedProjectCount = projectEntries['filter']((value39) => value39['archivedAt'] > 0)['length'],
    visibleProjects = getWorkspaceProjectHomeEntries(projectEntries, {
      query: query['workspace']['projectSearchQuery'],
      sortOrder: query['workspace']['projectSortOrder'],
      showArchived: showArchived,
    });
  return {
    archivedProjectCount: archivedProjectCount,
    projectEntries: projectEntries,
    showArchivedProjects: showArchived,
    visibleProjects: visibleProjects,
  };
}
function renderHomeProjectResults(
  isDeleteConfirming,
  homeProjectPresentation = getHomeProjectPresentation(isDeleteConfirming),
) {
  const {
    projectEntries: projectEntries2,
    showArchivedProjects: showArchivedProjects,
    visibleProjects: visibleProjects2,
  } = homeProjectPresentation;
  return projectEntries2['length']
    ? '<div class="story-project-grid">\n      ' +
        visibleProjects2['map']((itemCount) =>
          renderWorkspaceProjectCard(itemCount, {
            isDeleteConfirming: isDeleteConfirming['workspace']['pendingDeleteProjectId'] === itemCount['id'],
            isMenuOpen: isDeleteConfirming['workspace']['openProjectMenuId'] === itemCount['id'],
            fallbackTitle: '未命名人物替换项目',
            itemCount: itemCount['personReplacementProject']?.['shots']?.['length'] || 0,
            itemLabel: '个片段',
            coverImageUrls: getPersonProjectCoverImageUrls(itemCount['personReplacementProject']),
            emptyCoverLabel: '人物替换项目',
            coverAltPrefix: '人物替换项目封面',
            taskSummary: getPersonReplacementProjectTaskSummary(itemCount['personReplacementProject']),
          }),
        )['join']('') +
        '\n      ' +
        (visibleProjects2['length']
          ? ''
          : '<div class="story-project-filter-empty"><strong>' +
            (showArchivedProjects ? '没有匹配的归档项目' : '没有匹配的人物替换项目') +
            '</strong><span>可以尝试其他搜索词，或清空搜索条件。</span></div>') +
        '\n      ' +
        (showArchivedProjects
          ? ''
          : '<button type="button" class="story-project-create-tile" data-person-replacement-action="choose-source-videos" aria-label="新建人物替换项目"><span aria-hidden="true">+</span><strong>新建人物替换项目</strong></button>') +
        '\n    </div>'
    : '<div class="story-project-empty">\n      <strong>还没有人物替换项目</strong>\n      <span>加入视频并开始处理后，项目会保存在当前用户项目数据中。</span>\n      <button type="button" class="story-primary-button story-project-empty-action" data-person-replacement-action="choose-source-videos">创建第一个项目</button>\n    </div>';
}
function renderHome(value40) {
  const homeProjectPresentation2 = getHomeProjectPresentation(value40),
    { archivedProjectCount: archivedProjectCount2, showArchivedProjects: showArchivedProjects2 } =
      homeProjectPresentation2,
    isPersonReplacementSourceProcessing2 = isPersonReplacementSourceProcessing(value40),
    value41 =
      !isPersonReplacementSourceProcessing2 &&
      value40['sources']['some']((value42) => normalizeText(value42['videoRef'])),
    value43 = isPersonReplacementSourceProcessing2 ? '' : renderSourceQueue(value40),
    value44 = isPersonReplacementSourceProcessing2 ? ' disabled' : '';
  return (
    '<main class="story-home-page" data-person-replacement-home-project="' +
    escapeHtml(value40['id']) +
    '">\n    <section class="story-home-hero">\n      <span class="story-eyebrow">SHUO Canvas · ' +
    REPLACEMENT_STUDIO_NAME +
    '</span>\n      <h1>完整替换视频中的人物与声音</h1>\n      <div class="story-home-composer">\n        <div class="story-home-composer-body">\n          <div class="story-home-composer-panel story-upload-drop workspace-video-import-panel person-replacement-video-drop ' +
    (value43 ? 'has-sources' : '') +
    '" data-person-replacement-video-drop>\n            ' +
    (value43 ||
      '<strong>导入原始视频</strong>\n            <p>可一次选择或拖入一个或多个视频，单个视频最大支持 300 MB。</p>\n            <div class="story-upload-actions"><button type="button" class="story-secondary-button" data-person-replacement-action="choose-source-videos"' +
        value44 +
        '>选择视频</button></div>') +
    '\n          </div>\n        </div>\n        <div class="story-home-model-bar">\n          <div class="story-home-model-controls person-replacement-home-source-controls">\n            <button type="button" class="story-secondary-button" data-person-replacement-action="choose-source-videos"' +
    value44 +
    '>加入视频</button>\n            <span class="person-replacement-home-flow-hint">处理时切分镜头并抽帧检测；跳过时保留整段视频并抽帧检测。</span>\n          </div>\n          <div class="person-replacement-home-process-actions">\n            <button type="button" class="story-secondary-button" data-person-replacement-action="process-sources" data-processing-mode="skip" ' +
    (value41 ? '' : 'disabled') +
    '>跳过处理</button>\n            ' +
    renderSmartClipSettings(value40) +
    '\n            <button type="button" class="story-primary-button story-home-generate" data-person-replacement-action="process-sources" data-processing-mode="cut" ' +
    (value41 ? '' : 'disabled') +
    '><span>开始处理</span><span class="story-generate-arrow" aria-hidden="true">→</span></button>\n          </div>\n        </div>\n      </div>\n    </section>\n    <section class="story-projects-section">\n      <div class="story-section-heading">\n        <div><h2>' +
    (showArchivedProjects2 ? '已归档项目' : '我的人物替换项目') +
    '</h2></div>\n        <div class="story-project-list-controls">\n          <button type="button" class="story-project-import-button" data-story-action="import-project" data-person-replacement-action="import-project">导入项目</button>\n          <label class="story-project-search"><span aria-hidden="true">⌕</span><input type="search" data-story-project-search value="' +
    escapeHtml(value40['workspace']['projectSearchQuery'] || '') +
    '" placeholder="搜索项目名称" autocomplete="off" aria-label="搜索人物替换项目"></label>\n          ' +
    renderWorkspaceProjectSortControl(value40['workspace']['projectSortOrder']) +
    '\n          <button type="button" class="story-project-archive-toggle ' +
    (showArchivedProjects2 ? 'is-active' : '') +
    '" data-story-action="toggle-archived-projects" aria-pressed="' +
    showArchivedProjects2 +
    '">' +
    (showArchivedProjects2 ? '返回项目' : '已归档 ' + archivedProjectCount2) +
    '</button>\n        </div>\n      </div>\n      ' +
    renderHomeProjectResults(value40, homeProjectPresentation2) +
    '\n    </section>\n  </main>'
  );
}
function syncHome(el, value45) {
  const el2 = el?.['querySelector']?.('[data-person-replacement-home-project]');
  if (
    value45['workspace']['view'] !== 'home' ||
    !el2 ||
    el2['dataset']['personReplacementHomeProject'] !== String(value45['id'])
  )
    return ![];
  const el3 = el2['ownerDocument']['createElement']('template');
  return (
    (el3['innerHTML'] = renderHome(value45)),
    reconcileElementTree(el2, el3['content']['firstElementChild'], { preserveChildNodes: !![] })
  );
}
function renderStepFooter(
  value46,
  value47,
  { nextLabel: nextLabel = '下一步', hidePrevious: hidePrevious = ![] } = {},
) {
  const error2 = getPersonReplacementStepGate(value46, value46['workspace']['step'] + 1),
    value48 = value46['workspace']['step'] < PERSON_REPLACEMENT_STEPS['length'] && !error2['allowed'],
    isPersonReplacementSourceProcessing3 = isPersonReplacementSourceProcessing(value46),
    value49 = value48 || isPersonReplacementSourceProcessing3,
    stepGuidance = getStepGuidance(value46, value47);
  return (
    '<footer class="story-page-footer person-replacement-step-footer">\n    <div><strong data-person-replacement-guidance-role="footer-title">' +
    escapeHtml(stepGuidance['title']) +
    '</strong><small data-person-replacement-guidance-role="footer-detail">' +
    escapeHtml(stepGuidance['detail']) +
    '</small></div>\n    <div class="story-page-footer-actions">\n      ' +
    (hidePrevious
      ? ''
      : '<button type="button" class="story-secondary-button button-press-feedback" data-person-replacement-action="previous-step"><span>上一步</span></button>') +
    '\n      <button type="button" class="story-next-button' +
    (isPersonReplacementSourceProcessing3 ? ' is-processing' : value48 ? ' is-locked' : '') +
    '" data-person-replacement-action="next-step" aria-disabled="' +
    value49 +
    '" aria-busy="' +
    isPersonReplacementSourceProcessing3 +
    '"' +
    (value49
      ? ' title="' +
        escapeHtml(isPersonReplacementSourceProcessing3 ? '视频处理中，请稍候' : error2['message']) +
        '"'
      : '') +
    '><span>' +
    escapeHtml(nextLabel) +
    '</span><span class="story-next-arrow" data-person-replacement-next-indicator="arrow" aria-hidden="true"' +
    (isPersonReplacementSourceProcessing3 ? ' hidden' : '') +
    '>→</span><span class="storyboard-script-loading-spinner person-replacement-step-next-spinner" data-person-replacement-next-indicator="spinner" aria-hidden="true"' +
    (isPersonReplacementSourceProcessing3 ? '' : ' hidden') +
    '></span></button>\n    </div>\n  </footer>'
  );
}
function renderCanvasSyncLoadingOverlay(options3 = {}) {
  if (options3['canvasSyncPending'] !== !![]) return '';
  return '<div class="person-replacement-canvas-sync-loading storyboard-script-loading-overlay" data-person-replacement-canvas-sync-loading role="status" aria-live="polite" aria-label="正在加入画布" tabindex="-1">\n    <span class="storyboard-script-loading-spinner person-replacement-canvas-sync-spinner person-replacement-canvas-sync-overlay-spinner" aria-hidden="true"></span>\n    <strong class="storyboard-script-loading-label">正在加入画布</strong>\n    <small>同步完成后将自动跳转到画布</small>\n  </div>';
}
function createProjectTaskStatusElement(
  value50,
  el4,
  { className: className, dataAttribute: dataAttribute } = {},
) {
  const el5 = value50?.['ownerDocument'];
  if (!el5?.['createElement'] || !el4?.['appendChild']) return null;
  const el6 = el5['createElement']('span');
  return (
    (el6['className'] = className),
    el6['setAttribute'](dataAttribute, ''),
    el4['appendChild'](el6),
    el6
  );
}
function syncStatus(el7, value51, value52) {
  if (!el7) return;
  const isPersonReplacementSourceProcessing4 = isPersonReplacementSourceProcessing(value51),
    stepGuidance2 = getStepGuidance(value51, value52),
    el8 = el7['querySelector']?.('[data-person-replacement-guidance-role="footer-title"]'),
    el9 = el7['querySelector']?.('[data-person-replacement-guidance-role="footer-detail"]');
  if (el8) el8['textContent'] = stepGuidance2['title'];
  if (el9) el9['textContent'] = stepGuidance2['detail'];
  const el10 = el7['querySelector']?.('[data-person-replacement-action="next-step"]');
  if (el10) {
    const error3 = getPersonReplacementStepGate(value51, value51['workspace']['step'] + 1),
      value53 = value51['workspace']['step'] < PERSON_REPLACEMENT_STEPS['length'] && !error3['allowed'],
      value54 = value53 || isPersonReplacementSourceProcessing4;
    (el10['classList']?.['toggle']?.('is-locked', value53 && !isPersonReplacementSourceProcessing4),
      el10['classList']?.['toggle']?.('is-processing', isPersonReplacementSourceProcessing4),
      el10['setAttribute']?.('aria-disabled', String(value54)),
      el10['setAttribute']?.('aria-busy', String(isPersonReplacementSourceProcessing4)),
      value54
        ? el10['setAttribute']?.(
            'title',
            isPersonReplacementSourceProcessing4 ? '视频处理中，请稍候' : error3['message'],
          )
        : el10['removeAttribute']?.('title'));
  }
  const el11 = el7['querySelector']?.('[data-person-replacement-next-indicator="arrow"]'),
    el12 = el7['querySelector']?.('[data-person-replacement-next-indicator="spinner"]');
  if (el11) el11['hidden'] = isPersonReplacementSourceProcessing4;
  if (el12) el12['hidden'] = !isPersonReplacementSourceProcessing4;
  if (value51['workspace']['view'] !== 'home') return;
  const el13 = Array['from'](el7['querySelectorAll']?.('[data-workspace-open-project]') || [])['find'](
    (el14) => normalizeText(el14?.['dataset']?.['workspaceOpenProject']) === normalizeText(value51['id']),
  );
  if (!el13) return;
  let el15 = el13['querySelector']?.('[data-workspace-project-status]'),
    el16 = el13['querySelector']?.('[data-workspace-project-inline-status].has-task-error');
  const personReplacementProjectTaskSummary = getPersonReplacementProjectTaskSummary(value51),
    enabled3 = personReplacementProjectTaskSummary['activeCount'] > 0,
    enabled4 = !enabled3 && personReplacementProjectTaskSummary['failedCount'] > 0;
  (el13['classList']?.['toggle']?.('is-generating', enabled3),
    el13['classList']?.['toggle']?.('has-task-error', enabled4));
  if (enabled3) {
    (el16?.['remove']?.(),
      (el15 ||= createProjectTaskStatusElement(el13, el13, {
        className: 'story-project-status is-generating',
        dataAttribute: 'data-workspace-project-status',
      })));
    if (!el15) return;
    (el15['classList']?.['add']?.('is-generating'),
      (el15['textContent'] = personReplacementProjectTaskSummary['label']),
      el15['setAttribute']?.('role', 'status'),
      el15['setAttribute']?.('aria-live', 'polite'));
    return;
  }
  el15?.['remove']?.();
  if (!enabled4) {
    el16?.['remove']?.();
    return;
  }
  const value55 = el13['querySelector']?.('.story-project-card-meta');
  el16 ||= createProjectTaskStatusElement(el13, value55, {
    className: 'story-project-inline-status has-task-error',
    dataAttribute: 'data-workspace-project-inline-status',
  });
  if (!el16) return;
  ((el16['textContent'] = personReplacementProjectTaskSummary['label']),
    el16['setAttribute']?.('role', 'status'),
    el16['setAttribute']?.('aria-live', 'polite'));
}
export function createPersonReplacementShellPresentation({
  resolveVoiceReferenceCount: resolveVoiceReferenceCount = () => 0,
} = {}) {
  return Object['freeze']({
    renderCanvasSyncLoadingOverlay: renderCanvasSyncLoadingOverlay,
    renderHeader: renderHeader,
    renderHome: renderHome,
    syncHome: syncHome,
    renderHomeProjectResults: renderHomeProjectResults,
    renderSmartClipSettingsPanel: renderSmartClipSettingsPanel,
    renderStepFooter: (value56, value57) => renderStepFooter(value56, resolveVoiceReferenceCount, value57),
    renderToolbarActions: renderProjectToolbarActions,
    syncStatus: (value58, value59) => syncStatus(value58, value59, resolveVoiceReferenceCount),
  });
}
