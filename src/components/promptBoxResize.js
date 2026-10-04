const PROMPT_BOX_MIN_HEIGHT = 96,
  PROMPT_BOX_MAX_HEIGHT = 0x208;
function toNumberOrNull(value) {
  const item = Number(value);
  return Number.isFinite(item) ? item : null;
}
function clamp(key, index, result) {
  return Math.min(result, Math.max(index, key));
}
export function getPromptBoxHeightBounds() {
  return { minHeight: PROMPT_BOX_MIN_HEIGHT, maxHeight: PROMPT_BOX_MAX_HEIGHT };
}
export function normalizePromptBoxHeight(data, options) {
  const toNumberOrNull2 = toNumberOrNull(data);
  if (toNumberOrNull2 == null) return null;
  return Math.round(clamp(toNumberOrNull2, options.minHeight, options.maxHeight));
}
export function applyPromptBoxHeight(el, target) {
  if (!el) return;
  if (target == null) el.style.removeProperty('height');
  else el.style.height = target + 'px';
}
