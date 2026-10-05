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
function storyboardScriptText(value, item = {}) {
  return t('storyboardScript.' + value, item);
}
function getStoryboardColumnLabel(key, index = '') {
  const enabled = STORYBOARD_COLUMN_I18N_KEYS[String(key || '')];
  if (!enabled) return String(index || key || '');
  return storyboardScriptText('columns.' + enabled);
}
const getStateSnapshot = () =>
  typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function getSelectedRowIndexes(result) {
  return normalizeStoryboardScriptSelectedRowIndexes(
    result?.selectedRowIndexes,
    Array.isArray(result?.rows) ? result.rows.length : 0,
  );
}
function resolveStoryboardColumnDensity(data) {
  const options = String(data || '');
  if (NARROW_TABLE_COLUMNS.has(options)) return 'narrow';
  if (COMPACT_TABLE_COLUMNS.has(options)) return 'compact';
  if (WIDE_TABLE_COLUMNS.has(options)) return 'wide';
  return 'normal';
}
function getStoryboardColumnsForMediaMode(mediaMode, rows2 = []) {
  return getStoryboardScriptDisplayColumns({ mediaMode: mediaMode, rows: rows2 });
}
function getStoryboardCardFieldsForMediaMode(mediaMode2, rows3 = []) {
  return getStoryboardScriptDisplayColumns({ mediaMode: mediaMode2, rows: rows3 })
    .map((event) => event.key)
    .filter((item2) => CARD_FIELD_KEYS.has(item2));
}
function formatCellValue(target) {
  if (target == null) return '';
  if (typeof target === 'string') return target;
  if (typeof target === 'number' || typeof target === 'boolean') return String(target);
  try {
    return JSON.stringify(target);
  } catch {
    return String(target);
  }
}
const STORYBOARD_IMAGE_PLACEHOLDER_PATTERN = /@图片\d+/g;
function normalizeStoryboardImagePlaceholder(source) {
  return String(source || '')
    .trim()
    .replace(/\s+/g, '');
}
function extractStoryboardImagePlaceholders(next) {
  return String(next || '').match(STORYBOARD_IMAGE_PLACEHOLDER_PATTERN) || [];
}
function extractGeneratedText(error2) {
  if (typeof error2 === 'string') return error2;
  return String(
    error2?.text || error2?.outputText || error2?.output || error2?.content || error2?.message || '',
  );
}
function getStoryboardImagePlaceholder(current) {
  return '@图片' + Math.max(1, Math.trunc(Number(current) || 1));
}
function getStoryboardVideoPlaceholder(entry) {
  return '@视频' + Math.max(1, Math.trunc(Number(entry) || 1));
}
function buildStoryboardImageRefMap(list = []) {
  const list2 = Array.isArray(list) ? list : [],
    map = new Map();
  return (
    list2.forEach((response, record) => {
      const label =
          normalizeStoryboardImagePlaceholder(response?.label) || getStoryboardImagePlaceholder(record + 1),
        url = String(response?.url || '').trim();
      if (!label || !url) return;
      map.set(label, { ...response, label: label, url: url });
    }),
    map
  );
}
function mergeStoryboardImageRefs(...args) {
  const list3 = [],
    map2 = new Set();
  return (
    args.flat().forEach((response2) => {
      const label2 = normalizeStoryboardImagePlaceholder(response2?.label),
        url2 = String(response2?.url || '').trim();
      if (!label2 || !url2 || map2.has(label2)) return;
      (map2.add(label2), list3.push({ ...response2, label: label2, url: url2, type: 'image' }));
    }),
    list3
  );
}
function pickStoryboardIndexedItem(list4, payload) {
  if (!Array.isArray(list4) || list4.length === 0) return null;
  const handle = Number.isFinite(Number(payload)) ? Math.max(0, Math.trunc(Number(payload))) : 0;
  return list4[Math.min(handle, list4.length - 1)] || null;
}
function toStoryboardUsableMediaUrl(state) {
  const enabled2 = String(state || '').trim();
  if (!enabled2) return '';
  if (/^(?:https?:|blob:|data:|\/)/i.test(enabled2)) return enabled2;
  return localPathToUrl(enabled2) || '';
}
function resolveStoryboardVideoRefUrl(response3 = {}) {
  const response4 = pickStoryboardIndexedItem(response3?.videos, response3?.mainVideoIndex),
    list5 = [
      resolveCanvasVideoUrl(response4),
      resolveCanvasVideoUrl(response3),
      response4?.videoUrl,
      response4?.url,
      response4?.src,
      response4?.localPath,
      response3?.videoUrl,
      response3?.url,
      response3?.src,
      response3?.localPath,
    ];
  return list5.map((item3) => toStoryboardUsableMediaUrl(item3)).find(Boolean) || '';
}
function createStoryboardRoleImagePreview(config, map3 = new Map()) {
  const list6 = extractStoryboardImagePlaceholders(config),
    list7 = list6
      .map((item4) => map3.get(normalizeStoryboardImagePlaceholder(item4)))
      .filter((response5) => response5?.url);
  if (list7.length === 0) return null;
  const el = document.createElement('span');
  ((el.className = 'storyboard-script-role-images'),
    list7.slice(0, 3).forEach((response6) => {
      const scope = document.createElement('img');
      ((scope.className = 'storyboard-script-role-image-thumb'),
        (scope.src = response6.url),
        (scope.alt = response6.label || getStoryboardColumnLabel('角色图')),
        (scope.loading = 'lazy'),
        (scope.draggable = false),
        (scope.title = response6.label || ''),
        el.appendChild(scope));
    }));
  if (list7.length > 3) {
    const el2 = document.createElement('span');
    ((el2.className = 'storyboard-script-role-image-more'),
      (el2.textContent = '+' + (list7.length - 3)),
      el.appendChild(el2));
  }
  return el;
}
function appendStoryboardCellDisplay(el3, input, output, value2 = new Map()) {
  const formatCellValue2 = formatCellValue(output);
  ((el3.dataset.storyboardRawValue = formatCellValue2),
    el3.replaceChildren(),
    el3.classList.remove('storyboard-script-image-cell'));
  if (input === '角色图' || input === '参考') {
    const storyboardRoleImagePreview = createStoryboardRoleImagePreview(formatCellValue2, value2);
    if (storyboardRoleImagePreview) {
      (el3.classList.add('storyboard-script-image-cell'), el3.appendChild(storyboardRoleImagePreview));
      return;
    }
  }
  el3.textContent = formatCellValue2;
}
function buildStoryboardBodyRenderSignature(selectionMode, value3 = []) {
  const refs = mergeStoryboardImageRefs(value3, selectionMode?.referenceImageRefs).map((response7) => ({
    label: normalizeStoryboardImagePlaceholder(response7?.label),
    url: String(response7?.url || '').trim(),
  }));
  try {
    return JSON.stringify({
      viewMode: normalizeStoryboardScriptViewMode(selectionMode?.viewMode),
      mediaMode: normalizeStoryboardScriptMediaMode(selectionMode?.mediaMode),
      selectionMode: selectionMode?.selectionMode === true,
      rows: Array.isArray(selectionMode?.rows) ? selectionMode.rows : [],
      refs: refs,
    });
  } catch {
    return '' + Date.now();
  }
}
function collectDirectStoryboardImageRefs(list8 = [], value4 = {}) {
  const list9 = [];
  for (const value5 of Array.isArray(list8) ? list8 : []) {
    const enabled3 = value4?.[value5?.sourceId];
    if (!enabled3) continue;
    if (resolveEffectiveInputKind(enabled3, value5) !== 'image') continue;
    const url3 = resolveGenerationInputImageUrl(enabled3);
    if (!url3) continue;
    list9.push({
      label: getStoryboardImagePlaceholder(list9.length + 1),
      url: url3,
      type: 'image',
      sourceId: String(value5?.sourceId || ''),
      source: 'node',
    });
  }
  return list9;
}
function collectDirectStoryboardVideoRefs(list10 = [], value6 = {}) {
  const list11 = [];
  for (const value7 of Array.isArray(list10) ? list10 : []) {
    const enabled4 = value6?.[value7?.sourceId];
    if (!enabled4) continue;
    if (resolveEffectiveInputKind(enabled4, value7) !== 'video') continue;
    const url4 = resolveStoryboardVideoRefUrl(enabled4);
    if (!url4) continue;
    list11.push({
      label: getStoryboardVideoPlaceholder(list11.length + 1),
      url: url4,
      type: 'video',
      sourceId: String(value7?.sourceId || ''),
      source: 'node',
    });
  }
  return list11;
}
function normalizeStoryboardImageInputRefs({
  directImageRefs: directImageRefs = [],
  promptAssetRefs: promptAssetRefs = [],
  hiddenAssetRefs: hiddenAssetRefs = [],
} = {}) {
  const list12 = [],
    handler = (response8, value8 = '') => {
      const url5 = String(response8?.url || '').trim();
      if (!url5) return;
      const label3 =
        String(response8?.placeholder || response8?.label || value8 || '').trim() ||
        getStoryboardImagePlaceholder(list12.length + 1);
      list12.push({ ...response8, label: label3, url: url5, type: 'image' });
    };
  return (
    directImageRefs.forEach((item5) => handler(item5, item5?.label)),
    promptAssetRefs
      .filter((item6) => item6?.type === 'image')
      .forEach((args2) => handler({ ...args2, label: '' }, args2?.placeholder)),
    hiddenAssetRefs
      .filter((item7) => item7?.type === 'image')
      .forEach((args3) => {
        handler({ ...args3, label: '' }, getStoryboardImagePlaceholder(list12.length + 1));
      }),
    list12.map((label4, value9) => ({
      ...label4,
      label: label4.label || getStoryboardImagePlaceholder(value9 + 1),
    }))
  );
}
function normalizeStoryboardVideoInputRefs({
  directVideoRefs: directVideoRefs = [],
  promptAssetRefs: promptAssetRefs = [],
  hiddenAssetRefs: hiddenAssetRefs = [],
} = {}) {
  const list13 = [],
    handler2 = (response9, value10 = '') => {
      const url6 = String(response9?.url || '').trim();
      if (!url6) return;
      const label5 =
        String(response9?.placeholder || response9?.label || value10 || '').trim() ||
        getStoryboardVideoPlaceholder(list13.length + 1);
      list13.push({ ...response9, label: label5, url: url6, type: 'video' });
    };
  return (
    directVideoRefs.forEach((item8) => handler2(item8, item8?.label)),
    promptAssetRefs
      .filter((item9) => item9?.type === 'video')
      .forEach((args4) => handler2({ ...args4, label: '' }, args4?.placeholder)),
    hiddenAssetRefs
      .filter((item10) => item10?.type === 'video')
      .forEach((args5) => {
        handler2({ ...args5, label: '' }, getStoryboardVideoPlaceholder(list13.length + 1));
      }),
    list13.map((label6, value11) => ({
      ...label6,
      label: label6.label || getStoryboardVideoPlaceholder(value11 + 1),
    }))
  );
}
function buildStoryboardReferenceSummary({
  imageLabels: imageLabels = [],
  videoLabels: videoLabels = [],
} = {}) {
  const list14 = [];
  return (
    Array.isArray(imageLabels) &&
      imageLabels.length > 0 &&
      list14.push('参考图片：' + imageLabels.join('、')),
    Array.isArray(videoLabels) &&
      videoLabels.length > 0 &&
      list14.push('参考视频：' + videoLabels.join('、')),
    list14.join('\n')
  );
}
function formatStoryboardVideoTime(value12) {
  const value13 = Math.max(0, Number(value12) || 0),
    value14 = Math.floor(value13),
    value15 = Math.floor(value14 / 60),
    value16 = value14 % 60,
    value17 = Math.round((value13 - value14) * 10);
  return String(value15).padStart(2, '0') + ':' + String(value16).padStart(2, '0') + '.' + value17;
}
function formatStoryboardVideoTimeRange(options2 = {}) {
  const formatStoryboardVideoTime2 = formatStoryboardVideoTime(options2.start),
    formatStoryboardVideoTime3 = formatStoryboardVideoTime(
      Number(options2.end) > Number(options2.start) ? options2.end : options2.captureTime,
    );
  return formatStoryboardVideoTime2 + '-' + formatStoryboardVideoTime3;
}
function buildStoryboardVideoFrameReferenceSummary(list15 = []) {
  const list16 = Array.isArray(list15) ? list15 : [];
  if (list16.length === 0) return '';
  return list16
    .map((item11) => {
      const storyboardImagePlaceholder = normalizeStoryboardImagePlaceholder(item11?.label),
        value18 = String(item11?.videoLabel || '@视频1').trim(),
        value19 = String(item11?.timeRange || '').trim(),
        value20 = item11?.sentAsImage === false ? '（仅提供时间码，画面请结合原视频判断）' : '';
      return storyboardImagePlaceholder + '：来自 ' + value18 + (value19 ? ' ' + value19 : '') + value20;
    })
    .filter(Boolean)
    .join('\n');
}
function getStoryboardModelImageInputLimit(value21, value22) {
  const modelManifest = getModelManifest(value21, value22),
    count = Number(modelManifest?.inputSlots?.maxByKind?.image);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : STORYBOARD_VIDEO_FRAME_LIMIT;
}
function chunkStoryboardFrameRefs(list17 = [], value23 = STORYBOARD_VIDEO_FRAME_LIMIT) {
  const list18 = Array.isArray(list17) ? list17 : [],
    value24 = Math.max(1, Math.trunc(Number(value23) || 1)),
    list19 = [];
  for (let value25 = 0; value25 < list18.length; value25 += value24) {
    list19.push(list18.slice(value25, value25 + value24));
  }
  return list19;
}
function buildCombinedStoryboardBatchJson({
  rows: rows = [],
  title: title = getStoryboardScriptDefaultName(),
} = {}) {
  const shotCount = (Array.isArray(rows) ? rows : []).map((args6, value26) => ({
    ...args6,
    镜号: String(value26 + 1),
  }));
  return JSON.stringify(
    {
      schemaVersion: STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION,
      type: 'storyboard-script',
      sourceMode: 'video',
      title: String(title || getStoryboardScriptDefaultName()).trim() || getStoryboardScriptDefaultName(),
      detectedIntent: { shotCount: shotCount.length, language: 'zh-CN' },
      rows: shotCount,
    },
    null,
    2,
  );
}
async function runStoryboardScriptGenerationPayload(videoLabels2) {
  const list20 = Array.isArray(videoLabels2?.videoFrameBatches)
    ? videoLabels2.videoFrameBatches.filter((list21) => Array.isArray(list21) && list21.length > 0)
    : [];
  if (videoLabels2?.sourceMode !== 'video' || list20.length <= 1) return generateText(videoLabels2);
  const rows4 = [];
  let title2 = '';
  for (const list22 of list20) {
    const inputImageUrls = list22.map((response10) => response10.url).filter(Boolean),
      prompt = buildStoryboardScriptVideoPrompt(videoLabels2.rawPromptText || '', {
        videoCount: Array.isArray(videoLabels2.inputVideoUrls) ? videoLabels2.inputVideoUrls.length : 0,
        videoLabels: videoLabels2.videoLabels,
        videoFrameSummary: buildStoryboardVideoFrameReferenceSummary(
          list22.map((args7) => ({ ...args7, sentAsImage: true })),
        ),
      }),
      generateText2 = await generateText({
        ...videoLabels2,
        prompt: prompt,
        inputImageUrls: inputImageUrls,
        inputUrls: [...inputImageUrls, ...(videoLabels2.inputVideoUrls || [])],
      }),
      response11 = normalizeStoryboardScriptGenerationResult(extractGeneratedText(generateText2).trim(), {
        requireMarker: true,
        sourceMode: 'video',
      });
    if (!response11.ok) throw new Error(storyboardScriptText('errors.invalidJsonTooManyFrames'));
    if (!title2) title2 = response11.title;
    rows4.push(...response11.rows);
  }
  return {
    text: buildCombinedStoryboardBatchJson({
      rows: rows4,
      title: title2 || getStoryboardScriptDefaultName(),
    }),
  };
}
function resolveStoryboardScriptTextModel(options3 = {}) {
  const value27 = String(
    options3.storyboardScript?.model || options3.model || STORYBOARD_SCRIPT_TEXT_MODEL,
  ).trim();
  return value27 || STORYBOARD_SCRIPT_TEXT_MODEL;
}
function resolveStoryboardScriptTextProvider(options4 = {}) {
  const value28 = String(
    options4.storyboardScript?.provider || options4.provider || STORYBOARD_SCRIPT_TEXT_PROVIDER,
  ).trim();
  return value28 || STORYBOARD_SCRIPT_TEXT_PROVIDER;
}
function buildStoryboardScriptStatePatch({
  current: current2,
  prompt: prompt2,
  model: model,
  provider: provider,
  sourceMode: sourceMode = '',
  status: status,
  normalized: normalized = null,
  error: error = '',
  referenceImageRefs: referenceImageRefs = null,
}) {
  const rows5 = normalized?.rows ?? current2.rows ?? [],
    title3 = buildCanonicalStoryboardScriptJson({ ...current2, ...(normalized || {}), rows: rows5 });
  return {
    ...current2,
    version: 1,
    viewMode: current2.viewMode || 'list',
    prompt: prompt2,
    model: model,
    provider: provider,
    sourceMode: normalized?.sourceMode || sourceMode || current2.sourceMode || 'text',
    isGenerating: status === 'running',
    jobStatus: status,
    jobError: error,
    rawJson: normalized?.rawJson ?? current2.rawJson ?? '',
    canonicalJson: JSON.stringify(title3, null, 2),
    rows: rows5,
    selectedRowIndexes: normalized
      ? []
      : normalizeStoryboardScriptSelectedRowIndexes(current2.selectedRowIndexes, rows5.length),
    selectionMode: normalized ? false : current2.selectionMode === true,
    title: title3.title,
    detectedIntent: title3.detectedIntent,
    referenceImageRefs: Array.isArray(referenceImageRefs)
      ? referenceImageRefs
      : Array.isArray(current2.referenceImageRefs)
        ? current2.referenceImageRefs
        : [],
    warnings: normalized?.warnings ?? current2.warnings ?? [],
    updatedAt: Date.now(),
  };
}
function createToolbarButton({
  action: action,
  label: label7,
  tooltip: tooltip,
  iconHtml: iconHtml,
  showLabel: showLabel = false,
}) {
  const el4 = document.createElement('button');
  return (
    (el4.type = 'button'),
    (el4.className = ['ftb-btn', showLabel ? '' : 'icon-only', 'act-' + action].filter(Boolean).join(' ')),
    (el4.dataset.tooltip = tooltip || label7),
    el4.setAttribute('aria-label', label7),
    (el4.innerHTML = showLabel ? iconHtml + '<span>' + label7 + '</span>' : iconHtml),
    el4
  );
}
function setToolbarButtonLabel(el5, value29) {
  if (!el5) return;
  ((el5.dataset.tooltip = value29), el5.setAttribute('aria-label', value29));
  const el6 = el5.querySelector('span');
  if (el6) el6.textContent = value29;
}
function replaceModelTriggerIcon(el7, value30) {
  const enabled5 = el7?.firstElementChild,
    enabled6 = String(value30 || '').trim();
  if (!enabled5 || !enabled6) return;
  const enabled7 = el7.dataset?.storyboardModelIconHtml || '';
  if (enabled7 === enabled6) return;
  if (!enabled7 && String(enabled5.outerHTML || '').trim() === enabled6) {
    el7.dataset.storyboardModelIconHtml = enabled6;
    return;
  }
  const el8 = document.createElement('template');
  el8.innerHTML = enabled6;
  const enabled8 = el8.content.firstElementChild;
  if (!enabled8) return;
  ((el7.dataset.storyboardModelIconHtml = enabled6), enabled5.replaceWith(enabled8));
}
function escapePromptTextForHtml(value31) {
  return String(value31 || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function getStoryboardRowImagePrompt(enabled9) {
  if (!enabled9 || typeof enabled9 !== 'object') return '';
  return formatCellValue(
    enabled9['图片提示词'] ?? enabled9.imagePrompt ?? enabled9.image_prompt ?? enabled9.imagePromptText ?? '',
  ).trim();
}
function getStoryboardRowShotNo(value32, value33) {
  return formatCellValue(value32?.['镜号'] ?? value32?.shotNo ?? value32?.shotNumber ?? value33 + 1).trim();
}
function clonePlainObject(args8) {
  if (!args8 || typeof args8 !== 'object' || Array.isArray(args8)) return null;
  try {
    return JSON.parse(JSON.stringify(args8));
  } catch {
    return { ...args8 };
  }
}
function getPlainObject(args9) {
  return args9 && typeof args9 === 'object' && !Array.isArray(args9) ? { ...args9 } : {};
}
function getImageNodeSizeForAspectRatio(ratioValue) {
  const width = getAIGenerationDefaultSizeByType('ai-image'),
    box = buildImageDisplayRatioResizePatch({
      nodeData: { x: 0, y: 0, width: width.width, height: width.height },
      ratioValue: ratioValue,
      minSide: Math.min(width.width, width.height),
    });
  return {
    width: Number(box.width) || width.width,
    height: Number(box.height) || width.height,
  };
}
function sanitizeExportFileName(value34) {
  const value35 = String(value34 || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return value35 || getStoryboardScriptDefaultName();
}
function formatExportTimestamp(value36 = new Date()) {
  const run = (value37) => String(value37).padStart(2, '0');
  return [
    value36.getFullYear(),
    run(value36.getMonth() + 1),
    run(value36.getDate()),
    '-',
    run(value36.getHours()),
    run(value36.getMinutes()),
    run(value36.getSeconds()),
  ].join('');
}
function downloadTextFile({ filename: filename, content: content, mimeType: mimeType }) {
  const blob = new Blob([content], { type: mimeType }),
    value38 = URL.createObjectURL(blob),
    el9 = document.createElement('a');
  ((el9.href = value38),
    (el9.download = filename),
    (el9.rel = 'noopener'),
    document.body.appendChild(el9),
    el9.click(),
    el9.remove(),
    window.setTimeout(() => URL.revokeObjectURL(value38), 0));
}
function focusStoryboardImageBatch(value39, value40) {
  const list23 = [value39, value40].map((item12) => String(item12 || '').trim()).filter(Boolean);
  if (list23.length === 0) return;
  appStore.setSelectedNodes(list23);
  const value41 = typeof window !== 'undefined' ? window : null;
  try {
    if (typeof value41?.v2FocusOnNodes === 'function') value41.v2FocusOnNodes(list23, 80, 800);
    else
      typeof value41?.v2FocusOnNode === 'function' &&
        value41.v2FocusOnNode(list23[list23.length - 1], 80, 800);
  } catch (value42) {
    console.warn('[StoryboardScriptNode] focus created image batch failed', value42);
  }
}
function createStoryboardScriptLoadingOverlay() {
  const el10 = document.createElement('div');
  ((el10.className = 'storyboard-script-loading-overlay'),
    el10.setAttribute('role', 'status'),
    el10.setAttribute('aria-live', 'polite'));
  const value43 = document.createElement('div');
  ((value43.className = 'storyboard-script-loading-spinner'), el10.appendChild(value43));
  const el11 = document.createElement('div');
  ((el11.className = 'storyboard-script-loading-label'),
    (el11.textContent = storyboardScriptText('loading')),
    el10.appendChild(el11));
  const el12 = document.createElement('div');
  el12.className = 'storyboard-script-loading-bar';
  const value44 = document.createElement('div');
  return (
    (value44.className = 'storyboard-script-loading-bar-fill'),
    el12.appendChild(value44),
    el10.appendChild(el12),
    el10
  );
}
function waitForStoryboardLoadingPaint() {
  const enabled10 = typeof window !== 'undefined' ? window : null;
  if (!enabled10) return Promise.resolve();
  return new Promise((handler3) => {
    const run2 = () => handler3();
    if (typeof enabled10.requestAnimationFrame === 'function') {
      enabled10.requestAnimationFrame(() => {
        typeof enabled10.setTimeout === 'function' ? enabled10.setTimeout(run2, 0) : run2();
      });
      return;
    }
    if (typeof enabled10.setTimeout === 'function') {
      enabled10.setTimeout(run2, 0);
      return;
    }
    run2();
  });
}
function createSvgIcon() {
  const value45 = 'http://www.w3.org/2000/svg',
    el13 = document.createElementNS(value45, 'svg');
  (el13.setAttribute('width', '16'),
    el13.setAttribute('height', '16'),
    el13.setAttribute('viewBox', '0 0 24 24'),
    el13.setAttribute('fill', 'none'),
    el13.setAttribute('stroke', 'currentColor'),
    el13.setAttribute('stroke-width', '2'));
  const el14 = document.createElementNS(value45, 'rect');
  (el14.setAttribute('x', '3'),
    el14.setAttribute('y', '4'),
    el14.setAttribute('width', '18'),
    el14.setAttribute('height', '16'),
    el14.setAttribute('rx', '2'),
    el13.appendChild(el14),
    ['9', '14'].forEach((item13) => {
      const el15 = document.createElementNS(value45, 'line');
      (el15.setAttribute('x1', '3'),
        el15.setAttribute('y1', item13),
        el15.setAttribute('x2', '21'),
        el15.setAttribute('y2', item13),
        el13.appendChild(el15));
    }));
  const el16 = document.createElementNS(value45, 'line');
  return (
    el16.setAttribute('x1', '8'),
    el16.setAttribute('y1', '4'),
    el16.setAttribute('x2', '8'),
    el16.setAttribute('y2', '20'),
    el13.appendChild(el16),
    el13
  );
}
export class StoryboardScriptNode {
  constructor(value46) {
    ((this._data = value46 || {}),
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
    const el17 = document.createElement('div');
    el17.className = 'storyboard-script-header';
    const el18 = document.createElement('div');
    ((el18.className = 'storyboard-script-title'), el18.appendChild(createSvgIcon()));
    const el19 = document.createElement('span');
    ((el19.textContent = getStoryboardScriptDefaultName()), el18.appendChild(el19));
    const el20 = document.createElement('span');
    ((el20.className = 'storyboard-script-beta'), (el20.textContent = 'BETA'), el18.appendChild(el20));
    const el21 = document.createElement('div');
    el21.className = 'storyboard-script-header-controls';
    const el22 = document.createElement('div');
    ((el22.className = 'storyboard-script-media-switch'),
      el22.setAttribute('role', 'group'),
      el22.setAttribute('aria-label', storyboardScriptText('mediaModeAria')),
      (this._imageModeBtn = this._createMediaModeButton('image', storyboardScriptText('mediaMode.image'))),
      (this._videoModeBtn = this._createMediaModeButton('video', storyboardScriptText('mediaMode.video'))),
      el22.appendChild(this._imageModeBtn),
      el22.appendChild(this._videoModeBtn));
    const el23 = document.createElement('div');
    return (
      (el23.className = 'storyboard-script-view-switch'),
      el23.setAttribute('role', 'group'),
      el23.setAttribute('aria-label', storyboardScriptText('viewModeAria')),
      (this._listBtn = this._createModeButton('list', storyboardScriptText('viewMode.list'))),
      (this._cardBtn = this._createModeButton('card', storyboardScriptText('viewMode.card'))),
      el23.appendChild(this._listBtn),
      el23.appendChild(this._cardBtn),
      el21.appendChild(el22),
      el21.appendChild(el23),
      el17.appendChild(el18),
      el17.appendChild(el21),
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
          onSelect: ({ modelId: modelId, provider: provider2 }) => {
            const args10 = this._getScriptState(),
              storyboardScript = { ...args10, model: modelId, provider: provider2, sourceMode: 'text' };
            ((this._data = {
              ...this._data,
              model: modelId,
              provider: provider2,
              storyboardScript: storyboardScript,
            }),
              appStore.updateNodeData(this.nodeId, {
                model: modelId,
                provider: provider2,
                storyboardScript: storyboardScript,
              }));
          },
        },
      })),
      this._bindPromptGenerateImmediateLoading(),
      this._installSelectionCountIndicator(),
      this._installStoryboardImagePromptSchemaControls(),
      this._installStoryboardQueueButton(),
      this._bindStoryboardImageModelTrigger(),
      this.el.appendChild(el17),
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
    const el24 = document.createElement('div');
    return (
      (el24.className = 'node-floating-toolbar v2-text-toolbar v2-storyboard-script-toolbar'),
      el24.addEventListener('pointerdown', (event2) => {
        event2.stopPropagation();
      }),
      el24.addEventListener('dblclick', (event3) => {
        (event3.preventDefault(), event3.stopPropagation());
      }),
      (this._toolbarGenerateBtn = createToolbarButton({
        action: 'generate-storyboard',
        label: storyboardScriptText('toolbar.editMode'),
        tooltip: storyboardScriptText('toolbar.editMode'),
        iconHtml: STORYBOARD_TOOLBAR_GENERATE_ICON_HTML,
        showLabel: true,
      })),
      this._toolbarGenerateBtn.addEventListener('click', (event4) => {
        event4.stopPropagation();
        const value47 = this._getScriptState();
        value47.selectionMode === true ? this._cancelSelectionMode() : this._enterSelectionMode();
      }),
      (this._toolbarFullscreenBtn = createToolbarButton({
        action: 'fullscreen-script',
        label: storyboardScriptText('toolbar.fullscreen'),
        tooltip: storyboardScriptText('toolbar.fullscreen'),
        iconHtml: STORYBOARD_TOOLBAR_FULLSCREEN_ICON_HTML,
      })),
      this._toolbarFullscreenBtn.addEventListener('click', (event5) => {
        (event5.stopPropagation(), this._openFullscreenScript());
      }),
      (this._toolbarDownloadBtn = createToolbarButton({
        action: 'download-table',
        label: storyboardScriptText('toolbar.download'),
        tooltip: storyboardScriptText('toolbar.downloadTable'),
        iconHtml: STORYBOARD_TOOLBAR_DOWNLOAD_ICON_HTML,
      })),
      this._toolbarDownloadBtn.addEventListener('click', (event6) => {
        (event6.stopPropagation(), this._downloadScriptTable());
      }),
      el24.appendChild(this._toolbarGenerateBtn),
      el24.appendChild(this._toolbarFullscreenBtn),
      el24.appendChild(this._toolbarDownloadBtn),
      el24
    );
  }
  ['_bindOutsideSelectionCancel']() {
    (this._unbindOutsideSelectionCancel(),
      (this._onDocumentPointerDown = (event7) => {
        const value48 = this._getScriptState();
        if (value48.selectionMode !== true) return;
        const value49 = event7.target;
        if (!(value49 instanceof Element)) return;
        const value50 = document.getElementById(this.nodeId);
        if (this._fullscreenOverlayEl?.contains(value49)) return;
        if (this.el.contains(value49) || value50?.contains(value49)) return;
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
    const el25 = this._promptPanelEl?.querySelector('.img-model-btn-trigger');
    if (!el25) return;
    ((this._onModelTriggerClickCapture = (event8) => {
      const value51 = this._getScriptState();
      if (value51.selectionMode !== true) return;
      (event8.preventDefault(),
        event8.stopPropagation(),
        event8.stopImmediatePropagation?.(),
        this._toggleStoryboardImageModelMenu());
    }),
      el25.addEventListener('click', this._onModelTriggerClickCapture, { capture: true }));
  }
  ['_unbindStoryboardImageModelTrigger']() {
    const el26 = this._promptPanelEl?.querySelector('.img-model-btn-trigger');
    if (!el26 || !this._onModelTriggerClickCapture) return;
    (el26.removeEventListener('click', this._onModelTriggerClickCapture, { capture: true }),
      (this._onModelTriggerClickCapture = null));
  }
  ['_removeStoryboardImageModelMenu']() {
    (this._storyboardImageModelMenu?.remove(),
      (this._storyboardImageModelMenu = null),
      (this._storyboardImageModelMenuBound = false));
  }
  ['_getStoryboardImagePromptNodeData'](value52 = this._data, value53 = null) {
    const provider3 = value53 || createDefaultStoryboardScriptState(value52?.storyboardScript || {}),
      model2 = normalizeDreaminaImageModel(
        provider3.imageModel || DEFAULT_IMAGE_NODE_MODEL,
        provider3.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      );
    return {
      ...(value52 || {}),
      type: 'ai-image',
      model: model2,
      provider: provider3.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      generationParams: getPlainObject(value52?.generationParams),
      generationParamsByModel: getPlainObject(value52?.generationParamsByModel),
    };
  }
  ['_installStoryboardImagePromptSchemaControls']() {
    const el27 = this._promptPanelEl?.querySelector('.prompt-panel-footer'),
      el28 = el27?.querySelector('.img-model-pills'),
      enabled11 = el28?.querySelector('.img-model-wrap'),
      el29 = el27?.querySelector('.prompt-actions'),
      enabled12 = el29?.querySelector('.debug-wrench-btn');
    if (!el27 || !el28 || !enabled11 || !el29 || !enabled12) return;
    const run3 = (value54) => {
      const el30 = document.createElement('div');
      return (
        (el30.className = 'ui-schema-placement ' + value54 + ' storyboard-image-schema-only'),
        (el30.hidden = true),
        el30
      );
    };
    ((this.uiSchemaModeSlot = run3('ui-schema-mode-slot')),
      (this.uiSchemaResolutionSlot = run3('ui-schema-resolution-slot')),
      (this.uiSchemaBatchSlot = run3('ui-schema-batch-slot')),
      (this.uiSchemaInstanceSlot = run3('ui-schema-instance-slot')),
      enabled11.after(this.uiSchemaModeSlot, this.uiSchemaResolutionSlot),
      (this.rhAdvWrap = document.createElement('div')),
      (this.rhAdvWrap.className = 'rh-adv-wrap storyboard-image-schema-only'),
      (this.rhAdvWrap.hidden = true));
    const el31 = document.createElement('button');
    ((el31.type = 'button'), (el31.className = 'img-pill-btn rh-adv-btn'));
    const el32 = document.createElement('span');
    ((el32.className = 'rh-adv-btn-label'),
      (el32.textContent = storyboardScriptText('advancedSettings')),
      el31.replaceChildren(el32),
      this.rhAdvWrap.appendChild(el31),
      el29.insertBefore(this.rhAdvWrap, enabled12),
      el29.insertBefore(this.uiSchemaBatchSlot, enabled12),
      el29.insertBefore(this.uiSchemaInstanceSlot, enabled12),
      (this.rhAdvPanelEl = document.createElement('div')),
      (this.rhAdvPanelEl.className = 'rh-adv-panel storyboard-image-schema-only'),
      el27.appendChild(this.rhAdvPanelEl),
      el31.addEventListener('click', (event9) => {
        event9.stopPropagation();
        if (this.rhAdvPanelEl?.hidden) return;
        (closeNodeFooterMenus(el27, this.rhAdvPanelEl),
          this.rhAdvPanelEl?.classList.toggle('show'),
          this._storyboardImageModelMenu?.classList.remove('show'));
      }),
      this.rhAdvPanelEl.addEventListener('click', (event10) => {
        event10.stopPropagation();
      }),
      this._storyboardImageSchemaCleanup?.(),
      (this._storyboardImageSchemaCleanup = bindModelUiSchemaControls(el27, {
        nodeId: this.nodeId,
        nodeData: this._getStoryboardImagePromptNodeData(),
        store: appStore,
        decorateNodeData: (value55) =>
          this._getStoryboardImagePromptNodeData(
            value55,
            createDefaultStoryboardScriptState(value55?.storyboardScript || {}),
          ),
        buildPatch: (value56, value57, aspectRatio) => {
          const args11 = createDefaultStoryboardScriptState(value56?.storyboardScript || {}),
            storyboardScript2 = { ...args11, updatedAt: Date.now() };
          if (value57 !== 'aspectRatio') return { storyboardScript: storyboardScript2 };
          return { aspectRatio: aspectRatio, storyboardScript: storyboardScript2 };
        },
        afterCommit: (value58, value59, value60, { patch: patch } = {}) => {
          (patch && typeof patch === 'object' && (this._data = { ...this._data, ...patch }),
            this._syncStoryboardImageSchemaControls(this._getScriptState()));
        },
      })));
  }
  ['_syncStoryboardImageSchemaControls'](value61 = this._getScriptState()) {
    const enabled13 = this._promptPanelEl?.querySelector('.prompt-panel-footer');
    if (!enabled13 || !this.uiSchemaModeSlot || !this.uiSchemaResolutionSlot) return;
    const enabled14 =
        Array.isArray(value61.rows) && value61.rows.length > 0 && value61.selectionMode === true,
      dreaminaImageModel = normalizeDreaminaImageModel(
        value61.imageModel || DEFAULT_IMAGE_NODE_MODEL,
        value61.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      ),
      value62 = this._getStoryboardImagePromptNodeData(this._data, value61),
      value63 =
        this._storyboardImageSchemaModel !== dreaminaImageModel ||
        this._storyboardImageSchemaSelectionMode !== enabled14,
      handler4 = (el33, placement, variant) => {
        if (!el33) return;
        const enabled15 = enabled14
          ? renderModelUiSchemaControls(dreaminaImageModel, value62, {
              placement: placement,
              variant: variant,
            })
          : '';
        ((el33.innerHTML = enabled15), (el33.hidden = !enabled14 || !enabled15));
      };
    value63 &&
      (handler4(this.uiSchemaModeSlot, 'mode', 'pillMenu'),
      handler4(this.uiSchemaResolutionSlot, 'resolution', 'resolutionPill'),
      handler4(this.uiSchemaBatchSlot, 'batch', 'pillMenu'),
      handler4(this.uiSchemaInstanceSlot, 'instance', 'instanceToggle'),
      this.rhAdvPanelEl &&
        (this.rhAdvPanelEl.innerHTML = enabled14
          ? renderModelUiSchemaControls(dreaminaImageModel, value62, {
              placement: 'advanced',
              variant: 'advancedRow',
            })
          : ''),
      (this._storyboardImageSchemaModel = dreaminaImageModel),
      (this._storyboardImageSchemaSelectionMode = enabled14));
    syncModelUiSchemaControls(enabled13, value62);
    const enabled16 = enabled14 && hasModelUiSchema(dreaminaImageModel, { placement: 'advanced' });
    if (this.rhAdvWrap) this.rhAdvWrap.hidden = !enabled16;
    this.rhAdvPanelEl &&
      ((this.rhAdvPanelEl.hidden = !enabled16),
      (!enabled16 || !enabled14) && this.rhAdvPanelEl.classList.remove('show'));
  }
  ['_buildStoryboardImageModelPatch'](value64, value65, value66, args12 = {}) {
    const args13 = createDefaultStoryboardScriptState(value64?.storyboardScript || this._getScriptState()),
      value67 = String(value64?.model || '').trim(),
      imageModel = String(value65 || '').trim() || DEFAULT_IMAGE_NODE_MODEL,
      imageProvider = String(value66 || '').trim() || DEFAULT_IMAGE_NODE_PROVIDER,
      args14 = args12 && typeof args12 === 'object' ? { ...args12 } : {};
    delete args14.storyboardScript;
    const generationParamsByModel = getPlainObject(value64?.generationParamsByModel);
    value67 && (generationParamsByModel[value67] = getPlainObject(value64?.generationParams));
    const modelManifest2 = getModelManifest(imageModel),
      list24 = new Set(
        (modelManifest2?.uiSchema?.fields || [])
          .map((item14) => String(item14?.id || '').trim())
          .filter(Boolean),
      ),
      args15 = getPlainObject(args14.generationParams),
      args16 = getPlainObject(generationParamsByModel[imageModel]),
      args17 = buildModelUiSchemaDefaultParams(imageModel),
      args18 = {};
    (list24.forEach((item15) => {
      Object.prototype.hasOwnProperty.call(args14, item15) &&
        ((args18[item15] = args14[item15]), delete args14[item15]);
    }),
      delete args14.generationParams,
      delete args14.generationParamsByModel);
    const generationParams = sanitizeModelUiSchemaParams(
      imageModel,
      { ...args17, ...args16, ...args15, ...args18 },
      { includeDefaults: true },
    );
    if (imageModel) generationParamsByModel[imageModel] = generationParams;
    const storyboardScript3 = {
        ...args13,
        selectionMode: true,
        imageModel: imageModel,
        imageProvider: imageProvider,
        updatedAt: Date.now(),
      },
      aspectRatio2 = generationParams.aspectRatio || args14.aspectRatio || value64?.aspectRatio;
    return {
      ...args14,
      model: imageModel,
      provider: imageProvider,
      ...(aspectRatio2 ? { aspectRatio: aspectRatio2 } : {}),
      generationParams: generationParams,
      generationParamsByModel: generationParamsByModel,
      storyboardScript: storyboardScript3,
    };
  }
  ['_bindStoryboardImageModelMenu'](modelMenu) {
    if (!modelMenu || this._storyboardImageModelMenuBound) return;
    const modelTrigger = this._promptPanelEl?.querySelector('.img-model-btn-trigger'),
      modelLabel = this._promptPanelEl?.querySelector('.img-model-label'),
      args19 = {
        modelMenu: modelMenu,
        modelTrigger: modelTrigger,
        modelLabel: modelLabel,
        nodeId: this.nodeId,
        store: appStore,
        fallbackNodeData: this._data,
        buildModelPatch: (...args20) => this._buildStoryboardImageModelPatch(...args20),
      };
    (bindImageModelMenuSubmenu({
      ...args19,
      toggleSelector: '[data-grsai-toggle]',
      submenuSelector: '.grsai-submenu',
      defaultProvider: 'grsai',
      resolveSelection: resolveGrsaiImageMenuSelection,
      afterSelect: ({ item: item16 }) => setImageModelTriggerIcon(modelTrigger, 'grsai', item16),
    }),
      bindImageModelMenuSubmenu({
        ...args19,
        toggleSelector: '[data-ppio-toggle]',
        submenuSelector: '.ppio-submenu',
        defaultProvider: 'ppio',
        afterSelect: ({ item: item17 }) => setImageModelTriggerIcon(modelTrigger, 'ppio', item17),
      }),
      bindDreaminaImageMenu(args19),
      bindImageModelMenuSubmenu({
        ...args19,
        toggleSelector: '[data-apimart-toggle]',
        submenuSelector: '.apimart-submenu',
        defaultProvider: 'apimart',
        resolveSelection: resolveApimartImageMenuSelection,
        afterSelect: ({ item: item18 }) => setImageModelTriggerIcon(modelTrigger, 'apimart', item18),
      }),
      bindImageModelMenuSubmenu({
        ...args19,
        toggleSelector: '[data-agnes-toggle]',
        submenuSelector: '.agnes-submenu',
        defaultProvider: 'agnes',
        afterSelect: ({ item: item19 }) => setImageModelTriggerIcon(modelTrigger, 'agnes', item19),
      }),
      bindImageModelMenuSubmenu({
        ...args19,
        toggleSelector: '[data-volcengine-toggle]',
        submenuSelector: '.volcengine-submenu',
        defaultProvider: 'volcengine',
        resolveSelection: resolveVolcengineImageMenuSelection,
        afterSelect: ({ item: item20 }) => setImageModelTriggerIcon(modelTrigger, 'volcengine', item20),
      }),
      bindImageModelMenuSubmenu({
        ...args19,
        toggleSelector: '[data-runninghubwf-toggle]',
        submenuSelector: '.runninghubwf-submenu',
        defaultProvider: 'runninghubwf',
        resolveSelection: resolveRunningHubWorkflowImageMenuSelection,
        afterSelect: ({ item: item21 }) => setImageModelTriggerIcon(modelTrigger, 'runninghubwf', item21),
      }),
      bindImageModelMenuSubmenu({
        ...args19,
        toggleSelector: '[data-runninghub-toggle]',
        submenuSelector: '.runninghub-submenu',
        defaultProvider: 'runninghubwf',
        resolveSelection: resolveRunningHubModelImageMenuSelection,
        afterSelect: ({ item: item22, provider: provider4 }) =>
          setImageModelTriggerIcon(modelTrigger, provider4, item22),
      }),
      (this._storyboardImageModelMenuBound = true));
  }
  ['_ensureStoryboardImageModelMenu']() {
    if (this._storyboardImageModelMenu?.isConnected) return this._storyboardImageModelMenu;
    const el34 = this._promptPanelEl?.querySelector('.img-model-wrap');
    if (!el34) return null;
    const value68 = this._getScriptState(),
      activeModel = normalizeDreaminaImageModel(
        value68.imageModel || DEFAULT_IMAGE_NODE_MODEL,
        value68.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      ),
      el35 = document.createElement('template');
    el35.innerHTML = buildImageModelMenuHTML({
      activeModel: activeModel,
      nanoSelection: getNanoBananaSelectionFromModel(
        activeModel,
        value68.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      ),
    }).trim();
    const el36 = el35.content.firstElementChild;
    if (!el36) return null;
    return (
      el36.classList.add('storyboard-image-model-menu'),
      (el34.style.position = el34.style.position || 'relative'),
      el34.appendChild(el36),
      (this._storyboardImageModelMenu = el36),
      (this._storyboardImageModelMenuBound = false),
      this._bindStoryboardImageModelMenu(el36),
      el36
    );
  }
  ['_toggleStoryboardImageModelMenu']() {
    const value69 = this._promptPanelEl?.querySelector('.prompt-panel-footer'),
      el37 = this._ensureStoryboardImageModelMenu();
    if (!el37) return;
    const value70 = !el37.classList.contains('show');
    (closeNodeFooterMenus(value69 || this._promptPanelEl, el37), el37.classList.toggle('show', value70));
    if (value70) activateMenuKeyboard(el37);
  }
  ['_installSelectionCountIndicator']() {
    const el38 = this._promptPanelEl?.querySelector('.prompt-actions'),
      enabled17 = el38?.querySelector('.debug-wrench-btn');
    if (!el38 || !enabled17) return;
    ((this._selectionCountEl = document.createElement('div')),
      (this._selectionCountEl.className = 'storyboard-script-selection-count'),
      (this._selectionCountEl.textContent = '0/0'),
      this._selectionCountEl.setAttribute(
        'aria-label',
        storyboardScriptText('selectionCount', { selected: 0, total: 0 }),
      ),
      el38.insertBefore(this._selectionCountEl, enabled17));
  }
  ['_installStoryboardQueueButton']() {
    const el39 = this._promptPanelEl?.querySelector('.prompt-actions');
    if (!el39 || !this.btnEl || this._queueBtn) return;
    const el40 = document.createElement('button');
    ((el40.type = 'button'),
      (el40.className = 'prompt-submit storyboard-script-queue-btn'),
      (el40.title = storyboardScriptText('toolbar.queue')),
      el40.setAttribute('aria-label', storyboardScriptText('toolbar.queue')),
      (el40.innerHTML = STORYBOARD_QUEUE_ICON_HTML),
      (el40.hidden = true),
      el40.addEventListener('click', (event11) => {
        (event11.stopPropagation(),
          this._flushPromptHtmlCommit?.(),
          this._createImageNodesFromSelectedStoryboards({ startGeneration: false }));
      }),
      el39.insertBefore(el40, this.btnEl),
      (this._queueBtn = el40));
  }
  ['_createModeButton'](value71, value72) {
    const el41 = document.createElement('button');
    return (
      (el41.type = 'button'),
      (el41.className = 'storyboard-script-view-btn'),
      (el41.dataset.mode = value71),
      (el41.textContent = value72),
      el41.addEventListener('pointerdown', (event12) => {
        event12.stopPropagation();
      }),
      el41.addEventListener('dblclick', (event13) => {
        event13.stopPropagation();
      }),
      el41.addEventListener('click', (event14) => {
        (event14.stopPropagation(), this._setViewMode(value71));
      }),
      el41
    );
  }
  ['_createMediaModeButton'](value73, value74) {
    const el42 = document.createElement('button');
    return (
      (el42.type = 'button'),
      (el42.className = 'storyboard-script-view-btn storyboard-script-media-btn'),
      (el42.dataset.mediaMode = value73),
      (el42.textContent = value74),
      el42.addEventListener('pointerdown', (event15) => {
        event15.stopPropagation();
      }),
      el42.addEventListener('dblclick', (event16) => {
        event16.stopPropagation();
      }),
      el42.addEventListener('click', (event17) => {
        (event17.stopPropagation(), this._setMediaMode(value73));
      }),
      el42
    );
  }
  ['_getScriptState']() {
    return createDefaultStoryboardScriptState(this._data.storyboardScript || {});
  }
  ['_syncSelectionModeUi'](storyboardScript4 = this._getScriptState()) {
    const total = Array.isArray(storyboardScript4.rows) ? storyboardScript4.rows.length : 0,
      selected = getSelectedRowIndexes(storyboardScript4),
      enabled18 = total > 0 && storyboardScript4.selectionMode === true,
      value75 = enabled18
        ? storyboardScriptText('toolbar.exitEdit')
        : storyboardScriptText('toolbar.editMode'),
      model3 = enabled18
        ? storyboardScript4.imageModel || DEFAULT_IMAGE_NODE_MODEL
        : resolveStoryboardScriptTextModel({ storyboardScript: storyboardScript4 }),
      provider5 = enabled18
        ? storyboardScript4.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER
        : resolveStoryboardScriptTextProvider({ storyboardScript: storyboardScript4 });
    this._promptPanelEl?.classList.toggle('is-storyboard-image-mode', enabled18);
    this._queueBtn && (this._queueBtn.hidden = !enabled18);
    (this.el?.classList.toggle('has-storyboard-rows', total > 0),
      this.el?.classList.toggle('is-storyboard-selection-mode', enabled18),
      this._toolbarGenerateBtn?.classList.toggle('active', enabled18),
      setToolbarButtonLabel(this._toolbarGenerateBtn, value75),
      this._promptPanelEl
        ?.querySelector('.node-model-menu')
        ?.classList.toggle('is-storyboard-text-menu-hidden', enabled18));
    !enabled18 && this._storyboardImageModelMenu?.classList.remove('show');
    const value76 = this._promptPanelEl?.querySelector('.img-model-btn-trigger'),
      el43 = this._promptPanelEl?.querySelector('.img-model-label'),
      displayModelName = getDisplayModelName(model3);
    (el43 && el43.textContent !== displayModelName && (el43.textContent = displayModelName),
      enabled18
        ? replaceModelTriggerIcon(
            value76,
            renderImageModelTriggerIconHTML({ model: model3, provider: provider5 }),
          )
        : replaceModelTriggerIcon(
            value76,
            buildTextModelSmallIconHTML(model3) ||
              '<div class="text-model-icon-small text-model-icon-badge">AI</div>',
          ),
      this._selectionCountEl &&
        ((this._selectionCountEl.textContent = selected.length + '/' + total),
        this._selectionCountEl.setAttribute(
          'aria-label',
          storyboardScriptText('selectionCount', { selected: selected.length, total: total }),
        ),
        (this._selectionCountEl.hidden = !enabled18)),
      this._syncStoryboardImageSchemaControls(storyboardScript4));
  }
  ['_enterSelectionMode']() {
    this._finishCellEdit({ commit: true });
    const value77 = this._getScriptState();
    if (!Array.isArray(value77.rows) || value77.rows.length === 0) {
      window.showToast?.(storyboardScriptText('toasts.generateScriptFirst'), 'warn');
      return;
    }
    const value78 = value77.imageModel || DEFAULT_IMAGE_NODE_MODEL,
      value79 = value77.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      value80 = appStore.getState?.().nodes?.[this.nodeId] || this._data,
      args21 = this._buildStoryboardImageModelPatch(value80, value78, value79),
      storyboardScript5 = {
        ...args21.storyboardScript,
        viewMode: 'list',
        selectionMode: true,
        selectedRowIndexes: getSelectedRowIndexes(value77),
        updatedAt: Date.now(),
      };
    ((this._data = { ...this._data, ...args21, storyboardScript: storyboardScript5 }),
      appStore.updateNodeData(this.nodeId, { ...args21, storyboardScript: storyboardScript5 }));
  }
  ['_cancelSelectionMode']() {
    let storyboardScript6 = this._getScriptState();
    if (storyboardScript6.selectionMode !== true) return;
    (this._finishCellEdit({ commit: true }), (storyboardScript6 = this._getScriptState()));
    const model4 = resolveStoryboardScriptTextModel({ storyboardScript: storyboardScript6 }),
      provider6 = resolveStoryboardScriptTextProvider({ storyboardScript: storyboardScript6 }),
      storyboardScript7 = {
        ...storyboardScript6,
        selectionMode: false,
        selectedRowIndexes: [],
        updatedAt: Date.now(),
      };
    ((this._data = {
      ...this._data,
      model: model4,
      provider: provider6,
      storyboardScript: storyboardScript7,
    }),
      appStore.updateNodeData(this.nodeId, {
        model: model4,
        provider: provider6,
        storyboardScript: storyboardScript7,
      }));
  }
  ['_updateSelectedRowIndexes'](value81) {
    const args22 = this._getScriptState(),
      selectedRowIndexes = normalizeStoryboardScriptSelectedRowIndexes(value81, args22.rows.length),
      storyboardScript8 = { ...args22, selectedRowIndexes: selectedRowIndexes, updatedAt: Date.now() };
    ((this._data = { ...this._data, storyboardScript: storyboardScript8 }),
      this._syncListSelectionState(storyboardScript8),
      appStore.updateNodeData(this.nodeId, { storyboardScript: storyboardScript8 }));
  }
  ['_toggleRowSelection'](value82, value83) {
    const value84 = this._getScriptState(),
      map4 = new Set(getSelectedRowIndexes(value84));
    if (value83) map4.add(value82);
    else map4.delete(value82);
    this._updateSelectedRowIndexes([...map4].sort((item23, value85) => item23 - value85));
  }
  ['_setAllRowsSelected'](value86) {
    const value87 = this._getScriptState(),
      value88 = value86 ? value87.rows.map((item24, value89) => value89) : [];
    this._updateSelectedRowIndexes(value88);
  }
  ['_setViewMode'](value90) {
    this._finishCellEdit({ commit: true });
    const viewMode = normalizeStoryboardScriptViewMode(value90),
      args23 = this._getScriptState();
    if (args23.viewMode === viewMode) return;
    appStore.updateNodeData(this.nodeId, { storyboardScript: { ...args23, viewMode: viewMode } });
  }
  ['_setMediaMode'](value91) {
    this._finishCellEdit({ commit: true });
    const mediaMode3 = normalizeStoryboardScriptMediaMode(value91),
      args24 = this._getScriptState();
    if (args24.mediaMode === mediaMode3) return;
    appStore.updateNodeData(this.nodeId, {
      storyboardScript: { ...args24, mediaMode: mediaMode3, updatedAt: Date.now() },
    });
  }
  ['_syncModeButtons'](value92, value93) {
    [this._listBtn, this._cardBtn].forEach((el44) => {
      if (!el44) return;
      const value94 = el44.dataset.mode === value92;
      (el44.classList.toggle('is-active', value94),
        el44.setAttribute('aria-pressed', value94 ? 'true' : 'false'));
    });
    const storyboardScriptMediaMode = normalizeStoryboardScriptMediaMode(value93);
    [this._imageModeBtn, this._videoModeBtn].forEach((el45) => {
      if (!el45) return;
      const value95 = el45.dataset.mediaMode === storyboardScriptMediaMode;
      (el45.classList.toggle('is-active', value95),
        el45.setAttribute('aria-pressed', value95 ? 'true' : 'false'));
    });
  }
  ['_isStoryboardScriptGenerating'](value96 = null) {
    const value97 = appStore.getState?.().nodes?.[this.nodeId] || this._data || {},
      value98 =
        value96 ||
        createDefaultStoryboardScriptState(value97.storyboardScript || this._data.storyboardScript || {});
    return (
      this._isGeneratingScript ||
      value97.isGenerating === true ||
      value98.isGenerating === true ||
      String(value98.jobStatus || value97.jobStatus || '') === 'running'
    );
  }
  ['_syncGeneratingOverlay'](value99) {
    if (!this._bodyEl) return;
    const enabled19 = value99 === true;
    (this.el?.classList?.toggle('is-storyboard-script-generating', enabled19),
      this._bodyEl.classList.toggle('is-generating', enabled19),
      this._bodyEl.setAttribute('aria-busy', enabled19 ? 'true' : 'false'));
    const el46 = this._bodyEl.querySelector('.storyboard-script-loading-overlay');
    if (!enabled19) {
      el46?.remove();
      return;
    }
    if (el46) return;
    this._bodyEl.appendChild(createStoryboardScriptLoadingOverlay());
  }
  ['_setStoryboardGeneratingState'](isGenerating, args25 = {}) {
    const args26 = this._getScriptState(),
      storyboardScript9 = {
        ...args26,
        ...args25,
        isGenerating: isGenerating === true,
        jobStatus: isGenerating === true ? 'running' : args25.jobStatus || '',
        updatedAt: Date.now(),
      };
    ((this._data = { ...this._data, storyboardScript: storyboardScript9 }),
      appStore.updateNodeData(this.nodeId, { storyboardScript: storyboardScript9 }));
  }
  ['_showStoryboardLoadingOverlayImmediately']() {
    if (this._isGeneratingScript) return;
    const value100 = this._getScriptState();
    if (value100.selectionMode === true) return;
    ((this._isGeneratingScript = true),
      (this._isPromptGenerateLoadingPrimed = true),
      this._setStoryboardGeneratingState(true),
      this._syncGeneratingOverlay(true));
  }
  ['_bindPromptGenerateImmediateLoading']() {
    const el47 = this.btnEl;
    if (!(el47 instanceof HTMLElement)) return;
    el47.addEventListener(
      'click',
      () => {
        if (el47.disabled) return;
        this._showStoryboardLoadingOverlayImmediately();
      },
      { capture: true },
    );
  }
  ['_getEffectiveSubmitPromptText']() {
    return this._getStoryboardSubmitInput().promptText;
  }
  ['_getStoryboardSubmitInput']() {
    const value101 = appStore.getState(),
      nodes = value101.nodes || {},
      value102 = nodes?.[this.nodeId] || this._data || {},
      inEdges = appStore.getIncomingEdges(this.nodeId),
      image = collectDirectStoryboardImageRefs(inEdges, nodes),
      video = collectDirectStoryboardVideoRefs(inEdges, nodes),
      assetInputRefs = [],
      assetMediaCounts = { image: image.length, video: video.length, audio: 0 },
      promptText = resolvePromptTextWithTextRefs({
        promptEl: this.promptEl,
        inEdges: inEdges,
        nodes: nodes,
        assetInputRefs: assetInputRefs,
        assetMediaCounts: assetMediaCounts,
        allowedAssetTypes: ['text', 'image', 'video'],
      }).trim(),
      hiddenAssetRefs2 = getPromptAssetInputRefsFromNode(value102, { allowedTypes: ['image', 'video'] }),
      imageRefs = normalizeStoryboardImageInputRefs({
        directImageRefs: image,
        promptAssetRefs: assetInputRefs,
        hiddenAssetRefs: hiddenAssetRefs2,
      }),
      videoRefs = normalizeStoryboardVideoInputRefs({
        directVideoRefs: video,
        promptAssetRefs: assetInputRefs,
        hiddenAssetRefs: hiddenAssetRefs2,
      }),
      inputImageUrls2 = imageRefs.map((response12) => response12.url).filter(Boolean),
      inputVideoUrls = videoRefs.map((response13) => response13.url).filter(Boolean),
      sourceMode2 =
        inputImageUrls2.length > 0 && inputVideoUrls.length > 0
          ? 'multimodal'
          : inputVideoUrls.length > 0
            ? 'video'
            : inputImageUrls2.length > 0
              ? 'image'
              : 'text';
    return {
      promptText: promptText,
      imageRefs: imageRefs,
      videoRefs: videoRefs,
      imageLabels: imageRefs.map((item25) => item25.label),
      videoLabels: videoRefs.map((item26) => item26.label),
      inputUrls: [...inputImageUrls2, ...inputVideoUrls],
      inputImageUrls: inputImageUrls2,
      inputVideoUrls: inputVideoUrls,
      sourceMode: sourceMode2,
    };
  }
  ['_updateSubmitButtonState']() {
    if (!this.btnEl) return;
    const cancellable = appStore.getState?.().nodes?.[this.nodeId] || this._data || {},
      jobStatus = createDefaultStoryboardScriptState(
        cancellable.storyboardScript || this._data.storyboardScript || {},
      ),
      disabled = resolveGenerationButtonMode(
        {
          ...cancellable,
          isGenerating:
            this._isGeneratingScript || cancellable.isGenerating === true || jobStatus.isGenerating === true,
          jobStatus: jobStatus.jobStatus || cancellable.jobStatus || '',
        },
        { cancellable: cancellable.taskCancellable === true },
      ),
      value103 = this._getStoryboardSubmitInput(),
      value104 = value103.promptText,
      enabled20 = jobStatus.rows.length > 0 && jobStatus.selectionMode === true,
      title4 = enabled20
        ? storyboardScriptText('toolbar.generateSelected')
        : storyboardScriptText('generate'),
      selectedRowIndexes2 = getSelectedRowIndexes(jobStatus).length,
      enabled21 = enabled20
        ? selectedRowIndexes2 > 0
        : Boolean(value104 || value103.inputImageUrls.length > 0 || value103.inputVideoUrls.length > 0);
    this._syncGeneratingOverlay(disabled.busy);
    this._queueBtn &&
      ((this._queueBtn.hidden = !enabled20),
      (this._queueBtn.disabled = !enabled20 || selectedRowIndexes2 === 0 || disabled.busy),
      (this._queueBtn.style.cursor = this._queueBtn.disabled ? 'var(--unavailable-cursor)' : ''));
    this._syncToolbarButtonState({
      canGenerate: jobStatus.rows.length > 0 && !disabled.busy && !disabled.disabled,
      canDownload: Array.isArray(jobStatus.rows) && jobStatus.rows.length > 0,
    });
    if (disabled.busy) {
      (setGenerateButtonLoadingUi(this.btnEl, {
        title: title4,
        disabled: disabled.disabled,
        ariaLabel: title4,
      }),
        (this.btnEl.disabled = disabled.disabled),
        (this.btnEl.style.cursor = disabled.cursor));
      return;
    }
    (resetGenerateButtonIdleUi(this.btnEl, title4),
      !enabled21
        ? ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'))
        : ((this.btnEl.disabled = false), (this.btnEl.style.cursor = '')));
  }
  ['_syncToolbarButtonState']({
    canGenerate: canGenerate,
    canDownload: canDownload,
    canFullscreen: canFullscreen,
  } = {}) {
    this._toolbarGenerateBtn &&
      ((this._toolbarGenerateBtn.disabled = canGenerate !== true),
      (this._toolbarGenerateBtn.style.cursor = canGenerate === true ? '' : 'var(--unavailable-cursor)'));
    if (this._toolbarFullscreenBtn) {
      const enabled22 = (canFullscreen ?? canDownload) === true;
      ((this._toolbarFullscreenBtn.disabled = !enabled22),
        (this._toolbarFullscreenBtn.style.cursor = enabled22 ? '' : 'var(--unavailable-cursor)'));
    }
    this._toolbarDownloadBtn &&
      ((this._toolbarDownloadBtn.disabled = canDownload !== true),
      (this._toolbarDownloadBtn.style.cursor = canDownload === true ? '' : 'var(--unavailable-cursor)'));
  }
  ['_syncGenerateButtonState']() {
    this._updateSubmitButtonState();
  }
  ['_createFullscreenCloseButton']() {
    const el48 = document.createElement('button');
    return (
      (el48.type = 'button'),
      (el48.className = 'storyboard-script-fullscreen-close'),
      el48.setAttribute('aria-label', storyboardScriptText('fullscreen.close')),
      (el48.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'),
      el48.addEventListener('click', (event18) => {
        (event18.stopPropagation(), this._closeFullscreenScript());
      }),
      el48
    );
  }
  ['_openFullscreenScript']() {
    this._finishCellEdit({ commit: true });
    const value105 = this._getScriptState();
    if (!Array.isArray(value105.rows) || value105.rows.length === 0) {
      window.showToast?.(storyboardScriptText('toasts.noFullscreenData'), 'warn');
      return;
    }
    if (this._fullscreenOverlayEl) {
      (this._renderFullscreenContent(value105),
        this._fullscreenOverlayEl
          .querySelector('.storyboard-script-fullscreen-close')
          ?.focus?.({ preventScroll: true }));
      return;
    }
    const el49 = document.createElement('div');
    ((el49.className = 'storyboard-script-fullscreen-overlay'),
      el49.setAttribute('role', 'dialog'),
      el49.setAttribute('aria-modal', 'true'),
      el49.setAttribute('aria-label', storyboardScriptText('fullscreen.aria')));
    const el50 = document.createElement('section');
    ((el50.className = 'storyboard-script-fullscreen-panel'),
      el50.addEventListener('pointerdown', (event19) => {
        event19.stopPropagation();
      }),
      el50.addEventListener('dblclick', (event20) => {
        event20.stopPropagation();
      }));
    const el51 = document.createElement('header');
    el51.className = 'storyboard-script-fullscreen-header';
    const el52 = document.createElement('div');
    el52.className = 'storyboard-script-fullscreen-title-wrap';
    const el53 = document.createElement('div');
    ((el53.className = 'storyboard-script-fullscreen-title'),
      (el53.textContent = value105.title || this._data.name || getStoryboardScriptDefaultName()));
    const value106 = document.createElement('div');
    ((value106.className = 'storyboard-script-fullscreen-meta'),
      el52.appendChild(el53),
      el52.appendChild(value106),
      el51.appendChild(el52),
      el51.appendChild(this._createFullscreenCloseButton()));
    const value107 = document.createElement('div');
    ((value107.className = 'storyboard-script-fullscreen-body'),
      this._bindFullscreenBodyInteractions(value107),
      el50.appendChild(el51),
      el50.appendChild(value107),
      el49.appendChild(el50),
      el49.addEventListener('pointerdown', (event21) => {
        event21.stopPropagation();
        if (event21.target === el49) this._closeFullscreenScript();
      }),
      (this._onFullscreenKeydown = (event22) => {
        if (event22.key !== 'Escape') return;
        (event22.preventDefault(), event22.stopPropagation(), this._closeFullscreenScript());
      }),
      document.addEventListener('keydown', this._onFullscreenKeydown, true),
      document.body.appendChild(el49),
      (this._fullscreenOverlayEl = el49),
      this._renderFullscreenContent(value105),
      el49.querySelector('.storyboard-script-fullscreen-close')?.focus?.({ preventScroll: true }));
  }
  ['_closeFullscreenScript']() {
    (this._finishCellEdit({ commit: true }),
      this._onFullscreenKeydown &&
        (document.removeEventListener('keydown', this._onFullscreenKeydown, true),
        (this._onFullscreenKeydown = null)),
      this._fullscreenOverlayEl?.remove(),
      (this._fullscreenOverlayEl = null));
  }
  ['_bindFullscreenBodyInteractions'](el54) {
    if (!(el54 instanceof HTMLElement)) return;
    (el54.addEventListener(
      'wheel',
      (event23) => {
        event23.stopPropagation();
      },
      { passive: false },
    ),
      el54.addEventListener(
        'pointerdown',
        (event24) => {
          const el55 = event24.target instanceof Element ? event24.target : event24.target?.parentElement,
            enabled23 = el55?.closest?.('[data-storyboard-edit-key]');
          if (!enabled23 || !el54.contains(enabled23)) return;
          this._beginCellEdit(enabled23, { focus: false, selectAll: false });
        },
        { capture: true },
      ),
      el54.addEventListener('pointerdown', (event25) => {
        event25.stopPropagation();
      }),
      el54.addEventListener('dblclick', (event26) => {
        const el56 = event26.target instanceof Element ? event26.target : event26.target?.parentElement,
          enabled24 = el56?.closest?.('[data-storyboard-edit-key]');
        (event26.preventDefault(), event26.stopPropagation());
        if (!enabled24 || !el54.contains(enabled24)) return;
        this._beginCellEdit(enabled24);
      }));
  }
  ['_renderFullscreenContent'](value108 = this._getScriptState(), value109 = null) {
    if (!this._fullscreenOverlayEl) return;
    const el57 = this._fullscreenOverlayEl.querySelector('.storyboard-script-fullscreen-body');
    if (!(el57 instanceof HTMLElement)) return;
    const count2 = Array.isArray(value108.rows) ? value108.rows : [],
      left = el57.querySelector('.storyboard-script-table-wrap, .storyboard-script-card-grid'),
      box2 = left ? { left: left.scrollLeft || 0, top: left.scrollTop || 0 } : null,
      value110 =
        value109 ||
        mergeStoryboardImageRefs(this._getStoryboardSubmitInput().imageRefs, value108.referenceImageRefs),
      el58 = this._fullscreenOverlayEl.querySelector('.storyboard-script-fullscreen-title');
    el58 && (el58.textContent = value108.title || this._data.name || getStoryboardScriptDefaultName());
    const el59 = this._fullscreenOverlayEl.querySelector('.storyboard-script-fullscreen-meta');
    if (el59) {
      const view =
          normalizeStoryboardScriptViewMode(value108.viewMode) === 'card'
            ? storyboardScriptText('viewMode.card')
            : storyboardScriptText('viewMode.list'),
        media =
          normalizeStoryboardScriptMediaMode(value108.mediaMode) === 'video'
            ? storyboardScriptText('mediaMode.video')
            : storyboardScriptText('mediaMode.image');
      el59.textContent = storyboardScriptText('fullscreen.meta', {
        count: count2.length,
        media: media,
        view: view,
      });
    }
    el57.replaceChildren();
    if (count2.length === 0) {
      el57.appendChild(this._createEmptyState());
      return;
    }
    const storyboardImageRefMap = buildStoryboardImageRefMap(value110),
      el60 =
        normalizeStoryboardScriptViewMode(value108.viewMode) === 'card'
          ? this._createCardView(
              count2,
              getStoryboardCardFieldsForMediaMode(value108.mediaMode, count2),
              storyboardImageRefMap,
            )
          : this._createListView(
              count2,
              getStoryboardColumnsForMediaMode(value108.mediaMode, count2),
              storyboardImageRefMap,
              { selectionMode: false },
            );
    (el60.classList.add('storyboard-script-fullscreen-scroller'), el57.appendChild(el60));
    if (box2) {
      const run4 = () => {
        ((el60.scrollLeft = Math.max(0, box2.left)), (el60.scrollTop = Math.max(0, box2.top)));
      };
      (run4(),
        typeof window !== 'undefined' &&
          typeof window.requestAnimationFrame === 'function' &&
          window.requestAnimationFrame(run4));
    }
  }
  ['_renderRefBar']() {
    _renderSharedRefBar(this);
  }
  ['_bindBodyInteractions']() {
    if (!this._bodyEl) return;
    (this._bodyEl.addEventListener(
      'wheel',
      (event27) => {
        event27.stopPropagation();
      },
      { passive: false },
    ),
      this._bodyEl.addEventListener(
        'pointerdown',
        (event28) => {
          const value111 = this._getScriptState();
          if (value111.selectionMode !== true) return;
          const el61 = event28.target instanceof Element ? event28.target : event28.target?.parentElement,
            enabled25 = el61?.closest?.('[data-storyboard-edit-key]');
          if (!enabled25 || !this._bodyEl.contains(enabled25)) return;
          this._beginCellEdit(enabled25, { focus: false, selectAll: false });
        },
        { capture: true },
      ),
      this._bodyEl.addEventListener('pointerdown', (event29) => {
        const value112 = this._getScriptState();
        if (value112.selectionMode !== true) return;
        event29.stopPropagation();
      }),
      this._bodyEl.addEventListener('dblclick', (event30) => {
        const el62 = event30.target instanceof Element ? event30.target : event30.target?.parentElement,
          enabled26 = el62?.closest?.('[data-storyboard-edit-key]');
        (event30.preventDefault(), event30.stopPropagation());
        const value113 = this._getScriptState();
        if (value113.selectionMode !== true) {
          this._enterSelectionMode();
          return;
        }
        if (!enabled26 || !this._bodyEl.contains(enabled26)) return;
        this._beginCellEdit(enabled26);
      }));
  }
  ['_beginCellEdit'](target2, { focus: focus = true, selectAll: selectAll = true } = {}) {
    if (!(target2 instanceof HTMLElement)) return;
    if (this._activeCellEdit?.target === target2) return;
    this._finishCellEdit({ commit: true });
    const rowIndex = Number(target2.dataset.storyboardRowIndex),
      key2 = String(target2.dataset.storyboardEditKey || '');
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || !key2) return;
    const originalText = target2.dataset.storyboardRawValue ?? target2.textContent ?? '',
      value114 = (event31) => event31.stopPropagation(),
      value115 = (event32) => event32.stopPropagation(),
      value116 = (event33) => {
        event33.stopPropagation();
        if (event33.key === 'Enter' && !event33.shiftKey)
          (event33.preventDefault(), this._finishCellEdit({ commit: true }));
        else event33.key === 'Escape' && (event33.preventDefault(), this._finishCellEdit({ commit: false }));
      },
      value117 = () => this._finishCellEdit({ commit: true }),
      cleanup = () => {
        (target2.removeEventListener('pointerdown', value114),
          target2.removeEventListener('dblclick', value115),
          target2.removeEventListener('keydown', value116),
          target2.removeEventListener('blur', value117));
      };
    ((this._activeCellEdit = {
      target: target2,
      rowIndex: rowIndex,
      key: key2,
      originalText: originalText,
      cleanup: cleanup,
    }),
      (target2.textContent = originalText),
      target2.classList.remove('storyboard-script-image-cell'),
      target2.classList.add('is-editing'),
      (target2.contentEditable = 'true'),
      (target2.spellcheck = false),
      target2.addEventListener('pointerdown', value114),
      target2.addEventListener('dblclick', value115),
      target2.addEventListener('keydown', value116),
      target2.addEventListener('blur', value117));
    focus && target2.focus({ preventScroll: true });
    const value118 = selectAll ? window.getSelection?.() : null;
    if (value118) {
      const value119 = document.createRange();
      (value119.selectNodeContents(target2), value118.removeAllRanges(), value118.addRange(value119));
    }
  }
  ['_finishCellEdit']({ commit: commit2 }) {
    const event34 = this._activeCellEdit;
    if (!event34) return;
    ((this._activeCellEdit = null),
      event34.cleanup?.(),
      event34.target.classList.remove('is-editing'),
      event34.target.removeAttribute('contenteditable'),
      (event34.target.spellcheck = false));
    if (!commit2) {
      this._restoreEditedCellDisplay(event34.target, event34.key, event34.originalText);
      return;
    }
    const value120 = String(event34.target.textContent || '')
      .replace(/\u00a0/g, ' ')
      .trim();
    if (value120 !== event34.originalText)
      (this._restoreEditedCellDisplay(event34.target, event34.key, value120),
        this._updateCellValue(event34.rowIndex, event34.key, value120));
    else
      (event34.key === '角色图' || event34.key === '参考') &&
        this._restoreEditedCellDisplay(event34.target, event34.key, event34.originalText);
  }
  ['_restoreEditedCellDisplay'](value121, value122, value123) {
    if (!(value121 instanceof HTMLElement)) return;
    const value124 = this._getScriptState(),
      value125 = this._getStoryboardSubmitInput(),
      storyboardImageRefMap2 = buildStoryboardImageRefMap(
        mergeStoryboardImageRefs(value125.imageRefs, value124.referenceImageRefs),
      );
    appendStoryboardCellDisplay(value121, value122, value123, storyboardImageRefMap2);
  }
  ['_updateCellValue'](value126, value127, value128) {
    const args27 = this._getScriptState();
    if (!Array.isArray(args27.rows) || !args27.rows[value126]) return;
    const rows6 = args27.rows.map((args28, value129) =>
        value129 === value126 ? { ...args28, [value127]: value128 } : args28,
      ),
      canonicalJson = serializeCanonicalStoryboardScriptJson({ ...args27, rows: rows6 }),
      title5 = JSON.parse(canonicalJson),
      storyboardScript10 = {
        ...args27,
        rows: rows6,
        canonicalJson: canonicalJson,
        title: title5.title,
        detectedIntent: title5.detectedIntent,
        updatedAt: Date.now(),
      };
    ((this._data = { ...this._data, storyboardScript: storyboardScript10 }),
      (this._skipNextStoryboardBodyRender = true),
      appStore.updateNodeData(this.nodeId, { storyboardScript: storyboardScript10 }));
  }
  async ['_prepareStoryboardVideoFrames']({
    submitInput: submitInput,
    promptText: promptText2,
    model: model5,
    provider: provider7,
  }) {
    const list25 = Array.isArray(submitInput?.videoRefs) ? submitInput.videoRefs : [];
    if (list25.length === 0)
      return { frameRefs: [], frameBatches: [], frameSummary: '', visibleFrameRefs: [] };
    const exactCount = extractRequestedStoryboardShotCount(promptText2, {
        max: STORYBOARD_VIDEO_FRAME_LIMIT,
      }),
      value130 = exactCount || STORYBOARD_VIDEO_FRAME_LIMIT,
      value131 = Math.max(1, Math.ceil(value130 / list25.length)),
      storyboardModelImageInputLimit = getStoryboardModelImageInputLimit(model5, provider7),
      list26 = [];
    for (const videoLabel of list25) {
      if (list26.length >= value130) break;
      const value132 = value130 - list26.length,
        maxFrames = Math.max(1, Math.min(value131, value132)),
        extractStoryboardVideoFramesFromServer2 = await extractStoryboardVideoFramesFromServer(
          videoLabel.url,
          {
            maxFrames: maxFrames,
            exactCount: exactCount > 0,
          },
        ),
        value133 = Array.isArray(extractStoryboardVideoFramesFromServer2.frames)
          ? extractStoryboardVideoFramesFromServer2.frames
          : [];
      for (const response14 of value133) {
        if (list26.length >= value130) break;
        const label8 = getStoryboardImagePlaceholder(list26.length + 1),
          url7 = String(response14.url || '').trim();
        if (!url7) continue;
        const value134 = {
          ...response14,
          label: label8,
          url: url7,
          type: 'image',
          source: 'video-frame',
          videoLabel: videoLabel.label,
          videoUrl: videoLabel.url,
        };
        ((value134.timeRange = formatStoryboardVideoTimeRange(value134)), list26.push(value134));
      }
    }
    const frameRefs = list26.map((args29, sentAsImage) => ({
      ...args29,
      sentAsImage: sentAsImage < storyboardModelImageInputLimit,
    }));
    return {
      frameRefs: frameRefs,
      frameBatches: chunkStoryboardFrameRefs(frameRefs, storyboardModelImageInputLimit),
      frameSummary: buildStoryboardVideoFrameReferenceSummary(frameRefs),
      visibleFrameRefs: frameRefs,
    };
  }
  async ['_buildPayload']() {
    const submitInput2 = this._getStoryboardSubmitInput(),
      promptText3 = submitInput2.promptText,
      enabled27 = submitInput2.inputImageUrls.length > 0,
      enabled28 = submitInput2.inputVideoUrls.length > 0;
    if (!promptText3 && !enabled27 && !enabled28)
      return (window.showToast?.(storyboardScriptText('toasts.missingPromptOrReference'), 'warn'), null);
    const model6 = resolveStoryboardScriptTextModel(this._data),
      provider8 = resolveStoryboardScriptTextProvider(this._data),
      sourceMode3 = submitInput2.sourceMode,
      videoFrameSummary =
        sourceMode3 === 'video'
          ? await this._prepareStoryboardVideoFrames({
              submitInput: submitInput2,
              promptText: promptText3,
              model: model6,
              provider: provider8,
            })
          : { frameRefs: [], frameBatches: [], frameSummary: '', visibleFrameRefs: [] },
      storyboardPrompt =
        promptText3 ||
        buildStoryboardReferenceSummary({
          imageLabels: submitInput2.imageLabels,
          videoLabels: submitInput2.videoLabels,
        }),
      summary = buildStoryboardReferenceSummary({
        imageLabels: submitInput2.imageLabels,
        videoLabels: submitInput2.videoLabels,
      });
    let prompt3 = buildStoryboardScriptTextOnlyPrompt(promptText3),
      systemPrompt = buildStoryboardScriptTextOnlySystemPrompt();
    if (sourceMode3 === 'image')
      ((prompt3 = buildStoryboardScriptImagePrompt(promptText3, {
        imageCount: submitInput2.inputImageUrls.length,
        imageLabels: submitInput2.imageLabels,
      })),
        (systemPrompt = buildStoryboardScriptImageSystemPrompt()));
    else {
      if (sourceMode3 === 'video')
        ((prompt3 = buildStoryboardScriptVideoPrompt(promptText3, {
          videoCount: submitInput2.inputVideoUrls.length,
          videoLabels: submitInput2.videoLabels,
          videoFrameSummary: videoFrameSummary.frameSummary,
        })),
          (systemPrompt = buildStoryboardScriptVideoSystemPrompt()));
      else
        sourceMode3 === 'multimodal' &&
          ((prompt3 = buildStoryboardScriptPrompt(promptText3, {
            summary: summary,
            imageCount: submitInput2.inputImageUrls.length,
            imageLabels: submitInput2.imageLabels,
            videoCount: submitInput2.inputVideoUrls.length,
            videoLabels: submitInput2.videoLabels,
          })),
          (systemPrompt = ''));
    }
    return {
      prompt: prompt3,
      systemPrompt: systemPrompt,
      storyboardPrompt: storyboardPrompt,
      sourceMode: sourceMode3,
      inputUrls:
        sourceMode3 === 'video'
          ? [
              ...videoFrameSummary.visibleFrameRefs
                .filter((item27) => item27.sentAsImage !== false)
                .map((response15) => response15.url)
                .filter(Boolean),
              ...submitInput2.inputVideoUrls,
            ]
          : submitInput2.inputUrls,
      inputImageUrls:
        sourceMode3 === 'video'
          ? videoFrameSummary.visibleFrameRefs
              .filter((item28) => item28.sentAsImage !== false)
              .map((response16) => response16.url)
              .filter(Boolean)
          : submitInput2.inputImageUrls,
      inputVideoUrls: submitInput2.inputVideoUrls,
      videoLabels: submitInput2.videoLabels,
      videoFrameRefs: videoFrameSummary.visibleFrameRefs,
      videoFrameBatches: videoFrameSummary.frameBatches,
      referenceImageRefs: videoFrameSummary.visibleFrameRefs,
      rawPromptText: promptText3,
      model: model6,
      provider: provider8,
      nodeId: this.nodeId,
    };
  }
  ['_createImageNodesFromSelectedStoryboards']({ startGeneration: startGeneration = false } = {}) {
    this._finishCellEdit({ commit: true });
    const anchorNode = appStore.getState?.().nodes?.[this.nodeId] || this._data || {},
      storyboardScript11 = createDefaultStoryboardScriptState(
        anchorNode.storyboardScript || this._data.storyboardScript || {},
      ),
      canonicalJson2 = serializeCanonicalStoryboardScriptJson(storyboardScript11),
      title6 = JSON.parse(canonicalJson2),
      list27 = getSelectedRowIndexes(storyboardScript11);
    if (storyboardScript11.selectionMode !== true) return false;
    if (list27.length === 0)
      return (window.showToast?.(storyboardScriptText('toasts.selectStoryboardsFirst'), 'warn'), true);
    const itemCount = list27.map((rowIndex2) => {
        const value135 = storyboardScript11.rows[rowIndex2] || {};
        return {
          rowIndex: rowIndex2,
          shotNo: getStoryboardRowShotNo(value135, rowIndex2),
          prompt: getStoryboardRowImagePrompt(value135),
        };
      }),
      list28 = itemCount.filter((enabled29) => !enabled29.prompt);
    if (list28.length > 0)
      return (window.showToast?.(storyboardScriptText('toasts.missingImagePrompt'), 'warn'), true);
    const model7 = storyboardScript11.imageModel || DEFAULT_IMAGE_NODE_MODEL,
      provider9 = storyboardScript11.imageProvider || DEFAULT_IMAGE_NODE_PROVIDER,
      model8 = resolveStoryboardScriptTextModel({ storyboardScript: storyboardScript11 }),
      provider10 = resolveStoryboardScriptTextProvider({ storyboardScript: storyboardScript11 }),
      clonePlainObject2 = clonePlainObject(anchorNode.generationParams),
      clonePlainObject3 = clonePlainObject(anchorNode.generationParamsByModel),
      aspectRatio3 = clonePlainObject2?.aspectRatio || anchorNode.aspectRatio || '自适应',
      value136 = clonePlainObject2?.imageSize || anchorNode.imageSize || '',
      itemWidth = getImageNodeSizeForAspectRatio(aspectRatio3),
      nodes2 = getStateSnapshot(),
      x = createBatchSpawnLayoutNearNode({
        nodes: nodes2.nodes || {},
        anchorNode: anchorNode,
        itemCount: itemCount.length,
        itemWidth: itemWidth.width,
        itemHeight: itemWidth.height,
        maxPerLine: 5,
        padding: STORYBOARD_IMAGE_BATCH_PADDING,
        titleHeight: STORYBOARD_IMAGE_BATCH_TITLE_HEIGHT,
      }),
      id = generateId('group');
    appStore.addNode({
      id: id,
      type: 'group',
      x: x.groupX,
      y: x.groupY,
      width: x.groupWidth,
      height: x.groupHeight,
      name: storyboardScriptText('imageBatchGroupName'),
      label: storyboardScriptText('imageBatchGroupName'),
    });
    const count3 = [];
    (itemCount.forEach((shot, value137) => {
      const x2 = x.getItemPosition(value137),
        id2 = generateId('ai-image'),
        value138 = {
          id: id2,
          type: 'ai-image',
          x: x2.x,
          y: x2.y,
          width: itemWidth.width,
          height: itemWidth.height,
          name: storyboardScriptText('imageNodeName', { shot: shot.shotNo || value137 + 1 }),
          prompt: escapePromptTextForHtml(shot.prompt),
          model: model7,
          provider: provider9,
          aspectRatio: aspectRatio3,
          needsAutoResize: true,
          storyboardSource: { nodeId: this.nodeId, rowIndex: shot.rowIndex, shotNo: shot.shotNo },
        };
      clonePlainObject2 && (value138.generationParams = clonePlainObject(clonePlainObject2));
      clonePlainObject3 && (value138.generationParamsByModel = clonePlainObject(clonePlainObject3));
      if (value136) value138.imageSize = value136;
      (appStore.addNode(value138), count3.push(id2));
    }),
      appStore.groupNodes(count3, id));
    const storyboardScript12 = {
      ...storyboardScript11,
      canonicalJson: canonicalJson2,
      title: title6.title,
      detectedIntent: title6.detectedIntent,
      selectionMode: false,
      selectedRowIndexes: [],
      updatedAt: Date.now(),
    };
    return (
      (this._data = {
        ...this._data,
        model: model8,
        provider: provider10,
        storyboardScript: storyboardScript12,
      }),
      appStore.updateNodeData(this.nodeId, {
        model: model8,
        provider: provider10,
        storyboardScript: storyboardScript12,
      }),
      commit(),
      startGeneration
        ? this._startGeneratedImageNodes(count3, {
            onStarted: () => focusStoryboardImageBatch(this.nodeId, id),
          })
        : focusStoryboardImageBatch(this.nodeId, id),
      window.showToast?.(
        startGeneration
          ? storyboardScriptText('toasts.createdAndStartedImageNodes', { count: count3.length })
          : storyboardScriptText('toasts.createdImageNodes', { count: count3.length }),
        'success',
      ),
      true
    );
  }
  ['_startGeneratedImageNodes'](list29 = [], { onStarted: onStarted = null } = {}) {
    const list30 = Array.isArray(list29)
      ? list29.map((item29) => String(item29 || '').trim()).filter(Boolean)
      : [];
    if (list30.length === 0 || typeof window === 'undefined') return;
    const list31 = new Set(list30),
      value139 = 'storyboard-script:' + this.nodeId + ':auto-generate',
      handler5 = () => window.v2Renderer || null,
      handler6 = (value140) => {
        typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame(value140)
          : window.setTimeout(value140, 16);
      };
    handler5()?.pinNode && list30.forEach((item30) => handler5()?.pinNode?.(item30, value139));
    let value141 = 0;
    const value142 = 30;
    let value143 = false;
    const run5 = () => {
        if (value143) return;
        value143 = true;
        if (typeof onStarted !== 'function') return;
        try {
          onStarted();
        } catch (value144) {
          console.warn('[StoryboardScriptNode] post-start callback failed', value144);
        }
      },
      value145 = () => {
        value141 += 1;
        const value146 = handler5();
        value146?.flushNodes?.([...list31]);
        for (const value147 of Array.from(list31)) {
          const enabled30 = value146?.nodeInstances?.get?.(value147);
          if (!enabled30 || typeof enabled30.runGeneration !== 'function') continue;
          (list31.delete(value147),
            Promise.resolve()
              .then(() => enabled30.runGeneration())
              .catch((value148) => {
                console.error('[StoryboardScriptNode] auto image generation failed', value148);
              })
              .finally(() => {
                handler5()?.unpinNode?.(value147, value139);
              }));
        }
        if (list31.size === 0) {
          run5();
          return;
        }
        if (list31.size > 0 && value141 < value142) {
          handler6(value145);
          return;
        }
        (list31.size > 0 &&
          (list31.forEach((item31) => {
            handler5()?.unpinNode?.(item31, value139);
          }),
          window.showToast?.(storyboardScriptText('toasts.autoStartPartialFailed'), 'warn')),
          run5());
      };
    handler6(value145);
  }
  ['runGeneration'](options5 = {}) {
    return this._onGenerate(options5);
  }
  ['cancelGeneration']() {
    return {
      ok: false,
      status: 'not-cancellable',
      message: 'Storyboard script generation is not cancellable yet.',
    };
  }
  ['getGenerationStatus']() {
    const value149 = appStore.getState?.().nodes?.[this.nodeId] || this._data || {},
      defaultStoryboardScriptState = createDefaultStoryboardScriptState(
        value149.storyboardScript || this._data.storyboardScript || {},
      ),
      jobStatus2 = this._isStoryboardScriptGenerating(defaultStoryboardScriptState);
    return {
      nodeId: this.nodeId,
      jobStatus: jobStatus2 ? 'running' : String(defaultStoryboardScriptState.jobStatus || 'idle'),
      isGenerating: jobStatus2,
      cancellable: false,
      resumable: false,
    };
  }
  async ['_onGenerate'](options6 = {}) {
    const enabled31 = this._isPromptGenerateLoadingPrimed === true;
    if (this._isGeneratingScript && !enabled31) return;
    this._isPromptGenerateLoadingPrimed = false;
    const value150 = this._getScriptState();
    if (value150.selectionMode === true) {
      ((this._isGeneratingScript = false),
        this._syncGeneratingOverlay(false),
        this._createImageNodesFromSelectedStoryboards({ startGeneration: true }));
      return;
    }
    this._isGeneratingScript = true;
    !enabled31 && this._setStoryboardGeneratingState(true);
    (this._syncGeneratingOverlay(true),
      await waitForStoryboardLoadingPaint(),
      this._updateSubmitButtonState());
    let provider11 = null;
    try {
      provider11 = await this._buildPayload();
    } catch (error3) {
      ((this._isGeneratingScript = false),
        this._setStoryboardGeneratingState(false),
        this._updateSubmitButtonState(),
        window.showToast?.(error3?.message || storyboardScriptText('errors.videoPreprocessFailed'), 'error'));
      return;
    }
    if (!provider11) {
      ((this._isGeneratingScript = false),
        this._setStoryboardGeneratingState(false),
        this._updateSubmitButtonState());
      return;
    }
    const startedAt = Date.now(),
      current3 = this._getScriptState(),
      executionId = resolveModelManifest(provider11.model, provider11.provider);
    try {
      const response17 = await submitTask(
        {
          sourceNodeId: this.nodeId,
          targetNodeId: this.nodeId,
          trigger: 'node',
          taskType: 'storyboard-script-generation',
          provider: provider11.provider,
          adapterType: 'modelApi',
          modelId: provider11.model,
          executionId:
            executionId?.executionId || 'storyboard-script.' + provider11.provider + '.' + provider11.model,
          payload: provider11,
          cancellable: false,
          resumable: false,
          async: false,
          submit: () => runStoryboardScriptGenerationPayload(provider11),
          startBuilder: () => ({
            model: provider11.model,
            provider: provider11.provider,
            storyboardScript: buildStoryboardScriptStatePatch({
              current: current3,
              prompt: provider11.storyboardPrompt,
              model: provider11.model,
              provider: provider11.provider,
              sourceMode: provider11.sourceMode,
              status: 'running',
              referenceImageRefs: provider11.referenceImageRefs,
            }),
          }),
          resultBuilder: async (value151) => {
            const extractGeneratedText2 = extractGeneratedText(value151).trim(),
              name = normalizeStoryboardScriptGenerationResult(extractGeneratedText2, {
                requireMarker: true,
                sourceMode: provider11.sourceMode,
              });
            if (!name.ok) throw new Error(storyboardScriptText('errors.invalidJsonSwitchModel'));
            return {
              name: name.title || this._data.name || getStoryboardScriptDefaultName(),
              model: provider11.model,
              provider: provider11.provider,
              storyboardScript: buildStoryboardScriptStatePatch({
                current: current3,
                prompt: provider11.storyboardPrompt,
                model: provider11.model,
                provider: provider11.provider,
                sourceMode: provider11.sourceMode,
                normalized: name,
                status: 'success',
                referenceImageRefs: provider11.referenceImageRefs,
              }),
            };
          },
          failureBuilder: (error4) => ({
            storyboardScript: buildStoryboardScriptStatePatch({
              current: current3,
              prompt: provider11.storyboardPrompt,
              model: provider11.model,
              provider: provider11.provider,
              sourceMode: provider11.sourceMode,
              status: 'error',
              error: error4?.message || storyboardScriptText('errors.generationFailed'),
              referenceImageRefs: provider11.referenceImageRefs,
            }),
          }),
          parseError: (error5) => error5?.message || storyboardScriptText('errors.generationFailed'),
        },
        { store: appStore, startedAt: startedAt },
      );
      response17.status === 'failed' &&
        window.showToast?.(
          response17.error?.message || storyboardScriptText('errors.generationFailed'),
          'error',
        );
    } finally {
      ((this._isGeneratingScript = false), this._updateSubmitButtonState());
    }
  }
  ['_downloadScriptTable']() {
    this._finishCellEdit({ commit: true });
    const args30 = this._getScriptState();
    if (!Array.isArray(args30.rows) || args30.rows.length === 0) {
      window.showToast?.(storyboardScriptText('toasts.noDownloadData'), 'warn');
      return;
    }
    const canonicalJson3 = serializeCanonicalStoryboardScriptJson(args30),
      title7 = JSON.parse(canonicalJson3),
      storyboardScript13 = {
        ...args30,
        canonicalJson: canonicalJson3,
        title: title7.title,
        detectedIntent: title7.detectedIntent,
        updatedAt: Date.now(),
      };
    ((this._data = { ...this._data, storyboardScript: storyboardScript13 }),
      appStore.updateNodeData(this.nodeId, { storyboardScript: storyboardScript13 }));
    const value152 = STORYBOARD_SCRIPT_COLUMNS.map((event35) => ({
        ...event35,
        label: getStoryboardColumnLabel(event35.key, event35.label),
      })),
      content2 = serializeStoryboardScriptRowsToCsv(storyboardScript13.rows, value152),
      filename2 = sanitizeExportFileName(
        storyboardScript13.title || this._data.name || getStoryboardScriptDefaultName(),
      );
    (downloadTextFile({
      filename: filename2 + '_' + formatExportTimestamp() + '.csv',
      content: content2,
      mimeType: STORYBOARD_SCRIPT_TABLE_EXPORT_MIME,
    }),
      window.showToast?.(storyboardScriptText('toasts.downloadedTable'), 'success'));
  }
  ['_getStoryboardViewScrollKey'](value153, value154 = '') {
    const storyboardScriptMediaMode2 = normalizeStoryboardScriptMediaMode(value153?.mediaMode),
      storyboardScriptViewMode = normalizeStoryboardScriptViewMode(value154 || value153?.viewMode);
    return storyboardScriptMediaMode2 + ':' + storyboardScriptViewMode;
  }
  ['_getCurrentStoryboardScroller']() {
    return this._bodyEl?.querySelector?.('.storyboard-script-table-wrap, .storyboard-script-card-grid');
  }
  ['_rememberStoryboardViewScroll'](left2, value155, value156 = '') {
    if (!(left2 instanceof HTMLElement)) return;
    const value157 = this._getStoryboardViewScrollKey(value155, value156);
    this._storyboardViewScrollByKey.set(value157, { left: left2.scrollLeft, top: left2.scrollTop });
  }
  ['_captureStoryboardViewScroll'](value158) {
    const el63 = this._getCurrentStoryboardScroller();
    if (!(el63 instanceof HTMLElement)) return;
    const value159 = el63.classList.contains('storyboard-script-card-grid') ? 'card' : 'list';
    this._rememberStoryboardViewScroll(el63, value158, value159);
  }
  ['_bindStoryboardViewScrollMemory'](el64, value160) {
    if (!(el64 instanceof HTMLElement)) return;
    if (el64.dataset.storyboardScrollMemoryBound === 'true') return;
    ((el64.dataset.storyboardScrollMemoryBound = 'true'),
      el64.addEventListener('scroll', () => this._rememberStoryboardViewScroll(el64, value160), {
        passive: true,
      }));
  }
  ['_restoreStoryboardViewScroll'](el65, value161) {
    if (!(el65 instanceof HTMLElement)) return;
    const value162 = this._getStoryboardViewScrollKey(value161),
      box3 = this._storyboardViewScrollByKey.get(value162);
    if (!box3) return;
    const run6 = () => {
      const value163 = Math.max(0, el65.scrollWidth - el65.clientWidth),
        value164 = Math.max(0, el65.scrollHeight - el65.clientHeight);
      ((el65.scrollLeft = Math.min(value163, Math.max(0, box3.left || 0))),
        (el65.scrollTop = Math.min(value164, Math.max(0, box3.top || 0))));
    };
    (run6(),
      typeof window !== 'undefined' &&
        typeof window.requestAnimationFrame === 'function' &&
        window.requestAnimationFrame(run6));
  }
  ['_render']() {
    if (!this._bodyEl) return;
    const value165 = this._getScriptState(),
      value166 = this._isStoryboardScriptGenerating(value165);
    (this._captureStoryboardViewScroll(value165),
      this._syncModeButtons(value165.viewMode, value165.mediaMode),
      this._syncSelectionModeUi(value165),
      this._updateSubmitButtonState());
    const value167 = this._getStoryboardSubmitInput(),
      storyboardImageRefs = mergeStoryboardImageRefs(value167.imageRefs, value165.referenceImageRefs),
      storyboardBodyRenderSignature = buildStoryboardBodyRenderSignature(value165, storyboardImageRefs),
      value168 = this._getCurrentStoryboardScroller(),
      value169 =
        value168 instanceof HTMLElement &&
        (this._storyboardBodyRenderSignature === storyboardBodyRenderSignature ||
          this._skipNextStoryboardBodyRender === true);
    if (value169) {
      ((this._storyboardBodyRenderSignature = storyboardBodyRenderSignature),
        (this._skipNextStoryboardBodyRender = false),
        this._bindStoryboardViewScrollMemory(value168, value165),
        this._restoreStoryboardViewScroll(value168, value165),
        this._syncListSelectionState(value165),
        this._syncGeneratingOverlay(value166),
        this._renderFullscreenContent(value165, storyboardImageRefs));
      return;
    }
    ((this._skipNextStoryboardBodyRender = false),
      (this._storyboardBodyRenderSignature = storyboardBodyRenderSignature),
      this._bodyEl.replaceChildren());
    if (value165.rows.length === 0) {
      (this._bodyEl.appendChild(this._createEmptyState()),
        this._syncGeneratingOverlay(value166),
        this._renderFullscreenContent(value165, storyboardImageRefs));
      return;
    }
    const storyboardImageRefMap3 = buildStoryboardImageRefMap(storyboardImageRefs);
    let value170 = null;
    (value165.viewMode === 'card'
      ? ((value170 = this._createCardView(
          value165.rows,
          getStoryboardCardFieldsForMediaMode(value165.mediaMode, value165.rows),
          storyboardImageRefMap3,
        )),
        this._bodyEl.appendChild(value170))
      : ((value170 = this._createListView(
          value165.rows,
          getStoryboardColumnsForMediaMode(value165.mediaMode, value165.rows),
          storyboardImageRefMap3,
        )),
        this._bodyEl.appendChild(value170)),
      this._bindStoryboardViewScrollMemory(value170, value165),
      this._restoreStoryboardViewScroll(value170, value165),
      this._syncListSelectionState(value165),
      this._syncGeneratingOverlay(value166),
      this._renderFullscreenContent(value165, storyboardImageRefs));
  }
  ['_createEmptyState']() {
    const el66 = document.createElement('div');
    el66.className = 'storyboard-script-empty';
    const el67 = document.createElement('div');
    ((el67.className = 'storyboard-script-empty-title'),
      (el67.textContent = storyboardScriptText('empty.title')));
    const el68 = document.createElement('div');
    return (
      (el68.className = 'storyboard-script-empty-hint'),
      (el68.textContent = storyboardScriptText('empty.hint')),
      el66.appendChild(el67),
      el66.appendChild(el68),
      el66
    );
  }
  ['_createListView'](
    list32,
    list33 = STORYBOARD_SCRIPT_COLUMNS,
    value171 = new Map(),
    { selectionMode: selectionMode2 = null } = {},
  ) {
    const el69 = document.createElement('div');
    el69.className = 'storyboard-script-table-wrap custom-scrollbar';
    const value172 = this._getScriptState(),
      value173 = selectionMode2 == null ? value172.selectionMode === true : selectionMode2 === true,
      list34 = value173 ? getSelectedRowIndexes(value172) : [],
      map5 = new Set(list34),
      enabled32 = list32.length > 0 && list34.length === list32.length,
      el70 = document.createElement('table');
    ((el70.className = 'storyboard-script-table'), el70.classList.toggle('is-selection-mode', value173));
    const el71 = document.createElement('thead'),
      el72 = document.createElement('tr');
    if (value173) {
      const el73 = document.createElement('th');
      ((el73.scope = 'col'),
        (el73.className = 'storyboard-script-select-cell storyboard-script-select-cell--head'));
      const el74 = document.createElement('input');
      ((el74.type = 'checkbox'),
        (el74.className = 'storyboard-script-select-checkbox storyboard-script-select-all'),
        (el74.checked = enabled32),
        (el74.indeterminate = list34.length > 0 && !enabled32),
        el74.setAttribute('aria-label', storyboardScriptText('selectAllAria')),
        el74.addEventListener('pointerdown', (event36) => {
          event36.stopPropagation();
        }),
        el74.addEventListener('click', (event37) => {
          (event37.stopPropagation(), this._setAllRowsSelected(el74.checked));
        }),
        el73.appendChild(el74),
        el72.appendChild(el73));
    }
    (list33.forEach((event38) => {
      const el75 = document.createElement('th');
      ((el75.scope = 'col'),
        (el75.dataset.storyboardColumnDensity = resolveStoryboardColumnDensity(event38.key)),
        (el75.textContent = getStoryboardColumnLabel(event38.key, event38.label)),
        el72.appendChild(el75));
    }),
      el71.appendChild(el72));
    const el76 = document.createElement('tbody');
    return (
      list32.forEach((item32, index2) => {
        const el77 = document.createElement('tr');
        el77.dataset.storyboardRowIndex = String(index2);
        if (value173) {
          const el78 = document.createElement('td');
          el78.className = 'storyboard-script-select-cell';
          const el79 = document.createElement('input');
          ((el79.type = 'checkbox'),
            (el79.className = 'storyboard-script-select-checkbox'),
            (el79.checked = map5.has(index2)),
            el79.setAttribute('aria-label', storyboardScriptText('selectRowAria', { index: index2 + 1 })),
            el79.addEventListener('pointerdown', (event39) => {
              event39.stopPropagation();
            }),
            el79.addEventListener('click', (event40) => {
              (event40.stopPropagation(), this._toggleRowSelection(index2, el79.checked));
            }),
            el78.appendChild(el79),
            el77.appendChild(el78));
        }
        (list33.forEach((event41) => {
          const el80 = document.createElement('td');
          ((el80.className = 'storyboard-script-editable'),
            (el80.dataset.storyboardRowIndex = String(index2)),
            (el80.dataset.storyboardEditKey = event41.key),
            (el80.dataset.storyboardColumnDensity = resolveStoryboardColumnDensity(event41.key)),
            appendStoryboardCellDisplay(el80, event41.key, item32[event41.key], value171),
            el77.appendChild(el80));
        }),
          el76.appendChild(el77));
      }),
      el70.appendChild(el71),
      el70.appendChild(el76),
      el69.appendChild(el70),
      el69
    );
  }
  ['_syncListSelectionState'](value174 = this._getScriptState()) {
    const value175 = value174.selectionMode === true,
      list35 = value175 ? getSelectedRowIndexes(value174) : [],
      map6 = new Set(list35),
      el81 = this._bodyEl?.querySelector?.('.storyboard-script-table');
    if (!(el81 instanceof HTMLElement)) return;
    el81.classList.toggle('is-selection-mode', value175);
    const enabled33 =
        value175 &&
        Array.isArray(value174.rows) &&
        value174.rows.length > 0 &&
        list35.length === value174.rows.length,
      value176 = el81.querySelector('.storyboard-script-select-all');
    (value176 instanceof HTMLInputElement &&
      ((value176.checked = enabled33),
      (value176.indeterminate = value175 && list35.length > 0 && !enabled33)),
      el81.querySelectorAll('tbody tr').forEach((el82, value177) => {
        if (!(el82 instanceof HTMLElement)) return;
        const value178 = Number(el82.dataset.storyboardRowIndex || value177),
          value179 = map6.has(value178),
          value180 = el82.querySelector('.storyboard-script-select-checkbox');
        value180 instanceof HTMLInputElement && (value180.checked = value179);
      }));
  }
  ['_createCardView'](list36, list37 = CARD_FIELDS, value181 = new Map()) {
    const el83 = document.createElement('div');
    return (
      (el83.className = 'storyboard-script-card-grid custom-scrollbar'),
      list36.forEach((item33, index3) => {
        const el84 = document.createElement('article');
        el84.className = 'storyboard-script-card';
        const el85 = document.createElement('div');
        el85.className = 'storyboard-script-card-head';
        const el86 = document.createElement('span');
        ((el86.className = 'storyboard-script-shot storyboard-script-editable'),
          (el86.dataset.storyboardRowIndex = String(index3)),
          (el86.dataset.storyboardEditKey = '镜号'),
          (el86.textContent =
            formatCellValue(item33['镜号']) || storyboardScriptText('shotFallback', { index: index3 + 1 })),
          el85.appendChild(el86));
        const formatCellValue3 = formatCellValue(item33['时长']);
        if (formatCellValue3) {
          const el87 = document.createElement('span');
          ((el87.className = 'storyboard-script-duration storyboard-script-editable'),
            (el87.dataset.storyboardRowIndex = String(index3)),
            (el87.dataset.storyboardEditKey = '时长'),
            (el87.textContent = formatCellValue3),
            el85.appendChild(el87));
        }
        (el84.appendChild(el85),
          list37.forEach((item34) => {
            const formatCellValue4 = formatCellValue(item33[item34]);
            if (!formatCellValue4) return;
            const el88 = document.createElement('div');
            el88.className = 'storyboard-script-card-field';
            const el89 = document.createElement('span');
            ((el89.className = 'storyboard-script-card-label'),
              (el89.textContent = getStoryboardColumnLabel(item34, item34)));
            const el90 = document.createElement('span');
            ((el90.className = 'storyboard-script-card-value storyboard-script-editable'),
              (el90.dataset.storyboardRowIndex = String(index3)),
              (el90.dataset.storyboardEditKey = item34),
              appendStoryboardCellDisplay(el90, item34, formatCellValue4, value181),
              el88.appendChild(el89),
              el88.appendChild(el90),
              el84.appendChild(el88));
          }),
          el83.appendChild(el84));
      }),
      el83
    );
  }
  ['update'](value182) {
    this._data = value182 || {};
    if (document.activeElement !== this.promptEl && value182?.prompt !== undefined) {
      const sanitizePromptHtml2 = sanitizePromptHtml(value182.prompt || '');
      this.promptEl?.innerHTML !== sanitizePromptHtml2 &&
        ((this.promptEl.innerHTML = sanitizePromptHtml2), _rehydratePromptPills(this));
    }
    (this._syncPromptBoxSizeFromData?.(value182), this._renderRefBar(), this._render());
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
