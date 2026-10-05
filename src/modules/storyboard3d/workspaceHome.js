import { bindWorkspacePrices } from '../../components/shared/workspacePriceBindings.js';
import {
  getActiveStoryboard3DScene,
  getActiveStoryboard3DShot,
  migrateStoryboard3DProject,
  summarizeStoryboard3DProject,
} from './projectModel.js';
import {
  bindAIGenTextModelSelector,
  renderAIGenTextModelSelectorMarkup,
} from '../../components/aigenText/modelSelector.js';
import { getDisplayModelName } from '../providers.js';
import { getStoryboard3DTextModelIds, resolveStoryboard3DTextModelSelection } from './modelSelection.js';
import { STORYBOARD_3D_PROMPT_MAX_CHARACTERS } from './projectGeneration.js';
import { containWorkspaceContextMenu } from '../workspaceContextMenuGuard.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#39;');
}
function normalizeText(item) {
  return String(item || '')['trim']();
}
function normalizeSearchText(key) {
  return normalizeText(key)['toLocaleLowerCase']('zh-CN');
}
function formatModelPackSize(index) {
  const enabled = Math['max'](0, Number(index) || 0);
  if (!enabled) return '';
  return Math['max'](1, Math['round'](enabled / (1024 * 1024))) + ' MB';
}
function formatDownloadedBytes(result) {
  const count = Math['max'](0, Number(result) || 0);
  if (count < 1024) return Math['floor'](count) + ' B';
  if (count < 1024 * 1024) return (count / 1024)['toFixed'](1) + ' KB';
  return (count / (1024 * 1024))['toFixed'](1) + ' MB';
}
function getModelPackInstallProgress(options = {}) {
  const error =
      options?.['installProgress'] && typeof options['installProgress'] === 'object'
        ? options['installProgress']
        : {},
    downloadedBytes = Math['max'](0, Number(error['downloadedBytes']) || 0),
    totalBytes = Math['max'](0, Number(error['totalBytes']) || Number(options?.['downloadBytes']) || 0),
    data = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
  return {
    state: normalizeText(error['state']),
    downloadedBytes: downloadedBytes,
    totalBytes: totalBytes,
    percent: Math['min'](100, Math['max'](0, Number(error['percent']) || data)),
    currentSource: normalizeText(error['currentSource']),
    completedSources: Math['max'](0, Math['floor'](Number(error['completedSources']) || 0)),
    totalSources: Math['max'](0, Math['floor'](Number(error['totalSources']) || 0)),
    message: normalizeText(error['message']),
  };
}
function getModelPackProgressMessage(error2) {
  if (error2['message']) return error2['message'];
  if (error2['state'] === 'extracting') return '正在解压并校验模型';
  if (error2['state'] === 'installing') return '正在安装模型素材';
  if (error2['state'] === 'complete') return '模型包下载完成';
  return '正在下载模型包';
}
export function isStoryboard3DModelPackReady(options2 = {}) {
  return (
    options2?.['installed'] === !![] &&
    Array['isArray'](options2?.['assets']) &&
    options2['assets']['length'] > 0
  );
}
export function formatStoryboard3DProjectUpdatedAt(target, { now: now = Date['now']() } = {}) {
  const count2 = Number(target || 0);
  if (!Number['isFinite'](count2) || count2 <= 0) return '刚刚更新';
  const source = Math['max'](0, Number(now) - count2),
    next = 60 * 1000,
    current = 60 * next,
    entry = 24 * current;
  if (source < next) return '刚刚更新';
  if (source < current) return Math['max'](1, Math['floor'](source / next)) + ' 分钟前';
  if (source < entry) return Math['max'](1, Math['floor'](source / current)) + ' 小时前';
  if (source < entry * 7) return Math['max'](1, Math['floor'](source / entry)) + ' 天前';
  return new Date(count2)['toLocaleDateString']('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
export function getStoryboard3DWorkspaceProjects(options3 = {}) {
  const list = Array['isArray'](options3?.['storyboard3dProjects']) ? options3['storyboard3dProjects'] : [];
  return list['filter']((record) => record && typeof record === 'object' && normalizeText(record['id']))
    ['map']((payload) => {
      const projectId = migrateStoryboard3DProject(payload),
        activeSceneName = getActiveStoryboard3DScene(projectId),
        previewUrl = getActiveStoryboard3DShot(projectId),
        args = summarizeStoryboard3DProject(projectId);
      return {
        projectId: projectId['id'],
        title: projectId['name'],
        previewUrl: previewUrl?.['thumbnailUrl'] || '',
        activeSceneName: activeSceneName?.['name'] || '未命名场景',
        ...args,
        updatedAt: Number(projectId['updatedAt'] || 0),
      };
    })
    ['sort'](
      (handle, state) =>
        state['updatedAt'] - handle['updatedAt'] || handle['title']['localeCompare'](state['title'], 'zh-CN'),
    );
}
export function filterStoryboard3DWorkspaceProjects(list2 = [], config = '') {
  const searchText = normalizeSearchText(config);
  if (!searchText) return [...list2];
  return list2['filter']((scope) =>
    normalizeSearchText((scope?.['title'] || '') + ' ' + (scope?.['activeSceneName'] || ''))['includes'](
      searchText,
    ),
  );
}
function renderCubeIcon(input = '') {
  return (
    '<svg class="' +
    escapeHtml(input) +
    '" viewBox="0 0 24 24" fill="none" aria-hidden="true">\n    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/>\n    <path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>\n    <circle cx="12" cy="8" r="1.5"/>\n  </svg>'
  );
}
function renderProjectPreview(output) {
  if (output['previewUrl'])
    return (
      '<img src="' +
      escapeHtml(output['previewUrl']) +
      '" alt="' +
      escapeHtml(output['title']) +
      ' 的镜头预览">'
    );
  return (
    '<div class="storyboard-3d-home-project-placeholder" aria-hidden="true">\n    <span class="storyboard-3d-home-grid-plane"></span>\n    ' +
    renderCubeIcon('storyboard-3d-home-placeholder-icon') +
    '\n    <small>' +
    escapeHtml(output['activeSceneName']) +
    '</small>\n  </div>'
  );
}
export function renderStoryboard3DProjectCard(
  value2,
  now2,
  {
    menuOpen: menuOpen = ![],
    editing: editing = ![],
    editingName: editingName = '',
    confirmingDelete: confirmingDelete = ![],
  } = {},
) {
  const value3 = value2['title'] + ' ' + value2['activeSceneName'],
    escapeHtml2 = escapeHtml(value2['projectId']);
  return (
    '<article class="storyboard-3d-home-project-card' +
    (menuOpen ? ' is-menu-open' : '') +
    (editing ? ' is-renaming' : '') +
    (confirmingDelete ? ' is-delete-confirming' : '') +
    '" data-storyboard-3d-project-id="' +
    escapeHtml2 +
    '" data-storyboard-3d-project-search="' +
    escapeHtml(normalizeSearchText(value3)) +
    '">\n    <button type="button" class="storyboard-3d-home-project-preview" data-storyboard-3d-home-action="open-project" data-storyboard-3d-project-id="' +
    escapeHtml2 +
    '" aria-label="打开项目 ' +
    escapeHtml(value2['title']) +
    '">\n      ' +
    renderProjectPreview(value2) +
    '\n    </button>\n    ' +
    (confirmingDelete
      ? '<div class="storyboard-3d-home-project-delete-confirm" role="group" aria-label="确认删除项目 ' +
        escapeHtml(value2['title']) +
        '">\n          <button type="button" class="storyboard-3d-home-project-delete-confirm-button is-danger" data-storyboard-3d-home-action="confirm-project-delete" data-storyboard-3d-project-id="' +
        escapeHtml2 +
        '">删除</button>\n          <button type="button" class="storyboard-3d-home-project-delete-confirm-button" data-storyboard-3d-home-action="cancel-project-delete" data-storyboard-3d-project-id="' +
        escapeHtml2 +
        '">取消</button>\n        </div>'
      : '<button type="button" class="storyboard-3d-home-project-more" data-storyboard-3d-home-action="toggle-project-menu" data-storyboard-3d-project-id="' +
        escapeHtml2 +
        '" aria-label="' +
        escapeHtml(value2['title']) +
        ' 的更多选项" aria-haspopup="menu" aria-expanded="' +
        menuOpen +
        '">\n          <span aria-hidden="true">•••</span>\n        </button>\n        <div class="storyboard-3d-home-project-menu" role="menu" aria-label="' +
        escapeHtml(value2['title']) +
        ' 的项目操作" ' +
        (menuOpen ? '' : 'hidden') +
        '>\n          <button type="button" role="menuitem" data-storyboard-3d-home-action="clone-project" data-storyboard-3d-project-id="' +
        escapeHtml2 +
        '">克隆</button>\n          <button type="button" role="menuitem" data-storyboard-3d-home-action="start-project-rename" data-storyboard-3d-project-id="' +
        escapeHtml2 +
        '">重命名</button>\n          <button type="button" class="is-danger" role="menuitem" data-storyboard-3d-home-action="delete-project" data-storyboard-3d-project-id="' +
        escapeHtml2 +
        '">删除</button>\n        </div>') +
    '\n    <span class="storyboard-3d-home-project-copy">\n      <span class="storyboard-3d-home-project-heading">\n        ' +
    (editing
      ? '<input type="text" value="' +
        escapeHtml(editingName) +
        '" maxlength="120" data-storyboard-3d-project-rename-input data-storyboard-3d-project-id="' +
        escapeHtml2 +
        '" aria-label="重命名项目 ' +
        escapeHtml(value2['title']) +
        '">'
      : '<button type="button" class="storyboard-3d-home-project-title" data-storyboard-3d-home-action="start-project-rename" data-storyboard-3d-project-id="' +
        escapeHtml2 +
        '" title="点击重命名"><strong>' +
        escapeHtml(value2['title']) +
        '</strong></button>') +
    '\n        <small>' +
    escapeHtml(formatStoryboard3DProjectUpdatedAt(value2['updatedAt'], { now: now2 })) +
    '</small>\n      </span>\n      <button type="button" class="storyboard-3d-home-project-details" data-storyboard-3d-home-action="open-project" data-storyboard-3d-project-id="' +
    escapeHtml2 +
    '" aria-label="打开项目 ' +
    escapeHtml(value2['title']) +
    '">\n        <span class="storyboard-3d-home-visually-hidden">' +
    escapeHtml(value2['title']) +
    '</span>\n        <span class="storyboard-3d-home-project-scene">当前场景 · ' +
    escapeHtml(value2['activeSceneName']) +
    '</span>\n        <span class="storyboard-3d-home-project-stats">\n          <span><b>' +
    value2['sceneCount'] +
    '</b> 场景</span>\n          <span><b>' +
    value2['shotCount'] +
    '</b> 镜头</span>\n          <span><b>' +
    value2['objectCount'] +
    '</b> 物体</span>\n        </span>\n      </button>\n    </span>\n  </article>'
  );
}
function renderHome({
  projects: projects,
  searchQuery: searchQuery,
  prompt: prompt,
  modelId: modelId,
  provider: provider,
  isGenerating: isGenerating,
  generationStatus: generationStatus,
  generationError: generationError,
  modelPackStatus: modelPackStatus,
  modelPackDialogOpen: modelPackDialogOpen,
  referenceImageUrl: referenceImageUrl,
  referenceImageName: referenceImageName,
  referenceImages: referenceImages = [],
  openProjectMenuId: openProjectMenuId,
  editingProjectId: editingProjectId,
  editingProjectName: editingProjectName,
  confirmingDeleteProjectId: confirmingDeleteProjectId,
}) {
  const value4 = Date['now'](),
    isStoryboard3DModelPackReady2 = isStoryboard3DModelPackReady(modelPackStatus),
    value5 = Boolean(normalizeText(prompt) && modelId && provider && isStoryboard3DModelPackReady2),
    value6 = modelPackStatus?.['state'] === 'installing',
    value7 = Math['max'](
      0,
      Math['floor'](Number(modelPackStatus?.['assetCount']) || 0),
      Array['isArray'](modelPackStatus?.['assets']) ? modelPackStatus['assets']['length'] : 0,
    ),
    formatModelPackSize2 = formatModelPackSize(modelPackStatus?.['downloadBytes']),
    modelPackInstallProgress = getModelPackInstallProgress(modelPackStatus),
    value8 = [
      value7 ? value7['toLocaleString']('zh-CN') + ' 项素材' : '',
      formatModelPackSize2 ? '约 ' + formatModelPackSize2 : '',
    ]
      ['filter'](Boolean)
      ['join'](' · ');
  return (
    '<div class="storyboard-3d-workspace-home-page">\n    <section class="storyboard-3d-home-hero">\n      <span class="storyboard-3d-home-eyebrow">SHUO Canvas · Previz Studio</span>\n      <h1>先在空间里走一遍，再把镜头交给生成模型</h1>\n      <p>用场景、人物、道具和机位搭建可持续编辑的 3D 预演项目，让镜头关系在生成前就清晰可控。</p>\n      <div class="storyboard-3d-home-composer ' +
    (isGenerating ? 'is-generating' : '') +
    '" aria-busy="' +
    (isGenerating ? 'true' : 'false') +
    '">\n        <div class="storyboard-3d-home-prompt-wrap">\n          <label for="storyboard3DHomePrompt">描述想要搭建的 3D 场景</label>\n          <textarea id="storyboard3DHomePrompt" data-storyboard-3d-prompt-input maxlength="' +
    STORYBOARD_3D_PROMPT_MAX_CHARACTERS +
    '" placeholder="例如：雨夜的旧车站，站台中央有一张长椅，两个人隔着行李箱对坐，使用低机位中景。">' +
    escapeHtml(prompt) +
    '</textarea>\n          <div class="storyboard-3d-home-prompt-meta">\n            <p>AI 会规划场景类型、可用素材、空间位置和首个镜头，生成后仍可逐项编辑。</p>\n            <span data-storyboard-3d-prompt-count>' +
    prompt['length'] +
    ' / ' +
    STORYBOARD_3D_PROMPT_MAX_CHARACTERS +
    '</span>\n          </div>\n        </div>\n        <div class="storyboard-3d-home-model-bar">\n          ' +
    renderAIGenTextModelSelectorMarkup({
      modelId: modelId,
      provider: provider,
      getDisplayModelName: getDisplayModelName,
      className: 'storyboard-3d-home-text-model-selector',
      allowedModelIds: getStoryboard3DTextModelIds(),
    }) +
    '\n          <div class="storyboard-3d-home-composer-actions">\n            <input type="file" accept="image/*" multiple data-storyboard-3d-reference-image-input hidden>\n            <button type="button" class="storyboard-3d-home-reference-button" data-storyboard-3d-home-action="choose-reference-image">\n              <span aria-hidden="true">▧</span><span>参考图</span>\n            </button>\n            <button type="button" class="storyboard-3d-home-primary storyboard-3d-home-generate" data-storyboard-3d-home-action="generate-project" ' +
    (value5 && !isGenerating ? '' : 'disabled') +
    '>\n              <span data-storyboard-3d-generate-label>' +
    escapeHtml(isGenerating ? generationStatus || '正在创建 3D 场景' : '生成 3D 场景') +
    '</span>\n              <span class="storyboard-3d-home-generate-arrow" aria-hidden="true">→</span>\n            </button>\n          </div>\n        </div>\n        ' +
    (referenceImages['length']
      ? referenceImages
      : referenceImageUrl
        ? [{ url: referenceImageUrl, name: referenceImageName }]
        : [])
      ['map'](
        (error3, value9) =>
          '<div class="storyboard-3d-home-reference-preview" data-storyboard-3d-reference-preview>\n              <img src="' +
          escapeHtml(error3['url']) +
          '" alt="参考图 ' +
          (value9 + 1) +
          '">\n              <span><strong>' +
          escapeHtml(error3['name'] || '参考图') +
          '</strong><small>' +
          (value9 + 1) +
          ' / 6 · AI 估计人物、物品和空间关系</small></span>\n              <button type="button" data-storyboard-3d-home-action="remove-reference-image" data-reference-index="' +
          value9 +
          '" aria-label="移除参考图 ' +
          (value9 + 1) +
          '">×</button>\n            </div>',
      )
      ['join']('') +
    '\n        ' +
    (!isStoryboard3DModelPackReady2 && modelPackStatus?.['state'] !== 'checking'
      ? '<div class="storyboard-3d-home-model-pack-hint" role="status">需要先下载基础轻量模型包，场景 Agent 才能调用固定素材搭建场景。</div>'
      : '') +
    '\n        <div class="storyboard-3d-home-generation-error" data-storyboard-3d-generation-error role="alert" ' +
    (generationError ? '' : 'hidden') +
    '>' +
    escapeHtml(generationError) +
    '</div>\n        <div class="storyboard-3d-home-generation-loading storyboard-script-loading-overlay" data-storyboard-3d-generation-loading role="status" aria-live="polite" ' +
    (isGenerating ? '' : 'hidden') +
    '>\n          <div class="storyboard-script-loading-spinner"></div>\n          <div class="storyboard-script-loading-label" data-storyboard-3d-generation-loading-label>' +
    escapeHtml(generationStatus || '正在创建 3D 场景') +
    '</div>\n          <div class="storyboard-script-loading-bar"><div class="storyboard-script-loading-bar-fill"></div></div>\n        </div>\n      </div>\n    </section>\n\n    <section class="storyboard-3d-home-projects" aria-labelledby="storyboard3DHomeProjectsTitle">\n      <div class="storyboard-3d-home-section-heading">\n        <div>\n          <span class="storyboard-3d-home-eyebrow">独立项目 · ' +
    projects['length'] +
    '</span>\n          <h2 id="storyboard3DHomeProjectsTitle">我的3D场景项目</h2>\n        </div>\n        ' +
    (projects['length']
      ? '<label class="storyboard-3d-home-search">\n              <span aria-hidden="true">⌕</span>\n              <input type="search" value="' +
        escapeHtml(searchQuery) +
        '" data-storyboard-3d-project-search-input placeholder="搜索项目或场景" aria-label="搜索 3D 场景项目">\n            </label>'
      : '') +
    '\n      </div>\n      ' +
    (projects['length']
      ? '<div class="storyboard-3d-home-project-grid">\n            ' +
        projects['map']((menuOpen2) =>
          renderStoryboard3DProjectCard(menuOpen2, value4, {
            menuOpen: menuOpen2['projectId'] === openProjectMenuId,
            editing: menuOpen2['projectId'] === editingProjectId,
            editingName:
              menuOpen2['projectId'] === editingProjectId ? editingProjectName : menuOpen2['title'],
            confirmingDelete: menuOpen2['projectId'] === confirmingDeleteProjectId,
          }),
        )['join']('') +
        '\n            <button type="button" class="storyboard-3d-home-create-card" data-storyboard-3d-home-action="new-project">\n              <span aria-hidden="true">+</span><strong>新建 3D 场景项目</strong><small>创建空场景与首个镜头</small>\n            </button>\n          </div>\n          <div class="storyboard-3d-home-search-empty" data-storyboard-3d-search-empty hidden>\n            <strong>没有找到匹配的项目</strong><span>换一个项目名称或场景名称试试。</span>\n          </div>'
      : '<div class="storyboard-3d-home-empty-projects">\n            <div>' +
        renderCubeIcon('storyboard-3d-home-empty-icon') +
        '</div>\n            <strong>还没有 3D 场景项目</strong>\n            <span>创建项目后，它会保存在当前用户项目数据中。</span>\n            <button type="button" class="storyboard-3d-home-primary" data-storyboard-3d-home-action="new-project">创建第一个项目</button>\n          </div>') +
    '\n    </section>\n    ' +
    (modelPackDialogOpen
      ? '<div class="storyboard-3d-model-pack-backdrop" data-storyboard-3d-model-pack-dialog role="presentation">\n          <section class="storyboard-3d-model-pack-dialog" role="dialog" aria-modal="true" aria-labelledby="storyboard3DModelPackTitle">\n            <span class="storyboard-3d-model-pack-mark" aria-hidden="true">' +
        renderCubeIcon() +
        '</span>\n            <div>\n              <span class="storyboard-3d-home-eyebrow">首次使用准备</span>\n              <h2 id="storyboard3DModelPackTitle">下载 3D 场景基础模型包</h2>\n              <p>场景 Agent 只会调用这个固定的轻量素材库来搭建人物、家具和环境物品，不会在线搜索模型。素材以性能友好的中低复杂度模型为主，未下载时无法生成 3D 场景。</p>\n              ' +
        (value8 ? '<small>' + escapeHtml(value8) + ' · 按需加载，不会一次性占用内存</small>' : '') +
        '\n              <small>下载渠道：本地服务通过 HTTPS 从 Kenney 官方与 OpenGameArt 镜像获取，并在安装前校验文件。</small>\n              ' +
        (value6
          ? '<div class="storyboard-3d-model-pack-progress" data-storyboard-3d-model-pack-progress>\n                    <div class="storyboard-3d-model-pack-progress-heading">\n                      <strong>' +
            escapeHtml(getModelPackProgressMessage(modelPackInstallProgress)) +
            '</strong>\n                      <span>' +
            Math['round'](modelPackInstallProgress['percent']) +
            '%</span>\n                    </div>\n                    <progress max="100" value="' +
            modelPackInstallProgress['percent'] +
            '" aria-label="模型包下载进度">' +
            Math['round'](modelPackInstallProgress['percent']) +
            '%</progress>\n                    <div class="storyboard-3d-model-pack-progress-meta">\n                      <span>' +
            escapeHtml(formatDownloadedBytes(modelPackInstallProgress['downloadedBytes'])) +
            ' / ' +
            escapeHtml(formatDownloadedBytes(modelPackInstallProgress['totalBytes'])) +
            '</span>\n                      ' +
            (modelPackInstallProgress['totalSources']
              ? '<span>' +
                modelPackInstallProgress['completedSources'] +
                ' / ' +
                modelPackInstallProgress['totalSources'] +
                ' 个资源包</span>'
              : '') +
            '\n                    </div>\n                    ' +
            (modelPackInstallProgress['currentSource']
              ? '<small title="' +
                escapeHtml(modelPackInstallProgress['currentSource']) +
                '">下载源 · ' +
                escapeHtml(modelPackInstallProgress['currentSource']) +
                '</small>'
              : '') +
            '\n                  </div>'
          : '') +
        '\n              ' +
        (modelPackStatus?.['error']
          ? '<small class="storyboard-3d-model-pack-error">' +
            escapeHtml(modelPackStatus['error']) +
            '</small>'
          : '') +
        '\n            </div>\n            <footer>\n              <button type="button" data-storyboard-3d-home-action="skip-model-pack" ' +
        (value6 ? 'disabled' : '') +
        '>暂不下载</button>\n              <button type="button" class="storyboard-3d-home-primary" data-storyboard-3d-home-action="install-model-pack" ' +
        (value6 ? 'disabled' : '') +
        '>' +
        (value6 ? '正在下载模型包…' : '下载模型包') +
        '</button>\n            </footer>\n          </section>\n        </div>'
      : '') +
    '\n  </div>'
  );
}
export class Storyboard3DWorkspaceHome {
  constructor({
    getProjects: getProjects,
    onCreateProject: onCreateProject,
    onGenerateProject: onGenerateProject,
    onOpenProject: onOpenProject,
    onCloneProject: onCloneProject,
    onRenameProject: onRenameProject,
    onDeleteProject: onDeleteProject,
    onNotify: onNotify,
    modelPackApi: modelPackApi = null,
    documentObject: documentObject = globalThis['document'],
    urlApi: urlApi = globalThis['URL'],
    setTimeoutFn: setTimeoutFn = globalThis['setTimeout'],
    clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout'],
    modelPackProgressPollIntervalMs: modelPackProgressPollIntervalMs = 350,
  } = {}) {
    ((this['document'] = documentObject),
      (this['getProjects'] = getProjects),
      (this['onCreateProject'] = onCreateProject),
      (this['onGenerateProject'] = onGenerateProject),
      (this['onOpenProject'] = onOpenProject),
      (this['onCloneProject'] = onCloneProject),
      (this['onRenameProject'] = onRenameProject),
      (this['onDeleteProject'] = onDeleteProject),
      (this['onNotify'] = onNotify),
      (this['modelPackApi'] = modelPackApi),
      (this['urlApi'] = urlApi),
      (this['setTimeoutFn'] = setTimeoutFn),
      (this['clearTimeoutFn'] = clearTimeoutFn),
      (this['modelPackProgressPollIntervalMs'] = Math['min'](
        500,
        Math['max'](250, Number(modelPackProgressPollIntervalMs) || 350),
      )),
      (this['root'] = null),
      (this['searchQuery'] = ''),
      (this['prompt'] = ''));
    const storyboard3DTextModelSelection = resolveStoryboard3DTextModelSelection();
    ((this['modelId'] = storyboard3DTextModelSelection['modelId']),
      (this['provider'] = storyboard3DTextModelSelection['provider']),
      (this['isGenerating'] = ![]),
      (this['generationStatus'] = ''),
      (this['generationError'] = ''),
      (this['modelPackStatus'] = { state: 'checking', installed: ![], assets: [], error: '' }),
      (this['modelPackDialogOpen'] = ![]),
      (this['referenceImageUrl'] = ''),
      (this['referenceImageName'] = ''),
      (this['referenceImages'] = []),
      (this['openProjectMenuId'] = ''),
      (this['editingProjectId'] = ''),
      (this['editingProjectName'] = ''),
      (this['confirmingDeleteProjectId'] = ''),
      (this['_modelPackCheckPromise'] = null),
      (this['_modelPackProgressTimer'] = null),
      (this['_modelPackProgressPollGeneration'] = 0),
      (this['_destroyed'] = ![]),
      (this['_promptForMissingModelPack'] = ![]),
      (this['_modelSelectorController'] = null),
      (this['_handleClick'] = this['_handleClick']['bind'](this)),
      (this['_handleInput'] = this['_handleInput']['bind'](this)),
      (this['_handleChange'] = this['_handleChange']['bind'](this)),
      (this['_handleKeyDown'] = this['_handleKeyDown']['bind'](this)));
  }
  ['mount']() {
    if (this['root'] || !this['document']?.['body']) return this['root'];
    const el = this['document']['createElement']('section');
    return (
      (el['id'] = 'storyboard3DWorkspaceHome'),
      (el['className'] = 'storyboard-3d-workspace-home'),
      (el['hidden'] = !![]),
      el['setAttribute']('aria-hidden', 'true'),
      el['setAttribute']('aria-label', '3D 场景预演项目首页'),
      (el['dataset']['uiStop'] = '1'),
      el['addEventListener']('contextmenu', containWorkspaceContextMenu),
      el['addEventListener']('pointerdown', (event) => event['stopPropagation']()),
      el['addEventListener']('wheel', (event2) => event2['stopPropagation'](), {
        passive: !![],
      }),
      el['addEventListener']('click', this['_handleClick']),
      el['addEventListener']('input', this['_handleInput']),
      el['addEventListener']('change', this['_handleChange']),
      el['addEventListener']('keydown', this['_handleKeyDown']),
      this['document']['body']['appendChild'](el),
      (this['root'] = el),
      (this['_pricing'] = bindWorkspacePrices(el, [
        {
          selector: '[data-storyboard-3d-home-action="generate-project"]',
          getData: () => ({
            model: this['modelId'],
            provider: this['provider'],
            prompt: this['prompt'],
            hasReferences: this['referenceImages']['length'] > 0,
          }),
        },
      ])),
      (this['_destroyed'] = ![]),
      void this['_refreshModelPackStatus']({ promptIfMissing: ![] }),
      el
    );
  }
  ['_readProjects']() {
    const value10 = this['getProjects']?.();
    return Array['isArray'](value10) ? value10 : [];
  }
  ['render']() {
    if (!this['root']) return;
    const value11 = this['root']['scrollTop'],
      value12 = this['root']['contains'](this['document']?.['activeElement'])
        ? this['document']['activeElement']?.['getAttribute']?.('data-storyboard-3d-project-id') || ''
        : '';
    (this['_modelSelectorController']?.['destroy']?.(),
      (this['root']['innerHTML'] = renderHome({
        projects: this['_readProjects'](),
        searchQuery: this['searchQuery'],
        prompt: this['prompt'],
        modelId: this['modelId'],
        provider: this['provider'],
        isGenerating: this['isGenerating'],
        generationStatus: this['generationStatus'],
        generationError: this['generationError'],
        modelPackStatus: this['modelPackStatus'],
        modelPackDialogOpen: this['modelPackDialogOpen'],
        referenceImageUrl: this['referenceImageUrl'],
        referenceImageName: this['referenceImageName'],
        referenceImages: this['referenceImages'],
        openProjectMenuId: this['openProjectMenuId'],
        editingProjectId: this['editingProjectId'],
        editingProjectName: this['editingProjectName'],
        confirmingDeleteProjectId: this['confirmingDeleteProjectId'],
      })),
      this['_bindModelSelector'](),
      this['_applySearch'](),
      (this['root']['scrollTop'] = value11));
    const el2 = this['root']['querySelector']('[data-storyboard-3d-project-rename-input]');
    if (el2) (el2['focus'](), el2['select']?.());
    else value12 && this['focusProject'](value12);
  }
  ['_bindModelSelector']() {
    const enabled2 = this['root']?.['querySelector']('[data-aigen-text-model-selector]');
    if (!enabled2) return;
    this['_modelSelectorController'] = bindAIGenTextModelSelector(enabled2, {
      modelId: this['modelId'],
      provider: this['provider'],
      getDisplayModelName: getDisplayModelName,
      documentObject: this['document'],
      onChange: ({ modelId: modelId2 }) => {
        const storyboard3DTextModelSelection2 = resolveStoryboard3DTextModelSelection(modelId2);
        ((this['modelId'] = storyboard3DTextModelSelection2['modelId']),
          (this['provider'] = storyboard3DTextModelSelection2['provider']),
          this['_syncGenerationUi']());
      },
    });
  }
  ['_syncGenerationUi']() {
    this['_pricing']?.['syncPrices']();
    if (!this['root']) return;
    const enabled3 = Boolean(
        normalizeText(this['prompt']) &&
        this['modelId'] &&
        this['provider'] &&
        isStoryboard3DModelPackReady(this['modelPackStatus']),
      ),
      el3 = this['root']['querySelector']('[data-storyboard-3d-home-action="generate-project"]');
    if (el3) el3['disabled'] = !enabled3 || this['isGenerating'];
    const el4 = this['root']['querySelector']('[data-storyboard-3d-generate-label]');
    el4 &&
      (el4['textContent'] = this['isGenerating']
        ? this['generationStatus'] || '正在创建 3D 场景'
        : '生成 3D 场景');
    const el5 = this['root']['querySelector']('.storyboard-3d-home-composer');
    (el5?.['classList']['toggle']('is-generating', this['isGenerating']),
      el5?.['setAttribute']('aria-busy', this['isGenerating'] ? 'true' : 'false'));
    const el6 = this['root']['querySelector']('[data-storyboard-3d-generation-loading]');
    if (el6) el6['hidden'] = !this['isGenerating'];
    const el7 = this['root']['querySelector']('[data-storyboard-3d-generation-loading-label]');
    el7 && (el7['textContent'] = this['generationStatus'] || '正在创建 3D 场景');
    const el8 = this['root']['querySelector']('[data-storyboard-3d-generation-error]');
    el8 && ((el8['hidden'] = !this['generationError']), (el8['textContent'] = this['generationError']));
    const el9 = this['root']['querySelector']('[data-storyboard-3d-prompt-count]');
    el9 &&
      (el9['textContent'] = this['prompt']['length'] + ' / ' + STORYBOARD_3D_PROMPT_MAX_CHARACTERS);
  }
  async ['_generateProject']() {
    if (this['isGenerating']) return null;
    if (!isStoryboard3DModelPackReady(this['modelPackStatus']))
      return (
        (this['generationError'] = '请先下载 3D 场景基础模型包。'),
        (this['modelPackDialogOpen'] = !![]),
        this['render'](),
        null
      );
    const prompt2 = normalizeText(this['prompt']);
    if (!prompt2)
      return ((this['generationError'] = '请先描述要搭建的 3D 场景。'), this['_syncGenerationUi'](), null);
    if (typeof this['onGenerateProject'] !== 'function')
      return ((this['generationError'] = '3D 场景生成功能尚未初始化。'), this['_syncGenerationUi'](), null);
    ((this['isGenerating'] = !![]),
      (this['generationStatus'] = '正在规划场景、物体与镜头'),
      (this['generationError'] = ''),
      this['_syncGenerationUi']());
    const inputImageUrls = this['referenceImages']
      ['filter']((value13) => value13['file'])
      ['map']((value14) => this['urlApi']['createObjectURL'](value14['file']));
    try {
      const value15 = await this['onGenerateProject']({
        prompt: prompt2,
        model: this['modelId'],
        provider: this['provider'],
        assets: this['modelPackStatus']['assets'],
        inputImageUrls: inputImageUrls['length']
          ? inputImageUrls
          : this['referenceImageUrl']
            ? [this['referenceImageUrl']]
            : [],
        onProgress: ({ message: message } = {}) => {
          ((this['generationStatus'] = normalizeText(message) || '正在创建 3D 场景'),
            this['_syncGenerationUi']());
        },
      });
      return (
        (this['isGenerating'] = ![]),
        (this['generationStatus'] = ''),
        this['onNotify']?.('3D 场景项目创建完成。', 'success'),
        this['_syncGenerationUi'](),
        value15
      );
    } catch (error4) {
      return (
        (this['isGenerating'] = ![]),
        (this['generationStatus'] = ''),
        (this['generationError'] = normalizeText(error4?.['message']) || '3D 场景创建失败，请稍后重试。'),
        this['onNotify']?.(this['generationError'], 'error'),
        this['_syncGenerationUi'](),
        null
      );
    } finally {
      inputImageUrls['forEach']((value16) => this['urlApi']['revokeObjectURL'](value16));
    }
  }
  ['_applySearch']() {
    if (!this['root']) return;
    const searchText2 = normalizeSearchText(this['searchQuery']);
    let count3 = 0;
    this['root']['querySelectorAll']('[data-storyboard-3d-project-search]')['forEach']((el10) => {
      const list3 = el10['getAttribute']('data-storyboard-3d-project-search') || '',
        enabled4 = !searchText2 || list3['includes'](searchText2);
      el10['hidden'] = !enabled4;
      if (enabled4) count3 += 1;
    });
    const el11 = this['root']['querySelector']('[data-storyboard-3d-search-empty]');
    if (el11) el11['hidden'] = count3 > 0 || !searchText2;
  }
  ['_findProject'](value17) {
    const text = normalizeText(value17);
    return this['_readProjects']()['find']((value18) => value18['projectId'] === text) || null;
  }
  ['_cloneProject'](value19) {
    const enabled5 = this['_findProject'](value19);
    if (!enabled5) return ![];
    try {
      const enabled6 = this['onCloneProject']?.(enabled5['projectId']);
      if (!enabled6) return (this['onNotify']?.('克隆项目失败。', 'error'), ![]);
      return (this['onNotify']?.('已克隆：' + enabled5['title'], 'success'), this['render'](), enabled6);
    } catch (error5) {
      return (this['onNotify']?.(error5?.['message'] || '克隆项目失败。', 'error'), ![]);
    }
  }
  ['_startProjectRename'](value20) {
    const enabled7 = this['_findProject'](value20);
    if (!enabled7) return ![];
    return (
      (this['openProjectMenuId'] = ''),
      (this['confirmingDeleteProjectId'] = ''),
      (this['editingProjectId'] = enabled7['projectId']),
      (this['editingProjectName'] = enabled7['title']),
      this['render'](),
      !![]
    );
  }
  ['_commitProjectRename']({ render: render = !![] } = {}) {
    const value21 = this['editingProjectId'],
      enabled8 = this['_findProject'](value21),
      text2 = normalizeText(this['editingProjectName'])['slice'](0, 120);
    if (!enabled8) return (this['_cancelProjectRename']({ render: render }), ![]);
    if (!text2) {
      this['onNotify']?.('项目名称不能为空。', 'error');
      if (render) this['render']();
      return ![];
    }
    if (text2 === enabled8['title']) return (this['_cancelProjectRename']({ render: render }), enabled8);
    try {
      const enabled9 = this['onRenameProject']?.(value21, text2);
      if (!enabled9) {
        this['onNotify']?.('重命名项目失败。', 'error');
        if (render) this['render']();
        return ![];
      }
      ((this['editingProjectId'] = ''),
        (this['editingProjectName'] = ''),
        this['onNotify']?.('已重命名：' + text2, 'success'));
      if (render) this['render']();
      return enabled9;
    } catch (error6) {
      this['onNotify']?.(error6?.['message'] || '重命名项目失败。', 'error');
      if (render) this['render']();
      return ![];
    }
  }
  ['_cancelProjectRename']({ render: render = !![] } = {}) {
    const value22 = Boolean(this['editingProjectId']);
    ((this['editingProjectId'] = ''), (this['editingProjectName'] = ''));
    if (render && value22) this['render']();
    return value22;
  }
  ['_closeProjectMenu']() {
    if (!this['openProjectMenuId']) return ![];
    return (
      (this['openProjectMenuId'] = ''),
      this['root']
        ?.['querySelectorAll']('.storyboard-3d-home-project-card.is-menu-open')
        ['forEach']((el12) => el12['classList']['remove']('is-menu-open')),
      this['root']
        ?.['querySelectorAll']('.storyboard-3d-home-project-menu:not([hidden])')
        ['forEach']((el13) => {
          el13['hidden'] = !![];
        }),
      this['root']
        ?.['querySelectorAll']('[data-storyboard-3d-home-action="toggle-project-menu"]')
        ['forEach']((el14) => el14['setAttribute']('aria-expanded', 'false')),
      !![]
    );
  }
  ['_deleteProject'](value23) {
    const enabled10 = this['_findProject'](value23);
    if (!enabled10 || this['confirmingDeleteProjectId'] !== enabled10['projectId']) return ![];
    try {
      const enabled11 = this['onDeleteProject']?.(enabled10['projectId']);
      if (!enabled11) return (this['onNotify']?.('删除项目失败。', 'error'), this['render'](), ![]);
      return (
        (this['confirmingDeleteProjectId'] = ''),
        this['onNotify']?.('已删除：' + enabled10['title'], 'success'),
        this['render'](),
        !![]
      );
    } catch (error7) {
      return (this['onNotify']?.(error7?.['message'] || '删除项目失败。', 'error'), this['render'](), ![]);
    }
  }
  ['_startProjectDelete'](value24) {
    const enabled12 = this['_findProject'](value24);
    if (!enabled12) return ![];
    return (
      (this['openProjectMenuId'] = ''),
      this['_cancelProjectRename']({ render: ![] }),
      (this['confirmingDeleteProjectId'] = enabled12['projectId']),
      this['render'](),
      [
        ...(this['root']?.['querySelectorAll'](
          '[data-storyboard-3d-home-action="confirm-project-delete"]',
        ) || []),
      ]
        ['find'](
          (value25) => value25['getAttribute']('data-storyboard-3d-project-id') === enabled12['projectId'],
        )
        ?.['focus']?.(),
      !![]
    );
  }
  ['_cancelProjectDelete']({ render: render = !![], focusProjectId: focusProjectId = '' } = {}) {
    const value26 = this['confirmingDeleteProjectId'] || normalizeText(focusProjectId),
      value27 = Boolean(this['confirmingDeleteProjectId']);
    this['confirmingDeleteProjectId'] = '';
    if (render && value27) this['render']();
    return (
      render &&
        value26 &&
        [
          ...(this['root']?.['querySelectorAll'](
            '[data-storyboard-3d-home-action="toggle-project-menu"]',
          ) || []),
        ]
          ['find']((value28) => value28['getAttribute']('data-storyboard-3d-project-id') === value26)
          ?.['focus']?.(),
      value27
    );
  }
  ['_handleClick'](event3) {
    const el15 = event3['target']['closest']('[data-storyboard-3d-home-action]');
    if (!el15 || !this['root']?.['contains'](el15)) {
      this['_closeProjectMenu']();
      return;
    }
    const value29 = el15['getAttribute']('data-storyboard-3d-home-action'),
      focusProjectId2 = el15['getAttribute']('data-storyboard-3d-project-id') || '';
    if (value29 === 'toggle-project-menu') {
      (this['_cancelProjectDelete']({ render: ![] }),
        (this['openProjectMenuId'] = this['openProjectMenuId'] === focusProjectId2 ? '' : focusProjectId2),
        this['_cancelProjectRename']({ render: ![] }),
        this['render']());
      this['openProjectMenuId'] &&
        [...(this['root']?.['querySelectorAll']('[data-storyboard-3d-home-action="clone-project"]') || [])]
          ['find']((value30) => value30['getAttribute']('data-storyboard-3d-project-id') === focusProjectId2)
          ?.['focus']?.();
      return;
    }
    if (value29 === 'clone-project') {
      ((this['openProjectMenuId'] = ''), this['_cloneProject'](focusProjectId2));
      return;
    }
    if (value29 === 'start-project-rename') {
      this['_startProjectRename'](focusProjectId2);
      return;
    }
    if (value29 === 'delete-project') {
      this['_startProjectDelete'](focusProjectId2);
      return;
    }
    if (value29 === 'confirm-project-delete') {
      if (this['confirmingDeleteProjectId'] === focusProjectId2) this['_deleteProject'](focusProjectId2);
      return;
    }
    if (value29 === 'cancel-project-delete') {
      this['_cancelProjectDelete']({ focusProjectId: focusProjectId2 });
      return;
    }
    this['_closeProjectMenu']();
    if (value29 === 'choose-reference-image') {
      this['root']?.['querySelector']('[data-storyboard-3d-reference-image-input]')?.['click']();
      return;
    }
    if (value29 === 'remove-reference-image') {
      const value31 = Number(el15['dataset']['referenceIndex']);
      if (Number['isInteger'](value31) && this['referenceImages'][value31])
        (this['urlApi']?.['revokeObjectURL']?.(this['referenceImages'][value31]['url']),
          this['referenceImages']['splice'](value31, 1),
          (this['referenceImageUrl'] = this['referenceImages'][0]?.['url'] || ''),
          (this['referenceImageName'] = this['referenceImages'][0]?.['name'] || ''));
      else this['_clearReferenceImage']();
      this['render']();
      return;
    }
    if (value29 === 'install-model-pack') {
      void this['_installModelPack']();
      return;
    }
    if (value29 === 'skip-model-pack') {
      ((this['modelPackDialogOpen'] = ![]),
        (this['generationError'] = '未下载模型包，暂时不能生成 3D 场景。'),
        this['render']());
      return;
    }
    if (value29 === 'generate-project') {
      this['_generateProject']();
      return;
    }
    if (value29 === 'new-project') {
      this['onCreateProject']?.();
      return;
    }
    value29 === 'open-project' && this['onOpenProject']?.(focusProjectId2);
  }
  ['_handleInput'](event4) {
    if (event4['target']['matches']('[data-storyboard-3d-project-rename-input]')) {
      this['editingProjectName'] = String(event4['target']['value'] || '')['slice'](0, 120);
      return;
    }
    if (event4['target']['matches']('[data-storyboard-3d-prompt-input]')) {
      ((this['prompt'] = String(event4['target']['value'] || '')['slice'](
        0,
        STORYBOARD_3D_PROMPT_MAX_CHARACTERS,
      )),
        (this['generationError'] = ''),
        this['_syncGenerationUi']());
      return;
    }
    if (!event4['target']['matches']('[data-storyboard-3d-project-search-input]')) return;
    ((this['searchQuery'] = String(event4['target']['value'] || '')), this['_applySearch']());
  }
  ['_handleChange'](event5) {
    if (event5['target']['matches']('[data-storyboard-3d-project-rename-input]')) {
      (this['_commitProjectRename']({ render: ![] }),
        this['setTimeoutFn']?.(() => {
          if (!this['_destroyed']) this['render']();
        }, 0));
      return;
    }
    if (!event5['target']['matches']('[data-storyboard-3d-reference-image-input]')) return;
    const list4 = Array['from'](event5['target']['files'] || []);
    event5['target']['value'] = '';
    if (!list4['length']) return;
    if (
      list4['some'](
        (value32) =>
          !String(value32['type'] || '')
            ['toLowerCase']()
            ['startsWith']('image/') || value32['size'] > 32 * 1024 * 1024,
      ) ||
      this['referenceImages']['length'] + list4['length'] > 6
    ) {
      ((this['generationError'] = '最多添加 6 张参考图，每张图片不超过 32 MB。'),
        this['_syncGenerationUi']());
      return;
    }
    (this['referenceImages']['push'](
      ...list4['map']((file) => ({
        file: file,
        url: this['urlApi']?.['createObjectURL']?.(file) || '',
        name: String(file['name'] || '参考图'),
      })),
    ),
      (this['referenceImageUrl'] = this['referenceImages'][0]?.['url'] || ''),
      (this['referenceImageName'] = this['referenceImages'][0]?.['name'] || ''),
      !this['referenceImageUrl'] && (this['generationError'] = '无法读取参考图，请重新选择。'),
      this['render']());
  }
  ['_clearReferenceImage']() {
    for (const value33 of new Set(
      [this['referenceImageUrl'], ...this['referenceImages']['map']((response) => response['url'])]['filter'](
        Boolean,
      ),
    ))
      this['urlApi']?.['revokeObjectURL']?.(value33);
    ((this['referenceImages'] = []), (this['referenceImageUrl'] = ''), (this['referenceImageName'] = ''));
  }
  async ['_refreshModelPackStatus']({ promptIfMissing: promptIfMissing = ![] } = {}) {
    if (promptIfMissing) this['_promptForMissingModelPack'] = !![];
    if (this['modelPackStatus']['state'] === 'installing') return this['modelPackStatus'];
    if (this['_modelPackCheckPromise']) return this['_modelPackCheckPromise'];
    if (typeof this['modelPackApi']?.['getStatus'] !== 'function') {
      this['modelPackStatus'] = {
        state: 'error',
        installed: ![],
        assets: [],
        error: '模型包服务尚未初始化。',
      };
      if (this['_promptForMissingModelPack']) this['modelPackDialogOpen'] = !![];
      return (this['render'](), this['modelPackStatus']);
    }
    ((this['modelPackStatus'] = { ...this['modelPackStatus'], state: 'checking', error: '' }),
      this['_syncGenerationUi']());
    const value34 = Promise['resolve'](this['modelPackApi']['getStatus']())
      ['then']((args2) => {
        const assets = Array['isArray'](args2?.['assets']) ? args2['assets'] : [],
          state2 = args2?.['installed'] === !![] && assets['length'] > 0;
        return (
          (this['modelPackStatus'] = {
            ...args2,
            state: state2 ? 'installed' : 'missing',
            installed: state2,
            assets: assets,
            error: '',
          }),
          (this['modelPackDialogOpen'] = !state2 && this['_promptForMissingModelPack']),
          this['render'](),
          this['modelPackStatus']
        );
      })
      ['catch']((error8) => {
        this['modelPackStatus'] = {
          state: 'error',
          installed: ![],
          assets: [],
          error: normalizeText(error8?.['message']) || '无法检测模型包状态。',
        };
        if (this['_promptForMissingModelPack']) this['modelPackDialogOpen'] = !![];
        return (this['render'](), this['modelPackStatus']);
      })
      ['finally'](() => {
        this['_modelPackCheckPromise'] = null;
      });
    return ((this['_modelPackCheckPromise'] = value34), value34);
  }
  async ['_installModelPack']() {
    if (this['modelPackStatus']['state'] === 'installing') return null;
    if (typeof this['modelPackApi']?.['install'] !== 'function')
      return (
        (this['modelPackStatus'] = { ...this['modelPackStatus'], error: '模型包下载服务尚未初始化。' }),
        this['render'](),
        null
      );
    ((this['modelPackDialogOpen'] = !![]),
      (this['modelPackStatus'] = {
        ...this['modelPackStatus'],
        state: 'installing',
        installed: ![],
        error: '',
        installProgress: {
          state: 'downloading',
          downloadedBytes: 0,
          totalBytes: Math['max'](0, Number(this['modelPackStatus']['downloadBytes']) || 0),
          percent: 0,
          currentSource: '',
          completedSources: 0,
          totalSources: 0,
          message: '正在连接模型包下载源',
        },
      }),
      this['render']());
    try {
      const value35 = this['modelPackApi']['install']();
      this['_startModelPackProgressPolling']();
      const args3 = await value35,
        assets2 = Array['isArray'](args3?.['assets']) ? args3['assets'] : [];
      if (args3?.['installed'] !== !![] || assets2['length'] === 0)
        throw new Error('模型包下载未完成，请重试。');
      return (
        this['_stopModelPackProgressPolling'](),
        (this['modelPackStatus'] = {
          ...args3,
          state: 'installed',
          installed: !![],
          assets: assets2,
          error: '',
        }),
        (this['modelPackDialogOpen'] = ![]),
        (this['generationError'] = ''),
        this['onNotify']?.('3D 场景基础模型包下载完成。', 'success'),
        this['render'](),
        this['modelPackStatus']
      );
    } catch (error9) {
      this['_stopModelPackProgressPolling']();
      try {
        const args4 = await this['modelPackApi']['getStatus']?.(),
          assets3 = Array['isArray'](args4?.['assets']) ? args4['assets'] : [];
        if (args4?.['installed'] === !![] && assets3['length'] > 0)
          return (
            (this['modelPackStatus'] = {
              ...args4,
              state: 'installed',
              installed: !![],
              assets: assets3,
              error: '',
            }),
            (this['modelPackDialogOpen'] = ![]),
            (this['generationError'] = ''),
            this['onNotify']?.('3D 场景基础模型包下载完成。', 'success'),
            this['render'](),
            this['modelPackStatus']
          );
      } catch {}
      return (
        (this['modelPackStatus'] = {
          state: 'error',
          installed: ![],
          assets: [],
          error: normalizeText(error9?.['message']) || '模型包下载失败，请稍后重试。',
        }),
        (this['modelPackDialogOpen'] = !![]),
        this['render'](),
        null
      );
    }
  }
  ['_startModelPackProgressPolling']() {
    this['_stopModelPackProgressPolling']();
    if (typeof this['modelPackApi']?.['getStatus'] !== 'function') return;
    const value36 = ++this['_modelPackProgressPollGeneration'],
      handler = async () => {
        if (
          this['_destroyed'] ||
          value36 !== this['_modelPackProgressPollGeneration'] ||
          this['modelPackStatus']['state'] !== 'installing'
        )
          return;
        try {
          const args5 = await this['modelPackApi']['getStatus']();
          if (
            this['_destroyed'] ||
            value36 !== this['_modelPackProgressPollGeneration'] ||
            this['modelPackStatus']['state'] !== 'installing'
          )
            return;
          ((this['modelPackStatus'] = {
            ...this['modelPackStatus'],
            ...args5,
            state: 'installing',
            installed: ![],
            assets: this['modelPackStatus']['assets'],
            error: '',
          }),
            this['render']());
        } catch {}
        if (
          this['_destroyed'] ||
          value36 !== this['_modelPackProgressPollGeneration'] ||
          this['modelPackStatus']['state'] !== 'installing'
        )
          return;
        this['_modelPackProgressTimer'] = this['setTimeoutFn']?.(
          handler,
          this['modelPackProgressPollIntervalMs'],
        );
      };
    void handler();
  }
  ['_stopModelPackProgressPolling']() {
    ((this['_modelPackProgressPollGeneration'] += 1),
      this['_modelPackProgressTimer'] !== null &&
        (this['clearTimeoutFn']?.(this['_modelPackProgressTimer']),
        (this['_modelPackProgressTimer'] = null)));
  }
  ['_handleKeyDown'](event6) {
    if (event6['key'] === 'Escape' && this['confirmingDeleteProjectId']) {
      (event6['preventDefault'](), this['_cancelProjectDelete']());
      return;
    }
    if (event6['target']['matches']('[data-storyboard-3d-project-rename-input]')) {
      if (event6['isComposing']) return;
      if (event6['key'] === 'Enter')
        (event6['preventDefault'](),
          (this['editingProjectName'] = String(event6['target']['value'] || '')['slice'](0, 120)),
          this['_commitProjectRename']());
      else event6['key'] === 'Escape' && (event6['preventDefault'](), this['_cancelProjectRename']());
      return;
    }
    if (!event6['target']['matches']('[data-storyboard-3d-prompt-input]')) return;
    if (event6['isComposing'] || event6['key'] !== 'Enter' || (!event6['ctrlKey'] && !event6['metaKey']))
      return;
    (event6['preventDefault'](), this['_generateProject']());
  }
  ['show']() {
    this['mount']();
    if (!this['root']) return null;
    return (
      this['render'](),
      (this['root']['hidden'] = ![]),
      this['root']['setAttribute']('aria-hidden', 'false'),
      void this['_refreshModelPackStatus']({ promptIfMissing: !![] }),
      this
    );
  }
  ['hide']() {
    if (!this['root']) return ![];
    return (
      (this['openProjectMenuId'] = ''),
      (this['editingProjectId'] = ''),
      (this['editingProjectName'] = ''),
      (this['confirmingDeleteProjectId'] = ''),
      (this['root']['hidden'] = !![]),
      this['root']['setAttribute']('aria-hidden', 'true'),
      !![]
    );
  }
  ['isVisible']() {
    return Boolean(this['root'] && !this['root']['hidden']);
  }
  ['focusProject'](value37) {
    const enabled13 = String(value37 || '')['trim']();
    if (!enabled13 || !this['root'] || this['root']['hidden']) return ![];
    const el16 = [
      ...this['root']['querySelectorAll'](
        '.storyboard-3d-home-project-details[data-storyboard-3d-home-action="open-project"]',
      ),
    ]['find']((value38) => value38['getAttribute']('data-storyboard-3d-project-id') === enabled13);
    if (!el16 || typeof el16['focus'] !== 'function') return ![];
    return (el16['focus']({ preventScroll: !![] }), !![]);
  }
  ['destroy']() {
    (this['_pricing']?.['destroy'](), (this['_destroyed'] = !![]), this['_stopModelPackProgressPolling']());
    if (!this['root']) return;
    (this['root']['removeEventListener']('contextmenu', containWorkspaceContextMenu),
      this['root']['removeEventListener']('click', this['_handleClick']),
      this['root']['removeEventListener']('input', this['_handleInput']),
      this['root']['removeEventListener']('change', this['_handleChange']),
      this['root']['removeEventListener']('keydown', this['_handleKeyDown']),
      this['_modelSelectorController']?.['destroy']?.(),
      (this['_modelSelectorController'] = null),
      this['_clearReferenceImage'](),
      this['root']['remove'](),
      (this['root'] = null));
  }
}
export function initStoryboard3DWorkspaceHome(options4 = {}) {
  const storyboard3DWorkspaceHome = new Storyboard3DWorkspaceHome(options4);
  return (storyboard3DWorkspaceHome['mount'](), storyboard3DWorkspaceHome);
}
