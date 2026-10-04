import { getMediaElementCurrentSource } from '../services/desktopMediaBlobSource.js';
export function resolveNodeVideoElement(el, value = 0x0) {
  if (!el) return null;
  const item = Array['from'](el['querySelectorAll']('video')),
    key = Math['max'](0x0, Math['trunc'](Number(value) || 0x0));
  let enabled = null,
    enabled2 = null,
    enabled3 = null;
  for (const el2 of item) {
    if (!el2) continue;
    const index = Number(el2['dataset']?.['idx']),
      result =
        el2['classList']?.['contains']?.('video-player') === !![] ||
        (Number['isFinite'](index) && index === key),
      mediaElementCurrentSource = getMediaElementCurrentSource(el2);
    if (result && !enabled3) enabled3 = el2;
    if (mediaElementCurrentSource && (!enabled2 || result)) enabled2 = el2;
    const data = window['getComputedStyle'](el2);
    if (data['display'] === 'none' || data['visibility'] === 'hidden') continue;
    const count = Number(data['opacity']);
    if (Number['isFinite'](count) && count <= 0x0) continue;
    const box = el2['getBoundingClientRect']();
    if (!box['width'] || !box['height']) continue;
    if (!enabled) enabled = el2;
    if (mediaElementCurrentSource) return el2;
  }
  return enabled2 || enabled3 || enabled || item[0x0] || null;
}
