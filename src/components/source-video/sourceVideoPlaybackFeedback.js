import { startLoading, stopLoading } from '../../modules/loadingOverlay.js';
import { isMediaElementPlaybackSource } from '../../services/desktopMediaBlobSource.js';
import { playVideoWithRecovery } from '../video-node/mediaPlaybackRecovery.js';
const pendingPlayback = new WeakMap();
export function clearSourceVideoPlaybackFeedback(value) {
  const enabled = pendingPlayback['get'](value);
  if (!enabled) return;
  (pendingPlayback['delete'](value),
    enabled['card']?.['removeAttribute']?.('aria-busy'),
    stopLoading(enabled['card']));
}
export async function playSourceVideoWithFeedback(card, playbackIntent, shouldContinue) {
  const enabled2 = card['_ensureVideoElement']();
  if (!enabled2) return ![];
  (card['_attachPlaybackRecovery'](playbackIntent), clearSourceVideoPlaybackFeedback(card));
  const item = card['_currentSrc'],
    key = { card: card['_card'] };
  (!isMediaElementPlaybackSource(enabled2, item) || Number(enabled2['readyState'] || 0x0) < 0x2) &&
    (pendingPlayback['set'](card, key),
    key['card']?.['setAttribute']?.('aria-busy', 'true'),
    startLoading(key['card'], { variant: 'indeterminate' }));
  try {
    return await playVideoWithRecovery(enabled2, {
      label: card['_getPlaybackLabel'](playbackIntent),
      playbackIntent: playbackIntent,
      ensureSrc: () =>
        card['_ensurePlaybackVideoSrc']({
          forPlayback: !![],
          preload: playbackIntent === 'hover' ? 'metadata' : 'auto',
        }),
      minBufferAhead: playbackIntent === 'hover' ? 0.5 : undefined,
      readyTimeoutMs: playbackIntent === 'hover' ? 0x15e : undefined,
      recoveryDebounceMs: playbackIntent === 'hover' ? 0x96 : undefined,
      recoveryCooldownMs: playbackIntent === 'hover' ? 0x1f4 : undefined,
      shouldRecover: () =>
        card['_video']?.['isConnected'] !== ![] &&
        (card['_isHovered'] || card['_isManualControl'] || !card['_video']?.['paused']),
      shouldContinue: shouldContinue,
    });
  } finally {
    if (pendingPlayback['get'](card) === key) clearSourceVideoPlaybackFeedback(card);
  }
}
