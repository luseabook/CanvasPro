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
function normalizeSupportedModelId(_0x2be510) {
  const _0x26380e = String(_0x2be510 || '')['trim']();
  return isSegmentRetakeModelSupported(_0x26380e) ? _0x26380e : '';
}
export function getSegmentRetakePreferredModelId(_0x3a3491 = getRuntimeStorage()) {
  let _0x2b55f9 = '';
  try {
    _0x2b55f9 = _0x3a3491?.['getItem']?.(SEGMENT_RETAKE_MODEL_PREFERENCE_STORAGE_KEY);
  } catch {}
  return normalizeSupportedModelId(_0x2b55f9) || SEGMENT_RETAKE_DEFAULT_MODEL_ID;
}
export function rememberSegmentRetakeModelSelection(_0x77378d, _0x1906e9, _0x15a44a = getRuntimeStorage()) {
  if (!isSegmentRetakeEditing(_0x77378d)) return '';
  const _0x49a628 = normalizeSupportedModelId(_0x1906e9);
  if (!_0x49a628) return '';
  try {
    _0x15a44a?.['setItem']?.(SEGMENT_RETAKE_MODEL_PREFERENCE_STORAGE_KEY, _0x49a628);
  } catch {}
  return _0x49a628;
}
