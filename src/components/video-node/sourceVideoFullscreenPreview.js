import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from '../../services/desktopMediaBlobSource.js';
import {
  hasPresentedVideoFrame,
  resetVideoFramePresentation,
  watchVideoFramePresentation,
} from '../../services/videoFramePresentation.js';
import { claimVideoPlaybackOwnership, detachVideoPlaybackRecovery } from './mediaPlaybackRecovery.js';
import { resolveCanvasVideoUrl } from '../../services/canvasMediaLocalService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
function normalizeSource(value) {
  const enabled = String(value || '').trim();
  if (!enabled) return '';
  const url = localPathToUrl(enabled);
  return url || enabled;
}
function comparableSource(item) {
  const source = normalizeSource(item);
  if (!source) return '';
  try {
    return new URL(source, globalThis.location?.href || globalThis.window?.location?.href).href;
  } catch {
    return source;
  }
}
export function resolveSourceVideoFullscreenSources(options = {}, key = '') {
  const previewUrl2 = normalizeSource(key || resolveCanvasVideoUrl(options)),
    comparableSource2 = comparableSource(previewUrl2),
    index = [
      options?.originalLocalPath,
      options?.localPath,
      options?.videoLocalPath,
      options?.sourceLocalPath,
    ];
  let highResolutionUrl = '';
  for (const result of index) {
    const source2 = normalizeSource(result);
    if (!source2 || comparableSource(source2) === comparableSource2) continue;
    highResolutionUrl = source2;
    break;
  }
  return { previewUrl: previewUrl2, highResolutionUrl: highResolutionUrl };
}
function setPlaybackTime(data, target) {
  const next = Math.max(0, Number(target || 0));
  try {
    const count = Number(data?.duration || 0);
    data.currentTime =
      Number.isFinite(count) && count > 0 ? Math.min(next, Math.max(0, count - 0.001)) : next;
  } catch {}
}
function requestExclusivePlayback(el, label) {
  if (!el) return false;
  if (
    !claimVideoPlaybackOwnership(el, {
      label: label,
      minBufferAhead: 0.5,
      readyTimeoutMs: 350,
      recoveryDebounceMs: 150,
      recoveryCooldownMs: 500,
      shouldRecover: () => el.isConnected !== false && !el.paused,
    })
  )
    return false;
  try {
    const promise = el.play?.();
    promise?.catch?.(() => {});
  } catch {}
  return true;
}
export function openSourceVideoFullscreenPreview({
  nodeData: nodeData = {},
  previewUrl: previewUrl = '',
  previewPlaybackUrl: previewPlaybackUrl = '',
  currentTime: currentTime = 0,
  muted: muted = true,
  loop: loop = false,
  documentObject: documentObject = globalThis.document,
  attachSource: attachSource = attachMediaElementPlaybackSource,
  watchFrame: watchFrame = watchVideoFramePresentation,
  hasPresentedFrame: hasPresentedFrame = hasPresentedVideoFrame,
  resetFrame: resetFrame = resetVideoFramePresentation,
} = {}) {
  const sources = resolveSourceVideoFullscreenSources(nodeData, previewUrl);
  if (!sources.previewUrl || !documentObject?.body) return null;
  const overlay = documentObject.createElement('div');
  overlay.classList.add('source-video-fullscreen-overlay', 'is-loading');
  let enabled2 = false;
  const stage = documentObject.createElement('div');
  stage.classList.add('source-video-fullscreen-stage');
  const previewVideo = documentObject.createElement('video');
  (previewVideo.classList.add('source-video-fullscreen-media', 'is-active'),
    (previewVideo.controls = true),
    (previewVideo.loop = loop === true),
    (previewVideo.muted = !!muted),
    (previewVideo.playsInline = true),
    (previewVideo.preload = 'auto'),
    setPlaybackTime(previewVideo, currentTime),
    previewVideo.addEventListener?.('loadedmetadata', () => {
      setPlaybackTime(previewVideo, currentTime);
    }));
  const run = () => {
      if (enabled2) return;
      overlay.classList.remove('is-loading', 'is-error');
    },
    handler = () => {
      if (enabled2) return;
      (overlay.classList.remove('is-loading'), overlay.classList.add('is-error'));
    },
    current = () => run();
  let enabled3 = false;
  const entry = () => {
    if (!enabled2 && !enabled3 && normalizeSource(previewPlaybackUrl)) {
      ((enabled3 = true),
        overlay.classList.add('is-loading'),
        overlay.classList.remove('is-error'),
        run2(previewVideo),
        void run3('').catch(handler));
      return;
    }
    handler();
  };
  (previewVideo.addEventListener?.('loadeddata', current),
    previewVideo.addEventListener?.('canplay', current),
    previewVideo.addEventListener?.('playing', current),
    previewVideo.addEventListener?.('error', entry));
  let highResolutionVideo = null;
  sources.highResolutionUrl &&
    ((highResolutionVideo = documentObject.createElement('video')),
    highResolutionVideo.classList.add('source-video-fullscreen-media'),
    (highResolutionVideo.controls = false),
    (highResolutionVideo.loop = loop === true),
    (highResolutionVideo.muted = !!muted),
    (highResolutionVideo.playsInline = true),
    (highResolutionVideo.preload = 'auto'),
    setPlaybackTime(highResolutionVideo, currentTime),
    stage.appendChild(highResolutionVideo));
  (stage.appendChild(previewVideo),
    overlay.appendChild(stage),
    documentObject.body.appendChild(overlay));
  const run2 = (enabled4) => {
      if (!enabled4) return;
      (clearDesktopMediaPlaybackSourceMetadata(enabled4), enabled4.removeAttribute?.('src'));
      try {
        enabled4.load?.();
      } catch {}
    },
    close = () => {
      if (enabled2) return;
      enabled2 = true;
      try {
        previewVideo.pause?.();
      } catch {}
      try {
        highResolutionVideo?.pause?.();
      } catch {}
      (detachVideoPlaybackRecovery(previewVideo),
        detachVideoPlaybackRecovery(highResolutionVideo),
        resetFrame(highResolutionVideo),
        previewVideo.removeEventListener?.('loadeddata', current),
        previewVideo.removeEventListener?.('canplay', current),
        previewVideo.removeEventListener?.('playing', current),
        previewVideo.removeEventListener?.('error', entry),
        run2(previewVideo),
        run2(highResolutionVideo),
        documentObject.removeEventListener?.('keydown', record, true),
        overlay.remove?.());
    },
    record = (event) => {
      if (event?.key !== 'Escape') return;
      (event.preventDefault?.(), event.stopPropagation?.(), close());
    };
  (overlay.addEventListener('click', (event2) => {
    if (event2.target === overlay) close();
  }),
    documentObject.addEventListener?.('keydown', record, true));
  function run3(payload = '') {
    const playbackUrl = normalizeSource(payload);
    return Promise.resolve(
      attachSource(previewVideo, sources.previewUrl, {
        ...(playbackUrl ? { playbackUrl: playbackUrl } : {}),
        preload: 'auto',
        load: true,
        shouldAssign: () => !enabled2,
      }),
    ).then(() => {
      if (enabled2) return false;
      return (
        setPlaybackTime(previewVideo, currentTime),
        requestExclusivePlayback(previewVideo, 'source-video:fullscreen:preview'),
        true
      );
    });
  }
  void run3(previewPlaybackUrl).catch(() => {
    if (enabled2) return;
    if (!enabled3 && normalizeSource(previewPlaybackUrl)) {
      ((enabled3 = true), run2(previewVideo), void run3('').catch(handler));
      return;
    }
    handler();
  });
  if (highResolutionVideo) {
    const el2 = highResolutionVideo;
    let watchFrame2 = false;
    const handle = () => {
        if (enabled2 || !hasPresentedFrame(el2, sources.highResolutionUrl)) return;
        const state = Number(previewVideo.currentTime || 0),
          config = Number(el2.currentTime || 0);
        if (Math.abs(state - config) > 0.25) {
          (resetFrame(el2), setPlaybackTime(el2, state), watchFrame(el2, handle));
          return;
        }
        const scope = previewVideo.paused === false;
        ((el2.controls = true),
          (el2.muted = previewVideo.muted),
          el2.classList.add('is-active'),
          previewVideo.classList.remove('is-active'));
        scope && requestExclusivePlayback(el2, 'source-video:fullscreen:original');
        try {
          previewVideo.pause?.();
        } catch {}
      },
      onSourceAssigned = () => {
        watchFrame2 = watchFrame(el2, handle) || watchFrame2;
      };
    (el2.addEventListener?.('loadedmetadata', () => {
      setPlaybackTime(el2, previewVideo.currentTime || currentTime);
    }),
      void Promise.resolve(
        attachSource(el2, sources.highResolutionUrl, {
          preload: 'auto',
          load: true,
          onSourceAssigned: onSourceAssigned,
          shouldAssign: () => !enabled2,
        }),
      )
        .then(() => {
          if (enabled2) return;
          if (!watchFrame2) onSourceAssigned();
        })
        .catch(() => {}));
  }
  return {
    overlay: overlay,
    stage: stage,
    previewVideo: previewVideo,
    highResolutionVideo: highResolutionVideo,
    close: close,
    sources: sources,
  };
}
