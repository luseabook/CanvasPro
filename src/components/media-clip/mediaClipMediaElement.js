import { attachMediaElementPlaybackSource } from '../../services/desktopMediaBlobSource.js';
import { firstNonEmpty, normalizeText } from './mediaClipUtils.js';
export function isRenderableUrl(value) {
  const text = normalizeText(value);
  return /^(?:https?:|data:|blob:|aic-local-preview:|\/)/i.test(text);
}
export function isUsableMediaElement(el) {
  if (!el) return false;
  try {
    const item = window.getComputedStyle(el);
    if (item.display === 'none' || item.visibility === 'hidden') return false;
    const count = Number(item.opacity);
    if (Number.isFinite(count) && count <= 0) return false;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) return false;
  } catch {}
  return true;
}
export function disposeMediaElement(enabled) {
  if (!enabled) return;
  try {
    enabled.pause?.();
  } catch {}
  try {
    (enabled.removeAttribute?.('src'), enabled.load?.());
  } catch {}
}
export function setMediaElementSource(preload, key) {
  if (!preload) return false;
  const text2 = normalizeText(key),
    nonEmpty = firstNonEmpty(
      preload.dataset?.desktopMediaSourceUrl,
      preload.dataset?.mediaClipSourceUrl,
      preload.getAttribute?.('src'),
      preload.currentSrc,
      preload.src,
    );
  if (!text2) {
    if (nonEmpty) disposeMediaElement(preload);
    return (
      preload.dataset &&
        (delete preload.dataset.desktopMediaSourceUrl, delete preload.dataset.mediaClipSourceUrl),
      false
    );
  }
  if (nonEmpty === text2) return false;
  try {
    preload.pause?.();
  } catch {}
  if (preload.dataset) preload.dataset.mediaClipSourceUrl = text2;
  const promise = attachMediaElementPlaybackSource(preload, text2, {
    preload: preload.preload || 'auto',
  }).catch(() => {
    if (!firstNonEmpty(preload.getAttribute?.('src'), preload.currentSrc, preload.src)) {
      preload.src = text2;
      try {
        preload.load?.();
      } catch {}
    }
    return firstNonEmpty(preload.getAttribute?.('src'), preload.currentSrc, preload.src);
  });
  return (
    (preload.__mediaClipSourcePromise = promise),
    void promise.finally(() => {
      preload.__mediaClipSourcePromise === promise && (preload.__mediaClipSourcePromise = null);
    }),
    true
  );
}
