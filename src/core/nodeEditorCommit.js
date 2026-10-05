export const NODE_EDITOR_COMMIT_EVENT = 'node-editor-before-commit';
export function deferNodeEditorCommit(enabled, key, commit) {
  if (!enabled?.['dispatchEvent'] || typeof CustomEvent === 'undefined') return false;
  const customEvent = new CustomEvent(NODE_EDITOR_COMMIT_EVENT, {
    bubbles: true,
    cancelable: true,
    detail: { key: key, commit: commit },
  });
  return (enabled['dispatchEvent'](customEvent), customEvent['defaultPrevented']);
}
