function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function getWorkspaceAssetHoverCard(
  item,
  { selector: selector = '[data-workspace-asset-id], [data-workspace-asset-hover-id]' } = {},
) {
  const text = normalizeText(selector);
  return text ? item?.['closest']?.(text) || null : null;
}
export function getWorkspaceAssetHoverCardId(
  key,
  { datasetKeys: datasetKeys = ['workspaceAssetHoverId', 'workspaceAssetId'] } = {},
) {
  for (const index of Array['isArray'](datasetKeys) ? datasetKeys : []) {
    const text2 = normalizeText(key?.['dataset']?.[index]);
    if (text2) return text2;
  }
  return '';
}
