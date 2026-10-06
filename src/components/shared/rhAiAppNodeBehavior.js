import { GENERATION_MANUAL_DISPLAY_SIZE_FIELD } from './generationDisplayPolicy.js';
import { getModelManifest, resolveModelExecution } from '../../manifests/index.js';
export const RH_AI_APP_PERSISTENT_ADVANCED_CLASS = 'is-rh-ai-app-persistent';
export const RH_AI_APP_RESULT_RATIO_KEY = 'rhAiAppResultRatioKey';
export function isRunningHubCustomAiAppManifest(value) {
  return Boolean(value?.extensions?.rhAiApp);
}
export function isComfyUiWorkflowManifest(item) {
  return Boolean(item?.extensions?.comfyUiWorkflow);
}
export function isCustomAiAppManifest(key) {
  return Boolean(isRunningHubCustomAiAppManifest(key) || isComfyUiWorkflowManifest(key));
}
export function isRunningHubAiAppManifest(index) {
  return isCustomAiAppManifest(index);
}
export function shouldAllowEmptyCustomAiAppInputs(result) {
  return isCustomAiAppManifest(result);
}
function findBundleModelManifest(data, options = '', target = '') {
  const list = Array.isArray(data?.models) ? data.models : [];
  if (!list.length) return null;
  const source = String(options || '').trim(),
    enabled = String(target || '')
      .trim()
      .toLowerCase();
  return (
    list.find((next) => String(next?.modelId || '').trim() === source) ||
    list.find((current) => {
      return (
        (!enabled ||
          String(current?.provider || '')
            .trim()
            .toLowerCase() === enabled) &&
        isCustomAiAppManifest(current)
      );
    }) ||
    null
  );
}
export function resolveCustomAiAppNodeManifest(options2 = {}, entry = {}) {
  const record = String(entry.model || options2?.model || options2?.audioWorkflowKey || '').trim(),
    providerHint = entry.provider ?? options2?.provider,
    payload =
      (record ? resolveModelExecution(record, { providerHint: providerHint }) : null) ||
      (record ? resolveModelExecution(record) : null),
    handle = payload?.modelManifest || (record ? getModelManifest(record) : null) || null;
  if (isCustomAiAppManifest(handle)) return handle;
  const state =
      entry.bundle ||
      options2?.rhAiAppManifestBundle ||
      options2?.customAiAppManifestBundle ||
      null,
    bundleModelManifest = findBundleModelManifest(state, record, providerHint);
  return isCustomAiAppManifest(bundleModelManifest) ? bundleModelManifest : null;
}
function normalizePositiveNumber(config) {
  const count = Number(config);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
function scaleByShortSide(scope, input, output) {
  const positiveNumber = normalizePositiveNumber(scope) || 1,
    positiveNumber2 = normalizePositiveNumber(input) || 1,
    value2 = Math.max(1, Math.round(Number(output) || 288)),
    value3 = value2 / Math.min(positiveNumber, positiveNumber2);
  return {
    width: Math.max(1, Math.round(positiveNumber * value3)),
    height: Math.max(1, Math.round(positiveNumber2 * value3)),
  };
}
export function buildRhAiAppResultDisplayPatch({
  nodeData: nodeData = {},
  mediaWidth: mediaWidth = 0,
  mediaHeight: mediaHeight = 0,
  mediaKey: mediaKey = '',
  shortSide: shortSide = 288,
} = {}) {
  const positiveNumber3 = normalizePositiveNumber(mediaWidth),
    positiveNumber4 = normalizePositiveNumber(mediaHeight);
  if (!(positiveNumber3 > 0 && positiveNumber4 > 0)) return {};
  const value4 = [
    String(mediaKey || '').trim(),
    Math.round(positiveNumber3),
    Math.round(positiveNumber4),
  ]
    .filter(Boolean)
    .join('|');
  if (value4 && String(nodeData?.[RH_AI_APP_RESULT_RATIO_KEY] || '') === value4) return {};
  const width = scaleByShortSide(positiveNumber3, positiveNumber4, shortSide),
    value5 = Math.max(1, Math.round(Number(nodeData?.width) || shortSide)),
    value6 = Math.max(1, Math.round(Number(nodeData?.height) || shortSide)),
    value7 = Number.isFinite(Number(nodeData?.x)) ? Number(nodeData.x) : 0,
    value8 = Number.isFinite(Number(nodeData?.y)) ? Number(nodeData.y) : 0;
  return {
    width: width.width,
    height: width.height,
    x: Math.round(value7 - (width.width - value5) / 2),
    y: Math.round(value8 - (width.height - value6)),
    [RH_AI_APP_RESULT_RATIO_KEY]: value4,
    [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: false,
  };
}
