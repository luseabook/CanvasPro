import { renderOpenAiLogoHtml } from '../shared/openAiLogo.js';
import {
  renderComfyUiCloudWorkflowLogoHtml,
  renderComfyUiLocalWorkflowLogoHtml,
  renderComfyUiWorkflowLogoHtmlFromIconKind,
} from '../shared/customAiAppLogo.js';
import { isModelManifestPubliclyListed } from '../../manifests/modelCatalogVisibility.js';
import {
  NANO_BANANA_FAMILIES,
  getDefaultModeForNanoBananaFamily,
  getNanoBananaModeOptions,
  isNanoBananaFamily,
  resolveNanoBananaModelBySelection,
  resolveNanoBananaSelectionFromModel,
} from '../../modules/nanoBananaModeRules.js';
import { getDreaminaImageMenuGroupHTML, getDreaminaImageTriggerIconHTML } from './dreaminaModelMenuHelper.js';
import {
  isRunningHubGptImage2OfficialModel,
  normalizeImageSizeForProviderModel,
} from '../../modules/imageModelCapabilities.js';
import { AI_GENERATION_NODE_SHORT_SIDE } from '../../services/fileService.js';
import {
  getAllowedRatiosForProviderModel,
  pickClosestRatioForProviderModel,
} from '../../../api/imageRatioPolicy.js';
import {
  getGenerationRatioSizeWithDom,
  pickGenerationRatioSourceEdge,
} from '../../modules/generationRatioSource.js';
import {
  ANIME_REAL_MODEL_ID,
  PERSON_REPLACE_V21_MODEL_ID,
  PERSON_REPLACE_V3_MODEL_ID,
  QWEN_IMAGE_EDIT_MODEL_ID,
  getModelsByKind,
  getModelManifest,
  resolveModelExecution,
  resolveModelProvider,
} from '../../manifests/index.js';
import { renderNodeMenuGroup, renderNodeMenuItem } from '../shared/nodeModelMenu.js';
import { t } from '../../i18n/index.js';
export const AI_IMAGE_MIN_SIZE = 150;
export const GRSAI_GPT_IMAGE_2_MODEL = 'gpt-image-2';
const GRSAI_GPT_IMAGE_2_VIP_MODEL = 'gpt-image-2-vip';
export const APIMART_GPT_IMAGE_2_MODEL = 'apimart/gpt-image-2';
export const APIMART_QWEN_IMAGE_MODEL = 'apimart/qwen-image-2.0';
export const APIMART_Z_IMAGE_TURBO_MODEL = 'apimart/z-image-turbo';
export const APIMART_WAN_IMAGE_MODEL = 'apimart/wan2.7-image';
export const VOLCENGINE_SEEDREAM_5_MODEL = 'volcengine/seedream-5.0';
export const VOLCENGINE_SEEDREAM_4_5_MODEL = 'volcengine/seedream-4.5';
export const VOLCENGINE_SEEDREAM_4_MODEL = 'volcengine/seedream-4.0';
export const RH_ANIME_REAL_MODEL = ANIME_REAL_MODEL_ID;
const GRSAI_IMAGE_MENU_ICON_HTML =
    '<img src="images/grsai.png" class="node-menu-icon node-menu-icon-padded" alt="grsai">',
  AGNES_BADGE_ICON_HTML =
    '<div class="node-menu-icon node-menu-icon-badge node-menu-icon-badge-dark">AG</div>',
  VOLCENGINE_IMAGE_MENU_ICON_HTML =
    '<img src="images/volcengine.svg" class="node-menu-icon" alt="volcengine">';
function getDefaultImagePromptPlaceholder() {
  return t('aigenImage.prompt.placeholder');
}
function normalizeGrsaiModelToken(value) {
  let list = String(value || '')
    .trim()
    .toLowerCase();
  return (list.startsWith('grsai/') && (list = list.slice('grsai/'.length).trim()), list);
}
function isAdvancedModeEnabled() {
  return typeof window !== 'undefined' && window.ADVANCED_MODE === true;
}
function getManifestUiField(item, key) {
  const list2 = getModelManifest(item)?.uiSchema?.fields;
  return Array.isArray(list2) ? list2.find((item2) => item2?.id === key) || null : null;
}
function pickNearestNumber(index, result, data) {
  const list3 = (Array.isArray(result) ? result : []).map((item3) => Number(item3)).filter(Number.isFinite);
  if (list3.length === 0) return data;
  const options = Number(index);
  if (!Number.isFinite(options)) return data;
  return list3.reduce(
    (item4, target) => (Math.abs(target - options) < Math.abs(item4 - options) ? target : item4),
    list3[0],
  );
}
export function isGrsaiGptImage2ModelToken(source) {
  const grsaiModelToken = normalizeGrsaiModelToken(source);
  return grsaiModelToken === GRSAI_GPT_IMAGE_2_MODEL || grsaiModelToken === GRSAI_GPT_IMAGE_2_VIP_MODEL;
}
export function isGrsaiGptImage2Selection(next, current) {
  const enabled = String(next || '')
      .trim()
      .toLowerCase(),
    list4 = String(current || '')
      .trim()
      .toLowerCase(),
    grsaiModelToken2 = normalizeGrsaiModelToken(list4);
  if (!isGrsaiGptImage2ModelToken(grsaiModelToken2)) return false;
  return enabled === 'grsai' || list4.startsWith('grsai/') || (!enabled && !list4.includes('/'));
}
export function isApimartGptImage2Selection(entry, record) {
  const payload = String(entry || '')
      .trim()
      .toLowerCase(),
    handle = String(record || '')
      .trim()
      .toLowerCase();
  return (
    handle === APIMART_GPT_IMAGE_2_MODEL || (payload === 'apimart' && handle === GRSAI_GPT_IMAGE_2_MODEL)
  );
}
export function isRunningHubGptImage2Selection(state, config) {
  const scope = String(state || '')
      .trim()
      .toLowerCase(),
    nanoBananaSelectionFromModel = resolveNanoBananaSelectionFromModel(config, '2K', scope || 'runninghub');
  return (
    nanoBananaSelectionFromModel?.provider === 'runninghub' &&
    nanoBananaSelectionFromModel.family === NANO_BANANA_FAMILIES.GPT_IMAGE_2
  );
}
export function getImageSizeCapabilityProvider(input, output) {
  return isGrsaiGptImage2Selection(input, output) ? 'grsai' : input;
}
export function getEffectiveImageSizeForUi(value2, value3, value4) {
  const value5 = String(value4 || '').trim();
  if (value5) return value5.toUpperCase();
  return isGrsaiGptImage2Selection(value2, value3) ? '1K' : '2K';
}
function isAdaptiveImageRatio(value6) {
  const enabled2 = String(value6 || '').trim(),
    value7 = enabled2.toLowerCase();
  return !enabled2 || enabled2 === '自适应' || value7 === 'auto' || value7 === 'adaptive';
}
export function isAdaptiveImageAspectRatioValue(value8) {
  return isAdaptiveImageRatio(value8);
}
export function parseImageDisplayAspectRatio(value9) {
  if (isAdaptiveImageRatio(value9)) return null;
  const value10 = String(value9 || '')
      .trim()
      .replace(/[：∶﹕]/g, ':')
      .replace(/\s+/g, ''),
    enabled3 = value10.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!enabled3) return null;
  const width2 = Number.parseFloat(enabled3[1]),
    height2 = Number.parseFloat(enabled3[2]);
  if (!Number.isFinite(width2) || !Number.isFinite(height2)) return null;
  if (width2 <= 0 || height2 <= 0) return null;
  return { width: width2, height: height2, label: width2 + ':' + height2 };
}
export function buildImageDisplayRatioResizePatch({
  nodeData: nodeData = {},
  ratioValue: ratioValue = '',
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
} = {}) {
  const box = parseImageDisplayAspectRatio(ratioValue);
  if (!box) return {};
  const value11 = Math.max(1, Math.round(Number(minSide) || AI_GENERATION_NODE_SHORT_SIDE)),
    value12 = Math.max(1, Math.round(Number(nodeData?.width) || value11)),
    value13 = Math.max(1, Math.round(Number(nodeData?.height) || value11)),
    value14 = Number.isFinite(Number(nodeData?.x)) ? Number(nodeData.x) : 0,
    value15 = Number.isFinite(Number(nodeData?.y)) ? Number(nodeData.y) : 0;
  let width3, height3;
  box.width >= box.height
    ? ((height3 = value11), (width3 = Math.round((box.width / box.height) * value11)))
    : ((width3 = value11), (height3 = Math.round((box.height / box.width) * value11)));
  if (width3 === value12 && height3 === value13) return {};
  const value16 = width3 - value12,
    value17 = height3 - value13;
  return {
    width: width3,
    height: height3,
    x: Math.round(value14 - value16 / 2),
    y: Math.round(value15 - value17),
  };
}
function getPlainSchemaParams(args) {
  return args && typeof args === 'object' && !Array.isArray(args) ? { ...args } : {};
}
function getImageSizeForRatioDisplay(options2 = {}, value18 = {}) {
  const value19 = options2 || {},
    value20 = value18 || {},
    plainSchemaParams = getPlainSchemaParams(value19.generationParams);
  return getEffectiveImageSizeForUi(
    value19.provider || value20.provider,
    value19.model || value20.model,
    plainSchemaParams.imageSize || value19.imageSize,
  );
}
function pickClosestRatioLabelForDisplay({
  nodeData: nodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  width: width4,
  height: height4,
} = {}) {
  const width5 = Number(width4) || 0,
    height5 = Number(height4) || 0;
  if (width5 <= 0 || height5 <= 0) return null;
  return pickClosestRatioForProviderModel({
    provider: nodeData?.provider || fallbackNodeData?.provider,
    model: nodeData?.model || fallbackNodeData?.model,
    width: width5,
    height: height5,
    imageSize: getImageSizeForRatioDisplay(nodeData, fallbackNodeData),
  });
}
function getMediaSizeForRatioDisplay(nodeId, nodeData2, edge = null, mediaSelector2 = 'img, video') {
  return (
    getGenerationRatioSizeWithDom({
      nodeId: nodeId,
      nodeData: nodeData2,
      edge: edge,
      mediaSelector: mediaSelector2,
      includeNodeFrame: true,
    }) || { width: 0, height: 0 }
  );
}
function isAcceptedRatioInputKind(value21, value22, map, handler) {
  const list5 = String(value21?.refSlot || '').toLowerCase();
  if (list5.includes('mask')) return false;
  const value23 = value22?.[value21?.sourceId],
    value24 = String(value23?.type || ''),
    value25 = typeof handler === 'function' ? handler(value24) : '';
  if (value25 && map.has(value25)) return true;
  const value26 = value24.toLowerCase();
  return Array.from(map).some(
    (item5) => value26 === item5 || value26 === 'source-' + item5 || value26 === 'ai-' + item5,
  );
}
export function resolveImageSchemaAdaptiveRatioDisplayValue({
  store: store,
  nodeId: nodeId2,
  nodeData: nodeData3,
  fallbackNodeData: fallbackNodeData2,
  getRefKindByNodeType: getRefKindByNodeType,
  inputKinds: inputKinds = ['image'],
  resultMediaElement: resultMediaElement = null,
  resultFields: resultFields = [
    'images',
    'localPath',
    'thumbUrl',
    'imageUrl',
    'sourceUrl',
    'thumbId',
    'sourceId',
  ],
  mediaSelector: mediaSelector = 'img, video',
} = {}) {
  const value27 = store?.getState?.() || {},
    value28 = value27.nodes || {},
    nodeData4 = nodeData3 || value28?.[nodeId2] || fallbackNodeData2 || {},
    value29 = new Set(
      (Array.isArray(inputKinds) ? inputKinds : ['image'])
        .map((item6) => String(item6 || '').trim())
        .filter(Boolean),
    ),
    list6 = typeof store?.getIncomingEdges === 'function' ? store.getIncomingEdges(nodeId2) : [],
    list7 = list6.filter((item7) => isAcceptedRatioInputKind(item7, value28, value29, getRefKindByNodeType));
  if (list7.length > 0) {
    const generationRatioSourceEdge = pickGenerationRatioSourceEdge(list7, nodeData4),
      value30 = value28?.[generationRatioSourceEdge?.sourceId],
      width6 = getMediaSizeForRatioDisplay(
        generationRatioSourceEdge?.sourceId,
        value30,
        generationRatioSourceEdge,
        mediaSelector,
      );
    return (
      pickClosestRatioLabelForDisplay({
        nodeData: nodeData4,
        fallbackNodeData: fallbackNodeData2,
        width: width6.width,
        height: width6.height,
      }) || '1:1'
    );
  }
  const value31 = resultFields.some((item8) => {
    const list8 = nodeData4?.[item8];
    return Array.isArray(list8) ? list8.length > 0 : Boolean(list8);
  });
  if (value31) {
    const width7 =
        resultMediaElement?.naturalWidth || resultMediaElement?.videoWidth || Number(nodeData4?.width) || 0,
      height6 =
        resultMediaElement?.naturalHeight ||
        resultMediaElement?.videoHeight ||
        Number(nodeData4?.height) ||
        0;
    return (
      pickClosestRatioLabelForDisplay({
        nodeData: nodeData4,
        fallbackNodeData: fallbackNodeData2,
        width: width7,
        height: height6,
      }) || '1:1'
    );
  }
  return '1:1';
}
export function buildImageSchemaAspectRatioDisplayPatch({
  store: store2,
  nodeId: nodeId3,
  nodeData: nodeData5,
  fallbackNodeData: fallbackNodeData3,
  ratioValue: ratioValue = '',
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: getRefKindByNodeType2,
  inputKinds: inputKinds2,
  resultMediaElement: resultMediaElement2,
  resultFields: resultFields2,
  mediaSelector: mediaSelector3,
} = {}) {
  const enabled4 = store2?.getState?.().nodes?.[nodeId3];
  if (!enabled4 && !nodeData5 && !fallbackNodeData3) return {};
  const nodeData6 = nodeData5 || enabled4 || fallbackNodeData3 || {},
    ratioValue2 = isAdaptiveImageAspectRatioValue(ratioValue)
      ? resolveImageSchemaAdaptiveRatioDisplayValue({
          store: store2,
          nodeId: nodeId3,
          nodeData: nodeData6,
          fallbackNodeData: fallbackNodeData3,
          getRefKindByNodeType: getRefKindByNodeType2,
          inputKinds: inputKinds2,
          resultMediaElement: resultMediaElement2,
          resultFields: resultFields2,
          mediaSelector: mediaSelector3,
        })
      : ratioValue;
  return buildImageDisplayRatioResizePatch({
    nodeData: nodeData6,
    ratioValue: ratioValue2,
    minSide: minSide,
  });
}
export function armImageSchemaRatioResizeAnimation(enabled5, value32, value33 = 280) {
  const el = typeof document !== 'undefined' ? document.getElementById(value32) : null;
  if (!el || !enabled5) return;
  el.classList.add('is-ratio-animating');
  if (enabled5._ratioAnimTimer) clearTimeout(enabled5._ratioAnimTimer);
  enabled5._ratioAnimTimer = setTimeout(() => {
    const el2 = typeof document !== 'undefined' ? document.getElementById(value32) : null;
    (el2?.classList.remove('is-ratio-animating'), (enabled5._ratioAnimTimer = null));
  }, value33 + 80);
}
export function animateImageSchemaRatioResizeFlip(
  enabled6,
  { nodeId: nodeId4, previewEl: previewEl, nodeData: nodeData7, patch: patch, ms: ms = 280 } = {},
) {
  if (!enabled6 || !previewEl || typeof previewEl.animate !== 'function') return;
  const value34 = Math.max(1, Number(nodeData7?.width) || Number(patch?.width) || 1),
    value35 = Math.max(1, Number(nodeData7?.height) || Number(patch?.height) || 1),
    value36 = Math.max(1, Number(patch?.width) || value34),
    value37 = Math.max(1, Number(patch?.height) || value35);
  if (value34 === value36 && value35 === value37) return;
  const value38 = value34 / value36,
    value39 = value35 / value37,
    transform = 'scaleX(' + value38 + ') scaleY(' + value39 + ')',
    handler2 = () => {
      ((enabled6._ratioFlipAnim = null),
        (previewEl.style.transformOrigin = ''),
        (previewEl.style.transform = ''));
    };
  if (enabled6._ratioFlipAnim) enabled6._ratioFlipAnim.cancel();
  ((previewEl.style.transition = 'none'),
    (previewEl.style.transformOrigin = 'bottom center'),
    (previewEl.style.transform = transform),
    void previewEl.offsetWidth);
  const value40 = () => {
    if (typeof document !== 'undefined' && !document.getElementById(nodeId4)) {
      handler2();
      return;
    }
    ((enabled6._ratioFlipAnim = previewEl.animate([{ transform: transform }, { transform: 'none' }], {
      duration: ms,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards',
    })),
      (enabled6._ratioFlipAnim.onfinish = handler2),
      (enabled6._ratioFlipAnim.oncancel = handler2));
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(value40);
  else setTimeout(value40, 0);
}
export function applyImageSchemaRatioResizeAnimation(
  value41,
  { nodeId: nodeId5, previewEl: previewEl2, nodeData: nodeData8, patch: patch2, ms: ms = 280 } = {},
) {
  if (!patch2 || Object.keys(patch2).length === 0) return;
  (armImageSchemaRatioResizeAnimation(value41, nodeId5, ms),
    animateImageSchemaRatioResizeFlip(value41, {
      nodeId: nodeId5,
      previewEl: previewEl2,
      nodeData: nodeData8,
      patch: patch2,
      ms: ms,
    }));
}
export function normalizeQwenImageEditMode(value42) {
  const value43 = String(value42 || '')
    .trim()
    .toLowerCase();
  return value43 === 'qwen2509' || value43 === 'qwen-edit2509' || value43 === '2509' || value43 === '0'
    ? 'qwen2509'
    : 'qwen2511';
}
export function getQwenImageEditModeLabel(value44) {
  return normalizeQwenImageEditMode(value44) === 'qwen2509' ? '2509' : '2511';
}
export function getQwenImageEditModeTooltip(value45) {
  const qwenImageEditMode = normalizeQwenImageEditMode(value45),
    qwenUiFieldOptions = getQwenUiFieldOptions('rhQwenEditMode').find(
      (el3) => el3.value === qwenImageEditMode,
    );
  if (qwenUiFieldOptions?.tooltip) return qwenUiFieldOptions.tooltip;
  return qwenImageEditMode === 'qwen2509'
    ? t('aigenImage.qwen.versionTooltips.qwen2509')
    : t('aigenImage.qwen.versionTooltips.qwen2511');
}
export function normalizeQwenFirstImageMode(value46) {
  const value47 = String(value46 || '')
    .trim()
    .toLowerCase();
  if (value47 === 'pose' || value47 === '1' || value47 === '姿势图') return 'pose';
  if (value47 === 'depth' || value47 === '2' || value47 === '深度图') return 'depth';
  return 'original';
}
export function getQwenFirstImageModeLabel(value48) {
  const qwenFirstImageMode = normalizeQwenFirstImageMode(value48),
    qwenUiFieldOptions2 = getQwenUiFieldOptions('rhQwenFirstImageMode').find(
      (el4) => el4.value === qwenFirstImageMode,
    );
  if (qwenUiFieldOptions2?.label) return qwenUiFieldOptions2.label;
  if (qwenFirstImageMode === 'pose') return t('aigenImage.qwen.firstImageModes.pose');
  if (qwenFirstImageMode === 'depth') return t('aigenImage.qwen.firstImageModes.depth');
  return t('aigenImage.qwen.firstImageModes.original');
}
function getQwenModelManifest() {
  return getModelManifest(QWEN_IMAGE_EDIT_MODEL_ID);
}
function getQwenUiField(value49) {
  const list9 = getQwenModelManifest()?.uiSchema?.fields;
  return Array.isArray(list9) ? list9.find((item9) => item9?.id === value49) || null : null;
}
function getQwenUiFieldOptions(value50) {
  const qwenUiField = getQwenUiField(value50)?.options;
  return Array.isArray(qwenUiField) ? qwenUiField : [];
}
export function getQwenImageEditModelManifest() {
  return getQwenModelManifest();
}
export function getQwenFirstImageModeOptions() {
  const list10 = getQwenUiFieldOptions('rhQwenFirstImageMode');
  return list10.length
    ? list10
    : [
        { value: 'original', label: t('aigenImage.qwen.firstImageModes.original') },
        { value: 'pose', label: t('aigenImage.qwen.firstImageModes.pose') },
        { value: 'depth', label: t('aigenImage.qwen.firstImageModes.depth') },
      ];
}
export function getPersonReplaceV21ResolutionOptions() {
  const manifestUiField = getManifestUiField(PERSON_REPLACE_V21_MODEL_ID, 'rhResolution'),
    args2 = Array.isArray(manifestUiField?.options) ? manifestUiField.options : [],
    args3 =
      isAdvancedModeEnabled() && Array.isArray(manifestUiField?.advancedOptions)
        ? manifestUiField.advancedOptions
        : [];
  return [...args2, ...args3].map((item10) => Number(item10)).filter(Number.isFinite);
}
export function normalizePersonReplaceV21Resolution(value51) {
  const manifestUiField2 = getManifestUiField(PERSON_REPLACE_V21_MODEL_ID, 'rhResolution'),
    personReplaceV21ResolutionOptions = getPersonReplaceV21ResolutionOptions(),
    value52 = Number(manifestUiField2?.defaultValue) || 1280;
  return pickNearestNumber(value51, personReplaceV21ResolutionOptions, value52);
}
export function buildRunningHubGptImage2OfficialPatch({
  provider: provider = '',
  model: model = '',
  imageSize: imageSize = '',
  aspectRatio: aspectRatio = '',
} = {}) {
  if (!isRunningHubGptImage2OfficialModel(model, provider)) return {};
  const imageSize2 = normalizeImageSizeForProviderModel({
      model: model,
      provider: provider,
      imageSize: imageSize,
    }),
    value53 = {},
    value54 = String(imageSize || '')
      .trim()
      .toUpperCase();
  imageSize2 && imageSize2 !== value54 && (value53.imageSize = imageSize2);
  if (!isAdaptiveImageRatio(aspectRatio)) {
    const ratioLabel = String(aspectRatio || '')
        .trim()
        .replace(/[：∶]/g, ':')
        .replace(/\s+/g, ''),
      map2 = new Set(
        getAllowedRatiosForProviderModel(provider, model, imageSize2).map((item11) => item11.label),
      );
    ratioLabel &&
      !map2.has(ratioLabel) &&
      (value53.aspectRatio = pickClosestRatioForProviderModel({
        provider: provider,
        model: model,
        ratioLabel: ratioLabel,
        imageSize: imageSize2,
      }));
  }
  return value53;
}
export function getImagePromptPlaceholderForModel(value55) {
  const providerHint = resolveModelProvider(value55),
    modelManifest =
      getModelManifest(value55) ||
      resolveModelExecution(value55, { providerHint: providerHint })?.modelManifest ||
      null,
    value56 = String(modelManifest?.prompt?.placeholder || '').trim();
  if (value56) return value56;
  return getDefaultImagePromptPlaceholder();
}
export function escapeHtmlAttr(value57) {
  return String(value57 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
const APIMART_BADGE_ICON_HTML =
  '<div class="node-menu-icon node-menu-icon-badge node-menu-icon-apimart">AM</div>';
function getImageMenuMeta(value58) {
  const value59 = value58?.extensions?.imageMenu;
  return value59 && typeof value59 === 'object' ? value59 : null;
}
export function getImageModelMenuManifests(value60) {
  const value61 = String(value60 || '').trim();
  return getModelsByKind('image')
    .filter((item12) => getImageMenuMeta(item12)?.group === value61)
    .sort((item13, value62) => {
      const imageMenuMeta = getImageMenuMeta(item13),
        imageMenuMeta2 = getImageMenuMeta(value62);
      return (imageMenuMeta?.order || 0) - (imageMenuMeta2?.order || 0);
    });
}
function renderImageMenuGroupHTML({
  headerClass: headerClass,
  toggleAttr: toggleAttr,
  submenuClass: submenuClass,
  iconHtml: iconHtml,
  title: title,
  subtitle: subtitle,
  badgeHtml: badgeHtml = '',
  itemsHtml: itemsHtml = '',
}) {
  return renderNodeMenuGroup({
    id: submenuClass,
    headerClass: headerClass,
    toggleAttr: toggleAttr,
    submenuClass: submenuClass,
    iconHtml: iconHtml,
    label: title,
    subtitle: subtitle,
    badgeHtml: badgeHtml,
    itemsHtml: itemsHtml,
  });
}
function renderImageManifestIconHTML(value63, value64 = {}) {
  if (value64.iconKind === 'apimartBadge') return APIMART_BADGE_ICON_HTML;
  if (value64.iconKind === 'agnesBadge') return AGNES_BADGE_ICON_HTML;
  const enabled7 = value64.icon || value63?.icon || '';
  if (!enabled7) return '';
  const value65 = value64.iconAlt || value63?.provider || value63?.displayName || '';
  return (
    '<img src="' +
    escapeHtmlAttr(enabled7) +
    '" class="node-menu-icon" alt="' +
    escapeHtmlAttr(value65) +
    '">'
  );
}
function renderImageManifestMenuItemHTML(value66, value67) {
  const label = getImageMenuMeta(value66) || {},
    modelId = value66?.modelId || '',
    provider2 = value66?.provider || '',
    active = String(value67 || '') === modelId;
  return renderNodeMenuItem({
    modelId: modelId,
    provider: provider2,
    label: label.title || value66?.displayName || modelId,
    description: label.subtitle || value66?.description || '',
    iconHtml: renderImageManifestIconHTML(value66, label),
    active: active,
  });
}
export function buildGrsaiImageMenuGroupHTML(value68, value69 = '') {
  return renderImageMenuGroupHTML({
    headerClass: 'grsai-group-header',
    toggleAttr: 'data-grsai-toggle',
    submenuClass: 'grsai-submenu',
    iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
    title: 'GRSAI',
    subtitle: '高性能 AI 图像生成服务',
    itemsHtml: buildNanoBananaFamilyMenuHTML(value68, value69),
  });
}
export function buildApimartImageMenuGroupHTML(value70) {
  const itemsHtml2 = getImageModelMenuManifests('apimart')
    .map((item14) => renderImageManifestMenuItemHTML(item14, value70))
    .join('');
  return renderImageMenuGroupHTML({
    headerClass: 'apimart-group-header',
    toggleAttr: 'data-apimart-toggle',
    submenuClass: 'apimart-submenu',
    iconHtml: APIMART_BADGE_ICON_HTML,
    title: 'APIMart',
    subtitle: '一个 API 搞定一切——节省 30-70%',
    itemsHtml: itemsHtml2,
  });
}
export function buildAgnesImageMenuGroupHTML(value71) {
  const itemsHtml3 = getImageModelMenuManifests('agnes')
    .map((item15) => renderImageManifestMenuItemHTML(item15, value71))
    .join('');
  return renderImageMenuGroupHTML({
    headerClass: 'agnes-group-header',
    toggleAttr: 'data-agnes-toggle',
    submenuClass: 'agnes-submenu',
    iconHtml: AGNES_BADGE_ICON_HTML,
    title: 'Agnes AI',
    subtitle: 'Agnes Image model API',
    itemsHtml: itemsHtml3,
  });
}
export function buildVolcengineImageMenuGroupHTML(value72) {
  const itemsHtml4 = getImageModelMenuManifests('volcengine')
    .map((item16) => renderImageManifestMenuItemHTML(item16, value72))
    .join('');
  return renderImageMenuGroupHTML({
    headerClass: 'volcengine-group-header',
    toggleAttr: 'data-volcengine-toggle',
    submenuClass: 'volcengine-submenu',
    iconHtml: VOLCENGINE_IMAGE_MENU_ICON_HTML,
    title: '火山方舟',
    subtitle: 'Ark Seedream 图像生成 API',
    itemsHtml: itemsHtml4,
  });
}
export function buildRunningHubImageModelMenuGroupHTML(value73, value74 = '') {
  return renderImageMenuGroupHTML({
    headerClass: 'runninghub-group-header',
    toggleAttr: 'data-runninghub-toggle',
    submenuClass: 'runninghub-submenu',
    iconHtml: '<img src="images/RH.png" class="node-menu-icon" alt="runninghub">',
    title: 'RunningHUB模型',
    subtitle: '模型 API：文生图/图生图/图片编辑',
    itemsHtml: buildRunningHubNanoBananaFamilyMenuHTML(value73, value74),
  });
}
export function buildRunningHubWorkflowImageMenuGroupHTML(value75) {
  const itemsHtml5 = getImageModelMenuManifests('runninghubWorkflow')
    .map((item17) => buildManifestModelMenuItemHTML(item17.modelId, value75))
    .join('');
  return renderImageMenuGroupHTML({
    headerClass: 'runninghubwf-group-header',
    toggleAttr: 'data-runninghubwf-toggle',
    submenuClass: 'runninghubwf-submenu',
    iconHtml: '<img src="images/RH.png" class="node-menu-icon" alt="runninghub">',
    title: 'RunningHUB工作流',
    subtitle: '工作流模板：替换/风格迁移，结果更可控',
    itemsHtml: itemsHtml5,
  });
}
export function buildImageModelMenuHTML({
  activeModel: activeModel = '',
  nanoSelection: nanoSelection = null,
} = {}) {
  return (
    '<div class="floating-menu img-model-menu">\n                ' +
    buildGrsaiImageMenuGroupHTML(nanoSelection, activeModel) +
    '\n                ' +
    getDreaminaImageMenuGroupHTML(activeModel) +
    '\n                ' +
    buildApimartImageMenuGroupHTML(activeModel) +
    '\n                ' +
    buildAgnesImageMenuGroupHTML(activeModel) +
    '\n                ' +
    buildVolcengineImageMenuGroupHTML(activeModel) +
    '\n                ' +
    buildRunningHubImageModelMenuGroupHTML(nanoSelection, activeModel) +
    '\n                ' +
    buildRunningHubWorkflowImageMenuGroupHTML(activeModel) +
    '\n              </div>'
  );
}
function getLatestImageMenuNodeData(store3, value76, value77 = {}) {
  return (store3?.getState?.() || {}).nodes?.[value76] || value77 || {};
}
function getImageMenuItemTitle(el5, value78 = '') {
  const el6 = el5?.querySelector?.('.fmi-title') || el5?.querySelector?.('.floating-menu-label');
  return el6 ? el6.textContent : value78;
}
function clearImageModelMenuActive(el7) {
  el7?.querySelectorAll?.('.floating-menu-item')?.forEach((el8) => el8.classList.remove('active'));
}
export function bindImageModelMenuSubmenu({
  modelMenu: modelMenu,
  modelTrigger: modelTrigger,
  modelLabel: modelLabel,
  nodeId: nodeId6,
  store: store4,
  fallbackNodeData: fallbackNodeData = {},
  toggleSelector: toggleSelector = '',
  submenuSelector: submenuSelector = '',
  defaultProvider: defaultProvider = '',
  buildModelPatch: buildModelPatch,
  resolveSelection: resolveSelection,
  beforeSelect: beforeSelect,
  onDisabled: onDisabled,
  afterSelect: afterSelect,
} = {}) {
  if (!modelMenu || !modelLabel || !nodeId6 || !store4) return null;
  const header = modelMenu.querySelector(toggleSelector),
    submenu = modelMenu.querySelector(submenuSelector);
  if (!header || !submenu) return null;
  let setTimeout2 = null;
  const value79 = () => {
      (setTimeout2 && (clearTimeout(setTimeout2), (setTimeout2 = null)), (submenu.style.display = 'flex'));
    },
    handler3 = (value80 = 120) => {
      if (setTimeout2) clearTimeout(setTimeout2);
      setTimeout2 = setTimeout(() => {
        submenu.style.display = 'none';
      }, value80);
    };
  return (
    header.addEventListener('mouseenter', value79),
    header.addEventListener('mouseleave', () => handler3()),
    submenu.addEventListener('mouseenter', value79),
    submenu.addEventListener('mouseleave', () => handler3()),
    submenu.querySelectorAll('.floating-menu-item').forEach((item18) => {
      item18.addEventListener('click', () => {
        if (item18.dataset.disabled === 'true') {
          onDisabled?.({ item: item18, modelMenu: modelMenu, submenu: submenu, modelTrigger: modelTrigger });
          return;
        }
        const latestNode = getLatestImageMenuNodeData(store4, nodeId6, fallbackNodeData),
          selection = (typeof resolveSelection === 'function'
            ? resolveSelection({ item: item18, latestNode: latestNode, defaultProvider: defaultProvider })
            : null) || {
            model: item18.dataset.value,
            provider: item18.dataset.provider || defaultProvider,
          },
          model2 = String(selection.model || '').trim(),
          provider3 = String(selection.provider || defaultProvider).trim();
        if (!model2 || !provider3) return;
        if (
          typeof beforeSelect === 'function' &&
          beforeSelect({
            item: item18,
            model: model2,
            provider: provider3,
            latestNode: latestNode,
            selection: selection,
          }) === false
        )
          return;
        ((modelLabel.textContent = selection.label || getImageMenuItemTitle(item18, model2)),
          clearImageModelMenuActive(modelMenu),
          item18.classList.add('active'),
          modelMenu.classList.remove('show'),
          (submenu.style.display = 'none'));
        const args4 =
            selection.patch && typeof selection.patch === 'object'
              ? selection.patch
              : { model: model2, provider: provider3 },
          value81 =
            typeof buildModelPatch === 'function'
              ? buildModelPatch(latestNode, model2, provider3, args4)
              : { ...args4, model: model2, provider: provider3 };
        (store4.updateNodeData(nodeId6, value81),
          afterSelect?.({
            item: item18,
            model: model2,
            provider: provider3,
            latestNode: latestNode,
            selection: selection,
            modelMenu: modelMenu,
            submenu: submenu,
            modelTrigger: modelTrigger,
          }));
      });
    }),
    { header: header, submenu: submenu }
  );
}
export function resolveGrsaiImageMenuSelection({ item: item19, latestNode: latestNode2 } = {}) {
  const provider4 = 'grsai',
    value82 = String(item19?.dataset?.value || '').trim();
  let model3 = value82,
    patch3 = { model: model3, provider: provider4 };
  if (isGrsaiGptImage2ModelToken(model3))
    ((model3 = GRSAI_GPT_IMAGE_2_MODEL), (patch3 = { model: model3, provider: provider4, imageSize: '1K' }));
  else {
    if (!model3) {
      const family = String(item19?.dataset?.nbFamily || '').trim();
      if (!family) return null;
      const imageSize3 = getPlainSchemaParams(latestNode2?.generationParams).imageSize || '2K',
        mode = getDefaultModeForNanoBananaFamily(family, provider4);
      ((model3 = resolveNanoBananaModelBySelection({
        family: family,
        mode: mode,
        imageSize: imageSize3,
        provider: provider4,
      })),
        (patch3 = { model: model3, provider: provider4 }));
    }
  }
  return { model: model3, provider: provider4, patch: patch3 };
}
export function resolveApimartImageMenuSelection({ item: item20, latestNode: latestNode3 } = {}) {
  const model4 = String(item20?.dataset?.value || '').trim(),
    provider5 = String(item20?.dataset?.provider || 'apimart').trim(),
    patch4 = { model: model4, provider: provider5 };
  if (
    model4 === 'apimart/seedream-4.5' ||
    model4 === 'apimart/seedream-5.0-lite' ||
    model4 === APIMART_GPT_IMAGE_2_MODEL ||
    model4 === APIMART_QWEN_IMAGE_MODEL ||
    model4 === APIMART_Z_IMAGE_TURBO_MODEL ||
    model4 === APIMART_WAN_IMAGE_MODEL
  ) {
    const plainSchemaParams2 =
      getPlainSchemaParams(latestNode3?.generationParams).imageSize || latestNode3?.imageSize || '2K';
    ((model4 === 'apimart/seedream-4.5' || model4 === 'apimart/seedream-5.0-lite') &&
      plainSchemaParams2 === '1K' &&
      (patch4.imageSize = '2K'),
      model4 === 'apimart/seedream-5.0-lite' && plainSchemaParams2 === '4K' && (patch4.imageSize = '3K'),
      model4 === APIMART_GPT_IMAGE_2_MODEL && plainSchemaParams2 === '3K' && (patch4.imageSize = '2K'),
      (model4 === APIMART_QWEN_IMAGE_MODEL || model4 === APIMART_Z_IMAGE_TURBO_MODEL) &&
        plainSchemaParams2 !== '1K' &&
        plainSchemaParams2 !== '2K' &&
        (patch4.imageSize = '1K'),
      model4 === APIMART_WAN_IMAGE_MODEL &&
        plainSchemaParams2 !== '1K' &&
        plainSchemaParams2 !== '2K' &&
        (patch4.imageSize = '2K'));
  }
  return { model: model4, provider: provider5, patch: patch4 };
}
export function resolveVolcengineImageMenuSelection({ item: item21, latestNode: latestNode4 } = {}) {
  const model5 = String(item21?.dataset?.value || '').trim(),
    provider6 = String(item21?.dataset?.provider || 'volcengine').trim(),
    patch5 = { model: model5, provider: provider6 },
    plainSchemaParams3 =
      getPlainSchemaParams(latestNode4?.generationParams).imageSize || latestNode4?.imageSize || '2K';
  return (
    (model5 === VOLCENGINE_SEEDREAM_5_MODEL || model5 === VOLCENGINE_SEEDREAM_4_5_MODEL) &&
      plainSchemaParams3 === '1K' &&
      (patch5.imageSize = '2K'),
    model5 === VOLCENGINE_SEEDREAM_5_MODEL && plainSchemaParams3 === '4K' && (patch5.imageSize = '3K'),
    (model5 === VOLCENGINE_SEEDREAM_4_5_MODEL || model5 === VOLCENGINE_SEEDREAM_4_MODEL) &&
      plainSchemaParams3 === '3K' &&
      (patch5.imageSize = '2K'),
    { model: model5, provider: provider6, patch: patch5 }
  );
}
export function resolveRunningHubWorkflowImageMenuSelection({ item: item22 } = {}) {
  return { model: item22?.dataset?.value, provider: item22?.dataset?.provider || 'runninghubwf' };
}
export function resolveRunningHubModelImageMenuSelection({ item: item23, latestNode: latestNode5 } = {}) {
  const family2 = String(item23?.dataset?.nbFamily || '').trim();
  let model6 = item23?.dataset?.value,
    provider7 = item23?.dataset?.provider || 'runninghubwf';
  const patch6 = {};
  if (family2) {
    provider7 = 'runninghub';
    const imageSize4 = getPlainSchemaParams(latestNode5?.generationParams).imageSize || '2K',
      mode2 = getDefaultModeForNanoBananaFamily(family2, provider7);
    model6 = resolveNanoBananaModelBySelection({
      family: family2,
      mode: mode2,
      imageSize: imageSize4,
      provider: provider7,
    });
  }
  if (!model6 || !provider7) return null;
  return { model: model6, provider: provider7, patch: patch6 };
}
function createImageTriggerIcon(value83, value84 = 'img') {
  const el9 = value83?.ownerDocument || (typeof document !== 'undefined' ? document : null);
  return el9?.createElement?.(value84) || null;
}
function replaceImageModelTriggerFirstIcon(value85, enabled8) {
  const enabled9 = value85?.firstElementChild;
  if (!enabled9 || !enabled8) return;
  enabled9.replaceWith(enabled8);
}
function setSimpleImageModelTriggerIcon(value86, value87 = {}) {
  const imageTriggerIcon = createImageTriggerIcon(value86, 'img');
  if (!imageTriggerIcon) return;
  imageTriggerIcon.src = value87.src || '';
  if (value87.alt) imageTriggerIcon.alt = value87.alt;
  ((imageTriggerIcon.className = ['image-model-trigger-icon', value87.className || '']
    .filter(Boolean)
    .join(' ')),
    replaceImageModelTriggerFirstIcon(value86, imageTriggerIcon));
}
function setApimartImageModelTriggerIcon(value88) {
  const imageTriggerIcon2 = createImageTriggerIcon(value88, 'div');
  if (!imageTriggerIcon2) return;
  ((imageTriggerIcon2.className =
    'image-model-trigger-icon image-model-trigger-badge image-model-trigger-icon-apimart'),
    (imageTriggerIcon2.innerText = 'AM'),
    replaceImageModelTriggerFirstIcon(value88, imageTriggerIcon2));
}
function setAgnesImageModelTriggerIcon(value89) {
  const imageTriggerIcon3 = createImageTriggerIcon(value89, 'div');
  if (!imageTriggerIcon3) return;
  ((imageTriggerIcon3.className = 'image-model-trigger-icon image-model-trigger-badge'),
    (imageTriggerIcon3.innerText = 'AG'),
    replaceImageModelTriggerFirstIcon(value89, imageTriggerIcon3));
}
export function setImageModelTriggerIcon(value90, value91, value92 = null) {
  const value93 = String(value91 || '')
    .trim()
    .toLowerCase();
  if (value93 === 'apimart') {
    setApimartImageModelTriggerIcon(value90, value92);
    return;
  }
  if (value93 === 'agnes') {
    setAgnesImageModelTriggerIcon(value90, value92);
    return;
  }
  if (value93 === 'aicanvas') {
    setSimpleImageModelTriggerIcon(value90, {
      src: 'images/favicon.svg',
      alt: 'aicanvas',
      className: 'image-model-trigger-icon-large',
    });
    return;
  }
  if (value93 === 'runninghub' || value93 === 'runninghubwf') {
    setSimpleImageModelTriggerIcon(value90, {
      src: 'images/RH.png',
      alt: 'runninghub',
      className: 'image-model-trigger-icon-soft',
    });
    return;
  }
  if (value93 === 'ppio') {
    setSimpleImageModelTriggerIcon(value90, { src: 'images/gemini.svg', alt: 'ppio' });
    return;
  }
  if (value93 === 'volcengine') {
    setSimpleImageModelTriggerIcon(value90, { src: 'images/volcengine.svg', alt: 'volcengine' });
    return;
  }
  setSimpleImageModelTriggerIcon(value90, {
    src: 'images/grsai.png',
    alt: 'grsai',
    className: 'image-model-trigger-icon-padded',
  });
}
export function renderImageModelTriggerIconHTML({ model: model = '', provider: provider = '' } = {}) {
  const value94 = String(model || '').trim(),
    value95 = String(resolveModelProvider(value94, provider) || provider || '')
      .trim()
      .toLowerCase();
  if (value95 === 'apimart')
    return '<div class="image-model-trigger-icon image-model-trigger-badge image-model-trigger-icon-apimart">AM</div>';
  if (value95 === 'agnes') return '<div class="image-model-trigger-icon image-model-trigger-badge">AG</div>';
  if (value95 === 'aicanvas' || value94.startsWith('aicanvas/'))
    return '<img src="images/favicon.svg" class="image-model-trigger-icon image-model-trigger-icon-large" alt="aicanvas">';
  if (value95 === 'dreamina') return getDreaminaImageTriggerIconHTML();
  if (value95 === 'runninghub' || value95 === 'runninghubwf')
    return '<img src="images/RH.png" class="image-model-trigger-icon image-model-trigger-icon-soft" alt="runninghub">';
  if (value95 === 'ppio') return '<img src="images/gemini.svg" class="image-model-trigger-icon" alt="ppio">';
  if (value95 === 'volcengine')
    return '<img src="images/volcengine.svg" class="image-model-trigger-icon" alt="volcengine">';
  return '<img src="images/grsai.png" class="image-model-trigger-icon image-model-trigger-icon-padded" alt="grsai">';
}
export function buildNanoBananaFamilyMenuHTML(value96, value97 = '') {
  const value98 = value96?.provider === 'grsai' ? value96?.family || '' : '',
    grsaiModelToken3 = normalizeGrsaiModelToken(value97);
  return getImageModelMenuManifests('grsaiModel')
    .map((modelId2) => {
      const label2 = getImageMenuMeta(modelId2) || {};
      if (label2.role === 'directModel')
        return renderNodeMenuItem({
          modelId: modelId2.modelId || GRSAI_GPT_IMAGE_2_MODEL,
          provider: 'grsai',
          label: label2.title || modelId2.displayName || 'GPT image 2',
          description: label2.subtitle || modelId2.description || '',
          iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
          active: isGrsaiGptImage2ModelToken(grsaiModelToken3),
        });
      const value99 = String(label2.family || '').trim(),
        disabled = label2.disabled === true,
        active2 = value98 === value99;
      return renderNodeMenuItem({
        label: label2.title || modelId2.displayName || value99,
        description: label2.subtitle || '',
        iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
        active: active2,
        disabled: disabled,
        attrs: { 'data-nb-family': value99 || undefined },
      });
    })
    .join('');
}
export function buildRunningHubNanoBananaFamilyMenuHTML(value100, value101 = '') {
  const active3 = value100?.provider === 'runninghub' ? value100?.family || '' : '';
  return getImageModelMenuManifests('runninghubModel')
    .map((item24) => {
      const label3 = getImageMenuMeta(item24) || {};
      if (label3.role === 'directModel') return renderImageManifestMenuItemHTML(item24, value101);
      const value102 = String(label3.family || '').trim();
      return renderNodeMenuItem({
        provider: 'runninghub',
        label: label3.title || item24.displayName || value102,
        description: label3.subtitle || item24.description || '',
        icon: label3.icon || item24.icon || 'images/gemini.svg',
        iconAlt: label3.alt || value102,
        active: active3 === value102,
        attrs: { 'data-nb-family': value102 || undefined },
      });
    })
    .join('');
}
export function shouldShowNanoBananaModeSelector({
  family: family3,
  provider: provider = '',
  isModelApiManifest: isModelApiManifest = false,
} = {}) {
  if (!isNanoBananaFamily(family3)) return false;
  return String(provider || '')
    .trim()
    .toLowerCase() === 'runninghub'
    ? true
    : !isModelApiManifest;
}
export function buildNanoBananaModeMenuHTML(value103, value104, value105 = '') {
  if (!isNanoBananaFamily(value103)) return '';
  const list11 = getNanoBananaModeOptions(value103, value105);
  return list11
    .map((item25) => {
      const value106 = item25.tooltip
          ? ' title="' +
            escapeHtmlAttr(item25.tooltip) +
            '" data-tooltip="' +
            escapeHtmlAttr(item25.tooltip) +
            '"'
          : '',
        value107 = item25.mode === value104;
      return (
        '<div class="floating-menu-item ' +
        (value107 ? 'active' : '') +
        '" data-nb-mode="' +
        item25.mode +
        '"' +
        value106 +
        '><span class="floating-menu-label">' +
        item25.label +
        '</span></div>'
      );
    })
    .join('');
}
export function buildQwenImageEditModeMenuHTML(value108) {
  const qwenImageEditMode2 = normalizeQwenImageEditMode(value108),
    list12 = getQwenUiFieldOptions('rhQwenEditMode'),
    list13 = list12.length
      ? list12
      : [
          { value: 'qwen2511', label: '2511' },
          { value: 'qwen2509', label: '2509' },
        ];
  return list13
    .map((el10) => {
      const escapeHtmlAttr2 = escapeHtmlAttr(getQwenImageEditModeTooltip(el10.value));
      return (
        '<div class="floating-menu-item ' +
        (qwenImageEditMode2 === el10.value ? 'active' : '') +
        '" data-qwen-mode="' +
        el10.value +
        '" title="' +
        escapeHtmlAttr2 +
        '" data-tooltip="' +
        escapeHtmlAttr2 +
        '"><span class="floating-menu-label">' +
        el10.label +
        '</span></div>'
      );
    })
    .join('');
}
export function buildQwenImageEditModelMenuItemHTML(value109) {
  return buildManifestModelMenuItemHTML(QWEN_IMAGE_EDIT_MODEL_ID, value109, {
    title: t('aigenImage.modelMenu.qwenEdit.title'),
    description: t('aigenImage.modelMenu.qwenEdit.description'),
  });
}
export function buildAnimeRealModelMenuItemHTML(value110) {
  return buildManifestModelMenuItemHTML(ANIME_REAL_MODEL_ID, value110, {
    title: t('aigenImage.modelMenu.animeReal.title'),
    description: t('aigenImage.modelMenu.animeReal.description'),
  });
}
export function buildPersonReplaceV21ModelMenuItemHTML(value111) {
  return buildManifestModelMenuItemHTML(PERSON_REPLACE_V21_MODEL_ID, value111, {
    title: t('aigenImage.modelMenu.personReplaceV21.title'),
    description: t('aigenImage.modelMenu.personReplaceV21.description'),
  });
}
export function buildPersonReplaceV3ModelMenuItemHTML(value112) {
  return buildManifestModelMenuItemHTML(PERSON_REPLACE_V3_MODEL_ID, value112, {
    title: t('aigenImage.modelMenu.personReplaceV3.title'),
    description: t('aigenImage.modelMenu.personReplaceV3.description'),
  });
}
function buildManifestModelMenuItemHTML(value113, activeModel2, value114 = {}) {
  const modelManifest2 = getModelManifest(value113),
    modelId3 = modelManifest2?.modelId || value113,
    provider8 = modelManifest2?.provider || 'runninghubwf',
    icon = modelManifest2?.icon || 'images/RH.png',
    label4 = modelManifest2?.displayName || value114.title || modelId3,
    description = modelManifest2?.description || value114.description || '',
    vip = modelManifest2?.vip === true || value114.vip === true,
    modelManifest3 = getModelManifest(activeModel2),
    active4 = activeModel2 === value113 || activeModel2 === modelId3 || modelManifest3?.modelId === modelId3;
  return renderNodeMenuItem(
    {
      modelId: modelId3,
      provider: provider8,
      label: label4,
      description: description,
      icon: icon,
      iconAlt: 'runninghub',
      vip: vip,
      active: active4,
    },
    { activeModel: activeModel2 },
  );
}
export function buildQwenFirstImageModeControlsHTML(value115) {
  const qwenFirstImageMode2 = normalizeQwenFirstImageMode(value115);
  return getQwenFirstImageModeOptions()
    .map((el11) => {
      const qwenFirstImageMode3 = normalizeQwenFirstImageMode(el11.value);
      return (
        '<button type="button" class="img-rp-quality-item qwen-first-image-mode-opt ' +
        (qwenFirstImageMode2 === qwenFirstImageMode3 ? 'active' : '') +
        '" data-value="' +
        escapeHtmlAttr(qwenFirstImageMode3) +
        '">' +
        escapeHtmlAttr(el11.label) +
        '</button>'
      );
    })
    .join('');
}

export const VOLCENGINE_SEEDREAM_5_PRO_MODEL = 'volcengine/seedream-5.0-pro';

const OPENAI_CLI_LOGO_ICON_HTML = renderOpenAiLogoHtml('node-menu-icon');
const COMFYUI_CLOUD_WORKFLOW_ICON_HTML = renderComfyUiCloudWorkflowLogoHtml({ className: 'node-menu-icon' });
const COMFYUI_LOCAL_WORKFLOW_ICON_HTML = renderComfyUiLocalWorkflowLogoHtml({ className: 'node-menu-icon' });

const IMAGE_SIZE_ORDER = Object['freeze'](['1K', '2K', '3K', '4K']);

function normalizeImageSizeToken(value116) {
  return String(value116 || '')
    ['trim']()
    ['toUpperCase']();
}

function pickSupportedImageSize(value117, value118) {
  const list14 = (Array['isArray'](value118?.['options']) ? value118['options'] : [])
      ['map']((value119) => normalizeImageSizeToken(value119?.['value'] ?? value119))
      ['filter'](Boolean),
    imageSizeToken = normalizeImageSizeToken(value117);
  if (!list14['length'] || !imageSizeToken || list14['includes'](imageSizeToken)) return '';
  const count = IMAGE_SIZE_ORDER['indexOf'](imageSizeToken),
    value120 = list14['map']((value121) => ({ value: value121, rank: IMAGE_SIZE_ORDER['indexOf'](value121) }))
      ['filter']((value122) => value122['rank'] >= 0)
      ['sort']((value123, value124) => value123['rank'] - value124['rank']);
  if (count >= 0 && value120['length'] > 0) {
    const el12 = value120['filter']((value125) => value125['rank'] <= count)['at'](-1);
    return el12?.['value'] || value120[0]['value'];
  }
  const imageSizeToken2 = normalizeImageSizeToken(value118?.['defaultValue']);
  return list14['includes'](imageSizeToken2) ? imageSizeToken2 : list14[0];
}

const BINGHUO_BADGE_ICON_HTML = '<div class="node-menu-icon node-menu-icon-badge">BH</div>';

function isSavedRhAiAppManifest(value126) {
  return Boolean(String(value126?.['extensions']?.['rhAiApp']?.['appKey'] || '')['trim']());
}

function isSavedComfyUiWorkflowManifest(value127) {
  return Boolean(String(value127?.['extensions']?.['comfyUiWorkflow']?.['appKey'] || '')['trim']());
}

function getCustomProviderMeta(value128) {
  const value129 = value128?.['extensions']?.['customProvider'];
  return value129 && typeof value129 === 'object' ? value129 : null;
}

function getCustomProviderBadgeText(value130, value131 = {}) {
  return (
    String(getCustomProviderMeta(value130)?.['badge'] || value131['badge'] || 'CP')
      ['trim']()
      ['slice'](0, 2) || 'CP'
  );
}

function getCustomProviderImageGroups(value132 = '') {
  const enabled10 = new Map();
  return (
    getModelsByKind('image')
      ['filter'](isModelManifestPubliclyListed)
      ['forEach']((value133) => {
        const imageMenuMeta3 = getImageMenuMeta(value133),
          customProviderMeta = getCustomProviderMeta(value133),
          enabled11 = String(imageMenuMeta3?.['group'] || value133?.['provider'] || '')['trim']();
        if (!imageMenuMeta3 || !customProviderMeta || !enabled11) return;
        (!enabled10['has'](enabled11) &&
          enabled10['set'](enabled11, {
            providerId: enabled11,
            displayName: customProviderMeta['displayName'] || enabled11,
            subtitle: imageMenuMeta3['subtitle'] || '自定义中转站',
            badge: customProviderMeta['badge'] || imageMenuMeta3['badge'] || 'CP',
            items: [],
          }),
          enabled10['get'](enabled11)['items']['push'](value133));
      }),
    Array['from'](enabled10['values']())['map']((value134) => {
      const value135 = value134['providerId']['replace'](/[^A-Za-z0-9_-]/g, '-');
      return renderImageMenuGroupHTML({
        headerClass: 'custom-provider-image-group-header custom-provider-image-group-' + value135,
        toggleAttr: 'data-custom-provider-image-toggle',
        submenuClass: 'custom-provider-image-submenu-' + value135,
        iconHtml:
          '<div class="node-menu-icon node-menu-icon-badge">' + escapeHtmlAttr(value134['badge']) + '</div>',
        title: value134['displayName'],
        subtitle: value134['subtitle'],
        attrs: { 'data-custom-provider-image-group': value134['providerId'] },
        itemsHtml: value134['items']
          ['sort'](
            (value136, value137) =>
              Number(getImageMenuMeta(value136)?.['order'] || 0) -
              Number(getImageMenuMeta(value137)?.['order'] || 0),
          )
          ['map']((value138) => renderImageManifestMenuItemHTML(value138, value132))
          ['join'](''),
      });
    })
  );
}

export function buildBinghuoImageMenuGroupHTML(value139) {
  const imageModelMenuManifests = getImageModelMenuManifests('binghuo')
    ['map']((value140) => renderImageManifestMenuItemHTML(value140, value139))
    ['join']('');
  if (!imageModelMenuManifests) return '';
  return renderImageMenuGroupHTML({
    headerClass: 'binghuo-image-group-header',
    toggleAttr: 'data-binghuo-image-toggle',
    submenuClass: 'binghuo-image-submenu',
    iconHtml: BINGHUO_BADGE_ICON_HTML,
    title: '便宜渠道bh',
    subtitle: '炳火图片生成 API',
    itemsHtml: imageModelMenuManifests,
  });
}

function buildOfficialImageMenuGroupHTML(value141, value142, value143, value144, value145) {
  const imageModelMenuManifests2 = getImageModelMenuManifests(value142)
    ['map']((value146) => renderImageManifestMenuItemHTML(value146, value141))
    ['join']('');
  return renderImageMenuGroupHTML({
    headerClass: value142 + '-group-header',
    toggleAttr: 'data-' + value142 + '-toggle',
    submenuClass: value142 + '-submenu',
    iconHtml:
      '<img src="' + value144 + '" class="node-menu-icon" alt="' + value142 + '">',
    title: value143,
    subtitle: value145,
    itemsHtml: imageModelMenuManifests2,
  });
}

export function buildOpenAiCliImageMenuGroupHTML(value147) {
  const imageModelMenuManifests3 = getImageModelMenuManifests('openai-cli')
    ['map']((value148) => renderImageManifestMenuItemHTML(value148, value147))
    ['join']('');
  if (!imageModelMenuManifests3) return '';
  return renderImageMenuGroupHTML({
    headerClass: 'openai-cli-image-group-header',
    toggleAttr: 'data-openai-cli-image-toggle',
    submenuClass: 'openai-cli-image-submenu',
    iconHtml: OPENAI_CLI_LOGO_ICON_HTML,
    title: 'OpenAI CLI',
    subtitle: '使用本机已登录的 OpenAI CLI 账号',
    itemsHtml: imageModelMenuManifests3,
  });
}

export function buildRhAiAppImageMenuGroupHTML(value149) {
  const imageModelMenuManifests4 = getImageModelMenuManifests('rhAiApp')
    ['map']((value150) => renderImageManifestMenuItemHTML(value150, value149))
    ['join']('');
  if (!imageModelMenuManifests4) return '';
  return renderImageMenuGroupHTML({
    headerClass: 'rh-ai-app-image-group-header',
    toggleAttr: 'data-rh-ai-app-toggle',
    submenuClass: 'rh-ai-app-image-submenu',
    iconHtml: '<img src="images/RH.png" class="node-menu-icon" alt="runninghub">',
    title: 'RH AI应用',
    subtitle: '自定义 RunningHub AI App',
    itemsHtml: imageModelMenuManifests4,
  });
}

function buildComfyUiWorkflowImageMenuGroupHTML({
  activeModel: activeModel3,
  group: group,
  headerClass: headerClass2,
  toggleAttr: toggleAttr2,
  submenuClass: submenuClass2,
  iconHtml: iconHtml2,
  title: title2,
  subtitle: subtitle2,
} = {}) {
  const imageModelMenuManifests5 = getImageModelMenuManifests(group)
    ['map']((value151) => renderImageManifestMenuItemHTML(value151, activeModel3))
    ['join']('');
  if (!imageModelMenuManifests5) return '';
  return renderImageMenuGroupHTML({
    headerClass: headerClass2,
    toggleAttr: toggleAttr2,
    submenuClass: submenuClass2,
    iconHtml: iconHtml2,
    title: title2,
    subtitle: subtitle2,
    itemsHtml: imageModelMenuManifests5,
  });
}

export function buildComfyUiCloudWorkflowImageMenuGroupHTML(value152) {
  return buildComfyUiWorkflowImageMenuGroupHTML({
    activeModel: value152,
    group: 'comfyUiCloudWorkflow',
    headerClass: 'comfyui-cloud-workflow-group-header',
    toggleAttr: 'data-comfyui-cloud-workflow-toggle',
    submenuClass: 'comfyui-cloud-workflow-submenu',
    iconHtml: COMFYUI_CLOUD_WORKFLOW_ICON_HTML,
    title: '云端工作流',
    subtitle: '保存的 ComfyUI 云端工作流',
  });
}

export function buildComfyUiLocalWorkflowImageMenuGroupHTML(value153) {
  return buildComfyUiWorkflowImageMenuGroupHTML({
    activeModel: value153,
    group: 'comfyUiLocalWorkflow',
    headerClass: 'comfyui-local-workflow-group-header',
    toggleAttr: 'data-comfyui-local-workflow-toggle',
    submenuClass: 'comfyui-local-workflow-submenu',
    iconHtml: COMFYUI_LOCAL_WORKFLOW_ICON_HTML,
    title: '本地工作流',
    subtitle: '保存的 ComfyUI 本地工作流',
  });
}

function createImageTriggerIconFromHTML(value154, value155) {
  const el13 = value154?.['ownerDocument'] || (typeof document !== 'undefined' ? document : null),
    enabled12 = el13?.['createElement']?.('template');
  if (!enabled12) return null;
  return (
    (enabled12['innerHTML'] = String(value155 || '')['trim']()),
    enabled12['content']?.['firstElementChild'] || null
  );
}

function setOpenAiCliImageModelTriggerIcon(value156) {
  const imageTriggerIconFromHTML = createImageTriggerIconFromHTML(
    value156,
    renderOpenAiLogoHtml('image-model-trigger-icon'),
  );
  if (!imageTriggerIconFromHTML) return;
  replaceImageModelTriggerFirstIcon(value156, imageTriggerIconFromHTML);
}

function getComfyUiWorkflowIconKind(value157 = '', value158 = null) {
  const el14 = value158?.['querySelector']?.('.custom-ai-app-logo');
  if (el14?.['classList']?.['contains']('custom-ai-app-logo--comfyui-cloud'))
    return 'comfyUiCloudWorkflowBadge';
  if (el14?.['classList']?.['contains']('custom-ai-app-logo--comfyui-local'))
    return 'comfyUiLocalWorkflowBadge';
  const value159 =
      String(value157 || '')['trim']() ||
      String(value158?.['dataset']?.['value'] || value158?.['getAttribute']?.('data-value') || '')['trim'](),
    value160 = String(getModelManifest(value159)?.['extensions']?.['imageMenu']?.['iconKind'] || '')[
      'trim'
    ]();
  return value160;
}

function renderComfyUiWorkflowTriggerIconHTML(value161 = '') {
  return renderComfyUiWorkflowLogoHtmlFromIconKind(getComfyUiWorkflowIconKind(value161), {
    className: 'image-model-trigger-icon',
  });
}

function setComfyUiWorkflowTriggerIcon(value162, value163 = null) {
  const imageTriggerIconFromHTML2 = createImageTriggerIconFromHTML(
    value162,
    renderComfyUiWorkflowLogoHtmlFromIconKind(getComfyUiWorkflowIconKind('', value163), {
      className: 'image-model-trigger-icon',
    }),
  );
  if (!imageTriggerIconFromHTML2) return;
  replaceImageModelTriggerFirstIcon(value162, imageTriggerIconFromHTML2);
}

function resolveImageTriggerManifest(value164 = '', value165 = '') {
  const enabled13 = String(value164 || '')['trim']();
  if (enabled13) {
    const modelManifest4 = getModelManifest(enabled13);
    if (modelManifest4) return modelManifest4;
  }
  const enabled14 = String(value165 || '')['trim']();
  if (!enabled13 && !enabled14) return null;
  try {
    return (
      resolveModelExecution(enabled13, { providerHint: enabled14 })?.['modelManifest'] ||
      resolveModelExecution(enabled13)?.['modelManifest'] ||
      null
    );
  } catch {
    return null;
  }
}

function renderCustomProviderTriggerBadgeHTML(value166, value167 = {}) {
  const customProviderBadgeText = getCustomProviderBadgeText(value166, value167);
  return (
    '<div class="image-model-trigger-icon image-model-trigger-badge">' +
    escapeHtmlAttr(customProviderBadgeText) +
    '</div>'
  );
}

function setCustomProviderImageModelTriggerIcon(value168, value169, value170 = {}) {
  const imageTriggerIcon4 = createImageTriggerIcon(value168, 'div');
  if (!imageTriggerIcon4) return;
  ((imageTriggerIcon4['className'] = 'image-model-trigger-icon image-model-trigger-badge'),
    (imageTriggerIcon4['innerText'] = getCustomProviderBadgeText(value169, value170)),
    replaceImageModelTriggerFirstIcon(value168, imageTriggerIcon4));
}

export function syncImageModelTriggerIcon(enabled15, enabled16 = {}) {
  if (!enabled15 || !enabled16?.['model']) return;
  const imageTriggerIconFromHTML3 = createImageTriggerIconFromHTML(
      enabled15,
      renderImageModelTriggerIconHTML({ model: enabled16['model'], provider: enabled16['provider'] }),
    ),
    value171 = enabled15['firstElementChild'];
  imageTriggerIconFromHTML3 &&
    value171?.['outerHTML'] !== imageTriggerIconFromHTML3['outerHTML'] &&
    value171?.['replaceWith']?.(imageTriggerIconFromHTML3);
}
