export const HIDDEN_MODEL_PROVIDER_IDS = Object['freeze'](['ppio']);
const HIDDEN_MODEL_PROVIDER_ID_SET = new Set(HIDDEN_MODEL_PROVIDER_IDS);
export function isModelProviderPubliclyListed(_0x403190) {
  const _0xf4e26e = String(_0x403190 || '')
    ['trim']()
    ['toLowerCase']();
  return _0xf4e26e['length'] > 0x0 && !HIDDEN_MODEL_PROVIDER_ID_SET['has'](_0xf4e26e);
}
export function isModelManifestPubliclyListed(_0x5a433b) {
  return Boolean(_0x5a433b && isModelProviderPubliclyListed(_0x5a433b['provider']));
}
