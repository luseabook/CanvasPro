export const COMMENT_NOTE_TEXT_COLOR_MAP = {
  white: 'var(--canvas-white)',
  red: 'var(--red)',
  orange: 'var(--gold)',
  yellow: 'var(--warning-text)',
  green: 'var(--green)',
  blue: 'var(--blue)',
  purple: 'var(--purple)',
  cyan: 'var(--cyan)',
  pink: 'var(--group-pink)',
  gray: 'var(--group-slate)',
};
export const COMMENT_NOTE_BACKGROUND_COLOR_MAP = {
  transparent: 'transparent',
  white: 'var(--white-10)',
  red: 'var(--red-15)',
  orange: 'var(--gold-15)',
  yellow: 'var(--warning-bg)',
  green: 'var(--green-15)',
  blue: 'var(--blue-15)',
  purple: 'var(--purple-20)',
  cyan: 'var(--cyan-15)',
  pink: 'var(--group-pink-05)',
  gray: 'var(--group-slate-05)',
};
export const COMMENT_NOTE_STROKE_COLOR_MAP = {
  'canvas-white': 'var(--canvas-white)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  red: 'var(--red)',
  indigo: 'var(--indigo-text)',
  black: 'var(--black-90)',
};
export function createDefaultCommentNoteStyle() {
  return {
    fontSize: 24,
    textColor: 'white',
    backgroundColor: 'transparent',
    strokeColor: 'canvas-white',
    strokeWidth: 0,
    writingMode: 'horizontal',
  };
}
export function normalizeCommentNoteStyle(options = {}) {
  const value = {
      ...createDefaultCommentNoteStyle(),
      ...(options && typeof options === 'object' ? options : {}),
    },
    item = Number(value.fontSize);
  value.fontSize = Number.isFinite(item) ? Math.min(56, Math.max(14, item)) : 24;
  const key = Number(value.strokeWidth);
  return (
    (value.strokeWidth = Number.isFinite(key) ? Math.min(6, Math.max(0, key)) : 0),
    (value.writingMode = 'horizontal'),
    !COMMENT_NOTE_TEXT_COLOR_MAP[value.textColor] && (value.textColor = 'white'),
    !COMMENT_NOTE_BACKGROUND_COLOR_MAP[value.backgroundColor] && (value.backgroundColor = 'transparent'),
    !COMMENT_NOTE_STROKE_COLOR_MAP[value.strokeColor] && (value.strokeColor = 'canvas-white'),
    value
  );
}
