export function containWorkspaceContextMenu(event) {
  if (!event) return false;
  return (event['preventDefault']?.(), event['stopPropagation']?.(), true);
}
