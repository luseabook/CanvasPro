export const MEDIA_CLIP_REVERSE_ICON_PATHS =
  '<path d="M5 5v14"/><path d="m11 8-6 4 6 4V8Z"/><path d="m19 8-6 4 6 4V8Z"/>';
function clamp(value, item, key) {
  return Math.max(item, Math.min(key, value));
}
export function resolveMediaClipReverseControlState({
  isReversed: isReversed = false,
  pending: pending = false,
} = {}) {
  const isReversed2 = isReversed === true,
    pending2 = pending === true;
  return {
    isReversed: isReversed2,
    pending: pending2,
    label: pending2 ? '视频倒放中' : isReversed2 ? '取消视频倒放' : '视频倒放',
    ariaPressed: String(isReversed2),
    ariaBusy: String(pending2),
  };
}
export function mirrorMediaClipRange({
  startSec: startSec = 0,
  endSec: endSec = 0,
  durationSec: durationSec = 0,
} = {}) {
  const startSec2 = Math.max(0, Number(durationSec) || 0);
  if (!(startSec2 > 0)) return { startSec: 0, endSec: 0 };
  const clamp2 = clamp(Number(startSec) || 0, 0, startSec2),
    clamp3 = clamp(Number(endSec) || 0, clamp2, startSec2);
  return { startSec: startSec2 - clamp3, endSec: startSec2 - clamp2 };
}
export function renderMediaClipReverseIcon({
  className: className = '',
  strokeWidth: strokeWidth = 1.7,
} = {}) {
  const index = String(className || '').trim(),
    result = index ? ' class="' + index + '"' : '';
  return (
    '<svg' +
    result +
    ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
    (Number(strokeWidth) || 1.7) +
    '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    MEDIA_CLIP_REVERSE_ICON_PATHS +
    '</svg>'
  );
}
