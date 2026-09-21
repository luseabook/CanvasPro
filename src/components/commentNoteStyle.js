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
export function normalizeCommentNoteStyle(_0x2dedee = {}) {
  const _0x23467e = {
      ...createDefaultCommentNoteStyle(),
      ...(_0x2dedee && typeof _0x2dedee === 'object' ? _0x2dedee : {}),
    },
    _0x39c597 = Number(_0x23467e.fontSize);
  _0x23467e.fontSize = Number.isFinite(_0x39c597) ? Math.min(56, Math.max(14, _0x39c597)) : 24;
  const _0x5b96a6 = Number(_0x23467e.strokeWidth);
  return (
    (_0x23467e.strokeWidth = Number.isFinite(_0x5b96a6) ? Math.min(6, Math.max(0, _0x5b96a6)) : 0),
    (_0x23467e.writingMode = 'horizontal'),
    !COMMENT_NOTE_TEXT_COLOR_MAP[_0x23467e.textColor] && (_0x23467e.textColor = 'white'),
    !COMMENT_NOTE_BACKGROUND_COLOR_MAP[_0x23467e.backgroundColor] &&
      (_0x23467e.backgroundColor = 'transparent'),
    !COMMENT_NOTE_STROKE_COLOR_MAP[_0x23467e.strokeColor] && (_0x23467e.strokeColor = 'canvas-white'),
    _0x23467e
  );
}
