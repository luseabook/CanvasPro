import { AGNES_MODEL_API_PROFILES } from './agnesProviderProfiles.js';
import { MINIMAX_MODEL_API_PROFILES } from './minimaxProviderProfiles.js';
import { RUNNINGHUB_MODEL_API_PROFILES } from './runningHubProviderProfiles.js';
export const MODEL_PROVIDER_PROFILES = Object['freeze']({
  ...RUNNINGHUB_MODEL_API_PROFILES,
  ...AGNES_MODEL_API_PROFILES,
  ...MINIMAX_MODEL_API_PROFILES,
});
export function getModelProviderProfile(value) {
  const item = String(value || '')['trim']();
  return MODEL_PROVIDER_PROFILES[item] || null;
}
