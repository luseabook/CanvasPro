const DEFAULT_HINT_TTL_MS = 1000;
let nodeDragCommitHintUntil = 0;
function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance['now'] === 'function')
    return performance['now']();
  return Date['now']();
}
export function markRendererNodeDragCommitHint(value = DEFAULT_HINT_TTL_MS) {
  const item = Math['max'](0, Number(value) || 0);
  nodeDragCommitHintUntil = nowMs() + item;
}
export function consumeRendererNodeDragCommitHint() {
  if (nodeDragCommitHintUntil <= 0) return false;
  if (nowMs() > nodeDragCommitHintUntil) return ((nodeDragCommitHintUntil = 0), false);
  return ((nodeDragCommitHintUntil = 0), true);
}
export function clearRendererCommitHints() {
  nodeDragCommitHintUntil = 0;
}
