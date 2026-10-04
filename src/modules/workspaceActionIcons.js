const WORKSPACE_ACTION_ICON_PATHS = Object['freeze']({
  generate:
    '<path d="m4 20 11-11 3 3L7 23z" transform="translate(0 -2)"/><path d="M16 2v4m-2-2h4M6 3v4M4 5h4M20 15v4m-2-2h4"/>',
  addToLibrary:
    '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><path d="M17 14v6m-3-3h6"/>',
  confirm: '<path d="m5 12 4 4L19 6"/>',
  delete: '<path\x20d=\x22m6\x206\x2012\x2012M18\x206\x206\x2018\x22/>',
  unlink:
    '<path d="m9 15-2 2a3.5 3.5 0 0 1-5-5l3-3m10 0 2-2a3.5 3.5 0 0 1 5 5l-3 3M3 3l18 18M9 3v3M3 9h3m12 6h3m-6 3v3"/>',
  keyframe:
    '<path\x20d=\x22M4\x208.5A2.5\x202.5\x200\x200\x201\x206.5\x206H9l1.5-2h3L15\x206h2.5A2.5\x202.5\x200\x200\x201\x2020\x208.5v7A2.5\x202.5\x200\x200\x201\x2017.5\x2018h-11A2.5\x202.5\x200\x200\x201\x204\x2015.5z\x22/><circle\x20cx=\x2212\x22\x20cy=\x2212\x22\x20r=\x223\x22/>',
  results:
    '<path\x20d=\x22m12\x203\x208\x204-8\x204-8-4\x208-4Z\x22/><path\x20d=\x22m4\x2012\x208\x204\x208-4M4\x2017l8\x204\x208-4\x22/>',
  split: '<path\x20d=\x22M8\x2018V6m0\x200L5\x209m3-3\x203\x203M16\x206v12m0\x200-3-3m3\x203\x203-3\x22/>',
  upload: '<path d="M12 15V4m0 0L8 8m4-4 4 4"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
});
export function renderWorkspaceActionIcon(value) {
  const item = Object['hasOwn'](WORKSPACE_ACTION_ICON_PATHS, value) ? value : 'confirm';
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
