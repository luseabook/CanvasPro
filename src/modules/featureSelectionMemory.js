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
function isPlainObject(_0x40aa43) {
  return !!_0x40aa43 && typeof _0x40aa43 === 'object' && !Array.isArray(_0x40aa43);
}
function hasUsableValue(_0x2cdbd2) {
  if (_0x2cdbd2 === null || _0x2cdbd2 === undefined) return false;
  if (typeof _0x2cdbd2 === 'string') return _0x2cdbd2.trim().length > 0;
  if (typeof _0x2cdbd2 === 'number') return Number.isFinite(_0x2cdbd2);
  if (typeof _0x2cdbd2 === 'boolean') return true;
  return false;
}
function toModuleKey(_0x2d2d68) {
  return NODE_MODULE_KEY_MAP[String(_0x2d2d68 || '').trim()] || '';
}
function ensureModuleRecord(_0x21c705, _0x41524a) {
  return (!isPlainObject(_0x21c705[_0x41524a]) && (_0x21c705[_0x41524a] = {}), _0x21c705[_0x41524a]);
}
function hasOwnField(_0x39059a, _0x559b31) {
  return !!_0x39059a && Object.prototype.hasOwnProperty.call(_0x39059a, _0x559b31);
}
function isSchemaMemoryNodeType(_0x507b89) {
  return NODE_MODEL_PARAMS_MEMORY_TYPES.has(String(_0x507b89 || '').trim());
}
function getPlainParams(_0x38bb08) {
  return isPlainObject(_0x38bb08) ? { ..._0x38bb08 } : {};
}
function hasModelManifest(_0x4736f4) {
  return !!getModelManifest(_0x4736f4);
}
function resolveSchemaModelId(_0x26cf5c, _0x42c2c6 = '') {
  const _0x49d71d = String(_0x26cf5c || '').trim();
  if (!_0x49d71d) return '';
  if (hasModelManifest(_0x49d71d)) return _0x49d71d;
  try {
    const _0x2dbf4d =
        resolveModelExecution(_0x49d71d, { providerHint: _0x42c2c6 }) || resolveModelExecution(_0x49d71d),
      _0x3ec50d = String(_0x2dbf4d?.canonicalModelId || _0x2dbf4d?.modelManifest?.modelId || '').trim();
    return _0x3ec50d && hasModelManifest(_0x3ec50d) ? _0x3ec50d : '';
  } catch {
    return '';
  }
}
function resolveNodeSchemaModelId(_0x19fc7c = {}) {
  const _0x4ee418 = String(_0x19fc7c?.provider || '').trim(),
    _0x4fb7a0 =
      String(_0x19fc7c?.type || '').trim() === 'ai-audio'
        ? [_0x19fc7c?.model, _0x19fc7c?.audioWorkflowKey]
        : [_0x19fc7c?.model];
  for (const _0x3d2760 of _0x4fb7a0) {
    const _0x35a215 = resolveSchemaModelId(_0x3d2760, _0x4ee418);
    if (_0x35a215) return _0x35a215;
  }
  return '';
}
function getSchemaFieldIds(_0x449b40) {
  const _0x43049d = getModelManifest(_0x449b40)?.uiSchema?.fields;
  return new Set(
    (Array.isArray(_0x43049d) ? _0x43049d : [])
      .map((_0x30b275) => String(_0x30b275?.id || '').trim())
      .filter(Boolean),
  );
}
function sanitizeSchemaParams(_0x112e93, _0x137ffc = {}, _0x3e1356 = {}) {
  const _0x490999 = resolveSchemaModelId(_0x112e93);
  if (!_0x490999) return {};
  const _0x87281 = getSchemaFieldIds(_0x490999);
  if (!_0x87281.size) return {};
  const _0x1de637 = getPlainParams(_0x137ffc),
    _0x4ec882 = sanitizeModelUiSchemaParams(_0x490999, _0x1de637, {
      includeDefaults: _0x3e1356.includeDefaults === true,
    }),
    _0x3cd032 = {};
  for (const [_0x1c738b, _0x1cbd17] of Object.entries(_0x4ec882)) {
    if (!_0x87281.has(_0x1c738b)) continue;
    if (!hasUsableValue(_0x1cbd17)) continue;
    _0x3cd032[_0x1c738b] = _0x1cbd17;
  }
  return _0x3cd032;
}
function sanitizeModelParamsMemoryRecord(_0x40f0a6) {
  if (!isPlainObject(_0x40f0a6)) return {};
  const _0x473d61 = {};
  for (const [_0x56ccd, _0x24185f] of Object.entries(_0x40f0a6)) {
    const _0x5a43b7 = resolveSchemaModelId(_0x56ccd);
    if (!_0x5a43b7) continue;
    const _0x440e2f = sanitizeSchemaParams(_0x5a43b7, _0x24185f, { includeDefaults: false });
    if (Object.keys(_0x440e2f).length > 0) _0x473d61[_0x5a43b7] = _0x440e2f;
  }
  return _0x473d61;
}
function getModelParamsMemory(_0x5aee0b, _0x20355d) {
  const _0x23911e = isPlainObject(_0x5aee0b?.[MODEL_PARAMS_MEMORY_KEY])
    ? _0x5aee0b[MODEL_PARAMS_MEMORY_KEY]
    : {};
  return getPlainParams(_0x23911e[_0x20355d]);
}
function pickSchemaFieldValues(_0x5ef215, _0x6f861b) {
  const _0x578113 = {};
  if (!isPlainObject(_0x5ef215) || !_0x6f861b?.size) return _0x578113;
  for (const _0x5d0204 of _0x6f861b) {
    if (!hasOwnField(_0x5ef215, _0x5d0204)) continue;
    const _0x140e15 = _0x5ef215[_0x5d0204];
    if (!hasUsableValue(_0x140e15)) continue;
    _0x578113[_0x5d0204] = _0x140e15;
  }
  return _0x578113;
}
function mergeModelParamMemory(_0x269922, _0x145712, _0xc1a143) {
  const _0x92b71b = resolveSchemaModelId(_0x145712);
  if (!_0x92b71b) return false;
  const _0x6443ad = sanitizeSchemaParams(_0x92b71b, _0xc1a143, { includeDefaults: false });
  if (Object.keys(_0x6443ad).length === 0) return false;
  !isPlainObject(_0x269922[MODEL_PARAMS_MEMORY_KEY]) && (_0x269922[MODEL_PARAMS_MEMORY_KEY] = {});
  const _0x349ff4 = getPlainParams(_0x269922[MODEL_PARAMS_MEMORY_KEY][_0x92b71b]),
    _0xbbe7bc = { ..._0x349ff4, ..._0x6443ad },
    _0x339276 = JSON.stringify(_0x349ff4) !== JSON.stringify(_0xbbe7bc);
  return (_0x339276 && (_0x269922[MODEL_PARAMS_MEMORY_KEY][_0x92b71b] = _0xbbe7bc), _0x339276);
}
function applyModelScopedParamsToNodeData(_0xbfcc51, _0x116d23, _0x38eea5, _0x2830b4) {
  if (!isSchemaMemoryNodeType(_0x2830b4)) return _0x116d23;
  const _0xfce973 = resolveNodeSchemaModelId(_0x116d23);
  if (!_0xfce973) return _0x116d23;
  const _0x266e83 = getSchemaFieldIds(_0xfce973);
  if (!_0x266e83.size) return _0x116d23;
  const _0x2b5189 = pickSchemaFieldValues(_0x38eea5, _0x266e83),
    _0x3cadbd = getModelParamsMemory(_0x38eea5, _0xfce973),
    _0x3472be = getPlainParams(getPlainParams(_0xbfcc51?.[MODEL_PARAMS_MEMORY_KEY])[_0xfce973]),
    _0x294fd6 = pickSchemaFieldValues(_0xbfcc51, _0x266e83),
    _0x51a4f2 = getPlainParams(_0xbfcc51?.generationParams),
    _0x436c79 =
      Object.keys(_0x2b5189).length > 0 ||
      Object.keys(_0x3cadbd).length > 0 ||
      Object.keys(_0x3472be).length > 0 ||
      Object.keys(_0x51a4f2).length > 0;
  if (!_0x436c79) return _0x116d23;
  const _0x1d231f = sanitizeSchemaParams(
    _0xfce973,
    { ..._0x2b5189, ..._0x3cadbd, ..._0x3472be, ..._0x294fd6, ..._0x51a4f2 },
    { includeDefaults: true },
  );
  if (Object.keys(_0x1d231f).length === 0) return _0x116d23;
  const _0x5e2401 = getPlainParams(_0x116d23.generationParams),
    _0xf216e6 = getPlainParams(_0x116d23[MODEL_PARAMS_MEMORY_KEY]);
  return {
    ..._0x116d23,
    generationParams: { ..._0x5e2401, ..._0x1d231f },
    [MODEL_PARAMS_MEMORY_KEY]: { ..._0xf216e6, [_0xfce973]: _0x1d231f },
  };
}
function captureModelScopedParamsFromPatch(_0x2712b5, _0x12408f, _0x56cecc, _0x4b9d5c) {
  if (!isSchemaMemoryNodeType(_0x2712b5)) return false;
  let _0x4a6db8 = false;
  const _0x13c84a = sanitizeModelParamsMemoryRecord(_0x56cecc?.[MODEL_PARAMS_MEMORY_KEY]);
  for (const [_0x155430, _0x3bb0ef] of Object.entries(_0x13c84a)) {
    if (mergeModelParamMemory(_0x4b9d5c, _0x155430, _0x3bb0ef)) _0x4a6db8 = true;
  }
  const _0x5a3f3f = resolveNodeSchemaModelId({ ..._0x12408f, ..._0x56cecc });
  if (!_0x5a3f3f) return _0x4a6db8;
  const _0x5d6e82 = getSchemaFieldIds(_0x5a3f3f);
  if (!_0x5d6e82.size) return _0x4a6db8;
  const _0x3fd22f = getPlainParams(_0x56cecc?.generationParams);
  return (mergeModelParamMemory(_0x4b9d5c, _0x5a3f3f, _0x3fd22f) && (_0x4a6db8 = true), _0x4a6db8);
}
export function sanitizeFeatureSelectionsRecord(_0x4b0ef3) {
  if (!isPlainObject(_0x4b0ef3)) return {};
  const _0x39c2f3 = {};
  for (const [_0x47e392, _0xc829dc] of Object.entries(_0x4b0ef3)) {
    if (!isPlainObject(_0xc829dc)) continue;
    const _0x5b97da = {};
    for (const [_0x597a62, _0xa7fdb4] of Object.entries(_0xc829dc)) {
      if (_0x597a62 === MODEL_PARAMS_MEMORY_KEY) {
        if (!NODE_MODEL_PARAMS_MEMORY_TYPES.has(String(_0x47e392 || ''))) continue;
        const _0x1ee262 = sanitizeModelParamsMemoryRecord(_0xa7fdb4);
        Object.keys(_0x1ee262).length > 0 && (_0x5b97da[MODEL_PARAMS_MEMORY_KEY] = _0x1ee262);
        continue;
      }
      if (!hasUsableValue(_0xa7fdb4)) continue;
      _0x5b97da[String(_0x597a62)] = _0xa7fdb4;
    }
    if (Object.keys(_0x5b97da).length > 0) _0x39c2f3[String(_0x47e392)] = _0x5b97da;
  }
  return _0x39c2f3;
}
export function applyFeatureSelectionsToNodeData(_0x9146ee, _0x2e1235) {
  if (!isPlainObject(_0x9146ee)) return _0x9146ee;
  const _0x46f9b9 = String(_0x9146ee.type || '').trim(),
    _0x703a8b = toModuleKey(_0x46f9b9);
  if (!_0x703a8b) return _0x9146ee;
  const _0xd7b09a = NODE_DEFAULT_SELECTIONS[_0x46f9b9] || {},
    _0xeb6c0 = NODE_MEMORY_SELECTION_FIELDS[_0x46f9b9] || [],
    _0x445776 = isPlainObject(_0x2e1235?.[_0x703a8b]) ? _0x2e1235[_0x703a8b] : {},
    _0x4ac9d0 = { ..._0x9146ee };
  for (const _0x3b6065 of _0xeb6c0) {
    if (hasOwnField(_0x9146ee, _0x3b6065)) continue;
    if (!hasUsableValue(_0x445776[_0x3b6065])) continue;
    _0x4ac9d0[_0x3b6065] = _0x445776[_0x3b6065];
  }
  for (const [_0x435046, _0x201cb2] of Object.entries(_0xd7b09a)) {
    if (hasOwnField(_0x9146ee, _0x435046)) continue;
    if (hasUsableValue(_0x4ac9d0[_0x435046])) continue;
    _0x4ac9d0[_0x435046] = _0x201cb2;
  }
  const _0x5f55eb = hasOwnField(_0x9146ee, 'model'),
    _0xdc8882 = hasOwnField(_0x9146ee, 'audioWorkflowKey');
  if (_0x46f9b9 === 'ai-audio' && _0x5f55eb && !_0xdc8882 && hasUsableValue(_0x4ac9d0.model)) {
    const _0x50ad40 = String(_0x4ac9d0.model).trim();
    (_0x50ad40 === 'indextts2_clone' || _0x50ad40 === 'voice_convert') &&
      (_0x4ac9d0.audioWorkflowKey = _0x50ad40);
  }
  _0x46f9b9 === 'ai-audio' &&
    _0xdc8882 &&
    !_0x5f55eb &&
    hasUsableValue(_0x4ac9d0.audioWorkflowKey) &&
    (_0x4ac9d0.model = String(_0x4ac9d0.audioWorkflowKey).trim());
  if (!hasUsableValue(_0x4ac9d0.audioWorkflowKey) && hasUsableValue(_0x4ac9d0.model)) {
    const _0x312463 = String(_0x4ac9d0.model).trim();
    (_0x312463 === 'indextts2_clone' || _0x312463 === 'voice_convert') &&
      (_0x4ac9d0.audioWorkflowKey = _0x312463);
  }
  return (
    !hasUsableValue(_0x4ac9d0.model) &&
      hasUsableValue(_0x4ac9d0.audioWorkflowKey) &&
      (_0x4ac9d0.model = String(_0x4ac9d0.audioWorkflowKey).trim()),
    applyModelScopedParamsToNodeData(_0x9146ee, _0x4ac9d0, _0x445776, _0x46f9b9)
  );
}
export function captureFeatureSelectionsFromNodePatch(_0x49488e, _0x41cd1e, _0x3936ae) {
  const _0x20f12a = String(_0x49488e?.type || '').trim(),
    _0x56929d = toModuleKey(_0x20f12a);
  if (!_0x56929d || !isPlainObject(_0x41cd1e) || !isPlainObject(_0x3936ae)) return false;
  const _0x1bf22e = NODE_MEMORY_SELECTION_FIELDS[_0x20f12a] || [],
    _0x421a02 = ensureModuleRecord(_0x3936ae, _0x56929d);
  let _0x1bb7ab = false;
  for (const _0x52162b of _0x1bf22e) {
    if (!Object.prototype.hasOwnProperty.call(_0x41cd1e, _0x52162b)) continue;
    const _0x2a9379 = _0x41cd1e[_0x52162b];
    if (!hasUsableValue(_0x2a9379)) continue;
    if (_0x421a02[_0x52162b] === _0x2a9379) continue;
    ((_0x421a02[_0x52162b] = _0x2a9379), (_0x1bb7ab = true));
  }
  if (
    Object.prototype.hasOwnProperty.call(_0x41cd1e, 'model') &&
    !Object.prototype.hasOwnProperty.call(_0x41cd1e, 'audioWorkflowKey') &&
    _0x20f12a === 'ai-audio' &&
    hasUsableValue(_0x41cd1e.model)
  ) {
    const _0x2d3cc3 = String(_0x41cd1e.model).trim();
    (_0x2d3cc3 === 'indextts2_clone' || _0x2d3cc3 === 'voice_convert') &&
      _0x421a02.audioWorkflowKey !== _0x2d3cc3 &&
      ((_0x421a02.audioWorkflowKey = _0x2d3cc3), (_0x1bb7ab = true));
  }
  return (
    captureModelScopedParamsFromPatch(_0x20f12a, _0x49488e, _0x41cd1e, _0x421a02) && (_0x1bb7ab = true),
    _0x1bb7ab
  );
}
