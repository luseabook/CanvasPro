import { subscribeToModelCatalogState } from './subscriptionStateWatcher.js';
function normalizeProviderId(value) {
  return String(value || '')
    ['trim']()
    ['toLowerCase']();
}
export function isModelCatalogProviderVisible(response = {}, item = '') {
  const list = normalizeProviderId(item),
    providerId = normalizeProviderId(response?.['provider']),
    count = Number(response?.['modelCount']);
  return (
    list['length'] > 0 &&
    providerId === list &&
    response?.['status'] === 'ready' &&
    Number['isFinite'](count) &&
    count > 0
  );
}
export function bindModelCatalogProviderCardVisibility({
  store: store,
  card: card,
  providerId: providerId2,
} = {}) {
  if (!card) return () => {};
  return subscribeToModelCatalogState(store, (key) => {
    card['hidden'] = !isModelCatalogProviderVisible(key, providerId2);
  });
}
