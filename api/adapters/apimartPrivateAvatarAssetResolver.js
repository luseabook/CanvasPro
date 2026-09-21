function normalizeInputList(_0x346653) {
  return Array.isArray(_0x346653)
    ? _0x346653.map((_0x1a25cb) => String(_0x1a25cb || '').trim()).filter(Boolean)
    : [];
}
function normalizeProviderAssetRefs(_0x42a666) {
  return Array.isArray(_0x42a666)
    ? _0x42a666.filter((_0x1d5348) => _0x1d5348 && typeof _0x1d5348 === 'object')
    : [];
}
function isApimartPrivateAvatarAssetUrl(_0x3caa27) {
  return /^asset:\/\//i.test(String(_0x3caa27 || '').trim());
}
function getUrlComparableTail(_0x4447e4) {
  const _0x5e3801 = String(_0x4447e4 || '').trim();
  if (!_0x5e3801) return '';
  try {
    return (
      decodeURIComponent(new URL(_0x5e3801, 'http://local.invalid').pathname)
        .split('/')
        .filter(Boolean)
        .pop() || ''
    );
  } catch {
    return _0x5e3801.split(/[?#]/, 1)[0].split(/[\\/]/).filter(Boolean).pop() || '';
  }
}
export function isApimartSeedance2PrivateAvatarModel(_0x34b4a8) {
  return ['doubao-seedance-2.0', 'doubao-seedance-2.0-fast'].includes(
    String(_0x34b4a8 || '')
      .trim()
      .toLowerCase(),
  );
}
export function supportsApimartPrivateAvatarAssets(_0x35ad2e, _0x4ccf35 = {}) {
  const _0xcbc70f = _0x4ccf35?.privateAvatarAssets;
  if (_0xcbc70f && _0xcbc70f.enabled === true) {
    const _0x273d22 = Array.isArray(_0xcbc70f.models)
      ? _0xcbc70f.models.map((_0x26a48c) =>
          String(_0x26a48c || '')
            .trim()
            .toLowerCase(),
        )
      : [];
    return _0x273d22.includes(
      String(_0x35ad2e || '')
        .trim()
        .toLowerCase(),
    );
  }
  return isApimartSeedance2PrivateAvatarModel(_0x35ad2e);
}
function findApimartPrivateAvatarAssetUrl(_0x643c49 = {}, _0x3d41f5 = '', _0x164725 = '') {
  const _0x198d71 = normalizeProviderAssetRefs(_0x643c49.providerAssetRefs),
    _0x2aa53a = String(_0x3d41f5 || '').trim(),
    _0x3369ec = String(_0x164725 || '')
      .trim()
      .toLowerCase(),
    _0x3035e7 = getUrlComparableTail(_0x2aa53a);
  for (const _0x4af307 of _0x198d71) {
    if (
      String(_0x4af307.provider || '')
        .trim()
        .toLowerCase() !== 'apimart'
    )
      continue;
    if (String(_0x4af307.capability || '').trim() !== 'seedance2PrivateAvatar') continue;
    const _0x298740 = String(_0x4af307.status || '')
      .trim()
      .toLowerCase();
    if (_0x298740 && _0x298740 !== 'passed' && _0x298740 !== 'active') continue;
    const _0x9a0c85 = String(_0x4af307.assetUrl || '').trim();
    if (!isApimartPrivateAvatarAssetUrl(_0x9a0c85)) continue;
    const _0x255db4 = String(_0x4af307.sourceKind || _0x4af307.kind || '')
      .trim()
      .toLowerCase();
    if (_0x3369ec && _0x255db4 && _0x255db4 !== _0x3369ec) continue;
    const _0x44237c = String(_0x4af307.sourceUrl || '').trim();
    if (_0x44237c && _0x2aa53a && _0x44237c !== _0x2aa53a) continue;
    return _0x9a0c85;
  }
  const _0x37d609 = [];
  for (const _0x13e640 of _0x198d71) {
    if (
      String(_0x13e640.provider || '')
        .trim()
        .toLowerCase() !== 'apimart'
    )
      continue;
    if (String(_0x13e640.capability || '').trim() !== 'seedance2PrivateAvatar') continue;
    const _0x3b913b = String(_0x13e640.status || '')
      .trim()
      .toLowerCase();
    if (_0x3b913b && _0x3b913b !== 'passed' && _0x3b913b !== 'active') continue;
    const _0x549775 = String(_0x13e640.assetUrl || '').trim();
    if (!isApimartPrivateAvatarAssetUrl(_0x549775)) continue;
    const _0x2142f2 = String(_0x13e640.sourceKind || _0x13e640.kind || '')
      .trim()
      .toLowerCase();
    if (_0x3369ec && _0x2142f2 && _0x2142f2 !== _0x3369ec) continue;
    const _0x1bee91 = getUrlComparableTail(_0x13e640.sourceUrl || _0x13e640.uploadedSourceUrl);
    if (_0x3035e7 && _0x1bee91 && _0x3035e7 === _0x1bee91) return _0x549775;
    if (!_0x2aa53a) _0x37d609.push(_0x549775);
  }
  return _0x37d609.length === 1 ? _0x37d609[0] : '';
}
export function applyApimartPrivateAvatarAssetsToUrls(
  _0x24e9c4,
  _0x138841 = {},
  { sourceKind: sourceKind = '', enabled: enabled = false } = {},
) {
  const _0x193b90 = normalizeInputList(_0x24e9c4);
  if (!enabled) return _0x193b90;
  return _0x193b90.map((_0x274631) => {
    const _0x3bd8c5 = findApimartPrivateAvatarAssetUrl(_0x138841, _0x274631, sourceKind);
    return _0x3bd8c5 || _0x274631;
  });
}
