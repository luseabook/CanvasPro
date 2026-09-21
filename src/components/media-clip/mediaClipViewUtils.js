import { toNumber } from './mediaClipUtils.js';
export const MEDIA_CLIP_WAVEFORM_WIDTH = 200;
export const MEDIA_CLIP_WAVEFORM_HEIGHT = 80;
export const MEDIA_CLIP_WAVEFORM_SAMPLES = 190;
const SVG_NS = 'http://www.w3.org/2000/svg';
export function makeButton(_0x20e8ea, _0x521bbd, _0x1100e1) {
  const _0x327959 = document.createElement('button');
  return (
    (_0x327959.type = 'button'),
    (_0x327959.className = _0x20e8ea),
    (_0x327959.title = _0x521bbd),
    _0x327959.setAttribute('aria-label', _0x521bbd),
    (_0x327959.textContent = _0x1100e1),
    _0x327959
  );
}
export function iconButton(_0x55ae10, _0x4208b1, _0x935149) {
  const _0x19dc4d = document.createElement('button');
  return (
    (_0x19dc4d.type = 'button'),
    (_0x19dc4d.className = _0x55ae10),
    (_0x19dc4d.title = _0x4208b1),
    _0x19dc4d.setAttribute('aria-label', _0x4208b1),
    (_0x19dc4d.innerHTML =
      '\n    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n      ' +
      _0x935149 +
      '\n    </svg>\n  '),
    _0x19dc4d
  );
}
export function createConnectCursorIcon() {
  const _0x49f881 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  return (
    _0x49f881.setAttribute('class', 'media-clip-connect-icon'),
    _0x49f881.setAttribute('viewBox', '0 0 24 24'),
    _0x49f881.setAttribute('aria-hidden', 'true'),
    (_0x49f881.innerHTML =
      '\n    <path class="media-clip-connect-cursor" d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" />\n    <circle class="media-clip-connect-dot" cx="20" cy="20" r="2.5" />\n    <path class="media-clip-connect-line" d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3" />\n  '),
    _0x49f881
  );
}
export function createMediaClipSvgElement(_0x147626) {
  return document.createElementNS?.(SVG_NS, _0x147626) || document.createElement(_0x147626);
}
export function setMediaClipSvgClass(_0x1fc232, _0x5f0abe) {
  _0x1fc232?.setAttribute?.('class', _0x5f0abe);
  try {
    typeof _0x1fc232?.className === 'string' && (_0x1fc232.className = _0x5f0abe);
  } catch {}
}
export function getMediaClipWaveformViewBox() {
  return '0 0 ' + MEDIA_CLIP_WAVEFORM_WIDTH + ' ' + MEDIA_CLIP_WAVEFORM_HEIGHT;
}
export function getMediaClipWaveformViewport(_0x4445dd = {}) {
  const _0x453f1b = Math.max(0, toNumber(_0x4445dd.durationSec, 0), toNumber(_0x4445dd.endSec, 0));
  if (!(_0x453f1b > 0)) return { widthPct: 100, marginLeftPct: 0 };
  const _0x37821f = Math.max(0, Math.min(_0x453f1b, toNumber(_0x4445dd.startSec, 0))),
    _0x307ddc = Math.max(_0x37821f + 0.001, Math.min(_0x453f1b, toNumber(_0x4445dd.endSec, _0x453f1b))),
    _0x353b7e = Math.max(0.001, _0x307ddc - _0x37821f),
    _0x3661db = Math.max(1, _0x453f1b / _0x353b7e);
  return {
    widthPct: Math.round(_0x3661db * 0x186a0) / 0x3e8,
    marginLeftPct: Math.round((_0x37821f / _0x353b7e) * 0x186a0) / 0x3e8,
  };
}
export function formatWaveformPct(_0x6efb92 = 0) {
  const _0x4fee96 = toNumber(_0x6efb92, 0);
  if (Math.abs(_0x4fee96) < 0.001) return '0';
  return Number.isInteger(_0x4fee96) ? String(_0x4fee96) : _0x4fee96.toFixed(3);
}
export function fillFilmstripPlaceholder(_0x50585e, _0x20f796 = 6) {
  if (!_0x50585e) return;
  (_0x50585e.classList.add('is-placeholder'), _0x50585e.replaceChildren());
  const _0x528e53 = Math.max(1, Math.trunc(toNumber(_0x20f796, 6)));
  for (let _0x1fe9ee = 0; _0x1fe9ee < _0x528e53; _0x1fe9ee += 1) {
    const _0x31d184 = document.createElement('span');
    ((_0x31d184.className = 'media-clip-filmstrip-frame'), _0x50585e.appendChild(_0x31d184));
  }
}
