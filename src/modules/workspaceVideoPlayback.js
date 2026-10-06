import {
  attachVideoPlaybackRecovery,
  playVideoWithRecovery,
} from '../components/video-node/mediaPlaybackRecovery.js';
import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
import {
  acquireLocalVideoPlaybackObjectUrl,
  releaseLocalVideoPlaybackObjectUrlOwner,
} from '../services/localVideoPlaybackObjectUrlService.js';
function normalizeText(value) {
  return String(value || '').trim();
}
function requestWorkspaceVideoProgressFrame(item) {
  const key = globalThis.window?.requestAnimationFrame || globalThis.requestAnimationFrame;
  if (typeof key === 'function') return key.call(globalThis.window || globalThis, item);
  return setTimeout(item, 16);
}
function cancelWorkspaceVideoProgressFrame(index) {
  const result = globalThis.window?.cancelAnimationFrame || globalThis.cancelAnimationFrame;
  if (typeof result === 'function') {
    result.call(globalThis.window || globalThis, index);
    return;
  }
  clearTimeout(index);
}
export function createWorkspaceVideoProgressLoop({
  videoEl: videoEl,
  onFrame: onFrame,
  requestFrame: requestFrame = requestWorkspaceVideoProgressFrame,
  cancelFrame: cancelFrame = cancelWorkspaceVideoProgressFrame,
} = {}) {
  if (!videoEl || typeof onFrame !== 'function')
    throw new Error('workspace video progress loop requires videoEl and onFrame');
  let data = false,
    requestFrame2 = null;
  const stop = () => {
      if (requestFrame2 == null) return;
      (cancelFrame(requestFrame2), (requestFrame2 = null));
    },
    options = () => {
      requestFrame2 = null;
      if (data) return;
      onFrame();
      if (videoEl.paused || videoEl.ended) return;
      requestFrame2 = requestFrame(options);
    };
  return {
    start() {
      if (data || requestFrame2 != null || videoEl.paused || videoEl.ended) return;
      requestFrame2 = requestFrame(options);
    },
    stop: stop,
    destroy() {
      if (data) return;
      ((data = true), stop());
    },
  };
}
export function createWorkspaceVideoPlayback({
  videoEl: videoEl2,
  sourceUrl: sourceUrl,
  ownerId: ownerId,
  acquirePlaybackUrl: acquirePlaybackUrl = acquireLocalVideoPlaybackObjectUrl,
  releasePlaybackUrlOwner: releasePlaybackUrlOwner = releaseLocalVideoPlaybackObjectUrlOwner,
  attachSource: attachSource = attachMediaElementPlaybackSource,
  attachRecovery: attachRecovery = attachVideoPlaybackRecovery,
  playWithRecovery: playWithRecovery = playVideoWithRecovery,
  allowConcurrentPlayback: allowConcurrentPlayback = false,
  preferStreamingSource: preferStreamingSource = false,
  acquirePlaybackOptions: acquirePlaybackOptions = undefined,
  diagnosticsLabel: diagnosticsLabel = '',
} = {}) {
  if (!videoEl2) throw new Error('workspace video playback requires videoEl');
  const text = normalizeText(sourceUrl),
    text2 = normalizeText(ownerId);
  if (!text || !text2) throw new Error('workspace video playback requires sourceUrl and ownerId');
  const label = normalizeText(diagnosticsLabel) || 'workspace-video:' + text2;
  let enabled = false,
    target = null;
  const run = () => {
    let allowConcurrent = false;
    try {
      allowConcurrent =
        typeof allowConcurrentPlayback === 'function'
          ? allowConcurrentPlayback() === true
          : allowConcurrentPlayback === true;
    } catch {}
    return {
      label: label,
      ensureSrc: () => run2({ load: true }),
      shouldContinue: () => !enabled,
      shouldRecover: () => !enabled && videoEl2.isConnected !== false && videoEl2.paused === false,
      allowConcurrent: allowConcurrent,
    };
  };
  async function run2({ load: load = false } = {}) {
    if (enabled) return false;
    if (normalizeText(videoEl2.getAttribute?.('src') || videoEl2.src))
      return ((videoEl2.preload = 'auto'), true);
    if (preferStreamingSource === true) {
      if (target) return target;
      target = (async () => {
        return (
          await attachSource(videoEl2, text, {
            preload: 'auto',
            load: load,
            shouldAssign: () => !enabled,
          }),
          !enabled && !!normalizeText(videoEl2.getAttribute?.('src') || videoEl2.src)
        );
      })();
      const enabled2 = await target;
      if (!enabled2 && !enabled) target = null;
      return enabled2;
    }
    if (target) return target;
    target = (async () => {
      let playbackUrl = '';
      try {
        playbackUrl = normalizeText(await acquirePlaybackUrl(text, text2, acquirePlaybackOptions));
      } catch {}
      if (enabled) return false;
      return (
        await attachSource(videoEl2, text, {
          ...(playbackUrl ? { playbackUrl: playbackUrl } : {}),
          preload: 'auto',
          load: load,
          shouldAssign: () => !enabled,
        }),
        !enabled && !!normalizeText(videoEl2.getAttribute?.('src') || videoEl2.src)
      );
    })();
    const enabled3 = await target;
    if (!enabled3 && !enabled) target = null;
    return enabled3;
  }
  return {
    warm() {
      return run2({ load: true });
    },
    play() {
      if (enabled) return Promise.resolve(false);
      const source = run(),
        text3 = normalizeText(videoEl2.getAttribute?.('src') || videoEl2.src);
      if (!text3) return playWithRecovery(videoEl2, source);
      ((videoEl2.preload = 'auto'), attachRecovery(videoEl2, source));
      try {
        const next = videoEl2.play?.();
        return Promise.resolve(next).then(
          () =>
            playWithRecovery(videoEl2, source).then(
              () => true,
              () => true,
            ),
          () => playWithRecovery(videoEl2, source),
        );
      } catch {
        return playWithRecovery(videoEl2, source);
      }
    },
    destroy() {
      if (enabled) return;
      enabled = true;
      try {
        videoEl2.pause?.();
      } catch {}
      releasePlaybackUrlOwner(text2);
    },
  };
}
