import { buildManifestDraftBundle } from '../../manifests/index.js';
import { inferRunningHubFieldMetadata, getRunningHubFieldOptions } from './rhAiAppFieldMetadata.js';
import { resolveRunningHubSiteProfileIdFromUrl } from '../runningHubProviderProfiles.js';
import { RUNNINGHUB_INSTANCE_OPTIONS, normalizeRunningHubInstanceType } from '../runningHubInstanceTypes.js';
export const RH_AI_APP_DISPLAY_NAME = 'RH AI应用';
export { CUSTOM_APP_FOOTER_LIMIT as RH_AI_APP_FOOTER_PARAM_LIMIT } from '../../domain/customAiApp/parameterLayout.js';
import { getParameterFooterFields } from '../../domain/customAiApp/parameterLayout.js';
const RUNNINGHUB_AI_APP_URL_RE =
    /https?:\/\/(?:www\.)?runninghub\.(?:cn|ai)\/openapi\/v2\/run\/ai-app\/([^'"`\s\\]+)/i,
  DATA_FLAG_RE = /--data(?:-raw|-binary)?\s+/i,
  MEDIA_FIELD_KINDS = new Set(['image', 'video', 'audio']),
  OUTPUT_KINDS = new Set(['image', 'video', 'audio']),
  COMPONENT_KINDS = new Set(['image', 'video', 'audio', 'prompt', 'param']),
  CONTROL_TYPES = new Set(['text', 'textarea', 'stepper', 'float', 'toggle', 'prompt', 'select']),
  TEXT_CONTROL_OPTIONS = Object['freeze'](['text', 'textarea', 'prompt']),
  AMBIGUOUS_ZERO_CONTROL_OPTIONS = Object['freeze'](['text', 'stepper', 'float']),
  TEXT_COMPONENT_KIND_OPTIONS = Object['freeze'](['param', 'prompt']),
  INSTANCE_FIELD = Object['freeze']({
    id: 'rhInstanceType',
    type: 'segmented',
    placement: 'instance',
    label: '显存',
    defaultValue: 'default',
    options: RUNNINGHUB_INSTANCE_OPTIONS,
  });
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function normalizeOutputKind(index) {
  const result = String(index || '')
    ['trim']()
    ['toLowerCase']();
  return OUTPUT_KINDS['has'](result) ? result : 'image';
}
function normalizeInstanceType(data) {
  return normalizeRunningHubInstanceType(data);
}
function sanitizeIdentifierPart(options, target = 'field') {
  const source = String(options || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/[^a-z0-9_-]+/g, '_')
    ['replace'](/^_+|_+$/g, '');
  return source || target;
}
function createStableHash(next) {
  const list = String(next || '');
  let current = 0x811c9dc5;
  for (let entry = 0; entry < list['length']; entry += 1) {
    ((current ^= list['charCodeAt'](entry)), (current = Math['imul'](current, 0x1000193)));
  }
  return (current >>> 0)['toString'](36)['padStart'](7, '0')['slice'](0, 8);
}
function stripCurlLineContinuations(record) {
  return String(record || '')['replace'](/\\\r?\n/g, '\n');
}
function readQuotedCurlValue(list2, payload) {
  let handle = payload;
  while (handle < list2['length'] && /\s/['test'](list2[handle])) handle += 1;
  const state = list2[handle];
  if (state !== '\'' && state !== '"') {
    const config = list2['slice'](handle),
      scope = config['split'](/\r?\n/)[0] || config;
    return scope['trim']();
  }
  handle += 1;
  let input = '';
  for (; handle < list2['length']; handle += 1) {
    const output = list2[handle];
    if (output === state) {
      const enabled = list2[handle - 1] === '\\';
      if (!enabled || state === '\'') return input;
    }
    input += output;
  }
  return input['trim']();
}
function extractCurlDataPayload(value2) {
  const stripCurlLineContinuations2 = stripCurlLineContinuations(value2),
    enabled2 = DATA_FLAG_RE['exec'](stripCurlLineContinuations2);
  if (!enabled2) return '';
  return readQuotedCurlValue(stripCurlLineContinuations2, enabled2['index'] + enabled2[0]['length']);
}
function extractFirstJsonObject(value3) {
  const list3 = String(value3 || ''),
    count = list3['indexOf']('{');
  if (count < 0) return '';
  let count2 = 0,
    enabled3 = false,
    value4 = '',
    value5 = false;
  for (let value6 = count; value6 < list3['length']; value6 += 1) {
    const value7 = list3[value6];
    if (enabled3) {
      if (value5) {
        value5 = false;
        continue;
      }
      if (value7 === '\\') {
        value5 = true;
        continue;
      }
      value7 === value4 && ((enabled3 = false), (value4 = ''));
      continue;
    }
    if (value7 === '"' || value7 === '\'') {
      ((enabled3 = true), (value4 = value7));
      continue;
    }
    if (value7 === '{') count2 += 1;
    if (value7 === '}') {
      count2 -= 1;
      if (count2 === 0) return list3['slice'](count, value6 + 1);
    }
  }
  return '';
}
function extractAiAppId(value8, value9 = {}, value10 = '') {
  const text = normalizeText(value10);
  if (text) return text;
  const value11 = String(value8 || ''),
    value12 = value11['match'](RUNNINGHUB_AI_APP_URL_RE),
    text2 = normalizeText(value12?.[1]);
  if (text2) return text2;
  return normalizeText(value9['appId'] || value9['workflowId'] || value9['aiAppId']);
}
function parseJsonPayload(value13) {
  try {
    return JSON['parse'](value13);
  } catch (error) {
    throw new Error('RH AI应用 JSON 解析失败：' + (error?.['message'] || '格式错误'));
  }
}
export function parseRunningHubAiAppInput(value14, { appId: appId2 = '' } = {}) {
  const sourceText = String(value14 || '')['trim']();
  if (!sourceText) throw new Error('请粘贴 RunningHub AI App 的 curl 或 JSON');
  const enabled4 =
    (sourceText['startsWith']('{') ? sourceText : '') ||
    extractCurlDataPayload(sourceText) ||
    extractFirstJsonObject(sourceText);
  if (!enabled4) throw new Error('未找到 --data-raw JSON 请求体');
  const body = parseJsonPayload(enabled4),
    appId3 = extractAiAppId(sourceText, body, appId2);
  if (!appId3) throw new Error('未找到 RunningHub AI App 的 appId');
  if (!Array['isArray'](body['nodeInfoList']) || body['nodeInfoList']['length'] === 0)
    throw new Error('JSON 中缺少 nodeInfoList');
  return {
    appId: appId3,
    body: body,
    nodeInfoList: body['nodeInfoList'],
    providerProfileId: body['providerProfileId'] || resolveRunningHubSiteProfileIdFromUrl(sourceText),
    sourceText: sourceText,
  };
}
function normalizeFieldName(value15) {
  return String(value15 || '')['trim']();
}
function getFieldKind(value16) {
  const fieldName = normalizeFieldName(value16)['toLowerCase']();
  return MEDIA_FIELD_KINDS['has'](fieldName) ? fieldName : '';
}
function getDefaultComponentKind(value17) {
  const fieldKind = getFieldKind(value17);
  if (fieldKind) return fieldKind;
  return String(value17 || '')
    ['trim']()
    ['toLowerCase']() === 'prompt'
    ? 'prompt'
    : 'param';
}
function createLabelFromDescription(value18, value19, value20) {
  const list4 = normalizeText(value18),
    list5 = normalizeFieldName(value19);
  if (!list4) return value20;
  if (list5 && list4['toLowerCase']()['startsWith'](list5['toLowerCase']()))
    return normalizeText(list4['slice'](list5['length']), list4);
  return list4;
}
function isBooleanLiteral(value21) {
  const value22 = String(value21 ?? '')
    ['trim']()
    ['toLowerCase']();
  return value22 === 'true' || value22 === 'false';
}
function isIntegerLiteral(value23) {
  return /^[+-]?\d+$/['test'](String(value23 ?? '')['trim']());
}
function isDecimalLiteral(value24) {
  return /^[+-]?(?:\d+\.\d+|\.\d+)$/['test'](String(value24 ?? '')['trim']());
}
function isAmbiguousZeroLiteral(value25) {
  return /^[+-]?0+$/['test'](String(value25 ?? '')['trim']());
}
function containsCjkText(value26) {
  return /[\u3400-\u9fff]/u['test'](String(value26 ?? ''));
}
function looksLikeLongEnglishText(value27) {
  const value28 = String(value27 ?? '')['trim'](),
    list6 = value28['match'](/[A-Za-z][A-Za-z'-]*/g) || [],
    count3 = (value28['match'](/[A-Za-z]/g) || [])['length'];
  return list6['length'] >= 4 || count3 >= 28;
}
function looksLikeStructuredText(value29) {
  const list7 = String(value29 ?? '')['trim']();
  if (!list7) return true;
  return (
    containsCjkText(list7) ||
    looksLikeLongEnglishText(list7) ||
    list7['length'] > 42 ||
    /[\s,.;:!?，。；：！？、]/['test'](list7) ||
    /^[\[{]/['test'](list7)
  );
}
function labelSuggestsPrompt(value30, value31) {
  const value32 = String(value30 || ''),
    value33 = String(value31 || '')['toLowerCase']();
  return value33 === 'prompt' || /prompt|提示词|描述|文案|动作|内容|台词|歌词/i['test'](value32);
}
function inferTextControlType(value34, value35, value36) {
  if (labelSuggestsPrompt(value35, value36) || looksLikeStructuredText(value34)) return 'textarea';
  return 'text';
}
function inferComponentConfig(value37, value38, value39, value40 = {}) {
  const inferRunningHubFieldMetadata2 = inferRunningHubFieldMetadata(value40);
  if (inferRunningHubFieldMetadata2) return inferRunningHubFieldMetadata2;
  const value41 = String(value39 || '')
      ['trim']()
      ['toLowerCase'](),
    componentKind = getFieldKind(value39);
  if (componentKind)
    return {
      componentKind: componentKind,
      componentKindLocked: true,
      componentKindOptions: [componentKind],
      controlType: 'text',
      controlTypeLocked: true,
      controlTypeOptions: [],
    };
  if (value41 === 'prompt')
    return {
      componentKind: 'prompt',
      componentKindLocked: true,
      componentKindOptions: ['prompt'],
      controlType: 'prompt',
      controlTypeLocked: true,
      controlTypeOptions: [],
    };
  if (value41 === 'index')
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'stepper',
      controlTypeLocked: true,
      controlTypeOptions: ['stepper'],
    };
  if (isBooleanLiteral(value37))
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'toggle',
      controlTypeLocked: true,
      controlTypeOptions: ['toggle'],
    };
  if (isDecimalLiteral(value37))
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'float',
      controlTypeLocked: true,
      controlTypeOptions: ['float'],
    };
  if (isIntegerLiteral(value37))
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'stepper',
      controlTypeLocked: !isAmbiguousZeroLiteral(value37),
      controlTypeOptions: isAmbiguousZeroLiteral(value37)
        ? AMBIGUOUS_ZERO_CONTROL_OPTIONS['slice']()
        : ['stepper'],
    };
  return {
    componentKind: 'param',
    componentKindLocked: false,
    componentKindOptions: TEXT_COMPONENT_KIND_OPTIONS['slice'](),
    controlType: inferTextControlType(value37, value38, value39),
    controlTypeLocked: false,
    controlTypeOptions: TEXT_CONTROL_OPTIONS['slice'](),
  };
}
function normalizeComponentKind(value42, value43 = 'param') {
  const value44 = String(value42 || '')
    ['trim']()
    ['toLowerCase']();
  return COMPONENT_KINDS['has'](value44) ? value44 : value43;
}
function normalizeControlType(value45, value46 = 'text') {
  const value47 = String(value45 || '')
    ['trim']()
    ['toLowerCase']();
  if (value47 === 'integer' || value47 === 'number') return 'stepper';
  if (value47 === 'decimal') return 'float';
  if (value47 === 'boolean' || value47 === 'bool') return 'toggle';
  return CONTROL_TYPES['has'](value47) ? value47 : value46;
}
function normalizeBooleanDefault(value48) {
  const value49 = String(value48 ?? '')
    ['trim']()
    ['toLowerCase']();
  return value48 === true || value49 === 'true' || value49 === '1' || value49 === 'yes' || value49 === 'on';
}
function normalizeIntegerDefault(value50) {
  const value51 = Number(value50);
  return Number['isFinite'](value51) ? Math['trunc'](value51) : 0;
}
function normalizeFloatDefault(value52) {
  const value53 = Number(value52);
  return Number['isFinite'](value53) ? value53 : 0;
}
function normalizeDefaultValueForControl(value54, value55) {
  const controlType = normalizeControlType(value54);
  if (controlType === 'toggle') return normalizeBooleanDefault(value55);
  if (controlType === 'stepper') return normalizeIntegerDefault(value55);
  if (controlType === 'float') return normalizeFloatDefault(value55);
  return String(value55 ?? '');
}
function normalizeOrderValue(value56, value57) {
  const value58 = Number(value56);
  return Number['isFinite'](value58) ? value58 : value57;
}
function normalizePreviewPlacement(value59) {
  return String(value59 || '')['trim']() === 'home' ? 'home' : 'advanced';
}
function getNodeTransformForControl(value60) {
  const controlType2 = normalizeControlType(value60);
  if (controlType2 === 'toggle') return 'booleanString';
  if (controlType2 === 'stepper') return 'integer';
  if (controlType2 === 'float') return 'number';
  return '';
}
function getUiSchemaTypeForControl(value61) {
  const controlType3 = normalizeControlType(value61);
  return controlType3 === 'float' ? 'stepper' : controlType3;
}
function getFloatStep(value62) {
  const value63 = String(value62 ?? '')['trim'](),
    value64 = value63['match'](/\.(\d+)/),
    value65 = value64 ? Math['max'](1, value64[1]['length']) : 2;
  return Number('0.' + '0'['repeat'](Math['max'](0, value65 - 1)) + '1');
}
function createParamFieldId(value66, value67) {
  const sanitizeIdentifierPart2 = sanitizeIdentifierPart(value66?.['nodeId'], 'node_' + value67),
    sanitizeIdentifierPart3 = sanitizeIdentifierPart(value66?.['fieldName'], 'value');
  return 'rh_aiapp_' + sanitizeIdentifierPart2 + '_' + sanitizeIdentifierPart3 + '_' + value67;
}
function createSlotId(value68, value69, value70) {
  const sanitizeIdentifierPart4 = sanitizeIdentifierPart(value69?.['nodeId'], 'node_' + value70);
  return 'rh_aiapp_' + value68 + '_' + sanitizeIdentifierPart4 + '_' + value70;
}
function buildInputSlotCounts(list8) {
  return list8['reduce']((value71, value72) => {
    const enabled5 = String(value72?.['kind'] || '')['trim']();
    if (!enabled5) return value71;
    return ((value71[enabled5] = (value71[enabled5] || 0) + 1), value71);
  }, {});
}
function buildResultConfig(value73) {
  if (value73 === 'video')
    return {
      outputType: 'video',
      taskIdPath: 'taskId',
      videoPaths: ['results[].videoUrl', 'results[].url', 'videoUrl', 'url'],
    };
  if (value73 === 'audio')
    return {
      outputType: 'audio',
      taskIdPath: 'taskId',
      audioPaths: ['results[].audioUrl', 'results[].url', 'audioUrl', 'url'],
    };
  return {
    outputType: 'image',
    taskIdPath: 'taskId',
    imagePaths: ['results[].imageUrl', 'results[].url', 'imageUrl', 'url'],
  };
}
export function buildRunningHubCustomAppExtensions(kind2, appId4, name, value74 = '', value75 = '') {
  const subtitle = normalizeText(value75) || 'AI App ' + appId4,
    appKey2 = normalizeText(value74),
    isSavedApp = Boolean(appKey2),
    value76 = {
      rhAiApp: {
        appId: appId4,
        kind: kind2,
        appKey: appKey2,
        name: name,
        description: normalizeText(value75),
        isSavedApp: isSavedApp,
      },
    };
  return (
    isSavedApp &&
      kind2 === 'image' &&
      (value76['imageMenu'] = {
        group: 'rhAiApp',
        order: 999,
        title: name,
        subtitle: subtitle,
        icon: 'images/RH.png',
        iconAlt: 'runninghub',
      }),
    isSavedApp &&
      kind2 === 'video' &&
      (value76['videoMenu'] = {
        role: 'rhAiApp',
        group: 'rhAiApp',
        order: 999,
        label: name,
        subtitle: subtitle,
      }),
    isSavedApp && kind2 === 'audio' && (value76['audioMenu'] = { group: 'rhAiApp', order: 999 }),
    value76
  );
}
function normalizeNodeInfoItem(fieldValue, index2) {
  if (!fieldValue || typeof fieldValue !== 'object' || Array['isArray'](fieldValue)) return null;
  const nodeId = normalizeText(fieldValue['nodeId']),
    fieldName2 = normalizeFieldName(fieldValue['fieldName']);
  if (!nodeId || !fieldName2) return null;
  return {
    nodeId: nodeId,
    fieldName: fieldName2,
    fieldValue: fieldValue['fieldValue'] ?? '',
    fieldType: fieldValue['fieldType'],
    fieldData: fieldValue['fieldData'],
    description: normalizeText(fieldValue['description']),
    index: index2,
  };
}
export function createRunningHubAiAppComponentDrafts(value77, { appId: appId = '' } = {}) {
  const parsed = parseRunningHubAiAppInput(value77, { appId: appId });
  return {
    parsed: parsed,
    components: parsed['nodeInfoList']
      ['map'](normalizeNodeInfoItem)
      ['filter'](Boolean)
      ['map']((index3) => {
        const defaultComponentKind = getDefaultComponentKind(index3['fieldName']),
          label = createLabelFromDescription(index3['description'], index3['fieldName'], index3['fieldName']),
          componentKindLocked = inferComponentConfig(
            index3['fieldValue'],
            label,
            index3['fieldName'],
            index3,
          ),
          componentKind2 = componentKindLocked['componentKind'] || defaultComponentKind,
          value78 = {
            index: index3['index'],
            nodeId: index3['nodeId'],
            fieldName: index3['fieldName'],
            description: index3['description'],
            label: label,
            componentKind: componentKind2,
            componentKindLocked: componentKindLocked['componentKindLocked'] === true,
            componentKindOptions: componentKindLocked['componentKindOptions'] || [defaultComponentKind],
            controlType: componentKindLocked['controlType'],
            controlTypeLocked: componentKindLocked['controlTypeLocked'] === true,
            controlTypeOptions: componentKindLocked['controlTypeOptions'] || [],
            defaultValue: String(index3['fieldValue'] ?? ''),
            options: getRunningHubFieldOptions(index3),
          };
        return (
          componentKind2 === 'param' &&
            ((value78['previewPlacement'] = 'advanced'), (value78['advancedParamOrder'] = index3['index'])),
          value78
        );
      }),
  };
}
function normalizeOptionList(list9 = [], map = null) {
  if (!Array['isArray'](list9)) return [];
  return list9['map']((value79) =>
    String(value79 || '')
      ['trim']()
      ['toLowerCase'](),
  )['filter']((enabled6, value80, list10) => {
    if (!enabled6 || list10['indexOf'](enabled6) !== value80) return false;
    return !map || map['has'](enabled6);
  });
}
function pickAllowedValue(value81, list11, value82) {
  const value83 = String(value81 || '')
    ['trim']()
    ['toLowerCase']();
  return list11['includes'](value83) ? value83 : value82;
}
function normalizeComponentOverride(value84, value85, value86) {
  const defaultComponentKind2 = getDefaultComponentKind(value85['fieldName']),
    componentKindLocked2 = inferComponentConfig(
      value85['fieldValue'],
      value86,
      value85['fieldName'],
      value85,
    ),
    componentKindOptions = normalizeOptionList(componentKindLocked2['componentKindOptions'], COMPONENT_KINDS),
    controlTypeOptions = normalizeOptionList(componentKindLocked2['controlTypeOptions'], CONTROL_TYPES),
    controlType4 = normalizeControlType(componentKindLocked2['controlType']),
    componentKind3 = normalizeComponentKind(
      value84?.['componentKind'],
      componentKindLocked2['componentKind'] || defaultComponentKind2,
    );
  let componentKind4 =
    componentKindLocked2['componentKindLocked'] === true
      ? componentKindLocked2['componentKind']
      : pickAllowedValue(
          componentKind3,
          componentKindOptions['length'] ? componentKindOptions : [componentKind3],
          componentKindLocked2['componentKind'] || defaultComponentKind2,
        );
  const controlType5 = normalizeControlType(value84?.['controlType'], controlType4);
  let controlType6 =
    componentKind4 === 'prompt'
      ? 'prompt'
      : componentKindLocked2['controlTypeLocked'] === true
        ? controlType4
        : pickAllowedValue(
            controlType5,
            controlTypeOptions['length'] ? controlTypeOptions : [controlType4],
            controlType4,
          );
  return (
    controlType6 === 'prompt' &&
      !componentKindLocked2['componentKindLocked'] &&
      componentKindOptions['includes']('prompt') &&
      (componentKind4 = 'prompt'),
    {
      label: normalizeText(value84?.['label'], value86),
      description: normalizeText(value84?.['description'], value85['description'] || value86),
      componentKind: componentKind4,
      componentKindLocked: componentKindLocked2['componentKindLocked'] === true,
      componentKindOptions: componentKindOptions['length'] ? componentKindOptions : [componentKind4],
      controlType: controlType6,
      controlTypeLocked: componentKindLocked2['controlTypeLocked'] === true,
      controlTypeOptions: controlTypeOptions,
      inputOrder: normalizeOrderValue(value84?.['inputOrder'], value85['index']),
      homeParamOrder: normalizeOrderValue(value84?.['homeParamOrder'], value85['index']),
      advancedParamOrder: normalizeOrderValue(value84?.['advancedParamOrder'], value85['index']),
      previewPlacement: normalizePreviewPlacement(value84?.['previewPlacement']),
      footerGroupId: String(value84?.['footerGroupId'] || '')['trim'](),
      footerGroupLabel: String(value84?.['footerGroupLabel'] || '参数组')['trim'](),
      footerGroupDescription: String(value84?.['footerGroupDescription'] || '')['trim'](),
      defaultValue: normalizeDefaultValueForControl(
        controlType6,
        value84?.['defaultValue'] === undefined ? value85['fieldValue'] : value84['defaultValue'],
      ),
    }
  );
}
function buildComponentOverrideMap(list12 = []) {
  const map2 = new Map();
  if (!Array['isArray'](list12)) return map2;
  return (
    list12['forEach']((value87) => {
      const count4 = Number(value87?.['index']);
      if (!Number['isInteger'](count4) || count4 < 0) return;
      map2['set'](count4, value87);
    }),
    map2
  );
}
function buildManifestParts(dom, outputType, value88 = [], value89 = {}) {
  const list13 = [],
    list14 = [{ ...INSTANCE_FIELD, defaultValue: normalizeInstanceType(dom['body']?.['instanceType']) }],
    nodeInfoList = [];
  let visible = false,
    text3 = '';
  const map3 = buildComponentOverrideMap(value88),
    list15 = dom['nodeInfoList']
      ['map'](normalizeNodeInfoItem)
      ['filter'](Boolean)
      ['map']((item2, index4) => {
        const labelFromDescription = createLabelFromDescription(
          item2['description'],
          item2['fieldName'],
          item2['fieldName'],
        );
        return {
          item: item2,
          index: index4,
          component: normalizeComponentOverride(map3['get'](item2['index']), item2, labelFromDescription),
        };
      }),
    map4 = getParameterFooterFields(
      list15['map'](({ component: component, item: item3 }) => ({
        ...component,
        index: item3['index'],
      })),
    );
  list15['forEach'](({ item: item4, index: index5, component: component2 }) => {
    const label2 = component2['label'],
      description2 = component2['description'] || item4['description'] || label2,
      kind3 = component2['componentKind'];
    if (MEDIA_FIELD_KINDS['has'](kind3)) {
      const id = createSlotId(kind3, item4, index5);
      (list13['push']({
        id: id,
        kind: kind3,
        label: label2,
        description: description2,
        required: true,
        displayOrder: component2['inputOrder'],
        customAiAppComponentIndex: item4['index'],
        rhAiAppComponentIndex: item4['index'],
      }),
        nodeInfoList['push']({
          nodeId: item4['nodeId'],
          fieldName: item4['fieldName'],
          source: kind3 + 'Input',
          field: id,
          slot: id,
          urlField: id,
          required: true,
          missingMessage: '请接入' + label2,
          description: description2,
        }));
      return;
    }
    if (kind3 === 'prompt') {
      visible = true;
      !text3 && (text3 = normalizeText(map3['get'](item4['index'])?.['description'] || item4['description']));
      nodeInfoList['push']({
        nodeId: item4['nodeId'],
        fieldName: item4['fieldName'],
        source: 'prompt',
        defaultValue: component2['defaultValue'],
        description: description2 || '提示词',
      });
      return;
    }
    const id2 = createParamFieldId(item4, index5),
      step = normalizeControlType(component2['controlType']),
      type = getUiSchemaTypeForControl(step),
      defaultValue = normalizeDefaultValueForControl(step, component2['defaultValue']),
      transform = getNodeTransformForControl(step),
      placement = component2['previewPlacement'] === 'home' && map4['has'](item4['index']);
    (list14['push']({
      id: id2,
      type: type,
      placement: placement ? 'mode' : 'advanced',
      ...(placement
        ? { ...map4['get'](item4['index']) }
        : { displayOrder: component2['advancedParamOrder'] }),
      label: label2,
      defaultValue: defaultValue,
      description: description2,
      ...(step === 'select' ? { options: getRunningHubFieldOptions(item4) } : {}),
      customAiAppComponentIndex: item4['index'],
      rhAiAppComponentIndex: item4['index'],
      ...(type === 'stepper'
        ? {
            step: step === 'float' ? getFloatStep(defaultValue) : 1,
            ...(step === 'float' ? { valueType: 'float' } : {}),
          }
        : {}),
    }),
      nodeInfoList['push']({
        nodeId: item4['nodeId'],
        fieldName: item4['fieldName'],
        source: 'param',
        field: id2,
        defaultValue: defaultValue,
        ...(transform ? { transform: transform } : {}),
        description: description2,
      }));
  });
  const args = buildInputSlotCounts(list13),
    allowedKinds = Array['from'](
      new Set([...(visible ? ['text'] : []), ...list13['map']((value90) => value90['kind'])]),
    ),
    fixedSlots = list13['map']((args2, _sourceOrder) => ({ ...args2, _sourceOrder: _sourceOrder }))
      ['sort']((value91, value92) => {
        const orderValue =
          normalizeOrderValue(value91['displayOrder'], value91['_sourceOrder']) -
          normalizeOrderValue(value92['displayOrder'], value92['_sourceOrder']);
        if (orderValue !== 0) return orderValue;
        return value91['_sourceOrder'] - value92['_sourceOrder'];
      })
      ['map'](({ _sourceOrder: _sourceOrder2, ...args3 }, displayOrder) => ({
        ...args3,
        displayOrder: displayOrder,
      })),
    uiFields = [
      list14[0],
      ...list14['slice'](1)['sort']((value93, value94) => {
        const count5 = String(value93?.['placement'] || '')['localeCompare'](
          String(value94?.['placement'] || ''),
        );
        if (count5 !== 0) return count5;
        return (
          normalizeOrderValue(value93?.['displayOrder'], Number['MAX_SAFE_INTEGER']) -
          normalizeOrderValue(value94?.['displayOrder'], Number['MAX_SAFE_INTEGER'])
        );
      }),
    ],
    help = normalizeText(value89['promptHelpTooltip']);
  return {
    fixedSlots: fixedSlots,
    uiFields: uiFields,
    nodeInfoList: nodeInfoList,
    inputSlots: {
      allowedKinds: allowedKinds['slice'](),
      minByKind: { ...args },
      maxByKind: { ...args },
      fixedSlots: fixedSlots,
    },
    capabilities: {
      inputKinds: allowedKinds['slice'](),
      outputType: outputType,
      fixedAssetSlots: fixedSlots['map']((value95) => value95['id']),
    },
    help: help || text3 ? { tooltip: help || text3 } : null,
    prompt: { emptyPolicy: 'allow', visible: visible },
  };
}
export function buildRunningHubAiAppManifestBundle({
  input: input2,
  appId: appId = '',
  kind: kind = 'image',
  components: components = [],
  displayName: displayName = RH_AI_APP_DISPLAY_NAME,
  description: description = '',
  promptHelpTooltip: promptHelpTooltip = '',
  appKey: appKey = '',
} = {}) {
  const appId5 = parseRunningHubAiAppInput(input2, { appId: appId }),
    kind4 = normalizeOutputKind(kind),
    displayName2 = normalizeText(displayName, RH_AI_APP_DISPLAY_NAME),
    description3 = normalizeText(description) || 'RunningHub AI App ' + appId5['appId'],
    promptHelpTooltip2 = normalizeText(promptHelpTooltip),
    stableHash = createStableHash(
      JSON['stringify']({
        appId: appId5['appId'],
        appKey: normalizeText(appKey),
        ...(appId5['body']['providerProfileId']
          ? { providerProfileId: appId5['body']['providerProfileId'] }
          : {}),
        kind: kind4,
        description: description3,
        promptHelpTooltip: promptHelpTooltip2,
        nodeInfoList: appId5['nodeInfoList'],
        components: components,
      }),
    ),
    modelId = 'runninghub/ai-app-' + kind4 + '-' + appId5['appId'] + '-' + stableHash,
    executionId = 'runninghub.workflow.' + kind4 + '.ai-app-' + appId5['appId'] + '-' + stableHash + '.v1',
    nodeInfoList2 = buildManifestParts(appId5, kind4, components, { promptHelpTooltip: promptHelpTooltip2 });
  return buildManifestDraftBundle({
    sourceId: 'runninghub-ai-app:' + kind4 + ':' + appId5['appId'] + ':' + stableHash,
    modelId: modelId,
    executionId: executionId,
    provider: 'runninghubwf',
    adapterType: 'workflow',
    kind: kind4,
    outputType: kind4,
    displayName: displayName2,
    description: description3,
    icon: 'images/RH.png',
    vip: true,
    appId: appId5['appId'],
    submitMode: 'openapi-v2-ai-app',
    queryMode: 'openapi-v2-query',
    mapping: { nodeInfoList: nodeInfoList2['nodeInfoList'] },
    instanceType: {
      field: 'rhInstanceType',
      defaultValue: normalizeInstanceType(appId5['body']?.['instanceType']),
    },
    uiFields: nodeInfoList2['uiFields'],
    inputSlots: nodeInfoList2['inputSlots'],
    help: nodeInfoList2['help'],
    prompt: nodeInfoList2['prompt'],
    modelExtensions: {
      ...buildRunningHubCustomAppExtensions(kind4, appId5['appId'], displayName2, appKey, description3),
      ...(appId5['body']['providerProfileId']
        ? { providerProfiles: [appId5['body']['providerProfileId']] }
        : {}),
    },
    result: buildResultConfig(kind4),
  });
}
export function summarizeRunningHubAiAppBundle(value96) {
  const kind5 = value96?.['models']?.[0] || {},
    appId6 = value96?.['executions']?.[0] || {},
    slotCount = Array['isArray'](kind5?.['inputSlots']?.['fixedSlots'])
      ? kind5['inputSlots']['fixedSlots']
      : [],
    paramCount = Array['isArray'](kind5?.['uiSchema']?.['fields']) ? kind5['uiSchema']['fields'] : [];
  return {
    appId: appId6['appId'] || appId6['workflowId'] || '',
    kind: kind5['kind'] || appId6['kind'] || '',
    modelId: kind5['modelId'] || '',
    displayName: kind5['displayName'] || '',
    slotCount: slotCount['length'],
    paramCount: paramCount['filter']((value97) => value97?.['id'] !== 'rhInstanceType')['length'],
    slots: slotCount['map']((id3) => ({
      id: id3['id'],
      kind: id3['kind'],
      label: id3['label'] || id3['id'],
      required: id3['required'] === true,
    })),
    params: paramCount['filter']((value98) => value98?.['id'] !== 'rhInstanceType')['map']((id4) => ({
      id: id4['id'],
      label: id4['label'] || id4['id'],
      type: id4['type'] || 'text',
      placement: id4['placement'] || 'advanced',
      variant: id4['variant'] || '',
    })),
  };
}
