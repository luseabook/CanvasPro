export const COMMENT_NOTE_MIN_HEIGHT = 90;
export function normalizeCommentNoteAutoHeight(value) {
  const item = Number(value);
  if (!Number.isFinite(item)) return COMMENT_NOTE_MIN_HEIGHT;
  return Math.max(COMMENT_NOTE_MIN_HEIGHT, item);
}
export function buildCommentNoteContentPatch({
  content: content,
  measuredHeight: measuredHeight,
  currentHeight: currentHeight,
  allowShrink: allowShrink = false,
} = {}) {
  const box = { content: String(content ?? '') },
    commentNoteAutoHeight = normalizeCommentNoteAutoHeight(measuredHeight),
    key = Number(currentHeight),
    index = Number.isFinite(key) ? key : COMMENT_NOTE_MIN_HEIGHT,
    result = allowShrink ? Math.abs(commentNoteAutoHeight - index) >= 1 : commentNoteAutoHeight > index + 1;
  return (result && (box.height = commentNoteAutoHeight), box);
}
