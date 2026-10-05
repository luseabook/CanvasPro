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
  if (nodeDragCommitHintUntil <= 0) return ![];
  if (nowMs() > nodeDragCommitHintUntil) return ((nodeDragCommitHintUntil = 0), ![]);
  return ((nodeDragCommitHintUntil = 0), !![]);
}
export function clearRendererCommitHints() {
  nodeDragCommitHintUntil = 0;
}
