import { graphStore } from '../../core/stores/appStore.js';
import {
  SOURCE_TYPES,
  SOURCE_TYPE_META,
  COMFYUI_WORKFLOW_STATE_SCOPE,
  normalizeSourceType,
  getSourceMeta,
  isComfyUiSource,
  isRunningHubSource,
  getComfyUiBaseUrlMode,
  getComfyUiSourceTypeFromBaseUrlMode,
  getComfyUiBaseUrlModeLabel,
} from './rhAiAppSources.js';
import { createRhAiAppDefinitionController } from './rhAiAppDefinitionController.js';
import { saveRhAiApp } from './rhAiAppSaveAction.js';
import { buildRhAiAppTestBundle } from './rhAiAppTestNode.js';
import {
  createRunningHubWorkflowComponentDrafts,
  buildRunningHubWorkflowManifestBundle,
} from './rhWorkflowImport.js';
import { generateId, screenToWorld } from '../../core/math.js';
import { sanitizeModelUiSchemaParams } from '../../manifests/index.js';
import { getAIGenerationDefaultSizeByType } from '../../services/fileService.js';
import {
  bindUiSchemaFieldControls,
  renderModelUiSchemaControls,
  renderUiSchemaFields,
} from '../../components/aigenImage/uiSchemaRenderer.js';
import { commit } from '../history.js';
import { closeAllSidebarSubmenus } from '../sidebarSubmenuController.js';
import { createRunningHubAiAppContextMenuController } from './runningHubAiAppContextMenu.js';
import {
  RH_AI_APP_FOOTER_PARAM_LIMIT,
  buildRunningHubAiAppManifestBundle,
  createRunningHubAiAppComponentDrafts,
  summarizeRunningHubAiAppBundle,
} from './rhAiAppImport.js';
import {
  buildComfyUiWorkflowManifestBundle,
  createComfyUiWorkflowComponentDrafts,
  formatComfyUiComponentLabel,
  summarizeComfyUiWorkflowBundle,
} from '../comfyuiWorkflow/comfyUiWorkflowImport.js';
import {
  renderComfyUiLocalWorkflowLogoHtml,
  renderRunningHubAiAppLogoHtml,
} from '../../components/shared/customAiAppLogo.js';
import { RH_AI_APP_VIP_MODEL_ID } from '../subscriptionAccess.js';
import {
  RUNNINGHUB_DOMESTIC_PROFILE_ID,
  RUNNINGHUB_INTERNATIONAL_PROFILE_ID,
  normalizeRunningHubModelApiProfileId,
} from '../runningHubProviderProfiles.js';
import { getRunningHubInstanceTypeLabel } from '../runningHubInstanceTypes.js';
import { createRhAiAppConfigRepository } from './rhAiAppConfigRepository.js';
import { createRhAiAppPreviewDragController } from './rhAiAppPreviewDragController.js';
import { renderGroupedPreviewParams } from './rhAiAppParameterGroups.js';
import { getParameterEntries, normalizeParameterGroups } from '../../domain/customAiApp/parameterLayout.js';
import { createRhAiAppPreviewPresentation } from './rhAiAppPreviewPresentation.js';
import {
  getDefaultRunningHubProfileId,
  assertRunningHubDefinitionProfile,
  getRunningHubProfileShortLabel,
  syncRunningHubProfileBadge,
} from './rhAiAppRunningHubProfile.js';
import {
  createCustomAiAppNodeBundleRegistry,
  getCustomAiAppBundleKey,
  getCustomAiAppBundleModelId,
  projectCustomAiAppBundleForNodeRuntime,
  registerCustomAiAppBundle,
  unregisterCustomAiAppBundle,
} from './customAiAppNodeBundleRegistry.js';
const OUTPUT_KIND_LABELS = Object.freeze({ image: '图像', video: '视频', audio: '音频' }),
  NODE_TYPE_BY_KIND = Object.freeze({ image: 'ai-image', video: 'ai-video', audio: 'ai-audio' }),
  COMPONENT_KIND_LABELS = Object.freeze({
    image: '图像入参',
    video: '视频入参',
    audio: '音频入参',
    prompt: '提示词',
    param: '参数',
  }),
  COMPONENT_KIND_OPTIONS = Object.freeze([
    ['image', '图像入参'],
    ['video', '视频入参'],
    ['audio', '音频入参'],
    ['prompt', '提示词'],
    ['param', '参数'],
  ]),
  CONTROL_TYPE_LABELS = Object.freeze({
    select: '下拉选项',
    text: '短文本',
    textarea: '长文本',
    stepper: '整数',
    float: '浮点数',
    toggle: '布尔',
    prompt: '提示词',
  }),
  CONTROL_TYPE_OPTIONS = Object.freeze([
    ['select', '下拉选项'],
    ['text', '短文本'],
    ['textarea', '长文本'],
    ['stepper', '整数'],
    ['float', '浮点数'],
    ['toggle', '布尔'],
    ['prompt', '提示词'],
  ]),
  MEDIA_COMPONENT_KINDS = new Set(['image', 'video', 'audio']),
  PREVIEW_CUSTOM_COMPONENT_LIMIT = RH_AI_APP_FOOTER_PARAM_LIMIT,
  PREVIEW_DROP_ZONES = Object.freeze(['input', 'prompt', 'params', 'advanced']),
  PREVIEW_TEXT_TYPE_VALUES = Object.freeze(['prompt', 'text', 'textarea']),
  PREVIEW_PARAM_TEXT_TYPE_VALUES = Object.freeze(['text', 'textarea']),
  PREVIEW_PROMPT_HELP_FIELD_NAMES = Object.freeze([
    '提示词',
    'prompt',
    '提示词.value',
    'prompt.value',
    'positive prompt',
    'positive_prompt',
  ]),
  PREVIEW_DRAG_START_THRESHOLD_PX = 10,
  PREVIEW_RENAME_CLICK_TOLERANCE_PX = 3,
  PREVIEW_MOVE_ANIMATION_MS = 260,
  INPUT_SLOT_LABEL_MAX_WIDTH_UNITS = 18,
  INPUT_SLOT_LABEL_INPUT_MAX_LENGTH = 24,
  INPUT_SLOT_LABEL_WIDE_CHAR_RE = /[^\u0000-\u00ff]/u,
  INPUT_SLOT_LABEL_LATIN_RE = /^[\u0000-\u007f]+$/u,
  SOURCE_PAGE_ANIMATION_MS = 280,
  RH_AI_APP_EXIT_MOTION_MS = 180,
  DEFAULT_AI_APP_NAME = '未命名 AI应用',
  JSON_FILE_EXTENSION_RE = /\.json$/i,
  RH_AI_APP_VIP_PROVIDER = 'runninghubwf';
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
function normalizeKind(item) {
  return Object.hasOwn(OUTPUT_KIND_LABELS, item) ? item : 'image';
}
function shouldReduceMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  } catch {
    return false;
  }
}
function normalizeComponentKind(key) {
  return Object.hasOwn(COMPONENT_KIND_LABELS, key) ? key : 'param';
}
function normalizeControlType(index) {
  const result = String(index || '')
    .trim()
    .toLowerCase();
  if (result === 'integer' || result === 'number') return 'stepper';
  if (result === 'decimal') return 'float';
  if (result === 'boolean' || result === 'bool') return 'toggle';
  return Object.hasOwn(CONTROL_TYPE_LABELS, result) ? result : 'text';
}
function cloneComponentDrafts(list = []) {
  return Array.isArray(list) ? list.map((args) => ({ ...args })) : [];
}
function normalizeAppName(data) {
  const target = String(data || '').trim();
  return target || DEFAULT_AI_APP_NAME;
}
function normalizeDroppedJsonAppName(source) {
  const next = String(source || '')
    .split(/[\\/]/)
    .pop()
    .replace(JSON_FILE_EXTENSION_RE, '')
    .trim();
  return normalizeAppName(next);
}
function isJsonFile(error) {
  const current = String(error?.name || '').trim(),
    entry = String(error?.type || '')
      .trim()
      .toLowerCase();
  return JSON_FILE_EXTENSION_RE.test(current) || entry === 'application/json';
}
function hasFileDragPayload(record) {
  return Array.from(record?.dataTransfer?.types || []).some(
    (payload) => String(payload || '').toLowerCase() === 'files',
  );
}
function normalizeAppDescription(handle) {
  return String(handle || '').trim();
}
function normalizePromptHelpTooltip(state) {
  return String(state || '').trim();
}
function getBundleDisplayName(config) {
  return normalizeAppName(config?.models?.[0]?.displayName);
}
function getCanvasCenterWorld(el = null) {
  const { viewport: viewport } = graphStore.getState(),
    scope = window.innerWidth / 2,
    input = window.innerHeight / 2,
    enabled = document.documentElement?.clientWidth || window.innerWidth || 0,
    enabled2 = document.documentElement?.clientHeight || window.innerHeight || 0;
  if (!enabled || !enabled2) return screenToWorld(scope, input, viewport);
  let output = 0,
    value2 = 0,
    value3 = enabled,
    value4 = enabled2;
  const value5 = [
      document.querySelector('header'),
      document.querySelector('.sidebar-floating'),
      el?.classList?.contains('is-open') ? el : null,
    ].filter(Boolean),
    value6 = 8;
  for (const el2 of value5) {
    if (!el2?.isConnected) continue;
    const box = el2.getBoundingClientRect(),
      value7 = Math.max(output, box.left),
      value8 = Math.max(value2, box.top),
      value9 = Math.min(value3, box.right),
      value10 = Math.min(value4, box.bottom);
    if (value9 <= value7 || value10 <= value8) continue;
    if (box.left <= output + value6 && box.right > output + value6) {
      output = Math.max(output, box.right);
      continue;
    }
    if (box.right >= value3 - value6 && box.left < value3 - value6) {
      value3 = Math.min(value3, box.left);
      continue;
    }
    if (box.top <= value2 + value6 && box.bottom > value2 + value6) {
      value2 = Math.max(value2, box.bottom);
      continue;
    }
    box.bottom >= value4 - value6 &&
      box.top < value4 - value6 &&
      (value4 = Math.min(value4, box.top));
  }
  const count = value3 - output,
    count2 = value4 - value2,
    value11 = count > 40 ? output + count / 2 : scope,
    value12 = count2 > 40 ? value2 + count2 / 2 : input;
  return screenToWorld(value11, value12, viewport);
}
function getGenerationNodeSize(value13) {
  if (value13 === 'ai-audio') return { width: 420, height: 180 };
  return getAIGenerationDefaultSizeByType(value13);
}
function buildRhAiAppNodeData({
  bundle: bundle2,
  kind: kind2,
  center: center,
  runningHubProfileId: runningHubProfileId = '',
}) {
  const type = NODE_TYPE_BY_KIND[kind2] || 'ai-image',
    model = getCustomAiAppBundleModelId(bundle2),
    name = getBundleDisplayName(bundle2),
    provider = bundle2?.models?.[0]?.provider || 'runninghubwf',
    providerProfileId =
      provider === 'runninghubwf' ? normalizeRunningHubModelApiProfileId(runningHubProfileId) : '',
    width = getGenerationNodeSize(type),
    generationParams = sanitizeModelUiSchemaParams(model, {}, { includeDefaults: true }),
    value14 = {
      id: generateId(type),
      type: type,
      x: Math.round(center.x - width.width / 2),
      y: Math.round(center.y - width.height / 2),
      width: width.width,
      height: width.height,
      name: name,
      model: model,
      provider: provider,
      generationParams: generationParams,
      generationParamsByModel: { [model]: generationParams },
      ...(providerProfileId
        ? { providerProfileId: providerProfileId, rhProviderProfileId: providerProfileId }
        : {}),
      rhAiAppManifestBundle: projectCustomAiAppBundleForNodeRuntime(bundle2),
      featureSelectionScope: 'node',
    };
  return (
    (type === 'ai-image' || type === 'ai-video') && (value14.aspectRatio = '自适应'),
    type === 'ai-audio' && ((value14.audioWorkflowKey = model), (value14.audioWorkflowLabel = name)),
    value14
  );
}
function renderSummaryHtml(enabled3, value15 = SOURCE_TYPE_META[SOURCE_TYPES.runninghub].emptyText) {
  if (!enabled3?.modelId) return '<div class="rh-ai-app-empty">' + escapeHtml(value15) + '</div>';
  const value16 = enabled3.slots.length
      ? enabled3.slots
          .map(
            (value17) =>
              '<span class="rh-ai-app-chip">' +
              escapeHtml(OUTPUT_KIND_LABELS[value17.kind] || value17.kind) +
              ' · ' +
              escapeHtml(value17.label) +
              '</span>',
          )
          .join('')
      : '<span class="rh-ai-app-muted">无媒体入参槽</span>',
    value18 = enabled3.params.length
      ? enabled3.params
          .map((value19) => '<span class="rh-ai-app-chip">' + escapeHtml(value19.label) + '</span>')
          .join('')
      : '<span class="rh-ai-app-muted">无额外参数</span>';
  return (
    '\n    <div class="rh-ai-app-summary-card">\n      <div class="rh-ai-app-summary-top">\n        <span>' +
    escapeHtml(enabled3.resourceIdLabel || 'App ID') +
    '</span>\n        <strong>' +
    escapeHtml(enabled3.appId) +
    '</strong>\n      </div>\n      <div class="rh-ai-app-summary-row">\n        <span>节点类型</span>\n        <strong>' +
    escapeHtml(OUTPUT_KIND_LABELS[enabled3.kind] || enabled3.kind) +
    '</strong>\n      </div>\n      <div class="rh-ai-app-summary-group">\n        <div class="rh-ai-app-summary-label">入参槽</div>\n        <div class="rh-ai-app-chip-row">' +
    value16 +
    '</div>\n      </div>\n      <div class="rh-ai-app-summary-group">\n        <div class="rh-ai-app-summary-label">参数</div>\n        <div class="rh-ai-app-chip-row">' +
    value18 +
    '</div>\n      </div>\n    </div>'
  );
}
function renderOptionsHtml(list2, value20) {
  const value21 = String(value20 || '');
  return list2.map(([value22, value23]) => {
    const value24 = String(value22) === value21 ? ' selected' : '';
    return (
      '<option value="' + escapeHtml(value22) + '"' + value24 + '>' + escapeHtml(value23) + '</option>'
    );
  }).join('');
}
function getOptionLabel(list3 = [], value25 = '') {
  const value26 = String(value25 || ''),
    value27 = list3.find(([value28]) => String(value28) === value26);
  return String(value27?.[1] || value26 || '');
}
function buildOptionsFromValues(list4 = [], value29 = {}) {
  return (Array.isArray(list4) ? list4 : [])
    .map((value30) => String(value30 || '').trim())
    .filter((value31, value32, list5) => value31 && list5.indexOf(value31) === value32)
    .filter((value33) => Object.hasOwn(value29, value33))
    .map((value34) => [value34, value29[value34]]);
}
function getComponentKindOptions(value35, value36) {
  const list6 = buildOptionsFromValues(value35?.componentKindOptions, COMPONENT_KIND_LABELS);
  if (list6.length) return list6;
  if (value35?.componentKindLocked === true || isMediaComponent(value35))
    return [[value36, COMPONENT_KIND_LABELS[value36] || value36]];
  return COMPONENT_KIND_OPTIONS.filter(([value37]) => value37 === 'param' || value37 === 'prompt');
}
function getControlTypeOptions(value38, value39) {
  const list7 = buildOptionsFromValues(value38?.controlTypeOptions, CONTROL_TYPE_LABELS);
  if (list7.length) return list7;
  if (value38?.controlTypeLocked === true) return [[value39, CONTROL_TYPE_LABELS[value39] || value39]];
  return CONTROL_TYPE_OPTIONS.filter(([value40]) => value40 !== 'toggle' && value40 !== 'prompt');
}
function getPreviewTextTypeOptions(enabled4) {
  if (!enabled4 || isMediaComponent(enabled4)) return [];
  const componentKind = normalizeComponentKind(enabled4.componentKind),
    controlType = normalizeControlType(enabled4.controlType),
    controlTypeOptions = getControlTypeOptions(enabled4, controlType),
    componentKindOptions = getComponentKindOptions(enabled4, componentKind);
  return PREVIEW_TEXT_TYPE_VALUES.filter((value41) => {
    if (value41 === 'prompt')
      return (
        controlType === 'prompt' ||
        optionValuesInclude(controlTypeOptions, 'prompt') ||
        optionValuesInclude(componentKindOptions, 'prompt')
      );
    return controlType === value41 || optionValuesInclude(controlTypeOptions, value41);
  }).map((value42) => [value42, CONTROL_TYPE_LABELS[value42] || value42]);
}
function optionValuesInclude(list8 = [], value43 = '') {
  const value44 = String(value43 || '').trim();
  return list8.some(([value45]) => String(value45) === value44);
}
function previewTextTypeOptionsInclude(value46, value47) {
  return optionValuesInclude(getPreviewTextTypeOptions(value46), value47);
}
function canPreviewComponentBecomePrompt(enabled5) {
  if (!enabled5 || isMediaComponent(enabled5)) return false;
  if (normalizeComponentKind(enabled5.componentKind) === 'prompt') return true;
  const controlType2 = normalizeControlType(enabled5.controlType);
  if (!PREVIEW_PARAM_TEXT_TYPE_VALUES.includes(controlType2)) return false;
  return previewTextTypeOptionsInclude(enabled5, 'prompt');
}
function canPreviewPromptBecomeParam(value48) {
  if (normalizeComponentKind(value48?.componentKind) !== 'prompt') return false;
  return PREVIEW_PARAM_TEXT_TYPE_VALUES.some((value49) => previewTextTypeOptionsInclude(value48, value49));
}
function getPreviewPromptReturnControlType(value50, value51 = '') {
  const controlType3 = normalizeControlType(value51);
  if (
    PREVIEW_PARAM_TEXT_TYPE_VALUES.includes(controlType3) &&
    previewTextTypeOptionsInclude(value50, controlType3)
  )
    return controlType3;
  return (
    PREVIEW_PARAM_TEXT_TYPE_VALUES.find((value52) => previewTextTypeOptionsInclude(value50, value52)) || ''
  );
}
function renderPreviewTypeBarHtml(value53, { canRemove: canRemove = false } = {}) {
  const value54 = Number(value53?.index);
  if (!Number.isInteger(value54)) return '';
  const list9 = getPreviewTextTypeOptions(value53),
    isParamComponent2 = isParamComponent(value53),
    isMediaComponent2 = isMediaComponent(value53),
    enabled6 = isParamComponent2 || isMediaComponent2,
    enabled7 = isParamComponent2 || normalizeComponentKind(value53?.componentKind) === 'prompt',
    value55 = isParamComponent2 && canRemove === true,
    enabled8 = isMediaComponent2 && canRemove === true;
  if (!list9.length && !enabled6 && !enabled7 && !enabled8) return '';
  const componentKind2 =
      normalizeComponentKind(value53.componentKind) === 'prompt'
        ? 'prompt'
        : normalizeControlType(value53.controlType),
    value56 = isMediaComponent2 ? '入参槽' : '参数',
    value57 = value53?.label || value53?.fieldName || value56,
    value58 = enabled6
      ? '<button type="button" class="rh-ai-app-preview-typebar-action rh-ai-app-preview-typebar-rename" data-action="rename-preview-param" data-preview-component-index="' +
        value54 +
        '" aria-label="重命名' +
        value56 +
        ' ' +
        escapeHtml(value57) +
        '">重命名</button>'
      : '',
    value59 = enabled7
      ? '<button type="button" class="rh-ai-app-preview-typebar-action rh-ai-app-preview-typebar-remark" data-action="edit-preview-description" data-preview-component-index="' +
        value54 +
        '" aria-label="修改备注 ' +
        escapeHtml(value57) +
        '">改备注</button>'
      : '',
    enabled9 = list9.map(([value60, value61]) => {
      const value62 = String(value60) === componentKind2;
      return (
        '<button type="button" class="rh-ai-app-preview-typebar-option ' +
        (value62 ? 'active' : '') +
        '" data-action="choose-preview-control-type" data-preview-component-index="' +
        value54 +
        '" data-value="' +
        escapeHtml(value60) +
        '" aria-pressed="' +
        (value62 ? 'true' : 'false') +
        '">' +
        escapeHtml(value61) +
        '</button>'
      );
    }).join(''),
    value63 =
      (value55 || enabled8) && !enabled9
        ? '<span class="rh-ai-app-preview-typebar-separator" aria-hidden="true">|</span>'
        : '',
    value64 = isMediaComponent2 ? 'remove-preview-input' : 'remove-preview-param',
    value65 =
      value55 || enabled8
        ? '<button type="button" class="rh-ai-app-preview-typebar-action rh-ai-app-preview-typebar-delete" data-action="' +
          value64 +
          '" data-preview-component-index="' +
          value54 +
          '" aria-label="删除' +
          value56 +
          ' ' +
          escapeHtml(value57) +
          '">×</button>'
        : '';
  return (
    '<div class="rh-ai-app-preview-typebar" aria-label="组件工具栏">' +
    value58 +
    value59 +
    enabled9 +
    value63 +
    value65 +
    '</div>'
  );
}
function renderFixedTypeLabelHtml(value66, value67 = '') {
  return (
    '<div class="rh-ai-app-component-fixed-type ' +
    value67 +
    '" aria-disabled="true">\n    <span>' +
    escapeHtml(value66) +
    '</span>\n  </div>'
  );
}
function renderComponentSelectHtml({
  className: className = '',
  ariaLabel: ariaLabel = '',
  prop: prop = '',
  options: options = [],
  activeValue: activeValue = '',
} = {}) {
  const value68 = String(activeValue || ''),
    optionLabel = getOptionLabel(options, value68),
    value69 = options.map(([value70, value71]) => {
      const value72 = String(value70) === value68;
      return (
        '\n        <button type="button" class="rh-ai-app-select-option ' +
        (value72 ? 'active' : '') +
        '" data-action="choose-component-select" data-component-prop="' +
        escapeHtml(prop) +
        '" data-value="' +
        escapeHtml(value70) +
        '" role="option" aria-selected="' +
        (value72 ? 'true' : 'false') +
        '" tabindex="-1">\n          <span>' +
        escapeHtml(value71) +
        '</span>\n        </button>'
      );
    }).join('');
  return (
    '\n    <div class="rh-ai-app-select ' +
    className +
    '" data-component-select data-component-prop="' +
    escapeHtml(prop) +
    '">\n      <button type="button" class="rh-ai-app-select-trigger" data-action="toggle-component-select" data-component-prop="' +
    escapeHtml(prop) +
    '" aria-label="' +
    escapeHtml(ariaLabel) +
    '" aria-haspopup="listbox" aria-expanded="false">\n        <span>' +
    escapeHtml(optionLabel) +
    '</span>\n        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"></path></svg>\n      </button>\n      <div class="rh-ai-app-select-menu" role="listbox">\n        ' +
    value69 +
    '\n      </div>\n    </div>'
  );
}
function isMediaComponent(value73) {
  return MEDIA_COMPONENT_KINDS.has(normalizeComponentKind(value73?.componentKind));
}
function isParamComponent(value74) {
  return normalizeComponentKind(value74?.componentKind) === 'param';
}
function getParamComponents(list10 = []) {
  return list10.filter((enabled10) => {
    if (!enabled10 || !Number.isInteger(Number(enabled10.index))) return false;
    return isParamComponent(enabled10);
  });
}
function getPreviewParamText(value75) {
  return String(value75?.label || value75?.fieldName || '参数').trim();
}
function getPreviewResolutionText(list11 = []) {
  const paramComponents = getParamComponents(list11).find((value76) => {
    const value77 = String(value76?.defaultValue || '').trim();
    return value77 && /^\d+(?:\.\d+)?$/.test(value77);
  });
  if (!paramComponents) return '自适应';
  return getPreviewParamText(paramComponents);
}
function getPreviewInstanceText(value78) {
  const list12 = value78?.models?.[0]?.uiSchema?.fields || [],
    enabled11 = list12.find((value79) => value79?.id === 'rhInstanceType');
  if (!enabled11) return '';
  return getRunningHubInstanceTypeLabel(enabled11?.defaultValue);
}
function normalizeOrderValue(value80, value81) {
  const value82 = Number(value80);
  return Number.isFinite(value82) ? value82 : value81;
}
function sortComponentsByOrder(args2 = [], value83) {
  return [...args2].sort((value84, value85) => {
    const value86 = Number(value84?.index),
      value87 = Number(value85?.index),
      orderValue = normalizeOrderValue(value84?.[value83], value86),
      orderValue2 = normalizeOrderValue(value85?.[value83], value87);
    if (orderValue !== orderValue2) return orderValue - orderValue2;
    return value86 - value87;
  });
}
function getPreviewInputComponents(list13 = []) {
  return sortComponentsByOrder(
    list13.filter(
      (value88) => value88 && Number.isInteger(Number(value88.index)) && isMediaComponent(value88),
    ),
    'inputOrder',
  );
}
function getInputSlotLabelWidthUnits(enabled12) {
  if (!enabled12) return 0;
  if (/\s/u.test(enabled12)) return 0.5;
  return INPUT_SLOT_LABEL_WIDE_CHAR_RE.test(enabled12) ? 2 : 1;
}
function clampInputSlotLabel(value89, value90 = INPUT_SLOT_LABEL_MAX_WIDTH_UNITS) {
  let value91 = 0,
    value92 = '';
  for (const value93 of Array.from(String(value89 ?? '').trim())) {
    const inputSlotLabelWidthUnits = getInputSlotLabelWidthUnits(value93);
    if (value91 + inputSlotLabelWidthUnits > value90) break;
    ((value92 += value93), (value91 += inputSlotLabelWidthUnits));
  }
  return value92;
}
function normalizeInputSlotLabel(value94, value95 = '组件') {
  const clampInputSlotLabel2 = clampInputSlotLabel(value94);
  if (clampInputSlotLabel2) return clampInputSlotLabel2;
  if (value95 === '') return '';
  return clampInputSlotLabel(value95) || '组件';
}
function getInputSlotLabelClass(value96) {
  return INPUT_SLOT_LABEL_LATIN_RE.test(String(value96 || ''))
    ? ' rh-ai-app-preview-input-label--latin'
    : '';
}
function getPreviewHomeParamComponents(list14 = []) {
  return getParameterEntries(list14).flatMap((value97) => value97.members);
}
function getPreviewAdvancedParamComponents(list15 = []) {
  const map = new Set(getPreviewHomeParamComponents(list15).map((value98) => Number(value98.index)));
  return sortComponentsByOrder(
    getParamComponents(list15).filter((value99) => !map.has(Number(value99.index))),
    'advancedParamOrder',
  );
}
function normalizePromptHelpFieldName(value100) {
  return String(value100 || '')
    .trim()
    .toLowerCase();
}
function isPreviewPromptHelpFieldName(value101) {
  const promptHelpFieldName = normalizePromptHelpFieldName(value101);
  return PREVIEW_PROMPT_HELP_FIELD_NAMES.some(
    (value102) => normalizePromptHelpFieldName(value102) === promptHelpFieldName,
  );
}
function isPreviewPromptHelpTextComponent(error2 = {}) {
  const controlType4 = normalizeControlType(error2.controlType);
  if (!PREVIEW_TEXT_TYPE_VALUES.includes(controlType4)) return false;
  return [error2.label, error2.fieldName, error2.name, error2.id, error2.path].some(
    isPreviewPromptHelpFieldName,
  );
}
function getPreviewPromptHelpComponent(list16 = []) {
  return (
    list16.find((value103) => normalizeComponentKind(value103?.componentKind) === 'prompt') ||
    list16.find(isPreviewPromptHelpTextComponent) ||
    null
  );
}
function shouldRefreshPreviewPromptForDraft(value104, value105) {
  if (value105 === 'componentKind' || value105 === 'controlType' || value105 === 'label') return true;
  if (value105 === 'description')
    return (
      normalizeComponentKind(value104?.componentKind) === 'prompt' ||
      isPreviewPromptHelpTextComponent(value104)
    );
  return false;
}
function buildComponentByIndex(list17 = []) {
  const map2 = new Map();
  return (
    list17.forEach((value106) => {
      const value107 = Number(value106?.index);
      if (Number.isInteger(value107)) map2.set(value107, value106);
    }),
    map2
  );
}
function isPreviewSystemField(options2 = {}) {
  const value108 = String(options2?.id || '').trim(),
    value109 = String(options2?.placement || '').trim();
  return value108 === 'rhInstanceType' || value109 === 'batch' || options2?.comfyUiSystemField === true;
}
function getBundleParamFields(value110) {
  const list18 = Array.isArray(value110?.models?.[0]?.uiSchema?.fields)
    ? value110.models[0].uiSchema.fields
    : [];
  return list18.filter((value111) => !isPreviewSystemField(value111));
}
function getCustomAiAppComponentIndex(options3 = {}) {
  const value112 = Number(options3?.customAiAppComponentIndex);
  if (Number.isInteger(value112)) return value112;
  const value113 = Number(options3?.rhAiAppComponentIndex);
  if (Number.isInteger(value113)) return value113;
  const value114 = Number(options3?.comfyUiComponentIndex);
  if (Number.isInteger(value114)) return value114;
  return NaN;
}
function getPreviewAdvancedParamFields({ bundle: bundle = null, components: components = [] } = {}) {
  const map3 = new Set(
      getPreviewHomeParamComponents(components).map((value115) => Number(value115.index)),
    ),
    map4 = buildComponentByIndex(components),
    map5 = new Map();
  return getBundleParamFields(bundle)
    .filter((value116, value117) => {
      map5.set(value116, value117);
      const customAiAppComponentIndex = getCustomAiAppComponentIndex(value116);
      if (!Number.isInteger(customAiAppComponentIndex)) return true;
      if (!map4.has(customAiAppComponentIndex)) return true;
      return !map3.has(customAiAppComponentIndex);
    })
    .sort((value118, value119) => {
      const customAiAppComponentIndex2 = getCustomAiAppComponentIndex(value118),
        customAiAppComponentIndex3 = getCustomAiAppComponentIndex(value119),
        value120 = Number.isInteger(customAiAppComponentIndex2)
          ? map4.get(customAiAppComponentIndex2)
          : null,
        value121 = Number.isInteger(customAiAppComponentIndex3)
          ? map4.get(customAiAppComponentIndex3)
          : null,
        value122 = value120
          ? normalizeOrderValue(value120.advancedParamOrder, customAiAppComponentIndex2)
          : normalizeOrderValue(
              value118?.displayOrder,
              map5.get(value118) ?? Number.MAX_SAFE_INTEGER,
            ),
        value123 = value121
          ? normalizeOrderValue(value121.advancedParamOrder, customAiAppComponentIndex3)
          : normalizeOrderValue(
              value119?.displayOrder,
              map5.get(value119) ?? Number.MAX_SAFE_INTEGER,
            );
      if (value122 !== value123) return value122 - value123;
      return (map5.get(value118) ?? 0) - (map5.get(value119) ?? 0);
    });
}
function buildPreviewUiSchemaNodeData(value124 = null) {
  const generationParams2 = getBundleParamFields(value124);
  return {
    model: getCustomAiAppBundleModelId(value124),
    generationParams: generationParams2.reduce((value125, value126) => {
      return ((value125[value126.id] = value126.defaultValue), value125);
    }, {}),
  };
}
function renderPreviewBatchControlsHtml(value127 = null) {
  const customAiAppBundleModelId = getCustomAiAppBundleModelId(value127);
  if (!customAiAppBundleModelId) return '';
  return renderModelUiSchemaControls(customAiAppBundleModelId, buildPreviewUiSchemaNodeData(value127), {
    placement: 'batch',
    variant: 'pillMenu',
  });
}
function renderPreviewInputComponentsHtml(
  list19 = [],
  { canRemovePreviewInputs: canRemovePreviewInputs = true } = {},
) {
  const list20 = getPreviewInputComponents(list19);
  if (!list20.length) return '';
  return list20.map((value128, value129) => {
    const componentKind3 = normalizeComponentKind(value128.componentKind),
      value130 = String(
        value128.label || value128.fieldName || COMPONENT_KIND_LABELS[componentKind3] || '组件',
      ).trim(),
      inputSlotLabel = normalizeInputSlotLabel(value130),
      inputSlotLabelClass = getInputSlotLabelClass(inputSlotLabel);
    return (
      '\n        <div role="button" tabindex="0" class="rh-ai-app-preview-component rh-ai-app-preview-draggable rh-ai-app-preview-input-slot ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-preview-drag-kind="input" data-preview-component-index="' +
      Number(value128.index) +
      '" data-preview-order="' +
      value129 +
      '" aria-label="拖动调整入参顺序：' +
      escapeHtml(value130 || inputSlotLabel) +
      '">\n          ' +
      renderPreviewTypeBarHtml(value128, { canRemove: canRemovePreviewInputs }) +
      '\n          <span class="rh-ai-app-preview-input-slot-content">\n            <span class="ref-upload-label rh-ai-app-preview-rename-target' +
      inputSlotLabelClass +
      '" data-preview-component-index="' +
      Number(value128.index) +
      '">' +
      escapeHtml(inputSlotLabel) +
      '</span>\n          </span>\n        </div>'
    );
  }).join('');
}
function getPreviewComponentDescription(value131, value132 = '参数说明') {
  return (
    String(value131?.description || value131?.label || value131?.fieldName || value132).trim() || value132
  );
}
function getPreviewBundlePromptHelpTooltip(value133 = null) {
  return String(value133?.models?.[0]?.help?.tooltip || value133?.help?.tooltip || '').trim();
}
function renderPreviewDescriptionTipHtml(
  value134,
  { className: className = '', ariaLabel: ariaLabel = '编辑参数说明', fallback: fallback = '参数说明' } = {},
) {
  const value135 = Number(value134?.index);
  if (!Number.isInteger(value135)) return '';
  const previewComponentDescription = getPreviewComponentDescription(value134, fallback),
    value136 = ['rh-tip', 'ui-schema-info-tip', 'rh-ai-app-preview-description-target', className]
      .filter(Boolean)
      .join(' ');
  return (
    '<span role="button" tabindex="0" class="' +
    value136 +
    '" data-preview-component-index="' +
    value135 +
    '" data-tooltip="' +
    escapeHtml(previewComponentDescription) +
    '" title="' +
    escapeHtml(previewComponentDescription) +
    '" aria-label="' +
    escapeHtml(ariaLabel) +
    '">!</span>'
  );
}
function renderPreviewPromptHelpTipHtml(value137, { bundle: bundle = null } = {}) {
  const value138 = Number(value137?.index),
    value139 = Number.isInteger(value138),
    previewBundlePromptHelpTooltip =
      getPreviewBundlePromptHelpTooltip(bundle) || getPreviewComponentDescription(value137, '提示词说明'),
    value140 = ['rh-tip', 'rh-ai-app-preview-description-target', 'rh-ai-app-preview-prompt-help-tip']
      .filter(Boolean)
      .join(' '),
    value141 = value139 ? ' data-preview-component-index="' + value138 + '"' : '',
    value142 = ' data-preview-description-scope="prompt-help"';
  return (
    '<button type="button" class="' +
    value140 +
    '"' +
    value141 +
    value142 +
    ' data-tooltip="' +
    escapeHtml(previewBundlePromptHelpTooltip) +
    '" title="' +
    escapeHtml(previewBundlePromptHelpTooltip) +
    '" aria-label="编辑提示词说明">!</button>'
  );
}
function isPreviewToggleOn(value143) {
  if (value143 === true) return true;
  if (value143 === false) return false;
  const value144 = String(value143 ?? '')
    .trim()
    .toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(value144);
}
function getPreviewToggleLabel(value145) {
  return isPreviewToggleOn(value145) ? '是' : '否';
}
function renderPreviewHomeParamsHtml(
  list21 = [],
  value146 = null,
  { canRemovePreviewParams: canRemovePreviewParams = true } = {},
) {
  return renderGroupedPreviewParams(list21, value146, (value147, value148) => {
    const value149 = Number(value147.index),
      value150 = value147.label || value147.fieldName || '参数',
      controlType5 = normalizeControlType(value147.controlType) === 'toggle',
      previewToggleLabel = getPreviewToggleLabel(value147.defaultValue),
      value151 = controlType5 ? ' is-toggle' : '',
      value152 = controlType5
        ? '<button type="button" class="rh-ai-app-preview-param-toggle" data-action="toggle-preview-param-default" data-preview-component-index="' +
          value149 +
          '" aria-label="切换 ' +
          escapeHtml(value150) +
          '，当前' +
          escapeHtml(previewToggleLabel) +
          '"><span class="rh-ai-app-preview-param-toggle-separator" aria-hidden="true">·</span><span class="rh-ai-app-preview-param-toggle-value">' +
          escapeHtml(previewToggleLabel) +
          '</span></button>'
        : '';
    return (
      '\n        <div class="img-pill-btn ui-schema-menu-trigger rh-ai-app-preview-component rh-ai-app-preview-draggable rh-ai-app-preview-param-chip' +
      value151 +
      '" data-preview-drag-kind="param" data-preview-component-index="' +
      value149 +
      '" data-preview-order="' +
      value148 +
      '">\n          ' +
      renderPreviewTypeBarHtml(value147, { canRemove: canRemovePreviewParams }) +
      '\n          <span class="rh-ai-app-preview-rename-target rh-ai-app-preview-param-label" data-preview-component-index="' +
      value149 +
      '">' +
      escapeHtml(value150) +
      '</span>\n          ' +
      value152 +
      '\n          <span class="rh-ai-app-preview-drag-pad" aria-hidden="true"></span>\n        </div>'
    );
  });
}
function renderPreviewAdvancedPanelHtml({ components: components = [], bundle: bundle = null } = {}) {
  const list22 = getPreviewAdvancedParamFields({ bundle: bundle, components: components }),
    enabled13 = list22.length > 0 || getParamComponents(components).length > 0;
  if (!enabled13) return '';
  const previewUiSchemaNodeData = buildPreviewUiSchemaNodeData(bundle),
    value153 = list22.length ? '' : ' is-empty';
  return (
    '\n    <div class="rh-adv-panel show rh-ai-app-preview-advanced-panel' +
    value153 +
    '" data-preview-zone="advanced">\n      ' +
    (list22.length
      ? renderUiSchemaFields(list22, previewUiSchemaNodeData, { placement: 'advanced' })
      : '<div class="rh-ai-app-preview-advanced-empty">拖回这里可放回高级设置</div>') +
    '\n    </div>'
  );
}
function renderControlTypeOptionsHtml(value154) {
  return renderOptionsHtml(CONTROL_TYPE_OPTIONS, normalizeControlType(value154));
}
function renderDefaultValueInputHtml(value155, value156) {
  const value157 = String(value155.defaultValue ?? '');
  if (value156 === 'toggle') {
    const activeValue2 = String(value157).trim().toLowerCase() === 'true' ? 'true' : 'false';
    return renderComponentSelectHtml({
      className: 'rh-ai-app-component-default',
      ariaLabel: '默认值',
      prop: 'defaultValue',
      options: [
        ['true', 'true'],
        ['false', 'false'],
      ],
      activeValue: activeValue2,
    });
  }
  const value158 = value156 === 'stepper' || value156 === 'float' ? 'number' : 'text',
    value159 = value156 === 'stepper' ? ' step="1"' : value156 === 'float' ? ' step="any"' : '';
  return (
    '<input type="' +
    value158 +
    '"' +
    value159 +
    ' class="rh-ai-app-component-default" aria-label="默认值" data-component-prop="defaultValue" value="' +
    escapeHtml(value157) +
    '">'
  );
}
function getNextHomeParamOrder(list23 = []) {
  return Math.min(getPreviewHomeParamComponents(list23).length, PREVIEW_CUSTOM_COMPONENT_LIMIT - 1);
}
function assignSequentialOrder(list24 = [], value160) {
  list24.forEach((value161, value162) => {
    value161[value160] = value162;
  });
}
function getComponentByIndex(list25 = [], value163) {
  return list25.find((value164) => Number(value164?.index) === Number(value163)) || null;
}
function getComfyComponentDraftKey(options4 = {}) {
  const value165 = String(options4?.componentKey || '').trim();
  if (value165) return value165;
  return [options4?.nodeId, options4?.classType, options4?.inputName]
    .map((value166) =>
      String(value166 || '')
        .trim()
        .toLowerCase(),
    )
    .join('::');
}
function mergeComfyComponentDraft(args3 = {}, value167 = {}) {
  const value168 = { ...args3 };
  return (
    [
      'label',
      'defaultValue',
      'inputOrder',
      'homeParamOrder',
      'footerGroupId',
      'footerGroupLabel',
      'footerGroupDescription',
      'advancedParamOrder',
      'previewPlacement',
      'required',
    ].forEach((value169) => {
      if (Object.hasOwn(value167, value169)) value168[value169] = value167[value169];
    }),
    args3.componentKindLocked !== true &&
      Object.hasOwn(value167, 'componentKind') &&
      (value168.componentKind = value167.componentKind),
    args3.controlTypeLocked !== true &&
      Object.hasOwn(value167, 'controlType') &&
      (value168.controlType = value167.controlType),
    value168
  );
}
function preserveComfyComponentDrafts(list26 = [], list27 = []) {
  const map6 = new Map(),
    map7 = new Map();
  list27.forEach((value170) => {
    const value171 = Number(value170?.index);
    if (Number.isInteger(value171)) map6.set(value171, value170);
    const comfyComponentDraftKey = getComfyComponentDraftKey(value170);
    if (comfyComponentDraftKey) map7.set(comfyComponentDraftKey, value170);
  });
  const map8 = new Set();
  return cloneComponentDrafts(list26)
    .map((value172) => {
      const comfyComponentDraftKey2 = getComfyComponentDraftKey(value172),
        value173 = comfyComponentDraftKey2 ? map7.get(comfyComponentDraftKey2) : null,
        value174 = map6.get(Number(value172?.index)),
        enabled14 = value173 || value174 || null,
        value175 = Number(enabled14?.index);
      if (!enabled14 || map8.has(value175)) return null;
      return (map8.add(value175), mergeComfyComponentDraft(enabled14, value172));
    })
    .filter(Boolean);
}
function moveComponentToOrder(list28 = [], value176, value177, value178) {
  const componentByIndex = getComponentByIndex(list28, value176);
  if (!componentByIndex) return false;
  const list29 = sortComponentsByOrder(list28, value177).filter(
      (value179) => Number(value179.index) !== Number(value176),
    ),
    value180 = Math.max(0, Math.min(list29.length, Number(value178) || 0));
  return (list29.splice(value180, 0, componentByIndex), assignSequentialOrder(list29, value177), true);
}
function renderSavedAppsMenuHtml({
  savedApps: savedApps = [],
  pendingDeleteSavedAppId: pendingDeleteSavedAppId = '',
  pendingOverwriteSavedAppId: pendingOverwriteSavedAppId = '',
  pendingOverwriteIntent: pendingOverwriteIntent = '',
} = {}) {
  if (!savedApps.length) return '<div class="rh-ai-app-saved-app-empty">暂无已保存子应用</div>';
  return savedApps.map((error3) => {
    const value181 = String(error3.id || ''),
      appName2 = normalizeAppName(error3.name);
    if (value181 === pendingDeleteSavedAppId)
      return (
        '\n          <div class="rh-ai-app-saved-app-row is-confirming" data-saved-app-id="' +
        escapeHtml(value181) +
        '">\n            <div class="rh-ai-app-saved-app-confirm-text">是否删除「' +
        escapeHtml(appName2) +
        '」？</div>\n            <div class="rh-ai-app-saved-app-confirm-actions">\n              <button type="button" data-action="confirm-delete-app" data-saved-app-id="' +
        escapeHtml(value181) +
        '">删除</button>\n              <button type="button" data-action="cancel-delete-app">取消</button>\n            </div>\n          </div>'
      );
    if (value181 === pendingOverwriteSavedAppId) {
      const value182 = pendingOverwriteIntent === 'create' ? '覆盖后继续生成节点。' : '覆盖后保存当前配置。';
      return (
        '\n          <div class="rh-ai-app-saved-app-row is-confirming is-overwrite-confirming" data-saved-app-id="' +
        escapeHtml(value181) +
        '">\n            <div class="rh-ai-app-saved-app-confirm-text">已存在同名应用「' +
        escapeHtml(appName2) +
        '」，是否覆盖？</div>\n            <div class="rh-ai-app-saved-app-confirm-note">' +
        escapeHtml(value182) +
        '</div>\n            <div class="rh-ai-app-saved-app-confirm-actions">\n              <button type="button" data-action="confirm-overwrite-app" data-saved-app-id="' +
        escapeHtml(value181) +
        '">覆盖</button>\n              <button type="button" data-action="cancel-overwrite-app">取消</button>\n            </div>\n          </div>'
      );
    }
    const value183 = OUTPUT_KIND_LABELS[error3.kind] || error3.kind || '',
      sourceType = normalizeSourceType(error3.sourceType) || SOURCE_TYPES.runninghub,
      isComfyUiSource2 = isComfyUiSource(sourceType)
        ? getComfyUiBaseUrlModeLabel(sourceType)
        : getRunningHubProfileShortLabel(error3.runningHubProfileId),
      value184 = [value183, isComfyUiSource2].filter(Boolean).join(' · ');
    return (
      '\n        <div class="rh-ai-app-saved-app-row" data-saved-app-id="' +
      escapeHtml(value181) +
      '">\n          <button type="button" class="rh-ai-app-saved-app-item" data-action="load-saved-app" data-saved-app-id="' +
      escapeHtml(value181) +
      '">\n            <span>' +
      escapeHtml(appName2) +
      '</span>\n            <small>' +
      escapeHtml(value184) +
      '</small>\n          </button>\n          <button type="button" class="rh-ai-app-saved-app-delete" data-action="request-delete-app" data-saved-app-id="' +
      escapeHtml(value181) +
      '" aria-label="删除 ' +
      escapeHtml(appName2) +
      '">×</button>\n        </div>'
    );
  }).join('');
}
function renderSaveConfigOverwriteMenuHtml({ savedApp: savedApp = null, intent: intent = 'save' } = {}) {
  const enabled15 = String(savedApp?.id || '').trim();
  if (!enabled15) return '';
  const appName3 = normalizeAppName(savedApp.name),
    value185 = intent === 'create' ? '覆盖后继续生成节点。' : '覆盖后保存当前配置。';
  return (
    '\n    <div class="rh-ai-app-save-config-overwrite" data-saved-app-id="' +
    escapeHtml(enabled15) +
    '">\n      <div class="rh-ai-app-saved-app-confirm-text">已存在同名应用「' +
    escapeHtml(appName3) +
    '」，是否覆盖？</div>\n      <div class="rh-ai-app-saved-app-confirm-note">' +
    escapeHtml(value185) +
    '</div>\n      <div class="rh-ai-app-saved-app-confirm-actions">\n        <button type="button" data-action="confirm-overwrite-app" data-saved-app-id="' +
    escapeHtml(enabled15) +
    '">覆盖</button>\n        <button type="button" data-action="cancel-overwrite-app">取消</button>\n      </div>\n    </div>'
  );
}
function getComfyUiCandidateSearchText(options5 = {}) {
  return [
    options5.label,
    options5.nodeId,
    options5.nodeTitle,
    options5.classType,
    options5.inputName,
  ]
    .map((value186) =>
      String(value186 || '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean)
    .join(' ');
}
function filterComfyUiCandidates(list30 = [], map9 = new Set(), value187 = '') {
  const enabled16 = String(value187 || '')
    .trim()
    .toLowerCase();
  return (Array.isArray(list30) ? list30 : []).filter((value188) => {
    const value189 = Number(value188?.index);
    if (!Number.isInteger(value189) || map9.has(value189)) return false;
    return !enabled16 || getComfyUiCandidateSearchText(value188).includes(enabled16);
  });
}
function getComfyUiCandidateDefaultComponentName(options6 = {}) {
  return formatComfyUiComponentLabel(options6);
}
function getComfyUiCandidateMenuMeta(el3 = {}) {
  return (
    [
      el3.nodeId,
      el3.classType,
      el3.inputName,
      '默认值：' + (String(el3.defaultValue ?? el3.value ?? '') || '（空）'),
    ]
      .filter((value190) => String(value190 || '').trim())
      .join(' / ') || getComfyUiCandidateDefaultComponentName(el3)
  );
}
function renderComfyUiCandidateMenuHtml(list31 = [], map10 = new Set(), value191 = '') {
  const list32 = (Array.isArray(list31) ? list31 : []).filter((value192) => {
      const value193 = Number(value192?.index);
      return Number.isInteger(value193) && !map10.has(value193);
    }),
    list33 = filterComfyUiCandidates(list31, map10, value191);
  if (!list32.length) return '<div class="rh-ai-app-candidate-empty">暂无可添加组件</div>';
  if (!list33.length) return '<div class="rh-ai-app-candidate-empty">没有匹配的节点输入</div>';
  const value194 = list33.map((value195) => {
    const value196 = Number(value195.index),
      comfyUiCandidateDefaultComponentName = getComfyUiCandidateDefaultComponentName(value195),
      comfyUiCandidateMenuMeta = getComfyUiCandidateMenuMeta(value195),
      value197 = comfyUiCandidateMenuMeta
        ? '<span class="rh-ai-app-candidate-meta">' + escapeHtml(comfyUiCandidateMenuMeta) + '</span>'
        : '';
    return (
      '\n        <button type="button" class="rh-ai-app-candidate-option" data-action="choose-comfy-candidate" data-component-index="' +
      value196 +
      '">\n          <span class="rh-ai-app-candidate-topline">\n            <span class="rh-ai-app-candidate-title">' +
      escapeHtml(comfyUiCandidateDefaultComponentName) +
      '</span>\n            ' +
      value197 +
      '\n          </span>\n        </button>'
    );
  }).join('');
  return '<div class="rh-ai-app-candidate-options">' + value194 + '</div>';
}
function renderComfyUiComponentAddPanelHtml({
  show: show = false,
  canAdd: canAdd = true,
  hasComponents: hasComponents = false,
  emptyText: emptyText = '',
  isOpen: isOpen = false,
  searchText: searchText = '',
} = {}) {
  if (!show) return '';
  const value198 = hasComponents
      ? '继续选择工作流输入，新增组件会直接加入节点组件编辑。'
      : emptyText || '点击添加组件，逐行选择要暴露到节点上的工作流输入。',
    value199 = isOpen ? '收起组件' : '点击添加组件',
    value200 = canAdd ? '' : ' disabled';
  return (
    '\n    <div class="rh-ai-app-comfy-add-panel ' +
    (isOpen ? 'is-open' : '') +
    '">\n      <div class="rh-ai-app-comfy-add-panel-head">\n        <button type="button" class="rh-ai-app-secondary rh-ai-app-add-component" data-action="toggle-comfy-candidate-select" aria-expanded="' +
    (isOpen ? 'true' : 'false') +
    '"' +
    value200 +
    '>' +
    value199 +
    '</button>\n        <div class="rh-ai-app-comfy-head-slot">\n          <div class="rh-ai-app-comfy-add-hint">' +
    escapeHtml(value198) +
    '</div>\n          <label class="rh-ai-app-candidate-search">\n            <span>搜索组件</span>\n            <input type="search" data-role="comfyui-candidate-search" value="' +
    escapeHtml(searchText) +
    '" placeholder="搜索节点 ID、节点名字、输入名" aria-label="搜索组件">\n          </label>\n        </div>\n      </div>\n      <div class="rh-ai-app-candidate-menu" data-role="comfyui-candidate-menu" aria-hidden="' +
    (isOpen ? 'false' : 'true') +
    '"></div>\n    </div>'
  );
}
function renderPreviewAppMenuHtml({
  appName: appName = DEFAULT_AI_APP_NAME,
  savedApps: savedApps = [],
  isOpen: isOpen = false,
  pendingDeleteSavedAppId: pendingDeleteSavedAppId = '',
  pendingOverwriteSavedAppId: pendingOverwriteSavedAppId = '',
  pendingOverwriteIntent: pendingOverwriteIntent = '',
  sourceLabel: sourceLabel = 'RH AI应用',
} = {}) {
  if (!isOpen) return '';
  const appName4 = normalizeAppName(appName);
  return (
    '\n    <div class="rh-ai-app-preview-app-menu" data-role="saved-app-menu">\n      <div class="rh-ai-app-preview-app-menu-title">' +
    escapeHtml(sourceLabel) +
    '</div>\n      <div class="rh-ai-app-current-app-row">\n        <button type="button" class="rh-ai-app-current-app-item active" data-action="rename-current-app">\n          <span>' +
    escapeHtml(appName4) +
    '</span>\n          <small>当前创建</small>\n        </button>\n      </div>\n      <div class="rh-ai-app-preview-app-menu-subtitle">已保存子应用</div>\n      ' +
    renderSavedAppsMenuHtml({
      savedApps: savedApps,
      pendingDeleteSavedAppId: pendingDeleteSavedAppId,
      pendingOverwriteSavedAppId: pendingOverwriteSavedAppId,
      pendingOverwriteIntent: pendingOverwriteIntent,
    }) +
    '\n    </div>'
  );
}
function renderRhAiAppNodePreviewHtml({
  components: components = [],
  kind: kind = 'image',
  bundle: bundle = null,
  appName: appName = DEFAULT_AI_APP_NAME,
  savedApps: savedApps = [],
  isAppMenuOpen: isAppMenuOpen = false,
  pendingDeleteSavedAppId: pendingDeleteSavedAppId = '',
  pendingOverwriteSavedAppId: pendingOverwriteSavedAppId = '',
  pendingOverwriteIntent: pendingOverwriteIntent = '',
  sourceLabel: sourceLabel = 'RH AI应用',
  runningHubProfileLabel: runningHubProfileLabel = '',
  showComfyAddPanel: showComfyAddPanel = false,
  canAddComfyComponents: canAddComfyComponents = true,
  comfyCandidatePickerOpen: comfyCandidatePickerOpen = false,
  comfyCandidateSearchText: comfyCandidateSearchText = '',
  comfyCandidateEmptyText: comfyCandidateEmptyText = '',
  canRemovePreviewParams: canRemovePreviewParams = true,
  canRemovePreviewInputs: canRemovePreviewInputs = true,
} = {}) {
  const value201 = components.find(
      (value202) => normalizeComponentKind(value202?.componentKind) === 'prompt',
    ),
    previewPromptHelpComponent = getPreviewPromptHelpComponent(components),
    value203 = (value201 || previewPromptHelpComponent)?.label
      ? '填写' + (value201 || previewPromptHelpComponent).label + '，按 @ 引用素材，/呼出指令...'
      : '描述' + (OUTPUT_KIND_LABELS[kind] || '生成') + '内容，按 @ 引用素材，/呼出指令...',
    value204 = Number(value201?.index),
    value205 = Number.isInteger(value204) ? ' data-preview-component-index="' + value204 + '"' : '',
    value206 = Number.isInteger(value204) ? ' rh-ai-app-preview-prompt-target' : '',
    value207 =
      value201 && canPreviewPromptBecomeParam(value201)
        ? ' rh-ai-app-preview-draggable rh-ai-app-preview-prompt-draggable'
        : '',
    value208 = value201 && canPreviewPromptBecomeParam(value201) ? ' data-preview-drag-kind="prompt"' : '',
    previewInstanceText = getPreviewInstanceText(bundle),
    renderPreviewBatchControlsHtml2 = renderPreviewBatchControlsHtml(bundle),
    renderComfyUiComponentAddPanelHtml2 = renderComfyUiComponentAddPanelHtml({
      show: showComfyAddPanel,
      canAdd: canAddComfyComponents,
      hasComponents: components.length > 0,
      emptyText: comfyCandidateEmptyText,
      isOpen: canAddComfyComponents && comfyCandidatePickerOpen === true,
      searchText: comfyCandidateSearchText,
    });
  return (
    '\n    ' +
    renderComfyUiComponentAddPanelHtml2 +
    '\n    <div class="rh-ai-app-node-preview-card rh-ai-app-preview-node" data-preview-node-kind="' +
    escapeHtml(kind) +
    '">\n      <div class="text-prompt-panel rh-ai-app-real-preview-panel" data-role="preview-canvas">\n        ' +
    renderPreviewPromptHelpTipHtml(previewPromptHelpComponent, { bundle: bundle }) +
    '\n        <div class="node-ref-bar active rh-v5-refbar rh-ai-app-preview-input-zone" data-preview-zone="input">\n          ' +
    renderPreviewInputComponentsHtml(components, { canRemovePreviewInputs: canRemovePreviewInputs }) +
    '\n        </div>\n        <div class="prompt-input-wrapper rh-ai-app-preview-input rh-ai-app-preview-prompt-zone' +
    value206 +
    value207 +
    '" data-preview-zone="prompt"' +
    value205 +
    value208 +
    '>\n          ' +
    (value201 ? renderPreviewTypeBarHtml(value201, { canRemove: canRemovePreviewParams }) : '') +
    '\n          <div class="prompt-textarea rh-ai-app-preview-prompt" data-placeholder="' +
    escapeHtml(value203) +
    '"></div>\n        </div>\n        <div class="prompt-panel-footer">\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              <button type="button" class="img-pill-btn img-model-btn-trigger rh-ai-app-preview-model-trigger" data-action="toggle-app-menu" title="单击打开 ' +
    escapeHtml(sourceLabel) +
    ' 菜单，双击修改名字">\n                <img class="image-model-trigger-icon" src="images/RH.png" alt="">\n                <span class="rh-ai-app-preview-runtime-badge" data-role="preview-runninghub-runtime-label"' +
    (runningHubProfileLabel ? '' : ' hidden') +
    '>' +
    escapeHtml(runningHubProfileLabel) +
    '</span>\n                <span class="img-model-label">' +
    escapeHtml(normalizeAppName(appName)) +
    '</span>\n              </button>\n              ' +
    renderPreviewAppMenuHtml({
      appName: appName,
      savedApps: savedApps,
      isOpen: isAppMenuOpen,
      pendingDeleteSavedAppId: pendingDeleteSavedAppId,
      pendingOverwriteSavedAppId: pendingOverwriteSavedAppId,
      pendingOverwriteIntent: pendingOverwriteIntent,
      sourceLabel: sourceLabel,
    }) +
    '\n            </div>\n          </div>\n          <div class="ui-schema-placement rh-ai-app-preview-param-zone" data-preview-zone="params">\n            ' +
    renderPreviewHomeParamsHtml(components, bundle, { canRemovePreviewParams: canRemovePreviewParams }) +
    '\n          </div>\n          <div class="prompt-actions">\n            <div class="rh-adv-wrap rh-ai-app-preview-adv-wrap">\n              <button type="button" class="img-pill-btn rh-adv-btn" tabindex="-1">\n                <span class="rh-adv-btn-label"></span>\n              </button>\n            </div>\n            <div class="ui-schema-placement ui-schema-instance-slot"' +
    (previewInstanceText ? '' : ' hidden') +
    '>\n              <button type="button" class="img-pill-btn rh-vram-btn" tabindex="-1">\n                <span class="rh-vram-label">' +
    escapeHtml(previewInstanceText) +
    '</span>\n              </button>\n            </div>\n            <div class="ui-schema-placement ui-schema-batch-slot"' +
    (renderPreviewBatchControlsHtml2 ? '' : ' hidden') +
    '>\n              ' +
    renderPreviewBatchControlsHtml2 +
    '\n            </div>\n            <button type="button" class="prompt-submit img-gen-btn" tabindex="-1" aria-label="生成">\n              <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>\n            </button>\n          </div>\n        </div>\n        ' +
    renderPreviewAdvancedPanelHtml({ components: components, bundle: bundle }) +
    '\n      </div>\n    </div>'
  );
}
function renderAppNameConfigHtml(value209 = DEFAULT_AI_APP_NAME, value210 = '') {
  return (
    '\n    <div class="rh-ai-app-component-row rh-ai-app-app-name-row">\n      <label class="rh-ai-app-meta-field">\n        <span class="rh-ai-app-component-static-label">AI应用名称</span>\n        <input type="text" class="rh-ai-app-name-input" aria-label="AI应用名称" data-app-prop="appName" value="' +
    escapeHtml(value209) +
    '">\n      </label>\n      <label class="rh-ai-app-meta-field">\n        <span class="rh-ai-app-component-static-label">简介</span>\n        <input type="text" class="rh-ai-app-description-input" aria-label="简介" data-app-prop="appDescription" value="' +
    escapeHtml(value210) +
    '" placeholder="填写应用简介">\n      </label>\n    </div>'
  );
}
function renderComponentConfigHtml(
  list34 = [],
  value211 = DEFAULT_AI_APP_NAME,
  value212 = '',
  value213 = {},
) {
  return renderAppNameConfigHtml(value211, value212);
}
class RunningHubAiAppManager {
  constructor() {
    ((this.panel = null),
      (this.button = null),
      (this.textarea = null),
      (this.builderEl = null),
      (this.sourceSelectEl = null),
      (this.workbenchEl = null),
      (this.bodyEl = null),
      (this.kindTabsEl = null),
      (this.sourceBackBtn = null),
      (this.nodePreviewEl = null),
      (this.componentListEl = null),
      (this.componentPickerEl = null),
      (this.summaryEl = null),
      (this.errorEl = null),
      (this.saveBtn = null),
      (this.saveConfigMenuEl = null),
      (this.createConfigMenuEl = null),
      (this.createBtn = null),
      (this.runtimeToggleEl = null),
      (this.runningHubRuntimeToggleEl = null),
      (this.sourceType = ''),
      (this.definitionReference = ''),
      (this.definitionController = createRhAiAppDefinitionController(this)),
      (this.kind = 'image'),
      (this.runningHubProfileId = getDefaultRunningHubProfileId()),
      (this.appName = DEFAULT_AI_APP_NAME),
      (this.appDescription = ''),
      (this.promptHelpTooltip = ''),
      (this.savedAppId = ''),
      (this.currentBundle = null),
      (this.componentDrafts = []),
      (this.componentCandidates = []),
      (this.componentDraftKey = ''),
      (this.comfyCandidateSearchText = ''),
      (this.comfyCandidatePickerOpen = false),
      (this.workflowInputCollapsed = false),
      (this.errorMessage = ''),
      (this.configRepository = createRhAiAppConfigRepository({
        getSnapshot: () => this._getConfigRepositorySnapshot(),
        applyExternalSnapshot: (value214) => this._applyExternalStoragePayload(value214),
      })));
    const value215 = this.configRepository.loadLocalSeed();
    this.kindStates = this.configRepository.createInitialKindStates();
    const value216 = value215.panelDraft;
    value216 &&
      ((this.sourceType = value216.sourceType || ''),
      (this.kind = value216.kind),
      (this.kindStates = value216.kindStates));
    ((this.savedApps = value215.savedApps),
      (this.localStorageSeedHasData = value215.hasData),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      (this.parseTimer = 0),
      (this.saveSuccessTimer = 0),
      (this.sourceViewAnimationTimer = 0),
      (this.sourceViewTransitionDirection = ''),
      (this.workflowJsonDragDepth = 0),
      (this.registeredBundleKeys = new Set()),
      (this.nodeBundleRegistry = createCustomAiAppNodeBundleRegistry({
        registerBundle: (value217, value218) =>
          registerCustomAiAppBundle(value217, this.registeredBundleKeys, value218),
        unregisterBundle: (value219) => unregisterCustomAiAppBundle(value219, this.registeredBundleKeys),
        isBundleRegistered: (value220) => this.registeredBundleKeys.has(value220),
      })),
      (this.unsubscribeNodes = null),
      (this.previewPresentation = createRhAiAppPreviewPresentation({
        readState: () => ({
          nodePreviewEl: this.nodePreviewEl,
          componentDrafts: this.componentDrafts,
          kind: this.kind,
          currentBundle: this.currentBundle,
          appName: this.appName,
          runningHubProfileLabel: this._isRunningHubAiAppSource()
            ? getRunningHubProfileShortLabel(this.runningHubProfileId)
            : '',
          previewAppMenuOpen: this.previewAppMenuOpen,
          pendingDeleteSavedAppId: this.pendingDeleteSavedAppId,
          pendingOverwriteSavedAppId: this.pendingOverwriteSavedAppId,
          pendingOverwriteIntent: this.pendingOverwriteIntent,
          componentDraftKey: this.componentDraftKey,
          comfyCandidatePickerOpen: this.comfyCandidatePickerOpen,
          comfyCandidateSearchText: this.comfyCandidateSearchText,
          saveConfigMenuEl: this.saveConfigMenuEl,
          createConfigMenuEl: this.createConfigMenuEl,
        }),
        writeState: (value221) => Object.assign(this, value221),
        actions: {
          getSavedAppsForKind: () => this._getSavedAppsForKind(),
          getSourceMeta: () => this._getSourceMeta(),
          syncRunningHubProfileBadge: (value222) =>
            syncRunningHubProfileBadge(
              value222,
              this.runningHubProfileId,
              this._isRunningHubAiAppSource(),
            ),
          shouldShowManualComponentPicker: () => this._shouldShowManualComponentPicker(),
          canRemovePreviewParams: () => this._canRemovePreviewParams(),
          canRemovePreviewInputs: () => this._canRemovePreviewInputs(),
          renderComfyCandidatePicker: (value223) => this._renderComfyCandidatePicker(value223),
          findSavedApp: (value224) => this._findSavedApp(value224),
          commitPreviewUiSchemaValue: (value225, value226) =>
            this._commitPreviewUiSchemaValue(value225, value226),
        },
        primitives: {
          OUTPUT_KIND_LABELS: OUTPUT_KIND_LABELS,
          RH_AI_APP_EXIT_MOTION_MS: RH_AI_APP_EXIT_MOTION_MS,
          bindUiSchemaFieldControls: bindUiSchemaFieldControls,
          buildPreviewUiSchemaNodeData: buildPreviewUiSchemaNodeData,
          canPreviewPromptBecomeParam: canPreviewPromptBecomeParam,
          getBundleParamFields: getBundleParamFields,
          getComponentByIndex: getComponentByIndex,
          getCustomAiAppComponentIndex: getCustomAiAppComponentIndex,
          getPreviewComponentDescription: getPreviewComponentDescription,
          getPreviewInstanceText: getPreviewInstanceText,
          getPreviewPromptHelpComponent: getPreviewPromptHelpComponent,
          normalizeAppName: normalizeAppName,
          normalizeComponentKind: normalizeComponentKind,
          normalizeKind: normalizeKind,
          renderPreviewAdvancedPanelHtml: renderPreviewAdvancedPanelHtml,
          renderPreviewAppMenuHtml: renderPreviewAppMenuHtml,
          renderPreviewBatchControlsHtml: renderPreviewBatchControlsHtml,
          renderPreviewHomeParamsHtml: renderPreviewHomeParamsHtml,
          renderPreviewInputComponentsHtml: renderPreviewInputComponentsHtml,
          renderPreviewPromptHelpTipHtml: renderPreviewPromptHelpTipHtml,
          renderPreviewTypeBarHtml: renderPreviewTypeBarHtml,
          renderRhAiAppNodePreviewHtml: renderRhAiAppNodePreviewHtml,
          renderSaveConfigOverwriteMenuHtml: renderSaveConfigOverwriteMenuHtml,
          shouldReduceMotion: shouldReduceMotion,
        },
      })),
      (this.previewDragController = createRhAiAppPreviewDragController({
        readState: () => ({
          panel: this.panel,
          nodePreviewEl: this.nodePreviewEl,
          componentDrafts: this.componentDrafts,
        }),
        actions: {
          getPreviewZoneElement: (value227) =>
            this.previewPresentation._getPreviewZoneElement(value227),
          isPreviewControlTarget: (value228) => this._isPreviewControlTarget(value228),
          startPreviewInlineRename: (value229, value230) =>
            this._startPreviewInlineRename(value229, value230),
          refreshBundleFromComponents: (value231) => this._refreshBundleFromComponents(value231),
          patchPreviewWithoutRebuild: (value232, value233) =>
            this._patchPreviewWithoutRebuild(value232, value233),
        },
        primitives: {
          PREVIEW_CUSTOM_COMPONENT_LIMIT: PREVIEW_CUSTOM_COMPONENT_LIMIT,
          PREVIEW_DRAG_START_THRESHOLD_PX: PREVIEW_DRAG_START_THRESHOLD_PX,
          PREVIEW_DROP_ZONES: PREVIEW_DROP_ZONES,
          PREVIEW_MOVE_ANIMATION_MS: PREVIEW_MOVE_ANIMATION_MS,
          PREVIEW_RENAME_CLICK_TOLERANCE_PX: PREVIEW_RENAME_CLICK_TOLERANCE_PX,
          assignSequentialOrder: assignSequentialOrder,
          buildComponentByIndex: buildComponentByIndex,
          canPreviewComponentBecomePrompt: canPreviewComponentBecomePrompt,
          canPreviewPromptBecomeParam: canPreviewPromptBecomeParam,
          getComponentByIndex: getComponentByIndex,
          getPreviewAdvancedParamComponents: getPreviewAdvancedParamComponents,
          getPreviewHomeParamComponents: getPreviewHomeParamComponents,
          getPreviewInputComponents: getPreviewInputComponents,
          getPreviewParamText: getPreviewParamText,
          getPreviewPromptReturnControlType: getPreviewPromptReturnControlType,
          isParamComponent: isParamComponent,
          moveComponentToOrder: moveComponentToOrder,
          shouldReduceMotion: shouldReduceMotion,
        },
      })),
      (this.contextMenuController = createRunningHubAiAppContextMenuController({
        getPanel: () => this.panel,
        beforeOpen: () => this._closeInlineMenusBeforeContextMenu(),
      })),
      this._createPanel(),
      this.previewDragController.bindGroups(),
      this._syncSourceView());
    if (this.sourceType) this._restoreKindState(this.kind);
    (this._bindButton(),
      this._bindGlobalEvents(),
      this._registerSavedAppBundles(),
      this._watchExistingNodeBundles(),
      void this._hydrateExternalStorage());
  }
  ['_createPanel']() {
    ((this.panel = document.createElement('section')),
      (this.panel.className = 'rh-ai-app-panel'),
      this.panel.setAttribute('aria-label', '自定义AI应用'),
      this.panel.setAttribute('aria-hidden', 'true'),
      (this.panel.innerHTML =
        '\n      <div class="rh-ai-app-header">\n        <div>\n          <div class="rh-ai-app-title" data-role="panel-title">自定义AI应用</div>\n          <div class="rh-ai-app-subtitle" data-role="panel-subtitle">选择一种自定义应用来源</div>\n        </div>\n        <div class="rh-ai-app-header-actions">\n          <button type="button" class="rh-ai-app-back-to-sources" data-action="back-to-source-types" aria-label="返回自定义AI应用" title="返回自定义AI应用" hidden>\n            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path><path d="M20 12H9"></path></svg>\n          </button>\n          <button type="button" class="rh-ai-app-back" data-action="close" aria-label="关闭">\n            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>\n          </button>\n        </div>\n      </div>\n      <div class="rh-ai-app-body">\n        <div class="rh-ai-app-source-select" data-role="source-select">\n          <button type="button" class="rh-ai-app-source-option rh-ai-app-source-option--rh" data-action="select-source-type" data-source-type="runninghub-ai-app" data-vip-model-id="' +
        escapeHtml(RH_AI_APP_VIP_MODEL_ID) +
        '" data-provider="' +
        escapeHtml(RH_AI_APP_VIP_PROVIDER) +
        '">\n            <span class="rh-ai-app-source-content">\n              ' +
        renderRunningHubAiAppLogoHtml({ className: 'rh-ai-app-source-icon rh-ai-app-source-icon--rh' }) +
        '\n              <span class="rh-ai-app-source-copy">\n                <span class="rh-ai-app-source-title">\n                  <span>RunningHub</span>\n                  <span class="floating-menu-badge floating-menu-badge-warning floating-menu-badge-inline rh-ai-app-source-vip">VIP</span>\n                </span>\n                <span class="rh-ai-app-source-subtitle">粘贴 AI 应用或工作流链接，自动识别并获取配置</span>\n              </span>\n            </span>\n            <span class="rh-ai-app-source-arrow" aria-hidden="true">\n              <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>\n            </span>\n          </button>\n          <button type="button" class="rh-ai-app-source-option rh-ai-app-source-option--comfyui" data-action="select-source-type" data-source-type="comfyui-local-workflow">\n            <span class="rh-ai-app-source-content">\n              ' +
        renderComfyUiLocalWorkflowLogoHtml({ className: 'rh-ai-app-source-icon' }) +
        '\n              <span class="rh-ai-app-source-copy">\n                <span class="rh-ai-app-source-title">ComfyUI 工作流</span>\n                <span class="rh-ai-app-source-subtitle">粘贴 ComfyUI API workflow，选择本地或云端运行环境</span>\n              </span>\n            </span>\n            <span class="rh-ai-app-source-arrow" aria-hidden="true">\n              <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>\n            </span>\n          </button>\n        </div>\n        <div class="rh-ai-app-workbench" data-role="workbench" hidden>\n          <div class="rh-ai-app-field rh-ai-app-kind-field">\n            <div class="rh-ai-app-label rh-ai-app-input-title">节点类型</div>\n            <div class="rh-ai-app-kind-tabs is-kind-image" role="tablist" aria-label="节点类型">\n              <button type="button" class="active" data-kind="image" aria-pressed="true">图像</button>\n              <button type="button" data-kind="video" aria-pressed="false">视频</button>\n              <button type="button" data-kind="audio" aria-pressed="false">音频</button>\n            </div>\n          </div>\n          <div class="rh-ai-app-field rh-ai-app-workflow-field" data-role="workflow-input-field">\n            <div class="rh-ai-app-input-head">\n              <span class="rh-ai-app-label rh-ai-app-input-title" data-role="input-label">RunningHub 请求</span>\n              <div class="rh-ai-app-input-actions">\n                <div class="rh-ai-app-input-summary" data-role="workflow-input-summary" hidden></div>\n                <div class="rh-ai-app-runtime-toggle" data-role="comfyui-runtime-toggle" role="radiogroup" aria-label="运行环境" hidden>\n                  <span class="rh-ai-app-runtime-label">运行环境</span>\n                  <button type="button" data-action="select-comfyui-runtime" data-comfyui-runtime="local" aria-pressed="true">本地工作流</button>\n                  <button type="button" data-action="select-comfyui-runtime" data-comfyui-runtime="cloud" aria-pressed="false">云端工作流</button>\n                </div>\n                <button type="button" class="rh-ai-app-input-toggle" data-action="toggle-workflow-input" aria-label="收起 JSON" title="收起 JSON" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>\n              </div>\n            </div>\n            <div class="rh-ai-app-input-shell" data-role="workflow-input-shell">\n              <div class="rh-ai-app-input-shell-inner">\n                <textarea class="rh-ai-app-input" spellcheck="false" placeholder="粘贴 openapi/v2/run/ai-app 的 curl 或 JSON"></textarea>\n              </div>\n            </div>\n          </div>\n          <div class="rh-ai-app-builder" data-role="builder" hidden>\n            <div class="rh-ai-app-section-head">\n              <div class="rh-ai-app-section-title">应用信息</div>\n            </div>\n            <div class="rh-ai-app-component-list" data-role="components"></div>\n            <div class="rh-ai-app-section-title">节点组件编辑</div>\n            <div data-role="node-preview"></div>\n          </div>\n          <div class="rh-ai-app-preview" data-role="summary">\n            ' +
        renderSummaryHtml(null) +
        '\n          </div>\n        </div>\n        <div class="rh-ai-app-error" data-role="error" hidden></div>\n      </div>\n      <div class="rh-ai-app-footer" data-role="footer">\n        <span class="rh-ai-app-save-config-wrap">\n          <button type="button" class="rh-ai-app-secondary" data-action="save-config" disabled>保存模型</button>\n          <div class="rh-ai-app-save-config-menu" data-role="save-config-menu" aria-hidden="true" hidden></div>\n        </span>\n        <span class="rh-ai-app-create-config-wrap">\n          <button type="button" class="rh-ai-app-primary" data-action="create" disabled>创建测试节点</button>\n          <div class="rh-ai-app-create-config-menu" data-role="create-config-menu" aria-hidden="true" hidden></div>\n        </span>\n      </div>'));
    const el4 = document.body || document.documentElement;
    (el4.appendChild(this.panel),
      (this.bodyEl = this.panel.querySelector('.rh-ai-app-body')),
      (this.sourceSelectEl = this.panel.querySelector('[data-role=\'source-select\']')),
      (this.workbenchEl = this.panel.querySelector('[data-role=\'workbench\']')),
      (this.kindTabsEl = this.panel.querySelector('.rh-ai-app-kind-tabs')),
      (this.sourceBackBtn = this.panel.querySelector("[data-action='back-to-source-types']")),
      (this.workflowInputFieldEl = this.panel.querySelector(
        '[data-role=\'workflow-input-field\']',
      )),
      (this.workflowInputSummaryEl = this.panel.querySelector(
        "[data-role='workflow-input-summary']",
      )),
      (this.runtimeToggleEl = this.panel.querySelector("[data-role='comfyui-runtime-toggle']")),
      (this.runningHubRuntimeToggleEl = this.panel.querySelector(
        "[data-role='runninghub-runtime-toggle']",
      )),
      (this.workflowInputToggleBtn = this.panel.querySelector(
        '[data-action=\'toggle-workflow-input\']',
      )),
      (this.textarea = this.panel.querySelector('.rh-ai-app-input')),
      (this.builderEl = this.panel.querySelector("[data-role='builder']")),
      (this.nodePreviewEl = this.panel.querySelector("[data-role='node-preview']")),
      (this.componentListEl = this.panel.querySelector("[data-role='components']")),
      (this.componentPickerEl = this.panel.querySelector("[data-role='comfyui-candidate-menu']")),
      (this.summaryEl = this.panel.querySelector('[data-role=\'summary\']')),
      (this.errorEl = this.panel.querySelector('[data-role=\'error\']')),
      (this.saveBtn = this.panel.querySelector('[data-action=\'save-config\']')),
      (this.saveConfigMenuEl = this.panel.querySelector("[data-role='save-config-menu']")),
      (this.createConfigMenuEl = this.panel.querySelector("[data-role='create-config-menu']")),
      (this.createBtn = this.panel.querySelector("[data-action='create']")),
      this.definitionController.mount(),
      this.panel.addEventListener('click', (value234) => this._handlePanelClick(value234)),
      this.panel.addEventListener('contextmenu', (value235) =>
        this.contextMenuController.handleContextMenu(value235),
      ),
      this.panel.addEventListener('dblclick', (value236) => this._handlePanelDoubleClick(value236)),
      this.panel.addEventListener('keydown', (value237) => this._handlePanelKeyDown(value237)),
      this.panel.addEventListener('focusout', (value238) => this._handlePanelFocusOut(value238)),
      this.panel.addEventListener('pointerdown', (event) => {
        (event.stopPropagation(), this.previewDragController.handlePointerDown(event));
      }),
      this.panel.addEventListener('input', (value239) => this._handleComponentInput(value239)),
      this.panel.addEventListener('change', (value240) => this._handleComponentInput(value240)),
      this.bodyEl?.addEventListener('scroll', () => this._syncStickyHeaderShadow()),
      this.workflowInputFieldEl?.addEventListener('dragenter', (value241) =>
        this._handleWorkflowJsonFileDragEnter(value241),
      ),
      this.workflowInputFieldEl?.addEventListener('dragover', (value242) =>
        this._handleWorkflowJsonFileDragOver(value242),
      ),
      this.workflowInputFieldEl?.addEventListener('dragleave', (value243) =>
        this._handleWorkflowJsonFileDragLeave(value243),
      ),
      this.workflowInputFieldEl?.addEventListener(
        'drop',
        (value244) => void this._handleWorkflowJsonFileDrop(value244),
      ),
      this.textarea?.addEventListener('input', () => {
        ((this.workflowInputCollapsed = false),
          this._syncWorkflowInputCollapsed(),
          this._scheduleParse());
      }));
  }
  ['_bindButton']() {
    this.button = document.getElementById('btnRunningHubAiApp');
    if (!this.button || !this.panel) return;
    (this.button.setAttribute('aria-haspopup', 'dialog'),
      this.button.setAttribute('aria-expanded', 'false'),
      this.button.addEventListener('click', (event2) => {
        (event2.preventDefault(), event2.stopPropagation());
        if (Number(event2.detail || 0) > 1) return;
        this._toggle();
      }),
      this.button.addEventListener('dblclick', (event3) => {
        (event3.preventDefault(), event3.stopPropagation(), this._close());
      }));
  }
  ['_bindGlobalEvents']() {
    (document.addEventListener('keydown', (event4) => {
      if (event4.key !== 'Escape' || !this._isOpen()) return;
      if (this.previewAppMenuOpen) {
        ((this.previewAppMenuOpen = false),
          (this.pendingDeleteSavedAppId = ''),
          (this.pendingOverwriteSavedAppId = ''),
          (this.pendingOverwriteIntent = ''),
          this._patchPreviewAppChrome());
        return;
      }
      this._close();
    }),
      document.addEventListener('pointerdown', (event5) => {
        if (!this.previewAppMenuOpen || !this._isOpen()) return;
        if (this.panel?.contains(event5.target)) return;
        ((this.previewAppMenuOpen = false),
          (this.pendingDeleteSavedAppId = ''),
          (this.pendingOverwriteSavedAppId = ''),
          (this.pendingOverwriteIntent = ''),
          this._patchPreviewAppChrome());
      }),
      document.addEventListener('pointermove', (value245) =>
        this.previewDragController.handlePointerMove(value245),
      ),
      document.addEventListener('pointerup', (value246) =>
        this.previewDragController.handlePointerEnd(value246),
      ),
      document.addEventListener('pointercancel', (value247) =>
        this.previewDragController.handlePointerEnd(value247),
      ),
      window.addEventListener('custom-ai-app:open', () => this._openSourceSelect()),
      window.addEventListener('custom-ai-app:toggle', () => this._toggleSourceSelect()));
  }
  ['_watchExistingNodeBundles']() {
    this.unsubscribeNodes = graphStore.subscribeNodeField('rhAiAppManifestBundle', (value248) =>
      this._registerBundlesFromNodes(value248),
    );
  }
  ['_registerBundlesFromNodes'](value249) {
    const bundles =
        value249 ||
        Object.values(graphStore.getStateRaw()?.nodes || {})
          .map((value250) => value250?.rhAiAppManifestBundle)
          .filter(Boolean),
      savedBundleKeys = this.savedApps
        .map((value251) => getCustomAiAppBundleKey(value251?.bundle))
        .filter(Boolean);
    return this.nodeBundleRegistry.reconcile({ bundles: bundles, savedBundleKeys: savedBundleKeys });
  }
  ['_getSavedAppsForKind'](value252 = this.kind) {
    const kind3 = normalizeKind(value252),
      sourceType2 = normalizeSourceType(this.sourceType) || SOURCE_TYPES.runninghub;
    return this.savedApps.filter((value253) => {
      if (normalizeKind(value253.kind) !== kind3) return false;
      const sourceType3 = normalizeSourceType(value253.sourceType) || SOURCE_TYPES.runninghub;
      if (isComfyUiSource(sourceType2)) return isComfyUiSource(sourceType3);
      if (isRunningHubSource(sourceType2)) return isRunningHubSource(sourceType3);
      return sourceType3 === sourceType2;
    });
  }
  ['_getSavedAppsForExactSource'](value254 = this.kind, value255 = this.sourceType) {
    const kind4 = normalizeKind(value254),
      sourceType4 = normalizeSourceType(value255) || SOURCE_TYPES.runninghub;
    return this.savedApps.filter((value256) => {
      if (normalizeKind(value256.kind) !== kind4) return false;
      const sourceType5 = normalizeSourceType(value256.sourceType) || SOURCE_TYPES.runninghub;
      return sourceType5 === sourceType4;
    });
  }
  ['_findSavedApp'](value257) {
    const enabled17 = String(value257 || '').trim();
    if (!enabled17) return null;
    return this.savedApps.find((value258) => value258.id === enabled17) || null;
  }
  ['_findSameNameSavedAppForCurrentScope'](value259 = this.appName) {
    const appName5 = normalizeAppName(value259);
    return (
      this._getSavedAppsForExactSource(this.kind, this.sourceType).find(
        (error4) => normalizeAppName(error4.name) === appName5,
      ) || null
    );
  }
  ['_clearPendingOverwrite']({ keepMenuOpen: keepMenuOpen = false, render: render = true } = {}) {
    ((this.pendingOverwriteSavedAppId = ''), (this.pendingOverwriteIntent = ''));
    if (keepMenuOpen) this.previewAppMenuOpen = true;
    render &&
      (this._patchPreviewAppChrome(), this._patchSaveConfigMenu(), this._patchCreateConfigMenu());
  }
  ['_showOverwriteConfirm'](value260, value261 = 'save') {
    const enabled18 = String(value260 || '').trim();
    if (!enabled18) return false;
    return (
      (this.pendingOverwriteSavedAppId = enabled18),
      (this.pendingOverwriteIntent = value261 === 'create' ? 'create' : 'save'),
      (this.pendingDeleteSavedAppId = ''),
      (this.previewAppMenuOpen = false),
      this._patchPreviewAppChrome(),
      this._patchSaveConfigMenu(),
      this._patchCreateConfigMenu(),
      true
    );
  }
  ['_getConfigRepositorySnapshot']() {
    return {
      savedApps: this.savedApps,
      sourceType: this.sourceType,
      kind: this.kind,
      kindStates: this.kindStates,
    };
  }
  ['_persistSavedApps']() {
    this.configRepository.saveSavedApps(this.savedApps);
  }
  async ['_hydrateExternalStorage']() {
    return await this.configRepository.hydrateExternalStorage({
      hasLocalSeed: this.localStorageSeedHasData,
    });
  }
  ['_applyExternalStoragePayload'](value262) {
    (this.savedApps.forEach((value263) => {
      value263?.bundle && unregisterCustomAiAppBundle(value263.bundle, this.registeredBundleKeys);
    }),
      (this.savedApps = Array.isArray(value262?.savedApps) ? value262.savedApps : []),
      this._registerSavedAppBundles(),
      this._registerBundlesFromNodes());
    value262?.panelDraft &&
      ((this.sourceType = value262.panelDraft.sourceType || ''),
      (this.kind = value262.panelDraft.kind),
      (this.kindStates = value262.panelDraft.kindStates));
    (this._dropUnauthorizedRunningHubAiAppSource(),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this._syncSourceView());
    if (this.sourceType) this._restoreKindState(this.kind);
    else this._patchPreviewAppChrome();
  }
  ['_buildBundleForSavedApp'](components2) {
    const sourceType6 =
      normalizeSourceType(components2.sourceType || this.sourceType) || SOURCE_TYPES.runninghub;
    if (isRunningHubSource(sourceType6))
      assertRunningHubDefinitionProfile(
        components2.input,
        components2.runningHubProfileId || this.runningHubProfileId,
      );
    if (sourceType6 === SOURCE_TYPES.runninghubWorkflow)
      return buildRunningHubWorkflowManifestBundle({
        ...components2,
        components: components2.componentDrafts,
        displayName: components2.name,
        appKey: components2.id,
      });
    if (isComfyUiSource(sourceType6))
      return buildComfyUiWorkflowManifestBundle({
        input: components2.input,
        kind: components2.kind,
        components: components2.componentDrafts,
        displayName: components2.name,
        description: components2.description,
        promptHelpTooltip: normalizePromptHelpTooltip(components2.promptHelpTooltip),
        appKey: components2.id,
        baseUrlMode: getComfyUiBaseUrlMode(sourceType6),
        componentSelectionMode: 'manual',
      });
    return buildRunningHubAiAppManifestBundle({
      input: components2.input,
      appId: this._getAppIdText(),
      kind: components2.kind,
      components: components2.componentDrafts,
      displayName: components2.name,
      description: components2.description,
      promptHelpTooltip: normalizePromptHelpTooltip(components2.promptHelpTooltip),
      appKey: components2.id,
    });
  }
  ['_registerSavedAppBundles']() {
    this.savedApps.forEach((value264) => {
      try {
        const value265 = this._buildBundleForSavedApp(value264);
        ((value264.bundle = value265),
          registerCustomAiAppBundle(value265, this.registeredBundleKeys, { replace: true }));
      } catch (value266) {
        console.warn('[RH AI App] register saved app failed:', value266);
      }
    });
  }
  ['_setActionButtonsEnabled'](enabled19) {
    if (!enabled19) this._resetSaveSuccessFeedback();
    if (this.saveBtn) this.saveBtn.disabled = !enabled19 || this.savePending;
    if (this.createBtn) this.createBtn.disabled = !enabled19;
  }
  ['_resetSaveSuccessFeedback']() {
    (window.clearTimeout(this.saveSuccessTimer), (this.saveSuccessTimer = 0));
    if (!this.saveBtn) return;
    (this.saveBtn.classList.remove('is-save-success'),
      (this.saveBtn.textContent = this.saveBtn.dataset.defaultText || '保存模型'));
  }
  ['_flashSaveSuccessFeedback']() {
    if (!this.saveBtn) return;
    const value267 =
      this.saveBtn.dataset.defaultText || this.saveBtn.textContent || '保存模型';
    ((this.saveBtn.dataset.defaultText = value267),
      window.clearTimeout(this.saveSuccessTimer),
      this.saveBtn.classList.add('is-save-success'),
      (this.saveBtn.textContent = '已保存'),
      (this.saveSuccessTimer = window.setTimeout(() => this._resetSaveSuccessFeedback(), 1200)));
  }
  ['_getStateKey'](value268 = this.kind, value269 = this.sourceType) {
    return this.configRepository.getKindStateKey(value269, value268);
  }
  ['_getSourceMeta']() {
    return getSourceMeta(this.sourceType);
  }
  ['_isComfyUiSource']() {
    return isComfyUiSource(this.sourceType);
  }
  ['_isRunningHubAiAppSource'](value270 = this.sourceType) {
    return isRunningHubSource(normalizeSourceType(value270));
  }
  ['_isRunningHubAiAppAuthorized']() {
    const value271 = globalThis.window,
      handler = value271?.isModelAllowedBySubscription;
    if (typeof handler !== 'function') return false;
    return handler(RH_AI_APP_VIP_MODEL_ID, RH_AI_APP_VIP_PROVIDER) === true;
  }
  ['_requestRunningHubAiAppAuthorization'](onSuccess = null) {
    const value272 = globalThis.window;
    if (typeof value272?.openSubscriptionDialog === 'function') {
      value272.openSubscriptionDialog({
        modelId: RH_AI_APP_VIP_MODEL_ID,
        provider: RH_AI_APP_VIP_PROVIDER,
        onSuccess: onSuccess,
      });
      return;
    }
    value272?.showToast?.('需要VIP授权，请先激活CDKEY', 'warn');
  }
  ['_guardRunningHubAiAppAccess'](value273 = null) {
    if (this._isRunningHubAiAppAuthorized()) return true;
    return (this._requestRunningHubAiAppAuthorization(value273), false);
  }
  ['_dropUnauthorizedRunningHubAiAppSource']() {
    if (!this._isRunningHubAiAppSource()) return false;
    if (this._isRunningHubAiAppAuthorized()) return false;
    return ((this.sourceType = ''), true);
  }
  ['_shouldShowManualComponentPicker']() {
    return this._isComfyUiSource() || this.sourceType === SOURCE_TYPES.runninghubWorkflow;
  }
  ['_canRemovePreviewParams']() {
    return this._shouldShowManualComponentPicker();
  }
  ['_canRemovePreviewInputs']() {
    return this._shouldShowManualComponentPicker();
  }
  ['_clearSourceViewAnimation']() {
    (window.clearTimeout(this.sourceViewAnimationTimer),
      (this.sourceViewAnimationTimer = 0),
      this.bodyEl?.classList.remove('is-view-transitioning'),
      this.sourceSelectEl?.classList.remove(
        'is-page-enter-left',
        'is-page-exit-left',
        'is-page-enter-right',
        'is-page-exit-right',
      ),
      this.workbenchEl?.classList.remove(
        'is-page-enter-left',
        'is-page-exit-left',
        'is-page-enter-right',
        'is-page-exit-right',
      ));
  }
  ['_setSourceViewHiddenState'](enabled20) {
    if (this.sourceSelectEl) this.sourceSelectEl.hidden = enabled20;
    if (this.workbenchEl) this.workbenchEl.hidden = !enabled20;
  }
  ['_applySourceViewTransition'](enabled21, enabled22) {
    if (shouldReduceMotion() || !enabled22 || !this.sourceSelectEl || !this.workbenchEl)
      return (this._setSourceViewHiddenState(enabled21), false);
    const enabled23 = enabled22 === 'forward' && enabled21,
      enabled24 = enabled22 === 'back' && !enabled21;
    if (!enabled23 && !enabled24) return (this._setSourceViewHiddenState(enabled21), false);
    return (
      (this.sourceSelectEl.hidden = false),
      (this.workbenchEl.hidden = false),
      this.bodyEl?.classList.add('is-view-transitioning'),
      enabled23
        ? (this.sourceSelectEl.classList.add('is-page-exit-left'),
          this.workbenchEl.classList.add('is-page-enter-right'))
        : (this.sourceSelectEl.classList.add('is-page-enter-left'),
          this.workbenchEl.classList.add('is-page-exit-right')),
      (this.sourceViewAnimationTimer = window.setTimeout(() => {
        (this._clearSourceViewAnimation(), this._setSourceViewHiddenState(enabled21));
      }, SOURCE_PAGE_ANIMATION_MS)),
      true
    );
  }
  ['_syncSourceView']() {
    this.definitionController.sync();
    const enabled25 = Boolean(normalizeSourceType(this.sourceType)),
      value274 = this._getSourceMeta(),
      value275 = this.sourceViewTransitionDirection;
    ((this.sourceViewTransitionDirection = ''),
      this._clearSourceViewAnimation(),
      this._applySourceViewTransition(enabled25, value275));
    if (this.sourceBackBtn) this.sourceBackBtn.hidden = !enabled25;
    const el5 = this.panel?.querySelector?.("[data-role='footer']");
    if (el5) el5.hidden = !enabled25;
    const el6 = this.panel?.querySelector?.("[data-role='panel-title']"),
      el7 = this.panel?.querySelector?.("[data-role='panel-subtitle']"),
      el8 = this.panel?.querySelector?.("[data-role='input-label']");
    if (el6)
      el6.textContent = enabled25
        ? value274?.panelLabel || value274?.label || '自定义AI应用'
        : '自定义AI应用';
    el7 && (el7.textContent = enabled25 ? value274?.subtitle || '' : '选择一种自定义应用来源');
    if (el8 && value274?.inputLabel) el8.textContent = value274.inputLabel;
    (this.workflowInputFieldEl &&
      (this.workflowInputFieldEl.hidden = isRunningHubSource(this.sourceType)),
      this.textarea &&
        value274?.inputPlaceholder &&
        (this.textarea.placeholder = value274.inputPlaceholder),
      this._syncComfyUiRuntimeControl(),
      this._syncRunningHubRuntimeControl(),
      !enabled25 && (this._setActionButtonsEnabled(false), this._setError('')),
      this._syncStickyHeaderShadow());
  }
  ['_syncComfyUiRuntimeControl']() {
    const enabled26 = this._isComfyUiSource();
    if (!this.runtimeToggleEl) return;
    this.runtimeToggleEl.hidden = !enabled26;
    const comfyUiBaseUrlMode = getComfyUiBaseUrlMode(this.sourceType);
    this.runtimeToggleEl.querySelectorAll('[data-comfyui-runtime]').forEach((el9) => {
      const value276 = el9.dataset.comfyuiRuntime === comfyUiBaseUrlMode;
      (el9.classList.toggle('active', value276),
        el9.setAttribute('aria-pressed', value276 ? 'true' : 'false'));
    });
  }
  ['_syncRunningHubRuntimeControl']() {
    const enabled27 = this._isRunningHubAiAppSource();
    if (!this.runningHubRuntimeToggleEl) return;
    this.runningHubRuntimeToggleEl.hidden = !enabled27;
    const runningHubModelApiProfileId = normalizeRunningHubModelApiProfileId(this.runningHubProfileId);
    this.runningHubRuntimeToggleEl.querySelectorAll('[data-runninghub-runtime]').forEach((el10) => {
      const runningHubModelApiProfileId2 =
        normalizeRunningHubModelApiProfileId(el10.dataset.runninghubRuntime) ===
        runningHubModelApiProfileId;
      (el10.classList.toggle('active', runningHubModelApiProfileId2),
        el10.setAttribute('aria-pressed', runningHubModelApiProfileId2 ? 'true' : 'false'));
    });
  }
  ['_syncStickyHeaderShadow']() {
    const value277 =
      Boolean(normalizeSourceType(this.sourceType)) && Number(this.bodyEl?.scrollTop || 0) > 4;
    this.panel?.classList.toggle('has-sticky-kind-shadow', value277);
  }
  ['_selectSourceType'](value278) {
    const sourceType7 = normalizeSourceType(value278);
    if (!sourceType7) return;
    if (
      isRunningHubSource(sourceType7) &&
      !this._guardRunningHubAiAppAccess(() => this._selectSourceType(sourceType7))
    )
      return;
    window.clearTimeout(this.parseTimer);
    if (this.sourceType) this._saveKindState();
    ((this.sourceType = sourceType7),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      (this.sourceViewTransitionDirection = 'forward'),
      this._restoreKindState(this.kind),
      requestAnimationFrame(() => this.textarea?.focus()));
  }
  ['_selectComfyUiRuntime'](value279) {
    this.definitionController.cancel();
    if (!this._isComfyUiSource()) return;
    const comfyUiSourceTypeFromBaseUrlMode = getComfyUiSourceTypeFromBaseUrlMode(value279);
    if (comfyUiSourceTypeFromBaseUrlMode === this.sourceType) {
      this._syncComfyUiRuntimeControl();
      return;
    }
    (window.clearTimeout(this.parseTimer),
      this._saveKindState(),
      (this.sourceType = comfyUiSourceTypeFromBaseUrlMode),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this._syncSourceView());
    if (this._getInputText().trim()) {
      const value280 = this._refreshBundleFromComponents({ renderPreview: false });
      this._patchPreviewWithoutRebuild(value280 || this.currentBundle, {
        renderInputs: true,
        renderParams: true,
        renderAdvanced: true,
        renderPrompt: true,
        renderAppChrome: true,
        renderActionControls: true,
      });
      return;
    }
    (this._patchPreviewAppChrome(), this._saveKindState());
  }
  ['_selectRunningHubRuntime'](value281) {
    this.definitionController.cancel();
    if (!this._isRunningHubAiAppSource()) return;
    const runningHubModelApiProfileId3 = normalizeRunningHubModelApiProfileId(value281);
    if (runningHubModelApiProfileId3 === this.runningHubProfileId) {
      this._syncRunningHubRuntimeControl();
      return;
    }
    (window.clearTimeout(this.parseTimer),
      (this.runningHubProfileId = runningHubModelApiProfileId3),
      this._syncRunningHubRuntimeControl());
    if (this._getInputText().trim()) this._refreshBundleFromComponents({ renderPreview: false });
    (this._saveKindState(), this._patchPreviewAppChrome());
  }
  ['_showSourceSelect']() {
    (this.definitionController.cancel(), window.clearTimeout(this.parseTimer));
    if (this.sourceType) this._saveKindState();
    ((this.sourceType = ''),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this._closeComponentSelectMenus(),
      (this.sourceViewTransitionDirection = 'back'),
      this._syncSourceView(),
      this._persistPanelDraft());
  }
  ['_openSourceSelect']() {
    (this.definitionController.cancel(), window.clearTimeout(this.parseTimer));
    const enabled28 = this._isOpen();
    if (this.sourceType) this._saveKindState();
    ((this.sourceType = ''),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this._closeComponentSelectMenus(),
      (this.sourceViewTransitionDirection = enabled28 ? 'back' : ''),
      this._syncSourceView(),
      this._persistPanelDraft());
    if (!enabled28) this._open();
  }
  ['_toggleSourceSelect']() {
    if (this._isOpen()) {
      this._close();
      return;
    }
    this._openSourceSelect();
  }
  ['_isOpen']() {
    return this.panel?.classList.contains('is-open') === true;
  }
  ['_open']() {
    (this.previewDragController.bindGroups(),
      closeAllSidebarSubmenus(),
      this._dropUnauthorizedRunningHubAiAppSource(),
      this._syncSourceView());
    if (this.sourceType) this._restoreKindState(this.kind);
    (this.panel?.classList.add('is-open'),
      this.panel?.setAttribute('aria-hidden', 'false'),
      document.body?.classList?.add('rh-ai-app-panel-open'),
      this.button?.classList.add('active'),
      this.button?.setAttribute('aria-expanded', 'true'),
      requestAnimationFrame(() => this._syncStickyHeaderShadow()));
    if (this.sourceType) requestAnimationFrame(() => this.textarea?.focus());
  }
  ['_close']() {
    (this.previewDragController.destroy(),
      this.definitionController.cancel(),
      window.clearTimeout(this.parseTimer),
      this._resetSaveSuccessFeedback(),
      this._saveKindState(),
      this._clearSourceViewAnimation(),
      this._closeComponentSelectMenus(),
      this.contextMenuController.close(),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this.panel?.classList.remove('is-open'),
      this.panel?.classList.remove('has-sticky-kind-shadow'),
      this.panel?.setAttribute('aria-hidden', 'true'),
      document.body?.classList?.remove('rh-ai-app-panel-open'),
      this.button?.classList.remove('active'),
      this.button?.setAttribute('aria-expanded', 'false'));
  }
  ['_toggle']() {
    if (this._isOpen()) this._close();
    else this._open();
  }
  ['_handlePanelClick'](event6) {
    const el11 = event6.target?.closest?.('[data-action]');
    if (el11 && this.panel?.contains(el11)) {
      const value282 = el11.dataset.action || '';
      if (value282 === 'close') {
        this._close();
        return;
      }
      if (value282 === 'select-source-type') {
        this._selectSourceType(el11.dataset.sourceType);
        return;
      }
      if (value282 === 'back-to-source-types') {
        this._showSourceSelect();
        return;
      }
      if (value282 === 'select-comfyui-runtime') {
        this._selectComfyUiRuntime(el11.dataset.comfyuiRuntime);
        return;
      }
      if (value282 === 'select-runninghub-runtime') {
        this._selectRunningHubRuntime(el11.dataset.runninghubRuntime);
        return;
      }
      if (value282 === 'toggle-workflow-input') {
        this._toggleWorkflowInputCollapsed();
        return;
      }
      if (value282 === 'parse') {
        this._parseNow();
        return;
      }
      if (value282 === 'save-config') {
        (this._closeComponentSelectMenus(), this._saveConfigFromCurrentInput());
        return;
      }
      if (value282 === 'create') {
        (this._closeComponentSelectMenus(), void this._createNodeFromCurrentInput());
        return;
      }
      if (value282 === 'toggle-component-select') {
        this._toggleComponentSelect(el11);
        return;
      }
      if (value282 === 'choose-component-select') {
        this._chooseComponentSelect(el11);
        return;
      }
      if (value282 === 'choose-preview-control-type') {
        this._choosePreviewControlType(el11);
        return;
      }
      if (value282 === 'confirm-preview-rename') {
        (event6.preventDefault(), event6.stopPropagation());
        const value283 = el11.closest?.('.rh-ai-app-preview-rename-target')?.querySelector?.(
          "[data-role='preview-rename-input']",
        );
        this._commitPreviewInlineRename(value283);
        return;
      }
      if (value282 === 'rename-preview-param') {
        (event6.preventDefault(),
          event6.stopPropagation(),
          this._renamePreviewParamFromTypebar(el11));
        return;
      }
      if (value282 === 'edit-preview-description') {
        (event6.preventDefault(),
          event6.stopPropagation(),
          this._editPreviewDescriptionFromTypebar(el11));
        return;
      }
      if (value282 === 'toggle-preview-param-default') {
        (event6.preventDefault(), event6.stopPropagation(), this._togglePreviewParamDefault(el11));
        return;
      }
      if (value282 === 'remove-preview-param') {
        (event6.preventDefault(), event6.stopPropagation(), this._removePreviewParam(el11));
        return;
      }
      if (value282 === 'remove-preview-input') {
        (event6.preventDefault(), event6.stopPropagation(), this._removePreviewInput(el11));
        return;
      }
      if (value282 === 'toggle-comfy-candidate-select') {
        this._toggleComfyCandidateMenu();
        return;
      }
      if (value282 === 'choose-comfy-candidate') {
        this._chooseComfyCandidate(el11);
        return;
      }
      if (value282 === 'toggle-app-menu') {
        this._closeComponentSelectMenus();
        if (Number(event6.detail || 0) > 1) return;
        ((this.previewAppMenuOpen = !this.previewAppMenuOpen),
          (this.pendingDeleteSavedAppId = ''),
          (this.pendingOverwriteSavedAppId = ''),
          (this.pendingOverwriteIntent = ''),
          this._patchPreviewAppChrome());
        return;
      }
      if (value282 === 'load-saved-app') {
        (this._closeComponentSelectMenus(), this._loadSavedApp(el11.dataset.savedAppId));
        return;
      }
      if (value282 === 'rename-current-app') {
        (this._closeComponentSelectMenus(),
          (this.previewAppMenuOpen = false),
          (this.pendingDeleteSavedAppId = ''),
          (this.pendingOverwriteSavedAppId = ''),
          (this.pendingOverwriteIntent = ''),
          this._patchPreviewAppChrome(),
          this._focusAppNameInput());
        return;
      }
      if (value282 === 'request-delete-app') {
        (this._closeComponentSelectMenus(),
          (this.pendingDeleteSavedAppId = String(el11.dataset.savedAppId || '')),
          (this.pendingOverwriteSavedAppId = ''),
          (this.pendingOverwriteIntent = ''),
          (this.previewAppMenuOpen = true),
          this._patchPreviewAppChrome());
        return;
      }
      if (value282 === 'confirm-delete-app') {
        (this._closeComponentSelectMenus(), this._deleteSavedApp(el11.dataset.savedAppId));
        return;
      }
      if (value282 === 'cancel-delete-app') {
        (this._closeComponentSelectMenus(),
          (this.pendingDeleteSavedAppId = ''),
          (this.previewAppMenuOpen = true),
          this._patchPreviewAppChrome());
        return;
      }
      if (value282 === 'confirm-overwrite-app') {
        (this._closeComponentSelectMenus(),
          void this._confirmOverwriteSavedApp(el11.dataset.savedAppId));
        return;
      }
      if (value282 === 'cancel-overwrite-app') {
        this._closeComponentSelectMenus();
        const enabled29 = Boolean(
          el11.closest?.("[data-role='save-config-menu'], [data-role='create-config-menu']"),
        );
        this._clearPendingOverwrite({ keepMenuOpen: !enabled29 });
        return;
      }
    }
    const el12 = event6.target?.closest?.('.rh-ai-app-preview-description-target');
    if (el12 && this.panel?.contains(el12)) {
      const value284 = Number(el12.dataset.previewComponentIndex),
        value285 = el12.classList.contains('rh-ai-app-preview-prompt-help-tip');
      if (Number.isInteger(value284) || value285) {
        (event6.preventDefault(),
          event6.stopPropagation(),
          this._startPreviewInlineDescriptionEdit(el12, value284));
        return;
      }
    }
    if (this._isPreviewControlTarget(event6.target)) return;
    if (this.previewDragController.consumeSuppressedRenameClickForTarget(event6)) return;
    const el13 = event6.target?.closest?.('.rh-ai-app-preview-rename-target');
    if (el13 && this.panel?.contains(el13)) {
      const value286 = Number(el13.dataset.previewComponentIndex);
      if (Number.isInteger(value286)) {
        (event6.preventDefault(),
          event6.stopPropagation(),
          this._startPreviewInlineRename(el13, value286));
        return;
      }
    }
    const el14 = event6.target?.closest?.('.rh-ai-app-kind-tabs [data-kind]');
    if (!el14 || !this.panel?.contains(el14)) {
      const enabled30 = event6.target?.closest?.("[data-role='saved-app-menu']"),
        enabled31 = event6.target?.closest?.(
          "[data-role='save-config-menu'], [data-action='save-config']",
        ),
        enabled32 = event6.target?.closest?.(
          "[data-role='create-config-menu'], [data-action='create']",
        ),
        enabled33 = event6.target?.closest?.('.rh-ai-app-preview-model-trigger'),
        enabled34 = event6.target?.closest?.('[data-component-select]'),
        enabled35 = event6.target?.closest?.(
          ".rh-ai-app-comfy-add-panel, [data-role='comfyui-candidate-menu']",
        );
      !enabled34 && !enabled35 && this._closeComponentSelectMenus();
      !enabled30 &&
        !enabled33 &&
        this.previewAppMenuOpen &&
        ((this.previewAppMenuOpen = false),
        (this.pendingDeleteSavedAppId = ''),
        (this.pendingOverwriteSavedAppId = ''),
        (this.pendingOverwriteIntent = ''),
        this._patchPreviewAppChrome());
      !enabled31 &&
        this.pendingOverwriteIntent === 'save' &&
        this.pendingOverwriteSavedAppId &&
        this._clearPendingOverwrite();
      !enabled32 &&
        this.pendingOverwriteIntent === 'create' &&
        this.pendingOverwriteSavedAppId &&
        this._clearPendingOverwrite();
      return;
    }
    const value287 = el14.dataset.kind;
    value287 && (this._closeComponentSelectMenus(), this._setKind(value287));
  }
  ['_handlePanelDoubleClick'](event7) {
    const value288 = event7.target?.closest?.('.rh-ai-app-preview-model-trigger');
    if (value288 && this.panel?.contains(value288)) {
      (event7.preventDefault(),
        event7.stopPropagation(),
        (this.previewAppMenuOpen = false),
        (this.pendingDeleteSavedAppId = ''),
        (this.pendingOverwriteSavedAppId = ''),
        (this.pendingOverwriteIntent = ''),
        this._patchPreviewAppChrome(),
        this._focusAppNameInput());
      return;
    }
    if (this._isPreviewControlTarget(event7.target) || this._isPreviewRenameTarget(event7.target))
      return;
    const el15 = event7.target?.closest?.('.rh-ai-app-preview-rename-target');
    if (!el15 || !this.panel?.contains(el15)) return;
    const el16 = el15.closest?.('[data-preview-component-index]'),
      value289 = Number(
        el16?.dataset?.previewComponentIndex || el15.dataset?.previewComponentIndex,
      );
    if (!Number.isInteger(value289)) return;
    (event7.preventDefault(),
      event7.stopPropagation(),
      this._startPreviewInlineRename(el15, value289));
  }
  ['_syncKindTabs']() {
    const kind5 = normalizeKind(this.kind);
    (this.kindTabsEl?.classList.toggle('is-kind-image', kind5 === 'image'),
      this.kindTabsEl?.classList.toggle('is-kind-video', kind5 === 'video'),
      this.kindTabsEl?.classList.toggle('is-kind-audio', kind5 === 'audio'),
      this.panel?.querySelectorAll('.rh-ai-app-kind-tabs button').forEach((el17) => {
        const value290 = el17.dataset.kind === kind5;
        (el17.classList.toggle('active', value290),
          el17.setAttribute('aria-pressed', value290 ? 'true' : 'false'));
      }));
  }
  ['_setKind'](value291) {
    const kind6 = normalizeKind(value291);
    if (kind6 === this.kind) return;
    (window.clearTimeout(this.parseTimer),
      this._saveKindState(),
      (this.kind = kind6),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this._syncKindTabs(),
      this._restoreKindState(kind6));
  }
  ['_saveKindState'](value292 = this.kind) {
    if (!this.sourceType) {
      this._persistPanelDraft();
      return;
    }
    const kind7 = normalizeKind(value292);
    ((this.kindStates[this._getStateKey(kind7)] = {
      sourceType: this.sourceType,
      input: this._getInputText(),
      definitionReference: this.definitionReference,
      appName: this.appName,
      appDescription: this.appDescription,
      promptHelpTooltip: this.promptHelpTooltip,
      runningHubProfileId: this.runningHubProfileId,
      savedAppId: this.savedAppId,
      componentDraftKey: this.componentDraftKey,
      componentDrafts: cloneComponentDrafts(this.componentDrafts),
      componentCandidates: cloneComponentDrafts(this.componentCandidates),
      currentBundle: this.currentBundle,
      errorMessage: this.errorMessage || '',
    }),
      this._persistPanelDraft());
  }
  ['_persistPanelDraft']() {
    this.configRepository.savePanelDraft({
      sourceType: this.sourceType,
      kind: this.kind,
      kindStates: this.kindStates,
    });
  }
  ['_restoreKindState'](value293 = this.kind) {
    this.definitionController.cancel();
    if (!this.sourceType) {
      this._syncSourceView();
      return;
    }
    const kind8 = normalizeKind(value293),
      value294 = this._getStateKey(kind8),
      isComfyUiSource3 = isComfyUiSource(this.sourceType)
        ? this.configRepository.getLegacyKindStateKey(this.sourceType, kind8)
        : '',
      value295 = this.sourceType === SOURCE_TYPES.runninghub ? this.kindStates[kind8] : null,
      value296 =
        this.kindStates[value294] ||
        (isComfyUiSource3 ? this.kindStates[isComfyUiSource3] : null) ||
        value295 ||
        this.configRepository.createEmptyKindState();
    ((this.kindStates[value294] = value296), (this.kind = kind8));
    if (isRunningHubSource(this.sourceType) && isRunningHubSource(value296.sourceType))
      this.sourceType = value296.sourceType;
    ((this.definitionReference = value296.definitionReference || ''),
      this._syncSourceView(),
      this._syncKindTabs());
    if (this.textarea) this.textarea.value = value296.input || '';
    ((this.appName = value296.appName || DEFAULT_AI_APP_NAME),
      (this.appDescription = normalizeAppDescription(value296.appDescription)),
      (this.promptHelpTooltip = normalizePromptHelpTooltip(value296.promptHelpTooltip)),
      (this.runningHubProfileId = normalizeRunningHubModelApiProfileId(
        value296.runningHubProfileId || getDefaultRunningHubProfileId(),
      )),
      this._syncRunningHubRuntimeControl(),
      (this.savedAppId = value296.savedAppId || ''),
      (this.componentDraftKey = value296.componentDraftKey || ''),
      (this.componentDrafts = cloneComponentDrafts(value296.componentDrafts)),
      (this.componentCandidates = cloneComponentDrafts(value296.componentCandidates)),
      (this.currentBundle = value296.currentBundle || null));
    let value297 = value296.errorMessage || '';
    if (!this.currentBundle && this._getInputText().trim())
      try {
        ((this.currentBundle = this._buildCurrentBundle({
          syncComponents: this.componentDrafts.length === 0,
        })),
          (value297 = ''));
      } catch (error5) {
        ((this.currentBundle = null), (value297 = value297 || error5?.message || '解析失败'));
      }
    (this._renderComponentConfig(),
      this._patchPreviewWithoutRebuild(this.currentBundle, {
        renderInputs: true,
        renderParams: true,
        renderAdvanced: true,
        renderPrompt: true,
        renderAppChrome: true,
        renderActionControls: true,
      }),
      this._setSummary(this.currentBundle),
      this._setError(value297),
      this._setActionButtonsEnabled(!!this.currentBundle),
      this._saveKindState(kind8));
  }
  ['_focusAppNameInput']() {
    const el18 = this.componentListEl?.querySelector?.("[data-app-prop='appName']");
    if (!el18) return;
    (el18.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }), el18.focus(), el18.select?.());
  }
  ['_startPreviewInlineRename'](el19, value298) {
    const value299 = Number(value298);
    if (!Number.isInteger(value299)) return;
    const el20 = el19?.closest?.('.rh-ai-app-preview-rename-target');
    if (!el20 || !this.nodePreviewEl?.contains?.(el20)) return;
    if (el20.querySelector?.("[data-role='preview-rename-input']")) return;
    const componentByIndex2 = getComponentByIndex(this.componentDrafts, value299);
    if (!componentByIndex2) return;
    const el21 = el20.closest?.('.rh-ai-app-preview-input-slot'),
      value300 =
        String(componentByIndex2.label || componentByIndex2.fieldName || '组件').trim() || '组件',
      value301 = el21 && isMediaComponent(componentByIndex2) ? normalizeInputSlotLabel(value300) : value300,
      value302 = el21 ? ' maxlength="' + INPUT_SLOT_LABEL_INPUT_MAX_LENGTH + '"' : '';
    (el21?.classList?.add('is-inline-editing'), el20.classList.add('is-renaming'));
    const value303 =
      '<input type="text" class="rh-ai-app-preview-rename-input" data-role="preview-rename-input" data-preview-component-index="' +
      value299 +
      '" data-original-label="' +
      escapeHtml(value301) +
      '" value="' +
      escapeHtml(value301) +
      '" aria-label="组件名"' +
      value302 +
      '>';
    el20.innerHTML = el21
      ? '<span class="rh-ai-app-preview-slot-rename-shell">' +
        value303 +
        '<button type="button" class="rh-ai-app-preview-rename-confirm" data-action="confirm-preview-rename" data-preview-component-index="' +
        value299 +
        '" aria-label="确认重命名">&#10003;</button></span>'
      : value303;
    const el22 = el20.querySelector("[data-role='preview-rename-input']");
    if (!el22) return;
    const run = () => {
      (el22.focus(), el22.select?.());
    };
    typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(run) : run();
  }
  ['_restorePreviewInlineRename'](el23) {
    const value304 = Number(el23?.dataset?.previewComponentIndex);
    if (!Number.isInteger(value304)) return;
    const el24 = el23.closest?.('.rh-ai-app-preview-rename-target'),
      componentByIndex3 = getComponentByIndex(this.componentDrafts, value304);
    if (!el24 || !componentByIndex3) return;
    const value305 =
        String(
          componentByIndex3.label ||
            componentByIndex3.fieldName ||
            el23.dataset.originalLabel ||
            '组件',
        ).trim() || '组件',
      isMediaComponent3 = isMediaComponent(componentByIndex3) ? normalizeInputSlotLabel(value305) : value305;
    (el24.closest?.('.rh-ai-app-preview-input-slot')?.classList?.remove('is-inline-editing'),
      el24.classList.remove('is-renaming'),
      el24.classList.toggle(
        'rh-ai-app-preview-input-label--latin',
        isMediaComponent(componentByIndex3) && INPUT_SLOT_LABEL_LATIN_RE.test(isMediaComponent3),
      ),
      (el24.textContent = isMediaComponent3));
  }
  ['_commitPreviewInlineRename'](el25, { cancel: cancel = false } = {}) {
    if (!el25 || el25.dataset.committing === 'true') return;
    el25.dataset.committing = 'true';
    const value306 = Number(el25.dataset.previewComponentIndex);
    if (!Number.isInteger(value306)) return;
    const value307 = String(el25.dataset.originalLabel || '').trim(),
      componentByIndex4 = getComponentByIndex(this.componentDrafts, value306),
      enabled36 =
        componentByIndex4 && isMediaComponent(componentByIndex4)
          ? normalizeInputSlotLabel(el25.value, '')
          : String(el25.value || '').trim();
    if (componentByIndex4 && isMediaComponent(componentByIndex4) && el25.value !== enabled36)
      el25.value = enabled36;
    if (cancel || !enabled36 || enabled36 === value307) {
      this._restorePreviewInlineRename(el25);
      return;
    }
    this._updateComponentDraft(value306, 'label', enabled36);
  }
  ['_startPreviewInlineDescriptionEdit'](el26, value308 = NaN) {
    const value309 = Number(value308),
      el27 = el26?.closest?.('.rh-ai-app-preview-description-target');
    if (!el27 || !this.nodePreviewEl?.contains?.(el27)) return;
    const enabled37 = el27.classList.contains('rh-ai-app-preview-prompt-help-tip');
    if (!Number.isInteger(value309) && !enabled37) return;
    const value310 = this.nodePreviewEl?.querySelector?.(
      '[data-role=\'preview-description-input\']',
    );
    if (value310) this._commitPreviewInlineDescriptionEdit(value310);
    const enabled38 = Number.isInteger(value309)
      ? getComponentByIndex(this.componentDrafts, value309)
      : null;
    if (Number.isInteger(value309) && !enabled38) return;
    const value311 = Boolean(
        el27.closest?.('.rh-ai-app-preview-advanced-param') ||
        el27.classList.contains('rh-ai-app-preview-param-description-tip'),
      ),
      value312 = enabled37 ? '提示词说明' : '参数说明',
      value313 = enabled37
        ? String(el27.getAttribute('data-tooltip') || getPreviewComponentDescription(enabled38, value312)).trim() || value312
        : getPreviewComponentDescription(enabled38, value312),
      el28 = document.createElement('input');
    ((el28.type = 'text'),
      (el28.className = [
        'rh-ai-app-preview-description-input',
        enabled37 ? 'rh-ai-app-preview-description-input--prompt' : '',
        value311 ? 'rh-ai-app-preview-description-input--param' : '',
      ]
        .filter(Boolean)
        .join(' ')),
      (el28.dataset.role = 'preview-description-input'));
    Number.isInteger(value309) && (el28.dataset.previewComponentIndex = String(value309));
    enabled37 && (el28.dataset.previewDescriptionScope = 'prompt-help');
    ((el28.dataset.originalDescription = value313),
      (el28.value = value313),
      (el28.placeholder = value312),
      el28.setAttribute('aria-label', value312),
      el27.replaceWith(el28));
    const run2 = () => {
      (el28.focus(), el28.select?.());
    };
    typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(run2) : run2();
  }
  ['_restorePreviewInlineDescriptionEdit']() {
    const value314 = this._refreshBundleFromComponents({ renderPreview: false });
    this._patchPreviewWithoutRebuild(value314, {
      renderParams: true,
      renderAdvanced: true,
      renderPrompt: true,
    });
  }
  ['_commitPreviewInlineDescriptionEdit'](el29, { cancel: cancel = false } = {}) {
    if (!el29 || el29.dataset.committing === 'true') return;
    el29.dataset.committing = 'true';
    const value315 = Number(el29.dataset.previewComponentIndex),
      enabled39 = el29.dataset.previewDescriptionScope === 'prompt-help';
    if (!Number.isInteger(value315) && !enabled39) return;
    const value316 = String(el29.dataset.originalDescription || '').trim(),
      enabled40 = String(el29.value || '').trim();
    if (cancel || !enabled40 || enabled40 === value316) {
      this._restorePreviewInlineDescriptionEdit();
      return;
    }
    if (!Number.isInteger(value315) && enabled39) {
      this._updatePromptHelpTooltip(enabled40);
      return;
    }
    this._updateComponentDraft(value315, 'description', enabled40);
  }
  ['_handlePanelKeyDown'](event8) {
    const el30 = event8.target?.closest?.('.rh-ai-app-preview-description-target');
    if (el30 && this.panel?.contains(el30)) {
      if (event8.key === 'Enter' || event8.key === ' ') {
        const value317 = Number(el30.dataset.previewComponentIndex),
          value318 = el30.classList.contains('rh-ai-app-preview-prompt-help-tip');
        (Number.isInteger(value317) || value318) &&
          (event8.preventDefault(),
          event8.stopPropagation(),
          this._startPreviewInlineDescriptionEdit(el30, value317));
      }
      return;
    }
    const value319 = event8.target?.closest?.("[data-role='preview-description-input']");
    if (value319 && this.panel?.contains(value319)) {
      if (event8.key === 'Enter') {
        (event8.preventDefault(),
          event8.stopPropagation(),
          this._commitPreviewInlineDescriptionEdit(value319));
        return;
      }
      event8.key === 'Escape' &&
        (event8.preventDefault(),
        event8.stopPropagation(),
        this._commitPreviewInlineDescriptionEdit(value319, { cancel: true }));
      return;
    }
    const enabled41 = event8.target?.closest?.("[data-role='preview-rename-input']");
    if (!enabled41 || !this.panel?.contains(enabled41)) return;
    if (event8.key === 'Enter') {
      (event8.preventDefault(),
        event8.stopPropagation(),
        this._commitPreviewInlineRename(enabled41));
      return;
    }
    event8.key === 'Escape' &&
      (event8.preventDefault(),
      event8.stopPropagation(),
      this._commitPreviewInlineRename(enabled41, { cancel: true }));
  }
  ['_handlePanelFocusOut'](event9) {
    const value320 = event9.target?.closest?.("[data-role='preview-description-input']");
    if (value320 && this.panel?.contains(value320)) {
      this._commitPreviewInlineDescriptionEdit(value320);
      return;
    }
    const enabled42 = event9.target?.closest?.('[data-role=\'preview-rename-input\']');
    if (!enabled42 || !this.panel?.contains(enabled42)) return;
    const value321 = event9.relatedTarget?.closest?.("[data-action='confirm-preview-rename']");
    if (value321 && this.panel?.contains(value321)) return;
    this._commitPreviewInlineRename(enabled42);
  }
  ['_closeComponentSelectMenus'](value322 = null, { preserveComfyPicker: preserveComfyPicker = false } = {}) {
    this.componentListEl?.querySelectorAll?.('[data-component-select].is-open').forEach((el31) => {
      if (value322 && el31 === value322) return;
      (el31.classList.remove('is-open'),
        el31.querySelector('.rh-ai-app-select-trigger')?.setAttribute('aria-expanded', 'false'));
    });
    if (preserveComfyPicker) return;
    this.comfyCandidatePickerOpen = false;
    if (this.componentPickerEl) {
      ((this.componentPickerEl.hidden = false),
        this.componentPickerEl.setAttribute('aria-hidden', 'true'));
      const el32 = this.componentPickerEl.closest?.('.rh-ai-app-comfy-add-panel');
      el32?.classList?.remove('is-open');
      const el33 = el32?.querySelector?.("[data-action='toggle-comfy-candidate-select']");
      el33?.setAttribute('aria-expanded', 'false');
      if (el33) el33.textContent = '点击添加组件';
    }
  }
  ['_closeInlineMenusBeforeContextMenu']() {
    this._closeComponentSelectMenus();
    if (!this.previewAppMenuOpen) return;
    ((this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''));
    const el34 = this.panel?.querySelector?.('[data-role=\'saved-app-menu\']');
    if (el34) el34.hidden = true;
  }
  ['_toggleComponentSelect'](el35) {
    const el36 = el35?.closest?.('[data-component-select]');
    if (!el36 || !this.panel?.contains(el36)) return;
    const value323 = !el36.classList.contains('is-open');
    (this._closeComponentSelectMenus(el36),
      el36.classList.toggle('is-open', value323),
      el35.setAttribute('aria-expanded', value323 ? 'true' : 'false'),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this._patchPreviewAppChrome());
  }
  ['_chooseComponentSelect'](el37) {
    const el38 = el37?.closest?.('[data-component-index]'),
      value324 = Number(el38?.dataset.componentIndex),
      enabled43 = String(el37?.dataset?.componentProp || '');
    if (!Number.isInteger(value324) || !enabled43) return;
    (this._closeComponentSelectMenus(),
      this._updateComponentDraft(value324, enabled43, el37.dataset.value));
  }
  ['_choosePreviewControlType'](el39) {
    const value325 = Number(el39?.dataset?.previewComponentIndex),
      enabled44 = String(el39?.dataset?.value || '');
    if (!Number.isInteger(value325) || !enabled44) return;
    const componentByIndex5 = getComponentByIndex(this.componentDrafts, value325),
      controlType6 = normalizeControlType(enabled44),
      value326 =
        controlType6 === 'prompt' &&
        componentByIndex5 &&
        normalizeComponentKind(componentByIndex5.componentKind) !== 'prompt',
      preferredPreviewPlacement2 =
        PREVIEW_PARAM_TEXT_TYPE_VALUES.includes(controlType6) &&
        componentByIndex5 &&
        normalizeComponentKind(componentByIndex5.componentKind) === 'prompt',
      animatePreviewMoveFromRect2 =
        value326 || preferredPreviewPlacement2
          ? this.previewDragController.captureComponentRect(value325)
          : null;
    (this._closeComponentSelectMenus(),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''));
    const controlType7 = normalizeControlType(enabled44) === 'prompt' ? 'componentKind' : 'controlType';
    this._updateComponentDraft(value325, controlType7, enabled44, {
      animatePreviewMoveFromRect: animatePreviewMoveFromRect2,
      preferredPreviewPlacement: preferredPreviewPlacement2 ? 'advanced' : '',
    });
  }
  ['_setError'](value327) {
    const enabled45 = String(value327 || '').trim();
    this.errorMessage = enabled45;
    if (!this.errorEl) return;
    ((this.errorEl.hidden = !enabled45), (this.errorEl.textContent = enabled45));
  }
  ['_setSummary'](value328) {
    if (!this.summaryEl) return;
    this.summaryEl.hidden = Boolean(value328);
    const args4 = value328
      ? this._isComfyUiSource()
        ? summarizeComfyUiWorkflowBundle(value328)
        : summarizeRunningHubAiAppBundle(value328)
      : null;
    ((this.summaryEl.innerHTML = renderSummaryHtml(
      args4 && {
        ...args4,
        resourceIdLabel: this.sourceType === SOURCE_TYPES.runninghubWorkflow ? '工作流 ID' : 'App ID',
      },
      this._getSourceMeta()?.emptyText,
    )),
      this._syncWorkflowInputCollapsed());
  }
  ['_getWorkflowInputSummaryText'](enabled46 = this.currentBundle) {
    if (!enabled46) return '';
    const enabled47 = this._isComfyUiSource()
      ? summarizeComfyUiWorkflowBundle(enabled46)
      : summarizeRunningHubAiAppBundle(enabled46);
    if (!enabled47?.modelId) return '';
    const value329 = this._getSourceMeta()?.label || '工作流',
      value330 = OUTPUT_KIND_LABELS[enabled47.kind] || enabled47.kind,
      value331 = Number(enabled47.slotCount ?? enabled47.slots?.length ?? 0),
      value332 = Number(enabled47.paramCount ?? enabled47.params?.length ?? 0);
    return value329 + ' · ' + value330 + ' · ' + value331 + ' 个入参 · ' + value332 + ' 个参数';
  }
  ['_syncWorkflowInputCollapsed']() {
    const enabled48 = Boolean(this.currentBundle);
    if (!enabled48) this.workflowInputCollapsed = false;
    this.workflowInputFieldEl?.classList?.toggle(
      'is-collapsed',
      enabled48 && this.workflowInputCollapsed,
    );
    if (this.workflowInputToggleBtn) {
      this.workflowInputToggleBtn.hidden = !enabled48;
      const value333 = this.workflowInputCollapsed ? '展开 JSON' : '收起 JSON';
      (this.workflowInputToggleBtn.setAttribute('aria-label', value333),
        (this.workflowInputToggleBtn.title = value333),
        this.workflowInputToggleBtn.setAttribute(
          'aria-expanded',
          this.workflowInputCollapsed ? 'false' : 'true',
        ));
    }
    if (this.workflowInputSummaryEl) {
      const list35 = this._getWorkflowInputSummaryText(),
        enabled49 = Boolean(list35),
        value334 =
          enabled48 && enabled49 && (this.workflowInputCollapsed || this._isRunningHubAiAppSource());
      ((this.workflowInputSummaryEl.hidden = !enabled49),
        this.workflowInputSummaryEl.classList?.toggle('is-visible', value334),
        this.workflowInputSummaryEl.setAttribute('aria-hidden', value334 ? 'false' : 'true'));
      if (enabled49) {
        this.workflowInputSummaryEl.textContent = list35;
        if (this._isRunningHubAiAppSource()) {
          const list36 = this._getSourceMeta().label;
          this.workflowInputSummaryEl.innerHTML =
            '<span class="rh-ai-app-resource-type" data-role="runninghub-resource-type">' +
            escapeHtml(list36) +
            '</span>' +
            escapeHtml(list35.slice(list36.length));
        }
      }
    }
  }
  ['_toggleWorkflowInputCollapsed']() {
    if (!this.currentBundle) return;
    ((this.workflowInputCollapsed = !this.workflowInputCollapsed),
      this._syncWorkflowInputCollapsed());
  }
  ['_getInputText']() {
    return this.textarea?.value || '';
  }
  ['_getAppIdText']() {
    return '';
  }
  ['_setWorkflowJsonDropActive'](enabled50) {
    if (!enabled50) this.workflowJsonDragDepth = 0;
    this.workflowInputFieldEl?.classList?.toggle('is-json-drag-over', enabled50 === true);
  }
  ['_canAcceptWorkflowJsonDrop'](value335) {
    return Boolean(this.sourceType && hasFileDragPayload(value335));
  }
  ['_handleWorkflowJsonFileDragEnter'](event10) {
    if (!this._canAcceptWorkflowJsonDrop(event10)) return;
    (event10.preventDefault(),
      event10.stopPropagation(),
      (this.workflowJsonDragDepth += 1),
      this._setWorkflowJsonDropActive(true));
    if (event10.dataTransfer) event10.dataTransfer.dropEffect = 'copy';
  }
  ['_handleWorkflowJsonFileDragOver'](event11) {
    if (!this._canAcceptWorkflowJsonDrop(event11)) return;
    (event11.preventDefault(), event11.stopPropagation(), this._setWorkflowJsonDropActive(true));
    if (event11.dataTransfer) event11.dataTransfer.dropEffect = 'copy';
  }
  ['_handleWorkflowJsonFileDragLeave'](event12) {
    if (!this._canAcceptWorkflowJsonDrop(event12)) return;
    (event12.preventDefault(),
      event12.stopPropagation(),
      (this.workflowJsonDragDepth = Math.max(0, this.workflowJsonDragDepth - 1)));
    if (this.workflowJsonDragDepth === 0) this._setWorkflowJsonDropActive(false);
  }
  async ['_handleWorkflowJsonFileDrop'](event13) {
    if (!this._canAcceptWorkflowJsonDrop(event13)) return;
    (event13.preventDefault(), event13.stopPropagation(), this._setWorkflowJsonDropActive(false));
    const [error6] = Array.from(event13.dataTransfer?.files || []);
    if (!error6) return;
    if (!isJsonFile(error6)) {
      const value336 = '请拖入 .json 文件';
      (this._setError(value336), window.showToast?.(value336, 'error'));
      return;
    }
    const enabled51 = this.definitionController.beginFileRead();
    try {
      const value337 = await error6.text();
      if (!enabled51.isCurrent()) return;
      window.clearTimeout(this.parseTimer);
      if (this.textarea) this.textarea.value = String(value337 || '');
      ((this.appName = normalizeDroppedJsonAppName(error6.name)),
        (this.savedAppId = ''),
        (this.workflowInputCollapsed = false),
        (this.previewAppMenuOpen = false),
        (this.pendingDeleteSavedAppId = ''),
        (this.pendingOverwriteSavedAppId = ''),
        (this.pendingOverwriteIntent = ''),
        this._closeComponentSelectMenus());
      const value338 = this._parseNow();
      if (value338) window.showToast?.('JSON 文件已载入', 'success');
    } catch (error7) {
      if (!enabled51.isCurrent()) return;
      const value339 = error7?.message || 'JSON 文件读取失败';
      (this._setError(value339), window.showToast?.(value339, 'error'));
    } finally {
      enabled51.finish();
    }
  }
  ['_getComponentDraftKey'](value340 = this._getInputText(), value341 = this._getAppIdText()) {
    const isComfyUiSource4 = isComfyUiSource(this.sourceType)
      ? COMFYUI_WORKFLOW_STATE_SCOPE
      : String(this.sourceType || '').trim();
    return (
      isComfyUiSource4 + '\n' + String(value341 || '').trim() + '\n' + String(value340 || '').trim()
    );
  }
  ['_syncComponentDrafts']({ force: force = false } = {}) {
    const value342 = this._getInputText(),
      appId = this._getAppIdText(),
      value343 = this._getComponentDraftKey(value342, appId);
    if (
      !force &&
      value343 === this.componentDraftKey &&
      (this.componentDrafts.length || this.componentCandidates.length)
    )
      return;
    if (this._shouldShowManualComponentPicker()) {
      const { components: components3 } =
        this.sourceType === SOURCE_TYPES.runninghubWorkflow
          ? createRunningHubWorkflowComponentDrafts(value342)
          : createComfyUiWorkflowComponentDrafts(value342);
      ((this.componentDraftKey = value343),
        (this.comfyCandidateSearchText = ''),
        (this.comfyCandidatePickerOpen = false),
        (this.componentCandidates = cloneComponentDrafts(components3)),
        (this.componentDrafts = preserveComfyComponentDrafts(this.componentDrafts, components3)),
        this._renderComponentConfig());
      return;
    }
    const { parsed: parsed, components: components4 } = createRunningHubAiAppComponentDrafts(value342, {
      appId: appId,
    });
    (parsed.providerProfileId &&
      ((this.runningHubProfileId = normalizeRunningHubModelApiProfileId(parsed.providerProfileId)),
      this._syncRunningHubRuntimeControl()),
      (this.componentDraftKey = value343),
      (this.componentDrafts = cloneComponentDrafts(components4)),
      (this.componentCandidates = []),
      (this.comfyCandidatePickerOpen = false),
      this._renderComponentConfig());
  }
  ['_renderComponentConfig']() {
    (this.componentListEl &&
      (this.componentListEl.innerHTML = renderComponentConfigHtml(
        this.componentDrafts,
        this.appName,
        this.appDescription,
        {},
      )),
      this.builderEl && (this.builderEl.hidden = false));
  }
  ['_renderComfyCandidatePicker']({ open: open = false, preserveSearchFocus: preserveSearchFocus = false } = {}) {
    if (!this.componentPickerEl) return;
    const enabled52 = this._shouldShowManualComponentPicker() && Boolean(this.componentDraftKey);
    if (!enabled52) {
      ((this.comfyCandidatePickerOpen = false),
        (this.componentPickerEl.hidden = true),
        this.componentPickerEl.setAttribute('aria-hidden', 'true'),
        (this.componentPickerEl.innerHTML = ''));
      return;
    }
    this.comfyCandidatePickerOpen = open === true;
    const value344 = new Set(
      this.componentDrafts
        .map((value345) => Number(value345?.index))
        .filter((value346) => Number.isInteger(value346)),
    );
    ((this.componentPickerEl.innerHTML = renderComfyUiCandidateMenuHtml(
      this.componentCandidates,
      value344,
      this.comfyCandidateSearchText,
    )),
      (this.componentPickerEl.hidden = false),
      this.componentPickerEl.setAttribute('aria-hidden', open === true ? 'false' : 'true'));
    const el40 = this.componentPickerEl.closest?.('.rh-ai-app-comfy-add-panel');
    el40?.classList?.toggle('is-open', open === true);
    const el41 = el40?.querySelector?.('[data-action=\'toggle-comfy-candidate-select\']');
    el41?.setAttribute('aria-expanded', open === true ? 'true' : 'false');
    if (el41) el41.textContent = open === true ? '收起组件' : '点击添加组件';
    if (open && preserveSearchFocus) {
      const el42 = el40?.querySelector('[data-role=\'comfyui-candidate-search\']'),
        value347 = String(this.comfyCandidateSearchText || '').length;
      (el42?.focus?.(), el42?.setSelectionRange?.(value347, value347));
    }
  }
  ['_toggleComfyCandidateMenu']() {
    if (!this._shouldShowManualComponentPicker()) return;
    if (!this.componentDraftKey) {
      ((this.comfyCandidatePickerOpen = false), this._renderComfyCandidatePicker({ open: false }));
      return;
    }
    const open2 = this.comfyCandidatePickerOpen !== true;
    (this._closeComponentSelectMenus(null, { preserveComfyPicker: true }),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''));
    if (open2) this.comfyCandidateSearchText = '';
    ((this.comfyCandidatePickerOpen = open2), this._renderComfyCandidatePicker({ open: open2 }));
  }
  ['_captureComfyCandidateScrollState'](el43 = null) {
    const value348 = el43?.closest?.('.rh-ai-app-candidate-options');
    return {
      panelScrollTop: Number(this.bodyEl?.scrollTop || 0),
      candidateScrollTop: Number(value348?.scrollTop || 0),
    };
  }
  ['_restoreComfyCandidateScrollState'](options7 = {}) {
    this.bodyEl &&
      Number.isFinite(options7.panelScrollTop) &&
      (this.bodyEl.scrollTop = options7.panelScrollTop);
    const value349 = this.componentPickerEl?.querySelector?.('.rh-ai-app-candidate-options');
    (value349 &&
      Number.isFinite(options7.candidateScrollTop) &&
      (value349.scrollTop = options7.candidateScrollTop),
      this._syncStickyHeaderShadow());
  }
  ['_chooseComfyCandidate'](el44) {
    if (!this._shouldShowManualComponentPicker()) return;
    const value350 = Number(el44?.dataset?.componentIndex);
    if (!Number.isInteger(value350)) return;
    const value351 = this.componentDrafts.some((value352) => Number(value352?.index) === value350);
    if (value351) return;
    const args5 = this.componentCandidates.find((value353) => Number(value353?.index) === value350);
    if (!args5) return;
    const value354 = this._captureComfyCandidateScrollState(el44);
    (this.componentDrafts.push({
      ...args5,
      label: getComfyUiCandidateDefaultComponentName(args5),
    }),
      (this.comfyCandidatePickerOpen = true));
    const value355 = this._refreshBundleFromComponents({ renderPreview: false });
    (this._patchPreviewWithoutRebuild(value355, {
      renderInputs: true,
      renderParams: true,
      renderAdvanced: true,
      renderPrompt: true,
      renderAppChrome: true,
      renderActionControls: true,
    }),
      this._renderComfyCandidatePicker({ open: true }),
      this._restoreComfyCandidateScrollState(value354),
      requestAnimationFrame(() => this._restoreComfyCandidateScrollState(value354)));
  }
  ['_renderNodePreview'](value356 = this.currentBundle) {
    return this.previewPresentation._renderNodePreview(value356);
  }
  ['_closePreviewAppMenuElement'](value357) {
    return this.previewPresentation._closePreviewAppMenuElement(value357);
  }
  ['_patchPreviewAppChrome']() {
    return this.previewPresentation._patchPreviewAppChrome();
  }
  ['_patchSaveConfigMenu']() {
    return this.previewPresentation._patchSaveConfigMenu();
  }
  ['_patchCreateConfigMenu']() {
    return this.previewPresentation._patchCreateConfigMenu();
  }
  ['_patchFooterOverwriteMenu'](value358, value359) {
    return this.previewPresentation._patchFooterOverwriteMenu(value358, value359);
  }
  ['_patchPreviewPromptArea']() {
    return this.previewPresentation._patchPreviewPromptArea();
  }
  ['_patchPreviewActionControls'](value360 = this.currentBundle) {
    return this.previewPresentation._patchPreviewActionControls(value360);
  }
  ['_patchPreviewWithoutRebuild'](value361 = this.currentBundle, value362 = {}) {
    return this.previewPresentation._patchPreviewWithoutRebuild(value361, value362);
  }
  ['_renderPreviewMutableZones'](value363 = this.currentBundle, value364 = {}) {
    return this.previewPresentation._renderPreviewMutableZones(value363, value364);
  }
  ['_clearBuilder']() {
    ((this.componentDraftKey = ''),
      (this.componentDrafts = []),
      (this.componentCandidates = []),
      (this.promptHelpTooltip = ''),
      (this.comfyCandidateSearchText = ''),
      (this.comfyCandidatePickerOpen = false),
      (this.workflowInputCollapsed = false),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this.previewPresentation.clearUiSchemaBinding(),
      this._renderComponentConfig(),
      this._renderNodePreview(null),
      this._syncWorkflowInputCollapsed(),
      this._setActionButtonsEnabled(false));
  }
  ['_clearCurrentDraftIdentity']() {
    ((this.savedAppId = ''),
      (this.appName = DEFAULT_AI_APP_NAME),
      (this.appDescription = ''),
      (this.promptHelpTooltip = ''),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''));
  }
  ['_buildCurrentBundle']({ syncComponents: syncComponents = true } = {}) {
    if (this._isRunningHubAiAppSource())
      assertRunningHubDefinitionProfile(this._getInputText(), this.runningHubProfileId);
    if (syncComponents) this.definitionController.syncInputSource();
    if (syncComponents) this._syncComponentDrafts();
    normalizeParameterGroups(this.componentDrafts);
    if (this.sourceType === SOURCE_TYPES.runninghubWorkflow)
      return buildRunningHubWorkflowManifestBundle({
        input: this._getInputText(),
        kind: this.kind,
        components: this.componentDrafts,
        displayName: normalizeAppName(this.appName),
        description: this.appDescription,
        promptHelpTooltip: this.promptHelpTooltip,
        appKey: this.savedAppId,
      });
    if (this._isComfyUiSource())
      return buildComfyUiWorkflowManifestBundle({
        input: this._getInputText(),
        kind: this.kind,
        components: this.componentDrafts,
        displayName: normalizeAppName(this.appName),
        description: normalizeAppDescription(this.appDescription),
        promptHelpTooltip: normalizePromptHelpTooltip(this.promptHelpTooltip),
        appKey: this.savedAppId,
        baseUrlMode: getComfyUiBaseUrlMode(this.sourceType),
        componentSelectionMode: 'manual',
      });
    return buildRunningHubAiAppManifestBundle({
      input: this._getInputText(),
      appId: this._getAppIdText(),
      kind: this.kind,
      components: this.componentDrafts,
      displayName: normalizeAppName(this.appName),
      description: normalizeAppDescription(this.appDescription),
      promptHelpTooltip: normalizePromptHelpTooltip(this.promptHelpTooltip),
      appKey: this.savedAppId,
    });
  }
  ['_refreshBundleFromComponents']({ renderPreview: renderPreview = true } = {}) {
    try {
      const value365 = this._buildCurrentBundle({ syncComponents: false });
      ((this.currentBundle = value365), this._setSummary(value365), this._setError(''));
      if (renderPreview) this._renderNodePreview(value365);
      return (this._setActionButtonsEnabled(true), this._saveKindState(), value365);
    } catch (error8) {
      return (
        (this.currentBundle = null),
        this._setActionButtonsEnabled(false),
        this._setError(error8?.message || '解析失败'),
        this._saveKindState(),
        null
      );
    }
  }
  ['_bindPreviewUiSchemaControls']() {
    return this.previewPresentation._bindPreviewUiSchemaControls();
  }
  ['_commitPreviewUiSchemaValue'](value366, value367) {
    const enabled53 = String(value366 || '').trim();
    if (!enabled53) return buildPreviewUiSchemaNodeData(this.currentBundle);
    const bundleParamFields = getBundleParamFields(this.currentBundle).find(
        (value368) => String(value368?.id || '').trim() === enabled53,
      ),
      customAiAppComponentIndex4 = getCustomAiAppComponentIndex(bundleParamFields),
      enabled54 = Number.isInteger(customAiAppComponentIndex4)
        ? getComponentByIndex(this.componentDrafts, customAiAppComponentIndex4)
        : null;
    if (!enabled54 || !isParamComponent(enabled54))
      return buildPreviewUiSchemaNodeData(this.currentBundle);
    const controlType8 = normalizeControlType(enabled54.controlType);
    if (controlType8 === 'toggle')
      enabled54.defaultValue =
        value367 === true || String(value367).toLowerCase() === 'true' ? 'true' : 'false';
    else {
      if (controlType8 === 'stepper')
        enabled54.defaultValue = String(Math.trunc(Number(value367) || 0));
      else {
        if (controlType8 === 'float') {
          const value369 = Number(value367);
          enabled54.defaultValue = Number.isFinite(value369) ? String(value369) : '0';
        } else enabled54.defaultValue = String(value367 ?? '');
      }
    }
    const value370 = this._refreshBundleFromComponents({ renderPreview: false });
    return buildPreviewUiSchemaNodeData(value370 || this.currentBundle);
  }
  ['_decoratePreviewAdvancedFields'](value371 = this.currentBundle) {
    return this.previewPresentation._decoratePreviewAdvancedFields(value371);
  }
  ['_isPreviewRenameTarget'](el45) {
    return !!el45?.closest?.('.rh-ai-app-preview-rename-target');
  }
  ['_isPreviewControlTarget'](el46) {
    return !!el46?.closest?.(
      "[data-role='preview-rename-input'], " +
        "[data-role='preview-description-input'], " +
        '.rh-ai-app-preview-description-target, ' +
        '.rh-ai-app-preview-param-toggle, ' +
        "[data-action='confirm-preview-rename'], " +
        '.rh-ai-app-preview-param-zone input, ' +
        '.rh-ai-app-preview-param-zone textarea, ' +
        '.rh-ai-app-preview-param-zone select, ' +
        '.rh-ai-app-preview-param-zone button:not(.rh-ai-app-preview-draggable), ' +
        ".rh-ai-app-preview-param-zone [contenteditable='true'], " +
        '.rh-ai-app-preview-param-zone [data-ui-schema-input], ' +
        '.rh-ai-app-preview-param-zone [data-ui-schema-value], ' +
        '.rh-ai-app-preview-param-zone [data-ui-schema-menu-trigger], ' +
        '.rh-ai-app-preview-param-zone .rh-stepper-value, ' +
        '.rh-ai-app-preview-param-zone .rh-stepper-input, ' +
        '.rh-ai-app-preview-param-zone .ui-schema-option, ' +
        '.rh-ai-app-preview-advanced-panel input, ' +
        '.rh-ai-app-preview-advanced-panel textarea, ' +
        '.rh-ai-app-preview-advanced-panel select, ' +
        '.rh-ai-app-preview-advanced-panel button:not(.rh-ai-app-preview-draggable), ' +
        ".rh-ai-app-preview-advanced-panel [contenteditable='true'], " +
        '.rh-ai-app-preview-advanced-panel [data-ui-schema-input], ' +
        '.rh-ai-app-preview-advanced-panel [data-ui-schema-value], ' +
        '.rh-ai-app-preview-advanced-panel [data-ui-schema-menu-trigger], ' +
        '.rh-ai-app-preview-advanced-panel .rh-stepper-value, ' +
        '.rh-ai-app-preview-advanced-panel .rh-stepper-input, ' +
        '.rh-ai-app-preview-advanced-panel .ui-schema-option, ' +
        '.rh-ai-app-preview-advanced-panel .rh-tip, ' +
        '.rh-ai-app-preview-advanced-panel .ui-schema-info-tip, ' +
        '.rh-ai-app-preview-typebar-action, ' +
        '.rh-ai-app-preview-typebar-option',
    );
  }
  ['_handleComponentInput'](event14) {
    const el47 = event14.target?.closest?.('[data-role=\'preview-rename-input\']');
    if (el47 && this.panel?.contains(el47)) {
      const value372 = Number(el47.dataset.previewComponentIndex),
        componentByIndex6 = getComponentByIndex(this.componentDrafts, value372);
      if (componentByIndex6 && isMediaComponent(componentByIndex6)) {
        const inputSlotLabel2 = normalizeInputSlotLabel(el47.value, '');
        if (el47.value !== inputSlotLabel2) el47.value = inputSlotLabel2;
      }
      return;
    }
    const el48 = event14.target?.closest?.('[data-role=\'comfyui-candidate-search\']');
    if (el48 && this.panel?.contains(el48)) {
      if (this.comfyCandidateSearchText === String(el48.value || '')) return;
      ((this.comfyCandidateSearchText = String(el48.value || '')),
        this._renderComfyCandidatePicker({ open: true, preserveSearchFocus: true }));
      return;
    }
    const el49 = event14.target?.closest?.('[data-app-prop]');
    if (el49 && this.panel?.contains(el49)) {
      const value373 = String(el49.dataset.appProp || '');
      if (value373 === 'appName')
        ((this.appName = String(el49.value || '')),
          (this.pendingDeleteSavedAppId = ''),
          (this.pendingOverwriteSavedAppId = ''),
          (this.pendingOverwriteIntent = ''));
      else {
        if (value373 === 'appDescription') this.appDescription = String(el49.value || '');
        else return;
      }
      (this._refreshBundleFromComponents({ renderPreview: false }), this._patchPreviewAppChrome());
      return;
    }
    const el50 = event14.target?.closest?.('[data-component-prop]');
    if (!el50 || !this.panel?.contains(el50)) return;
    const el51 = el50.closest('[data-component-index]'),
      value374 = Number(el51?.dataset.componentIndex),
      enabled55 = String(el50.dataset.componentProp || '');
    if (!Number.isInteger(value374) || !enabled55) return;
    let inputSlotLabel3 = el50.value;
    const componentByIndex7 = getComponentByIndex(this.componentDrafts, value374);
    if (enabled55 === 'label' && componentByIndex7 && isMediaComponent(componentByIndex7)) {
      inputSlotLabel3 = normalizeInputSlotLabel(inputSlotLabel3, '');
      if (el50.value !== inputSlotLabel3) el50.value = inputSlotLabel3;
    }
    this._updateComponentDraft(value374, enabled55, inputSlotLabel3);
  }
  ['_updatePromptHelpTooltip'](value375) {
    this.promptHelpTooltip = normalizePromptHelpTooltip(value375);
    const value376 = this._refreshBundleFromComponents({ renderPreview: false });
    this._patchPreviewWithoutRebuild(value376, { renderPrompt: true });
  }
  ['_updateComponentDraft'](
    value377,
    renderInputs,
    value378,
    {
      animatePreviewMoveFromRect: animatePreviewMoveFromRect = null,
      preferredPreviewPlacement: preferredPreviewPlacement = '',
    } = {},
  ) {
    const enabled56 = this.componentDrafts.find((value379) => Number(value379.index) === value377);
    if (!enabled56) return;
    if (renderInputs === 'componentKind') {
      if (enabled56.componentKindLocked === true) return;
      const componentKind4 = normalizeComponentKind(value378),
        componentKindOptions2 = getComponentKindOptions(
          enabled56,
          normalizeComponentKind(enabled56.componentKind),
        );
      if (!optionValuesInclude(componentKindOptions2, componentKind4)) return;
      enabled56.componentKind = componentKind4;
      if (componentKind4 === 'prompt') enabled56.controlType = 'prompt';
      if (componentKind4 === 'param' && normalizeControlType(enabled56.controlType) === 'prompt') {
        const list37 = getControlTypeOptions(enabled56, normalizeControlType(enabled56.controlType));
        enabled56.controlType = list37.find(([value380]) => value380 !== 'prompt')?.[0] || 'text';
      }
      if (!isMediaComponent(enabled56)) delete enabled56.inputOrder;
      !isParamComponent(enabled56) &&
        (delete enabled56.homeParamOrder,
        delete enabled56.advancedParamOrder,
        delete enabled56.previewPlacement);
    } else {
      if (renderInputs === 'controlType') {
        if (enabled56.controlTypeLocked === true) return;
        const controlType9 = normalizeControlType(value378),
          controlTypeOptions2 = getControlTypeOptions(
            enabled56,
            normalizeControlType(enabled56.controlType),
          );
        if (!optionValuesInclude(controlTypeOptions2, controlType9)) return;
        controlType9 === 'prompt'
          ? ((enabled56.componentKind = 'prompt'),
            (enabled56.controlType = 'prompt'),
            delete enabled56.homeParamOrder,
            delete enabled56.advancedParamOrder,
            delete enabled56.previewPlacement)
          : ((enabled56.componentKind = 'param'),
            (enabled56.controlType = controlType9),
            preferredPreviewPlacement &&
              (this.previewDragController.placeParamDraft(enabled56, preferredPreviewPlacement),
              enabled56.previewPlacement !== preferredPreviewPlacement &&
                this.previewDragController.placeParamDraft(enabled56, 'advanced')));
      } else {
        if (renderInputs === 'label')
          enabled56.label = isMediaComponent(enabled56)
            ? normalizeInputSlotLabel(value378, '')
            : String(value378 || '').trim();
        else {
          if (renderInputs === 'description') enabled56.description = String(value378 || '').trim();
          else {
            if (renderInputs === 'defaultValue') enabled56.defaultValue = String(value378 ?? '');
            else return;
          }
        }
      }
    }
    if (renderInputs === 'componentKind' || renderInputs === 'controlType') this._renderComponentConfig();
    const renderPrompt = shouldRefreshPreviewPromptForDraft(enabled56, renderInputs),
      value381 = this._refreshBundleFromComponents({ renderPreview: false });
    (this._patchPreviewWithoutRebuild(value381, {
      renderInputs: renderInputs === 'componentKind' || renderInputs === 'label',
      renderParams: true,
      renderAdvanced: true,
      renderPrompt: renderPrompt,
    }),
      animatePreviewMoveFromRect &&
        this.previewDragController.animateComponentFromRect(value377, animatePreviewMoveFromRect));
  }
  ['_renamePreviewParamFromTypebar'](el52) {
    const value382 = Number(el52?.dataset?.previewComponentIndex);
    if (!Number.isInteger(value382)) return;
    const el53 = el52.closest?.(
        '.rh-ai-app-preview-input-slot, .rh-ai-app-preview-param-chip, .rh-ai-app-preview-advanced-param, .rh-ai-app-preview-prompt-target',
      ),
      value383 = el53?.querySelector?.(
        '.rh-ai-app-preview-rename-target[data-preview-component-index="' + value382 + '"]',
      );
    if (value383) this._startPreviewInlineRename(value383, value382);
  }
  ['_editPreviewDescriptionFromTypebar'](el54) {
    const value384 = Number(el54?.dataset?.previewComponentIndex);
    if (!Number.isInteger(value384)) return;
    const el55 = el54.closest?.(
      '.rh-ai-app-preview-param-chip, .rh-ai-app-preview-advanced-param, .rh-ai-app-preview-prompt-target, .rh-ai-app-real-preview-panel',
    );
    let el56 =
      el55?.querySelector?.(
        '.rh-ai-app-preview-description-target[data-preview-component-index="' + value384 + '"]',
      ) ||
      this.nodePreviewEl?.querySelector?.(
        '.rh-ai-app-preview-description-target[data-preview-component-index="' + value384 + '"]',
      );
    if (!el56 && el55?.classList?.contains('rh-ai-app-preview-param-chip')) {
      const value385 = el55.querySelector?.(
        '.rh-ai-app-preview-param-label[data-preview-component-index="' + value384 + '"]',
      );
      if (value385) {
        const componentByIndex8 = getComponentByIndex(this.componentDrafts, value384),
          previewComponentDescription2 = getPreviewComponentDescription(componentByIndex8, '参数说明');
        ((el56 = document.createElement('span')),
          (el56.className =
            'rh-tip ui-schema-info-tip rh-ai-app-preview-description-target ' +
            'rh-ai-app-preview-param-description-tip'),
          (el56.dataset.previewComponentIndex = String(value384)),
          (el56.textContent = '!'),
          el56.setAttribute('role', 'button'),
          el56.setAttribute('tabindex', '0'),
          el56.setAttribute('aria-label', '编辑参数说明'),
          el56.setAttribute('data-tooltip', previewComponentDescription2),
          el56.setAttribute('title', previewComponentDescription2),
          value385.insertAdjacentElement('afterend', el56));
      }
    }
    if (el56) this._startPreviewInlineDescriptionEdit(el56, value384);
  }
  ['_togglePreviewParamDefault'](el57) {
    const value386 = Number(el57?.dataset?.previewComponentIndex);
    if (!Number.isInteger(value386)) return;
    const componentByIndex9 = getComponentByIndex(this.componentDrafts, value386);
    if (!componentByIndex9 || !isParamComponent(componentByIndex9)) return;
    if (normalizeControlType(componentByIndex9.controlType) !== 'toggle') return;
    const isPreviewToggleOn2 = isPreviewToggleOn(componentByIndex9.defaultValue) ? 'false' : 'true';
    this._updateComponentDraft(value386, 'defaultValue', isPreviewToggleOn2);
  }
  ['_removePreviewParam'](el58) {
    if (!this._canRemovePreviewParams()) return;
    const value387 = Number(el58?.dataset?.previewComponentIndex);
    if (!Number.isInteger(value387)) return;
    const componentByIndex10 = getComponentByIndex(this.componentDrafts, value387);
    if (!componentByIndex10 || !isParamComponent(componentByIndex10)) return;
    this.componentDrafts = this.componentDrafts.filter(
      (value388) => Number(value388?.index) !== value387,
    );
    const value389 = this._refreshBundleFromComponents({ renderPreview: false });
    (this._patchPreviewWithoutRebuild(value389, {
      renderParams: true,
      renderAdvanced: true,
      renderPrompt: true,
      renderAppChrome: true,
      renderActionControls: true,
    }),
      this._renderComfyCandidatePicker({ open: this.comfyCandidatePickerOpen }));
  }
  ['_removePreviewInput'](el59) {
    if (!this._canRemovePreviewInputs()) return;
    const value390 = Number(el59?.dataset?.previewComponentIndex);
    if (!Number.isInteger(value390)) return;
    const componentByIndex11 = getComponentByIndex(this.componentDrafts, value390);
    if (!componentByIndex11 || !isMediaComponent(componentByIndex11)) return;
    this.componentDrafts = this.componentDrafts.filter(
      (value391) => Number(value391?.index) !== value390,
    );
    const value392 = this._refreshBundleFromComponents({ renderPreview: false });
    (this._patchPreviewWithoutRebuild(value392, {
      renderInputs: true,
      renderParams: true,
      renderAdvanced: true,
      renderPrompt: true,
      renderAppChrome: true,
      renderActionControls: true,
    }),
      this._renderComfyCandidatePicker({ open: this.comfyCandidatePickerOpen }));
  }
  ['_scheduleParse']() {
    window.clearTimeout(this.parseTimer);
    if (!this._getInputText().trim()) {
      ((this.currentBundle = null),
        this._clearCurrentDraftIdentity(),
        this._setSummary(null),
        this._setError(''),
        this._clearBuilder(),
        this._saveKindState());
      return;
    }
    (this._saveKindState(),
      (this.parseTimer = window.setTimeout(() => this._parseNow({ silent: true }), 180)));
  }
  ['_parseNow']({ silent: silent = false } = {}) {
    window.clearTimeout(this.parseTimer);
    const enabled57 = this._getInputText();
    try {
      const value393 = this._buildCurrentBundle();
      this.currentBundle = value393;
      if (!silent) this.workflowInputCollapsed = true;
      return (
        this._setSummary(value393),
        this._setError(''),
        this._renderNodePreview(value393),
        this._setActionButtonsEnabled(true),
        this._saveKindState(),
        value393
      );
    } catch (error9) {
      this.currentBundle = null;
      const enabled58 = !enabled57.trim(),
        enabled59 =
          !enabled58 &&
          Boolean(
            this.componentDraftKey ||
            this.componentDrafts.length ||
            this.componentCandidates.length,
          );
      if (enabled58) this._clearCurrentDraftIdentity();
      if (enabled58 || !enabled59) this._clearBuilder();
      (this._setSummary(null), this._setActionButtonsEnabled(false));
      if (!silent || enabled57.trim()) this._setError(error9?.message || '解析失败');
      else this._setError('');
      return (this._saveKindState(), null);
    }
  }
  ['_buildSavedAppRecordFromCurrentInput'](value394 = null) {
    return this.configRepository.buildSavedAppRecord(
      {
        sourceType: this.sourceType,
        kind: this.kind,
        runningHubProfileId: this.runningHubProfileId,
        name: normalizeAppName(this.appName),
        description: normalizeAppDescription(this.appDescription),
        promptHelpTooltip: normalizePromptHelpTooltip(this.promptHelpTooltip),
        input: this._getInputText(),
        componentDraftKey: this._getComponentDraftKey(),
        componentDrafts: this.componentDrafts,
      },
      value394,
    );
  }
  async ['_saveCurrentConfigAsSavedApp']({
    overwriteSavedAppId: overwriteSavedAppId = '',
    isCurrentDraft: isCurrentDraft = () => true,
  } = {}) {
    const value395 = String(overwriteSavedAppId || '').trim(),
      enabled60 = value395 ? this._findSavedApp(value395) : null;
    if (value395 && !enabled60) throw new Error('覆盖目标应用不存在');
    const value396 = enabled60?.bundle || null,
      record2 = structuredClone(this._buildSavedAppRecordFromCurrentInput(enabled60)),
      bundle3 = this._buildBundleForSavedApp(record2);
    record2.bundle = bundle3;
    const value397 = this.savedApps.filter((value398) => value398.id !== record2.id);
    (value397.unshift(record2),
      await this.configRepository.commitSavedApps(value397, () => {
        this.savedApps = value397;
      }));
    if (value396) unregisterCustomAiAppBundle(value396, this.registeredBundleKeys);
    (registerCustomAiAppBundle(bundle3, this.registeredBundleKeys, { replace: true }),
      this._registerBundlesFromNodes());
    if (!isCurrentDraft()) return { record: record2, bundle: bundle3, isCurrentDraft: false };
    return (
      (this.savedAppId = record2.id),
      (this.currentBundle = bundle3),
      (this.appName = record2.name),
      (this.appDescription = record2.description),
      (this.promptHelpTooltip = normalizePromptHelpTooltip(record2.promptHelpTooltip)),
      (this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''),
      this._setSummary(bundle3),
      this._setActionButtonsEnabled(true),
      this._saveKindState(),
      { record: record2, bundle: bundle3, isCurrentDraft: true }
    );
  }
  ['_patchSavedConfigSuccessPreview'](value399) {
    (this._renderComponentConfig(),
      this._patchPreviewWithoutRebuild(value399, {
        renderInputs: true,
        renderParams: true,
        renderAdvanced: true,
        renderPrompt: true,
        renderAppChrome: true,
        renderActionControls: true,
      }));
  }
  ['_saveConfigFromCurrentInput']() {
    return saveRhAiApp(this);
  }
  async ['_confirmOverwriteSavedApp'](value400) {
    const enabled61 = String(value400 || '').trim();
    if (!enabled61 || enabled61 !== this.pendingOverwriteSavedAppId) return null;
    return saveRhAiApp(this, enabled61);
  }
  ['_loadSavedApp'](value401) {
    this.definitionController.cancel();
    const error10 = this._findSavedApp(value401);
    if (!error10) return;
    (window.clearTimeout(this.parseTimer),
      this._saveKindState(),
      (this.sourceType = normalizeSourceType(error10.sourceType) || SOURCE_TYPES.runninghub),
      (this.kind = normalizeKind(error10.kind)),
      (this.runningHubProfileId = normalizeRunningHubModelApiProfileId(error10.runningHubProfileId)),
      this._syncSourceView(),
      this._syncKindTabs(),
      (this.appName = normalizeAppName(error10.name)),
      (this.appDescription = normalizeAppDescription(error10.description)),
      (this.promptHelpTooltip = normalizePromptHelpTooltip(error10.promptHelpTooltip)),
      (this.savedAppId = error10.id));
    if (this.textarea) this.textarea.value = error10.input || '';
    ((this.definitionReference = this.definitionController.getSavedReference(error10)),
      this.definitionController.sync(),
      (this.componentDraftKey = error10.componentDraftKey || this._getComponentDraftKey()),
      (this.componentDrafts = cloneComponentDrafts(error10.componentDrafts)));
    (this._shouldShowManualComponentPicker() || !this.componentDrafts.length) &&
      error10.input.trim() &&
      this._syncComponentDrafts({ force: true });
    ((this.previewAppMenuOpen = false),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''));
    try {
      const value402 = error10.bundle || this._buildBundleForSavedApp(error10);
      ((error10.bundle = value402),
        registerCustomAiAppBundle(value402, this.registeredBundleKeys),
        (this.currentBundle = value402),
        this._setSummary(value402),
        this._setError(''),
        this._renderComponentConfig(),
        this._patchPreviewWithoutRebuild(value402, {
          renderInputs: true,
          renderParams: true,
          renderAdvanced: true,
          renderPrompt: true,
          renderAppChrome: true,
          renderActionControls: true,
        }),
        this._setActionButtonsEnabled(true));
    } catch (error11) {
      ((this.currentBundle = null),
        this._setSummary(null),
        this._setError(error11?.message || '配置载入失败'),
        this._setActionButtonsEnabled(false));
    }
    this._saveKindState();
  }
  ['_deleteSavedApp'](value403) {
    if (this.savePending) return;
    const enabled62 = this._findSavedApp(value403);
    if (!enabled62) return;
    const value404 = this.savedAppId === enabled62.id;
    if (enabled62.bundle) unregisterCustomAiAppBundle(enabled62.bundle, this.registeredBundleKeys);
    ((this.savedApps = this.savedApps.filter((value405) => value405.id !== enabled62.id)),
      this._registerBundlesFromNodes(),
      (this.pendingDeleteSavedAppId = ''),
      (this.pendingOverwriteSavedAppId = ''),
      (this.pendingOverwriteIntent = ''));
    if (value404) {
      this.savedAppId = '';
      if (this.textarea) this.textarea.value = '';
      ((this.appName = DEFAULT_AI_APP_NAME),
        (this.appDescription = ''),
        (this.currentBundle = null),
        this._clearBuilder(),
        this._setSummary(null),
        this._setError(''));
    } else ((this.previewAppMenuOpen = true), this._patchPreviewAppChrome());
    (this._persistSavedApps(),
      this._saveKindState(),
      window.showToast?.(this._getSourceMeta()?.deleteSuccess || '配置已删除', 'success'));
  }
  ['_createNodeFromSavedBundle'](bundle4) {
    const center2 = getCanvasCenterWorld(this.panel),
      rhAiAppNodeData = buildRhAiAppNodeData({
        bundle: bundle4,
        kind: this.kind,
        center: center2,
        runningHubProfileId: this.runningHubProfileId,
      });
    return (
      graphStore.batch?.(() => {
        (graphStore.addNode(rhAiAppNodeData), graphStore.setSelectedNodes([rhAiAppNodeData.id]));
      }),
      typeof graphStore.batch !== 'function' &&
        (graphStore.addNode(rhAiAppNodeData), graphStore.setSelectedNodes([rhAiAppNodeData.id])),
      commit(),
      window.showToast?.(this._getSourceMeta()?.createSuccess || '节点已创建', 'success'),
      rhAiAppNodeData
    );
  }
  async ['_createNodeFromCurrentInput']() {
    if (!this._refreshBundleFromComponents({ renderPreview: false })) return;
    let rhAiAppTestBundle;
    try {
      ((rhAiAppTestBundle = buildRhAiAppTestBundle(this)),
        registerCustomAiAppBundle(rhAiAppTestBundle, this.registeredBundleKeys),
        this._createNodeFromSavedBundle(rhAiAppTestBundle));
    } catch (error12) {
      if (rhAiAppTestBundle) unregisterCustomAiAppBundle(rhAiAppTestBundle, this.registeredBundleKeys);
      (this._registerBundlesFromNodes(),
        console.error('[RH AI App] create node failed:', error12),
        window.showToast?.(
          error12?.message || this._getSourceMeta()?.createFailed || '节点创建失败',
          'error',
        ),
        this._setError(error12?.message || '节点创建失败'),
        this._saveKindState());
    }
  }
}
export const runningHubAiAppManager = new RunningHubAiAppManager();
