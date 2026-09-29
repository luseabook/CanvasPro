export function resolveWorkspaceLibraryContextSelection(_0x1cbf61, _0x778994, _0x4f6a0e = []) {
  return _0x778994 && _0x4f6a0e['includes'](_0x1cbf61) ? [..._0x4f6a0e] : [_0x1cbf61];
}
export function createWorkspaceAssetLibraryContextMenuItems({
  selectedCount: selectedCount = 0x0,
  selectionMode: selectionMode = ![],
  items: items = [],
} = {}) {
  return [
    {
      label: '加入到项目' + (selectionMode && selectedCount ? '\x20(' + selectedCount + ')' : ''),
      icon: 'folder-open',
      disabled: selectedCount === 0x0,
      subItems: items,
    },
  ];
}
