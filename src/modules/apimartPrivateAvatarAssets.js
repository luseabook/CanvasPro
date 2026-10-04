export const APIMART_PRIVATE_AVATAR_ASSET_KEY = 'apimartSeedance2PrivateAvatar';
export const APIMART_PRIVATE_AVATAR_CAPABILITY = 'seedance2PrivateAvatar';
const PASSED_STATUSES = new Set(['passed', 'active', 'completed', 'success']);
export function normalizeApimartPrivateAvatarAsset(response = {}) {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return null;
  const status = String(response.status || '')
      .trim()
      .toLowerCase(),
    assetUrl = String(response.assetUrl || response.asset_url || response.url || '').trim();
  return {
    provider: 'apimart',
    capability: APIMART_PRIVATE_AVATAR_CAPABILITY,
    status: status,
    assetUrl: assetUrl,
    sourceUrl: String(response.sourceUrl || response.source_url || '').trim(),
    uploadedSourceUrl: String(response.uploadedSourceUrl || response.uploaded_source_url || '').trim(),
    sourceKind: String(response.sourceKind || response.kind || response.assetType || '').trim(),
    assetType: String(response.assetType || response.asset_type || '').trim(),
    taskId: String(response.taskId || response.task_id || '').trim(),
    checkedAt: String(response.checkedAt || response.checked_at || '').trim(),
    error: String(response.error || response.message || '').trim(),
  };
}
export function readApimartPrivateAvatarAsset(options = {}) {
  const value = options?.providerAssetRefs;
  return normalizeApimartPrivateAvatarAsset(
    value?.[APIMART_PRIVATE_AVATAR_ASSET_KEY] || options?.apimartPrivateAvatarAsset,
  );
}
export function isApimartPrivateAvatarAssetPassed(item) {
  const response2 = normalizeApimartPrivateAvatarAsset(item);
  return Boolean(response2?.assetUrl && (!response2.status || PASSED_STATUSES.has(response2.status)));
}
export function buildApimartPrivateAvatarPatch(options2 = {}, key = {}) {
  const apimartPrivateAvatarAsset = normalizeApimartPrivateAvatarAsset(key) || {};
  return {
    providerAssetRefs: {
      ...(options2?.providerAssetRefs || {}),
      [APIMART_PRIVATE_AVATAR_ASSET_KEY]: apimartPrivateAvatarAsset,
    },
  };
}
export function collectApimartPrivateAvatarProviderAssetRefs(
  options3 = {},
  { kind: kind = '', sourceUrl: sourceUrl = '', refSlot: refSlot = '', edgeId: edgeId = '' } = {},
) {
  const status2 = readApimartPrivateAvatarAsset(options3);
  if (!isApimartPrivateAvatarAssetPassed(status2)) return [];
  return [
    {
      provider: 'apimart',
      capability: APIMART_PRIVATE_AVATAR_CAPABILITY,
      status: status2.status || 'passed',
      assetUrl: status2.assetUrl,
      sourceUrl: String(sourceUrl || status2.sourceUrl || '').trim(),
      uploadedSourceUrl: String(status2.uploadedSourceUrl || '').trim(),
      sourceKind: String(kind || status2.sourceKind || '').trim(),
      assetType: String(status2.assetType || '').trim(),
      refSlot: String(refSlot || '').trim(),
      edgeId: String(edgeId || '').trim(),
      nodeId: String(options3?.id || '').trim(),
    },
  ];
}
export function appendApimartPrivateAvatarProviderAssetRefs(list, index, result = {}) {
  if (!Array.isArray(list)) return list;
  const apimartPrivateAvatarProviderAssetRefs = collectApimartPrivateAvatarProviderAssetRefs(index, result);
  for (const data of apimartPrivateAvatarProviderAssetRefs) {
    const target = [
        data.provider,
        data.capability,
        data.assetUrl,
        data.sourceUrl,
        data.sourceKind,
        data.refSlot,
        data.nodeId,
      ].join('|'),
      enabled = list.some(
        (item2) =>
          [
            item2.provider,
            item2.capability,
            item2.assetUrl,
            item2.sourceUrl,
            item2.sourceKind,
            item2.refSlot,
            item2.nodeId,
          ].join('|') === target,
      );
    if (!enabled) list.push(data);
  }
  return list;
}
