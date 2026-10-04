export const COMMENT_NOTE_CONTENT_FORMAT = Object.freeze({ PLAIN: 'plain', MARKDOWN: 'markdown' });
export function normalizeCommentNoteContentFormat(value) {
  return value === COMMENT_NOTE_CONTENT_FORMAT.MARKDOWN
    ? COMMENT_NOTE_CONTENT_FORMAT.MARKDOWN
    : COMMENT_NOTE_CONTENT_FORMAT.PLAIN;
}
export function isCommentNoteMarkdown(item) {
  return normalizeCommentNoteContentFormat(item?.contentFormat) === COMMENT_NOTE_CONTENT_FORMAT.MARKDOWN;
}
