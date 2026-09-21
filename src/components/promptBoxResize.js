const PROMPT_BOX_MIN_HEIGHT = 96,
  PROMPT_BOX_MAX_HEIGHT = 0x208;
function toNumberOrNull(_0x2686da) {
  const _0x4d157a = Number(_0x2686da);
  return Number.isFinite(_0x4d157a) ? _0x4d157a : null;
}
function clamp(_0x5ab8a5, _0x1f0104, _0x31447b) {
  return Math.min(_0x31447b, Math.max(_0x1f0104, _0x5ab8a5));
}
export function getPromptBoxHeightBounds() {
  return { minHeight: PROMPT_BOX_MIN_HEIGHT, maxHeight: PROMPT_BOX_MAX_HEIGHT };
}
export function normalizePromptBoxHeight(_0x2488bd, _0x3f4f15) {
  const _0x416032 = toNumberOrNull(_0x2488bd);
  if (_0x416032 == null) return null;
  return Math.round(clamp(_0x416032, _0x3f4f15.minHeight, _0x3f4f15.maxHeight));
}
export function applyPromptBoxHeight(_0x1a609c, _0x456c84) {
  if (!_0x1a609c) return;
  if (_0x456c84 == null) _0x1a609c.style.removeProperty('height');
  else _0x1a609c.style.height = _0x456c84 + 'px';
}
