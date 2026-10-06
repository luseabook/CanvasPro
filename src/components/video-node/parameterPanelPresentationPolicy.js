import { t } from '../../i18n/index.js';
import { translateManifestText } from '../../i18n/manifestText.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { pickGenerationRatioSourceEdge } from '../../modules/generationRatioSource.js';
import { getPlainGenerationParams } from './runningHubVideoUiSchema.js';
const VIDEO_ADAPTIVE_RATIO_VALUE = '自适应';
export const VIDEO_MODE_ALL_REFERENCE_VALUE = '全能参考';
export const VIDEO_MODE_FIRST_LAST_VALUE = '首尾帧';
export const DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER = Object.freeze(['resolution', 'mode']);
export function videoPanelText(value, item = {}) {
  return t('videoNode.parameterPanel.' + value, item);
}
export function getVideoGenerateTitle() {
  return videoPanelText('generateTitle');
}
export function getVideoCancelTooltip() {
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
export function formatVideoRatioResolutionLabel(index, resolution) {
  return videoPanelText('ratioResolutionLabel', {
    aspectRatio: formatVideoAspectRatioLabel(index),
    resolution: resolution,
  });
}
export function resolveVideoAdaptiveRatioSource({
  inEdges: inEdges = [],
  nodes: nodes = {},
  nodeData: nodeData = {},
  adaptivePolicy: adaptivePolicy = {},
} = {}) {
  const list = Array.isArray(inEdges) ? inEdges : [];
  let edge = pickGenerationRatioSourceEdge(list, nodeData) || list[0] || null;
  const result = String(adaptivePolicy?.preferSlot || '').trim(),
    data = adaptivePolicy?.preferVideoKind === true,
    fallbackSquare = adaptivePolicy?.fallbackSquareWhenNoVideo === true;
  if (result) {
    const options = list.find((target) => String(target?.refSlot || '') === result);
    if (options) edge = options;
    else {
      if (data) {
        const source = list.find(
          (next) => resolveEffectiveInputKind(nodes?.[next?.sourceId], next) === 'video',
        );
        if (source) edge = source;
        else return { edge: null, fallbackSquare: fallbackSquare };
      }
    }
  }
  return { edge: edge, fallbackSquare: false };
}
export function getVideoModeLabel(current) {
  const entry = String(current || '').trim() || VIDEO_MODE_ALL_REFERENCE_VALUE;
  if (entry === VIDEO_MODE_ALL_REFERENCE_VALUE) return videoPanelText('mode.allReference');
  if (entry === VIDEO_MODE_FIRST_LAST_VALUE) return videoPanelText('mode.firstLastFrame');
  return entry;
}
export function getDreaminaProviderLabel(record) {
  const payload = String(record || '')
    .trim()
    .toLowerCase();
  if (payload === 'dreamina') return videoPanelText('providers.dreamina');
  if (payload === 'volcengine') return videoPanelText('providers.volcengine');
  return videoPanelText('providers.default');
}
function getManifestConditionFieldValue(options2 = {}, handle = '') {
  const enabled2 = String(handle || '').trim();
  if (!enabled2) return undefined;
  const plainGenerationParams = getPlainGenerationParams(options2?.generationParams);
  if (Object.prototype.hasOwnProperty.call(plainGenerationParams, enabled2))
    return plainGenerationParams[enabled2];
  if (Object.prototype.hasOwnProperty.call(options2 || {}, enabled2)) return options2[enabled2];
  const list2 = enabled2.split('.').filter(Boolean);
  if (list2.length <= 1) return undefined;
  let enabled3 = options2;
  for (const state of list2) {
    if (!enabled3 || typeof enabled3 !== 'object') return undefined;
    enabled3 = enabled3[state];
  }
  return enabled3;
}
function manifestConditionMatches(el, config = {}) {
  if (Array.isArray(el)) return el.some((scope) => manifestConditionMatches(scope, config));
  if (!el || typeof el !== 'object') return false;
  if (Array.isArray(el.any))
    return el.any.some((input) => manifestConditionMatches(input, config));
  if (Array.isArray(el.all))
    return el.all.every((output) => manifestConditionMatches(output, config));
  const enabled4 = String(el.field || el.param || '').trim();
  if (!enabled4) return false;
  const manifestConditionFieldValue = getManifestConditionFieldValue(config, enabled4),
    list3 = Array.isArray(el.values)
      ? el.values
      : Object.prototype.hasOwnProperty.call(el, 'value')
        ? [el.value]
        : [];
  if (list3.length === 0) return Boolean(manifestConditionFieldValue);
  return list3.some(
    (value2) =>
      manifestConditionFieldValue === value2 ||
      String(manifestConditionFieldValue ?? '') === String(value2 ?? ''),
  );
}
function resolveManifestPromptPlaceholder(enabled5, value3 = {}) {
  if (!enabled5 || typeof enabled5 !== 'object') return '';
  const value4 = Array.isArray(enabled5.variants) ? enabled5.variants : [];
  for (const value5 of value4) {
    if (value5 && typeof value5 === 'object' && manifestConditionMatches(value5.when, value3)) {
      const translateManifestText2 = translateManifestText(value5.placeholder || '').trim();
      if (translateManifestText2) return translateManifestText2;
    }
  }
  return translateManifestText(enabled5.placeholder || '').trim();
}
export function resolveVideoPromptPlaceholder(
  value6,
  value7 = {},
  defaultVideoPromptPlaceholder = getDefaultVideoPromptPlaceholder(),
) {
  const manifestPromptPlaceholder = resolveManifestPromptPlaceholder(value6?.prompt, value7);
  return manifestPromptPlaceholder || String(defaultVideoPromptPlaceholder || '').trim();
}
export function shouldShowVideoPromptInput(enabled6) {
  if (!enabled6 || typeof enabled6 !== 'object') return true;
  if (enabled6?.prompt?.visible === false) return false;
  if (enabled6?.prompt?.hidden === true) return false;
  return true;
}
function fieldConditionReferences(list4, value8) {
  const enabled7 = String(value8 || '').trim();
  if (Array.isArray(list4)) return list4.some((value9) => fieldConditionReferences(value9, enabled7));
  if (!enabled7 || !list4 || typeof list4 !== 'object') return false;
  if (String(list4.field || list4.param || '').trim() === enabled7) return true;
  return ['all', 'any'].some(
    (value10) =>
      Array.isArray(list4[value10]) &&
      list4[value10].some((value11) => fieldConditionReferences(value11, enabled7)),
  );
}
export function manifestHelpVariantsReferenceField(value12, value13) {
  const list5 = Array.isArray(value12?.help?.variants) ? value12.help.variants : [];
  return list5.some((value14) => fieldConditionReferences(value14?.when, value13));
}
export function manifestPromptVariantsReferenceField(value15, value16) {
  const list6 = Array.isArray(value15?.prompt?.variants) ? value15.prompt.variants : [];
  return list6.some((value17) => fieldConditionReferences(value17?.when, value16));
}
export function manifestFixedSlotVisibilityReferencesField(value18, value19) {
  const list7 = Array.isArray(value18?.inputSlots?.fixedSlots)
    ? value18.inputSlots.fixedSlots
    : [];
  return list7.some(
    (value20) =>
      fieldConditionReferences(value20?.showWhen, value19) ||
      fieldConditionReferences(value20?.hideWhen, value19),
  );
}
export function resolveVideoModelApiFooterPlacementOrder(options3 = {}) {
  const map = new Set(DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER),
    list8 = [],
    list9 = Array.isArray(options3?.uiSchema?.footerPlacementOrder)
      ? options3.uiSchema.footerPlacementOrder
      : [];
  return (
    list9.forEach((value21) => {
      const value22 = String(value21 || '')
        .trim()
        .toLowerCase();
      map.has(value22) && !list8.includes(value22) && list8.push(value22);
    }),
    DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER.forEach((value23) => {
      if (!list8.includes(value23)) list8.push(value23);
    }),
    list8
  );
}
export function wrapUiSchemaPlacementControls(value24) {
  return value24 ? '<div class="ui-schema-placement">' + value24 + '</div>' : '';
}
