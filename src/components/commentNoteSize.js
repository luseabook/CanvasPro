export const COMMENT_NOTE_MIN_HEIGHT = 90;
export function normalizeCommentNoteAutoHeight(_0xf7e554) {
  const _0x21aa2e = Number(_0xf7e554);
  if (!Number.isFinite(_0x21aa2e)) return COMMENT_NOTE_MIN_HEIGHT;
  return Math.max(COMMENT_NOTE_MIN_HEIGHT, _0x21aa2e);
}
export function buildCommentNoteContentPatch({
  content: _0x25cbaf,
  measuredHeight: _0x354b33,
  currentHeight: _0x33326a,
  allowShrink: allowShrink = false,
} = {}) {
  const _0x261be3 = { content: String(_0x25cbaf ?? '') },
    _0x490841 = normalizeCommentNoteAutoHeight(_0x354b33),
    _0x5cf076 = Number(_0x33326a),
    _0x45ada1 = Number.isFinite(_0x5cf076) ? _0x5cf076 : COMMENT_NOTE_MIN_HEIGHT,
    _0x2ff23e = allowShrink ? Math.abs(_0x490841 - _0x45ada1) >= 1 : _0x490841 > _0x45ada1 + 1;
  return (_0x2ff23e && (_0x261be3.height = _0x490841), _0x261be3);
}
