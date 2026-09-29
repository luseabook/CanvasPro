import { startLoading, stopLoading } from '../../modules/loadingOverlay.js';
import { isMediaElementPlaybackSource } from '../../services/desktopMediaBlobSource.js';
import { playVideoWithRecovery } from '../video-node/mediaPlaybackRecovery.js';
const pendingPlayback = new WeakMap();
export function clearSourceVideoPlaybackFeedback(_0x2bc576) {
  const _0xe2e700 = pendingPlayback['get'](_0x2bc576);
  if (!_0xe2e700) return;
  (pendingPlayback['delete'](_0x2bc576),
    _0xe2e700['card']?.['removeAttribute']?.('aria-busy'),
    stopLoading(_0xe2e700['card']));
}
export async function playSourceVideoWithFeedback(_0x29c8b9, _0x3b289d, _0x414409) {
  const _0x32bbe7 = _0x29c8b9['_ensureVideoElement']();
  if (!_0x32bbe7) return ![];
  (_0x29c8b9['_attachPlaybackRecovery'](_0x3b289d), clearSourceVideoPlaybackFeedback(_0x29c8b9));
  const _0x123293 = _0x29c8b9['_currentSrc'],
    _0x1ed995 = { card: _0x29c8b9['_card'] };
  (!isMediaElementPlaybackSource(_0x32bbe7, _0x123293) || Number(_0x32bbe7['readyState'] || 0x0) < 0x2) &&
    (pendingPlayback['set'](_0x29c8b9, _0x1ed995),
    _0x1ed995['card']?.['setAttribute']?.('aria-busy', 'true'),
    startLoading(_0x1ed995['card'], { variant: 'indeterminate' }));
  try {
    return await playVideoWithRecovery(_0x32bbe7, {
      label: _0x29c8b9['_getPlaybackLabel'](_0x3b289d),
      playbackIntent: _0x3b289d,
      ensureSrc: () =>
        _0x29c8b9['_ensurePlaybackVideoSrc']({
          forPlayback: !![],
          preload: _0x3b289d === 'hover' ? 'metadata' : 'auto',
        }),
      minBufferAhead: _0x3b289d === 'hover' ? 0.5 : undefined,
      readyTimeoutMs: _0x3b289d === 'hover' ? 0x15e : undefined,
      recoveryDebounceMs: _0x3b289d === 'hover' ? 0x96 : undefined,
      recoveryCooldownMs: _0x3b289d === 'hover' ? 0x1f4 : undefined,
      shouldRecover: () =>
        _0x29c8b9['_video']?.['isConnected'] !== ![] &&
        (_0x29c8b9['_isHovered'] || _0x29c8b9['_isManualControl'] || !_0x29c8b9['_video']?.['paused']),
      shouldContinue: _0x414409,
    });
  } finally {
    if (pendingPlayback['get'](_0x29c8b9) === _0x1ed995) clearSourceVideoPlaybackFeedback(_0x29c8b9);
  }
}
