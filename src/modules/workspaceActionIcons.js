const WORKSPACE_ACTION_ICON_PATHS = Object.freeze({
  generate:
    '<path d="m4 20 11-11 3 3L7 23z" transform="translate(0 -2)"/><path d="M16 2v4m-2-2h4M6 3v4M4 5h4M20 15v4m-2-2h4"/>',
  addToLibrary:
    '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><path d="M17 14v6m-3-3h6"/>',
  confirm: '<path d="m5 12 4 4L19 6"/>',
  delete: '<path d="m6 6 12 12M18 6 6 18"/>',
  unlink:
    '<path d="m9 15-2 2a3.5 3.5 0 0 1-5-5l3-3m10 0 2-2a3.5 3.5 0 0 1 5 5l-3 3M3 3l18 18M9 3v3M3 9h3m12 6h3m-6 3v3"/>',
  keyframe:
    '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H9l1.5-2h3L15 6h2.5A2.5 2.5 0 0 1 20 8.5v7A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5z"/><circle cx="12" cy="12" r="3"/>',
  results:
    '<path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/>',
  split: '<path d="M8 18V6m0 0L5 9m3-3 3 3M16 6v12m0 0-3-3m3 3 3-3"/>',
  upload: '<path d="M12 15V4m0 0L8 8m4-4 4 4"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
});
export function renderWorkspaceActionIcon(value) {
  const item = Object.hasOwn(WORKSPACE_ACTION_ICON_PATHS, value) ? value : 'confirm';
  return (
    '<svg class="story-action-icon story-' +
    item +
    '-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    WORKSPACE_ACTION_ICON_PATHS[item] +
    '</g></svg>'
  );
}
export function renderWorkspaceConfirmIcon() {
  return renderWorkspaceActionIcon('confirm');
}
export function renderWorkspaceDeleteIcon() {
  return renderWorkspaceActionIcon('delete');
}
export function renderWorkspaceSplitIcon() {
  return renderWorkspaceActionIcon('split');
}
export function renderWorkspaceKeyframeIcon() {
  return renderWorkspaceActionIcon('keyframe');
}
export function renderWorkspaceUploadIcon() {
  return renderWorkspaceActionIcon('upload');
}
export function renderWorkspaceAddToLibraryIcon() {
  return renderWorkspaceActionIcon('addToLibrary');
}
