import { PROVIDERS_META } from '../modules/providers.js';

export function getProviderTaskConsoleUrl({ providerProfileId, provider, adapterType } = {}) {
  const providerId = providerProfileId || provider;
  return PROVIDERS_META[providerId]?.taskHistoryUrls?.[adapterType] || '';
}
