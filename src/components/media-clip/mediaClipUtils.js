export function normalizeText(value) {
  return String(value || '').trim();
}
export function firstNonEmpty(...args) {
  for (const item of args) {
    const text = normalizeText(item);
    if (text) return text;
  }
  return '';
}
export function toNumber(key, index = 0) {
  const result = Number(key);
  return Number.isFinite(result) ? result : index;
}
export function parsePercentValue(data, options = NaN) {
  const list = String(data ?? '').trim();
  if (!list) return options;
  const target = list.endsWith('%') ? list.slice(0, -1) : list,
    source = Number(target);
  return Number.isFinite(source) ? source : options;
}
export function readLayoutWidthPx(el, next = 0) {
  const toNumber2 = toNumber(el?.offsetWidth, 0);
  if (toNumber2 > 0) return toNumber2;
  const toNumber3 = toNumber(el?.clientWidth, 0);
  if (toNumber3 > 0) return toNumber3;
  const count = Number.parseFloat(String(el?.style?.width || ''));
  if (Number.isFinite(count) && count > 0) return count;
  return toNumber(el?.getBoundingClientRect?.().width, next);
}
export function formatTime(current) {
  const entry = Math.max(0, toNumber(current, 0)),
    record = Math.floor(entry / 60),
    payload = Math.floor(entry % 60);
  return String(record).padStart(2, '0') + ':' + String(payload).padStart(2, '0');
}
export function formatDurationLabel(handle) {
  const state = Math.max(0, toNumber(handle, 0));
  return state.toFixed(2) + 's';
}
export function isSameMediaClipState(config, scope) {
  return JSON.stringify(config || null) === JSON.stringify(scope || null);
}
export function getTrackDuration(input) {
  return Math.max(0.1, toNumber(input?.durationSec || input?.endSec, 0.1));
}
export function stopPointer(event) {
  if (!event) return;
  (event.preventDefault?.(), event.stopPropagation?.());
}
