const UNSAFE_RECORD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array['isArray'](enabled);
}
function isSupportedParamValue(value) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
export function normalizeGenerationParams(item) {
  if (!isPlainObject(item)) return {};
  const key = {};
  for (const [index, result] of Object['entries'](item)) {
    const enabled2 = String(index || '')['trim']();
    if (!enabled2 || UNSAFE_RECORD_KEYS['has'](enabled2) || !isSupportedParamValue(result)) continue;
    if (typeof result === 'number' && !Number['isFinite'](result)) continue;
    key[enabled2] = typeof result === 'string' ? result['trim']() : result;
  }
  return key;
}
export function normalizeGenerationParamsByModel(data) {
  if (!isPlainObject(data)) return {};
  const options = {};
  for (const [target, source] of Object['entries'](data)) {
    const enabled3 = String(target || '')['trim']();
    if (!enabled3 || UNSAFE_RECORD_KEYS['has'](enabled3)) continue;
    options[enabled3] = normalizeGenerationParams(source);
  }
  return options;
}
export function buildModelGenerationParamsSelectionPatch(options2 = {}, next = '') {
  const current = String(options2?.['model'] || '')['trim'](),
    entry = String(next || '')['trim'](),
    generationParamsByModel = normalizeGenerationParamsByModel(options2?.['generationParamsByModel']);
  current && (generationParamsByModel[current] = normalizeGenerationParams(options2?.['generationParams']));
  const generationParams = entry ? normalizeGenerationParams(generationParamsByModel[entry]) : {};
  if (entry) generationParamsByModel[entry] = generationParams;
  return { generationParams: generationParams, generationParamsByModel: generationParamsByModel };
}
export function buildActiveModelGenerationParamPatch(options3 = {}, record = '', payload = '') {
  const enabled4 = String(record || '')['trim']();
  if (!enabled4 || UNSAFE_RECORD_KEYS['has'](enabled4) || !isSupportedParamValue(payload)) return {};
  const handle = String(options3?.['model'] || '')['trim'](),
    generationParams2 = {
      ...normalizeGenerationParams(options3?.['generationParams']),
      [enabled4]: typeof payload === 'string' ? payload['trim']() : payload,
    },
    generationParamsByModel2 = normalizeGenerationParamsByModel(options3?.['generationParamsByModel']);
  if (handle) generationParamsByModel2[handle] = generationParams2;
  return { generationParams: generationParams2, generationParamsByModel: generationParamsByModel2 };
}
