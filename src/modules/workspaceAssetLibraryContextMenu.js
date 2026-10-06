export function resolveWorkspaceLibraryContextSelection(value, item, list = []) {
  return item && list.includes(value) ? [...list] : [value];
}
export function createWorkspaceAssetLibraryContextMenuItems({
  selectedCount: selectedCount = 0,
  selectionMode: selectionMode = false,
  items: items = [],
} = {}) {
  return [
    {
      label: '加入到项目' + (selectionMode && selectedCount ? ' (' + selectedCount + ')' : ''),
      icon: 'folder-open',
      disabled: selectedCount === 0,
      subItems: items,
    },
  ];
}
