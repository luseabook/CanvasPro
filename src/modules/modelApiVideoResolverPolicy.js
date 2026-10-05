import { resolveModelExecution } from '../manifests/index.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function hasOwn(enabled, item) {
  return !!enabled && Object['prototype']['hasOwnProperty']['call'](enabled, item);
}
function resolveModelApiVideoExecution(key, providerHint = '') {
  const modelExecution =
    resolveModelExecution(key, { providerHint: providerHint }) || resolveModelExecution(key);
  if (
    modelExecution?.['modelManifest']?.['kind'] !== 'video' ||
    modelExecution?.['modelManifest']?.['adapterType'] !== 'modelApi' ||
    modelExecution?.['executionManifest']?.['adapterType'] !== 'modelApi'
  )
    return null;
  return modelExecution;
}
export function getModelApiVideoBodyResolverName(index, result = '') {
  const modelApiVideoExecution = resolveModelApiVideoExecution(index, result);
  return normalizeText(modelApiVideoExecution?.['executionManifest']?.['extensions']?.['bodyResolver']);
}
export function getModelApiVideoExtension(data, options = '', target = '') {
  const text = normalizeText(target);
  if (!text) return undefined;
  const modelApiVideoExecution2 = resolveModelApiVideoExecution(data, options),
    source = modelApiVideoExecution2?.['modelManifest']?.['extensions'];
  if (hasOwn(source, text)) return source[text];
  const next = modelApiVideoExecution2?.['executionManifest']?.['extensions'];
  if (hasOwn(next, text)) return next[text];
  return undefined;
}
export function getModelApiVideoFamily(current, entry = '') {
  return normalizeText(getModelApiVideoExtension(current, entry, 'videoFamily'));
}
export function getModelApiVideoFamilyOptions(record, payload = '', handle = '') {
  const text2 = normalizeText(handle);
  if (!text2 || getModelApiVideoFamily(record, payload) !== text2) return Object['freeze']({});
  const modelApiVideoExtension = getModelApiVideoExtension(record, payload, text2);
  return modelApiVideoExtension &&
    typeof modelApiVideoExtension === 'object' &&
    !Array['isArray'](modelApiVideoExtension)
    ? modelApiVideoExtension
    : Object['freeze']({});
}
export function isModelApiVideoFamily(state, config = '', scope = '') {
  const text3 = normalizeText(scope);
  return !!text3 && getModelApiVideoFamily(state, config) === text3;
}
export function getModelApiVideoMaxInputVideoSeconds(input, output = '', value2 = null) {
  const count = Number(getModelApiVideoExtension(input, output, 'maxInputVideoSeconds'));
  return Number['isFinite'](count) && count > 0 ? Math['trunc'](count) : value2;
}
export function isHappyHorseModelApiVideo(value3, value4 = '') {
  return isModelApiVideoFamily(value3, value4, 'happyHorse');
}
export function getHappyHorseModelApiVideoOptions(value5, value6 = '') {
  return getModelApiVideoFamilyOptions(value5, value6, 'happyHorse');
}
export function supportsHappyHorseModelApiVideoEdit(value7, value8 = '') {
  return getHappyHorseModelApiVideoOptions(value7, value8)?.['supportsEdit'] !== ![];
}
export function isSeedance2ModelApiVideo(value9, value10 = '') {
  return isModelApiVideoFamily(value9, value10, 'seedance2');
}
export function isWan27ModelApiVideo(value11, value12 = '') {
  return isModelApiVideoFamily(value11, value12, 'wan27');
}
