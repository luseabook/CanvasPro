export const NODE_EDITOR_COMMIT_EVENT = 'node-editor-before-commit';
export function deferNodeEditorCommit(_0x4868d2, _0x40785c, _0x277cc4) {
  if (!_0x4868d2?.['dispatchEvent'] || typeof CustomEvent === 'undefined') return ![];
  const _0x30251e = new CustomEvent(NODE_EDITOR_COMMIT_EVENT, {
    bubbles: !![],
    cancelable: !![],
    detail: { key: _0x40785c, commit: _0x277cc4 },
  });
  return (_0x4868d2['dispatchEvent'](_0x30251e), _0x30251e['defaultPrevented']);
}
