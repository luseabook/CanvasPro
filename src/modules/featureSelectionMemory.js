import {
  RH_VIDEO_BASIC_MODEL_ID,
  getModelManifest,
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from '../manifests/index.js';
import {
  STORYBOARD_SCRIPT_TEXT_MODEL,
  STORYBOARD_SCRIPT_TEXT_PROVIDER,
} from '../core/storyboardScriptFactory.js';
export const FEATURE_SELECTIONS_STORAGE_KEY = 'v2-feature-selections';
const MODEL_PARAMS_MEMORY_KEY = 'generationParamsByModel',
  NODE_MODEL_PARAMS_MEMORY_TYPES = new Set(['ai-image', 'ai-video', 'ai-audio', 'storyboard-script']),
  NODE_MODULE_KEY_MAP = {
    'ai-text': 'ai-text',
    'ai-image': 'ai-image',
    'ai-video': 'ai-video',
    'ai-audio': 'ai-audio',
    'source-video': 'source-video',
    'storyboard-script': 'storyboard-script',
  },
  NODE_DEFAULT_SELECTIONS = {
    'ai-text': { model: 'apimart/kimi-k2-instruct', provider: 'apimart' },
    'ai-image': { model: 'apimart/nano-banana-2', provider: 'apimart', rhInstanceType: 'default' },
    'ai-video': {
      model: RH_VIDEO_BASIC_MODEL_ID,
      provider: 'runninghubwf',
      resolution: '720p',
      duration: 5,
      rhInstanceType: 'default',
    },
    'ai-audio': {
      model: 'indextts2_clone',
      provider: 'runninghubwf',
      audioWorkflowKey: 'indextts2_clone',
      rhInstanceType: 'default',
    },
    'storyboard-script': { model: STORYBOARD_SCRIPT_TEXT_MODEL, provider: STORYBOARD_SCRIPT_TEXT_PROVIDER },
  },
  NODE_MEMORY_SELECTION_FIELDS = {
    'ai-text': ['model', 'provider'],
    'ai-image': [
      'model',
      'provider',
      'imageSize',
      'aspectRatio',
      'batchSize',
      'rhResolution',
      'rhInstanceType',
    ],
    'ai-video': [
      'model',
      'provider',
      'aspectRatio',
      'resolution',
      'duration',
      'mode',
      'dreaminaRouteMode',
      'rhInstanceType',
      'rhVideoFps',
      'rhVideoFrames',
      'rhVideoSeconds',
      'rhVideoResolution',
      'rhLtxMode',
    ],
    'ai-audio': ['model', 'provider', 'audioWorkflowKey', 'rhInstanceType'],
    'source-video': ['rhInstanceType', 'rhVideoFps', 'rhVideoResolution', 'rhMaskMode'],
    'storyboard-script': ['model', 'provider'],
  };
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function hasUsableValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  return false;
}
function toModuleKey(item) {
  return NODE_MODULE_KEY_MAP[String(item || '').trim()] || '';
}
function ensureModuleRecord(key, index) {
  return (!isPlainObject(key[index]) && (key[index] = {}), key[index]);
}
function hasOwnField(enabled2, result) {
  return !!enabled2 && Object.prototype.hasOwnProperty.call(enabled2, result);
}
function isSchemaMemoryNodeType(data) {
  return NODE_MODEL_PARAMS_MEMORY_TYPES.has(String(data || '').trim());
}
function getPlainParams(args) {
  return isPlainObject(args) ? { ...args } : {};
}
function hasModelManifest(options) {
  return !!getModelManifest(options);
}
function resolveSchemaModelId(target, providerHint = '') {
  const enabled3 = String(target || '').trim();
  if (!enabled3) return '';
  if (hasModelManifest(enabled3)) return enabled3;
  try {
    const modelExecution =
        resolveModelExecution(enabled3, { providerHint: providerHint }) || resolveModelExecution(enabled3),
      source = String(
        modelExecution?.canonicalModelId || modelExecution?.modelManifest?.modelId || '',
      ).trim();
    return source && hasModelManifest(source) ? source : '';
  } catch {
    return '';
  }
}
function resolveNodeSchemaModelId(options2 = {}) {
  const next = String(options2?.provider || '').trim(),
    current =
      String(options2?.type || '').trim() === 'ai-audio'
        ? [options2?.model, options2?.audioWorkflowKey]
        : [options2?.model];
  for (const entry of current) {
    const schemaModelId = resolveSchemaModelId(entry, next);
    if (schemaModelId) return schemaModelId;
  }
  return '';
}
function getSchemaFieldIds(record) {
  const modelManifest = getModelManifest(record)?.uiSchema?.fields;
  return new Set(
    (Array.isArray(modelManifest) ? modelManifest : [])
      .map((item2) => String(item2?.id || '').trim())
      .filter(Boolean),
  );
}
function sanitizeSchemaParams(payload, handle = {}, includeDefaults = {}) {
  const schemaModelId2 = resolveSchemaModelId(payload);
  if (!schemaModelId2) return {};
  const map = getSchemaFieldIds(schemaModelId2);
  if (!map.size) return {};
  const plainParams = getPlainParams(handle),
    sanitizeModelUiSchemaParams2 = sanitizeModelUiSchemaParams(schemaModelId2, plainParams, {
      includeDefaults: includeDefaults.includeDefaults === true,
    }),
    state = {};
  for (const [config, scope] of Object.entries(sanitizeModelUiSchemaParams2)) {
    if (!map.has(config)) continue;
    if (!hasUsableValue(scope)) continue;
    state[config] = scope;
  }
  return state;
}
function sanitizeModelParamsMemoryRecord(input) {
  if (!isPlainObject(input)) return {};
  const output = {};
  for (const [value2, value3] of Object.entries(input)) {
    const schemaModelId3 = resolveSchemaModelId(value2);
    if (!schemaModelId3) continue;
    const sanitizeSchemaParams2 = sanitizeSchemaParams(schemaModelId3, value3, { includeDefaults: false });
    if (Object.keys(sanitizeSchemaParams2).length > 0) output[schemaModelId3] = sanitizeSchemaParams2;
  }
  return output;
}
function getModelParamsMemory(value4, value5) {
  const isPlainObject2 = isPlainObject(value4?.[MODEL_PARAMS_MEMORY_KEY])
    ? value4[MODEL_PARAMS_MEMORY_KEY]
    : {};
  return getPlainParams(isPlainObject2[value5]);
}
function pickSchemaFieldValues(value6, enabled4) {
  const value7 = {};
  if (!isPlainObject(value6) || !enabled4?.size) return value7;
  for (const value8 of enabled4) {
    if (!hasOwnField(value6, value8)) continue;
    const value9 = value6[value8];
    if (!hasUsableValue(value9)) continue;
    value7[value8] = value9;
  }
  return value7;
}
function mergeModelParamMemory(value10, value11, value12) {
  const schemaModelId4 = resolveSchemaModelId(value11);
  if (!schemaModelId4) return false;
  const args2 = sanitizeSchemaParams(schemaModelId4, value12, { includeDefaults: false });
  if (Object.keys(args2).length === 0) return false;
  !isPlainObject(value10[MODEL_PARAMS_MEMORY_KEY]) && (value10[MODEL_PARAMS_MEMORY_KEY] = {});
  const args3 = getPlainParams(value10[MODEL_PARAMS_MEMORY_KEY][schemaModelId4]),
    value13 = { ...args3, ...args2 },
    value14 = JSON.stringify(args3) !== JSON.stringify(value13);
  return (value14 && (value10[MODEL_PARAMS_MEMORY_KEY][schemaModelId4] = value13), value14);
}
function applyModelScopedParamsToNodeData(value15, args4, value16, value17) {
  if (!isSchemaMemoryNodeType(value17)) return args4;
  const nodeSchemaModelId = resolveNodeSchemaModelId(args4);
  if (!nodeSchemaModelId) return args4;
  const schemaFieldIds = getSchemaFieldIds(nodeSchemaModelId);
  if (!schemaFieldIds.size) return args4;
  const args5 = pickSchemaFieldValues(value16, schemaFieldIds),
    args6 = getModelParamsMemory(value16, nodeSchemaModelId),
    args7 = getPlainParams(getPlainParams(value15?.[MODEL_PARAMS_MEMORY_KEY])[nodeSchemaModelId]),
    args8 = pickSchemaFieldValues(value15, schemaFieldIds),
    args9 = getPlainParams(value15?.generationParams),
    enabled5 =
      Object.keys(args5).length > 0 ||
      Object.keys(args6).length > 0 ||
      Object.keys(args7).length > 0 ||
      Object.keys(args9).length > 0;
  if (!enabled5) return args4;
  const args10 = sanitizeSchemaParams(
    nodeSchemaModelId,
    { ...args5, ...args6, ...args7, ...args8, ...args9 },
    { includeDefaults: true },
  );
  if (Object.keys(args10).length === 0) return args4;
  const args11 = getPlainParams(args4.generationParams),
    args12 = getPlainParams(args4[MODEL_PARAMS_MEMORY_KEY]);
  return {
    ...args4,
    generationParams: { ...args11, ...args10 },
    [MODEL_PARAMS_MEMORY_KEY]: { ...args12, [nodeSchemaModelId]: args10 },
  };
}
function captureModelScopedParamsFromPatch(value18, args13, args14, value19) {
  if (!isSchemaMemoryNodeType(value18)) return false;
  let value20 = false;
  const sanitizeModelParamsMemoryRecord2 = sanitizeModelParamsMemoryRecord(args14?.[MODEL_PARAMS_MEMORY_KEY]);
  for (const [value21, value22] of Object.entries(sanitizeModelParamsMemoryRecord2)) {
    if (mergeModelParamMemory(value19, value21, value22)) value20 = true;
  }
  const nodeSchemaModelId2 = resolveNodeSchemaModelId({ ...args13, ...args14 });
  if (!nodeSchemaModelId2) return value20;
  const schemaFieldIds2 = getSchemaFieldIds(nodeSchemaModelId2);
  if (!schemaFieldIds2.size) return value20;
  const plainParams2 = getPlainParams(args14?.generationParams);
  return (mergeModelParamMemory(value19, nodeSchemaModelId2, plainParams2) && (value20 = true), value20);
}
export function sanitizeFeatureSelectionsRecord(value23) {
  if (!isPlainObject(value23)) return {};
  const value24 = {};
  for (const [value25, value26] of Object.entries(value23)) {
    if (!isPlainObject(value26)) continue;
    const value27 = {};
    for (const [value28, value29] of Object.entries(value26)) {
      if (value28 === MODEL_PARAMS_MEMORY_KEY) {
        if (!NODE_MODEL_PARAMS_MEMORY_TYPES.has(String(value25 || ''))) continue;
        const sanitizeModelParamsMemoryRecord3 = sanitizeModelParamsMemoryRecord(value29);
        Object.keys(sanitizeModelParamsMemoryRecord3).length > 0 &&
          (value27[MODEL_PARAMS_MEMORY_KEY] = sanitizeModelParamsMemoryRecord3);
        continue;
      }
      if (!hasUsableValue(value29)) continue;
      value27[String(value28)] = value29;
    }
    if (Object.keys(value27).length > 0) value24[String(value25)] = value27;
  }
  return value24;
}
export function applyFeatureSelectionsToNodeData(args15, value30) {
  if (!isPlainObject(args15)) return args15;
  const value31 = String(args15.type || '').trim(),
    toModuleKey2 = toModuleKey(value31);
  if (!toModuleKey2) return args15;
  const value32 = NODE_DEFAULT_SELECTIONS[value31] || {},
    value33 = NODE_MEMORY_SELECTION_FIELDS[value31] || [],
    isPlainObject3 = isPlainObject(value30?.[toModuleKey2]) ? value30[toModuleKey2] : {},
    value34 = { ...args15 };
  for (const value35 of value33) {
    if (hasOwnField(args15, value35)) continue;
    if (!hasUsableValue(isPlainObject3[value35])) continue;
    value34[value35] = isPlainObject3[value35];
  }
  for (const [value36, value37] of Object.entries(value32)) {
    if (hasOwnField(args15, value36)) continue;
    if (hasUsableValue(value34[value36])) continue;
    value34[value36] = value37;
  }
  const hasOwnField2 = hasOwnField(args15, 'model'),
    hasOwnField3 = hasOwnField(args15, 'audioWorkflowKey');
  if (value31 === 'ai-audio' && hasOwnField2 && !hasOwnField3 && hasUsableValue(value34.model)) {
    const value38 = String(value34.model).trim();
    (value38 === 'indextts2_clone' || value38 === 'voice_convert') && (value34.audioWorkflowKey = value38);
  }
  value31 === 'ai-audio' &&
    hasOwnField3 &&
    !hasOwnField2 &&
    hasUsableValue(value34.audioWorkflowKey) &&
    (value34.model = String(value34.audioWorkflowKey).trim());
  if (!hasUsableValue(value34.audioWorkflowKey) && hasUsableValue(value34.model)) {
    const value39 = String(value34.model).trim();
    (value39 === 'indextts2_clone' || value39 === 'voice_convert') && (value34.audioWorkflowKey = value39);
  }
  return (
    !hasUsableValue(value34.model) &&
      hasUsableValue(value34.audioWorkflowKey) &&
      (value34.model = String(value34.audioWorkflowKey).trim()),
    applyModelScopedParamsToNodeData(args15, value34, isPlainObject3, value31)
  );
}
export function captureFeatureSelectionsFromNodePatch(value40, value41, value42) {
  const value43 = String(value40?.type || '').trim(),
    toModuleKey3 = toModuleKey(value43);
  if (!toModuleKey3 || !isPlainObject(value41) || !isPlainObject(value42)) return false;
  const value44 = NODE_MEMORY_SELECTION_FIELDS[value43] || [],
    moduleRecord = ensureModuleRecord(value42, toModuleKey3);
  let value45 = false;
  for (const value46 of value44) {
    if (!Object.prototype.hasOwnProperty.call(value41, value46)) continue;
    const value47 = value41[value46];
    if (!hasUsableValue(value47)) continue;
    if (moduleRecord[value46] === value47) continue;
    ((moduleRecord[value46] = value47), (value45 = true));
  }
  if (
    Object.prototype.hasOwnProperty.call(value41, 'model') &&
    !Object.prototype.hasOwnProperty.call(value41, 'audioWorkflowKey') &&
    value43 === 'ai-audio' &&
    hasUsableValue(value41.model)
  ) {
    const value48 = String(value41.model).trim();
    (value48 === 'indextts2_clone' || value48 === 'voice_convert') &&
      moduleRecord.audioWorkflowKey !== value48 &&
      ((moduleRecord.audioWorkflowKey = value48), (value45 = true));
  }
  return (
    captureModelScopedParamsFromPatch(value43, value40, value41, moduleRecord) && (value45 = true),
    value45
  );
}
