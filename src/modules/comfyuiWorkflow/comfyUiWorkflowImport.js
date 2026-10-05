import { buildManifestDraftBundle } from '../../manifests/index.js';
import { getParameterFooterFields } from '../../domain/customAiApp/parameterLayout.js';
export const COMFYUI_WORKFLOW_DISPLAY_NAME = 'ComfyUI 工作流';
const MEDIA_COMPONENT_KINDS = new Set(['image', 'video', 'audio']),
  COMPONENT_KINDS = new Set(['image', 'video', 'audio', 'prompt', 'param']),
  CONTROL_TYPES = new Set(['text', 'textarea', 'stepper', 'float', 'toggle', 'prompt']),
  OUTPUT_KINDS = new Set(['image', 'video', 'audio']),
  BASE_URL_MODES = new Set(['local', 'cloud']),
  COMPONENT_SELECTION_MODES = new Set(['auto', 'manual']),
  SCALAR_INPUT_TYPES = new Set(['string', 'number', 'boolean']),
  TEXT_CONTROL_OPTIONS = Object['freeze'](['text', 'textarea', 'prompt']),
  AMBIGUOUS_ZERO_CONTROL_OPTIONS = Object['freeze'](['text', 'stepper', 'float']),
  TEXT_COMPONENT_KIND_OPTIONS = Object['freeze'](['param', 'prompt']);
export const COMFYUI_GENERATION_COUNT_FIELD_ID = 'batchSize';
export const COMFYUI_GENERATION_COUNT_OPTIONS = Object['freeze']([1, 2, 4, 6, 8, 10, 12]);
const COMFYUI_GENERATION_COUNT_FIELD = Object['freeze']({
  id: COMFYUI_GENERATION_COUNT_FIELD_ID,
  type: 'segmented',
  placement: 'batch',
  label: '生成数量',
  defaultValue: 1,
  options: Object['freeze'](
    COMFYUI_GENERATION_COUNT_OPTIONS['map']((value) =>
      Object['freeze']({ value: value, label: value + 'x', selectedLabel: value + 'x' }),
    ),
  ),
  comfyUiSystemField: true,
});
function normalizeText(item, key = '') {
  const index = String(item ?? '')['trim']();
  return index || key;
}
function normalizeOutputKind(result) {
  const data = String(result || '')
    ['trim']()
    ['toLowerCase']();
  return OUTPUT_KINDS['has'](data) ? data : 'image';
}
function normalizeBaseUrlMode(options) {
  const target = String(options || '')
    ['trim']()
    ['toLowerCase']();
  return BASE_URL_MODES['has'](target) ? target : 'local';
}
function normalizeComponentSelectionMode(source) {
  const next = String(source || '')
    ['trim']()
    ['toLowerCase']();
  return COMPONENT_SELECTION_MODES['has'](next) ? next : 'auto';
}
function sanitizeIdentifierPart(current, entry = 'field') {
  const record = String(current || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/[^a-z0-9_-]+/g, '_')
    ['replace'](/^_+|_+$/g, '');
  return record || entry;
}
function createStableHash(payload) {
  const list = String(payload || '');
  let handle = 0x811c9dc5;
  for (let state = 0; state < list['length']; state += 1) {
    ((handle ^= list['charCodeAt'](state)), (handle = Math['imul'](handle, 0x1000193)));
  }
  return (handle >>> 0)['toString'](36)['padStart'](7, '0')['slice'](0, 8);
}
function extractFirstJsonObject(config) {
  const list2 = String(config || ''),
    count = list2['indexOf']('{');
  if (count < 0) return '';
  let count2 = 0,
    enabled = false,
    scope = '',
    input = false;
  for (let output = count; output < list2['length']; output += 1) {
    const value2 = list2[output];
    if (enabled) {
      if (input) {
        input = false;
        continue;
      }
      if (value2 === '\\') {
        input = true;
        continue;
      }
      value2 === scope && ((enabled = false), (scope = ''));
      continue;
    }
    if (value2 === '"' || value2 === '\'') {
      ((enabled = true), (scope = value2));
      continue;
    }
    if (value2 === '{') count2 += 1;
    if (value2 === '}') {
      count2 -= 1;
      if (count2 === 0) return list2['slice'](count, output + 1);
    }
  }
  return '';
}
function parseJsonPayload(value3) {
  try {
    return JSON['parse'](value3);
  } catch (error) {
    throw new Error('ComfyUI 工作流 JSON 解析失败：' + (error?.['message'] || '格式错误'));
  }
}
function isComfyUiApiNode(value4) {
  return Boolean(
    value4 &&
    typeof value4 === 'object' &&
    !Array['isArray'](value4) &&
    value4['inputs'] &&
    typeof value4['inputs'] === 'object' &&
    !Array['isArray'](value4['inputs']),
  );
}
function normalizeComfyUiWorkflowGraph(value5) {
  const enabled2 =
    value5?.['prompt'] && typeof value5['prompt'] === 'object' && !Array['isArray'](value5['prompt'])
      ? value5['prompt']
      : value5?.['workflow'] &&
          typeof value5['workflow'] === 'object' &&
          !Array['isArray'](value5['workflow'])
        ? value5['workflow']
        : value5;
  if (!enabled2 || typeof enabled2 !== 'object' || Array['isArray'](enabled2))
    throw new Error('ComfyUI 工作流 API JSON 必须是节点对象');
  const list3 = Object['entries'](enabled2)['filter'](([, value6]) => isComfyUiApiNode(value6));
  if (list3['length'] === 0)
    throw new Error('未找到 ComfyUI API 格式节点，请导出 API format workflow JSON');
  return list3['reduce']((value7, [value8, args]) => {
    return ((value7[String(value8)] = { ...args, inputs: { ...(args['inputs'] || {}) } }), value7);
  }, {});
}
export function parseComfyUiWorkflowApiInput(value9) {
  const sourceText = String(value9 || '')['trim']();
  if (!sourceText) throw new Error('请粘贴 ComfyUI API workflow JSON');
  const enabled3 = sourceText['startsWith']('{') ? sourceText : extractFirstJsonObject(sourceText);
  if (!enabled3) throw new Error('未找到 ComfyUI workflow JSON');
  const body = parseJsonPayload(enabled3),
    workflow = normalizeComfyUiWorkflowGraph(body);
  return { body: body, workflow: workflow, sourceText: sourceText };
}
function isConnectionValue(list4) {
  return (
    Array['isArray'](list4) &&
    list4['length'] >= 2 &&
    (typeof list4[0] === 'string' || typeof list4[0] === 'number') &&
    typeof list4[1] === 'number'
  );
}
function isScalarValue(value10) {
  return SCALAR_INPUT_TYPES['has'](typeof value10) || value10 === null;
}
function isComfyUiMediaUiInputName(value11) {
  const value12 = String(value11 || '')
    ['trim']()
    ['toLowerCase']();
  return value12 === 'imageui' || value12 === 'videoui' || value12 === 'audioui';
}
function sortNodeEntries(value13) {
  return Object['entries'](value13)['sort'](([value14], [value15]) => {
    const value16 = Number(value14),
      value17 = Number(value15);
    if (Number['isFinite'](value16) && Number['isFinite'](value17) && value16 !== value17)
      return value16 - value17;
    return String(value14)['localeCompare'](String(value15));
  });
}
function isMediaInput(value18, value19) {
  const list5 = String(value18 || '')['toLowerCase'](),
    list6 = String(value19 || '')['toLowerCase']();
  if (isComfyUiMediaUiInputName(list6)) return '';
  if (list5['includes']('loadimage') && list6 === 'image') return 'image';
  if ((list5['includes']('loadvideo') || list5['includes']('videoload')) && list6['includes']('video'))
    return 'video';
  if ((list5['includes']('loadaudio') || list5['includes']('audioload')) && list6['includes']('audio'))
    return 'audio';
  if (list6 === 'image' || list6['endsWith']('_image')) return 'image';
  if (list6 === 'video' || list6['endsWith']('_video')) return 'video';
  if (list6 === 'audio' || list6['endsWith']('_audio')) return 'audio';
  return '';
}
function isPromptInput(value20, value21, value22) {
  const list7 = String(value20 || '')['toLowerCase'](),
    value23 = String(value21 || '')['toLowerCase']();
  if (typeof value22 !== 'string') return false;
  if (list7['includes']('cliptextencode') && value23 === 'text') return true;
  return (
    /prompt|positive|negative|text|caption|description/['test'](value23) && looksLikeStructuredText(value22)
  );
}
function containsCjkText(value24) {
  return /[\u3400-\u9fff]/u['test'](String(value24 ?? ''));
}
function looksLikeLongEnglishText(value25) {
  const value26 = String(value25 ?? '')['trim'](),
    list8 = value26['match'](/[A-Za-z][A-Za-z'-]*/g) || [],
    count3 = (value26['match'](/[A-Za-z]/g) || [])['length'];
  return list8['length'] >= 4 || count3 >= 28;
}
function looksLikeStructuredText(value27) {
  const list9 = String(value27 ?? '')['trim']();
  if (!list9) return true;
  return (
    containsCjkText(list9) ||
    looksLikeLongEnglishText(list9) ||
    list9['length'] > 42 ||
    /[\s,.;:!?，。；：！？、]/['test'](list9)
  );
}
function isBooleanLiteral(value28) {
  const value29 = String(value28 ?? '')
    ['trim']()
    ['toLowerCase']();
  return value29 === 'true' || value29 === 'false';
}
function isIntegerLiteral(value30) {
  return /^[+-]?\d+$/['test'](String(value30 ?? '')['trim']());
}
function isDecimalLiteral(value31) {
  return /^[+-]?(?:\d+\.\d+|\.\d+)$/['test'](String(value31 ?? '')['trim']());
}
function isAmbiguousZeroLiteral(value32) {
  return /^[+-]?0+$/['test'](String(value32 ?? '')['trim']());
}
function inferTextControlType(value33, value34) {
  const value35 = String(value34 || '')['toLowerCase']();
  if (/prompt|positive|negative|text|caption|description/['test'](value35)) return 'textarea';
  return looksLikeStructuredText(value33) ? 'textarea' : 'text';
}
function inferComponentConfig({ classType: classType, inputName: inputName, value: value36 }) {
  const componentKind = isMediaInput(classType, inputName);
  if (componentKind)
    return {
      componentKind: componentKind,
      componentKindLocked: true,
      componentKindOptions: [componentKind],
      controlType: 'text',
      controlTypeLocked: true,
      controlTypeOptions: [],
    };
  if (isPromptInput(classType, inputName, value36))
    return {
      componentKind: 'prompt',
      componentKindLocked: false,
      componentKindOptions: TEXT_COMPONENT_KIND_OPTIONS['slice'](),
      controlType: 'prompt',
      controlTypeLocked: false,
      controlTypeOptions: TEXT_CONTROL_OPTIONS['slice'](),
    };
  if (typeof value36 === 'boolean' || isBooleanLiteral(value36))
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'toggle',
      controlTypeLocked: true,
      controlTypeOptions: ['toggle'],
    };
  if (typeof value36 === 'number' && Number['isInteger'](value36))
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'stepper',
      controlTypeLocked: value36 !== 0,
      controlTypeOptions: value36 === 0 ? AMBIGUOUS_ZERO_CONTROL_OPTIONS['slice']() : ['stepper'],
    };
  if (typeof value36 === 'number' || isDecimalLiteral(value36))
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'float',
      controlTypeLocked: true,
      controlTypeOptions: ['float'],
    };
  if (isIntegerLiteral(value36))
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'stepper',
      controlTypeLocked: !isAmbiguousZeroLiteral(value36),
      controlTypeOptions: isAmbiguousZeroLiteral(value36)
        ? AMBIGUOUS_ZERO_CONTROL_OPTIONS['slice']()
        : ['stepper'],
    };
  return {
    componentKind: 'param',
    componentKindLocked: false,
    componentKindOptions: TEXT_COMPONENT_KIND_OPTIONS['slice'](),
    controlType: inferTextControlType(value36, inputName),
    controlTypeLocked: false,
    controlTypeOptions: TEXT_CONTROL_OPTIONS['slice'](),
  };
}
export function formatComfyUiComponentLabel(options2 = {}) {
  const text = normalizeText(options2?.['inputName'], 'value'),
    text2 =
      normalizeText(options2?.['nodeTitle']) ||
      normalizeText(options2?.['classType']) ||
      normalizeText(options2?.['nodeId']);
  return text2 ? (options2['inputCount'] === 1 ? text2 : text2 + '.' + text) : text;
}
function createComponentLabel({
  nodeId: nodeId,
  nodeTitle: nodeTitle,
  classType: classType2,
  inputName: inputName2,
  inputCount: inputCount,
} = {}) {
  return formatComfyUiComponentLabel({
    nodeId: nodeId,
    nodeTitle: nodeTitle,
    classType: classType2,
    inputName: inputName2,
    inputCount: inputCount,
  });
}
function createComponentKey(value37, value38, value39) {
  return [value37, value38, value39]
    ['map']((value40) => normalizeText(value40)['toLowerCase']())
    ['join']('::');
}
function getComfyUiNodeTitle(error2 = {}) {
  return normalizeText(
    error2?.['_meta']?.['title'] ||
      error2?.['_meta']?.['name'] ||
      error2?.['title'] ||
      error2?.['name'] ||
      error2?.['label'],
  );
}
function createComponentId(value41, value42) {
  const sanitizeIdentifierPart2 = sanitizeIdentifierPart(value41?.['nodeId'], 'node_' + value42),
    sanitizeIdentifierPart3 = sanitizeIdentifierPart(value41?.['inputName'], 'value');
  return 'comfyui_' + sanitizeIdentifierPart2 + '_' + sanitizeIdentifierPart3 + '_' + value42;
}
function createSlotId(value43, value44, value45) {
  const sanitizeIdentifierPart4 = sanitizeIdentifierPart(value44?.['nodeId'], 'node_' + value45),
    sanitizeIdentifierPart5 = sanitizeIdentifierPart(value44?.['inputName'], value43);
  return 'comfyui_' + value43 + '_' + sanitizeIdentifierPart4 + '_' + sanitizeIdentifierPart5 + '_' + value45;
}
function normalizeComponentKind(value46, value47 = 'param') {
  const value48 = String(value46 || '')
    ['trim']()
    ['toLowerCase']();
  return COMPONENT_KINDS['has'](value48) ? value48 : value47;
}
function normalizeControlType(value49, value50 = 'text') {
  const value51 = String(value49 || '')
    ['trim']()
    ['toLowerCase']();
  if (value51 === 'integer' || value51 === 'number') return 'stepper';
  if (value51 === 'decimal') return 'float';
  if (value51 === 'boolean' || value51 === 'bool') return 'toggle';
  return CONTROL_TYPES['has'](value51) ? value51 : value50;
}
function normalizeBooleanDefault(value52) {
  const value53 = String(value52 ?? '')
    ['trim']()
    ['toLowerCase']();
  return value52 === true || value53 === 'true' || value53 === '1' || value53 === 'yes' || value53 === 'on';
}
function normalizeIntegerDefault(value54) {
  const value55 = Number(value54);
  return Number['isFinite'](value55) ? Math['trunc'](value55) : 0;
}
function normalizeFloatDefault(value56) {
  const value57 = Number(value56);
  return Number['isFinite'](value57) ? value57 : 0;
}
function normalizeDefaultValueForControl(value58, value59) {
  const controlType = normalizeControlType(value58);
  if (controlType === 'toggle') return normalizeBooleanDefault(value59);
  if (controlType === 'stepper') return normalizeIntegerDefault(value59);
  if (controlType === 'float') return normalizeFloatDefault(value59);
  return String(value59 ?? '');
}
function normalizeOrderValue(value60, value61) {
  const value62 = Number(value60);
  return Number['isFinite'](value62) ? value62 : value61;
}
function normalizePreviewPlacement(value63) {
  return String(value63 || '')['trim']() === 'home' ? 'home' : 'advanced';
}
function getNodeTransformForControl(value64) {
  const controlType2 = normalizeControlType(value64);
  if (controlType2 === 'toggle') return 'boolean';
  if (controlType2 === 'stepper') return 'integer';
  if (controlType2 === 'float') return 'number';
  return '';
}
function getUiSchemaTypeForControl(value65) {
  const controlType3 = normalizeControlType(value65);
  return controlType3 === 'float' ? 'stepper' : controlType3;
}
function getFloatStep(value66) {
  const value67 = String(value66 ?? '')['trim'](),
    value68 = value67['match'](/\.(\d+)/),
    value69 = value68 ? Math['max'](1, value68[1]['length']) : 2;
  return Number('0.' + '0'['repeat'](Math['max'](0, value69 - 1)) + '1');
}
function normalizeOptionList(list10 = [], map = null) {
  if (!Array['isArray'](list10)) return [];
  return list10['map']((value70) =>
    String(value70 || '')
      ['trim']()
      ['toLowerCase'](),
  )['filter']((enabled4, value71, list11) => {
    if (!enabled4 || list11['indexOf'](enabled4) !== value71) return false;
    return !map || map['has'](enabled4);
  });
}
function pickAllowedValue(value72, list12, value73) {
  const value74 = String(value72 || '')
    ['trim']()
    ['toLowerCase']();
  return list12['includes'](value74) ? value74 : value73;
}
function normalizeComponentOverride(required, el) {
  const componentKindLocked = inferComponentConfig(el),
    componentKindOptions = normalizeOptionList(componentKindLocked['componentKindOptions'], COMPONENT_KINDS),
    controlTypeOptions = normalizeOptionList(componentKindLocked['controlTypeOptions'], CONTROL_TYPES),
    value75 = componentKindLocked['componentKind'] || 'param',
    controlType4 = normalizeControlType(componentKindLocked['controlType']),
    componentKind2 = normalizeComponentKind(required?.['componentKind'], value75);
  let componentKind3 =
    componentKindLocked['componentKindLocked'] === true
      ? value75
      : pickAllowedValue(
          componentKind2,
          componentKindOptions['length'] ? componentKindOptions : [componentKind2],
          value75,
        );
  const controlType5 = normalizeControlType(required?.['controlType'], controlType4);
  let controlType6 =
    componentKind3 === 'prompt'
      ? 'prompt'
      : componentKindLocked['controlTypeLocked'] === true
        ? controlType4
        : pickAllowedValue(
            controlType5,
            controlTypeOptions['length'] ? controlTypeOptions : [controlType4],
            controlType4,
          );
  return (
    controlType6 === 'prompt' &&
      !componentKindLocked['componentKindLocked'] &&
      componentKindOptions['includes']('prompt') &&
      (componentKind3 = 'prompt'),
    {
      label: normalizeText(required?.['label'], el['label']),
      description: normalizeText(required?.['description'], el['label']),
      componentKind: componentKind3,
      componentKindLocked: componentKindLocked['componentKindLocked'] === true,
      componentKindOptions: componentKindOptions['length'] ? componentKindOptions : [componentKind3],
      controlType: controlType6,
      controlTypeLocked: componentKindLocked['controlTypeLocked'] === true,
      controlTypeOptions: controlTypeOptions,
      inputOrder: normalizeOrderValue(required?.['inputOrder'], el['index']),
      homeParamOrder: normalizeOrderValue(required?.['homeParamOrder'], el['index']),
      advancedParamOrder: normalizeOrderValue(required?.['advancedParamOrder'], el['index']),
      previewPlacement: normalizePreviewPlacement(required?.['previewPlacement']),
      footerGroupId: String(required?.['footerGroupId'] || '')['trim'](),
      footerGroupLabel: String(required?.['footerGroupLabel'] || '参数组')['trim'](),
      footerGroupDescription: String(required?.['footerGroupDescription'] || '')['trim'](),
      required: required?.['required'] !== false,
      defaultValue: normalizeDefaultValueForControl(
        controlType6,
        required?.['defaultValue'] === undefined ? el['value'] : required['defaultValue'],
      ),
    }
  );
}
function buildComponentOverrideMap(list13 = []) {
  const map2 = new Map();
  if (!Array['isArray'](list13)) return map2;
  return (
    list13['forEach']((value76) => {
      const count4 = Number(value76?.['index']);
      if (!Number['isInteger'](count4) || count4 < 0) return;
      map2['set'](count4, value76);
    }),
    map2
  );
}
function collectComponentDraftItems(value77) {
  const list14 = [];
  return (
    sortNodeEntries(value77)['forEach'](([nodeId2, value78]) => {
      const classType3 = normalizeText(value78?.['class_type'] || value78?.['classType']),
        nodeTitle2 = getComfyUiNodeTitle(value78),
        inputCount2 = Object['entries'](value78['inputs'] || {})['filter'](
          ([value79, value80]) =>
            !isComfyUiMediaUiInputName(value79) && !isConnectionValue(value80) && isScalarValue(value80),
        );
      inputCount2['forEach'](([inputName3, value81]) => {
        const index2 = list14['length'],
          args2 = {
            index: index2,
            nodeId: String(nodeId2),
            nodeTitle: nodeTitle2,
            classType: classType3,
            inputName: inputName3,
            inputCount: inputCount2['length'],
            value: value81,
            componentKey: createComponentKey(nodeId2, classType3, inputName3),
            label: createComponentLabel({
              nodeId: nodeId2,
              nodeTitle: nodeTitle2,
              classType: classType3,
              inputName: inputName3,
              inputCount: inputCount2['length'],
            }),
          },
          componentKind4 = inferComponentConfig(args2);
        list14['push']({
          ...args2,
          componentKind: componentKind4['componentKind'],
          componentKindLocked: componentKind4['componentKindLocked'] === true,
          componentKindOptions: componentKind4['componentKindOptions'] || ['param'],
          controlType: componentKind4['controlType'],
          controlTypeLocked: componentKind4['controlTypeLocked'] === true,
          controlTypeOptions: componentKind4['controlTypeOptions'] || [],
          defaultValue: String(value81 ?? ''),
        });
      });
    }),
    list14
  );
}
export function createComfyUiWorkflowComponentDrafts(value82) {
  const parsed = parseComfyUiWorkflowApiInput(value82);
  return { parsed: parsed, components: collectComponentDraftItems(parsed['workflow']) };
}
function buildInputSlotCounts(list15) {
  return list15['reduce']((value83, value84) => {
    const enabled5 = String(value84?.['kind'] || '')['trim']();
    if (!enabled5) return value83;
    return ((value83[enabled5] = (value83[enabled5] || 0) + 1), value83);
  }, {});
}
export function compileComfyUiWorkflowComponents(workflow2, outputType, value85 = [], value86 = {}) {
  const componentSelectionMode2 = normalizeComponentSelectionMode(value86['componentSelectionMode']),
    map3 =
      componentSelectionMode2 === 'manual'
        ? new Set(
            (Array['isArray'](value85) ? value85 : [])
              ['map']((value87) => Number(value87?.['index']))
              ['filter']((count5) => Number['isInteger'](count5) && count5 >= 0),
          )
        : null,
    map4 = buildComponentOverrideMap(value85),
    list16 = collectComponentDraftItems(workflow2['workflow'])
      ['filter']((value88) => !map3 || map3['has'](Number(value88['index'])))
      ['map']((item2) => ({
        item: item2,
        component: normalizeComponentOverride(map4['get'](item2['index']), item2),
      })),
    placement = getParameterFooterFields(
      list16['map'](({ item: item3, component: component }) => ({
        ...component,
        index: item3['index'],
      })),
    ),
    list17 = [],
    list18 = [],
    inputs = [];
  let value89 = false,
    text3 = '';
  list16['forEach'](({ item: item4, component: component2 }) => {
    const value90 = item4['index'],
      label = component2['label'],
      description2 = component2['description'] || label,
      kind2 = component2['componentKind'];
    if (MEDIA_COMPONENT_KINDS['has'](kind2)) {
      const id = createSlotId(kind2, item4, value90);
      (list17['push']({
        id: id,
        kind: kind2,
        label: label,
        description: description2,
        required: component2['required'],
        displayOrder: component2['inputOrder'],
        customAiAppComponentIndex: item4['index'],
        comfyUiComponentIndex: item4['index'],
      }),
        inputs['push']({
          nodeId: item4['nodeId'],
          inputName: item4['inputName'],
          source: kind2 + 'Input',
          field: id,
          slot: id,
          required: component2['required'],
          missingMessage: '请接入' + label,
          description: description2,
        }));
      return;
    }
    if (kind2 === 'prompt') {
      value89 = true;
      !text3 && (text3 = normalizeText(map4['get'](item4['index'])?.['description']));
      inputs['push']({
        nodeId: item4['nodeId'],
        inputName: item4['inputName'],
        source: 'prompt',
        defaultValue: component2['defaultValue'],
        includeEmpty: true,
        description: description2,
      });
      return;
    }
    const id2 = createComponentId(item4, value90),
      step = normalizeControlType(component2['controlType']),
      type = getUiSchemaTypeForControl(step),
      defaultValue = normalizeDefaultValueForControl(step, component2['defaultValue']),
      transform = getNodeTransformForControl(step);
    (list18['push']({
      id: id2,
      type: type,
      placement: placement['has'](item4['index']) ? 'mode' : 'advanced',
      ...(placement['has'](item4['index'])
        ? { ...placement['get'](item4['index']) }
        : { displayOrder: component2['advancedParamOrder'] }),
      label: label,
      defaultValue: defaultValue,
      description: description2,
      customAiAppComponentIndex: item4['index'],
      comfyUiComponentIndex: item4['index'],
      ...(type === 'stepper'
        ? {
            step: step === 'float' ? getFloatStep(defaultValue) : 1,
            ...(step === 'float' ? { valueType: 'float' } : {}),
          }
        : {}),
    }),
      inputs['push']({
        nodeId: item4['nodeId'],
        inputName: item4['inputName'],
        source: 'param',
        field: id2,
        defaultValue: defaultValue,
        ...(transform ? { transform: transform } : {}),
        description: description2,
      }));
  });
  const args3 = buildInputSlotCounts(list17),
    allowedKinds = Array['from'](
      new Set([...(value89 ? ['text'] : []), ...list17['map']((value91) => value91['kind'])]),
    ),
    fixedSlots = list17['map']((args4, _sourceOrder) => ({ ...args4, _sourceOrder: _sourceOrder }))
      ['sort']((value92, value93) => {
        const orderValue =
          normalizeOrderValue(value92['displayOrder'], value92['_sourceOrder']) -
          normalizeOrderValue(value93['displayOrder'], value93['_sourceOrder']);
        if (orderValue !== 0) return orderValue;
        return value92['_sourceOrder'] - value93['_sourceOrder'];
      })
      ['map'](({ _sourceOrder: _sourceOrder2, ...args5 }, displayOrder) => ({
        ...args5,
        displayOrder: displayOrder,
      })),
    uiFields = list18['sort']((value94, value95) => {
      const count6 = String(value94?.['placement'] || '')['localeCompare'](
        String(value95?.['placement'] || ''),
      );
      if (count6 !== 0) return count6;
      return (
        normalizeOrderValue(value94?.['displayOrder'], Number['MAX_SAFE_INTEGER']) -
        normalizeOrderValue(value95?.['displayOrder'], Number['MAX_SAFE_INTEGER'])
      );
    }),
    help = normalizeText(value86['promptHelpTooltip']);
  return {
    fixedSlots: fixedSlots,
    uiFields: uiFields,
    inputSlots: {
      allowedKinds: allowedKinds['slice'](),
      minByKind: { ...args3 },
      maxByKind: { ...args3 },
      fixedSlots: fixedSlots,
    },
    capabilities: {
      inputKinds: allowedKinds['slice'](),
      outputType: outputType,
      fixedAssetSlots: fixedSlots['map']((value96) => value96['id']),
    },
    mapping: { workflow: workflow2['workflow'], inputs: inputs },
    help: help || text3 ? { tooltip: help || text3 } : null,
    prompt: { emptyPolicy: 'allow' },
  };
}
function classTypeLooksLikeOutput(value97, value98) {
  const list19 = String(value98 || '')['toLowerCase']();
  if (value97 === 'video')
    return (
      list19['includes']('video') ||
      list19['includes']('vhs') ||
      list19['includes']('webp') ||
      list19['includes']('gif')
    );
  if (value97 === 'audio') return list19['includes']('audio') || list19['includes']('sound');
  return list19['includes']('saveimage') || list19['includes']('previewimage') || list19['includes']('image');
}
function inferOutputNodes(value99, value100) {
  return sortNodeEntries(value99)
    ['filter'](([, value101]) =>
      classTypeLooksLikeOutput(value100, value101?.['class_type'] || value101?.['classType']),
    )
    ['map'](([value102]) => String(value102));
}
function buildResultConfig(value103, value104) {
  const outputNodes = inferOutputNodes(value103, value104);
  if (value104 === 'video')
    return {
      outputType: 'video',
      taskIdPath: 'prompt_id',
      resultPaths: ['videos[].url', 'video_urls[]', 'results[].videoUrl', 'results[].url'],
      ...(outputNodes['length'] ? { outputNodes: outputNodes } : {}),
    };
  if (value104 === 'audio')
    return {
      outputType: 'audio',
      taskIdPath: 'prompt_id',
      resultPaths: ['audios[].url', 'audio_urls[]', 'results[].audioUrl', 'results[].url'],
      ...(outputNodes['length'] ? { outputNodes: outputNodes } : {}),
    };
  return {
    outputType: 'image',
    taskIdPath: 'prompt_id',
    resultPaths: ['images[].url', 'image_urls[]', 'results[].imageUrl', 'results[].url'],
    ...(outputNodes['length'] ? { outputNodes: outputNodes } : {}),
  };
}
function buildComfyUiSystemUiFields(value105) {
  if (value105 !== 'image') return [];
  return [COMFYUI_GENERATION_COUNT_FIELD];
}
function isComfyUiSystemUiField(value106) {
  return value106?.['comfyUiSystemField'] === true;
}
function getComfyUiWorkflowImageMenuGroup(value107) {
  return value107 === 'cloud' ? 'comfyUiCloudWorkflow' : 'comfyUiLocalWorkflow';
}
function getComfyUiWorkflowImageMenuIconKind(value108) {
  return value108 === 'cloud' ? 'comfyUiCloudWorkflowBadge' : 'comfyUiLocalWorkflowBadge';
}
function getComfyUiWorkflowImageMenuSubtitle(value109, value110 = '') {
  const text4 = normalizeText(value110);
  if (text4 && text4 !== 'ComfyUI cloud workflow' && text4 !== 'ComfyUI local workflow') return text4;
  return value109 === 'cloud' ? 'ComfyUI 云端工作流' : 'ComfyUI 本地工作流';
}
function buildModelExtensions(kind3, workflowId, name, value111 = '', value112 = '', value113 = {}) {
  const appKey2 = normalizeText(value111),
    isSavedApp = Boolean(appKey2),
    baseUrlMode2 = normalizeBaseUrlMode(value113['baseUrlMode']),
    componentSelectionMode3 = normalizeComponentSelectionMode(value113['componentSelectionMode']),
    value114 = {
      comfyUiWorkflow: {
        workflowId: workflowId,
        kind: kind3,
        appKey: appKey2,
        name: name,
        description: normalizeText(value112),
        baseUrlMode: baseUrlMode2,
        componentSelectionMode: componentSelectionMode3,
        isSavedApp: isSavedApp,
      },
    };
  return (
    isSavedApp &&
      kind3 === 'image' &&
      (value114['imageMenu'] = {
        group: getComfyUiWorkflowImageMenuGroup(baseUrlMode2),
        order: 999,
        title: name,
        subtitle: getComfyUiWorkflowImageMenuSubtitle(baseUrlMode2, value112),
        iconKind: getComfyUiWorkflowImageMenuIconKind(baseUrlMode2),
      }),
    isSavedApp &&
      kind3 === 'video' &&
      (value114['videoMenu'] = {
        role: 'comfyUiWorkflow',
        group: getComfyUiWorkflowImageMenuGroup(baseUrlMode2),
        order: 999,
        label: name,
        subtitle: getComfyUiWorkflowImageMenuSubtitle(baseUrlMode2, value112),
        iconKind: getComfyUiWorkflowImageMenuIconKind(baseUrlMode2),
      }),
    isSavedApp &&
      kind3 === 'audio' &&
      (value114['audioMenu'] = {
        group: getComfyUiWorkflowImageMenuGroup(baseUrlMode2),
        order: 999,
        label: name,
        subtitle: getComfyUiWorkflowImageMenuSubtitle(baseUrlMode2, value112),
        iconKind: getComfyUiWorkflowImageMenuIconKind(baseUrlMode2),
      }),
    value114
  );
}
export function buildComfyUiWorkflowManifestBundle({
  input: input2,
  kind: kind = 'image',
  components: components = [],
  displayName: displayName = COMFYUI_WORKFLOW_DISPLAY_NAME,
  description: description = '',
  appKey: appKey = '',
  baseUrlMode: baseUrlMode = 'local',
  componentSelectionMode: componentSelectionMode = 'auto',
  promptHelpTooltip: promptHelpTooltip = '',
} = {}) {
  const workflow3 = parseComfyUiWorkflowApiInput(input2),
    kind4 = normalizeOutputKind(kind),
    baseUrlMode3 = normalizeBaseUrlMode(baseUrlMode),
    componentSelectionMode4 = normalizeComponentSelectionMode(componentSelectionMode),
    displayName2 = normalizeText(displayName, COMFYUI_WORKFLOW_DISPLAY_NAME),
    description3 =
      normalizeText(description) ||
      (baseUrlMode3 === 'cloud' ? 'ComfyUI cloud workflow' : 'ComfyUI local workflow'),
    promptHelpTooltip2 = normalizeText(promptHelpTooltip),
    stableHash = createStableHash(
      JSON['stringify']({
        kind: kind4,
        appKey: normalizeText(appKey),
        description: description3,
        promptHelpTooltip: promptHelpTooltip2,
        baseUrlMode: baseUrlMode3,
        componentSelectionMode: componentSelectionMode4,
        workflow: workflow3['workflow'],
        components: components,
      }),
    ),
    workflowId2 = 'comfyui-' + kind4 + '-' + stableHash,
    modelId = 'comfyui/workflow-' + kind4 + '-' + stableHash,
    executionId = 'comfyui.workflow.' + kind4 + '.' + stableHash + '.v1',
    mapping = compileComfyUiWorkflowComponents(workflow3, kind4, components, {
      componentSelectionMode: componentSelectionMode4,
      promptHelpTooltip: promptHelpTooltip2,
    }),
    uiFields2 = [...buildComfyUiSystemUiFields(kind4), ...mapping['uiFields']];
  return buildManifestDraftBundle({
    sourceId: 'comfyui-workflow:' + kind4 + ':' + stableHash,
    modelId: modelId,
    executionId: executionId,
    provider: 'comfyui',
    adapterType: 'workflow',
    kind: kind4,
    outputType: kind4,
    displayName: displayName2,
    description: description3,
    workflowId: workflowId2,
    submitMode: 'comfyui-prompt',
    queryMode: 'comfyui-history',
    mapping: mapping['mapping'],
    uiFields: uiFields2,
    inputSlots: mapping['inputSlots'],
    help: mapping['help'],
    prompt: mapping['prompt'],
    capabilities: mapping['capabilities'],
    modelExtensions: buildModelExtensions(kind4, workflowId2, displayName2, appKey, description3, {
      baseUrlMode: baseUrlMode3,
      componentSelectionMode: componentSelectionMode4,
    }),
    executionExtensions: {
      comfyui: { baseUrlMode: baseUrlMode3, componentSelectionMode: componentSelectionMode4 },
    },
    result: buildResultConfig(workflow3['workflow'], kind4),
  });
}
export function summarizeComfyUiWorkflowBundle(value115) {
  const kind5 = value115?.['models']?.[0] || {},
    workflowId3 = value115?.['executions']?.[0] || {},
    slotCount = Array['isArray'](kind5?.['inputSlots']?.['fixedSlots'])
      ? kind5['inputSlots']['fixedSlots']
      : [],
    list20 = Array['isArray'](kind5?.['uiSchema']?.['fields']) ? kind5['uiSchema']['fields'] : [],
    paramCount = list20['filter']((value116) => !isComfyUiSystemUiField(value116)),
    mappingCount = Array['isArray'](workflowId3?.['mapping']?.['inputs'])
      ? workflowId3['mapping']['inputs']
      : [];
  return {
    workflowId: workflowId3['workflowId'] || '',
    kind: kind5['kind'] || workflowId3['kind'] || '',
    modelId: kind5['modelId'] || '',
    displayName: kind5['displayName'] || '',
    baseUrlMode:
      workflowId3['extensions']?.['comfyui']?.['baseUrlMode'] ||
      kind5['extensions']?.['comfyUiWorkflow']?.['baseUrlMode'] ||
      'local',
    componentSelectionMode:
      workflowId3['extensions']?.['comfyui']?.['componentSelectionMode'] ||
      kind5['extensions']?.['comfyUiWorkflow']?.['componentSelectionMode'] ||
      'auto',
    slotCount: slotCount['length'],
    paramCount: paramCount['length'],
    mappingCount: mappingCount['length'],
    slots: slotCount['map']((id3) => ({
      id: id3['id'],
      kind: id3['kind'],
      label: id3['label'] || id3['id'],
      required: id3['required'] === true,
    })),
    params: paramCount['map']((id4) => ({
      id: id4['id'],
      label: id4['label'] || id4['id'],
      type: id4['type'] || 'text',
      placement: id4['placement'] || 'advanced',
      variant: id4['variant'] || '',
    })),
  };
}
