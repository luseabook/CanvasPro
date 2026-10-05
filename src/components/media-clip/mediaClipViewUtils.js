import { toNumber } from './mediaClipUtils.js';
export const MEDIA_CLIP_WAVEFORM_WIDTH = 200;
export const MEDIA_CLIP_WAVEFORM_HEIGHT = 80;
export const MEDIA_CLIP_WAVEFORM_SAMPLES = 190;
const SVG_NS = 'http://www.w3.org/2000/svg';
export function makeButton(value, item, key) {
  const el = document.createElement('button');
  return (
    (el.type = 'button'),
    (el.className = value),
    (el.title = item),
    el.setAttribute('aria-label', item),
    (el.textContent = key),
    el
  );
}
export function iconButton(index, result, data) {
  const el2 = document.createElement('button');
  return (
    (el2.type = 'button'),
    (el2.className = index),
    (el2.title = result),
    el2.setAttribute('aria-label', result),
    (el2.innerHTML =
      '\n    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n      ' +
      data +
      '\n    </svg>\n  '),
    el2
  );
}
export function createConnectCursorIcon() {
  const el3 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  return (
    el3.setAttribute('class', 'media-clip-connect-icon'),
    el3.setAttribute('viewBox', '0 0 24 24'),
    el3.setAttribute('aria-hidden', 'true'),
    (el3.innerHTML =
      '\n    <path class="media-clip-connect-cursor" d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" />\n    <circle class="media-clip-connect-dot" cx="20" cy="20" r="2.5" />\n    <path class="media-clip-connect-line" d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3" />\n  '),
    el3
  );
}
export function createMediaClipSvgElement(options) {
  return document.createElementNS?.(SVG_NS, options) || document.createElement(options);
}
export function setMediaClipSvgClass(el4, target) {
  el4?.setAttribute?.('class', target);
  try {
    typeof el4?.className === 'string' && (el4.className = target);
  } catch {}
}
export function getMediaClipWaveformViewBox() {
  return '0 0 ' + MEDIA_CLIP_WAVEFORM_WIDTH + ' ' + MEDIA_CLIP_WAVEFORM_HEIGHT;
}
export function getMediaClipWaveformViewport(options2 = {}) {
  const count = Math.max(0, toNumber(options2.durationSec, 0), toNumber(options2.endSec, 0));
  if (!(count > 0)) return { widthPct: 100, marginLeftPct: 0 };
  const source = Math.max(0, Math.min(count, toNumber(options2.startSec, 0))),
    next = Math.max(source + 0.001, Math.min(count, toNumber(options2.endSec, count))),
    current = Math.max(0.001, next - source),
    entry = Math.max(1, count / current);
  return {
    widthPct: Math.round(entry * 100000) / 1000,
    marginLeftPct: Math.round((source / current) * 100000) / 1000,
  };
}
export function formatWaveformPct(record = 0) {
  const toNumber2 = toNumber(record, 0);
  if (Math.abs(toNumber2) < 0.001) return '0';
  return Number.isInteger(toNumber2) ? String(toNumber2) : toNumber2.toFixed(3);
}
export function fillFilmstripPlaceholder(el5, payload = 6) {
  if (!el5) return;
  (el5.classList.add('is-placeholder'), el5.replaceChildren());
  const handle = Math.max(1, Math.trunc(toNumber(payload, 6)));
  for (let state = 0; state < handle; state += 1) {
    const config = document.createElement('span');
    ((config.className = 'media-clip-filmstrip-frame'), el5.appendChild(config));
  }
}
