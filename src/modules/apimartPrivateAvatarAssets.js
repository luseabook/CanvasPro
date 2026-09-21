export const APIMART_PRIVATE_AVATAR_ASSET_KEY = 'apimartSeedance2PrivateAvatar';
export const APIMART_PRIVATE_AVATAR_CAPABILITY = 'seedance2PrivateAvatar';
const PASSED_STATUSES = new Set(['passed', 'active', 'completed', 'success']);
export function normalizeApimartPrivateAvatarAsset(_0x2ce7e3 = {}) {
  if (!_0x2ce7e3 || typeof _0x2ce7e3 !== 'object' || Array.isArray(_0x2ce7e3)) return null;
  const _0x466d17 = String(_0x2ce7e3.status || '')
      .trim()
      .toLowerCase(),
    _0x233da9 = String(_0x2ce7e3.assetUrl || _0x2ce7e3.asset_url || _0x2ce7e3.url || '').trim();
  return {
    provider: 'apimart',
    capability: APIMART_PRIVATE_AVATAR_CAPABILITY,
    status: _0x466d17,
    assetUrl: _0x233da9,
    sourceUrl: String(_0x2ce7e3.sourceUrl || _0x2ce7e3.source_url || '').trim(),
    uploadedSourceUrl: String(_0x2ce7e3.uploadedSourceUrl || _0x2ce7e3.uploaded_source_url || '').trim(),
    sourceKind: String(_0x2ce7e3.sourceKind || _0x2ce7e3.kind || _0x2ce7e3.assetType || '').trim(),
    assetType: String(_0x2ce7e3.assetType || _0x2ce7e3.asset_type || '').trim(),
    taskId: String(_0x2ce7e3.taskId || _0x2ce7e3.task_id || '').trim(),
    checkedAt: String(_0x2ce7e3.checkedAt || _0x2ce7e3.checked_at || '').trim(),
    error: String(_0x2ce7e3.error || _0x2ce7e3.message || '').trim(),
  };
}
export function readApimartPrivateAvatarAsset(_0x3bf51e = {}) {
  const _0x3636cc = _0x3bf51e?.providerAssetRefs;
  return normalizeApimartPrivateAvatarAsset(
    _0x3636cc?.[APIMART_PRIVATE_AVATAR_ASSET_KEY] || _0x3bf51e?.apimartPrivateAvatarAsset,
  );
}
export function isApimartPrivateAvatarAssetPassed(_0x5bc4b8) {
  const _0x4e2fc9 = normalizeApimartPrivateAvatarAsset(_0x5bc4b8);
  return Boolean(_0x4e2fc9?.assetUrl && (!_0x4e2fc9.status || PASSED_STATUSES.has(_0x4e2fc9.status)));
}
export function buildApimartPrivateAvatarPatch(_0x96c0ae = {}, _0x27ae0c = {}) {
  const _0x7c4e35 = normalizeApimartPrivateAvatarAsset(_0x27ae0c) || {};
  return {
    providerAssetRefs: {
      ...(_0x96c0ae?.providerAssetRefs || {}),
      [APIMART_PRIVATE_AVATAR_ASSET_KEY]: _0x7c4e35,
    },
  };
}
export function collectApimartPrivateAvatarProviderAssetRefs(
  _0x2f9f30 = {},
  { kind: kind = '', sourceUrl: sourceUrl = '', refSlot: refSlot = '', edgeId: edgeId = '' } = {},
) {
  const _0x3fc1d8 = readApimartPrivateAvatarAsset(_0x2f9f30);
  if (!isApimartPrivateAvatarAssetPassed(_0x3fc1d8)) return [];
  return [
    {
      provider: 'apimart',
      capability: APIMART_PRIVATE_AVATAR_CAPABILITY,
      status: _0x3fc1d8.status || 'passed',
      assetUrl: _0x3fc1d8.assetUrl,
      sourceUrl: String(sourceUrl || _0x3fc1d8.sourceUrl || '').trim(),
      uploadedSourceUrl: String(_0x3fc1d8.uploadedSourceUrl || '').trim(),
      sourceKind: String(kind || _0x3fc1d8.sourceKind || '').trim(),
      assetType: String(_0x3fc1d8.assetType || '').trim(),
      refSlot: String(refSlot || '').trim(),
      edgeId: String(edgeId || '').trim(),
      nodeId: String(_0x2f9f30?.id || '').trim(),
    },
  ];
}
export function appendApimartPrivateAvatarProviderAssetRefs(_0x191097, _0x9b3405, _0x70d737 = {}) {
  if (!Array.isArray(_0x191097)) return _0x191097;
  const _0x21f9dc = collectApimartPrivateAvatarProviderAssetRefs(_0x9b3405, _0x70d737);
  for (const _0x2cba61 of _0x21f9dc) {
    const _0x5ea5cf = [
        _0x2cba61.provider,
        _0x2cba61.capability,
        _0x2cba61.assetUrl,
        _0x2cba61.sourceUrl,
        _0x2cba61.sourceKind,
        _0x2cba61.refSlot,
        _0x2cba61.nodeId,
      ].join('|'),
      _0x27e67d = _0x191097.some(
        (_0x2ceaaa) =>
          [
            _0x2ceaaa.provider,
            _0x2ceaaa.capability,
            _0x2ceaaa.assetUrl,
            _0x2ceaaa.sourceUrl,
            _0x2ceaaa.sourceKind,
            _0x2ceaaa.refSlot,
            _0x2ceaaa.nodeId,
          ].join('|') === _0x5ea5cf,
      );
    if (!_0x27e67d) _0x191097.push(_0x2cba61);
  }
  return _0x191097;
}
