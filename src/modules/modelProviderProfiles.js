import { AGNES_MODEL_API_PROFILES } from './agnesProviderProfiles.js';
import { MINIMAX_MODEL_API_PROFILES } from './minimaxProviderProfiles.js';
import { RUNNINGHUB_MODEL_API_PROFILES } from './runningHubProviderProfiles.js';
export const MODEL_PROVIDER_PROFILES = Object['freeze']({
  ...RUNNINGHUB_MODEL_API_PROFILES,
  ...AGNES_MODEL_API_PROFILES,
  ...MINIMAX_MODEL_API_PROFILES,
});
export function getModelProviderProfile(_0x6f153d) {
  const _0x3ceb08 = String(_0x6f153d || '')['trim']();
  return MODEL_PROVIDER_PROFILES[_0x3ceb08] || null;
}
