function normalizeInputList(list) {
  return Array.isArray(list) ? list.map((item) => String(item || '').trim()).filter(Boolean) : [];
}
function normalizeProviderAssetRefs(list2) {
  return Array.isArray(list2) ? list2.filter((item2) => item2 && typeof item2 === 'object') : [];
}
function isApimartPrivateAvatarAssetUrl(value) {
  return /^asset:\/\//i.test(String(value || '').trim());
}
function getUrlComparableTail(key) {
  const enabled2 = String(key || '').trim();
  if (!enabled2) return '';
  try {
    return (
      decodeURIComponent(new URL(enabled2, 'http://local.invalid').pathname)
        .split('/')
        .filter(Boolean)
        .pop() || ''
    );
  } catch {
    return enabled2.split(/[?#]/, 1)[0].split(/[\\/]/).filter(Boolean).pop() || '';
  }
}
export function isApimartSeedance2PrivateAvatarModel(index) {
  return ['doubao-seedance-2.0', 'doubao-seedance-2.0-fast'].includes(
    String(index || '')
      .trim()
      .toLowerCase(),
  );
}
export function supportsApimartPrivateAvatarAssets(result, data = {}) {
  const options = data?.privateAvatarAssets;
  if (options && options.enabled === true) {
    const list3 = Array.isArray(options.models)
      ? options.models.map((item3) =>
          String(item3 || '')
            .trim()
            .toLowerCase(),
        )
      : [];
    return list3.includes(
      String(result || '')
        .trim()
        .toLowerCase(),
    );
  }
  return isApimartSeedance2PrivateAvatarModel(result);
}
function findApimartPrivateAvatarAssetUrl(options2 = {}, target = '', source = '') {
  const providerAssetRefs = normalizeProviderAssetRefs(options2.providerAssetRefs),
    enabled3 = String(target || '').trim(),
    next = String(source || '')
      .trim()
      .toLowerCase(),
    urlComparableTail = getUrlComparableTail(enabled3);
  for (const response of providerAssetRefs) {
    if (
      String(response.provider || '')
        .trim()
        .toLowerCase() !== 'apimart'
    )
      continue;
    if (String(response.capability || '').trim() !== 'seedance2PrivateAvatar') continue;
    const current = String(response.status || '')
      .trim()
      .toLowerCase();
    if (current && current !== 'passed' && current !== 'active') continue;
    const entry = String(response.assetUrl || '').trim();
    if (!isApimartPrivateAvatarAssetUrl(entry)) continue;
    const record = String(response.sourceKind || response.kind || '')
      .trim()
      .toLowerCase();
    if (next && record && record !== next) continue;
    const payload = String(response.sourceUrl || '').trim();
    if (payload && enabled3 && payload !== enabled3) continue;
    return entry;
  }
  const list4 = [];
  for (const response2 of providerAssetRefs) {
    if (
      String(response2.provider || '')
        .trim()
        .toLowerCase() !== 'apimart'
    )
      continue;
    if (String(response2.capability || '').trim() !== 'seedance2PrivateAvatar') continue;
    const handle = String(response2.status || '')
      .trim()
      .toLowerCase();
    if (handle && handle !== 'passed' && handle !== 'active') continue;
    const state = String(response2.assetUrl || '').trim();
    if (!isApimartPrivateAvatarAssetUrl(state)) continue;
    const config = String(response2.sourceKind || response2.kind || '')
      .trim()
      .toLowerCase();
    if (next && config && config !== next) continue;
    const urlComparableTail2 = getUrlComparableTail(response2.sourceUrl || response2.uploadedSourceUrl);
    if (urlComparableTail && urlComparableTail2 && urlComparableTail === urlComparableTail2) return state;
    if (!enabled3) list4.push(state);
  }
  return list4.length === 1 ? list4[0] : '';
}
export function applyApimartPrivateAvatarAssetsToUrls(
  scope,
  input = {},
  { sourceKind: sourceKind = '', enabled: enabled = false } = {},
) {
  const list5 = normalizeInputList(scope);
  if (!enabled) return list5;
  return list5.map((item4) => {
    const apimartPrivateAvatarAssetUrl = findApimartPrivateAvatarAssetUrl(input, item4, sourceKind);
    return apimartPrivateAvatarAssetUrl || item4;
  });
}
