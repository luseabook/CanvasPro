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
const OUTPUT_KIND_LABELS = Object['freeze']({ image: '图像', video: '视频', audio: '音频' }),
  NODE_TYPE_BY_KIND = Object['freeze']({ image: 'ai-image', video: 'ai-video', audio: 'ai-audio' }),
  COMPONENT_KIND_LABELS = Object['freeze']({
    image: '图像入参',
    video: '视频入参',
    audio: '音频入参',
    prompt: '提示词',
    param: '参数',
  }),
  COMPONENT_KIND_OPTIONS = Object['freeze']([
    ['image', '图像入参'],
    ['video', '视频入参'],
    ['audio', '音频入参'],
    ['prompt', '提示词'],
    ['param', '参数'],
  ]),
  CONTROL_TYPE_LABELS = Object['freeze']({
    select: '下拉选项',
    text: '短文本',
    textarea: '长文本',
    stepper: '整数',
    float: '浮点数',
    toggle: '布尔',
    prompt: '提示词',
  }),
  CONTROL_TYPE_OPTIONS = Object['freeze']([
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
  PREVIEW_DROP_ZONES = Object['freeze'](['input', 'prompt', 'params', 'advanced']),
  PREVIEW_TEXT_TYPE_VALUES = Object['freeze'](['prompt', 'text', 'textarea']),
  PREVIEW_PARAM_TEXT_TYPE_VALUES = Object['freeze'](['text', 'textarea']),
  PREVIEW_PROMPT_HELP_FIELD_NAMES = Object['freeze']([
    '提示词',
    'prompt',
    '提示词.value',
    'prompt.value',
    'positive prompt',
    'positive_prompt',
  ]),
  PREVIEW_DRAG_START_THRESHOLD_PX = 0xa,
  PREVIEW_RENAME_CLICK_TOLERANCE_PX = 0x3,
  PREVIEW_MOVE_ANIMATION_MS = 0x104,
  INPUT_SLOT_LABEL_MAX_WIDTH_UNITS = 0x12,
  INPUT_SLOT_LABEL_INPUT_MAX_LENGTH = 0x18,
  INPUT_SLOT_LABEL_WIDE_CHAR_RE = /[^\u0000-\u00ff]/u,
  INPUT_SLOT_LABEL_LATIN_RE = /^[\u0000-\u007f]+$/u,
  SOURCE_PAGE_ANIMATION_MS = 0x118,
  RH_AI_APP_EXIT_MOTION_MS = 0xb4,
  DEFAULT_AI_APP_NAME = '未命名 AI应用',
  JSON_FILE_EXTENSION_RE = /\.json$/i,
  RH_AI_APP_VIP_PROVIDER = 'runninghubwf';
function escapeHtml(_0xa545f6) {
  return String(_0xa545f6 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeKind(_0x4e4889) {
  return Object['hasOwn'](OUTPUT_KIND_LABELS, _0x4e4889) ? _0x4e4889 : 'image';
}
function shouldReduceMotion() {
  try {
    return window['matchMedia']?.('(prefers-reduced-motion: reduce)')?.['matches'] === !![];
  } catch {
    return ![];
  }
}
function normalizeComponentKind(_0x3ce6d6) {
  return Object['hasOwn'](COMPONENT_KIND_LABELS, _0x3ce6d6) ? _0x3ce6d6 : 'param';
}
function normalizeControlType(_0x4b4614) {
  const _0x20be17 = String(_0x4b4614 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x20be17 === 'integer' || _0x20be17 === 'number') return 'stepper';
  if (_0x20be17 === 'decimal') return 'float';
  if (_0x20be17 === 'boolean' || _0x20be17 === 'bool') return 'toggle';
  return Object['hasOwn'](CONTROL_TYPE_LABELS, _0x20be17) ? _0x20be17 : 'text';
}
function cloneComponentDrafts(_0x3dd65b = []) {
  return Array['isArray'](_0x3dd65b) ? _0x3dd65b['map']((_0x1ffbb1) => ({ ..._0x1ffbb1 })) : [];
}
function normalizeAppName(_0x305fe6) {
  const _0x1aa29d = String(_0x305fe6 || '')['trim']();
  return _0x1aa29d || DEFAULT_AI_APP_NAME;
}
function normalizeDroppedJsonAppName(_0x400d8b) {
  const _0x5c6892 = String(_0x400d8b || '')
    ['split'](/[\\/]/)
    ['pop']()
    ['replace'](JSON_FILE_EXTENSION_RE, '')
    ['trim']();
  return normalizeAppName(_0x5c6892);
}
function isJsonFile(_0x463d5f) {
  const _0x6c1786 = String(_0x463d5f?.['name'] || '')['trim'](),
    _0x495735 = String(_0x463d5f?.['type'] || '')
      ['trim']()
      ['toLowerCase']();
  return JSON_FILE_EXTENSION_RE['test'](_0x6c1786) || _0x495735 === 'application/json';
}
function hasFileDragPayload(_0x304f0d) {
  return Array['from'](_0x304f0d?.['dataTransfer']?.['types'] || [])['some'](
    (_0x2786e6) => String(_0x2786e6 || '')['toLowerCase']() === 'files',
  );
}
function normalizeAppDescription(_0x49dde7) {
  return String(_0x49dde7 || '')['trim']();
}
function normalizePromptHelpTooltip(_0x4da09a) {
  return String(_0x4da09a || '')['trim']();
}
function getBundleDisplayName(_0x19334d) {
  return normalizeAppName(_0x19334d?.['models']?.[0x0]?.['displayName']);
}
function getCanvasCenterWorld(_0x13e86e = null) {
  const { viewport: _0x3c6da5 } = graphStore['getState'](),
    _0x48eca9 = window['innerWidth'] / 0x2,
    _0x4edf9c = window['innerHeight'] / 0x2,
    _0x5a9075 = document['documentElement']?.['clientWidth'] || window['innerWidth'] || 0x0,
    _0x3ec7a5 = document['documentElement']?.['clientHeight'] || window['innerHeight'] || 0x0;
  if (!_0x5a9075 || !_0x3ec7a5) return screenToWorld(_0x48eca9, _0x4edf9c, _0x3c6da5);
  let _0xa1d101 = 0x0,
    _0x44c944 = 0x0,
    _0x29532e = _0x5a9075,
    _0x4ddb5a = _0x3ec7a5;
  const _0x5d6ef9 = [
      document['querySelector']('header'),
      document['querySelector']('.sidebar-floating'),
      _0x13e86e?.['classList']?.['contains']('is-open') ? _0x13e86e : null,
    ]['filter'](Boolean),
    _0x4a4425 = 0x8;
  for (const _0x5f2599 of _0x5d6ef9) {
    if (!_0x5f2599?.['isConnected']) continue;
    const _0x23ed09 = _0x5f2599['getBoundingClientRect'](),
      _0x242012 = Math['max'](_0xa1d101, _0x23ed09['left']),
      _0x2a0214 = Math['max'](_0x44c944, _0x23ed09['top']),
      _0x46e28e = Math['min'](_0x29532e, _0x23ed09['right']),
      _0x144eb2 = Math['min'](_0x4ddb5a, _0x23ed09['bottom']);
    if (_0x46e28e <= _0x242012 || _0x144eb2 <= _0x2a0214) continue;
    if (_0x23ed09['left'] <= _0xa1d101 + _0x4a4425 && _0x23ed09['right'] > _0xa1d101 + _0x4a4425) {
      _0xa1d101 = Math['max'](_0xa1d101, _0x23ed09['right']);
      continue;
    }
    if (_0x23ed09['right'] >= _0x29532e - _0x4a4425 && _0x23ed09['left'] < _0x29532e - _0x4a4425) {
      _0x29532e = Math['min'](_0x29532e, _0x23ed09['left']);
      continue;
    }
    if (_0x23ed09['top'] <= _0x44c944 + _0x4a4425 && _0x23ed09['bottom'] > _0x44c944 + _0x4a4425) {
      _0x44c944 = Math['max'](_0x44c944, _0x23ed09['bottom']);
      continue;
    }
    _0x23ed09['bottom'] >= _0x4ddb5a - _0x4a4425 &&
      _0x23ed09['top'] < _0x4ddb5a - _0x4a4425 &&
      (_0x4ddb5a = Math['min'](_0x4ddb5a, _0x23ed09['top']));
  }
  const _0x41cf5d = _0x29532e - _0xa1d101,
    _0x80f443 = _0x4ddb5a - _0x44c944,
    _0x31eef1 = _0x41cf5d > 0x28 ? _0xa1d101 + _0x41cf5d / 0x2 : _0x48eca9,
    _0x36e7bc = _0x80f443 > 0x28 ? _0x44c944 + _0x80f443 / 0x2 : _0x4edf9c;
  return screenToWorld(_0x31eef1, _0x36e7bc, _0x3c6da5);
}
function getGenerationNodeSize(_0x1189a7) {
  if (_0x1189a7 === 'ai-audio') return { width: 0x1a4, height: 0xb4 };
  return getAIGenerationDefaultSizeByType(_0x1189a7);
}
function buildRhAiAppNodeData({
  bundle: _0x338589,
  kind: _0x53eacb,
  center: _0x30b8c7,
  runningHubProfileId: runningHubProfileId = '',
}) {
  const _0x38135b = NODE_TYPE_BY_KIND[_0x53eacb] || 'ai-image',
    _0x28f599 = getCustomAiAppBundleModelId(_0x338589),
    _0x2daaee = getBundleDisplayName(_0x338589),
    _0x48fd12 = _0x338589?.['models']?.[0x0]?.['provider'] || 'runninghubwf',
    _0x939fae = _0x48fd12 === 'runninghubwf' ? normalizeRunningHubModelApiProfileId(runningHubProfileId) : '',
    _0x1bf66e = getGenerationNodeSize(_0x38135b),
    _0x26868d = sanitizeModelUiSchemaParams(_0x28f599, {}, { includeDefaults: !![] }),
    _0x3bc75f = {
      id: generateId(_0x38135b),
      type: _0x38135b,
      x: Math['round'](_0x30b8c7['x'] - _0x1bf66e['width'] / 0x2),
      y: Math['round'](_0x30b8c7['y'] - _0x1bf66e['height'] / 0x2),
      width: _0x1bf66e['width'],
      height: _0x1bf66e['height'],
      name: _0x2daaee,
      model: _0x28f599,
      provider: _0x48fd12,
      generationParams: _0x26868d,
      generationParamsByModel: { [_0x28f599]: _0x26868d },
      ...(_0x939fae ? { providerProfileId: _0x939fae, rhProviderProfileId: _0x939fae } : {}),
      rhAiAppManifestBundle: projectCustomAiAppBundleForNodeRuntime(_0x338589),
      featureSelectionScope: 'node',
    };
  return (
    (_0x38135b === 'ai-image' || _0x38135b === 'ai-video') && (_0x3bc75f['aspectRatio'] = '自适应'),
    _0x38135b === 'ai-audio' &&
      ((_0x3bc75f['audioWorkflowKey'] = _0x28f599), (_0x3bc75f['audioWorkflowLabel'] = _0x2daaee)),
    _0x3bc75f
  );
}
function renderSummaryHtml(_0x395ce1, _0x584308 = SOURCE_TYPE_META[SOURCE_TYPES['runninghub']]['emptyText']) {
  if (!_0x395ce1?.['modelId']) return '<div class="rh-ai-app-empty">' + escapeHtml(_0x584308) + '</div>';
  const _0x32cf1e = _0x395ce1['slots']['length']
      ? _0x395ce1['slots']
          ['map'](
            (_0x5bbb24) =>
              '<span\x20class=\x22rh-ai-app-chip\x22>' +
              escapeHtml(OUTPUT_KIND_LABELS[_0x5bbb24['kind']] || _0x5bbb24['kind']) +
              ' · ' +
              escapeHtml(_0x5bbb24['label']) +
              '</span>',
          )
          ['join']('')
      : '<span class="rh-ai-app-muted">无媒体入参槽</span>',
    _0x1c78f8 = _0x395ce1['params']['length']
      ? _0x395ce1['params']
          ['map']((_0x134bda) => '<span class="rh-ai-app-chip">' + escapeHtml(_0x134bda['label']) + '</span>')
          ['join']('')
      : '<span class="rh-ai-app-muted">无额外参数</span>';
  return (
    '\n    <div class="rh-ai-app-summary-card">\n      <div class="rh-ai-app-summary-top">\n        <span>' +
    escapeHtml(_0x395ce1['resourceIdLabel'] || 'App ID') +
    '</span>\n        <strong>' +
    escapeHtml(_0x395ce1['appId']) +
    '</strong>\n      </div>\n      <div class="rh-ai-app-summary-row">\n        <span>节点类型</span>\n        <strong>' +
    escapeHtml(OUTPUT_KIND_LABELS[_0x395ce1['kind']] || _0x395ce1['kind']) +
    '</strong>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-ai-app-summary-group\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-ai-app-summary-label\x22>入参槽</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-ai-app-chip-row\x22>' +
    _0x32cf1e +
    '</div>\n      </div>\n      <div class="rh-ai-app-summary-group">\n        <div class="rh-ai-app-summary-label">参数</div>\n        <div class="rh-ai-app-chip-row">' +
    _0x1c78f8 +
    '</div>\n      </div>\n    </div>'
  );
}
function renderOptionsHtml(_0x12c916, _0x32cb84) {
  const _0x5c8c73 = String(_0x32cb84 || '');
  return _0x12c916['map'](([_0x20ce54, _0x1c5bae]) => {
    const _0x17a3a1 = String(_0x20ce54) === _0x5c8c73 ? ' selected' : '';
    return (
      '<option value="' +
      escapeHtml(_0x20ce54) +
      '\x22' +
      _0x17a3a1 +
      '>' +
      escapeHtml(_0x1c5bae) +
      '</option>'
    );
  })['join']('');
}
function getOptionLabel(_0x3eac6c = [], _0x3251a5 = '') {
  const _0x4e6247 = String(_0x3251a5 || ''),
    _0x4e88ae = _0x3eac6c['find'](([_0x590d08]) => String(_0x590d08) === _0x4e6247);
  return String(_0x4e88ae?.[0x1] || _0x4e6247 || '');
}
function buildOptionsFromValues(_0xdeed49 = [], _0x575f08 = {}) {
  return (Array['isArray'](_0xdeed49) ? _0xdeed49 : [])
    ['map']((_0xe02f9a) => String(_0xe02f9a || '')['trim']())
    ['filter'](
      (_0x5370a9, _0xd7bc38, _0x2b9d1f) => _0x5370a9 && _0x2b9d1f['indexOf'](_0x5370a9) === _0xd7bc38,
    )
    ['filter']((_0xa13e0) => Object['hasOwn'](_0x575f08, _0xa13e0))
    ['map']((_0x174602) => [_0x174602, _0x575f08[_0x174602]]);
}
function getComponentKindOptions(_0x2541cc, _0x3fb106) {
  const _0x13ce7c = buildOptionsFromValues(_0x2541cc?.['componentKindOptions'], COMPONENT_KIND_LABELS);
  if (_0x13ce7c['length']) return _0x13ce7c;
  if (_0x2541cc?.['componentKindLocked'] === !![] || isMediaComponent(_0x2541cc))
    return [[_0x3fb106, COMPONENT_KIND_LABELS[_0x3fb106] || _0x3fb106]];
  return COMPONENT_KIND_OPTIONS['filter'](([_0x17587a]) => _0x17587a === 'param' || _0x17587a === 'prompt');
}
function getControlTypeOptions(_0xa24d12, _0x594a69) {
  const _0x25dfbd = buildOptionsFromValues(_0xa24d12?.['controlTypeOptions'], CONTROL_TYPE_LABELS);
  if (_0x25dfbd['length']) return _0x25dfbd;
  if (_0xa24d12?.['controlTypeLocked'] === !![])
    return [[_0x594a69, CONTROL_TYPE_LABELS[_0x594a69] || _0x594a69]];
  return CONTROL_TYPE_OPTIONS['filter'](([_0x507343]) => _0x507343 !== 'toggle' && _0x507343 !== 'prompt');
}
function getPreviewTextTypeOptions(_0x3fe281) {
  if (!_0x3fe281 || isMediaComponent(_0x3fe281)) return [];
  const _0x2cf38f = normalizeComponentKind(_0x3fe281['componentKind']),
    _0x359076 = normalizeControlType(_0x3fe281['controlType']),
    _0x3eb905 = getControlTypeOptions(_0x3fe281, _0x359076),
    _0x4f4d2f = getComponentKindOptions(_0x3fe281, _0x2cf38f);
  return PREVIEW_TEXT_TYPE_VALUES['filter']((_0x3e5c69) => {
    if (_0x3e5c69 === 'prompt')
      return (
        _0x359076 === 'prompt' ||
        optionValuesInclude(_0x3eb905, 'prompt') ||
        optionValuesInclude(_0x4f4d2f, 'prompt')
      );
    return _0x359076 === _0x3e5c69 || optionValuesInclude(_0x3eb905, _0x3e5c69);
  })['map']((_0x24444a) => [_0x24444a, CONTROL_TYPE_LABELS[_0x24444a] || _0x24444a]);
}
function optionValuesInclude(_0xa898b6 = [], _0x11a832 = '') {
  const _0x373edd = String(_0x11a832 || '')['trim']();
  return _0xa898b6['some'](([_0x4a9d17]) => String(_0x4a9d17) === _0x373edd);
}
function previewTextTypeOptionsInclude(_0x48f9bd, _0x381edf) {
  return optionValuesInclude(getPreviewTextTypeOptions(_0x48f9bd), _0x381edf);
}
function canPreviewComponentBecomePrompt(_0x5f44ba) {
  if (!_0x5f44ba || isMediaComponent(_0x5f44ba)) return ![];
  if (normalizeComponentKind(_0x5f44ba['componentKind']) === 'prompt') return !![];
  const _0x120b31 = normalizeControlType(_0x5f44ba['controlType']);
  if (!PREVIEW_PARAM_TEXT_TYPE_VALUES['includes'](_0x120b31)) return ![];
  return previewTextTypeOptionsInclude(_0x5f44ba, 'prompt');
}
function canPreviewPromptBecomeParam(_0x1af84b) {
  if (normalizeComponentKind(_0x1af84b?.['componentKind']) !== 'prompt') return ![];
  return PREVIEW_PARAM_TEXT_TYPE_VALUES['some']((_0x34dedc) =>
    previewTextTypeOptionsInclude(_0x1af84b, _0x34dedc),
  );
}
function getPreviewPromptReturnControlType(_0xa797b7, _0x1677d1 = '') {
  const _0x242728 = normalizeControlType(_0x1677d1);
  if (
    PREVIEW_PARAM_TEXT_TYPE_VALUES['includes'](_0x242728) &&
    previewTextTypeOptionsInclude(_0xa797b7, _0x242728)
  )
    return _0x242728;
  return (
    PREVIEW_PARAM_TEXT_TYPE_VALUES['find']((_0xd2e6c3) =>
      previewTextTypeOptionsInclude(_0xa797b7, _0xd2e6c3),
    ) || ''
  );
}
function renderPreviewTypeBarHtml(_0x1c72a1, { canRemove: canRemove = ![] } = {}) {
  const _0x14bb18 = Number(_0x1c72a1?.['index']);
  if (!Number['isInteger'](_0x14bb18)) return '';
  const _0x368c0a = getPreviewTextTypeOptions(_0x1c72a1),
    _0x48978d = isParamComponent(_0x1c72a1),
    _0x3e011d = isMediaComponent(_0x1c72a1),
    _0x5685e3 = _0x48978d || _0x3e011d,
    _0x35d9af = _0x48978d || normalizeComponentKind(_0x1c72a1?.['componentKind']) === 'prompt',
    _0x37d90d = _0x48978d && canRemove === !![],
    _0x3c48a0 = _0x3e011d && canRemove === !![];
  if (!_0x368c0a['length'] && !_0x5685e3 && !_0x35d9af && !_0x3c48a0) return '';
  const _0x4ca185 =
      normalizeComponentKind(_0x1c72a1['componentKind']) === 'prompt'
        ? 'prompt'
        : normalizeControlType(_0x1c72a1['controlType']),
    _0x27b08c = _0x3e011d ? '入参槽' : '参数',
    _0x44c071 = _0x1c72a1?.['label'] || _0x1c72a1?.['fieldName'] || _0x27b08c,
    _0x124b82 = _0x5685e3
      ? '<button type="button" class="rh-ai-app-preview-typebar-action rh-ai-app-preview-typebar-rename" data-action="rename-preview-param" data-preview-component-index="' +
        _0x14bb18 +
        '" aria-label="重命名' +
        _0x27b08c +
        '\x20' +
        escapeHtml(_0x44c071) +
        '">重命名</button>'
      : '',
    _0x52a130 = _0x35d9af
      ? '<button type="button" class="rh-ai-app-preview-typebar-action rh-ai-app-preview-typebar-remark" data-action="edit-preview-description" data-preview-component-index="' +
        _0x14bb18 +
        '\x22\x20aria-label=\x22修改备注\x20' +
        escapeHtml(_0x44c071) +
        '">改备注</button>'
      : '',
    _0x4ac2fd = _0x368c0a['map'](([_0x34f3bc, _0x27094e]) => {
      const _0x225bfd = String(_0x34f3bc) === _0x4ca185;
      return (
        '<button type="button" class="rh-ai-app-preview-typebar-option ' +
        (_0x225bfd ? 'active' : '') +
        '" data-action="choose-preview-control-type" data-preview-component-index="' +
        _0x14bb18 +
        '" data-value="' +
        escapeHtml(_0x34f3bc) +
        '" aria-pressed="' +
        (_0x225bfd ? 'true' : 'false') +
        '\x22>' +
        escapeHtml(_0x27094e) +
        '</button>'
      );
    })['join'](''),
    _0x2a0583 =
      (_0x37d90d || _0x3c48a0) && !_0x4ac2fd
        ? '<span class="rh-ai-app-preview-typebar-separator" aria-hidden="true">|</span>'
        : '',
    _0x3718dd = _0x3e011d ? 'remove-preview-input' : 'remove-preview-param',
    _0x5b487f =
      _0x37d90d || _0x3c48a0
        ? '<button type="button" class="rh-ai-app-preview-typebar-action rh-ai-app-preview-typebar-delete" data-action="' +
          _0x3718dd +
          '" data-preview-component-index="' +
          _0x14bb18 +
          '" aria-label="删除' +
          _0x27b08c +
          '\x20' +
          escapeHtml(_0x44c071) +
          '">×</button>'
        : '';
  return (
    '<div class="rh-ai-app-preview-typebar" aria-label="组件工具栏">' +
    _0x124b82 +
    _0x52a130 +
    _0x4ac2fd +
    _0x2a0583 +
    _0x5b487f +
    '</div>'
  );
}
function renderFixedTypeLabelHtml(_0x1ab9e6, _0x1b0863 = '') {
  return (
    '<div class="rh-ai-app-component-fixed-type ' +
    _0x1b0863 +
    '" aria-disabled="true">\n    <span>' +
    escapeHtml(_0x1ab9e6) +
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
  const _0x37be6b = String(activeValue || ''),
    _0x567039 = getOptionLabel(options, _0x37be6b),
    _0x472013 = options['map'](([_0x535d3f, _0x5e3e28]) => {
      const _0x2b28b0 = String(_0x535d3f) === _0x37be6b;
      return (
        '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22rh-ai-app-select-option\x20' +
        (_0x2b28b0 ? 'active' : '') +
        '\x22\x20data-action=\x22choose-component-select\x22\x20data-component-prop=\x22' +
        escapeHtml(prop) +
        '" data-value="' +
        escapeHtml(_0x535d3f) +
        '" role="option" aria-selected="' +
        (_0x2b28b0 ? 'true' : 'false') +
        '\x22\x20tabindex=\x22-1\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
        escapeHtml(_0x5e3e28) +
        '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</button>'
      );
    })['join']('');
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
    escapeHtml(_0x567039) +
    '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20viewBox=\x220\x200\x2016\x2016\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22m4\x206\x204\x204\x204-4\x22></path></svg>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-ai-app-select-menu\x22\x20role=\x22listbox\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    _0x472013 +
    '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>'
  );
}
function isMediaComponent(_0x5ba57a) {
  return MEDIA_COMPONENT_KINDS['has'](normalizeComponentKind(_0x5ba57a?.['componentKind']));
}
function isParamComponent(_0x1e8769) {
  return normalizeComponentKind(_0x1e8769?.['componentKind']) === 'param';
}
function getParamComponents(_0x3a5b47 = []) {
  return _0x3a5b47['filter']((_0x15bc35) => {
    if (!_0x15bc35 || !Number['isInteger'](Number(_0x15bc35['index']))) return ![];
    return isParamComponent(_0x15bc35);
  });
}
function getPreviewParamText(_0x3d5647) {
  return String(_0x3d5647?.['label'] || _0x3d5647?.['fieldName'] || '参数')['trim']();
}
function getPreviewResolutionText(_0x261943 = []) {
  const _0x401c85 = getParamComponents(_0x261943)['find']((_0x495f1e) => {
    const _0xb7ca62 = String(_0x495f1e?.['defaultValue'] || '')['trim']();
    return _0xb7ca62 && /^\d+(?:\.\d+)?$/['test'](_0xb7ca62);
  });
  if (!_0x401c85) return '自适应';
  return getPreviewParamText(_0x401c85);
}
function getPreviewInstanceText(_0x47e471) {
  const _0x427e98 = _0x47e471?.['models']?.[0x0]?.['uiSchema']?.['fields'] || [],
    _0x1a79b9 = _0x427e98['find']((_0x5e9cc1) => _0x5e9cc1?.['id'] === 'rhInstanceType');
  if (!_0x1a79b9) return '';
  return getRunningHubInstanceTypeLabel(_0x1a79b9?.['defaultValue']);
}
function normalizeOrderValue(_0x5d9a16, _0x5cbbac) {
  const _0x301706 = Number(_0x5d9a16);
  return Number['isFinite'](_0x301706) ? _0x301706 : _0x5cbbac;
}
function sortComponentsByOrder(_0x3cf87a = [], _0x5ba529) {
  return [..._0x3cf87a]['sort']((_0x8783be, _0x51945f) => {
    const _0x22f40c = Number(_0x8783be?.['index']),
      _0x358eec = Number(_0x51945f?.['index']),
      _0x4e728d = normalizeOrderValue(_0x8783be?.[_0x5ba529], _0x22f40c),
      _0x599269 = normalizeOrderValue(_0x51945f?.[_0x5ba529], _0x358eec);
    if (_0x4e728d !== _0x599269) return _0x4e728d - _0x599269;
    return _0x22f40c - _0x358eec;
  });
}
function getPreviewInputComponents(_0x34f7ae = []) {
  return sortComponentsByOrder(
    _0x34f7ae['filter'](
      (_0x4496d3) =>
        _0x4496d3 && Number['isInteger'](Number(_0x4496d3['index'])) && isMediaComponent(_0x4496d3),
    ),
    'inputOrder',
  );
}
function getInputSlotLabelWidthUnits(_0x5a6f76) {
  if (!_0x5a6f76) return 0x0;
  if (/\s/u['test'](_0x5a6f76)) return 0.5;
  return INPUT_SLOT_LABEL_WIDE_CHAR_RE['test'](_0x5a6f76) ? 0x2 : 0x1;
}
function clampInputSlotLabel(_0x17ea91, _0x20d3eb = INPUT_SLOT_LABEL_MAX_WIDTH_UNITS) {
  let _0x34baea = 0x0,
    _0x2c1853 = '';
  for (const _0x50f59f of Array['from'](String(_0x17ea91 ?? '')['trim']())) {
    const _0x45bdd9 = getInputSlotLabelWidthUnits(_0x50f59f);
    if (_0x34baea + _0x45bdd9 > _0x20d3eb) break;
    ((_0x2c1853 += _0x50f59f), (_0x34baea += _0x45bdd9));
  }
  return _0x2c1853;
}
function normalizeInputSlotLabel(_0x4ca179, _0x428149 = '组件') {
  const _0x29dfae = clampInputSlotLabel(_0x4ca179);
  if (_0x29dfae) return _0x29dfae;
  if (_0x428149 === '') return '';
  return clampInputSlotLabel(_0x428149) || '组件';
}
function getInputSlotLabelClass(_0x4ea1b0) {
  return INPUT_SLOT_LABEL_LATIN_RE['test'](String(_0x4ea1b0 || ''))
    ? '\x20rh-ai-app-preview-input-label--latin'
    : '';
}
function getPreviewHomeParamComponents(_0xab1d3f = []) {
  return getParameterEntries(_0xab1d3f)['flatMap']((_0x5d03e6) => _0x5d03e6['members']);
}
function getPreviewAdvancedParamComponents(_0x3ccaaf = []) {
  const _0x5439b9 = new Set(
    getPreviewHomeParamComponents(_0x3ccaaf)['map']((_0x25e937) => Number(_0x25e937['index'])),
  );
  return sortComponentsByOrder(
    getParamComponents(_0x3ccaaf)['filter']((_0x41a2e0) => !_0x5439b9['has'](Number(_0x41a2e0['index']))),
    'advancedParamOrder',
  );
}
function normalizePromptHelpFieldName(_0x2c4a7f) {
  return String(_0x2c4a7f || '')
    ['trim']()
    ['toLowerCase']();
}
function isPreviewPromptHelpFieldName(_0x228298) {
  const _0x36cb65 = normalizePromptHelpFieldName(_0x228298);
  return PREVIEW_PROMPT_HELP_FIELD_NAMES['some'](
    (_0x541505) => normalizePromptHelpFieldName(_0x541505) === _0x36cb65,
  );
}
function isPreviewPromptHelpTextComponent(_0x47a3ad = {}) {
  const _0x3f99d7 = normalizeControlType(_0x47a3ad['controlType']);
  if (!PREVIEW_TEXT_TYPE_VALUES['includes'](_0x3f99d7)) return ![];
  return [_0x47a3ad['label'], _0x47a3ad['fieldName'], _0x47a3ad['name'], _0x47a3ad['id'], _0x47a3ad['path']][
    'some'
  ](isPreviewPromptHelpFieldName);
}
function getPreviewPromptHelpComponent(_0x45827e = []) {
  return (
    _0x45827e['find']((_0x41968c) => normalizeComponentKind(_0x41968c?.['componentKind']) === 'prompt') ||
    _0x45827e['find'](isPreviewPromptHelpTextComponent) ||
    null
  );
}
function shouldRefreshPreviewPromptForDraft(_0x1422aa, _0x2fe489) {
  if (_0x2fe489 === 'componentKind' || _0x2fe489 === 'controlType' || _0x2fe489 === 'label') return !![];
  if (_0x2fe489 === 'description')
    return (
      normalizeComponentKind(_0x1422aa?.['componentKind']) === 'prompt' ||
      isPreviewPromptHelpTextComponent(_0x1422aa)
    );
  return ![];
}
function buildComponentByIndex(_0x2e9c1a = []) {
  const _0x31e7d1 = new Map();
  return (
    _0x2e9c1a['forEach']((_0x4efb42) => {
      const _0xa17a49 = Number(_0x4efb42?.['index']);
      if (Number['isInteger'](_0xa17a49)) _0x31e7d1['set'](_0xa17a49, _0x4efb42);
    }),
    _0x31e7d1
  );
}
function isPreviewSystemField(_0x1b2ae9 = {}) {
  const _0x4e021c = String(_0x1b2ae9?.['id'] || '')['trim'](),
    _0x36cd4d = String(_0x1b2ae9?.['placement'] || '')['trim']();
  return (
    _0x4e021c === 'rhInstanceType' || _0x36cd4d === 'batch' || _0x1b2ae9?.['comfyUiSystemField'] === !![]
  );
}
function getBundleParamFields(_0x1f71cf) {
  const _0x2885b4 = Array['isArray'](_0x1f71cf?.['models']?.[0x0]?.['uiSchema']?.['fields'])
    ? _0x1f71cf['models'][0x0]['uiSchema']['fields']
    : [];
  return _0x2885b4['filter']((_0x1ec82a) => !isPreviewSystemField(_0x1ec82a));
}
function getCustomAiAppComponentIndex(_0x308b7f = {}) {
  const _0x1b5b43 = Number(_0x308b7f?.['customAiAppComponentIndex']);
  if (Number['isInteger'](_0x1b5b43)) return _0x1b5b43;
  const _0x4f398e = Number(_0x308b7f?.['rhAiAppComponentIndex']);
  if (Number['isInteger'](_0x4f398e)) return _0x4f398e;
  const _0x12f3af = Number(_0x308b7f?.['comfyUiComponentIndex']);
  if (Number['isInteger'](_0x12f3af)) return _0x12f3af;
  return NaN;
}
function getPreviewAdvancedParamFields({ bundle: bundle = null, components: components = [] } = {}) {
  const _0x142904 = new Set(
      getPreviewHomeParamComponents(components)['map']((_0x45da1) => Number(_0x45da1['index'])),
    ),
    _0x581d42 = buildComponentByIndex(components),
    _0x272206 = new Map();
  return getBundleParamFields(bundle)
    ['filter']((_0x2e5328, _0x2a0934) => {
      _0x272206['set'](_0x2e5328, _0x2a0934);
      const _0x2da51b = getCustomAiAppComponentIndex(_0x2e5328);
      if (!Number['isInteger'](_0x2da51b)) return !![];
      if (!_0x581d42['has'](_0x2da51b)) return !![];
      return !_0x142904['has'](_0x2da51b);
    })
    ['sort']((_0x30d891, _0x33a7d8) => {
      const _0x4ed365 = getCustomAiAppComponentIndex(_0x30d891),
        _0x22b863 = getCustomAiAppComponentIndex(_0x33a7d8),
        _0xe20c2 = Number['isInteger'](_0x4ed365) ? _0x581d42['get'](_0x4ed365) : null,
        _0x2b05ec = Number['isInteger'](_0x22b863) ? _0x581d42['get'](_0x22b863) : null,
        _0x11678e = _0xe20c2
          ? normalizeOrderValue(_0xe20c2['advancedParamOrder'], _0x4ed365)
          : normalizeOrderValue(
              _0x30d891?.['displayOrder'],
              _0x272206['get'](_0x30d891) ?? Number['MAX_SAFE_INTEGER'],
            ),
        _0xb2d0bb = _0x2b05ec
          ? normalizeOrderValue(_0x2b05ec['advancedParamOrder'], _0x22b863)
          : normalizeOrderValue(
              _0x33a7d8?.['displayOrder'],
              _0x272206['get'](_0x33a7d8) ?? Number['MAX_SAFE_INTEGER'],
            );
      if (_0x11678e !== _0xb2d0bb) return _0x11678e - _0xb2d0bb;
      return (_0x272206['get'](_0x30d891) ?? 0x0) - (_0x272206['get'](_0x33a7d8) ?? 0x0);
    });
}
function buildPreviewUiSchemaNodeData(_0x2cb120 = null) {
  const _0x170071 = getBundleParamFields(_0x2cb120);
  return {
    model: getCustomAiAppBundleModelId(_0x2cb120),
    generationParams: _0x170071['reduce']((_0x4576b6, _0x3e47c1) => {
      return ((_0x4576b6[_0x3e47c1['id']] = _0x3e47c1['defaultValue']), _0x4576b6);
    }, {}),
  };
}
function renderPreviewBatchControlsHtml(_0x297906 = null) {
  const _0x2bbc42 = getCustomAiAppBundleModelId(_0x297906);
  if (!_0x2bbc42) return '';
  return renderModelUiSchemaControls(_0x2bbc42, buildPreviewUiSchemaNodeData(_0x297906), {
    placement: 'batch',
    variant: 'pillMenu',
  });
}
function renderPreviewInputComponentsHtml(
  _0xa355b5 = [],
  { canRemovePreviewInputs: canRemovePreviewInputs = !![] } = {},
) {
  const _0x5a889d = getPreviewInputComponents(_0xa355b5);
  if (!_0x5a889d['length']) return '';
  return _0x5a889d['map']((_0x586100, _0x54f010) => {
    const _0x57bc92 = normalizeComponentKind(_0x586100['componentKind']),
      _0x52926c = String(
        _0x586100['label'] || _0x586100['fieldName'] || COMPONENT_KIND_LABELS[_0x57bc92] || '组件',
      )['trim'](),
      _0x3aeb1d = normalizeInputSlotLabel(_0x52926c),
      _0x5d4383 = getInputSlotLabelClass(_0x3aeb1d);
    return (
      '\n        <div role="button" tabindex="0" class="rh-ai-app-preview-component rh-ai-app-preview-draggable rh-ai-app-preview-input-slot ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-preview-drag-kind="input" data-preview-component-index="' +
      Number(_0x586100['index']) +
      '" data-preview-order="' +
      _0x54f010 +
      '" aria-label="拖动调整入参顺序：' +
      escapeHtml(_0x52926c || _0x3aeb1d) +
      '">\n          ' +
      renderPreviewTypeBarHtml(_0x586100, { canRemove: canRemovePreviewInputs }) +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22rh-ai-app-preview-input-slot-content\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22ref-upload-label\x20rh-ai-app-preview-rename-target' +
      _0x5d4383 +
      '" data-preview-component-index="' +
      Number(_0x586100['index']) +
      '\x22>' +
      escapeHtml(_0x3aeb1d) +
      '</span>\n          </span>\n        </div>'
    );
  })['join']('');
}
function getPreviewComponentDescription(_0x2a3e14, _0x2ab739 = '参数说明') {
  return (
    String(_0x2a3e14?.['description'] || _0x2a3e14?.['label'] || _0x2a3e14?.['fieldName'] || _0x2ab739)[
      'trim'
    ]() || _0x2ab739
  );
}
function getPreviewBundlePromptHelpTooltip(_0x21aaa9 = null) {
  return String(
    _0x21aaa9?.['models']?.[0x0]?.['help']?.['tooltip'] || _0x21aaa9?.['help']?.['tooltip'] || '',
  )['trim']();
}
function renderPreviewDescriptionTipHtml(
  _0x1fd2c4,
  { className: className = '', ariaLabel: ariaLabel = '编辑参数说明', fallback: fallback = '参数说明' } = {},
) {
  const _0xecd79e = Number(_0x1fd2c4?.['index']);
  if (!Number['isInteger'](_0xecd79e)) return '';
  const _0x4c33ed = getPreviewComponentDescription(_0x1fd2c4, fallback),
    _0x1d6278 = ['rh-tip', 'ui-schema-info-tip', 'rh-ai-app-preview-description-target', className]
      ['filter'](Boolean)
      ['join']('\x20');
  return (
    '<span\x20role=\x22button\x22\x20tabindex=\x220\x22\x20class=\x22' +
    _0x1d6278 +
    '" data-preview-component-index="' +
    _0xecd79e +
    '" data-tooltip="' +
    escapeHtml(_0x4c33ed) +
    '\x22\x20title=\x22' +
    escapeHtml(_0x4c33ed) +
    '\x22\x20aria-label=\x22' +
    escapeHtml(ariaLabel) +
    '">!</span>'
  );
}
function renderPreviewPromptHelpTipHtml(_0x69585c, { bundle: bundle = null } = {}) {
  const _0xffd026 = Number(_0x69585c?.['index']),
    _0x174af4 = Number['isInteger'](_0xffd026),
    _0x4d3f23 =
      getPreviewBundlePromptHelpTooltip(bundle) || getPreviewComponentDescription(_0x69585c, '提示词说明'),
    _0x9e1d79 = ['rh-tip', 'rh-ai-app-preview-description-target', 'rh-ai-app-preview-prompt-help-tip']
      ['filter'](Boolean)
      ['join']('\x20'),
    _0x548e02 = _0x174af4 ? ' data-preview-component-index="' + _0xffd026 + '\x22' : '',
    _0x88e882 = '\x20data-preview-description-scope=\x22prompt-help\x22';
  return (
    '<button type="button" class="' +
    _0x9e1d79 +
    '\x22' +
    _0x548e02 +
    _0x88e882 +
    '\x20data-tooltip=\x22' +
    escapeHtml(_0x4d3f23) +
    '" title="' +
    escapeHtml(_0x4d3f23) +
    '\x22\x20aria-label=\x22编辑提示词说明\x22>!</button>'
  );
}
function isPreviewToggleOn(_0x20984c) {
  if (_0x20984c === !![]) return !![];
  if (_0x20984c === ![]) return ![];
  const _0x132c69 = String(_0x20984c ?? '')
    ['trim']()
    ['toLowerCase']();
  return ['true', '1', 'yes', 'on']['includes'](_0x132c69);
}
function getPreviewToggleLabel(_0x224eb1) {
  return isPreviewToggleOn(_0x224eb1) ? '是' : '否';
}
function renderPreviewHomeParamsHtml(
  _0x176e58 = [],
  _0x1a99d5 = null,
  { canRemovePreviewParams: canRemovePreviewParams = !![] } = {},
) {
  return renderGroupedPreviewParams(_0x176e58, _0x1a99d5, (_0x16e652, _0x28e704) => {
    const _0x123453 = Number(_0x16e652['index']),
      _0x2905b6 = _0x16e652['label'] || _0x16e652['fieldName'] || '参数',
      _0x5f5d4e = normalizeControlType(_0x16e652['controlType']) === 'toggle',
      _0x2257c4 = getPreviewToggleLabel(_0x16e652['defaultValue']),
      _0x3e7240 = _0x5f5d4e ? ' is-toggle' : '',
      _0x12b207 = _0x5f5d4e
        ? '<button type="button" class="rh-ai-app-preview-param-toggle" data-action="toggle-preview-param-default" data-preview-component-index="' +
          _0x123453 +
          '" aria-label="切换 ' +
          escapeHtml(_0x2905b6) +
          '，当前' +
          escapeHtml(_0x2257c4) +
          '"><span class="rh-ai-app-preview-param-toggle-separator" aria-hidden="true">·</span><span class="rh-ai-app-preview-param-toggle-value">' +
          escapeHtml(_0x2257c4) +
          '</span></button>'
        : '';
    return (
      '\n        <div class="img-pill-btn ui-schema-menu-trigger rh-ai-app-preview-component rh-ai-app-preview-draggable rh-ai-app-preview-param-chip' +
      _0x3e7240 +
      '" data-preview-drag-kind="param" data-preview-component-index="' +
      _0x123453 +
      '" data-preview-order="' +
      _0x28e704 +
      '">\n          ' +
      renderPreviewTypeBarHtml(_0x16e652, { canRemove: canRemovePreviewParams }) +
      '\n          <span class="rh-ai-app-preview-rename-target rh-ai-app-preview-param-label" data-preview-component-index="' +
      _0x123453 +
      '\x22>' +
      escapeHtml(_0x2905b6) +
      '</span>\n          ' +
      _0x12b207 +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22rh-ai-app-preview-drag-pad\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>'
    );
  });
}
function renderPreviewAdvancedPanelHtml({ components: components = [], bundle: bundle = null } = {}) {
  const _0xe41264 = getPreviewAdvancedParamFields({ bundle: bundle, components: components }),
    _0x520955 = _0xe41264['length'] > 0x0 || getParamComponents(components)['length'] > 0x0;
  if (!_0x520955) return '';
  const _0x57e974 = buildPreviewUiSchemaNodeData(bundle),
    _0x3637db = _0xe41264['length'] ? '' : ' is-empty';
  return (
    '\n    <div class="rh-adv-panel show rh-ai-app-preview-advanced-panel' +
    _0x3637db +
    '" data-preview-zone="advanced">\n      ' +
    (_0xe41264['length']
      ? renderUiSchemaFields(_0xe41264, _0x57e974, { placement: 'advanced' })
      : '<div class="rh-ai-app-preview-advanced-empty">拖回这里可放回高级设置</div>') +
    '\n    </div>'
  );
}
function renderControlTypeOptionsHtml(_0xa80996) {
  return renderOptionsHtml(CONTROL_TYPE_OPTIONS, normalizeControlType(_0xa80996));
}
function renderDefaultValueInputHtml(_0x10fea6, _0x421949) {
  const _0x2b49c0 = String(_0x10fea6['defaultValue'] ?? '');
  if (_0x421949 === 'toggle') {
    const _0xf4e0d7 = String(_0x2b49c0)['trim']()['toLowerCase']() === 'true' ? 'true' : 'false';
    return renderComponentSelectHtml({
      className: 'rh-ai-app-component-default',
      ariaLabel: '默认值',
      prop: 'defaultValue',
      options: [
        ['true', 'true'],
        ['false', 'false'],
      ],
      activeValue: _0xf4e0d7,
    });
  }
  const _0x12837d = _0x421949 === 'stepper' || _0x421949 === 'float' ? 'number' : 'text',
    _0x3fc3cd = _0x421949 === 'stepper' ? ' step="1"' : _0x421949 === 'float' ? ' step="any"' : '';
  return (
    '<input\x20type=\x22' +
    _0x12837d +
    '\x22' +
    _0x3fc3cd +
    '\x20class=\x22rh-ai-app-component-default\x22\x20aria-label=\x22默认值\x22\x20data-component-prop=\x22defaultValue\x22\x20value=\x22' +
    escapeHtml(_0x2b49c0) +
    '\x22>'
  );
}
function getNextHomeParamOrder(_0x509ed7 = []) {
  return Math['min'](
    getPreviewHomeParamComponents(_0x509ed7)['length'],
    PREVIEW_CUSTOM_COMPONENT_LIMIT - 0x1,
  );
}
function assignSequentialOrder(_0x4508c0 = [], _0x108968) {
  _0x4508c0['forEach']((_0x3c60e1, _0x408b51) => {
    _0x3c60e1[_0x108968] = _0x408b51;
  });
}
function getComponentByIndex(_0x3cc570 = [], _0x15ff13) {
  return _0x3cc570['find']((_0x342fa0) => Number(_0x342fa0?.['index']) === Number(_0x15ff13)) || null;
}
function getComfyComponentDraftKey(_0x1925eb = {}) {
  const _0x4d6794 = String(_0x1925eb?.['componentKey'] || '')['trim']();
  if (_0x4d6794) return _0x4d6794;
  return [_0x1925eb?.['nodeId'], _0x1925eb?.['classType'], _0x1925eb?.['inputName']]
    ['map']((_0x590a9f) =>
      String(_0x590a9f || '')
        ['trim']()
        ['toLowerCase'](),
    )
    ['join']('::');
}
function mergeComfyComponentDraft(_0x5d10a1 = {}, _0x30d27a = {}) {
  const _0x542f67 = { ..._0x5d10a1 };
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
    ]['forEach']((_0x204046) => {
      if (Object['hasOwn'](_0x30d27a, _0x204046)) _0x542f67[_0x204046] = _0x30d27a[_0x204046];
    }),
    _0x5d10a1['componentKindLocked'] !== !![] &&
      Object['hasOwn'](_0x30d27a, 'componentKind') &&
      (_0x542f67['componentKind'] = _0x30d27a['componentKind']),
    _0x5d10a1['controlTypeLocked'] !== !![] &&
      Object['hasOwn'](_0x30d27a, 'controlType') &&
      (_0x542f67['controlType'] = _0x30d27a['controlType']),
    _0x542f67
  );
}
function preserveComfyComponentDrafts(_0x1a3023 = [], _0x4f9ca2 = []) {
  const _0x13b18d = new Map(),
    _0x16c96b = new Map();
  _0x4f9ca2['forEach']((_0x207597) => {
    const _0x5f3032 = Number(_0x207597?.['index']);
    if (Number['isInteger'](_0x5f3032)) _0x13b18d['set'](_0x5f3032, _0x207597);
    const _0x2b7f6f = getComfyComponentDraftKey(_0x207597);
    if (_0x2b7f6f) _0x16c96b['set'](_0x2b7f6f, _0x207597);
  });
  const _0x5b127a = new Set();
  return cloneComponentDrafts(_0x1a3023)
    ['map']((_0x589271) => {
      const _0x3c53cb = getComfyComponentDraftKey(_0x589271),
        _0x4bfc95 = _0x3c53cb ? _0x16c96b['get'](_0x3c53cb) : null,
        _0x57cd98 = _0x13b18d['get'](Number(_0x589271?.['index'])),
        _0x93441d = _0x4bfc95 || _0x57cd98 || null,
        _0x283fcc = Number(_0x93441d?.['index']);
      if (!_0x93441d || _0x5b127a['has'](_0x283fcc)) return null;
      return (_0x5b127a['add'](_0x283fcc), mergeComfyComponentDraft(_0x93441d, _0x589271));
    })
    ['filter'](Boolean);
}
function moveComponentToOrder(_0xa45aa9 = [], _0x31410f, _0x173402, _0x49598a) {
  const _0xc95db0 = getComponentByIndex(_0xa45aa9, _0x31410f);
  if (!_0xc95db0) return ![];
  const _0x26b2b8 = sortComponentsByOrder(_0xa45aa9, _0x173402)['filter'](
      (_0x9813b1) => Number(_0x9813b1['index']) !== Number(_0x31410f),
    ),
    _0x5b5e00 = Math['max'](0x0, Math['min'](_0x26b2b8['length'], Number(_0x49598a) || 0x0));
  return (_0x26b2b8['splice'](_0x5b5e00, 0x0, _0xc95db0), assignSequentialOrder(_0x26b2b8, _0x173402), !![]);
}
function renderSavedAppsMenuHtml({
  savedApps: savedApps = [],
  pendingDeleteSavedAppId: pendingDeleteSavedAppId = '',
  pendingOverwriteSavedAppId: pendingOverwriteSavedAppId = '',
  pendingOverwriteIntent: pendingOverwriteIntent = '',
} = {}) {
  if (!savedApps['length']) return '<div\x20class=\x22rh-ai-app-saved-app-empty\x22>暂无已保存子应用</div>';
  return savedApps['map']((_0x595eaa) => {
    const _0x1e4e7c = String(_0x595eaa['id'] || ''),
      _0x543a89 = normalizeAppName(_0x595eaa['name']);
    if (_0x1e4e7c === pendingDeleteSavedAppId)
      return (
        '\n          <div class="rh-ai-app-saved-app-row is-confirming" data-saved-app-id="' +
        escapeHtml(_0x1e4e7c) +
        '">\n            <div class="rh-ai-app-saved-app-confirm-text">是否删除「' +
        escapeHtml(_0x543a89) +
        '」？</div>\n            <div class="rh-ai-app-saved-app-confirm-actions">\n              <button type="button" data-action="confirm-delete-app" data-saved-app-id="' +
        escapeHtml(_0x1e4e7c) +
        '">删除</button>\n              <button type="button" data-action="cancel-delete-app">取消</button>\n            </div>\n          </div>'
      );
    if (_0x1e4e7c === pendingOverwriteSavedAppId) {
      const _0x9c45c1 = pendingOverwriteIntent === 'create' ? '覆盖后继续生成节点。' : '覆盖后保存当前配置。';
      return (
        '\n          <div class="rh-ai-app-saved-app-row is-confirming is-overwrite-confirming" data-saved-app-id="' +
        escapeHtml(_0x1e4e7c) +
        '">\n            <div class="rh-ai-app-saved-app-confirm-text">已存在同名应用「' +
        escapeHtml(_0x543a89) +
        '」，是否覆盖？</div>\n            <div class="rh-ai-app-saved-app-confirm-note">' +
        escapeHtml(_0x9c45c1) +
        '</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-ai-app-saved-app-confirm-actions\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20data-action=\x22confirm-overwrite-app\x22\x20data-saved-app-id=\x22' +
        escapeHtml(_0x1e4e7c) +
        '">覆盖</button>\n              <button type="button" data-action="cancel-overwrite-app">取消</button>\n            </div>\n          </div>'
      );
    }
    const _0xecfdfb = OUTPUT_KIND_LABELS[_0x595eaa['kind']] || _0x595eaa['kind'] || '',
      _0x1f9c73 = normalizeSourceType(_0x595eaa['sourceType']) || SOURCE_TYPES['runninghub'],
      _0x1ff80e = isComfyUiSource(_0x1f9c73)
        ? getComfyUiBaseUrlModeLabel(_0x1f9c73)
        : getRunningHubProfileShortLabel(_0x595eaa['runningHubProfileId']),
      _0x2559de = [_0xecfdfb, _0x1ff80e]['filter'](Boolean)['join'](' · ');
    return (
      '\n        <div class="rh-ai-app-saved-app-row" data-saved-app-id="' +
      escapeHtml(_0x1e4e7c) +
      '">\n          <button type="button" class="rh-ai-app-saved-app-item" data-action="load-saved-app" data-saved-app-id="' +
      escapeHtml(_0x1e4e7c) +
      '">\n            <span>' +
      escapeHtml(_0x543a89) +
      '</span>\n            <small>' +
      escapeHtml(_0x2559de) +
      '</small>\n          </button>\n          <button type="button" class="rh-ai-app-saved-app-delete" data-action="request-delete-app" data-saved-app-id="' +
      escapeHtml(_0x1e4e7c) +
      '" aria-label="删除 ' +
      escapeHtml(_0x543a89) +
      '">×</button>\n        </div>'
    );
  })['join']('');
}
function renderSaveConfigOverwriteMenuHtml({ savedApp: savedApp = null, intent: intent = 'save' } = {}) {
  const _0x1fd278 = String(savedApp?.['id'] || '')['trim']();
  if (!_0x1fd278) return '';
  const _0x42c842 = normalizeAppName(savedApp['name']),
    _0x17763c = intent === 'create' ? '覆盖后继续生成节点。' : '覆盖后保存当前配置。';
  return (
    '\n    <div class="rh-ai-app-save-config-overwrite" data-saved-app-id="' +
    escapeHtml(_0x1fd278) +
    '">\n      <div class="rh-ai-app-saved-app-confirm-text">已存在同名应用「' +
    escapeHtml(_0x42c842) +
    '」，是否覆盖？</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-ai-app-saved-app-confirm-note\x22>' +
    escapeHtml(_0x17763c) +
    '</div>\n      <div class="rh-ai-app-saved-app-confirm-actions">\n        <button type="button" data-action="confirm-overwrite-app" data-saved-app-id="' +
    escapeHtml(_0x1fd278) +
    '\x22>覆盖</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20data-action=\x22cancel-overwrite-app\x22>取消</button>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>'
  );
}
function getComfyUiCandidateSearchText(_0x12e772 = {}) {
  return [
    _0x12e772['label'],
    _0x12e772['nodeId'],
    _0x12e772['nodeTitle'],
    _0x12e772['classType'],
    _0x12e772['inputName'],
  ]
    ['map']((_0x107205) =>
      String(_0x107205 || '')
        ['trim']()
        ['toLowerCase'](),
    )
    ['filter'](Boolean)
    ['join']('\x20');
}
function filterComfyUiCandidates(_0x18ca77 = [], _0x282fd7 = new Set(), _0x30eb76 = '') {
  const _0x44596e = String(_0x30eb76 || '')
    ['trim']()
    ['toLowerCase']();
  return (Array['isArray'](_0x18ca77) ? _0x18ca77 : [])['filter']((_0x4ef413) => {
    const _0x27a1ea = Number(_0x4ef413?.['index']);
    if (!Number['isInteger'](_0x27a1ea) || _0x282fd7['has'](_0x27a1ea)) return ![];
    return !_0x44596e || getComfyUiCandidateSearchText(_0x4ef413)['includes'](_0x44596e);
  });
}
function getComfyUiCandidateDefaultComponentName(_0x30d3cc = {}) {
  return formatComfyUiComponentLabel(_0x30d3cc);
}
function getComfyUiCandidateMenuMeta(_0x177a29 = {}) {
  return (
    [
      _0x177a29['nodeId'],
      _0x177a29['classType'],
      _0x177a29['inputName'],
      '默认值：' + (String(_0x177a29['defaultValue'] ?? _0x177a29['value'] ?? '') || '（空）'),
    ]
      ['filter']((_0x2b9b7c) => String(_0x2b9b7c || '')['trim']())
      ['join'](' / ') || getComfyUiCandidateDefaultComponentName(_0x177a29)
  );
}
function renderComfyUiCandidateMenuHtml(_0x14b29f = [], _0x13e3af = new Set(), _0x41901f = '') {
  const _0x313a4e = (Array['isArray'](_0x14b29f) ? _0x14b29f : [])['filter']((_0x191236) => {
      const _0x4d17bc = Number(_0x191236?.['index']);
      return Number['isInteger'](_0x4d17bc) && !_0x13e3af['has'](_0x4d17bc);
    }),
    _0x55ecf3 = filterComfyUiCandidates(_0x14b29f, _0x13e3af, _0x41901f);
  if (!_0x313a4e['length']) return '<div class="rh-ai-app-candidate-empty">暂无可添加组件</div>';
  if (!_0x55ecf3['length']) return '<div class="rh-ai-app-candidate-empty">没有匹配的节点输入</div>';
  const _0x505372 = _0x55ecf3['map']((_0x8026e4) => {
    const _0x445d82 = Number(_0x8026e4['index']),
      _0x2c4510 = getComfyUiCandidateDefaultComponentName(_0x8026e4),
      _0x2b18f5 = getComfyUiCandidateMenuMeta(_0x8026e4),
      _0xd8bf88 = _0x2b18f5
        ? '<span class="rh-ai-app-candidate-meta">' + escapeHtml(_0x2b18f5) + '</span>'
        : '';
    return (
      '\n        <button type="button" class="rh-ai-app-candidate-option" data-action="choose-comfy-candidate" data-component-index="' +
      _0x445d82 +
      '">\n          <span class="rh-ai-app-candidate-topline">\n            <span class="rh-ai-app-candidate-title">' +
      escapeHtml(_0x2c4510) +
      '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      _0xd8bf88 +
      '\n          </span>\n        </button>'
    );
  })['join']('');
  return '<div class="rh-ai-app-candidate-options">' + _0x505372 + '</div>';
}
function renderComfyUiComponentAddPanelHtml({
  show: show = ![],
  canAdd: canAdd = !![],
  hasComponents: hasComponents = ![],
  emptyText: emptyText = '',
  isOpen: isOpen = ![],
  searchText: searchText = '',
} = {}) {
  if (!show) return '';
  const _0x24962d = hasComponents
      ? '继续选择工作流输入，新增组件会直接加入节点组件编辑。'
      : emptyText || '点击添加组件，逐行选择要暴露到节点上的工作流输入。',
    _0x45d218 = isOpen ? '收起组件' : '点击添加组件',
    _0x32f584 = canAdd ? '' : ' disabled';
  return (
    '\n    <div class="rh-ai-app-comfy-add-panel ' +
    (isOpen ? 'is-open' : '') +
    '">\n      <div class="rh-ai-app-comfy-add-panel-head">\n        <button type="button" class="rh-ai-app-secondary rh-ai-app-add-component" data-action="toggle-comfy-candidate-select" aria-expanded="' +
    (isOpen ? 'true' : 'false') +
    '\x22' +
    _0x32f584 +
    '>' +
    _0x45d218 +
    '</button>\n        <div class="rh-ai-app-comfy-head-slot">\n          <div class="rh-ai-app-comfy-add-hint">' +
    escapeHtml(_0x24962d) +
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
  isOpen: isOpen = ![],
  pendingDeleteSavedAppId: pendingDeleteSavedAppId = '',
  pendingOverwriteSavedAppId: pendingOverwriteSavedAppId = '',
  pendingOverwriteIntent: pendingOverwriteIntent = '',
  sourceLabel: sourceLabel = 'RH AI应用',
} = {}) {
  if (!isOpen) return '';
  const _0x86dd46 = normalizeAppName(appName);
  return (
    '\n    <div class="rh-ai-app-preview-app-menu" data-role="saved-app-menu">\n      <div class="rh-ai-app-preview-app-menu-title">' +
    escapeHtml(sourceLabel) +
    '</div>\n      <div class="rh-ai-app-current-app-row">\n        <button type="button" class="rh-ai-app-current-app-item active" data-action="rename-current-app">\n          <span>' +
    escapeHtml(_0x86dd46) +
    '</span>\n          <small>当前创建</small>\n        </button>\n      </div>\n      <div class="rh-ai-app-preview-app-menu-subtitle">已保存子应用</div>\n      ' +
    renderSavedAppsMenuHtml({
      savedApps: savedApps,
      pendingDeleteSavedAppId: pendingDeleteSavedAppId,
      pendingOverwriteSavedAppId: pendingOverwriteSavedAppId,
      pendingOverwriteIntent: pendingOverwriteIntent,
    }) +
    '\x0a\x20\x20\x20\x20</div>'
  );
}
function renderRhAiAppNodePreviewHtml({
  components: components = [],
  kind: kind = 'image',
  bundle: bundle = null,
  appName: appName = DEFAULT_AI_APP_NAME,
  savedApps: savedApps = [],
  isAppMenuOpen: isAppMenuOpen = ![],
  pendingDeleteSavedAppId: pendingDeleteSavedAppId = '',
  pendingOverwriteSavedAppId: pendingOverwriteSavedAppId = '',
  pendingOverwriteIntent: pendingOverwriteIntent = '',
  sourceLabel: sourceLabel = 'RH\x20AI应用',
  runningHubProfileLabel: runningHubProfileLabel = '',
  showComfyAddPanel: showComfyAddPanel = ![],
  canAddComfyComponents: canAddComfyComponents = !![],
  comfyCandidatePickerOpen: comfyCandidatePickerOpen = ![],
  comfyCandidateSearchText: comfyCandidateSearchText = '',
  comfyCandidateEmptyText: comfyCandidateEmptyText = '',
  canRemovePreviewParams: canRemovePreviewParams = !![],
  canRemovePreviewInputs: canRemovePreviewInputs = !![],
} = {}) {
  const _0x4aed9b = components['find'](
      (_0x1f4213) => normalizeComponentKind(_0x1f4213?.['componentKind']) === 'prompt',
    ),
    _0x4ca95e = getPreviewPromptHelpComponent(components),
    _0xf6efcb = (_0x4aed9b || _0x4ca95e)?.['label']
      ? '填写' + (_0x4aed9b || _0x4ca95e)['label'] + '，按 @ 引用素材，/呼出指令...'
      : '描述' + (OUTPUT_KIND_LABELS[kind] || '生成') + '内容，按\x20@\x20引用素材，/呼出指令...',
    _0x4d707d = Number(_0x4aed9b?.['index']),
    _0x1f0810 = Number['isInteger'](_0x4d707d) ? ' data-preview-component-index="' + _0x4d707d + '\x22' : '',
    _0x5ccb73 = Number['isInteger'](_0x4d707d) ? ' rh-ai-app-preview-prompt-target' : '',
    _0x2d57b3 =
      _0x4aed9b && canPreviewPromptBecomeParam(_0x4aed9b)
        ? '\x20rh-ai-app-preview-draggable\x20rh-ai-app-preview-prompt-draggable'
        : '',
    _0x440ed5 = _0x4aed9b && canPreviewPromptBecomeParam(_0x4aed9b) ? ' data-preview-drag-kind="prompt"' : '',
    _0x130a55 = getPreviewInstanceText(bundle),
    _0x3baa36 = renderPreviewBatchControlsHtml(bundle),
    _0x3baaff = renderComfyUiComponentAddPanelHtml({
      show: showComfyAddPanel,
      canAdd: canAddComfyComponents,
      hasComponents: components['length'] > 0x0,
      emptyText: comfyCandidateEmptyText,
      isOpen: canAddComfyComponents && comfyCandidatePickerOpen === !![],
      searchText: comfyCandidateSearchText,
    });
  return (
    '\x0a\x20\x20\x20\x20' +
    _0x3baaff +
    '\n    <div class="rh-ai-app-node-preview-card rh-ai-app-preview-node" data-preview-node-kind="' +
    escapeHtml(kind) +
    '">\n      <div class="text-prompt-panel rh-ai-app-real-preview-panel" data-role="preview-canvas">\n        ' +
    renderPreviewPromptHelpTipHtml(_0x4ca95e, { bundle: bundle }) +
    '\n        <div class="node-ref-bar active rh-v5-refbar rh-ai-app-preview-input-zone" data-preview-zone="input">\n          ' +
    renderPreviewInputComponentsHtml(components, { canRemovePreviewInputs: canRemovePreviewInputs }) +
    '\n        </div>\n        <div class="prompt-input-wrapper rh-ai-app-preview-input rh-ai-app-preview-prompt-zone' +
    _0x5ccb73 +
    _0x2d57b3 +
    '" data-preview-zone="prompt"' +
    _0x1f0810 +
    _0x440ed5 +
    '>\n          ' +
    (_0x4aed9b ? renderPreviewTypeBarHtml(_0x4aed9b, { canRemove: canRemovePreviewParams }) : '') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22prompt-textarea\x20rh-ai-app-preview-prompt\x22\x20data-placeholder=\x22' +
    escapeHtml(_0xf6efcb) +
    '"></div>\n        </div>\n        <div class="prompt-panel-footer">\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              <button type="button" class="img-pill-btn img-model-btn-trigger rh-ai-app-preview-model-trigger" data-action="toggle-app-menu" title="单击打开 ' +
    escapeHtml(sourceLabel) +
    '\x20菜单，双击修改名字\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20class=\x22image-model-trigger-icon\x22\x20src=\x22images/RH.png\x22\x20alt=\x22\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22rh-ai-app-preview-runtime-badge\x22\x20data-role=\x22preview-runninghub-runtime-label\x22' +
    (runningHubProfileLabel ? '' : ' hidden') +
    '>' +
    escapeHtml(runningHubProfileLabel) +
    '</span>\n                <span class="img-model-label">' +
    escapeHtml(normalizeAppName(appName)) +
    '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderPreviewAppMenuHtml({
      appName: appName,
      savedApps: savedApps,
      isOpen: isAppMenuOpen,
      pendingDeleteSavedAppId: pendingDeleteSavedAppId,
      pendingOverwriteSavedAppId: pendingOverwriteSavedAppId,
      pendingOverwriteIntent: pendingOverwriteIntent,
      sourceLabel: sourceLabel,
    }) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22ui-schema-placement\x20rh-ai-app-preview-param-zone\x22\x20data-preview-zone=\x22params\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderPreviewHomeParamsHtml(components, bundle, { canRemovePreviewParams: canRemovePreviewParams }) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22prompt-actions\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22rh-adv-wrap\x20rh-ai-app-preview-adv-wrap\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20rh-adv-btn\x22\x20tabindex=\x22-1\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22rh-adv-btn-label\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22ui-schema-placement\x20ui-schema-instance-slot\x22' +
    (_0x130a55 ? '' : ' hidden') +
    '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20rh-vram-btn\x22\x20tabindex=\x22-1\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22rh-vram-label\x22>' +
    escapeHtml(_0x130a55) +
    '</span>\n              </button>\n            </div>\n            <div class="ui-schema-placement ui-schema-batch-slot"' +
    (_0x3baa36 ? '' : ' hidden') +
    '>\n              ' +
    _0x3baa36 +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22prompt-submit\x20img-gen-btn\x22\x20tabindex=\x22-1\x22\x20aria-label=\x22生成\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20aria-hidden=\x22true\x22><line\x20x1=\x2212\x22\x20y1=\x2219\x22\x20x2=\x2212\x22\x20y2=\x225\x22></line><polyline\x20points=\x225\x2012\x2012\x205\x2019\x2012\x22></polyline></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderPreviewAdvancedPanelHtml({ components: components, bundle: bundle }) +
    '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>'
  );
}
function renderAppNameConfigHtml(_0x391a3e = DEFAULT_AI_APP_NAME, _0x30e59b = '') {
  return (
    '\x0a\x20\x20\x20\x20<div\x20class=\x22rh-ai-app-component-row\x20rh-ai-app-app-name-row\x22>\x0a\x20\x20\x20\x20\x20\x20<label\x20class=\x22rh-ai-app-meta-field\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22rh-ai-app-component-static-label\x22>AI应用名称</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<input\x20type=\x22text\x22\x20class=\x22rh-ai-app-name-input\x22\x20aria-label=\x22AI应用名称\x22\x20data-app-prop=\x22appName\x22\x20value=\x22' +
    escapeHtml(_0x391a3e) +
    '">\n      </label>\n      <label class="rh-ai-app-meta-field">\n        <span class="rh-ai-app-component-static-label">简介</span>\n        <input type="text" class="rh-ai-app-description-input" aria-label="简介" data-app-prop="appDescription" value="' +
    escapeHtml(_0x30e59b) +
    '" placeholder="填写应用简介">\n      </label>\n    </div>'
  );
}
function renderComponentConfigHtml(
  _0x239a98 = [],
  _0x373d7b = DEFAULT_AI_APP_NAME,
  _0x22e031 = '',
  _0x3fcf2a = {},
) {
  return renderAppNameConfigHtml(_0x373d7b, _0x22e031);
}
class RunningHubAiAppManager {
  constructor() {
    ((this['panel'] = null),
      (this['button'] = null),
      (this['textarea'] = null),
      (this['builderEl'] = null),
      (this['sourceSelectEl'] = null),
      (this['workbenchEl'] = null),
      (this['bodyEl'] = null),
      (this['kindTabsEl'] = null),
      (this['sourceBackBtn'] = null),
      (this['nodePreviewEl'] = null),
      (this['componentListEl'] = null),
      (this['componentPickerEl'] = null),
      (this['summaryEl'] = null),
      (this['errorEl'] = null),
      (this['saveBtn'] = null),
      (this['saveConfigMenuEl'] = null),
      (this['createConfigMenuEl'] = null),
      (this['createBtn'] = null),
      (this['runtimeToggleEl'] = null),
      (this['runningHubRuntimeToggleEl'] = null),
      (this['sourceType'] = ''),
      (this['definitionReference'] = ''),
      (this['definitionController'] = createRhAiAppDefinitionController(this)),
      (this['kind'] = 'image'),
      (this['runningHubProfileId'] = getDefaultRunningHubProfileId()),
      (this['appName'] = DEFAULT_AI_APP_NAME),
      (this['appDescription'] = ''),
      (this['promptHelpTooltip'] = ''),
      (this['savedAppId'] = ''),
      (this['currentBundle'] = null),
      (this['componentDrafts'] = []),
      (this['componentCandidates'] = []),
      (this['componentDraftKey'] = ''),
      (this['comfyCandidateSearchText'] = ''),
      (this['comfyCandidatePickerOpen'] = ![]),
      (this['workflowInputCollapsed'] = ![]),
      (this['errorMessage'] = ''),
      (this['configRepository'] = createRhAiAppConfigRepository({
        getSnapshot: () => this['_getConfigRepositorySnapshot'](),
        applyExternalSnapshot: (_0x46b85f) => this['_applyExternalStoragePayload'](_0x46b85f),
      })));
    const _0xb5bd78 = this['configRepository']['loadLocalSeed']();
    this['kindStates'] = this['configRepository']['createInitialKindStates']();
    const _0x59af39 = _0xb5bd78['panelDraft'];
    _0x59af39 &&
      ((this['sourceType'] = _0x59af39['sourceType'] || ''),
      (this['kind'] = _0x59af39['kind']),
      (this['kindStates'] = _0x59af39['kindStates']));
    ((this['savedApps'] = _0xb5bd78['savedApps']),
      (this['localStorageSeedHasData'] = _0xb5bd78['hasData']),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      (this['parseTimer'] = 0x0),
      (this['saveSuccessTimer'] = 0x0),
      (this['sourceViewAnimationTimer'] = 0x0),
      (this['sourceViewTransitionDirection'] = ''),
      (this['workflowJsonDragDepth'] = 0x0),
      (this['registeredBundleKeys'] = new Set()),
      (this['nodeBundleRegistry'] = createCustomAiAppNodeBundleRegistry({
        registerBundle: (_0x19cab5, _0x35a157) =>
          registerCustomAiAppBundle(_0x19cab5, this['registeredBundleKeys'], _0x35a157),
        unregisterBundle: (_0x4912ff) => unregisterCustomAiAppBundle(_0x4912ff, this['registeredBundleKeys']),
        isBundleRegistered: (_0x57f2eb) => this['registeredBundleKeys']['has'](_0x57f2eb),
      })),
      (this['unsubscribeNodes'] = null),
      (this['previewPresentation'] = createRhAiAppPreviewPresentation({
        readState: () => ({
          nodePreviewEl: this['nodePreviewEl'],
          componentDrafts: this['componentDrafts'],
          kind: this['kind'],
          currentBundle: this['currentBundle'],
          appName: this['appName'],
          runningHubProfileLabel: this['_isRunningHubAiAppSource']()
            ? getRunningHubProfileShortLabel(this['runningHubProfileId'])
            : '',
          previewAppMenuOpen: this['previewAppMenuOpen'],
          pendingDeleteSavedAppId: this['pendingDeleteSavedAppId'],
          pendingOverwriteSavedAppId: this['pendingOverwriteSavedAppId'],
          pendingOverwriteIntent: this['pendingOverwriteIntent'],
          componentDraftKey: this['componentDraftKey'],
          comfyCandidatePickerOpen: this['comfyCandidatePickerOpen'],
          comfyCandidateSearchText: this['comfyCandidateSearchText'],
          saveConfigMenuEl: this['saveConfigMenuEl'],
          createConfigMenuEl: this['createConfigMenuEl'],
        }),
        writeState: (_0x3c0e83) => Object['assign'](this, _0x3c0e83),
        actions: {
          getSavedAppsForKind: () => this['_getSavedAppsForKind'](),
          getSourceMeta: () => this['_getSourceMeta'](),
          syncRunningHubProfileBadge: (_0x16848c) =>
            syncRunningHubProfileBadge(
              _0x16848c,
              this['runningHubProfileId'],
              this['_isRunningHubAiAppSource'](),
            ),
          shouldShowManualComponentPicker: () => this['_shouldShowManualComponentPicker'](),
          canRemovePreviewParams: () => this['_canRemovePreviewParams'](),
          canRemovePreviewInputs: () => this['_canRemovePreviewInputs'](),
          renderComfyCandidatePicker: (_0xc5d326) => this['_renderComfyCandidatePicker'](_0xc5d326),
          findSavedApp: (_0x48c686) => this['_findSavedApp'](_0x48c686),
          commitPreviewUiSchemaValue: (_0x6136dc, _0x3e78c6) =>
            this['_commitPreviewUiSchemaValue'](_0x6136dc, _0x3e78c6),
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
      (this['previewDragController'] = createRhAiAppPreviewDragController({
        readState: () => ({
          panel: this['panel'],
          nodePreviewEl: this['nodePreviewEl'],
          componentDrafts: this['componentDrafts'],
        }),
        actions: {
          getPreviewZoneElement: (_0x283e93) =>
            this['previewPresentation']['_getPreviewZoneElement'](_0x283e93),
          isPreviewControlTarget: (_0x51839b) => this['_isPreviewControlTarget'](_0x51839b),
          startPreviewInlineRename: (_0xd87bb0, _0xb647fd) =>
            this['_startPreviewInlineRename'](_0xd87bb0, _0xb647fd),
          refreshBundleFromComponents: (_0x2087e9) => this['_refreshBundleFromComponents'](_0x2087e9),
          patchPreviewWithoutRebuild: (_0x3b776a, _0xbd71a9) =>
            this['_patchPreviewWithoutRebuild'](_0x3b776a, _0xbd71a9),
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
      (this['contextMenuController'] = createRunningHubAiAppContextMenuController({
        getPanel: () => this['panel'],
        beforeOpen: () => this['_closeInlineMenusBeforeContextMenu'](),
      })),
      this['_createPanel'](),
      this['previewDragController']['bindGroups'](),
      this['_syncSourceView']());
    if (this['sourceType']) this['_restoreKindState'](this['kind']);
    (this['_bindButton'](),
      this['_bindGlobalEvents'](),
      this['_registerSavedAppBundles'](),
      this['_watchExistingNodeBundles'](),
      void this['_hydrateExternalStorage']());
  }
  ['_createPanel']() {
    ((this['panel'] = document['createElement']('section')),
      (this['panel']['className'] = 'rh-ai-app-panel'),
      this['panel']['setAttribute']('aria-label', '自定义AI应用'),
      this['panel']['setAttribute']('aria-hidden', 'true'),
      (this['panel']['innerHTML'] =
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
    const _0x25f377 = document['body'] || document['documentElement'];
    (_0x25f377['appendChild'](this['panel']),
      (this['bodyEl'] = this['panel']['querySelector']('.rh-ai-app-body')),
      (this['sourceSelectEl'] = this['panel']['querySelector']('[data-role=\x27source-select\x27]')),
      (this['workbenchEl'] = this['panel']['querySelector']('[data-role=\x27workbench\x27]')),
      (this['kindTabsEl'] = this['panel']['querySelector']('.rh-ai-app-kind-tabs')),
      (this['sourceBackBtn'] = this['panel']['querySelector']("[data-action='back-to-source-types']")),
      (this['workflowInputFieldEl'] = this['panel']['querySelector'](
        '[data-role=\x27workflow-input-field\x27]',
      )),
      (this['workflowInputSummaryEl'] = this['panel']['querySelector'](
        "[data-role='workflow-input-summary']",
      )),
      (this['runtimeToggleEl'] = this['panel']['querySelector']("[data-role='comfyui-runtime-toggle']")),
      (this['runningHubRuntimeToggleEl'] = this['panel']['querySelector'](
        "[data-role='runninghub-runtime-toggle']",
      )),
      (this['workflowInputToggleBtn'] = this['panel']['querySelector'](
        '[data-action=\x27toggle-workflow-input\x27]',
      )),
      (this['textarea'] = this['panel']['querySelector']('.rh-ai-app-input')),
      (this['builderEl'] = this['panel']['querySelector']("[data-role='builder']")),
      (this['nodePreviewEl'] = this['panel']['querySelector']("[data-role='node-preview']")),
      (this['componentListEl'] = this['panel']['querySelector']("[data-role='components']")),
      (this['componentPickerEl'] = this['panel']['querySelector']("[data-role='comfyui-candidate-menu']")),
      (this['summaryEl'] = this['panel']['querySelector']('[data-role=\x27summary\x27]')),
      (this['errorEl'] = this['panel']['querySelector']('[data-role=\x27error\x27]')),
      (this['saveBtn'] = this['panel']['querySelector']('[data-action=\x27save-config\x27]')),
      (this['saveConfigMenuEl'] = this['panel']['querySelector']("[data-role='save-config-menu']")),
      (this['createConfigMenuEl'] = this['panel']['querySelector']("[data-role='create-config-menu']")),
      (this['createBtn'] = this['panel']['querySelector']("[data-action='create']")),
      this['definitionController']['mount'](),
      this['panel']['addEventListener']('click', (_0x37ab51) => this['_handlePanelClick'](_0x37ab51)),
      this['panel']['addEventListener']('contextmenu', (_0x38fbd2) =>
        this['contextMenuController']['handleContextMenu'](_0x38fbd2),
      ),
      this['panel']['addEventListener']('dblclick', (_0x28825f) =>
        this['_handlePanelDoubleClick'](_0x28825f),
      ),
      this['panel']['addEventListener']('keydown', (_0xce0948) => this['_handlePanelKeyDown'](_0xce0948)),
      this['panel']['addEventListener']('focusout', (_0xeea44a) => this['_handlePanelFocusOut'](_0xeea44a)),
      this['panel']['addEventListener']('pointerdown', (_0x162323) => {
        (_0x162323['stopPropagation'](), this['previewDragController']['handlePointerDown'](_0x162323));
      }),
      this['panel']['addEventListener']('input', (_0x5ccb17) => this['_handleComponentInput'](_0x5ccb17)),
      this['panel']['addEventListener']('change', (_0x568c85) => this['_handleComponentInput'](_0x568c85)),
      this['bodyEl']?.['addEventListener']('scroll', () => this['_syncStickyHeaderShadow']()),
      this['workflowInputFieldEl']?.['addEventListener']('dragenter', (_0x3ea4c4) =>
        this['_handleWorkflowJsonFileDragEnter'](_0x3ea4c4),
      ),
      this['workflowInputFieldEl']?.['addEventListener']('dragover', (_0x4fab31) =>
        this['_handleWorkflowJsonFileDragOver'](_0x4fab31),
      ),
      this['workflowInputFieldEl']?.['addEventListener']('dragleave', (_0x18d4ae) =>
        this['_handleWorkflowJsonFileDragLeave'](_0x18d4ae),
      ),
      this['workflowInputFieldEl']?.['addEventListener'](
        'drop',
        (_0x584685) => void this['_handleWorkflowJsonFileDrop'](_0x584685),
      ),
      this['textarea']?.['addEventListener']('input', () => {
        ((this['workflowInputCollapsed'] = ![]),
          this['_syncWorkflowInputCollapsed'](),
          this['_scheduleParse']());
      }));
  }
  ['_bindButton']() {
    this['button'] = document['getElementById']('btnRunningHubAiApp');
    if (!this['button'] || !this['panel']) return;
    (this['button']['setAttribute']('aria-haspopup', 'dialog'),
      this['button']['setAttribute']('aria-expanded', 'false'),
      this['button']['addEventListener']('click', (_0xb598b7) => {
        (_0xb598b7['preventDefault'](), _0xb598b7['stopPropagation']());
        if (Number(_0xb598b7['detail'] || 0x0) > 0x1) return;
        this['_toggle']();
      }),
      this['button']['addEventListener']('dblclick', (_0x4621d5) => {
        (_0x4621d5['preventDefault'](), _0x4621d5['stopPropagation'](), this['_close']());
      }));
  }
  ['_bindGlobalEvents']() {
    (document['addEventListener']('keydown', (_0x21fe7a) => {
      if (_0x21fe7a['key'] !== 'Escape' || !this['_isOpen']()) return;
      if (this['previewAppMenuOpen']) {
        ((this['previewAppMenuOpen'] = ![]),
          (this['pendingDeleteSavedAppId'] = ''),
          (this['pendingOverwriteSavedAppId'] = ''),
          (this['pendingOverwriteIntent'] = ''),
          this['_patchPreviewAppChrome']());
        return;
      }
      this['_close']();
    }),
      document['addEventListener']('pointerdown', (_0x182add) => {
        if (!this['previewAppMenuOpen'] || !this['_isOpen']()) return;
        if (this['panel']?.['contains'](_0x182add['target'])) return;
        ((this['previewAppMenuOpen'] = ![]),
          (this['pendingDeleteSavedAppId'] = ''),
          (this['pendingOverwriteSavedAppId'] = ''),
          (this['pendingOverwriteIntent'] = ''),
          this['_patchPreviewAppChrome']());
      }),
      document['addEventListener']('pointermove', (_0x33f550) =>
        this['previewDragController']['handlePointerMove'](_0x33f550),
      ),
      document['addEventListener']('pointerup', (_0x30b5f6) =>
        this['previewDragController']['handlePointerEnd'](_0x30b5f6),
      ),
      document['addEventListener']('pointercancel', (_0x81b0ee) =>
        this['previewDragController']['handlePointerEnd'](_0x81b0ee),
      ),
      window['addEventListener']('custom-ai-app:open', () => this['_openSourceSelect']()),
      window['addEventListener']('custom-ai-app:toggle', () => this['_toggleSourceSelect']()));
  }
  ['_watchExistingNodeBundles']() {
    this['unsubscribeNodes'] = graphStore['subscribeNodeField']('rhAiAppManifestBundle', (_0x304724) =>
      this['_registerBundlesFromNodes'](_0x304724),
    );
  }
  ['_registerBundlesFromNodes'](_0x12698d) {
    const _0x4277c5 =
        _0x12698d ||
        Object['values'](graphStore['getStateRaw']()?.['nodes'] || {})
          ['map']((_0x28481a) => _0x28481a?.['rhAiAppManifestBundle'])
          ['filter'](Boolean),
      _0x53f44a = this['savedApps']
        ['map']((_0x47645d) => getCustomAiAppBundleKey(_0x47645d?.['bundle']))
        ['filter'](Boolean);
    return this['nodeBundleRegistry']['reconcile']({ bundles: _0x4277c5, savedBundleKeys: _0x53f44a });
  }
  ['_getSavedAppsForKind'](_0xb1ee50 = this['kind']) {
    const _0x54089d = normalizeKind(_0xb1ee50),
      _0x3b7253 = normalizeSourceType(this['sourceType']) || SOURCE_TYPES['runninghub'];
    return this['savedApps']['filter']((_0x3a8028) => {
      if (normalizeKind(_0x3a8028['kind']) !== _0x54089d) return ![];
      const _0x24c354 = normalizeSourceType(_0x3a8028['sourceType']) || SOURCE_TYPES['runninghub'];
      if (isComfyUiSource(_0x3b7253)) return isComfyUiSource(_0x24c354);
      if (isRunningHubSource(_0x3b7253)) return isRunningHubSource(_0x24c354);
      return _0x24c354 === _0x3b7253;
    });
  }
  ['_getSavedAppsForExactSource'](_0x2e22c4 = this['kind'], _0x37b239 = this['sourceType']) {
    const _0x4b666b = normalizeKind(_0x2e22c4),
      _0x11e3ba = normalizeSourceType(_0x37b239) || SOURCE_TYPES['runninghub'];
    return this['savedApps']['filter']((_0x52c3b6) => {
      if (normalizeKind(_0x52c3b6['kind']) !== _0x4b666b) return ![];
      const _0x783628 = normalizeSourceType(_0x52c3b6['sourceType']) || SOURCE_TYPES['runninghub'];
      return _0x783628 === _0x11e3ba;
    });
  }
  ['_findSavedApp'](_0x1503e4) {
    const _0x343602 = String(_0x1503e4 || '')['trim']();
    if (!_0x343602) return null;
    return this['savedApps']['find']((_0x1cfac3) => _0x1cfac3['id'] === _0x343602) || null;
  }
  ['_findSameNameSavedAppForCurrentScope'](_0x2e8028 = this['appName']) {
    const _0x231a73 = normalizeAppName(_0x2e8028);
    return (
      this['_getSavedAppsForExactSource'](this['kind'], this['sourceType'])['find'](
        (_0x1d3344) => normalizeAppName(_0x1d3344['name']) === _0x231a73,
      ) || null
    );
  }
  ['_clearPendingOverwrite']({ keepMenuOpen: keepMenuOpen = ![], render: render = !![] } = {}) {
    ((this['pendingOverwriteSavedAppId'] = ''), (this['pendingOverwriteIntent'] = ''));
    if (keepMenuOpen) this['previewAppMenuOpen'] = !![];
    render &&
      (this['_patchPreviewAppChrome'](), this['_patchSaveConfigMenu'](), this['_patchCreateConfigMenu']());
  }
  ['_showOverwriteConfirm'](_0x1fd38c, _0x135230 = 'save') {
    const _0x198965 = String(_0x1fd38c || '')['trim']();
    if (!_0x198965) return ![];
    return (
      (this['pendingOverwriteSavedAppId'] = _0x198965),
      (this['pendingOverwriteIntent'] = _0x135230 === 'create' ? 'create' : 'save'),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['previewAppMenuOpen'] = ![]),
      this['_patchPreviewAppChrome'](),
      this['_patchSaveConfigMenu'](),
      this['_patchCreateConfigMenu'](),
      !![]
    );
  }
  ['_getConfigRepositorySnapshot']() {
    return {
      savedApps: this['savedApps'],
      sourceType: this['sourceType'],
      kind: this['kind'],
      kindStates: this['kindStates'],
    };
  }
  ['_persistSavedApps']() {
    this['configRepository']['saveSavedApps'](this['savedApps']);
  }
  async ['_hydrateExternalStorage']() {
    return await this['configRepository']['hydrateExternalStorage']({
      hasLocalSeed: this['localStorageSeedHasData'],
    });
  }
  ['_applyExternalStoragePayload'](_0x347948) {
    (this['savedApps']['forEach']((_0x22cab3) => {
      _0x22cab3?.['bundle'] && unregisterCustomAiAppBundle(_0x22cab3['bundle'], this['registeredBundleKeys']);
    }),
      (this['savedApps'] = Array['isArray'](_0x347948?.['savedApps']) ? _0x347948['savedApps'] : []),
      this['_registerSavedAppBundles'](),
      this['_registerBundlesFromNodes']());
    _0x347948?.['panelDraft'] &&
      ((this['sourceType'] = _0x347948['panelDraft']['sourceType'] || ''),
      (this['kind'] = _0x347948['panelDraft']['kind']),
      (this['kindStates'] = _0x347948['panelDraft']['kindStates']));
    (this['_dropUnauthorizedRunningHubAiAppSource'](),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['_syncSourceView']());
    if (this['sourceType']) this['_restoreKindState'](this['kind']);
    else this['_patchPreviewAppChrome']();
  }
  ['_buildBundleForSavedApp'](_0xc738ae) {
    const _0x1ebba8 =
      normalizeSourceType(_0xc738ae['sourceType'] || this['sourceType']) || SOURCE_TYPES['runninghub'];
    if (isRunningHubSource(_0x1ebba8))
      assertRunningHubDefinitionProfile(
        _0xc738ae['input'],
        _0xc738ae['runningHubProfileId'] || this['runningHubProfileId'],
      );
    if (_0x1ebba8 === SOURCE_TYPES['runninghubWorkflow'])
      return buildRunningHubWorkflowManifestBundle({
        ..._0xc738ae,
        components: _0xc738ae['componentDrafts'],
        displayName: _0xc738ae['name'],
        appKey: _0xc738ae['id'],
      });
    if (isComfyUiSource(_0x1ebba8))
      return buildComfyUiWorkflowManifestBundle({
        input: _0xc738ae['input'],
        kind: _0xc738ae['kind'],
        components: _0xc738ae['componentDrafts'],
        displayName: _0xc738ae['name'],
        description: _0xc738ae['description'],
        promptHelpTooltip: normalizePromptHelpTooltip(_0xc738ae['promptHelpTooltip']),
        appKey: _0xc738ae['id'],
        baseUrlMode: getComfyUiBaseUrlMode(_0x1ebba8),
        componentSelectionMode: 'manual',
      });
    return buildRunningHubAiAppManifestBundle({
      input: _0xc738ae['input'],
      appId: this['_getAppIdText'](),
      kind: _0xc738ae['kind'],
      components: _0xc738ae['componentDrafts'],
      displayName: _0xc738ae['name'],
      description: _0xc738ae['description'],
      promptHelpTooltip: normalizePromptHelpTooltip(_0xc738ae['promptHelpTooltip']),
      appKey: _0xc738ae['id'],
    });
  }
  ['_registerSavedAppBundles']() {
    this['savedApps']['forEach']((_0x24a7bc) => {
      try {
        const _0x1ae5de = this['_buildBundleForSavedApp'](_0x24a7bc);
        ((_0x24a7bc['bundle'] = _0x1ae5de),
          registerCustomAiAppBundle(_0x1ae5de, this['registeredBundleKeys'], { replace: !![] }));
      } catch (_0x30f973) {
        console['warn']('[RH AI App] register saved app failed:', _0x30f973);
      }
    });
  }
  ['_setActionButtonsEnabled'](_0xb28c56) {
    if (!_0xb28c56) this['_resetSaveSuccessFeedback']();
    if (this['saveBtn']) this['saveBtn']['disabled'] = !_0xb28c56 || this['savePending'];
    if (this['createBtn']) this['createBtn']['disabled'] = !_0xb28c56;
  }
  ['_resetSaveSuccessFeedback']() {
    (window['clearTimeout'](this['saveSuccessTimer']), (this['saveSuccessTimer'] = 0x0));
    if (!this['saveBtn']) return;
    (this['saveBtn']['classList']['remove']('is-save-success'),
      (this['saveBtn']['textContent'] = this['saveBtn']['dataset']['defaultText'] || '保存模型'));
  }
  ['_flashSaveSuccessFeedback']() {
    if (!this['saveBtn']) return;
    const _0x2038be =
      this['saveBtn']['dataset']['defaultText'] || this['saveBtn']['textContent'] || '保存模型';
    ((this['saveBtn']['dataset']['defaultText'] = _0x2038be),
      window['clearTimeout'](this['saveSuccessTimer']),
      this['saveBtn']['classList']['add']('is-save-success'),
      (this['saveBtn']['textContent'] = '已保存'),
      (this['saveSuccessTimer'] = window['setTimeout'](() => this['_resetSaveSuccessFeedback'](), 0x4b0)));
  }
  ['_getStateKey'](_0x511c84 = this['kind'], _0x59ca96 = this['sourceType']) {
    return this['configRepository']['getKindStateKey'](_0x59ca96, _0x511c84);
  }
  ['_getSourceMeta']() {
    return getSourceMeta(this['sourceType']);
  }
  ['_isComfyUiSource']() {
    return isComfyUiSource(this['sourceType']);
  }
  ['_isRunningHubAiAppSource'](_0x555f02 = this['sourceType']) {
    return isRunningHubSource(normalizeSourceType(_0x555f02));
  }
  ['_isRunningHubAiAppAuthorized']() {
    const _0x192f41 = globalThis['window'],
      _0x9e8b1f = _0x192f41?.['isModelAllowedBySubscription'];
    if (typeof _0x9e8b1f !== 'function') return ![];
    return _0x9e8b1f(RH_AI_APP_VIP_MODEL_ID, RH_AI_APP_VIP_PROVIDER) === !![];
  }
  ['_requestRunningHubAiAppAuthorization'](_0x5a88bd = null) {
    const _0x246d5a = globalThis['window'];
    if (typeof _0x246d5a?.['openSubscriptionDialog'] === 'function') {
      _0x246d5a['openSubscriptionDialog']({
        modelId: RH_AI_APP_VIP_MODEL_ID,
        provider: RH_AI_APP_VIP_PROVIDER,
        onSuccess: _0x5a88bd,
      });
      return;
    }
    _0x246d5a?.['showToast']?.('需要VIP授权，请先激活CDKEY', 'warn');
  }
  ['_guardRunningHubAiAppAccess'](_0x283e35 = null) {
    if (this['_isRunningHubAiAppAuthorized']()) return !![];
    return (this['_requestRunningHubAiAppAuthorization'](_0x283e35), ![]);
  }
  ['_dropUnauthorizedRunningHubAiAppSource']() {
    if (!this['_isRunningHubAiAppSource']()) return ![];
    if (this['_isRunningHubAiAppAuthorized']()) return ![];
    return ((this['sourceType'] = ''), !![]);
  }
  ['_shouldShowManualComponentPicker']() {
    return this['_isComfyUiSource']() || this['sourceType'] === SOURCE_TYPES['runninghubWorkflow'];
  }
  ['_canRemovePreviewParams']() {
    return this['_shouldShowManualComponentPicker']();
  }
  ['_canRemovePreviewInputs']() {
    return this['_shouldShowManualComponentPicker']();
  }
  ['_clearSourceViewAnimation']() {
    (window['clearTimeout'](this['sourceViewAnimationTimer']),
      (this['sourceViewAnimationTimer'] = 0x0),
      this['bodyEl']?.['classList']['remove']('is-view-transitioning'),
      this['sourceSelectEl']?.['classList']['remove'](
        'is-page-enter-left',
        'is-page-exit-left',
        'is-page-enter-right',
        'is-page-exit-right',
      ),
      this['workbenchEl']?.['classList']['remove'](
        'is-page-enter-left',
        'is-page-exit-left',
        'is-page-enter-right',
        'is-page-exit-right',
      ));
  }
  ['_setSourceViewHiddenState'](_0xe41acb) {
    if (this['sourceSelectEl']) this['sourceSelectEl']['hidden'] = _0xe41acb;
    if (this['workbenchEl']) this['workbenchEl']['hidden'] = !_0xe41acb;
  }
  ['_applySourceViewTransition'](_0x20c4c5, _0x326478) {
    if (shouldReduceMotion() || !_0x326478 || !this['sourceSelectEl'] || !this['workbenchEl'])
      return (this['_setSourceViewHiddenState'](_0x20c4c5), ![]);
    const _0x353d05 = _0x326478 === 'forward' && _0x20c4c5,
      _0x29e0ec = _0x326478 === 'back' && !_0x20c4c5;
    if (!_0x353d05 && !_0x29e0ec) return (this['_setSourceViewHiddenState'](_0x20c4c5), ![]);
    return (
      (this['sourceSelectEl']['hidden'] = ![]),
      (this['workbenchEl']['hidden'] = ![]),
      this['bodyEl']?.['classList']['add']('is-view-transitioning'),
      _0x353d05
        ? (this['sourceSelectEl']['classList']['add']('is-page-exit-left'),
          this['workbenchEl']['classList']['add']('is-page-enter-right'))
        : (this['sourceSelectEl']['classList']['add']('is-page-enter-left'),
          this['workbenchEl']['classList']['add']('is-page-exit-right')),
      (this['sourceViewAnimationTimer'] = window['setTimeout'](() => {
        (this['_clearSourceViewAnimation'](), this['_setSourceViewHiddenState'](_0x20c4c5));
      }, SOURCE_PAGE_ANIMATION_MS)),
      !![]
    );
  }
  ['_syncSourceView']() {
    this['definitionController']['sync']();
    const _0x32bbef = Boolean(normalizeSourceType(this['sourceType'])),
      _0x3471a0 = this['_getSourceMeta'](),
      _0x58d459 = this['sourceViewTransitionDirection'];
    ((this['sourceViewTransitionDirection'] = ''),
      this['_clearSourceViewAnimation'](),
      this['_applySourceViewTransition'](_0x32bbef, _0x58d459));
    if (this['sourceBackBtn']) this['sourceBackBtn']['hidden'] = !_0x32bbef;
    const _0x54b399 = this['panel']?.['querySelector']?.("[data-role='footer']");
    if (_0x54b399) _0x54b399['hidden'] = !_0x32bbef;
    const _0x580f38 = this['panel']?.['querySelector']?.("[data-role='panel-title']"),
      _0x3f2759 = this['panel']?.['querySelector']?.("[data-role='panel-subtitle']"),
      _0x142f93 = this['panel']?.['querySelector']?.("[data-role='input-label']");
    if (_0x580f38)
      _0x580f38['textContent'] = _0x32bbef
        ? _0x3471a0?.['panelLabel'] || _0x3471a0?.['label'] || '自定义AI应用'
        : '自定义AI应用';
    _0x3f2759 &&
      (_0x3f2759['textContent'] = _0x32bbef ? _0x3471a0?.['subtitle'] || '' : '选择一种自定义应用来源');
    if (_0x142f93 && _0x3471a0?.['inputLabel']) _0x142f93['textContent'] = _0x3471a0['inputLabel'];
    (this['workflowInputFieldEl'] &&
      (this['workflowInputFieldEl']['hidden'] = isRunningHubSource(this['sourceType'])),
      this['textarea'] &&
        _0x3471a0?.['inputPlaceholder'] &&
        (this['textarea']['placeholder'] = _0x3471a0['inputPlaceholder']),
      this['_syncComfyUiRuntimeControl'](),
      this['_syncRunningHubRuntimeControl'](),
      !_0x32bbef && (this['_setActionButtonsEnabled'](![]), this['_setError']('')),
      this['_syncStickyHeaderShadow']());
  }
  ['_syncComfyUiRuntimeControl']() {
    const _0x175a6a = this['_isComfyUiSource']();
    if (!this['runtimeToggleEl']) return;
    this['runtimeToggleEl']['hidden'] = !_0x175a6a;
    const _0x1753a2 = getComfyUiBaseUrlMode(this['sourceType']);
    this['runtimeToggleEl']['querySelectorAll']('[data-comfyui-runtime]')['forEach']((_0x3722a9) => {
      const _0x59974e = _0x3722a9['dataset']['comfyuiRuntime'] === _0x1753a2;
      (_0x3722a9['classList']['toggle']('active', _0x59974e),
        _0x3722a9['setAttribute']('aria-pressed', _0x59974e ? 'true' : 'false'));
    });
  }
  ['_syncRunningHubRuntimeControl']() {
    const _0x3dbbb7 = this['_isRunningHubAiAppSource']();
    if (!this['runningHubRuntimeToggleEl']) return;
    this['runningHubRuntimeToggleEl']['hidden'] = !_0x3dbbb7;
    const _0x52da1a = normalizeRunningHubModelApiProfileId(this['runningHubProfileId']);
    this['runningHubRuntimeToggleEl']
      ['querySelectorAll']('[data-runninghub-runtime]')
      ['forEach']((_0x432fa9) => {
        const _0x52b6a5 =
          normalizeRunningHubModelApiProfileId(_0x432fa9['dataset']['runninghubRuntime']) === _0x52da1a;
        (_0x432fa9['classList']['toggle']('active', _0x52b6a5),
          _0x432fa9['setAttribute']('aria-pressed', _0x52b6a5 ? 'true' : 'false'));
      });
  }
  ['_syncStickyHeaderShadow']() {
    const _0x24db68 =
      Boolean(normalizeSourceType(this['sourceType'])) && Number(this['bodyEl']?.['scrollTop'] || 0x0) > 0x4;
    this['panel']?.['classList']['toggle']('has-sticky-kind-shadow', _0x24db68);
  }
  ['_selectSourceType'](_0x1a5a91) {
    const _0x52f3c6 = normalizeSourceType(_0x1a5a91);
    if (!_0x52f3c6) return;
    if (
      isRunningHubSource(_0x52f3c6) &&
      !this['_guardRunningHubAiAppAccess'](() => this['_selectSourceType'](_0x52f3c6))
    )
      return;
    window['clearTimeout'](this['parseTimer']);
    if (this['sourceType']) this['_saveKindState']();
    ((this['sourceType'] = _0x52f3c6),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      (this['sourceViewTransitionDirection'] = 'forward'),
      this['_restoreKindState'](this['kind']),
      requestAnimationFrame(() => this['textarea']?.['focus']()));
  }
  ['_selectComfyUiRuntime'](_0x3371a4) {
    this['definitionController']['cancel']();
    if (!this['_isComfyUiSource']()) return;
    const _0x5cce37 = getComfyUiSourceTypeFromBaseUrlMode(_0x3371a4);
    if (_0x5cce37 === this['sourceType']) {
      this['_syncComfyUiRuntimeControl']();
      return;
    }
    (window['clearTimeout'](this['parseTimer']),
      this['_saveKindState'](),
      (this['sourceType'] = _0x5cce37),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['_syncSourceView']());
    if (this['_getInputText']()['trim']()) {
      const _0x3bdc96 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
      this['_patchPreviewWithoutRebuild'](_0x3bdc96 || this['currentBundle'], {
        renderInputs: !![],
        renderParams: !![],
        renderAdvanced: !![],
        renderPrompt: !![],
        renderAppChrome: !![],
        renderActionControls: !![],
      });
      return;
    }
    (this['_patchPreviewAppChrome'](), this['_saveKindState']());
  }
  ['_selectRunningHubRuntime'](_0x5a3a71) {
    this['definitionController']['cancel']();
    if (!this['_isRunningHubAiAppSource']()) return;
    const _0x1aec70 = normalizeRunningHubModelApiProfileId(_0x5a3a71);
    if (_0x1aec70 === this['runningHubProfileId']) {
      this['_syncRunningHubRuntimeControl']();
      return;
    }
    (window['clearTimeout'](this['parseTimer']),
      (this['runningHubProfileId'] = _0x1aec70),
      this['_syncRunningHubRuntimeControl']());
    if (this['_getInputText']()['trim']()) this['_refreshBundleFromComponents']({ renderPreview: ![] });
    (this['_saveKindState'](), this['_patchPreviewAppChrome']());
  }
  ['_showSourceSelect']() {
    (this['definitionController']['cancel'](), window['clearTimeout'](this['parseTimer']));
    if (this['sourceType']) this['_saveKindState']();
    ((this['sourceType'] = ''),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['_closeComponentSelectMenus'](),
      (this['sourceViewTransitionDirection'] = 'back'),
      this['_syncSourceView'](),
      this['_persistPanelDraft']());
  }
  ['_openSourceSelect']() {
    (this['definitionController']['cancel'](), window['clearTimeout'](this['parseTimer']));
    const _0x1a5276 = this['_isOpen']();
    if (this['sourceType']) this['_saveKindState']();
    ((this['sourceType'] = ''),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['_closeComponentSelectMenus'](),
      (this['sourceViewTransitionDirection'] = _0x1a5276 ? 'back' : ''),
      this['_syncSourceView'](),
      this['_persistPanelDraft']());
    if (!_0x1a5276) this['_open']();
  }
  ['_toggleSourceSelect']() {
    if (this['_isOpen']()) {
      this['_close']();
      return;
    }
    this['_openSourceSelect']();
  }
  ['_isOpen']() {
    return this['panel']?.['classList']['contains']('is-open') === !![];
  }
  ['_open']() {
    (this['previewDragController']['bindGroups'](),
      closeAllSidebarSubmenus(),
      this['_dropUnauthorizedRunningHubAiAppSource'](),
      this['_syncSourceView']());
    if (this['sourceType']) this['_restoreKindState'](this['kind']);
    (this['panel']?.['classList']['add']('is-open'),
      this['panel']?.['setAttribute']('aria-hidden', 'false'),
      document['body']?.['classList']?.['add']('rh-ai-app-panel-open'),
      this['button']?.['classList']['add']('active'),
      this['button']?.['setAttribute']('aria-expanded', 'true'),
      requestAnimationFrame(() => this['_syncStickyHeaderShadow']()));
    if (this['sourceType']) requestAnimationFrame(() => this['textarea']?.['focus']());
  }
  ['_close']() {
    (this['previewDragController']['destroy'](),
      this['definitionController']['cancel'](),
      window['clearTimeout'](this['parseTimer']),
      this['_resetSaveSuccessFeedback'](),
      this['_saveKindState'](),
      this['_clearSourceViewAnimation'](),
      this['_closeComponentSelectMenus'](),
      this['contextMenuController']['close'](),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['panel']?.['classList']['remove']('is-open'),
      this['panel']?.['classList']['remove']('has-sticky-kind-shadow'),
      this['panel']?.['setAttribute']('aria-hidden', 'true'),
      document['body']?.['classList']?.['remove']('rh-ai-app-panel-open'),
      this['button']?.['classList']['remove']('active'),
      this['button']?.['setAttribute']('aria-expanded', 'false'));
  }
  ['_toggle']() {
    if (this['_isOpen']()) this['_close']();
    else this['_open']();
  }
  ['_handlePanelClick'](_0x18bf8c) {
    const _0x5cbaf5 = _0x18bf8c['target']?.['closest']?.('[data-action]');
    if (_0x5cbaf5 && this['panel']?.['contains'](_0x5cbaf5)) {
      const _0x2529d4 = _0x5cbaf5['dataset']['action'] || '';
      if (_0x2529d4 === 'close') {
        this['_close']();
        return;
      }
      if (_0x2529d4 === 'select-source-type') {
        this['_selectSourceType'](_0x5cbaf5['dataset']['sourceType']);
        return;
      }
      if (_0x2529d4 === 'back-to-source-types') {
        this['_showSourceSelect']();
        return;
      }
      if (_0x2529d4 === 'select-comfyui-runtime') {
        this['_selectComfyUiRuntime'](_0x5cbaf5['dataset']['comfyuiRuntime']);
        return;
      }
      if (_0x2529d4 === 'select-runninghub-runtime') {
        this['_selectRunningHubRuntime'](_0x5cbaf5['dataset']['runninghubRuntime']);
        return;
      }
      if (_0x2529d4 === 'toggle-workflow-input') {
        this['_toggleWorkflowInputCollapsed']();
        return;
      }
      if (_0x2529d4 === 'parse') {
        this['_parseNow']();
        return;
      }
      if (_0x2529d4 === 'save-config') {
        (this['_closeComponentSelectMenus'](), this['_saveConfigFromCurrentInput']());
        return;
      }
      if (_0x2529d4 === 'create') {
        (this['_closeComponentSelectMenus'](), void this['_createNodeFromCurrentInput']());
        return;
      }
      if (_0x2529d4 === 'toggle-component-select') {
        this['_toggleComponentSelect'](_0x5cbaf5);
        return;
      }
      if (_0x2529d4 === 'choose-component-select') {
        this['_chooseComponentSelect'](_0x5cbaf5);
        return;
      }
      if (_0x2529d4 === 'choose-preview-control-type') {
        this['_choosePreviewControlType'](_0x5cbaf5);
        return;
      }
      if (_0x2529d4 === 'confirm-preview-rename') {
        (_0x18bf8c['preventDefault'](), _0x18bf8c['stopPropagation']());
        const _0x4b8600 = _0x5cbaf5['closest']?.('.rh-ai-app-preview-rename-target')?.['querySelector']?.(
          "[data-role='preview-rename-input']",
        );
        this['_commitPreviewInlineRename'](_0x4b8600);
        return;
      }
      if (_0x2529d4 === 'rename-preview-param') {
        (_0x18bf8c['preventDefault'](),
          _0x18bf8c['stopPropagation'](),
          this['_renamePreviewParamFromTypebar'](_0x5cbaf5));
        return;
      }
      if (_0x2529d4 === 'edit-preview-description') {
        (_0x18bf8c['preventDefault'](),
          _0x18bf8c['stopPropagation'](),
          this['_editPreviewDescriptionFromTypebar'](_0x5cbaf5));
        return;
      }
      if (_0x2529d4 === 'toggle-preview-param-default') {
        (_0x18bf8c['preventDefault'](),
          _0x18bf8c['stopPropagation'](),
          this['_togglePreviewParamDefault'](_0x5cbaf5));
        return;
      }
      if (_0x2529d4 === 'remove-preview-param') {
        (_0x18bf8c['preventDefault'](),
          _0x18bf8c['stopPropagation'](),
          this['_removePreviewParam'](_0x5cbaf5));
        return;
      }
      if (_0x2529d4 === 'remove-preview-input') {
        (_0x18bf8c['preventDefault'](),
          _0x18bf8c['stopPropagation'](),
          this['_removePreviewInput'](_0x5cbaf5));
        return;
      }
      if (_0x2529d4 === 'toggle-comfy-candidate-select') {
        this['_toggleComfyCandidateMenu']();
        return;
      }
      if (_0x2529d4 === 'choose-comfy-candidate') {
        this['_chooseComfyCandidate'](_0x5cbaf5);
        return;
      }
      if (_0x2529d4 === 'toggle-app-menu') {
        this['_closeComponentSelectMenus']();
        if (Number(_0x18bf8c['detail'] || 0x0) > 0x1) return;
        ((this['previewAppMenuOpen'] = !this['previewAppMenuOpen']),
          (this['pendingDeleteSavedAppId'] = ''),
          (this['pendingOverwriteSavedAppId'] = ''),
          (this['pendingOverwriteIntent'] = ''),
          this['_patchPreviewAppChrome']());
        return;
      }
      if (_0x2529d4 === 'load-saved-app') {
        (this['_closeComponentSelectMenus'](), this['_loadSavedApp'](_0x5cbaf5['dataset']['savedAppId']));
        return;
      }
      if (_0x2529d4 === 'rename-current-app') {
        (this['_closeComponentSelectMenus'](),
          (this['previewAppMenuOpen'] = ![]),
          (this['pendingDeleteSavedAppId'] = ''),
          (this['pendingOverwriteSavedAppId'] = ''),
          (this['pendingOverwriteIntent'] = ''),
          this['_patchPreviewAppChrome'](),
          this['_focusAppNameInput']());
        return;
      }
      if (_0x2529d4 === 'request-delete-app') {
        (this['_closeComponentSelectMenus'](),
          (this['pendingDeleteSavedAppId'] = String(_0x5cbaf5['dataset']['savedAppId'] || '')),
          (this['pendingOverwriteSavedAppId'] = ''),
          (this['pendingOverwriteIntent'] = ''),
          (this['previewAppMenuOpen'] = !![]),
          this['_patchPreviewAppChrome']());
        return;
      }
      if (_0x2529d4 === 'confirm-delete-app') {
        (this['_closeComponentSelectMenus'](), this['_deleteSavedApp'](_0x5cbaf5['dataset']['savedAppId']));
        return;
      }
      if (_0x2529d4 === 'cancel-delete-app') {
        (this['_closeComponentSelectMenus'](),
          (this['pendingDeleteSavedAppId'] = ''),
          (this['previewAppMenuOpen'] = !![]),
          this['_patchPreviewAppChrome']());
        return;
      }
      if (_0x2529d4 === 'confirm-overwrite-app') {
        (this['_closeComponentSelectMenus'](),
          void this['_confirmOverwriteSavedApp'](_0x5cbaf5['dataset']['savedAppId']));
        return;
      }
      if (_0x2529d4 === 'cancel-overwrite-app') {
        this['_closeComponentSelectMenus']();
        const _0x4dca22 = Boolean(
          _0x5cbaf5['closest']?.("[data-role='save-config-menu'], [data-role='create-config-menu']"),
        );
        this['_clearPendingOverwrite']({ keepMenuOpen: !_0x4dca22 });
        return;
      }
    }
    const _0x1cd6c6 = _0x18bf8c['target']?.['closest']?.('.rh-ai-app-preview-description-target');
    if (_0x1cd6c6 && this['panel']?.['contains'](_0x1cd6c6)) {
      const _0x3309b8 = Number(_0x1cd6c6['dataset']['previewComponentIndex']),
        _0x2bf6dc = _0x1cd6c6['classList']['contains']('rh-ai-app-preview-prompt-help-tip');
      if (Number['isInteger'](_0x3309b8) || _0x2bf6dc) {
        (_0x18bf8c['preventDefault'](),
          _0x18bf8c['stopPropagation'](),
          this['_startPreviewInlineDescriptionEdit'](_0x1cd6c6, _0x3309b8));
        return;
      }
    }
    if (this['_isPreviewControlTarget'](_0x18bf8c['target'])) return;
    if (this['previewDragController']['consumeSuppressedRenameClickForTarget'](_0x18bf8c)) return;
    const _0x2f59fb = _0x18bf8c['target']?.['closest']?.('.rh-ai-app-preview-rename-target');
    if (_0x2f59fb && this['panel']?.['contains'](_0x2f59fb)) {
      const _0x791f5 = Number(_0x2f59fb['dataset']['previewComponentIndex']);
      if (Number['isInteger'](_0x791f5)) {
        (_0x18bf8c['preventDefault'](),
          _0x18bf8c['stopPropagation'](),
          this['_startPreviewInlineRename'](_0x2f59fb, _0x791f5));
        return;
      }
    }
    const _0x210f97 = _0x18bf8c['target']?.['closest']?.('.rh-ai-app-kind-tabs [data-kind]');
    if (!_0x210f97 || !this['panel']?.['contains'](_0x210f97)) {
      const _0x3602e7 = _0x18bf8c['target']?.['closest']?.("[data-role='saved-app-menu']"),
        _0x2ad466 = _0x18bf8c['target']?.['closest']?.(
          "[data-role='save-config-menu'], [data-action='save-config']",
        ),
        _0x24332b = _0x18bf8c['target']?.['closest']?.(
          "[data-role='create-config-menu'], [data-action='create']",
        ),
        _0x3b2dad = _0x18bf8c['target']?.['closest']?.('.rh-ai-app-preview-model-trigger'),
        _0x4f182f = _0x18bf8c['target']?.['closest']?.('[data-component-select]'),
        _0x200cad = _0x18bf8c['target']?.['closest']?.(
          ".rh-ai-app-comfy-add-panel, [data-role='comfyui-candidate-menu']",
        );
      !_0x4f182f && !_0x200cad && this['_closeComponentSelectMenus']();
      !_0x3602e7 &&
        !_0x3b2dad &&
        this['previewAppMenuOpen'] &&
        ((this['previewAppMenuOpen'] = ![]),
        (this['pendingDeleteSavedAppId'] = ''),
        (this['pendingOverwriteSavedAppId'] = ''),
        (this['pendingOverwriteIntent'] = ''),
        this['_patchPreviewAppChrome']());
      !_0x2ad466 &&
        this['pendingOverwriteIntent'] === 'save' &&
        this['pendingOverwriteSavedAppId'] &&
        this['_clearPendingOverwrite']();
      !_0x24332b &&
        this['pendingOverwriteIntent'] === 'create' &&
        this['pendingOverwriteSavedAppId'] &&
        this['_clearPendingOverwrite']();
      return;
    }
    const _0x4cb868 = _0x210f97['dataset']['kind'];
    _0x4cb868 && (this['_closeComponentSelectMenus'](), this['_setKind'](_0x4cb868));
  }
  ['_handlePanelDoubleClick'](_0x3516e5) {
    const _0x446331 = _0x3516e5['target']?.['closest']?.('.rh-ai-app-preview-model-trigger');
    if (_0x446331 && this['panel']?.['contains'](_0x446331)) {
      (_0x3516e5['preventDefault'](),
        _0x3516e5['stopPropagation'](),
        (this['previewAppMenuOpen'] = ![]),
        (this['pendingDeleteSavedAppId'] = ''),
        (this['pendingOverwriteSavedAppId'] = ''),
        (this['pendingOverwriteIntent'] = ''),
        this['_patchPreviewAppChrome'](),
        this['_focusAppNameInput']());
      return;
    }
    if (
      this['_isPreviewControlTarget'](_0x3516e5['target']) ||
      this['_isPreviewRenameTarget'](_0x3516e5['target'])
    )
      return;
    const _0x329624 = _0x3516e5['target']?.['closest']?.('.rh-ai-app-preview-rename-target');
    if (!_0x329624 || !this['panel']?.['contains'](_0x329624)) return;
    const _0x427485 = _0x329624['closest']?.('[data-preview-component-index]'),
      _0x23b19d = Number(
        _0x427485?.['dataset']?.['previewComponentIndex'] || _0x329624['dataset']?.['previewComponentIndex'],
      );
    if (!Number['isInteger'](_0x23b19d)) return;
    (_0x3516e5['preventDefault'](),
      _0x3516e5['stopPropagation'](),
      this['_startPreviewInlineRename'](_0x329624, _0x23b19d));
  }
  ['_syncKindTabs']() {
    const _0x9c4742 = normalizeKind(this['kind']);
    (this['kindTabsEl']?.['classList']['toggle']('is-kind-image', _0x9c4742 === 'image'),
      this['kindTabsEl']?.['classList']['toggle']('is-kind-video', _0x9c4742 === 'video'),
      this['kindTabsEl']?.['classList']['toggle']('is-kind-audio', _0x9c4742 === 'audio'),
      this['panel']?.['querySelectorAll']('.rh-ai-app-kind-tabs button')['forEach']((_0x2f50a7) => {
        const _0x285076 = _0x2f50a7['dataset']['kind'] === _0x9c4742;
        (_0x2f50a7['classList']['toggle']('active', _0x285076),
          _0x2f50a7['setAttribute']('aria-pressed', _0x285076 ? 'true' : 'false'));
      }));
  }
  ['_setKind'](_0x57a5f6) {
    const _0x1a2279 = normalizeKind(_0x57a5f6);
    if (_0x1a2279 === this['kind']) return;
    (window['clearTimeout'](this['parseTimer']),
      this['_saveKindState'](),
      (this['kind'] = _0x1a2279),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['_syncKindTabs'](),
      this['_restoreKindState'](_0x1a2279));
  }
  ['_saveKindState'](_0x589009 = this['kind']) {
    if (!this['sourceType']) {
      this['_persistPanelDraft']();
      return;
    }
    const _0x3533ae = normalizeKind(_0x589009);
    ((this['kindStates'][this['_getStateKey'](_0x3533ae)] = {
      sourceType: this['sourceType'],
      input: this['_getInputText'](),
      definitionReference: this['definitionReference'],
      appName: this['appName'],
      appDescription: this['appDescription'],
      promptHelpTooltip: this['promptHelpTooltip'],
      runningHubProfileId: this['runningHubProfileId'],
      savedAppId: this['savedAppId'],
      componentDraftKey: this['componentDraftKey'],
      componentDrafts: cloneComponentDrafts(this['componentDrafts']),
      componentCandidates: cloneComponentDrafts(this['componentCandidates']),
      currentBundle: this['currentBundle'],
      errorMessage: this['errorMessage'] || '',
    }),
      this['_persistPanelDraft']());
  }
  ['_persistPanelDraft']() {
    this['configRepository']['savePanelDraft']({
      sourceType: this['sourceType'],
      kind: this['kind'],
      kindStates: this['kindStates'],
    });
  }
  ['_restoreKindState'](_0x361b7b = this['kind']) {
    this['definitionController']['cancel']();
    if (!this['sourceType']) {
      this['_syncSourceView']();
      return;
    }
    const _0x247559 = normalizeKind(_0x361b7b),
      _0x25a549 = this['_getStateKey'](_0x247559),
      _0x37b946 = isComfyUiSource(this['sourceType'])
        ? this['configRepository']['getLegacyKindStateKey'](this['sourceType'], _0x247559)
        : '',
      _0x1a0282 = this['sourceType'] === SOURCE_TYPES['runninghub'] ? this['kindStates'][_0x247559] : null,
      _0x47c5a7 =
        this['kindStates'][_0x25a549] ||
        (_0x37b946 ? this['kindStates'][_0x37b946] : null) ||
        _0x1a0282 ||
        this['configRepository']['createEmptyKindState']();
    ((this['kindStates'][_0x25a549] = _0x47c5a7), (this['kind'] = _0x247559));
    if (isRunningHubSource(this['sourceType']) && isRunningHubSource(_0x47c5a7['sourceType']))
      this['sourceType'] = _0x47c5a7['sourceType'];
    ((this['definitionReference'] = _0x47c5a7['definitionReference'] || ''),
      this['_syncSourceView'](),
      this['_syncKindTabs']());
    if (this['textarea']) this['textarea']['value'] = _0x47c5a7['input'] || '';
    ((this['appName'] = _0x47c5a7['appName'] || DEFAULT_AI_APP_NAME),
      (this['appDescription'] = normalizeAppDescription(_0x47c5a7['appDescription'])),
      (this['promptHelpTooltip'] = normalizePromptHelpTooltip(_0x47c5a7['promptHelpTooltip'])),
      (this['runningHubProfileId'] = normalizeRunningHubModelApiProfileId(
        _0x47c5a7['runningHubProfileId'] || getDefaultRunningHubProfileId(),
      )),
      this['_syncRunningHubRuntimeControl'](),
      (this['savedAppId'] = _0x47c5a7['savedAppId'] || ''),
      (this['componentDraftKey'] = _0x47c5a7['componentDraftKey'] || ''),
      (this['componentDrafts'] = cloneComponentDrafts(_0x47c5a7['componentDrafts'])),
      (this['componentCandidates'] = cloneComponentDrafts(_0x47c5a7['componentCandidates'])),
      (this['currentBundle'] = _0x47c5a7['currentBundle'] || null));
    let _0xb145fc = _0x47c5a7['errorMessage'] || '';
    if (!this['currentBundle'] && this['_getInputText']()['trim']())
      try {
        ((this['currentBundle'] = this['_buildCurrentBundle']({
          syncComponents: this['componentDrafts']['length'] === 0x0,
        })),
          (_0xb145fc = ''));
      } catch (_0xf3929a) {
        ((this['currentBundle'] = null), (_0xb145fc = _0xb145fc || _0xf3929a?.['message'] || '解析失败'));
      }
    (this['_renderComponentConfig'](),
      this['_patchPreviewWithoutRebuild'](this['currentBundle'], {
        renderInputs: !![],
        renderParams: !![],
        renderAdvanced: !![],
        renderPrompt: !![],
        renderAppChrome: !![],
        renderActionControls: !![],
      }),
      this['_setSummary'](this['currentBundle']),
      this['_setError'](_0xb145fc),
      this['_setActionButtonsEnabled'](!!this['currentBundle']),
      this['_saveKindState'](_0x247559));
  }
  ['_focusAppNameInput']() {
    const _0x1fc6c1 = this['componentListEl']?.['querySelector']?.("[data-app-prop='appName']");
    if (!_0x1fc6c1) return;
    (_0x1fc6c1['scrollIntoView']?.({ block: 'nearest', inline: 'nearest' }),
      _0x1fc6c1['focus'](),
      _0x1fc6c1['select']?.());
  }
  ['_startPreviewInlineRename'](_0x386f75, _0x2b48f8) {
    const _0x2b11ae = Number(_0x2b48f8);
    if (!Number['isInteger'](_0x2b11ae)) return;
    const _0x58c4a7 = _0x386f75?.['closest']?.('.rh-ai-app-preview-rename-target');
    if (!_0x58c4a7 || !this['nodePreviewEl']?.['contains']?.(_0x58c4a7)) return;
    if (_0x58c4a7['querySelector']?.("[data-role='preview-rename-input']")) return;
    const _0x329821 = getComponentByIndex(this['componentDrafts'], _0x2b11ae);
    if (!_0x329821) return;
    const _0x3e7bdd = _0x58c4a7['closest']?.('.rh-ai-app-preview-input-slot'),
      _0x41a89f = String(_0x329821['label'] || _0x329821['fieldName'] || '组件')['trim']() || '组件',
      _0x58e222 = _0x3e7bdd && isMediaComponent(_0x329821) ? normalizeInputSlotLabel(_0x41a89f) : _0x41a89f,
      _0x386601 = _0x3e7bdd ? ' maxlength="' + INPUT_SLOT_LABEL_INPUT_MAX_LENGTH + '\x22' : '';
    (_0x3e7bdd?.['classList']?.['add']('is-inline-editing'), _0x58c4a7['classList']['add']('is-renaming'));
    const _0xd15b89 =
      '<input type="text" class="rh-ai-app-preview-rename-input" data-role="preview-rename-input" data-preview-component-index="' +
      _0x2b11ae +
      '" data-original-label="' +
      escapeHtml(_0x58e222) +
      '\x22\x20value=\x22' +
      escapeHtml(_0x58e222) +
      '" aria-label="组件名"' +
      _0x386601 +
      '>';
    _0x58c4a7['innerHTML'] = _0x3e7bdd
      ? '<span class="rh-ai-app-preview-slot-rename-shell">' +
        _0xd15b89 +
        '<button type="button" class="rh-ai-app-preview-rename-confirm" data-action="confirm-preview-rename" data-preview-component-index="' +
        _0x2b11ae +
        '" aria-label="确认重命名">&#10003;</button></span>'
      : _0xd15b89;
    const _0x435e3c = _0x58c4a7['querySelector']("[data-role='preview-rename-input']");
    if (!_0x435e3c) return;
    const _0x5ad5f9 = () => {
      (_0x435e3c['focus'](), _0x435e3c['select']?.());
    };
    typeof window['requestAnimationFrame'] === 'function'
      ? window['requestAnimationFrame'](_0x5ad5f9)
      : _0x5ad5f9();
  }
  ['_restorePreviewInlineRename'](_0x21559d) {
    const _0x97791d = Number(_0x21559d?.['dataset']?.['previewComponentIndex']);
    if (!Number['isInteger'](_0x97791d)) return;
    const _0x164881 = _0x21559d['closest']?.('.rh-ai-app-preview-rename-target'),
      _0x43031e = getComponentByIndex(this['componentDrafts'], _0x97791d);
    if (!_0x164881 || !_0x43031e) return;
    const _0x386fbf =
        String(
          _0x43031e['label'] || _0x43031e['fieldName'] || _0x21559d['dataset']['originalLabel'] || '组件',
        )['trim']() || '组件',
      _0x33bd8d = isMediaComponent(_0x43031e) ? normalizeInputSlotLabel(_0x386fbf) : _0x386fbf;
    (_0x164881['closest']?.('.rh-ai-app-preview-input-slot')?.['classList']?.['remove']('is-inline-editing'),
      _0x164881['classList']['remove']('is-renaming'),
      _0x164881['classList']['toggle'](
        'rh-ai-app-preview-input-label--latin',
        isMediaComponent(_0x43031e) && INPUT_SLOT_LABEL_LATIN_RE['test'](_0x33bd8d),
      ),
      (_0x164881['textContent'] = _0x33bd8d));
  }
  ['_commitPreviewInlineRename'](_0x3679c5, { cancel: cancel = ![] } = {}) {
    if (!_0x3679c5 || _0x3679c5['dataset']['committing'] === 'true') return;
    _0x3679c5['dataset']['committing'] = 'true';
    const _0x4f9f5f = Number(_0x3679c5['dataset']['previewComponentIndex']);
    if (!Number['isInteger'](_0x4f9f5f)) return;
    const _0xefb86d = String(_0x3679c5['dataset']['originalLabel'] || '')['trim'](),
      _0x43c29 = getComponentByIndex(this['componentDrafts'], _0x4f9f5f),
      _0xed2be9 =
        _0x43c29 && isMediaComponent(_0x43c29)
          ? normalizeInputSlotLabel(_0x3679c5['value'], '')
          : String(_0x3679c5['value'] || '')['trim']();
    if (_0x43c29 && isMediaComponent(_0x43c29) && _0x3679c5['value'] !== _0xed2be9)
      _0x3679c5['value'] = _0xed2be9;
    if (cancel || !_0xed2be9 || _0xed2be9 === _0xefb86d) {
      this['_restorePreviewInlineRename'](_0x3679c5);
      return;
    }
    this['_updateComponentDraft'](_0x4f9f5f, 'label', _0xed2be9);
  }
  ['_startPreviewInlineDescriptionEdit'](_0x4ae582, _0x4cfc0f = NaN) {
    const _0x2c77ee = Number(_0x4cfc0f),
      _0x3076d7 = _0x4ae582?.['closest']?.('.rh-ai-app-preview-description-target');
    if (!_0x3076d7 || !this['nodePreviewEl']?.['contains']?.(_0x3076d7)) return;
    const _0x3d49b9 = _0x3076d7['classList']['contains']('rh-ai-app-preview-prompt-help-tip');
    if (!Number['isInteger'](_0x2c77ee) && !_0x3d49b9) return;
    const _0x4632c0 = this['nodePreviewEl']?.['querySelector']?.(
      '[data-role=\x27preview-description-input\x27]',
    );
    if (_0x4632c0) this['_commitPreviewInlineDescriptionEdit'](_0x4632c0);
    const _0x545eb3 = Number['isInteger'](_0x2c77ee)
      ? getComponentByIndex(this['componentDrafts'], _0x2c77ee)
      : null;
    if (Number['isInteger'](_0x2c77ee) && !_0x545eb3) return;
    const _0x5eaa45 = Boolean(
        _0x3076d7['closest']?.('.rh-ai-app-preview-advanced-param') ||
        _0x3076d7['classList']['contains']('rh-ai-app-preview-param-description-tip'),
      ),
      _0xdb8bf1 = _0x3d49b9 ? '提示词说明' : '参数说明',
      _0x456ccf = _0x3d49b9
        ? String(
            _0x3076d7['getAttribute']('data-tooltip') || getPreviewComponentDescription(_0x545eb3, _0xdb8bf1),
          )['trim']() || _0xdb8bf1
        : getPreviewComponentDescription(_0x545eb3, _0xdb8bf1),
      _0x341274 = document['createElement']('input');
    ((_0x341274['type'] = 'text'),
      (_0x341274['className'] = [
        'rh-ai-app-preview-description-input',
        _0x3d49b9 ? 'rh-ai-app-preview-description-input--prompt' : '',
        _0x5eaa45 ? 'rh-ai-app-preview-description-input--param' : '',
      ]
        ['filter'](Boolean)
        ['join']('\x20')),
      (_0x341274['dataset']['role'] = 'preview-description-input'));
    Number['isInteger'](_0x2c77ee) && (_0x341274['dataset']['previewComponentIndex'] = String(_0x2c77ee));
    _0x3d49b9 && (_0x341274['dataset']['previewDescriptionScope'] = 'prompt-help');
    ((_0x341274['dataset']['originalDescription'] = _0x456ccf),
      (_0x341274['value'] = _0x456ccf),
      (_0x341274['placeholder'] = _0xdb8bf1),
      _0x341274['setAttribute']('aria-label', _0xdb8bf1),
      _0x3076d7['replaceWith'](_0x341274));
    const _0x326d52 = () => {
      (_0x341274['focus'](), _0x341274['select']?.());
    };
    typeof window['requestAnimationFrame'] === 'function'
      ? window['requestAnimationFrame'](_0x326d52)
      : _0x326d52();
  }
  ['_restorePreviewInlineDescriptionEdit']() {
    const _0x4ab4f8 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
    this['_patchPreviewWithoutRebuild'](_0x4ab4f8, {
      renderParams: !![],
      renderAdvanced: !![],
      renderPrompt: !![],
    });
  }
  ['_commitPreviewInlineDescriptionEdit'](_0x3568bf, { cancel: cancel = ![] } = {}) {
    if (!_0x3568bf || _0x3568bf['dataset']['committing'] === 'true') return;
    _0x3568bf['dataset']['committing'] = 'true';
    const _0x1a8dad = Number(_0x3568bf['dataset']['previewComponentIndex']),
      _0x2f4392 = _0x3568bf['dataset']['previewDescriptionScope'] === 'prompt-help';
    if (!Number['isInteger'](_0x1a8dad) && !_0x2f4392) return;
    const _0xf8dc1a = String(_0x3568bf['dataset']['originalDescription'] || '')['trim'](),
      _0x55d6f1 = String(_0x3568bf['value'] || '')['trim']();
    if (cancel || !_0x55d6f1 || _0x55d6f1 === _0xf8dc1a) {
      this['_restorePreviewInlineDescriptionEdit']();
      return;
    }
    if (!Number['isInteger'](_0x1a8dad) && _0x2f4392) {
      this['_updatePromptHelpTooltip'](_0x55d6f1);
      return;
    }
    this['_updateComponentDraft'](_0x1a8dad, 'description', _0x55d6f1);
  }
  ['_handlePanelKeyDown'](_0x31e409) {
    const _0x43679d = _0x31e409['target']?.['closest']?.('.rh-ai-app-preview-description-target');
    if (_0x43679d && this['panel']?.['contains'](_0x43679d)) {
      if (_0x31e409['key'] === 'Enter' || _0x31e409['key'] === '\x20') {
        const _0x4a9a91 = Number(_0x43679d['dataset']['previewComponentIndex']),
          _0x4f37f7 = _0x43679d['classList']['contains']('rh-ai-app-preview-prompt-help-tip');
        (Number['isInteger'](_0x4a9a91) || _0x4f37f7) &&
          (_0x31e409['preventDefault'](),
          _0x31e409['stopPropagation'](),
          this['_startPreviewInlineDescriptionEdit'](_0x43679d, _0x4a9a91));
      }
      return;
    }
    const _0xbac1de = _0x31e409['target']?.['closest']?.("[data-role='preview-description-input']");
    if (_0xbac1de && this['panel']?.['contains'](_0xbac1de)) {
      if (_0x31e409['key'] === 'Enter') {
        (_0x31e409['preventDefault'](),
          _0x31e409['stopPropagation'](),
          this['_commitPreviewInlineDescriptionEdit'](_0xbac1de));
        return;
      }
      _0x31e409['key'] === 'Escape' &&
        (_0x31e409['preventDefault'](),
        _0x31e409['stopPropagation'](),
        this['_commitPreviewInlineDescriptionEdit'](_0xbac1de, { cancel: !![] }));
      return;
    }
    const _0x3d6037 = _0x31e409['target']?.['closest']?.("[data-role='preview-rename-input']");
    if (!_0x3d6037 || !this['panel']?.['contains'](_0x3d6037)) return;
    if (_0x31e409['key'] === 'Enter') {
      (_0x31e409['preventDefault'](),
        _0x31e409['stopPropagation'](),
        this['_commitPreviewInlineRename'](_0x3d6037));
      return;
    }
    _0x31e409['key'] === 'Escape' &&
      (_0x31e409['preventDefault'](),
      _0x31e409['stopPropagation'](),
      this['_commitPreviewInlineRename'](_0x3d6037, { cancel: !![] }));
  }
  ['_handlePanelFocusOut'](_0x578da4) {
    const _0x5f5694 = _0x578da4['target']?.['closest']?.("[data-role='preview-description-input']");
    if (_0x5f5694 && this['panel']?.['contains'](_0x5f5694)) {
      this['_commitPreviewInlineDescriptionEdit'](_0x5f5694);
      return;
    }
    const _0x522f9e = _0x578da4['target']?.['closest']?.('[data-role=\x27preview-rename-input\x27]');
    if (!_0x522f9e || !this['panel']?.['contains'](_0x522f9e)) return;
    const _0x2d3ba7 = _0x578da4['relatedTarget']?.['closest']?.("[data-action='confirm-preview-rename']");
    if (_0x2d3ba7 && this['panel']?.['contains'](_0x2d3ba7)) return;
    this['_commitPreviewInlineRename'](_0x522f9e);
  }
  ['_closeComponentSelectMenus'](_0x3daa57 = null, { preserveComfyPicker: preserveComfyPicker = ![] } = {}) {
    this['componentListEl']
      ?.['querySelectorAll']?.('[data-component-select].is-open')
      ['forEach']((_0x33c8f0) => {
        if (_0x3daa57 && _0x33c8f0 === _0x3daa57) return;
        (_0x33c8f0['classList']['remove']('is-open'),
          _0x33c8f0['querySelector']('.rh-ai-app-select-trigger')?.['setAttribute'](
            'aria-expanded',
            'false',
          ));
      });
    if (preserveComfyPicker) return;
    this['comfyCandidatePickerOpen'] = ![];
    if (this['componentPickerEl']) {
      ((this['componentPickerEl']['hidden'] = ![]),
        this['componentPickerEl']['setAttribute']('aria-hidden', 'true'));
      const _0x253325 = this['componentPickerEl']['closest']?.('.rh-ai-app-comfy-add-panel');
      _0x253325?.['classList']?.['remove']('is-open');
      const _0x131fca = _0x253325?.['querySelector']?.("[data-action='toggle-comfy-candidate-select']");
      _0x131fca?.['setAttribute']('aria-expanded', 'false');
      if (_0x131fca) _0x131fca['textContent'] = '点击添加组件';
    }
  }
  ['_closeInlineMenusBeforeContextMenu']() {
    this['_closeComponentSelectMenus']();
    if (!this['previewAppMenuOpen']) return;
    ((this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''));
    const _0x31db0d = this['panel']?.['querySelector']?.('[data-role=\x27saved-app-menu\x27]');
    if (_0x31db0d) _0x31db0d['hidden'] = !![];
  }
  ['_toggleComponentSelect'](_0x4d24de) {
    const _0x46be44 = _0x4d24de?.['closest']?.('[data-component-select]');
    if (!_0x46be44 || !this['panel']?.['contains'](_0x46be44)) return;
    const _0x542f52 = !_0x46be44['classList']['contains']('is-open');
    (this['_closeComponentSelectMenus'](_0x46be44),
      _0x46be44['classList']['toggle']('is-open', _0x542f52),
      _0x4d24de['setAttribute']('aria-expanded', _0x542f52 ? 'true' : 'false'),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['_patchPreviewAppChrome']());
  }
  ['_chooseComponentSelect'](_0x35b7b7) {
    const _0x416d3b = _0x35b7b7?.['closest']?.('[data-component-index]'),
      _0x5cd331 = Number(_0x416d3b?.['dataset']['componentIndex']),
      _0x498c99 = String(_0x35b7b7?.['dataset']?.['componentProp'] || '');
    if (!Number['isInteger'](_0x5cd331) || !_0x498c99) return;
    (this['_closeComponentSelectMenus'](),
      this['_updateComponentDraft'](_0x5cd331, _0x498c99, _0x35b7b7['dataset']['value']));
  }
  ['_choosePreviewControlType'](_0x1e2856) {
    const _0xabf57f = Number(_0x1e2856?.['dataset']?.['previewComponentIndex']),
      _0x25c39c = String(_0x1e2856?.['dataset']?.['value'] || '');
    if (!Number['isInteger'](_0xabf57f) || !_0x25c39c) return;
    const _0x2d8235 = getComponentByIndex(this['componentDrafts'], _0xabf57f),
      _0x4426c9 = normalizeControlType(_0x25c39c),
      _0x3b9ed9 =
        _0x4426c9 === 'prompt' &&
        _0x2d8235 &&
        normalizeComponentKind(_0x2d8235['componentKind']) !== 'prompt',
      _0x5d74bb =
        PREVIEW_PARAM_TEXT_TYPE_VALUES['includes'](_0x4426c9) &&
        _0x2d8235 &&
        normalizeComponentKind(_0x2d8235['componentKind']) === 'prompt',
      _0x4d4325 =
        _0x3b9ed9 || _0x5d74bb ? this['previewDragController']['captureComponentRect'](_0xabf57f) : null;
    (this['_closeComponentSelectMenus'](),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''));
    const _0x34a01c = normalizeControlType(_0x25c39c) === 'prompt' ? 'componentKind' : 'controlType';
    this['_updateComponentDraft'](_0xabf57f, _0x34a01c, _0x25c39c, {
      animatePreviewMoveFromRect: _0x4d4325,
      preferredPreviewPlacement: _0x5d74bb ? 'advanced' : '',
    });
  }
  ['_setError'](_0x5ebd77) {
    const _0x153ed2 = String(_0x5ebd77 || '')['trim']();
    this['errorMessage'] = _0x153ed2;
    if (!this['errorEl']) return;
    ((this['errorEl']['hidden'] = !_0x153ed2), (this['errorEl']['textContent'] = _0x153ed2));
  }
  ['_setSummary'](_0x1b4874) {
    if (!this['summaryEl']) return;
    this['summaryEl']['hidden'] = Boolean(_0x1b4874);
    const _0x340b5d = _0x1b4874
      ? this['_isComfyUiSource']()
        ? summarizeComfyUiWorkflowBundle(_0x1b4874)
        : summarizeRunningHubAiAppBundle(_0x1b4874)
      : null;
    ((this['summaryEl']['innerHTML'] = renderSummaryHtml(
      _0x340b5d && {
        ..._0x340b5d,
        resourceIdLabel: this['sourceType'] === SOURCE_TYPES['runninghubWorkflow'] ? '工作流 ID' : 'App ID',
      },
      this['_getSourceMeta']()?.['emptyText'],
    )),
      this['_syncWorkflowInputCollapsed']());
  }
  ['_getWorkflowInputSummaryText'](_0x1c1b85 = this['currentBundle']) {
    if (!_0x1c1b85) return '';
    const _0xe2f94e = this['_isComfyUiSource']()
      ? summarizeComfyUiWorkflowBundle(_0x1c1b85)
      : summarizeRunningHubAiAppBundle(_0x1c1b85);
    if (!_0xe2f94e?.['modelId']) return '';
    const _0xbe954b = this['_getSourceMeta']()?.['label'] || '工作流',
      _0x33370c = OUTPUT_KIND_LABELS[_0xe2f94e['kind']] || _0xe2f94e['kind'],
      _0x21d0df = Number(_0xe2f94e['slotCount'] ?? _0xe2f94e['slots']?.['length'] ?? 0x0),
      _0x33b88d = Number(_0xe2f94e['paramCount'] ?? _0xe2f94e['params']?.['length'] ?? 0x0);
    return _0xbe954b + ' · ' + _0x33370c + ' · ' + _0x21d0df + ' 个入参 · ' + _0x33b88d + ' 个参数';
  }
  ['_syncWorkflowInputCollapsed']() {
    const _0x31207a = Boolean(this['currentBundle']);
    if (!_0x31207a) this['workflowInputCollapsed'] = ![];
    this['workflowInputFieldEl']?.['classList']?.['toggle'](
      'is-collapsed',
      _0x31207a && this['workflowInputCollapsed'],
    );
    if (this['workflowInputToggleBtn']) {
      this['workflowInputToggleBtn']['hidden'] = !_0x31207a;
      const _0x24d451 = this['workflowInputCollapsed'] ? '展开 JSON' : '收起 JSON';
      (this['workflowInputToggleBtn']['setAttribute']('aria-label', _0x24d451),
        (this['workflowInputToggleBtn']['title'] = _0x24d451),
        this['workflowInputToggleBtn']['setAttribute'](
          'aria-expanded',
          this['workflowInputCollapsed'] ? 'false' : 'true',
        ));
    }
    if (this['workflowInputSummaryEl']) {
      const _0x4b0f24 = this['_getWorkflowInputSummaryText'](),
        _0x4014a6 = Boolean(_0x4b0f24),
        _0x510bde =
          _0x31207a && _0x4014a6 && (this['workflowInputCollapsed'] || this['_isRunningHubAiAppSource']());
      ((this['workflowInputSummaryEl']['hidden'] = !_0x4014a6),
        this['workflowInputSummaryEl']['classList']?.['toggle']('is-visible', _0x510bde),
        this['workflowInputSummaryEl']['setAttribute']('aria-hidden', _0x510bde ? 'false' : 'true'));
      if (_0x4014a6) {
        this['workflowInputSummaryEl']['textContent'] = _0x4b0f24;
        if (this['_isRunningHubAiAppSource']()) {
          const _0x3f2a2f = this['_getSourceMeta']()['label'];
          this['workflowInputSummaryEl']['innerHTML'] =
            '<span class="rh-ai-app-resource-type" data-role="runninghub-resource-type">' +
            escapeHtml(_0x3f2a2f) +
            '</span>' +
            escapeHtml(_0x4b0f24['slice'](_0x3f2a2f['length']));
        }
      }
    }
  }
  ['_toggleWorkflowInputCollapsed']() {
    if (!this['currentBundle']) return;
    ((this['workflowInputCollapsed'] = !this['workflowInputCollapsed']),
      this['_syncWorkflowInputCollapsed']());
  }
  ['_getInputText']() {
    return this['textarea']?.['value'] || '';
  }
  ['_getAppIdText']() {
    return '';
  }
  ['_setWorkflowJsonDropActive'](_0x53d5c8) {
    if (!_0x53d5c8) this['workflowJsonDragDepth'] = 0x0;
    this['workflowInputFieldEl']?.['classList']?.['toggle']('is-json-drag-over', _0x53d5c8 === !![]);
  }
  ['_canAcceptWorkflowJsonDrop'](_0x5c08fa) {
    return Boolean(this['sourceType'] && hasFileDragPayload(_0x5c08fa));
  }
  ['_handleWorkflowJsonFileDragEnter'](_0x1104d7) {
    if (!this['_canAcceptWorkflowJsonDrop'](_0x1104d7)) return;
    (_0x1104d7['preventDefault'](),
      _0x1104d7['stopPropagation'](),
      (this['workflowJsonDragDepth'] += 0x1),
      this['_setWorkflowJsonDropActive'](!![]));
    if (_0x1104d7['dataTransfer']) _0x1104d7['dataTransfer']['dropEffect'] = 'copy';
  }
  ['_handleWorkflowJsonFileDragOver'](_0x49238a) {
    if (!this['_canAcceptWorkflowJsonDrop'](_0x49238a)) return;
    (_0x49238a['preventDefault'](), _0x49238a['stopPropagation'](), this['_setWorkflowJsonDropActive'](!![]));
    if (_0x49238a['dataTransfer']) _0x49238a['dataTransfer']['dropEffect'] = 'copy';
  }
  ['_handleWorkflowJsonFileDragLeave'](_0x3663d2) {
    if (!this['_canAcceptWorkflowJsonDrop'](_0x3663d2)) return;
    (_0x3663d2['preventDefault'](),
      _0x3663d2['stopPropagation'](),
      (this['workflowJsonDragDepth'] = Math['max'](0x0, this['workflowJsonDragDepth'] - 0x1)));
    if (this['workflowJsonDragDepth'] === 0x0) this['_setWorkflowJsonDropActive'](![]);
  }
  async ['_handleWorkflowJsonFileDrop'](_0x2b4e83) {
    if (!this['_canAcceptWorkflowJsonDrop'](_0x2b4e83)) return;
    (_0x2b4e83['preventDefault'](), _0x2b4e83['stopPropagation'](), this['_setWorkflowJsonDropActive'](![]));
    const [_0x48d82a] = Array['from'](_0x2b4e83['dataTransfer']?.['files'] || []);
    if (!_0x48d82a) return;
    if (!isJsonFile(_0x48d82a)) {
      const _0x553d79 = '请拖入 .json 文件';
      (this['_setError'](_0x553d79), window['showToast']?.(_0x553d79, 'error'));
      return;
    }
    const _0x5792d4 = this['definitionController']['beginFileRead']();
    try {
      const _0x2fc43c = await _0x48d82a['text']();
      if (!_0x5792d4['isCurrent']()) return;
      window['clearTimeout'](this['parseTimer']);
      if (this['textarea']) this['textarea']['value'] = String(_0x2fc43c || '');
      ((this['appName'] = normalizeDroppedJsonAppName(_0x48d82a['name'])),
        (this['savedAppId'] = ''),
        (this['workflowInputCollapsed'] = ![]),
        (this['previewAppMenuOpen'] = ![]),
        (this['pendingDeleteSavedAppId'] = ''),
        (this['pendingOverwriteSavedAppId'] = ''),
        (this['pendingOverwriteIntent'] = ''),
        this['_closeComponentSelectMenus']());
      const _0x1d2edf = this['_parseNow']();
      if (_0x1d2edf) window['showToast']?.('JSON 文件已载入', 'success');
    } catch (_0x15d96b) {
      if (!_0x5792d4['isCurrent']()) return;
      const _0x3f0453 = _0x15d96b?.['message'] || 'JSON 文件读取失败';
      (this['_setError'](_0x3f0453), window['showToast']?.(_0x3f0453, 'error'));
    } finally {
      _0x5792d4['finish']();
    }
  }
  ['_getComponentDraftKey'](_0x128ac0 = this['_getInputText'](), _0x449dbc = this['_getAppIdText']()) {
    const _0x162e82 = isComfyUiSource(this['sourceType'])
      ? COMFYUI_WORKFLOW_STATE_SCOPE
      : String(this['sourceType'] || '')['trim']();
    return (
      _0x162e82 + '\x0a' + String(_0x449dbc || '')['trim']() + '\x0a' + String(_0x128ac0 || '')['trim']()
    );
  }
  ['_syncComponentDrafts']({ force: force = ![] } = {}) {
    const _0x53327b = this['_getInputText'](),
      _0x54181f = this['_getAppIdText'](),
      _0x56afd4 = this['_getComponentDraftKey'](_0x53327b, _0x54181f);
    if (
      !force &&
      _0x56afd4 === this['componentDraftKey'] &&
      (this['componentDrafts']['length'] || this['componentCandidates']['length'])
    )
      return;
    if (this['_shouldShowManualComponentPicker']()) {
      const { components: _0x558af0 } =
        this['sourceType'] === SOURCE_TYPES['runninghubWorkflow']
          ? createRunningHubWorkflowComponentDrafts(_0x53327b)
          : createComfyUiWorkflowComponentDrafts(_0x53327b);
      ((this['componentDraftKey'] = _0x56afd4),
        (this['comfyCandidateSearchText'] = ''),
        (this['comfyCandidatePickerOpen'] = ![]),
        (this['componentCandidates'] = cloneComponentDrafts(_0x558af0)),
        (this['componentDrafts'] = preserveComfyComponentDrafts(this['componentDrafts'], _0x558af0)),
        this['_renderComponentConfig']());
      return;
    }
    const { parsed: _0x4b275f, components: _0x52fffa } = createRunningHubAiAppComponentDrafts(_0x53327b, {
      appId: _0x54181f,
    });
    (_0x4b275f['providerProfileId'] &&
      ((this['runningHubProfileId'] = normalizeRunningHubModelApiProfileId(_0x4b275f['providerProfileId'])),
      this['_syncRunningHubRuntimeControl']()),
      (this['componentDraftKey'] = _0x56afd4),
      (this['componentDrafts'] = cloneComponentDrafts(_0x52fffa)),
      (this['componentCandidates'] = []),
      (this['comfyCandidatePickerOpen'] = ![]),
      this['_renderComponentConfig']());
  }
  ['_renderComponentConfig']() {
    (this['componentListEl'] &&
      (this['componentListEl']['innerHTML'] = renderComponentConfigHtml(
        this['componentDrafts'],
        this['appName'],
        this['appDescription'],
        {},
      )),
      this['builderEl'] && (this['builderEl']['hidden'] = ![]));
  }
  ['_renderComfyCandidatePicker']({ open: open = ![], preserveSearchFocus: preserveSearchFocus = ![] } = {}) {
    if (!this['componentPickerEl']) return;
    const _0x571e00 = this['_shouldShowManualComponentPicker']() && Boolean(this['componentDraftKey']);
    if (!_0x571e00) {
      ((this['comfyCandidatePickerOpen'] = ![]),
        (this['componentPickerEl']['hidden'] = !![]),
        this['componentPickerEl']['setAttribute']('aria-hidden', 'true'),
        (this['componentPickerEl']['innerHTML'] = ''));
      return;
    }
    this['comfyCandidatePickerOpen'] = open === !![];
    const _0xe0cbf7 = new Set(
      this['componentDrafts']
        ['map']((_0x4fb83c) => Number(_0x4fb83c?.['index']))
        ['filter']((_0x43e4c0) => Number['isInteger'](_0x43e4c0)),
    );
    ((this['componentPickerEl']['innerHTML'] = renderComfyUiCandidateMenuHtml(
      this['componentCandidates'],
      _0xe0cbf7,
      this['comfyCandidateSearchText'],
    )),
      (this['componentPickerEl']['hidden'] = ![]),
      this['componentPickerEl']['setAttribute']('aria-hidden', open === !![] ? 'false' : 'true'));
    const _0x2fb8ac = this['componentPickerEl']['closest']?.('.rh-ai-app-comfy-add-panel');
    _0x2fb8ac?.['classList']?.['toggle']('is-open', open === !![]);
    const _0x1be965 = _0x2fb8ac?.['querySelector']?.('[data-action=\x27toggle-comfy-candidate-select\x27]');
    _0x1be965?.['setAttribute']('aria-expanded', open === !![] ? 'true' : 'false');
    if (_0x1be965) _0x1be965['textContent'] = open === !![] ? '收起组件' : '点击添加组件';
    if (open && preserveSearchFocus) {
      const _0xedb17f = _0x2fb8ac?.['querySelector']('[data-role=\x27comfyui-candidate-search\x27]'),
        _0x2f9b1d = String(this['comfyCandidateSearchText'] || '')['length'];
      (_0xedb17f?.['focus']?.(), _0xedb17f?.['setSelectionRange']?.(_0x2f9b1d, _0x2f9b1d));
    }
  }
  ['_toggleComfyCandidateMenu']() {
    if (!this['_shouldShowManualComponentPicker']()) return;
    if (!this['componentDraftKey']) {
      ((this['comfyCandidatePickerOpen'] = ![]), this['_renderComfyCandidatePicker']({ open: ![] }));
      return;
    }
    const _0x452599 = this['comfyCandidatePickerOpen'] !== !![];
    (this['_closeComponentSelectMenus'](null, { preserveComfyPicker: !![] }),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''));
    if (_0x452599) this['comfyCandidateSearchText'] = '';
    ((this['comfyCandidatePickerOpen'] = _0x452599),
      this['_renderComfyCandidatePicker']({ open: _0x452599 }));
  }
  ['_captureComfyCandidateScrollState'](_0x4dddfc = null) {
    const _0x3fec86 = _0x4dddfc?.['closest']?.('.rh-ai-app-candidate-options');
    return {
      panelScrollTop: Number(this['bodyEl']?.['scrollTop'] || 0x0),
      candidateScrollTop: Number(_0x3fec86?.['scrollTop'] || 0x0),
    };
  }
  ['_restoreComfyCandidateScrollState'](_0x1fb6a5 = {}) {
    this['bodyEl'] &&
      Number['isFinite'](_0x1fb6a5['panelScrollTop']) &&
      (this['bodyEl']['scrollTop'] = _0x1fb6a5['panelScrollTop']);
    const _0x581a77 = this['componentPickerEl']?.['querySelector']?.('.rh-ai-app-candidate-options');
    (_0x581a77 &&
      Number['isFinite'](_0x1fb6a5['candidateScrollTop']) &&
      (_0x581a77['scrollTop'] = _0x1fb6a5['candidateScrollTop']),
      this['_syncStickyHeaderShadow']());
  }
  ['_chooseComfyCandidate'](_0x3a64cb) {
    if (!this['_shouldShowManualComponentPicker']()) return;
    const _0x4d15f6 = Number(_0x3a64cb?.['dataset']?.['componentIndex']);
    if (!Number['isInteger'](_0x4d15f6)) return;
    const _0x33cec0 = this['componentDrafts']['some'](
      (_0x776f7e) => Number(_0x776f7e?.['index']) === _0x4d15f6,
    );
    if (_0x33cec0) return;
    const _0x5c2b77 = this['componentCandidates']['find'](
      (_0x37e190) => Number(_0x37e190?.['index']) === _0x4d15f6,
    );
    if (!_0x5c2b77) return;
    const _0x43228c = this['_captureComfyCandidateScrollState'](_0x3a64cb);
    (this['componentDrafts']['push']({
      ..._0x5c2b77,
      label: getComfyUiCandidateDefaultComponentName(_0x5c2b77),
    }),
      (this['comfyCandidatePickerOpen'] = !![]));
    const _0x1dbca6 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
    (this['_patchPreviewWithoutRebuild'](_0x1dbca6, {
      renderInputs: !![],
      renderParams: !![],
      renderAdvanced: !![],
      renderPrompt: !![],
      renderAppChrome: !![],
      renderActionControls: !![],
    }),
      this['_renderComfyCandidatePicker']({ open: !![] }),
      this['_restoreComfyCandidateScrollState'](_0x43228c),
      requestAnimationFrame(() => this['_restoreComfyCandidateScrollState'](_0x43228c)));
  }
  ['_renderNodePreview'](_0x1a044f = this['currentBundle']) {
    return this['previewPresentation']['_renderNodePreview'](_0x1a044f);
  }
  ['_closePreviewAppMenuElement'](_0x37ce5a) {
    return this['previewPresentation']['_closePreviewAppMenuElement'](_0x37ce5a);
  }
  ['_patchPreviewAppChrome']() {
    return this['previewPresentation']['_patchPreviewAppChrome']();
  }
  ['_patchSaveConfigMenu']() {
    return this['previewPresentation']['_patchSaveConfigMenu']();
  }
  ['_patchCreateConfigMenu']() {
    return this['previewPresentation']['_patchCreateConfigMenu']();
  }
  ['_patchFooterOverwriteMenu'](_0x3e2bfc, _0xefc01e) {
    return this['previewPresentation']['_patchFooterOverwriteMenu'](_0x3e2bfc, _0xefc01e);
  }
  ['_patchPreviewPromptArea']() {
    return this['previewPresentation']['_patchPreviewPromptArea']();
  }
  ['_patchPreviewActionControls'](_0x58a349 = this['currentBundle']) {
    return this['previewPresentation']['_patchPreviewActionControls'](_0x58a349);
  }
  ['_patchPreviewWithoutRebuild'](_0x20c6b7 = this['currentBundle'], _0x2951c9 = {}) {
    return this['previewPresentation']['_patchPreviewWithoutRebuild'](_0x20c6b7, _0x2951c9);
  }
  ['_renderPreviewMutableZones'](_0x37c45b = this['currentBundle'], _0x263aa0 = {}) {
    return this['previewPresentation']['_renderPreviewMutableZones'](_0x37c45b, _0x263aa0);
  }
  ['_clearBuilder']() {
    ((this['componentDraftKey'] = ''),
      (this['componentDrafts'] = []),
      (this['componentCandidates'] = []),
      (this['promptHelpTooltip'] = ''),
      (this['comfyCandidateSearchText'] = ''),
      (this['comfyCandidatePickerOpen'] = ![]),
      (this['workflowInputCollapsed'] = ![]),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['previewPresentation']['clearUiSchemaBinding'](),
      this['_renderComponentConfig'](),
      this['_renderNodePreview'](null),
      this['_syncWorkflowInputCollapsed'](),
      this['_setActionButtonsEnabled'](![]));
  }
  ['_clearCurrentDraftIdentity']() {
    ((this['savedAppId'] = ''),
      (this['appName'] = DEFAULT_AI_APP_NAME),
      (this['appDescription'] = ''),
      (this['promptHelpTooltip'] = ''),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''));
  }
  ['_buildCurrentBundle']({ syncComponents: syncComponents = !![] } = {}) {
    if (this['_isRunningHubAiAppSource']())
      assertRunningHubDefinitionProfile(this['_getInputText'](), this['runningHubProfileId']);
    if (syncComponents) this['definitionController']['syncInputSource']();
    if (syncComponents) this['_syncComponentDrafts']();
    normalizeParameterGroups(this['componentDrafts']);
    if (this['sourceType'] === SOURCE_TYPES['runninghubWorkflow'])
      return buildRunningHubWorkflowManifestBundle({
        input: this['_getInputText'](),
        kind: this['kind'],
        components: this['componentDrafts'],
        displayName: normalizeAppName(this['appName']),
        description: this['appDescription'],
        promptHelpTooltip: this['promptHelpTooltip'],
        appKey: this['savedAppId'],
      });
    if (this['_isComfyUiSource']())
      return buildComfyUiWorkflowManifestBundle({
        input: this['_getInputText'](),
        kind: this['kind'],
        components: this['componentDrafts'],
        displayName: normalizeAppName(this['appName']),
        description: normalizeAppDescription(this['appDescription']),
        promptHelpTooltip: normalizePromptHelpTooltip(this['promptHelpTooltip']),
        appKey: this['savedAppId'],
        baseUrlMode: getComfyUiBaseUrlMode(this['sourceType']),
        componentSelectionMode: 'manual',
      });
    return buildRunningHubAiAppManifestBundle({
      input: this['_getInputText'](),
      appId: this['_getAppIdText'](),
      kind: this['kind'],
      components: this['componentDrafts'],
      displayName: normalizeAppName(this['appName']),
      description: normalizeAppDescription(this['appDescription']),
      promptHelpTooltip: normalizePromptHelpTooltip(this['promptHelpTooltip']),
      appKey: this['savedAppId'],
    });
  }
  ['_refreshBundleFromComponents']({ renderPreview: renderPreview = !![] } = {}) {
    try {
      const _0x58c190 = this['_buildCurrentBundle']({ syncComponents: ![] });
      ((this['currentBundle'] = _0x58c190), this['_setSummary'](_0x58c190), this['_setError'](''));
      if (renderPreview) this['_renderNodePreview'](_0x58c190);
      return (this['_setActionButtonsEnabled'](!![]), this['_saveKindState'](), _0x58c190);
    } catch (_0x1da9e6) {
      return (
        (this['currentBundle'] = null),
        this['_setActionButtonsEnabled'](![]),
        this['_setError'](_0x1da9e6?.['message'] || '解析失败'),
        this['_saveKindState'](),
        null
      );
    }
  }
  ['_bindPreviewUiSchemaControls']() {
    return this['previewPresentation']['_bindPreviewUiSchemaControls']();
  }
  ['_commitPreviewUiSchemaValue'](_0x151e9e, _0x141cfa) {
    const _0x3737db = String(_0x151e9e || '')['trim']();
    if (!_0x3737db) return buildPreviewUiSchemaNodeData(this['currentBundle']);
    const _0x39ccef = getBundleParamFields(this['currentBundle'])['find'](
        (_0x51cf2f) => String(_0x51cf2f?.['id'] || '')['trim']() === _0x3737db,
      ),
      _0x4d3d46 = getCustomAiAppComponentIndex(_0x39ccef),
      _0x218749 = Number['isInteger'](_0x4d3d46)
        ? getComponentByIndex(this['componentDrafts'], _0x4d3d46)
        : null;
    if (!_0x218749 || !isParamComponent(_0x218749))
      return buildPreviewUiSchemaNodeData(this['currentBundle']);
    const _0x540f06 = normalizeControlType(_0x218749['controlType']);
    if (_0x540f06 === 'toggle')
      _0x218749['defaultValue'] =
        _0x141cfa === !![] || String(_0x141cfa)['toLowerCase']() === 'true' ? 'true' : 'false';
    else {
      if (_0x540f06 === 'stepper')
        _0x218749['defaultValue'] = String(Math['trunc'](Number(_0x141cfa) || 0x0));
      else {
        if (_0x540f06 === 'float') {
          const _0x721bbf = Number(_0x141cfa);
          _0x218749['defaultValue'] = Number['isFinite'](_0x721bbf) ? String(_0x721bbf) : '0';
        } else _0x218749['defaultValue'] = String(_0x141cfa ?? '');
      }
    }
    const _0x30e418 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
    return buildPreviewUiSchemaNodeData(_0x30e418 || this['currentBundle']);
  }
  ['_decoratePreviewAdvancedFields'](_0x41d405 = this['currentBundle']) {
    return this['previewPresentation']['_decoratePreviewAdvancedFields'](_0x41d405);
  }
  ['_isPreviewRenameTarget'](_0x2d03e4) {
    return !!_0x2d03e4?.['closest']?.('.rh-ai-app-preview-rename-target');
  }
  ['_isPreviewControlTarget'](_0x43b075) {
    return !!_0x43b075?.['closest']?.(
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
        '.rh-ai-app-preview-param-zone\x20[data-ui-schema-value],\x20' +
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
        '.rh-ai-app-preview-advanced-panel\x20.rh-tip,\x20' +
        '.rh-ai-app-preview-advanced-panel\x20.ui-schema-info-tip,\x20' +
        '.rh-ai-app-preview-typebar-action,\x20' +
        '.rh-ai-app-preview-typebar-option',
    );
  }
  ['_handleComponentInput'](_0x3e7546) {
    const _0x22e9ce = _0x3e7546['target']?.['closest']?.('[data-role=\x27preview-rename-input\x27]');
    if (_0x22e9ce && this['panel']?.['contains'](_0x22e9ce)) {
      const _0x56532c = Number(_0x22e9ce['dataset']['previewComponentIndex']),
        _0xd7682e = getComponentByIndex(this['componentDrafts'], _0x56532c);
      if (_0xd7682e && isMediaComponent(_0xd7682e)) {
        const _0x251ac3 = normalizeInputSlotLabel(_0x22e9ce['value'], '');
        if (_0x22e9ce['value'] !== _0x251ac3) _0x22e9ce['value'] = _0x251ac3;
      }
      return;
    }
    const _0x3f676d = _0x3e7546['target']?.['closest']?.('[data-role=\x27comfyui-candidate-search\x27]');
    if (_0x3f676d && this['panel']?.['contains'](_0x3f676d)) {
      if (this['comfyCandidateSearchText'] === String(_0x3f676d['value'] || '')) return;
      ((this['comfyCandidateSearchText'] = String(_0x3f676d['value'] || '')),
        this['_renderComfyCandidatePicker']({ open: !![], preserveSearchFocus: !![] }));
      return;
    }
    const _0x2b0082 = _0x3e7546['target']?.['closest']?.('[data-app-prop]');
    if (_0x2b0082 && this['panel']?.['contains'](_0x2b0082)) {
      const _0x36f356 = String(_0x2b0082['dataset']['appProp'] || '');
      if (_0x36f356 === 'appName')
        ((this['appName'] = String(_0x2b0082['value'] || '')),
          (this['pendingDeleteSavedAppId'] = ''),
          (this['pendingOverwriteSavedAppId'] = ''),
          (this['pendingOverwriteIntent'] = ''));
      else {
        if (_0x36f356 === 'appDescription') this['appDescription'] = String(_0x2b0082['value'] || '');
        else return;
      }
      (this['_refreshBundleFromComponents']({ renderPreview: ![] }), this['_patchPreviewAppChrome']());
      return;
    }
    const _0x153957 = _0x3e7546['target']?.['closest']?.('[data-component-prop]');
    if (!_0x153957 || !this['panel']?.['contains'](_0x153957)) return;
    const _0x1c4ee0 = _0x153957['closest']('[data-component-index]'),
      _0x50180d = Number(_0x1c4ee0?.['dataset']['componentIndex']),
      _0x4fe540 = String(_0x153957['dataset']['componentProp'] || '');
    if (!Number['isInteger'](_0x50180d) || !_0x4fe540) return;
    let _0x435176 = _0x153957['value'];
    const _0x538aba = getComponentByIndex(this['componentDrafts'], _0x50180d);
    if (_0x4fe540 === 'label' && _0x538aba && isMediaComponent(_0x538aba)) {
      _0x435176 = normalizeInputSlotLabel(_0x435176, '');
      if (_0x153957['value'] !== _0x435176) _0x153957['value'] = _0x435176;
    }
    this['_updateComponentDraft'](_0x50180d, _0x4fe540, _0x435176);
  }
  ['_updatePromptHelpTooltip'](_0x160b59) {
    this['promptHelpTooltip'] = normalizePromptHelpTooltip(_0x160b59);
    const _0x362275 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
    this['_patchPreviewWithoutRebuild'](_0x362275, { renderPrompt: !![] });
  }
  ['_updateComponentDraft'](
    _0x15a564,
    _0x3f644d,
    _0x174089,
    {
      animatePreviewMoveFromRect: animatePreviewMoveFromRect = null,
      preferredPreviewPlacement: preferredPreviewPlacement = '',
    } = {},
  ) {
    const _0x368912 = this['componentDrafts']['find'](
      (_0x397727) => Number(_0x397727['index']) === _0x15a564,
    );
    if (!_0x368912) return;
    if (_0x3f644d === 'componentKind') {
      if (_0x368912['componentKindLocked'] === !![]) return;
      const _0x157a73 = normalizeComponentKind(_0x174089),
        _0x343e11 = getComponentKindOptions(_0x368912, normalizeComponentKind(_0x368912['componentKind']));
      if (!optionValuesInclude(_0x343e11, _0x157a73)) return;
      _0x368912['componentKind'] = _0x157a73;
      if (_0x157a73 === 'prompt') _0x368912['controlType'] = 'prompt';
      if (_0x157a73 === 'param' && normalizeControlType(_0x368912['controlType']) === 'prompt') {
        const _0x3947a2 = getControlTypeOptions(_0x368912, normalizeControlType(_0x368912['controlType']));
        _0x368912['controlType'] =
          _0x3947a2['find'](([_0x5c6adb]) => _0x5c6adb !== 'prompt')?.[0x0] || 'text';
      }
      if (!isMediaComponent(_0x368912)) delete _0x368912['inputOrder'];
      !isParamComponent(_0x368912) &&
        (delete _0x368912['homeParamOrder'],
        delete _0x368912['advancedParamOrder'],
        delete _0x368912['previewPlacement']);
    } else {
      if (_0x3f644d === 'controlType') {
        if (_0x368912['controlTypeLocked'] === !![]) return;
        const _0x257d7c = normalizeControlType(_0x174089),
          _0x472f8b = getControlTypeOptions(_0x368912, normalizeControlType(_0x368912['controlType']));
        if (!optionValuesInclude(_0x472f8b, _0x257d7c)) return;
        _0x257d7c === 'prompt'
          ? ((_0x368912['componentKind'] = 'prompt'),
            (_0x368912['controlType'] = 'prompt'),
            delete _0x368912['homeParamOrder'],
            delete _0x368912['advancedParamOrder'],
            delete _0x368912['previewPlacement'])
          : ((_0x368912['componentKind'] = 'param'),
            (_0x368912['controlType'] = _0x257d7c),
            preferredPreviewPlacement &&
              (this['previewDragController']['placeParamDraft'](_0x368912, preferredPreviewPlacement),
              _0x368912['previewPlacement'] !== preferredPreviewPlacement &&
                this['previewDragController']['placeParamDraft'](_0x368912, 'advanced')));
      } else {
        if (_0x3f644d === 'label')
          _0x368912['label'] = isMediaComponent(_0x368912)
            ? normalizeInputSlotLabel(_0x174089, '')
            : String(_0x174089 || '')['trim']();
        else {
          if (_0x3f644d === 'description') _0x368912['description'] = String(_0x174089 || '')['trim']();
          else {
            if (_0x3f644d === 'defaultValue') _0x368912['defaultValue'] = String(_0x174089 ?? '');
            else return;
          }
        }
      }
    }
    if (_0x3f644d === 'componentKind' || _0x3f644d === 'controlType') this['_renderComponentConfig']();
    const _0x1fb278 = shouldRefreshPreviewPromptForDraft(_0x368912, _0x3f644d),
      _0x4f7550 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
    (this['_patchPreviewWithoutRebuild'](_0x4f7550, {
      renderInputs: _0x3f644d === 'componentKind' || _0x3f644d === 'label',
      renderParams: !![],
      renderAdvanced: !![],
      renderPrompt: _0x1fb278,
    }),
      animatePreviewMoveFromRect &&
        this['previewDragController']['animateComponentFromRect'](_0x15a564, animatePreviewMoveFromRect));
  }
  ['_renamePreviewParamFromTypebar'](_0x5cb8e6) {
    const _0x15747d = Number(_0x5cb8e6?.['dataset']?.['previewComponentIndex']);
    if (!Number['isInteger'](_0x15747d)) return;
    const _0x2876b2 = _0x5cb8e6['closest']?.(
        '.rh-ai-app-preview-input-slot, .rh-ai-app-preview-param-chip, .rh-ai-app-preview-advanced-param, .rh-ai-app-preview-prompt-target',
      ),
      _0x2952b9 = _0x2876b2?.['querySelector']?.(
        '.rh-ai-app-preview-rename-target[data-preview-component-index="' + _0x15747d + '\x22]',
      );
    if (_0x2952b9) this['_startPreviewInlineRename'](_0x2952b9, _0x15747d);
  }
  ['_editPreviewDescriptionFromTypebar'](_0x45652b) {
    const _0x5579b6 = Number(_0x45652b?.['dataset']?.['previewComponentIndex']);
    if (!Number['isInteger'](_0x5579b6)) return;
    const _0x1d9352 = _0x45652b['closest']?.(
      '.rh-ai-app-preview-param-chip, .rh-ai-app-preview-advanced-param, .rh-ai-app-preview-prompt-target, .rh-ai-app-real-preview-panel',
    );
    let _0x21c4a0 =
      _0x1d9352?.['querySelector']?.(
        '.rh-ai-app-preview-description-target[data-preview-component-index=\x22' + _0x5579b6 + '\x22]',
      ) ||
      this['nodePreviewEl']?.['querySelector']?.(
        '.rh-ai-app-preview-description-target[data-preview-component-index="' + _0x5579b6 + '\x22]',
      );
    if (!_0x21c4a0 && _0x1d9352?.['classList']?.['contains']('rh-ai-app-preview-param-chip')) {
      const _0x3d5c4b = _0x1d9352['querySelector']?.(
        '.rh-ai-app-preview-param-label[data-preview-component-index=\x22' + _0x5579b6 + '\x22]',
      );
      if (_0x3d5c4b) {
        const _0x5eb137 = getComponentByIndex(this['componentDrafts'], _0x5579b6),
          _0x33f918 = getPreviewComponentDescription(_0x5eb137, '参数说明');
        ((_0x21c4a0 = document['createElement']('span')),
          (_0x21c4a0['className'] =
            'rh-tip ui-schema-info-tip rh-ai-app-preview-description-target ' +
            'rh-ai-app-preview-param-description-tip'),
          (_0x21c4a0['dataset']['previewComponentIndex'] = String(_0x5579b6)),
          (_0x21c4a0['textContent'] = '!'),
          _0x21c4a0['setAttribute']('role', 'button'),
          _0x21c4a0['setAttribute']('tabindex', '0'),
          _0x21c4a0['setAttribute']('aria-label', '编辑参数说明'),
          _0x21c4a0['setAttribute']('data-tooltip', _0x33f918),
          _0x21c4a0['setAttribute']('title', _0x33f918),
          _0x3d5c4b['insertAdjacentElement']('afterend', _0x21c4a0));
      }
    }
    if (_0x21c4a0) this['_startPreviewInlineDescriptionEdit'](_0x21c4a0, _0x5579b6);
  }
  ['_togglePreviewParamDefault'](_0x14af9c) {
    const _0x2a2c6f = Number(_0x14af9c?.['dataset']?.['previewComponentIndex']);
    if (!Number['isInteger'](_0x2a2c6f)) return;
    const _0x1fc144 = getComponentByIndex(this['componentDrafts'], _0x2a2c6f);
    if (!_0x1fc144 || !isParamComponent(_0x1fc144)) return;
    if (normalizeControlType(_0x1fc144['controlType']) !== 'toggle') return;
    const _0x3d520b = isPreviewToggleOn(_0x1fc144['defaultValue']) ? 'false' : 'true';
    this['_updateComponentDraft'](_0x2a2c6f, 'defaultValue', _0x3d520b);
  }
  ['_removePreviewParam'](_0x566697) {
    if (!this['_canRemovePreviewParams']()) return;
    const _0x3040cf = Number(_0x566697?.['dataset']?.['previewComponentIndex']);
    if (!Number['isInteger'](_0x3040cf)) return;
    const _0x241336 = getComponentByIndex(this['componentDrafts'], _0x3040cf);
    if (!_0x241336 || !isParamComponent(_0x241336)) return;
    this['componentDrafts'] = this['componentDrafts']['filter'](
      (_0x56b80d) => Number(_0x56b80d?.['index']) !== _0x3040cf,
    );
    const _0x3bdb7e = this['_refreshBundleFromComponents']({ renderPreview: ![] });
    (this['_patchPreviewWithoutRebuild'](_0x3bdb7e, {
      renderParams: !![],
      renderAdvanced: !![],
      renderPrompt: !![],
      renderAppChrome: !![],
      renderActionControls: !![],
    }),
      this['_renderComfyCandidatePicker']({ open: this['comfyCandidatePickerOpen'] }));
  }
  ['_removePreviewInput'](_0x23320b) {
    if (!this['_canRemovePreviewInputs']()) return;
    const _0x37687d = Number(_0x23320b?.['dataset']?.['previewComponentIndex']);
    if (!Number['isInteger'](_0x37687d)) return;
    const _0x445ee7 = getComponentByIndex(this['componentDrafts'], _0x37687d);
    if (!_0x445ee7 || !isMediaComponent(_0x445ee7)) return;
    this['componentDrafts'] = this['componentDrafts']['filter'](
      (_0x102baf) => Number(_0x102baf?.['index']) !== _0x37687d,
    );
    const _0x5711a9 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
    (this['_patchPreviewWithoutRebuild'](_0x5711a9, {
      renderInputs: !![],
      renderParams: !![],
      renderAdvanced: !![],
      renderPrompt: !![],
      renderAppChrome: !![],
      renderActionControls: !![],
    }),
      this['_renderComfyCandidatePicker']({ open: this['comfyCandidatePickerOpen'] }));
  }
  ['_scheduleParse']() {
    window['clearTimeout'](this['parseTimer']);
    if (!this['_getInputText']()['trim']()) {
      ((this['currentBundle'] = null),
        this['_clearCurrentDraftIdentity'](),
        this['_setSummary'](null),
        this['_setError'](''),
        this['_clearBuilder'](),
        this['_saveKindState']());
      return;
    }
    (this['_saveKindState'](),
      (this['parseTimer'] = window['setTimeout'](() => this['_parseNow']({ silent: !![] }), 0xb4)));
  }
  ['_parseNow']({ silent: silent = ![] } = {}) {
    window['clearTimeout'](this['parseTimer']);
    const _0x16aead = this['_getInputText']();
    try {
      const _0x3bdeab = this['_buildCurrentBundle']();
      this['currentBundle'] = _0x3bdeab;
      if (!silent) this['workflowInputCollapsed'] = !![];
      return (
        this['_setSummary'](_0x3bdeab),
        this['_setError'](''),
        this['_renderNodePreview'](_0x3bdeab),
        this['_setActionButtonsEnabled'](!![]),
        this['_saveKindState'](),
        _0x3bdeab
      );
    } catch (_0x3d9a82) {
      this['currentBundle'] = null;
      const _0x3f685e = !_0x16aead['trim'](),
        _0x1a89d2 =
          !_0x3f685e &&
          Boolean(
            this['componentDraftKey'] ||
            this['componentDrafts']['length'] ||
            this['componentCandidates']['length'],
          );
      if (_0x3f685e) this['_clearCurrentDraftIdentity']();
      if (_0x3f685e || !_0x1a89d2) this['_clearBuilder']();
      (this['_setSummary'](null), this['_setActionButtonsEnabled'](![]));
      if (!silent || _0x16aead['trim']()) this['_setError'](_0x3d9a82?.['message'] || '解析失败');
      else this['_setError']('');
      return (this['_saveKindState'](), null);
    }
  }
  ['_buildSavedAppRecordFromCurrentInput'](_0xdf1338 = null) {
    return this['configRepository']['buildSavedAppRecord'](
      {
        sourceType: this['sourceType'],
        kind: this['kind'],
        runningHubProfileId: this['runningHubProfileId'],
        name: normalizeAppName(this['appName']),
        description: normalizeAppDescription(this['appDescription']),
        promptHelpTooltip: normalizePromptHelpTooltip(this['promptHelpTooltip']),
        input: this['_getInputText'](),
        componentDraftKey: this['_getComponentDraftKey'](),
        componentDrafts: this['componentDrafts'],
      },
      _0xdf1338,
    );
  }
  async ['_saveCurrentConfigAsSavedApp']({
    overwriteSavedAppId: overwriteSavedAppId = '',
    isCurrentDraft: isCurrentDraft = () => !![],
  } = {}) {
    const _0x185917 = String(overwriteSavedAppId || '')['trim'](),
      _0xe93761 = _0x185917 ? this['_findSavedApp'](_0x185917) : null;
    if (_0x185917 && !_0xe93761) throw new Error('覆盖目标应用不存在');
    const _0x4cfa6f = _0xe93761?.['bundle'] || null,
      _0x221162 = structuredClone(this['_buildSavedAppRecordFromCurrentInput'](_0xe93761)),
      _0x491c69 = this['_buildBundleForSavedApp'](_0x221162);
    _0x221162['bundle'] = _0x491c69;
    const _0x392d51 = this['savedApps']['filter']((_0x5a4678) => _0x5a4678['id'] !== _0x221162['id']);
    (_0x392d51['unshift'](_0x221162),
      await this['configRepository']['commitSavedApps'](_0x392d51, () => {
        this['savedApps'] = _0x392d51;
      }));
    if (_0x4cfa6f) unregisterCustomAiAppBundle(_0x4cfa6f, this['registeredBundleKeys']);
    (registerCustomAiAppBundle(_0x491c69, this['registeredBundleKeys'], { replace: !![] }),
      this['_registerBundlesFromNodes']());
    if (!isCurrentDraft()) return { record: _0x221162, bundle: _0x491c69, isCurrentDraft: ![] };
    return (
      (this['savedAppId'] = _0x221162['id']),
      (this['currentBundle'] = _0x491c69),
      (this['appName'] = _0x221162['name']),
      (this['appDescription'] = _0x221162['description']),
      (this['promptHelpTooltip'] = normalizePromptHelpTooltip(_0x221162['promptHelpTooltip'])),
      (this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''),
      this['_setSummary'](_0x491c69),
      this['_setActionButtonsEnabled'](!![]),
      this['_saveKindState'](),
      { record: _0x221162, bundle: _0x491c69, isCurrentDraft: !![] }
    );
  }
  ['_patchSavedConfigSuccessPreview'](_0x562784) {
    (this['_renderComponentConfig'](),
      this['_patchPreviewWithoutRebuild'](_0x562784, {
        renderInputs: !![],
        renderParams: !![],
        renderAdvanced: !![],
        renderPrompt: !![],
        renderAppChrome: !![],
        renderActionControls: !![],
      }));
  }
  ['_saveConfigFromCurrentInput']() {
    return saveRhAiApp(this);
  }
  async ['_confirmOverwriteSavedApp'](_0x13d341) {
    const _0x1873e7 = String(_0x13d341 || '')['trim']();
    if (!_0x1873e7 || _0x1873e7 !== this['pendingOverwriteSavedAppId']) return null;
    return saveRhAiApp(this, _0x1873e7);
  }
  ['_loadSavedApp'](_0x193a2d) {
    this['definitionController']['cancel']();
    const _0x2cef7d = this['_findSavedApp'](_0x193a2d);
    if (!_0x2cef7d) return;
    (window['clearTimeout'](this['parseTimer']),
      this['_saveKindState'](),
      (this['sourceType'] = normalizeSourceType(_0x2cef7d['sourceType']) || SOURCE_TYPES['runninghub']),
      (this['kind'] = normalizeKind(_0x2cef7d['kind'])),
      (this['runningHubProfileId'] = normalizeRunningHubModelApiProfileId(_0x2cef7d['runningHubProfileId'])),
      this['_syncSourceView'](),
      this['_syncKindTabs'](),
      (this['appName'] = normalizeAppName(_0x2cef7d['name'])),
      (this['appDescription'] = normalizeAppDescription(_0x2cef7d['description'])),
      (this['promptHelpTooltip'] = normalizePromptHelpTooltip(_0x2cef7d['promptHelpTooltip'])),
      (this['savedAppId'] = _0x2cef7d['id']));
    if (this['textarea']) this['textarea']['value'] = _0x2cef7d['input'] || '';
    ((this['definitionReference'] = this['definitionController']['getSavedReference'](_0x2cef7d)),
      this['definitionController']['sync'](),
      (this['componentDraftKey'] = _0x2cef7d['componentDraftKey'] || this['_getComponentDraftKey']()),
      (this['componentDrafts'] = cloneComponentDrafts(_0x2cef7d['componentDrafts'])));
    (this['_shouldShowManualComponentPicker']() || !this['componentDrafts']['length']) &&
      _0x2cef7d['input']['trim']() &&
      this['_syncComponentDrafts']({ force: !![] });
    ((this['previewAppMenuOpen'] = ![]),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''));
    try {
      const _0xc19f7c = _0x2cef7d['bundle'] || this['_buildBundleForSavedApp'](_0x2cef7d);
      ((_0x2cef7d['bundle'] = _0xc19f7c),
        registerCustomAiAppBundle(_0xc19f7c, this['registeredBundleKeys']),
        (this['currentBundle'] = _0xc19f7c),
        this['_setSummary'](_0xc19f7c),
        this['_setError'](''),
        this['_renderComponentConfig'](),
        this['_patchPreviewWithoutRebuild'](_0xc19f7c, {
          renderInputs: !![],
          renderParams: !![],
          renderAdvanced: !![],
          renderPrompt: !![],
          renderAppChrome: !![],
          renderActionControls: !![],
        }),
        this['_setActionButtonsEnabled'](!![]));
    } catch (_0x18cdd6) {
      ((this['currentBundle'] = null),
        this['_setSummary'](null),
        this['_setError'](_0x18cdd6?.['message'] || '配置载入失败'),
        this['_setActionButtonsEnabled'](![]));
    }
    this['_saveKindState']();
  }
  ['_deleteSavedApp'](_0x2a4c1c) {
    if (this['savePending']) return;
    const _0x199831 = this['_findSavedApp'](_0x2a4c1c);
    if (!_0x199831) return;
    const _0x1937c6 = this['savedAppId'] === _0x199831['id'];
    if (_0x199831['bundle']) unregisterCustomAiAppBundle(_0x199831['bundle'], this['registeredBundleKeys']);
    ((this['savedApps'] = this['savedApps']['filter']((_0x1f4cc1) => _0x1f4cc1['id'] !== _0x199831['id'])),
      this['_registerBundlesFromNodes'](),
      (this['pendingDeleteSavedAppId'] = ''),
      (this['pendingOverwriteSavedAppId'] = ''),
      (this['pendingOverwriteIntent'] = ''));
    if (_0x1937c6) {
      this['savedAppId'] = '';
      if (this['textarea']) this['textarea']['value'] = '';
      ((this['appName'] = DEFAULT_AI_APP_NAME),
        (this['appDescription'] = ''),
        (this['currentBundle'] = null),
        this['_clearBuilder'](),
        this['_setSummary'](null),
        this['_setError'](''));
    } else ((this['previewAppMenuOpen'] = !![]), this['_patchPreviewAppChrome']());
    (this['_persistSavedApps'](),
      this['_saveKindState'](),
      window['showToast']?.(this['_getSourceMeta']()?.['deleteSuccess'] || '配置已删除', 'success'));
  }
  ['_createNodeFromSavedBundle'](_0x3a75e4) {
    const _0x2326eb = getCanvasCenterWorld(this['panel']),
      _0x3b4e5e = buildRhAiAppNodeData({
        bundle: _0x3a75e4,
        kind: this['kind'],
        center: _0x2326eb,
        runningHubProfileId: this['runningHubProfileId'],
      });
    return (
      graphStore['batch']?.(() => {
        (graphStore['addNode'](_0x3b4e5e), graphStore['setSelectedNodes']([_0x3b4e5e['id']]));
      }),
      typeof graphStore['batch'] !== 'function' &&
        (graphStore['addNode'](_0x3b4e5e), graphStore['setSelectedNodes']([_0x3b4e5e['id']])),
      commit(),
      window['showToast']?.(this['_getSourceMeta']()?.['createSuccess'] || '节点已创建', 'success'),
      _0x3b4e5e
    );
  }
  async ['_createNodeFromCurrentInput']() {
    if (!this['_refreshBundleFromComponents']({ renderPreview: ![] })) return;
    let _0x207a42;
    try {
      ((_0x207a42 = buildRhAiAppTestBundle(this)),
        registerCustomAiAppBundle(_0x207a42, this['registeredBundleKeys']),
        this['_createNodeFromSavedBundle'](_0x207a42));
    } catch (_0x22d228) {
      if (_0x207a42) unregisterCustomAiAppBundle(_0x207a42, this['registeredBundleKeys']);
      (this['_registerBundlesFromNodes'](),
        console['error']('[RH AI App] create node failed:', _0x22d228),
        window['showToast']?.(
          _0x22d228?.['message'] || this['_getSourceMeta']()?.['createFailed'] || '节点创建失败',
          'error',
        ),
        this['_setError'](_0x22d228?.['message'] || '节点创建失败'),
        this['_saveKindState']());
    }
  }
}
export const runningHubAiAppManager = new RunningHubAiAppManager();
