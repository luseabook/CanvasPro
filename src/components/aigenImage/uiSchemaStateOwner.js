import {
  getModelManifest,
  normalizeUiSchemaFieldValue,
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
import {
  getUiSchemaFieldAdapterDefinition,
  resolveUiSchemaFieldAdapterDefinition,
} from './uiSchemaControlAdapters.js';
import { resolveAudioVoiceCompositeState } from './audioVoiceCompositeState.js';
import { t } from '../../i18n/index.js';
export function getNodeFieldValue(value, item, key = '') {
  const enabled = String(item || '')['trim']();
  if (!enabled) return key;
  const index = value?.['generationParams'];
  if (index && typeof index === 'object' && !Array['isArray'](index) && index[enabled] !== undefined)
    return index[enabled];
  if (value && typeof value === 'object' && !Array['isArray'](value) && value[enabled] !== undefined)
    return value[enabled];
  return key;
}
function getPlainGenerationParams(args) {
  return args && typeof args === 'object' && !Array['isArray'](args) ? { ...args } : {};
}
export function getUiSchemaParamContext(options = {}) {
  const args2 = getPlainGenerationParams(options?.['generationParams']),
    args3 = options && typeof options === 'object' && !Array['isArray'](options) ? options : {};
  return { ...args3, ...args2 };
}
export function firstNonEmptyString(...args4) {
  for (const result of args4) {
    const data = String(result ?? '')['trim']();
    if (data) return data;
  }
  return '';
}
function normalizeControlType(target) {
  return String(target || '')
    ['trim']()
    ['toLowerCase']();
}
function normalizeCompareValue(source) {
  return String(source ?? '')
    ['trim']()
    ['toLowerCase']();
}
export function getRenderedOptionDisableWhen(el) {
  const next = String(el?.['dataset']?.['uiSchemaDisableWhenJson'] || '')['trim']();
  if (next)
    try {
      const current = JSON['parse'](next);
      return current && typeof current === 'object' ? current : null;
    } catch {
      return null;
    }
  const field = String(el?.['dataset']?.['uiSchemaDisableWhenField'] || '')['trim'](),
    values = String(el?.['dataset']?.['uiSchemaDisableWhenValues'] || '')
      ['split'](',')
      ['map']((entry) => entry['trim']())
      ['filter'](Boolean);
  return field && values['length'] > 0 ? { field: field, values: values } : null;
}
export function optionDisableWhenMatches(el2, record = {}) {
  if (Array['isArray'](el2)) return el2['some']((payload) => optionDisableWhenMatches(payload, record));
  if (!el2 || typeof el2 !== 'object') return false;
  if (Array['isArray'](el2['any']))
    return el2['any']['some']((handle) => optionDisableWhenMatches(handle, record));
  if (Array['isArray'](el2['all']))
    return el2['all']['every']((state) => optionDisableWhenMatches(state, record));
  const enabled2 = String(el2?.['field'] || el2?.['param'] || '')['trim']();
  if (!enabled2) return false;
  const config = el2['values'] !== undefined ? el2['values'] : el2['value'],
    list = Array['isArray'](config) ? config : [config],
    list2 = list['map'](normalizeCompareValue),
    enabled3 = list2['includes'](normalizeCompareValue(getNodeFieldValue(record, enabled2, '')));
  return el2['not'] ? !enabled3 : enabled3;
}
function mergeUiSchemaRepairPatches(args5 = {}, scope = {}) {
  const input = { ...args5 };
  for (const [output, value2] of Object['entries'](scope)) {
    if (
      Object['prototype']['hasOwnProperty']['call'](input, output) &&
      normalizeCompareValue(input[output]) !== normalizeCompareValue(value2)
    )
      return null;
    input[output] = value2;
  }
  return input;
}
function resolveMatchingOptionDisableRepair(el3, value3 = {}) {
  if (Array['isArray'](el3) || Array['isArray'](el3?.['any'])) {
    const value4 = Array['isArray'](el3) ? el3 : el3['any'];
    let uiSchemaRepairPatches = {};
    for (const value5 of value4) {
      if (!optionDisableWhenMatches(value5, value3)) continue;
      const matchingOptionDisableRepair = resolveMatchingOptionDisableRepair(value5, value3);
      if (!matchingOptionDisableRepair) return null;
      uiSchemaRepairPatches = mergeUiSchemaRepairPatches(uiSchemaRepairPatches, matchingOptionDisableRepair);
      if (!uiSchemaRepairPatches) return null;
    }
    return Object['keys'](uiSchemaRepairPatches)['length'] > 0 ? uiSchemaRepairPatches : null;
  }
  if (Array['isArray'](el3?.['all'])) {
    for (const value6 of el3['all']) {
      if (!optionDisableWhenMatches(value6, value3)) continue;
      const matchingOptionDisableRepair2 = resolveMatchingOptionDisableRepair(value6, value3);
      if (matchingOptionDisableRepair2 && Object['keys'](matchingOptionDisableRepair2)['length'] > 0)
        return matchingOptionDisableRepair2;
    }
    return null;
  }
  if (!el3 || typeof el3 !== 'object' || el3['not'] !== true) return null;
  const enabled4 = String(el3['field'] || el3['param'] || '')['trim'](),
    value7 = el3['values'] !== undefined ? el3['values'] : el3['value'],
    list3 = Array['isArray'](value7) ? value7 : [value7];
  if (!enabled4 || list3['length'] === 0) return null;
  const nodeFieldValue = getNodeFieldValue(value3, enabled4, ''),
    value8 = list3['find'](
      (value9) => normalizeCompareValue(value9) !== normalizeCompareValue(nodeFieldValue),
    );
  return value8 === undefined ? null : { [enabled4]: value8 };
}
export function getOptionDisableRepairPatch(value10, value11 = {}) {
  if (!optionDisableWhenMatches(value10, value11)) return null;
  return resolveMatchingOptionDisableRepair(value10, value11);
}
export function uiSchemaConditionMatches(el4, value12 = {}) {
  if (Array['isArray'](el4)) return el4['some']((value13) => uiSchemaConditionMatches(value13, value12));
  if (!el4 || typeof el4 !== 'object') return false;
  if (Array['isArray'](el4['any']))
    return el4['any']['some']((value14) => uiSchemaConditionMatches(value14, value12));
  if (Array['isArray'](el4['all']))
    return el4['all']['every']((value15) => uiSchemaConditionMatches(value15, value12));
  const enabled5 = String(el4?.['field'] || el4?.['param'] || '')['trim']();
  if (!enabled5) return false;
  const value16 = el4['values'] !== undefined ? el4['values'] : el4['value'],
    list4 = Array['isArray'](value16) ? value16 : [value16],
    list5 = list4['map'](normalizeCompareValue);
  return list5['includes'](normalizeCompareValue(getNodeFieldValue(value12, enabled5, '')));
}
export function filterVisibleUiSchemaFields(list6 = [], value17 = {}) {
  return (Array['isArray'](list6) ? list6 : [])['filter']((value18) => {
    if (value18?.['showWhen'] && !uiSchemaConditionMatches(value18['showWhen'], value17)) return false;
    if (value18?.['hideWhen'] && uiSchemaConditionMatches(value18['hideWhen'], value17)) return false;
    return true;
  });
}
function getUiSchemaModelIdForNode(providerHint = {}) {
  const enabled6 = String(providerHint?.['model'] || '')['trim']();
  if (!enabled6) return '';
  if (getModelManifest(enabled6)) return enabled6;
  const modelExecution =
    resolveModelExecution(enabled6, { providerHint: providerHint?.['provider'] }) ||
    resolveModelExecution(enabled6);
  return String(
    modelExecution?.['canonicalModelId'] || modelExecution?.['modelManifest']?.['modelId'] || enabled6,
  )['trim']();
}
function getUiSchemaFieldModePatch(options2 = {}, value19 = '') {
  const field2 = firstNonEmptyString(options2?.['modeField'], options2?.['voiceModeField']);
  if (!field2) return null;
  const value20 = firstNonEmptyString(options2?.['modeValue']);
  if (value20) return { field: field2, value: value20 };
  const nonEmptyString = firstNonEmptyString(options2?.['filledModeValue'], options2?.['customModeValue']),
    nonEmptyString2 = firstNonEmptyString(options2?.['emptyModeValue'], options2?.['defaultModeValue']);
  if (!nonEmptyString && !nonEmptyString2) return null;
  const value21 = String(value19 ?? '')['trim']() !== '';
  return { field: field2, value: value21 ? nonEmptyString : nonEmptyString2 };
}
export function buildUiSchemaParamPatch(nodeData = {}, value22 = '', value23 = '') {
  const enabled7 = String(value22 || '')['trim']();
  if (!enabled7) return {};
  const uiSchemaModelIdForNode = getUiSchemaModelIdForNode(nodeData),
    modelManifest = getModelManifest(uiSchemaModelIdForNode),
    variant = Array['isArray'](modelManifest?.['uiSchema']?.['fields'])
      ? modelManifest['uiSchema']['fields']['find'](
          (value24) => String(value24?.['id'] || '')['trim']() === enabled7,
        )
      : null,
    value25 = variant
      ? resolveUiSchemaFieldAdapterDefinition(variant, {
          type: normalizeControlType(variant?.['type']),
          variant: variant?.['variant'],
        })
      : null,
    value26 = { ...getUiSchemaParamContext(nodeData), [enabled7]: value23 },
    normalizeUiSchemaFieldValue2 = (value27, value28, params = {}) =>
      normalizeUiSchemaFieldValue(value27, value28, {
        ...params,
        params: params?.['params'] || value26,
      }),
    value29 =
      value25 && typeof value25['normalize'] === 'function'
        ? value25['normalize']({
            field: variant,
            value: value23,
            nodeData: nodeData,
            phase: 'commit',
            helpers: { normalizeUiSchemaFieldValue: normalizeUiSchemaFieldValue2 },
          })
        : variant
          ? normalizeUiSchemaFieldValue2(variant, value23)
          : value23,
    plainGenerationParams = getPlainGenerationParams(nodeData['generationParams']);
  plainGenerationParams[enabled7] = value29;
  const el5 = variant ? getUiSchemaFieldModePatch(variant, value29) : null;
  el5?.['field'] && (plainGenerationParams[el5['field']] = el5['value']);
  const generationParams = sanitizeModelUiSchemaParams(
    uiSchemaModelIdForNode || nodeData?.['model'],
    plainGenerationParams,
    {
      includeDefaults: false,
    },
  );
  for (const value30 of Object['keys'](plainGenerationParams)) {
    !(value30 in generationParams) && (generationParams[value30] = plainGenerationParams[value30]);
  }
  const value31 = { generationParams: generationParams },
    value32 = String(nodeData?.['model'] || '')['trim']();
  return (
    value32 &&
      (value31['generationParamsByModel'] = {
        ...getPlainGenerationParams(nodeData['generationParamsByModel']),
        [value32]: generationParams,
      }),
    value31
  );
}
export function evaluateUiSchemaNumberExpression(value33) {
  if (typeof value33 === 'number') return Number['isFinite'](value33) ? value33 : NaN;
  const list7 = String(value33 ?? '')['trim']();
  if (!list7) return NaN;
  let value34 = 0;
  const run = () => {
      while (/\s/['test'](list7[value34] || '')) value34 += 1;
    },
    handler = () => {
      run();
      const value35 = value34;
      let enabled8 = false;
      while (/\d/['test'](list7[value34] || '')) {
        ((enabled8 = true), (value34 += 1));
      }
      if (list7[value34] === '.') {
        value34 += 1;
        while (/\d/['test'](list7[value34] || '')) {
          ((enabled8 = true), (value34 += 1));
        }
      }
      if (!enabled8) return NaN;
      return Number(list7['slice'](value35, value34));
    },
    handler2 = () => {
      run();
      const value36 = list7[value34];
      if (value36 === '+' || value36 === '-') {
        value34 += 1;
        const value37 = handler2();
        return value36 === '-' ? -value37 : value37;
      }
      if (list7[value34] === '(') {
        value34 += 1;
        const value38 = run2();
        run();
        if (list7[value34] !== ')') return NaN;
        return ((value34 += 1), value38);
      }
      return handler();
    },
    handler3 = () => {
      let value39 = handler2();
      while (true) {
        run();
        const value40 = list7[value34];
        if (value40 !== '*' && value40 !== '/') return value39;
        value34 += 1;
        const count = handler2();
        if (!Number['isFinite'](value39) || !Number['isFinite'](count)) return NaN;
        if (value40 === '/' && count === 0) return NaN;
        value39 = value40 === '*' ? value39 * count : value39 / count;
      }
    };
  function run2() {
    let value41 = handler3();
    while (true) {
      run();
      const value42 = list7[value34];
      if (value42 !== '+' && value42 !== '-') return value41;
      value34 += 1;
      const value43 = handler3();
      if (!Number['isFinite'](value41) || !Number['isFinite'](value43)) return NaN;
      value41 = value42 === '+' ? value41 + value43 : value41 - value43;
    }
  }
  const value44 = run2();
  return (run(), value34 === list7['length'] && Number['isFinite'](value44) ? value44 : NaN);
}
export function createUiSchemaStateOwner({
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
} = {}) {
  function run3(el6) {
    const value45 = String(el6?.['dataset']?.['uiSchemaAdapter'] || '')['trim']();
    if (value45) return value45;
    if (el6?.['classList']?.['contains']?.('ui-schema-duration-pill')) return 'field.durationPill.slider';
    if (el6?.['classList']?.['contains']?.('ui-schema-resolution-pill')) return 'field.resolutionPill.slider';
    return '';
  }
  function run4(fieldEl, nodeData2 = {}) {
    const enabled9 = run3(fieldEl);
    if (!enabled9) return;
    const uiSchemaFieldAdapterDefinition = getUiSchemaFieldAdapterDefinition(enabled9);
    if (!uiSchemaFieldAdapterDefinition || typeof uiSchemaFieldAdapterDefinition['sync'] !== 'function')
      return;
    uiSchemaFieldAdapterDefinition['sync']({
      fieldEl: fieldEl,
      nodeData: nodeData2,
      helpers: { getNodeFieldValue: getNodeFieldValue },
    });
  }
  function run5(el7, value46 = {}) {
    el7['querySelectorAll']('[data-ui-schema-disable-when-field], [data-ui-schema-disable-when-json]')[
      'forEach'
    ]((el8) => {
      const renderedOptionDisableWhen = getRenderedOptionDisableWhen(el8),
        optionDisableWhenMatches2 = optionDisableWhenMatches(renderedOptionDisableWhen, value46),
        enabled10 = optionDisableWhenMatches2
          ? getOptionDisableRepairPatch(renderedOptionDisableWhen, value46)
          : null,
        value47 = optionDisableWhenMatches2 && !enabled10,
        value48 =
          el8['dataset']['uiSchemaStaticDisabled'] === 'true' ||
          el8['hasAttribute']('data-ui-schema-static-disabled'),
        value49 = Boolean(value48 || value47);
      el8['classList']?.['toggle']('disabled', value49);
      if (value49) {
        ((el8['dataset']['uiSchemaDisabled'] = 'true'), el8['setAttribute']('aria-disabled', 'true'));
        if ('disabled' in el8) el8['disabled'] = true;
      } else {
        (delete el8['dataset']['uiSchemaDisabled'],
          el8['removeAttribute']('data-ui-schema-disabled'),
          el8['removeAttribute']('aria-disabled'));
        if ('disabled' in el8) el8['disabled'] = false;
      }
    });
  }
  function run6(el9, value50 = {}) {
    const value51 = String(el9?.['dataset']?.['uiSchemaField'] || '')['trim'](),
      value52 = String(el9?.['dataset']?.['rhV54DisableOnSpecial'] || '')['trim'](),
      value53 =
        value52 && normalizeRhV54SpecialMode(getNodeFieldValue(value50, 'rhSpecialMode', '')) === value52,
      value54 = value51 === 'rhSubtractSubject' && value50?.['rhV54HasMaskVideo'] === true;
    (value52 || value54) && el9['classList']['toggle']('is-rh-disabled', Boolean(value53 || value54));
    if (el9['classList']?.['contains']('ui-schema-rh-v54-control-mode')) {
      const value55 = String(getNodeFieldValue(value50, 'rhControlMode', 'single') || 'single'),
        value56 = normalizeRhV54SinglePreset(
          getNodeFieldValue(value50, 'rhSingleControlPreset', 'efficiency'),
        );
      (el9['querySelectorAll']('[data-key="rhSingleControlPreset"]')['forEach']((el10) =>
        el10['classList']['toggle']('active', value55 !== 'multi' && el10['dataset']['value'] === value56),
      ),
        el9['querySelectorAll']('[data-key="rhControlMode"]')['forEach']((el11) =>
          el11['classList']['toggle']('active', value55 === 'multi' && el11['dataset']['value'] === 'multi'),
        ),
        el9['querySelector']('.rh-adv-single-group')?.['classList']['toggle']('active', value55 !== 'multi'),
        el9['querySelector']('.rh-adv-multi-group')?.['classList']['toggle']('active', value55 === 'multi'));
    }
    if (el9['classList']?.['contains']('ui-schema-rh-v54-mask-expand')) {
      const value57 = normalizeRhV54MaskExpand(
          getNodeFieldValue(value50, 'rhMaskExpand', el9['dataset']['uiSchemaDefault'] || 25),
          Number(el9['dataset']['uiSchemaDefault'] || 25),
        ),
        el12 = el9['querySelector']('.rh-stepper-value');
      el12 &&
        ((el12['textContent'] = String(value57)), el12['setAttribute']('aria-valuenow', String(value57)));
    }
    if (el9['classList']?.['contains']('ui-schema-rh-v54-breast-jiggle')) {
      const value58 = formatRhV54BreastJiggle(
          getNodeFieldValue(value50, value51, el9['dataset']['uiSchemaDefault'] || 0),
          getRhV54BreastJiggleRangeFromFieldEl(el9),
        ),
        el13 = el9['querySelector']('.rh-breast-jiggle-slider');
      if (el13) el13['value'] = value58;
      const el14 = el9['querySelector']('.rh-breast-jiggle-value');
      if (el14) el14['textContent'] = value58;
    }
  }
  function run7(el15, value59 = {}) {
    const enabled11 = String(el15?.['dataset']?.['uiSchemaField'] || '')['trim']();
    if (!enabled11) return '';
    const value60 =
        el15?.['dataset']?.['uiSchemaLockedValue'] ??
        getNodeFieldValue(value59, enabled11, el15?.['dataset']?.['uiSchemaDefault'] ?? ''),
      el16 = findUiSchemaValueOption(el15, value60);
    if (el16?.['dataset']?.['uiSchemaDisabled'] !== 'true') return value60;
    const value61 = el15?.['dataset']?.['uiSchemaDefault'] ?? '',
      el17 = findUiSchemaValueOption(el15, value61);
    if (el17?.['dataset']?.['uiSchemaDisabled'] !== 'true') return value61;
    const el18 = findFirstEnabledUiSchemaValueOption(el15);
    return el18?.['dataset']?.['uiSchemaValue'] ?? value60;
  }
  function run8(value62, value63, { adaptive: adaptive = false } = {}) {
    const el19 = findUiSchemaValueOption(value62, value63),
      value64 = String(el19?.['dataset']?.['uiSchemaOptionLabel'] || el19?.['textContent'] || value63 || '')[
        'trim'
      ](),
      value65 = value64['toLowerCase'](),
      value66 = String(value63 || '')
        ['trim']()
        ['toLowerCase']();
    if (
      adaptive &&
      (value65 === 'auto' ||
        value65 === 'adaptive' ||
        value65 === '自适应' ||
        value66 === 'auto' ||
        value66 === 'adaptive' ||
        value66 === '自适应')
    )
      return '自适应';
    return value64;
  }
  function run9(el20, value67 = {}) {
    const enabled12 =
        el20?.['querySelector']?.('[data-ui-schema-field="aspectRatio"]') ||
        el20?.['querySelector']?.('[data-ui-schema-display-role="aspectRatio"]'),
      value68 =
        el20?.['querySelector']?.('[data-ui-schema-field="imageSize"]') ||
        el20?.['querySelector']?.('[data-ui-schema-field="resolution"]') ||
        el20?.['querySelector']?.('[data-ui-schema-field="videoSize"]') ||
        el20?.['querySelector']?.('[data-ui-schema-field="quality"]') ||
        el20?.['querySelector']?.('[data-ui-schema-display-role="resolution"]'),
      list8 = Array['from'](el20?.['querySelectorAll']?.('[data-ui-schema-field]') || [])['filter'](
        (value69) => value69 !== enabled12,
      );
    list8['length'] === 0 && value68 && list8['push'](value68);
    const el21 = el20?.['querySelector']?.('.ui-schema-quality-ratio-label');
    if (!list8['length'] || !enabled12 || !el21) return;
    const value70 = run7(enabled12, value67),
      list9 = list8['map']((value71) => run8(value71, run7(value71, value67))),
      value72 = run8(enabled12, value70, { adaptive: true });
    el21['textContent'] =
      list9['length'] > 1
        ? [...list9, value72]['join'](' · ')
        : String(el20?.['dataset']?.['uiSchemaLabelOrder'] || '')['trim']() === 'fieldFirst'
          ? (list9[0] || '') + ' · ' + value72
          : value72 + ' · ' + (list9[0] || '');
  }
  function run10(el22, value73 = {}) {
    const list10 = Array['from'](el22?.['querySelectorAll']?.('[data-ui-schema-field]') || []),
      el23 = el22?.['querySelector']?.('.ui-schema-section-pair-label');
    if (list10['length'] < 2 || !el23) return;
    const list11 = list10['map']((value74) => run8(value74, run7(value74, value73)))['filter'](Boolean);
    list11['length'] >= 2 && (el23['textContent'] = list11['join'](' · '));
  }
  function run11(el24, value75 = {}) {
    const enabled13 =
        el24?.['querySelector']?.('[data-ui-schema-field="rhVideoResolution"]') ||
        el24?.['querySelector']?.('[data-ui-schema-field="videoResolution"]'),
      el25 = el24?.['querySelector']?.('.ui-schema-video-resolution-label');
    if (!enabled13 || !el25) return;
    const enabled14 = el24['querySelector']('[data-ui-schema-field="rhVideoFps"]'),
      enabled15 = el24['querySelector']('[data-ui-schema-field="rhVideoFrames"]'),
      value76 = run7(enabled13, value75);
    if (!enabled14 || !enabled15) {
      el25['textContent'] = formatMetricLabel('分辨率', value76);
      return;
    }
    const value77 = run7(enabled14, value75),
      value78 = run7(enabled15, value75),
      value79 = Number(value78) === 0 ? t('aigenImage.uiSchema.fullLength') : String(value78 || '');
    el25['textContent'] = joinMetricLabels([
      ['帧数', value79],
      ['帧率', value77],
      ['分辨率', value76],
    ]);
  }
  function run12(el26, value80 = {}) {
    const el27 = el26?.['querySelector']?.('.img-ratio-label'),
      list12 = Array['from'](el26?.['querySelectorAll']?.('[data-ui-schema-field]') || [])['map']((id) => ({
        id: id['dataset']['uiSchemaField'],
        defaultValue: id['dataset']['uiSchemaDefault'],
        min: id['dataset']['uiSchemaMin'],
        max: id['dataset']['uiSchemaMax'],
      })),
      handler4 = (value81) => list12['find']((value82) => value82['id'] === value81),
      value83 = handler4('rhVideoResolution'),
      value84 = handler4('rhVideoFps'),
      value85 = handler4('rhVideoFrames'),
      value86 = handler4('rhVideoSeconds'),
      handler5 = (value87, value88, value89 = {}) =>
        normalizeNumberValue(
          getNodeFieldValue(value80, value87?.['id'], value87?.['defaultValue'] ?? value88),
          Number(value88),
          value89,
        ),
      value90 = value83 ? handler5(value83, value83['defaultValue'] || 832, { min: 832 }) : 832;
    if (el27 && value86) {
      const value91 = value84 ? handler5(value84, value84['defaultValue'] || 24) : 24,
        value92 = handler5(value86, value86['defaultValue'] || 5, {
          min: Number(value86['min'] || 1),
          max: Number(value86['max'] || 600),
        });
      el27['textContent'] = joinMetricLabels([
        ['秒数', value92],
        ['帧率', value91],
        ['分辨率', value90],
      ]);
    } else {
      if (el27 && value85) {
        const count2 = handler5(value85, value85['defaultValue'] || 77, {
            min: Number(value85['min'] || 0),
            max: Number(value85['max'] || 0xf423f),
          }),
          value93 = count2 === 0 ? t('aigenImage.uiSchema.fullLength') : String(count2);
        if (value84) {
          const value94 = handler5(value84, value84['defaultValue'] || 24);
          el27['textContent'] = joinMetricLabels([
            ['帧数', value93],
            ['帧率', value94],
            ['分辨率', value90],
          ]);
        } else
          el27['textContent'] = joinMetricLabels([
            ['帧数', value93],
            ['分辨率', value90],
          ]);
      } else el27 && (el27['textContent'] = formatMetricLabel('分辨率', value90));
    }
    const el28 = el26?.['querySelector']?.('[data-ui-schema-field="rhVideoFrames"] .rh-stepper-value');
    if (value85 && el28) {
      const count3 = handler5(value85, value85['defaultValue'] || 77, {
        min: Number(value85['min'] || 0),
        max: Number(value85['max'] || 0xf423f),
      });
      ((el28['textContent'] = count3 === 0 ? t('aigenImage.uiSchema.fullLength') : String(count3)),
        el28['setAttribute']('aria-valuenow', String(count3)));
    }
    const el29 = el26?.['querySelector']?.('[data-ui-schema-field="rhVideoSeconds"] .rh-stepper-value');
    if (value86 && el29) {
      const value95 = handler5(value86, value86['defaultValue'] || 5, {
        min: Number(value86['min'] || 1),
        max: Number(value86['max'] || 600),
      });
      ((el29['textContent'] = String(value95)), el29['setAttribute']('aria-valuenow', String(value95)));
    }
    const el30 = el26?.['querySelector']?.('.rh-v5-source-framecount');
    if (el30) {
      const value96 = Number(value80?.['rhVideoSourceFrameCount'] || 0);
      el30['textContent'] = value96 ? String(value96) : '—';
    }
  }
  function run13(el31, value97 = {}) {
    const value98 = String(el31?.['dataset']?.['uiSchemaPrimaryField'] || 'voiceType')['trim'](),
      value99 = String(el31?.['dataset']?.['uiSchemaSecondaryField'] || 'speakerId')['trim'](),
      value100 = String(el31?.['dataset']?.['uiSchemaModeField'] || 'voiceMode')['trim'](),
      defaultModeValue = String(el31?.['dataset']?.['uiSchemaDefaultModeValue'] || 'default')['trim'](),
      customModeValue = String(el31?.['dataset']?.['uiSchemaCustomModeValue'] || 'custom')['trim'](),
      el32 = el31?.['querySelector']?.('.img-rp-voice-default-area'),
      el33 = el31?.['querySelector']?.('.img-rp-voice-custom-area'),
      el34 = el31?.['querySelector']?.('.ui-schema-voice-quality-ratio-label');
    if (!el32 || !el33 || !el34) return;
    const voiceTypeValue = el32['dataset']['uiSchemaDefault']
        ? (getNodeFieldValue(value97, value98) ?? el32['dataset']['uiSchemaDefault'])
        : getNodeFieldValue(value97, value98),
      speakerIdValue = String(getNodeFieldValue(value97, value99) || '')['trim'](),
      voiceModeValue = String(getNodeFieldValue(value97, value100, '') || '')['trim'](),
      voiceTypeLabel = el32['dataset']['uiSchemaDefault'] ? (run8(el32, voiceTypeValue) ?? '') : '',
      audioVoiceCompositeState = resolveAudioVoiceCompositeState({
        voiceTypeValue: voiceTypeValue,
        voiceTypeLabel: voiceTypeLabel || defaultModeValue,
        speakerIdValue: speakerIdValue,
        voiceModeValue: voiceModeValue,
        defaultModeValue: defaultModeValue,
        customModeValue: customModeValue,
      });
    (el32['classList']['toggle']('is-disabled', audioVoiceCompositeState['defaultAreaDisabled']),
      el33['classList']['toggle']('is-disabled', audioVoiceCompositeState['customAreaDisabled']),
      (el34['textContent'] = audioVoiceCompositeState['triggerLabel']));
  }
  function run14(el35, value101 = {}) {
    (el35['querySelectorAll']('[data-ui-schema-composite-field="qualityRatio"]')['forEach']((value102) =>
      run9(value102, value101),
    ),
      el35['querySelectorAll']('[data-ui-schema-composite-field="sectionPair"]')['forEach']((value103) =>
        run10(value103, value101),
      ),
      el35['querySelectorAll']('[data-ui-schema-composite-field="videoResolution"]')['forEach']((value104) =>
        run11(value104, value101),
      ),
      el35['querySelectorAll']('[data-ui-schema-composite-field="rhVideoParams"]')['forEach']((value105) =>
        run12(value105, value101),
      ),
      el35['querySelectorAll']('[data-ui-schema-composite-field="voiceQualityRatio"]')['forEach'](
        (value106) => run13(value106, value101),
      ));
  }
  function syncModelUiSchemaControls(el36, value107 = {}) {
    if (!el36) return;
    (run5(el36, value107),
      el36['querySelectorAll']('[data-ui-schema-field]')['forEach']((el37) => {
        const enabled16 = String(el37['dataset']['uiSchemaField'] || '')['trim']();
        if (!enabled16) return;
        let value108 =
          el37['dataset']['uiSchemaLockedValue'] ??
          getNodeFieldValue(value107, enabled16, el37['dataset']['uiSchemaDefault']);
        const value109 = String(el37['dataset']['uiSchemaDefaultAliases'] || '')['trim']();
        if (value109)
          try {
            const list13 = JSON['parse'](value109)
              ['map']((value110) =>
                String(value110 ?? '')
                  ['trim']()
                  ['toLowerCase'](),
              )
              ['filter'](Boolean);
            list13['includes'](
              String(value108 ?? '')
                ['trim']()
                ['toLowerCase'](),
            ) && (value108 = el37['dataset']['uiSchemaDefault']);
          } catch {}
        const el38 = findUiSchemaValueOption(el37, value108);
        if (el38?.['dataset']?.['uiSchemaDisabled'] === 'true') {
          const value111 = el37['dataset']['uiSchemaDefault'],
            el39 = findUiSchemaValueOption(el37, value111),
            el40 =
              el39?.['dataset']?.['uiSchemaDisabled'] === 'true'
                ? findFirstEnabledUiSchemaValueOption(el37)
                : el39;
          el40?.['dataset']?.['uiSchemaValue'] !== undefined && (value108 = el40['dataset']['uiSchemaValue']);
        }
        getUiSchemaValueOptions(el37)['forEach']((el41) => {
          el41['classList']['toggle'](
            'active',
            String(el41['dataset']['uiSchemaValue']) === String(value108),
          );
        });
        const el42 = findUiSchemaValueOption(el37, value108),
          el43 = el37['querySelector']('.ui-schema-pill-label');
        el43 &&
          el42?.['dataset']?.['uiSchemaOptionLabel'] &&
          (el43['textContent'] = el42['dataset']['uiSchemaOptionLabel']);
        (syncInstanceToggleField(el37, value108),
          syncStepperField(el37, value108),
          syncRhAiAppFooterParamField(el37, value108));
        const el44 = el37['querySelector']('[data-ui-schema-input]'),
          value112 = typeof document !== 'undefined' ? document['activeElement'] : null;
        if (el44 && value108 !== undefined && value112 !== el44) {
          const value113 = String(el37['dataset']['uiSchemaType'] || '')
              ['trim']()
              ['toLowerCase'](),
            enabled17 =
              value113 === 'text' ||
              value113 === 'textarea' ||
              String(el44['tagName'] || '')
                ['trim']()
                ['toLowerCase']() === 'textarea' ||
              String(el44['type'] || '')
                ['trim']()
                ['toLowerCase']() === 'text';
          if (!enabled17) {
            const list14 = parseRangeValuesFromFieldEl(el37),
              value114 = findRangeValueIndex(list14, value108);
            el44['value'] = list14?.['length'] ? String(Math['max'](0, value114)) : String(value108);
          }
          const el45 = el37['querySelector']('.ui-schema-value');
          if (el45) el45['textContent'] = String(value108);
        }
        (run6(el37, value107), run4(el37, value107));
      }),
      run14(el36, value107));
  }
  return Object['freeze']({ syncModelUiSchemaControls: syncModelUiSchemaControls });
}
