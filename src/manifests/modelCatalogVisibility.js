export const HIDDEN_MODEL_PROVIDER_IDS = Object.freeze(['ppio']);
const HIDDEN_MODEL_PROVIDER_ID_SET = new Set(HIDDEN_MODEL_PROVIDER_IDS);
export function isModelProviderPubliclyListed(value) {
  const list = String(value || '')
    .trim()
    .toLowerCase();
  return list.length > 0 && !HIDDEN_MODEL_PROVIDER_ID_SET.has(list);
}
export function isModelManifestPubliclyListed(item) {
  return Boolean(item && isModelProviderPubliclyListed(item.provider));
}
