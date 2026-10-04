export function containWorkspaceContextMenu(event) {
  if (!event) return ![];
  return (event['preventDefault']?.(), event['stopPropagation']?.(), !![]);
}
