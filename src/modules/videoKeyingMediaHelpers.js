import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
export function getVideoElementSource(value) {
  return String(value?.getAttribute?.('src') || value?.currentSrc || value?.src || '').trim();
}
export function setVideoKeyingMediaKeepAlive(el, item) {
  if (!el?.dataset) return;
  if (item) {
    el.dataset.desktopMediaKeepAlive = 'video-keying';
    return;
  }
  el.dataset.desktopMediaKeepAlive === 'video-keying' && delete el.dataset.desktopMediaKeepAlive;
}
export async function attachVideoKeyingPlaybackSource(enabled, key, preload = 'metadata') {
  const enabled2 = String(key || '').trim();
  if (!enabled || !enabled2) return false;
  return (
    await attachMediaElementPlaybackSource(enabled, enabled2, { preload: preload }),
    !!getVideoElementSource(enabled)
  );
}
function seekTo(el2, index) {
  return new Promise((handler, handler2) => {
    let result = false;
    const run = () => {
        (el2.removeEventListener('seeked', data), el2.removeEventListener('error', options));
      },
      data = () => {
        if (result) return;
        ((result = true), run(), handler());
      },
      options = () => {
        if (result) return;
        ((result = true), run(), handler2(new Error('video seek error')));
      };
    (el2.addEventListener('seeked', data),
      el2.addEventListener('error', options),
      (el2.currentTime = Math.max(0, index)));
  });
}
function waitForLoadedMetadata(el3) {
  return new Promise((handler3, handler4) => {
    const target = () => handler3(),
      source = () => handler4(new Error('video load error'));
    (el3.addEventListener('loadedmetadata', target, { once: true }),
      el3.addEventListener('error', source, { once: true }));
  });
}
export async function renderVideoKeyingThumbs({
  src: src,
  thumbs: thumbs,
  token: token,
  isCurrent: isCurrent,
  readDurationSec: readDurationSec,
  onDuration: onDuration,
}) {
  const list = Array.isArray(thumbs) ? thumbs : [],
    enabled3 = String(src || '').trim();
  if (!enabled3 || !list.length) return;
  let next, box, ctx;
  const run2 = () => isCurrent?.(token) === true;
  try {
    ((next = document.createElement('video')),
      (next.muted = true),
      (next.playsInline = true),
      (next.crossOrigin = 'anonymous'),
      (next.preload = 'auto'),
      await attachVideoKeyingPlaybackSource(next, enabled3, 'auto'),
      await waitForLoadedMetadata(next));
    if (!run2()) return;
    const count = Number(readDurationSec?.(next) || 0);
    if (count > 0) onDuration?.(count);
    ((box = document.createElement('canvas')),
      (box.width = 120),
      (box.height = 68),
      (ctx = box.getContext('2d', { willReadFrequently: false })));
    if (!ctx) return;
    for (let current = 0; current < list.length; current += 1) {
      if (!run2()) return;
      const entry = (count * (current + 0.5)) / list.length;
      await seekTo(next, entry);
      if (!run2()) return;
      ctx.drawImage(next, 0, 0, box.width, box.height);
      const record = box.toDataURL('image/jpeg', 0.72),
        el4 = list[current];
      if (el4) el4.style.backgroundImage = 'url("' + record + '")';
    }
  } catch {
  } finally {
    next && (next.removeAttribute('src'), next.load?.());
    if (box) box.width = box.height = 0;
  }
}
