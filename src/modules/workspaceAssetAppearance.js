function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function getWorkspaceAssetAppearances(options = {}) {
  return Array['isArray'](options?.['appearances']) ? options['appearances'] : [];
}
export function getWorkspaceAssetAppearance(options2 = {}, item = 0x0) {
  const list = getWorkspaceAssetAppearances(options2);
  if (!list['length']) return null;
  const key = Math['max'](0x0, Math['min'](list['length'] - 0x1, Math['trunc'](Number(item) || 0x0)));
  return list[key] || null;
}
export function getWorkspaceAssetBaseAppearance(options3 = {}) {
  const text = normalizeText(options3?.['baseAppearanceId']);
  if (!text) return null;
  return (
    getWorkspaceAssetAppearances(options3)['find']((index) => normalizeText(index?.['id']) === text) || null
  );
}
export function getWorkspaceAssetAppearanceStats(options4 = {}) {
  const total = getWorkspaceAssetAppearances(options4),
    generated = total['filter']((result) => normalizeText(result?.['imageUrl']))['length'],
    failed = total['filter']((data) => !normalizeText(data?.['imageUrl']) && normalizeText(data?.['error']))[
      'length'
    ];
  return {
    total: total['length'],
    generated: generated,
    failed: failed,
    pending: Math['max'](0x0, total['length'] - generated - failed),
  };
}
