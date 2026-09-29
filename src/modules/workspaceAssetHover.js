function normalizeText(_0x2a2df5) {
  return String(_0x2a2df5 ?? '')['trim']();
}
export function getWorkspaceAssetHoverCard(
  _0x486737,
  { selector: selector = '[data-workspace-asset-id], [data-workspace-asset-hover-id]' } = {},
) {
  const _0x2c6017 = normalizeText(selector);
  return _0x2c6017 ? _0x486737?.['closest']?.(_0x2c6017) || null : null;
}
export function getWorkspaceAssetHoverCardId(
  _0x1ca276,
  { datasetKeys: datasetKeys = ['workspaceAssetHoverId', 'workspaceAssetId'] } = {},
) {
  for (const _0x120ddc of Array['isArray'](datasetKeys) ? datasetKeys : []) {
    const _0x5ce3a7 = normalizeText(_0x1ca276?.['dataset']?.[_0x120ddc]);
    if (_0x5ce3a7) return _0x5ce3a7;
  }
  return '';
}
