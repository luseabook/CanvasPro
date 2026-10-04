import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from './desktopMediaBlobSource.js';
const DEFAULT_AUDIO_METADATA_TIMEOUT_MS = 0x1770;
export function normalizeAudioDurationSec(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
export function pickAudioDurationSec(...args) {
  for (const item of args) {
    const audioDurationSec = normalizeAudioDurationSec(item);
    if (audioDurationSec > 0) return audioDurationSec;
  }
  return 0;
}
function createAudioElement(handler) {
  if (typeof handler === 'function') return new handler();
  if (typeof Audio === 'function') return new Audio();
  return null;
}
export async function loadAudioDurationMetadataSec(key, index = {}) {
  const enabled = String(key || '').trim();
  if (!enabled) return 0;
  const el = createAudioElement(index.AudioCtor);
  if (!el) return 0;
  const result = Math.max(
    1,
    Number.isFinite(Number(index.timeoutMs)) ? Number(index.timeoutMs) : DEFAULT_AUDIO_METADATA_TIMEOUT_MS,
  );
  return await new Promise((handler2) => {
    let data = false,
      timer = null;
    const run = (options) => {
        if (data) return;
        data = true;
        if (timer !== null) clearTimeout(timer);
        (el.removeEventListener?.('loadedmetadata', target),
          el.removeEventListener?.('durationchange', target),
          el.removeEventListener?.('error', source));
        try {
          el.removeAttribute?.('src');
          if (!el.removeAttribute) el.src = '';
          (clearDesktopMediaPlaybackSourceMetadata(el), el.load?.());
        } catch {}
        handler2(normalizeAudioDurationSec(options));
      },
      target = () => {
        const audioDurationSec2 = normalizeAudioDurationSec(el.duration);
        if (audioDurationSec2 > 0) run(audioDurationSec2);
      },
      source = () => run(0);
    ((timer = setTimeout(() => run(0), result)), timer?.unref?.());
    try {
      ((el.preload = 'metadata'),
        el.addEventListener?.('loadedmetadata', target),
        el.addEventListener?.('durationchange', target),
        el.addEventListener?.('error', source),
        void attachMediaElementPlaybackSource(el, enabled, { preload: 'metadata' }).catch(() => {
          !String(el.getAttribute?.('src') || el.src || '').trim() && ((el.src = enabled), el.load?.());
        }));
    } catch {
      run(0);
    }
  });
}
export async function resolveAudioDurationSec(next, current, entry = {}) {
  const audioDurationSec3 = pickAudioDurationSec(next?.duration, next?.audioDuration);
  if (audioDurationSec3 > 0) return audioDurationSec3;
  return await loadAudioDurationMetadataSec(current, entry);
}
