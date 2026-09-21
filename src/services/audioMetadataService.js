import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from './desktopMediaBlobSource.js';
const DEFAULT_AUDIO_METADATA_TIMEOUT_MS = 0x1770;
export function normalizeAudioDurationSec(_0x516031) {
  const _0x101465 = Number(_0x516031);
  return Number.isFinite(_0x101465) && _0x101465 > 0 ? _0x101465 : 0;
}
export function pickAudioDurationSec(..._0x473bcf) {
  for (const _0x13e0c8 of _0x473bcf) {
    const _0x4ee1dc = normalizeAudioDurationSec(_0x13e0c8);
    if (_0x4ee1dc > 0) return _0x4ee1dc;
  }
  return 0;
}
function createAudioElement(_0x5478fb) {
  if (typeof _0x5478fb === 'function') return new _0x5478fb();
  if (typeof Audio === 'function') return new Audio();
  return null;
}
export async function loadAudioDurationMetadataSec(_0x5e18e5, _0x288783 = {}) {
  const _0x1a28e2 = String(_0x5e18e5 || '').trim();
  if (!_0x1a28e2) return 0;
  const _0x3546be = createAudioElement(_0x288783.AudioCtor);
  if (!_0x3546be) return 0;
  const _0x198a7a = Math.max(
    1,
    Number.isFinite(Number(_0x288783.timeoutMs))
      ? Number(_0x288783.timeoutMs)
      : DEFAULT_AUDIO_METADATA_TIMEOUT_MS,
  );
  return await new Promise((_0x577774) => {
    let _0x35cb8e = false,
      _0xbfe428 = null;
    const _0x562995 = (_0x14e0e1) => {
        if (_0x35cb8e) return;
        _0x35cb8e = true;
        if (_0xbfe428 !== null) clearTimeout(_0xbfe428);
        (_0x3546be.removeEventListener?.('loadedmetadata', _0x1186aa),
          _0x3546be.removeEventListener?.('durationchange', _0x1186aa),
          _0x3546be.removeEventListener?.('error', _0x40d088));
        try {
          _0x3546be.removeAttribute?.('src');
          if (!_0x3546be.removeAttribute) _0x3546be.src = '';
          (clearDesktopMediaPlaybackSourceMetadata(_0x3546be), _0x3546be.load?.());
        } catch {}
        _0x577774(normalizeAudioDurationSec(_0x14e0e1));
      },
      _0x1186aa = () => {
        const _0x38ae8c = normalizeAudioDurationSec(_0x3546be.duration);
        if (_0x38ae8c > 0) _0x562995(_0x38ae8c);
      },
      _0x40d088 = () => _0x562995(0);
    ((_0xbfe428 = setTimeout(() => _0x562995(0), _0x198a7a)), _0xbfe428?.unref?.());
    try {
      ((_0x3546be.preload = 'metadata'),
        _0x3546be.addEventListener?.('loadedmetadata', _0x1186aa),
        _0x3546be.addEventListener?.('durationchange', _0x1186aa),
        _0x3546be.addEventListener?.('error', _0x40d088),
        void attachMediaElementPlaybackSource(_0x3546be, _0x1a28e2, { preload: 'metadata' }).catch(() => {
          !String(_0x3546be.getAttribute?.('src') || _0x3546be.src || '').trim() &&
            ((_0x3546be.src = _0x1a28e2), _0x3546be.load?.());
        }));
    } catch {
      _0x562995(0);
    }
  });
}
export async function resolveAudioDurationSec(_0x36ea37, _0x334fa9, _0x118fe2 = {}) {
  const _0x2f2294 = pickAudioDurationSec(_0x36ea37?.duration, _0x36ea37?.audioDuration);
  if (_0x2f2294 > 0) return _0x2f2294;
  return await loadAudioDurationMetadataSec(_0x334fa9, _0x118fe2);
}
