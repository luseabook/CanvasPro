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
export function hasUsableKeyingSettingValue(_0x20045e) {
  if (_0x20045e === null || _0x20045e === undefined) return false;
  if (typeof _0x20045e === 'string') return _0x20045e.trim().length > 0;
  if (typeof _0x20045e === 'number') return Number.isFinite(_0x20045e);
  return true;
}
export function normalizeRhKeyingFps(_0x996b8a) {
  const _0x2eb33d = Number(_0x996b8a);
  return getRhKeyingFpsOptions().includes(_0x2eb33d) ? _0x2eb33d : RH_DEFAULT_KEYING_FPS;
}
export function resolveSourceVideoKeyingSetting(_0x6fd943, _0xe07e7a, _0x7eab3c) {
  const _0x2192f5 = _0x6fd943?.[_0xe07e7a];
  if (hasUsableKeyingSettingValue(_0x2192f5)) return _0x2192f5;
  const _0x7ac34e = appStore.getFeatureSelection?.(SOURCE_VIDEO_KEYING_MEMORY_KEY, _0xe07e7a, undefined);
  return hasUsableKeyingSettingValue(_0x7ac34e) ? _0x7ac34e : _0x7eab3c;
}
export function normalizeRhKeyingResolution(_0x49e16d) {
  const _0x141c7c = Number(_0x49e16d);
  return Number.isFinite(_0x141c7c) ? Math.trunc(_0x141c7c) : RH_DEFAULT_KEYING_RESOLUTION;
}
export function normalizeRhInstanceType(_0x48b67b) {
  return String(_0x48b67b || RH_DEFAULT_INSTANCE_TYPE) === 'plus' ? 'plus' : RH_DEFAULT_INSTANCE_TYPE;
}
export async function getRunningHubWorkflowApiKey() {
  await ensureConfig();
  const _0x11b52e = getProviderConfig('runninghubwf');
  return String(_0x11b52e?.apiKey || '').trim();
}

export async function getRunningHubWorkflowAccess(_0x3a9eb1=''){return resolveRunningHubWorkflowAccess(_0x3a9eb1);}
