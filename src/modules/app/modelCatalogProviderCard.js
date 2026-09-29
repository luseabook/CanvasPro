import { subscribeToModelCatalogState } from './subscriptionStateWatcher.js';
function normalizeProviderId(_0x5906e9) {
  return String(_0x5906e9 || '')
    ['trim']()
    ['toLowerCase']();
}
export function isModelCatalogProviderVisible(_0x414dc8 = {}, _0x343f44 = '') {
  const _0x46605e = normalizeProviderId(_0x343f44),
    _0x34caf9 = normalizeProviderId(_0x414dc8?.['provider']),
    _0x3b074c = Number(_0x414dc8?.['modelCount']);
  return (
    _0x46605e['length'] > 0x0 &&
    _0x34caf9 === _0x46605e &&
    _0x414dc8?.['status'] === 'ready' &&
    Number['isFinite'](_0x3b074c) &&
    _0x3b074c > 0x0
  );
}
export function bindModelCatalogProviderCardVisibility({
  store: _0x5cb0f8,
  card: _0x1815dd,
  providerId: _0x316619,
} = {}) {
  if (!_0x1815dd) return () => {};
  return subscribeToModelCatalogState(_0x5cb0f8, (_0x178d86) => {
    _0x1815dd['hidden'] = !isModelCatalogProviderVisible(_0x178d86, _0x316619);
  });
}
