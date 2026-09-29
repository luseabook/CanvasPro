const DEFAULT_HINT_TTL_MS = 0x3e8;
let nodeDragCommitHintUntil = 0x0;
function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance['now'] === 'function')
    return performance['now']();
  return Date['now']();
}
export function markRendererNodeDragCommitHint(_0x5581b0 = DEFAULT_HINT_TTL_MS) {
  const _0x30b2ad = Math['max'](0x0, Number(_0x5581b0) || 0x0);
  nodeDragCommitHintUntil = nowMs() + _0x30b2ad;
}
export function consumeRendererNodeDragCommitHint() {
  if (nodeDragCommitHintUntil <= 0x0) return ![];
  if (nowMs() > nodeDragCommitHintUntil) return ((nodeDragCommitHintUntil = 0x0), ![]);
  return ((nodeDragCommitHintUntil = 0x0), !![]);
}
export function clearRendererCommitHints() {
  nodeDragCommitHintUntil = 0x0;
}
