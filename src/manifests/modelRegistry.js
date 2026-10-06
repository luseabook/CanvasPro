import {
  qwenImageEditExecutionManifest,
  qwenImageEditModelManifest,
} from './image/runninghub/qwenImageEditManifest.js';
import { animeRealExecutionManifest, animeRealModelManifest } from './image/runninghub/animeRealManifest.js';
import {
  personReplaceV21ExecutionManifest,
  personReplaceV21ModelManifest,
} from './image/runninghub/personReplaceV21Manifest.js';
import {
  personReplaceV3ExecutionManifest,
  personReplaceV3ModelManifest,
} from './image/runninghub/personReplaceV3Manifest.js';
import {
  controlCameraExecutionManifest,
  controlCameraModelManifest,
} from './image/runninghub/controlCameraManifest.js';
import {
  rhVideoBasicExecutionManifest,
  rhVideoBasicModelManifest,
} from './video/runninghub/runningHubVideoBasicManifest.js';
import {
  rhVideoLtx23ExecutionManifest,
  rhVideoLtx23ModelManifest,
} from './video/runninghub/runningHubVideoLtx23Manifest.js';
import {
  rhVideoCommercialDigitalHumanExecutionManifest,
  rhVideoCommercialDigitalHumanModelManifest,
} from './video/runninghub/runningHubVideoCommercialDigitalHumanManifest.js';
import {
  rhVideoLipSyncExecutionManifest,
  rhVideoLipSyncModelManifest,
} from './video/runninghub/runningHubVideoLipSyncManifest.js';
import {
  rhVideoV54ExecutionManifest,
  rhVideoV54ModelManifest,
} from './video/runninghub/runningHubVideoV54Manifest.js';
import {
  rhVideoBerniniV1ExecutionManifest,
  rhVideoBerniniV1ModelManifest,
} from './video/runninghub/runningHubVideoBerniniV1Manifest.js';
import {
  rhVideoScailV2ExecutionManifest,
  rhVideoScailV2ModelManifest,
  rhVideoScail2V1ExecutionManifest,
  rhVideoScail2V1ModelManifest,
} from './video/runninghub/runningHubVideoScail2V1Manifest.js';
import {
  rhVideoWatermarkRemovalV2ExecutionManifest,
  rhVideoWatermarkRemovalV2ModelManifest,
} from './video/runninghub/runningHubVideoWatermarkRemovalV2Manifest.js';
import {
  rhVideoMattingExecutionManifest,
  rhVideoMattingModelManifest,
} from './video/runninghub/runningHubVideoMattingManifest.js';
import {
  rhVideoHdVipExecutionManifest,
  rhVideoHdVipModelManifest,
} from './video/runninghub/runningHubVideoHdVipManifest.js';
import {
  rhVideoFrameInterpolationExecutionManifest,
  rhVideoFrameInterpolationModelManifest,
} from './video/runninghub/runningHubVideoFrameInterpolationManifest.js';
import {
  rhAudioIndexTts2CloneExecutionManifest,
  rhAudioIndexTts2CloneModelManifest,
} from './audio/runninghub/runningHubAudioIndexTts2CloneManifest.js';
import {
  rhAudioVoiceConvertExecutionManifest,
  rhAudioVoiceConvertModelManifest,
} from './audio/runninghub/runningHubAudioVoiceConvertManifest.js';
import {
  rhAudioAdvancedVoiceCloneExecutionManifest,
  rhAudioAdvancedVoiceCloneModelManifest,
} from './audio/runninghub/runningHubAudioAdvancedVoiceCloneManifest.js';
import {
  rhAudioSeparationExecutionManifest,
  rhAudioSeparationModelManifest,
} from './audio/runninghub/runningHubAudioSeparationManifest.js';
import {
  vendorImageModelApiExecutionManifests,
  vendorImageModelApiModelManifests,
} from './image/modelApi/index.js';
import {
  dreaminaImageExecutionManifests,
  dreaminaImageModelManifests,
} from './image/dreamina/dreaminaImageManifest.js';
import {
  vendorVideoModelApiExecutionManifests,
  vendorVideoModelApiModelManifests,
} from './video/modelApi/vendorVideoModelApiManifests.js';
import {
  dreaminaVideoExecutionManifests,
  dreaminaVideoModelManifests,
} from './video/dreamina/dreaminaVideoManifest.js';
import {
  vendorTextModelApiExecutionManifests,
  vendorTextModelApiModelManifests,
} from './text/modelApi/vendorTextModelApiManifests.js';
const ALLOWED_ADAPTER_TYPES = new Set(['workflow', 'modelApi', 'localRuntime']),
  SUPPORTED_UI_CONTROL_TYPES = new Set([
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
  REQUIRED_MODEL_FIELDS = Object.freeze([
    'schemaVersion',
    'modelId',
    'provider',
    'kind',
    'adapterType',
    'executionId',
    'displayName',
    'uiSchema',
    'inputSlots',
    'outputType',
  ]),
  REQUIRED_EXECUTION_FIELDS = Object.freeze([
    'schemaVersion',
    'id',
    'provider',
    'kind',
    'adapterType',
    'result',
  ]),
  REQUIRED_WORKFLOW_EXECUTION_FIELDS = Object.freeze(['submitMode', 'queryMode', 'mapping']),
  REQUIRED_MODEL_API_EXECUTION_FIELDS = Object.freeze([
    'endpoint',
    'method',
    'model',
    'bodyMapping',
    'responseMapping',
  ]),
  REQUIRED_LOCAL_RUNTIME_EXECUTION_FIELDS = Object.freeze(['runtime']),
  _models = new Map(),
  _executions = new Map();
function assertPlainObject(enabled, value) {
  if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled))
    throw new TypeError('[manifest] ' + value + ' must be an object');
}
function isPlainObject(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object' || Array.isArray(enabled2)) return false;
  const item = Object.getPrototypeOf(enabled2);
  return item === Object.prototype || item === null;
}
function assertPlainData(list, key, map = new WeakSet()) {
  if (list === null) return;
  const index = typeof list;
  if (index === 'string' || index === 'number' || index === 'boolean') return;
  if (index === 'function' || index === 'symbol' || index === 'undefined' || index === 'bigint')
    throw new TypeError('[manifest] ' + key + ' must be plain data');
  if (map.has(list)) throw new TypeError('[manifest] ' + key + ' cannot contain circular references');
  map.add(list);
  if (Array.isArray(list)) {
    list.forEach((item2, result) => {
      assertPlainData(item2, key + '[' + result + ']', map);
    });
    return;
  }
  if (!isPlainObject(list)) throw new TypeError('[manifest] ' + key + ' must be plain data');
  Object.entries(list).forEach(([data, options]) => {
    assertPlainData(options, key + '.' + data, map);
  });
}
function assertRequiredFields(target, list2, source) {
  const list3 = list2.filter(
    (item3) => target[item3] === undefined || target[item3] === null || target[item3] === '',
  );
  if (list3.length > 0)
    throw new Error('[manifest] ' + source + ' missing required fields: ' + list3.join(', '));
}
function normalizeRegistryKey(next) {
  return String(next || '').trim();
}
function getUiSchemaOptionValue(el) {
  return String(el?.value ?? el);
}
function normalizeUiSchemaCompareValue(current) {
  return String(current ?? '')
    .trim()
    .toLowerCase();
}
function isAdaptiveUiSchemaValue(entry) {
  const record = String(entry || '').trim(),
    payload = record.toLowerCase();
  return (
    payload === 'auto' ||
    payload === 'adaptive' ||
    payload === 'default' ||
    record === '自适应' ||
    record === '默认'
  );
}
function getUiSchemaDisableWhen(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object' || Array.isArray(enabled3)) return null;
  const handle = enabled3.disableWhen || enabled3.disabledWhen;
  return handle && (Array.isArray(handle) || (typeof handle === 'object' && !Array.isArray(handle)))
    ? handle
    : null;
}
function uiSchemaDisableWhenMatches(el2, state = {}) {
  if (Array.isArray(el2)) return el2.some((item4) => uiSchemaDisableWhenMatches(item4, state));
  if (!el2 || typeof el2 !== 'object') return false;
  if (Array.isArray(el2.any)) return el2.any.some((item5) => uiSchemaDisableWhenMatches(item5, state));
  if (Array.isArray(el2.all)) return el2.all.every((item6) => uiSchemaDisableWhenMatches(item6, state));
  const registryKey = normalizeRegistryKey(el2?.field || el2?.param);
  if (!registryKey) return false;
  const config = el2.values !== undefined ? el2.values : el2.value,
    list4 = Array.isArray(config) ? config : [config],
    list5 = list4.map(normalizeUiSchemaCompareValue),
    uiSchemaCompareValue = normalizeUiSchemaCompareValue(state?.[registryKey]);
  return list5.includes(uiSchemaCompareValue);
}
function isUiSchemaOptionDisabled(el3, el4, scope = {}) {
  if (el3?.disabled === true || el3?.readOnly === true) return true;
  if (!el4 || typeof el4 !== 'object' || Array.isArray(el4)) return false;
  if (el4.disabled === true) return true;
  const uiSchemaDisableWhen = getUiSchemaDisableWhen(el4);
  return uiSchemaDisableWhen ? uiSchemaDisableWhenMatches(uiSchemaDisableWhen, scope) : false;
}
function findUiSchemaOptionByValue(input, output) {
  const list6 = Array.isArray(input?.options) ? input.options : [],
    value2 = String(output ?? '').trim(),
    value3 = value2.toLowerCase();
  return (
    list6.find((item7) => getUiSchemaOptionValue(item7) === value2) ||
    list6.find((item8) => getUiSchemaOptionValue(item8).trim().toLowerCase() === value3) ||
    null
  );
}
function findAdaptiveUiSchemaOption(value4) {
  const list7 = Array.isArray(value4?.options) ? value4.options : [];
  return (
    list7.find((item9) => {
      const uiSchemaOptionValue = getUiSchemaOptionValue(item9),
        value5 = String(item9?.label ?? uiSchemaOptionValue).trim();
      return isAdaptiveUiSchemaValue(uiSchemaOptionValue) || isAdaptiveUiSchemaValue(value5);
    }) || null
  );
}
function findEnabledUiSchemaOption(value6, value7, value8 = {}) {
  const uiSchemaOptionByValue = findUiSchemaOptionByValue(value6, value7);
  return uiSchemaOptionByValue && !isUiSchemaOptionDisabled(value6, uiSchemaOptionByValue, value8)
    ? uiSchemaOptionByValue
    : null;
}
function findFirstEnabledUiSchemaOption(value9, value10 = {}) {
  const list8 = Array.isArray(value9?.options) ? value9.options : [];
  return list8.find((el5) => el5?.hidden !== true && !isUiSchemaOptionDisabled(value9, el5, value10)) || null;
}
function getUiSchemaDefaultValueAliases(value11) {
  return (Array.isArray(value11?.defaultValueAliases) ? value11.defaultValueAliases : [])
    .map((item10) =>
      String(item10 ?? '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}
export function normalizeUiSchemaFieldValue(value12, value13, { params: params = {} } = {}) {
  const value14 = String(value12?.type || '')
    .trim()
    .toLowerCase();
  if (value13 === undefined || value13 === null) return value12?.defaultValue ?? '';
  if (String(value13).trim() === '')
    return value12?.allowEmpty === true && (value14 === 'text' || value14 === 'textarea')
      ? ''
      : (value12?.defaultValue ?? '');
  const value15 = String(value13).trim().toLowerCase();
  if (getUiSchemaDefaultValueAliases(value12).includes(value15)) return value12?.defaultValue ?? '';
  if (value14 === 'toggle') {
    if (value13 === true || value13 === false) return value13;
    if (['true', '1', 'yes', 'on'].includes(value15)) return true;
    if (['false', '0', 'no', 'off'].includes(value15)) return false;
    return value12?.defaultValue === true;
  }
  if (value14 === 'slider' && Array.isArray(value12?.options) && value12.options.length) {
    const el6 = findEnabledUiSchemaOption(value12, value13, params);
    if (el6) return el6.value ?? el6;
    const el7 = findEnabledUiSchemaOption(value12, value12?.defaultValue, params);
    if (el7) return el7.value ?? el7;
    const el8 = findFirstEnabledUiSchemaOption(value12, params);
    if (el8) return el8.value ?? el8;
    return value12?.defaultValue ?? '';
  }
  if (value14 !== 'segmented' && value14 !== 'select') return value13;
  const el9 = findEnabledUiSchemaOption(value12, value13, params);
  if (el9) return el9.value ?? el9;
  if (isAdaptiveUiSchemaValue(value13)) {
    const el10 = findAdaptiveUiSchemaOption(value12);
    if (el10 && !isUiSchemaOptionDisabled(value12, el10, params)) return el10.value ?? el10;
  }
  const el11 = findEnabledUiSchemaOption(value12, value12?.defaultValue, params);
  if (el11) return el11.value ?? el11;
  const el12 = findFirstEnabledUiSchemaOption(value12, params);
  if (el12) return el12.value ?? el12;
  return value12?.defaultValue ?? '';
}
export function sanitizeModelUiSchemaParams(
  value16,
  value17 = {},
  { includeDefaults: includeDefaults = true } = {},
) {
  const modelManifest = getModelManifest(value16),
    list9 = Array.isArray(modelManifest?.uiSchema?.fields) ? modelManifest.uiSchema.fields : [],
    args = value17 && typeof value17 === 'object' && !Array.isArray(value17) ? value17 : {},
    args2 = {};
  return list9.reduce((args3, value18) => {
    const registryKey2 = normalizeRegistryKey(value18?.id);
    if (!registryKey2) return args3;
    const params2 = { ...args, ...args2, ...args3 };
    if (Object.prototype.hasOwnProperty.call(args, registryKey2))
      ((args3[registryKey2] = normalizeUiSchemaFieldValue(value18, args[registryKey2], {
        params: params2,
      })),
        (args2[registryKey2] = args3[registryKey2]));
    else
      includeDefaults
        ? ((args3[registryKey2] = normalizeUiSchemaFieldValue(value18, value18?.defaultValue, {
            params: params2,
          })),
          (args2[registryKey2] = args3[registryKey2]))
        : (args2[registryKey2] = normalizeUiSchemaFieldValue(value18, value18?.defaultValue, {
            params: params2,
          }));
    return args3;
  }, {});
}
function getManifestRegistryKeys(value19, value20, value21) {
  const registryKey3 = normalizeRegistryKey(value19[value20]);
  if (!registryKey3) throw new Error('[manifest] ' + value21 + ' has empty ' + value20);
  const list10 = [registryKey3];
  if (value19.aliases !== undefined) {
    if (!Array.isArray(value19.aliases))
      throw new Error('[manifest] ' + value21 + ' aliases must be an array');
    value19.aliases.forEach((item11) => {
      const registryKey4 = normalizeRegistryKey(item11);
      if (registryKey4) list10.push(registryKey4);
    });
  }
  return list10;
}
function assertRegistryKeysAvailable(list11, map2, value22, value23) {
  const map3 = new Set();
  return (
    list11.forEach((item12, value24) => {
      const list12 = getManifestRegistryKeys(item12, value22, value23 + '[' + value24 + ']');
      list12.forEach((item13) => {
        if (map2.has(item13)) throw new Error('[manifest] ' + value23 + ' duplicate key: ' + item13);
        if (map3.has(item13))
          throw new Error('[manifest] ' + value23 + ' duplicate key in bundle: ' + item13);
        map3.add(item13);
      });
    }),
    map3
  );
}
function buildManifestKeyMap(list13, value25, value26) {
  const map4 = new Map();
  return (
    list13.forEach((item14, value27) => {
      getManifestRegistryKeys(item14, value25, value26 + '[' + value27 + ']').forEach((item15) => {
        map4.set(item15, item14);
      });
    }),
    map4
  );
}
function assertModelExecutionContract(value28, value29) {
  ['adapterType', 'kind', 'provider'].forEach((item16) => {
    const registryKey5 = normalizeRegistryKey(value28[item16]),
      registryKey6 = normalizeRegistryKey(value29[item16]);
    if (registryKey5 !== registryKey6)
      throw new Error(
        '[manifest] model manifest ' +
          value28.modelId +
          ' ' +
          item16 +
          ' (' +
          value28[item16] +
          ') does not match execution manifest ' +
          value29.id +
          ' ' +
          item16 +
          ' (' +
          value29[item16] +
          ')',
      );
  });
}
function assertBundleModelExecutionLinks(list14, map5) {
  list14.forEach((item17) => {
    const registryKey7 = normalizeRegistryKey(item17.executionId),
      enabled4 = _executions.get(registryKey7) || map5.get(registryKey7);
    if (!enabled4)
      throw new Error(
        '[manifest] model manifest ' +
          item17.modelId +
          ' references unknown executionId: ' +
          item17.executionId,
      );
    assertModelExecutionContract(item17, enabled4);
  });
}
function assertAdapterType(value30, value31) {
  if (!ALLOWED_ADAPTER_TYPES.has(String(value30 || '')))
    throw new Error('[manifest] ' + value31 + ' has unsupported adapterType: ' + value30);
}
function assertExecutionTarget(enabled5) {
  if (enabled5.adapterType !== 'workflow') return;
  if (!enabled5.workflowId && !enabled5.appId)
    throw new Error('[manifest] workflow execution missing workflowId/appId');
}
function assertUiSchema(value32) {
  const value33 = value32.uiSchema;
  assertPlainObject(value33, 'model manifest uiSchema');
  if (!Array.isArray(value33.fields))
    throw new Error('[manifest] model manifest uiSchema.fields must be an array');
  value33.fields.forEach((item18, value34) => {
    (assertPlainObject(item18, 'model manifest uiSchema.fields[' + value34 + ']'),
      assertRequiredFields(
        item18,
        ['id', 'type', 'defaultValue'],
        'model manifest uiSchema.fields[' + value34 + ']',
      ));
    const value35 = String(item18.type || '')
      .trim()
      .toLowerCase();
    if (!SUPPORTED_UI_CONTROL_TYPES.has(value35))
      throw new Error('[manifest] unsupported uiSchema control type: ' + item18.type);
    if (
      (value35 === 'segmented' || value35 === 'select') &&
      (!Array.isArray(item18.options) || item18.options.length === 0)
    )
      throw new Error('[manifest] uiSchema field ' + item18.id + ' requires non-empty options');
  });
}
function assertInputSlots(value36) {
  const value37 = value36.inputSlots;
  assertPlainObject(value37, 'model manifest inputSlots');
  const list15 = value37.fixedSlots === undefined || value37.fixedSlots === null ? [] : value37.fixedSlots;
  if (!Array.isArray(list15))
    throw new Error('[manifest] model manifest inputSlots.fixedSlots must be an array');
  const map6 = new Map(),
    map7 = new Map(),
    map8 = new Set();
  list15.forEach((item19, value38) => {
    (assertPlainObject(item19, 'model manifest inputSlots.fixedSlots[' + value38 + ']'),
      assertRequiredFields(item19, ['id', 'kind'], 'model manifest inputSlots.fixedSlots[' + value38 + ']'));
    const registryKey8 = normalizeRegistryKey(item19.kind),
      value39 = String(item19.id || '').trim();
    if (value39) map8.add(value39);
    map6.set(registryKey8, (map6.get(registryKey8) || 0) + 1);
    if (item19.required !== undefined && item19.required !== null && typeof item19.required !== 'boolean')
      throw new Error('[manifest] fixed slot ' + item19.id + ' required must be a boolean');
    item19.required === true && map7.set(registryKey8, (map7.get(registryKey8) || 0) + 1);
  });
  const value40 = value37.minByKind || {};
  if (value40 && !isPlainObject(value40))
    throw new Error('[manifest] model manifest inputSlots.minByKind must be an object');
  Object.entries(value40 || {}).forEach(([value41, value42]) => {
    const count = Number(value42);
    if (!Number.isFinite(count) || count < 0)
      throw new Error(
        '[manifest] model manifest inputSlots.minByKind.' + value41 + ' must be a non-negative number',
      );
    const registryKey9 = normalizeRegistryKey(value41),
      count2 = map6.get(registryKey9) || 0;
    if (count2 === 0 || count <= 0) return;
    const value43 = map7.get(registryKey9) || 0;
    if (value43 < count)
      throw new Error(
        '[manifest] model manifest ' +
          value36.modelId +
          ' inputSlots.' +
          registryKey9 +
          ' requires ' +
          count +
          ' input(s), but only ' +
          value43 +
          ' fixed slot(s) are marked required',
      );
  });
  const value44 = value37.exclusiveGroups || [];
  if (value44 && !Array.isArray(value44))
    throw new Error('[manifest] model manifest inputSlots.exclusiveGroups must be an array');
  (value44 || []).forEach((item20, value45) => {
    assertPlainObject(item20, 'model manifest inputSlots.exclusiveGroups[' + value45 + ']');
    if (!Array.isArray(item20.slots) || item20.slots.length < 2)
      throw new Error(
        '[manifest] model manifest inputSlots.exclusiveGroups[' +
          value45 +
          '].slots must contain at least two slots',
      );
    (item20.slots.forEach((item21) => {
      const value46 = String(item21 || '').trim();
      if (!map8.has(value46))
        throw new Error(
          '[manifest] model manifest inputSlots.exclusiveGroups[' +
            value45 +
            '] references unknown fixed slot: ' +
            value46,
        );
    }),
      ['min', 'max'].forEach((item22) => {
        if (item20[item22] === undefined || item20[item22] === null) return;
        const count3 = Number(item20[item22]);
        if (!Number.isFinite(count3) || count3 < 0)
          throw new Error(
            '[manifest] model manifest inputSlots.exclusiveGroups[' +
              value45 +
              '].' +
              item22 +
              ' must be a non-negative number',
          );
      }));
  });
}
export function validateModelManifest(value47) {
  return (
    assertPlainObject(value47, 'model manifest'),
    assertRequiredFields(value47, REQUIRED_MODEL_FIELDS, 'model manifest'),
    assertAdapterType(value47.adapterType, 'model manifest'),
    assertUiSchema(value47),
    assertInputSlots(value47),
    true
  );
}
export function validateExecutionManifest(value48) {
  return (
    assertPlainObject(value48, 'execution manifest'),
    assertRequiredFields(value48, REQUIRED_EXECUTION_FIELDS, 'execution manifest'),
    assertAdapterType(value48.adapterType, 'execution manifest'),
    value48.adapterType === 'workflow' &&
      assertRequiredFields(value48, REQUIRED_WORKFLOW_EXECUTION_FIELDS, 'workflow execution manifest'),
    value48.adapterType === 'modelApi' &&
      assertRequiredFields(value48, REQUIRED_MODEL_API_EXECUTION_FIELDS, 'modelApi execution manifest'),
    value48.adapterType === 'localRuntime' &&
      assertRequiredFields(
        value48,
        REQUIRED_LOCAL_RUNTIME_EXECUTION_FIELDS,
        'localRuntime execution manifest',
      ),
    assertExecutionTarget(value48),
    true
  );
}
function addModelManifestToRegistry(value49) {
  const value50 = String(value49.modelId || '').trim();
  (_models.set(value50, value49),
    Array.isArray(value49.aliases) &&
      value49.aliases.forEach((item23) => {
        const value51 = String(item23 || '').trim();
        if (value51) _models.set(value51, value49);
      }));
}
function addExecutionManifestToRegistry(value52) {
  (_executions.set(String(value52.id), value52),
    Array.isArray(value52.aliases) &&
      value52.aliases.forEach((item24) => {
        const value53 = String(item24 || '').trim();
        if (value53) _executions.set(value53, value52);
      }));
}
function registerModelManifest(value54) {
  validateModelManifest(value54);
  const executionManifest = getExecutionManifest(value54.executionId);
  if (executionManifest) assertModelExecutionContract(value54, executionManifest);
  addModelManifestToRegistry(value54);
}
function registerExecutionManifest(value55) {
  (validateExecutionManifest(value55), addExecutionManifestToRegistry(value55));
}
export function registerManifestBundle(value56) {
  (assertPlainObject(value56, 'manifest bundle'),
    assertPlainData(value56, 'manifest bundle'),
    assertRequiredFields(value56, ['sourceId'], 'manifest bundle'));
  if (!normalizeRegistryKey(value56.sourceId))
    throw new Error('[manifest] manifest bundle sourceId must be non-empty');
  if (!Array.isArray(value56.models))
    throw new TypeError('[manifest] manifest bundle.models must be an array');
  if (!Array.isArray(value56.executions))
    throw new TypeError('[manifest] manifest bundle.executions must be an array');
  const list16 = value56.executions,
    list17 = value56.models;
  (list16.forEach(validateExecutionManifest),
    list17.forEach(validateModelManifest),
    assertRegistryKeysAvailable(list16, _executions, 'id', 'execution manifest'));
  const manifestKeyMap = buildManifestKeyMap(list16, 'id', 'execution manifest');
  return (
    assertRegistryKeysAvailable(list17, _models, 'modelId', 'model manifest'),
    assertBundleModelExecutionLinks(list17, manifestKeyMap),
    list16.forEach(addExecutionManifestToRegistry),
    list17.forEach(addModelManifestToRegistry),
    true
  );
}
(registerExecutionManifest(qwenImageEditExecutionManifest),
  registerModelManifest(qwenImageEditModelManifest),
  registerExecutionManifest(animeRealExecutionManifest),
  registerModelManifest(animeRealModelManifest),
  registerExecutionManifest(personReplaceV21ExecutionManifest),
  registerModelManifest(personReplaceV21ModelManifest),
  registerExecutionManifest(personReplaceV3ExecutionManifest),
  registerModelManifest(personReplaceV3ModelManifest),
  registerExecutionManifest(controlCameraExecutionManifest),
  registerModelManifest(controlCameraModelManifest),
  registerExecutionManifest(rhVideoBasicExecutionManifest),
  registerModelManifest(rhVideoBasicModelManifest),
  registerExecutionManifest(rhVideoLtx23ExecutionManifest),
  registerModelManifest(rhVideoLtx23ModelManifest),
  registerExecutionManifest(rhVideoCommercialDigitalHumanExecutionManifest),
  registerModelManifest(rhVideoCommercialDigitalHumanModelManifest),
  registerExecutionManifest(rhVideoLipSyncExecutionManifest),
  registerModelManifest(rhVideoLipSyncModelManifest),
  registerExecutionManifest(rhVideoV54ExecutionManifest),
  registerModelManifest(rhVideoV54ModelManifest),
  registerExecutionManifest(rhVideoBerniniV1ExecutionManifest),
  registerModelManifest(rhVideoBerniniV1ModelManifest),
  registerExecutionManifest(rhVideoScail2V1ExecutionManifest),
  registerModelManifest(rhVideoScail2V1ModelManifest),
  registerExecutionManifest(rhVideoScailV2ExecutionManifest),
  registerModelManifest(rhVideoScailV2ModelManifest),
  registerExecutionManifest(rhVideoWatermarkRemovalV2ExecutionManifest),
  registerModelManifest(rhVideoWatermarkRemovalV2ModelManifest),
  registerExecutionManifest(rhVideoMattingExecutionManifest),
  registerModelManifest(rhVideoMattingModelManifest),
  registerExecutionManifest(rhVideoHdVipExecutionManifest),
  registerModelManifest(rhVideoHdVipModelManifest),
  registerExecutionManifest(rhVideoFrameInterpolationExecutionManifest),
  registerModelManifest(rhVideoFrameInterpolationModelManifest),
  registerExecutionManifest(rhAudioIndexTts2CloneExecutionManifest),
  registerModelManifest(rhAudioIndexTts2CloneModelManifest),
  registerExecutionManifest(rhAudioVoiceConvertExecutionManifest),
  registerModelManifest(rhAudioVoiceConvertModelManifest),
  registerExecutionManifest(rhAudioAdvancedVoiceCloneExecutionManifest),
  registerModelManifest(rhAudioAdvancedVoiceCloneModelManifest),
  registerExecutionManifest(rhAudioSeparationExecutionManifest),
  registerModelManifest(rhAudioSeparationModelManifest),
  vendorImageModelApiExecutionManifests.forEach(registerExecutionManifest),
  vendorImageModelApiModelManifests.forEach(registerModelManifest),
  dreaminaImageExecutionManifests.forEach(registerExecutionManifest),
  dreaminaImageModelManifests.forEach(registerModelManifest),
  vendorVideoModelApiExecutionManifests.forEach(registerExecutionManifest),
  vendorVideoModelApiModelManifests.forEach(registerModelManifest),
  dreaminaVideoExecutionManifests.forEach(registerExecutionManifest),
  dreaminaVideoModelManifests.forEach(registerModelManifest),
  vendorTextModelApiExecutionManifests.forEach(registerExecutionManifest),
  vendorTextModelApiModelManifests.forEach(registerModelManifest));
export function getModelManifest(value57) {
  const value58 = String(value57 || '').trim();
  return _models.get(value58) || null;
}
export function resolveModelManifest(value59, value60 = '') {
  const modelManifest2 = getModelManifest(value59);
  if (!modelManifest2) return null;
  const value61 = String(value60 || '').trim();
  if (value61 && modelManifest2.provider !== value61) return null;
  return modelManifest2;
}
export function getExecutionManifest(value62) {
  return _executions.get(String(value62 || '').trim()) || null;
}
export function resolveExecutionManifest(value63) {
  return getExecutionManifest(value63);
}
const PROVIDER_PREFIXES = Object.freeze({
  'runninghub-model': 'runninghub',
  runninghub: 'runninghubwf',
  dreamina: 'dreamina',
  apimart: 'apimart',
  agnes: 'agnes',
  ppio: 'ppio',
  grsai: 'grsai',
  volcengine: 'volcengine',
});
export function normalizeProviderId(value64) {
  const value65 = String(value64 || '')
    .trim()
    .toLowerCase();
  if (value65 === 'runninghub-workflow' || value65 === 'runninghubwf') return 'runninghubwf';
  if (value65 === 'runninghub-model') return 'runninghub';
  return value65;
}
function inferProviderFromModelPrefix(value66) {
  const list18 = String(value66 || '')
      .trim()
      .toLowerCase(),
    value67 = list18.includes('/') ? list18.split('/')[0] : '';
  return PROVIDER_PREFIXES[value67] || '';
}
function resolveModelManifestCandidate(value68, value69 = '') {
  const inputModelId = normalizeRegistryKey(value68),
    providerId = normalizeProviderId(value69);
  if (!inputModelId) return null;
  const modelManifest3 = getModelManifest(inputModelId);
  if (modelManifest3 && (!providerId || normalizeProviderId(modelManifest3.provider) === providerId))
    return {
      modelManifest: modelManifest3,
      inputModelId: inputModelId,
      canonicalModelId: modelManifest3.modelId,
      source: 'exact',
    };
  if (providerId && inputModelId.includes('/')) {
    const [value70, ...list19] = inputModelId.split('/'),
      inferProviderFromModelPrefix2 = inferProviderFromModelPrefix(inputModelId),
      value71 = list19.join('/');
    if (value71 && (!inferProviderFromModelPrefix2 || inferProviderFromModelPrefix2 === providerId)) {
      const modelManifest4 = getModelManifest(value71);
      if (modelManifest4 && normalizeProviderId(modelManifest4.provider) === providerId)
        return {
          modelManifest: modelManifest4,
          inputModelId: inputModelId,
          canonicalModelId: modelManifest4.modelId,
          source: 'stripped:' + value70,
        };
    }
  }
  if (providerId && !inputModelId.includes('/')) {
    const modelManifest5 = getModelManifest(providerId + '/' + inputModelId);
    if (modelManifest5 && normalizeProviderId(modelManifest5.provider) === providerId)
      return {
        modelManifest: modelManifest5,
        inputModelId: inputModelId,
        canonicalModelId: modelManifest5.modelId,
        source: 'prefixed',
      };
  }
  return null;
}
export function resolveModelProvider(
  value72,
  value73 = '',
  { allowProviderHint: allowProviderHint = true, allowPrefixInference: allowPrefixInference = true } = {},
) {
  const providerId2 = normalizeProviderId(value73);
  if (providerId2 && allowProviderHint) return providerId2;
  const modelManifestCandidate = resolveModelManifestCandidate(value72, providerId2);
  if (modelManifestCandidate?.modelManifest?.provider)
    return normalizeProviderId(modelManifestCandidate.modelManifest.provider);
  return allowPrefixInference ? inferProviderFromModelPrefix(value72) : '';
}
export function resolveModelExecution(value74, value75 = {}) {
  const value76 = typeof value75 === 'string' ? value75 : value75?.providerHint || value75?.provider || '',
    inputModelId2 = resolveModelManifestCandidate(value74, value76),
    modelManifest6 = inputModelId2?.modelManifest || null;
  if (!modelManifest6) return null;
  const executionManifest2 = getExecutionManifest(modelManifest6.executionId);
  if (!executionManifest2) return null;
  return {
    modelManifest: modelManifest6,
    executionManifest: executionManifest2,
    inputModelId: inputModelId2.inputModelId,
    canonicalModelId: inputModelId2.canonicalModelId,
    source: inputModelId2.source,
  };
}
export function isModelApiModel(value77, providerHint = '') {
  const modelExecution = resolveModelExecution(value77, { providerHint: providerHint });
  return (
    modelExecution?.modelManifest?.adapterType === 'modelApi' &&
    modelExecution?.executionManifest?.adapterType === 'modelApi'
  );
}
export function isWorkflowModel(value78, providerHint2 = '') {
  const modelExecution2 = resolveModelExecution(value78, { providerHint: providerHint2 });
  return (
    modelExecution2?.modelManifest?.adapterType === 'workflow' &&
    modelExecution2?.executionManifest?.adapterType === 'workflow'
  );
}
export function isLocalRuntimeModel(value79, providerHint3 = '') {
  const modelExecution3 = resolveModelExecution(value79, { providerHint: providerHint3 });
  return (
    modelExecution3?.modelManifest?.adapterType === 'localRuntime' &&
    modelExecution3?.executionManifest?.adapterType === 'localRuntime'
  );
}
export function getModelsByKind(value80) {
  const enabled6 = String(value80 || '').trim();
  return Array.from(new Set(_models.values())).filter((item25) => !enabled6 || item25.kind === enabled6);
}
export function listModelManifests() {
  return Array.from(new Set(_models.values()));
}

const ALLOWED_PROMPT_EMPTY_POLICIES = new Set(['block', 'allowWithInput', 'allow']);

function isAspectRatioUiSchemaField(value81) {
  const registryKey10 = normalizeRegistryKey(value81?.id).toLowerCase(),
    registryKey11 = normalizeRegistryKey(value81?.displayRole).toLowerCase(),
    registryKey12 = normalizeRegistryKey(value81?.variant).toLowerCase();
  return registryKey10 === 'aspectratio' || registryKey11 === 'aspectratio' || registryKey12 === 'ratiopill';
}

function getUiSchemaFieldOptions(value82) {
  const args4 = Array.isArray(value82?.options) ? value82.options : [],
    args5 = Array.isArray(value82?.developerOptions) ? value82.developerOptions : [];
  return [...args4, ...args5];
}

function assertPromptConfig(value83) {
  if (value83.prompt === undefined || value83.prompt === null) return;
  assertPlainObject(value83.prompt, 'model manifest prompt');
  if (
    value83.prompt.emptyPolicy !== undefined &&
    value83.prompt.emptyPolicy !== null &&
    !ALLOWED_PROMPT_EMPTY_POLICIES.has(String(value83.prompt.emptyPolicy || ''))
  )
    throw new Error(
      '[manifest] model manifest ' +
        value83.modelId +
        ' prompt.emptyPolicy must be one of: ' +
        Array.from(ALLOWED_PROMPT_EMPTY_POLICIES).join(', '),
    );
  if (value83.prompt.minLength !== undefined && value83.prompt.minLength !== null) {
    const count4 = Number(value83.prompt.minLength);
    if (!Number.isInteger(count4) || count4 < 0)
      throw new Error(
        '[manifest] model manifest ' +
          value83.modelId +
          ' prompt.minLength must be a non-negative integer',
      );
  }
}

function assertInputPolicyCondition(list20, value84) {
  if (Array.isArray(list20)) {
    if (list20.length === 0) throw new Error('[manifest] ' + value84 + ' must not be empty');
    list20.forEach((value85, value86) =>
      assertInputPolicyCondition(value85, value84 + '[' + value86 + ']'),
    );
    return;
  }
  assertPlainObject(list20, value84);
  if (Array.isArray(list20.any) || Array.isArray(list20.all)) {
    const value87 = Array.isArray(list20.any) ? 'any' : 'all';
    assertInputPolicyCondition(list20[value87], value84 + '.' + value87);
    return;
  }
  if (!normalizeRegistryKey(list20.field ?? list20.param))
    throw new Error('[manifest] ' + value84 + ' must declare field or param');
  if (list20.value === undefined && list20.values === undefined)
    throw new Error('[manifest] ' + value84 + ' must declare value or values');
}

function assertInputPolicyExtensions(value88) {
  const value89 = value88.inputSlots;
  if (
    value89.preserveHiddenInputsByKind !== undefined &&
    typeof value89.preserveHiddenInputsByKind !== 'boolean'
  )
    throw new Error('[manifest] model manifest inputSlots.preserveHiddenInputsByKind must be a boolean');
  const list21 = value89.preserveHiddenInputsByKindFields;
  if (
    list21 !== undefined &&
    (!Array.isArray(list21) ||
      list21.length === 0 ||
      list21.some((value90) => !String(value90 || '').trim()))
  )
    throw new Error(
      '[manifest] model manifest inputSlots.preserveHiddenInputsByKindFields must be a non-empty string array',
    );
  if (Array.isArray(list21) && value89.preserveHiddenInputsByKind !== true)
    throw new Error(
      '[manifest] model manifest inputSlots.preserveHiddenInputsByKindFields requires preserveHiddenInputsByKind',
    );
  const value91 = value89.policyVariants || [];
  if (value91 && !Array.isArray(value91))
    throw new Error('[manifest] model manifest inputSlots.policyVariants must be an array');
  (value91 || []).forEach((value92, value93) => {
    const value94 = 'model manifest inputSlots.policyVariants[' + value93 + ']';
    (assertPlainObject(value92, value94), assertInputPolicyCondition(value92.when, value94 + '.when'));
    if (value92.allowedKinds !== undefined && !Array.isArray(value92.allowedKinds))
      throw new Error('[manifest] ' + value94 + '.allowedKinds must be an array');
    if (value92.maxByKind !== undefined && !isPlainObject(value92.maxByKind))
      throw new Error('[manifest] ' + value94 + '.maxByKind must be an object');
    Object.entries(value92.maxByKind || {}).forEach(([value95, value96]) => {
      const count5 = Number(value96);
      if (!Number.isFinite(count5) || count5 < 0)
        throw new Error(
          '[manifest] ' + value94 + '.maxByKind.' + value95 + ' must be a non-negative number',
        );
    });
  });
  const value97 = value89.mediaConstraintsByKind || {};
  if (value97 && !isPlainObject(value97))
    throw new Error('[manifest] model manifest inputSlots.mediaConstraintsByKind must be an object');
  Object.entries(value97 || {}).forEach(([value98, value99]) => {
    const value100 = 'model manifest inputSlots.mediaConstraintsByKind.' + value98;
    (assertPlainObject(value99, value100),
      ['minDurationSeconds', 'maxDurationSeconds', 'maxBytes'].forEach((value101) => {
        if (value99[value101] === undefined) return;
        const count6 = Number(value99[value101]);
        if (!Number.isFinite(count6) || count6 <= 0)
          throw new Error('[manifest] ' + value100 + '.' + value101 + ' must be positive');
      }));
    if (
      value99.minDurationSeconds !== undefined &&
      value99.maxDurationSeconds !== undefined &&
      Number(value99.minDurationSeconds) > Number(value99.maxDurationSeconds)
    )
      throw new Error(
        '[manifest] ' + value100 + '.minDurationSeconds cannot exceed maxDurationSeconds',
      );
    if (
      value99.allowedExtensions !== undefined &&
      (!Array.isArray(value99.allowedExtensions) ||
        value99.allowedExtensions.some((value102) => !String(value102 || '').trim()))
    )
      throw new Error('[manifest] ' + value100 + '.allowedExtensions must be an array of non-empty strings');
  });
}

function assertManifestBundle(value103) {
  (assertPlainObject(value103, 'manifest bundle'),
    assertPlainData(value103, 'manifest bundle'),
    assertRequiredFields(value103, ['sourceId'], 'manifest bundle'));
  if (!normalizeRegistryKey(value103.sourceId))
    throw new Error('[manifest] manifest bundle sourceId must be non-empty');
  if (!Array.isArray(value103.models))
    throw new TypeError('[manifest] manifest bundle.models must be an array');
  if (!Array.isArray(value103.executions))
    throw new TypeError('[manifest] manifest bundle.executions must be an array');
  const executions = value103.executions,
    models = value103.models;
  (executions.forEach(validateExecutionManifest),
    models.forEach(validateModelManifest),
    assertRegistryKeysAvailable(executions, _executions, 'id', 'execution manifest'));
  const manifestKeyMap2 = buildManifestKeyMap(executions, 'id', 'execution manifest');
  return (
    assertRegistryKeysAvailable(models, _models, 'modelId', 'model manifest'),
    assertBundleModelExecutionLinks(models, manifestKeyMap2),
    { executions: executions, models: models }
  );
}

export function validateManifestBundle(value104) {
  return (assertManifestBundle(value104), true);
}

function removeManifestFromRegistry(value105, map9, value106, value107) {
  const enabled7 = String(value105?.[value106] || '').trim();
  if (!enabled7) return;
  getManifestRegistryKeys(value105, value106, value107).forEach((value108) => {
    const value109 = map9.get(value108);
    String(value109?.[value106] || '').trim() === enabled7 && map9.delete(value108);
  });
}

export function unregisterManifestBundle(value110) {
  const list22 = Array.isArray(value110?.executions) ? value110.executions : [],
    list23 = Array.isArray(value110?.models) ? value110.models : [];
  return (
    list22.forEach((value111) =>
      removeManifestFromRegistry(value111, _executions, 'id', 'execution manifest'),
    ),
    list23.forEach((value112) =>
      removeManifestFromRegistry(value112, _models, 'modelId', 'model manifest'),
    ),
    true
  );
}

function resolveUniqueModelDisplayName(value113, value114 = '') {
  const registryKey13 = normalizeRegistryKey(value113).toLowerCase(),
    providerId3 = normalizeProviderId(value114);
  if (!registryKey13) return null;
  const list24 = Array.from(new Set(_models.values())).filter((value115) => {
    if (normalizeRegistryKey(value115?.displayName).toLowerCase() !== registryKey13) return false;
    return !providerId3 || normalizeProviderId(value115?.provider) === providerId3;
  });
  return list24.length === 1 ? list24[0] : null;
}
