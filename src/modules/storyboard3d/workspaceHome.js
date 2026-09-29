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
function escapeHtml(_0x6a505) {
  return String(_0x6a505 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x54c526) {
  return String(_0x54c526 || '')['trim']();
}
function normalizeSearchText(_0x34ecbc) {
  return normalizeText(_0x34ecbc)['toLocaleLowerCase']('zh-CN');
}
function formatModelPackSize(_0x321567) {
  const _0x2b2797 = Math['max'](0x0, Number(_0x321567) || 0x0);
  if (!_0x2b2797) return '';
  return Math['max'](0x1, Math['round'](_0x2b2797 / (0x400 * 0x400))) + ' MB';
}
function formatDownloadedBytes(_0x3c8ef9) {
  const _0x3e6a8d = Math['max'](0x0, Number(_0x3c8ef9) || 0x0);
  if (_0x3e6a8d < 0x400) return Math['floor'](_0x3e6a8d) + '\x20B';
  if (_0x3e6a8d < 0x400 * 0x400) return (_0x3e6a8d / 0x400)['toFixed'](0x1) + '\x20KB';
  return (_0x3e6a8d / (0x400 * 0x400))['toFixed'](0x1) + ' MB';
}
function getModelPackInstallProgress(_0x31316b = {}) {
  const _0x3fc2fd =
      _0x31316b?.['installProgress'] && typeof _0x31316b['installProgress'] === 'object'
        ? _0x31316b['installProgress']
        : {},
    _0x33ef7c = Math['max'](0x0, Number(_0x3fc2fd['downloadedBytes']) || 0x0),
    _0x17c6c2 = Math['max'](
      0x0,
      Number(_0x3fc2fd['totalBytes']) || Number(_0x31316b?.['downloadBytes']) || 0x0,
    ),
    _0x324c3a = _0x17c6c2 > 0x0 ? (_0x33ef7c / _0x17c6c2) * 0x64 : 0x0;
  return {
    state: normalizeText(_0x3fc2fd['state']),
    downloadedBytes: _0x33ef7c,
    totalBytes: _0x17c6c2,
    percent: Math['min'](0x64, Math['max'](0x0, Number(_0x3fc2fd['percent']) || _0x324c3a)),
    currentSource: normalizeText(_0x3fc2fd['currentSource']),
    completedSources: Math['max'](0x0, Math['floor'](Number(_0x3fc2fd['completedSources']) || 0x0)),
    totalSources: Math['max'](0x0, Math['floor'](Number(_0x3fc2fd['totalSources']) || 0x0)),
    message: normalizeText(_0x3fc2fd['message']),
  };
}
function getModelPackProgressMessage(_0x56cb6a) {
  if (_0x56cb6a['message']) return _0x56cb6a['message'];
  if (_0x56cb6a['state'] === 'extracting') return '正在解压并校验模型';
  if (_0x56cb6a['state'] === 'installing') return '正在安装模型素材';
  if (_0x56cb6a['state'] === 'complete') return '模型包下载完成';
  return '正在下载模型包';
}
export function isStoryboard3DModelPackReady(_0x1f8d84 = {}) {
  return (
    _0x1f8d84?.['installed'] === !![] &&
    Array['isArray'](_0x1f8d84?.['assets']) &&
    _0x1f8d84['assets']['length'] > 0x0
  );
}
export function formatStoryboard3DProjectUpdatedAt(_0x43ecef, { now: now = Date['now']() } = {}) {
  const _0x562274 = Number(_0x43ecef || 0x0);
  if (!Number['isFinite'](_0x562274) || _0x562274 <= 0x0) return '刚刚更新';
  const _0x43800d = Math['max'](0x0, Number(now) - _0x562274),
    _0x492a43 = 0x3c * 0x3e8,
    _0x41652f = 0x3c * _0x492a43,
    _0x337350 = 0x18 * _0x41652f;
  if (_0x43800d < _0x492a43) return '刚刚更新';
  if (_0x43800d < _0x41652f) return Math['max'](0x1, Math['floor'](_0x43800d / _0x492a43)) + ' 分钟前';
  if (_0x43800d < _0x337350) return Math['max'](0x1, Math['floor'](_0x43800d / _0x41652f)) + ' 小时前';
  if (_0x43800d < _0x337350 * 0x7) return Math['max'](0x1, Math['floor'](_0x43800d / _0x337350)) + ' 天前';
  return new Date(_0x562274)['toLocaleDateString']('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
export function getStoryboard3DWorkspaceProjects(_0x15e775 = {}) {
  const _0x20d977 = Array['isArray'](_0x15e775?.['storyboard3dProjects'])
    ? _0x15e775['storyboard3dProjects']
    : [];
  return _0x20d977['filter'](
    (_0xb4eb57) => _0xb4eb57 && typeof _0xb4eb57 === 'object' && normalizeText(_0xb4eb57['id']),
  )
    ['map']((_0x5504f3) => {
      const _0xdd98a0 = migrateStoryboard3DProject(_0x5504f3),
        _0x5b6297 = getActiveStoryboard3DScene(_0xdd98a0),
        _0x5e6a3a = getActiveStoryboard3DShot(_0xdd98a0),
        _0x2a3b10 = summarizeStoryboard3DProject(_0xdd98a0);
      return {
        projectId: _0xdd98a0['id'],
        title: _0xdd98a0['name'],
        previewUrl: _0x5e6a3a?.['thumbnailUrl'] || '',
        activeSceneName: _0x5b6297?.['name'] || '未命名场景',
        ..._0x2a3b10,
        updatedAt: Number(_0xdd98a0['updatedAt'] || 0x0),
      };
    })
    ['sort'](
      (_0x3f23d7, _0x2d2a4c) =>
        _0x2d2a4c['updatedAt'] - _0x3f23d7['updatedAt'] ||
        _0x3f23d7['title']['localeCompare'](_0x2d2a4c['title'], 'zh-CN'),
    );
}
export function filterStoryboard3DWorkspaceProjects(_0x2098d9 = [], _0x1d7c12 = '') {
  const _0xede852 = normalizeSearchText(_0x1d7c12);
  if (!_0xede852) return [..._0x2098d9];
  return _0x2098d9['filter']((_0x59f3a8) =>
    normalizeSearchText((_0x59f3a8?.['title'] || '') + '\x20' + (_0x59f3a8?.['activeSceneName'] || ''))[
      'includes'
    ](_0xede852),
  );
}
function renderCubeIcon(_0xb13fa2 = '') {
  return (
    '<svg\x20class=\x22' +
    escapeHtml(_0xb13fa2) +
    '\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20<path\x20d=\x22m12\x203\x208\x204.5v9L12\x2021l-8-4.5v-9z\x22/>\x0a\x20\x20\x20\x20<path\x20d=\x22m4\x207.5\x208\x204.5\x208-4.5M12\x2012v9\x22/>\x0a\x20\x20\x20\x20<circle\x20cx=\x2212\x22\x20cy=\x228\x22\x20r=\x221.5\x22/>\x0a\x20\x20</svg>'
  );
}
function renderProjectPreview(_0xd846f4) {
  if (_0xd846f4['previewUrl'])
    return (
      '<img src="' +
      escapeHtml(_0xd846f4['previewUrl']) +
      '" alt="' +
      escapeHtml(_0xd846f4['title']) +
      ' 的镜头预览">'
    );
  return (
    '<div class="storyboard-3d-home-project-placeholder" aria-hidden="true">\n    <span class="storyboard-3d-home-grid-plane"></span>\n    ' +
    renderCubeIcon('storyboard-3d-home-placeholder-icon') +
    '\n    <small>' +
    escapeHtml(_0xd846f4['activeSceneName']) +
    '</small>\n  </div>'
  );
}
export function renderStoryboard3DProjectCard(
  _0x4c10b0,
  _0x3885c8,
  {
    menuOpen: menuOpen = ![],
    editing: editing = ![],
    editingName: editingName = '',
    confirmingDelete: confirmingDelete = ![],
  } = {},
) {
  const _0x22cbe9 = _0x4c10b0['title'] + '\x20' + _0x4c10b0['activeSceneName'],
    _0x2c576b = escapeHtml(_0x4c10b0['projectId']);
  return (
    '<article class="storyboard-3d-home-project-card' +
    (menuOpen ? ' is-menu-open' : '') +
    (editing ? ' is-renaming' : '') +
    (confirmingDelete ? '\x20is-delete-confirming' : '') +
    '" data-storyboard-3d-project-id="' +
    _0x2c576b +
    '" data-storyboard-3d-project-search="' +
    escapeHtml(normalizeSearchText(_0x22cbe9)) +
    '\x22>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-home-project-preview\x22\x20data-storyboard-3d-home-action=\x22open-project\x22\x20data-storyboard-3d-project-id=\x22' +
    _0x2c576b +
    '\x22\x20aria-label=\x22打开项目\x20' +
    escapeHtml(_0x4c10b0['title']) +
    '\x22>\x0a\x20\x20\x20\x20\x20\x20' +
    renderProjectPreview(_0x4c10b0) +
    '\n    </button>\n    ' +
    (confirmingDelete
      ? '<div class="storyboard-3d-home-project-delete-confirm" role="group" aria-label="确认删除项目 ' +
        escapeHtml(_0x4c10b0['title']) +
        '">\n          <button type="button" class="storyboard-3d-home-project-delete-confirm-button is-danger" data-storyboard-3d-home-action="confirm-project-delete" data-storyboard-3d-project-id="' +
        _0x2c576b +
        '">删除</button>\n          <button type="button" class="storyboard-3d-home-project-delete-confirm-button" data-storyboard-3d-home-action="cancel-project-delete" data-storyboard-3d-project-id="' +
        _0x2c576b +
        '\x22>取消</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>'
      : '<button type="button" class="storyboard-3d-home-project-more" data-storyboard-3d-home-action="toggle-project-menu" data-storyboard-3d-project-id="' +
        _0x2c576b +
        '" aria-label="' +
        escapeHtml(_0x4c10b0['title']) +
        '\x20的更多选项\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22' +
        menuOpen +
        '">\n          <span aria-hidden="true">•••</span>\n        </button>\n        <div class="storyboard-3d-home-project-menu" role="menu" aria-label="' +
        escapeHtml(_0x4c10b0['title']) +
        ' 的项目操作" ' +
        (menuOpen ? '' : 'hidden') +
        '>\n          <button type="button" role="menuitem" data-storyboard-3d-home-action="clone-project" data-storyboard-3d-project-id="' +
        _0x2c576b +
        '\x22>克隆</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20role=\x22menuitem\x22\x20data-storyboard-3d-home-action=\x22start-project-rename\x22\x20data-storyboard-3d-project-id=\x22' +
        _0x2c576b +
        '">重命名</button>\n          <button type="button" class="is-danger" role="menuitem" data-storyboard-3d-home-action="delete-project" data-storyboard-3d-project-id="' +
        _0x2c576b +
        '">删除</button>\n        </div>') +
    '\n    <span class="storyboard-3d-home-project-copy">\n      <span class="storyboard-3d-home-project-heading">\n        ' +
    (editing
      ? '<input\x20type=\x22text\x22\x20value=\x22' +
        escapeHtml(editingName) +
        '" maxlength="120" data-storyboard-3d-project-rename-input data-storyboard-3d-project-id="' +
        _0x2c576b +
        '" aria-label="重命名项目 ' +
        escapeHtml(_0x4c10b0['title']) +
        '\x22>'
      : '<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-home-project-title\x22\x20data-storyboard-3d-home-action=\x22start-project-rename\x22\x20data-storyboard-3d-project-id=\x22' +
        _0x2c576b +
        '" title="点击重命名"><strong>' +
        escapeHtml(_0x4c10b0['title']) +
        '</strong></button>') +
    '\n        <small>' +
    escapeHtml(formatStoryboard3DProjectUpdatedAt(_0x4c10b0['updatedAt'], { now: _0x3885c8 })) +
    '</small>\n      </span>\n      <button type="button" class="storyboard-3d-home-project-details" data-storyboard-3d-home-action="open-project" data-storyboard-3d-project-id="' +
    _0x2c576b +
    '" aria-label="打开项目 ' +
    escapeHtml(_0x4c10b0['title']) +
    '">\n        <span class="storyboard-3d-home-visually-hidden">' +
    escapeHtml(_0x4c10b0['title']) +
    '</span>\n        <span class="storyboard-3d-home-project-scene">当前场景 · ' +
    escapeHtml(_0x4c10b0['activeSceneName']) +
    '</span>\n        <span class="storyboard-3d-home-project-stats">\n          <span><b>' +
    _0x4c10b0['sceneCount'] +
    '</b> 场景</span>\n          <span><b>' +
    _0x4c10b0['shotCount'] +
    '</b> 镜头</span>\n          <span><b>' +
    _0x4c10b0['objectCount'] +
    '</b>\x20物体</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</span>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20</span>\x0a\x20\x20</article>'
  );
}
function renderHome({
  projects: _0x5ba904,
  searchQuery: _0x19c711,
  prompt: _0x3b1baf,
  modelId: _0x10a217,
  provider: _0x8c7946,
  isGenerating: _0x1b476c,
  generationStatus: _0x3ce440,
  generationError: _0x19e18f,
  modelPackStatus: _0x5a5660,
  modelPackDialogOpen: _0x5c0ca7,
  referenceImageUrl: _0x544e72,
  referenceImageName: _0x2760a1,
  referenceImages: referenceImages = [],
  openProjectMenuId: _0x24625c,
  editingProjectId: _0x81b846,
  editingProjectName: _0x29b421,
  confirmingDeleteProjectId: _0x4470e8,
}) {
  const _0x35c434 = Date['now'](),
    _0x809f92 = isStoryboard3DModelPackReady(_0x5a5660),
    _0x6e06aa = Boolean(normalizeText(_0x3b1baf) && _0x10a217 && _0x8c7946 && _0x809f92),
    _0x1422bc = _0x5a5660?.['state'] === 'installing',
    _0x298294 = Math['max'](
      0x0,
      Math['floor'](Number(_0x5a5660?.['assetCount']) || 0x0),
      Array['isArray'](_0x5a5660?.['assets']) ? _0x5a5660['assets']['length'] : 0x0,
    ),
    _0x5cc82a = formatModelPackSize(_0x5a5660?.['downloadBytes']),
    _0x372bd5 = getModelPackInstallProgress(_0x5a5660),
    _0x109582 = [
      _0x298294 ? _0x298294['toLocaleString']('zh-CN') + ' 项素材' : '',
      _0x5cc82a ? '约\x20' + _0x5cc82a : '',
    ]
      ['filter'](Boolean)
      ['join'](' · ');
  return (
    '<div\x20class=\x22storyboard-3d-workspace-home-page\x22>\x0a\x20\x20\x20\x20<section\x20class=\x22storyboard-3d-home-hero\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-home-eyebrow\x22>SHUO\x20Canvas\x20·\x20Previz\x20Studio</span>\x0a\x20\x20\x20\x20\x20\x20<h1>先在空间里走一遍，再把镜头交给生成模型</h1>\x0a\x20\x20\x20\x20\x20\x20<p>用场景、人物、道具和机位搭建可持续编辑的\x203D\x20预演项目，让镜头关系在生成前就清晰可控。</p>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-home-composer\x20' +
    (_0x1b476c ? 'is-generating' : '') +
    '" aria-busy="' +
    (_0x1b476c ? 'true' : 'false') +
    '">\n        <div class="storyboard-3d-home-prompt-wrap">\n          <label for="storyboard3DHomePrompt">描述想要搭建的 3D 场景</label>\n          <textarea id="storyboard3DHomePrompt" data-storyboard-3d-prompt-input maxlength="' +
    STORYBOARD_3D_PROMPT_MAX_CHARACTERS +
    '" placeholder="例如：雨夜的旧车站，站台中央有一张长椅，两个人隔着行李箱对坐，使用低机位中景。">' +
    escapeHtml(_0x3b1baf) +
    '</textarea>\n          <div class="storyboard-3d-home-prompt-meta">\n            <p>AI 会规划场景类型、可用素材、空间位置和首个镜头，生成后仍可逐项编辑。</p>\n            <span data-storyboard-3d-prompt-count>' +
    _0x3b1baf['length'] +
    ' / ' +
    STORYBOARD_3D_PROMPT_MAX_CHARACTERS +
    '</span>\n          </div>\n        </div>\n        <div class="storyboard-3d-home-model-bar">\n          ' +
    renderAIGenTextModelSelectorMarkup({
      modelId: _0x10a217,
      provider: _0x8c7946,
      getDisplayModelName: getDisplayModelName,
      className: 'storyboard-3d-home-text-model-selector',
      allowedModelIds: getStoryboard3DTextModelIds(),
    }) +
    '\n          <div class="storyboard-3d-home-composer-actions">\n            <input type="file" accept="image/*" multiple data-storyboard-3d-reference-image-input hidden>\n            <button type="button" class="storyboard-3d-home-reference-button" data-storyboard-3d-home-action="choose-reference-image">\n              <span aria-hidden="true">▧</span><span>参考图</span>\n            </button>\n            <button type="button" class="storyboard-3d-home-primary storyboard-3d-home-generate" data-storyboard-3d-home-action="generate-project" ' +
    (_0x6e06aa && !_0x1b476c ? '' : 'disabled') +
    '>\n              <span data-storyboard-3d-generate-label>' +
    escapeHtml(_0x1b476c ? _0x3ce440 || '正在创建\x203D\x20场景' : '生成 3D 场景') +
    '</span>\n              <span class="storyboard-3d-home-generate-arrow" aria-hidden="true">→</span>\n            </button>\n          </div>\n        </div>\n        ' +
    (referenceImages['length'] ? referenceImages : _0x544e72 ? [{ url: _0x544e72, name: _0x2760a1 }] : [])
      ['map'](
        (_0x49804e, _0x1f84f9) =>
          '<div class="storyboard-3d-home-reference-preview" data-storyboard-3d-reference-preview>\n              <img src="' +
          escapeHtml(_0x49804e['url']) +
          '\x22\x20alt=\x22参考图\x20' +
          (_0x1f84f9 + 0x1) +
          '">\n              <span><strong>' +
          escapeHtml(_0x49804e['name'] || '参考图') +
          '</strong><small>' +
          (_0x1f84f9 + 0x1) +
          ' / 6 · AI 估计人物、物品和空间关系</small></span>\n              <button type="button" data-storyboard-3d-home-action="remove-reference-image" data-reference-index="' +
          _0x1f84f9 +
          '\x22\x20aria-label=\x22移除参考图\x20' +
          (_0x1f84f9 + 0x1) +
          '">×</button>\n            </div>',
      )
      ['join']('') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    (!_0x809f92 && _0x5a5660?.['state'] !== 'checking'
      ? '<div class="storyboard-3d-home-model-pack-hint" role="status">需要先下载基础轻量模型包，场景 Agent 才能调用固定素材搭建场景。</div>'
      : '') +
    '\n        <div class="storyboard-3d-home-generation-error" data-storyboard-3d-generation-error role="alert" ' +
    (_0x19e18f ? '' : 'hidden') +
    '>' +
    escapeHtml(_0x19e18f) +
    '</div>\n        <div class="storyboard-3d-home-generation-loading storyboard-script-loading-overlay" data-storyboard-3d-generation-loading role="status" aria-live="polite" ' +
    (_0x1b476c ? '' : 'hidden') +
    '>\n          <div class="storyboard-script-loading-spinner"></div>\n          <div class="storyboard-script-loading-label" data-storyboard-3d-generation-loading-label>' +
    escapeHtml(_0x3ce440 || '正在创建\x203D\x20场景') +
    '</div>\n          <div class="storyboard-script-loading-bar"><div class="storyboard-script-loading-bar-fill"></div></div>\n        </div>\n      </div>\n    </section>\n\n    <section class="storyboard-3d-home-projects" aria-labelledby="storyboard3DHomeProjectsTitle">\n      <div class="storyboard-3d-home-section-heading">\n        <div>\n          <span class="storyboard-3d-home-eyebrow">独立项目 · ' +
    _0x5ba904['length'] +
    '</span>\n          <h2 id="storyboard3DHomeProjectsTitle">我的3D场景项目</h2>\n        </div>\n        ' +
    (_0x5ba904['length']
      ? '<label class="storyboard-3d-home-search">\n              <span aria-hidden="true">⌕</span>\n              <input type="search" value="' +
        escapeHtml(_0x19c711) +
        '" data-storyboard-3d-project-search-input placeholder="搜索项目或场景" aria-label="搜索 3D 场景项目">\n            </label>'
      : '') +
    '\n      </div>\n      ' +
    (_0x5ba904['length']
      ? '<div\x20class=\x22storyboard-3d-home-project-grid\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        _0x5ba904['map']((_0x19ff57) =>
          renderStoryboard3DProjectCard(_0x19ff57, _0x35c434, {
            menuOpen: _0x19ff57['projectId'] === _0x24625c,
            editing: _0x19ff57['projectId'] === _0x81b846,
            editingName: _0x19ff57['projectId'] === _0x81b846 ? _0x29b421 : _0x19ff57['title'],
            confirmingDelete: _0x19ff57['projectId'] === _0x4470e8,
          }),
        )['join']('') +
        '\n            <button type="button" class="storyboard-3d-home-create-card" data-storyboard-3d-home-action="new-project">\n              <span aria-hidden="true">+</span><strong>新建 3D 场景项目</strong><small>创建空场景与首个镜头</small>\n            </button>\n          </div>\n          <div class="storyboard-3d-home-search-empty" data-storyboard-3d-search-empty hidden>\n            <strong>没有找到匹配的项目</strong><span>换一个项目名称或场景名称试试。</span>\n          </div>'
      : '<div\x20class=\x22storyboard-3d-home-empty-projects\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>' +
        renderCubeIcon('storyboard-3d-home-empty-icon') +
        '</div>\n            <strong>还没有 3D 场景项目</strong>\n            <span>创建项目后，它会保存在当前用户项目数据中。</span>\n            <button type="button" class="storyboard-3d-home-primary" data-storyboard-3d-home-action="new-project">创建第一个项目</button>\n          </div>') +
    '\n    </section>\n    ' +
    (_0x5c0ca7
      ? '<div class="storyboard-3d-model-pack-backdrop" data-storyboard-3d-model-pack-dialog role="presentation">\n          <section class="storyboard-3d-model-pack-dialog" role="dialog" aria-modal="true" aria-labelledby="storyboard3DModelPackTitle">\n            <span class="storyboard-3d-model-pack-mark" aria-hidden="true">' +
        renderCubeIcon() +
        '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-home-eyebrow\x22>首次使用准备</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2\x20id=\x22storyboard3DModelPackTitle\x22>下载\x203D\x20场景基础模型包</h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>场景\x20Agent\x20只会调用这个固定的轻量素材库来搭建人物、家具和环境物品，不会在线搜索模型。素材以性能友好的中低复杂度模型为主，未下载时无法生成\x203D\x20场景。</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        (_0x109582 ? '<small>' + escapeHtml(_0x109582) + ' · 按需加载，不会一次性占用内存</small>' : '') +
        '\n              <small>下载渠道：本地服务通过 HTTPS 从 Kenney 官方与 OpenGameArt 镜像获取，并在安装前校验文件。</small>\n              ' +
        (_0x1422bc
          ? '<div class="storyboard-3d-model-pack-progress" data-storyboard-3d-model-pack-progress>\n                    <div class="storyboard-3d-model-pack-progress-heading">\n                      <strong>' +
            escapeHtml(getModelPackProgressMessage(_0x372bd5)) +
            '</strong>\n                      <span>' +
            Math['round'](_0x372bd5['percent']) +
            '%</span>\n                    </div>\n                    <progress max="100" value="' +
            _0x372bd5['percent'] +
            '" aria-label="模型包下载进度">' +
            Math['round'](_0x372bd5['percent']) +
            '%</progress>\n                    <div class="storyboard-3d-model-pack-progress-meta">\n                      <span>' +
            escapeHtml(formatDownloadedBytes(_0x372bd5['downloadedBytes'])) +
            ' / ' +
            escapeHtml(formatDownloadedBytes(_0x372bd5['totalBytes'])) +
            '</span>\n                      ' +
            (_0x372bd5['totalSources']
              ? '<span>' +
                _0x372bd5['completedSources'] +
                ' / ' +
                _0x372bd5['totalSources'] +
                '\x20个资源包</span>'
              : '') +
            '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
            (_0x372bd5['currentSource']
              ? '<small title="' +
                escapeHtml(_0x372bd5['currentSource']) +
                '\x22>下载源\x20·\x20' +
                escapeHtml(_0x372bd5['currentSource']) +
                '</small>'
              : '') +
            '\n                  </div>'
          : '') +
        '\n              ' +
        (_0x5a5660?.['error']
          ? '<small class="storyboard-3d-model-pack-error">' + escapeHtml(_0x5a5660['error']) + '</small>'
          : '') +
        '\n            </div>\n            <footer>\n              <button type="button" data-storyboard-3d-home-action="skip-model-pack" ' +
        (_0x1422bc ? 'disabled' : '') +
        '>暂不下载</button>\n              <button type="button" class="storyboard-3d-home-primary" data-storyboard-3d-home-action="install-model-pack" ' +
        (_0x1422bc ? 'disabled' : '') +
        '>' +
        (_0x1422bc ? '正在下载模型包…' : '下载模型包') +
        '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</footer>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</section>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>'
      : '') +
    '\x0a\x20\x20</div>'
  );
}
export class Storyboard3DWorkspaceHome {
  constructor({
    getProjects: _0x37bd08,
    onCreateProject: _0x4ccecf,
    onGenerateProject: _0x247ad2,
    onOpenProject: _0x41c183,
    onCloneProject: _0xa3f40e,
    onRenameProject: _0x2f1f50,
    onDeleteProject: _0x19a9e7,
    onNotify: _0x3f53ea,
    modelPackApi: modelPackApi = null,
    documentObject: documentObject = globalThis['document'],
    urlApi: urlApi = globalThis['URL'],
    setTimeoutFn: setTimeoutFn = globalThis['setTimeout'],
    clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout'],
    modelPackProgressPollIntervalMs: modelPackProgressPollIntervalMs = 0x15e,
  } = {}) {
    ((this['document'] = documentObject),
      (this['getProjects'] = _0x37bd08),
      (this['onCreateProject'] = _0x4ccecf),
      (this['onGenerateProject'] = _0x247ad2),
      (this['onOpenProject'] = _0x41c183),
      (this['onCloneProject'] = _0xa3f40e),
      (this['onRenameProject'] = _0x2f1f50),
      (this['onDeleteProject'] = _0x19a9e7),
      (this['onNotify'] = _0x3f53ea),
      (this['modelPackApi'] = modelPackApi),
      (this['urlApi'] = urlApi),
      (this['setTimeoutFn'] = setTimeoutFn),
      (this['clearTimeoutFn'] = clearTimeoutFn),
      (this['modelPackProgressPollIntervalMs'] = Math['min'](
        0x1f4,
        Math['max'](0xfa, Number(modelPackProgressPollIntervalMs) || 0x15e),
      )),
      (this['root'] = null),
      (this['searchQuery'] = ''),
      (this['prompt'] = ''));
    const _0xafa1bf = resolveStoryboard3DTextModelSelection();
    ((this['modelId'] = _0xafa1bf['modelId']),
      (this['provider'] = _0xafa1bf['provider']),
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
      (this['_modelPackProgressPollGeneration'] = 0x0),
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
    const _0x39711d = this['document']['createElement']('section');
    return (
      (_0x39711d['id'] = 'storyboard3DWorkspaceHome'),
      (_0x39711d['className'] = 'storyboard-3d-workspace-home'),
      (_0x39711d['hidden'] = !![]),
      _0x39711d['setAttribute']('aria-hidden', 'true'),
      _0x39711d['setAttribute']('aria-label', '3D 场景预演项目首页'),
      (_0x39711d['dataset']['uiStop'] = '1'),
      _0x39711d['addEventListener']('contextmenu', containWorkspaceContextMenu),
      _0x39711d['addEventListener']('pointerdown', (_0x41f260) => _0x41f260['stopPropagation']()),
      _0x39711d['addEventListener']('wheel', (_0x342c47) => _0x342c47['stopPropagation'](), {
        passive: !![],
      }),
      _0x39711d['addEventListener']('click', this['_handleClick']),
      _0x39711d['addEventListener']('input', this['_handleInput']),
      _0x39711d['addEventListener']('change', this['_handleChange']),
      _0x39711d['addEventListener']('keydown', this['_handleKeyDown']),
      this['document']['body']['appendChild'](_0x39711d),
      (this['root'] = _0x39711d),
      (this['_pricing'] = bindWorkspacePrices(_0x39711d, [
        {
          selector: '[data-storyboard-3d-home-action=\x22generate-project\x22]',
          getData: () => ({
            model: this['modelId'],
            provider: this['provider'],
            prompt: this['prompt'],
            hasReferences: this['referenceImages']['length'] > 0x0,
          }),
        },
      ])),
      (this['_destroyed'] = ![]),
      void this['_refreshModelPackStatus']({ promptIfMissing: ![] }),
      _0x39711d
    );
  }
  ['_readProjects']() {
    const _0x3e150b = this['getProjects']?.();
    return Array['isArray'](_0x3e150b) ? _0x3e150b : [];
  }
  ['render']() {
    if (!this['root']) return;
    const _0x10710e = this['root']['scrollTop'],
      _0x19e09e = this['root']['contains'](this['document']?.['activeElement'])
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
      (this['root']['scrollTop'] = _0x10710e));
    const _0x5ba970 = this['root']['querySelector']('[data-storyboard-3d-project-rename-input]');
    if (_0x5ba970) (_0x5ba970['focus'](), _0x5ba970['select']?.());
    else _0x19e09e && this['focusProject'](_0x19e09e);
  }
  ['_bindModelSelector']() {
    const _0x581968 = this['root']?.['querySelector']('[data-aigen-text-model-selector]');
    if (!_0x581968) return;
    this['_modelSelectorController'] = bindAIGenTextModelSelector(_0x581968, {
      modelId: this['modelId'],
      provider: this['provider'],
      getDisplayModelName: getDisplayModelName,
      documentObject: this['document'],
      onChange: ({ modelId: _0x4536c9 }) => {
        const _0x2f9779 = resolveStoryboard3DTextModelSelection(_0x4536c9);
        ((this['modelId'] = _0x2f9779['modelId']),
          (this['provider'] = _0x2f9779['provider']),
          this['_syncGenerationUi']());
      },
    });
  }
  ['_syncGenerationUi']() {
    this['_pricing']?.['syncPrices']();
    if (!this['root']) return;
    const _0x50607d = Boolean(
        normalizeText(this['prompt']) &&
        this['modelId'] &&
        this['provider'] &&
        isStoryboard3DModelPackReady(this['modelPackStatus']),
      ),
      _0xccd73c = this['root']['querySelector']('[data-storyboard-3d-home-action="generate-project"]');
    if (_0xccd73c) _0xccd73c['disabled'] = !_0x50607d || this['isGenerating'];
    const _0xdf67e9 = this['root']['querySelector']('[data-storyboard-3d-generate-label]');
    _0xdf67e9 &&
      (_0xdf67e9['textContent'] = this['isGenerating']
        ? this['generationStatus'] || '正在创建\x203D\x20场景'
        : '生成 3D 场景');
    const _0x1ee128 = this['root']['querySelector']('.storyboard-3d-home-composer');
    (_0x1ee128?.['classList']['toggle']('is-generating', this['isGenerating']),
      _0x1ee128?.['setAttribute']('aria-busy', this['isGenerating'] ? 'true' : 'false'));
    const _0x57d113 = this['root']['querySelector']('[data-storyboard-3d-generation-loading]');
    if (_0x57d113) _0x57d113['hidden'] = !this['isGenerating'];
    const _0x49a7b7 = this['root']['querySelector']('[data-storyboard-3d-generation-loading-label]');
    _0x49a7b7 && (_0x49a7b7['textContent'] = this['generationStatus'] || '正在创建 3D 场景');
    const _0x1e935b = this['root']['querySelector']('[data-storyboard-3d-generation-error]');
    _0x1e935b &&
      ((_0x1e935b['hidden'] = !this['generationError']),
      (_0x1e935b['textContent'] = this['generationError']));
    const _0x21e8ae = this['root']['querySelector']('[data-storyboard-3d-prompt-count]');
    _0x21e8ae &&
      (_0x21e8ae['textContent'] =
        this['prompt']['length'] + '\x20/\x20' + STORYBOARD_3D_PROMPT_MAX_CHARACTERS);
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
    const _0x2e560e = normalizeText(this['prompt']);
    if (!_0x2e560e)
      return ((this['generationError'] = '请先描述要搭建的 3D 场景。'), this['_syncGenerationUi'](), null);
    if (typeof this['onGenerateProject'] !== 'function')
      return ((this['generationError'] = '3D 场景生成功能尚未初始化。'), this['_syncGenerationUi'](), null);
    ((this['isGenerating'] = !![]),
      (this['generationStatus'] = '正在规划场景、物体与镜头'),
      (this['generationError'] = ''),
      this['_syncGenerationUi']());
    const _0x57b0df = this['referenceImages']
      ['filter']((_0x23fc64) => _0x23fc64['file'])
      ['map']((_0x1e31b5) => this['urlApi']['createObjectURL'](_0x1e31b5['file']));
    try {
      const _0x3fc1e7 = await this['onGenerateProject']({
        prompt: _0x2e560e,
        model: this['modelId'],
        provider: this['provider'],
        assets: this['modelPackStatus']['assets'],
        inputImageUrls: _0x57b0df['length']
          ? _0x57b0df
          : this['referenceImageUrl']
            ? [this['referenceImageUrl']]
            : [],
        onProgress: ({ message: _0x1a58ad } = {}) => {
          ((this['generationStatus'] = normalizeText(_0x1a58ad) || '正在创建 3D 场景'),
            this['_syncGenerationUi']());
        },
      });
      return (
        (this['isGenerating'] = ![]),
        (this['generationStatus'] = ''),
        this['onNotify']?.('3D 场景项目创建完成。', 'success'),
        this['_syncGenerationUi'](),
        _0x3fc1e7
      );
    } catch (_0x4bc198) {
      return (
        (this['isGenerating'] = ![]),
        (this['generationStatus'] = ''),
        (this['generationError'] = normalizeText(_0x4bc198?.['message']) || '3D 场景创建失败，请稍后重试。'),
        this['onNotify']?.(this['generationError'], 'error'),
        this['_syncGenerationUi'](),
        null
      );
    } finally {
      _0x57b0df['forEach']((_0x1b25f6) => this['urlApi']['revokeObjectURL'](_0x1b25f6));
    }
  }
  ['_applySearch']() {
    if (!this['root']) return;
    const _0xffe47f = normalizeSearchText(this['searchQuery']);
    let _0x37ecb3 = 0x0;
    this['root']['querySelectorAll']('[data-storyboard-3d-project-search]')['forEach']((_0x54e491) => {
      const _0x375052 = _0x54e491['getAttribute']('data-storyboard-3d-project-search') || '',
        _0x190458 = !_0xffe47f || _0x375052['includes'](_0xffe47f);
      _0x54e491['hidden'] = !_0x190458;
      if (_0x190458) _0x37ecb3 += 0x1;
    });
    const _0x133f75 = this['root']['querySelector']('[data-storyboard-3d-search-empty]');
    if (_0x133f75) _0x133f75['hidden'] = _0x37ecb3 > 0x0 || !_0xffe47f;
  }
  ['_findProject'](_0x5a1bd4) {
    const _0x4cdc20 = normalizeText(_0x5a1bd4);
    return this['_readProjects']()['find']((_0x40ca75) => _0x40ca75['projectId'] === _0x4cdc20) || null;
  }
  ['_cloneProject'](_0x5e6210) {
    const _0x108478 = this['_findProject'](_0x5e6210);
    if (!_0x108478) return ![];
    try {
      const _0x234eba = this['onCloneProject']?.(_0x108478['projectId']);
      if (!_0x234eba) return (this['onNotify']?.('克隆项目失败。', 'error'), ![]);
      return (this['onNotify']?.('已克隆：' + _0x108478['title'], 'success'), this['render'](), _0x234eba);
    } catch (_0x3a45ba) {
      return (this['onNotify']?.(_0x3a45ba?.['message'] || '克隆项目失败。', 'error'), ![]);
    }
  }
  ['_startProjectRename'](_0x2c9061) {
    const _0x21c237 = this['_findProject'](_0x2c9061);
    if (!_0x21c237) return ![];
    return (
      (this['openProjectMenuId'] = ''),
      (this['confirmingDeleteProjectId'] = ''),
      (this['editingProjectId'] = _0x21c237['projectId']),
      (this['editingProjectName'] = _0x21c237['title']),
      this['render'](),
      !![]
    );
  }
  ['_commitProjectRename']({ render: render = !![] } = {}) {
    const _0x43ce50 = this['editingProjectId'],
      _0x179a13 = this['_findProject'](_0x43ce50),
      _0x45d47f = normalizeText(this['editingProjectName'])['slice'](0x0, 0x78);
    if (!_0x179a13) return (this['_cancelProjectRename']({ render: render }), ![]);
    if (!_0x45d47f) {
      this['onNotify']?.('项目名称不能为空。', 'error');
      if (render) this['render']();
      return ![];
    }
    if (_0x45d47f === _0x179a13['title'])
      return (this['_cancelProjectRename']({ render: render }), _0x179a13);
    try {
      const _0x4c62d7 = this['onRenameProject']?.(_0x43ce50, _0x45d47f);
      if (!_0x4c62d7) {
        this['onNotify']?.('重命名项目失败。', 'error');
        if (render) this['render']();
        return ![];
      }
      ((this['editingProjectId'] = ''),
        (this['editingProjectName'] = ''),
        this['onNotify']?.('已重命名：' + _0x45d47f, 'success'));
      if (render) this['render']();
      return _0x4c62d7;
    } catch (_0x19eac3) {
      this['onNotify']?.(_0x19eac3?.['message'] || '重命名项目失败。', 'error');
      if (render) this['render']();
      return ![];
    }
  }
  ['_cancelProjectRename']({ render: render = !![] } = {}) {
    const _0x20b1cc = Boolean(this['editingProjectId']);
    ((this['editingProjectId'] = ''), (this['editingProjectName'] = ''));
    if (render && _0x20b1cc) this['render']();
    return _0x20b1cc;
  }
  ['_closeProjectMenu']() {
    if (!this['openProjectMenuId']) return ![];
    return (
      (this['openProjectMenuId'] = ''),
      this['root']
        ?.['querySelectorAll']('.storyboard-3d-home-project-card.is-menu-open')
        ['forEach']((_0x15e0c2) => _0x15e0c2['classList']['remove']('is-menu-open')),
      this['root']
        ?.['querySelectorAll']('.storyboard-3d-home-project-menu:not([hidden])')
        ['forEach']((_0x41dab3) => {
          _0x41dab3['hidden'] = !![];
        }),
      this['root']
        ?.['querySelectorAll']('[data-storyboard-3d-home-action="toggle-project-menu"]')
        ['forEach']((_0x37ace4) => _0x37ace4['setAttribute']('aria-expanded', 'false')),
      !![]
    );
  }
  ['_deleteProject'](_0x4f1678) {
    const _0x4ae1be = this['_findProject'](_0x4f1678);
    if (!_0x4ae1be || this['confirmingDeleteProjectId'] !== _0x4ae1be['projectId']) return ![];
    try {
      const _0x368303 = this['onDeleteProject']?.(_0x4ae1be['projectId']);
      if (!_0x368303) return (this['onNotify']?.('删除项目失败。', 'error'), this['render'](), ![]);
      return (
        (this['confirmingDeleteProjectId'] = ''),
        this['onNotify']?.('已删除：' + _0x4ae1be['title'], 'success'),
        this['render'](),
        !![]
      );
    } catch (_0x3c95b4) {
      return (this['onNotify']?.(_0x3c95b4?.['message'] || '删除项目失败。', 'error'), this['render'](), ![]);
    }
  }
  ['_startProjectDelete'](_0xc63193) {
    const _0x435b30 = this['_findProject'](_0xc63193);
    if (!_0x435b30) return ![];
    return (
      (this['openProjectMenuId'] = ''),
      this['_cancelProjectRename']({ render: ![] }),
      (this['confirmingDeleteProjectId'] = _0x435b30['projectId']),
      this['render'](),
      [
        ...(this['root']?.['querySelectorAll'](
          '[data-storyboard-3d-home-action=\x22confirm-project-delete\x22]',
        ) || []),
      ]
        ['find'](
          (_0x4cd1c0) =>
            _0x4cd1c0['getAttribute']('data-storyboard-3d-project-id') === _0x435b30['projectId'],
        )
        ?.['focus']?.(),
      !![]
    );
  }
  ['_cancelProjectDelete']({ render: render = !![], focusProjectId: focusProjectId = '' } = {}) {
    const _0x2d1e4e = this['confirmingDeleteProjectId'] || normalizeText(focusProjectId),
      _0x2bfcff = Boolean(this['confirmingDeleteProjectId']);
    this['confirmingDeleteProjectId'] = '';
    if (render && _0x2bfcff) this['render']();
    return (
      render &&
        _0x2d1e4e &&
        [
          ...(this['root']?.['querySelectorAll'](
            '[data-storyboard-3d-home-action=\x22toggle-project-menu\x22]',
          ) || []),
        ]
          ['find']((_0x395260) => _0x395260['getAttribute']('data-storyboard-3d-project-id') === _0x2d1e4e)
          ?.['focus']?.(),
      _0x2bfcff
    );
  }
  ['_handleClick'](_0x3e4fca) {
    const _0x43ef09 = _0x3e4fca['target']['closest']('[data-storyboard-3d-home-action]');
    if (!_0x43ef09 || !this['root']?.['contains'](_0x43ef09)) {
      this['_closeProjectMenu']();
      return;
    }
    const _0x350517 = _0x43ef09['getAttribute']('data-storyboard-3d-home-action'),
      _0x2304d0 = _0x43ef09['getAttribute']('data-storyboard-3d-project-id') || '';
    if (_0x350517 === 'toggle-project-menu') {
      (this['_cancelProjectDelete']({ render: ![] }),
        (this['openProjectMenuId'] = this['openProjectMenuId'] === _0x2304d0 ? '' : _0x2304d0),
        this['_cancelProjectRename']({ render: ![] }),
        this['render']());
      this['openProjectMenuId'] &&
        [...(this['root']?.['querySelectorAll']('[data-storyboard-3d-home-action="clone-project"]') || [])]
          ['find']((_0xa5e5e) => _0xa5e5e['getAttribute']('data-storyboard-3d-project-id') === _0x2304d0)
          ?.['focus']?.();
      return;
    }
    if (_0x350517 === 'clone-project') {
      ((this['openProjectMenuId'] = ''), this['_cloneProject'](_0x2304d0));
      return;
    }
    if (_0x350517 === 'start-project-rename') {
      this['_startProjectRename'](_0x2304d0);
      return;
    }
    if (_0x350517 === 'delete-project') {
      this['_startProjectDelete'](_0x2304d0);
      return;
    }
    if (_0x350517 === 'confirm-project-delete') {
      if (this['confirmingDeleteProjectId'] === _0x2304d0) this['_deleteProject'](_0x2304d0);
      return;
    }
    if (_0x350517 === 'cancel-project-delete') {
      this['_cancelProjectDelete']({ focusProjectId: _0x2304d0 });
      return;
    }
    this['_closeProjectMenu']();
    if (_0x350517 === 'choose-reference-image') {
      this['root']?.['querySelector']('[data-storyboard-3d-reference-image-input]')?.['click']();
      return;
    }
    if (_0x350517 === 'remove-reference-image') {
      const _0x235e39 = Number(_0x43ef09['dataset']['referenceIndex']);
      if (Number['isInteger'](_0x235e39) && this['referenceImages'][_0x235e39])
        (this['urlApi']?.['revokeObjectURL']?.(this['referenceImages'][_0x235e39]['url']),
          this['referenceImages']['splice'](_0x235e39, 0x1),
          (this['referenceImageUrl'] = this['referenceImages'][0x0]?.['url'] || ''),
          (this['referenceImageName'] = this['referenceImages'][0x0]?.['name'] || ''));
      else this['_clearReferenceImage']();
      this['render']();
      return;
    }
    if (_0x350517 === 'install-model-pack') {
      void this['_installModelPack']();
      return;
    }
    if (_0x350517 === 'skip-model-pack') {
      ((this['modelPackDialogOpen'] = ![]),
        (this['generationError'] = '未下载模型包，暂时不能生成\x203D\x20场景。'),
        this['render']());
      return;
    }
    if (_0x350517 === 'generate-project') {
      this['_generateProject']();
      return;
    }
    if (_0x350517 === 'new-project') {
      this['onCreateProject']?.();
      return;
    }
    _0x350517 === 'open-project' && this['onOpenProject']?.(_0x2304d0);
  }
  ['_handleInput'](_0x3f6816) {
    if (_0x3f6816['target']['matches']('[data-storyboard-3d-project-rename-input]')) {
      this['editingProjectName'] = String(_0x3f6816['target']['value'] || '')['slice'](0x0, 0x78);
      return;
    }
    if (_0x3f6816['target']['matches']('[data-storyboard-3d-prompt-input]')) {
      ((this['prompt'] = String(_0x3f6816['target']['value'] || '')['slice'](
        0x0,
        STORYBOARD_3D_PROMPT_MAX_CHARACTERS,
      )),
        (this['generationError'] = ''),
        this['_syncGenerationUi']());
      return;
    }
    if (!_0x3f6816['target']['matches']('[data-storyboard-3d-project-search-input]')) return;
    ((this['searchQuery'] = String(_0x3f6816['target']['value'] || '')), this['_applySearch']());
  }
  ['_handleChange'](_0x1e1b58) {
    if (_0x1e1b58['target']['matches']('[data-storyboard-3d-project-rename-input]')) {
      (this['_commitProjectRename']({ render: ![] }),
        this['setTimeoutFn']?.(() => {
          if (!this['_destroyed']) this['render']();
        }, 0x0));
      return;
    }
    if (!_0x1e1b58['target']['matches']('[data-storyboard-3d-reference-image-input]')) return;
    const _0x312372 = Array['from'](_0x1e1b58['target']['files'] || []);
    _0x1e1b58['target']['value'] = '';
    if (!_0x312372['length']) return;
    if (
      _0x312372['some'](
        (_0x544586) =>
          !String(_0x544586['type'] || '')
            ['toLowerCase']()
            ['startsWith']('image/') || _0x544586['size'] > 0x20 * 0x400 * 0x400,
      ) ||
      this['referenceImages']['length'] + _0x312372['length'] > 0x6
    ) {
      ((this['generationError'] = '最多添加 6 张参考图，每张图片不超过 32 MB。'),
        this['_syncGenerationUi']());
      return;
    }
    (this['referenceImages']['push'](
      ..._0x312372['map']((_0x5179e6) => ({
        file: _0x5179e6,
        url: this['urlApi']?.['createObjectURL']?.(_0x5179e6) || '',
        name: String(_0x5179e6['name'] || '参考图'),
      })),
    ),
      (this['referenceImageUrl'] = this['referenceImages'][0x0]?.['url'] || ''),
      (this['referenceImageName'] = this['referenceImages'][0x0]?.['name'] || ''),
      !this['referenceImageUrl'] && (this['generationError'] = '无法读取参考图，请重新选择。'),
      this['render']());
  }
  ['_clearReferenceImage']() {
    for (const _0x40ee14 of new Set(
      [this['referenceImageUrl'], ...this['referenceImages']['map']((_0x2ec954) => _0x2ec954['url'])][
        'filter'
      ](Boolean),
    ))
      this['urlApi']?.['revokeObjectURL']?.(_0x40ee14);
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
    const _0x5adefb = Promise['resolve'](this['modelPackApi']['getStatus']())
      ['then']((_0x3232c2) => {
        const _0x574dd0 = Array['isArray'](_0x3232c2?.['assets']) ? _0x3232c2['assets'] : [],
          _0x43f4d9 = _0x3232c2?.['installed'] === !![] && _0x574dd0['length'] > 0x0;
        return (
          (this['modelPackStatus'] = {
            ..._0x3232c2,
            state: _0x43f4d9 ? 'installed' : 'missing',
            installed: _0x43f4d9,
            assets: _0x574dd0,
            error: '',
          }),
          (this['modelPackDialogOpen'] = !_0x43f4d9 && this['_promptForMissingModelPack']),
          this['render'](),
          this['modelPackStatus']
        );
      })
      ['catch']((_0x34850e) => {
        this['modelPackStatus'] = {
          state: 'error',
          installed: ![],
          assets: [],
          error: normalizeText(_0x34850e?.['message']) || '无法检测模型包状态。',
        };
        if (this['_promptForMissingModelPack']) this['modelPackDialogOpen'] = !![];
        return (this['render'](), this['modelPackStatus']);
      })
      ['finally'](() => {
        this['_modelPackCheckPromise'] = null;
      });
    return ((this['_modelPackCheckPromise'] = _0x5adefb), _0x5adefb);
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
          downloadedBytes: 0x0,
          totalBytes: Math['max'](0x0, Number(this['modelPackStatus']['downloadBytes']) || 0x0),
          percent: 0x0,
          currentSource: '',
          completedSources: 0x0,
          totalSources: 0x0,
          message: '正在连接模型包下载源',
        },
      }),
      this['render']());
    try {
      const _0x30fe72 = this['modelPackApi']['install']();
      this['_startModelPackProgressPolling']();
      const _0x2b47de = await _0x30fe72,
        _0x26c54 = Array['isArray'](_0x2b47de?.['assets']) ? _0x2b47de['assets'] : [];
      if (_0x2b47de?.['installed'] !== !![] || _0x26c54['length'] === 0x0)
        throw new Error('模型包下载未完成，请重试。');
      return (
        this['_stopModelPackProgressPolling'](),
        (this['modelPackStatus'] = {
          ..._0x2b47de,
          state: 'installed',
          installed: !![],
          assets: _0x26c54,
          error: '',
        }),
        (this['modelPackDialogOpen'] = ![]),
        (this['generationError'] = ''),
        this['onNotify']?.('3D 场景基础模型包下载完成。', 'success'),
        this['render'](),
        this['modelPackStatus']
      );
    } catch (_0x58e56a) {
      this['_stopModelPackProgressPolling']();
      try {
        const _0x5e41ec = await this['modelPackApi']['getStatus']?.(),
          _0x647428 = Array['isArray'](_0x5e41ec?.['assets']) ? _0x5e41ec['assets'] : [];
        if (_0x5e41ec?.['installed'] === !![] && _0x647428['length'] > 0x0)
          return (
            (this['modelPackStatus'] = {
              ..._0x5e41ec,
              state: 'installed',
              installed: !![],
              assets: _0x647428,
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
          error: normalizeText(_0x58e56a?.['message']) || '模型包下载失败，请稍后重试。',
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
    const _0x37cdcf = ++this['_modelPackProgressPollGeneration'],
      _0x2b1c4b = async () => {
        if (
          this['_destroyed'] ||
          _0x37cdcf !== this['_modelPackProgressPollGeneration'] ||
          this['modelPackStatus']['state'] !== 'installing'
        )
          return;
        try {
          const _0x3706b4 = await this['modelPackApi']['getStatus']();
          if (
            this['_destroyed'] ||
            _0x37cdcf !== this['_modelPackProgressPollGeneration'] ||
            this['modelPackStatus']['state'] !== 'installing'
          )
            return;
          ((this['modelPackStatus'] = {
            ...this['modelPackStatus'],
            ..._0x3706b4,
            state: 'installing',
            installed: ![],
            assets: this['modelPackStatus']['assets'],
            error: '',
          }),
            this['render']());
        } catch {}
        if (
          this['_destroyed'] ||
          _0x37cdcf !== this['_modelPackProgressPollGeneration'] ||
          this['modelPackStatus']['state'] !== 'installing'
        )
          return;
        this['_modelPackProgressTimer'] = this['setTimeoutFn']?.(
          _0x2b1c4b,
          this['modelPackProgressPollIntervalMs'],
        );
      };
    void _0x2b1c4b();
  }
  ['_stopModelPackProgressPolling']() {
    ((this['_modelPackProgressPollGeneration'] += 0x1),
      this['_modelPackProgressTimer'] !== null &&
        (this['clearTimeoutFn']?.(this['_modelPackProgressTimer']),
        (this['_modelPackProgressTimer'] = null)));
  }
  ['_handleKeyDown'](_0x479726) {
    if (_0x479726['key'] === 'Escape' && this['confirmingDeleteProjectId']) {
      (_0x479726['preventDefault'](), this['_cancelProjectDelete']());
      return;
    }
    if (_0x479726['target']['matches']('[data-storyboard-3d-project-rename-input]')) {
      if (_0x479726['isComposing']) return;
      if (_0x479726['key'] === 'Enter')
        (_0x479726['preventDefault'](),
          (this['editingProjectName'] = String(_0x479726['target']['value'] || '')['slice'](0x0, 0x78)),
          this['_commitProjectRename']());
      else _0x479726['key'] === 'Escape' && (_0x479726['preventDefault'](), this['_cancelProjectRename']());
      return;
    }
    if (!_0x479726['target']['matches']('[data-storyboard-3d-prompt-input]')) return;
    if (
      _0x479726['isComposing'] ||
      _0x479726['key'] !== 'Enter' ||
      (!_0x479726['ctrlKey'] && !_0x479726['metaKey'])
    )
      return;
    (_0x479726['preventDefault'](), this['_generateProject']());
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
  ['focusProject'](_0x148120) {
    const _0x214367 = String(_0x148120 || '')['trim']();
    if (!_0x214367 || !this['root'] || this['root']['hidden']) return ![];
    const _0x4544ae = [
      ...this['root']['querySelectorAll'](
        '.storyboard-3d-home-project-details[data-storyboard-3d-home-action=\x22open-project\x22]',
      ),
    ]['find']((_0x1a9163) => _0x1a9163['getAttribute']('data-storyboard-3d-project-id') === _0x214367);
    if (!_0x4544ae || typeof _0x4544ae['focus'] !== 'function') return ![];
    return (_0x4544ae['focus']({ preventScroll: !![] }), !![]);
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
export function initStoryboard3DWorkspaceHome(_0x43229a = {}) {
  const _0x3b56f1 = new Storyboard3DWorkspaceHome(_0x43229a);
  return (_0x3b56f1['mount'](), _0x3b56f1);
}
