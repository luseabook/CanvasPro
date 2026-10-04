export function resolveWorkspaceLibraryContextSelection(value, item, list = []) {
  return item && list['includes'](value) ? [...list] : [value];
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
