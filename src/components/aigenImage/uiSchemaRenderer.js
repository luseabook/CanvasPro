import { createUiSchemaStateOwner, firstNonEmptyString } from './uiSchemaStateOwner.js';
import { resolveAudioVoiceCompositeState } from './audioVoiceCompositeState.js';
import {
  getModelManifest,
  normalizeUiSchemaFieldValue,
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
import { escapeHtmlAttr } from './uiModuleModelHelpers.js';
import { t } from '../../i18n/index.js';
import { translateManifestText } from '../../i18n/manifestText.js';
export { sanitizeModelUiSchemaParams };
const SUPPORTED_CONTROL_TYPES = new Set([
    'segmented',
    'select',
    'slider',
    'stepper',
    'toggle',
    'text',
    'textarea',
    'image input',
    'video input',
    'audio input',
  ]),
  ALLOWED_PLACEMENTS = new Set([
    'mode',
    'resolution',
    'advanced',
    'videoadvanced',
    'videoparams',
    'instance',
    'batch',
  ]),
  RANDOM_SEED_DEFAULT_MIN = 0,
  RANDOM_SEED_DEFAULT_MAX = 0x7fffffff;
function manifestText(value) {
  return translateManifestText(value);
}
function getDisplayLabelFromOption(item, key = '') {
  return manifestText(item?.displayLabel ?? item?.selectedLabel ?? item?.label ?? key);
}
function formatMetricLabel(index, result) {
  const manifestText2 = manifestText(index),
    data = String(result ?? '');
  return manifestText2 === String(index) ? '' + manifestText2 + data : manifestText2 + ' ' + data;
}
function joinMetricLabels(list) {
  return list
    .filter((list2) => Array.isArray(list2) && list2.length >= 2 && list2[1] !== '')
    .map(([options, target]) => formatMetricLabel(options, target))
    .join('·');
}
function escapeCssString(source) {
  return String(source ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}
function normalizePlacement(next) {
  const current = String(next || '')
    .trim()
    .toLowerCase();
  return ALLOWED_PLACEMENTS.has(current) ? current : '';
}
function filterUiSchemaFields(
  list3,
  {
    placement: placement,
    excludeFieldIds: excludeFieldIds,
    ignorePlacementFilter: ignorePlacementFilter = false,
  } = {},
) {
  if (!Array.isArray(list3)) return [];
  const entry = String(placement ?? '').trim() !== '',
    placement2 = normalizePlacement(placement),
    map = new Set(
      (Array.isArray(excludeFieldIds) ? excludeFieldIds : []).map((item2) => String(item2 || '').trim()),
    );
  return list3.filter((item3) => {
    const record = String(item3?.id || '').trim();
    if (map.has(record)) return false;
    if (entry && !placement2 && !ignorePlacementFilter) return false;
    if (!placement2 || ignorePlacementFilter) return true;
    return normalizePlacement(item3?.placement) === placement2;
  });
}
function getUiSchemaFields(payload, { placement: placement3, excludeFieldIds: excludeFieldIds2 } = {}) {
  const modelManifest = getModelManifest(payload);
  return filterUiSchemaFields(modelManifest?.uiSchema?.fields, {
    placement: placement3,
    excludeFieldIds: excludeFieldIds2,
  });
}
function getUiSchemaModelIdForNode(providerHint = {}) {
  const enabled = String(providerHint?.model || '').trim();
  if (!enabled) return '';
  if (getModelManifest(enabled)) return enabled;
  const modelExecution =
    resolveModelExecution(enabled, { providerHint: providerHint?.provider }) ||
    resolveModelExecution(enabled);
  return String(modelExecution?.canonicalModelId || modelExecution?.modelManifest?.modelId || enabled).trim();
}
function assertSupportedField(handle) {
  const enabled2 = String(handle?.id || '').trim(),
    controlType = normalizeControlType(handle?.type);
  if (!enabled2) throw new Error('[uiSchema] field id is required');
  if (!SUPPORTED_CONTROL_TYPES.has(controlType))
    throw new Error('[uiSchema] unsupported control type for ' + enabled2 + ': ' + handle?.type);
  if (handle?.defaultValue === undefined)
    throw new Error('[uiSchema] defaultValue is required for ' + enabled2);
  if (
    (controlType === 'segmented' || controlType === 'select') &&
    (!Array.isArray(handle?.options) || handle.options.length === 0)
  )
    throw new Error('[uiSchema] options are required for ' + enabled2);
}
function getFieldValue(state, config) {
  const enabled3 = String(config?.id || '').trim();
  if (!enabled3) return config?.defaultValue ?? '';
  const params = getUiSchemaParamContext(state),
    scope = state?.generationParams;
  if (scope && typeof scope === 'object' && !Array.isArray(scope) && scope[enabled3] !== undefined)
    return normalizeUiSchemaFieldValue(config, scope[enabled3], { params: params });
  if (state && typeof state === 'object' && !Array.isArray(state) && state[enabled3] !== undefined)
    return normalizeUiSchemaFieldValue(config, state[enabled3], { params: params });
  return normalizeUiSchemaFieldValue(config, config?.defaultValue, { params: params });
}
function getNodeFieldValue(input, output, value2 = '') {
  const enabled4 = String(output || '').trim();
  if (!enabled4) return value2;
  const value3 = input?.generationParams;
  if (value3 && typeof value3 === 'object' && !Array.isArray(value3) && value3[enabled4] !== undefined)
    return value3[enabled4];
  if (input && typeof input === 'object' && !Array.isArray(input) && input[enabled4] !== undefined)
    return input[enabled4];
  return value2;
}
function getPlainGenerationParams(args) {
  return args && typeof args === 'object' && !Array.isArray(args) ? { ...args } : {};
}
function getUiSchemaParamContext(options2 = {}) {
  const args2 = getPlainGenerationParams(options2?.generationParams),
    args3 = options2 && typeof options2 === 'object' && !Array.isArray(options2) ? options2 : {};
  return { ...args3, ...args2 };
}
function getGenerationParamsMemoryKey(value4) {
  return String(value4?.model || '').trim();
}
function normalizeControlType(value5) {
  return String(value5 || '')
    .trim()
    .toLowerCase();
}
function getRenderableOptions(value6) {
  const args4 = Array.isArray(value6?.options) ? value6.options : [],
    args5 =
      Array.isArray(value6?.advancedOptions) && globalThis.window?.ADVANCED_MODE
        ? value6.advancedOptions
        : [];
  return [...args4, ...args5];
}
function getOptionHideWhen(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object' || Array.isArray(enabled5)) return null;
  const value7 = enabled5.hideWhen;
  return value7 && (Array.isArray(value7) || (typeof value7 === 'object' && !Array.isArray(value7)))
    ? value7
    : null;
}
function isOptionHidden(el, value8 = {}) {
  if (el?.hidden === true) return true;
  const optionHideWhen = getOptionHideWhen(el);
  return optionHideWhen ? uiSchemaConditionMatches(optionHideWhen, value8) : false;
}
function getVisibleOptions(value9, value10 = {}) {
  return getRenderableOptions(value9).filter((item4) => !isOptionHidden(item4, value10));
}
function renderOptions(value11, value12, nodeData2 = {}) {
  const list4 = getVisibleOptions(value11, nodeData2);
  return list4
    .map((el2) => {
      const value13 = el2 && typeof el2 === 'object' && !Array.isArray(el2),
        value14 = String(value13 ? (el2.value ?? '') : el2),
        manifestText3 = manifestText(value13 ? (el2.label ?? value14) : value14),
        manifestText4 = manifestText(value13 ? el2.tooltip || '' : '').trim(),
        value15 = String(value12 ?? '') === value14,
        isOptionDisabled2 = isOptionDisabled(value11, el2, nodeData2),
        value16 = manifestText4
          ? ' title="' +
            escapeHtmlAttr(manifestText4) +
            '" data-tooltip="' +
            escapeHtmlAttr(manifestText4) +
            '"'
          : '';
      return (
        '<button type="button" class="img-rp-quality-item ui-schema-option ' +
        (value15 ? 'active' : '') +
        ' ' +
        (isOptionDisabled2 ? 'disabled' : '') +
        '" data-ui-schema-value="' +
        escapeHtmlAttr(value14) +
        '"' +
        value16 +
        getOptionDisabledAttrs(value11, el2, { nodeData: nodeData2 }) +
        '>' +
        escapeHtmlAttr(manifestText3) +
        '</button>'
      );
    })
    .join('');
}
function renderControl(value17, value18, value19, value20 = {}) {
  if (value19 === 'segmented') {
    if (value20?.advanced) return renderAdvancedSelectionControl(value17, value18, value20?.nodeData || {});
    const value21 = value20?.advanced ? ' rh-adv-seg rh-v5-fps-seg' : '';
    return (
      '<div class="img-rp-quality-segmented ui-schema-segmented' +
      value21 +
      '">' +
      renderOptions(value17, value18, value20?.nodeData || {}) +
      '</div>'
    );
  }
  if (value19 === 'select') return renderSelect(value17, value18, value20?.nodeData || {});
  if (value19 === 'slider' || value19 === 'stepper')
    return renderRange(value17, value18, value19, value20?.nodeData || {});
  if (value19 === 'toggle') return renderAdvancedSelectionControl(value17, value18, value20?.nodeData || {});
  if (value19 === 'text' || value19 === 'textarea') return renderTextInput(value17, value18, value19);
  return renderAssetInput(value17, value19);
}
function getOptionLabel(value22, value23) {
  const list5 = getRenderableOptions(value22),
    value24 = String(value23 ?? ''),
    value25 = list5.find((el3) => String(el3?.value ?? el3) === value24);
  return getDisplayLabelFromOption(value25, value24);
}
function getFieldById(value26, value27) {
  return (Array.isArray(value26) ? value26 : []).find((item5) => String(item5?.id || '').trim() === value27);
}
function getFieldByDisplayRole(value28, value29) {
  const enabled6 = String(value29 || '').trim();
  if (!enabled6) return null;
  return (Array.isArray(value28) ? value28 : []).find(
    (item6) => String(item6?.displayRole || '').trim() === enabled6,
  );
}
function getOptionValue(el4) {
  return String(el4?.value ?? el4);
}
function isFieldDisabled(el5) {
  return el5?.disabled === true || el5?.readOnly === true;
}
function normalizeCompareValue(value30) {
  return String(value30 ?? '')
    .trim()
    .toLowerCase();
}
function getOptionDisableWhen(enabled7) {
  if (!enabled7 || typeof enabled7 !== 'object' || Array.isArray(enabled7)) return null;
  const value31 = enabled7.disableWhen || enabled7.disabledWhen;
  return value31 && (Array.isArray(value31) || (typeof value31 === 'object' && !Array.isArray(value31)))
    ? value31
    : null;
}
function optionDisableWhenMatches(el6, value32 = {}) {
  if (Array.isArray(el6)) return el6.some((item7) => optionDisableWhenMatches(item7, value32));
  if (!el6 || typeof el6 !== 'object') return false;
  if (Array.isArray(el6.any)) return el6.any.some((item8) => optionDisableWhenMatches(item8, value32));
  if (Array.isArray(el6.all)) return el6.all.every((item9) => optionDisableWhenMatches(item9, value32));
  const enabled8 = String(el6?.field || el6?.param || '').trim();
  if (!enabled8) return false;
  const value33 = el6.values !== undefined ? el6.values : el6.value,
    list6 = Array.isArray(value33) ? value33 : [value33],
    list7 = list6.map(normalizeCompareValue);
  return list7.includes(normalizeCompareValue(getNodeFieldValue(value32, enabled8, '')));
}
function uiSchemaConditionMatches(el7, value34 = {}) {
  if (Array.isArray(el7)) return el7.some((item10) => uiSchemaConditionMatches(item10, value34));
  if (!el7 || typeof el7 !== 'object') return false;
  if (Array.isArray(el7.any)) return el7.any.some((item11) => uiSchemaConditionMatches(item11, value34));
  if (Array.isArray(el7.all)) return el7.all.every((item12) => uiSchemaConditionMatches(item12, value34));
  const enabled9 = String(el7?.field || el7?.param || '').trim();
  if (!enabled9) return false;
  const value35 = el7.values !== undefined ? el7.values : el7.value,
    list8 = Array.isArray(value35) ? value35 : [value35],
    list9 = list8.map(normalizeCompareValue);
  return list9.includes(normalizeCompareValue(getNodeFieldValue(value34, enabled9, '')));
}
function filterVisibleUiSchemaFields(list10 = [], value36 = {}) {
  return (Array.isArray(list10) ? list10 : []).filter((item13) => {
    if (item13?.showWhen && !uiSchemaConditionMatches(item13.showWhen, value36)) return false;
    if (item13?.hideWhen && uiSchemaConditionMatches(item13.hideWhen, value36)) return false;
    return true;
  });
}
function getOptionDisableWhenAttrs(value37) {
  const el8 = getOptionDisableWhen(value37);
  if (!el8) return '';
  if (Array.isArray(el8) || Array.isArray(el8.any) || Array.isArray(el8.all))
    return ' data-ui-schema-disable-when-json="' + escapeHtmlAttr(JSON.stringify(el8)) + '"';
  const enabled10 = String(el8.field || el8.param || '').trim(),
    value38 = el8.values !== undefined ? el8.values : el8.value,
    list11 = Array.isArray(value38) ? value38 : [value38];
  if (!enabled10 || list11.length === 0) return '';
  return (
    ' data-ui-schema-disable-when-field="' +
    escapeHtmlAttr(enabled10) +
    '" data-ui-schema-disable-when-values="' +
    escapeHtmlAttr(list11.join(',')) +
    '"'
  );
}
function getFieldDefaultAliasAttrs(value39) {
  const list12 = (Array.isArray(value39?.defaultValueAliases) ? value39.defaultValueAliases : [])
    .map((item14) => String(item14 ?? '').trim())
    .filter(Boolean);
  return list12.length
    ? ' data-ui-schema-default-aliases="' + escapeHtmlAttr(JSON.stringify(list12)) + '"'
    : '';
}
function isOptionDisabled(value40, el9, value41 = {}) {
  return (
    isFieldDisabled(value40) ||
    (el9 &&
      typeof el9 === 'object' &&
      !Array.isArray(el9) &&
      (el9.disabled === true || optionDisableWhenMatches(getOptionDisableWhen(el9), value41)))
  );
}
function getOptionDisabledAttrs(value42, el10, { button: button = true, nodeData: nodeData = {} } = {}) {
  const optionDisableWhenAttrs = getOptionDisableWhenAttrs(el10),
    isFieldDisabled2 =
      isFieldDisabled(value42) ||
      (el10 && typeof el10 === 'object' && !Array.isArray(el10) && el10.disabled === true),
    isOptionDisabled3 = isOptionDisabled(value42, el10, nodeData);
  if (!isOptionDisabled3) return optionDisableWhenAttrs;
  const value43 = isFieldDisabled2 ? ' data-ui-schema-static-disabled="true"' : '',
    value44 = button
      ? ' data-ui-schema-disabled="true" disabled aria-disabled="true"'
      : ' data-ui-schema-disabled="true" aria-disabled="true"';
  return '' + optionDisableWhenAttrs + value43 + value44;
}
function isAdaptiveRatioOption(value45, value46) {
  const optionValue = getOptionValue(value46).trim(),
    value47 = String(value46?.label ?? optionValue).trim(),
    value48 = optionValue.toLowerCase(),
    value49 = value47.toLowerCase();
  return (
    value48 === 'auto' ||
    value48 === 'adaptive' ||
    value48 === '自适应' ||
    value49 === 'auto' ||
    value49 === 'adaptive' ||
    value49 === '自适应' ||
    (optionValue === String(value45?.defaultValue ?? '') && value49 === 'auto')
  );
}
function getRatioOptionLabel(value50, value51) {
  const list13 = getRenderableOptions(value50),
    value52 = String(value51 ?? ''),
    enabled11 = list13.find((item15) => getOptionValue(item15) === value52);
  if (enabled11 && isAdaptiveRatioOption(value50, enabled11)) return t('videoNode.parameterPanel.adaptive');
  if (!enabled11 && isAdaptiveRatioOption(value50, value52)) return t('videoNode.parameterPanel.adaptive');
  return getDisplayLabelFromOption(enabled11, value52);
}
function getRatioIconClass(value53) {
  const value54 = String(value53 || '').trim(),
    value55 = {
      '1:1': 'img-rp-sq',
      '9:16': 'img-rp-tall',
      '16:9': 'img-rp-wide',
      '3:4': 'img-rp-p34',
      '4:3': 'img-rp-l43',
      '1:4': 'img-rp-p14',
      '4:1': 'img-rp-l41',
      '1:8': 'img-rp-p18',
      '8:1': 'img-rp-l81',
      '3:2': 'img-rp-l32',
      '2:3': 'img-rp-p23',
      '5:4': 'img-rp-l54',
      '4:5': 'img-rp-p45',
      '21:9': 'img-rp-ultra',
    };
  if (value55[value54]) return value55[value54];
  const enabled12 = value54.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!enabled12) return 'img-rp-sq';
  const value56 = Number(enabled12[1]),
    value57 = Number(enabled12[2]);
  if (!Number.isFinite(value56) || !Number.isFinite(value57) || value56 === value57) return 'img-rp-sq';
  return value56 > value57 ? 'img-rp-wide' : 'img-rp-tall';
}
function renderQualityButtons(value58, value59, nodeData3 = {}) {
  assertSupportedField(value58);
  const value60 = value58?.displayRole
      ? ' data-ui-schema-display-role="' + escapeHtmlAttr(value58.displayRole) + '"'
      : '',
    value61 =
      String(value58?.id || '').trim() === 'imageSize'
        ? manifestText('画质')
        : manifestText(value58?.label || '画质'),
    manifestText5 = manifestText(value58?.description || value58?.tooltip || '').trim(),
    value62 = String(value58?.variant || '').trim() === 'sectionMenu' || value58?.showInfoTip === true,
    value63 =
      manifestText5 && value62
        ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
          escapeHtmlAttr(manifestText5) +
          '">!</span>'
        : '',
    list14 = getVisibleOptions(value58, nodeData3),
    value64 = list14.some((item16) => String(item16?.groupLabel || item16?.sectionLabel || '').trim());
  if (value64) {
    const list15 = [];
    return (
      list14.forEach((item17) => {
        const label = manifestText(item17?.groupLabel || item17?.sectionLabel || value61).trim();
        let enabled13 = list15.find((item18) => item18.label === label);
        (!enabled13 && ((enabled13 = { label: label, options: [] }), list15.push(enabled13)),
          enabled13.options.push(item17));
      }),
      '<div class="img-rp-quality-area" data-ui-schema-field="' +
        escapeHtmlAttr(value58.id) +
        '" data-ui-schema-type="segmented" data-ui-schema-default="' +
        escapeHtmlAttr(value58?.defaultValue ?? '') +
        '"' +
        value60 +
        '>\n      ' +
        list15
          .map(
            (item19) =>
              '<div class="img-rp-section-label">' +
              escapeHtmlAttr(item19.label) +
              (item19.label === value61 ? value63 : '') +
              '</div>\n            <div class="img-rp-quality-segmented">\n              ' +
              item19.options
                .map((item20) => {
                  const optionValue2 = getOptionValue(item20),
                    manifestText6 = manifestText(item20?.label ?? optionValue2),
                    displayLabelFromOption = getDisplayLabelFromOption(item20, manifestText6),
                    value65 = String(value59 ?? '') === optionValue2,
                    isOptionDisabled4 = isOptionDisabled(value58, item20, nodeData3);
                  return (
                    '<button type="button" class="img-rp-quality-item ui-schema-option ' +
                    (value65 ? 'active' : '') +
                    ' ' +
                    (isOptionDisabled4 ? 'disabled' : '') +
                    '" data-ui-schema-value="' +
                    escapeHtmlAttr(optionValue2) +
                    '" data-ui-schema-option-label="' +
                    escapeHtmlAttr(displayLabelFromOption) +
                    '"' +
                    getOptionDisabledAttrs(value58, item20, { nodeData: nodeData3 }) +
                    '>' +
                    escapeHtmlAttr(manifestText6) +
                    '</button>'
                  );
                })
                .join('') +
              '\n            </div>',
          )
          .join('') +
        '\n    </div>'
    );
  }
  return (
    '<div class="img-rp-quality-area" data-ui-schema-field="' +
    escapeHtmlAttr(value58.id) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(value58?.defaultValue ?? '') +
    '"' +
    value60 +
    '>\n    <div class="img-rp-section-label">' +
    escapeHtmlAttr(value61) +
    value63 +
    '</div>\n    <div class="img-rp-quality-segmented">\n      ' +
    list14
      .map((item21) => {
        const optionValue3 = getOptionValue(item21),
          manifestText7 = manifestText(item21?.label ?? optionValue3),
          displayLabelFromOption2 = getDisplayLabelFromOption(item21, manifestText7),
          value66 = String(value59 ?? '') === optionValue3,
          isOptionDisabled5 = isOptionDisabled(value58, item21, nodeData3);
        return (
          '<button type="button" class="img-rp-quality-item ui-schema-option ' +
          (value66 ? 'active' : '') +
          ' ' +
          (isOptionDisabled5 ? 'disabled' : '') +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(optionValue3) +
          '" data-ui-schema-option-label="' +
          escapeHtmlAttr(displayLabelFromOption2) +
          '"' +
          getOptionDisabledAttrs(value58, item21, { nodeData: nodeData3 }) +
          '>' +
          escapeHtmlAttr(manifestText7) +
          '</button>'
        );
      })
      .join('') +
    '\n    </div>\n  </div>'
  );
}
function renderSectionMenuField(value67, value68) {
  const value69 = String(value67?.id || '').trim(),
    fieldValue = getFieldValue(value68, value67),
    optionLabel = getOptionLabel(value67, fieldValue);
  return (
    '<div class="ui-schema-field ui-schema-section-menu" data-ui-schema-field="' +
    escapeHtmlAttr(value69) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(value67?.defaultValue ?? '') +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(value69) +
    '">\n      <span class="ui-schema-pill-label">' +
    escapeHtmlAttr(optionLabel) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-section-menu-popup" style="display:none;">\n      ' +
    renderQualityButtons(value67, fieldValue, value68) +
    '\n    </div>\n  </div>'
  );
}
function renderRatioButtons(value70, value71, nodeData4 = {}) {
  assertSupportedField(value70);
  const value72 = value70?.displayRole
      ? ' data-ui-schema-display-role="' + escapeHtmlAttr(value70.displayRole) + '"'
      : '',
    list16 = getVisibleOptions(value70, nodeData4),
    value73 = list16.find((item22) => isAdaptiveRatioOption(value70, item22)),
    list17 = list16.filter((item23) => !isAdaptiveRatioOption(value70, item23)),
    value74 = String(value71 ?? ''),
    value75 = value73 ? getOptionValue(value73) : '',
    value76 = value73 && String(value74) === String(value75),
    value77 = value73
      ? '<button type="button" class="img-rp-large-adaptive ui-schema-option ' +
        (value76 ? 'active' : '') +
        '" data-label="自适应" data-ui-schema-value="' +
        escapeHtmlAttr(value75) +
        '">\n        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n        <span>' +
        escapeHtmlAttr(t('videoNode.parameterPanel.adaptive')) +
        '</span>\n      </button>'
      : '',
    value78 = value73 ? 'img-rp-ratio-split has-adaptive' : 'img-rp-ratio-split';
  return (
    '<div class="img-rp-ratio-area" data-ui-schema-field="' +
    escapeHtmlAttr(value70.id) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(value70?.defaultValue ?? '') +
    '"' +
    value72 +
    '>\n    <div class="img-rp-section-label">' +
    escapeHtmlAttr(manifestText('比例')) +
    '</div>\n    <div class="' +
    value78 +
    '">\n      ' +
    (value73 ? '<div class="img-rp-ratio-left">' + value77 + '</div>' : '') +
    '\n      <div class="img-rp-ratio-right">\n        ' +
    list17
      .map((item24) => {
        const optionValue4 = getOptionValue(item24),
          manifestText8 = manifestText(item24?.label ?? optionValue4),
          value79 = value74 === optionValue4,
          isOptionDisabled6 = isOptionDisabled(value70, item24, nodeData4);
        return (
          '<button type="button" class="img-rp-ratio-item ui-schema-option ' +
          (value79 ? 'active' : '') +
          ' ' +
          (isOptionDisabled6 ? 'disabled' : '') +
          '" data-label="' +
          escapeHtmlAttr(optionValue4) +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(optionValue4) +
          '"' +
          getOptionDisabledAttrs(value70, item24, { nodeData: nodeData4 }) +
          '><span class="img-rp-icon ' +
          getRatioIconClass(optionValue4) +
          '"></span><span>' +
          escapeHtmlAttr(manifestText8) +
          '</span></button>'
        );
      })
      .join('') +
    '\n      </div>\n    </div>\n  </div>'
  );
}
function renderQualityRatioField(value80, value81, value82) {
  const list18 = (Array.isArray(value80) ? value80 : [value80]).filter(Boolean);
  (list18.forEach(assertSupportedField), assertSupportedField(value81));
  const fieldValue2 = getFieldValue(value82, value81),
    list19 = list18.map((item25) => getOptionLabel(item25, getFieldValue(value82, item25))),
    ratioOptionLabel = getRatioOptionLabel(value81, fieldValue2),
    value83 = String(list18[0]?.qualityRatioLabelOrder || list18[0]?.compositeLabelOrder || '').trim(),
    value84 =
      list19.length > 1
        ? [...list19, ratioOptionLabel].join(' · ')
        : value83 === 'fieldFirst'
          ? (list19[0] || '') + ' · ' + ratioOptionLabel
          : ratioOptionLabel + ' · ' + (list19[0] || ''),
    value85 = value83 ? ' data-ui-schema-label-order="' + escapeHtmlAttr(value83) + '"' : '';
  return (
    '<div class="ui-schema-quality-ratio-pill" data-ui-schema-composite-field="qualityRatio"' +
    value85 +
    '>\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="qualityRatio">\n      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n      <span class="ui-schema-pill-label ui-schema-quality-ratio-label">' +
    escapeHtmlAttr(value84) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-quality-ratio-popup" style="display:none;">\n      ' +
    list18.map((item26) => renderQualityButtons(item26, getFieldValue(value82, item26), value82)).join('') +
    '\n      ' +
    renderRatioButtons(value81, fieldValue2, value82) +
    '\n    </div>\n  </div>'
  );
}
function renderAspectRatioPillField(value86, value87) {
  assertSupportedField(value86);
  const value88 = String(value86?.id || '').trim(),
    fieldValue3 = getFieldValue(value87, value86),
    ratioOptionLabel2 = getRatioOptionLabel(value86, fieldValue3);
  return (
    '<div class="ui-schema-aspect-ratio-pill" data-ui-schema-field="' +
    escapeHtmlAttr(value88) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(value86?.defaultValue ?? '') +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(value88) +
    '">\n      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n      <span class="ui-schema-pill-label ui-schema-aspect-ratio-label">' +
    escapeHtmlAttr(ratioOptionLabel2) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-aspect-ratio-popup" style="display:none;">\n      ' +
    renderRatioButtons(value86, fieldValue3, value87) +
    '\n    </div>\n  </div>'
  );
}
function renderSectionPairField(value89, value90) {
  const list20 = (Array.isArray(value89) ? value89 : []).filter(Boolean);
  list20.forEach(assertSupportedField);
  const value91 = list20.map((item27) => getOptionLabel(item27, getFieldValue(value90, item27))).join(' · '),
    value92 = list20.map((item28) => String(item28?.id || '').trim()).filter(Boolean),
    value93 = value92[0] || '',
    value94 = value92[1] || '';
  return (
    '<div class="ui-schema-section-pair-pill" data-ui-schema-composite-field="sectionPair" data-ui-schema-primary-field="' +
    escapeHtmlAttr(value93) +
    '" data-ui-schema-secondary-field="' +
    escapeHtmlAttr(value94) +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="sectionPair">\n      <span class="ui-schema-pill-label ui-schema-section-pair-label">' +
    escapeHtmlAttr(value91) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-section-pair-popup" style="display:none;">\n      ' +
    list20.map((item29) => renderQualityButtons(item29, getFieldValue(value90, item29), value90)).join('') +
    '\n    </div>\n  </div>'
  );
}
function renderVideoResolutionField(value95, value96) {
  const args6 = getFieldById(value95, 'rhVideoResolution') || getFieldById(value95, 'videoResolution');
  if (!args6) return '';
  assertSupportedField(args6);
  const fieldById = getFieldById(value95, 'rhVideoFps'),
    fieldById2 = getFieldById(value95, 'rhVideoFrames');
  if (fieldById) assertSupportedField(fieldById);
  if (fieldById2) assertSupportedField(fieldById2);
  const fieldValue4 = getFieldValue(value96, args6),
    value97 = fieldById ? getFieldValue(value96, fieldById) : '',
    value98 = fieldById2 ? getFieldValue(value96, fieldById2) : '',
    value99 = Number(value98) === 0 ? t('aigenImage.uiSchema.fullLength') : String(value98 || ''),
    value100 =
      fieldById && fieldById2
        ? joinMetricLabels([
            ['帧数', value99],
            ['帧率', value97],
            ['分辨率', fieldValue4],
          ])
        : formatMetricLabel('分辨率', fieldValue4);
  return (
    '<div class="ui-schema-video-resolution-pill" data-ui-schema-composite-field="videoResolution">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="videoResolution">\n      <span class="ui-schema-pill-label ui-schema-video-resolution-label">' +
    escapeHtmlAttr(value100) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-video-resolution-popup" style="display:none;">\n      ' +
    renderQualityButtons({ ...args6, label: '分辨率' }, fieldValue4, value96) +
    '\n      ' +
    (fieldById
      ? '<div class="rh-v5-meta-panel"><div class="rh-vram-adv-row"><div class="rh-vram-adv-label"><span>' +
        escapeHtmlAttr(manifestText('帧率')) +
        '</span></div><div class="img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg" data-ui-schema-field="' +
        escapeHtmlAttr(fieldById.id) +
        '" data-ui-schema-type="segmented" data-ui-schema-default="' +
        escapeHtmlAttr(fieldById.defaultValue ?? '') +
        '">' +
        renderOptions(fieldById, value97, value96) +
        '</div></div></div>'
      : '') +
    '\n    </div>\n  </div>'
  );
}
function normalizeNumberValue(value101, value102, { min: min = -Infinity, max: max = Infinity } = {}) {
  const value103 = Number(value101),
    value104 = Number.isFinite(value103) ? Math.trunc(value103) : value102;
  return Math.max(min, Math.min(max, value104));
}
export function evaluateUiSchemaNumberExpression(value105) {
  if (typeof value105 === 'number') return Number.isFinite(value105) ? value105 : NaN;
  const list21 = String(value105 ?? '').trim();
  if (!list21) return NaN;
  let value106 = 0;
  const run = () => {
      while (/\s/.test(list21[value106] || '')) value106 += 1;
    },
    handler = () => {
      run();
      const value107 = value106;
      let enabled14 = false;
      while (/\d/.test(list21[value106] || '')) {
        ((enabled14 = true), (value106 += 1));
      }
      if (list21[value106] === '.') {
        value106 += 1;
        while (/\d/.test(list21[value106] || '')) {
          ((enabled14 = true), (value106 += 1));
        }
      }
      if (!enabled14) return NaN;
      return Number(list21.slice(value107, value106));
    },
    handler2 = () => {
      run();
      const value108 = list21[value106];
      if (value108 === '+' || value108 === '-') {
        value106 += 1;
        const value109 = handler2();
        return value108 === '-' ? -value109 : value109;
      }
      if (list21[value106] === '(') {
        value106 += 1;
        const value110 = run2();
        run();
        if (list21[value106] !== ')') return NaN;
        return ((value106 += 1), value110);
      }
      return handler();
    },
    handler3 = () => {
      let value111 = handler2();
      while (true) {
        run();
        const value112 = list21[value106];
        if (value112 !== '*' && value112 !== '/') return value111;
        value106 += 1;
        const count = handler2();
        if (!Number.isFinite(value111) || !Number.isFinite(count)) return NaN;
        if (value112 === '/' && count === 0) return NaN;
        value111 = value112 === '*' ? value111 * count : value111 / count;
      }
    };
  function run2() {
    let value113 = handler3();
    while (true) {
      run();
      const value114 = list21[value106];
      if (value114 !== '+' && value114 !== '-') return value113;
      value106 += 1;
      const value115 = handler3();
      if (!Number.isFinite(value113) || !Number.isFinite(value115)) return NaN;
      value113 = value114 === '+' ? value113 + value115 : value113 - value115;
    }
  }
  const value116 = run2();
  return (run(), value106 === list21.length && Number.isFinite(value116) ? value116 : NaN);
}
function renderRhVideoParamsIcon() {
  return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M7 6V4"/><path d="M12 6V4"/><path d="M17 6V4"/><path d="M8 10h1"/><path d="M8 14h1"/><path d="M8 18h1"/><path d="M15 12l4 2-4 2z"/></svg>';
}
function getRhVideoParamsKind(value117) {
  if (getFieldById(value117, 'rhVideoSeconds')) return 'seconds';
  if (getFieldById(value117, 'rhVideoFrames')) return 'frames';
  return 'resolution';
}
function buildRhVideoParamsLabel(value118, value119) {
  const fieldById3 = getFieldById(value118, 'rhVideoResolution'),
    fieldById4 = getFieldById(value118, 'rhVideoFps'),
    fieldById5 = getFieldById(value118, 'rhVideoFrames'),
    fieldById6 = getFieldById(value118, 'rhVideoSeconds'),
    value120 = fieldById3
      ? normalizeNumberValue(getFieldValue(value119, fieldById3), Number(fieldById3.defaultValue ?? 832), {
          min: 832,
        })
      : 832;
  if (fieldById6) {
    const value121 = fieldById4
        ? normalizeNumberValue(getFieldValue(value119, fieldById4), Number(fieldById4.defaultValue ?? 24))
        : 24,
      numberValue = normalizeNumberValue(
        getFieldValue(value119, fieldById6),
        Number(fieldById6.defaultValue ?? 5),
        { min: Number(fieldById6.min ?? 1), max: Number(fieldById6.max ?? 600) },
      );
    return joinMetricLabels([
      ['秒数', numberValue],
      ['帧率', value121],
      ['分辨率', value120],
    ]);
  }
  if (fieldById5) {
    const numberValue2 = normalizeNumberValue(
        getFieldValue(value119, fieldById5),
        Number(fieldById5.defaultValue ?? 77),
        { min: Number(fieldById5.min ?? 0), max: Number(fieldById5.max ?? 0xf423f) },
      ),
      value122 = numberValue2 === 0 ? t('aigenImage.uiSchema.fullLength') : String(numberValue2);
    if (!fieldById4)
      return joinMetricLabels([
        ['帧数', value122],
        ['分辨率', value120],
      ]);
    const numberValue3 = normalizeNumberValue(
      getFieldValue(value119, fieldById4),
      Number(fieldById4.defaultValue ?? 24),
    );
    return joinMetricLabels([
      ['帧数', value122],
      ['帧率', numberValue3],
      ['分辨率', value120],
    ]);
  }
  return formatMetricLabel('分辨率', value120);
}
function getRhVideoParamsAspectRatioField(value123) {
  return (
    getFieldById(value123, 'rhBerniniAspectRatio') ||
    getFieldById(value123, 'aspectRatio') ||
    getFieldByDisplayRole(value123, 'aspectRatio')
  );
}
function getRhVideoFpsOptions(value124, value125 = {}) {
  if (Array.isArray(value125?.rhVideoFpsOptions) && value125.rhVideoFpsOptions.length)
    return value125.rhVideoFpsOptions
      .map((item30) => Number(item30))
      .filter(Number.isFinite)
      .map((value126) => Object.freeze({ value: value126, label: value126 + '帧' }));
  return getRenderableOptions(value124);
}
function renderRhVideoParamsResolutionField(value127, value128, { buttonClass: buttonClass }) {
  assertSupportedField(value127);
  const numberValue4 = normalizeNumberValue(
    getFieldValue(value128, value127),
    Number(value127.defaultValue ?? 832),
    { min: 832 },
  );
  return (
    '<div class="img-rp-quality-area" data-ui-schema-field="' +
    escapeHtmlAttr(value127.id) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(value127?.defaultValue ?? '') +
    '">\n                  <div class="img-rp-section-label">' +
    escapeHtmlAttr(manifestText('分辨率')) +
    '<span class="rh-tip" data-tooltip="' +
    escapeHtmlAttr(manifestText('分辨率越高细节越清晰、边缘更稳定。\n同时显存占用与生成耗时会明显增加。')) +
    '">!</span></div>\n                  <div class="img-rp-quality-segmented rh-video-resolution-seg">\n                    ' +
    (Array.isArray(value127?.options) ? value127.options : [])
      .map((item31) => {
        const value129 = Number(getOptionValue(item31)),
          value130 = Number(numberValue4) === Number(value129),
          value131 =
            value127?.showHighResolutionOptions === true || Number(value129) <= 1440 ? '' : ' dev-mode-only';
        return (
          '<button type="button" class="img-rp-quality-item' +
          value131 +
          ' ' +
          (value130 ? 'active' : '') +
          ' ' +
          buttonClass +
          ' ui-schema-option" data-value="' +
          escapeHtmlAttr(value129) +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(value129) +
          '">' +
          escapeHtmlAttr(value129) +
          '</button>'
        );
      })
      .join('') +
    '\n                  </div>\n                </div>'
  );
}
function renderRhVideoParamsFpsRow(value132, value133, el11 = {}) {
  assertSupportedField(value132);
  const numberValue5 = normalizeNumberValue(
      getFieldValue(value133, value132),
      Number(value132.defaultValue ?? 24),
    ),
    value134 = el11?.buttonClass || 'rh-v5-fps-btn',
    value135 = el11?.hidden ? ' hidden' : '';
  return (
    '<div class="rh-vram-adv-row"' +
    value135 +
    '>\n                    <div class="rh-vram-adv-label">\n                      <span>' +
    escapeHtmlAttr(manifestText('帧率')) +
    '</span>\n                      <span class="rh-tip" data-tooltip="' +
    escapeHtmlAttr(
      manifestText(
        '帧率越高运动更顺滑、动作更连贯。\n但生成更慢、成本更高。\n常用 24 帧；想更快或更省可选 16 帧。',
      ),
    ) +
    '">!</span>\n                    </div>\n                    <div class="img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg" data-ui-schema-field="' +
    escapeHtmlAttr(value132.id) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(value132?.defaultValue ?? '') +
    '">\n                      ' +
    getRhVideoFpsOptions(value132, el11)
      .map((item32) => {
        const value136 = Number(getOptionValue(item32)),
          manifestText9 = manifestText(item32?.label ?? value136 + '帧');
        return (
          '<button type="button" class="img-rp-quality-item ' +
          value134 +
          ' ' +
          (Number(numberValue5) === Number(value136) ? 'active' : '') +
          ' ui-schema-option" data-value="' +
          escapeHtmlAttr(value136) +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(value136) +
          '">' +
          escapeHtmlAttr(manifestText9) +
          '</button>'
        );
      })
      .join('') +
    '\n                    </div>\n                  </div>'
  );
}
function renderRhVideoParamsStepperRow(value137, value138, value139 = {}) {
  assertSupportedField(value137);
  const value140 = String(value137?.id || '').trim(),
    value141 = value140 === 'rhVideoFrames',
    min2 = Number(value137?.min ?? (value141 ? 0 : 1)),
    max2 = Number(value137?.max ?? (value141 ? 0xf423f : 600)),
    value142 = Number(value137?.defaultValue ?? (value141 ? 77 : 5)),
    numberValue6 = normalizeNumberValue(getFieldValue(value138, value137), value142, {
      min: min2,
      max: max2,
    }),
    value143 = Number(value138?.rhVideoSourceFrameCount || 0),
    value144 = value141 ? 'rh-v5-frames-stepper' : 'rh-ltx-seconds-stepper',
    manifestText10 = manifestText(value141 ? '生成时长（帧数）' : '生成秒数'),
    manifestText11 = manifestText(
      value141
        ? '帧数决定生成片段的长度：数值越大视频越长、耗时越高。\n填 0 表示按源视频全长处理（适合整段替换）。'
        : '秒数决定生成视频的时长：数值越大视频越长、耗时与成本越高。',
    ),
    value145 = value141 && numberValue6 === 0 ? t('aigenImage.uiSchema.fullLength') : String(numberValue6);
  return (
    '<div class="rh-vram-adv-row ui-schema-rh-video-stepper" data-ui-schema-field="' +
    escapeHtmlAttr(value140) +
    '" data-ui-schema-type="stepper" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(value137?.defaultValue ?? '') +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(min2) +
    '" data-ui-schema-max="' +
    escapeHtmlAttr(max2) +
    '" data-ui-schema-step="' +
    escapeHtmlAttr(value137?.step ?? 1) +
    '">\n                    <div class="rh-vram-adv-label">\n                      <span>' +
    manifestText10 +
    '</span>\n                      <span class="rh-tip" data-tooltip="' +
    manifestText11 +
    '">!</span>\n                    </div>\n                    <div class="rh-stepper ' +
    value144 +
    '">\n                      ' +
    (value141
      ? '<div class="rh-v5-source-framecount" aria-label="' +
        escapeHtmlAttr(manifestText('源视频总帧数')) +
        '">' +
        (value143 ? String(value143) : '—') +
        '</div>'
      : '') +
    '\n                      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
    escapeHtmlAttr(manifestText(value141 ? '生成帧数' : '生成秒数')) +
    '" aria-valuenow="' +
    escapeHtmlAttr(numberValue6) +
    '" tabindex="0">' +
    escapeHtmlAttr(value145) +
    '</div>\n                    </div>\n                  </div>'
  );
}
function renderRhVideoParamsPlacementFields(list22, value146, args7 = {}) {
  const fieldById7 = getFieldById(list22, 'rhVideoResolution');
  if (!fieldById7) return list22.map((item33) => renderField(item33, value146, args7)).join('');
  const fieldById8 = getFieldById(list22, 'rhVideoFps'),
    fieldById9 = getFieldById(list22, 'rhVideoFrames'),
    fieldById10 = getFieldById(list22, 'rhVideoSeconds'),
    rhVideoParamsAspectRatioField = getRhVideoParamsAspectRatioField(list22),
    rhVideoParamsKind = getRhVideoParamsKind(list22),
    value147 = rhVideoParamsKind === 'seconds',
    value148 = Boolean(fieldById9 && !fieldById8),
    buttonClass2 = value147 ? 'rh-ltx-res-btn' : 'rh-v5-res-btn',
    buttonClass3 = value147 ? 'rh-ltx-fps-btn' : 'rh-v5-fps-btn',
    rhVideoParamsLabel = buildRhVideoParamsLabel(list22, value146),
    value149 = value147 ? 'rh-ltx-meta-panel' : 'rh-v5-meta-panel',
    value150 = value147
      ? '' +
        (fieldById8
          ? renderRhVideoParamsFpsRow(fieldById8, value146, { ...args7, buttonClass: buttonClass3 })
          : '') +
        (fieldById10 ? renderRhVideoParamsStepperRow(fieldById10, value146, args7) : '')
      : '' +
        (fieldById8
          ? renderRhVideoParamsFpsRow(fieldById8, value146, { ...args7, buttonClass: buttonClass3 })
          : '') +
        (value148 && args7?.preserveHiddenFpsRow ? '' : '') +
        (fieldById9 ? renderRhVideoParamsStepperRow(fieldById9, value146, args7) : ''),
    map2 = new Set(['rhVideoResolution', 'rhVideoFps', 'rhVideoFrames', 'rhVideoSeconds']),
    value151 = String(rhVideoParamsAspectRatioField?.id || '').trim();
  if (value151) map2.add(value151);
  const list23 = list22.filter((item34) => !map2.has(String(item34?.id || '').trim())),
    value152 =
      value148 && args7?.preserveHiddenFpsRow
        ? renderRhVideoParamsFpsRow(
            {
              id: 'rhVideoFps',
              type: 'segmented',
              label: '帧率',
              defaultValue: 24,
              options: Object.freeze([
                Object.freeze({ value: 16, label: '16帧' }),
                Object.freeze({ value: 24, label: '24帧' }),
              ]),
            },
            { generationParams: { rhVideoFps: 24 } },
            { ...args7, buttonClass: buttonClass3, hidden: true },
          )
        : '',
    value153 =
      '<div class="img-ratio-wrap ui-schema-rh-video-params" style="position:relative;" data-ui-schema-composite-field="rhVideoParams">\n              <button type="button" class="img-pill-btn img-ratio-btn">\n                <span class="img-ratio-icon-slot">' +
      renderRhVideoParamsIcon() +
      '</span>\n                <span class="img-ratio-label">' +
      escapeHtmlAttr(rhVideoParamsLabel) +
      '</span>\n              </button>\n              <div class="img-ratio-popup" style="display:none;">\n                ' +
      renderRhVideoParamsResolutionField(fieldById7, value146, { buttonClass: buttonClass2 }) +
      '\n                <div class="' +
      value149 +
      '" style="display:flex;flex-direction:column;gap:10px;">\n                  ' +
      value152 +
      value150 +
      '\n                </div>\n                ' +
      (rhVideoParamsAspectRatioField
        ? renderRatioButtons(
            rhVideoParamsAspectRatioField,
            getFieldValue(value146, rhVideoParamsAspectRatioField),
            value146,
          )
        : '') +
      '\n              </div>\n            </div>';
  return [...list23.map((item35) => renderField(item35, value146, args7)), value153].join('');
}
function renderFloatingMenuItems(value154, value155, nodeData5 = {}) {
  const list24 = getVisibleOptions(value154, nodeData5);
  return list24
    .map((el12) => {
      const value156 = String(el12?.value ?? el12),
        manifestText12 = manifestText(el12?.label ?? value156),
        displayLabelFromOption3 = getDisplayLabelFromOption(el12, manifestText12),
        manifestText13 = manifestText(el12?.tooltip || '').trim(),
        value157 = String(value155 ?? '') === value156,
        isOptionDisabled7 = isOptionDisabled(value154, el12, nodeData5),
        value158 = manifestText13
          ? ' title="' +
            escapeHtmlAttr(manifestText13) +
            '" data-tooltip="' +
            escapeHtmlAttr(manifestText13) +
            '"'
          : '',
        value159 = manifestText13
          ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
            escapeHtmlAttr(manifestText13) +
            '">!</span>'
          : '';
      return (
        '<div class="floating-menu-item ' +
        (value157 ? 'active' : '') +
        ' ' +
        (isOptionDisabled7 ? 'disabled' : '') +
        '" data-ui-schema-value="' +
        escapeHtmlAttr(value156) +
        '" data-ui-schema-option-label="' +
        escapeHtmlAttr(displayLabelFromOption3) +
        '"' +
        value158 +
        getOptionDisabledAttrs(value154, el12, { button: false, nodeData: nodeData5 }) +
        '><span class="floating-menu-label">' +
        escapeHtmlAttr(manifestText12) +
        '</span>' +
        value159 +
        '</div>'
      );
    })
    .join('');
}
function renderPillMenuField(value160, value161) {
  const value162 = String(value160?.id || '').trim(),
    fieldValue5 = getFieldValue(value161, value160),
    optionLabel2 = getOptionLabel(value160, fieldValue5),
    manifestText14 = manifestText(value160?.menuTitle || '').trim(),
    value163 =
      manifestText14 || (value160?.showMenuTitle === true ? manifestText(value160?.label || '').trim() : ''),
    value164 = value160?.menuTooltipByValue,
    value165 = String(value160?.menuTooltipField || '').trim(),
    value166 = value165 ? String(getNodeFieldValue(value161, value165, '') || '').trim() : '',
    value167 = value164 && typeof value164 === 'object' && !Array.isArray(value164) ? value164[value166] : '',
    manifestText15 = manifestText(value167 || value160?.menuTooltip || value160?.tooltip || '').trim(),
    value168 = manifestText15
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
        escapeHtmlAttr(manifestText15) +
        '">!</span>'
      : '',
    value169 = value163
      ? '<div class="floating-menu-title ui-schema-floating-menu-title">' +
        escapeHtmlAttr(value163) +
        value168 +
        '</div>'
      : '',
    isFieldDisabled3 = isFieldDisabled(value160)
      ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
      : '';
  return (
    '<div class="ui-schema-field ui-schema-pill-menu" data-ui-schema-field="' +
    escapeHtmlAttr(value162) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(value160?.defaultValue ?? '') +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(value162) +
    '"' +
    isFieldDisabled3 +
    '>\n      <span class="ui-schema-pill-label">' +
    escapeHtmlAttr(optionLabel2) +
    '</span>\n    </button>\n    <div class="floating-menu ui-schema-floating-menu">\n      ' +
    value169 +
    '\n      ' +
    renderFloatingMenuItems(value160, fieldValue5, value161) +
    '\n    </div>\n  </div>'
  );
}
function renderResolutionPillField(value170, value171) {
  const value172 = String(value170?.id || '').trim(),
    fieldValue6 = getFieldValue(value171, value170),
    list25 = getVisibleOptions(value170, value171),
    list26 = list25.map((el13) => Number(el13?.value ?? el13)).filter(Number.isFinite),
    value173 = Number.isFinite(Number(fieldValue6))
      ? Number(fieldValue6)
      : Number(value170?.defaultValue ?? list26[0] ?? 0),
    value174 = Math.max(0, list26.indexOf(value173)),
    value175 = Math.max(0, list26.length - 1),
    manifestText16 = manifestText(value170?.label || 'Resolution'),
    manifestText17 = manifestText(value170?.description || value170?.tooltip || '').trim(),
    value176 =
      manifestText17 && value170?.showInfoTip === true
        ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
          escapeHtmlAttr(manifestText17) +
          '">!</span>'
        : '';
  return (
    '<div class="ui-schema-field ui-schema-resolution-pill" data-ui-schema-field="' +
    escapeHtmlAttr(value172) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(value170?.defaultValue ?? '') +
    '" data-ui-schema-range-values="' +
    escapeHtmlAttr(list26.join(',')) +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(value172) +
    '">\n      <span class="ui-schema-pill-label ui-schema-resolution-label">\n        <span class="ui-schema-resolution-title">' +
    escapeHtmlAttr(manifestText16) +
    '</span>\n        <span class="ui-schema-resolution-value">' +
    escapeHtmlAttr(value173) +
    '</span>\n      </span>\n    </button>\n    <div class="rh-res-popup ui-schema-popup" style="display:none;">\n      <div class="rh-res-title">' +
    escapeHtmlAttr(manifestText16) +
    value176 +
    '</div>\n      <input type="range" class="rh-res-slider ui-schema-range-index" data-ui-schema-input="' +
    escapeHtmlAttr(value172) +
    '" min="0" max="' +
    escapeHtmlAttr(value175) +
    '" step="1" value="' +
    escapeHtmlAttr(value174) +
    '">\n      <div class="rh-res-ticks">' +
    list26.map((item36) => '<span>' + escapeHtmlAttr(item36) + '</span>').join('') +
    '</div>\n    </div>\n  </div>'
  );
}
function findRangeValueIndex(list27, value177) {
  const value178 = Number(value177);
  if (!Number.isFinite(value178) || !Array.isArray(list27)) return -1;
  return list27.findIndex((item37) => Math.abs(Number(item37) - value178) < 0.000001);
}
function parseRangeValuesFromFieldEl(el14) {
  const enabled15 = String(el14?.dataset?.uiSchemaRangeValues || '').trim();
  if (!enabled15) return [];
  return enabled15
    .split(',')
    .map((item38) => Number(item38))
    .filter(Number.isFinite);
}
function parseRangeLabelsFromFieldEl(el15) {
  const enabled16 = String(el15?.dataset?.uiSchemaRangeLabels || '').trim();
  if (!enabled16) return [];
  try {
    const list28 = JSON.parse(enabled16);
    return Array.isArray(list28) ? list28.map((item39) => String(item39)) : [];
  } catch {
    return [];
  }
}
function getRangeValueDisplayLabel(value179, value180, value181 = '') {
  const list29 = parseRangeLabelsFromFieldEl(value179);
  if (list29.length === 0) return value181 || String(value180 ?? '');
  const rangeValuesFromFieldEl = parseRangeValuesFromFieldEl(value179),
    rangeValueIndex = findRangeValueIndex(rangeValuesFromFieldEl, value180);
  return rangeValueIndex >= 0 && list29[rangeValueIndex]
    ? list29[rangeValueIndex]
    : value181 || String(value180 ?? '');
}
function getDurationOptionEntries(value182, value183 = {}) {
  return getVisibleOptions(value182, value183)
    .map((el16) => {
      const value184 = el16 && typeof el16 === 'object' && !Array.isArray(el16),
        value185 = Number(value184 ? el16.value : el16);
      if (!Number.isFinite(value185)) return null;
      const label2 = String(value184 ? getDisplayLabelFromOption(el16, value185 + 'S') : value185 + 'S');
      return { value: value185, label: label2 };
    })
    .filter(Boolean);
}
function renderDurationPillField(value186, value187) {
  const value188 = String(value186?.id || '').trim(),
    fieldValue7 = getFieldValue(value187, value186),
    list30 = getDurationOptionEntries(value186, value187),
    list31 = list30.map((el17) => el17.value),
    value189 = list31.length > 0,
    value190 = Number(value186?.min ?? 1),
    value191 = Number(value186?.max ?? 15),
    value192 = Number(value186?.step ?? 1),
    value193 = Number.isFinite(Number(fieldValue7))
      ? Number(fieldValue7)
      : Number(value186?.defaultValue ?? value190),
    value194 = Math.max(0, findRangeValueIndex(list31, value193)),
    value195 = value189 ? 0 : value190,
    value196 = value189 ? Math.max(0, list31.length - 1) : value191,
    value197 = value189 ? 1 : value192,
    value198 = value189 ? value194 : value193,
    value199 = value189 && list30[value194]?.label ? list30[value194].label : value193 + 'S',
    value200 = value189 ? list30[0]?.label : value190 + 'S',
    value201 = value189 ? list30[list30.length - 1]?.label : value191 + 'S',
    value202 = value189 ? ' data-ui-schema-range-values="' + escapeHtmlAttr(list31.join(',')) + '"' : '',
    value203 = value189
      ? ' data-ui-schema-range-labels="' +
        escapeHtmlAttr(JSON.stringify(list30.map((item40) => item40.label))) +
        '"'
      : '',
    isFieldDisabled4 = isFieldDisabled(value186)
      ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
      : '';
  return (
    '<div class="ui-schema-field ui-schema-duration-pill" data-ui-schema-field="' +
    escapeHtmlAttr(value188) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(value186?.defaultValue ?? '') +
    '"' +
    value202 +
    value203 +
    '>\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(value188) +
    '"' +
    isFieldDisabled4 +
    '>\n      <span class="ui-schema-pill-label ui-schema-duration-label">' +
    escapeHtmlAttr(value199) +
    '</span>\n    </button>\n    <div class="floating-menu ui-schema-popup ui-schema-duration-pop">\n      <div class="ui-schema-duration-title">' +
    escapeHtmlAttr(manifestText(value186?.label || '视频时长')) +
    '</div>\n      <input type="range" class="ui-schema-range ui-schema-duration-slider" data-ui-schema-input="' +
    escapeHtmlAttr(value188) +
    '" min="' +
    escapeHtmlAttr(value195) +
    '" max="' +
    escapeHtmlAttr(value196) +
    '" step="' +
    escapeHtmlAttr(value197) +
    '" value="' +
    escapeHtmlAttr(value198) +
    '">\n      <div class="ui-schema-duration-bounds">\n        <span>' +
    escapeHtmlAttr(value200) +
    '</span>\n        <span>' +
    escapeHtmlAttr(value201) +
    '</span>\n      </div>\n    </div>\n  </div>'
  );
}
function renderInstanceToggleField(value204, value205) {
  const value206 = String(value204?.id || '').trim(),
    value207 = String(getFieldValue(value205, value204) || value204?.defaultValue || ''),
    list32 = getVisibleOptions(value204, value205),
    value208 = Math.max(
      0,
      list32.findIndex((el18) => String(el18?.value ?? el18) === value207),
    ),
    el19 = list32[value208] || list32[0] || {},
    el20 = list32[(value208 + 1) % Math.max(1, list32.length)] || el19;
  return (
    '<div class="ui-schema-field rh-vram-wrap ui-schema-instance-toggle" data-ui-schema-field="' +
    escapeHtmlAttr(value206) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(value204?.defaultValue ?? '') +
    '">\n    <button type="button" class="img-pill-btn rh-vram-btn" data-ui-schema-value="' +
    escapeHtmlAttr(el20?.value ?? el20) +
    '">\n      <span class="rh-vram-label ui-schema-pill-label">' +
    escapeHtmlAttr(el19?.label ?? el19?.value ?? value207) +
    '</span>\n    </button>\n  </div>'
  );
}
function syncInstanceToggleField(el21, value209) {
  if (!el21?.classList?.contains('ui-schema-instance-toggle')) return;
  const value210 = String(value209) === 'plus',
    el22 = el21.querySelector('.ui-schema-pill-label');
  if (el22) el22.textContent = value210 ? '48G' : '24G';
  const el23 = el21.querySelector('[data-ui-schema-value]');
  if (el23) el23.dataset.uiSchemaValue = value210 ? 'default' : 'plus';
}
function syncStepperField(el24, value211) {
  if (!el24?.classList?.contains('ui-schema-rh-video-stepper')) return;
  const value212 = Number(el24.dataset.uiSchemaDefault ?? 0),
    min3 = el24.dataset.uiSchemaMin,
    max3 = el24.dataset.uiSchemaMax,
    numberValue7 = normalizeNumberValue(value211, Number.isFinite(value212) ? value212 : 0, {
      min: min3 === undefined ? -Infinity : Number(min3),
      max: max3 === undefined ? Infinity : Number(max3),
    }),
    el25 = el24.querySelector('.rh-stepper-value');
  if (!el25) return;
  const value213 = String(el24.dataset.uiSchemaField || '').trim();
  ((el25.textContent =
    value213 === 'rhVideoFrames' && numberValue7 === 0
      ? t('aigenImage.uiSchema.fullLength')
      : String(numberValue7)),
    el25.setAttribute('aria-valuenow', String(numberValue7)));
}
function renderSelect(value214, value215, value216 = {}) {
  const list33 = getVisibleOptions(value214, value216);
  return (
    '<select class="ui-schema-select" data-ui-schema-input="' +
    escapeHtmlAttr(value214.id) +
    '">\n    ' +
    list33
      .map((el26) => {
        const value217 = String(el26?.value ?? ''),
          value218 = String(value215 ?? '') === value217 ? ' selected' : '';
        return (
          '<option value="' +
          escapeHtmlAttr(value217) +
          '"' +
          value218 +
          '>' +
          escapeHtmlAttr(el26?.label ?? value217) +
          '</option>'
        );
      })
      .join('') +
    '\n  </select>'
  );
}
function renderRange(value219, value220, value221, value222 = {}) {
  const list34 = getVisibleOptions(value219, value222),
    list35 = list34.map((el27) => Number(el27?.value ?? el27)).filter(Number.isFinite),
    value223 = Number(value219?.defaultValue ?? list35[0] ?? 0),
    value224 = Number.isFinite(Number(value220)) ? Number(value220) : value223;
  if (value221 === 'stepper') {
    const value225 = value219?.ariaLabel
      ? manifestText(value219.ariaLabel)
      : t('aigenImage.uiSchema.numericValueAria', { label: manifestText(value219?.label || value219.id) });
    return (
      '<div class="rh-stepper" data-key="' +
      escapeHtmlAttr(value219.id) +
      '">\n      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
      escapeHtmlAttr(value225) +
      '" aria-valuenow="' +
      escapeHtmlAttr(value224) +
      '" tabindex="0">' +
      escapeHtmlAttr(value224) +
      '</div>\n    </div>'
    );
  }
  const value226 = Number(value219?.min ?? list35[0] ?? 0),
    value227 = Number(value219?.max ?? list35[list35.length - 1] ?? value226),
    value228 = Number(value219?.step ?? 1);
  return (
    '<div class="ui-schema-range-line">\n    <input class="ui-schema-range" data-ui-schema-input="' +
    escapeHtmlAttr(value219.id) +
    '" type="range" min="' +
    escapeHtmlAttr(value226) +
    '" max="' +
    escapeHtmlAttr(value227) +
    '" step="' +
    escapeHtmlAttr(value228) +
    '" value="' +
    escapeHtmlAttr(value224) +
    '">\n    <span class="ui-schema-value">' +
    escapeHtmlAttr(value224) +
    '</span>\n  </div>'
  );
}
function renderStepperAttrs(value229, value230) {
  if (value230 !== 'stepper') return '';
  const list36 = [];
  return (
    value229?.min !== undefined &&
      value229?.min !== null &&
      list36.push(' data-ui-schema-min="' + escapeHtmlAttr(value229.min) + '"'),
    value229?.max !== undefined &&
      value229?.max !== null &&
      list36.push(' data-ui-schema-max="' + escapeHtmlAttr(value229.max) + '"'),
    list36.push(' data-ui-schema-step="' + escapeHtmlAttr(value229?.step ?? 1) + '"'),
    list36.join('')
  );
}
function renderTextInput(value231, value232, value233) {
  if (value233 === 'textarea')
    return (
      '<textarea class="ui-schema-textarea" data-ui-schema-input="' +
      escapeHtmlAttr(value231.id) +
      '">' +
      escapeHtmlAttr(value232) +
      '</textarea>'
    );
  return (
    '<input class="ui-schema-text" data-ui-schema-input="' +
    escapeHtmlAttr(value231.id) +
    '" type="text" value="' +
    escapeHtmlAttr(value232) +
    '">'
  );
}
function renderAssetInput(value234, value235) {
  const value236 =
    value235 === 'video input'
      ? t('aigenImage.uiSchema.assetInput.video')
      : value235 === 'audio input'
        ? t('aigenImage.uiSchema.assetInput.audio')
        : t('aigenImage.uiSchema.assetInput.image');
  return (
    '<button type="button" class="img-rp-quality-item ui-schema-asset-input" data-ui-schema-input="' +
    escapeHtmlAttr(value234.id) +
    '" data-ui-schema-asset-kind="' +
    escapeHtmlAttr(value235.split(' ')[0]) +
    '">' +
    value236 +
    '</button>'
  );
}
function renderAdvancedRowField(value237, nodeData6) {
  assertSupportedField(value237);
  const value238 = String(value237?.id || '').trim(),
    controlType2 = normalizeControlType(value237?.type),
    fieldValue8 = getFieldValue(nodeData6, value237),
    manifestText18 = manifestText(value237?.label || value238),
    manifestText19 = manifestText(value237?.description || value237?.tooltip || '').trim(),
    value239 = manifestText19
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
        escapeHtmlAttr(manifestText19) +
        '">!</span>'
      : '',
    value240 =
      typeof value237?.defaultValue === 'boolean'
        ? ' data-ui-schema-value-type="boolean"'
        : controlType2 === 'stepper'
          ? ' data-ui-schema-value-type="number"'
          : '',
    value241 = controlType2 === 'stepper' ? ' ui-schema-rh-video-stepper' : '';
  return (
    '<div class="ui-schema-field rh-vram-adv-row' +
    value241 +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(value238) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(controlType2) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(value237?.defaultValue ?? '') +
    '"' +
    getFieldDefaultAliasAttrs(value237) +
    value240 +
    renderStepperAttrs(value237, controlType2) +
    '>\n    <div class="rh-vram-adv-label">\n      <span class="rh-adv-title ui-schema-field-label">' +
    escapeHtmlAttr(manifestText18) +
    '</span>\n      ' +
    value239 +
    '\n    </div>\n    <div class="rh-adv-control-line">' +
    renderControl(value237, fieldValue8, controlType2, { advanced: true, nodeData: nodeData6 }) +
    '</div>\n  </div>'
  );
}
function getRandomSeedAttrs(value242) {
  const value243 = Number.isFinite(Number(value242?.randomSeedMin))
      ? Math.trunc(Number(value242.randomSeedMin))
      : RANDOM_SEED_DEFAULT_MIN,
    value244 = Number.isFinite(Number(value242?.randomSeedMax))
      ? Math.trunc(Number(value242.randomSeedMax))
      : RANDOM_SEED_DEFAULT_MAX,
    value245 = Math.min(value243, value244),
    value246 = Math.max(value243, value244),
    value247 = String(value242?.randomSeedModeField || '').trim(),
    value248 = String(value242?.randomSeedDefaultMode || 'fixed').trim() || 'fixed',
    value249 = value247
      ? ' data-ui-schema-random-seed-mode-field="' +
        escapeHtmlAttr(value247) +
        '" data-ui-schema-random-seed-mode-default="' +
        escapeHtmlAttr(value248) +
        '"'
      : '';
  return (
    ' data-ui-schema-random-seed-min="' +
    escapeHtmlAttr(value245) +
    '" data-ui-schema-random-seed-max="' +
    escapeHtmlAttr(value246) +
    '"' +
    value249
  );
}
function normalizeRandomSeedMode(value250, value251 = 'fixed') {
  const value252 = String(value250 ?? value251)
    .trim()
    .toLowerCase();
  return value252 === 'random' ? 'random' : 'fixed';
}
function getRandomSeedModeFromNodeData(value253, value254) {
  const value255 = String(value254?.randomSeedModeField || '').trim();
  return normalizeRandomSeedMode(
    value255 ? getNodeFieldValue(value253, value255, value254?.randomSeedDefaultMode || 'fixed') : 'fixed',
    value254?.randomSeedDefaultMode || 'fixed',
  );
}
function renderRandomSeedModeButtons(value256, value257, label3) {
  const enabled17 = String(value256?.randomSeedModeField || '').trim(),
    label4 = t('aigenImage.uiSchema.random'),
    label5 = t('aigenImage.uiSchema.fixed');
  if (!enabled17)
    return (
      '<button type="button" class="img-rp-quality-item ui-schema-random-seed-btn" data-ui-schema-random-seed="true" aria-label="' +
      escapeHtmlAttr(t('aigenImage.uiSchema.randomAria', { label: label3 })) +
      '">' +
      escapeHtmlAttr(label4) +
      '</button>'
    );
  const list37 = [
    { value: 'random', label: label4 },
    { value: 'fixed', label: label5 },
  ];
  return list37
    .map(
      (el28) =>
        '<button type="button" class="img-rp-quality-item ui-schema-random-seed-mode-btn ' +
        (value257 === el28.value ? 'active' : '') +
        '" data-ui-schema-random-seed-mode="' +
        escapeHtmlAttr(el28.value) +
        '" data-ui-schema-random-seed-mode-field="' +
        escapeHtmlAttr(enabled17) +
        '" aria-label="' +
        escapeHtmlAttr('' + label3 + el28.label) +
        '">' +
        escapeHtmlAttr(el28.label) +
        '</button>',
    )
    .join('');
}
function syncRandomSeedField(el29, value258 = {}) {
  if (!el29?.classList?.contains?.('ui-schema-random-seed-row')) return;
  const enabled18 = String(el29.dataset.uiSchemaRandomSeedModeField || '').trim();
  if (!enabled18) return;
  const randomSeedMode = normalizeRandomSeedMode(
    getNodeFieldValue(value258, enabled18, el29.dataset.uiSchemaRandomSeedModeDefault || 'fixed'),
    el29.dataset.uiSchemaRandomSeedModeDefault || 'fixed',
  );
  el29.querySelectorAll('[data-ui-schema-random-seed-mode]').forEach((el30) => {
    el30.classList.toggle('active', String(el30.dataset.uiSchemaRandomSeedMode || '') === randomSeedMode);
  });
}
function renderRandomSeedRowField(value259, nodeData7) {
  assertSupportedField(value259);
  const value260 = String(value259?.id || '').trim(),
    controlType3 = normalizeControlType(value259?.type),
    fieldValue9 = getFieldValue(nodeData7, value259),
    randomSeedModeFromNodeData = getRandomSeedModeFromNodeData(nodeData7, value259),
    manifestText20 = manifestText(value259?.label || value260),
    manifestText21 = manifestText(value259?.description || value259?.tooltip || '').trim(),
    value261 = manifestText21
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
        escapeHtmlAttr(manifestText21) +
        '">!</span>'
      : '',
    value262 = controlType3 === 'stepper' ? ' data-ui-schema-value-type="number"' : '',
    value263 = controlType3 === 'stepper' ? ' ui-schema-rh-video-stepper' : '';
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-random-seed-row' +
    value263 +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(value260) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(controlType3) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(value259?.defaultValue ?? '') +
    '"' +
    getFieldDefaultAliasAttrs(value259) +
    value262 +
    renderStepperAttrs(value259, controlType3) +
    getRandomSeedAttrs(value259) +
    '>\n    <div class="rh-vram-adv-label">\n      <span class="rh-adv-title ui-schema-field-label">' +
    escapeHtmlAttr(manifestText20) +
    '</span>\n      ' +
    value261 +
    '\n    </div>\n    <div class="rh-adv-control-line">\n      ' +
    renderRandomSeedModeButtons(value259, randomSeedModeFromNodeData, manifestText20) +
    '\n      ' +
    renderControl(value259, fieldValue9, controlType3, { advanced: true, nodeData: nodeData7 }) +
    '\n    </div>\n  </div>'
  );
}
function normalizeRhV54SinglePreset(value264, value265 = 'efficiency') {
  const value266 = String(value264 ?? '').trim();
  return value266 === 'efficiency' || value266 === 'stable' || value266 === 'quality' ? value266 : value265;
}
function normalizeRhV54SpecialMode(value267) {
  const value268 = String(value267 ?? '').trim();
  return value268 === 'longVideoOverlay' || value268 === 'cameraMove' ? value268 : '';
}
function normalizeRhV54MaskExpand(value269, value270 = 25) {
  const value271 = Number(value269);
  return Number.isFinite(value271) ? Math.max(-9999, Math.min(9999, Math.trunc(value271))) : value270;
}
function getStepPrecision(value272) {
  const list38 = String(value272 ?? ''),
    list39 = list38.includes('.') ? list38.split('.')[1] : '';
  return Math.min(Math.max(list39.length, 0), 8);
}
function normalizeRhV54BreastJiggle(
  value273,
  { min: min = 0, max: max = 1, step: step = 0.05, fallback: fallback = 0 } = {},
) {
  const value274 = Number(value273),
    value275 = Number(fallback),
    value276 = Number(min),
    value277 = Number(max),
    count2 = Number(step),
    value278 = Number.isFinite(value276) ? value276 : 0,
    value279 = Number.isFinite(value277) ? value277 : 1,
    value280 = Number.isFinite(value275) ? value275 : value278,
    value281 = Math.max(
      Math.min(value278, value279),
      Math.min(Math.max(value278, value279), Number.isFinite(value274) ? value274 : value280),
    );
  if (!Number.isFinite(count2) || count2 <= 0) return value281;
  const value282 = value278 + Math.round((value281 - value278) / count2) * count2;
  return Math.max(Math.min(value278, value279), Math.min(Math.max(value278, value279), value282));
}
function formatRhV54BreastJiggle(value283, value284 = {}) {
  const rhV54BreastJiggle = normalizeRhV54BreastJiggle(value283, value284);
  return String(Number(rhV54BreastJiggle.toFixed(getStepPrecision(value284.step ?? 0.05))));
}
function getRhV54BreastJiggleRangeFromFieldEl(el31) {
  const min4 = Number(el31?.dataset?.uiSchemaMin ?? 0),
    max4 = Number(el31?.dataset?.uiSchemaMax ?? 1),
    step2 = Number(el31?.dataset?.uiSchemaStep ?? 0.05),
    fallback2 = Number(el31?.dataset?.uiSchemaDefault ?? min4);
  return { min: min4, max: max4, step: step2, fallback: fallback2 };
}
function renderRhV54FieldLabel(value285) {
  const value286 = String(value285?.id || '').trim(),
    manifestText22 = manifestText(value285?.label || value286),
    manifestText23 = manifestText(value285?.description || value285?.tooltip || '').trim(),
    value287 = manifestText23
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
        escapeHtmlAttr(manifestText23) +
        '">!</span>'
      : '';
  return (
    '<div class="rh-vram-adv-label"><span>' + escapeHtmlAttr(manifestText22) + '</span>' + value287 + '</div>'
  );
}
function renderRhV54SegmentButton({
  key: key2,
  value: value288,
  label: label6,
  active: active,
  disabled: disabled = false,
  attrs: attrs = '',
}) {
  const value289 = attrs || (disabled ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"' : ''),
    value290 = ['img-rp-quality-item', 'rh-adv-seg-btn', active ? 'active' : '', disabled ? 'disabled' : '']
      .filter(Boolean)
      .join(' ');
  return (
    '<button type="button" class="' +
    value290 +
    '" data-key="' +
    escapeHtmlAttr(key2) +
    '" data-value="' +
    escapeHtmlAttr(value288) +
    '" data-ui-schema-value="' +
    escapeHtmlAttr(value288) +
    '"' +
    value289 +
    '>' +
    escapeHtmlAttr(label6) +
    '</button>'
  );
}
function renderAdvancedSelectionControl(value291, value292, nodeData8 = {}) {
  const key3 = String(value291?.id || '').trim(),
    controlType4 = normalizeControlType(value291?.type),
    value293 = [
      Object.freeze({ value: true, label: t('aigenImage.uiSchema.yes') }),
      Object.freeze({ value: false, label: t('aigenImage.uiSchema.no') }),
    ],
    list40 =
      controlType4 === 'toggle' && !Array.isArray(value291?.options)
        ? value293
        : getVisibleOptions(value291, nodeData8),
    list41 = list40.length ? list40 : value293;
  return (
    '<div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    list41
      .map((item41) => {
        const value294 = getOptionValue(item41),
          label7 = manifestText(item41?.label ?? value294),
          active2 = String(value292 ?? '') === value294,
          disabled2 = isOptionDisabled(value291, item41, nodeData8);
        return renderRhV54SegmentButton({
          key: key3,
          value: value294,
          label: label7,
          active: active2,
          disabled: disabled2,
          attrs: getOptionDisabledAttrs(value291, item41, { nodeData: nodeData8 }),
        });
      })
      .join('') +
    '\n    </div>'
  );
}
function renderRhV54ControlModeField(value295, value296) {
  assertSupportedField(value295);
  const value297 = String(value295?.id || '').trim(),
    value298 = String(getNodeFieldValue(value296, 'rhControlMode', 'single') || 'single'),
    rhV54SinglePreset = normalizeRhV54SinglePreset(
      getNodeFieldValue(value296, 'rhSingleControlPreset', value295?.defaultValue),
      String(value295?.defaultValue || 'efficiency'),
    ),
    active3 = value298 === 'multi' ? 'multi' : rhV54SinglePreset;
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-control-mode" data-ui-schema-field="' +
    escapeHtmlAttr(value297) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(value295?.defaultValue ?? '') +
    '">\n    ' +
    renderRhV54FieldLabel(value295) +
    '\n    <div class="rh-adv-control-line">\n      <div class="rh-adv-single-group ' +
    (value298 !== 'multi' ? 'active' : '') +
    '">\n        <span class="rh-adv-single-title">' +
    escapeHtmlAttr(t('aigenImage.uiSchema.singleControl')) +
    '</span>\n        <span class="rh-adv-single-colon" aria-hidden="true">' +
    escapeHtmlAttr(t('aigenImage.uiSchema.controlColon')) +
    '</span>\n        <div class="img-rp-quality-segmented rh-adv-seg rh-adv-control-seg">\n          ' +
    renderRhV54SegmentButton({
      key: 'rhSingleControlPreset',
      value: 'efficiency',
      label: t('aigenImage.uiSchema.efficiency'),
      active: active3 === 'efficiency',
    }) +
    '\n          ' +
    renderRhV54SegmentButton({
      key: 'rhSingleControlPreset',
      value: 'stable',
      label: t('aigenImage.uiSchema.stable'),
      active: active3 === 'stable',
    }) +
    '\n        </div>\n      </div>\n      <span class="rh-adv-control-split" aria-hidden="true"></span>\n      <div class="rh-adv-multi-group ' +
    (value298 === 'multi' ? 'active' : '') +
    '">\n        ' +
    renderRhV54SegmentButton({
      key: 'rhControlMode',
      value: 'multi',
      label: t('aigenImage.uiSchema.multiControl'),
      active: active3 === 'multi',
    }) +
    '\n      </div>\n    </div>\n  </div>'
  );
}
function renderRhV54BooleanRowField(value299, value300) {
  assertSupportedField(value299);
  const key4 = String(value299?.id || '').trim(),
    value301 =
      value299?.disableWhenSpecialMode === 'cameraMove' &&
      normalizeRhV54SpecialMode(getNodeFieldValue(value300, 'rhSpecialMode', '')) === 'cameraMove',
    value302 = key4 === 'rhSubtractSubject' && value300?.rhV54HasMaskVideo === true,
    active4 = value302 ? false : getNodeFieldValue(value300, key4, value299?.defaultValue) === true;
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-boolean-row ' +
    (value301 || value302 ? 'is-rh-disabled' : '') +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(key4) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="boolean" data-ui-schema-default="' +
    escapeHtmlAttr(value299?.defaultValue ?? '') +
    '"' +
    (value299?.disableWhenSpecialMode
      ? ' data-rh-v54-disable-on-special="' + escapeHtmlAttr(value299.disableWhenSpecialMode) + '"'
      : '') +
    (value302 ? ' data-rh-v54-disable-on-mask-video="true"' : '') +
    '>\n    ' +
    renderRhV54FieldLabel(value299) +
    '\n    <div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    renderRhV54SegmentButton({
      key: key4,
      value: 'true',
      label: t('aigenImage.uiSchema.yes'),
      active: active4,
    }) +
    '\n      ' +
    renderRhV54SegmentButton({
      key: key4,
      value: 'false',
      label: t('aigenImage.uiSchema.no'),
      active: !active4,
    }) +
    '\n    </div>\n  </div>'
  );
}
function renderRhV54MaskExpandField(value303, value304) {
  assertSupportedField(value303);
  const value305 = String(value303?.id || '').trim(),
    nodeFieldValue = getNodeFieldValue(value304, value305, value303?.defaultValue ?? 25),
    rhV54MaskExpand = normalizeRhV54MaskExpand(nodeFieldValue, Number(value303?.defaultValue ?? 25)),
    value306 = value303?.ariaLabel
      ? manifestText(value303.ariaLabel)
      : t('aigenImage.uiSchema.numericValueAria', { label: manifestText(value303?.label || value305) }),
    value307 =
      value303?.disableWhenSpecialMode === 'cameraMove' &&
      normalizeRhV54SpecialMode(getNodeFieldValue(value304, 'rhSpecialMode', '')) === 'cameraMove';
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-mask-expand ' +
    (value307 ? 'is-rh-disabled' : '') +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(value305) +
    '" data-ui-schema-type="stepper" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(value303?.defaultValue ?? '') +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(value303?.min ?? -9999) +
    '" data-ui-schema-max="' +
    escapeHtmlAttr(value303?.max ?? 9999) +
    '" data-ui-schema-step="' +
    escapeHtmlAttr(value303?.step ?? 1) +
    '"' +
    (value303?.disableWhenSpecialMode
      ? ' data-rh-v54-disable-on-special="' + escapeHtmlAttr(value303.disableWhenSpecialMode) + '"'
      : '') +
    '>\n    ' +
    renderRhV54FieldLabel(value303) +
    '\n    <div class="rh-stepper" data-key="' +
    escapeHtmlAttr(value305) +
    '">\n      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
    escapeHtmlAttr(value306) +
    '" aria-valuenow="' +
    escapeHtmlAttr(rhV54MaskExpand) +
    '" tabindex="0">' +
    escapeHtmlAttr(rhV54MaskExpand) +
    '</div>\n    </div>\n  </div>'
  );
}
function renderRhV54SpecialModeField(value308, value309) {
  assertSupportedField(value308);
  const key5 = String(value308?.id || '').trim(),
    active5 = normalizeRhV54SpecialMode(getNodeFieldValue(value309, key5, '')),
    list42 = getRenderableOptions(value308).filter((el32) => el32?.hidden !== true);
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-special-mode" data-ui-schema-field="' +
    escapeHtmlAttr(key5) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(value308?.defaultValue ?? '') +
    '">\n    ' +
    renderRhV54FieldLabel(value308) +
    '\n    <div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    list42
      .map((item42) => {
        const value310 = getOptionValue(item42);
        return renderRhV54SegmentButton({
          key: key5,
          value: value310,
          label: manifestText(item42?.label ?? value310),
          active: active5 === value310,
        });
      })
      .join('') +
    '\n    </div>\n  </div>'
  );
}
function renderRhV54BreastJiggleField(value311, value312) {
  assertSupportedField(value311);
  const value313 = String(value311?.id || '').trim(),
    min5 = Number(value311?.min ?? 0),
    max5 = Number(value311?.max ?? 1),
    step3 = Number(value311?.step ?? 0.05),
    fallback3 = Number(value311?.defaultValue ?? min5),
    formatRhV54BreastJiggle2 = formatRhV54BreastJiggle(
      getNodeFieldValue(value312, value313, value311?.defaultValue ?? 0),
      { min: min5, max: max5, step: step3, fallback: fallback3 },
    );
  return (
    '<div class="ui-schema-field rh-vram-adv-row rh-breast-jiggle-row ui-schema-rh-v54-breast-jiggle" data-ui-schema-field="' +
    escapeHtmlAttr(value313) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(value311?.defaultValue ?? '') +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(min5) +
    '" data-ui-schema-max="' +
    escapeHtmlAttr(max5) +
    '" data-ui-schema-step="' +
    escapeHtmlAttr(step3) +
    '">\n    ' +
    renderRhV54FieldLabel(value311) +
    '\n    <div class="rh-breast-jiggle-control">\n      <input type="range" class="rh-breast-jiggle-slider" data-ui-schema-input="' +
    escapeHtmlAttr(value313) +
    '" min="' +
    escapeHtmlAttr(min5) +
    '" max="' +
    escapeHtmlAttr(max5) +
    '" step="' +
    escapeHtmlAttr(step3) +
    '" value="' +
    escapeHtmlAttr(formatRhV54BreastJiggle2) +
    '" aria-label="' +
    escapeHtmlAttr(manifestText(value311?.ariaLabel || value311?.label || value313)) +
    '">\n      <span class="rh-breast-jiggle-value">' +
    escapeHtmlAttr(formatRhV54BreastJiggle2) +
    '</span>\n    </div>\n  </div>'
  );
}
function renderField(value314, nodeData9, value315 = {}) {
  assertSupportedField(value314);
  const value316 = String(value314?.id || '').trim(),
    controlType5 = normalizeControlType(value314?.type),
    value317 = value314?.variant || value315?.variant;
  if (value317 === 'rhV54ControlMode') return renderRhV54ControlModeField(value314, nodeData9);
  if (value317 === 'rhV54BooleanRow') return renderRhV54BooleanRowField(value314, nodeData9);
  if (value317 === 'rhV54MaskExpand') return renderRhV54MaskExpandField(value314, nodeData9);
  if (value317 === 'rhV54SpecialMode') return renderRhV54SpecialModeField(value314, nodeData9);
  if (value317 === 'rhV54BreastJiggle') return renderRhV54BreastJiggleField(value314, nodeData9);
  if (value317 === 'advancedRow') return renderAdvancedRowField(value314, nodeData9);
  if (value317 === 'randomSeedRow') return renderRandomSeedRowField(value314, nodeData9);
  if (value317 === 'pillMenu' && controlType5 === 'segmented')
    return renderPillMenuField(value314, nodeData9);
  if (value317 === 'ratioPill' && controlType5 === 'segmented')
    return renderAspectRatioPillField(value314, nodeData9);
  if (value317 === 'sectionMenu' && controlType5 === 'segmented')
    return renderSectionMenuField(value314, nodeData9);
  if (value317 === 'resolutionPill' && controlType5 === 'segmented')
    return renderPillMenuField(value314, nodeData9);
  if (value317 === 'resolutionPill' && controlType5 === 'slider')
    return renderResolutionPillField(value314, nodeData9);
  if (value317 === 'durationPill' && controlType5 === 'slider')
    return renderDurationPillField(value314, nodeData9);
  if (value317 === 'instanceToggle' && controlType5 === 'segmented')
    return renderInstanceToggleField(value314, nodeData9);
  const fieldValue10 = getFieldValue(nodeData9, value314),
    manifestText24 = manifestText(value314?.label || value316),
    value318 = value314?.defaultValue ?? '',
    renderControl2 = renderControl(value314, fieldValue10, controlType5, { nodeData: nodeData9 }),
    value319 = controlType5 === 'stepper' ? ' ui-schema-rh-video-stepper' : '',
    value320 = controlType5 === 'stepper' ? ' data-ui-schema-value-type="number"' : '';
  return (
    '<div class="ui-schema-field' +
    value319 +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(value316) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(controlType5) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(value318) +
    '"' +
    value320 +
    renderStepperAttrs(value314, controlType5) +
    '>\n    <div class="rh-adv-title ui-schema-field-label">' +
    escapeHtmlAttr(manifestText24) +
    '</div>\n    <div class="ui-schema-field-control">' +
    renderControl2 +
    '</div>\n  </div>'
  );
}
function renderResolutionPlacementFields(list43, value321, value322 = {}) {
  const fieldById11 = getFieldById(list43, 'rhVideoResolution') || getFieldById(list43, 'videoResolution');
  if (fieldById11) {
    const map3 = new Set(['rhVideoResolution', 'videoResolution', 'rhVideoFps', 'rhVideoFrames']),
      list44 = list43.filter((item43) => !map3.has(String(item43?.id || '').trim()));
    return [
      renderVideoResolutionField(list43, value321),
      ...list44.map((item44) => renderField(item44, value321, value322)),
    ].join('');
  }
  const map4 = new Set(['imageSize', 'resolution', 'videoSize', 'quality']),
    list45 = list43.filter((item45) => {
      const value323 = String(item45?.id || '').trim(),
        value324 = String(item45?.displayRole || '').trim();
      return value324 === 'resolution' || map4.has(value323);
    }),
    value325 = list45[0] || null,
    fieldById12 = getFieldById(list43, 'aspectRatio') || getFieldByDisplayRole(list43, 'aspectRatio');
  if (value325 && fieldById12) {
    const list46 = list43.filter((item46) => {
      const value326 = String(item46?.id || '').trim();
      return (
        !list45.some((item47) => String(item47?.id || '').trim() === value326) && value326 !== 'aspectRatio'
      );
    });
    return [
      renderQualityRatioField(list45, fieldById12, value321),
      ...list46.map((item48) => renderField(item48, value321, value322)),
    ].join('');
  }
  return list43.map((item49) => renderField(item49, value321, value322)).join('');
}
function renderModePlacementFields(list47, value327, value328 = {}) {
  const list48 = list47.filter((item50) => String(item50?.variant || '').trim() === 'sectionMenu');
  if (list48.length >= 2) {
    const map5 = new Set(list48.map((item51) => String(item51?.id || '').trim())),
      list49 = list47.filter((item52) => !map5.has(String(item52?.id || '').trim()));
    return [
      renderSectionPairField(list48, value327),
      ...list49.map((item53) => renderField(item53, value327, value328)),
    ].join('');
  }
  return list47.map((item54) => renderField(item54, value327, value328)).join('');
}
export function hasModelUiSchema(value329, value330 = {}) {
  const list50 = getUiSchemaFields(value329, value330);
  return (list50.forEach(assertSupportedField), list50.length > 0);
}
function renderUiSchemaControls(value331, value332 = {}, value333 = {}) {
  const list51 = filterVisibleUiSchemaFields(filterUiSchemaFields(value331, value333), value332);
  if (!list51.length) return '';
  const placement4 = normalizePlacement(value333?.placement),
    enabled19 =
      placement4 === 'resolution'
        ? renderResolutionPlacementFields(list51, value332, value333)
        : placement4 === 'mode'
          ? renderModePlacementFields(list51, value332, value333)
          : placement4 === 'videoparams'
            ? renderRhVideoParamsPlacementFields(list51, value332, value333)
            : list51.map((item55) => renderField(item55, value332, value333)).join('');
  if (!enabled19) return '';
  if (value333?.unwrap === true) return enabled19;
  const value334 = placement4 ? ' data-ui-schema-placement="' + escapeHtmlAttr(placement4) + '"' : '',
    value335 = value333?.modelId ? ' data-ui-schema-model="' + escapeHtmlAttr(value333.modelId) + '"' : '',
    value336 = value333?.sourceId ? ' data-ui-schema-source="' + escapeHtmlAttr(value333.sourceId) + '"' : '';
  return '<div class="ui-schema-renderer"' + value335 + value336 + value334 + '>' + enabled19 + '</div>';
}
export function renderModelUiSchemaControls(modelId, value337 = {}, args8 = {}) {
  const uiSchemaFields = getUiSchemaFields(modelId, args8);
  return renderUiSchemaControls(uiSchemaFields, value337, { ...args8, modelId: modelId });
}
export function renderUiSchemaFields(value338, value339 = {}, args9 = {}) {
  return renderUiSchemaControls(value338, value339, { ...args9, ignorePlacementFilter: true });
}
export function buildUiSchemaParamPatch(options3 = {}, value340 = '', value341 = '') {
  const enabled20 = String(value340 || '').trim();
  if (!enabled20) return {};
  const uiSchemaModelIdForNode = getUiSchemaModelIdForNode(options3),
    modelManifest2 = getModelManifest(uiSchemaModelIdForNode),
    value342 = Array.isArray(modelManifest2?.uiSchema?.fields)
      ? modelManifest2.uiSchema.fields.find((item56) => String(item56?.id || '').trim() === enabled20)
      : null,
    value343 = value342 ? normalizeUiSchemaFieldValue(value342, value341) : value341,
    plainGenerationParams = getPlainGenerationParams(options3.generationParams);
  plainGenerationParams[enabled20] = value343;
  const generationParams = sanitizeModelUiSchemaParams(
      uiSchemaModelIdForNode || options3?.model,
      plainGenerationParams,
      {
        includeDefaults: false,
      },
    ),
    value344 = { generationParams: generationParams },
    generationParamsMemoryKey = getGenerationParamsMemoryKey(options3);
  return (
    generationParamsMemoryKey &&
      (value344.generationParamsByModel = {
        ...getPlainGenerationParams(options3.generationParamsByModel),
        [generationParamsMemoryKey]: generationParams,
      }),
    value344
  );
}
export function buildModelUiSchemaDefaultParams(value345) {
  const list52 = getUiSchemaFields(value345);
  return (list52.forEach(assertSupportedField), sanitizeModelUiSchemaParams(value345));
}
function bindUiSchemaControls(el33, { getNodeData: getNodeData, commitFieldValue: commitFieldValue } = {}) {
  if (!el33 || typeof commitFieldValue !== 'function') return () => {};
  const run3 = (value346, value347) => {
    const args10 = typeof getNodeData === 'function' ? getNodeData() || {} : {},
      value348 = commitFieldValue(value346, value347, args10),
      args11 =
        value348 && typeof value348 === 'object'
          ? value348
          : typeof getNodeData === 'function'
            ? getNodeData() || args10
            : args10;
    syncModelUiSchemaControls(el33, { ...args10, ...args11 });
  };
  let box = null,
    value349 = false,
    box2 = null,
    value350 = false;
  const map6 = new Map(),
    handler4 = (value351) => {
      const value352 = map6.get(value351);
      if (value352?.timer) clearTimeout(value352.timer);
      map6.delete(value351);
    },
    handler5 = () => {
      Array.from(map6.entries()).forEach(([value353, el34]) => {
        if (el34?.timer) clearTimeout(el34.timer);
        (map6.delete(value353), run3(value353, el34?.value ?? ''));
      });
    },
    handler6 = (value354, value355) => {
      handler4(value354);
      const timer = setTimeout(() => {
        (map6.delete(value354), run3(value354, value355));
      }, 180);
      map6.set(value354, { timer: timer, value: value355 });
    },
    handler7 = (el35) => {
      const value356 = String(el35?.closest?.('[data-ui-schema-field]')?.dataset?.uiSchemaType || '')
          .trim()
          .toLowerCase(),
        value357 = String(el35?.tagName || '')
          .trim()
          .toLowerCase(),
        value358 = String(el35?.type || '')
          .trim()
          .toLowerCase();
      return value356 === 'text' || value356 === 'textarea' || value357 === 'textarea' || value358 === 'text';
    },
    handler8 = (el36) => {
      if (!el36?.addEventListener) return false;
      let setTimeout2 = null;
      const run4 = () => {
          (el36.removeEventListener('click', value359, true),
            setTimeout2 && (clearTimeout(setTimeout2), (setTimeout2 = null)));
        },
        value359 = (event) => {
          (event.preventDefault?.(), event.stopPropagation?.(), event.stopImmediatePropagation?.(), run4());
        };
      return (el36.addEventListener('click', value359, true), (setTimeout2 = setTimeout(run4, 350)), true);
    },
    handler9 = (value360, value361) => {
      const value362 = Number(value360);
      return Number.isFinite(value362) ? value362 : value361;
    },
    handler10 = () => {
      const value363 = globalThis.crypto || globalThis.window?.crypto;
      if (value363?.getRandomValues) {
        const uint32Array = new Uint32Array(1);
        return (value363.getRandomValues(uint32Array), uint32Array[0] / 0x100000000);
      }
      return Math.random();
    },
    handler11 = (el37) => {
      const value364 = Math.trunc(handler9(el37?.dataset?.uiSchemaRandomSeedMin, RANDOM_SEED_DEFAULT_MIN)),
        value365 = Math.trunc(handler9(el37?.dataset?.uiSchemaRandomSeedMax, RANDOM_SEED_DEFAULT_MAX)),
        value366 = Math.min(value364, value365),
        value367 = Math.max(value364, value365);
      return String(value366 + Math.floor(handler10() * (value367 - value366 + 1)));
    },
    handler12 = (el38, value368) => {
      const value369 = handler9(el38?.dataset?.uiSchemaDefault, 0),
        value370 = handler9(el38?.dataset?.uiSchemaMin, -Infinity),
        value371 = handler9(el38?.dataset?.uiSchemaMax, Infinity),
        evaluateUiSchemaNumberExpression2 = evaluateUiSchemaNumberExpression(value368),
        value372 = Number.isFinite(evaluateUiSchemaNumberExpression2)
          ? Math.trunc(evaluateUiSchemaNumberExpression2)
          : value369;
      return Math.max(value370, Math.min(value371, value372));
    },
    handler13 = (el39, value373) => {
      const value374 = String(el39?.dataset?.uiSchemaField || '').trim();
      return value374 === 'rhVideoFrames' && Number(value373) === 0
        ? t('aigenImage.uiSchema.fullLength')
        : String(value373);
    },
    handler14 = (el40, value375) => {
      const value376 = handler12(el40, value375),
        el41 = el40?.querySelector?.('.rh-stepper-value');
      return (
        el41 &&
          ((el41.textContent = handler13(el40, value376)),
          el41.setAttribute('aria-valuenow', String(value376))),
        value376
      );
    },
    handler15 = (el42) => {
      const value377 = String(el42?.dataset?.uiSchemaField || '').trim(),
        value378 = typeof getNodeData === 'function' ? getNodeData() || {} : {};
      return handler12(el42, getNodeFieldValue(value378, value377, el42?.dataset?.uiSchemaDefault ?? 0));
    },
    handler16 = (el43) => {
      const el44 = el43?.closest?.('.ui-schema-rh-video-stepper'),
        enabled21 = String(el44?.dataset?.uiSchemaField || '').trim();
      if (!el44 || !enabled21) return;
      const value379 = handler15(el44),
        el45 = el33.ownerDocument?.createElement?.('input');
      if (!el45) return;
      ((el45.className = 'rh-stepper-input'),
        (el45.type = 'text'),
        (el45.autocomplete = 'off'),
        (el45.step = String(el44.dataset.uiSchemaStep || '1')),
        (el45.min = String(el44.dataset.uiSchemaMin || '0')),
        (el45.max = String(el44.dataset.uiSchemaMax || '')),
        (el45.value = String(value379)));
      let value380 = false;
      const run5 = (value381) => {
        if (value380) return;
        value380 = true;
        const value382 = value381 ? handler12(el44, el45.value) : value379,
          el46 = el33.ownerDocument.createElement('div');
        ((el46.className = 'rh-stepper-value'),
          el46.setAttribute('role', 'spinbutton'),
          el46.setAttribute('tabindex', '0'),
          el46.setAttribute(
            'aria-label',
            el43.getAttribute('aria-label') ||
              el44.querySelector('.rh-vram-adv-label span')?.textContent ||
              enabled21,
          ),
          (el46.textContent = handler13(el44, value382)),
          el46.setAttribute('aria-valuenow', String(value382)),
          el45.replaceWith(el46));
        if (value381) run3(enabled21, value382);
      };
      (el45.addEventListener('click', (event2) => event2.stopPropagation()),
        el45.addEventListener('mousedown', (event3) => event3.stopPropagation()),
        el45.addEventListener('keydown', (event4) => {
          if (event4.key === 'Enter') run5(true);
          if (event4.key === 'Escape') run5(false);
        }),
        el45.addEventListener('blur', () => run5(true)),
        el43.replaceWith(el45),
        el45.focus(),
        el45.select());
    },
    handler17 = () => {
      if (!box2) return;
      (box2.el?.classList?.remove('is-dragging'),
        box2.doc?.removeEventListener?.('mousemove', value383),
        box2.doc?.removeEventListener?.('mouseup', value384),
        (box2 = null));
    },
    value383 = (event5) => {
      if (!box2) return;
      const value385 = event5.clientX - box2.x;
      if (Math.abs(value385) >= 2) box2.dragged = true;
      const value386 = Math.trunc(value385 / 6),
        value387 = handler12(box2.fieldEl, box2.base + value386);
      value387 !== box2.last &&
        ((box2.moved = true), (box2.last = value387), handler14(box2.fieldEl, value387));
    },
    value384 = () => {
      if (!box2) return;
      const value388 = box2;
      (handler17(),
        (value388.dragged || value388.moved) && (value350 = !handler8(value388.doc)),
        value388.moved && run3(value388.fieldId, value388.last));
    },
    handler18 = (el47, value389) => {
      const value390 = handler9(el47?.dataset?.uiSchemaDefault, 25),
        value391 = handler9(el47?.dataset?.uiSchemaMin, -9999),
        value392 = handler9(el47?.dataset?.uiSchemaMax, 9999),
        rhV54MaskExpand2 = normalizeRhV54MaskExpand(value389, value390);
      return Math.max(value391, Math.min(value392, rhV54MaskExpand2));
    },
    handler19 = (el48, value393) => {
      const value394 = handler18(el48, value393),
        el49 = el48?.querySelector?.('.rh-stepper-value');
      return (
        el49 && ((el49.textContent = String(value394)), el49.setAttribute('aria-valuenow', String(value394))),
        value394
      );
    },
    handler20 = (el50) => {
      const value395 = String(el50?.dataset?.uiSchemaField || '').trim(),
        value396 = typeof getNodeData === 'function' ? getNodeData() || {} : {};
      return handler18(el50, getNodeFieldValue(value396, value395, el50?.dataset?.uiSchemaDefault ?? 25));
    },
    handler21 = (el51) => {
      const el52 = el51?.closest?.('.ui-schema-rh-v54-mask-expand'),
        enabled22 = String(el52?.dataset?.uiSchemaField || '').trim();
      if (!el52 || !enabled22 || el52.classList?.contains('is-rh-disabled')) return;
      const value397 = handler20(el52),
        el53 = el33.ownerDocument?.createElement?.('input');
      if (!el53) return;
      ((el53.className = 'rh-stepper-input'),
        (el53.type = 'number'),
        (el53.step = String(el52.dataset.uiSchemaStep || '1')),
        (el53.min = String(el52.dataset.uiSchemaMin || '-9999')),
        (el53.max = String(el52.dataset.uiSchemaMax || '9999')),
        (el53.value = String(value397)));
      let value398 = false;
      const run6 = (value399) => {
        if (value398) return;
        value398 = true;
        const value400 = value399 ? handler18(el52, el53.value) : value397,
          el54 = el33.ownerDocument.createElement('div');
        ((el54.className = 'rh-stepper-value'),
          el54.setAttribute('role', 'spinbutton'),
          el54.setAttribute('tabindex', '0'),
          el54.setAttribute(
            'aria-label',
            el51.getAttribute('aria-label') || t('aigenImage.uiSchema.maskExpandValue'),
          ),
          (el54.textContent = String(value400)),
          el54.setAttribute('aria-valuenow', String(value400)),
          el53.replaceWith(el54));
        if (value399) run3(enabled22, value400);
      };
      (el53.addEventListener('click', (event6) => event6.stopPropagation()),
        el53.addEventListener('mousedown', (event7) => event7.stopPropagation()),
        el53.addEventListener('keydown', (event8) => {
          if (event8.key === 'Enter') run6(true);
          if (event8.key === 'Escape') run6(false);
        }),
        el53.addEventListener('blur', () => run6(true)),
        el51.replaceWith(el53),
        el53.focus(),
        el53.select());
    },
    handler22 = () => {
      if (!box) return;
      (box.el?.classList?.remove('is-dragging'),
        box.doc?.removeEventListener?.('mousemove', value401),
        box.doc?.removeEventListener?.('mouseup', value402),
        (box = null));
    },
    value401 = (event9) => {
      if (!box) return;
      const value403 = event9.clientX - box.x;
      if (Math.abs(value403) >= 2) box.dragged = true;
      const value404 = Math.trunc(value403 / 6),
        value405 = handler18(box.fieldEl, box.base + value404);
      value405 !== box.last && ((box.moved = true), (box.last = value405), handler19(box.fieldEl, value405));
    },
    value402 = () => {
      if (!box) return;
      const value406 = box;
      (handler22(),
        (value406.dragged || value406.moved) && (value349 = !handler8(value406.doc)),
        value406.moved && run3(value406.fieldId, value406.last));
    },
    value407 = (x) => {
      const el55 = x.target?.closest?.('.ui-schema-rh-video-stepper .rh-stepper-value');
      if (el55 && x.button === 0) {
        const fieldEl = el55.closest('.ui-schema-rh-video-stepper'),
          fieldId = String(fieldEl?.dataset?.uiSchemaField || '').trim();
        if (!fieldEl || !fieldId) return;
        const doc = el33.ownerDocument || globalThis.document;
        if (!doc) return;
        (x.preventDefault(), x.stopPropagation());
        const base = handler15(fieldEl);
        (handler17(),
          (box2 = {
            x: x.clientX,
            base: base,
            last: base,
            moved: false,
            dragged: false,
            fieldEl: fieldEl,
            fieldId: fieldId,
            el: el55,
            doc: doc,
          }),
          el55.classList.add('is-dragging'),
          doc.addEventListener('mousemove', value383),
          doc.addEventListener('mouseup', value384));
        return;
      }
      const el56 = x.target?.closest?.('.ui-schema-rh-v54-mask-expand .rh-stepper-value');
      if (!el56 || x.button !== 0) return;
      const fieldEl2 = el56.closest('.ui-schema-rh-v54-mask-expand'),
        fieldId2 = String(fieldEl2?.dataset?.uiSchemaField || '').trim();
      if (!fieldEl2 || !fieldId2 || fieldEl2.classList?.contains('is-rh-disabled')) return;
      const doc2 = el33.ownerDocument || globalThis.document;
      if (!doc2) return;
      (x.preventDefault(), x.stopPropagation());
      const base2 = handler20(fieldEl2);
      (handler22(),
        (box = {
          x: x.clientX,
          base: base2,
          last: base2,
          moved: false,
          dragged: false,
          fieldEl: fieldEl2,
          fieldId: fieldId2,
          el: el56,
          doc: doc2,
        }),
        el56.classList.add('is-dragging'),
        doc2.addEventListener('mousemove', value401),
        doc2.addEventListener('mouseup', value402));
    },
    value408 = (event10) => {
      const el57 = event10.target?.closest?.('[data-ui-schema-random-seed-mode]');
      if (el57) {
        (event10.preventDefault?.(), event10.stopPropagation?.());
        const el58 = el57.closest('[data-ui-schema-field]'),
          enabled23 = String(
            el57.dataset.uiSchemaRandomSeedModeField || el58?.dataset?.uiSchemaRandomSeedModeField || '',
          ).trim(),
          randomSeedMode2 = normalizeRandomSeedMode(el57.dataset.uiSchemaRandomSeedMode, 'fixed');
        if (!enabled23) return;
        run3(enabled23, randomSeedMode2);
        if (randomSeedMode2 === 'random' && el58) {
          const value409 = String(el58.dataset.uiSchemaField || '').trim(),
            value410 = handler11(el58);
          el58.classList?.contains('ui-schema-rh-video-stepper') && handler14(el58, value410);
          const el59 = el58.querySelector('[data-ui-schema-input]');
          if (el59) el59.value = value410;
          if (value409) run3(value409, value410);
        }
        return;
      }
      const el60 = event10.target?.closest?.('[data-ui-schema-random-seed]');
      if (el60) {
        (event10.preventDefault?.(), event10.stopPropagation?.());
        const el61 = el60.closest('[data-ui-schema-field]'),
          enabled24 = String(el61?.dataset?.uiSchemaField || '').trim();
        if (!enabled24) return;
        const value411 = handler11(el61);
        el61.classList?.contains('ui-schema-rh-video-stepper') && handler14(el61, value411);
        const el62 = el61.querySelector('[data-ui-schema-input]');
        if (el62) el62.value = value411;
        run3(enabled24, value411);
        return;
      }
      const value412 = event10.target?.closest?.('.ui-schema-rh-video-stepper .rh-stepper-value');
      if (value412) {
        event10.stopPropagation();
        if (value350) {
          value350 = false;
          return;
        }
        handler16(value412);
        return;
      }
      const value413 = event10.target?.closest?.('.ui-schema-rh-v54-mask-expand .rh-stepper-value');
      if (value413) {
        event10.stopPropagation();
        if (value349) {
          value349 = false;
          return;
        }
        handler21(value413);
        return;
      }
      const el63 = event10.target?.closest?.('[data-ui-schema-menu-trigger]');
      if (el63) {
        event10.stopPropagation();
        const fieldEl3 = el63.closest('[data-ui-schema-field], [data-ui-schema-composite-field]'),
          popup =
            fieldEl3?.querySelector('.ui-schema-floating-menu') ||
            fieldEl3?.querySelector('.ui-schema-popup'),
          shouldOpen = popup?.classList?.contains('floating-menu')
            ? !popup.classList.contains('show')
            : popup
              ? popup.style.display === 'none'
              : false;
        (el33.dispatchEvent(
          new CustomEvent('ui-schema-menu-before-open', {
            detail: { fieldEl: fieldEl3, popup: popup, shouldOpen: shouldOpen },
          }),
        ),
          el33.querySelectorAll('.ui-schema-floating-menu').forEach((el64) => {
            if (el64 !== popup) el64.classList.remove('show');
          }),
          el33.querySelectorAll('.ui-schema-popup').forEach((el65) => {
            if (el65 === popup) return;
            if (el65.classList?.contains('floating-menu')) {
              (el65.classList.remove('show'), (el65.style.display = ''));
              return;
            }
            el65.style.display = 'none';
          }));
        if (popup?.classList?.contains('floating-menu'))
          ((popup.style.display = ''), popup.classList.toggle('show', shouldOpen));
        else
          popup &&
            (popup.style.display = shouldOpen
              ? popup.classList?.contains('ui-schema-duration-pop')
                ? 'flex'
                : 'block'
              : 'none');
        return;
      }
      event10.target?.closest?.(
        '.ui-schema-popup, .ui-schema-floating-menu, .img-ratio-popup, .rh-res-popup',
      ) && event10.stopPropagation();
      const el66 = event10.target?.closest?.('[data-ui-schema-field]');
      if (!el66) return;
      const enabled25 = String(el66.dataset.uiSchemaField || '').trim();
      if (!enabled25) return;
      const el67 = event10.target.closest('[data-ui-schema-value]');
      if (!el67) return;
      if (el67.dataset.uiSchemaDisabled === 'true' || el67.disabled === true) return;
      event10.stopPropagation();
      const value414 = String(el66.dataset.uiSchemaType || ''),
        value415 = el67.dataset.uiSchemaValue,
        value416 =
          el66.dataset.uiSchemaValueType === 'boolean'
            ? value415 === 'true'
            : el66.dataset.uiSchemaValueType === 'number'
              ? Number(value415)
              : value414 === 'toggle'
                ? value415 === 'true'
                : value415;
      (el66.querySelectorAll('[data-ui-schema-value]').forEach((el68) => el68.classList.remove('active')),
        el67.classList.add('active'));
      const el69 = el66.querySelector('.ui-schema-menu-trigger .ui-schema-pill-label');
      if (el69) {
        const value417 = el67.dataset.uiSchemaOptionLabel || el67.textContent?.trim?.() || String(value416);
        el69.textContent = value417;
      }
      (syncInstanceToggleField(el66, value416),
        run3(enabled25, value416),
        el67.closest('.floating-menu')?.classList.remove('show'));
    },
    value418 = (event11) => {
      const el70 = event11.target?.closest?.('[data-ui-schema-input]');
      if (!el70) return;
      const enabled26 = String(el70.dataset.uiSchemaInput || '').trim();
      if (!enabled26) return;
      const value419 = el70.closest('[data-ui-schema-range-values]'),
        list53 = parseRangeValuesFromFieldEl(value419),
        value420 =
          el70.type === 'range' && list53?.length
            ? list53[Math.max(0, Math.min(list53.length - 1, Number(el70.value)))]
            : el70.type === 'range' || el70.type === 'number'
              ? Number(el70.value)
              : el70.value,
        el71 = el70.closest('.ui-schema-field')?.querySelector('.ui-schema-value');
      if (el71) el71.textContent = String(value420);
      const el72 = el70.closest('.ui-schema-rh-v54-breast-jiggle'),
        el73 = el72?.querySelector('.rh-breast-jiggle-value');
      el73 &&
        (el73.textContent = formatRhV54BreastJiggle(value420, getRhV54BreastJiggleRangeFromFieldEl(el72)));
      const el74 = el70.closest('.ui-schema-duration-pill')?.querySelector('.ui-schema-duration-label');
      el74 && (el74.textContent = getRangeValueDisplayLabel(value419, value420, value420 + 'S'));
      const el75 = el70.closest('.ui-schema-field')?.querySelector('.ui-schema-pill-label'),
        el76 = el70.closest('.ui-schema-field')?.querySelector('.rh-res-title');
      if (el75 && el76) {
        const el77 = el75.querySelector('.ui-schema-resolution-value');
        el77
          ? (el77.textContent = String(value420))
          : (el75.textContent = (el76.textContent || 'Resolution') + ' ' + value420);
      }
      if (handler7(el70)) {
        event11.type === 'input'
          ? handler6(enabled26, value420)
          : (handler4(enabled26), run3(enabled26, value420));
        return;
      }
      run3(enabled26, value420);
    };
  return (
    el33.addEventListener('click', value408, true),
    el33.addEventListener('mousedown', value407, true),
    el33.addEventListener('input', value418),
    el33.addEventListener('change', value418),
    () => {
      (handler5(),
        handler22(),
        handler17(),
        el33.removeEventListener('click', value408, true),
        el33.removeEventListener('mousedown', value407, true),
        el33.removeEventListener('input', value418),
        el33.removeEventListener('change', value418));
    }
  );
}
export function bindModelUiSchemaControls(
  enabled27,
  {
    nodeId: nodeId,
    nodeData: nodeData10,
    store: store,
    buildPatch: buildPatch,
    decorateNodeData: decorateNodeData,
    afterCommit: afterCommit,
  } = {},
) {
  if (!enabled27 || !store || !nodeId) return () => {};
  const getNodeData2 = () => {
    const value421 = store.getState?.().nodes?.[nodeId] || nodeData10 || {};
    return typeof decorateNodeData === 'function' ? decorateNodeData(value421) : value421;
  };
  return bindUiSchemaControls(enabled27, {
    getNodeData: getNodeData2,
    commitFieldValue: (value422, value423, latest) => {
      const args12 = buildUiSchemaParamPatch(latest, value422, value423),
        value424 = typeof buildPatch === 'function' ? buildPatch(latest, value422, value423, args12) : {},
        patch = { ...args12, ...(value424 && typeof value424 === 'object' ? value424 : {}) };
      store.updateNodeData(nodeId, patch);
      const value425 = { ...latest, ...patch },
        value426 = typeof decorateNodeData === 'function' ? decorateNodeData(value425) : value425;
      return (afterCommit?.(value422, value423, value426, { latest: latest, patch: patch }), value426);
    },
  });
}
export function bindUiSchemaFieldControls(
  value427,
  { getNodeData: getNodeData3, commitFieldValue: commitFieldValue2 } = {},
) {
  return bindUiSchemaControls(value427, { getNodeData: getNodeData3, commitFieldValue: commitFieldValue2 });
}
export function syncModelUiSchemaControls(el78, value428 = {}) {
  if (!el78) return;
  (syncDynamicOptionDisabled(el78, value428),
    el78.querySelectorAll('[data-ui-schema-field]').forEach((el79) => {
      const enabled28 = String(el79.dataset.uiSchemaField || '').trim();
      if (!enabled28) return;
      let nodeFieldValue2 = getNodeFieldValue(value428, enabled28, el79.dataset.uiSchemaDefault);
      const value429 = String(el79.dataset.uiSchemaDefaultAliases || '').trim();
      if (value429)
        try {
          const list54 = JSON.parse(value429)
            .map((item57) =>
              String(item57 ?? '')
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean);
          list54.includes(
            String(nodeFieldValue2 ?? '')
              .trim()
              .toLowerCase(),
          ) && (nodeFieldValue2 = el79.dataset.uiSchemaDefault);
        } catch {}
      const el80 = el79.querySelector('[data-ui-schema-value="' + escapeCssString(nodeFieldValue2) + '"]');
      if (el80?.dataset?.uiSchemaDisabled === 'true') {
        const value430 = el79.dataset.uiSchemaDefault,
          el81 = el79.querySelector('[data-ui-schema-value="' + escapeCssString(value430) + '"]'),
          el82 =
            el81?.dataset?.uiSchemaDisabled === 'true'
              ? el79.querySelector('[data-ui-schema-value]:not([data-ui-schema-disabled="true"])')
              : el81;
        el82?.dataset?.uiSchemaValue !== undefined && (nodeFieldValue2 = el82.dataset.uiSchemaValue);
      }
      el79.querySelectorAll('[data-ui-schema-value]').forEach((el83) => {
        el83.classList.toggle('active', String(el83.dataset.uiSchemaValue) === String(nodeFieldValue2));
      });
      const el84 = el79.querySelector('[data-ui-schema-value="' + escapeCssString(nodeFieldValue2) + '"]'),
        el85 = el79.querySelector('.ui-schema-pill-label');
      el85 && el84?.dataset?.uiSchemaOptionLabel && (el85.textContent = el84.dataset.uiSchemaOptionLabel);
      (syncInstanceToggleField(el79, nodeFieldValue2), syncStepperField(el79, nodeFieldValue2));
      const el86 = el79.querySelector('[data-ui-schema-input]');
      if (el86 && nodeFieldValue2 !== undefined) {
        const list55 = parseRangeValuesFromFieldEl(el79),
          rangeValueIndex2 = findRangeValueIndex(list55, nodeFieldValue2);
        el86.value = list55?.length ? String(Math.max(0, rangeValueIndex2)) : String(nodeFieldValue2);
        const el87 = el79.querySelector('.ui-schema-value');
        if (el87) el87.textContent = String(nodeFieldValue2);
        const el88 = el79.querySelector('.ui-schema-duration-label');
        el88 && (el88.textContent = getRangeValueDisplayLabel(el79, nodeFieldValue2, nodeFieldValue2 + 'S'));
        const el89 = el79.querySelector('.ui-schema-pill-label'),
          el90 = el89?.querySelector('.ui-schema-resolution-value');
        if (el90) el90.textContent = String(nodeFieldValue2);
        else {
          if (el79.classList?.contains('ui-schema-resolution-pill')) {
            const value431 = el79.querySelector('.rh-res-title')?.textContent || 'Resolution';
            if (el89) el89.textContent = value431 + ' ' + nodeFieldValue2;
          }
        }
      }
      (syncRhV54CustomField(el79, value428), syncRandomSeedField(el79, value428));
    }),
    syncCompositeUiSchemaControls(el78, value428));
}
function syncDynamicOptionDisabled(el91, value432 = {}) {
  el91
    .querySelectorAll('[data-ui-schema-disable-when-field], [data-ui-schema-disable-when-json]')
    .forEach((el92) => {
      const value433 = String(el92.dataset.uiSchemaDisableWhenField || '').trim(),
        list56 = String(el92.dataset.uiSchemaDisableWhenValues || '')
          .split(',')
          .map(normalizeCompareValue)
          .filter(Boolean);
      let optionDisableWhenMatches2 = false;
      const value434 = String(el92.dataset.uiSchemaDisableWhenJson || '').trim();
      if (value434)
        try {
          optionDisableWhenMatches2 = optionDisableWhenMatches(JSON.parse(value434), value432);
        } catch {
          optionDisableWhenMatches2 = false;
        }
      else
        optionDisableWhenMatches2 =
          value433 && list56.includes(normalizeCompareValue(getNodeFieldValue(value432, value433, '')));
      const value435 =
          el92.dataset.uiSchemaStaticDisabled === 'true' ||
          el92.hasAttribute('data-ui-schema-static-disabled'),
        value436 = Boolean(value435 || optionDisableWhenMatches2);
      el92.classList?.toggle('disabled', value436);
      if (value436) {
        ((el92.dataset.uiSchemaDisabled = 'true'), el92.setAttribute('aria-disabled', 'true'));
        if ('disabled' in el92) el92.disabled = true;
      } else {
        (delete el92.dataset.uiSchemaDisabled,
          el92.removeAttribute('data-ui-schema-disabled'),
          el92.removeAttribute('aria-disabled'));
        if ('disabled' in el92) el92.disabled = false;
      }
    });
}
function syncRhV54CustomField(el93, value437 = {}) {
  const value438 = String(el93?.dataset?.uiSchemaField || '').trim(),
    value439 = String(el93?.dataset?.rhV54DisableOnSpecial || '').trim(),
    value440 =
      value439 && normalizeRhV54SpecialMode(getNodeFieldValue(value437, 'rhSpecialMode', '')) === value439,
    value441 = value438 === 'rhSubtractSubject' && value437?.rhV54HasMaskVideo === true;
  (value439 || value441) && el93.classList.toggle('is-rh-disabled', Boolean(value440 || value441));
  if (el93.classList?.contains('ui-schema-rh-v54-control-mode')) {
    const value442 = String(getNodeFieldValue(value437, 'rhControlMode', 'single') || 'single'),
      rhV54SinglePreset2 = normalizeRhV54SinglePreset(
        getNodeFieldValue(value437, 'rhSingleControlPreset', 'efficiency'),
      );
    (el93
      .querySelectorAll('[data-key="rhSingleControlPreset"]')
      .forEach((el94) =>
        el94.classList.toggle('active', value442 !== 'multi' && el94.dataset.value === rhV54SinglePreset2),
      ),
      el93
        .querySelectorAll('[data-key="rhControlMode"]')
        .forEach((el95) =>
          el95.classList.toggle('active', value442 === 'multi' && el95.dataset.value === 'multi'),
        ),
      el93.querySelector('.rh-adv-single-group')?.classList.toggle('active', value442 !== 'multi'),
      el93.querySelector('.rh-adv-multi-group')?.classList.toggle('active', value442 === 'multi'));
  }
  if (el93.classList?.contains('ui-schema-rh-v54-mask-expand')) {
    const rhV54MaskExpand3 = normalizeRhV54MaskExpand(
        getNodeFieldValue(value437, 'rhMaskExpand', el93.dataset.uiSchemaDefault || 25),
        Number(el93.dataset.uiSchemaDefault || 25),
      ),
      el96 = el93.querySelector('.rh-stepper-value');
    el96 &&
      ((el96.textContent = String(rhV54MaskExpand3)),
      el96.setAttribute('aria-valuenow', String(rhV54MaskExpand3)));
  }
  if (el93.classList?.contains('ui-schema-rh-v54-breast-jiggle')) {
    const value443 = String(el93.dataset.uiSchemaField || '').trim(),
      formatRhV54BreastJiggle3 = formatRhV54BreastJiggle(
        getNodeFieldValue(value437, value443, el93.dataset.uiSchemaDefault || 0),
        getRhV54BreastJiggleRangeFromFieldEl(el93),
      ),
      el97 = el93.querySelector('.rh-breast-jiggle-slider');
    if (el97) el97.value = formatRhV54BreastJiggle3;
    const el98 = el93.querySelector('.rh-breast-jiggle-value');
    if (el98) el98.textContent = formatRhV54BreastJiggle3;
  }
}
function getSyncedFieldValue(el99, value444 = {}) {
  const enabled29 = String(el99?.dataset?.uiSchemaField || '').trim();
  if (!enabled29) return '';
  const nodeFieldValue3 = getNodeFieldValue(value444, enabled29, el99?.dataset?.uiSchemaDefault ?? ''),
    el100 = el99?.querySelector?.('[data-ui-schema-value="' + escapeCssString(nodeFieldValue3) + '"]');
  if (el100?.dataset?.uiSchemaDisabled !== 'true') return nodeFieldValue3;
  const value445 = el99?.dataset?.uiSchemaDefault ?? '',
    el101 = el99?.querySelector?.('[data-ui-schema-value="' + escapeCssString(value445) + '"]');
  if (el101?.dataset?.uiSchemaDisabled !== 'true') return value445;
  const el102 = el99?.querySelector?.('[data-ui-schema-value]:not([data-ui-schema-disabled="true"])');
  return el102?.dataset?.uiSchemaValue ?? nodeFieldValue3;
}
function getSyncedOptionLabel(el103, value446, { adaptive: adaptive = false } = {}) {
  const el104 = el103?.querySelector?.('[data-ui-schema-value="' + escapeCssString(value446) + '"]'),
    value447 = String(el104?.dataset?.uiSchemaOptionLabel || el104?.textContent || value446 || '').trim(),
    value448 = value447.toLowerCase(),
    value449 = String(value446 || '')
      .trim()
      .toLowerCase();
  if (
    adaptive &&
    (value448 === 'auto' ||
      value448 === 'adaptive' ||
      value448 === '自适应' ||
      value449 === 'auto' ||
      value449 === 'adaptive' ||
      value449 === '自适应')
  )
    return '自适应';
  return value447;
}
function syncQualityRatioComposite(el105, value450 = {}) {
  const enabled30 =
      el105?.querySelector?.('[data-ui-schema-field="aspectRatio"]') ||
      el105?.querySelector?.('[data-ui-schema-display-role="aspectRatio"]'),
    value451 =
      el105?.querySelector?.('[data-ui-schema-field="imageSize"]') ||
      el105?.querySelector?.('[data-ui-schema-field="resolution"]') ||
      el105?.querySelector?.('[data-ui-schema-field="videoSize"]') ||
      el105?.querySelector?.('[data-ui-schema-field="quality"]') ||
      el105?.querySelector?.('[data-ui-schema-display-role="resolution"]'),
    list57 = Array.from(el105?.querySelectorAll?.('[data-ui-schema-field]') || []).filter(
      (item58) => item58 !== enabled30,
    );
  list57.length === 0 && value451 && list57.push(value451);
  const el106 = el105?.querySelector?.('.ui-schema-quality-ratio-label');
  if (!list57.length || !enabled30 || !el106) return;
  const syncedFieldValue = getSyncedFieldValue(enabled30, value450),
    list58 = list57.map((item59) => getSyncedOptionLabel(item59, getSyncedFieldValue(item59, value450))),
    syncedOptionLabel = getSyncedOptionLabel(enabled30, syncedFieldValue, { adaptive: true });
  el106.textContent =
    list58.length > 1
      ? [...list58, syncedOptionLabel].join(' · ')
      : String(el105?.dataset?.uiSchemaLabelOrder || '').trim() === 'fieldFirst'
        ? (list58[0] || '') + ' · ' + syncedOptionLabel
        : syncedOptionLabel + ' · ' + (list58[0] || '');
}
function syncSectionPairComposite(el107, value452 = {}) {
  const list59 = Array.from(el107?.querySelectorAll?.('[data-ui-schema-field]') || []),
    el108 = el107?.querySelector?.('.ui-schema-section-pair-label');
  if (list59.length < 2 || !el108) return;
  const list60 = list59
    .map((item60) => getSyncedOptionLabel(item60, getSyncedFieldValue(item60, value452)))
    .filter(Boolean);
  list60.length >= 2 && (el108.textContent = list60.join(' · '));
}
function syncVideoResolutionComposite(el109, value453 = {}) {
  const enabled31 =
      el109?.querySelector?.('[data-ui-schema-field="rhVideoResolution"]') ||
      el109?.querySelector?.('[data-ui-schema-field="videoResolution"]'),
    el110 = el109?.querySelector?.('.ui-schema-video-resolution-label');
  if (!enabled31 || !el110) return;
  const enabled32 = el109.querySelector('[data-ui-schema-field="rhVideoFps"]'),
    enabled33 = el109.querySelector('[data-ui-schema-field="rhVideoFrames"]'),
    syncedFieldValue2 = getSyncedFieldValue(enabled31, value453);
  if (!enabled32 || !enabled33) {
    el110.textContent = formatMetricLabel('分辨率', syncedFieldValue2);
    return;
  }
  const syncedFieldValue3 = getSyncedFieldValue(enabled32, value453),
    syncedFieldValue4 = getSyncedFieldValue(enabled33, value453),
    value454 =
      Number(syncedFieldValue4) === 0 ? t('aigenImage.uiSchema.fullLength') : String(syncedFieldValue4 || '');
  el110.textContent = joinMetricLabels([
    ['帧数', value454],
    ['帧率', syncedFieldValue3],
    ['分辨率', syncedFieldValue2],
  ]);
}
function syncRhVideoParamsComposite(el111, value455 = {}) {
  const el112 = el111?.querySelector?.('.img-ratio-label'),
    list61 = Array.from(el111?.querySelectorAll?.('[data-ui-schema-field]') || []).map((id) => ({
      id: id.dataset.uiSchemaField,
      defaultValue: id.dataset.uiSchemaDefault,
      min: id.dataset.uiSchemaMin,
      max: id.dataset.uiSchemaMax,
    })),
    handler23 = (value456) => list61.find((item61) => item61.id === value456),
    value457 = handler23('rhVideoResolution'),
    value458 = handler23('rhVideoFps'),
    value459 = handler23('rhVideoFrames'),
    value460 = handler23('rhVideoSeconds'),
    handler24 = (value461, value462, value463 = {}) =>
      normalizeNumberValue(
        getNodeFieldValue(value455, value461?.id, value461?.defaultValue ?? value462),
        Number(value462),
        value463,
      ),
    value464 = value457 ? handler24(value457, value457.defaultValue || 832, { min: 832 }) : 832;
  if (el112 && value460) {
    const value465 = value458 ? handler24(value458, value458.defaultValue || 24) : 24,
      value466 = handler24(value460, value460.defaultValue || 5, {
        min: Number(value460.min || 1),
        max: Number(value460.max || 600),
      });
    el112.textContent = joinMetricLabels([
      ['秒数', value466],
      ['帧率', value465],
      ['分辨率', value464],
    ]);
  } else {
    if (el112 && value459) {
      const count3 = handler24(value459, value459.defaultValue || 77, {
          min: Number(value459.min || 0),
          max: Number(value459.max || 0xf423f),
        }),
        value467 = count3 === 0 ? t('aigenImage.uiSchema.fullLength') : String(count3);
      if (value458) {
        const value468 = handler24(value458, value458.defaultValue || 24);
        el112.textContent = joinMetricLabels([
          ['帧数', value467],
          ['帧率', value468],
          ['分辨率', value464],
        ]);
      } else
        el112.textContent = joinMetricLabels([
          ['帧数', value467],
          ['分辨率', value464],
        ]);
    } else el112 && (el112.textContent = formatMetricLabel('分辨率', value464));
  }
  const el113 = el111?.querySelector?.('[data-ui-schema-field="rhVideoFrames"] .rh-stepper-value');
  if (value459 && el113) {
    const count4 = handler24(value459, value459.defaultValue || 77, {
      min: Number(value459.min || 0),
      max: Number(value459.max || 0xf423f),
    });
    ((el113.textContent = count4 === 0 ? t('aigenImage.uiSchema.fullLength') : String(count4)),
      el113.setAttribute('aria-valuenow', String(count4)));
  }
  const el114 = el111?.querySelector?.('[data-ui-schema-field="rhVideoSeconds"] .rh-stepper-value');
  if (value460 && el114) {
    const value469 = handler24(value460, value460.defaultValue || 5, {
      min: Number(value460.min || 1),
      max: Number(value460.max || 600),
    });
    ((el114.textContent = String(value469)), el114.setAttribute('aria-valuenow', String(value469)));
  }
  const el115 = el111?.querySelector?.('.rh-v5-source-framecount');
  if (el115) {
    const value470 = Number(value455?.rhVideoSourceFrameCount || 0);
    el115.textContent = value470 ? String(value470) : '—';
  }
}
function syncCompositeUiSchemaControls(el116, value471 = {}) {
  (el116
    .querySelectorAll('[data-ui-schema-composite-field="qualityRatio"]')
    .forEach((item62) => syncQualityRatioComposite(item62, value471)),
    el116
      .querySelectorAll('[data-ui-schema-composite-field="sectionPair"]')
      .forEach((item63) => syncSectionPairComposite(item63, value471)),
    el116
      .querySelectorAll('[data-ui-schema-composite-field="videoResolution"]')
      .forEach((item64) => syncVideoResolutionComposite(item64, value471)),
    el116
      .querySelectorAll('[data-ui-schema-composite-field="rhVideoParams"]')
      .forEach((item65) => syncRhVideoParamsComposite(item65, value471)));
}

const UI_SCHEMA_POPUP_EXIT_MS = 160;

function getUiSchemaValueOptions(value472) {
  return Array['from'](value472?.['querySelectorAll']?.('[data-ui-schema-value]') || []);
}

function findUiSchemaValueOption(value473, value474) {
  const value475 = String(value474 ?? '');
  return (
    getUiSchemaValueOptions(value473)['find'](
      (el117) => String(el117?.['dataset']?.['uiSchemaValue'] ?? '') === value475,
    ) || null
  );
}

function findFirstEnabledUiSchemaValueOption(value476) {
  return (
    getUiSchemaValueOptions(value476)['find'](
      (value477) => value477?.['dataset']?.['uiSchemaDisabled'] !== 'true',
    ) || null
  );
}

function isFieldDisabledByCondition(enabled34, enabled35) {
  if (!enabled34 || !enabled35) return false;
  const enabled36 = enabled34?.['disableWhen'];
  if (!enabled36 || typeof enabled36 !== 'object') return false;
  return optionDisableWhenMatches(enabled36, enabled35);
}

function isFieldDisabledByUiState(value478, enabled37) {
  const enabled38 = String(value478?.['id'] || '')['trim']();
  if (!enabled38 || !enabled37) return false;
  const value479 = enabled37?.['uiSchemaFieldState']?.[enabled38];
  return value479 === true || value479?.['disabled'] === true || value479?.['readOnly'] === true;
}

function resolveFieldDisabled(enabled39, value480) {
  if (!enabled39) return false;
  if (isFieldDisabled(enabled39)) return true;
  return (
    isFieldDisabledByUiState(enabled39, value480 || {}) ||
    isFieldDisabledByCondition(enabled39, value480 || {})
  );
}

const BUILTIN_ADAPTIVE_RATIO_OPTION = Object['freeze']({ value: '自适应', label: '自适应' });

function getRatioOptions(value481, value482 = {}) {
  const args13 = getVisibleOptions(value481, value482);
  return args13['some']((value483) => isAdaptiveRatioOption(value481, value483))
    ? args13
    : [BUILTIN_ADAPTIVE_RATIO_OPTION, ...args13];
}

function getVoiceCompositeModeField(options4 = {}, value484 = {}) {
  return firstNonEmptyString(
    options4?.['modeField'],
    value484?.['modeField'],
    options4?.['voiceModeField'],
    value484?.['voiceModeField'],
    'voiceMode',
  );
}

function getVoiceCompositeDefaultModeValue(options5 = {}, value485 = {}) {
  return firstNonEmptyString(
    options5?.['modeValue'],
    options5?.['defaultModeValue'],
    value485?.['defaultModeValue'],
    'default',
  );
}

function getVoiceCompositeCustomModeValue(options6 = {}, value486 = {}) {
  return firstNonEmptyString(
    value486?.['modeValue'],
    value486?.['filledModeValue'],
    value486?.['customModeValue'],
    options6?.['customModeValue'],
    'custom',
  );
}

function renderVoiceQualityRatioField(value487, value488) {
  const value489 = (Array['isArray'](value487) ? value487 : [])['filter'](Boolean);
  if (value489['length'] < 2) return '';
  const value490 = value489[0],
    value491 = value489[1];
  (assertSupportedField(value490), assertSupportedField(value491));
  const voiceCompositeModeField = getVoiceCompositeModeField(value490, value491),
    voiceCompositeDefaultModeValue = getVoiceCompositeDefaultModeValue(value490, value491),
    voiceCompositeCustomModeValue = getVoiceCompositeCustomModeValue(value490, value491),
    fieldValue11 = getFieldValue(value488, value490),
    value492 = String(getFieldValue(value488, value491) || '')['trim'](),
    value493 = voiceCompositeModeField
      ? String(getNodeFieldValue(value488, voiceCompositeModeField, '') || '')['trim']()
      : '',
    optionLabel3 = getOptionLabel(value490, fieldValue11),
    audioVoiceCompositeState = resolveAudioVoiceCompositeState({
      voiceTypeValue: fieldValue11,
      voiceTypeLabel: optionLabel3,
      speakerIdValue: value492,
      voiceModeValue: value493,
      defaultModeValue: voiceCompositeDefaultModeValue,
      customModeValue: voiceCompositeCustomModeValue,
    }),
    value494 = audioVoiceCompositeState['speakerIdValue'],
    value495 = audioVoiceCompositeState['triggerLabel'],
    value496 = audioVoiceCompositeState['customAreaClassName'],
    value497 = audioVoiceCompositeState['defaultAreaClassName'],
    manifestText25 = manifestText(value491?.['label'] || '自定义音色ID'),
    value498 = String(value491?.['placeholder'] || '留空使用预设音色')['trim'](),
    value499 = String(value491?.['helpUrl'] || '')['trim'](),
    value500 = value499
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
        escapeHtmlAttr(
          value491?.['description'] ||
            '填写后覆盖预设音色，默认音色将不可选。点击旁边链接可跳转音色库获取完整音色ID。',
        ) +
        '">!</span><a href="#" class="ui-schema-help-link img-rp-voice-help-link" data-ui-schema-field-help-url="' +
        escapeHtmlAttr(value499) +
        '" title="打开火山音色库" onclick="return false;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>'
      : '',
    value501 =
      '<div class="img-rp-quality-area img-rp-voice-custom-area' +
      value496 +
      '" data-ui-schema-field="' +
      escapeHtmlAttr(value491['id']) +
      '" data-ui-schema-type="text" data-ui-schema-default="' +
      escapeHtmlAttr(value491?.['defaultValue'] ?? '') +
      '">\n      <div class="img-rp-section-label">' +
      escapeHtmlAttr(manifestText25) +
      value500 +
      '</div>\n      <div class="img-rp-voice-input-wrap">\n        <input type="text" class="img-rp-voice-input" data-ui-schema-input="' +
      escapeHtmlAttr(value491['id']) +
      '" data-ui-schema-field="' +
      escapeHtmlAttr(value491['id']) +
      '" data-ui-schema-value="' +
      escapeHtmlAttr(value494) +
      '" placeholder="' +
      escapeHtmlAttr(value498) +
      '" value="' +
      escapeHtmlAttr(value494) +
      '" />\n      </div>\n    </div>',
    manifestText26 = manifestText(value490?.['label'] || '默认音色'),
    visibleOptions = getVisibleOptions(value490, value488),
    value502 = visibleOptions['map']((value503) => {
      const optionValue5 = getOptionValue(value503),
        manifestText27 = manifestText(value503?.['label'] ?? optionValue5),
        value504 = String(fieldValue11 ?? '') === String(optionValue5);
      return (
        '<button type="button" class="img-rp-ratio-item ui-schema-option ' +
        (value504 ? 'active' : '') +
        '" data-label="' +
        escapeHtmlAttr(optionValue5) +
        '" data-ui-schema-value="' +
        escapeHtmlAttr(optionValue5) +
        '"><span>' +
        escapeHtmlAttr(manifestText27) +
        '</span></button>'
      );
    })['join'](''),
    value505 =
      '<div class="img-rp-ratio-area img-rp-voice-default-area' +
      value497 +
      '" data-ui-schema-field="' +
      escapeHtmlAttr(value490['id']) +
      '" data-ui-schema-type="segmented" data-ui-schema-default="' +
      escapeHtmlAttr(value490?.['defaultValue'] ?? '') +
      '">\n      <div class="img-rp-section-label">' +
      escapeHtmlAttr(manifestText26) +
      '</div>\n      <div class="img-rp-ratio-split">\n        <div class="img-rp-ratio-right">\n          ' +
      value502 +
      '\n        </div>\n      </div>\n    </div>';
  return (
    '<div class="ui-schema-voice-quality-ratio-pill" data-ui-schema-composite-field="voiceQualityRatio" data-ui-schema-primary-field="' +
    escapeHtmlAttr(value490['id']) +
    '" data-ui-schema-secondary-field="' +
    escapeHtmlAttr(value491['id']) +
    '" data-ui-schema-mode-field="' +
    escapeHtmlAttr(voiceCompositeModeField) +
    '" data-ui-schema-default-mode-value="' +
    escapeHtmlAttr(voiceCompositeDefaultModeValue) +
    '" data-ui-schema-custom-mode-value="' +
    escapeHtmlAttr(voiceCompositeCustomModeValue) +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="voiceQualityRatio">\n      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>\n      <span class="ui-schema-pill-label ui-schema-voice-quality-ratio-label">' +
    escapeHtmlAttr(value495) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-voice-quality-ratio-popup" style="display:none;">\n      ' +
    value501 +
    '\n      ' +
    value505 +
    '\n    </div>\n  </div>'
  );
}

function renderDropdownControl(value506, value507, value508, value509 = {}) {
  const value510 = String(value506?.['id'] || '')['trim'](),
    optionLabel4 = getOptionLabel(value506, value507),
    value511 = value509?.['advanced'] ? ' ui-schema-advanced-dropdown' : '',
    value512 = String(value509?.['titleHtml'] || ''),
    value513 = value509?.['advanced']
      ? '<svg class="ui-schema-dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>'
      : '',
    fieldDisabled = resolveFieldDisabled(value506, value508)
      ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
      : '';
  return (
    '<div class="ui-schema-pill-menu' +
    value511 +
    '" data-ui-schema-dropdown>\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(value510) +
    '" aria-haspopup="listbox" aria-expanded="false"' +
    fieldDisabled +
    '>\n      <span class="ui-schema-pill-label">' +
    escapeHtmlAttr(optionLabel4) +
    '</span>\n      ' +
    value513 +
    '\n    </button>\n    <div class="floating-menu ui-schema-floating-menu" role="listbox" aria-hidden="true">\n      ' +
    value512 +
    '\n      ' +
    renderFloatingMenuItems(value506, value507, value508) +
    '\n    </div>\n  </div>'
  );
}

function syncDurationPillField(enabled40, value514) {
  if (!enabled40?.['classList']?.['contains']('ui-schema-duration-pill')) return;
  const el118 = enabled40['querySelector']('.ui-schema-duration-label');
  if (!el118) return;
  el118['textContent'] = getRangeValueDisplayLabel(enabled40, value514, value514 + 'S');
}

function syncResolutionPillField(enabled41, value515) {
  if (!enabled41?.['classList']?.['contains']('ui-schema-resolution-pill')) return;
  const value516 = enabled41['querySelector']('.ui-schema-pill-label'),
    el119 = value516?.['querySelector']('.ui-schema-resolution-value');
  if (el119) {
    el119['textContent'] = String(value515);
    return;
  }
  const value517 = enabled41['querySelector']('.rh-res-title')?.['textContent'] || 'Resolution';
  if (value516) value516['textContent'] = value517 + ' ' + value515;
}

function formatRhAiAppFooterParamLabel(value518, value519) {
  const value520 = String(
      value518?.['dataset']?.['uiSchemaFooterLabel'] || value518?.['dataset']?.['uiSchemaField'] || '参数',
    )['trim'](),
    value521 = String(value518?.['dataset']?.['uiSchemaType'] || '')['trim'](),
    formatRhAiAppFooterParamValue2 = formatRhAiAppFooterParamValue(value521, value519);
  return formatRhAiAppFooterParamValue2 ? value520 + ' · ' + formatRhAiAppFooterParamValue2 : value520;
}

function isRhAiAppFooterToggleOn(value522) {
  if (value522 === true) return true;
  if (value522 === false) return false;
  const value523 = String(value522 ?? '')
    ['trim']()
    ['toLowerCase']();
  return ['true', '1', 'yes', 'on']['includes'](value523);
}

function syncRhAiAppFooterParamField(el120, value524) {
  if (!el120?.['classList']?.['contains']('ui-schema-rh-aiapp-footer-param')) return;
  const value525 = el120['querySelector']('[data-ui-schema-rh-aiapp-footer-toggle]');
  if (value525) {
    const isRhAiAppFooterToggleOn2 = isRhAiAppFooterToggleOn(value524);
    ((value525['dataset']['uiSchemaValue'] = isRhAiAppFooterToggleOn2 ? 'false' : 'true'),
      value525['setAttribute']('aria-pressed', String(isRhAiAppFooterToggleOn2)));
    const value526 = value525['querySelector']('.ui-schema-rh-aiapp-footer-value');
    if (value526) value526['textContent'] = formatRhAiAppFooterParamValue('toggle', isRhAiAppFooterToggleOn2);
    const value527 = value525['querySelector']('.ui-schema-pill-label');
    value527 &&
      (value527['textContent'] = String(
        el120?.['dataset']?.['uiSchemaFooterLabel'] || el120?.['dataset']?.['uiSchemaField'] || '参数',
      )['trim']());
    return;
  }
  const enabled42 = el120['querySelector']('.ui-schema-pill-label');
  if (!enabled42) return;
  enabled42['textContent'] = formatRhAiAppFooterParamLabel(el120, value524);
}

function formatRhAiAppFooterParamValue(value528, value529) {
  if (value528 === 'toggle') return isRhAiAppFooterToggleOn(value529) ? '是' : '否';
  return String(value529 ?? '')['trim']();
}

function renderRhAiAppFooterDirectNumberField({
  field: field,
  id: id2,
  type: type,
  value: value530,
  label: label8,
  defaultValue: defaultValue,
  valueTypeAttr: valueTypeAttr,
  nodeData: nodeData11,
}) {
  const value531 = String(field?.['valueType'] || field?.['numberMode'] || '')
      ['trim']()
      ['toLowerCase'](),
    value532 = value531 === 'float' || value531 === 'decimal' ? 'decimal' : 'numeric',
    list62 = [];
  field?.['min'] !== undefined &&
    field?.['min'] !== null &&
    list62['push'](' min="' + escapeHtmlAttr(field['min']) + '"');
  field?.['max'] !== undefined &&
    field?.['max'] !== null &&
    list62['push'](' max="' + escapeHtmlAttr(field['max']) + '"');
  list62['push'](
    ' step="' + escapeHtmlAttr(field?.['step'] ?? (value532 === 'decimal' ? 'any' : 1)) + '"',
  );
  const fieldDisabled2 = resolveFieldDisabled(field, nodeData11)
    ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
    : '';
  return (
    '<div class="ui-schema-field ui-schema-rh-aiapp-footer-param ui-schema-rh-aiapp-footer-param--input" data-ui-schema-field="' +
    escapeHtmlAttr(id2) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(type) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(defaultValue) +
    '" data-ui-schema-footer-label="' +
    escapeHtmlAttr(label8) +
    '"' +
    valueTypeAttr +
    renderStepperAttrs(field, type) +
    '>\n    <label class="ui-schema-rh-aiapp-footer-inline">\n      <span class="ui-schema-rh-aiapp-footer-inline-label" data-tooltip="' +
    escapeHtmlAttr(label8) +
    '">' +
    escapeHtmlAttr(label8) +
    '</span>\n      <span class="ui-schema-rh-aiapp-footer-inline-separator">·</span>\n      <input class="ui-schema-rh-aiapp-footer-input" data-ui-schema-input="' +
    escapeHtmlAttr(id2) +
    '" type="number" inputmode="' +
    escapeHtmlAttr(value532) +
    '" value="' +
    escapeHtmlAttr(value530) +
    '" aria-label="' +
    escapeHtmlAttr(label8) +
    '"' +
    list62['join']('') +
    fieldDisabled2 +
    '>\n    </label>\n  </div>'
  );
}

function renderRhAiAppFooterToggleField({
  field: field2,
  id: id3,
  type: type2,
  value: value533,
  label: label9,
  defaultValue: defaultValue2,
  valueTypeAttr: valueTypeAttr2,
  nodeData: nodeData12,
}) {
  const isRhAiAppFooterToggleOn3 = isRhAiAppFooterToggleOn(value533),
    fieldDisabled3 = resolveFieldDisabled(field2, nodeData12)
      ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
      : '',
    formatRhAiAppFooterParamValue3 = formatRhAiAppFooterParamValue(type2, isRhAiAppFooterToggleOn3);
  return (
    '<div class="ui-schema-field ui-schema-rh-aiapp-footer-param ui-schema-rh-aiapp-footer-param--toggle" data-ui-schema-field="' +
    escapeHtmlAttr(id3) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(type2) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(defaultValue2) +
    '" data-ui-schema-footer-label="' +
    escapeHtmlAttr(label9) +
    '"' +
    valueTypeAttr2 +
    '>\n    <button type="button" class="img-pill-btn ui-schema-rh-aiapp-footer-toggle" data-ui-schema-rh-aiapp-footer-toggle="true" data-ui-schema-value="' +
    escapeHtmlAttr(isRhAiAppFooterToggleOn3 ? 'false' : 'true') +
    '" aria-pressed="' +
    escapeHtmlAttr(isRhAiAppFooterToggleOn3) +
    '"' +
    fieldDisabled3 +
    '>\n      <span class="ui-schema-pill-label">' +
    escapeHtmlAttr(label9) +
    '</span>\n      <span class="ui-schema-rh-aiapp-footer-separator" aria-hidden="true">·</span>\n      <span class="ui-schema-rh-aiapp-footer-value">' +
    escapeHtmlAttr(formatRhAiAppFooterParamValue3) +
    '</span>\n    </button>\n  </div>'
  );
}

function renderRhAiAppFooterParamField(value534, value535) {
  assertSupportedField(value534);
  const value536 = String(value534?.['id'] || '')['trim'](),
    controlType6 = normalizeControlType(value534?.['type']),
    fieldValue12 = getFieldValue(value535, value534),
    manifestText28 = manifestText(value534?.['label'] || value536),
    value537 = value534?.['defaultValue'] ?? '',
    value538 =
      typeof value534?.['defaultValue'] === 'boolean'
        ? ' data-ui-schema-value-type="boolean"'
        : controlType6 === 'stepper'
          ? ' data-ui-schema-value-type="number"'
          : '',
    value539 = controlType6 === 'stepper' ? ' ui-schema-rh-video-stepper' : '';
  if (controlType6 === 'stepper')
    return renderRhAiAppFooterDirectNumberField({
      field: value534,
      id: value536,
      type: controlType6,
      value: fieldValue12,
      label: manifestText28,
      defaultValue: value537,
      valueTypeAttr: value538,
      nodeData: value535,
    });
  if (controlType6 === 'toggle')
    return renderRhAiAppFooterToggleField({
      field: value534,
      id: value536,
      type: controlType6,
      value: fieldValue12,
      label: manifestText28,
      defaultValue: value537,
      valueTypeAttr: value538,
      nodeData: value535,
    });
  const renderControl3 = renderControl(value534, fieldValue12, controlType6, {
      nodeData: value535,
      advanced: true,
    }),
    formatRhAiAppFooterParamValue4 = formatRhAiAppFooterParamValue(controlType6, fieldValue12),
    value540 = formatRhAiAppFooterParamValue4
      ? manifestText28 + ' · ' + formatRhAiAppFooterParamValue4
      : manifestText28;
  return (
    '<div class="ui-schema-field ui-schema-pill-menu ui-schema-rh-aiapp-footer-param' +
    value539 +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(value536) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(controlType6) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(value537) +
    '" data-ui-schema-footer-label="' +
    escapeHtmlAttr(manifestText28) +
    '"' +
    value538 +
    renderStepperAttrs(value534, controlType6) +
    '>\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(value536) +
    '">\n      <span class="ui-schema-pill-label">' +
    escapeHtmlAttr(value540) +
    '</span>\n    </button>\n    <div class="floating-menu ui-schema-floating-menu ui-schema-rh-aiapp-footer-menu">\n      <div class="ui-schema-floating-menu-title">' +
    escapeHtmlAttr(manifestText28) +
    '</div>\n      <div class="ui-schema-rh-aiapp-footer-control">' +
    renderControl3 +
    '</div>\n    </div>\n  </div>'
  );
}

function isStandaloneResolutionField(value541) {
  if (value541?.['standaloneInResolution'] === true) return true;
  return (
    String(value541?.['resolutionComposite'] || '')
      ['trim']()
      ['toLowerCase']() === 'standalone'
  );
}

export function hasVisibleModelUiSchema(value542, value543 = {}, value544 = {}) {
  const list63 = getUiSchemaFields(value542, value544);
  return (
    list63['forEach'](assertSupportedField),
    filterVisibleUiSchemaFields(list63, value543)['length'] > 0
  );
}

function handleRandomSeedRowBindEvent({
  event: event12,
  eventName: eventName,
  fieldEl: fieldEl4,
  helpers: helpers = {},
} = {}) {
  if (eventName !== 'click' || !fieldEl4) return false;
  const run7 = helpers['commitValue'];
  if (typeof run7 !== 'function') return false;
  const run8 =
      typeof helpers['setRhVideoStepperValueEl'] === 'function'
        ? helpers['setRhVideoStepperValueEl']
        : () => {},
    handler25 =
      typeof helpers['generateRandomSeedForField'] === 'function'
        ? helpers['generateRandomSeedForField']
        : () => '',
    el121 = event12?.['target']?.['closest']?.('[data-ui-schema-random-seed-mode]');
  if (el121 && fieldEl4['contains'](el121)) {
    (event12['preventDefault']?.(), event12['stopPropagation']?.());
    const enabled43 = String(
        el121['dataset']['uiSchemaRandomSeedModeField'] ||
          fieldEl4['dataset']?.['uiSchemaRandomSeedModeField'] ||
          '',
      )['trim'](),
      randomSeedMode3 = normalizeRandomSeedMode(el121['dataset']['uiSchemaRandomSeedMode'], 'fixed');
    if (!enabled43) return true;
    run7(enabled43, randomSeedMode3);
    if (randomSeedMode3 === 'random') {
      const value545 = String(fieldEl4['dataset']['uiSchemaField'] || '')['trim'](),
        value546 = handler25(fieldEl4);
      fieldEl4['classList']?.['contains']('ui-schema-rh-video-stepper') && run8(fieldEl4, value546);
      const el122 = fieldEl4['querySelector']('[data-ui-schema-input]');
      if (el122) el122['value'] = value546;
      if (value545) run7(value545, value546);
    }
    return true;
  }
  const value547 = event12?.['target']?.['closest']?.('[data-ui-schema-random-seed]');
  if (value547 && fieldEl4['contains'](value547)) {
    (event12['preventDefault']?.(), event12['stopPropagation']?.());
    const enabled44 = String(fieldEl4?.['dataset']?.['uiSchemaField'] || '')['trim']();
    if (!enabled44) return true;
    const value548 = handler25(fieldEl4);
    fieldEl4['classList']?.['contains']('ui-schema-rh-video-stepper') && run8(fieldEl4, value548);
    const value549 = fieldEl4['querySelector']('[data-ui-schema-input]');
    if (value549) value549['value'] = value548;
    return (run7(enabled44, value548), true);
  }
  return false;
}

const uiSchemaStateOwner = createUiSchemaStateOwner({
  getUiSchemaValueOptions: getUiSchemaValueOptions,
  findUiSchemaValueOption: findUiSchemaValueOption,
  findFirstEnabledUiSchemaValueOption: findFirstEnabledUiSchemaValueOption,
  syncInstanceToggleField: syncInstanceToggleField,
  syncStepperField: syncStepperField,
  syncRhAiAppFooterParamField: syncRhAiAppFooterParamField,
  parseRangeValuesFromFieldEl: parseRangeValuesFromFieldEl,
  findRangeValueIndex: findRangeValueIndex,
  normalizeRhV54SpecialMode: normalizeRhV54SpecialMode,
  normalizeRhV54SinglePreset: normalizeRhV54SinglePreset,
  normalizeRhV54MaskExpand: normalizeRhV54MaskExpand,
  formatRhV54BreastJiggle: formatRhV54BreastJiggle,
  getRhV54BreastJiggleRangeFromFieldEl: getRhV54BreastJiggleRangeFromFieldEl,
  normalizeNumberValue: normalizeNumberValue,
  formatMetricLabel: formatMetricLabel,
  joinMetricLabels: joinMetricLabels,
});
