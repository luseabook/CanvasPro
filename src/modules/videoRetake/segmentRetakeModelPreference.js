import { isSegmentRetakeEditing, isSegmentRetakeModelSupported } from './segmentRetakeModelPolicy.js';
export const SEGMENT_RETAKE_DEFAULT_MODEL_ID = 'apimart/doubao-seedance-2.5';
export const SEGMENT_RETAKE_MODEL_PREFERENCE_STORAGE_KEY = 'v2-segment-retake-model';
function getRuntimeStorage() {
  try {
    if (globalThis['localStorage']) return globalThis['localStorage'];
  } catch {}
  try {
    return globalThis['window']?.['localStorage'] || null;
  } catch {
    return null;
  }
}
function normalizeSupportedModelId(value) {
  const item = String(value || '')['trim']();
  return isSegmentRetakeModelSupported(item) ? item : '';
}
export function getSegmentRetakePreferredModelId(runtimeStorage = getRuntimeStorage()) {
  let key = '';
  try {
    key = runtimeStorage?.['getItem']?.(SEGMENT_RETAKE_MODEL_PREFERENCE_STORAGE_KEY);
  } catch {}
  return normalizeSupportedModelId(key) || SEGMENT_RETAKE_DEFAULT_MODEL_ID;
}
export function rememberSegmentRetakeModelSelection(index, result, runtimeStorage2 = getRuntimeStorage()) {
  if (!isSegmentRetakeEditing(index)) return '';
  const supportedModelId = normalizeSupportedModelId(result);
  if (!supportedModelId) return '';
  try {
    runtimeStorage2?.['setItem']?.(SEGMENT_RETAKE_MODEL_PREFERENCE_STORAGE_KEY, supportedModelId);
  } catch {}
  return supportedModelId;
}
