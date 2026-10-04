import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  buildDreaminaStyleVideoNodeNormalizationPatch,
  ensureDreaminaStyleVideoModelForTask,
  getDreaminaStyleVideoDurationRange,
  getDreaminaStyleVideoResolutionOptions,
  getDreaminaVideoTaskParamVisibility,
  isApimartDreaminaVideoModel,
  isDreaminaStyleVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaStyleVideoDuration,
  getDreaminaStyleVideoDefaultModel,
  normalizeDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from '../../modules/dreaminaVideoModelHelper.js';
import {
  getModelManifest,
  normalizeProviderId,
  resolveModelExecution,
  resolveModelProvider,
} from '../../manifests/index.js';
import {
  buildFixedInputAssetSlotMap,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import { flushPromptHtmlCommit, resolvePromptTextWithTextRefs } from '../../modules/nodePromptShared.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { DEBUG_WRENCH_ICON_HTML, formatFinalApiDebugRequest } from '../../utils/debugRequestPreview.js';
import { resolveGenerationButtonMode } from '../../core/generationTaskUiState.js';
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from '../../modules/previewGenerateButtonUi.js';
import {
  buildModelUiSchemaDefaultParams,
  bindUiSchemaFieldControls,
  bindModelUiSchemaControls,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  renderUiSchemaFields,
  sanitizeModelUiSchemaParams,
  syncModelUiSchemaControls,
} from '../aigenImage/uiSchemaRenderer.js';
import {
  applyImageSchemaRatioResizeAnimation,
  buildImageSchemaAspectRatioDisplayPatch,
} from '../aigenImage/uiModuleModelHelpers.js';
import { renderNodeModelMenu, renderNodeModelTrigger } from '../shared/nodeModelMenu.js';
import {
  bindNodeFooterController,
  bindNodeSubmenus,
  closeNodeFooterMenus,
} from '../shared/nodeFooterControls.js';
import {
  buildVideoWorkflowDisplayParamsPatch,
  buildVideoWorkflowGenerationParamsPatch,
  buildVideoWorkflowModelSelectionPatch,
  getRunningHubVideoWorkflowFpsOptions,
  getRunningHubVideoParameterPanelPolicy,
  getPlainGenerationParams,
  hasRunningHubVideoWorkflowUiPlacement,
  isRunningHubVideoWorkflowManifest,
} from './runningHubVideoUiSchema.js';
import {
  arePlainObjectsEqual,
  buildAgnesVideoLogoHTML,
  buildAgnesVideoMenuItemsHtml,
  buildApimartVideoMenuItemsHtml,
  buildApimartVideoLogoHTML,
  buildDreaminaVideoLogoHTML,
  buildDreaminaOfficialVideoMenuItems,
  buildDreaminaTaskModelMenuHtml,
  buildRunningHubVideoModelApiMenuItems,
  buildRunningHubVideoWorkflowMenuItems,
  buildVolcengineOfficialVideoMenuItems,
  buildVolcengineVideoLogoHTML,
  getDefaultRunningHubVideoWorkflowModelId,
  getDreaminaTaskModelMenuItems,
  getDreaminaTaskModelMenuMeta,
  getRhV54FpsOptions,
  normalizeRhStandardFps,
  normalizeRhV54Fps,
} from './parameterPanelModelHelpers.js';
import {
  buildDreaminaParamPatch,
  buildDreaminaModelSelectionParamPatch,
  buildDreaminaParamSchemaFields,
  buildDreaminaRouteModeUpdate,
  buildDreaminaStorePatchFromNormalization,
  getDreaminaEffectiveNodeData,
  resolveDreaminaRememberedRouteModel,
} from './dreaminaParameterSchema.js';
import { t } from '../../i18n/index.js';
import { translateManifestText } from '../../i18n/manifestText.js';
const VIDEO_ADAPTIVE_RATIO_VALUE = '自适应',
  VIDEO_MODE_ALL_REFERENCE_VALUE = '全能参考',
  VIDEO_MODE_FIRST_LAST_VALUE = '首尾帧';
function videoPanelText(value, item = {}) {
  return t('videoNode.parameterPanel.' + value, item);
}
function getVideoGenerateTitle() {
  return videoPanelText('generateTitle');
}
function getVideoCancelTooltip() {
  return videoPanelText('cancelTooltip');
}
function getDefaultVideoPromptPlaceholder() {
  return videoPanelText('defaultPromptPlaceholder');
}
function formatVideoAspectRatioLabel(key) {
  const enabled = String(key || '').trim();
  if (!enabled || enabled === VIDEO_ADAPTIVE_RATIO_VALUE) return videoPanelText('adaptive');
  return enabled;
}
function formatVideoRatioResolutionLabel(index, resolution) {
  return videoPanelText('ratioResolutionLabel', {
    aspectRatio: formatVideoAspectRatioLabel(index),
    resolution: resolution,
  });
}
function getVideoModeLabel(result) {
  const data = String(result || '').trim() || VIDEO_MODE_ALL_REFERENCE_VALUE;
  if (data === VIDEO_MODE_ALL_REFERENCE_VALUE) return videoPanelText('mode.allReference');
  if (data === VIDEO_MODE_FIRST_LAST_VALUE) return videoPanelText('mode.firstLastFrame');
  return data;
}
function getDreaminaProviderLabel(options) {
  const target = String(options || '')
    .trim()
    .toLowerCase();
  if (target === 'dreamina') return videoPanelText('providers.dreamina');
  if (target === 'volcengine') return videoPanelText('providers.volcengine');
  return videoPanelText('providers.default');
}
const APIMART_KLING_V3_OMNI_MODEL_ID = 'apimart/kling-v3-omni',
  HAPPYHORSE_BODY_RESOLVERS = new Set(['apimartHappyHorseVideo', 'runninghubHappyHorseVideo']),
  WAN27_BODY_RESOLVERS = new Set(['apimartWan27Video', 'runninghubWan27Video']),
  RH_WORKFLOW_DISPLAY_FIELD_IDS = new Set([
    'rhVideoResolution',
    'rhVideoFps',
    'rhVideoFrames',
    'rhVideoSeconds',
  ]),
  RH_V54_BOOLEAN_FIELD_IDS = new Set(['rhBlendIntoScene', 'rhSubtractSubject', 'rhMaskRect']),
  RH_WORKFLOW_BOOLEAN_FIELD_IDS = new Set([...RH_V54_BOOLEAN_FIELD_IDS, 'rhEnableMask']);
function getDefaultVideoModelId() {
  return getDefaultRunningHubVideoWorkflowModelId();
}
function normalizeRhVideoFpsByPolicy(source, next) {
  return source?.sourceFrameCountFps === 'v54' ? normalizeRhV54Fps(next) : normalizeRhStandardFps(next);
}
function findPreferredVideoEdge(list, current) {
  return list.find((item2) => {
    const entry = current?.nodes?.[item2?.sourceId],
      record = String(entry?.type || '');
    return record === 'source-video' || record === 'video' || record === 'ai-video';
  });
}
function normalizeRhV54SingleControlPreset(payload) {
  const handle = String(payload ?? '').trim();
  return handle === 'efficiency' || handle === 'stable' || handle === 'quality' ? handle : 'efficiency';
}
function normalizeRhV54SpecialModeValue(state) {
  const config = String(state ?? '').trim();
  return config === 'longVideoOverlay' || config === 'cameraMove' ? config : null;
}
function normalizeRhV54MaskExpandValue(scope) {
  const input = Number(scope);
  return Number.isFinite(input) ? Math.max(-0x270f, Math.min(0x270f, Math.trunc(input))) : 25;
}
function normalizeRhV54BreastJiggleValue(output) {
  const value2 = Number(output);
  if (!Number.isFinite(value2)) return 0;
  return Math.max(0, Math.min(1, Math.round(value2 * 20) / 20));
}
function isApimartPanelModel(options2 = {}, value3 = '') {
  const providerHint = String(options2?.provider || '')
      .trim()
      .toLowerCase(),
    value4 = String(options2?.model || '').trim(),
    modelExecution =
      resolveModelExecution(value4, { providerHint: providerHint }) || resolveModelExecution(value4),
    value5 = String(
      modelExecution?.canonicalModelId || modelExecution?.modelManifest?.modelId || value4,
    ).trim(),
    enabled2 = String(modelExecution?.modelManifest?.provider || providerHint)
      .trim()
      .toLowerCase();
  return value5 === value3 && (!enabled2 || enabled2 === 'apimart');
}
function isHappyHorsePanelModel(options3 = {}) {
  return isPanelModelUsingBodyResolver(options3, HAPPYHORSE_BODY_RESOLVERS);
}
function isPanelModelUsingBodyResolver(options4 = {}, map = new Set()) {
  const providerHint2 = String(options4?.provider || '')
      .trim()
      .toLowerCase(),
    value6 = String(options4?.model || '').trim(),
    modelExecution2 =
      resolveModelExecution(value6, { providerHint: providerHint2 }) || resolveModelExecution(value6),
    value7 = String(modelExecution2?.executionManifest?.extensions?.bodyResolver || '').trim();
  return value7 && map.has(value7);
}
function isWan27PanelModel(options5 = {}) {
  return isPanelModelUsingBodyResolver(options5, WAN27_BODY_RESOLVERS);
}
function isKlingV3OmniPanelModel(options6 = {}) {
  return isApimartPanelModel(options6, APIMART_KLING_V3_OMNI_MODEL_ID);
}
function getPanelModelManifest(providerHint3 = {}) {
  const enabled3 = String(providerHint3?.model || '').trim();
  if (!enabled3) return null;
  const modelExecution3 =
    resolveModelExecution(enabled3, { providerHint: providerHint3?.provider }) ||
    resolveModelExecution(enabled3);
  return modelExecution3?.modelManifest || getModelManifest(enabled3) || null;
}
function getManifestConditionFieldValue(options7 = {}, value8 = '') {
  const enabled4 = String(value8 || '').trim();
  if (!enabled4) return undefined;
  const plainGenerationParams = getPlainGenerationParams(options7?.generationParams);
  if (Object.prototype.hasOwnProperty.call(plainGenerationParams, enabled4))
    return plainGenerationParams[enabled4];
  if (Object.prototype.hasOwnProperty.call(options7 || {}, enabled4)) return options7[enabled4];
  const list2 = enabled4.split('.').filter(Boolean);
  if (list2.length <= 1) return undefined;
  let enabled5 = options7;
  for (const value9 of list2) {
    if (!enabled5 || typeof enabled5 !== 'object') return undefined;
    enabled5 = enabled5[value9];
  }
  return enabled5;
}
function manifestConditionMatches(el, value10 = {}) {
  if (Array.isArray(el)) return el.some((item3) => manifestConditionMatches(item3, value10));
  if (!el || typeof el !== 'object') return false;
  if (Array.isArray(el.any)) return el.any.some((item4) => manifestConditionMatches(item4, value10));
  if (Array.isArray(el.all)) return el.all.every((item5) => manifestConditionMatches(item5, value10));
  const enabled6 = String(el.field || el.param || '').trim();
  if (!enabled6) return false;
  const manifestConditionFieldValue = getManifestConditionFieldValue(value10, enabled6),
    list3 = Array.isArray(el.values)
      ? el.values
      : Object.prototype.hasOwnProperty.call(el, 'value')
        ? [el.value]
        : [];
  if (list3.length === 0) return Boolean(manifestConditionFieldValue);
  return list3.some(
    (item6) =>
      manifestConditionFieldValue === item6 ||
      String(manifestConditionFieldValue ?? '') === String(item6 ?? ''),
  );
}
function resolveManifestPromptPlaceholder(enabled7, value11 = {}) {
  if (!enabled7 || typeof enabled7 !== 'object') return '';
  const value12 = Array.isArray(enabled7.variants) ? enabled7.variants : [];
  for (const value13 of value12) {
    if (value13 && typeof value13 === 'object' && manifestConditionMatches(value13.when, value11)) {
      const translateManifestText2 = translateManifestText(value13.placeholder || '').trim();
      if (translateManifestText2) return translateManifestText2;
    }
  }
  return translateManifestText(enabled7.placeholder || '').trim();
}
export function resolveVideoPromptPlaceholder(
  value14,
  value15 = {},
  defaultVideoPromptPlaceholder = getDefaultVideoPromptPlaceholder(),
) {
  const manifestPromptPlaceholder = resolveManifestPromptPlaceholder(value14?.prompt, value15);
  return manifestPromptPlaceholder || String(defaultVideoPromptPlaceholder || '').trim();
}
export function shouldShowVideoPromptInput(enabled8) {
  if (!enabled8 || typeof enabled8 !== 'object') return true;
  if (enabled8?.prompt?.visible === false) return false;
  if (enabled8?.prompt?.hidden === true) return false;
  return true;
}
function fieldConditionReferences(list4, value16) {
  const enabled9 = String(value16 || '').trim();
  if (Array.isArray(list4)) return list4.some((item7) => fieldConditionReferences(item7, enabled9));
  if (!enabled9 || !list4 || typeof list4 !== 'object') return false;
  if (String(list4.field || list4.param || '').trim() === enabled9) return true;
  return ['all', 'any'].some(
    (item8) =>
      Array.isArray(list4[item8]) && list4[item8].some((item9) => fieldConditionReferences(item9, enabled9)),
  );
}
function manifestHelpVariantsReferenceField(value17, value18) {
  const list5 = Array.isArray(value17?.help?.variants) ? value17.help.variants : [];
  return list5.some((item10) => fieldConditionReferences(item10?.when, value18));
}
function manifestPromptVariantsReferenceField(value19, value20) {
  const list6 = Array.isArray(value19?.prompt?.variants) ? value19.prompt.variants : [];
  return list6.some((item11) => fieldConditionReferences(item11?.when, value20));
}
function manifestFixedSlotVisibilityReferencesField(value21, value22) {
  const list7 = Array.isArray(value21?.inputSlots?.fixedSlots) ? value21.inputSlots.fixedSlots : [];
  return list7.some(
    (item12) =>
      fieldConditionReferences(item12?.showWhen, value22) ||
      fieldConditionReferences(item12?.hideWhen, value22),
  );
}
function normalizeHappyHorsePanelMode(value23) {
  const value24 = String(value23 || '')
    .trim()
    .toLowerCase();
  return value24 === 'image' || value24 === 'reference' || value24 === 'edit' ? value24 : 'auto';
}
function normalizeWan27PanelMode(value25) {
  const value26 = String(value25 || '')
    .trim()
    .toLowerCase();
  return value26 === 'video' || value26 === 'reference' || value26 === 'edit' ? value26 : 'image';
}
function normalizeKlingV3OmniPanelMode(value27) {
  const value28 = String(value27 || '')
    .trim()
    .toLowerCase();
  return value28 === 'reference' || value28 === 'edit' ? value28 : 'image';
}
function getPanelInputKind(value29, value30) {
  const effectiveInputKind = resolveEffectiveInputKind(value29, value30);
  if (effectiveInputKind) return effectiveInputKind;
  const list8 = String(value29?.type || '').toLowerCase();
  if (list8.includes('video')) return 'video';
  if (list8.includes('image')) return 'image';
  if (list8.includes('audio')) return 'audio';
  if (list8.includes('text')) return 'text';
  return '';
}
function getHappyHorseModeEdgeIdsToRemove({
  nextMode: nextMode,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const happyHorsePanelMode = normalizeHappyHorsePanelMode(nextMode),
    list9 = [];
  let count = 0,
    count2 = 0;
  for (const value31 of Array.isArray(inEdges) ? inEdges : []) {
    const value32 = nodes?.[value31?.sourceId],
      panelInputKind = getPanelInputKind(value32, value31);
    if (panelInputKind === 'video') {
      if (happyHorsePanelMode === 'edit' && count2 < 1) count2 += 1;
      else value31?.id && list9.push(value31.id);
      continue;
    }
    if (panelInputKind === 'image') {
      if (happyHorsePanelMode === 'image') {
        if (count < 1) count += 1;
        else {
          if (value31?.id) list9.push(value31.id);
        }
      } else {
        if (happyHorsePanelMode === 'edit') {
          if (count < 5) count += 1;
          else {
            if (value31?.id) list9.push(value31.id);
          }
        } else {
          if (happyHorsePanelMode === 'reference') {
            if (count < 9) count += 1;
            else {
              if (value31?.id) list9.push(value31.id);
            }
          }
        }
      }
      continue;
    }
    panelInputKind === 'audio' && value31?.id && list9.push(value31.id);
  }
  return list9;
}
function getWan27ModeEdgeIdsToRemove({ nextMode: nextMode2, inEdges: inEdges = [], nodes: nodes = {} } = {}) {
  const wan27PanelMode = normalizeWan27PanelMode(nextMode2),
    list10 = [];
  let count3 = 0,
    count4 = 0,
    count5 = 0;
  for (const value33 of Array.isArray(inEdges) ? inEdges : []) {
    const value34 = nodes?.[value33?.sourceId],
      panelInputKind2 = getPanelInputKind(value34, value33);
    if (panelInputKind2 === 'image') {
      if (wan27PanelMode === 'image' && count3 < 2) count3 += 1;
      else {
        if (wan27PanelMode === 'reference' && count3 < 1) count3 += 1;
        else value33?.id && list10.push(value33.id);
      }
      continue;
    }
    if (panelInputKind2 === 'video') {
      if (wan27PanelMode === 'video' && count4 < 1) count4 += 1;
      else {
        if (wan27PanelMode === 'reference' && count4 < 1) count4 += 1;
        else {
          if (wan27PanelMode === 'edit' && count4 < 2) count4 += 1;
          else value33?.id && list10.push(value33.id);
        }
      }
      continue;
    }
    if (panelInputKind2 === 'audio') {
      if ((wan27PanelMode === 'image' || wan27PanelMode === 'reference') && count5 < 1) count5 += 1;
      else value33?.id && list10.push(value33.id);
    }
  }
  return list10;
}
function getKlingV3OmniModeEdgeIdsToRemove({
  nextMode: nextMode3,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const klingV3OmniPanelMode = normalizeKlingV3OmniPanelMode(nextMode3),
    list11 = [];
  let count6 = 0,
    count7 = 0;
  for (const value35 of Array.isArray(inEdges) ? inEdges : []) {
    const value36 = nodes?.[value35?.sourceId],
      panelInputKind3 = getPanelInputKind(value36, value35);
    if (panelInputKind3 === 'image') {
      if (klingV3OmniPanelMode === 'image' && count6 < 2) count6 += 1;
      else {
        if (klingV3OmniPanelMode === 'reference' && count6 < 1) count6 += 1;
        else value35?.id && list11.push(value35.id);
      }
      continue;
    }
    if (panelInputKind3 === 'video') {
      if ((klingV3OmniPanelMode === 'reference' || klingV3OmniPanelMode === 'edit') && count7 < 1)
        count7 += 1;
      else value35?.id && list11.push(value35.id);
      continue;
    }
    panelInputKind3 === 'audio' && value35?.id && list11.push(value35.id);
  }
  return list11;
}
function buildSchemaParamsPatch(value37, value38, value39 = {}) {
  const generationParams = {
      ...getPlainGenerationParams(value37?.generationParams),
      ...getPlainGenerationParams(value39?.generationParams),
      ...(value38 && typeof value38 === 'object' ? value38 : {}),
    },
    value40 = { generationParams: generationParams },
    value41 = String(value37?.model || '').trim();
  return (
    value41 &&
      (value40.generationParamsByModel = {
        ...getPlainGenerationParams(value37?.generationParamsByModel),
        [value41]: generationParams,
      }),
    value40
  );
}
function getUiSchemaFieldIds(value42) {
  const modelManifest = getModelManifest(value42);
  return new Set(
    (Array.isArray(modelManifest?.uiSchema?.fields) ? modelManifest.uiSchema.fields : [])
      .map((item13) => String(item13?.id || '').trim())
      .filter(Boolean),
  );
}
const DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER = Object.freeze(['resolution', 'mode']);
function resolveVideoModelApiFooterPlacementOrder(options8 = {}) {
  const map2 = new Set(DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER),
    list12 = [],
    list13 = Array.isArray(options8?.uiSchema?.footerPlacementOrder)
      ? options8.uiSchema.footerPlacementOrder
      : [];
  return (
    list13.forEach((item14) => {
      const value43 = String(item14 || '')
        .trim()
        .toLowerCase();
      map2.has(value43) && !list12.includes(value43) && list12.push(value43);
    }),
    DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER.forEach((item15) => {
      if (!list12.includes(item15)) list12.push(item15);
    }),
    list12
  );
}
function wrapUiSchemaPlacementControls(value44) {
  return value44 ? '<div class="ui-schema-placement">' + value44 + '</div>' : '';
}
function sanitizeVideoModelApiParams(value45, value46 = {}, value47 = {}) {
  const plainGenerationParams2 = getPlainGenerationParams(value46);
  try {
    return sanitizeModelUiSchemaParams(value45, plainGenerationParams2, value47);
  } catch {
    return plainGenerationParams2;
  }
}
export function buildVideoModelApiModelSelectionPatch(
  options9 = {},
  value48 = '',
  provider = null,
  value49 = {},
) {
  const model = String(value48 || '').trim();
  if (!model) return {};
  const value50 = String(options9?.model || '').trim(),
    generationParamsByModel = getPlainGenerationParams(options9?.generationParamsByModel);
  value50 &&
    (generationParamsByModel[value50] = sanitizeVideoModelApiParams(value50, options9?.generationParams, {
      includeDefaults: false,
    }));
  const list14 = getUiSchemaFieldIds(model),
    args = buildModelUiSchemaDefaultParams(model),
    args2 = getPlainGenerationParams(generationParamsByModel[model]),
    value51 = Object.prototype.hasOwnProperty.call(value49, 'generationParams'),
    args3 = value51 ? getPlainGenerationParams(value49.generationParams) : {},
    args4 = {};
  Object.entries(value49 || {}).forEach(([value52, value53]) => {
    if (list14.has(value52)) args4[value52] = value53;
  });
  const value54 = { ...args, ...args2, ...args3, ...args4 },
    value55 = Object.fromEntries(Object.entries(value54).filter(([value56]) => list14.has(value56))),
    generationParams2 = sanitizeVideoModelApiParams(model, value55, { includeDefaults: true }),
    { generationParams: generationParams3, ...args5 } = value49 || {},
    args6 = { ...args5 };
  return (
    list14.forEach((item16) => {
      delete args6[item16];
    }),
    {
      ...args6,
      model: model,
      provider: provider,
      generationParams: generationParams2,
      generationParamsByModel: generationParamsByModel,
    }
  );
}
function buildRhWorkflowFieldPatch(value57, value58, value59, value60 = {}) {
  const value61 = String(value58 || '').trim();
  if (RH_WORKFLOW_DISPLAY_FIELD_IDS.has(value61)) return { [value61]: value59 };
  if (value61 === 'rhSingleControlPreset' || value61 === 'rhControlMode') {
    const value62 = String(value59 || '').trim(),
      args7 =
        value62 === 'multi'
          ? { rhControlMode: 'multi', rhSingleControlPreset: null }
          : { rhControlMode: 'single', rhSingleControlPreset: normalizeRhV54SingleControlPreset(value62) };
    return { ...buildSchemaParamsPatch(value57, args7, value60), ...args7 };
  }
  if (RH_WORKFLOW_BOOLEAN_FIELD_IDS.has(value61)) {
    const value63 = value59 === true || String(value59) === 'true',
      args8 = { [value61]: value63 };
    return { ...buildSchemaParamsPatch(value57, args8, value60), ...args8 };
  }
  if (value61 === 'rhSpecialMode') {
    const plainGenerationParams3 = getPlainGenerationParams(value57?.generationParams),
      rhV54SpecialModeValue = normalizeRhV54SpecialModeValue(
        plainGenerationParams3.rhSpecialMode !== undefined
          ? plainGenerationParams3.rhSpecialMode
          : value57?.rhSpecialMode,
      ),
      rhV54SpecialModeValue2 = normalizeRhV54SpecialModeValue(value59),
      rhSpecialMode = rhV54SpecialModeValue === rhV54SpecialModeValue2 ? null : rhV54SpecialModeValue2,
      args9 = { rhSpecialMode: rhSpecialMode };
    return { ...buildSchemaParamsPatch(value57, args9, value60), ...args9 };
  }
  if (value61 === 'rhMaskExpand') {
    const rhMaskExpand = normalizeRhV54MaskExpandValue(value59),
      value64 = { rhMaskExpand: rhMaskExpand };
    return {
      ...buildSchemaParamsPatch(value57, value64, value60),
      rhMaskExpand: rhMaskExpand,
      rhMaskExpandTouched: true,
    };
  }
  if (value61 === 'rhBreastJiggle') {
    const rhBreastJiggle = normalizeRhV54BreastJiggleValue(value59),
      value65 = { rhBreastJiggle: rhBreastJiggle };
    return { ...buildSchemaParamsPatch(value57, value65, value60), rhBreastJiggle: rhBreastJiggle };
  }
  return {};
}
export function createVideoNodeParameterPanelModule(value66) {
  const {
    store: store,
    api: api,
    getDisplayModelName: getDisplayModelName,
    PROVIDERS_META: PROVIDERS_META,
    getAIGenerationNodeSize: getAIGenerationNodeSize,
    getDisplayedMediaSizeFromNode: getDisplayedMediaSizeFromNode,
    activateMenuKeyboard: activateMenuKeyboard,
    isVideoVipModel: isVideoVipModel,
  } = value66;
  class value67 {
    ['_getRhVideoAdvancedSchemaNodeData'](options10 = {}) {
      const value68 = String(options10?.model || '').trim(),
        runningHubVideoParameterPanelPolicy = getRunningHubVideoParameterPanelPolicy(value68);
      let args10 = options10;
      if (runningHubVideoParameterPanelPolicy.sourceFrameCountFps) {
        const rhVideoFpsByPolicy = normalizeRhVideoFpsByPolicy(
          runningHubVideoParameterPanelPolicy,
          options10?.rhVideoFps,
        );
        args10 = {
          ...args10,
          rhVideoSourceFrameCount: this._getRhV5SourceVideoFrameCount?.(rhVideoFpsByPolicy) || 0,
        };
      }
      if (runningHubVideoParameterPanelPolicy.maskVideoDisablesSubtractSubject !== true) return args10;
      const enabled10 = (store.getIncomingEdges(this.nodeId) || []).some((item17) => {
        const value69 = String(item17?.refSlot || '').trim();
        return value69 === 'videoMask' || value69 === 'maskVideo';
      });
      if (!enabled10) return args10;
      return {
        ...args10,
        rhV54HasMaskVideo: true,
        rhSubtractSubject: false,
        generationParams: {
          ...getPlainGenerationParams(args10?.generationParams),
          rhSubtractSubject: false,
        },
      };
    }
    ['_buildVideoModelMenuHtml'](value70 = '') {
      const activeModel = String(value70 || this._data?.model || '').trim() || getDefaultVideoModelId();
      return renderNodeModelMenu({
        kind: 'video',
        activeModel: activeModel,
        items: [
          ...buildDreaminaOfficialVideoMenuItems(),
          ...buildVolcengineOfficialVideoMenuItems(activeModel, this._data?.provider),
        ],
        groups: [
          {
            id: 'apimart-video',
            headerClass: 'apimart-video-group-header',
            submenuClass: 'apimart-video-submenu',
            toggleAttr: 'data-apimart-video-toggle',
            label: 'APIMart',
            subtitle: '视频生成模型',
            iconHtml: buildApimartVideoLogoHTML(20),
            itemsHtml: buildApimartVideoMenuItemsHtml(activeModel, this._data?.provider),
          },
          {
            id: 'agnes-video',
            headerClass: 'agnes-video-group-header',
            submenuClass: 'agnes-video-submenu',
            toggleAttr: 'data-agnes-video-toggle',
            label: 'Agnes AI',
            subtitle: 'Video model API',
            iconHtml: buildAgnesVideoLogoHTML(20),
            itemsHtml: buildAgnesVideoMenuItemsHtml(activeModel),
          },
          {
            id: 'runninghub',
            label: 'RunningHUB工作流',
            subtitle: 'AI 工作流',
            icon: 'images/RH.png',
            iconAlt: 'runninghub',
            itemsHtml: buildRunningHubVideoWorkflowMenuItems(activeModel),
          },
          {
            id: 'runninghub-model',
            label: 'RunningHUB模型',
            subtitle: '标准模型 API',
            icon: 'images/RH.png',
            iconAlt: 'runninghub',
            itemsHtml: buildRunningHubVideoModelApiMenuItems(activeModel),
          },
        ],
      });
    }
    ['_renderFooterImpl'](el2) {
      let value71 = false;
      const el3 = el2.querySelector('.rh-vram-adv-panel');
      el3 && (value71 = el3.classList.contains('show'));
      const value72 = this._isDreaminaVideoNode(this._data)
        ? this._syncDreaminaTaskState(this._data, { syncStore: true })
        : null;
      value72?.nodeData && (this._data = value72.nodeData);
      const enabled11 = Boolean(value72),
        list15 = String(this._data.model || '').trim() || getDefaultVideoModelId();
      if (isRunningHubVideoWorkflowManifest(list15)) {
        const args11 = buildVideoWorkflowGenerationParamsPatch(this._data, list15),
          args12 = buildVideoWorkflowDisplayParamsPatch(list15, args11.generationParams, {
            v54FpsOptions: getRhV54FpsOptions(),
          }),
          value73 = Object.entries(args12).some(([value74, value75]) => this._data?.[value74] !== value75);
        if (
          args11.generationParams &&
          (!arePlainObjectsEqual(
            args11.generationParams,
            getPlainGenerationParams(this._data.generationParams),
          ) ||
            !arePlainObjectsEqual(
              args11.generationParamsByModel,
              getPlainGenerationParams(this._data.generationParamsByModel),
            ) ||
            value73)
        ) {
          const args13 = { ...args11, ...args12 };
          (store.updateNodeData(this.nodeId, args13), (this._data = { ...this._data, ...args13 }));
        }
      }
      const value76 = list15.includes('seedance'),
        value77 = value72?.nodeData?.resolution || this._data.resolution || (value76 ? '720p' : '1080p'),
        value78 = this._getModelParamVisibility(list15, this._data.provider),
        enabled12 = this._isRunninghubWorkflowModel(list15, this._data.provider),
        value79 = this._resolveModelExecution(list15, this._data.provider),
        value80 =
          !enabled11 &&
          !enabled12 &&
          value79?.modelManifest?.adapterType === 'modelApi' &&
          value79?.modelManifest?.kind === 'video',
        value81 = value80
          ? String(value79?.canonicalModelId || value79?.modelManifest?.modelId || list15).trim()
          : list15,
        value82 = enabled12,
        value83 = value82
          ? renderModelUiSchemaControls(list15, this._data, {
              placement: 'instance',
              variant: 'instanceToggle',
            })
          : '',
        hasRunningHubVideoWorkflowUiPlacement2 = hasRunningHubVideoWorkflowUiPlacement(
          list15,
          'videoAdvanced',
        ),
        hasRunningHubVideoWorkflowUiPlacement3 = hasRunningHubVideoWorkflowUiPlacement(list15, 'videoParams'),
        hasRunningHubVideoWorkflowUiPlacement4 = hasRunningHubVideoWorkflowUiPlacement(list15, 'resolution'),
        value84 = hasRunningHubVideoWorkflowUiPlacement3
          ? this._getRhVideoAdvancedSchemaNodeData(this._data)
          : this._data,
        value85 = hasRunningHubVideoWorkflowUiPlacement3
          ? renderModelUiSchemaControls(list15, value84, {
              placement: 'videoParams',
              unwrap: true,
              rhVideoFpsOptions: getRunningHubVideoWorkflowFpsOptions(list15, {
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            })
          : '',
        value86 = hasRunningHubVideoWorkflowUiPlacement4
          ? renderModelUiSchemaControls(list15, value84, { placement: 'resolution' })
          : '',
        value87 = value80 ? renderModelUiSchemaControls(value81, this._data, { placement: 'mode' }) : '',
        value88 = value80
          ? renderModelUiSchemaControls(value81, this._data, { placement: 'resolution' })
          : '',
        value89 = value80 ? renderModelUiSchemaControls(value81, this._data, { placement: 'advanced' }) : '',
        value90 = value80 && hasModelUiSchema(value81, { placement: 'advanced' }),
        value91 = hasRunningHubVideoWorkflowUiPlacement2 || value90,
        iconHtml = this._getModelIconHTML(list15, this._data.provider),
        value92 = this._getRatioIconHTML(this._data.aspectRatio || '自适应'),
        formatVideoRatioResolutionLabel2 = formatVideoRatioResolutionLabel(this._data.aspectRatio, value77),
        value93 =
          '\n                <div class="img-rp-quality-area">\n                  <div class="img-rp-section-label">' +
          videoPanelText('resolution') +
          '</div>\n                  <div class="img-rp-quality-segmented">\n                    <button type="button" class="img-rp-quality-item ' +
          (value77 === '480p' ? 'active' : '') +
          ' ' +
          (value76 ? 'is-disabled' : '') +
          '" data-value="480p" ' +
          (value76 ? 'disabled title="' + videoPanelText('resolutionUnavailable') + '"' : '') +
          '>480p</button>\n                    <button type="button" class="img-rp-quality-item ' +
          (value77 === '720p' ? 'active' : '') +
          '" data-value="720p">720p</button>\n                    <button type="button" class="img-rp-quality-item ' +
          (value77 === '1080p' ? 'active' : '') +
          ' ' +
          (value76 ? 'is-disabled' : '') +
          '" data-value="1080p" ' +
          (value76 ? 'disabled title="' + videoPanelText('resolutionUnavailable') + '"' : '') +
          '>1080p</button>\n                  </div>\n                </div>\n                <div class="img-rp-ratio-area">\n                  <div class="img-rp-section-label">' +
          videoPanelText('aspectRatio') +
          '</div>\n                  <div class="img-rp-ratio-split">\n                    <div class="img-rp-ratio-left">\n                      <button type="button" class="img-rp-large-adaptive active" data-label="自适应" data-w="1" data-h="1">\n                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n                        <span>' +
          videoPanelText('adaptive') +
          '</span>\n                      </button>\n                    </div>\n                    <div class="img-rp-ratio-right">\n                      <button type="button" class="img-rp-ratio-item" data-label="1:1" data-w="1" data-h="1"><span class="img-rp-icon img-rp-sq"></span><span>1:1</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="9:16" data-w="9" data-h="16"><span class="img-rp-icon img-rp-tall"></span><span>9:16</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="16:9" data-w="16" data-h="9"><span class="img-rp-icon img-rp-wide"></span><span>16:9</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="3:4" data-w="3" data-h="4"><span class="img-rp-icon img-rp-p34"></span><span>3:4</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="4:3" data-w="4" data-h="3"><span class="img-rp-icon img-rp-l43"></span><span>4:3</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="3:2" data-w="3" data-h="2" disabled><span class="img-rp-icon img-rp-l32"></span><span>3:2</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="2:3" data-w="2" data-h="3" disabled><span class="img-rp-icon img-rp-p23"></span><span>2:3</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="5:4" data-w="5" data-h="4" disabled><span class="img-rp-icon img-rp-l54"></span><span>5:4</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="4:5" data-w="4" data-h="5" disabled><span class="img-rp-icon img-rp-p45"></span><span>4:5</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="21:9" data-w="21" data-h="9"><span class="img-rp-icon img-rp-ultra"></span><span>21:9</span></button>\n                    </div>\n                  </div>\n                </div>\n      ',
        list16 = value80
          ? resolveVideoModelApiFooterPlacementOrder(value79?.modelManifest)
          : DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER,
        count8 = list16.indexOf('mode'),
        count9 = list16.indexOf('resolution'),
        value94 = value80 && value87 && count8 >= 0 && count9 >= 0 && count8 < count9,
        wrapUiSchemaPlacementControls2 = wrapUiSchemaPlacementControls(value87),
        wrapUiSchemaPlacementControls3 = wrapUiSchemaPlacementControls(value88);
      el2.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              ' +
        renderNodeModelTrigger({ iconHtml: iconHtml, label: getDisplayModelName(list15) }) +
        '\n              <div class="floating-menu img-model-menu node-model-menu" data-node-menu-kind="video" data-lazy-model-menu="video"></div>\n            </div>\n            ' +
        (enabled11 ? '' : value94 ? wrapUiSchemaPlacementControls2 : '') +
        '\n            ' +
        (enabled11 ? '' : hasRunningHubVideoWorkflowUiPlacement3 && value85 ? value85 : '') +
        '\n            ' +
        (enabled11
          ? ''
          : value86
            ? wrapUiSchemaPlacementControls(value86)
            : !hasRunningHubVideoWorkflowUiPlacement3 && value88
              ? wrapUiSchemaPlacementControls3
              : !hasRunningHubVideoWorkflowUiPlacement3
                ? '<div class="img-ratio-wrap"' +
                  (value78.ratio ? '' : ' hidden') +
                  '>\n              <button type="button" class="img-pill-btn img-ratio-btn">\n                <span class="img-ratio-icon-slot">' +
                  value92 +
                  '</span>\n                <span class="img-ratio-label">' +
                  formatVideoRatioResolutionLabel2 +
                  '</span>\n              </button>\n              <div class="img-ratio-popup">\n                ' +
                  value93 +
                  '\n              </div>\n            </div>'
                : '') +
        '\n            ' +
        (enabled11
          ? ''
          : value80
            ? value94
              ? ''
              : value87
                ? wrapUiSchemaPlacementControls2
                : ''
            : '<div class="vid-mode-wrap"' +
              (value78.mode ? '' : ' hidden') +
              '>\n              <button type="button" class="img-pill-btn vid-mode-btn">\n                <span class="vid-mode-label">' +
              getVideoModeLabel(this._data.mode) +
              '</span>\n              </button>\n              <div class="floating-menu vid-mode-menu">\n                <div class="floating-menu-item video-mode-item ' +
              (!this._data.mode || this._data.mode === VIDEO_MODE_ALL_REFERENCE_VALUE ? 'active' : '') +
              '" data-value="' +
              VIDEO_MODE_ALL_REFERENCE_VALUE +
              '">\n                  <svg class="video-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>\n                  <span class="floating-menu-label">' +
              videoPanelText('mode.allReference') +
              '</span>\n                </div>\n                <div class="floating-menu-item video-mode-item ' +
              (this._data.mode === VIDEO_MODE_FIRST_LAST_VALUE ? 'active' : '') +
              '" data-value="' +
              VIDEO_MODE_FIRST_LAST_VALUE +
              '">\n                  <svg class="video-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 17h10"/></svg>\n                  <span class="floating-menu-label">' +
              videoPanelText('mode.firstLastFrame') +
              '</span>\n                </div>\n              </div>\n            </div>') +
        '\n            ' +
        (enabled11 || value80
          ? ''
          : '<div class="vid-duration-wrap"' +
            (value78.duration ? '' : ' hidden') +
            '>\n              <button type="button" class="img-pill-btn vid-duration-btn">\n                <span class="vid-duration-label">' +
            (this._data.duration || '5') +
            'S</span>\n              </button>\n              <div class="floating-menu vid-duration-pop">\n                <div class="vid-duration-title">' +
            videoPanelText('duration') +
            '</div>\n                <input type="range" class="vid-duration-slider" min="4" max="15" step="1" value="' +
            (this._data.duration || 5) +
            '">\n                <div class="vid-duration-bounds">\n                  <span class="vid-duration-min">4S</span>\n                  <span class="vid-duration-max">15S</span>\n                </div>\n              </div>\n            </div>') +
        '\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="img-pill-btn rh-adv2-btn"' +
        (value91 ? '' : ' hidden') +
        '>\n              <span class="rh-adv2-label">' +
        videoPanelText('advancedSettings') +
        '</span>\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot"' +
        (value82 && value83 ? '' : ' hidden') +
        '>\n              ' +
        value83 +
        '\n            </div>\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        videoPanelText('debugApiParams') +
        '">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n                  <button type="button" class="prompt-submit img-gen-btn" ' +
        (enabled12
          ? 'data-tooltip="' + getVideoCancelTooltip() + '"'
          : 'title="' + getVideoGenerateTitle() + '"') +
        '>\n                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n                  </button>\n          </div>';
      const value95 = this._getRhVideoAdvancedSchemaNodeData(this._data),
        value96 = hasRunningHubVideoWorkflowUiPlacement2
          ? renderModelUiSchemaControls(list15, value95, { placement: 'videoAdvanced' })
          : value89,
        value97 = value96
          ? '\n          <div class="rh-vram-adv-panel">\n            ' +
            value96 +
            '\n          </div>\n        '
          : '';
      value72 && this._decorateDreaminaFooter(el2, value72);
      if (value97) el2.insertAdjacentHTML('beforeend', value97);
      ((this.rhVramAdvPanelEl = el2.querySelector('.rh-vram-adv-panel')),
        this._uiSchemaCleanup?.(),
        (this._uiSchemaCleanup = value72
          ? bindUiSchemaFieldControls(el2, {
              getNodeData: () =>
                this._getDreaminaEffectiveNodeData(
                  store.getState?.().nodes?.[this.nodeId] || this._data || {},
                ),
              commitFieldValue: (value98, value99, value100) =>
                this._commitDreaminaSchemaField(value98, value99, value100),
            })
          : bindModelUiSchemaControls(el2, {
              nodeId: this.nodeId,
              nodeData: this._data,
              store: store,
              decorateNodeData: (value101) => this._getRhVideoAdvancedSchemaNodeData(value101),
              buildPatch: (value102, value103, nextMode4, value104) => {
                const value105 = String(value103 || '').trim();
                let list17 = [];
                if (isHappyHorsePanelModel(value102) && value105 === 'happyhorse_mode') {
                  const nodes2 = store.getState?.() || {};
                  list17 = getHappyHorseModeEdgeIdsToRemove({
                    nextMode: nextMode4,
                    inEdges: store.getIncomingEdges?.(this.nodeId) || [],
                    nodes: nodes2.nodes || {},
                  });
                } else {
                  if (isWan27PanelModel(value102) && value105 === 'wan27_mode') {
                    const nodes3 = store.getState?.() || {};
                    list17 = getWan27ModeEdgeIdsToRemove({
                      nextMode: nextMode4,
                      inEdges: store.getIncomingEdges?.(this.nodeId) || [],
                      nodes: nodes3.nodes || {},
                    });
                  } else {
                    if (isKlingV3OmniPanelModel(value102) && value105 === 'kling_v3_omni_mode') {
                      const nodes4 = store.getState?.() || {};
                      list17 = getKlingV3OmniModeEdgeIdsToRemove({
                        nextMode: nextMode4,
                        inEdges: store.getIncomingEdges?.(this.nodeId) || [],
                        nodes: nodes4.nodes || {},
                      });
                    }
                  }
                }
                if (list17.length > 0) {
                  const run = () => {
                    list17.forEach((item18) => store.removeEdge?.(item18));
                  };
                  if (typeof store.batch === 'function') store.batch(run);
                  else run();
                }
                return {
                  ...buildRhWorkflowFieldPatch(value102, value103, nextMode4, value104),
                  ...this._buildModelApiAspectRatioDisplayPatch(value102, value103, nextMode4, value104),
                  ...this._buildRunningHubWorkflowAspectRatioDisplayPatch(
                    value102,
                    value103,
                    nextMode4,
                    value104,
                  ),
                };
              },
              afterCommit: (value106, value107, value108) => {
                const value109 = String(value106 || '').trim(),
                  panelModelManifest = getPanelModelManifest(value108),
                  manifestHelpVariantsReferenceField2 = manifestHelpVariantsReferenceField(
                    panelModelManifest,
                    value109,
                  ),
                  manifestPromptVariantsReferenceField2 = manifestPromptVariantsReferenceField(
                    panelModelManifest,
                    value109,
                  ),
                  manifestFixedSlotVisibilityReferencesField2 = manifestFixedSlotVisibilityReferencesField(
                    panelModelManifest,
                    value109,
                  );
                (manifestHelpVariantsReferenceField2 ||
                  manifestPromptVariantsReferenceField2 ||
                  manifestFixedSlotVisibilityReferencesField2) &&
                  ((this._data = { ...(this._data || {}), ...(value108 || {}) }),
                  manifestHelpVariantsReferenceField2 && this._syncGenerationNodeHelpTip?.(),
                  manifestPromptVariantsReferenceField2 && this._syncDreaminaPromptPlaceholder?.(this._data),
                  manifestFixedSlotVisibilityReferencesField2 && this._renderRefBar?.(),
                  this._updateSubmitButtonState?.());
              },
            })),
        this._footerControllerCleanup?.(),
        (this._footerControllerCleanup = bindNodeFooterController(el2)),
        value71 && this.rhVramAdvPanelEl && this.rhVramAdvPanelEl.classList.add('show'),
        (this.btnEl = el2.querySelector('.img-gen-btn')),
        this._bindFooterEvents(el2));
    }
    ['_runVipRetryOnce'](handler) {
      let value110 = false;
      return () => {
        if (value110) return;
        ((value110 = true), (this._vipSelectionRetryInProgress = true));
        try {
          handler();
        } finally {
          this._vipSelectionRetryInProgress = false;
        }
      };
    }
    ['_guardVipSelection'](value111, value112 = null, value113 = null) {
      const modelId = String(value111 || '');
      let provider2 = '',
        onSuccess = value113;
      typeof value112 === 'function' ? (onSuccess = value112) : (provider2 = String(value112 || '').trim());
      if (!isVideoVipModel(modelId, provider2)) return true;
      const run2 = window.isModelAllowedBySubscription,
        value114 = typeof run2 === 'function' ? run2(modelId, provider2) : true;
      if (value114) return true;
      if (this._vipSelectionRetryInProgress) return false;
      return (
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({ modelId: modelId, provider: provider2, onSuccess: onSuccess })
          : window.showToast?.(videoPanelText('vipRequired'), 'warn'),
        false
      );
    }
    ['_bindFooterEvents'](el4) {
      const el5 = el4.querySelector('.img-model-btn-trigger'),
        el6 = el4.querySelector('.img-model-menu'),
        el7 = el4.querySelector('.dreamina-task-model-btn'),
        el8 = el4.querySelector('.dreamina-task-model-menu'),
        el9 = el4.querySelector('.img-ratio-btn'),
        el10 = el4.querySelector('.img-ratio-popup'),
        el11 = el4.querySelector('.img-ratio-label'),
        el12 = el4.querySelector('.img-ratio-icon-slot'),
        value115 = el4.querySelector('.vid-mode-btn'),
        el13 = el4.querySelector('.vid-mode-menu'),
        el14 = el4.querySelector('.vid-mode-label'),
        value116 = el4.querySelector('.vid-duration-btn'),
        el15 = el4.querySelector('.vid-duration-pop'),
        el16 = el4.querySelector('.vid-duration-slider'),
        el17 = el4.querySelector('.vid-duration-label'),
        value117 = el4.querySelector('.rh-adv2-btn'),
        el18 = el4.querySelector('.rh-vram-adv-panel'),
        handler2 = () => {
          el10?.classList.remove('show');
          if (el10) el10.style.display = '';
        },
        handler3 = () => {
          el15?.classList.remove('show');
          if (el15) el15.style.display = '';
        },
        enabled13 = this._isDreaminaVideoNode(this._data),
        value118 = enabled13
          ? this._getDreaminaEffectiveNodeData(this._data)
          : this._getRhVideoAdvancedSchemaNodeData(this._data);
      syncModelUiSchemaControls(el4, value118);
      const run3 = (value119) => {
          const value120 = {
            ...(store.getState().nodes?.[this.nodeId] || this._data || {}),
            ...(value119 && typeof value119 === 'object' ? value119 : {}),
          };
          return (
            store.updateNodeData(this.nodeId, value119),
            (this._data = value120),
            (this._lastFooterSig = ''),
            this._renderFooter(el4),
            value120
          );
        },
        handler4 = () => store.getState().nodes?.[this.nodeId] || this._data || {},
        handler5 = ({
          model: model2,
          provider: provider3,
          useRememberedRouteModel: useRememberedRouteModel = false,
        } = {}) => {
          const enabled14 = String(model2 || '').trim();
          if (!enabled14) return null;
          const value121 = handler4(),
            value122 = this._getDreaminaEffectiveNodeData(value121),
            value123 = this._syncDreaminaTaskState(value121, { syncStore: false }),
            aspectRatio = value123?.nodeData || value122 || value121,
            provider4 = resolveDreaminaStyleVideoProvider(
              enabled14,
              provider3 || aspectRatio?.provider || 'dreamina',
            ),
            taskType =
              value123?.resolvedTaskType || this._getResolvedDreaminaTaskType(aspectRatio, value123?.summary),
            routeMode =
              value123?.routeMode ||
              normalizeDreaminaVideoRouteMode(aspectRatio?.dreaminaRouteMode, aspectRatio?.mode),
            fallbackModel = ensureDreaminaStyleVideoModelForTask(taskType, enabled14, provider4) || enabled14,
            model3 = useRememberedRouteModel
              ? resolveDreaminaRememberedRouteModel(aspectRatio, {
                  provider: provider4,
                  routeMode: routeMode,
                  taskType: taskType,
                  fallbackModel: fallbackModel,
                }) || fallbackModel
              : fallbackModel,
            resolution2 = normalizeDreaminaStyleVideoResolution(
              taskType,
              model3,
              aspectRatio?.resolution || aspectRatio?.videoSize,
              provider4,
            ),
            duration = normalizeDreaminaStyleVideoDuration(
              taskType,
              model3,
              aspectRatio?.duration,
              provider4,
            ),
            args14 = { provider: provider4, model: model3 };
          return run3({
            ...args14,
            ...this._buildDreaminaModelSelectionParamPatch(aspectRatio, {
              model: model3,
              provider: provider4,
              taskType: taskType,
              fallbackValues: {
                dreaminaRouteMode: routeMode,
                aspectRatio: aspectRatio?.aspectRatio,
                ...(resolution2 ? { resolution: resolution2 } : {}),
                duration: duration,
              },
            }),
          });
        };
      let bindNodeSubmenus2 = null;
      const run4 = () => {
        if (!el6) return null;
        if (el6.dataset.lazyMounted === '1') return el6;
        const value124 = handler4(),
          value125 = String(value124?.model || this._data?.model || '').trim() || getDefaultVideoModelId(),
          el19 = document.createElement('template');
        el19.innerHTML = this._buildVideoModelMenuHtml(value125).trim();
        const el20 = el19.content.firstElementChild;
        return (
          (el6.innerHTML = el20?.innerHTML || ''),
          (el6.dataset.lazyMounted = '1'),
          (el6.dataset.nodeMenuKind = el20?.dataset?.nodeMenuKind || 'video'),
          bindNodeSubmenus2?.(),
          (bindNodeSubmenus2 = bindNodeSubmenus(el6)),
          el6
        );
      };
      el5 &&
        el6 &&
        el5.addEventListener('click', (event) => {
          event.stopPropagation();
          const el21 = run4();
          if (!el21) return;
          const value126 = !el21.classList.contains('show');
          (closeNodeFooterMenus(el4, el6),
            el8?.classList.remove('show'),
            el21.classList.toggle('show', value126));
          if (value126) activateMenuKeyboard(el21);
        });
      el9 &&
        el10 &&
        (el9.onclick = (event2) => {
          event2.stopPropagation();
          if (el9.disabled || !String(el10.innerHTML || '').trim()) return;
          ((el10.style.display = ''),
            el10.classList.toggle('show'),
            el6.classList.remove('show'),
            el8?.classList.remove('show'));
          if (el13) el13.classList.remove('show');
          (handler3(), el18?.classList.remove('show'));
        });
      el7 &&
        el8 &&
        (el7.onclick = (event3) => {
          event3.stopPropagation();
          if (el7.disabled) return;
          (el8.classList.toggle('show'), el6.classList.remove('show'), handler2());
          if (el13) el13.classList.remove('show');
          (handler3(),
            el18?.classList.remove('show'),
            el8.classList.contains('show') && activateMenuKeyboard(el8));
        });
      value115 &&
        el13 &&
        (value115.onclick = (event4) => {
          (event4.stopPropagation(),
            el13.classList.toggle('show'),
            el6.classList.remove('show'),
            el8?.classList.remove('show'),
            handler2(),
            handler3(),
            el18?.classList.remove('show'),
            el13.classList.contains('show') && activateMenuKeyboard(el13));
        });
      value116 &&
        el15 &&
        (value116.onclick = (event5) => {
          (event5.stopPropagation(),
            (el15.style.display = ''),
            el15.classList.toggle('show'),
            el6.classList.remove('show'),
            el8?.classList.remove('show'),
            handler2());
          if (el13) el13.classList.remove('show');
          el18?.classList.remove('show');
        });
      const run5 = () => {
        (el6?.classList.remove('show'),
          el6?.querySelectorAll('.node-model-submenu, .node-menu-submenu').forEach((el22) => {
            el22.style.display = 'none';
          }));
      };
      (el6?.addEventListener('click', (event6) => {
        event6.stopPropagation();
        const el23 = event6.target?.closest?.('.floating-menu-item');
        if (!el23 || !el6.contains(el23)) return;
        if (el23.hasAttribute('data-node-menu-submenu')) return;
        if (el23.closest('.apimart-video-submenu')) {
          const model4 = el23.dataset.value || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL;
          if (isApimartDreaminaVideoModel(model4, 'apimart')) {
            handler5({ model: model4, provider: 'apimart', useRememberedRouteModel: true });
            return;
          }
        }
        if (el23.closest('.runninghub-submenu')) {
          if (el23.dataset.disabled === 'true') {
            (window.showToast?.(videoPanelText('videoGenerationUnavailable'), 'warn'), run5());
            return;
          }
          const model5 = el23.dataset.value;
          if (!model5) return;
          const value127 = this._runVipRetryOnce(() => el23.click());
          if (!this._guardVipSelection(model5, value127)) {
            run5();
            return;
          }
          const provider5 = el23.dataset.provider || null,
            value128 = store.getState().nodes?.[this.nodeId] || {},
            value129 = { model: model5, provider: provider5 };
          if (this._isRunninghubWorkflowModel(model5, provider5))
            Object.assign(
              value129,
              buildVideoWorkflowModelSelectionPatch(value128, model5, {
                preserveMaskTouchedState: true,
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            );
          else {
            const modelExecution4 = resolveModelExecution(model5, { providerHint: provider5 });
            modelExecution4?.modelManifest?.kind === 'video' &&
              modelExecution4?.modelManifest?.adapterType === 'modelApi' &&
              Object.assign(
                value129,
                buildVideoModelApiModelSelectionPatch(
                  value128,
                  modelExecution4.canonicalModelId || model5,
                  provider5 || modelExecution4?.modelManifest?.provider || null,
                  value129,
                ),
              );
          }
          run3(value129);
          return;
        }
        if (el23.dataset.disabled === 'true') {
          (window.showToast?.(videoPanelText('videoGenerationUnavailable'), 'warn'), run5());
          return;
        }
        const model6 = el23.dataset.value;
        if (!model6) return;
        const value130 = el23.dataset.provider || 'dreamina';
        if (isDreaminaStyleVideoModel(model6, value130)) {
          const provider6 = resolveDreaminaStyleVideoProvider(model6, value130),
            value131 = this._runVipRetryOnce(() => el23.click());
          if (!this._guardVipSelection(model6, provider6, value131)) {
            run5();
            return;
          }
          handler5({ model: model6, provider: provider6, useRememberedRouteModel: true });
          return;
        }
        const value132 = this._runVipRetryOnce(() => el23.click());
        if (!this._guardVipSelection(model6, value132)) {
          run5();
          return;
        }
        const providerHint4 = { model: model6 };
        providerHint4.provider = el23.dataset.provider || null;
        const value133 = store.getState().nodes?.[this.nodeId] || {};
        if (this._isRunninghubWorkflowModel(model6, providerHint4.provider))
          Object.assign(
            providerHint4,
            buildVideoWorkflowModelSelectionPatch(value133, model6, {
              v54FpsOptions: getRhV54FpsOptions(),
            }),
          );
        else {
          const modelExecution5 = resolveModelExecution(model6, { providerHint: providerHint4.provider });
          modelExecution5?.modelManifest?.kind === 'video' &&
            modelExecution5?.modelManifest?.adapterType === 'modelApi' &&
            Object.assign(
              providerHint4,
              buildVideoModelApiModelSelectionPatch(
                value133,
                modelExecution5.canonicalModelId || model6,
                providerHint4.provider || modelExecution5?.modelManifest?.provider || null,
                providerHint4,
              ),
            );
        }
        (model6.includes('seedance') &&
          (!this._data.resolution || this._data.resolution !== '720p') &&
          (providerHint4.resolution = '720p'),
          run3(providerHint4));
      }),
        el8?.querySelectorAll('.floating-menu-item').forEach(
          (el24) =>
            (el24.onclick = () => {
              if (el24.dataset.disabled === 'true') {
                (window.showToast?.(videoPanelText('smartMultiframeUnavailable'), 'warn'),
                  el8.classList.remove('show'));
                return;
              }
              const model7 = String(el24.dataset.value || '').trim();
              if (!model7) return;
              const provider7 = resolveDreaminaStyleVideoProvider(
                  model7,
                  el24.dataset.provider || this._data?.provider || 'dreamina',
                ),
                value134 = this._runVipRetryOnce(() => el24.click());
              if (!this._guardVipSelection(model7, provider7, value134)) {
                el8.classList.remove('show');
                return;
              }
              handler5({ model: model7, provider: provider7, useRememberedRouteModel: false });
            }),
        ));
      value117 &&
        el18 &&
        ((value117.onclick = (event7) => {
          event7.stopPropagation();
          const value135 = !el18.classList.contains('show');
          ((el18.style.display = ''),
            el18.classList.toggle('show', value135),
            el6.classList.remove('show'),
            handler2());
          if (el13) el13.classList.remove('show');
          handler3();
        }),
        (el18.onclick = (event8) => event8.stopPropagation()));
      el13 &&
        el14 &&
        el13.querySelectorAll('.floating-menu-item').forEach(
          (el25) =>
            (el25.onclick = () => {
              if (enabled13) {
                const dreaminaVideoRouteMode = normalizeDreaminaVideoRouteMode(
                  el25.dataset.routeMode || el25.dataset.value,
                );
                if (!dreaminaVideoRouteMode) return;
                (this._commitDreaminaRouteMode(dreaminaVideoRouteMode, this._data),
                  el13.classList.remove('show'));
                return;
              }
              const mode = el25.dataset.value;
              (store.updateNodeData(this.nodeId, { mode: mode }),
                (el14.textContent = getVideoModeLabel(mode)),
                el13.classList.remove('show'),
                el13
                  .querySelectorAll('.floating-menu-item')
                  .forEach((el26) => el26.classList.toggle('active', el26 === el25)));
            }),
        );
      if (enabled13 && el13) {
        const value136 = () => {
          const dreaminaTransitionPrompts = [];
          el13.querySelectorAll('.dreamina-transition-prompt').forEach((el27) => {
            const value137 = Number(el27.dataset.index);
            Number.isFinite(value137) && (dreaminaTransitionPrompts[value137] = el27.value);
          });
          const dreaminaTransitionDurations = [];
          (el13.querySelectorAll('.dreamina-transition-duration').forEach((el28) => {
            const value138 = Number(el28.dataset.index);
            Number.isFinite(value138) && (dreaminaTransitionDurations[value138] = el28.value);
          }),
            store.updateNodeData(this.nodeId, {
              dreaminaTransitionPrompts: dreaminaTransitionPrompts,
              dreaminaTransitionDurations: dreaminaTransitionDurations,
            }));
        };
        (el13.querySelectorAll('.dreamina-transition-prompt').forEach((el29) => {
          (el29.addEventListener('input', value136),
            el29.addEventListener('click', (event9) => event9.stopPropagation()));
        }),
          el13.querySelectorAll('.dreamina-transition-duration').forEach((el30) => {
            (el30.addEventListener('input', value136),
              el30.addEventListener('change', value136),
              el30.addEventListener('click', (event10) => event10.stopPropagation()));
          }));
      }
      el16 &&
        el17 &&
        (el16.oninput = () => {
          if (enabled13) {
            const value139 = this._syncDreaminaTaskState(this._data, { syncStore: false }),
              value140 = value139?.resolvedTaskType || this._getResolvedDreaminaTaskType(),
              dreaminaStyleVideoProvider = resolveDreaminaStyleVideoProvider(
                this._data?.model,
                this._data?.provider,
              ),
              dreaminaStyleVideoModelForTask = ensureDreaminaStyleVideoModelForTask(
                value140,
                this._data?.model,
                dreaminaStyleVideoProvider,
              ),
              duration2 = normalizeDreaminaStyleVideoDuration(
                value140,
                dreaminaStyleVideoModelForTask,
                el16.value,
                dreaminaStyleVideoProvider,
              );
            ((el17.textContent = duration2 + 'S'),
              this._commitDreaminaParamValues({ duration: duration2 }, this._data));
            return;
          }
          const value141 = el16.value;
          ((el17.textContent = value141 + 'S'),
            store.updateNodeData(this.nodeId, { duration: parseInt(value141, 10) }));
        });
      el11 &&
        el10?.querySelectorAll('.img-rp-quality-item').forEach(
          (resolution3) =>
            (resolution3.onclick = () => {
              if (resolution3.hasAttribute('disabled')) return;
              if (resolution3.closest('[data-ui-schema-field]')) return;
              if (enabled13 && resolution3.dataset.dreaminaKind === 'resolution') {
                const resolution4 = String(resolution3.dataset.value || '').trim();
                if (!resolution4) return;
                this._commitDreaminaParamValues({ resolution: resolution4 }, this._data);
                const value142 = {
                    ...this._getDreaminaEffectiveNodeData(
                      store.getState().nodes?.[this.nodeId] || this._data || {},
                    ),
                  },
                  value143 = this._getDreaminaRatioDisplayState(value142);
                el11.textContent =
                  value143?.ratioLabelText ||
                  formatVideoRatioResolutionLabel(value142.aspectRatio || '1:1', resolution4);
                el12 &&
                  (el12.innerHTML = this._getRatioIconHTML(
                    value143?.ratioIconLabel || value142.aspectRatio || '1:1',
                  ));
                const el31 = resolution3.parentElement;
                (el31
                  ?.querySelectorAll('.img-rp-quality-item')
                  .forEach((el32) => el32.classList.remove('active')),
                  resolution3.classList.add('active'));
                return;
              }
              (store.updateNodeData(this.nodeId, { resolution: resolution3.dataset.value }),
                (el11.textContent = formatVideoRatioResolutionLabel(
                  this._data.aspectRatio,
                  resolution3.dataset.value,
                )));
              const el33 = resolution3.parentElement;
              (el33
                ?.querySelectorAll('.img-rp-quality-item')
                .forEach((el34) => el34.classList.remove('active')),
                resolution3.classList.add('active'));
            }),
        );
      const duration3 = 0x118,
        handler6 = (value144) => {
          const enabled15 = String(value144 || '').trim();
          if (!enabled15 || enabled15 === '自适应') return { w: 1, h: 1, label: '自适应' };
          const label = enabled15.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
          if (!label) return null;
          return {
            w: parseFloat(label[1]),
            h: parseFloat(label[2]),
            label: label[1] + ':' + label[2],
          };
        },
        handler7 = (value145 = '', enabled16 = false) => {
          const value146 = String(value145 || '').trim(),
            value147 = !!enabled16 || value146 === '自适应';
          el4
            .querySelectorAll('.img-rp-ratio-item,.img-rp-large-adaptive')
            .forEach((el35) => el35.classList.remove('active'));
          if (value147) {
            el4.querySelector('.img-rp-large-adaptive')?.classList.add('active');
            return;
          }
          el4
            .querySelectorAll('.img-rp-ratio-item')
            .forEach((el36) =>
              el36.classList.toggle('active', String(el36.dataset.label || '').trim() === value146),
            );
        },
        handler8 = (value148, value149, aspectRatio2, value150 = {}) => {
          const value151 = value150?.persistAspectRatio !== false,
            handler9 = (value152) => {
              const el37 = document.getElementById(this.nodeId);
              if (!el37) return;
              el37.classList.add('is-ratio-animating');
              if (this._ratioAnimTimer) clearTimeout(this._ratioAnimTimer);
              this._ratioAnimTimer = setTimeout(() => {
                const el38 = document.getElementById(this.nodeId);
                if (el38) el38.classList.remove('is-ratio-animating');
                this._ratioAnimTimer = null;
              }, value152 + 80);
            },
            value153 = this._data.width || 0x12c,
            value154 = this._data.height || 0x12c,
            box = getAIGenerationNodeSize(value148, value149),
            width = box.width,
            height = box.height,
            count10 = width - value153,
            count11 = height - value154;
          if (count10 !== 0 || count11 !== 0) handler9(duration3);
          const value155 = {
            width: width,
            height: height,
            x: Math.round(this._data.x - count10 / 2),
            y: Math.round(this._data.y - count11),
          };
          value151 &&
            (this._isDreaminaVideoNode(this._data)
              ? Object.assign(
                  value155,
                  this._buildDreaminaParamPatch(this._data, { aspectRatio: aspectRatio2 }),
                )
              : (value155.aspectRatio = aspectRatio2));
          store.updateNodeData(this.nodeId, value155);
          const value156 = store.getState().nodes?.[this.nodeId] || this._data || {},
            value157 = this._getDreaminaRatioDisplayState(value156);
          el11 &&
            (el11.textContent =
              value157?.ratioLabelText ||
              formatVideoRatioResolutionLabel(aspectRatio2, value156.resolution || '1080p'));
          el12 && (el12.innerHTML = this._getRatioIconHTML(value157?.ratioIconLabel || aspectRatio2));
          ((this.previewEl.style.transition = 'none'),
            (this.previewEl.style.transformOrigin = 'bottom center'),
            (this.previewEl.style.transform =
              'scaleX(' + value153 / width + ') scaleY(' + value154 / height + ')'),
            void this.previewEl.offsetWidth);
          if (this._ratioFlipAnim) this._ratioFlipAnim.cancel();
          const transform = 'scaleX(' + value153 / width + ') scaleY(' + value154 / height + ')';
          this._ratioFlipAnim = this.previewEl.animate([{ transform: transform }, { transform: 'none' }], {
            duration: duration3,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards',
          });
          const value158 = () => {
            ((this._ratioFlipAnim = null),
              (this.previewEl.style.transformOrigin = ''),
              (this.previewEl.style.transform = ''));
          };
          ((this._ratioFlipAnim.onfinish = value158), (this._ratioFlipAnim.oncancel = value158));
        },
        handler10 = (value159, value160 = {}) => {
          const enabled17 = handler6(value159);
          if (!enabled17) return;
          (handler8(enabled17.w, enabled17.h, enabled17.label, value160), handler7(enabled17.label, false));
        };
      !enabled13 &&
        el4.querySelectorAll('.img-rp-ratio-item').forEach(
          (el39) =>
            (el39.onclick = () => {
              if (
                el39.hasAttribute('disabled') ||
                el39.classList.contains('disabled') ||
                el39.getAttribute('aria-disabled') === 'true'
              )
                return;
              handler10(el39.dataset.label);
            }),
        );
      const run6 = () => {
        const value161 = store.getState(),
          value162 = value161.nodes?.[this.nodeId],
          value163 = String(value162?.model || ''),
          runningHubVideoParameterPanelPolicy2 =
            getRunningHubVideoParameterPanelPolicy(value163).adaptiveRatio || {},
          value164 =
            runningHubVideoParameterPanelPolicy2.preferSlot &&
            runningHubVideoParameterPanelPolicy2.preferVideoKind === true &&
            runningHubVideoParameterPanelPolicy2.fallbackSquareWhenNoVideo !== true,
          value165 =
            runningHubVideoParameterPanelPolicy2.preferSlot &&
            runningHubVideoParameterPanelPolicy2.preferVideoKind !== true,
          value166 =
            runningHubVideoParameterPanelPolicy2.preferSlot &&
            runningHubVideoParameterPanelPolicy2.preferVideoKind === true &&
            runningHubVideoParameterPanelPolicy2.fallbackSquareWhenNoVideo === true;
        let list18 = store.getIncomingEdges(this.nodeId);
        runningHubVideoParameterPanelPolicy2.scopeTargetEdges === true &&
          (list18 = list18.filter((item19) => item19?.targetId === this.nodeId));
        const run7 = (value167, value168) => {
          const count12 = Number(value167),
            count13 = Number(value168);
          if (!(Number.isFinite(count12) && count12 > 0)) return false;
          if (!(Number.isFinite(count13) && count13 > 0)) return false;
          return (handler8(count12, count13, '自适应'), true);
        };
        if (list18.length > 0) {
          let value169 = list18[0];
          if (value164) {
            const value170 = list18.find((item20) => String(item20?.refSlot || '') === 'sourceVideo');
            if (value170) value169 = value170;
            else {
              const value171 = list18.find((item21) => {
                const value172 = value161.nodes?.[item21?.sourceId],
                  value173 = String(value172?.type || '');
                return value173 === 'source-video' || value173 === 'video' || value173 === 'ai-video';
              });
              if (value171) value169 = value171;
            }
          } else {
            if (value165 || value166) {
              const value174 = list18.find((item22) => String(item22?.refSlot || '') === 'sourceVideo');
              if (value174) value169 = value174;
              else {
                if (value166) {
                  const value175 = list18.find((item23) => {
                    const value176 = value161.nodes?.[item23?.sourceId],
                      value177 = String(value176?.type || '');
                    return value177 === 'source-video' || value177 === 'video' || value177 === 'ai-video';
                  });
                  if (value175) value169 = value175;
                  else {
                    handler8(1, 1, '自适应');
                    return;
                  }
                }
              }
            }
          }
          const value178 = value169.sourceId,
            box2 = value161.nodes[value178],
            value179 = String(box2?.type || ''),
            value180 = value179 === 'ai-video' || value179 === 'source-video' || value179 === 'video';
          if (value180) {
            const value181 = getDisplayedMediaSizeFromNode(value178, 'video'),
              value182 = Number(value181?.w || 0),
              value183 = Number(value181?.h || 0);
            if (run7(value182, value183)) return;
            const value184 = Number(value169?.sourceMediaW || 0),
              value185 = Number(value169?.sourceMediaH || 0);
            if (run7(value184, value185)) return;
            const value186 = Number(box2?.mainVideoIndex),
              value187 = Number.isFinite(value186) ? Math.max(0, Math.trunc(value186)) : 0,
              list19 = Array.isArray(box2?.videos) ? box2.videos : [];
            let value188 = value187;
            const value189 = String(value169?.sourceMediaKey || '').trim();
            if (value189 && list19.length) {
              const count14 = list19.findIndex((item24) => {
                const value190 =
                  String(item24?.localPath || '').trim() || String(item24?.videoUrl || '').trim();
                return value190 === value189;
              });
              if (count14 >= 0) value188 = count14;
            }
            const value191 = list19[value188],
              value192 = Number(value191?.videoWidth || 0),
              value193 = Number(value191?.videoHeight || 0);
            if (run7(value192, value193)) return;
            const value194 = Number(box2?.selectedVideoWidth || 0),
              value195 = Number(box2?.selectedVideoHeight || 0);
            if (run7(value194, value195)) return;
            const value196 = ++this._adaptiveSrcRetryToken;
            (setTimeout(() => {
              if (value196 !== this._adaptiveSrcRetryToken) return;
              const enabled18 = store.getState().nodes?.[this.nodeId];
              if (!enabled18) return;
              const value197 = this._getDreaminaEffectiveNodeData(enabled18);
              if (String(value197.aspectRatio || '自适应') !== '自适应') return;
              const value198 = store.getState().nodes?.[value178];
              if (value198) {
                const value199 = Number(value169?.sourceMediaW || 0),
                  value200 = Number(value169?.sourceMediaH || 0);
                if (run7(value199, value200)) return;
                const value201 = Number(value198.mainVideoIndex),
                  value202 = Number.isFinite(value201) ? Math.max(0, Math.trunc(value201)) : 0,
                  list20 = Array.isArray(value198.videos) ? value198.videos : [];
                let value203 = value202;
                const value204 = String(value169?.sourceMediaKey || '').trim();
                if (value204 && list20.length) {
                  const count15 = list20.findIndex((item25) => {
                    const value205 =
                      String(item25?.localPath || '').trim() || String(item25?.videoUrl || '').trim();
                    return value205 === value204;
                  });
                  if (count15 >= 0) value203 = count15;
                }
                const value206 = list20[value203],
                  value207 = Number(value206?.videoWidth || 0),
                  value208 = Number(value206?.videoHeight || 0);
                if (run7(value207, value208)) return;
                const value209 = Number(value198.selectedVideoWidth || 0),
                  value210 = Number(value198.selectedVideoHeight || 0);
                if (run7(value209, value210)) return;
              }
              const value211 = getDisplayedMediaSizeFromNode(value178, 'video'),
                count16 = Number(value211?.w || 0),
                count17 = Number(value211?.h || 0);
              if (count16 > 0 && count17 > 0) handler8(count16, count17, '自适应');
            }, 160),
              handler8(1, 1, '自适应'));
            return;
          }
          const value212 = getDisplayedMediaSizeFromNode(value178, 'image'),
            value213 = Number(value212?.w || 0),
            value214 = Number(value212?.h || 0);
          if (run7(value213, value214)) return;
          if (box2) {
            const value215 = Number(box2.width || 0),
              value216 = Number(box2.height || 0);
            if (run7(value215, value216)) return;
          }
          handler8(1, 1, '自适应');
          return;
        }
        const value217 = Boolean(
          (value162?.videos && value162.videos.length) ||
          value162?.localPath ||
          value162?.thumbUrl ||
          value162?.videoUrl ||
          value162?.src,
        );
        if (value217) {
          const value218 = this.videoEl?.videoWidth || 0,
            value219 = this.videoEl?.videoHeight || 0;
          if (run7(value218, value219)) return;
          return;
        }
        handler8(1, 1, '自适应');
      };
      ((this._runAdaptiveRatio = () => {
        const value220 = store.getState().nodes?.[this.nodeId] || this._data || {};
        if (this._isRunninghubWorkflowModel(value220?.model, value220?.provider)) return;
        const el40 = el4.querySelector('.img-rp-large-adaptive');
        if (this._isDreaminaVideoNode(value220)) {
          (this._commitDreaminaSchemaAspectRatio('自适应', value220),
            handler7('自适应', true),
            el40?.classList.add('active'));
          return;
        }
        (run6(), handler7('自适应', true), el40?.classList.add('active'));
      }),
        (this._applyStoredAspectRatio = () => {
          const value221 = store.getState().nodes?.[this.nodeId] || this._data || {},
            value222 = this._getDreaminaRatioDisplayState(value221),
            value223 = String(value222?.currentRatio || '').trim() || '自适应';
          if (value223 === '自适应') {
            this._runAdaptiveRatio?.();
            return;
          }
          handler10(value223, { persistAspectRatio: true });
        }),
        (this._applyDreaminaSchemaAspectRatio = (value224) => {
          const value225 = store.getState().nodes?.[this.nodeId] || this._data || {};
          this._commitDreaminaSchemaAspectRatio(value224, value225);
        }));
      const value226 = el4.querySelector('.img-rp-large-adaptive');
      value226 && !enabled13 && (value226.onclick = () => this._runAdaptiveRatio());
      this.btnEl.onclick = () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      };
      const el41 = el4.querySelector('.debug-wrench-btn');
      el41?.addEventListener('click', async (event11) => {
        (event11.stopPropagation(), flushPromptHtmlCommit(this));
        const enabled19 = await this._buildPayload();
        if (!enabled19) {
          window.showToast?.(videoPanelText('missingPromptOrReference'), 'warn');
          return;
        }
        try {
          const value227 = await api.buildGenerateVideoRequest(enabled19),
            outputText = formatFinalApiDebugRequest(value227),
            value228 = store.getState(),
            x = this._data.x + (this._data.width || 0x17c) + 50,
            y = this._data.y;
          let enabled20 = Object.values(value228.nodes).find((item26) => item26.type === 'debug');
          (!enabled20
            ? store.addNode({
                id: 'debug-' + Date.now(),
                type: 'debug',
                x: x,
                y: y,
                width: 0x17c,
                height: 0x12c,
                name: videoPanelText('debugNodeName'),
                outputText: outputText,
              })
            : store.updateNodeData(enabled20.id, { outputText: outputText, x: x, y: y }),
            window.showToast?.(videoPanelText('debugParamsShown'), 'warn'));
        } catch (error) {
          window.showToast?.(videoPanelText('buildRequestFailed', { error: error.message }), 'error');
        }
      });
      !this._docClickBound &&
        (document.addEventListener('click', () => {
          if (this._suppressDocClickOnce) {
            this._suppressDocClickOnce = false;
            return;
          }
          const el42 = this.footerEl;
          if (!el42) return;
          (closeNodeFooterMenus(el42),
            el42.querySelector('.img-model-menu')?.classList.remove('show'),
            el42.querySelector('.dreamina-task-model-menu')?.classList.remove('show'));
          const el43 = el42.querySelector('.img-ratio-popup');
          el43?.classList.remove('show');
          if (el43) el43.style.display = '';
          el42.querySelector('.vid-mode-menu')?.classList.remove('show');
          const el44 = el42.querySelector('.vid-duration-pop');
          el44?.classList.remove('show');
          if (el44) el44.style.display = '';
          el42.querySelector('.rh-vram-adv-panel')?.classList.remove('show');
        }),
        (this._docClickBound = true));
      if (el10) el10.onclick = (event12) => event12.stopPropagation();
      if (el15) el15.onclick = (event13) => event13.stopPropagation();
      if (el13) el13.onclick = (event14) => event14.stopPropagation();
      if (el8) el8.onclick = (event15) => event15.stopPropagation();
    }
    ['_isDreaminaVideoNode'](value229 = this._data) {
      return isDreaminaStyleVideoModel(value229?.model, value229?.provider);
    }
    ['_getDreaminaEffectiveNodeData'](value230 = this._data) {
      return getDreaminaEffectiveNodeData(value230);
    }
    ['_buildDreaminaParamPatch'](value231 = this._data, value232 = {}) {
      return buildDreaminaParamPatch(value231, value232);
    }
    ['_buildDreaminaModelSelectionParamPatch'](value233 = this._data, value234 = {}) {
      return buildDreaminaModelSelectionParamPatch(value233, value234);
    }
    ['_commitDreaminaParamValues'](options11 = {}, value235 = this._data, args15 = {}) {
      const args16 =
          this._getDreaminaEffectiveNodeData(value235) ||
          this._getDreaminaEffectiveNodeData(store.getState().nodes?.[this.nodeId] || this._data || {}),
        value236 = { ...args16, ...args15 },
        args17 = this._buildDreaminaParamPatch(value236, options11),
        args18 = { ...(args15 && typeof args15 === 'object' ? args15 : {}), ...args17 };
      return (
        store.updateNodeData(this.nodeId, args18),
        (this._data = this._getDreaminaEffectiveNodeData({ ...args16, ...args18 })),
        this._data
      );
    }
    ['_commitDreaminaRouteMode'](nextRouteMode, baseNodeData = this._data) {
      const nodes5 = store.getState(),
        el45 = buildDreaminaRouteModeUpdate({
          nextRouteMode: nextRouteMode,
          baseNodeData: baseNodeData,
          incoming: store.getIncomingEdges(this.nodeId) || [],
          nodes: nodes5.nodes || {},
        });
      if (el45.disabled)
        return (
          window.showToast?.(videoPanelText('smartMultiframeUnavailable'), 'warn'),
          (this._data = el45.nodeData),
          this._data
        );
      const list21 = Array.isArray(el45.edgeIdsToRemove) ? el45.edgeIdsToRemove : [],
        args19 = el45.patch || {};
      return (
        (list21.length > 0 || Object.keys(args19).length > 0) &&
          store.batch(() => {
            (list21.forEach((item27) => store.removeEdge(item27)),
              Object.keys(args19).length > 0 && store.updateNodeData(this.nodeId, args19));
          }),
        (this._data = el45.nodeData || this._getDreaminaEffectiveNodeData({ ...baseNodeData, ...args19 })),
        this._data
      );
    }
    ['_commitDreaminaSchemaField'](value237, value238, value239 = this._data) {
      const value240 = String(value237 || '').trim(),
        value241 = this._getDreaminaEffectiveNodeData(value239);
      if (value240 === 'dreaminaRouteMode') return this._commitDreaminaRouteMode(value238, value241);
      const value242 = this._getResolvedDreaminaTaskType(value241),
        dreaminaStyleVideoProvider2 = resolveDreaminaStyleVideoProvider(value241?.model, value241?.provider),
        dreaminaStyleVideoModelForTask2 = ensureDreaminaStyleVideoModelForTask(
          value242,
          value241?.model,
          dreaminaStyleVideoProvider2,
        );
      if (value240 === 'resolution') {
        const resolution5 = normalizeDreaminaStyleVideoResolution(
          value242,
          dreaminaStyleVideoModelForTask2,
          value238,
          dreaminaStyleVideoProvider2,
        );
        return this._commitDreaminaParamValues({ resolution: resolution5 }, value241);
      }
      if (value240 === 'duration') {
        const duration4 = normalizeDreaminaStyleVideoDuration(
          value242,
          dreaminaStyleVideoModelForTask2,
          value238,
          dreaminaStyleVideoProvider2,
        );
        return this._commitDreaminaParamValues({ duration: duration4 }, value241);
      }
      if (value240 === 'aspectRatio') return this._commitDreaminaSchemaAspectRatio(value238, value241);
      return value241;
    }
    ['_normalizeDreaminaNodeData'](value243, value244 = {}) {
      const value245 = value244?.syncStore !== false,
        args20 = this._getDreaminaEffectiveNodeData(value243),
        dreaminaStyleVideoNodeNormalizationPatch = buildDreaminaStyleVideoNodeNormalizationPatch(args20);
      if (!dreaminaStyleVideoNodeNormalizationPatch) return args20;
      const args21 = buildDreaminaStorePatchFromNormalization(
          args20,
          dreaminaStyleVideoNodeNormalizationPatch,
        ),
        value246 = this._getDreaminaEffectiveNodeData({ ...args20, ...args21 }),
        value247 = store.getState().nodes?.[this.nodeId];
      return (
        value245 && value247 && Object.keys(args21).length > 0 && store.updateNodeData(this.nodeId, args21),
        value246
      );
    }
    ['_getDreaminaReferenceSummary'](value248 = this._data) {
      const value249 = store.getIncomingEdges(this.nodeId) || [],
        value250 = store.getState().nodes || {},
        items = [];
      for (const value251 of value249) {
        const response = value250?.[value251.sourceId];
        if (!response) continue;
        const list22 = String(response.type || '');
        let kind = '';
        if (list22.includes('video')) kind = 'video';
        else {
          if (list22.includes('audio')) kind = 'audio';
          else {
            if (list22.includes('image')) kind = 'image';
            else {
              if (list22.includes('text')) kind = 'text';
            }
          }
        }
        if (!kind) continue;
        if (kind === 'image') {
          const enabled21 =
            !!response.thumbId ||
            !!response.thumbUrl ||
            !!response.imageUrl ||
            !!response.src ||
            !!response.localPath;
          if (!enabled21) continue;
        } else {
          if (kind === 'video') {
            const enabled22 =
              (Array.isArray(response.videos) && response.videos.length > 0) ||
              !!response.thumbId ||
              !!response.thumbUrl ||
              !!response.videoUrl ||
              !!response.src ||
              !!response.localPath;
            if (!enabled22) continue;
          } else {
            if (kind === 'audio') {
              const enabled23 = !!response.audioUrl || !!response.src || !!response.localPath;
              if (!enabled23) continue;
            } else {
              if (kind === 'text') {
                const enabled24 = !!String(
                  response.outputText || response.text || response.content || '',
                ).trim();
                if (!enabled24) continue;
              }
            }
          }
        }
        items.push({
          edgeId: String(value251.id || ''),
          sourceId: String(value251.sourceId || ''),
          kind: kind,
          refSlot: String(value251.refSlot || ''),
        });
      }
      const images = items.filter((item28) => item28.kind === 'image'),
        videos = items.filter((item29) => item29.kind === 'video'),
        audios = items.filter((item30) => item30.kind === 'audio'),
        texts = items.filter((item31) => item31.kind === 'text');
      return {
        items: items,
        images: images,
        videos: videos,
        audios: audios,
        texts: texts,
        imageCount: images.length,
        videoCount: videos.length,
        audioCount: audios.length,
        textCount: texts.length,
        signature: items
          .map(
            (item32, value252) =>
              value252 +
              ':' +
              item32.edgeId +
              ':' +
              item32.sourceId +
              ':' +
              item32.kind +
              ':' +
              item32.refSlot,
          )
          .join('|'),
      };
    }
    ['_getResolvedDreaminaTaskType'](value253 = this._data, value254 = null) {
      if (!this._isDreaminaVideoNode(value253)) return '';
      const value255 = this._getDreaminaEffectiveNodeData(value253),
        imageCount = value254 || this._getDreaminaReferenceSummary(value255);
      return resolveDreaminaVideoTaskType({
        routeMode: normalizeDreaminaVideoRouteMode(value255?.dreaminaRouteMode, value255?.mode),
        imageCount: imageCount.imageCount,
        videoCount: imageCount.videoCount,
        audioCount: imageCount.audioCount,
      });
    }
    ['_commitDreaminaSchemaAspectRatio'](value256, value257 = this._data) {
      const nodeData = this._getDreaminaEffectiveNodeData(value257),
        ratioValue = normalizeDreaminaVideoAspectRatio(value256, { preserveAdaptive: true }),
        patch = buildImageSchemaAspectRatioDisplayPatch({
          store: store,
          nodeId: this.nodeId,
          nodeData: nodeData,
          fallbackNodeData: this._data,
          ratioValue: ratioValue,
          minSide: getAIGenerationNodeSize().width,
          inputKinds: ['image', 'video'],
          resultMediaElement: this.videoEl,
          resultFields: ['videos', 'localPath', 'thumbUrl', 'videoUrl', 'src'],
        }),
        args22 = this._buildDreaminaParamPatch(nodeData, { aspectRatio: ratioValue }),
        args23 = { ...patch, ...args22 };
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: nodeData,
          patch: patch,
        }),
        store.updateNodeData(this.nodeId, args23),
        (this._data = this._getDreaminaEffectiveNodeData({ ...nodeData, ...args23 })),
        this._data
      );
    }
    ['_buildModelApiAspectRatioDisplayPatch'](nodeData2, value258, value259, value260 = {}) {
      const enabled25 = String(value258 || '').trim();
      if (!enabled25) return {};
      const value261 = this._resolveModelExecution(nodeData2?.model, nodeData2?.provider);
      if (
        value261?.modelManifest?.kind !== 'video' ||
        value261?.modelManifest?.adapterType !== 'modelApi' ||
        value261?.executionManifest?.adapterType !== 'modelApi'
      )
        return {};
      const list23 = Array.isArray(value261?.modelManifest?.uiSchema?.fields)
          ? value261.modelManifest.uiSchema.fields
          : [],
        value262 = list23.find((item33) => String(item33?.id || '').trim() === enabled25);
      if (enabled25 !== 'aspectRatio' && value262?.displayRole !== 'aspectRatio') return {};
      const plainGenerationParams4 = getPlainGenerationParams(value260?.generationParams),
        value263 = Object.prototype.hasOwnProperty.call(plainGenerationParams4, enabled25)
          ? plainGenerationParams4[enabled25]
          : Object.prototype.hasOwnProperty.call(plainGenerationParams4, 'aspectRatio')
            ? plainGenerationParams4.aspectRatio
            : value259,
        ratioValue2 = String(value263 || '').trim();
      if (!ratioValue2) return {};
      const patch2 = buildImageSchemaAspectRatioDisplayPatch({
        store: store,
        nodeId: this.nodeId,
        nodeData: nodeData2,
        fallbackNodeData: this._data,
        ratioValue: ratioValue2,
        minSide: getAIGenerationNodeSize().width,
        inputKinds: ['image', 'video'],
        resultMediaElement: this.videoEl,
        resultFields: ['videos', 'localPath', 'thumbUrl', 'videoUrl', 'src'],
      });
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: nodeData2,
          patch: patch2,
        }),
        { aspectRatio: ratioValue2, ...patch2 }
      );
    }
    ['_buildRunningHubWorkflowAspectRatioDisplayPatch'](nodeData3, value264, value265, value266 = {}) {
      const enabled26 = String(value264 || '').trim();
      if (!enabled26) return {};
      const value267 = this._resolveModelExecution(nodeData3?.model, nodeData3?.provider);
      if (
        value267?.modelManifest?.kind !== 'video' ||
        value267?.modelManifest?.adapterType !== 'workflow' ||
        value267?.executionManifest?.adapterType !== 'workflow'
      )
        return {};
      const list24 = Array.isArray(value267?.modelManifest?.uiSchema?.fields)
          ? value267.modelManifest.uiSchema.fields
          : [],
        value268 = list24.find((item34) => String(item34?.id || '').trim() === enabled26);
      if (enabled26 !== 'aspectRatio' && value268?.displayRole !== 'aspectRatio') return {};
      const plainGenerationParams5 = getPlainGenerationParams(value266?.generationParams),
        value269 = Object.prototype.hasOwnProperty.call(plainGenerationParams5, enabled26)
          ? plainGenerationParams5[enabled26]
          : Object.prototype.hasOwnProperty.call(plainGenerationParams5, 'aspectRatio')
            ? plainGenerationParams5.aspectRatio
            : value265,
        ratioValue3 = String(value269 || '').trim();
      if (!ratioValue3) return {};
      const patch3 = buildImageSchemaAspectRatioDisplayPatch({
        store: store,
        nodeId: this.nodeId,
        nodeData: nodeData3,
        fallbackNodeData: this._data,
        ratioValue: ratioValue3,
        minSide: getAIGenerationNodeSize().width,
        inputKinds: ['image', 'video'],
        resultMediaElement: this.videoEl,
        resultFields: ['videos', 'localPath', 'thumbUrl', 'videoUrl', 'src'],
      });
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: nodeData3,
          patch: patch3,
        }),
        { aspectRatio: ratioValue3, ...patch3 }
      );
    }
    ['_getDreaminaRatioDisplayState'](value270 = this._data, value271 = null) {
      if (!this._isDreaminaVideoNode(value270)) return null;
      const value272 = value271 || this._syncDreaminaTaskState(value270, { syncStore: false }),
        nodeData4 = value272?.nodeData || value270,
        summary = value272?.summary || this._getDreaminaReferenceSummary(nodeData4),
        resolvedTaskType =
          value272?.resolvedTaskType || this._getResolvedDreaminaTaskType(nodeData4, summary),
        currentModel =
          ensureDreaminaStyleVideoModelForTask(resolvedTaskType, nodeData4?.model, nodeData4?.provider) ||
          normalizeDreaminaStyleVideoModel(nodeData4?.model, nodeData4?.provider),
        currentResolution = normalizeDreaminaStyleVideoResolution(
          resolvedTaskType,
          currentModel,
          nodeData4?.resolution || nodeData4?.videoSize,
          nodeData4?.provider,
        ),
        value273 = String(nodeData4?.aspectRatio || '').trim(),
        currentRatio =
          value273 === '自适应' || value273 === '自适应' || value273 === 'auto'
            ? '自适应'
            : value273 === '5:4'
              ? '4:3'
              : value273 === '4:5'
                ? '3:4'
                : value273
                  ? normalizeDreaminaVideoAspectRatio(value273)
                  : '自适应',
        resolutionOptions = getDreaminaStyleVideoResolutionOptions(
          resolvedTaskType,
          currentModel,
          nodeData4?.provider,
        ),
        hasImageRefs = Number(summary?.imageCount || 0) > 0;
      return {
        nodeData: nodeData4,
        summary: summary,
        resolvedTaskType: resolvedTaskType,
        currentModel: currentModel,
        currentResolution: currentResolution,
        currentRatio: currentRatio,
        resolutionOptions: resolutionOptions,
        hasImageRefs: hasImageRefs,
        ratioLabelText: formatVideoRatioResolutionLabel(currentRatio, currentResolution || '720p'),
        ratioIconLabel: currentRatio,
      };
    }
    ['_syncDreaminaTaskState'](nodeData5 = this._data, value274 = {}) {
      if (!this._isDreaminaVideoNode(nodeData5))
        return {
          nodeData: nodeData5,
          summary: this._getDreaminaReferenceSummary(nodeData5),
          resolvedTaskType: '',
          routeMode: '',
        };
      const syncStore = value274?.syncStore !== false;
      let nodeData6 = this._normalizeDreaminaNodeData(nodeData5, { syncStore: syncStore });
      const imageCount2 = this._getDreaminaReferenceSummary(nodeData6),
        routeMode2 = normalizeDreaminaVideoRouteMode(nodeData6?.dreaminaRouteMode, nodeData6?.mode),
        resolvedTaskType2 = resolveDreaminaVideoTaskType({
          routeMode: routeMode2,
          imageCount: imageCount2.imageCount,
          videoCount: imageCount2.videoCount,
          audioCount: imageCount2.audioCount,
        }),
        value275 = {};
      if (resolvedTaskType2 !== 'multiframe2video') {
        const dreaminaStyleVideoProvider3 = resolveDreaminaStyleVideoProvider(
            nodeData6?.model,
            nodeData6?.provider,
          ),
          dreaminaStyleVideoModelForTask3 = ensureDreaminaStyleVideoModelForTask(
            resolvedTaskType2,
            nodeData6?.model,
            dreaminaStyleVideoProvider3,
          );
        dreaminaStyleVideoModelForTask3 &&
          dreaminaStyleVideoModelForTask3 !== String(nodeData6?.model || '').trim() &&
          (value275.model = dreaminaStyleVideoModelForTask3);
        const dreaminaStyleVideoResolution = normalizeDreaminaStyleVideoResolution(
          resolvedTaskType2,
          dreaminaStyleVideoModelForTask3 || nodeData6?.model,
          nodeData6?.resolution || nodeData6?.videoSize,
          dreaminaStyleVideoProvider3,
        );
        dreaminaStyleVideoResolution &&
          dreaminaStyleVideoResolution !== String(nodeData6?.resolution || '').trim() &&
          (value275.resolution = dreaminaStyleVideoResolution);
        const dreaminaStyleVideoDuration = normalizeDreaminaStyleVideoDuration(
          resolvedTaskType2,
          dreaminaStyleVideoModelForTask3 || nodeData6?.model,
          nodeData6?.duration,
          dreaminaStyleVideoProvider3,
        );
        Number(dreaminaStyleVideoDuration) !== Number(nodeData6?.duration) &&
          (value275.duration = dreaminaStyleVideoDuration);
      }
      if (imageCount2.imageCount <= 0) {
        const dreaminaVideoAspectRatio = normalizeDreaminaVideoAspectRatio(nodeData6?.aspectRatio, {
          preserveAdaptive: true,
        });
        dreaminaVideoAspectRatio !== String(nodeData6?.aspectRatio || '').trim() &&
          String(nodeData6?.aspectRatio || '').trim() &&
          (value275.aspectRatio = dreaminaVideoAspectRatio);
      }
      routeMode2 !== String(nodeData6?.dreaminaRouteMode || '').trim() &&
        (value275.dreaminaRouteMode = routeMode2);
      const dreaminaStyleVideoProvider4 = resolveDreaminaStyleVideoProvider(
        nodeData6?.model,
        nodeData6?.provider,
      );
      String(nodeData6?.provider || '')
        .trim()
        .toLowerCase() !== dreaminaStyleVideoProvider4 && (value275.provider = dreaminaStyleVideoProvider4);
      if (Object.keys(value275).length > 0) {
        const args24 = buildDreaminaStorePatchFromNormalization(nodeData6, value275);
        nodeData6 = this._getDreaminaEffectiveNodeData({ ...nodeData6, ...args24 });
        const value276 = store.getState().nodes?.[this.nodeId];
        syncStore && value276 && store.updateNodeData(this.nodeId, args24);
      }
      return {
        nodeData: nodeData6,
        summary: imageCount2,
        resolvedTaskType: resolvedTaskType2,
        routeMode: routeMode2,
      };
    }
    ['_syncDreaminaPromptPlaceholder'](value277 = this._data) {
      if (!this.promptEl) return;
      const value278 = this.promptEl.dataset || (this.promptEl.dataset = {});
      if (!this._isDreaminaVideoNode(value277)) {
        const value279 = this._resolveModelExecution(value277?.model, value277?.provider);
        value278.placeholder = resolveVideoPromptPlaceholder(value279?.modelManifest, value277);
        return;
      }
      const value280 = this._getDreaminaEffectiveNodeData(value277),
        dreaminaVideoRouteMode2 = normalizeDreaminaVideoRouteMode(
          value280?.dreaminaRouteMode,
          value280?.mode,
        );
      value278.placeholder =
        dreaminaVideoRouteMode2 === 'frames2video'
          ? videoPanelText('dreaminaPrompt.frames2video')
          : videoPanelText('dreaminaPrompt.reference');
    }
    ['_decorateDreaminaFooter'](el46, value281) {
      const value282 = value281 || this._syncDreaminaTaskState(this._data, { syncStore: false }),
        args25 = value282?.nodeData || this._data,
        resolutionOptions2 = this._getDreaminaRatioDisplayState(args25, value282),
        value283 = resolutionOptions2?.resolvedTaskType || value282?.resolvedTaskType || 'text2video',
        dreaminaRouteMode = value282?.routeMode || 'auto',
        value284 =
          resolutionOptions2?.summary || value282?.summary || this._getDreaminaReferenceSummary(args25),
        dreaminaVideoTaskParamVisibility = getDreaminaVideoTaskParamVisibility(value283),
        provider8 = resolveDreaminaStyleVideoProvider(args25?.model, args25?.provider),
        model8 =
          resolutionOptions2?.currentModel ||
          ensureDreaminaStyleVideoModelForTask(value283, args25?.model, provider8) ||
          normalizeDreaminaStyleVideoModel(args25?.model, provider8),
        resolution6 =
          resolutionOptions2?.currentResolution ||
          normalizeDreaminaStyleVideoResolution(
            value283,
            model8,
            args25?.resolution || args25?.videoSize,
            provider8,
          ),
        aspectRatio3 =
          resolutionOptions2?.currentRatio || normalizeDreaminaVideoAspectRatio(args25?.aspectRatio),
        duration5 = normalizeDreaminaStyleVideoDuration(value283, model8, args25?.duration, provider8),
        durationRange = getDreaminaStyleVideoDurationRange(value283, model8, provider8),
        el47 = el46.querySelector('.img-model-pills'),
        el48 = el46.querySelector('.img-model-wrap'),
        value285 = el46.querySelector('.img-model-btn-trigger'),
        el49 = el46.querySelector('.img-model-label'),
        el50 = el46.querySelector('.img-model-menu');
      if (el48) el48.hidden = false;
      el49 && (el49.textContent = getDreaminaProviderLabel(provider8));
      if (value285) {
        const value286 = this._getModelIconHTML(model8, provider8),
          value287 = value285.firstElementChild;
        if (value287) value287.outerHTML = value286;
        else value285.insertAdjacentHTML('afterbegin', value286);
      }
      el50?.querySelectorAll('.floating-menu-item').forEach((el51) => {
        const value288 = String(el51.dataset.value || '').trim(),
          value289 = String(el51.dataset.provider || '')
            .trim()
            .toLowerCase(),
          value290 =
            provider8 === 'dreamina'
              ? value289 === 'dreamina' || value288 === 'dreamina/text2video'
              : provider8 === 'apimart'
                ? value289 === 'apimart' && isApimartDreaminaVideoModel(value288, value289)
                : value289 === provider8 && isDreaminaStyleVideoModel(value288, value289);
        el51.classList.toggle('active', value290);
      });
      let el52 = el46.querySelector('.dreamina-task-model-wrap');
      !el52 &&
        ((el52 = document.createElement('div')),
        (el52.className = 'dreamina-task-model-wrap'),
        (el52.innerHTML =
          '\n        <button type="button" class="img-pill-btn dreamina-task-model-btn">\n          <span class="dreamina-task-model-label"></span>\n        </button>\n        <div class="floating-menu dreamina-task-model-menu"></div>\n      '),
        el48?.insertAdjacentElement('afterend', el52));
      const el53 = el52.querySelector('.dreamina-task-model-btn'),
        el54 = el52.querySelector('.dreamina-task-model-label'),
        el55 = el52.querySelector('.dreamina-task-model-menu'),
        dreaminaTaskModelMenuMeta = getDreaminaTaskModelMenuMeta(model8, provider8);
      el54 &&
        (el54.textContent =
          dreaminaTaskModelMenuMeta?.title ||
          getDisplayModelName(model8 || getDreaminaStyleVideoDefaultModel(value283, provider8)));
      el55 && (el55.innerHTML = buildDreaminaTaskModelMenuHtml(model8, value283, provider8));
      const value291 =
        !isDreaminaVideoRouteModeEnabled(dreaminaRouteMode) ||
        getDreaminaTaskModelMenuItems(value283, provider8).length <= 0;
      el53 && (el53.disabled = value291);
      (el46.querySelector('.img-ratio-wrap')?.remove(),
        el46.querySelector('.vid-mode-wrap')?.remove(),
        el46.querySelector('.vid-duration-wrap')?.remove(),
        el46.querySelectorAll('[data-dreamina-video-param-schema]').forEach((el56) => el56.remove()));
      const value292 = this._getDreaminaEffectiveNodeData({
          ...args25,
          provider: provider8,
          model: model8,
          generationParams: {
            ...getPlainGenerationParams(args25?.generationParams),
            dreaminaRouteMode: dreaminaRouteMode,
            aspectRatio: aspectRatio3,
            duration: duration5,
            ...(resolution6 ? { resolution: resolution6 } : {}),
          },
        }),
        dreaminaParamSchemaFields = buildDreaminaParamSchemaFields({
          routeMode: dreaminaRouteMode,
          currentRatio: aspectRatio3,
          currentResolution: resolution6,
          currentDuration: duration5,
          durationRange: durationRange,
          resolutionOptions: resolutionOptions2?.resolutionOptions || [],
        }),
        handler11 = (value293, list25, args26 = {}) => {
          if (!list25.length) return null;
          const renderUiSchemaFields2 = renderUiSchemaFields(list25, value292, {
            sourceId: 'dreamina-video-normal-params',
            ...args26,
          });
          if (!renderUiSchemaFields2) return null;
          const el57 = document.createElement('div');
          return (
            (el57.className = 'ui-schema-placement ' + value293),
            (el57.dataset.dreaminaVideoParamSchema = '1'),
            (el57.innerHTML = renderUiSchemaFields2),
            el57
          );
        },
        value294 = dreaminaVideoTaskParamVisibility.mode
          ? handler11('dreamina-video-mode-schema', [dreaminaParamSchemaFields.mode])
          : null,
        value295 = dreaminaVideoTaskParamVisibility.ratio
          ? handler11(
              'dreamina-video-ratio-schema',
              [dreaminaParamSchemaFields.resolution, dreaminaParamSchemaFields.aspectRatio],
              {
                placement: 'resolution',
              },
            )
          : null,
        value296 = dreaminaVideoTaskParamVisibility.duration
          ? handler11('dreamina-video-duration-schema', [dreaminaParamSchemaFields.duration])
          : null;
      if (el47) {
        const list26 = [el48, el52, value294, value295, value296].filter(Boolean);
        list26.forEach((item35) => el47.appendChild(item35));
      }
      this._syncDreaminaPromptPlaceholder(value292);
    }
    ['_resolveModelExecution'](value297, providerHint5) {
      return (
        resolveModelExecution(value297, { providerHint: providerHint5 }) ||
        resolveModelExecution(value297) ||
        null
      );
    }
    ['_getModelProviderId'](value298, value299) {
      const value300 = this._resolveModelExecution(value298, value299),
        providerId = normalizeProviderId(value300?.modelManifest?.provider);
      if (providerId) return providerId;
      return resolveModelProvider(value298, value299, { allowPrefixInference: false }) || null;
    }
    ['_isRunninghubWorkflowModel'](value301, value302) {
      const value303 = this._resolveModelExecution(value301, value302);
      return (
        normalizeProviderId(value303?.modelManifest?.provider) === 'runninghubwf' &&
        value303?.modelManifest?.adapterType === 'workflow' &&
        value303?.executionManifest?.adapterType === 'workflow'
      );
    }
    ['_getModelIconHTML'](value304, value305) {
      const value306 = this._resolveModelExecution(value304, value305),
        value307 = this._getModelProviderId(value304, value305);
      if (value307 === 'apimart') return buildApimartVideoLogoHTML(12);
      if (value307 === 'volcengine') return buildVolcengineVideoLogoHTML(12);
      if (value307 === 'dreamina' || value306?.modelManifest?.extensions?.dreaminaStyleVideo)
        return buildDreaminaVideoLogoHTML(12);
      const value308 = value307 ? PROVIDERS_META?.[value307]?.logoPath : null;
      if (value308) return '<img src="' + value308 + '" class="node-menu-icon-small" alt="' + value307 + '">';
      return '<div class="node-menu-icon-small node-menu-icon-badge video-model-fallback-icon">VM</div>';
    }
    ['_getModelParamVisibility'](value309, value310) {
      if (isDreaminaStyleVideoModel(value309, value310)) {
        const value311 = this._getResolvedDreaminaTaskType();
        return getDreaminaVideoTaskParamVisibility(value311);
      }
      const value312 = this._getModelProviderId(value309, value310);
      if (value312 === 'runninghub' || value312 === 'runninghubwf')
        return { ratio: true, mode: false, duration: false };
      return { ratio: true, mode: true, duration: true };
    }
    ['_getRatioIconHTML'](value313) {
      if (value313 === '自适应')
        return '<svg class="video-ratio-auto-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>';
      const value314 = {
          '1:1': 'img-rp-sq',
          '9:16': 'img-rp-tall',
          '16:9': 'img-rp-wide',
          '3:4': 'img-rp-p34',
          '4:3': 'img-rp-l43',
          '3:2': 'img-rp-l32',
          '2:3': 'img-rp-p23',
          '5:4': 'img-rp-l54',
          '4:5': 'img-rp-p45',
          '21:9': 'img-rp-ultra',
        },
        value315 = value314[value313] || 'img-rp-sq';
      return '<span class="img-rp-icon video-ratio-icon ' + value315 + '"></span>';
    }
    ['_updateSubmitButtonState']() {
      if (!this.btnEl) return;
      const value316 = typeof store.getState === 'function' ? store.getState() : {},
        nodes6 = value316?.nodes || {},
        inEdges2 = typeof store.getIncomingEdges === 'function' ? store.getIncomingEdges(this.nodeId) : [],
        value317 = nodes6?.[this.nodeId] || this._data || {},
        cancellable = this._isRunninghubWorkflowModel(value317?.model, value317?.provider),
        el58 = resolveGenerationButtonMode(value317, {
          cancellable: cancellable,
          cancelInFlight: this._rhCancelInFlight === true,
        });
      if (el58.busy) {
        if (cancellable) {
          const title = getVideoCancelTooltip();
          setGenerateButtonCancellableUi(this.btnEl, {
            title: title,
            tooltip: title,
            ariaLabel: videoPanelText('cancelGenerateAria'),
            color: 'var(--red)',
            busy: true,
          });
        } else {
          const title2 = getVideoGenerateTitle();
          setGenerateButtonLoadingUi(this.btnEl, { title: title2, disabled: true, ariaLabel: title2 });
        }
        ((this.btnEl.disabled = el58.disabled), (this.btnEl.style.cursor = el58.cursor));
        return;
      }
      resetGenerateButtonIdleUi(this.btnEl, getVideoGenerateTitle());
      const promptTextWithTextRefs = resolvePromptTextWithTextRefs({
        promptEl: this.promptEl,
        inEdges: inEdges2,
        nodes: nodes6,
      });
      if (this._isDreaminaVideoNode(value317)) {
        const value318 = this._syncDreaminaTaskState(value317, { syncStore: true });
        this._data = value318.nodeData || this._data;
        const imageCount3 = value318.summary || this._getDreaminaReferenceSummary(),
          taskType2 = value318.resolvedTaskType || this._getResolvedDreaminaTaskType(),
          routeMode3 = value318.routeMode || 'multimodal2video';
        if (!isDreaminaVideoRouteModeEnabled(routeMode3)) {
          ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'));
          return;
        }
        const validateDreaminaVideoRouteSelection2 = validateDreaminaVideoRouteSelection({
          routeMode: routeMode3,
          taskType: taskType2,
          imageCount: imageCount3.imageCount,
          videoCount: imageCount3.videoCount,
          audioCount: imageCount3.audioCount,
        });
        let enabled27 = !validateDreaminaVideoRouteSelection2;
        if (enabled27) {
          if (taskType2 === 'text2video') enabled27 = !!promptTextWithTextRefs;
          else {
            if (taskType2 === 'image2video')
              enabled27 = !!promptTextWithTextRefs && imageCount3.imageCount === 1;
            else {
              if (taskType2 === 'frames2video')
                enabled27 = !!promptTextWithTextRefs && imageCount3.imageCount === 2;
              else {
                if (taskType2 === 'multiframe2video') enabled27 = false;
                else
                  taskType2 === 'multimodal2video' &&
                    (enabled27 = imageCount3.imageCount > 0 || imageCount3.videoCount > 0);
              }
            }
          }
        }
        ((this.btnEl.disabled = !enabled27),
          (this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : ''));
        return;
      }
      const enabled28 = !!inEdges2.length;
      if (isHappyHorsePanelModel(value317)) {
        ((this.btnEl.disabled = !promptTextWithTextRefs),
          (this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : ''));
        return;
      }
      const fixedInputConfig = getFixedInputSlotConfigFromManifest(this._data || {}),
        list27 = (fixedInputConfig?.fixedSlots || []).filter((item36) => item36?.required === true),
        list28 = (fixedInputConfig?.exclusiveGroups || []).filter(
          (item37) => item37?.required === true || Number(item37?.min || 0) > 0,
        );
      if (list27.length > 0 || list28.length > 0) {
        const nodeData7 = nodes6?.[this.nodeId] || this._data || {},
          occupiedSlots = new Set(),
          map3 = new Set(fixedInputConfig.visibleSlots || []);
        for (const refSlot of inEdges2) {
          const sourceNode = nodes6[refSlot.sourceId];
          if (!sourceNode) continue;
          const kind2 = resolveEffectiveInputKind(sourceNode, refSlot),
            { slot: slot } = resolveFixedInputSlotForRef({
              fixedInputConfig: fixedInputConfig,
              refSlot: refSlot?.refSlot,
              kind: kind2,
              occupiedSlots: occupiedSlots,
              sourceNode: sourceNode,
            });
          if (slot && map3.has(slot)) occupiedSlots.add(slot);
        }
        const fixedInputAssetSlotMap = buildFixedInputAssetSlotMap(this.promptEl, {
            slotOrderByType: fixedInputConfig.slotOrderByType,
            visibleSlots: fixedInputConfig.visibleSlots,
            exclusiveGroups: fixedInputConfig.exclusiveGroups,
            slotById: fixedInputConfig.slotById,
            occupiedSlots: occupiedSlots,
            nodeData: nodeData7,
          }),
          value319 = list27.every((item38) => {
            const enabled29 = String(item38?.id || '').trim();
            return !!enabled29 && (occupiedSlots.has(enabled29) || !!fixedInputAssetSlotMap[enabled29]);
          }),
          value320 = list28.every((item39) => {
            const list29 = Array.isArray(item39?.slots) ? item39.slots : [];
            return list29.some((item40) => occupiedSlots.has(item40) || !!fixedInputAssetSlotMap[item40]);
          }),
          enabled30 = value319 && value320;
        ((this.btnEl.disabled = !enabled30),
          (this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : ''));
        return;
      }
      ((this.btnEl.disabled = cancellable ? false : !promptTextWithTextRefs && !enabled28),
        (this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : ''));
    }
  }
  return value67.prototype;
}
