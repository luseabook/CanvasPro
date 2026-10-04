import { resolveRunningHubWorkflowAccess } from '../../api/configApi.js';
import appStore from '../core/stores/appStore.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
const RH_KEYING_FPS_OPTIONS = Object.freeze([16, 24, 30]);
export const RH_DEFAULT_KEYING_FPS = 24;
export const RH_DEFAULT_KEYING_RESOLUTION = 0x400;
export const RH_DEFAULT_KEYING_MASK_MODE = 'Sec';
export const RH_DEFAULT_INSTANCE_TYPE = 'default';
const SOURCE_VIDEO_KEYING_MEMORY_KEY = 'source-video';
export function getRhKeyingFpsOptions() {
  return RH_KEYING_FPS_OPTIONS;
}
export function hasUsableKeyingSettingValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  return true;
}
export function normalizeRhKeyingFps(item) {
  const key = Number(item);
  return getRhKeyingFpsOptions().includes(key) ? key : RH_DEFAULT_KEYING_FPS;
}
export function resolveSourceVideoKeyingSetting(index, result, data) {
  const options = index?.[result];
  if (hasUsableKeyingSettingValue(options)) return options;
  const target = appStore.getFeatureSelection?.(SOURCE_VIDEO_KEYING_MEMORY_KEY, result, undefined);
  return hasUsableKeyingSettingValue(target) ? target : data;
}
export function normalizeRhKeyingResolution(source) {
  const next = Number(source);
  return Number.isFinite(next) ? Math.trunc(next) : RH_DEFAULT_KEYING_RESOLUTION;
}
export function normalizeRhInstanceType(current) {
  return String(current || RH_DEFAULT_INSTANCE_TYPE) === 'plus' ? 'plus' : RH_DEFAULT_INSTANCE_TYPE;
}
export async function getRunningHubWorkflowApiKey() {
  await ensureConfig();
  const providerConfig = getProviderConfig('runninghubwf');
  return String(providerConfig?.apiKey || '').trim();
}

export async function getRunningHubWorkflowAccess(entry = '') {
  return resolveRunningHubWorkflowAccess(entry);
}
