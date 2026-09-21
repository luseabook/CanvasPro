import appStore from '../core/stores/appStore.js';
import { submitTask } from '../core/generationTaskRuntime.js';
import { resolveGenerationButtonMode } from '../core/generationTaskUiState.js';
import {
  buildCanonicalStoryboardScriptJson,
  createDefaultStoryboardScriptState,
  getStoryboardScriptDisplayColumns,
  getStoryboardScriptDefaultName,
  normalizeStoryboardScriptSelectedRowIndexes,
  normalizeStoryboardScriptMediaMode,
  normalizeStoryboardScriptViewMode,
  resolveStoryboardScriptResizeMinSize,
  serializeCanonicalStoryboardScriptJson,
  serializeStoryboardScriptRowsToCsv,
  STORYBOARD_SCRIPT_COLUMNS,
  STORYBOARD_SCRIPT_TABLE_EXPORT_MIME,
  STORYBOARD_SCRIPT_TEXT_MODEL,
  STORYBOARD_SCRIPT_TEXT_PROVIDER,
} from '../core/storyboardScriptFactory.js';
import { generateId } from '../core/math.js';
import {
  buildStoryboardScriptImageSystemPrompt,
  buildStoryboardScriptImagePrompt,
  buildStoryboardScriptPrompt,
  buildStoryboardScriptTextOnlySystemPrompt,
  buildStoryboardScriptTextOnlyPrompt,
  buildStoryboardScriptVideoSystemPrompt,
  buildStoryboardScriptVideoPrompt,
  extractRequestedStoryboardShotCount,
  normalizeStoryboardScriptGenerationResult,
  STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION,
} from '../core/storyboardScriptGeneration.js';
import { getModelManifest, resolveModelManifest, sanitizeModelUiSchemaParams } from '../manifests/index.js';
import { activateMenuKeyboard } from '../modules/floatingMenuKeyboard.js';
import {
  getPromptAssetInputRefsFromNode,
  _rehydratePromptPills,
  resolvePromptTextWithTextRefs,
} from '../modules/nodePromptShared.js';
import { resolveEffectiveInputKind } from '../modules/modelInputPolicy.js';
import { commit } from '../modules/history.js';
import { resetGenerateButtonIdleUi, setGenerateButtonLoadingUi } from '../modules/previewGenerateButtonUi.js';
import { getNanoBananaSelectionFromModel } from '../modules/nanoBananaModeRules.js';
import { getAIGenerationDefaultSizeByType } from '../services/fileService.js';
import { resolveGenerationInputImageUrl } from '../services/imageReferenceUrlService.js';
import { resolveCanvasVideoUrl } from '../services/canvasMediaLocalService.js';
import { sanitizePromptHtml } from '../utils/dom.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { generateText } from '../../api/aiTextApi.js';
import {
  extractStoryboardVideoFramesFromServer,
  STORYBOARD_VIDEO_FRAME_LIMIT,
} from '../../api/storyboardVideoFrameApi.js';
import { getDisplayModelName } from '../modules/providers.js';
import { createBatchSpawnLayoutNearNode } from '../modules/nodeSpawn.js';
import { DEFAULT_IMAGE_NODE_MODEL, DEFAULT_IMAGE_NODE_PROVIDER } from './aigenImage/defaults.js';
import {
  bindImageModelMenuSubmenu,
  buildImageDisplayRatioResizePatch,
  buildImageModelMenuHTML,
  renderImageModelTriggerIconHTML,
  resolveApimartImageMenuSelection,
  resolveGrsaiImageMenuSelection,
  resolveRunningHubModelImageMenuSelection,
  resolveRunningHubWorkflowImageMenuSelection,
  resolveVolcengineImageMenuSelection,
  setImageModelTriggerIcon,
} from './aigenImage/uiModuleModelHelpers.js';
import { bindDreaminaImageMenu, normalizeDreaminaImageModel } from './aigenImage/dreaminaModelMenuHelper.js';
import {
  bindModelUiSchemaControls,
  buildModelUiSchemaDefaultParams,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  syncModelUiSchemaControls,
} from './aigenImage/uiSchemaRenderer.js';
import { buildTextModelSmallIconHTML } from './aigenText/apimartTextModelMenu.js';
import { createNodeResizeHandle } from './aigenText/nodeResizeUi.js';
import { _renderSharedRefBar } from './AIGenTextNode.js';
import { closeNodeFooterMenus } from './shared/nodeFooterControls.js';
import { buildSharedPromptPanel } from './sharedPromptPanel.js';
import { t } from '../i18n/index.js';
const CARD_FIELDS = Object.freeze([
    '景别',
    '场景',
    '画面描述',
    '角色',
    '角色描述',
    '角色动作',
    '情绪',
    '角色图',
    '参考',
    '图片提示词',
    '视频提示词',
    '对白',
    '音效',
  ]),
  CARD_FIELD_KEYS = new Set(CARD_FIELDS),
  NARROW_TABLE_COLUMNS = new Set(['镜号', '时长']),
  COMPACT_TABLE_COLUMNS = new Set(['景别', '场景', '情绪']),
  WIDE_TABLE_COLUMNS = new Set(['画面描述', '角色描述', '图片提示词', '视频提示词']),
  STORYBOARD_TOOLBAR_GENERATE_ICON_HTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16"/><path d="M3 9h18"/><path d="M3 14h18"/><path d="M13 17l2 2 4-4"/></svg>',
  STORYBOARD_TOOLBAR_FULLSCREEN_ICON_HTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/></svg>',
  STORYBOARD_TOOLBAR_DOWNLOAD_ICON_HTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  STORYBOARD_QUEUE_ICON_HTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/></svg>',
  STORYBOARD_COLUMN_I18N_KEYS = Object.freeze({
    镜号: 'shotNo',
    时长: 'duration',
    景别: 'shotSize',
    场景: 'scene',
    画面描述: 'visualDescription',
    角色: 'character',
    角色描述: 'characterDescription',
    角色动作: 'characterAction',
    情绪: 'emotion',
    角色图: 'characterImage',
    参考: 'reference',
    图片提示词: 'imagePrompt',
    视频提示词: 'videoPrompt',
    对白: 'dialogue',
    音效: 'soundEffect',
  }),
  STORYBOARD_IMAGE_BATCH_PADDING = 30,
  STORYBOARD_IMAGE_BATCH_TITLE_HEIGHT = 20;
function storyboardScriptText(_0x1a211e, _0x934595 = {}) {
  return t('storyboardScript.' + _0x1a211e, _0x934595);
}
function getStoryboardColumnLabel(_0x3a064e, _0x1e7192 = '') {
  const _0x431b7a = STORYBOARD_COLUMN_I18N_KEYS[String(_0x3a064e || '')];
  if (!_0x431b7a) return String(_0x1e7192 || _0x3a064e || '');
  return storyboardScriptText('columns.' + _0x431b7a);
}
const getStateSnapshot = () =>
  typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function getSelectedRowIndexes(_0x1aa9a2) {
  return normalizeStoryboardScriptSelectedRowIndexes(
    _0x1aa9a2?.selectedRowIndexes,
    Array.isArray(_0x1aa9a2?.rows) ? _0x1aa9a2.rows.length : 0,
  );
}
function resolveStoryboardColumnDensity(_0x56e786) {
  const _0x3d5620 = String(_0x56e786 || '');
  if (NARROW_TABLE_COLUMNS.has(_0x3d5620)) return 'narrow';
  if (COMPACT_TABLE_COLUMNS.has(_0x3d5620)) return 'compact';
  if (WIDE_TABLE_COLUMNS.has(_0x3d5620)) return 'wide';
  return 'normal';
}
function getStoryboardColumnsForMediaMode(_0x129743, _0x53931a = []) {
  return getStoryboardScriptDisplayColumns({ mediaMode: _0x129743, rows: _0x53931a });
}
function getStoryboardCardFieldsForMediaMode(_0x1d6d62, _0x3781c7 = []) {
  return getStoryboardScriptDisplayColumns({ mediaMode: _0x1d6d62, rows: _0x3781c7 })
    .map((_0x73f6dd) => _0x73f6dd.key)
    .filter((_0x418f77) => CARD_FIELD_KEYS.has(_0x418f77));
}
function formatCellValue(_0x373189) {
  if (_0x373189 == null) return '';
  if (typeof _0x373189 === 'string') return _0x373189;
  if (typeof _0x373189 === 'number' || typeof _0x373189 === 'boolean') return String(_0x373189);
  try {
    return JSON.stringify(_0x373189);
  } catch {
    return String(_0x373189);
  }
}
const STORYBOARD_IMAGE_PLACEHOLDER_PATTERN = /@图片\d+/g;
function normalizeStoryboardImagePlaceholder(_0x4759cc) {
  return String(_0x4759cc || '')
    .trim()
    .replace(/\s+/g, '');
}
function extractStoryboardImagePlaceholders(_0x2a5029) {
  return String(_0x2a5029 || '').match(STORYBOARD_IMAGE_PLACEHOLDER_PATTERN) || [];
}
function extractGeneratedText(_0x45a252) {
  if (typeof _0x45a252 === 'string') return _0x45a252;
  return String(
    _0x45a252?.text ||
      _0x45a252?.outputText ||
      _0x45a252?.output ||
      _0x45a252?.content ||
      _0x45a252?.message ||
      '',
  );
}
function getStoryboardImagePlaceholder(_0x3ea5a4) {
  return '@图片' + Math.max(1, Math.trunc(Number(_0x3ea5a4) || 1));
}
function getStoryboardVideoPlaceholder(_0x33cc22) {
  return '@视频' + Math.max(1, Math.trunc(Number(_0x33cc22) || 1));
}
function buildStoryboardImageRefMap(_0x1e36b = []) {
  const _0x52f843 = Array.isArray(_0x1e36b) ? _0x1e36b : [],
    _0x20e35a = new Map();
  return (
    _0x52f843.forEach((_0x503693, _0x4131fe) => {
      const _0x1f0cf1 =
          normalizeStoryboardImagePlaceholder(_0x503693?.label) ||
          getStoryboardImagePlaceholder(_0x4131fe + 1),
        _0x354cd0 = String(_0x503693?.url || '').trim();
      if (!_0x1f0cf1 || !_0x354cd0) return;
      _0x20e35a.set(_0x1f0cf1, { ..._0x503693, label: _0x1f0cf1, url: _0x354cd0 });
    }),
    _0x20e35a
  );
}
function mergeStoryboardImageRefs(..._0x1c8c6b) {
  const _0x4e5cd3 = [],
    _0x4e53c5 = new Set();
  return (
    _0x1c8c6b.flat().forEach((_0x2cd760) => {
      const _0x36803f = normalizeStoryboardImagePlaceholder(_0x2cd760?.label),
        _0xf61c22 = String(_0x2cd760?.url || '').trim();
      if (!_0x36803f || !_0xf61c22 || _0x4e53c5.has(_0x36803f)) return;
      (_0x4e53c5.add(_0x36803f),
        _0x4e5cd3.push({ ..._0x2cd760, label: _0x36803f, url: _0xf61c22, type: 'image' }));
    }),
    _0x4e5cd3
  );
}
function pickStoryboardIndexedItem(_0x51b1dc, _0x44c616) {
  if (!Array.isArray(_0x51b1dc) || _0x51b1dc.length === 0) return null;
  const _0x38471f = Number.isFinite(Number(_0x44c616)) ? Math.max(0, Math.trunc(Number(_0x44c616))) : 0;
  return _0x51b1dc[Math.min(_0x38471f, _0x51b1dc.length - 1)] || null;
}
function toStoryboardUsableMediaUrl(_0x9c0e75) {
  const _0x34d484 = String(_0x9c0e75 || '').trim();
  if (!_0x34d484) return '';
  if (/^(?:https?:|blob:|data:|\/)/i.test(_0x34d484)) return _0x34d484;
  return localPathToUrl(_0x34d484) || '';
}
function resolveStoryboardVideoRefUrl(_0x5012cc = {}) {
  const _0x5b3024 = pickStoryboardIndexedItem(_0x5012cc?.videos, _0x5012cc?.mainVideoIndex),
    _0x4bf251 = [
      resolveCanvasVideoUrl(_0x5b3024),
      resolveCanvasVideoUrl(_0x5012cc),
      _0x5b3024?.videoUrl,
      _0x5b3024?.url,
      _0x5b3024?.src,
      _0x5b3024?.localPath,
      _0x5012cc?.videoUrl,
      _0x5012cc?.url,
      _0x5012cc?.src,
      _0x5012cc?.localPath,
    ];
  return _0x4bf251.map((_0x5231ff) => toStoryboardUsableMediaUrl(_0x5231ff)).find(Boolean) || '';
}
function createStoryboardRoleImagePreview(_0x4c4eec, _0x18ad7f = new Map()) {
  const _0x56ba28 = extractStoryboardImagePlaceholders(_0x4c4eec),
    _0x58473b = _0x56ba28
      .map((_0x4a5066) => _0x18ad7f.get(normalizeStoryboardImagePlaceholder(_0x4a5066)))
      .filter((_0x158c8e) => _0x158c8e?.url);
  if (_0x58473b.length === 0) return null;
  const _0x5bd41a = document.createElement('span');
  ((_0x5bd41a.className = 'storyboard-script-role-images'),
    _0x58473b.slice(0, 3).forEach((_0x4859cc) => {
      const _0x451fc8 = document.createElement('img');
      ((_0x451fc8.className = 'storyboard-script-role-image-thumb'),
        (_0x451fc8.src = _0x4859cc.url),
        (_0x451fc8.alt = _0x4859cc.label || getStoryboardColumnLabel('角色图')),
        (_0x451fc8.loading = 'lazy'),
        (_0x451fc8.draggable = false),
        (_0x451fc8.title = _0x4859cc.label || ''),
        _0x5bd41a.appendChild(_0x451fc8));
    }));
  if (_0x58473b.length > 3) {
    const _0x2029b6 = document.createElement('span');
    ((_0x2029b6.className = 'storyboard-script-role-image-more'),
      (_0x2029b6.textContent = '+' + (_0x58473b.length - 3)),
      _0x5bd41a.appendChild(_0x2029b6));
  }
  return _0x5bd41a;
}
function appendStoryboardCellDisplay(_0x1357d6, _0x464d68, _0x41418c, _0x576c96 = new Map()) {
  const _0x45fd55 = formatCellValue(_0x41418c);
  ((_0x1357d6.dataset.storyboardRawValue = _0x45fd55),
    _0x1357d6.replaceChildren(),
    _0x1357d6.classList.remove('storyboard-script-image-cell'));
  if (_0x464d68 === '角色图' || _0x464d68 === '参考') {
    const _0x17b153 = createStoryboardRoleImagePreview(_0x45fd55, _0x576c96);
    if (_0x17b153) {
      (_0x1357d6.classList.add('storyboard-script-image-cell'), _0x1357d6.appendChild(_0x17b153));
      return;
    }
  }
  _0x1357d6.textContent = _0x45fd55;
}
function buildStoryboardBodyRenderSignature(_0x3f28f6, _0x2af5f0 = []) {
  const _0x321c54 = mergeStoryboardImageRefs(_0x2af5f0, _0x3f28f6?.referenceImageRefs).map((_0x11d801) => ({
    label: normalizeStoryboardImagePlaceholder(_0x11d801?.label),
    url: String(_0x11d801?.url || '').trim(),
  }));
  try {
    return JSON.stringify({
      viewMode: normalizeStoryboardScriptViewMode(_0x3f28f6?.viewMode),
      mediaMode: normalizeStoryboardScriptMediaMode(_0x3f28f6?.mediaMode),
      selectionMode: _0x3f28f6?.selectionMode === true,
      rows: Array.isArray(_0x3f28f6?.rows) ? _0x3f28f6.rows : [],
      refs: _0x321c54,
    });
  } catch {
    return '' + Date.now();
  }
}
function collectDirectStoryboardImageRefs(_0x3393aa = [], _0x5c70e8 = {}) {
  const _0x45c938 = [];
  for (const _0xca95c0 of Array.isArray(_0x3393aa) ? _0x3393aa : []) {
    const _0x5de0ef = _0x5c70e8?.[_0xca95c0?.sourceId];
    if (!_0x5de0ef) continue;
    if (resolveEffectiveInputKind(_0x5de0ef, _0xca95c0) !== 'image') continue;
    const _0x4166b6 = resolveGenerationInputImageUrl(_0x5de0ef);
    if (!_0x4166b6) continue;
    _0x45c938.push({
      label: getStoryboardImagePlaceholder(_0x45c938.length + 1),
      url: _0x4166b6,
      type: 'image',
      sourceId: String(_0xca95c0?.sourceId || ''),
      source: 'node',
    });
  }
  return _0x45c938;
}
function collectDirectStoryboardVideoRefs(_0x267c74 = [], _0x5511d2 = {}) {
  const _0x315c12 = [];
  for (const _0x3aea51 of Array.isArray(_0x267c74) ? _0x267c74 : []) {
    const _0x5f0b5b = _0x5511d2?.[_0x3aea51?.sourceId];
    if (!_0x5f0b5b) continue;
    if (resolveEffectiveInputKind(_0x5f0b5b, _0x3aea51) !== 'video') continue;
    const _0x5323b7 = resolveStoryboardVideoRefUrl(_0x5f0b5b);
    if (!_0x5323b7) continue;
    _0x315c12.push({
      label: getStoryboardVideoPlaceholder(_0x315c12.length + 1),
      url: _0x5323b7,
      type: 'video',
      sourceId: String(_0x3aea51?.sourceId || ''),
      source: 'node',
    });
  }
  return _0x315c12;
}
function normalizeStoryboardImageInputRefs({
  directImageRefs: directImageRefs = [],
  promptAssetRefs: promptAssetRefs = [],
  hiddenAssetRefs: hiddenAssetRefs = [],
} = {}) {
  const _0x3084a1 = [],
    _0x36e12f = (_0x50e520, _0x241f3d = '') => {
      const _0x59bda3 = String(_0x50e520?.url || '').trim();
      if (!_0x59bda3) return;
      const _0x573a43 =
        String(_0x50e520?.placeholder || _0x50e520?.label || _0x241f3d || '').trim() ||
        getStoryboardImagePlaceholder(_0x3084a1.length + 1);
      _0x3084a1.push({ ..._0x50e520, label: _0x573a43, url: _0x59bda3, type: 'image' });
    };
  return (
    directImageRefs.forEach((_0xa51162) => _0x36e12f(_0xa51162, _0xa51162?.label)),
    promptAssetRefs
      .filter((_0xf1093b) => _0xf1093b?.type === 'image')
      .forEach((_0x13d747) => _0x36e12f({ ..._0x13d747, label: '' }, _0x13d747?.placeholder)),
    hiddenAssetRefs
      .filter((_0x15b51b) => _0x15b51b?.type === 'image')
      .forEach((_0xdfcfb3) => {
        _0x36e12f({ ..._0xdfcfb3, label: '' }, getStoryboardImagePlaceholder(_0x3084a1.length + 1));
      }),
    _0x3084a1.map((_0xf1b048, _0x30bca1) => ({
      ..._0xf1b048,
      label: _0xf1b048.label || getStoryboardImagePlaceholder(_0x30bca1 + 1),
    }))
  );
}
function normalizeStoryboardVideoInputRefs({
  directVideoRefs: directVideoRefs = [],
  promptAssetRefs: promptAssetRefs = [],
  hiddenAssetRefs: hiddenAssetRefs = [],
} = {}) {
  const _0x13d6c9 = [],
    _0x4adec6 = (_0x2d187a, _0x16bca0 = '') => {
      const _0x501cfd = String(_0x2d187a?.url || '').trim();
      if (!_0x501cfd) return;
      const _0x759d52 =
        String(_0x2d187a?.placeholder || _0x2d187a?.label || _0x16bca0 || '').trim() ||
        getStoryboardVideoPlaceholder(_0x13d6c9.length + 1);
      _0x13d6c9.push({ ..._0x2d187a, label: _0x759d52, url: _0x501cfd, type: 'video' });
    };
  return (
    directVideoRefs.forEach((_0x207f44) => _0x4adec6(_0x207f44, _0x207f44?.label)),
    promptAssetRefs
      .filter((_0x36f913) => _0x36f913?.type === 'video')
      .forEach((_0x5bdefe) => _0x4adec6({ ..._0x5bdefe, label: '' }, _0x5bdefe?.placeholder)),
    hiddenAssetRefs
      .filter((_0x102969) => _0x102969?.type === 'video')
      .forEach((_0x4d9247) => {
        _0x4adec6({ ..._0x4d9247, label: '' }, getStoryboardVideoPlaceholder(_0x13d6c9.length + 1));
      }),
    _0x13d6c9.map((_0x327379, _0x1920f2) => ({
      ..._0x327379,
      label: _0x327379.label || getStoryboardVideoPlaceholder(_0x1920f2 + 1),
    }))
  );
}
function buildStoryboardReferenceSummary({
  imageLabels: imageLabels = [],
  videoLabels: videoLabels = [],
} = {}) {
  const _0x152e6d = [];
  return (
    Array.isArray(imageLabels) &&
      imageLabels.length > 0 &&
      _0x152e6d.push('参考图片：' + imageLabels.join('、')),
    Array.isArray(videoLabels) &&
      videoLabels.length > 0 &&
      _0x152e6d.push('参考视频：' + videoLabels.join('、')),
    _0x152e6d.join('\n')
  );
}
function formatStoryboardVideoTime(_0x395fbc) {
  const _0x15d127 = Math.max(0, Number(_0x395fbc) || 0),
    _0x4ffa13 = Math.floor(_0x15d127),
    _0x2e8e66 = Math.floor(_0x4ffa13 / 60),
    _0x4db5fe = _0x4ffa13 % 60,
    _0x1008dd = Math.round((_0x15d127 - _0x4ffa13) * 10);
  return String(_0x2e8e66).padStart(2, '0') + ':' + String(_0x4db5fe).padStart(2, '0') + '.' + _0x1008dd;
}
function formatStoryboardVideoTimeRange(_0x247050 = {}) {
  const _0x55d799 = formatStoryboardVideoTime(_0x247050.start),
    _0x3d3d37 = formatStoryboardVideoTime(
      Number(_0x247050.end) > Number(_0x247050.start) ? _0x247050.end : _0x247050.captureTime,
    );
  return _0x55d799 + '-' + _0x3d3d37;
}
function buildStoryboardVideoFrameReferenceSummary(_0x4af746 = []) {
  const _0x23e244 = Array.isArray(_0x4af746) ? _0x4af746 : [];
  if (_0x23e244.length === 0) return '';
  return _0x23e244
    .map((_0x2e1900) => {
      const _0x2d10e9 = normalizeStoryboardImagePlaceholder(_0x2e1900?.label),
        _0x16ffad = String(_0x2e1900?.videoLabel || '@视频1').trim(),
        _0x3b7075 = String(_0x2e1900?.timeRange || '').trim(),
        _0x548085 = _0x2e1900?.sentAsImage === false ? '（仅提供时间码，画面请结合原视频判断）' : '';
      return _0x2d10e9 + '：来自 ' + _0x16ffad + (_0x3b7075 ? ' ' + _0x3b7075 : '') + _0x548085;
    })
    .filter(Boolean)
    .join('\n');
}
function getStoryboardModelImageInputLimit(_0x1a3e2b, _0x1811d8) {
  const _0x1ac91b = getModelManifest(_0x1a3e2b, _0x1811d8),
    _0x1f71af = Number(_0x1ac91b?.inputSlots?.maxByKind?.image);
  return Number.isFinite(_0x1f71af) && _0x1f71af > 0 ? Math.trunc(_0x1f71af) : STORYBOARD_VIDEO_FRAME_LIMIT;
}
function chunkStoryboardFrameRefs(_0x351efd = [], _0x30a275 = STORYBOARD_VIDEO_FRAME_LIMIT) {
  const _0x12ddda = Array.isArray(_0x351efd) ? _0x351efd : [],
    _0x8b942b = Math.max(1, Math.trunc(Number(_0x30a275) || 1)),
    _0x3f8a2b = [];
  for (let _0x3ad4ec = 0; _0x3ad4ec < _0x12ddda.length; _0x3ad4ec += _0x8b942b) {
    _0x3f8a2b.push(_0x12ddda.slice(_0x3ad4ec, _0x3ad4ec + _0x8b942b));
  }
  return _0x3f8a2b;
}
function buildCombinedStoryboardBatchJson({
  rows: rows = [],
  title: title = getStoryboardScriptDefaultName(),
} = {}) {
  const _0xbc6ac8 = (Array.isArray(rows) ? rows : []).map((_0x4e799f, _0x416962) => ({
    ..._0x4e799f,
    镜号: String(_0x416962 + 1),
  }));
  return JSON.stringify(
    {
      schemaVersion: STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION,
      type: 'storyboard-script',
      sourceMode: 'video',
      title: String(title || getStoryboardScriptDefaultName()).trim() || getStoryboardScriptDefaultName(),
      detectedIntent: { shotCount: _0xbc6ac8.length, language: 'zh-CN' },
      rows: _0xbc6ac8,
    },
    null,
    2,
  );
}
async function runStoryboardScriptGenerationPayload(_0x4a8c0a) {
  const _0x417104 = Array.isArray(_0x4a8c0a?.videoFrameBatches)
    ? _0x4a8c0a.videoFrameBatches.filter((_0x570487) => Array.isArray(_0x570487) && _0x570487.length > 0)
    : [];
  if (_0x4a8c0a?.sourceMode !== 'video' || _0x417104.length <= 1) return generateText(_0x4a8c0a);
  const _0xd94cd0 = [];
  let _0x54f1d0 = '';
  for (const _0x558e3f of _0x417104) {
    const _0xc1aa8a = _0x558e3f.map((_0x17b6f3) => _0x17b6f3.url).filter(Boolean),
      _0x113241 = buildStoryboardScriptVideoPrompt(_0x4a8c0a.rawPromptText || '', {
        videoCount: Array.isArray(_0x4a8c0a.inputVideoUrls) ? _0x4a8c0a.inputVideoUrls.length : 0,
        videoLabels: _0x4a8c0a.videoLabels,
        videoFrameSummary: buildStoryboardVideoFrameReferenceSummary(
          _0x558e3f.map((_0x939c55) => ({ ..._0x939c55, sentAsImage: true })),
        ),
      }),
      _0x3ebfa8 = await generateText({
        ..._0x4a8c0a,
        prompt: _0x113241,
        inputImageUrls: _0xc1aa8a,
        inputUrls: [..._0xc1aa8a, ...(_0x4a8c0a.inputVideoUrls || [])],
      }),
      _0x42ba12 = normalizeStoryboardScriptGenerationResult(extractGeneratedText(_0x3ebfa8).trim(), {
        requireMarker: true,
        sourceMode: 'video',
      });
    if (!_0x42ba12.ok) throw new Error(storyboardScriptText('errors.invalidJsonTooManyFrames'));
    if (!_0x54f1d0) _0x54f1d0 = _0x42ba12.title;
    _0xd94cd0.push(..._0x42ba12.rows);
  }
  return {
    text: buildCombinedStoryboardBatchJson({
      rows: _0xd94cd0,
      title: _0x54f1d0 || getStoryboardScriptDefaultName(),
    }),
  };
}
function resolveStoryboardScriptTextModel(_0x362e9d = {}) {
  const _0x12b8f3 = String(
    _0x362e9d.storyboardScript?.model || _0x362e9d.model || STORYBOARD_SCRIPT_TEXT_MODEL,
  ).trim();
  return _0x12b8f3 || STORYBOARD_SCRIPT_TEXT_MODEL;
}
function resolveStoryboardScriptTextProvider(_0x810093 = {}) {
  const _0x5ed63e = String(
    _0x810093.storyboardScript?.provider || _0x810093.provider || STORYBOARD_SCRIPT_TEXT_PROVIDER,
  ).trim();
  return _0x5ed63e || STORYBOARD_SCRIPT_TEXT_PROVIDER;
}
function buildStoryboardScriptStatePatch({
  current: _0x32d7aa,
  prompt: _0x2801a4,
  model: _0x59d5b0,
  provider: _0x1ea366,
  sourceMode: sourceMode = '',
  status: _0x2dcc37,
  normalized: normalized = null,
  error: error = '',
  referenceImageRefs: referenceImageRefs = null,
}) {
  const _0x2558b2 = normalized?.rows ?? _0x32d7aa.rows ?? [],
    _0x180fc3 = buildCanonicalStoryboardScriptJson({ ..._0x32d7aa, ...(normalized || {}), rows: _0x2558b2 });
  return {
    ..._0x32d7aa,
    version: 1,
    viewMode: _0x32d7aa.viewMode || 'list',
    prompt: _0x2801a4,
    model: _0x59d5b0,
    provider: _0x1ea366,
    sourceMode: normalized?.sourceMode || sourceMode || _0x32d7aa.sourceMode || 'text',
    isGenerating: _0x2dcc37 === 'running',
    jobStatus: _0x2dcc37,
    jobError: error,
    rawJson: normalized?.rawJson ?? _0x32d7aa.rawJson ?? '',
    canonicalJson: JSON.stringify(_0x180fc3, null, 2),
    rows: _0x2558b2,
    selectedRowIndexes: normalized
      ? []
      : normalizeStoryboardScriptSelectedRowIndexes(_0x32d7aa.selectedRowIndexes, _0x2558b2.length),
    selectionMode: normalized ? false : _0x32d7aa.selectionMode === true,
    title: _0x180fc3.title,
    detectedIntent: _0x180fc3.detectedIntent,
    referenceImageRefs: Array.isArray(referenceImageRefs)
      ? referenceImageRefs
      : Array.isArray(_0x32d7aa.referenceImageRefs)
        ? _0x32d7aa.referenceImageRefs
        : [],
    warnings: normalized?.warnings ?? _0x32d7aa.warnings ?? [],
    updatedAt: Date.now(),
  };
}
function createToolbarButton({
  action: _0x1cb258,
  label: _0xdcfd01,
  tooltip: _0x1cc501,
  iconHtml: _0x24431a,
  showLabel: showLabel = false,
}) {
  const _0x538e29 = document.createElement('button');
  return (
    (_0x538e29.type = 'button'),
    (_0x538e29.className = ['ftb-btn', showLabel ? '' : 'icon-only', 'act-' + _0x1cb258]
      .filter(Boolean)
      .join(' ')),
    (_0x538e29.dataset.tooltip = _0x1cc501 || _0xdcfd01),
    _0x538e29.setAttribute('aria-label', _0xdcfd01),
    (_0x538e29.innerHTML = showLabel ? _0x24431a + '<span>' + _0xdcfd01 + '</span>' : _0x24431a),
    _0x538e29
  );
}
function setToolbarButtonLabel(_0x306fa2, _0x5951bc) {
  if (!_0x306fa2) return;
  ((_0x306fa2.dataset.tooltip = _0x5951bc), _0x306fa2.setAttribute('aria-label', _0x5951bc));
  const _0x34af5a = _0x306fa2.querySelector('span');
  if (_0x34af5a) _0x34af5a.textContent = _0x5951bc;
}
function replaceModelTriggerIcon(_0x24e1c6, _0x592756) {
  const _0x38d5eb = _0x24e1c6?.firstElementChild,
    _0x1ec7ad = String(_0x592756 || '').trim();
  if (!_0x38d5eb || !_0x1ec7ad) return;
  const _0x4b377a = _0x24e1c6.dataset?.storyboardModelIconHtml || '';
  if (_0x4b377a === _0x1ec7ad) return;
  if (!_0x4b377a && String(_0x38d5eb.outerHTML || '').trim() === _0x1ec7ad) {
    _0x24e1c6.dataset.storyboardModelIconHtml = _0x1ec7ad;
    return;
  }
  const _0x5b59ec = document.createElement('template');
  _0x5b59ec.innerHTML = _0x1ec7ad;
  const _0x5bcff5 = _0x5b59ec.content.firstElementChild;
  if (!_0x5bcff5) return;
  ((_0x24e1c6.dataset.storyboardModelIconHtml = _0x1ec7ad), _0x38d5eb.replaceWith(_0x5bcff5));
}
function escapePromptTextForHtml(_0x5db4d4) {
  return String(_0x5db4d4 || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function getStoryboardRowImagePrompt(_0x3651d2) {
  if (!_0x3651d2 || typeof _0x3651d2 !== 'object') return '';
  return formatCellValue(
    _0x3651d2['图片提示词'] ??
      _0x3651d2.imagePrompt ??
      _0x3651d2.image_prompt ??
      _0x3651d2.imagePromptText ??
      '',
  ).trim();
}
function getStoryboardRowShotNo(_0x5d6e50, _0x26c684) {
  return formatCellValue(
    _0x5d6e50?.['镜号'] ?? _0x5d6e50?.shotNo ?? _0x5d6e50?.shotNumber ?? _0x26c684 + 1,
  ).trim();
}
function clonePlainObject(_0x5150ee) {
  if (!_0x5150ee || typeof _0x5150ee !== 'object' || Array.isArray(_0x5150ee)) return null;
  try {
    return JSON.parse(JSON.stringify(_0x5150ee));
  } catch {
    return { ..._0x5150ee };
  }
}
function getPlainObject(_0x33083a) {
  return _0x33083a && typeof _0x33083a === 'object' && !Array.isArray(_0x33083a) ? { ..._0x33083a } : {};
}
function getImageNodeSizeForAspectRatio(_0x9a793f) {
  const _0xa640cb = getAIGenerationDefaultSizeByType('ai-image'),
    _0x582f75 = buildImageDisplayRatioResizePatch({
      nodeData: { x: 0, y: 0, width: _0xa640cb.width, height: _0xa640cb.height },
      ratioValue: _0x9a793f,
      minSide: Math.min(_0xa640cb.width, _0xa640cb.height),
    });
  return {
    width: Number(_0x582f75.width) || _0xa640cb.width,
    height: Number(_0x582f75.height) || _0xa640cb.height,
  };
}
function sanitizeExportFileName(_0x2eff9) {
  const _0x37d912 = String(_0x2eff9 || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return _0x37d912 || getStoryboardScriptDefaultName();
}
function formatExportTimestamp(_0x6725fa = new Date()) {
  const _0x3364c4 = (_0x4b6e3b) => String(_0x4b6e3b).padStart(2, '0');
  return [
    _0x6725fa.getFullYear(),
    _0x3364c4(_0x6725fa.getMonth() + 1),
    _0x3364c4(_0x6725fa.getDate()),
    '-',
    _0x3364c4(_0x6725fa.getHours()),
    _0x3364c4(_0x6725fa.getMinutes()),
    _0x3364c4(_0x6725fa.getSeconds()),
  ].join('');
}
function downloadTextFile({ filename: _0x321949, content: _0x1288bd, mimeType: _0xf92d76 }) {
  const _0x55d733 = new Blob([_0x1288bd], { type: _0xf92d76 }),
    _0x59f026 = URL.createObjectURL(_0x55d733),
    _0x4c5edf = document.createElement('a');
  ((_0x4c5edf.href = _0x59f026),
    (_0x4c5edf.download = _0x321949),
    (_0x4c5edf.rel = 'noopener'),
    document.body.appendChild(_0x4c5edf),
    _0x4c5edf.click(),
    _0x4c5edf.remove(),
    window.setTimeout(() => URL.revokeObjectURL(_0x59f026), 0));
}
function focusStoryboardImageBatch(_0x56cbe7, _0x2f993b) {
  const _0x3c9abf = [_0x56cbe7, _0x2f993b].map((_0x344e37) => String(_0x344e37 || '').trim()).filter(Boolean);
  if (_0x3c9abf.length === 0) return;
  appStore.setSelectedNodes(_0x3c9abf);
  const _0x1da7e0 = typeof window !== 'undefined' ? window : null;
  try {
    if (typeof _0x1da7e0?.v2FocusOnNodes === 'function') _0x1da7e0.v2FocusOnNodes(_0x3c9abf, 80, 0x320);
    else
      typeof _0x1da7e0?.v2FocusOnNode === 'function' &&
        _0x1da7e0.v2FocusOnNode(_0x3c9abf[_0x3c9abf.length - 1], 80, 0x320);
  } catch (_0x21822c) {
    console.warn('[StoryboardScriptNode] focus created image batch failed', _0x21822c);
  }
}
function createStoryboardScriptLoadingOverlay() {
  const _0x41814f = document.createElement('div');
  ((_0x41814f.className = 'storyboard-script-loading-overlay'),
    _0x41814f.setAttribute('role', 'status'),
    _0x41814f.setAttribute('aria-live', 'polite'));
  const _0x2d4b87 = document.createElement('div');
  ((_0x2d4b87.className = 'storyboard-script-loading-spinner'), _0x41814f.appendChild(_0x2d4b87));
  const _0x27a52a = document.createElement('div');
  ((_0x27a52a.className = 'storyboard-script-loading-label'),
    (_0x27a52a.textContent = storyboardScriptText('loading')),
    _0x41814f.appendChild(_0x27a52a));
  const _0x56396d = document.createElement('div');
  _0x56396d.className = 'storyboard-script-loading-bar';
  const _0x3907fe = document.createElement('div');
  return (
    (_0x3907fe.className = 'storyboard-script-loading-bar-fill'),
    _0x56396d.appendChild(_0x3907fe),
    _0x41814f.appendChild(_0x56396d),
    _0x41814f
  );
}
function waitForStoryboardLoadingPaint() {
  const _0x467a93 = typeof window !== 'undefined' ? window : null;
  if (!_0x467a93) return Promise.resolve();
  return new Promise((_0x1958e4) => {
    const _0x250c24 = () => _0x1958e4();
    if (typeof _0x467a93.requestAnimationFrame === 'function') {
      _0x467a93.requestAnimationFrame(() => {
        typeof _0x467a93.setTimeout === 'function' ? _0x467a93.setTimeout(_0x250c24, 0) : _0x250c24();
      });
      return;
    }
    if (typeof _0x467a93.setTimeout === 'function') {
      _0x467a93.setTimeout(_0x250c24, 0);
      return;
    }
    _0x250c24();
  });
}
function createSvgIcon() {
  const _0x3e1572 = 'http://www.w3.org/2000/svg',
    _0x189aa9 = document.createElementNS(_0x3e1572, 'svg');
  (_0x189aa9.setAttribute('width', '16'),
    _0x189aa9.setAttribute('height', '16'),
    _0x189aa9.setAttribute('viewBox', '0 0 24 24'),
    _0x189aa9.setAttribute('fill', 'none'),
    _0x189aa9.setAttribute('stroke', 'currentColor'),
    _0x189aa9.setAttribute('stroke-width', '2'));
  const _0x144bbd = document.createElementNS(_0x3e1572, 'rect');
  (_0x144bbd.setAttribute('x', '3'),
    _0x144bbd.setAttribute('y', '4'),
    _0x144bbd.setAttribute('width', '18'),
    _0x144bbd.setAttribute('height', '16'),
    _0x144bbd.setAttribute('rx', '2'),
    _0x189aa9.appendChild(_0x144bbd),
    ['9', '14'].forEach((_0x5ae38a) => {
      const _0x26707d = document.createElementNS(_0x3e1572, 'line');
      (_0x26707d.setAttribute('x1', '3'),
        _0x26707d.setAttribute('y1', _0x5ae38a),
        _0x26707d.setAttribute('x2', '21'),
        _0x26707d.setAttribute('y2', _0x5ae38a),
        _0x189aa9.appendChild(_0x26707d));
    }));
  const _0x9a0ce2 = document.createElementNS(_0x3e1572, 'line');
  return (
    _0x9a0ce2.setAttribute('x1', '8'),
    _0x9a0ce2.setAttribute('y1', '4'),
    _0x9a0ce2.setAttribute('x2', '8'),
    _0x9a0ce2.setAttribute('y2', '20'),
    _0x189aa9.appendChild(_0x9a0ce2),
    _0x189aa9
  );
}
export class StoryboardScriptNode {
  constructor(_0x2ff145) {
    ((this._data = _0x2ff145 || {}),
      (this.nodeId = this._data.id),
      (this.refBarEl = null),
      (this.promptEl = null),
      (this.btnEl = null),
      (this._toolbarGenerateBtn = null),
      (this._toolbarFullscreenBtn = null),
      (this._toolbarDownloadBtn = null),
      (this._queueBtn = null),
      (this._imageModeBtn = null),
      (this._videoModeBtn = null),
      (this._selectionCountEl = null),
      (this._onDocumentPointerDown = null),
      (this._onModelTriggerClickCapture = null),
      (this._storyboardImageModelMenu = null),
      (this._storyboardImageModelMenuBound = false),
      (this._storyboardImageSchemaCleanup = null),
      (this._storyboardImageSchemaModel = ''),
      (this._storyboardImageSchemaSelectionMode = null),
      (this.rhAdvPanelEl = null),
      (this.rhAdvWrap = null),
      (this.uiSchemaModeSlot = null),
      (this.uiSchemaResolutionSlot = null),
      (this.uiSchemaInstanceSlot = null),
      (this.uiSchemaBatchSlot = null),
      (this._isGeneratingScript = false),
      (this._isPromptGenerateLoadingPrimed = false),
      (this._activeCellEdit = null),
      (this._storyboardViewScrollByKey = new Map()),
      (this._storyboardBodyRenderSignature = ''),
      (this._skipNextStoryboardBodyRender = false),
      (this._fullscreenOverlayEl = null),
      (this._onFullscreenKeydown = null),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component storyboard-script-node'));
  }
  ['mount']() {
    this.el.replaceChildren();
    const _0x77868 = document.createElement('div');
    _0x77868.className = 'storyboard-script-header';
    const _0x4d17a4 = document.createElement('div');
    ((_0x4d17a4.className = 'storyboard-script-title'), _0x4d17a4.appendChild(createSvgIcon()));
    const _0x32354f = document.createElement('span');
    ((_0x32354f.textContent = getStoryboardScriptDefaultName()), _0x4d17a4.appendChild(_0x32354f));
    const _0x437b9a = document.createElement('span');
    ((_0x437b9a.className = 'storyboard-script-beta'),
      (_0x437b9a.textContent = 'BETA'),
      _0x4d17a4.appendChild(_0x437b9a));
    const _0x261c78 = document.createElement('div');
    _0x261c78.className = 'storyboard-script-header-controls';
    const _0x2d1bf2 = document.createElement('div');
    ((_0x2d1bf2.className = 'storyboard-script-media-switch'),
      _0x2d1bf2.setAttribute('role', 'group'),
      _0x2d1bf2.setAttribute('aria-label', storyboardScriptText('mediaModeAria')),
      (this._imageModeBtn = this._createMediaModeButton('image', storyboardScriptText('mediaMode.image'))),
      (this._videoModeBtn = this._createMediaModeButton('video', storyboardScriptText('mediaMode.video'))),
      _0x2d1bf2.appendChild(this._imageModeBtn),
      _0x2d1bf2.appendChild(this._videoModeBtn));
    const _0x1f919b = document.createElement('div');
    return (
      (_0x1f919b.className = 'storyboard-script-view-switch'),
      _0x1f919b.setAttribute('role', 'group'),
      _0x1f919b.setAttribute('aria-label', storyboardScriptText('viewModeAria')),
      (this._listBtn = this._createModeButton('list', storyboardScriptText('viewMode.list'))),
      (this._cardBtn = this._createModeButton('card', storyboardScriptText('viewMode.card'))),
      _0x1f919b.appendChild(this._listBtn),
      _0x1f919b.appendChild(this._cardBtn),
      _0x261c78.appendChild(_0x2d1bf2),
      _0x261c78.appendChild(_0x1f919b),
      _0x77868.appendChild(_0x4d17a4),
      _0x77868.appendChild(_0x261c78),
      (this._bodyEl = document.createElement('div')),
      (this._bodyEl.className = 'storyboard-script-body'),
      this._bindBodyInteractions(),
      (this._promptPanelEl = buildSharedPromptPanel(this, {
        placeholder: storyboardScriptText('promptPlaceholder'),
        btnTitle: storyboardScriptText('generate'),
        modelMenu: {
          provider: resolveStoryboardScriptTextProvider(this._data),
          providers: [STORYBOARD_SCRIPT_TEXT_PROVIDER],
          allowCustomModels: false,
          defaultModel: STORYBOARD_SCRIPT_TEXT_MODEL,
          model: resolveStoryboardScriptTextModel(this._data),
          onSelect: ({ modelId: _0x165724, provider: _0x51f210 }) => {
            const _0x6d8065 = this._getScriptState(),
              _0x4a8ca4 = { ..._0x6d8065, model: _0x165724, provider: _0x51f210, sourceMode: 'text' };
            ((this._data = {
              ...this._data,
              model: _0x165724,
              provider: _0x51f210,
              storyboardScript: _0x4a8ca4,
            }),
              appStore.updateNodeData(this.nodeId, {
                model: _0x165724,
                provider: _0x51f210,
                storyboardScript: _0x4a8ca4,
              }));
          },
        },
      })),
      this._bindPromptGenerateImmediateLoading(),
      this._installSelectionCountIndicator(),
      this._installStoryboardImagePromptSchemaControls(),
      this._installStoryboardQueueButton(),
      this._bindStoryboardImageModelTrigger(),
      this.el.appendChild(_0x77868),
      this.el.appendChild(this._bodyEl),
      (this._toolbarEl = this._createToolbar()),
      this.el.appendChild(this._toolbarEl),
      this.el.appendChild(this._promptPanelEl),
      (this._resizeHandleEl = createNodeResizeHandle(this, {
        store: appStore,
        getStateSnapshot: getStateSnapshot,
        commit: commit,
        resolveMinSize: resolveStoryboardScriptResizeMinSize,
      })),
      this.el.appendChild(this._resizeHandleEl),
      this._renderRefBar(),
      this._bindOutsideSelectionCancel(),
      this._updateSubmitButtonState(),
      this._render(),
      this.el
    );
  }
  ['_createToolbar']() {
    const _0x5c1c26 = document.createElement('div');
    return (
      (_0x5c1c26.className = 'node-floating-toolbar v2-text-toolbar v2-storyboard-script-toolbar'),
      _0x5c1c26.addEventListener('pointerdown', (_0x11ce37) => {
        _0x11ce37.stopPropagation();
      }),
      _0x5c1c26.addEventListener('dblclick', (_0x1fc4b6) => {
        (_0x1fc4b6.preventDefault(), _0x1fc4b6.stopPropagation());
      }),
      (this._toolbarGenerateBtn = createToolbarButton({
        action: 'generate-storyboard',
        label: storyboardScriptText('toolbar.editMode'),
        tooltip: storyboardScriptText('toolbar.editMode'),
        iconHtml: STORYBOARD_TOOLBAR_GENERATE_ICON_HTML,
        showLabel: true,
      })),
      this._toolbarGenerateBtn.addEventListener('click', (_0x33e777) => {
        _0x33e777.stopPropagation();
        const _0x57558f = this._getScriptState();
        _0x57558f.selectionMode === true ? this._cancelSelectionMode() : this._enterSelectionMode();
      }),
      (this._toolbarFullscreenBtn = createToolbarButton({
        action: 'fullscreen-script',
        label: storyboardScriptText('toolbar.fullscreen'),
        tooltip: storyboardScriptText('toolbar.fullscreen'),
        iconHtml: STORYBOARD_TOOLBAR_FULLSCREEN_ICON_HTML,
      })),
      this._toolbarFullscreenBtn.addEventListener('click', (_0x2577b3) => {
        (_0x2577b3.stopPropagation(), this._openFullscreenScript());
      }),
      (this._toolbarDownloadBtn = createToolbarButton({
        action: 'download-table',
        label: storyboardScriptText('toolbar.download'),
        tooltip: storyboardScriptText('toolbar.downloadTable'),
        iconHtml: STORYBOARD_TOOLBAR_DOWNLOAD_ICON_HTML,
      })),
      this._toolbarDownloadBtn.addEventListener('click', (_0x44a687) => {
        (_0x44a687.stopPropagation(), this._downloadScriptTable());
      }),
      _0x5c1c26.appendChild(this._toolbarGenerateBtn),
      _0x5c1c26.appendChild(this._toolbarFullscreenBtn),
      _0x5c1c26.appendChild(this._toolbarDownloadBtn),
      _0x5c1c26
    );
  }
  ['_bindOutsideSelectionCancel']() {
    (this._unbindOutsideSelectionCancel(),
      (this._onDocumentPointerDown = (_0x57f156) => {
        const _0x3fbb61 = this._getScriptState();
        if (_0x3fbb61.selectionMode !== true) return;
        const _0x1dc977 = _0x57f156.target;
        if (!(_0x1dc977 instanceof Element)) return;
        const _0x3a081e = document.getElementById(this.nodeId);
        if (this._fullscreenOverlayEl?.contains(_0x1dc977)) return;
        if (this.el.contains(_0x1dc977) || _0x3a081e?.contains(_0x1dc977)) return;
        this._cancelSelectionMode();
      }),
      document.addEventListener('pointerdown', this._onDocumentPointerDown, true));
  }
  ['_unbindOutsideSelectionCancel']() {
    if (!this._onDocumentPointerDown) return;
    (document.removeEventListener('pointerdown', this._onDocumentPointerDown, true),
      (this._onDocumentPointerDown = null));
  }
  ['_bindStoryboardImageModelTrigger']() {
    const _0x3752a8 = this._promptPanelEl?.querySelector('.img-model-btn-trigger');
    if (!_0x3752a8) return;
    ((this._onModelTriggerClickCapture = (_0x6f02cd) => {
      const _0x42e2c9 = this._getScriptState();
      if (_0x42e2c9.selectionMode !== true) return;
      (_0x6f02cd.preventDefault(),
        _0x6f02cd.stopPropagation(),
        _0x6f02cd.stopImmediatePropagation?.(),
        this._toggleStoryboardImageModelMenu());
    }),
      _0x3752a8.addEventListener('click', this._onModelTriggerClickCapture, { capture: true }));
  }
  ['_unbindStoryboardImageModelTrigger']() {
    const _0x3d5242 = this._promptPanelEl?.querySelector('.img-model-btn-trigger');
    if (!_0x3d5242 || !this._onModelTriggerClickCapture) return;
    (_0x3d5242.removeEventListener('click', this._onModelTriggerClickCapture, { capture: true }),
      (this._onModelTriggerClickCapture = null));
  }
  ['_removeStoryboardImageModelMenu']() {
    (this._storyboardImageModelMenu?.remove(),
      (this._storyboardImageModelMenu = null),
      (this._storyboardImageModelMenuBound = false));
  }
  ['_getStoryboardImagePromptNodeData'](_0x343b18 = this._data, _0x875c46 = null) {
    const _0x267d6f = _0x875c46 || createDefaultStoryboardScriptState(_0x343b18?.storyboardScript || {}),
      _0x8f9485 = normalizeDreaminaImageModel(
        _0x267d6f.imageModel || DEFAULT_IMAGE_NODE_MODEL,
        _0x267d6f.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      );
    return {
      ...(_0x343b18 || {}),
      type: 'ai-image',
      model: _0x8f9485,
      provider: _0x267d6f.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      generationParams: getPlainObject(_0x343b18?.generationParams),
      generationParamsByModel: getPlainObject(_0x343b18?.generationParamsByModel),
    };
  }
  ['_installStoryboardImagePromptSchemaControls']() {
    const _0x55620a = this._promptPanelEl?.querySelector('.prompt-panel-footer'),
      _0x29b7da = _0x55620a?.querySelector('.img-model-pills'),
      _0x551522 = _0x29b7da?.querySelector('.img-model-wrap'),
      _0x4d76ea = _0x55620a?.querySelector('.prompt-actions'),
      _0x5d2a55 = _0x4d76ea?.querySelector('.debug-wrench-btn');
    if (!_0x55620a || !_0x29b7da || !_0x551522 || !_0x4d76ea || !_0x5d2a55) return;
    const _0x3a850f = (_0x5e589f) => {
      const _0x5b7873 = document.createElement('div');
      return (
        (_0x5b7873.className = 'ui-schema-placement ' + _0x5e589f + ' storyboard-image-schema-only'),
        (_0x5b7873.hidden = true),
        _0x5b7873
      );
    };
    ((this.uiSchemaModeSlot = _0x3a850f('ui-schema-mode-slot')),
      (this.uiSchemaResolutionSlot = _0x3a850f('ui-schema-resolution-slot')),
      (this.uiSchemaBatchSlot = _0x3a850f('ui-schema-batch-slot')),
      (this.uiSchemaInstanceSlot = _0x3a850f('ui-schema-instance-slot')),
      _0x551522.after(this.uiSchemaModeSlot, this.uiSchemaResolutionSlot),
      (this.rhAdvWrap = document.createElement('div')),
      (this.rhAdvWrap.className = 'rh-adv-wrap storyboard-image-schema-only'),
      (this.rhAdvWrap.hidden = true));
    const _0x3c4167 = document.createElement('button');
    ((_0x3c4167.type = 'button'), (_0x3c4167.className = 'img-pill-btn rh-adv-btn'));
    const _0x12246e = document.createElement('span');
    ((_0x12246e.className = 'rh-adv-btn-label'),
      (_0x12246e.textContent = storyboardScriptText('advancedSettings')),
      _0x3c4167.replaceChildren(_0x12246e),
      this.rhAdvWrap.appendChild(_0x3c4167),
      _0x4d76ea.insertBefore(this.rhAdvWrap, _0x5d2a55),
      _0x4d76ea.insertBefore(this.uiSchemaBatchSlot, _0x5d2a55),
      _0x4d76ea.insertBefore(this.uiSchemaInstanceSlot, _0x5d2a55),
      (this.rhAdvPanelEl = document.createElement('div')),
      (this.rhAdvPanelEl.className = 'rh-adv-panel storyboard-image-schema-only'),
      _0x55620a.appendChild(this.rhAdvPanelEl),
      _0x3c4167.addEventListener('click', (_0x429e7b) => {
        _0x429e7b.stopPropagation();
        if (this.rhAdvPanelEl?.hidden) return;
        (closeNodeFooterMenus(_0x55620a, this.rhAdvPanelEl),
          this.rhAdvPanelEl?.classList.toggle('show'),
          this._storyboardImageModelMenu?.classList.remove('show'));
      }),
      this.rhAdvPanelEl.addEventListener('click', (_0x295666) => {
        _0x295666.stopPropagation();
      }),
      this._storyboardImageSchemaCleanup?.(),
      (this._storyboardImageSchemaCleanup = bindModelUiSchemaControls(_0x55620a, {
        nodeId: this.nodeId,
        nodeData: this._getStoryboardImagePromptNodeData(),
        store: appStore,
        decorateNodeData: (_0x4292c3) =>
          this._getStoryboardImagePromptNodeData(
            _0x4292c3,
            createDefaultStoryboardScriptState(_0x4292c3?.storyboardScript || {}),
          ),
        buildPatch: (_0x4d2c31, _0x203925, _0x145ef4) => {
          const _0x2ae0b9 = createDefaultStoryboardScriptState(_0x4d2c31?.storyboardScript || {}),
            _0x230e79 = { ..._0x2ae0b9, updatedAt: Date.now() };
          if (_0x203925 !== 'aspectRatio') return { storyboardScript: _0x230e79 };
          return { aspectRatio: _0x145ef4, storyboardScript: _0x230e79 };
        },
        afterCommit: (_0x52b803, _0x286fbc, _0x577e05, { patch: _0x4a6770 } = {}) => {
          (_0x4a6770 && typeof _0x4a6770 === 'object' && (this._data = { ...this._data, ..._0x4a6770 }),
            this._syncStoryboardImageSchemaControls(this._getScriptState()));
        },
      })));
  }
  ['_syncStoryboardImageSchemaControls'](_0x2dec39 = this._getScriptState()) {
    const _0x1933c6 = this._promptPanelEl?.querySelector('.prompt-panel-footer');
    if (!_0x1933c6 || !this.uiSchemaModeSlot || !this.uiSchemaResolutionSlot) return;
    const _0x3a2b4c =
        Array.isArray(_0x2dec39.rows) && _0x2dec39.rows.length > 0 && _0x2dec39.selectionMode === true,
      _0x124b14 = normalizeDreaminaImageModel(
        _0x2dec39.imageModel || DEFAULT_IMAGE_NODE_MODEL,
        _0x2dec39.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      ),
      _0x290bc3 = this._getStoryboardImagePromptNodeData(this._data, _0x2dec39),
      _0x4493e0 =
        this._storyboardImageSchemaModel !== _0x124b14 ||
        this._storyboardImageSchemaSelectionMode !== _0x3a2b4c,
      _0x5b4297 = (_0x509adc, _0x3529b5, _0x41595f) => {
        if (!_0x509adc) return;
        const _0x42ea61 = _0x3a2b4c
          ? renderModelUiSchemaControls(_0x124b14, _0x290bc3, { placement: _0x3529b5, variant: _0x41595f })
          : '';
        ((_0x509adc.innerHTML = _0x42ea61), (_0x509adc.hidden = !_0x3a2b4c || !_0x42ea61));
      };
    _0x4493e0 &&
      (_0x5b4297(this.uiSchemaModeSlot, 'mode', 'pillMenu'),
      _0x5b4297(this.uiSchemaResolutionSlot, 'resolution', 'resolutionPill'),
      _0x5b4297(this.uiSchemaBatchSlot, 'batch', 'pillMenu'),
      _0x5b4297(this.uiSchemaInstanceSlot, 'instance', 'instanceToggle'),
      this.rhAdvPanelEl &&
        (this.rhAdvPanelEl.innerHTML = _0x3a2b4c
          ? renderModelUiSchemaControls(_0x124b14, _0x290bc3, {
              placement: 'advanced',
              variant: 'advancedRow',
            })
          : ''),
      (this._storyboardImageSchemaModel = _0x124b14),
      (this._storyboardImageSchemaSelectionMode = _0x3a2b4c));
    syncModelUiSchemaControls(_0x1933c6, _0x290bc3);
    const _0x274eb0 = _0x3a2b4c && hasModelUiSchema(_0x124b14, { placement: 'advanced' });
    if (this.rhAdvWrap) this.rhAdvWrap.hidden = !_0x274eb0;
    this.rhAdvPanelEl &&
      ((this.rhAdvPanelEl.hidden = !_0x274eb0),
      (!_0x274eb0 || !_0x3a2b4c) && this.rhAdvPanelEl.classList.remove('show'));
  }
  ['_buildStoryboardImageModelPatch'](_0x2a5017, _0x4d1f05, _0x3abe30, _0x4766d8 = {}) {
    const _0x41cf6a = createDefaultStoryboardScriptState(
        _0x2a5017?.storyboardScript || this._getScriptState(),
      ),
      _0x35e14b = String(_0x2a5017?.model || '').trim(),
      _0x10aabe = String(_0x4d1f05 || '').trim() || DEFAULT_IMAGE_NODE_MODEL,
      _0x94582c = String(_0x3abe30 || '').trim() || DEFAULT_IMAGE_NODE_PROVIDER,
      _0xd1a5bd = _0x4766d8 && typeof _0x4766d8 === 'object' ? { ..._0x4766d8 } : {};
    delete _0xd1a5bd.storyboardScript;
    const _0x3b69e4 = getPlainObject(_0x2a5017?.generationParamsByModel);
    _0x35e14b && (_0x3b69e4[_0x35e14b] = getPlainObject(_0x2a5017?.generationParams));
    const _0x5b9ff0 = getModelManifest(_0x10aabe),
      _0x84c720 = new Set(
        (_0x5b9ff0?.uiSchema?.fields || [])
          .map((_0x3115cd) => String(_0x3115cd?.id || '').trim())
          .filter(Boolean),
      ),
      _0x33f221 = getPlainObject(_0xd1a5bd.generationParams),
      _0x43a44f = getPlainObject(_0x3b69e4[_0x10aabe]),
      _0x47b42e = buildModelUiSchemaDefaultParams(_0x10aabe),
      _0x486839 = {};
    (_0x84c720.forEach((_0x2682e7) => {
      Object.prototype.hasOwnProperty.call(_0xd1a5bd, _0x2682e7) &&
        ((_0x486839[_0x2682e7] = _0xd1a5bd[_0x2682e7]), delete _0xd1a5bd[_0x2682e7]);
    }),
      delete _0xd1a5bd.generationParams,
      delete _0xd1a5bd.generationParamsByModel);
    const _0x151202 = sanitizeModelUiSchemaParams(
      _0x10aabe,
      { ..._0x47b42e, ..._0x43a44f, ..._0x33f221, ..._0x486839 },
      { includeDefaults: true },
    );
    if (_0x10aabe) _0x3b69e4[_0x10aabe] = _0x151202;
    const _0x4d8c9c = {
        ..._0x41cf6a,
        selectionMode: true,
        imageModel: _0x10aabe,
        imageProvider: _0x94582c,
        updatedAt: Date.now(),
      },
      _0x5afae8 = _0x151202.aspectRatio || _0xd1a5bd.aspectRatio || _0x2a5017?.aspectRatio;
    return {
      ..._0xd1a5bd,
      model: _0x10aabe,
      provider: _0x94582c,
      ...(_0x5afae8 ? { aspectRatio: _0x5afae8 } : {}),
      generationParams: _0x151202,
      generationParamsByModel: _0x3b69e4,
      storyboardScript: _0x4d8c9c,
    };
  }
  ['_bindStoryboardImageModelMenu'](_0x328fd7) {
    if (!_0x328fd7 || this._storyboardImageModelMenuBound) return;
    const _0x2b3e70 = this._promptPanelEl?.querySelector('.img-model-btn-trigger'),
      _0x2e300d = this._promptPanelEl?.querySelector('.img-model-label'),
      _0x20ec1a = {
        modelMenu: _0x328fd7,
        modelTrigger: _0x2b3e70,
        modelLabel: _0x2e300d,
        nodeId: this.nodeId,
        store: appStore,
        fallbackNodeData: this._data,
        buildModelPatch: (..._0x21a8cf) => this._buildStoryboardImageModelPatch(..._0x21a8cf),
      };
    (bindImageModelMenuSubmenu({
      ..._0x20ec1a,
      toggleSelector: '[data-grsai-toggle]',
      submenuSelector: '.grsai-submenu',
      defaultProvider: 'grsai',
      resolveSelection: resolveGrsaiImageMenuSelection,
      afterSelect: ({ item: _0x44324b }) => setImageModelTriggerIcon(_0x2b3e70, 'grsai', _0x44324b),
    }),
      bindImageModelMenuSubmenu({
        ..._0x20ec1a,
        toggleSelector: '[data-ppio-toggle]',
        submenuSelector: '.ppio-submenu',
        defaultProvider: 'ppio',
        afterSelect: ({ item: _0x55db0a }) => setImageModelTriggerIcon(_0x2b3e70, 'ppio', _0x55db0a),
      }),
      bindDreaminaImageMenu(_0x20ec1a),
      bindImageModelMenuSubmenu({
        ..._0x20ec1a,
        toggleSelector: '[data-apimart-toggle]',
        submenuSelector: '.apimart-submenu',
        defaultProvider: 'apimart',
        resolveSelection: resolveApimartImageMenuSelection,
        afterSelect: ({ item: _0x183f88 }) => setImageModelTriggerIcon(_0x2b3e70, 'apimart', _0x183f88),
      }),
      bindImageModelMenuSubmenu({
        ..._0x20ec1a,
        toggleSelector: '[data-agnes-toggle]',
        submenuSelector: '.agnes-submenu',
        defaultProvider: 'agnes',
        afterSelect: ({ item: _0x12fc09 }) => setImageModelTriggerIcon(_0x2b3e70, 'agnes', _0x12fc09),
      }),
      bindImageModelMenuSubmenu({
        ..._0x20ec1a,
        toggleSelector: '[data-volcengine-toggle]',
        submenuSelector: '.volcengine-submenu',
        defaultProvider: 'volcengine',
        resolveSelection: resolveVolcengineImageMenuSelection,
        afterSelect: ({ item: _0x3e4fab }) => setImageModelTriggerIcon(_0x2b3e70, 'volcengine', _0x3e4fab),
      }),
      bindImageModelMenuSubmenu({
        ..._0x20ec1a,
        toggleSelector: '[data-runninghubwf-toggle]',
        submenuSelector: '.runninghubwf-submenu',
        defaultProvider: 'runninghubwf',
        resolveSelection: resolveRunningHubWorkflowImageMenuSelection,
        afterSelect: ({ item: _0x2758cc }) => setImageModelTriggerIcon(_0x2b3e70, 'runninghubwf', _0x2758cc),
      }),
      bindImageModelMenuSubmenu({
        ..._0x20ec1a,
        toggleSelector: '[data-runninghub-toggle]',
        submenuSelector: '.runninghub-submenu',
        defaultProvider: 'runninghubwf',
        resolveSelection: resolveRunningHubModelImageMenuSelection,
        afterSelect: ({ item: _0x525a54, provider: _0x5dcde7 }) =>
          setImageModelTriggerIcon(_0x2b3e70, _0x5dcde7, _0x525a54),
      }),
      (this._storyboardImageModelMenuBound = true));
  }
  ['_ensureStoryboardImageModelMenu']() {
    if (this._storyboardImageModelMenu?.isConnected) return this._storyboardImageModelMenu;
    const _0x33fa1f = this._promptPanelEl?.querySelector('.img-model-wrap');
    if (!_0x33fa1f) return null;
    const _0x33abc4 = this._getScriptState(),
      _0x2a1d43 = normalizeDreaminaImageModel(
        _0x33abc4.imageModel || DEFAULT_IMAGE_NODE_MODEL,
        _0x33abc4.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      ),
      _0x3adf42 = document.createElement('template');
    _0x3adf42.innerHTML = buildImageModelMenuHTML({
      activeModel: _0x2a1d43,
      nanoSelection: getNanoBananaSelectionFromModel(
        _0x2a1d43,
        _0x33abc4.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      ),
    }).trim();
    const _0x4330ae = _0x3adf42.content.firstElementChild;
    if (!_0x4330ae) return null;
    return (
      _0x4330ae.classList.add('storyboard-image-model-menu'),
      (_0x33fa1f.style.position = _0x33fa1f.style.position || 'relative'),
      _0x33fa1f.appendChild(_0x4330ae),
      (this._storyboardImageModelMenu = _0x4330ae),
      (this._storyboardImageModelMenuBound = false),
      this._bindStoryboardImageModelMenu(_0x4330ae),
      _0x4330ae
    );
  }
  ['_toggleStoryboardImageModelMenu']() {
    const _0x1d330c = this._promptPanelEl?.querySelector('.prompt-panel-footer'),
      _0x2fe5f0 = this._ensureStoryboardImageModelMenu();
    if (!_0x2fe5f0) return;
    const _0x5d11a8 = !_0x2fe5f0.classList.contains('show');
    (closeNodeFooterMenus(_0x1d330c || this._promptPanelEl, _0x2fe5f0),
      _0x2fe5f0.classList.toggle('show', _0x5d11a8));
    if (_0x5d11a8) activateMenuKeyboard(_0x2fe5f0);
  }
  ['_installSelectionCountIndicator']() {
    const _0x14ed43 = this._promptPanelEl?.querySelector('.prompt-actions'),
      _0x43e908 = _0x14ed43?.querySelector('.debug-wrench-btn');
    if (!_0x14ed43 || !_0x43e908) return;
    ((this._selectionCountEl = document.createElement('div')),
      (this._selectionCountEl.className = 'storyboard-script-selection-count'),
      (this._selectionCountEl.textContent = '0/0'),
      this._selectionCountEl.setAttribute(
        'aria-label',
        storyboardScriptText('selectionCount', { selected: 0, total: 0 }),
      ),
      _0x14ed43.insertBefore(this._selectionCountEl, _0x43e908));
  }
  ['_installStoryboardQueueButton']() {
    const _0x3ecbd0 = this._promptPanelEl?.querySelector('.prompt-actions');
    if (!_0x3ecbd0 || !this.btnEl || this._queueBtn) return;
    const _0x3a5f13 = document.createElement('button');
    ((_0x3a5f13.type = 'button'),
      (_0x3a5f13.className = 'prompt-submit storyboard-script-queue-btn'),
      (_0x3a5f13.title = storyboardScriptText('toolbar.queue')),
      _0x3a5f13.setAttribute('aria-label', storyboardScriptText('toolbar.queue')),
      (_0x3a5f13.innerHTML = STORYBOARD_QUEUE_ICON_HTML),
      (_0x3a5f13.hidden = true),
      _0x3a5f13.addEventListener('click', (_0x6d8eb7) => {
        (_0x6d8eb7.stopPropagation(),
          this._flushPromptHtmlCommit?.(),
          this._createImageNodesFromSelectedStoryboards({ startGeneration: false }));
      }),
      _0x3ecbd0.insertBefore(_0x3a5f13, this.btnEl),
      (this._queueBtn = _0x3a5f13));
  }
  ['_createModeButton'](_0x43b401, _0x341fcf) {
    const _0x4ff8cd = document.createElement('button');
    return (
      (_0x4ff8cd.type = 'button'),
      (_0x4ff8cd.className = 'storyboard-script-view-btn'),
      (_0x4ff8cd.dataset.mode = _0x43b401),
      (_0x4ff8cd.textContent = _0x341fcf),
      _0x4ff8cd.addEventListener('pointerdown', (_0xf38ae5) => {
        _0xf38ae5.stopPropagation();
      }),
      _0x4ff8cd.addEventListener('dblclick', (_0x3d6212) => {
        _0x3d6212.stopPropagation();
      }),
      _0x4ff8cd.addEventListener('click', (_0x22730b) => {
        (_0x22730b.stopPropagation(), this._setViewMode(_0x43b401));
      }),
      _0x4ff8cd
    );
  }
  ['_createMediaModeButton'](_0x3cff13, _0x11dcb7) {
    const _0x18fadf = document.createElement('button');
    return (
      (_0x18fadf.type = 'button'),
      (_0x18fadf.className = 'storyboard-script-view-btn storyboard-script-media-btn'),
      (_0x18fadf.dataset.mediaMode = _0x3cff13),
      (_0x18fadf.textContent = _0x11dcb7),
      _0x18fadf.addEventListener('pointerdown', (_0x200f2d) => {
        _0x200f2d.stopPropagation();
      }),
      _0x18fadf.addEventListener('dblclick', (_0x2749f8) => {
        _0x2749f8.stopPropagation();
      }),
      _0x18fadf.addEventListener('click', (_0x456684) => {
        (_0x456684.stopPropagation(), this._setMediaMode(_0x3cff13));
      }),
      _0x18fadf
    );
  }
  ['_getScriptState']() {
    return createDefaultStoryboardScriptState(this._data.storyboardScript || {});
  }
  ['_syncSelectionModeUi'](_0x581e4f = this._getScriptState()) {
    const _0x3fd7aa = Array.isArray(_0x581e4f.rows) ? _0x581e4f.rows.length : 0,
      _0x4eb24f = getSelectedRowIndexes(_0x581e4f),
      _0x42eb7e = _0x3fd7aa > 0 && _0x581e4f.selectionMode === true,
      _0x57e631 = _0x42eb7e
        ? storyboardScriptText('toolbar.exitEdit')
        : storyboardScriptText('toolbar.editMode'),
      _0x432d4e = _0x42eb7e
        ? _0x581e4f.imageModel || DEFAULT_IMAGE_NODE_MODEL
        : resolveStoryboardScriptTextModel({ storyboardScript: _0x581e4f }),
      _0x14d121 = _0x42eb7e
        ? _0x581e4f.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER
        : resolveStoryboardScriptTextProvider({ storyboardScript: _0x581e4f });
    this._promptPanelEl?.classList.toggle('is-storyboard-image-mode', _0x42eb7e);
    this._queueBtn && (this._queueBtn.hidden = !_0x42eb7e);
    (this.el?.classList.toggle('has-storyboard-rows', _0x3fd7aa > 0),
      this.el?.classList.toggle('is-storyboard-selection-mode', _0x42eb7e),
      this._toolbarGenerateBtn?.classList.toggle('active', _0x42eb7e),
      setToolbarButtonLabel(this._toolbarGenerateBtn, _0x57e631),
      this._promptPanelEl
        ?.querySelector('.node-model-menu')
        ?.classList.toggle('is-storyboard-text-menu-hidden', _0x42eb7e));
    !_0x42eb7e && this._storyboardImageModelMenu?.classList.remove('show');
    const _0x377ecc = this._promptPanelEl?.querySelector('.img-model-btn-trigger'),
      _0x1b9e8d = this._promptPanelEl?.querySelector('.img-model-label'),
      _0x4acb17 = getDisplayModelName(_0x432d4e);
    (_0x1b9e8d && _0x1b9e8d.textContent !== _0x4acb17 && (_0x1b9e8d.textContent = _0x4acb17),
      _0x42eb7e
        ? replaceModelTriggerIcon(
            _0x377ecc,
            renderImageModelTriggerIconHTML({ model: _0x432d4e, provider: _0x14d121 }),
          )
        : replaceModelTriggerIcon(
            _0x377ecc,
            buildTextModelSmallIconHTML(_0x432d4e) ||
              '<div class="text-model-icon-small text-model-icon-badge">AI</div>',
          ),
      this._selectionCountEl &&
        ((this._selectionCountEl.textContent = _0x4eb24f.length + '/' + _0x3fd7aa),
        this._selectionCountEl.setAttribute(
          'aria-label',
          storyboardScriptText('selectionCount', { selected: _0x4eb24f.length, total: _0x3fd7aa }),
        ),
        (this._selectionCountEl.hidden = !_0x42eb7e)),
      this._syncStoryboardImageSchemaControls(_0x581e4f));
  }
  ['_enterSelectionMode']() {
    this._finishCellEdit({ commit: true });
    const _0x44b19c = this._getScriptState();
    if (!Array.isArray(_0x44b19c.rows) || _0x44b19c.rows.length === 0) {
      window.showToast?.(storyboardScriptText('toasts.generateScriptFirst'), 'warn');
      return;
    }
    const _0x3e5bc7 = _0x44b19c.imageModel || DEFAULT_IMAGE_NODE_MODEL,
      _0x2ee2d4 = _0x44b19c.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      _0x1ad095 = appStore.getState?.().nodes?.[this.nodeId] || this._data,
      _0x2ae412 = this._buildStoryboardImageModelPatch(_0x1ad095, _0x3e5bc7, _0x2ee2d4),
      _0x10890f = {
        ..._0x2ae412.storyboardScript,
        viewMode: 'list',
        selectionMode: true,
        selectedRowIndexes: getSelectedRowIndexes(_0x44b19c),
        updatedAt: Date.now(),
      };
    ((this._data = { ...this._data, ..._0x2ae412, storyboardScript: _0x10890f }),
      appStore.updateNodeData(this.nodeId, { ..._0x2ae412, storyboardScript: _0x10890f }));
  }
  ['_cancelSelectionMode']() {
    let _0x1a13a9 = this._getScriptState();
    if (_0x1a13a9.selectionMode !== true) return;
    (this._finishCellEdit({ commit: true }), (_0x1a13a9 = this._getScriptState()));
    const _0x8a70be = resolveStoryboardScriptTextModel({ storyboardScript: _0x1a13a9 }),
      _0x2b9109 = resolveStoryboardScriptTextProvider({ storyboardScript: _0x1a13a9 }),
      _0xd7d096 = { ..._0x1a13a9, selectionMode: false, selectedRowIndexes: [], updatedAt: Date.now() };
    ((this._data = { ...this._data, model: _0x8a70be, provider: _0x2b9109, storyboardScript: _0xd7d096 }),
      appStore.updateNodeData(this.nodeId, {
        model: _0x8a70be,
        provider: _0x2b9109,
        storyboardScript: _0xd7d096,
      }));
  }
  ['_updateSelectedRowIndexes'](_0x573bdc) {
    const _0x2455a0 = this._getScriptState(),
      _0x1b03ea = normalizeStoryboardScriptSelectedRowIndexes(_0x573bdc, _0x2455a0.rows.length),
      _0x30dc30 = { ..._0x2455a0, selectedRowIndexes: _0x1b03ea, updatedAt: Date.now() };
    ((this._data = { ...this._data, storyboardScript: _0x30dc30 }),
      this._syncListSelectionState(_0x30dc30),
      appStore.updateNodeData(this.nodeId, { storyboardScript: _0x30dc30 }));
  }
  ['_toggleRowSelection'](_0xe47852, _0x2acc3c) {
    const _0x24365b = this._getScriptState(),
      _0x176e43 = new Set(getSelectedRowIndexes(_0x24365b));
    if (_0x2acc3c) _0x176e43.add(_0xe47852);
    else _0x176e43.delete(_0xe47852);
    this._updateSelectedRowIndexes([..._0x176e43].sort((_0x619efb, _0x58ea42) => _0x619efb - _0x58ea42));
  }
  ['_setAllRowsSelected'](_0x32b494) {
    const _0x1131da = this._getScriptState(),
      _0xa340d = _0x32b494 ? _0x1131da.rows.map((_0x3218e6, _0x3bca31) => _0x3bca31) : [];
    this._updateSelectedRowIndexes(_0xa340d);
  }
  ['_setViewMode'](_0x3c2863) {
    this._finishCellEdit({ commit: true });
    const _0x1317a9 = normalizeStoryboardScriptViewMode(_0x3c2863),
      _0x3197c9 = this._getScriptState();
    if (_0x3197c9.viewMode === _0x1317a9) return;
    appStore.updateNodeData(this.nodeId, { storyboardScript: { ..._0x3197c9, viewMode: _0x1317a9 } });
  }
  ['_setMediaMode'](_0x44caa2) {
    this._finishCellEdit({ commit: true });
    const _0x336e2e = normalizeStoryboardScriptMediaMode(_0x44caa2),
      _0x325841 = this._getScriptState();
    if (_0x325841.mediaMode === _0x336e2e) return;
    appStore.updateNodeData(this.nodeId, {
      storyboardScript: { ..._0x325841, mediaMode: _0x336e2e, updatedAt: Date.now() },
    });
  }
  ['_syncModeButtons'](_0x284d8d, _0x356bba) {
    [this._listBtn, this._cardBtn].forEach((_0x2ce545) => {
      if (!_0x2ce545) return;
      const _0x5c672f = _0x2ce545.dataset.mode === _0x284d8d;
      (_0x2ce545.classList.toggle('is-active', _0x5c672f),
        _0x2ce545.setAttribute('aria-pressed', _0x5c672f ? 'true' : 'false'));
    });
    const _0x4bd2b9 = normalizeStoryboardScriptMediaMode(_0x356bba);
    [this._imageModeBtn, this._videoModeBtn].forEach((_0x151eb6) => {
      if (!_0x151eb6) return;
      const _0x36fe46 = _0x151eb6.dataset.mediaMode === _0x4bd2b9;
      (_0x151eb6.classList.toggle('is-active', _0x36fe46),
        _0x151eb6.setAttribute('aria-pressed', _0x36fe46 ? 'true' : 'false'));
    });
  }
  ['_isStoryboardScriptGenerating'](_0x4df7e6 = null) {
    const _0x29c953 = appStore.getState?.().nodes?.[this.nodeId] || this._data || {},
      _0x890e8b =
        _0x4df7e6 ||
        createDefaultStoryboardScriptState(_0x29c953.storyboardScript || this._data.storyboardScript || {});
    return (
      this._isGeneratingScript ||
      _0x29c953.isGenerating === true ||
      _0x890e8b.isGenerating === true ||
      String(_0x890e8b.jobStatus || _0x29c953.jobStatus || '') === 'running'
    );
  }
  ['_syncGeneratingOverlay'](_0x34ce66) {
    if (!this._bodyEl) return;
    const _0x26b32e = _0x34ce66 === true;
    (this.el?.classList?.toggle('is-storyboard-script-generating', _0x26b32e),
      this._bodyEl.classList.toggle('is-generating', _0x26b32e),
      this._bodyEl.setAttribute('aria-busy', _0x26b32e ? 'true' : 'false'));
    const _0x5c925f = this._bodyEl.querySelector('.storyboard-script-loading-overlay');
    if (!_0x26b32e) {
      _0x5c925f?.remove();
      return;
    }
    if (_0x5c925f) return;
    this._bodyEl.appendChild(createStoryboardScriptLoadingOverlay());
  }
  ['_setStoryboardGeneratingState'](_0x11088d, _0x4c3fc0 = {}) {
    const _0x3802ff = this._getScriptState(),
      _0x3aef8b = {
        ..._0x3802ff,
        ..._0x4c3fc0,
        isGenerating: _0x11088d === true,
        jobStatus: _0x11088d === true ? 'running' : _0x4c3fc0.jobStatus || '',
        updatedAt: Date.now(),
      };
    ((this._data = { ...this._data, storyboardScript: _0x3aef8b }),
      appStore.updateNodeData(this.nodeId, { storyboardScript: _0x3aef8b }));
  }
  ['_showStoryboardLoadingOverlayImmediately']() {
    if (this._isGeneratingScript) return;
    const _0x867fcc = this._getScriptState();
    if (_0x867fcc.selectionMode === true) return;
    ((this._isGeneratingScript = true),
      (this._isPromptGenerateLoadingPrimed = true),
      this._setStoryboardGeneratingState(true),
      this._syncGeneratingOverlay(true));
  }
  ['_bindPromptGenerateImmediateLoading']() {
    const _0x259525 = this.btnEl;
    if (!(_0x259525 instanceof HTMLElement)) return;
    _0x259525.addEventListener(
      'click',
      () => {
        if (_0x259525.disabled) return;
        this._showStoryboardLoadingOverlayImmediately();
      },
      { capture: true },
    );
  }
  ['_getEffectiveSubmitPromptText']() {
    return this._getStoryboardSubmitInput().promptText;
  }
  ['_getStoryboardSubmitInput']() {
    const _0x14fe0e = appStore.getState(),
      _0x5d0dab = _0x14fe0e.nodes || {},
      _0x4207b5 = _0x5d0dab?.[this.nodeId] || this._data || {},
      _0x50644f = appStore.getIncomingEdges(this.nodeId),
      _0x1edfdd = collectDirectStoryboardImageRefs(_0x50644f, _0x5d0dab),
      _0x231c3e = collectDirectStoryboardVideoRefs(_0x50644f, _0x5d0dab),
      _0x54e41d = [],
      _0x3bd474 = { image: _0x1edfdd.length, video: _0x231c3e.length, audio: 0 },
      _0x3da0e8 = resolvePromptTextWithTextRefs({
        promptEl: this.promptEl,
        inEdges: _0x50644f,
        nodes: _0x5d0dab,
        assetInputRefs: _0x54e41d,
        assetMediaCounts: _0x3bd474,
        allowedAssetTypes: ['text', 'image', 'video'],
      }).trim(),
      _0x40fa2c = getPromptAssetInputRefsFromNode(_0x4207b5, { allowedTypes: ['image', 'video'] }),
      _0x26729d = normalizeStoryboardImageInputRefs({
        directImageRefs: _0x1edfdd,
        promptAssetRefs: _0x54e41d,
        hiddenAssetRefs: _0x40fa2c,
      }),
      _0xc12de8 = normalizeStoryboardVideoInputRefs({
        directVideoRefs: _0x231c3e,
        promptAssetRefs: _0x54e41d,
        hiddenAssetRefs: _0x40fa2c,
      }),
      _0x12350c = _0x26729d.map((_0x4fc45f) => _0x4fc45f.url).filter(Boolean),
      _0x1380a1 = _0xc12de8.map((_0xe87433) => _0xe87433.url).filter(Boolean),
      _0xd0dbfb =
        _0x12350c.length > 0 && _0x1380a1.length > 0
          ? 'multimodal'
          : _0x1380a1.length > 0
            ? 'video'
            : _0x12350c.length > 0
              ? 'image'
              : 'text';
    return {
      promptText: _0x3da0e8,
      imageRefs: _0x26729d,
      videoRefs: _0xc12de8,
      imageLabels: _0x26729d.map((_0x44b1ac) => _0x44b1ac.label),
      videoLabels: _0xc12de8.map((_0x464c70) => _0x464c70.label),
      inputUrls: [..._0x12350c, ..._0x1380a1],
      inputImageUrls: _0x12350c,
      inputVideoUrls: _0x1380a1,
      sourceMode: _0xd0dbfb,
    };
  }
  ['_updateSubmitButtonState']() {
    if (!this.btnEl) return;
    const _0x4d3c74 = appStore.getState?.().nodes?.[this.nodeId] || this._data || {},
      _0x2035fa = createDefaultStoryboardScriptState(
        _0x4d3c74.storyboardScript || this._data.storyboardScript || {},
      ),
      _0x409fcd = resolveGenerationButtonMode(
        {
          ..._0x4d3c74,
          isGenerating:
            this._isGeneratingScript || _0x4d3c74.isGenerating === true || _0x2035fa.isGenerating === true,
          jobStatus: _0x2035fa.jobStatus || _0x4d3c74.jobStatus || '',
        },
        { cancellable: _0x4d3c74.taskCancellable === true },
      ),
      _0x461bab = this._getStoryboardSubmitInput(),
      _0x121f3b = _0x461bab.promptText,
      _0x3fcae9 = _0x2035fa.rows.length > 0 && _0x2035fa.selectionMode === true,
      _0x41213b = _0x3fcae9
        ? storyboardScriptText('toolbar.generateSelected')
        : storyboardScriptText('generate'),
      _0x3abbb4 = getSelectedRowIndexes(_0x2035fa).length,
      _0x92b1cd = _0x3fcae9
        ? _0x3abbb4 > 0
        : Boolean(_0x121f3b || _0x461bab.inputImageUrls.length > 0 || _0x461bab.inputVideoUrls.length > 0);
    this._syncGeneratingOverlay(_0x409fcd.busy);
    this._queueBtn &&
      ((this._queueBtn.hidden = !_0x3fcae9),
      (this._queueBtn.disabled = !_0x3fcae9 || _0x3abbb4 === 0 || _0x409fcd.busy),
      (this._queueBtn.style.cursor = this._queueBtn.disabled ? 'var(--unavailable-cursor)' : ''));
    this._syncToolbarButtonState({
      canGenerate: _0x2035fa.rows.length > 0 && !_0x409fcd.busy && !_0x409fcd.disabled,
      canDownload: Array.isArray(_0x2035fa.rows) && _0x2035fa.rows.length > 0,
    });
    if (_0x409fcd.busy) {
      (setGenerateButtonLoadingUi(this.btnEl, {
        title: _0x41213b,
        disabled: _0x409fcd.disabled,
        ariaLabel: _0x41213b,
      }),
        (this.btnEl.disabled = _0x409fcd.disabled),
        (this.btnEl.style.cursor = _0x409fcd.cursor));
      return;
    }
    (resetGenerateButtonIdleUi(this.btnEl, _0x41213b),
      !_0x92b1cd
        ? ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'))
        : ((this.btnEl.disabled = false), (this.btnEl.style.cursor = '')));
  }
  ['_syncToolbarButtonState']({
    canGenerate: _0x8abd24,
    canDownload: _0x55d66f,
    canFullscreen: _0x547312,
  } = {}) {
    this._toolbarGenerateBtn &&
      ((this._toolbarGenerateBtn.disabled = _0x8abd24 !== true),
      (this._toolbarGenerateBtn.style.cursor = _0x8abd24 === true ? '' : 'var(--unavailable-cursor)'));
    if (this._toolbarFullscreenBtn) {
      const _0x1b40c7 = (_0x547312 ?? _0x55d66f) === true;
      ((this._toolbarFullscreenBtn.disabled = !_0x1b40c7),
        (this._toolbarFullscreenBtn.style.cursor = _0x1b40c7 ? '' : 'var(--unavailable-cursor)'));
    }
    this._toolbarDownloadBtn &&
      ((this._toolbarDownloadBtn.disabled = _0x55d66f !== true),
      (this._toolbarDownloadBtn.style.cursor = _0x55d66f === true ? '' : 'var(--unavailable-cursor)'));
  }
  ['_syncGenerateButtonState']() {
    this._updateSubmitButtonState();
  }
  ['_createFullscreenCloseButton']() {
    const _0x5973e5 = document.createElement('button');
    return (
      (_0x5973e5.type = 'button'),
      (_0x5973e5.className = 'storyboard-script-fullscreen-close'),
      _0x5973e5.setAttribute('aria-label', storyboardScriptText('fullscreen.close')),
      (_0x5973e5.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'),
      _0x5973e5.addEventListener('click', (_0x2bd014) => {
        (_0x2bd014.stopPropagation(), this._closeFullscreenScript());
      }),
      _0x5973e5
    );
  }
  ['_openFullscreenScript']() {
    this._finishCellEdit({ commit: true });
    const _0x2b2256 = this._getScriptState();
    if (!Array.isArray(_0x2b2256.rows) || _0x2b2256.rows.length === 0) {
      window.showToast?.(storyboardScriptText('toasts.noFullscreenData'), 'warn');
      return;
    }
    if (this._fullscreenOverlayEl) {
      (this._renderFullscreenContent(_0x2b2256),
        this._fullscreenOverlayEl
          .querySelector('.storyboard-script-fullscreen-close')
          ?.focus?.({ preventScroll: true }));
      return;
    }
    const _0x24d860 = document.createElement('div');
    ((_0x24d860.className = 'storyboard-script-fullscreen-overlay'),
      _0x24d860.setAttribute('role', 'dialog'),
      _0x24d860.setAttribute('aria-modal', 'true'),
      _0x24d860.setAttribute('aria-label', storyboardScriptText('fullscreen.aria')));
    const _0x2ced88 = document.createElement('section');
    ((_0x2ced88.className = 'storyboard-script-fullscreen-panel'),
      _0x2ced88.addEventListener('pointerdown', (_0x29e9fc) => {
        _0x29e9fc.stopPropagation();
      }),
      _0x2ced88.addEventListener('dblclick', (_0x1f29e0) => {
        _0x1f29e0.stopPropagation();
      }));
    const _0x280bbf = document.createElement('header');
    _0x280bbf.className = 'storyboard-script-fullscreen-header';
    const _0x2850ad = document.createElement('div');
    _0x2850ad.className = 'storyboard-script-fullscreen-title-wrap';
    const _0x405adc = document.createElement('div');
    ((_0x405adc.className = 'storyboard-script-fullscreen-title'),
      (_0x405adc.textContent = _0x2b2256.title || this._data.name || getStoryboardScriptDefaultName()));
    const _0x785676 = document.createElement('div');
    ((_0x785676.className = 'storyboard-script-fullscreen-meta'),
      _0x2850ad.appendChild(_0x405adc),
      _0x2850ad.appendChild(_0x785676),
      _0x280bbf.appendChild(_0x2850ad),
      _0x280bbf.appendChild(this._createFullscreenCloseButton()));
    const _0x248520 = document.createElement('div');
    ((_0x248520.className = 'storyboard-script-fullscreen-body'),
      this._bindFullscreenBodyInteractions(_0x248520),
      _0x2ced88.appendChild(_0x280bbf),
      _0x2ced88.appendChild(_0x248520),
      _0x24d860.appendChild(_0x2ced88),
      _0x24d860.addEventListener('pointerdown', (_0x4f745e) => {
        _0x4f745e.stopPropagation();
        if (_0x4f745e.target === _0x24d860) this._closeFullscreenScript();
      }),
      (this._onFullscreenKeydown = (_0x2260c9) => {
        if (_0x2260c9.key !== 'Escape') return;
        (_0x2260c9.preventDefault(), _0x2260c9.stopPropagation(), this._closeFullscreenScript());
      }),
      document.addEventListener('keydown', this._onFullscreenKeydown, true),
      document.body.appendChild(_0x24d860),
      (this._fullscreenOverlayEl = _0x24d860),
      this._renderFullscreenContent(_0x2b2256),
      _0x24d860.querySelector('.storyboard-script-fullscreen-close')?.focus?.({ preventScroll: true }));
  }
  ['_closeFullscreenScript']() {
    (this._finishCellEdit({ commit: true }),
      this._onFullscreenKeydown &&
        (document.removeEventListener('keydown', this._onFullscreenKeydown, true),
        (this._onFullscreenKeydown = null)),
      this._fullscreenOverlayEl?.remove(),
      (this._fullscreenOverlayEl = null));
  }
  ['_bindFullscreenBodyInteractions'](_0x159be8) {
    if (!(_0x159be8 instanceof HTMLElement)) return;
    (_0x159be8.addEventListener(
      'wheel',
      (_0x46fb91) => {
        _0x46fb91.stopPropagation();
      },
      { passive: false },
    ),
      _0x159be8.addEventListener(
        'pointerdown',
        (_0x4874e1) => {
          const _0x6d23aa =
              _0x4874e1.target instanceof Element ? _0x4874e1.target : _0x4874e1.target?.parentElement,
            _0x55a55c = _0x6d23aa?.closest?.('[data-storyboard-edit-key]');
          if (!_0x55a55c || !_0x159be8.contains(_0x55a55c)) return;
          this._beginCellEdit(_0x55a55c, { focus: false, selectAll: false });
        },
        { capture: true },
      ),
      _0x159be8.addEventListener('pointerdown', (_0x5109de) => {
        _0x5109de.stopPropagation();
      }),
      _0x159be8.addEventListener('dblclick', (_0x2e5256) => {
        const _0x558ac6 =
            _0x2e5256.target instanceof Element ? _0x2e5256.target : _0x2e5256.target?.parentElement,
          _0x42045b = _0x558ac6?.closest?.('[data-storyboard-edit-key]');
        (_0x2e5256.preventDefault(), _0x2e5256.stopPropagation());
        if (!_0x42045b || !_0x159be8.contains(_0x42045b)) return;
        this._beginCellEdit(_0x42045b);
      }));
  }
  ['_renderFullscreenContent'](_0x166b01 = this._getScriptState(), _0x28f926 = null) {
    if (!this._fullscreenOverlayEl) return;
    const _0x2d3024 = this._fullscreenOverlayEl.querySelector('.storyboard-script-fullscreen-body');
    if (!(_0x2d3024 instanceof HTMLElement)) return;
    const _0x936153 = Array.isArray(_0x166b01.rows) ? _0x166b01.rows : [],
      _0x19a0e1 = _0x2d3024.querySelector('.storyboard-script-table-wrap, .storyboard-script-card-grid'),
      _0x52296f = _0x19a0e1 ? { left: _0x19a0e1.scrollLeft || 0, top: _0x19a0e1.scrollTop || 0 } : null,
      _0x3f48b2 =
        _0x28f926 ||
        mergeStoryboardImageRefs(this._getStoryboardSubmitInput().imageRefs, _0x166b01.referenceImageRefs),
      _0x293a04 = this._fullscreenOverlayEl.querySelector('.storyboard-script-fullscreen-title');
    _0x293a04 &&
      (_0x293a04.textContent = _0x166b01.title || this._data.name || getStoryboardScriptDefaultName());
    const _0x1b558c = this._fullscreenOverlayEl.querySelector('.storyboard-script-fullscreen-meta');
    if (_0x1b558c) {
      const _0x5cc04b =
          normalizeStoryboardScriptViewMode(_0x166b01.viewMode) === 'card'
            ? storyboardScriptText('viewMode.card')
            : storyboardScriptText('viewMode.list'),
        _0x4f96cb =
          normalizeStoryboardScriptMediaMode(_0x166b01.mediaMode) === 'video'
            ? storyboardScriptText('mediaMode.video')
            : storyboardScriptText('mediaMode.image');
      _0x1b558c.textContent = storyboardScriptText('fullscreen.meta', {
        count: _0x936153.length,
        media: _0x4f96cb,
        view: _0x5cc04b,
      });
    }
    _0x2d3024.replaceChildren();
    if (_0x936153.length === 0) {
      _0x2d3024.appendChild(this._createEmptyState());
      return;
    }
    const _0x295fce = buildStoryboardImageRefMap(_0x3f48b2),
      _0x52ee36 =
        normalizeStoryboardScriptViewMode(_0x166b01.viewMode) === 'card'
          ? this._createCardView(
              _0x936153,
              getStoryboardCardFieldsForMediaMode(_0x166b01.mediaMode, _0x936153),
              _0x295fce,
            )
          : this._createListView(
              _0x936153,
              getStoryboardColumnsForMediaMode(_0x166b01.mediaMode, _0x936153),
              _0x295fce,
              { selectionMode: false },
            );
    (_0x52ee36.classList.add('storyboard-script-fullscreen-scroller'), _0x2d3024.appendChild(_0x52ee36));
    if (_0x52296f) {
      const _0x25c69e = () => {
        ((_0x52ee36.scrollLeft = Math.max(0, _0x52296f.left)),
          (_0x52ee36.scrollTop = Math.max(0, _0x52296f.top)));
      };
      (_0x25c69e(),
        typeof window !== 'undefined' &&
          typeof window.requestAnimationFrame === 'function' &&
          window.requestAnimationFrame(_0x25c69e));
    }
  }
  ['_renderRefBar']() {
    _renderSharedRefBar(this);
  }
  ['_bindBodyInteractions']() {
    if (!this._bodyEl) return;
    (this._bodyEl.addEventListener(
      'wheel',
      (_0x21ff13) => {
        _0x21ff13.stopPropagation();
      },
      { passive: false },
    ),
      this._bodyEl.addEventListener(
        'pointerdown',
        (_0x1513ba) => {
          const _0x49b799 = this._getScriptState();
          if (_0x49b799.selectionMode !== true) return;
          const _0xcc9b4d =
              _0x1513ba.target instanceof Element ? _0x1513ba.target : _0x1513ba.target?.parentElement,
            _0x52eb00 = _0xcc9b4d?.closest?.('[data-storyboard-edit-key]');
          if (!_0x52eb00 || !this._bodyEl.contains(_0x52eb00)) return;
          this._beginCellEdit(_0x52eb00, { focus: false, selectAll: false });
        },
        { capture: true },
      ),
      this._bodyEl.addEventListener('pointerdown', (_0x34c4bf) => {
        const _0x1f4db2 = this._getScriptState();
        if (_0x1f4db2.selectionMode !== true) return;
        _0x34c4bf.stopPropagation();
      }),
      this._bodyEl.addEventListener('dblclick', (_0x42fd88) => {
        const _0x2b3c57 =
            _0x42fd88.target instanceof Element ? _0x42fd88.target : _0x42fd88.target?.parentElement,
          _0x434180 = _0x2b3c57?.closest?.('[data-storyboard-edit-key]');
        (_0x42fd88.preventDefault(), _0x42fd88.stopPropagation());
        const _0x4917a5 = this._getScriptState();
        if (_0x4917a5.selectionMode !== true) {
          this._enterSelectionMode();
          return;
        }
        if (!_0x434180 || !this._bodyEl.contains(_0x434180)) return;
        this._beginCellEdit(_0x434180);
      }));
  }
  ['_beginCellEdit'](_0xac877, { focus: focus = true, selectAll: selectAll = true } = {}) {
    if (!(_0xac877 instanceof HTMLElement)) return;
    if (this._activeCellEdit?.target === _0xac877) return;
    this._finishCellEdit({ commit: true });
    const _0x5ee7e9 = Number(_0xac877.dataset.storyboardRowIndex),
      _0x4d48e0 = String(_0xac877.dataset.storyboardEditKey || '');
    if (!Number.isInteger(_0x5ee7e9) || _0x5ee7e9 < 0 || !_0x4d48e0) return;
    const _0x3d4f83 = _0xac877.dataset.storyboardRawValue ?? _0xac877.textContent ?? '',
      _0x4763a2 = (_0x4a1694) => _0x4a1694.stopPropagation(),
      _0x19c1c5 = (_0x3cbfda) => _0x3cbfda.stopPropagation(),
      _0x14c495 = (_0x281446) => {
        _0x281446.stopPropagation();
        if (_0x281446.key === 'Enter' && !_0x281446.shiftKey)
          (_0x281446.preventDefault(), this._finishCellEdit({ commit: true }));
        else
          _0x281446.key === 'Escape' && (_0x281446.preventDefault(), this._finishCellEdit({ commit: false }));
      },
      _0x28a687 = () => this._finishCellEdit({ commit: true }),
      _0x1f4a8a = () => {
        (_0xac877.removeEventListener('pointerdown', _0x4763a2),
          _0xac877.removeEventListener('dblclick', _0x19c1c5),
          _0xac877.removeEventListener('keydown', _0x14c495),
          _0xac877.removeEventListener('blur', _0x28a687));
      };
    ((this._activeCellEdit = {
      target: _0xac877,
      rowIndex: _0x5ee7e9,
      key: _0x4d48e0,
      originalText: _0x3d4f83,
      cleanup: _0x1f4a8a,
    }),
      (_0xac877.textContent = _0x3d4f83),
      _0xac877.classList.remove('storyboard-script-image-cell'),
      _0xac877.classList.add('is-editing'),
      (_0xac877.contentEditable = 'true'),
      (_0xac877.spellcheck = false),
      _0xac877.addEventListener('pointerdown', _0x4763a2),
      _0xac877.addEventListener('dblclick', _0x19c1c5),
      _0xac877.addEventListener('keydown', _0x14c495),
      _0xac877.addEventListener('blur', _0x28a687));
    focus && _0xac877.focus({ preventScroll: true });
    const _0x4f3159 = selectAll ? window.getSelection?.() : null;
    if (_0x4f3159) {
      const _0x7030da = document.createRange();
      (_0x7030da.selectNodeContents(_0xac877), _0x4f3159.removeAllRanges(), _0x4f3159.addRange(_0x7030da));
    }
  }
  ['_finishCellEdit']({ commit: _0x259ffd }) {
    const _0x2fdeeb = this._activeCellEdit;
    if (!_0x2fdeeb) return;
    ((this._activeCellEdit = null),
      _0x2fdeeb.cleanup?.(),
      _0x2fdeeb.target.classList.remove('is-editing'),
      _0x2fdeeb.target.removeAttribute('contenteditable'),
      (_0x2fdeeb.target.spellcheck = false));
    if (!_0x259ffd) {
      this._restoreEditedCellDisplay(_0x2fdeeb.target, _0x2fdeeb.key, _0x2fdeeb.originalText);
      return;
    }
    const _0x424114 = String(_0x2fdeeb.target.textContent || '')
      .replace(/\u00a0/g, ' ')
      .trim();
    if (_0x424114 !== _0x2fdeeb.originalText)
      (this._restoreEditedCellDisplay(_0x2fdeeb.target, _0x2fdeeb.key, _0x424114),
        this._updateCellValue(_0x2fdeeb.rowIndex, _0x2fdeeb.key, _0x424114));
    else
      (_0x2fdeeb.key === '角色图' || _0x2fdeeb.key === '参考') &&
        this._restoreEditedCellDisplay(_0x2fdeeb.target, _0x2fdeeb.key, _0x2fdeeb.originalText);
  }
  ['_restoreEditedCellDisplay'](_0x23203e, _0x2f43dd, _0x163289) {
    if (!(_0x23203e instanceof HTMLElement)) return;
    const _0x460389 = this._getScriptState(),
      _0x38ec23 = this._getStoryboardSubmitInput(),
      _0x400aea = buildStoryboardImageRefMap(
        mergeStoryboardImageRefs(_0x38ec23.imageRefs, _0x460389.referenceImageRefs),
      );
    appendStoryboardCellDisplay(_0x23203e, _0x2f43dd, _0x163289, _0x400aea);
  }
  ['_updateCellValue'](_0x346b73, _0x547b50, _0x448e22) {
    const _0x32bc62 = this._getScriptState();
    if (!Array.isArray(_0x32bc62.rows) || !_0x32bc62.rows[_0x346b73]) return;
    const _0x31115c = _0x32bc62.rows.map((_0x961641, _0x8f0cc0) =>
        _0x8f0cc0 === _0x346b73 ? { ..._0x961641, [_0x547b50]: _0x448e22 } : _0x961641,
      ),
      _0x2f05f3 = serializeCanonicalStoryboardScriptJson({ ..._0x32bc62, rows: _0x31115c }),
      _0x1921d0 = JSON.parse(_0x2f05f3),
      _0x223c7a = {
        ..._0x32bc62,
        rows: _0x31115c,
        canonicalJson: _0x2f05f3,
        title: _0x1921d0.title,
        detectedIntent: _0x1921d0.detectedIntent,
        updatedAt: Date.now(),
      };
    ((this._data = { ...this._data, storyboardScript: _0x223c7a }),
      (this._skipNextStoryboardBodyRender = true),
      appStore.updateNodeData(this.nodeId, { storyboardScript: _0x223c7a }));
  }
  async ['_prepareStoryboardVideoFrames']({
    submitInput: _0x2f10dd,
    promptText: _0x36e452,
    model: _0x4e8a3e,
    provider: _0x50b700,
  }) {
    const _0x49f387 = Array.isArray(_0x2f10dd?.videoRefs) ? _0x2f10dd.videoRefs : [];
    if (_0x49f387.length === 0)
      return { frameRefs: [], frameBatches: [], frameSummary: '', visibleFrameRefs: [] };
    const _0x437aca = extractRequestedStoryboardShotCount(_0x36e452, { max: STORYBOARD_VIDEO_FRAME_LIMIT }),
      _0x227f28 = _0x437aca || STORYBOARD_VIDEO_FRAME_LIMIT,
      _0x4ca981 = Math.max(1, Math.ceil(_0x227f28 / _0x49f387.length)),
      _0xb33696 = getStoryboardModelImageInputLimit(_0x4e8a3e, _0x50b700),
      _0xb44b5c = [];
    for (const _0x4a30a8 of _0x49f387) {
      if (_0xb44b5c.length >= _0x227f28) break;
      const _0x25dab7 = _0x227f28 - _0xb44b5c.length,
        _0x5b9708 = Math.max(1, Math.min(_0x4ca981, _0x25dab7)),
        _0x5f0b97 = await extractStoryboardVideoFramesFromServer(_0x4a30a8.url, {
          maxFrames: _0x5b9708,
          exactCount: _0x437aca > 0,
        }),
        _0x33d178 = Array.isArray(_0x5f0b97.frames) ? _0x5f0b97.frames : [];
      for (const _0x34ceee of _0x33d178) {
        if (_0xb44b5c.length >= _0x227f28) break;
        const _0x14d218 = getStoryboardImagePlaceholder(_0xb44b5c.length + 1),
          _0x47c5da = String(_0x34ceee.url || '').trim();
        if (!_0x47c5da) continue;
        const _0x1582b0 = {
          ..._0x34ceee,
          label: _0x14d218,
          url: _0x47c5da,
          type: 'image',
          source: 'video-frame',
          videoLabel: _0x4a30a8.label,
          videoUrl: _0x4a30a8.url,
        };
        ((_0x1582b0.timeRange = formatStoryboardVideoTimeRange(_0x1582b0)), _0xb44b5c.push(_0x1582b0));
      }
    }
    const _0x11042c = _0xb44b5c.map((_0x27cf03, _0x2b9d7b) => ({
      ..._0x27cf03,
      sentAsImage: _0x2b9d7b < _0xb33696,
    }));
    return {
      frameRefs: _0x11042c,
      frameBatches: chunkStoryboardFrameRefs(_0x11042c, _0xb33696),
      frameSummary: buildStoryboardVideoFrameReferenceSummary(_0x11042c),
      visibleFrameRefs: _0x11042c,
    };
  }
  async ['_buildPayload']() {
    const _0xde2360 = this._getStoryboardSubmitInput(),
      _0x3275b7 = _0xde2360.promptText,
      _0x1a1d70 = _0xde2360.inputImageUrls.length > 0,
      _0x33dede = _0xde2360.inputVideoUrls.length > 0;
    if (!_0x3275b7 && !_0x1a1d70 && !_0x33dede)
      return (window.showToast?.(storyboardScriptText('toasts.missingPromptOrReference'), 'warn'), null);
    const _0x500116 = resolveStoryboardScriptTextModel(this._data),
      _0x14c385 = resolveStoryboardScriptTextProvider(this._data),
      _0x5e20ef = _0xde2360.sourceMode,
      _0x4e0d74 =
        _0x5e20ef === 'video'
          ? await this._prepareStoryboardVideoFrames({
              submitInput: _0xde2360,
              promptText: _0x3275b7,
              model: _0x500116,
              provider: _0x14c385,
            })
          : { frameRefs: [], frameBatches: [], frameSummary: '', visibleFrameRefs: [] },
      _0x15d4e0 =
        _0x3275b7 ||
        buildStoryboardReferenceSummary({
          imageLabels: _0xde2360.imageLabels,
          videoLabels: _0xde2360.videoLabels,
        }),
      _0x42b31e = buildStoryboardReferenceSummary({
        imageLabels: _0xde2360.imageLabels,
        videoLabels: _0xde2360.videoLabels,
      });
    let _0x3befbb = buildStoryboardScriptTextOnlyPrompt(_0x3275b7),
      _0x292599 = buildStoryboardScriptTextOnlySystemPrompt();
    if (_0x5e20ef === 'image')
      ((_0x3befbb = buildStoryboardScriptImagePrompt(_0x3275b7, {
        imageCount: _0xde2360.inputImageUrls.length,
        imageLabels: _0xde2360.imageLabels,
      })),
        (_0x292599 = buildStoryboardScriptImageSystemPrompt()));
    else {
      if (_0x5e20ef === 'video')
        ((_0x3befbb = buildStoryboardScriptVideoPrompt(_0x3275b7, {
          videoCount: _0xde2360.inputVideoUrls.length,
          videoLabels: _0xde2360.videoLabels,
          videoFrameSummary: _0x4e0d74.frameSummary,
        })),
          (_0x292599 = buildStoryboardScriptVideoSystemPrompt()));
      else
        _0x5e20ef === 'multimodal' &&
          ((_0x3befbb = buildStoryboardScriptPrompt(_0x3275b7, {
            summary: _0x42b31e,
            imageCount: _0xde2360.inputImageUrls.length,
            imageLabels: _0xde2360.imageLabels,
            videoCount: _0xde2360.inputVideoUrls.length,
            videoLabels: _0xde2360.videoLabels,
          })),
          (_0x292599 = ''));
    }
    return {
      prompt: _0x3befbb,
      systemPrompt: _0x292599,
      storyboardPrompt: _0x15d4e0,
      sourceMode: _0x5e20ef,
      inputUrls:
        _0x5e20ef === 'video'
          ? [
              ..._0x4e0d74.visibleFrameRefs
                .filter((_0x41b762) => _0x41b762.sentAsImage !== false)
                .map((_0x3feb3e) => _0x3feb3e.url)
                .filter(Boolean),
              ..._0xde2360.inputVideoUrls,
            ]
          : _0xde2360.inputUrls,
      inputImageUrls:
        _0x5e20ef === 'video'
          ? _0x4e0d74.visibleFrameRefs
              .filter((_0x241a9a) => _0x241a9a.sentAsImage !== false)
              .map((_0x388d51) => _0x388d51.url)
              .filter(Boolean)
          : _0xde2360.inputImageUrls,
      inputVideoUrls: _0xde2360.inputVideoUrls,
      videoLabels: _0xde2360.videoLabels,
      videoFrameRefs: _0x4e0d74.visibleFrameRefs,
      videoFrameBatches: _0x4e0d74.frameBatches,
      referenceImageRefs: _0x4e0d74.visibleFrameRefs,
      rawPromptText: _0x3275b7,
      model: _0x500116,
      provider: _0x14c385,
      nodeId: this.nodeId,
    };
  }
  ['_createImageNodesFromSelectedStoryboards']({ startGeneration: startGeneration = false } = {}) {
    this._finishCellEdit({ commit: true });
    const _0x10bc93 = appStore.getState?.().nodes?.[this.nodeId] || this._data || {},
      _0x1a0696 = createDefaultStoryboardScriptState(
        _0x10bc93.storyboardScript || this._data.storyboardScript || {},
      ),
      _0xd2f270 = serializeCanonicalStoryboardScriptJson(_0x1a0696),
      _0x8be444 = JSON.parse(_0xd2f270),
      _0x41c977 = getSelectedRowIndexes(_0x1a0696);
    if (_0x1a0696.selectionMode !== true) return false;
    if (_0x41c977.length === 0)
      return (window.showToast?.(storyboardScriptText('toasts.selectStoryboardsFirst'), 'warn'), true);
    const _0x4f7199 = _0x41c977.map((_0x2a71dd) => {
        const _0x4d4a2b = _0x1a0696.rows[_0x2a71dd] || {};
        return {
          rowIndex: _0x2a71dd,
          shotNo: getStoryboardRowShotNo(_0x4d4a2b, _0x2a71dd),
          prompt: getStoryboardRowImagePrompt(_0x4d4a2b),
        };
      }),
      _0x277dcc = _0x4f7199.filter((_0x1fe595) => !_0x1fe595.prompt);
    if (_0x277dcc.length > 0)
      return (window.showToast?.(storyboardScriptText('toasts.missingImagePrompt'), 'warn'), true);
    const _0x3a619d = _0x1a0696.imageModel || DEFAULT_IMAGE_NODE_MODEL,
      _0x44ce15 = _0x1a0696.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      _0x273eb4 = resolveStoryboardScriptTextModel({ storyboardScript: _0x1a0696 }),
      _0x2226d7 = resolveStoryboardScriptTextProvider({ storyboardScript: _0x1a0696 }),
      _0x1c6486 = clonePlainObject(_0x10bc93.generationParams),
      _0x193db7 = clonePlainObject(_0x10bc93.generationParamsByModel),
      _0x35e44f = _0x1c6486?.aspectRatio || _0x10bc93.aspectRatio || '自适应',
      _0x38cb5c = _0x1c6486?.imageSize || _0x10bc93.imageSize || '',
      _0x130f83 = getImageNodeSizeForAspectRatio(_0x35e44f),
      _0xb62fb8 = getStateSnapshot(),
      _0x12c316 = createBatchSpawnLayoutNearNode({
        nodes: _0xb62fb8.nodes || {},
        anchorNode: _0x10bc93,
        itemCount: _0x4f7199.length,
        itemWidth: _0x130f83.width,
        itemHeight: _0x130f83.height,
        maxPerLine: 5,
        padding: STORYBOARD_IMAGE_BATCH_PADDING,
        titleHeight: STORYBOARD_IMAGE_BATCH_TITLE_HEIGHT,
      }),
      _0x3289bc = generateId('group');
    appStore.addNode({
      id: _0x3289bc,
      type: 'group',
      x: _0x12c316.groupX,
      y: _0x12c316.groupY,
      width: _0x12c316.groupWidth,
      height: _0x12c316.groupHeight,
      name: storyboardScriptText('imageBatchGroupName'),
      label: storyboardScriptText('imageBatchGroupName'),
    });
    const _0x463030 = [];
    (_0x4f7199.forEach((_0xcdefaa, _0x536ff1) => {
      const _0x52d104 = _0x12c316.getItemPosition(_0x536ff1),
        _0x5b70fd = generateId('ai-image'),
        _0x7874bb = {
          id: _0x5b70fd,
          type: 'ai-image',
          x: _0x52d104.x,
          y: _0x52d104.y,
          width: _0x130f83.width,
          height: _0x130f83.height,
          name: storyboardScriptText('imageNodeName', { shot: _0xcdefaa.shotNo || _0x536ff1 + 1 }),
          prompt: escapePromptTextForHtml(_0xcdefaa.prompt),
          model: _0x3a619d,
          provider: _0x44ce15,
          aspectRatio: _0x35e44f,
          needsAutoResize: true,
          storyboardSource: { nodeId: this.nodeId, rowIndex: _0xcdefaa.rowIndex, shotNo: _0xcdefaa.shotNo },
        };
      _0x1c6486 && (_0x7874bb.generationParams = clonePlainObject(_0x1c6486));
      _0x193db7 && (_0x7874bb.generationParamsByModel = clonePlainObject(_0x193db7));
      if (_0x38cb5c) _0x7874bb.imageSize = _0x38cb5c;
      (appStore.addNode(_0x7874bb), _0x463030.push(_0x5b70fd));
    }),
      appStore.groupNodes(_0x463030, _0x3289bc));
    const _0x28f395 = {
      ..._0x1a0696,
      canonicalJson: _0xd2f270,
      title: _0x8be444.title,
      detectedIntent: _0x8be444.detectedIntent,
      selectionMode: false,
      selectedRowIndexes: [],
      updatedAt: Date.now(),
    };
    return (
      (this._data = { ...this._data, model: _0x273eb4, provider: _0x2226d7, storyboardScript: _0x28f395 }),
      appStore.updateNodeData(this.nodeId, {
        model: _0x273eb4,
        provider: _0x2226d7,
        storyboardScript: _0x28f395,
      }),
      commit(),
      startGeneration
        ? this._startGeneratedImageNodes(_0x463030, {
            onStarted: () => focusStoryboardImageBatch(this.nodeId, _0x3289bc),
          })
        : focusStoryboardImageBatch(this.nodeId, _0x3289bc),
      window.showToast?.(
        startGeneration
          ? storyboardScriptText('toasts.createdAndStartedImageNodes', { count: _0x463030.length })
          : storyboardScriptText('toasts.createdImageNodes', { count: _0x463030.length }),
        'success',
      ),
      true
    );
  }
  ['_startGeneratedImageNodes'](_0x1bd4e3 = [], { onStarted: onStarted = null } = {}) {
    const _0x14b734 = Array.isArray(_0x1bd4e3)
      ? _0x1bd4e3.map((_0x5375f2) => String(_0x5375f2 || '').trim()).filter(Boolean)
      : [];
    if (_0x14b734.length === 0 || typeof window === 'undefined') return;
    const _0x1bb43f = new Set(_0x14b734),
      _0x413f98 = 'storyboard-script:' + this.nodeId + ':auto-generate',
      _0x4ae1ac = () => window.v2Renderer || null,
      _0x73f19e = (_0x34019d) => {
        typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame(_0x34019d)
          : window.setTimeout(_0x34019d, 16);
      };
    _0x4ae1ac()?.pinNode && _0x14b734.forEach((_0x460f0d) => _0x4ae1ac()?.pinNode?.(_0x460f0d, _0x413f98));
    let _0x20e591 = 0;
    const _0x20f57d = 30;
    let _0x2e9cba = false;
    const _0x379cb8 = () => {
        if (_0x2e9cba) return;
        _0x2e9cba = true;
        if (typeof onStarted !== 'function') return;
        try {
          onStarted();
        } catch (_0x2a436d) {
          console.warn('[StoryboardScriptNode] post-start callback failed', _0x2a436d);
        }
      },
      _0x12de1f = () => {
        _0x20e591 += 1;
        const _0x2661ce = _0x4ae1ac();
        _0x2661ce?.flushNodes?.([..._0x1bb43f]);
        for (const _0xdfa1af of Array.from(_0x1bb43f)) {
          const _0x21f0db = _0x2661ce?.nodeInstances?.get?.(_0xdfa1af);
          if (!_0x21f0db || typeof _0x21f0db.runGeneration !== 'function') continue;
          (_0x1bb43f.delete(_0xdfa1af),
            Promise.resolve()
              .then(() => _0x21f0db.runGeneration())
              .catch((_0x5cdf46) => {
                console.error('[StoryboardScriptNode] auto image generation failed', _0x5cdf46);
              })
              .finally(() => {
                _0x4ae1ac()?.unpinNode?.(_0xdfa1af, _0x413f98);
              }));
        }
        if (_0x1bb43f.size === 0) {
          _0x379cb8();
          return;
        }
        if (_0x1bb43f.size > 0 && _0x20e591 < _0x20f57d) {
          _0x73f19e(_0x12de1f);
          return;
        }
        (_0x1bb43f.size > 0 &&
          (_0x1bb43f.forEach((_0x391c36) => {
            _0x4ae1ac()?.unpinNode?.(_0x391c36, _0x413f98);
          }),
          window.showToast?.(storyboardScriptText('toasts.autoStartPartialFailed'), 'warn')),
          _0x379cb8());
      };
    _0x73f19e(_0x12de1f);
  }
  ['runGeneration'](_0x301089 = {}) {
    return this._onGenerate(_0x301089);
  }
  ['cancelGeneration']() {
    return {
      ok: false,
      status: 'not-cancellable',
      message: 'Storyboard script generation is not cancellable yet.',
    };
  }
  ['getGenerationStatus']() {
    const _0x43fe4c = appStore.getState?.().nodes?.[this.nodeId] || this._data || {},
      _0x16c10b = createDefaultStoryboardScriptState(
        _0x43fe4c.storyboardScript || this._data.storyboardScript || {},
      ),
      _0x1b518c = this._isStoryboardScriptGenerating(_0x16c10b);
    return {
      nodeId: this.nodeId,
      jobStatus: _0x1b518c ? 'running' : String(_0x16c10b.jobStatus || 'idle'),
      isGenerating: _0x1b518c,
      cancellable: false,
      resumable: false,
    };
  }
  async ['_onGenerate'](_0x178e3d = {}) {
    const _0x1b914b = this._isPromptGenerateLoadingPrimed === true;
    if (this._isGeneratingScript && !_0x1b914b) return;
    this._isPromptGenerateLoadingPrimed = false;
    const _0x11b81f = this._getScriptState();
    if (_0x11b81f.selectionMode === true) {
      ((this._isGeneratingScript = false),
        this._syncGeneratingOverlay(false),
        this._createImageNodesFromSelectedStoryboards({ startGeneration: true }));
      return;
    }
    this._isGeneratingScript = true;
    !_0x1b914b && this._setStoryboardGeneratingState(true);
    (this._syncGeneratingOverlay(true),
      await waitForStoryboardLoadingPaint(),
      this._updateSubmitButtonState());
    let _0x1b4025 = null;
    try {
      _0x1b4025 = await this._buildPayload();
    } catch (_0x44c2ca) {
      ((this._isGeneratingScript = false),
        this._setStoryboardGeneratingState(false),
        this._updateSubmitButtonState(),
        window.showToast?.(
          _0x44c2ca?.message || storyboardScriptText('errors.videoPreprocessFailed'),
          'error',
        ));
      return;
    }
    if (!_0x1b4025) {
      ((this._isGeneratingScript = false),
        this._setStoryboardGeneratingState(false),
        this._updateSubmitButtonState());
      return;
    }
    const _0x1e2621 = Date.now(),
      _0x4cdf11 = this._getScriptState(),
      _0x444995 = resolveModelManifest(_0x1b4025.model, _0x1b4025.provider);
    try {
      const _0x2697de = await submitTask(
        {
          sourceNodeId: this.nodeId,
          targetNodeId: this.nodeId,
          trigger: 'node',
          taskType: 'storyboard-script-generation',
          provider: _0x1b4025.provider,
          adapterType: 'modelApi',
          modelId: _0x1b4025.model,
          executionId:
            _0x444995?.executionId || 'storyboard-script.' + _0x1b4025.provider + '.' + _0x1b4025.model,
          payload: _0x1b4025,
          cancellable: false,
          resumable: false,
          async: false,
          submit: () => runStoryboardScriptGenerationPayload(_0x1b4025),
          startBuilder: () => ({
            model: _0x1b4025.model,
            provider: _0x1b4025.provider,
            storyboardScript: buildStoryboardScriptStatePatch({
              current: _0x4cdf11,
              prompt: _0x1b4025.storyboardPrompt,
              model: _0x1b4025.model,
              provider: _0x1b4025.provider,
              sourceMode: _0x1b4025.sourceMode,
              status: 'running',
              referenceImageRefs: _0x1b4025.referenceImageRefs,
            }),
          }),
          resultBuilder: async (_0x445b78) => {
            const _0x5bcc1e = extractGeneratedText(_0x445b78).trim(),
              _0x2def86 = normalizeStoryboardScriptGenerationResult(_0x5bcc1e, {
                requireMarker: true,
                sourceMode: _0x1b4025.sourceMode,
              });
            if (!_0x2def86.ok) throw new Error(storyboardScriptText('errors.invalidJsonSwitchModel'));
            return {
              name: _0x2def86.title || this._data.name || getStoryboardScriptDefaultName(),
              model: _0x1b4025.model,
              provider: _0x1b4025.provider,
              storyboardScript: buildStoryboardScriptStatePatch({
                current: _0x4cdf11,
                prompt: _0x1b4025.storyboardPrompt,
                model: _0x1b4025.model,
                provider: _0x1b4025.provider,
                sourceMode: _0x1b4025.sourceMode,
                normalized: _0x2def86,
                status: 'success',
                referenceImageRefs: _0x1b4025.referenceImageRefs,
              }),
            };
          },
          failureBuilder: (_0x275847) => ({
            storyboardScript: buildStoryboardScriptStatePatch({
              current: _0x4cdf11,
              prompt: _0x1b4025.storyboardPrompt,
              model: _0x1b4025.model,
              provider: _0x1b4025.provider,
              sourceMode: _0x1b4025.sourceMode,
              status: 'error',
              error: _0x275847?.message || storyboardScriptText('errors.generationFailed'),
              referenceImageRefs: _0x1b4025.referenceImageRefs,
            }),
          }),
          parseError: (_0x363c36) => _0x363c36?.message || storyboardScriptText('errors.generationFailed'),
        },
        { store: appStore, startedAt: _0x1e2621 },
      );
      _0x2697de.status === 'failed' &&
        window.showToast?.(
          _0x2697de.error?.message || storyboardScriptText('errors.generationFailed'),
          'error',
        );
    } finally {
      ((this._isGeneratingScript = false), this._updateSubmitButtonState());
    }
  }
  ['_downloadScriptTable']() {
    this._finishCellEdit({ commit: true });
    const _0xdf86e8 = this._getScriptState();
    if (!Array.isArray(_0xdf86e8.rows) || _0xdf86e8.rows.length === 0) {
      window.showToast?.(storyboardScriptText('toasts.noDownloadData'), 'warn');
      return;
    }
    const _0xa1d01a = serializeCanonicalStoryboardScriptJson(_0xdf86e8),
      _0x5eb584 = JSON.parse(_0xa1d01a),
      _0x471aba = {
        ..._0xdf86e8,
        canonicalJson: _0xa1d01a,
        title: _0x5eb584.title,
        detectedIntent: _0x5eb584.detectedIntent,
        updatedAt: Date.now(),
      };
    ((this._data = { ...this._data, storyboardScript: _0x471aba }),
      appStore.updateNodeData(this.nodeId, { storyboardScript: _0x471aba }));
    const _0x55ab32 = STORYBOARD_SCRIPT_COLUMNS.map((_0x2628d8) => ({
        ..._0x2628d8,
        label: getStoryboardColumnLabel(_0x2628d8.key, _0x2628d8.label),
      })),
      _0x4a0938 = serializeStoryboardScriptRowsToCsv(_0x471aba.rows, _0x55ab32),
      _0x41a467 = sanitizeExportFileName(
        _0x471aba.title || this._data.name || getStoryboardScriptDefaultName(),
      );
    (downloadTextFile({
      filename: _0x41a467 + '_' + formatExportTimestamp() + '.csv',
      content: _0x4a0938,
      mimeType: STORYBOARD_SCRIPT_TABLE_EXPORT_MIME,
    }),
      window.showToast?.(storyboardScriptText('toasts.downloadedTable'), 'success'));
  }
  ['_getStoryboardViewScrollKey'](_0x500b73, _0x1e7890 = '') {
    const _0x212e50 = normalizeStoryboardScriptMediaMode(_0x500b73?.mediaMode),
      _0x3de44c = normalizeStoryboardScriptViewMode(_0x1e7890 || _0x500b73?.viewMode);
    return _0x212e50 + ':' + _0x3de44c;
  }
  ['_getCurrentStoryboardScroller']() {
    return this._bodyEl?.querySelector?.('.storyboard-script-table-wrap, .storyboard-script-card-grid');
  }
  ['_rememberStoryboardViewScroll'](_0x45dc01, _0x22ecce, _0x25baf3 = '') {
    if (!(_0x45dc01 instanceof HTMLElement)) return;
    const _0x1dc522 = this._getStoryboardViewScrollKey(_0x22ecce, _0x25baf3);
    this._storyboardViewScrollByKey.set(_0x1dc522, { left: _0x45dc01.scrollLeft, top: _0x45dc01.scrollTop });
  }
  ['_captureStoryboardViewScroll'](_0xc59e16) {
    const _0x5b1abc = this._getCurrentStoryboardScroller();
    if (!(_0x5b1abc instanceof HTMLElement)) return;
    const _0x437185 = _0x5b1abc.classList.contains('storyboard-script-card-grid') ? 'card' : 'list';
    this._rememberStoryboardViewScroll(_0x5b1abc, _0xc59e16, _0x437185);
  }
  ['_bindStoryboardViewScrollMemory'](_0x364290, _0x358e20) {
    if (!(_0x364290 instanceof HTMLElement)) return;
    if (_0x364290.dataset.storyboardScrollMemoryBound === 'true') return;
    ((_0x364290.dataset.storyboardScrollMemoryBound = 'true'),
      _0x364290.addEventListener('scroll', () => this._rememberStoryboardViewScroll(_0x364290, _0x358e20), {
        passive: true,
      }));
  }
  ['_restoreStoryboardViewScroll'](_0x47500, _0x65c4b9) {
    if (!(_0x47500 instanceof HTMLElement)) return;
    const _0xf3c309 = this._getStoryboardViewScrollKey(_0x65c4b9),
      _0x5dd3ab = this._storyboardViewScrollByKey.get(_0xf3c309);
    if (!_0x5dd3ab) return;
    const _0x45a64a = () => {
      const _0x3ed383 = Math.max(0, _0x47500.scrollWidth - _0x47500.clientWidth),
        _0x252e75 = Math.max(0, _0x47500.scrollHeight - _0x47500.clientHeight);
      ((_0x47500.scrollLeft = Math.min(_0x3ed383, Math.max(0, _0x5dd3ab.left || 0))),
        (_0x47500.scrollTop = Math.min(_0x252e75, Math.max(0, _0x5dd3ab.top || 0))));
    };
    (_0x45a64a(),
      typeof window !== 'undefined' &&
        typeof window.requestAnimationFrame === 'function' &&
        window.requestAnimationFrame(_0x45a64a));
  }
  ['_render']() {
    if (!this._bodyEl) return;
    const _0x55ea50 = this._getScriptState(),
      _0x1dd744 = this._isStoryboardScriptGenerating(_0x55ea50);
    (this._captureStoryboardViewScroll(_0x55ea50),
      this._syncModeButtons(_0x55ea50.viewMode, _0x55ea50.mediaMode),
      this._syncSelectionModeUi(_0x55ea50),
      this._updateSubmitButtonState());
    const _0x429dca = this._getStoryboardSubmitInput(),
      _0x37309d = mergeStoryboardImageRefs(_0x429dca.imageRefs, _0x55ea50.referenceImageRefs),
      _0x28ea2f = buildStoryboardBodyRenderSignature(_0x55ea50, _0x37309d),
      _0x3d51f7 = this._getCurrentStoryboardScroller(),
      _0x2a3b8a =
        _0x3d51f7 instanceof HTMLElement &&
        (this._storyboardBodyRenderSignature === _0x28ea2f || this._skipNextStoryboardBodyRender === true);
    if (_0x2a3b8a) {
      ((this._storyboardBodyRenderSignature = _0x28ea2f),
        (this._skipNextStoryboardBodyRender = false),
        this._bindStoryboardViewScrollMemory(_0x3d51f7, _0x55ea50),
        this._restoreStoryboardViewScroll(_0x3d51f7, _0x55ea50),
        this._syncListSelectionState(_0x55ea50),
        this._syncGeneratingOverlay(_0x1dd744),
        this._renderFullscreenContent(_0x55ea50, _0x37309d));
      return;
    }
    ((this._skipNextStoryboardBodyRender = false),
      (this._storyboardBodyRenderSignature = _0x28ea2f),
      this._bodyEl.replaceChildren());
    if (_0x55ea50.rows.length === 0) {
      (this._bodyEl.appendChild(this._createEmptyState()),
        this._syncGeneratingOverlay(_0x1dd744),
        this._renderFullscreenContent(_0x55ea50, _0x37309d));
      return;
    }
    const _0x47bc69 = buildStoryboardImageRefMap(_0x37309d);
    let _0xc191fc = null;
    (_0x55ea50.viewMode === 'card'
      ? ((_0xc191fc = this._createCardView(
          _0x55ea50.rows,
          getStoryboardCardFieldsForMediaMode(_0x55ea50.mediaMode, _0x55ea50.rows),
          _0x47bc69,
        )),
        this._bodyEl.appendChild(_0xc191fc))
      : ((_0xc191fc = this._createListView(
          _0x55ea50.rows,
          getStoryboardColumnsForMediaMode(_0x55ea50.mediaMode, _0x55ea50.rows),
          _0x47bc69,
        )),
        this._bodyEl.appendChild(_0xc191fc)),
      this._bindStoryboardViewScrollMemory(_0xc191fc, _0x55ea50),
      this._restoreStoryboardViewScroll(_0xc191fc, _0x55ea50),
      this._syncListSelectionState(_0x55ea50),
      this._syncGeneratingOverlay(_0x1dd744),
      this._renderFullscreenContent(_0x55ea50, _0x37309d));
  }
  ['_createEmptyState']() {
    const _0x39bcbe = document.createElement('div');
    _0x39bcbe.className = 'storyboard-script-empty';
    const _0x2193b1 = document.createElement('div');
    ((_0x2193b1.className = 'storyboard-script-empty-title'),
      (_0x2193b1.textContent = storyboardScriptText('empty.title')));
    const _0xe942f5 = document.createElement('div');
    return (
      (_0xe942f5.className = 'storyboard-script-empty-hint'),
      (_0xe942f5.textContent = storyboardScriptText('empty.hint')),
      _0x39bcbe.appendChild(_0x2193b1),
      _0x39bcbe.appendChild(_0xe942f5),
      _0x39bcbe
    );
  }
  ['_createListView'](
    _0x2689e2,
    _0x4600eb = STORYBOARD_SCRIPT_COLUMNS,
    _0x3b0c31 = new Map(),
    { selectionMode: _0x5b2965 = null } = {},
  ) {
    const _0xb55a = document.createElement('div');
    _0xb55a.className = 'storyboard-script-table-wrap custom-scrollbar';
    const _0x8a3e6e = this._getScriptState(),
      _0x3aacff = _0x5b2965 == null ? _0x8a3e6e.selectionMode === true : _0x5b2965 === true,
      _0x32d763 = _0x3aacff ? getSelectedRowIndexes(_0x8a3e6e) : [],
      _0x968825 = new Set(_0x32d763),
      _0x23faba = _0x2689e2.length > 0 && _0x32d763.length === _0x2689e2.length,
      _0x33466c = document.createElement('table');
    ((_0x33466c.className = 'storyboard-script-table'),
      _0x33466c.classList.toggle('is-selection-mode', _0x3aacff));
    const _0x129485 = document.createElement('thead'),
      _0x98d468 = document.createElement('tr');
    if (_0x3aacff) {
      const _0xbceece = document.createElement('th');
      ((_0xbceece.scope = 'col'),
        (_0xbceece.className = 'storyboard-script-select-cell storyboard-script-select-cell--head'));
      const _0x4b95cd = document.createElement('input');
      ((_0x4b95cd.type = 'checkbox'),
        (_0x4b95cd.className = 'storyboard-script-select-checkbox storyboard-script-select-all'),
        (_0x4b95cd.checked = _0x23faba),
        (_0x4b95cd.indeterminate = _0x32d763.length > 0 && !_0x23faba),
        _0x4b95cd.setAttribute('aria-label', storyboardScriptText('selectAllAria')),
        _0x4b95cd.addEventListener('pointerdown', (_0x268435) => {
          _0x268435.stopPropagation();
        }),
        _0x4b95cd.addEventListener('click', (_0x43408b) => {
          (_0x43408b.stopPropagation(), this._setAllRowsSelected(_0x4b95cd.checked));
        }),
        _0xbceece.appendChild(_0x4b95cd),
        _0x98d468.appendChild(_0xbceece));
    }
    (_0x4600eb.forEach((_0x1d0109) => {
      const _0x2f1d44 = document.createElement('th');
      ((_0x2f1d44.scope = 'col'),
        (_0x2f1d44.dataset.storyboardColumnDensity = resolveStoryboardColumnDensity(_0x1d0109.key)),
        (_0x2f1d44.textContent = getStoryboardColumnLabel(_0x1d0109.key, _0x1d0109.label)),
        _0x98d468.appendChild(_0x2f1d44));
    }),
      _0x129485.appendChild(_0x98d468));
    const _0x356dbf = document.createElement('tbody');
    return (
      _0x2689e2.forEach((_0x3c678e, _0x492db0) => {
        const _0x64f35 = document.createElement('tr');
        _0x64f35.dataset.storyboardRowIndex = String(_0x492db0);
        if (_0x3aacff) {
          const _0x19266c = document.createElement('td');
          _0x19266c.className = 'storyboard-script-select-cell';
          const _0x125a7e = document.createElement('input');
          ((_0x125a7e.type = 'checkbox'),
            (_0x125a7e.className = 'storyboard-script-select-checkbox'),
            (_0x125a7e.checked = _0x968825.has(_0x492db0)),
            _0x125a7e.setAttribute(
              'aria-label',
              storyboardScriptText('selectRowAria', { index: _0x492db0 + 1 }),
            ),
            _0x125a7e.addEventListener('pointerdown', (_0x1d3215) => {
              _0x1d3215.stopPropagation();
            }),
            _0x125a7e.addEventListener('click', (_0x51760a) => {
              (_0x51760a.stopPropagation(), this._toggleRowSelection(_0x492db0, _0x125a7e.checked));
            }),
            _0x19266c.appendChild(_0x125a7e),
            _0x64f35.appendChild(_0x19266c));
        }
        (_0x4600eb.forEach((_0x46f14b) => {
          const _0x2b4a3b = document.createElement('td');
          ((_0x2b4a3b.className = 'storyboard-script-editable'),
            (_0x2b4a3b.dataset.storyboardRowIndex = String(_0x492db0)),
            (_0x2b4a3b.dataset.storyboardEditKey = _0x46f14b.key),
            (_0x2b4a3b.dataset.storyboardColumnDensity = resolveStoryboardColumnDensity(_0x46f14b.key)),
            appendStoryboardCellDisplay(_0x2b4a3b, _0x46f14b.key, _0x3c678e[_0x46f14b.key], _0x3b0c31),
            _0x64f35.appendChild(_0x2b4a3b));
        }),
          _0x356dbf.appendChild(_0x64f35));
      }),
      _0x33466c.appendChild(_0x129485),
      _0x33466c.appendChild(_0x356dbf),
      _0xb55a.appendChild(_0x33466c),
      _0xb55a
    );
  }
  ['_syncListSelectionState'](_0x465b15 = this._getScriptState()) {
    const _0x1ec5e8 = _0x465b15.selectionMode === true,
      _0x6e14e0 = _0x1ec5e8 ? getSelectedRowIndexes(_0x465b15) : [],
      _0x52315b = new Set(_0x6e14e0),
      _0x4ab000 = this._bodyEl?.querySelector?.('.storyboard-script-table');
    if (!(_0x4ab000 instanceof HTMLElement)) return;
    _0x4ab000.classList.toggle('is-selection-mode', _0x1ec5e8);
    const _0x16aaf2 =
        _0x1ec5e8 &&
        Array.isArray(_0x465b15.rows) &&
        _0x465b15.rows.length > 0 &&
        _0x6e14e0.length === _0x465b15.rows.length,
      _0x4f7fb5 = _0x4ab000.querySelector('.storyboard-script-select-all');
    (_0x4f7fb5 instanceof HTMLInputElement &&
      ((_0x4f7fb5.checked = _0x16aaf2),
      (_0x4f7fb5.indeterminate = _0x1ec5e8 && _0x6e14e0.length > 0 && !_0x16aaf2)),
      _0x4ab000.querySelectorAll('tbody tr').forEach((_0x3a43b7, _0x5594ea) => {
        if (!(_0x3a43b7 instanceof HTMLElement)) return;
        const _0xc8b7f = Number(_0x3a43b7.dataset.storyboardRowIndex || _0x5594ea),
          _0x11cdf8 = _0x52315b.has(_0xc8b7f),
          _0xba96e9 = _0x3a43b7.querySelector('.storyboard-script-select-checkbox');
        _0xba96e9 instanceof HTMLInputElement && (_0xba96e9.checked = _0x11cdf8);
      }));
  }
  ['_createCardView'](_0x3ab29f, _0xbe2768 = CARD_FIELDS, _0x3085ef = new Map()) {
    const _0x170adc = document.createElement('div');
    return (
      (_0x170adc.className = 'storyboard-script-card-grid custom-scrollbar'),
      _0x3ab29f.forEach((_0x20bd4d, _0x106d5a) => {
        const _0x476e50 = document.createElement('article');
        _0x476e50.className = 'storyboard-script-card';
        const _0x4b893d = document.createElement('div');
        _0x4b893d.className = 'storyboard-script-card-head';
        const _0x4a58e4 = document.createElement('span');
        ((_0x4a58e4.className = 'storyboard-script-shot storyboard-script-editable'),
          (_0x4a58e4.dataset.storyboardRowIndex = String(_0x106d5a)),
          (_0x4a58e4.dataset.storyboardEditKey = '镜号'),
          (_0x4a58e4.textContent =
            formatCellValue(_0x20bd4d['镜号']) ||
            storyboardScriptText('shotFallback', { index: _0x106d5a + 1 })),
          _0x4b893d.appendChild(_0x4a58e4));
        const _0x4c79e6 = formatCellValue(_0x20bd4d['时长']);
        if (_0x4c79e6) {
          const _0x226b57 = document.createElement('span');
          ((_0x226b57.className = 'storyboard-script-duration storyboard-script-editable'),
            (_0x226b57.dataset.storyboardRowIndex = String(_0x106d5a)),
            (_0x226b57.dataset.storyboardEditKey = '时长'),
            (_0x226b57.textContent = _0x4c79e6),
            _0x4b893d.appendChild(_0x226b57));
        }
        (_0x476e50.appendChild(_0x4b893d),
          _0xbe2768.forEach((_0xf51b89) => {
            const _0x50051a = formatCellValue(_0x20bd4d[_0xf51b89]);
            if (!_0x50051a) return;
            const _0x19b4c8 = document.createElement('div');
            _0x19b4c8.className = 'storyboard-script-card-field';
            const _0x2999d9 = document.createElement('span');
            ((_0x2999d9.className = 'storyboard-script-card-label'),
              (_0x2999d9.textContent = getStoryboardColumnLabel(_0xf51b89, _0xf51b89)));
            const _0xfcd86e = document.createElement('span');
            ((_0xfcd86e.className = 'storyboard-script-card-value storyboard-script-editable'),
              (_0xfcd86e.dataset.storyboardRowIndex = String(_0x106d5a)),
              (_0xfcd86e.dataset.storyboardEditKey = _0xf51b89),
              appendStoryboardCellDisplay(_0xfcd86e, _0xf51b89, _0x50051a, _0x3085ef),
              _0x19b4c8.appendChild(_0x2999d9),
              _0x19b4c8.appendChild(_0xfcd86e),
              _0x476e50.appendChild(_0x19b4c8));
          }),
          _0x170adc.appendChild(_0x476e50));
      }),
      _0x170adc
    );
  }
  ['update'](_0x2f26b6) {
    this._data = _0x2f26b6 || {};
    if (document.activeElement !== this.promptEl && _0x2f26b6?.prompt !== undefined) {
      const _0x546f3c = sanitizePromptHtml(_0x2f26b6.prompt || '');
      this.promptEl?.innerHTML !== _0x546f3c &&
        ((this.promptEl.innerHTML = _0x546f3c), _rehydratePromptPills(this));
    }
    (this._syncPromptBoxSizeFromData?.(_0x2f26b6), this._renderRefBar(), this._render());
  }
  ['unmount']() {
    (this._closeFullscreenScript(),
      this._finishCellEdit({ commit: true }),
      this._flushPromptHtmlCommit?.(),
      this._unbindRefThumbHoverPreview?.(),
      (this._unbindRefThumbHoverPreview = null),
      this._unbindOutsideSelectionCancel(),
      this._unbindStoryboardImageModelTrigger(),
      this._removeStoryboardImageModelMenu(),
      this._storyboardImageSchemaCleanup?.(),
      (this._storyboardImageSchemaCleanup = null),
      this._sharedPanelCleanup?.());
  }
}
